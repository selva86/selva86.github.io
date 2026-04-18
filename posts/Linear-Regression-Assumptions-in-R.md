---
title: "Linear Regression Assumptions in R: Test All 5 and Know What to Do When They Fail"
slug: "Linear-Regression-Assumptions-in-R"
description: "Test the 5 linear regression assumptions in R with plot.lm(), VIF, Breusch-Pagan, and Durbin-Watson, plus the exact remedy to apply when any assumption fails."
keywords: "linear regression assumptions in R, OLS assumptions, check linear regression, plot.lm, residual diagnostics, VIF in R, Durbin-Watson R, Breusch-Pagan R, homoscedasticity, multicollinearity"
auto_link_terms: "linear regression assumptions|OLS assumptions|regression diagnostics|check regression assumptions|assumptions of linear regression|plot.lm|residual diagnostics in R|Durbin-Watson test in R|Breusch-Pagan test|VIF in R"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-18"
curriculum_id: "2.3.3"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Linear Regression Assumptions"
sidebar_order: 8
difficulty: "Intermediate"
---

# Linear Regression Assumptions in R: Test All 5 and Know What to Do When They Fail

<p class="lead">Linear regression in R relies on five assumptions: linearity, independence of errors, homoscedasticity, normality of residuals, and no multicollinearity. When any one of them breaks, your coefficients, standard errors, and p-values become unreliable, so every assumption needs both a diagnostic test and a known fix. This post shows all five, using base R so every code block runs in your browser.</p>

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
#> (prints the Residuals vs Fitted plot with a red LOESS smoother)
```

The red LOESS curve should hug the horizontal zero line. In our `mtcars` model it dips, then rises, hinting that the true relationship between `mpg` and its predictors curves. That is a linearity violation, and the fix is to let the model bend.

[TIP]
**A U-shape or arch in Residuals vs Fitted is the model telling you it missed a curve.** Adding a polynomial term like `poly(hp, 2)` or a transformation like `log(hp)` usually flattens it.

Refitting with a quadratic term on `hp` lets the model capture the curvature without abandoning OLS.

```r title="Refit with a quadratic term"
fit_poly <- lm(mpg ~ poly(hp, 2) + wt + disp, data = mtcars)

par(mfrow = c(1, 1))
plot(fit_poly, which = 1)
#> (residuals now scatter around zero with no visible trend)

summary(fit_poly)$r.squared
#> [1] 0.8778889
```

The smoother is now much flatter, R² climbed from 0.83 to 0.88, and we've addressed the linearity issue without changing the core model family. If a polynomial still leaves a visible pattern, try a log transform on the response or a spline (`splines::ns()`).

**Try it:** Fit `Temp ~ Ozone` on the built-in `airquality` dataset (use complete cases), inspect `plot(..., which = 1)`, then refit with `log(Ozone)` and compare.

```r title="Your turn: linearity in airquality"
# Try it: fit the linear model, check, then refit with log
aq <- na.omit(airquality)
ex_aq_fit <- # your code here

par(mfrow = c(1, 1))
plot(ex_aq_fit, which = 1)
#> Expected: a noticeable curve in the residuals
```

<details>
<summary>Click to reveal solution</summary>

```r title="airquality linearity solution"
aq <- na.omit(airquality)
ex_aq_fit <- lm(Temp ~ Ozone, data = aq)
plot(ex_aq_fit, which = 1)

ex_aq_log <- lm(Temp ~ log(Ozone), data = aq)
plot(ex_aq_log, which = 1)
```

**Explanation:** The raw model shows an arch because high Ozone days are hotter but with diminishing returns. Taking `log(Ozone)` straightens the relationship.

</details>

## How do you check independence of residuals in R?

Independence means your errors are not correlated with each other. When data is collected in time order (daily sales, weekly temperatures, monthly traffic), residuals often carry autocorrelation: a positive error today is followed by a positive error tomorrow. That breaks OLS's variance formula, so standard errors shrink and p-values look better than they are.

The **Durbin-Watson (DW)** statistic tests for first-order autocorrelation in residuals:

$$DW = \frac{\sum_{i=2}^{n}(e_i - e_{i-1})^2}{\sum_{i=1}^{n} e_i^2}$$

Where:

- $e_i$ is the residual for observation $i$
- $n$ is the number of observations
- DW ≈ 2 means no autocorrelation
- DW < 1.5 suggests positive autocorrelation (the usual problem)
- DW > 2.5 suggests negative autocorrelation

We can compute DW directly from the residuals in base R, no extra packages needed.

```r title="Durbin-Watson statistic in base R"
res <- residuals(fit)
dw <- sum(diff(res)^2) / sum(res^2)
dw
#> [1] 1.362623
```

A DW of 1.36 on the mtcars model is a mild positive autocorrelation warning, but `mtcars` is not ordered in time, so the statistic is less meaningful here. The same calculation on a time-ordered dataset would be the real test. What matters is knowing how to get the number and read it.

[NOTE]
**`car::durbinWatsonTest()` gives the same statistic plus a p-value and bootstrap CI** in local RStudio: `car::durbinWatsonTest(fit)`. The `car` package is not pre-compiled for WebR, so the manual formula above is your drop-in equivalent here.

If DW flags autocorrelation, the fix is to acknowledge the time structure: add lagged predictors, switch to generalized least squares with `nlme::gls(..., correlation = corAR1())`, or model the series directly with `arima()` or the `forecast` package. Ignoring autocorrelation and reporting OLS p-values is the silent-bug version of this problem.

**Try it:** Simulate an autocorrelated residual series and confirm the DW statistic drops well below 2.

```r title="Your turn: DW on autocorrelated data"
set.seed(123)
ex_n <- 100
ex_noise <- numeric(ex_n)
for (i in 2:ex_n) ex_noise[i] <- 0.7 * ex_noise[i - 1] + rnorm(1)

# Compute DW on ex_noise
ex_dw <- # your code here
ex_dw
#> Expected: a value well below 1.5
```

<details>
<summary>Click to reveal solution</summary>

```r title="autocorrelation DW solution"
set.seed(123)
ex_n <- 100
ex_noise <- numeric(ex_n)
for (i in 2:ex_n) ex_noise[i] <- 0.7 * ex_noise[i - 1] + rnorm(1)

ex_dw <- sum(diff(ex_noise)^2) / sum(ex_noise^2)
ex_dw
#> [1] 0.5821024
```

**Explanation:** The AR(1) process builds strong positive correlation between consecutive values, so DW drops far from 2, the benchmark for independent errors.

</details>

## How do you test homoscedasticity (and when do you transform y)?

Homoscedasticity means residual variance is constant across the range of fitted values. Heteroscedasticity, its opposite, shows up as a cone or fan shape in the residual plots: small errors at low fitted values, large errors at high ones (or vice versa). That inflates some standard errors and deflates others, so confidence intervals become meaningless even though the point estimates stay unbiased.

The **Scale-Location plot** (`plot(fit, which = 3)`) shows $\sqrt{|standardized~residuals|}$ against fitted values. A flat red smoother confirms constant variance; a sloped or curved smoother confirms heteroscedasticity.

```r title="Scale-Location plot for homoscedasticity"
par(mfrow = c(1, 1))
plot(fit, which = 3)
#> (prints Scale-Location plot; red line should be roughly flat)
```

For the `mtcars` model, the red smoother rises toward higher fitted values, a classic heteroscedasticity signal. The fix is usually a transformation of the response that stabilizes variance.

[WARNING]
**Ignoring heteroscedasticity keeps your coefficient point estimates valid but destroys your p-values and confidence intervals.** Never report inferences from a heteroscedastic model without either fixing it or using robust standard errors.

Log-transforming the response is the most common remedy when variance grows with the fitted value.

```r title="Log-transform the response and recheck"
fit_log <- lm(log(mpg) ~ hp + wt + disp, data = mtcars)

par(mfrow = c(1, 1))
plot(fit_log, which = 3)
#> (red smoother is now noticeably flatter)
```

The Scale-Location plot is much flatter after the log transform, so variance is now roughly constant on the log scale. If a transformation isn't appropriate, use weighted least squares (`lm(..., weights = ...)`) or report heteroscedasticity-consistent standard errors (available via `sandwich::vcovHC()` in local R).

[NOTE]
**`lmtest::bptest()` gives the formal Breusch-Pagan test** with a p-value in local RStudio: small p-values reject the null of homoscedasticity. The Scale-Location plot tells you essentially the same story and is WebR-native.

**Try it:** Fit `mpg ~ hp` on mtcars, check Scale-Location, then refit as `log(mpg) ~ hp` and compare.

```r title="Your turn: fix heteroscedasticity"
ex_simple <- lm(mpg ~ hp, data = mtcars)
plot(ex_simple, which = 3)

# Now refit with log(mpg) and plot again
ex_simple_log <- # your code here
plot(ex_simple_log, which = 3)
#> Expected: a flatter red smoother in the log version
```

<details>
<summary>Click to reveal solution</summary>

```r title="log-transform solution"
ex_simple <- lm(mpg ~ hp, data = mtcars)
plot(ex_simple, which = 3)

ex_simple_log <- lm(log(mpg) ~ hp, data = mtcars)
plot(ex_simple_log, which = 3)
```

**Explanation:** `log(mpg)` compresses large values more than small ones, which pulls in the cone shape and flattens the Scale-Location curve.

</details>

## How do you test normality of residuals in R?

Normality says the residuals are approximately normally distributed. This assumption mainly matters for small-sample inference: confidence intervals and prediction intervals rely on it. Coefficient point estimates stay valid without it, and the Central Limit Theorem often covers large samples anyway.

The Q-Q plot is the standard visual diagnostic. If residuals are normal, the points fall along the diagonal reference line. Heavy tails bow away from the line at the ends.

```r title="Q-Q plot and Shapiro-Wilk test"
res <- residuals(fit)

par(mfrow = c(1, 1))
qqnorm(res)
qqline(res, col = "red")

shapiro.test(res)
#>
#>  Shapiro-Wilk normality test
#>
#> data:  res
#> W = 0.94236, p-value = 0.08693
```

The Q-Q plot is mostly on the line with mild tail deviation, and Shapiro-Wilk's p-value is 0.087, above the usual 0.05 threshold, so we don't reject normality. That's the calm outcome. When the plot curves away or the p-value is tiny, you have options.

[TIP]
**Trust the Q-Q shape over the Shapiro-Wilk p-value for n > ~50.** Formal normality tests over-reject with large samples because they detect trivial deviations the Q-Q plot (and your inference) would ignore.

If residuals are visibly non-normal, the most common remedies are: transform the response (log, square root, or Box-Cox via `MASS::boxcox()`), trim outliers with clear justification, or use bootstrap confidence intervals (`boot` package) that don't require the normality assumption.

**Try it:** Run `shapiro.test()` on the residuals of `mpg ~ hp` (simpler model) and interpret the p-value.

```r title="Your turn: normality on a simpler model"
ex_norm <- lm(mpg ~ hp, data = mtcars)
ex_res <- # your code here

shapiro.test(ex_res)
#> Expected: a p-value, interpret against 0.05
```

<details>
<summary>Click to reveal solution</summary>

```r title="normality test solution"
ex_norm <- lm(mpg ~ hp, data = mtcars)
ex_res <- residuals(ex_norm)

shapiro.test(ex_res)
#>
#>  Shapiro-Wilk normality test
#>
#> data:  ex_res
#> W = 0.93793, p-value = 0.0651
```

**Explanation:** p = 0.065 is above 0.05, so we fail to reject normality. With only 32 rows, Shapiro-Wilk has limited power, so the Q-Q plot should always accompany this test.

</details>

## How do you detect and fix multicollinearity in R?

Multicollinearity happens when two or more predictors are highly correlated, so OLS can't tell their individual effects apart. Coefficient estimates become unstable (big standard errors, signs flipping with small data changes) even when overall R² is fine. The **Variance Inflation Factor (VIF)** quantifies the damage:

$$VIF_j = \frac{1}{1 - R^2_j}$$

Where:

- $R^2_j$ is the R² from regressing predictor $j$ on all the other predictors
- $VIF_j = 1$ means predictor $j$ is uncorrelated with the others
- $VIF_j > 5$ is cause for investigation
- $VIF_j > 10$ is a serious red flag

We can compute VIF directly in base R by running the auxiliary regressions ourselves.

```r title="Compute VIF for each predictor in base R"
fit_mc <- lm(mpg ~ hp + wt + disp + cyl, data = mtcars)

predictors <- c("hp", "wt", "disp", "cyl")
vifs <- sapply(predictors, function(p) {
  others <- setdiff(predictors, p)
  formula_aux <- as.formula(paste(p, "~", paste(others, collapse = " + ")))
  aux_fit <- lm(formula_aux, data = mtcars)
  1 / (1 - summary(aux_fit)$r.squared)
})
round(vifs, 2)
#>    hp    wt  disp   cyl
#>  4.68  4.84 10.46  7.87
```

`disp` has a VIF of 10.5 (serious), and `cyl` is at 7.9 (borderline serious). `disp` and `cyl` both correlate strongly with each other and with `wt`, so including all three is almost redundant.

[NOTE]
**`car::vif()` runs the same math in a single call** in local RStudio: `car::vif(fit_mc)`. The base-R loop above is the WebR-safe equivalent.

[KEY INSIGHT]
**Multicollinearity doesn't hurt R² or predictions; it hurts your coefficient interpretations.** If you only care about prediction accuracy, VIF matters less. If you need to say "hp has effect X holding wt constant," it matters a lot.

The fix is almost always to drop the most redundant predictor, combine predictors into a single index (like engine size instead of disp + cyl), or switch to a method that tolerates correlation (PCA regression, ridge regression via `glmnet`).

```r title="Drop disp and recompute VIFs"
fit_mc2 <- lm(mpg ~ hp + wt + cyl, data = mtcars)

predictors2 <- c("hp", "wt", "cyl")
vifs2 <- sapply(predictors2, function(p) {
  others <- setdiff(predictors2, p)
  formula_aux <- as.formula(paste(p, "~", paste(others, collapse = " + ")))
  aux_fit <- lm(formula_aux, data = mtcars)
  1 / (1 - summary(aux_fit)$r.squared)
})
round(vifs2, 2)
#>   hp   wt  cyl
#> 3.26 2.89 5.41
```

Dropping `disp` pulled every VIF well below 10, and `cyl` is now near the 5 threshold rather than past it. The surviving coefficients are now safe to interpret.

**Try it:** Compute VIF for `wt` alone in the full 4-predictor model, then after dropping `disp`, and see the drop.

```r title="Your turn: VIF for wt before and after"
ex_full <- lm(mpg ~ hp + wt + disp + cyl, data = mtcars)

# Compute VIF for wt using the full model's other predictors
ex_others <- c("hp", "disp", "cyl")
ex_vif_before <- # your code here

ex_others_after <- c("hp", "cyl")
ex_vif_after <- # your code here

c(before = ex_vif_before, after = ex_vif_after)
#> Expected: after < before
```

<details>
<summary>Click to reveal solution</summary>

```r title="VIF drop solution"
ex_full <- lm(mpg ~ hp + wt + disp + cyl, data = mtcars)

ex_aux1 <- lm(wt ~ hp + disp + cyl, data = mtcars)
ex_vif_before <- 1 / (1 - summary(ex_aux1)$r.squared)

ex_aux2 <- lm(wt ~ hp + cyl, data = mtcars)
ex_vif_after <- 1 / (1 - summary(ex_aux2)$r.squared)

c(before = round(ex_vif_before, 2), after = round(ex_vif_after, 2))
#> before  after
#>   4.84   2.89
```

**Explanation:** Dropping `disp` removes a predictor highly correlated with `wt`, so `wt`'s variance inflation nearly halves.

</details>

## Practice Exercises

### Exercise 1: Full diagnostic workflow on airquality

Fit `Ozone ~ Solar.R + Wind + Temp` on `airquality` (complete cases). Run the 4-panel diagnostic and identify which assumption is most visibly violated.

```r title="Exercise 1: diagnose the model"
# Exercise: fit the model and scan diagnostics
# Hint: use na.omit() first, then par(mfrow=c(2,2)) before plot()

aq_data <- na.omit(airquality)
my_fit <- # your code here

par(mfrow = c(2, 2))
plot(my_fit)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
aq_data <- na.omit(airquality)
my_fit <- lm(Ozone ~ Solar.R + Wind + Temp, data = aq_data)

par(mfrow = c(2, 2))
plot(my_fit)
```

**Explanation:** The Scale-Location plot shows a rising red smoother (heteroscedasticity) and the Q-Q plot's upper tail bows away from the line (non-normal residuals). Both point to a skewed response, a clue that `log(Ozone)` is worth trying.

</details>

### Exercise 2: Repair heteroscedasticity with a log transform

Using the same `aq_data` from Exercise 1, refit with `log(Ozone)` as the response. Show the Scale-Location plot before and after.

```r title="Exercise 2: apply the fix"
# Exercise: refit with log(Ozone) and compare Scale-Location
# Hint: use which = 3 to get just the Scale-Location panel

my_fit_log <- # your code here

par(mfrow = c(1, 2))
plot(my_fit, which = 3, main = "Before: Ozone")
plot(my_fit_log, which = 3, main = "After: log(Ozone)")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
my_fit_log <- lm(log(Ozone) ~ Solar.R + Wind + Temp, data = aq_data)

par(mfrow = c(1, 2))
plot(my_fit, which = 3, main = "Before: Ozone")
plot(my_fit_log, which = 3, main = "After: log(Ozone)")
```

**Explanation:** The log transform pulls in the cone pattern, so the red smoother is roughly flat on the right-hand panel. Coefficients now have valid standard errors.

</details>

### Exercise 3: Detect and resolve multicollinearity

Compute VIF for every predictor in the `log(Ozone)` model. If any VIF > 5, drop the highest-VIF predictor and refit.

```r title="Exercise 3: VIF audit"
# Exercise: compute VIFs; drop the worst if any > 5

preds <- c("Solar.R", "Wind", "Temp")
my_vifs <- sapply(preds, function(p) {
  # your code here
})
round(my_vifs, 2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
preds <- c("Solar.R", "Wind", "Temp")
my_vifs <- sapply(preds, function(p) {
  others <- setdiff(preds, p)
  aux <- lm(as.formula(paste(p, "~", paste(others, collapse = " + "))),
            data = aq_data)
  1 / (1 - summary(aux)$r.squared)
})
round(my_vifs, 2)
#> Solar.R    Wind    Temp
#>    1.09    1.33    1.42
```

**Explanation:** All VIFs are well below 5, so multicollinearity is not a problem here. No predictor needs to be dropped. If any had exceeded 5, the fix would be to drop that predictor or combine it with a correlated sibling.

</details>

## Complete Example

Let's run the entire diagnostic and remedy cycle end-to-end on `airquality`. The idea is to model daily ozone concentration as a function of solar radiation, wind speed, and temperature, then check all five assumptions and apply fixes where needed.

First, fit the baseline model and look at the full diagnostic panel.

```r title="Complete example: fit and diagnose"
aq_full <- na.omit(airquality)
example_fit <- lm(Ozone ~ Solar.R + Wind + Temp, data = aq_full)

par(mfrow = c(2, 2))
plot(example_fit)
#> (4-panel diagnostic dashboard)
```

The Residuals vs Fitted plot shows a curve, the Scale-Location plot slopes upward, and the Q-Q plot's upper tail bows away. That's three assumptions wobbling at once. The common culprit with skewed count-like responses (like ozone) is a right-skewed y, and the standard remedy is a log transform.

![The five assumptions of ordinary least squares at a glance.](screenshots/Linear-Regression-Assumptions-in-R-five-assumptions-overview.webp)
*Figure 2: The five assumptions of ordinary least squares at a glance.*

Now refit on the log scale and rerun every check.

```r title="Complete example: apply the fix and recheck"
example_fit2 <- lm(log(Ozone) ~ Solar.R + Wind + Temp, data = aq_full)

par(mfrow = c(2, 2))
plot(example_fit2)

res2 <- residuals(example_fit2)
dw2 <- sum(diff(res2)^2) / sum(res2^2)

vifs_ex <- sapply(c("Solar.R", "Wind", "Temp"), function(p) {
  others <- setdiff(c("Solar.R", "Wind", "Temp"), p)
  aux <- lm(as.formula(paste(p, "~", paste(others, collapse = " + "))),
            data = aq_full)
  1 / (1 - summary(aux)$r.squared)
})

list(
  durbin_watson = round(dw2, 3),
  vifs = round(vifs_ex, 2),
  r_squared = round(summary(example_fit2)$r.squared, 3)
)
#> $durbin_watson
#> [1] 1.859
#>
#> $vifs
#> Solar.R    Wind    Temp
#>    1.09    1.33    1.42
#>
#> $r_squared
#> [1] 0.664
```

The log transform flattened the residual patterns, DW is close to 2 (no autocorrelation concern), and every VIF is under 2 (no multicollinearity). R² on the log scale is 0.66, a realistic number for air-quality modeling. The same workflow, in this order (fit → 4-panel → fix → refit → recheck), works for essentially any OLS model.

## Summary

![Which remedy to reach for when a diagnostic flags a violation.](screenshots/Linear-Regression-Assumptions-in-R-remedy-decision.webp)
*Figure 3: Which remedy to reach for when a diagnostic flags a violation.*

| Assumption | Quick Test | Rule of Thumb | Fix When Violated |
|---|---|---|---|
| Linearity | Residuals vs Fitted | Flat band around 0 | Polynomial, log, or spline term |
| Independence | Durbin-Watson | 1.5 ≤ DW ≤ 2.5 | Add lags, GLS, or time-series model |
| Homoscedasticity | Scale-Location | Flat red smoother | log y, WLS, or robust SE |
| Normality | Q-Q plot | Points on the line | Transform y or bootstrap CIs |
| No multicollinearity | VIF | VIF < 5 (ideally < 2) | Drop predictor, combine, or ridge |

The key mental shift is that each assumption maps to both a diagnostic and a specific fix. When you see a violation, you already know the next move. Run `plot(fit)` on every model you fit, scan the four panels, compute Durbin-Watson and VIF, and decide what to do before reading coefficient p-values.

## References

1. Fox, J. & Weisberg, S., *An R Companion to Applied Regression*, 3rd ed. Sage (2019). [Link](https://socialsciences.mcmaster.ca/jfox/Books/Companion/)
2. Faraway, J., *Linear Models with R*, 2nd ed. CRC Press. [Link](https://julianfaraway.github.io/faraway/LMR/)
3. R Core Team, `plot.lm` documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/plot.lm.html)
4. Zeileis, A. & Hothorn, T., Diagnostic Checking in Regression Relationships, *R News* 2(3), 2002 (lmtest package). [Link](https://cran.r-project.org/web/packages/lmtest/vignettes/lmtest-intro.pdf)
5. Lüdecke, D. et al., `performance` package, *Journal of Open Source Software* 6(60), 2021. [Link](https://easystats.github.io/performance/)
6. Kim, J. H., Multicollinearity and misleading statistical results. *Korean Journal of Anesthesiology* 72(6), 2019. [Link](https://pubmed.ncbi.nlm.nih.gov/31304696/)
7. UCLA IDRE, Regression with R: Regression Diagnostics. [Link](https://stats.oarc.ucla.edu/r/dae/robust-regression/)
8. University of Virginia Library, Understanding Diagnostic Plots for Linear Regression. [Link](https://library.virginia.edu/data/articles/diagnostic-plots)

## Continue Learning

1. [Linear Regression in R](Linear-Regression.html), fit, interpret, and predict with `lm()` before you start worrying about assumptions.
2. [Outlier Treatment With R](Outlier-Treatment-With-R.html), dig into the influential points flagged by your Residuals vs Leverage plot.
3. [Logistic Regression With R](Logistic-Regression-With-R.html), when normality and linearity make no sense for your response, move to a GLM.
