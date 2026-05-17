---
title: "ggplot2 Facets Exercises in R: 20 Practice Problems"
slug: "ggplot2-Facets-Exercises-in-R"
description: "Practice ggplot2 facets with 20 problems covering facet_wrap, facet_grid, free scales, strip labels, small multiples, and panel ordering. Hidden solutions."
keywords: "facet_wrap exercises, ggplot facet practice, ggplot2 facets exercises, facet_grid r practice, small multiples ggplot"
mathjax: false
webr: true
date: "2026-05-12"
post_type: "EX"
sidebar_title: "ggplot2 Facets Exercises"
sidebar_order: 142
fr_parent: "Complete-Ggplot2-Tutorial-Part2-Customizing-the-Look-and-Feel.html"
auto_link_terms: "facet_wrap exercises|facet_grid r practice|ggplot facet practice|ggplot2 facets exercises|small multiples ggplot"
auto_link_case_sensitive: false
target_keyword: "facet_wrap exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# ggplot2 Facets Exercises in R: 20 Practice Problems

<p class="lead">Twenty practice problems on ggplot2 facets covering facet_wrap, facet_grid, free and proportional scales, strip styling, multi-line labels, panel reordering, and the small-multiples idioms used in dashboards. Solutions stay hidden until you reveal them.</p>

```r title="Run this once before any exercise"
library(ggplot2)
library(dplyr)
library(tidyr)
```

## Section 1. facet_wrap fundamentals (4 problems)

### Exercise 1.1: Split a scatterplot into one panel per car class

**Task:** A used-car analyst is comparing how engine displacement relates to highway mpg for each vehicle category in the built-in `mpg` dataset. Build a scatterplot of `hwy` against `displ` and use `facet_wrap()` to split it into one panel per `class`. Save the plot to `ex_1_1`.

**Expected result:**

```
# A faceted scatterplot: x = displ, y = hwy, points in default black,
# one panel per class (compact, midsize, minivan, pickup, subcompact, suv, 2seater).
# Default 3-column layout with strip labels at the top of each panel.
```

**Difficulty:** Beginner

[HINTS]
Think about which single discrete column splits the data into the categories you want one panel for.
Add facet_wrap() with a one-sided formula ~ class to the scatter.

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- ggplot(mpg, aes(displ, hwy)) +
  geom_point() +
  facet_wrap(~ class)

ex_1_1
```

**Explanation:** `facet_wrap()` takes a one-sided formula `~ class` and generates one panel per level of `class`, packing them into a rough grid. ggplot picks a default `ncol` from the panel count and the plot aspect ratio. The formula form `~ class` is shorthand for `vars(class)`, and the `vars()` style is preferred in newer code because it cooperates better with tidy-eval helpers when you want to facet programmatically.

</details>

### Exercise 1.2: Force a two-row layout with nrow

**Task:** Reusing the `mpg` scatterplot of `hwy` against `displ`, rearrange the seven `class` panels into exactly two rows so they fit cleanly inside a wide report column without losing readability. Save the plot to `ex_1_2`.

**Expected result:**

```
# Same scatter as 1.1, but panels arranged in exactly 2 rows by 4 columns.
# The eighth cell stays empty because there are only 7 classes.
```

**Difficulty:** Beginner

[HINTS]
You need to pin how many rows the panel grid uses and let the other dimension fill in automatically.
Pass nrow = 2 to facet_wrap(~ class).

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- ggplot(mpg, aes(displ, hwy)) +
  geom_point() +
  facet_wrap(~ class, nrow = 2)

ex_1_2
```

**Explanation:** Set `nrow = 2` and ggplot picks the column count automatically. Pin one or the other (`nrow` OR `ncol`), not both: if you set both and they undercount the levels, ggplot silently drops panels. The cleaner pattern is to fix the dimension that matches your page geometry and let ggplot pick the other.

</details>

### Exercise 1.3: Let each panel pick its own y-axis range

**Task:** A retail analyst inspecting the `txhousing` dataset wants a line chart of monthly `median` price by `date` for the cities Austin, Dallas, Houston, San Antonio, and Fort Worth, with each city on its own y-axis range so small-market detail does not get crushed by Houston. Save the plot to `ex_1_3`.

**Expected result:**

```
# 5 panels of median price line over time, one per city.
# Each panel uses its own y-axis range (Austin roughly 80k to 300k,
# Dallas roughly 115k to 220k, etc). The x-axis date is shared.
```

**Difficulty:** Intermediate

[HINTS]
Each panel should be allowed to rescale its vertical axis on its own while the horizontal axis stays shared.
Set the scales argument of facet_wrap() to "free_y".

```r title="Your turn"
big_5 <- txhousing |>
  filter(city %in% c("Austin", "Dallas", "Houston", "San Antonio", "Fort Worth"))

ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
big_5 <- txhousing |>
  filter(city %in% c("Austin", "Dallas", "Houston", "San Antonio", "Fort Worth"))

ex_1_3 <- ggplot(big_5, aes(date, median)) +
  geom_line() +
  facet_wrap(~ city, scales = "free_y")

ex_1_3
```

**Explanation:** `scales = "free_y"` lets each panel rescale its y-axis independently while keeping the x-axis common. It is the right call when panel magnitudes differ but trend shape is what matters. `scales = "free"` frees both axes; `"free_x"` frees only the x. For strict cross-city comparison of absolute price, leave it at the default `"fixed"` so the eye reads magnitude correctly.

</details>

### Exercise 1.4: Rename facet strip labels without renaming the column

**Task:** The previous Texas housing chart shows "Austin", "Dallas", and the rest on its strip labels, but the executive deck needs "Austin TX", "Dallas TX", and so on. Rebuild the facet plot using `as_labeller()` so the source column stays unchanged but the strip text appends " TX" to each city. Save the plot to `ex_1_4`.

**Expected result:**

```
# Same 5-panel layout as 1.3 but strip labels read
# "Austin TX", "Dallas TX", "Fort Worth TX", "Houston TX", "San Antonio TX".
```

**Difficulty:** Intermediate

[HINTS]
You want only the displayed panel text to change, not the underlying data column.
Pass a labeller built with as_labeller() to facet_wrap(); the wrapped function can paste "TX" onto each value.

```r title="Your turn"
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
city_labeller <- as_labeller(function(x) paste(x, "TX"))

ex_1_4 <- ggplot(big_5, aes(date, median)) +
  geom_line() +
  facet_wrap(~ city, scales = "free_y", labeller = city_labeller)

ex_1_4
```

**Explanation:** `as_labeller()` wraps any function so ggplot treats it as a panel-label transformer. A named character vector works too: `as_labeller(c(Austin = "Austin TX", ...))` for one-off cases. The advantage over editing the source column is that joins, sorts, and downstream summaries still see clean values like "Austin"; only the display layer changes.

</details>

## Section 2. facet_grid layouts (4 problems)

### Exercise 2.1: Cross-classify points with facet_grid

**Task:** A used-car reviewer wants to see `hwy` vs `displ` from `mpg` cross-tabulated by drivetrain (`drv`) on rows and number of cylinders (`cyl`) on columns. Build the scatter and apply `facet_grid()` with `drv` on the y-direction and `cyl` on the x-direction. Save the plot to `ex_2_1`.

**Expected result:**

```
# Grid of 3 rows (drv = 4, f, r) by 4 cols (cyl = 4, 5, 6, 8) for up to 12 panels.
# Some panels stay empty (e.g. rear-drive 4-cylinder); shared x and y axes across all.
```

**Difficulty:** Intermediate

[HINTS]
Two discrete variables define a strict rows-by-columns matrix of panels here.
Use facet_grid() with a two-sided formula drv ~ cyl.

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- ggplot(mpg, aes(displ, hwy)) +
  geom_point() +
  facet_grid(drv ~ cyl)

ex_2_1
```

**Explanation:** `facet_grid()` lays panels out on a strict rows-by-columns matrix and shows empty cells for missing combinations, which is useful for spotting sparsity (no rear-drive 4-cylinder, no 5-cyl rear-drive) at a glance. Compare with `facet_wrap()`, which packs only the present combinations and loses the cross-tab structure. Use grid when the row and column dimensions carry meaning; wrap when they do not.

</details>

### Exercise 2.2: Stack panels in a single column with the dot placeholder

**Task:** The same used-car scatter of `hwy` against `displ` from `mpg` needs to be split into three stacked panels, one per drivetrain (`drv`), all sharing the x-axis so vertical comparison is straightforward. Use `facet_grid()` with the `.` placeholder for columns. Save the plot to `ex_2_2`.

**Expected result:**

```
# 3 stacked panels (drv = 4, then f, then r), each spanning the full plot width.
# Shared x = displ, shared y = hwy. Strip labels sit on the right edge.
```

**Difficulty:** Intermediate

[HINTS]
You want panels stacked vertically with no second faceting dimension on the columns.
Use facet_grid() with the . placeholder on the column side: drv ~ .

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- ggplot(mpg, aes(displ, hwy)) +
  geom_point() +
  facet_grid(drv ~ .)

ex_2_2
```

**Explanation:** `drv ~ .` reads as "facet rows by `drv`, no column variable." Mirror image `. ~ drv` gives three side-by-side panels instead. Stacking is the cleanest way to compare distributions vertically because the x-axis is locked and the eye scans cleanly down. `facet_wrap(~ drv, ncol = 1)` does almost the same thing, but `facet_grid` keeps the strip on a fixed side and never reflows.

</details>

### Exercise 2.3: Show marginal totals with facet_grid margins

**Task:** Continuing with the `mpg` data, build a `facet_grid(drv ~ cyl)` scatter of `hwy` vs `displ` and add marginal panels along the right side and bottom that summarize across the other factor. The marginals make the per-row, per-column, and overall trends visible in one figure. Save the plot to `ex_2_3`.

**Expected result:**

```
# Same 3x4 grid as 2.1 plus an extra "(all)" row and "(all)" column
# containing the rolled-up scatter across the marginalized dimension.
# Net layout: 4 rows by 5 cols, last row and last col labeled "(all)".
```

**Difficulty:** Advanced

[HINTS]
The figure should include extra panels that roll the data up across each faceting dimension.
Add margins = TRUE to facet_grid(drv ~ cyl).

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- ggplot(mpg, aes(displ, hwy)) +
  geom_point() +
  facet_grid(drv ~ cyl, margins = TRUE)

ex_2_3
```

**Explanation:** `margins = TRUE` adds an extra row, an extra column, and a corner panel that aggregate across the other dimension. You can also pass a vector like `margins = "drv"` to add only the row margin. Marginals are essential when stakeholders want both the slice and the overall picture in one chart. Watch out: every observation now appears in multiple panels (one cell, one row-margin, one col-margin, one grand total), so do not compute counts from the rendered figure.

</details>

### Exercise 2.4: Free the y-axis per row in a facet_grid

**Task:** A trial analyst studying `ChickWeight` wants to look at weight trajectories on a `Time` x-axis split into one row per `Diet` (1, 2, 3, 4), with each row allowed its own y-axis range because diet 3 and diet 4 trend higher than the other two. Use `facet_grid()` with the appropriate `scales` argument. Save the plot to `ex_2_4`.

**Expected result:**

```
# 4 stacked panels (Diet 1 to 4) of weight vs Time, one line per Chick.
# Each row has its own y-axis range; the x-axis Time is shared.
```

**Difficulty:** Intermediate

[HINTS]
Each row of the grid should be allowed its own vertical range while sharing the horizontal one.
Use facet_grid(Diet ~ .) with scales = "free_y".

```r title="Your turn"
ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_4 <- ggplot(ChickWeight, aes(Time, weight, group = Chick)) +
  geom_line(alpha = 0.5) +
  facet_grid(Diet ~ ., scales = "free_y")

ex_2_4
```

<p>

**Explanation:** In `facet_grid()`, `scales = "free_y"` frees the y per row (not per cell), and `"free_x"` frees the x per column. This is because grid preserves the cross-tab structure: every panel in a row shares a y by design, every panel in a column shares an x. Only `facet_wrap()` lets every individual panel float on both axes via `scales = "free"`.

</p>

</details>

## Section 3. Scales, space, and panel order (3 problems)

### Exercise 3.1: Allocate panel height proportional to bar count

**Task:** Filter `mpg` to four manufacturers (audi, chevrolet, honda, toyota), count vehicles by `class` within each, and build a horizontal bar chart faceted by `manufacturer` in stacked rows. Use `space = "free_y"` so panels with fewer classes occupy less vertical space than panels with more. Save the plot to `ex_3_1`.

**Expected result:**

```
# 4 horizontally-stacked panels (audi, chevrolet, honda, toyota).
# Each panel: y = class, x = n. Panel height varies: honda (2 classes) shortest,
# chevrolet (5 classes) tallest. Default geom_col() blue-grey bars of equal thickness.
```

**Difficulty:** Advanced

[HINTS]
Panel heights should track how many categories each panel contains so bar thickness stays constant across panels.
Combine scales = "free_y" with space = "free_y" inside facet_grid(manufacturer ~ .).

```r title="Your turn"
mfr_counts <- mpg |>
  filter(manufacturer %in% c("audi", "chevrolet", "honda", "toyota")) |>
  count(manufacturer, class)

ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mfr_counts <- mpg |>
  filter(manufacturer %in% c("audi", "chevrolet", "honda", "toyota")) |>
  count(manufacturer, class)

ex_3_1 <- ggplot(mfr_counts, aes(n, class)) +
  geom_col() +
  facet_grid(manufacturer ~ ., scales = "free_y", space = "free_y")

ex_3_1
```

**Explanation:** `scales = "free_y"` lets each panel show only the categories that actually exist in that subset (otherwise honda would display empty bars for "pickup", "minivan", and the rest). `space = "free_y"` then scales the row heights with the category count, so every bar stays the same physical thickness across panels. Without `space`, every panel gets equal height and the bars in shorter panels balloon while bars in taller panels get squeezed thin.

</details>

### Exercise 3.2: Fix the lower y-bound but free the upper bound per panel

**Task:** A trial analyst showing the `ChickWeight` weight curves faceted by `Diet` wants each panel's y-axis to start at zero but stretch upward to whatever value its own data needs. Build the plot using a layered blank data frame that injects a `y = 0` anchor into every panel, then apply `scales = "free_y"`. Save the plot to `ex_3_2`.

**Expected result:**

```
# 4 panels (Diet 1 to 4) of weight vs Time, one line per Chick.
# Each y-axis starts cleanly at 0; the upper bound varies per panel
# (Diet 1 reaches roughly 300, Diet 3 reaches roughly 370).
```

**Difficulty:** Advanced

[HINTS]
You need an invisible reference value forced into every panel so the lower bound lands at zero without capping the top.
Add a geom_blank() layer fed a small data frame carrying weight = 0 for each Diet, alongside facet_wrap(~ Diet, scales = "free_y").

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
zero_anchor <- data.frame(
  Diet = factor(1:4),
  Time = 0,
  weight = 0
)

ex_3_2 <- ggplot(ChickWeight, aes(Time, weight, group = Chick)) +
  geom_line(alpha = 0.5) +
  geom_blank(data = zero_anchor, aes(Time, weight, group = NULL)) +
  facet_wrap(~ Diet, scales = "free_y")

ex_3_2
```

**Explanation:** `coord_cartesian(ylim = c(0, NA))` would clip every panel to the same range and defeat `scales = "free_y"`. `geom_blank()` is the idiomatic workaround: it injects an invisible point in each panel that anchors the lower bound at 0 without forcing an upper bound. The same trick works for pinning an upper limit or guaranteeing a specific tick mark appears in every panel.

</details>

### Exercise 3.3: Reorder facet panels by a summary statistic

**Task:** A reviewer wants `mpg` faceted by `class` but with panels arranged by descending median `hwy` so the most fuel-efficient class appears in the top-left, not in alphabetical order. Reorder `class` into a factor using `reorder()` before plotting, then use `facet_wrap()`. Save the plot to `ex_3_3`.

**Expected result:**

```
# 7 panels in this order: subcompact, compact, midsize, 2seater, minivan, suv, pickup
# (descending median hwy). Each panel is the usual hwy-vs-displ scatter.
```

**Difficulty:** Intermediate

[HINTS]
Panel order follows the factor-level order of the faceting column, so re-level that column before plotting.
Inside mutate(), wrap class with reorder(class, -hwy, FUN = median), then facet_wrap() as usual.

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mpg_ord <- mpg |>
  mutate(class = reorder(class, -hwy, FUN = median))

ex_3_3 <- ggplot(mpg_ord, aes(displ, hwy)) +
  geom_point() +
  facet_wrap(~ class)

ex_3_3
```

**Explanation:** Facet panel order follows the factor-level order of the faceting variable. Base R's `reorder()` re-levels by a summary statistic (median, mean, custom function), and the negative sign on `-hwy` flips the order to descending. The forcats equivalent is `fct_reorder(class, hwy, .fun = median, .desc = TRUE)`, which reads more clearly when the rest of the pipeline uses tidyverse helpers.

</details>

## Section 4. Strip labels and styling (4 problems)

### Exercise 4.1: Style facet strips with a custom theme

**Task:** The Texas housing chart from earlier is being repurposed for a brand-aligned PDF. Restyle each panel's strip background to a dark slate fill with bold white text at 11 point, using `theme()` elements. Apply the change to the five-city price-over-time facet plot. Save the plot to `ex_4_1`.

**Expected result:**

```
# 5 facet panels of median price vs date.
# Strip backgrounds rendered in slate (#2C3E50) with white bold 11pt text labels.
# Plot body (lines, axes) unchanged from 1.3.
```

**Difficulty:** Intermediate

[HINTS]
The strip rectangle and the strip text are separate theme pieces you can target independently.
In theme(), set strip.background with element_rect(fill = ...) and strip.text with element_text(colour, face, size).

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- ggplot(big_5, aes(date, median)) +
  geom_line() +
  facet_wrap(~ city, scales = "free_y") +
  theme(
    strip.background = element_rect(fill = "#2C3E50", colour = NA),
    strip.text       = element_text(colour = "white", face = "bold", size = 11)
  )

ex_4_1
```

**Explanation:** `strip.background` controls the rectangle behind each strip label; `strip.text` controls the text itself. Both accept the same `element_rect()` and `element_text()` arguments familiar from any ggplot theme tweak. For top-only or side-only customization, use the suffixed variants `strip.background.x`, `strip.background.y`, `strip.text.x`, `strip.text.y` instead.

</details>

### Exercise 4.2: Wrap long facet labels onto multiple lines

**Task:** Build a price-vs-carat scatter of `diamonds`, faceted by a derived `clarity_long` column that uses full descriptive grade names like "Very Very Slightly Included 1". Apply `label_wrap_gen()` so labels wider than 18 characters wrap onto two lines instead of overflowing the strip. Save the plot to `ex_4_2`.

**Expected result:**

```
# 8 panels of price vs carat scatter. Strip labels show the full grade names
# wrapped at roughly 18 chars (e.g. "Very Slightly\nIncluded 2"), no overflow.
```

**Difficulty:** Intermediate

[HINTS]
Long labels need to break across lines once they exceed a character budget.
Pass labeller = label_wrap_gen(width = 18) to facet_wrap().

```r title="Your turn"
diamonds_long <- diamonds |>
  mutate(clarity_long = recode(clarity,
    I1   = "Included Grade 1",
    SI2  = "Slightly Included 2",
    SI1  = "Slightly Included 1",
    VS2  = "Very Slightly Included 2",
    VS1  = "Very Slightly Included 1",
    VVS2 = "Very Very Slightly Included 2",
    VVS1 = "Very Very Slightly Included 1",
    IF   = "Internally Flawless"
  ))

ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
diamonds_long <- diamonds |>
  mutate(clarity_long = recode(clarity,
    I1   = "Included Grade 1",
    SI2  = "Slightly Included 2",
    SI1  = "Slightly Included 1",
    VS2  = "Very Slightly Included 2",
    VS1  = "Very Slightly Included 1",
    VVS2 = "Very Very Slightly Included 2",
    VVS1 = "Very Very Slightly Included 1",
    IF   = "Internally Flawless"
  ))

ex_4_2 <- ggplot(diamonds_long, aes(carat, price)) +
  geom_point(alpha = 0.05) +
  facet_wrap(~ clarity_long, labeller = label_wrap_gen(width = 18))

ex_4_2
```

**Explanation:** `label_wrap_gen(width = N)` is a labeller factory that returns a function ggplot can call on every panel label. It breaks at word boundaries near `width` and inserts newlines, which the strip renders as multi-line text. The alternative `as_labeller(function(x) stringr::str_wrap(x, 18))` gives you finer control if the boundaries matter; `label_value` is the default when no wrapping is needed at all.

</details>

### Exercise 4.3: Show row and column variable names together with label_both

**Task:** The car-shopper wants the `mpg` data faceted by `drv` on rows and `cyl` on columns, with each strip label including the variable name as well as the level (e.g. "drv: 4" and "cyl: 6") instead of bare values, which makes the figure self-explanatory in a slide. Save the plot to `ex_4_3`.

**Expected result:**

```
# 3 by 4 grid of hwy-vs-displ scatter panels.
# Strips read "drv: 4" / "drv: f" / "drv: r" on the right
# and "cyl: 4" / "cyl: 5" / "cyl: 6" / "cyl: 8" on top.
```

**Difficulty:** Intermediate

[HINTS]
Each strip should announce the variable name as well as its level.
Pass labeller = label_both to facet_grid(drv ~ cyl).

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- ggplot(mpg, aes(displ, hwy)) +
  geom_point() +
  facet_grid(drv ~ cyl, labeller = label_both)

ex_4_3
```

**Explanation:** `label_both` is a ready-made labeller that prefixes each level with its variable name. It is a quick win for diagnostic plots where panel context is not obvious. The alternatives are `label_value` (default; just the level), `label_parsed` (treats labels as plotmath expressions), and `label_context` (mimics R's `print` for the variable's class). Combine labellers per facet axis with `labeller(drv = label_both, cyl = label_value)`.

</details>

### Exercise 4.4: Move facet strips to the bottom of each panel

**Task:** A poster designer wants the strip labels on a `facet_wrap` chart to sit BELOW each panel instead of above, freeing vertical space at the top for a large headline title. Build the `mpg` scatter faceted by `class` and place strips at the bottom using `strip.position`. Save the plot to `ex_4_4`.

**Expected result:**

```
# Same 7-panel hwy-vs-displ scatter as 1.1, but the class strip labels
# ("compact", "midsize", etc.) appear directly underneath each panel rather than above.
```

**Difficulty:** Beginner

[HINTS]
The strips need to move from above each panel to below it.
Set strip.position = "bottom" in facet_wrap(~ class).

```r title="Your turn"
ex_4_4 <- # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_4 <- ggplot(mpg, aes(displ, hwy)) +
  geom_point() +
  facet_wrap(~ class, strip.position = "bottom")

ex_4_4
```

**Explanation:** `strip.position` in `facet_wrap()` accepts "top" (default), "bottom", "left", or "right". For `facet_grid()`, use the `switch` argument instead: `switch = "x"` moves column strips to the bottom, `switch = "y"` moves row strips to the left, `switch = "both"` moves both. Bottom strips pair well with a top-anchored title that needs to dominate the space.

</details>

## Section 5. Faceting in real workflows (5 problems)

### Exercise 5.1: Small multiples for a long-format time series

**Task:** Reshape the built-in `economics` dataset into long format with one row per (date, metric) combination, then plot every metric over `date` as a small-multiples line chart using `facet_wrap()` with `scales = "free_y"`. The result is a quick dashboard of all five macro indicators. Save the plot to `ex_5_1`.

**Expected result:**

```
# 5 line panels (pce, pop, psavert, uempmed, unemploy) of value over date.
# Each y-axis has its own scale; the x-axis (date 1967 to 2015) is shared.
# Default 3-column layout.
```

**Difficulty:** Intermediate

[HINTS]
Small multiples need one row per (date, metric) pair, so reshape the data from wide to long first.
Use pivot_longer(-date, ...) to stack the columns, then facet_wrap(~ metric, scales = "free_y").

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
econ_long <- economics |>
  pivot_longer(-date, names_to = "metric", values_to = "value")

ex_5_1 <- ggplot(econ_long, aes(date, value)) +
  geom_line() +
  facet_wrap(~ metric, scales = "free_y")

ex_5_1
```

**Explanation:** Pivoting to long format is the standard prep for small multiples in ggplot: one row per "thing being plotted" lets `facet_wrap()` partition the data cleanly. `scales = "free_y"` is non-negotiable here because the metrics span very different magnitudes (population in hundreds of millions, savings rate in single-digit percent). The retired predecessor `gather()` still runs but `pivot_longer()` is the current idiom.

</details>

### Exercise 5.2: Facet a continuous variable by binning

**Task:** Bin the `carat` column of `diamonds` into four quartile groups using `ntile()`, then build a price-vs-depth scatter faceted by the resulting bin so each panel shows a roughly equal-sized slice of the carat distribution. Save the plot to `ex_5_2`.

**Expected result:**

```
# 4 panels (carat quartile Q1, Q2, Q3, Q4) of price vs depth scatter.
# Each panel holds roughly 25% of rows (~13,485 diamonds).
```

**Difficulty:** Intermediate

[HINTS]
Facets need a discrete column, so the continuous carat must first be cut into equal-sized groups.
Create a bin column with ntile(carat, 4) inside mutate(), then facet_wrap() on it.

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
diamonds_q <- diamonds |>
  mutate(carat_q = paste0("Q", ntile(carat, 4)))

ex_5_2 <- ggplot(diamonds_q, aes(depth, price)) +
  geom_point(alpha = 0.05) +
  facet_wrap(~ carat_q)

ex_5_2
```

**Explanation:** Facets need a discrete variable, so binning a continuous one is the standard bridge. `ntile()` from dplyr produces n equal-frequency bins; `cut()` from base produces equal-width bins; `cut_number()` from ggplot2 wraps the equal-frequency idea with auto-generated interval labels. Equal-frequency bins are best when distribution shape is the focus; equal-width when absolute value ranges are.

</details>

### Exercise 5.3: Highlight one panel by greying the rest

**Task:** Build a `mpg` scatter of `hwy` against `displ` faceted by `class`, but overlay the FULL dataset in light grey behind each panel so the focal class points stand out against the full-distribution backdrop. Use a layered-data trick: one geom with the global data, one with the per-panel data. Save the plot to `ex_5_3`.

**Expected result:**

```
# 7 panels. Each panel shows ALL ~234 mpg points in light grey
# with the panel's own class points overlaid in black.
# The grey "ghost" reveals how each class sits inside the overall distribution.
```

**Difficulty:** Advanced

[HINTS]
The grey backdrop comes from a copy of the data with no faceting column, so it repeats unfiltered in every panel.
Add a geom_point() layer whose data drops the class column (colour = "grey80") beneath the normal points, then facet_wrap(~ class).

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mpg_bg <- mpg |> select(-class)

ex_5_3 <- ggplot(mpg, aes(displ, hwy)) +
  geom_point(data = mpg_bg, colour = "grey80") +
  geom_point() +
  facet_wrap(~ class)

ex_5_3
```

**Explanation:** Dropping the faceting column from the background data frame is the trick: with `class` absent, ggplot has nothing to filter on per panel and replicates those points across every panel instead. Layer the panel-specific data on top so the focal points stay readable. This pattern beats the `gghighlight` package for simple cases because there are no extra dependencies and the draw order avoids antialiasing artifacts.

</details>

### Exercise 5.4: Add a per-panel summary statistic as a label

**Task:** For each `class` panel in a `mpg` scatter of `hwy` vs `displ`, annotate the top-left corner with that panel's mean highway mpg using `geom_text()` driven by a per-class summary data frame. The label should anchor regardless of panel scale. Save the plot to `ex_5_4`.

**Expected result:**

```
# 7 facet panels of hwy vs displ. Top-left of each panel has black text
# like "mean hwy = 28.3" for compact and "mean hwy = 16.9" for pickup.
```

**Difficulty:** Intermediate

[HINTS]
Each label comes from a separate summary table that must carry the faceting column so ggplot routes it to the right panel.
Build a per-class summary with group_by() and summarise(), then add geom_text() with x = -Inf, y = Inf and inherit.aes = FALSE.

```r title="Your turn"
ex_5_4 <- # your code here
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
class_means <- mpg |>
  group_by(class) |>
  summarise(mean_hwy = mean(hwy), .groups = "drop") |>
  mutate(label = sprintf("mean hwy = %.1f", mean_hwy))

ex_5_4 <- ggplot(mpg, aes(displ, hwy)) +
  geom_point() +
  geom_text(
    data = class_means,
    aes(x = -Inf, y = Inf, label = label),
    hjust = -0.1, vjust = 1.2, inherit.aes = FALSE
  ) +
  facet_wrap(~ class)

ex_5_4
```

**Explanation:** Setting `x = -Inf` and `y = Inf` plus `hjust` / `vjust` anchors the text to the top-left corner regardless of panel scale, so the label survives `scales = "free"`. `inherit.aes = FALSE` decouples the text layer from the global aesthetics so ggplot does not complain about missing `displ` or `hwy` columns in `class_means`. The summary data frame MUST carry the same faceting column so ggplot can route each label to the right panel.

</details>

### Exercise 5.5: Use facet_grid with two row variables via vars()

**Task:** A car-shopper wants `mpg` scatter panels laid out with both `drv` and `year` combined as the row dimension (so each unique drv-year pair gets its own row) and `cyl` on the columns. Use `vars()` to pass multiple faceting variables to `facet_grid()`. Save the plot to `ex_5_5`.

**Expected result:**

```
# 6 rows (drv x year combos: 4-1999, 4-2008, f-1999, f-2008, r-1999, r-2008)
# by 4 columns (cyl values). Strips on the right stack 2 lines: drv on top, year below.
```

**Difficulty:** Advanced

[HINTS]
Two variables can jointly define the row dimension of a grid layout.
Use facet_grid(rows = vars(drv, year), cols = vars(cyl)).

```r title="Your turn"
ex_5_5 <- # your code here
ex_5_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_5 <- ggplot(mpg, aes(displ, hwy)) +
  geom_point() +
  facet_grid(rows = vars(drv, year), cols = vars(cyl))

ex_5_5
```

**Explanation:** `vars()` accepts an arbitrary number of variables and stacks their strip labels in the panel margin. The formula syntax `drv + year ~ cyl` is equivalent but less explicit; `vars()` is the preferred current style. Each additional faceting variable multiplies the panel count, so check `dplyr::n_distinct()` before committing or you can produce hundreds of micro-panels that no longer fit on screen.

</details>

## What to do next

- [ggplot2 Themes Exercises in R](ggplot2-Themes-Exercises-in-R.html) for fine-grained chart styling that pairs naturally with custom strip themes.
- [ggplot2 Color Scales Exercises in R](ggplot2-Color-Scales-Exercises-in-R.html) to combine faceting with palette control.
- [dplyr Exercises in R](dplyr-Exercises-in-R.html) for the per-panel summary patterns used throughout this hub.
- [tidyr Pivot Exercises in R](tidyr-Pivot-Exercises-in-R.html) to drill the long-format reshaping that powers small-multiples plots.
