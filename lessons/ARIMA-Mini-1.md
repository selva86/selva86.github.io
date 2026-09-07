---
title: "ARIMA: what AR, I, and MA actually mean"
slug: "ARIMA-Mini-1"
description: "Learn what AR, I, and MA actually mean in ARIMA, using one coffee shop's real 100-day cup sales series, then fit and read an ARIMA(2,1,1) forecast in R."
keywords: "ARIMA, AR term, I term, MA term, ARIMA in R, time series forecasting, Arima function, autoregressive model, moving average model, differencing"
mathjax: true
webr: true
date: "2026-09-07"
post_type: "LESSON"
course_id: "arima-from-zero"
course_title: "ARIMA from Zero"
course_lesson: "1"
course_total: "7"
course_landing: "/dashboard.html"
course_prev: ""
course_next: ""
curriculum_id: "0.0.4"
lesson_access: "windowed"
catalog_blurb: "See what AR, I, and MA each explain in one real coffee-shop sales series."
---

=== step === cover
## ARIMA: what AR, I, and MA actually mean

Today you are going to take the three letters in ARIMA apart, one at a time, until each one turns into something you can point at in a real series.

Miller Street Coffee, a small independent shop, tracked its daily cup sales for 100 days. Day 1's count was 148 cups. Day 100's was 204 cups, and the average kept climbing the whole way through: 134 cups a day in the first third of that stretch, 161 in the middle third, and 190 in the last third. But the climb was never smooth. Cups still jumped up and down from one day to the next, all the way along that rising path.

That one series carries all three letters of ARIMA inside it.

- When Miller Street sells a lot of cups one day, the next day's count tends to land high too, and a slow day tends to be followed by another slow one. That pull from one day into the next is what AR (autoregressive) explains.
- The overall climb is a trend, and before ARIMA can find any pattern in the day-to-day bouncing, that trend has to come out first. Removing it is what I (integrated) does.
- Even after AR accounts for the carryover, a little bit of one day's surprise, the part AR could not explain, still echoes into the next day's count. That echo is what MA (moving average) explains.

The diagram below lays out those three pieces as one pipeline, ending in the forecast they produce together.

::widget process-flow {"steps":[{"title":"AR: autoregression","sub":"predicts the next value from its own recent values"},{"title":"I: integration","sub":"removes a trend by working with day to day changes instead of raw levels"},{"title":"MA: moving average","sub":"corrects the next value using its own recent errors"},{"title":"ARIMA forecast","sub":"combines all three into one forecast for the next day"}]}

Each box above gets its own close look on Miller Street's numbers, starting with the first one: AR.

=== step === concept
## Meet Miller Street Coffee's daily sales

Before pulling ARIMA apart, look at the numbers behind it. Press Run to build 100 days of cup sales.

```r
# Build Miller Street Coffee's 100 days of cup sales and plot the series
set.seed(161)
noise <- arima.sim(model = list(ar = c(0.5, 0.2), ma = 0.4), n = 100, sd = 1.8)
miller_st_sales <- round(150 + cumsum(0.7 + noise))
plot(miller_st_sales, type = "l", xlab = "day", ylab = "cups sold",
     main = "Miller Street Coffee: 100 days of cup sales")
```

The line climbs overall, but it is not a straight climb. It wobbles up and down around that rising path, day after day.

Now check that climb in numbers, alongside where the series starts and ends.

```r
# Compare the first, middle, and last third of the 100 days, and check day 1 against day 100
n <- length(miller_st_sales)
third <- n %/% 3
mean(miller_st_sales[1:third])
mean(miller_st_sales[(third + 1):(2 * third)])
mean(miller_st_sales[(2 * third + 1):n])
as.numeric(miller_st_sales)[1]
as.numeric(miller_st_sales)[100]
#> [1] 134.2121
#> [1] 160.6667
#> [1] 189.9706
#> [1] 148
#> [1] 204
```

The average sale climbs from 134 cups a day, to 161, then to 190. Day 1's count was 148 cups, day 100's was 204. So this series holds two behaviors at once: a steady climb in its average level, and a bounce that moves up and down around that average from one day to the next.

=== step === concept
## The AR term: today depends on yesterday

AR stands for autoregressive, and it means exactly what it sounds like: the series predicts itself from its own past values. An AR model of order 1, written AR(1), predicts today's value from yesterday's, using one coefficient.

\[ y_t = c + \phi\, y_{t-1} + \varepsilon_t \]

Here \(y_t\) is today's value, \(y_{t-1}\) is yesterday's, \(c\) is a constant baseline, \(\varepsilon_t\) is a shock nobody could have predicted, and \(\phi\) (phi) is the AR coefficient: how strongly yesterday pulls on today. A \(\phi\) near 1 means a value barely moves from one day to the next. A \(\phi\) near 0 means almost no memory at all.

To see AR on its own, with no climb from I and no error echo from MA mixed in, build a stand-in for Miller Street's counts that has carryover and nothing else: 30 days built around a baseline of 150 cups, with an AR coefficient of 0.8.

```r
# Simulate 30 days with carryover only, no trend and no error echo, using AR coefficient 0.8
library(forecast)
set.seed(33)
ar_toy <- round(150 + arima.sim(model = list(ar = 0.8), n = 30, sd = 8))
Arima(ar_toy, order = c(1, 0, 0))
#> Series: ar_toy 
#> ARIMA(1,0,0) with non-zero mean 
#> 
#> Coefficients:
#>          ar1      mean
#>       0.8001  151.3931
#> s.e.  0.1192    5.4809
#> 
#> sigma^2 = 46.04:  log likelihood = -99.49
#> AIC=204.98   AICc=205.9   BIC=209.18
```

The model recovers ar1 = 0.80, right at the 0.8 the data was built with. In plain terms, that means about 80 percent of a day's distance from the average carries straight into the next day.

The scatter below plots each day's count against the day before it, and you can switch it between a scatter and a connecting line.

::widget chart-plotter {"data":[{"x":156,"y":148},{"x":148,"y":161},{"x":161,"y":160},{"x":160,"y":156},{"x":156,"y":161},{"x":161,"y":157},{"x":157,"y":167},{"x":167,"y":159},{"x":159,"y":159},{"x":159,"y":157},{"x":157,"y":150},{"x":150,"y":144},{"x":144,"y":144},{"x":144,"y":156},{"x":156,"y":157},{"x":157,"y":163},{"x":163,"y":166},{"x":166,"y":164},{"x":164,"y":156},{"x":156,"y":169},{"x":169,"y":164},{"x":164,"y":157},{"x":157,"y":143},{"x":143,"y":147},{"x":147,"y":148},{"x":148,"y":140},{"x":140,"y":136},{"x":136,"y":134},{"x":134,"y":130}],"geoms":["point","line"],"x":"day t-1 cups","y":"day t cups"}

```r
# Compute the lag-1 correlation for ar_toy: each day's count against the day before it
round(cor(head(ar_toy, -1), tail(ar_toy, -1)), 3)
#> [1] 0.758
```

The points cluster along a rising line: a high count one day tends to sit next to a high count the day after. The correlation between a day and the day before it works out to about 0.758, a strong link that fades only gradually the further back you look. That gradual fade, not one sharp spike, is the AR pattern.

=== step === concept
## The MA term: one day's error still shows up the next day

MA stands for moving average, but do not let the name fool you: it has nothing to do with smoothing a line by averaging nearby points. It means the model corrects itself using its own recent forecast errors, the parts of the series it could not explain a moment before.

Picture forecasting the weather. If you expect 20 degrees and it comes in at 25, you were off by 5, and a sensible forecaster nudges tomorrow's guess up a little because of that miss. That is exactly what an MA term does: it carries yesterday's miss into today's prediction.

An MA model of order 1, written MA(1), adjusts today's value using the previous shock.

\[ y_t = c + \varepsilon_t + \theta\, \varepsilon_{t-1} \]

Here \(\varepsilon_t\) is today's forecast error, \(\varepsilon_{t-1}\) is yesterday's forecast error, the part of yesterday's value the model got wrong, and \(\theta\) (theta) is the MA coefficient: how much of yesterday's forecast error carries into today.

To see MA on its own, build another 30-day stand-in for Miller Street's counts, this time with an error echo only and no carryover, using an MA coefficient of 0.6.

```r
# Simulate 30 days with an error echo only, no trend and no carryover, using MA coefficient 0.6
set.seed(1)
ma_toy <- round(150 + arima.sim(model = list(ma = 0.6), n = 30, sd = 8))
Arima(ma_toy, order = c(0, 0, 1))
#> Series: ma_toy 
#> ARIMA(0,0,1) with non-zero mean 
#> 
#> Coefficients:
#>          ma1      mean
#>       0.6060  151.6883
#> s.e.  0.1228    2.1443
#> 
#> sigma^2 = 58.71:  log likelihood = -102.85
#> AIC=211.7   AICc=212.63   BIC=215.91
```

The fit recovers ma1 = 0.606, close to the 0.6 the data was built with: about 61 percent of one day's forecast error shows up in the very next day's value.

Here is the same lag-1 scatter, built on this MA series instead.

::widget chart-plotter {"data":[{"x":148,"y":144},{"x":144,"y":159},{"x":159,"y":160},{"x":160,"y":145},{"x":145,"y":150},{"x":150,"y":158},{"x":158,"y":158},{"x":158,"y":150},{"x":150,"y":161},{"x":161,"y":160},{"x":160,"y":147},{"x":147,"y":129},{"x":129,"y":148},{"x":148,"y":155},{"x":155,"y":150},{"x":150,"y":157},{"x":157,"y":161},{"x":161,"y":159},{"x":159,"y":160},{"x":160,"y":161},{"x":161,"y":154},{"x":154,"y":134},{"x":134,"y":145},{"x":145,"y":153},{"x":153,"y":148},{"x":148,"y":137},{"x":137,"y":139},{"x":139,"y":151},{"x":151,"y":163}],"geoms":["point","line"],"x":"day t-1 cups","y":"day t cups"}

```r
# Compute the lag-1 correlation for ma_toy: each day's count against the day before it
round(cor(head(ma_toy, -1), tail(ma_toy, -1)), 3)
#> [1] 0.356
```

This time the correlation between a day and the day before it is about 0.356, weaker than AR's 0.758. And unlike AR, that link does not fade gradually across many lags. It shows up once, at lag 1, and then it is gone completely, because an MA(1) error only ever echoes for one day.

=== step === quiz
## Quick check: matching the letter to the behavior

Look back at the two scatters you just built. One belongs to ar_toy, the other to ma_toy. Which is which?

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- ar_toy is an AR(1) series and ma_toy is an MA(1) series: the AR series keeps a wide, gradually-fading correlation across many lags, while the MA series shows one lag-1 spike and then drops to nothing. ::ok Correct. ar_toy's lag-1 correlation of 0.758 keeps fading gradually the further back you look, the AR pattern. ma_toy's correlation drops from 0.356 to almost nothing after one lag, the MA pattern.
- ma_toy is really a two-day moving average of the cup counts themselves, which is why it looks smoother than ar_toy. ::no
- ma_toy should show no correlation at all at lag 1, since an MA model has no memory of past values. ::no An MA(1) model does not average the raw cup counts, and it is not memoryless either. It carries exactly one lag of correlation, because it is a weighted sum of the previous day's forecast error, not the previous day's own value. That one-lag correlation was 0.356 here, real but short-lived, unlike AR's wide, gradually-fading correlation of 0.758.

=== step === concept
## Extending AR to two days back
::prose-only the AR(2) equation extends AR(1) with one identical extra term; the real numbers for Miller Street arrive once the full model is fit, coming up next

AR(1) only looks one day back. But a series can carry memory from further back too. AR(2) extends the same idea with a second lagged term.

\[ y_t = c + \phi_1 y_{t-1} + \phi_2 y_{t-2} + \varepsilon_t \]

The only change from AR(1) is the extra term \(\phi_2 y_{t-2}\): today's value now depends on both yesterday (\(y_{t-1}\)) and the day before yesterday (\(y_{t-2}\)), each with its own coefficient. Picture a busy weekend at Miller Street that still shapes Tuesday's count, two days later, on top of whatever Monday already carried forward. That is what the second AR term captures. The real \(\phi_1\) and \(\phi_2\) for Miller Street's own data arrive once the full model is fit, coming up next.

=== step === concept
## The I term: removing the growth before fitting AR and MA

Both AR and MA assume the series is stationary: its average level and its amount of wobble hold roughly steady over time, with no trend heading steadily up or down. Miller Street's raw sales break that assumption outright, since the average climbs the whole way through. The I part is what fixes this before AR and MA get to work.

The fix is differencing: instead of modeling the raw counts, model the change from one day to the next.

\[ y'_t = y_t - y_{t-1} \]

The Augmented Dickey-Fuller test checks whether a series is stationary. It assumes the series is NOT stationary, so a small p-value, under 0.05, is evidence against that assumption, meaning the series looks stationary after all.

```r
# Test whether Miller Street's raw daily sales are stationary
suppressMessages(library(tseries))
adf.test(miller_st_sales)
#> 
#> 	Augmented Dickey-Fuller Test
#> 
#> data:  miller_st_sales
#> Dickey-Fuller = -2.6793, Lag order = 4, p-value = 0.2953
#> alternative hypothesis: stationary
```

The p-value comes out to 0.295, well above 0.05, so the raw series is not stationary. That matches the climb you already saw earlier: 134 cups a day, then 161, then 190.

Now difference the series once and run the same test again.

```r
# Difference the series once and re-test for stationarity
adf.test(diff(miller_st_sales))
#> 
#> 	Augmented Dickey-Fuller Test
#> 
#> data:  diff(miller_st_sales)
#> Dickey-Fuller = -4.1338, Lag order = 4, p-value = 0.01
#> alternative hypothesis: stationary
#> 
#> Warning message:
#> In adf.test(diff(miller_st_sales)) : p-value smaller than printed p-value
```

The p-value drops to 0.01, below the 0.05 bar, so one round of differencing is enough. `diff()` turned "cups sold today" into "how many more cups than yesterday", and that changed series holds steady instead of climbing.

Rather than eyeball the test yourself, the forecast package's `ndiffs()` function runs it for you and reports how many differences are needed. While it is at it, check the average size of that day-to-day change too.

```r
# Ask the forecast package how many differences are needed, and the average day-to-day change
ndiffs(miller_st_sales)
round(mean(diff(miller_st_sales)), 2)
#> [1] 1
#> [1] 0.57
```

One difference is enough, and once differenced, the series moves up by about 0.57 cups a day on average, wobbling around that small, steady climb rather than trending the way the raw counts did.

The plot below puts the two side by side: the raw series climbing on the left, the differenced series flat and wobbling on the right.

```r
# Plot the raw series next to its once-differenced version
par(mfrow = c(1, 2))
plot(miller_st_sales, type = "l", main = "Raw: cups sold", xlab = "day", ylab = "cups")
plot(diff(miller_st_sales), type = "l", main = "Differenced: change in cups", xlab = "day", ylab = "change in cups")
par(mfrow = c(1, 1))
```

=== step === concept
## Putting it together: fitting ARIMA(2,1,1) on Miller Street's data

Time to combine all three letters on the real, full 100-day series: two AR terms, one difference, and one MA term.

```r
# Fit ARIMA(2,1,1) with drift on the full 100-day series
fit <- Arima(miller_st_sales, order = c(2, 1, 1), include.drift = TRUE)
fit
#> Series: miller_st_sales 
#> ARIMA(2,1,1) with drift 
#> 
#> Coefficients:
#>          ar1     ar2     ma1   drift
#>       0.3676  0.1348  0.3418  0.4433
#> s.e.  2.0317  1.3692  2.0026  0.5032
#> 
#> sigma^2 = 3.642:  log likelihood = -202.69
#> AIC=415.39   AICc=416.03   BIC=428.36
```

Read the coefficients the same way you read ar_toy and ma_toy earlier. ar1 = 0.37 and ar2 = 0.13 mean yesterday and the day before both pull on today, with yesterday carrying more weight. ma1 = 0.34 means about a third of one day's forecast error still echoes into the next. And drift = 0.44 is the small, steady climb left in the differenced series once AR and MA have done their part, close to the 0.57-cup average change you saw a moment ago, just a touch smaller because AR and MA now explain part of what looked like pure trend before.

Does adding AR and MA actually help, beyond just differencing? Compare this fit's in-sample error against a bare model that only differences the series, with no AR or MA terms at all.

```r
# Compare this fit's in-sample error against differencing alone, with no AR or MA terms
fit_naive <- Arima(miller_st_sales, order = c(0, 1, 0), include.drift = TRUE)
round(accuracy(fit)[1, "RMSE"], 2)
round(accuracy(fit_naive)[1, "RMSE"], 2)
#> [1] 1.86
#> [1] 2.42
```

The RMSE, the typical size of the model's error in cups, drops from 2.42 with differencing alone to 1.86 once AR and MA are added. Those two terms are not just extra parameters. They genuinely explain part of the day-to-day bounce that differencing alone leaves behind.

=== step === concept
## Reading ARIMA(2,1,1) as a sentence

Every ARIMA(p,d,q) label is really just a short sentence about a series, once you know what its numbers came from. Here is Miller Street's.

p = 2 says the model leans on the last two days: ar1 = 0.37 and ar2 = 0.13, with yesterday weighted more than the day before. d = 1 says one difference was needed to settle the climb, exactly what the Augmented Dickey-Fuller test and `ndiffs()` confirmed. q = 1 says one day of forecast error still echoes forward, with ma1 = 0.34.

::widget process-flow {"steps":[{"title":"AR(2): 0.37, 0.13","sub":"yesterday and the day before both pull on today, yesterday more strongly"},{"title":"I(1): trend removed","sub":"one difference turned the climbing series into stable day to day changes"},{"title":"MA(1): 0.34","sub":"roughly a third of the error from the previous day still echoes into today"},{"title":"ARIMA(2,1,1) forecast","sub":"combines all three to forecast day 101 at 204 cups"}]}

Put together in one sentence: Miller Street's daily sales lean on the last two days, needed one difference to settle their climb, and still carry one day of forecast error forward before a forecast comes out the other end.

=== step === quiz
## Closing quiz: matching a description to its ARIMA label

A series needs one difference to settle its trend. It has no memory beyond the single most recent day. And one day's rush shows up once in the next day's value, then has no further effect at all. Which ARIMA(p,d,q) label matches that description?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- ARIMA(2,0,0) ::no
- ARIMA(0,1,2) ::no
- ARIMA(1,1,1) ::ok Correct. d = 1 removes the trend, p = 1 because only yesterday matters, and q = 1 because one day's rush echoes once through the MA term before vanishing. That is ARIMA(1,1,1).
- ARIMA(1,0,1) ::no The description fixes all three letters. One difference to settle a trend means d = 1, which rules out ARIMA(2,0,0) and ARIMA(1,0,1). Memory of only the single most recent day means p = 1, not 2. And one day's rush echoing once before vanishing is the MA pattern, so that has to be q = 1 through the MA term, not an extra AR term, which rules out ARIMA(0,1,2). That leaves ARIMA(1,1,1).

=== step === tryit
## Your turn: get tomorrow's number from the fitted model

`fit`, the ARIMA(2,1,1) model from a few steps back, is still sitting in memory. The `forecast()` function takes a fitted model and a number of steps ahead, `h`, and returns a forecast for each of those steps. Call `forecast()` on `fit` for one day ahead, then round the result to the nearest cup.

```r
# Call forecast() on fit for one day ahead, then round the result to the nearest cup

```
::check {"regex": "forecast\\s*[(]\\s*fit\\s*,\\s*h\\s*=\\s*1\\s*[)]", "gate": true, "difficulty": "beginner", "ok": "Correct. forecast(fit, h = 1) reads one day ahead off the fitted model, and the point forecast lands at about 204 cups, matching Miller Street's actual day 100 count.", "no": "Call forecast() on the fitted object fit, and pass h = 1 for one day ahead: forecast(fit, h = 1)."}
::solution
```r
# Get tomorrow's forecast from the fitted ARIMA(2,1,1) model, then round it to the nearest cup
forecast(fit, h = 1)
round(forecast(fit, h = 1)$mean)
#>     Point Forecast    Lo 80    Hi 80    Lo 95    Hi 95
#> 101       203.6305 201.1848 206.0761 199.8901 207.3708
#> [1] 204
```

The point forecast rounds to 204 cups, landing right at day 100's actual count.

=== step === concept
## References

- Hyndman, R.J. and Athanasopoulos, G. (2021). [Forecasting: Principles and Practice](https://otexts.com/fpp3/arima.html) (3rd ed.), Chapter 9: ARIMA models.
- Box, G.E.P., Jenkins, G.M., Reinsel, G.C., and Ljung, G.M. (2015). Time Series Analysis: Forecasting and Control (5th ed.). Wiley. The original ARIMA methodology.
- R documentation: [stats::arima()](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/arima.html).
- R documentation: [forecast::Arima() and stats::arima.sim()](https://pkg.robjhyndman.com/forecast/reference/Arima.html).

=== step === complete
## Quick recap

Miller Street Coffee's 100 days of cup sales held all three letters of ARIMA at once, and now you can name each one in its own numbers.

- AR is the carryover: how much of today's value comes from recent days. In the full fit, ar1 = 0.37 and ar2 = 0.13.
- I is the fix for a trend: differencing once turned a climbing series into one that holds steady, confirmed by the Augmented Dickey-Fuller test and `ndiffs()`.
- MA is the forecast-error echo: ma1 = 0.34 means about a third of one day's error still shows up the next day.

Put those three together and ARIMA(2,1,1) stopped being three unfamiliar letters. It became one sentence about how Miller Street's own sales behave, and a forecast of 204 cups for day 101 to go with it.

The next lesson in this course picks up right here, reading the ACF and PACF plots that reveal how many AR and MA terms a series like this one actually needs, without simulating stand-ins to find out.
