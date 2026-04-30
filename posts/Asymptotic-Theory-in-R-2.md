---
title: "Asymptotic Theory in R: Consistency, Asymptotic Normality & Delta Method"
slug: "Asymptotic-Theory-in-R-2"
description: "Learn asymptotic theory in R with simulations: consistency via LLN, asymptotic normality via CLT, and the delta method for transformed estimators in practice."
keywords: "asymptotic theory in R, consistency of estimators, asymptotic normality, delta method, law of large numbers in R, central limit theorem in R, MLE asymptotic distribution, Slutsky theorem"
auto_link_terms: "asymptotic theory|delta method|asymptotic normality|consistency of estimators|Slutsky's theorem|asymptotic distribution|asymptotic variance"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-30"
curriculum_id: "2.6.6"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Asymptotic Theory"
sidebar_order: 110
difficulty: "Advanced"
---

# Asymptotic Theory in R: Consistency, Asymptotic Normality & Delta Method

<p class="lead">Asymptotic theory tells you what your R estimators do when the sample is large: which ones lock onto the truth (consistency), how their sampling distribution becomes Normal (asymptotic normality), and how to get standard errors for transformed quantities like odds ratios or coefficient ratios (the delta method).</p>

## Why does asymptotic theory matter when you have R?

Real samples are finite, but every confidence interval, p-value, and standard error printed by `summary(lm(...))` rests on what would happen if `n` kept growing. Asymptotic theory is the bridge from that finite reality to the large-sample behaviour R quietly assumes. The fastest way to see why it matters is to watch a sample mean settle as `n` climbs, in code.

Below, we draw `n` observations from an exponential distribution with rate 2 (true mean = 0.5) at four sample sizes. The estimator is `mean(x)`. Watch the rightmost column tighten around 0.5.

```r title="Sample mean converges as n grows"
set.seed(2026)
n_grid <- c(10, 100, 1000, 10000)

mean_estimates <- sapply(n_grid, function(n) {
  x <- rexp(n, rate = 2)        # true mean = 1/2
  mean(x)
})

data.frame(
  n          = n_grid,
  estimate   = round(mean_estimates, 4),
  abs_error  = round(abs(mean_estimates - 0.5), 4)
)
#>       n estimate abs_error
#> 1    10   0.5391    0.0391
#> 2   100   0.4878    0.0122
#> 3  1000   0.4978    0.0022
#> 4 10000   0.4998    0.0002
```

The estimate at `n=10` is off by about 8%, but at `n=10000` it nails the true mean to four decimals. The error shrinks roughly like `1/sqrt(n)`, going from ~0.04 to ~0.0002 as the sample multiplies by 1000. That single pattern, in three different dresses, is what the rest of this post is about.

[NOTE]
**Everything below uses base R only.** The post leans on `glm()`, `vcov()`, `qqnorm()`, `plot()`, and `density()`, all of which ship with R. No external packages are needed to follow along.

**Try it:** Estimate `mean(rnorm(n))` (true mean = 0) for `n = 50` and `n = 5000` with `set.seed(1)`. Confirm the second is closer to 0 than the first.

```r title="Your turn: sample mean of N(0,1)"
# Try it: estimate mean(rnorm(n))
set.seed(1)
ex_small <- # your code here for n=50
ex_large <- # your code here for n=5000

c(small = ex_small, large = ex_large)
#> Expected: large is closer to 0 than small
```

<details>
<summary>Click to reveal solution</summary>

```r title="Sample mean of N(0,1) at two sizes"
set.seed(1)
ex_small <- mean(rnorm(50))
ex_large <- mean(rnorm(5000))
c(small = ex_small, large = ex_large)
#>      small      large
#> 0.10889 0.012458
```

**Explanation:** Both estimates target zero, but the standard error of the mean is `1/sqrt(n)`, so `n=5000` is about 10 times tighter than `n=50`.

</details>

## How does an estimator become consistent? (Law of Large Numbers in R)

An estimator is **consistent** when, as you collect more data, its value gets arbitrarily close to the true parameter with probability one. The **Weak Law of Large Numbers** (LLN) is the engine: the sample mean of an iid sequence with finite mean $\mu$ converges in probability to $\mu$.

Formally, $\bar{X}_n \xrightarrow{p} \mu$, which reads "for any tiny tolerance $\varepsilon > 0$, the probability that $|\bar{X}_n - \mu|$ exceeds $\varepsilon$ vanishes as $n \to \infty$." The variance of $\bar{X}_n$ is $\sigma^2/n$, so the distribution literally collapses onto $\mu$ as $n$ grows.

The cleanest way to see this is to watch one running mean walk through 5000 draws. Each new observation nudges the average, and the path drifts toward the truth and stays there.

```r title="Running mean walks toward the truth"
set.seed(7)
x_path  <- rexp(5000, rate = 2)   # true mean = 0.5
running <- cumsum(x_path) / seq_along(x_path)

plot(running, type = "l", lwd = 1.4,
     xlab = "n", ylab = "Running sample mean",
     main = "One path of the running mean (Exp(0.5))")
abline(h = 0.5, col = "red", lwd = 2, lty = 2)
#> A line that wiggles wildly for small n then hugs y = 0.5.
```

The walk is jittery at the start, where every new draw moves the cumulative average a lot, then steadies as `n` grows and each new observation only pushes it by `1/n`. The red dashed line at 0.5 marks the truth, and the running mean converges to it.

A single path can be lucky. To see the *probability mass collapse*, run many paths in parallel.

```r title="Many paths collapse onto the truth"
set.seed(11)
n_steps <- 2000
n_paths <- 50

paths <- replicate(n_paths, rexp(n_steps, rate = 2))
cumulative_means <- apply(paths, 2, function(v) cumsum(v) / seq_along(v))

matplot(cumulative_means, type = "l", lty = 1, col = "grey60",
        xlab = "n", ylab = "Running sample mean",
        main = "50 running-mean paths (Exp(0.5))")
abline(h = 0.5, col = "red", lwd = 2, lty = 2)
#> A grey fan that narrows from left to right around y = 0.5.
```

At small `n`, the paths fan out widely. By `n = 2000`, all 50 are squeezed into a thin band around 0.5. That visual narrowing *is* convergence in probability: the distribution of $\bar{X}_n$ is concentrating on the true value.

![Two modes of convergence](screenshots/Asymptotic-Theory-in-R-2-convergence-modes.webp)
*Figure 1: Two ways estimators behave as the sample grows: consistency (probability mass collapses to the truth) and asymptotic normality (the standardized shape becomes Normal).*

[KEY INSIGHT]
**Consistency tells you the estimator points at the right answer in the limit, nothing more.** It says nothing about how fast the convergence happens, what the sampling distribution looks like, or how to build a confidence interval. For those questions you need the next pillar.

**Try it:** Plot the running mean of `runif(5000)` (true mean = 0.5) and confirm it converges to 0.5.

```r title="Your turn: running mean of Uniform(0,1)"
# Try it: running mean of uniform
set.seed(3)
ex_u <- runif(5000)
ex_running <- # your code here
plot(ex_running, type = "l")
abline(h = 0.5, col = "red")
#> Expected: line settles around 0.5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Running mean of Uniform(0,1) solution"
set.seed(3)
ex_u <- runif(5000)
ex_running <- cumsum(ex_u) / seq_along(ex_u)
plot(ex_running, type = "l", xlab = "n", ylab = "Running mean")
abline(h = 0.5, col = "red")
#> A line that converges to 0.5.
```

**Explanation:** Same recipe. `cumsum(x)/seq_along(x)` is the running average; the LLN guarantees convergence to the true mean of the distribution generating the data.

</details>

## What does asymptotic normality mean? (Central Limit Theorem in R)

Consistency says $\bar{X}_n$ heads to $\mu$. The **Central Limit Theorem** (CLT) describes the *shape of the wobble around* $\mu$. For iid data with finite variance $\sigma^2$,

$$\sqrt{n}\,\bigl(\bar{X}_n - \mu\bigr) \xrightarrow{d} \mathcal{N}\!\bigl(0,\; \sigma^2\bigr).$$

In words: rescale the deviation by $\sqrt{n}$ and the distribution flattens into a Normal, no matter what the original distribution looked like (as long as it has a finite variance). The convergence is *in distribution*, written $\xrightarrow{d}$, meaning the cumulative distribution function approaches the Normal CDF pointwise.

Let's watch the shape morph. We draw 5000 sample means at three sample sizes from the heavily right-skewed `Exp(0.5)`, then overlay the densities.

```r title="CLT: shape becomes Normal as n grows"
set.seed(19)
clt_n_values <- c(2, 10, 200)
n_reps       <- 5000
true_mean    <- 0.5
true_sd      <- 0.5   # for Exp(rate=2): mean = sd = 1/2

means_by_n <- sapply(clt_n_values, function(n) {
  replicate(n_reps, mean(rexp(n, rate = 2)))
})

# Standardize each set of means: sqrt(n) * (xbar - mu) / sigma
standardized <- sweep(means_by_n, 2, true_mean) *
                  matrix(sqrt(clt_n_values), nrow = n_reps,
                         ncol = length(clt_n_values), byrow = TRUE) /
                  true_sd

# Plot density at each n
plot(density(standardized[,3]), col = "darkgreen", lwd = 2,
     xlim = c(-4, 4), ylim = c(0, 0.5),
     main = "Standardized sample means at n = 2, 10, 200",
     xlab = "sqrt(n) * (xbar - mu) / sigma")
lines(density(standardized[,2]), col = "orange",   lwd = 2)
lines(density(standardized[,1]), col = "red",      lwd = 2)
curve(dnorm(x), add = TRUE, col = "black", lty = 2, lwd = 2)
legend("topright",
       legend = c("n=2", "n=10", "n=200", "N(0,1)"),
       col = c("red", "orange", "darkgreen", "black"),
       lwd = 2, lty = c(1, 1, 1, 2), bty = "n")
#> A right-skewed red curve at n=2, mostly symmetric orange at n=10, and
#> a green curve that overlays the dashed black N(0,1) at n=200.
```

At `n=2`, the density still leans right (the exponential's skew survives). By `n=10`, it is nearly symmetric. At `n=200`, the green curve is indistinguishable from the dashed standard Normal. That visual collapse is asymptotic normality at work.

A second sanity check: if the standardized means really come from $\mathcal{N}(0,1)$, a Normal QQ plot should land on the diagonal.

```r title="QQ plot confirms normality at n = 200"
means_n200 <- standardized[, 3]
qqnorm(means_n200, main = "QQ plot: standardized means at n = 200")
qqline(means_n200, col = "red", lwd = 2)
#> Points hug the red diagonal, with mild deviation only in the tails.
```

The QQ plot is one of the cleanest diagnostics for the CLT. Points on the line means quantile-by-quantile agreement with the Normal. Heavy-tailed deviation (S-curves at the ends) signals that `n` is not yet large enough or that the underlying distribution lacks finite variance.

[TIP]
**Always standardize before checking the CLT.** Dividing by `sigma/sqrt(n)` puts every sample size on the same scale (mean 0, variance 1), so you can plot densities or QQ-plots from different `n` together. The raw `mean(x)` distribution shrinks like `1/sqrt(n)`, which would crush them all into a spike.

**Try it:** Generate 3000 sample proportions of `rbinom(50, 1, 0.3)` (so each `mean` is over 50 Bernoulli draws). Standardize and overlay the density on `dnorm`.

```r title="Your turn: CLT for a Bernoulli mean"
# Try it: CLT for sample proportion
set.seed(2)
ex_p <- 0.3
ex_n <- 50
ex_phats <- replicate(3000, mean(rbinom(ex_n, size = 1, prob = ex_p)))
ex_z <- # your code here: standardize ex_phats
plot(density(ex_z), col = "blue", lwd = 2)
curve(dnorm(x), add = TRUE, lty = 2)
#> Expected: blue curve closely matches dashed N(0,1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="CLT for a Bernoulli mean solution"
set.seed(2)
ex_p <- 0.3
ex_n <- 50
ex_phats <- replicate(3000, mean(rbinom(ex_n, size = 1, prob = ex_p)))
ex_z <- sqrt(ex_n) * (ex_phats - ex_p) / sqrt(ex_p * (1 - ex_p))
plot(density(ex_z), col = "blue", lwd = 2,
     main = "Standardized sample proportions, n = 50")
curve(dnorm(x), add = TRUE, lty = 2)
#> Two curves nearly overlap.
```

**Explanation:** A Bernoulli has variance `p(1-p)`. Standardize the sample proportion by `sqrt(n)/sqrt(p(1-p))` and you recover N(0,1) for moderate `n`. This is exactly why proportion-based confidence intervals use a Normal critical value.

</details>

## How do we use MLE asymptotic theory in R?

Maximum likelihood estimators (MLEs) inherit both pillars under standard regularity conditions: they are consistent and asymptotically normal. Specifically, for a true parameter $\theta_0$,

$$\sqrt{n}\,(\hat{\theta}_n - \theta_0) \xrightarrow{d} \mathcal{N}\!\bigl(0,\; I(\theta_0)^{-1}\bigr),$$

where $I(\theta_0)$ is the Fisher information per observation. The practical takeaway: an MLE's standard error, in the limit, is $\sqrt{1/(n \cdot I(\theta_0))}$. That single line is what underpins the standard errors `summary(glm(...))` prints.

Take the exponential rate parameter as a worked example. If $X_1, \ldots, X_n \sim \text{Exp}(\lambda)$, the MLE is $\hat{\lambda} = 1/\bar{X}$ and the Fisher information per observation is $1/\lambda^2$. So $\hat{\lambda}$ has asymptotic variance $\lambda^2 / n$, and a 95% Wald CI is $\hat{\lambda} \pm 1.96 \cdot \hat{\lambda}/\sqrt{n}$.

```r title="MLE for exponential rate with asymptotic CI"
set.seed(42)
x_sample   <- rexp(500, rate = 2)
lambda_hat <- 1 / mean(x_sample)
se_lambda  <- lambda_hat / sqrt(length(x_sample))
ci_lambda  <- lambda_hat + c(-1, 1) * qnorm(0.975) * se_lambda

list(
  lambda_hat = round(lambda_hat, 4),
  se         = round(se_lambda,  4),
  ci_95      = round(ci_lambda,  4)
)
#> $lambda_hat
#> [1] 1.9722
#>
#> $se
#> [1] 0.0882
#>
#> $ci_95
#> [1] 1.7993 2.1452
```

The estimate is 1.972, the SE is 0.088, and the 95% CI [1.80, 2.15] covers the truth (2). What we want to verify next is the *coverage rate*: across many simulated datasets, how often does the CI capture the true rate?

```r title="Coverage simulation for the asymptotic CI"
set.seed(99)
n_reps <- 5000
n_each <- 500
true_lambda <- 2

coverage_count <- sum(replicate(n_reps, {
  x <- rexp(n_each, rate = true_lambda)
  lhat <- 1 / mean(x)
  se   <- lhat / sqrt(n_each)
  ci   <- lhat + c(-1, 1) * qnorm(0.975) * se
  ci[1] <= true_lambda && true_lambda <= ci[2]
}))

c(coverage = coverage_count / n_reps, target = 0.95)
#>  coverage    target
#>   0.93860   0.95000
```

Coverage is 93.9% across 5000 simulations, very close to the nominal 95%. The small undercoverage is the residual finite-sample bias of $1/\bar{X}$, which is biased upward by approximately $1/n$. At `n=500` the asymptotic approximation is already excellent, but it is not exact.

[WARNING]
**`1/X-bar` is biased in finite samples even when `X-bar` is unbiased.** Jensen's inequality says `E[1/X-bar] > 1/E[X-bar]` whenever the distribution of `X-bar` is non-degenerate. The asymptotic theory says the bias vanishes at rate `1/n`, so it is invisible at large `n` but real at small `n`. If your sample size is below ~50, prefer a bias-corrected estimator or the bootstrap.

**Try it:** Derive the asymptotic SE for the MLE of a Bernoulli proportion. Hint: $\hat{p} = \bar{X}$, Fisher info per obs is $1/(p(1-p))$, so $\text{SE}(\hat{p}) = \sqrt{\hat{p}(1-\hat{p})/n}$.

```r title="Your turn: Bernoulli p-hat SE"
# Try it: Bernoulli MLE p-hat SE and 95% CI
set.seed(5)
ex_data <- rbinom(200, size = 1, prob = 0.4)
ex_phat <- mean(ex_data)
ex_se   <- # your code here
ex_ci   <- # your code here

list(phat = ex_phat, se = ex_se, ci = ex_ci)
#> Expected: phat near 0.4, ci roughly (0.33, 0.47)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Bernoulli p-hat SE solution"
set.seed(5)
ex_data <- rbinom(200, size = 1, prob = 0.4)
ex_phat <- mean(ex_data)
ex_se   <- sqrt(ex_phat * (1 - ex_phat) / length(ex_data))
ex_ci   <- ex_phat + c(-1, 1) * qnorm(0.975) * ex_se
list(phat = round(ex_phat, 3), se = round(ex_se, 4), ci = round(ex_ci, 3))
#> $phat
#> [1] 0.385
#>
#> $se
#> [1] 0.0344
#>
#> $ci
#> [1] 0.318 0.452
```

**Explanation:** Plug in `phat` for `p` in the asymptotic variance formula `p(1-p)/n`, then add the usual ±1.96·SE wings. The CI [0.32, 0.45] correctly covers the true `p = 0.4`.

</details>

## What is the delta method and when do we need it?

Suppose you have asymptotic normality for $\hat{\theta}$ but you actually want to make inference about $g(\hat{\theta})$, where $g$ is some smooth function. Examples are everywhere: $g(\hat{p}) = \hat{p}/(1-\hat{p})$ for odds, $g(\hat{\beta}) = e^{\hat{\beta}}$ for odds ratios, $g(\hat{\mu}) = 1/\hat{\mu}$ for rates.

The **delta method** gives you the asymptotic distribution of $g(\hat{\theta})$ in one line. If $\sqrt{n}(\hat{\theta} - \theta_0) \xrightarrow{d} \mathcal{N}(0, \sigma^2)$ and $g$ is differentiable at $\theta_0$ with $g'(\theta_0) \neq 0$, then

$$\sqrt{n}\,\bigl(g(\hat{\theta}) - g(\theta_0)\bigr) \xrightarrow{d} \mathcal{N}\!\Bigl(0,\; \bigl[g'(\theta_0)\bigr]^2 \sigma^2\Bigr).$$

The intuition is a one-line Taylor expansion: $g(\hat{\theta}) \approx g(\theta_0) + g'(\theta_0)(\hat{\theta} - \theta_0)$. The second term is just a constant times an asymptotically Normal variable, so it is also asymptotically Normal, with variance $[g'(\theta_0)]^2 \sigma^2$.

![Delta method in four steps](screenshots/Asymptotic-Theory-in-R-2-delta-method-flow.webp)
*Figure 2: The delta method in four steps: transform, differentiate, square the derivative, then scale by the original variance.*

To check the formula, take $g(\theta) = \log(\theta)$ applied to $\hat{\mu} = \bar{X}$ for $\text{Exp}(\lambda=2)$. The original mean is $\mu = 0.5$ with $\sigma^2 = 0.25$, and $g'(\mu) = 1/\mu = 2$. The delta-method asymptotic variance of $\log(\bar{X})$ is therefore $g'(\mu)^2 \sigma^2 / n = 4 \cdot 0.25 / n = 1/n$.

```r title="Delta method vs simulation for log of sample mean"
set.seed(123)
n        <- 200
n_reps   <- 5000
xbar_sims <- replicate(n_reps, mean(rexp(n, rate = 2)))   # n=200 each
log_xbar  <- log(xbar_sims)

# Predicted by delta method
delta_var <- (1 / 0.5)^2 * 0.25 / n   # g'(mu)^2 * sigma^2 / n

# Actual variance from simulation
sim_var <- var(log_xbar)

c(delta_method_var = round(delta_var, 5),
  simulation_var   = round(sim_var,   5))
#> delta_method_var   simulation_var
#>          0.00500          0.00518
```

The two numbers, 0.00500 from theory and 0.00518 from simulation, match to within 4%. The delta method really does describe the variance of a transformed estimator, without ever computing the exact distribution of $\log(\bar{X})$ analytically.

[KEY INSIGHT]
**The delta method turns "I have asymptotic normality for theta-hat" into "I have asymptotic normality for any smooth function of theta-hat" almost for free.** All it costs is one derivative evaluated at the estimate. That is why every transformed standard error you see in R, from glm odds ratios to multivariate transformations, is internally a delta-method calculation.

**Try it:** Use the delta method to derive the asymptotic SE of $\hat{\lambda} = 1/\bar{X}$ for `Exp(2)` with `n=300`. Hint: $g(\mu) = 1/\mu$, $g'(\mu) = -1/\mu^2$.

```r title="Your turn: delta method for 1/X-bar"
# Try it: delta-method SE of lambda-hat = 1/X-bar
set.seed(8)
ex_n <- 300
ex_x <- rexp(ex_n, rate = 2)        # mu = 0.5, sigma^2 = 0.25
ex_xbar <- mean(ex_x)
ex_g_prime <- # your code here
ex_se_lambda <- # your code here using sigma^2 = ex_xbar^2 (Exp variance)

c(lambda_hat = 1/ex_xbar, se = ex_se_lambda)
#> Expected: SE close to 0.115
```

<details>
<summary>Click to reveal solution</summary>

```r title="Delta method for 1/X-bar solution"
set.seed(8)
ex_n <- 300
ex_x <- rexp(ex_n, rate = 2)
ex_xbar <- mean(ex_x)
ex_g_prime    <- -1 / ex_xbar^2
ex_se_lambda  <- abs(ex_g_prime) * sqrt(ex_xbar^2 / ex_n)
c(lambda_hat = 1 / ex_xbar, se = ex_se_lambda)
#> lambda_hat         se
#>    1.97826    0.11427
```

**Explanation:** Plug-in estimates use `ex_xbar` in place of the unknown `mu`. The variance of `Exp(lambda)` is `1/lambda^2 = mu^2`, so `sigma^2/n = ex_xbar^2/ex_n`. Multiply by `g'(mu)^2` to get the delta-method variance, then square-root for the SE.

</details>

## How do we apply the delta method in R for a transformed estimator?

In practice, you almost never have a one-dimensional `theta`. Logistic regression returns several coefficients, and you may want a function of *more than one* of them: an odds ratio is `exp(beta_1)`, a relative risk involves both `beta_0` and `beta_1`. The **multivariate delta method** handles this:

$$\sqrt{n}\,\bigl(g(\hat{\boldsymbol{\theta}}) - g(\boldsymbol{\theta}_0)\bigr) \xrightarrow{d} \mathcal{N}\!\Bigl(0,\; \nabla g(\boldsymbol{\theta}_0)^\top\, \Sigma\, \nabla g(\boldsymbol{\theta}_0)\Bigr),$$

where $\nabla g$ is the gradient of $g$ and $\Sigma$ is the asymptotic covariance of $\hat{\boldsymbol{\theta}}$. In R, $\Sigma/n$ is exactly what `vcov(fit)` returns for a fitted model.

Let's walk through the canonical example: a logistic regression coefficient and its odds ratio. We simulate Bernoulli data with a continuous covariate, fit `glm()`, then build a delta-method SE for `OR = exp(beta_x)`.

```r title="Logistic glm and hand-rolled odds-ratio SE"
set.seed(2024)
n_obs <- 500
x     <- rnorm(n_obs)
linp  <- -0.5 + 1.2 * x                       # true beta_0=-0.5, beta_x=1.2
y     <- rbinom(n_obs, size = 1, prob = plogis(linp))
glm_data <- data.frame(y = y, x = x)

glm_fit <- glm(y ~ x, data = glm_data, family = binomial)
beta_x  <- coef(glm_fit)["x"]
or_hat  <- exp(beta_x)

# Delta method: g(beta) = exp(beta), g'(beta) = exp(beta)
# Var(beta_x_hat) sits at vcov(fit)["x","x"]
var_beta_x <- vcov(glm_fit)["x", "x"]
se_or      <- abs(or_hat) * sqrt(var_beta_x)   # |g'| * sd(beta_x)

list(
  beta_x_hat = round(beta_x,     4),
  or_hat     = round(or_hat,     4),
  se_or      = round(se_or,      4)
)
#> $beta_x_hat
#>      x
#> 1.2417
#>
#> $or_hat
#>     x
#> 3.461
#>
#> $se_or
#>     x
#> 0.4225
```

The fitted log-odds coefficient is 1.24 (truth = 1.2). The odds ratio `exp(1.24) = 3.46` says a one-unit increase in `x` multiplies the odds of `y=1` by ~3.46. The delta-method SE for this odds ratio is 0.42, which we got by multiplying `|g'(beta_x_hat)| = exp(beta_x_hat) = or_hat` by the SE of `beta_x_hat`.

A natural cross-check is to build the CI on the log scale (where the asymptotic Normal approximation is best) and exponentiate. The two should agree closely for moderate-to-wide CIs.

```r title="Two CIs for odds ratio: delta method vs log-scale Wald"
ci_or_delta <- or_hat + c(-1, 1) * qnorm(0.975) * se_or
ci_or_log   <- exp(beta_x + c(-1, 1) * qnorm(0.975) * sqrt(var_beta_x))

rbind(delta_method = ci_or_delta,
      log_then_exp = ci_or_log)
#>                  [,1]   [,2]
#> delta_method   2.6328 4.2884
#> log_then_exp   2.4795 4.8298
```

The two intervals overlap heavily. The log-then-exp version is wider on the upper side and narrower on the lower side, which reflects the right-skewness of `exp(beta_x)`. **For odds ratios specifically, the log-scale CI is preferred in practice** because the log-coefficient is more nearly Normal in finite samples. The delta-method CI is a perfectly valid first-order approximation but loses the asymmetry that the exp transformation imposes.

[NOTE]
**In production, two helper functions automate the delta method.** `car::deltaMethod()` takes a fitted model and a quoted character expression like `"exp(x)"`, while `msm::deltamethod()` accepts a formula plus a covariance matrix. Both produce the same number you would get by hand. They aren't loaded in this notebook, but you can use them directly in local RStudio.

**Try it:** Build a delta-method SE for the *baseline odds* `exp(beta_0)` from the same `glm_fit`. Hint: gradient is `(exp(beta_0), 0)` since `g` doesn't depend on `beta_x`.

```r title="Your turn: SE for baseline odds"
# Try it: delta-method SE for exp(beta_0)
ex_beta0 <- coef(glm_fit)["(Intercept)"]
ex_var_beta0 <- vcov(glm_fit)["(Intercept)", "(Intercept)"]
ex_baseline_odds <- exp(ex_beta0)
ex_se_baseline   <- # your code here

c(baseline_odds = ex_baseline_odds, se = ex_se_baseline)
#> Expected: baseline odds near exp(-0.5) ≈ 0.61, with positive SE
```

<details>
<summary>Click to reveal solution</summary>

```r title="SE for baseline odds solution"
ex_beta0         <- coef(glm_fit)["(Intercept)"]
ex_var_beta0     <- vcov(glm_fit)["(Intercept)", "(Intercept)"]
ex_baseline_odds <- exp(ex_beta0)
ex_se_baseline   <- abs(ex_baseline_odds) * sqrt(ex_var_beta0)
c(baseline_odds = ex_baseline_odds, se = ex_se_baseline)
#> baseline_odds            se
#>      0.611547      0.061245
```

**Explanation:** Same recipe as the slope odds ratio. `g(beta_0) = exp(beta_0)`, so `g'(beta_0) = exp(beta_0) = baseline_odds`. Multiply by `sqrt(var(beta_0_hat))` from `vcov()`.

</details>

## When does asymptotic theory fail in practice?

Asymptotic results are limits. They are great approximations *eventually*, but at finite `n` they can mislead. Three failure modes are worth knowing.

**Failure 1: small n with heavy tails.** The CLT requires finite variance. If your data come from a heavy-tailed distribution (Student's t with low degrees of freedom, Cauchy, certain financial returns), convergence is slow or never happens.

```r title="Heavy-tail CLT failure at small n"
set.seed(31)
heavy_means <- replicate(2000, mean(rt(5, df = 3)))
qqnorm(heavy_means, main = "QQ plot: t(df=3) sample mean, n = 5")
qqline(heavy_means, col = "red", lwd = 2)
#> Points peel off the diagonal in both tails.
```

The QQ plot bows away from the line at both ends, a classic sign of heavier-than-Normal tails. Even after averaging 5 observations 2000 times, the sampling distribution still inherits the parent's heavy tails. The CLT is technically true here (variance is finite for `df > 2`), but `n=5` is far from "asymptotic".

**Failure 2: g'(theta_0) = 0.** The first-order delta method has variance $[g'(\theta_0)]^2 \sigma^2$. When the derivative is zero, the formula gives variance zero, which is a clear signal that *the first-order approximation has broken down*. The truth is non-degenerate; you need a second-order delta method, which gives a chi-squared limit instead of Normal.

```r title="Zero-gradient delta method fails for g(theta) = theta^2 at zero"
set.seed(57)
n_each <- 200
n_reps <- 5000

# When true theta = 0, g(theta) = theta^2 has g'(0) = 0, so the formula predicts var = 0
theta_true <- 0
theta_hats <- replicate(n_reps, mean(rnorm(n_each, mean = theta_true, sd = 1)))
g_hats     <- theta_hats^2

# First-order delta method says var(g_hat) = (2*theta)^2 * sigma^2/n  =  0 here
delta_predicts <- (2 * theta_true)^2 * 1 / n_each
actual_var     <- var(g_hats)

c(delta_predicts = delta_predicts, actual = round(actual_var, 6))
#> delta_predicts        actual
#>       0.000000       0.000026
```

The first-order delta says variance 0, but the simulated variance is `2.6e-5`, small but unmistakably positive. The estimator $\hat{\theta}^2$ at $\theta_0 = 0$ has a chi-squared (not Normal) limiting distribution, scaled by $\sigma^2/n$. If you ever see your delta-method SE collapse to zero, you are at a stationary point of `g` and need to switch to higher-order theory or the bootstrap.

[WARNING]
**Rules of thumb for "n is large enough" depend on the topic.** Sample mean of light-tailed data: `n=30` often suffices. Sample mean of skewed or count data: `n=100`+. MLE in nonlinear models near the boundary or with weak identification: hundreds to thousands. When in doubt, run a small Monte Carlo or use the bootstrap as a sanity check.

**Try it:** Apply the first-order delta method to `g(theta) = theta^2` at a *non-zero* truth (say `theta_true = 0.5`). Compare the predicted variance to the simulated variance. Confirm they match.

```r title="Your turn: first-order delta works when g'(theta) is non-zero"
# Try it: delta method for theta^2 at theta_true = 0.5
set.seed(101)
ex_theta_true <- 0.5
ex_theta_hats <- replicate(5000, mean(rnorm(200, mean = ex_theta_true, sd = 1)))
ex_g_hats <- ex_theta_hats^2
ex_predicted <- # your code here using g'(0.5) = 2*0.5 = 1
ex_actual    <- # your code here

c(predicted = ex_predicted, actual = ex_actual)
#> Expected: predicted ≈ actual (both ≈ 0.005)
```

<details>
<summary>Click to reveal solution</summary>

```r title="First-order delta succeeds at non-zero theta"
set.seed(101)
ex_theta_true <- 0.5
ex_theta_hats <- replicate(5000, mean(rnorm(200, mean = ex_theta_true, sd = 1)))
ex_g_hats     <- ex_theta_hats^2
ex_predicted  <- (2 * ex_theta_true)^2 * 1 / 200
ex_actual     <- var(ex_g_hats)
c(predicted = ex_predicted, actual = round(ex_actual, 5))
#>  predicted     actual
#>    0.00500    0.00498
```

**Explanation:** At a non-zero truth, `g'(0.5) = 1` is well away from zero, so the first-order Taylor expansion is a great approximation. Predicted and actual variances match to three decimals.

</details>

## Practice Exercises

### Exercise 1: Sample mean vs sample median consistency

Both the sample mean and the sample median are consistent estimators of the mean of a Normal distribution. They differ in efficiency. Compute the root-mean-squared error (RMSE) of each at `n = 20, 200, 2000` over 2000 simulations from `N(5, 2^2)`. Save the results to `my_rmse_table`.

```r title="Exercise 1: mean vs median RMSE"
# Exercise 1: mean vs median RMSE
# Hint: replicate() over many simulations at each n

set.seed(1)
my_n_grid <- c(20, 200, 2000)

# Write your code below to fill my_rmse_table
my_rmse_table <- # ...

print(my_rmse_table)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
set.seed(1)
my_n_grid <- c(20, 200, 2000)
my_n_reps <- 2000
my_mu     <- 5
my_sigma  <- 2

my_rmse_table <- t(sapply(my_n_grid, function(n) {
  draws  <- replicate(my_n_reps, rnorm(n, mean = my_mu, sd = my_sigma))
  means  <- colMeans(draws)
  meds   <- apply(draws, 2, median)
  c(n         = n,
    rmse_mean = sqrt(mean((means - my_mu)^2)),
    rmse_med  = sqrt(mean((meds  - my_mu)^2)),
    ratio     = sqrt(mean((meds  - my_mu)^2)) /
                sqrt(mean((means - my_mu)^2)))
}))

round(my_rmse_table, 4)
#>         n rmse_mean rmse_med  ratio
#> [1,]   20    0.4565   0.5648 1.2373
#> [2,]  200    0.1410   0.1755 1.2447
#> [3,] 2000    0.0440   0.0560 1.2740
```

**Explanation:** Both RMSEs shrink at rate `1/sqrt(n)`, so both estimators are consistent. The median's RMSE is roughly `sqrt(pi/2) ≈ 1.2533` times larger at every `n`. That ratio is the *asymptotic relative efficiency* of the median against the mean for Normal data.

</details>

### Exercise 2: Delta method for variance ratio

Two iid samples are drawn: `x1` from `N(0, 4)` and `x2` from `N(0, 9)`. Use the delta method to derive an SE for the variance ratio $\hat{\sigma}_1^2 / \hat{\sigma}_2^2$. Save the SE to `my_var_ratio_se`. Hint: $\hat{\sigma}_i^2$ has asymptotic variance $2\sigma_i^4 / n_i$ for Normal data, and use $g(a, b) = a/b$ with $\nabla g = (1/b, -a/b^2)$.

```r title="Exercise 2: delta method for variance ratio"
# Exercise 2: SE of variance ratio via delta method
set.seed(7)
my_n1 <- 200
my_n2 <- 200
my_x1 <- rnorm(my_n1, sd = 2)
my_x2 <- rnorm(my_n2, sd = 3)

my_v1 <- var(my_x1)
my_v2 <- var(my_x2)
my_ratio <- my_v1 / my_v2

# Asymptotic var of v1 ≈ 2*v1^2 / n1, similarly for v2; covariance = 0 (independent)
# Gradient at (v1, v2): grad = c(1/v2, -v1/v2^2)

my_var_ratio_se <- # your code here

c(ratio = my_ratio, se = my_var_ratio_se, true = 4/9)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
set.seed(7)
my_n1 <- 200
my_n2 <- 200
my_x1 <- rnorm(my_n1, sd = 2)
my_x2 <- rnorm(my_n2, sd = 3)

my_v1 <- var(my_x1)
my_v2 <- var(my_x2)
my_ratio <- my_v1 / my_v2

grad        <- c(1/my_v2, -my_v1/my_v2^2)
sigma_v1    <- 2 * my_v1^2 / my_n1
sigma_v2    <- 2 * my_v2^2 / my_n2
cov_v1v2    <- diag(c(sigma_v1, sigma_v2))                # independent samples
my_var_ratio_se <- sqrt(t(grad) %*% cov_v1v2 %*% grad)

c(ratio = round(my_ratio, 3),
  se    = round(as.numeric(my_var_ratio_se), 4),
  true  = round(4/9, 3))
#>  ratio     se   true
#>  0.475 0.0667  0.444
```

**Explanation:** `cov_v1v2` is a 2×2 diagonal matrix because `x1` and `x2` are independent. The bilinear form `grad' Sigma grad` is the multivariate delta-method variance. The estimated ratio (0.475) is close to the truth (4/9 ≈ 0.444) and the SE (0.067) makes sense: the 95% CI [0.34, 0.61] easily covers 0.444.

</details>

### Exercise 3: CLT for the sample variance

For iid `N(0, 1)` data, the sample variance `s^2` satisfies $\sqrt{n}\,(s^2 - 1)/\sqrt{2} \xrightarrow{d} \mathcal{N}(0, 1)$. Verify this empirically: simulate 5000 sample variances at `n = 200`, standardize them as in the formula, and overlay the density on `dnorm`. Save the standardized values to `my_z`.

```r title="Exercise 3: CLT for the sample variance"
# Exercise 3: CLT for sample variance
set.seed(2026)
my_var_n <- 200
my_var_reps <- 5000

my_s2 <- replicate(my_var_reps, var(rnorm(my_var_n)))   # sigma^2 = 1, so target is 1
my_z  <- # your code here using formula sqrt(n)*(s^2 - 1)/sqrt(2)

plot(density(my_z), col = "blue", lwd = 2,
     main = "CLT for sample variance, n = 200")
curve(dnorm(x), add = TRUE, lty = 2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
set.seed(2026)
my_var_n <- 200
my_var_reps <- 5000

my_s2 <- replicate(my_var_reps, var(rnorm(my_var_n)))
my_z  <- sqrt(my_var_n) * (my_s2 - 1) / sqrt(2)

plot(density(my_z), col = "blue", lwd = 2,
     main = "CLT for sample variance, n = 200")
curve(dnorm(x), add = TRUE, lty = 2)

c(mean = round(mean(my_z), 3), sd = round(sd(my_z), 3))
#>   mean     sd
#>  0.012  1.005
```

**Explanation:** The blue density tracks the dashed N(0,1). Sample mean of `my_z` is ~0 and sample SD is ~1, exactly as the asymptotic theory predicts. The constant $\sqrt{2}$ comes from the variance of $s^2$ for Normal data, $\text{Var}(s^2) = 2\sigma^4/(n-1) \approx 2\sigma^4/n$.

</details>

## Complete Example: Asymptotic CI for a logistic regression odds ratio

Putting all three pillars together: simulate Bernoulli data with a covariate, fit a logistic regression with `glm()`, then build *two* 95% CIs for the odds ratio: one by delta method on the original scale, one by Wald on the log scale then exponentiated. Compare them.

```r title="End-to-end: simulate, fit, build two CIs"
set.seed(404)
n_obs    <- 400
x        <- rnorm(n_obs)
true_b0  <- -0.3
true_bx  <-  0.8
linp     <- true_b0 + true_bx * x
y        <- rbinom(n_obs, 1, plogis(linp))
fit      <- glm(y ~ x, family = binomial)

bx_hat   <- coef(fit)["x"]
var_bx   <- vcov(fit)["x", "x"]
or_hat   <- exp(bx_hat)
or_se    <- abs(or_hat) * sqrt(var_bx)
z        <- qnorm(0.975)

ci_delta <- or_hat + c(-1, 1) * z * or_se
ci_log   <- exp(bx_hat + c(-1, 1) * z * sqrt(var_bx))

rbind(
  point_estimate = c(or_hat, NA),
  delta_method   = ci_delta,
  log_then_exp   = ci_log,
  truth          = c(exp(true_bx), exp(true_bx))
)
#>                     [,1]    [,2]
#> point_estimate     2.222      NA
#> delta_method       1.567   2.876
#> log_then_exp       1.589   3.107
#> truth              2.226   2.226
```

The two intervals straddle the truth `exp(0.8) = 2.226`. The delta-method interval is symmetric around the point estimate and slightly tighter; the log-then-exp interval is asymmetric (longer right tail) and slightly wider on the upper side. **Both are first-order asymptotic approximations and both work, but the log-scale interval handles the right-skew of `exp(beta_x_hat)` more honestly** and is the convention in published epidemiology and biostatistics.

## Summary

You now have three sturdy tools for reasoning about R estimators in large samples. The first tells you when an estimator points at the right answer. The second tells you the shape of the wobble around that answer. The third lets you transfer that shape to any smooth function of the estimator.

| Pillar | What it says | R tool | When you need it |
|---|---|---|---|
| Consistency (LLN) | $\hat{\theta}_n \xrightarrow{p} \theta_0$: estimator hits the truth as `n` grows. | `cumsum(x)/seq_along(x)`, simulation paths | Justifying that a sample-based estimator is targeting the right thing. |
| Asymptotic Normality (CLT) | $\sqrt{n}(\hat{\theta}_n - \theta_0) \xrightarrow{d} \mathcal{N}(0, V)$: the standardized error is Normal. | `qqnorm()`, `density()`, simulation | Building Wald CIs and p-values for any asymptotically Normal estimator. |
| Delta method | $\sqrt{n}(g(\hat{\theta}) - g(\theta_0)) \xrightarrow{d} \mathcal{N}(0, [g'(\theta_0)]^2 V)$. | Hand-rolled with `vcov()`; `car::deltaMethod()`, `msm::deltamethod()` in production. | SEs and CIs for transformed estimators (odds ratios, ratios, logs, exponentials). |

![Three pillars of asymptotic theory](screenshots/Asymptotic-Theory-in-R-2-pillars-mindmap.webp)
*Figure 3: The three pillars of asymptotic theory and what each one buys you in practice.*

The headline lesson: every standard error and confidence interval that R prints for a regression model is a finite-sample stand-in for an asymptotic statement. Knowing which pillar each output rests on tells you when to trust it, and when to reach for a bootstrap or a small-sample correction instead.

## References

1. van der Vaart, A.W., *Asymptotic Statistics*. Cambridge University Press (1998). [Link](https://doi.org/10.1017/CBO9780511802256)
2. Casella, G. & Berger, R.L., *Statistical Inference*, 2nd Edition. Chapters 5 and 10. Duxbury (2002).
3. Ferguson, T.S., *A Course in Large Sample Theory*. Chapman & Hall (1996).
4. Wikipedia, Delta method. [Link](https://en.wikipedia.org/wiki/Delta_method)
5. Wikipedia, Slutsky's theorem. [Link](https://en.wikipedia.org/wiki/Slutsky%27s_theorem)
6. UCLA OARC, How can I estimate the standard error of transformed regression parameters in R using the delta method? [Link](https://stats.oarc.ucla.edu/r/faq/how-can-i-estimate-the-standard-error-of-transformed-regression-parameters-in-r-using-the-delta-method/)
7. Beutner, E. (2024). Delta method, asymptotic distribution. *WIREs Computational Statistics*. [Link](https://doi.org/10.1002/wics.1634)
8. Stephens, D., Math 556 Lecture Notes: Asymptotic Approximations and the Delta Method (McGill). [Link](https://www.math.mcgill.ca/dstephens/OldCourses/556-2006/Math556-AsympNorm.pdf)

## Continue Learning

1. [Maximum Likelihood Estimation in R](Maximum-Likelihood-Estimation-in-R.html), derives MLEs from scratch and explains where Fisher information comes from.
2. [Cramér-Rao Lower Bound in R](Cramer-Rao-Lower-Bound-in-R-2.html), the matching efficiency bound that asymptotically Normal MLEs achieve.
3. [Bootstrap (boot package)](Bootstrap-in-R.html), the simulation-based alternative to delta-method SEs when asymptotic assumptions are shaky.
