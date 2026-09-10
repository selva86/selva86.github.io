---
title: "Time Series Foundations Lesson 8: The benchmark forecasts every model must beat"
catalog_blurb: "See why every fancier forecast has to beat a plain benchmark first."
description: "Learn the four benchmark forecasts in R's fable package, MEAN, NAIVE, SNAIVE and drift, plus the accuracy and MASE rule every fancier model must beat."
keywords: "benchmark forecast in r, naive forecast, seasonal naive forecast, MEAN NAIVE SNAIVE fable, drift forecast r, accuracy fable r, MASE forecast accuracy, time series forecast evaluation"
post_type: "LESSON"
curriculum_id: "5.10.8"
webr: true
mathjax: false
lesson_access: "free"
course_id: "ts-foundations"
course_title: "Time Series Foundations"
course_lesson: "8"
course_total: "8"
course_landing: "Time-Series-Foundations-Course.html"
course_next: ""
course_prev: "Train-and-Test-Splits-for-Temporal-Data.html"
---

=== step === cover
## The benchmark forecasts every model must beat

Today let's understand the benchmark forecasts every model must beat, using one running example you'll carry through the whole lesson.

Dockside Kayak Rentals is a small rental shop. Its owner keeps one simple record: how many kayaks went out the door each month, from January 2022 to December 2025. That's 48 months.

::widget chart-plotter {"data":[{"x":1,"y":82},{"x":2,"y":109},{"x":3,"y":112},{"x":4,"y":164},{"x":5,"y":201},{"x":6,"y":225},{"x":7,"y":224},{"x":8,"y":202},{"x":9,"y":217},{"x":10,"y":177},{"x":11,"y":116},{"x":12,"y":93},{"x":13,"y":97},{"x":14,"y":95},{"x":15,"y":157},{"x":16,"y":154},{"x":17,"y":230},{"x":18,"y":262},{"x":19,"y":265},{"x":20,"y":256},{"x":21,"y":215},{"x":22,"y":178},{"x":23,"y":143},{"x":24,"y":132},{"x":25,"y":125},{"x":26,"y":142},{"x":27,"y":159},{"x":28,"y":192},{"x":29,"y":242},{"x":30,"y":247},{"x":31,"y":281},{"x":32,"y":252},{"x":33,"y":247},{"x":34,"y":203},{"x":35,"y":172},{"x":36,"y":156},{"x":37,"y":137},{"x":38,"y":151},{"x":39,"y":178},{"x":40,"y":232},{"x":41,"y":257},{"x":42,"y":286},{"x":43,"y":292},{"x":44,"y":290},{"x":45,"y":253},{"x":46,"y":232},{"x":47,"y":203},{"x":48,"y":163}],"geoms":["point","line","bar"],"x":"month","y":"rentals"}

Look at the shape above. Rentals climb year over year, and every summer they spike well above winter's low point, then fall back each January. Before reaching for anything more complicated, there's a simpler question worth answering first: what's the plainest forecast you could make for a series shaped like this, and how good would it have to be before a fancier model is worth switching to?

=== step === concept
## Splitting the series into what you fit and what you check

Before fitting any model, you need a plain, boring rule to compare it against. That's called a benchmark forecast: a rule simple enough to need almost no judgment to build, yet it sets the minimum bar any fancier model has to clear. If a complicated model can't beat a benchmark, its extra complexity wasn't worth it.

To check a forecast fairly, you can't look at how well it fits months it already saw. You have to hold real months back, forecast them without looking, and then compare. So split Dockside Kayak Rentals' 48 months into two windows: a training window the models get to see, and a test window they don't.

```r
# Build the monthly tsibble and split it into a training window and a held-back test window
library(tsibble)
library(dplyr)

set.seed(608)
month <- yearmonth("2022 Jan") + 0:47
rentals <- round(150 + 1.8 * (0:47) +
  70 * sin(2 * pi * (((0:47) %% 12) - 3) / 12) +
  rnorm(48, 0, 12))
kayak <- tsibble(month = month, rentals = rentals, index = month)

train <- kayak |> filter_index("2022 Jan" ~ "2024 Dec")
test <- kayak |> filter_index("2025 Jan" ~ .)

cat("train:", nrow(train), "rows   test:", nrow(test), "rows\n")
#> train: 36 rows   test: 12 rows
```

Thirty-six months, 2022 through 2024, train every benchmark this lesson builds. The twelve months of 2025 stay locked away as `test`, the real numbers every forecast gets checked against.

Now plot the whole series again, this time colouring the two windows so the split is easy to see.

```r
# Plot the full series, colouring the training months and the held-back test months differently
library(ggplot2)

ggplot() +
  geom_line(data = train, aes(month, rentals), colour = "#2C7FB8", linewidth = 1) +
  geom_point(data = train, aes(month, rentals), colour = "#2C7FB8") +
  geom_line(data = test, aes(month, rentals), colour = "#D95F02", linewidth = 1) +
  geom_point(data = test, aes(month, rentals), colour = "#D95F02") +
  labs(x = "Month", y = "Rentals")
```

Blue is `train`, the history every model gets to learn from. Orange is `test`, the twelve months no model is allowed to see until after it's made its forecast.

=== step === concept
## The plainest guesses: MEAN() and NAIVE()

Start with the two simplest forecasts anyone could make.

The first is `MEAN()`: forecast every future month as the historical average, the mean of everything you've seen so far. The second is `NAIVE()`: forecast every future month as whatever the very last observed value was, and just repeat it forward. Neither one looks at trend or season. Both just draw a flat line.

Fit both on `train`, using fable's `model()` function, and forecast 12 months ahead, the length of the held-back test window.

```r
# Fit the two plainest benchmarks: the historical average, and the last observed value
library(fable)
library(fabletools)

fit_mn <- model(train, Mean = MEAN(rentals), Naive = NAIVE(rentals))
fc_mn <- forecast(fit_mn, h = 12)

print(as.data.frame(fc_mn |> as_tibble() |> distinct(.model, forecast = round(.mean, 1))), row.names = FALSE)
#>  .model forecast
#>    Mean    181.2
#>   Naive    156.0
```

`Mean` forecasts a flat 181.2 rentals every month of 2025, the average of all 36 training months. `Naive` forecasts a flat 156.0, because December 2024, the last month train saw, happened to land at 156. Neither number moves from January to December, even though the real series climbs into summer and dips into winter every single year.

Plot both against the training history to see the mismatch directly.

```r
# Plot both forecasts against the training history, to see the flat lines they draw
history <- train |> as_tibble() |> transmute(month, rentals, series = "Training history")
forecasts_mn <- fc_mn |> as_tibble() |> transmute(month, rentals = .mean, series = .model)
compare_mn <- bind_rows(history, forecasts_mn)

ggplot(compare_mn, aes(month, rentals, colour = series)) +
  geom_line(linewidth = 1) +
  labs(x = "Month", y = "Rentals")
```

Notice `Naive`'s flat line sits low, because it anchors on a winter month, and that same low number carries straight through a summer test window that historically runs far above 156. `Mean` at least sits in the middle of the range, but it still can't rise for summer or fall for winter, because a flat line by definition can't do either.

=== step === concept
## Repeating what happened last year: SNAIVE()

`MEAN()` and `NAIVE()` both missed the season entirely. The next benchmark is built to catch it.

`SNAIVE()`, short for seasonal naive, forecasts a month as whatever that same month did one year earlier. Its forecast for July 2025 is just July 2024's actual value, carried forward unchanged. To do that, `SNAIVE()` needs to know the length of one season, which fable reads straight off the tsibble's monthly index as 12, so it always looks back exactly 12 rows.

```r
# Fit the model that repeats each month's value from one year earlier
fit_sn <- model(train, Seasonal_naive = SNAIVE(rentals))
fc_sn <- forecast(fit_sn, h = 12)

print(as.data.frame(fc_sn |> as_tibble() |> transmute(month = as.character(month), forecast = round(.mean, 1))), row.names = FALSE)
#>     month forecast
#>  2025 Jan      125
#>  2025 Feb      142
#>  2025 Mar      159
#>  2025 Apr      192
#>  2025 May      242
#>  2025 Jun      247
#>  2025 Jul      281
#>  2025 Aug      252
#>  2025 Sep      247
#>  2025 Oct      203
#>  2025 Nov      172
#>  2025 Dec      156
```

Every one of those twelve numbers is a 2024 value, copied straight across: 125 in January, climbing to 281 in July, falling back to 156 in December. `Seasonal_naive` never learns a trend and never learns a level. It just assumes this year repeats last year's shape, month for month.

Here's the real 2025 test window, the twelve months `Seasonal_naive` is trying to guess.

::widget chart-plotter {"data":[{"x":1,"y":137},{"x":2,"y":151},{"x":3,"y":178},{"x":4,"y":232},{"x":5,"y":257},{"x":6,"y":286},{"x":7,"y":292},{"x":8,"y":290},{"x":9,"y":253},{"x":10,"y":232},{"x":11,"y":203},{"x":12,"y":163}],"geoms":["point","line","bar"],"x":"month","y":"rentals"}

Compare that shape with the forecast values in the table above. The rise into summer and the fall into winter are both there in the real 2025 data, in the same places `Seasonal_naive` predicted them, because it copied the shape straight from 2024. For a series with a real repeating season, copying last year's shape alone already puts `Seasonal_naive` far ahead of `Mean` and `Naive`.

=== step === concept
## Carrying the trend forward: RW(y ~ drift())

`Seasonal_naive` gets the shape right. But the real 2025 numbers don't just repeat 2024, they run a bit higher too: July 2024 saw 281 rentals, and July 2025 saw 292. Rentals are still climbing year over year, on top of the season. The last benchmark is built to catch that kind of rising or falling level, not a repeating season.

It's called the drift model, written `RW(y ~ drift())` in fable. It works like `NAIVE()`, the last observed value, plus one constant step added at every future month. That step is the average change per month across the whole training window: the last training value minus the first, divided by the number of steps between them.

```r
# Work out the drift step by hand, then fit RW(y ~ drift()) and compare
first_val <- train$rentals[1]
last_val  <- train$rentals[36]
drift_step <- (last_val - first_val) / (36 - 1)
cat("first month:", first_val, " last month:", last_val, " drift step:", round(drift_step, 2), "per month\n")
#> first month: 82  last month: 156  drift step: 2.11 per month

fit_dr <- model(train, Drift = RW(rentals ~ drift()))
fc_dr <- forecast(fit_dr, h = 12)
print(as.data.frame(fc_dr |> as_tibble() |> transmute(month = as.character(month), forecast = round(.mean, 1))), row.names = FALSE)
#>     month forecast
#>  2025 Jan    158.1
#>  2025 Feb    160.2
#>  2025 Mar    162.3
#>  2025 Apr    164.5
#>  2025 May    166.6
#>  2025 Jun    168.7
#>  2025 Jul    170.8
#>  2025 Aug    172.9
#>  2025 Sep    175.0
#>  2025 Oct    177.1
#>  2025 Nov    179.3
#>  2025 Dec    181.4
```

January 2022 opened at 82 rentals and December 2024 closed at 156, a rise of 74 rentals spread over 35 monthly steps, or about 2.11 rentals a month. `RW(rentals ~ drift())`'s forecast is exactly `NAIVE()`'s 156 plus that step, added again and again: 158.1 in January, climbing steadily to 181.4 by December. It's a straight sloped line, the one shape `Mean`, `Naive` and `Seasonal_naive` none of them draw.

```r
# Plot Drift's forecast next to Seasonal_naive's forecast and the real 2025 values
compare_dr <- bind_rows(
  fc_dr |> as_tibble() |> transmute(month, rentals = .mean, series = "Drift forecast"),
  fc_sn |> as_tibble() |> transmute(month, rentals = .mean, series = "Seasonal naive forecast"),
  test  |> as_tibble() |> transmute(month, rentals, series = "Actual 2025")
)

ggplot(compare_dr, aes(month, rentals, colour = series)) +
  geom_line(linewidth = 1) +
  geom_point()
```

`Drift`'s straight line does catch the general climb, but it can't bend up for summer or down for winter the way `Seasonal_naive` does. For a series with real seasonality like this one, carrying the trend forward isn't enough on its own. It's missing the one thing `Seasonal_naive` got right.

=== step === quiz
## Quick check: which benchmark fits which series

Suppose you're handed a new series: it swings up and down in a clear, repeating pattern every year, but shows no real long-term climb or fall. Which benchmark would you reach for first?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- NAIVE(), because it's the simplest rule available. ::no
- MEAN(), because it uses the whole history instead of just one value. ::no
- SNAIVE(), because it repeats last year's shape, and this series' whole story is a shape that repeats. ::ok Right. NAIVE() and MEAN() both draw flat lines, so neither can trace a swing that rises and falls every year. Drift draws a straight sloped line, wrong for a series with no real long-term climb. SNAIVE() is built for exactly this case: a season that repeats, with nothing else going on.
- RW(y ~ drift()), because it accounts for change over time. ::no NAIVE() and MEAN() both draw flat lines, missing the swing entirely. Drift draws a straight sloped line, the wrong shape when there's no real long-term climb or fall, only a repeating season. SNAIVE() is the one built to repeat a shape like that.

=== step === concept
## Scoring every forecast against the real 2025 numbers

So far you've judged each benchmark by eye, comparing shapes on a chart. Now put a real number on each one.

Fit all four benchmarks together, forecast 2025, and score every forecast against the real values in `kayak` using fable's `accuracy()` function.

```r
# Fit and score all four benchmarks against the real 2025 values
fit_all <- model(train,
  Mean = MEAN(rentals),
  Naive = NAIVE(rentals),
  Seasonal_naive = SNAIVE(rentals),
  Drift = RW(rentals ~ drift())
)
fc_all <- forecast(fit_all, h = 12)
acc_all <- accuracy(fc_all, kayak)

print(as.data.frame(acc_all |> as_tibble() |> transmute(model = .model, RMSE = round(RMSE, 1), MAE = round(MAE, 1)) |> arrange(RMSE)), row.names = FALSE)
#>           model RMSE  MAE
#>  Seasonal_naive 24.8 21.3
#>            Mean 67.6 57.6
#>           Drift 74.0 61.2
#>           Naive 85.5 70.8
```

::widget styled-table {"cols":["model","RMSE","MAE"],"rows":[["Seasonal_naive",24.8,21.3],["Mean",67.6,57.6],["Drift",74.0,61.2],["Naive",85.5,70.8]],"formats":{"RMSE":"1dp","MAE":"1dp"},"title":"Forecast accuracy on the withheld 2025 months","note":"RMSE and MAE are both measured in rentals per month, so a smaller number is a smaller average miss."}

RMSE (root mean squared error) and MAE (mean absolute error) both measure how far off a forecast typically was, in rentals per month, so smaller is better for both. `Seasonal_naive` comes out lowest on both, 24.8 and 21.3, matching what you already saw on the chart: it's the only benchmark that traced the real shape. `Naive` comes out worst, 85.5 and 70.8, because that one flat line anchored on a winter trough missed the entire summer. `Mean` and `Drift` land in between, and `Mean` edges out `Drift`, 67.6 against 74.0, because sitting in the middle of the range beats a straight climb that still can't bend for the season.

=== step === concept
## MASE: scoring against the benchmark itself

RMSE and MAE tell you how far off each forecast was, in rentals. But rentals is just this series' own unit. A model scoring RMSE 25 would be excellent for a shop this size and terrible for a shop renting thousands a month. You need a score that means the same thing regardless of scale, and that's what MASE gives you.

MASE stands for mean absolute scaled error. It's a model's mean absolute error on the test window, divided by one specific number: the mean absolute error `NAIVE()` would have made stepping through the training data itself, one month at a time. That denominator is not the same thing as how `NAIVE()` itself scored on the real 2025 test months, RMSE 85.5 and MAE 70.8.

It's a separate number, computed by walking through the 36 training months and asking, for each one, how far off would a naive guess (last month's value) have been. Divide by that, and a MASE under 1 means a model beat what a naive guess would have scored on training data alone. A MASE at or above 1 means it didn't.

```r
# Read the MASE column alongside RMSE and MAE
print(as.data.frame(acc_all |> as_tibble() |> transmute(model = .model, RMSE = round(RMSE, 1), MAE = round(MAE, 1), MASE = round(MASE, 2)) |> arrange(MASE)), row.names = FALSE)
#>           model RMSE  MAE MASE
#>  Seasonal_naive 24.8 21.3 0.87
#>            Mean 67.6 57.6 2.36
#>           Drift 74.0 61.2 2.51
#>           Naive 85.5 70.8 2.90
```

`Seasonal_naive`'s MASE comes out at 0.87, comfortably under 1. `Mean`, `Drift` and `Naive` all land above 1, with `Naive` the worst of the three at 2.90. So `Seasonal_naive` isn't just the best of these four benchmarks on RMSE and MAE, it's the only one that beats a plain naive guess by this scaled measure at all.

=== step === tryit
## Your turn: beat SNAIVE with a fifth model

`Seasonal_naive` repeats last year's shape but never accounts for the fact that rentals are still climbing year over year. fable lets you combine both ideas in one model: add a `drift()` term to `SNAIVE()`'s own formula, the same way `RW(rentals ~ drift())`'s formula adds one to a plain random walk.

Fill in the blank below to add a fifth model, `Seasonal_naive_drift`, to the fitted set, then rerun `accuracy()` to see if it beats `Seasonal_naive`.

```r
# Add a fifth model: seasonal naive plus a drift term, then rescore everyone
fit_all2 <- model(train,
  Mean = MEAN(rentals),
  Naive = NAIVE(rentals),
  Seasonal_naive = SNAIVE(rentals),
  Drift = RW(rentals ~ drift()),
  Seasonal_naive_drift = ____
)

fc_all2 <- forecast(fit_all2, h = 12)
accuracy(fc_all2, kayak)
```
::check {"regex": "SNAIVE\\s*[(]\\s*rentals\\s*~\\s*drift[(][)]\\s*[)][\\s\\S]*accuracy[(]", "gate": true, "difficulty": "intermediate", "ok": "Right: Seasonal_naive_drift scores MASE 0.48, well under plain Seasonal_naive's 0.87. Adding a trend on top of a repeated season helps here, because the real series was both swinging with the year and climbing year over year.", "no": "Write SNAIVE(rentals ~ drift()): the seasonal naive rule, with a drift() term added to its formula, the same way RW(rentals ~ drift()) adds one to a plain random walk."}
::solution
```r
# Seasonal naive plus a drift term, refit and rescored against the other four
fit_all2 <- model(train,
  Mean = MEAN(rentals),
  Naive = NAIVE(rentals),
  Seasonal_naive = SNAIVE(rentals),
  Drift = RW(rentals ~ drift()),
  Seasonal_naive_drift = SNAIVE(rentals ~ drift())
)

fc_all2 <- forecast(fit_all2, h = 12)
acc_all2 <- accuracy(fc_all2, kayak)

print(as.data.frame(acc_all2 |> as_tibble() |> transmute(model = .model, RMSE = round(RMSE, 1), MAE = round(MAE, 1), MASE = round(MASE, 2)) |> arrange(MASE)), row.names = FALSE)
#>                 model RMSE  MAE MASE
#>  Seasonal_naive_drift 12.7 11.6 0.48
#>        Seasonal_naive 24.8 21.3 0.87
#>                  Mean 67.6 57.6 2.36
#>                 Drift 74.0 61.2 2.51
#>                 Naive 85.5 70.8 2.90
```

=== step === quiz
## Quick check: what beating a benchmark really means

Picture a different series, a different fancier model. On its withheld test window, that model scores MASE 1.15, while Seasonal_naive scores 0.82 on the same window. What should you do?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Ship the fancier model anyway, since more complexity usually means a better model. ::no
- Judge it by RMSE alone, and ignore what MASE said. ::no
- Use Seasonal_naive instead, since the fancier model never beat the best benchmark on the withheld test window. ::ok Right. A MASE of 1.15 sits above 1, so on this test window the fancier model did worse than a plain seasonal naive guess would have. However sophisticated it looks, it didn't beat the benchmark, so it doesn't replace it. Ship the benchmark until something actually beats it.
- Refit the fancier model on the test window itself, so its score improves. ::no A MASE over 1 means the fancier model lost to the benchmark on the withheld window, full stop. Fitting on the test window would let it memorise the very months it's supposed to be judged on, which defeats the entire point of holding them back in the first place. The honest move is to use the benchmark until a real model beats it fairly.

=== step === concept
## References

- [Forecasting: Principles and Practice, section 5.2, Some simple forecasting methods](https://otexts.com/fpp3/simple-methods.html) - Hyndman and Athanasopoulos (3rd ed.), the standard reference for MEAN(), NAIVE(), SNAIVE() and the drift method.
- [Forecasting: Principles and Practice, section 5.8, Evaluating point forecast accuracy](https://otexts.com/fpp3/accuracy.html) - Hyndman and Athanasopoulos (3rd ed.), the source for RMSE, MAE and MASE as used in this lesson.
- Hyndman, R.J. and Koehler, A.B. (2006), "Another look at measures of forecast accuracy," International Journal of Forecasting, 22(4), 679-688. The paper that introduced MASE.
- [fable package reference documentation for MEAN(), NAIVE(), SNAIVE() and RW()](https://fable.tidyverts.org/reference/)
- [fabletools package reference documentation for accuracy() and its measures](https://fabletools.tidyverts.org/reference/accuracy.html)

=== step === complete
## What you can do now

You can now fit all four benchmark forecasts on a tsibble and explain what each one draws: `MEAN()` a flat line at the historical average, `NAIVE()` a flat line at the last observed value, `SNAIVE()` last year's shape repeated, and `RW(y ~ drift())` a straight sloped line carrying the average change forward.

You can score any set of fitted models with `accuracy()` against real withheld data, read RMSE and MAE in the series' own units, and read MASE as a scale-free score against a naive guess made inside the training data itself, under 1 to beat it, at or above 1 to lose to it.

And you know the rule that ties it together: added complexity is only worth it once a model beats the best benchmark on data it never saw during fitting. Looking more sophisticated is not the same thing as forecasting better.

From here, every forecasting model built on this series gets judged against this same benchmark score.
