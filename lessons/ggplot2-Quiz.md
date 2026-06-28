---
title: "Data Visualization with ggplot2: Quiz"
description: "A short, graded check on the Data Visualization with ggplot2 section."
keywords: "R quiz, data analyst, da-ggplot, practice"
post_type: "LESSON"
curriculum_id: "2.4.5"
webr: true
lesson_access: "free"
course_id: "da-ggplot"
course_title: "Data Visualization with ggplot2"
course_lesson: "5"
course_total: "5"
course_landing: "ggplot2-Course.html"
lesson_kind: "quiz"
course_prev: "A-ggplot2-Gallery-and-Publication-Figures.html"
course_next: ""
catalog_blurb: "Check what stuck before you move on."
---

=== step === cover
::eyebrow Check your understanding
## Quiz
You have finished the ggplot2 section: the grammar of graphics, scatter and line charts, bars and distributions, and publication-ready figures. This quiz checks what stuck. The last two steps are live R.

=== step === quiz
::eyebrow Question 1 of 8
## What aes() does
In a ggplot call, `aes()` is where you:
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Map data columns to visual properties like x, y, and colour. ::ok Correct: aes connects data to what you see.
- Choose the file format to save. ::no That is `ggsave`, not aes.
- Set the plot title. ::no Titles come from `labs()`.
- Filter the data. ::no Filtering happens before plotting, with dplyr.

=== step === quiz
::eyebrow Question 2 of 8
## Points or a line
You plot one measurement per day over a year. Points versus a line:
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Always use points; lines are never right. ::no A line is ideal for an ordered series.
- A line connects the ordered points to show the trend over time. ::ok Correct: lines suit ordered, continuous sequences.
- A line randomly reorders the data. ::no A line follows the data order, it does not reorder it.
- Points and lines are interchangeable here. ::no For a trend over time the line reads far better.

=== step === quiz
::eyebrow Question 3 of 8
## Layering geoms
`ggplot(df, aes(x, y)) + geom_point() + geom_smooth()` produces:
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- The points with a fitted trend line drawn on top. ::ok Correct: each geom is a layer, stacked in order.
- Two separate plots. ::no Layers share one plot.
- An error, because you can only use one geom. ::no You can layer as many geoms as you like.
- Only the smooth line, replacing the points. ::no Both layers render.

=== step === quiz
::eyebrow Question 4 of 8
## Bar versus column
`geom_bar()` and `geom_col()` differ in that:
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- `geom_bar` counts rows per category; `geom_col` uses a y value you supply. ::ok Correct: bar tallies, col plots given heights.
- They are identical. ::no They take their heights from different places.
- `geom_col` only works for time series. ::no It works for any categorical height.
- `geom_bar` needs a numeric y. ::no `geom_bar` computes the count itself.

=== step === quiz
::eyebrow Question 5 of 8
## Histogram bins
Increasing the number of bins in `geom_histogram()`:
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Shows the distribution at a finer resolution (narrower bars). ::ok Correct: more bins means finer detail, up to a point.
- Changes the data itself. ::no It changes only how the data is summarised visually.
- Always gives a clearer picture. ::no Too many bins can be as noisy as too few.
- Converts it to a bar chart of categories. ::no It is still a histogram of a continuous variable.

=== step === quiz
::eyebrow Question 6 of 8
## Mapping versus setting
Putting `colour = "blue"` INSIDE `aes()` versus outside it:
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Inside aes maps colour to data (with a legend); outside sets a constant colour. ::ok Correct: aes is for data-driven aesthetics, not fixed values.
- There is no difference. ::no The placement changes the meaning entirely.
- Inside aes always errors. ::no It is valid; it just treats "blue" as a data value.
- Outside aes adds a legend. ::no A constant setting adds no legend.

=== step === concept
::eyebrow Run it: a scatter plot
## Mapping two variables
Run this scatter of weight against mileage, then map `color = factor(cyl)` inside `aes()` and run again.

```r
library(ggplot2)

ggplot(mtcars, aes(wt, mpg)) +
  geom_point()
```

Each point is a car; the downward drift shows heavier cars get fewer miles per gallon.

=== step === concept
::eyebrow Run it: add a trend
## Layering a smooth
Run this to add a linear trend line on top of the points. Each `+` adds a layer.

```r
library(ggplot2)

ggplot(mtcars, aes(wt, mpg)) +
  geom_point() +
  geom_smooth(method = "lm")
```

The fitted line summarises the relationship the points only hint at.

=== step === complete
## Section complete
Strong work. You can build any chart from data, aesthetics, and layered geoms, and take a draft to a finished figure. Next: advanced ggplot2 and composition.
