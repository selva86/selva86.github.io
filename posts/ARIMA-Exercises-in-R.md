---
title: "ARIMA Exercises in R: 25 Real-World Practice Problems"
slug: "ARIMA-Exercises-in-R"
description: "Practice 25 ARIMA exercises in R: stationarity tests, ACF/PACF, auto.arima, seasonal SARIMA, diagnostics, forecasting accuracy. Hidden solutions."
keywords: "ARIMA exercises in R, ARIMA in R, auto.arima exercises, SARIMA practice, R forecasting exercises, seasonal ARIMA, Ljung-Box test"
mathjax: true
webr: true
date: "2026-05-12"
post_type: "EX"
sidebar_title: "ARIMA Exercises"
sidebar_order: 132
fr_parent: "Time-Series-Analysis-With-R.html"
auto_link_terms: "arima exercises in r|auto.arima exercises|sarima practice|forecast r exercises|arima in r practice"
auto_link_case_sensitive: false
target_keyword: "ARIMA in R"
sibling_block_enabled: false
difficulty: "Mixed"
---

# ARIMA Exercises in R: 25 Real-World Practice Problems

<p class="lead">Twenty-five end-to-end ARIMA practice problems covering stationarity, ACF/PACF identification, fitting with <code>Arima()</code> and <code>auto.arima()</code>, seasonal SARIMA, residual diagnostics, and forecast evaluation. Each task uses a built-in series or short inline data so you can run it in the browser. Solutions are hidden until you click reveal.</p>

```r title="Run this once before any exercise"
library(forecast)
library(tseries)
library(ggplot2)
```

## Section 1. Stationarity, transformations, differencing (4 problems)

### Exercise 1.1: Visualize AirPassengers and flag non-stationary behaviour

**Task:** A junior analyst onboarding to the forecasting team is asked to inspect the monthly `AirPassengers` series before any modelling. Produce a time plot of the series and save the resulting ggplot object to `ex_1_1`. The plot should make the upward trend and growing seasonal amplitude visible.

**Expected result:**

```
#> A ggplot showing passengers (y) versus monthly date (x) from 1949-01 to 1960-12.
#> Visible: strong upward trend from ~110 to ~600 and seasonal cycle whose amplitude
#> grows with the level (variance increases over time).
```

**Difficulty:** Beginner

[HINTS]
Always eyeball a series before modelling it; a time plot exposes trend and whether the seasonal swings grow with the level.
Use the tidy `autoplot()` helper on `AirPassengers` directly and add a `ggplot2::labs()` title rather than hand-building a chart.

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- autoplot(AirPassengers) +
  ggplot2::labs(title = "Monthly air passengers", y = "Passengers (thousands)")
ex_1_1
```

**Explanation:** `autoplot()` from forecast dispatches a tidy `ggplot2` time plot for `ts` objects, so you avoid hand-coding `ggplot()`. Eyeballing the series first is mandatory: the growing seasonal amplitude here is the visual signal that a log transform will help before any ARIMA fitting. Skipping the plot is the most common rookie mistake.

</details>

### Exercise 1.2: Variance-stabilise AirPassengers with a log transform

**Task:** Because the amplitude of the seasonal cycle in `AirPassengers` grows with the level, take a natural log of the series and store the resulting `ts` object as `ex_1_2`. Then print the head of the transformed series so the team can confirm the seasonal swings are now roughly constant in size.

**Expected result:**

```
#>           Jan      Feb      Mar      Apr      May      Jun
#> 1949 4.718499 4.770685 4.882802 4.859812 4.795791 4.905275
#> 1950 4.744932 4.836282 4.948760 4.905275 4.828314 5.003946
#> ...
#> Time series ranges from 1949-01 to 1960-12, 144 observations.
```

**Difficulty:** Beginner

[HINTS]
When seasonal amplitude grows with the level, compressing the scale makes those swings roughly constant in size.
Apply `log()` straight to the `AirPassengers` ts object; it keeps the frequency and start/end attributes intact.

```r title="Your turn"
ex_1_2 <- # your code here
head(ex_1_2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- log(AirPassengers)
head(ex_1_2)
#>           Jan      Feb      Mar      Apr      May      Jun
#> 1949 4.718499 4.770685 4.882802 4.859812 4.795791 4.905275
```

**Explanation:** Applying `log()` to a `ts` object preserves the `tsp` attribute, so frequency and start/end dates carry over. Log is the right transform when seasonal variance scales with the mean (multiplicative seasonality). Box-Cox via `BoxCox.lambda()` is the principled alternative when the right exponent is unclear, but for AirPassengers, log is the textbook choice.

</details>

### Exercise 1.3: Augmented Dickey-Fuller test on Nile

**Task:** The annual `Nile` river flow series looks like it may have a structural break around 1899. Run an Augmented Dickey-Fuller test using `tseries::adf.test()` on the raw series and save the full htest object to `ex_1_3`. Inspect the p-value to decide whether the unit-root null can be rejected at the 5 percent level.

**Expected result:**

```
#> Augmented Dickey-Fuller Test
#>
#> data:  Nile
#> Dickey-Fuller = -2.5447, Lag order = 4, p-value = 0.3502
#> alternative hypothesis: stationary
```

**Difficulty:** Intermediate

[HINTS]
A unit-root test decides whether the raw series can be modelled as-is or must be differenced first.
Call `adf.test()` from tseries on `Nile`, keep the whole htest object, and read its `p-value` against 0.05.

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- adf.test(Nile)
ex_1_3
#> Dickey-Fuller = -2.5447, Lag order = 4, p-value = 0.3502
```

**Explanation:** The p-value 0.35 is far above 0.05, so we cannot reject the unit-root null: Nile is non-stationary in its raw form and needs differencing before ARMA fitting. ADF assumes the alternative is stationarity around a constant, so a series with a known break (1899) violates that. KPSS via `kpss.test()` flips the null and is a useful sanity check whenever ADF returns ambiguous results.

</details>

### Exercise 1.4: Determine the differencing order d for co2 with ndiffs()

**Task:** The monthly Mauna Loa `co2` series clearly drifts upward. Use `forecast::ndiffs()` to estimate the number of non-seasonal differences required to make it stationary, using the default KPSS test. Save the integer result to `ex_1_4` and print it. This number is the `d` you will plug into `ARIMA(p,d,q)`.

**Expected result:**

```
#> [1] 1
#> (interpretation: one regular difference is sufficient for co2)
```

**Difficulty:** Intermediate

[HINTS]
The count of regular differences needed for stationarity is exactly the d you plug into ARIMA(p,d,q).
Pass `co2` to `ndiffs()` from forecast, which repeats the default KPSS test until the series is stationary.

```r title="Your turn"
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_4 <- ndiffs(co2)
ex_1_4
#> [1] 1
```

**Explanation:** `ndiffs()` runs the chosen unit-root test repeatedly, differencing once and re-testing, until stationarity is achieved (or a max of 2). For `co2`, one regular difference flattens the long trend; the residual seasonal pattern is then handled with `nsdiffs()`. Picking `d` by eye is unreliable : `ndiffs()` is the deterministic, reproducible choice and is exactly what `auto.arima()` calls internally.

</details>

## Section 2. ACF/PACF identification (4 problems)

### Exercise 2.1: ACF and PACF of differenced log AirPassengers

**Task:** Take the first difference of `log(AirPassengers)` to remove the trend, then plot the ACF and PACF side by side using `ggAcf()` and `ggPacf()` from forecast. Save the differenced series to `ex_2_1`. You will use these two plots in the next section to pick non-seasonal AR and MA orders.

**Expected result:**

```
#> A numeric ts of length 143 (one observation lost to differencing).
#> ggAcf(ex_2_1): seasonal spike at lag 12 dominates; a few significant short lags.
#> ggPacf(ex_2_1): negative spike near lag 1, smaller spikes around lag 12.
```

**Difficulty:** Intermediate

[HINTS]
Strip out the trend first so the correlation plots reveal the AR and MA structure that actually matters.
Build the series with `diff(log(AirPassengers))`, then plot it with `ggAcf()` and `ggPacf()` from forecast.

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- diff(log(AirPassengers))
ggAcf(ex_2_1)
ggPacf(ex_2_1)
```

**Explanation:** Differencing removes the deterministic upward trend but leaves seasonal structure intact, which is why the ACF still shows a huge spike at lag 12. The job of the analyst is to read both plots together: cutting tails on the PACF suggest AR orders, cutting tails on the ACF suggest MA orders. A persistent lag-12 spike is the giveaway that a seasonal MA term is also needed.

</details>

### Exercise 2.2: Identify AR order from a simulated AR(2)

**Task:** Simulate 300 observations from an `AR(2)` process with coefficients 0.6 and -0.3 using `arima.sim()`, then plot the PACF. Save the simulated series to `ex_2_2`. Read off the PACF: at which lag does the function cut off, and does that match the data-generating process?

**Expected result:**

```
#> Time-Series [1:300] from 1 to 300: 0.45 -0.12 0.88 ...
#> ggPacf shows: significant spikes at lags 1 and 2, near-zero from lag 3 onward.
#> Interpretation: AR(2) confirmed.
```

**Difficulty:** Intermediate

[HINTS]
An autoregressive process feeds past values forward, so synthesising one lets you confirm the partial-autocorrelation cutoff rule.
Use `arima.sim()` with `model = list(ar = c(0.6, -0.3))` and `n = 300`.

```r title="Your turn"
set.seed(1)
ex_2_2 <- # your code here
ggPacf(ex_2_2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
ex_2_2 <- arima.sim(model = list(ar = c(0.6, -0.3)), n = 300)
ggPacf(ex_2_2)
```

**Explanation:** For an AR(p) process, the partial autocorrelation function cuts off after lag p while the ACF tails off exponentially. The PACF here has two significant bars then collapses to noise, matching the AR(2) DGP. This pattern-matching rule (PACF cutoff for AR, ACF cutoff for MA) is the Box-Jenkins core diagnostic; `auto.arima()` automates it but you should be able to do it by hand for small models.

</details>

### Exercise 2.3: Identify MA order from a simulated MA(1)

**Task:** Simulate 300 observations from an `MA(1)` process with coefficient 0.7 using `arima.sim()`. Plot the ACF. Save the simulated series to `ex_2_3`. The mirror rule of the previous exercise applies: which lag does the ACF cut off at, and does that imply MA(1)?

**Expected result:**

```
#> Time-Series [1:300] from 1 to 300.
#> ggAcf: large positive spike at lag 1 (~ 0.45), all subsequent lags inside CI band.
#> Interpretation: MA(1) confirmed.
```

**Difficulty:** Intermediate

[HINTS]
A moving-average process mixes only recent shocks, so its memory is short and shows up at just a few lags.
Use `arima.sim()` with `model = list(ma = 0.7)` and `n = 300`.

```r title="Your turn"
set.seed(2)
ex_2_3 <- # your code here
ggAcf(ex_2_3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(2)
ex_2_3 <- arima.sim(model = list(ma = 0.7), n = 300)
ggAcf(ex_2_3)
```

**Explanation:** Where AR(p) leaves a clean cutoff in the PACF, MA(q) does the same for the ACF. The theoretical ACF of MA(1) is non-zero only at lag 1, equal to `theta/(1+theta^2)` = 0.7/1.49 = 0.47, which is what you see. If you see ACF cutting off at lag 2 instead, suspect MA(2). Mixed ARMA(p,q) processes show neither clean cutoff and need information criteria to disentangle.

</details>

### Exercise 2.4: Distinguish AR vs MA from theoretical ACF/PACF patterns

**Task:** A code reviewer hands you two series of length 500: one generated by `AR(1)` with coefficient 0.8, another by `MA(1)` with coefficient 0.8. Without peeking at the call, compute the ACF and PACF of each and decide which is which by reading the cutoff vs tail-off pattern. Save a named list `list(series_a = "AR(1)", series_b = "MA(1)")` to `ex_2_4`.

**Expected result:**

```
#> $series_a
#> [1] "AR(1)"
#>
#> $series_b
#> [1] "MA(1)"
```

**Difficulty:** Advanced

[HINTS]
One family leaves a clean cutoff in the partial autocorrelations; the mirror family leaves it in the ordinary autocorrelations.
Compare `ggAcf()` and `ggPacf()` for each series, then assign a named `list()` with elements `series_a` and `series_b`.

```r title="Your turn"
set.seed(3)
series_a <- arima.sim(list(ar = 0.8), n = 500)
series_b <- arima.sim(list(ma = 0.8), n = 500)
ggAcf(series_a); ggPacf(series_a)
ggAcf(series_b); ggPacf(series_b)
ex_2_4 <- # your classification
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(3)
series_a <- arima.sim(list(ar = 0.8), n = 500)
series_b <- arima.sim(list(ma = 0.8), n = 500)

ex_2_4 <- list(series_a = "AR(1)", series_b = "MA(1)")
ex_2_4
#> $series_a [1] "AR(1)"
#> $series_b [1] "MA(1)"
```

**Explanation:** Series A shows the ACF decaying geometrically (0.8, 0.64, 0.51, ...) while the PACF cuts off cleanly at lag 1 : classic AR(1). Series B is the mirror: ACF spike only at lag 1, PACF tails off geometrically (with alternating sign) : classic MA(1). The duality is `pi_k` non-zero for finite k in MA, and `rho_k` non-zero for finite k in AR. When in doubt, plot both and let the cutoff side win.

</details>

## Section 3. Fitting ARIMA models (4 problems)

### Exercise 3.1: Fit ARIMA(1,1,1) to Nile with Arima()

**Task:** Using `forecast::Arima()`, fit a non-seasonal `ARIMA(1,1,1)` model to the `Nile` series. Save the fitted model object to `ex_3_1`. Print the model to read off the estimated AR1 and MA1 coefficients along with their standard errors and the log-likelihood.

**Expected result:**

```
#> Series: Nile
#> ARIMA(1,1,1)
#>
#> Coefficients:
#>          ar1     ma1
#>       0.2944  -0.8302
#> s.e.  0.1170   0.0709
#>
#> sigma^2 estimated as 20177:  log likelihood=-630.14
#> AIC=1266.27   AICc=1266.52   BIC=1274.06
```

**Difficulty:** Intermediate

[HINTS]
Fixing p, d, and q yourself fits one exact specification instead of searching the model space.
Call `Arima()` from forecast on `Nile` with `order = c(1, 1, 1)`.

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- Arima(Nile, order = c(1, 1, 1))
ex_3_1
#> ARIMA(1,1,1)
#> ar1 = 0.29, ma1 = -0.83
```

**Explanation:** `Arima()` from forecast wraps `stats::arima()` but adds a constant for differenced series and a clean `summary()` printout. The AR1 coefficient is small and only marginally significant (z = 2.5); the MA1 coefficient is large and very significant. In practice, this points toward a simpler `ARIMA(0,1,1)` parameterisation, which is the IMA(1,1) random-walk-with-noise model that Nile is famous for.

</details>

### Exercise 3.2: auto.arima() on the lh series

**Task:** The `lh` dataset in datasets contains 48 observations of luteinising hormone in 10-minute intervals. Run `auto.arima()` on `lh` with `seasonal = FALSE` and `stepwise = FALSE` to force a thorough search. Save the resulting fitted model to `ex_3_2` and print the chosen order with its AICc.

**Expected result:**

```
#> Series: lh
#> ARIMA(1,0,1) with non-zero mean
#>
#> Coefficients:
#>          ar1      ma1    mean
#>       0.4521  0.1969   2.4099
#> s.e.  0.1922  0.2070   0.1465
#>
#> sigma^2 estimated as 0.1986:  log likelihood=-29.38
#> AIC=66.76   AICc=67.72   BIC=74.24
```

**Difficulty:** Intermediate

[HINTS]
An automated search enumerates candidate orders for you when you do not want to read the plots by hand.
Run `auto.arima()` on `lh` with `seasonal = FALSE` and `stepwise = FALSE` (add `approximation = FALSE` for an exact AICc).

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- auto.arima(lh, seasonal = FALSE, stepwise = FALSE, approximation = FALSE)
ex_3_2
#> ARIMA(1,0,1) with non-zero mean, AICc ~ 67.7
```

**Explanation:** Default `stepwise = TRUE` greedily walks the model space, which is fast but can miss optima. Forcing `stepwise = FALSE` enumerates more candidate orders, and `approximation = FALSE` does exact MLE rather than the conditional sum of squares used during the search. Slower, but the AICc you report is exact, which matters for journal-quality results. For 90 percent of production use, the default stepwise is fine.

</details>

### Exercise 3.3: AIC grid search on WWWusage

**Task:** Without using `auto.arima()`, fit every `ARIMA(p, 1, q)` for p in 0:3 and q in 0:3 (16 models) to the `WWWusage` series. Collect the AICc from each in a tibble with columns `p`, `q`, `aicc`, sort ascending, and save to `ex_3_3`. Confirm which (p,q) wins.

**Expected result:**

```
#> # A tibble: 16 x 3
#>       p     q   aicc
#>   <int> <int>  <dbl>
#> 1     3     1  514.
#> 2     1     1  515.
#> 3     2     1  515.
#> 4     3     0  516.
#> # 12 more rows hidden
```

**Difficulty:** Advanced

[HINTS]
Ranking many fixed-order fits by an information criterion is the manual version of automatic order selection.
Loop over the grid rows with `mapply()`, fit each `Arima(WWWusage, order = c(p, 1, q))`, collect `$aicc`, and sort with `order()`.

```r title="Your turn"
grid <- expand.grid(p = 0:3, q = 0:3)
ex_3_3 <- # iterate, fit Arima(WWWusage, order = c(p,1,q)), collect AICc
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
grid <- expand.grid(p = 0:3, q = 0:3)
grid$aicc <- mapply(function(p, q) {
  fit <- tryCatch(Arima(WWWusage, order = c(p, 1, q)),
                  error = function(e) NULL)
  if (is.null(fit)) NA_real_ else fit$aicc
}, grid$p, grid$q)
ex_3_3 <- grid[order(grid$aicc), ]
head(ex_3_3)
#>   p q     aicc
#> 1 3 1  514.3
#> 2 1 1  515.1
```

**Explanation:** Hand-rolling the grid is what `auto.arima()` does internally and is a useful exercise for understanding the trade-off between log-likelihood and parameter count. AICc penalises both, with a small-sample correction over AIC. Wrap the fit in `tryCatch()` because some (p,q) combinations fail to converge or violate stationarity. The winner here is typically `ARIMA(3,1,1)` or `ARIMA(1,1,1)` depending on optimiser settings.

</details>

### Exercise 3.4: Fit ARIMA with drift on log AirPassengers

**Task:** Fit a non-seasonal `ARIMA(0,1,1)` model with drift to `log(AirPassengers)` using `Arima(..., include.drift = TRUE)`. The drift term captures the long-run linear trend in the log series. Save the model to `ex_3_4` and print the drift coefficient with its standard error.

**Expected result:**

```
#> Series: log(AirPassengers)
#> ARIMA(0,1,1) with drift
#>
#> Coefficients:
#>          ma1   drift
#>       0.3905  0.0100
#> s.e.  0.0717  0.0014
#>
#> sigma^2 estimated as 0.01446:  log likelihood=87.95
#> AIC=-169.9   AICc=-169.72   BIC=-161.01
```

**Difficulty:** Intermediate

[HINTS]
A differenced series can still climb steadily, and the model must be told to estimate that linear trend.
Call `Arima()` on `log(AirPassengers)` with `order = c(0, 1, 1)` and `include.drift = TRUE`.

```r title="Your turn"
ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_4 <- Arima(log(AirPassengers), order = c(0, 1, 1), include.drift = TRUE)
ex_3_4
#> ARIMA(0,1,1) with drift; drift = 0.0100 (s.e. 0.0014)
```

**Explanation:** A drift term in an ARIMA model with `d = 1` adds a deterministic linear trend on top of the random walk component. The estimated drift 0.0100 per month corresponds to roughly 12 percent compound annual growth in passengers, which matches the visual slope of the log series. Without `include.drift = TRUE`, the differenced series is forced to have mean zero, biasing forecasts downward for a clearly trending series.

</details>

## Section 4. Seasonal ARIMA (4 problems)

### Exercise 4.1: Detect seasonal differencing need with nsdiffs()

**Task:** Apply `forecast::nsdiffs()` to the seasonally differenced `AirPassengers` series after a log transform. The function returns the number of seasonal differences needed to make the series seasonally stationary. Save the integer to `ex_4_1` and reason about whether `D = 1` is enough.

**Expected result:**

```
#> [1] 1
#> (interpretation: one seasonal difference at lag 12 suffices)
```

**Difficulty:** Intermediate

[HINTS]
Just as a trend needs regular differencing, a repeating yearly cycle has its own seasonal differencing count, the D.
Pass `log(AirPassengers)` to `nsdiffs()` from forecast.

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- nsdiffs(log(AirPassengers))
ex_4_1
#> [1] 1
```

**Explanation:** `nsdiffs()` runs a seasonal unit-root test (default OCSB) at the series frequency. A return of 1 means take one seasonal difference: `diff(x, lag = 12)` for monthly data. Combined with `ndiffs()` from Exercise 1.4, you now have both `d = 1` and `D = 1`, the canonical airline-model differencing pattern. Going to `D = 2` is rarely justified and usually overdifferences.

</details>

### Exercise 4.2: Seasonal differencing on co2

**Task:** Apply a seasonal difference of lag 12 to the `co2` series using `diff(x, lag = 12)` and save the result to `ex_4_2`. Then plot it to confirm the seasonal cycle is gone but a slight residual trend remains, which will need an additional regular difference later.

**Expected result:**

```
#> Time-Series [1:456] from Jan 1960 to Dec 1997: 0.07 -0.21 0.43 ...
#> Plot shows: no obvious seasonal cycle, mild positive drift retained.
```

**Difficulty:** Intermediate

[HINTS]
Subtracting each value from the one a full cycle earlier cancels out a repeating seasonal pattern.
Call `diff()` on `co2` with `lag = 12`, then `autoplot()` the result.

```r title="Your turn"
ex_4_2 <- # your code here
autoplot(ex_4_2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- diff(co2, lag = 12)
autoplot(ex_4_2) +
  ggplot2::labs(title = "co2 after seasonal differencing")
```

**Explanation:** `diff(x, lag = 12)` produces `x_t - x_{t-12}`, which kills any cycle of period 12. The remaining series shows a year-over-year change, which for CO2 hovers between roughly 1 and 3 ppm and drifts upward as emissions accelerate. To make it fully stationary, you typically apply a further `diff()` (regular difference of lag 1), giving the combined `(1-B)(1-B^12)` filter used in SARIMA models.

</details>

### Exercise 4.3: Fit the airline SARIMA(0,1,1)(0,1,1)[12]

**Task:** The Box-Jenkins airline model is `ARIMA(0,1,1)(0,1,1)[12]` on the log series. Fit this exact specification to `log(AirPassengers)` using `Arima()`, save the model to `ex_4_3`, and print the MA1 and seasonal MA1 estimates with their standard errors. This is the benchmark every airline-style monthly series gets compared against.

**Expected result:**

```
#> Series: log(AirPassengers)
#> ARIMA(0,1,1)(0,1,1)[12]
#>
#> Coefficients:
#>          ma1     sma1
#>       -0.4018  -0.5569
#> s.e.   0.0896   0.0731
#>
#> sigma^2 estimated as 0.001371:  log likelihood=244.7
#> AIC=-483.4   AICc=-483.21   BIC=-474.77
```

**Difficulty:** Advanced

[HINTS]
A seasonal model layers a second set of orders, operating at the cycle length, on top of the non-seasonal ones.
Call `Arima()` on `log(AirPassengers)` with `order = c(0, 1, 1)` and `seasonal = list(order = c(0, 1, 1), period = 12)`.

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- Arima(log(AirPassengers),
                order = c(0, 1, 1),
                seasonal = list(order = c(0, 1, 1), period = 12))
ex_4_3
#> ARIMA(0,1,1)(0,1,1)[12]; ma1 = -0.40, sma1 = -0.56
```

**Explanation:** The airline model factorises the dependence as a non-seasonal IMA(1,1) on top of a seasonal IMA(1,1). Both MA coefficients are large and significant: the non-seasonal MA captures short-run noise smoothing while the seasonal MA captures slow drift in the seasonal pattern itself. Until you can beat AICc of this 2-parameter model on a monthly business series, you do not need anything more complicated.

</details>

### Exercise 4.4: auto.arima() with seasonality on co2

**Task:** Run `auto.arima(co2)` letting the algorithm choose both non-seasonal and seasonal orders. Save the fitted model to `ex_4_4` and confirm the selected order. You should see a SARIMA structure with at least one seasonal MA term given the 12-month cycle.

**Expected result:**

```
#> Series: co2
#> ARIMA(1,1,1)(1,1,2)[12]
#>
#> Coefficients:
#>          ar1      ma1    sar1     sma1    sma2
#>       0.2569  -0.5847  -0.5871  -0.0962  -0.4924
#> s.e.  0.1406   0.1190   0.1473   0.1487   0.1313
#>
#> sigma^2 estimated as 0.08576:  log likelihood=-86.49
#> AIC=184.97   AICc=185.20   BIC=212.66
```

**Difficulty:** Intermediate

[HINTS]
Let the search decide both the regular and the seasonal orders rather than specifying them yourself.
Run `auto.arima()` on `co2` with the default `seasonal = TRUE`, which reads the period from `frequency()`.

```r title="Your turn"
ex_4_4 <- # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_4 <- auto.arima(co2)
ex_4_4
#> ARIMA(1,1,1)(1,1,2)[12]
```

**Explanation:** With `seasonal = TRUE` (default), `auto.arima()` infers the period from `frequency(co2) = 12` and searches over both seasonal and non-seasonal orders simultaneously. The chosen `(1,1,1)(1,1,2)[12]` model has 5 estimated parameters and an AICc near 185 : much better than the airline model on this dataset because the seasonal cycle in CO2 is more nuanced than in passenger traffic. Always trust the algorithm to find structure you would miss by eye.

</details>

## Section 5. Diagnostics and validation (4 problems)

### Exercise 5.1: Ljung-Box test on airline-model residuals

**Task:** Apply the Ljung-Box test to the residuals of your `ex_4_3` airline model using `Box.test(..., type = "Ljung", lag = 24, fitdf = 2)`. The `fitdf` adjustment subtracts the two MA parameters from the degrees of freedom. Save the htest object to `ex_5_1` and judge whether residuals look like white noise.

**Expected result:**

```
#> Box-Ljung test
#>
#> data:  residuals(ex_4_3)
#> X-squared = 29.418, df = 22, p-value = 0.1339
#> alternative hypothesis: nonzero autocorrelation
```

**Difficulty:** Intermediate

[HINTS]
A portmanteau test asks whether the leftover errors still carry any pattern the model failed to capture.
Call `Box.test()` on `residuals(ex_4_3)` with `type = "Ljung"`, `lag = 24`, and `fitdf = 2`.

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- Box.test(residuals(ex_4_3), lag = 24, fitdf = 2, type = "Ljung")
ex_5_1
#> X-squared = 29.4, df = 22, p-value = 0.134
```

**Explanation:** A p-value above 0.05 means you cannot reject the null of no autocorrelation in residuals at lags 1 through 24, so the residuals behave like white noise : exactly what an adequate model should produce. The `fitdf` adjustment is critical: forgetting it inflates df and biases the test toward not rejecting. Rule of thumb: set `lag` to about 2 * frequency for monthly data, never lower than 10.

</details>

### Exercise 5.2: checkresiduals() summary on airline model

**Task:** Pass the `ex_4_3` airline-model object to `forecast::checkresiduals()`. This produces a three-panel diagnostic plot (time plot of residuals, ACF, histogram) and prints the Ljung-Box test. Save the htest portion of the return value to `ex_5_2` and inspect both the visual and the test.

**Expected result:**

```
#> Ljung-Box test
#>
#> data:  Residuals from ARIMA(0,1,1)(0,1,1)[12]
#> Q* = 17.046, df = 22, p-value = 0.7575
#>
#> Model df: 2.   Total lags used: 24
```

**Difficulty:** Intermediate

[HINTS]
One diagnostic routine can bundle the residual time plot, autocorrelation plot, and white-noise test together.
Pass the `ex_4_3` model object to `checkresiduals()` from forecast.

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_2 <- checkresiduals(ex_4_3)
ex_5_2
#> p-value = 0.76, no significant residual autocorrelation
```

**Explanation:** `checkresiduals()` is the one-stop diagnostic you should run after every ARIMA fit. The function picks a sensible lag based on the data frequency, applies the right df correction automatically, and plots ACF + histogram so you can visually verify no autocorrelation and approximate normality of residuals. If the p-value is below 0.05 or the histogram is skewed, revisit your model : usually a missing seasonal term or a structural break.

</details>

### Exercise 5.3: Spot misspecification via residual ACF

**Task:** Deliberately fit a too-simple `ARIMA(0,0,0)` (white noise) model to `log(AirPassengers)` and inspect the ACF of its residuals using `ggAcf()`. Save the fitted (bad) model to `ex_5_3`. Compare the residual ACF against your earlier airline model: how many significant lags do you see, and why does the trend cause this pattern?

**Expected result:**

```
#> Series: log(AirPassengers)
#> ARIMA(0,0,0) with non-zero mean
#>
#> Coefficients:
#>         mean
#>       5.5423
#> s.e.  0.0382
#>
#> ggAcf(residuals(ex_5_3)) shows: huge spikes at lag 1, 2, ... 24+, all positive.
#> Confirms model is mis-specified; residuals are not white noise.
```

**Difficulty:** Advanced

[HINTS]
A model that ignores the trend leaves that trend inside the residuals, where it shows up as long-lasting correlation.
Fit `Arima()` on `log(AirPassengers)` with `order = c(0, 0, 0)`, then plot `ggAcf(residuals(ex_5_3))`.

```r title="Your turn"
ex_5_3 <- # your code here
ggAcf(residuals(ex_5_3))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_3 <- Arima(log(AirPassengers), order = c(0, 0, 0))
ggAcf(residuals(ex_5_3))
#> ACF dominated by trend; >24 significant lags
```

**Explanation:** When the model ignores the trend, every residual carries the deterministic upward drift, so successive residuals are highly correlated and the ACF stays above the confidence band for dozens of lags. This is the visual signature of underdifferencing. The fix in this case is to add `d = 1` and a seasonal difference, which is exactly what the airline model does. Recognising this pattern instantly is what separates competent forecasters from novices.

</details>

### Exercise 5.4: Normality check via qqnorm on residuals

**Task:** Plot a normal Q-Q plot of the residuals from the airline model `ex_4_3` using `qqnorm()` and overlay `qqline()`. Save a brief summary list with the residual mean and standard deviation to `ex_5_4`. Comment on whether the residuals look Gaussian, which matters for the validity of the prediction intervals.

**Expected result:**

```
#> $mean
#> [1] -0.000312
#>
#> $sd
#> [1] 0.0367
#>
#> Q-Q plot: points lie close to the diagonal line, mild departures in the tails.
```

**Difficulty:** Intermediate

[HINTS]
Prediction intervals assume the errors are roughly bell-shaped, so a distributional check is warranted.
After `qqnorm()` and `qqline()`, build a `list()` of `mean()` and `sd()` of `residuals(ex_4_3)`.

```r title="Your turn"
qqnorm(residuals(ex_4_3))
qqline(residuals(ex_4_3))
ex_5_4 <- # save summary list
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
qqnorm(residuals(ex_4_3))
qqline(residuals(ex_4_3))
ex_5_4 <- list(mean = mean(residuals(ex_4_3)),
               sd   = sd(residuals(ex_4_3)))
ex_5_4
#> mean ~ 0, sd ~ 0.037
```

**Explanation:** Standard ARIMA prediction intervals assume Gaussian residuals; if the Q-Q plot bends sharply in the tails, the 95 percent intervals reported by `forecast()` will be too narrow. For the airline model on AirPassengers, the residuals are very close to normal with mild heavy tails : acceptable for most business use. If normality is grossly violated, switch to bootstrap intervals via `forecast(..., bootstrap = TRUE)`.

</details>

## Section 6. Forecasting and evaluation (5 problems)

### Exercise 6.1: 24-step forecast from the airline model

**Task:** Produce a 24-step ahead forecast from the `ex_4_3` airline model using `forecast(..., h = 24)`. The output is in log space because you modelled `log(AirPassengers)`. Save the forecast object to `ex_6_1` and inspect the first few point forecasts and 80 percent prediction intervals on the original scale by exponentiating.

**Expected result:**

```
#>          Point Forecast    Lo 80    Hi 80
#> Jan 1961        6.110558 6.063603 6.157513
#> Feb 1961        6.053783 5.994618 6.112949
#> Mar 1961        6.171715 6.103218 6.240212
#> ...
#> 21 more rows hidden
#> exp(point) ~ 450, 425, 478 ... passengers (thousands)
```

**Difficulty:** Intermediate

[HINTS]
A fitted model projects forward a chosen number of periods, returning point estimates plus interval bands.
Call `forecast()` on `ex_4_3` with `h = 24`, then read `$mean` for the point path.

```r title="Your turn"
ex_6_1 <- # your code here
head(ex_6_1$mean)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_1 <- forecast(ex_4_3, h = 24)
head(ex_6_1$mean)
#> Jan 1961: 6.11 (~450 thousand passengers)
```

**Explanation:** `forecast()` returns point forecasts, 80 percent intervals, and 95 percent intervals by default. Because the model was fit on `log()` of the series, forecasts are in log space; exponentiate (`exp(ex_6_1$mean)`) to recover the original passenger units. To preserve correct prediction intervals after back-transformation, pass `lambda = 0` and `biasadj = TRUE` directly when fitting `Arima()` instead of pre-logging : this is the cleaner workflow.

</details>

### Exercise 6.2: Compare 80 and 95 prediction intervals

**Task:** From your forecast object `ex_6_1`, build a data frame with columns `period`, `point`, `lo80`, `hi80`, `lo95`, `hi95` for the first 12 forecast horizons. Save it to `ex_6_2`. The 95 percent interval should be roughly 1.96 / 1.28 = 1.53 times the half-width of the 80 percent interval.

**Expected result:**

```
#> # A tibble: 12 x 6
#>    period      point  lo80  hi80  lo95  hi95
#>    <chr>       <dbl> <dbl> <dbl> <dbl> <dbl>
#> 1  Jan 1961    6.11  6.06  6.16  6.04  6.18
#> 2  Feb 1961    6.05  5.99  6.11  5.96  6.14
#> ...
#> 10 more rows hidden
```

**Difficulty:** Intermediate

[HINTS]
A forecast object stores the point path and its two nested interval bands as separate components.
Assemble a `data.frame()` from `fc$mean` and columns 1 and 2 of `fc$lower` and `fc$upper`, sliced to the first 12 rows.

```r title="Your turn"
ex_6_2 <- # your code here
head(ex_6_2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fc <- ex_6_1
ex_6_2 <- data.frame(
  period = as.character(time(fc$mean))[1:12],
  point  = as.numeric(fc$mean)[1:12],
  lo80   = as.numeric(fc$lower[, 1])[1:12],
  hi80   = as.numeric(fc$upper[, 1])[1:12],
  lo95   = as.numeric(fc$lower[, 2])[1:12],
  hi95   = as.numeric(fc$upper[, 2])[1:12]
)
head(ex_6_2)
#>   period     point  lo80  hi80  lo95  hi95
#> 1 Jan 1961   6.11   6.06  6.16  6.04  6.18
```

**Explanation:** Prediction intervals widen with horizon because the forecast variance accumulates the unit-step variance over time for ARIMA models. The 80 / 95 ratio of 1.28 / 1.96 standard deviations is fixed under Gaussian assumptions, so checking it is a quick sanity test that nothing exotic was applied. In tabular form like this you can paste it straight into a report or compare against actuals when they arrive.

</details>

### Exercise 6.3: Train/test holdout RMSE for the airline model

**Task:** Split `log(AirPassengers)` into a training set of the first 132 months and a test set of the final 12 months using `window()`. Refit the airline `ARIMA(0,1,1)(0,1,1)[12]` on the training set, forecast 12 steps, and compute the RMSE on the held-out test set. Save the numeric RMSE to `ex_6_3` and report it.

**Expected result:**

```
#> [1] 0.0428
```

**Difficulty:** Advanced

[HINTS]
An honest error number comes only from data the model never saw while it was being fitted.
Refit `Arima()` on `train`, call `forecast(fit, h = 12)`, then compute `sqrt(mean((fc$mean - test)^2))`.

```r title="Your turn"
train <- window(log(AirPassengers), end = c(1959, 12))
test  <- window(log(AirPassengers), start = c(1960, 1))
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
train <- window(log(AirPassengers), end = c(1959, 12))
test  <- window(log(AirPassengers), start = c(1960, 1))
fit   <- Arima(train,
               order = c(0, 1, 1),
               seasonal = list(order = c(0, 1, 1), period = 12))
fc    <- forecast(fit, h = 12)
ex_6_3 <- sqrt(mean((as.numeric(fc$mean) - as.numeric(test))^2))
ex_6_3
#> [1] 0.0428  (log-scale RMSE ~ 4.3 percent passenger error)
```

**Explanation:** Holdout RMSE is the single most honest forecast metric: it measures error on data the model never saw during fitting. Computing it on the log scale gives a roughly proportional error (a value of 0.04 means about 4 percent average deviation in passengers). Always exponentiate back when reporting to stakeholders so the number is in the same units as the original series; never present log-scale errors to non-technical readers.

</details>

### Exercise 6.4: ARIMA vs ETS holdout comparison on Nile

**Task:** Hold out the last 20 observations of the `Nile` series. Fit `auto.arima()` and `ets()` on the training portion, forecast 20 steps from each, then call `forecast::accuracy()` to compare RMSE and MAE on the test set. Save the combined accuracy matrix as `ex_6_4` and announce the winner.

**Expected result:**

```
#>                       ME     RMSE      MAE        MPE     MAPE
#> ARIMA test set    -39.40   158.21   123.40   -5.62    14.34
#> ETS test set      -42.18   154.07   125.86   -6.02    14.45
```

**Difficulty:** Advanced

[HINTS]
Two forecasting families can be judged head to head by their error on the same held-out window.
Fit `auto.arima()` and `ets()` on `train`, forecast both, then `rbind()` the `accuracy(fc, test)` rows.

```r title="Your turn"
train <- window(Nile, end = 1950)
test  <- window(Nile, start = 1951)
ex_6_4 <- # fit two models, forecast, rbind accuracy()
ex_6_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
train <- window(Nile, end = 1950)
test  <- window(Nile, start = 1951)

fit_a <- auto.arima(train)
fit_e <- ets(train)

fc_a <- forecast(fit_a, h = length(test))
fc_e <- forecast(fit_e, h = length(test))

ex_6_4 <- rbind(
  ARIMA = accuracy(fc_a, test)["Test set", c("ME","RMSE","MAE","MPE","MAPE")],
  ETS   = accuracy(fc_e, test)["Test set", c("ME","RMSE","MAE","MPE","MAPE")]
)
ex_6_4
#> ETS slightly lower RMSE here; both very close
```

**Explanation:** Comparing ARIMA against ETS on a holdout is the gold-standard benchmark for univariate forecasts. For series like Nile with no obvious seasonality and a single structural break, the two families produce nearly indistinguishable forecasts because both reduce to simple exponential smoothing in disguise. When in doubt, ensemble them (average the two forecasts) : this typically beats either model on its own.

</details>

### Exercise 6.5: Rolling-origin one-step forecast loop on WWWusage

**Task:** Implement a rolling-origin evaluation on the `WWWusage` series. For each end point t in 60:99, fit `Arima(WWWusage[1:t], order = c(3,1,0))`, forecast one step ahead, and store the squared error against the true `WWWusage[t+1]`. Compute the mean across the 40 forecasts and save the resulting MAE plus the vector of squared errors to `ex_6_5`. This is the cleanest backtest pattern for short ARIMA models.

**Expected result:**

```
#> $mae
#> [1] 4.18
#>
#> $errors
#> num [1:40] 2.31 5.12 0.87 8.40 1.99 ...
```

**Difficulty:** Advanced

[HINTS]
Refitting at every fresh observation mimics how a forecast is actually re-issued in production.
Inside the loop, fit `Arima(WWWusage[1:t], order = c(3, 1, 0))`, take `forecast(fit, h = 1)$mean`, and accumulate squared errors.

```r title="Your turn"
errors <- numeric()
for (t in 60:99) {
  fit <- Arima(WWWusage[1:t], order = c(3, 1, 0))
  pred <- as.numeric(forecast(fit, h = 1)$mean)
  errors[t - 59] <- (pred - WWWusage[t + 1])^2
}
ex_6_5 <- list(mae = mean(sqrt(errors)), errors = errors)
ex_6_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
errors <- numeric()
for (t in 60:99) {
  fit  <- Arima(WWWusage[1:t], order = c(3, 1, 0))
  pred <- as.numeric(forecast(fit, h = 1)$mean)
  errors[t - 59] <- (pred - as.numeric(WWWusage)[t + 1])^2
}
ex_6_5 <- list(mae = mean(sqrt(errors)), errors = errors)
ex_6_5
#> mae ~ 4.2 users
```

**Explanation:** Rolling-origin evaluation refits the model at every step, which mimics how forecasts are actually deployed in production: every new observation arrives, the model retrains, and the next forecast is issued. Compare against `tsCV()` in forecast for a vectorised version, but the explicit loop here is more transparent and easier to extend with multi-step horizons or window-limited training. The squared-error vector lets you compute any aggregate metric (MAE, RMSE, MASE).

</details>

## What to do next

- Read the parent tutorial: [Time Series Analysis With R](Time-Series-Analysis-With-R.html) for the conceptual foundation behind every drill here.
- Continue with [Time Series Exercises in R](Time-Series-Exercises-in-R.html) for broader practice covering decomposition, smoothing, and stationarity.
- Compare against [Linear Regression Exercises in R](Linear-Regression-Exercises-in-R.html) to see how dynamic regression bridges ARIMA and OLS.
- For seasonal forecast methods beyond ARIMA, work through the ETS chapters of [Machine Learning Exercises in R](Machine-Learning-Exercises-in-R.html).
