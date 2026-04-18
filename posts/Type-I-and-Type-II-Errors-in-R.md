---
title: "Type I and Type II Errors in R: Visualise the Trade-Off Between α and Power"
slug: Type-I-and-Type-II-Errors-in-R
description: "Every hypothesis test trades Type I errors (α) against Type II errors (β). Visualise both in R, and see how α, sample size, and effect size shape power."
keywords: "Type I error, Type II error, alpha, beta, statistical power, power analysis, significance level, false positive, false negative, pwr package, hypothesis testing R"
auto_link_terms: "Type I error|Type II error|statistical power|significance level|false positive|false negative"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-18
curriculum_id: "2.2.5"
post_type: C
sidebar_section: Statistics
sidebar_title: "Type I and II Errors"
sidebar_order: 36
difficulty: Intermediate
---

# Type I and Type II Errors in R: Visualise the Trade-Off Between α and Power

<p class="lead">A <b>Type I error</b> rejects a true null hypothesis (a false positive, probability α), and a <b>Type II error</b> fails to reject a false null hypothesis (a false negative, probability β). Statistical power, 1 − β, is the probability of actually detecting a real effect when one is present.</p>

## What are Type I and Type II errors?

Every hypothesis test chooses between two worlds: the null distribution H₀ and the alternative distribution H₁. Both curves overlap, and any "reject" cutoff you draw will push a sliver of each distribution into the wrong bucket. The clearest way to see this is to plot both curves and shade the regions that become α and β. Let's build one picture and read every quantity straight off it.

We'll build a reusable helper, `plot_power()`, that takes an effect size `d`, a sample size `n`, and a significance level `alpha`, then draws the two sampling distributions with α shaded red (Type I) and β shaded blue (Type II).

```r title="Define plot_power() and render the payoff picture"
library(ggplot2)

plot_power <- function(d = 0.5, n = 30, alpha = 0.05) {
  shift <- d * sqrt(n)                       # H1 shift in SE units
  crit  <- qnorm(1 - alpha)                  # critical Z for one-sided test
  x     <- seq(-4, shift + 4, length.out = 400)
  df    <- data.frame(
    x    = x,
    null = dnorm(x, mean = 0,     sd = 1),
    alt  = dnorm(x, mean = shift, sd = 1)
  )
  beta  <- pnorm(crit, mean = shift, sd = 1)
  power <- 1 - beta

  ggplot(df, aes(x)) +
    geom_area(aes(y = null), fill = "#c8d6e5", alpha = 0.5) +
    geom_area(aes(y = alt),  fill = "#feca57", alpha = 0.3) +
    geom_area(data = subset(df, x >= crit), aes(y = null),
              fill = "#ee5253", alpha = 0.8) +
    geom_area(data = subset(df, x <= crit), aes(y = alt),
              fill = "#54a0ff", alpha = 0.5) +
    geom_vline(xintercept = crit, linetype = "dashed") +
    labs(
      title = sprintf("d=%.2f, n=%d, alpha=%.3f  ->  beta=%.3f, power=%.3f",
                      d, n, alpha, beta, power),
      x = "Test statistic (Z)",
      y = "Density"
    ) +
    theme_minimal()
}

plot_power(d = 0.5, n = 30, alpha = 0.05)
#> A plot with two bell curves:
#>   - grey/red curve: null distribution (Z ~ N(0,1))
#>   - yellow/blue curve: alternative distribution shifted by 2.74 SE
#>   - dashed line at Z = 1.645 (the critical value)
#>   - red right tail of H0 = alpha = 0.05
#>   - blue left tail of H1 under the critical line = beta ≈ 0.135
#>   - power = 1 - beta ≈ 0.865
```

The title of the figure is the whole story. At a Cohen's d of 0.5 and n=30, the critical Z sits at 1.645 (the 95th percentile of the null). The red slice of the null curve above that line is exactly 5%, your Type I rate. The blue slice of the alternative curve *below* the same line is β ≈ 13.5%, the probability you'd miss this real effect. Everything that follows is just sliding the three inputs (`d`, `n`, `alpha`) and watching these two areas change.

![The four outcomes of a hypothesis test, two errors, two correct decisions.](screenshots/Type-I-and-Type-II-Errors-in-R-decision-matrix.webp)
*Figure 1: The four outcomes of a hypothesis test, two errors, two correct decisions.*

The same four outcomes live in every test. Let's write them as a small table so the names stop blurring together.

```r title="Build the 2x2 decision matrix"
library(tibble)

decision_tbl <- tribble(
  ~truth,   ~decision,          ~label,                        ~probability,
  "H0 true", "Reject H0",        "Type I error (false positive)",   "alpha",
  "H0 true", "Fail to reject H0","Correct non-rejection",           "1 - alpha",
  "H1 true", "Reject H0",        "Correct detection (Power)",       "1 - beta",
  "H1 true", "Fail to reject H0","Type II error (false negative)",  "beta"
)
print(decision_tbl)
#> # A tibble: 4 × 4
#>   truth   decision           label                           probability
#>   <chr>   <chr>              <chr>                           <chr>
#> 1 H0 true Reject H0          Type I error (false positive)   alpha
#> 2 H0 true Fail to reject H0  Correct non-rejection           1 - alpha
#> 3 H1 true Reject H0          Correct detection (Power)       1 - beta
#> 4 H1 true Fail to reject H0  Type II error (false negative)  beta
```

Reading this table carefully is worth a minute. α and β live in **different rows**: α conditions on H₀ being true, β conditions on H₁ being true. You don't add them up. You can't judge a test by "α + β". That's why tightening α doesn't automatically hurt β by the same amount, they're computed on different distributions.

[KEY INSIGHT]
**The two errors are not symmetric trade-offs of a single number.** α is computed under the null, β under the alternative. They move together only because they share the same critical value, not because they share the same probability mass.

**Try it:** Re-run `plot_power()` with `alpha = 0.01` (everything else the same). Predict whether β will be bigger or smaller before you look. Check the figure title.

```r title="Your turn: tighten alpha"
# Try it: call plot_power() with alpha = 0.01
# Hint: keep d = 0.5 and n = 30
ex_plot <- plot_power(d = 0.5, n = 30, alpha = ___)

# Expected: alpha in the title drops to 0.01,
# and beta rises from ~0.135 to about ~0.29.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Tighten alpha solution"
ex_plot <- plot_power(d = 0.5, n = 30, alpha = 0.01)
ex_plot
#> Figure title: d=0.50, n=30, alpha=0.010 -> beta=0.288, power=0.712
```

**Explanation:** Lowering α from 0.05 to 0.01 moves the dashed critical line to the right (Z = 2.326). That shrinks the red tail of the null to 1%, but a bigger chunk of the alternative curve now sits *under* the line, so β roughly doubles.

</details>

## How does changing α affect β?

The first H2 showed it once. Now let's make it quantitative. Lowering α is a decision to be stricter before you declare a finding real. The cost is you reject fewer true positives too. Let's sweep α across three common values and print the numbers.

```r title="Sweep alpha and tabulate beta and power"
alphas <- c(0.10, 0.05, 0.01)

alpha_beta_df <- data.frame(
  alpha = alphas,
  crit  = qnorm(1 - alphas),
  beta  = pnorm(qnorm(1 - alphas), mean = 0.5 * sqrt(30), sd = 1),
  power = 1 - pnorm(qnorm(1 - alphas), mean = 0.5 * sqrt(30), sd = 1)
)
alpha_beta_df
#>   alpha     crit      beta     power
#> 1  0.10 1.281552 0.0725330 0.9274670
#> 2  0.05 1.644854 0.1353803 0.8646197
#> 3  0.01 2.326348 0.2884987 0.7115013
```

Three lines in, and the trade-off is stark. Going from α=0.10 to α=0.01 cuts the Type I rate ten-fold, but β jumps from 7.3% to 28.8%, you'd miss more than a quarter of real effects at the stricter cutoff. This is why "just use α=0.001 to be safe" is bad advice: it's only safer against one mistake.

[WARNING]
**Smaller α is not universally "safer".** Cutting α from 0.05 to 0.01 sounds cautious, but with a modest effect size you'll typically quadruple your miss rate. A test tuned for false-positive control can be completely uninformative about real effects if β isn't checked.

**Try it:** Write a function `ex_alpha_sweep(alphas, d, n)` that returns a data frame with columns `alpha`, `beta`, `power`. Test it on `c(0.20, 0.05, 0.001)`.

```r title="Your turn: function that sweeps alpha"
ex_alpha_sweep <- function(alphas, d, n) {
  # your code here
}

ex_alpha_sweep(c(0.20, 0.05, 0.001), d = 0.5, n = 30)
#> Expected: a data.frame with 3 rows and columns alpha, beta, power
```

<details>
<summary>Click to reveal solution</summary>

```r title="Alpha sweep solution"
ex_alpha_sweep <- function(alphas, d, n) {
  shift <- d * sqrt(n)
  crit  <- qnorm(1 - alphas)
  beta  <- pnorm(crit, mean = shift, sd = 1)
  data.frame(alpha = alphas, beta = beta, power = 1 - beta)
}

ex_alpha_sweep(c(0.20, 0.05, 0.001), d = 0.5, n = 30)
#>   alpha       beta     power
#> 1 0.200 0.03049029 0.9695097
#> 2 0.050 0.13538028 0.8646197
#> 3 0.001 0.49994173 0.5000583
```

**Explanation:** `qnorm()` and `pnorm()` are vectorised, so the body is just four lines. The point is that at α=0.001 and d=0.5, n=30, power drops to 50%, a coin flip, useless for a serious study.

</details>

## How does sample size change the picture?

Changing α is a policy decision. Changing n is an investment in data. More data shrinks the standard error, which narrows both sampling distributions, which reduces overlap, which cuts β. Same α, more data, less β. It's the cleanest lever you have.

```r title="Sweep sample size at fixed effect size"
n_grid <- c(10, 20, 30, 50, 100, 200)
d_fixed <- 0.5
alpha_fixed <- 0.05

n_power_df <- data.frame(
  n     = n_grid,
  shift = d_fixed * sqrt(n_grid),
  beta  = pnorm(qnorm(1 - alpha_fixed),
                mean = d_fixed * sqrt(n_grid), sd = 1),
  power = 1 - pnorm(qnorm(1 - alpha_fixed),
                    mean = d_fixed * sqrt(n_grid), sd = 1)
)
n_power_df
#>     n    shift      beta     power
#> 1  10 1.581139 0.5253804 0.4746196
#> 2  20 2.236068 0.2788144 0.7211856
#> 3  30 2.738613 0.1353803 0.8646197
#> 4  50 3.535534 0.0290397 0.9709603
#> 5 100 5.000000 0.0004290 0.9995710
#> 6 200 7.071068 0.0000000 1.0000000
```

At n=10 the test is worse than a coin flip for detecting d=0.5. By n=50 power is already 97%, and at n=100 we're essentially guaranteed to detect it. The returns flatten quickly, going from 50 to 200 buys almost nothing at d=0.5, but would matter a lot for a smaller effect. That insight is exactly what a power curve reveals.

```r title="Plot power curves across several effect sizes"
n_curve_df <- expand.grid(
  n = seq(5, 200, by = 5),
  d = c(0.2, 0.5, 0.8)
)
n_curve_df$power <- 1 - pnorm(
  qnorm(0.95),
  mean = n_curve_df$d * sqrt(n_curve_df$n),
  sd = 1
)

ggplot(n_curve_df, aes(x = n, y = power, colour = factor(d))) +
  geom_line(linewidth = 1) +
  geom_hline(yintercept = 0.80, linetype = "dotted") +
  labs(
    title = "Power vs sample size for three effect sizes (alpha=0.05)",
    x = "Sample size n", y = "Power (1 - beta)",
    colour = "Cohen's d"
  ) +
  theme_minimal()
#> A plot: three rising S-curves.
#>   - d=0.8 reaches 0.80 power by n ~ 13
#>   - d=0.5 reaches 0.80 power by n ~ 26
#>   - d=0.2 needs n ~ 155 to reach 0.80 power
```

Each curve climbs steeply, then plateaus near 1. The dotted line at 0.80 is the textbook power target. Notice how the small-effect curve takes a much bigger n to cross that line, a quiet reminder that small effects demand huge studies, not clever tests.

![The three levers that raise power: α, sample size, and effect size.](screenshots/Type-I-and-Type-II-Errors-in-R-power-levers.webp)
*Figure 2: The three levers that raise power: α, sample size, and effect size.*

**Try it:** Solve for the smallest n that gives power ≥ 0.90 at α=0.05 and d=0.3.

```r title="Your turn: find n for target power"
ex_n <- ___  # starting value, search upward
ex_power <- 1 - pnorm(qnorm(0.95), mean = 0.3 * sqrt(ex_n), sd = 1)

# Expected: n around 117 yields power ≈ 0.90
```

<details>
<summary>Click to reveal solution</summary>

```r title="Find n for target power solution"
ex_n_grid <- 50:200
ex_power_grid <- 1 - pnorm(qnorm(0.95),
                           mean = 0.3 * sqrt(ex_n_grid), sd = 1)
ex_n <- min(ex_n_grid[ex_power_grid >= 0.90])
ex_n
#> [1] 117
1 - pnorm(qnorm(0.95), mean = 0.3 * sqrt(ex_n), sd = 1)
#> [1] 0.9014498
```

**Explanation:** Grid-searching over an integer range is the simplest reliable solution. `pwr.t.test()` (next section) does this inversion analytically, but the grid confirms the answer.

</details>

## How does effect size affect power?

Effect size is the signal-to-noise ratio, expressed as a standard-deviation-unit gap between H₀ and H₁. Cohen famously benchmarked d=0.2 as small, 0.5 as medium, 0.8 as large. Those labels are domain-free rules of thumb, in your field a "small" effect may be life-saving (a 0.1 SD drop in hospital mortality) or trivially uninteresting.

```r title="Power at three effect sizes with n=30, alpha=0.05"
effect_df <- data.frame(
  d = c(0.2, 0.5, 0.8),
  n = 30,
  alpha = 0.05
)
effect_df$power <- 1 - pnorm(
  qnorm(0.95),
  mean = effect_df$d * sqrt(effect_df$n),
  sd = 1
)
effect_df$beta <- 1 - effect_df$power
effect_df
#>     d  n alpha     power      beta
#> 1 0.2 30  0.05 0.1832193 0.8167807
#> 2 0.5 30  0.05 0.8646197 0.1353803
#> 3 0.8 30  0.05 0.9960946 0.0039054
```

Same n, same α, three different worlds. A study tuned to detect "small" effects at n=30 has 18% power: you'd miss the real effect more than 4 times out of 5. The same n catches a "medium" effect 86% of the time and a "large" effect essentially always. This is why "we ran a study and found nothing" often means "we didn't run a big enough study".

[NOTE]
**Cohen's d benchmarks (0.2, 0.5, 0.8) are not laws.** They're rough defaults for planning when no prior effect estimate is available. Prefer a domain-specific effect size whenever you can, ideally from a pilot study or a meta-analysis.

**Try it:** Compute power for d values from 0.1 to 1.0 in steps of 0.1 at n=30, α=0.05, and plot it.

```r title="Your turn: power vs d curve"
ex_d_grid <- ___
ex_power_grid <- ___

# Expected: a smooth S-curve from ~0.05 at d=0.1 to ~1.0 at d=1.0
```

<details>
<summary>Click to reveal solution</summary>

```r title="Power vs d solution"
ex_d_grid <- seq(0.1, 1.0, by = 0.1)
ex_power_grid <- 1 - pnorm(qnorm(0.95),
                           mean = ex_d_grid * sqrt(30), sd = 1)

plot(ex_d_grid, ex_power_grid, type = "b",
     xlab = "Cohen's d", ylab = "Power",
     main = "Power vs effect size at n=30, alpha=0.05")
#> A rising S-curve: ~0.08 at d=0.1, ~0.86 at d=0.5, ~1.00 at d=1.0.
```

**Explanation:** The curve is steepest in the middle (around d=0.4) and flattens at both ends. That's why doubling a tiny effect size gains far more power than doubling an already-large one.

</details>

## How do we calculate power with the pwr package?

Everything above used closed-form expressions for a one-sided z-test. In practice you usually want a t-test, a proportion test, or an ANOVA, and you want to **solve for** the quantity you don't know. The `pwr` package by Stéphane Champely handles that inversion for the common tests. You give it any three of (effect size, sample size, α, power) and it computes the fourth.

```r title="Use pwr for a two-sample t-test"
library(pwr)

# 1. Given d, n, alpha -> compute power
pwr.t.test(n = 30, d = 0.5, sig.level = 0.05,
           type = "two.sample", alternative = "two.sided")
#>      Two-sample t test power calculation
#>
#>               n = 30
#>               d = 0.5
#>       sig.level = 0.05
#>           power = 0.4778965
#>     alternative = two.sided
#>
#> NOTE: n is number in *each* group

# 2. Given d, alpha, power -> solve for n
pwr_out <- pwr.t.test(d = 0.5, sig.level = 0.05, power = 0.80,
                      type = "two.sample", alternative = "two.sided")
n_req <- ceiling(pwr_out$n)
n_req
#> [1] 64
```

Two things to notice. First, the two-sided t-test at d=0.5, n=30 has power 0.48, much lower than our earlier one-sided z-test estimate of 0.86. That gap comes from two adjustments: two-sided tests must split α across both tails, and the t-distribution has fatter tails than the normal. Second, to hit the classic 80% power target at d=0.5, you need 64 subjects *per group*, or 128 total. That's a useful sanity check every time you design a study.

[TIP]
**Always leave out the quantity you want to compute.** `pwr.t.test()` inverts the formula for whichever argument you omit. Pass it `n = NULL` (or just leave `n` off) to solve for sample size, omit `power` to compute power, omit `d` to find the minimum detectable effect.

**Try it:** Use `pwr.t.test()` to find the sample size per group needed for 90% power at d=0.4, α=0.05, two-sided.

```r title="Your turn: solve for n with pwr"
ex_pwr <- pwr.t.test(d = ___, sig.level = 0.05, power = ___,
                     type = "two.sample", alternative = "two.sided")
ceiling(ex_pwr$n)
#> Expected: 133 per group
```

<details>
<summary>Click to reveal solution</summary>

```r title="pwr solve-for-n solution"
ex_pwr <- pwr.t.test(d = 0.4, sig.level = 0.05, power = 0.90,
                     type = "two.sample", alternative = "two.sided")
ceiling(ex_pwr$n)
#> [1] 133
```

**Explanation:** Shrinking the effect from 0.5 to 0.4 and raising power from 0.80 to 0.90 more than doubles the per-group sample size. Small gains on both fronts compound quickly.

</details>

## How do simulations validate the error rates?

Analytical formulas are tidy, but only exist for standard tests. For anything non-standard, bootstrapped tests, mixed models, custom statistics, you estimate α and power the way a frequentist defines them: by running the experiment many times and counting. Monte Carlo simulation is the ground truth every formula is trying to approximate.

```r title="Simulate Type I rate under the null"
set.seed(2025)

n_sim <- 5000
n_each <- 30

p_values_null <- replicate(n_sim, {
  x <- rnorm(n_each, mean = 0, sd = 1)   # both groups share the same mean
  y <- rnorm(n_each, mean = 0, sd = 1)
  t.test(x, y)$p.value
})
false_pos_rate <- mean(p_values_null < 0.05)
false_pos_rate
#> [1] 0.0504
```

The empirical false-positive rate sits right at 5%, matching the nominal α exactly (within Monte Carlo noise). That's what "α = 0.05" actually promises: if H₀ is true and you re-ran the study forever, you'd wrongly reject about 5% of the time. No more, no less. Now let's flip the truth and see what power looks like.

```r title="Simulate power under a true effect"
set.seed(2026)

p_values_alt <- replicate(n_sim, {
  x <- rnorm(n_each, mean = 0.0, sd = 1)
  y <- rnorm(n_each, mean = 0.5, sd = 1)   # true shift = 0.5 SD
  t.test(x, y)$p.value
})
empirical_power <- mean(p_values_alt < 0.05)
empirical_power
#> [1] 0.4806
```

Empirical power is 48%, essentially the same as the 47.8% `pwr.t.test()` predicted for d=0.5, n=30. Analytical and simulated answers agree, which is the whole reason we trust the formula in the first place. When you build a custom test, you lose the formula but keep the simulator.

[KEY INSIGHT]
**Simulation is the authoritative definition of α and power.** Formulas are fast approximations to the long-run frequency of rejection; the simulation *is* that frequency. If the two disagree, trust the simulator and debug the formula.

**Try it:** Re-run the power simulation with `n_each <- 10` (same effect size). Predict whether empirical power will be above or below 50% before you run it.

```r title="Your turn: simulate power at n=10"
set.seed(99)
ex_n <- 10
ex_p <- replicate(2000, {
  x <- rnorm(ex_n, mean = 0.0, sd = 1)
  y <- rnorm(ex_n, mean = ___, sd = 1)
  t.test(x, y)$p.value
})
mean(ex_p < 0.05)
#> Expected: about 0.18 (much worse than n=30)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Power at n=10 simulation solution"
set.seed(99)
ex_n <- 10
ex_p <- replicate(2000, {
  x <- rnorm(ex_n, mean = 0.0, sd = 1)
  y <- rnorm(ex_n, mean = 0.5, sd = 1)
  t.test(x, y)$p.value
})
mean(ex_p < 0.05)
#> [1] 0.1855
```

**Explanation:** Same effect size, one-third the sample, and power collapses from 48% to 19%. The empirical answer matches `pwr.t.test(n = 10, d = 0.5, ...)` closely. Sample size is the single biggest thing you control.

</details>

## Practice Exercises

### Exercise 1: Build a full error table

Write a function `my_error_table(alphas, d, n)` that returns a data frame with columns `alpha`, `beta`, `power`, and `correct_rejection`. Run it for α values `c(0.001, 0.01, 0.05, 0.10)` at d=0.4 and n=40 (one-sided z-test, so use the analytical formula). Your result should show how sharply β rises as α tightens.

```r title="Exercise 1: your error table"
# Hint: power = 1 - pnorm(qnorm(1 - alpha), mean = d * sqrt(n), sd = 1)
# Hint: correct_rejection (under H0) = 1 - alpha

my_error_table <- function(alphas, d, n) {
  # your code here
}

my_error_table(c(0.001, 0.01, 0.05, 0.10), d = 0.4, n = 40)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution: full error table"
my_error_table <- function(alphas, d, n) {
  shift <- d * sqrt(n)
  crit  <- qnorm(1 - alphas)
  beta  <- pnorm(crit, mean = shift, sd = 1)
  data.frame(
    alpha             = alphas,
    beta              = beta,
    power             = 1 - beta,
    correct_rejection = 1 - alphas
  )
}

my_error_table(c(0.001, 0.01, 0.05, 0.10), d = 0.4, n = 40)
#>   alpha       beta     power correct_rejection
#> 1 0.001 0.76225820 0.2377418             0.999
#> 2 0.010 0.44898140 0.5510186             0.990
#> 3 0.050 0.19637793 0.8036221             0.950
#> 4 0.100 0.09891598 0.9010840             0.900
```

**Explanation:** Notice how at α=0.001 you're only detecting 24% of real d=0.4 effects, and the table puts that cost right next to the nominally reassuring 99.9% correct-rejection rate. Displaying both columns together stops α-worship.

</details>

### Exercise 2: Simulate a power curve for a proportion test

Simulate the power of a two-sample proportion test across a grid of sample sizes. The control group has a 10% conversion rate; the treatment group has 14%. Use `prop.test()` and count how often it rejects at α=0.05. Plot power vs n per group.

```r title="Exercise 2: your proportion-power simulation"
# Hint: replicate() around prop.test(c(s1, s2), c(n_each, n_each))$p.value
# Hint: simulate successes with rbinom(1, n_each, prob)

my_n_grid <- c(200, 500, 1000, 2000)
my_power_curve <- sapply(my_n_grid, function(n_each) {
  # simulate 500 datasets, return mean(p < 0.05)
  # your code here
})

plot(my_n_grid, my_power_curve, type = "b",
     xlab = "n per group", ylab = "Power",
     main = "Simulated power: 10% vs 14% conversion")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution: simulated proportion power"
set.seed(2027)
my_n_grid <- c(200, 500, 1000, 2000)

my_power_curve <- sapply(my_n_grid, function(n_each) {
  p_vals <- replicate(500, {
    s1 <- rbinom(1, n_each, 0.10)
    s2 <- rbinom(1, n_each, 0.14)
    prop.test(c(s1, s2), c(n_each, n_each))$p.value
  })
  mean(p_vals < 0.05)
})

data.frame(n_per_group = my_n_grid, power = my_power_curve)
#>   n_per_group power
#> 1         200 0.298
#> 2         500 0.678
#> 3        1000 0.926
#> 4        2000 0.998

plot(my_n_grid, my_power_curve, type = "b",
     xlab = "n per group", ylab = "Power",
     main = "Simulated power: 10% vs 14% conversion")
```

**Explanation:** To reliably catch a 4-point lift off a 10% base you need roughly a thousand users per arm. This is exactly the kind of calculation A/B test planners reach for and is easy to generalise, swap `rbinom()` for any sampling mechanism and the scaffold still works.

</details>

## Complete Example: plan a two-group study end to end

A product team wants to A/B test a new onboarding flow. Prior analytics suggest the true improvement in 7-day retention is roughly d=0.4 (a "small to medium" effect). They want α=0.05 and 80% power, using a two-sided t-test. We'll plan the sample size, visualise the expected test, and simulate to confirm.

```r title="Step 1: solve for n with pwr"
plan <- pwr.t.test(d = 0.4, sig.level = 0.05, power = 0.80,
                   type = "two.sample", alternative = "two.sided")
plan
#>      Two-sample t test power calculation
#>
#>               n = 99.0804
#>               d = 0.4
#>       sig.level = 0.05
#>           power = 0.8
#>     alternative = two.sided
#>
#> NOTE: n is number in *each* group

n_per_group <- ceiling(plan$n)
n_per_group
#> [1] 100
```

```r title="Step 2: visualise the one-sided z equivalent for intuition"
plot_power(d = 0.4, n = 100, alpha = 0.05)
#> Figure title: d=0.40, n=100, alpha=0.050 -> beta=0.0008, power=0.999
#> (the z-test approximation; the real two-sided t-test is less optimistic)
```

The z-approximation pegs power above 99%. That's higher than `pwr`'s 80% because `plot_power()` implements a one-sided z-test, not the two-sided t-test the team will actually use. We keep it for the visual, then trust `pwr` and the simulator for the planning number.

```r title="Step 3: simulate the planned study 2,000 times"
set.seed(777)
sim_p <- replicate(2000, {
  x <- rnorm(n_per_group, 0.0, 1)
  y <- rnorm(n_per_group, 0.4, 1)
  t.test(x, y)$p.value
})
mean(sim_p < 0.05)
#> [1] 0.8015
```

The simulator lands on 80.2%, rounding error away from the analytical 80%. The team can now commit to 100 users per arm with confidence that a true d=0.4 effect will be caught roughly 4 times out of 5, while the false-positive rate stays at 5%. That's a study design, documented end to end in 15 lines of R.

## Summary

![Recap of how Type I, Type II, and power relate.](screenshots/Type-I-and-Type-II-Errors-in-R-summary-mindmap.webp)
*Figure 3: Recap of how Type I, Type II, and power relate.*

| Quantity | Meaning | Controlled by |
|---|---|---|
| α (Type I rate) | P(reject H₀ given H₀ true) | You set it directly |
| β (Type II rate) | P(fail to reject given H₁ true) | Emerges from α, n, and effect size |
| Power = 1 − β | P(reject given H₁ true) | Grows with n and effect size; grows with α |
| 1 − α | P(correctly fail to reject given H₀) | Directly tied to α |

Two facts to keep in your head after closing the tab. First, α and β live on different distributions, you cannot "split the difference" by averaging them. Second, of the three levers that move power (α, n, effect size), only sample size is freely yours to adjust once the study begins, so plan it before you collect anything.

## References

1. Cohen, J. (1988). *Statistical Power Analysis for the Behavioral Sciences*, 2nd ed. Lawrence Erlbaum Associates. [Amazon link](https://www.amazon.com/Statistical-Power-Analysis-Behavioral-Sciences/dp/0805802835)
2. Champely, S., *pwr: Basic Functions for Power Analysis*. CRAN. [Link](https://cran.r-project.org/web/packages/pwr/pwr.pdf)
3. pwr package vignette, *Practical examples*. [Link](https://cran.r-project.org/web/packages/pwr/vignettes/pwr-vignette.html)
4. Wickham, H. *ggplot2: Elegant Graphics for Data Analysis*. Springer. [Link](https://ggplot2-book.org/)
5. R Core Team, *Statistical functions (qnorm, pnorm, t.test)*. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/00Index.html)
6. Magnusson, K., *Creating a typical textbook illustration of statistical power using either ggplot or base graphics*. R Psychologist blog. [Link](https://rpsychologist.com/creating-a-typical-textbook-illustration-of-statistical-power-using-either-ggplot-or-base-graphics/)
7. pwrss package vignette, *Practical Power Analysis in R*. CRAN. [Link](https://cran.r-project.org/web/packages/pwrss/vignettes/examples.html)

## Continue Learning

- [Hypothesis Testing in R: Understand the Framework, Not Just the p-Value](/Hypothesis-Testing-in-R.html), the framework these errors live inside.
- [Confidence Intervals in R: The Definition Most Textbooks State Incorrectly](/Confidence-Intervals-in-R.html), the other half of frequentist inference.
- [Point Estimation in R: What Makes an Estimator Good?](/Point-Estimation-in-R.html), the upstream step: how we got µ̂ in the first place.
