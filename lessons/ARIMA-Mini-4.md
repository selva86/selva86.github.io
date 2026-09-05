---
title: "ARIMA diagnostics: the two checks before you trust a forecast"
slug: "ARIMA-Mini-4"
description: "Fit an ARIMA model to the airline series, then run the two checks that decide whether its forecast is safe: the residual ACF band, and the Ljung-Box test."
keywords: "ARIMA diagnostics, Ljung-Box test, residual ACF, white noise residuals, checkresiduals, Box.test fitdf, ARIMA residuals in R, time series model checking"
mathjax: true
webr: true
date: "2026-09-06"
post_type: "LESSON"
course_id: "arima-from-zero"
course_title: "ARIMA from Zero"
course_lesson: "4"
course_total: "7"
course_landing: "/dashboard.html"
course_prev: "ARIMA-Mini-3"
course_next: ""
curriculum_id: "0.0.18"
lesson_access: "windowed"
catalog_blurb: "How to tell whether a fitted ARIMA model is safe to forecast with."
---

=== step === cover
## ARIMA diagnostics: the two checks before you trust a forecast

Today let's work out whether a fitted ARIMA model is good enough to forecast with.

The series we will use is `AirPassengers`, which ships with R. It holds 144 monthly totals of international airline passengers, in thousands, from January 1949 to December 1960. The counts start at 104 and reach 622, and that one series is what we will fit, diagnose and forecast.

Fit an ARIMA model to it and R prints a table of coefficients and an AIC. Those numbers say how the model was estimated and how large its errors are on average. Not one of them uses the order those errors arrived in, which is where a missed pattern hides.

The errors are called residuals, and two checks read them. Here is the order they run in.

::widget process-flow {"steps":[{"title":"Fit the model, then take its residuals","sub":"one residual per month: the observed value minus the prediction for it"},{"title":"Check 1: the residual plot and the ACF","sub":"the shape of the errors, and the bars that break the band"},{"title":"Check 2: the Ljung-Box test","sub":"one p-value covering 24 lags at once"}]}

Both checks read the same set of residuals, and neither one is more than a line of code. What takes learning is reading what each one says.

=== step === concept
## The airline series and the model we are checking

Let's start by looking at the data.

```r
# Plot the airline passenger series we are going to model
library(forecast)

plot(AirPassengers,
     main = "Monthly international airline passengers, 1949 to 1960",
     ylab = "passengers (thousands)")
```

Two things stand out. The level climbs steadily across the twelve years, and the same shape repeats every year, a summer peak and a winter dip. Look at the size of that yearly swing as well: it is narrow in 1949 and much wider by 1960.

Now fit a model. We will use ARIMA(2,1,1), which is two autoregressive terms, one difference and one moving-average term. An autoregressive term predicts this month from an earlier month's value, a moving-average term predicts it from an earlier month's error, and the difference means the model works on month-to-month changes rather than on the raw totals. That is a reasonable non-seasonal choice for a series that trends.

```r
# Fit an ARIMA(2,1,1) to the airline series and print its coefficients
fit <- Arima(AirPassengers, order = c(2, 1, 1))
fit
#> Series: AirPassengers
#> ARIMA(2,1,1)
#>
#> Coefficients:
#>          ar1      ar2      ma1
#>       1.0906  -0.4890  -0.8438
#> s.e.  0.0776   0.0744   0.0427
#>
#> sigma^2 = 862.7:  log likelihood = -685.17
#> AIC=1378.34   AICc=1378.63   BIC=1390.19
```

The `ar1`, `ar2` and `ma1` rows hold the estimated coefficients, and the `s.e.` row under each one is its standard error. Divide each coefficient by its own standard error and the smallest of the three is still above 6, so all three sit a long way from zero. The AIC, 1378.34, is the number you would hold up against a competing model.

So the fit looks healthy. But a set of coefficients and an AIC only ever summarise how large the errors are, never the order they came in. Whether the model missed a pattern is a separate question with its own numbers.

=== step === concept
## What the residuals are, and what they should look like

A residual is one month's observed value minus the model's one-step-ahead prediction for that same month. The model reads everything up to the previous month, predicts this one, and the gap between the prediction and the truth is the residual. Fit 144 monthly values and you get 144 residuals.

```r
# Pull out the residuals and measure their mean and variance
res <- residuals(fit)
length(res)
#> [1] 144

round(c(mean = mean(res), variance = var(res)), 3)
#>     mean variance
#>    6.376  803.666
```

The mean is 6.376, so in the average month the model lands about 6,400 passengers below the truth. The variance of those 144 errors is 803.666.

Those two numbers cover part of what we want to know. If the model has captured everything it could, its residuals should be **white noise**, a series with no usable pattern left in it. White noise has four properties.

1. **Zero mean.** The errors are not consistently high or low, so the forecasts are not biased.
2. **Constant variance.** The spread of the errors stays the same from the start of the series to the end.
3. **No autocorrelation.** This month's error tells you nothing about next month's error.
4. **Roughly normal.** The errors pile up in a bell shape, which is what prediction intervals assume.

The first two you can read off a plot of the residuals. So plot them, and measure the spread at each end of the series while you are there.

```r
# Compare the residual spread early in the series with the spread late in it
round(c(first_48_months = sd(res[1:48]), last_48_months = sd(res[97:144])), 1)
#> first_48_months  last_48_months
#>            14.1            40.3

plot(res, main = "Residuals from the ARIMA(2,1,1) fit",
     ylab = "observed minus prediction")
abline(h = 0, col = "red", lwd = 2)
```

Property one holds up well enough: a mean of 6.376 is a slight upward drift, small next to the spread of the errors themselves. Property two is already broken. The early errors stay in a narrow band either side of the red zero line, and by 1960 they swing much further out. The two standard deviations put a number on what the plot shows: 14.1 over the first four years against 40.3 over the last four, so the spread is nearly three times wider at the end.

=== step === widget
## Three shapes a residual plot can take

A residual plot has only a handful of ways to go wrong, and they are worth learning by sight. Switch between the three below and watch the scatter change.

::widget residual-plot {"start": "healthy"}

The scatter comes from a small straight-line fit of the widget's own rather than from the airline model, because a shape means the same thing whatever kind of model produced the residuals. The widget spreads the residuals across the fitted value; for a series measured over time you spread them across time, which is how the airline residuals were just plotted, and the three shapes read the same way.

- **The flat band** is the healthy one. Points scatter evenly either side of zero and the width never changes.
- **The funnel** spreads as you move right. The errors are bigger where the predictions are bigger, so the variance is not constant.
- **The curve** bends away from zero and back again. The residuals still hold a shape, which means the model has the wrong form.

The airline residuals are the funnel. That is exactly what 14.1 growing to 40.3 measured. A funnel is not repaired by adding model terms. It is repaired by stabilising the variance, usually with a log transform.

=== step === concept
## Check 1: the ACF of the residuals and its band

The first check is a picture, and the thing it draws is the autocorrelation function, or ACF.

Autocorrelation is the correlation between a series and a shifted copy of itself. Shift the residuals along by one month and correlate the two: that is the autocorrelation at lag 1. Shift by twelve months instead and you get lag 12. Do it for every lag from 1 to 24 and you have 24 numbers, which `acf()` draws as bars.

```r
# Draw the autocorrelation function of the residuals out to 24 lags
acf(res, lag.max = 24, main = "ACF of the ARIMA(2,1,1) residuals")
```

Most of the bars are short and sit between the two dashed blue lines. That pair of lines is the band, and it marks how large an autocorrelation can get by chance alone when the true correlation is zero. It sits at plus and minus \(1.96/\sqrt{n}\), where \(n\) is the number of residuals.

A bar inside the band is indistinguishable from zero. A bar outside it is a correlation the residuals should not have. So let's compute the band for our 144 residuals and count the bars that break it.

```r
# Compute the band and count the autocorrelations that break it
band <- 1.96 / sqrt(length(res))
round(band, 3)
#> [1] 0.163

acf_vals <- acf(res, lag.max = 24, plot = FALSE)$acf[-1]
sum(abs(acf_vals) > band)
#> [1] 6

which(abs(acf_vals) > band)
#> [1]  4  8 12 16 20 24
```

Setting `plot = FALSE` returns the numbers instead of the picture, and `[-1]` drops the value at lag 0, which is always 1 because any series correlates perfectly with itself.

Six of the 24 autocorrelations break the 0.163 band, and where they fall is the whole story: lags 4, 8, 12, 16, 20 and 24. The two at multiples of twelve are the big ones.

```r
# Read off the two largest residual autocorrelations
round(acf_vals[c(12, 24)], 3)
#> [1] 0.780 0.639
```

0.780 at lag 12 is nearly five times the band, which is enormous for a residual series. On monthly data lag 12 is one full year, so a month's error is strongly predictable from the error twelve months before it. The yearly cycle you saw in the passenger counts is still sitting in the errors, untouched.

The other four breaks are negative, and they land between the yearly spikes. That is what a repeating cycle does to an ACF: at a lag that falls part way through the cycle, high months line up against low ones and the correlation turns negative.

[KEY INSIGHT]
Residuals are one-step-ahead forecast errors, so any pattern left in them is signal the model could have used and did not. A bar outside the band is not bad luck. It is a piece of the series the model failed to take.

=== step === quiz
## Quick check: the spikes at lag 12 and lag 24

The residual ACF broke its 0.163 band six times, at lags 4, 8, 12, 16, 20 and 24, with 0.780 at lag 12 and 0.639 at lag 24. What does that pattern tell you about the model?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- The residuals are simply too large, so the model needs more terms of any kind. ::no
- A month's error is still predictable from the error twelve months earlier, so the yearly cycle was never captured. ::ok Exactly. Lag 12 on monthly data is one full year, and a correlation of 0.780 there means the seasonal pattern is still sitting in the residuals, waiting to be modelled.
- The spread of the residuals grows over time, and those tall bars are what measures it. ::no
- The band is too narrow for a series of only 144 observations, so bars break it by construction. ::no An ACF measures one thing: the correlation between the residuals and a shifted copy of themselves. It says nothing about how large the residuals are, and nothing about whether their spread grows, which is what the residual plot is for. The band is the standard one for a series of this length, and a correlation of 0.780 at lag 12 on monthly data means the yearly cycle is still in the errors.

=== step === concept
## Check 2: the Ljung-Box test

Counting bars works, but it leaves you deciding by eye how many breaks are too many. The second check replaces that judgement with a single number.

The Ljung-Box test takes the first \(h\) autocorrelations, squares each one, weights it and adds them into one statistic. Because it pools many lags into one quantity instead of testing each lag on its own, it is called a portmanteau test.

It is a hypothesis test, so it starts from a null hypothesis and checks whether the data reject it.

**Null hypothesis: the residuals are white noise, with no autocorrelation up to lag \(h\).**

Now the part that trips people up: the direction. A large p-value means the residuals are indistinguishable from white noise, and that is the pass. A small p-value rejects the null, which says autocorrelation is still in there, and that is the failure. In most tests you run, a small p-value is the result you are hoping for. Here the boring outcome is the one you want.

```r
# Pool the first 24 residual autocorrelations into one Ljung-Box test
Box.test(res, lag = 24, type = "Ljung-Box", fitdf = 3)
#>
#> 	Box-Ljung test
#>
#> data:  res
#> X-squared = 216.35, df = 21, p-value < 2.2e-16
```

Three arguments decide what that test actually did.

- `lag = 24` is \(h\), the number of autocorrelations pooled into the statistic. For monthly data, twice the seasonal period is the usual choice, so 24.
- `type = "Ljung-Box"` picks the Ljung-Box weighting rather than the older Box-Pierce one.
- `fitdf = 3` is the correction for the coefficients you estimated.

That last one deserves a sentence. You did not know the model in advance, you estimated it, and each estimated AR or MA coefficient uses up a little of the freedom the residuals had to wander. The test allows for that by subtracting them from the lag count:

\[ df = h - \textrm{fitdf} \]

Our model is ARIMA(2,1,1), so it estimated two AR terms and one MA term. That makes `fitdf` 3, and \(df = 24 - 3 = 21\), which is the `df = 21` printed in the output. The differencing is never counted, because differencing estimates nothing.

So read the verdict: a statistic of 216.35 against 21 degrees of freedom, and a p-value R prints as `< 2.2e-16` because it is smaller than R will display. The residuals are not white noise. The model fails.

[WARNING]
A large p-value here is not proof that the model is right. The Ljung-Box test looks for autocorrelation and nothing else, so a model whose residual spread triples across the series can still pass it. That is why the plot comes first and the test second, rather than the test on its own.

=== step === concept
## The repair, and the same two checks again

A failing check is not a dead end. It names what to add.

Two faults turned up in these residuals. The spikes at lags 12 and 24 say the yearly cycle is still in there, which calls for seasonal terms. The spread growing from 14.1 to 40.3 says the variance is not constant, which calls for a transform. `Arima()` takes both in the same call.

```r
# Refit with seasonal terms and a log transform, then run both checks at once
fit_fixed <- Arima(AirPassengers, order = c(0, 1, 1),
                   seasonal = c(0, 1, 1), lambda = 0)
checkresiduals(fit_fixed)
#>
#> 	Ljung-Box test
#>
#> data:  Residuals from ARIMA(0,1,1)(0,1,1)[12]
#> Q* = 26.446, df = 22, p-value = 0.233
#>
#> Model df: 2.   Total lags used: 24
```

`seasonal = c(0, 1, 1)` adds a seasonal difference and a seasonal moving-average term at the twelve-month period, which is what takes the yearly cycle out. `lambda = 0` applies a log transform before fitting, which turns those widening swings into swings of roughly constant width.

`checkresiduals()` runs both checks in one line. It draws three panels, the residuals over time, their ACF and a histogram, and prints the Ljung-Box test underneath. It labels the statistic `Q*` where `Box.test()` labels it `X-squared`, and they are the same number.

The printed line reads 26.446 on 22 degrees of freedom with a p-value of 0.233. That is comfortably above 0.05, so the test does not reject white noise, and the model passes.

`Model df: 2` is the `fitdf` the wrapper worked out for you, and it is worth seeing why it is 2 and not 4. The order is ARIMA(0,1,1)(0,1,1)[12]: no AR term and one MA term in the non-seasonal part, no seasonal AR term and one seasonal MA term in the seasonal part. So the count is p + q + P + Q, which is 0 + 1 + 0 + 1 = 2, and \(df = 24 - 2 = 22\). Both differences, the ordinary one and the seasonal one, stay out of the count.

Now let's run the other check on the same repaired model.

```r
# Redraw the residual ACF for the repaired model and recount the breaks
acf_fixed <- acf(residuals(fit_fixed), lag.max = 24,
                 main = "ACF of the repaired model residuals")
sum(abs(acf_fixed$acf[-1]) > band)
#> [1] 1

round(acf_fixed$acf[-1][12], 3)
#> [1] -0.051
```

One bar out of 24 now sits outside the same 0.163 band, against six before. Lag 12 has fallen from 0.780 to -0.051, comfortably inside the band, so the yearly cycle has gone from the errors. One stray bar in 24 is roughly what chance alone produces, because the band is drawn to be broken about 5% of the time even when nothing is wrong.

=== step === widget
## Forecasting the repaired model, and what its intervals assume

With both checks passed, the model can be put to the job you fitted it for.

```r
# Forecast the next six months from the repaired model
forecast(fit_fixed, h = 6)
#>          Point Forecast    Lo 80    Hi 80    Lo 95    Hi 95
#> Jan 1961       450.4224 429.5461 472.3132 418.8895 484.3289
#> Feb 1961       425.7172 402.8146 449.9219 391.1938 463.2874
#> Mar 1961       479.0068 450.1386 509.7265 435.5677 526.7781
#> Apr 1961       492.4045 459.8801 527.2290 443.5416 546.6503
#> May 1961       509.0550 472.7467 548.1518 454.5866 570.0497
#> Jun 1961       583.3449 538.8968 631.4591 516.7552 658.5155
```

January 1961 comes out at 450.4 thousand passengers, with a 95% interval running from 418.9 to 484.3. The point forecast is the single best guess and the interval is the honest width around it.

That interval is where leftover autocorrelation does its damage, and the damage is easy to miss because the fit statistics do not drop when it happens. Drag the dial below and watch it happen.

::widget assumption-dial {"assumption": "autocorrelation", "levels": 11, "start": 0}

The dial runs its own simulated studies rather than the airline data. At every setting it fits a trend to 60 observations two thousand times over and records two numbers. Coverage is the share of those 95% intervals that really do contain the true value, which is the property that makes an interval like 418.9 to 484.3 worth quoting. R-squared is the fit statistic you would look at.

At the left of the dial the errors are independent, and coverage reads 95.0%, which is exactly what 95% is supposed to mean. R-squared is 0.504. Now drag it right. At the far end, where neighbouring errors correlate at 0.92, coverage has dropped to 32.2%, so about two intervals in three miss the value they claim to bracket.

And R-squared at that far end is 0.636, which is higher than where it started. A smoothly correlated error series raises the fit statistic at the same time as it wrecks the coverage. So no fit statistic is going to warn you here. Only a check on the residuals will.

=== step === quiz
## Quick check: good coefficients, failing Ljung-Box

Take the ARIMA(2,1,1) fit from earlier. Every coefficient sat several standard errors from zero and the AIC was 1378.34, yet the Ljung-Box test on its residuals returned a p-value below 2.2e-16. What does that combination tell you?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- The very small p-value confirms the model fits well, because a small p-value is the pass for Ljung-Box. ::no
- The AIC of 1378.34 is the stronger evidence of the two, so the model can be used as it stands. ::no
- The residuals still carry pattern the model could have used, so its prediction intervals will contain the truth less often than their 95% label claims, while the coefficients and the AIC stay exactly as printed. ::ok Right. The coefficients and the AIC describe how the model was estimated, and this leaves them untouched. The leftover autocorrelation is a separate fault, and the prediction interval is what pays for it.
- The p-value is that small only because 144 observations is a large sample, so it can be discounted. ::no Three of these either read the test backwards or rank a fit statistic above it. For Ljung-Box a large p-value is the pass and a small one the failure, and 144 monthly observations is a modest series, not a sample so large that any test rejects. What the small p-value buys you is a warning about the intervals, which no coefficient and no AIC will ever give you.

=== step === tryit
## Your turn: reproduce the p-value with Box.test

`checkresiduals()` chose the lag and the degrees of freedom for the repaired model on its own. Now do it by hand.

Run a Ljung-Box test on the residuals of `fit_fixed` at lag 24, setting `fitdf` yourself. Get it right and the output will match the numbers the wrapper printed.

```r
# fit_fixed is the repaired ARIMA(0,1,1)(0,1,1)[12] on the airline series.
# Run a Ljung-Box test on its residuals at lag 24 and set fitdf yourself,
# counting the AR and MA terms the model estimated, seasonal ones included.
# One line. Press Check when you have it.
```
::check {"regex": "fitdf\\s*=\\s*2\\b", "gate": true, "difficulty": "intermediate", "ok": "That is it: X-squared 26.446 on df 22, p-value 0.233, the same numbers the wrapper printed. fitdf counts p + q + P + Q, which here is 0 + 1 + 0 + 1 = 2.", "no": "Count the estimated AR and MA terms, seasonal ones included, and leave both differences out: 0 + 1 + 0 + 1 = 2, so fitdf = 2. Leave it at 0 and df comes out at 24 with a p-value of 0.3309, from a test more lenient than the correct one."}
::solution
```r
# Reproduce the checkresiduals p-value with an explicit Box.test call
Box.test(residuals(fit_fixed), lag = 24, type = "Ljung-Box", fitdf = 2)
#>
#> 	Box-Ljung test
#>
#> data:  residuals(fit_fixed)
#> X-squared = 26.446, df = 22, p-value = 0.233
```

The statistic does not move when you change `fitdf`. Only the degrees of freedom it gets compared against move, which is why forgetting the correction quietly makes the test easier to pass.

=== step === concept
## References

- [Forecasting: Principles and Practice, 3rd edition, section 5.4 Residual diagnostics](https://otexts.com/fpp3/diagnostics.html) - Hyndman and Athanasopoulos. The white-noise standard for residuals, and the portmanteau test that checks it.
- [On a measure of lack of fit in time series models](https://doi.org/10.1093/biomet/65.2.297) - Ljung and Box (1978), Biometrika 65(2), 297-303. The original statistic and its distribution.
- [Distribution of residual autocorrelations in autoregressive-integrated moving average time series models](https://doi.org/10.1080/01621459.1970.10481180) - Box and Pierce (1970), Journal of the American Statistical Association 65(332), 1509-1526. Where the degrees-of-freedom correction comes from.
- [Box-Pierce and Ljung-Box tests](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/box.test.html) - R Core Team. The reference for the `lag`, `type` and `fitdf` arguments.
- [Automatic time series forecasting: the forecast package for R](https://doi.org/10.18637/jss.v027.i03) - Hyndman and Khandakar (2008), Journal of Statistical Software 27(3). The package behind `Arima()` and `checkresiduals()`.

=== step === complete
## Quick recap

You fitted one ARIMA model to the airline series, found it could not be trusted, repaired it, and checked it again. The two checks, in the order you run them:

- **The residual plot and the ACF.** Residuals are one-step-ahead forecast errors. Plot them for shape, then read their autocorrelations against the band at 1.96 over the square root of n. On 144 residuals that band is 0.163, and the first model broke it six times, with 0.780 at lag 12.
- **The Ljung-Box test.** One p-value covering 24 lags at once. A large p-value is the pass and a small one the failure, the opposite direction to most tests. The first model returned a p-value below 2.2e-16, and with seasonal terms and a log transform it returned 0.233.

Two details worth carrying with you:

- `fitdf` counts the estimated AR and MA terms, seasonal ones included, and never the differencing. Forget it and the test comes out more lenient than it should be.
- A model can have strong coefficients, a respectable AIC and autocorrelated residuals all at the same time. The fit statistics will sit there looking fine while the prediction intervals miss.

So diagnose first and forecast second. The ACF tells you what the model missed, and the test tells you whether it is still missing after you have made the change.
