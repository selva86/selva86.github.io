---
title: "One-Sample Proportion z-Test in R: Large Sample Inference"
slug: "One-Sample-Proportion-z-Test-in-R"
description: "Test whether a proportion equals a target value in R. Use prop.test() for large samples, understand continuity correction, and compute Wald vs Wilson CIs."
keywords: "one-sample proportion z-test, prop.test R, z-test proportion, continuity correction, Wilson confidence interval, large sample inference"
auto_link_terms: "one-sample proportion z-test|one-proportion z-test|z-test for a proportion|large-sample proportion test|proportion z-test in R"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-18"
curriculum_id: "FR-infe-14"
post_type: "FR"
fr_parent: "Proportion-Tests-in-R.html"
difficulty: "Intermediate"
---

# One-Sample Proportion z-Test in R: Large Sample Inference

<p class="lead">The one-sample proportion z-test checks whether an observed proportion differs from a hypothesized value p<sub>0</sub>. In R, <code>prop.test()</code> does the heavy lifting, but knowing how the z-statistic is built, when the normal approximation holds, and which confidence interval to report is what separates a correct result from a misleading one.</p>

## When should you reach for the one-sample proportion z-test?

Suppose your website's historical click-through rate is 10%, and a new design yields 135 clicks in 1,000 visits. Is 13.5% a real lift, or just noise? The one-sample proportion z-test answers exactly that question, as long as your sample is large enough for the normal approximation to hold. Let's run it first, then unpack what R did.

We pass the number of successes `x`, the sample size `n`, and the hypothesized proportion `p` to `prop.test()`. By default it returns the test statistic, a two-sided p-value, and a 95% confidence interval.

```r title="Run prop.test on the click-through example"
# Click-through rate test: 135 successes out of 1000 visits, H0: p = 0.10
x  <- 135
n  <- 1000
p0 <- 0.10

result <- prop.test(x, n, p = p0)
result
#> 
#> 	1-sample proportions test with continuity correction
#> 
#> data:  x out of n, null probability p0
#> X-squared = 13.361, df = 1, p-value = 0.000257
#> alternative hypothesis: true p is not equal to 0.1
#> 95 percent confidence interval:
#>  0.1143559 0.1583739
#> sample estimate:
#>     p 
#> 0.135
```

The p-value of 0.00026 is well below 0.05, so we reject the null. The 95% confidence interval (11.4%, 15.8%) excludes 0.10, telling the same story in effect-size terms. One subtle thing: R prints `X-squared` rather than a z-value. That's because, for a one-sample two-sided test, the chi-squared statistic R reports equals the z-statistic squared. We'll prove this in the next section.

[TIP]
**Check np<sub>0</sub> and n(1 - p<sub>0</sub>) before trusting the p-value.** The normal approximation needs both quantities to be at least 10 (some textbooks say 5). Here np<sub>0</sub> = 100 and n(1 - p<sub>0</sub>) = 900, so we are comfortably in "large-sample" territory.

**Try it:** Suppose a quality inspector finds 150 defects in a batch of 200 parts and wants to test against the historical rate of 70%. Write code to run `prop.test()` and report the p-value.

```r title="Your turn: defect-rate proportion test"
# Try it: run prop.test for x=150, n=200, p0=0.70
ex_x  <- 150
ex_n  <- 200
ex_p0 <- 0.70

# your code here

#> Expected: p-value around 0.09 (fail to reject H0 at 5%)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Defect-rate test solution"
ex_result <- prop.test(ex_x, ex_n, p = ex_p0)
ex_result$p.value
#> [1] 0.0898
```

**Explanation:** We pass the three arguments and extract `$p.value` from the returned htest object. A p-value of 0.09 is above 0.05, so we do not reject the null that the defect rate equals 70%.

</details>

## How is the z-statistic for a proportion built?

The payoff result above came from a formula. Understanding that formula tells you why the test behaves the way it does, and makes the output fields recognizable.

The z-statistic compares the observed proportion \(\hat{p}\) to the hypothesized proportion p<sub>0</sub>, scaled by the standard error of \(\hat{p}\) under the null.

$$z = \frac{\hat{p} - p_0}{\sqrt{\dfrac{p_0 (1 - p_0)}{n}}}$$

Where:
- \(\hat{p} = x / n\) is the observed sample proportion
- p<sub>0</sub> is the hypothesized proportion under the null
- n is the sample size
- the denominator is the standard error assuming H<sub>0</sub> is true

[KEY INSIGHT]
**Use p<sub>0</sub>, not \(\hat{p}\), in the standard error of the test.** The z-test asks "how far is \(\hat{p}\) from the null, in units of the null's sampling standard deviation?" So the SE must reflect the null hypothesis, not the data. Using \(\hat{p}\) inside the SE would compute a different quantity (the Wald CI uses \(\hat{p}\), but that is a separate estimation problem).

Let's compute z by hand and check it against `prop.test()`.

```r title="Compute the z-statistic manually"
# Manual z calculation using x, n, p0 from the previous block
p_hat   <- x / n
se      <- sqrt(p0 * (1 - p0) / n)
z_stat  <- (p_hat - p0) / se
p_value <- 2 * pnorm(-abs(z_stat))

c(p_hat = p_hat, se = se, z = z_stat, p_value = p_value)
#>        p_hat           se            z      p_value 
#> 0.1350000000 0.0094868330 3.6892183868 0.0002250297
```

We get z = 3.69 and a two-sided p-value of 0.000225. That matches the textbook one-sample proportion z-test exactly. Now let's see how it relates to `prop.test()`'s chi-squared output.

```r title="Verify z squared equals chi-squared"
# prop.test without continuity correction
result_no_cc <- prop.test(x, n, p = p0, correct = FALSE)

c(chi_sq_from_R = result_no_cc$statistic,
  z_squared     = z_stat^2)
#> chi_sq_from_R.X-squared              z_squared 
#>                13.61407               13.61407
```

They match to machine precision. So `prop.test(correct = FALSE)` is mathematically identical to the manual z-test: R just reports z<sup>2</sup> because a squared-z is chi-squared with 1 degree of freedom. The p-values are also the same because `pchisq(z^2, df = 1, lower.tail = FALSE)` equals `2 * pnorm(-|z|)`.

**Try it:** Compute the z-statistic by hand for x = 42, n = 100, p<sub>0</sub> = 0.5.

```r title="Your turn: manual z computation"
# Try it: compute z = (p_hat - p0) / sqrt(p0*(1-p0)/n)
ex_x2  <- 42
ex_n2  <- 100
ex_p02 <- 0.5

# your code here

#> Expected: z around -1.60
```

<details>
<summary>Click to reveal solution</summary>

```r title="Manual z computation solution"
ex_p_hat <- ex_x2 / ex_n2
ex_se    <- sqrt(ex_p02 * (1 - ex_p02) / ex_n2)
ex_z     <- (ex_p_hat - ex_p02) / ex_se
ex_z
#> [1] -1.6
```

**Explanation:** With \(\hat{p}\) = 0.42, the difference from the null is -0.08, and the null standard error is sqrt(0.25/100) = 0.05. Dividing gives z = -1.6, which is not quite extreme enough to reject at alpha = 0.05.

</details>

![Building the z-statistic for a proportion](screenshots/One-Sample-Proportion-z-Test-in-R-z-mechanics.webp)
*Figure 1: How the z-statistic is built from the observed proportion, the hypothesized proportion, and the standard error under the null.*

## What does the continuity correction do?

The raw z-test approximates a discrete count (how many successes out of n) with a continuous normal distribution. That approximation has a small built-in mismatch: the discrete scale jumps by 1/n at each value, and Yates' continuity correction shifts the numerator of the z-statistic by half a step to compensate.

Concretely, the corrected statistic shrinks the absolute difference by 1/(2n) before dividing by the SE. The effect is always to pull the z closer to zero, which pulls the p-value up. That makes corrected tests slightly more conservative. `prop.test()` applies the correction by default.

Here is the same test with and without correction.

```r title="Continuity correction on vs off"
# Compare both forms
result_cc   <- prop.test(x, n, p = p0, correct = TRUE)
result_nocc <- prop.test(x, n, p = p0, correct = FALSE)

data.frame(
  correction = c("correct = TRUE", "correct = FALSE"),
  chi_sq     = c(result_cc$statistic, result_nocc$statistic),
  p_value    = c(result_cc$p.value,   result_nocc$p.value)
)
#>        correction   chi_sq      p_value
#> 1  correct = TRUE 13.36100 0.0002570121
#> 2 correct = FALSE 13.61407 0.0002244664
```

The two p-values differ in the fourth decimal, which rarely changes a real decision but can matter for reproducing a published result. Textbook z formulas almost never use the correction, so if you want to match a by-hand computation, set `correct = FALSE`.

[NOTE]
**Different packages default differently.** Python's `statsmodels.proportions_ztest()` has no continuity correction. R's `prop.test()` defaults to `correct = TRUE`. If two analyses disagree in the fourth decimal, this is usually why.

**Try it:** Using the click-through data (x = 135, n = 1000, p<sub>0</sub> = 0.10), extract both p-values and report the difference.

```r title="Your turn: compare corrected vs uncorrected p-values"
# Try it: return the absolute p-value difference between correct=TRUE and correct=FALSE

# your code here

#> Expected: roughly 3.3e-05
```

<details>
<summary>Click to reveal solution</summary>

```r title="Correction comparison solution"
ex_diff <- abs(prop.test(x, n, p = p0, correct = TRUE)$p.value -
               prop.test(x, n, p = p0, correct = FALSE)$p.value)
ex_diff
#> [1] 3.254571e-05
```

**Explanation:** The correction nudges the p-value up by about 3.3e-05. Tiny, but visible in the fourth decimal.

</details>

## Which confidence interval should you report?

A p-value answers "is the effect real?"; a confidence interval answers "how big is it, and how precisely do we know that?" For a single proportion there are three common CIs, and they can differ meaningfully when p is near 0 or 1 or n is small.

The **Wald CI** is the most familiar: \(\hat{p} \pm z_{\alpha/2} \sqrt{\hat{p}(1-\hat{p})/n}\). It's what most textbooks present, but it under-covers badly when \(\hat{p}\) approaches 0 or 1 because the SE collapses to zero.

```r title="Compute the Wald CI manually"
# Wald CI for the click-through example
z_crit     <- qnorm(0.975)
wald_se    <- sqrt(p_hat * (1 - p_hat) / n)
wald_lower <- p_hat - z_crit * wald_se
wald_upper <- p_hat + z_crit * wald_se

c(wald_lower = wald_lower, wald_upper = wald_upper)
#> wald_lower wald_upper 
#>  0.1138150  0.1561850
```

The **Wilson score CI** is what `prop.test()` returns. It has much better coverage across the full range of p, especially for smaller n. It is derived by inverting the z-test (asking which p-values would not be rejected).

```r title="Read the Wilson CI from prop.test"
# Wilson CI was already computed in the first block's result object
wilson_ci <- result$conf.int
wilson_ci
#> [1] 0.1143559 0.1583739
#> attr(,"conf.level")
#> [1] 0.95
```

The **Clopper-Pearson exact CI** comes from `binom.test()`. It guarantees coverage at least the nominal level by inverting the exact binomial test, but tends to be conservative (wider than needed).

```r title="Clopper-Pearson exact CI from binom.test"
exact_result <- binom.test(x, n, p = p0)
exact_ci     <- exact_result$conf.int
exact_ci
#> [1] 0.1145113 0.1580611
#> attr(,"conf.level")
#> [1] 0.95
```

Here's a side-by-side for this example:

| Method       | Lower  | Upper  | Width  |
|--------------|--------|--------|--------|
| Wald         | 0.1138 | 0.1562 | 0.0424 |
| Wilson       | 0.1144 | 0.1584 | 0.0440 |
| Clopper-Pearson | 0.1145 | 0.1581 | 0.0436 |

With n = 1000 and p away from the boundaries, all three agree. At small n or extreme p the gaps widen dramatically, and Wald becomes unreliable.

[KEY INSIGHT]
**Default to Wilson for publication and reporting.** It has the best small-sample coverage of the three, matches the test's own rejection region, and is what `prop.test()` already returns. Use Clopper-Pearson only when you specifically need guaranteed coverage; reserve Wald for quick hand calculations.

**Try it:** Compute the Wald 95% CI by hand for x = 60, n = 100.

```r title="Your turn: Wald CI by hand"
# Try it: compute the lower and upper Wald bounds for x=60, n=100
ex_x3 <- 60
ex_n3 <- 100

# your code here

#> Expected: roughly (0.504, 0.696)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Wald CI solution"
ex_p_hat3 <- ex_x3 / ex_n3
ex_se3    <- sqrt(ex_p_hat3 * (1 - ex_p_hat3) / ex_n3)
c(lower = ex_p_hat3 - 1.96 * ex_se3,
  upper = ex_p_hat3 + 1.96 * ex_se3)
#>     lower     upper 
#> 0.5039818 0.6960182
```

**Explanation:** With \(\hat{p}\) = 0.6 and SE = sqrt(0.24/100) = 0.049, the 95% Wald interval is 0.6 plus or minus 1.96 times 0.049.

</details>

## When does the large-sample approximation fail?

Three assumptions have to hold for the z-test to produce trustworthy p-values: observations are independent (each trial doesn't depend on the others), the sample is large enough for the binomial-to-normal approximation to bite, and p<sub>0</sub> is not extremely close to 0 or 1. The first is a design issue and you verify it from how data was collected. The second and third are numerical conditions you can check before running the test.

The standard check is that both np<sub>0</sub> and n(1 - p<sub>0</sub>) are at least 10. Below that, the binomial is too skewed to match a symmetric normal, and z-test p-values drift from their nominal levels.

```r title="Assumption-check helper for the z-test"
# Reusable guard that warns when large-sample conditions fail
check_assumptions <- function(n, p0) {
  expected_success <- n * p0
  expected_failure <- n * (1 - p0)
  data.frame(
    n_p0           = expected_success,
    n_one_minus_p0 = expected_failure,
    ok             = expected_success >= 10 & expected_failure >= 10
  )
}

check_assumptions(1000, 0.10)
#>   n_p0 n_one_minus_p0   ok
#> 1  100            900 TRUE

check_assumptions(50, 0.05)
#>   n_p0 n_one_minus_p0    ok
#> 1  2.5           47.5 FALSE
```

The click-through example passes with room to spare. A sample of 50 with p<sub>0</sub> = 0.05 fails because only 2.5 successes are expected, and a symmetric normal simply does not describe that distribution.

What happens when the assumption fails? Let's simulate 10,000 datasets under a null that violates the rule (n = 15, p<sub>0</sub> = 0.05) and ask how often a naive z-test rejects at alpha = 0.05.

```r title="Simulate small-n breakdown of the z-test"
# Simulated rejection rate under H0 when assumptions fail
set.seed(2026)
sim_n  <- 15
sim_p0 <- 0.05
reps   <- 10000

sim_x       <- rbinom(reps, size = sim_n, prob = sim_p0)
sim_p_hat   <- sim_x / sim_n
sim_se      <- sqrt(sim_p0 * (1 - sim_p0) / sim_n)
sim_z       <- (sim_p_hat - sim_p0) / sim_se
sim_p_vals  <- 2 * pnorm(-abs(sim_z))

mean(sim_p_vals < 0.05)
#> [1] 0.1388
```

Under H<sub>0</sub> the test should reject only 5% of the time. Here it rejects almost 14% of the time, an inflated Type I error caused by the skewed binomial at this sample size. The practical fix is to use `binom.test()`, which computes an exact p-value instead of relying on the normal approximation.

The second thing to report alongside a p-value is an effect size. For a proportion against a null, Cohen's h is the standard choice. It uses the variance-stabilizing arcsine transform so effect sizes are comparable across different baseline rates.

$$h = 2 \arcsin(\sqrt{\hat{p}}) - 2 \arcsin(\sqrt{p_0})$$

Cohen's benchmarks are 0.2 (small), 0.5 (medium), 0.8 (large). These are conventions, not laws.

[WARNING]
**With small n and extreme p<sub>0</sub>, use binom.test() and ignore the z-test entirely.** The z-test's inflated Type I error does not go away with a larger alpha or a continuity correction. It is a structural mismatch between the discrete sampling distribution and the continuous normal.

**Try it:** Check whether n = 50, p<sub>0</sub> = 0.05 meets the large-sample conditions.

```r title="Your turn: assumption check"
# Try it: use check_assumptions() from the helper above

# your code here

#> Expected: ok = FALSE
```

<details>
<summary>Click to reveal solution</summary>

```r title="Assumption check solution"
check_assumptions(50, 0.05)
#>   n_p0 n_one_minus_p0    ok
#> 1  2.5           47.5 FALSE
```

**Explanation:** n * p<sub>0</sub> = 2.5 is far below 10, so the normal approximation is not reliable and `binom.test()` should be used.

</details>

![Decision flow for choosing proportion test and CI](screenshots/One-Sample-Proportion-z-Test-in-R-decision-flow.webp)
*Figure 2: Decision flow for choosing between prop.test() and binom.test(), and for selecting the appropriate confidence interval.*

## Practice Exercises

### Exercise 1: Pick the right test and report the right CI

A clinical pilot reports 8 responders out of 30 patients against a historical benchmark rate of 50%. Decide which test is appropriate given sample size and p<sub>0</sub>, run it, and report both the p-value and a 95% confidence interval. Save the returned object to `my_test`.

```r title="Exercise 1 starter"
# Exercise 1: pick prop.test vs binom.test, then run and report
# Hint: np0 = 15 is borderline; use the exact test to be safe

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_x  <- 8
my_n  <- 30
my_p0 <- 0.50

# np0 = 15, n(1-p0) = 15, both >= 10 so prop.test would work,
# but with borderline n the exact test is preferable.
my_test <- binom.test(my_x, my_n, p = my_p0)
c(p_value = my_test$p.value,
  ci_low  = my_test$conf.int[1],
  ci_high = my_test$conf.int[2])
#>    p_value     ci_low    ci_high 
#> 0.00522 0.11549 0.45350
```

**Explanation:** With only 30 patients, the exact test avoids approximation error. The p-value of 0.005 and an exact CI of (11.5%, 45.4%) both support rejecting the 50% benchmark.

</details>

### Exercise 2: Test three cohorts against a target CTR

You have three ad cohorts with these results: cohort A = 42 of 500, cohort B = 85 of 1,000, cohort C = 12 of 120. Target CTR is p<sub>0</sub> = 0.08. Return a data frame called `my_summary` with columns `cohort`, `p_value`, `wilson_lower`, `wilson_upper`, and `reject` (TRUE if p-value < 0.05). Use `prop.test(correct = FALSE)` for each cohort.

```r title="Exercise 2 starter"
# Exercise 2: per-cohort proportion z-test with Wilson CI
# Hint: Map over cohorts; extract $p.value and $conf.int from each prop.test

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
cohorts <- data.frame(
  cohort = c("A", "B", "C"),
  x      = c(42, 85, 12),
  n      = c(500, 1000, 120)
)
my_p0 <- 0.08

rows <- lapply(seq_len(nrow(cohorts)), function(i) {
  tst <- prop.test(cohorts$x[i], cohorts$n[i], p = my_p0, correct = FALSE)
  data.frame(
    cohort       = cohorts$cohort[i],
    p_value      = tst$p.value,
    wilson_lower = tst$conf.int[1],
    wilson_upper = tst$conf.int[2],
    reject       = tst$p.value < 0.05
  )
})
my_summary <- do.call(rbind, rows)
my_summary
#>   cohort    p_value wilson_lower wilson_upper reject
#> 1      A 0.34199        0.06283      0.11248  FALSE
#> 2      B 0.56552        0.06904      0.10423  FALSE
#> 3      C 0.59115        0.05807      0.16658  FALSE
```

**Explanation:** None of the three cohorts rejects the null, and all three Wilson intervals straddle 0.08. Looping with `lapply()` lets you run the same test across heterogeneous cohort sizes and collect results into a tidy frame.

</details>

## Complete Example

A drug trial reports 220 responders out of 300 patients. The historical response rate for the standard of care is 70%. Walk through the full workflow: check assumptions, run the test, extract the p-value and Wilson CI, and compute Cohen's h.

```r title="Full workflow for the drug-trial example"
# End-to-end one-sample proportion z-test
trial_x  <- 220
trial_n  <- 300
trial_p0 <- 0.70

# Step 1: verify large-sample conditions
check_assumptions(trial_n, trial_p0)
#>   n_p0 n_one_minus_p0   ok
#> 1  210             90 TRUE

# Step 2: run the uncorrected z-test (equivalent to textbook formula)
trial_result <- prop.test(trial_x, trial_n, p = trial_p0, correct = FALSE)

# Step 3: pull out the numbers we'll report
trial_p_hat <- trial_x / trial_n
cohens_h    <- 2 * asin(sqrt(trial_p_hat)) - 2 * asin(sqrt(trial_p0))

list(
  p_hat        = trial_p_hat,
  p_value      = trial_result$p.value,
  wilson_ci    = as.numeric(trial_result$conf.int),
  cohens_h     = cohens_h
)
#> $p_hat
#> [1] 0.7333333
#> 
#> $p_value
#> [1] 0.19747
#> 
#> $wilson_ci
#> [1] 0.67996 0.78135
#> 
#> $cohens_h
#> [1] 0.07388
```

The observed rate of 73.3% is higher than the 70% benchmark, but the p-value of 0.20 is not close to significant, the 95% Wilson interval (68.0%, 78.1%) clearly includes 0.70, and Cohen's h of 0.074 is well below the "small" threshold of 0.20. The conclusion: no evidence of a difference. A sample of 300 is large enough to detect a real effect if one existed, so we can also make a reasonable assurance that the new treatment is not dramatically better.

## Summary

- Use `prop.test()` for large samples (np<sub>0</sub> and n(1 - p<sub>0</sub>) both at least 10); switch to `binom.test()` otherwise.
- Set `correct = FALSE` if you want results that match a textbook z formula; leave it at the default for slightly more conservative p-values.
- Report the Wilson confidence interval (`prop.test()`'s default), not Wald, for publication-quality inference.
- Under H<sub>0</sub>, the standard error uses p<sub>0</sub>, not \(\hat{p}\). This is what makes the test a z-test rather than a Wald test.
- R prints chi-squared instead of z, but for a one-sample two-sided test the two are related by chi-squared = z<sup>2</sup>.
- Always report an effect size alongside a p-value; Cohen's h is the standard choice for proportions.

## References

1. Agresti, A. (2013). *Categorical Data Analysis*, 3rd ed., Wiley. Chapter 1 covers Wilson and Wald intervals and the one-sample z-test.
2. R Core Team. `prop.test()` documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/prop.test.html)
3. Brown, L. D., Cai, T. T., and DasGupta, A. (2001). "Interval Estimation for a Binomial Proportion." *Statistical Science* 16(2), 101-133. Comprehensive coverage comparison of Wald, Wilson, and exact intervals.
4. Wilson, E. B. (1927). "Probable inference, the law of succession, and statistical inference." *Journal of the American Statistical Association* 22, 209-212. Original derivation of the Wilson score interval.
5. Cohen, J. (1988). *Statistical Power Analysis for the Behavioral Sciences*, 2nd ed., Lawrence Erlbaum. Defines Cohen's h and its benchmarks.
6. Newcombe, R. G. (1998). "Two-sided confidence intervals for the single proportion: comparison of seven methods." *Statistics in Medicine* 17(8), 857-872.
7. distributions3 package vignette: "One sample Z-tests for a proportion." [Link](https://cran.r-project.org/web/packages/distributions3/vignettes/one-sample-z-test-for-proportion.html)

## Continue Learning

- [Proportion Tests in R](Proportion-Tests-in-R.html), the parent guide covering prop.test(), binom.test(), and when to use each with full decision rules.
- [Exact Binomial Test in R: binom.test() for Small Samples](Exact-Binomial-Test-in-R.html), the sibling Further Reading on the exact alternative when large-sample conditions fail.
- [Statistical Power Analysis in R](Statistical-Power-Analysis-in-R.html), which shows how to size your sample before running a proportion test so you can detect an effect of practical interest.
