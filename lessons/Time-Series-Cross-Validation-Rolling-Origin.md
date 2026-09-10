---
title: "Forecasting Toolbox Lesson 5: Time-series cross-validation with rolling origins"
catalog_blurb: "See why scoring a forecasting method on many rolling origins beats trusting one split."
description: "See why a single train/test split gives one lucky score, and how rolling-origin cross-validation scores a forecasting method fairly across many origins instead."
keywords: "time series cross validation in r, rolling origin cross validation, stretch_tsibble, tsibble stretch_tsibble function, fable accuracy by origin, time series train test split, cross validation for time series forecasting, comparing forecasting models fairly"
post_type: "LESSON"
curriculum_id: "5.30.5"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "ts-toolbox"
course_title: "Forecasting Toolbox"
course_lesson: "5"
course_total: "6"
course_landing: "Forecasting-Toolbox-Course.html"
course_next: "Accuracy-Metrics-MASE-RMSSE-and-Pinball-Loss.html"
course_prev: "Point-Forecasts-vs-the-Whole-Distribution.html"
---

=== step === cover
## Time-series cross-validation with rolling origins

Today let's look at how to judge a forecasting method fairly, using 5 years of monthly orders from a small online bookstore.

Nordic Books ships about 200 orders a month, and that number climbs every October through December as shoppers buy gift copies for the holidays. Below is all 5 years of it, January 2021 through December 2025, 60 months in total.

::widget chart-plotter {"data":[{"x":1,"y":191,"fill":"train"},{"x":2,"y":177,"fill":"train"},{"x":3,"y":186,"fill":"train"},{"x":4,"y":189,"fill":"train"},{"x":5,"y":189,"fill":"train"},{"x":6,"y":186,"fill":"train"},{"x":7,"y":200,"fill":"train"},{"x":8,"y":189,"fill":"train"},{"x":9,"y":207,"fill":"train"},{"x":10,"y":202,"fill":"train"},{"x":11,"y":239,"fill":"train"},{"x":12,"y":268,"fill":"train"},{"x":13,"y":185,"fill":"train"},{"x":14,"y":195,"fill":"train"},{"x":15,"y":198,"fill":"train"},{"x":16,"y":205,"fill":"train"},{"x":17,"y":199,"fill":"train"},{"x":18,"y":182,"fill":"train"},{"x":19,"y":185,"fill":"train"},{"x":20,"y":216,"fill":"train"},{"x":21,"y":205,"fill":"train"},{"x":22,"y":204,"fill":"train"},{"x":23,"y":243,"fill":"train"},{"x":24,"y":276,"fill":"train"},{"x":25,"y":228,"fill":"train"},{"x":26,"y":210,"fill":"train"},{"x":27,"y":213,"fill":"train"},{"x":28,"y":203,"fill":"train"},{"x":29,"y":222,"fill":"train"},{"x":30,"y":214,"fill":"train"},{"x":31,"y":224,"fill":"train"},{"x":32,"y":228,"fill":"train"},{"x":33,"y":232,"fill":"train"},{"x":34,"y":230,"fill":"train"},{"x":35,"y":265,"fill":"train"},{"x":36,"y":269,"fill":"train"},{"x":37,"y":223,"fill":"train"},{"x":38,"y":223,"fill":"train"},{"x":39,"y":212,"fill":"train"},{"x":40,"y":233,"fill":"train"},{"x":41,"y":236,"fill":"train"},{"x":42,"y":233,"fill":"train"},{"x":43,"y":243,"fill":"train"},{"x":44,"y":232,"fill":"train"},{"x":45,"y":229,"fill":"train"},{"x":46,"y":254,"fill":"train"},{"x":47,"y":271,"fill":"train"},{"x":48,"y":310,"fill":"train"},{"x":49,"y":242,"fill":"test"},{"x":50,"y":252,"fill":"test"},{"x":51,"y":250,"fill":"test"},{"x":52,"y":243,"fill":"test"},{"x":53,"y":263,"fill":"test"},{"x":54,"y":257,"fill":"test"},{"x":55,"y":254,"fill":"test"},{"x":56,"y":257,"fill":"test"},{"x":57,"y":261,"fill":"test"},{"x":58,"y":268,"fill":"test"},{"x":59,"y":270,"fill":"test"},{"x":60,"y":317,"fill":"test"}],"geoms":["point","line"],"x":"Month","y":"Orders","code":{"point":"ggplot(df, aes(Month, Orders, colour = group)) +\n  geom_point(size = 2.4)"}}

The first 48 months sit in one color, and the last 12 sit in a second color. That block of 12 held-out months is the one most people reach for first: fit a model on everything before it, then check how close the model's guesses land against those real 12 months.

=== step === concept
## One split, one score

Let's do exactly that: fit a model on the first 48 months and score it against the last 12.

The model here is SNAIVE, short for seasonal naive. It forecasts each month by repeating whatever Nordic Books sold in that same month one year earlier. December gets last December's number, January gets last January's, and so on. It is the standard first model to try on a series with a clear yearly pattern like this one.

Press Run.

```r
# Build five years of Nordic Books' orders, then score one train/test split
library(tsibble)
library(fable)
library(fabletools)
library(dplyr)

set.seed(42)
n <- 60
trend <- seq(180, 260, length.out = n)
month_num <- rep(1:12, length.out = n)
bump <- ifelse(month_num == 10, 10, ifelse(month_num == 11, 35, ifelse(month_num == 12, 55, 0)))
orders <- round(trend + bump + rnorm(n, 0, 8))

nb <- tsibble(
  month  = yearmonth("2021 Jan") + 0:(n - 1),
  orders = orders,
  index  = month
)

train1 <- nb %>% filter(month <= yearmonth("2024 Dec"))
fc1    <- train1 %>% model(snaive = SNAIVE(orders)) %>% forecast(h = 12)

accuracy(fc1, nb) %>% select(RMSE, MAE, MAPE)
#> # A tibble: 1 × 3
#>    RMSE   MAE  MAPE
#>   <dbl> <dbl> <dbl>
#> 1  22.5  19.8  7.70
```

`train1` keeps only the first 48 months. `SNAIVE(orders)` fits on that alone, and `forecast(h = 12)` produces one guess for each of the 12 held-out months. `accuracy()` then compares those 12 guesses against the 12 real values and boils the whole comparison down to a handful of numbers.

RMSE (root mean squared error) came out at 22.5, and MAE (mean absolute error) at 19.8. Both are in orders, the same unit as the data itself, so on average SNAIVE's monthly guess missed by somewhere around 20 orders. MAPE puts that same miss on a percentage scale: 7.70%.

That is one number for one particular way of drawing the line between train and test. Change where that line falls by even a month or two, and SNAIVE would land on a different set of 12 test months, each with its own mix of easy and hard ones to predict, and the RMSE would move too.

=== step === widget
## Data leakage in a time-ordered split

Splitting by date, like the split above, already avoids the most obvious mistake: it never tests on a month the model could see during training. But an honestly time-ordered split can still be fooled from a different direction.

Below is a generic 20-block stand-in for any dataset, not Nordic Books itself. Think of each block as a few months, so the same trap can hide inside Nordic Books' real 60 months just as easily.

::widget data-split {}

Flip the switch above. With the honest split, test accuracy reads 0.78. Flip on the leaked feature and it jumps to 0.99, which looks like a huge improvement but is not one. The leaked column was built using information from across the whole dataset, test months included, so at test time the model is effectively copying an answer it was never supposed to see. That is data leakage: any information available at training time that would not actually be available at the moment you need the forecast. The fix is to build every feature using only the training rows, never the full series.

=== step === widget
## Folds and the cross-validated score

A single split, honest or not, only ever tests one slice of the data. Cross-validation fixes that for ordinary, independent rows by cutting the data into several folds, and letting every fold take a turn as the test set while the rest train.

Below is another generic stand-in, this time 20 rows standing in for 20 hypothetical months, not Nordic Books' real history.

::widget cv-folds {"k":5}

Step through the folds. Each one holds out one fifth of the rows for validation and trains on the other four fifths, giving its own score. With k = 5, that produces 5 scores, and the CV mean at the end pools them into one number. Switch to k = 10 and each fold shrinks to one tenth of the data, so training uses more of it per fold, at the cost of running the fit 10 times instead of 5.

Averaging several honest scores like this settles out the luck that any one split carries. But look closely at how each fold gets built: a row lands in whichever fold it happens to land in, with no regard for order. For 20 independent rows, that is completely fair. For 20 months sitting one after another, that fairness breaks down.

=== step === quiz
## Quick check: one split vs many folds

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- A single honest train/test split already gives the truest picture of accuracy, so averaging folds adds nothing. ::no
- A single split's score depends on which slice of months it happened to land on, and even an honestly time-ordered split can be inflated by a leaked feature. Averaging several folds trades that for a steadier estimate. ::ok Exactly. The leak-demo widget moved accuracy from an honest 0.78 to a leaked 0.99 with the split itself unchanged, and the fold widget showed how averaging several honest scores settles the luck out of any one of them.
- Cross-validation removes the need to check for leakage, because every row gets validated exactly once. ::no
- More folds always beats fewer folds, no matter how the features were built. ::no

=== step === concept
## Why ordinary folds don't work on a time series
::prose-only the reasoning bridge from the fold widget already shown to the rolling origins built next; no new structure to draw yet

Look again at what the 5-fold widget actually did. Fold 1 validated on the first fifth of the rows while folds 2 through 5 trained on the rest, which can include rows sitting anywhere: before fold 1, after it, mixed in around it. That is fine when the rows are independent of each other, a customer here, a transaction there, each one unrelated to its neighbours.

Nordic Books' 60 months are not independent like that. Each month sits at a fixed point in time, and a forecast is only realistic if it is built using data from before the point it is predicting. If one fold covered January to December 2021 and trained on data running all the way through 2025, the model would be learning from years that, at the actual moment you needed a January 2021 forecast, had not happened yet. That is training on the future, and no real forecast ever gets that privilege.

So cross-validation needs a version built for data with a fixed order. Instead of cutting the series into folds that rotate freely, you pick a cutoff point, called the origin: everything up to the origin trains, and a short stretch right after it tests. Then you slide the origin forward and repeat. The training window only ever grows forward in time; it never reaches into data that has not happened yet. That is rolling-origin cross-validation: instead of one score from one split, you get many scores, one from every origin, each built honestly from only the data that came before it.

=== step === concept
## Building the origins with stretch_tsibble()

`stretch_tsibble()` builds exactly that: a training window that starts small and grows forward, one step at a time, never reaching past the point it will be judged from. Two arguments control it. `.init` sets how many months the very first window holds, and `.step` sets how many months to grow it by each time.

Nordic Books has 60 months of history. Start the first window at 36 months, 3 full years, enough for SNAIVE to have seen every month of the year at least 3 times. Grow it by 3 months at a time, which also happens to match the 3-month horizon Nordic Books wants to forecast.

```r
# Grow the training window forward and keep only origins with a full 3-month horizon left
origins <- nb %>%
  stretch_tsibble(.init = 36, .step = 3) %>%
  filter(.id <= 8)

origins %>% as_tibble() %>% count(.id)
#> # A tibble: 8 × 2
#>     .id     n
#>   <int> <int>
#> 1     1    36
#> 2     2    39
#> 3     3    42
#> 4     4    45
#> 5     5    48
#> 6     6    51
#> 7     7    54
#> 8     8    57
```

`.id` labels each window, and `n` is how many months it holds. `.id` 1 has the first 36 months, `.id` 2 has 39, and so on up to `.id` 8's 57 months. `stretch_tsibble()` on its own would have produced a ninth window too, holding all 60 months, but that window has no data left after it to forecast against: there is no month 61, 62 or 63 to check a 3-month forecast against. `filter(.id <= 8)` drops that one incomplete window, leaving 8 usable origins.

Each `.id` is an origin: a point in time where the training window ends and a forecast begins. `.id` 1's origin sits at the end of month 36, December 2023. `.id` 8's origin sits at the end of month 57, September 2025. Between them, the origin has slid forward across nearly two years of Nordic Books' history, three months at a time.

=== step === concept
## Forecasting h steps from every origin

Every one of those 8 origins can now train its own SNAIVE and forecast the 3 months right after it, the way `.id` 1 forecasts January through March 2024 and `.id` 8 forecasts October through December 2025.

```r
# Fit SNAIVE separately inside every origin and forecast 3 months ahead
fc_cv <- origins %>%
  model(snaive = SNAIVE(orders)) %>%
  forecast(h = 3)

fc_cv %>% as_tibble() %>% select(.id, month, .mean) %>% head(6)
#> # A tibble: 6 × 3
#>     .id    month .mean
#>   <int>    <mth> <dbl>
#> 1     1 2024 Jan   228
#> 2     1 2024 Feb   210
#> 3     1 2024 Mar   213
#> 4     2 2024 Apr   203
#> 5     2 2024 May   222
#> 6     2 2024 Jun   214
```

`model(snaive = SNAIVE(orders))` fits SNAIVE separately inside each `.id` group, so `.id` 1's model only ever sees `.id` 1's 36 months, and `.id` 2's model only ever sees its own 39. `forecast(h = 3)` then produces 3 months of guesses from every one of those 8 fits, 24 forecasted months in total. `.mean` is each forecast's point guess. The table above shows the first two origins: `.id` 1 guesses 228, 210 and 213 orders for January, February and March 2024, and `.id` 2 guesses 203, 222 and 214 for the 3 months after that.

=== step === concept
## Scoring every origin with accuracy()

`accuracy()` can score all 24 of those forecasted months at once, either one origin at a time or pooled into a single number.

```r
# Score each origin separately, then pool all 8 into one CV estimate
acc_by_id <- accuracy(fc_cv, nb, by = c(".id", ".model"))
acc_by_id %>% select(.id, RMSE, MAE, MAPE)
#> # A tibble: 8 × 4
#>     .id  RMSE   MAE  MAPE
#>   <int> <dbl> <dbl> <dbl>
#> 1     1  8.06  6.33  2.85
#> 2     2 22.0  21     8.99
#> 3     3 11.3   8.67  3.62
#> 4     4 27.6  23.7   8.30
#> 5     5 29.7  28.7  11.5 
#> 6     6 21.6  20.3   7.91
#> 7     7 24.3  22.7   8.77
#> 8     8  9.06  7.33  2.60

acc_overall <- accuracy(fc_cv, nb, by = ".model")
acc_overall %>% select(.model, RMSE, MAE, MAPE)
#> # A tibble: 1 × 4
#>   .model  RMSE   MAE  MAPE
#>   <chr>  <dbl> <dbl> <dbl>
#> 1 snaive  20.8  17.3  6.82
```

`by = c(".id", ".model")` keeps every origin's score separate, so `acc_by_id` shows all 8 RMSEs side by side. They swing from 8.06, SNAIVE's best 3 months, up to 29.7, its worst. That spread is real: some 3-month stretches are genuinely easier to guess than others, and no single one of those 8 numbers alone tells you what SNAIVE is really worth on Nordic Books.

`by = ".model"` instead pools every origin's errors into one number per model. That single pooled RMSE, 20.8, is the cross-validated score: not the luckiest origin, not the unluckiest, but all 8 combined. Compare it to the RMSE from a single 48-month train/test split, 22.5. The two land close together here, but the cross-validated score carries the weight of 8 separately tested windows behind it instead of just one, which is why it is the number worth trusting when Nordic Books has to choose a forecasting method.

=== step === concept
## Comparing two methods on the same origins

The same 8 origins that scored SNAIVE can score any other forecasting method too, and because they are exactly the same 8 windows, the two scores are directly comparable.

The drift method is the other benchmark worth trying here. Instead of repeating last year's number the way SNAIVE does, it draws a straight line from the training window's first point to its last, and extends that line forward. In fable, it is written `RW(orders ~ drift())`, a random walk with a drift term added.

```r
# Score SNAIVE and the drift method across the identical 8 origins
fc_cmp <- origins %>%
  model(snaive = SNAIVE(orders), drift = RW(orders ~ drift())) %>%
  forecast(h = 3)

accuracy(fc_cmp, nb, by = ".model") %>% select(.model, RMSE, MAE, MAPE)
#> # A tibble: 2 × 4
#>   .model  RMSE   MAE  MAPE
#>   <chr>  <dbl> <dbl> <dbl>
#> 1 drift   38.3  28.4 11.4 
#> 2 snaive  20.8  17.3  6.82
```

`model()` now fits both methods inside every one of the 8 origins, so each one gets scored on precisely the same 24 forecasted months. Drift's pooled RMSE, 38.3, is nearly double SNAIVE's 20.8. That is a fair result, not a lucky one: both methods faced the same origins, the same 3-month horizons and the same real orders to be checked against. Nordic Books' seasonal spikes each December are exactly what drift's straight line cannot see coming, while SNAIVE, by construction, always remembers last year's December.

=== step === quiz
## Quick check: choosing the more accurate method

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Compare the drift method's pooled RMSE across the 8 origins to SNAIVE's RMSE of 22.5 from the single 48-month split. ::no
- Score both methods across the same 8 rolling origins with accuracy(by = ".model") and compare the pooled RMSE. ::ok Exactly right. Identical origins make the two RMSEs comparable: SNAIVE's pooled 20.8 beats drift's 38.3 because both were judged on exactly the same 8 windows and the same 24 forecasted months.
- Check which method's forecast lands closer to the real orders in December 2025 alone. ::no
- Whichever method fits the 8 training windows with the smaller in-sample error wins. ::no A fitted line always looks better than it forecasts, because fitting error is measured on data the model already saw. Only accuracy() on the forecasted, held-out months, pooled across identical origins, tells you which method actually predicts better.

=== step === tryit
## Your turn: build the rolling-origin comparison

`origins` still holds the 8 rolling windows built from Nordic Books. Score SNAIVE and the drift method across them the same way, and read off which one wins.

```r
# origins holds the 8 rolling windows already built from Nordic Books.
# Fit snaive = SNAIVE(orders) and drift = RW(orders ~ drift()) on origins,
# forecast 3 months ahead from each origin, then pool the scores with
# accuracy(..., by = ".model").
# Four lines. Press Check when you have them.
```
::check {"regex": "RW[(]orders\\s*~\\s*drift[(][)][)]", "gate": true, "difficulty": "intermediate", "ok": "Right: drift comes back with RMSE 38.3 against SNAIVE's 20.8, scored on the identical 8 origins.", "no": "Fit both models inside origins with model(snaive = SNAIVE(orders), drift = RW(orders ~ drift())), then forecast(h = 3) and accuracy(nb, by = \".model\")."}
::solution
```r
# Fit both methods across origins, forecast h = 3, and pool the scores by model
fc_cmp <- origins %>%
  model(snaive = SNAIVE(orders), drift = RW(orders ~ drift())) %>%
  forecast(h = 3)

accuracy(fc_cmp, nb, by = ".model") %>% select(.model, RMSE, MAE, MAPE)
#> # A tibble: 2 × 4
#>   .model  RMSE   MAE  MAPE
#>   <chr>  <dbl> <dbl> <dbl>
#> 1 drift   38.3  28.4 11.4 
#> 2 snaive  20.8  17.3  6.82
```

=== step === concept
## References

- [Forecasting: Principles and Practice, section 5.10, Time series cross-validation](https://otexts.com/fpp3/tscv.html) - Hyndman and Athanasopoulos (3rd ed.), the source for rolling-origin cross-validation and why a single split undersells its own uncertainty.
- [tsibble package reference documentation for stretch_tsibble()](https://tsibble.tidyverts.org/reference/stretch_tsibble.html)
- [fabletools package reference documentation for accuracy()](https://fabletools.tidyverts.org/reference/accuracy.html)
- Bergmeir, C. and Benitez, J.M. (2012), "On the use of cross-validation for time series predictor evaluation", Information Sciences, 191, 192-213.
- [Cross-validation for time series, Hyndsight blog](https://robjhyndman.com/hyndsight/tscv/) - Rob Hyndman's own walkthrough of rolling-origin evaluation.

=== step === complete
## What rolling-origin cross-validation buys you

A single train/test split hands back one RMSE, and that RMSE is only as trustworthy as whichever 12 months happened to fall in the test window. Ordinary cross-validation fixes that for independent rows by rotating the validation fold and averaging several scores, but it cheats on a time series, because a rotating fold trains on rows that have not happened yet at the point it is forecasting.

Rolling-origin cross-validation grows the training window forward in time instead, one origin at a time, and scores every origin honestly using only the data that came before it. Nordic Books' 8 origins gave SNAIVE RMSEs from 8.06 up to 29.7, and pooling all 8 turned that spread into one steadier number, 20.8, a score that held up when compared fairly against the drift method's 38.3 on the identical windows.

RMSE, MAE and MAPE did the scoring here. The next lesson looks at metrics built specifically for comparing across different series and different horizons: MASE, RMSSE and pinball loss.
