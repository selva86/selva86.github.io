---
title: "Exploratory Data Analysis Lesson 2: Bivariate EDA & Correlation"
description: "Bivariate EDA in R: read a scatterplot's direction and strength, measure it with Pearson correlation and a correlation matrix, and see why correlation is not causation."
keywords: "correlation in R, Pearson correlation, scatterplot, cor function, correlation matrix, correlation vs causation, confounding variable, bivariate EDA, exploratory data analysis"
post_type: "LESSON"
curriculum_id: "2.3.2"
webr: true
mathjax: true
lesson_access: "free"
course_id: "da-eda"
course_title: "Exploratory Data Analysis in R"
course_lesson: "2"
course_total: "3"
course_landing: "EDA-Course.html"
course_next: "Outliers-and-Automated-EDA.html"
course_prev: "An-EDA-Framework-and-One-Variable.html"
---

=== step === cover
::eyebrow Lesson 2 of 3
## What moves with what

In Lesson 1 you learned to read **one variable at a time**: you took Maya's daily bakery revenue and found its shape, its typical value, and the one festival day hiding in the tail. But a single column can only tell you so much. The questions Maya really loses sleep over are about *pairs*: does a busier day actually bring in more money? Do hot days sell more iced coffee? Does anything she does explain anything else?

This fortnight Maya kept a richer logbook: for each of 14 days she wrote down the **foot traffic** (people who walked in), the **revenue** (dollars), the day's **temperature**, and how many **iced coffees** and **hot cocoas** she sold. Below is the first pair, foot traffic across the bottom and revenue up the side. Each dot is one day, and the pattern jumps out before you compute a single number.

By the end of this lesson you will be able to:

- Read a **scatterplot** of two numeric variables: its direction, its form, and its strength
- Measure that relationship with **Pearson's correlation** (`cor()`) and read a **correlation matrix**
- Explain, with a real example, why **correlation is not causation**

**Prerequisites:** you can run R and load a package with `library()`, and you have met one-variable EDA in [Lesson 1](An-EDA-Framework-and-One-Variable.html) (histogram, mean vs median, spread). Every new term is defined as it appears.

::widget chart-plotter {"data":[{"x":120,"y":380},{"x":110,"y":380},{"x":130,"y":395},{"x":125,"y":400},{"x":160,"y":470},{"x":205,"y":620},{"x":190,"y":560},{"x":118,"y":360},{"x":115,"y":365},{"x":135,"y":425},{"x":140,"y":500},{"x":168,"y":515},{"x":210,"y":665},{"x":185,"y":560}],"geoms":["point"],"x":"foot_traffic","y":"revenue","code":{"point":"ggplot(bakery, aes(foot_traffic, revenue)) +\n  geom_point()"}}

=== step === concept
::eyebrow Two axes
## The scatterplot: one point per day

When you have **two** numeric columns and want to know how they relate, the first tool is always the **scatterplot**: put one variable on the horizontal axis, the other on the vertical axis, and draw one point for every row. Maya's `foot_traffic` goes across, `revenue` goes up, and each of the 14 dots is a single day, placed at that day's (people, dollars).

Each lesson runs in a fresh R session, so let us build the fortnight's logbook right here (run this once):

```r
bakery <- data.frame(
  foot_traffic = c(120, 110, 130, 125, 160, 205, 190, 118, 115, 135, 140, 168, 210, 185),
  revenue      = c(380, 380, 395, 400, 470, 620, 560, 360, 365, 425, 500, 515, 665, 560),
  temperature  = c(74, 55, 60, 80, 68, 58, 71, 83, 52, 66, 77, 63, 70, 59),
  iced_coffee  = c(30, 12, 16, 38, 28, 15, 28, 44, 9, 13, 35, 17, 33, 13),
  hot_cocoa    = c(10, 22, 17, 5, 14, 14, 12, 4, 19, 18, 8, 18, 11, 15)
)
nrow(bakery)        # one row per day
#> [1] 14
head(bakery, 4)
#>   foot_traffic revenue temperature iced_coffee hot_cocoa
#> 1          120     380          74          30        10
#> 2          110     380          55          12        22
#> 3          130     395          60          16        17
#> 4          125     400          80          38         5
```

In **ggplot2** you name the data, map one column to `x` and one to `y` with `aes()`, then add `geom_point()` to draw the dots. That is the whole scatterplot:

```r
library(ggplot2)
ggplot(bakery, aes(x = foot_traffic, y = revenue)) +
  geom_point(size = 3, colour = "steelblue")
```

A scatter is read on three dimensions, and you can see all three above:

- **Direction:** the cloud climbs from lower-left to upper-right, so as foot traffic rises, revenue rises too. That is a **positive** relationship. (A cloud sloping the other way, down to the right, is **negative**.)
- **Form:** the points roughly follow a straight line, not a curve. A straight-line pattern is called **linear**.
- **Strength:** the dots hug that line in a tight, narrow band rather than scattering loosely. Tight band, strong relationship.

=== step === quiz
::eyebrow Check yourself
## Read the scatter

Looking at Maya's foot-traffic-versus-revenue scatter, the dots climb steadily from lower-left to upper-right and sit in a tight, narrow band. How should you describe this relationship?

::quiz {"correct":1,"gate":true,"difficulty":"beginner"}
- A strong, positive, roughly linear relationship: busier days bring in more money, consistently ::ok Exactly. Up-and-to-the-right is positive, the straight-ish shape is linear, and the tight band means it is strong and dependable day to day.
- A weak relationship, because the points do not fall on a perfectly straight line ::no Real data never lands on a perfect line. Strength is about how *tightly* the points cluster around the trend, and these cluster tightly. This is a strong relationship, not a weak one.
- No relationship, because revenue and foot traffic are measured in different units ::no Two variables almost always have different units (dollars vs people). A scatter compares their *pattern*, not their units, and the pattern here is a clear upward trend.

=== step === concept
::eyebrow Put a number on it
## Pearson's correlation, r

Your eye says "strong and positive," but Maya needs a number she can write down and compare. That number is the **correlation coefficient**, written \(r\). It squeezes everything you just read off the scatter, direction and strength, into a single value between \(-1\) and \(+1\).

The intuition: on a day when foot traffic is *above its average*, is revenue usually *above its average* too? If high goes with high and low goes with low, the variables move together and \(r\) is positive. If high goes with low, they move oppositely and \(r\) is negative. The everyday version, **Pearson's correlation**, measures this for a straight-line relationship. For \(n\) days with the two measurements \(x_i\) and \(y_i\) on day \(i\):

\[ r = \frac{\sum_{i=1}^{n}(x_i - \bar{x})(y_i - \bar{y})}{\sqrt{\sum_{i=1}^{n}(x_i - \bar{x})^2}\;\sqrt{\sum_{i=1}^{n}(y_i - \bar{y})^2}} \]

where \(n\) is the number of days (14 here), \(x_i\) and \(y_i\) are the two values on day \(i\) (foot traffic and revenue), and \(\bar{x}\) and \(\bar{y}\) are their means. The **top** adds up, for every day, how far \(x\) sits from its mean times how far \(y\) sits from its mean: it is large and positive when the two are usually on the same side of their averages together. The **bottom** is each variable's own spread, and dividing by it rescales the whole thing to land neatly between \(-1\) and \(+1\), no matter the units. In R you never compute this by hand, you call `cor()`:

```r
cor(bakery$foot_traffic, bakery$revenue)
#> [1] 0.9737755
```

[KEY INSIGHT]
Read \(r\) in two parts. The **sign** is the direction: \(+\) rises together, \(-\) moves oppositely. The **size** is the strength: near \(\pm 1\) is a tight band, near \(0\) is a shapeless cloud. As a rough guide, \(|r|\) above about \(0.7\) is strong, around \(0.3\) to \(0.7\) moderate, below \(0.3\) weak. Maya's \(0.97\) is about as strong as real data gets.

The widget shows the same \(r = 0.97\) printed on the very scatter you have been reading, so the number and the picture always agree.

::widget chart-plotter {"data":[{"x":120,"y":380},{"x":110,"y":380},{"x":130,"y":395},{"x":125,"y":400},{"x":160,"y":470},{"x":205,"y":620},{"x":190,"y":560},{"x":118,"y":360},{"x":115,"y":365},{"x":135,"y":425},{"x":140,"y":500},{"x":168,"y":515},{"x":210,"y":665},{"x":185,"y":560}],"geoms":["point"],"x":"foot_traffic","y":"revenue","code":{"point":"ggplot(bakery, aes(foot_traffic, revenue)) +\n  geom_point()"}}

=== step === tryit
::eyebrow Your turn
## Correlate a different pair

You measured foot traffic against revenue. Now ask a weather question: does a hotter day sell more iced coffee? Correlate `temperature` with `iced_coffee` and read the sign and size. Fill in the blank with the function that returns Pearson's correlation.

```r
# does a hotter day move iced-coffee sales?
____(bakery$temperature, bakery$iced_coffee)
```
::check {"regex":"cor\\s*\\(","gate":true,"difficulty":"beginner","ok":"That returns about 0.95, a strong positive correlation: hotter days really do sell more iced coffee. Sign tells you the direction, size tells you it is strong.","no":"Use cor(): cor(bakery$temperature, bakery$iced_coffee)."}
::solution
```r
cor(bakery$temperature, bakery$iced_coffee)
#> [1] 0.9501207
```

=== step === concept
::eyebrow All pairs at once
## The correlation matrix

Maya has five numeric columns, which makes \(10\) possible pairs. Rather than call `cor()` ten times, hand the whole data frame to `cor()` and get a **correlation matrix**: a grid with every variable on both the rows and the columns, where each cell holds the correlation of that row with that column.

```r
bakery_num <- bakery[, c("foot_traffic", "revenue", "temperature",
                         "iced_coffee", "hot_cocoa")]
round(cor(bakery_num), 2)
#>              foot_traffic revenue temperature iced_coffee hot_cocoa
#> foot_traffic         1.00    0.97       -0.11       -0.04     -0.01
#> revenue              0.97    1.00       -0.09       -0.01     -0.03
#> temperature         -0.11   -0.09        1.00        0.95     -0.91
#> iced_coffee         -0.04   -0.01        0.95        1.00     -0.93
#> hot_cocoa           -0.01   -0.03       -0.91       -0.93      1.00
```

Three things make a correlation matrix easy to read:

- **The diagonal is always 1.** Every variable correlates perfectly with itself, so the top-left-to-bottom-right line is all `1.00`. It carries no information; skip it.
- **It is symmetric.** The correlation of revenue with temperature equals temperature with revenue, so the grid is a mirror image across that diagonal. You only ever need to read one triangle.
- **Two numbers per cell: sign and size.** Same as a single \(r\).

A grid of numbers is faster to read as colour. The **heatmap** below paints the same matrix: green for positive, blue for negative, and the deeper the colour the stronger the correlation. Hunt for the deep cells.

::widget correlation-heatmap {"vars":["foot_traffic","revenue","temperature","iced_coffee","hot_cocoa"],"data":{"foot_traffic":[120,110,130,125,160,205,190,118,115,135,140,168,210,185],"revenue":[380,380,395,400,470,620,560,360,365,425,500,515,665,560],"temperature":[74,55,60,80,68,58,71,83,52,66,77,63,70,59],"iced_coffee":[30,12,16,38,28,15,28,44,9,13,35,17,33,13],"hot_cocoa":[10,22,17,5,14,14,12,4,19,18,8,18,11,15]}}

Two clear stories emerge. Foot traffic and revenue light up deep green (\(0.97\)): they rise together. And temperature, iced coffee and hot cocoa form their own block, hot days push iced coffee up (green, \(0.95\)) and hot cocoa down (blue, \(-0.91\)). Notice what is *pale*: revenue against temperature is \(-0.09\), almost white. Maya's takings track how busy the door is, not the weather.

=== step === quiz
::eyebrow Check yourself
## Read the heatmap

In Maya's matrix, the `revenue`-`temperature` cell is \(-0.09\) (nearly white) while the `foot_traffic`-`revenue` cell is \(0.97\) (deep green). What do those two numbers, read together, tell her?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Revenue tracks how busy the shop is almost perfectly, but barely moves with the day's temperature ::ok Right. A near-1 cell means the pair rises together tightly; a near-0 cell means almost no straight-line relationship. Footfall explains her takings; the weather essentially does not.
- Temperature has a strong negative effect on revenue, because the cell is negative ::no A value of \(-0.09\) is essentially zero, a near-white cell, meaning almost no relationship. A *strong* negative would sit near \(-1\) and be deep blue. The minus sign on a tiny number is just noise.
- The 0.97 means foot traffic and revenue are really the same variable measured twice ::no They are different things, people and dollars. A high correlation means they move together, not that they are identical. Only the diagonal, a variable with itself, is exactly 1.

=== step === concept
::eyebrow The big trap
## Correlation is not causation

Here is the cell that catches everyone. In the matrix, `iced_coffee` and `hot_cocoa` correlate at \(-0.93\): on days Maya sells lots of iced coffee, cocoa sales collapse. Plot the pair and the downward band is unmistakable.

::widget chart-plotter {"data":[{"x":30,"y":10},{"x":12,"y":22},{"x":16,"y":17},{"x":38,"y":5},{"x":28,"y":14},{"x":15,"y":14},{"x":28,"y":12},{"x":44,"y":4},{"x":9,"y":19},{"x":13,"y":18},{"x":35,"y":8},{"x":17,"y":18},{"x":33,"y":11},{"x":13,"y":15}],"geoms":["point"],"x":"iced_coffee","y":"hot_cocoa","code":{"point":"ggplot(bakery, aes(iced_coffee, hot_cocoa)) +\n  geom_point()"}}

It is tempting to conclude that pushing iced coffee is *killing* Maya's cocoa sales, that one causes the other. But look back at the matrix: temperature correlates \(+0.95\) with iced coffee and \(-0.91\) with cocoa. The real story is the **weather**. Hot days drive iced coffee up and cocoa down all on their own; iced coffee and cocoa never touch each other. Temperature is a **lurking variable** (also called a **confounder**): a third thing that drives both, manufacturing a correlation between two variables that have no direct link.

[WARNING]
A correlation, however strong, only says two things move together. It never tells you *why*. The pattern can come from A causing B, B causing A, or a lurking variable driving both. Establishing real cause and effect needs a controlled experiment or careful causal analysis, never `cor()` alone.

=== step === concept
::eyebrow When r misleads
## r only sees straight lines

Pearson's \(r\) has one more blind spot worth knowing before you trust it. It measures the **linear** part of a relationship, the straight-line trend. A relationship that is strong but *curved* can have a correlation near zero, and \(r\) will swear nothing is there.

Picture Maya's oven. Run it a few degrees below her ideal temperature and pastries come out underbaked; run it a few degrees above and they burn. Plot how far the oven is from ideal against the number of pastries ruined, and you get a perfect U: ruined at both ends, fine in the middle. There is an iron-clad relationship here, yet:

```r
degrees_off <- -6:6            # oven temperature, degrees from Maya's ideal
ruined      <- degrees_off^2   # too cold OR too hot ruins pastries: a perfect U
cor(degrees_off, ruined)
#> [1] 0
```

::widget chart-plotter {"data":[{"x":-6,"y":36},{"x":-5,"y":25},{"x":-4,"y":16},{"x":-3,"y":9},{"x":-2,"y":4},{"x":-1,"y":1},{"x":0,"y":0},{"x":1,"y":1},{"x":2,"y":4},{"x":3,"y":9},{"x":4,"y":16},{"x":5,"y":25},{"x":6,"y":36}],"geoms":["point"],"x":"degrees_off","y":"pastries_ruined","code":{"point":"ggplot(oven, aes(degrees_off, pastries_ruined)) +\n  geom_point()"}}

The correlation is exactly \(0\), yet the relationship is perfect. The lesson: **always draw the scatter first.** A correlation is a one-number summary, and like any summary it can hide the shape. (Outliers do the same damage in reverse, a single stray point, like Lesson 1's \$905 festival day, can inflate or mask an \(r\). Look before you trust the number.)

=== step === quiz
::eyebrow Check yourself
## Put it together

Maya reads that iced-coffee and hot-cocoa sales correlate at \(-0.93\) and decides she must stop promoting iced coffee, because it is clearly destroying her cocoa business. What is wrong with her reasoning?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Nothing is wrong: a correlation as strong as \(-0.93\) proves one is causing the other ::no Strength does not buy causation. Even a near-perfect correlation can be entirely non-causal when a third variable drives both, which is exactly the case here.
- A strong correlation does not prove cause: the day's temperature drives both, so iced coffee is not affecting cocoa at all ::ok Exactly. Temperature is the lurking variable (hot days lift iced coffee, depress cocoa). The two products never influence each other, so cutting iced coffee would not rescue cocoa.
- The correlation is negative, and negative correlations are never real relationships ::no A negative correlation is just as real as a positive one; it only means the two move in opposite directions. The flaw in her reasoning is reading cause into a correlation, not the sign.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [An Introduction to Statistical Learning (free PDF)](https://www.statlearning.com/) - chapters 2 and 3 set correlation in the context of fitting and reading relationships, gently but rigorously.
- [OpenIntro Statistics (free)](https://www.openintro.org/book/os/) - the chapter on summarising data builds scatterplots and correlation from scratch, including the caveats.
- [R help: cor() and cor.test() {stats}](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/cor.html) - the canonical docs for the function you used, including the Spearman and Kendall alternatives for non-linear or ranked data.
- [Spurious Correlations (Tyler Vigen)](https://www.tylervigen.com/spurious-correlations) - a gallery of near-perfect correlations between utterly unrelated things; the most fun argument there is for never reading cause into r.

=== step === complete
## Lesson 2 complete

You can now go beyond one column at a time. You read a scatterplot for direction, form and strength; measured a relationship with Pearson's `cor()`; built and read a whole correlation matrix as a heatmap; and, most importantly, learned to stop before the causation trap, the way temperature secretly linked Maya's iced coffee and cocoa. You also saw the two ways `r` lies: a curved relationship it cannot see, and outliers that distort it.

Next, Lesson 3: Outliers and automated EDA. That lone \$905 festival day from Lesson 1 was easy to spot in 30 numbers, but real datasets have thousands of rows and dozens of columns. You will learn to flag outliers at scale and run a fast, automated first pass over a whole dataset with `skimr` and `DataExplorer`.
