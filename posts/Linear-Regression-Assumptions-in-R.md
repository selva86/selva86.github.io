---
title: "Linear Regression Assumptions in R: Test All 5 and Know What to Do When They Fail"
slug: "Linear-Regression-Assumptions-in-R"
description: "Test all 5 linear regression assumptions in R with plot.lm(), VIF, Breusch-Pagan, and Durbin-Watson, plus the exact base R remedy when one of them fails."
keywords: "linear regression assumptions in R, OLS assumptions, check linear regression, plot.lm, residual diagnostics, VIF in R, Durbin-Watson, Breusch-Pagan, homoscedasticity, multicollinearity"
auto_link_terms: "linear regression assumptions|OLS assumptions|regression diagnostics|check regression assumptions|assumptions of linear regression|plot.lm|residual diagnostics in R|Durbin-Watson test in R|Breusch-Pagan test|VIF in R"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-26"
curriculum_id: "2.3.3"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Linear Regression Assumptions"
sidebar_order: 8
difficulty: "Intermediate"
---

# Linear Regression Assumptions in R: Test All 5 and Know What to Do When They Fail

<p class="lead">Linear regression in R relies on five assumptions: linearity, independence of errors, homoscedasticity, normality of residuals, and no multicollinearity. When any one of them breaks, your coefficients, standard errors, and p-values become unreliable, so every assumption needs both a diagnostic test and a known fix. This post shows all five using base R so every code block runs in your browser.</p>

## Why do the 5 linear regression assumptions matter?

Ordinary least squares (OLS) returns unbiased slopes only when its assumptions hold. Violate linearity and your predictions curve away from the truth; violate homoscedasticity or independence and the standard errors lie, so p-values stop being trustworthy. Violate the no-multicollinearity condition and individual coefficients swing wildly even when overall fit looks fine. The fastest way to inspect all of this at once is the four-plot diagnostic panel R produces when you call `plot()` on a fitted model.

`par(mfrow = c(2, 2))` arranges all four plots in a single 2x2 grid for scanning at a glance.

```r title="Fit mtcars model and see all 4 diagnostics"
fit <- lm(mpg ~ hp + wt + disp, data = mtcars)

par(mfrow = c(2, 2))
plot(fit)
#> (prints 4 diagnostic plots: Residuals vs Fitted, Q-Q,
#>  Scale-Location, Residuals vs Leverage)

summary(fit)$r.squared
#> [1] 0.8268361
```

One line of code produced the entire dashboard. The top-left (Residuals vs Fitted) tests linearity, the top-right (Q-Q) tests normality of residuals, the bottom-left (Scale-Location) tests homoscedasticity, and the bottom-right (Residuals vs Leverage) surfaces influential points. Our R² is 0.83, which feels great, but that number tells you nothing about whether the *inferences* from this model are valid. That question is what the assumptions answer.

![Each of the four diagnostic plots tests a different assumption.](screenshots/Linear-Regression-Assumptions-in-R-diagnostic-plot-mapping.webp)
*Figure 1: Each of the four diagnostic plots tests a different assumption.*

[KEY INSIGHT]
**Regression assumptions are about the residuals, not the raw data.** You can have skewed, non-normal predictors and still satisfy every assumption, because OLS only cares about how the *errors* behave around the fitted line.

**Try it:** Fit `Petal.Length ~ Sepal.Length + Sepal.Width` on the built-in `iris` dataset, then run `plot()` to see the same 4-panel dashboard.

```r title="Your turn: diagnose the iris model"
# Try it: fit the model and plot diagnostics
ex_fit <- # your code here

par(mfrow = c(2, 2))
plot(ex_fit)
#> Expected: 4 diagnostic plots similar to the mtcars dashboard
```

<details>
<summary>Click to reveal solution</summary>

```r title="iris model diagnostics solution"
ex_fit <- lm(Petal.Length ~ Sepal.Length + Sepal.Width, data = iris)
par(mfrow = c(2, 2))
plot(ex_fit)
```

**Explanation:** `lm()` fits the model and `plot()` dispatches to `plot.lm()`, which renders the same four diagnostic plots for any linear model.

</details>

## How do you test linearity (and what if it fails)?

Linearity means the true relationship between each predictor and the response is a straight line. You don't check this by squinting at scatterplots of y against each x; you check it with the **Residuals vs Fitted** plot. If the assumption holds, residuals should scatter randomly around zero with no visible trend. A U-shape, arch, or curve means the model missed a nonlinear pattern.

Let's isolate the first diagnostic plot from our `fit` model. Passing `which = 1` asks `plot.lm()` for just the Residuals vs Fitted panel.

```r title="Residuals vs Fitted plot only"
par(mfrow = c(1, 1))
plot(fit, which = 1)
#> (renders the Residuals vs Fitted panel with a red smoother)
```

The red curve overlaid on the points is a LOWESS smoother. If linearity holds, that curve should hug the dashed zero-line. A subtle dip near the middle of the fitted-value range, like the one you'll see with this `mtcars` model, hints that the linear fit is slightly off in the middle of the mpg range, but it's not severe.

Let's look at what severe non-linearity looks like, by simulating data where the true relationship is quadratic.

```r title="Simulate a deliberately non-linear y"
set.seed(101)
x_nl <- seq(-3, 3, length.out = 80)
y_nl <- x_nl + 0.5 * x_nl^2 + rnorm(80, sd = 0.4)
nl_fit <- lm(y_nl ~ x_nl)

plot(nl_fit, which = 1)
#> (residuals form a clear U-shape, smoother curves upward)
```

The smoother now traces a smile shape rather than a flat line. That U-shape tells you a single linear term in `x_nl` cannot explain the curved relationship, leaving structure the model missed.

The fix is to add the missing curvature back into the model. Use `poly(x, 2)` to add a quadratic term in a numerically stable way.

```r title="Refit with a quadratic term"
nl_fit2 <- lm(y_nl ~ poly(x_nl, 2))
plot(nl_fit2, which = 1)
#> (residuals now scatter randomly around zero, smoother is flat)
```

The smile flattens out. Adding the squared term gave the model the flexibility to follow the true curve, so the residuals are pure noise again.

[TIP]
**Prefer poly(x, 2) over x + I(x^2).** Raw quadratic terms make `x` and `x^2` highly correlated, which inflates VIF and destabilizes coefficients. `poly()` returns orthogonal polynomials, so each term is uncorrelated with the others.

**Try it:** Add a quadratic `disp` term to the original mtcars model with `poly(disp, 2)` and re-plot Residuals vs Fitted. Does the smoother flatten?

```r title="Your turn: add a quadratic disp term"
# Try it: refit mtcars with poly(disp, 2)
ex_fit_poly <- # your code here

plot(ex_fit_poly, which = 1)
#> Expected: a flatter smoother than the original mtcars fit
```

<details>
<summary>Click to reveal solution</summary>

```r title="Quadratic disp solution"
ex_fit_poly <- lm(mpg ~ hp + wt + poly(disp, 2), data = mtcars)
plot(ex_fit_poly, which = 1)
```

**Explanation:** Adding `poly(disp, 2)` lets the model bend with the true displacement-mpg curve, so the residual pattern flattens.

</details>

## How do you check independence of residuals in R?

Independence means each residual carries no information about its neighbors. The classic risk is time-ordered data, where today's error correlates with yesterday's, but the assumption can also break for spatially clustered data or repeated measures. The standard formal test is the **Durbin-Watson test** from the `lmtest` package, which targets first-order autocorrelation.

We'll load `lmtest` once for this section and the next.

```r title="Durbin-Watson test on the mtcars fit"
library(lmtest)
dwtest(fit)
#> 	Durbin-Watson test
#>
#> data:  fit
#> DW = 1.3624, p-value = 0.01873
#> alternative hypothesis: true autocorrelation is greater than 0
```

The Durbin-Watson statistic ranges from 0 to 4. A value near 2 means no autocorrelation; values below 1.5 suggest positive autocorrelation; values above 2.5 suggest negative. Here DW is 1.36 with p = 0.019, so we reject independence, but `mtcars` is just an arbitrary row order, so this DW result is a false alarm. DW only makes sense when row order has meaning (time, space, or measurement sequence).

To see what real autocorrelation looks like, let's simulate residuals where each error depends on the previous one.

```r title="Simulate AR(1) errors and rerun Durbin-Watson"
set.seed(202)
n <- 100
x_ar <- 1:n
ar_err <- as.numeric(arima.sim(model = list(ar = 0.7), n = n))
ar_y <- 2 + 0.5 * x_ar + ar_err
ar_fit <- lm(ar_y ~ x_ar)

dwtest(ar_fit)
#> 	Durbin-Watson test
#>
#> data:  ar_fit
#> DW = 0.6018, p-value < 2.2e-16
```

DW collapsed toward zero and the p-value is microscopic, exactly the signature of strong positive autocorrelation. The fix is to model the time structure directly: switch to a `gls()` fit with an AR(1) error structure (`nlme::gls`), use Newey-West standard errors (`sandwich::NeweyWest`), or move to a proper time-series model.

[WARNING]
**Cross-sectional data can still violate independence.** Students nested in classrooms, patients in hospitals, repeated measurements per subject, none of these are time-ordered, but their residuals are still correlated within groups. Durbin-Watson cannot detect this; you need clustered standard errors or a mixed-effects model.

**Try it:** Run `dwtest()` on the model `lm(Ozone ~ Solar.R + Wind, data = airquality)`. Note that `airquality` *is* time-ordered (daily readings).

```r title="Your turn: DW on airquality"
# Try it: fit and run dwtest()
ex_aq_fit <- # your code here

dwtest(ex_aq_fit)
#> Expected: DW between 1 and 2 with a small p-value
```

<details>
<summary>Click to reveal solution</summary>

```r title="airquality DW solution"
ex_aq_fit <- lm(Ozone ~ Solar.R + Wind, data = airquality)
dwtest(ex_aq_fit)
```

**Explanation:** The `airquality` dataset records consecutive days, so DW is meaningful here and typically flags positive autocorrelation in the residuals.

</details>

## How do you test homoscedasticity (and when do you transform y)?

Homoscedasticity means the variance of the residuals is the same across all fitted values. The visual check is the **Scale-Location** plot, the bottom-left panel of `plot()`. R plots the square-root of the absolute standardized residuals against fitted values; a flat smoother on a band of points means equal variance.

```r title="Scale-Location plot on mtcars fit"
plot(fit, which = 3)
#> (renders the Scale-Location panel with a red smoother)
```

The smoother in this plot rises slightly as fitted mpg increases, hinting at mild heteroscedasticity, the variance grows for fuel-efficient cars. To make a formal call, use the **Breusch-Pagan test** from `lmtest`. Its null hypothesis is that residual variance is constant.

The Breusch-Pagan statistic regresses the squared residuals on the predictors and tests whether their fitted values explain a meaningful share of the squared-residual variance:

$$BP = n \cdot R^2_{\hat{u}^2}$$

Where:
- $n$ = number of observations
- $R^2_{\hat{u}^2}$ = R-squared from the regression of squared residuals on the original predictors

A small p-value rejects constant variance.

```r title="Breusch-Pagan test on mtcars fit"
bptest(fit)
#> 	studentized Breusch-Pagan test
#>
#> data:  fit
#> BP = 0.84818, df = 3, p-value = 0.838
```

p = 0.84, so we cannot reject homoscedasticity in this model. The Scale-Location wobble was visual noise, not a real variance problem.

When BP does reject (a common pattern: variance increases with the mean), the simplest fix is a `log()` transform of y. Let's run it on `mtcars` to see how the test responds.

```r title="Refit with log(mpg) and rerun Breusch-Pagan"
log_fit <- lm(log(mpg) ~ hp + wt + disp, data = mtcars)
bptest(log_fit)
#> 	studentized Breusch-Pagan test
#>
#> data:  log_fit
#> BP = 1.3349, df = 3, p-value = 0.7211
```

The transformation barely shifted things here because there was no real heteroscedasticity to fix. On a dataset where BP was significant, you would expect the p-value to climb above 0.05 after the log.

[NOTE]
**If transformation does not fix it, use heteroscedasticity-robust standard errors.** The function `sandwich::vcovHC(fit)` returns a corrected covariance matrix; pair it with `lmtest::coeftest()` to get robust p-values without changing the model formula.

**Try it:** Run `bptest()` on `ex_fit` (the iris model from earlier). Is the variance constant?

```r title="Your turn: BP on iris model"
# Try it: run the Breusch-Pagan test
bptest(ex_fit)
#> Expected: a BP statistic with a p-value
```

<details>
<summary>Click to reveal solution</summary>

```r title="iris BP solution"
bptest(ex_fit)
```

**Explanation:** No new code needed, `bptest()` accepts any `lm` object directly. The iris model's BP p-value is well above 0.05, so homoscedasticity holds.

</details>

## How do you test normality of residuals in R?

Normality means residuals are drawn from a normal distribution. This assumption matters for inference (confidence intervals, p-values) but not for the point estimates of coefficients. The visual check is the **Q-Q plot**, the top-right panel, which plots the empirical residual quantiles against the theoretical normal quantiles. If residuals are normal, the points fall on the dashed line.

```r title="Q-Q plot of residuals"
plot(fit, which = 2)
#> (Q-Q plot: most points hug the line, with mild deviation in tails)
```

In the mtcars model, the middle of the distribution sits on the line and the tails curve away slightly. That tail divergence is the signature of mild non-normality, common in real data.

For a formal test, use `shapiro.test()` on the residuals. Its null hypothesis is that the residuals are drawn from a normal distribution, so a small p-value rejects normality.

```r title="Shapiro-Wilk test plus a histogram"
shapiro.test(residuals(fit))
#> 	Shapiro-Wilk normality test
#>
#> data:  residuals(fit)
#> W = 0.95566, p-value = 0.2071

hist(residuals(fit), breaks = 10, main = "Residuals of mtcars fit",
     xlab = "Residual", col = "lightblue")
#> (renders a roughly bell-shaped histogram)
```

The Shapiro-Wilk p-value is 0.21, so we fail to reject normality. The histogram backs that up, the shape is roughly bell-like, with a slight right skew. When normality fails (p < 0.05), the standard fixes are: transform y (log, square-root, or Box-Cox via `MASS::boxcox()`), or compute bootstrap confidence intervals (`car::Boot()`) to side-step the assumption entirely.

[KEY INSIGHT]
**With n > 30 the Central Limit Theorem covers small-to-moderate deviations from normality.** Coefficient sampling distributions are approximately normal even when the residuals themselves are not, so judge Q-Q plots on the tails, extreme departures are what break inference, not minor wobbles in the middle.

**Try it:** Run `shapiro.test()` on the residuals of the autocorrelated model `ar_fit` from earlier.

```r title="Your turn: shapiro.test on ar_fit"
# Try it: shapiro.test on residuals(ar_fit)
shapiro.test(residuals(ar_fit))
#> Expected: a W statistic and p-value
```

<details>
<summary>Click to reveal solution</summary>

```r title="ar_fit shapiro solution"
shapiro.test(residuals(ar_fit))
```

**Explanation:** The AR(1) errors were Gaussian by construction, so Shapiro-Wilk should *not* reject normality even though independence is badly violated. This is a clean reminder that each assumption is independent of the others.

</details>

## How do you detect and fix multicollinearity in R?

Multicollinearity means two or more predictors carry overlapping information. Perfect multicollinearity (one predictor is an exact linear combination of others) makes `lm()` fail outright. The more common case is *near* multicollinearity, which doesn't crash anything but inflates the standard errors of correlated coefficients, so individual t-tests stop being meaningful.

The standard diagnostic is the **Variance Inflation Factor (VIF)** for each predictor. VIF for predictor $j$ is computed by regressing $x_j$ on every other predictor:

$$VIF_j = \frac{1}{1 - R^2_j}$$

Where $R^2_j$ is the R-squared from that auxiliary regression. The minimum is 1 (predictor is uncorrelated with the others); 5 is a common warning threshold; 10 is the "definitely a problem" line.

```r title="VIF on mtcars 3-predictor fit"
library(car)
vif(fit)
#>       hp       wt     disp
#> 2.736633 4.844618 7.324517
```

`disp` has VIF 7.3, above the warning threshold of 5 and creeping toward 10. Engine displacement and weight track each other closely in cars, so the model can't separate their individual effects cleanly. The simplest fix is to drop the redundant predictor.

```r title="Refit dropping disp and recompute VIF"
fit2 <- lm(mpg ~ hp + wt, data = mtcars)
vif(fit2)
#>       hp       wt
#> 1.766625 1.766625

summary(fit2)$coefficients
#>                Estimate  Std. Error   t value     Pr(>|t|)
#> (Intercept) 37.22727012 1.598788108 23.284689 2.565459e-20
#> hp          -0.03177295 0.009030763 -3.518712 1.451229e-03
#> wt          -3.87783074 0.632663019 -6.128695 1.119647e-06
```

Both VIFs dropped to 1.77, and the standard errors of `hp` and `wt` shrank, so their t-statistics became sharper. Dropping `disp` cost almost nothing in R² (try `summary(fit2)$r.squared` to confirm) but bought us cleaner inference on the remaining coefficients.

[TIP]
**Multicollinearity does not bias predictions, only individual coefficients.** If you only care about the model's $\hat{y}$ output and not about interpreting individual slopes, you can leave correlated predictors in place. If you care about which predictor drives the response, drop or combine them, or switch to ridge regression (`glmnet::glmnet(alpha = 0)`).

![Pick the remedy by which assumption broke.](screenshots/Linear-Regression-Assumptions-in-R-remedy-decision.webp)
*Figure 2: Pick the remedy by which assumption broke.*

**Try it:** Fit `mpg ~ hp + wt + disp + cyl` on `mtcars` and run `vif()`. Which predictor has the highest VIF?

```r title="Your turn: VIF on a 4-predictor mtcars model"
# Try it: fit the 4-predictor model and run vif()
ex_vif_fit <- # your code here

vif(ex_vif_fit)
#> Expected: 4 VIFs, with the largest above 5
```

<details>
<summary>Click to reveal solution</summary>

```r title="4-predictor VIF solution"
ex_vif_fit <- lm(mpg ~ hp + wt + disp + cyl, data = mtcars)
vif(ex_vif_fit)
```

**Explanation:** Cylinder count is correlated with both displacement and horsepower, so adding it pushes several VIFs higher. `disp` typically lands at the top of the list.

</details>

## Practice Exercises

These exercises combine multiple assumptions and remedies. Use distinct variable names so you don't overwrite the tutorial state.

### Exercise 1: Diagnose the diamonds-subset model

Take a 1000-row sample of `ggplot2::diamonds`, fit `price ~ carat + depth + table`, and run all four diagnostic plots. Save the fit to `dia_fit` and the sample to `dia_sample`. Identify two assumptions that are violated.

```r title="Exercise 1 starter: diamonds diagnostics"
# Hint: use set.seed(1), dplyr::slice_sample(), then plot(dia_fit)

library(ggplot2)
set.seed(1)

dia_sample <- # take 1000 rows of diamonds
dia_fit    <- # fit price ~ carat + depth + table

par(mfrow = c(2, 2))
plot(dia_fit)
#> Expected: 4 panels, with non-linearity and heteroscedasticity visible
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
library(ggplot2)
set.seed(1)
dia_sample <- diamonds[sample(nrow(diamonds), 1000), ]
dia_fit    <- lm(price ~ carat + depth + table, data = dia_sample)

par(mfrow = c(2, 2))
plot(dia_fit)
```

**Explanation:** Two violations show up clearly. Residuals vs Fitted curves upward (linearity fails, diamond price is nonlinear in carat). Scale-Location fans outward (variance grows with predicted price, heteroscedasticity).

</details>

### Exercise 2: Fix heteroscedasticity by transforming y

Stay with `dia_sample` from Exercise 1. Fit two simple models, `lm(price ~ carat)` and `lm(log(price) ~ log(carat))`, and compare their Breusch-Pagan p-values. Save the log-log fit as `dia_log_fit`.

```r title="Exercise 2 starter: log-log fit and BP comparison"
# Hint: bptest() takes any lm object

dia_log_fit <- # fit log(price) ~ log(carat) on dia_sample

bptest(lm(price ~ carat, data = dia_sample))
bptest(dia_log_fit)
#> Expected: first BP p-value tiny, second much closer to 0.05+
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
dia_log_fit <- lm(log(price) ~ log(carat), data = dia_sample)
bptest(lm(price ~ carat, data = dia_sample))
bptest(dia_log_fit)
```

**Explanation:** The raw `price ~ carat` model has variance that explodes at high carats, so BP rejects strongly. Logging both sides stabilizes the variance because percentage changes in carat now map to percentage changes in price, on a roughly constant scale.

</details>

### Exercise 3: Reduce VIF by dropping a redundant predictor

Start from `cap3_fit <- lm(mpg ~ hp + wt + disp + cyl, data = mtcars)`. Run `vif()` to find the predictor with the largest VIF, drop it, and verify the remaining three VIFs are all under 5. Save the dropped predictor's name in `cap3_drop`.

```r title="Exercise 3 starter: drop the worst predictor"
# Hint: which.max() finds the index of the largest VIF

cap3_fit  <- lm(mpg ~ hp + wt + disp + cyl, data = mtcars)
cap3_vifs <- vif(cap3_fit)

cap3_drop <- # name of predictor with largest VIF

# refit without cap3_drop, then run vif() again
#> Expected: all 3 remaining VIFs below 5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
cap3_fit  <- lm(mpg ~ hp + wt + disp + cyl, data = mtcars)
cap3_vifs <- vif(cap3_fit)
cap3_drop <- names(cap3_vifs)[which.max(cap3_vifs)]
cap3_drop
#> [1] "disp"

cap3_fit2 <- lm(mpg ~ hp + wt + cyl, data = mtcars)
vif(cap3_fit2)
#>       hp       wt      cyl
#> 3.258481 2.580486 4.757148
```

**Explanation:** `disp` had the highest VIF in the four-predictor model. Dropping it brings every remaining VIF below 5, restoring stable individual coefficient estimates.

</details>

## Complete Example

Let's run the full diagnostic checklist on a fresh dataset. The `swiss` dataset (47 Swiss provinces, 1888) regresses fertility on social indicators. We will fit one model and walk through every assumption in order.

```r title="Complete diagnostic walkthrough on swiss"
swiss_fit <- lm(Fertility ~ ., data = swiss)

# 1. Visual check: 4-panel diagnostic
par(mfrow = c(2, 2))
plot(swiss_fit)

# 2. Independence (Durbin-Watson)
dwtest(swiss_fit)
#> DW = 1.7261, p-value = 0.1146      <-- independence: OK

# 3. Homoscedasticity (Breusch-Pagan)
bptest(swiss_fit)
#> BP = 7.025, df = 5, p-value = 0.2192   <-- homoscedasticity: OK

# 4. Normality of residuals (Shapiro-Wilk)
shapiro.test(residuals(swiss_fit))
#> W = 0.97307, p-value = 0.3531          <-- normality: OK

# 5. Multicollinearity (VIF)
vif(swiss_fit)
#>      Agriculture      Examination       Education        Catholic Infant.Mortality
#>         2.284129         3.675420        2.774943        1.937160         1.107542
#>                                          <-- multicollinearity: OK (all under 5)
```

Every assumption passes. The four-panel plot shows no obvious curve, the Q-Q points hug the line, and all formal tests have p-values above 0.05. We did all this without leaving base R plus the two small helpers `lmtest` and `car`. For a real-world dataset, this is the entire battery you should run on every regression you publish.

## Summary

The five OLS assumptions, the diagnostic that surfaces each one, and the standard fix when it fails:

![The five OLS assumptions at a glance.](screenshots/Linear-Regression-Assumptions-in-R-five-assumptions-overview.webp)
*Figure 3: The five OLS assumptions at a glance.*

| Assumption | Visual diagnostic | Formal test | Common remedy |
|---|---|---|---|
| Linearity | `plot(fit, which = 1)` | n/a | `poly()` term, log/sqrt of x |
| Independence | residuals over time/index | `lmtest::dwtest()` | GLS, Newey-West, mixed model |
| Homoscedasticity | `plot(fit, which = 3)` | `lmtest::bptest()` | log y, WLS, `vcovHC` robust SE |
| Normality of residuals | `plot(fit, which = 2)` | `shapiro.test(residuals(fit))` | Transform y, bootstrap CI |
| No multicollinearity | pairs plot, correlation | `car::vif(fit)` | Drop predictor, ridge regression |

Run the four-plot panel as your first move on every regression. Then add the formal tests when the visuals are ambiguous. The remedy in the last column is the *first* thing to try; if it doesn't fix the violation, you escalate (e.g., from log-transform to robust SEs, or from drop-predictor to ridge regression).

## References

1. R Core Team, `plot.lm` documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/plot.lm.html)
2. Zeileis, A. & Hothorn, T., *Diagnostic Checking in Regression Relationships*. R News, 2(3), 7-10. (lmtest package vignette) [Link](https://cran.r-project.org/web/packages/lmtest/vignettes/lmtest-intro.pdf)
3. Fox, J. & Weisberg, S., *An R Companion to Applied Regression*, 3rd Edition. Sage (2019). Chapter 8 covers `vif()` and regression diagnostics. [Link](https://socialsciences.mcmaster.ca/jfox/Books/Companion/)
4. James, G., Witten, D., Hastie, T., & Tibshirani, R., *An Introduction to Statistical Learning with Applications in R*. Springer (2021). Chapter 3.3, Potential Problems. [Link](https://www.statlearning.com/)
5. Faraway, J., *Linear Models with R*, 2nd Edition. CRC Press (2014). Chapters 6-7. [Link](https://julianfaraway.github.io/faraway/LMR/)
6. UVA Library, *Understanding Diagnostic Plots for Linear Regression Analysis*. [Link](https://library.virginia.edu/data/articles/diagnostic-plots)

## Continue Learning

- [Linear Regression in R](Linear-Regression.html), Build models with `lm()` and interpret coefficients before diagnosing them.
- [Outlier Treatment in R](Outlier-Treatment-With-R.html), Detect and handle the high-leverage points that distort regression diagnostics.
- [Logistic Regression in R](Logistic-Regression-With-R.html), When y is binary, OLS assumptions don't apply; switch to a generalized linear model.
