---
title: "ggplot2 Exercises in R: 50 Real-World Practice Problems"
slug: "ggplot2-Exercises-in-R"
description: "50 ggplot2 practice problems in R: geoms, scales, facets, themes, annotations, multi-layer compositions. Hidden solutions, run code in browser."
keywords: "ggplot2 exercises, ggplot2 practice, ggplot2 exercises in R, ggplot practice problems, learn ggplot2, ggplot2 facets exercises, ggplot2 themes practice"
mathjax: false
webr: true
date: "2026-05-12"
post_type: "EX"
sidebar_title: "ggplot2 Exercises"
sidebar_order: 101
fr_parent: "Complete-Ggplot2-Tutorial-Part1-With-R-Code.html"
auto_link_terms: "ggplot2 exercises|ggplot2 practice|ggplot2 practice problems|practice ggplot2|ggplot exercises"
auto_link_case_sensitive: false
target_keyword: "ggplot2 exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# ggplot2 Exercises in R: 50 Real-World Practice Problems

<p class="lead">Fifty scenario-based ggplot2 problems spanning geoms, aesthetics, scales, facets, themes, annotations, and multi-layer compositions. Each problem names the dataset, the task, and the output variable. Solutions stay hidden until you click reveal, so you build the plot first.</p>

```r title="Run this once before any exercise"
library(ggplot2)
library(dplyr)
library(scales)
library(tibble)
```

## Section 1. Basic geoms (8 problems)

### Exercise 1.1: Scatterplot of price against carat from diamonds

**Task:** Build a basic scatterplot of `price` (y) versus `carat` (x) using the built-in `diamonds` dataset. Use the default point geom with no extra styling. Save the plot to `ex_1_1`.

**Expected result:**

```
#> A scatter plot with carat on the x-axis (0 to ~5)
#> and price on the y-axis (0 to ~19000).
#> Dense cloud of black points with a non-linear upward curve.
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- ggplot(diamonds, aes(x = carat, y = price)) +
  geom_point()
ex_1_1
#> Scatter: carat vs price; ~54k points; right-skewed cloud.
```

**Explanation:** The two essential pieces of any ggplot call are the data frame and the aesthetic mapping inside `aes()`. `geom_point()` consumes those mappings and draws one point per row. You will hit overplotting at 54k points; later exercises fix that with `alpha`, sampling, or hexbins. Note that wrapping the call in `ggplot(...)` returns a plot object, so `ex_1_1` can be printed, modified with `+`, or saved.

</details>

### Exercise 1.2: Line chart of monthly unemployment from economics

**Task:** Draw a single line chart of `unemploy` (y) over `date` (x) using the `economics` dataset that ships with ggplot2. Use only `geom_line()` with no smoothing or grouping. Save the result to `ex_1_2`.

**Expected result:**

```
#> Line chart: x = date (1967 to ~2015), y = unemploy (count, in thousands).
#> Clear cyclical peaks around 1975, 1982, 1992, 2002, and 2009.
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- ggplot(economics, aes(x = date, y = unemploy)) +
  geom_line()
ex_1_2
#> Continuous line, 1967-01 to 2015-04.
```

**Explanation:** `geom_line()` connects points in the order they appear on the x-axis, so for time series the x mapping must be a `Date`, `POSIXct`, or numeric value, never a character. The `economics` `date` column is already `Date`, so no parsing is needed. If you ever see a "saw-tooth" mess, the cause is usually a string date and you need `as.Date()` or `lubridate::ymd()` first.

</details>

### Exercise 1.3: Count of diamonds by cut quality

**Task:** A retailer reviewing the showroom mix wants a simple bar chart of diamond counts by `cut` from the `diamonds` dataset. Use `geom_bar()` and let it compute counts automatically (no precomputed totals). Save the plot to `ex_1_3`.

**Expected result:**

```
#> Bar chart: 5 bars, x = cut (Fair, Good, Very Good, Premium, Ideal).
#> y = count; Ideal is tallest (~22k), Fair shortest (~1.6k).
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- ggplot(diamonds, aes(x = cut)) +
  geom_bar()
ex_1_3
#> 5 bars ordered by ordered factor cut.
```

**Explanation:** `geom_bar()` defaults to `stat = "count"`, so passing only an `x` aesthetic is enough; ggplot tallies rows internally. If you already have a summary table (one row per group with a precomputed count), use `geom_col()` instead and map both `x` and `y`. Mixing them up is the single most common ggplot bug: `geom_bar(stat = "identity")` is the older equivalent of `geom_col()`.

</details>

### Exercise 1.4: Histogram of highway mileage with 30 bins

**Task:** Use `geom_histogram()` to plot the distribution of `hwy` from the `mpg` dataset. Set `bins = 30` explicitly so the result is reproducible rather than relying on the default. Save to `ex_1_4`.

**Expected result:**

```
#> Histogram: x = hwy (12 to 44), y = count.
#> Right-skewed, peak around hwy = 26 with ~50 observations.
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_4 <- ggplot(mpg, aes(x = hwy)) +
  geom_histogram(bins = 30)
ex_1_4
#> 30 vertical bars covering hwy range.
```

**Explanation:** The default `bins = 30` is also what ggplot uses if you do not specify it, but it warns you ("Pick better value with binwidth"). Setting it explicitly silences the message and signals intent. For domain-meaningful units use `binwidth` instead: `geom_histogram(binwidth = 2)` gives one bar per 2 mpg, which is more interpretable than "30 equal-width bins of unknown size".

</details>

### Exercise 1.5: Density curves of iris Sepal.Length by Species

**Task:** A botanist comparing flower species wants overlapping density curves of `Sepal.Length` grouped by `Species` from the built-in `iris` dataset. Map `Species` to the `color` aesthetic and use `geom_density()`. Save to `ex_1_5`.

**Expected result:**

```
#> Three overlapping density curves.
#> setosa peaks near 5.0, versicolor near 5.9, virginica near 6.5.
#> Curves drawn in default ggplot palette (red, green, blue).
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_5 <- # your code here
ex_1_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_5 <- ggplot(iris, aes(x = Sepal.Length, color = Species)) +
  geom_density()
ex_1_5
#> 3 density curves, one per Species.
```

**Explanation:** Mapping `Species` to `color` automatically splits the data into groups, computes a separate density for each, and assigns a colour from the discrete palette. If you also wanted shaded fills, map `fill = Species` and add `alpha = 0.4` inside `geom_density()` so the overlaps remain readable. A common mistake: passing `color = "red"` inside `aes()` instead of outside, which creates a fake one-level legend.

</details>

### Exercise 1.6: Boxplot of highway mpg by vehicle class

**Task:** An automotive analyst comparing fuel economy across body types wants a boxplot of `hwy` (y) split by `class` (x) from the `mpg` dataset. Use the default `geom_boxplot()`. Save the chart to `ex_1_6`.

**Expected result:**

```
#> Seven boxplots, one per class (2seater, compact, midsize, ...).
#> compact and subcompact have the highest medians; pickup and suv the lowest.
#> A handful of outlier dots above the upper whiskers.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_6 <- # your code here
ex_1_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_6 <- ggplot(mpg, aes(x = class, y = hwy)) +
  geom_boxplot()
ex_1_6
#> 7 boxplots ordered alphabetically.
```

**Explanation:** Boxplots show the 5-number summary plus outliers (points beyond 1.5 * IQR). Class is character here, so ggplot sorts categories alphabetically; if you want them ordered by median, wrap the x mapping in `reorder(class, hwy, median)`. For small samples within a category, a violin (`geom_violin()`) or strip plot (`geom_jitter()`) reveals shape better than a box, which only shows quantiles.

</details>

### Exercise 1.7: Area chart of personal savings rate over time

**Task:** A finance team tracking household behaviour wants an area chart of `psavert` (personal savings rate) over `date` from the `economics` dataset. Use `geom_area()` with the default fill. Save to `ex_1_7`.

**Expected result:**

```
#> Filled area chart from 1967 to ~2015.
#> Savings rate peaks above 17% in mid-1970s, troughs near 2% around 2005.
#> Default grey fill.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_7 <- # your code here
ex_1_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_7 <- ggplot(economics, aes(x = date, y = psavert)) +
  geom_area()
ex_1_7
#> Area chart of psavert.
```

**Explanation:** `geom_area()` is `geom_ribbon()` with `ymin = 0` baked in; it fills from zero up to y. Use it only when zero is a meaningful baseline (rates, counts, accumulated values). For values that swing positive and negative around an axis, `geom_area()` distorts perception; switch to `geom_line()` plus `geom_hline(yintercept = 0)` instead. Stack multiple series with `position = "stack"`.

</details>

### Exercise 1.8: Violin plot of tooth length by dose

**Task:** A pharmacology team running a vitamin-C trial wants violin plots of tooth length (`len`) by `dose` from the `ToothGrowth` dataset. Convert `dose` to a factor inside `aes()` so each dose becomes its own violin. Save to `ex_1_8`.

**Expected result:**

```
#> Three violins, one per dose (0.5, 1, 2).
#> Width swells in the middle showing density of len at each dose.
#> Higher doses sit at higher len values.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_8 <- # your code here
ex_1_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_8 <- ggplot(ToothGrowth, aes(x = factor(dose), y = len)) +
  geom_violin()
ex_1_8
#> 3 violin shapes side by side.
```

**Explanation:** `dose` is numeric (0.5, 1, 2), so without `factor()` ggplot treats it as continuous and tries to draw a single huge violin; wrapping in `factor()` forces a discrete x scale. Violins beat boxplots when shape matters: bimodality, skew, and gaps are visible in the silhouette but invisible in a 5-number box. Combine the two with `geom_violin() + geom_boxplot(width = 0.1)` for the best of both.

</details>

## Section 2. Aesthetics and colour (8 problems)

### Exercise 2.1: Iris scatterplot coloured by Species

**Task:** Build a scatterplot of `Petal.Length` (x) and `Petal.Width` (y) from the `iris` dataset, mapping `Species` to the `color` aesthetic so each species gets its own colour. Save to `ex_2_1`.

**Expected result:**

```
#> Scatter with three clearly separated clusters.
#> setosa bottom-left (small petals), versicolor middle, virginica top-right.
#> Default discrete palette (red, green, blue).
```

**Difficulty:** Beginner

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- ggplot(iris, aes(x = Petal.Length, y = Petal.Width, color = Species)) +
  geom_point()
ex_2_1
#> 3-cluster scatter.
```

**Explanation:** Mappings inside `aes()` come from columns of the data; constants like `color = "blue"` belong outside `aes()`. Petal width and length are the most discriminating iris features, which is why three near-disjoint clusters appear. If clusters overlap heavily, add `alpha = 0.6` and try `geom_jitter()` to nudge points off each other, especially with rounded values.

</details>

### Exercise 2.2: Bucket diamond prices with case_when and bar fill

**Task:** A retail manager presenting the sale plan wants a bar chart of `cut` counts in `diamonds`, with each bar split (filled) by `clarity`. Use `geom_bar(position = "dodge")` so clarities sit side by side instead of stacked. Save to `ex_2_2`.

**Expected result:**

```
#> 5 groups of dodged bars (one group per cut).
#> Inside each group, 8 colored bars (one per clarity from I1 to IF).
#> Colors drawn from the default discrete palette.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- ggplot(diamonds, aes(x = cut, fill = clarity)) +
  geom_bar(position = "dodge")
ex_2_2
#> Dodged bar chart, cut x clarity.
```

**Explanation:** The default `position = "stack"` stacks bars vertically, which is fine for part-of-whole but hides direct count comparisons between clarities. `position = "dodge"` (or `position_dodge2()`) places groups side by side at the cost of taking more horizontal space. With 8 clarities the chart is busy; in practice you would limit to 3 or 4 groups or facet by clarity instead.

</details>

### Exercise 2.3: Size by qsec on mtcars wt vs mpg scatter

**Task:** An automotive analyst comparing weight, mileage, and acceleration wants a scatterplot of `wt` (x) and `mpg` (y) from `mtcars`, with each point's size mapped to `qsec` (quarter-mile time). Save to `ex_2_3`.

**Expected result:**

```
#> 32 points, x = wt (1.5 to 5.5), y = mpg (10 to 35).
#> Point sizes vary with qsec; slower cars (high qsec) are larger circles.
#> Heavy + slow cars cluster bottom-right; light + quick top-left.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- ggplot(mtcars, aes(x = wt, y = mpg, size = qsec)) +
  geom_point()
ex_2_3
#> Bubble-style scatter.
```

**Explanation:** Size encodes a third numeric variable as area, but human perception of area is weaker than position or length, so reserve `size` for low-precision context (which car is slowest, not the exact qsec). For values that include zero or negative numbers, `scale_size_area()` enforces area proportionality. A common cleanup is to widen the range with `scale_size(range = c(2, 10))` so small and large bubbles are easier to tell apart.

</details>

### Exercise 2.4: Shape by cyl on mtcars wt vs mpg scatter

**Task:** Build a scatterplot of `wt` (x) versus `mpg` (y) from `mtcars`, mapping `cyl` to `shape`. Wrap `cyl` in `factor()` so ggplot uses discrete shapes (circle, triangle, square) instead of erroring on a continuous mapping. Save to `ex_2_4`.

**Expected result:**

```
#> Scatter of wt vs mpg with three distinct point shapes.
#> 4-cyl cars (circle) cluster low-wt high-mpg.
#> 6-cyl (triangle) in middle; 8-cyl (square) high-wt low-mpg.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_4 <- ggplot(mtcars, aes(x = wt, y = mpg, shape = factor(cyl))) +
  geom_point(size = 3)
ex_2_4
#> Three-shape scatter.
```

**Explanation:** `shape` only accepts discrete values; mapping a continuous variable triggers the error "A continuous variable can not be mapped to shape". For high-density plots, shape is harder to read than colour because at small sizes a square and a circle look the same. Combine `shape` with `color` for accessibility: it stays distinguishable even in print or for colour-blind viewers.

</details>

### Exercise 2.5: Manual scale_color_manual for diamond cuts

**Task:** A jeweller building a brand-aligned chart wants a scatter of `carat` (x) versus `price` (y) from `diamonds`, coloured by `cut`. Use `scale_color_manual()` to assign the five cuts the colours "#999999", "#56B4E9", "#009E73", "#F0E442", and "#D55E00". Save the plot to `ex_2_5`.

**Expected result:**

```
#> Scatter of carat vs price with 5 cut levels.
#> Fair = grey, Good = blue, Very Good = green, Premium = yellow, Ideal = orange.
#> Legend on the right titled "cut".
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_5 <- # your code here
ex_2_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_5 <- ggplot(diamonds, aes(x = carat, y = price, color = cut)) +
  geom_point(alpha = 0.4) +
  scale_color_manual(values = c("#999999", "#56B4E9", "#009E73",
                                "#F0E442", "#D55E00"))
ex_2_5
#> Custom-palette scatter.
```

**Explanation:** `scale_color_manual()` accepts an unnamed vector (assigned in the order of factor levels) or a named vector like `c(Fair = "#999999", ...)`. Named mappings are safer because reordering the factor will not silently break colours. The values above come from the Okabe-Ito palette, which is colour-blind safe. Always check colour assignment with `unique(diamonds$cut)` if results look unexpected.

</details>

### Exercise 2.6: scale_color_brewer with Set2 palette on iris

**Task:** Replot the iris scatter of `Petal.Length` versus `Petal.Width` coloured by `Species`, but apply the ColorBrewer "Set2" palette using `scale_color_brewer()`. Save the result to `ex_2_6`.

**Expected result:**

```
#> Same 3-cluster iris scatter as ex_2_1.
#> Colors come from Set2: muted teal, orange, and green.
#> Softer, lower-saturation than the default palette.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_6 <- # your code here
ex_2_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_6 <- ggplot(iris, aes(x = Petal.Length, y = Petal.Width, color = Species)) +
  geom_point(size = 3) +
  scale_color_brewer(palette = "Set2")
ex_2_6
#> Brewer Set2 scatter.
```

**Explanation:** ColorBrewer palettes come in three families: qualitative ("Set1", "Dark2", "Paired") for unordered categories, sequential ("Blues", "YlOrRd") for ordered numeric or ordinal, and diverging ("RdBu", "BrBG") for centred values with a meaningful midpoint. Using a sequential palette on unordered categories implies a false ordering; the discrete-vs-ordinal distinction is the most common ColorBrewer mistake.

</details>

### Exercise 2.7: Continuous price gradient with scale_color_gradient

**Task:** A jeweller summarising the showroom inventory wants a scatter of `carat` (x) versus `depth` (y) from `diamonds`, with each point's colour mapped to `price` on a continuous low-to-high gradient. Use `scale_color_gradient()` with `low = "lightyellow"` and `high = "darkred"`. Save to `ex_2_7`.

**Expected result:**

```
#> Scatter of carat vs depth.
#> Colour ramps from light yellow (cheap) to dark red (expensive).
#> Colorbar legend on the right titled "price".
```

**Difficulty:** Advanced

```r title="Your turn"
ex_2_7 <- # your code here
ex_2_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_7 <- ggplot(diamonds, aes(x = carat, y = depth, color = price)) +
  geom_point(alpha = 0.5) +
  scale_color_gradient(low = "lightyellow", high = "darkred")
ex_2_7
#> Continuous gradient scatter.
```

**Explanation:** `scale_color_gradient()` maps a continuous variable to a two-colour ramp; for three colours with a midpoint use `scale_color_gradient2(low, mid, high, midpoint = ...)`. With heavy-tailed values like `price` the gradient compresses 90% of the data into one end of the ramp. Either log-transform the colour value (`color = log(price)`) or use `scale_color_viridis_c(trans = "log10")` so visible variation matches what is interesting.

</details>

### Exercise 2.8: Alpha by carat for overplotting on diamonds

**Task:** A data analyst tackling overplotting wants a scatter of `carat` (x) versus `price` (y) from `diamonds` where opaqueness varies with `carat`. Map `carat` to the `alpha` aesthetic inside `aes()` and use `geom_point()`. Save to `ex_2_8`.

**Expected result:**

```
#> Scatter of carat vs price.
#> Small-carat points are very transparent, large-carat points opaque.
#> Alpha legend on the right titled "carat".
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_8 <- # your code here
ex_2_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_8 <- ggplot(diamonds, aes(x = carat, y = price, alpha = carat)) +
  geom_point()
ex_2_8
#> Alpha-mapped scatter.
```

**Explanation:** Mapping `alpha` inside `aes()` creates a continuous alpha legend, which is rarely what you want. More often you fix alpha for the geom: `geom_point(alpha = 0.1)` makes all points 10% opaque, so a dense region shows up dark and sparse areas show through, no legend needed. The mapped-vs-fixed distinction applies to every aesthetic and is the most common ggplot beginner trap.

</details>

## Section 3. Scales and axes (8 problems)

### Exercise 3.1: Log-scale price axis for diamonds

**Task:** A jeweller frustrated by the price distribution's heavy tail wants a scatter of `carat` (x) versus `price` (y) from `diamonds` with the y-axis on a log10 scale. Apply `scale_y_log10()` so cheap and expensive diamonds both have visible spread. Save to `ex_3_1`.

**Expected result:**

```
#> Scatter, x = carat (linear), y = price on log10 scale.
#> y-axis tick labels: 1000, 10000.
#> Cloud spans full y-range, more uniform vertical density than linear.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- ggplot(diamonds, aes(x = carat, y = price)) +
  geom_point(alpha = 0.3) +
  scale_y_log10()
ex_3_1
#> Log-y scatter.
```

**Explanation:** Log scales compress the upper end so doubling looks the same anywhere on the axis. They only work for strictly positive data; any zero or negative value drops out with a warning. The default tick spacing on a log scale lands on decades (10, 100, 1000); for finer breaks pass `breaks = scales::log_breaks()` or use `annotation_logticks()` for minor ticks between decades.

</details>

### Exercise 3.2: Dollar-formatted axis for txhousing median

**Task:** A real-estate analyst preparing a board deck wants a scatter of `volume` (x) versus `median` (y) from the `txhousing` dataset, with the y-axis tick labels formatted as US dollars. Use `scale_y_continuous(labels = label_dollar())` from the scales package. Save to `ex_3_2`.

**Expected result:**

```
#> Scatter, x = volume (sales dollars), y = median sale price.
#> y-axis ticks show $100,000 ; $200,000 ; $300,000 etc.
#> Positive trend: high-volume markets often have higher median prices.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- ggplot(txhousing, aes(x = volume, y = median)) +
  geom_point(alpha = 0.3) +
  scale_y_continuous(labels = label_dollar())
ex_3_2
#> Dollar-tick scatter.
```

**Explanation:** The `scales` package exposes pre-built label formatters: `label_dollar()`, `label_comma()`, `label_percent()`, `label_number(scale = 1e-6, suffix = "M")`, `label_date()`. Pass them as functions, not strings, to the `labels` argument. The older `dollar_format()` (without `label_`) still works but the new API is preferred since scales 1.1. Apply them on the x-axis via `scale_x_continuous(labels = ...)`.

</details>

### Exercise 3.3: Date-formatted x-axis for unemployment series

**Task:** A finance team reviewing the economic series wants a line of `unemploy` over `date` from `economics`, with the x-axis showing one tick every 10 years labelled as a 4-digit year (e.g. 1970, 1980). Use `scale_x_date(date_breaks = "10 years", date_labels = "%Y")`. Save to `ex_3_3`.

**Expected result:**

```
#> Line chart of unemploy over date.
#> x-axis ticks at 1970, 1980, 1990, 2000, 2010.
#> Cyclical peaks visible at 1975, 1982, 1992, 2002, 2009.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- ggplot(economics, aes(x = date, y = unemploy)) +
  geom_line() +
  scale_x_date(date_breaks = "10 years", date_labels = "%Y")
ex_3_3
#> Decade-spaced x ticks.
```

**Explanation:** `scale_x_date()` accepts human-readable strings for `date_breaks` ("1 year", "3 months", "1 week") and `strftime` format codes for `date_labels` (`%Y` 4-digit year, `%b` abbreviated month, `%Y-%m`). For datetimes use `scale_x_datetime()`. Both apply only when the x mapping is already a `Date` or `POSIXct`; if your column is character, parse it first with `as.Date()`.

</details>

### Exercise 3.4: Limit airquality Ozone to 0-150 with coord_cartesian

**Task:** Plot a histogram of `Ozone` from `airquality` (set `bins = 30` and drop NA values with `na.rm = TRUE`). Use `coord_cartesian(xlim = c(0, 150))` so the visible range stops at 150 without dropping any data points. Save to `ex_3_4`.

**Expected result:**

```
#> Histogram of Ozone from 0 to 150.
#> Right-skewed: tall bars below 50, thin tail toward 150.
#> No warning about removed rows.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_4 <- ggplot(airquality, aes(x = Ozone)) +
  geom_histogram(bins = 30, na.rm = TRUE) +
  coord_cartesian(xlim = c(0, 150))
ex_3_4
#> Clipped histogram.
```

**Explanation:** Two ways to crop a plot, and they behave differently. `xlim()` or `scale_x_continuous(limits = ...)` DROP data outside the range BEFORE statistics are computed, so a histogram's bar heights change. `coord_cartesian(xlim = ...)` zooms into the rendered space WITHOUT dropping data, so bars keep their full counts. For summaries (smooths, boxplots) the difference is huge; always prefer `coord_cartesian()` for "I just want to see this range".

</details>

### Exercise 3.5: Custom break positions on mtcars mpg axis

**Task:** Build a scatter of `wt` (x) versus `mpg` (y) from `mtcars`, then set the y-axis breaks to exactly `c(10, 15, 20, 25, 30, 35)` using `scale_y_continuous(breaks = ...)`. Save to `ex_3_5`.

**Expected result:**

```
#> Scatter wt vs mpg.
#> y-axis tick marks at 10, 15, 20, 25, 30, 35 (no other ticks).
#> Range otherwise unchanged from default.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_5 <- # your code here
ex_3_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_5 <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point() +
  scale_y_continuous(breaks = c(10, 15, 20, 25, 30, 35))
ex_3_5
#> Custom-break scatter.
```

**Explanation:** `breaks` controls major gridline positions and tick labels; `minor_breaks` controls the unlabelled lines between them. Pass `NULL` to remove ticks entirely or use `scales::breaks_width(5)` for an evenly spaced sequence regardless of range. For dynamic ranges, a function like `function(x) seq(floor(x[1]), ceiling(x[2]), by = 5)` is more robust than a hard-coded vector.

</details>

### Exercise 3.6: Log-scale carat axis on diamonds price scatter

**Task:** A jeweller comparing price progression across stone sizes wants a scatter of `carat` (x) versus `price` (y) from `diamonds` with both axes on log10. Apply `scale_x_log10()` and `scale_y_log10()`. Save to `ex_3_6`.

**Expected result:**

```
#> Scatter, both axes log10.
#> Cloud becomes much more linear (price scales roughly with carat^3 in log-log).
#> x-axis ticks at 0.5, 1, 2, 5; y-axis at 1000, 10000.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_6 <- # your code here
ex_3_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_6 <- ggplot(diamonds, aes(x = carat, y = price)) +
  geom_point(alpha = 0.2) +
  scale_x_log10() +
  scale_y_log10()
ex_3_6
#> Log-log scatter.
```

**Explanation:** Log-log scales linearise power-law relationships: if y = a * x^b, then `log(y) = log(a) + b * log(x)` is a straight line with slope b. For diamonds, the slope on log-log is roughly 1.7, telling you that price grows faster than linearly with carat. This is also why per-carat pricing is misleading; doubling size more than doubles cost. Always inspect log-log fits with a `geom_smooth(method = "lm")` overlay.

</details>

### Exercise 3.7: Percent-formatted bar chart of cut share

**Task:** A growth team reporting product mix wants a bar chart from `diamonds` where each `cut` bar shows its share of total diamonds (not raw count), with the y-axis labelled as a percentage. Compute the proportion with `aes(y = after_stat(prop), group = 1)` and add `scale_y_continuous(labels = label_percent())`. Save to `ex_3_7`.

**Expected result:**

```
#> 5 bars (one per cut); heights sum to 100%.
#> y-axis labels: 0%, 10%, 20%, 30%, 40%.
#> Ideal is tallest near 40%, Fair shortest near 3%.
```

**Difficulty:** Advanced

```r title="Your turn"
ex_3_7 <- # your code here
ex_3_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_7 <- ggplot(diamonds, aes(x = cut, y = after_stat(prop), group = 1)) +
  geom_bar() +
  scale_y_continuous(labels = label_percent())
ex_3_7
#> Percent-share bar chart.
```

**Explanation:** `after_stat()` lets you map to a value computed by the stat (here `prop`, the proportion of each bar). Without `group = 1`, each cut is in its own group and proportions become 1.0 for every bar (each is 100% of itself). `group = 1` tells ggplot to compute proportions relative to the entire dataset. Older versions used `..prop..` syntax which still works but `after_stat()` is the modern equivalent since ggplot 3.3.

</details>

### Exercise 3.8: Dual y-axis with sec_axis on airquality

**Task:** A climatologist building a quick weather-ops chart wants a line of `Temp` (y) over `Day` (x) for `Month == 5` from `airquality`, with a secondary y-axis showing the same temperature converted to Celsius. Filter to May with `dplyr::filter()` then apply `scale_y_continuous(sec.axis = sec_axis(~ (. - 32) * 5/9, name = "Temp (Celsius)"))`. Save to `ex_3_8`.

**Expected result:**

```
#> Line chart, x = Day (1-31), primary y = Temp (Fahrenheit, 56-81).
#> Right secondary axis labelled "Temp (Celsius)" with matching tick values.
```

**Difficulty:** Advanced

```r title="Your turn"
ex_3_8 <- # your code here
ex_3_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
may <- filter(airquality, Month == 5)
ex_3_8 <- ggplot(may, aes(x = Day, y = Temp)) +
  geom_line() +
  scale_y_continuous(
    name = "Temp (Fahrenheit)",
    sec.axis = sec_axis(~ (. - 32) * 5/9, name = "Temp (Celsius)")
  )
ex_3_8
#> Dual-axis temperature line.
```

**Explanation:** Secondary axes in ggplot are NOT independent axes; they are a fixed transformation of the primary axis. The formula `~ (. - 32) * 5/9` converts the primary value (`.`) to the secondary. Use this for unit conversions (F vs C, USD vs EUR at a fixed rate, raw vs percent of max) but never for two unrelated series, which would mislead readers about correlations. Hadley Wickham notes dual axes in the ggplot book as "a feature of last resort".

</details>

## Section 4. Facets (8 problems)

### Exercise 4.1: facet_wrap iris by Species

**Task:** Build a scatter of `Sepal.Length` (x) versus `Sepal.Width` (y) from `iris` and split into one panel per `Species` using `facet_wrap(~ Species)`. Save to `ex_4_1`.

**Expected result:**

```
#> Three side-by-side panels titled setosa, versicolor, virginica.
#> Each panel shows the sepal scatter for that species only.
#> Shared x and y scales across panels.
```

**Difficulty:** Beginner

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- ggplot(iris, aes(x = Sepal.Length, y = Sepal.Width)) +
  geom_point() +
  facet_wrap(~ Species)
ex_4_1
#> 3-panel iris scatter.
```

**Explanation:** `facet_wrap()` arranges panels in a wrappable grid (rows fill first, then wrap to a new column). The formula on the right of `~` is the variable that defines panels. By default scales are shared (`scales = "fixed"`), so panels are directly comparable. Switch to `scales = "free_y"` or `"free"` when ranges differ wildly between groups, but compare with caution: free scales hide differences in absolute level.

</details>

### Exercise 4.2: facet_wrap mpg by class with ncol = 4

**Task:** An automotive analyst comparing fuel economy by body type wants a scatter of `displ` (x) versus `hwy` (y) from `mpg`, faceted by `class` with at most 4 panels per row. Use `facet_wrap(~ class, ncol = 4)`. Save to `ex_4_2`.

**Expected result:**

```
#> 7 panels arranged in two rows: 4 on top, 3 on bottom.
#> Each panel: scatter of displ vs hwy for that class.
#> Compact and subcompact show a clear negative slope.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point() +
  facet_wrap(~ class, ncol = 4)
ex_4_2
#> 7-panel mpg scatter.
```

**Explanation:** `ncol` and `nrow` control the wrap; specify whichever is more natural for your aspect ratio. With 7 panels and `ncol = 4`, the last row has only 3 panels and one empty slot. Use `as.table = FALSE` to flip the panel order (bottom-left first instead of top-left). For dynamic counts where you do not know the layout in advance, leave `ncol` unset and let ggplot pick a near-square grid.

</details>

### Exercise 4.3: facet_grid drv vs class on mpg

**Task:** Build a scatter of `displ` (x) versus `hwy` (y) from `mpg`, then use `facet_grid(drv ~ class)` to split into a 2D grid: rows by drive type, columns by vehicle class. Save to `ex_4_3`.

**Expected result:**

```
#> 3 rows (drv: 4, f, r) by 7 columns (class).
#> Empty cells where combinations have no data (rear drive minivan, etc.).
#> Each non-empty cell: scatter of displ vs hwy for that combination.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point() +
  facet_grid(drv ~ class)
ex_4_3
#> 21-cell facet grid.
```

**Explanation:** `facet_grid()` differs from `facet_wrap()` in two important ways: it always builds a rectangular grid (including empty cells) and the layout is determined by the rows-vs-columns formula `rows ~ cols`. Use it when both grouping variables matter and you want to compare across rows AND columns; use `facet_wrap()` when you only have one grouping variable. Pass `space = "free_x"` to let panel widths vary with x-range so all panels stay readable.

</details>

### Exercise 4.4: facet_wrap ChickWeight by Diet with free y-scale

**Task:** A pharmacology team reviewing growth curves wants a line plot of `weight` over `Time` for the `ChickWeight` dataset, grouped by `Chick` (one line per chick), faceted by `Diet` with each diet panel allowed its own y-axis range via `scales = "free_y"`. Save to `ex_4_4`.

**Expected result:**

```
#> 4 panels titled 1, 2, 3, 4 (one per diet).
#> Each panel has many overlapping lines (one per chick).
#> y-axis ranges differ between panels, reflecting diet effects.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_4 <- # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_4 <- ggplot(ChickWeight, aes(x = Time, y = weight, group = Chick)) +
  geom_line() +
  facet_wrap(~ Diet, scales = "free_y")
ex_4_4
#> Spaghetti plot by diet.
```

**Explanation:** The `group` aesthetic separates lines without colouring them, which keeps the plot clean when there are many lines per facet. `scales = "free_y"` lets each panel autoscale its y-axis; if you switch to `"fixed"`, the small-weight diets become unreadable because the big-weight diet dominates. Always note the y-axis difference in the caption when using free scales, since visual comparison no longer reflects absolute size.

</details>

### Exercise 4.5: Monthly airquality Ozone facets

**Task:** A climatologist studying summer pollution wants a scatter of `Day` (x) versus `Ozone` (y) from `airquality`, faceted by `Month` with one panel per month. Drop NA Ozone values with `na.rm = TRUE` and use `facet_wrap(~ Month)`. Save to `ex_4_5`.

**Expected result:**

```
#> 5 panels titled 5 through 9 (months May through September).
#> Each panel: scatter of Day vs Ozone for that month.
#> July and August have notably higher Ozone than May or September.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_5 <- # your code here
ex_4_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_5 <- ggplot(airquality, aes(x = Day, y = Ozone)) +
  geom_point(na.rm = TRUE) +
  facet_wrap(~ Month)
ex_4_5
#> 5-month Ozone scatter.
```

**Explanation:** `na.rm = TRUE` in the geom suppresses the "rows containing missing values" warning, but the rows are still excluded; it is only a message control. Faceting by `Month` produces strip labels showing the month number; for readable names use `factor(Month, labels = month.name[5:9])` in the mapping, or pass a labeller to `facet_wrap()` (see exercise 4.6). For a year that spans many months, `facet_wrap(~ Month, ncol = 3)` keeps the layout compact.

</details>

### Exercise 4.6: Custom facet labels with as_labeller

**Task:** A biostatistician shipping a report wants the same `airquality` Ozone scatter as exercise 4.5, but with facet strips labelled "May", "June", "July", "August", "September" instead of the integers 5-9. Build a named character vector and pass it through `as_labeller()` to `facet_wrap()`. Save to `ex_4_6`.

**Expected result:**

```
#> 5 panels with strips labelled "May", "June", "July", "August", "September".
#> Same scatter content as ex_4_5.
```

**Difficulty:** Advanced

```r title="Your turn"
ex_4_6 <- # your code here
ex_4_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
month_labels <- c("5" = "May", "6" = "June", "7" = "July",
                  "8" = "August", "9" = "September")
ex_4_6 <- ggplot(airquality, aes(x = Day, y = Ozone)) +
  geom_point(na.rm = TRUE) +
  facet_wrap(~ Month, labeller = as_labeller(month_labels))
ex_4_6
#> Renamed-strip facets.
```

**Explanation:** `as_labeller()` accepts either a named character vector or a function; the names must match the original factor levels exactly (here as strings since `Month` is integer). For multi-variable strips use `labeller(drv = drive_labs, class = class_labs)` with one named vector per variable. The newer `label_both()` adds both the variable name and value to the strip (e.g. "drv: 4"), which is helpful for self-documenting reports.

</details>

### Exercise 4.7: diamonds cut by colour grid

**Task:** A jeweller exploring inventory composition wants a tile of `clarity` (x) versus `count` (y) from `diamonds`, faceted by both `cut` (rows) and `color` (columns). Use `geom_bar()` and `facet_grid(cut ~ color)`. Save to `ex_4_7`.

**Expected result:**

```
#> 5 rows (cuts) by 7 columns (colours) = 35 small bar panels.
#> Each panel shows clarity count distribution for that cut x color combo.
#> Many panels show similar shape: skewed toward mid-clarity grades.
```

**Difficulty:** Advanced

```r title="Your turn"
ex_4_7 <- # your code here
ex_4_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_7 <- ggplot(diamonds, aes(x = clarity)) +
  geom_bar() +
  facet_grid(cut ~ color)
ex_4_7
#> 35-panel small-multiples.
```

**Explanation:** Small multiples (a 5x7 grid here) are powerful for comparing distributions across two categorical dimensions at once. Watch the panel size: at 35 panels each panel is tiny, so individual bar heights become hard to read. Add `theme(axis.text.x = element_text(angle = 90))` to rotate clarity labels, or drop x-axis text entirely with `theme(axis.text.x = element_blank())` if the chart is for shape recognition rather than reading.

</details>

### Exercise 4.8: facet_wrap with strip position bottom

**Task:** Build a scatter of `Sepal.Length` and `Sepal.Width` from `iris` faceted by `Species`, but place the facet strip labels at the bottom of each panel instead of the top using `facet_wrap(~ Species, strip.position = "bottom")`. Save to `ex_4_8`.

**Expected result:**

```
#> Three panels with strip labels at the bottom (below the x-axis).
#> Scatter content identical to ex_4_1.
```

**Difficulty:** Advanced

```r title="Your turn"
ex_4_8 <- # your code here
ex_4_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_8 <- ggplot(iris, aes(x = Sepal.Length, y = Sepal.Width)) +
  geom_point() +
  facet_wrap(~ Species, strip.position = "bottom")
ex_4_8
#> Bottom-strip facet scatter.
```

**Explanation:** `strip.position` accepts "top" (default), "bottom", "left", or "right". Side strips ("left", "right") rotate the text 90 degrees by default; control orientation with `theme(strip.text.y = element_text(angle = 0))`. Bottom strips are useful when the panel title is more meaningful as an x-axis annotation, e.g. when faceting by time period or experimental block.

</details>

## Section 5. Themes and annotations (9 problems)

### Exercise 5.1: theme_minimal on a mtcars scatter

**Task:** Build a scatter of `wt` (x) versus `mpg` (y) from `mtcars` and apply `theme_minimal()` to drop the grey panel background and outer border. Save to `ex_5_1`.

**Expected result:**

```
#> Clean scatter: white background, light grey major gridlines, no panel border.
#> Same points and ranges as ex_2_3 but minus the default grey theme.
```

**Difficulty:** Beginner

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point() +
  theme_minimal()
ex_5_1
#> Minimal-theme scatter.
```

**Explanation:** Complete themes wholesale-replace the theme system. The built-ins are `theme_grey()` (default), `theme_bw()`, `theme_minimal()`, `theme_classic()`, `theme_dark()`, `theme_void()`, and `theme_light()`. Pick one as a base then tweak with `theme(...)` for individual elements. `theme_void()` removes everything including axes; useful for treemaps and maps where the axes carry no meaning.

</details>

### Exercise 5.2: Rotated x-axis labels for crowded categories

**Task:** A dashboard designer hitting overlapping x labels wants a bar chart of vehicle `manufacturer` counts from the `mpg` dataset with the x-axis text rotated 45 degrees and right-justified. Apply `theme(axis.text.x = element_text(angle = 45, hjust = 1))`. Save to `ex_5_2`.

**Expected result:**

```
#> Bar chart of manufacturer counts (15 makers).
#> x-axis labels rotated 45 degrees, anchored at the end so they fall below the tick.
#> No label overlap.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_2 <- ggplot(mpg, aes(x = manufacturer)) +
  geom_bar() +
  theme(axis.text.x = element_text(angle = 45, hjust = 1))
ex_5_2
#> Rotated-label bar chart.
```

**Explanation:** `angle = 45` rotates the text; `hjust = 1` sets horizontal anchor at the END of the string so the label visually attaches to its tick. Without `hjust = 1`, rotated labels float to the right of their tick and overlap with the next category. For 90-degree rotation use `hjust = 1, vjust = 0.5`. An alternative for many categories is `coord_flip()` (or `geom_col() + aes(y = manufacturer)`) which puts categories on a horizontal axis with no rotation needed.

</details>

### Exercise 5.3: Title, subtitle, caption with labs

**Task:** A reporting analyst preparing slides wants the basic iris Petal scatter from ex_2_1 enriched with a title "Iris petals separate cleanly by species", subtitle "Edgar Anderson, 1935", x label "Petal length (cm)", y label "Petal width (cm)", and caption "Source: built-in iris dataset". Use a single `labs()` call. Save to `ex_5_3`.

**Expected result:**

```
#> Iris scatter with: bold title across the top, subtitle below the title,
#> axis titles "Petal length (cm)" and "Petal width (cm)",
#> caption "Source: built-in iris dataset" at the bottom right.
```

**Difficulty:** Beginner

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_3 <- ggplot(iris, aes(x = Petal.Length, y = Petal.Width, color = Species)) +
  geom_point() +
  labs(
    title    = "Iris petals separate cleanly by species",
    subtitle = "Edgar Anderson, 1935",
    x        = "Petal length (cm)",
    y        = "Petal width (cm)",
    caption  = "Source: built-in iris dataset"
  )
ex_5_3
#> Annotated iris scatter.
```

**Explanation:** `labs()` accepts named arguments for every axis title and any plot-level annotation in one call, which is cleaner than chaining `ggtitle()` + `xlab()` + `ylab()`. Aesthetic names also work: `labs(color = "Flower species")` retitles the legend. Set `labs(color = NULL)` to drop a legend title entirely. For multi-line titles inside `labs()`, embed `\n`: `title = "Line 1\nLine 2"`.

</details>

### Exercise 5.4: Annotate a point of interest with annotate

**Task:** An analyst presenting the mtcars scatter wants to add a single text label at coordinates `(x = 5.25, y = 10.5)` reading "Heaviest, lowest mpg" to flag the Lincoln Continental cluster. Build the wt-vs-mpg scatter and use `annotate("text", ...)` with `hjust = 1`. Save to `ex_5_4`.

**Expected result:**

```
#> Scatter of wt vs mpg with one text annotation reading "Heaviest, lowest mpg"
#> anchored at the right end (x = 5.25, y = 10.5), aligned right.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_4 <- # your code here
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_4 <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point() +
  annotate("text", x = 5.25, y = 10.5,
           label = "Heaviest, lowest mpg", hjust = 1)
ex_5_4
#> Scatter with annotation.
```

**Explanation:** `annotate()` adds a single, hard-coded geom that does NOT inherit from the data; this is the right tool for one-off labels, arrows, or rectangles. Mapping `label` through `aes()` would create one label per row, which is rarely what you want. For arrows, use `annotate("segment", x, xend, y, yend, arrow = arrow())`. For shaded periods use `annotate("rect", xmin, xmax, ymin, ymax, alpha = 0.2)`.

</details>

### Exercise 5.5: Numeric labels above bars with geom_text

**Task:** A reporting analyst wants a bar chart of `cut` counts from `diamonds` with the count value printed above each bar. Compute counts in advance with `dplyr::count()`, then draw with `geom_col()` and add `geom_text(aes(label = n), vjust = -0.3)`. Save to `ex_5_5`.

**Expected result:**

```
#> 5 bars (one per cut), each with the count printed just above the top of the bar.
#> Labels: 1610, 4906, 12082, 13791, 21551 (approx, in order Fair to Ideal).
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_5 <- # your code here
ex_5_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
cut_counts <- count(diamonds, cut)
ex_5_5 <- ggplot(cut_counts, aes(x = cut, y = n)) +
  geom_col() +
  geom_text(aes(label = n), vjust = -0.3)
ex_5_5
#> Bar chart with count labels.
```

**Explanation:** `vjust = -0.3` pushes labels upward; `0` is "bottom of text on the data point" and negative values move further. For values that risk clipping at the top, add `ylim()` with extra headroom or use `vjust = -0.5` with a `coord_cartesian(clip = "off")` plus theme margin tweaks. To right-align long labels inside bars instead of above them, swap `vjust = -0.3` for `vjust = 1.1` so text drops INSIDE the bar at the top.

</details>

### Exercise 5.6: Direct labels of mtcars cars with geom_text

**Task:** An analyst building a small-multiples handout wants the `mtcars` wt-vs-mpg scatter with each row's car name printed next to its point. Convert `rownames(mtcars)` to a column with `tibble::rownames_to_column("car")`, then add `geom_text(aes(label = car), size = 3, hjust = -0.1)`. Save to `ex_5_6`.

**Expected result:**

```
#> 32 points, each labelled with the car name to the right of the point.
#> Some labels overlap (no repulsion).
#> "Maserati Bora", "Chrysler Imperial", and "Cadillac Fleetwood" visible near top right.
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_6 <- # your code here
ex_5_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mtcars_df <- rownames_to_column(mtcars, "car")
ex_5_6 <- ggplot(mtcars_df, aes(x = wt, y = mpg)) +
  geom_point() +
  geom_text(aes(label = car), size = 3, hjust = -0.1)
ex_5_6
#> Labelled mtcars scatter.
```

**Explanation:** Direct labels remove the need for a legend but suffer from overlap with more than 15-20 points. The ggrepel package's `geom_text_repel()` (not loaded here) automatically pushes labels apart and adds connector lines, which is the production-grade fix. For static charts where overlap is acceptable, set `check_overlap = TRUE` inside `geom_text()` to drop labels that would collide, sacrificing completeness for readability.

</details>

### Exercise 5.7: Centre the plot title with plot.title.position

**Task:** A designer reviewing brand alignment wants the iris scatter from ex_5_3 with the plot title aligned to the left edge of the entire plot (not just the panel). Use `theme(plot.title.position = "plot", plot.title = element_text(hjust = 0))`. Save to `ex_5_7`.

**Expected result:**

```
#> Iris scatter with title positioned flush with the LEFT edge of the plotting region,
#> not above the panel (so it shifts further left when y-axis labels are wide).
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_7 <- # your code here
ex_5_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_7 <- ggplot(iris, aes(x = Petal.Length, y = Petal.Width, color = Species)) +
  geom_point() +
  labs(title = "Iris petals separate cleanly by species") +
  theme(
    plot.title.position = "plot",
    plot.title = element_text(hjust = 0)
  )
ex_5_7
#> Title flush-left to plot.
```

**Explanation:** Pre-ggplot 3.3, titles were positioned relative to the panel (the area inside axes). The new `plot.title.position = "plot"` option, paired with the same setting for `plot.caption.position`, anchors them to the whole plotting region. This matches editorial style guides (Economist, FT, New York Times) where titles always start at a consistent left margin regardless of axis label width.

</details>

### Exercise 5.8: Reusable custom theme function

**Task:** An ops engineer maintaining a fleet of dashboards wants a function `theme_brand()` that returns a theme combining `theme_minimal(base_size = 13)` with rotated x-axis text (45 deg, right-justified) and a left-aligned title. Apply it to a `mpg` `class`-count bar chart and save the plot to `ex_5_8`.

**Expected result:**

```
#> Bar chart of class counts.
#> Rotated x labels, base font size 13, title flush-left over the plot.
#> theme_brand() reusable across other charts.
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_8 <- # your code here
ex_5_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
theme_brand <- function() {
  theme_minimal(base_size = 13) +
    theme(
      axis.text.x = element_text(angle = 45, hjust = 1),
      plot.title.position = "plot",
      plot.title = element_text(hjust = 0, face = "bold")
    )
}

ex_5_8 <- ggplot(mpg, aes(x = class)) +
  geom_bar() +
  labs(title = "Vehicles by class") +
  theme_brand()
ex_5_8
#> Branded bar chart.
```

**Explanation:** Wrapping `theme_*()` calls in a function is the canonical pattern for organisational style guides; every dashboard imports `theme_brand()` and the look stays consistent without copy-paste. Always start from a complete theme (`theme_minimal`, `theme_bw`) before adding `theme(...)` tweaks; otherwise you stack overrides on top of `theme_grey()` and the result fights itself. Document `base_size` and any font assumptions so downstream users know what dependencies the theme has.

</details>

### Exercise 5.9: Bottom legend with theme legend.position

**Task:** Build the iris `Species`-coloured scatter from ex_2_1 and move the legend below the plot using `theme(legend.position = "bottom")`. Save to `ex_5_9`.

**Expected result:**

```
#> Iris scatter, legend horizontal at the bottom of the plot listing the three species.
#> Plot panel itself is slightly taller than the default because no right-side legend.
```

**Difficulty:** Beginner

```r title="Your turn"
ex_5_9 <- # your code here
ex_5_9
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_9 <- ggplot(iris, aes(x = Petal.Length, y = Petal.Width, color = Species)) +
  geom_point() +
  theme(legend.position = "bottom")
ex_5_9
#> Bottom-legend iris scatter.
```

**Explanation:** `legend.position` accepts "right" (default), "left", "top", "bottom", or "none". For fine control pass a length-2 numeric vector in `[0, 1]` coordinates: `c(0.8, 0.2)` places the legend at 80% across, 20% up the plot. Pair with `legend.justification = c(1, 0)` to anchor the corner. Multiple legends from different aesthetics stack vertically; use `guides(color = guide_legend(nrow = 1))` to keep them on one row.

</details>

## Section 6. Multi-layer compositions (9 problems)

### Exercise 6.1: Scatter with linear smoother on mtcars

**Task:** A data analyst diagnosing the wt-mpg relationship wants a scatter of `wt` versus `mpg` from `mtcars` with a linear regression line overlaid. Use `geom_point()` then `geom_smooth(method = "lm", se = TRUE)`. Save the result to `ex_6_1`.

**Expected result:**

```
#> Scatter of wt vs mpg with a straight blue line falling left-to-right.
#> Shaded grey ribbon around the line is the 95% confidence interval.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_1 <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point() +
  geom_smooth(method = "lm", se = TRUE)
ex_6_1
#> Scatter with lm smoother.
```

**Explanation:** `method = "lm"` fits a linear model per group; the ribbon is the pointwise 95% confidence interval (not a prediction interval). Drop the ribbon with `se = FALSE`. For larger datasets the default `method = "loess"` (or auto-selected `"gam"` for n > 1000) is more honest because real relationships are rarely linear. Always inspect smooth-line residuals when reading off coefficients from a quick lm overlay.

</details>

### Exercise 6.2: Confidence ribbon on a time-series line

**Task:** A finance team plotting yield uncertainty wants to overlay a confidence band on the `economics` unemployment line. Compute `lwr = unemploy * 0.95` and `upr = unemploy * 1.05` inline with `mutate()`, draw the line with `geom_line()`, and add `geom_ribbon(aes(ymin = lwr, ymax = upr), alpha = 0.2)`. Save to `ex_6_2`.

**Expected result:**

```
#> Line of unemploy over date.
#> Translucent ribbon of width +/- 5% around the line.
#> Same long cyclical pattern as ex_1_2 but with the band overlay.
```

**Difficulty:** Advanced

```r title="Your turn"
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
econ_band <- economics |>
  mutate(lwr = unemploy * 0.95, upr = unemploy * 1.05)
ex_6_2 <- ggplot(econ_band, aes(x = date, y = unemploy)) +
  geom_ribbon(aes(ymin = lwr, ymax = upr), alpha = 0.2) +
  geom_line()
ex_6_2
#> Line with confidence ribbon.
```

**Explanation:** Order matters: draw `geom_ribbon()` BEFORE `geom_line()` so the line sits on top of the band. Reversing the order hides the line under the ribbon at the edges. `geom_ribbon()` needs both `ymin` and `ymax`; pass them through `aes()` so they can come from columns. For forecast charts, the ribbon usually represents predicted standard error from a model object: extract with `predict(fit, se.fit = TRUE)` and bind to the data before plotting.

</details>

### Exercise 6.3: Mean line over a histogram

**Task:** Build a histogram of `mpg$hwy` with 30 bins, then add a vertical red dashed line at the mean of `mpg$hwy` using `geom_vline()`. Use `linetype = "dashed"` and `color = "red"`. Save the plot to `ex_6_3`.

**Expected result:**

```
#> Right-skewed histogram of hwy (12 to 44).
#> Vertical dashed red line at ~23.4 mpg (the mean of mpg$hwy).
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_3 <- ggplot(mpg, aes(x = hwy)) +
  geom_histogram(bins = 30) +
  geom_vline(xintercept = mean(mpg$hwy), color = "red", linetype = "dashed")
ex_6_3
#> Histogram with mean line.
```

**Explanation:** `geom_vline()`, `geom_hline()`, and `geom_abline()` are special: they accept their position via `xintercept`/`yintercept`/`slope+intercept` outside `aes()` because they are typically one-off reference lines, not data-driven layers. To draw a vertical line PER GROUP from a data frame, do pass `xintercept` inside `aes()` so it maps to a column. For the mean of a grouped variable, pre-compute with `group_by() %>% summarise()` first.

</details>

### Exercise 6.4: Faceted scatter with smoother by drv

**Task:** An automotive analyst evaluating drive type wants a scatter of `displ` (x) versus `hwy` (y) from `mpg`, faceted by `drv`, with a `loess` smoother in each panel. Use `facet_wrap(~ drv)` and `geom_smooth(method = "loess", se = FALSE)`. Save to `ex_6_4`.

**Expected result:**

```
#> 3 panels (4, f, r) of scatters with a wavy blue smoother in each.
#> Slopes differ: front-wheel and 4WD show clearer negative trends than rear.
#> No confidence ribbons.
```

**Difficulty:** Advanced

```r title="Your turn"
ex_6_4 <- # your code here
ex_6_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_4 <- ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(alpha = 0.5) +
  geom_smooth(method = "loess", se = FALSE) +
  facet_wrap(~ drv)
ex_6_4
#> Faceted scatter with smoothers.
```

**Explanation:** `geom_smooth()` fits one smoother per group, and faceting creates implicit groups (one per panel). If you want a single shared smoother across all facets, pre-compute predictions and use `geom_line()` instead. For small panels, the default loess smoothing parameter `span = 0.75` is often too wiggly; tighten it with `span = 0.9` for a smoother trend or use `method = "lm"` for straight lines.

</details>

### Exercise 6.5: Lollipop chart of mean mpg by cylinder

**Task:** A reporting analyst presenting executive summary stats wants a lollipop chart of mean `mpg` by `cyl` from `mtcars`. Aggregate with `group_by(cyl) %>% summarise(avg = mean(mpg))`, then draw `geom_segment()` from y=0 up to y=avg per cyl plus `geom_point()` at the top. Save to `ex_6_5`.

**Expected result:**

```
#> 3 vertical line-segments (lollipop sticks) at x = 4, 6, 8.
#> Round dot at the top of each stick at heights ~26.7, ~19.7, ~15.1.
```

**Difficulty:** Advanced

```r title="Your turn"
ex_6_5 <- # your code here
ex_6_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mpg_by_cyl <- mtcars |>
  group_by(cyl) |>
  summarise(avg = mean(mpg))
ex_6_5 <- ggplot(mpg_by_cyl, aes(x = factor(cyl), y = avg)) +
  geom_segment(aes(xend = factor(cyl), y = 0, yend = avg)) +
  geom_point(size = 4)
ex_6_5
#> Lollipop chart.
```

**Explanation:** Lollipops are bar charts with the bar replaced by a thin line and a dot at the tip; they ink less than bars and emphasise the data point itself. The trick is `geom_segment()` from `y = 0` (or any baseline) to `yend = avg`. Set `aes(xend = ..., yend = ...)` to give each segment its own endpoints. Cleveland dot plots (`geom_point()` only, no stem) push this even further by removing the line entirely.

</details>

### Exercise 6.6: Dot plot to replace a bar of class counts

**Task:** A code reviewer suggesting cleaner reporting wants a horizontal Cleveland dot plot of `class` counts from `mpg`. Aggregate with `count()`, set `y = reorder(class, n)` to sort by count, draw with `geom_point(size = 4)`, and remove gridlines on the y-axis with `theme(panel.grid.major.y = element_blank())`. Save to `ex_6_6`.

**Expected result:**

```
#> Horizontal dot plot, 7 dots arranged top-down by count.
#> Highest at top (suv ~62), lowest at bottom (2seater ~5).
#> No horizontal gridlines.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_6_6 <- # your code here
ex_6_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
class_counts <- count(mpg, class)
ex_6_6 <- ggplot(class_counts, aes(x = n, y = reorder(class, n))) +
  geom_point(size = 4) +
  theme(panel.grid.major.y = element_blank())
ex_6_6
#> Cleveland dot plot.
```

**Explanation:** Cleveland dot plots are Edward Tufte's recommended replacement for short horizontal bar charts because they use less ink and compare equally well on length. `reorder()` is the standard idiom for sorting a factor by a numeric value; alternatives include `forcats::fct_reorder(class, n)` which is more explicit and chainable. Always remove the irrelevant horizontal gridlines so the eye tracks only the dot positions.

</details>

### Exercise 6.7: Stacked percentage bar of cut composition

**Task:** A marketing analyst breaking down product mix wants a single bar showing the percentage composition of `cut` within each `color` of `diamonds`. Use `geom_bar(position = "fill")` with `x = color` and `fill = cut`, then format the y-axis as a percentage with `scale_y_continuous(labels = label_percent())`. Save to `ex_6_7`.

**Expected result:**

```
#> 7 bars (one per color D-J), each full-height stack of 5 colored cut slices.
#> y-axis labelled in percent from 0% to 100%.
#> Composition of cuts roughly stable across colors, with Ideal dominant.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_6_7 <- # your code here
ex_6_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_7 <- ggplot(diamonds, aes(x = color, fill = cut)) +
  geom_bar(position = "fill") +
  scale_y_continuous(labels = label_percent())
ex_6_7
#> 100% stacked bar.
```

**Explanation:** `position = "fill"` scales each bar to height 1 so it represents composition rather than count. This is the right tool for "what is the share of X within Y" questions; the absolute counts are hidden by design. To keep counts visible, draw a second `geom_bar(position = "stack")` plot side by side (the patchwork package handles this) or annotate with `geom_text()` showing the within-group count.

</details>

### Exercise 6.8: Highlight recession period with geom_rect

**Task:** A climatologist wanting to flag an event window on a time series will instead use the recession of 1973-1975 on the `economics` `unemploy` line. Add `annotate("rect", xmin = as.Date("1973-11-01"), xmax = as.Date("1975-03-01"), ymin = -Inf, ymax = Inf, fill = "red", alpha = 0.15)` BEHIND the line. Save to `ex_6_8`.

**Expected result:**

```
#> Unemployment line chart with a translucent red rectangle covering
#> the period Nov 1973 to Mar 1975, full height of the plot.
#> Line clearly visible on top of the rectangle.
```

**Difficulty:** Advanced

```r title="Your turn"
ex_6_8 <- # your code here
ex_6_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_8 <- ggplot(economics, aes(x = date, y = unemploy)) +
  annotate("rect",
           xmin = as.Date("1973-11-01"), xmax = as.Date("1975-03-01"),
           ymin = -Inf, ymax = Inf,
           fill = "red", alpha = 0.15) +
  geom_line()
ex_6_8
#> Line with recession-band annotation.
```

**Explanation:** `-Inf` and `Inf` as the y bounds tell ggplot to extend to the full plot range whatever it turns out to be; this is the standard trick for full-height annotations that survive zoom and theme changes. Drawing the rectangle BEFORE the line is critical so the line sits on top. Multiple recessions: build a tibble of start/end dates and use `geom_rect(data = ..., aes(xmin, xmax), inherit.aes = FALSE)` instead of multiple `annotate()` calls.

</details>

### Exercise 6.9: Before-after dumbbell of PlantGrowth treatments

**Task:** A healthcare analyst comparing baseline and treatment outcomes will instead use `PlantGrowth`. Build a tibble of mean weight per `group` (`ctrl`, `trt1`, `trt2`), pair `ctrl` as the baseline and `trt1`/`trt2` as endpoints, and draw a dumbbell with `geom_segment()` connecting baseline to endpoint plus two `geom_point()` calls (one per end). Save the dumbbell to `ex_6_9`.

**Expected result:**

```
#> Two short horizontal dumbbells.
#> Row 1 (trt1): two dots linked by a segment, ctrl mean and trt1 mean.
#> Row 2 (trt2): same, ctrl mean and trt2 mean (further apart).
```

**Difficulty:** Advanced

```r title="Your turn"
ex_6_9 <- # your code here
ex_6_9
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
means <- PlantGrowth |>
  group_by(group) |>
  summarise(avg = mean(weight))

baseline <- means$avg[means$group == "ctrl"]
db <- tibble(
  comparison = c("trt1 vs ctrl", "trt2 vs ctrl"),
  start = baseline,
  end   = c(means$avg[means$group == "trt1"],
            means$avg[means$group == "trt2"])
)

ex_6_9 <- ggplot(db, aes(y = comparison)) +
  geom_segment(aes(x = start, xend = end, yend = comparison),
               color = "grey60", linewidth = 1.5) +
  geom_point(aes(x = start), color = "black", size = 4) +
  geom_point(aes(x = end), color = "steelblue", size = 4)
ex_6_9
#> Dumbbell plot.
```

**Explanation:** Dumbbells beat side-by-side bars for two-state comparisons (before vs after, baseline vs treatment) because the connecting segment makes the magnitude of change visible at a glance. The pattern: one `geom_segment()` for the bar, two `geom_point()` calls for the endpoints (different colours so direction reads instantly). The ggalt package provides `geom_dumbbell()` as a one-liner shortcut, but the manual approach gives full control over colours and labels.

</details>

## What to do next

- [Complete ggplot2 Tutorial - Part 1](Complete-Ggplot2-Tutorial-Part1-With-R-Code.html) is the parent reference; pair it with these exercises for end-to-end practice.
- [dplyr Exercises in R](dplyr-Exercises-in-R.html) drills the wrangling layer you used in many exercises above (`count`, `group_by`, `summarise`, `mutate`).
- [EDA Exercises in R](EDA-Exercises-in-R.html) extends visual practice into full exploratory workflows.
- [tidyverse Exercises in R](tidyverse-Exercises-in-R.html) combines dplyr, tidyr, and ggplot2 in single end-to-end pipelines.
