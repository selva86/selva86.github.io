---
title: "ggplot2 stat_summary() in R: Plot Means and Error Bars"
slug: "ggplot2-stat_summary-in-R"
description: "Use ggplot2 stat_summary() in R to plot means, medians, errorbars, and bootstrap CIs by group. Covers fun, fun.data, geom, and 6 runnable examples in detail."
keywords: "ggplot2 stat_summary, stat_summary function R, ggplot2 stat_summary examples, stat_summary mean, stat_summary errorbar, stat_summary R, ggplot stat_summary fun"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "ggplot2-functions"
fr_parent: "ggplot2-Tutorial-With-R.html"
auto_link_terms: "stat_summary()|ggplot2 stat_summary|ggplot2::stat_summary()|stat_summary layer|ggplot stat_summary"
auto_link_case_sensitive: true
target_keyword: "ggplot2 stat_summary"
sibling_block_enabled: true
difficulty: "Beginner"
---

# ggplot2 stat_summary() in R: Plot Means and Error Bars

<p class="lead">The <code>stat_summary()</code> function in ggplot2 computes a summary statistic per group on the fly, then draws it as a point, line, errorbar, or other geom. It is the fastest way to overlay group means, medians, standard errors, or confidence intervals on raw data, without a separate dplyr aggregation step.</p>

[QUICK ANSWER]
stat_summary(fun = mean, geom = "point")                        # mean per group
stat_summary(fun.data = mean_se, geom = "errorbar")             # mean +/- SE
stat_summary(fun.data = mean_cl_normal, geom = "pointrange")    # mean + 95% CI
stat_summary(fun.data = mean_cl_boot, geom = "pointrange")      # bootstrap CI
stat_summary(fun.data = median_hilow, geom = "pointrange")      # median + IQR
stat_summary(fun = mean, geom = "line", aes(group = 1))         # connect means
stat_summary(fun = median, fun.min = min, fun.max = max)        # custom range

[DECISION TREE: Is stat_summary() the right tool?]
- plot a mean or median per group: stat_summary(fun = mean, geom = "point")
- show mean with error bars: stat_summary(fun.data = mean_se, geom = "errorbar")
- pre-summarised data (one row per group): geom_point() + geom_errorbar()
- show all raw points + summary: geom_jitter() + stat_summary()
- compare distributions side by side: geom_boxplot() or geom_violin()
- fit and plot a smoothing line: stat_smooth() or geom_smooth()
- count rows per group: stat_count() or geom_bar()

## What stat_summary() does in one sentence

**`stat_summary()` summarises y values at each unique x, then draws the result with a chosen geom.** It accepts raw long-format data, applies a function like `mean` or `median` per x-group, and renders one summary per group using `geom = "point"`, `"line"`, `"errorbar"`, `"pointrange"`, or any compatible geom.

This eliminates the common two-step pattern of `dplyr::summarise()` followed by `geom_point()`. With `stat_summary()`, the aggregation happens inside the plot layer, the raw data stays in the data argument, and you can overlay summaries on top of raw points without merging two data frames.

## Syntax

**`stat_summary()` is a ggplot2 layer that takes either `fun` or `fun.data`, plus a `geom`.** Use `fun` when the summary is a single y value (mean, median). Use `fun.data` when the summary is three values (y, ymin, ymax) for ranges and error bars.

```r title="Load ggplot2 and inspect mtcars"
library(ggplot2)

head(mtcars)[, c("mpg", "cyl", "gear")]
#>                    mpg cyl gear
#> Mazda RX4         21.0   6    4
#> Mazda RX4 Wag     21.0   6    4
#> Datsun 710        22.8   4    4
#> Hornet 4 Drive    21.4   6    3
```

The full signature:

```
stat_summary(mapping = NULL, data = NULL, geom = "pointrange",
             position = "identity", ...,
             fun.data = NULL, fun = NULL,
             fun.max = NULL, fun.min = NULL, fun.args = list(),
             na.rm = FALSE, orientation = NA,
             show.legend = NA, inherit.aes = TRUE)
```

Key arguments:

- `fun`: a function returning one number (e.g. `mean`, `median`).
- `fun.data`: a function returning a data frame with `y`, `ymin`, `ymax` (e.g. `mean_se`, `mean_cl_normal`, `mean_cl_boot`, `median_hilow`).
- `fun.min`, `fun.max`: lower and upper bounds when used with `fun`.
- `fun.args`: list of extra arguments passed to `fun` or `fun.data` (e.g. `list(mult = 2)` for 2x standard error).
- `geom`: the geom that draws the result. Default is `"pointrange"`.

[TIP]
**Use `fun` for one number, `fun.data` for a range.** `fun = mean` with `geom = "point"` plots one point per group. `fun.data = mean_se` with `geom = "errorbar"` plots the same mean plus a vertical bar one standard error above and below. Mix them in two layers to get both.

## Six common patterns

### 1. Mean point per group

```r title="Mean mpg by cyl"
ggplot(mtcars, aes(x = factor(cyl), y = mpg)) +
  stat_summary(fun = mean, geom = "point", size = 4, color = "steelblue")
```

`fun = mean` collapses each cylinder group to one number. `geom = "point"` draws it as a single dot per x value. Wrap `cyl` in `factor()` so the x axis is discrete.

### 2. Mean with standard error bars

```r title="Mean and SE per group"
ggplot(mtcars, aes(x = factor(cyl), y = mpg)) +
  stat_summary(fun.data = mean_se, geom = "errorbar", width = 0.2) +
  stat_summary(fun = mean, geom = "point", size = 3, color = "firebrick")
```

`mean_se` (from Hmisc, re-exported by ggplot2) returns the mean plus and minus one standard error. Two stat_summary layers combine to show the point and the bar; the order draws the bar first and the point on top.

### 3. Mean with 95% confidence interval

```r title="Mean and 95% CI as pointrange"
ggplot(mtcars, aes(x = factor(cyl), y = mpg)) +
  stat_summary(fun.data = mean_cl_normal, geom = "pointrange")
```

`mean_cl_normal` computes the normal-theory 95% CI on the mean. `geom = "pointrange"` renders the mean as a point with a vertical line for the CI in one layer. Pass `fun.args = list(conf.int = 0.99)` for a 99% interval.

### 4. Median with IQR

```r title="Median and IQR per group"
ggplot(mtcars, aes(x = factor(cyl), y = mpg)) +
  stat_summary(fun.data = median_hilow, geom = "pointrange",
               fun.args = list(conf.int = 0.5), color = "darkgreen")
```

`median_hilow` returns the median and quantiles. With `conf.int = 0.5`, ymin and ymax are the 25th and 75th percentiles, giving the interquartile range. Use this for skewed data where median + IQR is more honest than mean + SD.

### 5. Connecting means with a line

```r title="Mean tooth length over dose, by supplement"
ggplot(ToothGrowth, aes(x = dose, y = len, color = supp)) +
  stat_summary(fun = mean, geom = "line", linewidth = 1) +
  stat_summary(fun = mean, geom = "point", size = 3)
```

Two layers, same `fun = mean`, different `geom`. The line traces the group means across dose; the point marks each. Color is mapped to `supp`, so each supplement gets its own line.

### 6. Bootstrap confidence interval

```r title="Bootstrap CI on the mean"
ggplot(mtcars, aes(x = factor(cyl), y = mpg)) +
  stat_summary(fun.data = mean_cl_boot, geom = "pointrange",
               fun.args = list(B = 1000))
```

`mean_cl_boot` resamples B times (default 1000) and reports the empirical 95% CI. Robust to non-normal data. Slower than `mean_cl_normal` but distribution-free.

[KEY INSIGHT]
**`stat_summary()` is the bridge between raw data and aggregated views.** You keep one tidy long-format data frame, and each layer chooses whether to render rows directly (geom_point on raw) or per-group summaries (stat_summary). This avoids creating a separate summary data frame and keeps the plot reproducible from one input.

## stat_summary() vs alternatives

**Use stat_summary() when summaries are simple and the raw data lives in one frame.** Pre-aggregate with dplyr only when summaries are complex or reused across many plots.

| Task | stat_summary() | dplyr + geom_point() |
|---|---|---|
| Mean per group | `stat_summary(fun = mean, geom = "point")` | `summarise(m = mean(y))` then `geom_point()` |
| Mean + SE | `stat_summary(fun.data = mean_se, geom = "errorbar")` | summarise mean and se, then `geom_errorbar()` |
| Custom CI | `fun.args = list(conf.int = 0.99)` | hand-compute upper and lower |
| Raw + summary overlay | one ggplot, raw geom + stat_summary | needs two data frames |
| Reproducibility | aggregation lives in plot code | aggregation lives in pipeline |

When to use which:

- Use `stat_summary()` for exploratory plots and standard summaries.
- Use `dplyr::summarise()` plus `geom_point()` when you need the aggregated table elsewhere (printed, exported, joined).

## Common pitfalls

**Pitfall 1: forgetting to set `geom`.** The default `geom = "pointrange"` requires `fun.data` (three values). Pass only `fun = mean` with the default geom and you get a cryptic warning about missing ymin/ymax. Fix: set `geom = "point"` when using `fun`, or set `fun.data = mean_se` when keeping `pointrange`.

**Pitfall 2: continuous x with too many unique values.** `stat_summary` computes one summary per unique x. With continuous x (hundreds of unique values) you get one mean per single observation, which is just the original points. Fix: bin x first (`cut()` or `factor()`) or use `stat_summary_bin()` for automatic binning.

[WARNING]
**`mean_cl_normal` assumes the sample mean is normally distributed.** That assumption fails for small samples (n < 20) and skewed data. For robust intervals on small samples, prefer `mean_cl_boot` (bootstrap) or report `median_hilow` instead. The shortcut bars are easy to misread as conservative when they are not.

**Pitfall 3: legends from constant aesthetics.** Setting `color = "blue"` inside `aes()` creates a fake legend entry. Always place constant colors and sizes OUTSIDE `aes()`: `stat_summary(fun = mean, geom = "point", color = "blue")`.

## Try it yourself

**Try it:** Build a plot of `iris` showing the mean `Sepal.Length` per `Species` as a point, with 95% bootstrap CIs as vertical lines. Save the plot to `ex_plot`.

```r title="Your turn: stat_summary with bootstrap CI"
# Try it: mean and bootstrap CI per species
ex_plot <- ggplot(iris, aes(x = Species, y = Sepal.Length)) +
  # your code here

print(ex_plot)
#> Expected: 3 points (one per species) with vertical CI bars
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_plot <- ggplot(iris, aes(x = Species, y = Sepal.Length)) +
  stat_summary(fun.data = mean_cl_boot, geom = "pointrange",
               color = "steelblue", size = 0.8)

print(ex_plot)
```

**Explanation:** `fun.data = mean_cl_boot` returns the mean and a bootstrap 95% CI. `geom = "pointrange"` draws both in one layer. Constants `color` and `size` go OUTSIDE `aes()` so they apply uniformly.

</details>

## Related ggplot2 functions

After mastering `stat_summary()`, look at:

- `stat_summary_bin()`: same idea but with automatic binning for continuous x.
- `stat_summary_2d()`, `stat_summary_hex()`: 2D analogues for heatmaps of summarised z.
- `geom_pointrange()`, `geom_errorbar()`, `geom_linerange()`: the bare geoms used by stat_summary's `geom` argument.
- `stat_smooth()`, `geom_smooth()`: fit and draw a smoothing function, a different kind of per-x summary.
- `mean_se`, `mean_cl_normal`, `mean_cl_boot`, `median_hilow`: the helper summary functions, each returning a data frame with y, ymin, ymax.

For pre-aggregated data, `dplyr::summarise()` followed by `geom_point()` and `geom_errorbar()` is the explicit alternative.

## FAQ

**What is the difference between fun and fun.data in stat_summary?**

`fun` takes one column of y values and returns a single number (e.g. `mean`, `median`). It pairs with single-value geoms like `point` or `line`. `fun.data` takes the y values and returns a data frame with `y`, `ymin`, `ymax`. It pairs with range geoms like `pointrange`, `errorbar`, `linerange`. Choose `fun` when you want one summary value, `fun.data` when you want a centre plus a range.

**How do I add error bars to a bar chart in ggplot2?**

Layer `stat_summary(fun = mean, geom = "bar")` for the bars and `stat_summary(fun.data = mean_se, geom = "errorbar", width = 0.2)` for the bars on top. The bars and errorbars share the same per-group means because both layers compute from the same raw data. For pre-aggregated data, replace stat_summary with `geom_col()` and `geom_errorbar()`.

**Can stat_summary work with a continuous x axis?**

It can, but you usually want `stat_summary_bin()`. Plain `stat_summary` computes one summary per unique x value. With continuous x, almost every value is unique, so the result is just the raw points. `stat_summary_bin` first bins x into intervals, then summarises within each bin, which is what you typically want.

**How do I pass extra arguments to the summary function?**

Use the `fun.args` argument, a list. Example: `stat_summary(fun.data = mean_cl_normal, fun.args = list(conf.int = 0.99))` switches from a 95% to a 99% interval. For `mean_cl_boot`, use `fun.args = list(B = 5000)` to increase bootstrap iterations. Anything `fun` or `fun.data` accepts can go inside this list.

**Why does my stat_summary plot show a warning about missing ymin?**

You used the default `geom = "pointrange"` with only `fun`. The default geom needs `y`, `ymin`, `ymax`. Either switch to `geom = "point"` (needs only `y`) or supply `fun.data = mean_se` (which produces all three). The error is silently a warning, but the plot will skip the range and look incomplete.
