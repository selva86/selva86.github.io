---
title: "Time Series Cross-Validation in R with tsCV()"
slug: "Time-Series-Cross-Validation-in-R"
description: "Ordinary cross-validation leaks the future into forecast tests. Learn how tsCV() in R uses a rolling forecast origin to score any model at any horizon."
keywords: "time series cross-validation, tsCV in R, rolling forecast origin, forecast accuracy, forecast package, out-of-sample error, backtesting time series, RMSE forecast"
mathjax: true
webr: true
date: "2026-07-19"
curriculum_id: "3.8.16"
post_type: "C"
sidebar_section: "Time Series"
sidebar_title: "Time Series Cross-Validation"
sidebar_order: 19
difficulty: "Intermediate"
time_estimate_min: 18
auto_link_terms: "time series cross-validation|tsCV()|rolling forecast origin|rolling origin|cross-validate a forecast|out-of-sample forecast error|forecast accuracy on a rolling origin|backtesting a forecast|evaluation on a rolling forecasting origin|time series backtesting"
auto_link_case_sensitive: false
---

<p class="lead">Time series cross-validation is the honest way to measure a forecast: it trains on past data, tests on the very next unseen point, and rolls that cutoff forward through the whole series. In R, the <code>tsCV()</code> function from the <code>forecast</code> package automates this <em>rolling forecast origin</em> for any model and any horizon, so you can compare methods on the score that actually matters, how wrong they are on data they have never seen.</p>

This tutorial uses base R time series objects and the `forecast` package. Every code block runs directly in your browser, so you can press Run and change the numbers as you read.

## Why can't you shuffle time series data to test a forecast?

You have built a forecaster and now you want one honest number: how wrong will it be next month? The usual way to test a model is to hide some random rows and predict them, then measure how far off you were. Do that to a time series and you cheat without meaning to, because some of those hidden rows sit in the past relative to the rows you trained on. You end up using next year to predict last year, which leaks the future into the test. Here is what one honest evaluation looks like instead.

```r title="Cross-validate a naive forecast"
library(forecast)
library(ggplot2)

# naive() forecasts the next value as equal to the last observed value.
errors <- tsCV(AirPassengers, forecastfunction = function(y, h) naive(y, h), h = 1)
sqrt(mean(errors^2, na.rm = TRUE))
#> [1] 33.82515
```

That single line ran a full rolling test and returned one number: about 33.8. `AirPassengers` counts monthly airline passengers (in thousands) from 1949 to 1960. The value 33.8 is the typical size of a one-month-ahead error for the simplest possible forecast, measured only on months the model had not seen when it made each prediction. We will unpack exactly how `tsCV()` produced it in the next section.

First, let us look at the data we are forecasting, so the rest of the post has something concrete to stand on.

```r title="Plot the airline passenger data"
autoplot(AirPassengers) +
  labs(title = "Monthly airline passengers, 1949 to 1960",
       x = "Year", y = "Passengers (thousands)")
```

The chart shows two things at once: a steady climb over the years (a trend) and a repeating yearly wave that peaks every summer (seasonality). Keep both in mind, because they are the reason different forecasts will score so differently later.

Now, why is shuffling such a problem? Ordinary k-fold cross-validation splits the rows into random groups. It trains on some of those groups and tests on the ones it held out. That works when rows are independent, like customers or emails. Time series rows are not independent: each month is tied to the months around it, and they have a fixed order. If a random split lets the model peek at December while predicting June of the same year, it has seen the future. The test score comes out flattering and wrong.

![Shuffled cross-validation trains on future points and gives an over-optimistic score, while a rolling origin trains only on the past and gives an honest score.](screenshots/Time-Series-Cross-Validation-in-R-shuffle-vs-rolling.webp)
*Figure 1: Shuffled cross-validation leaks the future; a rolling origin only ever trains on the past.*

Time series cross-validation fixes this by respecting the clock. It only ever tests on points that come after everything it trained on. No forecast is ever allowed to see a value from its own future.

[KEY INSIGHT]
**You cannot use tomorrow to forecast today.** A fair forecast test must train only on the past and test on the future, because that is the only situation your model will ever face in real life. Shuffling the rows quietly breaks that rule and rewards models for cheating.

**Try it:** Swap `naive()` for `meanf()` (which forecasts every future point as the average of all past values) and see how the mean forecast scores on the same rolling test.

```r title="Your turn: cross-validate the mean forecast"
# Change naive() to meanf() below, then run to see the mean forecast's RMSE.
ex_errors <- tsCV(AirPassengers, forecastfunction = function(y, h) naive(y, h), h = 1)
sqrt(mean(ex_errors^2, na.rm = TRUE))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Mean forecast cross-validation solution"
ex_errors <- tsCV(AirPassengers, forecastfunction = function(y, h) meanf(y, h), h = 1)
sqrt(mean(ex_errors^2, na.rm = TRUE))
#> [1] 120.5611
```

**Explanation:** The flat mean forecast scores about 120.6, roughly three and a half times worse than naive. It ignores the trend entirely, so it drifts further below the rising series every year. The rolling test catches that at once.

</details>

## What is evaluation on a rolling forecast origin?

The idea behind `tsCV()` has a name: evaluation on a rolling forecasting origin. It sounds fancy, but the recipe is short. Train on the first few points, then forecast the next one and write down the error. Then move the cutoff (the origin) forward by one point, so the training window grows by one, and repeat. By the time you reach the end of the series you have tested the method on hundreds of genuine out-of-sample points, and you average the errors over all of them.

![Train on points 1 to t, forecast the next point, record the error, then move the origin forward and repeat.](screenshots/Time-Series-Cross-Validation-in-R-rolling-origin.webp)
*Figure 2: The rolling forecast origin: train, forecast the next point, record the error, then roll forward.*

The clearest way to trust `tsCV()` is to build it yourself on a tiny series and check that you get the same answer. Here is a short series of eight numbers. For each origin `t`, the naive forecast of the next point is simply the value at `t`, so the error is the actual next value minus that.

```r title="Reproduce the rolling origin by hand"
y <- ts(c(8, 10, 9, 11, 13, 12, 14, 16))
n <- length(y)
manual <- rep(NA, n)

for (t in 2:(n - 1)) {          # start once we have some history, stop when no future point exists
  forecast_value <- y[t]        # naive: the next value equals the last observed value
  manual[t] <- y[t + 1] - forecast_value
}
manual
#> [1] NA -1  2  2 -1  2  2 NA
```

Each stored number is a real one-step error. At origin 2 the forecast for point 3 is the value at point 2, which is 10, and the actual point 3 is 9, so the error is 9 minus 10, or minus 1. We slide the origin forward one point at a time and collect six of these errors, one for each origin from 2 to 7. Now compare this hand-rolled result with `tsCV()` on the same series.

```r title="tsCV reproduces the manual loop"
tsCV(y, forecastfunction = function(y, h) naive(y, h), h = 1)
#> Time Series:
#> Start = 1 
#> End = 8 
#> Frequency = 1 
#> [1] NA -1  2  2 -1  2  2 NA
```

The two match exactly, which means `tsCV()` is doing nothing more mysterious than that loop, just faster and for any model you hand it. Notice two details. First, `tsCV()` returns a time series object, so each error stays lined up with the origin that produced it. Second, both ends are `NA`. The first origin has too little history for `naive()` to fit, and the last origin has no future point left to compare against.

The same pattern appears on the real data. Look at the first year of the airline errors we computed earlier.

```r title="Inspect the error series"
round(head(errors, 13), 2)
#>      Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec
#> 1949  NA  14  -3  -8  14  13   0 -12 -17 -15  14  -3
#> 1950  11
```

January 1949 is `NA` because there was nothing before it to learn from. Every later month except the last holds a genuine one-step forecast error; only two of the 144 months come back missing, January 1949 at the start (no history) and December 1960 at the end (no future month to score against).

[NOTE]
**The missing values at the ends are expected, not a bug.** `tsCV()` returns `NA` at any origin where the model cannot be fit (too little history) or where there is no future observation left to score against. That is why you always average errors with `na.rm = TRUE`.

If you like symbols, here is the same idea in one line. If you prefer code, skip this box, the loop above says everything the formula does.

$$e_{t} = y_{t+1} - \hat{y}_{t+1 \mid t}$$

Where:

- $y_{t+1}$ is the actual next value
- $\hat{y}_{t+1 \mid t}$ is the forecast of that value made using only data up to time $t$

The score most people report is the root mean squared error over all the non-missing errors:

$$\text{RMSE} = \sqrt{\frac{1}{m}\sum_{t} e_{t}^{2}}$$

Where $m$ is the number of errors that are not `NA`. Smaller is better, and the units are the same as the data, here thousands of passengers.

**Try it:** Count how many of the 144 months actually received a forecast error, using the `errors` object from the payoff block.

```r title="Your turn: count the scored points"
# Count the non-missing values in `errors`.
# Hint: is.na() flags the NA entries, and ! flips TRUE and FALSE.

# sum(!is.na(errors))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Count non-missing errors solution"
sum(!is.na(errors))
#> [1] 142
```

**Explanation:** There are 142 scored points. Two of the 144 months are missing: January 1949 (no history, so `naive()` cannot fit) and December 1960 (no future month to compare). Every other month contributes one honest error to the average.

</details>

## How do you run time series cross-validation with tsCV()?

You call `tsCV()` with three main pieces: the series `y`, a `forecastfunction` that says how to forecast, and the horizon `h`. The `forecastfunction` is the part that trips people up, so let us be precise about its contract. It is a function of two arguments, `y` and `h`, and it must return a forecast object (the thing `naive()`, `rwf()`, `ets()` and friends already produce). `tsCV()` calls it again and again, handing it a longer slice of history each time.

A small helper keeps the scoring readable, since we compute root mean squared error over and over.

```r title="Write an rmse helper"
rmse <- function(e) sqrt(mean(e^2, na.rm = TRUE))

# rwf() is a random walk forecast; drift = TRUE lets it follow a straight-line trend.
drift_errors <- tsCV(AirPassengers, forecastfunction = function(y, h) rwf(y, drift = TRUE, h = h), h = 1)
rmse(drift_errors)
#> [1] 33.97644
```

[TIP]
**Wrap your scoring in a tiny function.** A one-line `rmse()` helper with `na.rm = TRUE` baked in keeps every comparison consistent and saves you from forgetting the missing-value flag, which would otherwise turn your whole score into `NA`.

Here is a question worth asking: why bother with cross-validation at all, when a model already reports its own residuals? Because a model's residuals are measured on the same data it was trained on, so they flatter it. Cross-validation measures error on data the model never saw. Let us put the two side by side for the drift model.

```r title="Compare CV error with residual error"
cv_rmse  <- rmse(drift_errors)                                  # honest, out-of-sample
res_rmse <- rmse(residuals(rwf(AirPassengers, drift = TRUE)))   # in-sample residuals
c(cv = round(cv_rmse, 2), residual = round(res_rmse, 2))
#>       cv residual 
#>    33.98    33.64
```

The cross-validated error (33.98) is larger than the in-sample residual error (33.64). The gap is small here because a drift model has only one thing to estimate, but the direction is the rule, not the exception: residuals almost always look better than reality. The more a model bends to fit its training data, the wider this gap grows, which is exactly when you most need an honest number.

[KEY INSIGHT]
**Residuals flatter the model; cross-validation tells the truth.** In-sample residuals come from a model that has already seen every point, so they understate the error you will get on new data. The cross-validated score is the fair estimate of future performance, and it is the one to quote.

**Try it:** Remove the `drift = TRUE` argument so `rwf()` becomes a plain random walk (identical to `naive()`), and check its cross-validated RMSE.

```r title="Your turn: drop the drift term"
# Remove drift = TRUE below, then run to see how the score changes.
ex_nodrift <- tsCV(AirPassengers, forecastfunction = function(y, h) rwf(y, drift = TRUE, h = h), h = 1)
rmse(ex_nodrift)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Random walk without drift solution"
ex_nodrift <- tsCV(AirPassengers, forecastfunction = function(y, h) rwf(y, h = h), h = 1)
rmse(ex_nodrift)
#> [1] 33.82515
```

**Explanation:** Without drift the score is 33.83, exactly the naive result from the first section. That is a useful sanity check: a random walk with no drift term is the naive forecast, so the two must agree.

</details>

## How do you compare forecasting models with tsCV()?

This is where cross-validation earns its keep. Put every candidate model through the same rolling test and read the winner straight off the scoreboard. Because `tsCV()` takes any `forecastfunction`, you can loop over a list of them. Let us start with three simple benchmarks: the flat mean, the naive forecast, and the seasonal naive forecast (which predicts each month using the same month one year earlier).

```r title="Compare three benchmark models"
models <- list(
  mean   = function(y, h) meanf(y, h),
  naive  = function(y, h) naive(y, h),
  snaive = function(y, h) snaive(y, h)
)

round(sapply(models, function(f) rmse(tsCV(AirPassengers, f, h = 1))), 2)
#>   mean  naive snaive 
#> 120.56  33.83  36.45
```

Read that carefully, because it contains a surprise. Seasonal naive (36.45) is slightly worse than plain naive (33.83) for one-month-ahead forecasting here. You might have expected the seasonal method to win on such an obviously seasonal series, but a month ago is a closer match to today than a year ago when the series is climbing, because last year's value misses a whole year of growth. The rolling test reports the measured error either way, so it settles the question rather than your intuition about which method should win.

[WARNING]
**Never pick a model by how well it fits the training data.** A flexible model can fit history almost perfectly and still forecast badly. The only trustworthy comparison is out-of-sample, which is precisely what a rolling origin gives you. Rank models by their cross-validated error, not their in-sample fit.

Benchmarks are meant to be beaten. A model that captures both the trend and the yearly season should do far better. A seasonal ARIMA model, sometimes written as ARIMA(0,1,1)(0,1,1) with a period of 12, is the classic choice for this dataset. We wrap it in a `forecastfunction` and cross-validate it the same way.

```r title="Cross-validate a seasonal ARIMA"
airline <- function(y, h) forecast(Arima(y, order = c(0, 1, 1), seasonal = c(0, 1, 1)), h = h)
arima_errors <- tsCV(AirPassengers, airline, h = 1)
rmse(arima_errors)
#> [1] 12.17146
```

The seasonal ARIMA scores about 12.2, roughly a third of the benchmark errors. This block does real work, because `tsCV()` refits the model at every origin, so give it a few seconds to run. That cost is the whole point: the score is honest precisely because each forecast was made by a model that had never seen the point it was predicting.

Here is the full scoreboard for the four models we have tried.

| Model | What it assumes | Rolling RMSE |
|---|---|---|
| Mean | The series is flat around its average | 120.56 |
| Seasonal naive | This month equals the same month last year | 36.45 |
| Naive | Tomorrow equals today | 33.83 |
| Seasonal ARIMA | Trend plus a yearly season | 12.17 |

[NOTE]
**Fully automatic models slot in the same way.** You can drop `ets(y)` or `auto.arima(y)` into a `forecastfunction` exactly like the ARIMA above, wrapped in `forecast(...)`. They pick their own settings, so they are convenient, but they refit from scratch at every origin and are noticeably slower to cross-validate, so run those comparisons in your own R session when you have time.

**Try it:** Cross-validate `naive()` and `snaive()`, then compare their scores directly.

```r title="Your turn: naive versus seasonal naive"
# Cross-validate both methods below, then print the two RMSE values to compare them.
ex_naive  <- tsCV(AirPassengers, function(y, h) naive(y, h),  h = 1)
ex_snaive <- tsCV(AirPassengers, function(y, h) snaive(y, h), h = 1)
# Add a line here that prints both RMSEs.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Naive versus seasonal naive solution"
round(c(naive = rmse(ex_naive), snaive = rmse(ex_snaive)), 2)
#>  naive snaive 
#>  33.83  36.45
```

**Explanation:** Naive (33.83) edges out seasonal naive (36.45) for one-step forecasting on this rising series. The lesson is not that seasonal naive is bad, it is that you should let the rolling test decide rather than assuming.

</details>

## How do forecast errors grow as the horizon increases?

So far every forecast looked one step ahead. In practice you often need to forecast several steps out, and a fair test should measure how accuracy decays with distance. Set `h` to a number bigger than 1 and `tsCV()` returns a matrix instead of a vector: one column per horizon, so column 3 holds every three-step-ahead error.

```r title="Cross-validate many horizons at once"
h_errors <- tsCV(AirPassengers, airline, h = 12)
dim(h_errors)
#> [1] 144  12
```

The result has 144 rows (one per origin) and 12 columns (one per horizon, from one month ahead to twelve). To score each horizon on its own, take the root mean squared error down each column with `colMeans()`.

```r title="Root mean squared error by horizon"
rmse_by_h <- sqrt(colMeans(h_errors^2, na.rm = TRUE))
round(rmse_by_h, 1)
#>  h=1  h=2  h=3  h=4  h=5  h=6  h=7  h=8  h=9 h=10 h=11 h=12 
#> 12.2 14.8 17.6 19.4 20.0 20.7 21.3 21.4 21.3 22.0 21.9 22.5
```

The error climbs steadily, from about 12 for next month to about 22 a year out. That is the expected shape: the further ahead you forecast, the less certain you are, because more unknown future has to be bridged. A picture makes the trend obvious.

```r title="Plot error against the horizon"
h_df <- data.frame(horizon = 1:12, rmse = as.numeric(rmse_by_h))

ggplot(h_df, aes(horizon, rmse)) +
  geom_line(color = "#6b5b95", linewidth = 1) +
  geom_point(color = "#6b5b95", size = 2) +
  scale_x_continuous(breaks = 1:12) +
  labs(title = "Forecast error grows as the horizon lengthens",
       x = "Forecast horizon (months ahead)", y = "RMSE") +
  theme_minimal()
```

This is a far more useful summary than a single number. If your business only cares about the next quarter, you can read the error for horizons 1 to 3 and ignore the rest. If you must plan a year ahead, you now know the honest uncertainty at twelve months.

[NOTE]
**Some benchmarks give a bumpy horizon curve.** A seasonal method like `snaive()` can produce a curve that is nearly flat or even dips at the twelve-month horizon, because the yearly cycle lines the forecast back up with the right season. A smooth, rising curve like the ARIMA one above is the more typical shape.

**Try it:** Read the six-month-ahead error straight from the matrix, using the sixth column of `h_errors`.

```r title="Your turn: read one horizon"
# Compute the RMSE for horizon 6 only.
# Hint: subset the sixth column with h_errors[, 6], then square, average, and take the root.

# round(sqrt(mean(h_errors[, 6]^2, na.rm = TRUE)), 1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Error at horizon six solution"
round(sqrt(mean(h_errors[, 6]^2, na.rm = TRUE)), 1)
#> [1] 20.7
```

**Explanation:** The six-month-ahead RMSE is 20.7, which matches the `h=6` entry in the horizon table. Picking a single column lets you report accuracy at the exact lead time your decision depends on.

</details>

## Should you use an expanding or a sliding window?

By default `tsCV()` uses an expanding window: every training set keeps all the history before the origin, so it grows by one point each step. That is usually what you want. But sometimes the world changes, and old data becomes misleading rather than helpful. For those cases you can pass `window = k` to use a sliding window that keeps only the most recent `k` points and forgets everything older.

![An expanding window keeps all past data and grows each step, while a sliding window keeps only the most recent points.](screenshots/Time-Series-Cross-Validation-in-R-expanding-vs-sliding.webp)
*Figure 3: An expanding window keeps all history; a sliding window keeps only the most recent points.*

The difference is easiest to see with the mean forecast, which literally averages its training window. On a rising series, an all-history average is held down by the older, lower values, while a recent average tracks the climb far better.

```r title="Expanding versus sliding window"
expanding <- tsCV(AirPassengers, function(y, h) meanf(y, h), h = 1)              # all past data
sliding   <- tsCV(AirPassengers, function(y, h) meanf(y, h), h = 1, window = 24) # last 24 months only
c(expanding = round(rmse(expanding), 1), sliding = round(rmse(sliding), 1))
#> expanding   sliding 
#>     120.6      59.9
```

Switching to a two-year sliding window roughly halves the error, from 120.6 to 59.9. The recent-average forecast is still no match for the ARIMA, but the point stands: when the series trends or its behaviour shifts, forgetting stale data can help a lot.

[TIP]
**Reach for a sliding window when the recent past matters more than the distant past.** If your series has a strong trend, a structural break, or a change in behaviour, a fixed-size `window` keeps the model focused on data that still looks like the future you are trying to predict.

**Try it:** A wider window is not automatically better. Change the sliding window from 24 to 48 months and see what happens.

```r title="Your turn: widen the sliding window"
# Change window = 24 to window = 48, then run to compare with the 24-month result above.
ex_window <- tsCV(AirPassengers, function(y, h) meanf(y, h), h = 1, window = 24)
round(rmse(ex_window), 1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Sliding window of 48 solution"
ex_window <- tsCV(AirPassengers, function(y, h) meanf(y, h), h = 1, window = 48)
round(rmse(ex_window), 1)
#> [1] 86.4
```

**Explanation:** A 48-month window scores 86.4, worse than the 24-month window's 59.9. A longer window reaches back to older, lower values and drags the average down again. Window length is a knob to tune, and here 24 months was a better fit than 48.

</details>

## Complete Example: choose and deploy a model with tsCV()

Let us put the whole workflow together. The goal is a repeatable recipe: cross-validate a shortlist of models, pick the one with the lowest honest error, then refit that winner on all the data and forecast the year ahead. First, the selection step.

```r title="Cross-validate every candidate model"
rmse2 <- function(e) sqrt(mean(e^2, na.rm = TRUE))

candidates <- list(
  mean    = function(y, h) meanf(y, h),
  naive   = function(y, h) naive(y, h),
  snaive  = function(y, h) snaive(y, h),
  airline = function(y, h) forecast(Arima(y, order = c(0, 1, 1), seasonal = c(0, 1, 1)), h = h)
)

scores <- sapply(candidates, function(f) rmse2(tsCV(AirPassengers, f, h = 1)))
round(sort(scores), 2)
#> airline   naive  snaive    mean 
#>   12.17   33.83   36.45  120.56
best <- names(which.min(scores))
cat("Best model:", best, "\n")
#> Best model: airline
```

The rolling test names the seasonal ARIMA as the clear winner. Now we refit that model on the entire series (cross-validation was only for choosing, the final model should use every observation) and forecast the next twelve months.

```r title="Refit the winner and forecast a year"
final_fit <- Arima(AirPassengers, order = c(0, 1, 1), seasonal = c(0, 1, 1))
round(forecast(final_fit, h = 12)$mean, 1)
#>        Jan   Feb   Mar   Apr   May   Jun   Jul   Aug   Sep   Oct   Nov   Dec
#> 1961 447.1 421.9 453.5 489.9 502.2 564.2 649.8 636.7 538.9 491.1 422.8 464.8
```

The forecast for 1961 climbs into the summer and dips in winter, mirroring the seasonal shape you saw in the very first chart, and it sits above 1960 because the model carries the upward trend forward. Because we chose this model with a rolling test, we can attach an honest error bar to it: about 12 passengers (thousands) for next month, widening toward 22 by the following December.

## Practice Exercises

These combine several ideas from the tutorial. Try each one before opening the solution, and use the distinct variable names shown so your code does not overwrite the tutorial objects.

### Exercise 1: Pick the better benchmark

Cross-validate the `naive` and `snaive` methods on `AirPassengers`, store their one-step RMSE values in a named vector called `my_scores`, and print the name of the lower one. Reuse the `rmse()` helper from earlier.

```r title="Your turn: pick the better benchmark"
# Cross-validate naive and snaive, score both, and report the winner.
# my_naive  <- tsCV(...)
# my_snaive <- tsCV(...)
# my_scores <- c(naive = ..., snaive = ...)
# names(which.min(my_scores))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Better benchmark solution"
my_naive  <- tsCV(AirPassengers, function(y, h) naive(y, h),  h = 1)
my_snaive <- tsCV(AirPassengers, function(y, h) snaive(y, h), h = 1)
my_scores <- c(naive = rmse(my_naive), snaive = rmse(my_snaive))
round(my_scores, 2)
#>  naive snaive 
#>  33.83  36.45
names(which.min(my_scores))
#> [1] "naive"
```

**Explanation:** `which.min()` finds the position of the smallest score, and wrapping it in `names()` returns the model's label. Naive wins for one-step forecasting here.

</details>

### Exercise 2: Rank four models in one shot

Write a small helper `cv_rmse_of(f)` that returns the one-step cross-validated RMSE of a `forecastfunction`, then use it with `sapply()` to rank the mean, naive, seasonal naive, and drift methods from best to worst.

```r title="Your turn: rank four models"
# Build a helper cv_rmse_of(f), put the four methods in a list called my_models,
# then sort sapply(my_models, cv_rmse_of).
```

<details>
<summary>Click to reveal solution</summary>

```r title="Rank four models solution"
cv_rmse_of <- function(f) rmse(tsCV(AirPassengers, f, h = 1))

my_models <- list(
  mean   = function(y, h) meanf(y, h),
  naive  = function(y, h) naive(y, h),
  snaive = function(y, h) snaive(y, h),
  drift  = function(y, h) rwf(y, drift = TRUE, h = h)
)

round(sort(sapply(my_models, cv_rmse_of)), 2)
#>  naive  drift snaive   mean 
#>  33.83  33.98  36.45 120.56
```

**Explanation:** The helper hides the repetitive `tsCV()` plumbing so the comparison reads like a ranking. Naive and drift are neck and neck at the top. Seasonal naive trails them, and the flat mean sits far behind.

</details>

### Exercise 3: Measure what a sliding window buys you

Compare the expanding-window and 24-month sliding-window mean forecasts, and report the percentage improvement the sliding window gives. Store the two scores as `my_expanding` and `my_sliding`.

```r title="Your turn: measure the window gain"
# Score meanf with the default (expanding) window and with window = 24,
# then compute 100 * (expanding - sliding) / expanding.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Window improvement solution"
my_expanding <- rmse(tsCV(AirPassengers, function(y, h) meanf(y, h), h = 1))
my_sliding   <- rmse(tsCV(AirPassengers, function(y, h) meanf(y, h), h = 1, window = 24))
round(c(expanding = my_expanding, sliding = my_sliding,
        pct_improvement = 100 * (my_expanding - my_sliding) / my_expanding), 1)
#>       expanding         sliding pct_improvement 
#>           120.6            59.9            50.3
```

**Explanation:** The sliding window cuts the error in half, a 50.3 percent improvement, because a recent average tracks the rising series much better than an all-history average.

</details>

## Frequently Asked Questions (FAQ)

### What does tsCV() actually return?

It returns a time series of forecast errors, aligned so each error sits at the origin that produced it. For a one-step forecast (`h = 1`) you get a vector; for multi-step (`h > 1`) you get a matrix with one column per horizon. You then reduce those errors to a score yourself, usually with `sqrt(mean(e^2, na.rm = TRUE))`.

### Why are there NA values in the output?

`tsCV()` inserts `NA` wherever it cannot produce or score a forecast: at the earliest origins, where there is not enough history to fit the model, and at the very end, where there is no future observation left to compare against. Always pass `na.rm = TRUE` when averaging, or your score will collapse to `NA`.

### Is tsCV() the same as a train-test split?

A single train-test split checks the model once, on one test window. Time series cross-validation is many train-test splits chained together, moving the cutoff forward one step at a time, so the model is scored on hundreds of out-of-sample points instead of one. That makes the estimate far more stable, especially on shorter series.

### Can I use tsCV() with ARIMA, ETS, or my own model?

Yes. Any method works as long as you wrap it in a `forecastfunction(y, h)` that returns a forecast object. For models that must be fitted first, like ARIMA or ETS, use the pattern `function(y, h) forecast(Arima(y, ...), h = h)`. Be aware that models which refit from scratch at every origin are slower to cross-validate.

### Should the final model be trained on all the data?

Yes. Cross-validation is only for choosing between models and estimating their error. Once you have picked a winner, refit it on the entire series so the deployed model uses every observation available, then forecast forward.

### How is cross-validation error different from a model's residuals?

Residuals are measured on the same data the model was trained on, so they understate real error. Cross-validation error is measured only on unseen future points, so it is the honest estimate of how the model will perform going forward. The cross-validated number is usually larger, and it is the one to trust.

## Summary

Time series cross-validation is the discipline of testing a forecast only on data that comes after everything it trained on, and `tsCV()` makes it a one-line habit.

![A one-page map of time series cross-validation covering the leakage problem, the rolling-origin mechanic, then the tsCV workflow and its payoff.](screenshots/Time-Series-Cross-Validation-in-R-overview-mindmap.webp)
*Figure 4: The whole idea of time series cross-validation on one page.*

| Idea | What to remember |
|---|---|
| The problem | Shuffled k-fold leaks the future into the test and flatters the model |
| The mechanic | Roll the origin forward: train on the past, test on the next point, repeat |
| The call | `tsCV(y, forecastfunction, h)` returns a series (or matrix) of out-of-sample errors |
| The forecastfunction | A function of `(y, h)` that returns a forecast object |
| Scoring | `sqrt(mean(e^2, na.rm = TRUE))`, always with `na.rm = TRUE` |
| Comparing models | Rank by cross-validated error, never by in-sample fit |
| Horizons | Set `h > 1` to see how error grows with lead time |
| Windows | Default is expanding; use `window = k` to forget stale data |
| After choosing | Refit the winner on all the data before forecasting |

With this in hand, you can stop guessing which forecast is best and start measuring it, on the only test that matches real life.

## References

1. Hyndman, R.J. Cross-validation for time series. Hyndsight blog. [Link](https://robjhyndman.com/hyndsight/tscv/) - the short post that introduced the rolling `tsCV()` approach, from the author of the forecast package.
2. Hyndman, R.J., and Athanasopoulos, G. Forecasting: Principles and Practice (3rd ed), Section 5.10: Time series cross-validation. [Link](https://otexts.com/fpp3/tscv.html) - the textbook treatment of the rolling forecast origin, with worked `tsCV()` code.
3. Hyndman, R.J. et al. tsCV() reference, forecast package documentation. [Link](https://pkg.robjhyndman.com/forecast/reference/tsCV.html) - the official argument reference for `window`, `initial`, and the multi-horizon matrix return.
4. Hyndman, R.J., and Athanasopoulos, G. Forecasting: Principles and Practice (3rd ed), Section 5.8: Evaluating point forecast accuracy. [Link](https://otexts.com/fpp3/accuracy.html) - explains RMSE, MAE, and the other error measures you reduce the CV errors to.
5. Bergmeir, C., and Benitez, J.M. (2012). On the use of cross-validation for time series predictor evaluation. Information Sciences 191, 192-213. [Link](https://doi.org/10.1016/j.ins.2011.12.028) - the research case for why ordinary k-fold leaks and rolling-origin evaluation is the fix.
6. Tashman, L.J. (2000). Out-of-sample tests of forecasting accuracy: an analysis and review. International Journal of Forecasting 16(4), 437-450. [Link](https://doi.org/10.1016/S0169-2070%2800%2900065-0) - the classic review of out-of-sample forecast testing that grounds the whole idea.

## Continue Learning

- [ARIMA Models in R](ARIMA-in-R.html): Build the seasonal ARIMA that won our rolling test, and understand what its terms mean.
- [auto.arima() in R](auto-arima-in-R.html): Let R search for a good ARIMA specification automatically, then cross-validate it the same way.
- [ETS Models in R](ETS-Models-in-R.html): Learn exponential smoothing, the other workhorse family you can drop straight into `tsCV()`.
