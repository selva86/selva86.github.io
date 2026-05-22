---
title: "rsample sliding_window() in R: Slider-Style Resamples"
slug: rsample-sliding_window-in-R
description: "Build sliding-window resamples with rsample sliding_window() in R. Covers lookback, assess_start, assess_stop, step, and skip for time-series backtests."
keywords: "rsample sliding_window, sliding_window function R, rsample sliding_window examples, sliding window cross validation R, tidymodels sliding window, R rolling window resampling, slider rsample"
mathjax: false
webr: true
date: 2026-05-22
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "sliding_window()|rsample sliding_window|rsample::sliding_window()|sliding-window resampling|slider-style splits"
auto_link_case_sensitive: true
target_keyword: "rsample sliding_window"
sibling_block_enabled: true
difficulty: Beginner
---

# rsample sliding_window() in R: Slider-Style Resamples

<p class="lead">The rsample sliding_window() function in R builds row-based sliding window resamples for time-series cross-validation, where every split's analysis window has the same length and the assessment window sits a fixed number of rows ahead, mirroring the slider package's semantics inside the tidymodels resampling engine.</p>

[QUICK ANSWER]
sliding_window(df, lookback = 9)                              # 10-row train, 1-row test
sliding_window(df, lookback = 9, assess_stop = 5)             # 5-row forecast horizon
sliding_window(df, lookback = 9, step = 5)                    # advance 5 rows each split
sliding_window(df, lookback = 9, complete = FALSE)            # keep partial windows
sliding_window(df, lookback = 9, skip = 4)                    # use 1 of every 5 splits
sliding_window(df, lookback = 9, assess_start = 8, assess_stop = 14)  # gapped horizon
analysis(sw$splits[[1]])                                      # training rows of split 1
assessment(sw$splits[[1]])                                    # held-out rows of split 1

[DECISION TREE: Is sliding_window() the right tool?]
- fixed-size training window by row count: sliding_window(df, lookback = n)
- expanding training window over time: rolling_origin(df, initial = n)
- sliding by calendar period (days, months): sliding_period(df, date, "month")
- sliding by index column values: sliding_index(df, date)
- standard shuffled k-fold cross-validation: vfold_cv(df, v = 10)
- bootstrap resamples with replacement: bootstraps(df, times = 25)
- single train/test split: initial_split(df, prop = 0.8)

## What sliding_window() does

**sliding_window() carves a time-ordered data frame into fixed-size analysis and assessment windows that slide forward one row at a time.** It is rsample's port of the slider package's window semantics. Every split has the same analysis length, set by `lookback`, and the assessment window is a contiguous block defined by `assess_start` and `assess_stop` relative to the current row.

The function returns a tibble with a `splits` list-column and an `id` column. Each row is one `rsplit` object whose analysis and assessment indices you extract with `analysis()` and `assessment()`. Unlike `rolling_origin()`, the training window never grows. That matches how a production forecaster typically operates: keep the most recent N rows and discard older history when newer data arrives.

## Syntax and arguments

**The signature has one data argument and six knobs that shape the window.**

```r title="sliding_window function signature"
sliding_window(
  data,
  lookback     = 0L,    # rows before the current position included in analysis
  assess_start = 1L,    # first assessment row offset from current position
  assess_stop  = 1L,    # last assessment row offset from current position
  complete     = TRUE,  # drop iterations whose windows do not fully fit
  step         = 1L,    # rows to advance the current position each iteration
  skip         = 0L     # iterations to drop between kept iterations
)
```

The arguments that matter most:

- **lookback**: positions backward from the current row included in analysis. `lookback = 9` produces a 10-row training window (current row plus 9 prior).
- **assess_start** and **assess_stop**: offsets ahead of the current row that define the assessment window. Defaults give a one-row, one-step-ahead test.
- **complete**: `TRUE` drops iterations where the lookback or assessment window would run off either end of the data. Use `FALSE` only when partial windows are acceptable.
- **step**: how far the current row advances between iterations. `step = 1` produces maximally overlapping splits; `step = assess_stop - assess_start + 1` produces tiled windows.
- **skip**: iterations dropped between kept iterations. Often easier to control density via `step` instead.

## sliding_window() examples

### Basic fixed-window backtest

**Call sliding_window() on a sorted data frame to get a tibble of splits.** With defaults each split holds 1 row of analysis and 1 row of assessment, so set `lookback` to define a realistic training horizon.

```r title="Create fixed-size sliding splits"
library(rsample)

ts_df <- data.frame(t = 1:30, y = cumsum(rnorm(30)))
sw <- sliding_window(ts_df, lookback = 9, assess_stop = 5)
sw
#> # Sliding window resampling 
#> # A tibble: 16 x 2
#>    splits         id     
#>    <list>         <chr>  
#>  1 <split [10/5]> Slice01
#>  2 <split [10/5]> Slice02
#>  3 <split [10/5]> Slice03
#>  4 <split [10/5]> Slice04
#>  5 <split [10/5]> Slice05
#>  6 <split [10/5]> Slice06
#>  7 <split [10/5]> Slice07
#>  8 <split [10/5]> Slice08
#>  9 <split [10/5]> Slice09
#> 10 <split [10/5]> Slice10
#> # i 6 more rows
```

Every `<split [10/5]>` confirms the windows are identical: 10 training rows and 5 assessment rows. `rolling_origin()` would have produced `[10/5]`, `[11/5]`, `[12/5]`, and so on.

### Extract analysis and assessment rows

**Use analysis() and assessment() to materialize one split as plain data frames.** These are the inputs you feed into any modeling function.

```r title="Pull one split's data"
slice1 <- sw$splits[[1]]

train_set <- analysis(slice1)
test_set  <- assessment(slice1)

range(train_set$t)
#> [1]  1 10
range(test_set$t)
#> [1] 11 15
```

The training rows cover `t = 1` through `t = 10` and the assessment rows pick up at `t = 11`. Chronology is preserved.

### Non-overlapping windows with step

**Set step to the assessment length to produce tiled, non-overlapping splits.** This matches the standard backtesting convention where each held-out horizon is independent.

```r title="Tile the data with step = 5"
tiled <- sliding_window(
  ts_df,
  lookback     = 9,
  assess_stop  = 5,
  step         = 5
)
sapply(tiled$splits, function(s) range(assessment(s)$t))
#>      [,1] [,2] [,3] [,4]
#> [1,]   11   16   21   26
#> [2,]   15   20   25   30
```

The four assessment windows cover `t = 11:15`, `16:20`, `21:25`, and `26:30` with no overlap. Compare this to the 16 maximally overlapping splits from the previous example.

### Insert a gap with assess_start

**Move assess_start above 1 to leave a forecast gap between training and assessment.** This mimics the production lag between when a model retrains and when it serves a prediction.

```r title="Insert a 7-row gap before assessment"
gapped <- sliding_window(
  ts_df,
  lookback     = 9,
  assess_start = 8,
  assess_stop  = 14
)
slice1 <- gapped$splits[[1]]
range(analysis(slice1)$t)
#> [1]  1 10
range(assessment(slice1)$t)
#> [1] 18 24
```

Analysis stops at `t = 10`; assessment begins at `t = 18`, leaving rows 11 through 17 as a buffer that a model using lagged features cannot peek into.

## sliding_window() vs other resampling functions

**sliding_window() locks the training window size; the rsample family offers four other ways to split time-ordered data.**

| Function | Window behavior | Best for |
|---|---|---|
| `sliding_window()` | Fixed-size, slider-style row windows | Forecasting with stable training size |
| `rolling_origin()` | Expanding or sliding by row | Classic backtest, expanding history |
| `sliding_index()` | Fixed window keyed to an index column | Irregular time stamps |
| `sliding_period()` | Window of calendar periods (day, month) | Daily or monthly aggregated data |
| `vfold_cv()` | Shuffled v-fold cross-validation | Cross-sectional data, no time order |

A typical tidymodels backtest pipes the resamples into `fit_resamples()` so every split is scored with the same metric set. For a final hold-out evaluation before training the production model, take the latest rows out with `initial_time_split()` and run `sliding_window()` on what remains.

[KEY INSIGHT]
**sliding_window() indexes by row position, not by date.** The current row advances one position at a time regardless of whether the time stamp jumps a day, a week, or a year. If your data has gaps or mixed frequencies, prefer `sliding_index()` or `sliding_period()` so the windows track wall-clock time rather than row counts.

## Common pitfalls

**Three mistakes account for most sliding_window() bugs.**

- **Confusing lookback with initial.** `rolling_origin(initial = 10)` gives a 10-row training window; `sliding_window(lookback = 10)` gives an 11-row training window. The slider semantic counts the current row plus `lookback` prior rows, not the total span.
- **Forgetting complete = TRUE drops the start of the data.** With `lookback = 9`, the first nine rows are never the current position of any kept iteration, so they only ever appear inside analysis windows. If you need every row to be assessed at least once, switch to `vfold_cv()` after de-trending.
- **Setting step too aggressively.** `step = 10` on a 30-row series produces only three iterations. Use a step matched to your reporting cadence: daily models tile by `assess_stop - assess_start + 1`, weekly models can step by 7.

[WARNING]
**rsample's sliding_window() was added in version 1.2.0 and uses different argument names than rolling_origin().** Older blog posts still write `initial`, `assess`, and `cumulative`. Those belong to `rolling_origin()`. The slider-family functions use `lookback`, `assess_start`, `assess_stop`, `step`, and `complete`. Mixing the two argument vocabularies will silently produce wrong windows or a runtime error.

## Try it yourself

**Try it:** Build a sliding window resample of `AirPassengers` with a 24-row training window, a 12-row forecast horizon, and tiled non-overlapping assessment windows. Save the resamples to `ex_sw`.

```r title="Your turn: monthly forecast backtest"
library(rsample)

ap_df <- data.frame(
  month = seq.Date(as.Date("1949-01-01"), by = "month", length.out = 144),
  y     = as.numeric(AirPassengers)
)

# Try it: tiled sliding window backtest
ex_sw <- # your code here

nrow(ex_sw)
#> Expected: 10
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
library(rsample)

ap_df <- data.frame(
  month = seq.Date(as.Date("1949-01-01"), by = "month", length.out = 144),
  y     = as.numeric(AirPassengers)
)

ex_sw <- sliding_window(
  ap_df,
  lookback    = 23,
  assess_stop = 12,
  step        = 12
)
nrow(ex_sw)
#> [1] 10
```

**Explanation:** `lookback = 23` gives a 24-row training window (current row plus 23 prior). `assess_stop = 12` evaluates a one-year forecast. `step = 12` advances the current row 12 positions each iteration, producing ten tiled, non-overlapping assessment windows that cover the rest of the series.

</details>

## Related rsample functions

**sliding_window() is the row-based slider; these functions extend it.**

- `analysis()` and `assessment()`: extract the two data frames from any rsplit object.
- `sliding_index()`: fixed-size windows keyed to an index column (typically a date), respects irregular spacing.
- `sliding_period()`: windows of calendar periods such as days, weeks, or months.
- `rolling_origin()`: expanding-window variant where the training window grows each split.
- `initial_time_split()`: carve off the most recent rows as a final hold-out before backtesting.
- `int_pctl()`: build percentile confidence intervals from resampled metrics.

[NOTE]
**Coming from scikit-learn?** `sliding_window(df, lookback = n - 1, assess_stop = m, step = m)` is the tidymodels equivalent of `TimeSeriesSplit(n_splits=k, max_train_size=n, test_size=m)`. The `assess_start` argument has no direct sklearn counterpart and is closer to the `gap` parameter introduced in scikit-learn 0.24.

## FAQ

**What is the difference between sliding_window() and rolling_origin()?**

`rolling_origin()` defaults to an expanding training window: each split adds one more row to the analysis set. `sliding_window()` always uses a fixed-size training window because `lookback` is constant across iterations. They also use different argument vocabularies: `initial`, `assess`, `cumulative` for `rolling_origin()` versus `lookback`, `assess_start`, `assess_stop`, `step`, `complete` for `sliding_window()`. Pick `sliding_window()` when stable training size matters and `rolling_origin()` when more history is always better.

**Why does my sliding_window() return zero splits?**

The most common cause is `complete = TRUE` combined with a `lookback` or `assess_stop` larger than the data itself. If your data has 30 rows and you request `lookback = 50`, no iteration can fill the full analysis window, so the result is empty. Reduce `lookback`, reduce `assess_stop`, or set `complete = FALSE` to keep partial windows.

**Does sliding_window() work with calendar dates?**

It indexes by row position, not by date. Two rows one week apart and two rows one day apart both count as a single step. For calendar-aware sliding, switch to `sliding_index()` if your dates live in one column, or `sliding_period()` for bucket-by-month or bucket-by-week windows. Both accept the same arguments as `sliding_window()`.

**How do I make sliding_window() reproducible?**

`sliding_window()` is deterministic. It does not shuffle or sample at random, so identical inputs always produce identical splits and no `set.seed()` call is required. Randomness in a backtest pipeline usually enters through the model itself or through companion resamples like `bootstraps()`. Set seeds before those steps, not before `sliding_window()`.

**Can sliding_window() handle multiple time series in one data frame?**

Not directly. The function treats the data frame as one ordered sequence and does not segment by group. For panel data, nest the series with `tidyr::nest()` and apply `sliding_window()` per group via `purrr::map()`. For a shuffled alternative that ignores within-group time order, use `group_vfold_cv()`.
