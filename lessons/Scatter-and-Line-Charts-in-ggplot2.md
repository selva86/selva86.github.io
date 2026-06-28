---
title: "ggplot2 Lesson 2: Scatter & Line Charts"
catalog_blurb: "Show relationships and trends over time."
description: "geom_point and geom_line in ggplot2: when to use each, mapping a third variable to colour and size, and adding a least-squares trend line that summarises the cloud."
keywords: "ggplot2 scatter plot, geom_point, geom_line, geom_smooth, trend line in R, aes colour size, line chart in R, scatterplot in R, ggplot2 tutorial"
post_type: "LESSON"
curriculum_id: "2.4.2"
webr: true
mathjax: true
lesson_access: "free"
course_id: "da-ggplot"
course_title: "Data Visualization with ggplot2"
course_lesson: "2"
course_total: "4"
course_landing: "ggplot2-Course.html"
course_next: "Bar-and-Distribution-Charts-in-ggplot2.html"
course_prev: "The-Grammar-of-Graphics.html"
---

=== step === cover
::eyebrow Lesson 2 of 4
## Scatter & Line Charts
Maya the bakery owner has a new question. Through one warm fortnight she wrote down, for each of 14 days, the daily high **temperature** and the number of **iced coffees** she sold. She suspects hot days sell more iced coffee, but a column of numbers will not tell her. The moment she plots temperature against sales, the answer leans off the page.

In Lesson 1 you learned the grammar: **data**, an **aesthetic mapping** inside `aes()`, and a **geom** added with `+`. Now you put it to work with the two geoms you will reach for most.

By the end of this lesson you will be able to:

- Choose `geom_point` (a scatter) or `geom_line` for a given question, and say why
- Map a **third** variable to colour and to size to pack more into one chart
- Add a trend line with `geom_smooth()` that summarises the whole cloud in one stroke

**Prerequisites:** [Lesson 1, the grammar of graphics](The-Grammar-of-Graphics.html) (data, `aes()` mappings, geoms, layering with `+`). Every new term is defined as it appears.

::widget chart-plotter {"data":[{"x":19,"y":45},{"x":22,"y":52},{"x":20,"y":44},{"x":24,"y":66},{"x":26,"y":78},{"x":25,"y":92},{"x":23,"y":82},{"x":28,"y":96},{"x":30,"y":112},{"x":27,"y":90},{"x":31,"y":120},{"x":29,"y":104},{"x":33,"y":145},{"x":30,"y":126}],"geoms":["point"],"x":"temp_c","y":"iced_coffees","code":{"point":"ggplot(maya, aes(temp_c, iced_coffees)) +\n  geom_point()"}}

=== step === concept
::eyebrow The workhorse
## The scatter: one point per row

A **scatterplot** answers one precise question: *how do two continuous measurements move together?* You map one to `x`, the other to `y`, and `geom_point()` draws exactly one dot per row at its (x, y) spot. Fourteen days become fourteen dots, and the shape of the cloud is the relationship.

Each lesson runs in a fresh R session, so build Maya's fortnight right here (run this once):

```r
library(ggplot2)
maya <- data.frame(
  day          = c("Mon","Tue","Wed","Thu","Fri","Sat","Sun",
                   "Mon","Tue","Wed","Thu","Fri","Sat","Sun"),
  day_num      = 1:14,
  temp_c       = c(19,22,20,24,26,25,23,28,30,27,31,29,33,30), # daily high, Celsius
  iced_coffees = c(45,52,44,66,78,92,82,96,112,90,120,104,145,126),
  day_type     = c("weekday","weekday","weekday","weekday","weekday","weekend","weekend",
                   "weekday","weekday","weekday","weekday","weekday","weekend","weekend"),
  foot_traffic = c(120,132,118,150,168,230,210,175,190,165,198,180,250,224)
)
head(maya)
```

Now the scatter is the grammar from Lesson 1 with `geom_point()` as the geom:

```r
ggplot(maya, aes(x = temp_c, y = iced_coffees)) +
  geom_point(size = 3, colour = "steelblue")
```

The dots climb from lower-left to upper-right: hotter days sold more iced coffee. The widget below reports **Pearson's r**, a single number from \(-1\) to \(+1\) that measures how tightly the dots hug a straight line (you will study r in depth in [correlation analysis](Correlation-in-R.html); here it just confirms what your eye sees).

::widget chart-plotter {"data":[{"x":19,"y":45},{"x":22,"y":52},{"x":20,"y":44},{"x":24,"y":66},{"x":26,"y":78},{"x":25,"y":92},{"x":23,"y":82},{"x":28,"y":96},{"x":30,"y":112},{"x":27,"y":90},{"x":31,"y":120},{"x":29,"y":104},{"x":33,"y":145},{"x":30,"y":126}],"geoms":["point"],"x":"temp_c","y":"iced_coffees","code":{"point":"ggplot(maya, aes(temp_c, iced_coffees)) +\n  geom_point()"}}

=== step === concept
::eyebrow The other workhorse
## The line: a value along an ordered axis

Swap the question. Instead of *temperature versus sales*, Maya now asks *how did sales move across the fortnight?* The x axis is no longer a measurement, it is **time**: day 1, then day 2, then day 3, in order. When x has a natural order, a **line** is the right geom, because connecting the dots traces the path the value took.

Map `day_num` to x and add `geom_line()`:

```r
ggplot(maya, aes(x = day_num, y = iced_coffees)) +
  geom_line()
```

The line walks left to right and you read the journey: a gentle climb with two sharp weekend peaks at days 6, 7 and 13, 14. Toggle the widget between **line** and **point**: the same dots, but only the line shows the trajectory from one day to the next.

::widget chart-plotter {"data":[{"x":1,"y":45},{"x":2,"y":52},{"x":3,"y":44},{"x":4,"y":66},{"x":5,"y":78},{"x":6,"y":92},{"x":7,"y":82},{"x":8,"y":96},{"x":9,"y":112},{"x":10,"y":90},{"x":11,"y":120},{"x":12,"y":104},{"x":13,"y":145},{"x":14,"y":126}],"geoms":["line","point"],"x":"day_num","y":"iced_coffees","code":{"line":"ggplot(maya, aes(day_num, iced_coffees)) +\n  geom_line()","point":"ggplot(maya, aes(day_num, iced_coffees)) +\n  geom_point()"}}

[WARNING]
A line only makes sense when x has a meaningful order, usually time or a sequence. Draw `geom_line()` against an unordered x like temperature and ggplot still connects the dots, but the resulting zigzag is nonsense: it implies the value travelled from one temperature straight to the next, which never happened.

=== step === quiz
::eyebrow Check yourself
## Which geom fits?

Maya wants to show whether **higher foot traffic** tends to come with **higher revenue**, two measurements taken on the same days, with no time order between them. Which geom should she reach for?

::quiz {"correct":1,"gate":true,"difficulty":"beginner"}
- `geom_point()`: a scatter shows how two continuous measurements relate ::ok Right. There is no order to walk along here, just two measurements per day, so a scatter is exactly the tool. A line would invent a journey that does not exist.
- `geom_line()`: both columns are numbers, so connect them ::no Both being numeric is not the test. A line implies x is ordered (time or a sequence) and that connecting points has meaning. Foot traffic has no such order, so a line would draw a misleading zigzag. Use `geom_point()`.
- `geom_line()`, because it is the default for two numeric columns ::no ggplot has no such default, and the deciding question is whether x is ordered. It is not here, so `geom_point()` is right.

=== step === concept
::eyebrow More in one chart
## A third variable: colour and size

A scatter shows two variables. To pack in a **third**, map it to another visual channel inside `aes()`, exactly the move from Lesson 1: anything inside `aes()` is *mapped to a column* (and earns a legend); anything outside it is a *constant you set by hand*.

Map a **category** to `colour` and each group gets its own colour. Here `day_type` (weekday vs weekend) splits the cloud, and you can see the weekend days sit above the weekday trend, hot or not:

```r
ggplot(maya, aes(x = temp_c, y = iced_coffees, colour = day_type)) +
  geom_point(size = 3)
```

Map a **continuous** column to `size` and each point swells with its value, a "bubble chart". Here bigger dots are busier days:

```r
ggplot(maya, aes(x = temp_c, y = iced_coffees, size = foot_traffic)) +
  geom_point(alpha = 0.6)
```

[WARNING]
Every channel you add costs the reader effort. Colour for one category, or size for one amount, sharpens a chart; piling colour AND size AND shape onto one scatter usually buries the story. Add a channel only when it answers a question you actually have.

::widget chart-plotter {"data":[{"x":19,"y":45,"fill":"weekday"},{"x":22,"y":52,"fill":"weekday"},{"x":20,"y":44,"fill":"weekday"},{"x":24,"y":66,"fill":"weekday"},{"x":26,"y":78,"fill":"weekday"},{"x":25,"y":92,"fill":"weekend"},{"x":23,"y":82,"fill":"weekend"},{"x":28,"y":96,"fill":"weekday"},{"x":30,"y":112,"fill":"weekday"},{"x":27,"y":90,"fill":"weekday"},{"x":31,"y":120,"fill":"weekday"},{"x":29,"y":104,"fill":"weekday"},{"x":33,"y":145,"fill":"weekend"},{"x":30,"y":126,"fill":"weekend"}],"geoms":["point"],"x":"temp_c","y":"iced_coffees","code":{"point":"ggplot(maya, aes(temp_c, iced_coffees, colour = day_type)) +\n  geom_point()"}}

=== step === quiz
::eyebrow Check yourself
## Where does it go?

Maya wants each point coloured by `day_type` so weekends stand out, with a legend telling the reader which colour is which. Which line does that?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- `geom_point(colour = day_type)`, putting it in the geom outside `aes()` ::no Outside `aes()`, `colour` is a constant you set by hand, and `colour = day_type` is not a real colour name, so this errors. To vary colour BY a column, the mapping must live inside `aes()`.
- `aes(x = temp_c, y = iced_coffees, colour = day_type)`, mapping colour inside `aes()` ::ok Exactly. Inside `aes()`, ggplot maps `colour` to the `day_type` column: one colour per group, plus the legend, automatically.
- Set `colour = "weekend"` in the geom ::no That paints every single point one fixed colour and groups nothing. Mapping to the column inside `aes()` is what splits weekday from weekend and builds the legend.

=== step === concept
::eyebrow Summarise the cloud
## Add a trend line

Fourteen dots show a rising relationship, but the eye wants one clean line through the middle to say *how fast* sales rise with temperature. That is `geom_smooth()`, added as its own layer on the same data and mapping:

```r
ggplot(maya, aes(x = temp_c, y = iced_coffees)) +
  geom_point(size = 3, colour = "steelblue") +
  geom_smooth(method = "lm", se = FALSE)   # a straight-line ("lm") fit, no shaded band
```

**The intuition:** the line is the single straight path that sits closest to all the dots at once. **The formalism:** with `method = "lm"` it is the *least-squares* line

\[ \hat{y} = \beta_0 + \beta_1 x \]

where \(x\) is temperature, \(\hat{y}\) (read "y-hat") is the predicted iced-coffee count, \(\beta_0\) (the **intercept**) is where the line meets the y axis, and \(\beta_1\) (the **slope**) is how many extra iced coffees each additional degree buys. R picks the \(\beta_0,\beta_1\) that make the total squared vertical gap between dots and line as small as possible:

\[ \min_{\beta_0,\beta_1}\ \sum_{i=1}^{n} \bigl(y_i - \hat{y}_i\bigr)^2 \]

Each \(y_i\) is a day's actual sales, \(\hat{y}_i\) is the line's prediction for that day, and the gap \(y_i-\hat{y}_i\) is the **residual**. Squaring keeps positives and negatives from cancelling and punishes big misses hardest. Read the exact numbers with `lm()`:

```r
coef(lm(iced_coffees ~ temp_c, data = maya))
```

The `temp_c` coefficient is the slope, about 7: each extra degree of temperature sells roughly seven more iced coffees. The widget shows the same cloud and its Pearson r; `geom_smooth()` turns that relationship into a line you can read a slope off.

[WARNING]
`method = "lm"` assumes the relationship is a straight line. If the cloud bends, a straight fit misleads; use `geom_smooth(method = "loess")` for a flexible curve that follows the data's shape.

::widget chart-plotter {"data":[{"x":19,"y":45},{"x":22,"y":52},{"x":20,"y":44},{"x":24,"y":66},{"x":26,"y":78},{"x":25,"y":92},{"x":23,"y":82},{"x":28,"y":96},{"x":30,"y":112},{"x":27,"y":90},{"x":31,"y":120},{"x":29,"y":104},{"x":33,"y":145},{"x":30,"y":126}],"geoms":["point"],"x":"temp_c","y":"iced_coffees","code":{"point":"ggplot(maya, aes(temp_c, iced_coffees)) +\n  geom_point() +\n  geom_smooth(method = \"lm\")"}}

=== step === tryit
::eyebrow Your turn
## Draw the trend

You have the scatter below. Add a second layer that draws the straight-line (`lm`) trend through the cloud, with no shaded error band. Fill in the blank.

```r
ggplot(maya, aes(x = temp_c, y = iced_coffees)) +
  geom_point(size = 3) +
  ____
```
::check {"regex":"geom_smooth\\s*\\(\\s*method\\s*=\\s*[\"']lm[\"']","gate":true,"difficulty":"intermediate","ok":"That lays the least-squares line over the points: data, mapping, two geoms stacked with +.","no":"Add geom_smooth(method = \"lm\", se = FALSE) as the next layer (method = \"lm\" gives the straight-line fit)."}
::solution
```r
ggplot(maya, aes(x = temp_c, y = iced_coffees)) +
  geom_point(size = 3) +
  geom_smooth(method = "lm", se = FALSE)
```

=== step === concept
::eyebrow When it breaks
## Two traps to dodge

Two mistakes catch almost everyone, and both have a one-line fix.

**Overplotting.** With many rows, dots land on top of dots and a black blob hides how many points are really there. Make points semi-transparent with `alpha` (so stacked dots darken) or spread ties apart with `geom_jitter()`:

```r
ggplot(maya, aes(x = temp_c, y = iced_coffees)) +
  geom_point(alpha = 0.4)   # 0 = invisible, 1 = solid; overlaps now read as darker
```

**A line over an unordered x.** As you saw, `geom_line()` only tells the truth when x is ordered. For temperature-versus-sales there is no order to walk along, so stay with `geom_point()` and add `geom_smooth()` for the trend, never `geom_line()`.

[TIP]
A quick rule of thumb: reach for a **line** when the x axis is time or a sequence and you care about the journey; reach for a **scatter** (points, plus a smooth) when x is a measurement and you care about the relationship.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [ggplot2 reference: geom_point()](https://ggplot2.tidyverse.org/reference/geom_point.html) - every argument of the scatter geom, with overplotting notes (alpha, jitter).
- [ggplot2 reference: geom_line() / geom_path()](https://ggplot2.tidyverse.org/reference/geom_path.html) - how line geoms order and connect points, and when to use each.
- [ggplot2 reference: geom_smooth()](https://ggplot2.tidyverse.org/reference/geom_smooth.html) - the trend-line layer, the lm vs loess methods, and the standard-error band.
- [R for Data Science (2e): Data visualisation](https://r4ds.hadley.nz/data-visualize) - a gentle hands-on tour of points, lines, colour, size and smooths, with exercises.

=== step === complete
## Lesson 2 complete

You can now pick the right geom on purpose: `geom_point()` for the relationship between two continuous variables, `geom_line()` for one value moving along an ordered axis like time. You mapped a third variable to colour and size to pack more into a single chart, added a least-squares trend line with `geom_smooth(method = "lm")` and read its slope, and learned to dodge overplotting and the unordered-x line trap.

Next, Lesson 3: Bar and distribution charts. You will use `geom_col()` and `geom_bar()` for counts and amounts, and histograms and boxplots to show how a single variable is spread, and learn exactly which question each one answers.
