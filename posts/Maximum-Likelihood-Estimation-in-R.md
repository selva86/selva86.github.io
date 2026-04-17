---
title: "Maximum Likelihood Estimation in R: Build Genuine Intuition, Then Fit Real Models"
slug: Maximum-Likelihood-Estimation-in-R
description: "MLE picks parameters that make your data most probable. Build geometric intuition, then fit normal, Poisson, and custom models in R with optim() and mle()."
keywords: "maximum likelihood estimation R, MLE in R, optim() R, mle() stats4, log-likelihood R, fit distribution R, parameter estimation R, Poisson MLE R, normal MLE R, negative log-likelihood R"
auto_link_terms: "Maximum Likelihood Estimation|MLE in R|negative log-likelihood|log-likelihood function|likelihood function|mle() function|stats4 mle"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-17
curriculum_id: "2.2.2"
post_type: C
sidebar_section: Statistics
sidebar_title: Maximum Likelihood Estimation
sidebar_order: 25
difficulty: Intermediate
---

# Maximum Likelihood Estimation in R: Build Genuine Intuition, Then Fit Real Models

<p class="lead">Maximum likelihood estimation (MLE) picks the parameter values that make your observed data most probable under an assumed distribution. In R, you write a log-likelihood function, then let <code>optim()</code> or <code>stats4::mle()</code> search the parameter space for the best fit.</p>

## What does maximum likelihood actually mean?

Suppose you have 200 exam scores and you believe they come from a normal distribution, but you don't know the mean or standard deviation. MLE asks a simple question: of all possible (μ, σ) pairs, which one makes this exact dataset the most probable outcome? The answer is the MLE. Below, we simulate data from a known normal and recover the parameters with `optim()` — so you can see the recipe produce the right answer.

The function below computes the negative log-likelihood of the normal distribution given a candidate parameter vector. `optim()` then searches for the vector that minimizes it. Because minimizing the negative is the same as maximizing the positive, the result is the MLE.

```r
library(stats4)
library(ggplot2)

set.seed(2026)
norm_data <- rnorm(200, mean = 65, sd = 12)

neg_ll_norm <- function(params) {
  mu    <- params[1]
  sigma <- params[2]
  -sum(dnorm(norm_data, mean = mu, sd = sigma, log = TRUE))
}

fit_norm <- optim(par = c(mu = 50, sigma = 5), fn = neg_ll_norm)
fit_norm$par
#>        mu     sigma
#> 65.147823 11.803341
```

The optimizer started at (50, 5) — far from the truth — and climbed the likelihood surface until it landed at (65.15, 11.80). That is extremely close to the true (65, 12) used to generate the data. The leftover gap is sampling noise, not a flaw in the method. Increase `n` to 10,000 and the estimates will crawl even closer.

Now let's sanity-check. For a normal distribution, the MLE has a closed-form solution: the sample mean for μ and the sample standard deviation (with division by n, not n−1) for σ. The optimizer should match that closed form.

```r
c(mean_est = mean(norm_data),
  sd_mle   = sqrt(mean((norm_data - mean(norm_data))^2)))
#> mean_est   sd_mle
#> 65.14787 11.80334
```

The numbers match `fit_norm$par` to four decimals. That's not a coincidence — it's a proof that the MLE recipe, when applied to the normal, recovers exactly the formula you already knew. The optimizer reached the same point that calculus gives you on paper, but it works even when calculus doesn't.

[KEY INSIGHT]
**Likelihood is not the probability of parameters — it is the probability of data, viewed as a function of parameters.** We hold the observed data fixed and ask "which θ would have generated this with highest probability?" That's a subtle but critical flip in perspective compared to Bayesian thinking.

**Try it:** Fit a normal distribution to R's built-in `precip` dataset (annual rainfall for 70 US cities) using `optim()`. Report the estimated mean and sd.

```r
# Try it: fit a normal to precip
ex_neg_ll <- function(params) {
  # your code here
}

ex_fit <- optim(par = c(30, 10), fn = ex_neg_ll)
ex_fit$par
#> Expected: roughly (34.9, 13.6)
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_neg_ll <- function(params) {
  -sum(dnorm(precip, mean = params[1], sd = params[2], log = TRUE))
}
ex_fit <- optim(par = c(30, 10), fn = ex_neg_ll)
ex_fit$par
#> [1] 34.88567 13.61770
```

**Explanation:** The recipe is identical to the simulated-data case — swap `norm_data` for `precip`. The estimated mean matches `mean(precip)` and the estimated sd matches the population-formula sd.

</details>

## Why do we maximize the log instead of the raw likelihood?

The likelihood of a sample is the product of each point's density:

$$L(\theta \mid x) = \prod_{i=1}^{n} f(x_i \mid \theta)$$

With even a few hundred observations, that product becomes astronomically small — often smaller than the smallest number your computer can represent. The fix is to maximize the sum of log densities instead, which is mathematically equivalent (log is monotonic) but numerically stable:

$$\ell(\theta \mid x) = \sum_{i=1}^{n} \log f(x_i \mid \theta)$$

Let's see the underflow in action on our existing `norm_data`. We'll compute the raw product of densities and then the sum of log densities, at the true parameters.

```r
raw_likelihood  <- prod(dnorm(norm_data, mean = 65, sd = 12))
log_likelihood  <- sum(dnorm(norm_data, mean = 65, sd = 12, log = TRUE))
c(raw = raw_likelihood, log_lik = log_likelihood)
#>           raw       log_lik
#>  0.000000e+00 -7.858133e+02
```

The raw product underflowed to exactly zero. Every numeric optimizer you try will be stuck — it cannot tell a "good" θ from a "bad" θ when both give zero. The log-likelihood, by contrast, is a finite `-785.8` and changes smoothly as parameters move, which is exactly what an optimizer needs.

Because optimizers like `optim()` minimize by default, we always write the *negative* log-likelihood and minimize it. To visualize what the optimizer is climbing, let's compute the log-likelihood on a grid of μ values (holding σ fixed at its estimate) and plot the curve.

```r
mu_grid <- seq(60, 70, length.out = 200)
ll_vals <- sapply(mu_grid, function(m)
  sum(dnorm(norm_data, mean = m, sd = 11.80, log = TRUE)))

ggplot(data.frame(mu = mu_grid, ll = ll_vals), aes(mu, ll)) +
  geom_line(linewidth = 1) +
  geom_vline(xintercept = 65.15, linetype = "dashed", color = "steelblue") +
  labs(x = "mu", y = "log-likelihood",
       title = "Log-likelihood peaks at the MLE")
#> (plot: smooth concave curve peaking near mu = 65.15)
```

The curve is smoothly concave, peaking at the MLE. The dashed vertical line marks where `optim()` landed. That smoothness is the whole reason MLE works in practice — an optimizer needs a gradient to follow, and log-likelihoods almost always deliver one.

[TIP]
**Always minimize the negative log-likelihood, not the raw likelihood.** `optim()` and `nlm()` are minimizers; `dnorm()`, `dpois()`, `dgamma()`, and all `dxxx()` functions accept `log = TRUE` which gives you the log density without manually wrapping in `log()`.

**Try it:** Evaluate the log-likelihood of the normal at μ=65, σ=12 for `norm_data`. Confirm it equals roughly `-785.8`.

```r
# Try it: evaluate log-likelihood
ex_ll <- # your code here

ex_ll
#> Expected: about -785.81
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_ll <- sum(dnorm(norm_data, mean = 65, sd = 12, log = TRUE))
ex_ll
#> [1] -785.8133
```

**Explanation:** `sum(dnorm(..., log = TRUE))` is the canonical way to compute a log-likelihood in R for any continuous distribution.

</details>

## How do you fit any distribution with optim()?

The power of the MLE recipe is that it generalizes. Only the density function changes. Let's simulate Poisson count data (the number of emails per hour, say, with true rate λ = 4.3) and fit λ with `optim()`.

```r
set.seed(11)
pois_data <- rpois(500, lambda = 4.3)

neg_ll_pois <- function(lambda) {
  -sum(dpois(pois_data, lambda = lambda, log = TRUE))
}

fit_pois <- optim(par = 1, fn = neg_ll_pois,
                  method = "L-BFGS-B", lower = 1e-6)
fit_pois$par
#> [1] 4.316
```

We switched to `L-BFGS-B` because λ must stay positive — that method lets you declare `lower = 1e-6` so the optimizer never wanders into negative territory. Starting from λ = 1, `optim()` climbed to λ = 4.316. The true value was 4.3, and the Poisson's analytical MLE is the sample mean, so let's confirm.

```r
mean(pois_data)
#> [1] 4.316
```

Identical to three decimals. Every distribution with a `dxxx()` in R can be fit this way: exponential (`dexp`), gamma (`dgamma`), beta (`dbeta`), Weibull (`dweibull`), lognormal (`dlnorm`). The only thing that changes is which density you plug in.

[WARNING]
**Constrained parameters need bounded optimization.** A rate must be positive; a probability must be in [0, 1]. The unbounded default `method = "Nelder-Mead"` happily walks into invalid regions and returns `NaN`. Use `method = "L-BFGS-B"` with explicit `lower` (and `upper`) bounds when parameters have natural limits.

**Try it:** Simulate `rexp(500, rate = 2)` and recover the rate with `optim()`. The analytical MLE is `1 / mean(x)`.

```r
# Try it: exponential MLE
set.seed(3)
ex_exp_data <- rexp(500, rate = 2)

ex_neg_ll_exp <- function(rate) {
  # your code here
}

ex_fit_exp <- optim(par = 1, fn = ex_neg_ll_exp,
                    method = "L-BFGS-B", lower = 1e-6)
ex_fit_exp$par
#> Expected: about 2.0
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_neg_ll_exp <- function(rate) {
  -sum(dexp(ex_exp_data, rate = rate, log = TRUE))
}
ex_fit_exp <- optim(par = 1, fn = ex_neg_ll_exp,
                    method = "L-BFGS-B", lower = 1e-6)
ex_fit_exp$par
#> [1] 2.023
```

**Explanation:** Swap `dpois()` for `dexp()`. The closed form `1 / mean(ex_exp_data)` gives an identical answer.

</details>

## What does stats4::mle() give you that optim() doesn't?

`optim()` returns point estimates and stops. In practice you also need standard errors, z-statistics, p-values, and confidence intervals. `stats4::mle()` wraps `optim()` and computes all of that for you by inverting the Hessian at the MLE.

![optim() vs mle() comparison](screenshots/Maximum-Likelihood-Estimation-in-R-optim-vs-mle.webp)

*Figure 1: `optim()` returns estimates; `stats4::mle()` additionally gives SEs, p-values, and confidence intervals.*

Here's the same Poisson fit from the previous section, now routed through `mle()`. Note the named-argument convention: the first function argument is the parameter being estimated, and `start` is a named list.

```r
neg_ll_pois_named <- function(lambda = 1) {
  -sum(dpois(pois_data, lambda = lambda, log = TRUE))
}

fit_pois_mle <- mle(neg_ll_pois_named,
                    start = list(lambda = 1),
                    method = "L-BFGS-B",
                    lower = list(lambda = 1e-6))

summary(fit_pois_mle)
#> Maximum likelihood estimation
#>
#> Call: mle(minuslogl = neg_ll_pois_named, start = list(lambda = 1), ...)
#>
#> Coefficients:
#>         Estimate Std. Error
#> lambda 4.315997  0.0929084
#>
#> -2 log L: 2156.437
```

`summary()` shows the estimate plus its standard error — the typical spread of the estimator under resampling. For a 95% profile-likelihood confidence interval (usually more accurate than the Wald SE interval), call `confint()`:

```r
confint(fit_pois_mle)
#>    2.5 %   97.5 %
#> 4.135868 4.500024
```

The true λ = 4.3 lies comfortably inside [4.14, 4.50]. You did not have to compute the Hessian, invert it, or take square roots — `mle()` did it all.

If you prefer to stay with `optim()`, you can recover the same SE manually by asking for the Hessian and inverting it. The Hessian of the *negative* log-likelihood is the observed Fisher information, and its inverse is the estimator's covariance matrix.

```r
fit_pois_h <- optim(par = 1, fn = neg_ll_pois,
                    method = "L-BFGS-B", lower = 1e-6,
                    hessian = TRUE)
se_lambda <- sqrt(diag(solve(fit_pois_h$hessian)))
c(estimate = fit_pois_h$par, se = se_lambda)
#> estimate       se
#> 4.316000 0.092908
```

Same SE as `mle()` returned. Use whichever interface you prefer — `mle()` is cleaner for reports, `optim() + hessian` is more flexible when your likelihood doesn't fit into `mle()`'s argument convention.

[NOTE]
**mle() requires named function arguments with defaults that match the start list.** Writing `function(params)` and indexing `params[1]` — which is fine for `optim()` — will fail with `mle()`. Either refactor to `function(lambda = 1)` or stick with `optim(..., hessian = TRUE)`.

**Try it:** Using `fit_pois_mle`, call `confint(fit_pois_mle, level = 0.90)` for a 90% interval. Explain in one sentence why it is narrower than the 95% interval.

```r
# Try it: 90% CI
ex_ci <- # your code here

ex_ci
#> Expected: a narrower (higher 2.5%, lower 97.5%) interval
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_ci <- confint(fit_pois_mle, level = 0.90)
ex_ci
#>       5 %      95 %
#>  4.164721 4.470310
```

**Explanation:** A 90% CI requires less certainty than 95%, so we shave probability from both tails — the interval contracts.

</details>

## How do you write a custom likelihood function?

When no built-in density quite matches your model — Weibull for failure times, a mixture for bimodal data, a truncated distribution — you write the likelihood yourself. As long as you can evaluate the density (or probability mass) of each observation, MLE works.

Let's fit a Weibull to simulated failure times. The Weibull has two parameters, `shape` and `scale`, both positive. We will overlay the fitted density on a histogram to visually confirm the fit.

```r
set.seed(7)
wb_data <- rweibull(500, shape = 1.8, scale = 100)

neg_ll_wb <- function(params) {
  shape <- params[1]
  scale <- params[2]
  -sum(dweibull(wb_data, shape = shape, scale = scale, log = TRUE))
}

fit_wb <- optim(par = c(1, 50), fn = neg_ll_wb,
                method = "L-BFGS-B", lower = c(1e-6, 1e-6))
fit_wb$par
#> [1]   1.8206 100.7739
```

The estimates are right on top of the true (1.8, 100). Now let's plot the fitted density (black curve) against the histogram of the data (gray bars) to confirm the visual fit.

```r
x_grid <- seq(0, max(wb_data), length.out = 200)
fit_df <- data.frame(x = x_grid,
                     d = dweibull(x_grid,
                                  shape = fit_wb$par[1],
                                  scale = fit_wb$par[2]))

ggplot() +
  geom_histogram(aes(x = wb_data, y = after_stat(density)),
                 bins = 30, fill = "gray80", color = "white") +
  geom_line(data = fit_df, aes(x, d), linewidth = 1) +
  labs(x = "time to failure", y = "density",
       title = "Weibull MLE fit over simulated failure times")
#> (plot: histogram overlaid with the fitted Weibull density curve)
```

The fitted curve hugs the histogram's shape — unimodal, right-skewed, tapering to zero past 250. That visual agreement is a practical model-check: if the curve misses the data's shape, your distributional assumption is wrong, no matter how well the numerical fit converged.

[KEY INSIGHT]
**Any probabilistic model you can evaluate is MLE-ready.** The recipe — write the (negative) sum of log densities, pass it to `optim()` or `mle()` — does not care whether the model is a standard distribution, a mixture, a regression, or a bespoke density you invented for your domain.

**Try it:** Re-fit `wb_data` as if it were Gamma-distributed (using `dgamma` with `shape` and `rate`). Inspect the resulting fit.

```r
# Try it: try a Gamma instead
ex_neg_ll_gamma <- function(params) {
  # your code here
}

ex_fit_gamma <- optim(par = c(1, 0.01), fn = ex_neg_ll_gamma,
                      method = "L-BFGS-B", lower = c(1e-6, 1e-6))
ex_fit_gamma$par
#> Expected: something like (2.6, 0.029) — not the truth, but optim converges
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_neg_ll_gamma <- function(params) {
  -sum(dgamma(wb_data, shape = params[1], rate = params[2], log = TRUE))
}
ex_fit_gamma <- optim(par = c(1, 0.01), fn = ex_neg_ll_gamma,
                      method = "L-BFGS-B", lower = c(1e-6, 1e-6))
ex_fit_gamma$par
#> [1] 2.60108 0.02944
```

**Explanation:** MLE always returns *something* — even when the distributional assumption is wrong. That's why visual fit checks (histogram overlay) matter: they flag misspecification that the likelihood number alone can't.

</details>

## Practice Exercises

### Exercise 1: Fit a negative binomial to overdispersed counts

Simulate 500 negative-binomial counts with `rnbinom(500, size = 3, mu = 8)`, write the negative log-likelihood using `dnbinom(..., log = TRUE)`, and recover both `size` and `mu` with `optim()`. Use `L-BFGS-B` and keep both parameters strictly positive. Save the result to `my_nb_fit`.

```r
# Exercise: negative binomial MLE
# Hint: dnbinom(x, size = s, mu = m, log = TRUE)

set.seed(42)
my_counts <- rnbinom(500, size = 3, mu = 8)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_neg_ll <- function(params) {
  size <- params[1]
  mu   <- params[2]
  -sum(dnbinom(my_counts, size = size, mu = mu, log = TRUE))
}

my_nb_fit <- optim(par = c(1, 1), fn = my_neg_ll,
                   method = "L-BFGS-B", lower = c(1e-6, 1e-6))
my_nb_fit$par
#> [1] 3.0814 8.0460
```

**Explanation:** The recipe is identical — swap in `dnbinom()`. The negative binomial has two parameters, so `par` is a length-2 vector and `lower` has two entries.

</details>

### Exercise 2: Estimate a 2-component normal mixture

Simulate bimodal data and fit a mixture of two normals by hand. The mixture density is `w * dnorm(x, mu1, s1) + (1 - w) * dnorm(x, mu2, s2)` with mixing weight `w` in (0, 1). Write the negative log-likelihood for this density and estimate (w, mu1, s1, mu2, s2) with `optim()`. Save to `my_mix_fit`.

```r
# Exercise: 2-component normal mixture MLE
# Hint: log(w * dnorm(...) + (1 - w) * dnorm(...)) — use log() outside,
# since there's no shortcut for log-density of a mixture.

set.seed(101)
my_mix <- c(rnorm(300, mean = -2, sd = 1),
            rnorm(200, mean =  3, sd = 1.5))

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_neg_ll_mix <- function(params) {
  w   <- params[1]
  mu1 <- params[2]; s1 <- params[3]
  mu2 <- params[4]; s2 <- params[5]
  dens <- w * dnorm(my_mix, mu1, s1) + (1 - w) * dnorm(my_mix, mu2, s2)
  -sum(log(dens))
}

my_mix_fit <- optim(par = c(0.5, -1, 1, 1, 1), fn = my_neg_ll_mix,
                    method = "L-BFGS-B",
                    lower = c(0.01, -10, 1e-3, -10, 1e-3),
                    upper = c(0.99,  10,   10,  10,   10))
my_mix_fit$par
#> [1]  0.604 -2.014  0.991  2.988  1.443
```

**Explanation:** The mixture density is a weighted sum, so you cannot use `log = TRUE` inside the individual `dnorm()` calls — take the log of the whole sum instead. The weight `w` needed explicit [0.01, 0.99] bounds; the means got wide bounds; the sds stayed strictly positive. The recovered estimates are close to the true (0.6, -2, 1, 3, 1.5).

</details>

## Complete Example: MLE for insurance claim severity

A common actuarial task is modeling claim sizes as a Gamma distribution. We will simulate claim data, fit a Gamma via `stats4::mle()`, inspect standard errors and profile-likelihood confidence intervals, and finally overlay the fitted density on the data to check the fit visually.

```r
set.seed(2024)
claims <- rgamma(1000, shape = 2.5, scale = 1500)
summary(claims)
#>    Min. 1st Qu.  Median    Mean 3rd Qu.    Max.
#>    35.7  1744.4  3276.4  3754.0  5231.7 17935.5
```

The data spans roughly 0 to 18,000 with a median around 3,300 — right-skewed, as claims typically are. Now the Gamma MLE. Gamma has two positive parameters, and `dgamma()` takes `shape` and `rate` (rate = 1 / scale), so we fit on the rate parameterization.

```r
neg_ll_gamma <- function(shape = 1, rate = 0.001) {
  -sum(dgamma(claims, shape = shape, rate = rate, log = TRUE))
}

fit_claims <- mle(neg_ll_gamma,
                  start = list(shape = 1, rate = 0.001),
                  method = "L-BFGS-B",
                  lower = list(shape = 1e-6, rate = 1e-9))

summary(fit_claims)
#> Coefficients:
#>          Estimate  Std. Error
#> shape  2.4916404  0.10415282
#> rate   0.0006637  0.00003072
#>
#> -2 log L: 17489.72
```

The true parameters were shape = 2.5 and rate = 1/1500 ≈ 0.000667 — both are recovered within one standard error. Profile-likelihood CIs for both:

```r
confint(fit_claims)
#>            2.5 %       97.5 %
#> shape 2.2934416 2.7008070
#> rate  0.0006050 0.0007262
```

Both intervals comfortably contain the truth. Finally, overlay the fitted Gamma density on the histogram as a model-check.

```r
est   <- coef(fit_claims)
grid  <- seq(0, max(claims), length.out = 200)
curve <- data.frame(x = grid,
                    d = dgamma(grid, shape = est["shape"], rate = est["rate"]))

ggplot() +
  geom_histogram(aes(x = claims, y = after_stat(density)),
                 bins = 40, fill = "gray80", color = "white") +
  geom_line(data = curve, aes(x, d), linewidth = 1) +
  labs(x = "claim amount", y = "density",
       title = "Gamma MLE over simulated insurance claims")
#> (plot: right-skewed histogram with a fitted Gamma curve tracing its peak)
```

The curve follows the histogram's peak near 2,000 and tails off gradually past 10,000 — the defining behavior of a Gamma. If your real claim data deviated (heavy extreme tails, extra bump at zero), the curve would miss those features and you'd reach for a heavier-tailed or zero-inflated alternative.

## Summary

![The four-step MLE recipe](screenshots/Maximum-Likelihood-Estimation-in-R-workflow.webp)

*Figure 2: The four-step MLE recipe used throughout this tutorial.*

- MLE picks the parameters that make your observed data most probable under an assumed distribution.
- Always work with the negative log-likelihood; `optim()` minimizes it by default and avoids numerical underflow.
- Use `dxxx(..., log = TRUE)` instead of `log(dxxx(...))` — it's faster and more stable.
- `stats4::mle()` wraps `optim()` and gives you `summary()` (SEs, p-values) and `confint()` (profile CIs) for free.
- For constrained parameters (positive rate, positive scale, probability in [0,1]), switch to `method = "L-BFGS-B"` and set `lower` / `upper`.
- Any density you can write in R is MLE-ready — mixtures, truncated distributions, bespoke regression likelihoods all follow the same recipe.

## References

1. Myung, I. J. (2003). *Tutorial on maximum likelihood estimation*. Journal of Mathematical Psychology, 47(1), 90-100. [Link](https://doi.org/10.1016/S0022-2496\(02\)00028-7)
2. R Core Team — `stats4::mle()` reference. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats4/html/mle.html)
3. R Core Team — `optim()` reference. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/optim.html)
4. Wasserman, L. (2004). *All of Statistics*. Springer. Chapter 9: Parametric Inference.
5. Pawitan, Y. (2001). *In All Likelihood: Statistical Modelling and Inference Using Likelihood*. Oxford University Press.
6. Venables, W. N. & Ripley, B. D. (2002). *Modern Applied Statistics with S*, 4th ed. Springer. Chapter 16: Optimization and Maximum Likelihood Estimation.
7. Bolker, B. (2008). *Ecological Models and Data in R*. Princeton University Press. Chapter 6: Likelihood and all that. [Link](https://ms.mcmaster.ca/~bolker/emdbook/)
8. Nash, J. C. (2014). *Nonlinear Parameter Optimization Using R Tools*. Wiley. Chapter on likelihood-based optimization.

## Continue Learning

- [Linear Regression](/Linear-Regression.html) — how MLE under normal errors reduces to ordinary least squares.
- [Logistic Regression With R](/Logistic-Regression-With-R.html) — MLE applied to binary outcomes via the Bernoulli log-likelihood.
- [Generalized Linear Models](/Generalized-Linear-Models-GLM-in-R.html) — the GLM framework that wraps MLE for a broad family of exponential-family distributions.
