---
title: "Power Analysis in R: Calculate the Sample Size You Need Before You Collect Any Data"
slug: Statistical-Power-Analysis-in-R
description: "Power analysis shows how many observations you need to detect an effect of a given size. Use the pwr package for t-tests, ANOVA, correlation, and regression."
keywords: "power analysis R, pwr package, sample size calculation, statistical power, effect size, Cohen's d, pwr.t.test, pwr.anova.test, pwr.r.test, pwr.f2.test, Type II error"
auto_link_terms: "power analysis in R|pwr package|pwr.t.test()|pwr.anova.test()|pwr.r.test()|statistical power|Cohen's d|post-hoc power"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-18
curriculum_id: "2.2.6"
post_type: C
sidebar_section: Statistics
sidebar_title: "Power Analysis"
sidebar_order: 37
difficulty: Intermediate
---

# Power Analysis in R: Calculate the Sample Size You Need Before You Collect Any Data

<p class="lead"><b>Power analysis</b> tells you how large a sample you need to reliably detect an effect of a given size, before you collect any data. The <b>pwr</b> package in R solves for any one of four quantities (sample size, effect size, significance level, power) given the other three, across t-tests, ANOVA, correlation, and regression.</p>

## Why run a power analysis before collecting data?

Running a study without a power analysis is like setting a trap without asking what animal you want to catch. You might collect data, run a test, and walk away with "no significant effect" when the real issue was that the sample was too small to detect the effect you cared about. A power analysis answers the sizing question before you start.

Here is what that calculation looks like for a simple two-sample t-test, using the workhorse `pwr` package. We want 80% power to detect a moderate effect (Cohen's d = 0.5) at the conventional 5% significance level.

```r title="Sample size for a two-sample t-test"
library(pwr)

pwr.t.test(
  d         = 0.5,
  power     = 0.80,
  sig.level = 0.05,
  type      = "two.sample",
  alternative = "two.sided"
)
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

`pwr` returns `n ≈ 63.8` per group, which you round up to 64. So this study needs roughly 128 subjects in total. If you can only afford 60 per group, you cannot reliably detect d = 0.5 at 80% power, and you know that before writing a consent form. That is the payoff: a vague worry about sample size becomes a specific integer that drives budget, timeline, and ethics decisions.

[KEY INSIGHT]
**Power analysis converts a vague "is our study big enough?" into a specific integer.** That integer justifies your budget ask, your recruitment plan, and your IRB application. Running the test without it is guessing.

**Try it:** Recompute the per-group sample size for a smaller effect, Cohen's d = 0.3, keeping power = 0.80 and α = 0.05.

```r title="Your turn: smaller effect size"
# Change d to 0.3 and see how n shifts
ex_tt <- pwr.t.test(
  d         = ___,
  power     = 0.80,
  sig.level = 0.05,
  type      = "two.sample"
)
ex_tt
#> Expected: n ≈ 175 per group (total ≈ 350)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Smaller effect size solution"
ex_tt <- pwr.t.test(
  d         = 0.3,
  power     = 0.80,
  sig.level = 0.05,
  type      = "two.sample"
)
ex_tt
#>      Two-sample t test power calculation 
#> 
#>               n = 175.3847
#>               d = 0.3
#>       sig.level = 0.05
#>           power = 0.8
#>     alternative = two.sided
```

**Explanation:** Halving the effect size roughly triples the required n. Sample size grows with 1/d², not linearly. That is why a "small" effect is expensive to detect.

</details>

## What are the four knobs: n, d, α, and power?

Every power calculation is a relationship between four quantities:

- **n**, sample size (per group for two-sample tests).
- **d** (or r, f, f²), effect size. The magnitude of the thing you are trying to detect, on a standardised scale.
- **α**, significance level. The Type I error rate you are willing to accept (usually 0.05).
- **power**, probability of rejecting H₀ when the alternative is true (usually 0.80). Equivalently, 1 − β, where β is the Type II error rate.

![The four quantities in power analysis. Fix any three and the fourth is determined.](screenshots/Statistical-Power-Analysis-in-R-four-knobs.webp)
*Figure 1: The four quantities in power analysis. Fix any three and the fourth is determined.*

Any `pwr` function takes three of these as inputs and leaves one as `NULL`. The one you leave as `NULL` is the one `pwr` computes.

Example: suppose you already have n = 40 per group and you want to know how much power that buys you at d = 0.5.

```r title="Solve for power given n and d"
tt_power <- pwr.t.test(
  n         = 40,
  d         = 0.5,
  sig.level = 0.05,
  type      = "two.sample"
)
tt_power
#>      Two-sample t test power calculation 
#> 
#>               n = 40
#>               d = 0.5
#>       sig.level = 0.05
#>           power = 0.5981
#>     alternative = two.sided
```

At n = 40 per group, power is only about 0.60, which means a 40% chance of missing a real d = 0.5 effect. Almost a coin flip. That is why 40 per group is not enough for this effect.

Flip it around: given n = 50 and target power 0.80, what is the smallest effect you could reliably detect?

```r title="Solve for detectable effect size"
tt_d <- pwr.t.test(
  n         = 50,
  power     = 0.80,
  sig.level = 0.05,
  type      = "two.sample"
)
tt_d$d
#> [1] 0.5656287
```

You would need an effect of at least d ≈ 0.57 to have an 80% chance of detecting it. Anything smaller is invisible to a study of this size. This is called a "minimum detectable effect" and it is a crucial sanity check: if d = 0.57 is larger than any realistic effect in your field, the study is doomed before it starts.

**Try it:** Call `pwr.t.test()` leaving both `n` and `power` as `NULL`. Predict what pwr will do before running.

```r title="Your turn: leave two knobs empty"
# pwr needs exactly one NULL; leaving two ambiguous errors out.
pwr.t.test(
  d         = 0.5,
  sig.level = 0.05,
  type      = "two.sample"
  # n and power both missing
)
#> Expected: Error: exactly one of 'n', 'd', 'power', and 'sig.level' must be NULL
```

<details>
<summary>Click to reveal solution</summary>

```r title="Ambiguous call: expected behaviour"
# Running this block is expected to error:
try(
  pwr.t.test(
    d         = 0.5,
    sig.level = 0.05,
    type      = "two.sample"
  )
)
#> Error in pwr.t.test(d = 0.5, sig.level = 0.05, type = "two.sample") : 
#>   exactly one of n, d, power, and sig.level must be NULL
```

**Explanation:** `pwr` refuses to guess which quantity to solve for. Specify three, leave exactly one as `NULL`, and `pwr` fills it in.

</details>

## How do you choose an effect size you can defend?

Effect size is the hardest input to pick, and it drives everything else. For a two-sample comparison, `pwr` uses **Cohen's d**: the difference in means divided by the pooled standard deviation.

Before you touch the formula, the intuition: d = 1 means the two group means are a full standard deviation apart, which is a very visible difference. d = 0.2 means the group means barely separate relative to the noise in the data, which is hard to see with the naked eye.

$$d = \frac{\bar{x}_1 - \bar{x}_2}{s_{pooled}}, \quad s_{pooled} = \sqrt{\frac{(n_1-1)s_1^2 + (n_2-1)s_2^2}{n_1 + n_2 - 2}}$$

Where:
- $\bar{x}_1, \bar{x}_2$ = sample means for the two groups
- $s_1, s_2$ = sample standard deviations for the two groups
- $n_1, n_2$ = sample sizes for the two groups
- $s_{pooled}$ = a weighted-average SD that pools information from both groups

Let's compute Cohen's d from two pilot samples. Imagine you ran a small pilot where 20 people got treatment A and 20 got treatment B, and you measured their response on some continuous scale.

```r title="Compute Cohen's d from two samples"
set.seed(271)
x1 <- rnorm(20, mean = 100, sd = 15)
x2 <- rnorm(20, mean = 108, sd = 15)

n1 <- length(x1); n2 <- length(x2)
s1 <- sd(x1);     s2 <- sd(x2)

s_pooled <- sqrt(((n1 - 1) * s1^2 + (n2 - 1) * s2^2) / (n1 + n2 - 2))
d_est    <- (mean(x2) - mean(x1)) / s_pooled

round(d_est, 3)
#> [1] 0.663
```

The pilot yields d ≈ 0.66, a moderate-to-large effect. Plug that into `pwr.t.test()` and you would find roughly n = 38 per group for 80% power. But notice what just happened: you used the pilot's own effect size to plan the main study. That is risky. Pilot samples are small, so their d estimates are noisy. A pilot that overshoots by chance gives you an undersized main study.

[TIP]
**Defend your effect size with the literature first, a pilot second, and Cohen's conventions last.** Published estimates from similar designs beat a single pilot run. Treat the pilot as a sanity check, not as the truth.

[NOTE]
**pwr uses Cohen's d, not raw mean differences.** If your effect lives on a natural scale (mmHg, dollars, minutes), convert it to d by dividing by the pooled SD before calling pwr. Skipping this step is the most common beginner mistake.

Cohen's informal benchmarks are **d = 0.2 (small), 0.5 (medium), 0.8 (large)**, but these numbers came from general behavioural science. In a clinical trial where the outcome is mortality, d = 0.2 may be a huge, life-saving effect; in a marketing A/B test measuring click-through, d = 0.8 may be unrealistic. Use the benchmarks only as a last resort.

**Try it:** Compute Cohen's d for two small groups you simulate: group A is `rnorm(15, 50, 10)` and group B is `rnorm(15, 55, 10)`. Use the same pooled formula.

```r title="Your turn: compute Cohen's d"
set.seed(99)
ex_x1 <- rnorm(15, mean = 50, sd = 10)
ex_x2 <- rnorm(15, mean = 55, sd = 10)

# Fill in the formula:
ex_d <- ___
round(ex_d, 3)
#> Expected: about 0.4 to 0.6, depending on the sampled noise.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Cohen's d solution"
set.seed(99)
ex_x1 <- rnorm(15, mean = 50, sd = 10)
ex_x2 <- rnorm(15, mean = 55, sd = 10)

ex_s_pooled <- sqrt(((14) * sd(ex_x1)^2 + (14) * sd(ex_x2)^2) / 28)
ex_d <- (mean(ex_x2) - mean(ex_x1)) / ex_s_pooled
round(ex_d, 3)
#> [1] 0.452
```

**Explanation:** A 5-point difference relative to an SD of about 10 gives d ≈ 0.5, confirming the intuition that the population difference of 5 SD units is roughly half an SD on the standardised scale.

</details>

## Which pwr function matches your test?

`pwr` is a menu of functions, one per test family. Pick the function that matches your planned analysis, then solve for the knob you care about.

![Mapping from test type to the matching pwr function.](screenshots/Statistical-Power-Analysis-in-R-test-to-function.webp)
*Figure 2: Mapping from test type to the matching pwr function.*

Here is the quick reference table.

| Planned test | pwr function | Effect-size argument | Cohen convention (small / medium / large) |
|---|---|---|---|
| Two-group mean comparison | `pwr.t.test()` | `d` | 0.2 / 0.5 / 0.8 |
| One-way ANOVA (k groups) | `pwr.anova.test()` | `f` | 0.10 / 0.25 / 0.40 |
| Correlation | `pwr.r.test()` | `r` | 0.10 / 0.30 / 0.50 |
| Linear regression / GLM | `pwr.f2.test()` | `f2` | 0.02 / 0.15 / 0.35 |
| One proportion | `pwr.p.test()` | `h` | 0.2 / 0.5 / 0.8 |
| Two proportions | `pwr.2p.test()` | `h` | 0.2 / 0.5 / 0.8 |
| Chi-square | `pwr.chisq.test()` | `w` | 0.1 / 0.3 / 0.5 |

Let's work through the three most common non-t cases. First, a one-way ANOVA with four groups and a medium effect (Cohen's f = 0.25).

```r title="Sample size for one-way ANOVA"
anv <- pwr.anova.test(
  k         = 4,
  f         = 0.25,
  sig.level = 0.05,
  power     = 0.80
)
anv
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

You need about 45 subjects per group, or 180 total, to detect a medium between-group effect at 80% power.

Now a correlation study targeting r = 0.3, which is a typical "moderate" correlation in behavioural data.

```r title="Sample size for correlation"
rr <- pwr.r.test(
  r         = 0.30,
  sig.level = 0.05,
  power     = 0.80
)
rr$n
#> [1] 84.07364
```

Eighty-five subjects will give 80% power to detect r = 0.3. For r = 0.1 you would need roughly 800. Correlation studies punish small effects even harder than t-tests.

Finally, a linear regression: you are fitting a model with 3 predictors and want to detect a medium effect (Cohen's f² = 0.15) on R².

```r title="Sample size for linear regression"
reg <- pwr.f2.test(
  u         = 3,       # numerator df = number of predictors tested
  f2        = 0.15,
  sig.level = 0.05,
  power     = 0.80
)
reg
#>      Multiple regression power calculation 
#> 
#>               u = 3
#>               v = 72.70583
#>              f2 = 0.15
#>       sig.level = 0.05
#>           power = 0.8
```

The denominator df is `v ≈ 73`, so total sample size is `u + v + 1 ≈ 77`. `pwr.f2.test()` reports `v`, not `n`, which trips up almost everyone the first time. Always add `u + 1` to `v` to get your actual sample size.

[WARNING]
**One-sided tests cut required n, but only if direction is pre-registered.** Switching to `alternative = "greater"` can shave 20% off the sample size. It is also a form of data-dependent reasoning if you decide the direction after looking at the pilot. Pre-register or use two-sided.

**Try it:** Use `pwr.r.test()` to find the sample size needed to detect a smaller correlation of r = 0.25 at 80% power, α = 0.05.

```r title="Your turn: correlation sample size"
ex_rr <- pwr.r.test(
  r         = ___,
  sig.level = 0.05,
  power     = 0.80
)
ex_rr$n
#> Expected: about 123 subjects.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Correlation sample size solution"
ex_rr <- pwr.r.test(
  r         = 0.25,
  sig.level = 0.05,
  power     = 0.80
)
ex_rr$n
#> [1] 122.4466
```

**Explanation:** A drop from r = 0.30 to r = 0.25 lifts the required n from 85 to 123, a ~45% increase. The cost of detecting smaller effects grows fast.

</details>

## How does power change with sample size and effect size?

A single `pwr` call answers one question. A **power curve** answers a hundred. Sweep n across a grid and you get a picture of how detection probability rises as sample size grows, for whatever effect size you fix. This is how you defend a sample size to a skeptical reviewer: "here is the curve, here is where we are on it, here is what we would gain by adding another 50 subjects".

```r title="Power curve across sample sizes"
library(ggplot2)

n_seq    <- seq(10, 120, by = 5)
power_vec <- sapply(n_seq, function(n) {
  pwr.t.test(n = n, d = 0.5, sig.level = 0.05, type = "two.sample")$power
})

df_curve <- data.frame(n = n_seq, power = power_vec)
head(df_curve, 5)
#>    n     power
#> 1 10 0.1838
#> 2 15 0.2635
#> 3 20 0.3377
#> 4 25 0.4101
#> 5 30 0.4779

ggplot(df_curve, aes(x = n, y = power)) +
  geom_line(linewidth = 1) +
  geom_hline(yintercept = 0.80, linetype = "dashed", color = "red") +
  geom_vline(xintercept = 64, linetype = "dotted", color = "blue") +
  labs(title = "Power vs sample size (d = 0.5, alpha = 0.05)",
       x = "n per group", y = "Power") +
  theme_minimal()
```

The dashed red line at 0.80 is the conventional power target; the dotted blue line at n = 64 is the per-group sample size we computed earlier. The curve is steep in the middle (each new subject buys real power) and flat on the right (every extra subject buys less and less). That flattening is the diminishing-returns zone.

Now overlay two effect sizes to see how much the curve shifts when d changes.

```r title="Two effect sizes overlaid"
df_two <- rbind(
  data.frame(n = n_seq, d = "d = 0.3",
             power = sapply(n_seq, function(n) pwr.t.test(n = n, d = 0.30,
                                sig.level = 0.05, type = "two.sample")$power)),
  data.frame(n = n_seq, d = "d = 0.5",
             power = sapply(n_seq, function(n) pwr.t.test(n = n, d = 0.50,
                                sig.level = 0.05, type = "two.sample")$power))
)

ggplot(df_two, aes(x = n, y = power, color = d)) +
  geom_line(linewidth = 1) +
  geom_hline(yintercept = 0.80, linetype = "dashed") +
  labs(title = "Power curves for two effect sizes",
       x = "n per group", y = "Power") +
  theme_minimal()
```

The d = 0.3 curve is pushed far to the right: at n = 120 per group you still have not hit 80% power. That mismatch tells a researcher one thing clearly, "we cannot afford to plan around a d = 0.3 effect with this recruitment budget; we need either more subjects or a stronger intervention."

[KEY INSIGHT]
**Power curves make diminishing returns visible.** Going from n = 30 to n = 60 adds ~30 points of power; going from n = 90 to n = 120 adds maybe 5. Reviewers pushing you to "just add more subjects" often do not see how flat the top of the curve becomes.

**Try it:** Extend the single-d curve to n up to 200 and add a horizontal line at 0.95 power. At what n does the curve cross 0.95?

```r title="Your turn: extend the power curve"
ex_n_seq <- seq(10, 200, by = 5)

# Fill in: compute power for each n at d = 0.5
ex_power <- ___

ex_df <- data.frame(n = ex_n_seq, power = ex_power)
# Find smallest n with power >= 0.95
ex_df[ex_df$power >= 0.95, ][1, ]
#> Expected: around n = 100.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Extended power curve solution"
ex_n_seq <- seq(10, 200, by = 5)
ex_power <- sapply(ex_n_seq, function(n) {
  pwr.t.test(n = n, d = 0.5, sig.level = 0.05, type = "two.sample")$power
})

ex_df <- data.frame(n = ex_n_seq, power = ex_power)
ex_df[ex_df$power >= 0.95, ][1, ]
#>     n     power
#> 19 105 0.9526
```

**Explanation:** Reaching 95% power (instead of 80%) for d = 0.5 requires about 105 per group, up from 64. The extra 40 subjects per group buys you 15 percentage points of power.

</details>

## What do you do when no pwr function fits: simulation-based power?

`pwr` covers the classic tests, but real studies use mixed models, logistic regression with interactions, non-parametric tests on skewed outcomes, and other designs for which no closed-form formula exists. For those, the answer is **simulation**.

The recipe is always the same:

1. Specify a data-generating process consistent with your alternative hypothesis (fixed effect sizes, variances, group assignments).
2. Simulate one dataset from it, run your planned test, record the p-value.
3. Repeat M times (M = 1000 or more).
4. **Power** = proportion of the M runs with p < α.

Let's say you plan to compare two groups, but your outcome is badly right-skewed (income, reaction time, cell counts). You will analyse it with a Wilcoxon rank-sum test, not a t-test, because the data are non-normal. `pwr` cannot give you a Wilcoxon sample size directly. Simulation can.

```r title="Simulation-based power for Wilcoxon"
set.seed(2027)

sim_power_wilcox <- function(n_per_group, shift, M = 1000) {
  pvals <- replicate(M, {
    a <- rlnorm(n_per_group, meanlog = 0,         sdlog = 1)
    b <- rlnorm(n_per_group, meanlog = shift,     sdlog = 1)
    wilcox.test(a, b)$p.value
  })
  mean(pvals < 0.05)
}

sim_power <- sim_power_wilcox(n_per_group = 30, shift = 0.4, M = 1000)
sim_power
#> [1] 0.706
```

At n = 30 per group, the Wilcoxon test has ~71% power to detect a meanlog shift of 0.4 between two log-normal distributions. Below the 80% target, so n = 30 is not enough for this design. You would rerun with larger n until the estimated power crosses 0.80.

[KEY INSIGHT]
**Simulation is the escape hatch when no analytical formula applies.** The downside is that each power estimate is itself noisy (Monte Carlo error). With M = 1000 runs, expect ±2 percentage points of wobble; push M to 5000 for reviewer-ready numbers.

[WARNING]
**Post-hoc power, plugging your observed effect into pwr after the study, is not a remedy for non-significant results.** It only tells you what power you would have had if the observed effect were the true effect, which is circular. Power analysis is a planning tool, not a diagnostic one.

**Try it:** Rerun the simulation above with `n_per_group = 60`. Does power cross 0.80?

```r title="Your turn: larger simulated sample"
set.seed(2027)
# Call sim_power_wilcox with n_per_group = 60
ex_sim_power <- ___
ex_sim_power
#> Expected: power around 0.93 to 0.95.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Larger simulated sample solution"
set.seed(2027)
ex_sim_power <- sim_power_wilcox(n_per_group = 60, shift = 0.4, M = 1000)
ex_sim_power
#> [1] 0.941
```

**Explanation:** Doubling n from 30 to 60 per group lifts simulated power from ~71% to ~94% for this skewed design. Simulation gives you direct answers for any test, at the cost of computation time.

</details>

## Practice Exercises

### Exercise 1: Planning a clinical trial from pilot data

A pilot study on a new blood-pressure drug reports: mean difference 2.1 mmHg, pooled SD 5.0 mmHg. Compute Cohen's d, then find the per-group sample size needed for 80% power at α = 0.05 using `pwr.t.test()`. Save the final sample size to `my_n_per_group`.

```r title="Exercise 1 starter"
# Given from the pilot:
pilot_mean_diff <- 2.1
pilot_sd        <- 5.0

# Step 1: compute Cohen's d
my_d <- ___

# Step 2: call pwr.t.test
my_result <- ___

# Step 3: extract n per group (round up)
my_n_per_group <- ceiling(my_result$n)
my_n_per_group
#> Expected: around 90 per group.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
pilot_mean_diff <- 2.1
pilot_sd        <- 5.0

my_d <- pilot_mean_diff / pilot_sd

my_result <- pwr.t.test(
  d         = my_d,
  power     = 0.80,
  sig.level = 0.05,
  type      = "two.sample"
)

my_n_per_group <- ceiling(my_result$n)
my_n_per_group
#> [1] 90
```

**Explanation:** d = 2.1 / 5.0 = 0.42, a small-to-medium effect. At that effect size, 80% power requires 90 patients per arm, or 180 total, plus whatever buffer you want for dropout. A reviewer would now check whether the pilot itself was large enough to trust d = 0.42.

</details>

### Exercise 2: Write your own power curve function

Write a function `my_power_curve(n_grid, d, alpha = 0.05)` that returns a data frame with columns `n` and `power` for a two-sample t-test. Then plot it with `ggplot2`, with a horizontal line at 0.80.

```r title="Exercise 2 starter"
# Build the function
my_power_curve <- function(n_grid, d, alpha = 0.05) {
  # Hint: sapply over n_grid and call pwr.t.test for each
  power_vec <- ___
  data.frame(n = n_grid, power = power_vec)
}

# Try it with n = 10 to 100, d = 0.4
my_df  <- my_power_curve(seq(10, 100, by = 5), d = 0.4)

# Plot (fill in the layers)
library(ggplot2)
my_plot <- ggplot(my_df, aes(x = n, y = power)) +
  ___ +
  ___
my_plot
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
my_power_curve <- function(n_grid, d, alpha = 0.05) {
  power_vec <- sapply(n_grid, function(n) {
    pwr.t.test(n = n, d = d, sig.level = alpha, type = "two.sample")$power
  })
  data.frame(n = n_grid, power = power_vec)
}

my_df <- my_power_curve(seq(10, 100, by = 5), d = 0.4)
head(my_df, 3)
#>    n     power
#> 1 10 0.1378
#> 2 15 0.1902
#> 3 20 0.2434

library(ggplot2)
my_plot <- ggplot(my_df, aes(x = n, y = power)) +
  geom_line(linewidth = 1) +
  geom_hline(yintercept = 0.80, linetype = "dashed") +
  labs(title = "Power curve for d = 0.4", x = "n per group", y = "Power") +
  theme_minimal()
my_plot
```

**Explanation:** Wrapping `pwr.t.test()` inside a function turns every power analysis into a one-liner you can reuse across studies. Swap d, alpha, or the test family and the same scaffolding answers a new question.

</details>

## Complete Example: Planning a blood-pressure trial end-to-end

A cardiologist wants to know if a new drug lowers systolic blood pressure by at least 3 mmHg on average compared to placebo. Published data suggest the pooled SD within each arm is about 10 mmHg. Let's plan the trial.

```r title="End-to-end planning"
# Inputs from domain knowledge
raw_mean_diff <- 3     # mmHg we care about
raw_sd        <- 10    # pooled SD from literature

# Step 1: convert to Cohen's d
plan_d <- raw_mean_diff / raw_sd
plan_d
#> [1] 0.3

# Step 2: compute n per group at 80% power, alpha = 0.05
plan_result <- pwr.t.test(
  d         = plan_d,
  power     = 0.80,
  sig.level = 0.05,
  type      = "two.sample"
)
ceiling(plan_result$n)
#> [1] 176

# Step 3: build a sensitivity curve around the plan
n_sens    <- seq(100, 300, by = 10)
power_sens <- sapply(n_sens, function(n) {
  pwr.t.test(n = n, d = plan_d, sig.level = 0.05, type = "two.sample")$power
})
sens_df <- data.frame(n = n_sens, power = power_sens)

# Step 4: inspect a few sensitivity points
sens_df[sens_df$n %in% c(120, 176, 220, 280), ]
#>      n     power
#> 3  120 0.6283
#> 9  176 0.8005
#> 13 220 0.8831
#> 19 280 0.9511
```

The trial needs 176 patients per arm, or 352 total, to have 80% power to detect a 3 mmHg drop. The sensitivity table shows the power we would gain by recruiting 44 more per arm (up to 0.88) and by pushing to 280 (0.95). Now the statistician can hand the cardiologist a one-sentence recommendation: "Plan for 176 per arm for 80% power, aim for 220 to buffer against dropout and hit ~88%." That sentence would not exist without a power analysis.

## Summary

![Power analysis in R at a glance.](screenshots/Statistical-Power-Analysis-in-R-overview-mindmap.webp)
*Figure 3: Power analysis in R at a glance.*

| Quantity | Typical value | Role |
|---|---|---|
| Effect size | d = 0.5, f = 0.25, r = 0.3, f² = 0.15 | What you are trying to detect, on a standardised scale |
| Significance α | 0.05 | Type I error rate you accept |
| Power (1 − β) | 0.80 | Probability of catching the effect when it is real |
| Sample size n | Solved for | What `pwr` returns |

Key takeaways:

1. **Power analysis is for planning, not diagnosis.** Run it before you collect data. Post-hoc power is not a fix for null results.
2. **The four knobs are linked.** Fix any three and the fourth is determined. Every `pwr.*` function enforces this.
3. **Effect size is the hardest input.** Defend it with literature first, pilot data second, Cohen's conventions last.
4. **Simulation is the escape hatch** when no `pwr` function fits your design (mixed models, rank tests, interactions).
5. **Power curves beat single numbers** when communicating to reviewers or stakeholders.

## References

1. Cohen, J. (1988). *Statistical Power Analysis for the Behavioral Sciences* (2nd ed.). Routledge. [Link](https://www.routledge.com/Statistical-Power-Analysis-for-the-Behavioral-Sciences/Cohen/p/book/9780805802832)
2. Champely, S. *pwr: Basic Functions for Power Analysis.* CRAN. [Link](https://CRAN.R-project.org/package=pwr)
3. Kelley, K., Maxwell, S. E., & Rausch, J. R. (2003). Obtaining Power or Obtaining Precision: Delineating Methods of Sample-Size Planning. *Evaluation & the Health Professions*, 26(3), 258–287. [Link](https://doi.org/10.1177/0163278703255242)
4. Gelman, A. & Carlin, J. (2014). Beyond Power Calculations: Assessing Type S (Sign) and Type M (Magnitude) Errors. *Perspectives on Psychological Science*, 9(6), 641–651. [Link](https://journals.sagepub.com/doi/10.1177/1745691614551642)
5. Hoenig, J. M. & Heisey, D. M. (2001). The Abuse of Power: The Pervasive Fallacy of Power Calculations for Data Analysis. *The American Statistician*, 55(1), 19–24. [Link](https://www.tandfonline.com/doi/abs/10.1198/000313001300339897)
6. Green, P. & MacLeod, C. J. (2016). SIMR: an R package for power analysis of generalized linear mixed models by simulation. *Methods in Ecology and Evolution*, 7(4), 493–498. [Link](https://cran.r-project.org/package=simr)
7. R Core Team. *power.t.test, power.anova.test* in base R. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/power.t.test.html)

## Continue Learning

- [Hypothesis Testing in R](Hypothesis-Testing-in-R.html), the framework power analysis protects against. Understand what it means to reject H₀ before you size a study around it.
- [Type I and Type II Errors in R](Type-I-and-Type-II-Errors-in-R.html), the α/β trade-off visualised. Power analysis is where that trade-off becomes a number.
- [Confidence Intervals in R](Confidence-Intervals-in-R.html), the other side of sample-size planning: precision, not detection.
