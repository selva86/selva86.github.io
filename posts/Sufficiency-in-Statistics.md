---
title: "Sufficiency in Statistics in R: Sufficient Statistics, Fisher-Neyman Factorization"
slug: "Sufficiency-in-Statistics"
description: "Learn sufficient statistics and the Fisher-Neyman factorization theorem with runnable R examples for Bernoulli, Poisson, Normal, and uniform distributions."
keywords: "sufficient statistics, Fisher-Neyman factorization theorem, sufficient statistic R, minimal sufficient statistic, factorization theorem example, exponential family sufficiency, sufficient statistic Bernoulli, sufficient statistic Poisson, sufficient statistic normal distribution, sufficient statistic uniform"
auto_link_terms: "sufficient statistic|sufficient statistics|Fisher-Neyman factorization|factorization theorem|minimal sufficient statistic|jointly sufficient statistics|Fisher-Neyman factorization theorem"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-18"
curriculum_id: "FR-infe-5"
post_type: "FR"
fr_parent: "Point-Estimation-in-R.html"
difficulty: "Intermediate"
---

# Sufficiency in Statistics in R: Sufficient Statistics, Fisher-Neyman Factorization

<p class="lead">A <strong>sufficient statistic</strong> is a single number (or a small set of numbers) computed from your sample that carries every drop of information the data has about an unknown parameter. Once you know the sufficient statistic, the rest of the raw data tells you nothing extra, so estimation, likelihood, and inference can all be done from that compact summary.</p>

## What is a sufficient statistic, in plain language?

Picture flipping a coin 100 times and recording every heads and tails. To estimate the coin's bias, do you really need all 100 answers? No, just the count of heads. That count is a sufficient statistic: a summary that captures every bit of evidence the sample carries about the parameter. Below, we check this claim numerically. The likelihood built from only `sum(x)` should match the likelihood built from the full sample, up to a constant that has nothing to do with the parameter.

```r title="Bernoulli log-likelihood: full sample vs count only"
set.seed(2026)

# 100 Bernoulli flips with true p = 0.30
x_bern <- rbinom(100, size = 1, prob = 0.30)

# Two log-likelihoods as a function of p: one from the full sample, one from sum(x) alone
p_grid    <- seq(0.05, 0.95, length.out = 50)
ll_full   <- sapply(p_grid, function(p) sum(dbinom(x_bern, 1, p, log = TRUE)))
ll_from_T <- sapply(p_grid, function(p) {
  T <- sum(x_bern); n <- length(x_bern)
  T * log(p) + (n - T) * log(1 - p)   # depends on x only through T
})

# Identical up to at most a data-only constant (here the constant is zero)
range(ll_full - ll_from_T)
#> [1] 0 0
```

The two log-likelihood curves are **identical at every p**. The sum of heads is doing all the work, the individual flips are irrelevant once you know their total. That is exactly what sufficiency means: the full sample and the summary `T = sum(x)` give the same inferential verdict about `p`.

Three short formulas make this precise. A statistic $T(X)$ is **sufficient for $\theta$** if the conditional distribution of the data given $T$ does not depend on $\theta$:

$$P(X = x \mid T(X) = t, \theta) = P(X = x \mid T(X) = t)$$

Where:
- $X = (X_1, \ldots, X_n)$ is the sample
- $T(X)$ is any function of the sample (the statistic)
- $\theta$ is the unknown parameter

Intuitively, once $T$ is known, the data cannot whisper any further hint about $\theta$.

[KEY INSIGHT]
**Sufficiency means identical likelihoods, not identical data.** Two different datasets with the same value of $T$ produce the same likelihood curve, so they give you the same MLE, the same confidence intervals, the same Bayesian posterior.

**Try it:** Simulate 60 Bernoulli(0.4) flips. Build the log-likelihood from the count of successes alone (i.e., only use the sum), evaluate it at `p = 0.4`, and compare to the full-sample log-likelihood at the same `p`. They should match exactly.

```r title="Your turn: Bernoulli log-lik from count only"
set.seed(7)
ex_x <- rbinom(60, 1, 0.4)

# your code: compute ex_ll from only ex_sum, evaluate at p = 0.4

ex_sum <- sum(ex_x)
# ex_ll <- ...

# Expected: ex_ll is equal to sum(dbinom(ex_x, 1, 0.4, log = TRUE))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Bernoulli log-lik from count only solution"
ex_ll   <- ex_sum * log(0.4) + (length(ex_x) - ex_sum) * log(1 - 0.4)
ex_full <- sum(dbinom(ex_x, 1, 0.4, log = TRUE))
c(from_T = ex_ll, from_full = ex_full)
#>    from_T from_full
#> -40.23... -40.23...
```

**Explanation:** The Bernoulli log-likelihood is `T*log(p) + (n - T)*log(1 - p)`, where `T = sum(x)`. Nothing else about `ex_x` influences the answer.

</details>

## What does the Fisher-Neyman factorization theorem say?

Checking sufficiency from the definition means computing conditional distributions, which is a headache. The **Fisher-Neyman factorization theorem** gives a shortcut: factor the joint density. If it splits into a piece that touches $\theta$ only through $T(x)$ times a piece that is free of $\theta$, then $T$ is sufficient. No integration, no conditioning.

![Fisher-Neyman factorization flow](screenshots/Sufficiency-in-Statistics-factorization-flow.webp)
*Figure 1: How the Fisher-Neyman factorization splits the joint density into a theta-part through T(x) and an x-only part.*

Formally, $T(X)$ is sufficient for $\theta$ if and only if the joint density factors as:

$$f(x_1, \ldots, x_n ; \theta) = g\bigl(T(x), \theta\bigr) \cdot h(x)$$

Where:
- $f$ is the joint density (or mass function) of the sample
- $g$ depends on the sample only through $T(x)$ and may involve $\theta$
- $h$ is any function of the data that does **not** involve $\theta$

Try the theorem on Bernoulli. The joint mass function of $n$ flips with success probability $p$ is:

$$f(x; p) = \prod_{i=1}^{n} p^{x_i}(1-p)^{1-x_i} = p^{\sum x_i}(1-p)^{n - \sum x_i}$$

This is already in factorized form. Set $T(x) = \sum x_i$, take $g(T, p) = p^{T}(1-p)^{n-T}$, and $h(x) = 1$. The theorem fires: `sum(x)` is sufficient for $p$. Let's verify the factorization numerically.

```r title="Bernoulli joint mass factorized into g(T, p) * h(x)"
T_bern <- sum(x_bern)
n_bern <- length(x_bern)
p_val  <- 0.3

# Joint mass computed directly
joint  <- prod(dbinom(x_bern, 1, p_val))

# Joint mass via the factorization: g(T, p) * h(x), with h(x) = 1
g_part <- p_val^T_bern * (1 - p_val)^(n_bern - T_bern)
h_part <- 1

c(joint_direct = joint, joint_factored = g_part * h_part)
#>   joint_direct joint_factored
#>   2.475...e-16   2.475...e-16
```

Both routes give the same number. The direct product over all 100 flips and the compact `g(T, p)` evaluation agree perfectly, which is exactly what the theorem promises.

[NOTE]
**The factorization does the work once, for all parameter values.** You do not need to redo any calculation as `p` varies. The form $p^T (1-p)^{n-T}$ is the answer.

**Try it:** The Poisson pmf is $f(x_i; \lambda) = e^{-\lambda}\lambda^{x_i}/x_i!$. Write the joint pmf for a sample of size $n$, group the $\lambda$-dependent pieces, and identify $T(x)$. Then verify your factorization in R against the direct product of `dpois`.

```r title="Your turn: Poisson factorization check"
set.seed(11)
ex_pois <- rpois(30, lambda = 2.5)

# your code: compute ex_T_pois = sum(ex_pois), then check
# g(T, lambda) * h(x) == prod(dpois(ex_pois, lambda)) at lambda = 2.5

# Expected: the two values match to machine precision.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Poisson factorization solution"
lambda_val   <- 2.5
ex_T_pois    <- sum(ex_pois)
n_p          <- length(ex_pois)
g_T          <- exp(-n_p * lambda_val) * lambda_val^ex_T_pois
h_x          <- 1 / prod(factorial(ex_pois))
ex_joint_pois <- prod(dpois(ex_pois, lambda_val))
c(direct = ex_joint_pois, factored = g_T * h_x)
#>      direct   factored
#>  4.93...e-21 4.93...e-21
```

**Explanation:** The joint pmf is $e^{-n\lambda}\lambda^{\sum x_i}/\prod x_i!$. The $\lambda$-piece depends on data only through $T = \sum x_i$. The $1/\prod x_i!$ piece is $h(x)$. So `sum(ex_pois)` is sufficient for $\lambda$.

</details>

## How do we find the sufficient statistic for common distributions?

Once you trust the factorization theorem, finding sufficient statistics for textbook distributions is fast. Here are the canonical cases you will see again and again.

| Distribution | Sufficient statistic $T(X)$ | Why |
|---|---|---|
| Bernoulli$(p)$ | $\sum X_i$ | Joint mass $=p^{T}(1-p)^{n-T}$ |
| Poisson$(\lambda)$ | $\sum X_i$ | Joint pmf $\propto e^{-n\lambda}\lambda^{T}$ |
| Exponential(rate) | $\sum X_i$ | Joint density $\propto \text{rate}^n e^{-\text{rate}\cdot T}$ |
| Normal$(\mu, \sigma^2)$, $\sigma$ known | $\sum X_i$ (or $\bar X$) | Joint density factors through sum of $x_i$ |
| Normal$(\mu, \sigma^2)$, both unknown | $(\sum X_i, \sum X_i^2)$ | Two parameters, two summaries |
| Uniform$(0, \theta)$ | $\max X_i$ | Joint density $=\theta^{-n} \cdot \mathbb{1}\{\max x \le \theta\}$ |

Two numeric checks make the pattern concrete. First the Poisson, using the same "log-likelihoods must coincide" test we used for Bernoulli.

```r title="Poisson: log-likelihood equivalence using T = sum(x)"
set.seed(9)
x_pois       <- rpois(80, lambda = 3)
lambda_grid  <- seq(0.5, 6, length.out = 50)

ll_pois_full <- sapply(lambda_grid,
                       function(L) sum(dpois(x_pois, L, log = TRUE)))
ll_pois_T    <- sapply(lambda_grid, function(L) {
  T <- sum(x_pois); n <- length(x_pois)
  -n * L + T * log(L)       # drops the -sum(log(x!)) constant (not a function of lambda)
})

# Difference is a constant across lambda (data-only, does not shift the argmax)
diff_range <- range(ll_pois_full - ll_pois_T)
diff_range
#> [1] -105.37... -105.37...
```

The difference is **constant** across every value of `lambda`. A constant shift cannot change the shape of the likelihood, the MLE, or the curvature, so `sum(x_pois)` carries the whole inference.

Next, the uniform on $(0, \theta)$. Its likelihood is unusual because it is a step function: flat for all $\theta$ above the sample maximum, zero for any $\theta$ below it. The maximum of the sample is therefore the only number you need.

```r title="Uniform(0, theta): likelihood lives on theta >= max(x)"
set.seed(14)
x_unif <- runif(40, min = 0, max = 3)

# Try a grid of theta values, compute the joint density directly
theta_grid <- seq(1, 5, length.out = 200)
lik_unif   <- sapply(theta_grid, function(th) {
  if (th < max(x_unif)) 0 else th^(-length(x_unif))
})

plot(theta_grid, lik_unif, type = "l",
     xlab = expression(theta), ylab = "Likelihood",
     main = "Uniform(0, theta): zero below max(x), then theta^-n")
abline(v = max(x_unif), lty = 2)
```

The plot is zero for `theta < max(x_unif)` and drops off as `theta^(-n)` above it. Knowing the maximum alone tells you exactly where the likelihood lives, so `max(x)` is sufficient. You can discard all the other 39 observations and lose nothing.

[TIP]
**For any exponential-family distribution, the sufficient statistic is staring at you inside the density.** Write the density as `exp(eta(theta) * T(x) - A(theta)) * h(x)` and T(x) in the exponent is your sufficient statistic. Bernoulli, Poisson, Exponential, Normal, Gamma, Beta, all exponential family, all follow this rule.

**Try it:** For Exponential(rate), the density is $f(x; r) = r e^{-r x}$ for $x > 0$. Factor the joint density, identify the sufficient statistic, and verify in R that the log-likelihood depends on the data only through that statistic.

```r title="Your turn: Exponential sufficient statistic"
set.seed(21)
ex_exp <- rexp(50, rate = 1.5)

# your code: set ex_T_exp, build a log-likelihood from ex_T_exp alone,
# and confirm it equals sum(dexp(ex_exp, rate, log = TRUE)) up to a constant.

# Expected: the difference across the rate grid is constant.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exponential sufficient statistic solution"
ex_T_exp     <- sum(ex_exp)
ex_rate_grid <- seq(0.5, 3, length.out = 40)
ll_full_exp  <- sapply(ex_rate_grid,
                       function(r) sum(dexp(ex_exp, r, log = TRUE)))
ex_ll_exp    <- sapply(ex_rate_grid, function(r) {
  n <- length(ex_exp); n * log(r) - r * ex_T_exp
})
range(ll_full_exp - ex_ll_exp)
#> [1] 0 0
```

**Explanation:** The joint density is $r^n \exp(-r \sum x_i)$. The rate interacts with the data only through $T = \sum x_i$, so the sum is sufficient.

</details>

## What is a minimal sufficient statistic and why does it matter?

Any one-to-one function of a sufficient statistic is also sufficient, so `sum(x)`, `n * mean(x)`, and `2 * sum(x) + 5` are all sufficient for the Bernoulli $p$. The question becomes: what is the *smallest* such summary? The **minimal sufficient statistic** is the sufficient statistic that can be written as a function of every other sufficient statistic, so it compresses the data as much as possible without losing information.

The Lehmann-Scheffé criterion says $T$ is minimal sufficient if the ratio $f(x; \theta)/f(y; \theta)$ is free of $\theta$ **exactly when** $T(x) = T(y)$. In practice, for exponential families the canonical sufficient statistic is already minimal, and that is almost every distribution you will meet.

Demonstration with a Normal sample when $\sigma^2$ is known. Both $(\sum x, \sum x^2)$ and $\bar x$ are sufficient, but $\bar x$ uses one number instead of two. The log-likelihoods based on each must agree up to a constant.

```r title="Normal(mu, sigma^2 known): mean alone is minimal sufficient"
set.seed(33)
x_norm   <- rnorm(40, mean = 5, sd = 2)
sigma2   <- 4
mu_grid  <- seq(2, 8, length.out = 60)

# Log-likelihood built from the mean alone
ll_from_mean <- sapply(mu_grid, function(mu) {
  n <- length(x_norm); xbar <- mean(x_norm)
  -n / (2 * sigma2) * (xbar - mu)^2     # shape in mu only
})

# Log-likelihood built from (sum, sum of squares): should have same shape
ll_from_pair <- sapply(mu_grid, function(mu) {
  s1 <- sum(x_norm); s2 <- sum(x_norm^2); n <- length(x_norm)
  (-s2 + 2 * mu * s1 - n * mu^2) / (2 * sigma2)
})

# Differences are constant in mu
range(diff(ll_from_mean - ll_from_pair))
#> [1] 0 0
```

Both log-likelihoods have the **same shape** as `mu` varies, they only differ by an additive constant that does not depend on `mu`. So `mean(x_norm)` alone is enough, and compressing to `(sum, sumsq)` throws nothing useful away either, but it wastes a number.

[WARNING]
**"Sufficient" is not "unique."** A sufficient statistic is not one fixed answer. Any one-to-one function of a sufficient statistic is also sufficient. What is unique (up to relabeling) is *minimal* sufficiency.

**Try it:** Confirm that `n * mean(x)` and `sum(x)` carry the same information for a Normal sample with known variance. Build two log-likelihoods, one from each statistic, and show they have the same shape over a $\mu$-grid.

```r title="Your turn: n*mean vs sum"
set.seed(2)
ex_norm <- rnorm(50, mean = 4, sd = 2)
ex_T1   <- sum(ex_norm)
ex_T2   <- length(ex_norm) * mean(ex_norm)

# your code: confirm ex_T1 == ex_T2 numerically, then build a log-lik from each.

# Expected: ex_T1 and ex_T2 are equal; both log-likelihoods peak at the same mu.
```

<details>
<summary>Click to reveal solution</summary>

```r title="n*mean vs sum solution"
identical(ex_T1, ex_T2)
#> [1] TRUE

ex_sigma2 <- 4
ex_mu     <- seq(1, 7, length.out = 50)
ex_ll_T1  <- sapply(ex_mu, function(mu) {
  n <- length(ex_norm); -n/(2*ex_sigma2) * (ex_T1/n - mu)^2
})
ex_ll_T2  <- sapply(ex_mu, function(mu) {
  n <- length(ex_norm); -n/(2*ex_sigma2) * (ex_T2/n - mu)^2
})
range(ex_ll_T1 - ex_ll_T2)
#> [1] 0 0
```

**Explanation:** `n * mean(x)` *is* `sum(x)` by definition, so the log-likelihoods are literally identical. A one-to-one function of a sufficient statistic is itself sufficient.

</details>

## How does sufficiency connect to maximum likelihood and data reduction?

Here is where sufficiency earns its keep. The maximum likelihood estimator depends on the data **only through the sufficient statistic**, so you can compute it without touching the raw observations at all. Storage, bandwidth, and privacy pressures all bow to this fact: transmit one number and someone downstream can fit the same model.

For Bernoulli, the MLE is $\hat p = \sum x_i / n = T / n$. Watch: we run an MLE using only the total successes and the sample size, never touching `x_bern`.

```r title="Bernoulli MLE from T = sum(x) alone"
T_obs  <- sum(x_bern)           # pretend this is all you were given
n_obs  <- length(x_bern)        # and the sample size
p_mle_T <- T_obs / n_obs
p_mle_full <- mean(x_bern)      # traditional full-data MLE for comparison
c(from_T = p_mle_T, from_full = p_mle_full)
#>    from_T from_full
#>      0.28      0.28
```

Exactly the same estimate. Whoever handed you the dataset could have kept every individual flip secret and told you only the head count, and you would have arrived at the same answer.

[KEY INSIGHT]
**Sufficiency is the theorem behind "the mean is enough."** When you summarise a large dataset with its mean or total for parameter estimation, you are not approximating, you are exploiting a mathematical guarantee that no other part of the data helps.

**Try it:** A colleague tells you they observed 180 events across 60 days in a Poisson process, but refuses to share the day-by-day counts. Can you still fit the MLE for $\lambda$? Compute it.

```r title="Your turn: Poisson MLE from totals only"
ex_total <- 180
ex_n     <- 60

# your code: compute ex_lambda_mle from ex_total and ex_n alone.

# Expected: ex_lambda_mle should equal 3 (since MLE = T/n).
```

<details>
<summary>Click to reveal solution</summary>

```r title="Poisson MLE from totals solution"
ex_lambda_mle <- ex_total / ex_n
ex_lambda_mle
#> [1] 3
```

**Explanation:** For Poisson, $T = \sum x_i$ is sufficient for $\lambda$, and $\hat\lambda_{\text{MLE}} = T/n$. You need nothing else.

</details>

## Practice Exercises

### Exercise 1: Verify sample mean sufficiency for a Normal

Simulate 60 Normal(μ = 7, σ² = 4) draws. Using a grid of μ from 3 to 11, build one log-likelihood from the full sample and another from only the sample mean. Show that the two curves differ by at most a constant that does not depend on μ, which confirms the sample mean is sufficient.

```r title="Your turn: Normal mean sufficiency"
# Your code here. Hint: the "from mean" form is
#   -n/(2*sigma2) * (mean(x) - mu)^2.

# Expected: range(my_ll_full - my_ll_mean) returns two numbers that are equal.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Normal mean sufficiency solution"
set.seed(101)
my_x        <- rnorm(60, mean = 7, sd = 2)
sigma2_val  <- 4
my_mu_grid  <- seq(3, 11, length.out = 80)

my_ll_full <- sapply(my_mu_grid,
                     function(mu) sum(dnorm(my_x, mu, sqrt(sigma2_val), log = TRUE)))
my_ll_mean <- sapply(my_mu_grid, function(mu) {
  n <- length(my_x); -n / (2 * sigma2_val) * (mean(my_x) - mu)^2
})

# Difference is constant in mu
range(my_ll_full - my_ll_mean)
#> [1] -63.45... -63.45...
```

**Explanation:** `range()` returns two equal values, so the gap is the same at every μ. That constant absorbs the $\sum x_i^2$ and $\log$-normalizer pieces, none of which depend on μ. The mean alone drives inference.

</details>

### Exercise 2: Uniform(0, θ) and the maximum

Simulate 50 Uniform(0, 4) draws. For a θ-grid from 1 to 6, compute the likelihood directly. Then find the MLE and show that it equals the sample maximum.

```r title="Your turn: Uniform(0, theta) MLE"
# Your code here. Hint: likelihood is theta^(-n) for theta >= max(x), else 0.

# Expected: my_mle_u equals max(my_u).
```

<details>
<summary>Click to reveal solution</summary>

```r title="Uniform MLE solution"
set.seed(202)
my_u         <- runif(50, min = 0, max = 4)
my_theta_grid <- seq(1, 6, length.out = 300)
my_lik_u      <- sapply(my_theta_grid, function(th) {
  if (th < max(my_u)) 0 else th^(-length(my_u))
})

my_mle_u <- my_theta_grid[which.max(my_lik_u)]
c(mle = my_mle_u, sample_max = max(my_u))
#>       mle sample_max
#>  3.97...    3.97...
```

**Explanation:** The likelihood is zero when θ is smaller than any observed value and decreases as `theta^(-n)` above the maximum. So the peak sits exactly at `max(x)`, which is the MLE and also the sufficient statistic.

</details>

## Complete Example

A worked end-to-end Poisson inference that relies only on the sufficient statistic. Simulate a sample, compute T, fit the MLE from T alone, plot the log-likelihood, and cross-check against the full-data MLE.

```r title="Poisson end-to-end using only T"
set.seed(77)

# Step 1: simulate a Poisson sample (we will pretend only the total is shared)
pois_sample <- rpois(120, lambda = 4.2)

# Step 2: compute the sufficient statistic and sample size
T_total <- sum(pois_sample)
n_total <- length(pois_sample)

# Step 3: MLE from T alone
lambda_mle <- T_total / n_total
lambda_mle
#> [1] 4.216...

# Step 4: log-likelihood curve, built using only T and n
lam_grid <- seq(3, 5.5, length.out = 120)
ll_curve <- -n_total * lam_grid + T_total * log(lam_grid)
plot(lam_grid, ll_curve, type = "l",
     xlab = expression(lambda),
     ylab = "log L(lambda)  up to a constant",
     main = "Poisson log-likelihood from T(x) alone")
abline(v = lambda_mle, col = "steelblue", lty = 2)

# Step 5: sanity check against the full-data MLE
c(from_T = lambda_mle, from_full = mean(pois_sample))
#>   from_T from_full
#>   4.216...  4.216...
```

Exactly equal. If you were building a privacy-preserving pipeline that transmits only `T_total` and `n_total` from an edge device to a server, the server fits the same MLE, draws the same log-likelihood, computes the same confidence interval. Sufficiency is the theoretical license for that engineering decision.

## Summary

![Sufficiency concept mindmap](screenshots/Sufficiency-in-Statistics-concept-mindmap.webp)
*Figure 2: Sufficiency at a glance, definition, theorem, canonical examples, and uses.*

```r title="Quick-reference table of sufficient statistics"
suff_table <- data.frame(
  distribution = c("Bernoulli(p)", "Poisson(lambda)", "Exponential(rate)",
                   "Normal(mu, known s2)", "Normal(mu, s2)", "Uniform(0, theta)"),
  sufficient_stat = c("sum(x)", "sum(x)", "sum(x)", "mean(x)",
                      "(sum(x), sum(x^2))", "max(x)"),
  minimal = c("yes", "yes", "yes", "yes", "yes", "yes")
)
print(suff_table)
#>            distribution    sufficient_stat minimal
#> 1           Bernoulli(p)             sum(x)     yes
#> 2        Poisson(lambda)             sum(x)     yes
#> 3     Exponential(rate)             sum(x)     yes
#> 4  Normal(mu, known s2)            mean(x)     yes
#> 5         Normal(mu, s2) (sum(x), sum(x^2))     yes
#> 6      Uniform(0, theta)             max(x)     yes
```

Key takeaways:

- A **sufficient statistic** summarises a sample without losing any information about the parameter.
- The **Fisher-Neyman factorization theorem** is the practical test: a density that factors as $g(T(x), \theta) \cdot h(x)$ tells you $T$ is sufficient, no conditioning required.
- For exponential families, the canonical statistic in the exponent is sufficient and minimal.
- The MLE depends on data only through the sufficient statistic, which is why data reduction is lossless for estimation.
- Sufficiency is the starting point for sharper results like the Rao-Blackwell theorem, Lehmann-Scheffé theorem, and the Cramér-Rao lower bound.

## References

1. Wikipedia, *Sufficient statistic*. [Link](https://en.wikipedia.org/wiki/Sufficient_statistic)
2. Penn State STAT 415, Lesson 24.2, *Factorization Theorem*. [Link](https://online.stat.psu.edu/stat415/lesson/24/24.2)
3. Casella, G. and Berger, R. L., *Statistical Inference*, 2nd Edition, Duxbury, 2002, Chapter 6.
4. Watkins, J., *Sufficient Statistics* lecture notes, University of Arizona. [Link](https://math.arizona.edu/~jwatkins/sufficiency.pdf)
5. Breheny, P., *Factorization theorem*, University of Iowa STAT 7110. [Link](https://myweb.uiowa.edu/pbreheny/7110/wiki/factorization-theorem.html)
6. García-Portugués, E., *A First Course on Statistical Inference*, Chapter 3.5, Minimal sufficient statistics. [Link](https://bookdown.org/egarpor/inference/point-min-sufficient.html)
7. R Core Team, *Distributions reference manual*. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/Distributions.html)

## Continue Learning

- [Point Estimation in R: What Makes an Estimator Good? Bias, Variance, and MSE](Point-Estimation-in-R.html): the broader framework in which sufficiency plays its role.
- [Maximum Likelihood Estimation in R](Maximum-Likelihood-Estimation-in-R.html): MLE depends on data only through sufficient statistics, so sufficiency is the workhorse behind every likelihood fit.
- [Method of Moments in R: Fit Distributions Without Calculus](Method-of-Moments-in-R.html): an alternative estimator that also uses sample-based summaries.
