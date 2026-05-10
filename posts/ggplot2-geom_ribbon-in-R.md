---
title: "ggplot2 geom_ribbon() in R: Filled Area Between Two Lines"
slug: "ggplot2-geom_ribbon-in-R"
description: "Use ggplot2 geom_ribbon() to draw a filled area between two y values for confidence bands or ranges in R. Covers ymin, ymax, and 5 worked examples."
keywords: "ggplot2 geom_ribbon, R confidence band, geom_ribbon ymin ymax, ggplot ribbon, fill between lines, geom_ribbon vs geom_area"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "ggplot2-functions"
fr_parent: "ggplot2-Tutorial-With-R.html"
auto_link_terms: "geom_ribbon()|ggplot2 geom_ribbon|confidence band|fill between lines|geom_ribbon ymin ymax"
auto_link_case_sensitive: true
target_keyword: "ggplot2 geom_ribbon"
sibling_block_enabled: true
difficulty: "Beginner"
---

# ggplot2 geom_ribbon() in R: Filled Area Between Two Lines

<p class="lead">The <code>geom_ribbon()</code> function in ggplot2 fills the AREA between two y values (ymin and ymax) at each x. It is the standard tool for confidence bands, prediction intervals, and any "range over time" plot.</p>

[QUICK ANSWER]
ggplot(df, aes(x, ymin = lo, ymax = hi)) + geom_ribbon()
ggplot(df, aes(x, y, ymin = lo, ymax = hi)) + geom_ribbon(alpha = 0.3) + geom_line()
geom_ribbon(fill = "steelblue", alpha = 0.4)
geom_area(...)                        # different: from 0 baseline

[DECISION TREE: Is geom_ribbon() the right tool?]
- area between two y curves: geom_ribbon()
- area from 0 to y: geom_area()
- prediction interval band: geom_ribbon
- error bars per point: geom_errorbar()
- shaded confidence band on a line plot: geom_ribbon + geom_line

## What geom_ribbon() does in one sentence

**`geom_ribbon()` draws a filled area at each x bounded by ymin (bottom) and ymax (top).** The most common use: confidence bands around a fit line.

## Syntax

**`geom_ribbon(mapping = NULL, data = NULL, alpha = 0.3, ...)`. Requires aes(ymin, ymax).**

```r title="Confidence band around mean"
library(ggplot2)
library(dplyr)

mtcars |>
  group_by(cyl) |>
  summarise(mean_mpg = mean(mpg),
            sd_mpg   = sd(mpg)) |>
  ggplot(aes(cyl, mean_mpg)) +
  geom_ribbon(aes(ymin = mean_mpg - sd_mpg, ymax = mean_mpg + sd_mpg), alpha = 0.3) +
  geom_line()
```

[TIP]
**Always pair `geom_ribbon` with `geom_line` for the central trend.** The ribbon shows uncertainty; the line shows the estimate.

## Five common patterns

### 1. Confidence band

```r title="Mean ± SD ribbon"
df |>
  ggplot(aes(x, mean)) +
  geom_ribbon(aes(ymin = mean - sd, ymax = mean + sd), alpha = 0.3) +
  geom_line()
```

### 2. Prediction interval

```r title="From a model"
predictions |>
  ggplot(aes(x, fit)) +
  geom_ribbon(aes(ymin = lwr, ymax = upr), fill = "steelblue", alpha = 0.3) +
  geom_line(color = "steelblue")
```

### 3. Min-max range

```r title="Range over time"
df |>
  ggplot(aes(date, ymin = min_temp, ymax = max_temp)) +
  geom_ribbon(fill = "tomato", alpha = 0.4)
```

### 4. Multiple ribbons (groups)

```r title="Per-group bands"
df |>
  ggplot(aes(x, fit, ymin = lo, ymax = hi, fill = group)) +
  geom_ribbon(alpha = 0.3) +
  geom_line(aes(color = group))
```

### 5. Combine with stat_smooth

```r title="Auto-computed band"
ggplot(mtcars, aes(wt, mpg)) +
  geom_smooth(method = "lm")  # fills band automatically
#> Equivalent to ribbon + line of model fit
```

[KEY INSIGHT]
**`geom_smooth()` internally uses `geom_ribbon` + `geom_line` to draw the fit line and confidence band.** When you need MORE control (custom intervals, prediction bands), build with geom_ribbon + geom_line directly.

## geom_ribbon() vs geom_area() vs geom_errorbar()

| Function | Bounds | Best for |
|---|---|---|
| `geom_ribbon()` | ymin to ymax | Confidence bands, ranges |
| `geom_area()` | 0 to y | Filled areas from baseline |
| `geom_errorbar()` | ymin to ymax (vertical bars) | Per-point uncertainty |

## A practical workflow

**The "fit + band" pattern is geom_ribbon's signature use.**

```r
fit <- lm(mpg ~ wt, data = mtcars)
preds <- predict(fit, interval = "confidence") |>
  as_tibble() |>
  bind_cols(mtcars)

ggplot(preds, aes(wt, mpg)) +
  geom_ribbon(aes(ymin = lwr, ymax = upr), alpha = 0.3) +
  geom_line(aes(y = fit), color = "steelblue") +
  geom_point()
```

Manual confidence band from a linear model.

## Common pitfalls

**Pitfall 1: forgetting alpha.** Default fill is solid. Set `alpha = 0.3` for translucency so the line and points underneath remain visible.

**Pitfall 2: forgetting the line.** A ribbon alone is just a shaded area. Add `geom_line` for the central trend.

[WARNING]
**`geom_ribbon` fills BETWEEN ymin and ymax — the line itself is NOT drawn.** Always pair with geom_line for the visible trend.

## Try it yourself

**Try it:** Plot mtcars wt vs mpg with a fit line and 95% confidence band using lm. Save to `ex_plot`.

```r title="Your turn: fit + band"
fit <- lm(mpg ~ wt, data = mtcars)
preds <- predict(fit, interval = "confidence") |> as.data.frame() |> bind_cols(mtcars)

ex_plot <- # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_plot <- ggplot(preds, aes(wt, mpg)) +
  geom_ribbon(aes(ymin = lwr, ymax = upr), alpha = 0.3, fill = "steelblue") +
  geom_line(aes(y = fit), color = "steelblue") +
  geom_point()
```

**Explanation:** ribbon for the band; line for the fit; points for raw data.

</details>

## Related ggplot2 functions

After mastering geom_ribbon, look at:

- `geom_area()`: from baseline 0
- `geom_smooth()`: auto fit + band
- `geom_errorbar()` / `geom_errorbarh()`: per-point bars
- `geom_pointrange()`: point with range
- `stat_summary()`: compute summaries on the fly

## FAQ

**What does geom_ribbon do in ggplot2?**

`geom_ribbon()` fills the area between ymin and ymax at each x. Used for confidence bands, prediction intervals, and ranges over time.

**What is the difference between geom_ribbon and geom_area?**

geom_ribbon fills between ymin and ymax (two curves). geom_area fills from baseline 0 to y (one curve).

**How do I make geom_ribbon translucent?**

Set `alpha = 0.3` (or smaller). Default is opaque, which obscures lines underneath.

**Should I use geom_smooth or geom_ribbon for confidence bands?**

geom_smooth for automatic fit + band. geom_ribbon for manual control over the band's data.

**Can I use geom_ribbon with multiple groups?**

Yes. Pass `fill = group` in aes; each group gets its own ribbon. Pair with geom_line(color = group) for trends.
