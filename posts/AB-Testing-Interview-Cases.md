---
title: "A/B Testing Interview Cases: 20 Solved in R"
slug: "AB-Testing-Interview-Cases"
description: "20 A/B testing interview questions solved in R: sample size and MDE, proportion tests, the peeking problem, ratio-metric variance, CUPED, and reading a readout."
keywords: "A/B testing interview questions, experiment design interview, product data scientist interview, ab test in r, sample size and mde, peeking problem, cuped, sequential testing"
mathjax: true
webr: true
date: "2026-07-14"
post_type: "EX"
sidebar_title: "A/B Testing Interview Cases"
sidebar_order: 150
fr_parent: "AB-Testing-in-R.html"
auto_link_terms: "a/b testing|experiment design|sample size|proportion test|peeking problem"
auto_link_case_sensitive: false
target_keyword: "A/B testing interview questions"
sibling_block_enabled: false
difficulty: "Mixed"
---

# A/B Testing Interview Cases: 20 Solved in R

<p class="lead">A featured collection of 20 A/B testing interview cases, each solved in R. These are the experiment-design questions product data scientists actually get asked: sizing a test, reading a proportion test, the peeking problem, ratio-metric variance, CUPED, novelty effects, and reading a readout end to end. Every solution is hidden until you reveal it.</p>

Work through them in order or jump to a theme. Each case gives you the exact quantity an interviewer wants you to produce, a set of hints, and a fully worked solution with output. Load the packages below once, then every exercise will run.

```r title="Run this once before any exercise"
library(dplyr)
```

## Section 1. Sizing a test: power, sample size, and MDE

### Exercise 1.1: Size a conversion test for a 1.5-point lift

**Task:** A product data scientist is planning an experiment on a checkout flow where the current conversion rate is 12%. The team wants 80% power to detect an absolute lift to 13.5% at the 5% significance level. Compute the required sample size per arm, round it up to a whole number of users, and save it to `ex_1_1`.

**Expected result:**

```
#> [1] 7761
```

**Difficulty:** Intermediate

[HINTS]
Sample size depends on the two rates, the power you want, and the significance level. A base R function solves for whichever of these you leave out.
Call `power.prop.test(p1 = 0.12, p2 = 0.135, power = 0.80)` and take `ceiling()` of the returned `n`.

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
res <- power.prop.test(p1 = 0.12, p2 = 0.135, power = 0.80, sig.level = 0.05)
ex_1_1 <- ceiling(res$n)
ex_1_1
#> [1] 7761
```

**Explanation:** `power.prop.test()` inverts the two-proportion power formula: give it any four of {n, p1, p2, power, sig.level} and it solves for the fifth. Here `n` is left out, so it returns the per-arm size (about 7760 users) which you round up. A common interview trap is forgetting this is per arm, so total enrolment is roughly double. Smaller baseline rates or smaller lifts both inflate the count quickly.

</details>

### Exercise 1.2: Find the MDE for a fixed traffic budget

**Task:** Traffic is limited: the team can only allocate 6000 users per arm. Holding the 12% baseline, 80% power, and 5% significance fixed, work out the smallest treatment rate the test could reliably detect, then report the minimum detectable effect (treatment rate minus baseline) and save it to `ex_1_2`.

**Expected result:**

```
#> [1] 0.0171
```

**Difficulty:** Intermediate

[HINTS]
With sample size now fixed, the unknown you are solving for is the alternative conversion rate, and the same power function can return it.
Pass `n = 6000` and leave `p2` out of `power.prop.test()`, then subtract 0.12 from the returned `p2`.

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
res <- power.prop.test(n = 6000, p1 = 0.12, power = 0.80, sig.level = 0.05)
ex_1_2 <- round(res$p2 - 0.12, 4)
ex_1_2
#> [1] 0.0171
```

**Explanation:** The minimum detectable effect (MDE) is the smallest true difference an experiment is powered to catch. With 6000 per arm the detectable treatment rate is about 13.71%, an MDE near 1.71 absolute points, which is larger than the 1.5-point lift the team cared about in 1.1. That gap is the honest interview answer: this traffic budget is underpowered for the effect they hope to see, so a null result would be uninformative.

</details>

### Exercise 1.3: Trace how power grows with sample size

**Task:** Your interviewer asks how quickly power improves as you add users. For the 12% versus 13.5% comparison at 5% significance, compute the statistical power at 1000, 2500, 5000, 10000, and 20000 users per arm, assemble the results into a data frame with columns `n_per_arm` and `power`, and save it to `ex_1_3`.

**Expected result:**

```
#>   n_per_arm power
#> 1      1000 0.170
#> 2      2500 0.356
#> 3      5000 0.614
#> 4     10000 0.889
#> 5     20000 0.994
```

**Difficulty:** Intermediate

[HINTS]
You need the power output for several sample sizes, so loop or map the calculation over the vector of sizes.
Use `sapply()` over the sizes calling `power.prop.test(n = n, p1 = 0.12, p2 = 0.135)$power`, then wrap in `data.frame()`.

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ns <- c(1000, 2500, 5000, 10000, 20000)
pw <- sapply(ns, function(n) power.prop.test(n = n, p1 = 0.12, p2 = 0.135, sig.level = 0.05)$power)
ex_1_3 <- data.frame(n_per_arm = ns, power = round(pw, 3))
ex_1_3
#>   n_per_arm power
#> 1      1000 0.170
#> 2      2500 0.356
#> 3      5000 0.614
#> 4     10000 0.889
#> 5     20000 0.994
```

**Explanation:** Power rises with sample size but with diminishing returns. Going from 5000 to 10000 users lifts power from 0.61 to 0.89, while the next 10000 only buys 0.10 more. Interviewers use this to check whether you understand that doubling traffic does not double your ability to detect an effect, and that chasing the last few percent of power can cost far more traffic than the earlier gains bought.

</details>

### Exercise 1.4: Pool a baseline conversion rate from daily logs

**Task:** Before designing the test above, the team needs the current baseline conversion rate. Given a small data frame of one week of daily visitor and conversion counts (built for you below), compute the pooled conversion rate across the whole week (total conversions divided by total visitors), round it to four decimals, and save it to `ex_1_4`.

**Expected result:**

```
#> [1] 0.1193
```

**Difficulty:** Beginner

[HINTS]
The pooled rate is not the average of the seven daily rates; it weights each day by its traffic, so work with the totals.
Divide `sum(daily$conversions)` by `sum(daily$visitors)` and wrap in `round(x, 4)`.

```r title="Your turn"
daily <- data.frame(
  day = 1:7,
  visitors = c(6800, 7100, 6600, 6900, 7200, 5400, 5200),
  conversions = c(816, 830, 798, 821, 864, 646, 619)
)
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
daily <- data.frame(
  day = 1:7,
  visitors = c(6800, 7100, 6600, 6900, 7200, 5400, 5200),
  conversions = c(816, 830, 798, 821, 864, 646, 619)
)
ex_1_4 <- round(sum(daily$conversions) / sum(daily$visitors), 4)
ex_1_4
#> [1] 0.1193
```

**Explanation:** Pooling the totals gives a traffic-weighted baseline (about 11.93%), which differs from the simple mean of the seven daily rates whenever daily traffic is uneven, as it is here with lighter weekends. Using the weighted figure matters because the sample size math in 1.1 assumes this population rate. Averaging the daily percentages instead would over-weight low-traffic days and bias the baseline downward or upward unpredictably.

</details>

## Section 2. Analyzing conversion data with proportion tests

### Exercise 2.1: Run a two-proportion z-test on a results table

**Task:** An experiment has finished: the control arm converted 2400 of 20000 users and the treatment arm converted 2600 of 20000. Run a two-proportion test without continuity correction to compare treatment against control, then save the full test object (statistic, p-value, and confidence interval) to `ex_2_1`.

**Expected result:**

```
#> 
#> 	2-sample test for equality of proportions without continuity correction
#> 
#> data:  c(2600, 2400) out of c(20000, 20000)
#> X-squared = 9.1429, df = 1, p-value = 0.002497
#> alternative hypothesis: two.sided
#> 95 percent confidence interval:
#>  0.003518769 0.016481231
#> sample estimates:
#> prop 1 prop 2 
#>   0.13   0.12 
```

**Difficulty:** Intermediate

[HINTS]
The counts and totals go in as two vectors, and turning off the continuity correction makes the statistic match the textbook z-test squared.
Call `prop.test(c(2600, 2400), c(20000, 20000), correct = FALSE)`.

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- prop.test(c(2600, 2400), c(20000, 20000), correct = FALSE)
ex_2_1
#> 
#> 	2-sample test for equality of proportions without continuity correction
#> 
#> data:  c(2600, 2400) out of c(20000, 20000)
#> X-squared = 9.1429, df = 1, p-value = 0.002497
#> alternative hypothesis: two.sided
#> 95 percent confidence interval:
#>  0.003518769 0.016481231
#> sample estimates:
#> prop 1 prop 2 
#>   0.13   0.12 
```

**Explanation:** The two-proportion test asks whether the gap between 13% and 12% is larger than sampling noise. Here X-squared is 9.14 with a p-value of 0.0025, so we reject the null of equal conversion. Turning off the continuity correction with `correct = FALSE` reproduces the classic z-test, since a chi-square on one degree of freedom is the square of that z. With the correction on, the p-value is slightly larger and more conservative.

</details>

### Exercise 2.2: Report the confidence interval for the difference

**Task:** Stakeholders want a range, not just a yes or no. Using the same 2400-of-20000 control and 2600-of-20000 treatment counts, extract the 95% confidence interval for the difference in conversion rates (treatment minus control) from the proportion test, round both bounds to four decimals, and save the two-number interval to `ex_2_2`.

**Expected result:**

```
#> [1] 0.0035 0.0165
```

**Difficulty:** Intermediate

[HINTS]
The test object already carries the interval; you just need to pull the right component out and round it.
Access `$conf.int` on the fitted `prop.test()` object, coerce with `as.numeric()`, then `round(x, 4)`.

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
res <- prop.test(c(2600, 2400), c(20000, 20000), correct = FALSE)
ex_2_2 <- round(as.numeric(res$conf.int), 4)
ex_2_2
#> [1] 0.0035 0.0165
```

**Explanation:** The interval runs from 0.0035 to 0.0165, meaning the true lift sits between about a third of a point and 1.65 points with 95% confidence. Because it lies entirely above zero, the result agrees with the significant p-value from 2.1. Interviewers like the confidence interval because it communicates effect size and precision together, whereas a p-value alone hides whether a win is trivially small or genuinely business-moving.

</details>

### Exercise 2.3: Translate an absolute lift into relative lift

**Task:** Executives usually ask for the percentage improvement, not the raw point gap. From the 12% control rate and 13% treatment rate, compute the relative lift (the absolute difference divided by the control rate), round it to four decimals so it reads as a proportion, and save the value to `ex_2_3`.

**Expected result:**

```
#> [1] 0.0833
```

**Difficulty:** Intermediate

[HINTS]
Relative lift rescales the absolute difference by the baseline, so a one-point gain on a small base becomes a big percentage move.
Compute `(0.13 - 0.12) / 0.12` and round to four places.

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
p_control <- 0.12
p_treatment <- 0.13
ex_2_3 <- round((p_treatment - p_control) / p_control, 4)
ex_2_3
#> [1] 0.0833
```

**Explanation:** The absolute lift is one point, but relative to a 12% base that is an 8.33% improvement, the figure most stakeholders and dashboards report. Confusing the two is a classic mistake: a "50% lift" could mean a move from 2% to 3% (huge relatively, tiny absolutely). Always state which one you mean, and remember that the sample size math is driven by the absolute gap, not the relative one.

</details>

### Exercise 2.4: Switch to a one-sided test and compare p-values

**Task:** The team only ships if treatment beats control, never the reverse, so a one-sided test is defensible here. Using the same 2600-of-20000 treatment and 2400-of-20000 control counts, run the proportion test with a greater-than alternative, extract the p-value, and save it to `ex_2_4`.

**Expected result:**

```
#> [1] 0.001248454
```

**Difficulty:** Beginner

[HINTS]
A directional hypothesis puts the entire rejection region in one tail, which roughly halves the two-sided p-value for a clear effect.
Add `alternative = "greater"` to `prop.test()` and read `$p.value`.

```r title="Your turn"
ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
res <- prop.test(c(2600, 2400), c(20000, 20000), correct = FALSE, alternative = "greater")
ex_2_4 <- res$p.value
ex_2_4
#> [1] 0.001248454
```

**Explanation:** The one-sided p-value (0.00125) is almost exactly half the two-sided value (0.0025) from 2.1, because the test now spends all of alpha in the upper tail. One-sided tests are more powerful but only honest when the direction is fixed in advance for a real reason. Deciding to go one-sided after seeing which way the data points is a form of p-hacking that interviewers will probe for.

</details>

## Section 3. The peeking problem and sequential looks

### Exercise 3.1: Simulate the peeking problem on an A/A test

**Task:** Show why checking results early inflates false positives. Simulate 1000 A/A experiments with `set.seed(101)` where both arms share a true 10% rate, and in each one test for significance at ten interim looks of 500, 1000, up to 5000 users. Record the share of experiments that hit p below 0.05 at any look versus only at the final look, and save the two rates to `ex_3_1`.

**Expected result:**

```
#>     peeking_FPR single_look_FPR 
#>           0.209           0.059 
```

**Difficulty:** Advanced

[HINTS]
In an A/A test there is no real difference, so any rejection is a false positive; peeking gives many chances to trip the 5% threshold.
Loop over sims, and for each build both arms with `rbinom()`, compute `prop.test()` p-values at each interim cut, then compare `any(pv < 0.05)` against the final look.

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(101)
n_sim <- 1000
looks <- seq(500, 5000, by = 500)
p_true <- 0.10
any_sig <- logical(n_sim)
final_sig <- logical(n_sim)
for (s in 1:n_sim) {
  a <- rbinom(5000, 1, p_true)
  b <- rbinom(5000, 1, p_true)
  pv <- sapply(looks, function(k)
    suppressWarnings(prop.test(c(sum(a[1:k]), sum(b[1:k])), c(k, k), correct = FALSE)$p.value))
  any_sig[s] <- any(pv < 0.05)
  final_sig[s] <- pv[length(pv)] < 0.05
}
ex_3_1 <- round(c(peeking_FPR = mean(any_sig), single_look_FPR = mean(final_sig)), 3)
ex_3_1
#>     peeking_FPR single_look_FPR 
#>           0.209           0.059 
```

**Explanation:** With no true effect, a single test rejects near the nominal 5% (here 0.059), exactly as designed. But allowing yourself to stop at any of ten looks pushes the false positive rate to about 21%: roughly one A/A test in five would be declared a false winner. This is the peeking problem, and it is why calling an experiment the moment it crosses significance is one of the most damaging habits interviewers screen for.

</details>

### Exercise 3.2: Quantify alpha inflation across repeated looks

**Task:** To build intuition for 3.1, model the worst case where each interim look were an independent test. Compute the family-wise false positive rate $1 - (1 - \alpha)^k$ with $\alpha = 0.05$ for k from 1 to 10 looks, assemble a data frame with columns `looks` and `naive_fpr` rounded to three decimals, and save it to `ex_3_2`.

**Expected result:**

```
#>    looks naive_fpr
#> 1      1     0.050
#> 2      2     0.098
#> 3      3     0.143
#> 4      4     0.185
#> 5      5     0.226
#> 6      6     0.265
#> 7      7     0.302
#> 8      8     0.337
#> 9      9     0.370
#> 10    10     0.401
```

**Difficulty:** Advanced

[HINTS]
If k independent tests each have a 5% false alarm rate, the chance of at least one false alarm is one minus the chance of none.
Build the column with `1 - (1 - 0.05)^(1:10)` and wrap it in `data.frame()`.

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
k <- 1:10
ex_3_2 <- data.frame(looks = k, naive_fpr = round(1 - (1 - 0.05)^k, 3))
ex_3_2
#>    looks naive_fpr
#> 1      1     0.050
#> 2      2     0.098
#> 3      3     0.143
#> 4      4     0.185
#> 5      5     0.226
#> 6      6     0.265
#> 7      7     0.302
#> 8      8     0.337
#> 9      9     0.370
#> 10    10     0.401
```

**Explanation:** Under the independence assumption, ten looks push the false positive rate from the nominal 5% to about 40%. Real sequential data is positively correlated across looks, so the true inflation from 3.1 (near 21%) is lower than this upper bound, but the direction is identical: naive repeated testing guarantees far more false wins than the stated rate. This is exactly why teams adopt alpha-spending or group-sequential boundaries instead of testing continuously.

</details>

### Exercise 3.3: Apply a Bonferroni correction to five interim looks

**Task:** A simple fix is to lower the bar at each look. Given the p-values 0.042, 0.028, 0.011, 0.006, and 0.019 observed at five interim analyses, compare each against a Bonferroni-adjusted threshold of 0.05 divided by five, flag which looks would reject the null, and save the resulting data frame to `ex_3_3`.

**Expected result:**

```
#>   look     p reject
#> 1    1 0.042  FALSE
#> 2    2 0.028  FALSE
#> 3    3 0.011  FALSE
#> 4    4 0.006   TRUE
#> 5    5 0.019  FALSE
```

**Difficulty:** Intermediate

[HINTS]
Splitting the overall 5% budget evenly across the looks means each look must clear a much smaller p-value to count.
Set `alpha_adj <- 0.05 / 5` and compare the p-value vector with `pvals < alpha_adj`.

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
pvals <- c(0.042, 0.028, 0.011, 0.006, 0.019)
alpha_adj <- 0.05 / length(pvals)
ex_3_3 <- data.frame(look = 1:5, p = pvals, reject = pvals < alpha_adj)
ex_3_3
#>   look     p reject
#> 1    1 0.042  FALSE
#> 2    2 0.028  FALSE
#> 3    3 0.011  FALSE
#> 4    4 0.006   TRUE
#> 5    5 0.019  FALSE
```

**Explanation:** Bonferroni divides the 5% budget across the five looks, so each must beat 0.01. Only look 4 (p = 0.006) clears it, even though three looks were below the naive 0.05. Bonferroni is simple and always valid but conservative, because it ignores the correlation between looks on accumulating data. Group-sequential methods like Pocock or O'Brien-Fleming spend alpha more efficiently, which is the follow-up interviewers often want to hear next.

</details>

## Section 4. Ratio metrics and their variance

### Exercise 4.1: Compute a click-through rate and its naive standard error

**Task:** A ranking test reports 1476 clicks from 8200 sessions in the treatment arm. Treating each session as an independent Bernoulli trial, compute the click-through rate and its naive binomial standard error, round both to five decimals, and save the named pair to `ex_4_1`.

**Expected result:**

```
#>     ctr      se 
#> 0.18000 0.00424 
```

**Difficulty:** Intermediate

[HINTS]
The standard error of a proportion depends on the rate itself and the number of trials in the denominator.
Compute `ctr` then `sqrt(ctr * (1 - ctr) / 8200)`, and combine with `c(ctr = ..., se = ...)`.

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ctr <- 1476 / 8200
se <- sqrt(ctr * (1 - ctr) / 8200)
ex_4_1 <- round(c(ctr = ctr, se = se), 5)
ex_4_1
#>     ctr      se 
#> 0.18000 0.00424 
```

**Explanation:** The binomial standard error $\sqrt{p(1-p)/n}$ treats every session as independent, which is fine when the randomization unit really is the session. The catch, and the reason this is only a naive SE, is that sessions cluster within users: one very active user contributes many correlated sessions, so the effective sample size is smaller than 8200 and the true SE is larger. The next exercise handles a ratio where that structure bites.

</details>

### Exercise 4.2: Estimate a ratio metric variance with the delta method

**Task:** Clicks per session is a ratio of two random totals, so its variance needs the delta method. Simulate 3000 users with `set.seed(202)`, drawing sessions per user and clicks within them, compute the overall clicks-to-sessions ratio, then its delta-method standard error, round both to five decimals, and save the pair to `ex_4_2`.

**Expected result:**

```
#>    ratio se_delta 
#>  0.18038  0.00354 
```

**Difficulty:** Advanced

[HINTS]
The metric is a mean over a random denominator, so a plain binomial SE understates the variance; you need the first-order Taylor approximation for a ratio.
Combine `var(clicks_u)`, `cov(clicks_u, sessions_u)`, and `var(sessions_u)`, then divide by `n * mean(sessions_u)^2`.

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(202)
n <- 3000
sessions_u <- rpois(n, lambda = 3) + 1
clicks_u <- rbinom(n, size = sessions_u, prob = 0.18)
R <- sum(clicks_u) / sum(sessions_u)
ybar <- mean(sessions_u)
var_R <- (var(clicks_u) - 2 * R * cov(clicks_u, sessions_u) + R^2 * var(sessions_u)) / (n * ybar^2)
ex_4_2 <- round(c(ratio = R, se_delta = sqrt(var_R)), 5)
ex_4_2
#>    ratio se_delta 
#>  0.18038  0.00354 
```

**Explanation:** The delta method linearizes the ratio around the mean number of sessions, giving $\operatorname{Var}(R) \approx \frac{1}{n\,\bar{Y}^2}\left(\operatorname{Var}(X) - 2R\operatorname{Cov}(X,Y) + R^2\operatorname{Var}(Y)\right)$. It captures how variation in the numerator, the denominator, and their covariance all feed the metric's uncertainty. Treating this ratio as a simple proportion would misstate the SE. Getting the delta-method formula right for a ratio metric is a classic senior-level screening question.

</details>

### Exercise 4.3: Cross-check the ratio variance with a bootstrap

**Task:** Verify the delta-method answer empirically. Reusing the 3000-user `clicks_u` and `sessions_u` vectors from the previous exercise, run a user-level bootstrap with `set.seed(203)` and 2000 resamples, recomputing the clicks-to-sessions ratio each time, then report the bootstrap mean and standard error rounded to five decimals and save them to `ex_4_3`.

**Expected result:**

```
#> boot_mean   boot_se 
#>   0.18033   0.00350 
```

**Difficulty:** Advanced

[HINTS]
Resample whole users with replacement so the clustering structure is preserved, then recompute the ratio on each resample.
Use `replicate(2000, ...)` with `sample(n, n, replace = TRUE)` as an index into both vectors.

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(203)
boot_R <- replicate(2000, {
  idx <- sample(n, n, replace = TRUE)
  sum(clicks_u[idx]) / sum(sessions_u[idx])
})
ex_4_3 <- round(c(boot_mean = mean(boot_R), boot_se = sd(boot_R)), 5)
ex_4_3
#> boot_mean   boot_se 
#>   0.18033   0.00350 
```

**Explanation:** The bootstrap SE (0.00350) lands almost exactly on the delta-method value (0.00354), which is the reassurance you want: two independent routes to the ratio's uncertainty agree. Resampling users rather than sessions is the crucial detail, since it respects the randomization unit and reproduces the clustering. When a closed-form delta method is awkward, this user-level bootstrap is the general-purpose fallback for any ratio or funnel metric.

</details>

## Section 5. Variance reduction and confounds

### Exercise 5.1: Cut metric variance with a CUPED adjustment

**Task:** CUPED reduces variance using a pre-experiment covariate. Simulate 4000 users with `set.seed(301)`, drawing a pre-period value and an outcome correlated with it, form the CUPED-adjusted outcome by subtracting theta times the centered covariate, and save a vector of the raw variance, adjusted variance, and percent reduction to `ex_5_1`.

**Expected result:**

```
#>       var_raw     var_cuped reduction_pct 
#>        99.639        64.972        34.792 
```

**Difficulty:** Advanced

[HINTS]
The optimal coefficient is the slope from regressing the outcome on the covariate, and centering the covariate keeps the mean unchanged so the treatment estimate stays unbiased.
Set `theta <- cov(y, pre) / var(pre)` and compute `y - theta * (pre - mean(pre))`.

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(301)
n <- 4000
pre <- rnorm(n, mean = 50, sd = 10)
y <- 0.6 * pre + rnorm(n, mean = 0, sd = 8) + 20
theta <- cov(y, pre) / var(pre)
y_cuped <- y - theta * (pre - mean(pre))
ex_5_1 <- round(c(var_raw = var(y), var_cuped = var(y_cuped),
                  reduction_pct = 100 * (1 - var(y_cuped) / var(y))), 3)
ex_5_1
#>       var_raw     var_cuped reduction_pct 
#>        99.639        64.972        34.792 
```

**Explanation:** CUPED (Controlled experiment Using Pre-Experiment Data) removes the part of the outcome that the covariate already explains, shrinking variance by roughly the squared correlation between them (here about 35%). Because the covariate is centered and predates assignment, it cannot be affected by treatment, so the adjusted metric stays unbiased while its confidence interval tightens. Less variance means the same power at a smaller sample size, which is why CUPED is standard at large experimentation platforms.

</details>

### Exercise 5.2: Detect a novelty effect as a decaying daily lift

**Task:** A treatment shows a big early lift that fades, the classic novelty effect. Simulate 14 days with `set.seed(302)` where the daily lift decays exponentially plus noise, label days 1 to 7 as week1 and days 8 to 14 as week2, compute the mean lift per week, and save the summarised data frame to `ex_5_2`.

**Expected result:**

```
#>    week mean_lift
#> 1 week1    0.0264
#> 2 week2    0.0015
```

**Difficulty:** Intermediate

[HINTS]
A novelty effect means the treatment looks strong at launch then converges toward zero, so comparing early days against later days reveals the decay.
Build the daily frame, add a `week` label with `if_else(day <= 7, ...)`, then `group_by(week)` and `summarise(mean_lift = mean(lift))`.

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(302)
lift_by_day <- data.frame(
  day = 1:14,
  lift = 0.05 * exp(-0.3 * (1:14 - 1)) + rnorm(14, mean = 0, sd = 0.003)
)
ex_5_2 <- lift_by_day |>
  mutate(week = if_else(day <= 7, "week1", "week2")) |>
  group_by(week) |>
  summarise(mean_lift = round(mean(lift), 4)) |>
  as.data.frame()
ex_5_2
#>    week mean_lift
#> 1 week1    0.0264
#> 2 week2    0.0015
```

**Explanation:** Week 1 averages a 2.64% lift while week 2 collapses to 0.15%, the signature of novelty: users react to the newness, not the lasting value. Shipping on the week-1 number would badly overstate the long-run impact. The interview point is that a single pooled estimate hides these time dynamics, so plotting or grouping the effect over time is essential before trusting a positive readout, especially for prominent UI changes.

</details>

### Exercise 5.3: Expose a weekday confound in conversion rates

**Task:** The growth team suspects weekends behave differently. Given a data frame of control and treatment conversions for each weekday (built below), compute the pooled conversion rate for each weekday across both arms, sort from lowest to highest, and save the resulting data frame to `ex_5_3` so the weekend effect is visible.

**Expected result:**

```
#>   weekday visitors conversions   rate
#> 1     Sat     4220         475 0.1126
#> 2     Sun     3990         451 0.1130
#> 3     Fri     6780         915 0.1350
#> 4     Mon     6380         861 0.1350
#> 5     Thu     6510         879 0.1350
#> 6     Tue     6620         895 0.1352
#> 7     Wed     6190         838 0.1354
```

**Difficulty:** Intermediate

[HINTS]
Do not trust the pooled number until you have checked whether the rate is stable across the days that make up the experiment window.
Use `group_by(weekday)`, `summarise()` the summed conversions over summed visitors, and `arrange(rate)`.

```r title="Your turn"
ab_daily <- data.frame(
  weekday = rep(c("Mon","Tue","Wed","Thu","Fri","Sat","Sun"), 2),
  arm = rep(c("control","treatment"), each = 7),
  visitors = c(3200,3300,3100,3250,3400,2100,2000, 3180,3320,3090,3260,3380,2120,1990),
  conversions = c(416,429,405,423,442,231,220, 445,466,433,456,473,244,231)
)
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ab_daily <- data.frame(
  weekday = rep(c("Mon","Tue","Wed","Thu","Fri","Sat","Sun"), 2),
  arm = rep(c("control","treatment"), each = 7),
  visitors = c(3200,3300,3100,3250,3400,2100,2000, 3180,3320,3090,3260,3380,2120,1990),
  conversions = c(416,429,405,423,442,231,220, 445,466,433,456,473,244,231)
)
ex_5_3 <- ab_daily |>
  group_by(weekday) |>
  summarise(visitors = sum(visitors),
            conversions = sum(conversions),
            rate = round(sum(conversions) / sum(visitors), 4)) |>
  arrange(rate) |>
  as.data.frame()
ex_5_3
#>   weekday visitors conversions   rate
#> 1     Sat     4220         475 0.1126
#> 2     Sun     3990         451 0.1130
#> 3     Fri     6780         915 0.1350
#> 4     Mon     6380         861 0.1350
#> 5     Thu     6510         879 0.1350
#> 6     Tue     6620         895 0.1352
#> 7     Wed     6190         838 0.1354
```

**Explanation:** The two weekend days convert near 11.3% while weekdays sit around 13.5%, a large day-of-week pattern. If the treatment and control arms were not balanced across weekdays (for example if the test started mid-week), pooling would confound the treatment effect with this weekly seasonality. Blocking or covariate-adjusting for weekday, or simply running whole weeks, removes the confound. Interviewers use this to test whether you check assignment balance before believing a result.

</details>

## Section 6. Reading an experiment readout end to end

### Exercise 6.1: Assemble a full experiment readout

**Task:** Produce the readout a PM expects from one result: control converted 2880 of 24000 and treatment 3096 of 24000. Compute both rates, the absolute lift, the relative lift, and the two-sided p-value from a proportion test, round everything to four decimals, and save the named summary vector to `ex_6_1`.

**Expected result:**

```
#>   rate_control rate_treatment       abs_lift       rel_lift        p_value 
#>         0.1200         0.1290         0.0090         0.0750         0.0028 
```

**Difficulty:** Intermediate

[HINTS]
A readout is just the derived quantities collected in one place: two rates, the two flavors of lift, and the significance.
Compute the rates, get the p-value from `prop.test(c(3096, 2880), c(24000, 24000), correct = FALSE)`, and assemble with `c()` inside `round(x, 4)`.

```r title="Your turn"
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
cn <- 24000; cc <- 2880
tn <- 24000; tc <- 3096
p_c <- cc / cn
p_t <- tc / tn
pval <- prop.test(c(tc, cc), c(tn, cn), correct = FALSE)$p.value
ex_6_1 <- round(c(rate_control = p_c, rate_treatment = p_t,
                  abs_lift = p_t - p_c, rel_lift = (p_t - p_c) / p_c,
                  p_value = pval), 4)
ex_6_1
#>   rate_control rate_treatment       abs_lift       rel_lift        p_value 
#>         0.1200         0.1290         0.0090         0.0750         0.0028 
```

**Explanation:** A good readout answers two questions at once: how big (0.90 absolute points, 7.5% relative) and how sure (p = 0.0028, significant). Reporting only the relative lift flatters small effects, while reporting only the p-value hides the size. Pairing them, ideally with the confidence interval from 2.2, is what separates a decision-ready summary from a number dump. This is the exact table an interviewer expects you to build from raw counts.

</details>

### Exercise 6.2: Test for a sample ratio mismatch

**Task:** Before trusting 6.1, check the split. The experiment assigned 24000 users to control but only 22800 to treatment, though the design called for a 50/50 allocation. Run a chi-square goodness-of-fit test against equal proportions to check for a sample ratio mismatch, and save the test object to `ex_6_2`.

**Expected result:**

```
#> 
#> 	Chi-squared test for given probabilities
#> 
#> data:  c(24000, 22800)
#> X-squared = 30.769, df = 1, p-value = 2.906e-08
```

**Difficulty:** Intermediate

[HINTS]
A sample ratio mismatch is a failure of the randomizer: the observed split is checked against the intended split with a goodness-of-fit test.
Call `chisq.test(c(24000, 22800), p = c(0.5, 0.5))`.

```r title="Your turn"
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_2 <- chisq.test(c(24000, 22800), p = c(0.5, 0.5))
ex_6_2
#> 
#> 	Chi-squared test for given probabilities
#> 
#> data:  c(24000, 22800)
#> X-squared = 30.769, df = 1, p-value = 2.906e-08
```

**Explanation:** With a p-value near 3e-08, the 24000 versus 22800 split is wildly inconsistent with a fair coin, a textbook sample ratio mismatch (SRM). Teams flag an SRM whenever this p-value drops below about 0.001, because it signals a broken assignment, a logging bug, or bot filtering that differs by arm. When an SRM fires, the correct move is to debug the pipeline and discard the readout, not to interpret the lift: no significance test downstream is trustworthy.

</details>

### Exercise 6.3: Judge whether a null result was underpowered

**Task:** A finished test shows control at 600 of 10000 and treatment at 640 of 10000, and it came back non-significant. Compute the two-sided p-value, then the minimum detectable lift the test was actually powered for at 80% power, round both plus that MDE to four decimals, and save the summary to `ex_6_3`.

**Expected result:**

```
#>  p_value   mde_p2 mde_lift 
#>   0.2409   0.0698   0.0098 
```

**Difficulty:** Beginner

[HINTS]
A non-significant result is only meaningful if the test could have caught an effect worth caring about, so quantify the smallest effect it was powered to detect.
Get the p-value from `prop.test()`, then the detectable rate from `power.prop.test(n = 10000, p1 = 0.06, power = 0.80)$p2`.

```r title="Your turn"
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
res <- prop.test(c(640, 600), c(10000, 10000), correct = FALSE)
mde_p2 <- power.prop.test(n = 10000, p1 = 0.06, power = 0.80, sig.level = 0.05)$p2
ex_6_3 <- round(c(p_value = res$p.value, mde_p2 = mde_p2, mde_lift = mde_p2 - 0.06), 4)
ex_6_3
#>  p_value   mde_p2 mde_lift 
#>   0.2409   0.0698   0.0098 
```

**Explanation:** The p-value is 0.24, so the observed 0.4-point lift is not significant, but that does not prove treatment did nothing. With 10000 per arm the test was only powered to reliably detect a lift of about 0.98 points (to a 6.98% rate), more than double the effect seen. The honest conclusion is underpowered and inconclusive, not "no effect." Confusing absence of evidence with evidence of absence is one of the most common interview traps.

</details>

## What to do next

Keep building experiment-design fluency with these related collections and tutorials:

- [A/B Testing in R](AB-Testing-in-R.html): the full tutorial behind these cases, from randomization to analysis.
- [A/B Testing Exercises in R](A-B-Testing-Exercises-in-R.html): more practice on running and analyzing experiments in R.
- [Hypothesis Testing Exercises in R](Hypothesis-Testing-Exercises-in-R.html): drill the tests these readouts are built on.
- [Confidence Interval Exercises in R](Confidence-Interval-Exercises-in-R.html): sharpen the interval-estimation half of every readout.
- [R Interview Questions](R-Interview-Questions.html): broaden into the coding and stats questions that round out a data science screen.
