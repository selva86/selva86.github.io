---
title: "Proportion Tests in R: prop.test(), binom.test() — When to Use Each"
slug: Proportion-Tests-in-R
description: "Compare a proportion to a target or two proportions to each other. Use prop.test() for large samples, binom.test() for exact small-sample p-values and CIs."
keywords: "proportion test R, prop.test R, binom.test R, one proportion z test, two proportion z test, exact binomial test, confidence interval proportion, Wilson interval, Clopper-Pearson, Yates continuity correction"
auto_link_terms: "prop.test()|binom.test()|proportion test|proportion tests|one-proportion z-test|two-proportion z-test|exact binomial test|Clopper-Pearson interval|Wilson score interval"
auto_link_case_sensitive: true
mathjax: true
webr: true
date: 2026-04-18
curriculum_id: "2.2.9"
post_type: C
sidebar_section: Statistics
sidebar_title: Proportion Tests
sidebar_order: 22
difficulty: Intermediate
---

# Proportion Tests in R: prop.test(), binom.test() — When to Use Each

<p class="lead">A proportion test checks whether an observed rate, like a conversion rate or an infection rate, differs from a target value or from another group's rate. In R, <code>prop.test()</code> handles large samples with the normal approximation, and <code>binom.test()</code> returns exact p-values from the binomial distribution for small samples.</p>

## Which test should you use: prop.test() or binom.test()?

Pick the wrong one and your p-value lies. Imagine 2 successes in 15 trials and a null hypothesis that the true rate is 40%. The normal approximation behind `prop.test()` is shaky at this sample size, and the exact `binom.test()` is the honest answer. The rule of thumb is simple: when `n` is large and both `n*p` and `n*(1-p)` are at least 5, use `prop.test()`. Otherwise use `binom.test()`. Run both on the same data and compare.

```r title="Small-sample: exact vs asymptotic"
# 2 successes out of 15 trials, testing H0: p = 0.4
bt <- binom.test(x = 2, n = 15, p = 0.4)
pt <- prop.test(x = 2, n = 15, p = 0.4)

c(binom_p = bt$p.value, prop_p = pt$p.value)
#>    binom_p     prop_p
#> 0.03646171 0.06508670
```

Same data, same null, two different decisions at the 5% level. The exact binomial p-value is 0.036 (reject), while the continuity-corrected proportion-test p-value is 0.065 (fail to reject). When `n` is only 15, the continuous normal curve is a poor stand-in for the discrete binomial, and `prop.test()` inflates its p-value to be conservative. For small samples, the exact test is the one you should trust.

![Decision flow for picking the right proportion test in R.](screenshots/Proportion-Tests-in-R-test-decision-flow.webp)
*Figure 1: Pick `prop.test()` when the normal approximation is safe, `binom.test()` otherwise, and `fisher.test()` for sparse 2x2 tables.*

[NOTE]
**`prop.test()` applies Yates continuity correction by default.** That is why its p-value differs from a hand-computed Z-test. Pass `correct = FALSE` to turn it off and see the plain score test.

**Try it:** Run both `prop.test()` and `binom.test()` on 30 successes out of 100 trials, testing the null `p = 0.4`. The two p-values should now be close, because `n` is large enough for the normal approximation.

```r title="Your turn: large-sample agreement"
# Test 30/100 against H0: p = 0.4 with both functions
ex_bt <- NULL  # fill in
ex_pt <- NULL  # fill in

c(binom_p = ex_bt$p.value, prop_p = ex_pt$p.value)
#> Expected: two p-values roughly around 0.04 and 0.05
```

<details>
<summary>Click to reveal solution</summary>

```r title="Large-sample agreement solution"
ex_bt <- binom.test(x = 30, n = 100, p = 0.4)
ex_pt <- prop.test(x = 30, n = 100, p = 0.4)

c(binom_p = ex_bt$p.value, prop_p = ex_pt$p.value)
#>    binom_p     prop_p
#> 0.04154451 0.05247951
```

**Explanation:** At `n = 100` both methods agree closely. The exact test rejects at 0.05 and the asymptotic test is right on the boundary. The Yates correction still pulls the asymptotic p-value upward, but the gap has shrunk to a few thousandths.

</details>

## How do you run a one-sample proportion test?

A survey finds that 35 out of 100 adults favour a new policy. The historical baseline is 40%. Has opinion really shifted, or is 35% just sampling noise around 40%? A one-sample proportion test is exactly this question.

The call to `prop.test()` takes three arguments: `x` is the count of successes, `n` is the sample size, and `p` is the hypothesised population proportion. R returns a chi-square statistic (the squared Z), a p-value, and a 95% confidence interval.

```r title="One-sample proportion test"
res1 <- prop.test(x = 35, n = 100, p = 0.40)
res1
#>
#>     1-sample test for given proportion with continuity correction
#>
#> data:  35 out of 100, null probability 0.4
#> X-squared = 0.84375, df = 1, p-value = 0.3583
#> alternative hypothesis: true p is not equal to 0.4
#> 95 percent confidence interval:
#>  0.2591235 0.4525560
#> sample estimates:
#>     p
#> 0.35
```

The p-value is 0.36, well above 0.05, so we fail to reject the null: the data are consistent with a true rate of 40%. The 95% CI runs from 26% to 45% and contains 40%, which tells the same story visually. Reading `$estimate` gives the raw proportion 0.35, and `$conf.int` returns the bounds as a two-element vector you can pull into a report.

[TIP]
**Use `alternative = "less"` or `"greater"` for one-sided tests.** If the policy hypothesis was specifically that support has *dropped* below 40%, `prop.test(35, 100, 0.40, alternative = "less")` halves the p-value and returns a one-sided CI.

**Try it:** Test whether 55 heads out of 100 coin flips is significantly different from a fair coin (p = 0.5). Save the test object to `ex_coin` and pull the p-value.

```r title="Your turn: fair coin test"
# Test 55 heads / 100 flips against H0: p = 0.5
ex_coin <- NULL  # fill in

ex_coin$p.value
#> Expected: p-value around 0.37 (not significant)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Fair coin test solution"
ex_coin <- prop.test(x = 55, n = 100, p = 0.5)
ex_coin$p.value
#> [1] 0.3681
```

**Explanation:** 55 heads in 100 flips is within a normal range of variation for a fair coin. The 95% CI includes 0.5, and we do not reject the null.

</details>

## How do you compare two proportions in R?

Two-sample proportion tests answer "do these two groups really differ?" An A/B test is the classic case: 48 conversions in 500 visitors on the control page, 70 conversions in 500 visitors on the variant. The variant looks better at face value (14% vs 9.6%), but is the lift real?

Passing vectors of length 2 to `x` and `n` tells `prop.test()` you want the two-sample version. It returns a chi-square, a p-value for `H0: p1 = p2`, and a CI for the *difference* `p1 - p2`.

```r title="Two-sample A/B test"
ab <- prop.test(x = c(48, 70), n = c(500, 500))
ab
#>
#>     2-sample test for equality of proportions with continuity correction
#>
#> data:  c(48, 70) out of c(500, 500)
#> X-squared = 4.2373, df = 1, p-value = 0.03955
#> alternative hypothesis: two.sided
#> 95 percent confidence interval:
#>  -0.085897088 -0.002102912
#> sample estimates:
#> prop 1 prop 2
#>  0.096  0.140
```

The p-value is 0.040, so at the 5% level we reject the null of equal rates. The 95% CI for `p1 - p2` runs from -0.086 to -0.002 and excludes zero, which is the same conclusion in interval form: the variant's rate is higher by somewhere between 0.2 and 8.6 percentage points. The point estimates `prop 1 = 9.6%` and `prop 2 = 14.0%` give the raw lift of 4.4 points.

A p-value alone rarely settles a business question. Reporting the *size* of the difference and the *relative* change makes the result decision-ready.

```r title="Risk difference and relative risk"
# Flip the sign so the lift is positive for the variant
rd <- unname(ab$estimate[2] - ab$estimate[1])
rr <- unname(ab$estimate[2] / ab$estimate[1])

c(risk_difference = rd, relative_risk = rr)
#> risk_difference   relative_risk
#>   0.04400000        1.45833333
```

The variant beats control by 4.4 percentage points on an absolute scale and lifts the conversion rate by 46% on a relative scale. Pair this with the CI on the difference to check whether even the *worst-case* lift is worth the engineering and rollout cost.

[KEY INSIGHT]
**The CI width, not just the p-value, tells you whether the lift is practically meaningful.** A statistically significant 0.3-point lift (CI barely excluding zero) is worlds apart from a confident 4-point lift. Judge the lower bound against your business threshold, not the p-value against 0.05.

**Try it:** Compare 15 defects out of 200 from supplier A against 10 defects out of 250 from supplier B. Report the p-value and the risk difference (A minus B).

```r title="Your turn: supplier comparison"
# Two suppliers: 15/200 vs 10/250 defect rates
ex_suppliers <- NULL  # fill in

# p-value and risk difference (A - B)
c(p = ex_suppliers$p.value,
  rd = ex_suppliers$estimate[1] - ex_suppliers$estimate[2])
#> Expected: p-value around 0.16, risk difference around 0.035
```

<details>
<summary>Click to reveal solution</summary>

```r title="Supplier comparison solution"
ex_suppliers <- prop.test(x = c(15, 10), n = c(200, 250))
c(p  = ex_suppliers$p.value,
  rd = ex_suppliers$estimate[1] - ex_suppliers$estimate[2])
#>         p   rd.prop 1
#> 0.1604541 0.0350000
```

**Explanation:** Supplier A has a 7.5% defect rate, supplier B has 4%. The raw difference is 3.5 points, but the p-value is 0.16 and the 95% CI for the difference crosses zero. The sample sizes are too small to conclude the suppliers really differ.

</details>

## When does the p-value stop being trustworthy?

The normal approximation behind `prop.test()` assumes the sampling distribution of `p_hat` is bell-shaped. For large `n` this is roughly true. For small `n` or extreme `p`, the true distribution is discrete and skewed, and the approximation drifts away from reality. The practical symptom is a p-value that does not match the one from the exact test, and in close calls it changes your decision.

The cleanest way to see this is to compare p-values across every possible outcome at small `n`. For `n = 10` under null `p = 0.3`, each possible success count `x` produces a different pair of p-values from the two tests.

```r title="Exact vs asymptotic p-values at n=10, p=0.3"
x_vals <- 0:10
comparison <- sapply(x_vals, function(x) {
  c(x = x,
    binom_p = binom.test(x, n = 10, p = 0.3)$p.value,
    prop_p  = prop.test(x,  n = 10, p = 0.3)$p.value)
})
round(t(comparison), 4)
#>        x binom_p prop_p
#>  [1,]  0  0.0388 0.0845
#>  [2,]  1  0.2996 0.3006
#>  [3,]  2  0.7332 0.7301
#>  [4,]  3  1.0000 1.0000
#>  [5,]  4  0.4997 0.7301
#>  [6,]  5  0.1785 0.3006
#>  [7,]  6  0.0756 0.0845
#>  [8,]  7  0.0106 0.0157
#>  [9,]  8  0.0016 0.0019
#> [10,]  9  0.0001 0.0001
#> [11,] 10  0.0000 0.0000
```

Look at `x = 0`: the exact p-value is 0.039 (reject at 0.05) but the asymptotic p-value jumps to 0.084 (do not reject). At `x = 4`, the exact says 0.500 and the asymptotic says 0.730, a 46% gap. In any real-world decision around the 0.05 boundary, this swing determines whether you call the result significant. The `prop.test()` result is not *wrong*, it is just solving a different problem, and that problem's answer happens to disagree with the exact one when the normal curve is a bad model for this particular binomial.

A compact decision rule captures when to bail out of the asymptotic world. The minimum of expected successes and expected failures under the null should be at least 5.

```r title="Decision helper: exact or asymptotic?"
use_exact <- function(n, p) {
  min(n * p, n * (1 - p)) < 5
}

# A couple of test cases
use_exact(n = 15, p = 0.10)  # 1.5 successes expected -> exact
#> [1] TRUE

use_exact(n = 200, p = 0.30) # 60 successes expected -> asymptotic
#> [1] FALSE
```

`use_exact()` returns `TRUE` when the normal approximation is unsafe. For `n = 15, p = 0.10` the expected successes under the null is 1.5, which is far below 5, so we switch to `binom.test()`. For `n = 200, p = 0.30` the expected counts are 60 and 140, well past the threshold, and `prop.test()` is fine. When both counts are borderline (between 5 and 10), running both tests and checking that they agree is the safest move.

[WARNING]
**Reporting a `prop.test()` p-value without checking the sample size is a silent bug.** The function happily returns a p-value for `x = 1, n = 10`, but it can disagree with the exact p-value by a factor of two. Always compute `min(n * p0, n * (1 - p0))` first and fall back to `binom.test()` when it is under 5.

**Try it:** For `n = 25` and a null proportion `p = 0.08`, does the rule of thumb say to use the exact test or the asymptotic test?

```r title="Your turn: apply the decision rule"
# Check whether n=25, p=0.08 needs binom.test()
ex_check <- NULL  # call use_exact()

ex_check
#> Expected: TRUE
```

<details>
<summary>Click to reveal solution</summary>

```r title="Decision rule solution"
ex_check <- use_exact(n = 25, p = 0.08)
ex_check
#> [1] TRUE
```

**Explanation:** Expected successes under the null are `25 * 0.08 = 2`, which is well under 5, so the normal approximation is unreliable. Use `binom.test()` here.

</details>

## Which confidence interval should you report?

The CI that ships with your proportion is as important as the point estimate. R gives you three main choices and they disagree, sometimes noticeably. Here is the short version.

- **Wald** is the textbook `p_hat +/- 1.96 * SE` interval. It is easy to compute by hand but biased toward the centre and can even produce nonsensical negative lower bounds when `p` is near 0. Avoid it except for pedagogy.
- **Wilson** is the default CI from `prop.test(correct = FALSE)`. It inverts the score test, behaves well for any `n`, and is the best general-purpose choice.
- **Clopper-Pearson** is the default CI from `binom.test()`. It is *exact* (coverage is guaranteed to be at least the nominal level), which means it is a touch conservative and slightly wider.

All three can be written in a few lines of base R. Compute them side by side for `x = 7, n = 50`.

The three formulas are:

**Wald:**

$$\hat{p} \pm z_{1-\alpha/2} \sqrt{\frac{\hat{p}(1-\hat{p})}{n}}$$

**Wilson (score):**

$$\frac{\hat{p} + \frac{z^2}{2n} \pm z \sqrt{\frac{\hat{p}(1-\hat{p})}{n} + \frac{z^2}{4n^2}}}{1 + \frac{z^2}{n}}$$

**Clopper-Pearson:** the 2.5th percentile of Beta(x, n-x+1) and the 97.5th percentile of Beta(x+1, n-x).

Where $\hat{p} = x/n$ is the sample proportion, $n$ is the sample size, $z$ is the normal quantile (1.96 for 95%), and $x$ is the number of successes.

```r title="Three CIs computed by hand"
x <- 7
n <- 50
phat <- x / n
z <- qnorm(0.975)  # 1.96

# Wald
wald <- phat + c(-1, 1) * z * sqrt(phat * (1 - phat) / n)

# Wilson (score)
denom    <- 1 + z^2 / n
centre   <- (phat + z^2 / (2 * n)) / denom
halfspan <- (z / denom) * sqrt(phat * (1 - phat) / n + z^2 / (4 * n^2))
wilson   <- centre + c(-1, 1) * halfspan

# Clopper-Pearson via the Beta distribution
cp <- c(qbeta(0.025, x, n - x + 1),
        qbeta(0.975, x + 1, n - x))

round(rbind(Wald = wald, Wilson = wilson, Clopper_Pearson = cp), 4)
#>                   [,1]   [,2]
#> Wald            0.0438 0.2362
#> Wilson          0.0695 0.2619
#> Clopper_Pearson 0.0582 0.2674
```

For 7 successes out of 50, the three CIs are Wald (0.044, 0.236), Wilson (0.070, 0.262), and Clopper-Pearson (0.058, 0.267). The Wald lower bound is more than two percentage points *below* Wilson's, which looks harmless at this sample size, but at smaller `n` Wald can go negative. Clopper-Pearson is wider on both sides because it guarantees coverage rather than targeting it. Wilson sits in the middle and is what you should report by default.

```r title="Verify against prop.test and binom.test"
prop_ci  <- prop.test(x, n, correct = FALSE)$conf.int
binom_ci <- binom.test(x, n)$conf.int

round(rbind(prop_test_Wilson = prop_ci,
            binom_test_ClopperPearson = binom_ci), 4)
#>                             [,1]   [,2]
#> prop_test_Wilson          0.0695 0.2619
#> binom_test_ClopperPearson 0.0582 0.2674
```

The `prop.test()` CI with `correct = FALSE` matches the Wilson interval to the fourth decimal, and `binom.test()`'s CI matches Clopper-Pearson exactly. That is not coincidence, those functions *are* implementations of the Wilson and Clopper-Pearson methods. Knowing this lets you pick a function by the CI you want, not just by the p-value.

![Comparison of Wald, Wilson, and Clopper-Pearson CI methods.](screenshots/Proportion-Tests-in-R-ci-methods.webp)
*Figure 2: Wald is simple but undercovers; Wilson (`prop.test()` default) is the best general-purpose choice; Clopper-Pearson (`binom.test()` default) is exact and conservative.*

[TIP]
**Default to Wilson unless you need the strict coverage guarantee of Clopper-Pearson.** Wilson has near-nominal coverage across the full range of `p`, while Clopper-Pearson sacrifices a little width for a rock-solid guarantee. Wald is a teaching tool, not a reporting tool.

**Try it:** For `x = 2` successes out of `n = 20` trials, compute and report both the Wilson and the Clopper-Pearson 95% CI.

```r title="Your turn: CIs for x=2, n=20"
# Compute Wilson and Clopper-Pearson 95% CIs for x=2, n=20
ex_wilson <- NULL  # fill in using prop.test() with correct = FALSE
ex_cp     <- NULL  # fill in using binom.test()

rbind(Wilson = ex_wilson, Clopper_Pearson = ex_cp)
#> Expected: Wilson roughly (0.028, 0.301); Clopper-Pearson roughly (0.012, 0.317)
```

<details>
<summary>Click to reveal solution</summary>

```r title="CI exercise solution"
ex_wilson <- prop.test(2, 20, correct = FALSE)$conf.int
ex_cp     <- binom.test(2, 20)$conf.int

rbind(Wilson = ex_wilson, Clopper_Pearson = ex_cp)
#>                       [,1]      [,2]
#> Wilson          0.02786314 0.3010354
#> Clopper_Pearson 0.01234853 0.3169827
```

**Explanation:** At `x = 2, n = 20`, the expected successes is 2, far below 5, so the exact method is more appropriate. Notice how much wider Clopper-Pearson is on the lower side. It protects against the worst case of an unusually small sample.

</details>

## Practice Exercises

### Exercise 1: A survey at the boundary

A survey returns 112 positive responses out of 250. Test whether the true rate is 50% using `prop.test()`, report the 95% Wilson CI, and state whether you reject the null at `alpha = 0.05`. Save the test object to `my_survey`.

```r title="Exercise 1 starter"
# Hint: prop.test(correct = FALSE) returns a Wilson CI
my_survey <- NULL

# p-value and CI
c(p = my_survey$p.value,
  lower = my_survey$conf.int[1],
  upper = my_survey$conf.int[2])
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_survey <- prop.test(x = 112, n = 250, p = 0.5, correct = FALSE)
c(p = my_survey$p.value,
  lower = my_survey$conf.int[1],
  upper = my_survey$conf.int[2])
#>         p     lower     upper
#> 0.1000968 0.3876115 0.5099935
```

**Explanation:** The observed rate is 44.8%. The p-value is 0.10, and the 95% Wilson CI (0.388, 0.510) covers 0.5, so we fail to reject the null. The true proportion is plausibly 50%.

</details>

### Exercise 2: Small-sample vaccination cohorts

Compare infection rates between two small cohorts: 3 infections in 40 vaccinated people versus 9 in 40 unvaccinated people. Pick the correct test given the cell counts, report the p-value, and compute the risk difference (unvaccinated minus vaccinated).

```r title="Exercise 2 starter"
# Hint: one expected cell count is small; consider fisher.test() for exact 2x2
# or prop.test() with a careful read
my_vax <- NULL
my_rd  <- NULL

c(p = my_vax$p.value, rd = my_rd)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
# Fisher's exact test is the principled pick when a cell is small
my_vax <- fisher.test(matrix(c(3, 37, 9, 31), nrow = 2))
my_rd  <- 9/40 - 3/40  # unvaccinated minus vaccinated

c(p = my_vax$p.value, rd = my_rd)
#>         p        rd
#> 0.1148881 0.1500000
```

**Explanation:** The risk difference is 15 percentage points, but the p-value is 0.11 because both cohorts are small. With only 40 people per group, even large absolute differences fail to reach conventional significance. This is a power problem, not a signal problem, and is exactly why sample size planning matters.

</details>

### Exercise 3: Build a smart wrapper

Write a function `pt_summary(x, n, p0 = 0.5)` that picks `binom.test()` when `min(n*p0, n*(1-p0)) < 5`, otherwise `prop.test()` with `correct = FALSE`. The function should return a named list with the test used, p-value, estimate, and 95% CI. Test it on two cases: `(x = 2, n = 15, p0 = 0.2)` and `(x = 40, n = 100, p0 = 0.5)`.

```r title="Exercise 3 starter"
# Hint: use if/else on the decision rule, return a list
pt_summary <- function(x, n, p0 = 0.5) {
  # your code here
}

pt_summary(2, 15, 0.2)
pt_summary(40, 100, 0.5)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
pt_summary <- function(x, n, p0 = 0.5) {
  if (min(n * p0, n * (1 - p0)) < 5) {
    t <- binom.test(x, n, p = p0)
    test_used <- "binom.test (exact)"
  } else {
    t <- prop.test(x, n, p = p0, correct = FALSE)
    test_used <- "prop.test (Wilson)"
  }
  list(
    test     = test_used,
    p_value  = unname(t$p.value),
    estimate = unname(t$estimate),
    ci_95    = as.numeric(t$conf.int)
  )
}

pt_summary(2, 15, 0.2)
#> $test
#> [1] "binom.test (exact)"
#> $p_value
#> [1] 0.7499
#> $estimate
#> [1] 0.1333333
#> $ci_95
#> [1] 0.01657940 0.40459045

pt_summary(40, 100, 0.5)
#> $test
#> [1] "prop.test (Wilson)"
#> $p_value
#> [1] 0.04550026
#> $estimate
#> [1] 0.4
#> $ci_95
#> [1] 0.3094013 0.4979974
```

**Explanation:** The first call routes to `binom.test()` because `15 * 0.2 = 3` is below the threshold. The p-value of 0.75 means the observed 2/15 is essentially consistent with 0.2. The second call routes to `prop.test()` because both expected counts are 50, and it rejects the null at 0.05. One wrapper, two correctly-chosen tests.

</details>

## Complete Example: measuring a marketing lift end to end

A two-week A/B test on a landing page gives 18 signups from 400 control visitors and 32 signups from 400 treatment visitors. You want to know three things: is the lift real, how big is it, and does the CI lower bound clear the 1-point threshold your product lead set.

```r title="End-to-end A/B test"
# Raw counts
control_x   <- 18; control_n   <- 400
treatment_x <- 32; treatment_n <- 400

# Are both expected-cell counts large enough for the asymptotic test?
pooled_p <- (control_x + treatment_x) / (control_n + treatment_n)
min(control_n * pooled_p, treatment_n * (1 - pooled_p))
#> [1] 25

# Both cells have plenty of successes and failures: prop.test() is fine
final_test <- prop.test(
  x = c(treatment_x, control_x),
  n = c(treatment_n, control_n),
  correct = FALSE
)

# Lift (treatment - control) and its 95% CI
lift    <- unname(final_test$estimate[1] - final_test$estimate[2])
lift_ci <- as.numeric(final_test$conf.int)

c(p_value  = final_test$p.value,
  lift_pts = lift * 100,
  ci_lower = lift_ci[1] * 100,
  ci_upper = lift_ci[2] * 100)
#>   p_value  lift_pts  ci_lower  ci_upper
#> 0.0408715 3.5000000 0.1540395 6.8459605
```

The p-value of 0.041 rejects the null of equal rates at the 5% level. The point estimate of the lift is 3.5 percentage points, and the 95% CI for the lift runs from 0.15 to 6.85 percentage points. The lower bound is 0.15, well *below* the 1-point business threshold, so while the lift is statistically real it is not confidently large enough to meet the product lead's bar. The honest decision is to run the test longer to tighten the CI, not to ship the variant on this evidence alone.

## Summary

Proportion tests in R come down to a few decisions: which function to call, whether to apply the Yates continuity correction, and which confidence interval to report. The table below is the full map.

| Question | Function | Notes |
|---|---|---|
| One sample, large `n` | `prop.test(x, n, p)` | Score test; Wilson CI when `correct = FALSE` |
| One sample, small `n` | `binom.test(x, n, p)` | Exact p-value; Clopper-Pearson CI |
| Two samples, both cells >= 5 | `prop.test(c(x1, x2), c(n1, n2))` | CI is for `p1 - p2` |
| Two samples, any cell < 5 | `fisher.test(matrix(...))` | Exact 2x2 test |
| Default CI | Wilson | Via `prop.test(correct = FALSE)` |
| Exact CI | Clopper-Pearson | Via `binom.test()` |

![Overview mindmap of R's proportion-testing toolkit.](screenshots/Proportion-Tests-in-R-overview-mindmap.webp)
*Figure 3: Overview of R's proportion-testing toolkit.*

Three takeaways to commit to memory. First, the sample size rule `min(n*p, n*(1-p)) >= 5` decides whether the asymptotic test is trustworthy. Second, always accompany a p-value with a CI for the difference or the estimate, because the CI carries the effect size you need for a real decision. Third, Wilson is the default CI; reach for Clopper-Pearson only when you need strict coverage.

## References

1. R Core Team. *`prop.test`: Test of Equal or Given Proportions.* R manual. [Link](https://stat.ethz.ch/R-manual/R-patched/library/stats/html/prop.test.html)
2. R Core Team. *`binom.test`: Exact Binomial Test.* R manual. [Link](https://stat.ethz.ch/R-manual/R-patched/library/stats/html/binom.test.html)
3. Agresti, A. and Coull, B. A. (1998). *Approximate Is Better than Exact for Interval Estimation of Binomial Proportions.* The American Statistician, 52(2), 119-126.
4. Clopper, C. J. and Pearson, E. S. (1934). *The use of confidence or fiducial limits illustrated in the case of the binomial.* Biometrika, 26(4), 404-413.
5. Wilson, E. B. (1927). *Probable inference, the law of succession, and statistical inference.* Journal of the American Statistical Association, 22(158), 209-212.
6. Newcombe, R. G. (1998). *Two-sided confidence intervals for the single proportion: comparison of seven methods.* Statistics in Medicine, 17(8), 857-872.
7. Brown, L. D., Cai, T. T. and DasGupta, A. (2001). *Interval estimation for a binomial proportion.* Statistical Science, 16(2), 101-133.

## Continue Learning

1. [Hypothesis Testing in R](Hypothesis-Testing-in-R.html), the framework behind every test in this post, including Type I and Type II errors and why a p-value is not a probability of being wrong.
2. [Confidence Intervals in R](Confidence-Intervals-in-R.html), the definition most textbooks state incorrectly, with intuition for what the 95% really means.
3. [t-Tests in R](t-Tests-in-R.html), the mean-comparison counterpart to this post, with the same style of decision rules for picking the right variant.
