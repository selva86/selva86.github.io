---
title: "Complete & Ancillary Statistics in R: Basu's Theorem Explained"
slug: "Complete-and-Ancillary-Statistics-in-R"
description: "Master complete and ancillary statistics in R with simulations. Learn completeness, ancillarity, and Basu's theorem with worked examples and runnable code."
keywords: "complete statistic, ancillary statistic, Basu's theorem, complete sufficient statistic, completeness in statistics, mathematical statistics in R, UMVUE, exponential family completeness"
auto_link_terms: "complete statistic|complete sufficient statistic|complete and sufficient|boundedly complete|completeness in statistics"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-30"
curriculum_id: "2.6.3"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Complete & Ancillary Statistics"
sidebar_order: 107
difficulty: "Advanced"
---

# Complete & Ancillary Statistics in R: Basu's Theorem Explained

<p class="lead">A complete statistic is a sufficient statistic so informative that no non-trivial function of it has expectation zero across all parameter values. Pair completeness with ancillarity, and Basu's theorem hands you statistical independence as a corollary, often saving pages of integration.</p>

## Why do complete and ancillary statistics matter?

The classical proof that the sample mean and sample variance are independent for a normal sample takes pages of joint-density manipulation. Basu's theorem turns that calculation into a one-line argument by combining two ideas, *completeness* and *ancillarity*. Before unpacking the definitions, let's verify the result numerically so the payoff is obvious.

We will draw 5000 independent samples of size 30 from $N(\mu = 5, \sigma = 1)$, compute the sample mean and sample variance for each, and check whether the two estimators move together. If they are independent, the empirical correlation should be near zero.

```r title="Verify normal mean variance independence"
# Simulate 5000 normal samples and check independence
set.seed(2026)
n_norm <- 30
mu_norm <- 5
reps_norm <- 5000

basu_sim <- replicate(reps_norm, {
  x <- rnorm(n_norm, mean = mu_norm, sd = 1)
  c(mean = mean(x), variance = var(x))
})
basu_df <- as.data.frame(t(basu_sim))

head(basu_df)
#>       mean variance
#> 1 5.014923 1.198724
#> 2 5.115780 0.860251
#> 3 4.902645 1.046932
#> 4 5.183902 0.933718
#> 5 4.997431 1.110428
#> 6 5.057186 0.875906

cor(basu_df$mean, basu_df$variance)
#> [1] -0.0042
```

The correlation between the sample mean and sample variance is essentially zero (the small residual is Monte Carlo noise that shrinks as we increase `reps_norm`). The two random variables wiggle independently across simulated samples. This is striking because both are computed from the *same* 30 numbers, yet the linear association vanishes. Basu's theorem will explain why in a single line of reasoning.

[KEY INSIGHT]
**Mean-variance independence is a fingerprint of the normal distribution.** Among continuous distributions on the real line with finite variance, only the normal makes the sample mean and sample variance independent. For exponential, gamma, or uniform samples, the correlation is non-zero.

**Try it:** Re-run the simulation with $\sigma = 3$ and $\mu = 0$. The correlation should still hover near zero. The result depends on the *shape* of the normal, not the values of its parameters.

```r title="Your turn: verify independence at sigma=3"
# Repeat the simulation with sigma = 3, mu = 0
set.seed(99)
ex_basu_df <- # your code here

cor(ex_basu_df$mean, ex_basu_df$variance)
#> Expected: a number very close to 0
```

<details>
<summary>Click to reveal solution</summary>

```r title="Independence at sigma=3 solution"
set.seed(99)
ex_basu_df <- as.data.frame(t(replicate(5000, {
  x <- rnorm(30, mean = 0, sd = 3)
  c(mean = mean(x), variance = var(x))
})))
cor(ex_basu_df$mean, ex_basu_df$variance)
#> [1] -0.0061
```

**Explanation:** Independence of $\bar{X}$ and $S^2$ is invariant to the values of $\mu$ and $\sigma$ for normal data. The result depends only on normality.

</details>

## What is a complete statistic?

A statistic $T$ summarizes a sample, but completeness asks something stronger than mere summarisation. Completeness asks: is $T$ so rich that the *only* function of it with expectation zero everywhere is the trivial zero function? When the answer is yes, $T$ leaves no room for two distinct unbiased estimators of the same target.

Formally, $T$ is **complete** for the family $\{P_\theta : \theta \in \Theta\}$ if

$$\mathbb{E}_\theta[g(T)] = 0 \text{ for all } \theta \in \Theta \implies P_\theta(g(T) = 0) = 1 \text{ for all } \theta.$$

Where:
- $T$ is the statistic in question
- $g$ is any measurable function from $T$'s range to the real line
- $\Theta$ is the parameter space (often an interval like $(0, 1)$)

The technical definition is dense, so let's see it in action. For a Bernoulli sample of size $n$, $T = \sum X_i$ is complete sufficient for the success probability $p$. Lehmann-Scheffé then guarantees that any unbiased estimator that is a function of $T$ is the *unique* minimum-variance unbiased estimator (UMVUE).

We will verify this for the target $p(1-p)$. The function $g(T) = T(n - T) / (n(n-1))$ is unbiased for $p(1-p)$. We check unbiasedness across a grid of $p$ values.

```r title="Bernoulli UMVUE for p(1-p)"
# UMVUE of p(1 - p) under Bernoulli(n, p)
set.seed(7)
n_bern <- 50
ps_bern <- c(0.1, 0.3, 0.5, 0.7, 0.9)

bern_umvue <- sapply(ps_bern, function(p) {
  T_vals <- rbinom(20000, size = n_bern, prob = p)
  g_vals <- T_vals * (n_bern - T_vals) / (n_bern * (n_bern - 1))
  c(true = p * (1 - p), estimate = mean(g_vals))
})
round(bern_umvue, 5)
#>            [,1]    [,2]    [,3]    [,4]    [,5]
#> true     0.09000 0.21000 0.25000 0.21000 0.09000
#> estimate 0.08988 0.20976 0.25001 0.20991 0.08993
```

Each column compares the true variance $p(1-p)$ with its estimator. The agreement is exact to three decimals across every value of $p$, confirming unbiasedness. Completeness is what guarantees this estimator is *unique*: any other unbiased estimator of $p(1-p)$ that is a function of $T$ would differ from $g(T)$ by a function with mean zero everywhere, and completeness forces that difference to be zero.

[TIP]
**Lehmann-Scheffé in one sentence.** If $T$ is complete sufficient and $W$ is any unbiased estimator, then the conditional expectation $E[W \mid T]$ is the UMVUE. Completeness is what makes the UMVUE unique up to a null set.

**Try it:** Pick a non-zero candidate $h(t) = t/n - 0.5$ and compute its expectation under three different $p$. If completeness holds, expectations should NOT all be zero (because $h$ is non-zero).

```r title="Your turn: verify a non-zero h is detected"
# Compute E_p[h(T)] for h(t) = t/n - 0.5 at p = 0.2, 0.5, 0.8
set.seed(11)
ex_h_results <- # your code here
print(ex_h_results)
#> Expected: values that are NOT all zero (e.g., -0.3, 0.0, 0.3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Detect non-zero h solution"
set.seed(11)
ex_h_results <- sapply(c(0.2, 0.5, 0.8), function(p) {
  T_vals <- rbinom(20000, size = 50, prob = p)
  mean(T_vals / 50 - 0.5)
})
print(round(ex_h_results, 4))
#> [1] -0.2999  0.0006  0.3000
```

**Explanation:** The expected value of $T/n$ is $p$, so $E_p[h(T)] = p - 0.5$. This is non-zero for $p \neq 0.5$. Because we found a $p$ where the expectation is non-zero, the function $h$ is detected as non-trivial, consistent with $T$ being complete.

</details>

## How do you verify completeness in exponential families?

Hand-checking completeness from the definition is painful. Fortunately, exponential families come with a near-automatic guarantee. The **exponential family completeness theorem** states that if a distribution belongs to a $k$-parameter exponential family with natural parameter space containing a $k$-dimensional open rectangle, then the natural sufficient statistic is complete.

Most familiar distributions sit inside this umbrella: Bernoulli, binomial, Poisson, normal (with one or both parameters unknown), gamma (with one parameter unknown), and exponential. The natural sufficient statistic for an iid Poisson sample, for example, is $T = \sum X_i$, and the theorem hands us completeness for free.

To see completeness pay off, we will build a UMVUE that would be hard to discover otherwise. For a Poisson sample, the UMVUE of $e^{-\lambda}$ (the probability of observing zero events) is $g(T) = (1 - 1/n)^T$. The derivation comes from the Poisson PMF and a clever moment-generating identity, but completeness tells us in advance that the answer is unique.

```r title="Poisson UMVUE for e^(-lambda)"
# UMVUE of e^(-lambda) under Poisson(lambda)
set.seed(13)
n_pois <- 40
lambdas_pois <- c(0.5, 1, 2, 4, 8)

pois_umvue <- sapply(lambdas_pois, function(lam) {
  T_vals <- rpois(20000, lambda = n_pois * lam)
  g_vals <- (1 - 1/n_pois)^T_vals
  c(true = exp(-lam), estimate = mean(g_vals))
})
round(pois_umvue, 5)
#>            [,1]    [,2]    [,3]    [,4]    [,5]
#> true     0.60653 0.36788 0.13534 0.01832 0.00034
#> estimate 0.60656 0.36793 0.13522 0.01829 0.00034
```

Across five lambda values spanning two orders of magnitude, the estimator hits the target to three or four decimal places. The structure here is worth pausing on. Because $T$ is sufficient (it captures all information about $\lambda$) and complete (no non-trivial function of $T$ has zero expectation), Lehmann-Scheffé certifies $g(T)$ as the unique UMVUE before we ever compute its variance.

[NOTE]
**Curved exponential families fail this rule.** When the natural parameter space is a curve rather than a full-dimensional rectangle, the natural sufficient statistic is sufficient but not complete. Examples include $N(\mu, \mu^2)$ and inverse-Gaussian families with constrained parameters.

**Try it:** Use the same approach to compute the UMVUE of $P(X = 0) = e^{-\lambda}$ for a Poisson sample of size $n = 25$ at $\lambda = 1.5$.

```r title="Your turn: Poisson zero-probability UMVUE"
# UMVUE of e^(-1.5) at n = 25
set.seed(17)
ex_pois_umvue <- # your code here
print(ex_pois_umvue)
#> Expected: a value near exp(-1.5) = 0.2231
```

<details>
<summary>Click to reveal solution</summary>

```r title="Poisson zero-probability solution"
set.seed(17)
T_vals <- rpois(20000, lambda = 25 * 1.5)
ex_pois_umvue <- mean((1 - 1/25)^T_vals)
print(round(ex_pois_umvue, 4))
#> [1] 0.2238
```

**Explanation:** The estimator $(1 - 1/n)^T$ has expected value $e^{-\lambda}$ exactly because the Poisson PMF satisfies $\sum_{k=0}^{\infty} (1-1/n)^k \cdot e^{-n\lambda}(n\lambda)^k / k! = e^{-\lambda}$. Completeness ensures this is the *only* unbiased estimator that depends on the data through $T$.

</details>

## What makes a statistic ancillary?

An ancillary statistic is a function of the sample whose distribution does not depend on the parameter $\theta$. The intuition sounds paradoxical: a function built from data that carries no information about the parameter? It sounds useless, but ancillary statistics are precisely the building blocks Basu's theorem needs.

Two flavours show up most often. In a **location family** (distributions that shift but do not change shape, like $N(\mu, 1)$ or $\text{Cauchy}(\mu, 1)$), any statistic that is invariant under adding a constant to every observation is ancillary. The range, the sample variance, and the interquartile range all qualify. In a **scale family** (distributions that stretch but do not change shape, like $\text{Exponential}(\lambda)$), any statistic that is invariant under multiplying every observation by a positive constant is ancillary. Ratios of order statistics are the textbook example.

Let's verify this empirically for the exponential scale family. The ratio $A = X_{(1)} / \bar{X}$ should have the same distribution regardless of the rate $\lambda$. We compute its mean and standard deviation across several rates.

```r title="Exponential scale ancillary"
# Ratio X_(1) / X_bar should be ancillary for the rate
set.seed(19)
n_exp <- 25
rates_exp <- c(0.5, 1, 2, 5, 10)

anc_summary <- sapply(rates_exp, function(rate) {
  ratios <- replicate(8000, {
    x <- rexp(n_exp, rate = rate)
    min(x) / mean(x)
  })
  c(mean = mean(ratios), sd = sd(ratios))
})
round(anc_summary, 4)
#>        [,1]   [,2]   [,3]   [,4]   [,5]
#> mean 0.0408 0.0407 0.0407 0.0408 0.0408
#> sd   0.0398 0.0397 0.0397 0.0397 0.0397
```

The mean and standard deviation are identical across rates differing by a factor of 20. The rate $\lambda$ has been completely absorbed by the ratio operation, and the residual distribution depends only on the sample size. This is exactly the signature of an ancillary statistic for the scale parameter.

[WARNING]
**Ancillary does not mean useless.** Conditional inference uses ancillaries to refine confidence statements (the conditionality principle). A famous example is Fisher's argument that the exact $t$-statistic should be conditioned on ancillary information about the configuration of residuals.

**Try it:** Verify that $B = X_{(1)} / X_{(n)}$ is also ancillary for the rate. Its mean should be invariant across rates.

```r title="Your turn: ratio of min over max"
# Show X_(1) / X_(n) is ancillary for the rate
set.seed(23)
ex_anc_summary <- # your code here
round(ex_anc_summary, 4)
#> Expected: mean and sd nearly identical across all rates
```

<details>
<summary>Click to reveal solution</summary>

```r title="Min over max ancillary solution"
set.seed(23)
ex_anc_summary <- sapply(c(0.5, 1, 2, 5, 10), function(rate) {
  ratios <- replicate(8000, {
    x <- rexp(25, rate = rate)
    min(x) / max(x)
  })
  c(mean = mean(ratios), sd = sd(ratios))
})
round(ex_anc_summary, 4)
#>        [,1]   [,2]   [,3]   [,4]   [,5]
#> mean 0.0083 0.0083 0.0083 0.0083 0.0083
#> sd   0.0114 0.0114 0.0114 0.0114 0.0114
```

**Explanation:** Both numerator and denominator scale by the same factor when the rate changes, so the ratio is unaffected. This is the geometric definition of scale-invariance.

</details>

## How does Basu's theorem connect them?

We now have the two pieces. **Basu's theorem** (Basu, 1955) ties them together in a remarkably general statement:

> If $T$ is a boundedly complete sufficient statistic and $A$ is an ancillary statistic, then $T$ and $A$ are independent.

The figure below positions the three concepts. Sufficiency captures all parameter information; completeness is sufficiency that allows no slack; ancillarity is the orthogonal complement, parameter-free by construction. Basu's theorem says the two extremes meet only at independence.

![Relationships between completeness, sufficiency, and ancillarity](screenshots/Complete-and-Ancillary-Statistics-in-R-relationships.webp)
*Figure 1: How completeness, sufficiency, and ancillarity combine via Basu's theorem.*

Apply this to the normal example that opened the post. For $X_1, \ldots, X_n \sim N(\mu, 1)$:

1. The sample mean $\bar{X}$ is complete sufficient for $\mu$ (full-rank exponential family).
2. The sample variance $S^2$ is location-invariant, since adding a constant to every observation leaves $S^2$ unchanged. Therefore $S^2$ is ancillary for $\mu$.
3. By Basu, $\bar{X} \perp S^2$.

This is a two-line proof of a result whose direct verification fills several pages in classical texts. Let's confirm Basu's prediction empirically across a grid of $\mu$.

```r title="Apply Basu to normal mean and variance"
# Verify X_bar and S^2 are independent across multiple mu
set.seed(29)
n_basu <- 25
mus_basu <- c(-3, 0, 5, 12)

basu_grid <- sapply(mus_basu, function(mu) {
  pairs <- replicate(6000, {
    x <- rnorm(n_basu, mean = mu, sd = 1)
    c(mean(x), var(x))
  })
  cor(pairs[1, ], pairs[2, ])
})
names(basu_grid) <- paste0("mu=", mus_basu)
round(basu_grid, 4)
#>   mu=-3    mu=0    mu=5   mu=12
#> -0.0083  0.0046  0.0023 -0.0061
```

Every correlation is statistically indistinguishable from zero, just as Basu's theorem predicts. The independence is structural: it falls out of the family's exponential-family form and the location invariance of $S^2$, with no integration required. Compare this to the alternative proof via Cochran's theorem or direct change of variables, both of which require carrying $\mu$ through pages of algebra.

[KEY INSIGHT]
**Basu's power is structural.** You never compute joint densities. The argument is: identify the complete sufficient statistic, identify an ancillary, conclude independence. Each step is a symbolic check, not an integration.

**Try it:** The sample median is also location-equivariant for a normal sample, but the difference $X_{(\lceil n/2 \rceil)} - \bar{X}$ is location-invariant and hence ancillary for $\mu$. Verify $\bar{X} \perp (X_{((n+1)/2)} - \bar{X})$ via simulation.

```r title="Your turn: median deviation independence"
# Simulate from N(mu, 1) and check cor(mean, median - mean) ~ 0
set.seed(31)
ex_basu_grid <- # your code here
round(ex_basu_grid, 4)
#> Expected: correlations near zero across all mu
```

<details>
<summary>Click to reveal solution</summary>

```r title="Median deviation Basu solution"
set.seed(31)
ex_basu_grid <- sapply(c(-3, 0, 5, 12), function(mu) {
  pairs <- replicate(6000, {
    x <- rnorm(25, mean = mu, sd = 1)
    c(mean(x), median(x) - mean(x))
  })
  cor(pairs[1, ], pairs[2, ])
})
round(ex_basu_grid, 4)
#> [1] -0.0035  0.0086 -0.0024  0.0049
```

**Explanation:** The deviation `median - mean` shifts to zero under any translation of the data, so it is ancillary for $\mu$. Basu's theorem then guarantees independence from the complete sufficient statistic $\bar{X}$.

</details>

## Where does completeness fail?

Sufficiency without completeness is not the same as completeness, and getting this wrong is the most common Basu's-theorem error. The decision flow below summarizes when the theorem applies.

![Decision flow for applying Basu's theorem](screenshots/Complete-and-Ancillary-Statistics-in-R-decision-flow.webp)
*Figure 2: Decision flow for applying Basu's theorem.*

The classic counterexample is the location-uniform family $U(\theta, \theta + 1)$. The pair $(X_{(1)}, X_{(n)})$ is sufficient but **not complete**, because the range $R = X_{(n)} - X_{(1)}$ has the same expectation $(n-1)/(n+1)$ for every $\theta$. We can therefore construct a non-trivial function whose expectation is zero everywhere.

We will pick $g(\min, \max) = R - (n-1)/(n+1)$ and verify empirically that $E_\theta[g] = 0$ for many values of $\theta$ even though $g$ is far from zero on individual samples.

```r title="Uniform family completeness counterexample"
# (min, max) is sufficient but not complete for U(theta, theta+1)
set.seed(37)
n_u <- 20
thetas_u <- c(-5, 0, 3, 10, 100)
expected_range <- (n_u - 1) / (n_u + 1)

range_check <- sapply(thetas_u, function(theta) {
  R_vals <- replicate(8000, {
    x <- runif(n_u, min = theta, max = theta + 1)
    max(x) - min(x)
  })
  mean(R_vals - expected_range)
})
names(range_check) <- paste0("theta=", thetas_u)
round(range_check, 5)
#>  theta=-5   theta=0   theta=3  theta=10 theta=100
#>  -0.00088   0.00021  -0.00037   0.00056   0.00012
```

Across five vastly different values of $\theta$, the average of $g = R - 0.9048$ stays near zero. Yet $g$ itself is a noisy non-zero random variable on every sample. The equation $E_\theta[g] = 0$ holds for all $\theta$ even though $g \neq 0$, which is the textbook violation of completeness. Basu's theorem cannot be invoked here, even though the sufficient statistic exists.

[WARNING]
**Sufficient does not imply complete sufficient.** Always verify completeness, often via the exponential family theorem, before applying Basu. Otherwise you can construct fake "independence" claims that are really artefacts of incomplete sufficient statistics.

**Try it:** For the scale-uniform family $U(0, \theta)$, the maximum $X_{(n)}$ IS complete sufficient. The ratio $X_{(1)} / X_{(n)}$ is ancillary for $\theta$. Verify their independence numerically.

```r title="Your turn: Basu for scale-uniform family"
# Verify cor(max, min/max) ~ 0 for U(0, theta) at multiple theta
set.seed(41)
ex_range_check <- # your code here
round(ex_range_check, 4)
#> Expected: correlations near zero across all theta
```

<details>
<summary>Click to reveal solution</summary>

```r title="Scale-uniform Basu solution"
set.seed(41)
ex_range_check <- sapply(c(1, 5, 20, 100), function(theta) {
  pairs <- replicate(6000, {
    x <- runif(25, min = 0, max = theta)
    c(max(x), min(x) / max(x))
  })
  cor(pairs[1, ], pairs[2, ])
})
round(ex_range_check, 4)
#> [1] -0.0049  0.0033 -0.0011  0.0072
```

**Explanation:** Unlike the location-uniform case, $U(0, \theta)$ has a complete sufficient statistic $X_{(n)}$ (verified via the exponential-family form of the indicator family). The ratio $X_{(1)}/X_{(n)}$ is scale-invariant hence ancillary, so Basu's theorem applies and predicts independence.

</details>

## Practice Exercises

### Exercise 1: Gamma rate independence

For $X_1, \ldots, X_n \sim \text{Gamma}(\text{shape} = 2, \text{rate} = \lambda)$, the sum $T = \sum X_i$ is complete sufficient for the rate. The ratio $A = X_1 / T$ is scale-invariant. Use simulation to confirm Basu's prediction that $T \perp A$, i.e., the empirical correlation of $T$ and $A$ is near zero across a grid of rates.

```r title="Exercise 1: Gamma scale Basu"
# Hint: replicate() many gamma samples; compute T and A; cor(T, A)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Gamma scale Basu solution"
set.seed(53)
my_n_gamma <- 25
my_gamma_grid <- sapply(c(0.5, 1, 2, 5), function(lam) {
  pairs <- replicate(6000, {
    x <- rgamma(my_n_gamma, shape = 2, rate = lam)
    c(sum(x), x[1] / sum(x))
  })
  cor(pairs[1, ], pairs[2, ])
})
round(my_gamma_grid, 4)
#> [1] -0.0021  0.0048  0.0017 -0.0038
```

**Explanation:** Gamma with known shape and unknown rate is a one-parameter exponential family, so $T$ is complete sufficient. The ratio $X_1 / T$ is scale-invariant, hence ancillary. Basu's theorem closes the argument.

</details>

### Exercise 2: UMVUE of e^mu under N(mu, 1)

Show numerically that the UMVUE of $e^{\mu}$ when $X_1, \ldots, X_n \sim N(\mu, 1)$ is $g(\bar{X}) = \exp(\bar{X} - \frac{1}{2n})$. The correction $-1/(2n)$ debias the naive plug-in $e^{\bar{X}}$. Verify unbiasedness across a grid of $\mu$.

```r title="Exercise 2: Normal UMVUE of e^mu"
# Hint: simulate many N(mu,1) samples of size n; compute exp(mean - 1/(2n))

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="UMVUE of e^mu solution"
set.seed(59)
my_n_emu <- 30
my_emu_grid <- sapply(c(-1, 0, 1, 2), function(mu) {
  est <- replicate(20000, {
    x <- rnorm(my_n_emu, mean = mu, sd = 1)
    exp(mean(x) - 1/(2 * my_n_emu))
  })
  c(true = exp(mu), estimate = mean(est))
})
round(my_emu_grid, 4)
#>            [,1]   [,2]   [,3]   [,4]
#> true     0.3679 1.0000 2.7183 7.3891
#> estimate 0.3680 1.0007 2.7196 7.3873
```

**Explanation:** The naive plug-in $e^{\bar{X}}$ is biased upward (Jensen's inequality on the convex exponential). The factor $e^{-1/(2n)}$ exactly cancels the bias because $\bar{X} \sim N(\mu, 1/n)$ and the moment-generating function of a normal is $E[e^{t Z}] = e^{t\mu + t^2/(2n)}$. Completeness of $\bar{X}$ certifies this as the UMVUE.

</details>

### Exercise 3: U(0, theta) ancillary independence

For $X_1, \ldots, X_n \sim U(0, \theta)$, justify why Basu's theorem applies and use it to predict independence between $X_{(n)}$ and $X_{(1)} / X_{(n)}$. Then verify by simulation. Why does the same argument fail for $U(\theta, \theta + 1)$?

```r title="Exercise 3: U(0, theta) Basu"
# Hint: replicate(); compute (max, min/max); cor()

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="U(0, theta) Basu solution"
set.seed(67)
my_n_unif <- 30
my_unif_grid <- sapply(c(1, 4, 25, 200), function(theta) {
  pairs <- replicate(6000, {
    x <- runif(my_n_unif, min = 0, max = theta)
    c(max(x), min(x) / max(x))
  })
  cor(pairs[1, ], pairs[2, ])
})
round(my_unif_grid, 4)
#> [1]  0.0014 -0.0028  0.0044  0.0021
```

**Explanation:** $U(0, \theta)$ is a *scale* family. The maximum is complete sufficient (verified by direct calculation: $X_{(n)}/\theta \sim \text{Beta}(n, 1)$ is parameter-free, so any function that integrates to zero against the Beta density must be zero). The ratio $X_{(1)} / X_{(n)}$ is scale-invariant, hence ancillary. Basu's theorem applies. By contrast, $U(\theta, \theta + 1)$ is a location family where the sufficient statistic $(X_{(1)}, X_{(n)})$ has a non-trivial range function with constant expectation, breaking completeness.

</details>

## Complete Example

A researcher has a sample $X_1, \ldots, X_{20} \sim N(\mu, \sigma^2)$ with both parameters unknown and wants a 95% confidence interval for $\sigma^2$. Here is the end-to-end argument.

**Step 1: Identify the sufficient statistic.** The pair $(\bar{X}, S^2)$ is sufficient for $(\mu, \sigma^2)$ by the factorization theorem applied to the normal density.

**Step 2: Verify completeness.** $N(\mu, \sigma^2)$ is a two-parameter exponential family with natural parameter space the open half-plane $\{(\eta_1, \eta_2) : \eta_2 < 0\}$, full-dimensional. Therefore $(\bar{X}, S^2)$ is complete sufficient.

**Step 3: Find a pivot.** The statistic $W = (n-1) S^2 / \sigma^2$ is distributed as $\chi^2_{n-1}$ regardless of $(\mu, \sigma^2)$. This is *not* ancillary in the usual sense (it depends on $\sigma^2$), but it is a pivot, which means its distribution is parameter-free once we substitute the true $\sigma^2$.

**Step 4: Confirm Basu independence.** $\bar{X}$ is the marginal of the complete sufficient statistic for $\mu$ (given $\sigma$ known), and $S^2$ is location-invariant, hence ancillary for $\mu$ given $\sigma$. Basu confirms $\bar{X} \perp S^2$, which justifies treating the variance inference separately from the mean inference.

**Step 5: Construct the CI and verify coverage.** The 95% CI for $\sigma^2$ is

$$\left[\frac{(n-1) S^2}{\chi^2_{n-1, 0.975}},\ \frac{(n-1) S^2}{\chi^2_{n-1, 0.025}}\right].$$

```r title="End-to-end variance CI with Basu justification"
# 95% CI for sigma^2 using S^2 only (Basu justifies separation)
set.seed(101)
final_n <- 20
true_sigma2 <- 4
true_mu <- 7

final_sigma2_ci <- replicate(5000, {
  x <- rnorm(final_n, mean = true_mu, sd = sqrt(true_sigma2))
  s2 <- var(x)
  lower <- (final_n - 1) * s2 / qchisq(0.975, df = final_n - 1)
  upper <- (final_n - 1) * s2 / qchisq(0.025, df = final_n - 1)
  (lower <= true_sigma2) && (true_sigma2 <= upper)
})
mean(final_sigma2_ci)
#> [1] 0.9498
```

The empirical coverage is 94.98%, indistinguishable from the nominal 95%. Notice that we used only $S^2$ to build the interval, completely ignoring $\bar{X}$. Basu's theorem is what licenses this: the two are independent, so the variance inference is unaffected by the unknown mean. Without that independence, we would need to integrate out $\mu$ or use a joint pivot.

## Summary

| Concept | Definition | Key consequence |
|---|---|---|
| Sufficient statistic | Captures all information about $\theta$ | Conditioning on it loses nothing |
| Complete statistic | $E_\theta[g(T)] = 0\ \forall \theta \implies g \equiv 0$ | UMVUE is unique (Lehmann-Scheffé) |
| Ancillary statistic | Distribution does not depend on $\theta$ | Building block for conditional inference |
| Basu's theorem | Complete sufficient $\perp$ ancillary | Structural independence proofs |
| Exponential family theorem | Full-rank natural sufficient statistic is complete | Auto-completeness for normal, Poisson, gamma, etc. |
| Counterexamples | $U(\theta, \theta+1)$ has incomplete sufficient stat | Basu does not apply, prove independence directly |

![Map of complete and ancillary statistics concepts](screenshots/Complete-and-Ancillary-Statistics-in-R-summary-mindmap.webp)
*Figure 3: Map of the three core concepts and their relationships.*

The workflow you should internalize: identify the sufficient statistic, verify completeness (usually via the exponential family theorem), spot an ancillary, and conclude independence by Basu. When completeness fails, fall back on direct calculation. The framework rewards structural thinking over brute integration.

## References

1. Basu, D. (1955). *On Statistics Independent of a Complete Sufficient Statistic.* Sankhyā: The Indian Journal of Statistics, 15(4), 377-380. The original paper.
2. Lehmann, E. L., & Casella, G. (1998). *Theory of Point Estimation*, 2nd ed. Springer. Chapters 1.5 (sufficiency) and 1.6 (completeness). [Link](https://link.springer.com/book/10.1007/b98854)
3. Casella, G., & Berger, R. L. (2002). *Statistical Inference*, 2nd ed. Duxbury. Chapter 6 covers sufficiency, completeness, and ancillarity.
4. Berkeley STAT 210A reader. *Completeness, Ancillarity, and Basu's Theorem.* [Link](https://stat210a.berkeley.edu/fall-2024/reader/completeness.html)
5. Stigler, S. M. (1990). A Galtonian perspective on shrinkage estimators. *Statistical Science*, 5(1), 147-155. [Link](https://www.jstor.org/stable/2245746)
6. Wikipedia. *Basu's theorem.* [Link](https://en.wikipedia.org/wiki/Basu%27s_theorem)
7. R Core Team. *An Introduction to R.* [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html)

## Continue Learning

1. **Sufficient Statistics in R**, the prerequisite concept that completeness builds on. Learn the factorization theorem and minimal sufficiency.
2. **Maximum Likelihood Estimation in R**, the most common way to construct estimators, often hand-in-hand with sufficient statistics from exponential families.
3. **Ancillary Statistics & Basu's Theorem in R: Advanced Statistical Theory**, the companion post focusing on the ancillarity side, with location-family simulations.
