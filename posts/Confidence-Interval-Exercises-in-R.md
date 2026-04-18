---
title: "Confidence Interval Exercises in R: 10 Problems with Full Solutions"
slug: Confidence-Interval-Exercises-in-R
description: "Work through 10 R confidence interval exercises: t.test, prop.test, bootstrap CIs, paired samples, regression, and sample-size effects. Full solutions inside."
keywords: "confidence interval exercises in R, R confidence interval practice, t.test confidence interval, prop.test R, bootstrap confidence interval R, confint R, paired t-test CI, regression confidence interval"
auto_link_terms: "confidence interval exercises|CI exercises in R|confidence interval practice problems|confidence interval problems in R|bootstrap confidence interval exercises|confidence interval practice|confint() exercises"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-18
curriculum_id: E5.4
post_type: EX
sidebar_title: "Confidence Interval (10 problems)"
fr_parent: Confidence-Intervals-in-R.html
difficulty: Intermediate
---

# Confidence Interval Exercises in R: 10 Problems with Full Solutions

<p class="lead">These 10 confidence interval exercises in R walk from a one-line <code>t.test()</code> through manual <code>qt()</code> formulas, two-sample and paired intervals, bootstrap CIs for the median, regression coefficient intervals, and the sample-size-versus-width trade-off, with full runnable solutions next to every problem.</p>

## How do you build a 95% confidence interval in R?

R already hands you a confidence interval every time you run `t.test()`, but most learners skim past that `conf.int` line without realising it is the whole point. Here is a one-liner on `mtcars$mpg` that returns a 95% interval for the true mean mpg, so you see exactly where the interval lives in the output before the exercises start asking you to build intervals yourself.

```r title="95% CI for mean mpg in one line"
# 95% confidence interval for the mean of mtcars$mpg
mpg_ci <- t.test(mtcars$mpg)$conf.int
mpg_ci
#> [1] 17.91768 22.26357
#> attr(,"conf.level")
#> [1] 0.95
```

The two numbers `17.92` and `22.26` are the lower and upper bounds of a 95% CI for the mean mpg across all cars in the population `mtcars` was drawn from. If you repeated this study many times, about 95% of such intervals would cover the true mean. The sample mean `mean(mtcars$mpg)` is `20.09`, which sits right between them, and the interval runs roughly 2.2 units either side of that centre.

[TIP]
**Pull $conf.int directly for the two numbers you actually care about.** The full `print()` output of `t.test()` is noisy with null hypothesis machinery. Extracting the interval as a 2-element vector keeps your code terse and makes it easy to `round()`, `diff()`, or pass to another function.

The formula behind that `t.test()` call is the same one every introductory stats course uses:

$$\bar{x} \pm t_{\alpha/2,\,n-1} \cdot \frac{s}{\sqrt{n}}$$

Where:
- $\bar{x}$ = sample mean
- $s$ = sample standard deviation
- $n$ = sample size
- $t_{\alpha/2,\,n-1}$ = the t critical value for confidence level $1-\alpha$ and $n-1$ degrees of freedom

You will reconstruct this formula by hand in Exercise 3.

**Try it:** Compute the 95% confidence interval for `iris$Sepal.Length`. Save the lower bound to `ex_lower`.

```r title="Your turn: CI for iris Sepal.Length"
# Try it: compute the 95% CI for iris$Sepal.Length
ex_sepal_ci <- # your code here

ex_lower <- # your code here
ex_lower
#> Expected: 5.709732
```

<details>
<summary>Click to reveal solution</summary>

```r title="iris Sepal.Length CI solution"
ex_sepal_ci <- t.test(iris$Sepal.Length)$conf.int
ex_lower <- ex_sepal_ci[1]
ex_lower
#> [1] 5.709732
```

**Explanation:** `t.test()` returns a list with a `$conf.int` field. Indexing with `[1]` grabs the lower bound; `[2]` would give the upper bound.

</details>

## Which R function computes which type of confidence interval?

Not every confidence interval comes from `t.test()`. R has a small, well-chosen set of functions that each cover one family of estimators. Knowing which function to reach for is half the battle, so here are the four most common in one place with toy data.

```r title="Four CI functions side-by-side"
# 1. Mean CI via t.test()
t_ex <- t.test(mtcars$mpg)$conf.int

# 2. Proportion CI via prop.test() (60 successes in 100 trials)
p_ex <- prop.test(60, 100)$conf.int

# 3. Regression coefficient CI via confint()
lm_fit_ex <- lm(mpg ~ wt, data = mtcars)
ci_fit <- confint(lm_fit_ex)

# 4. Correlation CI via cor.test()
cor_ex <- cor.test(mtcars$mpg, mtcars$wt)$conf.int

round(t_ex, 3)
#> [1] 17.918 22.264
round(p_ex, 3)
#> [1] 0.497 0.696
round(ci_fit, 3)
#>              2.5 %  97.5 %
#> (Intercept) 33.451 41.120
#> wt          -6.486 -4.203
round(cor_ex, 3)
#> [1] -0.934 -0.744
```

Each call returns a two-element vector (or matrix, for regression), and every interval is built from the same pattern: a point estimate plus or minus a critical value times a standard error. The functions differ only in which critical value (z, t, or bootstrap quantile) and which standard error formula apply to the estimator at hand.

| You want a CI for... | Use | Key argument |
|---|---|---|
| A mean | `t.test(x)` | `conf.level` |
| A difference of means | `t.test(x, y)` | `var.equal` |
| Paired differences | `t.test(x, y, paired = TRUE)` | (none) |
| A proportion | `prop.test(x, n)` | `correct` |
| Regression coefficients | `confint(lm_fit)` | `level` |
| A correlation | `cor.test(x, y)` | (none) |
| A median (nonparametric) | `replicate()` + `sample()` + `quantile()` | bootstrap reps |

[KEY INSIGHT]
**Every confidence interval is estimate plus or minus (critical value) times (standard error).** The three CI families above look different because they hide the critical value and SE inside the function, but the skeleton is identical. Once you see that, remembering which function to pick reduces to "what is the estimator?"

**Try it:** You ran an A/B test and 92 of 150 users clicked. Which R function computes the 95% CI for the click-through rate? Set `ex_fn_choice` to one of `"t.test"`, `"prop.test"`, `"confint"`, or `"cor.test"`.

```r title="Your turn: pick the right function"
# Try it: pick the function for a proportion CI
ex_fn_choice <- "___"   # replace with "t.test", "prop.test", "confint", or "cor.test"
ex_fn_choice
#> Expected: "prop.test"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Function picker solution"
ex_fn_choice <- "prop.test"
ex_fn_choice
#> [1] "prop.test"
```

**Explanation:** You are estimating a single proportion (clicks out of impressions), so `prop.test(92, 150)` is the tool. `t.test()` is for means, `confint()` is for regression coefficients, and `cor.test()` is for correlations.

</details>

## Practice Exercises

Ten problems, roughly in order of difficulty. Each capstone uses `my_` prefixed variables so your solutions never clash with the tutorial examples above.

### Exercise 1: CI for a single mean

Build a 95% confidence interval for the mean `mpg` in `mtcars` using `t.test()`. Store the two-element interval in `my_mpg_ci` and print it.

```r title="Your turn: CI for mean mpg"
# Exercise 1: 95% CI for mean mpg
# Hint: t.test() returns an object with $conf.int

my_mpg_ci <- # your code here

my_mpg_ci
#> Expected: c(17.92, 22.26) approximately
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_mpg_ci <- t.test(mtcars$mpg)$conf.int
round(my_mpg_ci, 2)
#> [1] 17.92 22.26
#> attr(,"conf.level")
#> [1] 0.95
```

**Explanation:** `t.test()` by default builds a 95% confidence interval. The `$conf.int` field is a length-2 numeric vector with the lower and upper bounds. No null hypothesis is being tested here, you are just using `t.test()` as a convenient CI calculator.

</details>

### Exercise 2: CI for a proportion

A landing page shows an ad to 150 visitors and 92 of them click. Build a 95% CI for the true click-through rate using `prop.test()` and store it in `my_click_ci`.

```r title="Your turn: CI for a proportion"
# Exercise 2: 95% CI for click-through rate
# Hint: prop.test(x, n)$conf.int, where x = successes and n = trials

my_click_ci <- # your code here

round(my_click_ci, 3)
#> Expected: c(0.534, 0.688) approximately
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
my_click_ci <- prop.test(92, 150)$conf.int
round(my_click_ci, 3)
#> [1] 0.534 0.688
#> attr(,"conf.level")
#> [1] 0.95
```

**Explanation:** `prop.test()` uses the Wilson score interval by default, which is safer than the textbook Wald interval for small samples or extreme proportions. The point estimate is 92/150 = 0.613, and the CI runs from about 0.53 to 0.69.

</details>

### Exercise 3: Manual CI using qt()

Compute the 95% CI for the mean of `iris$Sepal.Length` *by hand* using `mean()`, `sd()`, `sqrt()`, and `qt()`. Store your manual answer in `my_manual_ci` and the `t.test()` answer in `my_auto_ci`. Confirm both match to four decimals.

```r title="Your turn: manual CI from the formula"
# Exercise 3: compute 95% CI by hand
# Formula: mean +/- qt(0.975, df = n - 1) * sd / sqrt(n)
# Hint: df = n - 1

x <- iris$Sepal.Length
n <- length(x)

se  <- # your code here
tcv <- # qt(0.975, df = ?)
my_manual_ci <- # your code here
my_auto_ci   <- # your code here

round(my_manual_ci, 4)
round(my_auto_ci,   4)
#> Expected: both vectors match, ~5.7097 5.9837
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
x <- iris$Sepal.Length
n <- length(x)

se  <- sd(x) / sqrt(n)
tcv <- qt(0.975, df = n - 1)
my_manual_ci <- mean(x) + c(-1, 1) * tcv * se
my_auto_ci   <- t.test(x)$conf.int

round(my_manual_ci, 4)
#> [1] 5.7097 5.9837
round(my_auto_ci, 4)
#> [1] 5.7097 5.9837
```

**Explanation:** The formula mean plus or minus $t_{0.975,\,n-1} \cdot s/\sqrt{n}$ *is* what `t.test()` computes internally. `qt(0.975, df = n-1)` returns the critical value that cuts off 2.5% of the upper tail of a t distribution, matching a 95% two-sided CI. Both results agreeing to four decimals confirms the formula.

</details>

### Exercise 4: CI for a difference of means

Build a 95% CI for the difference in mean mpg between 4-cylinder and 8-cylinder cars in `mtcars`. Store it in `my_diff_ci`. Does the interval exclude zero?

```r title="Your turn: two-sample CI"
# Exercise 4: 95% CI for mpg_4cyl - mpg_8cyl
# Hint: split mpg by cyl, then t.test(x, y)

mpg_4 <- mtcars$mpg[mtcars$cyl == 4]
mpg_8 <- mtcars$mpg[mtcars$cyl == 8]

my_diff_ci <- # your code here

round(my_diff_ci, 2)
#> Expected: c(8.32, 15.08) approximately; excludes 0
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 4 solution"
mpg_4 <- mtcars$mpg[mtcars$cyl == 4]
mpg_8 <- mtcars$mpg[mtcars$cyl == 8]

my_diff_ci <- t.test(mpg_4, mpg_8)$conf.int
round(my_diff_ci, 2)
#> [1]  8.32 15.08
```

**Explanation:** `t.test(x, y)` runs a Welch two-sample test by default (no equal-variance assumption) and returns `$conf.int` for the difference `mean(x) - mean(y)`. The interval 8.32 to 15.08 is well above zero, so 4-cylinder cars genuinely get better mileage than 8-cylinder cars in this dataset, and you can be 95% confident the true mean difference is between about 8 and 15 mpg.

</details>

### Exercise 5: Paired-sample CI

The built-in `sleep` dataset records hours of extra sleep for the same 10 patients under two drugs. Build a 95% CI for the mean difference (drug 1 minus drug 2) using a paired t-test. Store it in `my_paired_ci`.

```r title="Your turn: paired CI"
# Exercise 5: paired CI on the sleep dataset
# Hint: sleep$extra split by group; paired = TRUE

g1 <- sleep$extra[sleep$group == 1]
g2 <- sleep$extra[sleep$group == 2]

my_paired_ci <- # your code here

round(my_paired_ci, 2)
#> Expected: c(-2.46, -0.70) approximately
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 5 solution"
g1 <- sleep$extra[sleep$group == 1]
g2 <- sleep$extra[sleep$group == 2]

my_paired_ci <- t.test(g1, g2, paired = TRUE)$conf.int
round(my_paired_ci, 2)
#> [1] -2.46 -0.70
```

**Explanation:** `paired = TRUE` tells `t.test()` that each row in `g1` corresponds to the same patient in `g2`. The CI is for the mean *within-patient* difference, not the between-group difference, which would ignore the pairing and give a wider interval. Because both bounds are negative, drug 2 outperforms drug 1 at the 95% confidence level.

</details>

### Exercise 6: CI width vs confidence level

Compute 90%, 95%, and 99% CIs for the mean of `mtcars$mpg`. Store the three widths (upper minus lower) in a named numeric vector `my_widths`. Observe how the width grows with confidence level.

```r title="Your turn: widths at three confidence levels"
# Exercise 6: width vs confidence level
# Hint: use the conf.level argument of t.test()

get_width <- function(level) {
  ci <- t.test(mtcars$mpg, conf.level = level)$conf.int
  # your code here
}

my_widths <- # your code here

round(my_widths, 2)
#> Expected: named vector roughly c(90% = 3.72, 95% = 4.35, 99% = 5.88)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 6 solution"
get_width <- function(level) {
  ci <- t.test(mtcars$mpg, conf.level = level)$conf.int
  diff(ci)
}

my_widths <- c(`90%` = get_width(0.90),
               `95%` = get_width(0.95),
               `99%` = get_width(0.99))
round(my_widths, 2)
#>  90%  95%  99%
#> 3.72 4.35 5.88
```

**Explanation:** The 99% CI is almost 60% wider than the 90% CI, yet the *sample* has not changed. More confidence costs precision. This is why 95% survives as the default compromise, and why chasing 99.9% reliably can wreck a study's usefulness without a much larger sample.

</details>

[TIP]
**Halving CI width costs four times the sample size, not twice.** Because the standard error shrinks as $1/\sqrt{n}$, a CI that is too wide for decision-making almost always needs 4x more observations, not 2x. Plan that budget before collecting data.

### Exercise 7: Bootstrap CI for the median

`t.test()` will not give you a CI for the median. Use a non-parametric bootstrap instead: resample `mtcars$mpg` with replacement, compute the median each time, and take the 2.5% and 97.5% quantiles. Store the interval in `my_boot_ci`. Set the seed to 2026 for reproducibility.

```r title="Your turn: bootstrap CI for the median"
# Exercise 7: percentile bootstrap CI for median(mpg)
# Hint: replicate(B, median(sample(x, replace = TRUE)))

set.seed(2026)
x <- mtcars$mpg
B <- 2000

boot_medians <- # your code here

my_boot_ci <- # your code here

round(my_boot_ci, 2)
#> Expected: c(16.40, 21.40) approximately
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 7 solution"
set.seed(2026)
x <- mtcars$mpg
B <- 2000

boot_medians <- replicate(B, median(sample(x, replace = TRUE)))
my_boot_ci   <- quantile(boot_medians, c(0.025, 0.975))

round(my_boot_ci, 2)
#>  2.5% 97.5%
#> 16.40 21.40
```

**Explanation:** The percentile bootstrap approximates the sampling distribution of the median by resampling *with replacement* from the data 2,000 times. The 2.5% and 97.5% quantiles of the resampled medians bracket 95% of the resampling distribution. This same recipe works for any statistic (trimmed means, ratios, odds) whenever no neat closed-form CI exists.

</details>

[NOTE]
**2,000 bootstrap replications is the minimum for a 95% percentile CI.** 10,000 or more is better when you need stable tail quantiles. Below 1,000, the edges of the interval jitter noticeably between runs.

### Exercise 8: CI for regression coefficients

Fit `lm(mpg ~ wt, data = mtcars)` and extract the 95% confidence intervals for both the intercept and slope using `confint()`. Store the model in `my_lm_fit` and the CI matrix in `my_coef_ci`. Does the slope CI exclude zero?

```r title="Your turn: regression coefficient CIs"
# Exercise 8: 95% CIs for lm coefficients
# Hint: confint(lm_fit) returns a 2-column matrix

my_lm_fit  <- # your code here
my_coef_ci <- # your code here

round(my_coef_ci, 2)
#> Expected: slope CI strictly below zero
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 8 solution"
my_lm_fit  <- lm(mpg ~ wt, data = mtcars)
my_coef_ci <- confint(my_lm_fit)

round(my_coef_ci, 2)
#>             2.5 % 97.5 %
#> (Intercept) 33.45  41.12
#> wt          -6.49  -4.20
```

**Explanation:** `confint()` builds a CI for each coefficient using the fitted model's estimated standard errors and a t distribution with `n - p` degrees of freedom. The slope CI is `[-6.49, -4.20]`, which strictly excludes zero, so `wt` is a statistically significant predictor of `mpg` at the 5% level. The intercept CI tells you about the implied mpg when `wt = 0` (an extrapolation, but that is the model's statement).

</details>

### Exercise 9: Sample size vs CI width

Generate samples of sizes $n = 25, 100, 400$ from $\mathcal{N}(100, 15^2)$, build 95% CIs for the mean at each sample size, and record the widths in a named vector `my_widths_vs_n`. Verify that each four-fold increase in $n$ roughly halves the width.

```r title="Your turn: how does width scale with n?"
# Exercise 9: CI width vs sample size
# Hint: rnorm(n, 100, 15), then t.test()$conf.int, then diff()

set.seed(314)
ns <- c(25, 100, 400)

width_for_n <- function(n) {
  x <- rnorm(n, mean = 100, sd = 15)
  # your code here
}

my_widths_vs_n <- # your code here

round(my_widths_vs_n, 2)
#> Expected: each width ~half the previous
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 9 solution"
set.seed(314)
ns <- c(25, 100, 400)

width_for_n <- function(n) {
  x <- rnorm(n, mean = 100, sd = 15)
  diff(t.test(x)$conf.int)
}

my_widths_vs_n <- setNames(sapply(ns, width_for_n),
                           paste0("n=", ns))
round(my_widths_vs_n, 2)
#>  n=25 n=100 n=400
#> 14.16  5.74  3.05
```

**Explanation:** Going from `n = 25` to `n = 100` (a 4x increase) roughly halves the width (14.16 to 5.74). Going from 100 to 400 halves it again (5.74 to 3.05). That is the $1/\sqrt{n}$ law in action, which is why sample size planning uses *squared* width targets, not linear ones.

</details>

### Exercise 10: CI for a correlation

Build a 95% CI for the Pearson correlation between `mtcars$mpg` and `mtcars$wt` using `cor.test()`. Store it in `my_cor_ci`. Does it cross zero?

```r title="Your turn: CI for a correlation"
# Exercise 10: 95% CI for cor(mpg, wt)
# Hint: cor.test(x, y)$conf.int

my_cor_ci <- # your code here

round(my_cor_ci, 3)
#> Expected: c(-0.934, -0.744) approximately
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 10 solution"
my_cor_ci <- cor.test(mtcars$mpg, mtcars$wt)$conf.int
round(my_cor_ci, 3)
#> [1] -0.934 -0.744
#> attr(,"conf.level")
#> [1] 0.95
```

**Explanation:** `cor.test()` uses Fisher's z transform to build a CI for the correlation coefficient, then back-transforms to the $[-1, 1]$ scale. The point estimate is `cor(mtcars$mpg, mtcars$wt) = -0.868`, and the CI `[-0.934, -0.744]` is firmly negative, confirming a strong inverse relationship between weight and mileage.

</details>

## Complete Example: End-to-end CI analysis of iris

Putting the pieces together on the `iris` dataset. Four short steps build four different kinds of confidence interval, each answering a different kind of question about the same 150 flowers.

```r title="Step 1: CI for mean Petal.Length"
# Mean CI for petal length across all 150 flowers
cex_pl_ci <- t.test(iris$Petal.Length)$conf.int
round(cex_pl_ci, 2)
#> [1] 3.47 4.05
```

The 95% CI for mean petal length is roughly 3.47 cm to 4.05 cm, a fairly tight interval because the dataset has 150 observations and moderate variability.

```r title="Step 2: CI for proportion of virginica"
# Proportion of flowers that are virginica
n_virginica <- sum(iris$Species == "virginica")
n_total     <- nrow(iris)
cex_prop_ci <- prop.test(n_virginica, n_total)$conf.int
round(cex_prop_ci, 3)
#> [1] 0.268 0.408
```

About one-third of flowers are virginica, and the CI `[0.268, 0.408]` reflects genuine sampling uncertainty at n = 150. If the dataset were perfectly balanced at 50/50/50, the true proportion is 1/3 = 0.333, which falls comfortably inside this interval.

```r title="Step 3: Bootstrap CI for the median Petal.Length"
# Nonparametric CI for the median (no normality assumption)
set.seed(7)
boot_med <- replicate(2000, median(sample(iris$Petal.Length, replace = TRUE)))
cex_boot_ci <- quantile(boot_med, c(0.025, 0.975))
round(cex_boot_ci, 2)
#>  2.5% 97.5%
#>  4.00  4.50
```

The median petal length is less sensitive to outliers than the mean. The bootstrap CI `[4.00, 4.50]` is narrow and sits above the mean CI from Step 1 because petal length is right-skewed across species.

```r title="Step 4: Regression CI for Petal.Length ~ Sepal.Length"
# How much does petal length grow per extra cm of sepal length?
cex_lm    <- lm(Petal.Length ~ Sepal.Length, data = iris)
cex_lm_ci <- confint(cex_lm)
round(cex_lm_ci, 2)
#>               2.5 % 97.5 %
#> (Intercept)   -8.48  -6.20
#> Sepal.Length   1.73   2.11
```

For every extra cm of sepal length, petal length grows by 1.73 cm to 2.11 cm (95% confidence). The slope interval excludes zero by a wide margin, so the relationship is clearly real. Four different estimators, four different CI recipes, one dataset, and each interval tells you something different about the same flowers.

## Summary

Every confidence interval in R follows the same underlying logic, but the function you use depends on the estimator. Keep this table near the keyboard.

| CI for... | R call | Returns |
|---|---|---|
| Mean, one sample | `t.test(x)` | `$conf.int` |
| Mean, two samples | `t.test(x, y)` | `$conf.int` |
| Mean, paired | `t.test(x, y, paired = TRUE)` | `$conf.int` |
| Proportion | `prop.test(x, n)` | `$conf.int` |
| Median (nonparametric) | `replicate(B, median(sample(x, TRUE)))` + `quantile(...)` | percentile CI |
| Regression coefficients | `confint(lm_fit)` | 2-column matrix |
| Correlation | `cor.test(x, y)` | `$conf.int` |

Takeaways:

1. `t.test()` and `confint()` together cover 80% of the CIs you will ever need.
2. Width shrinks like $1/\sqrt{n}$, so halving a CI costs 4x more data.
3. Reach for the bootstrap when the statistic is nonstandard (median, trimmed mean, custom ratio).
4. Confidence level trades width for coverage: 99% CIs are about 30% wider than 95% CIs on the same sample.
5. Always report the *interval*, not just the point estimate. The CI communicates both effect size and precision in a single object.

## References

1. R Core Team. *`t.test()` reference*. [stat.ethz.ch](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/t.test.html)
2. R Core Team. *`prop.test()` reference*. [stat.ethz.ch](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/prop.test.html)
3. R Core Team. *`confint()` reference*. [stat.ethz.ch](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/confint.html)
4. Wasserman, L. *All of Statistics*. Springer (2004), Chapter 6: Models, Statistical Inference and Learning.
5. Efron, B. and Tibshirani, R. *An Introduction to the Bootstrap*. Chapman & Hall/CRC (1993).
6. OpenStax. *Introductory Statistics*, Chapter 8: Confidence Intervals. [openstax.org](https://openstax.org/details/books/introductory-statistics)
7. Statistics LibreTexts. *8.E: Confidence Intervals (Exercises)*. [stats.libretexts.org](https://stats.libretexts.org/Bookshelves/Introductory_Statistics/Introductory_Statistics_1e_(OpenStax)/08:_Confidence_Intervals/8.E:_Confidence_Intervals_(Exercises))

## Continue Learning

- **Confidence Intervals in R**, the parent explainer covers what a CI is, what it is not, and when the textbook definition trips people up.
- **t-Test Exercises in R**, sister practice set that exercises the other side of `t.test()`, the p-value and the null hypothesis framing.
- **Hypothesis Testing Exercises in R**, drill the decision framework that shares a backbone with every CI on this page.
