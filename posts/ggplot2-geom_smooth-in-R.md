---
title: "ggplot2 geom_smooth() in R: Trend Lines With Examples"
slug: "ggplot2-geom_smooth-in-R"
description: "Use ggplot2 geom_smooth() to add trend lines to plots in R. Covers method = lm, loess, gam, confidence intervals, formula, span, and 6 worked examples."
keywords: "geom_smooth, ggplot2 trend line, regression line in R, R add trend line, ggplot2 loess, ggplot2 method gam, ggplot2 confidence interval"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "ggplot2-functions"
fr_parent: "ggplot2-Tutorial-With-R.html"
auto_link_terms: "geom_smooth()|ggplot2 geom_smooth|ggplot2 trend line|regression line ggplot2|loess ggplot2"
auto_link_case_sensitive: true
target_keyword: "geom_smooth"
sibling_block_enabled: true
difficulty: "Beginner"
---

# ggplot2 geom_smooth() in R: Trend Lines With Examples

<p class="lead">The <code>geom_smooth()</code> function in ggplot2 fits a smooth trend line through (x, y) data with an optional confidence band. Use <code>method = "lm"</code> for linear regression, <code>"loess"</code> for local smoothing, or <code>"gam"</code> for generalized additive splines.</p>

[QUICK ANSWER]
ggplot(df, aes(x, y)) + geom_point() + geom_smooth()                 # default loess
ggplot(df, aes(x, y)) + geom_point() + geom_smooth(method = "lm")    # linear regression
ggplot(df, aes(x, y)) + geom_smooth(method = "lm", se = FALSE)       # no CI band
ggplot(df, aes(x, y, color = group)) + geom_smooth(method = "lm")    # one line per group
ggplot(df, aes(x, y)) + geom_smooth(method = "lm", formula = y ~ poly(x, 2))
ggplot(df, aes(x, y)) + geom_smooth(method = "gam")                  # GAM splines
ggplot(df, aes(x, y)) + geom_smooth(method = "loess", span = 0.3)    # tighter loess

[DECISION TREE: Is geom_smooth() the right tool?]
- linear trend with CI: geom_smooth(method = "lm")
- nonlinear local trend: geom_smooth(method = "loess") or "gam"
- polynomial fit: method = "lm", formula = y ~ poly(x, 2)
- one trend per group: aes(color = grp) + geom_smooth(method = "lm")
- show only the model line, no points: geom_smooth() (without geom_point)
- confidence interval band only: geom_ribbon (after computing predictions)
- residuals or diagnostics: fit lm() separately, then plot

## What geom_smooth() does in one sentence

**`geom_smooth()` fits a trend line to (x, y) data and optionally draws a 95% confidence band around it.** The `method` argument picks the model: linear regression (`lm`), local polynomial (`loess`), generalized additive (`gam`), or any custom modeling function.

For exploratory analysis, `geom_smooth()` is the fastest way to add a quick statistical summary to a scatter plot. For publication, fit the model separately with `lm()` or `gam()`, extract predictions, and plot via `geom_line()` for full control over confidence levels, prediction intervals, and styling.

Behind the scenes, `geom_smooth()` calls a stat that subsamples your data, fits the chosen model, predicts y values across a regular grid of x, and connects those predictions with a line. The confidence band is computed from the model's standard errors. None of this is visible in the API; you just get a clean line on top of your scatter plot.

The smoothness of the resulting curve depends on the method: `lm` gives a perfectly straight line; `loess` and `gam` adapt to the data shape with parameters you can tune. Default settings work well for exploratory plots; for publication, always specify the method and any tuning parameters explicitly.

## Syntax

**`geom_smooth()` requires `aes(x, y)`. Other arguments tune the model.**

```r title="Load ggplot2 and inspect mpg"
library(ggplot2)

ggplot(mpg, aes(x = displ, y = hwy)) + geom_point() |> head()
```

The full signature:

```
geom_smooth(mapping = NULL, data = NULL, stat = "smooth", position = "identity",
            ..., method = NULL, formula = NULL, se = TRUE, na.rm = FALSE,
            orientation = NA, show.legend = NA, inherit.aes = TRUE)
```

[TIP]
**Default `method = NULL` chooses LOESS for N < 1000 and GAM for larger.** This means the same code can change behavior at scale. For consistent behavior across data sizes, always specify `method` explicitly.

## Six common patterns

### 1. Default smooth (loess for small data, gam for large)

```r title="Highway mpg vs displacement"
ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(alpha = 0.5) +
  geom_smooth()
```

The simplest case: loess curve fitted through the points, with a 95% confidence band. ggplot prints a console message indicating which method it chose.

### 2. Linear regression line

```r title="Linear fit only"
ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(alpha = 0.5) +
  geom_smooth(method = "lm")
```

`method = "lm"` fits ordinary least squares and draws the line. The shaded band is the 95% confidence interval for the mean prediction.

### 3. Linear fit without confidence band

```r title="Just the line"
ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(alpha = 0.5) +
  geom_smooth(method = "lm", se = FALSE)
```

`se = FALSE` hides the confidence band. Use this when the band is misleading (small samples) or when you want a cleaner visual.

### 4. One smooth per group

```r title="Separate lines per drivetrain"
ggplot(mpg, aes(x = displ, y = hwy, color = drv)) +
  geom_point(alpha = 0.6) +
  geom_smooth(method = "lm", se = FALSE)
```

Mapping `color = drv` automatically groups the smooth. Each drv gets its own regression line. Helpful for comparing trends across categories.

### 5. Polynomial fit

```r title="Quadratic regression line"
ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(alpha = 0.5) +
  geom_smooth(method = "lm", formula = y ~ poly(x, 2))
```

`formula = y ~ poly(x, 2)` fits a degree-2 polynomial. For higher-order, change the integer (`poly(x, 3)`, etc.). Use `splines::ns(x, df = 4)` for natural splines.

### 6. Tighter LOESS span

```r title="More wiggly local fit"
ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(alpha = 0.5) +
  geom_smooth(method = "loess", span = 0.3)
```

`span` controls how much data is used at each x point. Default `0.75` is smooth; `0.3` is more responsive to local features. Lower span = wigglier fit.

[KEY INSIGHT]
**`geom_smooth()` is for VISUAL summary, not formal modeling.** The fitted line and band are descriptive, not inferential. For p-values, coefficients, model selection, fit your model separately with `lm()`, `glm()`, or `gam()` and then plot the predictions. `geom_smooth()` hides the model details on purpose.

This separation matters in practice. A team might prototype with `geom_smooth(method = "lm")` and discover a useful linear trend. The actual analysis then runs `lm()` separately to get coefficients, residuals, and diagnostics. The final report uses both: a fitted-line plot for the visual story and a coefficient table for the statistical claim. `geom_smooth()` is the entry point, not the destination.

### A note on confidence intervals in geom_smooth

The shaded band drawn by default with `se = TRUE` is the 95% confidence interval for the MEAN PREDICTION at each x. It tells you "the average y at this x is in this band with 95% confidence", assuming the model is correct. It is NOT a prediction interval for individual observations, which would be wider. For prediction intervals, fit the model with `lm()` and use `predict(model, interval = "prediction")` to extract the wider band, then plot via `geom_ribbon()`.

The CI band's width depends on the model's standard errors at each x, the chosen significance level (default 0.95), and the spread of x values around that point. It is generally narrowest near the center of the x range and widens toward the extremes, which matches how a regression model is most certain near the mean of x.

## geom_smooth() methods comparison

**Choose method based on what you want to show.**

| Method | What it does | Use for |
|---|---|---|
| `"lm"` | Ordinary least squares linear regression | Linear relationships, comparing slopes |
| `"glm"` | Generalized linear model (specify family) | Logistic, Poisson, etc. |
| `"loess"` | Local polynomial regression | Nonlinear, exploratory |
| `"gam"` | Generalized additive model with splines | Nonlinear, large data |
| `"rlm"` (MASS) | Robust linear regression | Outlier-resistant linear |

| Method | Default span/df | Computational cost |
|---|---|---|
| lm | N/A | Very low |
| loess | span = 0.75 | Medium (slow on large data) |
| gam | k = 10 | Low to medium |

When to use which:

- Use `lm` when you want to show or test a linear trend.
- Use `loess` for exploratory nonlinear smoothing on small data.
- Use `gam` for large data or when you need spline-based nonlinearity.

## Common pitfalls

**Pitfall 1: forgetting that geom_smooth's confidence band is for the MEAN PREDICTION, not for individual points.** A new observation at a given x has wider uncertainty than the band shows. The band tells you "the mean of y at this x is in this range with 95% confidence", not "any new point will fall in this range".

**Pitfall 2: relying on the default method.** Default switches between loess and gam at N=1000. Adding 50 rows of data can change the visual. Always specify `method` for reproducible plots.

[WARNING]
**`method = "lm"` always fits a STRAIGHT LINE unless you change the formula.** If your data is curved, `geom_smooth(method = "lm")` will mislead. Either use `loess`/`gam` for nonlinear, or fit a polynomial via `formula = y ~ poly(x, k)`.

**Pitfall 3: loess fails on very large data.** Loess is computationally expensive. With 100K+ rows, it can be slow or run out of memory. Switch to `gam` for large data or sample the data first.

## Try it yourself

**Try it:** Plot `mpg$hwy` vs `mpg$displ`, color points by `class`, add ONE shared linear regression line (NOT per group), and hide the confidence band. Save to `ex_plot`.

```r title="Your turn: shared regression across colored groups"
# Try it: color points by class, single regression line for all
ex_plot <- ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(aes(# your color mapping here
                ), alpha = 0.6) +
  # your geom_smooth here

print(ex_plot)
#> Expected: scatter with multiple colors but ONE regression line, no band
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_plot <- ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(aes(color = class), alpha = 0.6) +
  geom_smooth(method = "lm", se = FALSE, color = "black")

print(ex_plot)

```

**Explanation:** Mapping `color = class` INSIDE `geom_point()` (not in the parent `aes`) limits the color to the points only. The `geom_smooth()` then fits a single line through all data because it does not inherit the color aesthetic. `se = FALSE` hides the band; `color = "black"` overrides any default styling.

</details>

## Related ggplot2 functions

After mastering `geom_smooth()`, look at:

- `stat_smooth()`: alternative spelling; same function
- `stat_summary()`: custom summary statistics on top of points
- `geom_line()` plus model predictions: full control over the fitted line
- `lm()`, `glm()`, `gam()`: fit the model separately for full diagnostic control
- `ggeffects` package: extract and plot model predictions cleanly
- `geom_ribbon()`: manual confidence bands when you want full control

For mixed-effects models, fit with `lme4::lmer()` and use `ggeffects::ggpredict()` to extract predictions for plotting.

## FAQ

**How do I add a regression line in ggplot2?**

Use `geom_smooth(method = "lm")` after `geom_point()`. For just the line without the confidence band: `geom_smooth(method = "lm", se = FALSE)`. For higher-order: `formula = y ~ poly(x, 2)` for quadratic.

**What is the difference between lm and loess in geom_smooth?**

`method = "lm"` fits a straight line via ordinary least squares. `method = "loess"` fits a smooth local curve that adapts to the data shape. Use lm for linear; loess for exploratory nonlinear.

**How do I remove the confidence band in geom_smooth?**

Add `se = FALSE`: `geom_smooth(method = "lm", se = FALSE)`. The band is hidden but the line stays.

**Why is my geom_smooth slow?**

Loess (the default for small data) is O(N^2) and slows on large datasets. Solutions: switch to `method = "gam"` for large data, or sample the data first via `slice_sample(prop = 0.1)`.

**How do I fit a separate trend line per group in ggplot2?**

Map a categorical variable to `color`, `linetype`, or `group`: `aes(x, y, color = grp) + geom_smooth(method = "lm")`. ggplot will fit one regression per unique grp value.
