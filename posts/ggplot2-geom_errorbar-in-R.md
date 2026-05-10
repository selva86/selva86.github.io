---
title: "ggplot2 geom_errorbar() in R: Add Error Bars to Plots"
slug: "ggplot2-geom_errorbar-in-R"
description: "Use ggplot2 geom_errorbar() to add vertical error bars to bar or point plots in R. Covers ymin, ymax, width, vs geom_pointrange, and 5 examples."
keywords: "ggplot2 geom_errorbar, R error bars plot, geom_errorbar width, geom_errorbar vs geom_ribbon, error bars on bars"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "ggplot2-functions"
fr_parent: "ggplot2-Tutorial-With-R.html"
auto_link_terms: "geom_errorbar()|ggplot2 geom_errorbar|error bars plot|geom_errorbar width|error bars on bars"
auto_link_case_sensitive: true
target_keyword: "ggplot2 geom_errorbar"
sibling_block_enabled: true
difficulty: "Beginner"
---

# ggplot2 geom_errorbar() in R: Add Error Bars to Plots

<p class="lead">The <code>geom_errorbar()</code> function in ggplot2 draws vertical error bars from <code>ymin</code> to <code>ymax</code> at each x position. It is the standard tool for showing uncertainty on bar charts, point plots, and line plots.</p>

[QUICK ANSWER]
ggplot(df, aes(x, y, ymin = lo, ymax = hi)) + geom_errorbar()
geom_errorbar(width = 0.2)               # narrower bars
ggplot(df, aes(x, y)) + geom_col() + geom_errorbar(aes(ymin = y - sd, ymax = y + sd))
geom_pointrange(aes(ymin, ymax))         # alternative: point + range
geom_ribbon(aes(ymin, ymax))             # for continuous bands

[DECISION TREE: Is geom_errorbar() the right tool?]
- error bars on bar / point plot: geom_errorbar()
- point with range: geom_pointrange()
- continuous band over x: geom_ribbon()
- horizontal error bars: geom_errorbarh() or aes(y, x)
- mean +/- SD per group: stat_summary()

## What geom_errorbar() does in one sentence

**`geom_errorbar()` draws vertical bars from ymin to ymax at each x, with horizontal whiskers at the top and bottom.** Used for confidence intervals, standard errors, or any uncertainty interval per point.

## Syntax

**`geom_errorbar(mapping = NULL, data = NULL, width = 0.5, ...)`. Requires aes(x, ymin, ymax).**

```r title="Error bars on bar chart"
library(ggplot2)
library(dplyr)

mtcars |>
  group_by(cyl) |>
  summarise(mean_mpg = mean(mpg), sd_mpg = sd(mpg)) |>
  ggplot(aes(factor(cyl), mean_mpg)) +
  geom_col(fill = "steelblue") +
  geom_errorbar(aes(ymin = mean_mpg - sd_mpg, ymax = mean_mpg + sd_mpg),
                width = 0.2)
```

[TIP]
**Default width is 0.5 (full category width); narrow with `width = 0.2` for cleaner look.** For continuous x, set `width` to a small value like 0.1.

## Five common patterns

### 1. On bar chart

```r title="Mean +/- SD"
df |>
  ggplot(aes(group, mean)) +
  geom_col() +
  geom_errorbar(aes(ymin = mean - sd, ymax = mean + sd), width = 0.2)
```

### 2. On point plot

```r title="Cleaner alternative to bars"
df |>
  ggplot(aes(group, mean)) +
  geom_point(size = 3) +
  geom_errorbar(aes(ymin = mean - sd, ymax = mean + sd), width = 0.2)
```

### 3. Stat_summary auto-error

```r title="Compute error from raw data"
mtcars |>
  ggplot(aes(factor(cyl), mpg)) +
  stat_summary(fun = mean, geom = "point") +
  stat_summary(fun.data = mean_sdl, geom = "errorbar", width = 0.2)
```

### 4. Color and dodge

```r title="Side-by-side error bars"
df |>
  ggplot(aes(group, mean, color = subgroup)) +
  geom_point(position = position_dodge(0.5)) +
  geom_errorbar(aes(ymin = lo, ymax = hi), 
                position = position_dodge(0.5), width = 0.2)
```

### 5. Confidence intervals

```r title="95% CI from a model"
predictions |>
  ggplot(aes(x, fit)) +
  geom_point() +
  geom_errorbar(aes(ymin = lwr, ymax = upr), width = 0.1)
```

[KEY INSIGHT]
**`geom_errorbar` requires `ymin` and `ymax` aesthetics.** Default `width` is too wide for most plots; set 0.2 or smaller for cleaner appearance.

## geom_errorbar() vs geom_pointrange() vs geom_ribbon()

| Function | Visual | Best for |
|---|---|---|
| `geom_errorbar()` | Bar with whiskers | Discrete x with error |
| `geom_pointrange()` | Point + range bar | Cleaner combination |
| `geom_ribbon()` | Continuous band | Time-series uncertainty |
| `geom_linerange()` | Line only (no point) | Sparse error display |

## A practical workflow

**Use stat_summary for "compute mean and error from raw data" in one step.**

```r
ggplot(mtcars, aes(factor(cyl), mpg)) +
  geom_jitter(width = 0.1, alpha = 0.5) +
  stat_summary(fun = mean, geom = "point", size = 3, color = "red") +
  stat_summary(fun.data = mean_se, geom = "errorbar", width = 0.2, color = "red")
```

Raw points + mean + standard error in one plot.

## Common pitfalls

**Pitfall 1: forgetting width.** Default 0.5 looks ugly on most plots. Set `width = 0.2`.

**Pitfall 2: wrong error type.** SD is per-observation spread. SE is mean's uncertainty. CI is interval. Pick what your data shows.

[WARNING]
**`geom_errorbar` is for VERTICAL bars only; use `geom_errorbarh()` for HORIZONTAL.** They have different aesthetics (xmin/xmax for h).

## Try it yourself

**Try it:** Make a bar chart of mean mpg per cyl with error bars showing +/- standard error. Save to `ex_plot`.

```r title="Your turn: bar + error"
ex_plot <- mtcars |>
  group_by(cyl) |>
  summarise(mean_mpg = mean(mpg), se = sd(mpg) / sqrt(n())) |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_plot <- mtcars |>
  group_by(cyl) |>
  summarise(mean_mpg = mean(mpg), se = sd(mpg) / sqrt(n())) |>
  ggplot(aes(factor(cyl), mean_mpg)) +
  geom_col(fill = "steelblue") +
  geom_errorbar(aes(ymin = mean_mpg - se, ymax = mean_mpg + se), width = 0.2)
```

**Explanation:** Compute mean and SE per cyl; plot as bar with error bars.

</details>

## Related ggplot2 functions

After mastering geom_errorbar, look at:

- `geom_pointrange()`: point + range
- `geom_linerange()`: line only
- `geom_ribbon()`: continuous bands
- `geom_errorbarh()`: horizontal bars
- `stat_summary()`: compute error from raw data
- `mean_sdl()`, `mean_se()`, `mean_cl_normal()`: stat helpers

## FAQ

**What does geom_errorbar do in ggplot2?**

`geom_errorbar()` draws vertical bars from ymin to ymax at each x position with horizontal whiskers at the ends.

**How do I make error bars narrower?**

Set `width`: `geom_errorbar(width = 0.2)`. Default is 0.5 (often too wide).

**What is the difference between geom_errorbar and geom_pointrange?**

errorbar has horizontal whiskers; pointrange combines a central point with a range bar (no whiskers).

**How do I make horizontal error bars?**

Use `geom_errorbarh()` with `xmin` and `xmax`. Or swap the aesthetic mapping: `aes(y, x, ...)`.

**Should I show SD, SE, or CI as error bars?**

SD shows individual variation. SE shows mean uncertainty. CI is interval estimate. Pick by what you want the reader to interpret.
