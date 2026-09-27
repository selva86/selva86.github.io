---
title: "Machine Learning and Deep Forecasting Lesson 3: Boosted Trees for Forecasting"
slug: "Boosted-Trees-for-Forecasting"
description: "Fit gradient boosting on lagged airline passengers with gbm, see why trees cannot follow a trend, and compare the forecasts with seasonal naive and ETS."
keywords: "boosted trees forecasting, gradient boosting time series, gbm in R, lag features, recursive forecast, seasonal difference, relative influence, ETS, seasonal naive, rolling origin, R"
mathjax: false
webr: true
date: "2026-09-27"
post_type: "LESSON"
course_id: "ts-ml"
course_title: "Machine Learning and Deep Forecasting"
course_lesson: "3"
course_total: "7"
course_landing: "Machine-Learning-and-Deep-Forecasting-Course.html"
course_prev: "Machine-Learning-Forecasting-with-modeltime"
course_next: "Neural-Network-Forecasts-NNETAR"
curriculum_id: "5.130.3"
lesson_access: "pro"
catalog_blurb: "Why boosted trees flatten a trend, and how to forecast around it."
---

=== step === cover
## Boosted Trees for Forecasting

Today let's forecast monthly airline passengers with gradient boosted trees, and find out what a tree model can and cannot do with a series that keeps rising.

The data is the number of international airline passengers per month, in thousands, from Jan 1949 to Dec 1960. That is 144 months, and R ships it as the built-in `AirPassengers` series. It climbs from 112 in Jan 1949 to 622 in Jul 1960, and the gap between the low months and the high months of each year widens as the level rises.

Now suppose it is Dec 1958 and you have to plan demand. You fit a model on the 120 months up to Dec 1958, forecast the 24 months of 1959 and 1960, and then score the forecast against what really happened.

::widget chart-plotter {"data":[{"x":1949,"y":112,"fill":"train"},{"x":1949.083,"y":118,"fill":"train"},{"x":1949.167,"y":132,"fill":"train"},{"x":1949.25,"y":129,"fill":"train"},{"x":1949.333,"y":121,"fill":"train"},{"x":1949.417,"y":135,"fill":"train"},{"x":1949.5,"y":148,"fill":"train"},{"x":1949.583,"y":148,"fill":"train"},{"x":1949.667,"y":136,"fill":"train"},{"x":1949.75,"y":119,"fill":"train"},{"x":1949.833,"y":104,"fill":"train"},{"x":1949.917,"y":118,"fill":"train"},{"x":1950,"y":115,"fill":"train"},{"x":1950.083,"y":126,"fill":"train"},{"x":1950.167,"y":141,"fill":"train"},{"x":1950.25,"y":135,"fill":"train"},{"x":1950.333,"y":125,"fill":"train"},{"x":1950.417,"y":149,"fill":"train"},{"x":1950.5,"y":170,"fill":"train"},{"x":1950.583,"y":170,"fill":"train"},{"x":1950.667,"y":158,"fill":"train"},{"x":1950.75,"y":133,"fill":"train"},{"x":1950.833,"y":114,"fill":"train"},{"x":1950.917,"y":140,"fill":"train"},{"x":1951,"y":145,"fill":"train"},{"x":1951.083,"y":150,"fill":"train"},{"x":1951.167,"y":178,"fill":"train"},{"x":1951.25,"y":163,"fill":"train"},{"x":1951.333,"y":172,"fill":"train"},{"x":1951.417,"y":178,"fill":"train"},{"x":1951.5,"y":199,"fill":"train"},{"x":1951.583,"y":199,"fill":"train"},{"x":1951.667,"y":184,"fill":"train"},{"x":1951.75,"y":162,"fill":"train"},{"x":1951.833,"y":146,"fill":"train"},{"x":1951.917,"y":166,"fill":"train"},{"x":1952,"y":171,"fill":"train"},{"x":1952.083,"y":180,"fill":"train"},{"x":1952.167,"y":193,"fill":"train"},{"x":1952.25,"y":181,"fill":"train"},{"x":1952.333,"y":183,"fill":"train"},{"x":1952.417,"y":218,"fill":"train"},{"x":1952.5,"y":230,"fill":"train"},{"x":1952.583,"y":242,"fill":"train"},{"x":1952.667,"y":209,"fill":"train"},{"x":1952.75,"y":191,"fill":"train"},{"x":1952.833,"y":172,"fill":"train"},{"x":1952.917,"y":194,"fill":"train"},{"x":1953,"y":196,"fill":"train"},{"x":1953.083,"y":196,"fill":"train"},{"x":1953.167,"y":236,"fill":"train"},{"x":1953.25,"y":235,"fill":"train"},{"x":1953.333,"y":229,"fill":"train"},{"x":1953.417,"y":243,"fill":"train"},{"x":1953.5,"y":264,"fill":"train"},{"x":1953.583,"y":272,"fill":"train"},{"x":1953.667,"y":237,"fill":"train"},{"x":1953.75,"y":211,"fill":"train"},{"x":1953.833,"y":180,"fill":"train"},{"x":1953.917,"y":201,"fill":"train"},{"x":1954,"y":204,"fill":"train"},{"x":1954.083,"y":188,"fill":"train"},{"x":1954.167,"y":235,"fill":"train"},{"x":1954.25,"y":227,"fill":"train"},{"x":1954.333,"y":234,"fill":"train"},{"x":1954.417,"y":264,"fill":"train"},{"x":1954.5,"y":302,"fill":"train"},{"x":1954.583,"y":293,"fill":"train"},{"x":1954.667,"y":259,"fill":"train"},{"x":1954.75,"y":229,"fill":"train"},{"x":1954.833,"y":203,"fill":"train"},{"x":1954.917,"y":229,"fill":"train"},{"x":1955,"y":242,"fill":"train"},{"x":1955.083,"y":233,"fill":"train"},{"x":1955.167,"y":267,"fill":"train"},{"x":1955.25,"y":269,"fill":"train"},{"x":1955.333,"y":270,"fill":"train"},{"x":1955.417,"y":315,"fill":"train"},{"x":1955.5,"y":364,"fill":"train"},{"x":1955.583,"y":347,"fill":"train"},{"x":1955.667,"y":312,"fill":"train"},{"x":1955.75,"y":274,"fill":"train"},{"x":1955.833,"y":237,"fill":"train"},{"x":1955.917,"y":278,"fill":"train"},{"x":1956,"y":284,"fill":"train"},{"x":1956.083,"y":277,"fill":"train"},{"x":1956.167,"y":317,"fill":"train"},{"x":1956.25,"y":313,"fill":"train"},{"x":1956.333,"y":318,"fill":"train"},{"x":1956.417,"y":374,"fill":"train"},{"x":1956.5,"y":413,"fill":"train"},{"x":1956.583,"y":405,"fill":"train"},{"x":1956.667,"y":355,"fill":"train"},{"x":1956.75,"y":306,"fill":"train"},{"x":1956.833,"y":271,"fill":"train"},{"x":1956.917,"y":306,"fill":"train"},{"x":1957,"y":315,"fill":"train"},{"x":1957.083,"y":301,"fill":"train"},{"x":1957.167,"y":356,"fill":"train"},{"x":1957.25,"y":348,"fill":"train"},{"x":1957.333,"y":355,"fill":"train"},{"x":1957.417,"y":422,"fill":"train"},{"x":1957.5,"y":465,"fill":"train"},{"x":1957.583,"y":467,"fill":"train"},{"x":1957.667,"y":404,"fill":"train"},{"x":1957.75,"y":347,"fill":"train"},{"x":1957.833,"y":305,"fill":"train"},{"x":1957.917,"y":336,"fill":"train"},{"x":1958,"y":340,"fill":"train"},{"x":1958.083,"y":318,"fill":"train"},{"x":1958.167,"y":362,"fill":"train"},{"x":1958.25,"y":348,"fill":"train"},{"x":1958.333,"y":363,"fill":"train"},{"x":1958.417,"y":435,"fill":"train"},{"x":1958.5,"y":491,"fill":"train"},{"x":1958.583,"y":505,"fill":"train"},{"x":1958.667,"y":404,"fill":"train"},{"x":1958.75,"y":359,"fill":"train"},{"x":1958.833,"y":310,"fill":"train"},{"x":1958.917,"y":337,"fill":"train"},{"x":1959,"y":360,"fill":"test"},{"x":1959.083,"y":342,"fill":"test"},{"x":1959.167,"y":406,"fill":"test"},{"x":1959.25,"y":396,"fill":"test"},{"x":1959.333,"y":420,"fill":"test"},{"x":1959.417,"y":472,"fill":"test"},{"x":1959.5,"y":548,"fill":"test"},{"x":1959.583,"y":559,"fill":"test"},{"x":1959.667,"y":463,"fill":"test"},{"x":1959.75,"y":407,"fill":"test"},{"x":1959.833,"y":362,"fill":"test"},{"x":1959.917,"y":405,"fill":"test"},{"x":1960,"y":417,"fill":"test"},{"x":1960.083,"y":391,"fill":"test"},{"x":1960.167,"y":419,"fill":"test"},{"x":1960.25,"y":461,"fill":"test"},{"x":1960.333,"y":472,"fill":"test"},{"x":1960.417,"y":535,"fill":"test"},{"x":1960.5,"y":622,"fill":"test"},{"x":1960.583,"y":606,"fill":"test"},{"x":1960.667,"y":508,"fill":"test"},{"x":1960.75,"y":461,"fill":"test"},{"x":1960.833,"y":390,"fill":"test"},{"x":1960.917,"y":432,"fill":"test"}],"geoms":["line"],"x":"year","y":"passengers","code":{"line":"ggplot(df, aes(year, passengers, colour = group)) + geom_line()"}}

The line labelled train is the 120 months a model is fit on. The line labelled test is the 24 months kept out of every fit, and every forecast in this lesson is scored against it.

=== step === concept
## Turning a monthly series into a table of lags

A boosted tree model needs a table: one row per example, one column for the target, the value we want to predict, and the other columns for the features, the values we predict it from. A time series is a single column, so we build the features out of the series' own past. A feature made from an earlier value of the series is called a lag.

For each month we use five features:

- `lag_1`, `lag_2` and `lag_3`: the passengers 1, 2 and 3 months earlier.
- `lag_12`: the passengers in the same month one year earlier.
- `month`: the calendar month, from 1 for Jan to 12 for Dec.

The first three lags carry the recent level, `lag_12` carries the yearly pattern, and `month` identifies which part of the year a row belongs to. The function below builds this table for any series, and the last line prints the first 16 months.

```r
# Build a table where each month's row holds the passengers from earlier months
passengers <- as.numeric(AirPassengers)

make_lag_table <- function(series) {
  lag_by <- function(k) c(rep(NA, k), head(series, -k))
  data.frame(
    y      = series,
    month  = rep(1:12, length.out = length(series)),
    lag_1  = lag_by(1),
    lag_2  = lag_by(2),
    lag_3  = lag_by(3),
    lag_12 = lag_by(12)
  )
}

lag_table <- make_lag_table(passengers)
lag_table[1:16, ]
#>      y month lag_1 lag_2 lag_3 lag_12
#> 1  112     1    NA    NA    NA     NA
#> 2  118     2   112    NA    NA     NA
#> 3  132     3   118   112    NA     NA
#> 4  129     4   132   118   112     NA
#> 5  121     5   129   132   118     NA
#> 6  135     6   121   129   132     NA
#> 7  148     7   135   121   129     NA
#> 8  148     8   148   135   121     NA
#> 9  136     9   148   148   135     NA
#> 10 119    10   136   148   148     NA
#> 11 104    11   119   136   148     NA
#> 12 118    12   104   119   136     NA
#> 13 115     1   118   104   119    112
#> 14 126     2   115   118   104    118
#> 15 141     3   126   115   118    132
#> 16 135     4   141   126   115    129
```

`lag_by(k)` moves the series down by k rows and puts `NA` in the first k rows, because those months have no earlier value. That is why `lag_12` is `NA` for the whole first year.

Row 13 is Jan 1950. It has 115 passengers, and its features are 118 for Dec 1949 (`lag_1`), 104 for Nov 1949 (`lag_2`), 119 for Oct 1949 (`lag_3`) and 112 for Jan 1949 (`lag_12`). Every feature in a row comes from an earlier month, so no row's features include its own target.

Rows 1 to 12 have no `lag_12`, so the usable rows are 13 to 144. We take rows 13 to 120, Jan 1950 to Dec 1958, as the training rows, and rows 121 to 144, Jan 1959 to Dec 1960, as the test rows.

```r
# Keep the months that have every lag and split them into training and test rows
train <- lag_table[13:120, ]
test  <- lag_table[121:144, ]

c(train_rows = nrow(train), test_rows = nrow(test))
#> train_rows  test_rows
#>        108         24
```

The 12 months lost to `lag_12` leave 108 training rows. The 24 test rows are the months we are going to forecast.

=== step === widget
## How gradient boosting builds a model tree by tree

Gradient boosting builds its prediction in stages. It starts from one number, the mean of the target. Then it adds small trees one at a time, and each new tree is fit to the residuals of the current prediction: the actual values minus what the prediction says so far.

A tree here is a short list of yes or no questions about the features, for example "is `lag_12` below 251?". Each question is a split, and 251 is its split point. The rows are sorted by the answers into groups called leaves, and every row in a leaf gets one value, the mean of the residuals of the rows in it.

That value is multiplied by a small number called the shrinkage and added to the prediction, so no single tree moves the prediction far.

The widget below runs this on a small dataset, and the slider sets the number of rounds, where each round adds one tree. Its 30 built-in points are a wave on a rising line, so read the x axis as the month index and the y axis as passengers: a rising level with a seasonal wave.

::widget gradient-boosting {"rounds": 0}

At round 0 the prediction is the mean, one flat line, and the RMSE is 0.879. RMSE is the root mean squared error: square each residual, average the squares and take the square root, which gives an error in the units of the target. Move the slider to 16 and the RMSE falls to 0.426, with a shrinkage of 0.3 (the widget calls it lr).

It falls with every round, because each tree is fit to what the trees before it left over.

`gbm()` does the same on the lag table. The block fits 300 trees to the 108 training rows and measures the RMSE on those same rows, which is called the in-sample error.

```r
# Fit gradient boosting on the 108 training rows and measure its in-sample error
library(gbm)

set.seed(42)
fit_300 <- gbm(
  y ~ .,
  data = train,
  distribution = "gaussian",
  n.trees = 300,
  shrinkage = 0.1,
  interaction.depth = 2,
  n.minobsinnode = 10,
  bag.fraction = 1,
  verbose = FALSE
)

fitted_300 <- predict(fit_300, train, n.trees = 300)
round(sqrt(mean((train$y - fitted_300)^2)), 1)
#> [1] 8.2
```

`distribution = "gaussian"` means squared error, so each tree is fit to residuals. `n.trees = 300` sets the number of trees, `shrinkage = 0.1` scales each tree's output, `interaction.depth = 2` lets a tree make at most 2 splits, and `n.minobsinnode = 10` requires at least 10 rows in a leaf. `bag.fraction = 1` uses every row for every tree, which makes the fit the same on every run.

The RMSE on the training rows is 8.2, in thousands of passengers. That says how closely the 300 trees follow the months they were fit to. It does not say how many trees give the best forecast.

=== step === widget
## Choosing the number of trees with the latest training months

The RMSE on the training rows keeps falling as trees are added, so it cannot tell us when to stop. The error on held-out months, the months the trees were not fit to, behaves differently. It falls at first, bottoms out, and then rises, because the later trees start fitting noise in the training months.

The widget below draws both curves and lets you move the stopping round. It has its own built-in curves, so read a round as one tree, and the two errors as the RMSE on the training rows and on the held-out rows.

::widget learning-curve {"rounds": 40}

The held-out error is lowest at round 12, where it is 0.65 and the training error is 0.37. At round 40 the training error has dropped to 0.23, but the held-out error has risen to 0.90. So the number of trees to use is where the held-out error is lowest, not where the training error is.

Now the same on the lag table. `train.fraction = 96 / 108` fits the trees on the first 96 training rows and scores them on the last 12, Jan to Dec 1958, which we call the validation months. The validation months come after the 96 in time order. A shuffled split would fit trees on months that come after some of the months being scored, and a forecast never gets that.

```r
# Fit on the first 96 training rows and score the last 12 to choose the number of trees
set.seed(42)
fit_valid <- gbm(
  y ~ .,
  data = train,
  distribution = "gaussian",
  n.trees = 300,
  shrinkage = 0.1,
  interaction.depth = 2,
  n.minobsinnode = 10,
  bag.fraction = 1,
  train.fraction = 96 / 108,
  verbose = FALSE
)

best_trees <- gbm.perf(fit_valid, method = "test", plot.it = FALSE)
best_trees
#> [1] 256

round(sqrt(fit_valid$valid.error[c(best_trees, 300)]), 1)
#> [1] 39.5 39.6
```

`gbm.perf(method = "test")` returns the number of trees with the lowest validation error, here 256 of the 300. `valid.error` holds the validation squared error for every number of trees, so its square root is the validation RMSE. It is 39.5 at 256 trees and 39.6 at 300, nearly flat past the minimum, so the exact count matters little here. What matters is the rule: choose on later months, not on the months the trees were fit to.

With 256 trees chosen, we refit on all 108 training rows. We call this the level model, because its target is the passenger level itself.

```r
# Refit on all 108 training rows with the chosen number of trees
set.seed(42)
best_level <- gbm(
  y ~ .,
  data = train,
  distribution = "gaussian",
  n.trees = best_trees,
  shrinkage = 0.1,
  interaction.depth = 2,
  n.minobsinnode = 10,
  bag.fraction = 1,
  verbose = FALSE
)
```

=== step === quiz
## Quick check: how many trees should the final model have?

A colleague looks at the boosting widget, where the RMSE fell with every round, and says to use as many trees as possible. The learning-curve widget showed something different: the training error fell to 0.23 by round 40, while the error on held-out months was lowest at round 12, at 0.65. Which rule chooses the number of trees?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- The number of trees with the lowest error on the training rows, because that model follows the data most closely. ::no
- The number of trees with the lowest error on validation months that come after the months the trees were fit on. ::ok Yes. Those months were not used to fit the trees, and they come later in time, just as the months you forecast do. That is why the count of 256 came from the last 12 training months.
- The number of trees with the lowest error on the 1959 and 1960 test months. ::no
- The number of trees with the lowest error on validation rows drawn at random from all the months. ::no The error on the training rows keeps falling as trees are added, so it always points to more trees. The test months are kept back to score the final forecast, and choosing the number of trees on them uses them up. Random validation rows would put months after the scored ones into the fit. The rule is to hold out the latest training months, in time order, and take the count where their error is lowest.

=== step === concept
## Recursive forecasts: predicting 24 months one month at a time

A row of the lag table predicts one month from the months before it. Jan 1959 is straightforward: its features are the actual Dec, Nov and Oct 1958 and the actual Jan 1958. But Feb 1959 needs Jan 1959 as `lag_1`, and in Dec 1958 that month has not happened yet.

So we use the forecast for Jan 1959 as `lag_1` for Feb 1959, the forecast for Feb 1959 as `lag_1` for Mar 1959, and so on for 24 months. This is a recursive multi-step forecast: each forecast is fed back in as an input for the next month. From Jan 1960 on, `lag_12` is a forecast too.

The helper below forecasts `h` months ahead this way. Each pass builds one row from the last values of the series, predicts the next month, and appends the prediction to the series.

```r
# Write a helper that forecasts h months ahead, feeding each forecast back in as the next lag
boosted_forecast <- function(fit, n_trees, series, h) {
  for (i in 1:h) {
    n_obs <- length(series)
    next_row <- data.frame(
      month  = n_obs %% 12 + 1,   # the series starts in January
      lag_1  = series[n_obs],
      lag_2  = series[n_obs - 1],
      lag_3  = series[n_obs - 2],
      lag_12 = series[n_obs - 11]
    )
    next_value <- predict(fit, next_row, n.trees = n_trees)
    series <- c(series, next_value)
  }
  tail(series, h)
}
```

Now we forecast the 24 test months with the level model and score the forecast with two errors. RMSE is as before. MAE is the mean absolute error, the average size of a miss in thousands of passengers, and RMSE weights large misses more heavily than MAE does.

```r
# Forecast the 24 test months with the level model and score the forecast
test_actual <- passengers[121:144]
level_forecast <- boosted_forecast(best_level, best_trees, passengers[1:120], h = 24)

rmse <- function(actual, forecast) sqrt(mean((actual - forecast)^2))
mae  <- function(actual, forecast) mean(abs(actual - forecast))

round(c(rmse = rmse(test_actual, level_forecast), mae = mae(test_actual, level_forecast)), 1)
#> rmse  mae
#> 74.1 53.9

# Compare the range of the forecasts with the range of the data
round(c(forecast_min = min(level_forecast), forecast_max = max(level_forecast),
        actual_max = max(test_actual), training_max = max(train$y)))
#> forecast_min forecast_max   actual_max training_max
#>          352          463          622          505
```

The RMSE is 74.1 and the MAE is 53.9. The second output shows where the error comes from: the highest forecast is 463, the highest actual month is 622, and the highest value in the training rows is 505.

The chart draws the 144 actual months and the 24 forecasts.

::widget chart-plotter {"data":[{"x":1949,"y":112,"fill":"actual"},{"x":1949.083,"y":118,"fill":"actual"},{"x":1949.167,"y":132,"fill":"actual"},{"x":1949.25,"y":129,"fill":"actual"},{"x":1949.333,"y":121,"fill":"actual"},{"x":1949.417,"y":135,"fill":"actual"},{"x":1949.5,"y":148,"fill":"actual"},{"x":1949.583,"y":148,"fill":"actual"},{"x":1949.667,"y":136,"fill":"actual"},{"x":1949.75,"y":119,"fill":"actual"},{"x":1949.833,"y":104,"fill":"actual"},{"x":1949.917,"y":118,"fill":"actual"},{"x":1950,"y":115,"fill":"actual"},{"x":1950.083,"y":126,"fill":"actual"},{"x":1950.167,"y":141,"fill":"actual"},{"x":1950.25,"y":135,"fill":"actual"},{"x":1950.333,"y":125,"fill":"actual"},{"x":1950.417,"y":149,"fill":"actual"},{"x":1950.5,"y":170,"fill":"actual"},{"x":1950.583,"y":170,"fill":"actual"},{"x":1950.667,"y":158,"fill":"actual"},{"x":1950.75,"y":133,"fill":"actual"},{"x":1950.833,"y":114,"fill":"actual"},{"x":1950.917,"y":140,"fill":"actual"},{"x":1951,"y":145,"fill":"actual"},{"x":1951.083,"y":150,"fill":"actual"},{"x":1951.167,"y":178,"fill":"actual"},{"x":1951.25,"y":163,"fill":"actual"},{"x":1951.333,"y":172,"fill":"actual"},{"x":1951.417,"y":178,"fill":"actual"},{"x":1951.5,"y":199,"fill":"actual"},{"x":1951.583,"y":199,"fill":"actual"},{"x":1951.667,"y":184,"fill":"actual"},{"x":1951.75,"y":162,"fill":"actual"},{"x":1951.833,"y":146,"fill":"actual"},{"x":1951.917,"y":166,"fill":"actual"},{"x":1952,"y":171,"fill":"actual"},{"x":1952.083,"y":180,"fill":"actual"},{"x":1952.167,"y":193,"fill":"actual"},{"x":1952.25,"y":181,"fill":"actual"},{"x":1952.333,"y":183,"fill":"actual"},{"x":1952.417,"y":218,"fill":"actual"},{"x":1952.5,"y":230,"fill":"actual"},{"x":1952.583,"y":242,"fill":"actual"},{"x":1952.667,"y":209,"fill":"actual"},{"x":1952.75,"y":191,"fill":"actual"},{"x":1952.833,"y":172,"fill":"actual"},{"x":1952.917,"y":194,"fill":"actual"},{"x":1953,"y":196,"fill":"actual"},{"x":1953.083,"y":196,"fill":"actual"},{"x":1953.167,"y":236,"fill":"actual"},{"x":1953.25,"y":235,"fill":"actual"},{"x":1953.333,"y":229,"fill":"actual"},{"x":1953.417,"y":243,"fill":"actual"},{"x":1953.5,"y":264,"fill":"actual"},{"x":1953.583,"y":272,"fill":"actual"},{"x":1953.667,"y":237,"fill":"actual"},{"x":1953.75,"y":211,"fill":"actual"},{"x":1953.833,"y":180,"fill":"actual"},{"x":1953.917,"y":201,"fill":"actual"},{"x":1954,"y":204,"fill":"actual"},{"x":1954.083,"y":188,"fill":"actual"},{"x":1954.167,"y":235,"fill":"actual"},{"x":1954.25,"y":227,"fill":"actual"},{"x":1954.333,"y":234,"fill":"actual"},{"x":1954.417,"y":264,"fill":"actual"},{"x":1954.5,"y":302,"fill":"actual"},{"x":1954.583,"y":293,"fill":"actual"},{"x":1954.667,"y":259,"fill":"actual"},{"x":1954.75,"y":229,"fill":"actual"},{"x":1954.833,"y":203,"fill":"actual"},{"x":1954.917,"y":229,"fill":"actual"},{"x":1955,"y":242,"fill":"actual"},{"x":1955.083,"y":233,"fill":"actual"},{"x":1955.167,"y":267,"fill":"actual"},{"x":1955.25,"y":269,"fill":"actual"},{"x":1955.333,"y":270,"fill":"actual"},{"x":1955.417,"y":315,"fill":"actual"},{"x":1955.5,"y":364,"fill":"actual"},{"x":1955.583,"y":347,"fill":"actual"},{"x":1955.667,"y":312,"fill":"actual"},{"x":1955.75,"y":274,"fill":"actual"},{"x":1955.833,"y":237,"fill":"actual"},{"x":1955.917,"y":278,"fill":"actual"},{"x":1956,"y":284,"fill":"actual"},{"x":1956.083,"y":277,"fill":"actual"},{"x":1956.167,"y":317,"fill":"actual"},{"x":1956.25,"y":313,"fill":"actual"},{"x":1956.333,"y":318,"fill":"actual"},{"x":1956.417,"y":374,"fill":"actual"},{"x":1956.5,"y":413,"fill":"actual"},{"x":1956.583,"y":405,"fill":"actual"},{"x":1956.667,"y":355,"fill":"actual"},{"x":1956.75,"y":306,"fill":"actual"},{"x":1956.833,"y":271,"fill":"actual"},{"x":1956.917,"y":306,"fill":"actual"},{"x":1957,"y":315,"fill":"actual"},{"x":1957.083,"y":301,"fill":"actual"},{"x":1957.167,"y":356,"fill":"actual"},{"x":1957.25,"y":348,"fill":"actual"},{"x":1957.333,"y":355,"fill":"actual"},{"x":1957.417,"y":422,"fill":"actual"},{"x":1957.5,"y":465,"fill":"actual"},{"x":1957.583,"y":467,"fill":"actual"},{"x":1957.667,"y":404,"fill":"actual"},{"x":1957.75,"y":347,"fill":"actual"},{"x":1957.833,"y":305,"fill":"actual"},{"x":1957.917,"y":336,"fill":"actual"},{"x":1958,"y":340,"fill":"actual"},{"x":1958.083,"y":318,"fill":"actual"},{"x":1958.167,"y":362,"fill":"actual"},{"x":1958.25,"y":348,"fill":"actual"},{"x":1958.333,"y":363,"fill":"actual"},{"x":1958.417,"y":435,"fill":"actual"},{"x":1958.5,"y":491,"fill":"actual"},{"x":1958.583,"y":505,"fill":"actual"},{"x":1958.667,"y":404,"fill":"actual"},{"x":1958.75,"y":359,"fill":"actual"},{"x":1958.833,"y":310,"fill":"actual"},{"x":1958.917,"y":337,"fill":"actual"},{"x":1959,"y":360,"fill":"actual"},{"x":1959.083,"y":342,"fill":"actual"},{"x":1959.167,"y":406,"fill":"actual"},{"x":1959.25,"y":396,"fill":"actual"},{"x":1959.333,"y":420,"fill":"actual"},{"x":1959.417,"y":472,"fill":"actual"},{"x":1959.5,"y":548,"fill":"actual"},{"x":1959.583,"y":559,"fill":"actual"},{"x":1959.667,"y":463,"fill":"actual"},{"x":1959.75,"y":407,"fill":"actual"},{"x":1959.833,"y":362,"fill":"actual"},{"x":1959.917,"y":405,"fill":"actual"},{"x":1960,"y":417,"fill":"actual"},{"x":1960.083,"y":391,"fill":"actual"},{"x":1960.167,"y":419,"fill":"actual"},{"x":1960.25,"y":461,"fill":"actual"},{"x":1960.333,"y":472,"fill":"actual"},{"x":1960.417,"y":535,"fill":"actual"},{"x":1960.5,"y":622,"fill":"actual"},{"x":1960.583,"y":606,"fill":"actual"},{"x":1960.667,"y":508,"fill":"actual"},{"x":1960.75,"y":461,"fill":"actual"},{"x":1960.833,"y":390,"fill":"actual"},{"x":1960.917,"y":432,"fill":"actual"},{"x":1959,"y":357.9,"fill":"boosted, level target"},{"x":1959.083,"y":352.3,"fill":"boosted, level target"},{"x":1959.167,"y":388.5,"fill":"boosted, level target"},{"x":1959.25,"y":396.7,"fill":"boosted, level target"},{"x":1959.333,"y":462.7,"fill":"boosted, level target"},{"x":1959.417,"y":434.3,"fill":"boosted, level target"},{"x":1959.5,"y":435.3,"fill":"boosted, level target"},{"x":1959.583,"y":435.4,"fill":"boosted, level target"},{"x":1959.667,"y":409.1,"fill":"boosted, level target"},{"x":1959.75,"y":409.1,"fill":"boosted, level target"},{"x":1959.833,"y":364.6,"fill":"boosted, level target"},{"x":1959.917,"y":354.8,"fill":"boosted, level target"},{"x":1960,"y":388,"fill":"boosted, level target"},{"x":1960.083,"y":426,"fill":"boosted, level target"},{"x":1960.167,"y":462.7,"fill":"boosted, level target"},{"x":1960.25,"y":426.8,"fill":"boosted, level target"},{"x":1960.333,"y":426.8,"fill":"boosted, level target"},{"x":1960.417,"y":434.3,"fill":"boosted, level target"},{"x":1960.5,"y":435.3,"fill":"boosted, level target"},{"x":1960.583,"y":435.4,"fill":"boosted, level target"},{"x":1960.667,"y":409.1,"fill":"boosted, level target"},{"x":1960.75,"y":409.1,"fill":"boosted, level target"},{"x":1960.833,"y":410.4,"fill":"boosted, level target"},{"x":1960.917,"y":410.4,"fill":"boosted, level target"}],"geoms":["line"],"x":"year","y":"passengers","code":{"line":"ggplot(df, aes(year, passengers, colour = group)) + geom_line()"}}

The forecast line never gets above 463 while the actual line goes on to 622. Why can the forecast not get any higher?

=== step === concept
## What a boosted tree predicts outside its training range

Start with what a tree can output. A regression tree sorts each row into a leaf by comparing its features with split points, and every row in a leaf gets the same value. In boosting that value is the mean residual of the training rows in the leaf, and the prediction is the mean of the target plus the shrunken leaf values from every tree.

So every number the model can output is built from leaf values that were estimated on the training rows. A row whose feature is larger than every split point goes down the same branches as the largest training values. It lands in the outermost leaf and gets the same prediction they do. The trees have no rule that keeps a trend going past the last split, and predicting beyond the range of the training data is called extrapolation.

To see this in its simplest form, we fit gbm on the month index alone, t = 1 to 120. A series that rises steadily should be easy to follow along t. The block fits the model with the same settings and forecasts t = 121 to 144.

```r
# Fit boosting on the month index alone and forecast the 24 test months
month_index <- data.frame(y = passengers[1:120], t = 1:120)

set.seed(42)
index_fit <- gbm(
  y ~ t,
  data = month_index,
  distribution = "gaussian",
  n.trees = 300,
  shrinkage = 0.1,
  interaction.depth = 2,
  n.minobsinnode = 10,
  bag.fraction = 1,
  verbose = FALSE
)

index_forecast <- predict(index_fit, data.frame(t = 121:144), n.trees = 300)
unique(round(index_forecast, 1))
#> [1] 389
```

All 24 forecasts are one number, 389. The reason is in the trees, so the next block collects every split point on `t` from all 300 trees.

```r
# Find the largest month-index split point used by any of the 300 trees
split_points <- unlist(lapply(1:300, function(i) {
  tree <- pretty.gbm.tree(index_fit, i.tree = i)
  tree$SplitCodePred[tree$SplitVar >= 0]   # SplitVar is -1 for a leaf
}))
max(split_points)
#> [1] 110.5
```

The largest split point is 110.5. Every month after t = 110 falls on the same side of all 600 splits (300 trees with 2 splits each), so it gets the same prediction. That covers the last 10 training months and all 24 test months.

The plot draws the series, the month-index fit and its forecast.

```r
# Plot the series, the month-index fit and its flat forecast
library(ggplot2)

index_fitted <- predict(index_fit, month_index, n.trees = 300)

index_plot <- data.frame(
  t = c(1:144, 1:120, 121:144),
  passengers = c(passengers, index_fitted, index_forecast),
  group = rep(c("actual", "month index, fitted", "month index, forecast"),
              times = c(144, 120, 24))
)

ggplot(index_plot, aes(t, passengers, colour = group)) +
  geom_line()
```

From t = 111 on, the fitted line and the forecast are one flat line at 389, while the actual series keeps rising.

The level model with lags has the same limit. Its forecasts are built the same way, from leaf values estimated on training months, where the highest count is 505, and its highest forecast is 463.

Adding trees does not change that. The block refits the level model with 3000 trees and compares it with the 300-tree fit.

```r
# Compare the level model at 300 trees and at 3000 trees
set.seed(42)
fit_3000 <- gbm(
  y ~ .,
  data = train,
  distribution = "gaussian",
  n.trees = 3000,
  shrinkage = 0.1,
  interaction.depth = 2,
  n.minobsinnode = 10,
  bag.fraction = 1,
  verbose = FALSE
)

forecast_300  <- boosted_forecast(fit_300, 300, passengers[1:120], h = 24)
forecast_3000 <- boosted_forecast(fit_3000, 3000, passengers[1:120], h = 24)

data.frame(
  n_trees = c(300, 3000),
  rmse = round(c(rmse(test_actual, forecast_300), rmse(test_actual, forecast_3000)), 1),
  max_forecast = round(c(max(forecast_300), max(forecast_3000)), 1)
)
#>   n_trees rmse max_forecast
#> 1     300 74.6        462.6
#> 2    3000 85.0        444.1
```

With 3000 trees the highest forecast is 444.1, lower than the 462.6 at 300 trees, and the RMSE rises from 74.6 to 85.0. The extra trees are fit to the same 108 training rows, so they add leaf values from the training range and nothing else.

[KEY INSIGHT]
A boosted tree forecasts well only where the target stays inside the range of the training values. When a series trends, the fix is to change what the trees predict, not to add more trees.

=== step === concept
## Two targets that reduce the trend: seasonal difference and fitted trend

There are two common ways to change the target so that the trees stay inside the range they have seen.

The first is the seasonal difference, d: the passengers in a month minus the passengers in the same month one year earlier. For Jul 1960 that is 622 minus 548, which is 74. The series itself trends, but d does not climb the same way: in the training months its largest value is 62, against 505 for the passengers.

The lag features are then taken from d instead of the passengers. To turn a forecast of d back into passengers, add it to the value 12 months earlier, which is an actual month or an earlier forecast. Two helpers come first: `fit_boosted()` repeats the tree-count choice and the refit for any lag table, and `boosted_diff_forecast()` forecasts d recursively and adds each forecast to the passengers 12 months earlier.

```r
# Put the tree-count choice and the refit into one function, and write the seasonal-difference forecast
fit_boosted <- function(lag_rows, validation_rows = 12) {
  lag_rows <- lag_rows[13:nrow(lag_rows), ]   # the first 12 months have no lag_12
  n_rows <- nrow(lag_rows)

  set.seed(42)
  check_fit <- gbm(
    y ~ .,
    data = lag_rows,
    distribution = "gaussian",
    n.trees = 300,
    shrinkage = 0.1,
    interaction.depth = 2,
    n.minobsinnode = 10,
    bag.fraction = 1,
    train.fraction = (n_rows - validation_rows) / n_rows,
    verbose = FALSE
  )
  n_trees <- gbm.perf(check_fit, method = "test", plot.it = FALSE)

  set.seed(42)
  final_fit <- gbm(
    y ~ .,
    data = lag_rows,
    distribution = "gaussian",
    n.trees = n_trees,
    shrinkage = 0.1,
    interaction.depth = 2,
    n.minobsinnode = 10,
    bag.fraction = 1,
    verbose = FALSE
  )
  list(fit = final_fit, n_trees = n_trees)
}

boosted_diff_forecast <- function(fit, n_trees, history, h) {
  changes <- diff(history, lag = 12)
  change_forecast <- boosted_forecast(fit, n_trees, changes, h)

  all_months <- history
  for (i in 1:h) {
    same_month_last_year <- all_months[length(all_months) - 11]
    all_months <- c(all_months, same_month_last_year + change_forecast[i])
  }
  tail(all_months, h)
}
```

Now the block fits the seasonal-difference model to the 120 training months and scores its forecast of the 24 test months.

```r
# Fit boosting to the seasonal difference and convert its forecast back to passengers
d_train <- diff(passengers[1:120], lag = 12)
max(d_train)
#> [1] 62

diff_model <- fit_boosted(make_lag_table(d_train))
diff_model$n_trees
#> [1] 116

diff_forecast <- boosted_diff_forecast(diff_model$fit, diff_model$n_trees,
                                       passengers[1:120], h = 24)

round(c(rmse = rmse(test_actual, diff_forecast),
        mae = mae(test_actual, diff_forecast),
        mean_error = mean(diff_forecast - test_actual)), 1)
#>       rmse        mae mean_error
#>       27.0       23.9      -23.9
```

The seasonal-difference model uses 116 trees. Its RMSE is 27.0 against 74.1 for the level model, and its MAE is 23.9 against 53.9. The mean error is the forecast minus the actual, so -23.9 means the forecasts are below the actual months. It has the same size as the MAE because all 24 forecasts are below the actual.

The limit has not gone away. In 4 of the 24 test months the seasonal difference is above 62, the largest value in the training months, so the trees have no training row with a change that large to build a prediction from.

The second way is to give the trend to a model that can extrapolate one. A straight line fit with `lm()` on the month index keeps rising past the training months, and the trees only have to fit what is left over. The remainder is the passengers minus the trend line, and the forecast is the line plus the boosted remainder.

```r
# Fit a straight-line trend, boost what is left over, and add the trend back
trend_fit <- lm(y ~ t, data = month_index)
round(coef(trend_fit), 2)
#> (Intercept)           t
#>       94.97        2.49

remainder <- as.numeric(residuals(trend_fit))
remainder_model <- fit_boosted(make_lag_table(remainder))
remainder_model$n_trees
#> [1] 157

remainder_forecast <- boosted_forecast(remainder_model$fit, remainder_model$n_trees,
                                       remainder, h = 24)
trend_line <- as.numeric(predict(trend_fit, data.frame(t = 121:144)))
trend_forecast <- trend_line + remainder_forecast

round(c(rmse = rmse(test_actual, trend_forecast), mae = mae(test_actual, trend_forecast)), 1)
#> rmse  mae
#> 35.2 29.0

# Compare the largest remainder in training with the largest one in the test months
round(c(training_max = max(remainder), test_max = max(test_actual - trend_line)))
#> training_max     test_max
#>          121          180
```

The line starts near 95 and adds 2.49 thousand passengers per month. The remainder model uses 157 trees, and its RMSE is 35.2 and its MAE 29.0. That is better than the level model at 74.1, and behind the seasonal-difference model at 27.0.

The actual passengers rise above the line by more in the test months than in the training months: the largest remainder is 180 in the test months and 121 in the training months. So the trees meet the same limit here, since they have no remainder that large to build a prediction from.

The chart draws the actual series and the three forecasts.

::widget chart-plotter {"data":[{"x":1949,"y":112,"fill":"actual"},{"x":1949.083,"y":118,"fill":"actual"},{"x":1949.167,"y":132,"fill":"actual"},{"x":1949.25,"y":129,"fill":"actual"},{"x":1949.333,"y":121,"fill":"actual"},{"x":1949.417,"y":135,"fill":"actual"},{"x":1949.5,"y":148,"fill":"actual"},{"x":1949.583,"y":148,"fill":"actual"},{"x":1949.667,"y":136,"fill":"actual"},{"x":1949.75,"y":119,"fill":"actual"},{"x":1949.833,"y":104,"fill":"actual"},{"x":1949.917,"y":118,"fill":"actual"},{"x":1950,"y":115,"fill":"actual"},{"x":1950.083,"y":126,"fill":"actual"},{"x":1950.167,"y":141,"fill":"actual"},{"x":1950.25,"y":135,"fill":"actual"},{"x":1950.333,"y":125,"fill":"actual"},{"x":1950.417,"y":149,"fill":"actual"},{"x":1950.5,"y":170,"fill":"actual"},{"x":1950.583,"y":170,"fill":"actual"},{"x":1950.667,"y":158,"fill":"actual"},{"x":1950.75,"y":133,"fill":"actual"},{"x":1950.833,"y":114,"fill":"actual"},{"x":1950.917,"y":140,"fill":"actual"},{"x":1951,"y":145,"fill":"actual"},{"x":1951.083,"y":150,"fill":"actual"},{"x":1951.167,"y":178,"fill":"actual"},{"x":1951.25,"y":163,"fill":"actual"},{"x":1951.333,"y":172,"fill":"actual"},{"x":1951.417,"y":178,"fill":"actual"},{"x":1951.5,"y":199,"fill":"actual"},{"x":1951.583,"y":199,"fill":"actual"},{"x":1951.667,"y":184,"fill":"actual"},{"x":1951.75,"y":162,"fill":"actual"},{"x":1951.833,"y":146,"fill":"actual"},{"x":1951.917,"y":166,"fill":"actual"},{"x":1952,"y":171,"fill":"actual"},{"x":1952.083,"y":180,"fill":"actual"},{"x":1952.167,"y":193,"fill":"actual"},{"x":1952.25,"y":181,"fill":"actual"},{"x":1952.333,"y":183,"fill":"actual"},{"x":1952.417,"y":218,"fill":"actual"},{"x":1952.5,"y":230,"fill":"actual"},{"x":1952.583,"y":242,"fill":"actual"},{"x":1952.667,"y":209,"fill":"actual"},{"x":1952.75,"y":191,"fill":"actual"},{"x":1952.833,"y":172,"fill":"actual"},{"x":1952.917,"y":194,"fill":"actual"},{"x":1953,"y":196,"fill":"actual"},{"x":1953.083,"y":196,"fill":"actual"},{"x":1953.167,"y":236,"fill":"actual"},{"x":1953.25,"y":235,"fill":"actual"},{"x":1953.333,"y":229,"fill":"actual"},{"x":1953.417,"y":243,"fill":"actual"},{"x":1953.5,"y":264,"fill":"actual"},{"x":1953.583,"y":272,"fill":"actual"},{"x":1953.667,"y":237,"fill":"actual"},{"x":1953.75,"y":211,"fill":"actual"},{"x":1953.833,"y":180,"fill":"actual"},{"x":1953.917,"y":201,"fill":"actual"},{"x":1954,"y":204,"fill":"actual"},{"x":1954.083,"y":188,"fill":"actual"},{"x":1954.167,"y":235,"fill":"actual"},{"x":1954.25,"y":227,"fill":"actual"},{"x":1954.333,"y":234,"fill":"actual"},{"x":1954.417,"y":264,"fill":"actual"},{"x":1954.5,"y":302,"fill":"actual"},{"x":1954.583,"y":293,"fill":"actual"},{"x":1954.667,"y":259,"fill":"actual"},{"x":1954.75,"y":229,"fill":"actual"},{"x":1954.833,"y":203,"fill":"actual"},{"x":1954.917,"y":229,"fill":"actual"},{"x":1955,"y":242,"fill":"actual"},{"x":1955.083,"y":233,"fill":"actual"},{"x":1955.167,"y":267,"fill":"actual"},{"x":1955.25,"y":269,"fill":"actual"},{"x":1955.333,"y":270,"fill":"actual"},{"x":1955.417,"y":315,"fill":"actual"},{"x":1955.5,"y":364,"fill":"actual"},{"x":1955.583,"y":347,"fill":"actual"},{"x":1955.667,"y":312,"fill":"actual"},{"x":1955.75,"y":274,"fill":"actual"},{"x":1955.833,"y":237,"fill":"actual"},{"x":1955.917,"y":278,"fill":"actual"},{"x":1956,"y":284,"fill":"actual"},{"x":1956.083,"y":277,"fill":"actual"},{"x":1956.167,"y":317,"fill":"actual"},{"x":1956.25,"y":313,"fill":"actual"},{"x":1956.333,"y":318,"fill":"actual"},{"x":1956.417,"y":374,"fill":"actual"},{"x":1956.5,"y":413,"fill":"actual"},{"x":1956.583,"y":405,"fill":"actual"},{"x":1956.667,"y":355,"fill":"actual"},{"x":1956.75,"y":306,"fill":"actual"},{"x":1956.833,"y":271,"fill":"actual"},{"x":1956.917,"y":306,"fill":"actual"},{"x":1957,"y":315,"fill":"actual"},{"x":1957.083,"y":301,"fill":"actual"},{"x":1957.167,"y":356,"fill":"actual"},{"x":1957.25,"y":348,"fill":"actual"},{"x":1957.333,"y":355,"fill":"actual"},{"x":1957.417,"y":422,"fill":"actual"},{"x":1957.5,"y":465,"fill":"actual"},{"x":1957.583,"y":467,"fill":"actual"},{"x":1957.667,"y":404,"fill":"actual"},{"x":1957.75,"y":347,"fill":"actual"},{"x":1957.833,"y":305,"fill":"actual"},{"x":1957.917,"y":336,"fill":"actual"},{"x":1958,"y":340,"fill":"actual"},{"x":1958.083,"y":318,"fill":"actual"},{"x":1958.167,"y":362,"fill":"actual"},{"x":1958.25,"y":348,"fill":"actual"},{"x":1958.333,"y":363,"fill":"actual"},{"x":1958.417,"y":435,"fill":"actual"},{"x":1958.5,"y":491,"fill":"actual"},{"x":1958.583,"y":505,"fill":"actual"},{"x":1958.667,"y":404,"fill":"actual"},{"x":1958.75,"y":359,"fill":"actual"},{"x":1958.833,"y":310,"fill":"actual"},{"x":1958.917,"y":337,"fill":"actual"},{"x":1959,"y":360,"fill":"actual"},{"x":1959.083,"y":342,"fill":"actual"},{"x":1959.167,"y":406,"fill":"actual"},{"x":1959.25,"y":396,"fill":"actual"},{"x":1959.333,"y":420,"fill":"actual"},{"x":1959.417,"y":472,"fill":"actual"},{"x":1959.5,"y":548,"fill":"actual"},{"x":1959.583,"y":559,"fill":"actual"},{"x":1959.667,"y":463,"fill":"actual"},{"x":1959.75,"y":407,"fill":"actual"},{"x":1959.833,"y":362,"fill":"actual"},{"x":1959.917,"y":405,"fill":"actual"},{"x":1960,"y":417,"fill":"actual"},{"x":1960.083,"y":391,"fill":"actual"},{"x":1960.167,"y":419,"fill":"actual"},{"x":1960.25,"y":461,"fill":"actual"},{"x":1960.333,"y":472,"fill":"actual"},{"x":1960.417,"y":535,"fill":"actual"},{"x":1960.5,"y":622,"fill":"actual"},{"x":1960.583,"y":606,"fill":"actual"},{"x":1960.667,"y":508,"fill":"actual"},{"x":1960.75,"y":461,"fill":"actual"},{"x":1960.833,"y":390,"fill":"actual"},{"x":1960.917,"y":432,"fill":"actual"},{"x":1959,"y":357.9,"fill":"boosted, level target"},{"x":1959.083,"y":352.3,"fill":"boosted, level target"},{"x":1959.167,"y":388.5,"fill":"boosted, level target"},{"x":1959.25,"y":396.7,"fill":"boosted, level target"},{"x":1959.333,"y":462.7,"fill":"boosted, level target"},{"x":1959.417,"y":434.3,"fill":"boosted, level target"},{"x":1959.5,"y":435.3,"fill":"boosted, level target"},{"x":1959.583,"y":435.4,"fill":"boosted, level target"},{"x":1959.667,"y":409.1,"fill":"boosted, level target"},{"x":1959.75,"y":409.1,"fill":"boosted, level target"},{"x":1959.833,"y":364.6,"fill":"boosted, level target"},{"x":1959.917,"y":354.8,"fill":"boosted, level target"},{"x":1960,"y":388,"fill":"boosted, level target"},{"x":1960.083,"y":426,"fill":"boosted, level target"},{"x":1960.167,"y":462.7,"fill":"boosted, level target"},{"x":1960.25,"y":426.8,"fill":"boosted, level target"},{"x":1960.333,"y":426.8,"fill":"boosted, level target"},{"x":1960.417,"y":434.3,"fill":"boosted, level target"},{"x":1960.5,"y":435.3,"fill":"boosted, level target"},{"x":1960.583,"y":435.4,"fill":"boosted, level target"},{"x":1960.667,"y":409.1,"fill":"boosted, level target"},{"x":1960.75,"y":409.1,"fill":"boosted, level target"},{"x":1960.833,"y":410.4,"fill":"boosted, level target"},{"x":1960.917,"y":410.4,"fill":"boosted, level target"},{"x":1959,"y":344.1,"fill":"boosted, seasonal difference"},{"x":1959.083,"y":324.3,"fill":"boosted, seasonal difference"},{"x":1959.167,"y":371.7,"fill":"boosted, seasonal difference"},{"x":1959.25,"y":371.4,"fill":"boosted, seasonal difference"},{"x":1959.333,"y":392,"fill":"boosted, seasonal difference"},{"x":1959.417,"y":469.7,"fill":"boosted, seasonal difference"},{"x":1959.5,"y":526.8,"fill":"boosted, seasonal difference"},{"x":1959.583,"y":547.2,"fill":"boosted, seasonal difference"},{"x":1959.667,"y":442,"fill":"boosted, seasonal difference"},{"x":1959.75,"y":394.2,"fill":"boosted, seasonal difference"},{"x":1959.833,"y":347.9,"fill":"boosted, seasonal difference"},{"x":1959.917,"y":372.2,"fill":"boosted, seasonal difference"},{"x":1960,"y":385.1,"fill":"boosted, seasonal difference"},{"x":1960.083,"y":366.4,"fill":"boosted, seasonal difference"},{"x":1960.167,"y":415.5,"fill":"boosted, seasonal difference"},{"x":1960.25,"y":412.9,"fill":"boosted, seasonal difference"},{"x":1960.333,"y":434.5,"fill":"boosted, seasonal difference"},{"x":1960.417,"y":515.9,"fill":"boosted, seasonal difference"},{"x":1960.5,"y":568.9,"fill":"boosted, seasonal difference"},{"x":1960.583,"y":590.1,"fill":"boosted, seasonal difference"},{"x":1960.667,"y":479.3,"fill":"boosted, seasonal difference"},{"x":1960.75,"y":428.1,"fill":"boosted, seasonal difference"},{"x":1960.833,"y":382.6,"fill":"boosted, seasonal difference"},{"x":1960.917,"y":398.2,"fill":"boosted, seasonal difference"},{"x":1959,"y":366.5,"fill":"boosted, trend plus remainder"},{"x":1959.083,"y":348.1,"fill":"boosted, trend plus remainder"},{"x":1959.167,"y":384.2,"fill":"boosted, trend plus remainder"},{"x":1959.25,"y":381,"fill":"boosted, trend plus remainder"},{"x":1959.333,"y":394,"fill":"boosted, trend plus remainder"},{"x":1959.417,"y":474.5,"fill":"boosted, trend plus remainder"},{"x":1959.5,"y":513.1,"fill":"boosted, trend plus remainder"},{"x":1959.583,"y":508.9,"fill":"boosted, trend plus remainder"},{"x":1959.667,"y":432.3,"fill":"boosted, trend plus remainder"},{"x":1959.75,"y":384.8,"fill":"boosted, trend plus remainder"},{"x":1959.833,"y":354.9,"fill":"boosted, trend plus remainder"},{"x":1959.917,"y":378.6,"fill":"boosted, trend plus remainder"},{"x":1960,"y":393.9,"fill":"boosted, trend plus remainder"},{"x":1960.083,"y":378,"fill":"boosted, trend plus remainder"},{"x":1960.167,"y":406,"fill":"boosted, trend plus remainder"},{"x":1960.25,"y":409.6,"fill":"boosted, trend plus remainder"},{"x":1960.333,"y":425.1,"fill":"boosted, trend plus remainder"},{"x":1960.417,"y":504.4,"fill":"boosted, trend plus remainder"},{"x":1960.5,"y":541.6,"fill":"boosted, trend plus remainder"},{"x":1960.583,"y":538.8,"fill":"boosted, trend plus remainder"},{"x":1960.667,"y":462.3,"fill":"boosted, trend plus remainder"},{"x":1960.75,"y":414.8,"fill":"boosted, trend plus remainder"},{"x":1960.833,"y":384.8,"fill":"boosted, trend plus remainder"},{"x":1960.917,"y":408.6,"fill":"boosted, trend plus remainder"}],"geoms":["line"],"x":"year","y":"passengers","code":{"line":"ggplot(df, aes(year, passengers, colour = group)) + geom_line()"}}

=== step === concept
## Reading relative influence for each lag and month

A fitted gbm can report how much each feature contributed. Relative influence is the share of the reduction in squared error that comes from splits on that feature, added up over all the trees and scaled so the five values sum to 100.

The block below puts the influence from the level model and from the seasonal-difference model side by side.

```r
# Compare relative influence in the level model and the seasonal-difference model
level_influence <- summary(best_level, n.trees = best_trees, plotit = FALSE)
diff_influence  <- summary(diff_model$fit, n.trees = diff_model$n_trees, plotit = FALSE)

features <- c("lag_1", "lag_2", "lag_3", "lag_12", "month")
data.frame(
  feature = features,
  level = round(level_influence[features, "rel.inf"], 1),
  seasonal_difference = round(diff_influence[features, "rel.inf"], 1)
)
#>   feature level seasonal_difference
#> 1   lag_1  14.6                65.8
#> 2   lag_2   0.9                17.3
#> 3   lag_3   0.9                 2.8
#> 4  lag_12  83.0                 6.9
#> 5   month   0.7                 7.2
```

In the level model `lag_12` carries 83.0 of the 100, and `lag_1` carries 14.6. So most of the error reduction comes from splits on the same month one year earlier, and that is the only input seasonal naive uses.

The bars show the seasonal-difference column, sorted.

::widget importance-bars {"items":[{"label":"lag_1","value":65.8},{"label":"lag_2","value":17.3},{"label":"month","value":7.2},{"label":"lag_12","value":6.9},{"label":"lag_3","value":2.8}]}

In the seasonal-difference model the features are lags of d, so `lag_1` is the seasonal difference of the previous month. The lead moves to `lag_1` with 65.8, followed by `lag_2` with 17.3, and `lag_12` drops to 6.9. So the trees split mostly on how the previous one or two months changed from a year earlier.

Relative influence describes the fitted trees. It does not say what causes passengers to rise, and when features are correlated, as neighbouring lags are, the credit is shared between them in a way that depends on which one the trees happened to split on.

=== step === concept
## Comparing with seasonal naive and ETS on equal terms

A forecast error means something only next to another method's error under the same conditions. Four rules make the comparison fair:

1. Every method is fit on the same 120 training months and scored on the same 24 test months.
2. Every forecast is made from Dec 1958, and no 1959 or 1960 actual is used as an input.
3. The number of trees is chosen on training months only.
4. Every method is scored with the same metrics, RMSE and MAE.

Two statistical benchmarks go on the same table. Seasonal naive forecasts each month with the value of the same month one year earlier. For 1959 that is 1958, and for 1960 it repeats 1958 again, because no 1959 actual is available.

ETS is exponential smoothing. It estimates a level, a trend and a seasonal pattern, and updates each one with weights that fade for older months. The three letters in `ETS(M,Ad,M)` name the error, trend and seasonal types: M is multiplicative, A is additive, and Ad is an additive trend that damps out.

We fit two ETS models. `ets()` picks the types itself, and `lambda = 0` fits it to the log of the series and converts the forecasts back to passengers. The block fits seasonal naive and both ETS models on the 120 training months and prints the types `ets()` chose.

```r
# Fit seasonal naive and two ETS models on the same 120 training months
library(forecast)

train_ts <- ts(passengers[1:120], start = c(1949, 1), frequency = 12)

snaive_forecast <- as.numeric(snaive(train_ts, h = 24)$mean)

ets_fit <- ets(train_ts)
ets_forecast <- as.numeric(forecast(ets_fit, h = 24)$mean)

ets_log_fit <- ets(train_ts, lambda = 0)   # lambda = 0 fits ETS on the log scale
ets_log_forecast <- as.numeric(forecast(ets_log_fit, h = 24)$mean)

c(ets_fit$method, ets_log_fit$method)
#> [1] "ETS(M,Ad,M)" "ETS(A,A,A)"
```

So `ets()` chose ETS(M,Ad,M) on the original scale and ETS(A,A,A) on the log scale. On the log scale the yearly swing is much more even from year to year, and an additive seasonal component can follow that.

The next block scores all six forecasts on the 24 test months.

```r
# Score all six forecasts on the same 24 test months
all_forecasts <- list(snaive_forecast, ets_forecast, ets_log_forecast,
                      level_forecast, diff_forecast, trend_forecast)

data.frame(
  method = c("Seasonal naive", "ETS (M,Ad,M)", "ETS on log scale (A,A,A)",
             "Boosted, level target", "Boosted, seasonal difference",
             "Boosted, trend plus remainder"),
  rmse = round(sapply(all_forecasts, function(f) rmse(test_actual, f)), 1),
  mae  = round(sapply(all_forecasts, function(f) mae(test_actual, f)), 1)
)
#>                          method rmse  mae
#> 1                Seasonal naive 77.0 71.2
#> 2                  ETS (M,Ad,M) 72.5 63.2
#> 3      ETS on log scale (A,A,A) 26.5 21.4
#> 4         Boosted, level target 74.1 53.9
#> 5  Boosted, seasonal difference 27.0 23.9
#> 6 Boosted, trend plus remainder 35.2 29.0
```

The table widget shows the same six rows, and the second button switches it to a formatted report table.

::widget styled-table {"title":"Forecast error on the 24 test months","note":"RMSE and MAE in thousands of passengers. Every method was fit on the 120 months to Dec 1958.","cols":["method","rmse","mae"],"rows":[["Seasonal naive",77.0,71.2],["ETS (M,Ad,M)",72.5,63.2],["ETS on log scale (A,A,A)",26.5,21.4],["Boosted, level target",74.1,53.9],["Boosted, seasonal difference",27.0,23.9],["Boosted, trend plus remainder",35.2,29.0]],"formats":{"rmse":"1dp","mae":"1dp"}}

Seasonal naive scores 77.0, ETS 72.5 and the boosted level model 74.1, all in the same range. The log-scale ETS scores 26.5 and the boosted seasonal-difference model 27.0. The boosted trend-plus-remainder model, at 35.2, sits between the two groups.

Now, one way to get this table wrong. A boosted model can also be scored one month at a time: predict each 1959 and 1960 month from the actual previous months, instead of from its own forecasts. The block does that for both boosted models.

```r
# Score the boosted models one month at a time, using the actual previous months as inputs
diff_inputs <- make_lag_table(diff(passengers, lag = 12))[109:132, ]
one_step_diff  <- passengers[109:132] + predict(diff_model$fit, diff_inputs, n.trees = diff_model$n_trees)
one_step_level <- predict(best_level, lag_table[121:144, ], n.trees = best_trees)

round(c(seasonal_difference = rmse(test_actual, one_step_diff),
        level = rmse(test_actual, one_step_level)), 1)
#> seasonal_difference               level
#>                16.4                73.7
```

The seasonal-difference model drops from 27.0 to 16.4, and the level model from 74.1 to 73.7. Those scores answer a different question. They use 1959 and 1960 actuals as inputs, which nobody has in Dec 1958, and the ETS forecasts use none. Only the recursive scores belong in the table.

A single split gives one error estimate, and it depends on which 24 months happened to be the test months. A forecast origin is the last month of the training data, and the loop below refits every method at four origins: Dec 1956, Dec 1957, Dec 1958 and Dec 1959. Each origin is scored on the 12 months that follow it.

The number of trees is chosen again at each origin from that origin's own training months, so the seasonal-difference model ends up with 34, 33, 116 and 75 trees.

```r
# Refit every method at four forecast origins and score each on the next 12 months
origin_scores <- data.frame()

for (origin in c(96, 108, 120, 132)) {
  history <- passengers[1:origin]
  actual_next <- passengers[(origin + 1):(origin + 12)]
  history_ts <- ts(history, start = c(1949, 1), frequency = 12)

  snaive_next  <- as.numeric(snaive(history_ts, h = 12)$mean)
  ets_next     <- as.numeric(forecast(ets(history_ts), h = 12)$mean)
  ets_log_next <- as.numeric(forecast(ets(history_ts, lambda = 0), h = 12)$mean)

  origin_level <- fit_boosted(make_lag_table(history))
  level_next <- boosted_forecast(origin_level$fit, origin_level$n_trees, history, h = 12)

  origin_diff <- fit_boosted(make_lag_table(diff(history, lag = 12)))
  diff_next <- boosted_diff_forecast(origin_diff$fit, origin_diff$n_trees, history, h = 12)

  origin_scores <- rbind(origin_scores, data.frame(
    origin      = origin,
    snaive      = rmse(actual_next, snaive_next),
    ets         = rmse(actual_next, ets_next),
    ets_log     = rmse(actual_next, ets_log_next),
    boost_level = rmse(actual_next, level_next),
    boost_diff  = rmse(actual_next, diff_next),
    diff_trees  = origin_diff$n_trees
  ))
}

round(origin_scores, 1)
#>   origin snaive  ets ets_log boost_level boost_diff diff_trees
#> 1     96   41.5 24.4    14.9        42.2       21.7         34
#> 2    108   17.0 21.3    29.0        45.6       17.9         33
#> 3    120   49.3 50.8    25.4        55.6       21.6        116
#> 4    132   50.7 27.4    23.5        59.9       14.6         75

# Average the RMSE over the four origins
round(colMeans(origin_scores[, c("snaive", "ets", "ets_log", "boost_level", "boost_diff")]), 1)
#>      snaive         ets     ets_log boost_level  boost_diff
#>        39.6        31.0        23.2        50.8        19.0

# Count the origins where the seasonal-difference model beats ETS on the log scale
sum(origin_scores$boost_diff < origin_scores$ets_log)
#> [1] 3
```

Averaged over the four origins, the RMSE is 39.6 for seasonal naive, 31.0 for ETS, 23.2 for ETS on the log scale, 50.8 for the boosted level model and 19.0 for the boosted seasonal-difference model. The boosted seasonal-difference model beats ETS on the log scale at 3 of the 4 origins.

On the single 24-month split, ETS on the log scale was ahead, 26.5 against 27.0. Over four origins the boosted seasonal-difference model is ahead, 19.0 against 23.2. The sign changed. After the seasonal difference, the boosted model and ETS on the log scale have errors in the same range, so the result does not show that boosting is more accurate.

The level model tells the same story from the other side. It relies mainly on `lag_12`, the input seasonal naive uses, so its error is near seasonal naive on the 24-month split (74.1 against 77.0) and worse over four origins (50.8 against 39.6).

[WARNING]
A result that changes sign between one split and four origins is not a win for either method. Report it as comparable.

One difference this table cannot show is that boosted trees can use extra features such as price or holidays, while ETS here uses only the series.

=== step === quiz
## Quick check: comparing a one-step RMSE with a 24-month forecast RMSE

A colleague reports an RMSE of 16.4 for the boosted seasonal-difference model against 26.5 for ETS on the log scale. The 16.4 comes from predicting each 1959 and 1960 month from the actual previous months. Which sentence about the comparison is right?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- The two scores are comparable, because both use the same 24 test months. ::no
- Boosted models always beat ETS, so 16.4 against 26.5 is what you would expect. ::no
- The scores are not comparable: the boosted score used the actual 1959 and 1960 months as inputs and the ETS forecast used none. Score the boosted model recursively from Dec 1958, which gives 27.0. ::ok Yes. A forecast made in Dec 1958 has no 1959 or 1960 actuals to feed in, so each forecast has to become the next input. Scored that way the boosted model gets 27.0, and it sits next to the 26.5 of ETS on the log scale.
- The actual lags make the boosted model more accurate, which makes it the more useful model. ::no Using the same 24 test months does not make two scores comparable. The score has to use the same inputs too, and the one-step score used 1959 and 1960 actuals that nobody has in Dec 1958. Extra inputs at scoring time make the number look better without making the forecast better. Boosted models do not always win either: on the 24-month split ETS on the log scale scored 26.5 and the boosted seasonal-difference model 27.0.

=== step === tryit
## Your turn: build the seasonal difference and compare it with the training range

The seasonal difference is the target the seasonal-difference model was fit to. Write it from the series yourself: each month from Jan 1950 on minus the same month one year earlier, which gives 132 values. Then count the test months whose change is above the largest change in the training months.

```r
# Build the seasonal difference and count the test months above the training maximum
passengers <- as.numeric(AirPassengers)

# d holds the 132 changes. d[1:108] are the training months (Jan 1950 to Dec 1958)
# and d[109:132] are the test months (Jan 1959 to Dec 1960).
# Count the test months whose change is above the largest training change.
# Two or three lines. Press Check when you have them.
```
::check {"regex": "(?=[\\s\\S]*(diff[(]\\s*\\w+\\s*,\\s*lag\\s*=\\s*12|\\w+.13:144.\\s*-\\s*\\w+.1:132.))(?=[\\s\\S]*max[(])", "gate": true, "difficulty": "intermediate", "ok": "Yes: 4 of the 24 test months are above the training maximum of 62. The largest is Jul 1960, 622 minus 548 = 74, a change the trees have no training row to build a prediction from.", "no": "Build d with diff(passengers, lag = 12), then compare the test changes d[109:132] with max(d[1:108]) and count the TRUE values with sum()."}
::solution
```r
# Build the seasonal difference and count the test months above the training maximum
passengers <- as.numeric(AirPassengers)
d <- diff(passengers, lag = 12)
sum(d[109:132] > max(d[1:108]))
#> [1] 4
d[127]
#> [1] 74
```

`d[127]` is the Jul 1960 change, 622 minus 548 = 74, against a training maximum of 62. A boosted tree fit to d has no training row with a change that large, so its forecast for that month cannot reach it.

=== step === concept
## References

- [Forecasting: Principles and Practice, 3rd edition](https://otexts.com/fpp3/) - Hyndman and Athanasopoulos (2021), OTexts. The chapters on seasonal differencing and on time series cross-validation.
- [Greedy function approximation: a gradient boosting machine](https://doi.org/10.1214/aos/1013203451) - Friedman (2001), Annals of Statistics 29(5), 1189 to 1232. The paper that introduced gradient boosting.
- [Generalized Boosted Models: a guide to the gbm package](https://cran.r-project.org/web/packages/gbm/vignettes/gbm.pdf) - Ridgeway, the gbm package vignette. The arguments used in this lesson and how relative influence is computed.
- [Automatic time series forecasting: the forecast package for R](https://doi.org/10.18637/jss.v027.i03) - Hyndman and Khandakar (2008), Journal of Statistical Software 27(3). The source of `ets()` and its automatic model choice.
- [Forecasting with trees](https://doi.org/10.1016/j.ijforecast.2021.10.004) - Januschowski and colleagues (2022), International Journal of Forecasting 38(4). A survey of tree-based methods for forecasting.

=== step === complete
## Recap: boosted-tree forecasts of monthly passengers

You turned a monthly series into a table of lags, fit boosted trees to it, and then checked the result against seasonal naive and ETS. To summarize:

- A lag table with `lag_1`, `lag_2`, `lag_3`, `lag_12` and `month` gives 108 training rows, Jan 1950 to Dec 1958.
- Each tree is fit to the residuals of the current prediction, and the number of trees is chosen on the last 12 training months in time order: 256 of 300.
- A 24-month forecast is recursive, so each forecast is fed back in as the next lag.
- A tree predicts only from leaf values estimated on training data. The level model stayed between 352 and 463 while the actual months reached 622, an RMSE of 74.1, and more trees did not change that.
- Predicting the seasonal difference brought the RMSE to 27.0, and a linear trend plus boosted remainder brought it to 35.2.
- On the same 24 months ETS on the log scale scored 26.5. Over four forecast origins the seasonal-difference model averaged 19.0 against 23.2: comparable, not clearly better.

The next part fits a neural network to lagged values with `nnetar`.
