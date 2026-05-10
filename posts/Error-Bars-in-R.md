---
title: "Error Bars in R with ggplot2: SD, SE, and Confidence Intervals"
slug: "Error-Bars-in-R"
description: "Add error bars to ggplot2 plots in R using geom_errorbar(), geom_pointrange(), and geom_linerange(). Learn when to use SD vs SE vs 95% CI and how to compute them with dplyr."
keywords: "error bars R, geom_errorbar ggplot2, ggplot2 error bars, confidence interval R ggplot2, standard error R plot, geom_pointrange R"
auto_link_terms: "error bars in R|geom_errorbar()|geom_pointrange()|confidence interval plot R"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: 2026-04-07
curriculum_id: FR-char-7
post_type: "C"
fr_parent: ggplot2-Scatter-Plots.html
sidebar_section: "Visualization"
sidebar_title: "Error Bars"
difficulty: "Intermediate"
---

# Error Bars in R with ggplot2: SD, SE, and Confidence Intervals

<p class="lead">Error bars in ggplot2 are added with <code>geom_errorbar()</code>, which takes <code>ymin</code> and <code>ymax</code>, typically computed as mean ± SD, mean ± SE, or a 95% confidence interval from your summary data.</p>

## Introduction

A mean without context is often misleading. If you say "Group A averages 42" and "Group B averages 45," the critical question is: how much variability is there within each group? Are those means reliably different, or could they easily swap on the next sample?

Error bars answer that question visually. But there are three common choices, standard deviation (SD), standard error (SE), and 95% confidence intervals (CI), and picking the wrong one changes what your chart communicates:

- **SD** shows the spread of *individual observations*. Wide SD = high natural variability in the data.
- **SE** shows the precision of the *mean estimate*. Smaller SE = more confident the mean is a good estimate.
- **95% CI** shows the range you're 95% confident contains the *true population mean*. Narrowest of the three.

This post shows you how to compute each, add them to ggplot2 charts, and which situations call for which.

## How do you compute summary statistics for error bars?

Before adding error bars, you need a summary data frame with columns for the mean, and the upper/lower bounds of your error interval. `dplyr` makes this straightforward.

```r title="Compute summary stats for error bars"
library(ggplot2)
library(dplyr)

library(tidyr)
# Compute mean, SD, SE, 95% CI per species using iris
summary_df <- iris |>
  group_by(Species) |>
  summarise(
    n    = n(),
    mean = mean(Sepal.Length),
    sd   = sd(Sepal.Length),
    se   = sd / sqrt(n),
    ci95 = qt(0.975, df = n - 1) * se   # t-distribution for small samples
  ) |>
  mutate(
    sd_lo  = mean - sd,   sd_hi  = mean + sd,
    se_lo  = mean - se,   se_hi  = mean + se,
    ci_lo  = mean - ci95, ci_hi  = mean + ci95
  )

summary_df
```

`qt(0.975, df = n - 1)` uses the t-distribution critical value (not 1.96) because `n = 50` per group, for small samples, the t-distribution gives wider, more honest intervals than the normal approximation.

**Try it:** Change `qt(0.975, df = n - 1)` to `1.96` (the z-score for 95% CI). For n=50, the difference is small. Now try `n = 5` observations, you'll see the t-distribution gives notably wider intervals.

## How do you add error bars to a point plot?

`geom_errorbar()` draws vertical lines at `ymin` and `ymax`. Add it on top of `geom_point()` to show mean + uncertainty.

```r title="Add error bars to a point plot"
# Error bars showing ±SE
p_errbar <- ggplot(summary_df, aes(x = Species, y = mean, color = Species)) +
  geom_errorbar(
    aes(ymin = se_lo, ymax = se_hi),
    width    = 0.2,    # width of the horizontal caps
    linewidth = 0.8
  ) +
  geom_point(size = 4) +
  scale_color_manual(values = c("#E69F00", "#56B4E9", "#009E73")) +
  labs(
    title   = "Sepal Length by Species (mean ± SE)",
    x       = NULL,
    y       = "Sepal Length (cm)",
    caption = "Error bars show ± 1 standard error"
  ) +
  theme_minimal() +
  theme(legend.position = "none")

p_errbar
```

The `width` argument controls the horizontal caps at the top and bottom of each error bar. Set `width = 0` to remove caps entirely (whiskers only).

**Try it:** Replace `ymin = se_lo, ymax = se_hi` with `ymin = ci_lo, ymax = ci_hi` to show 95% CI instead of SE. Notice how the intervals widen. Then try `ymin = sd_lo, ymax = sd_hi` for SD, they're much wider because SD describes individual spread, not mean precision.

## What is geom_pointrange() and when should you use it?

`geom_pointrange()` combines the dot and the interval into a single geom, cleaner code and a cleaner look, since it ensures the dot and bar are perfectly aligned.

```r title="Combine dot and interval with pointrange"
# geom_pointrange: dot + interval in one geom
p_pointrange <- ggplot(summary_df, aes(x = Species, y = mean, color = Species)) +
  geom_pointrange(
    aes(ymin = ci_lo, ymax = ci_hi),
    linewidth = 0.8,
    fatten    = 4    # controls dot size relative to line width
  ) +
  scale_color_manual(values = c("#E69F00", "#56B4E9", "#009E73")) +
  labs(
    title   = "Sepal Length by Species (mean ± 95% CI)",
    x       = NULL,
    y       = "Sepal Length (cm)",
    caption = "Error bars show 95% confidence intervals"
  ) +
  theme_minimal() +
  theme(legend.position = "none")

p_pointrange
```

`fatten` controls the ratio of dot size to line width. `fatten = 4` (default) makes the dot 4× the line width. Reduce it for a smaller dot, increase for a more prominent point.

Related geoms for comparison:
- `geom_linerange()`, line only, no dot
- `geom_crossbar()`, box with a middle line (like a boxplot whisker)
- `geom_errorbarh()`, horizontal error bars (for when the x-axis is continuous)

**Try it:** Replace `geom_pointrange()` with `geom_linerange(aes(ymin = ci_lo, ymax = ci_hi))`, the dot disappears. Then try `geom_crossbar(aes(ymin = ci_lo, ymax = ci_hi), width = 0.3)`, you get a box instead.

## How do you add error bars to a bar chart?

Bar charts with error bars are common in scientific papers. The key: add `geom_errorbar()` *after* `geom_col()` so it renders on top.

```r title="Error bars on a bar chart"
# Bar chart with error bars
p_bar <- ggplot(summary_df, aes(x = Species, y = mean, fill = Species)) +
  geom_col(width = 0.6, alpha = 0.85) +
  geom_errorbar(
    aes(ymin = se_lo, ymax = se_hi),
    width    = 0.2,
    linewidth = 0.7,
    color    = "grey30"
  ) +
  scale_fill_manual(values = c("#E69F00", "#56B4E9", "#009E73")) +
  labs(
    title   = "Sepal Length by Species",
    x       = NULL,
    y       = "Sepal Length (cm)",
    caption = "Error bars show ± 1 SE"
  ) +
  theme_minimal() +
  theme(legend.position = "none")

p_bar
```

Note: many visualization experts argue against bar charts with error bars, because the bar fills from zero, implying the total area matters, while error bars relate only to the mean at the top. A point range or dot plot is more honest. But bar + error bar is so common in scientific literature that knowing how to make it is essential.

**Try it:** Change the error bars to show SD instead of SE: `ymin = sd_lo, ymax = sd_hi`. How does the perception of group differences change?

## How do you make horizontal error bars?

When your continuous variable is on the x-axis (e.g., effect sizes, regression coefficients), use `geom_errorbarh()`.

```r title="Horizontal error bars for coefficients"
# Horizontal error bars: regression-style coefficient plot
coef_df <- data.frame(
  variable  = c("Petal.Length", "Petal.Width", "Sepal.Width", "Intercept"),
  estimate  = c(0.83, -0.32, 0.45, 1.86),
  ci_lo     = c(0.71, -0.52, 0.28, 1.05),
  ci_hi     = c(0.95, -0.12, 0.62, 2.67)
)
coef_df$variable <- reorder(coef_df$variable, coef_df$estimate)
coef_df$sig <- !(coef_df$ci_lo < 0 & coef_df$ci_hi > 0)  # CI excludes 0?

p_horiz <- ggplot(coef_df, aes(x = estimate, y = variable, color = sig)) +
  geom_vline(xintercept = 0, linetype = "dashed", color = "grey50") +
  geom_errorbarh(
    aes(xmin = ci_lo, xmax = ci_hi),
    height    = 0.2,
    linewidth = 0.8
  ) +
  geom_point(size = 4) +
  scale_color_manual(
    values = c("TRUE" = "#1565C0", "FALSE" = "grey60"),
    labels = c("TRUE" = "p < 0.05", "FALSE" = "n.s."),
    name   = "Significance"
  ) +
  labs(
    title   = "Regression Coefficients with 95% CI",
    x       = "Coefficient Estimate",
    y       = NULL,
    caption = "Blue = CI excludes zero (statistically significant)"
  ) +
  theme_minimal()

p_horiz
```

This "forest plot" style is standard for coefficient plots, meta-analyses, and effect size summaries. The vertical dashed line at x=0 is the null hypothesis reference, coefficients whose CI crosses zero are not statistically significant at α=0.05.

**Try it:** Change `color = sig` to `color = estimate > 0` to color by direction (positive/negative) instead of significance. How does this change the message?

## Complete Example: Multi-group Error Bar Plot

```r title="Multi-group dodged error bars"
# Multi-group: error bars with grouped points + dodge
multi_df <- iris |>
  group_by(Species) |>
  summarise(
    n    = n(),
    sl_mean = mean(Sepal.Length), sl_se = sd(Sepal.Length) / sqrt(n()),
    pl_mean = mean(Petal.Length), pl_se = sd(Petal.Length) / sqrt(n())
  ) |>
  tidyr::pivot_longer(
    cols = c(sl_mean, pl_mean, sl_se, pl_se),
    names_to = c("measure", ".value"),
    names_pattern = "(.+)_(mean|se)"
  )

p_final <- ggplot(multi_df, aes(x = Species, y = mean, color = measure,
                                 group = measure)) +
  geom_errorbar(
    aes(ymin = mean - se, ymax = mean + se),
    width    = 0.15,
    linewidth = 0.7,
    position = position_dodge(0.4)
  ) +
  geom_point(
    size = 4,
    position = position_dodge(0.4)
  ) +
  scale_color_manual(
    values = c("sl" = "#1565C0", "pl" = "#C62828"),
    labels = c("sl" = "Sepal Length", "pl" = "Petal Length")
  ) +
  labs(
    title   = "Sepal vs Petal Length by Species (mean ± SE)",
    x       = NULL, y = "Length (cm)", color = NULL,
    caption = "Error bars show ± 1 standard error"
  ) +
  theme_minimal(base_size = 13) +
  theme(
    plot.title    = element_text(face = "bold"),
    legend.position = "top"
  )

p_final
```

## Common Mistakes and How to Fix Them

### Mistake 1: Not labeling which error measure you used

❌ Adding error bars without saying whether they're SD, SE, or CI.

✅ Always add a caption or subtitle specifying the error measure:

```r title="Common mistake: unlabelled error bars"
labs(caption = "Error bars show 95% confidence intervals")
# or
labs(caption = "Error bars show ± 1 standard error")
```

### Mistake 2: Using SD when you mean to show precision

SD and SE answer different questions. If you're making a claim about how precisely you've estimated the mean, use SE or CI. If you're describing natural variability in the population, use SD.

### Mistake 3: Confusing `width` and `linewidth`

- `width`, horizontal extent of the caps (set to 0 for no caps)
- `linewidth`, thickness of the vertical line

```r title="Common mistake: SD versus SE choice"
# Both matter
geom_errorbar(aes(ymin = lo, ymax = hi), width = 0.2, linewidth = 0.8)
```

### Mistake 4: Forgetting position_dodge() for grouped plots

When you have multiple groups per x-axis position, error bars stack on top of each other without `position_dodge()`.

```r title="Common mistake: overlapping error bars"
# Wrong: bars overlap
geom_errorbar(aes(ymin = lo, ymax = hi))

# Correct: dodge bars apart
geom_errorbar(aes(ymin = lo, ymax = hi), position = position_dodge(0.4))
```

### Mistake 5: Computing SE or CI on already-summarized data

If you pass a summary table to ggplot, `stat_summary()` won't recompute SE/CI for you. Compute them explicitly in your `summarise()` step first.

## Practice Exercises

### Exercise 1: Point plot with CI

Using `ToothGrowth`, compute mean tooth length (`len`) by supplement (`supp`) and dose (`dose`). Create a point + error bar plot showing 95% CI. Use `position_dodge()` to separate the two supplement groups.

<details>
<summary>Show solution</summary>

```r title="ToothGrowth CI error bars solution"
library(ggplot2)
library(dplyr)

tg_summary <- ToothGrowth |>
  group_by(supp, dose) |>
  summarise(
    n    = n(),
    mean = mean(len),
    se   = sd(len) / sqrt(n),
    ci95 = qt(0.975, df = n - 1) * se,
    .groups = "drop"
  )

ggplot(tg_summary, aes(x = factor(dose), y = mean, color = supp, group = supp)) +
  geom_errorbar(
    aes(ymin = mean - ci95, ymax = mean + ci95),
    width = 0.2, linewidth = 0.8,
    position = position_dodge(0.3)
  ) +
  geom_point(size = 4, position = position_dodge(0.3)) +
  geom_line(position = position_dodge(0.3), linewidth = 0.5, linetype = "dashed") +
  scale_color_manual(values = c("OJ" = "#FF9800", "VC" = "#2196F3")) +
  labs(
    title   = "Tooth Growth by Supplement and Dose",
    x       = "Dose (mg/day)", y = "Tooth Length",
    color   = "Supplement",
    caption = "Error bars show 95% CI"
  ) +
  theme_minimal()
```

</details>

### Exercise 2: Bar chart with error bars

Using the same `tg_summary` from Exercise 1, create a bar chart with error bars for each supplement-dose combination. Use `facet_wrap(~ supp)` to separate supplements into panels.

<details>
<summary>Show solution</summary>

```r title="Faceted ToothGrowth bar solution"
library(ggplot2)

ggplot(tg_summary, aes(x = factor(dose), y = mean, fill = factor(dose))) +
  geom_col(width = 0.6, alpha = 0.85) +
  geom_errorbar(
    aes(ymin = mean - ci95, ymax = mean + ci95),
    width = 0.2, linewidth = 0.7, color = "grey30"
  ) +
  facet_wrap(~ supp, labeller = labeller(supp = c(OJ = "Orange Juice", VC = "Vitamin C"))) +
  scale_fill_brewer(palette = "Blues") +
  labs(
    title   = "Tooth Growth by Supplement and Dose",
    x       = "Dose (mg/day)", y = "Mean Tooth Length",
    caption = "Error bars show 95% CI",
    fill    = "Dose"
  ) +
  theme_minimal()
```

</details>

## Summary

| Geom | Use case |
|---|---|
| `geom_errorbar()` | Vertical error bars (with caps) on any plot |
| `geom_pointrange()` | Dot + interval in one geom |
| `geom_linerange()` | Interval line only, no dot |
| `geom_crossbar()` | Box-style interval with median line |
| `geom_errorbarh()` | Horizontal error bars (for x-axis intervals) |

| Error measure | Formula | Shows |
|---|---|---|
| SD | `sd(x)` | Spread of individual observations |
| SE | `sd(x) / sqrt(n)` | Precision of the mean estimate |
| 95% CI | `qt(0.975, df=n-1) * se` | Range likely containing the true mean |

**Always label your error bars**, unlabeled error bars are ambiguous and a common criticism in peer review.

## FAQ

**Should I use SD or SE for error bars?**
Use **SD** to describe natural variability in your data (e.g., showing how spread out individual measurements are). Use **SE** or **95% CI** to show how precisely you've estimated the mean, these are for inferential claims.

**Why does 95% CI use qt() instead of 1.96?**
`1.96` is the z-score for a 95% CI under the *normal* distribution (infinite sample size). For finite samples, the t-distribution with `df = n - 1` is more accurate. With n ≥ 30, the difference is negligible; for smaller samples, the t-distribution gives appropriately wider intervals.

**How do I add error bars to a ggplot2 line chart?**
Add `geom_ribbon(aes(ymin = lo, ymax = hi), alpha = 0.2)` for shaded confidence bands, or `geom_errorbar()` at each time point. Ribbons look cleaner for dense time series.

**Can I draw error bars horizontally?**
Yes, `geom_errorbarh(aes(xmin = lo, xmax = hi))` draws horizontal bars. Use when the continuous variable is on the x-axis (regression coefficients, effect sizes).

**What is width vs. linewidth in geom_errorbar()?**
`width` sets the horizontal extent of the end caps. `linewidth` sets the thickness of the vertical line. Set `width = 0` to remove caps entirely.

## References

- Wickham H. (2016). *ggplot2: Elegant Graphics for Data Analysis*. Springer.
- STHDA, ggplot2 error bars: sthda.com/english/wiki/ggplot2-error-bars
- Cumming G. et al. (2007). Error bars in experimental biology. *Journal of Cell Biology*.
- Wilke C. (2019). *Fundamentals of Data Visualization*, Chapter 16: Visualizing uncertainty

## Continue Learning

- **ggplot2 Scatter Plots**, the foundation for point-based visualizations
- **geom_smooth() in ggplot2**, add regression lines and confidence ribbons
- **R Correlation Matrix Plot**, visualize pairwise correlations with uncertainty
