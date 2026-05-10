---
title: "ggplot2 geom_histogram() in R: Histograms With Examples"
slug: "ggplot2-geom_histogram-in-R"
description: "Use ggplot2 geom_histogram() to build histograms in R. Covers binwidth, bins count, fill by group, density overlay, and 6 worked examples with diamonds."
keywords: "geom_histogram, ggplot2 histogram, histogram in R, R histogram examples, ggplot2 binwidth, bin count, density overlay"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "ggplot2-functions"
fr_parent: "ggplot2-Tutorial-With-R.html"
auto_link_terms: "geom_histogram()|ggplot2 geom_histogram|ggplot2 histogram|histogram in ggplot2|histogram bins"
auto_link_case_sensitive: true
target_keyword: "geom_histogram"
sibling_block_enabled: true
difficulty: "Beginner"
---

# ggplot2 geom_histogram() in R: Histograms With Examples

<p class="lead">The <code>geom_histogram()</code> function in ggplot2 bins a continuous variable into intervals and draws bars showing the count per bin. Use <code>binwidth</code> or <code>bins</code> to control bin size; <code>fill</code> to color by group.</p>

[QUICK ANSWER]
ggplot(df, aes(x)) + geom_histogram()                          # default 30 bins
ggplot(df, aes(x)) + geom_histogram(binwidth = 0.5)            # fixed bin width
ggplot(df, aes(x)) + geom_histogram(bins = 50)                 # 50 bins total
ggplot(df, aes(x, fill = group)) + geom_histogram(position = "identity", alpha = 0.5)
ggplot(df, aes(x)) + geom_histogram(aes(y = ..density..))      # density scale
ggplot(df, aes(x)) + geom_histogram() + facet_wrap(~ group)    # one panel per group
ggplot(df, aes(x)) + geom_histogram() + geom_density()         # histogram + curve

[DECISION TREE: Is geom_histogram() the right tool?]
- distribution of one continuous: geom_histogram()
- compare distributions across groups: aes(fill = grp) + geom_histogram(alpha)
- smooth shape (no bins): geom_density()
- distribution by group, separate panels: + facet_wrap(~ grp)
- discrete (counted) data: geom_bar() instead
- cumulative distribution: stat_ecdf()
- two continuous: geom_hex() or geom_density_2d()

## What geom_histogram() does in one sentence

**`geom_histogram()` divides the x range into bins and draws a bar of height equal to the number of observations in each bin.** Default is 30 bins. Specify `binwidth` to fix bin width in data units, or `bins` to fix the count.

Histograms are the default tool for understanding the SHAPE of a continuous distribution: skew, multimodality, outliers, range. Use them in EDA before any modeling.

## Syntax

**`geom_histogram()` requires only `aes(x)`. The y axis is computed (count by default).**

```r title="Load ggplot2 and inspect diamonds"
library(ggplot2)

range(diamonds$carat)
#> [1] 0.2 5.01

nrow(diamonds)
#> [1] 53940
```

The full signature:

```
geom_histogram(mapping = NULL, data = NULL, stat = "bin", position = "stack",
               ..., binwidth = NULL, bins = NULL, na.rm = FALSE,
               orientation = NA, show.legend = NA, inherit.aes = TRUE)
```

[TIP]
**Always specify `binwidth` or `bins` explicitly. The default (30 bins) is rarely right.** ggplot2 issues a console message when you do not set one, hinting at this. Pick `binwidth` based on the data's units (e.g., 0.5 for carat, 1 for ages, 100 for prices).

## Six common patterns

### 1. Default histogram

```r title="Default 30 bins"
ggplot(diamonds, aes(x = carat)) +
  geom_histogram()
#> `stat_bin()` using `bins = 30`. Pick better value with `binwidth`.
```

The console message reminds you the default 30 bins may not suit your data. The plot still renders.

### 2. Fixed binwidth

```r title="binwidth = 0.1 carat"
ggplot(diamonds, aes(x = carat)) +
  geom_histogram(binwidth = 0.1, fill = "steelblue", color = "white")
```

`binwidth = 0.1` means each bin is 0.1 carats wide. White outlines (`color = "white"`) separate bars visually.

### 3. Fill by group with overlap

```r title="Compare two cuts"
ggplot(diamonds[diamonds$cut %in% c("Ideal", "Fair"), ],
       aes(x = carat, fill = cut)) +
  geom_histogram(binwidth = 0.1, position = "identity", alpha = 0.5)
```

`fill = cut` colors bars by cut. `position = "identity"` overlays bars at the same x; `alpha = 0.5` makes them semi-transparent so both are visible.

### 4. Density scale (y = ..density..)

```r title="Use density instead of count"
ggplot(diamonds, aes(x = carat, y = ..density..)) +
  geom_histogram(binwidth = 0.1, fill = "steelblue") +
  labs(y = "density")
```

`y = ..density..` rescales the y axis so the total area sums to 1. Useful when comparing groups of different sizes (count would mislead).

### 5. Histogram + density curve

```r title="Histogram with density overlay"
ggplot(diamonds, aes(x = carat)) +
  geom_histogram(aes(y = ..density..), binwidth = 0.1,
                 fill = "lightgray", color = "white") +
  geom_density(color = "firebrick", linewidth = 1)
```

The histogram shows binned counts; the density line shows a smooth estimate. Both on the same y scale (density) for fair comparison.

### 6. Faceted by group

```r title="One histogram per cut"
ggplot(diamonds, aes(x = carat)) +
  geom_histogram(binwidth = 0.1, fill = "steelblue") +
  facet_wrap(~ cut, ncol = 2) +
  theme_minimal()
```

`facet_wrap()` creates one panel per cut value. Each panel has its own counts, making it easy to compare distribution shapes across groups.

[KEY INSIGHT]
**`binwidth` controls the appearance of the histogram more than any other choice.** Too few bins (binwidth too large) hides structure. Too many bins (binwidth too small) shows noise as if it were signal. Try a few values and pick the one that reveals the distribution clearly without being jagged.

## geom_histogram() vs base R hist()

**Base R `hist()` is one-shot; ggplot2's `geom_histogram()` integrates with the rest of the layered grammar.**

| Task | ggplot2 | Base R |
|---|---|---|
| Default histogram | `geom_histogram()` | `hist(x)` |
| Specific binwidth | `binwidth = 0.5` | `breaks = seq(0, 5, 0.5)` |
| N bins | `bins = 50` | `breaks = 50` |
| Density y scale | `aes(y = ..density..)` | `freq = FALSE` |
| Compare groups | `aes(fill = grp)` | `hist()` per group, manually |
| Add density curve | `+ geom_density()` | `lines(density(x))` |

When to use which:

- Use ggplot2 for any multi-group, faceted, or compound histogram.
- Use base `hist()` for one-line interactive checks.

## Common pitfalls

**Pitfall 1: not setting binwidth.** Default 30 bins rarely matches your data. Always specify either `binwidth` (fixed width per bin) or `bins` (target count of bins).

**Pitfall 2: stacked bars when overlay was intended.** Default `position = "stack"` stacks bars from different fill groups vertically. To OVERLAY them, set `position = "identity"` and use `alpha = 0.5`.

[WARNING]
**Bar STACKING in geom_histogram with fill misleads readers.** If your goal is comparing distribution shapes across groups, stacking is wrong (the second group's shape gets distorted by the first). Use `position = "identity"` with alpha, or `facet_wrap()`, or `geom_density()` colored by group.

**Pitfall 3: y axis is count by default; comparing groups of different sizes is misleading.** A group with 100 obs and one with 10,000 obs both show their counts, making the smaller group look flat. Use `aes(y = ..density..)` for fair comparison.

## Try it yourself

**Try it:** Plot the distribution of `mpg$hwy` (highway miles per gallon). Use a binwidth of 2, fill the bars steelblue, and add a vertical line at the mean. Save to `ex_plot`.

```r title="Your turn: histogram with mean line"
# Try it: histogram + mean line
ex_plot <- ggplot(mpg, aes(x = hwy)) +
  # your code here

print(ex_plot)
#> Expected: histogram with one vertical red line at mean(hwy)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_plot <- ggplot(mpg, aes(x = hwy)) +
  geom_histogram(binwidth = 2, fill = "steelblue", color = "white") +
  geom_vline(xintercept = mean(mpg$hwy), color = "firebrick",
             linetype = "dashed", linewidth = 1) +
  labs(x = "Highway MPG", y = "Count")

print(ex_plot)
```

**Explanation:** `geom_histogram(binwidth = 2)` bins highway mpg into 2-unit intervals. `geom_vline(xintercept = mean(...))` adds a vertical reference line at the mean. Dashed red makes it visually distinct from the bars.

</details>

## Related ggplot2 functions

After mastering `geom_histogram()`, look at:

- `geom_density()`: smooth kernel density estimate (no bins)
- `geom_freqpoly()`: line version of histogram (less visually heavy when comparing groups)
- `geom_dotplot()`: each observation as a stacked dot
- `stat_bin()`: the underlying stat geom_histogram uses
- `stat_ecdf()`: empirical cumulative distribution function plot
- `geom_violin()`: density mirrored around a center for grouped comparisons

For two-dimensional histograms, see `geom_hex()` and `geom_bin2d()`.

## FAQ

**How do I change the number of bins in ggplot2 histogram?**

Use `bins = N` for a target count or `binwidth = W` for a fixed bin width: `geom_histogram(bins = 50)` or `geom_histogram(binwidth = 0.1)`. Set ONE; setting both produces a warning.

**How do I add a density curve to a ggplot2 histogram?**

Set y to density first, then add `geom_density()`: `geom_histogram(aes(y = ..density..)) + geom_density()`. Without rescaling y to density, the curve and histogram are on different scales.

**How do I overlay two histograms in ggplot2?**

Set `position = "identity"` and use transparency: `geom_histogram(aes(fill = group), position = "identity", alpha = 0.5)`. Default position is "stack" which adds bars on top of each other (rarely what you want).

**What is the difference between geom_histogram and geom_bar?**

`geom_histogram()` works on a CONTINUOUS x variable, binning it into intervals. `geom_bar()` works on a CATEGORICAL x, counting rows per category. Use histogram for numeric distributions, bar for category counts.

**How do I plot histogram with percentages?**

Compute density and multiply: `geom_histogram(aes(y = ..density.. * binwidth_value * 100))`. Or use `..count.. / sum(..count..) * 100`. Format y axis with `scale_y_continuous(labels = scales::percent_format(scale = 1))`.
