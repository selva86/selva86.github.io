---
title: "ggplot2 geom_bin2d() in R: 2D Rectangular Density Bins"
slug: "ggplot2-geom_bin2d-in-R"
description: "Use ggplot2 geom_bin2d() to plot 2D density with rectangular bins for dense scatter data in R. Covers bins, fill, vs geom_hex, and 5 worked examples."
keywords: "ggplot2 geom_bin2d, R 2d histogram, geom_bin2d bins, geom_bin2d vs geom_hex, rectangular bins ggplot"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "ggplot2-functions"
fr_parent: "ggplot2-Tutorial-With-R.html"
auto_link_terms: "geom_bin2d()|ggplot2 geom_bin2d|2d histogram|geom_bin2d bins|rectangular bins"
auto_link_case_sensitive: true
target_keyword: "ggplot2 geom_bin2d"
sibling_block_enabled: true
difficulty: "Beginner"
---

# ggplot2 geom_bin2d() in R: 2D Rectangular Density Bins

<p class="lead">The <code>geom_bin2d()</code> function in ggplot2 plots 2D point density using RECTANGULAR bins. It is the rectangle-bin sister of <code>geom_hex()</code>, useful for scatter plots with many overlapping points.</p>

[QUICK ANSWER]
ggplot(df, aes(x, y)) + geom_bin2d()
geom_bin2d(bins = 30)                   # control bin count
geom_bin2d(binwidth = c(0.5, 1))         # specific bin widths
geom_hex()                                # hexagonal alternative
geom_density_2d()                         # contour lines

[DECISION TREE: Is geom_bin2d() the right tool?]
- 2D density with rectangular bins: geom_bin2d()
- hexagonal bins: geom_hex()
- raw scatter (few points): geom_point()
- contour lines: geom_density_2d()
- transparent overplotting: geom_point(alpha = 0.3)

## What geom_bin2d() does in one sentence

**`geom_bin2d()` divides the (x, y) plane into rectangular bins and colors each by point count.** Equivalent to a 2D histogram.

## Syntax

**`geom_bin2d(bins = 30, binwidth = NULL, ...)`. Built into ggplot2; no extra packages.**

```r title="2D histogram"
library(ggplot2)

ggplot(diamonds, aes(carat, price)) +
  geom_bin2d(bins = 50)
```

[TIP]
**`geom_bin2d` doesn't need any extra package; `geom_hex` requires `hexbin`.** Use bin2d if you want zero dependencies.

## Five common patterns

### 1. Standard 2D histogram

```r title="Carat vs price"
ggplot(diamonds, aes(carat, price)) +
  geom_bin2d()
```

### 2. Finer bins

```r title="More resolution"
ggplot(diamonds, aes(carat, price)) +
  geom_bin2d(bins = 100)
```

### 3. Custom binwidth

```r title="Specific bin sizes"
ggplot(diamonds, aes(carat, price)) +
  geom_bin2d(binwidth = c(0.1, 200))
```

### 4. Color scale

```r title="Viridis"
ggplot(diamonds, aes(carat, price)) +
  geom_bin2d() +
  scale_fill_viridis_c()
```

### 5. Compare to geom_hex

```r title="Side by side"
library(patchwork)
p1 <- ggplot(diamonds, aes(carat, price)) + geom_bin2d() + ggtitle("bin2d")
p2 <- ggplot(diamonds, aes(carat, price)) + geom_hex() + ggtitle("hex")
p1 + p2
```

[KEY INSIGHT]
**`geom_bin2d` and `geom_hex` produce similar visualizations.** Hex looks more organic; bin2d is simpler. Pick by aesthetic preference.

## geom_bin2d() vs geom_hex() vs geom_point() with alpha

| Function | Bin | Dependency |
|---|---|---|
| `geom_bin2d()` | Rectangular | None |
| `geom_hex()` | Hexagonal | hexbin |
| `geom_point(alpha)` | None | None |

For dependency-free 2D density, geom_bin2d is the choice.

## A practical workflow

**Use geom_bin2d for dense scatter where rectangular bins suffice.**

```r
ggplot(diamonds, aes(carat, price)) +
  geom_bin2d(bins = 50) +
  scale_fill_viridis_c() +
  scale_y_log10()
```

## Common pitfalls

**Pitfall 1: too few bins.** Default 30 is often coarse. Try 50 or 100.

**Pitfall 2: forgetting fill scale.** Default fill is gradient blue. Use `scale_fill_viridis_c()` or similar for better visibility.

[WARNING]
**`geom_bin2d` colors bins by COUNT.** For density (count per unit area), use `stat_density_2d` or normalize.

## Try it yourself

**Try it:** Plot 2D bin histogram of mtcars wt vs mpg. Save to `ex_plot`.

```r title="Your turn: 2d hist"
ex_plot <- mtcars |>
  ggplot(aes(wt, mpg)) +
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_plot <- ggplot(mtcars, aes(wt, mpg)) +
  geom_bin2d(bins = 10) +
  scale_fill_viridis_c()
```

**Explanation:** mtcars has 32 points; few bins is appropriate.

</details>

## Related ggplot2 functions

After mastering geom_bin2d, look at:

- `geom_hex()`: hexagonal bins
- `geom_density_2d()`: contour lines
- `stat_density_2d()`: smooth density
- `geom_point(alpha)`: scatter alternative

## FAQ

**What does geom_bin2d do in ggplot2?**

`geom_bin2d()` plots 2D point density using rectangular bins; each bin is colored by point count.

**What is the difference between geom_bin2d and geom_hex?**

geom_bin2d uses rectangles; geom_hex uses hexagons. Hex is more organic-looking; bin2d is dependency-free.

**Do I need a special package for geom_bin2d?**

No. It is built into ggplot2.

**How many bins should I use?**

Default 30 is OK for medium data. For dense plots, try 50-100.

**How do I show density (not count) per bin?**

Use `stat_density_2d` for smoothed density, or normalize the count manually before plotting.
