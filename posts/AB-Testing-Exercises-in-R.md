---
title: "A/B Testing Exercises in R: 8 Power, Sample Size & Analysis Problems — Solved Step-by-Step)"
slug: AB-Testing-Exercises-in-R
description: "Solve 8 A/B testing exercises in R: sample size with pwr, prop.test lifts, Welch t-test, peeking simulation, and dropout inflation, with full solutions."
keywords: "a/b testing exercises R, a/b test sample size, pwr.2p.test exercises, prop.test a/b, welch t-test a/b, peeking problem R, minimum detectable effect, ab test dropout"
auto_link_terms: "A/B testing exercises|A/B test exercises|A/B testing problems|A/B testing practice|pwr.2p.test exercises|A/B test sample size problems"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-20
curriculum_id: E7.5
post_type: EX
sidebar_title: "A/B Testing Exercises (8 problems)"
fr_parent: AB-Testing-in-R.html
difficulty: Intermediate
---

# A/B Testing Exercises in R: 8 Power, Sample Size & Analysis Problems — Solved Step-by-Step)

<p class="lead">These 8 A/B testing exercises in R cover the full design-analyse-stop workflow: sizing a test with <code>pwr.2p.test()</code>, analysing proportions with <code>prop.test()</code>, comparing continuous metrics with Welch's t-test, and quantifying the peeking problem, with every solution runnable in the browser.</p>

## What does a single A/B test in R look like end-to-end?

Before drilling 8 isolated problems, let's compress the whole A/B workflow into a single runnable block. Counts go in, significance comes out, plus the piece most tutorials skip: the confidence interval for the *lift* itself. The pattern below is the same one you will use in every analysis exercise later, the difference is just which knobs are fixed and which you solve for.

```r title="Run a two-proportion A/B test end-to-end"
# Successes and trials for (new, old)
success <- c(130, 105)
trials  <- c(2000, 2000)

test_result <- prop.test(success, trials, correct = FALSE)
test_result
#>
#> 	2-sample test for equality of proportions without continuity correction
#>
#> data:  success out of trials
#> X-squared = 3.0617, df = 1, p-value = 0.08015
#> alternative hypothesis: two.sided
#> 95 percent confidence interval:
#>  -0.001511495  0.026511495
#> sample estimates:
#> prop 1 prop 2
#>  0.065  0.0525
```

Three numbers tell the whole story. Conversion rates were 6.5% vs 5.25%, a lift of 1.25 percentage points. The p-value 0.08 sits above the usual 0.05 threshold, so we cannot reject "the two variants perform equally". The 95% CI for the lift is roughly -0.15pp to +2.65pp, meaning the data are consistent with anything from a tiny loss to a meaningful win. Calling this a winner would be premature.

[KEY INSIGHT]
**Every A/B test has three pillars: plan, analyse, stop.** Plan the sample size *before* you collect data, analyse once at the end with the test that matches your metric, and stop on a pre-specified rule. Skip any one and the p-value you report is a number without a meaning.

[NOTE]
**`correct = FALSE` matches the textbook chi-square formula.** The default `correct = TRUE` applies Yates's continuity correction, which is slightly more conservative on small samples. For large A/B tests (thousands per arm) the two agree to 3 decimal places, so the choice is mostly a style preference, stay consistent across your reports.

**Try it:** Re-run the same `prop.test()` with only 500 visitors per arm (so 33 conversions in the new group and 26 in the old). The point estimate of the lift barely moves, but the confidence interval should widen noticeably. Save the `prop.test` object to `ex_result`.

```r title="Your turn: shrink the sample and watch the CI"
# Try it: smaller sample, same approximate lift
ex_success <- c(33, 26)
ex_trials  <- c(500, 500)

ex_result <- prop.test(___, ___, correct = FALSE)
ex_result
#> Expected: lift ~1.4pp, p around 0.35, CI roughly (-0.016, 0.044)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Smaller sample solution"
ex_success <- c(33, 26)
ex_trials  <- c(500, 500)

ex_result <- prop.test(ex_success, ex_trials, correct = FALSE)
ex_result$p.value
#> [1] 0.3485615
ex_result$conf.int
#> [1] -0.01578115  0.04378115
#> attr(,"conf.level")
#> [1] 0.95
```

**Explanation:** With 4x fewer visitors the point estimates barely change, but the CI widens by roughly 2x. Sample size controls *precision*, not the *effect* you happen to observe.

</details>

## How do you pick a sample size before the test runs?

The sample size question has four knobs: the baseline rate $p_1$, the minimum lift you care about ($p_2 - p_1$), the significance level $\alpha$ (usually 0.05), and the power $1 - \beta$ (usually 0.80). Fix any three and R solves for the fourth. For sample size you fix $p_1$, $p_2$, $\alpha$, and power, and leave `n` blank.

The `pwr` package uses Cohen's arcsine-transformed effect size $h$, which stabilises variance across the 0-to-1 proportion range. `ES.h()` computes $h$ for you, and `pwr.2p.test()` returns the per-arm sample size.

$$h = 2 \cdot \arcsin(\sqrt{p_1}) - 2 \cdot \arcsin(\sqrt{p_2})$$

Where:
- $p_1, p_2$ = the two conversion rates (e.g., 0.10 and 0.12)
- $h$ = a standardised effect size with known power tables

```r title="pwr.2p.test for baseline 10% to 12% lift"
library(pwr)

h_demo <- ES.h(p1 = 0.12, p2 = 0.10)
round(h_demo, 4)
#> [1] 0.0634

n_demo <- pwr.2p.test(h = h_demo,
                      sig.level = 0.05,
                      power = 0.80,
                      alternative = "two.sided")
n_demo$n
#> [1] 3840.73

ceiling(n_demo$n) * 2
#> [1] 7682
```

You need about **3,841 users per arm, 7,682 total** to detect a 2-percentage-point lift from a 10% baseline. That is a surprisingly large number for what looks like a visible improvement, and it is the typical A/B-testing lesson: small absolute differences at moderate baselines need five-figure sample sizes.

[TIP]
**Always round per-arm n with `ceiling()`, never `round()`.** `round(3840.73)` gives 3841, but `round(3840.20)` gives 3840, which would leave you slightly underpowered. Always round **up** to guarantee the target power, and multiply by the number of arms for the total recruitment target.

**Try it:** Compute the per-arm sample size for a baseline 5% conversion rate lifting to 6%, 80% power at $\alpha = 0.05$, two-sided. You should land around 8,000 per arm.

```r title="Your turn: sample size for 5% to 6% lift"
# Try it: ES.h then pwr.2p.test
ex_h <- ES.h(p1 = ___, p2 = ___)
ex_n <- pwr.2p.test(h = ex_h,
                    sig.level = 0.05,
                    power = 0.80,
                    alternative = "two.sided")$n
ceiling(ex_n)
#> Expected: around 8193
```

<details>
<summary>Click to reveal solution</summary>

```r title="5% to 6% solution"
ex_h <- ES.h(p1 = 0.06, p2 = 0.05)
ex_n <- pwr.2p.test(h = ex_h,
                    sig.level = 0.05,
                    power = 0.80,
                    alternative = "two.sided")$n
ceiling(ex_n)
#> [1] 8193
```

**Explanation:** Detecting a 1pp lift from a 5% baseline takes **roughly 2x the sample** of a 2pp lift from a 10% baseline. The effect size $h$ halved, and required n scales as `1/h²`, so it roughly quadruples in theory, though the arcsine transform softens this in practice.

</details>

## How do you analyse a continuous metric like revenue per user?

Not every A/B metric is a proportion. Revenue per user, session length, pages viewed, and API latency are continuous, and proportion tests do not apply. The default tool is Welch's two-sample t-test, which does not assume equal variances between arms, a property you want because revenue distributions are almost always heavier-tailed in one arm than the other.

Let's simulate two revenue streams from log-normal distributions, closer to what real revenue data looks like, and compare them with `t.test()`. The output gives the CI for the mean difference directly, which is the lift on the dollar scale.

```r title="Welch t-test on simulated revenue per user"
set.seed(4725)

rev_A <- rlnorm(1000, meanlog = 3.0, sdlog = 0.5)  # control
rev_B <- rlnorm(1000, meanlog = 3.1, sdlog = 0.5)  # treatment

t_result <- t.test(rev_B, rev_A, var.equal = FALSE)
round(t_result$estimate, 2)
#> mean of x mean of y
#>     25.08     22.87
round(t_result$conf.int, 2)
#> [1] 1.21 3.21
#> attr(,"conf.level")
#> [1] 0.95
round(t_result$p.value, 5)
#> [1] 0.00002
```

The treatment arm averaged \$25.08 per user against \$22.87 in control, a lift of \$2.21 with a 95% CI of (\$1.21, \$3.21). The CI sits entirely above zero and the p-value is tiny, so the result is statistically unambiguous. Report the lift and CI together: "+\$2.21/user (95% CI +\$1.21 to +\$3.21)" is far more useful to a product team than "p < 0.001".

[WARNING]
**Revenue distributions have extreme outliers that can mislead a t-test.** A single whale customer can swing the mean by 20% and turn real noise into a "win". Three defences: (1) cap extreme values at the 99th percentile before the test, (2) run `wilcox.test()` as a non-parametric sanity check, or (3) model on `log(revenue + 1)` and compare geometric means.

**Try it:** Two arms have means 52.0 and 54.5, standard deviations 15.0 and 15.5, and 1,200 users each. Compute the pooled-SD Cohen's d for this effect. Save to `ex_d`.

```r title="Your turn: Cohen's d from summary stats"
# Try it: pooled-SD Cohen's d
ex_m1 <- 52.0; ex_s1 <- 15.0; ex_n1 <- 1200
ex_m2 <- 54.5; ex_s2 <- 15.5; ex_n2 <- 1200

ex_d <- (ex_m2 - ex_m1) /
  sqrt(((ex_n1 - 1) * ex_s1^2 + (ex_n2 - 1) * ___^2) /
       (ex_n1 + ex_n2 - 2))
round(ex_d, 3)
#> Expected: about 0.164
```

<details>
<summary>Click to reveal solution</summary>

```r title="Cohen's d solution"
ex_m1 <- 52.0; ex_s1 <- 15.0; ex_n1 <- 1200
ex_m2 <- 54.5; ex_s2 <- 15.5; ex_n2 <- 1200

ex_d <- (ex_m2 - ex_m1) /
  sqrt(((ex_n1 - 1) * ex_s1^2 + (ex_n2 - 1) * ex_s2^2) /
       (ex_n1 + ex_n2 - 2))
round(ex_d, 3)
#> [1] 0.164
```

**Explanation:** Cohen's d is the raw mean difference divided by the pooled standard deviation, a unit-free quantity you can compare across experiments regardless of metric. `d ≈ 0.16` is on the small side of Cohen's conventions, but small standardised effects on large revenue streams often carry large dollar impact.

</details>

## What goes wrong when you peek at p-values every day?

Here is the mistake that kills more A/B tests than any other: running the test, checking the p-value every day, and stopping the moment it drops below 0.05. This sounds harmless, it is not. Each extra look is another chance for random noise to cross the threshold, and the effective false-positive rate climbs fast.

The cleanest way to see this is a simulation. Under the null (both arms converging to the same rate), we run the same experiment many times, peek at it 5 times per run, and count how often *any* peek crossed $\alpha = 0.05$.

[TIP]
**Wrap `prop.test()` in `suppressWarnings()` inside simulation loops.** At low expected counts, prop.test prints chi-square approximation warnings that flood the console across 1,000 iterations without changing the p-values. `suppressWarnings()` keeps the output readable while you iterate on the design.

```r title="Simulate peeking inflation of Type I error"
set.seed(10820)

n_sims <- 1000
looks  <- c(400, 800, 1200, 1600, 2000)   # 5 peeks
p_rate <- 0.05                             # null is true

hits <- 0
for (i in seq_len(n_sims)) {
  xA <- cumsum(rbinom(max(looks), 1, p_rate))
  xB <- cumsum(rbinom(max(looks), 1, p_rate))
  crossed <- FALSE
  for (n in looks) {
    pv <- suppressWarnings(
      prop.test(c(xA[n], xB[n]), c(n, n), correct = FALSE)$p.value
    )
    if (!is.nan(pv) && pv < 0.05) { crossed <- TRUE; break }
  }
  if (crossed) hits <- hits + 1
}

peek_alpha <- hits / n_sims
round(peek_alpha, 3)
#> [1] 0.14
```

Under the null, 5 peeks turn a nominal 5% false-positive rate into roughly **14%**. Almost one in every seven "wins" declared by a peeking analyst is pure noise. The effect is even worse with 10 or more peeks, where the inflated alpha climbs above 20%. The fix is to decide look-spacing and rejection thresholds in advance (e.g., Pocock or O'Brien-Fleming boundaries, or a simple Bonferroni correction) and pay the price once, in planning.

[KEY INSIGHT]
**A single look at α = 0.05 is 5%. Five looks is not 25%, but it is nowhere near 5% either.** The exact inflated rate depends on look spacing and correlation structure, but every peeking design breaks the false-positive guarantee you meant to give. Either run to the planned n and analyse once, or adopt a correction that budgets alpha across looks.

**Try it:** Re-run the simulation with only **2 peeks** at n = 1000 and n = 2000. Save the result to `ex_alpha`. You should see inflation is much milder, closer to 7%.

```r title="Your turn: 2-peek inflation"
# Try it: reduce to 2 peeks
set.seed(10820)
ex_looks <- c(1000, 2000)
ex_hits  <- 0
for (i in seq_len(1000)) {
  xA <- cumsum(rbinom(max(ex_looks), 1, 0.05))
  xB <- cumsum(rbinom(max(ex_looks), 1, 0.05))
  crossed <- FALSE
  for (n in ex_looks) {
    pv <- suppressWarnings(
      prop.test(c(xA[n], xB[n]), c(n, n), correct = FALSE)$p.value
    )
    if (!is.nan(pv) && pv < 0.05) { crossed <- TRUE; break }
  }
  if (crossed) ex_hits <- ex_hits + ___   # how much to add?
}
ex_alpha <- ex_hits / 1000
round(ex_alpha, 3)
#> Expected: around 0.07
```

<details>
<summary>Click to reveal solution</summary>

```r title="2-peek solution"
set.seed(10820)
ex_looks <- c(1000, 2000)
ex_hits  <- 0
for (i in seq_len(1000)) {
  xA <- cumsum(rbinom(max(ex_looks), 1, 0.05))
  xB <- cumsum(rbinom(max(ex_looks), 1, 0.05))
  crossed <- FALSE
  for (n in ex_looks) {
    pv <- suppressWarnings(
      prop.test(c(xA[n], xB[n]), c(n, n), correct = FALSE)$p.value
    )
    if (!is.nan(pv) && pv < 0.05) { crossed <- TRUE; break }
  }
  if (crossed) ex_hits <- ex_hits + 1
}
ex_alpha <- ex_hits / 1000
round(ex_alpha, 3)
#> [1] 0.072
```

**Explanation:** Two peeks inflate α from the nominal 5% to about 7%, and 5 peeks inflated it to 14%. The inflation does not scale linearly because consecutive look p-values are correlated (they share most of the data), but it still climbs with every extra look.

</details>

## Practice Exercises

Eight capstone problems, graded from basic analyses to harder inverse and simulation problems. Each exercise uses a distinct `ex1_` to `ex8_` prefix so solution variables do not clobber earlier state.

### Exercise 1: Run a two-proportion A/B test

Your final A/B counts are **220 conversions out of 5,000** in treatment and **180 out of 5,000** in control. Run a two-proportion test with no continuity correction, then extract the lift, 95% CI, and p-value. Save the full test object to `ex1_res`.

```r title="Exercise 1 starter: prop.test on 5000 per arm"
# Exercise 1: 220/5000 vs 180/5000
# Hint: success = c(220, 180), trials = c(5000, 5000), prop.test(success, trials, correct = FALSE)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
ex1_res <- prop.test(c(220, 180), c(5000, 5000), correct = FALSE)
ex1_res$estimate
#> prop 1 prop 2
#>  0.044  0.036
ex1_res$conf.int
#> [1] 0.0001237547 0.0158762453
#> attr(,"conf.level")
#> [1] 0.95
ex1_res$p.value
#> [1] 0.04558404
```

**Explanation:** Lift is 4.4% vs 3.6%, a **0.8 percentage-point** improvement. The 95% CI is (0.01pp, 1.59pp), just barely excludes zero, and the p-value 0.046 just barely clears 0.05. This is the canonical *borderline* A/B result: report it honestly, do not oversell it. If the business cost of a false positive is high, most practitioners would replicate before shipping.

</details>

### Exercise 2: Sample size for a CTR uplift

Your baseline email click-through rate is **10%**. You want to detect a lift to **12%** with 80% power at $\alpha = 0.05$, two-sided. Using `pwr.2p.test()` and `ES.h()`, compute the per-arm sample size and the total. Save the raw `n` to `ex2_n` and the ceilinged total to `ex2_total`.

```r title="Exercise 2 starter: pwr.2p.test for 10% to 12%"
# Exercise 2: baseline 10%, lift to 12%
# Step 1: ex2_h <- ES.h(p1 = 0.12, p2 = 0.10)
# Step 2: pwr.2p.test(h, sig.level, power)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
ex2_h <- ES.h(p1 = 0.12, p2 = 0.10)
ex2_n <- pwr.2p.test(h = ex2_h,
                     sig.level = 0.05,
                     power = 0.80,
                     alternative = "two.sided")$n
ex2_n
#> [1] 3840.73

ex2_total <- ceiling(ex2_n) * 2
ex2_total
#> [1] 7682
```

**Explanation:** You need **3,841 users per arm, 7,682 total** to detect a 2pp lift at this baseline. The same absolute lift at a baseline of 1% (e.g., 1% → 3%) would need only about 900 per arm, because $h$ scales with the *relative* distance on the arcsine scale, not the raw difference.

</details>

### Exercise 3: Compare pwr and base-R sample size

You are sizing a study with baseline 5%, target 6%, 80% power, α = 0.05, two-sided. Run both `power.prop.test()` (base R) and `pwr.2p.test()` (pwr package) on the same inputs and compute the difference. Save the two per-arm `n` values to `ex3_n_base` and `ex3_n_pwr`.

```r title="Exercise 3 starter: pwr vs base R"
# Exercise 3: same inputs, two functions
# Hint 1: power.prop.test(p1 = 0.05, p2 = 0.06, sig.level = 0.05, power = 0.80)
# Hint 2: ES.h(0.06, 0.05) then pwr.2p.test(h, sig.level, power)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
# Base R (no arcsine, different approximation)
ex3_base <- power.prop.test(p1 = 0.05,
                            p2 = 0.06,
                            sig.level = 0.05,
                            power = 0.80,
                            alternative = "two.sided")
ex3_n_base <- ceiling(ex3_base$n)
ex3_n_base
#> [1] 8836

# pwr package (Cohen's h, arcsine transform)
ex3_h    <- ES.h(p1 = 0.06, p2 = 0.05)
ex3_pwr  <- pwr.2p.test(h = ex3_h, sig.level = 0.05, power = 0.80)
ex3_n_pwr <- ceiling(ex3_pwr$n)
ex3_n_pwr
#> [1] 8193

ex3_n_base - ex3_n_pwr
#> [1] 643
```

**Explanation:** The two methods differ by about 8% (8,836 vs 8,193 per arm). `power.prop.test` works on the raw difference of proportions, `pwr.2p.test` works on the arcsine-transformed $h$. Neither is *wrong*, they are calibrated against different approximations. Pick one and use it consistently across your studies so the numbers are comparable.

</details>

### Exercise 4: Welch t-test on simulated revenue

Simulate two revenue arms with `set.seed(98214)` using log-normal distributions: `rev_A` with `meanlog = 3.0, sdlog = 0.5`, `rev_B` with `meanlog = 3.08, sdlog = 0.5`, 1,500 users each. Run a Welch t-test with `var.equal = FALSE` and save the full test object to `ex4_test`.

```r title="Exercise 4 starter: Welch t-test on revenue"
# Exercise 4: simulate then compare
# Hint: rlnorm(1500, meanlog = 3.0, sdlog = 0.5)
# Hint: t.test(rev_B, rev_A, var.equal = FALSE)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 4 solution"
set.seed(98214)
ex4_rev_A <- rlnorm(1500, meanlog = 3.0, sdlog = 0.5)
ex4_rev_B <- rlnorm(1500, meanlog = 3.08, sdlog = 0.5)

ex4_test <- t.test(ex4_rev_B, ex4_rev_A, var.equal = FALSE)
round(ex4_test$estimate, 2)
#> mean of x mean of y
#>     24.67     22.84
round(ex4_test$conf.int, 2)
#> [1] 0.79 2.86
#> attr(,"conf.level")
#> [1] 0.95
round(ex4_test$p.value, 5)
#> [1] 0.00051
```

**Explanation:** Treatment averaged \$24.67 vs \$22.84, a lift of \$1.83 with 95% CI (\$0.79, \$2.86). The CI excludes zero, the p-value is 0.0005, so the result is clearly significant. Report the dollar lift and its CI in the final write-up, the standardised Cohen's d is secondary for revenue where the unit ($) is already meaningful to stakeholders.

</details>

### Exercise 5: Cohen's d from summary stats

An offline aggregate is all you have: treatment `m2 = 88.2`, `s2 = 24.0`, `n2 = 900`; control `m1 = 85.0`, `s1 = 23.5`, `n1 = 900`. Compute pooled-SD Cohen's d. Save to `ex5_d`.

```r title="Exercise 5 starter: pooled-SD Cohen's d"
# Exercise 5: no raw data, just summary stats
# Hint: pooled SD formula = sqrt(((n1-1)*s1^2 + (n2-1)*s2^2) / (n1 + n2 - 2))

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 5 solution"
ex5_m1 <- 85.0; ex5_s1 <- 23.5; ex5_n1 <- 900
ex5_m2 <- 88.2; ex5_s2 <- 24.0; ex5_n2 <- 900

ex5_d <- (ex5_m2 - ex5_m1) /
  sqrt(((ex5_n1 - 1) * ex5_s1^2 + (ex5_n2 - 1) * ex5_s2^2) /
       (ex5_n1 + ex5_n2 - 2))
round(ex5_d, 3)
#> [1] 0.135
```

**Explanation:** `d ≈ 0.135`, a small effect by Cohen's conventions. A useful sanity check: with 900 users per arm, the t-statistic would be `d * sqrt(n/2) ≈ 0.135 * sqrt(450) ≈ 2.86`, corresponding to p ≈ 0.004. So yes, small standardised effects become highly significant at large n, which is why you should report the effect size *and* the p-value together.

</details>

### Exercise 6: Achieved power for a fixed n (inverse problem)

Finance says you cannot run more than **500 users per arm** for a landing-page test. The baseline is 5% conversion and you want to detect a lift to 6%. Using `pwr.2p.test()`, solve for power (leave it as `NULL`). Save the achieved power to `ex6_power`.

```r title="Exercise 6 starter: solve for power"
# Exercise 6: inverse problem, solve for power
# Hint: ES.h(0.06, 0.05) then pwr.2p.test(h = ..., n = 500, sig.level = 0.05)
# Leave power out (do not pass it)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 6 solution"
ex6_h <- ES.h(p1 = 0.06, p2 = 0.05)
ex6_res <- pwr.2p.test(h = ex6_h,
                       n = 500,
                       sig.level = 0.05,
                       alternative = "two.sided")
ex6_power <- ex6_res$power
round(ex6_power, 3)
#> [1] 0.098
```

**Explanation:** Power is **about 10%**, catastrophically below the 80% target. In plain English, this design would miss a real lift nine times out of ten. The honest recommendation is to redesign: either collect more data (Exercise 3 said ~8,200 per arm for 80%), pick a larger minimum detectable lift, or pick a more sensitive metric.

</details>

### Exercise 7: Inflate sample size for 25% dropout

Your pre-dropout plan calls for `n = 2,000 per arm`. You expect **25% of users** to drop out (close browser, never reach the conversion event) before the window closes. Compute the inflated recruitment target per arm. Save to `ex7_target`.

```r title="Exercise 7 starter: dropout inflation"
# Exercise 7: inflate for expected dropout
# Hint: target = ceiling(n_plan / (1 - dropout_rate))

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 7 solution"
ex7_n_plan <- 2000
ex7_dropout <- 0.25

ex7_target <- ceiling(ex7_n_plan / (1 - ex7_dropout))
ex7_target
#> [1] 2667
```

**Explanation:** You need to **route 2,667 users into each arm** to end the study with 2,000 analysable users per arm at 25% dropout. Never inflate by "1 + dropout" (which would give 2,500), always by `1 / (1 - dropout)`, because the retention fraction is the multiplier, not the loss fraction.

</details>

### Exercise 8: Peeking simulation with Bonferroni correction

Under the null (both arms at $p = 0.05$), peek at **4 equally spaced checkpoints** `c(500, 1000, 1500, 2000)` with `n_sims = 1000` and `set.seed(73190)`. Part A: count how often the *uncorrected* p-value crosses 0.05 at any peek. Part B: apply the **Bonferroni-corrected threshold** `0.05 / 4 = 0.0125` and count again. Save the two rates to `ex8_naive` and `ex8_bonf`.

```r title="Exercise 8 starter: peeking with Bonferroni"
# Exercise 8: compare uncorrected vs Bonferroni-corrected peeking
# Hint: loop over 1000 sims, for each sim loop over 4 look points
# Hint: threshold_naive = 0.05; threshold_bonf = 0.05 / 4

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 8 solution"
set.seed(73190)
n_sims <- 1000
ex8_looks <- c(500, 1000, 1500, 2000)

ex8_naive_hits <- 0
ex8_bonf_hits  <- 0

for (i in seq_len(n_sims)) {
  xA <- cumsum(rbinom(max(ex8_looks), 1, 0.05))
  xB <- cumsum(rbinom(max(ex8_looks), 1, 0.05))
  naive_crossed <- FALSE
  bonf_crossed  <- FALSE
  for (n in ex8_looks) {
    pv <- suppressWarnings(
      prop.test(c(xA[n], xB[n]), c(n, n), correct = FALSE)$p.value
    )
    if (!is.nan(pv)) {
      if (pv < 0.05)       naive_crossed <- TRUE
      if (pv < 0.05 / 4)   bonf_crossed  <- TRUE
    }
  }
  if (naive_crossed) ex8_naive_hits <- ex8_naive_hits + 1
  if (bonf_crossed)  ex8_bonf_hits  <- ex8_bonf_hits  + 1
}

ex8_naive <- ex8_naive_hits / n_sims
ex8_bonf  <- ex8_bonf_hits  / n_sims
round(c(naive = ex8_naive, bonferroni = ex8_bonf), 3)
#>      naive bonferroni
#>      0.125      0.040
```

**Explanation:** With 4 uncorrected peeks, the effective false-positive rate inflates from the nominal 5% to **12.5%**. Applying a Bonferroni correction (dividing α by the number of looks) pulls it back to **4%**, safely at or below the advertised 5%. Bonferroni is conservative (in exchange for simplicity, you lose a bit of power), but it is a reliable first line of defence when you cannot avoid multiple looks.

</details>

## Complete Example: Plan and Prepare to Analyse an A/B Test in 12 Lines

You are the analyst on a signup-button experiment. Baseline is 8% signup, Product wants to detect a lift to 9%. Target: 80% power at α = 0.05, two-sided, with 15% expected dropout before the signup window closes. Here is the end-to-end calculation plus the analysis call you will run once the data arrives.

```r title="End-to-end A/B plan and analysis template"
# Step 1: effect size for the minimum interesting lift
design_h <- ES.h(p1 = 0.09, p2 = 0.08)
round(design_h, 4)
#> [1] 0.0352

# Step 2: per-arm sample size before dropout
design_res <- pwr.2p.test(h = design_h,
                          sig.level = 0.05,
                          power = 0.80,
                          alternative = "two.sided")
design_n <- ceiling(design_res$n)
design_n
#> [1] 12528

# Step 3: inflate for 15% dropout
design_inflated <- ceiling(design_n / (1 - 0.15))
design_inflated
#> [1] 14740

# Step 4: total recruitment across both arms
design_total <- design_inflated * 2
design_total
#> [1] 29480

# Step 5: template for the eventual single analysis
# (once data arrives, plug in the real success counts)
# prop.test(c(success_B, success_A), c(n_B, n_A), correct = FALSE)
```

You need to route about **29,480 users** into the test to reliably detect a 1-percentage-point lift at this baseline. The three numbers to send Product: the minimum lift assumed (1pp), the per-arm inflated target (14,740), and the total (29,480). If they push back ("can we do it with 10,000?"), run the Exercise 6 inverse: hold `n` fixed and report the achieved power, so the tradeoff is explicit.

## Summary

The 8 exercises plus the capstone, side-by-side:

| # | Problem | Function | Solve for | Answer |
|---|---|---|---|---|
| 1 | 220/5000 vs 180/5000 | `prop.test` | lift, CI, p | 0.8pp, CI (0.01, 1.59)pp, p = 0.046 |
| 2 | 10% → 12% CTR sample size | `pwr.2p.test` | n per arm | 3,841 per arm (7,682 total) |
| 3 | 5% → 6% pwr vs base R | both | n comparison | 8,193 (pwr) vs 8,836 (base) |
| 4 | Revenue lift via Welch t | `t.test` | CI, p | +\$1.83, CI (0.79, 2.86), p = 0.0005 |
| 5 | Cohen's d from summary stats | formula | d | 0.135 |
| 6 | n = 500, 5% → 6%, solve power | `pwr.2p.test` | **power** | 0.098 |
| 7 | n = 2,000 with 25% dropout | ceiling | inflated n | 2,667 per arm |
| 8 | 4 peeks, naive vs Bonferroni | simulation | α | 0.125 vs 0.040 |
| E | 8% → 9% end-to-end, 15% dropout | full pipeline | total users | 29,480 |

Four rules carry through every A/B exercise:

- **`ceiling()`, never `round()`.** Per-arm n always rounds up, because 3,840.73 users still means you need 3,841.
- **n is per arm, not total.** Multiply by the number of arms before reporting recruitment targets.
- **Inflate for dropout.** Divide by the *retention* rate `(1 - dropout)`, not multiply by `(1 + dropout)`.
- **One analysis call at the end.** Peeking inflates α; either run to the planned n or budget α across looks with Bonferroni or a sequential boundary.

## References

1. Champely, S. (2020). *pwr: Basic Functions for Power Analysis*. CRAN. [Link](https://cran.r-project.org/package=pwr)
2. pwr package vignette. [Link](https://cran.r-project.org/web/packages/pwr/vignettes/pwr-vignette.html)
3. Cohen, J. (1988). *Statistical Power Analysis for the Behavioral Sciences*, 2nd ed. Routledge.
4. Kohavi, R., Tang, D., Xu, Y. (2020). *Trustworthy Online Controlled Experiments: A Practical Guide to A/B Testing*. Cambridge University Press.
5. Miller, E. *How Not to Run an A/B Test*. [Link](https://www.evanmiller.org/how-not-to-run-an-ab-test.html)
6. Johari, R., Pekelis, L., Walsh, D. J. (2022). Always valid inference: Continuous monitoring of A/B tests. *Operations Research*. [Link](https://arxiv.org/abs/1512.04922)
7. R Core Team. `prop.test` documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/prop.test.html)
8. R Core Team. `power.prop.test` documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/power.prop.test.html)

## Continue Learning

- [A/B Testing in R](AB-Testing-in-R.html) – the theory companion for these exercises, covering the plan, analyse, and stop pillars with full runnable walk-throughs.
- [Power Analysis Exercises in R](Power-Analysis-Exercises-in-R.html) – 8 broader power problems spanning t-tests, ANOVA, correlation, proportions, and regression.
- [Hypothesis Testing Exercises in R](Hypothesis-Testing-Exercises-in-R.html) – drill the underlying hypothesis-testing logic that A/B tests specialise.
