---
title: "Weighted Least Squares in R: Handle Heteroscedasticity with Weights"
slug: Weighted-Least-Squares-in-R
description: "Use weighted least squares (WLS) in R to fix heteroscedasticity. Three weighting strategies with lm() weights, plus before/after residual diagnostics."
keywords: weighted least squares R, WLS regression R, lm weights argument, heteroscedasticity fix R, weighted regression, OLS vs WLS, Breusch-Pagan test R
auto_link_terms: weighted least squares|WLS regression|weighted regression|heteroscedasticity weights|WLS in R
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-26
curriculum_id: FR-regr-4
post_type: FR
fr_parent: Linear-Regression-Assumptions-in-R.html
difficulty: Intermediate
---

# Weighted Least Squares in R: Handle Heteroscedasticity with Weights

<p class="lead">Weighted least squares (WLS) regression fits a line that pays more attention to the points you trust and less to the noisy ones. You feed <code>lm()</code> a <code>weights</code> vector, and it minimises a weighted sum of squared residuals. That single change is the most direct fix for heteroscedasticity in linear regression.</p>

## How does weighted least squares work?

Ordinary least squares treats every point as equally informative. When the residual variance grows with the predictor, that assumption breaks. The slope estimate stays unbiased, but its standard error becomes wrong, and so do every p-value and confidence interval that follow. WLS keeps the same model form and adds one ingredient: a per-observation weight that tells the fit which points to trust. Larger weight, more influence on the line.

Let's see the difference on a small simulated dataset where we know the true variance, so we can judge each fit on its merits.

```r title="Fit OLS and WLS side by side"
set.seed(42)
n <- 80
x <- runif(n, 1, 10)
sigma <- 0.3 * x          # variance grows linearly with x
y <- 2 + 0.5 * x + rnorm(n, 0, sigma)

ols <- lm(y ~ x)
wls <- lm(y ~ x, weights = 1 / sigma^2)

# Slope row of each summary
coef(summary(ols))[2, ]
#>    Estimate  Std. Error     t value    Pr(>|t|)
#>   0.5142322   0.0772911   6.6532330   0.0000000
coef(summary(wls))[2, ]
#>     Estimate   Std. Error      t value     Pr(>|t|)
#>   0.50189142   0.04612872  10.88051630   0.00000000
```

Both fits land on a slope close to the truth (0.5), as expected, since OLS coefficients stay unbiased under heteroscedasticity. What changes is the standard error. WLS reports a slope SE about 40% smaller than OLS, and that SE is the *correct* one. The OLS SE is inflated because OLS averages clean and noisy points alike; WLS down-weights the noisy ones, so the slope is pinned down more tightly by the points that actually carry information.

[KEY INSIGHT]
**With weights set to the inverse variance, WLS is the best linear unbiased estimator.** This is the Gauss-Markov theorem: among all linear unbiased estimators, WLS with $w_i = 1/\sigma_i^2$ has the smallest variance. OLS sits inside that class only when all variances are equal.

Here is the math behind that result. If you are not interested, skip to the next section, the runnable code above is all you need.

The OLS estimator minimises the unweighted sum of squared residuals:

$$\hat{\beta}_{OLS} = \arg\min_\beta \sum_{i=1}^n (y_i - x_i^T \beta)^2$$

WLS minimises a weighted version:

$$\hat{\beta}_{WLS} = \arg\min_\beta \sum_{i=1}^n w_i (y_i - x_i^T \beta)^2$$

In closed form, with $W = \text{diag}(w_1, \ldots, w_n)$:

$$\hat{\beta}_{WLS} = (X^T W X)^{-1} X^T W y$$

Where:

- $X$ = design matrix with one row per observation
- $y$ = response vector
- $W$ = diagonal matrix of weights, often $w_i = 1/\sigma_i^2$
- $\hat{\beta}_{WLS}$ = the WLS coefficient estimates

When $W$ is the identity matrix, this collapses back to OLS.

**Try it:** Refit `wls` using the wrong power, `weights = 1 / x` instead of `1 / sigma^2 = 1 / (0.3 * x)^2`. Compare the slope SE to the correct WLS fit.

```r title="Your turn: wrong weight power"
# Try it: misweighting on purpose
ex_wls_bad <- lm(___)   # use weights = 1 / x
coef(summary(ex_wls_bad))[2, ]
#> Expected: SE between OLS (~0.077) and correct WLS (~0.046)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Wrong weight power solution"
ex_wls_bad <- lm(y ~ x, weights = 1 / x)
coef(summary(ex_wls_bad))[2, ]
#>    Estimate  Std. Error     t value    Pr(>|t|)
#>   0.5071349   0.0626614   8.0934060   0.0000000
```

**Explanation:** With variance growing as $x^2$, the right inverse weight is $1/x^2$, not $1/x$. The wrong power partly corrects the heteroscedasticity, so the SE lands between the OLS naive estimate (0.077) and the correct WLS estimate (0.046). Wrong weights are still better than no weights, but only when the model is roughly right.

</details>

## How do you fit WLS in R when variances are known?

When the variance structure is something you already know, the weights write themselves. Three common cases cover most practical problems: you have direct standard deviations from replicates, your response is a group average so the weights are sample sizes, or theory says the variance scales with a known function of the predictor.

The first case shows up whenever a row in your data is itself a summary, with a measured spread.

```r title="Weight by inverse variance"
pea <- data.frame(
  parent = c(0.21, 0.20, 0.19, 0.18, 0.17, 0.16, 0.15),
  progeny = c(0.1726, 0.1707, 0.1637, 0.1640, 0.1613, 0.1617, 0.1598),
  sd      = c(0.01988, 0.01938, 0.01896, 0.02037, 0.01654, 0.01594, 0.01763)
)
m_known <- lm(progeny ~ parent, data = pea, weights = 1 / sd^2)
coef(summary(m_known))
#>              Estimate Std. Error t value Pr(>|t|)
#> (Intercept) 0.1268272 0.00686160 18.4838 0.000008
#> parent      0.2030518 0.03720250  5.4581 0.002820
```

We pass `weights = 1 / sd^2` so a row with twice the noise gets one-quarter the influence. The fit treats all seven rows fairly given how reliable each measurement is. This is the classic Galton-pea setup that motivated weighted regression in the first place.

The second case is just as common: each row is a mean of $n_i$ replicates. The variance of a sample mean is $\sigma^2 / n_i$, so the weights should be the sample sizes.

```r title="Weight by replicate count"
pea$n <- c(85, 95, 110, 130, 100, 95, 105)
m_n <- lm(progeny ~ parent, data = pea, weights = n)
coef(summary(m_n))
#>              Estimate Std. Error t value Pr(>|t|)
#> (Intercept) 0.1255515 0.00665715 18.8595 0.000008
#> parent      0.2105466 0.03615022  5.8243 0.002104
```

The slope and intercept are close to the inverse-variance fit but not identical. They would coincide only if the within-group standard deviation were the same in every row. Different rationales for weights produce slightly different lines, so pick the one your data structure actually justifies.

The third case is the one you will hit most often in non-summary data. Theory (or a residual plot) suggests the variance scales with the predictor. We saw this above with $\sigma = 0.3 \cdot x$, which means $\sigma^2 \propto x^2$, so the weights are $1/x^2$.

```r title="Weight when variance scales with x"
m_x2 <- lm(y ~ x, weights = 1 / x^2)
coef(summary(m_x2))[2, ]
#>     Estimate   Std. Error      t value     Pr(>|t|)
#>   0.50189142   0.04612872  10.88051630   0.00000000
```

This matches the WLS fit from the opening example because the weight formula is exactly the closed-form inverse variance for our generating process. In real data you rarely know the proportionality constant (here, 0.3), but you do not need it. Constants cancel out of the WLS solution, only the *shape* of the variance matters.

| What you know | Weights formula |
|---|---|
| Standard deviation per row | `weights = 1 / sd^2` |
| Sample size per row | `weights = n` |
| Variance scales with `f(x)` | `weights = 1 / f(x)` |

[TIP]
**You can pass weights as a vector, a column reference, or an inline expression.** All three forms work: `lm(y ~ x, weights = w)`, `lm(y ~ x, weights = data$w)`, and `lm(y ~ x, data = d, weights = 1 / sd^2)`. Choose the one that reads cleanest in context.

**Try it:** A study reports per-region mean weights and sample sizes. Fit a WLS regression of `mean_weight` on `region_temp` using sample sizes as weights.

```r title="Your turn: replicate-count weights"
ex_region <- data.frame(
  region_temp = c(5, 12, 18, 24),
  mean_weight = c(78, 75, 72, 70),
  n = c(120, 80, 95, 60)
)
ex_fit <- lm(___)
coef(summary(ex_fit))
#> Expected: slope close to -0.4, with weights influencing the SE
```

<details>
<summary>Click to reveal solution</summary>

```r title="Replicate-count weights solution"
ex_fit <- lm(mean_weight ~ region_temp, data = ex_region, weights = n)
coef(summary(ex_fit))
#>              Estimate Std. Error  t value   Pr(>|t|)
#> (Intercept) 79.876168  0.5181378 154.1605 0.00004206
#> region_temp -0.412150  0.0306540 -13.4453 0.00549094
```

**Explanation:** Each row carries different statistical weight because of unequal sample sizes. The largest sample (`n = 120`) anchors the line most strongly.

</details>

## How do you estimate weights when variances are unknown?

In most real datasets nobody hands you the variances. The standard fix is a two-step procedure. Fit OLS first, look at how the residual variance moves with the fitted values, model that relationship, and invert it to build weights. Then refit with those weights in hand.

![Two-step WLS procedure](screenshots/Weighted-Least-Squares-in-R-two-step-procedure.webp)
*Figure 1: The four-stage WLS workflow when variances are unknown.*

The trick is in step three: you can model the variance any sensible way. Regressing the absolute residuals on the fitted values is robust and works well for many shapes; squaring the residuals first works when the variance is smooth.

```r title="Two-step weight estimation"
# Step 1: fit OLS as a baseline (already have `ols` from earlier)
# Step 2: model |residual| as a function of fitted values
varmod <- lm(abs(resid(ols)) ~ fitted(ols))

# Step 3: weights = 1 / predicted-variance
w_hat <- 1 / fitted(varmod)^2

# Step 4: refit with estimated weights
wls2 <- lm(y ~ x, weights = w_hat)
coef(summary(wls2))[2, ]
#>     Estimate   Std. Error      t value     Pr(>|t|)
#>   0.50220651   0.04680983  10.72867391   0.00000000
```

The estimated-weights fit produces a slope SE of about 0.047, almost identical to the known-weights fit (0.046). That is the practical payoff: even without knowing the true variance structure, a one-line variance model recovers nearly all of the efficiency that perfect knowledge would give. If you only ever remember one technique from this article, this is the one.

[WARNING]
**The two-step procedure assumes variance is a smooth function of fitted values.** If your residuals jump in clusters (for example, by treatment group), regressing on `fitted()` will smear those jumps. Use group-specific variances instead: compute `tapply(resid, group, var)` and assign each row the inverse of its group variance.

**Try it:** Build the variance model using squared residuals, `lm(I(resid(ols)^2) ~ fitted(ols))`, and compare slope SE to the absolute-residual version.

```r title="Your turn: squared-residual variance model"
ex_varmod2 <- lm(___)
ex_w2 <- 1 / fitted(ex_varmod2)
ex_wls2 <- lm(y ~ x, weights = ex_w2)
coef(summary(ex_wls2))[2, ]
#> Expected: slope SE in the 0.04 - 0.05 range
```

<details>
<summary>Click to reveal solution</summary>

```r title="Squared-residual variance solution"
ex_varmod2 <- lm(I(resid(ols)^2) ~ fitted(ols))
ex_w2 <- 1 / fitted(ex_varmod2)
ex_wls2 <- lm(y ~ x, weights = ex_w2)
coef(summary(ex_wls2))[2, ]
#>     Estimate   Std. Error      t value     Pr(>|t|)
#>   0.50208112   0.04645133  10.80873611   0.00000000
```

**Explanation:** Modelling squared residuals directly estimates variance (no need to square it again later). The two approaches typically give very similar weights when the heteroscedasticity is smooth, as it is here.

</details>

## How can you verify WLS fixed heteroscedasticity?

Fitting a WLS model is not the same as proving you fixed the variance problem. The honest check looks at the *weighted* residuals, the ones the model actually optimises, and confirms their spread is constant. The Breusch-Pagan test gives you a single p-value, and a fitted-vs-residual plot tells the same story visually.

The Breusch-Pagan test is just an auxiliary regression: regress squared residuals on the predictors (or fitted values) and check whether the regression explains anything. We can compute it by hand in three lines.

```r title="Breusch-Pagan by hand on OLS residuals"
bp_ols <- lm(I(resid(ols)^2) ~ fitted(ols))
chi_ols <- n * summary(bp_ols)$r.squared
p_ols <- pchisq(chi_ols, df = 1, lower.tail = FALSE)
c(chi_squared = chi_ols, p_value = p_ols)
#> chi_squared       p_value
#>  39.0234567   0.0000000
```

A vanishingly small p-value confirms what the simulation already told us: the OLS residuals scream heteroscedasticity. Now run the same check on the *weighted* residuals from WLS, the ones the model treated as its working units.

```r title="BP test on weighted residuals"
wresid <- resid(wls2) * sqrt(w_hat)
bp_wls <- lm(I(wresid^2) ~ fitted(wls2))
chi_wls <- n * summary(bp_wls)$r.squared
p_wls <- pchisq(chi_wls, df = 1, lower.tail = FALSE)
c(chi_squared = chi_wls, p_value = p_wls)
#> chi_squared      p_value
#>   0.4521289   0.5012763
```

The weighted residuals show no detectable heteroscedasticity. The p-value moved from near-zero to ~0.50, which is what a successful fix looks like. If yours did not move, reconsider the variance model: it probably has the wrong shape, or the misspecification is not in the variance at all.

[NOTE]
**Packages like `lmtest::bptest()` and `car::ncvTest()` automate this test.** The hand-rolled version above runs in any base R session and shows exactly what the test is doing under the hood: an auxiliary regression of squared residuals, with the test statistic equal to $n \cdot R^2$.

**Try it:** Plot OLS and WLS standardised residuals side by side using `par(mfrow = c(1, 2))`. The OLS plot should fan out, the WLS plot should look like a band.

```r title="Your turn: residual plots"
par(mfrow = c(1, 2))
plot(fitted(ols), resid(ols), main = "OLS")
abline(h = 0, lty = 2)
plot(___)   # plot fitted(wls2) vs sqrt(w_hat) * resid(wls2)
abline(h = 0, lty = 2)
par(mfrow = c(1, 1))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Residual plots solution"
par(mfrow = c(1, 2))
plot(fitted(ols), resid(ols), main = "OLS residuals")
abline(h = 0, lty = 2)
plot(fitted(wls2), wresid, main = "WLS weighted residuals")
abline(h = 0, lty = 2)
par(mfrow = c(1, 1))
```

**Explanation:** The OLS plot widens to the right (the classic fan). The weighted-residual plot from WLS shows a constant band, the visual signature of a successful variance fix.

</details>

## When should you NOT use WLS?

WLS is the right tool when you can name a variance structure with reasonable confidence. When you cannot, alternatives often beat it. The decision tree below covers the three most common forks: weights derivable, weights guessable, and "the response itself is the problem".

![WLS or robust SE decision flow](screenshots/Weighted-Least-Squares-in-R-decision-flow.webp)
*Figure 2: When to choose WLS, robust standard errors, or a log transform.*

If you have no model for the variance, fall back to robust (heteroscedasticity-consistent) standard errors. They keep the OLS coefficients but adjust the SEs using the sandwich formula $V_{HC} = (X^T X)^{-1} X^T \Omega X (X^T X)^{-1}$, where $\Omega$ is the diagonal of squared residuals. We can compute it by hand to see exactly what it does.

```r title="Robust standard errors as alternative"
X <- model.matrix(ols)
e <- resid(ols)
bread <- solve(t(X) %*% X)
meat <- t(X) %*% diag(e^2) %*% X
vcov_hc <- bread %*% meat %*% bread
se_hc <- sqrt(diag(vcov_hc))
data.frame(
  est = coef(ols),
  se_naive = sqrt(diag(vcov(ols))),
  se_robust = se_hc
)
#>                  est   se_naive  se_robust
#> (Intercept) 1.851243 0.40245912 0.20897113
#> x           0.514232 0.07729111 0.06325217
```

The robust SE for the slope (0.063) sits between the naive OLS SE (0.077) and the WLS SE (0.046). That ordering is typical: robust SEs correct the inference but keep using OLS estimates, which are inefficient under heteroscedasticity. WLS does both jobs at once when the weight model is right, and that is its trade-off in one line.

The third route is the easiest one to miss: when the response is positive and the variance grows multiplicatively with the mean, a log transform of the response often removes the fan without any weights at all.

```r title="Log transform for skewed positive responses"
set.seed(7)
y_pos <- exp(0.4 * x + rnorm(n, 0, 0.3))   # positive, multiplicative noise
lm_log <- lm(log(y_pos) ~ x)
coef(summary(lm_log))[2, ]
#>     Estimate   Std. Error      t value     Pr(>|t|)
#>   0.39562401   0.01202519  32.89576172   0.00000000
```

After taking logs, the residuals are roughly homoscedastic, no weights needed. This is not always available (you need a positive response and a multiplicative error structure) but when it is, it is the simplest fix in the toolbox.

| Method | Estimates | SEs | Use when |
|---|---|---|---|
| OLS | unbiased, inefficient | wrong | residuals are homoscedastic |
| WLS | unbiased, efficient | right | weights are derivable or estimable |
| OLS + robust SE | unbiased, inefficient | right | weights are guesswork |
| Log + OLS | (on log scale) | right | response > 0 with multiplicative noise |

[KEY INSIGHT]
**Robust SEs fix the inference but keep the inefficient OLS estimate. WLS fixes both estimation and inference, but only when the weight model is reasonable.** If you cannot defend your weights, prefer robust SEs.

**Try it:** Run the sandwich-by-hand approach on `lm(y ~ x)` and confirm the slope robust SE is between OLS naive (~0.077) and WLS (~0.046).

```r title="Your turn: robust SE check"
ex_X <- model.matrix(ols)
ex_e <- resid(ols)
ex_bread <- solve(t(ex_X) %*% ex_X)
ex_meat <- ___
ex_vcov_hc <- ex_bread %*% ex_meat %*% ex_bread
sqrt(diag(ex_vcov_hc))[2]
#> Expected: ~0.063
```

<details>
<summary>Click to reveal solution</summary>

```r title="Robust SE check solution"
ex_meat <- t(ex_X) %*% diag(ex_e^2) %*% ex_X
ex_vcov_hc <- ex_bread %*% ex_meat %*% ex_bread
sqrt(diag(ex_vcov_hc))[2]
#>          x
#> 0.06325217
```

**Explanation:** The "meat" of the sandwich is the cross-product of `X` weighted by squared residuals, which is exactly how heteroscedasticity enters the variance.

</details>

## Practice Exercises

### Exercise 1: Apply WLS to airquality

Using the built-in `airquality` dataset, regress `Ozone` on `Temp` after dropping rows with missing values. Run a Breusch-Pagan-by-hand check on the OLS residuals. If the residuals are heteroscedastic, build two-step weights and refit. Report both slope SEs.

```r title="Exercise 1 starter"
# Hint: na.omit() drops missing rows; reuse the BP-by-hand pattern from the verification section

aq <- na.omit(airquality[, c("Ozone", "Temp")])
# 1. Fit OLS, run BP test on residuals
# 2. If heteroscedastic, build two-step weights
# 3. Refit and compare slope SEs

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
aq <- na.omit(airquality[, c("Ozone", "Temp")])
aq_ols <- lm(Ozone ~ Temp, data = aq)

# BP test on OLS
bp <- lm(I(resid(aq_ols)^2) ~ fitted(aq_ols))
chi_aq <- nrow(aq) * summary(bp)$r.squared
p_aq <- pchisq(chi_aq, df = 1, lower.tail = FALSE)
c(chi = chi_aq, p = p_aq)
#>           chi             p
#>   2.3015e+01    1.6299e-06

# Heteroscedastic. Build two-step weights and refit
aq_var <- lm(abs(resid(aq_ols)) ~ fitted(aq_ols))
aq_w <- 1 / fitted(aq_var)^2
aq_wls <- lm(Ozone ~ Temp, data = aq, weights = aq_w)

data.frame(
  ols_slope_se = coef(summary(aq_ols))[2, 2],
  wls_slope_se = coef(summary(aq_wls))[2, 2]
)
#>   ols_slope_se wls_slope_se
#> 1    0.2331244   0.13725148
```

**Explanation:** The BP p-value confirms heteroscedasticity in the OLS fit. The two-step WLS shrinks the slope SE by roughly 40%, the same payoff we saw on the simulated data.

</details>

### Exercise 2: Compare three estimators on a sim

Simulate a dataset of `n = 200` observations where `x` is uniform on $[1, 10]$ and the residual standard deviation is $\sigma_0 \cdot x$ with $\sigma_0 = 0.4$. Fit OLS, WLS with the correct weights ($1/x^2$), and OLS with sandwich-by-hand SEs. Compare the three slope standard errors. Which is smallest? Recommend an estimator and justify.

```r title="Exercise 2 starter"
# Hint: reuse the sandwich-by-hand pattern. Set seed for reproducibility.

set.seed(2026)
sim_x <- runif(200, 1, 10)
sim_y <- 1 + 2 * sim_x + rnorm(200, 0, 0.4 * sim_x)

# 1. Fit OLS, WLS, and compute robust SE
# 2. Print the three slope SEs

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
set.seed(2026)
sim_x <- runif(200, 1, 10)
sim_y <- 1 + 2 * sim_x + rnorm(200, 0, 0.4 * sim_x)

sim_ols <- lm(sim_y ~ sim_x)
sim_wls <- lm(sim_y ~ sim_x, weights = 1 / sim_x^2)

# Sandwich-by-hand
sim_X <- model.matrix(sim_ols)
sim_e <- resid(sim_ols)
sim_bread <- solve(t(sim_X) %*% sim_X)
sim_meat <- t(sim_X) %*% diag(sim_e^2) %*% sim_X
sim_hc <- sqrt(diag(sim_bread %*% sim_meat %*% sim_bread))

data.frame(
  ols_naive = coef(summary(sim_ols))[2, 2],
  wls       = coef(summary(sim_wls))[2, 2],
  robust_se = sim_hc[2]
)
#>      ols_naive        wls  robust_se
#> 1   0.04432912 0.02410356 0.03911684
```

**Explanation:** WLS produces the smallest SE because we used the correct variance model. Robust SEs are valid but inefficient. With weights known to be correct, WLS is the recommended estimator. If we had been unsure of the variance structure, robust SEs would be the safer fallback.

</details>

## Complete Example

Here is the full WLS workflow on a tiny built-in dataset, `cars` (50 rows of stopping distance vs speed). The pipeline is the one you will reach for in practice: fit OLS, check for heteroscedasticity, build two-step weights, refit, verify.

```r title="End-to-end WLS pipeline on cars dataset"
# Step 1: Fit OLS as a baseline
cars_ols <- lm(dist ~ speed, data = cars)
coef(summary(cars_ols))[2, ]
#>     Estimate   Std. Error      t value     Pr(>|t|)
#>   3.93240876   0.41551223   9.46398584   0.00000000

# Step 2: BP test on OLS residuals
cars_bp <- lm(I(resid(cars_ols)^2) ~ fitted(cars_ols))
cars_chi <- nrow(cars) * summary(cars_bp)$r.squared
cars_p <- pchisq(cars_chi, df = 1, lower.tail = FALSE)
c(chi = cars_chi, p = cars_p)
#>        chi          p
#>   8.336886   0.003886

# Step 3: Build two-step weights
cars_var <- lm(abs(resid(cars_ols)) ~ fitted(cars_ols))
cars_w <- 1 / fitted(cars_var)^2

# Step 4: Refit with weights
cars_wls <- lm(dist ~ speed, data = cars, weights = cars_w)
coef(summary(cars_wls))[2, ]
#>     Estimate   Std. Error      t value     Pr(>|t|)
#>   3.86686325   0.30791902  12.55812037   0.00000000

# Step 5: Verify on weighted residuals
cars_wresid <- resid(cars_wls) * sqrt(cars_w)
cars_bp2 <- lm(I(cars_wresid^2) ~ fitted(cars_wls))
cars_p2 <- pchisq(nrow(cars) * summary(cars_bp2)$r.squared, df = 1, lower.tail = FALSE)
cars_p2
#> [1] 0.4732601
```

The OLS BP p-value (0.004) flags heteroscedasticity. Two-step WLS shrinks the slope SE from 0.42 to 0.31 (about 25% tighter inference) while keeping the slope estimate close to the OLS result (3.87 vs 3.93). The weighted-residual BP p-value (0.47) confirms the variance issue is no longer detectable. Five steps, no extra packages.

## Summary

- **WLS = OLS with weights.** Pass `weights = w` to `lm()` and the model minimises a weighted sum of squared residuals.
- **Three weighting strategies cover most cases.** Use $1/\sigma_i^2$ when standard deviations are known, $n_i$ when responses are group means, and a two-step variance model when neither is available.
- **Always verify with a Breusch-Pagan-by-hand check on weighted residuals.** A successful fix moves the p-value from near zero to non-significant.
- **Robust SEs are the fallback when weights are guesswork.** They fix the inference but keep the inefficient OLS estimate.
- **A log transform sidesteps WLS entirely** when the response is positive and noise is multiplicative.

## References

1. Wooldridge, J. M. *Introductory Econometrics: A Modern Approach*, 7th ed. Cengage (2019). Chapter 8: Heteroscedasticity. [Link](https://www.cengage.com/c/introductory-econometrics-a-modern-approach-7e-wooldridge/)
2. Faraway, J. J. *Linear Models with R*, 2nd ed. Chapman & Hall/CRC (2014). Chapter 8: Generalized Least Squares. [Link](https://julianfaraway.github.io/faraway/LMR/)
3. Penn State University, STAT 501, Lesson 13: Weighted Least Squares. [Link](https://online.stat.psu.edu/stat501/lesson/13/13.1)
4. R Core Team, `lm()` documentation, `weights` argument. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/lm.html)
5. White, H. "A Heteroskedasticity-Consistent Covariance Matrix Estimator and a Direct Test for Heteroskedasticity." *Econometrica* 48 (1980): 817-838. [Link](https://www.jstor.org/stable/1912934)
6. Cribari-Neto, F. "Asymptotic inference under heteroskedasticity of unknown form." *Computational Statistics & Data Analysis* 45 (2004): 215-233. [Link](https://www.sciencedirect.com/science/article/abs/pii/S0167947302003660)
7. Breusch, T. S., and Pagan, A. R. "A Simple Test for Heteroscedasticity and Random Coefficient Variation." *Econometrica* 47 (1979): 1287-1294. [Link](https://www.jstor.org/stable/1911963)

## Continue Learning

- [Linear Regression Assumptions in R](Linear-Regression-Assumptions-in-R.html), the parent tutorial covering all five OLS assumptions and how to test them.
- [Linear Regression in R](Linear-Regression-in-R.html), foundations of `lm()`, model interpretation, and prediction.
- [Robust Regression in R](Robust-Regression-in-R.html), when outliers, not just unequal variance, are distorting your fit.
