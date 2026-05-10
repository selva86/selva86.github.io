---
title: "ggplot2 geom_pointrange() in R: Point With Range Bar"
slug: "ggplot2-geom_pointrange-in-R"
description: "Use ggplot2 geom_pointrange() to draw a central point with a vertical range bar in R. Covers ymin, ymax, vs geom_errorbar, and 5 worked examples."
keywords: "ggplot2 geom_pointrange, R point range, geom_pointrange vs geom_errorbar, point with range bar, ggplot CI"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "ggplot2-functions"
fr_parent: "ggplot2-Tutorial-With-R.html"
auto_link_terms: "geom_pointrange()|ggplot2 geom_pointrange|point with range|geom_pointrange vs geom_errorbar"
auto_link_case_sensitive: true
target_keyword: "ggplot2 geom_pointrange"
sibling_block_enabled: true
difficulty: "Beginner"
---

# ggplot2 geom_pointrange() in R: Point With Range Bar

<p class="lead">The <code>geom_pointrange()</code> function in ggplot2 draws a central POINT with a vertical RANGE bar from <code>ymin</code> to <code>ymax</code>. It is a cleaner-looking alternative to <code>geom_errorbar()</code> for showing point estimates with uncertainty.</p>

[QUICK ANSWER]
ggplot(df, aes(x, y, ymin = lo, ymax = hi)) + geom_pointrange()
geom_pointrange(size = 1)               # larger point + thicker bar
geom_pointrange(fatten = 2)              # control point size relative to bar
geom_errorbar()                          # bar with whiskers (different style)

[DECISION TREE: Is geom_pointrange() the right tool?]
- point + range (clean look): geom_pointrange()
- bar with whiskers: geom_errorbar()
- multiple groups (forest plot): geom_pointrange + facets
- continuous band: geom_ribbon()
- line only: geom_linerange()

## What geom_pointrange() does in one sentence

**`geom_pointrange()` draws a point at (x, y) with a vertical line from `ymin` to `ymax` showing the range.** It combines `geom_point()` and `geom_linerange()` into one geom.

## Syntax

**`geom_pointrange(mapping = NULL, data = NULL, fatten = 4, size = 0.5, ...)`. Requires aes(x, y, ymin, ymax).**

```r title="Forest-plot-style summary"
library(ggplot2)
library(dplyr)

mtcars |>
  group_by(cyl) |>
  summarise(mean_mpg = mean(mpg),
            lo = mean_mpg - sd(mpg),
            hi = mean_mpg + sd(mpg)) |>
  ggplot(aes(factor(cyl), mean_mpg, ymin = lo, ymax = hi)) +
  geom_pointrange()
```

[TIP]
**Use geom_pointrange for "forest plots" (one row per group with point estimate + CI).** It is the cleanest visual for that use case.

## Five common patterns

### 1. Per-group summary

```r title="Mean +/- SD per cyl"
df |>
  group_by(cyl) |>
  summarise(m = mean(mpg), sd = sd(mpg)) |>
  ggplot(aes(factor(cyl), m, ymin = m - sd, ymax = m + sd)) +
  geom_pointrange()
```

### 2. Forest plot

```r title="Coefficients with CI"
coefs |>
  ggplot(aes(estimate, term, xmin = lwr, xmax = upr)) +
  geom_pointrangeh()  # use ggstance for horizontal
```

For horizontal pointrange, use `ggstance::geom_pointrangeh`.

### 3. With color and dodge

```r title="Multiple subgroups"
df |>
  ggplot(aes(group, mean, ymin = lo, ymax = hi, color = subgroup)) +
  geom_pointrange(position = position_dodge(0.5))
```

### 4. Custom point size

```r title="Bigger point"
geom_pointrange(fatten = 8)
#> Point is 8x the line width
```

### 5. Stat_summary alternative

```r title="Auto-compute"
ggplot(mtcars, aes(factor(cyl), mpg)) +
  stat_summary(fun.data = mean_se, geom = "pointrange")
```

[KEY INSIGHT]
**`geom_pointrange` is `geom_point + geom_linerange` combined.** Cleaner visual than geom_errorbar (which adds whisker caps).

## geom_pointrange() vs geom_errorbar() vs geom_linerange()

| Function | Components |
|---|---|
| `geom_pointrange()` | Point + line from ymin to ymax |
| `geom_errorbar()` | Vertical line with horizontal whiskers |
| `geom_linerange()` | Line only (no point) |
| `geom_crossbar()` | Box (median + range) |

When to use which:

- pointrange for clean point-estimate summaries.
- errorbar for traditional bar-chart-style error.
- linerange when overlaid on points.
- crossbar for median-style summaries.

## A practical workflow

**Use geom_pointrange to compactly summarize estimates with their uncertainty, especially in forest plots.**

```r
broom::tidy(lm(mpg ~ wt + hp + cyl, data = mtcars), conf.int = TRUE) |>
  filter(term != "(Intercept)") |>
  ggplot(aes(estimate, term, xmin = conf.low, xmax = conf.high)) +
  geom_pointrange()
```

Coefficient plot with CIs.

## Common pitfalls

**Pitfall 1: position_dodge needs same dodge for both point and range.** Pass to the geom: `geom_pointrange(position = position_dodge(0.5))`.

**Pitfall 2: forgetting ymin/ymax.** Both required; missing errors.

[WARNING]
**`geom_pointrange()` doesn't have horizontal whiskers like `geom_errorbar`.** Some readers expect the whiskered look; pick by visual preference.

## Try it yourself

**Try it:** Plot mean mpg per cyl with +/- 1 standard deviation as point + range. Save to `ex_plot`.

```r title="Your turn: pointrange"
ex_plot <- mtcars |>
  group_by(cyl) |>
  summarise(m = mean(mpg), sd = sd(mpg)) |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_plot <- mtcars |>
  group_by(cyl) |>
  summarise(m = mean(mpg), sd = sd(mpg)) |>
  ggplot(aes(factor(cyl), m, ymin = m - sd, ymax = m + sd)) +
  geom_pointrange()
```

**Explanation:** Compute mean and SD per cyl; pointrange shows mean as point with +/- SD as range.

</details>

## Related ggplot2 functions

After mastering geom_pointrange, look at:

- `geom_errorbar()`: bar with whiskers
- `geom_linerange()`: line without point
- `geom_crossbar()`: box-style summary
- `stat_summary()`: compute summary on the fly
- `mean_se()`, `mean_cl_normal()`: stat data helpers

## FAQ

**What does geom_pointrange do in ggplot2?**

`geom_pointrange()` draws a central point with a vertical line from ymin to ymax. Used for point-estimate-with-uncertainty plots.

**What is the difference between geom_pointrange and geom_errorbar?**

pointrange has a central point + line. errorbar has only the line + horizontal whiskers at ends. Cleaner visual with pointrange.

**How do I make horizontal point ranges?**

Use `ggstance::geom_pointrangeh` (different package), or swap aes: `aes(y, x, xmin = lo, xmax = hi)` with `coord_flip`.

**How do I control point size?**

Use `fatten`: `geom_pointrange(fatten = 8)`. Higher = larger point relative to line width.

**Can I dodge multiple groups?**

Yes. Pass `position = position_dodge(0.5)`. Same as geom_errorbar.
