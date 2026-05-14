---
title: "ggplot2 stat_ecdf() in R: Plot Empirical CDFs"
slug: "ggplot2-stat_ecdf-in-R"
description: "Use ggplot2 stat_ecdf() to plot empirical CDFs in R. Covers syntax, group comparison, pad and n arguments, quantile reading, theoretical overlay, and pitfalls."
keywords: "stat_ecdf, ggplot2 stat_ecdf, empirical CDF R, ecdf plot ggplot2, cumulative distribution plot R, ggplot2 cumulative, stat_ecdf examples"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "ggplot2-functions"
fr_parent: "ggplot2-Tutorial-With-R.html"
auto_link_terms: "stat_ecdf()|ggplot2 stat_ecdf|ggplot2::stat_ecdf()|empirical CDF plot|empirical cumulative distribution"
auto_link_case_sensitive: true
target_keyword: "stat_ecdf"
sibling_block_enabled: true
difficulty: "Beginner"
---

# ggplot2 stat_ecdf() in R: Plot Empirical CDFs

<p class="lead">The <code>stat_ecdf()</code> function in ggplot2 plots an empirical cumulative distribution function (ECDF), the share of observations at or below each value. It is the bandwidth-free way to compare distributions and to read percentiles directly off the y axis.</p>

[QUICK ANSWER]
ggplot(df, aes(x)) + stat_ecdf()                                # basic step ECDF
ggplot(df, aes(x, color = group)) + stat_ecdf()                 # one curve per group
ggplot(df, aes(x)) + stat_ecdf(geom = "point")                  # dots instead of steps
ggplot(df, aes(x)) + stat_ecdf(pad = FALSE)                     # no 0/1 flat tails
ggplot(df, aes(x)) + stat_ecdf(n = 200)                         # interpolate to 200 pts
ggplot(df, aes(x)) + stat_ecdf() + geom_hline(yintercept = 0.5) # mark the median
ggplot(df, aes(x, color = group)) + stat_ecdf(linewidth = 1.2)  # thicker lines

[DECISION TREE: Is stat_ecdf() the right tool?]
- cumulative share at or below x: stat_ecdf()
- smooth distribution shape: geom_density()
- discrete bin counts: geom_histogram()
- check fit to a theoretical distribution: stat_qq() and stat_qq_line()
- overlay a theoretical CDF curve: stat_function(fun = pnorm)
- numerical CDF comparison test: ks.test()
- box summary across groups: geom_boxplot()

## What stat_ecdf() does in one sentence

**`stat_ecdf()` draws a step function from 0 to 1 showing the fraction of data points less than or equal to each x value.** At every observation the curve jumps by 1/N (or by the count at ties). The y axis reads as a probability, so a horizontal line at 0.5 crosses the median.

Compared to a histogram or density curve, an ECDF makes no bin choice and no bandwidth choice. It plots every observation exactly. That makes it the safest distribution chart for small samples and the most precise way to compare two distributions visually.

## Syntax

**`stat_ecdf()` only needs `aes(x)`. The y axis is computed by the stat itself.**

```r title="Load ggplot2 and inspect mpg"
library(ggplot2)

range(mpg$hwy)
#> [1] 12 44
length(unique(mpg$hwy))
#> [1] 27
```

The full signature:

```
stat_ecdf(mapping = NULL, data = NULL, geom = "step", position = "identity",
          ..., n = NULL, pad = TRUE, na.rm = FALSE, show.legend = NA,
          inherit.aes = TRUE)
```

Key arguments:

- `n`: number of points to interpolate. Default `NULL` plots one step per unique value, which is the exact ECDF. Set to a number for a smoother line.
- `pad`: whether to extend the curve flat at 0 on the left and 1 on the right. `TRUE` by default. Set `FALSE` to start and end exactly at the data range.
- `geom`: defaults to `"step"`. Use `"point"` for a scatter version that emphasizes each observation.

[TIP]
**Use `stat_ecdf()` instead of `geom_density()` when N is small (under 50).** Density curves need a bandwidth, which is unstable with few points. ECDFs plot every observation exactly and have no tuning knob, so the chart cannot mislead with smoothing artifacts.

## Six common patterns

### 1. Basic ECDF curve

```r title="Highway mpg ECDF"
ggplot(mpg, aes(x = hwy)) +
  stat_ecdf(geom = "step", color = "steelblue", linewidth = 1)
```

Each step jump corresponds to an observation. Where the curve climbs steeply, data is dense. Where it is flat, no observations fall in that range.

### 2. Compare ECDFs across groups

```r title="ECDF per drivetrain"
ggplot(mpg, aes(x = hwy, color = drv)) +
  stat_ecdf(linewidth = 1)
```

Three groups produce three curves on one panel. A curve lying entirely to the right of another means that group has stochastically larger values (every quantile is higher).

### 3. Read the median and quartiles directly

```r title="Annotate quartile reference lines"
ggplot(mpg, aes(x = hwy)) +
  stat_ecdf(color = "steelblue", linewidth = 1) +
  geom_hline(yintercept = c(0.25, 0.5, 0.75),
             linetype = "dashed", color = "grey60") +
  labs(x = "Highway MPG", y = "Cumulative fraction")
```

Horizontal reference lines at 0.25, 0.5, 0.75 turn the chart into a percentile reader. Where they cross the curve gives Q1, median, and Q3.

### 4. Points instead of steps

```r title="ECDF as points"
ggplot(mpg, aes(x = hwy)) +
  stat_ecdf(geom = "point", size = 1.5, alpha = 0.6)
```

`geom = "point"` plots one dot per observation at its cumulative position. Useful for showing every data point explicitly, especially for small samples.

### 5. Disable padding for a tight range

```r title="No flat 0/1 tails"
ggplot(mpg, aes(x = hwy, color = drv)) +
  stat_ecdf(linewidth = 1, pad = FALSE)
```

`pad = FALSE` removes the horizontal extensions at 0 and 1, so each curve starts at its minimum and ends at its maximum. Use this when groups have very different ranges and you want to compare the data envelopes.

### 6. Overlay a theoretical normal CDF

```r title="Compare ECDF to theoretical normal"
set.seed(42)
sim <- data.frame(x = rnorm(200, mean = 24, sd = 6))

ggplot(sim, aes(x = x)) +
  stat_ecdf(geom = "step", color = "steelblue", linewidth = 1) +
  stat_function(fun = pnorm, args = list(mean = 24, sd = 6),
                color = "firebrick", linewidth = 1, linetype = "dashed") +
  labs(x = "x", y = "Cumulative probability")
```

`stat_function(fun = pnorm)` draws the theoretical normal CDF in red. Gaps between the two curves show where the empirical distribution deviates from normal. This is the visual companion to `ks.test()`.

[KEY INSIGHT]
**The y axis is a probability and the x axis is the data scale, so the chart reads in two directions.** Pick a probability on the y axis to find the corresponding quantile on x; pick a value on x to find the share of observations at or below it. No other distribution chart in ggplot2 supports this two-way reading without extra computation.

## stat_ecdf() vs geom_density() vs geom_histogram()

**Three distribution views; the choice depends on goal, sample size, and audience.**

| Feature | stat_ecdf | geom_density | geom_histogram |
|---|---|---|---|
| Tuning parameter | None | Bandwidth (`adjust`) | Bin width |
| Reads percentiles | Direct (y axis) | Indirect | Indirect |
| Compares 2+ groups | Excellent | Good | Crowded |
| Small N (< 50) | Best | Risky | Risky |
| Reveals peaks/modes | No | Yes | Yes |
| Skim readability | Lower (steps) | Higher | Higher |

When to use which:

- Use `stat_ecdf()` when comparing distributions precisely or when N is small.
- Use `geom_density()` for shape comparison with smooth visuals across 2 to 5 groups.
- Use `geom_histogram()` when bin counts are part of the story.

## Common pitfalls

**Pitfall 1: forgetting that ECDFs hide modes.** A bimodal distribution and a unimodal one with the same spread produce similar ECDF curves. If the audience needs to see "two peaks", pair `stat_ecdf()` with `geom_density()` in a facet or use density alone.

**Pitfall 2: thinking the steps are jagged because of noise.** Each step jump is exactly 1/N (or k/N at a tie of size k). The visible roughness is the data, not an artifact. Smoothing it away with `n = 1000` is purely cosmetic; the information content is identical.

[WARNING]
**`pad = TRUE` extends the curve as a flat line before the minimum and after the maximum, which can make groups look more similar than they are.** When groups have very different ranges, those flat tails overlap at 0 and 1, hiding the difference. Set `pad = FALSE` to crop each curve to its own data range.

**Pitfall 3: using `stat_ecdf()` for discrete data with many ties.** ECDFs handle ties correctly (the step jumps by k/N), but with very few unique values the chart degenerates into a 3 or 4 step staircase that conveys little. Use `geom_bar()` for the underlying counts instead.

## Try it yourself

**Try it:** Plot the ECDF of `iris$Sepal.Length` separately for each `Species`. Add a horizontal dashed line at 0.5 to mark the median crossing. Save the result to `ex_plot`.

```r title="Your turn: ECDF by species"
# Try it: ECDF per species with median guide line
ex_plot <- ggplot(iris, aes(x = Sepal.Length, color = Species)) +
  # your code here

print(ex_plot)
#> Expected: 3 ECDF step curves, dashed line at y = 0.5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_plot <- ggplot(iris, aes(x = Sepal.Length, color = Species)) +
  stat_ecdf(linewidth = 1) +
  geom_hline(yintercept = 0.5, linetype = "dashed", color = "grey60") +
  labs(x = "Sepal Length", y = "Cumulative fraction")

print(ex_plot)
```

**Explanation:** `stat_ecdf()` builds one step curve per Species because of the `color = Species` mapping. The `geom_hline()` at y = 0.5 crosses each curve at that group's median sepal length, so the chart reads as three medians on a single axis.

</details>

## Related ggplot2 functions

After mastering `stat_ecdf()`, look at:

- `geom_density()`: smooth kernel density for comparing distribution shapes
- `geom_histogram()`: binned counts for distribution with discrete bins
- `geom_boxplot()`: five-number summary for compact group comparison
- `stat_qq()` and `stat_qq_line()`: quantile-quantile plot against a theoretical distribution
- `stat_function()`: overlay a theoretical CDF, PDF, or any analytic curve
- `geom_step()`: general step geometry for non-distribution step functions

For a numerical test of two ECDFs, run `ks.test()` on the underlying vectors. For grouped percentile tables, pair `stat_ecdf()` with `quantile()` summaries.

Official reference: [ggplot2 stat_ecdf documentation](https://ggplot2.tidyverse.org/reference/stat_ecdf.html).

## FAQ

**How do I plot an ECDF in ggplot2?**

Map the variable to `x` and add `stat_ecdf()`: `ggplot(df, aes(x = value)) + stat_ecdf()`. The y axis is computed automatically and ranges from 0 to 1. Add `color = group` inside `aes()` to draw one curve per group on the same panel.

**What is the difference between stat_ecdf() and ecdf() in base R?**

`ecdf()` in base R returns a step function object you can plot with `plot()`. `stat_ecdf()` in ggplot2 is the grammar-of-graphics version, producing a ggplot layer you can map, facet, color, and combine with other geoms. They compute the same function; ggplot2 just makes it composable.

**How do I read percentiles off an ECDF plot?**

Find the y value of interest (0.5 for median, 0.25 for Q1, 0.9 for 90th percentile), draw a horizontal line at that y, and read where it crosses the curve. The x coordinate of the crossing is the percentile. Adding `geom_hline(yintercept = 0.5)` makes this visual.

**Can stat_ecdf() compare more than two groups at once?**

Yes. Map a categorical variable to `color` or `fill` inside `aes()` and `stat_ecdf()` produces one curve per group. Three to six groups read clearly; with more, switch to faceting (`facet_wrap`) or use a numerical test like `ks.test()` pairwise.

**Does stat_ecdf() handle missing values?**

Yes, but only if you set `na.rm = TRUE` explicitly. Otherwise NAs trigger a warning and the curve may behave unexpectedly at edges. Always pass `na.rm = TRUE` when the data may contain NAs.
