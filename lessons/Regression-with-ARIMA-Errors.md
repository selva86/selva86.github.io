---
title: "Dynamic Regression and Complex Seasonality Lesson 1: Fitting a regression with ARIMA errors"
catalog_blurb: "Fit a regression whose errors follow ARIMA, then forecast with real prediction intervals."
description: "See why ordinary regression residuals on a time series are autocorrelated, fit a regression with ARIMA errors in fable, and forecast with real intervals."
keywords: "regression with ARIMA errors, dynamic regression, ARIMA(y ~ x + pdq()), Durbin-Watson statistic, autocorrelated residuals, fable, TSLM, forecast prediction interval"
post_type: "LESSON"
curriculum_id: "5.70.1"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ts-dynamic"
course_title: "Dynamic Regression and Complex Seasonality"
course_lesson: "1"
course_total: "6"
course_landing: "Dynamic-Regression-and-Complex-Seasonality-Course.html"
course_next: "Dynamic-Harmonic-Regression.html"
course_prev: ""
---

=== step === cover
## Fitting a regression with ARIMA errors

Today let's understand how to fit a regression whose leftover error isn't independent noise, using a real electricity demand series to see exactly why that matters.

Here's the running example. Melbourne's electricity grid has to match demand every half hour, and demand climbs on hot days because every air conditioner in the city runs harder. We'll use 90 days of the grid's actual daily electricity demand, in gigawatt-hours (GWh), alongside that day's peak temperature, in degrees Celsius, from November 1, 2013 to January 29, 2014.

Plot one against the other and the relationship is easy to see, one point per day.

::widget chart-plotter {"data":[{"x":22.2,"y":107.47},{"x":25.4,"y":93.75},{"x":17.4,"y":89.47},{"x":17.5,"y":101.59},{"x":25.2,"y":92.83},{"x":30.3,"y":111.38},{"x":25.5,"y":112.39},{"x":18.2,"y":110.28},{"x":16.9,"y":96.75},{"x":17.8,"y":92.34},{"x":19.3,"y":110.74},{"x":15.7,"y":115.64},{"x":14.4,"y":119.61},{"x":16.8,"y":113.88},{"x":18.5,"y":110.42},{"x":17.8,"y":95.43},{"x":20.3,"y":90.34},{"x":27.5,"y":110.13},{"x":30.2,"y":114.2},{"x":18.6,"y":110.39},{"x":23.5,"y":109.98},{"x":22.5,"y":105.79},{"x":19.5,"y":93.91},{"x":19.2,"y":89.89},{"x":22.3,"y":104.78},{"x":28.4,"y":109.97},{"x":32.7,"y":119.67},{"x":26.5,"y":114.39},{"x":19.1,"y":106.3},{"x":19.3,"y":93.05},{"x":30.9,"y":93.41},{"x":35.4,"y":127.17},{"x":24.1,"y":118.13},{"x":21,"y":111.53},{"x":15.9,"y":110.45},{"x":19,"y":107.21},{"x":26.4,"y":92.26},{"x":27.4,"y":90.92},{"x":18.8,"y":109.41},{"x":20.4,"y":106.15},{"x":20.2,"y":107.04},{"x":23.3,"y":107.54},{"x":22.2,"y":108.25},{"x":19.6,"y":93.15},{"x":20.7,"y":89.56},{"x":20.9,"y":108.22},{"x":21.3,"y":112.44},{"x":25,"y":118.52},{"x":39.3,"y":142.39},{"x":26.1,"y":121.35},{"x":20.9,"y":98.43},{"x":28.3,"y":97.72},{"x":19.6,"y":98.85},{"x":23.2,"y":95.98},{"x":31.3,"y":88.41},{"x":27.4,"y":90.43},{"x":22,"y":94.75},{"x":35.7,"y":97.13},{"x":20.2,"y":84.09},{"x":21.9,"y":91.47},{"x":25.1,"y":92.19},{"x":26,"y":87.59},{"x":23,"y":94.18},{"x":22.2,"y":94.54},{"x":20.3,"y":86.9},{"x":26.1,"y":84.87},{"x":19.6,"y":97.62},{"x":20,"y":99.89},{"x":27.4,"y":102.67},{"x":32.4,"y":113.67},{"x":34,"y":129.06},{"x":23.3,"y":101.51},{"x":22.5,"y":93.83},{"x":30,"y":126.6},{"x":42.4,"y":159.95},{"x":41.5,"y":172.4},{"x":43.2,"y":173.36},{"x":43.1,"y":167.43},{"x":23.7,"y":110.76},{"x":22.3,"y":93.56},{"x":24,"y":114.06},{"x":23.1,"y":111.25},{"x":23.3,"y":110.23},{"x":29.6,"y":119.94},{"x":22.4,"y":112.78},{"x":20.3,"y":90.73},{"x":27,"y":91.01},{"x":34.5,"y":114.46},{"x":41.4,"y":154.52},{"x":24.5,"y":122.12}],"geoms":["point"],"x":"MaxTemp","y":"Demand"}

The points climb fairly steadily from left to right, and the correlation shown above the chart, r = 0.66, says the same thing in one number: hotter days tend to bring higher demand. That's the relationship a regression is built to capture, and it's exactly where we'll start.

=== step === concept
## The plain regression: demand on peak temperature

The simplest way to capture that relationship is an ordinary regression: predict demand from peak temperature, and let a single straight line summarize the two.

Build the daily series from vic_elec's half-hourly readings, calling the day's peak temperature MaxTemp and its total demand Demand, the same column names you will see in every fit from here on, then split it into a 90-day training window and the 7 days right after it.

```r
# Turn vic_elec's half-hourly demand and temperature into one daily row (GWh and degrees C), then split it into a 90-day training window and a 7-day test window
library(tsibble)
library(tsibbledata)
library(fable)
library(fabletools)
library(dplyr)

daily <- tsibbledata::vic_elec |>
  index_by(Day = Date) |>
  summarise(
    Demand  = sum(Demand) / 1000 / 2,   # half-hourly MW averaged into a daily GWh total
    MaxTemp = max(Temperature)
  )

train <- daily |> filter(Day >= as.Date("2013-11-01"), Day <= as.Date("2014-01-29"))
test  <- daily |> filter(Day >= as.Date("2014-01-30"), Day <= as.Date("2014-02-05"))

nrow(train)
#> [1] 90
nrow(test)
#> [1] 7
```

That's 90 days to fit the model on, and 7 held out to test it later. Now fit the regression itself, and read its report.

```r
# Fit an ordinary regression of demand on peak temperature, and report its coefficients
fit_tslm <- train |> model(tslm = TSLM(Demand ~ MaxTemp))
report(fit_tslm)
#> Series: Demand 
#> Model: TSLM 
#> 
#> Residuals:
#>      Min       1Q   Median       3Q      Max 
#> -31.4420  -9.2630   0.6055   9.0603  33.8528 
#> 
#> Coefficients:
#>             Estimate Std. Error t value Pr(>|t|)    
#> (Intercept)  62.4632     5.6694  11.018  < 2e-16 ***
#> MaxTemp       1.8334     0.2226   8.236 1.52e-12 ***
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#> 
#> Residual standard error: 13.84 on 88 degrees of freedom
#> Multiple R-squared: 0.4353,	Adjusted R-squared: 0.4289
#> F-statistic: 67.84 on 1 and 88 DF, p-value: 1.522e-12
```

TSLM stands for time series linear model, fable's version of an ordinary regression that also understands a tsibble's time index. Read the coefficients the way you would for any regression: the intercept, 62.4632, is the fitted line's predicted demand at a peak temperature of 0 degrees C, and the slope, 1.8334, says every extra degree of peak temperature adds 1.8334 GWh of demand. Both are far from zero (p = 1.52e-12 for the slope), and the model explains 43.53% of the variation in daily demand (R-squared = 0.4353).

The Residuals block above summarizes the residual, the gap between what the model predicts for a day and what demand that day actually was, across all 90 training days: at the extremes, the model was 31.4420 GWh too high on one day and 33.8528 GWh too low on another.

That looks like a solid regression. But a regression's p-values and standard errors are only trustworthy if its assumptions hold, and one of those assumptions is easy to miss on a time series. That's next.

=== step === concept
## Why an ordinary regression assumes independent errors
::prose-only the independence assumption is a verbal idea about how the data was generated; the by-day plot two steps ahead is where it actually gets checked

Look again at what ordinary regression, whether run through lm() or TSLM(), actually assumes about those residuals. It assumes each day's residual is independent of the day before's: knowing yesterday's leftover error tells you nothing about today's.

On an everyday dataset, that's usually a safe assumption. But a time series often breaks it. Take a Melbourne heatwave: air conditioners already running hard leave the first day's residual unusually high, and that extra demand doesn't reset overnight, so the second day tends to leave a residual in the same direction too.

So a series recorded in time order can carry exactly the kind of dependence ordinary regression assumes away. Whether that dependence actually shows up here is worth checking, not assuming. Checking it is next.

=== step === widget
## Checking the residuals the usual way

The usual way to check a regression's residuals is to plot them against the model's fitted values, and see whether they scatter randomly or reveal a pattern.

Pull the fitted values and residuals from the plain regression, and plot one against the other.

```r
# Plot the plain regression's own residuals against its own fitted values
diag_tslm <- augment(fit_tslm)

plot(diag_tslm$.fitted, diag_tslm$.resid,
     xlab = "fitted demand (GWh)", ylab = "residual (GWh)",
     main = "Residuals vs fitted, plain regression")
abline(h = 0, lty = 2)
```

That plot is built to catch two kinds of trouble. A funnel shape, where the spread of the residuals grows or shrinks as the fitted value rises, says the errors don't have constant variance. A curve, where the residuals bend up then down (or the other way), says the model missed some nonlinearity in the relationship. Neither shows up here: the residuals scatter in a fairly flat band across the range of fitted values, with no obvious funnel or curve.

Compare that against the textbook picture of exactly those two failures, next to a healthy fit.

::widget residual-plot {"start": "healthy"}

This widget runs its own small example, a healthy fit next to a funnel and a curve, but its healthy panel is exactly the flat, patternless band the demand regression's own plot just showed above.

But look closely at what this check actually uses: only the pairing of each residual with its own fitted value. It never once looks at which day came before which. So if the residuals silently depend on their neighbours in time, exactly the dependence just raised, this plot has no way to catch it. Plotting the same residuals against day order, next, catches that directly.

=== step === widget
## Plotting the same residuals against day order

Take the exact same 90 residuals, but this time plot them in the order the days actually happened, day 1 through day 90, instead of against the fitted values.

```r
# Plot the plain regression's residuals against day order instead of fitted value
resid_tslm <- residuals(fit_tslm)
r <- resid_tslm$.resid
```

See the same 90 residuals plotted against day order, and toggle between the line and the plain points.

::widget chart-plotter {"data":[{"x":1,"y":4.3},{"x":2,"y":-15.28},{"x":3,"y":-4.89},{"x":4,"y":7.04},{"x":5,"y":-15.83},{"x":6,"y":-6.64},{"x":7,"y":3.18},{"x":8,"y":14.45},{"x":9,"y":3.31},{"x":10,"y":-2.76},{"x":11,"y":12.9},{"x":12,"y":24.39},{"x":13,"y":30.75},{"x":14,"y":20.62},{"x":15,"y":14.04},{"x":16,"y":0.33},{"x":17,"y":-9.34},{"x":18,"y":-2.75},{"x":19,"y":-3.63},{"x":20,"y":13.83},{"x":21,"y":4.44},{"x":22,"y":2.08},{"x":23,"y":-4.3},{"x":24,"y":-7.77},{"x":25,"y":1.44},{"x":26,"y":-4.56},{"x":27,"y":-2.75},{"x":28,"y":3.34},{"x":29,"y":8.82},{"x":30,"y":-4.8},{"x":31,"y":-25.71},{"x":32,"y":-0.19},{"x":33,"y":11.49},{"x":34,"y":10.56},{"x":35,"y":18.83},{"x":36,"y":9.92},{"x":37,"y":-18.6},{"x":38,"y":-21.78},{"x":39,"y":12.48},{"x":40,"y":6.29},{"x":41,"y":7.54},{"x":42,"y":2.36},{"x":43,"y":5.09},{"x":44,"y":-5.25},{"x":45,"y":-10.85},{"x":46,"y":7.44},{"x":47,"y":10.93},{"x":48,"y":10.22},{"x":49,"y":7.87},{"x":50,"y":11.03},{"x":51,"y":-2.36},{"x":52,"y":-16.62},{"x":53,"y":0.46},{"x":54,"y":-9.02},{"x":55,"y":-31.44},{"x":56,"y":-22.26},{"x":57,"y":-8.05},{"x":58,"y":-30.79},{"x":59,"y":-15.41},{"x":60,"y":-11.14},{"x":61,"y":-16.29},{"x":62,"y":-22.54},{"x":63,"y":-10.46},{"x":64,"y":-8.62},{"x":65,"y":-12.78},{"x":66,"y":-25.45},{"x":67,"y":-0.78},{"x":68,"y":0.75},{"x":69,"y":-10.03},{"x":70,"y":-8.2},{"x":71,"y":4.26},{"x":72,"y":-3.67},{"x":73,"y":-9.88},{"x":74,"y":9.14},{"x":75,"y":19.75},{"x":76,"y":33.85},{"x":77,"y":31.7},{"x":78,"y":25.95},{"x":79,"y":4.84},{"x":80,"y":-9.78},{"x":81,"y":7.59},{"x":82,"y":6.43},{"x":83,"y":5.05},{"x":84,"y":3.21},{"x":85,"y":9.25},{"x":86,"y":-8.95},{"x":87,"y":-20.95},{"x":88,"y":-11.26},{"x":89,"y":16.16},{"x":90,"y":14.74}],"geoms":["line","point"],"x":"day","y":"residual"}

As a line, the residuals run in visible streaks: several days in a row above zero, then several days in a row below it, rather than bouncing back and forth randomly around zero. Switch to the point view and the same streaks are still there, just without a connecting line drawing your eye to them. Day order is what turns this from a scatter into a pattern.

Now put a number on that pattern. The Durbin-Watson statistic, d, checks exactly the thing the fitted-vs-residual plot could not: whether one residual relates to the one right before it.

```r
# Compute the Durbin-Watson statistic by hand: consecutive squared gaps over squared residuals
dw_num <- sum(diff(r)^2)
dw_den <- sum(r^2)
dw <- dw_num / dw_den

dw_num
#> [1] 14032.86
dw_den
#> [1] 16850.55
dw
#> [1] 0.8327838
```

When residuals are independent, d sits close to 2. When they trend the same way for a run of days, positive autocorrelation, the consecutive gaps in the numerator shrink relative to the residuals themselves in the denominator, and d falls well below 2. Here d = 0.8328, a long way from 2, matching the streaks you just saw.

There's a shortcut worth knowing: d is approximately 2 times (1 minus the residuals' lag-1 autocorrelation).

```r
# Check the shortcut against the exact value: d is approximately 2 * (1 - lag-1 autocorrelation)
n <- length(r)
r1 <- sum(r[1:(n - 1)] * r[2:n]) / sum(r^2)

r1
#> [1] 0.576616
2 * (1 - r1)
#> [1] 0.8467679
```

The residuals' lag-1 autocorrelation, r1, measures how strongly each residual lines up with the one right before it, on a scale from -1 to 1. Here r1 = 0.5766, a strong positive relationship, exactly the streaking in the plot above. And 2 times (1 minus 0.5766) is 0.8468, close to the exact d = 0.8328 computed by hand. Both numbers say the same thing: this regression's residuals are far from independent day to day.

=== step === quiz
## Quick check: reading the two residual plots

The plain regression's residual-vs-fitted plot looked healthy: no funnel, no curve. But the Durbin-Watson statistic on those same residuals came out at d = 0.8328, a long way below 2. What explains both of these being true at once?

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- The residual-vs-fitted plot never looks at the order the residuals arrived in, so it cannot see that a run of days above zero tends to be followed by another run below zero; d = 0.8328 is exactly that streaking showing up as a number. ::ok Right. A fitted-vs-residual plot pairs each residual only with its own fitted value, never with its neighbour in time, so it cannot catch this kind of dependence. Durbin-Watson checks day order directly, which is why it found what the first plot could not.
- The residual-vs-fitted plot must have been drawn incorrectly, since a healthy-looking plot and a bad Durbin-Watson statistic cannot both be true for the same fit. ::no Both plots used the exact same 90 residuals from the exact same fit. Nothing was drawn wrong; the two plots simply check for different kinds of trouble, and a model can pass one check while failing the other.
- d = 0.8328 means the regression explains about 83% of the variation in demand, so the two results actually agree that the model fits well. ::no That is R-squared's job, not Durbin-Watson's. This regression's R-squared was 0.4353, meaning it explains about 43.53% of the variation. Durbin-Watson has nothing to do with how much variance a model explains; it only checks whether residuals are independent from one day to the next.
- A Durbin-Watson value close to 2 would have signalled strong autocorrelation, so 0.8328 actually means these residuals are close to independent. ::no It runs the other way. d near 2 signals independence, and d far below 2, like 0.8328 here, signals strong positive autocorrelation, residuals that trend the same way for runs of several days, which is exactly the streaking the by-day plot showed.

=== step === concept
## Regression with ARIMA errors, defined
::prose-only the point is the model equation, restated as MathJax; the fable fit and its report are the concrete example, one step ahead

So the plain regression's residuals are not independent from one day to the next. That does not make temperature the wrong predictor. It means the part of demand that temperature does not explain still carries structure of its own, structure that repeats from one day to the next, and an ordinary regression has no way to use that structure.

Regression with ARIMA errors is built exactly for this. Instead of assuming the leftover error is independent noise, it lets that error follow its own ARIMA process, the same kind of model you would fit to an ordinary time series on its own.

Write the plain regression as \(y_t = \beta x_t + \eta_t\): demand on day \(t\) equals \(\beta\) times peak temperature on day \(t\), plus a leftover error \(\eta_t\). An ordinary regression assumes \(\eta_t\) is independent noise. Regression with ARIMA errors instead lets \(\eta_t\) follow its own ARIMA(p, d, q) process.

\[ y_t = \beta x_t + \eta_t \]
\[ \eta_t \sim \text{ARIMA}(p, d, q) \]

An ARIMA(p, d, q) process describes \(\eta_t\) using its own recent history: \(p\) autoregressive terms, weighting \(\eta_t\)'s own recent lags; \(d\) differences, removing any trend in \(\eta_t\) itself before the AR and MA terms are fit; and \(q\) moving-average terms, weighting the model's own recent forecast errors. \(\beta\) and the order \((p, d, q)\) get estimated together, in one fit, instead of in two separate steps.

That is the whole idea. The regression line still does the job it always did, explaining demand from temperature, but whatever it leaves over, \(\eta_t\), gets modeled too, instead of thrown away as assumed-independent noise. Fitting one in fable, and reading its report, is next.

=== step === concept
## Fitting ARIMA(Demand ~ MaxTemp + pdq()) in fable

fable fits this with the same ARIMA() function used for an ordinary ARIMA model, just with a formula that includes a predictor. Set d = 0 inside pdq() to tell fable the leftover error itself needs no differencing, since demand's rise and fall over these 90 days already tracks temperature closely, and let fable's stepwise search pick p and q on its own.

Fit it, and read what fable reports.

```r
# Fit a regression with ARIMA errors: MaxTemp explains demand, and fable searches for the ARIMA order that best explains the leftover error
fit_arima <- train |> model(dynamic = ARIMA(Demand ~ MaxTemp + pdq(d = 0)))
report(fit_arima)
#> Series: Demand 
#> Model: LM w/ ARIMA(1,0,1)(2,0,0)[7] errors 
#> 
#> Coefficients:
#>          ar1     ma1   sar1    sar2  MaxTemp  intercept
#>       0.7091  0.2682  0.378  0.3630   1.0572    81.9500
#> s.e.  0.0936  0.1375  0.108  0.1181   0.1371    11.5847
#> 
#> sigma^2 estimated as 72.46:  log likelihood=-320.44
#> AIC=654.89   AICc=656.25   BIC=672.39
```

Read the model line the way you'd read a sentence: "LM w/ ARIMA(1,0,1)(2,0,0)[7] errors". LM is the regression half, the same job TSLM did before. ARIMA(1,0,1) is the non-seasonal part of the error: one AR term, no differencing, one MA term.

(2,0,0)[7] is a seasonal part on top of that: two seasonal AR terms at a period of 7, one week. fable found all of this on its own, without being told the order in advance.

That weekly period makes sense for electricity demand: buildings and businesses run on a weekly rhythm, weekday against weekend, that temperature alone doesn't capture. The ARIMA errors give the model a way to pick that rhythm up instead of leaving it in the leftover error.

=== step === concept
## Reading the two halves of the report

That report actually splits cleanly into two halves. ar1 = 0.7091, ma1 = 0.2682, sar1 = 0.378 and sar2 = 0.3630 belong to the ARIMA-error half: how strongly the leftover error carries over from one day, and one week, to the next. MaxTemp = 1.0572 and intercept = 81.9500 belong to the regression half, the same job the plain TSLM did earlier.

But look at that MaxTemp coefficient again. Back in the plain regression, it was 1.8334. Here it has fallen to 1.0572, nearly half. Why?

In the plain regression, the day-to-day persistence in demand, a heatwave stretching demand upward for several days in a row, had nowhere else to go. Some of it leaked into the temperature slope, inflating it, because temperature and that persistence both tend to run high during a heatwave. Once the ARIMA terms are there to absorb that persistence directly, the temperature slope shrinks down to what temperature, on its own, day by day, actually explains.

Check what happened to the residuals' lag-1 autocorrelation now that the leftover error is modeled directly, instead of assumed independent.

```r
# Compare the two fits' coefficients, and check whether the residuals' day-to-day dependence is gone
tidy(fit_arima)
#> # A tibble: 6 x 6
#>   .model  term      estimate std.error statistic  p.value
#>   <chr>   <chr>        <dbl>     <dbl>     <dbl>    <dbl>
#> 1 dynamic ar1          0.709    0.0936      7.58 3.02e-11
#> 2 dynamic ma1          0.268    0.138       1.95 5.43e- 2
#> 3 dynamic sar1         0.378    0.108       3.50 7.30e- 4
#> 4 dynamic sar2         0.363    0.118       3.07 2.79e- 3
#> 5 dynamic MaxTemp      1.06     0.137       7.71 1.58e-11
#> 6 dynamic intercept   81.9     11.6         7.07 3.15e-10

resid_dyn <- residuals(fit_arima)
rd <- resid_dyn$.resid
n2 <- length(rd)
r1_dyn <- sum(rd[1:(n2 - 1)] * rd[2:n2]) / sum(rd^2)
round(r1_dyn, 4)
#> [1] 0.0077
```

0.0077 is about as close to zero as real data gets. The plain regression left a lag-1 autocorrelation of 0.5766 sitting in its residuals; modelling that leftover error as ARIMA(1,0,1)(2,0,0)[7] instead of ignoring it brought that number down to almost nothing. The day-to-day dependence that broke the plain regression's independence assumption is, for the most part, gone.

The coefficients read cleanly and the residuals behave. The real test, though, is whether this model actually forecasts better. That's next.

=== step === widget
## Forecasting the next 7 days from known future temperature

Both models can forecast the 7 held-out days, 2014-01-30 through 2014-02-05, using that week's actual peak temperatures as the known future MaxTemp values.

There's a catch worth naming here: forecasting Demand ~ MaxTemp needs a MaxTemp value for every day you want to forecast, not just for the 90 training days. In a live forecast you would need tomorrow's temperature forecast for that. To compare the two models fairly, we use the 7 test days' actual recorded peak temperatures, 25.7 to 38.6 degrees C, as if they were known in advance.

Forecast both models on the same 7 days, and compare their accuracy against what demand actually did.

```r
# Forecast the 7 held-out days from each fitted model, using their real peak temperatures
fc_tslm <- fit_tslm  |> forecast(new_data = test)
fc_dyn  <- fit_arima |> forecast(new_data = test)

bind_rows(accuracy(fc_tslm, test), accuracy(fc_dyn, test)) |>
  select(.model, RMSE, MAE)
#> # A tibble: 2 x 3
#>   .model   RMSE   MAE
#>   <chr>   <dbl> <dbl>
#> 1 tslm     9.27  6.82
#> 2 dynamic 13.5  11.5
```

On point forecasts alone, plain TSLM actually wins this particular week: RMSE 9.27 against 13.5 for the dynamic model, and MAE 6.82 against 11.5. That's worth sitting with, since it's not the result you might expect after everything ARIMA errors just fixed. But point accuracy on one 7-day week is not the whole story. Look at what each model says about its own uncertainty.

Compare the width of each model's 95% forecast interval, at each of the 7 days ahead.

```r
# Compare the 95% interval width at each day ahead: TSLM's stays flat, the dynamic model's grows
ci_tslm <- hilo(fc_tslm$Demand, 95)
ci_dyn  <- hilo(fc_dyn$Demand, 95)

data.frame(
  DayAhead      = 1:7,
  TSLM_width    = round(ci_tslm$upper - ci_tslm$lower, 2),
  Dynamic_width = round(ci_dyn$upper - ci_dyn$lower, 2)
)
#>   DayAhead TSLM_width Dynamic_width
#> 1        1      54.69         33.37
#> 2        2      54.58         46.66
#> 3        3      54.69         52.07
#> 4        4      55.89         54.59
#> 5        5      55.14         55.82
#> 6        6      54.55         56.42
#> 7        7      54.78         56.72
```

TSLM's interval barely moves: about 55 GWh wide whether it's forecasting 1 day ahead or 7. The dynamic model's interval starts much narrower, 33.37 GWh at day 1, then grows with every day further out, reaching 56.72 GWh by day 7. That growth is what a forecast interval should do: widen as the horizon stretches out and there is more time for demand to drift from what the model has already seen. TSLM's flat interval cannot do that; it reports the same width at day 7 as at day 1, regardless of how much further into the unknown day 7 actually is.

See the two forecasts and the actual demand side by side, over the 7 test days.

::widget chart-plotter {"data":[{"x":1,"y":128.9,"fill":"Actual"},{"x":2,"y":129.7,"fill":"Actual"},{"x":3,"y":120.6,"fill":"Actual"},{"x":4,"y":131.6,"fill":"Actual"},{"x":5,"y":133.5,"fill":"Actual"},{"x":6,"y":110.9,"fill":"Actual"},{"x":7,"y":118.3,"fill":"Actual"},{"x":1,"y":116,"fill":"TSLM forecast"},{"x":2,"y":111.6,"fill":"TSLM forecast"},{"x":3,"y":116,"fill":"TSLM forecast"},{"x":4,"y":133.2,"fill":"TSLM forecast"},{"x":5,"y":124.6,"fill":"TSLM forecast"},{"x":6,"y":109.6,"fill":"TSLM forecast"},{"x":7,"y":118.4,"fill":"TSLM forecast"},{"x":1,"y":123.5,"fill":"Dynamic forecast"},{"x":2,"y":121.5,"fill":"Dynamic forecast"},{"x":3,"y":105.1,"fill":"Dynamic forecast"},{"x":4,"y":108,"fill":"Dynamic forecast"},{"x":5,"y":116.6,"fill":"Dynamic forecast"},{"x":6,"y":120.3,"fill":"Dynamic forecast"},{"x":7,"y":119.8,"fill":"Dynamic forecast"}],"geoms":["line","point"],"x":"day","y":"Demand"}

So TSLM happened to land closer this particular week, but its flat interval never earns that: it reports the same spread about day 7 as it does about day 1, regardless of how much less is actually known by then. The dynamic model's widening interval is the more accurate picture of how much is actually known at each horizon.

=== step === quiz
## Quick check: what regression with ARIMA errors actually buys you

On the 7 test days, TSLM's point forecasts beat the dynamic model's, RMSE 9.27 against 13.5, but TSLM's 95% interval stayed a flat 55 GWh wide at every horizon while the dynamic model's grew from 33.37 GWh at day 1 to 56.72 GWh at day 7. What does this actually tell you?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- TSLM's smaller RMSE proves it is the better model overall, since a smaller test error always means a more trustworthy forecast, regardless of how its interval behaves. ::no
- The dynamic model's growing interval is a flaw: a good forecast should get more confident, not less, the further out it goes. ::no
- TSLM's flat interval does not widen with the forecast horizon, so on a different week its point forecast could miss by far more than 55 GWh with no warning; the dynamic model's interval, growing from 33.37 GWh to 56.72 GWh, more accurately reflects how much less is known about day 7 than about day 1, even though this particular week its point forecast landed further from the actual demand. ::ok Right. A smaller test error on one week says nothing about whether an interval's width behaves correctly, and TSLM's flat 55 GWh band cannot tell the difference between a 1-day-ahead forecast and a 7-day-ahead one. The dynamic model's widening interval is doing what a forecast interval should, even though its point forecast happened to land further off this particular week.
- Since both intervals reach roughly 55 to 57 GWh wide by day 7, the two models actually agree on how uncertain a week-ahead forecast is, and the RMSE gap is the only real difference between them. ::no They only agree at day 7. At day 1, TSLM's interval is already about 55 GWh wide while the dynamic model's is 33.37 GWh, and that gap, not just the day-7 numbers, is what shows the two models disagree about how quickly uncertainty should grow with the horizon.

=== step === tryit
## Your turn: fit the regression with ARIMA errors yourself

Fit that same regression with ARIMA errors yourself, on the training tsibble, and see if you land on the same order fable found earlier in the lesson.

```r
# Fit a regression with ARIMA errors on train: Demand explained by MaxTemp, letting the leftover error follow an ARIMA process
library(fable)

# Complete this line: call ARIMA(Demand ~ MaxTemp + pdq(d = 0)) inside
# model(), named check, on the same 90-day train tsibble, then call
# report() on it. Press Check when you have it.

```
::check {"regex": "pdq[(]d\\s*=\\s*0[)]", "gate": true, "difficulty": "intermediate", "ok": "Right: the same LM w/ ARIMA(1,0,1)(2,0,0)[7] errors as before, with MaxTemp's coefficient back down at 1.0572 once the ARIMA terms take over the leftover persistence.", "no": "Call ARIMA(Demand ~ MaxTemp + pdq(d = 0)) inside model(), on train, the same pattern fit_arima used earlier."}
::solution
```r
# Fit the same regression with ARIMA errors, and confirm it reproduces the same order
fit_check <- train |> model(check = ARIMA(Demand ~ MaxTemp + pdq(d = 0)))
report(fit_check)
#> Series: Demand 
#> Model: LM w/ ARIMA(1,0,1)(2,0,0)[7] errors 
#> 
#> Coefficients:
#>          ar1     ma1   sar1    sar2  MaxTemp  intercept
#>       0.7091  0.2682  0.378  0.3630   1.0572    81.9500
#> s.e.  0.0936  0.1375  0.108  0.1181   0.1371    11.5847
#> 
#> sigma^2 estimated as 72.46:  log likelihood=-320.44
#> AIC=654.89   AICc=656.25   BIC=672.39
```

Same model, same order, same coefficients as before. fable's stepwise search is deterministic on the same data and the same formula, so fitting it again never turns up a different answer.

=== step === concept
## References

- [Forecasting: Principles and Practice (3rd ed.)](https://otexts.com/fpp3/), chapter 10, Dynamic regression models - Hyndman and Athanasopoulos, the source of the regression-with-ARIMA-errors model and its \(y_t = \beta x_t + \eta_t\) notation used throughout this lesson.
- [fable package reference](https://fable.tidyverts.org/) - documentation for ARIMA(), pdq(), TSLM(), report() and forecast().
- [tsibbledata::vic_elec documentation](https://tsibbledata.tidyverts.org/reference/vic_elec.html) - half-hourly electricity demand and temperature for Victoria, Australia, source of the Melbourne demand series used here, from the Australian Energy Market Operator.
- [Durbin-Watson statistic](https://en.wikipedia.org/wiki/Durbin%E2%80%93Watson_statistic) - Durbin, J. and Watson, G.S. (1950, 1951), "Testing for Serial Correlation in Least Squares Regression I and II", Biometrika, the original source of the statistic.

=== step === complete
## What you can do now

You can tell when an ordinary regression on a time series needs a second look: plot its residuals against day order, not only against its fitted values, and compute the Durbin-Watson statistic by hand from the residuals' own consecutive differences.

You can state the regression-with-ARIMA-errors model, \(y_t = \beta x_t + \eta_t\) with \(\eta_t \sim \text{ARIMA}(p, d, q)\), and explain why letting the leftover error carry its own AR and MA terms pulls an inflated regression coefficient back down to what the predictor, on its own, actually explains.

You can fit one in fable with ARIMA(y ~ x + pdq()), read report()'s two halves, the ARIMA-error coefficients and the regression coefficients, and forecast from it using known future predictor values, the way you just did with the 7 days of held-out temperature.

Next, you will add Fourier terms on top of this same ARIMA-errors idea, to handle a seasonal period too long for seasonal ARIMA to reach.
