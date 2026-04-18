---
title: "Power Analysis Exercises in R: 8 Sample Size Calculation Problems, Solved Step-by-Step"
slug: Power-Analysis-Exercises-in-R
description: "Solve 8 power analysis exercises in R using the pwr package. Sample size problems for t-tests, ANOVA, correlation, and proportions, with full solutions."
keywords: "power analysis exercises R, pwr package exercises, sample size calculation R, pwr.t.test examples, pwr.anova.test, pwr.r.test, Cohen's effect size, statistical power R"
auto_link_terms: "power analysis exercises|sample size exercises|power analysis problems|power analysis practice|pwr package exercises|sample size calculation problems"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-18
curriculum_id: E5.5
post_type: EX
sidebar_title: "Power Analysis Exercises (8 problems)"
fr_parent: Statistical-Power-Analysis-in-R.html
difficulty: Intermediate
---

# Power Analysis Exercises in R: 8 Sample Size Calculation Problems, Solved Step-by-Step

<p class="lead">These 8 power analysis exercises in R walk you through sample size calculations for t-tests, ANOVA, correlations, proportions, and multiple regression using the <code>pwr</code> package, with every problem solved step-by-step and each solution runnable in the browser.</p>

## Which pwr function matches your test?

Every power calculation in the `pwr` package follows one idea: pick the function that matches your test, plug in three of the four knobs (sample size, effect size, significance level, power), and leave the fourth as `NULL`. R solves for whichever you left blank. Here is the same function used twice, once to find sample size, once to find power, so you see both directions before jumping into the 8 exercises.

```r title="Pwr: solve for sample size, then for power"
# Load pwr once; it persists for every block below
library(pwr)

# Direction 1: solve for n (leave n blank)
n_demo <- pwr.t.test(d = 0.5, sig.level = 0.05, power = 0.80,
                     type = "two.sample", alternative = "two.sided")
n_demo$n
#> [1] 63.76561

# Direction 2: solve for power given n = 30 (leave power blank)
power_demo <- pwr.t.test(n = 30, d = 0.5, sig.level = 0.05,
                         type = "two.sample", alternative = "two.sided")
power_demo$power
#> [1] 0.4778965
```

The first call says a two-sample t-test needs about **64 participants per group** to detect a medium effect (Cohen's d = 0.5) with 80% power at α = 0.05. The second call flips the question: if you only have 30 per group, your power drops to **48%**, which means more than half the time you would miss the effect even when it is truly there. One function, one object, two completely different design decisions.

Here is the one-line decision rule for picking a function:

| Your test | pwr function | Effect size you supply |
|---|---|---|
| One-, two-, or paired-sample t-test | `pwr.t.test()` | Cohen's d |
| One-way ANOVA | `pwr.anova.test()` | Cohen's f |
| Two-proportion z-test | `pwr.2p.test()` | Cohen's h (via `ES.h()`) |
| Pearson correlation | `pwr.r.test()` | r (the correlation itself) |
| Chi-square test | `pwr.chisq.test()` | Cohen's w |
| Linear / multiple regression | `pwr.f2.test()` | Cohen's f² |

[KEY INSIGHT]
**Every pwr function takes four knobs and solves for the one you leave as NULL.** If you do not pass a value for `n`, R solves for sample size. If you do not pass `power`, R solves for power. If you do not pass the effect size argument (`d`, `f`, `h`, `r`, `w`, `f2`), R solves for the minimum detectable effect. Three knowns, one unknown, every time.

**Try it:** Compute the sample size for a **one-sample** t-test that detects a small-to-medium effect of `d = 0.4` with 80% power at α = 0.05. Save the raw `n` (unrounded) to `ex_n`.

```r title="Your turn: one-sample t-test n"
# Try it: one-sample t-test sample size
ex_n <- pwr.t.test(d = 0.4,
                   sig.level = 0.05,
                   power = 0.80,
                   type = "___",          # fill in the type
                   alternative = "two.sided")$n
ex_n
#> Expected: around 51.01
```

<details>
<summary>Click to reveal solution</summary>

```r title="One-sample t-test solution"
ex_n <- pwr.t.test(d = 0.4,
                   sig.level = 0.05,
                   power = 0.80,
                   type = "one.sample",
                   alternative = "two.sided")$n
ex_n
#> [1] 51.00945
```

**Explanation:** `type = "one.sample"` is the switch that turns a two-sample calculation into a one-sample one. The one-sample t-test needs *fewer* participants than two-sample for the same effect, because you are only estimating one mean against a known reference, not two means against each other.

</details>

## How do you read pwr output in R?

Every `pwr.*` function returns a `"power.htest"` object, a list with named components you can index directly. The print method shows a nicely formatted block, but the real value is in pulling fields out by name for report tables, plots, or downstream decisions like inflating for dropout.

```r title="Inspect a pwr.t.test result object"
# Two-sample t-test: medium effect, 80% power
ss_res <- pwr.t.test(d = 0.5, sig.level = 0.05, power = 0.80,
                     type = "two.sample", alternative = "two.sided")

# The fields you'll actually use
ss_res$n
#> [1] 63.76561
ss_res$d
#> [1] 0.5
ss_res$power
#> [1] 0.8
ss_res$method
#> [1] "Two-sample t test power calculation"

# Round n up: you cannot recruit 63.77 people
ceiling(ss_res$n)
#> [1] 64
```

The raw `$n` of 63.77 is the mathematical solution, the real-world sample size is always `ceiling($n)` because you cannot enrol a fractional participant. For a two-sample design, the 64 is **per group**, so the **total study size is 128**. Mixing these up is one of the most common power analysis mistakes, and Exercise 4 will reinforce it with a concrete cost in study budget.

Cohen also gave convenient **small/medium/large** presets for each effect-size family. You will use these constantly when a principal investigator says "assume a medium effect":

| Family | Small | Medium | Large | Function |
|---|---|---|---|---|
| d (mean difference / SD) | 0.20 | 0.50 | 0.80 | `pwr.t.test` |
| f (ANOVA between / within SD) | 0.10 | 0.25 | 0.40 | `pwr.anova.test` |
| h (arcsine of proportions) | 0.20 | 0.50 | 0.80 | `pwr.2p.test` |
| r (correlation) | 0.10 | 0.30 | 0.50 | `pwr.r.test` |
| f² (R² / (1 − R²)) | 0.02 | 0.15 | 0.35 | `pwr.f2.test` |

The math is the same in every family: **small is hard to find, large is impossible to miss**. Cohen's `cohen.ES(test = "t", size = "medium")` returns the same presets programmatically if you want them inside a function.

[TIP]
**Always round per-arm n with `ceiling()`, never `round()`.** `round(63.77)` gives 64, but `round(63.20)` gives 63, which would leave you *underpowered*. Always round **up** to guarantee the target power, not down. This is a one-line habit that prevents a recurring class of design bugs.

[WARNING]
**The n from pwr is per group, not total.** A two-sample t-test with n = 64 means **64 + 64 = 128 participants total**. A one-way ANOVA with k = 4 groups and n = 45 means **45 × 4 = 180**. Inflate for expected dropout on top of that (typically 10–20% for short studies, 30–50% for long or demanding ones).

**Try it:** Take the saved `ss_res` from above and compute the **total** sample size for the two-sample design, rounded up. Save to `ex_ceil`.

```r title="Your turn: total sample size"
# Try it: total sample size = per-arm n * 2, rounded up
ex_ceil <- ceiling(ss_res$n) * ___   # fill in the multiplier
ex_ceil
#> Expected: 128
```

<details>
<summary>Click to reveal solution</summary>

```r title="Total n solution"
ex_ceil <- ceiling(ss_res$n) * 2
ex_ceil
#> [1] 128
```

**Explanation:** Two-sample designs have two equal arms, so total = per-arm × 2. If the arms were unequal, you would instead call `pwr.t2n.test()` with `n1` and `n2` separately.

</details>

## Practice Exercises

Eight capstone problems, ordered from simpler single-function solves to harder inverse problems. Each exercise uses a distinct `ex1_` to `ex8_` prefix so your solution variables do not clobber earlier state.

### Exercise 1: Two-sample t-test sample size

You are designing an A/B test comparing a new onboarding flow against the old one. You want to detect a medium effect (`d = 0.5`) with 80% power at α = 0.05, two-sided. How many users do you need **per arm**?

```r title="Exercise 1 starter: two-sample t-test n"
# Exercise 1: two-sample t-test, d = 0.5, power = 0.80, alpha = 0.05
# Hint: pwr.t.test(..., type = "two.sample", alternative = "two.sided")

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
ex1_res <- pwr.t.test(d = 0.5,
                      sig.level = 0.05,
                      power = 0.80,
                      type = "two.sample",
                      alternative = "two.sided")
ex1_res
#>
#>      Two-sample t test power calculation
#>
#>               n = 63.76561
#>               d = 0.5
#>       sig.level = 0.05
#>           power = 0.8
#>     alternative = two.sided
#>
#> NOTE: n is number in *each* group

ceiling(ex1_res$n) * 2
#> [1] 128
```

**Explanation:** 63.77 per group rounds up to **64 per arm, 128 total**. Cohen calls d = 0.5 a medium effect, the kind you can spot with the naked eye on a boxplot. Smaller effects (d = 0.2) would roughly quadruple the sample, because required n scales as **1/d²**.

</details>

### Exercise 2: Paired t-test sample size

You are running a pre-post study on the same group of employees (measuring focus score before and after a training). The expected within-subject effect is small-to-medium (`d = 0.3`). You want 90% power at α = 0.05, two-sided. How many **pairs** do you need?

```r title="Exercise 2 starter: paired t-test n"
# Exercise 2: paired t-test, d = 0.3, power = 0.90, alpha = 0.05
# Hint: type = "paired"

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
ex2_res <- pwr.t.test(d = 0.3,
                      sig.level = 0.05,
                      power = 0.90,
                      type = "paired",
                      alternative = "two.sided")
ex2_res$n
#> [1] 119.1701

ceiling(ex2_res$n)
#> [1] 120
```

**Explanation:** You need **120 paired measurements** (i.e., 120 employees measured twice, not 240 people). Paired designs soak up between-subject variability, so the same `d` is effectively easier to detect than in a two-sample design. Two knobs changed from Exercise 1: the effect shrank from 0.5 to 0.3 (which alone triples n), and power rose from 0.80 to 0.90 (which adds about 34%). Both bumps push n up sharply.

</details>

### Exercise 3: One-way ANOVA with 4 groups

You are comparing mean revenue across **4** marketing channels. You expect a medium between-group effect (`f = 0.25`), want 80% power at α = 0.05. How many observations **per group** do you need?

```r title="Exercise 3 starter: one-way ANOVA n per group"
# Exercise 3: pwr.anova.test, k = 4, f = 0.25, power = 0.80, alpha = 0.05

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
ex3_res <- pwr.anova.test(k = 4,
                          f = 0.25,
                          sig.level = 0.05,
                          power = 0.80)
ex3_res
#>
#>      Balanced one-way analysis of variance power calculation
#>
#>               k = 4
#>               n = 44.59927
#>               f = 0.25
#>       sig.level = 0.05
#>           power = 0.8
#>
#> NOTE: n is number in each group

ceiling(ex3_res$n) * 4
#> [1] 180
```

**Explanation:** **45 observations per group × 4 groups = 180 total.** ANOVA power depends on the between-group spread relative to the within-group spread, captured by Cohen's `f`. The same f = 0.25 with only 2 groups (a t-test) would need only ~64 per group, four groups demand more because the detection threshold has to clear the multiple-comparison baked into the F statistic's null distribution.

</details>

### Exercise 4: Two-proportion test (email click-through rates)

Your baseline email has a 10% click-through rate. You want to detect an improvement to **15%** (absolute 5 percentage-point lift) with 80% power at α = 0.05, two-sided. How many emails do you need per variant?

```r title="Exercise 4 starter: two-proportion test n"
# Exercise 4: pwr.2p.test, p1 = 0.10, p2 = 0.15
# Step 1: convert proportions to Cohen's h with ES.h(p1, p2)
# Step 2: pwr.2p.test(h, sig.level, power)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 4 solution"
ex4_h <- ES.h(p1 = 0.10, p2 = 0.15)
ex4_h
#> [1] -0.1519499

ex4_res <- pwr.2p.test(h = ex4_h,
                       sig.level = 0.05,
                       power = 0.80,
                       alternative = "two.sided")
ex4_res$n
#> [1] 340.2519

ceiling(ex4_res$n) * 2
#> [1] 682
```

**Explanation:** `ES.h()` applies the arcsine transformation, `h = 2·asin(√p1) − 2·asin(√p2)`, giving `h = −0.152` here (the sign just tracks which proportion is larger; pwr uses the magnitude). You need **341 emails per arm, 682 total**. Notice how small an absolute 5-percentage-point lift looks in effect-size units, proportions close to 0 or 1 have a compressed arcsine scale, and detecting them needs more data than the raw difference suggests.

</details>

[NOTE]
**`ES.h()` is not the same as `p1 − p2`.** Cohen's h stabilises variance across the 0–1 range of proportions, so a 5-point lift from 0.10 to 0.15 gives a different `h` than a 5-point lift from 0.45 to 0.50. Always feed raw proportions to `ES.h()` rather than computing a difference yourself.

### Exercise 5: Correlation sample size

You want to run a validity study to detect a modest correlation (`r = 0.30`) between two survey scales with 80% power at α = 0.05, two-sided. How many participants do you need?

```r title="Exercise 5 starter: correlation n"
# Exercise 5: pwr.r.test, r = 0.30, power = 0.80, alpha = 0.05

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 5 solution"
ex5_res <- pwr.r.test(r = 0.30,
                      sig.level = 0.05,
                      power = 0.80,
                      alternative = "two.sided")
ex5_res$n
#> [1] 84.07364

ceiling(ex5_res$n)
#> [1] 85
```

**Explanation:** You need **85 participants**. Correlation power scales roughly as `1/atanh(r)²`, so detecting `r = 0.1` would need about 783 participants, while `r = 0.5` only needs about 29. Fisher's z-transform (`atanh`) is the quiet workhorse behind this calculation, it turns the bounded `[−1, 1]` correlation into an unbounded normal-ish quantity where power arithmetic works cleanly.

</details>

### Exercise 6: Achieved power for a fixed n (inverse problem)

Your principal investigator says "we already have n = 30 per group, and we expect a medium effect (`d = 0.5`). What is our power for a two-sample t-test at α = 0.05?" Solve for power (the inverse direction).

```r title="Exercise 6 starter: solve for power"
# Exercise 6: pwr.t.test with n = 30, d = 0.5, solve for power
# Hint: leave power as NULL (do not pass it)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 6 solution"
ex6_res <- pwr.t.test(n = 30,
                      d = 0.5,
                      sig.level = 0.05,
                      type = "two.sample",
                      alternative = "two.sided")
ex6_res$power
#> [1] 0.4778965
```

**Explanation:** Power is about **48%**, well below the conventional 80% target. In plain English, more than half the time this study would fail to detect a real medium effect. This is the classic "post-hoc power" setup, and the honest recommendation here is: either **collect more data** (Exercise 1 said ~64 per arm for 80%), **accept a smaller detectable effect** (Exercise 7), or **redesign** with a more sensitive measure.

</details>

[KEY INSIGHT]
**A study with less than 80% power is a gamble against your own hypothesis.** If the true effect is exactly what you assumed and power is 48%, you will fail to reject the null 52% of the time and publish or report a false negative. That is not a subtle statistical issue, it is a coin flip about whether your study can even answer its question.

### Exercise 7: Minimum detectable effect (inverse problem)

Constraint flips again: you have exactly **n = 50 per group**, you want 80% power at α = 0.05, two-sided. What is the **smallest Cohen's d** your study can reliably detect?

```r title="Exercise 7 starter: solve for d"
# Exercise 7: pwr.t.test with n = 50, power = 0.80, solve for d
# Hint: leave d as NULL (do not pass it)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 7 solution"
ex7_res <- pwr.t.test(n = 50,
                      sig.level = 0.05,
                      power = 0.80,
                      type = "two.sample",
                      alternative = "two.sided")
ex7_res$d
#> [1] 0.5657458
```

**Explanation:** Your minimum detectable effect is `d ≈ 0.566`, just above medium. Anything smaller than that, your study will miss more than 20% of the time. This framing is often the most useful version of power analysis in practice: instead of asking "how many do I need?" (which assumes you know the effect), you ask "given what I can collect, what effects can I actually see?" and then judge whether that floor is scientifically interesting.

</details>

### Exercise 8: Multiple linear regression (pwr.f2.test)

You are fitting a multiple regression with **3 predictors** and want to detect a medium overall effect (`f² = 0.15`) with 80% power at α = 0.05. Solve for `v` (the denominator degrees of freedom) and convert to **total sample size**.

```r title="Exercise 8 starter: pwr.f2.test"
# Exercise 8: pwr.f2.test, u = 3 (predictors), f2 = 0.15, power = 0.80
# Hint: leave v as NULL; total n = v + u + 1 (adds back intercept + u predictors)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 8 solution"
ex8_res <- pwr.f2.test(u = 3,
                       f2 = 0.15,
                       sig.level = 0.05,
                       power = 0.80)
ex8_res$v
#> [1] 72.70583

total_n <- ceiling(ex8_res$v) + 3 + 1
total_n
#> [1] 77
```

**Explanation:** `u` is the numerator df (number of tested predictors), `v` is the denominator df (residual df). Total sample size is `n = v + u + 1` because the model consumes `u + 1` parameters (the intercept plus `u` slopes). So **73 residual df + 3 predictors + 1 intercept = 77 participants**. Cohen's `f² = R² / (1 − R²)`; `f² = 0.15` corresponds to an R² of about 13%.

</details>

[TIP]
**Total n for regression is `v + u + 1`, not just `v`.** `pwr.f2.test()` returns `v`, the residual degrees of freedom, because that is the quantity the F statistic uses. Converting to a recruitment target always requires adding back `u + 1` for the model parameters.

## Complete Example: Design an A/B Test in 10 Lines

You are the analyst on an e-commerce pricing experiment. Baseline conversion is 12%. Product wants to know the smallest variant-conversion lift you can reliably detect with a two-proportion z-test at 80% power, α = 0.05, assuming 20% user dropout before the conversion window closes. Here is the whole calculation in one block.

```r title="End-to-end study design"
# Step 1: effect size for a minimum interesting lift, 12% -> 14%
design_h <- ES.h(p1 = 0.12, p2 = 0.14)
design_h
#> [1] -0.05972551

# Step 2: per-arm sample size
design_res <- pwr.2p.test(h = design_h,
                          sig.level = 0.05,
                          power = 0.80,
                          alternative = "two.sided")
n_per_arm <- ceiling(design_res$n)
n_per_arm
#> [1] 2201

# Step 3: inflate by 20% for dropout
n_inflated <- ceiling(n_per_arm / (1 - 0.20))
n_inflated
#> [1] 2752

# Step 4: total users across both arms
n_inflated * 2
#> [1] 5504
```

You need to route about **5,504 users** into the A/B test to reliably spot a 2-percentage-point lift after accounting for dropout. The key numbers to report back to Product are: the minimum lift assumed (2pp), the per-arm inflated n (2,752), and the total (5,504). If they push back ("can we do it with 3,000 users?"), run the inverse version from Exercise 6: hold `n` fixed and report the resulting power, so the tradeoff is explicit.

## Summary

Here is the full scoreboard for the 8 exercises plus the capstone, side-by-side:

| # | Test | pwr function | Effect size | Solve for | Answer |
|---|---|---|---|---|---|
| 1 | Two-sample t | `pwr.t.test` | d = 0.5 | n | 64 per arm (128 total) |
| 2 | Paired t | `pwr.t.test` (paired) | d = 0.3 | n | 120 pairs |
| 3 | One-way ANOVA, k=4 | `pwr.anova.test` | f = 0.25 | n | 45 per group (180 total) |
| 4 | Two-proportion | `pwr.2p.test` | h from ES.h(0.10, 0.15) | n | 341 per arm (682 total) |
| 5 | Correlation | `pwr.r.test` | r = 0.30 | n | 85 |
| 6 | Two-sample t | `pwr.t.test` | d = 0.5, n = 30 | **power** | 0.478 |
| 7 | Two-sample t | `pwr.t.test` | n = 50, power = 0.80 | **d** | 0.566 |
| 8 | Multiple regression | `pwr.f2.test` | u = 3, f² = 0.15 | v → total n | 77 total |
| E | A/B test design | `pwr.2p.test` + inflation | h from 0.12 vs 0.14 | n with dropout | 5,504 total |

Four rules carry through every exercise:

- **Three knowns, one unknown.** Leave the unknown knob as `NULL` and pwr solves for it.
- **`ceiling()`, never `round()`.** Per-arm n always rounds **up**, because 63.77 participants means you need 64.
- **n is per group.** Multiply by the number of arms for t-tests and ANOVA; add `u + 1` for regression.
- **Inflate for dropout.** Divide per-arm n by the expected retention rate (e.g., `n / 0.80` for a 20% dropout study) before reporting.

## References

1. Champely, S. (2020). *pwr: Basic Functions for Power Analysis*. CRAN package. [Link](https://cran.r-project.org/package=pwr)
2. pwr package vignette, "A simple example". [Link](https://cran.r-project.org/web/packages/pwr/vignettes/pwr-vignette.html)
3. Cohen, J. (1988). *Statistical Power Analysis for the Behavioral Sciences*, 2nd ed. Routledge.
4. Cohen, J. (1992). A power primer. *Psychological Bulletin*, 112(1), 155-159.
5. Higgins, P. D. R. *Reproducible Medical Research with R*, Chapter 23 – Sample Size Calculations with pwr. [Link](https://bookdown.org/pdr_higgins/rmrwr/sample-size-calculations-with-pwr.html)
6. UCLA OARC, Power Analysis for Paired Sample t-test. [Link](https://stats.oarc.ucla.edu/r/dae/power-analysis-for-paired-sample-t-test/)
7. UCLA OARC, One-way ANOVA Power Analysis. [Link](https://stats.oarc.ucla.edu/r/dae/one-way-anova-power-analysis/)

## Continue Learning

- [Statistical Power Analysis in R](Statistical-Power-Analysis-in-R.html) – the theory companion for these exercises, covering the math of power curves and Cohen's effect-size families in depth.
- [t-Test Exercises in R](t-Test-Exercises-in-R.html) – drill the t-test itself on 12 graded problems once you have sized your study.
- [Confidence Interval Exercises in R](Confidence-Interval-Exercises-in-R.html) – the sibling framework to power, the other half of the design-and-report story.
