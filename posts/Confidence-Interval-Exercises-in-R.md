---
title: "Confidence Interval Exercises in R: 10 Problems with Full Solutions"
slug: Confidence-Interval-Exercises-in-R
description: "Work through 10 R confidence interval exercises: t.test, prop.test, bootstrap CIs, paired samples, regression, and sample-size effects. Full solutions inside."
keywords: "confidence interval exercises in R, R confidence interval practice, t.test confidence interval, prop.test R, bootstrap confidence interval R, confint R, paired t-test CI, regression confidence interval"
auto_link_terms: "confidence interval exercises|CI exercises in R|confidence interval practice problems|confidence interval exercises in R|bootstrap confidence interval exercises"
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

<p class="lead">These 10 confidence interval exercises in R walk from a one-line t.test() through manual qt() formulas, two-sample and paired intervals, bootstrap CIs for the median, regression coefficient intervals, and the sample-size versus width trade-off, with full runnable solutions.</p>

## How do you build a 95% confidence interval in R?

R already hands you a confidence interval every time you run `t.test()`, but most learners skim past that `conf.int` line without realising it is the whole point. Here is a one-liner on `mtcars$mpg` that returns a 95% interval for the true mean mpg, so you see exactly where the interval lives in the output before the exercises start asking you to build intervals yourself.

```r title="Payoff: 95% CI for mean mpg"
# Full t.test output plus the two numbers you actually care about
mpg_ci <- t.test(mtcars$mpg)
mpg_ci
#> 	One Sample t-test
#>
#> data:  mtcars$mpg
#> t = 18.857, df = 31, p-value < 2.2e-16
#> alternative hypothesis: true mean is not equal to 0
#> 95 percent confidence interval:
#>  17.91768 22.26357
#> sample estimates:
#> mean of x
#>  20.09062

mpg_ci$conf.int
#> [1] 17.91768 22.26357
#> attr(,"conf.level")
#> [1] 0.95
```

The 95% CI for the mean mpg of the 32 cars is [17.92, 22.26], with a sample mean of 20.09 sitting comfortably inside. The right way to read this is as a statement about the *procedure*: if we repeated the sampling many times and rebuilt the interval each time, about 95% of those intervals would capture the true mean mpg. The `$conf.int` accessor returns just the two numbers, which is usually all you want for a report.

[TIP]
**Pull $conf.int directly for the two numbers you actually care about.** `t.test()` prints a verbose block, but every R test returns a list, and `$conf.int` gives you the CI you can paste into a report, pipe into a helper, or feed into a plot.

**Try it:** Compute the 95% CI for `iris$Sepal.Length` and store just the lower bound in a variable called `ex_lower`.

```r title="Your turn: lower bound of iris CI"
# Try it: compute the 95% CI for iris$Sepal.Length and save the lower bound
ex_sepal_ci <- t.test(iris$Sepal.Length)$conf.int
ex_lower <- ___   # replace ___ with the first element of ex_sepal_ci
ex_lower
#> Expected: about 5.71
```

<details>
<summary>Click to reveal solution</summary>

```r title="Lower bound solution"
ex_sepal_ci <- t.test(iris$Sepal.Length)$conf.int
ex_lower <- ex_sepal_ci[1]
ex_lower
#> [1] 5.709732
```

**Explanation:** `$conf.int` is a length-2 numeric vector, so bracket-indexing with `[1]` pulls the lower bound. The upper bound is `ex_sepal_ci[2]`. This is the fastest way to extract just one side of a CI when you only need one endpoint.

</details>

## Which R function computes which type of confidence interval?

Not every parameter lives in `t.test()`. R has a small family of CI-producing functions, each tuned to a different statistic: `t.test()` for a mean or difference of means, `prop.test()` for a proportion, `confint()` for any model coefficient, `cor.test()` for a correlation, and a short `replicate` + `sample` + `quantile` recipe for statistics without a closed-form CI. The block below shows the four built-in patterns side-by-side on toy data so you can see the shared shape.

```r title="Four CI functions, same shape"
# 1. Mean with t.test()
t_ex <- t.test(mtcars$mpg)$conf.int
t_ex
#> [1] 17.91768 22.26357
#> attr(,"conf.level")
#> [1] 0.95

# 2. Proportion with prop.test()
p_ex <- prop.test(x = 65, n = 100)$conf.int
p_ex
#> [1] 0.5482466 0.7397328
#> attr(,"conf.level")
#> [1] 0.95

# 3. Regression coefficient with confint()
lm_fit_ex <- lm(mpg ~ wt, data = mtcars)
ci_fit <- confint(lm_fit_ex, level = 0.95)
ci_fit
#>                 2.5 %    97.5 %
#> (Intercept) 33.450500 41.119753
#> wt          -6.486308 -4.202635

# 4. Correlation with cor.test()
cor_ex <- cor.test(mtcars$mpg, mtcars$wt)$conf.int
cor_ex
#> [1] -0.9337874 -0.7440872
#> attr(,"conf.level")
#> [1] 0.95
```

Every interval above is [lower, upper] for a specific parameter, and every function follows the same estimate-plus-critical-value-times-SE recipe under the hood. The difference is only which critical value (t, z, Fisher z-transform) and which SE formula R plugs in for you. Once the shape is familiar, picking the right function for a new question becomes a one-step lookup.

[KEY INSIGHT]
**Every CI is estimate ± critical value × standard error.** The function picks the critical value and the SE for you. `t.test()` uses `qt()` and `sd/sqrt(n)`; `prop.test()` uses a Wilson-score formula; `confint()` uses `qt()` with residual degrees of freedom; `cor.test()` uses a Fisher z-transform. Same skeleton, different bones.

**Try it:** Your manager asks for a 95% CI for the proportion of visitors who clicked an ad, given 92 clicks out of 150 impressions. Pick the right function from the four above and compute the CI.

```r title="Your turn: pick the function"
# Try it: which function computes a CI for a proportion?
ex_fn_choice <- ___(x = 92, n = 150)$conf.int   # replace ___
ex_fn_choice
#> Expected: about [0.535, 0.687]
```

<details>
<summary>Click to reveal solution</summary>

```r title="Pick the function solution"
ex_fn_choice <- prop.test(x = 92, n = 150)$conf.int
ex_fn_choice
#> [1] 0.5347245 0.6873291
#> attr(,"conf.level")
#> [1] 0.95
```

**Explanation:** The question is about a *proportion*, so `prop.test()` is the tool. The CI [0.53, 0.69] is the Wilson-score interval for the true click rate, given a sample click rate of 92/150 ≈ 61.3%.

</details>

## Practice Exercises

The 10 exercises below ramp from a one-line `t.test()` call to bootstrap, regression, and correlation intervals. Every solution uses distinct variables (prefixed `my_`) so your exercise code never overwrites the teaching variables `mpg_ci`, `t_ex`, `ci_fit`, or `cor_ex`.

### Exercise 1: CI for a single mean

Compute the default 95% confidence interval for the mean of `mtcars$mpg` using `t.test()`. Print only the `$conf.int` component and report the sample mean alongside it.

```r title="Exercise 1 starter"
# Exercise 1: 95% CI for mean mtcars$mpg
# Hint: call t.test() and read $conf.int

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_mpg_ci <- t.test(mtcars$mpg)$conf.int
my_mpg_ci
#> [1] 17.91768 22.26357
#> attr(,"conf.level")
#> [1] 0.95
mean(mtcars$mpg)
#> [1] 20.09062
```

**Explanation:** `t.test()` defaults to 95% confidence. The CI [17.92, 22.26] flanks the sample mean of 20.09, which it will always do for a symmetric t-interval.

</details>

### Exercise 2: CI for a proportion

An A/B test shows 92 clicks out of 150 impressions. Compute the 95% CI for the true click-through rate using `prop.test()`, and also report the point estimate.

```r title="Exercise 2 starter"
# Exercise 2: CI for 92 clicks out of 150 impressions
# Hint: prop.test(x, n) with x = successes, n = trials

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
my_prop_ci <- prop.test(x = 92, n = 150)$conf.int
my_prop_ci
#> [1] 0.5347245 0.6873291
#> attr(,"conf.level")
#> [1] 0.95
92 / 150
#> [1] 0.6133333
```

**Explanation:** The Wilson-score CI [0.53, 0.69] is asymmetric around the point estimate 0.613 because it pulls the centre a touch toward 0.5. That is the intentional bias correction that keeps the interval inside [0, 1] even for small counts.

</details>

### Exercise 3: Manual CI using qt()

Build the 95% t-CI for `mtcars$mpg` from scratch using `mean()`, `sd()`, `length()`, and `qt()`. Verify your result matches `t.test()` to four decimal places.

```r title="Exercise 3 starter"
# Exercise 3: manual 95% t-CI for mtcars$mpg
# Hint: lower = mean - qt(0.975, df = n - 1) * sd / sqrt(n); upper analogous

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
x <- mtcars$mpg
n <- length(x)
m <- mean(x)
s <- sd(x)
tcrit <- qt(0.975, df = n - 1)

my_manual_ci <- c(lower = m - tcrit * s / sqrt(n),
                  upper = m + tcrit * s / sqrt(n))
my_manual_ci
#>    lower    upper
#> 17.91768 22.26357

all.equal(as.numeric(my_manual_ci), as.numeric(t.test(x)$conf.int))
#> [1] TRUE
```

**Explanation:** The manual CI matches `t.test()` to every visible digit because `t.test()` uses the same formula. Running the calculation by hand once cements that `t.test()` is a convenience wrapper, not a black box.

</details>

### Exercise 4: CI for a difference of means

From `mtcars`, compute the 95% CI for the difference in mean mpg between 4-cylinder and 8-cylinder cars. Use Welch's test (do not assume equal variances). State whether 0 is a plausible value for the true difference.

```r title="Exercise 4 starter"
# Exercise 4: CI for mean mpg difference, 4-cyl vs 8-cyl
# Hint: subset mtcars to cyl %in% c(4, 8), then t.test(mpg ~ cyl, data = ...)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 4 solution"
my_sub <- subset(mtcars, cyl %in% c(4, 8))
my_diff_ci <- t.test(mpg ~ cyl, data = my_sub)
my_diff_ci$conf.int
#> [1]  8.318518 14.801932
#> attr(,"conf.level")
#> [1] 0.95
my_diff_ci$estimate
#> mean in group 4 mean in group 8
#>        26.66364        11.10000
```

**Explanation:** The CI for (4-cyl minus 8-cyl) mpg is [8.32, 14.80], well above zero. Four-cylinder cars average 8 to 15 more mpg than eight-cylinder cars; zero is not a plausible value for the true difference at 95% confidence.

</details>

### Exercise 5: Paired-sample CI

R's built-in `sleep` dataset records the extra hours of sleep for 10 subjects under two drugs. Compute the 95% CI for the mean within-subject difference using `t.test()` with `paired = TRUE`.

```r title="Exercise 5 starter"
# Exercise 5: paired CI on sleep data
# Hint: t.test(extra ~ group, data = sleep, paired = TRUE)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 5 solution"
my_paired_ci <- t.test(extra ~ group, data = sleep, paired = TRUE)
my_paired_ci$conf.int
#> [1] -2.4598858 -0.7001142
#> attr(,"conf.level")
#> [1] 0.95
my_paired_ci$estimate
#> mean difference
#>           -1.58
```

**Explanation:** The CI for (group 1 minus group 2) is [-2.46, -0.70], entirely below zero, so drug 2 produces 0.7 to 2.5 hours more extra sleep than drug 1 on average. Paired tests credit the within-subject structure and usually produce tighter CIs than the independent-samples version on the same data.

</details>

### Exercise 6: CI width versus confidence level

On `mtcars$mpg`, compute 90%, 95%, and 99% CIs. Report the width of each interval and verify that higher confidence always produces a wider interval.

```r title="Exercise 6 starter"
# Exercise 6: width at three confidence levels
# Hint: loop or sapply over c(0.90, 0.95, 0.99); use diff() on each $conf.int

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 6 solution"
my_widths <- sapply(c(0.90, 0.95, 0.99), function(lvl) {
  diff(t.test(mtcars$mpg, conf.level = lvl)$conf.int)
})
names(my_widths) <- c("90%", "95%", "99%")
my_widths
#>      90%      95%      99%
#> 3.612893 4.345886 5.902974
```

**Explanation:** Width grows monotonically with confidence level because the t quantile grows: `qt(0.95, 31) ≈ 1.696`, `qt(0.975, 31) ≈ 2.040`, `qt(0.995, 31) ≈ 2.744`. The 99% CI is about 63% wider than the 90% CI on the same data.

</details>

### Exercise 7: Bootstrap CI for the median

R has no built-in CI for a median, so resample. Using `replicate()`, `sample(..., replace = TRUE)`, and `quantile()`, build a 95% percentile bootstrap CI for the median of `mtcars$mpg` with 2000 resamples. Set `set.seed(7)` for reproducibility.

```r title="Exercise 7 starter"
# Exercise 7: bootstrap 95% percentile CI for the median of mtcars$mpg
# Hint:
#   set.seed(7)
#   boots <- replicate(2000, median(sample(mtcars$mpg, replace = TRUE)))
#   quantile(boots, c(0.025, 0.975))

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 7 solution"
set.seed(7)
my_boot_medians <- replicate(2000, median(sample(mtcars$mpg, replace = TRUE)))
my_boot_ci <- quantile(my_boot_medians, c(0.025, 0.975))
my_boot_ci
#>    2.5%   97.5%
#> 16.4000 21.4000
median(mtcars$mpg)
#> [1] 19.2
```

**Explanation:** The percentile bootstrap CI for the median mpg is [16.4, 21.4], bracketing the sample median 19.2. The recipe generalises: swap `median` for any statistic (trimmed mean, IQR, custom function) and the same three lines still produce a valid CI.

</details>

### Exercise 8: CI for regression coefficients

Fit a linear model of `mpg ~ wt` on `mtcars` and compute the 95% CIs for both coefficients using `confint()`. State what it means that the CI for the `wt` slope excludes zero.

```r title="Exercise 8 starter"
# Exercise 8: 95% CIs for intercept and slope of mpg ~ wt
# Hint: lm() then confint()

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 8 solution"
my_fit <- lm(mpg ~ wt, data = mtcars)
my_fit_ci <- confint(my_fit, level = 0.95)
my_fit_ci
#>                 2.5 %    97.5 %
#> (Intercept) 33.450500 41.119753
#> wt          -6.486308 -4.202635
```

**Explanation:** The CI for the `wt` slope is [-6.49, -4.20], fully below zero. Every extra 1000 lbs of weight is associated with a 4.2 to 6.5 mpg drop at 95% confidence, and zero is not plausible — which is the interval-based version of "the slope is statistically significant."

</details>

### Exercise 9: Sample size versus CI width

Simulate samples of size 25, 100, and 400 from `rnorm(n, mean = 10, sd = 3)` and report the 95% CI width for each. Set `set.seed(9)` first. Verify that quadrupling the sample size roughly halves the CI width, as theory predicts.

```r title="Exercise 9 starter"
# Exercise 9: CI width vs sample size
# Hint: set.seed(9); sapply over c(25, 100, 400); diff(t.test(x)$conf.int)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 9 solution"
set.seed(9)
my_widths_n <- sapply(c(25, 100, 400), function(n) {
  x <- rnorm(n, mean = 10, sd = 3)
  diff(t.test(x)$conf.int)
})
names(my_widths_n) <- c("n=25", "n=100", "n=400")
my_widths_n
#>     n=25    n=100    n=400
#> 2.378057 1.153321 0.599459
```

**Explanation:** Width scales with 1/sqrt(n). Going from n = 25 to n = 100 (4x sample size) cut the width roughly in half (2.38 → 1.15). Going from n = 100 to n = 400 halved it again (1.15 → 0.60). Precision compounds, but sub-linearly — you need four times the data to halve the interval.

</details>

### Exercise 10: CI for a correlation

Compute the 95% CI for the Pearson correlation between `mpg` and `wt` in `mtcars` using `cor.test()`. Report the point estimate and the CI, and state whether zero correlation is a plausible value.

```r title="Exercise 10 starter"
# Exercise 10: 95% CI for correlation between mpg and wt
# Hint: cor.test(x, y) returns $estimate and $conf.int

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 10 solution"
my_cor <- cor.test(mtcars$mpg, mtcars$wt)
my_cor$estimate
#>        cor
#> -0.8676594
my_cor$conf.int
#> [1] -0.9337874 -0.7440872
#> attr(,"conf.level")
#> [1] 0.95
```

**Explanation:** The Pearson correlation is -0.868, with a 95% CI of [-0.93, -0.74]. The interval sits well below zero, so a true correlation of zero is not plausible. `cor.test()` uses a Fisher z-transform internally, which is why the CI is asymmetric around the point estimate.

</details>

## Complete Example

Suppose an analyst wants a full CI-driven summary of the `iris` dataset: the mean petal length overall, the proportion of rows that are *virginica*, a non-parametric interval for the median petal length, and the slope of the `Petal.Length ~ Sepal.Length` regression. The four-step workflow below runs each CI in turn and interprets every result.

```r title="Step 1: mean CI for Petal.Length"
cex_pl_ci <- t.test(iris$Petal.Length)$conf.int
cex_pl_ci
#> [1] 3.473185 3.958815
#> attr(,"conf.level")
#> [1] 0.95
mean(iris$Petal.Length)
#> [1] 3.758
```

The 95% CI [3.47, 3.96] is tight because n = 150 is generous. Mean petal length is 3.76 cm with low uncertainty.

```r title="Step 2: proportion CI for is_virginica"
cex_n_virg <- sum(iris$Species == "virginica")
cex_prop_ci <- prop.test(x = cex_n_virg, n = nrow(iris))$conf.int
cex_prop_ci
#> [1] 0.2687938 0.4024475
#> attr(,"conf.level")
#> [1] 0.95
```

The CI [0.269, 0.402] covers exactly one-third because the dataset is balanced by design (50/150 per species). The CI width is a sanity check on the sample size.

```r title="Step 3: bootstrap median CI for Petal.Length"
set.seed(123)
cex_boots <- replicate(2000, median(sample(iris$Petal.Length, replace = TRUE)))
cex_boot_ci <- quantile(cex_boots, c(0.025, 0.975))
cex_boot_ci
#>  2.5% 97.5%
#>  4.20  4.40
```

The median petal length bootstrap CI is [4.20, 4.40] — a narrow window because the median is dominated by the middle of the dataset, which has clear structure (the boundary between versicolor and virginica).

```r title="Step 4: regression slope CI"
cex_lm <- lm(Petal.Length ~ Sepal.Length, data = iris)
cex_lm_ci <- confint(cex_lm, level = 0.95)
cex_lm_ci
#>                  2.5 %    97.5 %
#> (Intercept)  -7.887094 -6.540944
#> Sepal.Length  1.782144  2.023576
```

The slope CI [1.78, 2.02] does not include zero, so each 1 cm increase in sepal length is associated with 1.78 to 2.02 cm more petal length at 95% confidence. Four different CIs, four different questions, all with the same [lower, upper] shape.

## Summary

| CI type | R function | Key argument |
|---|---|---|
| Mean, single sample | `t.test()` | `conf.level` |
| Mean, two independent samples | `t.test(x, y)` | `var.equal` |
| Mean, paired | `t.test(x, y, paired = TRUE)` | — |
| Proportion | `prop.test(x, n)` | `correct` |
| Median (non-parametric) | `replicate` + `sample` + `quantile` | `quantile(..., c(.025, .975))` |
| Regression coefficient | `confint(lm_fit)` | `level` |
| Correlation | `cor.test(x, y)` | — |

## References

1. R Core Team. `stats::t.test` reference. [R manual](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/t.test.html)
2. R Core Team. `stats::prop.test` reference. [R manual](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/prop.test.html)
3. R Core Team. `stats::confint` reference. [R manual](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/confint.html)
4. Wasserman, L. *All of Statistics*. Springer (2004), Chapter 6. [Link](https://link.springer.com/book/10.1007/978-0-387-21736-9)
5. Efron, B. and Tibshirani, R. J. *An Introduction to the Bootstrap*. CRC (1993). [Link](https://www.routledge.com/An-Introduction-to-the-Bootstrap/Efron-Tibshirani/p/book/9780412042317)
6. Illowsky, B. and Dean, S. *Introductory Statistics*, Chapter 8 — Confidence Intervals. OpenStax. [Link](https://openstax.org/details/books/introductory-statistics)
7. Statistics LibreTexts. *Confidence Intervals (Exercises)*. [Link](https://stats.libretexts.org/Bookshelves/Introductory_Statistics)

## Continue Learning

- **Confidence Intervals in R: The Definition Most Textbooks State Incorrectly** — the parent explainer behind these exercises, covering theory and the frequentist-versus-Bayesian interpretation trap.
- **t-Test Exercises in R** — sister practice set focused on means and differences.
- **Hypothesis Testing Exercises in R** — the p-value twin of this exercise set; every CI corresponds to a test.
