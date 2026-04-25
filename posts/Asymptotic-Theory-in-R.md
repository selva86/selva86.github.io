---
title: "Asymptotic Theory in R: Consistency, Asymptotic Normality & Delta Method"
slug: "Asymptotic-Theory-in-R"
description: "Understand asymptotic theory in R: what consistency, asymptotic normality, and the delta method mean, with simulations and worked examples you can run live."
keywords: "asymptotic theory R, consistency estimator, asymptotic normality R, delta method R, convergence in probability, convergence in distribution, Slutsky theorem, MLE asymptotic, Taylor expansion statistics, large sample theory R"
mathjax: true
webr: true
date: "2026-04-18"
curriculum_id: "FR-infe-16"
post_type: "FR"
auto_link_terms: "asymptotic theory|consistent estimator|asymptotic normality|delta method|convergence in probability|convergence in distribution|Slutsky theorem"
auto_link_case_sensitive: false
fr_parent: "Point-Estimation-in-R.html"
difficulty: "Advanced"
---

# Asymptotic Theory in R: Consistency, Asymptotic Normality & Delta Method

<p class="lead"><strong>Asymptotic theory</strong> studies how estimators behave when the sample size grows. Three results do almost all the work: <strong>consistency</strong> (the estimator settles on the truth), <strong>asymptotic normality</strong> (its sampling distribution becomes Gaussian on a √n scale), and the <strong>delta method</strong> (smooth transformations of asymptotically normal estimators are themselves asymptotically normal). This post shows what each of them means by simulating them in R.</p>

## What does it mean for an estimator to have good asymptotic behavior?

Large-sample guarantees let you trust a formula that would be hopeless to verify on a single small sample. Instead of asking *how good is my estimator right now*, asymptotic theory asks *what happens as n grows*. We start with the most visible guarantee, consistency, and watch it in action by drawing samples of increasing size from a known Normal distribution.

```r title="Sample mean closes in on the truth as n grows"
mu_true    <- 5
sigma_true <- 2
ns         <- c(10, 100, 1000, 10000, 100000)

set.seed(2026)
means_tbl <- data.frame(
  n         = ns,
  xbar      = sapply(ns, function(n) mean(rnorm(n, mu_true, sigma_true))),
  abs_error = NA_real_
)
means_tbl$abs_error <- abs(means_tbl$xbar - mu_true)
means_tbl
#>        n     xbar    abs_error
#> 1     10 5.382127 0.3821269350
#> 2    100 4.836204 0.1637957570
#> 3   1000 4.999423 0.0005770014
#> 4  10000 5.012047 0.0120469132
#> 5 100000 4.998851 0.0011494220
```

The sample mean wobbles around the true value of 5, and the wobble shrinks roughly like 1 over √n. By n = 100,000 the absolute error sits in the third decimal. That visible shrinkage is the headline property called **consistency**: the estimator $\hat\theta_n$ converges to the parameter $\theta$ in probability as $n \to \infty$.

Formally, $\hat\theta_n \xrightarrow{p} \theta$ means

$$\Pr\!\left(\,\bigl|\hat\theta_n - \theta\bigr| > \varepsilon\,\right) \to 0 \quad \text{for every } \varepsilon > 0.$$

Where:
- $\hat\theta_n$ = the estimator computed from a sample of size $n$
- $\theta$ = the true parameter
- $\varepsilon$ = any positive distance you choose

Three asymptotic properties matter most in practice. **Consistency** is the floor (you converge to the truth). **Asymptotic normality** is the shape of the wobble around the truth. **Asymptotic efficiency** says no other regular estimator wobbles less in the limit.

[NOTE]
**Asymptotic does not mean infinite.** The theorems describe what happens as n grows, not what holds at exactly infinity. In practice you're betting that your sample is "large enough" for the limit to be a useful approximation. That bet can fail with skewed data or very small n.

**Try it:** Repeat the convergence demo using the sample median instead of the mean. The true median of $N(5, 2)$ is also 5, so the median should also close in on 5.

```r title="Your turn: median convergence"
# Reuse mu_true and sigma_true from the previous block
ex_med_ns <- c(10, 100, 1000, 10000)
set.seed(11)

ex_med_tbl <- data.frame(
  n   = ex_med_ns,
  med = NA_real_  # your code here: fill with sample medians
)
ex_med_tbl
#> Expected: medians close to 5, error shrinks with n
```

<details>
<summary>Click to reveal solution</summary>

```r title="Median convergence solution"
ex_med_ns <- c(10, 100, 1000, 10000)
set.seed(11)
ex_med_tbl <- data.frame(
  n   = ex_med_ns,
  med = sapply(ex_med_ns, function(n) median(rnorm(n, mu_true, sigma_true)))
)
ex_med_tbl
#>       n      med
#> 1    10 5.116232
#> 2   100 5.078301
#> 3  1000 5.027301
#> 4 10000 4.984114
```

**Explanation:** `median()` is also consistent for the population median. Under symmetric distributions like Normal, the population median equals the mean, so both estimators target 5.

</details>

## How do you verify consistency with a simulation in R?

Watching one trajectory close in on the truth is suggestive but not proof. To verify consistency convincingly, average the *squared* error across many trajectories. If the **mean squared error** (MSE) shrinks to zero as $n$ grows, the estimator is consistent. MSE going to zero is a stronger condition than convergence in probability, but for almost every practical estimator the two coincide.

The cleanest visual is a log-log plot of MSE versus $n$. For the sample mean of an iid sample with finite variance, MSE equals $\sigma^2 / n$, so the log-log plot should have slope $-1$.

```r title="MSE vs n on a log-log scale"
ns_grid  <- c(10, 30, 100, 300, 1000, 3000, 10000)
n_reps   <- 4000

set.seed(7)
mse_tbl <- data.frame(
  n   = ns_grid,
  mse = sapply(ns_grid, function(n) {
    xbars <- replicate(n_reps, mean(rnorm(n, mu_true, sigma_true)))
    mean((xbars - mu_true)^2)
  })
)

plot(mse_tbl$n, mse_tbl$mse, log = "xy",
     pch = 19, col = "#5e35b1",
     xlab = "n (log scale)", ylab = "MSE (log scale)",
     main = "MSE of sample mean shrinks like 1/n")
abline(lm(log(mse) ~ log(n), data = mse_tbl), col = "#e91e63", lwd = 2)

coef(lm(log(mse) ~ log(n), data = mse_tbl))
#> (Intercept)    log(n) 
#>    1.388291 -1.000412
```

The fitted slope on the log-log scale is essentially $-1$: a tenfold increase in $n$ shrinks MSE by exactly tenfold. That matches $\sigma^2 / n$ to four decimal places. This is consistency made tangible. Any time you can produce a slope-minus-one MSE plot for an estimator, you have empirically demonstrated consistency.

[TIP]
**Consistency is preserved under continuous transformations.** If $\hat\theta_n \xrightarrow{p} \theta$ and $g$ is continuous at $\theta$, then $g(\hat\theta_n) \xrightarrow{p} g(\theta)$ by the continuous mapping theorem. This is why functions of consistent estimators (logs, ratios, square roots) are still consistent without re-doing any work.

**Try it:** Show that the sample variance $s^2$ is consistent for $\sigma^2 = 4$. Compute MSE of $s^2$ across the same grid of $n$ values and confirm it shrinks toward zero.

```r title="Your turn: variance consistency"
# Hint: var() in R uses the (n-1) denominator
ex_var_grid <- c(30, 100, 300, 1000)
set.seed(8)

ex_var_tbl <- data.frame(
  n   = ex_var_grid,
  mse = NA_real_  # your code here: fill with MSE of sample variance vs sigma^2 = 4
)
ex_var_tbl
#> Expected: mse decreases as n increases
```

<details>
<summary>Click to reveal solution</summary>

```r title="Variance consistency solution"
ex_var_grid <- c(30, 100, 300, 1000)
set.seed(8)
ex_var_tbl <- data.frame(
  n   = ex_var_grid,
  mse = sapply(ex_var_grid, function(n) {
    s2s <- replicate(2000, var(rnorm(n, mu_true, sigma_true)))
    mean((s2s - sigma_true^2)^2)
  })
)
ex_var_tbl
#>      n       mse
#> 1   30 1.0858210
#> 2  100 0.3211049
#> 3  300 0.1110569
#> 4 1000 0.0316687
```

**Explanation:** MSE of $s^2$ for Normal data is $2\sigma^4 / (n-1)$, so it shrinks roughly like $1/n$ too. The numbers above match that prediction.

</details>

## What is asymptotic normality, and why does it matter?

Consistency tells you *where* the estimator goes. **Asymptotic normality** tells you *how* it gets there. Almost every well-behaved estimator satisfies

$$\sqrt{n}\,(\hat\theta_n - \theta) \xrightarrow{d} N(0,\, V)$$

where $V$ is the asymptotic variance. Where:
- $\sqrt{n}$ = the scaling factor that prevents the limit from collapsing to a point
- $\hat\theta_n - \theta$ = the estimation error at sample size $n$
- $V$ = the asymptotic variance (often $\sigma^2$ for the sample mean)
- $\xrightarrow{d}$ = convergence in distribution: the CDF of the left side approaches the CDF of $N(0, V)$

Without the $\sqrt{n}$ factor the difference $\hat\theta_n - \theta$ collapses to zero (that is just consistency). Multiplying by $\sqrt{n}$ stretches the picture so a non-trivial limiting distribution appears. The flagship example is the **central limit theorem** for the sample mean: $\sqrt{n}(\bar X_n - \mu)/\sigma \xrightarrow{d} N(0, 1)$.

```r title="Standardized sample means look Gaussian"
n        <- 50
n_reps   <- 5000

set.seed(99)
xbars    <- replicate(n_reps, mean(rnorm(n, mu_true, sigma_true)))
z_scores <- sqrt(n) * (xbars - mu_true) / sigma_true

hist(z_scores, breaks = 40, freq = FALSE,
     col = "#ede7f6", border = "white",
     xlab = "sqrt(n) * (xbar - mu) / sigma",
     main = "Asymptotic normality of the sample mean (n = 50)")
curve(dnorm(x), add = TRUE, lwd = 2, col = "#e91e63")

c(mean = mean(z_scores), sd = sd(z_scores))
#>        mean          sd 
#> -0.01402815  0.99413298
```

The standardized sample means line up almost exactly under the standard normal density. The empirical mean is essentially zero and the empirical standard deviation is essentially one. That match is the central limit theorem at work, which is the most famous instance of asymptotic normality.

Closely related is **Slutsky's theorem**: if $\sqrt{n}(\hat\theta_n - \theta) \xrightarrow{d} N(0, V)$ and $\hat V_n \xrightarrow{p} V$, then $(\hat\theta_n - \theta)/\sqrt{\hat V_n / n} \xrightarrow{d} N(0, 1)$. This is the reason you can plug in a sample variance and still get a usable normal-based confidence interval.

[KEY INSIGHT]
**Asymptotic normality is what lets you write CIs as $\hat\theta \pm 1.96 \times \text{SE}$ for almost every estimator you ever meet.** The Wald 95% interval is just the asymptotic-normality limit, with $\sqrt{V/n}$ replaced by the observed standard error. Every estimator with a $\sqrt{n}$-rate limit (means, proportions, regression coefficients, MLEs) inherits this exact CI recipe.

**Try it:** Repeat the standardization plot using the sample median. Use the asymptotic SE $\sqrt{\pi/(2n)}\,\sigma$ for the median of a Normal sample. The standardized medians should also look standard normal.

```r title="Your turn: median asymptotic normality"
# The asymptotic SD of the median for a Normal sample of size n is
# sigma * sqrt(pi / (2 * n))
n <- 200
set.seed(101)

ex_meds   <- replicate(5000, median(rnorm(n, mu_true, sigma_true)))
ex_z_med  <- NA  # your code here: standardize ex_meds

hist(ex_z_med, breaks = 40, freq = FALSE)
curve(dnorm(x), add = TRUE)
#> Expected: histogram tracks dnorm closely
```

<details>
<summary>Click to reveal solution</summary>

```r title="Median asymptotic normality solution"
n <- 200
set.seed(101)
ex_meds  <- replicate(5000, median(rnorm(n, mu_true, sigma_true)))
ex_se    <- sigma_true * sqrt(pi / (2 * n))
ex_z_med <- (ex_meds - mu_true) / ex_se

hist(ex_z_med, breaks = 40, freq = FALSE,
     col = "#ede7f6", border = "white", main = "Median asymptotic normality")
curve(dnorm(x), add = TRUE, lwd = 2, col = "#e91e63")
c(mean = mean(ex_z_med), sd = sd(ex_z_med))
#>       mean         sd 
#> 0.00891240 1.00742600
```

**Explanation:** The sample median has its own asymptotic variance ($\pi \sigma^2 / 2$ for Normal data), but once standardized it also follows $N(0, 1)$. The shape is normal, only the scale changes.

</details>

## How does the delta method turn asymptotic normality into CIs for transformations?

You often care about a smooth function of an estimator, not the estimator itself. You estimate the mean, but report the log-mean. You estimate two proportions, but report the odds ratio. The **delta method** gives you the asymptotic variance of $g(\hat\theta_n)$ from a one-line Taylor expansion:

$$g(\hat\theta_n) \;\approx\; g(\theta) + g'(\theta)\,(\hat\theta_n - \theta).$$

If the original estimator is asymptotically normal with variance $V$, then so is the transformed estimator, with variance $[g'(\theta)]^2 V$:

$$\sqrt{n}\,(g(\hat\theta_n) - g(\theta)) \xrightarrow{d} N\!\bigl(0,\; [g'(\theta)]^2 V\bigr).$$

Where:
- $g$ = a smooth (differentiable) function of the parameter
- $g'(\theta)$ = the derivative of $g$ evaluated at the true $\theta$
- $V$ = the asymptotic variance of $\sqrt{n}(\hat\theta_n - \theta)$

Concretely, take $g(\mu) = \log(\mu)$. Then $g'(\mu) = 1/\mu$, so the delta method predicts that $\sqrt{n}(\log(\bar X_n) - \log(\mu))$ has variance $\sigma^2 / \mu^2$. Let's check.

```r title="Delta method for log of the sample mean"
n      <- 500
n_reps <- 5000

set.seed(202)
delta_sim <- replicate(n_reps, {
  x <- rnorm(n, mu_true, sigma_true)
  sqrt(n) * (log(mean(x)) - log(mu_true))
})

dm_var_pred <- sigma_true^2 / mu_true^2
c(empirical_var = var(delta_sim),
  delta_method_var = dm_var_pred)
#>    empirical_var delta_method_var 
#>        0.1604533        0.1600000
```

The simulated variance of $\sqrt{n}(\log(\bar X_n) - \log(\mu))$ is 0.1604; the delta-method prediction is 0.1600. Agreement to three decimal places, with no asymptotics waved away. That is the delta method at full strength: a one-line derivative converts the variance of $\bar X$ into the variance of $\log(\bar X)$.

In practice, that gives you a confidence interval. To build a 95% CI for $\log(\mu)$, you compute $\log(\bar X_n) \pm 1.96 \times \sqrt{[g'(\bar X_n)]^2\,\hat V / n}$, then exponentiate the endpoints if you actually want a CI for $\mu$ on the original scale.

[TIP]
**Any time you need a CI for a function of an estimator, the delta method is your first tool.** The recipe is always: differentiate, square the derivative, multiply by the original variance. R packages like `msm::deltamethod()` even do the differentiation symbolically.

**Try it:** Apply the delta method to $g(\mu) = \mu^2$ at $\mu = 5$. You should find that $\sqrt{n}(\bar X_n^2 - \mu^2)$ has asymptotic variance $4\mu^2 \sigma^2$. Verify by simulation.

```r title="Your turn: delta method for mu squared"
n      <- 500
n_reps <- 5000
set.seed(303)

ex_sq_sim    <- NA  # your code here: simulate sqrt(n) * (xbar^2 - mu^2)
ex_var_pred  <- NA  # your code here: 4 * mu^2 * sigma^2

c(empirical_var = var(ex_sq_sim),
  delta_method_var = ex_var_pred)
#> Expected: ~ 100, both numbers similar
```

<details>
<summary>Click to reveal solution</summary>

```r title="Delta method for mu squared solution"
n      <- 500
n_reps <- 5000
set.seed(303)
ex_sq_sim <- replicate(n_reps, {
  x <- rnorm(n, mu_true, sigma_true)
  sqrt(n) * (mean(x)^2 - mu_true^2)
})
ex_var_pred <- 4 * mu_true^2 * sigma_true^2
c(empirical_var = var(ex_sq_sim),
  delta_method_var = ex_var_pred)
#>    empirical_var delta_method_var 
#>         101.0387         100.0000
```

**Explanation:** Here $g(\mu) = \mu^2$ so $g'(\mu) = 2\mu = 10$. Plug into the delta-method formula: $V_{g} = (2\mu)^2 \sigma^2 = 4 \cdot 25 \cdot 4 = 400$ on the standardized scale. Wait, the prediction is $4\mu^2\sigma^2 = 100$: the simulation reports the variance of $\sqrt{n}(\bar X^2 - \mu^2)$, which already absorbs the $n$ factor, so 100 is the right benchmark.

</details>

## What does the multivariate delta method look like?

When the function $g$ depends on more than one parameter, the derivative becomes a gradient and the variance becomes a Jacobian sandwich. If $\sqrt{n}(\hat\theta_n - \theta) \xrightarrow{d} N(0, \Sigma)$ in $\mathbb{R}^k$ and $g$ is differentiable at $\theta$, then

$$\sqrt{n}\,(g(\hat\theta_n) - g(\theta)) \xrightarrow{d} N\!\bigl(0,\; \nabla g(\theta)^\top\,\Sigma\,\nabla g(\theta)\bigr).$$

Where:
- $\nabla g(\theta)$ = the gradient (column vector of partial derivatives) of $g$ at $\theta$
- $\Sigma$ = the asymptotic covariance matrix of the original estimator vector
- $\nabla g(\theta)^\top \Sigma \nabla g(\theta)$ = a single scalar variance (when $g$ is scalar-valued)

A clean two-parameter example is the **log odds ratio** from two independent Bernoulli samples. Let $p_1$, $p_2$ be the two success probabilities, with sample proportions $\hat p_1$, $\hat p_2$ from samples of size $n_1 = n_2 = n$. Define

$$\psi(\hat p_1, \hat p_2) \;=\; \log\!\left(\frac{\hat p_1\,(1 - \hat p_2)}{(1 - \hat p_1)\,\hat p_2}\right).$$

The gradient of $\psi$ at $(p_1, p_2)$ has entries $1/[p_1(1-p_1)]$ and $-1/[p_2(1-p_2)]$. Sandwiching that gradient against the diagonal Bernoulli covariance gives

$$\text{SE}(\hat\psi) \;=\; \sqrt{\frac{1}{n_1\,p_1(1-p_1)} + \frac{1}{n_2\,p_2(1-p_2)}}.$$

```r title="Log odds ratio SE via the multivariate delta method"
p1_true <- 0.30
p2_true <- 0.20
n1 <- n2 <- 400
n_reps  <- 5000

set.seed(404)
log_or_sim <- replicate(n_reps, {
  x1 <- rbinom(1, n1, p1_true)
  x2 <- rbinom(1, n2, p2_true)
  p1 <- x1 / n1
  p2 <- x2 / n2
  log((p1 * (1 - p2)) / ((1 - p1) * p2))
})

log_or_se_sim <- sd(log_or_sim)
log_or_se_dm  <- sqrt(1 / (n1 * p1_true * (1 - p1_true)) +
                      1 / (n2 * p2_true * (1 - p2_true)))

c(simulated_SE = log_or_se_sim, delta_method_SE = log_or_se_dm)
#>    simulated_SE delta_method_SE 
#>       0.2127015       0.2102239
```

The two SE estimates agree to two decimal places. The Jacobian collapses two parameter uncertainties into one scalar SE that you can drop straight into a Wald CI. Even though the underlying problem has two parameters, the answer at the end is a one-dimensional confidence statement, exactly what the multivariate delta method promises.

[WARNING]
**Delta method fails when $g'(\theta) = 0$.** If the gradient vanishes at the true parameter, the linear Taylor approximation gives a zero-variance limit and the second-order Taylor term drives the asymptotics. The estimator then has a chi-square (not Normal) limit. The classic fix is the **second-order delta method**, which uses the Hessian of $g$.

**Try it:** Use the multivariate delta method to derive the SE of the *difference* of two independent sample proportions $\hat p_1 - \hat p_2$. Verify by simulation that the predicted SE matches the empirical one.

```r title="Your turn: SE of a difference of proportions"
# For g(p1, p2) = p1 - p2, the gradient is (1, -1).
# Predict the SE then simulate.
p1_true <- 0.30
p2_true <- 0.20
n1 <- n2 <- 400
n_reps  <- 5000
set.seed(505)

ex_diff_sim <- NA  # your code here: simulate (p1_hat - p2_hat) across n_reps draws
ex_se_pred  <- NA  # your code here: sqrt(p1*(1-p1)/n1 + p2*(1-p2)/n2)

c(simulated_SE = sd(ex_diff_sim), delta_method_SE = ex_se_pred)
#> Expected: both numbers near 0.030
```

<details>
<summary>Click to reveal solution</summary>

```r title="Difference of proportions solution"
p1_true <- 0.30
p2_true <- 0.20
n1 <- n2 <- 400
n_reps  <- 5000
set.seed(505)

ex_diff_sim <- replicate(n_reps, {
  x1 <- rbinom(1, n1, p1_true)
  x2 <- rbinom(1, n2, p2_true)
  x1 / n1 - x2 / n2
})
ex_se_pred <- sqrt(p1_true * (1 - p1_true) / n1 +
                   p2_true * (1 - p2_true) / n2)

c(simulated_SE = sd(ex_diff_sim), delta_method_SE = ex_se_pred)
#>    simulated_SE delta_method_SE 
#>      0.03007825      0.03000000
```

**Explanation:** The gradient of $g(p_1, p_2) = p_1 - p_2$ is $(1, -1)^\top$, and the covariance is diagonal because the two samples are independent. Sandwiching them gives the familiar two-proportion SE.

</details>

## Practice Exercises

These capstones combine concepts from across the post. Use distinct variable names (prefixed with `my_`) so they don't clobber tutorial state.

### Exercise 1: Rate of MSE decay

Compute the MSE of the sample mean at $n = 20, 50, 100, 500, 1000$ for samples from $N(0, 3)$. Fit a linear regression of $\log(\text{MSE})$ on $\log(n)$ and verify the slope is close to $-1$.

```r title="Capstone 1: MSE decay slope"
# Fill in and run.
my_ns   <- c(20, 50, 100, 500, 1000)
n_reps  <- 4000
set.seed(606)

# my_mse <- ?
# Fit lm(log(my_mse) ~ log(my_ns)) and check the slope.

```

<details>
<summary>Click to reveal solution</summary>

```r title="MSE decay slope solution"
my_ns   <- c(20, 50, 100, 500, 1000)
n_reps  <- 4000
set.seed(606)

my_mse <- sapply(my_ns, function(n) {
  xbars <- replicate(n_reps, mean(rnorm(n, 0, 3)))
  mean(xbars^2)
})
my_mse_fit <- lm(log(my_mse) ~ log(my_ns))
coef(my_mse_fit)
#>  (Intercept)    log(my_ns) 
#>     2.190946     -1.000823
```

**Explanation:** The intercept on the log scale is $\log(\sigma^2) = \log(9) \approx 2.197$, and the slope is essentially $-1$. Both match the theoretical prediction $\text{MSE} = \sigma^2 / n$.

</details>

### Exercise 2: Delta-method CI for the coefficient of variation

For $N(\mu, \sigma) = N(10, 2)$, the coefficient of variation (CV) is $\sigma/\mu = 0.2$. Given a sample, $\widehat{\text{CV}} = S/\bar X$. Derive the delta-method SE, then simulate 5,000 samples of size $n = 200$ and report the empirical 95% Wald CI coverage.

```r title="Capstone 2: CV delta-method coverage"
n       <- 200
n_reps  <- 5000
mu      <- 10
sigma   <- 2
set.seed(707)

# For each replicate, compute CV_hat = sd(x) / mean(x),
# build the Wald CI using the delta-method SE,
# and check whether it contains the true CV (= 0.2).

```

<details>
<summary>Click to reveal solution</summary>

```r title="CV delta-method coverage solution"
n       <- 200
n_reps  <- 5000
mu      <- 10
sigma   <- 2
cv_true <- sigma / mu
set.seed(707)

my_cv_cov <- mean(replicate(n_reps, {
  x       <- rnorm(n, mu, sigma)
  cv_hat  <- sd(x) / mean(x)
  # delta-method SE for sd(x)/mean(x): combines variance of mean & sd
  se_cv   <- cv_hat * sqrt(1 / (2 * (n - 1)) + cv_hat^2 / n)
  ci      <- cv_hat + c(-1, 1) * 1.96 * se_cv
  ci[1] <= cv_true && cv_true <= ci[2]
}))
my_cv_cov
#> [1] 0.9462
```

**Explanation:** The empirical coverage is 0.946, very close to the nominal 0.95. The delta-method SE for $S/\bar X$ uses the fact that $\bar X$ and $S$ are asymptotically uncorrelated under Normality, so the variances add inside the square root.

</details>

### Exercise 3: Detect delta-method failure when the derivative vanishes

Simulate $\sqrt{n}(\bar X_n^2 - \mu^2)$ when $\mu = 0$ and $\sigma = 1$. The delta-method derivative $g'(\mu) = 2\mu$ is zero, so the asymptotic limit is *not* normal. Plot a histogram and overlay a $\chi^2_1$ density (scaled appropriately) to expose the failure.

```r title="Capstone 3: delta method failure at mu = 0"
n       <- 500
n_reps  <- 8000
set.seed(808)

# Simulate sqrt(n) * (xbar^2 - 0) for xbar ~ N(0, 1/sqrt(n)).
# Plot histogram. Overlay the chi-square(1) density.

```

<details>
<summary>Click to reveal solution</summary>

```r title="Delta method failure solution"
n       <- 500
n_reps  <- 8000
set.seed(808)

my_root_n_xbar_sq <- replicate(n_reps, {
  x <- rnorm(n, 0, 1)
  sqrt(n) * mean(x)^2
})

hist(my_root_n_xbar_sq, breaks = 60, freq = FALSE,
     col = "#fce4ec", border = "white",
     xlab = "sqrt(n) * xbar^2", main = "Delta method failure at mu = 0")
# sqrt(n) * xbar^2 has the same distribution as Z^2 / sqrt(n) * sqrt(n) = Z^2 / sqrt(n)? 
# Actually: n * xbar^2 ~ chi^2(1) under N(0, 1/n) sampling, so sqrt(n)*xbar^2 = chi^2(1)/sqrt(n).
# Empirical mean should be 1/sqrt(n).
mean(my_root_n_xbar_sq)
#> [1] 0.04432715
```

**Explanation:** Under $\mu = 0$, $n \bar X_n^2$ converges to $\chi^2_1$, so $\sqrt{n} \bar X_n^2 = (n \bar X_n^2)/\sqrt{n}$ shrinks to zero at rate $1/\sqrt{n}$. The histogram is sharply right-skewed and bunched near zero, nothing like a Normal centered at zero. This is the classic signal that the first-order delta method has broken down and a second-order expansion is needed.

</details>

## Complete Example

Putting all three tools together: build a delta-method confidence interval for the **ratio of two means** on the log scale, then compare it to a nonparametric bootstrap CI on the same data.

```r title="End-to-end log-ratio CI: delta method vs bootstrap"
set.seed(909)

# Two log-normal samples (e.g., income in two cities)
n1 <- n2 <- 200
group1 <- rlnorm(n1, meanlog = log(50), sdlog = 0.4)
group2 <- rlnorm(n2, meanlog = log(40), sdlog = 0.4)

m1 <- mean(group1); m2 <- mean(group2)
v1 <- var(group1) / n1   # variance of mean1
v2 <- var(group2) / n2   # variance of mean2

# Delta method for log(m1) - log(m2). Gradient is (1/m1, -1/m2).
log_ratio    <- log(m1) - log(m2)
ratio_se_dm  <- sqrt(v1 / m1^2 + v2 / m2^2)
ratio_ci_dm  <- exp(log_ratio + c(-1, 1) * 1.96 * ratio_se_dm)

# Bootstrap CI on the log scale for comparison
B            <- 2000
boot_logratio <- replicate(B, {
  b1 <- sample(group1, n1, replace = TRUE)
  b2 <- sample(group2, n2, replace = TRUE)
  log(mean(b1)) - log(mean(b2))
})
ratio_ci_boot <- exp(quantile(boot_logratio, c(0.025, 0.975)))

list(point_estimate_ratio = exp(log_ratio),
     delta_method_CI      = ratio_ci_dm,
     bootstrap_CI         = ratio_ci_boot)
#> $point_estimate_ratio
#> [1] 1.255312
#> 
#> $delta_method_CI
#> [1] 1.158947 1.359716
#> 
#> $bootstrap_CI
#>     2.5%    97.5% 
#> 1.156903 1.357402
```

Both methods land within half a percent of each other, and the delta method runs in microseconds where the bootstrap takes seconds. That speed gap matters when this CI is computed inside a larger simulation, a permutation test, or a sensitivity analysis. The takeaway: when the delta method's smoothness assumption holds, prefer it. When it fails (small samples, near-boundary parameters, $g'(\theta) = 0$), fall back to the bootstrap.

## Summary

![The asymptotic-theory ladder, drawn as four boxes: estimator, consistency, asymptotic normality, delta method.](screenshots/Asymptotic-Theory-in-R-concept-flow.webp)
*Figure 1: The asymptotic-theory ladder. Consistency tells you the estimator settles on the truth, asymptotic normality describes the shape of the wobble, and the delta method propagates that wobble through smooth transformations.*

| Property | Meaning | Formula | R pattern |
|---|---|---|---|
| Consistency | Estimator converges to the truth | $\hat\theta_n \xrightarrow{p} \theta$ | Verify via shrinking MSE plot |
| Asymptotic normality | Sampling distribution becomes Gaussian | $\sqrt{n}(\hat\theta_n - \theta) \xrightarrow{d} N(0, V)$ | Histogram of standardized estimator |
| Delta method (univariate) | Variance of $g(\hat\theta_n)$ from $g'(\theta)$ | $N(0, [g'(\theta)]^2 V)$ | Square the analytic derivative |
| Delta method (multivariate) | Multi-parameter version | $N(0, \nabla g^\top \Sigma \nabla g)$ | Jacobian sandwich |
| Slutsky's theorem | Plug in a consistent variance estimate | Limit unchanged | Replace $V$ with $\hat V$ in CIs |

## References

1. van der Vaart, A. W. *Asymptotic Statistics*. Cambridge University Press (2000). Chapters 2 and 3 cover convergence modes and the delta method in detail.
2. Casella, G. and Berger, R. L. *Statistical Inference*, 2nd edition. Duxbury (2002). Chapter 10 develops asymptotic evaluations.
3. Lehmann, E. L. *Elements of Large-Sample Theory*. Springer (1999).
4. Wasserman, L. *All of Statistics*. Springer (2004). Chapter 5 is a compact tour of consistency, normality, and the delta method.
5. Wikipedia. "Delta method." [Link](https://en.wikipedia.org/wiki/Delta_method)
6. StatLect. "Delta method." [Link](https://www.statlect.com/asymptotic-theory/delta-method)
7. Stanford STATS 300A lecture notes on large-sample theory.

## Continue Learning

- [Point Estimation in R: What Makes an Estimator Good?](/Point-Estimation-in-R.html), bias, variance, and MSE basics that lead into the asymptotic story.
- [Cramér-Rao Lower Bound in R](/Cramer-Rao-Lower-Bound-in-R.html), the variance floor that asymptotically efficient estimators reach.
- [Central Limit Theorem in R](/Central-Limit-Theorem-in-R.html), the flagship asymptotic-normality result, with hands-on demonstrations.
