---
title: "Violin Plot in R: Draw, Customize, and Combine with Boxplots"
slug: "Violin-Plot-in-R"
description: "Create violin plots in R with ggplot2's geom_violin(). Learn to show distribution shape, embed boxplots, adjust bandwidth, split violins, and choose when to use them over boxplots."
keywords: "violin plot R, geom_violin ggplot2, violin plot ggplot2, violin plot vs boxplot R, R distribution plot, ggplot2 violin customize"
auto_link_terms: "violin plot in R|geom_violin()|violin plot ggplot2|violin plot vs boxplot"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-06"
curriculum_id: "FR-char-1"
post_type: "C"
fr_parent: "ggplot2-Distribution-Charts.html"
sidebar_section: "Visualization"
sidebar_title: "Violin Plot"
difficulty: "Intermediate"
---

# Violin Plot in R: Draw, Customize, and Combine with Boxplots

<p class="lead">A violin plot shows the full distribution of a variable using a mirrored density estimate, making it far more informative than a boxplot for data with multiple modes, heavy tails, or unusual shapes. In ggplot2, <code>geom_violin()</code> creates them in one line.</p>

## Introduction

A boxplot summarises a distribution with five numbers, minimum, Q1, median, Q3, maximum. That's useful for quick comparisons, but it completely hides distribution shape. Two groups with identical boxplots can have wildly different distributions: one unimodal and symmetric, the other bimodal and skewed.

A violin plot solves this by showing the full density estimate of the data on both sides of a central axis, the "width" of the violin at any point represents how many data points fall near that value. Where the violin is widest, data clusters most densely. Where it narrows, data is sparse.

The ideal approach combines both: a violin for shape + a mini boxplot for the five-number summary + optional jitter points for the raw data. Together they give readers more information than any single plot type alone.

In this tutorial you will learn:

- How to draw a basic violin plot with `geom_violin()`
- How to fill, color, and style violins
- How to embed a boxplot inside the violin for dual encoding
- How to add raw data points on top
- How the `adjust` and `scale` parameters control the bandwidth and sizing

## How Does geom_violin() Show the Distribution Shape?

`geom_violin()` uses kernel density estimation (KDE), the same algorithm as `geom_density()`, but mirrors the density curve symmetrically around the group's x-position. Each side of the violin is the density curve reflected.

Let's start with the basics:

```r
library(ggplot2)

# Basic violin plot: highway MPG distribution by drive type
p_violin <- ggplot(mpg, aes(x = drv, y = hwy)) +
  geom_violin() +
  scale_x_discrete(labels = c("4" = "4WD", "f" = "Front", "r" = "Rear")) +
  labs(
    title = "Highway MPG Distribution by Drive Type",
    x     = "Drive Type",
    y     = "Highway MPG"
  )

p_violin
```

The widest part of the front-wheel-drive violin, around 25-30 mpg, shows where most front-wheel-drive cars cluster. The narrower sections indicate fewer cars at those values.

Now add color and fill to distinguish groups:

```r
p_fill <- ggplot(mpg, aes(x = drv, y = hwy, fill = drv)) +
  geom_violin(alpha = 0.8, color = "white") +
  scale_fill_brewer(
    palette = "Set2",
    labels  = c("4" = "4WD", "f" = "Front-wheel", "r" = "Rear-wheel")
  ) +
  scale_x_discrete(labels = c("4" = "4WD", "f" = "Front", "r" = "Rear")) +
  labs(
    title = "Highway MPG Distribution by Drive Type",
    x     = NULL,
    y     = "Highway MPG",
    fill  = "Drive Type"
  ) +
  theme_minimal()

p_fill
```

> **KEY INSIGHT:** Use `fill` for the violin interior and `color` for the outline. Setting `color = "white"` removes the default outline, giving a cleaner look. Use `alpha` to control transparency, useful when violins overlap or you add points on top.

**Try it:** Change `palette = "Set2"` to `palette = "Dark2"`. How does the visual impact change?

```r
# Your code here — switch the palette to Dark2
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_dark <- ggplot(mpg, aes(x = drv, y = hwy, fill = drv)) +
  geom_violin(alpha = 0.8) +
  scale_fill_brewer(palette = "Dark2") +
  scale_x_discrete(labels = c("4" = "4WD", "f" = "Front", "r" = "Rear")) +
  labs(x = "Drive Type", y = "Highway MPG")

ex_dark
```

`Dark2` uses saturated, darker hues (forest green, orange, purple) where `Set2` uses pastel versions of similar colors. The visual impact is more assertive, Dark2 violins read as "foregrounded" and hold attention on a white background, while Set2 is better for embedding violins inside larger dashboards where they shouldn't compete with other elements. Both palettes are colorblind-safe, so it's a tone-of-voice choice rather than an accessibility one.
</details>

## How Do You Embed a Boxplot Inside a Violin Plot?

The classic pattern is violin + mini boxplot. The violin shows shape; the boxplot inside shows median, IQR, and outliers. The trick is sizing the inner boxplot small enough that it doesn't dominate the violin.

```r
# Violin + embedded boxplot
p_combined <- ggplot(mpg, aes(x = drv, y = hwy, fill = drv)) +
  geom_violin(alpha = 0.7, color = "white") +
  geom_boxplot(
    width    = 0.12,      # narrow boxplot sits inside violin
    fill     = "white",
    color    = "grey30",
    outlier.shape = NA    # hide outliers (shown by violin anyway)
  ) +
  scale_fill_brewer(palette = "Set2") +
  scale_x_discrete(labels = c("4" = "4WD", "f" = "Front", "r" = "Rear")) +
  labs(
    title    = "Violin + boxplot: shape and summary together",
    x        = NULL,
    y        = "Highway MPG",
    fill     = "Drive Type"
  ) +
  theme_minimal()

p_combined
```

`width = 0.12` keeps the boxplot narrow enough to read inside the violin. `outlier.shape = NA` suppresses the outlier dots, since the violin already shows the full data distribution, outlier dots add clutter without adding information.

> **TIP:** Add a median point explicitly for extra clarity: `stat_summary(fun = median, geom = "point", size = 2, color = "black")`. This adds a solid dot at the median position, making it easy to compare medians across groups even when the violin widths differ.

**Try it:** Remove `outlier.shape = NA` from the boxplot. Do the outlier points add useful information, or do they clutter the violin?

```r
# Your code here — drop outlier.shape = NA and see the boxplot outliers
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_outliers <- ggplot(mpg, aes(x = drv, y = hwy, fill = drv)) +
  geom_violin(alpha = 0.7, color = "white") +
  geom_boxplot(width = 0.12, fill = "white", color = "grey30") +
  scale_fill_brewer(palette = "Set2") +
  scale_x_discrete(labels = c("4" = "4WD", "f" = "Front", "r" = "Rear")) +
  labs(x = "Drive Type", y = "Highway MPG")

ex_outliers
```

The outlier dots appear as small black circles outside the boxplot whiskers, and you'll notice they clutter the chart because the violin *already* shows those outliers as thin tails of density. The information is duplicated: the narrow violin spike and the boxplot dot both say "one point way up here." That's why `outlier.shape = NA` is the standard pattern for embedded boxplots, the violin is the richer encoding, so let it carry the outlier story.
</details>

## How Do You Add Raw Data Points to a Violin Plot?

For smaller datasets (fewer than ~200 observations per group), showing the individual data points on top of the violin reveals exactly where each observation falls. Use `geom_jitter()` with a small width to prevent overlap:

```r
p_jitter <- ggplot(mpg, aes(x = drv, y = hwy, fill = drv)) +
  geom_violin(alpha = 0.6, color = "white") +
  geom_boxplot(width = 0.1, fill = "white", color = "grey30",
               outlier.shape = NA) +
  geom_jitter(
    width  = 0.08,       # horizontal spread (keep inside violin)
    height = 0,          # no vertical jitter
    size   = 1.5,
    alpha  = 0.5,
    color  = "grey30"
  ) +
  scale_fill_brewer(palette = "Set2") +
  scale_x_discrete(labels = c("4" = "4WD", "f" = "Front", "r" = "Rear")) +
  labs(
    title = "Violin + boxplot + jitter: three layers of information",
    x     = NULL,
    y     = "Highway MPG"
  ) +
  theme_minimal() +
  theme(legend.position = "none")

p_jitter
```

The three layers now communicate:
1. **Violin**, shape and density of the distribution
2. **Boxplot**, median, IQR, and whisker range
3. **Jitter**, every individual data point

> **WARNING:** For large datasets (>500 points per group), jitter becomes a solid mass that obscures the violin shape. Use it only with moderately sized groups. With large data, the violin + boxplot combination alone is sufficient, the density estimate already tells the full distribution story.

**Try it:** Set `width = 0.25` in `geom_jitter()`. Do the points still sit inside the violin, or do they spill outside?

```r
# Your code here — try width = 0.25 and see where the points land
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_wide_jitter <- ggplot(mpg, aes(x = drv, y = hwy, fill = drv)) +
  geom_violin(alpha = 0.6) +
  geom_jitter(width = 0.25, height = 0, size = 1.5, alpha = 0.5) +
  scale_fill_brewer(palette = "Set2") +
  scale_x_discrete(labels = c("4" = "4WD", "f" = "Front", "r" = "Rear")) +
  labs(x = "Drive Type", y = "Highway MPG")

ex_wide_jitter
```

At `width = 0.25` the jitter spans half a category width on each side, so a fair number of points end up *outside* the violin, especially where the violin is narrow (the tails). That breaks the visual contract: readers expect jittered points to represent observations *within* the density shown by the violin, so points floating in empty space look like either errors or outliers even though they're neither. Keep jitter width in the 0.05–0.1 range so the spread stays inside the widest part of the violin.
</details>

## How Do the Bandwidth and Scale Parameters Work?

Two parameters control the violin's shape: `adjust` (bandwidth) and `scale` (how violins are sized relative to each other).

**`adjust`, bandwidth multiplier:**

The bandwidth controls how smooth or detailed the density estimate is. `adjust = 1` uses the default bandwidth (chosen automatically). `adjust < 1` gives a rougher, more detailed estimate that follows local peaks. `adjust > 1` gives a smoother, more generalized estimate.

```r
# Compare three bandwidth levels
p_bw <- ggplot(mpg, aes(x = drv, y = hwy, fill = drv)) +
  geom_violin(adjust = 0.5, alpha = 0.7) +  # rough
  scale_fill_brewer(palette = "Set2") +
  scale_x_discrete(labels = c("4" = "4WD", "f" = "Front", "r" = "Rear")) +
  labs(title = "adjust = 0.5 (rough: shows local detail)", y = "Highway MPG", x = NULL) +
  theme_minimal() + theme(legend.position = "none")

p_bw
```

```r
# Smooth bandwidth for comparison
p_smooth_bw <- ggplot(mpg, aes(x = drv, y = hwy, fill = drv)) +
  geom_violin(adjust = 2, alpha = 0.7) +  # smooth
  scale_fill_brewer(palette = "Set2") +
  scale_x_discrete(labels = c("4" = "4WD", "f" = "Front", "r" = "Rear")) +
  labs(title = "adjust = 2 (smooth: hides local modes)", y = "Highway MPG", x = NULL) +
  theme_minimal() + theme(legend.position = "none")

p_smooth_bw
```

**`scale`, how violin widths compare:**

| `scale =` | Violin width represents |
|---|---|
| `"area"` (default) | Equal total area for all violins |
| `"count"` | Width proportional to number of observations in that group |
| `"width"` | All violins scaled to the same maximum width |

```r
# scale = "count": wider violin = more data points in that group
p_scale <- ggplot(mpg, aes(x = drv, y = hwy, fill = drv)) +
  geom_violin(scale = "count", alpha = 0.8, color = "white") +
  scale_fill_brewer(palette = "Set2") +
  scale_x_discrete(labels = c("4" = "4WD", "f" = "Front", "r" = "Rear")) +
  labs(
    title    = "scale='count': violin width reflects group sample size",
    subtitle = "Wider violin = more observations",
    x        = NULL,
    y        = "Highway MPG"
  ) +
  theme_minimal()

p_scale
```

> **KEY INSIGHT:** `scale = "count"` is often the most honest choice, a group with 10 observations shouldn't look as prominent as a group with 100. With `scale = "area"` (the default), all violins look equally important regardless of sample size.

**Try it:** Change `scale = "count"` to `scale = "width"`. Do the three violins now have the same maximum width?

```r
# Your code here — swap scale = "count" for scale = "width"
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_width_scale <- ggplot(mpg, aes(x = drv, y = hwy, fill = drv)) +
  geom_violin(scale = "width", alpha = 0.8, color = "white") +
  scale_fill_brewer(palette = "Set2") +
  scale_x_discrete(labels = c("4" = "4WD", "f" = "Front", "r" = "Rear")) +
  labs(x = "Drive Type", y = "Highway MPG")

ex_width_scale
```

Yes, with `scale = "width"` every violin hits the same maximum width regardless of how many observations back it. The 25-row rear-wheel group now looks just as prominent as the 106-row front-wheel group, which is a problem if readers interpret "bigger violin = more data." `scale = "width"` is only appropriate when you explicitly *don't* want sample size to be visible (e.g., comparing shape independent of n). Otherwise `scale = "count"` is the honest default.
</details>

## Common Mistakes and How to Fix Them

### Mistake 1: Using a violin plot with too few data points

❌ With fewer than ~20-30 observations per group, the kernel density estimate is unreliable, the violin shows smooth curves that misrepresent sparse data:

```r
# Only 5 points per group - violin shape is misleading
small_df <- data.frame(group = rep(c("A","B"), each=5),
                       value = c(1,2,2,3,10, 5,6,6,7,8))
ggplot(small_df, aes(x = group, y = value)) + geom_violin()
```

✅ Use a dotplot (`geom_dotplot()`) or just jitter (`geom_jitter()`) for small samples. The violin's smooth estimate is only trustworthy with 30+ observations per group.

### Mistake 2: Jitter width spilling outside the violin

❌ `geom_jitter(width = 0.4)` spreads points wider than the violin, making points appear to "float" outside the density region.

✅ Keep jitter width small (0.05-0.1). The points should cluster inside the violin's widest section.

### Mistake 3: Outlier dots shown from both geom_boxplot and geom_jitter

❌ When combining boxplot + jitter inside a violin, the boxplot outlier points double-plot with the jitter points.

✅ Always set `outlier.shape = NA` in `geom_boxplot()` when adding jitter on top.

### Mistake 4: Using the default scale = "area" when group sizes differ greatly

❌ If group A has 10 observations and group B has 200, both violins appear the same size, misrepresenting how much data supports each estimate.

✅ Use `scale = "count"` to make violin width reflect sample size.

### Mistake 5: Using a violin when a ridgeline plot would be better

❌ Comparing 8+ groups side-by-side with violins creates a very wide, crowded chart.

✅ For many groups, use a ridgeline plot (`ggridges::geom_density_ridges()`) which stacks distributions vertically, much more readable with 5+ groups.

## Practice Exercises

### Exercise 1: Violin with diamonds data

Using the `diamonds` dataset, create a violin plot of `price` by `cut`. Add an embedded boxplot (`width = 0.1`). Use `scale = "count"` so the violin widths reflect how many diamonds are in each cut category. Add appropriate labels and a colorblind-safe palette.

```r
# Starter code
# ggplot(diamonds, aes(x = cut, y = price, fill = cut)) +
#   geom_violin(scale = "count", alpha = 0.8, color = "white") +
#   geom_boxplot(width = 0.1, fill = "white", outlier.shape = NA) +
#   scale_fill_brewer(palette = "Set2") +
#   scale_y_continuous(labels = scales::comma) +
#   labs(x = "Cut Quality", y = "Price (USD)", fill = "Cut")
```

### Exercise 2: Three-layer violin for iris

Using the `iris` dataset (150 rows, 3 species with 50 each), create a violin + boxplot + jitter combination for `Sepal.Length` by `Species`. Since the sample is small (50 per group), set `adjust = 1.5` for a smoother bandwidth. Remove the legend since the x-axis already labels the groups.

```r
# Starter code
# ggplot(iris, aes(x = Species, y = Sepal.Length, fill = Species)) +
#   geom_violin(adjust = 1.5, alpha = 0.7, color = "white") +
#   geom_boxplot(width = 0.08, fill = "white", outlier.shape = NA) +
#   geom_jitter(width = 0.06, size = 1.5, alpha = 0.6, color = "grey30") +
#   scale_fill_brewer(palette = "Set2") +
#   theme_minimal() + theme(legend.position = "none")
```

## Complete Example

This example compares the distribution of city MPG across vehicle classes with all three layers, a cleaned theme, and labeled axes:

```r
# Full comparison: all vehicle classes, three-layer violin
p_final <- ggplot(mpg, aes(x = reorder(class, cty, FUN = median),
                             y = cty, fill = class)) +
  geom_violin(scale = "count", alpha = 0.75, color = "white",
              adjust = 1.2) +
  geom_boxplot(width = 0.09, fill = "white", color = "grey30",
               outlier.shape = NA) +
  stat_summary(
    fun  = median,
    geom = "point",
    size = 2.5,
    color = "grey10"
  ) +
  scale_fill_brewer(palette = "Set2") +
  labs(
    title    = "City MPG Distribution by Vehicle Class",
    subtitle = "Violin width = sample size | Dot = median | Box = IQR",
    x        = "Vehicle Class (sorted by median MPG)",
    y        = "City MPG",
    caption  = "Source: ggplot2::mpg"
  ) +
  theme_minimal(base_size = 12) +
  theme(
    legend.position    = "none",
    panel.grid.major.x = element_blank()
  )

p_final
```

`reorder(class, cty, FUN = median)` sorts the x-axis by median city MPG, ensuring the most efficient classes appear on the right and the chart tells a clear story from left (least efficient) to right (most efficient).

## Summary

| Task | Code |
|---|---|
| Basic violin | `geom_violin()` |
| Fill by group | `aes(fill = var)` + `scale_fill_brewer()` |
| Embed boxplot | `+ geom_boxplot(width = 0.12, fill = "white", outlier.shape = NA)` |
| Add raw points | `+ geom_jitter(width = 0.08, height = 0, alpha = 0.5)` |
| Adjust smoothness | `geom_violin(adjust = 1.5)` (smoother) or `adjust = 0.5` (rougher) |
| Scale by sample size | `geom_violin(scale = "count")` |
| Sort x by median | `aes(x = reorder(var, y, FUN = median))` |
| Add median dot | `stat_summary(fun = median, geom = "point")` |

Key rules:
- Use violins only with 30+ observations per group, fewer points make the density estimate unreliable
- Combine violin + boxplot for both shape and summary
- Set `scale = "count"` when group sizes differ meaningfully
- Use `adjust` to control smoothness: lower = more detail, higher = smoother

## FAQ

**When should I use a violin plot instead of a boxplot?**

Use a violin when the distribution shape matters, for example, to detect bimodal distributions (two peaks), skewness, or heavy tails. A boxplot will never reveal that a group has two distinct sub-populations; a violin shows this immediately as two bulges. When you only need the five-number summary for a quick comparison, a boxplot is simpler and cleaner.

**Why does my violin look like a very thin spike?**

You likely have very few observations in one group. With 10 or fewer points, the kernel density estimate produces a very narrow violin that misrepresents the data. Check your group sizes and consider using `geom_jitter()` or `geom_dotplot()` for small samples instead.

**How do I draw a horizontal violin plot?**

Add `coord_flip()` to rotate the chart 90°: `ggplot(...) + geom_violin() + coord_flip()`. Horizontal violins work well when group labels are long.

**What is the difference between adjust and bw in geom_violin()?**

`adjust` is a multiplier on the automatically chosen bandwidth. `bw` sets the bandwidth to an explicit value in the same units as the data. For most use cases, `adjust` is more practical, `adjust = 0.5` always means "twice as rough as the default," regardless of the data's units or scale.

**Can I show half-violins to save space?**

Yes, using the `gghalves` package: `gghalves::geom_half_violin()` draws only one side of the violin, letting you pair it with a half-jitter plot on the other side in a "raincloud" layout. This is more compact and equally informative.

## References

1. Hintze, J. L. & Nelson, R. D. (1998). Violin Plots: A Box Plot-Density Trace Synergism. *The American Statistician*, 52(2), 181–184.
2. ggplot2 reference, `geom_violin()`. https://ggplot2.tidyverse.org/reference/geom_violin.html
3. Wickham, H. (2016). *ggplot2: Elegant Graphics for Data Analysis*. Springer. https://ggplot2-book.org/
4. Wilke, C. O. (2019). *Fundamentals of Data Visualization*, Chapter 9: Visualizing Many Distributions at Once. https://clauswilke.com/dataviz/
5. R Graph Gallery, Violin Charts. https://r-graph-gallery.com/violin.html
6. gghalves package documentation. https://erocoar.github.io/gghalves/

## Continue Learning

- **ggplot2 Distribution Charts**, the full guide to histograms, density plots, boxplots, and violin plots with guidance on when each type works best.
- **Ridgeline Plot in R**, stack distributions vertically with `ggridges::geom_density_ridges()` for clean comparison of 5+ groups.
- **ggplot2 Box Plots**, deep dive into `geom_boxplot()` with notched variants, variable-width boxplots, and grouping strategies.
