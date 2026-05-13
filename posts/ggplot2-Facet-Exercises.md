---
title: "ggplot2 Facet Exercises in R: 15 Real-World Practice Problems"
slug: "ggplot2-Facet-Exercises"
description: "Practice ggplot2 faceting with 15 facet_wrap() and facet_grid() exercises covering layout control, free scales, custom labels, margins, and background data."
keywords: "ggplot2 facet exercises, facet_wrap exercises, facet_grid exercises, ggplot2 practice problems, facet_wrap practice R, facet_grid practice R, ggplot2 multi-panel exercises, ggplot2 faceting practice"
mathjax: false
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "ggplot2 Facets (15 problems)"
sidebar_order: 145
fr_parent: "ggplot2-Facets.html"
auto_link_terms: "ggplot2 facet exercises|facet_wrap exercises|facet_grid exercises|ggplot2 faceting practice|facet exercises in R"
auto_link_case_sensitive: false
target_keyword: "ggplot2 facet exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# ggplot2 Facet Exercises in R: 15 Real-World Practice Problems

<p class="lead">Fifteen hands-on exercises that drill every facet skill in ggplot2: <code>facet_wrap()</code> layout control, <code>facet_grid()</code> for two-variable matrices, free vs fixed scales, custom strip labels, margins, and the background-data overlay trick. Each problem ships with a Task, an expected output, and a hidden step-by-step solution.</p>

Run the setup block once, then attempt each exercise in the Your-turn box before revealing the solution. Sections build from basic `facet_wrap()` through advanced strip-label customization and the background-overlay pattern used in published dashboards.

```r title="Run this once before any exercise"
library(ggplot2)
library(dplyr)
library(tidyr)
library(scales)
```

## Section 1. facet_wrap() basics (3 problems)

### Exercise 1.1: Split mpg by vehicle class with facet_wrap

**Task:** A car-review editor wants one mini scatterplot of highway MPG versus engine displacement for every vehicle class in the `mpg` dataset, so readers can compare classes side by side. Use `facet_wrap()` to split the plot by the `class` column and save the ggplot object to `ex_1_1`.

**Expected result:**

```
#> ggplot output saved as ex_1_1.
#> 7 panels (one per vehicle class: 2seater, compact, midsize, minivan, pickup, subcompact, suv).
#> Default wrap layout puts panels in 3 columns by 3 rows (last row partial).
#> Within each panel: hwy on y, displ on x, blue points.
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(color = "steelblue", alpha = 0.7) +
  facet_wrap(~ class) +
  labs(x = "Engine displacement (L)", y = "Highway MPG") +
  theme_minimal()

ex_1_1
#> 7 panels. Compact and subcompact cluster top-left (small engine, high mpg).
#> Pickups and SUVs sit bottom-right (large engine, low mpg).
```

**Explanation:** `facet_wrap(~ class)` takes one categorical variable and lays out one panel per level. Because the formula has nothing on the left, ggplot picks a near-square grid (`ncol` defaults to a value close to `sqrt(n_levels)`). The same x and y scale is reused across panels, which makes cross-panel comparison fair. If groups vary wildly in range you would use `scales = "free_y"` instead.

</details>

### Exercise 1.2: Force a single-row layout with ncol

**Task:** The editorial team wants the seven `mpg` class panels arranged in a single horizontal strip across the page for a newspaper print column. Rebuild the plot from Exercise 1.1 and force `facet_wrap()` to lay all panels in one row using the `ncol` argument. Save the result to `ex_1_2`.

**Expected result:**

```
#> ggplot output saved as ex_1_2.
#> 7 panels in a single row (1 row by 7 columns).
#> Panel strips read: 2seater | compact | midsize | minivan | pickup | subcompact | suv.
#> Each panel is narrow; x-axis tick labels may overlap at smaller widths.
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(color = "steelblue", alpha = 0.7) +
  facet_wrap(~ class, ncol = 7) +
  labs(x = "Engine displacement (L)", y = "Highway MPG") +
  theme_minimal()

ex_1_2
#> One row, 7 narrow panels.
```

**Explanation:** Passing `ncol = 7` overrides the auto-layout and forces a single row. The mirror argument is `nrow`. Use whichever fits the rendering width: `ncol` for wide-aspect outputs (print, dashboards), `nrow` for tall columns (mobile, reports). When both are supplied, `nrow` wins because `facet_wrap` fills column-first. Tick density gets crowded at this width, so consider rotating labels with `theme(axis.text.x = element_text(angle = 45, hjust = 1))`.

</details>

### Exercise 1.3: Facet diamonds price by cut quality

**Task:** A jeweller analyzing inventory wants one histogram of `price` per cut quality from the `diamonds` dataset, arranged in a 2-by-3 grid. Build a `geom_histogram()` plot and facet by `cut`, forcing exactly 3 columns. Save the ggplot to `ex_1_3`.

**Expected result:**

```
#> ggplot output saved as ex_1_3.
#> 6 panels in a 2-row by 3-col grid (5 cut levels: Fair, Good, Very Good, Premium, Ideal; one cell blank).
#> Each panel: price histogram, right-skewed, bulk under $5000.
#> "Fair" panel shows the widest spread; "Ideal" the most peaked at low price.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- ggplot(diamonds, aes(x = price)) +
  geom_histogram(bins = 40, fill = "tomato", color = "white") +
  facet_wrap(~ cut, ncol = 3) +
  scale_x_continuous(labels = label_dollar()) +
  labs(x = "Price", y = "Count") +
  theme_minimal()

ex_1_3
#> 5 panels filled, last cell empty (cut has 5 levels, grid has 6 slots).
```

**Explanation:** `facet_wrap` accepts ordinal factors (`cut` is ordered) and preserves the factor order in panel arrangement. Because 5 panels do not fit a 3-column grid evenly, the bottom-right cell stays blank. To fill that gap you would either set `ncol = 5` (single row) or use `as.character(cut)` and trim a level. `label_dollar()` from the `scales` package formats the x-axis without manually typing `$` prefixes.

</details>

## Section 2. facet_grid() for two-variable matrices (3 problems)

### Exercise 2.1: Cross drive type and cylinder count in a grid

**Task:** A reliability analyst wants a strict matrix of MPG distributions, where rows correspond to drive type (`drv`) and columns to cylinder count (`cyl`) in the `mpg` dataset. Build a `geom_point()` plot of `hwy` versus `displ` and use `facet_grid(drv ~ cyl)`. Save to `ex_2_1`.

**Expected result:**

```
#> ggplot output saved as ex_2_1.
#> 3 rows (drv: 4, f, r) by 4 cols (cyl: 4, 5, 6, 8) = 12 panels.
#> Some panels empty (e.g. 4wd + 5cyl, rwd + 4cyl don't exist in the data).
#> Each populated panel: hwy vs displ scatter.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(color = "darkblue", alpha = 0.7) +
  facet_grid(drv ~ cyl) +
  labs(x = "Displacement (L)", y = "Highway MPG") +
  theme_minimal()

ex_2_1
#> 12 cells. Empty cells stay drawn but blank: rear-wheel + 4cyl is absent, etc.
```

**Explanation:** `facet_grid(row_var ~ col_var)` lays variables in a rigid matrix, which is the right choice when both dimensions are interesting and you want a quick crosstab. Unlike `facet_wrap`, empty combinations are still rendered as blank cells, which actually communicates that the combination is rare or impossible. To suppress empty cells use `facet_grid(... , drop = TRUE)`; to free the row or column extents use `scales = "free_x"` or `"free_y"`.

</details>

### Exercise 2.2: Facet rows only with the dot placeholder

**Task:** A reviewer wants a stack of three panels (one per drive type) showing the highway MPG distribution as boxplots, all sharing the same x-axis. Use `facet_grid()` with the dot placeholder so `drv` becomes the row variable and there is no column variable. Save the plot to `ex_2_2`.

**Expected result:**

```
#> ggplot output saved as ex_2_2.
#> 3 rows, 1 column (drv: 4, f, r from top to bottom).
#> Each row: horizontal boxplot of hwy.
#> Strip labels on the right edge: 4, f, r.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- ggplot(mpg, aes(x = hwy, y = "")) +
  geom_boxplot(fill = "skyblue") +
  facet_grid(drv ~ .) +
  labs(x = "Highway MPG", y = NULL) +
  theme_minimal()

ex_2_2
#> 3 stacked boxplots. Front-wheel (f) shifts highest, rear (r) middle, four-wheel (4) lowest.
```

**Explanation:** The `.` placeholder tells `facet_grid` that there is no faceting variable for that axis. `drv ~ .` means rows by `drv`, no column splits. The mirror is `. ~ drv` for columns only. This is cleaner than `facet_wrap(~ drv, ncol = 1)` when you want strip labels on the right edge rather than at the top of each panel, which is the `facet_grid` default.

</details>

### Exercise 2.3: Cut by color crosstab on diamonds

**Task:** A jeweller wants a price-versus-carat scatter for every cell of a `cut` (5 levels) by `color` (7 levels) grid on the `diamonds` dataset, with rows as cut and columns as color. Use `facet_grid()` and reduce point size to handle the large rendering. Save the plot to `ex_2_3`.

**Expected result:**

```
#> ggplot output saved as ex_2_3.
#> 5 rows (cut: Fair, Good, Very Good, Premium, Ideal) by 7 cols (color: D...J) = 35 panels.
#> Each cell: price vs carat scatter with tiny points.
#> Pattern: tighter linear cloud in "Ideal + D"; loose spread in "Fair + J".
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- ggplot(diamonds, aes(x = carat, y = price)) +
  geom_point(size = 0.2, alpha = 0.3, color = "purple") +
  facet_grid(cut ~ color) +
  scale_y_continuous(labels = label_dollar()) +
  labs(x = "Carat", y = "Price") +
  theme_minimal(base_size = 9)

ex_2_3
#> 35 panels. Visible price-carat curve in every cell.
```

**Explanation:** When the grid is large (here 35 panels), small visual choices matter: tiny `size`, low `alpha`, smaller `base_size` so strip labels do not collide. `facet_grid` keeps all panels on the same x and y scale by default, which is exactly right for a crosstab where the comparison is "how does this relationship shift as I move across the grid?". If panels share little in common (say, different metrics on y), reach for `scales = "free_y"`.

</details>

## Section 3. Free vs fixed scales (3 problems)

### Exercise 3.1: Let each MPG class have its own y-axis range

**Task:** A reviewer noticed that 2-seater highway MPG sits in a tight band while pickup MPG covers a wide low range, so the shared y-axis from Exercise 1.1 wastes vertical space in most panels. Rebuild the `mpg` facet plot and free the y-axis per panel with `scales = "free_y"`. Save to `ex_3_1`.

**Expected result:**

```
#> ggplot output saved as ex_3_1.
#> 7 panels, each with an independent y-axis range.
#> 2seater panel y-range narrow (around 20-30 mpg).
#> Pickup panel y-range wider (around 15-25 mpg).
#> X-axis (displacement) still shared across all panels.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(color = "darkgreen", alpha = 0.7) +
  facet_wrap(~ class, scales = "free_y") +
  labs(x = "Displacement (L)", y = "Highway MPG") +
  theme_minimal()

ex_3_1
#> Each class now stretches to fill its panel vertically.
```

**Explanation:** `scales = "free_y"` releases the y-axis per panel while keeping x shared. The four options are `"fixed"` (default), `"free_x"`, `"free_y"`, and `"free"` (both). Free scales make within-panel patterns easier to read but they kill cross-panel comparison: a slope of 5 in one panel may look identical to a slope of 50 elsewhere. Use free scales when each panel tells its own story; use fixed when readers should compare magnitudes across panels.

</details>

### Exercise 3.2: Free both axes on a multi-metric panel built from inline data

**Task:** A monitoring dashboard tracks three unrelated server metrics (CPU percent, memory GB, request count) over the same 24 hours, but the metric ranges differ by orders of magnitude. Build the inline tibble below, pivot to long form, then facet by metric with `scales = "free"` so each metric reads on its own axes. Save the plot to `ex_3_2`.

```r title="Inline data for Exercise 3.2"
metrics <- tibble(
  hour    = 0:23,
  cpu_pct = c(12, 14, 11, 9, 8, 10, 15, 22, 38, 45, 52, 60, 58, 55, 48, 40, 36, 30, 24, 20, 18, 16, 14, 12),
  mem_gb  = c(8.1, 8.2, 8.1, 8.0, 7.9, 8.0, 8.3, 9.1, 10.2, 11.5, 12.4, 13.1, 13.0, 12.6, 11.9, 11.0, 10.4, 9.8, 9.2, 8.8, 8.6, 8.4, 8.3, 8.2),
  req_cnt = c(120, 100, 80, 60, 50, 65, 140, 320, 720, 980, 1180, 1420, 1380, 1300, 1100, 880, 740, 560, 420, 320, 260, 220, 180, 150)
)
```

**Expected result:**

```
#> ggplot output saved as ex_3_2.
#> 3 panels (one per metric), each with its own y-axis scale.
#> cpu_pct panel: y-axis roughly 0-60.
#> mem_gb panel: y-axis roughly 7.5-13.5.
#> req_cnt panel: y-axis roughly 0-1500.
#> All panels share the x-axis (hour 0-23).
```

**Difficulty:** Advanced

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- metrics |>
  pivot_longer(-hour, names_to = "metric", values_to = "value") |>
  ggplot(aes(x = hour, y = value)) +
  geom_line(color = "midnightblue", linewidth = 0.8) +
  facet_wrap(~ metric, scales = "free", ncol = 1) +
  labs(x = "Hour of day", y = NULL) +
  theme_minimal()

ex_3_2
#> 3 stacked panels with independent y-scales; same x-axis hour 0-23.
```

**Explanation:** `scales = "free"` frees both axes per panel, which is the standard pattern for stacked time-series dashboards where metrics share the time axis but live in incompatible units. Pivoting to long form is the canonical setup: ggplot wants one row per (panel, observation). The alternative is `patchwork::wrap_plots()` of three separate ggplot objects, which gives finer control over individual panel themes but loses the shared time axis that `facet_wrap` provides for free.

</details>

### Exercise 3.3: Proportional column widths with space="free_x"

**Task:** A product manager wants a bar chart of average `price` per `clarity` level on `diamonds`, faceted by `cut` in columns, where each column's width is proportional to how many clarity levels appear in that cut. Use `facet_grid` with both `scales = "free_x"` and `space = "free_x"`. Save the plot to `ex_3_3`.

**Expected result:**

```
#> ggplot output saved as ex_3_3.
#> 1 row, 5 columns (one per cut: Fair...Ideal).
#> Each column shows bar chart of mean price by clarity (8 clarity levels possible).
#> Column widths vary: panels with fewer distinct clarity levels are narrower.
#> X-axis (clarity) labels appear only inside each panel, no shared scale.
```

**Difficulty:** Advanced

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- diamonds |>
  group_by(cut, clarity) |>
  summarise(mean_price = mean(price), .groups = "drop") |>
  ggplot(aes(x = clarity, y = mean_price, fill = clarity)) +
  geom_col(show.legend = FALSE) +
  facet_grid(~ cut, scales = "free_x", space = "free_x") +
  scale_y_continuous(labels = label_dollar()) +
  labs(x = "Clarity", y = "Mean price") +
  theme_minimal()

ex_3_3
#> 5 panels in one row, each width proportional to its clarity count.
```

**Explanation:** `scales = "free_x"` alone would make each panel the same width but with different tick sets, leaving awkward whitespace. Adding `space = "free_x"` rescales the panels themselves so each bar gets equal horizontal space across the whole plot. This is the trick for nested-bar layouts (e.g. tasks grouped by sprint, where some sprints have more tasks): readers see honest visual proportion rather than padded panels.

</details>

## Section 4. Custom strip labels (3 problems)

### Exercise 4.1: Replace cryptic class codes with full names via as_labeller

**Task:** The `mpg` class strip labels read "2seater", "compact", "midsize", "minivan", "pickup", "subcompact", "suv", which are too terse for a public report. Build a named vector that maps each code to a polished label ("Two-Seater", "Compact Car", etc.), then pass it to `as_labeller()` inside `facet_wrap()`. Save the plot to `ex_4_1`.

**Expected result:**

```
#> ggplot output saved as ex_4_1.
#> 7 panels with cleaner strip labels.
#> Strips read: "Two Seater", "Compact Car", "Midsize Sedan", "Minivan", "Pickup Truck", "Subcompact", "SUV".
#> Plot content unchanged from Exercise 1.1.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
nice_labels <- c(
  "2seater"    = "Two Seater",
  "compact"    = "Compact Car",
  "midsize"    = "Midsize Sedan",
  "minivan"    = "Minivan",
  "pickup"     = "Pickup Truck",
  "subcompact" = "Subcompact",
  "suv"        = "SUV"
)

ex_4_1 <- ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(color = "steelblue", alpha = 0.7) +
  facet_wrap(~ class, labeller = as_labeller(nice_labels)) +
  labs(x = "Displacement (L)", y = "Highway MPG") +
  theme_minimal()

ex_4_1
#> Strip labels: Two Seater | Compact Car | Midsize Sedan | Minivan | Pickup Truck | Subcompact | SUV.
```

**Explanation:** `as_labeller()` accepts a named character vector where names match the data values and values are the desired labels. Anything missing from the vector falls back to the raw value, which is forgiving when categories are added later. For programmatic transforms (e.g. uppercase, title case) pass a function instead: `labeller = as_labeller(toupper)`. For complex two-line strip text with variable name plus value use `labeller = label_both` (see Exercise 4.2).

</details>

### Exercise 4.2: Show variable name and value with label_both

**Task:** A teaching slide needs strip labels in `facet_grid(drv ~ cyl)` to read "drv: 4" and "cyl: 6" rather than just "4" or "6", so students can tell which strip belongs to which variable. Rebuild the grid from Exercise 2.1 and pass `labeller = label_both`. Save to `ex_4_2`.

**Expected result:**

```
#> ggplot output saved as ex_4_2.
#> 12-cell grid as in Exercise 2.1.
#> Row strips read: "drv: 4", "drv: f", "drv: r".
#> Column strips read: "cyl: 4", "cyl: 5", "cyl: 6", "cyl: 8".
```

**Difficulty:** Beginner

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(color = "darkblue", alpha = 0.7) +
  facet_grid(drv ~ cyl, labeller = label_both) +
  labs(x = "Displacement (L)", y = "Highway MPG") +
  theme_minimal()

ex_4_2
#> Strips include the variable name prefix on every panel.
```

**Explanation:** `label_both` is a ready-made labeller function that prefixes each strip with its variable name. It is the cheapest way to make a multi-variable grid self-documenting, especially for audiences who will not see the axis legend. Cousins are `label_value` (default, value only), `label_parsed` (parses strings as math expressions, see Exercise 4.3), and `label_bquote` (substitutes values into a math expression template).

</details>

### Exercise 4.3: Render Greek letters in strip labels with label_parsed

**Task:** A statistics handout needs facet strips to render as Greek symbols ("alpha = 0.05", "alpha = 0.10") with `alpha` displayed as the Greek letter. Build the inline tibble below, then facet by `alpha_level` using `labeller = label_parsed` so plotmath syntax is rendered. Save to `ex_4_3`.

```r title="Inline data for Exercise 4.3"
power_grid <- tibble(
  n           = rep(seq(10, 100, by = 10), 2),
  power       = c(0.20, 0.35, 0.48, 0.60, 0.70, 0.78, 0.85, 0.90, 0.93, 0.96,
                  0.10, 0.18, 0.27, 0.36, 0.45, 0.54, 0.62, 0.70, 0.76, 0.81),
  alpha_level = rep(c("alpha == 0.05", "alpha == 0.10"), each = 10)
)
```

**Expected result:**

```
#> ggplot output saved as ex_4_3.
#> 2 panels side by side, each plotting power vs n.
#> Strip labels render with the Greek letter alpha, e.g. "alpha = 0.05" appears as the symbol.
#> Power curves both monotonic increasing, the 0.10 panel sits below the 0.05 panel.
```

**Difficulty:** Advanced

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- ggplot(power_grid, aes(x = n, y = power)) +
  geom_line(color = "firebrick", linewidth = 1) +
  geom_point() +
  facet_wrap(~ alpha_level, labeller = label_parsed) +
  labs(x = "Sample size n", y = "Power") +
  theme_minimal()

ex_4_3
#> 2 panels with Greek-letter strip labels rendered via plotmath.
```

**Explanation:** `label_parsed` runs each strip label through R's plotmath parser, so strings like `"alpha == 0.05"` render as the Greek alpha followed by an equals sign and the value. The double `==` is plotmath syntax for an equals sign symbol (single `=` is reserved for assignment in expressions). When labels are dynamic, build them with `sprintf` or `paste`: `paste0("alpha == ", round(a, 2))`.

</details>

## Section 5. Advanced and combination workflows (3 problems)

### Exercise 5.1: Add a "Total" margin panel with margins = TRUE

**Task:** A pivot-table-style report needs a `facet_grid()` plot of `mpg` MPG by `drv` (rows) and `cyl` (columns) that also includes summary panels showing the aggregate across all rows and all columns (like a spreadsheet "Total" row and column). Set `margins = TRUE` on `facet_grid`. Save the plot to `ex_5_1`.

**Expected result:**

```
#> ggplot output saved as ex_5_1.
#> Original 12-cell grid plus extra row and column for "(all)" totals.
#> Bottom row strip reads "(all)" and aggregates all cylinder values.
#> Rightmost column strip reads "(all)" and aggregates all drive types.
#> Bottom-right corner cell shows the full data combined.
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(color = "darkorange", alpha = 0.6) +
  facet_grid(drv ~ cyl, margins = TRUE) +
  labs(x = "Displacement (L)", y = "Highway MPG") +
  theme_minimal()

ex_5_1
#> Original grid plus an extra "(all)" row, "(all)" column, and grand-total cell.
```

**Explanation:** `margins = TRUE` duplicates the data into extra synthetic categories named `(all)` for each faceting variable, giving you the "Total" panels seen in pivot tables. To add margins only for one variable, pass the variable name as a string: `margins = "drv"`. The trade-off is that data is duplicated, which inflates rendering time on large datasets and can mislead naive readers into thinking the totals are independent samples.

</details>

### Exercise 5.2: Overlay all-data context behind each facet panel

**Task:** A reviewer wants every `mpg` class panel to show its own points in steel-blue plus the *full* `mpg` dataset in grey as background context, so readers see where the class sits within the whole cloud. Build a plot that calls `geom_point()` twice: once with the full `mpg` minus the facet column, once with the regular data. Save to `ex_5_2`.

**Expected result:**

```
#> ggplot output saved as ex_5_2.
#> 7 panels (one per class).
#> Each panel: light-grey backdrop of all 234 mpg points + colored foreground for that class.
#> The colored cluster sits within the grey cloud, making the class's region obvious.
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_2 <- ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(data = transform(mpg, class = NULL),
             color = "grey80", size = 1) +
  geom_point(color = "steelblue", size = 1.6) +
  facet_wrap(~ class) +
  labs(x = "Displacement (L)", y = "Highway MPG") +
  theme_minimal()

ex_5_2
#> Each panel: grey backdrop + blue class points.
```

**Explanation:** Setting `class = NULL` on the background data strips the facet variable so the first `geom_point` is drawn identically in every panel, producing the grey context cloud. The second `geom_point` keeps `class` and is therefore subset by `facet_wrap` to only that panel's points. This trick is one of the highest-impact reads in dashboard design: instead of asking readers to mentally overlay panels, you show the global cloud once and highlight the focal subset.

</details>

### Exercise 5.3: Use facet_wrap with strip.position to mimic a small-multiple bar chart

**Task:** A finance analyst wants a quarterly revenue bar chart split into one mini-panel per region, with the region label shown along the *bottom* of each panel (not the default top), to match a published report style. Build the inline tibble below and facet by region with `strip.position = "bottom"`. Save the plot to `ex_5_3`.

```r title="Inline data for Exercise 5.3"
revenue <- tibble(
  region  = rep(c("APAC", "EMEA", "LATAM", "NA"), each = 4),
  quarter = rep(c("Q1", "Q2", "Q3", "Q4"), times = 4),
  rev_m   = c(12, 14, 16, 18,
              22, 24, 21, 26,
               5,  6,  7,  9,
              30, 32, 35, 38)
)
```

**Expected result:**

```
#> ggplot output saved as ex_5_3.
#> 4 panels in a single row (one per region).
#> Each panel: bar chart of rev_m by quarter (Q1...Q4).
#> Strip labels (region names) appear under each panel, not above.
#> Bars colored by quarter for visual variety.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_3 <- ggplot(revenue, aes(x = quarter, y = rev_m, fill = quarter)) +
  geom_col(show.legend = FALSE) +
  facet_wrap(~ region, nrow = 1, strip.position = "bottom") +
  scale_y_continuous(labels = label_dollar(suffix = "M")) +
  labs(x = NULL, y = "Revenue") +
  theme_minimal() +
  theme(strip.placement = "outside",
        strip.background = element_rect(fill = "grey95", color = NA))

ex_5_3
#> 4 panels in one row, region labels under each panel.
```

**Explanation:** `strip.position = "bottom"` flips the default top strip to the bottom, which matches how many published bar-chart series are typeset (region name beneath the bars, like a caption). Pair it with `theme(strip.placement = "outside")` so the strip sits below the axis text rather than between the axis and the bars. The four valid positions are `"top"` (default), `"bottom"`, `"left"`, and `"right"`. Use `"left"` or `"right"` for stacked rows of horizontal bar charts.

</details>

## What to do next

- Review the parent guide: [ggplot2 Facets](ggplot2-Facets.html) covers theory and the function reference.
- Practice color and theme work: [ggplot2 Theme Exercises](ggplot2-Theme-Exercises.html).
- Build the underlying charts: [ggplot2 Bar Chart Exercises](ggplot2-Bar-Chart-Exercises.html) and [ggplot2 Scatter Plot Exercises](ggplot2-Scatter-Plot-Exercises.html).
- Apply faceting to real EDA: [Exploratory Data Analysis Exercises in R](Exploratory-Data-Analysis-Exercises-in-R.html).
