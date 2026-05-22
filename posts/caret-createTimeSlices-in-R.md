---
title: "caret createTimeSlices() in R: Time-Series CV Folds"
slug: "caret-createTimeSlices-in-R"
description: "caret createTimeSlices() in R builds rolling and expanding time-series CV folds. Syntax, fixedWindow, horizon, skip, examples, pitfalls, and FAQ covered."
keywords: "caret createTimeSlices, createTimeSlices function R, caret createTimeSlices examples, R time series cross validation, rolling window cross validation R, expanding window CV R, createTimeSlices fixedWindow"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "caret-functions"
fr_parent: "R-Tutorial.html"
auto_link_terms: "createTimeSlices()|caret createTimeSlices|caret::createTimeSlices()|time-series cross-validation|rolling-origin cross-validation"
auto_link_case_sensitive: true
target_keyword: "caret createTimeSlices"
sibling_block_enabled: true
difficulty: "Beginner"
---

# caret createTimeSlices() in R: Time-Series CV Folds

<p class="lead">The <code>createTimeSlices()</code> function in caret builds rolling-origin cross-validation folds for time-series data, returning paired lists of training and test indices that always walk forward in time. It preserves the row order, so future observations never leak into the training set.</p>

[QUICK ANSWER]
createTimeSlices(y, initialWindow = 36, horizon = 12)         # rolling 36/12 folds
createTimeSlices(y, initialWindow = 36, horizon = 1)          # one-step-ahead
createTimeSlices(y, 36, 12, fixedWindow = FALSE)              # expanding window
createTimeSlices(y, 36, 12, skip = 11)                        # one slice per year (monthly y)
slices$train[[1]]; slices$test[[1]]                           # rows for slice 1
length(slices$train)                                          # number of slices
purrr::map2(slices$train, slices$test, fit_one)               # iterate slices

[DECISION TREE: Is createTimeSlices() the right tool?]
- rolling time-series CV: createTimeSlices(y, initialWindow, horizon)
- expanding time-series CV: createTimeSlices(y, w, h, fixedWindow = FALSE)
- shuffled k-fold (no time order): createFolds(y, k = 10)
- one stratified train/test split: createDataPartition(y, p = 0.7)
- repeated k-fold CV: createMultiFolds(y, k = 5, times = 3)
- automate inside train(): trainControl(method = "timeslice")
- bootstrap resamples: createResample(y, times = 25)

## What createTimeSlices() does in one sentence

**`createTimeSlices()` is caret's rolling-origin splitter for ordered data.** You give it a vector with a known length, a training window size, and a forecast horizon, and it returns two parallel lists named `train` and `test`. Slice `i` always has training rows that come strictly before its test rows, so the function enforces time order without any extra bookkeeping.

The function exists because k-fold splitters shuffle rows. That is fine for IID data but breaks the moment the outcome is ordered by time, because shuffling lets the model learn from future observations and inflates the CV score. `createTimeSlices()` walks a window from the start of the series to the end, emitting one slice per step. With `fixedWindow = TRUE` the training window is constant length (rolling); with `fixedWindow = FALSE` it grows (expanding). The output plugs directly into `trainControl(index = ..., indexOut = ...)` or into a hand-rolled loop.

## createTimeSlices() syntax and arguments

**`createTimeSlices()` cares only about the length of `y`, not its values.** Five arguments control the window size, horizon, growth, and stride.

```r title="Load caret and create a series"
library(caret)

y <- ts(rnorm(48), frequency = 12, start = c(2022, 1))
length(y)
#> [1] 48
```

The signature is short:

```r title="createTimeSlices signature"
createTimeSlices(y, initialWindow, horizon = 1,
                 fixedWindow = TRUE, skip = 0)
```

- `y`: an ordered vector (numeric, ts, or any sequence). Only `length(y)` is used; values are ignored.
- `initialWindow`: rows in the first training window. With monthly data and 3-year training, use `36`.
- `horizon`: rows in each test set. Use `1` for one-step-ahead forecasts, `12` to score a full year ahead.
- `fixedWindow`: `TRUE` rolls a constant-length training window; `FALSE` expands the training window from the start of the series.
- `skip`: rows to skip between consecutive slices. `0` (the default) gives the densest set; `skip = horizon - 1` makes the test sets disjoint.

[NOTE]
**Coming from Python scikit-learn?** The closest equivalent is `TimeSeriesSplit(n_splits = k, test_size = horizon)`. Both walk forward, but `createTimeSlices()` exposes `skip` directly and lets you choose rolling versus expanding with one flag instead of subclassing.

## createTimeSlices() examples by use case

**The list comes back with two elements: `train` and `test`.** Each is a named list whose length is the number of slices. Below are the four patterns you will reach for most often.

A rolling 36-month window forecasting 12 months ahead:

```r title="Rolling 36/12 time slices"
set.seed(1)
y <- ts(rnorm(48), frequency = 12, start = c(2022, 1))
slices <- createTimeSlices(y, initialWindow = 36, horizon = 12)

length(slices$train)
#> [1] 1
slices$train[[1]]
#>  [1]  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24
#> [25] 25 26 27 28 29 30 31 32 33 34 35 36
slices$test[[1]]
#>  [1] 37 38 39 40 41 42 43 44 45 46 47 48
```

With 48 monthly observations, a 36-month window, and a 12-month horizon, only one slice fits (`48 - 36 - 12 + 1 = 1` when `skip = 0`). Drop the horizon to 1 to get many short-horizon slices:

```r title="One-step-ahead rolling slices"
slices1 <- createTimeSlices(y, initialWindow = 36, horizon = 1)
length(slices1$train)
#> [1] 12
slices1$train[[1]][c(1, 36)]
#> [1]  1 36
slices1$train[[2]][c(1, 36)]
#> [1]  2 37
slices1$test[[1]]
#> [1] 37
slices1$test[[12]]
#> [1] 48
```

Each slice shifts both ends of the training window forward by one row; the test row is the next observation. That is rolling-origin one-step-ahead CV.

Flip `fixedWindow` to grow the training set:

```r title="Expanding window with growing train set"
slices_exp <- createTimeSlices(y, initialWindow = 36, horizon = 1,
                               fixedWindow = FALSE)
sapply(slices_exp$train, length)
#>  [1] 36 37 38 39 40 41 42 43 44 45 46 47
slices_exp$train[[5]][c(1, length(slices_exp$train[[5]]))]
#> [1]  1 40
```

The training window starts at row 1 for every slice and stretches to just before each test row. This is the right shape when you want the model to use all the history available at each forecast.

Use `skip` when you want disjoint test sets or one slice per period:

```r title="Skip to one slice per quarter"
slices_q <- createTimeSlices(y, initialWindow = 36, horizon = 3, skip = 2)
length(slices_q$train)
#> [1] 4
sapply(slices_q$test, range)
#>      [,1] [,2] [,3] [,4]
#> [1,]   37   40   43   46
#> [2,]   39   42   45   48
```

With `horizon = 3` and `skip = 2`, slice origins advance by `skip + 1 = 3` rows, so the four test sets cover rows 37 to 48 with no overlap. The general rule is: `skip = horizon - 1` makes the test sets exactly adjacent.

[KEY INSIGHT]
**The slice count is deterministic from three numbers alone.** It is `floor((length(y) - initialWindow - horizon) / (skip + 1)) + 1`, regardless of the values inside `y`. Plug in your `length(y)` and pick `initialWindow` and `horizon` until the slice count is large enough for stable averaging.

## createTimeSlices() vs createFolds() and trainControl()

**`createTimeSlices()` preserves order; `createFolds()` shuffles; `trainControl(method = "timeslice")` runs the walk-forward CV for you.** Pick by whether your outcome is time-ordered and whether you are inside `train()`.

| Function | Use when | Shape of output |
|---|---|---|
| `createTimeSlices(y, w, h)` | y is ordered by time | list with `$train` and `$test`, both length `n_slices` |
| `createFolds(y, k = 10)` | y is IID, factor stratification needed | list of k test-index vectors |
| `createDataPartition(y, p)` | one initial holdout | list with training indices |
| `createMultiFolds(y, k, times)` | repeated k-fold on IID data | list of k * times train-index vectors |
| `trainControl(method = "timeslice")` | calling `train()` on a time series | a control object with `initialWindow`, `horizon`, `fixedWindow`, `skip` |

If you are calling `train()`, pass `trainControl(method = "timeslice", initialWindow = 36, horizon = 12)` and caret runs the slices internally. Reach for `createTimeSlices()` directly when you need a forecasting loop outside `train()`, for example to score a custom horizon-specific metric or to fit a model `train()` does not wrap.

## Common pitfalls

**Three mistakes silently break time-series CV.** Each one has a clear symptom in the slice index ranges.

The first is passing a shuffled vector. `createTimeSlices()` does not check that `y` is ordered; it just walks the indices. If you sort or sample `y` before the call, slice 1's test rows can come from any month. Always pass the series in its original order.

The second is mismatched horizon and `skip`. With `horizon = 12` and `skip = 0` the test sets overlap heavily, so every slice contributes correlated errors to the average. For independent test sets set `skip = horizon - 1`; for the densest set leave `skip = 0` and weight accordingly.

[WARNING]
**A short series plus a long window produces zero slices.** If `length(y) < initialWindow + horizon`, the function returns empty `$train` and `$test` lists with no error. Always check `length(slices$train)` before looping, or compute the slice count up front with `floor((length(y) - initialWindow - horizon) / (skip + 1)) + 1`.

The third is forgetting that `createTimeSlices()` is deterministic. No `set.seed()` is needed because there is no random sampling, only index arithmetic. Two calls with the same arguments always return identical slices, which is good for reproducibility but means you cannot diversify folds the way you can with `createFolds()`.

## Try it yourself

**Try it:** Build expanding-window slices on a 60-row series with a 24-row initial window and a 6-row horizon. Confirm the training window grows by 1 each slice.

```r title="Your turn: expanding time slices"
y_ex <- ts(rnorm(60))
ex_slices <- # your code here

sapply(ex_slices$train, length)
#> Expected: 24, 25, 26, ..., 53
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
y_ex <- ts(rnorm(60))
ex_slices <- createTimeSlices(y_ex, initialWindow = 24, horizon = 6,
                              fixedWindow = FALSE)

sapply(ex_slices$train, length)
#>  [1] 24 25 26 27 28 29 30 31 32 33 34 35 36 37 38 39 40 41 42 43 44 45 46 47 48
#> [26] 49 50 51 52 53 54
```

**Explanation:** `fixedWindow = FALSE` switches from rolling to expanding mode, so every slice starts at row 1 and grows by one row per step. The slice count is `60 - 24 - 6 + 1 = 31`, and the training-window lengths run from 24 up to 54.

</details>

## Related caret functions

Caret groups its resamplers by data assumption. `createTimeSlices()` is the time-ordered member; the rest assume independence.

- `createFolds(y, k = 10)`: shuffled k-fold cross-validation indices for IID data.
- `createDataPartition(y, p = 0.7)`: one stratified train/test split, the usual top-of-pipeline holdout.
- `createMultiFolds(y, k = 5, times = 3)`: repeated k-fold indices for `method = "repeatedcv"`.
- `createResample(y, times = 25)`: bootstrap resamples for `method = "boot"`.
- `trainControl(method = "timeslice")`: the wrapper that calls `createTimeSlices()` internally inside `train()`.

The usual pipeline is to call `createTimeSlices()` directly only for hand-rolled forecasting loops; inside `train()`, drive everything through `trainControl(method = "timeslice")` and pass the same `initialWindow`, `horizon`, `fixedWindow`, and `skip` arguments through.

## FAQ

**What is the difference between createTimeSlices() and createFolds()?**

`createFolds()` shuffles rows and stratifies by outcome, which is correct for IID data but leaks future observations when the series is ordered by time. `createTimeSlices()` keeps the row order and emits slices where the training rows always precede the test rows. Use `createTimeSlices()` for any temporal target; reach for `createFolds()` only when row order does not encode information.

**How do I get an expanding window instead of a rolling window?**

Pass `fixedWindow = FALSE`. With the default `TRUE`, the training window length stays at `initialWindow` and the origin walks forward. With `FALSE`, every training set starts at row 1 and grows by `skip + 1` rows per slice, so by the last slice the model has seen almost all of the available history. Expanding mode is the right default when more history reliably helps the model.

**How many slices will createTimeSlices() return?**

The formula is `floor((length(y) - initialWindow - horizon) / (skip + 1)) + 1`. With 100 observations, `initialWindow = 60`, `horizon = 12`, and `skip = 0` you get 29 slices. Increase `skip` to reduce the count while keeping the same training and test sizes. Always confirm `length(y) >= initialWindow + horizon`; otherwise the function returns empty lists.

**Can I pass createTimeSlices() output to trainControl()?**

Yes. Build the slices once, then call `trainControl(index = slices$train, indexOut = slices$test, method = "cv")`. This reuses the exact same time slices across multiple `train()` calls, so when you compare two model specifications the difference is not contaminated by slice randomness. It is the cleanest way to score several model families on identical walk-forward windows.
