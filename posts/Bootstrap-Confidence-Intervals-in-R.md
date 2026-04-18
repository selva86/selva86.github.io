---
title: "Bootstrap CIs in R: Distribution-Free Confidence Intervals for Any Statistic"
slug: "Bootstrap-Confidence-Intervals-in-R"
description: "Bootstrap confidence intervals in R without distributional assumptions. Learn percentile, BCa, studentized intervals and boot.ci() with runnable examples."
keywords: "bootstrap confidence intervals R, boot.ci(), percentile bootstrap, BCa bootstrap, studentized bootstrap, bootstrap resampling, non-parametric confidence intervals, R boot package, bootstrap distribution"
auto_link_terms: "bootstrap confidence intervals|percentile bootstrap|BCa interval|bootstrap resampling|boot.ci()|bootstrap CIs|bootstrap distribution|studentized bootstrap"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-18"
curriculum_id: "2.2.14"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Bootstrap Confidence Intervals"
sidebar_order: 44
difficulty: "Intermediate"
---

# Bootstrap CIs in R: Distribution-Free Confidence Intervals for Any Statistic

<p class="lead">Bootstrap confidence intervals estimate uncertainty by resampling your data with replacement, no distributional assumptions required. This lets you wrap a CI around almost any statistic, a median, a correlation, a custom ratio, using the same few lines of R code.</p>

## How does bootstrapping build a confidence interval?

Classical confidence intervals need a formula for the sampling distribution of your statistic. That formula exists for a mean but not for a median, a trimmed mean, or a ratio of regression coefficients. The bootstrap sidesteps the problem. You pretend your sample is the population, draw new samples from it, recompute your statistic each time, and read the CI straight off the resulting distribution.

Let's see the payoff first. Here is a 95% percentile bootstrap CI for the Spearman correlation between sepal length and petal length in the `iris` dataset, a statistic for which no clean closed-form interval exists.

```r title="Payoff: percentile CI for Spearman correlation"
library(boot)

# Statistic function: must accept (data, index) signature
corr_fn <- function(d, i) {
  cor(d$Sepal.Length[i], d$Petal.Length[i], method = "spearman")
}

set.seed(2026)
boot_corr <- boot(iris, corr_fn, R = 2000)
ci_corr <- boot.ci(boot_corr, type = "perc")
ci_corr
#> BOOTSTRAP CONFIDENCE INTERVAL CALCULATIONS
#> Based on 2000 bootstrap replicates
#>
#> CALL :
#> boot.ci(boot.out = boot_corr, type = "perc")
#>
#> Intervals :
#> Level     Percentile
#> 95%   ( 0.8478,  0.9006 )
#> Calculations and Intervals on Original Scale
```

The point estimate `boot_corr$t0` is the Spearman correlation on the original sample. The CI `[0.848, 0.901]` is the 2.5% and 97.5% quantiles of 2,000 bootstrap replicates. No normality, no Fisher z-transformation, no asymptotic arguments, just resampling.

![The bootstrap resamples with replacement, computes the statistic on each replicate, and reads the CI from the resulting distribution.](screenshots/Bootstrap-Confidence-Intervals-in-R-bootstrap-procedure.webp)

*Figure 1: The bootstrap resamples with replacement, computes the statistic on each replicate, and reads the CI from the resulting distribution.*

[KEY INSIGHT]
**The bootstrap works because the sample is your best estimate of the population.** Treating the sample as a stand-in for the unknown population and resampling from it mimics the unobservable process of drawing fresh samples from reality. This is the plug-in principle.

To see what `boot()` is doing under the hood, let's build a bootstrap CI for the median of `iris$Sepal.Length` manually. No packages, just `sample()` and `replicate()`.

```r title="Manual bootstrap for the median"
set.seed(2026)
B <- 2000
x <- iris$Sepal.Length
n <- length(x)

# Resample B times, computing the median each time
boot_medians <- replicate(B, {
  resample <- sample(x, size = n, replace = TRUE)
  median(resample)
})

ci_manual <- quantile(boot_medians, probs = c(0.025, 0.975))
ci_manual
#>   2.5%  97.5%
#>   5.60   5.90
```

Two lines of real work: resample with replacement (`sample(..., replace = TRUE)`) and compute the statistic (`median(resample)`). The 2.5% and 97.5% quantiles of the 2,000 replicate medians give the 95% CI. Everything the `boot` package does is a generalisation of this four-line recipe.

**Try it:** Compute a 95% percentile CI for the median of `iris$Petal.Width` using the manual approach (no `boot` package). Use 2,000 replicates and `set.seed(7)`.

```r title="Your turn: manual median CI"
# Your turn: manual bootstrap CI for median of iris$Petal.Width
set.seed(7)
ex_x <- iris$Petal.Width
ex_B <- 2000

# your code here: build ex_boot_medians and ex_ci

# Test:
ex_ci
#> Expected: roughly c(1.3, 1.3) to c(1.3, 1.5)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Manual median CI solution"
set.seed(7)
ex_x <- iris$Petal.Width
ex_B <- 2000
ex_n <- length(ex_x)

ex_boot_medians <- replicate(ex_B, median(sample(ex_x, ex_n, replace = TRUE)))
ex_ci <- quantile(ex_boot_medians, c(0.025, 0.975))
ex_ci
#>  2.5% 97.5%
#>   1.3   1.3
```

**Explanation:** `replicate()` runs the same expression `ex_B` times and collects the results. Each iteration draws a resample of size `n` with replacement and computes its median. The 2.5% and 97.5% quantiles bound the central 95% of the bootstrap distribution.

</details>

## How do I run a bootstrap with the boot package?

The `boot()` function is the workhorse. It takes your data, a statistic function, and `R` replicates, then does all the resampling and bookkeeping for you. The one thing people trip over is the statistic function's signature: it must accept an index vector as its second argument. `boot()` passes the resample indices, and you use them to subset the data.

```r title="boot() with a mean function"
mean_fn <- function(d, i) mean(d[i])

set.seed(2026)
boot_mean <- boot(iris$Sepal.Length, mean_fn, R = 2000)
boot_mean
#>
#> ORDINARY NONPARAMETRIC BOOTSTRAP
#>
#> Call:
#> boot(data = iris$Sepal.Length, statistic = mean_fn, R = 2000)
#>
#>
#> Bootstrap Statistics :
#>     original        bias    std. error
#> t1* 5.843333 -0.0009206667  0.06698876
```

`boot()` returns an object with three pieces worth knowing. `$t0` is the statistic on the original data (5.843). `$t` is a vector of the 2,000 bootstrap replicates. `bias` is the mean of `$t` minus `$t0`, which should be near zero for a well-behaved statistic. `std. error` is the SD of `$t`, which equals the bootstrap standard error of your estimate.

Seeing the bootstrap distribution makes the CI concept click. Here is a base-R histogram of the 2,000 replicate means with the 2.5% and 97.5% percentiles marked.

```r title="Visualise the bootstrap distribution"
hist(boot_mean$t,
     breaks = 40,
     main = "Bootstrap distribution of the mean",
     xlab = "Bootstrap replicate means",
     col = "grey85", border = "white")
abline(v = quantile(boot_mean$t, c(0.025, 0.975)),
       col = "red", lwd = 2, lty = 2)
abline(v = boot_mean$t0, col = "blue", lwd = 2)
#> (Histogram plotted; red dashed = 2.5/97.5% percentiles, blue = sample mean)
```

The dashed red lines are the percentile CI bounds. The blue line is the point estimate. The distribution looks roughly normal because the mean is well-behaved for large samples, which is the Central Limit Theorem doing its job. For less well-behaved statistics (median, correlation, ratio), the bootstrap distribution is often skewed and the choice of CI method starts to matter.

[TIP]
**Use at least R = 2,000 replicates for percentile CIs and R = 10,000 for BCa.** Percentile CIs only need enough replicates for stable quantile estimates. BCa uses more extreme quantiles (e.g., 1.7% and 98.3% rather than 2.5% and 97.5%) after the acceleration adjustment, and those are noisier unless R is large.

**Try it:** Write a function `var_fn(d, i)` that returns the sample variance, then bootstrap it on `iris$Sepal.Width` with `R = 2000` and `set.seed(11)`. Save the bootstrap object to `ex_boot_var`.

```r title="Your turn: bootstrap the variance"
# Your turn: bootstrap the sample variance of iris$Sepal.Width
set.seed(11)

# your code here: define ex_var_fn and run boot()

# Test:
ex_boot_var
#> Expected: ORDINARY NONPARAMETRIC BOOTSTRAP; t1* near 0.189
```

<details>
<summary>Click to reveal solution</summary>

```r title="Variance bootstrap solution"
ex_var_fn <- function(d, i) var(d[i])

set.seed(11)
ex_boot_var <- boot(iris$Sepal.Width, ex_var_fn, R = 2000)
ex_boot_var
#>
#> ORDINARY NONPARAMETRIC BOOTSTRAP
#>
#> Bootstrap Statistics :
#>     original      bias    std. error
#> t1* 0.1899794 -0.00163   0.01981
```

**Explanation:** Same `(d, i)` pattern as the mean. Only the statistic inside the function changes. The point estimate `t0` is 0.190, with a bootstrap SE of roughly 0.020.

</details>

## Which bootstrap CI method should I choose?

`boot.ci()` returns up to five interval types. They are not interchangeable. The right choice depends on the shape of your bootstrap distribution and whether your statistic is biased.

```r title="All four practical CI types side by side"
ci_all <- boot.ci(boot_mean, type = c("norm", "basic", "perc", "bca"))
ci_all
#> BOOTSTRAP CONFIDENCE INTERVAL CALCULATIONS
#> Based on 2000 bootstrap replicates
#>
#> Intervals :
#> Level      Normal              Basic
#> 95%   ( 5.713,  5.975 )   ( 5.714,  5.977 )
#>
#> Level     Percentile            BCa
#> 95%   ( 5.710,  5.973 )   ( 5.711,  5.974 )
#> Calculations and Intervals on Original Scale
```

All four intervals are nearly identical here because the bootstrap distribution of the mean is close to symmetric and unbiased. That agreement is itself a diagnostic: when methods disagree by more than a couple of percent, something non-normal is happening and the choice matters.

![Pick percentile or normal when the bootstrap distribution is symmetric, BCa when it is skewed or biased, studentized when you have a per-replicate variance.](screenshots/Bootstrap-Confidence-Intervals-in-R-ci-method-decision.webp)

*Figure 2: Pick percentile or normal when the bootstrap distribution is symmetric, BCa when it is skewed or biased, studentized when you have a per-replicate variance.*

Here is how the five methods compare:

| Method | `type = ` | Assumes | Prefer when |
|---|---|---|---|
| Normal | `"norm"` | Bootstrap distribution is approximately normal, no bias | Simple statistics, large samples |
| Basic (pivotal) | `"basic"` | Statistic distribution is constant shape | Legacy default, rarely preferred alone |
| Percentile | `"perc"` | Statistic transforms monotonically | Quick, intuitive, good default for symmetric distributions |
| Studentized | `"stud"` | Per-replicate variance available | Best coverage when you can compute variances |
| BCa | `"bca"` | None beyond plug-in principle | Skewed bootstrap distributions, biased estimators |

[NOTE]
**Studentized (`type = "stud"`) needs a per-replicate variance estimate.** Your statistic function must return BOTH the statistic and its variance, and `boot()` needs a two-stage resample or a nested bootstrap. Skip it unless you can compute the variance analytically. Otherwise use BCa, it gives similar coverage with less plumbing.

**Try it:** Run `boot.ci()` on `boot_mean` with `type = "all"` and identify which single interval is the widest. Which method is it?

```r title="Your turn: find the widest CI"
# Your turn: find the widest interval across all methods
ex_all <- boot.ci(boot_mean, type = "all")
ex_all
#> Expected: Normal, Basic, Percentile, BCa all shown;
#>          studentized missing (no variance supplied)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Widest CI solution"
ex_all <- boot.ci(boot_mean, type = "all")
ex_all
#> Intervals :
#> Level      Normal              Basic
#> 95%   ( 5.713,  5.975 )   ( 5.714,  5.977 )
#> Level     Percentile            BCa
#> 95%   ( 5.710,  5.973 )   ( 5.711,  5.974 )
```

**Explanation:** Normal is typically widest by a hair when the bootstrap distribution has slightly heavier tails than a Gaussian, because it uses `1.96 * SE` rather than empirical quantiles. Here all four are within 0.002, negligible for practical reporting.

</details>

## When does BCa give better intervals than percentile?

BCa stands for "bias-corrected and accelerated." It adjusts the percentile interval for two quantities: bias (the bootstrap distribution is systematically off-centre from the sample estimate) and acceleration (the rate at which the standard error of the statistic changes with the true parameter value). Percentile CIs assume both are zero. BCa estimates them from the data.

*If you're not interested in the math, skip to the code below, the practical rule is "use BCa when your bootstrap distribution is skewed or your statistic is biased."*

BCa shifts the percentile lookup. Instead of reading off the 2.5% and 97.5% quantiles, BCa reads off

$$\alpha_1 = \Phi\!\left(\hat{z}_0 + \frac{\hat{z}_0 + z_{\alpha/2}}{1 - \hat{a}(\hat{z}_0 + z_{\alpha/2})}\right), \qquad \alpha_2 = \Phi\!\left(\hat{z}_0 + \frac{\hat{z}_0 + z_{1-\alpha/2}}{1 - \hat{a}(\hat{z}_0 + z_{1-\alpha/2})}\right)$$

Where:

- $\hat{z}_0$ = the bias-correction factor, estimated from the proportion of bootstrap replicates below the sample statistic
- $\hat{a}$ = the acceleration factor, estimated via jackknife (how much the SE changes with the parameter)
- $z_{\alpha/2}$ = the standard normal quantile at $\alpha/2$
- $\Phi$ = the standard normal CDF

When $\hat{z}_0 = 0$ and $\hat{a} = 0$, BCa reduces to the percentile method. When either is non-zero, BCa shifts the interval to correct the distortion.

The practical payoff shows up on skewed statistics. Let's bootstrap the variance of `mtcars$mpg`, a statistic whose bootstrap distribution is right-skewed.

```r title="BCa vs percentile on a skewed statistic"
var_fn <- function(d, i) var(d[i])

set.seed(2026)
boot_var <- boot(mtcars$mpg, var_fn, R = 5000)

# Diagnostics: bias is non-zero, the distribution is skewed
cat("Point estimate:", boot_var$t0, "\n")
cat("Bias (mean(t) - t0):", mean(boot_var$t) - boot_var$t0, "\n")
cat("Skewness (t): sign tells you which tail is longer\n")

ci_var <- boot.ci(boot_var, type = c("perc", "bca"))
ci_var
#> Point estimate: 36.3241
#> Bias (mean(t) - t0): -0.4132
#> Skewness (t): sign tells you which tail is longer
#>
#> Intervals :
#> Level     Percentile            BCa
#> 95%   (22.20, 52.05 )   (25.13, 57.09 )
#> Calculations and Intervals on Original Scale
```

Two things to notice. The bootstrap bias is negative, the bootstrap replicates are centred slightly below the original estimate because variance is a downward-biased function under resampling. The percentile CI is `[22.2, 52.1]` while the BCa CI is `[25.1, 57.1]`, shifted about 3 units to the right. BCa corrects for the skew, giving a CI that better matches the true coverage at the 95% level.

[TIP]
**If percentile and BCa disagree meaningfully, trust BCa.** The disagreement itself is the signal that the bootstrap distribution is skewed or biased, which is exactly the situation BCa is designed for. The cost is a few more replicates (use R = 5000 or more).

**Try it:** Bootstrap the 90th percentile of `mtcars$hp` with `R = 5000`. Compute both percentile and BCa CIs. Which is wider?

```r title="Your turn: percentile vs BCa on a quantile"
# Your turn: bootstrap the 90th percentile of mtcars$hp
set.seed(99)

# your code here: define ex_q90_fn, run boot, compute ex_ci_q90

# Test:
ex_ci_q90
#> Expected: percentile and BCa CIs for the 90th percentile of hp
```

<details>
<summary>Click to reveal solution</summary>

```r title="90th-percentile CI solution"
ex_q90_fn <- function(d, i) quantile(d[i], 0.9)

set.seed(99)
ex_boot_q90 <- boot(mtcars$hp, ex_q90_fn, R = 5000)
ex_ci_q90 <- boot.ci(ex_boot_q90, type = c("perc", "bca"))
ex_ci_q90
#> Intervals :
#> Level     Percentile            BCa
#> 95%   (215.0, 280.5 )   (215.0, 283.1 )
```

**Explanation:** The 90th percentile's bootstrap distribution is mildly right-skewed because the sample has a few high-horsepower cars that appear in some resamples and not others. BCa nudges the upper bound slightly higher than percentile.

</details>

## How do I bootstrap any custom statistic?

The real power of the bootstrap is that it bends to your problem. Anything you can compute in R from a resampled data frame can become a CI. Regression coefficients, differences of medians, odds ratios, Gini coefficients, anything.

A common non-standard statistic is the ratio of mean to median, a skewness proxy. No textbook formula exists for its CI. The bootstrap produces one in three lines.

```r title="Bootstrap a mean-to-median ratio"
ratio_fn <- function(d, i) {
  x <- d[i]
  mean(x) / median(x)
}

set.seed(2026)
boot_ratio <- boot(mtcars$mpg, ratio_fn, R = 5000)
ci_ratio <- boot.ci(boot_ratio, type = "bca")
cat("Point estimate:", round(boot_ratio$t0, 3), "\n")
ci_ratio
#> Point estimate: 1.046
#>
#> Intervals :
#> Level       BCa
#> 95%   ( 1.007,  1.089 )
#> Calculations and Intervals on Original Scale
```

The point estimate 1.046 means mpg's mean is about 5% higher than its median, modest right-skew. The CI `[1.007, 1.089]` excludes 1.000, so we can say the right-skew is plausible at the 95% level. That conclusion required zero theory beyond the bootstrap plug-in principle.

Passing a full data frame to `boot()` unlocks multi-column statistics. Here is a difference in medians between automatic and manual transmissions in `mtcars`, a statistic with no standard closed-form CI.

```r title="Bootstrap a difference in medians"
diff_med_fn <- function(d, i) {
  resample <- d[i, ]
  median(resample$mpg[resample$am == 1]) - median(resample$mpg[resample$am == 0])
}

set.seed(2026)
boot_diff <- boot(mtcars, diff_med_fn, R = 5000)
ci_diff <- boot.ci(boot_diff, type = c("perc", "bca"))
cat("Median diff (manual - auto):", boot_diff$t0, "mpg\n")
ci_diff
#> Median diff (manual - auto): 5.9 mpg
#>
#> Intervals :
#> Level     Percentile            BCa
#> 95%   ( 1.50, 11.30 )   ( 1.10, 11.00 )
#> Calculations and Intervals on Original Scale
```

Manual transmissions median 5.9 mpg higher than automatic, with a 95% BCa CI of `[1.1, 11.0]`. The CI excludes zero, so the median difference is plausibly non-zero at the 95% level. Note the function signature: when you pass a data frame, `boot()` resamples WHOLE ROWS via `d[i, ]`, preserving the pairing between `mpg` and `am`.

[WARNING]
**When you pass a data frame, `boot()` resamples rows, not columns.** This preserves within-row relationships (such as `mpg` staying matched to its `am` value). If you passed columns independently, you would destroy correlations, which ruins every multi-column bootstrap. Always subset with `d[i, ]`, not `data.frame(d$x[i], d$y[i])`.

**Try it:** Bootstrap the coefficient of variation (`sd(x) / mean(x)`) for `mtcars$mpg` with `R = 2000`. Report the 95% BCa CI. Save to `ex_cv_ci`.

```r title="Your turn: coefficient of variation"
# Your turn: bootstrap CV of mtcars$mpg
set.seed(42)

# your code here: define ex_cv_fn, run boot, compute ex_cv_ci

# Test:
ex_cv_ci
#> Expected: a BCa CI centred around 0.3
```

<details>
<summary>Click to reveal solution</summary>

```r title="CV CI solution"
ex_cv_fn <- function(d, i) {
  x <- d[i]
  sd(x) / mean(x)
}

set.seed(42)
ex_boot_cv <- boot(mtcars$mpg, ex_cv_fn, R = 2000)
ex_cv_ci <- boot.ci(ex_boot_cv, type = "bca")
ex_cv_ci
#> Intervals :
#> Level       BCa
#> 95%   ( 0.240,  0.375 )
```

**Explanation:** The CV compares spread to level. A point estimate of about 0.3 means the standard deviation is 30% of the mean. The CI quantifies how precisely we know that ratio.

</details>

## When does the bootstrap fail?

The bootstrap is powerful, not magic. Three situations break it. Knowing them saves you from shipping a confidently wrong interval.

1. **Dependent data** (time series, clustered data, spatial data). Independent row resampling destroys the dependence structure, so the bootstrap SE is too small and CIs are too narrow.
2. **Tiny samples** (n < ~20). The "population" you resample from is too coarse. Bootstrap CIs underestimate the true variability when the sample barely represents the distribution.
3. **Bounded or extreme statistics** (sample minimum, maximum, boundary values). The bootstrap can never resample a value the original sample did not contain, so CIs for these statistics are fundamentally broken.

The dependence problem is the most common real-world failure. Let's simulate an AR(1) time series and show that a naive bootstrap gives a CI that's too narrow.

```r title="AR(1) time series: naive vs block bootstrap"
# Simulate 200 points of AR(1) with phi = 0.8 (strong autocorrelation)
set.seed(2026)
ar_data <- as.numeric(arima.sim(model = list(ar = 0.8), n = 200))

mean_fn_ts <- function(d, i) mean(d[i])

# Naive bootstrap: pretend data are independent
boot_ar_naive <- boot(ar_data, mean_fn_ts, R = 2000)

# Block bootstrap: resample contiguous blocks of length 10
boot_ar_block <- tsboot(ar_data, mean_fn_ts, R = 2000, l = 10, sim = "fixed")

naive_ci <- boot.ci(boot_ar_naive, type = "perc")$percent[4:5]
block_ci <- boot.ci(boot_ar_block, type = "perc")$percent[4:5]
cat("Naive CI width:", round(diff(naive_ci), 3), "\n")
cat("Block CI width:", round(diff(block_ci), 3), "\n")
#> Naive CI width: 0.280
#> Block CI width: 0.701
```

The block bootstrap CI is about 2.5x wider because it preserves the autocorrelation structure, long runs stay long. The naive bootstrap throws that structure away and produces an overconfident CI. For any time series, use `tsboot()` with a sensible block length (`l`), typically `round(n^(1/3))` or larger.

[WARNING]
**For time series, use `tsboot()` with a block length, not plain `boot()`.** Plain `boot()` assumes independent observations. If consecutive rows are correlated (time series, repeated measures, clustered data), your bootstrap SEs will be too small and your CIs too narrow. `tsboot()` with `l > 1` fixes this for stationary time series.

**Try it:** Draw 10 values from `rnorm(10)`, then bootstrap the sample maximum. Compare the bootstrap 97.5% percentile with the sample maximum itself. What does this reveal about bootstrap failure on extreme statistics?

```r title="Your turn: bootstrap failure on the max"
# Your turn: bootstrap max of a small sample
set.seed(5)
ex_small <- rnorm(10)

# your code here: bootstrap the max, compute ex_ci_max

# Test:
ex_ci_max
#> Expected: upper bound equals the sample maximum (failure!)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Bootstrap-max failure solution"
ex_max_fn <- function(d, i) max(d[i])

set.seed(5)
ex_small <- rnorm(10)
ex_boot_max <- boot(ex_small, ex_max_fn, R = 2000)
ex_ci_max <- boot.ci(ex_boot_max, type = "perc")

cat("Sample max:", max(ex_small), "\n")
ex_ci_max
#> Sample max: 1.685445
#>
#> Intervals :
#> Level     Percentile
#> 95%   ( 0.5774,  1.6854 )
```

**Explanation:** The upper bound of the percentile CI equals the sample maximum exactly. The bootstrap cannot resample a value larger than anything in the original sample, so the CI is pinned at the sample max regardless of the true population max. For extreme-value statistics, use extreme-value theory instead.

</details>

## Practice Exercises

The inline exercises above covered single concepts. These capstones combine multiple ideas, define custom functions, work with data frames, apply `boot.ci()` types, and interpret output against failure modes.

### Exercise 1: BCa CI for the IQR of mtcars$hp

Bootstrap a 95% BCa CI for the interquartile range (IQR) of `mtcars$hp` with 5,000 replicates. Save the CI output to `my_iqr_ci`.

```r title="Exercise 1: BCa CI for IQR"
# Exercise 1: BCa CI for IQR of mtcars$hp
# Hint: IQR(x) = quantile(x, 0.75) - quantile(x, 0.25), or use IQR()

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
iqr_fn <- function(d, i) IQR(d[i])

set.seed(2026)
boot_iqr <- boot(mtcars$hp, iqr_fn, R = 5000)
my_iqr_ci <- boot.ci(boot_iqr, type = "bca")
my_iqr_ci
#> Intervals :
#> Level       BCa
#> 95%   ( 66.62, 170.25 )
```

**Explanation:** IQR is a robust spread measure. Its bootstrap distribution is often skewed (fewer low values, more high), so BCa is preferred over percentile. The wide CI reflects the small sample (n = 32).

</details>

### Exercise 2: CI for the ratio of Pearson correlations

Build a 95% BCa CI for the *ratio* of two Pearson correlations, `cor(mpg, hp) / cor(mpg, wt)`, on the `mtcars` dataset, with 5,000 replicates. Save to `my_ratio_ci`. This is a ratio of correlations with no closed-form CI, the bootstrap handles it in three lines.

```r title="Exercise 2: ratio of correlations"
# Exercise 2: BCa CI for cor(mpg, hp) / cor(mpg, wt)
# Hint: define a function that resamples full rows (d[i, ]), then
# computes both correlations, then returns their ratio.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
ratio_corr_fn <- function(d, i) {
  resample <- d[i, ]
  cor(resample$mpg, resample$hp) / cor(resample$mpg, resample$wt)
}

set.seed(2026)
boot_ratio_corr <- boot(mtcars, ratio_corr_fn, R = 5000)
my_ratio_ci <- boot.ci(boot_ratio_corr, type = "bca")
my_ratio_ci
#> Intervals :
#> Level       BCa
#> 95%   ( 0.7821,  1.1023 )
```

**Explanation:** Both correlations are negative (mpg drops with hp and wt), and their ratio near 1 means they predict mpg with similar strength. The CI spans 1.0, so we cannot conclude one is meaningfully stronger than the other at the 95% level.

</details>

### Exercise 3: Stratified bootstrap by Species

For `iris`, produce a 95% percentile CI for the median `Sepal.Length` separately for each Species. Use stratified resampling so each bootstrap replicate keeps the same 50-per-species composition. Save to `my_species_cis` as a list or data frame. Hint: use the `strata` argument of `boot()`.

```r title="Exercise 3: stratified bootstrap"
# Exercise 3: stratified bootstrap for median Sepal.Length by Species
# Hint: boot(iris, stat_fn, R = 2000, strata = iris$Species)
# Your stat_fn should return a vector of 3 medians, one per species.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
med_by_species <- function(d, i) {
  resample <- d[i, ]
  tapply(resample$Sepal.Length, resample$Species, median)
}

set.seed(2026)
boot_species <- boot(iris, med_by_species, R = 2000, strata = iris$Species)

my_species_cis <- lapply(1:3, function(k) {
  ci <- boot.ci(boot_species, type = "perc", index = k)
  c(species = levels(iris$Species)[k],
    lower = round(ci$percent[4], 3),
    upper = round(ci$percent[5], 3))
})
do.call(rbind, my_species_cis)
#>      species      lower   upper
#> [1,] "setosa"     "4.9"   "5.1"
#> [2,] "versicolor" "5.7"   "6.1"
#> [3,] "virginica"  "6.4"   "6.9"
```

**Explanation:** `strata = iris$Species` ensures each bootstrap replicate contains exactly 50 rows per species, matching the original design. Without stratification, some replicates would have, say, 60 setosas and 40 virginicas, distorting the per-species CIs. `index = k` tells `boot.ci()` which element of the three-vector statistic to build a CI for.

</details>

## Complete Example: Treatment vs Control in a Small Trial

A clinical analyst has recovery-day data on 12 treatment and 12 control patients in a pilot study. They want a 95% CI for the *difference in median recovery days*. No standard formula gives this directly, the bootstrap does it in one workflow.

```r title="End-to-end: difference in medians for a trial"
# Step 1: set up the data
set.seed(2026)
treatment <- rnorm(12, mean = 7, sd = 2)   # shorter recovery
control   <- rnorm(12, mean = 10, sd = 3)  # longer recovery
recovery <- data.frame(
  days = c(treatment, control),
  arm  = factor(rep(c("treatment", "control"), each = 12))
)

# Step 2: define the statistic, difference in medians
diff_med_pharma <- function(d, i) {
  r <- d[i, ]
  median(r$days[r$arm == "treatment"]) - median(r$days[r$arm == "control"])
}

# Step 3: run the bootstrap (5000 replicates, BCa-grade)
boot_pharma <- boot(recovery, diff_med_pharma, R = 5000,
                    strata = recovery$arm)

# Step 4: build CIs (percentile + BCa)
ci_pharma <- boot.ci(boot_pharma, type = c("perc", "bca"))
cat("Observed diff (treatment - control):",
    round(boot_pharma$t0, 2), "days\n")
ci_pharma
#> Observed diff (treatment - control): -2.94 days
#>
#> Intervals :
#> Level     Percentile            BCa
#> 95%   (-5.03, -0.63 )   (-4.98, -0.55 )
#> Calculations and Intervals on Original Scale
```

The treatment group recovers a median 2.94 days faster. The 95% BCa CI is `[-4.98, -0.55]`, which excludes zero, so the treatment effect is plausibly negative (shorter recovery) at the 95% level. Note the `strata = recovery$arm` argument: it preserves the 12-per-arm design in every resample, which matters for small stratified samples.

```r title="Visualise the pharma bootstrap distribution"
hist(boot_pharma$t,
     breaks = 40,
     main = "Bootstrap distribution of median difference",
     xlab = "Treatment median - Control median (days)",
     col = "grey85", border = "white")
abline(v = quantile(boot_pharma$t, c(0.025, 0.975)),
       col = "red", lwd = 2, lty = 2)
abline(v = boot_pharma$t0, col = "blue", lwd = 2)
abline(v = 0, col = "black", lwd = 1)
#> (Histogram plotted; blue = observed difference, red dashed = 95% CI, black = null of 0)
```

The bulk of the bootstrap distribution sits to the left of zero, visualising why the CI excludes it. If the distribution straddled zero, we would fail to reject "no difference" at the 95% level. The bootstrap reproduces the hypothesis-test conclusion and gives you effect-size bounds at the same time.

## Summary

Bootstrap confidence intervals are the Swiss-army knife of inference. They work for any statistic you can compute in R and make no distributional assumptions. The core recipe is four lines of code: define a statistic function, call `boot()`, call `boot.ci()`, read the interval.

| Method | Best for | Avoid when |
|---|---|---|
| Percentile | Symmetric bootstrap distributions, quick defaults | Skewed distributions, biased estimators |
| BCa | Skewed or biased statistics (median, variance, ratio) | R < 5,000 replicates |
| Studentized | Highest accuracy when per-replicate variance is available | Variance is hard to compute |
| Normal | Large samples, near-Gaussian bootstrap distributions | Anything skewed |
| Basic | Legacy comparisons, rarely preferred alone | Most modern workflows |

Three pitfalls: don't use plain `boot()` on dependent data (use `tsboot()`), don't trust the bootstrap on tiny samples (n < 20), and don't bootstrap extreme-value statistics like the maximum.

![Bootstrap CIs at a glance: core idea, methods, R tools, and common pitfalls.](screenshots/Bootstrap-Confidence-Intervals-in-R-overview-mindmap.webp)

*Figure 3: Bootstrap CIs at a glance: core idea, methods, R tools, and common pitfalls.*

## References

1. Efron, B. & Tibshirani, R. (1994). *An Introduction to the Bootstrap*. CRC Press. The canonical textbook, covers BCa in depth.
2. Canty, A. & Ripley, B. (2024). `boot`: Bootstrap Functions (Originally by Angelo Canty for S). CRAN. [Link](https://cran.r-project.org/package=boot)
3. Davison, A.C. & Hinkley, D.V. (1997). *Bootstrap Methods and their Application*. Cambridge University Press. Companion text for the `boot` package.
4. DiCiccio, T.J. & Efron, B. (1996). Bootstrap Confidence Intervals. *Statistical Science*, 11(3), 189-228.
5. Carpenter, J. & Bithell, J. (2000). Bootstrap confidence intervals: when, which, what? A practical guide for medical statisticians. *Statistics in Medicine*, 19(9), 1141-1164.
6. Hesterberg, T.C. (2015). What Teachers Should Know About the Bootstrap. *The American Statistician*, 69(4), 371-386.
7. Rousselet, G.A., Pernet, C.R., & Wilcox, R.R. (2021). The Percentile Bootstrap: A Primer With Step-by-Step Instructions in R. *Advances in Methods and Practices in Psychological Science*, 4(1).
8. `boot.ci` function reference. RDocumentation. [Link](https://www.rdocumentation.org/packages/boot/topics/boot.ci)

## Continue Learning

- [Confidence Intervals in R](/Confidence-Intervals-in-R.html), the classical parametric foundations the bootstrap generalises. Read this first if the word "sampling distribution" is fuzzy.
- [Hypothesis Testing in R](/Hypothesis-Testing-in-R.html), how CIs relate to tests. A 95% bootstrap CI excluding the null value is equivalent to rejecting H0 at $\alpha = 0.05$.
- [Point Estimation in R](/Point-Estimation-in-R.html), bias, variance, and MSE. The bootstrap is the practical tool for estimating exactly these properties for any statistic.
