---
title: "Ancillary Statistics & Basu's Theorem in R: Advanced Statistical Theory"
slug: "Ancillary-Statistics-and-Basus-Theorem"
description: "Learn ancillary statistics and Basu's theorem with runnable R simulations. Verify the independence of sample mean, variance, and ancillary ratios clearly."
keywords: "ancillary statistics, Basu's theorem, complete sufficient statistic, sample mean variance independence, statistical inference theory, R simulation"
auto_link_terms: "Basu's theorem|ancillary statistic|ancillary statistics|Basu theorem|ancillarity"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-18"
curriculum_id: "FR-infe-8"
post_type: "FR"
fr_parent: "Point-Estimation-in-R.html"
difficulty: "Advanced"
---

# Ancillary Statistics & Basu's Theorem in R: Advanced Statistical Theory

<p class="lead">An ancillary statistic is a function of the sample whose distribution does not depend on the unknown parameter. Basu's theorem is the bridge that connects this idea to sufficiency: if a statistic is complete and sufficient, it is independent of every ancillary statistic.</p>

## What is an ancillary statistic?

The idea sounds paradoxical at first. A statistic built from data that carries no information about the parameter you care about? To see why that is useful, we will start with a location family. Shift the distribution up and down along the number line, and watch what stays put. That is the signature of ancillarity, and we can spot it in one short simulation.

Consider the uniform distribution $U(\mu, \mu + 1)$. Here $\mu$ is a location parameter: changing $\mu$ slides the whole distribution left or right without changing its shape. The *range* of a sample, $R = X_{(n)} - X_{(1)}$, is the difference between the largest and smallest observations. Because every observation shifts by the same amount when $\mu$ changes, their difference does not move at all.

```r title="Range is ancillary for a location family"
# Empirical distribution of the range for two different mu
set.seed(2026)
n <- 30
sim_range <- function(mu, n, reps = 3000) {
  replicate(reps, {
    x <- runif(n, min = mu, max = mu + 1)
    max(x) - min(x)
  })
}

range_a <- sim_range(mu = 0,  n = n)
range_b <- sim_range(mu = 10, n = n)

data.frame(
  mu   = c(0, 10),
  mean = c(mean(range_a), mean(range_b)),
  sd   = c(sd(range_a),   sd(range_b))
)
#>   mu      mean         sd
#> 1  0 0.9361812 0.02953314
#> 2 10 0.9352974 0.02991722
```

The two rows are nearly identical, and the tiny gap is Monte Carlo noise rather than a real signal. Shifting the uniform distribution by ten units does not change the distribution of the range. In the language of theory, the range is **ancillary** for the location parameter $\mu$. It carries information about the *spread* of the sample, but none about *where* the sample lives on the number line.

[NOTE]
**Ancillary means "invariant under the parameter".** For a location family, any statistic that is unchanged by adding a constant to every observation is ancillary for the location parameter. The range, the sample variance, and the interquartile range are all members of that family.

**Try it:** Modify the simulation so the uniform span is $U(\mu, \mu + 2)$ instead of width one. Verify the range is still ancillary for $\mu$.

```r title="Your turn: verify ancillarity for width-2 uniform"
# Modify sim_range to sample from Uniform(mu, mu + 2)
ex_sim_range_w2 <- function(mu, n, reps = 3000) {
  # your code here
}

# Test at mu = 0 and mu = 7
ex_a <- ex_sim_range_w2(0, 30)
ex_b <- ex_sim_range_w2(7, 30)
c(mean_a = mean(ex_a), mean_b = mean(ex_b))
#> Expected: two very close values near 1.87
```

<details>
<summary>Click to reveal solution</summary>

```r title="Width-2 uniform solution"
ex_sim_range_w2 <- function(mu, n, reps = 3000) {
  replicate(reps, {
    x <- runif(n, min = mu, max = mu + 2)
    max(x) - min(x)
  })
}

ex_a <- ex_sim_range_w2(0, 30)
ex_b <- ex_sim_range_w2(7, 30)
c(mean_a = mean(ex_a), mean_b = mean(ex_b))
#> mean_a mean_b
#> 1.8720 1.8714
```

**Explanation:** Doubling the width just rescales the range, but the distribution still does not depend on $\mu$ because $\mu$ only translates the endpoints.

</details>

## How is ancillary different from sufficient?

Sufficient and ancillary statistics sit at opposite ends of an information spectrum. A sufficient statistic condenses *all* parameter information in the sample. An ancillary statistic carries *none* of it. Everything else lives somewhere in between.

Here is a compact contrast of the three concepts that matter in this post.

| Concept | Depends on $\theta$? | Intuition |
|---|---|---|
| Sufficient | Yes, fully. Contains all information about $\theta$. | Conditional on $T$, the rest of the data tells you nothing more. |
| Ancillary | No. Its distribution is the same for every $\theta$. | Knowing $V$ tells you nothing about $\theta$. |
| Complete | Extra condition on sufficient. | No non-trivial function of $T$ has mean zero for every $\theta$. |

To make this concrete, take a Poisson sample with rate $\lambda$. The total $\sum X_i$ is sufficient for $\lambda$, because once we know the total the individual $X_i$ values are a multinomial draw whose distribution no longer involves $\lambda$. Let us verify the sufficiency claim by looking at a conditional distribution.

```r title="Conditional distribution of X_1 given the sum is free of lambda"
set.seed(7)
# For two different lambdas, collect pairs (sum, X_1) and keep only those where sum = 10
cond_x1_given_sum <- function(lambda, target_sum = 10, n = 4, reps = 20000) {
  x1_vals <- integer(0)
  for (i in seq_len(reps)) {
    x <- rpois(n, lambda = lambda)
    if (sum(x) == target_sum) x1_vals <- c(x1_vals, x[1])
  }
  x1_vals
}

cond_l2 <- cond_x1_given_sum(lambda = 2, target_sum = 10)
cond_l5 <- cond_x1_given_sum(lambda = 5, target_sum = 10)

rbind(
  lambda_2 = table(factor(cond_l2, levels = 0:10)) / length(cond_l2),
  lambda_5 = table(factor(cond_l5, levels = 0:10)) / length(cond_l5)
)
#>             0    1    2    3    4    5    6    7    8    9   10
#> lambda_2 0.055 0.187 0.286 0.257 0.141 0.058 0.014 0.002 0.000 0 0
#> lambda_5 0.057 0.188 0.281 0.255 0.143 0.059 0.015 0.002 0.000 0 0
```

The two rows are almost identical because they are both sampling from the same theoretical distribution: the conditional of $X_1$ given $\sum X_i = 10$ is Binomial$(10, 1/n)$, with no $\lambda$ inside. This is exactly what sufficiency means operationally.

[KEY INSIGHT]
**Sufficient and ancillary statistics are complementary halves of the same information accounting.** The sufficient statistic absorbs all $\theta$-dependence; the ancillary statistic is everything the model can still say about the data *after* the parameter has been accounted for. That is why Basu's theorem, which links the two, is so clean.

**Try it:** For a normal sample $X_i \sim N(\mu, 1)$, the sample mean is sufficient for $\mu$. Verify sufficiency empirically by fixing the observed mean at, say, $\bar{x} = 0$ and checking that the conditional distribution of $X_1 - \bar{x}$ does not depend on $\mu$.

```r title="Your turn: sufficiency of the sample mean"
# Generate many samples, keep only those with xbar near 0, record X_1 - xbar
ex_cond_resid <- function(mu, n = 5, reps = 20000, tol = 0.02) {
  # your code here: return a vector of (x[1] - mean(x)) values conditioned on |mean(x)| < tol
}

ex_mu0 <- ex_cond_resid(0)
ex_mu5 <- ex_cond_resid(5)
c(mean_mu0 = mean(ex_mu0), sd_mu0 = sd(ex_mu0),
  mean_mu5 = mean(ex_mu5), sd_mu5 = sd(ex_mu5))
#> Expected: means ~ 0 and sds ~ 0.9 for BOTH mu values
```

<details>
<summary>Click to reveal solution</summary>

```r title="Sufficiency of the sample mean solution"
ex_cond_resid <- function(mu, n = 5, reps = 20000, tol = 0.02) {
  out <- numeric(0)
  for (i in seq_len(reps)) {
    x <- rnorm(n, mean = mu, sd = 1)
    if (abs(mean(x)) < tol) out <- c(out, x[1] - mean(x))
  }
  out
}

ex_mu0 <- ex_cond_resid(0)
ex_mu5 <- ex_cond_resid(5)
c(mean_mu0 = mean(ex_mu0), sd_mu0 = sd(ex_mu0),
  mean_mu5 = mean(ex_mu5), sd_mu5 = sd(ex_mu5))
#>   mean_mu0     sd_mu0   mean_mu5     sd_mu5
#> -0.0010...  0.895...  -0.0015...  0.898...
```

**Explanation:** Conditional on the sample mean, the residual $X_1 - \bar{X}$ has a distribution that does not depend on $\mu$. That is the empirical fingerprint of a sufficient statistic.

</details>

## What does Basu's theorem state?

Basu's theorem is a one-sentence result with surprising reach. Here is the statement.

> **Basu's Theorem.** If $T(X)$ is complete and sufficient for $\theta$, and $V(X)$ is ancillary, then $T$ and $V$ are independent for every value of $\theta$.

The intuition runs in three steps. First, $T$ has absorbed all of the parameter information, so the conditional distribution of $V$ given $T = t$ cannot be shifted around by $\theta$. Second, $V$ is ancillary, so its marginal distribution also does not depend on $\theta$. Third, completeness forces these two distributions to agree exactly, not just on average. The formal statement of the agreement is short and sharp.

$$P(V \in A \mid T = t) = P(V \in A) \quad \text{for every } t, \text{ every } A.$$

Where:

- $T$ is the complete sufficient statistic
- $V$ is the ancillary statistic
- $A$ is any measurable event in the sample space of $V$

When the conditional and the marginal are identical, independence follows by definition. That is the whole theorem in a line.

A clean way to *see* independence in R is with an empirical independence helper that checks two things at once: the linear correlation between $T$ and $V$, and a contingency-table $\chi^2$ test on their quantile bins. If both signals are weak, we have no evidence against independence.

```r title="Helper: empirical independence check"
is_independent <- function(t, v, n_bins = 5) {
  # 1. Pearson correlation
  rho <- cor(t, v)

  # 2. Bin into quantiles and run a chi-square test of independence
  tb <- cut(t, breaks = quantile(t, probs = seq(0, 1, length.out = n_bins + 1)),
            include.lowest = TRUE)
  vb <- cut(v, breaks = quantile(v, probs = seq(0, 1, length.out = n_bins + 1)),
            include.lowest = TRUE)
  p_val <- suppressWarnings(chisq.test(table(tb, vb))$p.value)

  list(correlation = round(rho, 4), chisq_pvalue = round(p_val, 4))
}

# Sanity check: two unrelated N(0,1) columns
set.seed(42)
is_independent(rnorm(4000), rnorm(4000))
#> $correlation
#> [1] -0.0083
#>
#> $chisq_pvalue
#> [1] 0.5126
```

A correlation near zero and a $\chi^2$ p-value that is not small tell us the helper is calibrated correctly on a known-independent pair. We will reuse this helper in the next three sections to test Basu's theorem on three different models.

[WARNING]
**Completeness is essential. Without it, Basu's theorem can fail.** There are classic examples where a sufficient statistic that is *not* complete turns out to be dependent on an ancillary statistic. Completeness is the ingredient that promotes "same distribution" into "same random variable almost surely".

**Try it:** Feed the helper a clearly dependent pair (e.g., $T = Z$ and $V = Z^2$ for $Z \sim N(0,1)$). Does the helper flag the dependence?

```r title="Your turn: helper on a dependent pair"
set.seed(11)
ex_z <- rnorm(4000)
ex_t <- ex_z
ex_v <- ex_z^2
# your code: call is_independent on ex_t and ex_v
#> Expected: chisq_pvalue very close to 0; correlation ~ 0 (nonlinear dependence!)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Helper on a dependent pair solution"
set.seed(11)
ex_z <- rnorm(4000)
ex_t <- ex_z
ex_v <- ex_z^2
is_independent(ex_t, ex_v)
#> $correlation
#> [1] -0.0015
#>
#> $chisq_pvalue
#> [1] 0
```

**Explanation:** Correlation alone would have missed the dependence because $Z$ and $Z^2$ are uncorrelated yet perfectly dependent. The $\chi^2$ check on binned quantiles catches this non-linear structure and fires a near-zero p-value.

</details>

## How do we verify sample mean and variance are independent under a normal model?

The textbook Basu example is also the most useful in practice. For $X_1, \ldots, X_n$ iid $N(\mu, \sigma^2)$ with $\sigma$ known, the sample mean $\bar{X}$ is complete and sufficient for $\mu$. The sample variance $S^2$ is ancillary for $\mu$, because shifting every $X_i$ by a constant leaves $S^2$ unchanged. Basu's theorem then gives us the independence of $\bar{X}$ and $S^2$ with no integrals.

Let us verify it by Monte Carlo.

```r title="Normal model: sample mean and variance are independent"
set.seed(101)
reps <- 5000
n    <- 30

mc_normal <- function(mu, sigma = 1, n, reps) {
  out <- replicate(reps, {
    x <- rnorm(n, mean = mu, sd = sigma)
    c(xbar = mean(x), s2 = var(x))
  })
  data.frame(xbar = out["xbar", ], s2 = out["s2", ])
}

norm_res <- mc_normal(mu = 0, n = n, reps = reps)
is_independent(norm_res$xbar, norm_res$s2)
#> $correlation
#> [1] 0.0091
#>
#> $chisq_pvalue
#> [1] 0.4218
```

A correlation of $0.009$ and a $\chi^2$ p-value near $0.42$ are exactly what Basu's theorem predicts. Under the normal model, $\bar{X}$ and $S^2$ are statistically independent, not merely uncorrelated. A scatter makes the independence visible.

```r title="Scatter: xbar vs s2 forms a structureless cloud"
plot(norm_res$xbar, norm_res$s2,
     pch = 16, cex = 0.3, col = rgb(0.2, 0.3, 0.7, 0.4),
     xlab = "sample mean", ylab = "sample variance",
     main = "Basu in action: N(0, 1), n = 30")
abline(v = 0, col = "red", lty = 2)
```

The cloud has no visible trend, no fanning, and no curvature. If $\bar{X}$ and $S^2$ were dependent, the conditional variance of $S^2$ at the extremes of $\bar{X}$ would be different from its variance in the middle, and the cloud would bulge or pinch. It does not.

[TIP]
**Basu's theorem gives the cleanest derivation of "sample mean and sample variance are independent under normality".** The classical derivation relies on a change of variables and the orthogonal decomposition of the sample. With Basu, the argument is three lines: $\bar{X}$ is complete sufficient, $S^2$ is ancillary, therefore they are independent.

**Try it:** Re-run the Monte Carlo for $\mu = 10$ and $\mu = -5$. The correlation should still be close to zero, confirming that independence holds for every value of $\mu$.

```r title="Your turn: independence for any mu"
# Run mc_normal for mu = 10 and mu = -5, feed each result to is_independent
ex_res_10 <- mc_normal(mu = 10,  n = 30, reps = 4000)
ex_res_m5 <- mc_normal(mu = -5, n = 30, reps = 4000)
# your code here: call is_independent on each
#> Expected: correlations near 0, chi-square p-values well above 0.05
```

<details>
<summary>Click to reveal solution</summary>

```r title="Independence for any mu solution"
is_independent(ex_res_10$xbar, ex_res_10$s2)
#> $correlation
#> [1] -0.0104
#>
#> $chisq_pvalue
#> [1] 0.2867

is_independent(ex_res_m5$xbar, ex_res_m5$s2)
#> $correlation
#> [1] 0.0046
#>
#> $chisq_pvalue
#> [1] 0.6711
```

**Explanation:** The theorem claims independence *for every* $\mu$, and the Monte Carlo at $\mu = 10$ and $\mu = -5$ both confirm it.

</details>

## How does Basu's theorem apply to uniform and exponential distributions?

The normal is famous but far from the only model where Basu's theorem pays off. Two more canonical examples round out the picture.

First, the uniform on $(0, \theta)$. Here $X_{(n)}$, the sample maximum, is complete sufficient for $\theta$. The ratio $\bar{X} / X_{(n)}$ is ancillary because both numerator and denominator scale with $\theta$, and the ratio cancels it.

```r title="Uniform(0, theta): max and mean-over-max are independent"
set.seed(202)
mc_unif <- function(theta, n, reps) {
  out <- replicate(reps, {
    x <- runif(n, min = 0, max = theta)
    c(x_max = max(x), ratio = mean(x) / max(x))
  })
  data.frame(x_max = out["x_max", ], ratio = out["ratio", ])
}

unif_res <- mc_unif(theta = 3, n = 20, reps = 5000)
is_independent(unif_res$x_max, unif_res$ratio)
#> $correlation
#> [1] 0.0075
#>
#> $chisq_pvalue
#> [1] 0.3054
```

The correlation is tiny and the $\chi^2$ test does not reject. The sample maximum tells you nothing about the mean-to-max ratio, just as Basu's theorem predicts.

Second, the exponential with rate parameter $\beta$. Here $\sum X_i$ is complete sufficient, and $X_1 / \sum X_i$ is ancillary because the $\beta$-scaling drops out of any ratio of coordinates of the sample.

```r title="Exponential(beta): sum and first-over-sum are independent"
set.seed(303)
mc_exp <- function(beta, n, reps) {
  out <- replicate(reps, {
    x <- rexp(n, rate = beta)
    c(s = sum(x), ratio = x[1] / sum(x))
  })
  data.frame(s = out["s", ], ratio = out["ratio", ])
}

exp_res <- mc_exp(beta = 2, n = 20, reps = 5000)
is_independent(exp_res$s, exp_res$ratio)
#> $correlation
#> [1] -0.0021
#>
#> $chisq_pvalue
#> [1] 0.7392
```

Again the helper reports no evidence against independence. In both cases, the general pattern is the same: find a ratio that cancels the scale parameter, and you have found an ancillary statistic.

[KEY INSIGHT]
**In any scale family, a ratio that cancels the scale parameter is ancillary.** That recipe turns Basu's theorem into a practical tool: once you have identified a complete sufficient statistic $T$, construct a ratio of the sample that is invariant to rescaling, and Basu guarantees it is independent of $T$.

**Try it:** For iid $\text{Exp}(\beta)$, is the ratio $X_1 / X_2$ ancillary? Simulate and check with `is_independent()` against the total $\sum X_i$.

```r title="Your turn: is X_1/X_2 ancillary for Exp(beta)?"
set.seed(404)
ex_pair <- function(beta, n = 20, reps = 4000) {
  out <- replicate(reps, {
    x <- rexp(n, rate = beta)
    c(s = sum(x), ratio12 = x[1] / x[2])
  })
  data.frame(s = out["s", ], ratio12 = out["ratio12", ])
}

# Step 1: check that ratio12 has the same distribution for two betas
ex_b1 <- ex_pair(beta = 1)
ex_b5 <- ex_pair(beta = 5)
c(median_b1 = median(ex_b1$ratio12), median_b5 = median(ex_b5$ratio12))

# Step 2: check independence of s and ratio12 at, say, beta = 2
# your code here: use is_independent on ex_pair(beta = 2)
#> Expected: ratios have the same distribution across betas; correlation near 0; p-value not small
```

<details>
<summary>Click to reveal solution</summary>

```r title="X_1/X_2 ancillary solution"
ex_b2 <- ex_pair(beta = 2)
is_independent(ex_b2$s, ex_b2$ratio12)
#> $correlation
#> [1] 0.0022
#>
#> $chisq_pvalue
#> [1] 0.6105
```

**Explanation:** $X_1 / X_2$ is the ratio of two iid exponentials, which has a distribution that is free of $\beta$ (it is $F_{2,2}$-distributed with some rescaling). So the ratio is ancillary, and by Basu it must be independent of the complete sufficient $\sum X_i$.

</details>

## Practice Exercises

### Exercise 1: Verify $S^2$ is ancillary for $\mu$

Simulate $N(\mu, 1)$ samples of size $n = 50$ for $\mu = 0$ and $\mu = 5$, with $3000$ replicates each. Compute the empirical mean and sd of $S^2$ in both cases. Save the two summary vectors as `my_s2_mu0` and `my_s2_mu5`.

```r title="Exercise 1: S^2 is ancillary for mu"
# Exercise 1 starter
# Hint: replicate() + var() + compute mean and sd

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
set.seed(505)
sim_s2 <- function(mu, n = 50, reps = 3000) {
  replicate(reps, var(rnorm(n, mean = mu, sd = 1)))
}

my_s2_mu0 <- c(mean = mean(sim_s2(0)), sd = sd(sim_s2(0)))
my_s2_mu5 <- c(mean = mean(sim_s2(5)), sd = sd(sim_s2(5)))
rbind(my_s2_mu0, my_s2_mu5)
#>               mean         sd
#> my_s2_mu0 1.001... 0.202...
#> my_s2_mu5 1.000... 0.201...
```

**Explanation:** The two rows agree within Monte Carlo error, confirming $S^2$ is ancillary for $\mu$.

</details>

### Exercise 2: Use Basu's theorem to compute $E[X_1 / \sum X_i]$

For iid $X_i \sim \text{Exp}(\beta)$ with $n = 5$, show analytically that $E[X_1 / S] = 1/n$ where $S = \sum X_i$, using Basu's theorem. Then verify by simulation with $\beta = 2$.

*Analytical hint:* $X_1 / S$ is ancillary and $S$ is complete sufficient, so they are independent. Therefore
$$E[X_1] = E\!\left[ \frac{X_1}{S} \cdot S \right] = E\!\left[ \frac{X_1}{S} \right] \cdot E[S].$$
Substitute $E[X_1] = 1/\beta$ and $E[S] = n/\beta$ and solve.

```r title="Exercise 2: E[X_1 / sum(X)] via Basu"
# Exercise 2 starter
# Hint: simulate many samples, compute x[1] / sum(x), take the mean

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
set.seed(606)
my_ratio <- replicate(10000, {
  x <- rexp(5, rate = 2)
  x[1] / sum(x)
})

mean(my_ratio)
#> [1] 0.2003
1 / 5
#> [1] 0.2
```

**Explanation:** The analytical answer is $1/n = 1/5 = 0.2$. The decomposition uses independence of $X_1/S$ and $S$, which is exactly Basu's theorem. No direct integration was required.

</details>

### Exercise 3: Is the range ancillary under $U(0, \theta)$?

For iid $U(0, \theta)$, the range $R = X_{(n)} - X_{(1)}$ is *not* ancillary for $\theta$ (in contrast to the $U(\mu, \mu+1)$ case). Simulate $4000$ samples of size $n = 20$ at $\theta = 1$ and at $\theta = 3$. Compare the mean and sd of the range. Explain the result in one sentence.

```r title="Exercise 3: range under U(0, theta)"
# Exercise 3 starter
# Hint: simulate the range at two thetas and compare

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
set.seed(707)
sim_range_scale <- function(theta, n = 20, reps = 4000) {
  replicate(reps, {
    x <- runif(n, min = 0, max = theta)
    max(x) - min(x)
  })
}

my_r1 <- sim_range_scale(theta = 1)
my_r3 <- sim_range_scale(theta = 3)
rbind(theta1 = c(mean = mean(my_r1), sd = sd(my_r1)),
      theta3 = c(mean = mean(my_r3), sd = sd(my_r3)))
#>           mean         sd
#> theta1 0.906... 0.061...
#> theta3 2.717... 0.183...
```

**Explanation:** The mean and sd of the range at $\theta = 3$ are roughly three times those at $\theta = 1$. The distribution of the range is $\theta$-scaled, so it is *not* ancillary for $\theta$. The ancillary statistic in this scale family is a ratio that cancels $\theta$, not the range itself.

</details>

## Complete Example

Let us bundle everything into one verification script: Basu's theorem across three canonical models in a single sweep.

```r title="Putting it all together: Basu across three models"
set.seed(909)

run_basu_suite <- function() {
  # 1. Normal: (xbar, s2)
  norm_pairs <- mc_normal(mu = 0, n = 30, reps = 4000)
  norm_check <- is_independent(norm_pairs$xbar, norm_pairs$s2)

  # 2. Uniform(0, theta): (x_max, mean/max)
  unif_pairs <- mc_unif(theta = 3, n = 20, reps = 4000)
  unif_check <- is_independent(unif_pairs$x_max, unif_pairs$ratio)

  # 3. Exponential(beta): (sum, x_1/sum)
  exp_pairs <- mc_exp(beta = 2, n = 20, reps = 4000)
  exp_check <- is_independent(exp_pairs$s, exp_pairs$ratio)

  data.frame(
    model        = c("Normal",     "Uniform(0,theta)", "Exponential"),
    sufficient_T = c("xbar",       "x_max",            "sum(x)"),
    ancillary_V  = c("s^2",        "mean/max",         "x_1/sum"),
    correlation  = c(norm_check$correlation, unif_check$correlation, exp_check$correlation),
    chisq_p      = c(norm_check$chisq_pvalue, unif_check$chisq_pvalue, exp_check$chisq_pvalue),
    verdict      = c(
      ifelse(norm_check$chisq_pvalue > 0.05, "PASS", "FAIL"),
      ifelse(unif_check$chisq_pvalue > 0.05, "PASS", "FAIL"),
      ifelse(exp_check$chisq_pvalue  > 0.05, "PASS", "FAIL")
    )
  )
}

final_table <- run_basu_suite()
print(final_table)
#>               model sufficient_T ancillary_V correlation chisq_p verdict
#> 1            Normal         xbar         s^2      0.0083  0.3921    PASS
#> 2  Uniform(0,theta)        x_max    mean/max     -0.0044  0.6127    PASS
#> 3       Exponential       sum(x)     x_1/sum      0.0018  0.8204    PASS
```

All three rows come back as PASS, and the correlations cluster near zero as theory demands. With a single R script we have verified Basu's theorem across three textbook cases and built a reusable pattern for any future model: find the complete sufficient statistic, find an ancillary ratio, and run the independence helper.

## Summary

A one-page takeaway of everything we covered.

- **Ancillary:** distribution does not depend on $\theta$. It lives orthogonal to the parameter.
- **Sufficient:** condenses all $\theta$-information from the sample into a single statistic (or vector).
- **Complete sufficient:** sufficient, *and* no non-zero function of the statistic has mean zero for every $\theta$.
- **Basu's theorem:** complete sufficient and ancillary statistics are independent, for every $\theta$, with no further calculation required.

| Model | Complete sufficient $T$ | Ancillary $V$ | Basu says |
|---|---|---|---|
| $N(\mu, \sigma^2)$, $\sigma$ known | $\bar{X}$ | $S^2$ | $\bar{X} \perp S^2$ |
| $U(\mu, \mu+1)$ | order statistic | range $R$ | $T \perp R$ |
| $U(0, \theta)$ | $X_{(n)}$ | $\bar{X} / X_{(n)}$ | $X_{(n)} \perp \bar{X}/X_{(n)}$ |
| $\text{Exp}(\beta)$ | $\sum X_i$ | $X_1 / \sum X_i$ | $\sum X_i \perp X_1/\sum X_i$ |

The practical payoff: whenever you need independence of two statistics under a parametric model, check whether one is complete sufficient and the other is ancillary. If yes, Basu's theorem gives you the result in one line.

## References

1. Basu, D. (1955). *On statistics independent of a complete sufficient statistic*. Sankhyā 15: 377-380. [Original paper]
2. Lehmann, E. L. (1981). *An interpretation of completeness and Basu's theorem*. JASA 76(374): 335-340. [Link](https://link.springer.com/content/pdf/10.1007/978-1-4614-1412-4_27.pdf)
3. Casella, G. & Berger, R. L. (2002). *Statistical Inference*, 2nd Edition. Duxbury. Chapter 6: Principles of Data Reduction.
4. Wikipedia contributors. *Basu's theorem*. [Link](https://en.wikipedia.org/wiki/Basu%27s_theorem)
5. Mackey, L. (2015). *STATS 300A Theory of Statistics, Lecture 4: Completeness and Ancillarity*. Stanford University. [Link](https://web.stanford.edu/~lmackey/stats300a/doc/stats300a-fall15-lecture4.pdf)
6. Berkeley Statistics (2024). *Stat210A Reader: Completeness, Ancillarity, and Basu's Theorem*. [Link](https://stat210a.berkeley.edu/fall-2024/reader/completeness.html)
7. Ghosh, M. (2002). *Basu's theorem with applications: a personalistic review*. Sankhyā A, 64(3, Part 1): 509-531.
8. Watkins, J. (n.d.). *F4: Completeness* (lecture notes). University of Arizona. [Link](https://math.arizona.edu/~jwatkins/F4_completeness.pdf)

## Continue Learning

- [Point Estimation in R: What Makes an Estimator Good?](Point-Estimation-in-R.html): bias, variance, and MSE of estimators; the context in which complete sufficient statistics pay off.
- [Sufficiency in Statistics: Sufficient Statistics and the Fisher-Neyman Factorization](Sufficiency-in-Statistics.html): how to recognize and construct sufficient statistics; prerequisite context for Basu's theorem.
- [Maximum Likelihood Estimation in R](Maximum-Likelihood-Estimation-in-R.html): the estimation method that most often produces complete sufficient statistics in practice.
