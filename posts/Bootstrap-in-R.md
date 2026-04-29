---
title: "Bootstrap in R: boot Package, CI & Hypothesis Tests Without Assumptions"
slug: "Bootstrap-in-R"
description: "Bootstrap in R with the boot package: confidence intervals and hypothesis tests without distributional assumptions. Runnable BCa, percentile, basic examples."
keywords: "bootstrap in R, boot package R, bootstrap confidence interval, BCa interval, percentile bootstrap, bootstrap hypothesis test, nonparametric inference, resampling R"
auto_link_terms: "bootstrap in R|boot package|bootstrap confidence interval|BCa interval|percentile bootstrap|bootstrap hypothesis test|resampling in R"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-29"
curriculum_id: "2.8.7"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Bootstrap (boot package)"
sidebar_order: 90
difficulty: "Intermediate"
---

# Bootstrap in R: boot Package, CI & Hypothesis Tests Without Assumptions

<p class="lead">The bootstrap resamples your data with replacement to estimate confidence intervals and run hypothesis tests without assuming a normal distribution. The <code>boot</code> package in R turns the workflow into two calls: <code>boot()</code> to generate replicates and <code>boot.ci()</code> to extract BCa, percentile, basic, or normal intervals.</p>

## How do you bootstrap in R with the boot package?

The fastest way to see the bootstrap in action is to compute a 95% CI for a statistic that has no clean textbook formula. The median of a small sample fits: there is no closed-form CI, and its sampling distribution is rarely normal. Here is the entire bootstrap pipeline for the median MPG in `mtcars`.

The pattern is always the same: define a statistic function that takes data and an index vector, hand it to `boot()`, then pass the result to `boot.ci()`.

```r title="First bootstrap CI for median MPG"
library(boot)
set.seed(42)

median_stat <- function(d, i) median(d[i])
boot_out <- boot(data = mtcars$mpg, statistic = median_stat, R = 2000)

boot.ci(boot_out, type = c("perc", "bca"))
#> BOOTSTRAP CONFIDENCE INTERVAL CALCULATIONS
#> Based on 2000 bootstrap replicates
#>
#> Intervals :
#> Level     Percentile            BCa
#> 95%   (16.40, 21.40)   (16.40, 22.05)
```

Two thousand resamples produced two 95% intervals for the median. The percentile CI runs from 16.4 to 21.4 MPG. The BCa CI runs slightly wider on the upper end (22.05) because BCa adjusts for skewness in the bootstrap distribution. Both agree the true population median plausibly sits in this range, and you got there without a single distributional assumption.

[TIP]
**Always set a seed before `boot()`.** Two `boot()` calls with the same seed produce identical replicates, which means your CIs are reproducible across reviewers and across re-runs. Pick a fresh integer for each major example so you do not silently reuse the same random pattern.

The `statistic` function has a strict signature: first argument is the data, second is an integer index vector. Inside the function, `d[i]` (for vectors) or `d[i, ]` (for data frames) builds the bootstrap sample. `boot()` calls your function `R` times with random indices and stores every replicate in `boot_out$t`.

**Try it:** Write a function `ex_mean_stat()` that returns the mean instead of the median, then bootstrap a 95% percentile CI for the mean MPG. Use 1000 replicates and seed `123`.

```r title="Your turn: bootstrap a CI for the mean"
# Try it: bootstrap a CI for the mean MPG
ex_mean_stat <- function(d, i) {
  # your code here
}

set.seed(123)
ex_boot <- boot(mtcars$mpg, ex_mean_stat, R = 1000)
boot.ci(ex_boot, type = "perc")
#> Expected: a 95% CI roughly (18.0, 22.3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Mean MPG bootstrap solution"
ex_mean_stat <- function(d, i) mean(d[i])

set.seed(123)
ex_boot <- boot(mtcars$mpg, ex_mean_stat, R = 1000)
boot.ci(ex_boot, type = "perc")
#> Level     Percentile
#> 95%   (18.04, 22.27)
```

**Explanation:** Replacing `median` with `mean` is the only change. Every other line stays the same, which is the whole point of the boot package: the workflow is statistic-agnostic.

</details>

## Why does bootstrap work without distributional assumptions?

Classical confidence intervals lean on a formula like $\bar{x} \pm 1.96 \cdot s/\sqrt{n}$. That formula is correct only if the sampling distribution of the mean is approximately normal, which itself requires assumptions about the population or a sufficiently large sample. The bootstrap sidesteps that machinery by replacing "what would the population look like?" with "the sample is the best guess we have for the population."

Mathematically, the bootstrap uses the **empirical distribution function**, the discrete distribution that puts probability $1/n$ on each observed data point. Sampling with replacement from your data is sampling from that empirical distribution. As $n$ grows, it converges to the true population, so resampled statistics converge to true sampling statistics.

$$\hat{F}_n(x) = \frac{1}{n} \sum_{i=1}^{n} \mathbb{1}\{x_i \leq x\}$$

Where:

- $\hat{F}_n(x)$ = the empirical distribution function evaluated at $x$
- $n$ = sample size
- $\mathbb{1}\{x_i \leq x\}$ = an indicator that is 1 if $x_i \leq x$, else 0

If you are not interested in the math, skip to the next paragraph. The practical takeaway is unchanged: every replicate is a "what could my sample have looked like?" scenario, and the spread of replicates is the spread of the statistic.

![How the bootstrap turns one sample into an inference](screenshots/Bootstrap-in-R-resampling-flow.webp)
*Figure 1: The bootstrap resamples one observed sample many times to build a distribution of any statistic.*

The bootstrap distribution is just the histogram of `boot_out$t`. Plotting it tells you the shape of the sampling distribution, the centre (your point estimate), and the spread (the standard error).

```r title="Visualise the bootstrap distribution"
hist(boot_out$t,
     breaks = 30,
     col = "steelblue",
     border = "white",
     main = "Bootstrap distribution of median(mpg)",
     xlab = "Bootstrap median MPG")
abline(v = median(mtcars$mpg), col = "red", lwd = 2)
#> Histogram with a peak near 19, the red vertical at the observed median
```

The peak of the histogram lines up with the observed median (red line), confirming the bootstrap is unbiased on average. The width of the histogram is the bootstrap standard error: roughly the standard deviation of the replicates. If you saw a wildly skewed shape or two distinct modes, you would know that a normal-based CI would be wrong here, even before computing the interval.

[KEY INSIGHT]
**The bootstrap replaces "trust the formula" with "trust the data."** Classical CIs require the sampling distribution to be approximately normal; the bootstrap simulates the sampling distribution from the data itself. The trade-off is computation time, which is cheap, against assumptions, which are expensive when wrong.

**Try it:** The bootstrap standard error is just the standard deviation of replicates. Compute it two ways and check they agree: with `sd(boot_out$t)` and by reading the `std. error` printed by `boot_out`.

```r title="Your turn: two views of the bootstrap SE"
# Try it: SE from sd() of replicates
ex_se_manual <- # your code here

# Compare to:
boot_out
#> Expected: ex_se_manual matches the std. error printed by boot_out
```

<details>
<summary>Click to reveal solution</summary>

```r title="Bootstrap SE solution"
ex_se_manual <- sd(boot_out$t)
ex_se_manual
#> [1] 1.412

print(boot_out)
#> Bootstrap Statistics :
#>     original    bias    std. error
#> t1*     19.2  0.0723        1.412
```

**Explanation:** `boot_out$t` is the matrix of replicates. Its column standard deviation is the bootstrap SE that `boot_out` prints. Two views, same number.

</details>

## Which bootstrap confidence interval should you use?

The boot package offers five interval types: percentile, basic, normal, BCa, and studentized. The first four are one-line calls; studentized needs an extra variance estimate per replicate. For most applied work, the choice narrows to BCa or percentile.

![Which bootstrap CI should you pick?](screenshots/Bootstrap-in-R-ci-decision.webp)
*Figure 2: A quick decision rule for picking the right `boot.ci()` type.*

Asking for all four at once is a quick way to compare them on the same data. A large gap between them is a warning that one or more is misbehaving.

```r title="Compare four CI types side by side"
ci_all <- boot.ci(boot_out, type = c("norm", "basic", "perc", "bca"))
ci_all
#> Intervals :
#> Level      Normal              Basic
#> 95%   (16.36, 21.91 )   (16.40, 21.40 )
#>
#> Level     Percentile            BCa
#> 95%   (16.40, 21.40 )   (16.40, 22.05 )
```

Three of the four CIs share their lower bound (16.4) because the bootstrap distribution of the median has a hard floor near that value. Their upper bounds differ: BCa stretches to 22.05 while percentile and basic stop at 21.40. BCa is doing what it was designed for, correcting for the asymmetric tail of the distribution. The Normal CI extends below 16.40, which is impossible since the percentile bound is 16.40, signalling that a Gaussian approximation does not fit this distribution.

[TIP]
**Default to BCa unless you have a reason not to.** BCa adjusts for both bias and skewness and is recommended by Davison & Hinkley as the all-purpose CI. Percentile is fine when the bootstrap distribution looks symmetric; Normal is fastest but assumes symmetry; Basic is rarely the best choice but works as a sanity check.

You can also pull out just the BCa interval as a numeric vector. The `bca` element holds the level, the bootstrap quantile indices, and the lower and upper bounds in its last two columns.

**Try it:** Extract the lower and upper BCa bounds from `ci_all` as a length-2 numeric vector named `ex_bca`.

```r title="Your turn: extract BCa bounds"
# Try it: pull out just the BCa bounds
ex_bca <- # your code here
ex_bca
#> Expected: c(16.4, 22.05) (or similar)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Extract BCa bounds solution"
ex_bca <- ci_all$bca[1, 4:5]
ex_bca
#> [1] 16.40 22.05
```

**Explanation:** `ci_all$bca` is a 1x5 matrix. Columns 4 and 5 are the lower and upper bounds. Other CI types live in `$normal`, `$basic`, and `$percent`.

</details>

## How do you run a bootstrap hypothesis test in R?

There are two common routes. The CI route is the simplest: bootstrap a CI for the test statistic and reject the null at level $\alpha$ if the null value falls outside the $1-\alpha$ CI. The shift route is more direct: simulate replicates that satisfy the null, then count how often they are at least as extreme as the observed statistic.

The CI route shines for "is the mean of group A different from group B?" questions. Bootstrap a CI for the difference in means; if zero is outside the CI, reject the null of equal means.

```r title="Bootstrap CI for the difference in means"
mpg_diff <- function(d, i) {
  s <- d[i, ]
  mean(s$mpg[s$cyl == 4]) - mean(s$mpg[s$cyl == 6])
}

data4_6 <- subset(mtcars, cyl %in% c(4, 6))
set.seed(7)
boot_diff <- boot(data4_6, mpg_diff, R = 2000)

boot.ci(boot_diff, type = "bca")
#> Level            BCa
#> 95%   ( 4.74,  9.83 )
```

The 95% BCa CI for the difference in mean MPG (4-cyl minus 6-cyl) runs from 4.74 to 9.83. Zero is far outside. We reject the null that the two cylinder groups have the same mean MPG, with the same conclusion you would get from a t-test, but without the equal-variance or normality assumption.

The shift route gives you a proper bootstrap p-value. Centre the replicates so their mean is zero (the null), then count how many of them are at least as far from zero as the observed difference.

```r title="Bootstrap p-value via shifted replicates"
obs_diff <- boot_diff$t0
centered <- boot_diff$t - mean(boot_diff$t)
pval <- mean(abs(centered) >= abs(obs_diff))

pval
#> [1] 0
```

The two-sided p-value is effectively zero, again rejecting the null. This is the same logic as a permutation test: build a distribution under H0 and ask how surprising the data are. The CI route asks the dual question, "is the null inside the plausible range?", and gives the same answer when the test is well-defined.

[WARNING]
**A bootstrap CI is not a permutation test.** The CI route asks "could the true value be 0?". The shift route asks "how often would I see a value this extreme if the true value were 0?". Both lead to the same accept/reject decision in symmetric cases, but the shift route is the one to report when you need a p-value.

**Try it:** Repeat the analysis using the difference in **medians** instead of means. Define `ex_med_diff()`, bootstrap with `R = 2000` and seed `9`, then print the BCa CI.

```r title="Your turn: difference in medians"
# Try it: replace mean with median
ex_med_diff <- function(d, i) {
  s <- d[i, ]
  # your code here
}

set.seed(9)
ex_boot_med <- boot(data4_6, ex_med_diff, R = 2000)
boot.ci(ex_boot_med, type = "bca")
#> Expected: BCa CI well above zero, similar to the mean version
```

<details>
<summary>Click to reveal solution</summary>

```r title="Difference in medians solution"
ex_med_diff <- function(d, i) {
  s <- d[i, ]
  median(s$mpg[s$cyl == 4]) - median(s$mpg[s$cyl == 6])
}

set.seed(9)
ex_boot_med <- boot(data4_6, ex_med_diff, R = 2000)
boot.ci(ex_boot_med, type = "bca")
#> Level            BCa
#> 95%   ( 4.10,  8.85 )
```

**Explanation:** Swapping `mean` for `median` gives a robust difference. The CI shifts slightly but the conclusion (reject H0) is unchanged.

</details>

## When does bootstrap fail and how do you spot it?

The bootstrap is not magic. Three failure modes show up often enough that you should know what they look like.

The first is **tiny samples**. With $n < 10$, there are very few distinct resamples and the bootstrap distribution becomes blocky and unreliable. The CI you get back is overconfident.

The second is **boundary statistics**. The maximum, minimum, and other extremes have a sampling distribution that piles up against the observed value. Bootstrap mimics this pile-up and underestimates the true uncertainty.

```r title="Boundary stat failure: bootstrap of max"
set.seed(1)
x_unif <- runif(50, 0, 100)
max_stat <- function(d, i) max(d[i])

boot_max <- boot(x_unif, max_stat, R = 2000)

hist(boot_max$t,
     breaks = 30,
     col = "indianred",
     border = "white",
     main = "Bootstrap distribution of max",
     xlab = "Bootstrap max")
abline(v = max(x_unif), col = "blue", lwd = 2)
#> Histogram with a tall spike at the observed max (blue line)
#> and a thin tail to the left
```

The histogram is a single spike at the observed maximum with a sparse tail to its left. The bootstrap can never produce a value larger than the observed maximum, because the maximum of a resample with replacement cannot exceed the original maximum. So the upper tail is zero by construction, and any CI would be misleading. For boundary statistics, look at parametric methods or order-statistic theory instead.

The third is **dependent data**. If your observations are a time series, ordinary bootstrap destroys the autocorrelation. Use `tsboot()` from the same package with the block bootstrap (`sim = "fixed"` or `"geom"`) to preserve local dependence.

[NOTE]
**Use `tsboot()` for time series.** It resamples blocks of consecutive observations rather than single points, preserving short-range autocorrelation. Pick the block length with care; too short loses dependence, too long reduces effective replicates.

**Try it:** Reduce `x_unif` to 10 observations and re-run the max bootstrap. Confirm visually that the distribution is now nearly degenerate.

```r title="Your turn: bootstrap max with tiny n"
# Try it: same code, smaller n
set.seed(2)
ex_x <- runif(10, 0, 100)

ex_boot_max <- boot(ex_x, max_stat, R = 2000)

hist(ex_boot_max$t, breaks = 30, col = "indianred", border = "white",
     main = "Bootstrap max, n = 10",
     xlab = "Bootstrap max")
#> Expected: an even more concentrated spike with very few distinct values
```

<details>
<summary>Click to reveal solution</summary>

```r title="Tiny-n bootstrap max solution"
set.seed(2)
ex_x <- runif(10, 0, 100)

ex_boot_max <- boot(ex_x, max_stat, R = 2000)

length(unique(ex_boot_max$t))
#> [1] 10

hist(ex_boot_max$t, breaks = 30, col = "indianred", border = "white",
     main = "Bootstrap max, n = 10",
     xlab = "Bootstrap max")
```

**Explanation:** With only 10 distinct data points, the bootstrap max can take only 10 distinct values. The histogram is a barcode rather than a smooth distribution. No CI from this is trustworthy.

</details>

## How do you run a stratified bootstrap?

When the data has groups and you want each replicate to preserve group sizes, pass a `strata` vector to `boot()`. This is essential when groups have very different sizes or behaviours and you do not want bootstrap replicates that accidentally drop one group.

The example below estimates the ratio of mean MPG between automatic (`am = 1`) and manual (`am = 0`) cars in `mtcars`, with `strata = mtcars$am` so each replicate keeps the original 13 automatic and 19 manual cars.

```r title="Stratified bootstrap of a ratio"
ratio_stat <- function(d, i) {
  s <- d[i, ]
  mean(s$mpg[s$am == 1]) / mean(s$mpg[s$am == 0])
}

set.seed(11)
boot_strat <- boot(mtcars, ratio_stat, R = 2000, strata = mtcars$am)
boot.ci(boot_strat, type = "bca")
#> Level            BCa
#> 95%   ( 1.13,  1.62 )
```

The 95% BCa CI for the ratio runs from 1.13 to 1.62. Because the entire CI is above 1, automatic-transmission cars get more MPG on average than manual-transmission ones in this dataset, by a factor of 13% to 62%. Without `strata`, some replicates would have very few automatic cars, inflating the variance and the CI width.

**Try it:** Re-run the same analysis without `strata` and compare the BCa CI width. The unstratified CI should be wider.

```r title="Your turn: unstratified version for comparison"
# Try it: drop the strata argument
set.seed(11)
ex_boot_unstrat <- boot(mtcars, ratio_stat, R = 2000)
boot.ci(ex_boot_unstrat, type = "bca")
#> Expected: a slightly wider BCa CI than the stratified version
```

<details>
<summary>Click to reveal solution</summary>

```r title="Unstratified ratio solution"
set.seed(11)
ex_boot_unstrat <- boot(mtcars, ratio_stat, R = 2000)
boot.ci(ex_boot_unstrat, type = "bca")
#> Level            BCa
#> 95%   ( 1.10,  1.66 )
```

**Explanation:** Without stratification, replicates can have unbalanced group sizes, bumping the bootstrap variance up. The CI is a touch wider, and in extreme cases would be much wider, which is why stratifying matters when groups are small.

</details>

## Practice Exercises

### Exercise 1: Bootstrap a regression slope

Bootstrap a 95% BCa CI for the slope of `lm(mpg ~ wt, data = mtcars)`. Save the boot result to `my_boot_slope` and print the BCa interval.

```r title="Practice: regression slope CI"
# Bootstrap a CI for the slope of mpg on wt
# Hint: define a statistic that fits an lm and returns coef()[2]

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Regression slope solution"
slope_stat <- function(d, i) coef(lm(mpg ~ wt, data = d[i, ]))[2]

set.seed(101)
my_boot_slope <- boot(mtcars, slope_stat, R = 2000)

boot.ci(my_boot_slope, type = "bca")
#> Level            BCa
#> 95%   (-7.36, -3.85 )
```

**Explanation:** Each replicate refits the regression on a resample and pulls out the slope. The BCa CI for the slope is well below zero, confirming that heavier cars have lower MPG with strong evidence.

</details>

### Exercise 2: Bootstrap p-value for "median equals 20"

Compute a two-sided bootstrap p-value for the null that the median of `mtcars$mpg` equals 20. Centre the replicates around 20 and count how often the centred replicates are at least as far from 20 as the observed median is.

```r title="Practice: bootstrap p-value for median = 20"
# Bootstrap a p-value for H0: median(mpg) == 20
# Hint: use boot_out from earlier; centre to 20, not to 0

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Median p-value solution"
my_obs_med <- median(mtcars$mpg)
my_centered <- boot_out$t - mean(boot_out$t) + 20

my_pval <- mean(abs(my_centered - 20) >= abs(my_obs_med - 20))
my_pval
#> [1] 0.62
```

**Explanation:** Shift the replicates so they are centred at 20 (the null value), then ask how often a centred replicate is at least as extreme as the observed median (19.2). The p-value is large, so we fail to reject H0: the data are consistent with a median of 20.

</details>

## Complete Example

A common applied use case is reporting a 95% CI for a regression coefficient when you do not trust the residual normality. Here is the full pipeline applied to the slope of `mpg ~ wt`. The code is one block: define statistic, run `boot()`, extract BCa CI, and visualise.

```r title="End-to-end: bootstrap CI for an lm slope"
# 1. Define the statistic: slope from a linear model
slope_stat <- function(d, i) {
  fit <- lm(mpg ~ wt, data = d[i, ])
  coef(fit)[2]
}

# 2. Bootstrap with 2000 replicates
set.seed(2026)
boot_slope <- boot(mtcars, slope_stat, R = 2000)

# 3. Get a BCa interval
boot.ci(boot_slope, type = "bca")
#> Level            BCa
#> 95%   (-7.42, -3.81 )

# 4. Visualise the bootstrap distribution
hist(boot_slope$t, breaks = 30, col = "darkolivegreen3", border = "white",
     main = "Bootstrap distribution of slope (mpg ~ wt)",
     xlab = "Slope estimate")
abline(v = boot_slope$t0, col = "red", lwd = 2)
#> Roughly bell-shaped histogram, red line at the observed slope around -5.34
```

The 95% BCa CI for the slope is $(-7.42, -3.81)$. In plain English, every extra 1000 lbs of car weight is associated with a drop of between 3.81 and 7.42 MPG, with 95% confidence. Because the entire interval is below zero, the relationship is unambiguous and the conclusion does not depend on Gaussian residual assumptions.

## Summary

![Bootstrap in R at a glance](screenshots/Bootstrap-in-R-overview-mindmap.webp)
*Figure 3: Bootstrap in R at a glance: workflow, CI types, uses, and pitfalls.*

| Function | Purpose | Returns |
|---|---|---|
| `boot()` | Resample data and compute a statistic R times | A `boot` object with `$t` (replicates) and `$t0` (observed) |
| `boot.ci()` | Extract intervals from a `boot` object | Object with `$normal`, `$basic`, `$percent`, `$bca` |
| `tsboot()` | Block bootstrap for dependent data | A `boot` object preserving local dependence |
| `strata` argument | Preserve group sizes in each replicate | Stratified resampling within `boot()` |

Three rules of thumb to remember:

1. Default to BCa intervals when in doubt; they correct for bias and skew.
2. Always set a seed and use `R >= 1000` for stable CIs (`R >= 5000` for p-values).
3. Skip the bootstrap for boundary statistics (max, min) and dependent data without blocks.

## References

1. Efron, B. (1979). *Bootstrap Methods: Another Look at the Jackknife*. Annals of Statistics, 7(1). [Link](https://projecteuclid.org/journals/annals-of-statistics/volume-7/issue-1/Bootstrap-Methods-Another-Look-at-the-Jackknife/10.1214/aos/1176344552.full)
2. Davison, A. C. & Hinkley, D. V. (1997). *Bootstrap Methods and Their Application*. Cambridge University Press. [Link](https://www.cambridge.org/core/books/bootstrap-methods-and-their-application/ED2FD043579F27952363566DC09CBD6A)
3. Canty, A. & Ripley, B. *boot: Bootstrap Functions* (R package). CRAN. [Link](https://cran.r-project.org/web/packages/boot/index.html)
4. R Core Team. `boot.ci` reference manual. [Link](https://stat.ethz.ch/R-manual/R-devel/library/boot/html/boot.ci.html)
5. Wickham, H. *Advanced R*, 2nd Edition. CRC Press (2019). Chapter 24 on performance discusses bootstrap implementation choices. [Link](https://adv-r.hadley.nz/)
6. UCLA OARC Statistical Consulting. *How can I generate bootstrap statistics in R?* [Link](https://stats.oarc.ucla.edu/r/faq/how-can-i-generate-bootstrap-statistics-in-r/)
7. Hesterberg, T. (2015). *What Teachers Should Know About the Bootstrap*. The American Statistician, 69(4). [Link](https://www.tandfonline.com/doi/full/10.1080/00031305.2015.1089789)

## Continue Learning

1. [Bootstrap Confidence Intervals in R](Bootstrap-Confidence-Intervals-in-R.html) for a deeper dive on the four CI types and when each one beats the others.
2. [When to Use Nonparametric Tests in R](When-to-Use-Nonparametric-Tests-in-R.html), the sibling lesson on choosing nonparametric methods over t-tests and ANOVA.
3. [Confidence Intervals in R](Confidence-Intervals-in-R.html) for the parametric counterpart and a side-by-side comparison with bootstrap CIs.
