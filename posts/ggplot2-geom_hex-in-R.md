---
title: "ggplot2 geom_hex() in R: 2D Hexagonal Density Bins"
slug: "ggplot2-geom_hex-in-R"
description: "Use ggplot2 geom_hex() to plot 2D density with hexagonal bins for dense scatter data in R. Covers bins, fill, vs geom_bin2d, and 5 worked examples."
keywords: "ggplot2 geom_hex, R hexbin plot, geom_hex bins, geom_hex vs geom_bin2d, 2d density hex"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "ggplot2-functions"
fr_parent: "ggplot2-Tutorial-With-R.html"
auto_link_terms: "geom_hex()|ggplot2 geom_hex|hexbin plot|geom_hex bins|2d density hex"
auto_link_case_sensitive: true
target_keyword: "ggplot2 geom_hex"
sibling_block_enabled: true
difficulty: "Beginner"
---

# ggplot2 geom_hex() in R: 2D Hexagonal Density Bins

<p class="lead">The <code>geom_hex()</code> function in ggplot2 plots 2D point density using HEXAGONAL bins. It is ideal for scatter plots with many overlapping points, providing a clearer view than transparent geom_point.</p>

[QUICK ANSWER]
ggplot(df, aes(x, y)) + geom_hex()
geom_hex(bins = 30)                     # control bin count
geom_hex() + scale_fill_viridis_c()
geom_bin2d()                             # rectangular bins alternative
geom_density_2d()                        # contour lines

[DECISION TREE: Is geom_hex() the right tool?]
- many points scatter, hexagonal bins: geom_hex()
- rectangular bins: geom_bin2d()
- contour lines (no fill): geom_density_2d()
- raw points with alpha: geom_point(alpha = 0.3)
- few points: geom_point() (no binning needed)

## What geom_hex() does in one sentence

**`geom_hex()` divides the (x, y) plane into hexagonal bins and colors each by the count of points falling in it.** Best for dense scatter data where overlapping obscures patterns.

## Syntax

**`geom_hex(bins = 30, binwidth = NULL, ...)`. Requires `hexbin` package.**

```r title="Hex density of diamonds carat vs price"
library(ggplot2)

ggplot(diamonds, aes(carat, price)) +
  geom_hex(bins = 50)
```

[TIP]
**Install the `hexbin` package: `install.packages("hexbin")`.** geom_hex requires it for the binning math.

## Five common patterns

### 1. Standard hex density

```r title="Diamonds carat vs price"
ggplot(diamonds, aes(carat, price)) +
  geom_hex()
```

### 2. Custom bin count

```r title="Finer bins"
ggplot(diamonds, aes(carat, price)) +
  geom_hex(bins = 50)
```

### 3. Custom binwidth

```r title="Specific bin sizes"
ggplot(df, aes(x, y)) +
  geom_hex(binwidth = c(0.1, 100))
#> bins of width 0.1 in x and 100 in y
```

### 4. Color scale

```r title="Viridis for perceptual uniform"
ggplot(diamonds, aes(carat, price)) +
  geom_hex() +
  scale_fill_viridis_c()
```

### 5. With overlay

```r title="Hex density + LOESS"
ggplot(diamonds, aes(carat, price)) +
  geom_hex(alpha = 0.7) +
  geom_smooth()
```

[KEY INSIGHT]
**For 1000+ point scatter, `geom_hex` is much clearer than `geom_point(alpha=0.3)`.** Hex bins highlight density patterns that transparent points hide.

## geom_hex() vs geom_bin2d() vs geom_point() with alpha

| Function | Bin shape | Best for |
|---|---|---|
| `geom_hex()` | Hexagonal | Dense scatter with smooth visual |
| `geom_bin2d()` | Rectangular | Dense scatter, rectangle-friendly |
| `geom_point(alpha = 0.3)` | None (raw points) | Fewer points |
| `geom_density_2d()` | Contour lines | Smooth density |

## A practical workflow

**Use geom_hex when scatter density is the question.**

```r
ggplot(diamonds, aes(carat, price)) +
  geom_hex(bins = 40) +
  scale_fill_viridis_c() +
  scale_y_log10() +
  labs(x = "Carat", y = "Price (log)", fill = "Count")
```

Density on log-y for skewed price data.

## Common pitfalls

**Pitfall 1: forgetting hexbin package.** geom_hex requires `hexbin`. Install if not already.

**Pitfall 2: too few bins.** Default 30 bins may be too coarse; try 50 or 100 for fine detail.

[WARNING]
**`geom_hex()` requires the `hexbin` package.** Without it, the function errors. Always test imports.

## Try it yourself

**Try it:** Plot a hex density of mpg vs hp from mtcars. Save to `ex_plot`.

```r title="Your turn: mpg vs hp hex"
ex_plot <- mtcars |>
  ggplot(aes(mpg, hp)) +
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_plot <- ggplot(mtcars, aes(mpg, hp)) +
  geom_hex(bins = 15) +
  scale_fill_viridis_c()
```

**Explanation:** mtcars has only 32 points so use fewer bins. Hex shows density even with sparse data.

</details>

## Related ggplot2 functions

After mastering geom_hex, look at:

- `geom_bin2d()`: rectangular bins alternative
- `geom_density_2d()`: contour lines
- `geom_point(alpha)`: raw scatter
- `stat_density_2d()`: density estimation

## FAQ

**What does geom_hex do in ggplot2?**

`geom_hex()` plots 2D point density using hexagonal bins. Each bin is colored by the count of points within it.

**Do I need a special package for geom_hex?**

Yes. Install `hexbin`: `install.packages("hexbin")`. Without it, geom_hex errors.

**What is the difference between geom_hex and geom_bin2d?**

geom_hex uses hexagonal bins; geom_bin2d uses rectangular. Hexagons reduce visual artifacts at bin boundaries; rectangles are simpler.

**How many bins should I use?**

Default 30 is OK for medium data. For >10k points, try 50-100 for finer detail.

**Should I use geom_hex or scatter with alpha?**

For 1k+ overlapping points, geom_hex is clearer. For <1k, geom_point with alpha works well.
