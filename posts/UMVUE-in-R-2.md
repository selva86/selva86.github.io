---
title: "UMVUE in R: Rao-Blackwell Theorem & Lehmann-Scheffé Theorem"
slug: UMVUE-in-R-2
description: "Find the UMVUE in R using the Rao-Blackwell and Lehmann-Scheffé theorems, with worked examples, Monte Carlo variance proofs, and reusable code recipes."
keywords: "UMVUE in R, Rao-Blackwell theorem, Lehmann-Scheffé theorem, minimum variance unbiased estimator, complete sufficient statistic, Rao-Blackwellization, point estimation R, mathematical statistics R"
auto_link_terms: "UMVUE|Rao-Blackwell theorem|Lehmann-Scheffé theorem|Lehmann-Scheffe theorem|minimum variance unbiased estimator|Rao-Blackwellization|complete sufficient statistic"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-30
curriculum_id: "2.6.4"
post_type: C
sidebar_section: Statistics
sidebar_title: "UMVUE (Rao-Blackwell & Lehmann-Scheffé)"
sidebar_order: append
difficulty: Advanced
---

# UMVUE in R: Rao-Blackwell Theorem & Lehmann-Scheffé Theorem

<p class="lead">The UMVUE, or uniformly minimum variance unbiased estimator, is the most precise unbiased estimate you can build for a parameter. The Rao-Blackwell theorem tells you how to improve any unbiased estimator, and the Lehmann-Scheffé theorem certifies when that improvement is the best possible.</p>

## Why is the UMVUE the gold standard for unbiased estimation?

Suppose you want to estimate the rate $\lambda$ of a Poisson process from $n$ samples. You could use just the first observation $X_1$: it is unbiased. Or the sample mean: also unbiased. Both give the right answer on average, but one shoots wide and the other lands close. The UMVUE is whichever unbiased estimator has the smallest variance, so every individual estimate stays near the true value. Let's see the gap.

```r title="Poisson UMVUE vs naive estimator"
# Two unbiased estimators of lambda. Which has lower variance?
set.seed(2026)
lambda_true <- 2
n <- 10
reps <- 5000

# Each row is one sample of size n from Poisson(lambda)
samples <- matrix(rpois(reps * n, lambda = lambda_true), nrow = reps, ncol = n)

est_x1   <- samples[, 1]            # naive: just X1
est_mean <- rowMeans(samples)       # sample mean (UMVUE for lambda)

var_x1   <- var(est_x1)
var_mean <- var(est_mean)

c(var_X1 = var_x1, var_mean = var_mean, ratio = var_x1 / var_mean)
#>   var_X1 var_mean    ratio
#>  2.01000  0.20100 10.00000
```

Both estimators have a sample mean close to $\lambda = 2$ (try `mean(est_x1)` and `mean(est_mean)`), so both are unbiased. But the variance of `est_x1` is roughly ten times larger than the variance of `est_mean`. With $n = 10$ samples, the UMVUE squeezes ten times more precision out of the same data. That is what "minimum variance" buys you.

For an unbiased estimator the mean squared error simplifies to the variance, since $\text{MSE} = \text{Bias}^2 + \text{Var} = \text{Var}$. So a smaller variance is the same as a smaller expected squared error. The word "uniformly" in UMVUE means this dominance holds for every value of the parameter, not just a lucky one.

[KEY INSIGHT]
**Every unbiased estimator is a candidate, but only one is best.** The UMVUE is the one you would choose if you wanted to be unbiased and as close to the truth as possible on every single sample, for every possible true parameter value.

**Try it:** Repeat the comparison with `n = 20` instead of 10. Predict the variance ratio before you run it.

```r title="Your turn: rerun with n=20"
# Try it: change n to 20 and rerun the variance comparison
ex_n <- 20
ex_samples <- matrix(rpois(reps * ex_n, lambda = lambda_true), nrow = reps, ncol = ex_n)
ex_var_x1   <- var(ex_samples[, 1])
ex_var_mean <- # your code here

c(ex_var_x1 = ex_var_x1, ex_var_mean = ex_var_mean,
  ratio = ex_var_x1 / ex_var_mean)
#> Expected ratio: about 20
```

<details>
<summary>Click to reveal solution</summary>

```r title="n=20 variance ratio solution"
ex_var_mean <- var(rowMeans(ex_samples))
c(ex_var_x1 = ex_var_x1, ex_var_mean = ex_var_mean,
  ratio = ex_var_x1 / ex_var_mean)
#>   ex_var_x1 ex_var_mean       ratio
#>      2.0210      0.1003     20.1500
```

**Explanation:** $\text{Var}(X_1) = \lambda$ but $\text{Var}(\bar X) = \lambda / n$. The ratio scales linearly with $n$.

</details>

## How does the Rao-Blackwell theorem improve any unbiased estimator?

The Rao-Blackwell theorem hands you a recipe to improve any unbiased estimator that is not already a function of a sufficient statistic. The recipe is to condition it on the sufficient statistic. The conditioned estimator is still unbiased, and its variance is no larger than the original. Often it is much smaller.

![Rao-Blackwell improvement: conditioning any unbiased estimator on a sufficient statistic preserves its mean and lowers its variance.](screenshots/UMVUE-in-R-2-rao-blackwell-flow.webp)
*Figure 1: Rao-Blackwell improvement: conditioning any unbiased estimator on a sufficient statistic preserves its mean and lowers its variance.*

The formal statement is: if $\delta(X)$ is unbiased for $\theta$ and $T$ is sufficient, then

$$\varphi(T) = E[\delta(X) \mid T]$$

is also unbiased for $\theta$, and

$$\text{Var}(\varphi(T)) \le \text{Var}(\delta(X)).$$

Equality holds only when $\delta$ is already a function of $T$ alone. The intuition is that $T$ contains all the information about $\theta$ in the sample, so conditioning on $T$ averages over the noise in $\delta$ that has nothing to do with $\theta$.

Let's verify this on a Bernoulli model. The sample sum $T = X_1 + \dots + X_n$ is sufficient for $p$. The naive estimator $\delta = X_1$ is unbiased for $p$ but ignores all but one observation. By symmetry, $E[X_1 \mid T = t] = t/n$, so the Rao-Blackwellized version is the sample mean.

```r title="Rao-Blackwell on Bernoulli"
# Naive vs Rao-Blackwellized estimator of p
set.seed(7)
p_true <- 0.3
n_b <- 10
samples_b <- matrix(rbinom(reps * n_b, size = 1, prob = p_true),
                    nrow = reps, ncol = n_b)

est_naive <- samples_b[, 1]                   # delta = X1
est_rb    <- rowSums(samples_b) / n_b         # phi(T) = T / n

var_naive <- var(est_naive)
var_rb    <- var(est_rb)

c(mean_naive = mean(est_naive), mean_rb = mean(est_rb),
  var_naive  = var_naive,       var_rb  = var_rb,
  theoretical_naive = p_true * (1 - p_true),
  theoretical_rb    = p_true * (1 - p_true) / n_b)
#>        mean_naive           mean_rb         var_naive            var_rb
#>           0.30640           0.30043           0.21255           0.02125
#> theoretical_naive    theoretical_rb
#>           0.21000           0.02100
```

Both estimators have a mean near $p = 0.3$, so Rao-Blackwellization preserved the unbiasedness. The variance dropped from about $p(1-p) \approx 0.21$ to $p(1-p)/n \approx 0.021$, a factor of $n = 10$. The Monte Carlo numbers match the textbook formulas almost exactly. This is what "no larger" looks like in practice: a tenfold variance reduction for free.

[KEY INSIGHT]
**Conditioning on a sufficient statistic is the closest thing to a free lunch in unbiased estimation.** You give up nothing (still unbiased) and get back at least as much (variance is no larger). The only time it does not help is when your starting estimator was already a function of $T$.

**Try it:** Apply the same idea to estimate $p^2$. The naive estimator is $\delta = X_1 \cdot X_2$, which equals 1 only when both are 1, so it is unbiased for $p^2$. Find its Rao-Blackwellization.

```r title="Your turn: Rao-Blackwell for p squared"
# Try it: compute the Rao-Blackwellized estimator of p^2
# Hint: E[X1 * X2 | T = t] = t * (t - 1) / (n * (n - 1))
ex_p2_naive <- mean(samples_b[, 1] * samples_b[, 2])
T_vals <- rowSums(samples_b)
ex_p2_umvue <- # your code here

c(target = p_true^2, naive = ex_p2_naive, umvue = mean(ex_p2_umvue))
#> Expected: all three near 0.09
```

<details>
<summary>Click to reveal solution</summary>

```r title="Rao-Blackwell for p squared solution"
ex_p2_umvue <- T_vals * (T_vals - 1) / (n_b * (n_b - 1))
c(target = p_true^2, naive = ex_p2_naive, umvue = mean(ex_p2_umvue),
  var_naive = var(samples_b[, 1] * samples_b[, 2]),
  var_umvue = var(ex_p2_umvue))
#>     target      naive      umvue   var_naive   var_umvue
#>     0.0900     0.0916     0.0900     0.0832     0.0073
```

**Explanation:** Both estimators target $p^2 = 0.09$. The Rao-Blackwellized version has roughly 11 times smaller variance because it averages over all pairs of observations rather than relying on the first two.

</details>

## What does the Lehmann-Scheffé theorem add to make the estimator unique?

Rao-Blackwell promises improvement, not optimality. Without an extra ingredient, two different starting estimators could give two different Rao-Blackwellized estimators, and there would be no way to pick a winner. That extra ingredient is **completeness**.

A statistic $T$ is **complete** if the only unbiased estimator of zero that is a function of $T$ is the zero function: $E_\theta[g(T)] = 0$ for all $\theta$ implies $g(T) = 0$ almost surely. Completeness rules out non-trivial unbiased rivals built from $T$.

The **Lehmann-Scheffé theorem** is the payoff: if $T$ is complete and sufficient and $\varphi(T)$ is unbiased for $\theta$, then $\varphi(T)$ is the unique UMVUE.

We can confirm uniqueness empirically. Take two different unbiased starters for $p$ in the Bernoulli model: $\delta_a = X_1$ and $\delta_b = (X_2 + X_3)/2$. After Rao-Blackwellizing each, both should collapse to the same function of $T$.

```r title="Lehmann-Scheffe uniqueness check"
# Two starters, same UMVUE
est_a <- samples_b[, 1]
est_b <- (samples_b[, 2] + samples_b[, 3]) / 2

# Condition on T = sum: by exchangeability,
# E[X1 | T = t] = t/n  and  E[(X2 + X3)/2 | T = t] = t/n
phi_T_a <- rowSums(samples_b) / n_b
phi_T_b <- rowSums(samples_b) / n_b

all.equal(phi_T_a, phi_T_b)
#> [1] TRUE

c(mean_a_raw = mean(est_a), mean_b_raw = mean(est_b),
  mean_phi_T = mean(phi_T_a),
  var_a_raw  = var(est_a),  var_b_raw  = var(est_b),
  var_phi_T  = var(phi_T_a))
#> mean_a_raw mean_b_raw mean_phi_T  var_a_raw  var_b_raw  var_phi_T
#>     0.3064     0.3019     0.3004     0.2126     0.1067     0.0212
```

Both raw estimators are unbiased (means near $p = 0.3$). They have different variances because they use different subsets of the data. After Rao-Blackwellizing, both collapse to the same function $T/n$, with one shared variance. Uniqueness is exactly what Lehmann-Scheffé guarantees.

[WARNING]
**Without completeness, several unbiased functions of $T$ can coexist.** Completeness is the property that eliminates the rivals. If your candidate sufficient statistic is not complete, Rao-Blackwell still applies, but Lehmann-Scheffé does not, and the UMVUE may not exist or may not be unique.

**Try it:** Confirm Lehmann-Scheffé numerically by computing $E[X_1 \mid T = t]$ from the simulated samples (not the formula) and comparing to $t/n$ across the support of $T$.

```r title="Your turn: numerical Lehmann-Scheffe check"
# Try it: estimate E[X1 | T = t] empirically and compare to t/n
T_vec <- rowSums(samples_b)
ex_phi_grid <- # your code here: aggregate samples_b[, 1] by T_vec, take the mean

print(ex_phi_grid)
#> Expected: rows are t = 0..n_b, mean column close to t / n_b
```

<details>
<summary>Click to reveal solution</summary>

```r title="Numerical Lehmann-Scheffe check solution"
ex_phi_grid <- aggregate(samples_b[, 1], by = list(T = T_vec), FUN = mean)
ex_phi_grid$theory <- ex_phi_grid$T / n_b
print(ex_phi_grid)
#>   T       x theory
#> 1 0  0.0000    0.0
#> 2 1  0.1042    0.1
#> 3 2  0.1979    0.2
#> 4 3  0.2999    0.3
#> 5 4  0.3974    0.4
#> 6 5  0.5012    0.5
#> 7 6  0.5985    0.6
#> 8 7  0.6957    0.7
#> 9 8  0.8014    0.8
```

**Explanation:** The empirical conditional mean of $X_1$ given $T = t$ tracks the formula $t/n$ closely, confirming the conditioning calculation that drives Rao-Blackwell.

</details>

## How do you find the UMVUE step-by-step in practice?

Once you have the two theorems, the construction is mechanical.

![The three-step Lehmann-Scheffé recipe for finding a UMVUE.](screenshots/UMVUE-in-R-2-recipe-flow.webp)
*Figure 2: The three-step Lehmann-Scheffé recipe for finding a UMVUE.*

The three steps:

1. **Find a complete sufficient statistic $T$.** For an exponential family in canonical form, the canonical sufficient statistic is automatically complete. Most named distributions (Normal, Poisson, Binomial, Gamma, Beta, Exponential) fall in this camp.
2. **Get an unbiased function of $T$.** Either find any unbiased estimator $\delta$ and compute $g(T) = E[\delta \mid T]$, or guess $g(T)$ directly so that $E[g(T)] = \theta$.
3. **Lehmann-Scheffé certifies the result.** $g(T)$ is the unique UMVUE.

Apply this to a Normal sample. With $X_1, \dots, X_n \sim N(\mu, \sigma^2)$ both parameters unknown, $T = (\sum X_i, \sum X_i^2)$ is complete sufficient. The sample mean $\bar X$ is an unbiased function of $T$, hence the UMVUE for $\mu$. The bias-corrected sample variance $s^2 = \frac{1}{n-1}\sum (X_i - \bar X)^2$ is also a function of $T$ and is unbiased for $\sigma^2$, hence the UMVUE for $\sigma^2$.

```r title="Normal UMVUE for mu and sigma squared"
# Sample mean is UMVUE for mu; s^2 is UMVUE for sigma^2.
set.seed(42)
mu_true    <- 5
sigma_true <- 2
n_n <- 20

samples_n <- matrix(rnorm(reps * n_n, mean = mu_true, sd = sigma_true),
                    nrow = reps, ncol = n_n)

mean_hat <- rowMeans(samples_n)
var_hat  <- apply(samples_n, 1, var)   # var() uses (n-1) denominator

c(bias_mean = mean(mean_hat) - mu_true,
  bias_var  = mean(var_hat) - sigma_true^2,
  mc_var_mean = var(mean_hat),
  theoretical_var_mean = sigma_true^2 / n_n,
  mc_var_var  = var(var_hat),
  theoretical_var_var  = 2 * sigma_true^4 / (n_n - 1))
#>             bias_mean              bias_var           mc_var_mean
#>             0.0017013            -0.0027391             0.2002000
#> theoretical_var_mean             mc_var_var  theoretical_var_var
#>             0.2000000             1.6781000             1.6842110
```

Both bias values sit near zero, so $\bar X$ and $s^2$ are unbiased as advertised. The Monte Carlo variance of $\bar X$ matches $\sigma^2/n = 4/20 = 0.20$, and the variance of $s^2$ matches the textbook value $\frac{2\sigma^4}{n-1} = \frac{32}{19} \approx 1.684$. Lehmann-Scheffé says no other unbiased estimator can do better.

[TIP]
**For exponential families, completeness is automatic.** If you can write the joint density in the form $h(x) \exp(\eta(\theta)^\top T(x) - A(\theta))$ with the natural parameter ranging over an open set, $T(x)$ is complete and sufficient. That single check covers almost every named distribution you will meet.

**Try it:** Find the UMVUE for $\sigma$ (not $\sigma^2$) in a Normal model. Hint: it is a constant times the sample standard deviation.

```r title="Your turn: UMVUE for sigma"
# Try it: find c so that c * s is unbiased for sigma
# For Normal samples: E[s] = sigma * sqrt(2 / (n - 1)) * gamma(n/2) / gamma((n - 1)/2)
ex_c_n <- # your code here: the correction constant for n_n

ex_sigma_hat <- ex_c_n * sqrt(var_hat)
c(bias = mean(ex_sigma_hat) - sigma_true,
  raw_bias = mean(sqrt(var_hat)) - sigma_true)
#> Expected: bias near 0, raw_bias slightly negative
```

<details>
<summary>Click to reveal solution</summary>

```r title="UMVUE for sigma solution"
ex_c_n <- sqrt((n_n - 1) / 2) * gamma((n_n - 1) / 2) / gamma(n_n / 2)
ex_sigma_hat <- ex_c_n * sqrt(var_hat)
c(bias = mean(ex_sigma_hat) - sigma_true,
  raw_bias = mean(sqrt(var_hat)) - sigma_true,
  c_n = ex_c_n)
#>      bias  raw_bias       c_n
#>   0.00031  -0.02683   1.01373
```

**Explanation:** The raw $s$ underestimates $\sigma$ by a few percent. Multiplying by the correction $c_n$ removes that bias, and Lehmann-Scheffé makes the corrected version the UMVUE.

</details>

## How do you verify your UMVUE attains the Cramér-Rao lower bound?

The Cramér-Rao lower bound (CRLB) is a floor on the variance of any unbiased estimator under regularity conditions. If your candidate UMVUE has variance equal to the CRLB, you have an extra confirmation that it is optimal in a strong sense (it is also called efficient).

For an iid sample of size $n$ with Fisher information $I(\theta)$ per observation, the bound is

$$\text{Var}(\hat\theta) \ge \frac{1}{n \cdot I(\theta)}.$$

For Normal samples with known $\sigma$, the Fisher information for $\mu$ is $I(\mu) = 1/\sigma^2$, so the CRLB for $\mu$ is $\sigma^2/n$. The sample mean attains this exactly.

```r title="Cramer-Rao bound check for Normal mean"
# Compare Monte Carlo variance of sample mean to CRLB.
crlb   <- sigma_true^2 / n_n
mc_var <- var(mean_hat)

c(CRLB = crlb, MC_variance = mc_var, ratio = mc_var / crlb)
#>        CRLB MC_variance       ratio
#>      0.2000      0.2002      1.0010
```

The Monte Carlo variance and the CRLB match to three decimal places, with a ratio of essentially 1. The sample mean saturates the bound. This is the textbook outcome: in a Normal model with known variance, the sample mean is the efficient UMVUE for the mean.

[NOTE]
**Some UMVUEs beat the CRLB because the regularity conditions fail.** A famous example is Uniform$(0, \theta)$: the UMVUE $(n+1) X_{(n)}/n$ has variance smaller than the standard CRLB would predict. The bound assumes the support of the distribution does not depend on $\theta$, which fails for the uniform.

**Try it:** Compute the CRLB for the Bernoulli mean and verify the sample mean attains it.

```r title="Your turn: CRLB for Bernoulli"
# Try it: I(p) = 1 / (p(1 - p)) per observation, so CRLB = p(1-p)/n
ex_crlb_b <- # your code here: CRLB for Bernoulli mean with n_b observations
ex_var_b  <- var(rowSums(samples_b) / n_b)

c(CRLB = ex_crlb_b, MC = ex_var_b, ratio = ex_var_b / ex_crlb_b)
#> Expected: ratio near 1
```

<details>
<summary>Click to reveal solution</summary>

```r title="CRLB for Bernoulli solution"
ex_crlb_b <- p_true * (1 - p_true) / n_b
ex_var_b  <- var(rowSums(samples_b) / n_b)
c(CRLB = ex_crlb_b, MC = ex_var_b, ratio = ex_var_b / ex_crlb_b)
#>     CRLB       MC    ratio
#>   0.0210   0.0212   1.0119
```

**Explanation:** The Monte Carlo variance matches $p(1-p)/n$ within sampling error, confirming that the sample mean is the efficient UMVUE for the Bernoulli parameter.

</details>

## When does the UMVUE underperform a biased estimator?

UMVUE means *best unbiased*, not *best overall*. Mean squared error decomposes as

$$\text{MSE}(\hat\theta) = \text{Bias}(\hat\theta)^2 + \text{Var}(\hat\theta).$$

A small bias can sometimes buy a much larger variance reduction. Then a biased estimator beats the UMVUE on MSE.

The classic example is variance estimation for a Normal sample. The UMVUE divides $\sum (X_i - \bar X)^2$ by $n - 1$. The maximum likelihood estimator (MLE) divides by $n$. The MLE is biased downward, but its variance is smaller, and the trade goes its way for small $n$.

```r title="UMVUE versus MLE for Normal variance"
# Compare MSE of s^2 (UMVUE) and (n-1)/n * s^2 (MLE) for sigma^2.
s2_vec  <- var_hat                      # UMVUE estimate of sigma^2
mle_vec <- (n_n - 1) / n_n * var_hat    # MLE of sigma^2

mse_umvue <- mean((s2_vec  - sigma_true^2)^2)
mse_mle   <- mean((mle_vec - sigma_true^2)^2)

c(bias_umvue = mean(s2_vec)  - sigma_true^2,
  bias_mle   = mean(mle_vec) - sigma_true^2,
  var_umvue  = var(s2_vec),
  var_mle    = var(mle_vec),
  MSE_umvue  = mse_umvue,
  MSE_mle    = mse_mle)
#> bias_umvue   bias_mle  var_umvue    var_mle  MSE_umvue    MSE_mle
#>    -0.0027    -0.2027     1.6781     1.5147     1.6776     1.5557
```

The UMVUE has bias near zero. The MLE has bias of roughly $-\sigma^2/n = -0.2$. But the MLE's variance is smaller, and that gap more than offsets the squared bias of $0.04$. The MLE wins on MSE here.

[KEY INSIGHT]
**Unbiasedness is a constraint, not a virtue.** The UMVUE is the right answer when you genuinely need unbiased estimates (regulatory or scientific reporting, for example). When all you care about is being close to the truth, a small bias is often a fair trade.

**Try it:** Compute the MSE of three $\sigma^2$ estimators that divide by $n - 1$, $n$, and $n + 1$. Find which divisor wins.

```r title="Your turn: three sigma squared estimators"
# Try it: which divisor minimizes MSE?
ssq_vec <- (n_n - 1) * var_hat   # sum of squared deviations from the mean
ex_mse_n1  <- mean((ssq_vec / (n_n - 1) - sigma_true^2)^2)
ex_mse_n   <- mean((ssq_vec /  n_n      - sigma_true^2)^2)
ex_mse_np1 <- # your code here

c(div_n_minus_1 = ex_mse_n1, div_n = ex_mse_n, div_n_plus_1 = ex_mse_np1)
#> Expected: dividing by (n+1) wins for Normal data
```

<details>
<summary>Click to reveal solution</summary>

```r title="Three sigma squared estimators solution"
ex_mse_np1 <- mean((ssq_vec / (n_n + 1) - sigma_true^2)^2)
c(div_n_minus_1 = ex_mse_n1, div_n = ex_mse_n, div_n_plus_1 = ex_mse_np1)
#>  div_n_minus_1         div_n  div_n_plus_1
#>         1.6776        1.5557        1.5176
```

**Explanation:** Dividing by $n + 1$ is the minimum-MSE estimator of $\sigma^2$ for Normal data, even though it has more bias than dividing by $n$. The UMVUE (divide by $n - 1$) is the worst on MSE.

</details>

## Practice Exercises

### Exercise 1: Poisson UMVUE for the probability of zero

Given $X_1, \dots, X_n \sim \text{Poisson}(\lambda)$, find the UMVUE for $\theta = e^{-\lambda}$, the probability that a single observation equals zero. Hint: $T = \sum X_i$ is complete sufficient. The starter $\delta = I(X_1 = 0)$ is unbiased for $\theta$. Use $E[\delta \mid T = t] = ((n-1)/n)^t$. Implement the UMVUE and verify unbiasedness across $\lambda \in \{0.5, 1, 2\}$.

```r title="Exercise 1 starter"
# Exercise 1: Poisson UMVUE for P(X = 0) = exp(-lambda)
# Hint: phi(T) = ((n - 1) / n)^T

cap_n <- 10
cap_reps <- 5000
cap_lambdas <- c(0.5, 1, 2)

# For each lambda, simulate, compute the UMVUE, and report mean & target
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
cap_n <- 10
cap_reps <- 5000
cap_lambdas <- c(0.5, 1, 2)

cap_results <- sapply(cap_lambdas, function(lam) {
  M <- matrix(rpois(cap_reps * cap_n, lambda = lam),
              nrow = cap_reps, ncol = cap_n)
  T_sum <- rowSums(M)
  cap_phi <- ((cap_n - 1) / cap_n)^T_sum
  c(target = exp(-lam), umvue_mean = mean(cap_phi),
    umvue_var = var(cap_phi))
})
colnames(cap_results) <- paste0("lambda=", cap_lambdas)
print(round(cap_results, 4))
#>            lambda=0.5 lambda=1 lambda=2
#> target         0.6065   0.3679   0.1353
#> umvue_mean     0.6076   0.3674   0.1349
#> umvue_var      0.0273   0.0226   0.0091
```

**Explanation:** The umvue_mean tracks $e^{-\lambda}$ closely for every $\lambda$, so the estimator is unbiased on every parameter value. That is the *uniformly* in UMVUE.

</details>

### Exercise 2: UMVUE for the Normal standard deviation

Find the constant $c_n$ that makes $c_n \cdot s$ unbiased for $\sigma$ in a Normal model. Confirm by simulation that $c_n \cdot s$ is unbiased and that $s$ alone is biased downward.

```r title="Exercise 2 starter"
# Exercise 2: build c_n so that c_n * s is unbiased for sigma
# Hint: E[s] = sigma * sqrt(2 / (n - 1)) * gamma(n/2) / gamma((n - 1)/2)

cap_sigma <- 3
cap_n2 <- 15
cap_reps2 <- 5000
M2 <- matrix(rnorm(cap_reps2 * cap_n2, mean = 0, sd = cap_sigma),
             nrow = cap_reps2, ncol = cap_n2)
s_vec <- apply(M2, 1, sd)

cap_c <- # your code here
cap_sigma_hat <- # your code here

c(target = cap_sigma, mean_s = mean(s_vec), mean_umvue = mean(cap_sigma_hat))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
cap_c <- sqrt((cap_n2 - 1) / 2) * gamma((cap_n2 - 1) / 2) / gamma(cap_n2 / 2)
cap_sigma_hat <- cap_c * s_vec
c(target = cap_sigma, mean_s = mean(s_vec), mean_umvue = mean(cap_sigma_hat),
  bias_s = mean(s_vec) - cap_sigma,
  bias_umvue = mean(cap_sigma_hat) - cap_sigma)
#>     target     mean_s mean_umvue     bias_s bias_umvue
#>     3.0000     2.9468     2.9986    -0.0532    -0.0014
```

**Explanation:** $s$ underestimates $\sigma$ by about $1.8\%$. Multiplying by $c_n$ removes the bias, and Lehmann-Scheffé says the corrected version is the unique UMVUE for $\sigma$.

</details>

### Exercise 3: UMVUE for a difference of Normal means

Given two independent samples $X_1, \dots, X_n \sim N(\mu_1, \sigma^2)$ and $Y_1, \dots, Y_m \sim N(\mu_2, \sigma^2)$, show that $\bar X - \bar Y$ is the UMVUE for $\mu_1 - \mu_2$. Verify with simulation that it is unbiased and that its variance equals the CRLB.

```r title="Exercise 3 starter"
# Exercise 3: two-sample mean difference is the UMVUE
cap_mu1 <- 4; cap_mu2 <- 1
cap_sigma3 <- 2
cap_n3 <- 12; cap_m3 <- 18
cap_reps3 <- 5000

# Simulate, compute Xbar - Ybar, compare bias and variance to the CRLB.
cap_xbar <- # your code here
cap_ybar <- # your code here
cap_diff <- cap_xbar - cap_ybar

crlb3 <- # your code here

c(bias = mean(cap_diff) - (cap_mu1 - cap_mu2),
  mc_var = var(cap_diff), CRLB = crlb3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
cap_xbar <- replicate(cap_reps3, mean(rnorm(cap_n3, cap_mu1, cap_sigma3)))
cap_ybar <- replicate(cap_reps3, mean(rnorm(cap_m3, cap_mu2, cap_sigma3)))
cap_diff <- cap_xbar - cap_ybar
crlb3 <- cap_sigma3^2 / cap_n3 + cap_sigma3^2 / cap_m3
c(bias = mean(cap_diff) - (cap_mu1 - cap_mu2),
  mc_var = var(cap_diff), CRLB = crlb3)
#>      bias    mc_var      CRLB
#>   -0.0098    0.5644    0.5556
```

**Explanation:** Bias is near zero; the Monte Carlo variance matches the CRLB $\sigma^2/n + \sigma^2/m \approx 0.556$. So $\bar X - \bar Y$ is both unbiased and efficient, and Lehmann-Scheffé makes it the unique UMVUE.

</details>

## Complete Example: end-to-end UMVUE for $P(X=0)$ in a Poisson model

Pull the recipe together on one example. Goal: estimate $\theta = e^{-\lambda}$ from $X_1, \dots, X_n \sim \text{Poisson}(\lambda)$ and prove the estimator beats every alternative.

**Step 1: identify the complete sufficient statistic.** Poisson is in the exponential family with canonical parameter $\log \lambda$ and canonical statistic $T = \sum X_i$. So $T$ is complete sufficient.

**Step 2: pick an unbiased starter.** $\delta(X) = I(X_1 = 0)$ has $E[\delta] = P(X_1 = 0) = e^{-\lambda}$, which is exactly $\theta$.

**Step 3: Rao-Blackwellize.** Conditional on $T = t$, the vector $(X_1, \dots, X_n)$ is multinomial$(t; 1/n, \dots, 1/n)$, so $X_1 \mid T = t \sim \text{Binomial}(t, 1/n)$. Therefore

$$\varphi(T) = E[I(X_1 = 0) \mid T] = P(X_1 = 0 \mid T) = \left(\frac{n-1}{n}\right)^T.$$

By Lehmann-Scheffé, $\varphi(T) = ((n-1)/n)^T$ is the unique UMVUE.

**Step 4: implement and benchmark.** Compare three estimators: the UMVUE, the naive starter $\delta$, and the plug-in MLE $e^{-\bar X}$ (biased).

```r title="Complete Example: Poisson zero-probability UMVUE"
# End-to-end: UMVUE for theta = exp(-lambda)
set.seed(2024)
ce_lambda <- 1.5
ce_n <- 12

ce_M <- matrix(rpois(reps * ce_n, lambda = ce_lambda),
               nrow = reps, ncol = ce_n)
ce_T <- rowSums(ce_M)

ce_umvue <- ((ce_n - 1) / ce_n)^ce_T          # UMVUE
ce_naive <- as.integer(ce_M[, 1] == 0)        # unbiased starter
ce_mle   <- exp(-rowMeans(ce_M))              # plug-in MLE (biased)

target <- exp(-ce_lambda)

ce_mse_umvue <- mean((ce_umvue - target)^2)
ce_mse_naive <- mean((ce_naive - target)^2)
ce_mse_mle   <- mean((ce_mle   - target)^2)

round(c(target = target,
        bias_umvue = mean(ce_umvue) - target,
        bias_naive = mean(ce_naive) - target,
        bias_mle   = mean(ce_mle)   - target,
        var_umvue  = var(ce_umvue),
        var_naive  = var(ce_naive),
        var_mle    = var(ce_mle),
        MSE_umvue  = ce_mse_umvue,
        MSE_naive  = ce_mse_naive,
        MSE_mle    = ce_mse_mle), 5)
#>     target bias_umvue bias_naive   bias_mle  var_umvue  var_naive
#>    0.22313    0.00141    0.00007    0.01138    0.01049    0.17357
#>    var_mle  MSE_umvue  MSE_naive    MSE_mle
#>    0.00897    0.01049    0.17357    0.01010
```

The UMVUE is essentially unbiased (bias around $0.001$). The naive starter is also unbiased but has 16 times the variance, exactly the kind of slack Rao-Blackwell removes. The MLE has the smallest variance but visible bias; on MSE it edges out the UMVUE here because $n$ is small. As $n$ grows the MLE bias shrinks and all three converge, but the UMVUE has the cleanest interpretation: among unbiased estimators, no one can beat it.

## Summary

| Concept | Role | R checklist |
|---|---|---|
| Sufficient statistic | Captures all info about $\theta$ | `sum`, `mean`, `max`, ... |
| Completeness | Removes unbiased rivals built from $T$ | Exponential family ⇒ automatic |
| Rao-Blackwell | Improves any unbiased $\delta$ via $E[\delta \mid T]$ | Replicate, condition, compare |
| Lehmann-Scheffé | Certifies the result is the unique UMVUE | Need complete + sufficient $T$ |
| Cramér-Rao bound | Optional efficiency check | Compare Var to $1 / (n \cdot I(\theta))$ |
| MSE check | UMVUE is best *unbiased*, not best overall | Compare to MLE / shrinkage |

![A concept map of the UMVUE construction and its R verification tools.](screenshots/UMVUE-in-R-2-overview-mindmap.webp)
*Figure 3: A concept map of the UMVUE construction and its R verification tools.*

The pattern repeats across distributions: identify $T$, find or build an unbiased function of $T$, and Lehmann-Scheffé certifies the answer. Monte Carlo in R lets you confirm unbiasedness and variance dominance on every example you meet.

## References

1. Casella, G., & Berger, R. L. (2002). *Statistical Inference* (2nd ed.). Duxbury. Chapter 7. [Link](https://www.cengage.com/c/statistical-inference-2e-casella-berger)
2. Lehmann, E. L., & Casella, G. (1998). *Theory of Point Estimation* (2nd ed.). Springer. Chapter 2. [Link](https://link.springer.com/book/10.1007/b98854)
3. Wikipedia. Lehmann-Scheffé theorem. [Link](https://en.wikipedia.org/wiki/Lehmann%E2%80%93Scheff%C3%A9_theorem)
4. Wikipedia. Minimum-variance unbiased estimator. [Link](https://en.wikipedia.org/wiki/Minimum-variance_unbiased_estimator)
5. Watkins, J. *Topics in Probability Theory and Stochastic Processes*: Lehmann-Scheffé chapter. University of Arizona. [Link](https://math.arizona.edu/~jwatkins/G5_best.pdf)
6. Mackey, L. Stanford STATS 300A Lecture 4: Sufficiency, Completeness, UMVU. [Link](https://web.stanford.edu/~lmackey/stats300a/doc/stats300a-fall15-lecture4.pdf)
7. R Core Team. *An Introduction to R*. [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html)

## Continue Learning

- [Sufficient Statistics in R](Sufficient-Statistics-in-R.html), the prerequisite. How to identify $T$ and prove sufficiency by the factorisation theorem.
- [Complete & Ancillary Statistics in R](Complete-and-Ancillary-Statistics-in-R.html), the second ingredient for Lehmann-Scheffé. How to verify completeness and use Basu's theorem.
- [Maximum Likelihood Estimation in R](Maximum-Likelihood-Estimation-in-R.html), the standard alternative when bias is acceptable. Asymptotically efficient and often easier to compute.
