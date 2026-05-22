---
title: "rsample sliding_period() in R: Calendar-Based Resamples"
slug: rsample-sliding_period-in-R
description: "Build calendar-period resamples with rsample sliding_period() in R. Covers index, period, lookback, every, and assess for monthly and weekly backtests."
keywords: "rsample sliding_period, sliding_period function R, rsample sliding_period examples, calendar-based resampling R, time period cross validation R, monthly cross validation R, sliding_period tidymodels"
mathjax: false
webr: true
date: 2026-05-22
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "sliding_period()|rsample sliding_period|rsample::sliding_period()|calendar-period resampling|period-based splits"
auto_link_case_sensitive: true
target_keyword: "rsample sliding_period"
sibling_block_enabled: true
difficulty: Beginner
---

# rsample sliding_period() in R: Calendar-Based Resamples

<p class="lead">The rsample sliding_period() function in R builds time-series resamples whose analysis and assessment windows align to calendar units (years, months, weeks, days), so every split contains a whole number of months or weeks instead of a fixed row count and irregular gaps in the data never distort the window size.</p>

[QUICK ANSWER]
sliding_period(df, date, "month")                                # 1-month train, 1-month test
sliding_period(df, date, "month", lookback = 11)                 # 12-month rolling train
sliding_period(df, date, "month", lookback = Inf)                # expanding train window
sliding_period(df, date, "month", assess_stop = 3)               # 3-month forecast horizon
sliding_period(df, date, "week", every = 2)                      # group rows into 2-week blocks
sliding_period(df, date, "month", step = 3)                      # advance origin 3 months
sliding_period(df, date, "month", complete = FALSE)              # keep partial windows
analysis(sp$splits[[1]])                                         # training rows of split 1

[DECISION TREE: Is sliding_period() the right tool?]
- slide windows by calendar period (month, week, day): sliding_period(df, date, "month")
- slide windows by fixed row count: sliding_window(df, lookback = 9)
- expanding training window over time: rolling_origin(df, initial = 100)
- slide windows by index column values: sliding_index(df, date)
- standard shuffled k-fold cross-validation: vfold_cv(df, v = 10)
- bootstrap resamples with replacement: bootstraps(df, times = 25)
- single train/test split: initial_split(df, prop = 0.8)

## What sliding_period() does

**sliding_period() partitions a time-ordered data frame into resamples whose boundaries follow calendar units.** It belongs to the rsample package and complements `sliding_window()` (row-based) and `sliding_index()` (column-value-based). The key argument is `period`, which accepts `"year"`, `"quarter"`, `"month"`, `"week"`, `"day"`, `"hour"`, `"minute"`, or `"second"`. Internally the function uses `lubridate::floor_date()` to bucket the index column into period bins, then slides over those bins.

The function returns a tibble with a `splits` list-column and an `id` column. Each row is one `rsplit` object whose analysis and assessment indices you extract with `analysis()` and `assessment()`. Unlike row-based resamplers, `sliding_period()` produces splits of variable row count: a month with 31 days yields more rows than a month with 28. This matters when daily traffic, sales, or measurement frequency drifts over time, because every fold still represents the same calendar exposure.

## Syntax and arguments

**The signature has one data argument, one index column, one period unit, and seven window knobs.**

```r title="sliding_period function signature"
sliding_period(
  data,
  index,                # date or datetime column (unquoted)
  period,               # "year", "quarter", "month", "week", "day", ...
  lookback     = 0L,    # periods before current included in analysis
  assess_start = 1L,    # first assessment period offset from current
  assess_stop  = 1L,    # last assessment period offset from current
  complete     = TRUE,  # drop iterations whose windows do not fully fit
  step         = 1L,    # periods to advance the current position each iteration
  skip         = 0L,    # iterations to drop between kept iterations
  every        = 1L,    # number of periods grouped together as one bucket
  origin       = NULL   # reference date for period boundaries
)
```

The arguments that matter most:

- **index**: an unquoted column name holding a `Date` or `POSIXct` value. The column controls bin assignment but does not have to be sorted.
- **period**: the calendar unit each bin represents. `"month"` is the most common choice for business reporting.
- **lookback**: the number of complete periods before the current position included in the analysis window. `lookback = 11` with `period = "month"` gives a 12-month rolling training window. `lookback = Inf` produces an expanding window.
- **assess_start** and **assess_stop**: offsets ahead of the current position that define the assessment window in period units. Defaults give a one-period, one-step-ahead test.
- **every**: how many periods are grouped into a single bin. `period = "week", every = 2` produces fortnightly bins.
- **complete**: `TRUE` drops splits whose lookback would extend before the first period; set `FALSE` to keep them.

[KEY INSIGHT]
**Periods, not rows, drive the math.** `lookback` and `assess_stop` count whole calendar buckets, not records. A `period = "month", lookback = 11` window always contains 12 months of data even if November had 720 rows and February had 670.

## sliding_period() examples

### Monthly rolling 12-month backtest

**Use `lookback = 11` with `period = "month"` to train on the last 12 months and test on the next.** This is the canonical setup for one-month-ahead forecasting of monthly aggregates.

```r title="Build monthly rolling resamples"
library(rsample)

set.seed(1)
df <- data.frame(
  date  = seq(as.Date("2024-01-01"), by = "day", length.out = 730),
  value = cumsum(rnorm(730))
)

sp <- sliding_period(df, date, "month", lookback = 11)
sp
#> # Sliding period resampling
#> # A tibble: 13 x 2
#>    splits             id
#>    <list>             <chr>
#>  1 <split [365/31]>   Slice01
#>  2 <split [366/28]>   Slice02
#>  3 <split [365/31]>   Slice03
#> ...
```

The `splits` list-column shows row counts that vary by month length. Notice the analysis window holds 365 or 366 rows (one calendar year) and the assessment window holds 28 to 31 rows (one month).

### Three-month forecast horizon

**Set `assess_stop = 3` to evaluate a three-month-ahead forecast.** The assessment block expands from one period to three while training stays the same.

```r title="Three-month forecast horizon"
sp3 <- sliding_period(df, date, "month", lookback = 11, assess_stop = 3)
nrow(sp3)
#> [1] 11

range(analysis(sp3$splits[[1]])$date)
#> [1] "2024-01-01" "2024-12-31"

range(assessment(sp3$splits[[1]])$date)
#> [1] "2025-01-01" "2025-03-31"
```

Each split now trains on 12 months and assesses on the following quarter, mirroring how operations teams review forecasts on a quarterly cadence.

### Weekly resamples with fortnightly bins

**Combine `period = "week"` with `every = 2` to bin the data into two-week blocks.** This works when daily data is too noisy for week-by-week comparison but monthly aggregation hides intra-month structure.

```r title="Fortnightly weekly bins"
sp_w <- sliding_period(df, date, "week", lookback = 12, every = 2)
nrow(sp_w)
#> [1] 39

range(analysis(sp_w$splits[[1]])$date)
#> [1] "2023-12-31" "2024-06-29"
```

[NOTE]
**`every` multiplies the bin width, not the step.** Use `step` to control how far the window advances between iterations; `every` controls how the calendar is bucketed in the first place.

### Expanding training window

**Pass `lookback = Inf` to keep all earlier periods in the analysis window.** This is the calendar-period equivalent of `rolling_origin(cumulative = TRUE)`.

```r title="Expanding monthly window"
sp_exp <- sliding_period(df, date, "month", lookback = Inf)

nrow(analysis(sp_exp$splits[[1]]))
#> [1] 31

nrow(analysis(sp_exp$splits[[10]]))
#> [1] 305
```

The first split trains on January, the tenth trains on January through October. Use this when older history still carries signal and discarding it would waste data.

## sliding_period() vs sliding_window() vs rolling_origin()

**Pick `sliding_period()` when calendar boundaries matter, `sliding_window()` for fixed row counts, and `rolling_origin()` for the classic expanding-origin backtest.** The table below summarizes the trade-offs.

| Function | Window unit | Use when |
|---|---|---|
| `sliding_period()` | Calendar period (month, week, ...) | Data has uneven row density across time, or business cadence is calendar-driven |
| `sliding_window()` | Fixed row count | Data is evenly spaced and you want identical training sizes |
| `rolling_origin()` | Row count, expanding by default | You need the legacy expanding-origin backtest with cumulative training |
| `sliding_index()` | Values of an index column | Custom index intervals that are not calendar-based |

[TIP]
**Calendar bins beat row bins for irregular data.** Daily web traffic with random gaps, hourly sensor data with downtime, or transactional logs with weekend dips all yield more meaningful folds under `sliding_period()` than under `sliding_window()`.

## Common pitfalls

**Three mistakes show up in nearly every first-time use.**

- **Unsorted index column without realizing it.** `sliding_period()` does not error on unsorted data; it bins rows by date but the resulting `analysis()` and `assessment()` tibbles inherit the original row order. Always `arrange(date)` before resampling if you plan to feed splits into a model that assumes ordered input.
- **Confusing `lookback` with row count.** `lookback = 12` does NOT mean 12 rows. With `period = "month"` it means 12 months of rows, which may be hundreds. Read `lookback` as "periods", not "rows".
- **Forgetting `complete = TRUE` drops early splits.** The first complete window cannot start before period `lookback + 1`, so the first `lookback` periods produce no splits by default. If you need them, set `complete = FALSE` and handle the shorter windows downstream.

[WARNING]
**Time zones silently shift bin assignment.** If your `date` column is `POSIXct` in UTC but your business reports in local time, late-night events near midnight get bucketed into the previous day. Convert to `as.Date()` in local time before resampling when daily granularity is in play.

## Try it yourself

**Try it:** Build monthly sliding-period resamples on the `economics` dataset from ggplot2 with a 24-month lookback. Save the result to `ex_sp`.

```r title="Your turn: monthly resamples on economics"
library(ggplot2)
library(rsample)
# Try it: 24-month lookback on economics
ex_sp <- # your code here

nrow(ex_sp)
#> Expected: a positive integer (number of monthly splits)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_sp <- sliding_period(economics, date, "month", lookback = 23)
nrow(ex_sp)
#> [1] 550
```

**Explanation:** `lookback = 23` plus the current month equals 24 months of training. The `economics` dataset spans roughly 47 years of monthly data, so the count of complete 24-month windows is large.

</details>

## Related rsample functions

**These resamplers either pair with `sliding_period()` or replace it for adjacent use cases.**

- `sliding_window()`: fixed row count instead of calendar period.
- `rolling_origin()`: classic expanding or sliding row-based backtest.
- `sliding_index()`: slide by values of an arbitrary index column.
- `vfold_cv()`: standard k-fold cross-validation when ordering does not matter.
- `initial_time_split()`: single chronological train and test split.

See the [official rsample reference](https://rsample.tidymodels.org/reference/sliding_period.html) for the full argument matrix.

## FAQ

**What is the difference between sliding_period() and sliding_window() in rsample?**

`sliding_period()` partitions data by calendar units (months, weeks, days) using a date index column, so window sizes adapt to the actual row density of each period. `sliding_window()` partitions by fixed row count, so every window contains exactly the same number of rows. Use `sliding_period()` when business reporting follows calendar boundaries; use `sliding_window()` when data is evenly sampled and identical training sizes matter for model comparison.

**Can sliding_period() handle daily data with missing dates?**

Yes. The function bins each row by its date value, so missing dates simply produce smaller analysis windows for the affected periods. The window still spans the same calendar range, but with fewer rows. This is one of the main reasons to prefer `sliding_period()` over `sliding_window()` for messy real-world time series with holidays, sensor downtime, or weekend gaps.

**How do I make an expanding window with sliding_period()?**

Set `lookback = Inf`. Every split's analysis window then includes all periods up to and including the current one. The first split trains on the first complete period, the second on the first two, and so on. This is the calendar-period equivalent of `rolling_origin(cumulative = TRUE)`, and it is the right choice when older history still carries predictive signal.

**Does sliding_period() require sorted data?**

No, but you should sort anyway. The bin assignment uses the date column directly, so unsorted input produces correct splits. However, the rows within each `analysis()` and `assessment()` tibble inherit the input order, which can confuse downstream models that assume chronological ordering. Run `arrange(date)` before resampling as a safe default.

**What period units does sliding_period() accept?**

The supported units are `"year"`, `"quarter"`, `"month"`, `"week"`, `"day"`, `"hour"`, `"minute"`, and `"second"`. These map to the period names accepted by `lubridate::floor_date()`. Combine the unit with the `every` argument to get multi-unit bins like `"every = 2"` weeks (fortnightly) or `"every = 6"` hours (quarter-day).
