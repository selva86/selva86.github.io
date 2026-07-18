---
title: "ARIMAX in R: ARIMA with External Regressors (xreg)"
slug: "ARIMAX-in-R"
description: "Learn ARIMAX in R: add external regressors to an ARIMA model with the xreg argument, forecast using future predictors, and interpret the coefficients correctly."
keywords: "ARIMAX in R, xreg, external regressors, auto.arima xreg, ARIMA with regressors, regression with ARIMA errors, forecast with xreg, time series forecasting"
auto_link_terms: "ARIMAX|ARIMAX in R|ARIMAX model|ARIMAX models|external regressors|exogenous variables|exogenous regressors|xreg|xreg argument|ARIMA with external regressors|ARIMA with regressors"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-19"
curriculum_id: "FR-arim-1"
post_type: "FR"
fr_parent: "ARIMA-in-R.html"
difficulty: "Intermediate"
---

<p class="lead">ARIMAX extends ARIMA by letting the model use outside predictors, like temperature, price, or a promotion flag, alongside a series' own past. In R you fit one by passing those predictors to the <code>xreg</code> argument of <code>Arima()</code> or <code>auto.arima()</code> from the forecast package.</p>

## Why add external regressors to an ARIMA model?

A plain ARIMA model forecasts a series using only its own past values and its own past errors. That is powerful, but it is also blind to things you already know. An ice-cream shop's sales climb when the weather is hot. Website traffic jumps during a sale. ARIMA cannot see any of that. ARIMAX can, because the X stands for eXternal: you hand the model one or more outside drivers and it uses them. Let's build a small daily-sales series that genuinely follows temperature, then watch `auto.arima()` pin the temperature effect down.

First, we create 120 days of data. Sales are built as a baseline of 40, plus 3 units for every degree of temperature, plus some autocorrelated noise so it behaves like a real series. Because we made the data, we know the true answer in advance: the temperature effect is exactly 3.

```r title="Build a daily sales series driven by temperature"
library(forecast)
library(ggplot2)

set.seed(2024)
n <- 120
temperature <- as.numeric(20 + 8 * sin(2 * pi * (1:n) / 30) + rnorm(n, 0, 1.5))
sales <- 40 + 3 * temperature + as.numeric(arima.sim(model = list(ar = 0.6), n = n, sd = 4))

head(data.frame(day = 1:n, temperature = round(temperature, 1), sales = round(sales, 1)), 6)
#>   day temperature sales
#> 1   1        23.1 107.1
#> 2   2        24.0 117.2
#> 3   3        24.5 113.5
#> 4   4        25.6 112.0
#> 5   5        28.7 125.2
#> 6   6        29.5 129.4
```

Each row is one day with a temperature reading and a sales count. Now the payoff. We hand both series to `auto.arima()` and pass temperature through the `xreg` argument. The one extra touch is `cbind(temperature = temperature)`, which bundles the regressor into a named column so R labels its coefficient clearly.

```r title="Fit an ARIMAX model with auto.arima"
xreg_temp <- cbind(temperature = temperature)
cafe_fit <- auto.arima(sales, xreg = xreg_temp)
cafe_fit
#> Series: sales 
#> Regression with ARIMA(1,0,0) errors 
#> 
#> Coefficients:
#>          ar1  intercept  temperature
#>       0.4997    40.2628       3.0892
#> s.e.  0.0794     2.1007       0.0996
#> 
#> sigma^2 = 14.5:  log likelihood = -329.35
#> AIC=666.7   AICc=667.05   BIC=677.85
```

Read the coefficient row. The `temperature` coefficient is 3.0892, right next to the true effect of 3 that we built in. The `intercept` is 40.26, which recovers the baseline of 40. The `ar1` term of 0.50 is the model handling the leftover autocorrelation in the noise. In one line, ARIMAX separated the part of sales that temperature explains from the part that is pure time-series inertia.

[NOTE]
**This guide assumes you already know the basics of ARIMA.** If terms like AR, differencing, or AICc are new, read [ARIMA in R](ARIMA-in-R.html) first, then come back. Here we focus only on what the `xreg` argument adds.

Notice the label R printed: "Regression with ARIMA(1,0,0) errors," not "ARIMAX." That phrase is the honest description of what R fits, and we will unpack it later. For now, the mental model is simple. A plain ARIMA uses one input, the series itself. ARIMAX adds more input columns.

| Feature | Plain ARIMA | ARIMAX |
|---|---|---|
| Uses the series' own past | Yes | Yes |
| Uses outside predictors | No | Yes, via `xreg` |
| Good when | The series drives itself | A known factor drives the series |
| Needs future inputs to forecast | No | Yes, future `xreg` values |

The diagram below shows the same idea as a picture: the series' own AR, I, and MA structure enters the model, the external regressors enter alongside it, and the combined model produces both forecasts and effect estimates.

![How ARIMAX feeds external regressors in alongside a series' own structure](screenshots/ARIMAX-in-R-how-arimax-extends.webp)
*Figure 1: ARIMAX feeds external regressors in alongside a series' own AR, I, and MA structure.*

[KEY INSIGHT]
**ARIMAX is not a new algorithm, it is ARIMA with extra input columns.** Everything you know about choosing p, d, and q still applies. The `xreg` argument just lets the model borrow information from variables outside the series.

**Try it:** Build your own sales series with a temperature effect you choose, then check that ARIMAX recovers it. Change the multiplier below and read the `ex_temp` coefficient.

```r title="Your turn: recover a known temperature effect"
# Goal: set an effect yourself, then recover it.
# Change the 5 below to any number, run, and read the ex_temp coefficient.
set.seed(11)
ex_temp <- 20 + 8 * sin(2 * pi * (1:100) / 30) + rnorm(100, 0, 1.5)
ex_sales <- 10 + 5 * ex_temp + as.numeric(arima.sim(model = list(ar = 0.5), n = 100, sd = 3))
ex_fit <- auto.arima(ex_sales, xreg = cbind(ex_temp = ex_temp))
round(coef(ex_fit)["ex_temp"], 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Recovering an effect of 5"
set.seed(11)
ex_temp <- 20 + 8 * sin(2 * pi * (1:100) / 30) + rnorm(100, 0, 1.5)
ex_sales <- 10 + 5 * ex_temp + as.numeric(arima.sim(model = list(ar = 0.5), n = 100, sd = 3))
ex_fit <- auto.arima(ex_sales, xreg = cbind(ex_temp = ex_temp))
round(coef(ex_fit)["ex_temp"], 3)
#> ex_temp 
#>   4.978 
```

**Explanation:** We built sales with an effect of 5 per degree, and ARIMAX estimated 4.978, off by a hair because of random noise in the sample. Try other multipliers and the coefficient will track them.

</details>

## How do you fit an ARIMAX model with xreg?

The `xreg` argument takes a numeric matrix or vector of predictors that lines up with your series row for row. Row 1 of `xreg` is the value of the regressor at the same time as the first observation of your series (`y`), and so on. That alignment is the only rule you must respect. When you pass a single predictor, wrapping it in `cbind(name = predictor)` gives the coefficient a readable name instead of the generic label `xreg`.

`auto.arima()` chose the ARIMA orders for us above. You can also fit a specific order by hand with `Arima()`, which is useful when you want control. Let's fit the same `(1, 0, 0)` structure manually and confirm we get the identical model.

```r title="Fit the same ARIMAX model by hand with Arima"
cafe_manual <- Arima(sales, order = c(1, 0, 0), xreg = xreg_temp)
cafe_manual
#> Series: sales 
#> Regression with ARIMA(1,0,0) errors 
#> 
#> Coefficients:
#>          ar1  intercept  temperature
#>       0.4997    40.2628       3.0892
#> s.e.  0.0794     2.1007       0.0996
#> 
#> sigma^2 = 14.5:  log likelihood = -329.35
#> AIC=666.7   AICc=667.05   BIC=677.85
```

The output is identical to the automatic fit, which confirms that `auto.arima()` picked `(1, 0, 0)` for the error structure. The `order = c(1, 0, 0)` argument is the familiar `c(p, d, q)`: one AR term, no differencing, no MA term. The `xreg` sits on top of that, unchanged.

To pull just the temperature effect out of a fitted model, index the coefficient by its name. This is how you would grab the number for a report.

```r title="Extract the temperature coefficient"
round(coef(cafe_fit)["temperature"], 3)
#> temperature 
#>       3.089 
```

That single number, 3.089, is the practical takeaway of the whole fit: each extra degree of temperature is associated with about 3.09 more sales, after the model has accounted for the day-to-day inertia in the series.

[WARNING]
**Your xreg rows must line up with y and contain no gaps.** If `xreg` has a different length than `y`, or has `NA` values, the fit will fail or mislead. Line the predictor up with the series by date, and fill or drop missing values before fitting.

**Try it:** Fit the model with two AR terms instead of one by changing the order to `c(2, 0, 0)`, then read the temperature coefficient. Does the effect estimate move much?

```r title="Your turn: fit with a different AR order"
# Change c(1, 0, 0) to c(2, 0, 0), run, and read the coefficient.
ex_manual <- Arima(sales, order = c(1, 0, 0), xreg = xreg_temp)
round(coef(ex_manual)["temperature"], 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Temperature effect under ARIMA(2,0,0) errors"
ex_manual <- Arima(sales, order = c(2, 0, 0), xreg = xreg_temp)
round(coef(ex_manual)["temperature"], 3)
#> temperature 
#>       3.081 
```

**Explanation:** With a second AR term the temperature effect is 3.081, barely different from the 3.089 we saw before. A good regression effect is stable across sensible choices of the error structure, which is a reassuring sign here.

</details>

## How do you forecast with an ARIMAX model?

Here is the single most important difference between ARIMA and ARIMAX, and the mistake that trips up almost everyone the first time. To forecast ahead, an ARIMAX model needs the FUTURE values of its regressors. It cannot invent them. A plain ARIMA can project itself forward from its own past, but ARIMAX has to be told what temperature will be on each future day before it can forecast sales.

So forecasting is a two-part job: supply the future regressor values, then call `forecast()`. You pass those future values through the same `xreg` argument. There is no need to set `h` (the number of periods): the horizon is simply the number of rows in the future `xreg`. Let's forecast the next 14 days by giving the model 14 future temperatures.

```r title="Forecast ahead by supplying future temperatures"
set.seed(77)
future_temp <- 20 + 8 * sin(2 * pi * ((n + 1):(n + 14)) / 30) + rnorm(14, 0, 1.5)
cafe_fc <- forecast(cafe_fit, xreg = cbind(temperature = future_temp))
cafe_fc
#>     Point Forecast    Lo 80    Hi 80     Lo 95    Hi 95
#> 121       106.9403 102.0602 111.8205  99.47676 114.4039
#> 122       118.3052 112.8495 123.7608 109.96150 126.6488
#> 123       120.1130 114.5228 125.7031 111.56361 128.6623
#> 124       125.5314 119.9082 131.1546 116.93143 134.1313
#> 125       124.3798 118.7483 130.0112 115.76723 132.9923
#> 126       130.8954 125.2619 136.5288 122.27968 139.5110
#> 127       122.1639 116.5299 127.7979 113.54746 130.7804
#> 128       126.0325 120.3984 131.6666 117.41584 134.6491
#> 129       126.2378 120.6036 131.8719 117.62109 134.8545
#> 130       130.1330 124.4988 135.7671 121.51626 138.7497
#> 131       106.7854 101.1512 112.4195  98.16865 115.4021
#> 132       115.4493 109.8151 121.0835 106.83260 124.0660
#> 133       111.4482 105.8140 117.0824 102.83148 120.0649
#> 134       107.0343 101.4002 112.6685  98.41763 115.6511
```

Each row is one future day. The Point Forecast is the single best guess, and the four interval columns give ranges: the model is 80 percent sure the value lands between Lo 80 and Hi 80, and 95 percent sure between Lo 95 and Hi 95. Look down the point forecasts and you can see them rise and fall, from 106 up to 130 and back down. That wave is the temperature regressor at work: on warmer forecast days the model predicts more sales, exactly as the temperature coefficient says it should.

A picture makes the pattern obvious. The `autoplot()` function draws the history and the forecast together, with the shaded fan showing the widening uncertainty.

```r title="Plot the ARIMAX forecast"
autoplot(cafe_fc) + ggtitle("Sales forecast driven by future temperature")
```

[WARNING]
**An ARIMAX forecast is only as good as its future regressors.** If you feed in wrong future temperatures, the forecast will be wrong no matter how well the model fits. When the future values are known (calendar effects, scheduled promotions), you are safe. When they are not, you must forecast the regressor too, and that extra uncertainty flows into your final forecast.

**Try it:** Forecast just 5 days ahead by building 5 future temperatures. Read the first point forecast.

```r title="Your turn: forecast five days ahead"
# Build 5 future temperatures, then forecast with them.
set.seed(5)
ex_future <- cbind(temperature = 20 + 8 * sin(2 * pi * ((n + 1):(n + 5)) / 30) + rnorm(5, 0, 1.5))
forecast(cafe_fit, xreg = ex_future)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Five-day ARIMAX forecast"
set.seed(5)
ex_future <- cbind(temperature = 20 + 8 * sin(2 * pi * ((n + 1):(n + 5)) / 30) + rnorm(5, 0, 1.5))
forecast(cafe_fit, xreg = ex_future)
#>     Point Forecast    Lo 80    Hi 80     Lo 95    Hi 95
#> 121       105.5909 100.7107 110.4711  98.12731 113.0545
#> 122       119.6643 114.2087 125.1199 111.32062 128.0080
#> 123       111.3306 105.7405 116.9207 102.78127 119.8800
#> 124       121.0253 115.4021 126.6485 112.42535 129.6252
#> 125       131.5239 125.8925 137.1553 122.91136 140.1364
```

**Explanation:** The horizon is 5 because the `xreg` has 5 rows. The first day's point forecast is about 105.6, and every value reflects the specific future temperature we supplied for that day.

</details>

## Does the external regressor actually improve the forecast?

Adding a regressor is only worth it if the regressor genuinely helps. The clean way to check is to fit a plain ARIMA on the same series and compare it to the ARIMAX by AICc, the small-sample information criterion where lower is better. Let's fit the plain model first.

```r title="Fit a plain ARIMA for comparison"
cafe_plain <- auto.arima(sales)
cafe_plain
#> Series: sales 
#> ARIMA(1,0,0) with non-zero mean 
#> 
#> Coefficients:
#>          ar1      mean
#>       0.8816  102.5852
#> s.e.  0.0408    6.2959
#> 
#> sigma^2 = 76.05:  log likelihood = -429.9
#> AIC=865.79   AICc=866   BIC=874.16
```

Notice the plain model's `ar1` is 0.88, much higher than the 0.50 the ARIMAX used. That is telling: without temperature to explain the swings in sales, the AR term has to absorb the temperature-driven movement itself, treating it as if it were inertia. The `sigma^2` (the residual variance) is 76.05 here versus 14.5 for the ARIMAX, so the plain model leaves far more unexplained. Now compare the two by AICc.

```r title="Compare the two models by AICc"
c(ARIMA = cafe_plain$aicc, ARIMAX = cafe_fit$aicc)
#>    ARIMA   ARIMAX 
#> 866.0010 667.0485 
```

The ARIMAX AICc of 667 is far below the plain ARIMA's 866. A gap that large is decisive: temperature carries real, useful information about sales, so the model that uses it wins easily. This will not always happen. Some candidate regressors add nothing, and then the plain model scores as well or better. That is exactly why you compare instead of assuming.

[TIP]
**Always earn your regressors with a comparison.** Fit the model with and without the predictor and check AICc (or out-of-sample accuracy). Adding variables that do not help makes forecasts worse, not better, because the model spends effort estimating noise.

**Try it:** Compute how many AICc points ARIMAX saves over the plain model. Subtract the two values.

```r title="Your turn: measure the AICc improvement"
# Subtract the ARIMAX AICc from the plain ARIMA AICc.
round(cafe_plain$aicc - cafe_fit$aicc, 2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="The AICc gap"
round(cafe_plain$aicc - cafe_fit$aicc, 2)
#> [1] 198.95
```

**Explanation:** ARIMAX is 198.95 AICc points better. As a rule of thumb, a difference of more than about 10 is strong evidence for the better model, so this is a landslide in favor of using temperature.

</details>

## What is R actually fitting when you add xreg?

You may have noticed R never printed the word "ARIMAX." It printed "Regression with ARIMA errors." That wording is not an accident, and understanding it is what separates people who use `xreg` correctly from people who get confused by it. This short section is the theory; if you only want to use the tool, the practical code above is all you need.

What R fits is a regression, plus a twist. It models your series as a straight-line effect of the regressors, and lets the leftover error follow an ARIMA process instead of being plain independent noise.

$$y_t = \beta_0 + \beta_1 x_t + n_t$$

Where:
- $y_t$ = the observed value at time $t$ (sales today)
- $\beta_0$ = the intercept, the baseline level
- $\beta_1$ = the effect of the regressor, which is the `xreg` coefficient
- $x_t$ = the external regressor at time $t$ (temperature today)
- $n_t$ = the error term, which itself follows an ARIMA model rather than being pure noise

That last line is the whole point. In an ordinary regression, the errors are assumed to be independent. In time-series data they almost never are: a busy day tends to be followed by another busy day. The ARIMA part of the model exists to soak up that autocorrelation in the errors, so the regression coefficient can be estimated honestly.

To see why this matters, fit a plain regression of sales on temperature and look at its residuals. If the errors were independent, their autocorrelation would be near zero at every lag.

```r title="Check whether plain regression residuals are autocorrelated"
lm_fit <- lm(sales ~ temperature)
round(Acf(residuals(lm_fit), plot = FALSE)$acf[1:4], 3)
#> [1] 1.000 0.494 0.168 0.045
```

The first value is always 1 (the correlation of the residuals with themselves at lag 0), so ignore it. The next value, 0.494, is the lag-1 autocorrelation, and it is large. Today's regression error is strongly related to yesterday's. That is precisely the structure the ARIMAX picked up as an AR(1) term of 0.50 in the first section. The two numbers, 0.494 from the residuals and 0.50 from the model, are the same fact seen from two angles.

[KEY INSIGHT]
**The xreg coefficient is a plain regression slope, and the ARIMA part fixes the standard errors.** A naive regression on time-series data reports standard errors that are too small, because it wrongly assumes independent errors and overcounts the information in autocorrelated data. Modeling the errors as ARIMA gives you the same interpretable slope with trustworthy uncertainty around it.

The diagram below sums up the decomposition: the regressors produce a regression effect, the leftover errors are modeled as ARIMA, and the two combine to explain the series.

![What R fits: a regression on the regressors plus ARIMA-modeled errors](screenshots/ARIMAX-in-R-regression-arima-errors.webp)
*Figure 2: What R fits is a regression on the regressors plus ARIMA-modeled errors.*

[NOTE]
**The name "ARIMAX" is used loosely across textbooks and blogs.** Some authors mean this regression-with-ARIMA-errors setup, which is what `Arima()` and `auto.arima()` fit, and others mean a different formulation where lagged regressors enter the ARIMA equation directly. This tutorial uses the version R implements, where each coefficient is a clean, contemporaneous effect you can read off and explain.

**Try it:** Read the lag-1 and lag-2 autocorrelations of the regression residuals and connect them to the model's memory.

```r title="Your turn: read the residual autocorrelation"
# Report the lag-1 and lag-2 autocorrelations (positions 2 and 3).
round(Acf(residuals(lm_fit), plot = FALSE)$acf[2:3], 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Lag-1 and lag-2 residual autocorrelation"
round(Acf(residuals(lm_fit), plot = FALSE)$acf[2:3], 3)
#> [1] 0.494 0.168
```

**Explanation:** The lag-1 value 0.494 is the strong one, and it fades to 0.168 at lag 2. That decaying pattern is the fingerprint of AR(1) errors, which is exactly the error structure the ARIMAX chose.

</details>

## Complete Example: Measuring the UK seat belt law

Let's put it together on a famous real dataset and, along the way, meet the second big use of ARIMAX. So far we have used it to forecast. It is just as valuable for measuring the effect of a driver while accounting for the time-series structure around it.

The built-in `Seatbelts` data records monthly UK road casualties from 1969 to 1984. Britain made front seat belts compulsory on 31 January 1983, and the dataset carries a `law` column that is 0 before the law and 1 after. We will model the number of drivers killed or seriously injured, using three external regressors: petrol price, distance driven, and the law flag. The `law` flag is the interesting one: a plain ARIMA could never use it, because it is information from outside the series.

```r title="Load the Seatbelts data and its regressors"
data(Seatbelts)
drivers <- Seatbelts[, "drivers"]
regressors <- cbind(
  PetrolPrice = Seatbelts[, "PetrolPrice"],
  kms         = Seatbelts[, "kms"] / 1000,
  law         = Seatbelts[, "law"]
)
head(regressors, 4)
#>          PetrolPrice    kms law
#> Jan 1969   0.1029718  9.059   0
#> Feb 1969   0.1023630  7.685   0
#> Mar 1969   0.1020625  9.963   0
#> Apr 1969   0.1008733 10.955   0
```

The `law` column is 0 in these early rows, as expected. We divide `kms` by 1000 only to keep its coefficient on a readable scale. Now fit a plain seasonal ARIMA and an ARIMAX with the three regressors, and compare them by AICc.

```r title="Fit plain ARIMA and ARIMAX on the seat belt data"
sb_plain  <- auto.arima(drivers)
sb_arimax <- auto.arima(drivers, xreg = regressors)
c(ARIMA = sb_plain$aicc, ARIMAX = sb_arimax$aicc)
#>    ARIMA   ARIMAX 
#> 2299.007 2284.579 
```

The ARIMAX is better by about 14 AICc points, so the regressors are pulling their weight. Let's look at the full ARIMAX to read the effects.

```r title="Read the ARIMAX coefficients"
sb_arimax
#> Series: drivers 
#> Regression with ARIMA(1,0,3)(0,1,1)[12] errors 
#> 
#> Coefficients:
#>          ar1      ma1     ma2      ma3     sma1    drift  PetrolPrice      kms
#>       0.9707  -0.6711  0.0075  -0.1754  -0.8873  -1.6751    -4856.583  28.5856
#> s.e.  0.0321   0.0788  0.0977   0.0842   0.0896   1.2933     1603.790  17.4566
#>             law
#>       -279.8613
#> s.e.    74.2319
#> 
#> sigma^2 = 16156:  log likelihood = -1131.64
#> AIC=2283.28   AICc=2284.58   BIC=2315.21
```

The seasonal ARIMA orders on the left handle the strong monthly pattern in road casualties, and you can mostly leave them to `auto.arima()`. The three regressors on the right are what we came for. Focus on `law`: its coefficient is -279.86, with a standard error of 74.23. Because the coefficient is about 3.8 times its standard error, it is clearly different from zero.

```r title="The estimated effect of the seat belt law"
round(coef(sb_arimax)["law"], 1)
#> law 
#> -279.9 
```

The reading is direct and striking: after accounting for seasonality, petrol price, and how far people drove, the seat belt law is associated with about 280 fewer drivers killed or seriously injured per month. That is the kind of question ARIMAX answers that plain ARIMA cannot even ask. Before trusting any model, though, check its residuals with `checkresiduals()`, which runs a Ljung-Box test for leftover structure.

```r title="Check the residuals of the seat belt model"
checkresiduals(sb_arimax)
#> 	Ljung-Box test
#> 
#> data:  Residuals from Regression with ARIMA(1,0,3)(0,1,1)[12] errors
#> Q* = 31.3, df = 19, p-value = 0.03741
#> 
#> Model df: 5.   Total lags used: 24
```

[WARNING]
**Real data is rarely perfectly clean, and this model shows it.** The Ljung-Box p-value of 0.037 sits just below 0.05, hinting at a little leftover structure the model did not capture. The law effect is large and stable enough to trust for explanation, but you would refine the model further before betting high-stakes forecasts on it. This honest wrinkle is normal, and it is exactly why you run the diagnostic.

## Frequently Asked Questions

**What is the difference between ARIMA and ARIMAX?** ARIMA forecasts a series using only its own past values and errors. ARIMAX adds one or more external predictors through the `xreg` argument, so the model can also use known drivers like price, weather, or a policy change.

**Do I need future values of the regressors to forecast?** Yes. This is the key catch. To forecast `h` steps ahead, you must supply the regressors' values for those future periods via `xreg` in `forecast()`. If you do not know them, you either use known scheduled values (like holidays) or forecast the regressors separately first.

**Is ARIMAX the same as regression with ARIMA errors?** In R's forecast package, yes: `Arima()` and `auto.arima()` with `xreg` fit a regression with ARIMA errors, which R prints by that exact name. The term ARIMAX is used loosely elsewhere and sometimes means a slightly different model, so it helps to know which one you are running.

**Can I use a 0/1 dummy variable as a regressor?** Absolutely. The seat belt `law` flag above is a 0/1 dummy, and its coefficient measures the average shift in the series once the flag switches on. Dummies are how you model interventions, promotions, and policy changes.

**How many regressors can I use?** As many as the data supports, passed as columns of the `xreg` matrix with `cbind()`. Just remember every regressor you include for forecasting needs its own future values, and adding predictors that do not help will hurt the model, so compare by AICc.

## Practice Exercises

These combine several ideas from the tutorial. Each starter block runs as-is, so write your solution and then reveal ours to compare. The exercises use their own variable names so they will not clash with the code above.

### Exercise 1: Recover a known effect from scratch

Build a series `my_y` that follows a regressor `my_x` with a true effect of 2.5, plus autocorrelated noise, then fit an ARIMAX and check that it recovers the 2.5. Use `set.seed(303)`.

```r title="Your turn: simulate and recover an effect"
# Build my_x, then my_y = 100 + 2.5 * my_x + AR(1) noise, fit ARIMAX, read the coefficient.
# Hint: arima.sim(model = list(ar = 0.7), n = 150, sd = 3) makes the noise.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Simulate and recover the effect of 2.5"
set.seed(303)
my_x <- 20 + 5 * sin(2 * pi * (1:150) / 24) + rnorm(150, 0, 2)
my_y <- 100 + 2.5 * my_x + as.numeric(arima.sim(model = list(ar = 0.7), n = 150, sd = 3))
my_fit <- auto.arima(my_y, xreg = cbind(my_x = my_x))
round(coef(my_fit)["my_x"], 3)
#>  my_x 
#> 2.513 
```

**Explanation:** ARIMAX estimated the effect at 2.513, right on top of the true 2.5. It also recovered the baseline near 100 and an AR(1) term near 0.70, matching every value we built into the data.

</details>

### Exercise 2: Compare a driver's effect across two series

Using the `Seatbelts` data, fit an ARIMAX to `front` (front-seat passengers killed or seriously injured) with the same three regressors, compare it to a plain ARIMA by AICc, and read the `law` coefficient. Is the drop bigger or smaller than the 280 we found for drivers?

```r title="Your turn: the law effect on front-seat casualties"
# Fit ARIMAX to Seatbelts[, "front"] with PetrolPrice, kms/1000, and law.
# Compare AICc to a plain auto.arima(front), then read the law coefficient.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="ARIMAX for front-seat casualties"
front <- Seatbelts[, "front"]
front_reg <- cbind(
  PetrolPrice = Seatbelts[, "PetrolPrice"],
  kms         = Seatbelts[, "kms"] / 1000,
  law         = Seatbelts[, "law"]
)
front_arimax <- auto.arima(front, xreg = front_reg)
c(ARIMA = auto.arima(front)$aicc, ARIMAX = front_arimax$aicc)
#>    ARIMA   ARIMAX 
#> 2146.898 2106.101 
```

```r title="The law effect on front-seat casualties"
round(coef(front_arimax)["law"], 1)
#> law 
#> -201.7 
```

**Explanation:** ARIMAX beats plain ARIMA by about 41 AICc points here, and the law is associated with roughly 202 fewer front-seat casualties per month. It is a large effect, as you would expect, since front-seat passengers were the ones the belt law directly targeted.

</details>

### Exercise 3: Forecast two temperature scenarios

Using the `cafe_fit` model from the tutorial, forecast the next 7 days under two scenarios: a heatwave where every day is 32 degrees, and a cold snap where every day is 12 degrees. Compare the first day's point forecast under each. This shows how the future regressor drives the forecast.

```r title="Your turn: forecast a heatwave versus a cold snap"
# Build two 7-row xreg matrices (all 32, and all 12), forecast each, compare the first point forecast.
# Hint: forecast(cafe_fit, xreg = cbind(temperature = rep(32, 7)))$mean[1]

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Heatwave versus cold snap first-day forecast"
heatwave <- cbind(temperature = rep(32, 7))
coldsnap <- cbind(temperature = rep(12, 7))
round(c(heatwave = as.numeric(forecast(cafe_fit, xreg = heatwave)$mean[1]),
        coldsnap = as.numeric(forecast(cafe_fit, xreg = coldsnap)$mean[1])), 1)
#> heatwave coldsnap 
#>    141.4     79.6 
```

**Explanation:** The heatwave forecast is 141.4 and the cold snap is 79.6, a gap of about 62 sales. That gap is the temperature effect of roughly 3 per degree times the 20-degree difference between the scenarios, which is ARIMAX doing exactly what we taught it.

</details>

## Summary

ARIMAX is ARIMA with extra input columns. You add known drivers through the `xreg` argument, and the model separates what the drivers explain from the series' own inertia. The workflow is short and always the same.

| Task | How | Key point |
|---|---|---|
| Add a regressor | `xreg = cbind(name = x)` | One column per driver, aligned to `y` |
| Fit | `auto.arima(y, xreg = X)` or `Arima(y, order, xreg = X)` | `auto.arima()` picks the error structure |
| Forecast | `forecast(fit, xreg = future_X)` | You must supply future regressor values |
| Compare | `c(plain$aicc, arimax$aicc)` | Only keep regressors that lower AICc |
| Interpret | `coef(fit)["name"]` | The coefficient is a contemporaneous effect |

Keep these takeaways close:

- **The X in ARIMAX means external, and it is just one more input column.** Everything you know about p, d, and q still applies.
- **You must supply future regressor values to forecast.** Unlike plain ARIMA, the model cannot project its own inputs.
- **Earn every regressor with a comparison.** Check AICc with and without it, because useless predictors make forecasts worse.
- **What R fits is regression with ARIMA errors.** The `xreg` coefficient is a clean regression slope, and the ARIMA part gives it trustworthy standard errors.
- **ARIMAX has two jobs.** It sharpens forecasts when you know the drivers, and it measures a driver's effect (like the seat belt law) net of everything else.

## References

1. Hyndman, R.J., & Athanasopoulos, G. - *Forecasting: Principles and Practice*, 3rd edition. Chapter 10: Dynamic regression models. [Link](https://otexts.com/fpp3/dynamic.html)
2. Hyndman, R.J., & Athanasopoulos, G. - *Forecasting: Principles and Practice*, 2nd edition. Section 9.2: Regression with ARIMA errors in R. [Link](https://otexts.com/fpp2/regarima.html)
3. Hyndman, R.J., & Khandakar, Y. - "Automatic Time Series Forecasting: The forecast Package for R." *Journal of Statistical Software*, 27(3), 2008. [Link](https://www.jstatsoft.org/article/view/v027i03)
4. forecast package - `Arima()` reference. [Link](https://pkg.robjhyndman.com/forecast/reference/Arima.html)
5. forecast package - `auto.arima()` reference. [Link](https://pkg.robjhyndman.com/forecast/reference/auto.arima.html)
6. Nau, R. (Duke University) - Introduction to ARIMA models with regressors. [Link](https://people.duke.edu/~rnau/arimreg.htm)
7. R Core Team - `Seatbelts` dataset, Road Casualties in Great Britain 1969-84. [Link](https://stat.ethz.ch/R-manual/R-devel/library/datasets/html/UKDriverDeaths.html)

## Continue Learning

- [ARIMA in R](ARIMA-in-R.html) - the foundation this guide builds on, covering what AR, I, and MA mean and how to fit and forecast one.
- [ARIMA Diagnostics in R](ARIMA-Diagnostics-in-R.html) - go deeper on residual checks and the Ljung-Box test you used to validate the seat belt model.
- [SARIMA in R](SARIMA-in-R.html) - the seasonal extension that handled the monthly pattern in the road-casualty data.
- [ACF and PACF in R](ACF-and-PACF-in-R.html) - the autocorrelation plots behind the residual checks in this tutorial.
