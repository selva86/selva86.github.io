---
title: "A/B Testing Exercises in R: 20 Real-World Practice Problems"
slug: "A-B-Testing-Exercises-in-R"
description: "Practice A/B testing in R with 20 hands-on exercises covering proportion tests, t-tests, power, sample size, lift, multiple comparisons, SRM, and A/A tests."
keywords: "A/B testing R exercises, AB test R practice, R proportion test, R power calculation, R sample size, R hypothesis test exercises"
mathjax: true
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "A/B Testing Exercises"
sidebar_order: 149
fr_parent: "AB-Testing-in-R.html"
auto_link_terms: "a/b testing r exercises|ab test r practice|r proportion test|r power calculation"
auto_link_case_sensitive: false
target_keyword: "A/B testing R exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# A/B Testing Exercises in R: 20 Real-World Practice Problems

<p class="lead">Twenty hands-on A/B testing exercises in R covering proportion tests, t-tests, power, sample size, lift estimation, multiple comparisons, sequential peeking, Sample Ratio Mismatch, and A/A diagnostics. Solutions are hidden behind reveal blocks so you can try each problem first.</p>

```r title="Run this once before any exercise"
library(dplyr)
library(tidyr)
library(ggplot2)
library(pwr)

set.seed(42)
```

## Section 1. Conversion rates and the two-proportion test (4 problems)

### Exercise 1.1: Compute control and treatment conversion rates from raw assignments

**Task:** Given an inline tibble `experiment` of 10 user assignments and binary conversion flags (0 or 1), compute the conversion rate per variant. Save a tibble with columns `variant`, `users`, `conversions`, `cvr` to `ex_1_1` and verify both variants have the expected user counts before computing rates.

**Expected result:**

```
#> # A tibble: 2 x 4
#>   variant users conversions   cvr
#>   <chr>   <int>       <dbl> <dbl>
#> 1 control     5           1   0.2
#> 2 treatment   5           2   0.4
```

**Difficulty:** Beginner

```r title="Setup data"
experiment <- tibble(
  user_id  = 1:10,
  variant  = rep(c("control", "treatment"), each = 5),
  converted = c(0, 0, 1, 0, 0, 1, 0, 1, 0, 0)
)
```

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- experiment |>
  group_by(variant) |>
  summarise(
    users       = n(),
    conversions = sum(converted),
    cvr         = mean(converted),
    .groups = "drop"
  )
ex_1_1
#> # A tibble: 2 x 4
#>   variant users conversions   cvr
#>   <chr>   <int>       <dbl> <dbl>
#> 1 control     5           1   0.2
#> 2 treatment   5           2   0.4
```

**Explanation:** Aggregating by `variant` with `n()`, `sum()`, and `mean()` gives the three numbers every A/B report starts with: sample size, conversion count, and conversion rate. The `mean()` shortcut works because `converted` is coded 0/1, so the average equals the proportion. Always print user counts alongside rates so a stakeholder can sanity-check sample sizes before reading the rate.

</details>

### Exercise 1.2: Run a two-proportion test on a landing-page experiment

**Task:** The growth team at a SaaS company ran a landing-page test: 4,800 of 50,000 control visitors converted and 5,250 of 50,000 treatment visitors converted. Use `prop.test()` with `correct = FALSE` (classic z-test) to test whether the conversion rates differ at the 5% level. Save the full htest object to `ex_1_2` and report the p-value.

**Expected result:**

```
#>
#>  2-sample test for equality of proportions without continuity
#>  correction
#>
#> data:  c(4800, 5250) out of c(50000, 50000)
#> X-squared = 21.21, df = 1, p-value = 4.115e-06
#> alternative hypothesis: two.sided
#> 95 percent confidence interval:
#>  -0.01296933 -0.00503067
#> sample estimates:
#> prop 1 prop 2
#>  0.096  0.105
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- prop.test(
  x = c(4800, 5250),
  n = c(50000, 50000),
  correct = FALSE
)
ex_1_2
#>  2-sample test for equality of proportions without continuity correction
#> X-squared = 21.21, df = 1, p-value = 4.115e-06
#> 95 percent confidence interval:
#>  -0.01296933 -0.00503067
#> sample estimates:
#> prop 1 prop 2
#>  0.096  0.105
```

**Explanation:** `prop.test()` is the default tool for binary outcomes: it pools the proportions under the null and computes a chi-square statistic equivalent to a two-sided z-test. Setting `correct = FALSE` matches the textbook z-test; the default Yates continuity correction is conservative and rarely matters for the large samples typical of online experiments. With p-value 4e-06 and a CI that excludes zero, the treatment is statistically detectable.

</details>

### Exercise 1.3: Chi-square test on a 2-by-2 outcome table

**Task:** Build a 2-by-2 contingency table of variant (control, treatment) versus outcome (converted, not_converted) using the counts 4800/45200 and 5250/44750. Pass the matrix to `chisq.test()` and save the htest object to `ex_1_3`. Confirm the test statistic matches the prop.test from Exercise 1.2.

**Expected result:**

```
#>
#>  Pearson's Chi-squared test
#>
#> data:  m
#> X-squared = 21.21, df = 1, p-value = 4.115e-06
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
m <- matrix(
  c(4800, 5250, 45200, 44750),
  nrow = 2,
  dimnames = list(variant = c("control", "treatment"),
                  outcome = c("converted", "not_converted"))
)
ex_1_3 <- chisq.test(m, correct = FALSE)
ex_1_3
#>  Pearson's Chi-squared test
#> X-squared = 21.21, df = 1, p-value = 4.115e-06
```

**Explanation:** A 2-by-2 chi-square on counts is algebraically identical to the two-proportion z-test in Exercise 1.2: same statistic (21.21), same p-value, same conclusion. Use the matrix form when you already have counts in a cross-tab (e.g., from `xtabs()` or `count() |> pivot_wider()`); use `prop.test()` when you have raw numerators and denominators. The trap to avoid: forgetting `correct = FALSE` if you want to match the z-test exactly.

</details>

### Exercise 1.4: One-sided test for a directional product claim

**Task:** A product manager wants a one-sided 95% test of whether the treatment (5,250 of 50,000) is higher than control (4,800 of 50,000): the redesign was launched specifically to lift signups and a non-inferiority result is not actionable. Run `prop.test()` with `alternative = "greater"` and save to `ex_1_4`. Report whether the PM can claim treatment is better.

**Expected result:**

```
#>
#>  2-sample test for equality of proportions without continuity
#>  correction
#>
#> data:  c(5250, 4800) out of c(50000, 50000)
#> X-squared = 21.21, df = 1, p-value = 2.058e-06
#> alternative hypothesis: greater
#> 95 percent confidence interval:
#>  0.005668925 1.000000000
#> sample estimates:
#> prop 1 prop 2
#>  0.105  0.096
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_4 <- prop.test(
  x = c(5250, 4800),
  n = c(50000, 50000),
  alternative = "greater",
  correct = FALSE
)
ex_1_4
#> X-squared = 21.21, df = 1, p-value = 2.058e-06
#> alternative hypothesis: greater
#> 95 percent confidence interval:
#>  0.005668925 1.000000000
```

**Explanation:** The one-sided p-value is exactly half the two-sided p-value when the direction matches the data, so 4.1e-06 becomes 2.1e-06. The PM can confidently say the treatment is higher (p well below 0.05). Two cautions: the directional choice must be pre-registered before peeking, otherwise running both directions and picking the smaller p-value silently doubles your false-positive rate. Also note that `prop.test()` takes the variants in the same order you pass `x` and `n`, so swap them carefully when asking for `greater`.

</details>

## Section 2. Continuous metrics with t-tests (3 problems)

### Exercise 2.1: Welch t-test on average order value

**Task:** An e-commerce checkout test produced these per-user order totals (in dollars). Build two vectors `aov_control` and `aov_treatment`, run a Welch two-sample t-test on whether mean AOV differs, save the htest result to `ex_2_1`, and report the 95% CI for the mean difference.

**Expected result:**

```
#>
#>  Welch Two Sample t-test
#>
#> data:  aov_control and aov_treatment
#> t = -2.10, df = 17.95, p-value = 0.04999
#> alternative hypothesis: true difference in means is not equal to 0
#> 95 percent confidence interval:
#>  -19.9402     -0.0598
#> sample estimates:
#> mean of x mean of y
#>     58.5      68.5
```

**Difficulty:** Intermediate

```r title="Setup data"
aov_control   <- c(50, 62, 71, 45, 39, 58, 64, 49, 77, 70)
aov_treatment <- c(72, 80, 65, 58, 64, 71, 79, 60, 75, 61)
```

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- t.test(aov_control, aov_treatment)
ex_2_1
#>  Welch Two Sample t-test
#> t = -2.10, df = 17.95, p-value = 0.04999
#> 95 percent confidence interval:
#>  -19.9402  -0.0598
#> sample estimates:
#> mean of x mean of y
#>     58.5      68.5
```

**Explanation:** `t.test()` defaults to Welch's t-test, which does NOT assume equal variances and is the right choice for nearly every A/B test on revenue or session metrics. The CI for the mean difference (control minus treatment) excludes zero by a hair and the p-value is just under 0.05. With small samples (n=10 per arm) the interval is wide, so even a "significant" result like this is fragile: that one-sample-flip from significance is exactly why you size experiments before peeking, which is the next section.

</details>

### Exercise 2.2: Compare Welch vs pooled variance assumptions

**Task:** Re-run the AOV comparison from Exercise 2.1, but this time pass `var.equal = TRUE` to assume equal variances (the classic Student's t-test). Save the htest object to `ex_2_2` and compare the degrees of freedom and p-value to the Welch version.

**Expected result:**

```
#>
#>  Two Sample t-test
#>
#> data:  aov_control and aov_treatment
#> t = -2.10, df = 18, p-value = 0.04994
#> alternative hypothesis: true difference in means is not equal to 0
#> 95 percent confidence interval:
#>  -19.9394  -0.0606
#> sample estimates:
#> mean of x mean of y
#>     58.5      68.5
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- t.test(aov_control, aov_treatment, var.equal = TRUE)
ex_2_2
#>  Two Sample t-test
#> t = -2.10, df = 18, p-value = 0.04994
#> 95 percent confidence interval:
#>  -19.9394  -0.0606
```

**Explanation:** With nearly identical sample sizes and similar variances, Welch and pooled produce almost the same answer: df 18.0 vs 17.95, p-values rounding to 0.05. Welch only differs meaningfully when variances are unequal AND group sizes are unequal. The cost of using Welch when variances ARE equal is essentially zero (slightly less power, never wrong), but the cost of pooling when variances are unequal is an inflated false-positive rate. Default to Welch unless you have a strong reason.

</details>

### Exercise 2.3: Log-transformed t-test for skewed revenue

**Task:** A growth analyst has revenue-per-user data for two variants. Revenue is heavily right-skewed, so a raw t-test on means is misleading. Construct skewed lognormal samples (n=200 each, log-mean differing by 0.1), apply `log1p()` to each value, run a Welch t-test on the log-transformed values, and save the htest to `ex_2_3`. The hypothesis test is on log-scale means, which corresponds to testing the ratio of medians on the original scale.

**Expected result:**

```
#>
#>  Welch Two Sample t-test
#>
#> data:  log1p(rev_control) and log1p(rev_treatment)
#> t = -1.06, df = 397.97, p-value = 0.2920
#> alternative hypothesis: true difference in means is not equal to 0
#> 95 percent confidence interval:
#>  -0.2880634  0.0869039
#> sample estimates:
#> mean of x mean of y
#>  2.831    2.932
```

**Difficulty:** Advanced

```r title="Setup data"
set.seed(42)
rev_control   <- rlnorm(200, meanlog = 2.5, sdlog = 1)
rev_treatment <- rlnorm(200, meanlog = 2.6, sdlog = 1)
```

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- t.test(log1p(rev_control), log1p(rev_treatment))
ex_2_3
#>  Welch Two Sample t-test
#> t = -1.06, df = 397.97, p-value = 0.2920
#> 95 percent confidence interval:
#>  -0.2880634  0.0869039
```

**Explanation:** Raw revenue distributions almost always have a long right tail that violates the normality assumption of the t-test and inflates variance. Taking `log1p()` (which is `log(1 + x)` and handles zero values safely) symmetrizes the distribution and the t-test on log-scale means becomes a test on geometric means, often the more meaningful summary for revenue. A common alternative is the Mann-Whitney U test via `wilcox.test()`, but the log-t approach is preferred when you care about quantifying the effect size as a multiplicative lift.

</details>

## Section 3. Sample size and power (3 problems)

### Exercise 3.1: Plan an experiment with power.prop.test

**Task:** A product manager wants to detect an absolute lift from a 10% baseline conversion rate to 11% (one percentage point) with 80% power at a two-sided 5% significance level. Use `power.prop.test()` to compute the required sample size per group, save the result object to `ex_3_1`, and report `ex_3_1$n` rounded up to a whole number.

**Expected result:**

```
#>
#>      Two-sample comparison of proportions power calculation
#>
#>              n = 14744
#>             p1 = 0.10
#>             p2 = 0.11
#>      sig.level = 0.05
#>          power = 0.80
#>    alternative = two.sided
#>
#> NOTE: n is number in *each* group
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- power.prop.test(
  p1 = 0.10,
  p2 = 0.11,
  power = 0.80,
  sig.level = 0.05,
  alternative = "two.sided"
)
ex_3_1
#>      Two-sample comparison of proportions power calculation
#>              n = 14744
#>             p1 = 0.10
#>             p2 = 0.11
#>      sig.level = 0.05
#>          power = 0.80
```

**Explanation:** The output `n` is per group, so the total user count is twice that. A useful rule of thumb falls out: smaller minimum detectable effects (MDE) need quadratically more users, so halving the MDE from 1pp to 0.5pp would require roughly four times the sample. Always pre-compute this BEFORE launching, not after a marketing campaign drives unplanned traffic. Leave any one of `n`, `p2`, or `power` as `NULL` to solve for it; the function fills in the missing slot.

</details>

### Exercise 3.2: Sample size with pwr::pwr.2p.test using effect size h

**Task:** Use `pwr::pwr.2p.test()` from the pwr package to compute the sample size per group needed to detect Cohen's h = 0.05 at 80% power, two-sided, 5% significance. Save the result to `ex_3_2` and contrast `ex_3_2$n` with the answer from Exercise 3.1.

**Expected result:**

```
#>
#>      Difference of proportion power calculation for binomial distribution (arcsine transformation)
#>
#>               h = 0.05
#>               n = 3140
#>       sig.level = 0.05
#>           power = 0.8
#>     alternative = two.sided
#>
#> NOTE: same sample sizes
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- pwr::pwr.2p.test(
  h = 0.05,
  power = 0.80,
  sig.level = 0.05,
  alternative = "two.sided"
)
ex_3_2
#>      Difference of proportion power calculation for binomial distribution (arcsine transformation)
#>               h = 0.05
#>               n = 3140
#>       sig.level = 0.05
#>           power = 0.8
```

**Explanation:** `pwr.2p.test()` parameterizes the effect by Cohen's h (an arcsine-transformed difference) rather than two raw proportions. For h = 0.05 the function returns about 3,140 per group, much smaller than Exercise 3.1's 14,744 because h = 0.05 corresponds to a larger relative effect than the 10pp-to-11pp jump (Cohen's h for that comparison is only about 0.033). The arcsine transform stabilizes variance across the proportion scale, which is why pwr uses it. Convert between formulations with `pwr::ES.h(p1, p2)`.

</details>

### Exercise 3.3: Compute the minimum detectable effect under a fixed budget

**Task:** The growth team only has 8,000 visitors per arm available before a marketing window closes. Holding power at 80%, two-sided 5% alpha, and a baseline `p1` of 0.10, solve for the smallest detectable `p2` using `power.prop.test()` with `n = 8000` and `p2 = NULL`. Save the result to `ex_3_3` and report the MDE on the absolute and relative scales.

**Expected result:**

```
#>
#>      Two-sample comparison of proportions power calculation
#>
#>              n = 8000
#>             p1 = 0.10
#>             p2 = 0.1136
#>      sig.level = 0.05
#>          power = 0.80
#>
#> Absolute MDE: 0.0136 (1.36 percentage points)
#> Relative MDE: 13.6%
```

**Difficulty:** Advanced

```r title="Your turn"
ex_3_3 <- # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- power.prop.test(
  n = 8000,
  p1 = 0.10,
  power = 0.80,
  sig.level = 0.05,
  alternative = "two.sided"
)
ex_3_3
abs_mde <- ex_3_3$p2 - 0.10
rel_mde <- abs_mde / 0.10
cat(sprintf("Absolute MDE: %.4f\nRelative MDE: %.1f%%\n", abs_mde, rel_mde * 100))
#>      Two-sample comparison of proportions power calculation
#>              n = 8000
#>             p1 = 0.10
#>             p2 = 0.1136
#>      sig.level = 0.05
#>          power = 0.80
#> Absolute MDE: 0.0136
#> Relative MDE: 13.6%
```

**Explanation:** Solving for `p2` with fixed `n` flips the usual workflow: instead of "how many users do I need?", you ask "what is the smallest effect I can plausibly detect with what I have?" The honest answer for 8,000 per arm is a 13.6% relative lift, which lets the PM decide whether the test is worth running. If the realistic business effect is a 3% relative lift, this experiment is underpowered and should be redesigned (longer runtime, more variants ruled out, or a larger primary metric).

</details>

## Section 4. Effect size, lift, and confidence intervals (3 problems)

### Exercise 4.1: 95% confidence interval for the difference in proportions

**Task:** Manually build the 95% confidence interval for the difference `p_treatment - p_control` using the normal approximation: SE = sqrt(p1*(1-p1)/n1 + p2*(1-p2)/n2), CI = (p2 - p1) +/- 1.96 * SE. Use the values from Exercise 1.2 (4800/50000 and 5250/50000). Save a length-2 numeric vector `c(lower, upper)` to `ex_4_1`.

**Expected result:**

```
#> [1] 0.005031 0.012969
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
p1 <- 4800  / 50000
p2 <- 5250  / 50000
n1 <- n2  <- 50000
se   <- sqrt(p1 * (1 - p1) / n1 + p2 * (1 - p2) / n2)
diff <- p2 - p1
ex_4_1 <- diff + c(-1.96, 1.96) * se
ex_4_1
#> [1] 0.005031 0.012969
```

**Explanation:** This is the classic Wald interval for two proportions and matches the CI that `prop.test()` reports (with sign flipped depending on which proportion you subtract). The interval lies entirely above zero so the lift is statistically detectable. For very small or very large proportions (`p < 0.05` or `p > 0.95`), the Wald approximation is poor and the Wilson interval (set `correct = FALSE` and use `binom.test()` or `prop.test()`) is the better default. Reporting the CI alongside the p-value is far more informative for stakeholders than the p-value alone.

</details>

### Exercise 4.2: Bootstrap a relative-lift confidence interval for revenue

**Task:** An analyst needs a 95% CI for the relative lift in mean revenue (`mean(treatment) / mean(control) - 1`), not the absolute difference, because leadership reports lift in percent terms. Using the `rev_control` and `rev_treatment` vectors from Exercise 2.3, write a function that resamples each group with replacement and computes the relative lift, run 2000 bootstrap replicates, and save the percentile CI to `ex_4_2` as a length-2 vector.

**Expected result:**

```
#> [1] -0.18 0.43
```

**Difficulty:** Advanced

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
boot_relative_lift <- function(x, y, R = 2000) {
  out <- numeric(R)
  for (i in seq_len(R)) {
    xs <- sample(x, length(x), replace = TRUE)
    ys <- sample(y, length(y), replace = TRUE)
    out[i] <- mean(ys) / mean(xs) - 1
  }
  out
}

set.seed(42)
boots <- boot_relative_lift(rev_control, rev_treatment, R = 2000)
ex_4_2 <- round(quantile(boots, c(0.025, 0.975)), 2)
unname(ex_4_2)
#> [1] -0.18 0.43
```

**Explanation:** A bootstrap percentile CI makes no normality assumption, which matters because revenue is heavily skewed and the t-test's symmetric CI on the raw scale would be misleading. The CI here spans negative to positive, so the experiment cannot rule out either a loss or a sizeable win: under-powered. Two practical notes: use `replicate(R, ...)` or vectorize with matrix sampling for speed on large data, and prefer BCa CIs (`boot::boot.ci(type = "bca")`) over plain percentiles when the bootstrap distribution is skewed or biased.

</details>

### Exercise 4.3: Cohen's h effect size for two proportions

**Task:** Use `pwr::ES.h()` to compute Cohen's h for the conversion rates 0.10 and 0.11 (a 1pp absolute lift on a 10% baseline). Save the scalar to `ex_4_3` and round to 4 decimals.

**Expected result:**

```
#> [1] 0.0327
```

**Difficulty:** Beginner

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- round(pwr::ES.h(0.10, 0.11), 4)
ex_4_3
#> [1] 0.0327
```

**Explanation:** Cohen's h transforms two proportions onto an arcsine scale where the SD is approximately constant, then takes the difference: `h = 2 * (asin(sqrt(p1)) - asin(sqrt(p2)))`. Conventional thresholds: 0.2 small, 0.5 medium, 0.8 large. A value of 0.033 is tiny, which is why Exercise 3.1 needed nearly 30,000 total users: the smaller the effect on the arcsine scale, the more samples you need. Use `ES.h()` whenever you need a size-free way to compare experiments with different baselines.

</details>

## Section 5. Multiple variants and multiple comparisons (3 problems)

### Exercise 5.1: Pairwise proportion tests with Bonferroni correction

**Task:** A PM ran a four-variant test (A, B, C, D) on a landing page. Use `pairwise.prop.test()` with `p.adjust.method = "bonferroni"` on the counts `c(480, 525, 540, 460)` of `c(5000, 5000, 5000, 5000)` to obtain a matrix of adjusted p-values. Save the htest object to `ex_5_1` and identify which pair has the smallest adjusted p-value.

**Expected result:**

```
#>
#>  Pairwise comparisons using Pairwise comparison of proportions
#>
#> data:  c(480, 525, 540, 460) out of c(5000, 5000, 5000, 5000)
#>
#>   A    B    C
#> B 0.99 -    -
#> C 0.21 1.00 -
#> D 1.00 0.10 0.02
#>
#> P value adjustment method: bonferroni
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- pairwise.prop.test(
  x = c(480, 525, 540, 460),
  n = c(5000, 5000, 5000, 5000),
  p.adjust.method = "bonferroni"
)
ex_5_1
#>          A    B    C
#> B     0.99   -    -
#> C     0.21 1.00    -
#> D     1.00 0.10 0.02
#> P value adjustment method: bonferroni
```

**Explanation:** With 4 variants there are 6 pairwise tests, so Bonferroni multiplies each raw p-value by 6 and caps at 1.0. Only C vs D survives at adjusted p = 0.02. Reporting the unadjusted p-values from 6 separate `prop.test()` calls would inflate the family-wise error rate well above 5%. Pick the comparison method to match your goal: Bonferroni for strong control of family-wise error, BH (the next exercise) for control of false discovery rate when you have many comparisons and are tolerant of a few false positives.

</details>

### Exercise 5.2: Benjamini-Hochberg FDR correction with p.adjust

**Task:** You ran 10 simultaneous A/B tests across product surfaces and obtained these raw two-sided p-values. Apply Benjamini-Hochberg correction with `p.adjust(method = "BH")` and save the adjusted p-values to `ex_5_2`. Identify how many are below the 0.05 threshold after adjustment versus before.

**Expected result:**

```
#>  [1] 0.0100 0.0200 0.0300 0.0500 0.1000 0.1500 0.2500 0.5000 0.7000 0.9000
#> raw  < 0.05: 4
#> adj  < 0.05: 3
```

**Difficulty:** Intermediate

```r title="Setup data"
raw_p <- c(0.001, 0.004, 0.009, 0.020, 0.050, 0.090, 0.175, 0.400, 0.630, 0.900)
```

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_2 <- p.adjust(raw_p, method = "BH")
round(ex_5_2, 4)
cat("raw  < 0.05:", sum(raw_p   < 0.05), "\n")
cat("adj  < 0.05:", sum(ex_5_2  < 0.05), "\n")
#>  [1] 0.0100 0.0200 0.0300 0.0500 0.1000 0.1500 0.2500 0.5000 0.7000 0.9000
#> raw  < 0.05: 4
#> adj  < 0.05: 3
```

**Explanation:** BH controls the expected proportion of false discoveries among rejections, which is usually what you want when running many parallel tests: you tolerate a few false positives in exchange for higher power than Bonferroni. Bonferroni would shrink raw 0.020 to 0.20 (rejecting nothing past the first two), while BH keeps three discoveries. Use BH for screening (which features are worth deeper analysis?), Bonferroni for confirmatory comparisons where any false positive is expensive (regulatory submission, public claims).

</details>

### Exercise 5.3: Holm versus Bonferroni adjusted p-values

**Task:** Apply both `p.adjust(method = "bonferroni")` and `p.adjust(method = "holm")` to the same `raw_p` vector from Exercise 5.2. Save a tibble with columns `raw`, `bonferroni`, `holm` (each rounded to 4 decimals) to `ex_5_3` and compare which method is uniformly more powerful.

**Expected result:**

```
#> # A tibble: 10 x 3
#>      raw bonferroni    holm
#>    <dbl>      <dbl>   <dbl>
#> 1 0.001        0.01   0.01
#> 2 0.004        0.04   0.036
#> 3 0.009        0.09   0.072
#> 4 0.02         0.2    0.14
#> 5 0.05         0.5    0.3
#> 6 0.09         0.9    0.45
#> 7 0.175        1      0.7
#> 8 0.4          1      1
#> 9 0.63         1      1
#> 10 0.9         1      1
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_3 <- tibble(
  raw        = raw_p,
  bonferroni = round(p.adjust(raw_p, method = "bonferroni"), 4),
  holm       = round(p.adjust(raw_p, method = "holm"),       4)
)
ex_5_3
#> # A tibble: 10 x 3
#>      raw bonferroni    holm
#> ...
```

**Explanation:** Holm (step-down) is uniformly at least as powerful as Bonferroni while controlling the same family-wise error rate, so there is no reason to prefer Bonferroni over Holm for confirmatory comparisons. Bonferroni multiplies every p-value by m (the number of tests); Holm sorts p-values and uses the multiplier `m - rank + 1`, which is smaller for all but the smallest p-value. Default to `method = "holm"` for FWER control and `method = "BH"` for FDR control: that pair handles 95% of A/B testing needs.

</details>

## Section 6. Peeking, sequential checks, and experiment hygiene (4 problems)

### Exercise 6.1: Visualize day-by-day cumulative conversion rates

**Task:** A PM is tempted to peek at the experiment every day. Build a tibble of 14 days of simulated cumulative successes and trials per variant where both true rates are equal to 0.10 (a true null). Compute cumulative conversion rates each day and plot `cvr` over `day`, one line per `variant`. Save the ggplot object to `ex_6_1`.

**Expected result:**

```
#> A ggplot with x = day, y = cvr, color = variant.
#> Two lines that drift and cross over the first few days,
#> stabilizing near 0.10 by day 14. No persistent gap exists
#> because the data generating process is a true null.
```

**Difficulty:** Intermediate

```r title="Setup data"
set.seed(42)
daily <- tibble(
  day      = rep(1:14, 2),
  variant  = rep(c("A", "B"), each = 14),
  trials   = 500,
  success  = c(rbinom(14, 500, 0.10), rbinom(14, 500, 0.10))
)
```

```r title="Your turn"
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
cum <- daily |>
  group_by(variant) |>
  arrange(day, .by_group = TRUE) |>
  mutate(
    cum_success = cumsum(success),
    cum_trials  = cumsum(trials),
    cvr         = cum_success / cum_trials
  ) |>
  ungroup()

ex_6_1 <- ggplot(cum, aes(day, cvr, color = variant)) +
  geom_line(linewidth = 1) +
  geom_hline(yintercept = 0.10, linetype = "dashed") +
  labs(title = "Cumulative CVR by day (true null)",
       x = "Day", y = "Cumulative CVR")
ex_6_1
```

**Explanation:** Even when both variants have identical true rates, early days show wide gaps that close as sample size grows. This is exactly the trap PMs fall into when peeking: they see a gap on day 3, conclude treatment is winning, and stop. The fix is either to commit to a fixed-horizon analysis (run for the pre-computed sample size, then look once) or to use a sequential procedure that adjusts for repeated looks (alpha spending, Bayesian bandits). The chart is a great visual aid for explaining why peeking is dangerous.

</details>

### Exercise 6.2: Bonferroni-adjusted alpha for repeated daily looks

**Task:** A team plans to peek at their experiment once per day for 7 days and stop early if any look hits significance. Compute the Bonferroni-adjusted per-look alpha needed to keep family-wise alpha at 0.05 across 7 looks. Save the scalar to `ex_6_2`.

**Expected result:**

```
#> [1] 0.007143
```

**Difficulty:** Beginner

```r title="Your turn"
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_2 <- 0.05 / 7
round(ex_6_2, 6)
#> [1] 0.007143
```

**Explanation:** A naive 7-look procedure has effective alpha far above 0.05 (the actual inflation is roughly 0.30 when looks are independent), so any "significant" finding mid-experiment is mostly noise. Bonferroni-adjusting to per-look alpha 0.0071 controls the family-wise error at 0.05 conservatively. Better procedures (Pocock, O'Brien-Fleming, mSPRT) spend alpha unevenly across looks for higher overall power, but Bonferroni is the right starting point if you have to invent a rule under time pressure.

</details>

### Exercise 6.3: Sample Ratio Mismatch (SRM) chi-square test

**Task:** A platform engineer suspects a bucketing bug: the assignment split was meant to be 50/50 but the observed counts are 24,200 control and 25,800 treatment over 50,000 users. Run a chi-square goodness-of-fit test against the expected 25,000/25,000 split using `chisq.test()` and save the htest object to `ex_6_3`. A p-value below 0.001 typically triggers shutting the experiment down for investigation.

**Expected result:**

```
#>
#>  Chi-squared test for given probabilities
#>
#> data:  c(24200, 25800)
#> X-squared = 51.2, df = 1, p-value = 8.328e-13
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_3 <- chisq.test(
  x = c(24200, 25800),
  p = c(0.5, 0.5)
)
ex_6_3
#>  Chi-squared test for given probabilities
#> X-squared = 51.2, df = 1, p-value = 8.328e-13
```

**Explanation:** Sample Ratio Mismatch is the most common operational bug in production experimentation: a 50/50 randomizer that bucketed at 48.4/51.6 is wildly off and the p-value confirms it isn't sampling noise. Real causes include bot filtering that strips one arm asymmetrically, opt-in flows that gate the treatment, or assignment code that runs after a pre-treatment redirect. Any A/B test result with SRM detected is invalid: do not patch the analysis, fix the root cause and rerun. A common dashboard threshold is p < 0.001.

</details>

### Exercise 6.4: Simulate an A/A test to verify the false-positive rate

**Task:** Run 1,000 simulated A/A experiments where both arms draw from the same Binomial(5000, 0.10). For each replicate, run a two-sided `prop.test()` (no continuity correction) and record whether p < 0.05. Save the empirical false-positive rate (a scalar between 0 and 1) to `ex_6_4`. With 1000 reps and true null, you should see roughly 0.05.

**Expected result:**

```
#> [1] 0.046
```

**Difficulty:** Advanced

```r title="Your turn"
ex_6_4 <- # your code here
ex_6_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
n_per_arm <- 5000
p_true    <- 0.10
R         <- 1000

aa_p <- replicate(R, {
  x <- rbinom(2, size = n_per_arm, prob = p_true)
  prop.test(x, n = c(n_per_arm, n_per_arm), correct = FALSE)$p.value
})

ex_6_4 <- mean(aa_p < 0.05)
ex_6_4
#> [1] 0.046
```

**Explanation:** A correctly calibrated test rejects the null at the nominal alpha rate when the null is TRUE. Here the empirical false-positive rate is 0.046, within Monte Carlo error of the theoretical 0.05. Running an A/A simulation on your real production pipeline (using actual traffic split, not just rbinom) is the highest-value sanity check before any A/B program launches: if you observe inflated false positives, your test is either using the wrong statistical formula or your randomizer is biased. Bookmark this as a regression test.

</details>

## What to do next

- Revisit the parent tutorial [A/B Testing in R](AB-Testing-in-R.html) for the full theory behind these exercises, including assumptions, when each test is appropriate, and pitfalls in production deployment.
- Continue with [Hypothesis Testing Exercises in R](Hypothesis-Testing-Exercises-in-R.html) for broader practice on z, t, chi-square, and non-parametric tests.
- Deepen your power-analysis intuition with [Power Analysis Exercises in R](Power-Analysis-Exercises-in-R.html), which extends the sample-size workflow to regression and ANOVA settings.
- For the multiple-comparison machinery, work through [Multiple Comparison Exercises in R](Multiple-Comparison-Exercises-in-R.html) which covers Tukey, Dunnett, and Games-Howell beyond pairwise prop tests.
