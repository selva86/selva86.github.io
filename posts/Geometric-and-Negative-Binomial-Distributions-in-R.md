---
title: "Geometric & Negative Binomial Distributions in R: Waiting Time Models"
slug: "Geometric-and-Negative-Binomial-Distributions-in-R"
description: "Model waiting time in R with the geometric and negative binomial distributions. Learn dgeom(), dnbinom(), both parameterizations, and when to pick each."
keywords: "geometric distribution R, negative binomial distribution R, dgeom, dnbinom, rnbinom, waiting time distribution, failures until success, probability distribution R"
auto_link_terms: "geometric distribution|negative binomial distribution|dgeom()|dnbinom()|rgeom()|rnbinom()|pgeom()|pnbinom()|waiting time distribution"
auto_link_case_sensitive: true
mathjax: true
webr: true
date: "2026-04-17"
curriculum_id: "FR-prob-8"
post_type: "FR"
fr_parent: "Binomial-and-Poisson-Distributions-in-R.html"
difficulty: "Intermediate"
---

# Geometric & Negative Binomial Distributions in R: Waiting Time Models

<p class="lead">The geometric distribution counts how many failures happen before the first success; the negative binomial counts failures before the r-th success. Together they model "waiting time" in trial-based processes. This guide shows both in R with dgeom(), dnbinom(), and their simulation cousins.</p>

## How do we count trials until a success?

Imagine you are cold-calling prospects. Each call either lands a meeting (success) or it doesn't (failure). A natural question is: how many calls will you make before the first yes? The geometric distribution answers exactly that. In R, `dgeom(x, prob)` returns the probability of seeing exactly `x` failures before the first success — no hand-derived formula, just one function call.

Let's compute the probability of three rejections then a yes when each call has a 25% chance of success, and also the long-run average number of rejections before a yes.

```r
# Geometric payoff: exactly 3 failures before the first success
p <- 0.25
prob_exact_3 <- dgeom(x = 3, prob = p)
prob_exact_3
#> [1] 0.1054688

# Expected number of failures before the first success
mean_failures <- (1 - p) / p
mean_failures
#> [1] 3
```

There is about a 10.5% chance that you face exactly three rejections before landing the first meeting. On average, you should expect three rejections before a yes at this success rate. Those two numbers — the probability of a specific wait and the expected wait — are the bread and butter of every question the geometric distribution answers.

[KEY INSIGHT]
**R's `dgeom()` counts failures, not total trials.** A value of `x = 3` means "three rejections then a success on the fourth call," so the total call count is `x + 1`. Many textbooks count the trial index instead — if you see a formula that starts at 1, translate by subtracting one before calling `dgeom()`.

**Try it:** Compute the probability of exactly 5 failures before the first success when each trial has `p = 0.30`. Save it to `ex_geom_prob`.

```r
# Try it: P(5 failures before first success) when p = 0.30
ex_geom_prob <- # your code here

ex_geom_prob
#> Expected: 0.05042
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_geom_prob <- dgeom(x = 5, prob = 0.30)
ex_geom_prob
#> [1] 0.05042
```

**Explanation:** `dgeom(5, 0.30)` evaluates the geometric PMF at `x = 5`: the chance of five consecutive failures followed by a success.

</details>

## What is the geometric distribution?

The geometric distribution describes the number of failures before the first success in a sequence of independent Bernoulli trials, each with success probability `p`. Its probability mass function is simple enough to remember:

$$P(X = x) = (1 - p)^x \, p, \quad x = 0, 1, 2, \ldots$$

Where:
- $x$ = number of failures before the first success
- $p$ = probability of success on each trial

The mean and variance follow directly:

$$E[X] = \frac{1 - p}{p}, \qquad \text{Var}(X) = \frac{1 - p}{p^2}$$

Larger `p` means fewer expected failures and a tighter distribution. Let's visualize how the PMF changes when success becomes easier.

```r
# PMF for p = 0.25 vs p = 0.5
library(ggplot2)
library(dplyr)

geom_df <- expand.grid(x = 0:15, p = c(0.25, 0.50)) |>
  mutate(prob = dgeom(x, prob = p),
         p_label = paste0("p = ", p))

ggplot(geom_df, aes(x = x, y = prob, fill = p_label)) +
  geom_col(position = "dodge") +
  labs(title = "Geometric PMF: failures before first success",
       x = "Number of failures (x)", y = "P(X = x)") +
  theme_minimal()
```

At `p = 0.5` the mass piles up on zero — most of the time the very first trial is the success. At `p = 0.25` the distribution has a long right tail because rare events take longer to wait for. The bigger `p`, the shorter the wait.

[NOTE]
**Two conventions compete for "geometric distribution."** R counts failures before the first success (support starts at 0). Many probability textbooks count the trial number *of* the first success (support starts at 1). The two versions differ by exactly one — if your formula gives a mean of `1/p`, it is using the trial-number version; R's mean is `(1 - p)/p`.

**Try it:** Use the formula to predict the mean number of failures before the first success for `p = 0.2`, then confirm it with a large simulation using `rgeom()`. Save the theoretical mean to `ex_mean_theory` and the simulated mean to `ex_mean_sim`.

```r
# Try it: theoretical vs simulated geometric mean
set.seed(11)

ex_mean_theory <- # your formula here
ex_mean_sim <- # simulate 50,000 draws and take the mean

c(theory = ex_mean_theory, sim = ex_mean_sim)
#> Expected: roughly c(theory = 4, sim ~ 4)
```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(11)
ex_mean_theory <- (1 - 0.2) / 0.2
ex_mean_sim <- mean(rgeom(n = 50000, prob = 0.2))
c(theory = ex_mean_theory, sim = ex_mean_sim)
#> theory    sim
#>  4.000  3.996
```

**Explanation:** The formula `(1 - p)/p` gives 4 exactly; `rgeom()` draws 50,000 samples, whose average should hover near 4 thanks to the law of large numbers.

</details>

## How does the negative binomial extend the geometric?

The negative binomial distribution generalizes the geometric by waiting for more than one success. Instead of "how many failures before the first yes?" it asks "how many failures before the r-th yes?" When `r = 1`, you are back to the geometric. This makes the geometric a special case, not a separate idea.

![How the geometric distribution is the r = 1 case of the negative binomial.](screenshots/Geometric-and-Negative-Binomial-Distributions-in-R-relationship-flow.webp)
*Figure 1: How the geometric distribution is the r = 1 case of the negative binomial.*

In R, `dnbinom(x, size, prob)` gives the probability of exactly `x` failures before the `size`-th success. Let's compute the probability of three rejections before landing the second meeting.

```r
# P(3 failures before 2nd success) at p = 0.25
prob_nb_3 <- dnbinom(x = 3, size = 2, prob = p)
prob_nb_3
#> [1] 0.07910156
```

There is about a 7.9% chance that you face exactly three rejections before closing two meetings. Smaller than the geometric case (10.5% for zero failures before the second success would be wrong to compare; what matters is the shape shifts right as `size` grows).

To see that shift, plot the PMF for three values of `size` on one chart.

```r
# NB PMF for size = 1, 3, 5 at p = 0.25
nb_df <- expand.grid(x = 0:30, size = c(1, 3, 5)) |>
  mutate(prob = dnbinom(x, size = size, prob = 0.25),
         size_label = paste0("size = ", size))

ggplot(nb_df, aes(x = x, y = prob, colour = size_label)) +
  geom_line(linewidth = 1) +
  geom_point() +
  labs(title = "Negative binomial PMF at p = 0.25",
       x = "Number of failures (x)", y = "P(X = x)") +
  theme_minimal()
```

At `size = 1`, the curve is the geometric — monotonically decreasing from zero. As `size` grows, the mode shifts right and the distribution gets wider, because waiting for more successes means enduring more rejections on the way.

[KEY INSIGHT]
**`size = 1` is the geometric; larger `size` means longer waits.** Every negative binomial PMF at `size = 1` equals the geometric PMF with the same `prob`. Use that mental shortcut to sanity-check your `dnbinom()` calls — if `size = 1` and the answer doesn't match `dgeom()`, something is off.

**Try it:** Compute the probability of exactly 10 failures before the 3rd success when `p = 0.4`. Save it to `ex_nb_prob`.

```r
# Try it: P(10 failures before 3rd success) at p = 0.4
ex_nb_prob <- # your code here

ex_nb_prob
#> Expected: 0.04519
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_nb_prob <- dnbinom(x = 10, size = 3, prob = 0.4)
ex_nb_prob
#> [1] 0.04519337
```

**Explanation:** `dnbinom(10, size = 3, prob = 0.4)` evaluates the negative binomial PMF where you wait for three successes with per-trial probability 0.4, and see exactly 10 failures on the way.

</details>

## Which parameterization should you use in R?

R's `dnbinom()` accepts two mutually exclusive parameterizations: `size + prob` (classic) or `size + mu` (regression-style, where `mu` is the expected count). The two are equivalent, linked by:

$$\mu = \frac{\text{size} \cdot (1 - p)}{p}, \qquad p = \frac{\text{size}}{\text{size} + \mu}$$

The `mu` form is what `MASS::glm.nb()` and modern regression packages report, so if you ever inspect a fitted NB model, that's the form you'll see. The `prob` form matches every probability textbook.

![Two equivalent ways to parameterize dnbinom() in R.](screenshots/Geometric-and-Negative-Binomial-Distributions-in-R-parameterization.webp)
*Figure 2: Two equivalent ways to parameterize `dnbinom()` in R.*

Let's verify they give the same answer for one example.

```r
# Same probability, two parameterizations
mu <- 9       # expected count of failures
size_val <- 3
prob_from_mu <- size_val / (size_val + mu)

classic_form <- dnbinom(x = 10, size = size_val, prob = prob_from_mu)
mu_form      <- dnbinom(x = 10, size = size_val, mu = mu)
c(classic = classic_form, mu_form = mu_form)
#> classic   mu_form
#> 0.04137  0.04137
```

Both calls return the same probability. The takeaway: you can report NB results either way without changing the math. Pick `prob` if you're teaching theory, `mu` if you're matching a regression output.

[WARNING]
**Do not pass both `prob` and `mu` to `dnbinom()`.** If you supply both, R silently uses `mu` and ignores `prob` — no warning, no error, just quietly wrong numbers if you expected `prob` to win. Always set exactly one.

**Try it:** Convert `size = 5`, `mu = 12` into the matching `prob`, and verify that `dnbinom(8, size = 5, prob = <your prob>)` equals `dnbinom(8, size = 5, mu = 12)`. Save the probability to `ex_prob_convert`.

```r
# Try it: convert mu = 12 into prob for size = 5
ex_size <- 5
ex_mu <- 12
ex_prob_convert <- # your formula here

c(from_prob = dnbinom(8, size = ex_size, prob = ex_prob_convert),
  from_mu   = dnbinom(8, size = ex_size, mu = ex_mu))
#> Expected: both equal ~0.0738
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_size <- 5
ex_mu <- 12
ex_prob_convert <- ex_size / (ex_size + ex_mu)   # 5 / 17

c(from_prob = dnbinom(8, size = ex_size, prob = ex_prob_convert),
  from_mu   = dnbinom(8, size = ex_size, mu = ex_mu))
#> from_prob   from_mu
#>    0.0738    0.0738
```

**Explanation:** The formula `prob = size / (size + mu)` inverts `mu = size(1 - p)/p`. Both `dnbinom()` calls return the same density because they describe the same distribution.

</details>

## How do you visualize and simulate these distributions?

Simulation is the fastest way to build intuition. `rgeom(n, prob)` draws `n` independent geometric samples, and `rnbinom(n, size, prob)` does the same for the negative binomial. Each draw is a single waiting time.

```r
# 10,000 geometric samples at p = 0.25
set.seed(42)
sim_geom <- rgeom(n = 10000, prob = p)

hist(sim_geom, breaks = 40, col = "steelblue",
     main = "Simulated geometric waits, p = 0.25",
     xlab = "Failures before first success")
```

The histogram's shape matches the theoretical PMF from earlier — most runs end fast, but a long tail shows the occasional unlucky stretch of many rejections. Simulation confirms what the formula predicts.

A quick sanity check: the empirical mean should be close to the theoretical mean `(1 - p)/p = 3`.

```r
# Empirical vs theoretical
mean_sim <- mean(sim_geom)
mean_theory <- (1 - p) / p
c(empirical = mean_sim, theoretical = mean_theory)
#>   empirical theoretical
#>      3.009        3.000
```

The simulated mean of 3.009 is within rounding of the exact value 3. With 10,000 draws, you would be suspicious if they disagreed by more than a few hundredths.

[TIP]
**Always `set.seed()` before any random operation.** It lets readers reproduce your exact numbers and makes debugging simulations tractable. Pick a seed per analysis (not always 42) so different sections of a script don't accidentally share the same random stream.

**Try it:** Simulate 1,000 geometric draws with `p = 0.1`, set seed `123`, and compute the mean. Save to `ex_sim_mean`. The theoretical mean is `(1 - 0.1)/0.1 = 9`.

```r
# Try it: simulate and check mean
set.seed(123)
ex_sim_mean <- # your simulation here

ex_sim_mean
#> Expected: ~9 (around 8.8 to 9.2 with 1000 draws)
```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(123)
ex_sim_mean <- mean(rgeom(n = 1000, prob = 0.1))
ex_sim_mean
#> [1] 9.012
```

**Explanation:** `rgeom(1000, 0.1)` draws 1,000 samples, each a waiting time until the first success at 10% probability. The empirical average hovers near the theoretical 9.

</details>

## When should you use the negative binomial in modeling?

The negative binomial earns its keep with **overdispersed counts** — real-world count data whose variance is bigger than the mean. The Poisson distribution assumes variance equals mean, which rarely holds in observational data: doctor visits per patient, insurance claims per policy, errors per session. When variance exceeds mean, Poisson confidence intervals are too narrow and p-values too optimistic.

The NB fixes this. Its variance formula is:

$$\text{Var}(X) = \mu + \frac{\mu^2}{\text{size}}$$

Where:
- $\mu$ = the mean count
- $\text{size}$ = the dispersion parameter (smaller `size` → more overdispersion; `size = ∞` collapses to Poisson)

So NB variance is always `mu` plus an extra term, making it strictly greater than the Poisson variance at the same mean. Let's see that in one comparison.

```r
# Same mean, different variance: Poisson vs NB
set.seed(7)
target_mean <- 5

pois_sim <- rpois(n = 20000, lambda = target_mean)
nb_sim   <- rnbinom(n = 20000, size = 2, mu = target_mean)

c(pois_mean = mean(pois_sim), pois_var = var(pois_sim),
  nb_mean   = mean(nb_sim),   nb_var   = var(nb_sim))
#> pois_mean  pois_var    nb_mean    nb_var
#>     4.988     4.963      4.986    17.41
```

Both samples average near 5, but the Poisson variance is ~5 and the NB variance is ~17 — more than triple. The theoretical NB variance is `5 + 5²/2 = 17.5`, which matches the simulated 17.41. If you fit Poisson to NB data, your standard errors will be too small by roughly `sqrt(17.5 / 5) ≈ 1.87`.

[NOTE]
**For NB regression, use `MASS::glm.nb()` or `glmmTMB`.** This post covers the distribution itself — the building block. The regression counterpart fits `size` and a model for `mu` jointly from your data; that's a separate tool built on top of this distribution.

**Try it:** Simulate 2,000 negative binomial draws with `mu = 5` and `size = 2`. Compute the sample variance and compare it to the theoretical `5 + 25/2 = 17.5`. Save the sample variance to `ex_nb_var`.

```r
# Try it: check NB variance formula
set.seed(99)
ex_nb_var <- # your code here

ex_nb_var
#> Expected: ~17 (somewhere between 15 and 20)
```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(99)
ex_nb_var <- var(rnbinom(n = 2000, size = 2, mu = 5))
ex_nb_var
#> [1] 17.18
```

**Explanation:** With 2,000 draws the empirical variance lands within 2% of the theoretical 17.5. Larger `n` would tighten the estimate further.

</details>

## Practice Exercises

### Exercise 1: Prospecting budget with qgeom()

Your sales team lands a meeting on about 15% of cold calls. Compute (a) the expected number of failed calls before the first meeting using the formula, and (b) the 90th-percentile number of failed calls before the first meeting using `qgeom()`. Save the two numbers to `my_expected` and `my_budget`.

```r
# Exercise 1: prospecting budget
my_p <- 0.15
my_expected <- # formula for geometric mean
my_budget <- # qgeom() for the 90th percentile

c(expected = my_expected, budget_p90 = my_budget)
#> Expected: expected ~ 5.67, budget_p90 = 14

```

<details>
<summary>Click to reveal solution</summary>

```r
my_p <- 0.15
my_expected <- (1 - my_p) / my_p
my_budget <- qgeom(p = 0.90, prob = my_p)

c(expected = my_expected, budget_p90 = my_budget)
#> expected budget_p90
#>    5.667     14.000
```

**Explanation:** On average you wait 5.67 rejections before a yes. But to be 90% confident you'll land at least one meeting, budget for 14 failed calls — the 90th percentile of the geometric distribution at this success rate.

</details>

### Exercise 2: Multi-offer negotiation

You need to close 3 deals. Each offer lands with probability 0.2. Compute (a) `P(exactly 10 rejections before closing 3 deals)` with `dnbinom()` and (b) `P(at most 15 rejections before closing 3 deals)` with `pnbinom()`. Save them to `my_fail_exact` and `my_fail_cum`.

```r
# Exercise 2: multi-offer negotiation
my_fail_exact <- # dnbinom for exactly 10 failures
my_fail_cum <- # pnbinom for at most 15 failures

c(exact_10 = my_fail_exact, at_most_15 = my_fail_cum)
#> Expected: exact_10 ~ 0.0611, at_most_15 ~ 0.6481

```

<details>
<summary>Click to reveal solution</summary>

```r
my_fail_exact <- dnbinom(x = 10, size = 3, prob = 0.2)
my_fail_cum   <- pnbinom(q = 15, size = 3, prob = 0.2)

c(exact_10 = my_fail_exact, at_most_15 = my_fail_cum)
#>   exact_10 at_most_15
#>     0.0611     0.6481
```

**Explanation:** `dnbinom()` answers "exactly 10 failures"; `pnbinom()` answers "at most 15 failures." Together they tell you the chance of hitting your three-deal target within different rejection budgets.

</details>

### Exercise 3: Overdispersion diagnostic

Simulate 3,000 negative binomial draws with `mu = 4` and `size = 2`, seed `2026`. Compute the sample variance-to-mean ratio and compare it to the Poisson null of 1. Save the ratio to `od_ratio`.

```r
# Exercise 3: overdispersion diagnostic
set.seed(2026)
od_sample <- # simulate
od_ratio <- # var / mean

od_ratio
#> Expected: ~3 (NB variance = 4 + 16/2 = 12; ratio ~ 12/4 = 3)

```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(2026)
od_sample <- rnbinom(n = 3000, size = 2, mu = 4)
od_ratio <- var(od_sample) / mean(od_sample)

od_ratio
#> [1] 2.96
```

**Explanation:** A variance-to-mean ratio near 3 flags strong overdispersion. If you were fitting this data, Poisson would badly underestimate the spread; the negative binomial's extra `mu²/size` term accounts for it.

</details>

## Complete Example: customer support ticket resolution

A first-line support agent resolves a ticket on each attempt with probability 0.35. You want to answer four questions: what is the probability of resolving on exactly the 3rd attempt? What is the expected number of failed attempts before resolution? What is the probability of resolving within 5 attempts (i.e., at most 4 failures)? And if an SLA requires resolving 2 tickets by the 8th total attempt (at most 6 failures), what is that probability?

```r
# Complete example: support resolution
p_res <- 0.35

# a) P(first resolved on 3rd attempt) = 2 failures before first success
prob_on_3 <- dgeom(x = 2, prob = p_res)

# b) Expected failed attempts before first resolution
exp_attempts <- (1 - p_res) / p_res

# c) P(resolving within 5 attempts) = P(at most 4 failures)
prob_le_5 <- pgeom(q = 4, prob = p_res)

# d) P(resolving 2 tickets by the 8th attempt) = P(at most 6 failures, size = 2)
prob_sla <- pnbinom(q = 6, size = 2, prob = p_res)

c(exact_on_3   = prob_on_3,
  exp_failures = exp_attempts,
  within_5     = prob_le_5,
  sla_2_by_8   = prob_sla)
#>  exact_on_3 exp_failures     within_5   sla_2_by_8
#>      0.1479       1.8571       0.8840       0.8002
```

About 15% of tickets resolve on the third attempt. On average, the agent needs ~1.86 failed attempts before closing a ticket. There's an 88% chance of closing any single ticket within five attempts, and an 80% chance of closing two tickets within eight total attempts. The geometric answers the one-ticket questions; the negative binomial answers the multi-ticket SLA question.

## Summary

| Distribution | Models | PMF | Mean | Variance | R density | Classic use |
|---|---|---|---|---|---|---|
| Geometric | Failures before 1st success | $(1-p)^x p$ | $(1-p)/p$ | $(1-p)/p^2$ | `dgeom(x, prob)` | First-hit waiting time |
| Negative Binomial | Failures before r-th success | Extended formula | $\text{size}(1-p)/p$ | $\mu + \mu^2/\text{size}$ | `dnbinom(x, size, prob)` | Multi-success waits, overdispersed counts |

Remember the three anchors:
- `size = 1` in the negative binomial recovers the geometric
- R counts **failures**, not trial numbers
- `dnbinom()` accepts `size + prob` **or** `size + mu`, never both

## References

1. R Core Team — `Geometric` distribution, base `stats` package. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/Geometric.html)
2. R Core Team — `NegBinomial` distribution, base `stats` package. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/NegBinomial.html)
3. Wikipedia — Negative binomial distribution. [Link](https://en.wikipedia.org/wiki/Negative_binomial_distribution)
4. Wikipedia — Geometric distribution. [Link](https://en.wikipedia.org/wiki/Geometric_distribution)
5. Casella, G. & Berger, R. L. — *Statistical Inference* (2nd ed), Chapter 3: Common Families of Distributions. Duxbury, 2002.
6. Hilbe, J. M. — *Negative Binomial Regression* (2nd ed). Cambridge University Press, 2011.
7. Venables, W. N. & Ripley, B. D. — *Modern Applied Statistics with S*. Chapter 7, `MASS::glm.nb()`. Springer, 2002.
8. Statology — A Guide to `dgeom`, `pgeom`, `qgeom`, `rgeom`. [Link](https://www.statology.org/dgeom-pgeom-qgeom-rgeom-r/)

## Continue Learning

- [Binomial vs Poisson in R](Binomial-and-Poisson-Distributions-in-R.html) — the parent tutorial on fixed-n and rare-event count distributions.
- [The Exponential Distribution in R](The-Exponential-Distribution-in-R.html) — the continuous-time analogue of the geometric, for waiting times measured in real numbers.
- [Fitting Distributions to Data in R](Fitting-Distributions-to-Data-in-R.html) — how to verify whether your observed counts actually follow a geometric or negative binomial shape.
