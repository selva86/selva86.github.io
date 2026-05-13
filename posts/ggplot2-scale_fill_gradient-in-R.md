---
title: "ggplot2 scale_fill_gradient() in R: Custom Color Gradients"
slug: "ggplot2-scale_fill_gradient-in-R"
description: "Use ggplot2 scale_fill_gradient() in R for two-color fill gradients on heatmaps and bars. Covers low, high, limits, breaks, gradient2, gradientn variants."
keywords: "ggplot2 scale_fill_gradient, R fill gradient, scale_fill_gradient2, scale_fill_gradientn, ggplot heatmap colors"
mathjax: false
webr: true
date: "2026-05-14"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "ggplot2-functions"
fr_parent: "ggplot2-Tutorial-With-R.html"
auto_link_terms: "scale_fill_gradient()|scale_fill_gradient2()|scale_fill_gradientn()|ggplot2 fill gradient|two-color fill gradient"
auto_link_case_sensitive: true
target_keyword: "ggplot2 scale_fill_gradient"
sibling_block_enabled: true
difficulty: "Beginner"
---

# ggplot2 scale_fill_gradient() in R: Custom Color Gradients

<p class="lead">ggplot2 <code>scale_fill_gradient()</code> in R maps a continuous variable to a two-color fill gradient (default dark blue to light blue). Pass <code>low</code> and <code>high</code> to set the endpoints, then pair the scale with <code>geom_tile()</code>, <code>geom_raster()</code>, or <code>geom_col()</code>.</p>

[QUICK ANSWER]
scale_fill_gradient()                                        # default blue gradient
scale_fill_gradient(low = "white", high = "red")             # custom 2-color
scale_fill_gradient2(low = "blue", mid = "white", high = "red")  # diverging 3-color
scale_fill_gradientn(colors = c("white", "yellow", "red"))   # multi-color palette
scale_fill_gradient(limits = c(0, 100), breaks = c(0, 50, 100))  # fixed legend range
scale_fill_gradient(na.value = "grey80")                     # color for NAs
scale_fill_gradient(trans = "log10")                         # log-scaled colors

[DECISION TREE: Is scale_fill_gradient() the right tool?]
- two-color fill gradient: scale_fill_gradient(low, high)
- three-color diverging fill: scale_fill_gradient2(low, mid, high)
- multi-stop palette fill: scale_fill_gradientn(colors)
- perceptually uniform fill: scale_fill_viridis_c()
- color (not fill) aesthetic: scale_color_gradient()
- discrete categorical fill: scale_fill_manual() or scale_fill_brewer()

## What scale_fill_gradient() does in one sentence

**scale_fill_gradient() builds a continuous two-color fill scale for ggplot2.** It linearly interpolates between a low color (default dark blue, `#132B43`) and a high color (default light blue, `#56B1F7`) across the range of a numeric variable mapped to the fill aesthetic. The function is part of the ggplot2 fill gradient family and lives alongside `scale_fill_gradient2()` (diverging, three-color) and `scale_fill_gradientn()` (arbitrary n-color palette).

## Syntax and arguments

**scale_fill_gradient(low, high, ...) maps the fill aesthetic to a continuous color gradient.** Six arguments cover almost every authoring need: `low`, `high`, `na.value`, `limits`, `breaks`, and `labels`.

```r title="Default gradient on a tile heatmap"
library(ggplot2)

df <- expand.grid(x = 1:5, y = 1:5)
df$z <- df$x * df$y

ggplot(df, aes(x, y, fill = z)) +
  geom_tile() +
  scale_fill_gradient()
```

Key arguments at a glance:

- `low` and `high`: the two endpoint colors (any valid R color name, hex code, or `rgb()` value).
- `na.value`: color used for missing values in the fill variable (default `"grey50"`).
- `limits = c(min, max)`: clip the data range; values outside the limits become NA unless `oob` is set.
- `breaks` and `labels`: tick positions and tick labels on the colorbar legend.
- `guide`: legend type, usually `"colorbar"` (default) or `"legend"`.

## Five practical patterns

**These five recipes cover almost every real-world use of the two-color fill gradient.**

[TIP]
**`scale_fill_continuous()` is a shortcut to the default fill scale.** Setting `options(ggplot2.continuous.fill = "viridis")` swaps the project-wide default to viridis palette without touching individual plots.

### 1. Custom low and high colors

```r title="White to dark red gradient"
ggplot(df, aes(x, y, fill = z)) +
  geom_tile() +
  scale_fill_gradient(low = "white", high = "darkred")
```

### 2. Fixed limits and custom breaks

```r title="Pin the legend range to a fixed scale"
ggplot(df, aes(x, y, fill = z)) +
  geom_tile() +
  scale_fill_gradient(low = "white", high = "darkred",
                      limits = c(0, 25),
                      breaks = c(0, 10, 25))
```

### 3. Diverging three-color with gradient2

```r title="Blue white red diverging palette"
df$dev <- df$z - 12.5
ggplot(df, aes(x, y, fill = dev)) +
  geom_tile() +
  scale_fill_gradient2(low = "blue", mid = "white",
                       high = "red", midpoint = 0)
```

### 4. Multi-color palette with gradientn

```r title="Custom four-stop palette"
ggplot(df, aes(x, y, fill = z)) +
  geom_tile() +
  scale_fill_gradientn(colors = c("white", "yellow", "orange", "red"))
```

### 5. Gradient on a bar chart

```r title="Gradient-filled horizontal bars by mpg"
ggplot(mtcars, aes(reorder(rownames(mtcars), mpg), mpg, fill = mpg)) +
  geom_col() +
  scale_fill_gradient(low = "tomato", high = "steelblue") +
  coord_flip() +
  labs(x = NULL)
```

## gradient() vs gradient2() vs gradientn()

**The three functions span increasing palette complexity.**

| Function | Colors | Best for | Key arguments |
|---|---|---|---|
| `scale_fill_gradient()` | 2 | One-directional magnitude | low, high |
| `scale_fill_gradient2()` | 3 | Diverging around a midpoint | low, mid, high, midpoint |
| `scale_fill_gradientn()` | n | Arbitrary multi-stop palette | colors (vector) |

When to use which:

- `gradient()` for one-directional magnitude (low intensity to high intensity).
- `gradient2()` when zero or a center value carries meaning (residuals, correlations, percent change).
- `gradientn()` when you want a multi-stop palette (terrain colors, heat, custom corporate palette).

[KEY INSIGHT]
**Pick the gradient that matches the data's center, not the colors you like first.** Diverging data on a one-directional gradient hides the sign of deviations; pure magnitude data on a diverging palette implies a meaningful midpoint where none exists. The choice of `gradient` vs `gradient2` is a statistical decision, not an aesthetic one.

## Common pitfalls

**Three mistakes account for most scale_fill_gradient bugs.**

**Pitfall 1: fill vs color aesthetic.** Geoms like `geom_point()`, `geom_line()`, and `geom_text()` use `color`, not `fill`, for their primary visual. Pair `scale_fill_*` with fill-capable geoms (`geom_tile`, `geom_raster`, `geom_col`, `geom_bar`, `geom_polygon`, `geom_sf`). For points, lines, and text, use `scale_color_gradient()` instead.

**Pitfall 2: discrete data on a continuous scale.** `scale_fill_gradient()` is continuous. If the fill variable is a factor or character, ggplot errors with `"Continuous value supplied to discrete scale"`. Convert the variable with `as.numeric()` first or switch to `scale_fill_manual()` and `scale_fill_brewer()` for true categories.

**Pitfall 3: limits that silently clip the data.** Setting `limits = c(0, 10)` when the data ranges to 25 turns out-of-bounds values into NA (greyed-out cells). Set `oob = scales::squish` to clamp out-of-bounds values to the nearest limit instead of dropping them, or widen the limits.

[WARNING]
**The default low color (`#132B43`) is much darker than the default high (`#56B1F7`).** Most readers expect "high values look bold, low values look pale" but the default flips that convention. Override the defaults whenever the implicit reading direction matters.

## Try it yourself

**Try it:** Take the `volcano` dataset built into base R and plot it as a heatmap with `geom_tile()`. Use `scale_fill_gradient()` with `low = "white"` and `high = "darkgreen"`. Save the plot to `ex_volcano`.

```r title="Your turn: volcano heatmap"
volcano_df <- expand.grid(x = 1:nrow(volcano), y = 1:ncol(volcano))
volcano_df$z <- as.vector(volcano)

ex_volcano <- # your code here
ex_volcano
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_volcano <- ggplot(volcano_df, aes(x, y, fill = z)) +
  geom_tile() +
  scale_fill_gradient(low = "white", high = "darkgreen") +
  coord_equal()
ex_volcano
```

**Explanation:** `expand.grid()` builds the cell grid, `as.vector()` flattens the matrix to a numeric column ggplot can map to fill, and `coord_equal()` keeps cells square so the elevation map reads correctly.

</details>

## Related ggplot2 functions

**After mastering scale_fill_gradient(), these scales handle adjacent jobs.**

- `scale_color_gradient()`: same idea applied to the color aesthetic (points, lines, text).
- `scale_fill_viridis_c()`: perceptually uniform, colorblind-safe palette.
- `scale_fill_distiller()`: continuous ColorBrewer palette built on `scale_color_brewer()`.
- `scale_fill_manual()`: discrete categorical fill with explicit color values.
- `scale_x_continuous()`: continuous x-axis with a similar limits/breaks API.

For the full argument list and edge cases, see the [ggplot2 scale_fill_gradient reference](https://ggplot2.tidyverse.org/reference/scale_gradient.html).

## FAQ

**What does scale_fill_gradient do in ggplot2?**

`scale_fill_gradient()` maps a continuous numeric variable to a two-color fill gradient. It interpolates linearly between a low color and a high color across the range of the variable. The function works with fill-capable geoms such as `geom_tile()`, `geom_raster()`, `geom_col()`, `geom_bar()`, `geom_polygon()`, and `geom_sf()`. Without arguments it produces the default dark-blue to light-blue gradient.

**What is the difference between scale_fill_gradient and scale_color_gradient?**

The two scales are identical in mechanics but apply to different aesthetics. `scale_fill_gradient()` targets the fill aesthetic, used by area geoms like tiles, bars, and polygons. `scale_color_gradient()` targets the color aesthetic, used by points, lines, and text. Choose the one that matches the aesthetic in your `aes()` mapping; mixing them silently does nothing because the scale targets the wrong slot.

**How do I add a midpoint to a ggplot gradient?**

Switch to `scale_fill_gradient2()` and pass `midpoint`. The diverging variant uses three colors (low, mid, high) and centers the mid color on the midpoint value. A correlation heatmap typically uses `scale_fill_gradient2(low = "blue", mid = "white", high = "red", midpoint = 0)` so negative correlations show blue, positive show red, and values near zero render white.

**How do I reverse the direction of scale_fill_gradient?**

Swap the values you pass to `low` and `high`. For example, `scale_fill_gradient(low = "red", high = "white")` reverses the default direction. There is no `direction = -1` argument on `scale_fill_gradient()` itself; that argument exists on `scale_fill_viridis_c()` and `scale_fill_brewer()`, not on the generic gradient scale.

**What is scale_fill_gradientn used for?**

`scale_fill_gradientn()` accepts an arbitrary vector of colors and builds a multi-stop palette by interpolating between them in order. Pass `colors = c("white", "yellow", "orange", "red")` for a heat palette, or any custom sequence. Use `gradientn` when two colors (gradient) or three (gradient2) cannot express the palette shape you want, such as terrain maps or branded multi-color scales.
