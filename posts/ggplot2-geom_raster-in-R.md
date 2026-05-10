---
title: "ggplot2 geom_raster() in R: Fast Heatmap From Regular Grid"
slug: "ggplot2-geom_raster-in-R"
description: "Use ggplot2 geom_raster() to draw a heatmap from a regular grid in R, faster than geom_tile. Covers fill, scale, vs geom_tile, and 5 worked examples."
keywords: "ggplot2 geom_raster, R heatmap raster, geom_raster vs geom_tile, fast heatmap ggplot, raster fill, regular grid heatmap"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "ggplot2-functions"
fr_parent: "ggplot2-Tutorial-With-R.html"
auto_link_terms: "geom_raster()|ggplot2 geom_raster|heatmap raster|geom_raster vs geom_tile|fast heatmap"
auto_link_case_sensitive: true
target_keyword: "ggplot2 geom_raster"
sibling_block_enabled: true
difficulty: "Beginner"
---

# ggplot2 geom_raster() in R: Fast Heatmap From Regular Grid

<p class="lead">The <code>geom_raster()</code> function in ggplot2 draws heatmaps from data on a regular grid. It is FASTER than <code>geom_tile()</code> when the grid is evenly spaced.</p>

[QUICK ANSWER]
ggplot(df, aes(x, y, fill = value)) + geom_raster()
geom_raster(interpolate = TRUE)        # smooth interpolation
geom_tile()                             # equivalent, slower for regular grids

[DECISION TREE: Is geom_raster() the right tool?]
- regular grid heatmap (equal spacing): geom_raster() (fast)
- irregular grid: geom_tile() (slower but works)
- contour lines instead of fill: geom_contour()
- hexagonal binning: geom_hex()

## What geom_raster() does in one sentence

**`geom_raster()` is a fast version of `geom_tile()` for evenly spaced grid data.** Each (x, y) cell is filled with the corresponding fill aesthetic value.

## Syntax

**`geom_raster(interpolate = FALSE, ...)`. Requires aes(x, y, fill).**

```r title="Heatmap of correlation matrix"
library(ggplot2)

library(tidyr)
cor_mat <- cor(mtcars[, 1:5])
cor_long <- as_tibble(cor_mat, rownames = "x") |>
  tidyr::pivot_longer(-x, names_to = "y", values_to = "cor")

ggplot(cor_long, aes(x, y, fill = cor)) +
  geom_raster() +
  scale_fill_viridis_c()
```

[TIP]
**Use `geom_raster` when your grid is REGULAR (equal x and y spacing).** For irregular grids, geom_tile is more flexible.

## Five common patterns

### 1. Correlation heatmap

```r title="Standard usage"
ggplot(cor_long, aes(x, y, fill = cor)) +
  geom_raster() +
  scale_fill_viridis_c()
```

### 2. With interpolation

```r title="Smooth blending"
ggplot(df, aes(x, y, fill = z)) +
  geom_raster(interpolate = TRUE)
```

### 3. Image data

```r title="Image-like raster"
matrix_data <- matrix(rnorm(100), 10, 10)
df_grid <- as_tibble(matrix_data) |>
  mutate(row = row_number()) |>
  tidyr::pivot_longer(-row, names_to = "col", values_to = "z")

ggplot(df_grid, aes(col, row, fill = z)) +
  geom_raster()
```

### 4. With theme cleanup

```r title="Pure heatmap"
ggplot(df, aes(x, y, fill = z)) +
  geom_raster() +
  theme_void() +
  scale_fill_viridis_c()
```

### 5. Compare to geom_tile

```r title="Same output for regular grid"
ggplot(df, aes(x, y, fill = z)) + geom_raster()
ggplot(df, aes(x, y, fill = z)) + geom_tile()
# Same visual; raster is faster
```

[KEY INSIGHT]
**`geom_raster` is `geom_tile` optimized for REGULAR grids.** It exploits the regularity to render faster (especially useful for large grids 100x100+).

## geom_raster() vs geom_tile() vs geom_hex()

| Function | Grid type | Best for |
|---|---|---|
| `geom_raster()` | Regular | Fast heatmaps |
| `geom_tile()` | Any | Heatmaps with irregular cells |
| `geom_hex()` | Hexagonal binning | 2D density |
| `geom_bin2d()` | Rectangular binning | 2D density |

## A practical workflow

**Heatmaps for matrices, correlation matrices, and per-cell aggregations.**

```r
df_grid |>
  ggplot(aes(x, y, fill = value)) +
  geom_raster() +
  scale_fill_viridis_c() +
  coord_fixed() +
  theme_minimal()
```

## Common pitfalls

**Pitfall 1: irregular grid.** geom_raster expects evenly-spaced x and y. Irregular spacing produces visual artifacts.

**Pitfall 2: missing values.** Empty cells appear gray (NA color). Fill with 0 or NA explicitly via `complete()`.

[WARNING]
**`geom_raster()` is NOT for non-rectangular layouts.** For hex bins, use geom_hex; for bins, use geom_bin2d.

## Try it yourself

**Try it:** Plot a heatmap of mtcars correlation matrix. Save to `ex_plot`.

```r title="Your turn: correlation heatmap"
cor_mat <- cor(mtcars)
cor_long <- as_tibble(cor_mat, rownames = "x") |>
  tidyr::pivot_longer(-x, names_to = "y", values_to = "cor")

ex_plot <- cor_long |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_plot <- ggplot(cor_long, aes(x, y, fill = cor)) +
  geom_raster() +
  scale_fill_viridis_c() +
  theme_minimal()
```

**Explanation:** geom_raster fills each (x, y) cell with the correlation value; viridis colors highlight values.

</details>

## Related ggplot2 functions

After mastering geom_raster, look at:

- `geom_tile()`: more flexible for irregular grids
- `geom_hex()`: hexagonal 2D bins
- `geom_bin2d()`: rectangular 2D bins
- `geom_contour()`: contour lines
- `scale_fill_viridis_c()`: perceptually uniform colors

## FAQ

**What does geom_raster do in ggplot2?**

`geom_raster()` draws a fast heatmap from regular-grid data. Each (x, y) cell is filled with the fill aesthetic value.

**What is the difference between geom_raster and geom_tile?**

geom_raster is faster but requires a REGULAR grid. geom_tile works for any grid but is slower for large regular grids.

**Should I use geom_raster or geom_hex?**

geom_raster for grid data you already have. geom_hex for 2D density of raw points (it bins them automatically).

**How do I add interpolation?**

Pass `interpolate = TRUE` to geom_raster. Smooths transitions between cells.

**Can I use geom_raster for image data?**

Yes. It is the standard tool for matrix/image-like display. Use `coord_fixed()` to keep the aspect ratio.
