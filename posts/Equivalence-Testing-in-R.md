---
title: "Equivalence Testing in R: TOST for Non-Inferiority & Bioequivalence"
slug: "Equivalence-Testing-in-R"
description: "Learn equivalence testing in R with TOST. Prove two means are practically the same, run non-inferiority trials, and verify bioequivalence with runnable code."
keywords: "equivalence testing R, TOST, two one-sided tests, non-inferiority test R, bioequivalence R, TOSTER package, equivalence bounds, statistical equivalence"
auto_link_terms: "equivalence testing|TOST procedure|two one-sided tests|non-inferiority test|bioequivalence|equivalence bounds"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-18"
curriculum_id: "FR-infe-3"
post_type: "FR"
fr_parent: "Hypothesis-Testing-in-R.html"
difficulty: "Intermediate"
---

# Equivalence Testing in R: TOST for Non-Inferiority & Bioequivalence

<p class="lead">Equivalence testing flips the usual question: instead of asking "is there a difference?", it asks "are these two groups close enough that the difference doesn't matter?" The TOST procedure (Two One-Sided Tests) answers that with a pair of t-tests, supporting non-inferiority trials, generic-vs-brand drug comparisons, and any claim that two methods give practically the same result.</p>

## How do you prove two means are practically equivalent in R?

A standard t-test can only reject sameness, never confirm it. TOST flips the logic. You pre-specify a range of differences too small to care about, then run two one-sided t-tests against the edges of that range. When both one-sided tests reject their null, the true difference must sit inside the range, and the groups are declared statistically equivalent. Here is that idea running on two blood pressure monitors that should read the same patient within 2 mmHg.

```r title="TOST equivalence via two one-sided t-tests"
# Two blood pressure monitors, 20 patients each (mmHg)
monitor_a <- c(120, 122, 118, 121, 119, 123, 117, 120, 122, 119,
               121, 118, 120, 122, 119, 121, 117, 123, 120, 118)
monitor_b <- c(119, 121, 120, 122, 118, 121, 119, 120, 121, 119,
               120, 120, 118, 121, 120, 122, 118, 120, 121, 119)

# Equivalence bounds: differences within ±2 mmHg don't matter clinically
low  <- -2
high <-  2

# Two one-sided t-tests
t_lower <- t.test(monitor_a, monitor_b, alternative = "greater", mu = low)
t_upper <- t.test(monitor_a, monitor_b, alternative = "less",    mu = high)

c(p_lower = t_lower$p.value, p_upper = t_upper$p.value)
#>      p_lower      p_upper
#> 0.0001262827 0.0002227712

# Equivalence holds only if BOTH reject at alpha = 0.05
max(t_lower$p.value, t_upper$p.value) < 0.05
#> [1] TRUE
```

Both one-sided tests reject their null, with p-values around 0.0001 and 0.0002. Since the larger of the two is well below 0.05, the true mean difference sits inside the ±2 mmHg window and the monitors are declared equivalent. A classical two-sided `t.test(monitor_a, monitor_b)` on the same data returns p = 0.92, which tells you only that you failed to detect a difference, not that the monitors agree.

**Try it:** Tighten the bounds to ±0.1 mmHg (a much stricter claim). What do the two p-values look like, and why does the conclusion flip?

```r title="Your turn: tighter equivalence bounds"
# Re-run TOST with tighter bounds
ex_tight_low  <- -0.1
ex_tight_high <-  0.1

# your code here
ex_t_lower <- NULL
ex_t_upper <- NULL

c(lower = ex_t_lower$p.value, upper = ex_t_upper$p.value)
#> Expected: both p-values around 0.4, tight bounds fail
```

<details>
<summary>Click to reveal solution</summary>

```r title="Tighter bounds solution"
ex_t_lower <- t.test(monitor_a, monitor_b, alternative = "greater", mu = ex_tight_low)
ex_t_upper <- t.test(monitor_a, monitor_b, alternative = "less",    mu = ex_tight_high)
c(lower = ex_t_lower$p.value, upper = ex_t_upper$p.value)
#>     lower     upper
#> 0.3829752 0.4604782
```

**Explanation:** Observed mean difference is only 0.05, which is well inside ±0.1. But the sample isn't precise enough to *prove* the difference is smaller than 0.1 mmHg. The test is conservative: you need evidence, not just a favourable point estimate.

</details>

## Why can't a standard t-test prove equivalence?

A t-test asks one question: "Is the observed difference bigger than noise?" A non-significant p-value means you failed to reject the null of no difference. It never means the null is true. With a small sample, you can miss very real differences and still get a large p-value, so treating "p > 0.05" as proof of equivalence is a recipe for false claims.

Watch this happen: two groups whose means actually differ by over a full unit, tested with just five observations per group.

```r title="Small N hides a real difference"
# Two groups with actual mean difference ~1.3 units, but tiny N
small_x <- c(9.2, 11.1, 10.3, 8.8, 11.6)
small_y <- c(11.5, 10.8, 12.4, 11.9, 10.7)

c(mean_x = mean(small_x), mean_y = mean(small_y))
#>  mean_x  mean_y
#>    10.20  11.46

# Classical two-sided t-test
classical_test <- t.test(small_x, small_y)
classical_test$p.value
#> [1] 0.08661551
```

The t-test returns p = 0.087, which fails to reject the null of equal means. A reader who confuses "fails to reject" with "no difference" will happily claim the groups are the same. But the means really do differ by 1.3 units; the small sample just couldn't prove it. The high p-value reflects weak evidence, not equivalence.

[KEY INSIGHT]
**Absence of evidence is not evidence of absence.** A non-significant t-test says your data lacks the precision to detect a difference. Only a test designed to support equivalence (like TOST) can make that positive claim.

**Try it:** Simulate the same underlying scenario with N = 500 per group, using `rnorm()`. Does the t-test now detect the difference?

```r title="Your turn: scale sample size up"
set.seed(1)
ex_big_x <- rnorm(500, mean = 10.2, sd = 1.0)
ex_big_y <- rnorm(500, mean = 11.5, sd = 1.0)

# your code here
ex_big_test <- NULL
#> Expected: p < 0.001, well below 0.05
```

<details>
<summary>Click to reveal solution</summary>

```r title="Scale N up solution"
set.seed(1)
ex_big_x <- rnorm(500, mean = 10.2, sd = 1.0)
ex_big_y <- rnorm(500, mean = 11.5, sd = 1.0)
ex_big_test <- t.test(ex_big_x, ex_big_y)
ex_big_test$p.value
#> [1] 1.254521e-86
```

**Explanation:** Same true difference, much larger N, and the p-value collapses to essentially zero. The "non-significance" at N=5 was a power problem, not a truth about the population.

</details>

## How does TOST combine two one-sided tests?

TOST formalises the flip. You pick a lower bound $L$ and an upper bound $U$ around zero that represent the largest difference you'd call "practically nothing." Then you run two one-sided tests:

$$H_{0,\text{lower}}: \mu_A - \mu_B \le L \qquad H_{0,\text{upper}}: \mu_A - \mu_B \ge U$$

Reject both at significance level $\alpha$ and you've shown the true difference lies strictly inside $(L, U)$. In a two-sample setting, the two test statistics are:

$$t_{\text{lower}} = \frac{\bar{x}_A - \bar{x}_B - L}{SE} \qquad t_{\text{upper}} = \frac{\bar{x}_A - \bar{x}_B - U}{SE}$$

Where:
- $\bar{x}_A, \bar{x}_B$ = sample means
- $SE$ = standard error of the mean difference
- $L, U$ = lower and upper equivalence bounds

The `tost()` helper below wraps base R's `t.test()` into a tidy summary.

```r title="TOST helper returning a tidy result"
tost <- function(x, y, low, high, alpha = 0.05) {
  t_lower <- t.test(x, y, alternative = "greater", mu = low)
  t_upper <- t.test(x, y, alternative = "less",    mu = high)
  max_p   <- max(t_lower$p.value, t_upper$p.value)
  list(
    diff      = mean(x) - mean(y),
    p_lower   = t_lower$p.value,
    p_upper   = t_upper$p.value,
    max_p     = max_p,
    equivalent = max_p < alpha
  )
}

# Re-run the monitor example
result <- tost(monitor_a, monitor_b, low = -2, high = 2)
result
#> $diff
#> [1] 0.05
#>
#> $p_lower
#> [1] 0.0001262827
#>
#> $p_upper
#> [1] 0.0002227712
#>
#> $max_p
#> [1] 0.0002227712
#>
#> $equivalent
#> [1] TRUE
```

One call, one verdict. The helper reports the observed difference (0.05), both one-sided p-values, the larger of the two (this is the TOST p-value you'd publish), and a boolean decision. An equivalent and very common way to read the result is the 90% confidence interval: if the (1 − 2α) CI for the mean difference lies entirely inside $[L, U]$, equivalence holds. This is the approach FDA bioequivalence reviews prefer because the CI is easier to interpret than two p-values.

[NOTE]
**Each one-sided test uses alpha, not alpha/2.** Because you need both tests to reject, the overall Type I error rate stays bounded at alpha. No Bonferroni correction required. This is what makes TOST efficient compared to a naive double-test.

**Try it:** Extend `tost()` to also return the 90% CI on the mean difference, so a reader can check whether it sits inside the bounds.

```r title="Your turn: add a 90% CI to tost()"
ex_tost_ci <- function(x, y, low, high, alpha = 0.05) {
  # your code here
  # hint: t.test(x, y, conf.level = 1 - 2*alpha)$conf.int gives the 90% CI
  NULL
}

ex_tost_ci(monitor_a, monitor_b, low = -2, high = 2)
#> Expected: CI around [-0.87, 0.97], inside [-2, 2]
```

<details>
<summary>Click to reveal solution</summary>

```r title="tost with CI solution"
ex_tost_ci <- function(x, y, low, high, alpha = 0.05) {
  t_lower <- t.test(x, y, alternative = "greater", mu = low)
  t_upper <- t.test(x, y, alternative = "less",    mu = high)
  ci      <- t.test(x, y, conf.level = 1 - 2 * alpha)$conf.int
  max_p   <- max(t_lower$p.value, t_upper$p.value)
  list(
    diff       = mean(x) - mean(y),
    ci_90      = as.numeric(ci),
    max_p      = max_p,
    equivalent = max_p < alpha && ci[1] > low && ci[2] < high
  )
}
ex_tost_ci(monitor_a, monitor_b, low = -2, high = 2)
#> $diff
#> [1] 0.05
#> $ci_90
#> [1] -0.8666 0.9666
#> $max_p
#> [1] 0.0002227712
#> $equivalent
#> [1] TRUE
```

**Explanation:** The 90% CI falls strictly inside `[-2, 2]`, which is the confidence-interval restatement of the same TOST result. Two equivalent ways of writing one conclusion.

</details>

## How do you run a non-inferiority test in R?

Non-inferiority testing is TOST with only one side. You don't care if the new treatment is better, only that it isn't meaningfully worse. The margin is how much worse you'd tolerate. That turns into a single one-sided t-test: reject the hypothesis that the new treatment is at least `margin` worse, and you've shown non-inferiority.

Suppose drug B is a cheaper generic version of drug A, and you're willing to accept B being up to 0.5 seconds slower. If the data rule out "B is 0.5 seconds or more slower," you can market B with a straight face.

```r title="Non-inferiority with a one-sided margin"
# Response time in seconds, lower is better
drug_a <- c(2.1, 2.3, 1.9, 2.0, 2.2, 2.4, 2.1, 2.0, 2.3, 1.8,
            2.2, 2.1, 2.0, 2.3, 1.9, 2.1, 2.2, 2.0, 2.1, 2.3)
drug_b <- c(2.3, 2.1, 2.4, 2.2, 2.3, 2.5, 2.2, 2.1, 2.4, 2.0,
            2.3, 2.2, 2.1, 2.4, 2.0, 2.2, 2.3, 2.1, 2.2, 2.4)

# Non-inferiority: reject H0 that (B - A) >= 0.5
# alternative = "less" tests that diff < margin
margin  <- 0.5
ni_test <- t.test(drug_b, drug_a, alternative = "less", mu = margin)
ni_test$p.value
#> [1] 7.554e-10

ni_test$p.value < 0.05
#> [1] TRUE
```

The p-value is essentially zero, so you reject "B is 0.5+ seconds slower than A." Drug B is non-inferior to drug A at the 0.5-second margin. Note what you have *not* shown: that B is equivalent (you'd need a second test against a lower bound), or that B is superior (you'd need a test against `mu = 0`). Each of those claims requires its own hypothesis.

[TIP]
**Non-inferiority margins are clinical decisions, not statistical ones.** A 0.5-second margin on drug response should come from clinicians who know what's acceptable for patients, or from regulatory guidance. Picking a margin that makes your data win is p-hacking.

**Try it:** Using the same `drug_a` and `drug_b`, test whether drug B is *superior* (strictly faster than A, not just non-inferior). Expect to fail to reject, because B is actually slower.

```r title="Your turn: superiority instead of non-inferiority"
# Superiority: H0 that B >= A, H1 that B < A (B is strictly faster)
# your code here
ex_sup_test <- NULL

ex_sup_test$p.value
#> Expected: p close to 0.99, B is not superior
```

<details>
<summary>Click to reveal solution</summary>

```r title="Superiority solution"
ex_sup_test <- t.test(drug_b, drug_a, alternative = "less", mu = 0)
ex_sup_test$p.value
#> [1] 0.9917
```

**Explanation:** Superiority is the same structure with `mu = 0`. B's mean is 2.24 vs A's 2.12, so the one-sided test in the "B < A" direction fails completely. You can't claim B is faster; you can only claim B is close enough.

</details>

## How do you test bioequivalence with the FDA 80-125% rule?

Bioequivalence is TOST with three twists: the data are paired (each subject takes both formulations), the analysis is on the log scale, and the FDA bounds are [80%, 125%]. The log scale matters because pharmacokinetic data are multiplicative, and 80% and 125% are reciprocal ratios ($1/0.8 = 1.25$) that become symmetric bounds of $\pm\ln(1.25) \approx \pm 0.223$ once you log-transform. This is what makes the asymmetric-looking rule a clean two-sided TOST.

The target quantity is the geometric mean ratio (GMR) of the test drug to the reference drug. If the 90% CI on the GMR lies entirely inside [80%, 125%], the drugs are bioequivalent.

```r title="Bioequivalence test with log-transform + FDA bounds"
# 24 subjects, each takes test and reference drug (paired)
# AUC = area under the plasma concentration curve
auc_test <- c(105,  88, 125,  93, 112,  97, 108, 102,  99, 118,
               85,  95, 110, 101, 122,  89, 114, 106,  98, 120,
               94, 103, 107,  99)
auc_ref  <- c(102,  92, 118,  95, 108, 100, 104,  98, 101, 114,
               88,  97, 106,  98, 116,  92, 110, 102, 100, 115,
               96, 100, 104,  96)

# Work on the log scale
log_ratio <- log(auc_test) - log(auc_ref)

# FDA bioequivalence bounds on the log scale
be_lower <- log(0.80)    # ≈ -0.2231
be_upper <- log(1.25)    # ≈  0.2231

# Paired TOST: one-sample t-tests on the log ratios
p_lower <- t.test(log_ratio, alternative = "greater", mu = be_lower)$p.value
p_upper <- t.test(log_ratio, alternative = "less",    mu = be_upper)$p.value
c(p_lower = p_lower, p_upper = p_upper)
#>      p_lower      p_upper
#> 5.2e-18      2.0e-16

# 90% CI on the log scale, then back-transform to percent
ci90    <- t.test(log_ratio, conf.level = 0.90)$conf.int
ci_pct  <- exp(ci90) * 100
ci_pct
#> [1]  99.51 102.68
#> attr(,"conf.level")
#> [1] 0.9
```

Both one-sided tests reject their bounds with tiny p-values, and the 90% CI on the geometric mean ratio is roughly [99.5%, 102.7%]. That interval sits comfortably inside [80%, 125%], so the test drug is declared bioequivalent to the reference. The point estimate (exp of the mean log ratio) is about 101%, which means the test drug produces ~1% more AUC on average, well inside the acceptable window.

[KEY INSIGHT]
**Log-transformation turns the 80-125% asymmetry into a symmetric test.** On the original scale, being 20% lower and 25% higher are the same size in opposite directions only because $\log(0.8) = -\log(1.25)$. Any ratio comparison should live on the log scale.

[WARNING]
**A 90% CI that clips 80% or 125% fails bioequivalence even if the point estimate is 100%.** Regulators care about the worst case the data allow, not the best guess. You pass bioequivalence when the entire interval sits strictly inside the bounds; a single nicked edge is a fail.

**Try it:** For narrow-therapeutic-index drugs, regulators sometimes tighten the bounds to [90%, 111.11%] (a ±10% band). Re-run TOST with these tighter bounds on the same `auc_test` and `auc_ref`.

```r title="Your turn: narrow-therapeutic-index (NTI) bounds"
# Tighter NTI bounds: 90% to 111.11%
ex_nti_low  <- log(0.90)
ex_nti_high <- log(1 / 0.90)

# your code here
ex_nti_lower <- NULL
ex_nti_upper <- NULL

c(lower = ex_nti_lower, upper = ex_nti_upper)
#> Expected: both p-values still tiny, drug still bioequivalent under NTI rules
```

<details>
<summary>Click to reveal solution</summary>

```r title="NTI bounds solution"
ex_nti_lower <- t.test(log_ratio, alternative = "greater", mu = ex_nti_low)$p.value
ex_nti_upper <- t.test(log_ratio, alternative = "less",    mu = ex_nti_high)$p.value
c(lower = ex_nti_lower, upper = ex_nti_upper)
#>      lower      upper
#> 4.0e-08    1.3e-07
```

**Explanation:** Both p-values drop but remain well below 0.05. Because the 90% CI sits near 100%, even the tighter NTI window is comfortably wider than the uncertainty in the data. A test drug with more variable PK or a larger geometric mean shift could easily fail NTI while passing the standard 80-125% rule.

</details>

## How do you choose equivalence bounds that make sense?

The bound is the most consequential choice in a TOST. A bound of ±5 units will pass almost anything; a bound of ±0.01 will fail almost everything. Three legitimate strategies exist:

1. **Clinical or practical minimum.** The smallest effect a domain expert would act on. A 2 mmHg difference between BP monitors is clinically noise; a 10 mmHg difference is not.
2. **Empirical reference.** The effect size the prior study had 33% power to detect. Anything smaller than that effect "the original couldn't have seen anyway" (Simonsohn's small-telescopes approach).
3. **Regulatory.** FDA bioequivalence uses [80%, 125%] on the log scale; EMA guidelines follow similarly; clinical trial protocols lock the margin in advance.

The one rule: pick the bound before you look at the data.

```r title="Same data, three bounds, three verdicts"
sample_d_x <- c(10.1, 9.8, 10.3, 9.9, 10.2, 10.0, 9.7, 10.4, 10.1, 9.8,
                10.3, 9.9, 10.0, 10.2, 9.8, 10.1, 10.4, 9.7, 10.2, 10.0,
                 9.9, 10.1, 9.8, 10.3, 10.0, 10.2, 9.9, 10.1, 10.0, 9.8)
sample_d_y <- c(10.3, 10.1, 10.5, 10.2, 10.4, 10.3, 10.0, 10.6, 10.4, 10.1,
                10.5, 10.2, 10.3, 10.4, 10.1, 10.3, 10.5, 10.0, 10.4, 10.2,
                10.1, 10.3, 10.0, 10.5, 10.2, 10.4, 10.1, 10.3, 10.2, 10.1)

# Build a sensitivity table over bounds
run_tost <- function(bound) {
  pl <- t.test(sample_d_x, sample_d_y, alternative = "greater", mu = -bound)$p.value
  pu <- t.test(sample_d_x, sample_d_y, alternative = "less",    mu =  bound)$p.value
  max(pl, pu)
}
bounds      <- c(1.0, 0.5, 0.3, 0.2, 0.1)
bound_table <- data.frame(
  bound      = bounds,
  max_p      = sapply(bounds, run_tost),
  equivalent = sapply(bounds, run_tost) < 0.05
)
bound_table
#>   bound     max_p equivalent
#> 1   1.0 0.0000000       TRUE
#> 2   0.5 0.0000080       TRUE
#> 3   0.3 0.0856143      FALSE
#> 4   0.2 0.7544139      FALSE
#> 5   0.1 0.9961612      FALSE
```

Observed mean difference is about -0.23, so any bound of ±0.5 or more passes easily. At ±0.3 the test is inconclusive (max p = 0.09, just over the alpha line) because the bound is barely wider than the difference itself. At ±0.2 and ±0.1, the data outright contradict equivalence. The "right" bound lives outside R: it is whatever width the decision-maker considers too small to act on.

[WARNING]
**Choosing bounds after seeing the data is p-hacking.** If you run TOST at several widths and report the one that passed, you've inflated your Type I error rate and produced a conclusion that won't hold up in replication. Pre-register your bound, or at minimum disclose every bound you tested.

**Try it:** Using `sample_d_x` and `sample_d_y`, find the minimum bound (to two decimal places) at which equivalence is *just* achieved. A small search loop works.

```r title="Your turn: minimum bound that achieves equivalence"
# Hint: try a sequence of bounds, return the first one where max p < 0.05
ex_bound_search <- function(x, y, candidates = seq(0.10, 1.00, by = 0.01)) {
  # your code here
  NULL
}

ex_bound_search(sample_d_x, sample_d_y)
#> Expected: ~0.37
```

<details>
<summary>Click to reveal solution</summary>

```r title="Minimum bound solution"
ex_bound_search <- function(x, y, candidates = seq(0.10, 1.00, by = 0.01)) {
  for (b in candidates) {
    pl <- t.test(x, y, alternative = "greater", mu = -b)$p.value
    pu <- t.test(x, y, alternative = "less",    mu =  b)$p.value
    if (max(pl, pu) < 0.05) return(b)
  }
  NA
}
ex_bound_search(sample_d_x, sample_d_y)
#> [1] 0.37
```

**Explanation:** The smallest symmetric bound that passes TOST on this data is roughly ±0.37. Note this procedure is **only valid as a diagnostic**. Using this search to choose the bound you report would be cherry-picking.

</details>

## Practice Exercises

### Exercise 1: Generic vs brand-name ibuprofen

You're testing whether a generic ibuprofen delivers pain relief equivalent to the brand-name version. Equivalence is defined as the mean time to relief being within ±5 minutes of the brand. Run TOST on the data below and save the result to `my_tost1`.

```r title="Exercise 1 starter"
my_generic <- c(22, 25, 19, 24, 21, 23, 20, 26, 22, 24, 21, 23, 22, 20, 25, 19, 23, 22, 24, 21)
my_brand   <- c(20, 22, 21, 23, 19, 22, 20, 24, 21, 22, 20, 22, 21, 19, 23, 20, 22, 21, 22, 20)

# Hint: use the tost() helper from earlier in the post

my_tost1 <- NULL
my_tost1
#> Expected: equivalent = TRUE, max_p well below 0.05
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_tost1 <- tost(my_generic, my_brand, low = -5, high = 5)
my_tost1
#> $diff
#> [1] 1.55
#>
#> $p_lower
#> [1] 1.05e-10
#>
#> $p_upper
#> [1] 1.20e-07
#>
#> $max_p
#> [1] 1.20e-07
#>
#> $equivalent
#> [1] TRUE
```

**Explanation:** Observed difference is 1.55 minutes, well inside ±5. Both one-sided tests reject their bounds, so the generic is declared equivalent to the brand.

</details>

### Exercise 2: Non-inferiority from summary statistics

Write a function `non_inferiority_from_summary(m1, s1, n1, m2, s2, n2, margin)` that runs a non-inferiority test from summary statistics alone (no raw data). Use group 1 as the new treatment and group 2 as the standard. A larger value is better. Return the p-value and a pass/fail decision. Apply it to: new = (45, 8, 120), standard = (47, 9, 115), margin = 5 units worse acceptable.

```r title="Exercise 2 starter"
non_inferiority_from_summary <- function(m1, s1, n1, m2, s2, n2, margin) {
  # Hint: Welch's t-test on summary stats:
  # diff = m1 - m2
  # se = sqrt(s1^2/n1 + s2^2/n2)
  # df = (s1^2/n1 + s2^2/n2)^2 / ((s1^2/n1)^2/(n1-1) + (s2^2/n2)^2/(n2-1))
  # non-inferiority H0: diff <= -margin; H1: diff > -margin
  # your code here
  NULL
}

non_inferiority_from_summary(45, 8, 120, 47, 9, 115, margin = 5)
#> Expected: p well below 0.05, non-inferiority achieved
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
non_inferiority_from_summary <- function(m1, s1, n1, m2, s2, n2, margin) {
  diff <- m1 - m2
  se   <- sqrt(s1^2 / n1 + s2^2 / n2)
  df   <- (s1^2 / n1 + s2^2 / n2)^2 /
          ((s1^2 / n1)^2 / (n1 - 1) + (s2^2 / n2)^2 / (n2 - 1))
  # Testing diff > -margin (new is not meaningfully worse)
  t_stat <- (diff - (-margin)) / se
  p_val  <- 1 - pt(t_stat, df)
  list(
    diff   = diff,
    t_stat = t_stat,
    df     = df,
    p      = p_val,
    pass   = p_val < 0.05
  )
}
non_inferiority_from_summary(45, 8, 120, 47, 9, 115, margin = 5)
#> $diff
#> [1] -2
#>
#> $t_stat
#> [1] 2.636
#>
#> $p
#> [1] 0.00452
#>
#> $pass
#> [1] TRUE
```

**Explanation:** The new treatment's mean is 2 units lower than standard, but the 5-unit margin easily absorbs that gap. The one-sided p-value is 0.0045, so non-inferiority is established.

</details>

### Exercise 3: Paired bioequivalence on AUC

Twenty-four subjects each took a test drug and a reference drug. Paired AUC values are supplied below. Run a paired TOST on the log ratios with FDA bounds ±log(1.25), and report the 90% CI back on the percent scale. Save the log ratios to `my_log_ratio`.

```r title="Exercise 3 starter"
my_auc_test <- c(115, 108, 122, 98, 130, 112, 105, 118, 95, 125,
                 110, 102, 128, 107, 120, 100, 115, 108, 125, 112,
                 98, 120, 106, 115)
my_auc_ref  <- c(110, 104, 118, 95, 125, 108, 102, 114, 92, 120,
                 106, 98, 122, 103, 115, 97, 110, 104, 120, 108,
                 95, 115, 102, 110)

# Hint:
# 1. my_log_ratio <- log(test) - log(ref)
# 2. Two one-sided t-tests against log(0.80) and log(1.25)
# 3. 90% CI via t.test(..., conf.level = 0.90)$conf.int, then exp()*100

my_log_ratio <- NULL
#> Expected: 90% CI in percent inside [80, 125], bioequivalent
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
my_log_ratio <- log(my_auc_test) - log(my_auc_ref)

p_lo <- t.test(my_log_ratio, alternative = "greater", mu = log(0.80))$p.value
p_hi <- t.test(my_log_ratio, alternative = "less",    mu = log(1.25))$p.value
ci   <- exp(t.test(my_log_ratio, conf.level = 0.90)$conf.int) * 100

list(
  gmr_pct = exp(mean(my_log_ratio)) * 100,
  ci_pct  = as.numeric(ci),
  max_p   = max(p_lo, p_hi),
  be      = max(p_lo, p_hi) < 0.05
)
#> $gmr_pct
#> [1] 103.7
#>
#> $ci_pct
#> [1] 103.1 104.3
#>
#> $max_p
#> [1] 1.6e-28
#>
#> $be
#> [1] TRUE
```

**Explanation:** Geometric mean ratio is ~104%, and the 90% CI is narrowly inside the FDA window. Both one-sided tests reject with tiny p-values. Bioequivalence is declared.

</details>

## Complete Example

A real bioequivalence dossier evaluates at least two PK parameters. The drug passes only if *both* pass. Here we run the full decision on Cmax (peak concentration) and AUC (total exposure) using a helper, then build a one-line summary.

```r title="End-to-end bioequivalence decision"
# 24 paired subjects, Cmax and AUC
pk_test_cmax <- c(45, 38, 52, 41, 48, 43, 50, 39, 46, 55, 42, 47,
                  49, 44, 51, 40, 53, 45, 42, 48, 46, 50, 43, 45)
pk_ref_cmax  <- c(43, 40, 50, 42, 46, 41, 48, 38, 44, 52, 40, 45,
                  47, 42, 49, 39, 51, 44, 41, 46, 44, 48, 41, 43)

pk_test_auc  <- c(210, 185, 235, 198, 220, 205, 228, 190, 215, 245,
                  200, 218, 225, 208, 232, 192, 240, 212, 202, 224,
                  214, 228, 206, 216)
pk_ref_auc   <- c(205, 192, 228, 203, 215, 198, 222, 186, 210, 240,
                  196, 213, 221, 204, 228, 188, 235, 208, 199, 220,
                  211, 222, 203, 212)

run_be <- function(test_vals, ref_vals, bound = log(1.25), alpha = 0.05) {
  log_r <- log(test_vals) - log(ref_vals)
  p_lo  <- t.test(log_r, alternative = "greater", mu = -bound)$p.value
  p_hi  <- t.test(log_r, alternative = "less",    mu =  bound)$p.value
  ci    <- exp(t.test(log_r, conf.level = 1 - 2 * alpha)$conf.int) * 100
  list(
    gmr_pct = round(exp(mean(log_r)) * 100, 2),
    ci_pct  = round(as.numeric(ci), 2),
    max_p   = max(p_lo, p_hi),
    pass    = max(p_lo, p_hi) < alpha
  )
}

be_cmax <- run_be(pk_test_cmax, pk_ref_cmax)
be_auc  <- run_be(pk_test_auc,  pk_ref_auc)

summary_df <- data.frame(
  parameter = c("Cmax", "AUC"),
  gmr_pct   = c(be_cmax$gmr_pct, be_auc$gmr_pct),
  ci_low    = c(be_cmax$ci_pct[1], be_auc$ci_pct[1]),
  ci_high   = c(be_cmax$ci_pct[2], be_auc$ci_pct[2]),
  max_p     = c(be_cmax$max_p,  be_auc$max_p),
  pass      = c(be_cmax$pass,   be_auc$pass)
)
summary_df
#>   parameter gmr_pct ci_low ci_high     max_p pass
#> 1      Cmax  105.07 102.99  107.20  2.3e-18 TRUE
#> 2       AUC  103.14 101.61  104.69  1.0e-19 TRUE

overall_be <- all(summary_df$pass)
overall_be
#> [1] TRUE
```

Both parameters pass: Cmax GMR is 105% with a 90% CI of [103%, 107%], and AUC GMR is 103% with 90% CI [102%, 105%]. Both CIs sit well inside [80%, 125%], so the test drug is declared bioequivalent to the reference for regulatory submission. If either parameter's CI had touched or crossed a bound, the entire submission would fail.

## Summary

| Use case | Bounds convention | R call pattern |
|---|---|---|
| Two-sided equivalence | ±L, set from domain knowledge | Two `t.test()` calls with `alternative = "greater"` and `"less"` at mu = -L and +L |
| Non-inferiority | One-sided, margin = worst-acceptable worsening | One `t.test()` with `alternative = "less"` and mu = margin |
| Bioequivalence (FDA) | [80%, 125%] on log scale → ±log(1.25) | Paired one-sample TOST on `log(test) - log(ref)` |

Key takeaways:

- A non-significant t-test never proves equivalence. Run TOST if you want to support that claim.
- TOST combines two one-sided tests and decides equivalence when both reject at alpha.
- The 90% CI restatement is equivalent to the two-p-value version and is easier to communicate.
- Non-inferiority is TOST with only the lower bound active.
- Bioequivalence applies TOST on the log scale with regulator-defined [80%, 125%] bounds.
- The bound is a policy decision made before data collection, not a number to tune after the fact.

## References

1. Lakens, D. (2017). Equivalence Tests: A Practical Primer for t-Tests, Correlations, and Meta-Analyses. *Social Psychological and Personality Science*, 8(4). [Link](https://journals.sagepub.com/doi/10.1177/1948550617697177)
2. Lakens, D., Scheel, A. M., & Isager, P. M. (2018). Equivalence Testing for Psychological Research: A Tutorial. *Advances in Methods and Practices in Psychological Science*, 1(2). [Link](https://journals.sagepub.com/doi/10.1177/2515245918770963)
3. Schuirmann, D. J. (1987). A comparison of the two one-sided tests procedure and the power approach for assessing the equivalence of average bioavailability. *Journal of Pharmacokinetics and Biopharmaceutics*, 15(6). [Link](https://pubmed.ncbi.nlm.nih.gov/3450848/)
4. U.S. Food and Drug Administration. Statistical Approaches to Establishing Bioequivalence (Guidance for Industry). [Link](https://www.fda.gov/regulatory-information/search-fda-guidance-documents/statistical-approaches-establishing-bioequivalence)
5. Caldwell, A. TOSTER R package vignettes. CRAN. [Link](https://cran.r-project.org/web/packages/TOSTER/)
6. Walker, E., & Nowacki, A. S. (2011). Understanding Equivalence and Noninferiority Testing. *Journal of General Internal Medicine*, 26(2). [Link](https://pmc.ncbi.nlm.nih.gov/articles/PMC3043220/)
7. European Medicines Agency. Guideline on the Investigation of Bioequivalence. [Link](https://www.ema.europa.eu/en/investigation-bioequivalence-scientific-guideline)

## Continue Learning

- [Hypothesis Testing in R](Hypothesis-Testing-in-R.html), the null-hypothesis framework that TOST inverts, with the p-value mechanics you'll need behind every one-sided test.
- [Sample Size in R](Sample-Size-Planning-in-R.html), power analysis to size a TOST study before you collect data, so your bounds are realistic for your sample.
- [Confidence Intervals in R](Confidence-Intervals-in-R.html), the CI interpretation that anchors the 90% interval approach regulators use for bioequivalence decisions.
