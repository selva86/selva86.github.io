---
title: "Decision Theory in R: Loss Functions, Risk, Bayes Risk & Admissibility"
slug: "Decision-Theory-in-R"
description: "Learn statistical decision theory in R: loss functions, risk, Bayes risk, minimax, and admissibility, with simulations comparing estimators end to end."
keywords: "decision theory R, loss function R, risk function statistics, Bayes risk R, admissible decision rule, minimax estimator R, James-Stein"
auto_link_terms: "decision theory in R|loss function|risk function|Bayes risk|admissibility|minimax estimator|squared error loss|0-1 loss"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-30"
curriculum_id: "2.6.9"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Decision Theory"
sidebar_order: 108
difficulty: "Advanced"
---

# Decision Theory in R: Loss Functions, Risk, Bayes Risk & Admissibility

<p class="lead">Statistical decision theory gives you a single language for comparing estimators, tests, and predictions: every rule has a loss, every loss has a long-run risk, and the rule with the lowest risk wins. This tutorial uses base R plus dplyr/ggplot2, so each idea below comes with a runnable simulation you can edit in place.</p>

## What is statistical decision theory in R?

Imagine you must guess a hidden parameter from noisy data. Decision theory turns "good guess" into something you can compute, pick a loss function, average it over the sampling distribution to get the risk, then prefer the rule whose risk stays small. The cleanest way to feel this in R is to simulate two competing estimators on the same data and read off their risks side by side.

```r title="Simulate mean vs median risk"
library(dplyr)
library(ggplot2)

set.seed(2026)
n  <- 25       # sample size per replication
B  <- 5000     # number of Monte Carlo replications
mu_true <- 0   # true parameter value

# Each row is one simulated dataset; compute mean and median.
sims <- replicate(B, {
  x <- rnorm(n, mean = mu_true, sd = 1)
  c(mean = mean(x), median = median(x))
})

risk_table <- data.frame(
  estimator = c("sample mean", "sample median"),
  mse       = c(mean((sims["mean", ]   - mu_true)^2),
                mean((sims["median", ] - mu_true)^2))
)
risk_table
#>       estimator        mse
#> 1   sample mean 0.04001923
#> 2 sample median 0.05982384
```

Both estimators are unbiased here, but the sample mean has lower mean squared error. That gap is the **risk gap**, and the whole field of decision theory is about making such comparisons rigorous: which rule is best, under which loss, for which true state of the world. The four ingredients are the unknown state $\theta$, the data-driven action $a = \delta(X)$, the rule $\delta$, and the loss $L(\theta, a)$.

[KEY INSIGHT]
**Risk depends on the rule AND the true state.** The same estimator can look great near $\theta = 0$ and terrible far from it. A single MSE number is a snapshot of one $\theta$, not a verdict on the rule everywhere.

**Try it:** Estimate the risk of the constant rule $\hat\mu = 0$ when the true mean is $\mu = 0.5$. The risk should equal the squared bias plus zero variance, i.e. $0.25$.

```r title="Your turn: risk of a constant rule"
# Try it: simulate the constant estimator delta(X) = 0
set.seed(11)
ex_n <- 25
ex_B <- 5000
ex_mu <- 0.5

# your code here

#> Expected: ~0.25
```

<details>
<summary>Click to reveal solution</summary>

```r title="Constant rule risk solution"
set.seed(11)
ex_n  <- 25
ex_B  <- 5000
ex_mu <- 0.5
ex_const_risk <- mean(replicate(ex_B, {
  x <- rnorm(ex_n, mean = ex_mu, sd = 1)
  (0 - ex_mu)^2  # constant rule ignores the data
}))
ex_const_risk
#> [1] 0.25
```

**Explanation:** The constant rule has zero variance but a fixed bias of $\mu$, so its squared-error risk equals $\mu^2$.

</details>

## How do loss functions quantify mistakes?

A loss function $L(\theta, a)$ assigns a non-negative penalty to using action $a$ when the truth is $\theta$. Different decisions cost differently in real life, so different losses lead to different "best" estimators. We will work with the three classics: squared error, absolute error, and 0–1 loss, and watch the optimal point estimator change as we swap them.

```r title="Define three loss functions"
sq_loss        <- function(theta, a) (theta - a)^2
abs_loss       <- function(theta, a) abs(theta - a)
zero_one_loss  <- function(theta, a, tol = 0.05) as.numeric(abs(theta - a) > tol)

# Quick check on a single (theta, a) pair:
sq_loss(1.2, 1.0); abs_loss(1.2, 1.0); zero_one_loss(1.2, 1.0)
#> [1] 0.04
#> [1] 0.2
#> [1] 1
```

Squared loss penalises big errors quadratically, absolute loss is linear and robust, and 0–1 loss only cares whether you are within tolerance. The headline result is that under squared loss the optimal point estimator is the posterior (or sampling) **mean**, under absolute loss it is the **median**, and under 0–1 loss it is the **mode**. Let us reproduce that on a single skewed sample.

```r title="Optimal point estimator changes with loss"
set.seed(42)
x_sample <- rgamma(2000, shape = 2, rate = 1)   # right-skewed sample

candidates <- seq(0, 5, by = 0.01)
loss_grid <- data.frame(
  candidate = candidates,
  sq        = sapply(candidates, function(a) mean(sq_loss(x_sample, a))),
  abs       = sapply(candidates, function(a) mean(abs_loss(x_sample, a)))
)

best_sq  <- loss_grid$candidate[which.min(loss_grid$sq)]
best_abs <- loss_grid$candidate[which.min(loss_grid$abs)]

c(best_sq = best_sq, sample_mean = mean(x_sample),
  best_abs = best_abs, sample_median = median(x_sample))
#>      best_sq  sample_mean     best_abs sample_median
#>     1.990000     1.992127     1.660000      1.671446
```

The loss-minimising candidates land on the sample mean and the sample median to two decimal places. That is not a coincidence: minimising expected squared error gives the mean, minimising expected absolute error gives the median. Pick the loss that reflects your real downstream cost.

[TIP]
**Pick the loss your decision actually pays for.** If a forecasting error of 10 costs you 100 times more than an error of 1, squared loss is a fair proxy. If errors cost roughly the same per unit, absolute loss is more honest. Don't default to MSE just because it is convenient, the loss is a modelling choice.

![Decision-theory pipeline](screenshots/Decision-Theory-in-R-pipeline.webp)

*Figure 1: The decision-theory pipeline, data feeds a rule that produces an action, the loss compares the action to the true state, and averaging gives risk and Bayes risk.*

**Try it:** Implement the Huber loss with threshold $k = 1$, which behaves like squared error for small residuals and like absolute error for large ones.

```r title="Your turn: Huber loss"
# Try it: complete ex_huber()
ex_huber <- function(theta, a, k = 1) {
  r <- theta - a
  # your code here
}

ex_huber(0.5, 0); ex_huber(3, 0)
#> Expected: 0.125
#> Expected: 2.5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Huber loss solution"
ex_huber <- function(theta, a, k = 1) {
  r <- theta - a
  ifelse(abs(r) <= k, 0.5 * r^2, k * (abs(r) - 0.5 * k))
}
ex_huber(0.5, 0); ex_huber(3, 0)
#> [1] 0.125
#> [1] 2.5
```

**Explanation:** Inside the band $|r|\le k$ the loss is quadratic; outside, it switches to linear so a few large outliers do not dominate the optimisation.

</details>

## How do you compute the risk function in R?

The risk $R(\theta, \delta) = E_\theta\,[\,L(\theta, \delta(X))\,]$ is the *expected* loss when the data come from $\theta$ and we use rule $\delta$. We can never measure it from one dataset, but we can estimate it cheaply by Monte Carlo: simulate many datasets at a fixed $\theta$, apply the rule, average the loss. Repeat across a $\theta$ grid to get the whole risk function.

```r title="Monte Carlo risk for the sample mean"
compute_risk <- function(estimator, mu, n = 25, B = 4000, sd = 1) {
  losses <- replicate(B, {
    x <- rnorm(n, mean = mu, sd = sd)
    sq_loss(mu, estimator(x))
  })
  mean(losses)
}

mu_grid  <- seq(-3, 3, by = 0.5)
mle_risk <- sapply(mu_grid, function(m) compute_risk(mean, mu = m))
data.frame(mu = mu_grid, mle_risk = round(mle_risk, 4))
#>      mu mle_risk
#> 1  -3.0   0.0395
#> 2  -2.5   0.0398
#> 3  -2.0   0.0402
#> 4  -1.5   0.0399
#> 5  -1.0   0.0401
#> 6  -0.5   0.0397
#> 7   0.0   0.0400
#> 8   0.5   0.0403
#> 9   1.0   0.0405
#> 10  1.5   0.0398
#> 11  2.0   0.0399
#> 12  2.5   0.0402
#> 13  3.0   0.0401
```

Across the grid the simulated risk hovers near $0.04 = 1/25$. That matches the closed-form result $R(\mu, \bar X) = \sigma^2 / n$, which does not depend on $\mu$ at all, the risk is *flat*. A flat risk function will turn out to be the key to the minimax property later. Now compare with a shrinkage rule $\delta_c(X) = c\bar X$ that pulls the estimate towards zero.

[NOTE]
**Closed-form risk for the sample mean is $\sigma^2 / n$.** When you can solve the integral analytically, do that and use simulation only as a sanity check. Most of the rest of this tutorial will *not* admit closed forms, which is exactly why we keep `compute_risk` general.

```r title="Risk curve: MLE vs shrinkage"
shrink_estimator <- function(c) function(x) c * mean(x)
shrink_risk <- sapply(mu_grid,
                      function(m) compute_risk(shrink_estimator(0.5), mu = m))

risk_df <- data.frame(
  mu        = rep(mu_grid, 2),
  rule      = rep(c("MLE (sample mean)", "Shrinkage c=0.5"), each = length(mu_grid)),
  risk      = c(mle_risk, shrink_risk)
)

ggplot(risk_df, aes(mu, risk, colour = rule)) +
  geom_line(linewidth = 1) +
  labs(x = expression(mu), y = expression(R(mu, delta)),
       title = "Risk curves under squared error loss") +
  theme_minimal()
```

The shrinkage rule beats the MLE near $\mu = 0$ (lower variance) but its risk grows as $\mu^2$ once you move away, a classic bias-variance trade. No single rule dominates everywhere; that is exactly the situation that motivates Bayes risk and admissibility next.

**Try it:** Use `compute_risk` to estimate the risk of the constant rule $\delta_0(X) = 0$ across `mu_grid`. You should see a parabola.

```r title="Your turn: risk of constant 0"
# Try it: define a constant-zero estimator and call compute_risk
const_zero <- function(x) 0
# your code here

#> Expected: a roughly parabolic curve, minimum at mu = 0
```

<details>
<summary>Click to reveal solution</summary>

```r title="Constant-zero risk curve solution"
const_zero <- function(x) 0
ex_const_risk <- sapply(mu_grid, function(m) compute_risk(const_zero, mu = m))
data.frame(mu = mu_grid, risk = round(ex_const_risk, 3))
#>      mu  risk
#> 1  -3.0 9.000
#> 2  -2.5 6.250
#> ...
#> 7   0.0 0.000
#> ...
#> 13  3.0 9.000
```

**Explanation:** The constant rule has zero variance but bias $\mu$, so its risk is $\mu^2$, a perfect parabola.

</details>

## What is Bayes risk and when is it minimised?

Risk is a function of $\theta$, so two rules can swap places as $\theta$ moves. To collapse the comparison to a single number, average the risk against a prior $\pi(\theta)$. The result is the **Bayes risk** $r(\pi, \delta) = \int R(\theta, \delta)\,\pi(\theta)\,d\theta$. The rule that minimises Bayes risk is the **Bayes rule**, and under squared loss the Bayes rule is the posterior mean.

We will demonstrate with a Beta-Binomial setup: $X \sim \text{Bin}(n, \theta)$, prior $\theta \sim \text{Beta}(\alpha, \beta)$, posterior $\theta\mid X \sim \text{Beta}(\alpha + X, \beta + n - X)$, so the posterior mean is $(\alpha + X) / (\alpha + \beta + n)$.

```r title="Beta-Binomial posterior mean vs MLE"
set.seed(7)
n_b      <- 20
prior_a  <- 2
prior_b  <- 2

# Single observed sample
x_b <- rbinom(1, size = n_b, prob = 0.3)
post_mean <- (prior_a + x_b) / (prior_a + prior_b + n_b)
mle_b     <- x_b / n_b

c(x_observed = x_b, mle = mle_b, posterior_mean = post_mean)
#>     x_observed            mle posterior_mean
#>      6.0000000      0.3000000      0.3333333
```

For this draw the MLE matches the truth exactly, while the posterior mean is pulled slightly toward the prior centre $0.5$. On *any single sample* either could be closer to the truth. The point of Bayes risk is to ask which rule wins **on average**, where the average is over both the data *and* the prior on $\theta$.

```r title="Bayes risk: posterior mean vs MLE"
set.seed(99)
M <- 4000  # draws from the joint distribution

bayes_run <- function(estimator) {
  thetas <- rbeta(M, prior_a, prior_b)            # draw theta from prior
  xs     <- rbinom(M, size = n_b, prob = thetas)  # then x | theta
  ests   <- estimator(xs)
  mean(sq_loss(thetas, ests))
}

post_mean_estimator <- function(x) (prior_a + x) / (prior_a + prior_b + n_b)
mle_estimator       <- function(x) x / n_b

bayes_risk_post <- bayes_run(post_mean_estimator)
bayes_risk_mle  <- bayes_run(mle_estimator)
round(c(post = bayes_risk_post, mle = bayes_risk_mle), 5)
#>    post     mle 
#> 0.00984 0.01275
```

The posterior mean has a smaller Bayes risk than the MLE under this Beta(2,2) prior, about a 23% reduction. That is the Bayes rule earning its name: among *all* rules, it minimises the prior-weighted average risk. The reduction comes from sharing information across $\theta$ values via the prior, which is why prior choice is itself a modelling decision.

[KEY INSIGHT]
**Posterior mean minimises expected squared error.** For squared loss, the Bayes-optimal action is always $E[\theta \mid X]$. For absolute loss it is the posterior median; for 0–1 loss the posterior mode. The optimal Bayes action is the posterior summary that matches your loss, no matter how exotic the model.

**Try it:** Replace the Beta(2,2) prior with a more informative Beta(20,20) prior (mean 0.5, much tighter). Recompute the Bayes risk of the posterior mean. It should drop further.

```r title="Your turn: stronger prior, smaller Bayes risk"
# Try it: copy bayes_run, swap in prior_a = 20, prior_b = 20.
strong_a <- 20
strong_b <- 20
# your code here

#> Expected: bayes_risk_post smaller than the 0.00984 from above
```

<details>
<summary>Click to reveal solution</summary>

```r title="Stronger prior solution"
strong_post_estimator <- function(x) (strong_a + x) / (strong_a + strong_b + n_b)
ex_strong_bayes_risk <- mean(replicate(4000, {
  th <- rbeta(1, strong_a, strong_b)
  xx <- rbinom(1, size = n_b, prob = th)
  (th - strong_post_estimator(xx))^2
}))
round(ex_strong_bayes_risk, 5)
#> [1] 0.00339
```

**Explanation:** A tighter prior pulls posterior means even closer to $\theta$, so the squared error shrinks. The trade-off is that a *wrong* tight prior would *raise* risk for $\theta$ values it dis-prefers, Bayes risk averages this away under the prior you actually believe.

</details>

## When is an estimator admissible?

A rule $\delta$ is **inadmissible** if some other rule $\delta'$ has $R(\theta, \delta') \le R(\theta, \delta)$ for every $\theta$, with strict inequality for at least one $\theta$. Otherwise $\delta$ is **admissible**. Admissibility is a minimum bar: an inadmissible rule is dominated everywhere, so you should never use it. The catch is that admissibility says *nothing* about how good the rule is in absolute terms.

![Admissibility check](screenshots/Decision-Theory-in-R-admissibility.webp)

*Figure 2: Admissibility check, rule δ is inadmissible if some δ' has equal-or-smaller risk for every θ and strictly smaller for at least one θ.*

The clearest demonstration: the constant rule $\delta_0(X) = 0$ has risk $\mu^2$ while the sample mean has constant risk $1/n$. They cross at $\mu = \pm 1/\sqrt n$, so neither dominates the other on the full real line, both are admissible there. But if we restrict the parameter space to $\mu \in [0.5, \infty)$, then sample mean dominates and the constant rule becomes inadmissible.

```r title="Verify dominance on a restricted parameter space"
mu_grid_pos    <- seq(0.5, 3, by = 0.25)
risk_const     <- mu_grid_pos^2                 # closed form: bias^2
risk_const_grid <- sapply(mu_grid_pos,
                          function(m) compute_risk(mean, mu = m))

cmp <- data.frame(mu = mu_grid_pos,
                  risk_constant_zero = round(risk_const, 3),
                  risk_sample_mean   = round(risk_const_grid, 4),
                  mean_dominates     = risk_const > risk_const_grid)
head(cmp)
#>     mu risk_constant_zero risk_sample_mean mean_dominates
#> 1 0.50              0.250           0.0399           TRUE
#> 2 0.75              0.562           0.0397           TRUE
#> 3 1.00              1.000           0.0405           TRUE
#> 4 1.25              1.562           0.0399           TRUE
#> 5 1.50              2.250           0.0399           TRUE
#> 6 1.75              3.062           0.0398           TRUE
```

`mean_dominates` is `TRUE` everywhere on the grid, so the sample mean dominates the constant zero rule on $[0.5, 3]$. That makes the constant rule inadmissible there, there is no $\mu$ in this set where it ties or wins. On the full real line the same constant rule *is* admissible because it beats the sample mean in a neighbourhood of $\mu = 0$, however small.

[WARNING]
**Admissibility is a negative property, easy to disprove, hard to prove.** Disproving admissibility just needs one rule that dominates yours on the chosen parameter space. Proving admissibility requires you to show that *no* rule dominates, and that proof is usually nontrivial (Karlin's theorem, complete-class arguments, or limit-of-Bayes constructions).

**Try it:** Find a single value of $\mu$ where the constant rule $\delta_0$ has *lower* risk than the sample mean.

```r title="Your turn: where does delta_0 win?"
# Try it: identify a mu where constant 0 beats sample mean (when mu is near 0).
# Hint: the sample mean has risk 1/n = 0.04 here; constant rule has risk mu^2.
# Solve mu^2 < 0.04.
ex_dominance_check <- function(mu) {
  c(constant = mu^2, sample_mean_approx = 1/25, constant_wins = mu^2 < 1/25)
}
# your code here

#> Expected TRUE for some |mu| < 0.2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Where delta_0 wins solution"
ex_dominance_check(0.1)
ex_dominance_check(0.05)
#>           constant sample_mean_approx     constant_wins
#>             0.0100             0.0400              1.000
#>           constant sample_mean_approx     constant_wins
#>             0.0025             0.0400              1.000
```

**Explanation:** Within the small neighbourhood $|\mu| < 1/\sqrt n = 0.2$, the constant zero rule beats the sample mean. That neighbourhood is what saves the constant rule from being dominated globally on the whole real line.

</details>

## How do minimax estimators relate to Bayes estimators?

Minimax shifts focus from averages to worst cases: $\delta^\star$ is **minimax** if $\sup_\theta R(\theta, \delta^\star) \le \sup_\theta R(\theta, \delta)$ for every other rule $\delta$. The classic theorem says: a Bayes rule whose risk function is *constant* in $\theta$ is automatically minimax, and the prior making it Bayes is called the **least favourable prior**.

![Bayes vs minimax connection](screenshots/Decision-Theory-in-R-bayes-minimax.webp)

*Figure 3: A Bayes rule with constant risk is minimax; the prior that achieves this is called least favourable.*

We already saw the sample mean has constant risk $1/n$ for $N(\theta, 1)$. Let us verify and use that to claim it is minimax under squared loss.

```r title="Sample mean has constant risk in theta"
set.seed(404)
mu_grid_wide <- seq(-10, 10, by = 2)
mle_risk_constant <- sapply(mu_grid_wide,
                            function(m) compute_risk(mean, mu = m, B = 6000))
range(mle_risk_constant)
#> [1] 0.03913241 0.04081056
```

The risk stays in a tight band around $1/25 = 0.04$ across a wide $\theta$ range, with simulation noise the only source of variation. So the worst-case risk of the sample mean across all $\mu$ is $\approx 0.04$. Any other rule with a worst-case risk above that cannot be minimax. The sample mean is in fact the unique minimax estimator for the normal mean under squared loss (Lehmann & Casella, Chapter 5).

[KEY INSIGHT]
**A Bayes rule with constant risk is minimax.** Constant risk means there is no "bad" $\theta$ where the rule blows up, so the worst case is also the typical case. This is the classical bridge between Bayesian (averaging-based) and frequentist (worst-case) thinking.

**Try it:** Show that the shrinkage rule $\delta_{0.5}(X) = 0.5\bar X$ is *not* minimax, its risk grows without bound as $|\mu|$ increases.

```r title="Your turn: shrinkage is not minimax"
# Try it: compute risk of 0.5 * mean over a wide mu grid
shrink_05 <- function(x) 0.5 * mean(x)
# your code here

#> Expected: risk grows roughly like 0.25 * mu^2 for large |mu|
```

<details>
<summary>Click to reveal solution</summary>

```r title="Shrinkage is not minimax solution"
mu_wide <- c(-10, -5, 0, 5, 10)
ex_shrink_minimax <- sapply(mu_wide,
                            function(m) compute_risk(shrink_05, mu = m, B = 4000))
data.frame(mu = mu_wide, shrink_risk = round(ex_shrink_minimax, 2))
#>    mu shrink_risk
#> 1 -10       25.01
#> 2  -5        6.26
#> 3   0        0.01
#> 4   5        6.25
#> 5  10       25.00
```

**Explanation:** At $\mu = 10$ the rule's bias is $-5$, so its risk $\approx 25$ blows up. The supremum is unbounded, so it cannot be minimax, the sample mean's worst case of $0.04$ wins on the whole real line.

</details>

[NOTE]
**James–Stein dominates the sample mean in $p \ge 3$ dimensions.** In one dimension the sample mean is admissible and minimax. Surprisingly, when you estimate a *vector* of $p \ge 3$ Normal means jointly under summed squared error, the rule $\hat\mu^{JS} = (1 - (p-2)/\|\bar X\|^2)\bar X$ has uniformly lower risk. This is **Stein's paradox** and is the canonical example showing that admissibility is not preserved by stacking problems.

## Practice Exercises

### Exercise 1: Build a generic risk simulator

Write a function `my_risk_sim(estimator, theta_grid, n, B)` that returns a data frame with columns `theta` and `risk` for any estimator under squared loss with $N(\theta, 1)$ data. Use it to compare `mean` vs `c=0.7` shrinkage on `seq(-2, 2, by = 0.5)`. Save the comparison to `my_result`.

```r title="Capstone Ex 1 starter"
# Exercise 1: generic risk simulator
# Hint: replicate(B, ...) inside sapply over theta_grid

my_risk_sim <- function(estimator, theta_grid, n = 25, B = 3000) {
  # your code here
}

# Run it on two estimators and combine into my_result.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Capstone Ex 1 solution"
my_risk_sim <- function(estimator, theta_grid, n = 25, B = 3000) {
  risks <- sapply(theta_grid, function(th) {
    mean(replicate(B, {
      x <- rnorm(n, mean = th, sd = 1)
      (th - estimator(x))^2
    }))
  })
  data.frame(theta = theta_grid, risk = risks)
}

my_grid     <- seq(-2, 2, by = 0.5)
mle_df      <- my_risk_sim(mean, my_grid)
mle_df$rule <- "MLE"
shr_df      <- my_risk_sim(function(x) 0.7 * mean(x), my_grid)
shr_df$rule <- "Shrinkage 0.7"
my_result   <- rbind(mle_df, shr_df)
my_result
#>    theta       risk          rule
#> 1   -2.0 0.04025 ...           MLE
#> 2   -1.5 0.04019 ...           MLE
#> ...
#> 18   2.0 0.40012 ... Shrinkage 0.7
```

**Explanation:** The simulator factors out estimator and grid, so swapping rules is one line. Shrinkage wins near $\theta = 0$ but loses badly far from it, neither dominates, both are admissible on $\mathbb{R}$.

</details>

### Exercise 2: Beta-Binomial Bayes risk reduction

For $X \sim \text{Bin}(n=20, \theta)$ and prior $\theta \sim \text{Beta}(2, 2)$, compute the Bayes risk of the posterior mean and the MLE under squared loss using 5000 Monte Carlo draws each. Report the percentage reduction the posterior mean achieves over the MLE. Save the percentage to `my_pct_drop`.

```r title="Capstone Ex 2 starter"
# Exercise 2: Bayes risk reduction
# Hint: draw theta ~ Beta(2,2), then x | theta ~ Binomial(20, theta).

# your code here

#> Expected: posterior mean reduces Bayes risk by ~20-25%
```

<details>
<summary>Click to reveal solution</summary>

```r title="Capstone Ex 2 solution"
set.seed(2026)
M2 <- 5000
n2 <- 20
a2 <- 2; b2 <- 2

th_draw   <- rbeta(M2, a2, b2)
x_draw    <- rbinom(M2, size = n2, prob = th_draw)
my_bayes_post <- mean(((a2 + x_draw)/(a2 + b2 + n2) - th_draw)^2)
my_bayes_mle  <- mean((x_draw/n2 - th_draw)^2)

my_pct_drop <- 100 * (my_bayes_mle - my_bayes_post) / my_bayes_mle
round(c(post = my_bayes_post, mle = my_bayes_mle, pct_drop = my_pct_drop), 4)
#>      post       mle  pct_drop 
#>    0.0099    0.0125   20.7700
```

**Explanation:** The posterior mean borrows strength from the prior, so on average over $\theta$ drawn from Beta(2,2) it cuts Bayes risk by about 21%. The reduction would shrink if the prior were misspecified, try a Beta(50,1) prior to see the cost of a wrong, tight prior.

</details>

## Complete Example

Let us put loss, risk, Bayes risk, and admissibility together in one comparison. We will study four estimators of a Normal mean under squared loss across a $\theta$ grid: the MLE (sample mean), a posterior mean under a $N(0, 1)$ prior, a fixed shrinkage $\delta_{0.6}(X) = 0.6\bar X$, and the constant rule $\delta_0(X) = 0$. The output is a tidy data frame plus a faceted ggplot panel.

```r title="End-to-end risk study"
set.seed(2027)
n_e <- 25
mu_e_grid <- seq(-3, 3, by = 0.5)

# Estimators
mle_e        <- function(x) mean(x)
post_mean_e  <- function(x) (n_e * mean(x)) / (n_e + 1)   # N(0, 1) prior
shrink_06    <- function(x) 0.6 * mean(x)
const_zero_e <- function(x) 0

est_compare <- list(
  "MLE"            = mle_e,
  "Posterior N(0,1)" = post_mean_e,
  "Shrinkage 0.6"  = shrink_06,
  "Constant 0"     = const_zero_e
)

compare_df <- do.call(rbind, lapply(names(est_compare), function(nm) {
  risk_vec <- sapply(mu_e_grid,
                     function(m) compute_risk(est_compare[[nm]], mu = m, n = n_e, B = 3000))
  data.frame(rule = nm, mu = mu_e_grid, risk = risk_vec)
}))

compare_plot <- ggplot(compare_df, aes(mu, risk, colour = rule)) +
  geom_line(linewidth = 1) +
  labs(title = "Four estimators of a Normal mean (squared error loss)",
       x = expression(mu), y = expression(R(mu, delta))) +
  theme_minimal()
compare_plot
```

The plot reproduces every concept from this tutorial in one picture. The MLE has flat risk $\approx 0.04$ and is minimax. The posterior mean and shrinkage rule beat the MLE near $\mu = 0$ but pay quadratically as $|\mu|$ grows, they are admissible but not minimax. The constant rule is the most extreme version of shrinkage and hugs the floor only at $\mu = 0$. Choose your estimator by deciding which $\mu$ region matters: prior beliefs about $\theta$ determine that, which is exactly why Bayes risk is the tiebreaker.

## Summary

| Concept | Definition | R recipe | Optimal under squared loss |
|---|---|---|---|
| Loss | $L(\theta, a)$ | `sq_loss <- function(t,a) (t-a)^2` | mean |
| Risk | $E_\theta L(\theta, \delta(X))$ | `compute_risk(estimator, theta)` | depends on $\theta$ |
| Bayes risk | $E_\pi[R(\theta, \delta)]$ | average risk over prior draws | posterior mean |
| Admissibility | not dominated everywhere | check no rule has lower risk for every $\theta$ | varies |
| Minimax | minimum worst-case risk | constant-risk Bayes rule under least-favourable prior | sample mean for $N(\theta,1)$ |

- The loss is a modelling choice. Pick it to match the cost of real mistakes, not for mathematical convenience.
- The risk function is a *function of $\theta$*, not a number. Rules cross; no single estimator is best everywhere.
- Bayes risk averages risk by your prior. The Bayes rule under squared loss is the posterior mean.
- Admissibility means "not dominated". Easy to disprove, hard to prove, and surprisingly fragile (Stein's paradox in $p \ge 3$).
- Minimax minimises the worst case. Constant-risk Bayes rules are minimax, that's how the two paradigms shake hands.

## References

1. Lehmann, E. L. & Casella, G., *Theory of Point Estimation*, 2nd ed. Springer (1998). Chapters 1, 4, 5.
2. Berger, J. O., *Statistical Decision Theory and Bayesian Analysis*, 2nd ed. Springer (1985).
3. Wasserman, L., *All of Statistics*. Chapter 13: Statistical Decision Theory.
4. Robert, C., *The Bayesian Choice*, 2nd ed. Springer (2007). Chapters 2–3.
5. Wasserman, L., Lecture Notes 14, 36-705. [Link](https://www.stat.cmu.edu/~larry/=stat705/Lecture14.pdf)
6. Wikipedia, Admissible decision rule. [Link](https://en.wikipedia.org/wiki/Admissible_decision_rule)
7. Wikipedia, Bayes estimator. [Link](https://en.wikipedia.org/wiki/Bayes_estimator)

## Continue Learning

- [UMVUE in R](UMVUE-in-R-2.html), minimum-variance unbiased estimators and how the Cramér–Rao bound interacts with admissibility.
- [Cramér–Rao Lower Bound in R](Cramer-Rao-Lower-Bound-in-R-2.html), risk lower bound that any unbiased estimator must respect.
- [Neyman–Pearson Lemma in R](Neyman-Pearson-Lemma-in-R-2.html), decision theory applied to hypothesis testing, with 0–1 loss reframed as Type I/II errors.
