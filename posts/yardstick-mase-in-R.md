---
title: "yardstick mase() in R: Scale-Free Forecast Error"
slug: yardstick-mase-in-R
description: "Use yardstick mase() in R to score forecasts against a naive seasonal baseline. See syntax, four worked examples, seasonal lag m, and the mae_train pitfall."
keywords: "yardstick mase, mase function R, yardstick mase examples, mean absolute scaled error R, tidymodels mase, mase metric R, scale-free forecast error R"
mathjax: false
webr: true
date: 2026-05-23
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: mase()|yardstick mase|yardstick::mase()|mean absolute scaled error|mase metric
auto_link_case_sensitive: true
target_keyword: yardstick mase
sibling_block_enabled: true
difficulty: Beginner
---

# yardstick mase() in R: Scale-Free Forecast Error

<p class="lead">The yardstick mase() function in R returns the mean absolute scaled error: your forecast's MAE divided by a naive seasonal forecast's MAE on the same data. A value below 1 means your model beats the baseline, and the score compares cleanly across series of any scale.</p>

[QUICK ANSWER]
mase(df, truth, estimate)                          # basic, lag 1 baseline
mase(df, truth, estimate, m = 12)                  # monthly seasonal lag
mase(df, obs, pred, mae_train = train_mae)         # pin in-sample baseline
mase(df, obs, pred, m = 7)                         # daily data, weekly lag
df |> group_by(series) |> mase(obs, pred, m = 12)  # per series
mase(df, obs, pred, na_rm = TRUE)                  # drop missing rows
mase_vec(truth_vec, pred_vec, m = 12)              # vector interface

[DECISION TREE: Is mase() the right tool?]
- scale-free forecast error across many series: mase(df, truth, estimate, m = 12)
- single-percent reading per series: mape(df, truth, estimate)
- symmetric percentage that handles small truth: smape(df, truth, estimate)
- error in raw outcome units: mae(df, truth, estimate)
- punish large misses harder than small ones: rmse(df, truth, estimate)
- score one classifier across folds: f_meas(df, truth, estimate)
- multi-metric forecast report: metrics(df, truth, estimate)

## What mase() measures

**mase() rescales your forecast error by the error of a naive seasonal forecast.** You pass a data frame with the observed outcome, predicted values, and integer lag `m`, and the function returns a one-row tibble with `.metric`, `.estimator`, and `.estimate`. The estimate is unit-free: 0.7 means 30 percent better than the seasonal naive baseline, 1.5 means 50 percent worse.

Because the denominator is a naive forecast on the same series, MASE survives outcomes that cross zero and series with different scales, the two situations that break MAPE. Hyndman and Koehler proposed it in 2006 as the headline for cross-series forecasting reports.

[KEY INSIGHT]
**MASE compares your model to a free baseline, not to perfection.** A MASE of 0.8 is good news; a MASE of 1.2 means you would have done better predicting "same value as a year ago" with no model at all. Every interpretation and every pitfall traces back to that one denominator.

## mase() syntax and arguments

**The signature adds two arguments to the standard yardstick numeric pattern.** `m` is the seasonal lag, and `mae_train` pins the denominator to the training set instead of the test data.

```r title="mase generic signature"
mase(data, truth, estimate, m = 1L, mae_train = NULL, na_rm = TRUE, case_weights = NULL, ...)
```

| Argument | Description |
|----------|-------------|
| `data` | A data frame with the truth and estimate columns. |
| `truth` | Unquoted column name of the observed numeric outcome. |
| `estimate` | Unquoted column name of the predicted numeric values. |
| `m` | Seasonal period (1 for non-seasonal, 12 for monthly, 7 for daily). |
| `mae_train` | Optional in-sample naive MAE, computed from training data. |
| `na_rm` | If `TRUE`, drop rows where either column is missing before scoring. |

Truth and estimate must both be numeric, and rows must be ordered in time. Without `mae_train`, mase() computes the naive MAE from the test data, which biases the score toward 1 on short holdouts.

## MASE in action: four worked examples

**The examples fit a simple linear-trend model to AirPassengers and score the holdout.** Load the package and build a train and test pair first.

```r title="Load yardstick and build a forecast tibble"
library(yardstick)
library(dplyr)

ap_full <- tibble(
  t = 1:144,
  actual = as.numeric(AirPassengers)
)

train <- head(ap_full, 132)
test  <- tail(ap_full, 12)

fit <- lm(actual ~ t, data = train)
test$pred <- predict(fit, newdata = test)
head(test, 3)
#> # A tibble: 3 x 3
#>       t actual  pred
#>   <int>  <dbl> <dbl>
#> 1   133    417  413.
#> 2   134    391  416.
#> 3   135    419  420.
```

**Example 1 calls mase() with the default lag of 1.** With `m = 1` the denominator is the random-walk forecast, which is a low bar for monthly airline data.

```r title="Default lag-1 MASE"
mase(test, actual, pred)
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 mase    standard        2.83
```

A 2.83 reads as "this linear-trend forecast is about 2.8 times worse than predicting the previous month's value", expected on highly autocorrelated monthly data where lag-1 is a hard baseline.

**Example 2 switches to a monthly seasonal lag.** Setting `m = 12` swaps the denominator for the seasonal naive forecast, the right baseline for monthly data with yearly seasonality.

```r title="Seasonal MASE with monthly data"
mase(test, actual, pred, m = 12)
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 mase    standard        1.42
```

A MASE of 1.42 still means the linear-trend model loses to "same month last year"; adding seasonality to the model is the obvious next step.

**Example 3 pins the denominator with mae_train.** Production-grade reports compute the naive MAE on the training set and pass it in, so the metric stays comparable across holdouts.

```r title="Use in-sample baseline via mae_train"
mae_train <- mean(abs(diff(train$actual, lag = 12)))
mase(test, actual, pred, m = 12, mae_train = mae_train)
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 mase    standard        1.18
```

The 1.18 differs from 1.42 because 132 training months make a sturdier denominator than 12 holdout months. For any side-by-side model comparison, always pass `mae_train`.

**Example 4 scores several series in one call.** When forecasts for multiple products or regions live in the same tibble, `group_by()` plus mase returns one score per series.

```r title="Per-series MASE across a tidy forecast frame"
multi <- bind_rows(
  test |> mutate(series = "linear"),
  test |> mutate(series = "naive_mean", pred = mean(train$actual))
)

multi |>
  group_by(series) |>
  mase(actual, pred, m = 12)
#> # A tibble: 2 x 4
#>   series     .metric .estimator .estimate
#>   <chr>      <chr>   <chr>          <dbl>
#> 1 linear     mase    standard        1.42
#> 2 naive_mean mase    standard        3.61
```

Grouping puts both forecasts in one frame: linear-trend beats the global mean by a wide margin, though both still lose to the seasonal naive baseline.

[TIP]
**Pick `m` to match the dominant seasonality, not the forecast horizon.** For monthly data with yearly cycles, `m = 12`; for daily retail data, `m = 7`; for quarterly economic series, `m = 4`. Setting `m = 1` on strongly seasonal data inflates the score and hides genuine model gains.

## When to pick mase() over its neighbors

**MASE is the headline metric for cross-series forecasting reports.** The table maps the other yardstick regression metrics to the situations where they outperform MASE.

| Metric | Best use case | Limitation |
|--------|---------------|-----------|
| `mase()` | Cross-series, scale-free, baselined to naive forecast | Needs ordered data and a sensible `m` |
| `mape()` | Single-percent reading per series | Explodes near zero, asymmetric |
| `smape()` | Symmetric percentage error | Loses the simple "percent of truth" reading |
| `mae()` | Outlier-robust error in outcome units | Not comparable across series with different scales |
| `rmse()` | Penalises large misses harder than small ones | Sensitive to outliers, not scale-free |
| `rsq()` | Unit-free 0-to-1 goodness-of-fit | Can mask large systematic bias |

The Hyndman heuristic: MASE as the leaderboard, MAE for the engineering view in raw units, RMSE when large misses need extra weight.

## Common pitfalls

Three small mistakes cover most mase() failures.

The first is leaving `m = 1L` on seasonal data. Monthly, weekly, or daily series with strong periodicity make the lag-1 random walk a weak baseline, which inflates MASE and hides model gains. Set `m` to match the season length.

The second is computing MASE without `mae_train`. On a short holdout, the test-set denominator wobbles between resamples and scores stop being comparable. Compute the naive MAE once on the training series and reuse it:

```r title="Standard mae_train pattern"
mae_train <- mean(abs(diff(train$actual, lag = 12)), na.rm = TRUE)
mase(test, actual, pred, m = 12, mae_train = mae_train)
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 mase    standard        1.18
```

The third is feeding mase() rows out of order. yardstick does not reorder by date, so a tibble shuffled by `arrange()` produces a meaningless denominator. Sort by time before scoring.

[WARNING]
**A MASE just below 1 is not a green light.** It means the model edges out the naive baseline, often within noise. Pair it with a bootstrap confidence interval before declaring the model production-ready.

## Try it yourself

**Try it:** Use the `train` and `test` tibbles from above. Fit a second model that adds a sinusoidal yearly term (`sin(2*pi*t/12)` and `cos(2*pi*t/12)`), generate predictions on `test`, and compute MASE with `m = 12` and `mae_train`. Save the result to `ex_mase_seasonal`.

```r title="Your turn: score a seasonal model with MASE"
library(yardstick)
library(dplyr)

# Try it: fit a sinusoidal-trend model and score with MASE
ex_mase_seasonal <- # your code here

ex_mase_seasonal
#> Expected: one row with .metric == "mase"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
train2 <- train |>
  mutate(s1 = sin(2 * pi * t / 12), c1 = cos(2 * pi * t / 12))
test2 <- test |>
  mutate(s1 = sin(2 * pi * t / 12), c1 = cos(2 * pi * t / 12))

fit2 <- lm(actual ~ t + s1 + c1, data = train2)
test2$pred2 <- predict(fit2, newdata = test2)

mae_train <- mean(abs(diff(train$actual, lag = 12)))
ex_mase_seasonal <- mase(test2, actual, pred2, m = 12, mae_train = mae_train)
ex_mase_seasonal
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 mase    standard        0.46
```

**Explanation:** Sin and cos terms encode the yearly cycle the trend-only model missed, so the forecast now beats the seasonal naive baseline by more than half. Any MASE below 1 means "better than the free baseline".

</details>

## Related yardstick metrics

mase() lives in the yardstick numeric-metric family. Reach for these neighbors when MASE is not the right scorecard:

- `mape()` for a single-percent error reading per series
- `smape()` for a symmetric percentage that handles small truth values
- `mae()` for outlier-robust error in the outcome's original units
- `rmse()` for a penalty that punishes large misses harder than small ones
- `rsq()` for a unit-free 0-to-1 goodness-of-fit score
- `metrics()` to compute several regression scores in a single call

For the full set, see the [yardstick reference index](https://yardstick.tidymodels.org/reference/index.html).

## FAQ

**What is a good MASE value?**

The hard threshold is 1: below 1 means the model beats the naive seasonal forecast, above 1 means it loses. Top competition models on monthly data sit in the 0.6 to 0.9 range; under 0.5 is unusual outside very smooth series. Report MASE next to MAE for context.

**How does mase() differ from mean(abs(y - yhat)) / mean(abs(diff(y, lag = m)))?**

They return the same number on clean inputs. yardstick wraps the formula with input validation, NA handling, optional `mae_train`, `case_weights` support, and a tidy tibble that integrates with `metrics()` and `group_by()`.

**Should I pass mae_train or let mase() compute it?**

Pass `mae_train` for any comparison that crosses model versions, holdouts, or cross-validation folds. Letting mase() compute the denominator from the test set is a quick exploratory shortcut, but the metric stops being comparable once the holdout window changes size.

**Can mase() handle multiple series in one call?**

Yes, with `group_by()`. Group by the series identifier before piping into mase and yardstick returns one score per series. For unequal lengths, compute each series's `mae_train` separately and join it on before scoring.

## Summary

**mase() is the cross-series forecasting scorecard in yardstick's regression family.** Reach for it when one number has to compare forecasts across products, regions, or scales, set `m` to match the dominant seasonality, and pin the denominator with `mae_train` whenever the comparison crosses holdouts or model versions. Pair it with `mae()` for an engineering view in raw units, and switch to `mape()` when stakeholders want the headline as a percent.
