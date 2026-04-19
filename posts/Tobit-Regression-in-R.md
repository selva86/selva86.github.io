---
title: "Tobit Regression in R: AER Package for Censored Outcomes"
slug: "Tobit-Regression-in-R"
description: "Learn Tobit regression in R with the AER package: fit censored models, interpret coefficients, compare OLS vs Tobit, and handle left or right censoring."
keywords: "tobit regression R, AER tobit function, censored regression, left-censored data, tobit vs OLS, survreg, latent variable model, Affairs dataset"
auto_link_terms: "Tobit regression|censored regression|AER package|tobit model|censored outcomes|left-censored data"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-19
curriculum_id: FR-regr-8
post_type: FR
fr_parent: Logistic-Regression-in-R.html
difficulty: Intermediate
---

# Tobit Regression in R: AER Package for Censored Outcomes

<p class="lead">Tobit regression models an outcome that is partially hidden at a floor or ceiling, like spending that cannot go below zero or test scores capped at the top of a scale. The <code>tobit()</code> function in the AER package fits these models in one line by extending classical linear regression to respect the censoring point.</p>

## What is Tobit regression and when should you use it?

Many real outcomes cluster at a boundary. The `Affairs` dataset bundled with AER records how often married people report being unfaithful in the past year, with about three-quarters of respondents reporting zero. Ordinary least squares ignores that floor and produces biased coefficients. Tobit regression fits a latent linear model for the true underlying propensity, then applies the floor during estimation. One call to `tobit()` gives us the full result.

```r title="Fit a Tobit model on the Affairs data"
# Load the AER package (brings tobit, survreg backend, and the Affairs data)
library(AER)
data("Affairs", package = "AER")

# Fit a left-censored Tobit regression (default: left = 0, right = Inf)
tobit_mod <- tobit(affairs ~ age + yearsmarried + religiousness +
                   occupation + rating, data = Affairs)

summary(tobit_mod)
#> Call:
#> tobit(formula = affairs ~ age + yearsmarried + religiousness +
#>     occupation + rating, data = Affairs)
#>
#>                 Estimate Std. Error z value Pr(>|z|)
#> (Intercept)       7.9010     2.8039    2.82  0.00483
#> age              -0.1776     0.0790   -2.25  0.02453
#> yearsmarried      0.5323     0.1412    3.77  0.00016
#> religiousness    -1.6163     0.4244   -3.81  0.00014
#> occupation        0.3240     0.2544    1.27  0.20262
#> rating           -2.2070     0.4082   -5.41  6.4e-08
#> Log(scale)        2.1727     0.0673   32.27  < 2e-16
#>
#> Scale: 8.78
#> Gaussian distribution
#> Number of Newton-Raphson Iterations: 4
#> Log-likelihood: -706 on 7 Df
#> Wald-statistic: 67.7 on 5 Df, p-value: 3.1e-13
```

The `Estimate` column gives coefficients of the latent model: for every extra year of marriage, the latent propensity for affairs rises by 0.53 units, holding everything else fixed. `Log(scale)` is the log of the residual standard deviation, and `exp(2.17) = 8.78` is the estimated $\sigma$. The log-likelihood and Wald statistic tell us the whole set of predictors is strongly jointly significant.

[KEY INSIGHT]
**Tobit treats the floor (or ceiling) as a window that partially hides a normally distributed latent variable.** Coefficients describe that underlying propensity, not the observed values directly, which is why interpretation needs care (see Section 4).

**Try it:** Drop `religiousness` from the model and refit as `ex_mod`. Does the `yearsmarried` coefficient change much when you remove a correlated predictor?

```r title="Your turn: refit without religiousness"
# Try it: fit a Tobit model without religiousness
ex_mod <- tobit(affairs ~ age + yearsmarried + occupation + rating,
                data = Affairs)

# Inspect the yearsmarried coefficient
coef(ex_mod)["yearsmarried"]
#> Expected: a positive value, slightly different from 0.5323
```

<details>
<summary>Click to reveal solution</summary>

```r title="Refit without religiousness solution"
ex_mod <- tobit(affairs ~ age + yearsmarried + occupation + rating,
                data = Affairs)
coef(ex_mod)["yearsmarried"]
#> yearsmarried
#>    0.4957
```

**Explanation:** Dropping a correlated predictor shifts the `yearsmarried` coefficient because the model now has to absorb part of what `religiousness` was explaining. The change is small here because the two predictors are only weakly correlated.

</details>

## Why does OLS fail on censored outcomes?

When the outcome is censored at zero, OLS treats every zero as a genuine low observation. The fitted line is pulled down by all those clustered points, so the estimated slope shrinks toward zero. Tobit acknowledges that any observation at the limit could really be any value at or below it, and adjusts the likelihood to recover the true slope.

```r title="Simulate censored data and compare OLS with Tobit"
# Set up a reproducible simulation
set.seed(2026)
n <- 400
sim_x <- rnorm(n)
# True latent outcome: slope = 2, intercept = 0, noise sd = 1.5
y_star <- 2 * sim_x + rnorm(n, sd = 1.5)
# Observed outcome: everything below 0 is recorded as exactly 0
y_obs <- pmax(y_star, 0)

ols_mod   <- lm(y_obs ~ sim_x)
tobit_sim <- tobit(y_obs ~ sim_x, left = 0)

# Side-by-side slope estimates
round(c(true_slope = 2,
        ols_slope   = coef(ols_mod)["sim_x"],
        tobit_slope = coef(tobit_sim)["sim_x"]), 3)
#> true_slope ols_slope.sim_x tobit_slope.sim_x
#>      2.000           1.291             1.982
```

OLS estimates the slope at about 1.29, far short of the true value of 2.00. Tobit recovers the true slope almost exactly (1.98). The gap is the *attenuation bias* that censoring introduces into OLS, and it grows as more observations sit at the limit.

[WARNING]
**OLS coefficients are attenuated when the outcome is censored.** The stronger the censoring (more values stuck at the limit), the worse the bias. Tobit corrects it by estimating the limit-aware likelihood directly.

![Choose Tobit when the outcome has a known limit and values pile up at it; choose OLS or truncated regression otherwise.](screenshots/Tobit-Regression-in-R-when-to-use.webp)
*Figure 1: Choose Tobit when the outcome has a known limit and values pile up at it; choose OLS or truncated regression otherwise.*

Truncated regression, a close cousin, is for a different problem: data where observations beyond the limit are not just clipped but missing entirely from the sample. Tobit is the right choice when every observation is still in the data, just flattened at the boundary.

**Try it:** Re-run the same simulation but censor at `2` instead of `0`. How much worse does the OLS bias become when roughly half the observations end up at the limit?

```r title="Your turn: simulate with higher censoring"
# Try it: change the censoring point to 2
set.seed(2026)
ex_x <- rnorm(400)
ex_y_star <- 2 * ex_x + rnorm(400, sd = 1.5)
ex_y_obs  <- pmax(ex_y_star, 2)

# your code here: fit both models and compare slopes
```

<details>
<summary>Click to reveal solution</summary>

```r title="Higher censoring solution"
set.seed(2026)
ex_x <- rnorm(400)
ex_y_star <- 2 * ex_x + rnorm(400, sd = 1.5)
ex_y_obs  <- pmax(ex_y_star, 2)

ex_ols   <- lm(ex_y_obs ~ ex_x)
ex_tobit <- tobit(ex_y_obs ~ ex_x, left = 2)

round(c(ols = coef(ex_ols)["ex_x"],
        tobit = coef(ex_tobit)["ex_x"]), 3)
#>   ols.ex_x tobit.ex_x
#>      0.703      2.005
```

**Explanation:** With censoring at 2, more than half of the latent values are below the floor, so OLS shrinks the slope to about 0.70, a severe bias. Tobit still recovers the true slope of 2.

</details>

## How do the left and right arguments work in tobit()?

The `tobit()` function signature is `tobit(formula, left = 0, right = Inf, dist = "gaussian", data)`. The `left` and `right` arguments define the censoring window. Any observation at `left` is treated as left-censored (its true value could be anywhere at or below `left`), and any observation at `right` is treated as right-censored. Setting either bound to `-Inf` or `Inf` turns off censoring on that side.

```r title="Fit three variants with different censoring bounds"
# Default: left-censored at 0 (classical Tobit)
tobit_def <- tobit(affairs ~ age + yearsmarried + rating, data = Affairs)

# No censoring on either side (equivalent to OLS with survival-style standard errors)
tobit_unbounded <- tobit(affairs ~ age + yearsmarried + rating,
                         left = -Inf, right = Inf, data = Affairs)

# Two-sided censoring: the Affairs question caps at 12 per year in the survey;
# we also right-censor at 4 to mirror the example in the AER documentation
tobit_right4 <- tobit(affairs ~ age + yearsmarried + rating,
                      left = 0, right = 4, data = Affairs)

round(rbind(default   = coef(tobit_def),
            unbounded = coef(tobit_unbounded),
            right4    = coef(tobit_right4)), 3)
#>           (Intercept)    age yearsmarried  rating
#> default         8.174 -0.179        0.554 -2.285
#> unbounded       3.861 -0.049        0.156 -0.772
#> right4          7.810 -0.116        0.481 -1.815
```

All three models use the same formula and data, but their coefficients differ because they disagree about how much information the boundary values carry. The unbounded fit looks very different from the default because it ignores the 451 zeros entirely. The two-sided model sits in between, acknowledging that anyone reporting `4` might well have had more affairs but simply topped out at the category.

[NOTE]
**The defaults `left = 0, right = Inf` encode the classical Tobit model.** Set `left = -Inf` to drop left-censoring and `right = Inf` to drop right-censoring. If your data has no censoring at all, use `lm()` instead, it is faster and has simpler inference.

**Try it:** Fit `tobit(affairs ~ age + yearsmarried + rating, left = -Inf, right = 3, data = Affairs)` and call the result `ex_right3`. Is the `rating` coefficient larger in magnitude than in the default model?

```r title="Your turn: right-censor at 3"
# Try it: fit with right-censoring at 3 and no left censoring
ex_right3 <- tobit(affairs ~ age + yearsmarried + rating,
                   left = -Inf, right = 3, data = Affairs)

# your code here: compare coefficients
```

<details>
<summary>Click to reveal solution</summary>

```r title="Right-censoring at 3 solution"
ex_right3 <- tobit(affairs ~ age + yearsmarried + rating,
                   left = -Inf, right = 3, data = Affairs)

round(cbind(default = coef(tobit_def), right3 = coef(ex_right3)), 3)
#>              default  right3
#> (Intercept)    8.174   2.964
#> age           -0.179  -0.048
#> yearsmarried   0.554   0.155
#> rating        -2.285  -0.710
```

**Explanation:** Switching off left-censoring makes the zeros count as real low values, which pulls all coefficients toward zero. The `rating` coefficient shrinks from -2.29 to -0.71 in magnitude.

</details>

## How do you interpret Tobit coefficients?

A Tobit coefficient $\beta_j$ is the effect of predictor $x_j$ on the **latent** outcome $y^*$. It tells us how the underlying propensity changes, not the observed value. The latent model is:

$$y^* = X\beta + \varepsilon, \quad \varepsilon \sim N(0, \sigma^2)$$

$$y = \max(y^*, 0)$$

Where:
- $y^*$ is the unobserved latent propensity
- $y$ is the observed (censored) outcome
- $\beta$ are the coefficients returned by `coef(tobit_mod)`
- $\sigma$ is `exp(Log(scale))` from the summary

Because many observed $y$ values are stuck at the floor, the effect on the **observed** outcome is smaller than $\beta_j$. A standard adjustment scales the latent coefficient by the probability of being above the limit:

$$\frac{\partial E[y \mid x]}{\partial x_j} \approx \beta_j \cdot P(y^* > 0 \mid x)$$

Where $P(y^* > 0 \mid x) = \Phi(X\beta / \sigma)$ using the standard normal CDF $\Phi$.

```r title="Compute the marginal effect on the observed outcome"
# Linear predictor Xbeta for every row
xb <- predict(tobit_mod, type = "lp")
# Scale of the latent error
sigma <- tobit_mod$scale

# Probability that y* > 0 for each row
p_uncens <- pnorm(xb / sigma)

# Average partial effect of yearsmarried on the observed affairs count
beta_years <- coef(tobit_mod)["yearsmarried"]
ame_years  <- beta_years * mean(p_uncens)

round(c(latent_effect = beta_years,
        avg_marginal  = ame_years,
        pct_uncensored = mean(Affairs$affairs > 0)), 3)
#> latent_effect.yearsmarried avg_marginal.yearsmarried pct_uncensored
#>                      0.532                     0.134          0.251
```

The latent coefficient says one more year of marriage raises the propensity for affairs by 0.53 units. But only about 25% of respondents are above the censoring floor, so the average effect on the observed count is roughly 0.13 affairs per year of marriage. That second number is what we would report when predicting real-world outcomes; the first is what we would report when describing the underlying model.

[KEY INSIGHT]
**Tobit reports latent effects; your story dictates which to quote.** Latent effects are right for mechanism or policy questions ("how does the underlying tendency change?"). Observed-outcome effects are right for prediction or cost-benefit analysis ("how many more events will we actually see?").

**Try it:** Compute the average marginal effect of `age` on observed affairs. It should be a small negative number.

```r title="Your turn: marginal effect of age"
# Try it: compute the average marginal effect of age
beta_age <- coef(tobit_mod)["age"]
# your code here: reuse xb, sigma, p_uncens from above
ame_age <- NULL

ame_age
#> Expected: a small negative value, close to -0.045
```

<details>
<summary>Click to reveal solution</summary>

```r title="Marginal effect of age solution"
beta_age <- coef(tobit_mod)["age"]
ame_age  <- beta_age * mean(p_uncens)
round(ame_age, 4)
#>     age
#> -0.0445
```

**Explanation:** The latent coefficient for age (-0.178) is multiplied by the average probability of being uncensored (0.251), giving an observed-scale effect of about -0.045 affairs per year of age.

</details>

## How do you predict and diagnose the fit?

Three tools handle most Tobit diagnostics: predicted values, information criteria, and the likelihood ratio test. The `predict()` method returns latent predictions by default. Information criteria like AIC compare models that do not need to be nested. The likelihood ratio test, from the `lmtest` package, compares nested models with a chi-squared p-value.

```r title="Compare nested Tobit models"
library(lmtest)

# Smaller model: drop occupation
tobit_small <- tobit(affairs ~ age + yearsmarried + religiousness + rating,
                     data = Affairs)

# Likelihood ratio test: does occupation add information?
lrtest(tobit_small, tobit_mod)
#> Likelihood ratio test
#>
#> Model 1: affairs ~ age + yearsmarried + religiousness + rating
#> Model 2: affairs ~ age + yearsmarried + religiousness + occupation + rating
#>   #Df LogLik Df  Chisq Pr(>Chisq)
#> 1   6 -706.8
#> 2   7 -706.0  1  1.615      0.204

# Non-nested comparison via AIC
aic_tab <- data.frame(model = c("small", "full"),
                      AIC   = c(AIC(tobit_small), AIC(tobit_mod)))
aic_tab
#>   model      AIC
#> 1 small 1425.646
#> 2  full 1426.031
```

The likelihood ratio test has a p-value of 0.20, so we cannot reject the simpler model; `occupation` does not significantly improve the fit given the other predictors. AIC agrees: the smaller model wins by about 0.4 points. That is a rounding-error win, so either model is defensible, but the principle of parsimony pushes us to keep the simpler one.

[TIP]
**Prefer likelihood ratio tests over Wald t-tests when trimming Tobit models.** Wald tests from `summary()` can be off when the latent coefficient is close to zero because the scale parameter is estimated jointly. `lrtest()` compares the full likelihoods and is more trustworthy.

**Try it:** Drop `rating` instead of `occupation` from the full model and compare AIC against `tobit_mod`. Is the drop supported?

```r title="Your turn: drop rating"
# Try it: fit a model without rating and compare AIC
ex_no_rating <- tobit(affairs ~ age + yearsmarried + religiousness + occupation,
                      data = Affairs)

# your code here: print AIC for both
```

<details>
<summary>Click to reveal solution</summary>

```r title="Drop rating solution"
ex_no_rating <- tobit(affairs ~ age + yearsmarried + religiousness + occupation,
                      data = Affairs)
round(c(no_rating = AIC(ex_no_rating), full = AIC(tobit_mod)), 2)
#> no_rating      full
#>   1455.99   1426.03
```

**Explanation:** AIC jumps by nearly 30 points when `rating` is dropped, a very strong signal that marriage rating carries real information about infidelity. Keep it in the model.

</details>

## Practice Exercises

### Exercise 1: Two-sided censoring on Affairs

Fit a Tobit model on the `Affairs` data with `left = 0` and `right = 12` using predictors `age`, `yearsmarried`, `religiousness`, and `rating`. Store the model as `px_two_sided`. Then compare its `rating` coefficient against the default left-only model's `rating` coefficient and save both in a named vector called `px_rating_compare`.

```r title="Exercise 1: two-sided censoring"
# Exercise: fit a two-sided Tobit and compare the rating coefficient
# Hint: reuse tobit_mod for the default left-only comparison

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
px_two_sided <- tobit(affairs ~ age + yearsmarried + religiousness + rating,
                      left = 0, right = 12, data = Affairs)

px_rating_compare <- c(left_only = coef(tobit_mod)["rating"],
                       two_sided = coef(px_two_sided)["rating"])
round(px_rating_compare, 3)
#> left_only.rating two_sided.rating
#>           -2.207           -2.311
```

**Explanation:** Only a handful of respondents report 12 affairs, so adding right-censoring at 12 barely changes any coefficient. The two-sided rating effect (-2.31) is very close to the left-only version (-2.21).

</details>

### Exercise 2: Measure OLS bias in a larger simulation

Simulate 500 observations where `x ~ N(0, 1)` and `y_star = 1 + 1.5 * x + rnorm(500, sd = 2)`, then left-censor at 0 to get `y_obs`. Fit both OLS and Tobit on the simulated data. Compute the percentage bias of each slope estimate relative to the true slope of 1.5 and store the results in `px_bias_ols` and `px_bias_tobit`. Use `set.seed(1958)` for reproducibility (a nod to Tobin's original paper year).

```r title="Exercise 2: quantify OLS bias"
# Exercise: simulate censored data, fit both models, compute percentage bias
# Hint: bias_pct = 100 * (estimate - true) / true

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
set.seed(1958)
px_x      <- rnorm(500)
px_y_star <- 1 + 1.5 * px_x + rnorm(500, sd = 2)
px_y_obs  <- pmax(px_y_star, 0)

px_ols   <- lm(px_y_obs ~ px_x)
px_tobit <- tobit(px_y_obs ~ px_x, left = 0)

true_slope    <- 1.5
px_bias_ols   <- 100 * (coef(px_ols)["px_x"]   - true_slope) / true_slope
px_bias_tobit <- 100 * (coef(px_tobit)["px_x"] - true_slope) / true_slope

round(c(ols_pct_bias = px_bias_ols,
        tobit_pct_bias = px_bias_tobit), 2)
#>   ols_pct_bias.px_x tobit_pct_bias.px_x
#>              -26.15                0.44
```

**Explanation:** OLS underestimates the slope by about 26%, a substantial bias driven by the 180-ish simulated observations that sit at the censoring floor. Tobit is essentially unbiased (under 1% off).

</details>

## Complete Example

Let's walk the Affairs data end-to-end: check censoring, fit, interpret, and diagnose. This is the workflow you will run every time you reach for Tobit.

```r title="End-to-end Tobit workflow on Affairs"
# Step 1: inspect the censoring pattern
cen_summary <- c(n_total = nrow(Affairs),
                 n_at_zero = sum(Affairs$affairs == 0),
                 pct_at_zero = round(100 * mean(Affairs$affairs == 0), 1))
cen_summary
#>    n_total   n_at_zero pct_at_zero
#>      601.0       451.0        75.0

# Step 2: fit the Tobit model
full_tobit <- tobit(affairs ~ age + yearsmarried + religiousness + rating,
                    data = Affairs)

# Step 3: report latent coefficients and average marginal effects
xb_full    <- predict(full_tobit, type = "lp")
sigma_full <- full_tobit$scale
p_uncens   <- mean(pnorm(xb_full / sigma_full))

betas <- coef(full_tobit)[-1]  # drop intercept
ame   <- betas * p_uncens
round(cbind(latent = betas, marginal = ame), 3)
#>                latent marginal
#> age            -0.178   -0.046
#> yearsmarried   0.554    0.143
#> religiousness -1.689   -0.436
#> rating        -2.285   -0.590

# Step 4: diagnose fit
c(loglik = as.numeric(logLik(full_tobit)),
  aic    = AIC(full_tobit))
#>    loglik       aic
#>  -706.821  1425.643
```

Three-quarters of responses sit at the floor, so Tobit was clearly the right tool. The latent coefficients say marriage rating has the strongest effect on the underlying propensity, with a one-point higher rating associated with 2.3 fewer units of latent propensity. On the observed scale, that translates to roughly 0.59 fewer affairs per rating point. Log-likelihood and AIC give us anchor numbers to compare against any alternative specification.

## Summary

Tobit regression extends linear regression to censored outcomes, fit in R with `AER::tobit()`. Use it when your dependent variable piles up at a known floor or ceiling and you want unbiased slope estimates.

![A mental map of Tobit regression with AER: fit, interpret, diagnose.](screenshots/Tobit-Regression-in-R-overview-mindmap.webp)
*Figure 2: A mental map of Tobit regression with AER: fit, interpret, diagnose.*

Key takeaways:

| Topic | Takeaway |
|---|---|
| When to use | Outcome clustered at a known limit (spending, detection thresholds, capped scores) |
| Syntax | `tobit(y ~ x, left, right, data)` in the AER package |
| Defaults | `left = 0, right = Inf` (classical left-censored Tobit) |
| OLS vs Tobit | OLS attenuates slopes on censored data; Tobit is unbiased |
| Coefficients | Describe the latent propensity $y^*$, not the observed $y$ |
| Marginal effects | Latent $\beta_j$ times $P(y^* > 0)$ gives the average effect on observed outcome |
| Model comparison | AIC for non-nested, `lmtest::lrtest()` for nested; both use the full likelihood |

## References

1. Kleiber, C. & Zeileis, A. *Applied Econometrics with R* (AER package and book). [CRAN page](https://cran.r-project.org/package=AER)
2. AER `tobit` function reference. [R documentation](https://search.r-project.org/CRAN/refmans/AER/html/tobit.html)
3. Tobin, J. "Estimation of Relationships for Limited Dependent Variables." *Econometrica*, 26(1), 24-36 (1958). [JSTOR](https://www.jstor.org/stable/1907382)
4. UCLA OARC Statistical Consulting. Tobit Models in R. [Tutorial](https://stats.oarc.ucla.edu/r/dae/tobit-models/)
5. Greene, W. *Econometric Analysis*, 7th ed., Chapter 19 on limited dependent variables. Pearson (2012).
6. Wooldridge, J. *Econometric Analysis of Cross Section and Panel Data*, Chapter 17. MIT Press (2010).

## Continue Learning

- [Logistic Regression in R](Logistic-Regression-in-R.html): the parent topic, for binary outcomes where Tobit is the wrong tool.
- [Linear Regression](Linear-Regression.html): the unrestricted model Tobit extends when censoring is absent.
- [Poisson Regression in R](Poisson-Regression-in-R.html): an alternative for count outcomes with many zeros but no true upper or lower limit.
