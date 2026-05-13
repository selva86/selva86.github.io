---
title: "ggplot2 scale_size() in R: Control Point and Bubble Size"
slug: "ggplot2-scale_size-in-R"
description: "Use ggplot2 scale_size() in R to control point and bubble plot sizes. Covers range, scale_size_area(), scale_radius(), legend tuning, 5 worked examples."
keywords: "ggplot2 scale_size, R bubble plot, scale_size_area, scale_radius, scale_size range, ggplot point size legend"
mathjax: false
webr: true
date: "2026-05-14"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "ggplot2-functions"
fr_parent: "ggplot2-Tutorial-With-R.html"
auto_link_terms: "scale_size()|ggplot2 scale_size|scale_size_area()|scale_radius()|bubble plot ggplot"
auto_link_case_sensitive: true
target_keyword: "ggplot2 scale_size"
sibling_block_enabled: true
difficulty: "Beginner"
---

# ggplot2 scale_size() in R: Control Point and Bubble Size

<p class="lead">The <code>scale_size()</code> function in ggplot2 maps a numeric variable to point area so larger values draw bigger points. It is the standard scale behind bubble plots and any chart that uses the <code>size</code> aesthetic.</p>

[QUICK ANSWER]
scale_size(range = c(1, 10))                       # min, max in mm
scale_size(range = c(2, 12), name = "Population")  # tune legend title
scale_size_area(max_size = 15)                     # 0 maps to size 0
scale_radius(range = c(1, 10))                     # map to radius, not area
scale_size_continuous(breaks = c(10, 100, 1000))   # explicit legend breaks
scale_size_manual(values = c(2, 4, 8))             # discrete level to size

[DECISION TREE: Is scale_size() the right tool?]
- numeric variable to point area: scale_size()
- value 0 must show as size 0: scale_size_area()
- map to radius for honest radius comparison: scale_radius()
- discrete factor levels to fixed sizes: scale_size_manual()
- color, not size, by value: scale_color_gradient()
- fix size for all points (no mapping): geom_point(size = 3)

## What scale_size() does in one sentence

**`scale_size()` maps a continuous numeric variable to the AREA of points so visual size grows with value.** Area scaling (not radius) matches how humans perceive size, so it is the right default for bubble plots.

## Syntax and arguments

**`scale_size(name = waiver(), breaks = waiver(), labels = waiver(), limits = NULL, range = c(1, 6), trans = "identity", guide = "legend")`.** The `range` argument is the most-used one: a length-2 numeric vector giving the minimum and maximum point size in millimetres.

```r title="Default range vs widened range"
library(ggplot2)

ggplot(mtcars, aes(wt, mpg, size = hp)) +
  geom_point(alpha = 0.7) +
  scale_size(range = c(2, 12), name = "Horsepower")
```

The default `range = c(1, 6)` is conservative. A wider range like `c(2, 12)` exaggerates size differences and is usually what you want for a clear bubble plot.

[TIP]
**Always widen `range` for bubble plots; defaults look flat.** `scale_size(range = c(2, 14))` is a good starting point when bubbles need to be visually distinct.

## Five common patterns

### 1. Basic bubble plot

```r title="Bubble plot with mtcars"
ggplot(mtcars, aes(wt, mpg, size = hp)) +
  geom_point(alpha = 0.6, color = "steelblue") +
  scale_size(range = c(2, 12)) +
  labs(title = "Weight vs MPG, bubble = horsepower")
```

The `size = hp` mapping inside `aes()` tells ggplot which variable controls the bubble. `scale_size()` then defines how that variable becomes a drawing size.

### 2. Honest zero with scale_size_area()

```r title="Zero values map to zero size"
df <- data.frame(x = 1:5, y = 1:5, val = c(0, 2, 5, 10, 20))

ggplot(df, aes(x, y, size = val)) +
  geom_point() +
  scale_size_area(max_size = 15)
```

`scale_size_area()` forces a value of zero to map to size zero, which `scale_size()` does not guarantee. Use this whenever zero is a meaningful data point.

### 3. Radius instead of area

```r title="Map value to radius via scale_radius()"
ggplot(mtcars, aes(wt, mpg, size = hp)) +
  geom_point(alpha = 0.7) +
  scale_radius(range = c(1, 12))
```

`scale_radius()` maps the variable to point radius. This exaggerates differences (a 2x value becomes a 4x area), so prefer `scale_size()` unless you have a specific reason.

[WARNING]
**`scale_radius()` overstates differences visually.** A value twice as large appears four times as big in area. Use `scale_size()` or `scale_size_area()` for accurate perception.

### 4. Custom legend breaks and labels

```r title="Tidy legend with explicit breaks"
ggplot(mtcars, aes(wt, mpg, size = hp)) +
  geom_point(alpha = 0.6) +
  scale_size(
    range = c(2, 12),
    breaks = c(100, 200, 300),
    labels = c("100 hp", "200 hp", "300 hp"),
    name = "Engine power"
  )
```

Without explicit `breaks`, ggplot picks tick values automatically. For a polished plot, pass `breaks` to control which sizes show in the legend.

### 5. Discrete levels with scale_size_manual()

```r title="Fixed size per factor level"
mtcars$cyl_f <- factor(mtcars$cyl)

ggplot(mtcars, aes(wt, mpg, size = cyl_f)) +
  geom_point(alpha = 0.7) +
  scale_size_manual(values = c("4" = 3, "6" = 6, "8" = 10))
```

Use `scale_size_manual()` when the size variable is a factor and you want to assign specific sizes by hand.

[KEY INSIGHT]
**`scale_size()` controls how a variable maps to size; `geom_point(size = 3)` sets a fixed size for ALL points.** If you set both, ggplot uses the aesthetic mapping and ignores the fixed value.

## scale_size() vs scale_size_area() vs scale_radius()

| Function | Maps value to | Zero handling | Best for |
|---|---|---|---|
| `scale_size()` | Point area | Not pinned to 0 | Standard bubble plots |
| `scale_size_area()` | Point area | 0 maps to size 0 | Counts, populations, where 0 is meaningful |
| `scale_radius()` | Point radius | Not pinned to 0 | Rare; only when radius comparison matters |
| `scale_size_manual()` | Discrete levels | Manual | Factor variable with hand-picked sizes |
| `scale_size_continuous()` | Point area | Same as `scale_size()` | Alias; identical behaviour |

## Common pitfalls

**Pitfall 1: bubbles too small to see.** The default `range = c(1, 6)` is conservative. If bubbles look flat, widen it: `scale_size(range = c(2, 14))`.

**Pitfall 2: confusing `size = hp` (inside `aes()`) with `size = 3` (outside).** Inside `aes()` it maps a variable; outside it sets a fixed size. Mixing them silently overrides the mapping.

**Pitfall 3: overlap.** Large bubbles overlap and hide each other. Add `alpha = 0.5` to `geom_point()` so overlaps stay visible, or use `position_jitter()` for clustered data.

## Try it yourself

**Try it:** Build a bubble plot of `airquality` with `Wind` on x, `Temp` on y, and `Ozone` controlling bubble size. Widen the range to `c(2, 12)` and label the legend "Ozone (ppb)". Save the plot to `ex_bubble`.

```r title="Your turn: airquality bubbles"
ex_bubble <- airquality |>
  ggplot(aes(Wind, Temp, size = Ozone)) +
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_bubble <- ggplot(airquality, aes(Wind, Temp, size = Ozone)) +
  geom_point(alpha = 0.6, color = "darkred") +
  scale_size(range = c(2, 12), name = "Ozone (ppb)")

ex_bubble
```

**Explanation:** Map `Ozone` to `size` inside `aes()`, then call `scale_size()` to widen the range and rename the legend. Add `alpha` so overlapping bubbles stay readable.

</details>

## Related ggplot2 functions

After mastering `scale_size()`, look at:

- `geom_point()`: the main geom that uses the size aesthetic
- `scale_size_area()`: enforces a 0 value to 0 size mapping
- `scale_radius()`: maps to radius instead of area
- `scale_color_gradient()`: continuous color scaling (often paired with size)
- `aes()`: where you map `size = variable` in the first place

For full theory, see the [official ggplot2 scale_size reference](https://ggplot2.tidyverse.org/reference/scale_size.html).

## FAQ

**What is the difference between scale_size and scale_size_area in ggplot2?**

Both map a variable to point area. `scale_size()` does NOT guarantee that a value of zero produces a size of zero; the smallest value in the data takes the lower end of `range`. `scale_size_area()` forces zero to map to zero size and uses `max_size` instead of `range`. Use `scale_size_area()` when zero values are meaningful in your data (e.g., counts, populations).

**How do I make bubbles bigger in ggplot2?**

Pass a wider `range` to `scale_size()`. The default is `range = c(1, 6)`. For a more dramatic bubble plot, try `range = c(2, 14)` or even `c(3, 20)`. You can also use `scale_size_area(max_size = 20)` if you want zero to map to zero.

**Why is scale_size based on area instead of radius?**

Humans judge circle size by area, not radius. If you map a variable to radius, a 2x value becomes a 4x area, which exaggerates differences. ggplot maps to area by default so visual size matches numeric value. Use `scale_radius()` only if you have a specific need.

**How do I change the legend title for scale_size?**

Pass `name = "Your Title"` to `scale_size()`, or use `labs(size = "Your Title")` on the plot. Both work; `name` keeps the change local to the scale.

**Can I use scale_size with a discrete variable?**

Yes, use `scale_size_manual(values = c("a" = 2, "b" = 6))` to map factor levels to explicit sizes. The default `scale_size()` expects a continuous variable and will warn if you pass a factor.
