---
title: "ARIMA in R: What AR, I, and MA Mean and How to Fit One"
slug: "ARIMA-in-R"
description: "Learn what AR, I, and MA mean in an ARIMA model, how differencing and ACF/PACF pick p, d, q, and how to fit and forecast with Arima() and auto.arima() in R."
keywords: "ARIMA in R, auto.arima, Arima function, AR I MA, forecast package, time series forecasting, ACF PACF, differencing, stationarity, seasonal ARIMA"
auto_link_terms: "ARIMA|ARIMA model|ARIMA in R|ARIMA models|auto.arima|autoregressive integrated moving average|autoregressive model|moving average model|ARIMA(p,d,q)|seasonal ARIMA|SARIMA|differencing a time series"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-18"
curriculum_id: "3.8.10"
post_type: "C"
sidebar_section: "Time Series"
sidebar_title: "ARIMA Models"
sidebar_order: 14
difficulty: "Intermediate"
---

<p class="lead">ARIMA is a forecasting model that combines three simple ideas: it learns from a series' own recent values (the AR part), it removes trends by working with changes instead of raw levels (the I part), and it learns from its own recent forecast errors (the MA part). You write it as ARIMA(p, d, q), and in R you fit one with <code>Arima()</code> or <code>auto.arima()</code> from the forecast package.</p>

## What is an ARIMA model, and what do p, d, and q mean?

The fastest way to see what ARIMA does is to point it at a real series and let it work. The built-in `WWWusage` series counts internet users connected to a server, once a minute, for 100 minutes. Let's load the forecast package and ask it to find a model on its own.

```r title="Fit an ARIMA model automatically"
library(forecast)
library(ggplot2)
auto.arima(WWWusage)
#> Series: WWWusage 
#> ARIMA(1,1,1) 
#> 
#> Coefficients:
#>          ar1     ma1
#>       0.6504  0.5256
#> s.e.  0.0842  0.0896
#> 
#> sigma^2 = 9.995:  log likelihood = -254.15
#> AIC=514.3   AICc=514.55   BIC=522.08
```

In one line, R chose a model and called it `ARIMA(1,1,1)`. That label is the whole game: the three numbers are `p`, `d`, and `q`. By the end of this tutorial you will be able to read that label, understand why each number was chosen, and fit and trust a model like it yourself.

Here is what each of the three numbers controls. Keep this table nearby; every section below unpacks one row of it.

| Letter | Name | Order | What it captures |
|---|---|---|---|
| AR | Autoregressive | p | How many past values the model leans on |
| I | Integrated | d | How many times we difference to remove the trend |
| MA | Moving average | q | How many past forecast errors the model leans on |

So `ARIMA(1,1,1)` means: use 1 past value, difference the series once, and use 1 past error. The diagram below shows how the three pieces feed one model that then produces forecasts.

![The three parts of ARIMA feeding into one model](screenshots/ARIMA-in-R-components.webp)
*Figure 1: The three parts of ARIMA combine into one ARIMA(p, d, q) model that produces forecasts.*

Before we take it apart, let's glance at the raw numbers so you can picture the data behind that model.

```r title="Peek at the WWWusage series"
head(as.numeric(WWWusage), 12)
#> [1] 88 84 85 85 84 85 83 85 88 89 91 99
```

The counts drift upward and downward over time rather than bouncing around a fixed level. That drift is exactly what the `d` part exists to handle, and it is why R chose `d = 1` above.

[KEY INSIGHT]
**ARIMA is not one exotic method, it is three plain ideas put together.** Once you understand autoregression, differencing, and forecast-error correction on their own, reading any ARIMA(p, d, q) label becomes routine.

**Try it:** Fit an automatic model to the built-in `lh` series (a set of hormone measurements) and read off its (p, d, q).

```r title="Your turn: fit ARIMA to the lh series"
# Goal: fit an automatic model to lh and read its (p, d, q).
# Swap AirPassengers below for lh, then run.
ex_series <- AirPassengers   # change AirPassengers to lh
auto.arima(ex_series)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Automatic ARIMA on lh"
auto.arima(lh)
#> Series: lh 
#> ARIMA(1,0,0) with non-zero mean 
#> 
#> Coefficients:
#>          ar1    mean
#>       0.5739  2.4133
#> s.e.  0.1161  0.1466
#> 
#> sigma^2 = 0.2061:  log likelihood = -29.38
#> AIC=64.76   AICc=65.3   BIC=70.37
```

**Explanation:** For `lh`, R picks `ARIMA(1,0,0)`, which is a pure autoregressive model of order 1. The `d = 0` tells you this series did not need differencing, and `q = 0` tells you no error terms were used.

</details>

## What does the AR (autoregressive) part do?

The "autoregressive" idea is the most intuitive of the three: tomorrow tends to look like today. A busy web server this minute is probably busy the next minute too. AR captures that inertia by predicting each value from the value or values just before it.

An AR model of order 1, written AR(1), predicts today from yesterday using a single coefficient. In equation form it looks like this.

$$y_t = c + \phi\, y_{t-1} + \varepsilon_t$$

Where:
- $y_t$ = the value at time $t$ (what we want to predict)
- $c$ = a constant baseline
- $\phi$ = the AR coefficient, how strongly the last value pulls on this one
- $y_{t-1}$ = the previous value
- $\varepsilon_t$ = a random shock we cannot predict

A $\phi$ near 1 means strong memory (values change slowly), while a $\phi$ near 0 means almost no memory. Let's see this by building a series with a known coefficient of 0.8 and asking R to recover it. The `arima.sim()` function generates data from a model we specify, and `Arima()` fits a model back to that data.

```r title="Simulate and fit an AR(1) series"
set.seed(101)
ar_series <- arima.sim(model = list(ar = 0.8), n = 200)
Arima(ar_series, order = c(1, 0, 0), include.mean = FALSE)
#> Series: ar_series 
#> ARIMA(1,0,0) with zero mean 
#> 
#> Coefficients:
#>          ar1
#>       0.7765
#> s.e.  0.0441
#> 
#> sigma^2 = 0.941:  log likelihood = -277.66
#> AIC=559.32   AICc=559.39   BIC=565.92
```

We built the data with $\phi = 0.8$, and R estimated `ar1 = 0.7765`, close to the truth. The small gap is sampling noise from having only 200 points. The `order = c(1, 0, 0)` argument is `c(p, d, q)`, so it says "fit one AR term, no differencing, no MA term."

Plotting the series makes the inertia visible: values wander in slow runs rather than jumping around.

```r title="Plot the simulated AR(1) series"
autoplot(ar_series) + ggtitle("AR(1): each value is pulled toward the last")
```

That estimated coefficient of about 0.78 is the practical takeaway of the AR part. It says roughly 78 percent of a value's deviation from the mean carries over to the next step, which is why the line moves in smooth stretches.

**Try it:** Simulate 300 points of an AR(1) with a coefficient of 0.5, then fit an AR(1) and check that the estimate lands near 0.5.

```r title="Your turn: recover an AR(1) coefficient"
# Goal: simulate an AR(1) with coefficient 0.5, then fit it back.
# Change the ar value below, then run.
set.seed(7)
ex_ar <- arima.sim(model = list(ar = 0.2), n = 300)   # change 0.2 to 0.5
Arima(ex_ar, order = c(1, 0, 0), include.mean = FALSE)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Fit the AR(1) with coefficient 0.5"
set.seed(7)
ex_ar <- arima.sim(model = list(ar = 0.5), n = 300)
Arima(ex_ar, order = c(1, 0, 0), include.mean = FALSE)
#> Series: ex_ar 
#> ARIMA(1,0,0) with zero mean 
#> 
#> Coefficients:
#>          ar1
#>       0.5941
#> s.e.  0.0464
#> 
#> sigma^2 = 0.9666:  log likelihood = -420.31
#> AIC=844.62   AICc=844.66   BIC=852.02
```

**Explanation:** The estimate `ar1 = 0.5941` sits near the true 0.5, off by a bit because of random noise in the sample.

</details>

## What does the MA (moving average) part do?

The MA part is the least intuitive name in all of ARIMA, so let's be precise. The moving average here has nothing to do with smoothing a series by averaging nearby points. Instead, it means the model corrects itself using its own recent forecast errors.

Picture forecasting the weather. If you predicted 20 degrees and it came in at 25, you were 5 degrees too low, and a smart forecaster nudges tomorrow's prediction up a little because of that miss. That "learn from the last surprise" behavior is exactly what an MA term does.

An MA model of order 1, written MA(1), adjusts today's value using the previous shock.

$$y_t = c + \varepsilon_t + \theta\, \varepsilon_{t-1}$$

Where:
- $\varepsilon_t$ = the current random shock
- $\theta$ = the MA coefficient, how much the last shock feeds into today
- $\varepsilon_{t-1}$ = the previous shock (the error we just made)

Let's simulate an MA(1) with a known coefficient of 0.7 and recover it, the same way we did for AR.

```r title="Simulate and fit an MA(1) series"
set.seed(202)
ma_series <- arima.sim(model = list(ma = 0.7), n = 200)
Arima(ma_series, order = c(0, 0, 1), include.mean = FALSE)
#> Series: ma_series 
#> ARIMA(0,0,1) with zero mean 
#> 
#> Coefficients:
#>          ma1
#>       0.7073
#> s.e.  0.0577
#> 
#> sigma^2 = 1.003:  log likelihood = -283.98
#> AIC=571.95   AICc=572.01   BIC=578.55
```

Here `order = c(0, 0, 1)` means no AR term, no differencing, one MA term. R estimated `ma1 = 0.7073`, right next to the 0.7 we used to build the data. The value tells us how strongly the previous minute's surprise shapes this minute's value.

[WARNING]
**The MA in ARIMA is not moving-average smoothing.** A [moving average](Moving-Averages-in-R.html) in the everyday sense averages neighboring data points to smooth a line, but the MA term in ARIMA is a weighted sum of past forecast errors. Same two words, completely different idea.

**Try it:** Simulate an MA(1) with a coefficient of -0.6 and recover it. Negative coefficients are common and perfectly valid.

```r title="Your turn: recover an MA(1) coefficient"
# Goal: simulate an MA(1) with coefficient -0.6 and fit it back.
# Change the ma value below, then run.
set.seed(8)
ex_ma <- arima.sim(model = list(ma = 0.3), n = 300)   # change 0.3 to -0.6
Arima(ex_ma, order = c(0, 0, 1), include.mean = FALSE)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Fit the MA(1) with coefficient -0.6"
set.seed(8)
ex_ma <- arima.sim(model = list(ma = -0.6), n = 300)
Arima(ex_ma, order = c(0, 0, 1), include.mean = FALSE)
#> Series: ex_ma 
#> ARIMA(0,0,1) with zero mean 
#> 
#> Coefficients:
#>           ma1
#>       -0.7011
#> s.e.   0.0402
#> 
#> sigma^2 = 0.99:  log likelihood = -424.01
#> AIC=852.03   AICc=852.07   BIC=859.44
```

**Explanation:** The estimate `ma1 = -0.7011` recovers the negative sign and a magnitude close to 0.6, again with a little sampling wobble.

</details>

## What does the I (integrated) part do, and when should you difference?

Both the AR and MA parts assume the series is stationary, which means its behavior does not change over time: a roughly constant average level, a roughly constant amount of wobble, and no trend heading steadily up or down. A series with a clear trend breaks that assumption, and this is the problem the I part solves.

The fix is differencing: instead of modeling the raw values, we model the change from one step to the next. If levels keep climbing, the changes usually hover around a stable level, which is stationary again.

$$y'_t = y_t - y_{t-1}$$

The `d` in ARIMA(p, d, q) is simply how many times we apply this. Most series need `d = 0` or `d = 1`, and only rarely `d = 2`.

To see differencing rescue a trending series, look at a random walk, which is the textbook non-stationary series. We can test for stationarity with the Augmented Dickey-Fuller test from the tseries package. Its null hypothesis is "non-stationary," so a small p-value (below 0.05) is evidence that the series IS stationary.

```r title="Test a random walk for stationarity"
set.seed(55)
rw <- ts(cumsum(rnorm(200)))
library(tseries)
adf.test(rw)
#> 	Augmented Dickey-Fuller Test
#> 
#> data:  rw
#> Dickey-Fuller = -2.8127, Lag order = 5, p-value = 0.2357
#> alternative hypothesis: stationary
```

The p-value of 0.2357 is well above 0.05, so we cannot call the raw random walk stationary. Now watch what one round of differencing does. The `diff()` function turns levels into step-to-step changes.

```r title="Difference the random walk and re-test"
adf.test(diff(rw))
#> 	Augmented Dickey-Fuller Test
#> 
#> data:  diff(rw)
#> Dickey-Fuller = -5.8066, Lag order = 5, p-value = 0.01
#> alternative hypothesis: stationary
```

The p-value drops to 0.01, so the differenced series passes the test. That single difference is what `d = 1` means in practice. R even notes the true p-value is smaller than the 0.01 it prints, which is a good sign.

[KEY INSIGHT]
**Differencing removes trend so the AR and MA machinery has something stable to work with.** You are not throwing information away, you are changing the question from "what is the level?" to "how much did it change?", which is usually the more forecastable quantity.

Now back to real data. The `WWWusage` series trends, so the same test should flag it as non-stationary.

```r title="Test the WWWusage series for stationarity"
adf.test(WWWusage)
#> 	Augmented Dickey-Fuller Test
#> 
#> data:  WWWusage
#> Dickey-Fuller = -2.6421, Lag order = 4, p-value = 0.3107
#> alternative hypothesis: stationary
```

The p-value of 0.3107 confirms it is non-stationary, matching the drift we saw in the raw counts earlier. Rather than eyeball tests, you can let the forecast package pick the differencing order for you with `ndiffs()`, which runs a stationarity test repeatedly.

```r title="Ask ndiffs how many differences are needed"
ndiffs(WWWusage)
#> [1] 1
```

It returns 1, which is exactly the `d` that `auto.arima()` chose at the top of this tutorial. If you want a deeper treatment of these tests, see the dedicated guide on [testing stationarity in R](Test-Stationarity-in-R.html).

**Try it:** Use `ndiffs()` to find how many (non-seasonal) differences the `AirPassengers` series needs.

```r title="Your turn: how many differences for AirPassengers"
# Goal: use ndiffs() to see how many differences AirPassengers needs.
# Replace the series below, then run.
ndiffs(WWWusage)   # change WWWusage to AirPassengers
```

<details>
<summary>Click to reveal solution</summary>

```r title="Differences needed for AirPassengers"
ndiffs(AirPassengers)
#> [1] 1
```

**Explanation:** `AirPassengers` also needs one ordinary difference to remove its upward trend. It has seasonality on top of that, which we handle separately later with seasonal differencing.

</details>

## How do you read ACF and PACF to choose p and q?

Once a series is stationary, two plots tell you how many AR and MA terms it likely needs. They are the autocorrelation function (ACF) and the partial autocorrelation function (PACF), and you can think of them as fingerprints of the model behind the data. If these are new to you, the [ACF and PACF guide](ACF-and-PACF-in-R.html) covers them in depth; here we focus on the reading rules for ARIMA.

The ACF measures how correlated the series is with itself at each lag (1 step back, 2 steps back, and so on). The PACF measures the same thing but strips out the influence of the shorter lags in between. The reading rules are short and worth memorizing.

| Pattern in the plots | Suggests |
|---|---|
| PACF cuts off sharply after lag p, ACF fades gradually | AR(p) |
| ACF cuts off sharply after lag q, PACF fades gradually | MA(q) |
| Both fade gradually | A mix of AR and MA |

Let's confirm the rules on the pure series we simulated earlier. For our AR(1) series, the PACF should show one clear spike at lag 1 and then almost nothing.

```r title="PACF of the AR(1) series"
round(Pacf(ar_series, plot = FALSE)$acf[1:5], 3)
#> [1]  0.776 -0.055 -0.068  0.062  0.111
```

One big value (0.776) at lag 1, then a drop to near zero, is the AR(1) signature: the PACF cuts off after lag 1, so p is 1. Now the MA(1) series, whose ACF should spike once and then cut off.

```r title="ACF of the MA(1) series"
round(Acf(ma_series, plot = FALSE)$acf[1:5], 3)
#> [1] 1.000 0.507 0.041 -0.022 0.025
```

The first value (1.000) is always the correlation of the series with itself at lag 0, so ignore it. The next value (0.507) is the lag-1 spike, and everything after is near zero. That cut-off after lag 1 is the MA(1) fingerprint, so q is 1.

For a real series you look at both plots together on the DIFFERENCED data, since that is what the AR and MA parts see. The `ggtsdisplay()` helper shows the series together with its ACF and PACF in one shot.

```r title="Show the series with its ACF and PACF"
ggtsdisplay(diff(WWWusage))
```

The diagram below sums up the decision.

![Reading ACF and PACF plots to pick orders](screenshots/ARIMA-in-R-acf-pacf.webp)
*Figure 2: The PACF suggests the AR order p; the ACF suggests the MA order q.*

[TIP]
**Treat ACF and PACF as a starting point, not a verdict.** Real plots are rarely as clean as textbook ones, so use them to shortlist a few candidate orders, then let AIC and residual checks (both coming up) pick the winner.

**Try it:** Simulate an AR(2) series and look at its PACF. How many spikes stick out before it fades?

```r title="Your turn: count the PACF spikes of an AR(2)"
# Goal: simulate an AR(2) and inspect its PACF.
set.seed(9)
ex_ar2 <- arima.sim(model = list(ar = c(0.5, 0.3)), n = 300)
ggPacf(ex_ar2)   # how many bars clearly stick out past the blue band?
```

<details>
<summary>Click to reveal solution</summary>

```r title="PACF values of the AR(2) series"
round(Pacf(ex_ar2, plot = FALSE)$acf[1:5], 3)
#> [1]  0.684  0.222  0.067  0.062 -0.030
```

**Explanation:** The first two values (0.684 and 0.222) stand out, then the rest fade toward zero. Two meaningful PACF spikes point to an AR order of 2, which matches how we built the series.

</details>

## How do you fit an ARIMA model with Arima() and auto.arima()?

You now know what p, d, and q mean and how to guess them. Time to fit real models two ways: by hand when you want control, and automatically when you want speed.

To fit a specific model, pass the order you want to `Arima()`. Let's fit the `ARIMA(1,1,1)` we saw at the start and read its output.

```r title="Fit ARIMA(1,1,1) by hand"
fit_manual <- Arima(WWWusage, order = c(1, 1, 1))
fit_manual
#> Series: WWWusage 
#> ARIMA(1,1,1) 
#> 
#> Coefficients:
#>          ar1     ma1
#>       0.6504  0.5256
#> s.e.  0.0842  0.0896
#> 
#> sigma^2 = 9.995:  log likelihood = -254.15
#> AIC=514.3   AICc=514.55   BIC=522.08
```

The coefficients are the AR and MA weights, and the numbers to compare across models are the information criteria near the bottom. AICc (a small-sample-corrected version of AIC) balances fit against complexity, and lower is better. Let's line up three candidate orders and compare their AICc.

```r title="Compare candidate orders by AICc"
c(
  "ARIMA(1,1,1)" = Arima(WWWusage, order = c(1, 1, 1))$aicc,
  "ARIMA(2,1,0)" = Arima(WWWusage, order = c(2, 1, 0))$aicc,
  "ARIMA(0,1,1)" = Arima(WWWusage, order = c(0, 1, 1))$aicc
)
#> ARIMA(1,1,1) ARIMA(2,1,0) ARIMA(0,1,1) 
#>     514.5521     522.4308     549.9305 
```

Among these three, `ARIMA(1,1,1)` has the lowest AICc (514.55), so it is the best of the bunch. Trying orders by hand is fine for a few candidates, but it does not scale. That is what `auto.arima()` is for: it searches many orders and returns the best by AICc.

[NOTE]
**Use Arima() from the forecast package, not the base arima() function.** They fit the same models, but `Arima()` handles a constant or drift term more gracefully and works cleanly with the rest of the forecast tools you will use for checking and plotting.

The default `auto.arima()` uses a fast stepwise search. For a final model it is worth running the fuller search by turning off the shortcuts with `stepwise = FALSE` and `approximation = FALSE`.

```r title="Run the thorough automatic search"
best_fit <- auto.arima(WWWusage, stepwise = FALSE, approximation = FALSE)
best_fit
#> Series: WWWusage 
#> ARIMA(3,1,0) 
#> 
#> Coefficients:
#>          ar1      ar2     ar3
#>       1.1513  -0.6612  0.3407
#> s.e.  0.0950   0.1353  0.0941
#> 
#> sigma^2 = 9.656:  log likelihood = -252
#> AIC=511.99   AICc=512.42   BIC=522.37
```

The thorough search landed on `ARIMA(3,1,0)`, a different model from the quick `ARIMA(1,1,1)` we started with. Its AICc of 512.42 beats that model's 514.55, which is why the deeper search preferred it. This is the workhorse of the whole toolkit: `auto.arima()` handles the differencing test and the order search, then fits the model, all in one call.

[TIP]
**Reach for auto.arima() first, then sanity-check it.** Let it propose a model, but always read the residual diagnostics (next section) before you trust its forecasts, and remember that stepwise = FALSE often squeezes out a slightly better fit.

**Try it:** Fit `ARIMA(2,1,2)` to `WWWusage` and read its AICc. Is it below the 512.42 that `ARIMA(3,1,0)` scored?

```r title="Your turn: try another order"
# Goal: fit ARIMA(2,1,2) to WWWusage and read its AICc.
# Change the order below, then run.
Arima(WWWusage, order = c(1, 1, 0))$aicc   # change c(1,1,0) to c(2,1,2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="AICc of ARIMA(2,1,2)"
Arima(WWWusage, order = c(2, 1, 2))$aicc
#> [1] 518.0056
```

**Explanation:** `ARIMA(2,1,2)` scores 518.01, which is higher (worse) than the 512.42 of `ARIMA(3,1,0)`. More terms did not help here, which is exactly why AICc penalizes needless complexity.

</details>

## How do you check the model and make forecasts?

A model is only worth forecasting from if it has squeezed out all the structure it can, leaving behind residuals (the leftover errors) that look like pure random noise. If a pattern remains in the residuals, the model missed something. The `checkresiduals()` function runs the key test and draws the diagnostic plots.

```r title="Check the residuals of the fitted model"
checkresiduals(best_fit)
#> 	Ljung-Box test
#> 
#> data:  Residuals from ARIMA(3,1,0)
#> Q* = 4.4913, df = 7, p-value = 0.7218
#> 
#> Model df: 3.   Total lags used: 10
```

The printout is a Ljung-Box test, whose null hypothesis is "the residuals are just noise." Here we WANT a large p-value, because a large value means we cannot find leftover structure. At 0.7218 the residuals look like white noise, so the model is trustworthy. The plots it draws, a residual time series next to its ACF and a histogram, should show no obvious patterns.

With the model validated, forecasting is one call. The `forecast()` function projects ahead by the number of steps you pass to `h`, and it returns both point forecasts and prediction intervals.

```r title="Forecast ten periods ahead"
fc <- forecast(best_fit, h = 10)
fc
#>     Point Forecast    Lo 80    Hi 80    Lo 95    Hi 95
#> 101       219.6608 215.6785 223.6431 213.5704 225.7512
#> 102       219.2299 209.7822 228.6775 204.7810 233.6788
#> 103       218.2766 203.6141 232.9391 195.8522 240.7009
#> 104       217.3484 198.0261 236.6707 187.7975 246.8992
#> 105       216.7633 192.9165 240.6100 180.2928 253.2337
#> 106       216.3785 187.8975 244.8595 172.8205 259.9365
#> 107       216.0062 182.8589 249.1535 165.3118 266.7006
#> 108       215.6326 177.9269 253.3383 157.9667 273.2984
#> 109       215.3175 173.1999 257.4351 150.9042 279.7308
#> 110       215.0749 168.6692 261.4807 144.1035 286.0464
```

Each row is one future minute. The Point Forecast is the single best guess, and the four interval columns give ranges: the model is 80 percent sure the value lands between the Lo 80 and Hi 80 columns, and 95 percent sure between Lo 95 and Hi 95. Notice the intervals widen further out, because uncertainty compounds the further ahead you look. A picture makes that fan of uncertainty obvious.

```r title="Plot the forecast with its intervals"
autoplot(fc)
```

**Try it:** Forecast `WWWusage` five periods ahead from `best_fit` and read the first point forecast.

```r title="Your turn: forecast five periods ahead"
# Goal: forecast WWWusage 5 periods ahead from best_fit.
# Change h below, then run.
forecast(best_fit, h = 3)   # change h = 3 to h = 5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Five-step forecast"
forecast(best_fit, h = 5)
#>     Point Forecast    Lo 80    Hi 80    Lo 95    Hi 95
#> 101       219.6608 215.6785 223.6431 213.5704 225.7512
#> 102       219.2299 209.7822 228.6775 204.7810 233.6788
#> 103       218.2766 203.6141 232.9391 195.8522 240.7009
#> 104       217.3484 198.0261 236.6707 187.7975 246.8992
#> 105       216.7633 192.9165 240.6100 180.2928 253.2337
```

**Explanation:** The first row is period 101 with a point forecast of about 219.66, and its 95 percent interval runs from roughly 213.6 to 225.8.

</details>

## How do you model seasonal data with seasonal ARIMA?

Many real series repeat on a calendar: retail sales peak every December, airline traffic swells every summer. ARIMA handles this with a seasonal extension, often called SARIMA, that adds a second set of terms operating at the seasonal lag. The full notation is ARIMA(p, d, q)(P, D, Q)[m], where the second bracket is the seasonal AR, differencing, and MA orders, and `m` is the number of periods in one cycle (12 for monthly data).

The good news is that `auto.arima()` handles all of this for you when the series carries a frequency. The classic `AirPassengers` series records monthly airline passengers and has strong yearly seasonality.

```r title="Fit a seasonal ARIMA automatically"
air_fit <- auto.arima(AirPassengers)
air_fit
#> Series: AirPassengers 
#> ARIMA(2,1,1)(0,1,0)[12] 
#> 
#> Coefficients:
#>          ar1     ar2      ma1
#>       0.5960  0.2143  -0.9819
#> s.e.  0.0888  0.0880   0.0292
#> 
#> sigma^2 = 132.3:  log likelihood = -504.92
#> AIC=1017.85   AICc=1018.17   BIC=1029.35
```

Read the label in two halves. The non-seasonal part `(2,1,1)` works step-to-step (here month-to-month), and the seasonal part `(0,1,0)[12]` says: take one seasonal difference at lag 12, comparing each month to the same month last year, with no seasonal AR or MA terms. That single seasonal difference is what strips out the repeating yearly pattern.

Forecasting works exactly as before, and the plot shows the seasonal shape continuing into the future.

```r title="Forecast two years of airline traffic"
autoplot(forecast(air_fit, h = 24))
```

[NOTE]
**Seasonal ARIMA is the same three ideas, repeated at the seasonal lag.** Everything you learned about AR, I, and MA applies to the (P, D, Q) block too, just measured across whole seasons instead of single steps.

**Try it:** Use `nsdiffs()` to find how many SEASONAL differences `AirPassengers` needs.

```r title="Your turn: seasonal differencing"
# Goal: use nsdiffs() to count the seasonal differences AirPassengers needs.
# Change the function below, then run.
ndiffs(AirPassengers)   # change ndiffs to nsdiffs
```

<details>
<summary>Click to reveal solution</summary>

```r title="Seasonal differences for the airline data"
nsdiffs(AirPassengers)
#> [1] 1
```

**Explanation:** `nsdiffs()` returns 1, which matches the seasonal `D = 1` that `auto.arima()` chose. It measures seasonal (year-over-year) differencing, while `ndiffs()` measures the ordinary kind.

</details>

## Complete Example: Forecasting the Nile end to end

Let's put every step together on a fresh series. The built-in `Nile` series records the annual flow of the river from 1871 to 1970. We will plot the series, make it stationary, fit and check a model, then forecast, reusing the full workflow you will apply to any series.

First, plot the raw data to get a feel for it.

```r title="Plot the Nile flow series"
autoplot(Nile) + ggtitle("Annual flow of the Nile, 1871 to 1970")
```

Next, ask how many differences it needs, then let `auto.arima()` build the model.

```r title="Find the differencing order for Nile"
ndiffs(Nile)
#> [1] 1
```

```r title="Fit and inspect the Nile model"
nile_fit <- auto.arima(Nile)
nile_fit
#> Series: Nile 
#> ARIMA(1,1,1) 
#> 
#> Coefficients:
#>          ar1      ma1
#>       0.2544  -0.8741
#> s.e.  0.1194   0.0605
#> 
#> sigma^2 = 20177:  log likelihood = -630.63
#> AIC=1267.25   AICc=1267.51   BIC=1275.04
```

R chose `ARIMA(1,1,1)`: one difference, one AR term, one MA term. Before trusting it, check the residuals.

```r title="Check the Nile model residuals"
checkresiduals(nile_fit)
#> 	Ljung-Box test
#> 
#> data:  Residuals from ARIMA(1,1,1)
#> Q* = 9.7056, df = 8, p-value = 0.2863
#> 
#> Model df: 2.   Total lags used: 10
```

The Ljung-Box p-value of 0.2863 is comfortably above 0.05, so the residuals pass as noise. Now forecast the next ten years and plot the result.

```r title="Forecast the next ten years of flow"
nile_fc <- forecast(nile_fit, h = 10)
nile_fc
#>      Point Forecast    Lo 80     Hi 80    Lo 95    Hi 95
#> 1971       816.1813 634.1427  998.2199 537.7773 1094.585
#> 1972       835.5596 640.8057 1030.3136 537.7091 1133.410
#> 1973       840.4889 641.5646 1039.4132 536.2604 1144.717
#> 1974       841.7428 640.0639 1043.4217 533.3015 1150.184
#> 1975       842.0617 637.9589 1046.1645 529.9134 1154.210
#> 1976       842.1429 635.7158 1048.5699 526.4399 1157.846
#> 1977       842.1635 633.4558 1050.8712 522.9727 1161.354
#> 1978       842.1687 631.2096 1053.1279 519.5345 1164.803
#> 1979       842.1701 628.9843 1055.3558 516.1306 1168.210
#> 1980       842.1704 626.7813 1057.5595 512.7613 1171.580
```

```r title="Visualize the Nile forecast"
autoplot(nile_fc)
```

The point forecasts settle near 842, which is sensible for a differenced series with no trend: once past the last observations, the best guess is a stable level, and the honest widening of the intervals shows how uncertainty grows over a ten-year horizon.

## Frequently Asked Questions

**What is the difference between ARIMA and ARMA?** ARMA models a stationary series directly with AR and MA terms. ARIMA adds the "I" step, differencing the series first so that trending, non-stationary data becomes stationary. In R, `ARIMA(p, 0, q)` is just an ARMA(p, q).

**Should I use auto.arima() or choose the order myself?** Start with `auto.arima()`; it is fast and reliable. Choose orders yourself when you have domain knowledge to test a specific structure, or when you want to compare a handful of candidates by AICc. Always validate whichever you pick with residual checks.

**What is a good AIC or AICc value?** There is no universal threshold; these numbers only mean something in comparison. Fit several models to the same series and prefer the one with the lowest AICc. Comparing AICc across different series is meaningless.

**My residuals fail the Ljung-Box test. What now?** A small p-value means leftover structure. Try adding an AR or MA term, check whether you need another difference, and for calendar data confirm you captured the seasonality. Re-run `checkresiduals()` until the p-value clears 0.05.

**Can ARIMA use other predictors like promotions or weather?** Yes. Pass extra regressors to the `xreg` argument of `Arima()` or `auto.arima()` to fit a regression model with ARIMA errors, sometimes called ARIMAX.

## Practice Exercises

These combine several ideas from the tutorial. Each starter block runs as-is so you can experiment; write your solution, then reveal ours to compare. The exercises use their own variable names so they will not clash with the code above.

### Exercise 1: Manual versus automatic on lh

Fit the `lh` series two ways, as a manual `ARIMA(1,0,0)` and with a thorough `auto.arima()`, then compare their AICc values. Which model does the search prefer, and by how much?

```r title="Your turn: two fits for lh"
# Fit lh as a manual AR(1) and with a thorough auto.arima, then compare AICc.
# Hint: use Arima(lh, order = c(1, 0, 0))$aicc and
#       auto.arima(lh, stepwise = FALSE, approximation = FALSE)$aicc

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Comparing the two lh fits"
cap_manual <- Arima(lh, order = c(1, 0, 0))
cap_auto <- auto.arima(lh, stepwise = FALSE, approximation = FALSE)
c(manual_AR1 = cap_manual$aicc, auto_search = cap_auto$aicc)
#>  manual_AR1 auto_search 
#>    65.30378    63.99079 
```

**Explanation:** The manual AR(1) scores 65.30, but the thorough search finds a better model at 63.99. That better model is an `ARIMA(0,0,2)`, a pure MA(2), which fits `lh` slightly better than the AR(1) does.

</details>

### Exercise 2: Read a forecast interval

Forecast the `lh` series eight periods ahead with `auto.arima()`, then report the 95 percent prediction interval (the Lo 95 and Hi 95 columns) of the FIRST forecast row.

```r title="Your turn: forecast lh eight steps"
# Forecast lh 8 periods ahead with auto.arima, then read the 95% interval
# (Lo 95 and Hi 95) of the first forecast row.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Eight-step forecast for lh"
forecast(auto.arima(lh), h = 8)
#>    Point Forecast    Lo 80    Hi 80    Lo 95    Hi 95
#> 49       2.692626 2.110858 3.274394 1.802889 3.582364
#> 50       2.573609 1.902834 3.244384 1.547747 3.599470
#> 51       2.505301 1.807689 3.202912 1.438396 3.572205
#> 52       2.466097 1.759869 3.172325 1.386014 3.546179
#> 53       2.443597 1.734553 3.152640 1.359208 3.527985
#> 54       2.430683 1.720715 3.140651 1.344880 3.516486
#> 55       2.423271 1.712999 3.133544 1.337003 3.509540
#> 56       2.419018 1.708645 3.129391 1.332596 3.505439
```

**Explanation:** The first row (period 49) has a point forecast near 2.69, with a 95 percent interval running from about 1.80 to 3.58. The interval widens in later rows as uncertainty grows.

</details>

### Exercise 3: A seasonal model from scratch

Fit a seasonal ARIMA to the monthly `USAccDeaths` series (accidental deaths in the US) with `auto.arima()`, identify its seasonal (P, D, Q)[12] part, then forecast the next 12 months.

```r title="Your turn: seasonal ARIMA for USAccDeaths"
# Fit a seasonal ARIMA to USAccDeaths with auto.arima, read the seasonal
# part in the second bracket, then forecast 12 months ahead.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Seasonal ARIMA on monthly accident deaths"
cap_season <- auto.arima(USAccDeaths)
cap_season
#> Series: USAccDeaths 
#> ARIMA(0,1,1)(0,1,1)[12] 
#> 
#> Coefficients:
#>           ma1     sma1
#>       -0.4303  -0.5528
#> s.e.   0.1228   0.1784
#> 
#> sigma^2 = 102860:  log likelihood = -425.44
#> AIC=856.88   AICc=857.32   BIC=863.11
```

```r title="Forecast twelve months of accident deaths"
forecast(cap_season, h = 12)
#>          Point Forecast     Lo 80     Hi 80    Lo 95     Hi 95
#> Jan 1979       8336.061  7924.712  8747.410 7706.957  8965.166
#> Feb 1979       7531.829  7058.464  8005.194 6807.880  8255.778
#> Mar 1979       8314.644  7786.496  8842.792 7506.911  9122.377
#> Apr 1979       8616.869  8039.109  9194.629 7733.261  9500.477
#> May 1979       9488.913  8865.476 10112.349 8535.449 10442.376
#> Jun 1979       9859.757  9193.770 10525.745 8841.218 10878.297
#> Jul 1979      10907.470 10201.492 11613.448 9827.770 11987.171
#> Aug 1979      10086.508  9342.686 10830.331 8948.930 11224.086
#> Sep 1979       9164.959  8385.127  9944.791 7972.309 10357.609
#> Oct 1979       9384.259  8570.009 10198.510 8138.971 10629.548
#> Nov 1979       8884.974  8037.702  9732.246 7589.183 10180.765
#> Dec 1979       9376.574  8497.519 10255.628 8032.176 10720.971
```

**Explanation:** The model is `ARIMA(0,1,1)(0,1,1)[12]`. The seasonal part `(0,1,1)[12]` takes one seasonal difference and adds one seasonal MA term (`sma1`), and the forecast faithfully repeats the summer peak and winter dip you would expect from accident data.

</details>

## Summary

ARIMA is three plain ideas combined, and reading an `ARIMA(p, d, q)` label is just naming each one. The workflow below is the same every time: understand the series, make it stationary, pick and fit a model, check it, then forecast.

![The end-to-end ARIMA modeling workflow](screenshots/ARIMA-in-R-workflow.webp)
*Figure 3: The end-to-end ARIMA modeling workflow, from plotting to forecasting.*

| Step | What it does | Key function |
|---|---|---|
| AR (p) | Learns from past values | `Arima(order = c(p, 0, 0))` |
| I (d) | Differences away the trend | `diff()`, `ndiffs()` |
| MA (q) | Learns from past errors | `Arima(order = c(0, 0, q))` |
| Choose orders | Reads the fingerprints | `ggtsdisplay()`, `Acf()`, `Pacf()` |
| Fit | Estimates the model | `Arima()`, `auto.arima()` |
| Check | Confirms residuals are noise | `checkresiduals()` |
| Forecast | Projects ahead with intervals | `forecast()` |

Keep these takeaways close:

- **AR uses past values, MA uses past errors, I differences away the trend.** The three orders p, d, q say how many of each.
- **Difference until stationary.** Use `ndiffs()` for the ordinary order and `nsdiffs()` for the seasonal one, rather than guessing.
- **Let auto.arima() do the search, then verify.** Add `stepwise = FALSE` for the final model, and never forecast before `checkresiduals()` clears.
- **Seasonal ARIMA is the same idea at the seasonal lag.** The (P, D, Q)[m] block handles calendar cycles automatically.

## References

1. Hyndman, R.J., & Athanasopoulos, G. - *Forecasting: Principles and Practice*, 3rd edition. Chapter 9: ARIMA models. [Link](https://otexts.com/fpp3/arima.html)
2. Hyndman, R.J., & Khandakar, Y. - "Automatic Time Series Forecasting: The forecast Package for R." *Journal of Statistical Software*, 27(3), 2008. [Link](https://www.jstatsoft.org/article/view/v027i03)
3. forecast package - `auto.arima()` reference. [Link](https://pkg.robjhyndman.com/forecast/reference/auto.arima.html)
4. forecast package - `Arima()` reference. [Link](https://pkg.robjhyndman.com/forecast/reference/Arima.html)
5. Box, G.E.P., Jenkins, G.M., Reinsel, G.C., & Ljung, G.M. - *Time Series Analysis: Forecasting and Control*, 5th edition. Wiley (2015).
6. R Core Team - *An Introduction to R*, Time Series section. [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html)

## Continue Learning

- [ACF and PACF in R](ACF-and-PACF-in-R.html) - go deeper on the autocorrelation plots you use to pick p and q.
- [Test Stationarity in R](Test-Stationarity-in-R.html) - the full set of unit-root and stationarity tests behind differencing.
- [ETS Models in R](ETS-Models-in-R.html) - exponential smoothing, the other major forecasting family and a natural comparison to ARIMA.
