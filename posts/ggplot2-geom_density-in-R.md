---
title: "ggplot2 geom_density() in R: Density Plots With Examples"
slug: "ggplot2-geom_density-in-R"
description: "Use ggplot2 geom_density() to draw smooth distribution curves in R. Covers fill, alpha, group comparison, bandwidth tuning, stacking, and 6 worked examples."
keywords: "geom_density, ggplot2 density plot, density plot in R, R density examples, ggplot2 multiple density, kernel density ggplot2"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "ggplot2-functions"
fr_parent: "ggplot2-Tutorial-With-R.html"
auto_link_terms: "geom_density()|ggplot2 geom_density|ggplot2 density plot|density plot in ggplot2|density curve R"
auto_link_case_sensitive: true
target_keyword: "geom_density"
sibling_block_enabled: true
difficulty: "Beginner"
---

# ggplot2 geom_density() in R: Density Plots With Examples

<p class="lead">The <code>geom_density()</code> function in ggplot2 draws a smooth kernel density estimate of a continuous variable. It is the smoothed version of a histogram and the cleanest way to compare distribution SHAPES across groups.</p>

[QUICK ANSWER]
ggplot(df, aes(x)) + geom_density()                           # basic curve
ggplot(df, aes(x, fill = group)) + geom_density(alpha = 0.4)  # multiple, transparent
ggplot(df, aes(x, color = group)) + geom_density()            # color outlines only
ggplot(df, aes(x)) + geom_density(adjust = 0.5)               # tighter (more detail)
ggplot(df, aes(x)) + geom_density(adjust = 2)                 # smoother
ggplot(df, aes(x)) + geom_density(fill = "steelblue", alpha = 0.5)
ggplot(df, aes(x, fill = group)) + geom_density(position = "stack")  # stacked

[DECISION TREE: Is geom_density() the right tool?]
- distribution shape, one variable: geom_density()
- compare distribution shapes by group: aes(fill = grp) + geom_density(alpha)
- discrete bins (count per bin): geom_histogram()
- distribution + box summary: geom_violin() + geom_boxplot()
- 2D density: geom_density_2d() or geom_hex()
- cumulative distribution: stat_ecdf()
- ridge plots (stacked densities): ggridges::geom_density_ridges()

## What geom_density() does in one sentence

**`geom_density()` draws a smooth curve estimating where data values cluster.** Tall regions of the curve correspond to data-dense ranges; short regions to sparse ranges. The total area under the curve equals 1 by default (probability density).

Compared to `geom_histogram()`, density is smoother (no bin choice) and easier to overlay across groups, but it can hide local features and depends on a bandwidth choice.

## Syntax

**`geom_density()` requires `aes(x)`. The y axis is computed (density by default).**

```r title="Load ggplot2 and inspect mpg"
library(ggplot2)

range(mpg$hwy)
#> [1] 12 44
nrow(mpg)
#> [1] 234
```

The full signature:

```
geom_density(mapping = NULL, data = NULL, stat = "density", position = "identity",
             ..., na.rm = FALSE, orientation = NA, show.legend = NA, inherit.aes = TRUE)
```

[TIP]
**`adjust` controls bandwidth (smoothness).** `adjust = 1` is the default. `adjust = 0.5` halves the bandwidth (tighter, more detail, can show real bumps). `adjust = 2` doubles it (smoother, may hide structure). Try a few values when shape matters.

## Six common patterns

### 1. Basic density curve

```r title="Highway mpg density"
ggplot(mpg, aes(x = hwy)) +
  geom_density(fill = "steelblue", alpha = 0.5)
```

The simplest case: density curve with semi-transparent fill.

### 2. Compare densities across groups

```r title="Density per drivetrain"
ggplot(mpg, aes(x = hwy, fill = drv)) +
  geom_density(alpha = 0.4)
```

`fill = drv` colors the curves. `alpha = 0.4` makes them transparent so overlapping regions are visible.

### 3. Outlines only (no fill)

```r title="Color outlines without fill"
ggplot(mpg, aes(x = hwy, color = drv)) +
  geom_density(linewidth = 1)
```

For very busy plots with many groups, color-coded LINES (no fill) are cleaner than filled areas.

### 4. Tighter or smoother bandwidth

```r title="Tighter (more detail)"
ggplot(mpg, aes(x = hwy)) +
  geom_density(fill = "lightgray", color = "darkblue", adjust = 0.5)
```

`adjust = 0.5` reveals more local structure. Useful when the data may be multimodal. `adjust = 2` would smooth it heavily.

### 5. Density + histogram together

```r title="Histogram + density overlay"
ggplot(mpg, aes(x = hwy)) +
  geom_histogram(aes(y = after_stat(density)), binwidth = 2,
                 fill = "lightgray", color = "white") +
  geom_density(color = "firebrick", linewidth = 1)
```

`aes(y = after_stat(density))` puts the histogram on the SAME y scale as the density curve so they overlay cleanly. Without this, they would be on different scales (count vs density).

### 6. Stacked densities

```r title="Stack densities to show composition"
ggplot(mpg, aes(x = hwy, fill = drv)) +
  geom_density(position = "stack", alpha = 0.7)
```

`position = "stack"` stacks the densities so the total area at each x equals the marginal density. Less common than overlay but useful for showing decomposition.

[KEY INSIGHT]
**Density curves implicitly assume continuous data.** With discrete data (e.g., integer counts), density looks lumpy or wrong because the kernel smoother bridges values that should be separate. Use `geom_bar()` for counts or `geom_histogram()` with carefully chosen bins instead.

## geom_density() vs geom_histogram() vs geom_violin()

**Three views of distribution; choose by audience and N.**

| Feature | geom_density | geom_histogram | geom_violin |
|---|---|---|---|
| Smoothness | High | Bin-dependent | High (mirrored density) |
| Reveals bumps | Yes (with low adjust) | Yes (with small bins) | Yes |
| One variable | Best | Best | (needs grouping x) |
| Many groups | Yes (with alpha) | Yes (with alpha) | Yes (across x) |
| Bandwidth choice | Required | Bin width required | Required |
| Best when... | Comparing shapes | You want to see bin counts | Comparing many groups |

When to use which:

- Use `geom_density()` for shape comparison across 2 to 5 groups.
- Use `geom_histogram()` when bin counts are part of the story.
- Use `geom_violin()` when comparing 6+ groups along a categorical x.

## Common pitfalls

**Pitfall 1: density implies continuous data.** If your variable is integer counts (0, 1, 2, ...), the density curve "smears" between values and creates artifacts. Use `geom_bar()` instead.

**Pitfall 2: bandwidth choice changes interpretation.** Default `adjust = 1` may oversmooth. Always check what `adjust = 0.5` and `adjust = 2` look like; pick whichever reveals real structure without obvious noise.

[WARNING]
**Density area is normalized to 1; comparing GROUPS by density alone hides sample size.** A group with 5 observations and 5000 observations both have density area 1. To convey sample size, switch to `aes(y = after_stat(count))` or use `geom_histogram(aes(y = after_stat(density)))` colored by group.

**Pitfall 3: bounded data (positive only, or 0 to 1) gets distorted at edges.** Density curves can extend below 0 even when data cannot. Solutions: trim the curve manually, transform the data first (log, logit), or use a bounded density estimator (`bkde` from KernSmooth).

## Try it yourself

**Try it:** Plot the density of `mpg$hwy` separately for each `drv` (drivetrain). Use semi-transparent fills, viridis palette, and a labeled legend. Save to `ex_plot`.

```r title="Your turn: grouped density with viridis"
# Try it: density per drv with viridis fill
ex_plot <- ggplot(mpg, aes(x = hwy, fill = drv)) +
  # your code here

print(ex_plot)
#> Expected: 3 overlapping density curves, viridis colors
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_plot <- ggplot(mpg, aes(x = hwy, fill = drv)) +
  geom_density(alpha = 0.5) +
  scale_fill_viridis_d() +
  labs(x = "Highway MPG", y = "Density", fill = "Drivetrain")

print(ex_plot)
```

**Explanation:** `geom_density(alpha = 0.5)` creates one semi-transparent density per drv. `scale_fill_viridis_d()` uses the discrete viridis palette. `labs()` provides clean axis and legend labels.

</details>

## Related ggplot2 functions

After mastering `geom_density()`, look at:

- `geom_histogram()`: discrete bin counts; pair with density for full picture
- `geom_violin()`: mirrored density for grouped comparison along a categorical x
- `geom_density_2d()`: 2D contour density for two continuous variables
- `geom_freqpoly()`: line version of histogram (alternative to density)
- `stat_ecdf()`: empirical cumulative distribution function
- `ggridges::geom_density_ridges()`: stacked densities for many groups

For density estimation with bounded support (e.g., values >= 0), the `bkde` function from `KernSmooth` plus a `geom_line()` works.

## FAQ

**How do I plot density curves for multiple groups in ggplot2?**

Map a categorical variable to `fill` or `color`: `aes(x = value, fill = group)` then `geom_density(alpha = 0.4)`. The alpha makes overlapping curves visible. Use `color = group` for line-only versions.

**What is the difference between geom_density and geom_histogram?**

`geom_density()` is a smooth curve (kernel density estimate). `geom_histogram()` is binned counts. Density is smoother and easier to compare across groups; histogram preserves bin counts and is more honest about the data's discreteness.

**How do I overlay a density curve on a histogram in ggplot2?**

Set y to density on the histogram first: `geom_histogram(aes(y = after_stat(density))) + geom_density()`. Without rescaling y to density, the curve and histogram are on different scales (count vs density) and overlay incorrectly.

**What does the adjust argument do in geom_density?**

`adjust` is a bandwidth multiplier. `adjust = 1` (default) uses the standard bandwidth. `adjust = 0.5` halves it (tighter, more detail). `adjust = 2` doubles it (smoother). Try several values when distribution shape matters.

**How do I add a vertical line at the mean to a density plot?**

Add `geom_vline(xintercept = mean(your_data), linetype = "dashed")`. Inside a ggplot pipe with grouped data, use `stat_summary(fun = mean, geom = "vline")` or compute group means separately.
