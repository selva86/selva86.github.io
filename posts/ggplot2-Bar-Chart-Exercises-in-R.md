---
title: "ggplot2 Bar Chart Exercises in R: 17 Real-World Problems"
slug: "ggplot2-Bar-Chart-Exercises-in-R"
description: "Practice ggplot2 bar chart skills with 17 hands-on interactive R exercises: geom_bar, geom_col, stacked, dodged, fill, factor reorder, themes, and labels."
keywords: "ggplot bar chart, geom_bar exercises, geom_col, stacked bar chart in R, ggplot2 practice problems"
mathjax: false
webr: true
date: "2026-05-12"
post_type: "EX"
sidebar_title: "ggplot2 Bar Chart Practice"
sidebar_order: 145
fr_parent: "ggplot2-Bar-Charts.html"
auto_link_terms: "ggplot bar chart|geom_bar exercises|geom_col practice|stacked bar chart in r|ggplot2 bar chart exercises"
auto_link_case_sensitive: false
target_keyword: "ggplot bar chart, geom_bar exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# ggplot2 Bar Chart Exercises in R: 17 Real-World Problems

<p class="lead">Drill the bar chart patterns analysts actually build: counts versus pre-summarised values, dodged versus stacked, factor reordering, themes, and value labels. Seventeen problems across six sections with hidden solutions. Try each task in the editor before clicking the reveal. Every chart uses the <code>diamonds</code> or <code>mpg</code> datasets that ship with ggplot2.</p>

```r title="Run this once before any exercise"
library(ggplot2)
library(dplyr)
library(forcats)
library(scales)
library(tidyr)
```

## Section 1. Basics: geom_bar vs geom_col (3 problems)

### Exercise 1.1: Count cars in each body class with geom_bar

**Task:** The `mpg` dataset that ships with ggplot2 includes a `class` column with vehicle body styles. Build a basic bar chart with `geom_bar()` that counts how many cars fall into each `class`. Save the plot object to `ex_1_1`.

**Expected result:**

```
#> A vertical bar chart, x = class (alphabetical), y = count.
#> Bar heights: 2seater 5, compact 47, midsize 41, minivan 11, pickup 33, subcompact 35, suv 62.
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- ggplot(mpg, aes(x = class)) +
  geom_bar()
ex_1_1
#> A vertical bar chart with 7 bars, suv tallest at 62, 2seater shortest at 5.
```

**Explanation:** `geom_bar()` defaults to `stat = "count"`, which tallies rows per x category for you. There is no need to summarise the data first. Use `geom_bar()` when you have raw observations and want ggplot to count them; reach for `geom_col()` when the y-value is already computed (next exercise).

</details>

### Exercise 1.2: Plot pre-summarised totals with geom_col

**Task:** A retailer wants a chart of total `diamonds` inventory value by `cut`. Summarise `diamonds` to total `price` per `cut`, then plot the rolled-up table with `geom_col()` since the y-values are precomputed. Save the plot to `ex_1_2`.

**Expected result:**

```
#> A vertical bar chart of total price (USD) by cut.
#> Ideal ~74.5M tallest, Premium ~63.2M, Very Good ~45.3M, Good ~17.3M, Fair ~7.4M.
```

**Difficulty:** Beginner

```r title="Your turn"
diamond_totals <- diamonds |>
  group_by(cut) |>
  summarise(total_price = sum(price))

ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
diamond_totals <- diamonds |>
  group_by(cut) |>
  summarise(total_price = sum(price))

ex_1_2 <- ggplot(diamond_totals, aes(x = cut, y = total_price)) +
  geom_col()
ex_1_2
#> Bar chart with 5 bars: Ideal tallest (~74.5M), Fair shortest (~7.4M).
```

**Explanation:** `geom_col()` is identical to `geom_bar(stat = "identity")`, but more explicit and idiomatic. When the y-aesthetic is already a numeric value (a sum, average, share), use `geom_col()`. The common beginner trap is mapping `y` and still using `geom_bar()`; ggplot will warn and try to sum within each category, which is rarely what you wanted.

</details>

### Exercise 1.3: Show proportions instead of raw counts

**Task:** Re-plot the `diamonds$cut` bar chart so each bar's height is the proportion of rows in that cut rather than the raw count, with all bars summing to one. Use `aes(y = after_stat(prop), group = 1)` inside `geom_bar()` and save to `ex_1_3`.

**Expected result:**

```
#> A bar chart of cut proportions: Fair 0.030, Good 0.091, Very Good 0.224, Premium 0.256, Ideal 0.400.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- ggplot(diamonds, aes(x = cut, y = after_stat(prop), group = 1)) +
  geom_bar()
ex_1_3
#> Bar heights now read as fractions of total rows; Ideal ~0.40 tallest.
```

**Explanation:** `after_stat(prop)` accesses the computed proportion column that `stat_count()` generates internally. The `group = 1` aesthetic tells ggplot to treat all bars as one group so proportions sum across all categories (not within each). Without `group = 1`, each bar would be its own group and every bar would have height 1.

</details>

## Section 2. Color, fill, and themes (3 problems)

### Exercise 2.1: Fill bars by category using a viridis palette

**Task:** Build a count bar chart of `mpg` cars by `class`, fill each bar by its own class using the discrete viridis palette, apply `theme_minimal()`, and hide the legend because the x-axis already labels every bar. Save to `ex_2_1`.

**Expected result:**

```
#> Vertical bar chart, 7 bars colored on the viridis discrete palette (purple to yellow).
#> Theme is minimal (white background, gray gridlines). No legend visible.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- ggplot(mpg, aes(x = class, fill = class)) +
  geom_bar() +
  scale_fill_viridis_d() +
  theme_minimal() +
  theme(legend.position = "none")
ex_2_1
#> 7 viridis-colored bars, minimal theme, legend hidden.
```

**Explanation:** Mapping `fill = class` inside `aes()` makes the color carry information; setting `fill` outside `aes()` would apply a single static color. `scale_fill_viridis_d()` is the discrete variant of viridis (suitable for categorical fills). Hiding a redundant legend with `theme(legend.position = "none")` is a small touch that produces cleaner reports.

</details>

### Exercise 2.2: Style a brand-colored chart with a single fill

**Task:** The marketing team wants the `diamonds$cut` count chart rendered in their corporate teal (`#1f7a8c`) with a clean white background. Use `fill = "#1f7a8c"` as a static value inside `geom_bar()` and apply `theme_classic()`. Save the result to `ex_2_2`.

**Expected result:**

```
#> A vertical bar chart of cut counts, every bar filled solid teal (#1f7a8c).
#> theme_classic axes (black lines), no panel grid.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- ggplot(diamonds, aes(x = cut)) +
  geom_bar(fill = "#1f7a8c") +
  theme_classic()
ex_2_2
#> 5 teal bars, classic theme with black axis lines.
```

**Explanation:** The key distinction: `fill` *inside* `aes()` maps a variable to color (and creates a legend); `fill` *outside* `aes()` paints every bar the same static color. Hex codes work everywhere R color names do. `theme_classic()` removes the gray panel background and grid, which usually reads better in slide decks and printed reports than the default `theme_gray()`.

</details>

### Exercise 2.3: Highlight one category by manual fill mapping

**Task:** A product manager wants to highlight only the "Premium" cut in the diamonds bar chart while greying out the rest. Build the count chart with `scale_fill_manual()` mapping "Premium" to "#e85d04" and every other cut to "grey70". Save to `ex_2_3`.

**Expected result:**

```
#> A vertical bar chart of cut counts.
#> The "Premium" bar is orange (#e85d04); Fair, Good, Very Good, Ideal are grey70.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- ggplot(diamonds, aes(x = cut, fill = cut)) +
  geom_bar() +
  scale_fill_manual(values = c(
    "Fair"      = "grey70",
    "Good"      = "grey70",
    "Very Good" = "grey70",
    "Premium"   = "#e85d04",
    "Ideal"     = "grey70"
  )) +
  theme_minimal() +
  theme(legend.position = "none")
ex_2_3
#> Premium bar orange; others gray.
```

**Explanation:** `scale_fill_manual()` accepts a named vector mapping every level of the fill variable to a color. This is the standard "single-callout" idiom when you need to draw attention to one category in a comparison. An alternative is `case_when()` outside the plot to create a `highlight` flag column, then map fill to that, which scales better when you have many factor levels.

</details>

## Section 3. Stacked, dodged, and filled bars (3 problems)

### Exercise 3.1: Stack drivetrain inside each body class

**Task:** A used-car analyst wants to see how drivetrain (`drv`) splits across each vehicle `class` in `mpg`. Build a stacked bar chart with `class` on the x-axis, bars filled by `drv`, and the default `position = "stack"`. Save the plot to `ex_3_1`.

**Expected result:**

```
#> Vertical stacked bar chart, x = class, y = count.
#> Each bar segmented by drv (4, f, r) with a 3-color legend.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- ggplot(mpg, aes(x = class, fill = drv)) +
  geom_bar()
ex_3_1
#> 7 stacked bars; suv tallest, dominated by 4 (4WD) and r (RWD).
```

**Explanation:** Mapping `fill` to a second categorical variable triggers stacking by default. Stacking is good for comparing totals between groups but bad for comparing subgroups across groups, because the segments don't start from a common baseline. If your reader's question is "which class has the most 4WD cars?" use dodging (next exercise) instead.

</details>

### Exercise 3.2: Switch to dodged bars for side-by-side comparison

**Task:** Rebuild the same `class` by `drv` chart with side-by-side bars instead of stacked, so each drivetrain gets its own bar inside each class. Use `position = "dodge"` inside `geom_bar()`. Save the plot object to `ex_3_2`.

**Expected result:**

```
#> Vertical dodged bar chart, x = class, y = count.
#> Each class has up to 3 small bars side-by-side, one per drv value.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- ggplot(mpg, aes(x = class, fill = drv)) +
  geom_bar(position = "dodge")
ex_3_2
#> Three side-by-side bars per class (where present), colored by drv.
```

**Explanation:** `position = "dodge"` puts each subgroup in its own bar at the same baseline, so the eye can compare drivetrain counts across classes directly. A subtle issue: when a class has no observations for some `drv` level, dodged bars within that class are uneven widths. Use `position = position_dodge2(preserve = "single")` if you need equal-width bars even when groups are missing.

</details>

### Exercise 3.3: 100% stacked bar showing shares within each class

**Task:** Convert the `class` by `drv` chart into a 100% stacked bar where each bar fills the full height and segments represent the proportion of each `drv` within that `class`. Use `position = "fill"` and format the y-axis with `scales::label_percent()`. Save to `ex_3_3`.

**Expected result:**

```
#> A stacked bar chart where every bar reaches y = 1.0 (100%).
#> Y-axis labels read 0%, 25%, 50%, 75%, 100%. Segments colored by drv.
```

**Difficulty:** Advanced

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- ggplot(mpg, aes(x = class, fill = drv)) +
  geom_bar(position = "fill") +
  scale_y_continuous(labels = label_percent()) +
  labs(y = "Share of class")
ex_3_3
#> Every bar fills the full height; y-axis shows percentages.
```

**Explanation:** `position = "fill"` rescales each bar to height 1 so segments become within-group proportions, which is the right view when totals differ a lot and you only care about composition. `scales::label_percent()` is preferred over manually multiplying by 100 and pasting "%" because it handles axis breaks and decimal precision automatically. The trade-off: you lose information about absolute totals, so pair with a count chart when the audience needs both.

</details>

## Section 4. Ordering and factor reordering (3 problems)

### Exercise 4.1: Order bars from most to least frequent with fct_infreq

**Task:** The default alphabetical order of `mpg$class` bars makes it hard to spot the most common body style. Re-plot the count chart with bars sorted from most to least frequent using `forcats::fct_infreq()` on `class` inside `aes()`. Save to `ex_4_1`.

**Expected result:**

```
#> A bar chart with x labels left to right: suv, compact, midsize, subcompact, pickup, minivan, 2seater.
#> Heights descending: 62, 47, 41, 35, 33, 11, 5.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- ggplot(mpg, aes(x = fct_infreq(class))) +
  geom_bar() +
  labs(x = "class")
ex_4_1
#> Bars now run highest to lowest left to right.
```

**Explanation:** `fct_infreq()` reorders a factor's levels by descending frequency, which is the right ordering for almost every "count by category" chart. Without it, ggplot uses the factor's existing level order (often alphabetical) which gives readers no cue about which bar is biggest. The `labs(x = "class")` resets the x-axis title because `fct_infreq(class)` would otherwise become the displayed label.

</details>

### Exercise 4.2: Order bars by a numeric statistic using reorder

**Task:** An analyst comparing average highway mileage by `class` in `mpg` wants the bars sorted from highest to lowest mean `hwy`. First summarise to a per-class mean, then plot with `reorder(class, -mean_hwy)` inside `aes()` and `geom_col()`. Save the plot to `ex_4_2`.

**Expected result:**

```
#> A bar chart, x labels left to right: compact, subcompact, midsize, 2seater, minivan, suv, pickup.
#> Bar heights approximately 28.3, 28.1, 27.3, 24.8, 22.4, 18.1, 16.9.
```

**Difficulty:** Intermediate

```r title="Your turn"
mpg_hwy <- mpg |>
  group_by(class) |>
  summarise(mean_hwy = mean(hwy))

ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mpg_hwy <- mpg |>
  group_by(class) |>
  summarise(mean_hwy = mean(hwy))

ex_4_2 <- ggplot(mpg_hwy, aes(x = reorder(class, -mean_hwy), y = mean_hwy)) +
  geom_col() +
  labs(x = "class", y = "Mean highway mpg")
ex_4_2
#> 7 bars, descending heights left to right.
```

**Explanation:** `reorder(x, by)` sorts the factor `x` by ascending values of `by`; prefix `by` with a minus sign for descending order. `forcats::fct_reorder()` is the tidyverse equivalent and supports custom summary functions via the `.fun` argument (e.g., `.fun = median`). Both work in `aes()`. Always reset the x-axis label with `labs(x = ...)` because the default label becomes the full `reorder(...)` expression.

</details>

### Exercise 4.3: Reorder a horizontal bar chart by mean price

**Task:** A reporting analyst wants a horizontal bar chart of mean diamond `price` per `cut`, with the highest-priced cut at the top. Summarise to per-cut means, use `fct_reorder()` on `cut` by mean price, plot with `geom_col()` and `coord_flip()`. Save the plot to `ex_4_3`.

**Expected result:**

```
#> Horizontal bar chart, y axis lists cuts; Premium at top, Ideal at bottom.
#> Bar lengths approximate mean prices: Premium 4584, Fair 4359, Very Good 3982, Good 3929, Ideal 3458.
```

**Difficulty:** Advanced

```r title="Your turn"
cut_price <- diamonds |>
  group_by(cut) |>
  summarise(mean_price = mean(price))

ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
cut_price <- diamonds |>
  group_by(cut) |>
  summarise(mean_price = mean(price))

ex_4_3 <- ggplot(cut_price, aes(x = fct_reorder(cut, mean_price), y = mean_price)) +
  geom_col() +
  coord_flip() +
  labs(x = "cut", y = "Mean price (USD)")
ex_4_3
#> Horizontal bars; Premium at top because it has the highest mean price.
```

**Explanation:** `coord_flip()` swaps the x and y axes after the plot is built, which means you order the x aesthetic for what will visually become the y axis. The "top of the chart" maps to the largest factor level after the flip, so `fct_reorder()` in ascending order (default) puts the largest value at the top once flipped. A modern alternative is mapping `cut` to `y` directly: `aes(x = mean_price, y = fct_reorder(cut, mean_price))`. That skips `coord_flip()` entirely.

</details>

## Section 5. Labels, annotations, and coord_flip (3 problems)

### Exercise 5.1: Add count labels just above each bar

**Task:** For the basic `mpg$class` count chart, add the count value above each bar using `geom_text()` with `stat = "count"`, `aes(label = after_stat(count))`, and `vjust = -0.3` so labels sit just above the bar tops. Save the plot to `ex_5_1`.

**Expected result:**

```
#> A bar chart of class counts with numeric labels above each bar.
#> Labels read: 5, 47, 41, 11, 33, 35, 62 above the respective bars.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- ggplot(mpg, aes(x = class)) +
  geom_bar() +
  geom_text(stat = "count", aes(label = after_stat(count)), vjust = -0.3)
ex_5_1
#> 7 bars with count labels floating above each top.
```

**Explanation:** `stat = "count"` tells `geom_text()` to use the same underlying counting transformation as `geom_bar()`, then `after_stat(count)` reaches the computed `count` column. `vjust = -0.3` nudges the label upward by 30% of label height. Negative `vjust` raises the label above the bar; positive `vjust` (between 0 and 1) drops it inside the bar. For `geom_col()`, where y is already mapped, you don't need `stat = "count"`: use `aes(label = y_value)` directly.

</details>

### Exercise 5.2: Format y-axis as dollars on a sales bar chart

**Task:** A finance analyst is presenting total `diamonds` revenue by `cut`. Build a `geom_col()` chart of summed `price` per `cut`, format the y-axis with `scales::label_dollar()` so values read in millions ($XM), and add a clear chart title. Save the plot to `ex_5_2`.

**Expected result:**

```
#> Bar chart of total price by cut.
#> Y-axis tick labels read like $20M, $40M, $60M (label_dollar with scale = 1e-6, suffix = "M").
#> Plot title: "Total diamond revenue by cut".
```

**Difficulty:** Intermediate

```r title="Your turn"
cut_revenue <- diamonds |>
  group_by(cut) |>
  summarise(total = sum(price))

ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
cut_revenue <- diamonds |>
  group_by(cut) |>
  summarise(total = sum(price))

ex_5_2 <- ggplot(cut_revenue, aes(x = cut, y = total)) +
  geom_col(fill = "#1f7a8c") +
  scale_y_continuous(labels = label_dollar(scale = 1e-6, suffix = "M")) +
  labs(
    title = "Total diamond revenue by cut",
    x = "Cut",
    y = "Total revenue"
  )
ex_5_2
#> 5 teal bars; y-axis shows dollar values in millions.
```

**Explanation:** `label_dollar()` returns a labelling function (not a finished string) which `scale_y_continuous(labels = ...)` calls on each break. The `scale = 1e-6` multiplier rescales the displayed value (dividing by 1,000,000) and `suffix = "M"` appends the unit. The actual data values are unchanged. This is cleaner than mutating the data because the bar heights remain accurate for downstream filtering or faceting.

</details>

### Exercise 5.3: Percentage labels inside a horizontal bar chart

**Task:** Build a horizontal bar chart of diamonds `cut` showing each cut's percentage share of the dataset. Compute the proportion, plot with `geom_col()` and `coord_flip()`, and add percentage labels inside each bar using `geom_text()` with `scales::label_percent()`. Save the plot to `ex_5_3`.

**Expected result:**

```
#> Horizontal bar chart of cut shares.
#> Each bar carries a percentage label inside, white text. Labels: 3.0%, 9.1%, 22.4%, 25.6%, 40.0%.
```

**Difficulty:** Advanced

```r title="Your turn"
cut_share <- diamonds |>
  count(cut) |>
  mutate(share = n / sum(n))

ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
cut_share <- diamonds |>
  count(cut) |>
  mutate(share = n / sum(n))

ex_5_3 <- ggplot(cut_share, aes(x = cut, y = share)) +
  geom_col(fill = "#1f7a8c") +
  geom_text(
    aes(label = label_percent(accuracy = 0.1)(share)),
    hjust = 1.1,
    color = "white"
  ) +
  coord_flip() +
  scale_y_continuous(labels = label_percent()) +
  labs(x = "Cut", y = "Share of dataset")
ex_5_3
#> 5 teal horizontal bars with white percentage labels tucked inside the right edge.
```

**Explanation:** `label_percent(accuracy = 0.1)` returns a function; calling it on `share` produces the formatted strings before they reach `geom_text()`. Because the chart is flipped, `hjust = 1.1` pulls the label slightly inside the right end of each bar (the flipped equivalent of `vjust`). White text on the colored bar gives strong contrast; switch to black if the bar fill is light. The pattern of calling a `scales::label_*()` factory inside `aes(label = ...)` is the cleanest way to format inline data labels.

</details>

## Section 6. End-to-end realistic workflows (3 problems)

### Exercise 6.1: Top 5 categories with title and caption

**Task:** A category buyer wants a chart showing the top 5 most common `mpg$class` values ordered by count descending, with a title "Top 5 vehicle classes in the EPA fuel economy dataset" and a caption "Source: ggplot2::mpg". Save the plot to `ex_6_1`.

**Expected result:**

```
#> Bar chart with 5 bars: suv 62, compact 47, midsize 41, subcompact 35, pickup 33.
#> Title displayed above plot; caption "Source: ggplot2::mpg" in bottom-right.
```

**Difficulty:** Advanced

```r title="Your turn"
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
top5 <- mpg |>
  count(class, sort = TRUE) |>
  slice_max(n, n = 5)

ex_6_1 <- ggplot(top5, aes(x = fct_reorder(class, n, .desc = TRUE), y = n)) +
  geom_col(fill = "#264653") +
  geom_text(aes(label = n), vjust = -0.3) +
  labs(
    title = "Top 5 vehicle classes in the EPA fuel economy dataset",
    x = NULL,
    y = "Count",
    caption = "Source: ggplot2::mpg"
  ) +
  theme_minimal()
ex_6_1
#> 5 dark teal bars descending left to right with count labels and caption.
```

**Explanation:** `slice_max(n, n = 5)` picks the top 5 rows by the `n` column (note: the inner `n` is the column name; the outer `n =` is the slice argument count). Chaining `count(class, sort = TRUE)` then `slice_max` is the standard "top-N category" pattern. `labs(x = NULL)` removes the x-axis title when the labels themselves are self-explanatory. The `caption` argument is the right place for data source attribution; putting it in the subtitle clutters the heading.

</details>

### Exercise 6.2: Long-format dodged comparison with two measures

**Task:** Build a publication-ready bar chart comparing mean city and highway mileage by `class` in `mpg`. Pivot the summary long with `tidyr::pivot_longer()`, plot a dodged `geom_col()`, set fill colors manually, label each bar with one decimal place, and apply `theme_minimal()`. Save the plot to `ex_6_2`.

**Expected result:**

```
#> A dodged bar chart with two bars per class (cty and hwy), 14 bars total.
#> Each bar labeled with its mean to one decimal place.
#> Two-color legend (cty, hwy).
```

**Difficulty:** Advanced

```r title="Your turn"
mpg_summary <- mpg |>
  group_by(class) |>
  summarise(cty = mean(cty), hwy = mean(hwy)) |>
  pivot_longer(c(cty, hwy), names_to = "measure", values_to = "mpg")

ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mpg_summary <- mpg |>
  group_by(class) |>
  summarise(cty = mean(cty), hwy = mean(hwy)) |>
  pivot_longer(c(cty, hwy), names_to = "measure", values_to = "mpg")

ex_6_2 <- ggplot(mpg_summary, aes(x = class, y = mpg, fill = measure)) +
  geom_col(position = position_dodge(width = 0.85), width = 0.8) +
  geom_text(
    aes(label = sprintf("%.1f", mpg)),
    position = position_dodge(width = 0.85),
    vjust = -0.3,
    size = 3
  ) +
  scale_fill_manual(values = c(cty = "#ef476f", hwy = "#06d6a0")) +
  labs(
    title = "City and highway mileage by class",
    x = NULL,
    y = "Mean mpg",
    fill = NULL
  ) +
  theme_minimal()
ex_6_2
#> 14 dodged bars (2 per class), labeled with one-decimal means.
```

**Explanation:** The pivot-long pattern is the canonical way to compare multiple measures with a single `geom_col()` call: `class` on the x-axis, `mpg` on the y-axis, `measure` as the grouping fill. The matching `position_dodge(width = ...)` in `geom_text()` is required so labels align with their bars; if you only set dodge on `geom_col()`, the text would stack at the x-tick centers. `sprintf("%.1f", mpg)` formats to one decimal place; an equivalent tidyverse-style call is `scales::number(mpg, accuracy = 0.1)`.

</details>

### Exercise 6.3: Lollipop alternative to a long bar chart

**Task:** When a bar chart has many categories, a lollipop chart often reads better. Build a horizontal lollipop showing mean `hwy` by `class` for `mpg`, ordered by value, using `geom_segment()` for the stems and `geom_point()` for the heads. Save to `ex_6_3`.

**Expected result:**

```
#> A horizontal lollipop chart: 7 thin segments running from x = 0 to the mean hwy value, each ending in a dot.
#> Y-axis lists classes ordered by mean hwy (compact at top, pickup at bottom).
```

**Difficulty:** Advanced

```r title="Your turn"
mpg_hwy <- mpg |>
  group_by(class) |>
  summarise(mean_hwy = mean(hwy)) |>
  mutate(class = fct_reorder(class, mean_hwy))

ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mpg_hwy <- mpg |>
  group_by(class) |>
  summarise(mean_hwy = mean(hwy)) |>
  mutate(class = fct_reorder(class, mean_hwy))

ex_6_3 <- ggplot(mpg_hwy, aes(x = mean_hwy, y = class)) +
  geom_segment(aes(x = 0, xend = mean_hwy, y = class, yend = class),
               color = "grey60") +
  geom_point(color = "#264653", size = 4) +
  labs(x = "Mean highway mpg", y = NULL,
       title = "Mean highway mpg by vehicle class") +
  theme_minimal()
ex_6_3
#> A 7-row lollipop: gray stems from x = 0 to the mean, dark dots at the ends.
```

**Explanation:** A lollipop is functionally identical to a horizontal bar chart but with less ink, which works well when bars would otherwise look like a thick wall of color. The trick is `geom_segment()` with `x = 0` and `xend = mean_hwy`, which draws each "bar" as a thin line, then `geom_point()` overlays the dot. Sorting the factor with `fct_reorder()` is the same idiom from Section 4. Bars remain the right choice for stacked or grouped comparisons; lollipops shine for single-value ranks.

</details>

## What to do next

Now that you have practiced the bar chart fundamentals, move into the related ggplot2 patterns:

- [ggplot2 Bar Charts](ggplot2-Bar-Charts.html) is the parent tutorial that covers each pattern in detail with explanations.
- [ggplot2 geom_bar() vs geom_col() in R](ggplot2-geom_bar-in-R.html) goes deeper on when to choose each geom.
- [ggplot2 Histogram and Density Plot Exercises in R](ggplot2-Histograms-and-Densities-Exercises-in-R.html) is the natural next step for visualizing continuous distributions.
- [ggplot2 Facets Exercises in R](ggplot2-Facets-Exercises-in-R.html) extends your bar charts into small-multiples comparisons.
