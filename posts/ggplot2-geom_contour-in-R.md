---
title: "ggplot2 geom_contour() in R: Draw Contour Lines"
slug: "ggplot2-geom_contour-in-R"
description: "Use ggplot2 geom_contour() to draw contour lines for 2D density or surfaces in R. Covers vs geom_contour_filled, breaks, and 5 worked examples."
keywords: "ggplot2 geom_contour, R contour plot, geom_contour breaks, geom_contour_filled, 2d contour ggplot"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "ggplot2-functions"
fr_parent: "ggplot2-Tutorial-With-R.html"
auto_link_terms: "geom_contour()|ggplot2 geom_contour|contour plot|geom_contour_filled|2d contour"
auto_link_case_sensitive: true
target_keyword: "ggplot2 geom_contour"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# ggplot2 geom_contour() in R: Draw Contour Lines

<p class="lead">The <code>geom_contour()</code> function in ggplot2 draws contour LINES from a regular grid of (x, y, z) values. It is the standard tool for 2D surface, density, and topographic visualizations.</p>

[QUICK ANSWER]
ggplot(df, aes(x, y, z = z)) + geom_contour()
geom_contour(bins = 10)
geom_contour(breaks = c(0.1, 0.5, 0.9))
geom_contour_filled()                     # filled bands
geom_density_2d()                          # contour from raw points

[DECISION TREE: Is geom_contour() the right tool?]
- contour LINES from grid: geom_contour()
- contour BANDS (filled): geom_contour_filled()
- contour from RAW points (estimate density): geom_density_2d()
- raster / heatmap: geom_raster()
- specific level breaks: geom_contour(breaks = c(...))

## What geom_contour() does in one sentence

**`geom_contour()` draws lines of equal z-value (isolines) on a 2D grid, requiring x, y, and z aesthetics.** Used for surfaces, densities, and topographic-style plots.

## Syntax

**`geom_contour(bins = NULL, binwidth = NULL, breaks = NULL, ...)`. Requires aes(x, y, z).**

```r title="Contour of a surface"
library(ggplot2)

library(dplyr)
df <- expand.grid(x = seq(-3, 3, length = 50),
                  y = seq(-3, 3, length = 50)) |>
  dplyr::mutate(z = exp(-(x^2 + y^2) / 2))

ggplot(df, aes(x, y, z = z)) +
  geom_contour()
```

[TIP]
**For raw-point density (no grid), use `geom_density_2d()` which estimates the density first.** geom_contour requires a regular grid of z values.

## Five common patterns

### 1. Standard contour

```r title="Auto-binned levels"
ggplot(df, aes(x, y, z = z)) +
  geom_contour()
```

### 2. Custom break values

```r title="Specific levels"
ggplot(df, aes(x, y, z = z)) +
  geom_contour(breaks = c(0.1, 0.3, 0.5, 0.7))
```

### 3. Filled contours

```r title="Bands instead of lines"
ggplot(df, aes(x, y, z = z)) +
  geom_contour_filled()
```

### 4. From raw points

```r title="Density estimate -> contour"
ggplot(faithful, aes(eruptions, waiting)) +
  geom_density_2d()
```

### 5. Combine with raster

```r title="Heatmap + contour overlay"
ggplot(df, aes(x, y, z = z)) +
  geom_raster(aes(fill = z)) +
  geom_contour(color = "white") +
  scale_fill_viridis_c()
```

[KEY INSIGHT]
**`geom_contour` needs a 3D dataset: (x, y, z) on a regular grid.** If you have raw 2D points, use `geom_density_2d` which estimates density first.

## geom_contour() vs geom_contour_filled() vs geom_density_2d()

| Function | Input | Output |
|---|---|---|
| `geom_contour()` | Regular grid (x,y,z) | Lines |
| `geom_contour_filled()` | Regular grid | Filled bands |
| `geom_density_2d()` | Raw (x,y) points | Lines from estimated density |

When to use which:

- geom_contour for known surfaces (z provided).
- geom_density_2d for 2D point density.
- geom_contour_filled for solid color bands.

## A practical workflow

**Use geom_contour for visualizing functions or surfaces.**

```r
df <- expand.grid(x = seq(-3, 3, length = 50),
                  y = seq(-3, 3, length = 50)) |>
  mutate(z = sin(x) * cos(y))

ggplot(df, aes(x, y, z = z)) +
  geom_contour() +
  coord_fixed()
```

## Common pitfalls

**Pitfall 1: irregular grid.** geom_contour needs x and y on regular grids. Irregular spacing produces visual artifacts.

**Pitfall 2: confusing with geom_density_2d.** geom_contour expects PRE-COMPUTED z. geom_density_2d estimates from raw points.

[WARNING]
**`geom_contour` requires a Z aesthetic.** Without it, no contour lines appear (only the framework).

## Try it yourself

**Try it:** Plot contour of `z = x^2 + y^2` on a 50x50 grid. Save to `ex_plot`.

```r title="Your turn: contour of a paraboloid"
df <- expand.grid(x = seq(-3, 3, length = 50),
                  y = seq(-3, 3, length = 50)) |>
  dplyr::mutate(z = x^2 + y^2)

ex_plot <- df |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_plot <- ggplot(df, aes(x, y, z = z)) +
  geom_contour() +
  coord_fixed()
```

**Explanation:** Concentric circles (level sets of x^2 + y^2).

</details>

## Related ggplot2 functions

After mastering geom_contour, look at:

- `geom_contour_filled()`: filled bands
- `geom_density_2d()`: from raw points
- `geom_raster()`: heatmap
- `stat_contour()`: stat layer

## FAQ

**What does geom_contour do in ggplot2?**

`geom_contour()` draws contour lines (isolines) from a 2D grid of (x, y, z) values.

**What is the difference between geom_contour and geom_density_2d?**

geom_contour expects pre-computed z values on a grid. geom_density_2d estimates density from raw 2D points and draws contours.

**How do I customize contour levels?**

Pass `breaks = c(0.1, 0.5, 0.9)` to specify levels, or `bins = 10` for auto-spaced.

**How do I get filled contour regions?**

Use `geom_contour_filled()` instead. It fills between levels.

**Can I overlay contours on a raster?**

Yes. `geom_raster() + geom_contour()` gives heatmap with contour lines on top.
