---
title: "ggplot2 geom_tile() in R: Heatmaps With Examples"
slug: "ggplot2-geom_tile-in-R"
description: "Use ggplot2 geom_tile() to build heatmaps in R. Covers fill mapping, custom color scales, text labels, correlation matrices, viridis, and 6 examples plus tips."
keywords: "geom_tile, ggplot2 heatmap, heatmap in R, R heatmap examples, ggplot2 correlation matrix, ggplot2 fill gradient, geom_raster"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "ggplot2-functions"
fr_parent: "ggplot2-Tutorial-With-R.html"
auto_link_terms: "geom_tile()|ggplot2 geom_tile|ggplot2 heatmap|heatmap in ggplot2|correlation matrix plot"
auto_link_case_sensitive: true
target_keyword: "geom_tile"
sibling_block_enabled: true
difficulty: "Beginner"
---

# ggplot2 geom_tile() in R: Heatmaps With Examples

<p class="lead">The <code>geom_tile()</code> function in ggplot2 draws rectangles at every (x, y) location, with fill color encoding a third variable. It is the workhorse for heatmaps, correlation matrices, and calendar plots.</p>

[QUICK ANSWER]
ggplot(df, aes(x, y, fill = value)) + geom_tile()                 # basic heatmap
ggplot(df, aes(x, y, fill = value)) + geom_tile() + scale_fill_viridis_c()
ggplot(df, aes(x, y, fill = value)) + geom_tile() + geom_text(aes(label = value))
ggplot(df, aes(x, y, fill = value)) + geom_tile(color = "white") # tile borders
ggplot(df, aes(x, y, fill = value)) + geom_tile() +
  scale_fill_gradient2(low = "blue", mid = "white", high = "red")  # diverging
ggplot(df, aes(x, y)) + geom_raster(aes(fill = value))             # faster equivalent
ggplot(df, aes(x, y)) + geom_tile() + theme_void()                 # clean look

[DECISION TREE: Is geom_tile() the right tool?]
- value at each (x, y): geom_tile() or geom_raster()
- correlation matrix: geom_tile() with fill = correlation
- calendar heatmap: geom_tile(aes(x = week, y = weekday))
- categorical x and y: geom_tile()
- continuous x and y, equal grid: geom_raster() (faster)
- 2D density (no value column): geom_density_2d() or geom_hex()
- treemap (proportional rectangles): treemapify or treemap package

## What geom_tile() does in one sentence

**`geom_tile()` draws rectangles centered at each (x, y) point and fills them with a color mapped to a third variable.** Think of it as scatter plot points but rendered as filled rectangles instead of points. Adjacent tiles abut to form a continuous grid.

The most common use is heatmap: rows and columns are categorical or numeric labels, each cell shows a value via color intensity. `geom_raster()` is a faster equivalent for regular grids.

## Syntax

**`geom_tile()` requires `aes(x, y)` and usually `aes(fill = value)`.** Without `fill`, all tiles get the default gray color.

```r title="Load ggplot2 and create a sample matrix"
library(ggplot2)

# Build a long-format tile data: row, col, value
m <- expand.grid(row = 1:5, col = letters[1:5])
m$value <- runif(25)
head(m, 4)
#>   row col      value
#> 1   1   a 0.91480672
#> 2   2   a 0.93707075
#> 3   3   a 0.34668349
#> 4   4   a 0.40386645
```

The full signature:

```
geom_tile(mapping = NULL, data = NULL, stat = "identity", position = "identity",
          ..., linejoin = "mitre", na.rm = FALSE, show.legend = NA, inherit.aes = TRUE)
```

[TIP]
**`geom_tile()` and `geom_raster()` produce nearly identical output, but `geom_raster()` is much faster for regular grids.** Use `geom_raster()` when x and y are evenly spaced (e.g., a 100x100 image grid). Use `geom_tile()` when categories are irregular or you want explicit `width` / `height` per tile.

## Six common patterns

### 1. Basic heatmap

```r title="Random 5x5 grid"
ggplot(m, aes(x = col, y = row, fill = value)) +
  geom_tile()
```

The simplest case: each unique (col, row) pair gets one tile, colored by `value`.

### 2. Custom color scale

```r title="Viridis (perceptually uniform)"
ggplot(m, aes(x = col, y = row, fill = value)) +
  geom_tile() +
  scale_fill_viridis_c()
```

`scale_fill_viridis_c()` is the recommended continuous color scale: colorblind-friendly, prints well in grayscale, perceptually uniform.

### 3. Add text labels

```r title="Show values on tiles"
ggplot(m, aes(x = col, y = row, fill = value)) +
  geom_tile() +
  geom_text(aes(label = round(value, 2)), color = "white", size = 3.5)
```

`geom_text()` overlays the value on each tile. White text usually contrasts well; for very light tiles, switch to a dark color or use `aes(color = value > 0.5)` to switch dynamically.

### 4. Correlation matrix heatmap

```r title="mtcars correlations as a heatmap"
cor_mat <- cor(mtcars[, c("mpg", "cyl", "disp", "hp", "wt")])
cor_long <- as.data.frame(as.table(cor_mat))
names(cor_long) <- c("var1", "var2", "cor")

ggplot(cor_long, aes(x = var1, y = var2, fill = cor)) +
  geom_tile() +
  scale_fill_gradient2(low = "darkblue", mid = "white", high = "darkred",
                        midpoint = 0, limits = c(-1, 1)) +
  geom_text(aes(label = round(cor, 2)), size = 3) +
  theme_minimal()
```

`scale_fill_gradient2()` uses a diverging palette: blue for negative, white for zero, red for positive. Centered at 0 via `midpoint = 0`.

### 5. White borders for visual separation

```r title="Tile borders make the grid clearer"
ggplot(m, aes(x = col, y = row, fill = value)) +
  geom_tile(color = "white", linewidth = 0.5) +
  scale_fill_viridis_c()
```

`color = "white"` adds a white outline around each tile. Useful for sparse grids; not needed for dense rasters.

### 6. Calendar heatmap

```r title="Daily values arranged as a year"
calendar <- expand.grid(week = 1:53, weekday = c("Mon","Tue","Wed","Thu","Fri","Sat","Sun"))
calendar$value <- runif(nrow(calendar))

ggplot(calendar, aes(x = week, y = weekday, fill = value)) +
  geom_tile(color = "white") +
  scale_fill_viridis_c() +
  theme_minimal() +
  labs(x = "Week", y = NULL)
```

Calendar heatmap is just a tile plot with week on x and weekday on y. Useful for visualizing yearly patterns (commits per day, sales per day, etc.).

[KEY INSIGHT]
**`geom_tile()` expects LONG-format data, one row per cell.** If your data is in matrix or wide format, reshape first with `tidyr::pivot_longer()` or `as.data.frame(as.table(matrix))`. The most common newcomer error is trying to pass a matrix directly.

## geom_tile() vs base R image()

**Both produce heatmaps. Base R `image()` works directly on matrices; ggplot2 needs long-format data but is more composable.**

| Task | ggplot2 | Base R |
|---|---|---|
| Basic heatmap | `geom_tile(aes(fill=v))` | `image(matrix)` |
| Color scale | `+ scale_fill_*()` | `col = palette` |
| Text labels | `+ geom_text(aes(label=v))` | (manual `text()` calls) |
| Correlation matrix | `corrplot::corrplot.mixed()` or geom_tile | `corrplot()` |
| Faceted | `+ facet_wrap()` | (manual par mfrow) |
| Long format input | Required | Not needed (uses matrix) |

When to use which:

- Use ggplot2 + `geom_tile()` for publication-quality, faceted, or annotated heatmaps.
- Use base `image()` or `heatmap()` for quick interactive exploration of matrices.

## Common pitfalls

**Pitfall 1: passing a matrix to ggplot.** ggplot expects a data frame with `(x, y, fill)` columns. Reshape matrices first: `as.data.frame(as.table(your_matrix))`.

**Pitfall 2: gaps between tiles.** Default tiles are 1 unit wide. If x or y are non-integer or unevenly spaced, you may see gaps. Set explicit `width` and `height` in geom_tile, or use `geom_raster()` for regular grids.

[WARNING]
**Default rainbow / Spectral palettes are NOT colorblind-friendly.** Use `scale_fill_viridis_c()` (continuous) or `scale_fill_brewer(palette = "RdBu")` (diverging). Avoid `scale_fill_gradientn(colors = rainbow(7))` for anything beyond debugging.

**Pitfall 3: text legibility on tiles.** White text becomes invisible on light tiles, dark on dark. For mixed tile values, conditionally pick text color: `aes(color = ifelse(value > 0.5, "black", "white"))`.

## Try it yourself

**Try it:** Build a heatmap of the correlation matrix of `mtcars[, 1:5]` (mpg, cyl, disp, hp, drat). Use a diverging color scale centered at 0 and overlay correlation values as text. Save to `ex_plot`.

```r title="Your turn: correlation heatmap"
cor_long <- as.data.frame(as.table(cor(mtcars[, 1:5])))
names(cor_long) <- c("var1", "var2", "cor")

# Try it: heatmap with text + diverging scale
ex_plot <- ggplot(cor_long, aes(x = var1, y = var2, fill = cor)) +
  # your code here

print(ex_plot)
#> Expected: 5x5 colored grid with correlation values printed on tiles
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_plot <- ggplot(cor_long, aes(x = var1, y = var2, fill = cor)) +
  geom_tile(color = "white") +
  scale_fill_gradient2(low = "darkblue", mid = "white", high = "darkred",
                        midpoint = 0, limits = c(-1, 1)) +
  geom_text(aes(label = round(cor, 2)), size = 3) +
  theme_minimal()

print(ex_plot)
```

**Explanation:** `scale_fill_gradient2(midpoint = 0)` makes the palette diverge: blue for negative correlations, red for positive, white for zero. White tile borders separate cells. Text labels show the actual numbers.

</details>

## Related ggplot2 functions

After mastering `geom_tile()`, look at:

- `geom_raster()`: faster equivalent for regular evenly-spaced grids
- `geom_rect()`: explicit rectangles with `xmin`, `xmax`, `ymin`, `ymax`
- `scale_fill_viridis_c()`, `scale_fill_brewer()`: better color palettes
- `scale_fill_gradient2()`: diverging palettes for centered scales
- `geom_text()`: overlay values as text labels
- `theme_minimal()`, `theme_void()`: clean themes for heatmap focus

For larger correlation matrices, the `corrplot` and `ggcorrplot` packages provide specialized helpers built on geom_tile.

## FAQ

**How do I make a heatmap in ggplot2?**

Use `geom_tile()` with `aes(x, y, fill = value)`. Map x and y to row/column labels and `fill` to the value you want to encode by color. Add `scale_fill_viridis_c()` for a perceptually uniform palette.

**What is the difference between geom_tile and geom_raster?**

Both draw a grid of colored rectangles. `geom_raster()` is a fast specialization for evenly spaced (regular) grids. `geom_tile()` is more flexible (allows uneven sizes, explicit width/height) but slower for large dense grids. For a 1000x1000 image, use raster.

**How do I make a correlation matrix heatmap in ggplot2?**

Compute correlations with `cor()`, convert to long format via `as.data.frame(as.table(cor_matrix))`, then `geom_tile(aes(fill = cor))` with `scale_fill_gradient2(midpoint = 0)`. Add `geom_text(aes(label = round(cor, 2)))` to show numeric values.

**Why are there gaps in my geom_tile heatmap?**

Tiles default to width 1 and height 1 in data units. If x or y are not evenly spaced (e.g., dates with gaps, irregular bin boundaries), tiles will have gaps. Either set explicit `width =` and `height =` in `geom_tile()`, or use `geom_raster()` after binning to a regular grid.

**How do I add text labels to a ggplot2 heatmap?**

Add `geom_text(aes(label = value))` after `geom_tile()`. For numeric values, round first: `aes(label = round(value, 2))`. Pick text color with `color = "white"` (good on dark tiles) or `color = "black"` (good on light tiles).
