---
title: "ggplot2 geom_density2d() in R: 2D Density Contour Lines"
slug: "ggplot2-geom_density2d-in-R"
description: "Use ggplot2 geom_density2d() to draw 2D density contour lines on a scatter plot in R. Covers bins, contour_var, vs geom_hex, and 5 worked examples."
keywords: "ggplot2 geom_density2d, R 2d density contour, geom_density2d bins, geom_density2d vs geom_hex, kernel density 2D"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "ggplot2-functions"
fr_parent: "ggplot2-Tutorial-With-R.html"
auto_link_terms: "geom_density2d()|ggplot2 geom_density2d|2d density contour|kernel density 2D|geom_density2d bins"
auto_link_case_sensitive: true
target_keyword: "ggplot2 geom_density2d"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# ggplot2 geom_density2d() in R: 2D Density Contour Lines

<p class="lead">The <code>geom_density2d()</code> function in ggplot2 estimates 2D kernel density from raw points and draws contour LINES of equal density. It is the contour-only sister of <code>geom_density_2d_filled()</code> and complements scatter plots.</p>

[QUICK ANSWER]
ggplot(df, aes(x, y)) + geom_density_2d()
geom_density_2d(bins = 10)               # control contour density
geom_density_2d_filled()                  # filled bands instead
geom_hex()                                 # rectangular alternative
geom_point() + geom_density_2d()          # raw points + density

[DECISION TREE: Is geom_density2d() the right tool?]
- 2D density contour LINES from raw points: geom_density_2d()
- 2D density FILLED bands: geom_density_2d_filled()
- count-based binning: geom_hex(), geom_bin2d()
- per-row density (z given): geom_contour()
- raw scatter: geom_point()

## What geom_density2d() does in one sentence

**`geom_density_2d()` estimates a 2D kernel density from raw (x, y) points and draws contour lines of equal density.** It overlays scatter plots to show density patterns hidden by overplotting.

## Syntax

**`geom_density_2d(bins = NULL, contour_var = "density", h = NULL, ...)`. Requires aes(x, y); raw points (no z).**

```r title="Density contour over scatter"
library(ggplot2)

ggplot(faithful, aes(eruptions, waiting)) +
  geom_point(alpha = 0.4) +
  geom_density_2d()
```

[TIP]
**Use `geom_density_2d_filled()` for filled bands instead of lines.** The two-mode old-faithful dataset shows clear contours either way.

## Five common patterns

### 1. Density on top of scatter

```r title="Reveal hidden density"
ggplot(faithful, aes(eruptions, waiting)) +
  geom_point(alpha = 0.5) +
  geom_density_2d(color = "steelblue")
```

### 2. Filled density bands

```r title="More dramatic"
ggplot(faithful, aes(eruptions, waiting)) +
  geom_density_2d_filled() +
  scale_fill_viridis_d()
```

### 3. Custom number of contours

```r title="bins controls level count"
ggplot(faithful, aes(eruptions, waiting)) +
  geom_density_2d(bins = 5)
```

### 4. With facets

```r title="Per-group density"
ggplot(iris, aes(Sepal.Length, Sepal.Width)) +
  geom_point() +
  geom_density_2d() +
  facet_wrap(~ Species)
```

### 5. Adjust bandwidth

```r title="Smoother / sharper"
ggplot(faithful, aes(eruptions, waiting)) +
  geom_density_2d(h = c(0.5, 5))
```

[KEY INSIGHT]
**`geom_density_2d` is the kernel-density VERSION of `geom_contour`.** geom_contour needs pre-computed z; geom_density_2d estimates density from raw 2D points first, then draws contours.

## geom_density2d() vs geom_hex() vs geom_contour()

| Function | Input | Output |
|---|---|---|
| `geom_density_2d()` | Raw 2D points | Smooth contour lines |
| `geom_density_2d_filled()` | Raw 2D points | Filled bands |
| `geom_hex()` | Raw 2D points | Hex-bin counts |
| `geom_contour()` | (x, y, z) grid | Contours from given z |

When to use which:

- density_2d for smooth density lines.
- hex / bin2d for count-based bins.
- contour when z is already a grid.

## A practical workflow

**Use density contours to reveal cluster structure in dense scatter.**

```r
ggplot(diamonds, aes(carat, price)) +
  geom_point(alpha = 0.1) +
  geom_density_2d(color = "white") +
  scale_y_log10()
```

Two clear density modes (small vs large diamonds) hidden in the overplot become obvious with contours.

## Common pitfalls

**Pitfall 1: too few points.** Density estimation needs many points. With <30, contours look jagged or empty. Use geom_point alone for sparse data.

**Pitfall 2: bandwidth choice.** Default bandwidth is auto-estimated. For multimodal data, the auto choice may oversmooth. Set `h = c(bw_x, bw_y)` manually if needed.

[WARNING]
**Note the underscore: `geom_density_2d`, not `geom_density2d`.** Both work as aliases in current ggplot2, but the underscore form is canonical.

## Try it yourself

**Try it:** Plot density contours over a scatter of mtcars wt vs mpg. Save to `ex_plot`.

```r title="Your turn: density contours"
ex_plot <- mtcars |>
  ggplot(aes(wt, mpg)) +
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_plot <- ggplot(mtcars, aes(wt, mpg)) +
  geom_point(alpha = 0.6) +
  geom_density_2d(color = "steelblue")
```

**Explanation:** Scatter plus density contour shows clusters in the wt-mpg plane.

</details>

## Related ggplot2 functions

After mastering geom_density_2d, look at:

- `geom_density_2d_filled()`: filled bands
- `geom_hex()` / `geom_bin2d()`: bin-based density
- `geom_contour()`: contours from given z grid
- `stat_density_2d()`: same stat, different geom
- `MASS::kde2d()`: underlying density estimation

## FAQ

**What does geom_density_2d do in ggplot2?**

`geom_density_2d()` estimates 2D kernel density from raw points and draws contour lines of equal density.

**What is the difference between geom_density_2d and geom_contour?**

geom_density_2d estimates density from raw points. geom_contour needs a pre-computed (x, y, z) grid.

**How do I get filled density bands?**

Use `geom_density_2d_filled()`. It uses the same density estimate but fills between contours.

**How do I control the number of contour lines?**

Pass `bins = N`. Default is 10. Smaller for fewer levels.

**Is there a "geom_density2d" without underscore?**

Both work. `geom_density_2d` (with underscore) is canonical; `geom_density2d` is an alias.
