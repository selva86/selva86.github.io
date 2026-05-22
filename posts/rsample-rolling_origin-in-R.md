---
title: "rsample rolling_origin() in R: Time-Series Resampling"
slug: rsample-rolling_origin-in-R
description: "Build time-ordered resamples with rsample rolling_origin() in R. Covers initial, assess, skip, cumulative, and lag for expanding and sliding window backtesting."
keywords: "rsample rolling_origin, rolling_origin function R, rsample rolling_origin examples, R time series cross validation, rolling_origin tidymodels, expanding window R"
mathjax: false
webr: true
date: 2026-05-22
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "rolling_origin()|rsample rolling_origin|rsample::rolling_origin()|time series cross-validation|rolling-origin resampling"
auto_link_case_sensitive: true
target_keyword: "rsample rolling_origin"
sibling_block_enabled: true
difficulty: Beginner
---

# rsample rolling_origin() in R: Time-Series Resampling

<p class="lead">The rsample rolling_origin() function in R builds time-ordered resamples for forecasting, so each held-out window comes strictly after its training window in time and your backtest never leaks future information into the model.</p>

[QUICK ANSWER]
rolling_origin(df, initial = 100)                          # default expanding window
rolling_origin(df, initial = 100, assess = 10)             # 10-row forecast horizon
rolling_origin(df, initial = 100, assess = 10, skip = 9)   # non-overlapping origins
rolling_origin(df, initial = 100, cumulative = FALSE)      # sliding window
rolling_origin(df, initial = 100, lag = 5)                 # gap between train and test
analysis(splits$splits[[1]])                               # training rows of split 1
assessment(splits$splits[[1]])                             # held-out rows of split 1

[DECISION TREE: Is rolling_origin() the right tool?]
- time-ordered resamples for forecasting: rolling_origin(df, initial = 100)
- standard k-fold cross-validation: vfold_cv(df, v = 10)
- single train/test split: initial_split(df, prop = 0.8)
- bootstrap resamples with replacement: bootstraps(df, times = 25)
- random monte carlo splits: mc_cv(df, prop = 0.8, times = 25)
- leave-one-out resamples: loo_cv(df)
- group-aware folds (panel data): group_vfold_cv(df, group_var)

## What rolling_origin() does

**rolling_origin() resamples a time-ordered data frame into a sequence of train and test windows.** It belongs to the rsample package, the resampling engine of the tidymodels ecosystem. Unlike `vfold_cv()`, which shuffles rows before partitioning, `rolling_origin()` preserves row order. Each split's assessment rows sit immediately after its analysis rows in the original data, mimicking how a real forecast is produced one step at a time.

The function returns a tibble of `rsplit` objects in a `splits` list-column. The first split trains on rows 1 through `initial`, then assesses on the next `assess` rows. The next split extends or slides the training window by `skip + 1` rows, and so on until the data runs out. This pattern is the backtesting workflow for any forecasting model: ARIMA, prophet, exponential smoothing, or an ML model with lagged features.

## Syntax and arguments

**The signature has one required argument and five tuning knobs that control window shape.**

```r title="rolling_origin function signature"
rolling_origin(
  data,             # time-ordered data frame
  initial = 5,      # rows in the first analysis window
  assess = 1,       # rows in each assessment window
  cumulative = TRUE,# TRUE = expanding window, FALSE = sliding window
  skip = 0,         # rows skipped between consecutive splits
  lag = 0           # gap rows between analysis and assessment
)
```

The arguments that matter in practice:

- **data**: a tibble or data frame sorted chronologically. The function does not check ordering, so sort before calling.
- **initial**: the size of the first training window. Pick large enough to fit your model reliably.
- **assess**: the forecast horizon in rows. 1 for one-step-ahead, 7 for a week of daily data, 12 for a year of monthly data.
- **cumulative**: `TRUE` (default) grows the training window each split; `FALSE` slides a fixed-size window forward.
- **skip**: rows skipped between origins. Use `skip = assess - 1` to get non-overlapping assessment windows.
- **lag**: rows held out between train and test. Set to your longest feature lag to prevent leakage.

## rolling_origin() examples

### Basic expanding window backtest

**Call rolling_origin() on a time-ordered data frame and the result is a tibble of splits.** The default `cumulative = TRUE` grows the training window by one row each split.

```r title="Create default expanding window splits"
library(rsample)

ts_df <- data.frame(t = 1:30, y = cumsum(rnorm(30)))
splits <- rolling_origin(ts_df, initial = 20, assess = 5)
splits
#> # Rolling origin forecast resampling 
#> # A tibble: 6 x 2
#>   splits         id    
#>   <list>         <chr> 
#> 1 <split [20/5]> Slice1
#> 2 <split [21/5]> Slice2
#> 3 <split [22/5]> Slice3
#> 4 <split [23/5]> Slice4
#> 5 <split [24/5]> Slice5
#> 6 <split [25/5]> Slice6
```

Each `<split [n/5]>` grows the training portion by one row as the origin advances. The assessment window stays at 5 rows.

### Extract analysis and assessment sets

**Use analysis() and assessment() to materialize one split.** Both return ordinary data frames you can feed to any modeling function.

```r title="Pull one split's data"
slice1 <- splits$splits[[1]]

train_set <- analysis(slice1)
test_set  <- assessment(slice1)

range(train_set$t)
#> [1]  1 20
range(test_set$t)
#> [1] 21 25
```

The training rows stop at `t = 20` and the assessment rows pick up at `t = 21`. Chronology is preserved.

### Sliding window instead of expanding

**Set cumulative = FALSE to slide a fixed-size training window forward.** Useful when older data is no longer representative, such as after a regime change.

```r title="Use a sliding window"
slide_splits <- rolling_origin(
  ts_df,
  initial = 20,
  assess = 5,
  cumulative = FALSE
)
sapply(slide_splits$splits, function(s) nrow(analysis(s)))
#> [1] 20 20 20 20 20 20
```

Every training window holds exactly 20 rows. With `cumulative = TRUE` the same call would produce windows of 20, 21, 22, and so on.

### Non-overlapping assessment windows with skip

**Use skip = assess - 1 to make assessment windows non-overlapping.** This is the standard setup when reporting one metric per disjoint forecast horizon.

```r title="Non-overlapping 5-step horizons"
disjoint <- rolling_origin(
  ts_df,
  initial = 20,
  assess = 5,
  skip = 4
)
sapply(disjoint$splits, function(s) range(assessment(s)$t))
#>      [,1] [,2]
#> [1,]   21   26
#> [2,]   25   30
```

The two assessment windows cover `t = 21:25` and `t = 26:30` with no overlap, exactly what backtesting protocols recommend.

## rolling_origin() vs other resampling functions

**rolling_origin() preserves time order; every other rsample resample shuffles or replaces.** Choose based on whether the data has a meaningful sequence.

| Function | Produces | Use when |
|---|---|---|
| `rolling_origin()` | Time-ordered analysis/assessment splits | Forecasting, backtesting, sequential data |
| `vfold_cv()` | v shuffled folds, every row held out once | Cross-sectional data, hyperparameter tuning |
| `initial_split()` | One train/test split | Final hold-out, not iterative backtest |
| `bootstraps()` | Resamples with replacement | Small data, variance estimates |
| `mc_cv()` | Random train/test splits | Many resamples without v-fold structure |
| `sliding_period()` | Calendar-aware sliding windows | Splits keyed to dates, not row counts |

A typical time-series tidymodels workflow combines `rolling_origin()` with `fit_resamples()` to produce a backtest report across many horizons. For a final hold-out, take the latest `assess` rows out with `initial_time_split()`.

[KEY INSIGHT]
**rolling_origin() counts rows, not time.** The function indexes by position, not by the date column. If your time stamps are irregular (missing days, mixed daily and weekly), `initial = 30` does not mean 30 days of history. Pre-aggregate or use `sliding_period()` from the slider package when the calendar matters.

## Common pitfalls

**Three mistakes account for most rolling_origin() bugs.**

- **Forgetting to sort by time.** `rolling_origin()` trusts the data's row order. If rows arrive ungrouped or scrambled, the analysis window mixes past and future and the backtest is meaningless. Always `arrange(date)` before calling the function.
- **Setting assess too small relative to the model's forecast goal.** A model that will forecast 12 months ahead in production should be assessed on 12-row windows, not 1-row windows. The metric you publish should match the horizon you serve.
- **Ignoring the lag argument when features include lags.** A model that uses `lag_7` of the target leaks the future if the training set ends at row 100 and the test set starts at row 101. Set `lag = 7` to insert a 7-row buffer that mirrors the operational delay between training cutoff and prediction.

[WARNING]
**rsample renamed and updated rolling_origin() in version 1.2.0 (2023).** Older tutorials may reference deprecated arguments or the original signature. The current canonical signature has `initial`, `assess`, `cumulative`, `skip`, and `lag`. A newer companion function `sliding_period()` from slider plus rsample handles calendar-aware splits and is recommended for daily, weekly, or monthly data with irregular gaps.

## Try it yourself

**Try it:** Build a rolling-origin resample of `AirPassengers` (the classic monthly time series) with a 60-row initial training window, a 12-row forecast horizon, non-overlapping assessment windows, and an expanding training window. Save it to `ex_splits`.

```r title="Your turn: monthly forecast backtest"
library(rsample)

ap_df <- data.frame(
  month = seq.Date(as.Date("1949-01-01"), by = "month", length.out = 144),
  y     = as.numeric(AirPassengers)
)

# Try it: rolling-origin backtest
ex_splits <- # your code here

nrow(ex_splits)
#> Expected: 7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
library(rsample)

ap_df <- data.frame(
  month = seq.Date(as.Date("1949-01-01"), by = "month", length.out = 144),
  y     = as.numeric(AirPassengers)
)

ex_splits <- rolling_origin(
  ap_df,
  initial    = 60,
  assess     = 12,
  skip       = 11,
  cumulative = TRUE
)
nrow(ex_splits)
#> [1] 7
```

**Explanation:** `initial = 60` reserves 5 years of monthly history for the first training window. `assess = 12` evaluates a one-year forecast. `skip = 11` makes the next origin start 12 rows later, so the seven assessment windows tile the remaining data without overlap.

</details>

## Related rsample functions

**rolling_origin() is the time-series workhorse; these functions extend it.**

- `analysis()` and `assessment()`: extract the two data frames from a split object.
- `initial_time_split()`: carve off the most recent rows as a final hold-out before backtesting.
- `sliding_period()`: calendar-aware splits keyed to dates (days, weeks, months) instead of row counts.
- `group_vfold_cv()`: keep all rows of a group together; useful for panel forecasting.
- `int_pctl()`: build percentile confidence intervals from resampled metrics.

[NOTE]
**Coming from scikit-learn?** `rolling_origin(df, initial = n, assess = m, cumulative = TRUE)` is the tidymodels equivalent of `TimeSeriesSplit(n_splits=k)`. The `cumulative = FALSE` setting matches the `max_train_size` argument; `lag` matches the `gap` parameter.

## FAQ

**What is the difference between rolling_origin() and vfold_cv()?**

`vfold_cv()` shuffles rows before partitioning, which destroys time order. Every row appears in the held-out set once across the folds, but the training and test rows are randomly mixed. `rolling_origin()` keeps rows in their original order so the assessment rows of each split come strictly after the analysis rows. Use `vfold_cv()` for cross-sectional data and `rolling_origin()` for any series with a meaningful temporal ordering.

**Does rolling_origin() handle multiple time series?**

Not directly. The function treats the data frame as one ordered sequence and does not segment by group. For panel data with several series in long format, group the data first with `nest()` and apply `rolling_origin()` within each group, or use `sliding_period()` from slider with a `group_by()` upstream. For tidymodels-compatible panel resamples, `group_vfold_cv()` is the simpler alternative when strict time order is not required within group.

**How do I make rolling_origin() reproducible?**

`rolling_origin()` is deterministic. It does not shuffle, so the same data and arguments always produce the same splits and no `set.seed()` call is needed. The only randomness in a backtest workflow comes from the model itself (random forests, neural networks) or from companion resamples like `bootstraps()`. Set seeds before those steps, not before `rolling_origin()`.

**What value should I choose for initial?**

Pick the smallest training window where your model fits stably and produces sensible coefficients. For ARIMA and exponential smoothing models on daily data, 60 to 90 rows is a common floor. For ML models with engineered features, you need enough rows to cover at least one full seasonal cycle plus burn-in for lagged features. If `initial` is too small the first few backtest scores will be unreliable; if too large you waste data that could have been assessed.

**Can rolling_origin() produce overlapping assessment windows?**

Yes, the default `skip = 0` does exactly that. Each origin advances by one row, so consecutive assessment windows overlap by `assess - 1` rows. Overlap is fine when averaging metrics across many origins. For one independent score per horizon, set `skip = assess - 1` so the assessment windows tile the data without overlap.
