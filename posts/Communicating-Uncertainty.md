---
title: "Communicating Uncertainty: Don't Mislead Your Audience with Data Viz"
slug: "Communicating-Uncertainty"
description: "Learn to communicate uncertainty honestly in data visualization. Covers error bars, confidence intervals, p-values in charts, and misleading patterns."
keywords: "communicating uncertainty, error bars R, confidence intervals visualization, misleading charts, data visualization ethics, uncertainty visualization"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "1.6.5"
post_type: "C"
auto_link_terms: "communicating uncertainty|error bars|misleading charts|uncertainty visualization"
auto_link_case_sensitive: false
sidebar_section: "Learn R"
sidebar_title: "Communicating Uncertainty"
sidebar_order: 54
---

# Communicating Uncertainty: Don't Mislead Your Audience with Data Viz

<p class="lead">Every data point has uncertainty. When you make a chart without showing that uncertainty, you're telling your audience a lie of precision — making them think you know more than you actually do.</p>

A bar chart with no error bars implies "this is the exact value." A trend line with no confidence band implies "this is the definite trajectory." A map with sharp color boundaries implies "the line between red and blue counties is real." None of these are true. This guide teaches you to visualize data honestly — showing what you know, what you don't know, and how confident you are.

## Why Uncertainty Matters

Consider these two statements:

1. "The treatment improved outcomes by 12%."
2. "The treatment improved outcomes by 12% (95% CI: 2% to 22%, p = 0.02)."

Statement 1 sounds definitive. Statement 2 tells you the improvement could be as small as 2% or as large as 22% — a huge range. The point estimate is the same, but the message is very different.

```r
# The difference one number makes
set.seed(42)

# Two studies, same point estimate, different uncertainty
study_a <- data.frame(
  effect = 12, lower = 2, upper = 22, n = 30, label = "Study A (n=30)"
)
study_b <- data.frame(
  effect = 12, lower = 9, upper = 15, n = 500, label = "Study B (n=500)"
)

results <- rbind(study_a, study_b)

cat("=== Same Effect, Different Certainty ===\n")
cat(sprintf("%s: %.0f%% [%.0f%%, %.0f%%]\n",
    results$label, results$effect, results$lower, results$upper))
cat("\nBoth say '12% improvement' but Study B is far more precise.\n")
cat("Without CIs, you can't tell the difference.\n")
```

## Common Ways Charts Mislead

### 1. Truncated Y-Axis

```r
# Misleading vs honest bar charts
values <- c(98, 100, 99, 101, 100)
labels <- c("Mon", "Tue", "Wed", "Thu", "Fri")

par(mfrow = c(1, 2))

# Misleading: truncated axis exaggerates differences
barplot(values, names.arg = labels, main = "MISLEADING\n(truncated axis)",
        ylim = c(96, 102), col = "#e15759")

# Honest: full axis shows true scale
barplot(values, names.arg = labels, main = "HONEST\n(full axis)",
        ylim = c(0, 120), col = "#4e79a7")
```

### 2. Missing Error Bars

```r
# Bar charts: with and without error bars
set.seed(42)
group_means <- c(45, 48, 52)
group_ses <- c(5, 8, 12)  # Different precision levels
group_names <- c("Control", "Treatment A", "Treatment B")

par(mfrow = c(1, 2))

# Without error bars — misleading
bp <- barplot(group_means, names.arg = group_names,
              main = "WITHOUT Error Bars\n(looks definitive)",
              col = "#e15759", ylim = c(0, 70))

# With error bars — honest
bp <- barplot(group_means, names.arg = group_names,
              main = "WITH Error Bars\n(shows uncertainty)",
              col = "#4e79a7", ylim = c(0, 70))
arrows(bp, group_means - group_ses, bp, group_means + group_ses,
       angle = 90, code = 3, length = 0.1)
```

### 3. Cherry-Picked Time Ranges

```r
# Same data, different stories depending on date range
set.seed(42)
months <- 1:36
values <- 50 + cumsum(rnorm(36, 0.2, 3))

par(mfrow = c(1, 2))

# Cherry-picked: only show the dip
plot(months[24:36], values[24:36], type = "l", lwd = 2, col = "#e15759",
     main = "CHERRY-PICKED\n(looks like decline)",
     xlab = "Month", ylab = "Value")

# Full picture
plot(months, values, type = "l", lwd = 2, col = "#4e79a7",
     main = "FULL PICTURE\n(clear upward trend)",
     xlab = "Month", ylab = "Value")
```

## How to Show Uncertainty in R

### Error Bars on Bar Charts

```r
# Proper error bars: SE vs SD vs CI
set.seed(42)
n <- 30
data_a <- rnorm(n, 50, 10)
data_b <- rnorm(n, 55, 10)

mean_a <- mean(data_a); mean_b <- mean(data_b)
se_a <- sd(data_a)/sqrt(n); se_b <- sd(data_b)/sqrt(n)

# Using 95% CI (±1.96 SE)
ci_a <- 1.96 * se_a; ci_b <- 1.96 * se_b

means <- c(mean_a, mean_b)
cis <- c(ci_a, ci_b)

bp <- barplot(means, names.arg = c("Group A", "Group B"),
              main = "Group Comparison with 95% CI",
              col = c("#4e79a7", "#f28e2b"), ylim = c(0, 75))
arrows(bp, means - cis, bp, means + cis,
       angle = 90, code = 3, length = 0.15, lwd = 2)

# Always label what the error bars represent!
legend("topleft", "Error bars = 95% CI", bty = "n", cex = 0.9)
```

### Confidence Bands on Lines

```r
# Regression with confidence band
x <- mtcars$wt
y <- mtcars$mpg
model <- lm(y ~ x)

# Predict with confidence interval
new_x <- data.frame(x = seq(min(x), max(x), length.out = 100))
pred <- predict(model, new_x, interval = "confidence", level = 0.95)

plot(x, y, pch = 19, col = "#4e79a7",
     main = "MPG vs Weight with 95% Confidence Band",
     xlab = "Weight (1000 lbs)", ylab = "MPG")
lines(new_x$x, pred[,"fit"], col = "#e15759", lwd = 2)
polygon(c(new_x$x, rev(new_x$x)),
        c(pred[,"lwr"], rev(pred[,"upr"])),
        col = rgb(0.88, 0.34, 0.35, 0.2), border = NA)
legend("topright", c("Data", "Fit", "95% CI"),
       pch = c(19, NA, 15), lty = c(NA, 1, NA),
       col = c("#4e79a7", "#e15759", rgb(0.88,0.34,0.35,0.3)), bty = "n")
```

### Reporting P-Values in Visualizations

```r
# Don't just put stars — show the actual values
set.seed(42)
g1 <- rnorm(25, 10, 3)
g2 <- rnorm(25, 12, 3)
g3 <- rnorm(25, 11, 3)

test_12 <- t.test(g1, g2)
test_13 <- t.test(g1, g3)
test_23 <- t.test(g2, g3)

cat("=== Reporting Comparisons ===\n")
cat(sprintf("G1 vs G2: diff = %.1f, 95%% CI [%.1f, %.1f], p = %.3f\n",
    diff(test_12$estimate), test_12$conf.int[1], test_12$conf.int[2], test_12$p.value))
cat(sprintf("G1 vs G3: diff = %.1f, 95%% CI [%.1f, %.1f], p = %.3f\n",
    diff(test_13$estimate), test_13$conf.int[1], test_13$conf.int[2], test_13$p.value))
cat(sprintf("G2 vs G3: diff = %.1f, 95%% CI [%.1f, %.1f], p = %.3f\n",
    diff(test_23$estimate), test_23$conf.int[1], test_23$conf.int[2], test_23$p.value))
cat("\nAlways report: effect size, CI, AND p-value. Never just stars (**).\n")
```

## The Error Bar Confusion

Not all error bars are the same. Label yours clearly.

| Error Bar Type | Formula | Interpretation |
|---------------|---------|---------------|
| Standard Deviation (SD) | `sd(x)` | Shows spread of raw data |
| Standard Error (SE) | `sd(x)/sqrt(n)` | Shows precision of the mean |
| 95% Confidence Interval | `mean ± 1.96*SE` | 95% likely range for true mean |
| Interquartile Range (IQR) | `Q3 - Q1` | Middle 50% of data |

```r
# Same data, four different "error bars"
set.seed(42)
x <- rnorm(50, mean = 100, sd = 15)

m <- mean(x)
s <- sd(x)
se <- s / sqrt(length(x))
ci <- 1.96 * se
iqr_vals <- quantile(x, c(0.25, 0.75))

cat("=== Same Data, Different Measures ===\n")
cat(sprintf("Mean:               %.1f\n", m))
cat(sprintf("Mean ± SD:          %.1f to %.1f (range: %.1f)\n", m-s, m+s, 2*s))
cat(sprintf("Mean ± SE:          %.1f to %.1f (range: %.1f)\n", m-se, m+se, 2*se))
cat(sprintf("Mean ± 95%% CI:      %.1f to %.1f (range: %.1f)\n", m-ci, m+ci, 2*ci))
cat(sprintf("IQR:                %.1f to %.1f (range: %.1f)\n", iqr_vals[1], iqr_vals[2],
    diff(iqr_vals)))
cat("\nSD bars are ~7x wider than CI bars. Always say which you're showing!\n")
```

## Exercises

### Exercise 1: Spot the Misleading Chart

A news article shows a line chart of crime rates from 2020-2026 with a y-axis starting at 450 (actual range: 452-468). Is this misleading?

```r
cat("=== Answer ===\n")
cat("Yes, this is potentially misleading.\n")
cat("Range of 452-468 on a base of ~460 means a variation of ~3.5%.\n")
cat("A truncated y-axis makes this look like a dramatic swing.\n\n")
cat("Better approach:\n")
cat("1. Show full y-axis (0-500) for absolute perspective\n")
cat("2. OR explicitly label the axis break and note the scale\n")
cat("3. OR show percent change instead of raw values\n")
cat("4. Add context: is 3.5% variation meaningful or normal noise?\n")
```

### Exercise 2: Add Uncertainty to This Chart

Given three group means (A=25, B=30, C=28) and standard errors (2.1, 3.5, 1.8), create a bar chart with proper error bars.

```r
means <- c(25, 30, 28)
ses <- c(2.1, 3.5, 1.8)
groups <- c("A", "B", "C")
cis <- 1.96 * ses  # 95% CI

bp <- barplot(means, names.arg = groups, col = c("#4e79a7","#f28e2b","#59a14f"),
              ylim = c(0, 40), main = "Group Means with 95% CI",
              ylab = "Score")
arrows(bp, means - cis, bp, means + cis,
       angle = 90, code = 3, length = 0.15, lwd = 2)
text(bp, means + cis + 1.5,
     sprintf("%.1f\n[%.1f, %.1f]", means, means-cis, means+cis),
     cex = 0.8)
```

## Summary

| Misleading Practice | Why It's Wrong | How to Fix |
|--------------------|---------------|-----------|
| No error bars | Hides uncertainty | Add SE, SD, or CI bars (labeled) |
| Truncated y-axis | Exaggerates differences | Start at 0 or label the break |
| Cherry-picked dates | Tells a partial story | Show full timeline with context |
| Stars instead of p-values | Loss of information | Report exact p, CI, and effect size |
| Pie charts for comparison | Hard to compare angles | Use bar or dot charts instead |
| Dual y-axes | Implies false correlation | Use separate panels |

## FAQ

**When should I use SD versus SE for error bars?**
Use SD when you want to show the variability of the raw data (how spread out individual values are). Use SE or CI when you want to show precision of an estimate (how confident you are in the mean). In most scientific papers, 95% CI is preferred.

**Are bar charts always bad for showing means?**
Not always, but dot plots or box plots are usually better. Bar charts hide the distribution — a mean of 50 could come from data clustered at 50 or from half the data at 0 and half at 100. Box plots show the distribution directly.

**How do I show uncertainty in maps or spatial data?**
Use graduated colors with explicit legends showing the margin of error. Small-area estimates (like county-level) often have wide confidence intervals. Some cartographers use hatching or transparency to indicate uncertainty regions.

## Continue Learning
- [Data Ethics in R](Data-Ethics-in-R.html) — The broader ethical framework for analysis
- [Bias in Data & Models](Bias-in-Data-and-Models.html) — Detecting bias before it reaches your charts
- [Reproducibility Crisis](Reproducibility-Crisis.html) — Why honest reporting matters for science
