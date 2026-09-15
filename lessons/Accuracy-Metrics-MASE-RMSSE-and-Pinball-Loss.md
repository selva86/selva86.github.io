---
title: "Forecasting Toolbox Lesson 6: Accuracy metrics: MASE, RMSSE and pinball loss"
catalog_blurb: "See why MASE, RMSSE and pinball loss score a forecast more fairly than RMSE."
description: "See why RMSE, MAE and MAPE can mislead you, and how MASE, RMSSE, pinball loss and CRPS score a forecast fairly across scales and for real stocking decisions."
keywords: "mase in r, rmsse in r, pinball loss, crps forecast accuracy, mean absolute scaled error, root mean squared scaled error, distribution accuracy measures, fable accuracy function, seasonal naive benchmark, time series forecast accuracy metrics"
post_type: "LESSON"
curriculum_id: "5.30.6"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "ts-toolbox"
course_title: "Forecasting Toolbox"
course_lesson: "6"
course_total: "6"
course_landing: "Forecasting-Toolbox-Course.html"
course_next: ""
course_prev: "Time-Series-Cross-Validation-Rolling-Origin.html"
---

=== step === cover
## Accuracy metrics: MASE, RMSSE and pinball loss

Today let's learn how to score a forecast honestly, using two months of cone sales from a small boardwalk ice-cream cart.

Pier Nine sells cones from a cart on the boardwalk. Below are all 63 days of its sales, from June 1 to August 2, 2026. Weekdays run close to 15 cones a day, weekends climb to around 34, and every so often a rain washout drops a day down to almost nothing.

The last 14 days are marked apart as the test window. No model gets to see them while it is being built. They only get used afterward, to check how good each forecast really was.

Here is the whole series, with the test window marked apart.

::widget chart-plotter {"data":[{"x":"2026-06-01","y":11,"fill":"train"},{"x":"2026-06-02","y":14,"fill":"train"},{"x":"2026-06-03","y":13,"fill":"train"},{"x":"2026-06-04","y":12,"fill":"train"},{"x":"2026-06-05","y":13,"fill":"train"},{"x":"2026-06-06","y":33,"fill":"train"},{"x":"2026-06-07","y":33,"fill":"train"},{"x":"2026-06-08","y":14,"fill":"train"},{"x":"2026-06-09","y":9,"fill":"train"},{"x":"2026-06-10","y":18,"fill":"train"},{"x":"2026-06-11","y":11,"fill":"train"},{"x":"2026-06-12","y":10,"fill":"train"},{"x":"2026-06-13","y":29,"fill":"train"},{"x":"2026-06-14","y":23,"fill":"train"},{"x":"2026-06-15","y":15,"fill":"train"},{"x":"2026-06-16","y":14,"fill":"train"},{"x":"2026-06-17","y":17,"fill":"train"},{"x":"2026-06-18","y":11,"fill":"train"},{"x":"2026-06-19","y":2,"fill":"train"},{"x":"2026-06-20","y":2,"fill":"train"},{"x":"2026-06-21","y":38,"fill":"train"},{"x":"2026-06-22","y":14,"fill":"train"},{"x":"2026-06-23","y":13,"fill":"train"},{"x":"2026-06-24","y":14,"fill":"train"},{"x":"2026-06-25","y":15,"fill":"train"},{"x":"2026-06-26","y":9,"fill":"train"},{"x":"2026-06-27","y":32,"fill":"train"},{"x":"2026-06-28","y":32,"fill":"train"},{"x":"2026-06-29","y":8,"fill":"train"},{"x":"2026-06-30","y":12,"fill":"train"},{"x":"2026-07-01","y":16,"fill":"train"},{"x":"2026-07-02","y":15,"fill":"train"},{"x":"2026-07-03","y":13,"fill":"train"},{"x":"2026-07-04","y":36,"fill":"train"},{"x":"2026-07-05","y":45,"fill":"train"},{"x":"2026-07-06","y":18,"fill":"train"},{"x":"2026-07-07","y":0,"fill":"train"},{"x":"2026-07-08","y":18,"fill":"train"},{"x":"2026-07-09","y":19,"fill":"train"},{"x":"2026-07-10","y":11,"fill":"train"},{"x":"2026-07-11","y":35,"fill":"train"},{"x":"2026-07-12","y":1,"fill":"train"},{"x":"2026-07-13","y":10,"fill":"train"},{"x":"2026-07-14","y":24,"fill":"train"},{"x":"2026-07-15","y":2,"fill":"train"},{"x":"2026-07-16","y":20,"fill":"train"},{"x":"2026-07-17","y":1,"fill":"train"},{"x":"2026-07-18","y":2,"fill":"train"},{"x":"2026-07-19","y":35,"fill":"train"},{"x":"2026-07-20","y":9,"fill":"test"},{"x":"2026-07-21","y":9,"fill":"test"},{"x":"2026-07-22","y":11,"fill":"test"},{"x":"2026-07-23","y":13,"fill":"test"},{"x":"2026-07-24","y":0,"fill":"test"},{"x":"2026-07-25","y":29,"fill":"test"},{"x":"2026-07-26","y":26,"fill":"test"},{"x":"2026-07-27","y":0,"fill":"test"},{"x":"2026-07-28","y":15,"fill":"test"},{"x":"2026-07-29","y":18,"fill":"test"},{"x":"2026-07-30","y":14,"fill":"test"},{"x":"2026-07-31","y":16,"fill":"test"},{"x":"2026-08-01","y":29,"fill":"test"},{"x":"2026-08-02","y":41,"fill":"test"}],"geoms":["line","point"],"x":"date","y":"sales","code":{"line":"ggplot(df, aes(date, sales, color = group)) +\n  geom_line() +\n  geom_point(size = 1)","point":"ggplot(df, aes(date, sales, color = group)) +\n  geom_point()"}}

That is the series every metric in this lesson scores against.

=== step === concept
## Two forecasts to score

Let's build that series for real, and split it the same way: the first 49 days to train two models on, the last 14 held back to test them against.

```r
# Build Pier Nine's 63 days of cone sales and split them into 49 training days and 14 test days
library(tsibble)
library(fable)
library(fabletools)
library(dplyr)

set.seed(930)
n <- 63
day <- seq(as.Date("2026-06-01"), by = "day", length.out = n)
weekend <- as.integer(format(day, "%u")) %in% c(6, 7)

rain <- rbinom(n, 1, 0.15) == 1
base_sales <- rpois(n, ifelse(weekend, 34, 15))
rain_sales <- sample(0:2, sum(rain), replace = TRUE)
sales <- base_sales
sales[rain] <- rain_sales

cart <- tsibble(date = day, sales = sales, index = date)
train <- cart |> filter(date <= as.Date("2026-07-19"))
test <- cart |> filter(date > as.Date("2026-07-19"))
```

Two models get fit on those 49 training days. Seasonal_naive is the simplest forecast Pier Nine's owner could make by hand: repeat each day's sales from the same weekday, one week back, since a Monday tends to look like the Monday before it. ETS is fabletools's automatic exponential smoothing model. It looks at the same 49 days and works out its own level and weekly pattern, without being told what either one is.

Fit both, forecast 14 days ahead, and line the first 5 up against what actually happened.

```r
# Fit a seasonal-naive model and an ETS model on the training days, then forecast 14 days ahead
fit <- train |> model(
  Seasonal_naive = SNAIVE(sales ~ lag("week")),
  ETS = ETS(sales)
)
fc <- fit |> forecast(h = 14)

data.frame(
  date = test$date,
  actual = test$sales,
  Seasonal_naive = round(fc$.mean[fc$.model == "Seasonal_naive"], 1),
  ETS = round(fc$.mean[fc$.model == "ETS"], 2)
)[1:5, ]
#>         date actual Seasonal_naive   ETS
#> 1 2026-07-20      9             10 12.07
#> 2 2026-07-21      9             24 11.19
#> 3 2026-07-22     11              2 15.17
#> 4 2026-07-23     13             20 14.11
#> 5 2026-07-24      0              1  9.40
```

Look at 21 July. Seasonal_naive forecasts 24 cones for a day that sold 9, off by 15. ETS lands much closer, at 11.19. Neither model is perfect on every day. Turning "how far off" into one honest number is the whole point from here.

=== step === concept
## MAE and RMSE: the two everyday error scores

The most direct way to score a forecast is to look at how far its numbers sat from the real ones, on average.

Mean Absolute Error, MAE, takes every gap between a forecast and the actual sales, drops the sign, and averages them. Root Mean Squared Error, RMSE, squares every gap before averaging, then takes the square root to bring the units back to cones. Both stay in the series' own unit, cones.

fabletools's `accuracy()` function computes both at once, for every model, across the 14 test days.

```r
# Score both models' point forecasts with RMSE and MAE
accuracy(fc, cart) |> select(.model, RMSE, MAE)
#> # A tibble: 2 x 3
#>   .model          RMSE   MAE
#>   <chr>          <dbl> <dbl>
#> 1 ETS             5.98  4.84
#> 2 Seasonal_naive 13.7  11.3
```

ETS scores RMSE 5.98 and MAE 4.84. Seasonal_naive scores RMSE 13.7 and MAE 11.3, a little over twice as high. Both scores are in cones, which is why a forecast off by 5 to 6 cones a day clearly beats one off by 11 to 14.

Notice RMSE runs a little higher than MAE for both models. That is not a mistake. Squaring an error weights the big misses harder than the small ones, so the days Pier Nine's sales swing hard between a weekday and a weekend push RMSE up more than MAE.

=== step === concept
## Why RMSE and MAE can't compare across series

Here is the catch with MAE and RMSE. They are honest numbers, but only inside one series.

Say Pier Nine's owner started reporting sales in cases of 10 cones instead of single cones, purely a change in bookkeeping. Nothing about how well Seasonal_naive actually forecasts would change. Let's check.

```r
# Rescale sales by dividing by 10, as if Pier Nine reported in cases of 10 cones, refit Seasonal_naive, and rescore
cart2 <- cart |> mutate(sales = sales / 10)
train2 <- cart2 |> filter(date <= as.Date("2026-07-19"))
fit2 <- train2 |> model(Seasonal_naive = SNAIVE(sales ~ lag("week")))
fc2 <- fit2 |> forecast(h = 14)
accuracy(fc2, cart2) |> select(.model, RMSE, MAE)
#> # A tibble: 1 x 3
#>   .model          RMSE   MAE
#>   <chr>          <dbl> <dbl>
#> 1 Seasonal_naive  1.37  1.13
```

RMSE drops from 13.7 to 1.37. MAE drops from 11.3 to 1.13. Both fell by exactly a factor of 10, the same factor the sales were divided by. The forecast did not get better. The unit just got bigger.

So a raw RMSE or MAE number means nothing on its own. An RMSE of 5.98 cones a day for a small boardwalk cart can never be compared against a chain's RMSE of a few hundred cones a day across a whole city, even if one forecast is really far more accurate than the other. What you need is a score built to cancel the scale out.

=== step === concept
## MAPE and why it breaks on zero actuals

There is an obvious fix for comparing across series: turn the error into a percentage instead of a raw count. That is what Mean Absolute Percentage Error, MAPE, does. It divides each gap by the actual value, takes the absolute value, averages, and multiplies by 100.

That sounds like a clean fix, until an actual value is 0.

Rain washouts happen at Pier Nine, and two of them landed inside the 14-day test window.

```r
# Find the rain-washout days that sold zero cones inside the test window
as.data.frame(test) |> filter(sales == 0)
#>         date sales
#> 1 2026-07-24     0
#> 2 2026-07-27     0
```

Both 24 July and 27 July sold exactly 0 cones. Divide any nonzero forecast miss by an actual of 0 and the result is undefined. R shows it as `Inf`.

```r
# Show exactly why MAPE breaks: it divides the error by the actual value
actual_0724 <- test$sales[test$date == as.Date("2026-07-24")]
ets_fc_0724 <- round(fc$.mean[fc$.model == "ETS" & fc$date == as.Date("2026-07-24")], 2)

actual_0724
#> [1] 0
ets_fc_0724
#> [1] 9.4
100 * abs(ets_fc_0724 - actual_0724) / actual_0724
#> [1] Inf
```

ETS forecast 9.4 cones for 24 July, real sales were 0, and 100 times the absolute gap over 0 cones has no defined value.

```r
# Check the same accuracy() call for MPE and MAPE
accuracy(fc, cart) |> select(.model, MPE, MAPE)
#> # A tibble: 2 x 3
#>   .model           MPE  MAPE
#>   <chr>          <dbl> <dbl>
#> 1 ETS             -Inf   Inf
#> 2 Seasonal_naive  -Inf   Inf
```

Both models come back `Inf`. That is not because either model did badly that day. It is because MAPE cannot survive an actual of 0. Even short of an exact zero, dividing by a small actual number stretches an ordinary miss into a huge percentage, so MAPE is unsafe any time actual values can sit near zero, not only when they hit it exactly.

=== step === concept
## MASE and RMSSE: scaling error against the seasonal-naive benchmark

Here is the fix that actually works. Instead of dividing by the actual sales, which can hit 0, divide by how much the series naturally moves from one week to the next.

Look inside the 49 training days only, the same days the models were built on, never the test days. Take the difference between each day's sales and the same weekday one week earlier. Average the absolute size of those differences and you get one fixed number: how much Pier Nine's daily sales typically swing week over week.

Here is that swing, computed from the training days alone.

```r
# Compute the training-only week-over-week benchmark scale
train_diff7 <- diff(train$sales, lag = 7)
scale_mase <- mean(abs(train_diff7))
scale_rmsse <- mean(train_diff7^2)
round(c(scale_mase = scale_mase, scale_rmsse = scale_rmsse), 2)
#>  scale_mase scale_rmsse
#>        8.83      188.83
```

That number, 8.83 cones, never touches the test window and never touches any model's forecast. It is purely a property of the training data. Mean Absolute Scaled Error, MASE, divides a model's test MAE by that number.

Divide ETS's test MAE and RMSE by that swing to get MASE and RMSSE by hand.

```r
# Compute MASE and RMSSE by hand from ETS's test error and the training-only scale
acc <- accuracy(fc, cart)
mae_ets <- acc$MAE[acc$.model == "ETS"]
rmse_ets <- acc$RMSE[acc$.model == "ETS"]

round(mae_ets / scale_mase, 3)
#> [1] 0.548
round(sqrt(rmse_ets^2 / scale_rmsse), 3)
#> [1] 0.435
```

For ETS, 4.84 divided by 8.83 comes to 0.548. Root Mean Squared Scaled Error, RMSSE, does the same thing with squared differences: divide the model's squared test error by 188.83, the mean squared week-over-week difference in training, then take the square root. That gives 0.435.

Compare the hand calculation against `accuracy()`'s own columns.

```r
# All four point-forecast scores side by side
accuracy(fc, cart) |> select(.model, RMSE, MAE, MASE, RMSSE)
#> # A tibble: 2 x 5
#>   .model          RMSE   MAE  MASE RMSSE
#>   <chr>          <dbl> <dbl> <dbl> <dbl>
#> 1 ETS             5.98  4.84 0.548 0.435
#> 2 Seasonal_naive 13.7  11.3  1.28  0.997
```

0.548 and 0.435 for ETS, exactly matching the hand calculation. Seasonal_naive scores MASE 1.28 and RMSSE 0.997.

Read MASE and RMSSE the same way. A score under 1 means the model beat what a plain seasonal-naive guess would have scored on the training data alone. A score at or above 1 means it did not. ETS clears that bar on both counts. Seasonal_naive barely clears it on RMSSE, and misses it on MASE.

Because both scores divide by a number computed from the series' own swings, rescaling the series should not move them at all. Confirm that against the /10 rescale from a moment ago.

```r
# Confirm MASE and RMSSE are unchanged by the /10 rescale
accuracy(fc2, cart2) |> select(.model, MASE, RMSSE)
#> # A tibble: 1 x 3
#>   .model          MASE RMSSE
#>   <chr>          <dbl> <dbl>
#> 1 Seasonal_naive  1.28 0.997
```

1.28 and 0.997, identical to what Seasonal_naive scored in whole cones. Divide the whole series by 10 and MASE and RMSSE do not move, because the numerator and the denominator shrink by the same factor and cancel out. That is what makes them safe to compare a boardwalk cart against a citywide chain: neither series' own unit survives the division.

Here both models' scores sit side by side, cones on the left, unit-free on the right.

::widget styled-table {"cols":["model","RMSE","MAE","MASE","RMSSE"],"rows":[["ETS","5.98","4.84","0.548","0.435"],["Seasonal_naive","13.7","11.3","1.28","0.997"]],"title":"Pier Nine: ETS vs Seasonal_naive on the 14-day test window","note":"MASE and RMSSE below 1 beat a seasonal-naive guess trained on the 49 training days alone."}

=== step === quiz
## Quick check: reading a MASE score

A third model, fit to Pier Nine's own 49 training days, scores MASE 1.35 on the same 14-day test window. What does that tell you?

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- It forecasts the test window worse, on average, than a seasonal-naive guess made from the training data alone. ::ok Right. MASE compares a model's test error to what a seasonal-naive guess would have scored on the training data alone. Above 1 means the model did worse than that baseline, here by 35 percent.
- It explains 135 percent of the variance in Pier Nine's cone sales. ::no
- It misses the actual sales by 1.35 cones a day on average. ::no
- It beats what a seasonal-naive guess would have scored on the training data alone. ::no MASE is a ratio against a seasonal-naive guess made from the training data alone, not a percentage, a cone count, or a plain accuracy score. Under 1 beats that baseline, at or above 1 does not, and 1.35 is above 1.

=== step === concept
## Point forecasts aren't enough for every decision: pinball loss

MASE and RMSSE both answer the same kind of question: how far off was the forecast, on average. That is not always the question Pier Nine's owner needs answered.

Suppose the owner is not asking about an average day at all. The owner wants to know how many cones to stock so the cart runs out on at most 1 day in 10. That is not a point forecast anymore. It is a quantile: the 90th percentile of the possible sales for that day, written q90.

ETS does not just forecast a single mean for each day. Fit with `model()`, it carries a full distribution for every day, and any quantile can be pulled straight out of it.

Here is ETS's q90 forecast next to what Pier Nine actually sold, across all 14 test days.

::widget chart-plotter {"data":[{"x":"2026-07-20","y":9,"fill":"actual"},{"x":"2026-07-20","y":23.98,"fill":"q90"},{"x":"2026-07-21","y":9,"fill":"actual"},{"x":"2026-07-21","y":23.09,"fill":"q90"},{"x":"2026-07-22","y":11,"fill":"actual"},{"x":"2026-07-22","y":27.08,"fill":"q90"},{"x":"2026-07-23","y":13,"fill":"actual"},{"x":"2026-07-23","y":26.01,"fill":"q90"},{"x":"2026-07-24","y":0,"fill":"actual"},{"x":"2026-07-24","y":21.31,"fill":"q90"},{"x":"2026-07-25","y":29,"fill":"actual"},{"x":"2026-07-25","y":37.17,"fill":"q90"},{"x":"2026-07-26","y":26,"fill":"actual"},{"x":"2026-07-26","y":41.74,"fill":"q90"},{"x":"2026-07-27","y":0,"fill":"actual"},{"x":"2026-07-27","y":23.98,"fill":"q90"},{"x":"2026-07-28","y":15,"fill":"actual"},{"x":"2026-07-28","y":23.09,"fill":"q90"},{"x":"2026-07-29","y":18,"fill":"actual"},{"x":"2026-07-29","y":27.08,"fill":"q90"},{"x":"2026-07-30","y":14,"fill":"actual"},{"x":"2026-07-30","y":26.01,"fill":"q90"},{"x":"2026-07-31","y":16,"fill":"actual"},{"x":"2026-07-31","y":21.31,"fill":"q90"},{"x":"2026-08-01","y":29,"fill":"actual"},{"x":"2026-08-01","y":37.17,"fill":"q90"},{"x":"2026-08-02","y":41,"fill":"actual"},{"x":"2026-08-02","y":41.74,"fill":"q90"}],"geoms":["line","point"],"x":"date","y":"cones","code":{"line":"ggplot(df, aes(date, cones, color = group)) +\n  geom_line() +\n  geom_point(size = 1)","point":"ggplot(df, aes(date, cones, color = group)) +\n  geom_point()"}}

Look at 27 July. ETS's q90 sat at about 24 cones, putting at least a 9 in 10 chance on sales landing at 24 or below that day. Real sales were 0, a rain washout.

Stocking to a quantile makes the two kinds of miss unequal on purpose. Running out costs Pier Nine a lost sale and an annoyed customer. Overstocking costs a few melted cones. Pinball loss scores a quantile forecast with exactly that asymmetry built in. At level L, an understock, where actual sales come in at or above the forecast, gets weighted by L. An overstock, where actual sales fall below it, gets the smaller weight, (1 - L).

Score 27 July by hand.

```r
# Find ETS's 90th-percentile forecast for 27 July and score it with pinball loss
ets_q90 <- fc |> filter(.model == "ETS", date == as.Date("2026-07-27")) |>
  pull(sales) |> quantile(0.90) |> round(1)
actual_0727 <- test$sales[test$date == as.Date("2026-07-27")]

ets_q90
#> [1] 24
actual_0727
#> [1] 0

# Pier Nine overstocked: 0 actual sales came in under the 24-cone forecast
overstock_loss <- 2 * (1 - 0.90) * (ets_q90 - actual_0727)
overstock_loss
#> [1] 4.8

# The same 24-cone gap, scored as if it had gone the other way: an understock
understock_loss <- 2 * 0.90 * ets_q90
understock_loss
#> [1] 43.2
```

27 July was an overstock: Pier Nine stocked for 24, sold 0. That gets the light weight, (1 - 0.90): loss = 0.10 * (24 - 0) = 2.4, doubled to 4.8 by fable's own `pinball_loss()` function, which multiplies every score by 2. Now imagine the identical 24-cone gap had gone the other way, demand landing 24 cones above what was stocked, an understock instead. That gets the heavy weight, 0.90: loss = 0.90 * 24 * 2 = 43.2, nine times as large for the same size of miss. That is not an accident. It is pinball loss doing exactly what Pier Nine's owner would want: punishing a stockout far harder than a little melted stock.

=== step === concept
## Averaging pinball loss across every quantile: CRPS

Pinball loss at q90 answers one specific question: how good was the stocking level for a 90 percent no-stockout target. But a forecast's whole distribution can be scored at once, not just one quantile of it.

fabletools calls the average of pinball loss over percentiles 1 through 99 the percentile score. Its continuous limit, averaging over every quantile instead of 99 of them, is the Continuous Ranked Probability Score, CRPS. Both come from one function call.

Score each model's whole predictive distribution with one function call.

```r
# Score each model's whole predictive distribution with fabletools's distribution measures
accuracy(fc, cart, measures = distribution_accuracy_measures)
#> # A tibble: 2 x 4
#>   .model         .type percentile  CRPS
#>   <chr>          <chr>      <dbl> <dbl>
#> 1 ETS            Test        3.62  3.58
#> 2 Seasonal_naive Test        7.93  7.85
```

ETS scores percentile 3.62 and CRPS 3.58. Seasonal_naive scores 7.93 and 7.85, roughly twice as large. The lower score means ETS's whole predictive distribution, not just its point forecast, sits closer to the real sales at every quantile, not only the 90th.

=== step === concept
## Picking the metric from the decision
::prose-only a decision list restating numbers already shown in earlier steps, nothing new to draw

Every metric in this lesson answers a slightly different question. The one worth using depends on the decision behind it, not habit.

- If two models forecast the same series, and an ordinary miss costs about the same as a big one, MAE is enough.
- If a big miss costs more than an ordinary one, RMSE already weights it that way.
- If the comparison crosses series of different scale, or against a naive benchmark, MAE and RMSE stop meaning anything: use MASE or RMSSE instead.
- If the decision needs one specific number, a stock level or a staffing count, score that quantile directly with pinball loss.
- If the decision needs one score for a model's entire predictive distribution, use CRPS.
- MAPE is never safe once an actual value can be 0 or sit close to it.

Pier Nine's own numbers show all of this at once. ETS beat Seasonal_naive on RMSE, MAE, MASE, RMSSE, percentile score and CRPS. Neither model's MAPE meant anything at all, because two of the fourteen test days sold 0 cones.

=== step === quiz
## Quick check: choosing the right metric for the decision

Pier Nine's forecast scores RMSE 5.98 cones a day. A cart chain forecasting 50 carts citywide scores RMSE 340 cones a day across its whole network. The owner asks which forecast is more accurate. What do you check?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Pier Nine's forecast, since RMSE 5.98 is a much smaller number than 340. ::no
- The chain's forecast, since a busier series always scores better on RMSE. ::no
- Neither number on its own. Compare their MASE or RMSSE instead, since those scale each forecast against its own seasonal-naive benchmark. ::ok Right. RMSE and MAE live in each series' own unit, so a boardwalk cart's score and a citywide chain's score are not on the same scale. MASE and RMSSE fix that by dividing each model's error by its own seasonal-naive benchmark, so a value like 0.55 means the same thing whether it comes from 6 cones a day or 600.
- Their MAPE, since it is already a percentage. ::no A raw RMSE or MAE number only means something within one series' own scale, and MAPE breaks the moment an actual value is 0 or close to it, which can happen on both a small cart and a busy chain. MASE and RMSSE are the ones built to compare across series like this.

=== step === tryit
## Your turn: score both models' full distributions

`fc` still holds both models' forecasts, and `cart` still holds all 63 days of real sales. Fill in the blank so the call scores both models' whole predictive distributions, the same way you just saw work, and press Check.

```r
# Score both models' whole predictive distributions, not just their point forecasts
accuracy(____, cart, measures = distribution_accuracy_measures)
```
::check {"regex": "accuracy[(]\\s*fc\\s*,\\s*cart\\s*,\\s*measures\\s*=\\s*distribution_accuracy_measures\\s*[)]", "gate": true, "difficulty": "intermediate", "ok": "Right. fc holds both models' forecasts and cart holds the real sales to check them against, exactly like every accuracy() call in this lesson. ETS scores lower on CRPS, 3.58 against Seasonal_naive's 7.85, so its whole predictive distribution tracks the real days more closely.", "no": "The forecast object built two steps back is called fc. Fill the blank with that name: accuracy(fc, cart, measures = distribution_accuracy_measures)."}
::solution
```r
# Score both models' whole predictive distributions
accuracy(fc, cart, measures = distribution_accuracy_measures)
#> # A tibble: 2 x 4
#>   .model         .type percentile  CRPS
#>   <chr>          <chr>      <dbl> <dbl>
#> 1 ETS            Test        3.62  3.58
#> 2 Seasonal_naive Test        7.93  7.85
```

=== step === concept
## References

- [Evaluating point forecast accuracy](https://otexts.com/fpp3/accuracy.html) - Hyndman, R.J. and Athanasopoulos, G., Forecasting: Principles and Practice (3rd ed), section 5.8.
- [Evaluating distributional forecasts](https://otexts.com/fpp3/distaccuracy.html) - Hyndman, R.J. and Athanasopoulos, G., Forecasting: Principles and Practice (3rd ed), section 5.9.
- [Another look at measures of forecast accuracy](https://doi.org/10.1016/j.ijforecast.2006.03.001) - Hyndman, R.J. and Koehler, A.B. (2006), International Journal of Forecasting, 22(4), 679-688. The paper that introduced MASE.
- [Strictly Proper Scoring Rules, Prediction, and Estimation](https://doi.org/10.1198/016214506000001437) - Gneiting, T. and Raftery, A.E. (2007), Journal of the American Statistical Association, 102(477), 359-378. The source for pinball loss and CRPS as proper scoring rules.
- [accuracy() and distribution_accuracy_measures()](https://fabletools.tidyverts.org/reference/accuracy.html) - fabletools package reference documentation.

=== step === complete
## What you can do now

Pier Nine's numbers, one more time. ETS beat Seasonal_naive on every score tried: RMSE 5.98 against 13.7, MAE 4.84 against 11.3, MASE 0.548 against 1.28, RMSSE 0.435 against 0.997, percentile score 3.62 against 7.93, CRPS 3.58 against 7.85.

- RMSE and MAE only mean something inside one series' own unit. Rescale the series and they rescale right along with it.
- MAPE fails the moment an actual value is 0, and gets unreliable well before that.
- MASE and RMSSE fix both problems by dividing a model's error by what a seasonal-naive guess scores on the training data alone, which cancels the unit out.
- Pinball loss scores one chosen quantile, with a stockout weighted heavier than an overstock on purpose.
- CRPS averages that same idea across every quantile, for one score on a model's whole predictive distribution.

You can now compute and choose among all seven of these for a forecast of your own, and pick the right one for whatever decision is actually behind it.
