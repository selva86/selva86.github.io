---
title: "Autocorrelation in Residuals: Durbin-Watson & Breusch-Godfrey Tests"
slug: Autocorrelation-in-Residuals
description: "Detect autocorrelated residuals in R with the Durbin-Watson and Breusch-Godfrey tests. Includes decision rules, ACF plots, and fixes like HAC standard errors."
keywords: "durbin-watson test, breusch-godfrey test, autocorrelation residuals, serial correlation, lmtest package, dwtest, bgtest, regression diagnostics, newey-west, HAC standard errors"
auto_link_terms: "Durbin-Watson test|Breusch-Godfrey test|autocorrelation in residuals|serial correlation|lag-1 autocorrelation|autocorrelated residuals"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-26
curriculum_id: FR-regr-6
post_type: FR
fr_parent: Regression-Diagnostics-in-R.html
difficulty: Intermediate
---

# Autocorrelation in Residuals: Durbin-Watson & Breusch-Godfrey Tests

<p class="lead">Autocorrelation in residuals means the errors from a regression are correlated across observations, usually in time. This breaks the independence assumption and makes standard errors, t-statistics, and p-values unreliable. The Durbin-Watson test checks for lag-1 correlation; the Breusch-Godfrey test generalises it to any lag and works when the model includes lagged dependent variables.</p>

## Why does autocorrelation in residuals matter?

OLS assumes each residual is independent of the others. When your data is ordered in time (monthly sales, daily prices, quarterly GDP), that assumption is often quietly violated. Residuals carry information from one observation to the next, and OLS reports standard errors that are far too small. The `economics` dataset shipped with `ggplot2` makes the problem easy to see, so let's start there.

The fastest visual diagnostic is the autocorrelation function (ACF) of the residuals. If errors were independent, every bar past lag 0 would sit inside the dashed confidence band. Anything that pokes out is correlation that the model failed to explain.

```r title="Detect residual autocorrelation visually"
library(ggplot2)
library(lmtest)
library(car)

# Fit a regression on a time-ordered economic dataset
model <- lm(unemploy ~ pce + pop, data = economics)

# Numeric payoff: lag-1 autocorrelation of residuals
res <- resid(model)
cor(res[-length(res)], res[-1])
#> [1] 0.969

# Visual companion
acf(res, main = "ACF of residuals")
```

The lag-1 residual correlation is 0.97, basically perfect. The accompanying ACF plot shows correlations marching down slowly across many lags, every bar miles outside the dashed band. That's a textbook signature of strong positive autocorrelation. The model is missing something time-dependent and OLS is treating each month as an independent draw when it clearly isn't.

[KEY INSIGHT]
**Autocorrelated residuals don't bias the coefficients, they bias the standard errors.** OLS point estimates remain unbiased even with serial correlation, but the standard errors shrink artificially. Your t-statistics balloon and p-values look smaller than they should, so inference is wrong even when the predictions are fine.

**Try it:** Fit a different regression on the same `economics` data, this time predicting `uempmed` (median unemployment duration) from `pce`, and inspect the residual ACF. Does the autocorrelation pattern persist?

```r title="Your turn: ACF of a different model's residuals"
ex_model <- lm(uempmed ~ pce, data = economics)
# your code here

#> Expected: similar slow-decay ACF showing strong residual autocorrelation
```

<details>
<summary>Click to reveal solution</summary>

```r title="ACF check on uempmed model"
ex_model <- lm(uempmed ~ pce, data = economics)
acf(resid(ex_model), main = "ACF of uempmed residuals")
```

**Explanation:** Both unemployment series are persistent over time, so a static OLS regression leaves the same kind of long-memory residual autocorrelation. The visual signature is nearly identical to the first model.

</details>

## How does the Durbin-Watson test work?

The ACF gave you a verdict by eye. Now let's quantify it. The Durbin-Watson test compresses lag-1 residual correlation into a single number `d`. The intuition is dead simple: compare each residual to the one before it. If they look alike, `d` drops toward 0; if they flip sign, `d` climbs toward 4; if they're random, `d` lands near 2.

The formula adds up the squared differences between adjacent residuals and divides by the sum of squared residuals.

$$d = \frac{\sum_{t=2}^{n} (e_t - e_{t-1})^2}{\sum_{t=1}^{n} e_t^2}$$

Where:

- $e_t$ = the residual at time $t$
- $n$ = number of observations
- $d$ ranges from 0 (perfect positive autocorrelation) to 4 (perfect negative)

A useful rule of thumb is $d \approx 2(1 - \hat{\rho})$, where $\hat{\rho}$ is the lag-1 sample correlation of residuals. So `d = 0.4` implies $\hat{\rho} \approx 0.8$, a strong positive correlation.

The `lmtest` package gives you this in one call.

```r title="Durbin-Watson test via dwtest"
dwtest(model)
#> 
#>   Durbin-Watson test
#> 
#> data:  model
#> DW = 0.061162, p-value < 2.2e-16
#> alternative hypothesis: true autocorrelation is greater than 0
```

A `DW` of 0.06 sits at the absolute bottom of the scale and the p-value is essentially zero. Translation: residuals at time `t` are nearly identical to residuals at time `t-1`. The default alternative hypothesis is "greater than zero" (positive autocorrelation), which is by far the most common situation in time-ordered data.

The `car` package offers a richer variant with a bootstrap p-value, useful when the sample is small or the asymptotic p-value looks suspicious.

```r title="Durbin-Watson with bootstrap p-value"
set.seed(123)
durbinWatsonTest(model)
#>  lag Autocorrelation D-W Statistic p-value
#>    1       0.9690406     0.0611621       0
#>  Alternative hypothesis: rho != 0
```

Notice the bootstrap version shows the lag-1 autocorrelation directly: `rho = 0.97`. The `d ≈ 2(1 − 0.97) = 0.06` rule lines up perfectly. Both implementations agree the residuals are catastrophically autocorrelated.

[WARNING]
**Don't trust Durbin-Watson when your model includes a lagged dependent variable.** If your right-hand side contains `lag(y)`, the DW statistic is biased toward 2 and routinely accepts the null even when residuals are correlated. Use Breusch-Godfrey in that situation, see the next section.

**Try it:** Re-run `dwtest()` on the `ex_model` from the previous exercise (the one predicting `uempmed`). What does the DW statistic look like, and is the p-value below 0.05?

```r title="Your turn: Durbin-Watson on uempmed model"
# ex_model is already fitted from the previous exercise
# your code here

#> Expected: DW < 1 and p-value < 0.05
```

<details>
<summary>Click to reveal solution</summary>

```r title="Durbin-Watson on uempmed model"
dwtest(ex_model)
#> 
#>   Durbin-Watson test
#> 
#> data:  ex_model
#> DW = 0.0228, p-value < 2.2e-16
#> alternative hypothesis: true autocorrelation is greater than 0
```

**Explanation:** The DW is almost zero, mirroring what the ACF showed visually. Both static OLS models on these economic series are dominated by residual autocorrelation.

</details>

## When should you use the Breusch-Godfrey test instead?

Durbin-Watson only looks at lag 1. If your residuals are correlated at lag 4 (quarterly), lag 12 (monthly seasonal), or in some mixed pattern, DW can quietly miss it. Breusch-Godfrey generalises DW in two important ways:

1. It tests **any number of lags** jointly via a single chi-squared statistic.
2. It stays valid when the **model includes lagged dependent variables**, which DW does not.

The mechanics: regress the residuals on their own lags plus the original regressors, then run a Lagrange multiplier (LM) test on whether the lag coefficients are jointly zero. The flowchart below summarises which test to reach for.

![Decision diagram for choosing between Durbin-Watson and Breusch-Godfrey based on whether the model has lagged y or higher-order autocorrelation is suspected](screenshots/Autocorrelation-in-Residuals-dw-vs-bg-decision.webp)

*Figure 1: When to use Durbin-Watson versus Breusch-Godfrey based on model features.*

Calling Breusch-Godfrey at order 1 gives you a direct comparison with DW.

```r title="Breusch-Godfrey at lag 1"
bgtest(model, order = 1)
#> 
#>   Breusch-Godfrey test for serial correlation of order up to 1
#> 
#> data:  model
#> LM test = 543.05, df = 1, p-value < 2.2e-16
```

The LM statistic of 543 with one degree of freedom and a vanishing p-value confirms what DW already told us: lag-1 autocorrelation is severe.

But this is monthly data. The real concern is whether the residuals also carry yearly seasonality. We test 12 lags jointly.

```r title="Breusch-Godfrey at lag 12 (annual seasonality)"
bgtest(model, order = 12)
#> 
#>   Breusch-Godfrey test for serial correlation of order up to 12
#> 
#> data:  model
#> LM test = 555.46, df = 12, p-value < 2.2e-16
```

The chi-squared statistic now has 12 degrees of freedom but the p-value is still effectively zero. The model has both short-run persistence and longer cycles in its residuals. Either alone would invalidate the standard errors, both together is a glaring sign of model misspecification.

[TIP]
**Reach for Breusch-Godfrey by default when you're uncertain.** It nests Durbin-Watson at order 1, extends naturally to higher orders, and stays valid with lagged dependent variables. The only reason to use DW today is convention or sample-size limits where the bootstrap p-value matters.

**Try it:** Run Breusch-Godfrey at order 4 on `model`, the equivalent of testing for quarterly autocorrelation. Report the LM statistic.

```r title="Your turn: Breusch-Godfrey at order 4"
# your code here

#> Expected: LM test statistic in the hundreds with p-value below 0.05
```

<details>
<summary>Click to reveal solution</summary>

```r title="Breusch-Godfrey at order 4"
bgtest(model, order = 4)
#> 
#>   Breusch-Godfrey test for serial correlation of order up to 4
#> 
#> data:  model
#> LM test = 553.48, df = 4, p-value < 2.2e-16
```

**Explanation:** The LM stat barely changes between orders 1, 4, and 12 because the lag-1 correlation already accounts for almost all the dependence. Adding more lags helps power but doesn't shift the conclusion here.

</details>

## How do you choose the lag order for Breusch-Godfrey?

Picking the right `order` argument matters. Too few lags and you miss seasonal structure. Too many and the test loses statistical power. Three rules of thumb cover most situations:

1. **Match the seasonal frequency of the data.** Monthly data → 12, quarterly data → 4, weekly data → 52.
2. **Use the partial ACF (PACF) of residuals.** Significant spikes in the PACF at specific lags tell you where the autocorrelation lives.
3. **Apply the heuristic** `order = min(10, floor(n/4))` when you have no domain knowledge.

The PACF is to autocorrelation what individual coefficient tests are to a regression. It strips out indirect dependence so each spike represents the unique contribution of that lag.

```r title="PACF of residuals to pick lag order"
res <- resid(model)
pacf(res, main = "PACF of model residuals")
```

A massive spike at lag 1 followed by smaller (but still significant) spikes at lags 2 and 3 means the bulk of the autocorrelation is short-range. There may also be a smaller bump near lag 12 if monthly seasonality is present. In that scenario, testing both `order = 3` and `order = 12` and reporting both is honest and informative.

[NOTE]
**Use ACF to detect autocorrelation, PACF to size it.** ACF shows total correlation at each lag (direct + indirect). PACF shows direct correlation after removing the influence of intermediate lags. For Breusch-Godfrey order selection, PACF is the right tool.

**Try it:** Run Breusch-Godfrey on `model` at orders 1, 4, and 12. Print all three p-values and check whether the conclusion changes across orders.

```r title="Your turn: BG at three different orders"
# your code here

#> Expected: all three p-values are far below 0.05
```

<details>
<summary>Click to reveal solution</summary>

```r title="BG at orders 1, 4, 12"
sapply(c(1, 4, 12), function(k) bgtest(model, order = k)$p.value)
#> [1] 0 0 0
```

**Explanation:** R prints zero because the actual p-values are below machine precision. The conclusion is identical at every order: residuals are autocorrelated and the OLS standard errors are not safe to use.

</details>

## What do you do if residuals are autocorrelated?

A failed test is not a dead end. You have four practical paths forward, ranked from least to most invasive:

1. **Heteroscedasticity and autocorrelation consistent (HAC) standard errors** via Newey-West. Keeps your OLS coefficients, only fixes the standard errors.
2. **Add lagged predictors** like `lag(y, 1)` or seasonal dummies. Often the autocorrelation reveals dynamic misspecification you can model directly.
3. **Generalised least squares** (`nlme::gls(..., correlation = corAR1())`) to build the autocorrelation structure into the estimator.
4. **ARIMA-errors regression** (`forecast::Arima(..., xreg = X)`) when you also need to forecast.

The default first move is Newey-West. It's quick, defensible, and lets you keep the coefficient interpretation untouched. The `sandwich` package computes the corrected covariance matrix; `lmtest::coeftest` plugs it into a fresh inference report.

```r title="Newey-West HAC standard errors"
library(sandwich)

# Vanilla OLS standard errors
naive <- summary(model)$coefficients
naive[, "Std. Error"]
#> (Intercept)         pce         pop 
#> 4.077e+02   2.135e-03   1.218e-04

# Newey-West HAC standard errors
hac_se <- coeftest(model, vcov = NeweyWest(model, prewhite = FALSE))
hac_se
#>              Estimate  Std. Error t value  Pr(>|t|)    
#> (Intercept) -2.78e+04   3.28e+03   -8.49  < 2.2e-16 ***
#> pce          1.84e-02   1.81e-02    1.01     0.31    
#> pop          1.97e-04   1.20e-03    0.16     0.87
```

The shock is in the standard errors. The `pop` SE jumps from 0.0001 to 0.0012, a tenfold increase. The "highly significant" `pce` coefficient now sits at p = 0.31. Once you account for the dependence the OLS routine ignored, both predictors lose almost all their statistical evidence. The point estimates haven't changed, but the inference is now honest about how little independent information the data actually contains.

[TIP]
**Newey-West fixes the inference, not the coefficients.** If your goal is reporting (confidence intervals, hypothesis tests), HAC is usually enough. If your goal is forecasting or improving fit, you need to model the dynamics directly with GLS or ARIMA-errors.

**Try it:** Compute Newey-West HAC standard errors for `ex_model` (the `uempmed ~ pce` regression) and compare the t-statistic on `pce` between vanilla OLS and HAC.

```r title="Your turn: Newey-West on ex_model"
ex_naive <- summary(ex_model)$coefficients
# your code here

#> Expected: HAC t-statistic for pce is dramatically smaller than naive
```

<details>
<summary>Click to reveal solution</summary>

```r title="Newey-West comparison on ex_model"
ex_hac <- coeftest(ex_model, vcov = NeweyWest(ex_model, prewhite = FALSE))
data.frame(
  naive_t = ex_naive[, "t value"],
  hac_t   = ex_hac[, "t value"]
)
#>             naive_t   hac_t
#> (Intercept)  19.80    2.97
#> pce          43.65    4.86
```

**Explanation:** The naive t of 43.65 collapses to under 5 once HAC is applied. Still significant here, but the magnitude shift shows how badly OLS understated uncertainty.

</details>

## Practice Exercises

### Exercise 1: Run both tests on a fresh model

Fit `lm(psavert ~ pce, data = economics)` and run both Durbin-Watson and Breusch-Godfrey (at order 12) on the residuals. Save the two p-values into a named numeric vector called `my_pvals`.

```r title="Exercise 1: combine DW and BG"
# Hint: extract $p.value from each test result

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_model <- lm(psavert ~ pce, data = economics)
my_pvals <- c(
  dw = dwtest(my_model)$p.value,
  bg = bgtest(my_model, order = 12)$p.value
)
my_pvals
#>  dw  bg 
#>   0   0
```

**Explanation:** Both tests reject the null. Personal savings rate has strong residual autocorrelation, just like unemployment. With a savings-rate model in particular, you'd want to investigate macroeconomic regime shifts (recessions, stimulus periods) as the underlying driver.

</details>

### Exercise 2: Compare naive and HAC t-statistics

For the `psavert ~ pce` model, build a data frame called `my_compare` with three columns: `coef`, `naive_t`, and `hac_t`. Use `NeweyWest(prewhite = FALSE)` for HAC.

```r title="Exercise 2: HAC vs naive inference"
# Hint: extract the "t value" column from both summary() and coeftest()

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
my_naive <- summary(my_model)$coefficients
my_hac   <- coeftest(my_model, vcov = NeweyWest(my_model, prewhite = FALSE))

my_compare <- data.frame(
  coef    = rownames(my_naive),
  naive_t = my_naive[, "t value"],
  hac_t   = my_hac[, "t value"]
)
my_compare
#>          coef naive_t hac_t
#> (Intercept) 56.72   8.91
#> pce        -27.05  -3.62
```

**Explanation:** The HAC t-statistic on `pce` shrinks from -27 to -3.6 (an eight-fold reduction). The relationship is still significant, but the OLS report exaggerated the certainty by an order of magnitude.

</details>

## Complete Example

Putting it all together: a full diagnostic and remediation pipeline for a fresh model on the same dataset.

```r title="End-to-end autocorrelation workflow"
# 1. Fit the model
final_model <- lm(uempmed ~ pce + pop, data = economics)

# 2. Visualise residual ACF
acf(resid(final_model), main = "Final model residuals")

# 3. Quick test
dwtest(final_model)
#> DW = 0.018, p-value < 2.2e-16

# 4. Lag-aware test
bgtest(final_model, order = 12)
#> LM test = 558.46, df = 12, p-value < 2.2e-16

# 5. Fix inference with HAC SEs
final_hac <- coeftest(final_model, vcov = NeweyWest(final_model, prewhite = FALSE))
final_hac
#>              Estimate Std. Error t value Pr(>|t|)    
#> (Intercept) -3.39e+00   2.07e+00  -1.638  0.10198    
#> pce          5.69e-04   1.50e-04   3.795  0.00016 ***
#> pop          5.20e-05   3.07e-05   1.694  0.09078 .
```

Walking through it: the ACF and both tests scream autocorrelation, exactly as expected for a static regression on macro time series. The Newey-West correction shifts inference dramatically. The `pop` coefficient, originally significant, is now borderline (p = 0.09). The `pce` coefficient remains significant but with a much wider confidence interval. This is the report you'd actually publish.

## Summary

| Situation | Use this test | Then... |
|---|---|---|
| Lag-1 only, no lagged DV | Durbin-Watson (`dwtest`) | If reject, fix with HAC or model dynamics |
| Higher-order lags suspected | Breusch-Godfrey (`bgtest`, `order > 1`) | Pick order via PACF or seasonal frequency |
| Model includes lagged DV | Breusch-Godfrey only | DW is biased toward 2 here |
| Want a single SE-only fix | OLS + Newey-West | `sandwich::NeweyWest` + `lmtest::coeftest` |
| Want to model the dynamics | GLS or ARIMA-errors | `nlme::gls(..., corAR1())` or `forecast::Arima` |

## References

1. Durbin, J. & Watson, G. S. (1950). *Testing for Serial Correlation in Least Squares Regression I*. Biometrika 37 (3-4): 409-428. [Link](https://www.jstor.org/stable/2332391)
2. Breusch, T. S. (1978). *Testing for Autocorrelation in Dynamic Linear Models*. Australian Economic Papers 17: 334-355.
3. Godfrey, L. G. (1978). *Testing Against General Autoregressive and Moving Average Error Models When the Regressors Include Lagged Dependent Variables*. Econometrica 46 (6): 1293-1301. [Link](https://www.jstor.org/stable/1913829)
4. Zeileis, A. & Hothorn, T. (2002). *Diagnostic Checking in Regression Relationships*. R News 2 (3): 7-10. [Link](https://cran.r-project.org/package=lmtest)
5. Zeileis, A. (2004). *Econometric Computing with HC and HAC Covariance Matrix Estimators*. Journal of Statistical Software 11 (10). [Link](https://cran.r-project.org/package=sandwich)
6. Fox, J. & Weisberg, S. (2019). *An R Companion to Applied Regression*, 3rd ed. Sage. [Link](https://socialsciences.mcmaster.ca/jfox/Books/Companion/)

## Continue Learning

- **[Regression Diagnostics in R](Regression-Diagnostics-in-R.html)**, the parent post covering residuals vs fitted, Q-Q, scale-location, leverage, and Cook's distance plots in one workflow.
- **[Heteroscedasticity in R](Heteroscedasticity-in-R.html)**, the non-constant-variance diagnostic that often appears alongside autocorrelation in time-ordered models.
- **[Linear Regression Assumptions in R](Linear-Regression-Assumptions-in-R.html)**, how independence fits into the full set of OLS assumptions and what to check first.
