---
title: "Confidence Interval Exercises in R: 18 Practice Problems"
slug: "Confidence-Interval-Exercises-in-R"
description: "Practice 18 confidence interval exercises in R: t.test, prop.test, bootstrap CIs, paired samples, regression intervals, and sample-size width trade-offs."
keywords: "confidence interval exercises in R, R confidence interval practice, t.test confidence interval, prop.test R, bootstrap confidence interval R, confint R, paired t-test CI, regression confidence interval"
mathjax: true
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "Confidence Interval (18 problems)"
sidebar_order: 145
fr_parent: "Confidence-Intervals-in-R.html"
auto_link_terms: "confidence interval exercises|confidence interval practice|bootstrap confidence interval exercises|confint exercises|t.test confidence interval practice|prop.test confidence interval exercises"
auto_link_case_sensitive: false
target_keyword: "confidence interval exercises in R"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Confidence Interval Exercises in R: 18 Practice Problems

<p class="lead">Eighteen practice problems on confidence intervals in R: one-sample means with `t.test()`, manual `qt()` and `qnorm()` formulas, two-sample and paired intervals, `prop.test()` for proportions, bootstrap CIs, regression coefficient intervals, and the sample-size versus width trade-off. Solutions are hidden under each problem.</p>

```r title="Run this once before any exercise"
library(dplyr)
library(boot)
library(ggplot2)
```

## Section 1. One-sample mean intervals with t.test (4 problems)

### Exercise 1.1: Build a 95% CI for the mean mpg of mtcars

**Task:** Use `t.test()` on `mtcars$mpg` to obtain a 95% confidence interval for the population mean mpg. Pull the two-element `conf.int` vector (not the whole printed object) and save it to `ex_1_1`. The point of this exercise is that R hands you the interval directly, no manual formula needed.

**Expected result:**

```
#> [1] 17.91768 22.26357
#> attr(,"conf.level")
#> [1] 0.95
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- t.test(mtcars$mpg)$conf.int
ex_1_1
#> [1] 17.91768 22.26357
#> attr(,"conf.level")
#> [1] 0.95
```

**Explanation:** `t.test()` does a one-sample t-test against the default null mean of zero, but the `$conf.int` element is the same regardless of the null because it is built from the t critical value, the sample mean, and the standard error. Pulling `$conf.int` keeps the result tidy: a length-2 numeric vector with a `conf.level` attribute, easy to `round()`, `diff()`, or feed into a report. The full `print()` output mixes the interval with hypothesis-test machinery you do not need.

</details>

### Exercise 1.2: Switch the confidence level from 95% to 99%

**Task:** Repeat Exercise 1.1 but compute a 99% confidence interval for `mtcars$mpg` instead of the default 95%. Pass `conf.level = 0.99` to `t.test()` and save the resulting interval to `ex_1_2`. Notice the interval widens because higher confidence means more coverage.

**Expected result:**

```
#> [1] 17.16924 23.01201
#> attr(,"conf.level")
#> [1] 0.99
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- t.test(mtcars$mpg, conf.level = 0.99)$conf.int
ex_1_2
#> [1] 17.16924 23.01201
#> attr(,"conf.level")
#> [1] 0.99
```

**Explanation:** Raising `conf.level` from 0.95 to 0.99 pushes the t critical value from roughly 2.04 to 2.74 (with `df = 31`), so the half-width multiplier grows by about 34%. The point estimate `mean(mtcars$mpg) = 20.09` is unchanged, but the interval stretches further on both sides. This is the fundamental width-versus-confidence trade-off: you cannot be more sure without being less precise unless you collect more data.

</details>

### Exercise 1.3: CI for a subgroup using filter then t.test

**Task:** An automotive analyst wants a 95% CI for the mean mpg of 6-cylinder cars only. Filter `mtcars` to rows where `cyl == 6`, pass `mpg` through `t.test()`, and save the interval to `ex_1_3`. The subgroup has only seven cars, so expect a noticeably wider interval than the all-cars version from Exercise 1.1.

**Expected result:**

```
#> [1] 18.84236 21.21192
#> attr(,"conf.level")
#> [1] 0.95
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
six_cyl_mpg <- mtcars$mpg[mtcars$cyl == 6]
ex_1_3 <- t.test(six_cyl_mpg)$conf.int
ex_1_3
#> [1] 18.84236 21.21192
#> attr(,"conf.level")
#> [1] 0.95
```

**Explanation:** With `n = 7`, the t critical value (df = 6) is about 2.45 versus roughly 2.04 for the full sample, but the bigger driver is the smaller `n` in the standard error denominator. Subgroup intervals are almost always wider than full-sample intervals at the same confidence level. A tidyverse one-liner like `mtcars |> filter(cyl == 6) |> pull(mpg) |> t.test() |> _$conf.int` produces the same numbers in pipeline-friendly style.

</details>

### Exercise 1.4: CI on log-transformed data and back-transformation

**Task:** Skewed measurements often need a log transform before applying a t-interval. Take the natural log of `mtcars$disp`, compute a 95% CI for the mean of the log values with `t.test()`, then exponentiate both endpoints to get an interval for the geometric mean of `disp`. Save the back-transformed two-element vector to `ex_1_4`.

**Expected result:**

```
#> [1] 165.0907 263.7406
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
log_ci  <- t.test(log(mtcars$disp))$conf.int
ex_1_4  <- exp(as.numeric(log_ci))
ex_1_4
#> [1] 165.0907 263.7406
```

**Explanation:** The t-interval assumes approximately symmetric (near-normal) data. Engine displacement is right-skewed, so the interval on raw `disp` would be inflated by the long tail. Logging straightens the distribution, the t-interval is valid on the log scale, and `exp()` maps it back. The back-transformed bounds are an interval for the geometric mean, not the arithmetic mean, that is the cost of the transformation, but it is the right summary for multiplicative quantities like displacement, income, or concentration.

</details>

## Section 2. Manual CI construction with qt and qnorm (3 problems)

### Exercise 2.1: Reconstruct a t-interval from sample mean, sd, and qt

**Task:** Without calling `t.test()`, compute a 95% CI for `mtcars$mpg` from scratch using the formula $\bar{x} \pm t_{\alpha/2,\,n-1} \cdot s/\sqrt{n}$. Use `mean()`, `sd()`, `length()`, and `qt()`, and save the two-element interval to `ex_2_1`. The result should match Exercise 1.1 to at least four decimals.

**Expected result:**

```
#> [1] 17.91768 22.26357
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
x   <- mtcars$mpg
n   <- length(x)
m   <- mean(x)
se  <- sd(x) / sqrt(n)
tcr <- qt(0.975, df = n - 1)
ex_2_1 <- m + c(-1, 1) * tcr * se
ex_2_1
#> [1] 17.91768 22.26357
```

**Explanation:** This is what `t.test()` does internally. `qt(0.975, df = n - 1)` is the upper 2.5% t critical value, so it covers the central 95% region. Note `c(-1, 1)` is a vectorisation trick: multiplying scalar `tcr * se` by the length-2 vector produces the lower-then-upper endpoints in one line. A common error is using `qt(0.95, ...)` (one-sided) instead of `qt(0.975, ...)` (two-sided), that gives a 90% interval, not 95%.

</details>

### Exercise 2.2: Build a z-interval when sigma is known

**Task:** A factory tech knows the historical standard deviation of part weights is `sigma = 0.15` grams. From a fresh sample of 40 parts with sample mean 50.12 g, build a 95% z-interval (not a t-interval) using `qnorm()`. Save the two-element vector to `ex_2_2`. This is the textbook normal-distribution interval that applies when population sigma is treated as known.

**Expected result:**

```
#> [1] 50.07352 50.16648
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
m     <- 50.12
sigma <- 0.15
n     <- 40
zcr   <- qnorm(0.975)
se    <- sigma / sqrt(n)
ex_2_2 <- m + c(-1, 1) * zcr * se
ex_2_2
#> [1] 50.07352 50.16648
```

**Explanation:** When `sigma` is known you use `qnorm(0.975) = 1.959964` instead of a t critical value, so degrees of freedom never enter. In practice you almost never have a truly known sigma, the t-interval is the safer default. The z-interval is narrower because it does not pay the "we estimated sigma from data" penalty that pushes the t critical value above 1.96 at small `n`. For `n >= 50` and unknown sigma, the t and z intervals agree to two decimals.

</details>

### Exercise 2.3: Compare manual half-width to t.test half-width

**Task:** For `iris$Sepal.Length` (n = 150), compute the half-width $t \cdot s/\sqrt{n}$ of a 95% CI manually, then compute `diff(t.test(iris$Sepal.Length)$conf.int)/2` from `t.test()`, and save both values into a named numeric vector `ex_2_3 = c(manual = ..., from_ttest = ...)`. They should match.

**Expected result:**

```
#>     manual from_ttest 
#>  0.1336786  0.1336786
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
x       <- iris$Sepal.Length
n       <- length(x)
half_m  <- qt(0.975, df = n - 1) * sd(x) / sqrt(n)
half_t  <- diff(t.test(x)$conf.int) / 2
ex_2_3  <- c(manual = half_m, from_ttest = unname(half_t))
ex_2_3
#>     manual from_ttest 
#>  0.1336786  0.1336786
```

**Explanation:** The half-width is the part of the interval that depends on data and confidence level, useful when you only care about precision and not the centre. `diff(conf.int)` gives the full width; dividing by 2 yields the half-width that appears in margin-of-error reporting. The two routes agree exactly because `t.test()` uses the same formula internally. `unname()` strips the leftover name from `diff()` so the final named vector has the names you assigned.

</details>

## Section 3. Two-sample and paired intervals (3 problems)

### Exercise 3.1: Welch CI for the difference in mean mpg by transmission

**Task:** A reviewer is preparing a buyer guide and wants a 95% CI for the difference in mean `mpg` between manual (`am == 1`) and automatic (`am == 0`) cars in `mtcars`. Use `t.test()` with `mpg ~ am` (formula interface) and save the resulting `$conf.int` to `ex_3_1`. R subtracts level 0 minus level 1 by default, so the sign tells you which group has higher mpg.

**Expected result:**

```
#> [1] -11.280194  -3.209684
#> attr(,"conf.level")
#> [1] 0.95
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- t.test(mpg ~ am, data = mtcars)$conf.int
ex_3_1
#> [1] -11.280194  -3.209684
#> attr(,"conf.level")
#> [1] 0.95
```

**Explanation:** `t.test()` with a formula does a Welch two-sample test (unequal variances by default), which is the safer choice when you have no evidence that group SDs match. The interval `[-11.28, -3.21]` is for `mean(am=0) - mean(am=1)`, both endpoints negative, meaning automatics have lower mpg, and the difference is between 3.2 and 11.3 mpg with 95% confidence. The interval excludes zero, so the difference is also statistically significant at alpha = 0.05.

</details>

### Exercise 3.2: Paired CI for ToothGrowth supplement difference at the same dose

**Task:** A pharmacology team studied tooth length in guinea pigs (`ToothGrowth`) under two supplements (`OJ` and `VC`) at three doses. Treat the doses as paired (matched by dose level), filter to `dose == 1.0`, and compute a 95% paired CI for the difference `OJ - VC` in `len`. Use `t.test(..., paired = TRUE)` and save `$conf.int` to `ex_3_2`.

**Expected result:**

```
#> [1] -1.443588 11.443588
#> attr(,"conf.level")
#> [1] 0.95
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
oj <- ToothGrowth$len[ToothGrowth$supp == "OJ" & ToothGrowth$dose == 1.0]
vc <- ToothGrowth$len[ToothGrowth$supp == "VC" & ToothGrowth$dose == 1.0]
ex_3_2 <- t.test(oj, vc, paired = TRUE)$conf.int
ex_3_2
#> [1] -1.443588 11.443588
#> attr(,"conf.level")
#> [1] 0.95
```

**Explanation:** Pairing assumes a meaningful 1-to-1 correspondence between observations in the two groups (here, by row order within the filtered slice). The paired t-interval is the t-interval of the differences `oj - vc`, so it has `n - 1 = 9` degrees of freedom rather than the two-sample's roughly 18. Pairing removes between-subject variance, narrowing the interval whenever the two measurements are positively correlated within a subject. The interval here includes zero, so the OJ-vs-VC difference at dose 1.0 is not statistically significant.

</details>

### Exercise 3.3: Pooled-variance two-sample CI with var.equal = TRUE

**Task:** Repeat Exercise 3.1 (mpg by transmission) but assume the two groups have equal variance and use the pooled-variance Student t-interval by passing `var.equal = TRUE` to `t.test()`. Save `$conf.int` to `ex_3_3` and compare its width to the Welch interval from `ex_3_1`.

**Expected result:**

```
#> [1] -10.84837  -3.64151
#> attr(,"conf.level")
#> [1] 0.95
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- t.test(mpg ~ am, data = mtcars, var.equal = TRUE)$conf.int
ex_3_3
#> [1] -10.84837  -3.64151
#> attr(,"conf.level")
#> [1] 0.95

diff(ex_3_3); diff(t.test(mpg ~ am, data = mtcars)$conf.int)
#> [1] 7.206862
#> [1] 8.07051
```

**Explanation:** The pooled-variance interval is slightly narrower than Welch here (width about 7.21 versus 8.07) because pooling buys back degrees of freedom (30 vs Welch's roughly 18.3 for this split). The catch: if the equal-variance assumption is wrong, the pooled interval can be wildly off in coverage, Welch is robust either way. As a rule, use Welch unless you have strong prior reason to believe variances are equal (e.g., randomised assignment in a clean experiment).

</details>

## Section 4. Proportions and counts (3 problems)

### Exercise 4.1: Wilson CI for the proportion of high-mpg cars

**Task:** Define a "high-mpg" car as one with `mpg > 20` in `mtcars`. Count the number of such cars (`x`) out of `n = 32`, then build a 95% Wilson-score CI for the population proportion using `prop.test()` with `correct = FALSE` (no continuity correction). Save `$conf.int` to `ex_4_1`. The Wilson interval is the default in `prop.test()` and behaves well even at small `n`.

**Expected result:**

```
#> [1] 0.2904794 0.6347455
#> attr(,"conf.level")
#> [1] 0.95
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
x  <- sum(mtcars$mpg > 20)
n  <- nrow(mtcars)
ex_4_1 <- prop.test(x, n, correct = FALSE)$conf.int
ex_4_1
#> [1] 0.2904794 0.6347455
#> attr(,"conf.level")
#> [1] 0.95
```

**Explanation:** The Wilson interval is what most modern stats texts now recommend over the textbook normal-approximation interval ($\hat{p} \pm 1.96\sqrt{\hat{p}(1-\hat{p})/n}$), which can produce nonsensical bounds below 0 or above 1 at extreme proportions. `prop.test()` returns the Wilson interval by default. With `correct = TRUE` (the default), R applies a Yates continuity correction that widens the interval slightly; setting `correct = FALSE` gives the cleaner uncorrected Wilson endpoints used in most teaching material.

</details>

### Exercise 4.2: Clopper-Pearson exact CI with binom.test

**Task:** A pharma analyst running a small trial saw 3 responders out of 10 patients. Build a 95% exact (Clopper-Pearson) confidence interval for the response rate using `binom.test(3, 10)` and save `$conf.int` to `ex_4_2`. Exact intervals are conservative but always have at least the stated coverage even at tiny samples.

**Expected result:**

```
#> [1] 0.06673951 0.65245285
#> attr(,"conf.level")
#> [1] 0.95
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- binom.test(3, 10)$conf.int
ex_4_2
#> [1] 0.06673951 0.65245285
#> attr(,"conf.level")
#> [1] 0.95
```

**Explanation:** With only `n = 10`, a normal-approximation interval is unreliable, so the Clopper-Pearson exact interval is the conservative go-to. It inverts the exact binomial test, guaranteeing coverage at least 95% (often more, that is the conservatism cost). The width here, roughly 0.59, reflects the genuine uncertainty when 3 events out of 10 could plausibly come from a true rate anywhere from 7% to 65%. Compare against `prop.test(3, 10)$conf.int` to see how the Wilson interval (the other small-sample option) is slightly narrower.

</details>

### Exercise 4.3: CI for the difference of two proportions with prop.test

**Task:** A marketing team A/B-tested two landing pages. Variant A got 120 conversions out of 1000 visitors, variant B got 150 out of 1000. Compute a 95% CI for the difference `pA - pB` in conversion rates using `prop.test(c(120, 150), c(1000, 1000), correct = FALSE)` and save `$conf.int` to `ex_4_3`.

**Expected result:**

```
#> [1] -0.058871537 -0.001128463
#> attr(,"conf.level")
#> [1] 0.95
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- prop.test(c(120, 150), c(1000, 1000), correct = FALSE)$conf.int
ex_4_3
#> [1] -0.058871537 -0.001128463
#> attr(,"conf.level")
#> [1] 0.95
```

**Explanation:** `prop.test()` accepts two-element vectors for `x` (successes) and `n` (totals) to compute a CI for the difference. The interval is entirely negative, so variant A converts at a lower rate than B by between 0.1 and 5.9 percentage points with 95% confidence. Because the upper bound is right at -0.0011, the result is barely significant at alpha = 0.05; if you had run with `correct = TRUE`, the slightly wider interval would just cross zero. This is exactly the kind of "borderline call" where reporting the interval, not just the p-value, lets stakeholders see how thin the evidence is.

</details>

## Section 5. Bootstrap and regression intervals (3 problems)

### Exercise 5.1: Bootstrap percentile CI for the median of mpg

**Task:** The sample median has no clean closed-form CI like the mean does, so a bootstrap is the standard tool. Using `boot::boot()` with `R = 2000` resamples and `set.seed(1)`, compute a 95% percentile bootstrap CI for `median(mtcars$mpg)` and save the two-element percentile interval (the `bca$percent[4:5]` from `boot.ci`) to `ex_5_1`. The percentile interval is the simplest bootstrap CI and uses the 2.5% and 97.5% quantiles of the resampled statistics.

**Expected result:**

```
#> [1] 17.30 22.80
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
med_fun <- function(d, i) median(d[i])
bo      <- boot(mtcars$mpg, statistic = med_fun, R = 2000)
ci_obj  <- boot.ci(bo, type = "perc", conf = 0.95)
ex_5_1  <- as.numeric(ci_obj$percent[4:5])
ex_5_1
#> [1] 17.30 22.80
```

**Explanation:** Each bootstrap iteration resamples the data with replacement and recomputes the statistic; with `R = 2000` you get an empirical sampling distribution of the median, and the central 95% range of that distribution is the percentile CI. `boot.ci()` returns several CI types, `perc` is the simplest, `bca` is bias-corrected and usually better when the bootstrap distribution is skewed. Always set a seed before `boot()` so the interval is reproducible; the percentile endpoints can wobble by a few units of the last decimal place between runs.

</details>

### Exercise 5.2: CI for a regression coefficient with confint

**Task:** Fit a linear regression of `mpg` on `wt` and `hp` in `mtcars`, then pull the 95% confidence intervals for both slope coefficients using `confint()`. Save the resulting two-row matrix (rows = `wt`, `hp`; columns = `2.5 %`, `97.5 %`) to `ex_5_2`. The interval for `wt` is the range of plausible per-1000-lb mpg effects after adjusting for horsepower.

**Expected result:**

```
#>           2.5 %       97.5 %
#> wt  -5.17191604 -2.583636083
#> hp  -0.05024078 -0.005249136
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit    <- lm(mpg ~ wt + hp, data = mtcars)
ex_5_2 <- confint(fit, parm = c("wt", "hp"), level = 0.95)
ex_5_2
#>           2.5 %       97.5 %
#> wt  -5.17191604 -2.583636083
#> hp  -0.05024078 -0.005249136
```

**Explanation:** `confint()` uses the t critical value with `df = n - p - 1` (here 29) and the coefficient standard error from `summary(fit)$coefficients` to build each interval. Both intervals are entirely negative, so each predictor has a negative partial effect on mpg holding the other constant. The interval width matters as much as significance: the `hp` interval is tight near zero (effect is small but precise), while the `wt` interval is wide (effect is large but the magnitude is uncertain). Reporting both endpoints in a paper is far more informative than reporting only the p-value.

</details>

### Exercise 5.3: 95% prediction band on a fitted regression line

**Task:** Fit `lm(mpg ~ wt, data = mtcars)`, then use `predict()` with `interval = "confidence"` on a grid of `wt` values from 1.5 to 5.5 in steps of 0.5 to get the mean-response confidence band. Save the resulting matrix (columns `fit`, `lwr`, `upr`) to `ex_5_3`. This is the band that gets shaded around `geom_smooth(method = "lm")` plots.

**Expected result:**

```
#>        fit      lwr      upr
#> 1 33.74040 31.04606 36.43474
#> 2 30.85125 28.74371 32.95879
#> 3 27.96210 26.34607 29.57813
#> 4 25.07294 23.79140 26.35449
#> 5 22.18379 20.99175 23.37584
#> 6 19.29464 17.85986 20.72943
#> 7 16.40549 14.59024 18.22075
#> 8 13.51635 11.21506 15.81763
#> 9 10.62720  7.77437 13.48003
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit    <- lm(mpg ~ wt, data = mtcars)
grid   <- data.frame(wt = seq(1.5, 5.5, by = 0.5))
ex_5_3 <- predict(fit, newdata = grid, interval = "confidence", level = 0.95)
ex_5_3
#>        fit      lwr      upr
#> 1 33.74040 31.04606 36.43474
#> 2 30.85125 28.74371 32.95879
#> 3 27.96210 26.34607 29.57813
#> 4 25.07294 23.79140 26.35449
#> 5 22.18379 20.99175 23.37584
#> 6 19.29464 17.85986 20.72943
#> 7 16.40549 14.59024 18.22075
#> 8 13.51635 11.21506 15.81763
#> 9 10.62720  7.77437 13.48003
```

**Explanation:** A confidence band is the interval for the conditional mean `E(mpg | wt)`, not for a single new observation, that wider one is `interval = "prediction"`. The band is narrowest near the centre of the predictor distribution (around `mean(wt) = 3.22`) and fans out at the extremes because extrapolation amplifies coefficient uncertainty. This is also the band `ggplot2::geom_smooth(method = "lm", se = TRUE)` renders by default with `level = 0.95`; building it manually is what you do when you need the numbers for a table or downstream code.

</details>

## Section 6. Sample size, width, and coverage (2 problems)

### Exercise 6.1: How does CI width shrink as n grows from 30 to 1000

**Task:** Set `sigma = 1` and `alpha = 0.05`. For `n` in `c(30, 100, 300, 1000)`, compute the half-width of a 95% z-interval, $z_{0.975}\cdot \sigma/\sqrt{n}$, and assemble a tibble with columns `n` and `half_width`. Save the tibble to `ex_6_1`. Width is governed by $1/\sqrt{n}$, so quadrupling `n` halves the half-width.

**Expected result:**

```
#> # A tibble: 4 x 2
#>       n half_width
#>   <dbl>      <dbl>
#> 1    30     0.358
#> 2   100     0.196
#> 3   300     0.113
#> 4  1000     0.0620
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
zcr    <- qnorm(0.975)
ex_6_1 <- tibble(n = c(30, 100, 300, 1000),
                 half_width = zcr / sqrt(n))
ex_6_1
#> # A tibble: 4 x 2
#>       n half_width
#>   <dbl>      <dbl>
#> 1    30     0.358
#> 2   100     0.196
#> 3   300     0.113
#> 4  1000     0.0620
```

**Explanation:** This is the most important practical fact about CIs: to halve the half-width you need 4x the data, to shrink it 10x you need 100x the data. Diminishing returns are baked into the $\sqrt{n}$ denominator. When a stakeholder asks "how much more data do we need to get a tight estimate", invert the formula: $n = (z_{\alpha/2}\sigma / \text{target half-width})^2$. Sample-size planning lives entirely in this rearrangement.

</details>

### Exercise 6.2: Empirical coverage check by simulation

**Task:** Verify the 95% t-interval really covers the true mean 95% of the time. Set `set.seed(42)` then simulate 5000 samples of `n = 20` from `rnorm(n, mean = 0, sd = 1)`, build a 95% `t.test()` interval on each sample, and compute the proportion of intervals that contain 0. Save the single coverage proportion (a number near 0.95) to `ex_6_2`. This is the definition of confidence-level coverage, long-run frequency of capture.

**Expected result:**

```
#> [1] 0.9484
```

**Difficulty:** Advanced

```r title="Your turn"
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
sims    <- 5000
n       <- 20
covers  <- replicate(sims, {
  x  <- rnorm(n)
  ci <- t.test(x)$conf.int
  ci[1] <= 0 & 0 <= ci[2]
})
ex_6_2 <- mean(covers)
ex_6_2
#> [1] 0.9484
```

**Explanation:** 94.8% is within Monte Carlo noise of the nominal 95%, confirming that the t-interval is calibrated when its assumptions (independent normal data) are met. The same simulation with `rexp(n)` minus 1 (heavily skewed data) would show under-coverage at small `n`, exactly why log transforms or bootstrap intervals exist. Coverage simulations are also how you would empirically check that your favourite shrinkage estimator, robust SE, or Bayesian credible interval delivers the coverage it advertises. Trust the formula at scale, verify it at small `n`.

</details>

## What to do next

- Back to the core lesson: [Confidence Intervals in R](Confidence-Intervals-in-R.html).
- Adjacent inference practice: [Hypothesis Testing Exercises in R](Hypothesis-Testing-Exercises-in-R.html).
- Two-sample testing depth: [t-Test Exercises in R](t-Test-Exercises-in-R.html).
- Regression coefficient intervals in context: [Linear Regression Exercises in R](Linear-Regression-Exercises-in-R.html).
