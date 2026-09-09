---
title: "ARIMAX: add outside variables to your ARIMA forecast"
slug: "ARIMA-Mini-6"
description: "ARIMAX adds outside variables like temperature or price to an ARIMA model through xreg, judges them with AICc, and forecasts using their future values."
keywords: "ARIMAX, xreg, external regressors, ARIMA forecasting in R, auto.arima, regression with ARIMA errors, AICc, R time series"
mathjax: true
webr: true
date: "2026-09-09"
post_type: "LESSON"
course_id: "arima-from-zero"
course_title: "ARIMA from Zero"
course_lesson: "6"
course_total: "7"
course_landing: "/dashboard.html"
course_prev: "ARIMA-Mini-5"
course_next: "ARIMA-Mini-7"
curriculum_id: "0.0.25"
lesson_access: "windowed"
catalog_blurb: "Add outside variables like temperature or price to sharpen an ARIMA forecast."
---

=== step === cover
## add outside variables to your ARIMA forecast

Today let's understand ARIMAX, using one small shop and its daily sales.

Picture an ice-cream shop that has logged its sales for 120 straight days, and alongside every day's sales, that day's temperature. Nothing fancy: one number for how much ice cream sold, one number for how hot it was.

The chart below plots all 120 days, temperature on one axis and sales on the other. Look at how closely the two move together.

::widget chart-plotter {"data":[{"x":23.1,"y":107.1},{"x":24,"y":117.2},{"x":24.5,"y":113.5},{"x":25.6,"y":112},{"x":28.7,"y":125.2},{"x":29.5,"y":129.4},{"x":28.8,"y":125.6},{"x":27.8,"y":125.1},{"x":25.8,"y":113.4},{"x":25.2,"y":110.2},{"x":23.4,"y":114},{"x":25.4,"y":121.9},{"x":24.5,"y":119.8},{"x":22.1,"y":117},{"x":15.1,"y":92.3},{"x":18.1,"y":102},{"x":15.4,"y":94.9},{"x":16,"y":88.7},{"x":11.6,"y":75.2},{"x":10.1,"y":79.9},{"x":14.1,"y":93.1},{"x":12.5,"y":81},{"x":13.6,"y":71.1},{"x":12.1,"y":71.7},{"x":13.7,"y":77.1},{"x":11.7,"y":70},{"x":15.1,"y":83.4},{"x":17.8,"y":99.1},{"x":15.3,"y":89.2},{"x":19.8,"y":101.6},{"x":19.5,"y":106},{"x":22.8,"y":111.3},{"x":23.9,"y":111.1},{"x":27.8,"y":123.4},{"x":26.2,"y":111.7},{"x":28.2,"y":125.4},{"x":28.5,"y":134.6},{"x":27.2,"y":125.7},{"x":26.8,"y":126.4},{"x":27.6,"y":124.4},{"x":24.6,"y":115.8},{"x":24.7,"y":116.8},{"x":24,"y":118.2},{"x":24.6,"y":122.6},{"x":18.2,"y":100.5},{"x":18.5,"y":102},{"x":17.2,"y":94},{"x":16.3,"y":93.1},{"x":15,"y":88.6},{"x":16,"y":92.7},{"x":11.6,"y":74.9},{"x":10.9,"y":71.3},{"x":11.1,"y":75.4},{"x":10.9,"y":77.8},{"x":12.1,"y":77.9},{"x":11.9,"y":74.1},{"x":16.6,"y":90.9},{"x":16.4,"y":87.4},{"x":19.8,"y":94.3},{"x":20,"y":98.9},{"x":24.1,"y":115.9},{"x":24.5,"y":121},{"x":25.5,"y":123.3},{"x":26.2,"y":127.7},{"x":29.4,"y":135.6},{"x":27.4,"y":135.9},{"x":25,"y":115.8},{"x":29,"y":127.7},{"x":28.3,"y":127.3},{"x":23.7,"y":109.5},{"x":27.6,"y":122.7},{"x":22.9,"y":112.6},{"x":23.7,"y":109.4},{"x":21.8,"y":101.3},{"x":20.3,"y":99.1},{"x":17.9,"y":96},{"x":18.9,"y":99.8},{"x":16.3,"y":88.1},{"x":12.5,"y":79.2},{"x":13.1,"y":78.1},{"x":10.5,"y":59.9},{"x":13.5,"y":76.1},{"x":13.3,"y":78.9},{"x":9.8,"y":71.4},{"x":13.3,"y":83.3},{"x":15.7,"y":86.8},{"x":15,"y":89.2},{"x":16.4,"y":88.9},{"x":18,"y":99.8},{"x":21.2,"y":107.7},{"x":19.8,"y":101.6},{"x":22.5,"y":108.8},{"x":23.6,"y":112.7},{"x":27,"y":121.7},{"x":27.7,"y":125.5},{"x":24.5,"y":113.9},{"x":26.2,"y":121.3},{"x":26.2,"y":125.6},{"x":27.6,"y":129.6},{"x":28.7,"y":129.2},{"x":29.3,"y":128.2},{"x":25.4,"y":116.2},{"x":24.8,"y":114.9},{"x":21.9,"y":105.6},{"x":18.1,"y":92.2},{"x":18.9,"y":95.8},{"x":16.4,"y":85.1},{"x":17,"y":89.4},{"x":13.2,"y":83},{"x":11.4,"y":81.6},{"x":10.5,"y":80.4},{"x":13.7,"y":83},{"x":11,"y":81.6},{"x":12.3,"y":80},{"x":12.1,"y":79.2},{"x":11.3,"y":71.1},{"x":18.2,"y":93.4},{"x":17.5,"y":98.9},{"x":17.9,"y":98.3},{"x":21.4,"y":110.9}],"x":"temperature","y":"sales","geoms":["point"]}

That correlation is not a coincidence. The shop's sales genuinely depend on the weather, and a plain ARIMA model, which only ever looks at a series' own past, has no way to use that fact. ARIMAX is what lets it.

=== step === concept
## What ARIMAX adds to a plain ARIMA model

A plain ARIMA model forecasts a series by looking only at that series' own past values and its own past errors. It never sees anything from outside the series itself.

ARIMAX changes that. The X stands for eXternal: you hand the model one or more outside variables, called external regressors, and it uses them alongside the series' own history. In R, you pass an external regressor through the `xreg` argument of `Arima()` or `auto.arima()`, both from the forecast package.

`xreg` takes a numeric matrix or vector with one row for every point in your series, lined up in the same order. When you have just one regressor, wrapping it as `cbind(name = predictor)` does something small but useful: it gives that column a name, so the fitted model reports a coefficient called `temperature` instead of a generic label.

Let's build a version of the shop's data where we already know the true answer. We'll set sales to a baseline of 40, add exactly 3 units of sales for every degree of temperature, and then add some noise that is itself autocorrelated from one day to the next, since real daily sales rarely bounce around independently.

```r
# Build 120 days of ice-cream sales driven by temperature, with a known effect
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

Because we built this data ourselves, we know the true temperature effect is exactly 3 sales per degree, and the true baseline is 40. That gives us something to check our model against in a moment.

The diagram below shows the same idea as a flow. The series carries its own AR, I, and MA structure from its past, the external regressor carries information from outside, and the two combine into one fit that produces both a forecast and an effect estimate.

::widget process-flow {"steps":[{"title":"Its own past","sub":"AR, I and MA structure, built only from past sales"},{"title":"The outside variable","sub":"temperature, entered through the xreg argument"},{"title":"One combined fit","sub":"produces both the forecast and the size of the temperature effect"}]}

=== step === concept
## Fitting an ARIMAX model and reading its coefficients

Fitting an ARIMAX model takes one extra argument on top of what you already know from `auto.arima()`. Package the regressor with `cbind()`, then pass it as `xreg`.

```r
# Fit ARIMAX: auto.arima() with an external regressor
xreg_temp <- cbind(temperature = temperature)
icecream_fit <- auto.arima(sales, xreg = xreg_temp)
icecream_fit
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

Notice the label: "Regression with ARIMA(1,0,0) errors," not "ARIMAX." That is the honest name for what R fits. For now, read the coefficients. `temperature` came out at 3.0892, right next to the true 3 we built in. `intercept` came out at 40.2628, right next to the true baseline of 40. `ar1`, at 0.4997, is the one autoregressive term `auto.arima()` chose to absorb whatever day-to-day carryover is left in the noise; `(1,0,0)` means one AR term, no differencing, and no MA term.

You can fit that same structure by hand with `Arima()` instead of letting `auto.arima()` search for it, which is useful once you know which order you want.

```r
# Fit the same structure by hand with Arima()
icecream_manual <- Arima(sales, order = c(1, 0, 0), xreg = xreg_temp)
icecream_manual
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

The output is identical, which confirms `auto.arima()` picked `(1, 0, 0)` on its own. To pull a single coefficient out of a fitted model, such as when writing up a result, index it by name.

```r
# Pull just the temperature coefficient out of the fitted model
round(coef(icecream_fit)["temperature"], 3)
#> temperature 
#>       3.089 
```

That one number, 3.089, is the point estimate of the temperature effect: every extra degree of temperature is worth about 3.09 more sales, once the model has accounted for the day-to-day carryover in the series.

=== step === widget
## What is R actually fitting when you add xreg?

R never printed the word "ARIMAX." It printed "Regression with ARIMA errors," and that phrasing is exactly what happens under the hood: a regression on the outside variable, with the leftover error allowed to follow an ARIMA process instead of being treated as plain independent noise.

To see why that leftover-error part matters, fit an ordinary regression of sales on temperature and check whether its residuals are related to each other from one day to the next.

```r
# Check whether an ordinary regression's residuals are autocorrelated
lm_fit <- lm(sales ~ temperature)
round(Acf(residuals(lm_fit), plot = FALSE)$acf[1:4], 3)
#> [1] 1.000 0.494 0.168 0.045
```

Ignore the first value; a residual always correlates perfectly with itself at lag 0. The second value, 0.494, is the lag-1 autocorrelation, and it is large: today's leftover regression error is strongly related to yesterday's. That is precisely the pattern the ARIMAX fit picked up as an AR(1) term of 0.50. Those two numbers, 0.494 from the plain regression's residuals and 0.50 from the ARIMAX fit, are the same fact seen two ways.

Here is that regression written out. `y_t` is sales on day t, `beta_0` is the baseline, `beta_1` is the temperature effect, `x_t` is temperature on day t, and `n_t` is the leftover error, which itself follows an ARIMA process rather than being independent from one day to the next.

$$ y_t = \beta_0 + \beta_1 x_t + n_t $$

Move the slope and intercept below until the line snaps to the least-squares fit. That fitted slope is the exact same idea as the `temperature` coefficient in `icecream_fit`.

::widget ols-fit {"points":[{"x":23.1,"y":107.1},{"x":24,"y":117.2},{"x":24.5,"y":113.5},{"x":25.6,"y":112},{"x":28.7,"y":125.2},{"x":29.5,"y":129.4},{"x":28.8,"y":125.6},{"x":27.8,"y":125.1},{"x":25.8,"y":113.4},{"x":25.2,"y":110.2},{"x":23.4,"y":114},{"x":25.4,"y":121.9},{"x":24.5,"y":119.8},{"x":22.1,"y":117},{"x":15.1,"y":92.3},{"x":18.1,"y":102},{"x":15.4,"y":94.9},{"x":16,"y":88.7},{"x":11.6,"y":75.2},{"x":10.1,"y":79.9},{"x":14.1,"y":93.1},{"x":12.5,"y":81},{"x":13.6,"y":71.1},{"x":12.1,"y":71.7},{"x":13.7,"y":77.1},{"x":11.7,"y":70},{"x":15.1,"y":83.4},{"x":17.8,"y":99.1},{"x":15.3,"y":89.2},{"x":19.8,"y":101.6},{"x":19.5,"y":106},{"x":22.8,"y":111.3},{"x":23.9,"y":111.1},{"x":27.8,"y":123.4},{"x":26.2,"y":111.7},{"x":28.2,"y":125.4},{"x":28.5,"y":134.6},{"x":27.2,"y":125.7},{"x":26.8,"y":126.4},{"x":27.6,"y":124.4},{"x":24.6,"y":115.8},{"x":24.7,"y":116.8},{"x":24,"y":118.2},{"x":24.6,"y":122.6},{"x":18.2,"y":100.5},{"x":18.5,"y":102},{"x":17.2,"y":94},{"x":16.3,"y":93.1},{"x":15,"y":88.6},{"x":16,"y":92.7},{"x":11.6,"y":74.9},{"x":10.9,"y":71.3},{"x":11.1,"y":75.4},{"x":10.9,"y":77.8},{"x":12.1,"y":77.9},{"x":11.9,"y":74.1},{"x":16.6,"y":90.9},{"x":16.4,"y":87.4},{"x":19.8,"y":94.3},{"x":20,"y":98.9},{"x":24.1,"y":115.9},{"x":24.5,"y":121},{"x":25.5,"y":123.3},{"x":26.2,"y":127.7},{"x":29.4,"y":135.6},{"x":27.4,"y":135.9},{"x":25,"y":115.8},{"x":29,"y":127.7},{"x":28.3,"y":127.3},{"x":23.7,"y":109.5},{"x":27.6,"y":122.7},{"x":22.9,"y":112.6},{"x":23.7,"y":109.4},{"x":21.8,"y":101.3},{"x":20.3,"y":99.1},{"x":17.9,"y":96},{"x":18.9,"y":99.8},{"x":16.3,"y":88.1},{"x":12.5,"y":79.2},{"x":13.1,"y":78.1},{"x":10.5,"y":59.9},{"x":13.5,"y":76.1},{"x":13.3,"y":78.9},{"x":9.8,"y":71.4},{"x":13.3,"y":83.3},{"x":15.7,"y":86.8},{"x":15,"y":89.2},{"x":16.4,"y":88.9},{"x":18,"y":99.8},{"x":21.2,"y":107.7},{"x":19.8,"y":101.6},{"x":22.5,"y":108.8},{"x":23.6,"y":112.7},{"x":27,"y":121.7},{"x":27.7,"y":125.5},{"x":24.5,"y":113.9},{"x":26.2,"y":121.3},{"x":26.2,"y":125.6},{"x":27.6,"y":129.6},{"x":28.7,"y":129.2},{"x":29.3,"y":128.2},{"x":25.4,"y":116.2},{"x":24.8,"y":114.9},{"x":21.9,"y":105.6},{"x":18.1,"y":92.2},{"x":18.9,"y":95.8},{"x":16.4,"y":85.1},{"x":17,"y":89.4},{"x":13.2,"y":83},{"x":11.4,"y":81.6},{"x":10.5,"y":80.4},{"x":13.7,"y":83},{"x":11,"y":81.6},{"x":12.3,"y":80},{"x":12.1,"y":79.2},{"x":11.3,"y":71.1},{"x":18.2,"y":93.4},{"x":17.5,"y":98.9},{"x":17.9,"y":98.3},{"x":21.4,"y":110.9}]}

An ordinary regression assumes its errors are independent of each other, and it computes its standard errors on that assumption. When the errors are actually autocorrelated, as they are here, that assumption is wrong, and the reported standard error understates how uncertain the slope really is. Modeling `n_t` as an ARIMA process, instead of pretending it is independent noise, is what lets `icecream_fit` report a `temperature` coefficient with a standard error you can actually trust.

=== step === widget
## Keeping or dropping a regressor: comparing AICc

Adding a regressor is only worth it if the regressor genuinely helps. The way to check is AICc, a score that rewards a model for fitting the data well and penalizes it for every extra parameter it needed to do so. Lower AICc means the better model.

Fit a plain ARIMA on the same sales series, with no regressor at all, and compare.

```r
# Fit a plain ARIMA on the same series, with no regressor
icecream_plain <- auto.arima(sales)
icecream_plain
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

Look at `ar1` here: 0.8816, far higher than the 0.4997 the ARIMAX needed. Without temperature to explain the swings in sales, the AR term has to absorb that movement itself, and it looks like pure inertia instead. Now put the two AICc values side by side.

```r
# Compare the two models by AICc
c(ARIMA = icecream_plain$aicc, ARIMAX = icecream_fit$aicc)
#>    ARIMA   ARIMAX 
#> 866.0010 667.0485 
```

::widget chart-plotter {"data":[{"x":"ARIMA","y":866.0},{"x":"ARIMAX","y":667.0}],"x":"model","y":"AICc","geoms":["bar"]}

A gap of about 199 AICc points separates the two. As a rule of thumb, a gap over roughly 10 already counts as strong evidence for the better model, so a gap this size is decisive: temperature carries real information about sales, and the model that uses it is clearly the better one. This will not always happen. Some candidate regressors add nothing useful, and then the plain model scores just as well, which is exactly why you compare instead of assuming.

=== step === tryit
## Your turn: measure the AICc improvement

Compute the exact AICc gap between the two fits: `icecream_plain` and `icecream_fit`. Subtract the ARIMAX's AICc from the plain model's, and round to 2 decimal places.

```r
# Subtract icecream_fit's AICc from icecream_plain's AICc, rounded to 2 decimals.
# One line. Press Check when you have it.
```
::check {"regex": "icecream_plain\\$aicc\\s*-\\s*icecream_fit\\$aicc", "gate": true, "difficulty": "beginner", "ok": "Right: 198.95 AICc points. A gap that size is not a close call: temperature is clearly improving the fit, many times over the usual threshold.", "no": "Take the two aicc values from the fitted objects and subtract them: `icecream_plain$aicc - icecream_fit$aicc`, then wrap the whole thing in `round(..., 2)`."}
::solution
```r
# Subtract the ARIMAX's AICc from the plain model's AICc
round(icecream_plain$aicc - icecream_fit$aicc, 2)
#> [1] 198.95
```

=== step === concept
## Forecasting means supplying the regressor's future too

Here is the biggest practical difference between ARIMA and ARIMAX, and the mistake that trips up almost everyone the first time they use `xreg`. A plain ARIMA model can project itself forward using nothing but its own past. ARIMAX cannot do that, because part of what drives the series lives outside the series. To forecast sales for a future day, the model needs to know what temperature will be on that day, and it cannot invent that number on its own.

So forecasting with ARIMAX is a two-part job: build the future values of the regressor first, then pass them to `forecast()` through the same `xreg` argument. You do not even need to set `h`, the forecast horizon, because it is simply read off from how many rows the future `xreg` has.

```r
# Forecast 14 days ahead by supplying 14 future temperatures
set.seed(77)
future_temp <- 20 + 8 * sin(2 * pi * ((n + 1):(n + 14)) / 30) + rnorm(14, 0, 1.5)
icecream_fc <- forecast(icecream_fit, xreg = cbind(temperature = future_temp))
icecream_fc
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

Each row is one future day. `Point Forecast` is the single best guess, and `Lo 80`/`Hi 80` and `Lo 95`/`Hi 95` are the 80% and 95% prediction intervals, the ranges expected to contain the actual value that often. Read down the point forecasts and they climb and fall between about 107 and 131, tracking the seasonal swing we built into future temperature.

Plot the history and the forecast together, and the same wave shows up in the chart.

```r
# Plot the ARIMAX forecast with its uncertainty fan
autoplot(icecream_fc) + ggtitle("Sales forecast driven by future temperature")
```

To feel how much the future regressor drives the forecast, compare two extreme scenarios: a 7-day heatwave at 32 degrees every day, against a 7-day cold snap at 12 degrees every day.

```r
# Compare a heatwave scenario against a cold snap scenario
heatwave <- cbind(temperature = rep(32, 7))
coldsnap <- cbind(temperature = rep(12, 7))
round(c(heatwave = as.numeric(forecast(icecream_fit, xreg = heatwave)$mean[1]),
        coldsnap = as.numeric(forecast(icecream_fit, xreg = coldsnap)$mean[1])), 1)
#> heatwave coldsnap 
#>    141.4     79.6 
```

| Scenario | Temperature every day | Day-1 sales forecast |
|---|---|---|
| Heatwave | 32 | 141.4 |
| Cold snap | 12 | 79.6 |

The model and day are identical, yet the forecasts are very different: a gap of 61.8. That tracks the `temperature` coefficient closely, since 3.089 sales per degree times a 20-degree gap between 32 and 12 is about 62. Feed the model a different future, and ARIMAX hands back a genuinely different forecast, which a plain ARIMA could never do because it has no regressor to feed in the first place.

=== step === concept
## A real example: measuring a policy's effect with a 0/1 regressor

ARIMAX is just as useful for measuring a driver's effect as it is for forecasting. The built-in `Seatbelts` dataset, which is part of base R, records monthly UK road casualties from 1969 to 1984. Front seat belts became compulsory on 31 January 1983, and the data carries a `law` column that is 0 before that date and 1 after. A plain ARIMA could never use that column, because it is information from outside the series. ARIMAX can, and a 0/1 regressor like this is how you measure the net effect of a policy, a promotion, or any other on/off intervention.

We will model drivers killed or seriously injured, using three regressors: petrol price, distance driven, and the law flag.

```r
# Load the Seatbelts data and build its regressors
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

`kms` is divided by 1000 only to keep its coefficient on a readable scale. Fit a plain ARIMA and an ARIMAX side by side, and compare them by AICc.

```r
# Fit plain ARIMA and ARIMAX on the seat belt data, compare by AICc
sb_plain  <- auto.arima(drivers)
sb_arimax <- auto.arima(drivers, xreg = regressors)
c(ARIMA = sb_plain$aicc, ARIMAX = sb_arimax$aicc)
#>    ARIMA   ARIMAX 
#> 2299.007 2284.579 
```

The ARIMAX comes out about 14 AICc points lower, past the rough threshold of 10, so the regressors are genuinely improving the fit here too. Read the full fit to see each one's effect.

```r
# Read the ARIMAX coefficients
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

The seasonal orders on the left are `auto.arima()` handling the strong monthly pattern in road casualties; leave those to it. Focus on `law`: its coefficient is -279.9, with a standard error of 74.2. The coefficient is about 3.8 times its own standard error, which is far enough from zero to trust.

```r
# Extract the estimated effect of the seat belt law
round(coef(sb_arimax)["law"], 1)
#> law 
#> -279.9 
```

Read that plainly: after accounting for seasonality, petrol price, and how far people drove, the seat belt law is associated with about 280 fewer drivers killed or seriously injured per month. Petrol price and distance driven are in the model precisely so that this number reads as the law's own net effect, not something the other two drivers were actually responsible for.

=== step === quiz
## Quick check: which argument carries an outside predictor?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- `h` ::no
- `xreg` ::ok Right. `h` only sets how many periods ahead to forecast; `xreg` is what carries an outside predictor into the model.
- `order` ::no
- `seasonal` ::no `h` sets the forecast horizon, `order` sets the ARIMA structure, and `seasonal` toggles seasonal terms. None of them carries an outside predictor; that is what `xreg` is for.

=== step === quiz
## Quick check: why the ARIMA-errors idea protects the standard error

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- It does not matter; an ordinary regression on time-series data already reports a valid standard error for the slope. ::no
- It keeps the coefficient's standard error honest, because an ordinary regression assumes independent errors, and time-series errors like these usually are not. ::ok Exactly. The lag-1 autocorrelation of 0.494 in the plain regression's residuals is exactly what modeling the error as ARIMA(1,0,0) accounts for.
- It changes the value of the coefficient itself, not its standard error. ::no
- It only matters when the regressor is a 0/1 dummy variable. ::no An ordinary regression's standard errors assume independent residuals. When residuals are autocorrelated, as sales' regression residuals are here, that assumption understates the true uncertainty. Modeling the leftover error as ARIMA fixes exactly that, for any kind of regressor, not just dummies.

=== step === quiz
## Quick check: reading an AICc gap

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- It is a nice-to-have; a regressor worth keeping for interpretation even if AICc goes up. ::no
- It means the regressor raises R-squared, which is what a forecast ultimately needs. ::no
- It means the fit improves enough to be worth the extra parameter; a gap over roughly 10 is strong evidence for the model that includes it. ::ok Right. The ice-cream example's gap of 199 and the seat belt example's gap of about 14 both clear that bar easily.
- It means the regressor is statistically significant at the 5% level. ::no AICc is not a significance test and it does not track R-squared. It trades off fit against the number of parameters used to get that fit, and a large drop, like the roughly 199-point and 14-point gaps you saw, is the evidence that a regressor is worth keeping in the model.

=== step === quiz
## Quick check: why ARIMAX forecasting needs future regressor values

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- ARIMAX forecasts its own regressors internally, using the same ARIMA structure it fits to the series. ::no
- Plain ARIMA only ever projects the series from its own past; ARIMAX depends on an outside variable too, so it needs that variable's values for every period it is asked to forecast. ::ok Right. That is exactly why the heatwave and cold snap scenarios needed their own future temperatures before `forecast()` could run.
- Only when the regressor is a 0/1 dummy variable. ::no
- Only when the forecast horizon is longer than 12 periods. ::no ARIMAX never forecasts its regressors on its own; it has no model for temperature, only for sales given temperature. That is true at any horizon and for any kind of regressor, dummy or continuous, which is why `forecast()` always needs a future `xreg` to go with an ARIMAX fit.

=== step === quiz
## Quick check: reading the seat belt law coefficient

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Because `law` is a 0/1 dummy, and any 0/1 dummy automatically measures a net effect on its own. ::no
- Because the law coefficient is simply the raw average difference in casualties before and after the law took effect. ::no
- Because petrol price and distance driven are also in the model, so the law coefficient measures the law's association with casualties after accounting for those two other drivers. ::ok Right. Petrol prices and distance driven both moved around 1983 too; without them in the model, the law coefficient would be confounded with their effects instead of isolating the law's own.
- Because the ARIMA part of the model already accounts for petrol price and distance driven, so the regression coefficient does not need to. ::no A raw before/after difference would confound the law's effect with whatever petrol price and distance driven were doing at the same time. The ARIMA part only models the leftover error's autocorrelation; it does not substitute for actual regressors. `law` reads as a net effect only because `PetrolPrice` and `kms` are sitting right next to it in the same `xreg`.

=== step === tryit
## Your turn: build a series and recover the effect you chose

Build your own series from scratch, choosing the effect yourself: `my_y = 100 + 2.5 * my_x + AR(1) noise`. Fit an ARIMAX and confirm it recovers something close to 2.5.

```r
# Use set.seed(303). Build my_x (a seasonal predictor), then
# my_y <- 100 + 2.5 * my_x + as.numeric(arima.sim(model = list(ar = 0.7), n = 150, sd = 3)).
# Fit auto.arima(my_y, xreg = cbind(my_x = my_x)) and read the my_x coefficient.
# A few lines. Press Check when you have them.
```
::check {"regex": "xreg\\s*=\\s*cbind[(]my_x\\s*=\\s*my_x[)]", "gate": true, "difficulty": "intermediate", "ok": "Right: about 2.513, sitting almost exactly on the true 2.5 we built in. The same cbind naming and coef extraction you used on the shop's data works on any series you build.", "no": "Reuse the same pattern as for the shop's data: build my_x with a seasonal formula plus noise, set my_y <- 100 + 2.5 * my_x + as.numeric(arima.sim(model = list(ar = 0.7), n = 150, sd = 3)), then fit with xreg = cbind(my_x = my_x) and pull coef(my_fit)[\"my_x\"]."}
::solution
```r
# Build my_x and my_y with a chosen true effect of 2.5, then recover it
set.seed(303)
my_x <- 20 + 5 * sin(2 * pi * (1:150) / 24) + rnorm(150, 0, 2)
my_y <- 100 + 2.5 * my_x + as.numeric(arima.sim(model = list(ar = 0.7), n = 150, sd = 3))
my_fit <- auto.arima(my_y, xreg = cbind(my_x = my_x))
round(coef(my_fit)["my_x"], 3)
#>  my_x 
#> 2.513 
```

`auto.arima()` also recovered an intercept near 100 and an AR(1) term near 0.70, matching every value we built into `my_y`. The same mechanics apply to any series, not just the shop's data.

=== step === concept
## References

- [Forecasting: Principles and Practice, 3rd edition, Chapter 10, Dynamic regression models](https://otexts.com/fpp3/dynamic.html) - Hyndman, R.J. and Athanasopoulos, G.
- [Automatic Time Series Forecasting: The forecast Package for R](https://doi.org/10.18637/jss.v027.i03) - Hyndman, R.J. and Khandakar, Y. (2008), Journal of Statistical Software, 27(3).
- [Arima() and auto.arima() documentation](https://pkg.robjhyndman.com/forecast/reference/Arima.html) - the forecast package reference.
- [Seatbelts dataset documentation](https://stat.ethz.ch/R-manual/R-devel/library/datasets/html/Seatbelts.html) - R Core Team, Road Casualties in Great Britain 1969-84.

=== step === complete
## You can now add outside information to an ARIMA forecast

You have now added outside information to a forecast that used to see only a series' own past.

- `xreg` is how you hand an ARIMA model an outside variable, and `cbind(name = predictor)` is how you give its coefficient a readable name.
- What R actually fits is a regression on that variable, with the leftover error modeled as ARIMA instead of independent noise, which is what keeps the coefficient's standard error accurate.
- AICc tells you whether a regressor is genuinely helping: a gap of roughly 10 or more, like the 199 points here and the 14 in the seat belt example, is strong evidence to keep it.
- Forecasting with ARIMAX needs the regressor's future values too, since the model has no way to invent them, and different futures produce genuinely different forecasts, as the heatwave and cold snap showed.
- A 0/1 regressor, like the seat belt law, measures a policy's or an intervention's net effect once the other drivers sitting alongside it are in the model too.

Next time a series has a driver you already know about, temperature, price, a promotion, a policy change, you now have the tool to put that knowledge to work instead of leaving it on the table.
