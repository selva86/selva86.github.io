---
title: "Forecast Accuracy in R: MAE, RMSE, MAPE, and MASE"
slug: "Forecast-Accuracy-in-R"
description: "Measure forecast accuracy in R with MAE, RMSE, MAPE, and MASE. Learn what each metric means, compute them by hand, then get them all at once from accuracy()."
keywords: "forecast accuracy in R, MAE, RMSE, MAPE, MASE, accuracy() function, forecast error, forecast evaluation, time series accuracy, mean absolute scaled error"
auto_link_terms: "forecast accuracy in R|forecast accuracy|MAE|RMSE|MAPE|MASE|mean absolute error|root mean squared error|mean absolute percentage error|mean absolute scaled error|forecast error|accuracy()"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-18"
curriculum_id: "3.8.15"
post_type: "C"
sidebar_section: "Time Series"
sidebar_title: "Forecast Accuracy"
sidebar_order: "19"
difficulty: "Intermediate"
---

<p class="lead">Forecast accuracy is how close your predictions come to what actually happened. In R you measure it with four standard metrics, MAE, RMSE, MAPE, and MASE, and the <code>accuracy()</code> function in the forecast package reports all of them from a single call.</p>

## What is forecast error, and why measure accuracy?

A forecast is only useful if you know how wrong it usually is. Every accuracy metric on this page starts from one simple number: the forecast error, which is the actual value minus the value you predicted, computed for each time period. Once you are comfortable with that single quantity, every metric that follows is just a different way of averaging it.

Let's make it concrete. Suppose you forecast weekly demand for a product and, after six weeks, you line up what you predicted against what actually sold. Subtracting one from the other gives you the error for each week.

```r title="Compute the forecast error"
actual   <- c(112, 118, 132, 129, 121, 135)   # what really happened
forecast <- c(120, 115, 128, 133, 118, 140)   # what we predicted
error    <- actual - forecast
error
#> [1] -8  3  4 -4  3 -5
```

We stored six weeks of actual sales and the six matching forecasts, then subtracted the forecasts from the actuals. R does this element by element, so week 1 gives 112 minus 120 = -8, week 2 gives 118 minus 115 = 3, and so on down the vector.

A negative error means the forecast was too high (we predicted 120 but only sold 112). A positive error means it was too low. No single week tells you how good the forecast is overall, which is exactly why we need to boil these six numbers down to one.

It helps to see the errors next to the numbers they came from. The absolute error, the size of the miss regardless of direction, is what most metrics actually work with.

```r title="Lay the errors out in a table"
data.frame(week = 1:6, actual, forecast, error, abs_error = abs(error))
#>   week actual forecast error abs_error
#> 1    1    112      120    -8         8
#> 2    2    118      115     3         3
#> 3    3    132      128     4         4
#> 4    4    129      133    -4         4
#> 5    5    121      118     3         3
#> 6    6    135      140    -5         5
```

The `abs_error` column drops the sign, so an 8-unit miss below and an 8-unit miss above count the same. Summing or averaging that column is the foundation of every metric ahead.

One more habit before the metrics: you should always score a forecast on data the model has not seen. In practice you hold back the most recent slice of history as a test set, forecast it, then compare against what really happened. Grading a model on the same data it learned from flatters it.

![Hold out the most recent data as a test set, forecast it, then compare against the actuals.](screenshots/Forecast-Accuracy-in-R-holdout-split.webp)
*Figure 1: Hold out the most recent data as a test set, forecast it, then compare against the actuals to score accuracy.*

[KEY INSIGHT]
**Every accuracy metric is just a summary of the error vector.** MAE, RMSE, MAPE, and MASE differ only in how they average those per-period errors, so once you understand the errors you already understand the metrics.

**Try it:** Compute the forecast error for a new three-week run of actuals and forecasts.

```r title="Your turn: compute the error vector"
ex_actual   <- c(50, 60, 55)
ex_forecast <- c(48, 63, 52)

# Subtract the forecast from the actual, then print the result
# your code here
#> Expected: 2 -3 3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Error vector solution"
ex_error <- ex_actual - ex_forecast
ex_error
#> [1]  2 -3  3
```

**Explanation:** Subtraction is vectorised, so R pairs each actual with its forecast automatically. Week 1 beat its forecast by 2, week 2 fell short by 3, week 3 beat it by 3.

</details>

## How do MAE and RMSE measure the size of errors?

The error vector has six numbers and mixed signs. To report a single "typical error", you have to average them, and the first question is what to do about the signs. If you just averaged the raw errors, positives and negatives would cancel and a wildly wrong forecast could look perfect. So both workhorse metrics remove the sign first.

Mean Absolute Error (MAE) takes the absolute value of each error, then averages. Root Mean Squared Error (RMSE) squares each error (which also removes the sign), averages, then takes the square root to get back to the original units.

In symbols, with $n$ errors:

$$\text{MAE} = \frac{1}{n}\sum_{t=1}^{n} |e_t| \qquad \text{RMSE} = \sqrt{\frac{1}{n}\sum_{t=1}^{n} e_t^2}$$

Where:

- $e_t$ = the forecast error in period $t$ (actual minus forecast)
- $n$ = the number of periods you are scoring
- $|e_t|$ = the absolute value, or size, of that error

*If the notation is not your thing, skip it: the two lines of code below say exactly the same thing.*

Both are a one-liner in R. We reuse the `error` vector from the last section, so there is nothing new to set up.

```r title="Compute MAE and RMSE"
mae  <- mean(abs(error))      # average size of the errors
rmse <- sqrt(mean(error^2))   # square, average, then square-root
c(MAE = mae, RMSE = rmse)
#>      MAE     RMSE 
#> 4.500000 4.813176 
```

The first line turns `-8 3 4 -4 3 -5` into the sizes `8 3 4 4 3 5` and averages them to 4.5. The second squares each error, averages, then square-roots. On average this forecast misses by about 4.5 units (MAE), and RMSE is a touch higher at 4.81.

They are close here because no single week is dramatically worse than the others. When RMSE and MAE diverge, that gap is telling you something, which is the next thing to see.

RMSE and MAE actually answer slightly different questions. Because RMSE squares the errors before averaging, one big miss counts far more than several small ones. Watch what happens to two error patterns that share the identical MAE.

```r title="Show how RMSE punishes big misses"
steady <- c(2, -2, 2, -2, 2, -2)   # errors that are all the same size
spiky  <- c(0, 0, 0, 0, 0, -12)    # five perfect forecasts, one big miss

c(MAE_steady = mean(abs(steady)), RMSE_steady = sqrt(mean(steady^2)))
#> MAE_steady RMSE_steady 
#>          2           2 
c(MAE_spiky  = mean(abs(spiky)),  RMSE_spiky  = sqrt(mean(spiky^2)))
#> MAE_spiky RMSE_spiky 
#>  2.000000  4.898979 
```

Both error vectors average to an absolute error of 2, so their MAE is identical. But the spiky vector concentrates all its error in one week, and squaring 12 blows it up, so its RMSE is 4.9 versus 2.0 for the steady vector.

That is the core difference between the two. MAE weights every unit of error equally. RMSE weights larger errors more heavily, because squaring makes big misses count for more. If a single catastrophic forecast hurts you far more than several small ones (think of an inventory stockout), prefer RMSE. If all errors hurt in proportion to their size, MAE is the more honest summary.

[TIP]
**RMSE is always at least as large as MAE.** The two are equal only when every error is the same size, and the bigger the spread in your errors, the wider the gap, which makes that gap a quick read on how uneven your misses are.

**Try it:** Compute the MAE and RMSE for a set of four errors that includes two larger misses.

```r title="Your turn: compute MAE and RMSE"
ex_error <- c(3, -3, 6, -6)

# Compute the MAE and RMSE of ex_error
# your code here
#> Expected: MAE 4.5, RMSE about 4.74
```

<details>
<summary>Click to reveal solution</summary>

```r title="MAE and RMSE solution"
c(MAE = mean(abs(ex_error)), RMSE = sqrt(mean(ex_error^2)))
#>      MAE     RMSE 
#> 4.500000 4.743416 
```

**Explanation:** Same recipe as before. The larger errors (6 and -6) get squared, so they pull RMSE above MAE.

</details>

## How does MAPE turn errors into a percentage?

MAE and RMSE are in the units of your data. That is fine until someone asks "is a miss of 4.5 good?" You cannot answer without knowing the scale. Being off by 4.5 units on a base of 5 is terrible; on a base of 5,000 it is excellent. Mean Absolute Percentage Error (MAPE) fixes this by expressing each error as a percentage of the actual value, then averaging.

$$\text{MAPE} = \frac{100}{n}\sum_{t=1}^{n} \left| \frac{e_t}{y_t} \right|$$

Where $y_t$ is the actual value in period $t$ and $e_t$ is its forecast error.

For our demand example, we divide each error by the actual sales that week, then average.

```r title="Compute MAPE"
mape <- mean(abs(error / actual)) * 100
round(mape, 2)
#> [1] 3.67
```

Each weekly error is divided by that week's actual, turned into a size with `abs()`, averaged, and multiplied by 100 to read as a percentage. On average the forecast is off by about 3.7 percent. That number means the same thing whether you sell hundreds or millions of units, which is why it is the metric executives reach for.

MAPE has one serious weakness, though. Because it divides by the actual value, an actual of zero breaks it completely.

```r title="See MAPE break near zero"
actual_z   <- c(5, 2, 1, 0, 3, 4)
forecast_z <- c(6, 3, 2, 1, 2, 5)
mean(abs((actual_z - forecast_z) / actual_z)) * 100
#> [1] Inf
```

The fourth actual is 0. Dividing that week's error by zero gives infinity, and a single `Inf` makes the whole average `Inf`. Any series that can hit zero, such as intermittent demand, rainfall, or defect counts, can make MAPE undefined or absurdly large.

MAPE is also asymmetric: it penalises a forecast that is too high differently from one that is too low, because a percentage error is bounded below by zero but unbounded above. Use it for strictly positive series that stay comfortably above zero, like the airline data later in this tutorial, and reach for another metric otherwise.

[WARNING]
**MAPE is undefined when any actual value is zero and gets unstable as values approach zero.** A single zero turns the whole score into Inf, so never use MAPE on intermittent or count data that can bottom out.

**Try it:** Compute the MAPE for three actuals and their forecasts, rounded to two decimals.

```r title="Your turn: compute MAPE"
ex_a <- c(200, 250, 300)   # actuals
ex_f <- c(190, 265, 285)   # forecasts

# Compute the MAPE (mean absolute percentage error), rounded to 2 decimals
# your code here
#> Expected: 5.33
```

<details>
<summary>Click to reveal solution</summary>

```r title="MAPE solution"
round(mean(abs((ex_a - ex_f) / ex_a)) * 100, 2)
#> [1] 5.33
```

**Explanation:** Each error is divided by its own actual, turned into a size, averaged, and scaled to a percentage. The forecasts are off by about 5.3 percent on average.

</details>

## Why does MASE let you compare forecasts across different series?

Here is a problem none of the previous metrics solve. Suppose you forecast daily revenue in dollars and daily website visits as a count, and you want to know which forecast is better in a like-for-like way. MAE and RMSE are in different units, so you cannot compare them. MAPE is comparable in principle but breaks near zero. Mean Absolute Scaled Error (MASE) was designed for exactly this.

The idea is to report your error relative to a dead-simple benchmark instead of on its own. The benchmark is the naive forecast, which just predicts that each value equals the previous one. MASE divides your model's MAE by the MAE that naive forecast would have made on the training data. The result is a pure ratio with no units.

$$\text{MASE} = \frac{\text{MAE of your forecast}}{\text{MAE of a naive forecast on the training data}}$$

The denominator, the naive benchmark's error, is just the average absolute one-step change in the training series.

Say your model's MAE on the test set is the 4.5 we computed earlier, and here is the training history the model learned from. We compute the benchmark from that training data, then form the ratio.

```r title="Compute MASE against a naive benchmark"
train <- c(100, 104, 98, 110, 115, 120, 118)
naive_mae <- mean(abs(diff(train)))   # average one-step change in the training data
mase <- mae / naive_mae
c(naive_mae = naive_mae, MASE = mase)
#> naive_mae      MASE 
#> 5.6666667 0.7941176 
```

`diff(train)` gives the week-to-week changes (`4 -6 12 5 5 -2`), and their average absolute size is 5.67. Dividing our model's MAE of 4.5 by that benchmark gives a MASE of 0.79.

Read MASE against the number 1. A value below 1 means your forecast beats the naive "tomorrow equals today" benchmark; above 1 means it is worse than that trivial rule and you should go back to the drawing board. Our 0.79 says the model's errors are about 79 percent the size of the naive benchmark's, a modest but real improvement. Because it is a unitless ratio, you can average MASE across a dollar series and a visits series and compare them directly.

[KEY INSIGHT]
**MASE is the only one of the four metrics you can safely average across different series.** It rescales every forecast against a naive benchmark, so a MASE of 1 always means the same thing, as good as predicting no change, no matter what the data measures.

**Try it:** Compute MASE by hand from a training history and a model's test-set errors.

```r title="Your turn: compute MASE"
ex_train <- c(20, 22, 19, 25, 24)   # training history
ex_err   <- c(2, -1, 3)             # your model's test-set errors

# MASE = mean absolute error of ex_err, divided by the naive benchmark
# (the mean absolute one-step change in ex_train). Round to 3 decimals.
# your code here
#> Expected: 0.667
```

<details>
<summary>Click to reveal solution</summary>

```r title="MASE solution"
round(mean(abs(ex_err)) / mean(abs(diff(ex_train))), 3)
#> [1] 0.667
```

**Explanation:** The model's MAE is 2 and the naive benchmark's MAE is 3, so the ratio is 0.667. Below 1, so the forecast beats naive.

</details>

## How do you compute every metric at once with accuracy()?

Computing each metric by hand is great for understanding, but you would not want to do it every time. The forecast package bundles all of them into one function, `accuracy()`. You hand it a forecast object and the actual test values, and it returns a table with ME, RMSE, MAE, MPE, MAPE, MASE, and a couple of extras, split into a training-set row and a test-set row.

Let's do it properly on real data. `AirPassengers` is a built-in monthly series of airline passengers from 1949 to 1960. We train on everything up to the end of 1959 and hold out 1960 as the test set. The `window()` function slices a time series by date.

```r title="Score a forecast with accuracy()"
library(forecast)

train_ap <- window(AirPassengers, end = c(1959, 12))   # fit on 1949-1959
test_ap  <- window(AirPassengers, start = c(1960, 1))  # hold out 1960

fit <- ets(train_ap)                       # fit an exponential smoothing model
fc  <- forecast(fit, h = length(test_ap))  # forecast the 12 test months
round(accuracy(fc, test_ap), 3)
#>                 ME   RMSE    MAE   MPE  MAPE  MASE  ACF1 Theil's U
#> Training set  1.511  9.354  6.981 0.442 2.761 0.229 0.046        NA
#> Test set     12.085 27.398 22.805 2.052 4.656 0.749 0.484     0.542
```

We split the series, fit an exponential smoothing model with `ets()`, forecast the 12 held-out months, and pass the forecast plus the true 1960 values to `accuracy()`. The Training set row scores the fit on data the model learned from; the Test set row scores it on the held-out year the model never saw.

Always read the Test set row, because the training row flatters the model. On unseen 1960 data the forecast is off by about 23 passengers on average (MAE), 27 in RMSE terms, and 4.7 percent (MAPE). The Test-set MASE of 0.749 is the headline: below 1, so the model comfortably beats a naive benchmark. The mean error (ME) of +12 tells you the model slightly under-forecasts the fast-growing 1960 traffic. ME and MPE (its percentage version) keep the sign of the error rather than removing it, so unlike the size metrics they measure directional bias, whether the forecast tends to run high or low, not how big the misses are.

[NOTE]
**Read the Test set row, not the Training set row.** Training-set metrics measure fit on data the model already saw and are almost always rosier than real forecasting performance, while the test row is the honest estimate of how the model behaves on new data.

**Try it:** Build a plain naive forecast of 1960 and pull its Test-set MAPE from the accuracy table.

```r title="Your turn: score a naive forecast"
# naive() forecasts every future month as the last observed value.
ex_naive <- naive(train_ap, h = length(test_ap))

# Index the accuracy table for the Test set MAPE, rounded to 3 decimals
# your code here
#> Expected: 14.251
```

<details>
<summary>Click to reveal solution</summary>

```r title="Naive MAPE solution"
round(accuracy(ex_naive, test_ap)["Test set", "MAPE"], 3)
#> [1] 14.251
```

**Explanation:** The naive forecast's MAPE of 14.3 percent is far worse than the ETS model's 4.7 percent, because naive ignores both the upward trend and the seasonality in the data.

</details>

## Which forecast accuracy metric should you use?

There is no single best metric; the right choice depends on the question you are answering. Here is how the four compare on the things that usually decide it.

| Metric | Units | Robust to outliers | Handles zeros | Compare across series | Reach for it when |
|---|---|---|---|---|---|
| MAE | Data's own units | Yes | Yes | No | You want a plain, robust average error |
| RMSE | Data's own units | No, punishes spikes | Yes | No | Large single misses are especially costly |
| MAPE | Percentage | Somewhat | No, breaks at zero | Loosely | You need a scale-free number on positive data |
| MASE | Unitless ratio | Yes | Yes | Yes | You compare forecasts across different series |

![Pick the metric that matches what you care about most.](screenshots/Forecast-Accuracy-in-R-metric-decision.webp)
*Figure 2: Pick the metric that matches what you care about most.*

In day-to-day work it helps to have the scale metrics in one place. This small helper returns MAE, RMSE, and MAPE for any pair of actuals and forecasts, so you never retype the recipe.

```r title="Bundle the scale metrics into a helper"
forecast_metrics <- function(actual, forecast) {
  e <- actual - forecast
  c(MAE  = mean(abs(e)),
    RMSE = sqrt(mean(e^2)),
    MAPE = mean(abs(e / actual)) * 100)
}

round(forecast_metrics(actual, forecast), 3)
#>   MAE  RMSE  MAPE 
#> 4.500 4.813 3.667 
```

The function computes the error inside, then returns the three metrics as a named vector. Calling it on our original demand example reproduces the numbers we found by hand earlier. Wrapping the recipe like this gives you consistent output every time and makes model comparisons a single line.

[TIP]
**Report at least two metrics: one on the data's scale plus MASE.** A scale metric like RMSE or MAE tells you the real-world size of the error, while MASE tells you whether the model is actually beating a trivial benchmark, and MAPE on its own can mislead.

**Try it:** Use `forecast_metrics()` to score two competing forecasts and see which one wins.

```r title="Your turn: compare two forecasts"
ex_actual2 <- c(30, 32, 35, 33, 31)
ex_fcast_a <- c(29, 33, 34, 34, 30)
ex_fcast_b <- c(31, 31, 37, 31, 33)

# Run forecast_metrics() on each forecast and stack the results with rbind().
# Which one has the lower RMSE? Round to 3 decimals.
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Compare two forecasts solution"
round(rbind(A = forecast_metrics(ex_actual2, ex_fcast_a),
            B = forecast_metrics(ex_actual2, ex_fcast_b)), 3)
#>   MAE  RMSE  MAPE
#> A 1.0 1.000 3.114
#> B 1.6 1.673 4.937
```

**Explanation:** Forecast A wins on all three metrics; its RMSE of 1.0 is well below B's 1.673, so A is the one to ship.

</details>

## Complete Example

Let's put the whole workflow together the way you would in practice: split the data, fit a model, forecast the holdout, and compare it against a benchmark to decide whether the model is worth shipping. We already have the ETS forecast `fc` and the held-out `test_ap` from earlier. The natural benchmark for a monthly, seasonal series is the seasonal naive forecast, `snaive()`, which predicts that each month equals the same month one year earlier.

```r title="Compare ETS against a seasonal-naive benchmark"
naive_fc <- snaive(train_ap, h = length(test_ap))   # each month = same month last year
cols <- c("RMSE", "MAE", "MAPE", "MASE")

ets_row    <- accuracy(fc,       test_ap)["Test set", cols]
snaive_row <- accuracy(naive_fc, test_ap)["Test set", cols]
round(rbind(ETS = ets_row, Seasonal_naive = snaive_row), 3)
#>                  RMSE    MAE  MAPE  MASE
#> ETS            27.398 22.805 4.656 0.749
#> Seasonal_naive 50.708 47.833 9.988 1.571
```

We build the seasonal-naive benchmark, pull the Test-set row for both forecasts, and stack them so every metric lines up side by side.

The ETS model wins on every metric: about half the RMSE and MAE, less than half the MAPE, and a MASE of 0.749 versus 1.571. The benchmark's MASE above 1 shows that even a seasonal rule is beaten here, and the ETS MASE below 1 confirms the model adds real value. This is a clear decision: ship the ETS forecast.

A picture makes the win obvious. `autoplot()` draws the forecast with its uncertainty bands, and `autolayer()` overlays what actually happened in 1960.

```r title="Plot the forecast against the actuals"
autoplot(fc) +
  autolayer(test_ap, series = "Actual 1960")
```

The shaded fan is the ETS forecast and its uncertainty; the overlaid line is the real 1960 data. The actuals sit inside the forecast band and hug the central line, which is the visual version of that low test-set MASE. Seeing the forecast track the holdout is the final confirmation before you trust it going forward.

## Practice Exercises

Time to combine what you have learned. Each exercise runs in the same session as the tutorial, so the functions and data above are still available. Use fresh variable names so you do not overwrite them.

### Exercise 1: Pick the better model and explain the disagreement

You forecast a five-period series with two models. Compute the MAE and RMSE of each, decide which model you would ship, and note why RMSE could rank two models differently from MAE.

```r title="Exercise 1 starter"
cap_actual <- c(100, 110, 105, 120, 130)
model_a    <- c(102, 108, 107, 118, 133)
model_b    <- c(95, 115, 100, 128, 122)

# Hint: write a small function that returns MAE and RMSE, then rbind() both models.
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
fm <- function(a, f) { e <- a - f; c(MAE = mean(abs(e)), RMSE = sqrt(mean(e^2))) }
round(rbind(A = fm(cap_actual, model_a), B = fm(cap_actual, model_b)), 3)
#>   MAE  RMSE
#> A 2.2 2.236
#> B 6.2 6.372
```

**Explanation:** Model A wins on both metrics. Its errors are small and even, so its MAE (2.2) and RMSE (2.236) are almost identical. Model B has larger, more variable errors, so its RMSE (6.372) pulls further above its MAE (6.2). The general lesson: whenever one model has a single large miss, its RMSE climbs faster than its MAE, so the two metrics can disagree about which model is worse.

</details>

### Exercise 2: Compute MASE from scratch on a train/test split

Given a training history, a short test set, and your forecast for it, compute MASE by hand: scale your test MAE by the training naive benchmark. Is the forecast better than naive?

```r title="Exercise 2 starter"
cap_train <- c(10, 12, 11, 13, 15, 14, 16, 18)   # training history
cap_test  <- c(19, 17, 21)                        # held-out actuals
cap_fcast <- c(18, 18, 20)                        # your forecast

# Hint: benchmark = mean absolute one-step change in cap_train (use diff()).
# MASE = test MAE / benchmark. Round to 3 decimals.
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
scale_mae <- mean(abs(diff(cap_train)))
round(mean(abs(cap_test - cap_fcast)) / scale_mae, 3)
#> [1] 0.583
```

**Explanation:** The training series rises fairly steadily, so its average one-step change (the benchmark) is about 1.71. Your forecast's test MAE is 1.0, giving a MASE of 0.583. Below 1, so the forecast beats the naive benchmark.

</details>

### Exercise 3: Bake off ETS against auto.arima with accuracy()

Using the same AirPassengers train/test split from the tutorial, fit an automatic ARIMA model, forecast 1960, and compare it to the ETS forecast on the four test-set metrics. Which model would you pick by MASE?

```r title="Exercise 3 starter"
# fc and test_ap already exist from the tutorial.
# Hint: fit with auto.arima(train_ap), forecast h = length(test_ap),
# then rbind the Test-set rows of both models for RMSE, MAE, MAPE, MASE.
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
fit_arima <- auto.arima(train_ap)
fc_arima  <- forecast(fit_arima, h = length(test_ap))
cols <- c("RMSE", "MAE", "MAPE", "MASE")
round(rbind(ETS   = accuracy(fc,       test_ap)["Test set", cols],
            ARIMA = accuracy(fc_arima, test_ap)["Test set", cols]), 3)
#>         RMSE    MAE  MAPE  MASE
#> ETS   27.398 22.805 4.656 0.749
#> ARIMA 23.932 18.528 4.182 0.608
```

**Explanation:** `auto.arima()` searches ARIMA orders automatically and, on this holdout, edges out ETS on every metric, with a lower MASE (0.608 versus 0.749). By MASE you would ship the ARIMA model, though both comfortably beat a naive benchmark. The workflow is the point: pick a metric, then let the held-out numbers choose the model.

</details>

## Frequently asked questions

### Which forecast accuracy metric should I use?

There is no single best one. Start with MAE or RMSE to see the error in your data's own units (use RMSE if a rare large miss is especially costly), and add MASE so you know whether the model actually beats a naive benchmark. Reach for MAPE only when you need a percentage and every actual value stays comfortably above zero. Reporting one scale metric plus MASE covers most decisions.

### Why is my MAPE infinite (Inf) or extremely large?

MAPE divides each error by the actual value, so any period where the actual is exactly zero produces a division by zero, and a single `Inf` makes the whole average `Inf`. Actuals close to zero cause the same problem to a lesser degree, inflating the score without any real change in forecast quality. On data that can hit zero, such as intermittent demand or counts, use MAE or MASE instead.

### What counts as a good MASE or RMSE value?

RMSE and MAE have no universal "good" value: a MAE of 5 is excellent on sales in the thousands and terrible on sales in single digits, so you can only judge them relative to the scale of your data or a benchmark. MASE is easier to read because it is scaled: below 1 means your forecast beats a naive "no change" forecast, exactly 1 ties it, and above 1 is worse than doing nothing clever. That is why MASE is the metric to lean on when you want an absolute sense of "is this any good".

### What is the difference between MAE and RMSE?

Both remove the sign of each error and report a typical error size in the data's units, but they average differently. MAE averages the absolute errors, so every unit of error counts equally. RMSE squares the errors before averaging, which makes a few large misses count for much more, so RMSE is always at least as large as MAE and the gap between them widens as your errors become more uneven.

### Do I need the forecast package to measure accuracy?

No. All four metrics are short one-liners in base R, exactly as computed by hand earlier on this page, so you can score any pair of actuals and forecasts without extra packages. The `accuracy()` function in the forecast package is a convenience: it computes them all at once from a forecast object and neatly splits the results into a training-set row and a test-set row.

## Summary

Forecast accuracy comes down to summarising the forecast error in the way that best fits your decision. Here is the cheat sheet.

| Metric | In plain words | Units | Best for | Watch out |
|---|---|---|---|---|
| MAE | Average size of the errors | Data's units | A robust, everyday error measure | Cannot compare across series |
| RMSE | Like MAE but squares first | Data's units | When big single misses are costly | Sensitive to outliers |
| MAPE | Average error as a percentage | Percent | Scale-free reporting on positive data | Undefined at zero, asymmetric |
| MASE | Error relative to a naive benchmark | Unitless | Comparing across different series | Needs a training series to scale |

The takeaways in one glance:

- Every metric is a summary of the error vector (actual minus forecast); they differ only in how they average it.
- MAE and RMSE live in your data's units, and RMSE punishes large single misses harder.
- MAPE reads as a percentage but breaks on zero or near-zero actuals.
- MASE is the only unitless, cross-series metric; below 1 beats a naive forecast.
- `accuracy()` in the forecast package returns them all at once, and you should always read the Test set row.

![The four accuracy metrics and what each one is good for.](screenshots/Forecast-Accuracy-in-R-metrics-mindmap.webp)
*Figure 3: The four accuracy metrics and what each one is good for.*

## References

1. Hyndman, R.J. & Athanasopoulos, G. - *Forecasting: Principles and Practice* (3rd ed), "Evaluating forecast accuracy". [Link](https://otexts.com/fpp3/accuracy.html)
2. Hyndman, R.J. & Koehler, A.B. (2006) - "Another look at measures of forecast accuracy", *International Journal of Forecasting* 22(4). [Link](https://doi.org/10.1016/j.ijforecast.2006.03.001)
3. forecast package - `accuracy()` function reference. [Link](https://pkg.robjhyndman.com/forecast/reference/accuracy.html)
4. Hyndman, R.J. - "Errors on percentage errors", on the pitfalls of MAPE. [Link](https://robjhyndman.com/hyndsight/smape/)
5. forecast package on CRAN. [Link](https://cran.r-project.org/package=forecast)
6. R documentation - the `AirPassengers` dataset. [Link](https://stat.ethz.ch/R-manual/R-devel/library/datasets/html/AirPassengers.html)

## Continue Learning

- [ETS Models in R](ETS-Models-in-R.html) - fit the exponential smoothing models whose forecasts you just scored.
- [auto.arima() in R](auto-arima-in-R.html) - the automatic ARIMA search used in the final exercise.
- [Choosing a Forecasting Model in R](Choosing-a-Forecasting-Model-in-R.html) - use these accuracy metrics to select between competing models.
