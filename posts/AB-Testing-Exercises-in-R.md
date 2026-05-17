---
title: "A/B Testing Exercises in R: 18 Real-World Practice Problems"
slug: "AB-Testing-Exercises-in-R"
description: "Solve 18 A/B testing exercises in R covering sample size, prop.test, Welch t-test, peeking, Bonferroni, dropout inflation, and end-to-end analysis."
keywords: "a/b testing exercises R, a/b test sample size, pwr.2p.test exercises, prop.test a/b, peeking problem R, minimum detectable effect, ab test dropout, novelty effect R"
mathjax: true
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "A/B Testing Exercises"
sidebar_order: 145
fr_parent: "AB-Testing-in-R.html"
auto_link_terms: "a/b testing exercises|a/b test exercises|a/b testing problems|a/b testing practice|pwr.2p.test exercises|peeking problem r"
auto_link_case_sensitive: false
target_keyword: "a/b testing exercises in R"
sibling_block_enabled: false
difficulty: "Mixed"
---

# A/B Testing Exercises in R: 18 Real-World Practice Problems

<p class="lead">These 18 A/B testing exercises in R cover the end-to-end experiment workflow: sizing tests with <code>pwr</code>, analysing proportions with <code>prop.test()</code>, comparing skewed continuous metrics, quantifying the peeking problem, correcting for multiple metrics, and writing a stakeholder-ready summary. Each problem hides a full runnable solution; try it yourself first.</p>

```r title="Run this once before any exercise"
library(pwr)
library(dplyr)
library(tidyr)
library(broom)
library(ggplot2)
```

## Section 1. Sample size and power planning (4 problems)

### Exercise 1.1: Compute per-arm sample size for a two-proportion test

**Task:** A growth team at a B2C app wants to test a new checkout flow against the current one. Baseline conversion is 4%, the PM wants to detect an absolute lift to 5% with 80% power at a 5% significance level. Use `pwr.2p.test()` with `ES.h()` to compute the per-arm sample size and save the full result object to `ex_1_1`.

**Expected result:**

```
#>      Difference of proportion power calculation for binomial distribution (arcsine transformation)
#>
#>               h = 0.04832
#>               n = 3364.181
#>       sig.level = 0.05
#>           power = 0.8
#>     alternative = two.sided
#>
#> NOTE: same sample sizes
```

**Difficulty:** Beginner

[HINTS]
Power, significance, effect size, and sample size form one locked system: fix any three and the fourth is determined.
Convert the two proportions into Cohen's h with `ES.h(p1 = 0.05, p2 = 0.04)`, pass it as `h` along with `sig.level` and `power`, and leave the sample-size argument out.

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- pwr.2p.test(
  h         = ES.h(p1 = 0.05, p2 = 0.04),
  sig.level = 0.05,
  power     = 0.80
)
ex_1_1
#>      Difference of proportion power calculation for binomial distribution (arcsine transformation)
#>
#>               h = 0.04832381
#>               n = 3364.181
#>       sig.level = 0.05
#>           power = 0.8
#>     alternative = two.sided
#>
#> NOTE: same sample sizes
```

**Explanation:** `ES.h()` converts two proportions into Cohen's h, an arcsine-transformed effect size that stabilises variance across the 0-1 range. Plugging h into `pwr.2p.test()` lets you solve for any one missing piece (`n`, `power`, `sig.level`, or `h`); pass three and leave the fourth as `NULL`. A common mistake is plugging the raw difference `p1 - p2 = 0.01` instead of `h`: that conflates effect size with proportion units and undersizes the test by roughly 20% at low baselines.

</details>

### Exercise 1.2: Sample size for a continuous metric with pwr.t.test

**Task:** A finance team wants to detect a $4 lift on average order value (current AOV = $48, sd $32) at 80% power and 5% alpha using a two-sample Welch t-test. Use `pwr.t.test()` to compute the per-arm sample size and save the result object to `ex_1_2`.

**Expected result:**

```
#>      Two-sample t test power calculation
#>
#>               n = 1004.214
#>               d = 0.125
#>       sig.level = 0.05
#>           power = 0.8
#>     alternative = two.sided
#>
#> NOTE: n is number in *each* group
```

**Difficulty:** Beginner

[HINTS]
A continuous-metric effect size is the mean difference rescaled into standard-deviation units.
Give `pwr.t.test()` a `d` of `4 / 32`, set `sig.level` and `power`, and pass `type = "two.sample"`.

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- pwr.t.test(
  d         = 4 / 32,
  sig.level = 0.05,
  power     = 0.80,
  type      = "two.sample",
  alternative = "two.sided"
)
ex_1_2
#>      Two-sample t test power calculation
#>
#>               n = 1004.214
#>               d = 0.125
#>       sig.level = 0.05
#>           power = 0.8
#>     alternative = two.sided
#>
#> NOTE: n is number in *each* group
```

**Explanation:** Cohen's d for two samples is `(mu1 - mu2) / sd_pooled`; here it collapses to `4 / 32 = 0.125`, a "small" effect. The `type = "two.sample"` argument is critical: dropping it defaults to a one-sample test, which dramatically undersizes the experiment. For unequal sds use `pwr.t2n.test()` with the more conservative pooled sd, or simulate power directly since `pwr.t.test()` assumes equal variances under the hood.

</details>

### Exercise 1.3: Solve for the minimum detectable effect under a fixed sample budget

**Task:** Engineering capped the experiment at 5,000 users per arm. With baseline conversion 4%, alpha 0.05, and 80% power, compute the minimum detectable Cohen's h, then back-translate it into an absolute lift (proportion units) and a relative lift (percent). Save a named numeric vector `ex_1_3` with elements `h`, `mde_abs`, and `mde_rel`.

**Expected result:**

```
#>           h     mde_abs     mde_rel
#>   0.0560422   0.0117042  29.2604499
```

**Difficulty:** Intermediate

[HINTS]
With sample size fixed, the unknown flips to effect size, which you then translate back into proportion units.
Call `pwr.2p.test()` with `n`, `sig.level`, and `power` set, read `$h`, and invert the arcsine transform with `sin(asin(sqrt(0.04)) + h/2)^2`.

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
h_mde   <- pwr.2p.test(n = 5000, sig.level = 0.05, power = 0.80)$h
p1      <- (sin(asin(sqrt(0.04)) + h_mde / 2))^2
mde_abs <- p1 - 0.04
mde_rel <- 100 * mde_abs / 0.04

ex_1_3 <- c(h = h_mde, mde_abs = mde_abs, mde_rel = mde_rel)
ex_1_3
#>           h     mde_abs     mde_rel
#>   0.0560422   0.0117042  29.2604499
```

**Explanation:** With a sample cap, the meaningful question flips from "how many users?" to "how big a lift must we believe in?". The h returned by `pwr.2p.test()` is in arcsine units; inverting `2*asin(sqrt(p))` back to a proportion gives the detectable treatment rate. At 4% baseline with 5,000 per arm, you can only see lifts of ~29% relative or larger; smaller lifts will look like noise. This is the right diagnostic to run before launching, not after a flat result.

</details>

### Exercise 1.4: Build a power curve over a grid of sample sizes

**Task:** A marketing analyst wants to show stakeholders how power grows with sample size. Compute the achieved power for `n = seq(2000, 20000, by = 2000)` per arm, assuming baseline 5%, target 6%, and alpha 0.05, using `pwr.2p.test()`. Save a tibble `ex_1_4` with columns `n` and `power`.

**Expected result:**

```
#> # A tibble: 10 x 2
#>        n  power
#>    <dbl>  <dbl>
#>  1  2000  0.278
#>  2  4000  0.495
#>  3  6000  0.666
#>  4  8000  0.787
#>  5 10000  0.869
#>  6 12000  0.921
#>  7 14000  0.954
#>  8 16000  0.974
#>  9 18000  0.985
#> 10 20000  0.992
```

**Difficulty:** Intermediate

[HINTS]
Achieved power is what you compute when sample size is the input rather than the quantity being solved for.
Iterate over the n grid with `sapply()`, calling `pwr.2p.test(h = ..., n = nn, sig.level = 0.05)$power` for each, and collect the results into a tibble with `mutate()`.

```r title="Your turn"
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
h_target <- ES.h(p1 = 0.06, p2 = 0.05)

ex_1_4 <- tibble(n = seq(2000, 20000, by = 2000)) |>
  mutate(power = sapply(n, function(nn) {
    pwr.2p.test(h = h_target, n = nn, sig.level = 0.05)$power
  }))
ex_1_4
#> # A tibble: 10 x 2
#>        n  power
#>    <dbl>  <dbl>
#>  1  2000  0.278
#>  2  4000  0.495
#>  3  6000  0.666
#>  4  8000  0.787
#>  5 10000  0.869
#> # 5 more rows hidden
```

**Explanation:** Power curves communicate experiment cost far more effectively than a single "need 14,000 users" number. The curve is concave: doubling n from 2,000 to 4,000 buys you 22 power points; doubling again from 10,000 to 20,000 only buys 12. Plot this with `geom_line()` and add a horizontal line at 0.8 so stakeholders can read off the inflection point. `sapply()` over the n grid is fine here; for many parameter combinations, `purrr::map_dfr()` over an `expand_grid()` is cleaner.

</details>

## Section 2. Two-proportion analysis (3 problems)

### Exercise 2.1: Run a vanilla prop.test on observed A/B results

**Task:** The experimentation team wrapped a checkout test with 412 conversions in 9,800 control users and 478 conversions in 9,750 treatment users. Use `prop.test()` to compare the two conversion rates and save the htest object to `ex_2_1`.

**Expected result:**

```
#> 	2-sample test for equality of proportions with continuity correction
#>
#> data:  c(412, 478) out of c(9800, 9750)
#> X-squared = 5.4213, df = 1, p-value = 0.01992
#> alternative hypothesis: two.sided
#> 95 percent confidence interval:
#>  -0.012843 -0.001127
#> sample estimates:
#>     prop 1     prop 2
#> 0.04204082 0.04902564
```

**Difficulty:** Beginner

[HINTS]
Comparing two conversion rates means comparing two success counts against their two totals.
Pass the conversions as `x = c(412, 478)` and the totals as `n = c(9800, 9750)` to `prop.test()`.

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- prop.test(
  x = c(412, 478),
  n = c(9800, 9750)
)
ex_2_1
#> 	2-sample test for equality of proportions with continuity correction
#>
#> data:  c(412, 478) out of c(9800, 9750)
#> X-squared = 5.4213, df = 1, p-value = 0.01992
#> alternative hypothesis: two.sided
#> 95 percent confidence interval:
#>  -0.012843 -0.001127
#> sample estimates:
#>     prop 1     prop 2
#> 0.04204082 0.04902564
```

**Explanation:** `prop.test()` is the workhorse two-sample comparison: pass conversions as `x` and totals as `n`, both length-2. By default it applies Yates' continuity correction, which inflates the chi-square statistic slightly and is conservative at small counts; pass `correct = FALSE` for the uncorrected z-test that most modern A/B platforms report. The CI here is for `prop 1 - prop 2`, so a wholly negative interval means treatment beats control; flip your sign convention only if your stakeholder reports lift as `treatment - control`.

</details>

### Exercise 2.2: Tidy the prop.test result with broom

**Task:** Take the same A/B data from Exercise 2.1 (412/9800 vs 478/9750) and run `broom::tidy()` on the `prop.test()` output to produce a one-row tibble. Save the tibble to `ex_2_2` and confirm it contains both proportion estimates plus the CI for the difference.

**Expected result:**

```
#> # A tibble: 1 x 9
#>   estimate1 estimate2 statistic p.value parameter conf.low conf.high method                                              alternative
#>       <dbl>     <dbl>     <dbl>   <dbl>     <dbl>    <dbl>     <dbl> <chr>                                               <chr>
#> 1    0.0420    0.0490      5.42  0.0199         1  -0.0128  -0.00113 2-sample test for equality of proportions with c... two.sided
```

**Difficulty:** Intermediate

[HINTS]
An htest object prints nicely but is awkward to stack across many tests, so convert it into a single data row.
Pipe the `prop.test()` result into `broom::tidy()` to get a one-row tibble.

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- prop.test(c(412, 478), c(9800, 9750)) |>
  broom::tidy()
ex_2_2
#> # A tibble: 1 x 9
#>   estimate1 estimate2 statistic p.value parameter conf.low conf.high method                                              alternative
#>       <dbl>     <dbl>     <dbl>   <dbl>     <dbl>    <dbl>     <dbl> <chr>                                               <chr>
#> 1    0.0420    0.0490      5.42  0.0199         1  -0.0128  -0.00113 2-sample test for equality of proportions with c... two.sided
```

**Explanation:** Wrapping `prop.test()` in `broom::tidy()` is what turns a printable htest into a row you can bind across dozens of tests. Use this inside `purrr::map_dfr()` when you sweep over many metric/segment combinations; you get a single tibble where each row is one A/B comparison, ready for `arrange(p.value)` or `mutate(p_adj = p.adjust(p.value, "BH"))`. `glance()` is an alternative for some htest classes but `tidy()` is the right choice for prop.test because it surfaces both estimates and the CI in one row.

</details>

### Exercise 2.3: Chi-square test on a 2x2 churn contingency table

**Task:** A retention team prepared a 2x2 contingency table comparing 30-day churn between control and treatment arms. Control: 1,180 churned, 2,820 retained out of 4,000. Treatment: 1,080 churned, 2,920 retained out of 4,000. Build the matrix with row names "control" and "treatment", column names "churned" and "retained", run `chisq.test()`, and save the result to `ex_2_3`.

**Expected result:**

```
#> 	Pearson's Chi-squared test with Yates' continuity correction
#>
#> data:  m
#> X-squared = 6.0593, df = 1, p-value = 0.01383
```

**Difficulty:** Intermediate

[HINTS]
A contingency table tests whether the row classification and column classification are independent of each other.
Pass the matrix `m` directly to `chisq.test()`.

```r title="Your turn"
m <- matrix(
  c(1180, 2820, 1080, 2920),
  nrow = 2, byrow = TRUE,
  dimnames = list(
    variant = c("control", "treatment"),
    churn   = c("churned", "retained")
  )
)
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
m <- matrix(
  c(1180, 2820, 1080, 2920),
  nrow = 2, byrow = TRUE,
  dimnames = list(
    variant = c("control", "treatment"),
    churn   = c("churned", "retained")
  )
)
ex_2_3 <- chisq.test(m)
ex_2_3
#> 	Pearson's Chi-squared test with Yates' continuity correction
#>
#> data:  m
#> X-squared = 6.0593, df = 1, p-value = 0.01383
```

**Explanation:** For a 2x2 table `chisq.test()` and `prop.test()` produce identical p-values; both reduce to the same chi-square statistic on one degree of freedom. The matrix form is more natural when you have churn pulled from a SQL `GROUP BY variant, churned` query. Use `chisq.test(m)$expected` to inspect expected counts; if any cell drops below 5 (rare with experiment-scale data but common in stratified slices) reach for `fisher.test()` instead.

</details>

## Section 3. Continuous metric tests (3 problems)

### Exercise 3.1: Welch two-sample t-test on simulated AOV

**Task:** Generate two AOV samples of 1,000 users each with `set.seed(7)`: control from `rnorm(1000, 48, 32)` and treatment from `rnorm(1000, 50, 33)`. Run a Welch two-sample `t.test()` on the two vectors and save the htest object to `ex_3_1`.

**Expected result:**

```
#> 	Welch Two Sample t-test
#>
#> data:  control and treatment
#> t = -1.4983, df = 1995.4, p-value = 0.1342
#> alternative hypothesis: true difference in means is not equal to 0
#> 95 percent confidence interval:
#>  -4.622  0.616
#> sample estimates:
#> mean of x mean of y
#>   47.97     49.97
```

**Difficulty:** Intermediate

[HINTS]
When the two arms may have unequal variances, the standard two-sample mean comparison already accounts for that.
Call `t.test(control, treatment)`, which applies the Welch correction by default unless you set `var.equal = TRUE`.

```r title="Your turn"
set.seed(7)
control   <- rnorm(1000, mean = 48, sd = 32)
treatment <- rnorm(1000, mean = 50, sd = 33)
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(7)
control   <- rnorm(1000, mean = 48, sd = 32)
treatment <- rnorm(1000, mean = 50, sd = 33)

ex_3_1 <- t.test(control, treatment)
ex_3_1
#> 	Welch Two Sample t-test
#>
#> data:  control and treatment
#> t = -1.4983, df = 1995.4, p-value = 0.1342
#> alternative hypothesis: true difference in means is not equal to 0
#> 95 percent confidence interval:
#>  -4.622  0.616
#> sample estimates:
#> mean of x mean of y
#>   47.97     49.97
```

**Explanation:** Welch is the right default for revenue-style metrics because variance often differs between arms; `t.test()` uses Welch unless you pass `var.equal = TRUE`. Note the true mean difference is $2 but the observed sample difference (~$2) is not significant at n=1,000 because $32-$33 sds make the standard error large (`sqrt(32^2/1000 + 33^2/1000) ~= 1.45`). Exercise 1.2 showed you needed ~1,004 per arm just to detect a $4 lift; here we asked for half that effect with the same n, so a null result is expected.

</details>

### Exercise 3.2: Mann-Whitney test on right-skewed page-load times

**Task:** Page-load times are heavily right-skewed, so a t-test on means is misleading. With `set.seed(11)`, generate `control_lp <- rexp(2000, rate = 1/2.1)` and `treatment_lp <- rexp(2000, rate = 1/2.0)` (seconds). Run `wilcox.test()` to compare distributions and save the htest object to `ex_3_2`.

**Expected result:**

```
#> 	Wilcoxon rank sum test with continuity correction
#>
#> data:  control_lp and treatment_lp
#> W = 2031453, p-value = 0.2531
#> alternative hypothesis: true location shift is not equal to 0
```

**Difficulty:** Intermediate

[HINTS]
For heavily skewed data, compare the two distributions by rank rather than by their means.
Pass the two vectors to `wilcox.test(control_lp, treatment_lp)`.

```r title="Your turn"
set.seed(11)
control_lp   <- rexp(2000, rate = 1 / 2.1)
treatment_lp <- rexp(2000, rate = 1 / 2.0)
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(11)
control_lp   <- rexp(2000, rate = 1 / 2.1)
treatment_lp <- rexp(2000, rate = 1 / 2.0)

ex_3_2 <- wilcox.test(control_lp, treatment_lp)
ex_3_2
#> 	Wilcoxon rank sum test with continuity correction
#>
#> data:  control_lp and treatment_lp
#> W = 2031453, p-value = 0.2531
#> alternative hypothesis: true location shift is not equal to 0
```

**Explanation:** `wilcox.test()` (Mann-Whitney U) compares stochastic dominance instead of means, so it is robust to the long right tail typical of latency, session duration, and revenue distributions. The null is "P(X > Y) = 0.5"; rejecting it means one distribution tends to produce larger values, not that means differ. For very large samples, prefer permutation tests or rank-based bootstrap CIs over the asymptotic Wilcoxon, but for n=2,000 the continuity-corrected version is fine.

</details>

### Exercise 3.3: Empirical power via simulation for a skewed metric

**Task:** A marketing analyst suspects the t-test will be underpowered against exponential revenue data. Simulate 500 A/B tests with `set.seed(101)`, n=500 per arm, control `rexp(rate = 1/10)`, treatment `rexp(rate = 1/11)`; for each test record the Welch t-test p-value and compute the empirical power as the proportion below 0.05. Save the scalar to `ex_3_3`.

**Expected result:**

```
#> [1] 0.214
```

**Difficulty:** Advanced

[HINTS]
Empirical power is simply the fraction of many repeated experiments that reach significance.
Loop `n_sim` times generating `rexp()` samples per arm, store each `t.test(ctl, trt)$p.value`, then take `mean(pvals < 0.05)`.

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(101)
n_sim   <- 500
n_arm   <- 500
pvals   <- numeric(n_sim)

for (i in seq_len(n_sim)) {
  ctl <- rexp(n_arm, rate = 1 / 10)
  trt <- rexp(n_arm, rate = 1 / 11)
  pvals[i] <- t.test(ctl, trt)$p.value
}

ex_3_3 <- mean(pvals < 0.05)
ex_3_3
#> [1] 0.214
```

**Explanation:** Simulation is the most reliable power tool when the data-generating process violates t-test assumptions. Here the true means differ by 1.0 (10 vs 11) and the analytic formula would suggest ~50% power, but the skewed exponential distribution inflates within-group sd so realised power is closer to 21%. The fix is either log-transform revenue before testing, use Wilcoxon, or apply CUPED variance reduction with a pre-period covariate. Always benchmark your test plan with a quick simulation before committing engineering time.

</details>

## Section 4. Sequential and peeking issues (3 problems)

### Exercise 4.1: Quantify the false positive rate from peeking

**Task:** Peeking inflates false positives in fixed-horizon tests. Simulate 2,000 A/A experiments with `set.seed(42)`, both arms at p=0.05, and "peek" at 10 evenly-spaced sample sizes from 500 to 5,000 per arm. Declare significance at the FIRST look where `prop.test()` returns p<0.05. Save the empirical false positive rate as a scalar to `ex_4_1` and compare it mentally to the nominal 5%.

**Expected result:**

```
#> [1] 0.2155
```

**Difficulty:** Advanced

[HINTS]
Every additional look is a fresh chance to cross the threshold, so repeated looks accumulate false positives.
For each simulation, loop over the peek sizes running `prop.test()`, `break` at the first `p.value < 0.05`, and take the `mean()` of the early-stop flags.

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
n_sim  <- 2000
peeks  <- seq(500, 5000, by = 500)
p_true <- 0.05

stopped_early <- logical(n_sim)

for (i in seq_len(n_sim)) {
  ctl <- rbinom(1, 5000, p_true)
  trt <- rbinom(1, 5000, p_true)

  ctl_seq <- rbinom(length(peeks), peeks, p_true)
  trt_seq <- rbinom(length(peeks), peeks, p_true)

  for (k in seq_along(peeks)) {
    pv <- suppressWarnings(
      prop.test(c(ctl_seq[k], trt_seq[k]), c(peeks[k], peeks[k]))$p.value
    )
    if (!is.na(pv) && pv < 0.05) {
      stopped_early[i] <- TRUE
      break
    }
  }
}

ex_4_1 <- mean(stopped_early)
ex_4_1
#> [1] 0.2155
```

**Explanation:** Even though every individual peek is a valid 5%-alpha test, the union across 10 looks gives roughly 4x the nominal false positive rate (~21% vs 5%). This is the central problem with watching dashboards in real time. The right fixes are alpha-spending procedures (O'Brien-Fleming, Pocock), Bayesian sequential tests with proper priors, or simply running to the pre-registered fixed horizon. Never stop a test early just because "it crossed the line today".

</details>

### Exercise 4.2: Apply a Bonferroni correction across 5 planned interim looks

**Task:** To control family-wise error at alpha=0.05 across 5 evenly-spaced interim looks at n=500, 1000, ..., 2500 per arm, compute the Bonferroni-adjusted per-look alpha and verify it via 2,000 A/A simulations with `set.seed(99)`, stopping at the first look where p<alpha_adj. Save a tibble `ex_4_2` with columns `alpha_adj` and `empirical_fpr`.

**Expected result:**

```
#> # A tibble: 1 x 2
#>   alpha_adj empirical_fpr
#>       <dbl>         <dbl>
#> 1      0.01        0.0535
```

**Difficulty:** Advanced

[HINTS]
Splitting the error budget evenly across all planned looks keeps the family-wise rate near its target.
Set `alpha_adj <- 0.05 / length(peeks)`, then in the simulation `break` at the first look where `p.value < alpha_adj`.

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(99)
n_sim     <- 2000
peeks     <- seq(500, 2500, by = 500)
p_true    <- 0.05
alpha_adj <- 0.05 / length(peeks)

flagged <- logical(n_sim)

for (i in seq_len(n_sim)) {
  ctl_seq <- rbinom(length(peeks), peeks, p_true)
  trt_seq <- rbinom(length(peeks), peeks, p_true)

  for (k in seq_along(peeks)) {
    pv <- suppressWarnings(
      prop.test(c(ctl_seq[k], trt_seq[k]), c(peeks[k], peeks[k]))$p.value
    )
    if (!is.na(pv) && pv < alpha_adj) {
      flagged[i] <- TRUE
      break
    }
  }
}

ex_4_2 <- tibble(
  alpha_adj     = alpha_adj,
  empirical_fpr = mean(flagged)
)
ex_4_2
#> # A tibble: 1 x 2
#>   alpha_adj empirical_fpr
#>       <dbl>         <dbl>
#> 1      0.01        0.0535
```

**Explanation:** Bonferroni divides alpha evenly across all planned tests: 0.05/5 = 0.01 per look. It is conservative because the looks are correlated (each later look reuses earlier users), so the realised FPR (~5%) lands close to the target. Alpha-spending functions like O'Brien-Fleming spend alpha non-uniformly (almost nothing early, most at the end), achieving better power than Bonferroni for the same FPR ceiling, but Bonferroni is the easiest to explain in a stakeholder doc.

</details>

### Exercise 4.3: Compute additional sample size needed after an inconclusive look

**Task:** A test launched with 5,000 users per arm shows control 205/5000 (4.1%) and treatment 230/5000 (4.6%), and `prop.test()` returns p=0.27. The PM asks: assuming the observed effect is real, how many more users per arm are needed to reach 80% power? Compute the observed h, the total required per-arm n from `pwr.2p.test()`, and the additional users beyond the current 5,000. Save the named numeric vector `ex_4_3` with elements `observed_h`, `n_required_per_arm`, and `n_additional_per_arm`.

**Expected result:**

```
#>         observed_h  n_required_per_arm n_additional_per_arm
#>         0.02516967         12393.27310          7393.27310
```

**Difficulty:** Intermediate

[HINTS]
Treat the effect observed so far as if it were the truth, then size the test that effect would actually require.
Compute `ES.h()` on the observed treatment and control rates, feed it as `h` to `pwr.2p.test()` with `power = 0.80`, and subtract the current 5,000.

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
observed_h <- ES.h(p1 = 0.046, p2 = 0.041)

n_req <- pwr.2p.test(
  h         = observed_h,
  sig.level = 0.05,
  power     = 0.80
)$n

ex_4_3 <- c(
  observed_h           = observed_h,
  n_required_per_arm   = n_req,
  n_additional_per_arm = n_req - 5000
)
ex_4_3
#>         observed_h  n_required_per_arm n_additional_per_arm
#>         0.02516967         12393.27310          7393.27310
```

**Explanation:** Mid-experiment power recalculation is fine as a planning exercise; the trap is conditioning on the observed effect and then declaring "we will continue until significance". That conditioning bias inflates FPR. The right framing for a stakeholder is: "the observed effect is consistent with both the null and a 12% relative lift; to be 80% sure we could detect a 12% lift we would need ~12,400 per arm; given current traffic that means ~4 more weeks. Should we commit?". A decision, not a guarantee.

</details>

## Section 5. Practical pitfalls and adjustments (3 problems)

### Exercise 5.1: Inflate sample size to compensate for dropout

**Task:** A consumer survey A/B test naively needs 800 completed responses per arm, but historical dropout between assignment and completion is 25%. Compute the assignment-time sample size required so that 800 completers remain per arm, and verify the implied dropout rate. Save the named numeric vector `ex_5_1` with elements `n_completers`, `dropout_rate`, and `n_assigned`.

**Expected result:**

```
#>  n_completers  dropout_rate    n_assigned
#>          800            0.25       1066.67
```

**Difficulty:** Intermediate

[HINTS]
If only some assigned users finish, you must start with more than the number you need to end with.
Divide the required completers by `(1 - dropout_rate)` to get the assignment-time count.

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
n_completers <- 800
dropout_rate <- 0.25
n_assigned   <- n_completers / (1 - dropout_rate)

ex_5_1 <- c(
  n_completers = n_completers,
  dropout_rate = dropout_rate,
  n_assigned   = n_assigned
)
ex_5_1
#>  n_completers  dropout_rate    n_assigned
#>          800            0.25       1066.67
```

**Explanation:** Dropout inflation is `n_design / (1 - dropout)`; never multiply by `(1 + dropout)` since that under-inflates. The deeper issue is whether dropout is random or related to the treatment itself (differential attrition), which is a far more serious threat to validity than just "we have fewer rows". Always report attrition by arm in the analysis section; a 5pp gap between arms should trigger a sensitivity analysis with inverse-probability weighting before declaring a winner.

</details>

### Exercise 5.2: Compare Bonferroni vs Benjamini-Hochberg across 6 secondary metrics

**Task:** An experimentation team reports 6 secondary metrics from one test with raw p-values `c(0.004, 0.011, 0.022, 0.030, 0.045, 0.080)`. Apply `p.adjust()` with both `"bonferroni"` and `"BH"` to control family-wise error vs false discovery rate. Save a tibble `ex_5_2` with columns `metric` (m1 through m6), `p_raw`, `p_bonf`, `p_bh`, sorted by `p_raw` ascending.

**Expected result:**

```
#> # A tibble: 6 x 4
#>   metric p_raw p_bonf  p_bh
#>   <chr>  <dbl>  <dbl> <dbl>
#> 1 m1     0.004  0.024 0.024
#> 2 m2     0.011  0.066 0.033
#> 3 m3     0.022  0.132 0.044
#> 4 m4     0.030  0.180 0.045
#> 5 m5     0.045  0.270 0.054
#> 6 m6     0.080  0.480 0.080
```

**Difficulty:** Intermediate

[HINTS]
Testing several metrics at once inflates the chance of a spurious win, so the raw p-values need adjusting.
Apply `p.adjust()` twice, once with `method = "bonferroni"` and once with `method = "BH"`, then `arrange()` by the raw p-value.

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_2 <- tibble(
  metric = paste0("m", 1:6),
  p_raw  = c(0.004, 0.011, 0.022, 0.030, 0.045, 0.080)
) |>
  mutate(
    p_bonf = p.adjust(p_raw, method = "bonferroni"),
    p_bh   = p.adjust(p_raw, method = "BH")
  ) |>
  arrange(p_raw)
ex_5_2
#> # A tibble: 6 x 4
#>   metric p_raw p_bonf  p_bh
#>   <chr>  <dbl>  <dbl> <dbl>
#> 1 m1     0.004  0.024 0.024
#> 2 m2     0.011  0.066 0.033
#> 3 m3     0.022  0.132 0.044
#> 4 m4     0.030  0.180 0.045
#> 5 m5     0.045  0.270 0.054
#> 6 m6     0.080  0.480 0.080
```

**Explanation:** Bonferroni is the strictest correction (multiply each p by m=6), controlling family-wise error rate, while Benjamini-Hochberg controls the expected proportion of false discoveries among rejections. With 6 metrics here, Bonferroni keeps only `m1` significant at 0.05, while BH keeps `m1` through `m4`. Use Bonferroni when a single false positive would be costly (e.g. drug approval); use BH when you are screening many candidate metrics and can tolerate a small false-discovery proportion. Avoid the temptation to skip correction entirely; uncorrected secondary metrics are how teams ship features that look like they help across "some metric".

</details>

### Exercise 5.3: Detect a novelty effect via weekly lift trend

**Task:** Novelty effects appear as a fading treatment lift over time. Build inline a 28-day tibble of conversions per arm where with `set.seed(31)` daily `n_per_arm = 2000`, control rate is 0.05 every day, and treatment rate decays linearly from 0.065 on day 1 to 0.05 on day 28. Aggregate to 4 weekly buckets, compute weekly lift (`p_trt - p_ctl`), fit `lm(weekly_lift ~ week_num)`, and save the fitted lm object to `ex_5_3`.

**Expected result:**

```
#> Call:
#> lm(formula = weekly_lift ~ week_num, data = weekly)
#>
#> Coefficients:
#> (Intercept)     week_num
#>     0.01935     -0.00466
```

**Difficulty:** Advanced

[HINTS]
A treatment effect that fades over time shows up as a trend in lift, not as a single static number.
Bucket the 28 days into weeks, compute the weekly lift as `p_trt - p_ctl`, and fit `lm(weekly_lift ~ week_num)`.

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(31)
n_per_arm <- 2000

daily <- tibble(
  day      = 1:28,
  trt_rate = seq(0.065, 0.050, length.out = 28),
  ctl_rate = 0.05
) |>
  mutate(
    ctl_conv = rbinom(n(), n_per_arm, ctl_rate),
    trt_conv = rbinom(n(), n_per_arm, trt_rate),
    week_num = ceiling(day / 7)
  )

weekly <- daily |>
  group_by(week_num) |>
  summarise(
    p_ctl        = sum(ctl_conv) / (7 * n_per_arm),
    p_trt        = sum(trt_conv) / (7 * n_per_arm),
    weekly_lift  = p_trt - p_ctl,
    .groups      = "drop"
  )

ex_5_3 <- lm(weekly_lift ~ week_num, data = weekly)
ex_5_3
#> Call:
#> lm(formula = weekly_lift ~ week_num, data = weekly)
#>
#> Coefficients:
#> (Intercept)     week_num
#>     0.01935     -0.00466
```

**Explanation:** A negative slope on `week_num` is the signature of novelty: users react to the change initially, then revert. The point estimate of -0.0047 per week means roughly 0.5 percentage point of lift evaporates every week. The right stakeholder framing is "do not size launch decisions on week-1 results"; the test should run at least 2 to 4 weeks to let the trend stabilise, then estimate steady-state lift from the last week. For a more rigorous version, use a segmented regression or piecewise model to identify the changepoint.

</details>

## Section 6. End-to-end analysis (2 problems)

### Exercise 6.1: Build a stakeholder summary row for a shipped A/B test

**Task:** Produce a one-row stakeholder summary tibble for a checkout-flow A/B test with control 4,023/95,000 and treatment 4,322/95,000 conversions. Columns: `variant_a_n`, `variant_b_n`, `conv_a`, `conv_b`, `rate_a`, `rate_b`, `abs_lift_pp` (treatment minus control in percentage points), `rel_lift_pct`, `ci_low_pp`, `ci_high_pp` (CI for the lift in percentage points), `p_value`, and `decision` ("Ship" if `p_value < 0.05 & abs_lift_pp > 0`, else "Hold"). Save to `ex_6_1`.

**Expected result:**

```
#> # A tibble: 1 x 12
#>   variant_a_n variant_b_n conv_a conv_b rate_a rate_b abs_lift_pp rel_lift_pct ci_low_pp ci_high_pp  p_value decision
#>         <dbl>       <dbl>  <dbl>  <dbl>  <dbl>  <dbl>       <dbl>        <dbl>     <dbl>      <dbl>    <dbl> <chr>
#> 1       95000       95000   4023   4322 0.0423 0.0455      0.315          7.43    0.0276      0.602  0.0231  Ship
```

**Difficulty:** Advanced

[HINTS]
A stakeholder summary collapses one test result into a flat row of rates, lifts, an interval, and a decision.
Run `prop.test()` once, then assemble a one-row `tibble()`; its CI is for control minus treatment, so negate and swap the bounds, and set the verdict with `if_else()`.

```r title="Your turn"
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
pt <- prop.test(c(4023, 4322), c(95000, 95000))

ex_6_1 <- tibble(
  variant_a_n  = 95000,
  variant_b_n  = 95000,
  conv_a       = 4023,
  conv_b       = 4322,
  rate_a       = conv_a / variant_a_n,
  rate_b       = conv_b / variant_b_n,
  abs_lift_pp  = 100 * (rate_b - rate_a),
  rel_lift_pct = 100 * (rate_b - rate_a) / rate_a,
  ci_low_pp    = 100 * (-pt$conf.int[2]),
  ci_high_pp   = 100 * (-pt$conf.int[1]),
  p_value      = pt$p.value,
  decision     = if_else(p_value < 0.05 & abs_lift_pp > 0, "Ship", "Hold")
)
ex_6_1
#> # A tibble: 1 x 12
#>   variant_a_n variant_b_n conv_a conv_b rate_a rate_b abs_lift_pp rel_lift_pct ci_low_pp ci_high_pp  p_value decision
#>         <dbl>       <dbl>  <dbl>  <dbl>  <dbl>  <dbl>       <dbl>        <dbl>     <dbl>      <dbl>    <dbl> <chr>
#> 1       95000       95000   4023   4322 0.0423 0.0455      0.315          7.43    0.0276      0.602  0.0231  Ship
```

**Explanation:** `prop.test()` returns the CI for `p1 - p2` (control minus treatment); since stakeholders prefer "lift = treatment minus control", flip the sign and the order of the interval bounds. Reporting both absolute lift in percentage points AND relative lift in percent is non-optional: "+0.3 pp" reads small, "+7.4% relative" reads big, and both are true. The `decision` column codifies the launch rule so engineering does not relitigate it after the fact; for more nuance add tiers like "Ship", "Hold", "Iterate", or "Investigate" based on directional CI and effect size.

</details>

### Exercise 6.2: Run a pre-launch A/A diagnostic

**Task:** Before launching a real test, the experimentation team runs a 7-day A/A sanity check. Simulate it: with `set.seed(73)` assign 50,000 users per arm with true conversion rate 0.04 each day for 7 days using `rbinom()`, aggregate to totals, then run `prop.test()` on the totals and a 1-df `chisq.test()` on daily traffic split (expected 50/50). Save the diagnostic tibble `ex_6_2` with columns `metric` ("conversion_p", "traffic_split_p"), `statistic`, `p_value`, `decision` ("OK" if `p_value > 0.05`, else "Investigate").

**Expected result:**

```
#> # A tibble: 2 x 4
#>   metric          statistic p_value decision
#>   <chr>               <dbl>   <dbl> <chr>
#> 1 conversion_p        0.213   0.644 OK
#> 2 traffic_split_p     0.728   0.394 OK
```

**Difficulty:** Advanced

[HINTS]
An A/A check should surface no real difference, so any signal points to a randomiser or pipeline bug.
Run `prop.test()` on the conversion totals and `chisq.test()` with `p = c(0.5, 0.5)` on the traffic split, then label each row with `if_else()`.

```r title="Your turn"
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(73)
n_per_arm_day <- 50000
p_true        <- 0.04

daily <- tibble(
  day      = 1:7,
  ctl_n    = rbinom(7, 2 * n_per_arm_day, 0.5),
  trt_n    = (2 * n_per_arm_day) - ctl_n,
  ctl_conv = rbinom(7, ctl_n, p_true),
  trt_conv = rbinom(7, trt_n, p_true)
)

ctl_total <- sum(daily$ctl_n)
trt_total <- sum(daily$trt_n)
ctl_c     <- sum(daily$ctl_conv)
trt_c     <- sum(daily$trt_conv)

conv_test    <- prop.test(c(ctl_c, trt_c), c(ctl_total, trt_total))
traffic_test <- chisq.test(c(ctl_total, trt_total), p = c(0.5, 0.5))

ex_6_2 <- tibble(
  metric    = c("conversion_p", "traffic_split_p"),
  statistic = c(conv_test$statistic, traffic_test$statistic),
  p_value   = c(conv_test$p.value, traffic_test$p.value)
) |>
  mutate(decision = if_else(p_value > 0.05, "OK", "Investigate"))
ex_6_2
#> # A tibble: 2 x 4
#>   metric          statistic p_value decision
#>   <chr>               <dbl>   <dbl> <chr>
#> 1 conversion_p        0.213   0.644 OK
#> 2 traffic_split_p     0.728   0.394 OK
```

**Explanation:** An A/A test catches two kinds of bugs: a broken randomiser (traffic skew) and a broken event pipeline (conversion delta despite identical treatment). Always run one BEFORE shipping a real experiment, especially after changes to the bucketing layer or analytics SDK. If the traffic split test fails, fix the randomiser before trusting any A/B result; if only the conversion test fails, suspect a logging bug like deduplication misfiring on one variant.

</details>

## What to do next

- [A/B Testing in R: Concepts, Workflow, and Examples](AB-Testing-in-R.html) - the parent guide that explains the design and analysis frameworks these exercises drill.
- [Linear Regression Exercises in R](Linear-Regression-Exercises-in-R.html) - practise regression-style hypothesis testing on the same hub format.
- [Power Analysis in R](Power-Analysis-in-R.html) - go deeper on `pwr` formulas and simulation-based power for non-standard designs.
- [EDA Exercises in R](EDA-Exercises-in-R.html) - sharpen the upstream skills you need before any experiment: data quality, slicing, and metric definitions.
