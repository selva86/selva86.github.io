---
title: "ggplot2 Lesson 3: Bar & Distribution Charts"
description: "geom_col and geom_bar for counts and amounts, geom_histogram for the shape of one variable, and geom_boxplot to compare groups: which ggplot2 chart answers which question."
keywords: "ggplot2 bar chart, geom_col, geom_bar, geom_histogram, geom_boxplot, histogram in R, boxplot in R, distribution plot, ggplot2 tutorial, count vs amount"
post_type: "LESSON"
curriculum_id: "2.4.3"
webr: true
mathjax: true
lesson_access: "free"
course_id: "da-ggplot"
course_title: "Data Visualization with ggplot2"
course_lesson: "3"
course_total: "4"
course_landing: "ggplot2-Course.html"
course_next: "A-ggplot2-Gallery-and-Publication-Figures.html"
course_prev: "Scatter-and-Line-Charts-in-ggplot2.html"
---

=== step === cover
::eyebrow Lesson 3 of 4
## Bars and distributions

It is Saturday and Maya the bakery owner has logged every order, 30 of them, into a little table: the headline item the customer came for, what they spent, and whether it was the morning rush or a quiet afternoon. Two questions are nagging her. *Which pastry is pulling its weight?* and *what does a typical order actually look like?* A scatter or a line, the charts from Lesson 2, answer neither. These questions need bars and distributions.

In Lesson 2 you used `geom_point()` for a relationship and `geom_line()` for a value moving through time. Now you meet the charts that compare categories and reveal the shape of a single column of numbers.

By the end of this lesson you will be able to:

- Use `geom_col()` to compare an amount across categories, and `geom_bar()` to compare counts, and say exactly which one does the counting
- Draw a **histogram** with `geom_histogram()` to see how one continuous variable is spread, and choose a sensible bin width
- Read and draw a **boxplot** with `geom_boxplot()` to compare a distribution across groups
- Match a question to the chart that answers it

**Prerequisites:** [Lesson 1, the grammar of graphics](The-Grammar-of-Graphics.html) (data, `aes()`, geoms, layering with `+`) and [Lesson 2, scatter and line charts](Scatter-and-Line-Charts-in-ggplot2.html). Every new term is defined as it appears.

::widget chart-plotter {"data":[{"x":"Coffee","y":72},{"x":"Croissant","y":64},{"x":"Muffin","y":56},{"x":"Sourdough","y":76}],"geoms":["bar"],"x":"pastry","y":"revenue","code":{"bar":"ggplot(by_pastry, aes(pastry, revenue)) +\n  geom_col()"}}

=== step === concept
::eyebrow The workhorse for categories
## Bars compare categories

A **bar chart** answers one question: *how do categories compare on some number?* Each category gets its own bar, and the bar's height is the number. Maya's pastries are the categories; the dollars each one earned is the number.

Start, as always, by building Maya's Saturday right here. Each lesson runs in a fresh R session, so the data lives on this page (run this once):

```r
library(ggplot2)
orders <- data.frame(
  pastry = c("Coffee","Coffee","Croissant","Coffee","Muffin",
             "Croissant","Coffee","Sourdough","Croissant","Muffin",
             "Coffee","Sourdough","Croissant","Coffee","Muffin",
             "Coffee","Coffee","Croissant","Coffee","Muffin",
             "Coffee","Croissant","Coffee","Muffin","Coffee",
             "Sourdough","Croissant","Coffee","Muffin","Coffee"),
  order_value = c(5,4,8,6,9, 11,5,24,12,10, 7,30,9,6,13,
                  4,5,7,4,8, 6,9,5,7,4, 22,8,5,9,6),  # dollars per order
  daypart = c(rep("Morning",15), rep("Afternoon",15))
)
head(orders)
```

Maya already knows her per-pastry revenue is worth plotting, so first she totals it up, one row per pastry, with the `dplyr` verbs from earlier in the course:

```r
library(dplyr)
by_pastry <- orders %>%
  group_by(pastry) %>%
  summarise(orders = n(), revenue = sum(order_value))
by_pastry
#> # A tibble: 4 x 3
#>   pastry    orders revenue
#>   <chr>      <int>   <dbl>
#> 1 Coffee        14      72
#> 2 Croissant      7      64
#> 3 Muffin         6      56
#> 4 Sourdough      3      76
```

Now `revenue` is an **amount she already has**, one value per category. The geom that draws a bar at a height you supply is `geom_col()` ("col" for column): map `pastry` to `x` and `revenue` to `y`, and it does no arithmetic, it just draws your numbers.

```r
ggplot(by_pastry, aes(x = pastry, y = revenue)) +
  geom_col()
```

The bars rank the pastries by money. Sourdough wins, on only 3 orders, while Coffee, ordered far more often, comes second. Hold on to that surprise.

::widget chart-plotter {"data":[{"x":"Coffee","y":72},{"x":"Croissant","y":64},{"x":"Muffin","y":56},{"x":"Sourdough","y":76}],"geoms":["bar"],"x":"pastry","y":"revenue","code":{"bar":"ggplot(by_pastry, aes(pastry, revenue)) +\n  geom_col()"}}

=== step === concept
::eyebrow The one that trips everyone
## geom_col gives the amount, geom_bar counts the rows

There are two bar geoms, and the difference is the single most common confusion in ggplot2. It comes down to one question: **who computes the bar height, you or ggplot?**

- `geom_col()` uses your `y` exactly as given. It is the right tool when you have **already** worked out one number per category (Maya's `revenue`). In grammar terms it uses `stat = "identity"`: the height *is* the data.
- `geom_bar()` is for when you have **not** summarised yet. Hand it the raw `orders` table, map only `x`, and it **counts the rows** in each category for you. That is `stat = "count"`: the height is a tally ggplot computes.

So to ask "how many orders did each pastry get?" you do not summarise at all, you let `geom_bar()` tally the 30 raw rows:

```r
ggplot(orders, aes(x = pastry)) +
  geom_bar()
```

No `y` in the mapping, because the count is invented by the geom. Coffee towers here with 14 orders; Sourdough is the shortest bar at 3. This is the mirror image of the revenue chart: most ordered is not most valuable.

[KEY INSIGHT]
Same picture, two different jobs. `geom_col()` plots an amount you supply (you give `x` and `y`). `geom_bar()` plots a count it computes (you give only `x`). Reach for `geom_bar()` on raw rows, `geom_col()` on a summary table.

::widget chart-plotter {"data":[{"x":"Coffee","y":14},{"x":"Croissant","y":7},{"x":"Muffin","y":6},{"x":"Sourdough","y":3}],"geoms":["bar"],"x":"pastry","y":"orders","code":{"bar":"ggplot(orders, aes(pastry)) +\n  geom_bar()"}}

=== step === quiz
::eyebrow Check yourself
## Which bar geom?

Maya has just built `by_pastry`, a four-row table with one `revenue` total per pastry, and she wants a bar chart of those revenue totals. Which geom draws it correctly?

::quiz {"correct":1,"gate":true,"difficulty":"beginner"}
- `geom_col()`, mapping `x = pastry, y = revenue` ::ok Right. She already has one amount per category, so `geom_col()` draws each bar at the height she supplies. No counting needed.
- `geom_bar()`, mapping `x = pastry, y = revenue` ::no `geom_bar()` wants to COUNT rows, not read your `y`. On the four-row summary it would tally one row per pastry and draw four bars of height 1, throwing the revenue away. Use `geom_col()` when you already have the amount.
- Either one works; they are aliases for the same chart ::no They are genuinely different. `geom_bar()` computes a count (`stat = "count"`); `geom_col()` uses your value (`stat = "identity"`). On a pre-summarised table only `geom_col()` shows the revenue.

=== step === concept
::eyebrow The shape of one column of numbers
## Histograms: where do the values pile up?

Bars compared categories. Now switch questions entirely: Maya wants to understand **one** continuous column, `order_value`, on its own. Not per pastry, not over time, just: across all 30 orders, what does a typical order look like, and how spread out are they?

A **histogram** answers exactly that. It chops the range of the numbers into equal-width slices called **bins**, then counts how many orders fall in each bin and draws a bar for the count. Crucially you map only `x` (the continuous variable); like `geom_bar()`, the height is a count ggplot computes. The control that matters is `binwidth`, the width of each slice in the data's own units (dollars here):

```r
ggplot(orders, aes(x = order_value)) +
  geom_histogram(binwidth = 4)
```

Read the shape. Most orders cluster low, between about 4 and 9 dollars, a single coffee or a pastry. Then a long, thin tail stretches out to the right: a handful of big basket orders worth 22, 24 and 30 dollars. That lopsided shape, a tall pile on the left with a tail to the right, is called a **right skew**, and you can confirm it with one line: the mean is dragged above the median by those large orders.

```r
c(mean = mean(orders$order_value), median = median(orders$order_value))
#>     mean   median
#> 8.933333 7.000000
```

The mean (8.93) sits above the median (7) precisely because the big orders pull the average up while the median, the middle order, ignores them. A histogram makes a skew like this jump off the page.

[WARNING]
Call `geom_histogram()` with no `binwidth` and ggplot picks 30 bins and prints a message nudging you to choose your own. With only 30 orders that default leaves most bins empty and the shape looks ragged. Always set `binwidth` (or `bins`) to something the data justifies: too wide hides the shape, too narrow turns it into spiky noise.

::widget chart-plotter {"data":[{"x":5},{"x":4},{"x":8},{"x":6},{"x":9},{"x":11},{"x":5},{"x":24},{"x":12},{"x":10},{"x":7},{"x":30},{"x":9},{"x":6},{"x":13},{"x":4},{"x":5},{"x":7},{"x":4},{"x":8},{"x":6},{"x":9},{"x":5},{"x":7},{"x":4},{"x":22},{"x":8},{"x":5},{"x":9},{"x":6}],"geoms":["histogram"],"x":"order_value","y":"count","code":{"histogram":"ggplot(orders, aes(order_value)) +\n  geom_histogram(binwidth = 4)"}}

=== step === tryit
::eyebrow Your turn
## Set the bin width

Below is the histogram of `order_value`, but the bin width is missing. Fill in the blank so each bar covers a 4-dollar-wide slice of order value.

```r
ggplot(orders, aes(x = order_value)) +
  geom_histogram(____)
```
::check {"regex":"binwidth\\s*=\\s*4","gate":true,"difficulty":"beginner","ok":"That sets each bin to a 4-dollar slice, so the right-skewed shape reads cleanly instead of ggplot guessing 30 bins.","no":"Pass binwidth = 4 inside geom_histogram() so each bar spans a 4-dollar slice."}
::solution
```r
ggplot(orders, aes(x = order_value)) +
  geom_histogram(binwidth = 4)
```

=== step === quiz
::eyebrow Check yourself
## Bar chart or histogram?

Two charts both draw rectangles, so they are easy to confuse. A **bar chart** has one bar per **category** (Coffee, Croissant, ...). A **histogram** has one bar per **bin** of a single **continuous** number. Maya wants to see how her `order_value` (a continuous dollar amount) is distributed across all 30 orders. Which chart, and why?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- A bar chart with `geom_col()`, one bar per order ::no `order_value` is not a set of categories, it is one continuous measurement. Drawing a bar per order shows 30 separate values, not their distribution. To see how a continuous variable is spread, you bin it: that is a histogram.
- A histogram with `geom_histogram()`, binning `order_value` ::ok Exactly. There are no categories here, just one continuous column. `geom_histogram()` slices its range into bins and counts orders per bin, revealing the right-skewed shape a bar chart cannot.
- Neither; you need `geom_point()` because the values are numeric ::no `geom_point()` needs an x and a y to relate two variables. Here there is only one variable and one question, its distribution, which is the histogram's whole job.

=== step === concept
::eyebrow Comparing distributions at a glance
## Boxplots: a distribution squeezed into a box

A histogram shows one distribution beautifully, but stack several histograms to compare groups and they overlap into mush. When Maya asks *are morning orders bigger than afternoon orders, and which is more variable?* she wants two distributions **side by side**. That is the boxplot's job: it compresses each group's distribution into a compact box you can line up.

A boxplot is a picture of the **five-number summary**. Sort a group's order values and read off five landmarks: the minimum, the first quartile \(Q_1\) (the value below which 25% of orders fall), the median \(Q_2\) (the middle order, half below and half above), the third quartile \(Q_3\) (75% of orders fall below it), and the maximum.

The box is drawn from \(Q_1\) to \(Q_3\), so it holds the **middle half** of the orders; its height is the **interquartile range** \(\text{IQR} = Q_3 - Q_1\), a measure of spread that a few unusually large orders cannot inflate. The line across the box is the median. The **whiskers** reach out to the most extreme order still within \(1.5 \times \text{IQR}\) of the box; any order beyond \(Q_3 + 1.5\,\text{IQR}\) or below \(Q_1 - 1.5\,\text{IQR}\) is drawn as a lone point, a candidate **outlier**.

Map the grouping column to `x` and the number to `y`:

```r
ggplot(orders, aes(x = daypart, y = order_value)) +
  geom_boxplot()
```

Now the comparison is immediate. The Morning box sits higher (median 9 dollars, box running from about 6 to 12) than the Afternoon box (median 6, a tighter 5-to-8 box), and Morning's two fattest baskets, 24 and 30 dollars, sit past the whisker as outlier points near the top. Morning orders are both larger and more spread out, the whole answer in one glance.

[NOTE]
A boxplot trades shape for comparability. Because it shows only five numbers, it can hide a distribution that has, say, two separate peaks: two very different groups can draw the same box. When you care about the detailed shape of one variable, use a histogram; when you care about comparing center and spread across groups, use a boxplot.

::widget chart-plotter {"data":[{"y":5,"fill":"Morning"},{"y":4,"fill":"Morning"},{"y":8,"fill":"Morning"},{"y":6,"fill":"Morning"},{"y":9,"fill":"Morning"},{"y":11,"fill":"Morning"},{"y":5,"fill":"Morning"},{"y":24,"fill":"Morning"},{"y":12,"fill":"Morning"},{"y":10,"fill":"Morning"},{"y":7,"fill":"Morning"},{"y":30,"fill":"Morning"},{"y":9,"fill":"Morning"},{"y":6,"fill":"Morning"},{"y":13,"fill":"Morning"},{"y":4,"fill":"Afternoon"},{"y":5,"fill":"Afternoon"},{"y":7,"fill":"Afternoon"},{"y":4,"fill":"Afternoon"},{"y":8,"fill":"Afternoon"},{"y":6,"fill":"Afternoon"},{"y":9,"fill":"Afternoon"},{"y":5,"fill":"Afternoon"},{"y":7,"fill":"Afternoon"},{"y":4,"fill":"Afternoon"},{"y":22,"fill":"Afternoon"},{"y":8,"fill":"Afternoon"},{"y":5,"fill":"Afternoon"},{"y":9,"fill":"Afternoon"},{"y":6,"fill":"Afternoon"}],"geoms":["boxplot"],"x":"daypart","y":"order_value","code":{"boxplot":"ggplot(orders, aes(daypart, order_value)) +\n  geom_boxplot()"}}

=== step === tryit
::eyebrow Your turn
## Compare the two dayparts

You have the mapping: `daypart` on x, `order_value` on y. Add the layer that draws one box per daypart so Maya can compare the two distributions.

```r
ggplot(orders, aes(x = daypart, y = order_value)) +
  ____
```
::check {"regex":"geom_boxplot\\s*\\(","gate":true,"difficulty":"intermediate","ok":"That draws a box per daypart from each group's five-number summary, so Morning and Afternoon line up for a clean comparison.","no":"Add geom_boxplot() as the next layer. With a categorical x and a numeric y it draws one box per group."}
::solution
```r
ggplot(orders, aes(x = daypart, y = order_value)) +
  geom_boxplot()
```

=== step === quiz
::eyebrow Putting it together
## Which chart answers which question?

You now have four tools, and choosing well is mostly about naming your question first. Here is the map:

| Your question | The chart | The geom |
|---|---|---|
| Compare categories on an amount I already computed | bar chart | `geom_col()` |
| How many rows fall in each category? | bar chart | `geom_bar()` |
| How is one continuous variable spread out (shape, skew)? | histogram | `geom_histogram()` |
| How does a distribution differ across a few groups? | boxplot | `geom_boxplot()` |

Maya has a new question: *are weekend baskets typically bigger than weekday baskets, and which day type has the more variable order value?* She wants to compare the center and the spread of `order_value` across two groups, weekday and weekend. Which chart should she reach for?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- A histogram of `order_value` for all orders combined ::no One combined histogram blends weekday and weekend together, so it cannot show how the two groups differ. She needs the groups separated to compare them.
- A bar chart with `geom_col()` of the average order value per day type ::no A bar of averages shows the center but throws away the spread, and "which is more variable?" is half her question. A single bar per group hides the whole distribution.
- A boxplot of `order_value` by day type ::ok Exactly. Mapping day type to x and `order_value` to y draws one box per group, so she reads and compares both the median (center) and the box height (spread) at a glance, which is precisely the question.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [ggplot2 reference: geom_bar() and geom_col()](https://ggplot2.tidyverse.org/reference/geom_bar.html) - the official explanation of why one counts (`stat = "count"`) and the other does not (`stat = "identity"`).
- [ggplot2 reference: geom_histogram()](https://ggplot2.tidyverse.org/reference/geom_histogram.html) - bins, binwidth, and the choices behind that 30-bin default message.
- [ggplot2 reference: geom_boxplot()](https://ggplot2.tidyverse.org/reference/geom_boxplot.html) - exactly how the box, whiskers and outlier points are computed.
- [R for Data Science (2e): Exploratory Data Analysis](https://r4ds.hadley.nz/eda) - when to reach for a bar, a histogram or a boxplot while exploring, with worked examples.

=== step === complete
## Lesson 3 complete

You can now pick a chart by the question it answers. `geom_col()` draws an amount you supply; `geom_bar()` counts raw rows for you, and confusing the two is the classic bar-chart trap you have now dodged. `geom_histogram()` bins one continuous variable to reveal its shape and skew, with `binwidth` as the dial that matters. `geom_boxplot()` squeezes each group's distribution into a five-number-summary box so you can compare center and spread across groups at a glance, and you know it trades shape for that comparability.

Next, Lesson 4: A ggplot2 gallery and publication figures. You will tour the common chart types as a quick chooser, then take one plain plot and polish it to publication quality with titles, labels, and a clean theme.
