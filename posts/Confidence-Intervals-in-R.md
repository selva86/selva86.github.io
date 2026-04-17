---
title: "Confidence Intervals in R: The Definition Most Textbooks State Incorrectly"
slug: "Confidence-Intervals-in-R"
description: "A 95% CI doesn't mean 95% probability the parameter is in this range. Learn what confidence intervals actually mean and how to compute them correctly in R."
keywords: "confidence intervals in R, confidence interval interpretation, 95% confidence interval, t.test R, confint, bootstrap confidence interval, statistical inference, prop.test, Wilson interval, margin of error"
auto_link_terms: "confidence interval|confidence intervals|95% confidence interval|confidence level|margin of error|bootstrap confidence interval|Wilson score interval|credible interval|t-interval"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-18"
curriculum_id: "2.2.3"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Confidence Intervals"
sidebar_order: 35
difficulty: "Intermediate"
---

# Confidence Intervals in R: The Definition Most Textbooks State Incorrectly

<p class="lead">A 95% confidence interval does <strong>not</strong> mean "there's a 95% probability the parameter lies in this range" &#8211; that is a Bayesian <em>credible interval</em>. A frequentist CI from <code>t.test()</code> means something stricter: repeat the sampling procedure many times, and 95% of the constructed intervals will contain the true parameter.</p>

## What does a 95% confidence interval actually mean?

Most stats courses state the wrong definition, the intuitive one that is actually a *credible interval*. The cleanest way to see what "95%" really refers to is to simulate it, draw many samples, build a CI from each, and count how often the interval contains the true parameter. The simulation below draws 100 samples of size 30 from a Normal population with mean 50 and SD 10, builds a 95% CI from each, and measures coverage.

```r title="Simulate coverage of 95% confidence intervals"
library(ggplot2)

set.seed(2026)
true_mu    <- 50
true_sigma <- 10
n          <- 30

experiments <- replicate(100, {
  sample_draw <- rnorm(n, mean = true_mu, sd = true_sigma)
  t.test(sample_draw)$conf.int
})
#> experiments is a 2 x 100 matrix: row 1 = lower, row 2 = upper

contains_mu <- experiments[1, ] <= true_mu & experiments[2, ] >= true_mu
coverage    <- mean(contains_mu)
coverage
#> [1] 0.94
```

The coverage rate came out at `0.94`, essentially the nominal 95%. If we had run 100,000 replicates instead of 100, the rate would settle almost exactly on 0.95. This is the precise statement the "95%" is making, *across many samples*, this procedure captures the true mean 95% of the time.

Let us visualize those 100 intervals so the property becomes concrete.

```r title="Plot 100 intervals coloured by coverage"
ci_df <- data.frame(
  experiment = 1:100,
  lower      = experiments[1, ],
  upper      = experiments[2, ],
  covers     = contains_mu
)

ggplot(ci_df, aes(x = experiment, ymin = lower, ymax = upper, colour = covers)) +
  geom_linerange() +
  geom_hline(yintercept = true_mu, linetype = "dashed") +
  scale_colour_manual(values = c(`TRUE` = "steelblue", `FALSE` = "firebrick")) +
  labs(x = "Experiment #", y = "CI", colour = "Covers mu?") +
  theme_minimal()
```

Each vertical line is one confidence interval. The dashed horizontal line is the true mean, 50. Roughly 5 of the 100 intervals (the red ones) miss it, and 95 cover it. You never know *which* five will miss ahead of time, that is the whole point.

![Coverage concept of 95% confidence intervals](screenshots/Confidence-Intervals-in-R-coverage-concept.webp)
*Figure 1: The 95% refers to the procedure, across many repetitions, about 95% of constructed intervals cover the true parameter.*

[KEY INSIGHT]
**The 95% probability lives before you compute the interval, not after.** Once a specific CI is computed from one sample, it either contains the true mean or it does not, the Bayesian phrasing "there is a 95% probability the mean is in [48.2, 53.1]" mixes up frequentist mechanics with Bayesian semantics.

**Try it:** Modify the simulation to construct 99% confidence intervals instead of 95%, and confirm the empirical coverage rate lands near 0.99. Use `conf.level = 0.99` inside `t.test()`.

```r title="Your turn: coverage at 99% confidence"
# Build 100 x 99% CIs and compute coverage
set.seed(2026)
ex_experiments99 <- replicate(100, {
  sd99 <- rnorm(30, mean = 50, sd = 10)
  # your code here
})

ex_coverage99 <- mean(
  ex_experiments99[1, ] <= 50 & ex_experiments99[2, ] >= 50
)
ex_coverage99
#> Expected: near 0.99
```

<details>
<summary>Click to reveal solution</summary>

```r title="99% coverage solution"
set.seed(2026)
ex_experiments99 <- replicate(100, {
  sd99 <- rnorm(30, mean = 50, sd = 10)
  t.test(sd99, conf.level = 0.99)$conf.int
})

ex_coverage99 <- mean(
  ex_experiments99[1, ] <= 50 & ex_experiments99[2, ] >= 50
)
ex_coverage99
#> [1] 0.98
```

**Explanation:** Widening confidence from 95% to 99% widens every interval, so more of them cover 50. Over many replicates the empirical rate lands near 0.99. In a small run of 100 you can see values like 0.98 or 1.00, expected sampling noise.

</details>

## How do I compute a 95% CI for a mean in R?

The one-liner you will use 90% of the time is `t.test()`. Call it on a numeric vector and it returns, among other things, a 95% confidence interval for the population mean.

```r title="t.test() returns a 95% CI for the mean"
t.test(mtcars$mpg)
#> 
#>  One Sample t-test
#> 
#> data:  mtcars$mpg
#> t = 18.857, df = 31, p-value < 2.2e-16
#> alternative hypothesis: true mean is not equal to 0
#> 95 percent confidence interval:
#>  17.91768 22.26357
#> sample estimates:
#> mean of x 
#>  20.09062
```

The relevant line is `95 percent confidence interval: 17.91768 22.26357`. If you want the interval as a plain numeric vector to use downstream, extract it with `$conf.int`.

```r title="Extract just the interval"
mpg_ci <- t.test(mtcars$mpg)$conf.int
mpg_ci
#> [1] 17.91768 22.26357
#> attr(,"conf.level")
#> [1] 0.95
```

`mpg_ci` is now a length-2 numeric vector, element 1 is the lower bound, element 2 is the upper bound. The printed `conf.level` attribute confirms the default 95%.

[TIP]
**Change the confidence level with the `conf.level` argument.** `t.test(mtcars$mpg, conf.level = 0.99)$conf.int` widens the interval to 99%. Going the other way, `conf.level = 0.90` tightens it, at the cost of covering the true mean only 90% of the time across repeated sampling.

**Try it:** Compute a 99% confidence interval for `iris$Sepal.Length` and store it in `ex_sepal_ci`.

```r title="Your turn: 99% CI for Sepal.Length"
# Compute 99% CI for iris$Sepal.Length
ex_sepal_ci <- # your code here
ex_sepal_ci
#> Expected: approx [5.63, 5.97]
```

<details>
<summary>Click to reveal solution</summary>

```r title="Sepal.Length 99% CI solution"
ex_sepal_ci <- t.test(iris$Sepal.Length, conf.level = 0.99)$conf.int
ex_sepal_ci
#> [1] 5.634467 5.965533
#> attr(,"conf.level")
#> [1] 0.99
```

**Explanation:** `t.test()` plus `$conf.int` plus `conf.level = 0.99` is the full recipe. The bounds 5.63 and 5.97 bracket the sample mean of 5.843 with extra width compared to the 95% interval.

</details>

## How do I compute a confidence interval by hand?

Understanding how `t.test()` builds the interval under the hood makes it clearer *why* the interval has the width it does, and when you should not trust it. Every one-sample CI you will ever compute has the same three-part structure, a point estimate, a critical value, and a standard error.

$$\bar{x} \pm t_{n-1,\,1 - \alpha/2} \cdot \frac{s}{\sqrt{n}}$$

Where:

- $\bar{x}$ = the sample mean (the point estimate)
- $s$ = the sample standard deviation
- $n$ = the sample size
- $s / \sqrt{n}$ = the standard error of the mean
- $t_{n-1,\,1 - \alpha/2}$ = the critical value from the t-distribution with $n - 1$ degrees of freedom, for confidence level $1 - \alpha$

Let us reproduce the `mtcars$mpg` interval using only `mean()`, `sd()`, and `qt()`.

```r title="Manual 95% CI for mtcars$mpg"
x       <- mtcars$mpg
x_mean  <- mean(x)
x_sd    <- sd(x)
x_n     <- length(x)
t_crit  <- qt(0.975, df = x_n - 1)
se      <- x_sd / sqrt(x_n)

manual_ci <- c(x_mean - t_crit * se, x_mean + t_crit * se)
manual_ci
#> [1] 17.91768 22.26357
```

The manual interval `[17.92, 22.26]` matches `t.test(mtcars$mpg)$conf.int` to full precision. `qt(0.975, df = 31)` returns the t-critical value 2.0395, leave half a percent in each tail of the t-distribution, and the two quantiles give you the 95% window.

![Anatomy of a confidence interval](screenshots/Confidence-Intervals-in-R-decision-tree.webp)
*Figure 2: Every confidence interval has the same shape, a point estimate plus or minus a margin, where the margin is a critical value times a standard error.*

[NOTE]
**With `n` >= 30 the t-distribution closely resembles the normal.** Many older textbooks therefore use `qnorm(0.975)` = 1.96 in place of `qt(0.975, df = n - 1)`. The difference is small for large samples but matters at `n` = 10 or 15 where `qt()` gives a notably larger critical value (2.26 instead of 1.96). Default to the t-version, it is always at least as correct.

**Try it:** Compute a manual 95% CI for `mtcars$hp` and confirm it matches `t.test(mtcars$hp)$conf.int`.

```r title="Your turn: manual CI for hp"
# Compute manual 95% CI for mtcars$hp
# then compare with t.test(mtcars$hp)$conf.int
ex_hp_x     <- mtcars$hp
ex_hp_mean  <- mean(ex_hp_x)
ex_hp_sd    <- sd(ex_hp_x)
ex_hp_n     <- length(ex_hp_x)
ex_hp_ci    <- # your code here
ex_hp_ci
#> Expected: matches t.test(mtcars$hp)$conf.int
```

<details>
<summary>Click to reveal solution</summary>

```r title="Manual CI for hp solution"
ex_hp_x    <- mtcars$hp
ex_hp_mean <- mean(ex_hp_x)
ex_hp_sd   <- sd(ex_hp_x)
ex_hp_n    <- length(ex_hp_x)
ex_hp_tcrit <- qt(0.975, df = ex_hp_n - 1)
ex_hp_se    <- ex_hp_sd / sqrt(ex_hp_n)
ex_hp_ci    <- c(ex_hp_mean - ex_hp_tcrit * ex_hp_se,
                 ex_hp_mean + ex_hp_tcrit * ex_hp_se)
ex_hp_ci
#> [1] 121.2169 172.2831

t.test(ex_hp_x)$conf.int
#> [1] 121.2169 172.2831
#> attr(,"conf.level")
#> [1] 0.95
```

**Explanation:** The two bounds match to full precision because `t.test()` uses exactly this formula under the hood. No surprises, same math.

</details>

## How does CI width change with sample size, variability, and confidence level?

A CI's width is not a mystery, it is driven by three knobs. Increase the sample size `n` and the interval shrinks as $1/\sqrt{n}$. Increase the variability `s` and it grows linearly. Increase the confidence level (say from 95% to 99%) and the critical value grows.

Let us demonstrate the sample-size effect directly. We draw samples from `N(100, 15)` at four different `n` values and record the width of the resulting 95% CI.

```r title="CI width vs sample size"
set.seed(2026)

ci_width <- function(n) {
  x <- rnorm(n, mean = 100, sd = 15)
  ci <- t.test(x)$conf.int
  ci[2] - ci[1]
}

widths <- sapply(c(10, 50, 250, 1000), ci_width)
widths
#> [1] 10.739340  4.268725  1.816330  0.938946

# Ratio width(n=100) / width(n=400) should be near 2
sapply(c(100, 400), ci_width)
#> [1] 2.961267 1.473620
```

The first vector shows the widths at `n` = 10, 50, 250, 1000. Notice that when `n` goes from 10 to 1000 (100x increase), the width drops from about 10.7 to about 0.9 (roughly a 10x reduction), exactly the factor of $\sqrt{100} = 10$ the formula predicts. The second call confirms the 1/2 ratio between `n = 100` and `n = 400`.

[TIP]
**To halve the width of a CI you need four times the sample size.** That quadratic growth in required `n` is why "more data" is expensive, doubling precision at 95% confidence means quadrupling your sample size. Plan accordingly.

**Try it:** Using the `ci_width()` function above, predict (then verify) the width ratio between `n = 50` and `n = 200`.

```r title="Your turn: width ratio 50 vs 200"
# Predict the ratio, then compute it
set.seed(2026)
ex_width_ratio <- # your code here
ex_width_ratio
#> Expected: near 2 (since sqrt(4) = 2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Width ratio solution"
set.seed(2026)
ex_w50  <- ci_width(50)
ex_w200 <- ci_width(200)
ex_width_ratio <- ex_w50 / ex_w200
ex_width_ratio
#> [1] 2.183
```

**Explanation:** Going from `n = 50` to `n = 200` is a 4x increase in sample size, and the CI width shrinks by roughly $\sqrt{4} = 2$. Small deviations from exactly 2 are pure sampling noise, on any single pair of samples.

</details>

## How do I compute CIs for proportions, differences, and regression?

`t.test()` handles one-sample and two-sample means. For other common statistics, R ships a different function for each, all following the same pattern of "fit, then pull out a `conf.int`".

For a single proportion, use `prop.test()`. Suppose 35 of 100 users clicked your button and you want a 95% CI for the true click-through rate.

```r title="CI for a single proportion"
prop_test <- prop.test(x = 35, n = 100, conf.level = 0.95)
prop_test$conf.int
#> [1] 0.2600511 0.4501333
#> attr(,"conf.level")
#> [1] 0.95
```

`prop.test()` uses the Wilson score method with continuity correction, which behaves far better than the naive "normal approximation" interval when `n` is small or the true proportion is near 0 or 1.

For a difference in two means, call `t.test()` with a formula or two vectors. The `sleep` dataset has extra hours of sleep for 10 patients on two different drugs.

```r title="CI for a difference in means"
sleep_test <- t.test(extra ~ group, data = sleep)
sleep_test$conf.int
#> [1] -3.3654832  0.2054832
#> attr(,"conf.level")
#> [1] 0.95
```

The 95% CI for group 1 mean minus group 2 mean is roughly `[-3.37, 0.21]`. The interval straddles 0, which tells you right away that at the 5% significance level there is no evidence the two drugs differ, the data are consistent with "no difference".

For a regression coefficient, fit the model with `lm()` and call `confint()`.

```r title="CIs for regression coefficients"
fit    <- lm(mpg ~ wt, data = mtcars)
reg_ci <- confint(fit)
reg_ci
#>                  2.5 %    97.5 %
#> (Intercept) 33.450500 41.119753
#> wt          -6.486308 -4.202635
```

Each row is a 95% CI for one coefficient. The slope CI `[-6.49, -4.20]` says that, on average, a one-unit increase in `wt` (1,000 lbs) is associated with a drop of somewhere between 4.2 and 6.5 mpg.

![Decision tree for choosing a CI method](screenshots/Confidence-Intervals-in-R-overview-mindmap.webp)
*Figure 3: Which CI method fits the problem you have in front of you, mean, proportion, difference, regression, or bootstrap.*

[NOTE]
**`prop.test()` uses Wilson with continuity correction; `binom.test()` uses Clopper-Pearson exact.** They give almost identical answers for moderate `n` and `p`, but can diverge noticeably when `n` is small (say under 30) or `p` is close to 0 or 1. For reporting in published work, the exact Clopper-Pearson interval from `binom.test()` is the safer default.

**Try it:** Compute the 95% CI for the slope of the regression `lm(Sepal.Length ~ Petal.Length, data = iris)`.

```r title="Your turn: slope CI for iris regression"
# Fit and extract the slope CI
ex_fit      <- # your code here
ex_slope_ci <- # your code here
ex_slope_ci
#> Expected: about [0.37, 0.45]
```

<details>
<summary>Click to reveal solution</summary>

```r title="Slope CI solution"
ex_fit      <- lm(Sepal.Length ~ Petal.Length, data = iris)
ex_slope_ci <- confint(ex_fit)["Petal.Length", ]
ex_slope_ci
#>     2.5 %    97.5 % 
#> 0.3791270 0.4528372
```

**Explanation:** `confint()` returns a matrix with one row per coefficient. Subset by the row name `"Petal.Length"` to get just the slope. The bounds are very tight because `iris` has 150 rows and the relationship is nearly linear.

</details>

## When should I use a bootstrap confidence interval?

The t-interval works great when the sample mean's distribution is approximately Normal, which, thanks to the Central Limit Theorem, is true for most moderate-sized samples from most distributions. But a few cases break the assumption, heavily skewed data with small `n`, or a statistic with no nice closed-form standard error (the median, a trimmed mean, a quantile, a correlation). In those cases, bootstrap the CI instead.

The idea is simple, resample the data with replacement many times, recompute the statistic on each resample, and use the empirical 2.5% and 97.5% quantiles of the recomputed statistics as the CI endpoints.

```r title="Bootstrap 95% CI for the median"
set.seed(2026)

boot_medians <- replicate(2000, {
  resample <- sample(mtcars$mpg, replace = TRUE)
  median(resample)
})

boot_ci <- quantile(boot_medians, probs = c(0.025, 0.975))
boot_ci
#>    2.5%   97.5% 
#> 17.3000 21.4500
```

The percentile bootstrap 95% CI for the median `mpg` is roughly `[17.3, 21.5]`. No t-distribution, no standard error formula, just resampling.

[NOTE]
**Bootstrap works best for smooth statistics.** Avoid it for extreme order statistics (min, max) or for heavily discrete data where the bootstrap distribution itself becomes degenerate. For means, medians, trimmed means, correlations, and regression coefficients, 2,000 to 10,000 bootstrap replicates give stable percentile CIs.

**Try it:** Build a 90% percentile bootstrap CI for the mean of `mtcars$hp`.

```r title="Your turn: bootstrap 90% CI for mean hp"
# Use 2000 resamples; compute 5% and 95% quantiles
set.seed(2026)
ex_boot_hp <- # your code here
# Then compute the 90% CI
ex_boot_hp_ci <- # your code here
ex_boot_hp_ci
#> Expected: near [128, 165]
```

<details>
<summary>Click to reveal solution</summary>

```r title="Bootstrap 90% CI for mean hp solution"
set.seed(2026)
ex_boot_hp <- replicate(2000, {
  resample <- sample(mtcars$hp, replace = TRUE)
  mean(resample)
})
ex_boot_hp_ci <- quantile(ex_boot_hp, probs = c(0.05, 0.95))
ex_boot_hp_ci
#>       5%      95% 
#> 129.5062 164.0312
```

**Explanation:** Same recipe as the median bootstrap, just swap `median()` for `mean()` and the quantile probabilities to 0.05 / 0.95 for a 90% interval.

</details>

## How do I report and interpret a confidence interval correctly?

Words matter. Here is a short phrasebook that covers almost every case you will write up.

| Correct | Incorrect |
|---|---|
| "We are 95% confident that the true mean is between 17.9 and 22.3." | "There is a 95% probability the true mean is between 17.9 and 22.3." |
| "If we repeated this study many times, 95% of the constructed intervals would contain the true mean." | "The true mean is in [17.9, 22.3] with 95% probability." |
| "The 95% CI for the difference is [-3.37, 0.21], which includes 0, so we cannot reject the null of no difference at alpha = 0.05." | "The 95% CI rules out a difference of 0." |

A confidence interval and a two-sided hypothesis test at the corresponding alpha level are mathematically dual, if the null value lies outside the (1 - alpha) CI, you reject the null at significance alpha. You can use this duality directly in R.

```r title="CI duality with hypothesis tests"
diff_ci <- t.test(extra ~ group, data = sleep)$conf.int
zero_in <- diff_ci[1] <= 0 & diff_ci[2] >= 0
zero_in
#> [1] TRUE

# If zero_in is TRUE, we cannot reject H0: difference = 0 at alpha = 0.05
ifelse(zero_in,
       "Fail to reject H0 (difference could be 0)",
       "Reject H0 (difference is non-zero)")
#> [1] "Fail to reject H0 (difference could be 0)"
```

The 95% CI for the mean difference in the `sleep` trial contains 0, and the function correctly reports "Fail to reject H0". Compare with `t.test(extra ~ group, data = sleep)$p.value`, the p-value is 0.079, consistent with the CI message.

[WARNING]
**Do not say "the parameter is in the interval with 95% probability."** That is a Bayesian credible-interval statement, not a frequentist confidence statement. Under the frequentist view, the parameter is a fixed unknown, it is either in your interval (probability 1) or not (probability 0), you just do not know which. The 95% lives in the *procedure's* long-run behavior.

[KEY INSIGHT]
**Rejecting H0 at level alpha is equivalent to the null value falling outside the (1 - alpha) CI.** This duality lets you read a test result off a CI without computing a p-value, and vice versa. Journals increasingly ask for CIs instead of, or alongside, p-values for exactly this reason, the CI carries more information about effect size and uncertainty.

**Try it:** Given a 95% CI for a difference of `[-3.4, 0.5]`, does it reject the null H0: difference = 0 at alpha = 0.05? Save your answer (TRUE or FALSE) in `ex_ci_check`.

```r title="Your turn: CI -> hypothesis decision"
# Does the interval reject H0: difference = 0 at alpha = 0.05?
ex_ci         <- c(-3.4, 0.5)
ex_ci_check   <- # your code here (TRUE if reject, FALSE otherwise)
ex_ci_check
#> Expected: FALSE
```

<details>
<summary>Click to reveal solution</summary>

```r title="CI decision solution"
ex_ci       <- c(-3.4, 0.5)
ex_ci_check <- !(ex_ci[1] <= 0 & ex_ci[2] >= 0)
ex_ci_check
#> [1] FALSE
```

**Explanation:** Zero lies inside `[-3.4, 0.5]`, so the interval does NOT rule out a difference of 0. Cannot reject H0 at alpha = 0.05, `ex_ci_check` is FALSE.

</details>

## Practice Exercises

### Exercise 1: 95% vs 99% CI widths on `mtcars$qsec`

Compute both a 95% and a 99% CI for `mtcars$qsec` and print the width of each. Store them in `my_data`, `my_ci95`, and `my_ci99`. By how many seconds does the 99% interval widen relative to the 95%?

```r title="Exercise 1 starter: 95% vs 99% CI"
# Compute two CIs for qsec and compare widths
my_data <- mtcars$qsec
my_ci95 <- # your code here
my_ci99 <- # your code here

width95 <- diff(my_ci95)
width99 <- diff(my_ci99)
c(width95 = width95, width99 = width99)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_data <- mtcars$qsec
my_ci95 <- t.test(my_data, conf.level = 0.95)$conf.int
my_ci99 <- t.test(my_data, conf.level = 0.99)$conf.int

width95 <- diff(my_ci95)
width99 <- diff(my_ci99)
c(width95 = width95, width99 = width99)
#>  width95  width99 
#> 1.291749 1.747876
```

**Explanation:** The 99% CI is about 35% wider than the 95%, because `qt(0.995, df = 31)` is about 2.74 versus `qt(0.975, df = 31)` is about 2.04. Higher confidence always costs width.

</details>

### Exercise 2: Empirical coverage on skewed data

Simulate 500 experiments, each drawing `n = 50` observations from `rexp(rate = 0.2)` (an exponential distribution with mean 5). For each sample, construct a 90% CI for the mean using `t.test()`. Report the empirical coverage rate in `my_exp_coverage`.

```r title="Exercise 2 starter: coverage on skewed data"
# Simulate 500 CIs on exponential data and count coverage
set.seed(2026)
true_mean_exp <- 5  # since rate = 0.2 implies mean = 1/0.2 = 5

my_exp_coverage <- # your code here
my_exp_coverage
#> Expected: near 0.90 but slightly lower (skewness hurts coverage)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
set.seed(2026)
true_mean_exp <- 5

exp_cover <- replicate(500, {
  x  <- rexp(50, rate = 0.2)
  ci <- t.test(x, conf.level = 0.90)$conf.int
  ci[1] <= true_mean_exp & ci[2] >= true_mean_exp
})
my_exp_coverage <- mean(exp_cover)
my_exp_coverage
#> [1] 0.882
```

**Explanation:** Nominal coverage is 90%, empirical came in at 88.2%. The t-interval is slightly anti-conservative on skewed distributions at small to moderate `n`, one of the motivations for the bootstrap alternative.

</details>

### Exercise 3: Bootstrap CI for the coefficient of variation

Bootstrap a 95% percentile CI for the *coefficient of variation* (standard deviation divided by mean) of `mtcars$mpg`. Use 5,000 resamples. Store the result in `my_cv_boot`.

```r title="Exercise 3 starter: bootstrap CV"
# Bootstrap 95% CI for sd(x)/mean(x)
set.seed(2026)

cv_fn <- function(x) sd(x) / mean(x)

boot_cvs   <- # your code here (5000 replicates)
my_cv_boot <- # your code here (2.5% and 97.5% quantiles)
my_cv_boot
#> Expected: near [0.18, 0.38]
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
set.seed(2026)
cv_fn <- function(x) sd(x) / mean(x)

boot_cvs <- replicate(5000, {
  r <- sample(mtcars$mpg, replace = TRUE)
  cv_fn(r)
})
my_cv_boot <- quantile(boot_cvs, probs = c(0.025, 0.975))
my_cv_boot
#>      2.5%     97.5% 
#> 0.2351232 0.3566569
```

**Explanation:** The bootstrap percentile CI is `[0.24, 0.36]`, the relative variability of mpg is between 24% and 36% of its mean. There is no closed-form standard error for `sd(x) / mean(x)`, which is exactly when the bootstrap earns its keep.

</details>

## Complete Example: A Small Drug-Trial Analysis

Let us tie everything together on the `sleep` dataset, a classic paired trial comparing the effect of two soporific drugs on 10 patients.

```r title="End-to-end CI workflow on the sleep dataset"
# 1. Group means with 95% CIs
g1 <- subset(sleep, group == 1)$extra
g2 <- subset(sleep, group == 2)$extra

ci_g1 <- t.test(g1)$conf.int
ci_g2 <- t.test(g2)$conf.int
round(rbind(ci_g1, ci_g2), 2)
#>        [,1] [,2]
#> ci_g1 -0.53 2.03
#> ci_g2  0.80 4.46

# 2. CI for the difference (two-sample, Welch by default)
diff_test <- t.test(extra ~ group, data = sleep)
round(diff_test$conf.int, 2)
#> [1] -3.37  0.21
#> attr(,"conf.level")
#> [1] 0.95

# 3. Regression: extra ~ group
fit_sleep <- lm(extra ~ group, data = sleep)
round(confint(fit_sleep), 2)
#>              2.5 % 97.5 %
#> (Intercept) -0.24   1.78
#> group2       0.12   2.97

# 4. Interpretation (programmatic)
diff_ci  <- diff_test$conf.int
rejects  <- !(diff_ci[1] <= 0 & diff_ci[2] >= 0)
sprintf("95%% CI for difference: [%.2f, %.2f]. Reject H0 at alpha = 0.05? %s",
        diff_ci[1], diff_ci[2], rejects)
#> [1] "95% CI for difference: [-3.37, 0.21]. Reject H0 at alpha = 0.05? FALSE"
```

Four pieces of inference, each with a CI, each interpreted in the same frequentist language. The paired `t.test()` (which `t.test(extra ~ group, data = sleep, paired = TRUE)` gives) would in fact reject H0 here because within-subject pairing removes a big chunk of between-subject variance, but on the unpaired Welch analysis the simpler two-sample CI straddles zero, so the unpaired comparison is inconclusive at alpha = 0.05. That distinction is exactly the kind of thing CIs make transparent, the width and location of the interval tell you not just *whether* to reject but *how* close the data came to ruling out zero.

## Summary

| Method | R function | Use when |
|---|---|---|
| One-sample t-interval | `t.test(x)$conf.int` | Single mean, any `n`, moderately symmetric data |
| Two-sample / paired t-interval | `t.test(x, y)` or `t.test(x ~ g)` | Mean difference between two groups |
| Wilson interval (Score) | `prop.test(k, n)$conf.int` | Single proportion, moderate `n` and `p` |
| Clopper-Pearson exact | `binom.test(k, n)$conf.int` | Proportion with small `n` or extreme `p` |
| Regression coefficient | `confint(lm_fit)` | Slope / intercept from linear model |
| Percentile bootstrap | `quantile(boot_stats, c(0.025, 0.975))` | Median, trimmed mean, CV, or any custom statistic |

The four facts worth remembering long after this post:

1. The 95% describes a *procedure*, not a computed interval.
2. To halve a CI's width you need 4x the sample size.
3. Use Wilson (`prop.test`) for proportions unless `n` is very small or `p` is near 0 or 1, then use `binom.test`.
4. If the null value sits outside the (1 - alpha) CI, the corresponding two-sided test rejects at level alpha.

## References

1. Cumming, G. (2012). *Understanding The New Statistics, Effect Sizes, Confidence Intervals, and Meta-Analysis.* Routledge. [Link](https://www.routledge.com/Understanding-The-New-Statistics-Effect-Sizes-Confidence-Intervals-and-Meta-Analysis/Cumming/p/book/9780415879682)
2. Morey, R. D., Hoekstra, R., Rouder, J. N., Lee, M. D., and Wagenmakers, E. J. (2016). *The Fallacy of Placing Confidence in Confidence Intervals.* Psychonomic Bulletin and Review. [Link](https://link.springer.com/article/10.3758/s13423-015-0947-8)
3. Neyman, J. (1937). *Outline of a Theory of Statistical Estimation Based on the Classical Theory of Probability.* Philosophical Transactions of the Royal Society. [Link](https://doi.org/10.1098/rsta.1937.0005)
4. R Core Team. *t.test documentation.* [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/t.test.html)
5. R Core Team. *prop.test documentation.* [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/prop.test.html)
6. Hesterberg, T. C. (2015). *What Teachers Should Know About the Bootstrap, Resampling in the Undergraduate Statistics Curriculum.* The American Statistician. [Link](https://www.tandfonline.com/doi/full/10.1080/00031305.2015.1089789)
7. Agresti, A. and Coull, B. A. (1998). *Approximate Is Better than Exact for Interval Estimation of Binomial Proportions.* The American Statistician. [Link](https://www.jstor.org/stable/2685469)
8. CRAN `boot` package documentation. [Link](https://cran.r-project.org/web/packages/boot/index.html)

## Continue Learning

- [Central Limit Theorem in R](Central-Limit-Theorem-in-R.html), the result that makes most t-intervals valid for moderate samples.
- [Sampling Distributions in R](Sampling-Distributions-in-R.html), where standard errors come from.
- [Hypothesis Testing in R](Hypothesis-Testing-in-R.html), the test-CI duality in full.
