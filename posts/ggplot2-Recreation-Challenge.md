---
title: "ggplot2 Recreation Challenge: 12 Plots to Rebuild from Scratch"
slug: "ggplot2-Recreation-Challenge"
description: "ggplot2 practice recreate charts from a written spec: 12 plots to rebuild in R, from scatter, bar, and histogram basics to facets, stat summaries, and themes."
keywords: "ggplot2 practice recreate charts, ggplot2 exercises, rebuild ggplot2 plots, ggplot2 challenge, geom_point, facet_wrap, ggplot2 from scratch"
mathjax: false
webr: true
date: "2026-07-15"
post_type: "EX"
sidebar_title: "ggplot2 Recreation Challenge"
sidebar_order: 148
fr_parent: "Complete-Ggplot2-Tutorial-Part1-With-R-Code.html"
auto_link_terms: "ggplot2 practice|geom_point|facet_wrap|geom_bar|aesthetic mapping"
auto_link_case_sensitive: false
target_keyword: "ggplot2 practice recreate charts"
sibling_block_enabled: false
difficulty: "Mixed"
---

# ggplot2 Recreation Challenge: 12 Plots to Rebuild from Scratch

<p class="lead">Twelve finished ggplot2 charts, described in words. Your job is to rebuild each one from scratch as a plot object named `p`. Because a picture cannot be auto-graded, every problem ends with a short fingerprint probe that inspects your plot and prints a signature: match that printed line and your recreation is correct. Solutions stay hidden until you reveal them.</p>

Work in order. The first four are single-geom warm-ups (scatter, histogram, bar, line); the middle four add colour, facets, and a position adjustment; the last four layer on statistics, flipped coordinates, an annotation, and a custom theme. Read each spec carefully, because the dataset, the geoms, the aesthetic mappings, and any labels are all part of the target.

Every fingerprint is one line you run after building `p`. It reports things like the geom class, the number of layers, how many rows the plot's internal data has, or a label you set. None of them draw the chart, so the only thing printed to the console is the signature you are matching. Match it exactly, spaces and all.

```r title="Run this once before any exercise"
library(ggplot2)
```

## Section 1. Single-geom warm-ups (4 plots)

### Exercise 1.1: Rebuild a weight-versus-mileage scatterplot

**Task:** Recreate a simple scatterplot from the `mtcars` dataset: put car weight `wt` on the x axis and fuel economy `mpg` on the y axis, drawn with a single point layer, then relabel the axes to "Weight (1000 lbs)" and "Miles per gallon". Save the plot to `p`, then run `cat(class(p$layers[[1]]$geom)[1], nrow(ggplot_build(p)$data[[1]]), p$labels$x)`.

**Expected result:**

```
#> GeomPoint 32 Weight (1000 lbs)
```

**Difficulty:** Beginner

[HINTS]
Every ggplot starts from a dataset and an aesthetic mapping; a scatterplot then needs the point geom drawn on top of that base.
Combine `ggplot(mtcars, aes(x = wt, y = mpg))` with `geom_point()`, then add `labs(x = "Weight (1000 lbs)", y = "Miles per gallon")`.

```r title="Your turn"
p <- # your code here

cat(class(p$layers[[1]]$geom)[1], nrow(ggplot_build(p)$data[[1]]), p$labels$x)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
p <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point() +
  labs(x = "Weight (1000 lbs)", y = "Miles per gallon")

cat(class(p$layers[[1]]$geom)[1], nrow(ggplot_build(p)$data[[1]]), p$labels$x)
#> GeomPoint 32 Weight (1000 lbs)
```

**Explanation:** `geom_point()` draws one mark per row, so the plot's built data has 32 rows, matching the 32 cars in `mtcars`. The fingerprint reads the class of the first layer's geom, that row count, and the x-axis label you set with `labs()`. A frequent beginner mistake is quoting the column names inside `aes()`; variables in `aes()` are unquoted because they refer to columns, not strings.

</details>

### Exercise 1.2: Recreate a 20-bin histogram of eruption times

**Task:** Using the built-in `faithful` dataset, build a histogram of the `eruptions` column with exactly 20 bins and give it the title "Old Faithful eruptions". The bars should show how eruption durations cluster into two groups. Save the plot to `p`, then run `cat(class(p$layers[[1]]$geom)[1], nrow(ggplot_build(p)$data[[1]]), p$labels$title)`.

**Expected result:**

```
#> GeomBar 20 Old Faithful eruptions
```

**Difficulty:** Beginner

[HINTS]
A histogram bins one continuous variable and counts how many observations land in each bin, so only an x aesthetic is mapped.
Use `geom_histogram(bins = 20)` on `aes(x = eruptions)`, then add the title with `labs(title = ...)`.

```r title="Your turn"
p <- # your code here

cat(class(p$layers[[1]]$geom)[1], nrow(ggplot_build(p)$data[[1]]), p$labels$title)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
p <- ggplot(faithful, aes(x = eruptions)) +
  geom_histogram(bins = 20) +
  labs(title = "Old Faithful eruptions")

cat(class(p$layers[[1]]$geom)[1], nrow(ggplot_build(p)$data[[1]]), p$labels$title)
#> GeomBar 20 Old Faithful eruptions
```

**Explanation:** A histogram is drawn with rectangles, so under the hood `geom_histogram()` uses the bar geom, which is why the fingerprint reports `GeomBar` rather than a dedicated histogram class. Setting `bins = 20` produces exactly 20 rows in the built data, one per bin. Leaving `bins` unset falls back to 30 and prints a "pick better value" message, so always choose a bin count deliberately.

</details>

### Exercise 1.3: Recreate a count bar chart of diamond cuts

**Task:** From the `diamonds` dataset, draw a bar chart that counts how many diamonds fall into each `cut` category, and fill every bar with the constant colour "steelblue" rather than mapping colour to a variable. Save the plot to `p`, then run `cat(class(p$layers[[1]]$geom)[1], nrow(ggplot_build(p)$data[[1]]), ggplot_build(p)$data[[1]]$fill[1])`.

**Expected result:**

```
#> GeomBar 5 steelblue
```

**Difficulty:** Beginner

[HINTS]
When the bar height should be a tally of rows in each category you do not supply a y aesthetic; the geom counts for you.
Map only `aes(x = cut)` and set the colour with `geom_bar(fill = "steelblue")`, placing `fill` outside `aes()`.

```r title="Your turn"
p <- # your code here

cat(class(p$layers[[1]]$geom)[1], nrow(ggplot_build(p)$data[[1]]), ggplot_build(p)$data[[1]]$fill[1])
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
p <- ggplot(diamonds, aes(x = cut)) +
  geom_bar(fill = "steelblue")

cat(class(p$layers[[1]]$geom)[1], nrow(ggplot_build(p)$data[[1]]), ggplot_build(p)$data[[1]]$fill[1])
#> GeomBar 5 steelblue
```

**Explanation:** `geom_bar()` applies a counting statistic, so a single categorical x with five `cut` levels yields five bars and five rows in the built data. The fill is placed outside `aes()` because it is a fixed constant, not data to be mapped; putting `fill = "steelblue"` inside `aes()` would treat the literal word as a one-level variable and draw a redundant legend. Use `geom_col()` instead when you already have the heights.

</details>

### Exercise 1.4: Recreate the unemployment time-series line

**Task:** Using the `economics` dataset, plot a line of total `unemploy` (thousands of people) over `date` so the reader sees the long-run trend and recessions as peaks. Label the y axis "Unemployed (thousands)". Save the plot to `p`, then run `cat(class(p$layers[[1]]$geom)[1], nrow(ggplot_build(p)$data[[1]]), p$labels$y)`.

**Expected result:**

```
#> GeomLine 574 Unemployed (thousands)
```

**Difficulty:** Beginner

[HINTS]
A trend over time needs both a date on the x axis and the measured value on the y axis, connected in order by a line geom.
Map `aes(x = date, y = unemploy)`, add `geom_line()`, then set the y label with `labs(y = "Unemployed (thousands)")`.

```r title="Your turn"
p <- # your code here

cat(class(p$layers[[1]]$geom)[1], nrow(ggplot_build(p)$data[[1]]), p$labels$y)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
p <- ggplot(economics, aes(x = date, y = unemploy)) +
  geom_line() +
  labs(y = "Unemployed (thousands)")

cat(class(p$layers[[1]]$geom)[1], nrow(ggplot_build(p)$data[[1]]), p$labels$y)
#> GeomLine 574 Unemployed (thousands)
```

**Explanation:** `geom_line()` connects the observations in ascending x order, which is exactly what you want for a monthly time series; `economics` holds 574 months, so the built data keeps all 574 vertices. The fingerprint confirms the geom, the number of points, and the y label you set. Reach for `geom_line()` over `geom_path()` here, because `geom_path()` connects rows in table order rather than sorting by the x value.

</details>

## Section 2. Colour, facets, and position (4 plots)

### Exercise 2.1: Recreate a scatter coloured by vehicle class

**Task:** Using the `mpg` dataset, plot highway mileage `hwy` against engine displacement `displ` as points, and map the point colour to the `class` variable so each vehicle type gets its own colour and a legend appears. Save the plot to `p`, then run `cat(class(p$layers[[1]]$geom)[1], length(unique(ggplot_build(p)$data[[1]]$group)), nrow(ggplot_build(p)$data[[1]]))`.

**Expected result:**

```
#> GeomPoint 7 234
```

**Difficulty:** Intermediate

[HINTS]
To colour points by a category you map that category to the colour aesthetic inside `aes()`, which also splits the data into groups.
Add `colour = class` to `aes(x = displ, y = hwy, ...)` and keep a plain `geom_point()`.

```r title="Your turn"
p <- # your code here

cat(class(p$layers[[1]]$geom)[1], length(unique(ggplot_build(p)$data[[1]]$group)), nrow(ggplot_build(p)$data[[1]]))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
p <- ggplot(mpg, aes(x = displ, y = hwy, colour = class)) +
  geom_point()

cat(class(p$layers[[1]]$geom)[1], length(unique(ggplot_build(p)$data[[1]]$group)), nrow(ggplot_build(p)$data[[1]]))
#> GeomPoint 7 234
```

**Explanation:** Mapping `colour = class` inside `aes()` tells ggplot the colour depends on the data, so it creates one group per class (seven here) and adds a legend automatically. All 234 rows of `mpg` are still plotted, so the built data keeps 234 rows while the internal `group` column takes seven distinct values. The classic mistake is writing `colour = class` outside `aes()`, which paints every point one fixed colour and produces no legend.

</details>

### Exercise 2.2: Recreate a small-multiples grid of scatterplots

**Task:** Take the same `mpg` scatter of `hwy` against `displ` with plain points, but split it into a grid of small panels, one panel per vehicle `class`, so each type is shown separately with shared axes. Save the plot to `p`, then run `cat(class(p$facet)[1], nrow(ggplot_build(p)$layout$layout))`.

**Expected result:**

```
#> FacetWrap 7
```

**Difficulty:** Intermediate

[HINTS]
Splitting one plot into many panels by a single categorical variable is the job of a wrapping facet, not a separate plot per group.
Add `facet_wrap(~ class)` to the base scatter of `aes(x = displ, y = hwy)` with `geom_point()`.

```r title="Your turn"
p <- # your code here

cat(class(p$facet)[1], nrow(ggplot_build(p)$layout$layout))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
p <- ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point() +
  facet_wrap(~ class)

cat(class(p$facet)[1], nrow(ggplot_build(p)$layout$layout))
#> FacetWrap 7
```

**Explanation:** `facet_wrap(~ class)` builds one panel for each of the seven classes and wraps them into a grid, sharing the x and y scales so panels are directly comparable. The plot's internal layout table holds one row per panel, which is why the count is seven. Use `facet_wrap()` for a single faceting variable and `facet_grid()` when you want a full rows-by-columns matrix from two variables.

</details>

### Exercise 2.3: Recreate boxplots of mileage by drive type

**Task:** From the `mpg` dataset, draw side-by-side boxplots of highway mileage `hwy` for each drive train `drv` (four-wheel, front, and rear), and fill each box by mapping `fill` to `drv` as well. Save the plot to `p`, then run `cat(class(p$layers[[1]]$geom)[1], nrow(ggplot_build(p)$data[[1]]))`.

**Expected result:**

```
#> GeomBoxplot 3
```

**Difficulty:** Intermediate

[HINTS]
A boxplot summarises a numeric variable within each category, so the categorical goes on x and the numeric on y.
Use `geom_boxplot()` with `aes(x = drv, y = hwy, fill = drv)`.

```r title="Your turn"
p <- # your code here

cat(class(p$layers[[1]]$geom)[1], nrow(ggplot_build(p)$data[[1]]))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
p <- ggplot(mpg, aes(x = drv, y = hwy, fill = drv)) +
  geom_boxplot()

cat(class(p$layers[[1]]$geom)[1], nrow(ggplot_build(p)$data[[1]]))
#> GeomBoxplot 3
```

**Explanation:** There are three drive types, so ggplot computes one box per group and the built data holds three rows, each carrying the median, hinges, and whisker limits from the boxplot statistic. Mapping `fill` to the same variable as x simply colours each box, which aids scanning even though it duplicates the x information. If you only need one box per category, mapping fill is cosmetic; drop it when a legend would be redundant with the axis.

</details>

### Exercise 2.4: Recreate a 100 percent stacked bar of clarity within cut

**Task:** Using the `diamonds` dataset, build a bar chart with `cut` on the x axis and `clarity` mapped to fill, but stack the bars to a constant height of one so each bar shows the proportion of clarity grades within that cut rather than raw counts. Save the plot to `p`, then run `cat(class(p$layers[[1]]$geom)[1], class(p$layers[[1]]$position)[1], nrow(ggplot_build(p)$data[[1]]))`.

**Expected result:**

```
#> GeomBar PositionFill 40
```

**Difficulty:** Intermediate

[HINTS]
Turning a stacked count chart into a proportion chart is a position adjustment, not a change of geom or statistic.
Keep `geom_bar()` with `aes(x = cut, fill = clarity)` and pass `position = "fill"`.

```r title="Your turn"
p <- # your code here

cat(class(p$layers[[1]]$geom)[1], class(p$layers[[1]]$position)[1], nrow(ggplot_build(p)$data[[1]]))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
p <- ggplot(diamonds, aes(x = cut, fill = clarity)) +
  geom_bar(position = "fill")

cat(class(p$layers[[1]]$geom)[1], class(p$layers[[1]]$position)[1], nrow(ggplot_build(p)$data[[1]]))
#> GeomBar PositionFill 40
```

**Explanation:** `position = "fill"` stacks the clarity segments and then rescales every bar to height one, converting counts into within-cut proportions so cuts of different sizes become comparable. With five cut levels and eight clarity grades the built data has forty segments. Swap the position to `"stack"` for raw counts or `"dodge"` to place the clarity bars side by side; the geom and mappings stay the same, only the arrangement changes.

</details>

## Section 3. Stats, coordinates, and polish (4 plots)

### Exercise 3.1: Recreate a scatter with a linear trend line

**Task:** Using the `mpg` dataset, plot highway mileage `hwy` against displacement `displ` as points, then add a second layer that fits and draws a straight linear trend line through the cloud with method `lm` and formula `y ~ x`. Save the plot to `p`, then run `cat(length(p$layers), class(p$layers[[2]]$geom)[1], class(p$layers[[2]]$stat)[1])`.

**Expected result:**

```
#> 2 GeomSmooth StatSmooth
```

**Difficulty:** Advanced

[HINTS]
A raw scatter plus a fitted trend is two separate layers stacked in order, with the trend added after the points.
Add `geom_smooth(method = "lm", formula = y ~ x)` after `geom_point()` on the shared `aes(x = displ, y = hwy)`.

```r title="Your turn"
p <- # your code here

cat(length(p$layers), class(p$layers[[2]]$geom)[1], class(p$layers[[2]]$stat)[1])
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
p <- ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point() +
  geom_smooth(method = "lm", formula = y ~ x)

cat(length(p$layers), class(p$layers[[2]]$geom)[1], class(p$layers[[2]]$stat)[1])
#> 2 GeomSmooth StatSmooth
```

**Explanation:** The plot has two layers: the points and the smoother. `geom_smooth()` pairs the smooth geom with the smoothing statistic, which is why the fingerprint reports `GeomSmooth` and `StatSmooth` on the second layer. Passing `method = "lm"` fits a linear model and `formula = y ~ x` states the model explicitly, avoiding the automatic message ggplot prints when it guesses. Layer order matters: add the line after the points so it sits on top.

</details>

### Exercise 3.2: Recreate a plot of mean mileage per class

**Task:** Using the `mpg` dataset, show the average highway mileage for each vehicle `class` as a single point per class, computed on the fly rather than pre-aggregated, with the point size set to 3. Save the plot to `p`, then run `cat(class(p$layers[[1]]$geom)[1], class(p$layers[[1]]$stat)[1], nrow(ggplot_build(p)$data[[1]]))`.

**Expected result:**

```
#> GeomPoint StatSummary 7
```

**Difficulty:** Intermediate

[HINTS]
You want one summarised value per category drawn as a point, which a summary statistic can compute inside the plot without a separate aggregation step.
Use `stat_summary(fun = mean, geom = "point", size = 3)` on `aes(x = class, y = hwy)`.

```r title="Your turn"
p <- # your code here

cat(class(p$layers[[1]]$geom)[1], class(p$layers[[1]]$stat)[1], nrow(ggplot_build(p)$data[[1]]))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
p <- ggplot(mpg, aes(x = class, y = hwy)) +
  stat_summary(fun = mean, geom = "point", size = 3)

cat(class(p$layers[[1]]$geom)[1], class(p$layers[[1]]$stat)[1], nrow(ggplot_build(p)$data[[1]]))
#> GeomPoint StatSummary 7
```

**Explanation:** `stat_summary()` collapses each of the seven classes to a single number, here the mean of `hwy`, and draws it with the point geom, so the built data has exactly seven rows. The fingerprint sees `GeomPoint` for the geom and `StatSummary` for the statistic. Computing the mean inside the plot keeps your pipeline short; swap `fun = median` for a robust centre, or add `fun.min` and `fun.max` to turn the same layer into error bars.

</details>

### Exercise 3.3: Recreate a horizontal bar chart with flipped coordinates

**Task:** From the `mpg` dataset, draw a count bar chart of vehicle `class`, then flip the coordinate system so the bars run horizontally and the class names read comfortably along the vertical axis instead of overlapping on the bottom. Save the plot to `p`, then run `cat(class(p$coordinates)[1], class(p$layers[[1]]$geom)[1], nrow(ggplot_build(p)$data[[1]]))`.

**Expected result:**

```
#> CoordFlip GeomBar 7
```

**Difficulty:** Advanced

[HINTS]
Making category bars horizontal so long labels stop colliding is a coordinate-system change layered on top of an ordinary bar chart.
Build `geom_bar()` on `aes(x = class)`, then add `coord_flip()`.

```r title="Your turn"
p <- # your code here

cat(class(p$coordinates)[1], class(p$layers[[1]]$geom)[1], nrow(ggplot_build(p)$data[[1]]))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
p <- ggplot(mpg, aes(x = class)) +
  geom_bar() +
  coord_flip()

cat(class(p$coordinates)[1], class(p$layers[[1]]$geom)[1], nrow(ggplot_build(p)$data[[1]]))
#> CoordFlip GeomBar 7
```

**Explanation:** `coord_flip()` swaps the x and y axes at draw time, so the seven counted bars stay `GeomBar` with seven rows of data while the coordinate object becomes `CoordFlip`. Flipping is the easy way to make long category labels legible without rotating text. A modern alternative that avoids `coord_flip()` entirely is to map the categorical variable directly to y, for example `aes(y = class)`, which ggplot now supports natively for bars.

</details>

### Exercise 3.4: Recreate an annotated, minimally themed scatterplot

**Task:** Rebuild the `mtcars` scatter of `mpg` against `wt` with points, then add a fixed text annotation reading "Heavier cars, lower mpg" at position x equals 4 and y equals 30, give the plot the title "Fuel economy vs weight", and apply the minimal theme. Save the plot to `p`, then run `cat(length(p$layers), class(p$layers[[2]]$geom)[1], p$labels$title)`.

**Expected result:**

```
#> 2 GeomText Fuel economy vs weight
```

**Difficulty:** Advanced

[HINTS]
A one-off text label pinned to specific coordinates is added with an annotation, which becomes a second layer without needing its own data frame.
Add `annotate("text", x = 4, y = 30, label = "Heavier cars, lower mpg")`, then `labs(title = ...)` and `theme_minimal()`.

```r title="Your turn"
p <- # your code here

cat(length(p$layers), class(p$layers[[2]]$geom)[1], p$labels$title)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
p <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point() +
  annotate("text", x = 4, y = 30, label = "Heavier cars, lower mpg") +
  labs(title = "Fuel economy vs weight") +
  theme_minimal()

cat(length(p$layers), class(p$layers[[2]]$geom)[1], p$labels$title)
#> 2 GeomText Fuel economy vs weight
```

**Explanation:** `annotate("text", ...)` adds a single text layer at fixed data coordinates, so the plot now has two layers and the second one is a `GeomText`. Because annotations carry their own inline values rather than a mapped column, they never spawn a legend, which is why they beat `geom_text()` for one-off labels. `theme_minimal()` strips the grey panel background for a cleaner look, and the fingerprint reads the title straight from the labels you set with `labs()`.

</details>

## What to do next

Keep drilling ggplot2 with these related practice hubs:

- [ggplot2 Exercises in R](ggplot2-Exercises-in-R.html) for a broad set of plotting problems across every common chart type.
- [ggplot2 Facets Exercises in R](ggplot2-Facets-Exercises-in-R.html) to go deeper on small multiples with `facet_wrap` and `facet_grid`.
- [ggplot2 Color Scales Exercises in R](ggplot2-Color-Scales-Exercises-in-R.html) to master palettes, gradients, and legend control.
- [Data Visualization Exercises in R](Data-Visualization-Exercises-in-R.html) for a wider tour of charts and design choices.
