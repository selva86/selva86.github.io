---
title: "VAR Models in R: Multivariate Time Series Forecasting"
slug: "VAR-Models-in-R"
description: "Fit VAR models in R: check stationarity, pick the lag order with VARselect, test Granger causality, read impulse responses, and forecast several series."
keywords: "VAR models in R, vector autoregression R, vars package, multivariate time series forecasting, VARselect, Granger causality in R, impulse response function, forecast error variance decomposition"
auto_link_terms: "VAR model|VAR models|vector autoregression|vector autoregressive model|VAR model in R|VAR models in R|vars package|VARselect|impulse response function|forecast error variance decomposition|Granger causality|multivariate time series forecasting|VAR forecast|VAR lag order"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-22"
curriculum_id: "FR-adva-3"
post_type: "C"
sidebar_section: "Time Series"
sidebar_title: "VAR Models"
sidebar_order: 25
difficulty: "Advanced"
---

<p class="lead">A VAR (vector autoregression) model forecasts several time series at once by letting every series depend on the recent past of every series in the system, including its own. In R you fit one with <code>VAR()</code> from the vars package, choose the lag order with <code>VARselect()</code>, and forecast with <code>predict()</code>.</p>

## What is a VAR model, and when do you need one?

Employment and unemployment are two sides of one labour market. Each one carries information about where the other is heading, so a model that only looks at a series' own history throws half the evidence away. A VAR keeps both sides. The fastest way to see what that buys you is to fit one and ask it for a forecast.

We will work with `Canada`, a quarterly dataset that ships with the vars package. It holds four Canadian labour market indicators from 1980 to 2000. For now we take two of them: `e` (an index of employment) and `U` (the unemployment rate in percent).

```r title="Fit a VAR and forecast two series at once"
library(vars)
data(Canada)
ec <- Canada[, c("e", "U")]
fit0 <- VAR(ec, p = 2, type = "const")
round(predict(fit0, n.ahead = 4)$fcst$U, 3)
#>       fcst lower upper    CI
#> [1,] 6.698 6.111 7.286 0.587
#> [2,] 6.662 5.607 7.716 1.055
#> [3,] 6.703 5.189 8.217 1.514
#> [4,] 6.800 4.873 8.726 1.927
```

Four lines of code produced a four-quarter forecast of the unemployment rate with prediction intervals. `p = 2` tells `VAR()` to let each equation look two quarters back, and `type = "const"` says each equation gets its own intercept and nothing else (no trend term). In the output, the `fcst` column is the point forecast, `lower` and `upper` bound the 95% interval, and `CI` is the half-width of that interval.

Reading down the rows: unemployment is predicted to sit near 6.7% next quarter, and the interval widens from plus or minus 0.59 points to plus or minus 1.93 points by quarter four. Forecast uncertainty grows the further out you look, which a single point forecast would not have shown you.

The same fitted object also holds a forecast for employment, because a VAR models the whole system in one shot. That is the headline difference from ARIMA: one model, one estimation step, forecasts for every series you put in.

Here is the raw data those numbers came from.

```r title="Look at the data behind the forecast"
head(Canada, 4)
#>                e     prod       rw    U
#> 1980 Q1 929.6105 405.3665 386.1361 7.53
#> 1980 Q2 929.8040 404.6398 388.1358 7.70
#> 1980 Q3 930.3184 403.8149 390.5401 7.47
#> 1980 Q4 931.4277 404.2158 393.9638 7.27
dim(Canada)
#> [1] 84  4
plot(ec, main = "Canadian employment and unemployment")
```

Eighty-four quarters, four columns. The two columns we picked, `e` and `U`, move in opposite directions on the plot: when the employment index climbs, the unemployment rate falls. That mirror image is the relationship a VAR is built to exploit.

[NOTE]
**This first model is a preview, not the finished job.** Both series drift steadily upward or downward over twenty years, and a VAR expects series that hover around a stable level. The section on stationarity shows how to detect that problem and fix it, after which we rebuild the model properly.

**Try it:** Ask the same fitted model for a six-quarter forecast of employment (`e`) instead of unemployment, and print just the point forecasts.

```r title="Your turn: forecast employment"
# The forecast object stores one matrix per series inside $fcst.
# Pull the "fcst" column of the employment matrix.
ex_fc <- predict(fit0, n.ahead = 6)
# your code here

# Expected: six numbers rising slowly from about 962.3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Employment forecast solution"
round(ex_fc$fcst$e[, "fcst"], 3)
#> [1] 962.333 962.743 963.035 963.240 963.388 963.502
```

**Explanation:** `predict()` returns a list called `fcst` with one matrix per series. `ex_fc$fcst$e` is the employment matrix, and `[, "fcst"]` selects the point-forecast column out of the four columns you saw earlier.

</details>

## How does a VAR actually work under the hood?

A VAR looks intimidating written in matrix notation, so let us take it apart. With two variables and one lag, a VAR is just two ordinary regressions sitting side by side.

$$e_t = c_1 + a_{11} e_{t-1} + a_{12} U_{t-1} + \varepsilon_{1t}$$

$$U_t = c_2 + a_{21} e_{t-1} + a_{22} U_{t-1} + \varepsilon_{2t}$$

Where:

- $e_t$ and $U_t$ are employment and unemployment this quarter
- $e_{t-1}$ and $U_{t-1}$ are the same two variables one quarter ago
- $a_{11}$ is the effect of last quarter's employment on this quarter's employment, $a_{12}$ the effect of last quarter's unemployment on this quarter's employment, and so on
- $c_1, c_2$ are intercepts, and $\varepsilon_{1t}, \varepsilon_{2t}$ are the parts each equation cannot explain

Notice what the two equations have in common: the right-hand side is identical. Both regress on the same set of lagged variables. That is the defining property of a VAR, and it has a convenient consequence, which is that you can estimate each equation separately by ordinary least squares and get the same answer the full system would give.

![Every variable's past feeds every equation](screenshots/VAR-Models-in-R-two-equations.webp)
*Figure 1: Every variable's past feeds every equation, which is what separates a VAR from two separate models.*

Let us prove the claim rather than assert it. First we build the lagged dataset by hand: one column for each variable today, one column for each variable one quarter ago.

```r title="Build the lagged data by hand"
n <- nrow(ec)
lagged <- data.frame(
  e_now  = ec[2:n, "e"],
  U_now  = ec[2:n, "U"],
  e_lag1 = ec[1:(n - 1), "e"],
  U_lag1 = ec[1:(n - 1), "U"]
)
head(lagged, 3)
#>      e_now U_now   e_lag1 U_lag1
#> 1 929.8040  7.70 929.6105   7.53
#> 2 930.3184  7.47 929.8040   7.70
#> 3 931.4277  7.27 930.3184   7.47
```

Row 1 pairs quarter two's values (`e_now`, `U_now`) with quarter one's values (`e_lag1`, `U_lag1`). Shifting the series by one row is all "lagging" means. We lose the first observation, since nothing precedes it, so 84 quarters become 83 usable rows.

Now fit the two equations with plain `lm()`, the same function you would use for any regression.

```r title="Fit the two equations with lm()"
eq_e <- lm(e_now ~ e_lag1 + U_lag1, data = lagged)
eq_U <- lm(U_now ~ e_lag1 + U_lag1, data = lagged)
round(coef(eq_e), 4)
#> (Intercept)      e_lag1      U_lag1 
#>     -4.9691      1.0056      0.0097 
round(coef(eq_U), 4)
#> (Intercept)      e_lag1      U_lag1 
#>     11.6317     -0.0118      0.9431
```

Two calls to `lm()`, six coefficients. The employment equation says employment is almost entirely explained by its own previous value (coefficient 1.0056), while last quarter's unemployment barely moves it (0.0097). Now watch what the vars package returns for the same specification.

```r title="Compare against the vars package"
var1 <- VAR(ec, p = 1, type = "const")
round(Bcoef(var1), 4)
#>     e.l1   U.l1   const
#> e 1.0056 0.0097 -4.9691
#> U -0.0118 0.9431 11.6317
```

Every number matches, digit for digit. `Bcoef()` returns the coefficient matrix with one row per equation, and row `e` holds exactly what `lm(e_now ~ ...)` produced. The package is doing the regressions you just did by hand, plus a lot of bookkeeping you would rather not write yourself.

[KEY INSIGHT]
**A VAR is a stack of ordinary regressions that all share the same predictors.** Once you see that, the rest of the machinery stops being mysterious: coefficients come from OLS, standard errors come from OLS, and everything else in this tutorial is a question you ask of those fitted equations.

Knowing the structure also lets you count parameters before you fit anything. With $K$ variables and $p$ lags, each equation has $Kp$ slopes plus an intercept, so the whole system estimates $K + pK^2$ coefficients. A 2-variable VAR(2) needs 10; a 5-variable VAR(4) needs 105, which is a lot to estimate from eighty-odd quarters.

**Try it:** Extend `lagged` to include a second lag of both variables, fit the employment equation, and check that the coefficients match `Bcoef(VAR(ec, p = 2, type = "const"))["e", ]`.

```r title="Your turn: match a VAR(2) by hand"
ex_lag2 <- data.frame(
  e_now = ec[3:n, "e"],
  e_l1  = ec[2:(n - 1), "e"],
  U_l1  = ec[2:(n - 1), "U"],
  e_l2  = ec[1:(n - 2), "e"],
  U_l2  = ec[1:(n - 2), "U"]
)
# Fit e_now on all four lag columns, then print rounded coefficients.
# your code here

# Expected: e_l1 near 1.82 and e_l2 near -0.82
```

<details>
<summary>Click to reveal solution</summary>

```r title="VAR(2) by hand solution"
round(coef(lm(e_now ~ e_l1 + U_l1 + e_l2 + U_l2, data = ex_lag2)), 4)
#> (Intercept)        e_l1        U_l1        e_l2        U_l2 
#>     -4.4785      1.8208      0.1559     -0.8167     -0.0845 
round(Bcoef(VAR(ec, p = 2, type = "const"))["e", ], 4)
#>    e.l1    U.l1    e.l2    U.l2   const 
#>  1.8208  0.1559 -0.8167 -0.0845 -4.4785
```

**Explanation:** The two sets of numbers are identical, just ordered differently, because `VAR()` puts the intercept last while `lm()` puts it first. Adding lags means adding columns; nothing else about the method changes.

</details>

## Why must the series be stationary, and how do you check?

A series is **stationary** when its statistical behaviour does not depend on when you look at it: roughly constant average level, roughly constant spread, and a correlation structure that depends only on how far apart two points are. A series with a persistent upward drift is not stationary, because its average this decade differs from its average last decade.

This matters for a practical reason. Two unrelated series that both drift upward will look strongly related to a regression, purely because both happen to be going up. Econometricians call this a spurious regression, and a VAR fitted to drifting series is exposed to exactly that trap.

The standard check is the Augmented Dickey-Fuller test. Its null hypothesis is "this series has a unit root", which is the technical way of saying "this series is not stationary". A small p-value is therefore evidence *for* stationarity.

```r title="Test the levels for stationarity"
library(tseries)
adf.test(ec[, "e"])
#> Dickey-Fuller = -2.148, Lag order = 4, p-value = 0.5152
#> alternative hypothesis: stationary
adf.test(ec[, "U"])
#> Dickey-Fuller = -2.5988, Lag order = 4, p-value = 0.3303
#> alternative hypothesis: stationary
```

Both p-values sit far above 0.05, so neither test can reject the unit-root null. In plain terms, both series look non-stationary, which confirms what the plot showed. The model we fitted in section one was built on shaky ground.

[WARNING]
**The ADF p-value points the opposite way to most tests you know.** A large p-value here does not mean "no problem found", it means "cannot rule out non-stationarity", which is the problem. Reading it backwards is the single most common mistake in applied time series work.

The usual fix is differencing: instead of modelling the level of each series, model the change from one quarter to the next. `diff()` does this for every column of a multivariate series at once.

```r title="Difference every series"
d_ec <- diff(ec)
round(head(d_ec, 3), 3)
#>             e     U
#> 1980 Q2 0.193  0.17
#> 1980 Q3 0.514 -0.23
#> 1980 Q4 1.109 -0.20
dim(d_ec)
#> [1] 83  2
```

Row one now reads "employment rose by 0.193 index points and unemployment rose by 0.17 percentage points between 1980 Q1 and 1980 Q2". Differencing costs one observation, leaving 83 rows. Now retest.

```r title="Retest the differenced series"
round(c(adf_e = adf.test(d_ec[, "e"])$p.value,
        adf_U = adf.test(d_ec[, "U"])$p.value), 4)
#>  adf_e  adf_U 
#> 0.0827 0.0270
round(c(kpss_e = kpss.test(d_ec[, "e"])$p.value,
        kpss_U = kpss.test(d_ec[, "U"])$p.value), 4)
#> kpss_e kpss_U 
#>    0.1    0.1
```

Unemployment changes now pass the ADF test cleanly at 0.027. Employment changes come in at 0.083, which is suggestive but not decisive at the 5% level, so we bring in a second opinion. The KPSS test flips the hypotheses around: its null is "this series *is* stationary", so a large p-value is the reassuring one.

KPSS returns 0.1 for both series, which is the top of its reported range, so it fails to reject stationarity in either case. When ADF is borderline and KPSS is comfortable, the honest reading is that one round of differencing did the job and the ADF result reflects the low power of that test on 83 observations. We proceed with `d_ec`.

[NOTE]
**Differencing is not always the right answer.** When series share a long-run equilibrium (they drift apart temporarily but never permanently), they are called cointegrated, and differencing throws that equilibrium away. The fix there is a vector error correction model, which is a VAR in differences plus a term that pulls the system back toward equilibrium. Test with the Johansen procedure (`urca::ca.jo`) before assuming differences are enough.

**Try it:** Run the same three tests on the `prod` column of `Canada`, in levels and in first differences.

```r title="Your turn: test the productivity series"
# Test Canada[, "prod"] in levels with adf.test(),
# then diff() it and test with both adf.test() and kpss.test().
# your code here

# Expected: levels p above 0.2, differenced ADF near 0.09, differenced KPSS 0.1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Productivity stationarity solution"
round(c(adf_levels = adf.test(Canada[, "prod"])$p.value,
        adf_diff   = adf.test(diff(Canada[, "prod"]))$p.value,
        kpss_diff  = kpss.test(diff(Canada[, "prod"]))$p.value), 4)
#> adf_levels   adf_diff  kpss_diff 
#>     0.2180     0.0877     0.1000
```

**Explanation:** Productivity behaves like the other two series. In levels it is clearly non-stationary (p = 0.218), and after one difference the pair of tests agrees that it is stationary enough to model.

</details>

## How do you choose the lag order p?

The lag order `p` answers one question: how far back should each equation look? Too few lags and the model misses real dynamics, leaving structure in the residuals. Too many and you burn degrees of freedom estimating coefficients that are mostly noise, which makes forecasts worse even though the in-sample fit improves.

Information criteria automate that trade-off. Each one scores a model on fit and then subtracts a penalty for the number of coefficients. `VARselect()` fits every VAR from 1 lag up to `lag.max` and reports which order each criterion prefers.

```r title="Compare lag orders with VARselect"
sel <- VARselect(d_ec, lag.max = 8, type = "const")
sel$selection
#> AIC(n)  HQ(n)  SC(n) FPE(n) 
#>      2      1      1      2
```

The four criteria split two against two. AIC and FPE want two lags; HQ and SC want one. That is normal, and the reason is their different penalties: SC (the Schwarz criterion, also called BIC) charges the most per coefficient and therefore picks the smallest models, while AIC is the most permissive.

The full scoreboard shows how close the race was.

```r title="Inspect the criteria scores"
round(sel$criteria, 4)
#>              1       2       3       4       5       6       7       8
#> AIC(n) -4.8907 -4.8965 -4.8317 -4.8804 -4.8411 -4.7805 -4.7617 -4.6678
#> HQ(n)  -4.8167 -4.7731 -4.6590 -4.6583 -4.5696 -4.4597 -4.3916 -4.2483
#> SC(n)  -4.7053 -4.5875 -4.3991 -4.3242 -4.1613 -3.9771 -3.8347 -3.6172
#> FPE(n)  0.0075  0.0075  0.0080  0.0076  0.0079  0.0085  0.0086  0.0095
```

Lower is better for every row. Reading the AIC row, lag 2 scores -4.8965 against lag 1's -4.8907, a margin so thin it would not survive a slightly different sample. All four criteria agree that anything past lag 2 is clearly worse, which is the more useful signal here.

[TIP]
**When the criteria disagree, start with the larger order and let the residual tests decide.** A model with one lag too many is inefficient but unbiased; a model with one lag too few leaves autocorrelation in the residuals, which corrupts the standard errors and every test built on them. We take p = 2 and verify the residuals in the next section.

**Try it:** Rerun `VARselect()` with `type = "both"`, which adds a linear trend alongside the intercept, and see whether the chosen orders change.

```r title="Your turn: allow a trend term"
# Call VARselect on d_ec with lag.max = 8 and type = "both".
# Print the $selection element.
# your code here

# Expected: the same 2, 1, 1, 2 pattern
```

<details>
<summary>Click to reveal solution</summary>

```r title="Trend specification solution"
VARselect(d_ec, lag.max = 8, type = "both")$selection
#> AIC(n)  HQ(n)  SC(n) FPE(n) 
#>      2      1      1      2
```

**Explanation:** The selection is unchanged, which is reassuring. After differencing, there is no leftover trend for the extra term to explain, so adding it neither helps nor hurts the ranking.

</details>

## How do you read and check a fitted VAR?

Now we fit the model we will keep: two variables, two lags, differenced data, with an intercept.

```r title="Fit the working model"
var_fit <- VAR(d_ec, p = 2, type = "const")
round(coef(var_fit)$e, 4)
#>       Estimate Std. Error t value Pr(>|t|)
#> e.l1    0.9303     0.1568  5.9334   0.0000
#> U.l1   -0.0486     0.1920 -0.2529   0.8010
#> e.l2   -0.5342     0.1627 -3.2837   0.0016
#> U.l2   -0.3342     0.1914 -1.7461   0.0848
#> const   0.2313     0.0834  2.7723   0.0070
```

This table is the employment-change equation. Every coefficient answers the same shaped question: holding the other predictors fixed, how much does this quarter's change in employment move when that predictor moves by one unit?

The `e.l1` coefficient of 0.9303 says a one-point rise in employment last quarter is associated with a further 0.93-point rise this quarter, so growth carries forward. The `e.l2` coefficient of -0.5342 partly undoes it two quarters later, which is the signature of a series that overshoots and pulls back. Neither unemployment term reaches significance, so unemployment adds little to forecasting employment.

The unemployment equation is where the cross-series effect actually shows up.

```r title="Read the unemployment equation"
round(coef(var_fit)$U, 4)
#>       Estimate Std. Error t value Pr(>|t|)
#> e.l1   -0.5871     0.1335 -4.3979   0.0000
#> U.l1    0.0347     0.1635  0.2121   0.8326
#> e.l2    0.2164     0.1385  1.5624   0.1223
#> U.l2    0.0902     0.1630  0.5535   0.5816
#> const   0.1369     0.0710  1.9265   0.0578
```

Here the dominant term is `e.l1` at -0.5871, with a t value of -4.40 and a p-value below 0.0001. Last quarter's employment growth predicts this quarter's fall in unemployment, and it does so far more reliably than unemployment's own history does.

[KEY INSIGHT]
**The relationship runs mostly one way, and the coefficient table is where you see it.** Employment history predicts unemployment strongly, while unemployment history barely predicts employment. Two separate univariate models would never surface that asymmetry, because neither one is allowed to look at the other series.

Before trusting any of this, check that the system is **stable**. A VAR is stable when a one-off disturbance fades away as you run the equations forward, rather than growing without limit. `roots()` measures that for you: it rewrites the VAR as a single one-lag system (the companion form) and returns one number per variable per lag, each measuring how strongly the system carries a value forward one step. Every number must be below 1. A 2-variable VAR(2) therefore returns four numbers.

```r title="Check stability and fit"
round(roots(var_fit), 4)
#> [1] 0.4734 0.4734 0.3282 0.3282
round(c(e = summary(var_fit)$varresult$e$adj.r.squared,
        U = summary(var_fit)$varresult$U$adj.r.squared), 3)
#>     e     U 
#> 0.570 0.435
```

All four values sit near 0.47 and 0.33, comfortably below 1, so the model is stable and its forecasts settle down instead of growing. The adjusted R-squared values say the model explains 57% of the variation in employment changes and 43.5% in unemployment changes, which is respectable for differenced macro data.

The last checks look at the residuals, the part the model failed to explain. Well-behaved residuals show no correlation from one quarter to the next, hold a steady variance throughout, and follow a roughly normal distribution.

```r title="Run the residual diagnostics"
serial.test(var_fit, lags.pt = 12, type = "PT.asymptotic")$serial
#> Chi-squared = 36.172, df = 40, p-value = 0.6433
arch.test(var_fit, lags.multi = 5)$arch.mul
#> Chi-squared = 63.096, df = 45, p-value = 0.0386
normality.test(var_fit)$jb.mul$JB
#> Chi-squared = 1.3384, df = 4, p-value = 0.8548
```

Each of these tests has "the residuals are well behaved" as its null hypothesis, so here a large p-value is the good outcome. The Portmanteau test returns 0.6433, meaning no leftover autocorrelation, which is the most important box to tick because it validates the lag choice. Normality passes comfortably at 0.8548.

The ARCH test fails at 0.0386. That flags volatility clustering: quiet quarters cluster together and turbulent quarters cluster together, which is extremely common in economic data.

[WARNING]
**A failed ARCH test does not invalidate your coefficients, but it does make your intervals optimistic.** The point estimates stay consistent; the standard errors assume a constant variance that the data does not have, so the prediction intervals are narrower than reality warrants. Every `lower` and `upper` bound this model reports, including the ones in the forecast section below, should be read as a best case for how wide the real uncertainty is.

**Try it:** Fit the same system with one lag instead of two and compare the adjusted R-squared for the employment equation.

```r title="Your turn: compare p = 1 against p = 2"
ex_fit1 <- VAR(d_ec, p = 1, type = "const")
# Print both adjusted R-squared values for the "e" equation, rounded to 4 places.
# your code here

# Expected: p = 1 near 0.51, p = 2 near 0.57
```

<details>
<summary>Click to reveal solution</summary>

```r title="Lag order fit comparison solution"
round(c(p1_e = summary(ex_fit1)$varresult$e$adj.r.squared,
        p2_e = summary(var_fit)$varresult$e$adj.r.squared), 4)
#>   p1_e   p2_e 
#> 0.5132 0.5701
```

**Explanation:** The second lag lifts adjusted R-squared from 0.5132 to 0.5701. Because this is the *adjusted* version, the gain already accounts for the extra coefficients, so the second lag genuinely earns its place.

</details>

## Does one series really help predict another?

The coefficient tables hinted that employment predicts unemployment but not the reverse. Granger causality turns that hint into a formal test. The question it asks is precise: does adding the past of series X improve the forecast of series Y, beyond what Y's own past already provides?

The test works by comparing two nested models, one with X's lags and one without, using an F test. The null hypothesis is that all of X's lag coefficients in Y's equation are zero, so a small p-value means X does help.

```r title="Test whether employment helps predict unemployment"
g_e <- causality(var_fit, cause = "e")
g_e$Granger
#> Granger causality H0: e do not Granger-cause U
#> F-Test = 9.732, df1 = 2, df2 = 152, p-value = 0.0001054
```

The F statistic of 9.732 gives a p-value of 0.0001054, so we reject the null decisively. Employment history genuinely improves unemployment forecasts. Now the other direction.

```r title="Test the reverse direction"
g_U <- causality(var_fit, cause = "U")
g_U$Granger
#> Granger causality H0: U do not Granger-cause e
#> F-Test = 1.5581, df1 = 2, df2 = 152, p-value = 0.2139
```

A p-value of 0.2139 gives no reason to reject the null. Unemployment's past adds nothing measurable to the employment forecast once employment's own past is in the model. The influence in this system runs one way.

[WARNING]
**Granger causality is a statement about forecasting, not about cause and effect.** It says employment data arrives earlier and carries information; it does not say hiring physically causes unemployment to fall. A third variable driving both, or a variable that simply gets measured sooner, produces the same test result. Say "Granger-causes" out loud every time, precisely so the distinction stays visible.

There is a second flavour of causality worth knowing. Granger causality is about *lagged* effects; instantaneous causality asks whether the two residuals are correlated within the same quarter.

```r title="Test for same-quarter co-movement"
g_e$Instant
#> H0: No instantaneous causality between: e and U
#> Chi-squared = 27.564, df = 1, p-value = 1.52e-07
```

The p-value of 0.000000152 is emphatic: the two shocks move together within a quarter. That makes sense, since a plant closing lowers employment and raises unemployment in the same three months, faster than quarterly data can separate. Remember this result, because it is exactly what forces the awkward assumption in the next section.

**Try it:** Build a two-variable VAR on the differences of `e` and `rw` (real wages) with two lags, and test Granger causality in both directions.

```r title="Your turn: employment against real wages"
ex_er <- diff(Canada[, c("e", "rw")])
# Fit a VAR with p = 2, type = "const", then get both Granger p-values.
# your code here

# Expected: e helps predict rw (p near 0.04), rw does not help e (p near 0.13)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Employment and wages causality solution"
ex_fit_er <- VAR(ex_er, p = 2, type = "const")
round(c(e_causes_rw = as.numeric(causality(ex_fit_er, cause = "e")$Granger$p.value),
        rw_causes_e = as.numeric(causality(ex_fit_er, cause = "rw")$Granger$p.value)), 4)
#> e_causes_rw rw_causes_e 
#>      0.0413      0.1284
```

**Explanation:** Employment growth helps predict wage growth at the 5% level (p = 0.0413), while wage growth does not help predict employment (p = 0.1284). The one-directional pattern from the main model repeats with a different partner series.

</details>

## What happens to the whole system after a shock?

Coefficients tell you about one step. An impulse response function tells you about the whole chain reaction, and it is the single most useful output a VAR produces.

Picture the system sitting perfectly still, every variable at its long-run average. Now give one variable a single unexpected push, then leave the system alone and let its own equations run forward. The path that each variable traces out is the impulse response. The size of the push is one standard deviation of that variable's residuals, so "a one-standard-deviation employment shock" means a surprise about as large as the typical quarter-to-quarter surprise this model failed to predict.

The mechanics are simple to follow. A push to employment changes this quarter's employment. Next quarter, the equations feed that change into both variables through the lag terms. The quarter after that, those new values feed forward again, and because the model is stable the ripple shrinks each round until it disappears.

![A shock enters one variable and spreads through the system](screenshots/VAR-Models-in-R-shock-propagation.webp)
*Figure 2: A shock enters one variable, spreads through the system, and fades.*

Let us trace an employment shock through to unemployment.

```r title="Trace an employment shock to unemployment"
ir <- irf(var_fit, impulse = "e", response = "U", n.ahead = 8, boot = FALSE)
round(ir$irf$e, 3)
#>            U
#>  [1,] -0.237
#>  [2,] -0.236
#>  [3,] -0.164
#>  [4,] -0.081
#>  [5,] -0.028
#>  [6,] -0.004
#>  [7,]  0.002
#>  [8,]  0.003
#>  [9,]  0.002
```

Row 1 is the impact quarter and each row after it steps one quarter further ahead, out to eight. An unexpected burst of employment growth pushes the change in unemployment down by 0.237 percentage points immediately, holds nearly that full effect for another quarter, then decays through 0.164 and 0.081 until it is indistinguishable from zero by quarter five.

That decay pattern is the practical answer to "how long does a labour market shock last here?" About four to five quarters, on this data.

Point estimates alone can mislead, so the standard practice is to bootstrap a confidence band around them. Resampling the residuals many times produces many alternative impulse responses, and the spread of those tells you which part of the path is real.

```r title="Plot the shock path with confidence bands"
set.seed(2026)
ir_boot <- irf(var_fit, impulse = "e", response = "U",
               n.ahead = 8, boot = TRUE, runs = 200)
plot(ir_boot)
```

The plot draws the response as a solid line with dashed bootstrap bands. Where the band stays entirely below zero, the effect is statistically distinguishable from nothing; where the band straddles zero, the apparent movement could be noise. On this model the band clears zero for the first few quarters and then closes around it, matching the decay you read off the numbers.

Now the caveat that separates careful VAR work from careless VAR work. Look at what happens when we send the shock the other way.

```r title="Send the shock the other direction"
ir_rev <- irf(var_fit, impulse = "U", response = "e", n.ahead = 8, boot = FALSE)
round(ir_rev$irf$U, 4)
#>             e
#>  [1,]  0.0000
#>  [2,] -0.0111
#>  [3,] -0.0875
#>  [4,] -0.0794
#>  [5,] -0.0388
#>  [6,] -0.0121
#>  [7,] -0.0018
#>  [8,]  0.0010
#>  [9,]  0.0012
```

The impact response is exactly 0.0000. Not approximately zero, exactly zero, and no amount of data would change it. That zero was assumed, not estimated.

Here is why. We proved a moment ago that the two shocks are correlated within a quarter, so "shock employment while holding unemployment fixed" is not something the data can define on its own. To get a unique answer, `irf()` applies a Cholesky decomposition, which imposes a recursive ordering: the first variable in the system can affect the second on impact, but not the reverse. Since `e` comes first in our matrix, `U` is forbidden from moving `e` contemporaneously.

[WARNING]
**Reorder the columns and your impulse responses change.** The Cholesky ordering is an assumption you are making about which variable reacts to which within a single period, and the default ordering is just the column order of your data. Order variables from most exogenous (slowest to react) to most endogenous, state the ordering when you report results, and check whether your conclusions survive a different one.

The companion tool answers a related question: not "what path does a shock trace" but "who is responsible for our forecast errors". Forecast error variance decomposition splits the uncertainty at each horizon into shares owned by each shock.

```r title="Split forecast error by source"
fv <- fevd(var_fit, n.ahead = 8)
round(fv$U, 3)
#>          e     U
#> [1,] 0.516 0.484
#> [2,] 0.679 0.321
#> [3,] 0.721 0.279
#> [4,] 0.721 0.279
#> [5,] 0.719 0.281
#> [6,] 0.718 0.282
#> [7,] 0.718 0.282
#> [8,] 0.718 0.282
```

Each row is a forecast horizon and each column is a source of shocks; the row sums to 1. One quarter ahead, 51.6% of the uncertainty about unemployment traces back to employment shocks and 48.4% to unemployment's own shocks. By four quarters ahead the employment share has risen to 72.1% and settles there.

Put plainly: if you want to forecast Canadian unemployment more than a year out, most of what you do not know is really about employment. That is a concrete argument for keeping both series in the model.

**Try it:** Read the four-quarter-ahead row out of the FEVD table and confirm the two shares add to 1.

```r title="Your turn: read one FEVD row"
# fv$U is a matrix, one row per horizon. Extract row 4 and round to 4 places.
# your code here

# Expected: e about 0.7214 and U about 0.2786
```

<details>
<summary>Click to reveal solution</summary>

```r title="FEVD row solution"
round(fv$U[4, ], 4)
#>      e      U 
#> 0.7214 0.2786
sum(fv$U[4, ])
#> [1] 1
```

**Explanation:** The shares always sum to exactly 1 because the decomposition allocates 100% of the forecast error variance across the shocks in the system. At horizon 4, employment shocks own 72.1% of it.

</details>

## How do you forecast, and does the VAR beat univariate models?

Forecasting from a fitted VAR is one function call. `predict()` runs the equations forward, feeding each quarter's predictions back in as the next quarter's lags.

```r title="Forecast the differenced system"
fc <- predict(var_fit, n.ahead = 6)
round(fc$fcst$U, 3)
#>        fcst  lower upper    CI
#> [1,] -0.224 -0.870 0.423 0.647
#> [2,] -0.135 -0.929 0.660 0.795
#> [3,] -0.045 -0.905 0.814 0.859
#> [4,] -0.012 -0.892 0.867 0.879
#> [5,] -0.005 -0.888 0.878 0.883
#> [6,] -0.005 -0.888 0.879 0.884
fanchart(fc)
```

Remember these are forecasts of *changes*, because we differenced. The model expects unemployment to fall by 0.224 points next quarter, with the expected change shrinking toward zero after that. The influence of the last observed quarters decays as the horizon grows, so far-out forecasts settle at the average change, which for a differenced series is close to zero. The `fanchart()` call draws the same information as shaded bands that darken toward the centre.

Forecasts of changes are hard to judge by eye, so the backtest below converts them back into levels before scoring them.

Whether the second series actually earns its place is a question the fitted output cannot answer. The honest test is to hide the last two years from the model, forecast them, and compare against what actually happened.

```r title="Hold out the last eight quarters"
library(forecast)
h <- 8
lev <- Canada[, c("e", "U")]
n_all <- nrow(lev)
train_lev <- window(lev, end = time(lev)[n_all - h])
test_lev <- window(lev, start = time(lev)[n_all - h + 1])
c(train = nrow(train_lev), test = nrow(test_lev))
#> train  test 
#>    76     8
```

Two functions do the splitting. `time()` returns the calendar position of every observation in a quarterly series (1980.00, 1980.25, and so on), and `window()` cuts a slice out of a series using those positions, so `train_lev` stops at the eighth-from-last quarter and `test_lev` starts one quarter later. That leaves seventy-six quarters to learn from and eight to be judged on. The test window covers 1999 Q1 through 2000 Q4, and the model never sees it. Now fit both contenders on the training data only: our VAR, and a separate `auto.arima()` for each series, which is the strongest univariate baseline available without hand-tuning.

```r title="Compare the VAR against univariate ARIMA"
vt <- VAR(diff(train_lev), p = 2, type = "const")
pv <- predict(vt, n.ahead = h)
last_e <- as.numeric(train_lev[nrow(train_lev), "e"])
last_U <- as.numeric(train_lev[nrow(train_lev), "U"])
var_e <- last_e + cumsum(pv$fcst$e[, "fcst"])
var_U <- last_U + cumsum(pv$fcst$U[, "fcst"])
ar_e <- as.numeric(forecast(auto.arima(train_lev[, "e"]), h = h)$mean)
ar_U <- as.numeric(forecast(auto.arima(train_lev[, "U"]), h = h)$mean)
rmse <- function(actual, pred) sqrt(mean((as.numeric(actual) - pred)^2))
round(rbind(e = c(VAR = rmse(test_lev[, "e"], var_e), ARIMA = rmse(test_lev[, "e"], ar_e)),
            U = c(VAR = rmse(test_lev[, "U"], var_U), ARIMA = rmse(test_lev[, "U"], ar_U))), 3)
#>     VAR ARIMA
#> e 1.325 2.029
#> U 0.882 1.479
```

The `cumsum()` step is the piece worth pausing on: the VAR forecasts changes, so adding those changes cumulatively onto the last training level rebuilds a forecast of the level itself, which is what we compare against reality.

The VAR wins on both series. Root mean squared error for employment is 1.325 against ARIMA's 2.029, a 35% reduction, and for unemployment 0.882 against 1.479, a 40% reduction. On this holdout, the information each series carried about the other measurably improved both forecasts.

Seeing the paths side by side shows where the difference came from.

```r title="Compare the forecast paths"
round(cbind(actual = as.numeric(test_lev[, "U"]), VAR = var_U, ARIMA = ar_U), 2)
#>      actual  VAR ARIMA
#> [1,]   7.90 7.89  8.03
#> [2,]   7.87 7.86  8.12
#> [3,]   7.53 7.89  8.25
#> [4,]   6.93 7.92  8.40
#> [5,]   6.80 7.94  8.55
#> [6,]   6.70 7.95  8.69
#> [7,]   6.93 7.96  8.81
#> [8,]   6.87 7.97  8.92
```

Unemployment actually fell from 7.90 to 6.87 over those eight quarters. The ARIMA model extrapolated the recent upward drift it had learned and kept climbing to 8.92, ending more than two points above the truth. The VAR levelled off near 7.9, still too high but by a much smaller margin, because employment growth in the training data pulled its unemployment forecast down.

[TIP]
**Always backtest before believing the extra variables helped.** Adding series to a VAR always improves in-sample fit, since you are adding coefficients, so in-sample R-squared cannot answer this question. A holdout comparison against a univariate baseline can, and it takes about ten lines.

**Try it:** Rerun the unemployment comparison at a four-quarter horizon instead of eight, refitting on the correspondingly longer training window.

```r title="Your turn: backtest at h = 4"
ex_h <- 4
ex_train <- window(lev, end = time(lev)[n_all - ex_h])
ex_test <- window(lev, start = time(lev)[n_all - ex_h + 1])
# Fit VAR on diff(ex_train), forecast ex_h steps, cumsum onto the last level,
# and compare RMSE for U against auto.arima.
# your code here

# Expected: this time the ARIMA baseline comes out ahead
```

<details>
<summary>Click to reveal solution</summary>

```r title="Four-quarter backtest solution"
ex_vt <- VAR(diff(ex_train), p = 2, type = "const")
ex_last <- as.numeric(ex_train[nrow(ex_train), "U"])
ex_var_U <- ex_last + cumsum(predict(ex_vt, n.ahead = ex_h)$fcst$U[, "fcst"])
ex_ar_U <- as.numeric(forecast(auto.arima(ex_train[, "U"]), h = ex_h)$mean)
round(c(VAR = rmse(ex_test[, "U"], ex_var_U),
        ARIMA = rmse(ex_test[, "U"], ex_ar_U)), 3)
#>   VAR ARIMA 
#> 0.454 0.111
round(cbind(actual = as.numeric(ex_test[, "U"]), VAR = ex_var_U, ARIMA = ex_ar_U), 3)
#>      actual   VAR ARIMA
#> [1,]   6.80 6.694 6.694
#> [2,]   6.70 6.490 6.689
#> [3,]   6.93 6.325 6.822
#> [4,]   6.87 6.236 7.031
```

**Explanation:** The result flips. On this window the ARIMA baseline wins with an RMSE of 0.111 against the VAR's 0.454. The detail table shows why: unemployment had been falling steadily, then levelled off around 6.9. The VAR read the employment signal as continued improvement and kept pushing the forecast down to 6.24, while the mean-reverting ARIMA happened to flatten out at roughly the right place. One holdout window is a single sample, so a model that wins over eight quarters can lose over four. Comparing across many forecast origins with [time series cross-validation](Time-Series-Cross-Validation-in-R.html) is the reliable way to settle it.

</details>

## Complete Example: the full four-variable Canada system

Everything so far used two series. Here is the same workflow applied to all four columns of `Canada`, start to finish, which is what a real analysis looks like.

```r title="Difference and test all four series"
d_all <- diff(Canada)
round(sapply(colnames(d_all), function(v) adf.test(d_all[, v])$p.value), 4)
#>      e   prod     rw      U 
#> 0.0827 0.0877 0.0879 0.0270
VARselect(d_all, lag.max = 8, type = "const")$selection
#> AIC(n)  HQ(n)  SC(n) FPE(n) 
#>      2      1      1      2
```

All four differenced series test at or near the stationarity threshold, and the criteria repeat the two-against-two split we saw before. We take two lags again, which means estimating 4 + 2(16) = 36 coefficients from 81 usable rows, since differencing costs one quarter and the two lags cost two more.

```r title="Fit and validate the four-variable model"
full_fit <- VAR(d_all, p = 2, type = "const")
round(as.numeric(serial.test(full_fit, lags.pt = 16,
                             type = "PT.asymptotic")$serial$p.value), 4)
#> [1] 0.9951
round(max(roots(full_fit)), 4)
#> [1] 0.6801
```

A Portmanteau p-value of 0.9951 means there is essentially no autocorrelation left in the residuals, and the largest root of 0.6801 sits well inside the stability boundary. The model is sound enough to interpret.

```r title="Which series drive the system"
round(sapply(colnames(d_all), function(v)
  as.numeric(causality(full_fit, cause = v)$Granger$p.value)), 4)
#>      e   prod     rw      U 
#> 0.0000 0.0030 0.0088 0.1547
```

Three of the four series Granger-cause the rest of the system: employment overwhelmingly, then productivity and real wages. Unemployment at 0.1547 is the odd one out, consistent with what the two-variable model told us, which is that unemployment is a follower rather than a leader in this data.

```r title="Forecast and decompose the four-variable system"
round(predict(full_fit, n.ahead = 4)$fcst$U, 3)
#>        fcst  lower upper    CI
#> [1,] -0.234 -0.809 0.341 0.575
#> [2,] -0.236 -0.943 0.470 0.706
#> [3,] -0.059 -0.849 0.732 0.791
#> [4,]  0.000 -0.832 0.833 0.833
round(fevd(full_fit, n.ahead = 8)$U[8, ], 4)
#>      e   prod     rw      U 
#> 0.4680 0.1438 0.1550 0.2331
```

The forecast still points to unemployment falling for two quarters before flattening. The variance decomposition now spreads the credit across four sources: at a two-year horizon, employment shocks own 46.8% of unemployment's forecast uncertainty, real wages 15.5%, productivity 14.4%, and unemployment's own shocks the remaining 23.3%.

## Frequently Asked Questions

**When should I use a VECM instead of a VAR in differences?**
When your series are cointegrated, meaning they wander individually but never drift permanently apart. Differencing erases that long-run relationship, and a vector error correction model keeps it by adding a term that pulls the system back toward equilibrium. Test with the Johansen procedure, `urca::ca.jo()`, before differencing a set of series that theory says should move together.

**How many variables can I put in a VAR?**
Fewer than you want to. A VAR estimates $K + pK^2$ coefficients, so going from 3 variables to 6 at two lags jumps from 21 coefficients to 78 while your sample size stays the same. With quarterly macro data most practitioners stop at three to six variables. Beyond that, look at Bayesian VARs or factor models, which shrink the coefficients toward zero instead of estimating each one freely.

**Should I fit in levels or in differences?**
Differences are the safe default for non-stationary series, and that is what this tutorial used. Fitting in levels is defensible when the series are cointegrated, since the levels VAR remains consistent even though standard inference gets complicated. Fitting in levels because the tests were inconvenient is not defensible.

**How is a VAR different from ARIMAX or dynamic regression?**
ARIMAX treats one series as the target and the others as external inputs, which means forecasting requires you to supply future values of those inputs. A VAR treats every series as both cause and effect, so it generates its own inputs and needs nothing from you. Use ARIMAX when the predictor is genuinely external, such as a published policy rate; use a VAR when the variables feed back into each other.

**Why did my impulse responses change when I reordered the columns?**
Because orthogonalised impulse responses depend on the Cholesky ordering, which comes straight from your column order. Whichever variable is listed first is assumed to affect the others contemporaneously without being affected in return. Report the ordering you used, and check that your conclusions hold under a plausible alternative.

**How do I add seasonal dummies or a deterministic trend?**
`VAR()` takes a `season` argument for centred seasonal dummies (`season = 4` for quarterly data) and a `type` argument that accepts `"const"`, `"trend"`, `"both"`, or `"none"`. Include seasonality when the raw data is not seasonally adjusted; the `Canada` series already are, which is why we did not need it.

## Practice Exercises

### Exercise 1: Build and validate a three-variable VAR

Fit a VAR on the first differences of `e`, `U`, and `rw` from `Canada`. Choose the lag order with `VARselect()` using `lag.max = 8`, fit with `type = "const"`, then prove the model is usable by showing the Portmanteau p-value and the largest stability root. Store the fitted model as `cap1_fit`.

```r title="Exercise 1 starter: three-variable system"
# 1. cap1_d <- diff of the three columns
# 2. VARselect(cap1_d, lag.max = 8, type = "const")$selection
# 3. cap1_fit <- VAR(cap1_d, p = 2, type = "const")
# 4. Portmanteau p-value with lags.pt = 12, and max(Mod(roots(cap1_fit)))
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Three-variable VAR solution"
cap1_d <- diff(Canada[, c("e", "U", "rw")])
VARselect(cap1_d, lag.max = 8, type = "const")$selection
#> AIC(n)  HQ(n)  SC(n) FPE(n) 
#>      2      1      1      2
cap1_fit <- VAR(cap1_d, p = 2, type = "const")
round(as.numeric(serial.test(cap1_fit, lags.pt = 12,
                             type = "PT.asymptotic")$serial$p.value), 4)
#> [1] 0.8407
round(max(Mod(roots(cap1_fit))), 4)
#> [1] 0.6617
```

**Explanation:** The criteria split the same way as before, so two lags is again the reasonable pick. A Portmanteau p-value of 0.8407 says no autocorrelation survives in the residuals, and the largest root of 0.6617 is below one, so the system is stable.

</details>

### Exercise 2: Find what drives real wages

Using the four-variable `full_fit` from the Complete Example, report the forecast error variance decomposition for `rw` at horizon 8 and at horizon 1. Identify which shock dominates at each horizon, and explain why the impact row is so lopsided.

```r title="Exercise 2 starter: decompose real wages"
# fevd(full_fit, n.ahead = 8)$rw is a matrix with one row per horizon.
# Print row 8 and row 1, rounded to 4 places.
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Real wage decomposition solution"
cap2_fv <- fevd(full_fit, n.ahead = 8)$rw
round(cap2_fv[8, ], 4)
#>      e   prod     rw      U 
#> 0.0553 0.1542 0.7677 0.0227
round(cap2_fv[1, ], 4)
#>      e   prod     rw      U 
#> 0.0009 0.0104 0.9887 0.0000
```

**Explanation:** Real wages are mostly self-driven. At horizon 1, 98.87% of the forecast error comes from wage shocks themselves, and by horizon 8 that has only fallen to 76.77%, with productivity taking the largest outside share at 15.42%. The impact row is lopsided because of the Cholesky ordering: `rw` sits third in the column order, so `U` (fourth) is barred from affecting it contemporaneously, which is why the `U` entry is exactly 0.

</details>

### Exercise 3: Does a third variable improve the forecast?

Backtest two competing models on the last eight quarters of unemployment. Model A is a VAR on the differences of `e` and `U`; model B adds `rw`. Train both on everything before the final eight quarters, cumulate the differenced forecasts back into levels, and compare RMSE against the actual test values.

```r title="Exercise 3 starter: two-variable against three-variable"
# Reuse h = 8 and the rmse() helper defined earlier.
# cap3_tr <- window(Canada, end = time(Canada)[nrow(Canada) - h])
# cap3_te <- window(Canada, start = time(Canada)[nrow(Canada) - h + 1])
# Fit VAR(diff(...), p = 2, type = "const") on each variable set,
# add cumsum() of the U forecast to the last training level of U.
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Model comparison backtest solution"
cap3_tr <- window(Canada, end = time(Canada)[nrow(Canada) - h])
cap3_te <- window(Canada, start = time(Canada)[nrow(Canada) - h + 1])
cap3_f2 <- VAR(diff(cap3_tr[, c("e", "U")]), p = 2, type = "const")
cap3_f3 <- VAR(diff(cap3_tr[, c("e", "U", "rw")]), p = 2, type = "const")
cap3_last <- as.numeric(cap3_tr[nrow(cap3_tr), "U"])
cap3_u2 <- cap3_last + cumsum(predict(cap3_f2, n.ahead = h)$fcst$U[, "fcst"])
cap3_u3 <- cap3_last + cumsum(predict(cap3_f3, n.ahead = h)$fcst$U[, "fcst"])
round(c(two_var = rmse(cap3_te[, "U"], cap3_u2),
        three_var = rmse(cap3_te[, "U"], cap3_u3)), 4)
#>   two_var three_var 
#>    0.8821    0.3720
```

**Explanation:** Adding real wages cuts the RMSE from 0.8821 to 0.3720, a 58% improvement. Real wages carried information about the labour market that neither employment nor unemployment already contained. Note that this had to be measured on held-out data, because the three-variable model would have fit the training sample better no matter what.

</details>

## Summary

A VAR is a system of ordinary regressions in which every series is explained by the recent past of every series. That single idea produces forecasts, causality tests, shock analysis, and variance decompositions, all from one fitted object. The workflow below is the order to run them in.

![The six steps of a VAR analysis](screenshots/VAR-Models-in-R-workflow.webp)
*Figure 3: The six steps of a VAR analysis, from stationarity test to backtest.*

Here is every function this tutorial used, with the question it answers.

| Function | Question it answers | Package |
|---|---|---|
| `adf.test()`, `kpss.test()` | Is this series stationary? | tseries |
| `VARselect()` | How many lags should I use? | vars |
| `VAR()` | What are the coefficients? | vars |
| `roots()` | Is the fitted system stable? | vars |
| `serial.test()`, `arch.test()` | Are the residuals well behaved? | vars |
| `causality()` | Does X help predict Y? | vars |
| `irf()` | What path does a shock trace? | vars |
| `fevd()` | Which shock owns the forecast error? | vars |
| `predict()`, `fanchart()` | What happens next? | vars |

The takeaways worth carrying forward:

- **Difference first, model second.** Non-stationary series invite spurious relationships, and the ADF p-value points the opposite way to most tests: a large value is the warning, not the all-clear.
- **Pick the lag order with `VARselect()`, then confirm with the residuals.** When the criteria disagree, prefer the larger order and check that `serial.test()` finds no leftover autocorrelation.
- **Granger causality is about forecasting, not mechanism.** It tells you which series carries information first, which is genuinely useful and is not the same as knowing what causes what.
- **Impulse responses depend on the column ordering.** The Cholesky assumption is yours to defend, so state it and test whether your conclusions survive a different one.
- **Backtest against a univariate baseline.** In-sample fit always improves when you add series, so a holdout comparison is the only evidence that the extra variables actually help. On the eight-quarter holdout here the VAR cut forecast error by 35% to 40% against `auto.arima()`, though the exercise at four quarters shows a single window can go the other way.

## References

1. Pfaff, B. - *VAR, SVAR and SVEC Models: Implementation Within R Package vars*. Journal of Statistical Software 27(4), 2008. Written by the package author, and the clearest account of what each `vars` function estimates and why. [Link](https://www.jstatsoft.org/article/view/v027i04)
2. Pfaff, B. - vars package reference manual on CRAN. The argument-by-argument reference for `VAR()`, `irf()`, `fevd()` and the diagnostic tests used above. [Link](https://cran.r-project.org/web/packages/vars/vars.pdf)
3. Hyndman, R.J. & Athanasopoulos, G. - *Forecasting: Principles and Practice* (2nd ed), Section 11.2: Vector autoregressions. A short, worked treatment that pairs a VAR with the `forecast` package tooling used in the backtest here. [Link](https://otexts.com/fpp2/VAR.html)
4. Hyndman, R.J. & Athanasopoulos, G. - *Forecasting: Principles and Practice* (3rd ed), Section 12.3: Vector autoregressions. The updated edition of the same chapter, rewritten around the fable framework if you prefer tidy syntax. [Link](https://otexts.com/fpp3/VAR.html)
5. Lutkepohl, H. - *New Introduction to Multiple Time Series Analysis*. Springer (2005). The standard reference for VAR theory, including Cholesky identification and FEVD. [Link](https://link.springer.com/book/10.1007/978-3-540-27752-1)
6. Trapletti, A. & Hornik, K. - tseries package reference, including `adf.test` and `kpss.test`. [Link](https://cran.r-project.org/web/packages/tseries/tseries.pdf)
7. Pfaff, B. - urca package reference, including the Johansen cointegration procedure. [Link](https://cran.r-project.org/web/packages/urca/urca.pdf)

## Continue Learning

- [ARIMA in R: What AR, I, and MA Mean and How to Fit One](ARIMA-in-R.html) - the univariate foundation a VAR generalises, including what the AR terms in each VAR equation are doing.
- [Test Stationarity in R](Test-Stationarity-in-R.html) - a deeper guide to the ADF and KPSS tests, including what to do when the two disagree.
- [Dynamic Regression in R](Dynamic-Regression-in-R.html) - the alternative approach for when one series is genuinely external rather than part of a feedback system.
