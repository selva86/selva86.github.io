---
title: "geom_smooth in R: Add Trend Lines and Confidence Bands to Plots"
slug: "geom_smooth-in-R"
description: "Master geom_smooth() in ggplot2. Learn LOESS vs. linear vs. polynomial smooths, adjust span, control confidence bands, and add custom smooths with formula and method arguments."
keywords: "geom_smooth R, ggplot2 trend line, loess R ggplot2, geom_smooth method lm, confidence band ggplot2, R smooth line scatter plot"
auto_link_terms: "geom_smooth()|ggplot2 trend line|loess smooth R|regression line ggplot2"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: 2026-04-07
curriculum_id: FR-char-8
post_type: "C"
fr_parent: ggplot2-Scatter-Plots.html
sidebar_section: "Visualization"
sidebar_title: "geom_smooth()"
difficulty: "Intermediate"
---

# geom_smooth in R: Add Trend Lines and Confidence Bands to Plots

<p class="lead"><code>geom_smooth()</code> adds a smooth trend line to a ggplot2 scatter plot, either a LOESS curve (default for n &lt; 1,000), a linear regression line (<code>method = "lm"</code>), or any other statistical model you specify.</p>

## Introduction

A scatter plot shows individual data points. `geom_smooth()` reveals the overall pattern by fitting a line or curve through the noise. The result, a trend line with a shaded confidence band, gives readers two things at once: the direction and shape of the relationship, and how certain you are about that shape.

The key decision is *which* type of smooth to use. `geom_smooth()` supports several:
- **LOESS** (default for small data), a flexible local polynomial that finds curves automatically. Great for exploration, hard to interpret as a model.
- **lm**, straight linear regression line. Simple, interpretable, assumes linearity.
- **Polynomial**, curved regression using `poly()`. Captures curvature while staying interpretable.
- **GAM**, generalized additive model (default for n ≥ 1,000). Flexible like LOESS but with penalized smoothing.

This post walks through each option with working code, explains the confidence band, and shows common mistakes that send readers to the wrong conclusions.

## What does geom_smooth() do by default?

With no arguments, `geom_smooth()` fits a LOESS curve (locally estimated scatterplot smoothing) for datasets under 1,000 observations.

```r
library(ggplot2)

# Default geom_smooth: LOESS with 95% confidence band
p_loess <- ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(alpha = 0.4, color = "steelblue") +
  geom_smooth() +   # defaults: method="loess", se=TRUE, level=0.95
  labs(
    title = "Engine Displacement vs Highway MPG",
    x     = "Engine Displacement (L)",
    y     = "Highway MPG"
  ) +
  theme_minimal()

p_loess
```

The blue line is the LOESS fit, a local polynomial that adapts to the shape of the data. The grey ribbon is the 95% confidence band: you can be 95% confident the true smooth passes through this band at each x-value.

**Try it:** Add `span = 0.3` inside `geom_smooth()` to make the LOESS more responsive to local fluctuations (wigglier). Then try `span = 1.5` for a smoother curve. The default `span = 0.75` is a balance between the two.

## How do you add a linear regression line?

LOESS is flexible but hard to interpret quantitatively. When you want to say "for every 1 unit increase in x, y changes by...", use `method = "lm"` for a straight regression line.

```r
# Linear regression line
p_lm <- ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(alpha = 0.4, color = "steelblue") +
  geom_smooth(
    method  = "lm",        # fit a linear model
    formula = y ~ x,       # y ~ x is the default for lm
    color   = "#E53935",
    fill    = "#EF9A9A",   # CI band color
    linewidth = 1
  ) +
  labs(
    title   = "Engine Displacement vs Highway MPG (Linear Fit)",
    x       = "Engine Displacement (L)",
    y       = "Highway MPG",
    caption = "Shaded region = 95% confidence interval"
  ) +
  theme_minimal()

p_lm
```

The `formula = y ~ x` argument is optional but good practice, it makes explicit which model you're fitting. For a simple linear regression this is always `y ~ x`.

**Try it:** Add `se = FALSE` inside `geom_smooth()` to remove the confidence band. This is useful in presentations where the band distracts from the trend, or when you've communicated uncertainty separately.

## How do you fit a polynomial (curved) regression line?

When the relationship is clearly curved, like the U-shape in many biological dose-response relationships, a polynomial smooth fits a curve while remaining interpretable as a model.

```r
# Polynomial fit: y ~ poly(x, 2) = quadratic curve
p_poly <- ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(alpha = 0.4, color = "steelblue") +
  geom_smooth(
    method  = "lm",
    formula = y ~ poly(x, 2),   # quadratic: x + x^2
    color   = "#7B1FA2",
    linewidth = 1
  ) +
  labs(
    title   = "Engine Displacement vs Highway MPG (Quadratic Fit)",
    x       = "Engine Displacement (L)",
    y       = "Highway MPG",
    caption = "Quadratic regression: y ~ poly(x, 2)"
  ) +
  theme_minimal()

p_poly
```

`poly(x, 2)` fits a quadratic term (second-degree polynomial). `poly(x, 3)` would fit a cubic. Keep the degree as low as possible that captures the real curvature, higher-degree polynomials overfit at the extremes.

**Try it:** Compare `formula = y ~ poly(x, 2)` (quadratic) with `formula = y ~ poly(x, 3)` (cubic). Does the extra degree buy you anything, or does the curve just wiggle more at the edges?

## How do you control the confidence band?

The shaded confidence band has several adjustable properties: its presence, width (confidence level), color, and transparency.

```r
# Customize the confidence band
p_ci <- ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(alpha = 0.4, color = "steelblue") +
  # 99% CI, custom band color and transparency
  geom_smooth(
    method    = "lm",
    formula   = y ~ x,
    se        = TRUE,       # show CI band (default TRUE, set FALSE to hide)
    level     = 0.99,       # 99% confidence instead of 95%
    color     = "#1565C0",
    fill      = "#90CAF9",
    alpha     = 0.3,        # band transparency
    linewidth = 1.2
  ) +
  labs(
    title   = "Linear Fit with 99% Confidence Band",
    x       = "Engine Displacement (L)",
    y       = "Highway MPG",
    caption = "Shaded region = 99% confidence interval"
  ) +
  theme_minimal()

p_ci
```

The `level` argument defaults to 0.95. Increasing to 0.99 widens the band, you're claiming higher confidence, which requires a wider interval. Reducing to 0.90 narrows the band.

**Try it:** Change `level = 0.99` to `level = 0.50` (50% CI). Notice the band becomes very narrow, not because the model is highly certain, but because you're only claiming 50% confidence. This illustrates that the CI width is driven by your chosen confidence level, not just the data.

## How do you draw separate smooth lines per group?

When `color` or `group` is mapped to a variable, `geom_smooth()` automatically fits a separate smooth for each group.

```r
# Per-group smooths — one per drive type
p_group <- ggplot(mpg, aes(x = displ, y = hwy, color = drv, fill = drv)) +
  geom_point(alpha = 0.3) +
  geom_smooth(method = "lm", formula = y ~ x, linewidth = 1.1, alpha = 0.15) +
  scale_color_manual(
    values = c("4" = "#E53935", "f" = "#1565C0", "r" = "#2E7D32"),
    labels = c("4" = "4WD", "f" = "Front-wheel", "r" = "Rear-wheel")
  ) +
  scale_fill_manual(
    values = c("4" = "#EF9A9A", "f" = "#90CAF9", "r" = "#A5D6A7"),
    labels = c("4" = "4WD", "f" = "Front-wheel", "r" = "Rear-wheel")
  ) +
  labs(
    title  = "Engine Displacement vs MPG by Drive Type",
    x      = "Engine Displacement (L)", y = "Highway MPG",
    color  = "Drive Type", fill = "Drive Type"
  ) +
  theme_minimal()

p_group
```

The slope of each line tells a story: rear-wheel drive cars show a steeper fuel-efficiency penalty as engine displacement increases. Front-wheel drive cars maintain better fuel economy across sizes.

**Try it:** Add `method = "loess"` (no quotes needed, that's the default) to use LOESS per group instead of linear fits. Compare the two, do the linear fits miss any important curvature?

## Complete Example: Multi-layer Smooth Plot

```r
# Show both LOESS and LM on the same plot for comparison
p_final <- ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(alpha = 0.25, color = "grey50") +
  # LOESS smooth (flexible)
  geom_smooth(
    method = "loess", formula = y ~ x,
    color = "#1565C0", fill = "#90CAF9",
    linewidth = 1, linetype = "solid",
    alpha = 0.15, se = TRUE
  ) +
  # Linear regression line (no band, for contrast)
  geom_smooth(
    method = "lm", formula = y ~ x,
    color = "#C62828",
    linewidth = 1, linetype = "dashed",
    se = FALSE
  ) +
  annotate("text", x = 6, y = 38, label = "LOESS", color = "#1565C0", fontface = "bold", size = 4) +
  annotate("text", x = 6, y = 35, label = "Linear", color = "#C62828", fontface = "bold", size = 4) +
  labs(
    title    = "Displacement vs Highway MPG",
    subtitle = "Blue = LOESS smooth with 95% CI | Red dashed = linear regression",
    x        = "Engine Displacement (L)",
    y        = "Highway MPG"
  ) +
  theme_minimal(base_size = 13) +
  theme(plot.title = element_text(face = "bold"),
        plot.subtitle = element_text(color = "grey50", size = 11))

p_final
```

## Common Mistakes and How to Fix Them

### Mistake 1: Using LOESS for extrapolation

LOESS only smooths within the range of your observed data, it cannot reliably extend beyond it. Use `method = "lm"` or `method = "gam"` when you need to predict outside the data range.

### Mistake 2: Ignoring the warning about method selection

When n ≥ 1,000, ggplot2 silently switches from LOESS to GAM. If you see "geom_smooth() using method = 'gam' and formula = 'y ~ s(x, bs = \"cs\")'", you're no longer fitting LOESS. Be explicit: `method = "loess"` or `method = "gam"`.

### Mistake 3: Treating the CI band as a prediction interval

The confidence band shows where the *true smooth/line* likely falls, not where individual new observations would fall. A prediction interval would be much wider.

```r
# The CI band is NOT a prediction interval
# For individual prediction bounds, compute them from predict() manually
```

### Mistake 4: Forgetting formula = y ~ x with method = "lm"

Without the explicit formula, ggplot2 may issue a warning. Always pair `method = "lm"` with `formula = y ~ x` (or your polynomial formula).

```r
# Add formula explicitly
geom_smooth(method = "lm", formula = y ~ x)
```

### Mistake 5: Too many group smooths on one plot

More than 3-4 group-specific smooth lines creates a tangled spaghetti plot. Use `facet_wrap()` when you have many groups.

## Practice Exercises

### Exercise 1: LOESS vs linear

Using `cars` (speed vs dist), create a scatter plot with two overlaid `geom_smooth()` layers: one LOESS (default), one linear (method = "lm"). Use different colors and remove the CI band from the linear fit for clarity.

<details>
<summary>Show solution</summary>

```r
library(ggplot2)

ggplot(cars, aes(x = speed, y = dist)) +
  geom_point(alpha = 0.6, color = "grey50") +
  geom_smooth(
    method = "loess", formula = y ~ x,
    color = "#1565C0", fill = "#90CAF9", alpha = 0.2, linewidth = 1
  ) +
  geom_smooth(
    method = "lm", formula = y ~ x,
    color = "#C62828", se = FALSE,
    linewidth = 1, linetype = "dashed"
  ) +
  labs(
    title    = "Stopping Distance vs Speed",
    subtitle = "Blue = LOESS | Red dashed = Linear fit",
    x = "Speed (mph)", y = "Stopping Distance (ft)"
  ) +
  theme_minimal()
```

</details>

### Exercise 2: Polynomial fit

Using `cars`, fit a quadratic smooth (`formula = y ~ poly(x, 2)`) and compare with a cubic (`poly(x, 3)`). Which better captures the relationship without overfitting?

<details>
<summary>Show solution</summary>

```r
library(ggplot2)

ggplot(cars, aes(x = speed, y = dist)) +
  geom_point(alpha = 0.6, color = "grey50") +
  geom_smooth(
    method = "lm", formula = y ~ poly(x, 2),
    color = "#1565C0", se = FALSE, linewidth = 1.2,
    linetype = "solid"
  ) +
  geom_smooth(
    method = "lm", formula = y ~ poly(x, 3),
    color = "#C62828", se = FALSE, linewidth = 1.2,
    linetype = "dashed"
  ) +
  annotate("text", x = 22, y = 10, label = "Quadratic", color = "#1565C0", size = 4) +
  annotate("text", x = 22, y = 5, label = "Cubic", color = "#C62828", size = 4) +
  labs(title = "Stopping Distance: Quadratic vs Cubic Fit",
       x = "Speed (mph)", y = "Stopping Distance (ft)") +
  theme_minimal()
```

</details>

## Summary

| Argument | Effect |
|---|---|
| `method = "loess"` | Flexible local smooth (default, n < 1,000) |
| `method = "lm"` | Straight linear regression line |
| `method = "gam"` | Generalized additive model (default, n ≥ 1,000) |
| `formula = y ~ poly(x, 2)` | Quadratic (curved) regression |
| `se = FALSE` | Hide confidence band |
| `level = 0.99` | 99% CI instead of default 95% |
| `span = 0.5` | LOESS smoothing span (lower = wigglier) |
| `color`, `fill` | Line and band color |
| `linewidth` | Line thickness |

**Choosing a smooth type:**
- Exploring unknown patterns → LOESS
- Reporting a model (slope, intercept) → `method = "lm"`
- Clear curvature → `method = "lm"`, `formula = y ~ poly(x, 2)`
- Per-group patterns → map `color` or `group`, ggplot2 fits one smooth per group

## FAQ

**Why does geom_smooth() switch from loess to gam for large datasets?**
LOESS is computationally expensive (O(n²)), for n ≥ 1,000, it becomes slow. ggplot2 automatically uses GAM (from the `mgcv` package) for large data. Force LOESS with `method = "loess"` if you need it.

**What is the span parameter in LOESS?**
`span` controls how much of the data is used for each local fit. Smaller span (e.g., 0.3) fits more locally (wigglier), larger span (e.g., 1.0) uses more of the data (smoother). The default is 0.75.

**Can geom_smooth() fit a log or spline model?**
Yes, `formula = y ~ log(x)` fits a logarithmic curve. For splines, use `formula = y ~ splines::ns(x, df = 4)` (natural splines with 4 degrees of freedom).

**How do I make geom_smooth() use my own model?**
Pass a function to `method`. For example, `method = MASS::rlm` fits a robust linear model. Any function that works like `lm()` (takes `formula` and `data`) can be used.

**Why does my CI band disappear when I add both color and fill mapping?**
When `aes(fill = group)` is set, geom_smooth uses `fill` for the CI band *and* the group-specific colors. The band may become invisible if fill scales conflict. Fix: use `aes(color = group)` only, and let ggplot auto-set fill from color.

## References

- Wickham H. (2016). *ggplot2: Elegant Graphics for Data Analysis*. Springer.
- ggplot2 official docs, geom_smooth: ggplot2.tidyverse.org/reference/geom_smooth.html
- Cleveland W.S. (1979). Robust Locally Weighted Regression and Smoothing Scatterplots. *JASA*.
- Wilke C. (2019). *Fundamentals of Data Visualization*, Chapter 14: Visualizing trends

## Continue Learning

- **ggplot2 Scatter Plots**, the foundation: geom_point(), overplotting, and annotations
- **Error Bars in ggplot2**, add uncertainty intervals to mean estimates
- **R Correlation Matrix Plot**, visualize the full pairwise correlation structure
