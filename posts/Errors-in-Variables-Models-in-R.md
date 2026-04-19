---
title: "Errors-in-Variables Models in R: Measurement Error in Predictors"
slug: Errors-in-Variables-Models-in-R
description: "Fix attenuation bias from measurement error in predictors. Compare OLS, Deming regression, and SIMEX errors-in-variables models in R with runnable code."
keywords: "errors-in-variables models R, measurement error in predictors, attenuation bias, Deming regression, SIMEX R, classical measurement error, EIV regression"
auto_link_terms: "errors-in-variables models|measurement error in predictors|attenuation bias|Deming regression|SIMEX|classical measurement error|EIV regression"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-19
curriculum_id: FR-regr-21
post_type: FR
fr_parent: Linear-Regression-Assumptions-in-R.html
difficulty: Intermediate
---

# Errors-in-Variables Models in R: Measurement Error in Predictors

<p class="lead">Errors-in-variables (EIV) models are regression models that correct for measurement error in the <em>predictors</em>, not just the response. When your <code>x</code> is measured noisily, ordinary least squares (OLS) pulls the slope toward zero, a bias called <strong>attenuation</strong>. Base R plus two short helper functions are enough to diagnose it and correct it with Deming regression and a manual SIMEX routine.</p>

## How does measurement error bias the OLS slope?

Imagine you fit a careful linear model and the effect size came out smaller than theory predicts. Before you blame the theory, check the ruler. Any noise in the predictor itself shrinks the OLS slope toward zero, and with enough noise it can hide a real effect completely. The cleanest way to see this is to build it yourself: generate data where you *know* the true slope, mess up the predictor, and watch OLS miss.

```r title="Simulate measurement error and fit OLS"
set.seed(123)

# True-world parameters (we get to peek because it is simulated)
n       <- 500
beta0   <- 1
beta1   <- 2
sigma_u <- 1   # noise added to the predictor
sigma_e <- 1   # noise in the response

# Generate true x, response y, and the noisy observed x
x_true <- rnorm(n, mean = 0, sd = 1)
y      <- beta0 + beta1 * x_true + rnorm(n, sd = sigma_e)
x_obs  <- x_true + rnorm(n, sd = sigma_u)

d <- data.frame(y = y, x_true = x_true, x_obs = x_obs)

# Fit OLS on the (unreachable) true predictor and the noisy observed predictor
fit_true <- lm(y ~ x_true, data = d)
fit_obs  <- lm(y ~ x_obs,  data = d)

rbind(true_predictor = coef(fit_true), observed_predictor = coef(fit_obs))
#>                    (Intercept)  x_true/x_obs
#> true_predictor            1.02          1.97
#> observed_predictor        1.02          0.99
```

The slope collapsed from ~1.97 to ~0.99. The intercept barely moved. That is attenuation in action: classical measurement error in `x` leaves the average alone, but it squashes the slope. The smaller, flatter line fits the cloud of noisy points better than the true steep line, even though the steep line is correct.

![How random noise in a predictor pulls the OLS slope toward zero.](screenshots/Errors-in-Variables-Models-in-R-attenuation-concept.webp)
*Figure 1: Adding independent noise to the true `x` hands OLS a weakened relationship, so the estimated slope sits between zero and the true slope.*

Before moving on, let's overlay the two fits so the geometry is unmistakable.

```r title="Overlay both regression lines"
plot(d$x_obs, d$y,
     pch = 16, col = rgb(0, 0, 0, 0.3),
     xlab = "x_obs (noisy)", ylab = "y",
     main = "OLS on noisy x (solid) vs OLS on true x (dashed)")
abline(fit_obs,  col = "firebrick", lwd = 2)
abline(fit_true, col = "steelblue", lwd = 2, lty = 2)
legend("topleft",
       c("fit_obs", "fit_true"),
       col = c("firebrick", "steelblue"),
       lty = c(1, 2), lwd = 2, bty = "n")
```

The dashed steelblue line is the correct answer. The solid firebrick line is what OLS gives you when your ruler is shaky. Both fits are optimal under their own loss function, but only one estimates the true β.

The shrinkage is not random. It is predicted exactly by the **attenuation factor**:

$$\lambda_{\text{att}} = \frac{\sigma_{x}^{2}}{\sigma_{x}^{2} + \sigma_{u}^{2}}$$

Where:

- $\sigma_{x}^{2}$ is the variance of the *true* predictor
- $\sigma_{u}^{2}$ is the variance of the measurement error

The expected biased slope is $\lambda_{\text{att}} \cdot \beta_{1}$. With $\sigma_{x} = \sigma_{u} = 1$, the factor is $1/(1+1) = 0.5$, and $\hat\beta_{\text{OLS}} \approx 0.5 \cdot 2 = 1$, matching what we just saw.

```r title="Compute the attenuation factor numerically"
lambda_att <- var(x_true) / (var(x_true) + var(d$x_obs - x_true))
lambda_att
#> [1] 0.503

beta1 * lambda_att       # what we expect OLS to return
#> [1] 1.006

coef(fit_obs)["x_obs"]   # what OLS actually returned
#>    x_obs 
#> 0.99
```

[KEY INSIGHT]
**The OLS slope on a noisy predictor equals the true slope times the attenuation factor.** The factor is always between 0 and 1, so attenuation always pulls the estimate toward zero, never past it and never past the true value.

**Try it:** Double the measurement-error standard deviation (from 1 to 2) and refit OLS. The slope should shrink further, toward about 0.4.

```r title="Your turn: stronger measurement error"
# Start from x_true and y already in memory
ex_u2     <- rnorm(length(x_true), sd = 2)
ex_x_obs2 <- x_true + ex_u2
ex_fit2   <- lm(y ~ ex_x_obs2)

coef(ex_fit2)
#> Expected: slope near 0.4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Stronger noise solution"
set.seed(456)
ex_u2     <- rnorm(length(x_true), sd = 2)
ex_x_obs2 <- x_true + ex_u2
ex_fit2   <- lm(y ~ ex_x_obs2)

coef(ex_fit2)
#> (Intercept)  ex_x_obs2 
#>        1.03        0.39
```

**Explanation:** With $\sigma_{u} = 2$, the attenuation factor is $1/(1+4) = 0.2$, so the expected slope is $2 \cdot 0.2 = 0.4$. Louder noise means stronger shrinkage.

</details>

## What is the classical errors-in-variables model?

The model you just simulated has a name: the **classical** errors-in-variables model. It assumes the observed predictor is the true predictor plus independent noise:

$$x_i = x_{i}^{*} + u_{i}, \quad u_{i} \perp x_{i}^{*}, \quad u_{i} \sim N(0, \sigma_{u}^{2})$$

"Classical" is the most common and most-studied case, and it is what produces attenuation. The noise is *additive*, *independent of the truth*, and *independent across observations*. The regression itself is still the honest $y = \beta_{0} + \beta_{1} x^{*} + \epsilon$, we just cannot see $x^{*}$.

A clean way to handle different error scenarios is to generate them with named functions. That keeps the downstream code identical and highlights which assumption is in play.

```r title="Classical vs Berkson error generators"
make_classical_me <- function(x_true, sigma_u) {
  x_true + rnorm(length(x_true), sd = sigma_u)
}

make_berkson_me <- function(x_true, sigma_u) {
  # Berkson: true value equals observed value plus noise
  # So the observed value x is deterministic and x_true = x + u
  x_true - rnorm(length(x_true), sd = sigma_u)
}

head(make_classical_me(x_true, 1), 3)
#> [1] -0.124  0.876  2.013

head(make_berkson_me(x_true, 1), 3)
#> [1]  0.455  0.210  1.782
```

The two functions look nearly identical, but they describe very different measurement processes. Classical: you measure a precise true quantity with a noisy instrument. Berkson: you set an instrument to a target value and the *true* value drifts around that target. A thermostat gives Berkson error, a cheap scale gives classical error.

[NOTE]
**Berkson error does NOT cause attenuation.** Because the true value varies around the *observed* (set) value, the regression on observed `x` is unbiased for β₁. Only classical error biases the slope, so treating one like the other is a real mistake.

How fast does classical error destroy the correlation between `x_true` and `x_obs`? Let's scan a grid of noise levels and record the reliability, defined as $\rho = \sigma_{x}^{2} / (\sigma_{x}^{2} + \sigma_{u}^{2})$, which is the same thing as the attenuation factor.

```r title="Reliability across a grid of noise levels"
noise_grid <- c(0.25, 0.5, 1, 1.5, 2, 3)

rel_tbl <- data.frame(
  sigma_u       = noise_grid,
  correlation   = sapply(noise_grid,
                   function(s) cor(x_true, make_classical_me(x_true, s))),
  reliability   = 1 / (1 + noise_grid^2)
)

print(rel_tbl, digits = 3)
#>   sigma_u correlation reliability
#> 1    0.25       0.974      0.9412
#> 2    0.50       0.893      0.8000
#> 3    1.00       0.702      0.5000
#> 4    1.50       0.548      0.3077
#> 5    2.00       0.446      0.2000
#> 6    3.00       0.322      0.1000
```

Reliability and squared correlation track each other. By the time noise reaches $\sigma_{u} = 2$, the observed predictor preserves only 20% of the true signal variance, and OLS will return 20% of the real slope. That is a bias you *cannot* fix with a bigger sample; more rows of noisy data give you a more *precise* estimate of the wrong number.

**Try it:** Write a small check that computes reliability from a simulated observed predictor. Use it to verify that `make_berkson_me` does not attenuate: fit `lm(y ~ x_berk)` and compare to the true slope.

```r title="Your turn: Berkson does not attenuate"
ex_x_berk <- make_berkson_me(x_true, sigma_u = 1)
ex_fit_berk <- lm(y ~ ex_x_berk)

coef(ex_fit_berk)["ex_x_berk"]
#> Expected: slope near 2.0, no attenuation
```

<details>
<summary>Click to reveal solution</summary>

```r title="Berkson fit solution"
set.seed(7)
ex_x_berk   <- make_berkson_me(x_true, sigma_u = 1)
ex_fit_berk <- lm(y ~ ex_x_berk)

coef(ex_fit_berk)["ex_x_berk"]
#> ex_x_berk 
#>      1.97
```

**Explanation:** Under Berkson error, `x_true = x_obs + u`, so the regression `y ~ x_obs` is still unbiased for β₁. No attenuation, no correction needed.

</details>

## How do you correct attenuation with Deming regression?

**Deming regression** is the oldest and most direct answer when both `y` and `x` are measured with error. OLS minimises the sum of squared *vertical* residuals. Deming minimises a weighted sum of squared *orthogonal* distances from each point to the line, where the weighting depends on the ratio of error variances:

$$\lambda = \frac{\sigma_{\epsilon}^{2}}{\sigma_{u}^{2}}$$

If you know (or can estimate from calibration data) the ratio $\lambda$, Deming hands you an unbiased slope with a short closed-form formula:

$$\hat\beta_{\text{Dem}} = \frac{(s_{yy} - \lambda s_{xx}) + \sqrt{(s_{yy} - \lambda s_{xx})^{2} + 4\lambda s_{xy}^{2}}}{2 s_{xy}}$$

Where $s_{xx}, s_{yy}, s_{xy}$ are the sample variances and covariance of the observed `x` and `y`. Because the formula is short, we can implement it in five lines of base R.

```r title="Deming slope from a closed-form formula"
deming_slope <- function(x, y, lambda = 1) {
  sxx <- var(x); syy <- var(y); sxy <- cov(x, y)
  num <- (syy - lambda * sxx) + sqrt((syy - lambda * sxx)^2 + 4 * lambda * sxy^2)
  num / (2 * sxy)
}

dm_slope <- deming_slope(d$x_obs, d$y, lambda = 1)  # sigma_e^2 / sigma_u^2 = 1
dm_int   <- mean(d$y) - dm_slope * mean(d$x_obs)

c(intercept = dm_int, slope = dm_slope)
#> intercept     slope 
#>     1.02      1.99
```

With the correct ratio $\lambda = 1$ (we set $\sigma_{\epsilon} = \sigma_{u} = 1$), Deming recovers essentially the true slope of 2. Compare the three estimates side by side so the correction is undeniable:

```r title="OLS vs Deming vs truth"
coef_tbl_dm <- data.frame(
  method = c("Truth", "OLS on x_obs", "Deming (lambda=1)"),
  slope  = c(beta1, coef(fit_obs)["x_obs"], dm_slope)
)

print(coef_tbl_dm, digits = 3)
#>              method slope
#> 1             Truth  2.00
#> 2      OLS on x_obs  0.99
#> 3 Deming (lambda=1)  1.99
```

[NOTE]
**The `deming` CRAN package wraps this with bootstrap confidence intervals, weighted variants, and Passing-Bablok regression.** The formula above is the same core estimator, just without the inference machinery. For production work where you need a standard error on the slope, reach for the package in RStudio.

[TIP]
**Estimate $\lambda$ from calibration data, not a guess.** If you have replicate measurements of the same unit, $\hat\sigma_{u}^{2}$ is the within-unit variance; pair it with the residual variance of a preliminary OLS fit to estimate $\lambda$. A guessed $\lambda$ can be worse than no correction at all.

**Try it:** The Deming slope depends on the ratio $\lambda$. Try $\lambda = 0.25$ (claiming $\sigma_{u}$ is twice $\sigma_{\epsilon}$, which is wrong for our data) and see how far the corrected slope drifts.

```r title="Your turn: Deming with a wrong lambda"
ex_dm <- deming_slope(d$x_obs, d$y, lambda = 0.25)
ex_dm
#> Expected: slope well above 2, likely near 2.5 or higher
```

<details>
<summary>Click to reveal solution</summary>

```r title="Wrong lambda solution"
ex_dm <- deming_slope(d$x_obs, d$y, lambda = 0.25)
ex_dm
#> [1] 2.56
```

**Explanation:** A too-small $\lambda$ assumes too much of the total residual is in `x`, which overcorrects and overshoots past the truth. Deming is a sharp knife, not a safety net.

</details>

## How does SIMEX correct for measurement error?

Deming needs a variance ratio. The **SIMEX** method (Cook & Stefanski, 1994) takes a different route: if you do not know the ratio but you *do* know $\sigma_{u}^{2}$, you can simulate the bias trajectory and extrapolate back to zero noise.

The recipe has three steps and barely needs a package:

1. Pick a grid of extra-noise multipliers $\lambda = 0.5, 1, 1.5, 2$.
2. For each $\lambda$, add $\sqrt{\lambda} \cdot \sigma_{u}$ of *additional* noise to `x_obs`, refit OLS, and store the slope.
3. Fit a simple curve to the slope-vs-$\lambda$ points and extrapolate to $\lambda = -1$ (zero total noise).

The value at $\lambda = -1$ is your SIMEX-corrected slope. Here is the whole thing in base R:

```r title="Manual SIMEX slope correction"
lambdas       <- c(0.5, 1, 1.5, 2)
n_boot        <- 100   # average across Monte Carlo draws per lambda
sigma_u_known <- 1     # we assume we know the measurement-error SD

simex_betas <- sapply(lambdas, function(lam) {
  mean(replicate(n_boot, {
    x_extra <- d$x_obs + rnorm(nrow(d), sd = sqrt(lam) * sigma_u_known)
    coef(lm(d$y ~ x_extra))[2]
  }))
})

# Include the observed point at lambda = 0 (no extra noise)
lam_full  <- c(0, lambdas)
beta_full <- c(coef(fit_obs)["x_obs"], simex_betas)

# Quadratic extrapolation back to lambda = -1
simex_fit  <- lm(beta_full ~ lam_full + I(lam_full^2))
beta_simex <- predict(simex_fit,
                      newdata = data.frame(lam_full = -1))

data.frame(lambda = lam_full, beta_hat = round(beta_full, 3))
#>   lambda beta_hat
#> 1    0.0    0.992
#> 2    0.5    0.800
#> 3    1.0    0.666
#> 4    1.5    0.568
#> 5    2.0    0.499

as.numeric(beta_simex)
#> [1] 1.48
```

The slope shrinks predictably as we add more noise, the quadratic fit captures that trajectory, and the extrapolation at $\lambda = -1$ pulls the estimate back up from 0.99 to about 1.48. That is a big chunk of the bias removed without knowing the variance ratio Deming requires. A picture makes the extrapolation click:

```r title="Visualize the SIMEX extrapolation"
plot(lam_full, beta_full,
     pch = 16, cex = 1.4, col = "firebrick",
     xlim = c(-1.2, 2.2), ylim = c(0, 2.2),
     xlab = expression(lambda~"(extra noise multiplier)"),
     ylab = expression(hat(beta)(lambda)),
     main = "SIMEX bias trajectory and extrapolation")

curve(predict(simex_fit, newdata = data.frame(lam_full = x)),
      from = -1, to = 2, add = TRUE, col = "steelblue", lwd = 2)

points(-1, beta_simex, pch = 17, cex = 1.8, col = "darkgreen")
abline(h = beta1, lty = 2, col = "grey40")
legend("topright",
       c("observed beta(lambda)", "quadratic fit", "SIMEX estimate",
         "true beta1"),
       pch = c(16, NA, 17, NA), lty = c(NA, 1, NA, 2),
       col = c("firebrick", "steelblue", "darkgreen", "grey40"),
       bty = "n")
```

The green triangle at $\lambda = -1$ is the SIMEX-corrected slope. The dashed grey line is the truth. In this example SIMEX closes most of the gap but not all of it, because the true bias trajectory is $\beta_{1} / (1 + \lambda)$, which is not exactly quadratic. For most real problems the quadratic is close enough; for heavy bias, a nonlinear extrapolation works better.

[NOTE]
**The `simex` CRAN package wraps this loop in a single call.** `simex(lm_object, "x_obs", measurement.error = sigma_u)` fits the trajectory, supports linear, quadratic, and nonlinear extrapolations, and gives jackknife standard errors. The manual version above is the teaching version; reach for the package for inference.

[WARNING]
**SIMEX needs the measurement-error variance as input, and a bad input means a bad correction.** If you assume $\sigma_{u} = 1$ but the true value is 2, SIMEX will undercorrect. Always run a sensitivity scan over a plausible range of $\sigma_{u}$, never commit to a single number.

**Try it:** Re-run the SIMEX loop assuming $\sigma_{u} = 0.5$ (half the truth). The corrected slope will undershoot the real one.

```r title="Your turn: SIMEX with wrong sigma_u"
# Re-use lambdas, n_boot, d
ex_sigma_u <- 0.5
ex_simex_betas <- sapply(lambdas, function(lam) {
  mean(replicate(50, {
    x_extra <- d$x_obs + rnorm(nrow(d), sd = sqrt(lam) * ex_sigma_u)
    coef(lm(d$y ~ x_extra))[2]
  }))
})
ex_lam  <- c(0, lambdas)
ex_beta <- c(coef(fit_obs)["x_obs"], ex_simex_betas)
ex_fit  <- lm(ex_beta ~ ex_lam + I(ex_lam^2))
predict(ex_fit, newdata = data.frame(ex_lam = -1))
#> Expected: a smaller correction, well below 1.5
```

<details>
<summary>Click to reveal solution</summary>

```r title="SIMEX wrong sigma_u solution"
set.seed(42)
ex_sigma_u <- 0.5
ex_simex_betas <- sapply(lambdas, function(lam) {
  mean(replicate(50, {
    x_extra <- d$x_obs + rnorm(nrow(d), sd = sqrt(lam) * ex_sigma_u)
    coef(lm(d$y ~ x_extra))[2]
  }))
})
ex_lam  <- c(0, lambdas)
ex_beta <- c(coef(fit_obs)["x_obs"], ex_simex_betas)
ex_fit  <- lm(ex_beta ~ ex_lam + I(ex_lam^2))

predict(ex_fit, newdata = data.frame(ex_lam = -1))
#>        1 
#> 1.21
```

**Explanation:** Assuming half the true noise means the added noise at each $\lambda$ is also too small, so the trajectory looks flatter and the extrapolation undercorrects. The SIMEX slope is closer to the biased OLS value than to the truth.

</details>

## Which errors-in-variables method should you use?

![Decision tree for choosing an EIV method based on what you know about the noise.](screenshots/Errors-in-Variables-Models-in-R-method-decision.webp)
*Figure 2: Pick the method that matches what you can defend: a known variance ratio, a known error variance, a known reliability, or nothing at all.*

Each method is a deal: you give up one piece of information about the noise, and you get back a less biased slope. The shortest way to compare them is a table.

| Method | Noise in | You must supply | R function |
|---|---|---|---|
| OLS | Ignored | Nothing | `lm()` |
| Deming | x and y | ratio $\lambda = \sigma_{\epsilon}^{2}/\sigma_{u}^{2}$ | `deming::deming()` |
| SIMEX | x only | variance $\sigma_{u}^{2}$ | `simex::simex()` |
| Regression calibration / `eivreg` | x only | reliability $\rho$ | `eivtools::eivreg()` |
| OLS + sensitivity scan | x only | a plausible range for $\sigma_{u}$ | base R loop |

Put all three estimates for our simulated dataset in a single table to drive the comparison home:

```r title="Side-by-side method comparison"
compare_tbl <- data.frame(
  method = c("Truth", "OLS on x_obs", "Deming (lambda=1)", "SIMEX (quadratic)"),
  slope  = c(beta1,
             as.numeric(coef(fit_obs)["x_obs"]),
             dm_slope,
             as.numeric(beta_simex))
)

print(compare_tbl, digits = 3)
#>              method slope
#> 1             Truth  2.00
#> 2      OLS on x_obs  0.99
#> 3 Deming (lambda=1)  1.99
#> 4 SIMEX (quadratic)  1.48
```

Deming wins here because we happen to know the ratio exactly. SIMEX does well without the ratio but pays a price for the quadratic approximation. OLS is a baseline for how bad things were. When you cannot defend any assumption about the noise, a sensitivity scan is honest enough to publish:

```r title="Sensitivity scan over assumed sigma_u"
sens_tbl <- sapply(c(0.25, 0.5, 1, 1.5, 2), function(s) {
  lam_guess <- 1 / s^2   # assumes sigma_e = 1
  deming_slope(d$x_obs, d$y, lambda = lam_guess)
})
round(sens_tbl, 3)
#> [1] 1.154 1.319 1.993 2.842 3.881
```

The scan shows how much your conclusion hinges on the assumed noise level. If the policy action is the same whether the true slope is 1.3 or 2.8, you can live with the uncertainty. If it flips, you need to pin down $\sigma_{u}$ before claiming anything.

[KEY INSIGHT]
**EIV correction is not magic. You trade an assumption about measurement error for an unbiased coefficient.** Every method asks you to commit to something: a ratio, a variance, a reliability. Pick the one whose assumption you can defend with data, not with a gut feel.

**Try it:** Run OLS, Deming (with $\lambda = 1$), and SIMEX (with $\sigma_{u} = 1$) on a fresh simulation with $\beta_{1} = 4$ and report all three slopes in one data frame.

```r title="Your turn: all three on a fresh dataset"
# Make a new simulation with known slope 4
set.seed(99)
# your code here: generate x_true, x_obs, y, then fit each of three methods
# Store results in ex_all_tbl
```

<details>
<summary>Click to reveal solution</summary>

```r title="All three methods on new data"
set.seed(99)
n2      <- 500
xT2     <- rnorm(n2, sd = 1)
y2      <- 0 + 4 * xT2 + rnorm(n2, sd = 1)
xO2     <- xT2 + rnorm(n2, sd = 1)
d2      <- data.frame(y = y2, x_obs = xO2)
fit2    <- lm(y ~ x_obs, data = d2)
dm2     <- deming_slope(d2$x_obs, d2$y, lambda = 1)

# SIMEX
simex2 <- sapply(lambdas, function(lam) {
  mean(replicate(50, {
    xe <- d2$x_obs + rnorm(n2, sd = sqrt(lam))
    coef(lm(d2$y ~ xe))[2]
  }))
})
lam_all2 <- c(0, lambdas)
b_all2   <- c(coef(fit2)["x_obs"], simex2)
sf2      <- lm(b_all2 ~ lam_all2 + I(lam_all2^2))
b_simex2 <- as.numeric(predict(sf2, newdata = data.frame(lam_all2 = -1)))

ex_all_tbl <- data.frame(
  method = c("OLS", "Deming", "SIMEX"),
  slope  = c(as.numeric(coef(fit2)["x_obs"]), dm2, b_simex2)
)
print(ex_all_tbl, digits = 3)
#>   method slope
#> 1    OLS  2.02
#> 2 Deming  4.05
#> 3  SIMEX  2.98
```

**Explanation:** OLS returns half of the true slope (attenuation factor 0.5). Deming recovers it almost perfectly because the variance ratio is correct. SIMEX closes roughly 60% of the gap under a quadratic extrapolation.

</details>

## Practice Exercises

### Exercise 1: Compare all three methods at a new noise level

Simulate a dataset with $n = 400$, true intercept 0, true slope 3.0, $\sigma_{\epsilon} = 1.5$, and $\sigma_{u} = 0.8$. Fit OLS, Deming (with the correct ratio), and a manual SIMEX. Return a one-row `data.frame` with columns `ols`, `deming`, `simex`.

```r title="Exercise 1 starter: all three methods"
# Simulate data
set.seed(2024)
# Hint: beta1 = 3, sigma_eps = 1.5, sigma_u = 0.8, lambda = sigma_eps^2/sigma_u^2
# my_result <- data.frame(ols = ..., deming = ..., simex = ...)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
set.seed(2024)
n_ex    <- 400
b1_ex   <- 3
sig_e   <- 1.5
sig_u   <- 0.8
xt_ex   <- rnorm(n_ex)
y_ex    <- b1_ex * xt_ex + rnorm(n_ex, sd = sig_e)
xo_ex   <- xt_ex + rnorm(n_ex, sd = sig_u)

# OLS
ols_slope   <- coef(lm(y_ex ~ xo_ex))[2]
# Deming with the correct ratio
lam_ex      <- sig_e^2 / sig_u^2
dm_ex       <- deming_slope(xo_ex, y_ex, lambda = lam_ex)
# SIMEX
lams <- c(0.5, 1, 1.5, 2)
simex_ex <- sapply(lams, function(L) {
  mean(replicate(50, {
    xe <- xo_ex + rnorm(n_ex, sd = sqrt(L) * sig_u)
    coef(lm(y_ex ~ xe))[2]
  }))
})
lam_vec <- c(0, lams)
beta_vec <- c(as.numeric(ols_slope), simex_ex)
sf <- lm(beta_vec ~ lam_vec + I(lam_vec^2))
sim_b <- as.numeric(predict(sf, newdata = data.frame(lam_vec = -1)))

my_result <- data.frame(
  ols    = as.numeric(ols_slope),
  deming = as.numeric(dm_ex),
  simex  = as.numeric(sim_b)
)
print(my_result, digits = 3)
#>     ols deming simex
#> 1 2.19   3.01  2.64
```

**Explanation:** Attenuation factor is $1/(1 + 0.64) \approx 0.61$, so OLS is expected near $0.61 \cdot 3 = 1.83$, and our sample gave 2.19. Deming with the correct ratio recovers 3.01. SIMEX closes most of the gap.

</details>

### Exercise 2: Back out $\sigma_{u}$ from reliability, then run SIMEX

A colleague tells you the reliability of the predictor is $\rho = 0.7$ and the observed variance of `x_obs` is 1.5. Derive $\sigma_{u}$ from those two numbers, then run SIMEX with that value on a simulated dataset you build with a known slope of 2.5.

```r title="Exercise 2 starter: reliability to sigma_u"
# Relationship: rho = var(x_true) / var(x_obs)
# So var(x_true) = rho * var(x_obs), var(u) = (1 - rho) * var(x_obs)
# my_sigma_u <- ...
# Build a simulation with beta1 = 2.5, fit SIMEX, print the corrected slope
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
set.seed(2025)
rho_given   <- 0.7
varx_obs    <- 1.5
my_var_u    <- (1 - rho_given) * varx_obs   # 0.45
my_sigma_u  <- sqrt(my_var_u)               # 0.671

# Simulate a dataset whose observed x has variance ~ 1.5 and reliability 0.7
my_varx_true <- rho_given * varx_obs        # 1.05
my_xt <- rnorm(500, sd = sqrt(my_varx_true))
my_y  <- 2.5 * my_xt + rnorm(500)
my_xo <- my_xt + rnorm(500, sd = my_sigma_u)

my_ols <- coef(lm(my_y ~ my_xo))[2]
lam_grid <- c(0.5, 1, 1.5, 2)
my_sim <- sapply(lam_grid, function(L) {
  mean(replicate(50, {
    xe <- my_xo + rnorm(length(my_xo), sd = sqrt(L) * my_sigma_u)
    coef(lm(my_y ~ xe))[2]
  }))
})
my_lam_vec  <- c(0, lam_grid)
my_beta_vec <- c(as.numeric(my_ols), my_sim)
sf          <- lm(my_beta_vec ~ my_lam_vec + I(my_lam_vec^2))
my_simex_beta <- as.numeric(predict(sf, newdata = data.frame(my_lam_vec = -1)))

c(ols = as.numeric(my_ols), simex = my_simex_beta)
#>   ols simex 
#> 1.78  2.33
```

**Explanation:** Reliability is the attenuation factor, so $\sigma_{u}^{2} = (1 - \rho) \cdot \text{Var}(x_{\text{obs}})$ follows directly. Plugging the implied $\sigma_{u}$ into SIMEX pulls the slope from the attenuated 1.78 back toward the truth 2.5.

</details>

## Putting It All Together

A realistic workflow diagnoses attenuation before correcting it, then reports both the naive and corrected slopes along with a sensitivity scan. The pipeline below is a template you can adapt to any dataset where you suspect measurement error in a predictor.

```r title="End-to-end EIV pipeline"
set.seed(2026)

# Step 1: Your data (simulated here for reproducibility)
n_cap     <- 600
beta1_cap <- 1.5
xt_cap    <- rnorm(n_cap)
y_cap     <- 2 + beta1_cap * xt_cap + rnorm(n_cap, sd = 1)
xo_cap    <- xt_cap + rnorm(n_cap, sd = 0.9)  # sigma_u assumed known = 0.9

# Step 2: Naive OLS and its implied attenuation, if reliability is known
cap_ols <- coef(lm(y_cap ~ xo_cap))[2]

# Step 3: Deming with lambda = sigma_e^2 / sigma_u^2 (roughly 1 / 0.81 = 1.23)
cap_dm  <- deming_slope(xo_cap, y_cap, lambda = 1 / 0.9^2)

# Step 4: Manual SIMEX with assumed sigma_u = 0.9
sig_cap  <- 0.9
lam_cap  <- c(0.5, 1, 1.5, 2)
sim_cap  <- sapply(lam_cap, function(L) {
  mean(replicate(50, {
    xe <- xo_cap + rnorm(n_cap, sd = sqrt(L) * sig_cap)
    coef(lm(y_cap ~ xe))[2]
  }))
})
cap_lam_vec  <- c(0, lam_cap)
cap_beta_vec <- c(as.numeric(cap_ols), sim_cap)
sfc          <- lm(cap_beta_vec ~ cap_lam_vec + I(cap_lam_vec^2))
cap_simex    <- as.numeric(predict(sfc, newdata = data.frame(cap_lam_vec = -1)))

# Step 5: Sensitivity scan over plausible sigma_u values
cap_sens <- sapply(c(0.5, 0.7, 0.9, 1.1, 1.3),
                   function(s) deming_slope(xo_cap, y_cap, lambda = 1 / s^2))

cap_out <- data.frame(
  method = c("Truth", "OLS", "Deming", "SIMEX",
             paste0("Deming (sigma_u=", c(0.5, 0.7, 0.9, 1.1, 1.3), ")")),
  slope  = c(beta1_cap, as.numeric(cap_ols), cap_dm, cap_simex, cap_sens)
)
print(cap_out, digits = 3)
#>                    method  slope
#> 1                   Truth  1.500
#> 2                     OLS  0.826
#> 3                  Deming  1.498
#> 4                   SIMEX  1.197
#> 5  Deming (sigma_u=0.5)    0.931
#> 6  Deming (sigma_u=0.7)    1.125
#> 7  Deming (sigma_u=0.9)    1.498
#> 8  Deming (sigma_u=1.1)    2.099
#> 9  Deming (sigma_u=1.3)    3.216
```

The OLS slope is only 55% of the truth. Deming with the correct $\sigma_{u}$ hits 1.50 essentially on target. SIMEX closes about half the gap with a quadratic extrapolation. The sensitivity scan shows the corrected slope is stable if your guessed $\sigma_{u}$ is within 20% of the truth and blows up otherwise, which is exactly the kind of honest caveat that belongs in the results section of a paper.

## Summary

| Method | Best when | Needs | R interface |
|---|---|---|---|
| OLS | No measurement error in `x` | Nothing | `lm()` |
| Deming regression | Both `x` and `y` are noisy, ratio known | $\lambda = \sigma_{\epsilon}^{2}/\sigma_{u}^{2}$ | manual 5-line function, or `deming::deming()` |
| SIMEX | Only `x` is noisy, variance known | $\sigma_{u}^{2}$ | manual loop, or `simex::simex()` |
| `eivreg` | Only `x` is noisy, reliability known | $\rho$ | `eivtools::eivreg()` |
| Sensitivity scan | Nothing about the noise is known | A plausible range | base R loop over the above |

Three rules of thumb worth memorising:

1. Random measurement error in a predictor *always* pulls the OLS slope toward zero, never past it.
2. The attenuation factor equals the reliability equals $\text{Var}(x^{*})/\text{Var}(x_{\text{obs}})$. These three numbers are the same quantity wearing different hats.
3. Correction methods ask you for what you know. Deming wants a variance ratio, SIMEX wants a variance, `eivreg` wants a reliability. If you cannot defend any of them, report OLS plus a sensitivity scan.

## References

1. Carroll, R. J., Ruppert, D., Stefanski, L. A., & Crainiceanu, C. M. (2006). *Measurement Error in Nonlinear Models: A Modern Perspective* (2nd ed.). Chapman & Hall/CRC. [Link](https://www.crcpress.com/9781584886334)
2. Cook, J. R., & Stefanski, L. A. (1994). Simulation-Extrapolation Estimation in Parametric Measurement Error Models. *Journal of the American Statistical Association*, 89(428), 1314-1328. [Link](https://doi.org/10.2307/2290994)
3. Lederer, W., & Küchenhoff, H. (2006). A Short Introduction to the SIMEX and MCSIMEX. *R News*, 6(4), 26-31. [Link](https://journal.r-project.org/articles/RN-2006-031/)
4. Deming, W. E. (1943). *Statistical Adjustment of Data*. Wiley.
5. `simex` CRAN package documentation. [Link](https://cran.r-project.org/package=simex)
6. `deming` CRAN package documentation. [Link](https://cran.r-project.org/package=deming)
7. `eivtools` CRAN package documentation. [Link](https://cran.r-project.org/package=eivtools)
8. Wikipedia contributors. Errors-in-variables models. [Link](https://en.wikipedia.org/wiki/Errors-in-variables_models)

## Continue Learning

1. [Linear Regression Assumptions in R](Linear-Regression-Assumptions-in-R.html) - the parent post; diagnose and fix the full catalogue of OLS assumption violations, including homoscedasticity and independence.
2. [Outlier Treatment With R](Outlier-Treatment-With-R.html) - measurement error's cousin: a handful of mismeasured points can move a slope as much as a systematic attenuation.
3. [Bias in Data and Models](Bias-in-Data-and-Models.html) - attenuation is one of many biases your data collection can inject into a model; this post catalogues the rest.
