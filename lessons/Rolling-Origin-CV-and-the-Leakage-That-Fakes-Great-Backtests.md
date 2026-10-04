---
title: "The Expert Edge in Forecasting Like a Pro Lesson 1: Rolling-origin backtests without leakage"
catalog_blurb: "Find the four ways a backtest can overstate your forecasting skill."
description: "Build a correct rolling-origin backtest in R, then plant four real leaks and watch reported accuracy improve while real forecasting skill stays the same."
keywords: "rolling origin cross validation, time series backtesting, data leakage, expanding window forecast, forecast evaluation R, backtest RMSE, feature leakage time series, embargo gap forecasting, cross validation time series"
post_type: "LESSON"
curriculum_id: "5.150.1"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "ts-expert"
course_title: "The Expert Edge in Forecasting Like a Pro"
course_lesson: "1"
course_total: "7"
course_landing: "The-Expert-Edge-Forecasting-Like-a-Pro-Course.html"
course_next: "Conformal-Prediction-Intervals-for-Time-Series.html"
course_prev: ""
---

=== step === cover
## Rolling-origin backtests without leakage

Today let's understand how to test a forecasting method properly, and the sneaky ways that test can make it look better than it is without you ever noticing.

Lumen & Co is a small online retailer, and its best-selling product is a desk lamp. Below are its weekly unit sales for the last 104 weeks, two full years.

::widget chart-plotter {"data":[{"x":1,"y":48},{"x":2,"y":45},{"x":3,"y":41},{"x":4,"y":41},{"x":5,"y":53},{"x":6,"y":55},{"x":7,"y":50},{"x":8,"y":46},{"x":9,"y":38},{"x":10,"y":40},{"x":11,"y":36},{"x":12,"y":54},{"x":13,"y":58},{"x":14,"y":55},{"x":15,"y":27},{"x":16,"y":53},{"x":17,"y":48},{"x":18,"y":60},{"x":19,"y":45},{"x":20,"y":42},{"x":21,"y":69},{"x":22,"y":63},{"x":23,"y":70},{"x":24,"y":61},{"x":25,"y":66},{"x":26,"y":52},{"x":27,"y":64},{"x":28,"y":72},{"x":29,"y":51},{"x":30,"y":67},{"x":31,"y":58},{"x":32,"y":67},{"x":33,"y":67},{"x":34,"y":82},{"x":35,"y":69},{"x":36,"y":77},{"x":37,"y":78},{"x":38,"y":72},{"x":39,"y":72},{"x":40,"y":81},{"x":41,"y":72},{"x":42,"y":80},{"x":43,"y":85},{"x":44,"y":98},{"x":45,"y":73},{"x":46,"y":85},{"x":47,"y":87},{"x":48,"y":91},{"x":49,"y":92},{"x":50,"y":103},{"x":51,"y":84},{"x":52,"y":83},{"x":53,"y":85},{"x":54,"y":83},{"x":55,"y":87},{"x":56,"y":82},{"x":57,"y":102},{"x":58,"y":93},{"x":59,"y":104},{"x":60,"y":97},{"x":61,"y":111},{"x":62,"y":106},{"x":63,"y":105},{"x":64,"y":103},{"x":65,"y":115},{"x":66,"y":102},{"x":67,"y":88},{"x":68,"y":111},{"x":69,"y":110},{"x":70,"y":90},{"x":71,"y":117},{"x":72,"y":99},{"x":73,"y":112},{"x":74,"y":111},{"x":75,"y":113},{"x":76,"y":110},{"x":77,"y":125},{"x":78,"y":120},{"x":79,"y":107},{"x":80,"y":117},{"x":81,"y":108},{"x":82,"y":127},{"x":83,"y":127},{"x":84,"y":107},{"x":85,"y":123},{"x":86,"y":131},{"x":87,"y":122},{"x":88,"y":122},{"x":89,"y":123},{"x":90,"y":133},{"x":91,"y":118},{"x":92,"y":124},{"x":93,"y":124},{"x":94,"y":136},{"x":95,"y":136},{"x":96,"y":116},{"x":97,"y":124},{"x":98,"y":125},{"x":99,"y":135},{"x":100,"y":145},{"x":101,"y":155},{"x":102,"y":142},{"x":103,"y":147},{"x":104,"y":141}],"geoms":["line"],"x":"week","y":"units sold","code":{"line":"ggplot(lumen, aes(week, units)) +\n  geom_line()"}}

Sales start around 40 units a week and climb to around 140, with the usual week-to-week bounce along the way. Over the first year that averages out to about 64 units a week. By the second year it has risen to about 115.

Suppose you build a forecasting method for this series, and you want to know how accurate it really is before you trust it with real reorder decisions. That rising line above is the only data this lesson uses. Everything from here on asks one question about it: can you trust a backtest run on it, or can the backtest quietly overstate how good that method really is?

=== step === concept
## Why an ordinary shuffled fold is itself a leak on a time series

If you have tested a model before, you have probably used cross-validation: split the rows into a handful of folds, hold one fold out as a test set, train on the rest, and repeat until every fold has had a turn as the test set. The rows land in their folds at random, so each fold is just some random slice of the whole dataset.

That works fine when the rows do not have an order to them. But Lumen's 104 weeks are not interchangeable rows. Week 30 comes before week 50, and a forecast for week 30 is only honest if it was built without ever touching week 50.

Here is what a random fold does to that order. Suppose you split Lumen's 104 weeks into a random 80% training set and a 20% test set, and week 30 happens to land in the test set, the week you are trying to forecast.

```
week 30            -> test
weeks 31 through 40 -> all land in the training set
```

Ten weeks that come right after week 30 on the calendar, weeks that have not even happened yet relative to week 30, end up training the very model being asked to forecast it. The model gets to peek at the future before it makes its guess, and that is the simplest leak there is.

So the fix is not a better random split. It is to stop assigning weeks to folds at random altogether, and build the split around the calendar instead.

=== step === concept
## Rolling-origin cross-validation: the origin, the window and the horizon

The fix is called rolling-origin cross-validation, and it rests on three ideas.

The **origin** is the last week you are allowed to train on. Everything up to and including the origin is fair game. Everything after it is the future, as far as that forecast is concerned.

The **horizon**, written h, is how many weeks past the origin you forecast. Lumen reorders stock every 4 weeks, so h = 4 throughout this lesson: an origin at week 52 forecasts weeks 53 to 56, nothing further out.

The training window **expands** as you go: it always starts at week 1 and runs to the origin, so it grows longer every time you move the origin forward. And **rolling** just means repeating this at several origins instead of one, moving the origin forward each time and scoring a fresh forecast.

Here is what that looks like at three of Lumen's origins.

| Origin (last training week) | Training weeks | Forecast weeks (h = 4) |
|---|---|---|
| 52 | 1 to 52 | 53 to 56 |
| 76 | 1 to 76 | 77 to 80 |
| 100 | 1 to 100 | 101 to 104 |

Notice what never happens in this table. No training window ever reaches past its own origin. That single rule is what a shuffled fold breaks and rolling-origin cross-validation protects.

=== step === concept
## Building a correct rolling-origin backtest in R

Let's build this for real on Lumen's data and see how accurate the method actually is.

The model is simple on purpose: forecast sales from the week number (to catch the rising trend) and a trailing 4-week average (to catch the recent level). The trailing average at week i is just the mean of the 4 weeks strictly before it, weeks i-4 to i-1, so it never needs a week that has not happened yet.

Lumen rolls the origin forward every 4 weeks, from week 52 to week 100, which gives 13 origins in total. At each one, the model trains only on weeks up to that origin, then forecasts the next 4 weeks one at a time, feeding each week's own forecast forward to build the trailing average for the week after it. That last part matters: using the model's own forecast instead of peeking at the real future value for weeks 2, 3 and 4 of the horizon is itself part of keeping this backtest honest, which is why it gets its own line in the code below.

```r
# Build Lumen's 104 weeks of sales and run an honest rolling-origin backtest
set.seed(2024)
sales <- round(seq(40, 140, length.out = 104) + rnorm(104, 0, 8))
sales <- pmax(sales, 1)
week_index <- 1:104

trail_avg <- rep(NA, 104)
for (i in 5:104) trail_avg[i] <- mean(sales[(i - 4):(i - 1)])

origins <- seq(52, 100, by = 4)
h <- 4
rmse_by_origin <- numeric(length(origins))
all_errors <- c()

for (k in seq_along(origins)) {
  o <- origins[k]
  train_df <- data.frame(sales = sales[1:o], week = week_index[1:o], trail = trail_avg[1:o])
  fit <- lm(sales ~ week + trail, data = train_df)

  known <- sales[1:o]
  forecasts <- numeric(h)
  for (step in 1:h) {
    trail_now <- mean(tail(known, 4))
    forecasts[step] <- predict(fit, newdata = data.frame(week = o + step, trail = trail_now))
    known <- c(known, forecasts[step])   # feed the forecast forward, never the real future value
  }

  actual <- sales[(o + 1):(o + h)]
  rmse_by_origin[k] <- sqrt(mean((actual - forecasts)^2))
  all_errors <- c(all_errors, actual - forecasts)
}

round(rmse_by_origin, 2)
#>  [1]  9.48  6.38  7.63 10.86 11.76  2.02  7.42 10.39  4.38  6.81  9.55  7.91
#> [13] 10.15

round(sqrt(mean(all_errors^2)), 2)
#> [1] 8.48
```

`rmse_by_origin` is one accuracy number per origin, and it swings from 2.02 up to 11.76 depending on which 4 weeks got forecast. Some 4-week stretches are just easier to call than others.

The last line pools every one of the 52 forecast errors, 13 origins times 4 weeks each, into a single number: RMSE, root mean squared error. It squares each error so a big miss counts more than a small one, averages the squares, then takes a square root to bring the units back to sales, not squared sales. That gives 8.48. This is the honest number: the real accuracy of this method, measured the way it would actually be used. Every leak in this lesson is a different way of making that 8.48 look better than it is, without the model's real forecasts changing at all.

=== step === widget
## Watching the origin roll forward

The widget below does not use Lumen's sales. It ships with its own small built-in dataset and steps through 5 ordinary folds. Use it just for the stepping motion, not the random split underneath it: each time you click to the next fold, picture Lumen's origin jumping forward by 4 weeks instead, from week 52 on the first step to week 100 on the fifth, with the training window growing a little longer every time.

::widget cv-folds {"k":5}

That growing-window feeling, a little more training data at every step while the forecast window keeps moving forward in time, is exactly what the loop you just ran in R was doing 13 times over.

=== step === quiz
## Quick check: origins, horizons and the honest RMSE

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The origin is the last week whose outcome the model has already seen scored against it, and it resets to week 1 every time you add a new origin. ::no That mixes up the origin with something that gets evaluated. The origin never resets. It is simply the last week allowed into training, and each new origin just moves that cutoff further along the calendar.
- The origin is the last week included in training, and 8.48 is the honest average error across the 13 forecast windows that followed it. ::ok Exactly. Every origin trains on weeks 1 through itself and nothing past that, and 8.48 pools the errors from all 52 of the resulting forecasts into one RMSE.
- The origin is the first week of the 4-week forecast window, so Lumen's 13 origins are weeks 53, 57, 61, and so on. ::no Close, but it names the wrong week. The origin is the last TRAINING week, week 52, 56, 60 and so on. The forecast window starts one week after the origin, not at it.
- A shuffled random split would give just as valid an RMSE as the rolling-origin backtest, since both eventually train on every week. ::no They do not end up equivalent. A shuffled split lets later weeks train the model used to forecast earlier ones, the same leak a random fold causes on Lumen's data. Using every week eventually does not undo training on the future first.

=== step === concept
## What counts as leakage in a backtest

Leakage is any information reaching the model, directly or indirectly, that would not actually be available at the moment it has to produce that forecast. The shuffled fold from earlier was one form of it. But leakage keeps finding new ways into a backtest that looks, on the surface, like it respects the origin perfectly.

Four forms show up constantly in practice, and each one changes the reported accuracy number without changing what the model would actually do in production:

- A scaler, benchmark, or average computed from the whole series, instead of only the data available at each origin.
- A feature whose value could only have been computed using a week not yet reached.
- A model, or a setting of a model, chosen by looking at the very data the final score gets reported on.
- A missing gap between where training stops and the window actually being scored, when the real decision needs a longer lead time than that.

Each of these gets planted, one at a time, straight into the backtest you just ran, to show exactly what it does to the 8.48.

=== step === concept
## Leak one: a scaler fitted on the whole series

Lumen's weekly sales keep climbing, so the training mean at each origin grows with it. Early on, the training weeks average around 64 units. By the last origin, that average has climbed to 87.4.

A common way to report backtest accuracy is as a relative error: the forecast error divided by some average sales level, so it reads as a percentage instead of a raw unit count. The honest version divides each origin's error by that origin's OWN training mean, the only number known at that point in time. The leaky version divides by the mean of the WHOLE series instead, 89.6 units, a number that only exists once every week, including ones still in the future at most origins, has already been observed.

```r
# Compare an honest relative error against one using a future-informed average
mae_by_origin <- numeric(length(origins))
train_mean_by_origin <- numeric(length(origins))

for (k in seq_along(origins)) {
  o <- origins[k]
  train_df <- data.frame(sales = sales[1:o], week = week_index[1:o], trail = trail_avg[1:o])
  fit <- lm(sales ~ week + trail, data = train_df)

  known <- sales[1:o]
  forecasts <- numeric(h)
  for (step in 1:h) {
    trail_now <- mean(tail(known, 4))
    forecasts[step] <- predict(fit, newdata = data.frame(week = o + step, trail = trail_now))
    known <- c(known, forecasts[step])
  }

  actual <- sales[(o + 1):(o + h)]
  mae_by_origin[k] <- mean(abs(actual - forecasts))
  train_mean_by_origin[k] <- mean(sales[1:o])
}

whole_series_mean <- mean(sales)
honest_relative_error <- mae_by_origin / train_mean_by_origin
leaky_relative_error <- mae_by_origin / whole_series_mean

round(mean(honest_relative_error) * 100, 1)
#> [1] 9.2
round(mean(leaky_relative_error) * 100, 1)
#> [1] 7.7
```

The forecasts never changed between these two numbers. Not one. The only thing that moved was the number sitting in the denominator, and that alone was enough to turn a 9.2% average error into a 7.7% one. A future-informed denominator always divides by a bigger number later in the series than it should, which is exactly why the leaky version comes out lower.

=== step === concept
## Leak two: a feature built from the future

The model you have been backtesting uses a trailing 4-week average: at week i, the mean of weeks i-4 to i-1, always strictly in the past. Suppose someone swaps that for a centred average instead: weeks i-2 to i+1, two behind and one ahead. It looks almost the same on paper, just a different window. But that window now reaches one and two weeks past week i itself.

```r
# Compare the honest trailing average against a centred average that peeks ahead
centred_avg <- rep(NA, 104)
for (i in 3:103) centred_avg[i] <- mean(sales[(i - 2):(i + 1)])

origins_9 <- origins[(origins + h) <= 103]   # drop the origin whose horizon reaches week 104

honest_errors <- c()
leak_errors <- c()

for (o in origins_9) {
  train_df <- data.frame(sales = sales[1:o], week = week_index[1:o], trail = trail_avg[1:o])
  fit_honest <- lm(sales ~ week + trail, data = train_df)
  known <- sales[1:o]
  forecasts_honest <- numeric(h)
  for (step in 1:h) {
    trail_now <- mean(tail(known, 4))
    forecasts_honest[step] <- predict(fit_honest, newdata = data.frame(week = o + step, trail = trail_now))
    known <- c(known, forecasts_honest[step])
  }
  actual <- sales[(o + 1):(o + h)]
  honest_errors <- c(honest_errors, actual - forecasts_honest)

  train_df_leak <- data.frame(sales = sales[1:o], week = week_index[1:o], trail = centred_avg[1:o])
  fit_leak <- lm(sales ~ week + trail, data = train_df_leak)
  test_df_leak <- data.frame(week = week_index[(o + 1):(o + h)], trail = centred_avg[(o + 1):(o + h)])
  forecasts_leak <- predict(fit_leak, newdata = test_df_leak)
  leak_errors <- c(leak_errors, actual - forecasts_leak)
}

round(sqrt(mean(honest_errors^2)), 2)
#> [1] 8.32
round(sqrt(mean(leak_errors^2)), 2)
#> [1] 7.15
```

The one origin whose horizon reaches week 104 gets dropped here, since its centred feature would need a week past the end of the data entirely. Over the remaining 12 origins, RMSE drops from an honest 8.32 to 7.15.

That drop is not noise. A centred average sits right on top of the week it is estimating, so it tracks Lumen's rising trend far more closely than an average that only ever looks backward and is always a little behind it. The backtest rewards the centred version for information it would never actually have at forecast time: the two weeks just after the one it is trying to call. In production, at the real origin, weeks i+1 and beyond have not happened yet, so this feature could never be built the way the backtest built it. This is the most common leak in practice, precisely because the buggy line looks so close to the honest one.

[KEY INSIGHT]
A trailing average and a centred average are the same idea with one word changed, "behind" instead of "around". Whenever a feature's definition includes a week on both sides of the one being forecast, check whether that week could possibly be known yet. Usually it cannot.

=== step === concept
## Leak three: a model selected on the test window

Here is a different kind of leak, one that does not touch any feature's definition at all. Add 15 columns of plain random noise, numbers with no connection whatsoever to Lumen's sales, one at a time to the honest model, and keep whichever one scores best.

```r
# Try 15 unrelated random columns and see one beat the plain model by chance
noise_feats <- sapply(1001:1015, function(seed) {
  set.seed(seed)
  rnorm(104)
})

run_backtest <- function(origin_set, noise_col = NULL) {
  errors <- c()
  for (o in origin_set) {
    if (is.null(noise_col)) {
      train_df <- data.frame(sales = sales[1:o], week = week_index[1:o], trail = trail_avg[1:o])
      fit <- lm(sales ~ week + trail, data = train_df)
    } else {
      train_df <- data.frame(sales = sales[1:o], week = week_index[1:o], trail = trail_avg[1:o], noise = noise_col[1:o])
      fit <- lm(sales ~ week + trail + noise, data = train_df)
    }
    known <- sales[1:o]
    forecasts <- numeric(h)
    for (step in 1:h) {
      trail_now <- mean(tail(known, 4))
      nd <- data.frame(week = o + step, trail = trail_now)
      if (!is.null(noise_col)) nd$noise <- noise_col[o + step]
      forecasts[step] <- predict(fit, newdata = nd)
      known <- c(known, forecasts[step])
    }
    actual <- sales[(o + 1):(o + h)]
    errors <- c(errors, actual - forecasts)
  }
  sqrt(mean(errors^2))
}

plain_rmse <- run_backtest(origins)
search_rmse <- sapply(1:15, function(j) run_backtest(origins, noise_feats[, j]))
round(plain_rmse, 2)
#> [1] 8.48
round(search_rmse, 2)
#>  [1] 8.61 8.30 8.53 8.66 8.63 9.03 8.57 8.56 8.37 8.47 8.51 8.89 8.56 8.47 8.67
round(min(search_rmse), 2)
#> [1] 8.3
```

Column 2 happens to score 8.30, a touch better than the plain model's 8.48. There is nothing in that column but random numbers. It won purely because 15 candidates were tried and the lowest score was kept, on the very same 13 origins the final number gets reported on. Try enough unrelated candidates against noisy data and one of them will look good by accident.

Here is the honest version of the same search. Pick the winning column using only the first 6 origins, then report that column's score on the remaining 7 origins, the ones that never had any say in which column got chosen.

```r
# Now choose the column honestly: pick on the first 6 origins, report on the rest
pick_origins <- origins[1:6]
report_origins <- origins[7:13]

pick_rmse <- sapply(1:15, function(j) run_backtest(pick_origins, noise_feats[, j]))
best_col <- which.min(pick_rmse)
best_col
#> [1] 2

round(run_backtest(report_origins, noise_feats[, best_col]), 2)
#> [1] 8.32
round(run_backtest(report_origins), 2)
#> [1] 8.32
```

Column 2 wins again on just the first 6 origins, so it gets carried forward and scored on the last 7. Its score there is 8.32. Now compare that to the plain model, with no noise column at all, scored on that exact same set of 7 origins: also 8.32. Once the column is validated on data it never influenced, it adds nothing. The apparent improvement from 8.48 down to 8.30 only ever existed because the same 13 origins did double duty as both the search ground and the scoreboard.

=== step === concept
## Leak four: the gap that should be there and is not

One more leak, and this one lives in the gap between training and the window being scored, not in any single feature.

Lumen's real decision every 4 weeks is not "what will next week look like." It is "how many lamps should I reorder for the coming month," a single number: the total sales over the next 4 weeks. Call that the reorder target. At week t, it is the sum of sales over weeks t+1 to t+4.

Here is the trap. If you train a model up to origin o and ask it to predict the reorder target AT week o, that target already needs to know sales from weeks o+1 through o+4, the exact weeks still in the future relative to the origin. Training data built this way has quietly absorbed sales figures from past the origin, through the targets of the training rows themselves, not through any feature. The fix is a gap: stop training h weeks earlier than the origin, so even the last training row's own target never reaches past what is actually known.

```r
# Compare training with a gap before the scored window against training without one
target4wk <- rep(NA, 104)
for (t in 1:100) target4wk[t] <- sum(sales[(t + 1):(t + 4)])

origins_11 <- origins[origins <= 96]   # keep every target inside the 104-week series

nogap_errors <- c()
gap_errors <- c()

for (o in origins_11) {
  train_nogap <- data.frame(target = target4wk[1:o], week = week_index[1:o], trail = trail_avg[1:o])
  fit_nogap <- lm(target ~ week + trail, data = train_nogap)
  test_df <- data.frame(week = week_index[o], trail = trail_avg[o])
  pred_nogap <- predict(fit_nogap, newdata = test_df)
  nogap_errors <- c(nogap_errors, target4wk[o] - pred_nogap)

  cutoff <- o - h
  train_gap <- data.frame(target = target4wk[1:cutoff], week = week_index[1:cutoff], trail = trail_avg[1:cutoff])
  fit_gap <- lm(target ~ week + trail, data = train_gap)
  pred_gap <- predict(fit_gap, newdata = test_df)
  gap_errors <- c(gap_errors, target4wk[o] - pred_gap)
}

round(sqrt(mean(nogap_errors^2)), 2)
#> [1] 15.37
round(sqrt(mean(gap_errors^2)), 2)
#> [1] 19.73
```

Training right up to the origin with no gap reports an RMSE of 15.37 on the reorder quantity. Leaving a proper 4-week gap, so training stops at o - 4 instead of o, raises that to 19.73. The no-gap version looks like the better model, but it only ever got there by letting its training targets quietly absorb sales figures from the very weeks it is about to be judged on.

=== step === concept
## Guarding a backtest against leakage

Four leaks, four questions worth asking before trusting any backtest number.

1. Was every scaler, benchmark, or average computed using only the data available up to each origin, never the whole series?
2. Could any feature's value have needed a week that had not been reached yet, the way a centred average does?
3. Was the model, or any setting of it, chosen by looking at the same window the final score gets reported on?
4. Does the gap between where training stops and the window being scored match the real horizon, the way the reorder target needed?

Here is every leak from this lesson side by side with its honest counterpart.

::widget chart-plotter {"data":[{"x":"Future-informed scaler (%)","y":9.2,"fill":"Honest"},{"x":"Future-informed scaler (%)","y":7.7,"fill":"Leaky"},{"x":"Feature from the future","y":8.32,"fill":"Honest"},{"x":"Feature from the future","y":7.15,"fill":"Leaky"},{"x":"Model picked on test data","y":8.48,"fill":"Honest"},{"x":"Model picked on test data","y":8.3,"fill":"Leaky"},{"x":"Missing gap","y":19.73,"fill":"Honest"},{"x":"Missing gap","y":15.37,"fill":"Leaky"}],"geoms":["bar"],"x":"leak","y":"value","code":{"bar":"ggplot(recap, aes(leak, value, fill = kind)) +\n  geom_col(position = \"dodge\")"}}

Read the first pair as a percentage and the other three as RMSE, since they are not on the same scale. What they share is the shape: the leaky bar is always the shorter, better-looking one, and the honest bar next to it is the number Lumen could actually count on.

=== step === quiz
## Quick check: matching four backtests to their leak

::quiz {"correct": 3, "gate": true, "difficulty": "advanced"}
- A team scales every origin's error by the mean sales across the full two years, instead of that origin's own training mean. ::no That is leak one, the future-informed scaler. Read the four descriptions again and look for the one where a FEATURE, not a denominator, is built from weeks on both sides of the one it is forecasting.
- A team searches 20 candidate models, keeps whichever scores lowest averaged over all 13 origins, then reports that same score as the model's accuracy. ::no That is leak three, a model picked on the window it gets scored on. The one you want instead has a feature definition that reaches past the week it is forecasting.
- A team forecasts each week's sales using a 5-week average centred on that week, two weeks behind and two weeks ahead. ::ok Right. A centred average needs weeks on both sides of the one being forecast, including weeks that have not happened yet at the real origin. That is leak two, a feature built from the future.
- A team trains on sales up to the origin and scores a 4-week-ahead reorder target with no gap before the scored weeks. ::no That is leak four, the missing gap. The one you are looking for swaps a feature's own definition for one that reaches into the future, not the training cutoff.

=== step === tryit
## Your turn: fix the leak in this backtest

Below is a rolling-origin loop that looks almost right. It is supposed to train only on weeks up to each origin, but one line undoes that completely: `train_rows` is fixed at `1:104`, every single time through the loop, so every origin trains on the entire series, including weeks it is about to be scored on.

```r
# This loop is supposed to train only on weeks up to the origin. Find the bug.
leak_errors <- c()

for (o in origins) {
  train_rows <- 1:104   # <- fix this so training never reaches past the origin
  train_df <- data.frame(sales = sales[train_rows], week = week_index[train_rows], trail = trail_avg[train_rows])
  fit <- lm(sales ~ week + trail, data = train_df)

  test_df <- data.frame(week = week_index[(o + 1):(o + h)], trail = trail_avg[(o + 1):(o + h)])
  forecasts <- predict(fit, newdata = test_df)

  actual <- sales[(o + 1):(o + h)]
  leak_errors <- c(leak_errors, actual - forecasts)
}

round(sqrt(mean(leak_errors^2)), 2)
```

Edit the `train_rows` line so training only ever reaches the origin, then press Check.

::check {"regex": "train_rows\\s*<-\\s*1\\s*:\\s*o\\b", "gate": true, "difficulty": "intermediate", "ok": "That's it. With train_rows set to 1:o, every origin only ever trains on weeks up to itself, and the RMSE moves from the leaky 8.13 back up to 8.52, the honest number for a model that never got to see ahead.", "no": "The bug is the line train_rows <- 1:104. It should depend on o, the current origin, not be fixed at the full series. Change it to train_rows <- 1:o."}
::solution
```r
# Fixed: train_rows now depends on the origin, so training never reaches past it
leak_errors <- c()

for (o in origins) {
  train_rows <- 1:o
  train_df <- data.frame(sales = sales[train_rows], week = week_index[train_rows], trail = trail_avg[train_rows])
  fit <- lm(sales ~ week + trail, data = train_df)

  test_df <- data.frame(week = week_index[(o + 1):(o + h)], trail = trail_avg[(o + 1):(o + h)])
  forecasts <- predict(fit, newdata = test_df)

  actual <- sales[(o + 1):(o + h)]
  leak_errors <- c(leak_errors, actual - forecasts)
}

round(sqrt(mean(leak_errors^2)), 2)
#> [1] 8.52
```

Training on the whole series every time let the model fit a trend line through the very weeks it was about to be judged on, which is why the leaky version reported 8.13, a better-looking number than the honest 8.48 from several steps back. Restricting `train_rows` to `1:o` costs a little accuracy on paper. It is the only version that tells the truth about what this method would do with real, not-yet-happened weeks.

=== step === concept
## References

- [Time series cross-validation](https://otexts.com/fpp3/tscv.html) - Hyndman, R.J. & Athanasopoulos, G., *Forecasting: Principles and Practice* (3rd ed.), section 5.10.
- [On the use of cross-validation for time series predictor evaluation](https://doi.org/10.1016/j.ins.2011.12.028) - Bergmeir, C. & Benitez, J.M. (2012), *Information Sciences* 191, 192-213.
- [Advances in Financial Machine Learning](https://www.wiley.com/en-us/Advances+in+Financial+Machine+Learning-p-9781119482086) - Lopez de Prado, M. (2018), the chapter on cross-validation and the purge/embargo gap.
- [Leakage in data mining: formulation, detection, and avoidance](https://doi.org/10.1145/2339530.2339556) - Kaufman, S., Rosset, S. & Perlich, C. (2012), KDD 2012.
- [stretch_tsibble()](https://rdrr.io/cran/tsibble/man/stretch_tsibble.html) - the tsibble package's expanding-window tool for building rolling-origin splits.

=== step === complete
## What you can do now

You built a rolling-origin backtest from scratch: an origin that only ever trains on the past, a horizon that matches the real decision, a window that expands as the origin rolls forward, and one honest RMSE, 8.48, that every leak in this lesson tried to improve on without improving anything real.

Then you planted four leaks, one at a time, into that same backtest, and watched each one move a reported number while Lumen's actual forecasts never changed at all: a scaler that divides by a future mean, a feature that reaches past the week it forecasts, a model chosen on the same data it gets scored on, and a missing gap before a target that needed one.

Next time a backtest looks unusually good, you now know exactly which four questions to ask it before you believe it.
