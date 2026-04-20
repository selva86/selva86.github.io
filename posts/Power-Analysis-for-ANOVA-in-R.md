---
title: "Power Analysis for ANOVA in R: pwr.anova.test() & Simulation Study"
slug: Power-Analysis-for-ANOVA-in-R
description: "Power analysis for ANOVA in R: use pwr.anova.test() to find sample size, interpret Cohen's f effect size, and validate with a Monte Carlo simulation."
keywords: "power analysis ANOVA, pwr.anova.test, sample size ANOVA, Cohen's f, effect size ANOVA, Monte Carlo simulation, statistical power, a priori power analysis, simulation study, R power calculation"
auto_link_terms: "power analysis for ANOVA|pwr.anova.test()|Cohen's f|a priori power analysis|ANOVA sample size|simulation-based power analysis"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-20
curriculum_id: FR-anov-5
post_type: FR
fr_parent: One-Way-ANOVA-in-R.html
difficulty: Intermediate
---

# Power Analysis for ANOVA in R: pwr.anova.test() & Simulation Study

<p class="lead">Power analysis for ANOVA tells you the sample size needed to detect a real group-mean difference with a given probability. In R, <code>pwr.anova.test()</code> solves the math, and a Monte Carlo simulation validates it against your actual design assumptions.</p>

## Why does ANOVA need a power analysis before you collect data?

When you run a one-way ANOVA with too few observations per group, a genuine mean difference can stay buried under sampling noise. The F-test then fails to reject a null that is actually false, and you walk away with a non-result that isn't really a non-result. Power is the probability of catching the real effect when it exists. Fixing a low-power design before the study is a calculation. Fixing it after is a rerun with fresh participants and fresh funding.

Let's put a number on it. Suppose you plan three groups with 15 subjects each and expect a medium-sized difference. How often would that design actually detect the effect?

```r title="Power for 15 per group across effect sizes"
library(pwr)

power_small  <- pwr.anova.test(k = 3, n = 15, f = 0.10, sig.level = 0.05)$power
power_medium <- pwr.anova.test(k = 3, n = 15, f = 0.25, sig.level = 0.05)$power
power_large  <- pwr.anova.test(k = 3, n = 15, f = 0.40, sig.level = 0.05)$power

round(c(small = power_small, medium = power_medium, large = power_large), 3)
#>  small medium  large
#>  0.065  0.245  0.576
```

The numbers are sobering. With 15 per group you have roughly a 24.5% chance of flagging a medium effect and only a 6.5% chance of flagging a small one. A large effect still only hits 57.6%. That tells you this design is underpowered for anything but a very obvious difference, and publishing a null from it says almost nothing about whether the effect is real.

[KEY INSIGHT]
**Power is the probability a real effect survives the noise.** A non-significant result from a low-power study is ambiguous by construction: it cannot distinguish "no effect" from "effect was there but the study was too small to see it."

**Try it:** Recompute power for the same design (k=3, n=15, alpha=0.05) but bump the effect size to f=0.50 (very large). Assign the result to `ex_power_vlarge` and round to 3 digits.

```r title="Your turn: power at f=0.50"
# Try it: compute power with f = 0.50
ex_power_vlarge <- # your code here

round(ex_power_vlarge, 3)
#> Expected: roughly 0.77
```

<details>
<summary>Click to reveal solution</summary>

```r title="Power at f=0.50 solution"
ex_power_vlarge <- pwr.anova.test(k = 3, n = 15, f = 0.50, sig.level = 0.05)$power
round(ex_power_vlarge, 3)
#> [1] 0.775
```

**Explanation:** `pwr.anova.test()` returns a list; the `$power` slot extracts the computed power value. Even at a very large effect, n=15 still misses roughly one in four true effects.

</details>

## How do you find the required sample size with pwr.anova.test()?

Turn the question around. Instead of asking "what power do I get from 15 subjects", ask "how many subjects do I need for 80% power". The function signature is the same, but this time you omit `n` and supply `power`. Whatever argument you leave out is the one R solves for.

```r title="Required n per group for medium effect and 80% power"
pwr.anova.test(k = 3, f = 0.25, sig.level = 0.05, power = 0.80)
#>      Balanced one-way analysis of variance power calculation
#>
#>               k = 3
#>               n = 52.3966
#>               f = 0.25
#>       sig.level = 0.05
#>           power = 0.8
#>
#> NOTE: n is number in each group
```

You need about 53 subjects per group, so 159 total across three groups. The 52.40 number is the exact mathematical threshold; round up, never down, because rounding down pushes power below your target. The function prints all five values and marks the one it solved for, which is a convenient double-check.

Next, let's see how this required n behaves across effect sizes. Power scales steeply with f, so small shifts in your assumed effect produce big shifts in sample size.

```r title="Required n per group across effect sizes"
library(dplyr)

effect_sizes <- c(small = 0.10, medium = 0.25, large = 0.40)

n_by_effect <- sapply(effect_sizes, function(f) {
  pwr.anova.test(k = 3, f = f, sig.level = 0.05, power = 0.80)$n
})

tibble(effect = names(n_by_effect),
       f = effect_sizes,
       n_per_group = ceiling(n_by_effect),
       total_N = ceiling(n_by_effect) * 3)
#> # A tibble: 3 × 4
#>   effect     f n_per_group total_N
#>   <chr>  <dbl>       <dbl>   <dbl>
#> 1 small   0.1          323     969
#> 2 medium  0.25          53     159
#> 3 large   0.4           22      66
```

The cost curve is brutal. A small effect demands roughly 15x more subjects than a large one to hit the same 80% power target. That's why over-optimistic effect sizes are the most common source of underpowered studies: a researcher guesses "medium" when the literature supports "small", collects 50 per group, and wastes the study.

![The five ingredients of a power analysis](screenshots/Power-Analysis-for-ANOVA-in-R-five-ingredients.webp)
*Figure 1: The five ingredients of a power analysis. Supply four, and `pwr.anova.test()` solves for the fifth.*

[TIP]
**Always plan per-group n, not total N.** `pwr.anova.test()` assumes a balanced design, so the returned `n` is per group. Budgeting a total N and then dividing by k is fine only if you can actually recruit evenly; otherwise use a simulation (covered below).

**Try it:** Find the required per-group sample size for a 4-group study with f=0.30 at 90% power and alpha=0.05. Assign to `ex_n_4groups`.

```r title="Your turn: n for 4 groups, 90% power"
# Try it: compute required n
ex_n_4groups <- # your code here

ceiling(ex_n_4groups)
#> Expected: about 44
```

<details>
<summary>Click to reveal solution</summary>

```r title="n for 4 groups solution"
ex_n_4groups <- pwr.anova.test(k = 4, f = 0.30, sig.level = 0.05, power = 0.90)$n
ceiling(ex_n_4groups)
#> [1] 44
```

**Explanation:** More groups mean more comparisons and a stricter critical F, so each group still needs a respectable n even for a moderate effect.

</details>

## What is Cohen's f and how should you pick a realistic value?

Cohen's f is the effect size metric `pwr.anova.test()` expects. Intuitively, it measures how spread out the group means are relative to the within-group noise. Groups that sit far apart on the scale of individual variation produce large f; groups that sit almost on top of each other produce small f.

The formal definition is the ratio of between-group standard deviation to within-group standard deviation:

$$f = \frac{\sigma_{\text{between}}}{\sigma_{\text{within}}}$$

Where:

- $\sigma_{\text{between}}$ = the standard deviation of the true group means around the grand mean
- $\sigma_{\text{within}}$ = the standard deviation of individual observations within each group (assumed equal across groups)

If you happen to have an expected $R^2$ (proportion of variance explained by group membership) from a similar study, the equivalent formula is:

$$f = \sqrt{\frac{R^2}{1 - R^2}}$$

Cohen published conventional benchmarks you can use when no prior data exists: **0.10 is small, 0.25 is medium, 0.40 is large**. Treat these as last-resort defaults. Whenever you have pilot data or prior studies, compute f directly.

Here's a reusable helper that takes group means and the pooled within-group standard deviation and returns Cohen's f. Internally it computes the standard deviation of the group means (using the population formula, not the sample formula, consistent with Cohen's definition).

```r title="Function: compute Cohen's f from pilot data"
compute_cohens_f <- function(group_means, sd_within) {
  grand_mean <- mean(group_means)
  k <- length(group_means)
  sigma_between <- sqrt(sum((group_means - grand_mean)^2) / k)
  sigma_between / sd_within
}
```

Now apply it to a pilot where three groups gave sample means of 50, 55, and 65, with a pooled within-group SD of 20.

```r title="Cohen's f for pilot with means 50, 55, 65"
pilot_f <- compute_cohens_f(group_means = c(50, 55, 65),
                            sd_within = 20)
round(pilot_f, 3)
#> [1] 0.309
```

That's roughly 0.31, which sits between medium (0.25) and large (0.40). The useful move is plugging this right back into `pwr.anova.test()` to see what sample size the pilot effect justifies:

```r title="Required n implied by the pilot effect size"
pwr.anova.test(k = 3, f = 0.309, sig.level = 0.05, power = 0.80)$n
#> [1] 34.45
```

So 35 subjects per group would suffice if the real effect matches the pilot. Using the default "medium" f=0.25 would have required 53 per group, an 18-subject-per-group overshoot that costs real money and time.

[WARNING]
**Never default to f=0.25 without justification.** The conventional benchmarks are a placeholder for total ignorance, not a scientific estimate. A single 5-minute pilot or a literature search usually produces a better number, and power calculations based on the wrong f are off by an order of magnitude on required n.

**Try it:** A pilot for a different study gave group means 100, 110, and 120 with pooled within-SD of 15. Compute Cohen's f and assign to `ex_pilot_f2`.

```r title="Your turn: Cohen's f from different pilot"
# Try it: compute f using the helper
ex_pilot_f2 <- # your code here

round(ex_pilot_f2, 3)
#> Expected: roughly 0.544
```

<details>
<summary>Click to reveal solution</summary>

```r title="Cohen's f second pilot solution"
ex_pilot_f2 <- compute_cohens_f(group_means = c(100, 110, 120),
                                sd_within = 15)
round(ex_pilot_f2, 3)
#> [1] 0.544
```

**Explanation:** Same 10-unit spread between consecutive means, but half the within-group SD doubles the effect size. Tighter within-group variation makes the group difference easier to detect.

</details>

## How do you validate power with a Monte Carlo simulation in R?

`pwr.anova.test()` assumes the classical ANOVA model: balanced groups, normal residuals, equal variances. If your real design violates any of those, the analytical power number is a rough approximation rather than the truth. A Monte Carlo simulation removes the trust issue by running your design thousands of times on synthetic data that mirrors your assumptions (or deliberately breaks them) and reporting the empirical rejection rate.

The recipe is three lines long conceptually: draw synthetic data for each group, run `aov()`, record whether p < alpha. Repeat a few thousand times and the proportion of rejections is your simulated power.

![Monte Carlo power simulation loop](screenshots/Power-Analysis-for-ANOVA-in-R-simulation-loop.webp)
*Figure 2: The Monte Carlo power simulation loop. Generate synthetic data, run ANOVA, count how often p < alpha.*

Here's a compact implementation. The function takes the true group means you want to simulate, a common within-group SD, a per-group sample size, the alpha level, and how many simulations to run.

```r title="Function: Monte Carlo power for one-way ANOVA"
sim_anova_power <- function(means, sd, n, alpha = 0.05, nsim = 2000) {
  k <- length(means)
  rejections <- replicate(nsim, {
    y <- unlist(lapply(means, function(m) rnorm(n, mean = m, sd = sd)))
    g <- factor(rep(seq_len(k), each = n))
    p <- summary(aov(y ~ g))[[1]][["Pr(>F)"]][1]
    p < alpha
  })
  mean(rejections)
}
```

Now validate against the analytical result. The classic medium-effect scenario we solved above asked for about 53 per group. Let's set means 0, 0.25, 0.50 and SD 1 (which gives Cohen's f ≈ 0.204, close to medium) and simulate.

```r title="Simulated vs analytical power"
set.seed(123)

sim_power <- sim_anova_power(means = c(0, 0.25, 0.50),
                             sd = 1,
                             n = 53,
                             nsim = 2000)

analytic_power <- pwr.anova.test(k = 3, n = 53, f = 0.204, sig.level = 0.05)$power

round(c(simulated = sim_power, analytic = analytic_power), 3)
#> simulated  analytic
#>     0.634     0.628
```

The two numbers line up within Monte Carlo noise, which confirms the analytical formula is trustworthy for this well-behaved design. The small gap (0.006) is sampling variability from using 2000 simulations; running 10000 would tighten the match further. Once you've seen a simulation and a formula agree on a clean case, you gain confidence that deviations in messier cases are signal, not bug.

[NOTE]
**Rules of thumb for nsim.** 500 sims = quick sanity check (±2% noise), 2000 = publication-quality (±1%), 10000 = paper-grade tight (±0.5%). Expected standard error of the estimate is $\sqrt{p(1-p)/\text{nsim}}$, so doubling simulations cuts noise by about 30%.

**Try it:** Re-run the simulation with `set.seed(2025)` instead of 123. Save the result to `ex_sim_seed2025`. How much does the estimate move?

```r title="Your turn: simulation with a new seed"
# Try it: use set.seed(2025) before calling sim_anova_power
set.seed(2025)
ex_sim_seed2025 <- # your code here

round(ex_sim_seed2025, 3)
#> Expected: within ~0.02 of 0.634
```

<details>
<summary>Click to reveal solution</summary>

```r title="Different seed solution"
set.seed(2025)
ex_sim_seed2025 <- sim_anova_power(means = c(0, 0.25, 0.50),
                                   sd = 1,
                                   n = 53,
                                   nsim = 2000)
round(ex_sim_seed2025, 3)
#> [1] 0.641
```

**Explanation:** Different seeds produce slightly different draws, so the estimate wobbles within the Monte Carlo standard error. Both values bracket the true power.

</details>

## How does power change with sample size and effect size (power curves)?

A single power number hides the shape of the tradeoff. A power curve plots power against sample size for several effect sizes at once, giving you a map of the design space instead of a point. You can read off the minimum n that clears 80% power for each effect size, spot where the curve flattens (diminishing returns), and see how much margin you have if your true effect turns out smaller than planned.

Build the grid by crossing every combination of n and f, then compute power for each cell. `tidyr::crossing()` makes this one call.

```r title="Grid of power across n and effect sizes"
library(tidyr)

power_curve <- crossing(n = seq(5, 60, by = 5),
                        f = c(0.10, 0.25, 0.40)) |>
  rowwise() |>
  mutate(power = pwr.anova.test(k = 3, n = n, f = f, sig.level = 0.05)$power) |>
  ungroup()

head(power_curve)
#> # A tibble: 6 × 3
#>       n     f  power
#>   <dbl> <dbl>  <dbl>
#> 1     5  0.1  0.0542
#> 2     5  0.25 0.0851
#> 3     5  0.4  0.157
#> 4    10  0.1  0.0590
#> 5    10  0.25 0.162
#> 6    10  0.4  0.389
```

Now plot. One line per effect size, a horizontal reference line at 0.80, and axis scales that make it easy to read minimum n off the x-axis.

```r title="Plot the power curves"
library(ggplot2)

ggplot(power_curve, aes(x = n, y = power,
                        color = factor(f), group = factor(f))) +
  geom_line(linewidth = 1) +
  geom_point(size = 2) +
  geom_hline(yintercept = 0.80, linetype = "dashed", color = "grey40") +
  scale_y_continuous(limits = c(0, 1), breaks = seq(0, 1, 0.2)) +
  labs(title = "Power curves for one-way ANOVA with k = 3",
       x = "Sample size per group (n)",
       y = "Power",
       color = "Cohen's f") +
  theme_minimal()
```

Where each line crosses the dashed 0.80 line tells you the minimum n for that effect size. The small-effect line (f=0.10) never clears 0.80 in this n range; you'd need to extend the x-axis to roughly 325 to see it cross. The large-effect line (f=0.40) crosses almost immediately, around n=22. This is the geometry behind the table of required sample sizes we computed earlier, shown as a continuous surface.

[TIP]
**Draw the curve before committing to an n.** Plotting power vs n across plausible effect sizes is the fastest way to see if your design is robust to misjudging the effect. A curve that crosses 0.80 far below your planned n has safety margin; a curve that barely clears it means your study is one pilot-data revision away from being underpowered.

**Try it:** Rebuild `power_curve` adding a fourth effect size f=0.15 (between small and medium). Save to `ex_power_curve4` and check the first row for n=30, f=0.15.

```r title="Your turn: add f=0.15 to the grid"
# Try it: include f = 0.15 in crossing()
ex_power_curve4 <- # your code here

ex_power_curve4 |> filter(n == 30, f == 0.15)
#> Expected: power around 0.20
```

<details>
<summary>Click to reveal solution</summary>

```r title="Grid with f=0.15 solution"
ex_power_curve4 <- crossing(n = seq(5, 60, by = 5),
                            f = c(0.10, 0.15, 0.25, 0.40)) |>
  rowwise() |>
  mutate(power = pwr.anova.test(k = 3, n = n, f = f, sig.level = 0.05)$power) |>
  ungroup()

ex_power_curve4 |> filter(n == 30, f == 0.15)
#> # A tibble: 1 × 3
#>       n     f power
#>   <dbl> <dbl> <dbl>
#> 1    30  0.15 0.202
```

**Explanation:** At n=30, f=0.15 sits between the small and medium curves. Adding intermediate effect sizes helps if literature reports effects between Cohen's benchmarks.

</details>

## What about unequal variances and unbalanced groups?

`pwr.anova.test()` stops being exact the moment your design drifts from its balanced-equal-variance assumption. In practice, biological groups differ in variability (treatment and control often have different scatter), recruitment is uneven, and classical F statistics inflate Type I error under heteroscedasticity. Simulation is the right tool here because it runs your actual design, warts and all, and measures empirical rejection rates rather than assuming the math still applies.

The fix for unequal variances is Welch's one-way test, available via `oneway.test(..., var.equal = FALSE)`. Welch adjusts degrees of freedom so the null distribution is correct even when groups have different SDs. Let's build a simulation that runs both tests on the same draws so we can compare.

```r title="Function: Welch vs classical F under heteroscedasticity"
sim_welch_vs_aov <- function(means, sds, ns, alpha = 0.05, nsim = 2000) {
  k <- length(means)
  results <- replicate(nsim, {
    y <- unlist(mapply(function(m, s, n) rnorm(n, mean = m, sd = s),
                       means, sds, ns, SIMPLIFY = FALSE))
    g <- factor(rep(seq_len(k), times = ns))
    p_aov   <- summary(aov(y ~ g))[[1]][["Pr(>F)"]][1]
    p_welch <- oneway.test(y ~ g, var.equal = FALSE)$p.value
    c(aov = p_aov < alpha, welch = p_welch < alpha)
  })
  rowMeans(results)
}
```

Now run the scenario: three groups with increasing variance (SD = 1, 2, 3), balanced sample sizes of 30 each, and true means 0, 0.5, 1.0. Classical F is sensitive to this pattern because the within-group MSE mixes three different variances into a single pooled estimate.

```r title="Power under unequal variance: Welch vs classical"
set.seed(7)

welch_result <- sim_welch_vs_aov(means = c(0, 0.5, 1.0),
                                 sds = c(1, 2, 3),
                                 ns = c(30, 30, 30),
                                 nsim = 2000)

round(welch_result, 3)
#>   aov welch
#> 0.412 0.398
```

Both tests detect the true effect at roughly similar rates here, but Welch's real advantage shows up at the null. Let's repeat with equal means (zero effect) to measure Type I error rather than power:

```r title="Type I error under heteroscedasticity"
set.seed(8)

null_result <- sim_welch_vs_aov(means = c(0, 0, 0),
                                sds = c(1, 2, 3),
                                ns = c(30, 30, 30),
                                nsim = 2000)
round(null_result, 3)
#>   aov welch
#> 0.079 0.051
```

At a nominal 0.05, classical `aov()` rejects 7.9% of the time when the null is true. That's a 58% inflation in false positives. Welch sits at 5.1%, essentially on target. If your design has reason to expect unequal variances, defaulting to classical ANOVA silently biases your study toward false discoveries.

[WARNING]
**Unequal variance + balanced n still inflates Type I for classical F.** The old claim that "balanced designs are robust to heteroscedasticity" is only true when variances are close. With SDs in a 3-to-1 ratio like above, alpha leaks even at balanced n. Use `oneway.test(var.equal = FALSE)` or simulate.

**Try it:** Modify the simulation to use unbalanced sample sizes `ns = c(10, 30, 50)` at **equal** SDs of 1, means (0, 0.3, 0.6). What power does each test report? Save to `ex_unbal_result`.

```r title="Your turn: unbalanced design, equal variance"
# Try it: call sim_welch_vs_aov with unbalanced ns
set.seed(11)
ex_unbal_result <- # your code here

round(ex_unbal_result, 3)
#> Expected: both near 0.43
```

<details>
<summary>Click to reveal solution</summary>

```r title="Unbalanced design solution"
set.seed(11)
ex_unbal_result <- sim_welch_vs_aov(means = c(0, 0.3, 0.6),
                                    sds = c(1, 1, 1),
                                    ns = c(10, 30, 50),
                                    nsim = 2000)
round(ex_unbal_result, 3)
#>   aov welch
#> 0.432 0.428
```

**Explanation:** With equal variances, classical and Welch match closely. Imbalance costs you power compared to balanced n, but doesn't corrupt Type I. The danger zone is imbalance plus heteroscedasticity together.

</details>

## Practice Exercises

Three capstone exercises combining the tools above. Variable names start with `my_` so they don't overwrite tutorial variables in the notebook.

### Exercise 1: Plan a four-arm trial from pilot data

A pilot run for 4 treatment arms gave group means of 20, 23, 25, 28 with pooled within-group SD of 6. Use `compute_cohens_f()` to estimate Cohen's f, then use `pwr.anova.test()` to find the per-group sample size needed for 80% power at alpha=0.05. Save per-group n to `my_n_4arm`.

```r title="Exercise 1: plan a 4-arm trial"
# Exercise: estimate f, then solve for n
# Hint: compute_cohens_f() is defined earlier in this post

my_f_4arm <- # your code here
my_n_4arm <- # your code here

ceiling(my_n_4arm)
#> Expected: around 31
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_f_4arm <- compute_cohens_f(group_means = c(20, 23, 25, 28),
                              sd_within = 6)
my_n_4arm <- pwr.anova.test(k = 4, f = my_f_4arm,
                            sig.level = 0.05, power = 0.80)$n
ceiling(my_n_4arm)
#> [1] 31
```

**Explanation:** The spread of group means over the within-group SD gives f ≈ 0.488, a large effect. That translates to about 31 subjects per group, or 124 total.

</details>

### Exercise 2: Build a helper that returns the minimum n for any effect size

Write a function `my_min_n(f, k = 3, target_power = 0.80, alpha = 0.05)` that returns the smallest integer per-group n such that `pwr.anova.test()` reaches at least `target_power`. Apply it to f values 0.12, 0.18, and 0.30 in a single `sapply()` call.

```r title="Exercise 2: minimum n helper"
# Exercise: write a function, then apply
# Hint: use while() or ceil() on the pwr result

my_min_n <- function(f, k = 3, target_power = 0.80, alpha = 0.05) {
  # your code here
}

sapply(c(0.12, 0.18, 0.30), my_min_n)
#> Expected: roughly 225, 101, 37
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
my_min_n <- function(f, k = 3, target_power = 0.80, alpha = 0.05) {
  ceiling(pwr.anova.test(k = k, f = f,
                         sig.level = alpha,
                         power = target_power)$n)
}

sapply(c(0.12, 0.18, 0.30), my_min_n)
#> [1] 225 101  37
```

**Explanation:** `pwr.anova.test()` directly returns the fractional n, so `ceiling()` gives the minimum integer that clears the target. No loop required.

</details>

### Exercise 3: Simulate and visualize the p-value distribution

Simulate a 3-group design with means (10, 10, 12), SD=3, n=25 per group, 2000 draws. Collect all 2000 p-values from `aov()` and save to `my_pvalues`. Then (a) compute the proportion < 0.05 (simulated power), and (b) plot a histogram of the p-values. A well-powered study shows a spike near 0; a null study shows a uniform distribution.

```r title="Exercise 3: p-value distribution"
# Exercise: modify sim_anova_power to return p-values, then plot
# Hint: replicate() can return any scalar, not just TRUE/FALSE

set.seed(99)
my_pvalues <- # your code here (length 2000 vector of p-values)

mean(my_pvalues < 0.05)
hist(my_pvalues, breaks = 30, main = "p-value distribution")
#> Expected: simulated power around 0.60
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
set.seed(99)
my_pvalues <- replicate(2000, {
  y <- c(rnorm(25, 10, 3), rnorm(25, 10, 3), rnorm(25, 12, 3))
  g <- factor(rep(1:3, each = 25))
  summary(aov(y ~ g))[[1]][["Pr(>F)"]][1]
})

mean(my_pvalues < 0.05)
#> [1] 0.601

hist(my_pvalues, breaks = 30,
     main = "p-value distribution",
     xlab = "p-value")
```

**Explanation:** The histogram skews heavily left because two of three groups genuinely differ. The proportion below 0.05 (0.601) is the simulated power. A null design would produce a flat histogram instead.

</details>

## Complete Example: Planning a Meditation Study

A researcher wants to compare four meditation protocols on a stress score. A small pilot of 12 subjects split into a control group and a mindfulness group produced means of 30 and 25 with pooled SD of 8. Plan the full four-arm study end-to-end.

**Step 1: Estimate Cohen's f from the pilot.** The pilot only had two conditions, so use the pairwise difference to anchor an expected group-mean spread for the full four-arm design. Assume the four future arms will have means spanning roughly (30, 28, 26, 25).

```r title="Step 1: estimate effect size from pilot"
planned_means <- c(30, 28, 26, 25)
pilot_sd      <- 8

planned_f <- compute_cohens_f(group_means = planned_means,
                              sd_within = pilot_sd)
round(planned_f, 3)
#> [1] 0.243
```

**Step 2: Solve for required sample size.**

```r title="Step 2: required n per group"
plan <- pwr.anova.test(k = 4, f = planned_f,
                       sig.level = 0.05, power = 0.80)
ceiling(plan$n)
#> [1] 47
```

So 47 per group, 188 total across four arms. That becomes the recruitment target.

**Step 3: Validate with a Monte Carlo simulation.** Use the planned means and pilot SD to run the design at n=47 and confirm the analytical result.

```r title="Step 3: simulate the planned design"
set.seed(2026)
sim_check <- sim_anova_power(means = planned_means,
                             sd = pilot_sd,
                             n = 47,
                             nsim = 2000)
round(sim_check, 3)
#> [1] 0.802
```

The simulation lands right at 0.80, confirming the analytical plan under the balanced-equal-variance assumption.

**Step 4: Stress-test with heteroscedasticity.** What if meditation groups have lower within-group variance than control? Re-run allowing SDs 8, 7, 6, 5.

```r title="Step 4: stress-test unequal variance"
set.seed(2027)
sim_unequal <- sim_welch_vs_aov(means = planned_means,
                                sds = c(8, 7, 6, 5),
                                ns = rep(47, 4),
                                nsim = 2000)
round(sim_unequal, 3)
#>   aov welch
#> 0.836 0.831
```

Both tests clear 0.80, and Welch stays close to classical F. The plan is robust. The researcher recruits 47 per group, commits to Welch ANOVA in the analysis plan, and has a simulation record in the registered protocol.

## Summary

| Task | Function | Inputs | Returns |
|---|---|---|---|
| Analytical power | `pwr.anova.test()` | k, n, f, sig.level, power (omit one) | Solves for the omitted parameter |
| Compute f from pilot | `compute_cohens_f()` (custom) | Group means, within-group SD | Cohen's f |
| Simulate power | `sim_anova_power()` (custom) | Means, SD, n, nsim | Empirical power estimate |
| Handle unequal variance | `oneway.test(var.equal = FALSE)` | formula, data | Welch F-test |
| Stress-test design | `sim_welch_vs_aov()` (custom) | Means, SDs, ns, nsim | Power/Type I for both tests |

Key takeaways:

1. Run power analysis before data collection, not after a non-result.
2. Cohen's f benchmarks (0.10/0.25/0.40) are last-resort defaults. Compute f from pilot or prior literature whenever possible.
3. `pwr.anova.test()` is fast and exact for balanced, normal, equal-variance designs.
4. Simulation validates the analytical answer and is the only honest tool for unbalanced or heteroscedastic designs.
5. Welch's test (`oneway.test(var.equal = FALSE)`) protects Type I error when groups have different variances; register it in advance rather than switching after seeing the data.

## References

1. Cohen, J. *Statistical Power Analysis for the Behavioral Sciences*, 2nd ed. Routledge (1988). Chapter 8 on F tests.
2. Champely, S. `pwr` package reference manual. [Link](https://cran.r-project.org/web/packages/pwr/pwr.pdf)
3. Champely, S. pwr vignette: Getting Started with the pwr package. [Link](https://cran.r-project.org/web/packages/pwr/vignettes/pwr-vignette.html)
4. Lakens, D., & Caldwell, A. R. Simulation-Based Power Analysis for Factorial ANOVA Designs. *Advances in Methods and Practices in Psychological Science*, 4(1), 2021. [Link](https://journals.sagepub.com/doi/10.1177/2515245920951503)
5. UCLA OARC. One-way ANOVA Power Analysis. [Link](https://stats.oarc.ucla.edu/r/dae/one-way-anova-power-analysis/)
6. UVA StatLab. Power and Sample Size in R: ANOVA chapter. [Link](https://uvastatlab.github.io/pass_in_R/anova.html)
7. Welch, B. L. *On the Comparison of Several Mean Values: An Alternative Approach*. Biometrika, 38(3/4), 1951. [Link](https://www.jstor.org/stable/2332579)
8. R Core Team. `power.anova.test` documentation in base R stats package.

## Continue Learning

- [Statistical Power Analysis in R](Statistical-Power-Analysis-in-R.html): broader overview of the `pwr` package across t-tests, correlations, proportions, and regression, not just ANOVA.
- [One-Way ANOVA in R](One-Way-ANOVA-in-R.html): the parent post covering how to actually run the F-test, check assumptions, and follow up with post-hoc tests once your powered study is done.
- [Power Analysis Exercises in R](Power-Analysis-Exercises-in-R.html): practice problems across the full family of power calculations, including sample size re-estimation and sensitivity analysis.
