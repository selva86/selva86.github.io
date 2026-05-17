---
title: "Power Analysis Exercises in R: 18 Sample Size Problems Solved"
slug: "Power-Analysis-Exercises-in-R"
description: "Practice 18 power analysis problems in R with the pwr package: t-tests, ANOVA, proportions, regression. Sample size and power calculations with full solutions."
keywords: "power analysis exercises in R, pwr package exercises, sample size calculation R, pwr.t.test, pwr.anova.test, Cohen's d, statistical power exercises, MDE in R"
mathjax: true
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "Power Analysis Exercises"
sidebar_order: 145
fr_parent: "Statistical-Power-Analysis-in-R.html"
auto_link_terms: "power analysis exercises|sample size exercises|pwr package exercises|sample size calculation problems|statistical power problems"
auto_link_case_sensitive: false
target_keyword: "power analysis exercises in R"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Power Analysis Exercises in R: 18 Sample Size Problems Solved

<p class="lead">Eighteen hands-on power analysis exercises in R covering t-tests, ANOVA, correlation, proportions, chi-square, multiple regression, and Monte Carlo power simulation with the <code>pwr</code> package. Every problem ships with a runnable solution and a written explanation hidden under a reveal.</p>

```r title="Run this once before any exercise"
library(pwr)
library(dplyr)
library(ggplot2)
library(tibble)
```

Cohen's conventions (small, medium, large) used throughout: d = 0.2 / 0.5 / 0.8 for means, r = 0.1 / 0.3 / 0.5 for correlation, f = 0.1 / 0.25 / 0.4 for ANOVA, h = 0.2 / 0.5 / 0.8 for proportions, w = 0.1 / 0.3 / 0.5 for chi-square, f² = 0.02 / 0.15 / 0.35 for regression. Effect sizes feed every `pwr.*` function and turn vague hopes ("a real effect") into a quantity you can plan around.

## Section 1. Foundations: solving for n, power, and MDE (3 problems)

### Exercise 1.1: Solve for sample size in a two-sample t-test

**Task:** A clinical trial team wants to detect a medium between-group difference (Cohen's d = 0.5) in mean systolic blood pressure between a drug arm and a placebo arm. Compute the sample size per arm needed for 80% power at α = 0.05 (two-sided) using `pwr.t.test()` and save the result object to `ex_1_1`.

**Expected result:**

```
#>      Two-sample t test power calculation
#>
#>               n = 63.76561
#>               d = 0.5
#>       sig.level = 0.05
#>           power = 0.8
#>     alternative = two.sided
#>
#> NOTE: n is number in *each* group
```

**Difficulty:** Beginner
[HINTS]
Power calculations tie together four quantities; fix the three you already know and leave the one you want to learn as the unknown.
Call pwr.t.test() with d = 0.5, sig.level = 0.05, power = 0.80, type = "two.sample", alternative = "two.sided", and leave n out.

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- pwr.t.test(d = 0.5, sig.level = 0.05, power = 0.80,
                     type = "two.sample", alternative = "two.sided")
ex_1_1
#>      Two-sample t test power calculation
#>
#>               n = 63.76561
#>               d = 0.5
#>       sig.level = 0.05
#>           power = 0.8
#>     alternative = two.sided
#>
#> NOTE: n is number in *each* group
```

**Explanation:** `pwr.t.test()` follows the four-knob rule: pass any three of `n`, `d`, `sig.level`, `power` and leave the fourth as `NULL`. R solves for the missing one. The output 63.77 means you need 64 patients per arm (always round up: rounding down sacrifices the very power you specified). The `NOTE` line is easy to miss: total enrollment is 128, not 64.

</details>

### Exercise 1.2: Solve for power given a fixed sample size

**Task:** A grant submission specifies n = 30 per group already locked in by budget. The analyst needs to report the achievable power against a medium effect (d = 0.5) at α = 0.05 (two-sided) for a two-sample t-test. Use `pwr.t.test()` with `power = NULL` and save the result to `ex_1_2`.

**Expected result:**

```
#>      Two-sample t test power calculation
#>
#>               n = 30
#>               d = 0.5
#>       sig.level = 0.05
#>           power = 0.4778965
#>     alternative = two.sided
#>
#> NOTE: n is number in *each* group
```

**Difficulty:** Beginner
[HINTS]
When the sample size is already locked in by budget, the open question shifts to how often a real effect would actually be detected.
Use pwr.t.test() with n = 30, d = 0.5, sig.level = 0.05, type = "two.sample" and power = NULL.

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- pwr.t.test(n = 30, d = 0.5, sig.level = 0.05,
                     type = "two.sample", alternative = "two.sided")
ex_1_2
#>      Two-sample t test power calculation
#>
#>               n = 30
#>               d = 0.5
#>       sig.level = 0.05
#>           power = 0.4778965
#>     alternative = two.sided
#>
#> NOTE: n is number in *each* group
```

**Explanation:** Flipping which argument is `NULL` flips the question. Here R returns power = 0.478, meaning fewer than half the time a real medium effect would be detected. This is the "post-hoc power" calculation done BEFORE running the study (which is fine and informative). Computing observed-data post-hoc power AFTER the study is a known anti-pattern and not what this exercise does.

</details>

### Exercise 1.3: Minimum detectable effect at fixed n and power

**Task:** A product analyst has 50 users per arm and wants to know the smallest effect size their two-sample t-test can reliably detect at 80% power (α = 0.05, two-sided). Solve for `d = NULL` with `pwr.t.test()` and save the result object to `ex_1_3`. This is the MDE (minimum detectable effect) and is the single most useful question for a planning meeting.

**Expected result:**

```
#>      Two-sample t test power calculation
#>
#>               n = 50
#>               d = 0.5656287
#>       sig.level = 0.05
#>           power = 0.8
#>     alternative = two.sided
#>
#> NOTE: n is number in *each* group
```

**Difficulty:** Intermediate
[HINTS]
Hold both the sample size and the desired power fixed, and ask which effect magnitude is the smallest one still reliably caught.
Run pwr.t.test() with n = 50, power = 0.80, sig.level = 0.05, type = "two.sample" and leave the effect-size argument unspecified.

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- pwr.t.test(n = 50, power = 0.80, sig.level = 0.05,
                     type = "two.sample", alternative = "two.sided")
ex_1_3
#>      Two-sample t test power calculation
#>
#>               n = 50
#>               d = 0.5656287
#>       sig.level = 0.05
#>           power = 0.8
#>     alternative = two.sided
#>
#> NOTE: n is number in *each* group
```

**Explanation:** MDE inverts the design question: instead of "what n do I need to find d?", you ask "given n, what's the smallest d I'd notice?". The answer 0.566 says effects below that magnitude will mostly slip through as non-significant. This framing is honest in stakeholder conversations: it makes the gap between "we found nothing" and "no effect exists" explicit. Pair with the raw effect on the original scale (d × SD).

</details>

## Section 2. t-tests in practice (4 problems)

### Exercise 2.1: Paired-sample design for a before-and-after intervention

**Task:** A physical therapy clinic is studying whether a 6-week stretching protocol improves a hamstring flexibility score (paired, same patients before vs. after). Pilot data suggests a within-subject effect of d = 0.4. Compute the number of patients required for 90% power at α = 0.05 (two-sided) with `pwr.t.test()` using `type = "paired"` and save the result to `ex_2_1`.

**Expected result:**

```
#>      Paired t test power calculation
#>
#>               n = 67.07532
#>               d = 0.4
#>       sig.level = 0.05
#>           power = 0.9
#>     alternative = two.sided
#>
#> NOTE: n is number of *pairs*
```

**Difficulty:** Intermediate
[HINTS]
Measuring the same patients before and after is not two independent groups; the design flavor changes the calculation.
Pass type = "paired" to pwr.t.test() along with d = 0.4, power = 0.90, sig.level = 0.05, alternative = "two.sided".

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- pwr.t.test(d = 0.4, sig.level = 0.05, power = 0.90,
                     type = "paired", alternative = "two.sided")
ex_2_1
#>      Paired t test power calculation
#>
#>               n = 67.07532
#>               d = 0.4
#>       sig.level = 0.05
#>           power = 0.9
#>     alternative = two.sided
#>
#> NOTE: n is number of *pairs*
```

**Explanation:** Paired designs use the standard deviation of the per-subject DIFFERENCE, not the raw measurement SD. Because the same subject contributes both observations, within-subject correlation typically cuts that difference-SD substantially, which is why paired designs need far fewer subjects than independent two-sample designs for the same `d`. Watch for the `n is number of *pairs*` note: 68 patients total, not 68 per side.

</details>

### Exercise 2.2: One-sample t-test against a known benchmark

**Task:** A QA engineer needs to test whether the mean tensile strength of a new alloy batch exceeds the legacy spec of 500 MPa. Pilot data suggests a Cohen's d of 0.35 (improvement over 500). Compute the sample size needed for 80% power at α = 0.05 (one-sided, upper) with `pwr.t.test()` using `type = "one.sample"` and save the result to `ex_2_2`.

**Expected result:**

```
#>      One-sample t test power calculation
#>
#>               n = 52.0245
#>               d = 0.35
#>       sig.level = 0.05
#>           power = 0.8
#>     alternative = greater
```

**Difficulty:** Beginner
[HINTS]
Testing one mean against a fixed benchmark, with interest only in improvement, narrows both the design and the tail being tested.
Set type = "one.sample" and alternative = "greater" in pwr.t.test() with d = 0.35, power = 0.80, sig.level = 0.05.

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- pwr.t.test(d = 0.35, sig.level = 0.05, power = 0.80,
                     type = "one.sample", alternative = "greater")
ex_2_2
#>      One-sample t test power calculation
#>
#>               n = 52.0245
#>               d = 0.35
#>       sig.level = 0.05
#>           power = 0.8
#>     alternative = greater
```

**Explanation:** A one-sided alternative is justified ONLY when the direction is decided before any data is seen and the wrong-sign outcome is genuinely uninteresting (here, a worse alloy gets rejected regardless). The one-sided test gains power for free because all of α is on one tail, but the cost is no protection against detecting a real degradation. Make this decision in the protocol, not after looking at pilots, or you bias the inference.

</details>

### Exercise 2.3: Unequal sample sizes per arm with pwr.t2n.test

**Task:** A marketing team is running an A/B test where the control bucket has 800 sessions but the new variant only got 200 sessions before deploy was paused. Compute the achievable power to detect d = 0.25 at α = 0.05 (two-sided) using `pwr.t2n.test()` and save the result to `ex_2_3`. This is the right function when arms are unbalanced.

**Expected result:**

```
#>      t test power calculation
#>
#>              n1 = 800
#>              n2 = 200
#>               d = 0.25
#>       sig.level = 0.05
#>           power = 0.8537432
#>     alternative = two.sided
```

**Difficulty:** Intermediate
[HINTS]
When the two arms hold different counts, a single shared sample size no longer describes the design.
Use pwr.t2n.test() with n1 = 800, n2 = 200, d = 0.25, sig.level = 0.05, alternative = "two.sided" and power left out.

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- pwr.t2n.test(n1 = 800, n2 = 200, d = 0.25,
                       sig.level = 0.05, alternative = "two.sided")
ex_2_3
#>      t test power calculation
#>
#>              n1 = 800
#>              n2 = 200
#>               d = 0.25
#>       sig.level = 0.05
#>           power = 0.8537432
#>     alternative = two.sided
```

**Explanation:** Power for unbalanced designs is driven by the harmonic mean of `n1` and `n2`, which is dominated by the smaller arm. 800 vs 200 is roughly equivalent to 320 per arm balanced, so the extra control sessions buy less than you might guess. When you can choose, balanced enrollment is almost always more efficient than 80/20 splits. Use `pwr.t2n.test()` instead of `pwr.t.test()` whenever the groups are not equal.

</details>

### Exercise 2.4: Build a power curve over a range of sample sizes

**Task:** A study planner wants to see how power changes as sample size per arm grows from 10 to 200 for a two-sample t-test detecting d = 0.4 at α = 0.05 (two-sided). Build a tibble with columns `n` and `power` by mapping over `n_seq <- seq(10, 200, by = 10)` and save to `ex_2_4`. This is the canonical power-curve setup that goes into proposals.

**Expected result:**

```
#> # A tibble: 20 x 2
#>        n  power
#>    <dbl>  <dbl>
#>  1    10 0.115
#>  2    20 0.214
#>  3    30 0.314
#>  4    40 0.409
#>  5    50 0.496
#>  6    60 0.574
#> ...
#> # 14 more rows hidden
#> # n = 100 reaches power ≈ 0.81
```

**Difficulty:** Intermediate
[HINTS]
To see how power grows, evaluate it once at every candidate sample size and collect the answers into a table.
Loop n_seq through pwr.t.test() with sapply(), pull $power from each result, and assemble a tibble() of n and power.

```r title="Your turn"
ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
n_seq <- seq(10, 200, by = 10)
ex_2_4 <- tibble(
  n = n_seq,
  power = sapply(n_seq, function(nn) {
    pwr.t.test(n = nn, d = 0.4, sig.level = 0.05,
               type = "two.sample")$power
  })
)
ex_2_4
#> # A tibble: 20 x 2
#>        n  power
#>    <dbl>  <dbl>
#>  1    10 0.115
#>  2    20 0.214
#>  3    30 0.314
#> ...
```

**Explanation:** A power curve is the right deliverable when stakeholders ask "is n = 100 enough?". `pwr.t.test()` returns an S3 list, so `$power` pulls the scalar you need. `sapply()` works here because the output is a single numeric per call. For ggplot, pipe `ex_2_4` into `geom_line(aes(n, power)) + geom_hline(yintercept = 0.80, linetype = "dashed")` and the answer becomes self-evident.

</details>

## Section 3. ANOVA and correlation (4 problems)

### Exercise 3.1: One-way ANOVA sample size for four treatment groups

**Task:** An agronomist plans a one-way ANOVA comparing yield under four fertilizer formulations. Expected between-group effect is Cohen's f = 0.25 (medium). Compute the sample size per group needed for 80% power at α = 0.05 using `pwr.anova.test()` with `k = 4` and save to `ex_3_1`. Cohen's f for ANOVA equals the standard deviation of group means divided by the within-group SD.

**Expected result:**

```
#>      Balanced one-way analysis of variance power calculation
#>
#>               k = 4
#>               n = 44.59927
#>               f = 0.25
#>       sig.level = 0.05
#>           power = 0.8
#>
#> NOTE: n is number in each group
```

**Difficulty:** Intermediate
[HINTS]
Comparing several group means at once needs an effect size built for groups, not a single pairwise difference.
Call pwr.anova.test() with k = 4, f = 0.25, sig.level = 0.05, power = 0.80 and leave n unspecified.

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- pwr.anova.test(k = 4, f = 0.25, sig.level = 0.05, power = 0.80)
ex_3_1
#>      Balanced one-way analysis of variance power calculation
#>
#>               k = 4
#>               n = 44.59927
#>               f = 0.25
#>       sig.level = 0.05
#>           power = 0.8
#>
#> NOTE: n is number in each group
```

**Explanation:** Round up to 45 per group, so 180 total plots. The `k` argument is the number of groups, not (groups - 1) degrees of freedom: a common slip. Cohen's f is harder to estimate from pilots than d because it requires knowing how group means scatter around the grand mean. If you only have a pilot for two groups, translate that d to f via `f = d / 2` when k = 2, then scale up cautiously.

</details>

### Exercise 3.2: Solve for power in an ANOVA with fixed n

**Task:** An education researcher recruited n = 25 students per group across three teaching methods (k = 3) and now needs the realized power against a medium Cohen's f = 0.25 at α = 0.05. Use `pwr.anova.test()` solving for `power = NULL` and save the result to `ex_3_2`. Report the power as a percentage in the explanation.

**Expected result:**

```
#>      Balanced one-way analysis of variance power calculation
#>
#>               k = 3
#>               n = 25
#>               f = 0.25
#>       sig.level = 0.05
#>           power = 0.5707465
```

**Difficulty:** Intermediate
[HINTS]
With the group count and the per-group size both fixed, the only quantity still open is the detection rate.
Use pwr.anova.test() with k = 3, n = 25, f = 0.25, sig.level = 0.05 and power = NULL.

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- pwr.anova.test(k = 3, n = 25, f = 0.25, sig.level = 0.05)
ex_3_2
#>      Balanced one-way analysis of variance power calculation
#>
#>               k = 3
#>               n = 25
#>               f = 0.25
#>       sig.level = 0.05
#>           power = 0.5707465
```

**Explanation:** Power is 57%: with 25 per group the design is underpowered for a medium effect. The omnibus F detects ANY group difference, but it does NOT tell you which pair differs: that's a separate post-hoc question with its own multiple-comparison correction. If the researcher cares about a specific pair, plan power for that contrast (a two-sample t-test or a planned linear contrast), not the omnibus F.

</details>

### Exercise 3.3: Correlation sample size to detect r = 0.3

**Task:** A psychology lab wants to detect a moderate correlation (r = 0.3) between sleep duration and a memory test score. Compute the sample size needed for 80% power at α = 0.05 (two-sided) using `pwr.r.test()` and save the result to `ex_3_3`. This is the workhorse function for any Pearson-correlation hypothesis.

**Expected result:**

```
#>      approximate correlation power calculation (arctangh transformation)
#>
#>               n = 84.07364
#>               r = 0.3
#>       sig.level = 0.05
#>           power = 0.8
#>     alternative = two.sided
```

**Difficulty:** Intermediate
[HINTS]
Detecting an association between two continuous variables relies on a correlation-specific effect size, not a mean difference.
Run pwr.r.test() with r = 0.3, sig.level = 0.05, power = 0.80, alternative = "two.sided" and n left out.

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- pwr.r.test(r = 0.3, sig.level = 0.05, power = 0.80,
                     alternative = "two.sided")
ex_3_3
#>      approximate correlation power calculation (arctangh transformation)
#>
#>               n = 84.07364
#>               r = 0.3
#>       sig.level = 0.05
#>           power = 0.8
#>     alternative = two.sided
```

**Explanation:** Power for correlation uses Fisher's z (arctanh) transformation, which makes the sampling distribution of r approximately normal. The needed n grows nonlinearly: r = 0.3 needs 85 subjects, r = 0.2 needs about 194, r = 0.1 needs about 781. Small correlations require very large samples. If the literature suggests r ≈ 0.15, a 100-person study is essentially exploratory, not confirmatory.

</details>

### Exercise 3.4: Minimum detectable f for an ANOVA budget

**Task:** A lab can afford 20 mice per group across 5 groups in a one-way ANOVA (k = 5, n = 20). The PI needs the minimum detectable Cohen's f at 80% power, α = 0.05. Solve `pwr.anova.test()` with `f = NULL` and save the result to `ex_3_4`. Translate the resulting f into a one-line plain-English claim in the explanation.

**Expected result:**

```
#>      Balanced one-way analysis of variance power calculation
#>
#>               k = 5
#>               n = 20
#>               f = 0.3199926
#>       sig.level = 0.05
#>           power = 0.8
#>
#> NOTE: n is number in each group
```

**Difficulty:** Advanced
[HINTS]
Fix the group count, the per-group size, and the desired detection rate, then ask which effect size is the floor the design can catch.
Solve pwr.anova.test() with k = 5, n = 20, sig.level = 0.05, power = 0.80 and the effect-size argument left unspecified.

```r title="Your turn"
ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_4 <- pwr.anova.test(k = 5, n = 20, sig.level = 0.05, power = 0.80)
ex_3_4
#>      Balanced one-way analysis of variance power calculation
#>
#>               k = 5
#>               n = 20
#>               f = 0.3199926
#>       sig.level = 0.05
#>           power = 0.8
#>
#> NOTE: n is number in each group
```

**Explanation:** MDE for ANOVA is f ≈ 0.32, which sits between Cohen's medium (0.25) and large (0.40). Plain English: with this design, only between-group spread larger than roughly 30% of the within-group SD will be reliably caught. Smaller true effects will mostly look null. This is the right number to put in the protocol's "limitations" paragraph instead of pretending the study can detect everything.

</details>

## Section 4. Proportions and chi-square (3 problems)

### Exercise 4.1: Two-proportion A/B test sample size with pwr.2p.test

**Task:** A growth team is testing a checkout redesign expected to lift the conversion rate from 4% (p1) to 5% (p2). Compute the per-arm sample size needed for 80% power at α = 0.05 (two-sided), using `pwr.2p.test()` with Cohen's h obtained from `ES.h(p1, p2)`. Save the full result to `ex_4_1`. This is the canonical A/B test sizing question.

**Expected result:**

```
#>      Difference of proportion power calculation for binomial distribution (arcsine transformation)
#>
#>               h = 0.04859561
#>               n = 6647.156
#>       sig.level = 0.05
#>           power = 0.8
#>     alternative = two.sided
#>
#> NOTE: same sample sizes
```

**Difficulty:** Intermediate
[HINTS]
Two rates cannot go straight into a sizing formula; they first have to be turned into a proportion-specific effect size.
Compute the effect size with ES.h(p1 = 0.04, p2 = 0.05), then feed it to pwr.2p.test() with sig.level = 0.05, power = 0.80.

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
h_ab <- ES.h(p1 = 0.04, p2 = 0.05)
ex_4_1 <- pwr.2p.test(h = h_ab, sig.level = 0.05, power = 0.80,
                      alternative = "two.sided")
ex_4_1
#>      Difference of proportion power calculation for binomial distribution (arcsine transformation)
#>
#>               h = 0.04859561
#>               n = 6647.156
#>       sig.level = 0.05
#>           power = 0.8
#>     alternative = two.sided
#>
#> NOTE: same sample sizes
```

**Explanation:** ES.h applies the arcsine transformation: h = 2(asin(√p1) - asin(√p2)). The arcsine variance is stable across the [0,1] range, so the same h has the same statistical meaning whether base rate is 4% or 40%. The result, 6,648 per arm, is much larger than a naive Cohen's d calculation suggests, because a 1-point lift on a 4% base is a tiny absolute effect. This is why low-base-rate A/B tests are notoriously sample-hungry.

</details>

### Exercise 4.2: Chi-square goodness-of-fit power

**Task:** A geneticist is testing whether observed counts in four phenotype categories match a 9:3:3:1 Mendelian ratio with n = 200 total offspring. Expected effect size is w = 0.2 (a small departure). Compute the achievable power at α = 0.05 with `pwr.chisq.test()` using `df = 3` (categories minus 1) and save the result to `ex_4_2`.

**Expected result:**

```
#>      Chi squared power calculation
#>
#>               w = 0.2
#>               N = 200
#>              df = 3
#>       sig.level = 0.05
#>           power = 0.6228293
#>
#> NOTE: N is the number of observations
```

**Difficulty:** Advanced
[HINTS]
Checking whether observed category counts match an expected ratio is a chi-square problem, and the degrees of freedom come from the number of categories.
Call pwr.chisq.test() with w = 0.2, N = 200, df = 3, sig.level = 0.05 and power left unspecified.

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- pwr.chisq.test(w = 0.2, N = 200, df = 3, sig.level = 0.05)
ex_4_2
#>      Chi squared power calculation
#>
#>               w = 0.2
#>               N = 200
#>              df = 3
#>       sig.level = 0.05
#>           power = 0.6228293
#>
#> NOTE: N is the number of observations
```

**Explanation:** For chi-square, `df` is what shifts: a 2×3 table of independence uses `(2-1)*(3-1) = 2`, a goodness-of-fit with 4 categories uses `4-1 = 3`. The `N` argument is TOTAL observations, not per-cell. Power 62% is borderline; doubling N to 400 lifts it to ≈ 0.91. Effect size w can be computed from a hypothesized contingency table via `ES.w1()` (one-way) or `ES.w2()` (two-way) if you don't want to pick a Cohen's convention.

</details>

### Exercise 4.3: Convert a contingency table into Cohen's w

**Task:** A pollster has hypothesized cell probabilities for a 2×2 voting-preference table (`p_table` built inline below). Compute Cohen's w directly from the table using `ES.w2()`, then feed it into `pwr.chisq.test()` to find the N needed for 80% power at α = 0.05 with `df = 1`. Save the sample size result object to `ex_4_3`.

**Expected result:**

```
#> # Step 1: w from table
#> [1] 0.1393589
#> # Step 2: sample size
#>      Chi squared power calculation
#>
#>               w = 0.1393589
#>               N = 404.4488
#>              df = 1
#>       sig.level = 0.05
#>           power = 0.8
```

**Difficulty:** Advanced
[HINTS]
Rather than guessing a small/medium/large label, let the hypothesized table itself supply the effect size for the test of independence.
Derive the effect size from the matrix with ES.w2(), then pass it to pwr.chisq.test() with df = 1, sig.level = 0.05, power = 0.80.

```r title="Your turn"
# p_table is a 2x2 matrix of joint probabilities (rows sum to row-marginals,
# cols sum to col-marginals; total = 1)
p_table <- matrix(c(0.30, 0.25,
                    0.20, 0.25), nrow = 2, byrow = TRUE)
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
p_table <- matrix(c(0.30, 0.25,
                    0.20, 0.25), nrow = 2, byrow = TRUE)
w_obs <- ES.w2(p_table)
w_obs
#> [1] 0.1393589

ex_4_3 <- pwr.chisq.test(w = w_obs, df = 1, sig.level = 0.05, power = 0.80)
ex_4_3
#>      Chi squared power calculation
#>
#>               w = 0.1393589
#>               N = 404.4488
#>              df = 1
#>       sig.level = 0.05
#>           power = 0.8
```

**Explanation:** `ES.w2()` compares the supplied joint distribution against the independence model implied by its marginals, returning the effect size for a test of independence. This skips the guesswork of picking Cohen's small/medium/large: the table itself encodes the effect. About 405 respondents are needed. Always check that `sum(p_table) == 1` before passing in: `ES.w2()` will compute even on un-normalized tables and silently return wrong w.

</details>

## Section 5. Regression and advanced topics (4 problems)

### Exercise 5.1: Multiple regression sample size from f²

**Task:** A marketing analyst is fitting a regression with 5 predictors to explain customer-lifetime-value, and a colleague's prior study reports R² ≈ 0.13 for a similar set. Convert R² to Cohen's f² via `f2 = R2 / (1 - R2)` and compute the sample size needed for 80% power at α = 0.05 using `pwr.f2.test()` with `u = 5` (numerator df). Save the result to `ex_5_1`.

**Expected result:**

```
#>      Multiple regression power calculation
#>
#>               u = 5
#>               v = 76.04632
#>              f2 = 0.1494253
#>       sig.level = 0.05
#>           power = 0.8
#>
#> # Total n = u + v + 1
```

**Difficulty:** Advanced
[HINTS]
A regression's explained-variance figure must be rescaled into a regression effect size before it can drive a sample-size calculation.
Convert with f2 = R2 / (1 - R2), then call pwr.f2.test() with u = 5, that f2, sig.level = 0.05, power = 0.80.

```r title="Your turn"
R2 <- 0.13
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
R2 <- 0.13
f2 <- R2 / (1 - R2)
ex_5_1 <- pwr.f2.test(u = 5, f2 = f2, sig.level = 0.05, power = 0.80)
ex_5_1
#>      Multiple regression power calculation
#>
#>               u = 5
#>               v = 76.04632
#>              f2 = 0.1494253
#>       sig.level = 0.05
#>           power = 0.8

n_total <- ceiling(ex_5_1$u + ex_5_1$v + 1)
n_total
#> [1] 83
```

**Explanation:** `pwr.f2.test()` returns `v` (denominator df = n - u - 1). Recover n with `u + v + 1`. About 83 total observations are needed. Cohen's f² for regression: 0.02 = small, 0.15 = medium, 0.35 = large. To plan power for a SINGLE predictor added to a model with `q` other predictors, set `u = 1` and use `f2 = (R²_full - R²_reduced) / (1 - R²_full)`, which is the partial-effect form.

</details>

### Exercise 5.2: Power curve over a range of effect sizes

**Task:** A study planner wants a "what if the effect is smaller than I hoped" sensitivity check: for a two-sample t-test with n = 60 per arm and α = 0.05 (two-sided), compute power across `d_seq <- seq(0.1, 0.8, by = 0.05)` and store the result as a tibble with columns `d` and `power` named `ex_5_2`. This is the sensitivity counterpart to a sample-size curve.

**Expected result:**

```
#> # A tibble: 15 x 2
#>        d power
#>    <dbl> <dbl>
#>  1  0.1  0.107
#>  2  0.15 0.149
#>  3  0.2  0.198
#>  4  0.25 0.256
#> ...
#>  9  0.5  0.769
#> 10  0.55 0.832
#> ...
#> # 5 more rows hidden
```

**Difficulty:** Advanced
[HINTS]
To stress-test a fixed design, recompute power at each plausible effect size and gather the pairs into a table.
Map d_seq through pwr.t.test() with n = 60 via sapply(), extract $power, and build a tibble() of d and power.

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
d_seq <- seq(0.1, 0.8, by = 0.05)
ex_5_2 <- tibble(
  d = d_seq,
  power = sapply(d_seq, function(dd) {
    pwr.t.test(n = 60, d = dd, sig.level = 0.05,
               type = "two.sample")$power
  })
)
ex_5_2
#> # A tibble: 15 x 2
#>        d power
#>    <dbl> <dbl>
#>  1  0.1  0.107
#>  2  0.15 0.149
#> ...
```

**Explanation:** A sensitivity curve answers "what's the smallest d this design can still detect at acceptable power?" by reading the chart at power = 0.80. With n = 60 the design crosses 80% at d ≈ 0.52. Pair it with a plot: `ggplot(ex_5_2, aes(d, power)) + geom_line() + geom_hline(yintercept = 0.8, linetype = "dashed")`. Submitting both the sample-size curve (fixed d, varying n) and the sensitivity curve (fixed n, varying d) is the gold standard for power sections in proposals.

</details>

### Exercise 5.3: Bonferroni-adjusted alpha for multiple comparisons

**Task:** A trial runs 10 simultaneous two-sample t-tests across 10 secondary endpoints, each with n = 100 per arm. To control family-wise error at α = 0.05, divide α by 10 (Bonferroni) and compute the achievable power per test against d = 0.3 using `pwr.t.test()`. Save the result object to `ex_5_3`. Compare against the unadjusted-α power in the explanation.

**Expected result:**

```
#>      Two-sample t test power calculation
#>
#>               n = 100
#>               d = 0.3
#>       sig.level = 0.005
#>           power = 0.4090306
#>     alternative = two.sided
#>
#> NOTE: n is number in *each* group
#> # Unadjusted-alpha power for reference: 0.5598
```

**Difficulty:** Advanced
[HINTS]
Running many tests at once inflates false positives unless the per-test threshold is tightened first.
Divide 0.05 by 10 to get the adjusted alpha, then pass it as sig.level to pwr.t.test() with n = 100, d = 0.3, type = "two.sample".

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
alpha_adj <- 0.05 / 10
ex_5_3 <- pwr.t.test(n = 100, d = 0.3, sig.level = alpha_adj,
                     type = "two.sample", alternative = "two.sided")
ex_5_3
#>      Two-sample t test power calculation
#>
#>               n = 100
#>               d = 0.3
#>       sig.level = 0.005
#>           power = 0.4090306
#>     alternative = two.sided
#>
#> NOTE: n is number in *each* group

# Unadjusted comparison
pwr.t.test(n = 100, d = 0.3, sig.level = 0.05,
           type = "two.sample")$power
#> [1] 0.5598
```

**Explanation:** Bonferroni's tax: shrinking α from 0.05 to 0.005 drops per-test power from 56% to 41%. Multiple-testing burden is invisible if you only plan the primary endpoint, then surprise-add secondaries. Plan it up front: either preregister a smaller set of confirmatory endpoints, switch to a less conservative method (Holm, BH-FDR), or budget for the larger n needed under Bonferroni. Bonferroni is conservative when tests are correlated, so simulation-based adjustments can outperform it.

</details>

### Exercise 5.4: Empirical (simulated) power for a custom test

**Task:** When the test doesn't fit a closed-form `pwr.*` function (custom estimator, non-normal data), simulate. Generate 2000 Monte Carlo datasets of two-sample t-tests, n = 40 per arm, true mean difference = 0.5, common SD = 1, run `t.test()` each time, count the fraction with p < 0.05, and save the result as a numeric scalar to `ex_5_4`. Set the seed to `set.seed(2026)` for reproducibility.

**Expected result:**

```
#> [1] 0.5945
#> # Closed-form pwr.t.test for sanity check:
#> # power ≈ 0.598
```

**Difficulty:** Advanced
[HINTS]
When no closed-form formula fits, estimate power by repeatedly generating data and counting how often the test rejects.
Use replicate() to draw rnorm() samples and run t.test() each pass, then take mean(p_vals < 0.05) after set.seed(2026).

```r title="Your turn"
ex_5_4 <- # your code here
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(2026)
n_sim <- 2000
n_each <- 40
delta <- 0.5
p_vals <- replicate(n_sim, {
  x <- rnorm(n_each, mean = 0,     sd = 1)
  y <- rnorm(n_each, mean = delta, sd = 1)
  t.test(x, y)$p.value
})
ex_5_4 <- mean(p_vals < 0.05)
ex_5_4
#> [1] 0.5945

# Closed-form check
pwr.t.test(n = n_each, d = delta, sig.level = 0.05,
           type = "two.sample")$power
#> [1] 0.5981
```

**Explanation:** Monte Carlo estimates of power match `pwr.t.test()` because both test the same statistic on the same population. The real value of simulation is for SCENARIOS pwr cannot handle: heavy-tailed data, mixed-effects models, custom Bayesian decision rules, conditional stopping. Standard error on the simulated power estimate is roughly `sqrt(p(1-p)/n_sim)`, so 2000 reps gives ±1.1%. Bump to 10,000 reps for tighter intervals or when the test is computationally cheap.

</details>

## What to do next

You now have the building blocks for almost any frequentist power calculation. From here:

- Review the parent post: [Statistical Power Analysis in R](Statistical-Power-Analysis-in-R.html) for the full theoretical walkthrough.
- Practice the test mechanics themselves: [T-Test Exercises in R](T-Test-Exercises-in-R.html) and [ANOVA Exercises in R](ANOVA-Exercises-in-R.html).
- For experimental design more broadly, try [AB-Testing Exercises in R](AB-Testing-Exercises-in-R.html).
- For regression-specific power and diagnostics, work through [Linear Regression Exercises in R](Linear-Regression-Exercises-in-R.html).
