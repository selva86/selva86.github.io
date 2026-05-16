---
title: "data.table frollmean() in R: Fast Rolling Window Means"
slug: datatable-frollmean-in-R
description: "Learn data.table frollmean() in R to compute fast rolling window means. Covers window size, alignment, na.rm, adaptive windows, and grouped rolling means."
keywords: "data.table frollmean, frollmean function R, data.table frollmean examples, R rolling mean, rolling average R, frollmean adaptive, data.table rolling window"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: datatable-functions
fr_parent: data-table-vs-dplyr.html
auto_link_terms: "frollmean()|data.table frollmean|data.table::frollmean()|frollmean|data.table rolling mean"
auto_link_case_sensitive: true
target_keyword: "data.table frollmean"
sibling_block_enabled: true
difficulty: Beginner
---

# data.table frollmean() in R: Fast Rolling Window Means

<p class="lead">The data.table <code>frollmean()</code> function computes fast rolling (moving) window means over a numeric vector. It is a compiled, multi-threaded alternative to <code>zoo::rollmean()</code> and is the standard way to smooth time series or build moving averages inside a data.table.</p>

[QUICK ANSWER]
frollmean(x, 3)                        # 3-row trailing mean
frollmean(x, c(3, 7))                  # several windows at once
frollmean(x, 3, align = "center")      # centered window
frollmean(x, 3, align = "left")        # leading window
frollmean(x, 5, na.rm = TRUE)          # skip NAs inside window
frollmean(x, 3, fill = 0)              # pad edges with 0 not NA
frollmean(x, n, adaptive = TRUE)       # per-row window length
dt[, mu := frollmean(v, 7), by = id]   # rolling mean per group

[DECISION TREE: Is frollmean() the right tool?]
- rolling average over a window: frollmean(x, 7)
- rolling total instead of average: frollsum(x, 7)
- rolling max, min or sd: frollmax / frollmin / frollsd
- custom rolling stat like median: frollapply(x, 7, median)
- cumulative expanding mean: cumsum(x) / seq_along(x)
- lag or lead a column by k rows: shift(x, 7)

## What frollmean() does

**frollmean() slides a fixed window across a vector and returns the mean of each window.** For a window size of `n`, the value at position `i` is the average of the `n` values ending at `i`. The result is a vector the same length as the input, so it drops straight into a data.table column.

Because the rolling computation is written in C and runs on multiple threads, `frollmean()` is dramatically faster than looping or than `zoo::rollmean()` on large vectors. It is the rolling-window workhorse of the data.table package.

The first `n - 1` positions have no full window, so they are filled with `NA` by default. This is expected behaviour, not a bug.

## frollmean() syntax and arguments

**The function signature exposes seven arguments, but most calls use only the first two.** You pass a numeric vector and a window size, and everything else has a sensible default.

```r title="frollmean function signature"
frollmean(x, n, fill = NA, algo = "fast",
          align = "right", na.rm = FALSE,
          hasNA = NA, adaptive = FALSE)
```

The arguments control input, window size, and edge behaviour:

| Argument | Purpose |
|---|---|
| `x` | Numeric vector, or a list of vectors, to roll over. |
| `n` | Window size. A vector of sizes returns one result per size. |
| `fill` | Value used for the incomplete leading or trailing positions. Defaults to `NA`. |
| `align` | Window placement: `"right"`, `"left"`, or `"center"`. |
| `na.rm` | If `TRUE`, missing values are dropped inside each window. |
| `algo` | `"fast"` (default) or `"exact"` for higher floating-point accuracy. |
| `adaptive` | If `TRUE`, `n` is a per-row vector of window lengths. |

[NOTE]
**Coming from another package?** `frollmean(x, n)` is the data.table equivalent of `zoo::rollmean(x, n, fill = NA, align = "right")` and of pandas' `series.rolling(n).mean()`.

## frollmean() examples

**These examples use the built-in `airquality` dataset so you can run them without any setup.** Each one targets a different real use case for rolling means.

A basic call computes a trailing average. Here a 3-day rolling mean smooths the daily temperature readings.

```r title="Compute a basic rolling mean"
library(data.table)
dt <- as.data.table(airquality)
dt[, temp_roll3 := frollmean(Temp, 3)]
head(dt[, .(Temp, temp_roll3)], 6)
#>     Temp temp_roll3
#>    <int>      <num>
#> 1:    67         NA
#> 2:    72         NA
#> 3:    74   71.00000
#> 4:    62   69.33333
#> 5:    56   64.00000
#> 6:    66   61.33333
```

Passing a vector to `n` returns several rolling means in one call. The output is a list with one element per window size, which is efficient because the windows are computed in parallel.

```r title="Compute several window sizes at once"
windows <- frollmean(dt$Temp, c(3, 7))
str(windows)
#> List of 2
#>  $ : num [1:153] NA NA 71 69.3 64 ...
#>  $ : num [1:153] NA NA NA NA NA ...
windows[[2]][7:9]
#> [1] 66.00000 64.85714 63.28571
```

The `align` argument decides where the window sits relative to the current row. A right-aligned window looks backward, a left-aligned window looks forward, and a centered window straddles the row.

```r title="Change the window alignment"
x <- 1:10
data.table(
  x,
  right  = frollmean(x, 3),
  center = frollmean(x, 3, align = "center"),
  left   = frollmean(x, 3, align = "left")
)
#>         x right center  left
#>     <int> <num>  <num> <num>
#>  1:     1    NA     NA     2
#>  2:     2    NA      2     3
#>  3:     3     2      3     4
#> ...
#> 10:    10     9     NA    NA
```

Inside a data.table, combine `frollmean()` with `by` to roll within each group. Without `by`, the window bleeds across group boundaries and corrupts the first rows of every group.

```r title="Roll the mean within each group"
sales <- data.table(
  store = rep(c("A", "B"), each = 4),
  units = c(10, 20, 30, 40, 100, 200, 300, 400)
)
sales[, roll2 := frollmean(units, 2), by = store]
sales
#>     store units roll2
#>    <char> <num> <num>
#> 1:      A    10    NA
#> 2:      A    20    15
#> 3:      A    30    25
#> 4:      A    40    35
#> 5:      B   100    NA
#> 6:      B   200   150
#> 7:      B   300   250
#> 8:      B   400   350
```

Real data has gaps, and `na.rm = TRUE` keeps the rolling mean alive across them. With it, each window averages only its non-missing values instead of returning `NA`.

```r title="Handle missing values with na.rm"
oz <- frollmean(airquality$Ozone, 5, na.rm = TRUE)
head(oz, 7)
#> [1]       NA       NA       NA       NA 26.75000 23.50000 20.25000
```

[KEY INSIGHT]
**A rolling mean trades detail for trend.** Widening `n` produces a smoother line that reacts slowly, while a narrow window tracks every spike. Choose the window to match the cycle you want to see, not the noise you want to hide.

## frollmean() vs other rolling tools

**frollmean() is one member of a family, and picking the right relative saves you a wrapper.** The `froll*` functions share the same arguments, so switching between a rolling mean and a rolling sum is a one-word change.

| Tool | Use it when |
|---|---|
| `frollmean(x, n)` | You need a moving average over a fixed window. |
| `frollsum(x, n)` | You need a rolling total instead of an average. |
| `frollapply(x, n, FUN)` | You need a custom statistic, such as a rolling median. |
| `zoo::rollmean(x, n)` | You already depend on zoo and the data is small. |
| `cumsum(x) / seq_along(x)` | You want an expanding (cumulative) mean, not a fixed window. |

For an adaptive window, pass a per-row vector of lengths and set `adaptive = TRUE`. This is useful for year-to-date or "since launch" averages where the window grows over time.

```r title="Use an adaptive per-row window"
x <- c(10, 20, 30, 40, 50)
n <- c(1, 2, 3, 3, 3)
frollmean(x, n, adaptive = TRUE)
#> [1] 10 15 20 30 40
```

## Common pitfalls

**Most frollmean() surprises trace back to edges, groups, or floating-point math.** These three mistakes account for almost every confused bug report.

Forgetting that leading positions are `NA` breaks downstream code that expects a complete column. Pad them with `fill` when a default value is safer than a gap.

```r title="Pad the leading edge with fill"
frollmean(1:6, 3, fill = 0)
#> [1] 0 0 2 3 4 5
```

Calling `frollmean()` on a grouped column without `by` lets the window span two groups, so the first rows of each group mix in foreign data. Always add `by =` for panel or multi-series tables.

For long vectors where precision matters, `algo = "fast"` can accumulate tiny floating-point drift. Switch to `algo = "exact"` for a slower but numerically stable result.

[WARNING]
**A window wider than the vector returns all NA.** `frollmean(1:3, 5)` has no complete window, so every position is `NA`. Check that `n` is not larger than the data, especially inside small groups.

## Try it yourself

**Try it:** Compute a 4-period rolling mean of `mtcars$mpg` and store it in `ex_roll`. The first three values should be `NA`.

```r title="Your turn: roll mtcars mpg"
# Try it: 4-period rolling mean of mpg
ex_roll <- # your code here

head(ex_roll, 5)
#> Expected: NA NA NA <value> <value>
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
library(data.table)
ex_roll <- frollmean(mtcars$mpg, 4)
head(ex_roll, 5)
#> [1]      NA      NA      NA 20.1000 20.7250
```

**Explanation:** `frollmean()` with `n = 4` averages each value with the three before it. The first three positions have no full 4-row window, so they return `NA`.

</details>

## Related data.table functions

These functions pair naturally with `frollmean()` for rolling and windowed work:

- `frollsum()` computes rolling totals with the same arguments.
- `frollapply()` applies any function over a rolling window.
- `shift()` lags or leads a column, often used before a rolling step.
- `frank()` assigns fast ranks, useful for rolling percentile logic.

See the official [data.table rolling functions reference](https://rdatatable.gitlab.io/data.table/reference/froll.html) for the complete `froll*` family.

## FAQ

**What is the difference between frollmean and rollmean?**

Both compute a rolling mean, but `frollmean()` is part of data.table and is written in multi-threaded C, while `rollmean()` comes from the zoo package. On large vectors `frollmean()` is far faster and integrates directly into data.table syntax. `rollmean()` defaults to a centered window, whereas `frollmean()` defaults to a right-aligned (trailing) window.

**Why does frollmean return NA at the start?**

The first `n - 1` positions do not have enough preceding values to fill a complete window, so `frollmean()` returns `NA` there by default. This is correct behaviour. Use the `fill` argument to substitute another value, or set `align = "center"` or `"left"` to move the gap to a different edge.

**How do I compute a rolling mean by group in data.table?**

Add a `by` clause: `dt[, roll := frollmean(value, 7), by = group]`. The `by` argument restarts the window at each group boundary, so a 7-row rolling mean never mixes values from two groups. Without `by`, the window slides continuously across the whole column.

**Can frollmean handle a variable window size?**

Yes. Set `adaptive = TRUE` and pass `n` as a vector the same length as `x`, where each element gives the window length for that row. This supports expanding windows, year-to-date averages, and any case where the window grows or shrinks per observation.

**Is frollmean faster than a for loop?**

Significantly. `frollmean()` runs compiled C code across multiple CPU threads, while an R-level loop interprets each iteration. On vectors of a million rows the difference is often two or three orders of magnitude, which is the main reason to reach for `frollmean()` over hand-written rolling code.
