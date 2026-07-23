---
title: "Forecasting Very Short (and Very Long) Time Series in R"
slug: "Forecasting-Short-Time-Series-in-R"
description: "Forecast very short and very long time series in R. Count model parameters, use Fourier terms for short seasonal data, and fit recent windows to long series."
keywords: "forecasting short time series, forecasting long time series in R, auto.arima short series, minimum observations for ARIMA, Fourier terms forecasting, forecast package R, ETS short series, recent window forecasting"
auto_link_terms: "forecasting short time series|short time series forecasting|forecasting long time series|very short time series|minimum observations for ARIMA|Fourier terms forecasting|dynamic harmonic regression|recent window forecasting|forecasting with limited data|number of parameters in ARIMA|forecasting few data points|auto.arima on short series"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-23"
curriculum_id: "TS2-11.5"
post_type: "C"
sidebar_section: "Time Series"
sidebar_title: "Short and Long Series"
sidebar_order: "61"
difficulty: "Intermediate"
---

<p class="lead">The length of a time series decides which forecasting methods are safe to use. Too few observations and you cannot estimate a model reliably. Too many and a single fixed model quietly averages over dynamics that have long since changed. This tutorial shows you how to handle both extremes in R.</p>

## Why does the length of a time series change how you forecast it?

Most forecasting tutorials hand you a tidy series with a couple of hundred observations and a clean seasonal pattern. Real projects are rarely that kind. Sometimes you have a brand-new product with twelve months of sales, and sometimes you have three decades of daily readings. The forecasting recipe is different at each extreme, and getting it wrong is a common, silent mistake.

Here is a reassuring fact to start with: you can forecast a series with only twelve points. Let's prove it. We load the forecast package, create a short series of monthly signups, and let R pick and fit a model automatically.

```r title="Forecast a very short series"
library(forecast)
signups <- ts(c(20, 24, 29, 33, 40, 46, 55, 61, 70, 78, 88, 97), start = 1)
forecast(auto.arima(signups), h = 3)
#>    Point Forecast    Lo 80    Hi 80    Lo 95    Hi 95
#> 13       106.7480 105.0023 108.4937 104.0783 109.4178
#> 14       115.9365 113.1394 118.7336 111.6587 120.2144
#> 15       125.5435 120.9829 130.1042 118.5686 132.5184
```

That worked. The `auto.arima()` function found a model, and `forecast()` produced three point forecasts (the "Point Forecast" column) plus 80% and 95% prediction intervals. The forecasts continue the upward trend, climbing from 97 to about 107 at the first step and on to 126 by the third. Twelve points were enough to see a trend and extend it.

So if twelve points can be forecast, what actually goes wrong at the extremes? Two different things, pulling in opposite directions.

![Series length points you to a forecasting strategy.](screenshots/Forecasting-Short-Time-Series-in-R-length-decision.webp)
*Figure 1: Series length points you to a forecasting strategy.*

With a very short series, the danger is on the supply side: there is not enough information to estimate anything complicated, so you must keep the model tiny. With a very long series, the danger is subtler: there is so much history that a single model has to fit patterns from long ago that no longer hold today.

[KEY INSIGHT]
**Series length is a two-sided constraint, not a "more is better" dial.** A short series limits how complex your model can be, while a long series tempts you into a model that fits the distant past better than the present. The rest of this tutorial gives you a concrete recipe for each side.

## How many observations do you need to fit a forecasting model?

Before we can talk about "too few" observations, we need to know what "few" means. The honest answer is refreshingly simple. You can only estimate a model when you have more data points than the number of quantities the model has to learn from the data.

$$n > k$$

Here $n$ is the number of observations and $k$ is the number of parameters the model estimates. Every parameter is a number the fitting procedure has to pin down, and each one needs data to support it. Let's see how many parameters our signups model actually used.

```r title="Fit a model and count its parameters"
fit_signups <- auto.arima(signups)
fit_signups
#> Series: signups 
#> ARIMA(1,2,0) 
#> Coefficients:
#>           ar1
#>       -0.7480
#> s.e.   0.1736
#> sigma^2 = 1.855:  log likelihood = -17.16
#> AIC=38.33   AICc=40.04   BIC=38.93
length(coef(fit_signups))
#> [1] 1
```

Read the second line of that output: `ARIMA(1,2,0)`. Those three numbers are the orders of the model. For a non-seasonal ARIMA written as $\text{ARIMA}(p,d,q)$, the number of estimated parameters is

$$k = p + q + P + Q + (\text{1 if a constant, mean, or drift is included})$$

where $P$ and $Q$ are the seasonal orders (zero here, because this series has no season). The middle number, $d = 2$, is differencing: it transforms the data before fitting and costs no estimated parameters. So this model has $p = 1$ autoregressive term and nothing else, which is exactly the `[1] 1` that `length(coef())` reports. One parameter, twelve observations. Comfortably within budget.

![You need more observations than the parameters your model estimates.](screenshots/Forecasting-Short-Time-Series-in-R-params-vs-data.webp)
*Figure 2: You need more observations than the parameters your model estimates.*

You may have heard that ARIMA needs "at least 30 observations." That rule is a myth. It ignores both the number of parameters and how noisy the data is, and it has no basis in theory or practice. What happens instead is that the automatic search simply refuses to estimate parameters it cannot support. Watch what `auto.arima()` does with ten noisy points that have no clear trend.

```r title="A short noisy series collapses to its mean"
annual_sales <- ts(c(112, 118, 132, 129, 121, 135, 148, 148, 136, 119), start = 2015)
auto.arima(annual_sales)
#> Series: annual_sales 
#> ARIMA(0,0,0) with non-zero mean 
#> Coefficients:
#>           mean
#>       129.8000
#> s.e.    3.7197
#> sigma^2 = 153.7:  log likelihood = -38.84
#> AIC=81.68   AICc=83.39   BIC=82.28
```

The chosen model is `ARIMA(0,0,0) with non-zero mean`: no autoregression, no differencing, no moving average, just an estimate of the average level. With ten scattered points and no real signal, the safest forecast is the mean, which is exactly what the search returns. This is the myth-busting rule of thumb in action: the model gets as simple as the data demands.

[WARNING]
**Do not trust fixed minimum-sample rules like "30 for ARIMA."** The real requirement is only that observations outnumber parameters, and a trustworthy forecast usually needs comfortably more than that bare minimum. Let the model complexity follow the data instead of forcing a preset number.

**Try it:** Fit a model to the built-in `uspop` series (US population, 19 observations) with `auto.arima()`, then count its parameters. How few does it use?

```r title="Your turn: count the parameters"
# Fit auto.arima() to uspop, then count parameters with length(coef()).
# your code here
# Expected: a very small number, because uspop is smooth
```

<details>
<summary>Click to reveal solution</summary>

```r title="Parameter-count solution"
fit_pop <- auto.arima(uspop)
arimaorder(fit_pop)
#> p d q 
#> 0 2 0 
length(coef(fit_pop))
#> [1] 0
```

**Explanation:** The model is `ARIMA(0,2,0)`, a pure "second difference" random walk. It estimates zero coefficients: it simply projects the recent local trend forward. Even 19 smooth points need no estimated parameters, which is the shortest budget possible.

</details>

## How do you forecast a very short series?

When data is scarce, your best friends are the simplest possible models. A forecasting benchmark is a rock-bottom method you can always fall back on, and there are three you should know. The mean method forecasts every future value as the average of the past. The naive method forecasts the last observed value. The drift method extends the straight line drawn between the first and last observations.

Let's run all three on the signups trend and compare.

```r title="Compare simple benchmarks on the trend"
round(as.numeric(meanf(signups, h = 3)$mean), 1)   # mean method
#> [1] 53.4 53.4 53.4
round(as.numeric(naive(signups, h = 3)$mean), 1)   # naive method
#> [1] 97 97 97
round(as.numeric(rwf(signups, drift = TRUE, h = 3)$mean), 1)  # drift method
#> [1] 104 111 118
```

Look at how differently they behave. The mean method predicts a flat 53.4, which is nonsense for a series that has been climbing steadily. The naive method predicts a flat 97, the last value, ignoring the trend. Only the drift method captures the upward slope, forecasting 104, 111, then 118. And notice how close those drift numbers are to the automatic model's forecasts from earlier, which climbed from about 107 to 126. When a simple benchmark and a fancier model nearly agree, that agreement is a signal you can trust the result.

Benchmarks matter even more when you cannot hold out a test set. With a short series there simply are not enough points to split off a chunk for evaluation. The trick is a model-selection score called the AICc, which R prints in every model summary. You can think of the AICc as a stand-in for one-step out-of-sample error: it rewards a good fit while penalizing extra parameters, so a lower AICc points to a model that should forecast well without over-fitting. That is why `auto.arima()` and `ets()` lean on it to pick simple models when data is thin.

[TIP]
**Always sanity-check a short-series forecast against a benchmark.** If your model cannot beat the drift or naive method on the AICc or on a tiny holdout, prefer the benchmark. On short data the simple method is often not just safer but genuinely more accurate.

**Try it:** Produce a drift forecast for the noisy `annual_sales` series, three steps ahead. Because that series has no real trend, the drift forecast should barely move.

```r title="Your turn: a drift forecast"
# Use rwf() with drift = TRUE on annual_sales, h = 3.
# your code here
# Expected: three values very close to the last observation
```

<details>
<summary>Click to reveal solution</summary>

```r title="Drift forecast solution"
round(as.numeric(rwf(annual_sales, drift = TRUE, h = 3)$mean), 2)
#> [1] 119.78 120.56 121.33
```

**Explanation:** The average change across `annual_sales` is tiny, so the drift line is almost flat. The forecast nudges up by less than one unit per step, which is appropriate for a series with no clear direction.

</details>

## What if the short series is also seasonal?

Seasonality raises the stakes for short data, because a seasonal model is expensive. To learn a monthly pattern, a seasonal model has to estimate a separate behavior for each month, which spends roughly $m - 1$ parameters, where $m$ is the number of periods per cycle ($m = 12$ for monthly data). With only two years of monthly data, you barely have enough points to see each month twice, let alone estimate a full seasonal model on top of a trend.

Let's watch this happen. We take the first two years of the classic `AirPassengers` series, 24 monthly observations, and let `auto.arima()` decide.

```r title="A short seasonal series drops its seasonality"
air_short <- window(AirPassengers, end = c(1950, 12))
length(air_short)
#> [1] 24
fit_seas <- auto.arima(air_short)
fit_seas
#> Series: air_short 
#> ARIMA(0,0,2) with non-zero mean 
#> Coefficients:
#>          ma1     ma2      mean
#>       1.3624  0.6648  134.2280
#> s.e.  0.1990  0.2192    6.2751
#> sigma^2 = 126.2:  log likelihood = -91.65
#> AIC=191.3   AICc=193.4   BIC=196.01
```

Notice what is missing. The chosen model is `ARIMA(0,0,2)` with no seasonal part at all. The search decided that 24 points could not support a seasonal model, so it dropped seasonality entirely. That decision has consequences for the forecast.

```r title="The plain forecast goes flat"
round(forecast(fit_seas, h = 12)$mean, 1)
#>        Jan   Feb   Mar   Apr   May   Jun   Jul   Aug   Sep   Oct   Nov   Dec
#> 1951 160.2 148.9 134.2 134.2 134.2 134.2 134.2 134.2 134.2 134.2 134.2 134.2
```

The forecast wobbles for two months and then flatlines at 134.2, the series mean. A traveler could tell you air traffic peaks every summer, but this model has thrown that knowledge away. We need a cheaper way to represent the season.

That cheaper way is Fourier terms. Instead of estimating a separate value for every month, we approximate the seasonal shape with a few smooth sine and cosine waves. Each pair of waves is one "Fourier term" of order $K$, and $K$ pairs cost only $2K$ parameters. Choose a small $K$ and you capture the seasonal shape for a fraction of the parameter budget a full seasonal model would demand. We add these terms as an external regressor and turn the built-in seasonal search off.

```r title="Add Fourier terms to capture the season"
fit_fourier <- auto.arima(air_short, xreg = fourier(air_short, K = 1), seasonal = FALSE)
fit_fourier
#> Series: air_short 
#> Regression with ARIMA(0,0,1) errors 
#> Coefficients:
#>          ma1  intercept    S1-12     C1-12
#>       0.6822   133.7854  -8.1319  -13.2929
#> s.e.  0.1319     3.4673   4.8085    4.6791
#> sigma^2 = 126.1:  log likelihood = -90.22
#> AIC=190.44   AICc=193.78   BIC=196.33
```

The model is now a regression with ARIMA errors. The `S1-12` and `C1-12` coefficients are the sine and cosine of the first Fourier pair, and they encode the seasonal shape using just two numbers. Now forecast with matching Fourier terms for the next twelve months.

```r title="Forecast with the Fourier model"
fc_fourier <- forecast(fit_fourier, xreg = fourier(air_short, K = 1, h = 12))
round(fc_fourier$mean, 1)
#>        Jan   Feb   Mar   Apr   May   Jun   Jul   Aug   Sep   Oct   Nov   Dec
#> 1951 135.4 120.1 125.7 133.4 141.2 147.1 149.4 147.5 141.9 134.2 126.3 120.5
```

This forecast follows the season. It dips in the winter months, rises to a summer peak around July at 149.4, and falls again toward year end, the seasonal pattern the earlier flat forecast could not represent. We recovered the season with only two extra parameters instead of eleven.

[NOTE]
**Pick K by comparing the AICc across a few values.** Start at K = 1 and try K = 2, K = 3, and so on, keeping the value of K with the lowest AICc. K must stay at or below half the seasonal period, and for short series the best K is almost always small.

**Try it:** Build Fourier terms of order `K = 2` for `air_short` and look at the first three rows. You should see four columns, two sine-cosine pairs.

```r title="Your turn: build K=2 Fourier terms"
# Call fourier() on air_short with K = 2 and pass it to head(..., 3).
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Fourier terms solution"
head(fourier(air_short, K = 2), 3)
#>          S1-12     C1-12     S2-12 C2-12
#> [1,] 0.5000000 0.8660254 0.8660254   0.5
#> [2,] 0.8660254 0.5000000 0.8660254  -0.5
#> [3,] 1.0000000 0.0000000 0.0000000  -1.0
```

**Explanation:** With `K = 2` you get four columns: the first sine-cosine pair (`S1-12`, `C1-12`) and a second, faster pair (`S2-12`, `C2-12`). More pairs let the seasonal curve bend more sharply, at the cost of two extra parameters each.

</details>

## Why do forecasts get worse when a series is very long?

Now flip to the other extreme. It seems obvious that more data should always help, and for short and medium series it usually does. But a long series hides a trap. Real data does not actually come from the neat model we fit to it. For a couple of hundred observations, the model is a fine approximation. Stretch to thousands of points spanning many years, and the gap between the real process and the model becomes impossible to ignore, because the world that generated the early data is not the world that generated the recent data.

A single fixed model has to fit the entire history at once. If the trend was steep for decades and then flattened, the model splits the difference and gets the present wrong. Let's manufacture exactly that situation: 480 observations that climb steadily and then level off near the end, and fit one model to all but the last two years.

```r title="A long series with a shifting trend"
set.seed(7)
n <- 480
slope <- ifelse(1:n <= 408, 0.5, 0.02)
long_y <- ts(100 + cumsum(slope) + rnorm(n, 0, 1.2))
train <- head(long_y, n - 24)
test  <- as.numeric(tail(long_y, 24))
fit_full <- auto.arima(train)
arimaorder(fit_full)
#> p d q 
#> 1 1 1 
```

We held out the final 24 points as `test` so we can grade the forecast honestly. The model fitted to the full history is an `ARIMA(1,1,1)`. Now compare its forecast to what really happened over that held-out window.

```r title="The full-history forecast overshoots"
fc_full <- forecast(fit_full, h = 24)
round(as.numeric(fc_full$mean)[c(1, 12, 24)], 1)  # forecast at steps 1, 12, 24
#> [1] 306.1 310.9 316.3
round(test[c(1, 12, 24)], 1)                       # what actually happened
#> [1] 303.6 305.0 305.4
```

The forecast keeps rising, reaching 316.3 by the end, while the actual series had already flattened and sat at 305.4. The model learned the long, steep climb that dominated most of its history and projected it forward, blind to the recent change in behavior. The extra decades of data actively hurt the forecast.

[KEY INSIGHT]
**On a very long series, a single fixed model fits the average of all eras, not the current one.** The more the underlying dynamics have shifted over time, the more a whole-history model overshoots or undershoots the near future. The fix is to stop forcing one model to explain the distant past and the present at once.

## How do you forecast a very long series?

The simplest fix follows directly from the diagnosis. If you only care about forecasting the next few points, throw away the ancient history and fit the model to a recent window. This is equivalent to letting the model change over time, and it is far easier to reason about. Let's refit the very same method to just the last 72 observations of the training data.

```r title="Fit the same method to a recent window"
recent <- ts(tail(train, 72))
fit_recent <- auto.arima(recent)
arimaorder(fit_recent)
#> p d q 
#> 2 1 0 
fc_recent <- forecast(fit_recent, h = 24)
```

Same function, same automatic search, just less history. Now let's grade both forecasts against the held-out `test` window using root mean squared error, where smaller is better.

```r title="Full history vs recent window"
rmse <- function(p, a) sqrt(mean((p - a)^2))
data.frame(
  strategy = c("Full history (456 obs)", "Recent window (72 obs)"),
  RMSE = round(c(rmse(as.numeric(fc_full$mean), test),
                 rmse(as.numeric(fc_recent$mean), test)), 2))
#>                 strategy RMSE
#> 1 Full history (456 obs) 6.57
#> 2 Recent window (72 obs) 2.36
```

The recent window nearly triples the accuracy, cutting the error from 6.57 to 2.36. By ignoring the era that no longer applies, the shorter fit matched the current, flatter behavior. This is the counterintuitive heart of long-series forecasting: sometimes the best thing to do with old data is to discard it.

There are gentler alternatives to a hard cutoff. Models that already adapt to local behavior, like exponential smoothing or a differenced ARIMA, put more weight on recent observations and cope better with slow change than a rigid regression would. And if the seasonality is long or complex, dynamic harmonic regression (an ARIMA model with Fourier terms) scales to it without exploding the parameter count.

[TIP]
**Fitting to a shorter window is also much faster.** The automatic model search scales poorly with length, so refitting on thousands of points repeatedly can be slow. A recent window cuts both the estimation bias from stale data and the computation time, a rare win on both fronts.

**Try it:** Fit `auto.arima()` to the last 120 observations of `train` and report the chosen model order with `arimaorder()`.

```r title="Your turn: report a window's model order"
# Fit auto.arima() to ts(tail(train, 120)) and pass the fit to arimaorder().
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Window model-order solution"
arimaorder(auto.arima(ts(tail(train, 120))))
#> p d q 
#> 0 2 2 
```

**Explanation:** A different window can lead the automatic search to a different model, here an `ARIMA(0,2,2)`. That is expected: each window sees a slightly different slice of behavior, which is exactly why the window size is a choice worth testing rather than fixing blindly.

</details>

## Complete Example: a length-aware forecasting workflow

Let's tie the whole tutorial into one reusable helper. Given any time series, it reports how much data you have, whether it is seasonal, and which strategy to reach for first. Think of it as a triage step you run before modeling.

```r title="A helper that flags series length"
diagnose_series <- function(y) {
  n <- length(y); m <- frequency(y)
  cat("n =", n, "| m =", m, "->  ")
  if (m > 1 && n < 3 * m) {
    cat("SHORT & seasonal: use Fourier terms with a small K.\n")
  } else if (n < 24) {
    cat("SHORT: prefer simple or benchmark models; confirm against a naive forecast.\n")
  } else if (n > 400) {
    cat("LONG: also fit a recent window; the dynamics may have shifted.\n")
  } else {
    cat("TYPICAL: standard auto.arima() or ets() is fine.\n")
  }
}
```

Now run it across the four series we have met, from the twelve-point trend to the 480-point simulation.

```r title="Run the helper on four series"
diagnose_series(signups)
diagnose_series(air_short)
diagnose_series(AirPassengers)
diagnose_series(long_y)
#> n = 12 | m = 1 ->  SHORT: prefer simple or benchmark models; confirm against a naive forecast.
#> n = 24 | m = 12 ->  SHORT & seasonal: use Fourier terms with a small K.
#> n = 144 | m = 12 ->  TYPICAL: standard auto.arima() or ets() is fine.
#> n = 480 | m = 1 ->  LONG: also fit a recent window; the dynamics may have shifted.
```

Each series lands in the right bucket. The thresholds here (fewer than 24 points, or fewer than three full seasonal cycles, or more than 400 points) are deliberately rough. They are a starting point for the decision, not a law. The one non-negotiable rule, which the myth of "30 observations" ignored, is to confirm your choice out-of-sample whenever you possibly can.

## Practice Exercises

These combine several ideas from the tutorial. Try each one before opening the solution.

### Exercise 1: Trust-check a short forecast with a benchmark

Forecast the `signups` series four steps ahead two ways: once with `auto.arima()` and once with the drift method. Put the two forecasts side by side in a data frame so you can see whether they agree. Close agreement is your evidence that the automatic model is trustworthy on this short series.

```r title="Exercise 1 starter"
# Forecast signups h = 4 with auto.arima() and with rwf(drift = TRUE).
# Build a data.frame with columns: step, auto_arima, drift.
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
h_ahead <- 4
auto_fc  <- forecast(auto.arima(signups), h = h_ahead)$mean
drift_fc <- rwf(signups, drift = TRUE, h = h_ahead)$mean
data.frame(step = 1:h_ahead,
           auto_arima = round(as.numeric(auto_fc), 1),
           drift      = round(as.numeric(drift_fc), 1))
#>   step auto_arima drift
#> 1    1      106.7   104
#> 2    2      115.9   111
#> 3    3      125.5   118
#> 4    4      134.8   125
```

**Explanation:** The automatic model and the drift benchmark track each other closely, drifting apart by only a handful of units at the four-step horizon. When a bare-bones benchmark shadows your model this tightly, you can forecast the short series with confidence.

</details>

### Exercise 2: Find a good window for the long series

For the long series, the full history was a poor teacher. Write a function that fits `auto.arima()` to the last `k` observations of `train`, forecasts 24 steps, and returns the RMSE against `test`. Run it for windows of 48, 72, 120 and 240, then compare. Is the shortest window always best?

```r title="Exercise 2 starter"
# Write window_rmse(k): fit auto.arima on the last k obs of train,
# forecast h = 24, and return rmse() vs test.
# Then compare k = 48, 72, 120, 240 in a data.frame.
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
window_rmse <- function(k) {
  fit <- auto.arima(ts(tail(train, k)))
  rmse(as.numeric(forecast(fit, h = 24)$mean), test)
}
sizes <- c(48, 72, 120, 240)
data.frame(window = sizes, RMSE = round(sapply(sizes, window_rmse), 2))
#>   window RMSE
#> 1     48 1.15
#> 2     72 2.36
#> 3    120 0.97
#> 4    240 1.02
```

**Explanation:** Every recent window beats the full-history RMSE of 6.57, which confirms the core lesson. But the best window here is 120, not the shortest, and the numbers are not perfectly ordered. Window size is a genuine tuning knob: test a few, do not assume smaller is automatically better.

</details>

## Frequently Asked Questions

### Is 30 the minimum number of observations for an ARIMA model?

No. There is no theoretical or practical basis for the "30 observations" rule. The only firm requirement is that you have more observations than parameters, and the automatic search will pick a model simple enough to satisfy that. In practice you want comfortably more than the bare minimum, but the exact number depends on how noisy your series is, not on a magic constant.

### What is the absolute fewest points I can forecast?

You can produce a forecast from a handful of points, because benchmarks like the naive and drift methods estimate zero or one parameter. Whether that forecast is any good is a separate question. With very few points, prefer a benchmark and treat the forecast as a rough guide rather than a precise prediction.

### Why did auto.arima() ignore the seasonality in my data?

Because your series was probably too short to support a seasonal model. A seasonal model needs to see each season repeated several times, spending about $m - 1$ parameters on the pattern. When there are not enough cycles, the search drops the seasonal part. Add Fourier terms with a small `K` to represent the season cheaply instead.

### Should I always forecast a long series from its most recent window?

Not blindly. A recent window helps when the dynamics have shifted over time, which is common for long real-world series. If the process has genuinely been stable for decades, the full history can help. The safe move is to test both against a held-out window and let accuracy decide, as Exercise 2 shows.

### Does adding more historical data always improve a forecast?

No. More data helps up to a point, then can hurt if the older data was generated by a different regime. A single model fitted to a very long series averages across all those regimes and may forecast the present poorly. Beyond a few hundred observations, check whether a recent window or an adaptive model does better.

## Summary

The length of your series is the first thing to check before you forecast, because it dictates what is even possible. Short series force simplicity; long series reward forgetting.

![The short-versus-long decisions at a glance.](screenshots/Forecasting-Short-Time-Series-in-R-overview.webp)
*Figure 3: The short-versus-long decisions at a glance.*

| Situation | The risk | What to do in R |
|---|---|---|
| Very short, non-seasonal | Too few points to estimate anything complex | Let `auto.arima()` or `ets()` pick a low-parameter model; compare to `naive()` and `rwf(drift = TRUE)` |
| Very short, seasonal | A seasonal model spends too many parameters | Add `fourier()` terms with a small `K` and set `seasonal = FALSE` |
| Typical length | Few special concerns | Standard `auto.arima()` or `ets()` |
| Very long | One model averages over changed dynamics | Fit a recent window, or use adaptive models; validate window size out-of-sample |

The single rule that survives every case is the one the "30 observations" myth forgot: keep your model no more complex than your data can support, and confirm the choice out-of-sample whenever you can.

## References

1. Hyndman, R.J. - *Fitting models to short time series*. [Link](https://robjhyndman.com/hyndsight/short-time-series/)
2. Hyndman, R.J. - *Fitting models to long time series*. [Link](https://robjhyndman.com/hyndsight/long-time-series/)
3. Hyndman, R.J. & Athanasopoulos, G. - *Forecasting: Principles and Practice*, Section 12.7: Very long and very short time series. [Link](https://otexts.com/fpp2/long-short-ts.html)
4. Hyndman, R.J. & Athanasopoulos, G. - *Forecasting: Principles and Practice* (3rd ed.), Dynamic harmonic regression. [Link](https://otexts.com/fpp3/dhr.html)
5. Hyndman, R.J. & Khandakar, Y. - *Automatic Time Series Forecasting: The forecast Package for R*. Journal of Statistical Software (2008). [Link](https://www.jstatsoft.org/article/view/v027i03)
6. forecast package reference - `fourier()`. [Link](https://pkg.robjhyndman.com/forecast/reference/fourier.html)
7. Hyndman, R.J. & Athanasopoulos, G. - *Forecasting: Principles and Practice* (3rd ed.), full text. [Link](https://otexts.com/fpp3/)

## Continue Learning

- [auto.arima() in R](auto-arima-in-R.html) - how the automatic search chooses ARIMA orders, the engine behind most of this tutorial.
- [Forecast Accuracy in R](Forecast-Accuracy-in-R.html) - RMSE, MAE, and how to score forecasts properly on a holdout.
- [ETS Models in R](ETS-Models-in-R.html) - exponential smoothing, the adaptive model family that copes well with slowly changing long series.
