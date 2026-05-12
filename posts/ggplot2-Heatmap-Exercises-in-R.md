---
title: "ggplot2 Heatmap Exercises in R: 20 Real-World Practice Problems"
slug: "ggplot2-Heatmap-Exercises-in-R"
description: "Twenty ggplot2 heatmap exercises with hidden solutions: geom_tile, geom_raster, diverging palettes, clustered ordering, correlation grids, faceted retention."
keywords: "ggplot2 heatmap exercises, geom_tile R exercises, R heatmap practice, correlation heatmap ggplot, ggplot heatmap clustering"
mathjax: false
webr: true
date: "2026-05-12"
post_type: "EX"
sidebar_title: "ggplot2 Heatmap Exercises"
sidebar_order: 145
fr_parent: "Top50-Ggplot2-Visualizations-MasterList-R-Code.html"
auto_link_terms: "ggplot2 heatmap exercises|geom_tile r exercises|r heatmap practice|correlation heatmap ggplot|clustered heatmap r"
auto_link_case_sensitive: false
target_keyword: "ggplot2 heatmap exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# ggplot2 Heatmap Exercises in R: 20 Real-World Practice Problems

<p class="lead">Twenty interactive heatmap problems covering geom_tile fundamentals, diverging and viridis palettes, hierarchical row ordering, correlation matrices with significance masking, and faceted cohort retention. Each problem ships with a hidden full solution and a why-it-works explanation.</p>

```r title="Run this once before any exercise"
library(ggplot2)
library(dplyr)
library(tidyr)
library(tibble)
```

## Section 1. Foundations with geom_tile (4 problems)

### Exercise 1.1: Build a first heatmap from a long tibble of weekly call volume

**Task:** A telco operations lead wants a heatmap of inbound call volume by `day` (Mon to Sun) and `hour` (0 to 23) from a small inline tibble called `calls`. Use `geom_tile()` with `x = hour`, `y = day`, `fill = volume` to produce the heatmap and save the ggplot object to `ex_1_1`.

**Expected result:**

```
#> A ggplot heatmap with x = hour (0..23), y = day (Mon..Sun),
#> fill = volume in default blue gradient.
#> 7 rows x 24 cols = 168 tiles, no axis titles overridden.
```

**Difficulty:** Beginner

```r title="Your turn"
set.seed(1)
calls <- expand.grid(
  day  = c("Mon","Tue","Wed","Thu","Fri","Sat","Sun"),
  hour = 0:23
) |>
  dplyr::mutate(volume = round(runif(168, 10, 200)))

ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
calls <- expand.grid(
  day  = c("Mon","Tue","Wed","Thu","Fri","Sat","Sun"),
  hour = 0:23
) |>
  dplyr::mutate(volume = round(runif(168, 10, 200)))

ex_1_1 <- ggplot(calls, aes(x = hour, y = day, fill = volume)) +
  geom_tile()
ex_1_1
#> A 7x24 heatmap; default blue scale, lighter = higher volume.
```

**Explanation:** `geom_tile()` draws one rectangle per row of the data frame, centered on `(x, y)`. Because `calls` is already in long format (one row per cell), no reshaping is needed. The default continuous fill scale runs light-to-dark blue and is fine for a quick look. For a polished version you would override the palette and the categorical y-axis ordering, but the minimum heatmap is three aesthetics and one geom.

</details>

### Exercise 1.2: Reshape airquality into a month-by-day Ozone heatmap

**Task:** The built-in `airquality` dataset has one row per day with `Month`, `Day`, and `Ozone`. Pivot it into a heatmap with `Day` on the x-axis, `Month` on the y-axis, and fill encoding Ozone level. Drop rows where Ozone is missing before plotting, then save the ggplot object to `ex_1_2`.

**Expected result:**

```
#> A heatmap: x = Day (1..31), y = Month (5..9 as discrete),
#> fill = Ozone (ppb). Gaps where Ozone was NA.
#> Approximately 116 tiles drawn (153 days - 37 NA rows).
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_2 <- airquality |>
  # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- airquality |>
  filter(!is.na(Ozone)) |>
  ggplot(aes(x = Day, y = factor(Month), fill = Ozone)) +
  geom_tile() +
  labs(y = "Month")
ex_1_2
#> 116 tiles, blue gradient, y-axis levels 5,6,7,8,9.
```

**Explanation:** Wrapping `Month` in `factor()` forces it to be discrete, which is what you want for the y-axis of a calendar-style heatmap. If you left it numeric, ggplot2 would treat the axis as continuous and draw tiles overlapping the integer gridlines. Dropping NA Ozone rows is cleaner than passing them through because the default `na.value = "grey50"` clashes with the blue palette. An alternative is to keep NA rows and set `na.value = "white"` in the scale, covered in exercise 6.2.

</details>

### Exercise 1.3: Compare geom_tile and geom_raster on a 200x200 grid

**Task:** When the grid is large and regularly spaced, `geom_raster()` is much faster than `geom_tile()` because it draws a single rasterized image instead of N rectangles. Build a 200x200 grid of `(x, y, z)` where `z = sin(x/10) * cos(y/10)`, draw it with `geom_raster()`, and save the plot to `ex_1_3`.

**Expected result:**

```
#> A smooth raster image, 200 x 200 pixels, with diagonal
#> sinusoidal banding (interference pattern). Default fill
#> scale (light = high z, dark = low z).
```

**Difficulty:** Intermediate

```r title="Your turn"
grid_xy <- expand.grid(x = 1:200, y = 1:200) |>
  dplyr::mutate(z = sin(x / 10) * cos(y / 10))

ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
grid_xy <- expand.grid(x = 1:200, y = 1:200) |>
  mutate(z = sin(x / 10) * cos(y / 10))

ex_1_3 <- ggplot(grid_xy, aes(x = x, y = y, fill = z)) +
  geom_raster()
ex_1_3
#> Smooth 200x200 raster with sinusoidal interference bands.
```

**Explanation:** `geom_raster()` requires the data to lie on an evenly spaced grid; if rows are missing or spacing is irregular, it falls back to `geom_tile()` semantics but with no NA warning. For 40,000 cells the speedup over `geom_tile()` is typically 5x to 20x. A common mistake is to use `geom_tile()` on regular grids out of habit and then complain about render time. Rule of thumb: regular grid means raster, irregular or sparse means tile.

</details>

### Exercise 1.4: Heatmap of a manually built customer churn risk matrix

**Task:** A risk analyst wants to see churn rate by `tenure_band` (rows: 0-6m, 7-12m, 13-24m, 25m+) and `plan` (cols: Basic, Pro, Enterprise). Build the inline tibble below, then plot a `geom_tile()` heatmap with churn percentage as fill. Save the ggplot object to `ex_1_4`.

**Expected result:**

```
#> A 4x3 heatmap. Highest churn cell: 0-6m / Basic at ~38%.
#> Lowest cell: 25m+ / Enterprise at ~4%. Blue gradient.
```

**Difficulty:** Intermediate

```r title="Your turn"
churn <- tibble::tribble(
  ~tenure_band, ~plan,         ~churn_pct,
  "0-6m",      "Basic",        38,
  "0-6m",      "Pro",          22,
  "0-6m",      "Enterprise",   12,
  "7-12m",     "Basic",        28,
  "7-12m",     "Pro",          15,
  "7-12m",     "Enterprise",    9,
  "13-24m",    "Basic",        18,
  "13-24m",    "Pro",          11,
  "13-24m",    "Enterprise",    6,
  "25m+",      "Basic",        12,
  "25m+",      "Pro",           7,
  "25m+",      "Enterprise",    4
)

ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
churn <- tibble::tribble(
  ~tenure_band, ~plan,         ~churn_pct,
  "0-6m",      "Basic",        38,
  "0-6m",      "Pro",          22,
  "0-6m",      "Enterprise",   12,
  "7-12m",     "Basic",        28,
  "7-12m",     "Pro",          15,
  "7-12m",     "Enterprise",    9,
  "13-24m",    "Basic",        18,
  "13-24m",    "Pro",          11,
  "13-24m",    "Enterprise",    6,
  "25m+",      "Basic",        12,
  "25m+",      "Pro",           7,
  "25m+",      "Enterprise",    4
)

ex_1_4 <- ggplot(churn, aes(x = plan, y = tenure_band, fill = churn_pct)) +
  geom_tile() +
  labs(fill = "Churn %")
ex_1_4
#> 4x3 grid; bright corner top-left (38%), dark corner bottom-right (4%).
```

**Explanation:** Once data is already in long format (one row per cell), the heatmap is one line. The interesting work is upstream: producing the long tibble. In a real churn study the `tenure_band` order matters and would need `factor(tenure_band, levels = c("0-6m", "7-12m", "13-24m", "25m+"))` to keep increasing tenure going up the axis; ggplot2 sorts character levels alphabetically by default which scrambles the bands here.

</details>

## Section 2. Color scales and palettes (4 problems)

### Exercise 2.1: Apply scale_fill_gradient with custom low and high colors

**Task:** Take the heatmap from exercise 1.1 (call volume by day and hour) and replace the default blue scale with a white-to-firebrick gradient using `scale_fill_gradient(low = "white", high = "firebrick")`. Save the new ggplot object to `ex_2_1` so the heatmap reads visually as "white means quiet, red means busy".

**Expected result:**

```
#> Same 7x24 heatmap as ex_1_1 but with white-to-red fill scale.
#> The busiest cells appear deep red; the quietest appear near-white.
```

**Difficulty:** Beginner

```r title="Your turn"
ex_2_1 <- ex_1_1 +
  # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- ex_1_1 +
  scale_fill_gradient(low = "white", high = "firebrick")
ex_2_1
#> White-to-red heatmap; busiest hours pop visually.
```

**Explanation:** `scale_fill_gradient()` is the simplest two-color continuous scale. Pick a low color that fades into the chart background (often "white" or a very light grey) and a high color with enough saturation to draw the eye. Avoid pure red ("red") plus pure green; reserve red for "bad" or "high attention" semantics and prefer firebrick or red4 for a slightly muted look. For three-color (diverging) palettes use `scale_fill_gradient2()` (exercise 2.2).

</details>

### Exercise 2.2: Diverging palette around zero for a correlation tile grid

**Task:** Build a small inline correlation matrix of four financial metrics and draw it as a heatmap with a diverging palette centered on zero so that positive and negative correlations are visually opposite. Use `scale_fill_gradient2(low = "steelblue", mid = "white", high = "firebrick", midpoint = 0, limits = c(-1, 1))` and save the plot to `ex_2_2`.

**Expected result:**

```
#> A 4x4 heatmap; diagonal is deep red (corr = 1).
#> Off-diagonal: negative cells (e.g. price vs vol = -0.6) are blue,
#> positive cells (e.g. returns vs alpha = 0.4) are pink.
```

**Difficulty:** Intermediate

```r title="Your turn"
corr_long <- tibble::tribble(
  ~x, ~y, ~corr,
  "price",   "price",  1.0,  "price",   "vol",   -0.6,  "price",   "returns", 0.2, "price",   "alpha",  0.1,
  "vol",     "price", -0.6,  "vol",     "vol",    1.0,  "vol",     "returns",-0.3, "vol",     "alpha", -0.2,
  "returns", "price",  0.2,  "returns", "vol",   -0.3,  "returns", "returns", 1.0, "returns", "alpha",  0.4,
  "alpha",   "price",  0.1,  "alpha",   "vol",   -0.2,  "alpha",   "returns", 0.4, "alpha",   "alpha",  1.0
)

ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
corr_long <- tibble::tribble(
  ~x, ~y, ~corr,
  "price",   "price",  1.0,  "price",   "vol",   -0.6,  "price",   "returns", 0.2, "price",   "alpha",  0.1,
  "vol",     "price", -0.6,  "vol",     "vol",    1.0,  "vol",     "returns",-0.3, "vol",     "alpha", -0.2,
  "returns", "price",  0.2,  "returns", "vol",   -0.3,  "returns", "returns", 1.0, "returns", "alpha",  0.4,
  "alpha",   "price",  0.1,  "alpha",   "vol",   -0.2,  "alpha",   "returns", 0.4, "alpha",   "alpha",  1.0
)

ex_2_2 <- ggplot(corr_long, aes(x = x, y = y, fill = corr)) +
  geom_tile() +
  scale_fill_gradient2(low = "steelblue", mid = "white",
                       high = "firebrick", midpoint = 0,
                       limits = c(-1, 1))
ex_2_2
#> 4x4 diverging heatmap; diagonal pegs red, negatives go blue.
```

**Explanation:** `scale_fill_gradient2()` is the canonical pick for any quantity with a meaningful zero or midpoint (correlations, log-fold changes, deviations from a baseline). Setting `limits = c(-1, 1)` makes the legend symmetric so a correlation of 0.5 visually balances minus 0.5; without the explicit limits, ggplot2 would auto-fit to the data and break that symmetry. Avoid sequential palettes (`scale_fill_gradient()`, viridis) for diverging data because they hide the sign.

</details>

### Exercise 2.3: Colorblind-friendly viridis for the airquality heatmap

**Task:** Take the airquality month-by-day Ozone heatmap structure from exercise 1.2 and apply `scale_fill_viridis_c(option = "magma", direction = -1)` so that high Ozone is dark and low is bright. The reversed magma palette is print-safe and colorblind-friendly. Save the ggplot object to `ex_2_3`.

**Expected result:**

```
#> A month-by-day heatmap with magma palette, reversed:
#> low Ozone = bright yellow, high Ozone = dark purple.
#> 116 tiles drawn (NA days dropped before plotting).
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_3 <- airquality |>
  filter(!is.na(Ozone)) |>
  # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- airquality |>
  filter(!is.na(Ozone)) |>
  ggplot(aes(x = Day, y = factor(Month), fill = Ozone)) +
  geom_tile() +
  scale_fill_viridis_c(option = "magma", direction = -1) +
  labs(y = "Month")
ex_2_3
#> Reversed magma; dark cells = high pollution days.
```

**Explanation:** Viridis palettes (viridis, magma, inferno, plasma, cividis) are perceptually uniform, meaning equal steps in data map to equal perceived steps in color, and they remain distinguishable in greyscale and for common colorblindness types. Using `direction = -1` reverses the palette so that dark cells flag "high" rather than "low", which often reads more naturally for pollution, risk, or error magnitude. For discrete fills swap in `scale_fill_viridis_d()`.

</details>

### Exercise 2.4: Discretize a continuous fill into bins with scale_fill_stepsn

**Task:** Stakeholders sometimes prefer a binned heatmap so categories are clearly distinguishable rather than a smooth gradient. Take the churn heatmap from exercise 1.4 and apply `scale_fill_stepsn(colours = c("#fee0d2","#fc9272","#de2d26"), breaks = c(10, 20, 30))` to create four risk bands. Save the plot to `ex_2_4`.

**Expected result:**

```
#> Same 4x3 heatmap as ex_1_4, but fill is binned into 4 bands:
#> <10%, 10-20%, 20-30%, >30%. Color jumps at each break.
```

**Difficulty:** Advanced

```r title="Your turn"
ex_2_4 <- ex_1_4 +
  # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_4 <- ex_1_4 +
  scale_fill_stepsn(
    colours = c("#fee0d2", "#fc9272", "#de2d26"),
    breaks  = c(10, 20, 30)
  )
ex_2_4
#> Binned 4-band heatmap; cells snap to one of four colors.
```

**Explanation:** `scale_fill_stepsn()` is the binned cousin of `scale_fill_gradientn()`. You supply N+1 colors and N breaks; ggplot2 buckets values and assigns each tile to a band color. This is the right scale when business consumers ask "show me the red ones" and you want hard cutoffs at named thresholds (10%, 20%, 30%). The smooth `scale_fill_gradient2()` blurs the boundary; stepsn makes it auditable. For exploratory work keep the gradient; for executive dashboards bin it.

</details>

## Section 3. Ordering rows and columns (3 problems)

### Exercise 3.1: Reorder y-axis by row total so the busiest day floats to the top

**Task:** Take the call volume heatmap data `calls` from exercise 1.1 and reorder the `day` factor so that the busiest day (highest sum of volume) sits at the top of the y-axis. Use `reorder(day, volume, sum)` inside `aes()` then plot as `geom_tile()` and save the ggplot to `ex_3_1`.

**Expected result:**

```
#> A 7x24 heatmap. y-axis ordered by total daily volume (ascending
#> from bottom). Most-loaded day sits at the top, lightest at the bottom.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_1 <- ggplot(calls,
                 aes(x = hour,
                     y = # your code here,
                     fill = volume)) +
  geom_tile()
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- ggplot(calls,
                 aes(x = hour,
                     y = reorder(day, volume, sum),
                     fill = volume)) +
  geom_tile() +
  labs(y = "day")
ex_3_1
#> Days ordered ascending by total volume; busiest day on top.
```

**Explanation:** `reorder(factor, value, fun)` rebuilds the factor levels using `fun` (here `sum`) applied to `value` within each level. The default sort is ascending, so the largest sum lands at the highest position, which on a ggplot2 y-axis means the top. To flip the order use `reorder(day, -volume, sum)` or wrap with `fct_rev()`. This pattern is a one-line replacement for first computing totals, then setting levels manually with `factor(levels = ...)`.

</details>

### Exercise 3.2: Order rows by hierarchical clustering so similar profiles cluster together

**Task:** A geneticist wants gene expression rows ordered by similarity rather than alphabetically so that co-expressed genes sit next to each other on the heatmap. Cluster a 6-gene by 4-sample inline matrix using `hclust(dist(mat))`, extract the leaf order, and use it to set the `gene` factor levels. Plot as a heatmap and save the result to `ex_3_2`.

**Expected result:**

```
#> A 6x4 heatmap. y-axis order: c("g3","g1","g5","g2","g6","g4")
#> (the dendrogram leaf order from hclust on Euclidean distance).
```

**Difficulty:** Advanced

```r title="Your turn"
set.seed(7)
expr_mat <- matrix(round(rnorm(24, 5, 2), 1), nrow = 6,
                   dimnames = list(paste0("g", 1:6),
                                   paste0("s", 1:4)))
expr_long <- as.data.frame.table(expr_mat,
                                 responseName = "expr") |>
  setNames(c("gene", "sample", "expr"))

ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(7)
expr_mat <- matrix(round(rnorm(24, 5, 2), 1), nrow = 6,
                   dimnames = list(paste0("g", 1:6),
                                   paste0("s", 1:4)))
expr_long <- as.data.frame.table(expr_mat,
                                 responseName = "expr") |>
  setNames(c("gene", "sample", "expr"))

gene_order <- hclust(dist(expr_mat))$order
gene_levels <- rownames(expr_mat)[gene_order]

ex_3_2 <- expr_long |>
  mutate(gene = factor(gene, levels = gene_levels)) |>
  ggplot(aes(x = sample, y = gene, fill = expr)) +
  geom_tile() +
  scale_fill_viridis_c()
ex_3_2
#> 6x4 heatmap, rows ordered by clustering, viridis fill.
```

**Explanation:** The two-step trick is to cluster the wide matrix first (`hclust(dist(...))`) and then use the leaf order to refactor the long data. `hclust()` returns a `$order` slot with the row indices in dendrogram traversal order. Skipping the wide-to-long pivot is fine because ggplot2 only needs the leaf order, not the dendrogram itself; if you want to render the dendrogram alongside the heatmap, use the `ggdendro` package or `patchwork::wrap_plots()`. For column clustering apply the same trick to `t(mat)`.

</details>

### Exercise 3.3: Reverse the y-axis so the first level sits at the top

**Task:** By default ggplot2 puts the first factor level at the bottom of the y-axis. Heatmaps usually read top-down (like a table), so you want the first level at the top. Take the airquality heatmap from exercise 1.2 and reverse the y-axis with `scale_y_discrete(limits = rev)`. Save the plot to `ex_3_3`.

**Expected result:**

```
#> Same airquality heatmap; y-axis now goes Month 5 at top
#> down to Month 9 at the bottom (instead of 5 at bottom).
```

**Difficulty:** Beginner

```r title="Your turn"
ex_3_3 <- airquality |>
  filter(!is.na(Ozone)) |>
  ggplot(aes(x = Day, y = factor(Month), fill = Ozone)) +
  geom_tile() +
  # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- airquality |>
  filter(!is.na(Ozone)) |>
  ggplot(aes(x = Day, y = factor(Month), fill = Ozone)) +
  geom_tile() +
  scale_y_discrete(limits = rev) +
  labs(y = "Month")
ex_3_3
#> Y-axis reversed: Month 5 at top, Month 9 at bottom.
```

**Explanation:** Passing the function `rev` (not `rev()`) to `limits` is the idiomatic ggplot2 way to flip a discrete axis. The scale function is called internally with the current levels and gets to transform them. The alternative `scale_y_discrete(limits = c("9","8","7","6","5"))` works but is brittle if the levels change. For continuous axes use `scale_y_reverse()`. The visual effect matters for heatmaps because most readers scan top-down like a spreadsheet.

</details>

## Section 4. Labels, annotations, and text overlays (3 problems)

### Exercise 4.1: Overlay numeric values on each tile with geom_text

**Task:** A retail buyer reviewing weekly category sales wants to see the exact number inside each heatmap cell, not just the color. Take the churn matrix `churn` from exercise 1.4 and add `geom_text(aes(label = churn_pct))` so each tile shows its percentage value. Save the resulting plot to `ex_4_1`.

**Expected result:**

```
#> Same 4x3 heatmap as ex_1_4, but each tile now has a numeric label
#> centered on it (e.g. "38", "22", ..., "4"). Default black text.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_1 <- ggplot(churn,
                 aes(x = plan, y = tenure_band, fill = churn_pct)) +
  geom_tile() +
  # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- ggplot(churn,
                 aes(x = plan, y = tenure_band, fill = churn_pct)) +
  geom_tile() +
  geom_text(aes(label = churn_pct))
ex_4_1
#> 4x3 heatmap with black numeric labels on each tile.
```

**Explanation:** `geom_text()` inherits `x` and `y` from the heatmap layer, so it lines up with the tile centers automatically. The text color is the layer color (default black), which fails on dark-fill cells (next exercise solves that). For percentages format the label with `sprintf("%d%%", churn_pct)` or `scales::label_percent(scale = 1)`. For thousands separators wrap with `scales::label_comma()`. Keep labels short; if the value is two digits or fewer they fit comfortably even on small tiles.

</details>

### Exercise 4.2: Conditionally color labels white on dark cells and black on light cells

**Task:** Black labels disappear against deep red tiles. Take the labeled churn heatmap and conditionally set the label color to "white" when `churn_pct > 20` and "black" otherwise so the text is readable on every cell. Use `geom_text(aes(label = churn_pct, colour = churn_pct > 20))` plus `scale_colour_manual()`. Save the plot to `ex_4_2`.

**Expected result:**

```
#> Same labeled heatmap. Cells with churn > 20% (top-left corner)
#> now show white text; cells with churn <= 20% show black text.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_2 <- ggplot(churn,
                 aes(x = plan, y = tenure_band, fill = churn_pct)) +
  geom_tile() +
  # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- ggplot(churn,
                 aes(x = plan, y = tenure_band, fill = churn_pct)) +
  geom_tile() +
  geom_text(aes(label = churn_pct, colour = churn_pct > 20)) +
  scale_colour_manual(values = c("FALSE" = "black", "TRUE" = "white"),
                      guide = "none")
ex_4_2
#> Labels switch color at the 20% threshold for legibility.
```

**Explanation:** Mapping a boolean to the `colour` aesthetic creates a two-level discrete scale, which you then bind to literal colors via `scale_colour_manual()`. The `guide = "none"` argument hides the legend because this is purely a visual fix, not a piece of information. Choose the threshold to roughly bisect the data; setting it at the visual midpoint of the fill scale (often the 50th percentile or the gradient midpoint) gives the cleanest contrast for any color palette.

</details>

### Exercise 4.3: Outline a specific cell with geom_rect to highlight an anomaly

**Task:** A site reliability engineer is reviewing the call volume heatmap and wants to draw a thick black box around the single busiest cell to flag it for the incident write-up. Find the row of `calls` with the maximum `volume`, then overlay `geom_rect()` with `xmin/xmax = hour +- 0.5` and `ymin/ymax = day +- 0.5` mapped to a 4-element constant. Save the plot to `ex_4_3`.

**Expected result:**

```
#> A 7x24 heatmap with one thick black rectangle outlining the
#> single tile whose volume is the dataset maximum. No fill change.
```

**Difficulty:** Advanced

```r title="Your turn"
peak <- calls |>
  filter(volume == max(volume)) |>
  mutate(day_num = as.integer(factor(day,
              levels = c("Mon","Tue","Wed","Thu","Fri","Sat","Sun"))))

ex_4_3 <- ggplot(calls,
                 aes(x = hour,
                     y = factor(day, levels = c("Mon","Tue","Wed","Thu","Fri","Sat","Sun")),
                     fill = volume)) +
  geom_tile() +
  # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
peak <- calls |>
  filter(volume == max(volume)) |>
  mutate(day_num = as.integer(factor(day,
              levels = c("Mon","Tue","Wed","Thu","Fri","Sat","Sun"))))

ex_4_3 <- ggplot(calls,
                 aes(x = hour,
                     y = factor(day, levels = c("Mon","Tue","Wed","Thu","Fri","Sat","Sun")),
                     fill = volume)) +
  geom_tile() +
  geom_rect(data = peak,
            aes(xmin = hour - 0.5, xmax = hour + 0.5,
                ymin = day_num - 0.5, ymax = day_num + 0.5),
            fill = NA, colour = "black", linewidth = 1.2,
            inherit.aes = FALSE)
ex_4_3
#> Heatmap with a thick black box around the peak cell.
```

**Explanation:** `geom_rect()` needs numeric x/y coordinates, but the heatmap y-axis is discrete, so you first convert the day to its integer factor index. `inherit.aes = FALSE` is essential: without it, `geom_rect()` tries to inherit `fill = volume` from the parent ggplot and you get a colored box plus a warning. The same recipe works for any annotation (text callouts, leader lines) on top of a categorical-axis heatmap. For a softer highlight swap to `fill = "yellow", alpha = 0.3`.

</details>

## Section 5. Correlation and statistical heatmaps (3 problems)

### Exercise 5.1: Correlation heatmap of mtcars with diverging fill

**Task:** A junior analyst wants the classic mtcars correlation heatmap. Compute `cor(mtcars)`, pivot the resulting matrix into long format with `pivot_longer()`, then plot with `geom_tile()` and `scale_fill_gradient2()` centered on zero. Save the ggplot object to `ex_5_1` so it shows all 11 variables on both axes.

**Expected result:**

```
#> An 11x11 heatmap of pairwise Pearson correlations.
#> Diagonal = 1 (deep red). mpg vs cyl ~ -0.85 (deep blue).
#> wt vs disp ~ 0.89 (deep red). Diverging palette around 0.
```

**Difficulty:** Intermediate

```r title="Your turn"
cor_long <- cor(mtcars) |>
  as.data.frame() |>
  tibble::rownames_to_column("var1") |>
  tidyr::pivot_longer(-var1, names_to = "var2", values_to = "corr")

ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
cor_long <- cor(mtcars) |>
  as.data.frame() |>
  tibble::rownames_to_column("var1") |>
  pivot_longer(-var1, names_to = "var2", values_to = "corr")

ex_5_1 <- ggplot(cor_long, aes(x = var1, y = var2, fill = corr)) +
  geom_tile() +
  scale_fill_gradient2(low = "steelblue", mid = "white",
                       high = "firebrick", midpoint = 0,
                       limits = c(-1, 1)) +
  theme(axis.text.x = element_text(angle = 45, hjust = 1))
ex_5_1
#> 11x11 diverging heatmap; diagonal red, mpg/cyl block blue.
```

**Explanation:** The three-step recipe (correlate, pivot, plot) is the workhorse for any pairwise statistic, not just correlation. Swap `cor()` for `cor()` with `method = "spearman"` for rank correlation, or for any custom function returning a square matrix. The 45-degree x-axis label is conventional for variable-name labels that would otherwise overlap. To hide the redundant upper triangle, filter `cor_long` to `var1 <= var2` lexicographically (exercise 5.3 explores the masked variant).

</details>

### Exercise 5.2: Heatmap of Titanic survival counts by Class and Sex

**Task:** The built-in `Titanic` array stores counts by Class, Sex, Age, and Survived. Marginalize over Age and Survived (keep only survivors) to produce a 4-class by 2-sex grid of survival counts, then plot as a `geom_tile()` heatmap with viridis fill and value labels. Save the plot to `ex_5_2`.

**Expected result:**

```
#> A 4x2 heatmap. Highest cell: 1st class / Female ~ 141 survivors
#> (bright yellow). Lowest: 3rd / Male ~ 75 (dark purple).
#> Each tile labelled with its integer count.
```

**Difficulty:** Intermediate

```r title="Your turn"
surv <- as.data.frame(Titanic) |>
  filter(Survived == "Yes") |>
  group_by(Class, Sex) |>
  summarise(n = sum(Freq), .groups = "drop")

ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
surv <- as.data.frame(Titanic) |>
  filter(Survived == "Yes") |>
  group_by(Class, Sex) |>
  summarise(n = sum(Freq), .groups = "drop")

ex_5_2 <- ggplot(surv, aes(x = Sex, y = Class, fill = n)) +
  geom_tile() +
  geom_text(aes(label = n), colour = "white") +
  scale_fill_viridis_c()
ex_5_2
#> 4x2 heatmap; bright-yellow cell at 1st/Female with label 141.
```

**Explanation:** Heatmaps of contingency tables are an underused alternative to grouped bar charts because they keep the cross-classified structure visible. The key transformation is `as.data.frame()` on the array, which gives one row per cell with a `Freq` column, then collapse over the unwanted dimensions with `group_by()` and `summarise()`. White labels read better than black on the viridis palette; if you mix fill scales, return to the conditional-color pattern from exercise 4.2.

</details>

### Exercise 5.3: Significance-masked correlation heatmap

**Task:** A biostatistician wants the mtcars correlation heatmap from exercise 5.1 but with non-significant cells (`p >= 0.05` from a pairwise test) blanked out so the eye is drawn only to the reliable correlations. Compute pairwise p-values with `cor.test()`, set `corr` to `NA` where `p >= 0.05`, and use `na.value = "grey90"` in the fill scale. Save the plot to `ex_5_3`.

**Expected result:**

```
#> An 11x11 heatmap. ~70% of off-diagonal cells colored red or blue
#> (significant correlations); the remaining cells are light grey
#> (masked because p >= 0.05). Diagonal stays solid red.
```

**Difficulty:** Advanced

```r title="Your turn"
pairs_df <- expand.grid(var1 = names(mtcars), var2 = names(mtcars),
                        stringsAsFactors = FALSE) |>
  rowwise() |>
  mutate(
    corr = cor(mtcars[[var1]], mtcars[[var2]]),
    p    = cor.test(mtcars[[var1]], mtcars[[var2]])$p.value
  ) |>
  ungroup() |>
  mutate(corr_sig = ifelse(p < 0.05, corr, NA_real_))

ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
pairs_df <- expand.grid(var1 = names(mtcars), var2 = names(mtcars),
                        stringsAsFactors = FALSE) |>
  rowwise() |>
  mutate(
    corr = cor(mtcars[[var1]], mtcars[[var2]]),
    p    = cor.test(mtcars[[var1]], mtcars[[var2]])$p.value
  ) |>
  ungroup() |>
  mutate(corr_sig = ifelse(p < 0.05, corr, NA_real_))

ex_5_3 <- ggplot(pairs_df, aes(x = var1, y = var2, fill = corr_sig)) +
  geom_tile() +
  scale_fill_gradient2(low = "steelblue", mid = "white",
                       high = "firebrick", midpoint = 0,
                       limits = c(-1, 1), na.value = "grey90") +
  theme(axis.text.x = element_text(angle = 45, hjust = 1))
ex_5_3
#> Heatmap with non-significant cells masked to light grey.
```

**Explanation:** The `rowwise()` + `cor.test()` combo computes a p-value per cell without writing an explicit loop. The masking trick is to keep a parallel column (`corr_sig`) that is `NA` for non-significant cells; the fill scale's `na.value` parameter colors those cells with a neutral tone that recedes. A more rigorous approach corrects for multiple testing (Bonferroni or BH) before applying the threshold; with 121 cells and alpha 0.05 you would expect roughly 6 false positives uncorrected.

</details>

## Section 6. Facets, missing values, and polish (3 problems)

### Exercise 6.1: Faceted cohort retention heatmap by acquisition year

**Task:** A SaaS analyst wants a separate cohort retention heatmap for each `cohort_year` so leadership can compare the 2022 cohort to the 2023 cohort side by side. Take the inline `retention` tibble, plot a `geom_tile()` heatmap of `month_number` vs `cohort_month`, and add `facet_wrap(~ cohort_year)`. Save the plot to `ex_6_1`.

**Expected result:**

```
#> Two heatmap panels side by side (cohort_year = 2022 and 2023).
#> Each panel: x = month_number (1..6), y = cohort_month (Jan..Jun),
#> fill = retention_pct. Default blue gradient, brighter early months.
```

**Difficulty:** Intermediate

```r title="Your turn"
set.seed(2)
retention <- expand.grid(
  cohort_year  = c(2022, 2023),
  cohort_month = month.abb[1:6],
  month_number = 1:6
) |>
  mutate(retention_pct = round(100 * exp(-0.15 * month_number) +
                                 rnorm(72, 0, 2), 1))

ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(2)
retention <- expand.grid(
  cohort_year  = c(2022, 2023),
  cohort_month = month.abb[1:6],
  month_number = 1:6
) |>
  mutate(retention_pct = round(100 * exp(-0.15 * month_number) +
                                 rnorm(72, 0, 2), 1))

ex_6_1 <- ggplot(retention,
                 aes(x = month_number, y = cohort_month,
                     fill = retention_pct)) +
  geom_tile() +
  facet_wrap(~ cohort_year) +
  labs(fill = "Retention %")
ex_6_1
#> Two-panel heatmap of cohort retention; one panel per year.
```

**Explanation:** `facet_wrap()` is the canonical way to slice a heatmap across a third (categorical) dimension. Each panel reuses the same fill scale by default so the colors are comparable across cohorts, which is exactly what you want for a "is 2023 better than 2022" read. If the cohorts had wildly different retention ranges, `facet_wrap(scales = "free")` would let each panel have its own legend, but that almost always confuses the comparison. For a single dense grid prefer one heatmap with the third dimension on one of the axes.

</details>

### Exercise 6.2: Render missing values with na.value instead of dropping them

**Task:** Sometimes you want NA cells to remain visible on the heatmap as explicit "no data" rather than being silently dropped. Take the full `airquality` dataset (do not filter out NA Ozone rows), plot the heatmap, and set `na.value = "grey80"` inside `scale_fill_viridis_c()` so NA cells render as light grey. Save the plot to `ex_6_2`.

**Expected result:**

```
#> Month-by-day Ozone heatmap with all 153 cells drawn.
#> ~37 NA cells appear as light grey; non-NA cells use viridis colors.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_6_2 <- airquality |>
  ggplot(aes(x = Day, y = factor(Month), fill = Ozone)) +
  geom_tile() +
  # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_2 <- airquality |>
  ggplot(aes(x = Day, y = factor(Month), fill = Ozone)) +
  geom_tile() +
  scale_fill_viridis_c(na.value = "grey80") +
  labs(y = "Month")
ex_6_2
#> Heatmap showing NA cells as grey; non-NA cells in viridis.
```

**Explanation:** Every continuous fill scale in ggplot2 accepts `na.value`. The default is `"grey50"` which is dark enough to fight with most palettes; bumping it to `"grey80"` or `"white"` makes missing cells recede. Showing NA cells explicitly is the right choice when missingness is informative (sensor downtime, recording gaps, drop-out) rather than incidental. If you instead want to highlight missing cells, set `na.value = "red"` and they will jump out for QA review.

</details>

### Exercise 6.3: Production-quality polish with square tiles, rotated labels, and minimal theme

**Task:** Take the mtcars correlation heatmap from exercise 5.1 and polish it for a stakeholder report: square tiles via `coord_fixed()`, x-axis labels rotated 45 degrees with right-justified anchors, remove the panel grid and background using `theme_minimal()` plus targeted `theme()` calls, and add a title and a `fill` legend title. Save the plot to `ex_6_3`.

**Expected result:**

```
#> The 11x11 correlation heatmap, polished: square cells,
#> 45-degree rotated x labels, no panel grid, no axis ticks,
#> title "mtcars correlation matrix", legend titled "Pearson r".
```

**Difficulty:** Advanced

```r title="Your turn"
ex_6_3 <- ex_5_1 +
  # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_3 <- ex_5_1 +
  coord_fixed() +
  labs(title = "mtcars correlation matrix",
       x = NULL, y = NULL, fill = "Pearson r") +
  theme_minimal() +
  theme(
    axis.text.x   = element_text(angle = 45, hjust = 1),
    panel.grid    = element_blank(),
    axis.ticks    = element_blank()
  )
ex_6_3
#> Polished square-tile heatmap, no grid, titled and re-labelled.
```

**Explanation:** `coord_fixed()` locks the aspect ratio so the tiles are perfect squares regardless of plot device size; this matters for correlation matrices where rectangular cells imply a relationship between row and column extent that does not exist. Stripping the panel grid with `panel.grid = element_blank()` is necessary because `theme_minimal()` keeps faint gridlines that show through the tiles. The order of `theme_minimal()` then `theme()` matters: the later call wins, so put global theme first and the targeted overrides afterwards.

</details>

## What to do next

- Learn more visualization patterns in the [Top 50 ggplot2 Visualizations](Top50-Ggplot2-Visualizations-MasterList-R-Code.html) gallery.
- Practice dplyr verbs that feed these heatmaps in [dplyr Exercises in R](dplyr-Exercises-in-R.html).
- Reshape skills (pivot_longer, pivot_wider) are drilled in [tidyr Exercises in R](tidyr-Exercises-in-R.html).
- For categorical color and factor reordering, see [forcats Exercises in R](forcats-Exercises-in-R.html).
