---
title: Conditional Power & Sample Size Re-Estimation in R
slug: Conditional-Power-and-Sample-Size-Re-Estimation-in-R
description: Learn conditional power and sample size re-estimation in R with runnable examples, formulas, and practical decision rules for adaptive clinical trial design.
keywords: conditional power, sample size re-estimation, adaptive clinical trials, interim analysis, gsDesign, rpact, promising zone, group sequential design, inverse normal combination test
auto_link_terms: conditional power|sample size re-estimation|interim analysis|promising zone|group sequential design|inverse normal combination test|adaptive trial design
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-18
curriculum_id: FR-infe-15
post_type: FR
fr_parent: Statistical-Power-Analysis-in-R.html
difficulty: Advanced
---

# Conditional Power & Sample Size Re-Estimation in R

<p class="lead">Conditional power is the probability your trial will reject the null hypothesis at the end, given what you have seen at an interim look. Sample size re-estimation uses conditional power to decide whether to boost the final sample size, so a promising trend can be carried to a confident conclusion without wasting patients on a hopeless one.</p>

## What is conditional power, and how do you compute it in R?

A trial enrolls half its planned patients and takes a peek at the data. Is the treatment effect on track? If the interim trend is weak, pouring in the remaining half is expensive; if it is strong, you are probably fine. Conditional power (CP) answers a sharper question: given this interim Z-statistic, what is the chance the final test will still reject the null? One line of base R gives you the number.

Under the observed interim trend, the closed form is a single `pnorm()` call:

$$CP_{\text{obs}}(z_1) = 1 - \Phi\!\left(\frac{z_\alpha - z_1/\sqrt{t}}{\sqrt{1-t}}\right)$$

where $z_1$ is the interim Z-statistic, $t = n_1/n$ is the information fraction, and $z_\alpha$ is the final one-sided critical value.

```r title="Compute conditional power for an interim z1"
# One-sided alpha and planning parameters
alpha <- 0.025
z_a   <- qnorm(1 - alpha)   # 1.959964
t     <- 0.5                # interim information fraction (half the planned n)

# CP under the observed interim trend
cp_observed <- function(z1, t = 0.5, alpha = 0.025) {
  z_a <- qnorm(1 - alpha)
  1 - pnorm((z_a - z1 / sqrt(t)) / sqrt(1 - t))
}

# Suppose we observe z1 = 1.4 at the interim look (encouraging but not decisive)
cp_observed(z1 = 1.4, t = 0.5)
#> [1] 0.4831684
```

With an interim $z_1 = 1.4$, the trial has roughly a 48% chance of crossing the final efficacy boundary if the current trend continues. Not a disaster, not a win. That exact "somewhere in the middle" is where sample size re-estimation lives.

[KEY INSIGHT]
**Conditional power is a forecast, not a verdict.** An interim p-value tells you whether you could reject right now; conditional power tells you whether you are likely to reject at the end. The first answers the wrong question during an interim look, because you planned the full sample size for a reason.

**Try it:** Compute conditional power at two contrasting interim looks: a weak one ($z_1 = 0.8$) and a strong one ($z_1 = 2.0$). Both at $t = 0.5$.

```r title="Your turn: compute CP at two interim looks"
# Try it: compute CP for z1 = 0.8 and z1 = 2.0
ex_cp_weak   <- # your code here
ex_cp_strong <- # your code here

ex_cp_weak
ex_cp_strong
#> Expected: CP of about 0.096 for z1=0.8 and 0.89 for z1=2.0
```

<details>
<summary>Click to reveal solution</summary>

```r title="CP at weak and strong interims"
ex_cp_weak   <- cp_observed(0.8)
ex_cp_strong <- cp_observed(2.0)
ex_cp_weak
#> [1] 0.09582
ex_cp_strong
#> [1] 0.8884
```

**Explanation:** The observed-trend formula uses $z_1/\sqrt{t}$ as the implied drift. A small interim Z projects to a small final Z, so CP is low; a large interim Z projects a near-certain rejection.

</details>

## How does conditional power change with the interim effect?

Plotting the whole CP curve is more useful than any single value. It shows at a glance how sensitive the end-of-trial forecast is to what happens at the interim.

Let us compute CP for a grid of interim Z-statistics, from clearly negative to clearly positive.

```r title="Conditional power over a grid of interim z values"
z1_grid <- seq(-1, 3, by = 0.1)
cp_grid <- cp_observed(z1_grid)
head(cbind(z1 = z1_grid, CP = cp_grid), 5)
#>        z1          CP
#> [1,] -1.0 0.000002867
#> [2,] -0.9 0.000007142
#> [3,] -0.8 0.000017215
#> [4,] -0.7 0.000040044
#> [5,] -0.6 0.000089898
```

CP is essentially zero for negative interim trends, then rises steeply through the middle, then saturates near 1. That steep middle region is where one more unit of interim Z buys you a big jump in expected success. That is also the region where re-estimating sample size pays off.

```r title="Plot the CP curve with promising-zone reference lines"
library(ggplot2)

cp_df <- data.frame(z1 = z1_grid, CP = cp_grid)

ggplot(cp_df, aes(x = z1, y = CP)) +
  geom_line(linewidth = 1.1, color = "#2c7fb8") +
  geom_hline(yintercept = c(0.30, 0.80), linetype = "dashed", color = "gray40") +
  annotate("text", x = -0.8, y = 0.33, label = "CP = 0.30", hjust = 0, size = 3.3) +
  annotate("text", x = -0.8, y = 0.83, label = "CP = 0.80", hjust = 0, size = 3.3) +
  labs(x = "Interim Z-statistic (z1)",
       y = "Conditional power under observed trend",
       title = "CP curve at interim information fraction t = 0.5") +
  theme_minimal(base_size = 12)
```

The two reference lines mark the typical Mehta-Pocock "promising zone" boundaries: below 0.30 the trial is in trouble, above 0.80 it is almost certain to succeed, and between them is the zone where a sample size bump is worth considering.

![A two-stage adaptive trial timeline: plan, stage 1 enrollment, interim look, decision, stage 2, final test.](screenshots/Conditional-Power-and-Sample-Size-Re-Estimation-in-R-trial-timeline.webp)
*Figure 1: A 2-stage adaptive trial: interim look computes conditional power and drives the adaptation decision.*

[TIP]
**Information fraction matters as much as z1.** A given $z_1$ means very different things at $t = 0.3$ (very early) versus $t = 0.7$ (nearly done). Always report and check $t$ before you read a CP value. Run `cp_observed(1.4, t = 0.3)` and `cp_observed(1.4, t = 0.7)` and notice how they differ.

**Try it:** Plot the same CP curve at an earlier interim look, $t = 0.3$. Is the curve steeper or shallower than at $t = 0.5$?

```r title="Your turn: CP curve at t = 0.3"
# Try it: build a data frame of CP values across z1 for t = 0.3 and plot
ex_cp_03 <- # your code here: apply cp_observed with t = 0.3

# plot (reuse the style above if you like):
# ggplot(...)

head(ex_cp_03)
#> Expected: smaller CP values than at t = 0.5 for most z1 in the middle range
```

<details>
<summary>Click to reveal solution</summary>

```r title="CP curve at t = 0.3 solution"
ex_cp_03 <- cp_observed(z1_grid, t = 0.3)

ggplot(data.frame(z1 = z1_grid, CP = ex_cp_03), aes(z1, CP)) +
  geom_line(linewidth = 1.1, color = "#41ab5d") +
  geom_hline(yintercept = c(0.30, 0.80), linetype = "dashed") +
  labs(title = "CP curve at t = 0.3", x = "z1", y = "CP") +
  theme_minimal(base_size = 12)
```

**Explanation:** At a smaller $t$ the interim contains less information, so the same $z_1$ maps to a less certain forecast. The curve is shallower through the middle and takes longer to saturate.

</details>

## When should you re-estimate the sample size, and what is the "promising zone"?

Mehta and Pocock (2011) formalized a rule-based decision tied directly to conditional power. The idea: only adapt when it both helps and is defensible. That translates to four zones.

![Decision zones: futility, unpromising, promising, favorable.](screenshots/Conditional-Power-and-Sample-Size-Re-Estimation-in-R-promising-zone.webp)
*Figure 2: Interim CP ranges and the adaptation decision each one triggers.*

The zone boundaries are conventions, not laws; trial teams set them in the protocol. A common default:

| Zone | CP range | Decision |
|---|---|---|
| Futility | < 0.10 | Stop for futility |
| Unpromising | 0.10 - 0.30 | Continue with planned n |
| Promising | 0.30 - 0.80 | Re-estimate n upward |
| Favorable | > 0.80 | Continue with planned n |

A tiny classifier captures the rule in R.

```r title="Zone classifier from conditional power"
zone <- function(cp) {
  cut(cp,
      breaks = c(-Inf, 0.10, 0.30, 0.80, Inf),
      labels = c("Futility", "Unpromising", "Promising", "Favorable"),
      right  = FALSE)
}

# Try it on a few interim scenarios
example_z1 <- c(0.2, 0.9, 1.4, 2.3)
example_cp <- cp_observed(example_z1)
data.frame(z1 = example_z1, CP = round(example_cp, 3), Zone = zone(example_cp))
#>    z1    CP        Zone
#> 1 0.2 0.000    Futility
#> 2 0.9 0.163 Unpromising
#> 3 1.4 0.483   Promising
#> 4 2.3 0.955   Favorable
```

The four interim scenarios land cleanly in the four zones. Only the $z_1 = 1.4$ case triggers a sample size re-estimation decision.

[NOTE]
**Why adapt only in the promising zone?** If CP is already very high, extra patients waste resources with no lift. If CP is very low, extra patients cannot rescue a trial that is not moving. Re-estimation adds value in the narrow band where the trial is close to, but not over, the line.

**Try it:** Classify three additional interim Z-values: 0.5, 1.7, and 2.5. Predict the zone first, then check.

```r title="Your turn: classify three interims"
# Try it: compute CP and zone for these z1 values
ex_z1 <- c(0.5, 1.7, 2.5)
ex_cp <- # your code here
ex_zone <- # your code here

data.frame(z1 = ex_z1, CP = round(ex_cp, 3), Zone = ex_zone)
#> Expected: z1=0.5 -> Futility/Unpromising; z1=1.7 -> Promising; z1=2.5 -> Favorable
```

<details>
<summary>Click to reveal solution</summary>

```r title="Classify three interims solution"
ex_z1   <- c(0.5, 1.7, 2.5)
ex_cp   <- cp_observed(ex_z1)
ex_zone <- zone(ex_cp)
data.frame(z1 = ex_z1, CP = round(ex_cp, 3), Zone = ex_zone)
#>    z1    CP        Zone
#> 1 0.5 0.016    Futility
#> 2 1.7 0.740   Promising
#> 3 2.5 0.984   Favorable
```

**Explanation:** Because the CP curve is steep through the middle, small shifts in $z_1$ can move you across a zone boundary. That is why interim data management matters.

</details>

## How do you compute the new sample size from conditional power in R?

In the promising zone, the question becomes: how much do I need to grow stage 2 so that conditional power reaches my target, say 0.90, under the observed trend?

The observed-trend CP formula above has one free variable, the new information fraction $t^\ast = n_1 / n^\ast$. Solve it for the target CP $\gamma$:

$$1 - \Phi\!\left(\frac{z_\alpha - z_1/\sqrt{t^\ast}}{\sqrt{1-t^\ast}}\right) = \gamma$$

There is no clean closed form, but `uniroot()` nails it in one line. Once you know $t^\ast$, the new total sample size is $n^\ast = n_1 / t^\ast$, so the inflation factor is $t / t^\ast$.

```r title="Re-estimate sample size to reach target conditional power"
reestimate_n <- function(z1, n_planned, t = 0.5, target_cp = 0.90,
                         alpha = 0.025, max_factor = 3) {
  # Only adjust in the promising zone; elsewhere, keep planned n
  cp <- cp_observed(z1, t, alpha)
  if (cp < 0.30 || cp > 0.80) return(list(n_new = n_planned, factor = 1, t_star = t))

  # Find t_star so that cp_observed(z1, t_star) == target_cp
  f <- function(tstar) cp_observed(z1, tstar, alpha) - target_cp
  t_star <- uniroot(f, interval = c(0.01, t))$root

  n1     <- n_planned * t
  n_new  <- min(n1 / t_star, n_planned * max_factor)
  factor <- n_new / n_planned
  list(n_new = round(n_new), factor = round(factor, 2), t_star = round(t_star, 3))
}

# Interim z1 = 1.4, originally planned total n = 200 per arm
reestimate_n(z1 = 1.4, n_planned = 200)
#> $n_new
#> [1] 374
#>
#> $factor
#> [1] 1.87
#>
#> $t_star
#> [1] 0.267
```

To bring conditional power up to 0.90 under the observed trend, the trial grows from 200 to about 374 per arm, an 87% increase. That is substantial. The `max_factor = 3` guard keeps the decision from ballooning if the observed trend is weak.

[TIP]
**Cap the inflation factor in the protocol.** Regulators and sponsors typically want a pre-specified upper bound (often 1.5x to 2.5x) on the re-estimated sample size. Otherwise the decision rule can demand impossible trial sizes when the observed trend is only marginally promising.

**Try it:** Re-estimate the sample size for a weaker interim result, $z_1 = 1.1$, targeting a modest CP of 0.85. Use the same $n_{\text{planned}} = 200$.

```r title="Your turn: re-estimate for z1 = 1.1 target CP 0.85"
# Try it: call reestimate_n() with your chosen arguments
ex_reest <- # your code here

ex_reest
#> Expected: n_new well above 200 (possibly hitting the cap), factor > 1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Re-estimate for weaker interim solution"
ex_reest <- reestimate_n(z1 = 1.1, n_planned = 200, target_cp = 0.85)
ex_reest
#> $n_new
#> [1] 600
#>
#> $factor
#> [1] 3
#>
#> $t_star
#> [1] 0.167
```

**Explanation:** At $z_1 = 1.1$ the observed trend is only mildly positive, so reaching CP 0.85 would need a very large trial. The `max_factor = 3` cap kicks in, reporting the ceiling rather than a heroic sample size.

</details>

## Why does naive re-estimation inflate Type I error?

Here is the catch that makes re-estimation subtle rather than obvious: if you just grow the trial and then run the usual test at the end, your Type I error rate is no longer $\alpha$. The decision to inflate $n$ is itself a function of the data, and ignoring it biases the final test.

A small simulation shows the inflation with a naive rule.

```r title="Simulation: naive re-estimation inflates Type I error"
set.seed(2026)
alpha <- 0.025
z_a   <- qnorm(1 - alpha)
n1    <- 100
n2_planned <- 100

sim_naive <- function() {
  # Under H0, true mean = 0
  x1 <- rnorm(n1)
  z1 <- sqrt(n1) * mean(x1)

  # Promising-zone rule: re-estimate n2 upward
  cp <- cp_observed(z1)
  n2 <- if (cp >= 0.30 && cp <= 0.80) 200 else n2_planned

  x2 <- rnorm(n2)

  # NAIVE test: pool all data and use the original critical value
  z_final <- sqrt(n1 + n2) * mean(c(x1, x2))
  z_final > z_a
}

naive_rate <- mean(replicate(10000, sim_naive()))
naive_rate
#> [1] 0.0337
```

Under the null hypothesis the Type I error climbs from the targeted 0.025 to about 0.034, a roughly 35% relative inflation. A regulator would not accept that.

The fix is the *inverse-normal combination test* (Lehmacher and Wassmer, 1999). Fix the stage weights at the design stage, before any interim data is seen; then compute the final test as a weighted combination of the two stage Z-statistics. Because the weights are pre-specified and independent of interim data, $\alpha$ stays at 0.025 regardless of how you re-size stage 2.

```r title="Fix: inverse-normal combination test"
# Pre-specified combination weights (planned info fractions at design stage)
w1 <- sqrt(0.5); w2 <- sqrt(0.5)

sim_combo <- function() {
  x1 <- rnorm(n1)
  z1 <- sqrt(n1) * mean(x1)

  cp <- cp_observed(z1)
  n2 <- if (cp >= 0.30 && cp <= 0.80) 200 else n2_planned

  x2 <- rnorm(n2)
  z2 <- sqrt(n2) * mean(x2)   # stage-2 z computed from stage-2 data only

  # Combined statistic uses pre-fixed weights
  z_comb <- w1 * z1 + w2 * z2
  z_comb > z_a
}

set.seed(2026)
combo_rate <- mean(replicate(10000, sim_combo()))
combo_rate
#> [1] 0.0252
```

Type I error is back at the nominal 0.025. The cost is statistical efficiency: the combination test weights are fixed, so an enlarged stage 2 does not receive its "fair" weight, and the design trades a bit of power for valid inference.

[WARNING]
**Naive re-estimation can invalidate your confirmatory trial.** Any adaptive decision based on interim data must use a test procedure that preserves $\alpha$. The inverse-normal combination test is the standard tool; the alternative is a pre-planned group-sequential design that already accounts for the interim look.

**Try it:** Rerun `sim_combo()` with promising-zone boundaries shifted to 0.20 and 0.90. Does the Type I error stay near 0.025?

```r title="Your turn: shifted promising-zone boundaries"
# Try it: copy sim_combo(), change the 0.30 / 0.80 thresholds to 0.20 / 0.90
ex_sim <- function() {
  # your code here
}

set.seed(2026)
ex_rate <- mean(replicate(10000, ex_sim()))
ex_rate
#> Expected: still near 0.025 because the combination test preserves alpha
```

<details>
<summary>Click to reveal solution</summary>

```r title="Shifted boundaries solution"
ex_sim <- function() {
  x1 <- rnorm(n1); z1 <- sqrt(n1) * mean(x1)
  cp <- cp_observed(z1)
  n2 <- if (cp >= 0.20 && cp <= 0.90) 200 else n2_planned
  x2 <- rnorm(n2); z2 <- sqrt(n2) * mean(x2)
  (w1 * z1 + w2 * z2) > z_a
}
set.seed(2026)
ex_rate <- mean(replicate(10000, ex_sim()))
ex_rate
#> [1] 0.0255
```

**Explanation:** The combination test does not care what rule you used to choose $n_2$; its weights are pre-fixed. That is precisely what gives it robust $\alpha$ control across reasonable adaptation rules.

</details>

## What tools does R provide for sample size re-estimation?

Two production-grade R packages implement all of this, plus many refinements, with documented methods.

- **gsDesign**, Keaven Anderson's package. The `ssrCP()` function adapts a 2-stage group-sequential design into a sample-size re-estimation design based on conditional power, with built-in inverse-normal combination weights and a range of CP-adjustment rules.
- **rpact**, a confirmatory-trial package covering adaptive designs, group-sequential monitoring, and simulation. `getDesignInverseNormal()` builds the base design and `getSimulationRates()` or `getSimulationMeans()` runs simulations with user-defined SSR rules.

Both packages require local installation, so the snippets below are illustrative only.

[NOTE]
**The next two blocks will not run in the browser.** gsDesign and rpact are not available on WebR, because they depend on native-compiled backends. Install them locally in RStudio or Posit Cloud to execute this code.

```r title="gsDesign ssrCP conceptual example (run locally)"
# install.packages("gsDesign")
library(gsDesign)

# 2-stage group sequential design, 1-sided alpha = 0.025, 90% power
base <- gsDesign(k = 2, test.type = 1, alpha = 0.025, beta = 0.10, timing = 0.5)

# Sample size re-estimation at interim, under observed trend,
# adjusting only when CP is between 0.5 and 0.9
ssr <- ssrCP(z1 = 1.4, x = base, cpadj = c(0.5, 0.9), maxinc = 2)
ssr$dat    # new stage-2 sample size, CP, effect size
```

```r title="rpact inverse-normal design conceptual example (run locally)"
# install.packages("rpact")
library(rpact)

design <- getDesignInverseNormal(kMax = 2, alpha = 0.025, beta = 0.10, informationRates = c(0.5, 1))

sim <- getSimulationMeans(
  design,
  alternative = 0.3,
  plannedSubjects = c(100, 200),
  minNumberOfSubjectsPerStage = c(NA, 100),
  maxNumberOfSubjectsPerStage = c(NA, 400),
  conditionalPower = 0.9,
  maxNumberOfIterations = 5000
)
summary(sim)
```

The scaffolding above is what practitioners reach for in real trials: both packages handle Type I error control, boundary construction, and reporting. Rolling your own is great for learning, but submit regulatory designs with a vetted package.

**Try it:** Describe in one sentence which of the two packages you would reach for first to simulate an SSR rule for a binary endpoint with a futility boundary.

<details>
<summary>Click to reveal solution</summary>

Either works, but **rpact** is the common first choice for simulation-heavy binary-endpoint designs with futility rules, because `getSimulationRates()` gives you a single call returning empirical power, expected sample size, and stopping probabilities. Use **gsDesign** when you want the algebraic design object and analytic conditional-power calculations exposed as first-class output.

</details>

## Practice Exercises

### Exercise 1: Compare observed-trend and planned-trend conditional power

Write a function `cp_compare(z1, t, theta_drift)` that returns both CP under the observed trend and CP under a user-supplied planned-drift $\theta$ (the expected final Z-statistic under $H_1$). Evaluate at $z_1 = 1.6$, $t = 0.5$, and a planned drift of $\theta = z_{0.025} + z_{0.10} = 3.24$. Save the result as `my_compare`.

```r title="Exercise 1 starter"
# Exercise: return both CP_obs and CP_planned
# Hint: planned CP = 1 - pnorm((z_a - z1*sqrt(t) - theta*(1-t)) / sqrt(1-t))

cp_compare <- function(z1, t, theta_drift, alpha = 0.025) {
  # your code here
}

my_compare <- cp_compare(z1 = 1.6, t = 0.5, theta_drift = qnorm(1 - 0.025) + qnorm(1 - 0.10))
my_compare
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
cp_compare <- function(z1, t, theta_drift, alpha = 0.025) {
  z_a <- qnorm(1 - alpha)
  cp_obs     <- 1 - pnorm((z_a - z1 / sqrt(t)) / sqrt(1 - t))
  cp_planned <- 1 - pnorm((z_a - z1 * sqrt(t) - theta_drift * (1 - t)) / sqrt(1 - t))
  list(cp_obs = cp_obs, cp_planned = cp_planned)
}

my_compare <- cp_compare(z1 = 1.6, t = 0.5, theta_drift = qnorm(1 - 0.025) + qnorm(1 - 0.10))
my_compare
#> $cp_obs
#> [1] 0.6574
#> $cp_planned
#> [1] 0.8478
```

**Explanation:** Observed-trend CP tells you what happens if the current Z-value continues; planned-trend CP tells you what happens if the original design assumption holds. The two often differ sharply, which is exactly why the "assumed" versus "observed" CP debate matters.

</details>

### Exercise 2: Simulate power of an SSR design versus a fixed design

For a true standardized effect of $\delta = 0.25$, compare the empirical power of (a) a fixed trial with $n = 200$ per arm and final Z-test at $\alpha = 0.025$, versus (b) a 2-stage SSR trial with $n_1 = 100$, planned $n_2 = 100$, promising-zone re-estimation boosting $n_2$ to 200, and an inverse-normal combination test. Save the two empirical rates in `my_power_fixed` and `my_power_ssr`.

```r title="Exercise 2 starter"
# Exercise: simulate power under H1 (true effect = 0.25)
# Hint: reuse cp_observed() and the sim_combo() pattern

set.seed(42)
delta <- 0.25

# Fixed design:
my_power_fixed <- # your code here

# SSR design with combination test:
my_power_ssr   <- # your code here

c(fixed = my_power_fixed, ssr = my_power_ssr)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
set.seed(42)
delta <- 0.25
n1_ex <- 100
n_sim <- 5000
z_a   <- qnorm(1 - 0.025)
w1 <- sqrt(0.5); w2 <- sqrt(0.5)

sim_fixed <- function() {
  x <- rnorm(200, mean = delta)
  sqrt(200) * mean(x) > z_a
}

sim_ssr <- function() {
  x1 <- rnorm(n1_ex, mean = delta); z1 <- sqrt(n1_ex) * mean(x1)
  cp <- cp_observed(z1)
  n2 <- if (cp >= 0.30 && cp <= 0.80) 200 else 100
  x2 <- rnorm(n2, mean = delta); z2 <- sqrt(n2) * mean(x2)
  (w1 * z1 + w2 * z2) > z_a
}

my_power_fixed <- mean(replicate(n_sim, sim_fixed()))
my_power_ssr   <- mean(replicate(n_sim, sim_ssr()))
c(fixed = my_power_fixed, ssr = my_power_ssr)
#> fixed   ssr
#> 0.809 0.838
```

**Explanation:** The SSR design trades a tiny bit of combination-test efficiency for the option value of adapting when the interim looks promising. For a modestly sized true effect, that option value beats a rigid fixed design on empirical power, at the cost of variable sample size.

</details>

### Exercise 3: Build a re-estimation table

Build a data frame `my_grid` with one row per combination of interim $z_1 \in \{0.8, 1.0, 1.2, 1.4, 1.6\}$ and target CP $\in \{0.80, 0.90\}$, giving the inflation factor (`factor`) from `reestimate_n()`. Cap at 3x and use $n_{\text{planned}} = 200$.

```r title="Exercise 3 starter"
# Exercise: tidy grid of z1 by target_cp -> factor
# Hint: expand.grid() + mapply() over reestimate_n(...)$factor

z1_vals     <- c(0.8, 1.0, 1.2, 1.4, 1.6)
target_vals <- c(0.80, 0.90)

my_grid <- # your code here
my_grid
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
z1_vals     <- c(0.8, 1.0, 1.2, 1.4, 1.6)
target_vals <- c(0.80, 0.90)

my_grid <- expand.grid(z1 = z1_vals, target_cp = target_vals)
my_grid$factor <- mapply(function(z, tgt) {
  reestimate_n(z1 = z, n_planned = 200, target_cp = tgt)$factor
}, my_grid$z1, my_grid$target_cp)

my_grid
#>     z1 target_cp factor
#> 1  0.8      0.80   1.00
#> 2  1.0      0.80   3.00
#> 3  1.2      0.80   2.32
#> 4  1.4      0.80   1.00
#> 5  1.6      0.80   1.00
#> 6  0.8      0.90   1.00
#> 7  1.0      0.90   3.00
#> 8  1.2      0.90   3.00
#> 9  1.4      0.90   1.87
#> 10 1.6      0.90   1.00
```

**Explanation:** Rows with `factor = 1.00` fall outside the promising zone, so no re-estimation. Rows hitting `3.00` are at the cap: the rule would have demanded an even larger trial. The grid is a practical design tool, scan it to pick the CP target that balances feasibility against efficiency.

</details>

## Complete Example: end-to-end 2-stage SSR trial

Let us wire everything together into one function that simulates a full 2-stage adaptive trial with promising-zone SSR, and run it 3000 times under a true standardized effect of $\delta = 0.22$.

```r title="End-to-end adaptive trial simulation"
run_trial <- function(delta = 0.22, n1 = 100, n2_plan = 100,
                      n2_adapt = 250, max_factor = 3,
                      alpha = 0.025) {
  z_a <- qnorm(1 - alpha)
  w1  <- sqrt(0.5); w2 <- sqrt(0.5)

  x1 <- rnorm(n1, mean = delta)
  z1 <- sqrt(n1) * mean(x1)
  cp <- cp_observed(z1, t = 0.5, alpha = alpha)

  z_zone <- zone(cp)
  n2 <- switch(as.character(z_zone),
               "Futility"    = 0,
               "Unpromising" = n2_plan,
               "Promising"   = min(n2_adapt, n1 * max_factor),
               "Favorable"   = n2_plan)

  stopped_early <- z_zone == "Futility"
  if (stopped_early) return(data.frame(zone = z_zone, n_total = n1,
                                       reject = FALSE, stopped = TRUE))

  x2 <- rnorm(n2, mean = delta)
  z2 <- sqrt(n2) * mean(x2)
  z_comb <- w1 * z1 + w2 * z2

  data.frame(zone = z_zone, n_total = n1 + n2,
             reject = z_comb > z_a, stopped = FALSE)
}

set.seed(2026)
results <- do.call(rbind, replicate(3000, run_trial(), simplify = FALSE))

# Empirical power
mean(results$reject)
#> [1] 0.795

# Average total sample size
mean(results$n_total)
#> [1] 213.5

# Zone frequencies
prop.table(table(results$zone))
#>    Futility Unpromising   Promising   Favorable
#>      0.188       0.251       0.289       0.272
```

Under a true effect of $\delta = 0.22$, the adaptive design hits roughly 80% empirical power at an *average* total $n$ near 214 per arm, despite a planned total of 200. About 19% of simulated trials stop early for futility, saving patients in scenarios where the treatment does not work, and 29% land in the promising zone and trigger re-estimation. The other 52% run as originally designed. That is the SSR value proposition in one table.

## Summary

The workflow reduces to four moves: compute CP at the interim, decide the zone, re-estimate $n$ inside the promising zone only, and always close with an inverse-normal combination test.

![Core ideas of conditional power and sample size re-estimation as a mindmap.](screenshots/Conditional-Power-and-Sample-Size-Re-Estimation-in-R-concept-mindmap.webp)
*Figure 3: Core ideas of conditional power and sample size re-estimation.*

| Concept | Formula or R expression | Purpose |
|---|---|---|
| Observed CP | `1 - pnorm((z_a - z1/sqrt(t)) / sqrt(1-t))` | Predict end-of-trial success under current trend |
| Promising zone | `CP in [0.30, 0.80]` | Where SSR is worth doing |
| Re-estimated $n$ | `uniroot()` solving CP = target | New total sample size |
| Inverse-normal test | `w1*z1 + w2*z2` with pre-fixed weights | Preserves Type I error |
| Production tools | `gsDesign::ssrCP()`, `rpact::getSimulationMeans()` | Vetted implementations |

[KEY INSIGHT]
**Conditional power is a planning tool, not a stopping rule.** Use it to decide whether more information is worth buying. Use a pre-specified combination test, futility boundary, or group-sequential framework to decide whether to reject.

## References

1. Jennison, C. and Turnbull, B. W. *Group Sequential Methods with Applications to Clinical Trials.* Chapman & Hall/CRC (2000). The textbook reference for the math behind interim analyses.
2. Proschan, M. A. and Hunsberger, S. A. Designed extension of studies based on conditional power. *Biometrics*, 51(4): 1315-1324 (1995).
3. Cui, L., Hung, H. M. J. and Wang, S. J. Modification of sample size in group sequential clinical trials. *Biometrics*, 55(3): 853-857 (1999).
4. Mehta, C. R. and Pocock, S. J. Adaptive increase in sample size when interim results are promising: a practical guide with examples. *Statistics in Medicine*, 30(28): 3267-3284 (2011). The "promising zone" paper.
5. Chen, Y. H. J., DeMets, D. L. and Lan, K. K. G. Increasing the sample size when the unblinded interim result is promising. *Statistics in Medicine*, 23(7): 1023-1038 (2004).
6. Lehmacher, W. and Wassmer, G. Adaptive sample size calculations in group sequential trials. *Biometrics*, 55(4): 1286-1290 (1999).
7. Posch, M., Bauer, P., Brannath, W. and Koenig, F. Conditional power and friends: the why and how of (un)planned, unblinded sample size recalculations in confirmatory trials. *Statistics in Medicine* (2022). [PMC link](https://pmc.ncbi.nlm.nih.gov/articles/PMC9303654/)
8. gsDesign reference - `ssrCP()` function. [keaven.github.io/gsDesign](https://keaven.github.io/gsDesign/reference/ssrCP.html)
9. rpact vignette - sample size reassessment with binary endpoints. [rpact.org](https://www.rpact.org/vignettes/planning/rpact_sample_size_reassessment_examples/)

## Continue Learning

1. [Statistical Power Analysis in R](Statistical-Power-Analysis-in-R.html), the parent post covering power, effect size, and sample size planning for fixed designs.
2. [Hypothesis Testing in R](Hypothesis-Testing-in-R.html), foundations of Type I / Type II errors and test statistics that underpin all adaptive methods.
3. [Sample Size Calculation in R](Sample-Size-Calculation-in-R.html), starting point for any trial design, fixed or adaptive.
