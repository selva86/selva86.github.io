---
title: "Fourier Terms in R: Model Complex Seasonality"
slug: "Fourier-Terms-in-R"
description: "Model complex and multiple seasonality in R with Fourier terms: build them with fourier(), fit dynamic harmonic regression via auto.arima(), and forecast ahead."
keywords: "Fourier terms in R, complex seasonality, dynamic harmonic regression, fourier() forecast, multiple seasonal periods, auto.arima xreg, harmonic regression R, msts, fable fourier"
auto_link_terms: "Fourier terms|Fourier term|Fourier terms in R|dynamic harmonic regression|harmonic regression|complex seasonality|multiple seasonal periods|fourier()|Fourier series|msts|number of harmonics"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-19"
curriculum_id: "FR-arim-3"
post_type: "FR"
fr_parent: "SARIMA-in-R.html"
difficulty: "Intermediate"
---

<p class="lead">Fourier terms are pairs of sine and cosine waves that stand in for a repeating seasonal pattern using only a handful of numbers. In R you build them with <code>fourier()</code> and hand them to <code>auto.arima()</code> as extra predictors, which lets a single model capture very long seasonal cycles, and even several overlapping cycles at once, that a seasonal ARIMA cannot. This tutorial uses the <code>forecast</code> and <code>ggplot2</code> packages for the runnable code, and shows the modern <code>fable</code> version to run in your own R session.</p>

## Why do weekly and daily seasonal cycles break a seasonal ARIMA model?

Sales climb every December. Website traffic peaks every Monday. A [seasonal ARIMA model](SARIMA-in-R.html) copes fine with a short cycle like 12 months, but it starts to struggle when the cycle is long, say 52 weeks, and it cannot handle two cycles at the same time. The quickest way to feel the problem is to build a weekly series and let R try to fit it.

Let's create five years of weekly demand with a clear yearly rhythm baked in, then look at it.

```r title="Build a weekly series with a yearly cycle"
library(forecast)
library(ggplot2)

set.seed(2027)
n <- 260                         # 5 years of weekly data
week <- 1:n
# a smooth yearly shape (three harmonics) plus a gentle trend and noise
seasonal <- 14 * sin(2 * pi * week / 52) + 6 * cos(2 * pi * week / 52) +
            5 * sin(2 * pi * 2 * week / 52) + 4 * cos(2 * pi * 2 * week / 52) +
            3 * sin(2 * pi * 3 * week / 52)
weekly_demand <- ts(120 + 0.05 * week + seasonal + rnorm(n, 0, 3), frequency = 52)

c(observations = length(weekly_demand), season_length = frequency(weekly_demand))
#>  observations season_length 
#>           260            52 

autoplot(weekly_demand) +
  labs(title = "Weekly demand with a yearly cycle", x = "Year", y = "Units")
```

The printout confirms what we built: 260 weekly observations with a season that is 52 steps long. The plot shows the same wave rolling past five times, once per year. This is exactly the kind of series a seasonal model should love, so let's hand it to `auto.arima()` and see what it does.

```r title="Let auto.arima try a seasonal model"
naive_fit <- auto.arima(weekly_demand)
naive_fit
#> Series: weekly_demand 
#> ARIMA(0,0,0)(1,1,0)[52] with drift 
#> 
#> Coefficients:
#>          sar1   drift
#>       -0.4856  0.0470
#> s.e.   0.0694  0.0036
#> 
#> sigma^2 = 13.44:  log likelihood = -571.31
#> AIC=1148.63   AICc=1148.74   BIC=1158.64
```

Read the label `ARIMA(0,0,0)(1,1,0)[52]`. The `1` in the middle of the seasonal bracket means R was forced to take one seasonal difference, subtracting each week from the same week a year earlier. That throws away the first 52 weeks before the model can learn anything. Worse, the entire yearly shape is now squeezed into a single seasonal coefficient, `sar1`. That is a rigid, blunt way to describe a rich pattern, and it only works at all because there is exactly one seasonal period. The moment you have a daily cycle sitting on top of a weekly one, this whole approach falls apart.

**Try it:** The monthly `AirPassengers` series has a short season (m = 12). Fit an automatic model to it and notice how much fuller the seasonal part of the label can be when the period is small.

```r title="Your turn: seasonal model on monthly data"
# Goal: fit auto.arima to the monthly AirPassengers series (m = 12)
# and read the (P,D,Q)[m] seasonal part of the label.
ex_series <- weekly_demand    # change this to AirPassengers, then run
auto.arima(ex_series)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Automatic model on AirPassengers"
auto.arima(AirPassengers)
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

**Explanation:** With m = 12 the model comfortably fits a seasonal part. The pain only starts when m is large (weekly, daily) or when there is more than one season.

</details>

[KEY INSIGHT]
**A seasonal ARIMA has to reach across the whole cycle to model a season; Fourier terms trace the same shape with just a few waves.** A weekly season forces the model to span all 52 steps and give up the first year to seasonal differencing, yet two or three sine and cosine pairs can follow the same shape with a handful of numbers, so the model stays small no matter how long the period is.

## What exactly is a Fourier term?

A Fourier term is a single sine or cosine wave that completes a whole number of cycles per season. The first harmonic completes a single cycle per season, and each higher harmonic completes one more cycle than the last, so harmonic number k makes k cycles. The remarkable fact, proved by the mathematician Joseph Fourier, is that adding a few of these waves together can trace almost any repeating shape. We use them in sine-and-cosine pairs so the combined wave can peak at any point in the cycle, not just where a plain sine would.

Here is the same idea written down. For a season of length $m$, the $k$-th Fourier pair is

$$s_k(t) = \sin\left(\frac{2 \pi k t}{m}\right), \qquad c_k(t) = \cos\left(\frac{2 \pi k t}{m}\right)$$

and the seasonal part of the series is approximated by adding $K$ of these pairs on top of a baseline:

$$\hat{y}_t = a + \sum_{k=1}^{K}\left[\alpha_k \sin\left(\frac{2 \pi k t}{m}\right) + \beta_k \cos\left(\frac{2 \pi k t}{m}\right)\right] + N_t$$

Where:

- $t$ = the time index (week 1, 2, 3, and onward)
- $m$ = the season length (52 for weekly data)
- $K$ = how many sine and cosine pairs you keep
- $\alpha_k$ and $\beta_k$ = the wave sizes the model estimates
- $N_t$ = whatever is left over, handled by an ARIMA model

If formulas are not your thing, skip straight to the code, because the `fourier()` function builds all of this for you. Pass it the series and a value of `K`, and it returns a matrix of the sine and cosine columns.

```r title="Build the Fourier terms"
round(head(fourier(weekly_demand, K = 2), 4), 3)
#>      S1-52 C1-52 S2-52 C2-52
#> [1,] 0.121 0.993 0.239 0.971
#> [2,] 0.239 0.971 0.465 0.885
#> [3,] 0.355 0.935 0.663 0.749
#> [4,] 0.465 0.885 0.823 0.568
```

With `K = 2` you get four columns, one sine and one cosine for each of the first two harmonics. Each row is one week, and each number is where that wave sits at that moment. These four columns are the predictors you will feed to the model. It helps to actually see the waves they represent.

```r title="See the Fourier waves"
wave_df <- data.frame(
  week = week,
  S1   = sin(2 * pi * week / 52),
  C1   = cos(2 * pi * week / 52),
  S2   = sin(2 * pi * 2 * week / 52)
)

ggplot(subset(wave_df, week <= 104), aes(week)) +
  geom_line(aes(y = S1, colour = "S1: one cycle per year")) +
  geom_line(aes(y = C1, colour = "C1: one cycle per year")) +
  geom_line(aes(y = S2, colour = "S2: two cycles per year")) +
  labs(title = "Fourier terms are just sine and cosine waves",
       x = "Week", y = "Value", colour = NULL)
```

Over two years, `S1` and `C1` each make two full swings (one per year), while `S2` makes four (two per year). The model will scale and add waves like these until their sum matches the real seasonal shape.

**Try it:** Each value of K adds one sine and one cosine, so K pairs make 2K columns. Confirm it: how many columns does `K = 4` create?

```r title="Your turn: count the Fourier columns"
# Goal: how many predictor columns does K = 4 produce?
# Hint: ncol() counts columns; each K adds a sine and a cosine.
ncol(fourier(weekly_demand, K = 2))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Counting Fourier columns"
ncol(fourier(weekly_demand, K = 4))
#> [1] 8
```

**Explanation:** Four pairs make 2 times 4 = 8 columns. More pairs means more columns and a more flexible seasonal curve.

</details>

[NOTE]
**Column names encode the wave.** In a name like S2-52, the S means sine (C means cosine). The 2 is the harmonic number, and 52 is the season length. You never type these by hand, because `fourier()` names them for you.

## How do you fit a dynamic harmonic regression in R?

Now we combine the pieces. You feed the Fourier columns to `auto.arima()` through its `xreg` argument (short for external regressors) and set `seasonal = FALSE`. The Fourier terms carry the season, so `auto.arima()` is free to model only the short-term wobble that is left, treating it as ordinary, non-seasonal ARIMA errors. This two-part recipe, a regression on Fourier terms with ARIMA errors, is called dynamic harmonic regression.

```r title="Fit a dynamic harmonic regression"
dhr_fit <- auto.arima(weekly_demand,
                      xreg = fourier(weekly_demand, K = 3),
                      seasonal = FALSE)
dhr_fit
#> Series: weekly_demand 
#> Regression with ARIMA(0,1,1) errors 
#> 
#> Coefficients:
#>           ma1    S1-52   C1-52   S2-52   C2-52   S3-52   C3-52
#>       -0.9089  13.6383  5.9220  4.3750  3.7826  2.8875  0.3314
#> s.e.   0.0200   0.3259  0.3147  0.2688  0.2655  0.2568  0.2553
#> 
#> sigma^2 = 8.949:  log likelihood = -648.64
#> AIC=1313.28   AICc=1313.86   BIC=1341.74
```

The label now reads "Regression with ARIMA(0,1,1) errors", with no seasonal bracket at all. The season has moved into the six Fourier coefficients, from `S1-52` through `C3-52`, and the only ARIMA structure left is a tiny non-seasonal `(0,1,1)`. Notice too that this model uses every observation, with no year of data sacrificed to seasonal differencing.

![The dynamic harmonic regression workflow from series to forecast](screenshots/Fourier-Terms-in-R-workflow.webp)
*Figure 1: The dynamic harmonic regression workflow: turn the season into Fourier columns, fit ARIMA on the rest, then forecast with future Fourier terms.*

[KEY INSIGHT]
**The fitted amplitudes recover a signal you could not see.** We secretly built the series from waves of size 14, 6, 5, 4 and 3; the model read them back as roughly 13.6, 5.9, 4.4, 3.8 and 2.9 without ever being told they existed. That is the Fourier idea working in reverse, pulling a clean seasonal signal out of noisy data.

**Try it:** Refit the model with only `K = 2` pairs and read its AICc. A lower AICc means a better trade-off between fit and complexity.

```r title="Your turn: fit with two Fourier pairs"
# Goal: fit the dynamic harmonic regression with K = 2
# and print its AICc, rounded to 2 decimals.
ex_fit2 <- auto.arima(weekly_demand,
                      xreg = fourier(weekly_demand, K = 1),   # change 1 to 2
                      seasonal = FALSE)
round(ex_fit2$aicc, 2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="AICc at two Fourier pairs"
ex_fit2 <- auto.arima(weekly_demand,
                      xreg = fourier(weekly_demand, K = 2),
                      seasonal = FALSE)
round(ex_fit2$aicc, 2)
#> [1] 1384.99
```

**Explanation:** 1384.99 is higher than the K = 3 model's 1313.86, so two pairs are not flexible enough to trace this season.

</details>

## How do you choose K, the number of Fourier pairs?

`K` is the one dial you control, and it sets how detailed the seasonal curve can be. A small `K` gives a smooth, simple season. A large `K` gives a wiggly one that can start chasing noise. The clean way to pick it is to fit a handful of values and keep the one with the lowest AICc, a score that rewards good fit and penalises extra parameters.

```r title="Search K by AICc"
for (K in 1:6) {
  fit_k <- auto.arima(weekly_demand,
                      xreg = fourier(weekly_demand, K = K),
                      seasonal = FALSE)
  cat("K =", K, " AICc =", round(fit_k$aicc, 2), "\n")
}
#> K = 1  AICc = 1452.5 
#> K = 2  AICc = 1384.99 
#> K = 3  AICc = 1313.86 
#> K = 4  AICc = 1315.94 
#> K = 5  AICc = 1322.33 
#> K = 6  AICc = 1324.87 
```

The AICc drops sharply, hits its lowest point at `K = 3`, then creeps back up. That dip is the sweet spot: enough waves to trace the yearly shape, not so many that the model fits the random noise. A picture makes the smoothness trade-off obvious.

```r title="Compare the seasonal shape at K = 1 and K = 3"
fit1 <- auto.arima(weekly_demand,
                   xreg = fourier(weekly_demand, K = 1),
                   seasonal = FALSE)

compare_df <- data.frame(
  week   = week,
  actual = as.numeric(weekly_demand),
  K1     = as.numeric(fitted(fit1)),
  K3     = as.numeric(fitted(dhr_fit))
)

ggplot(subset(compare_df, week <= 78), aes(week)) +
  geom_line(aes(y = actual), colour = "grey70") +
  geom_line(aes(y = K1, colour = "K = 1"), linewidth = 0.9) +
  geom_line(aes(y = K3, colour = "K = 3"), linewidth = 0.9) +
  labs(title = "More Fourier pairs trace a more detailed season",
       x = "Week", y = "Weekly demand", colour = NULL)
```

The `K = 1` line is a single smooth swell, too plain to follow the real peaks and dips. The `K = 3` line hugs the actual series closely. Push `K` much higher and that line would start wobbling around every little bump, which is overfitting.

**Try it:** The search stopped improving after `K = 3`. Check the next step up: fit `K = 5` and confirm its AICc is worse than 1313.86.

```r title="Your turn: check a larger K"
# Goal: fit K = 5 and print its AICc. Is it above or below 1313.86?
ex_fit5 <- auto.arima(weekly_demand,
                      xreg = fourier(weekly_demand, K = 3),   # change 3 to 5
                      seasonal = FALSE)
round(ex_fit5$aicc, 2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="AICc at five Fourier pairs"
ex_fit5 <- auto.arima(weekly_demand,
                      xreg = fourier(weekly_demand, K = 5),
                      seasonal = FALSE)
round(ex_fit5$aicc, 2)
#> [1] 1322.33
```

**Explanation:** 1322.33 sits above 1313.86, so five pairs slightly overfit. K = 3 remains the winner.

</details>

[TIP]
**Let AICc pick K, not your eyes.** Loop over a small range such as K = 1 to 8, fitting each model and keeping the K with the lowest AICc. It is faster and more reliable than judging the wiggle of a plot.

## How do you forecast future values with Fourier terms?

Forecasting has one twist worth understanding. To predict ahead, `auto.arima()` needs the Fourier terms for the future weeks too, and here is the good news: those terms depend only on the calendar, never on anything unknown. You generate them the same way you generated the training terms, this time asking for a horizon `h`. Call `fourier(x, K, h)` to build the terms for the next `h` steps, then pass them to `forecast()` as `xreg`.

```r title="Forecast the next 26 weeks"
fc <- forecast(dhr_fit, xreg = fourier(weekly_demand, K = 3, h = 26))

head(data.frame(point = round(as.numeric(fc$mean), 1),
                lo95  = round(as.numeric(fc$lower[, 2]), 1),
                hi95  = round(as.numeric(fc$upper[, 2]), 1)), 4)
#>   point  lo95  hi95
#> 1 145.8 140.0 151.7
#> 2 148.8 142.9 154.7
#> 3 151.1 145.2 157.0
#> 4 152.5 146.6 158.4
```

Each row is one future week: a point forecast plus a 95 percent interval showing the range the value is likely to fall in. The point forecasts rise week by week, tracing the start of the next yearly climb. Plotting the whole forecast makes the continuation clear.

```r title="Plot the forecast"
autoplot(fc) +
  labs(title = "26-week forecast from dynamic harmonic regression",
       x = "Year", y = "Weekly demand")
```

The shaded fan is the forecast interval, widening as it reaches further ahead. The central line carries the yearly wave smoothly forward from where the data ends.

[WARNING]
**Use the same K for the future terms as you used to fit.** If you fit with K = 3 but call `fourier(..., K = 4, h = 26)` for the forecast, the columns will not line up and R will stop with an error. Match the K on both calls, every time.

**Try it:** Produce a shorter forecast of just the next 8 weeks, then print the point predictions.

```r title="Your turn: forecast eight weeks"
# Goal: forecast the next 8 weeks and print the point forecasts.
# Build future Fourier terms with the SAME K = 3 and h = 8.
ex_fc <- forecast(dhr_fit, xreg = fourier(weekly_demand, K = 3, h = 4))  # change h to 8
round(as.numeric(ex_fc$mean), 1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Eight-week point forecasts"
ex_fc <- forecast(dhr_fit, xreg = fourier(weekly_demand, K = 3, h = 8))
round(as.numeric(ex_fc$mean), 1)
#> [1] 145.8 148.8 151.1 152.5 153.0 152.7 151.7 150.0
```

**Explanation:** Eight numbers, one per week, tracing the opening of the next yearly rise.

</details>

## How do you model multiple seasonal periods at once?

This is where Fourier terms leave seasonal ARIMA behind for good. High-frequency data often repeats on more than one clock at the same time. Half-hourly electricity demand has a daily rhythm (48 half-hours) and a weekly rhythm (336 half-hours) layered on top of each other. A seasonal ARIMA can track only one of them. With Fourier terms you simply add a set of waves for each period.

The recipe has two parts. First store the series as an `msts` object (a multiple seasonal time series) that records every period. Then give `fourier()` a vector of `K` values, one per period. The built-in `taylor` series (half-hourly electricity demand in England and Wales) already arrives in that form. We fit it here with `tslm()`, a time series version of `lm()` that is fast and does the job.

```r title="Fit two seasonal periods together"
data(taylor, package = "forecast")
attributes(taylor)$msts        # the two seasonal periods, in half-hours
#> [1]  48 336

multi_fit <- tslm(taylor ~ fourier(taylor, K = c(10, 10)))
length(coef(multi_fit))        # intercept plus every Fourier column
#> [1] 39
```

The `K = c(10, 10)` gives ten pairs to the daily cycle and ten to the weekly cycle. You might expect 41 coefficients (an intercept plus 2 times 10 daily and 2 times 10 weekly columns), but because the weekly period is exactly seven daily periods (336 = 7 times 48), one weekly harmonic falls right on top of a daily one, so `fourier()` drops that duplicate pair and 39 remain. That single model now carries both seasons together. Forecasting works just as before: build future Fourier terms for both periods and pass them along.

```r title="Forecast the next two days of demand"
multi_fc <- forecast(multi_fit,
                     newdata = data.frame(fourier(taylor, K = c(10, 10), h = 96)))
round(as.numeric(multi_fc$mean[1:4]), 1)   # first four half-hours
#> [1] 22324.6 21791.1 21749.1 21832.8
```

Those four numbers are the predicted demand for the first four half-hours of the next day. The forecast rolls the daily peak-and-trough forward while also respecting where we are in the week, something no single-season model could manage.

[NOTE]
**msts stores more than one season.** A plain ts object holds a single frequency, so it cannot describe daily-and-weekly data. Wrap the numbers in `msts(x, seasonal.periods = c(48, 336))` to record both periods, and then `fourier()` can build terms for each. The `taylor` series already comes packaged as an msts.

**Try it:** You can spend a different number of pairs on each period. How many columns does `K = c(5, 3)` create for the two seasons?

```r title="Your turn: count columns for two periods"
# Goal: how many Fourier columns for K = c(5, 3)?
# Hint: 2 * 5 for the first period plus 2 * 3 for the second.
ncol(fourier(taylor, K = c(2, 2)))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Columns for two seasonal periods"
ncol(fourier(taylor, K = c(5, 3)))
#> [1] 16
```

**Explanation:** Ten columns for the daily cycle (2 times 5) plus six for the weekly cycle (2 times 3) makes 16.

</details>

## How do you do this the modern way with fable?

The forecast package is the classic toolkit. The newer tidyverts family (the `tsibble` and `fable` packages) does the same modelling in tidy, pipe-friendly form, and it is what Hyndman's textbook now teaches. The idea is identical: a `fourier()` term for the season and `PDQ(0, 0, 0)` to switch off seasonal ARIMA so the Fourier terms own the season. The only real difference is that the data lives in a `tsibble`, a time-aware version of a data frame, instead of a `ts` object.

Because `tsibble` and `fable` are not part of the in-browser toolkit, run the block below in your own R session after installing them with `install.packages(c("fable", "tsibble", "dplyr"))`.

```r-static title="The same model with fable (run locally)"
library(dplyr)
library(tsibble)
library(fable)

demand_tsbl <- tsibble(week = 1:260,
                       demand = as.numeric(weekly_demand),
                       index = week)

fit_fbl <- demand_tsbl |>
  model(dhr = ARIMA(demand ~ fourier(period = 52, K = 3) + PDQ(0, 0, 0)))

report(fit_fbl)
#> Series: demand 
#> Model: LM w/ ARIMA(1,1,1) errors 
#> 
#> Coefficients:
#>          ar1      ma1  fourier(period = 52, K = 3)C1_52  fourier(period = 52, K = 3)S1_52
#>       0.0116  -0.9100                            5.9218                           13.6375
#> s.e.  0.0654   0.0208                            0.3169                            0.3282
#>       fourier(period = 52, K = 3)C2_52  fourier(period = 52, K = 3)S2_52
#>                                 3.7825                            4.3746
#> s.e.                            0.2682                            0.2715
#>       fourier(period = 52, K = 3)C3_52  fourier(period = 52, K = 3)S3_52
#>                                 0.3312                            2.8872
#> s.e.                            0.2580                            0.2595
#> 
#> sigma^2 estimated as 8.984:  log likelihood=-648.62
#> AIC=1315.25   AICc=1315.97   BIC=1347.26
```

Look at the Fourier coefficients: `S1_52` is 13.64 and `C1_52` is 5.92, matching the forecast-package fit almost to the decimal. Both packages estimate the same model; they just wrap it in different syntax.

[NOTE]
**fable is the modern path; forecast is the compatible one.** Both fit the identical model, and the coefficients above match the forecast version almost exactly. Reach for fable when you want tidy pipelines and many series at once, and for the forecast package when you want something lighter that runs anywhere, including right here in your browser.

## Practice Exercises

These exercises combine the ideas above. Try each before opening the solution.

### Exercise 1: Let AICc pick K for you

Instead of reading the AICc table by eye, write code that fits `K = 1` through `6` and returns the K with the lowest AICc automatically. Save it to `best_k`.

```r title="Exercise 1 starter"
# Fit K = 1..6, then use which.min() on the AICc values to pick the best K.
# Hint: sapply() over 1:6 returns a vector of AICc values.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
aicc_by_k <- sapply(1:6, function(K)
  auto.arima(weekly_demand,
             xreg = fourier(weekly_demand, K = K),
             seasonal = FALSE)$aicc)
best_k <- which.min(aicc_by_k)
best_k
#> [1] 3
```

**Explanation:** `sapply()` collects the six AICc scores into a vector, and `which.min()` returns the position of the smallest, which is K = 3, exactly matching the table you read earlier.

</details>

### Exercise 2: A full multiple-seasonality forecast

Put the whole multiple-seasonality workflow together on the `taylor` series: fit a harmonic regression with `K = c(10, 10)`, forecast the next full day (48 half-hours), and print the very first forecast value. Save the forecast object to `my_fc`.

```r title="Exercise 2 starter"
# 1. Fit tslm(taylor ~ fourier(taylor, K = c(10, 10)))
# 2. Forecast with newdata = data.frame(fourier(taylor, K = c(10, 10), h = 48))
# 3. Print the first value of my_fc$mean, rounded to 1 decimal.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
my_fit <- tslm(taylor ~ fourier(taylor, K = c(10, 10)))
my_fc  <- forecast(my_fit,
                   newdata = data.frame(fourier(taylor, K = c(10, 10), h = 48)))
round(as.numeric(my_fc$mean[1]), 1)
#> [1] 22324.6
```

**Explanation:** The first half-hour of the next day is predicted at 22324.6, the same value the section-6 forecast produced, because it is the same fitted model.

</details>

### Exercise 3: Check the model is trustworthy

A good forecast model leaves behind residuals that look like random noise. Run `checkresiduals()` on the `K = 3` model `dhr_fit` from earlier and read the Ljung-Box p-value from the printout. A p-value above 0.05 means the leftovers are indistinguishable from noise, which is what you want.

```r title="Exercise 3 starter"
# Run checkresiduals() on the fitted model dhr_fit
# and read the Ljung-Box p-value from the printout.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
checkresiduals(dhr_fit)
#> 
#> 	Ljung-Box test
#> 
#> data:  Residuals from Regression with ARIMA(0,1,1) errors
#> Q* = 60.521, df = 51, p-value = 0.1698
#> 
#> Model df: 1.   Total lags used: 52
```

**Explanation:** The p-value of 0.1698 is well above 0.05, so the residuals pass the white-noise test. The Fourier terms plus a small ARIMA error captured the structure, and nothing systematic is left over.

</details>

## Frequently Asked Questions

### How are Fourier terms different from seasonal dummy variables?

Seasonal dummy variables use one indicator column per step in the season, so a weekly season needs 51 dummies and a daily one needs 364. Fourier terms compress the same shape into a few smooth waves, so the model stays small and the fitted season stays smooth instead of jagged.

### What value of K should I start with?

Start small. Try `K = 1` up to about 6 or 10, fitting each model and keeping the K with the lowest AICc. Note that K can never exceed m/2 (half the season length), because beyond that point the extra waves simply repeat ones you already have.

### Can I add other predictors alongside the Fourier terms?

Yes. The Fourier columns are just regressors, so you can `cbind()` them with anything else, such as a temperature series or a holiday flag, and pass the combined matrix as `xreg`. This is how forecasters model electricity demand from the weather and the calendar together.

### When should I reach for TBATS or Prophet instead?

Dynamic harmonic regression assumes the seasonal shape stays roughly constant over time. If the seasonality clearly drifts from year to year, TBATS (also in the forecast package) lets it evolve, and Prophet is a popular choice for business series with irregular holidays. Fourier-term regression is the simplest and most transparent place to start.

### Do Fourier terms work for daily data with a yearly cycle?

Yes, and it is one of their best uses. A yearly cycle in daily data has a period of about 365, far too long for seasonal ARIMA, yet a handful of Fourier pairs handle it with ease. Set the period to 365.25 (or use an `msts` object) and pick K by AICc as usual.

## Summary

Fourier terms turn a long or complicated season into a few sine and cosine columns that drop straight into a regression. That one trick handles the cases a seasonal ARIMA cannot, namely very long periods and several overlapping cycles, using a model that stays small and forecasts cleanly.

| Step | Function | What it does |
|---|---|---|
| Build terms | fourier(x, K) | Turns the season into 2K sine and cosine columns |
| Fit the model | auto.arima(x, xreg =, seasonal = FALSE) | Fourier terms carry the season; ARIMA handles the rest |
| Choose K | compare AICc | Balances a smooth season against overfitting |
| Forecast | fourier(x, K, h) as xreg | Future terms come from the calendar alone |
| Many seasons | msts + fourier(K = c(...)) | One set of terms per seasonal period |

With those five moves you can model weekly sales or half-hourly demand without ever fighting a giant seasonal ARIMA.

## References

1. Hyndman, R.J., and Athanasopoulos, G. *Forecasting: Principles and Practice* (3rd ed), Section 10.5, Dynamic harmonic regression. [Link](https://otexts.com/fpp3/dhr.html)
2. Hyndman, R.J., and Athanasopoulos, G. *Forecasting: Principles and Practice* (3rd ed), Section 12.1, Complex seasonality. [Link](https://otexts.com/fpp3/complexseasonality.html)
3. forecast package documentation, fourier() reference. [Link](https://pkg.robjhyndman.com/forecast/reference/fourier.html)
4. fable package documentation, ARIMA() model reference. [Link](https://fable.tidyverts.org/reference/ARIMA.html)
5. forecast package documentation, tslm() reference. [Link](https://pkg.robjhyndman.com/forecast/reference/tslm.html)
6. Hyndman, R.J., and Athanasopoulos, G. *Forecasting: Principles and Practice* (3rd ed), book home. [Link](https://otexts.com/fpp3/)

## Continue Learning

- [SARIMA in R: How to Fit Seasonal ARIMA Models](SARIMA-in-R.html). The seasonal model that Fourier terms extend to long periods. Start here if the (P,D,Q)[m] notation is new to you.
- [ARIMAX in R: ARIMA with External Regressors](ARIMAX-in-R.html). Fourier terms are one kind of external regressor; this shows the general xreg idea with real predictors.
- [Dynamic Regression in R: Regression with ARIMA Errors](Dynamic-Regression-in-R.html). The broader family of models that dynamic harmonic regression belongs to.
