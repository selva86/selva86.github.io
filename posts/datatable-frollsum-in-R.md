---
title: "data.table frollsum() in R: Fast Rolling Window Sums"
slug: datatable-frollsum-in-R
description: "Learn how data.table frollsum() in R computes fast rolling window sums. Covers syntax, multiple windows, na.rm, grouped rolling totals, and common pitfalls."
keywords: "data.table frollsum, frollsum function R, data.table frollsum examples, rolling sum R, R rolling window sum, frollsum vs frollmean"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: datatable-functions
fr_parent: data-table-vs-dplyr.html
auto_link_terms: "frollsum()|data.table frollsum|data.table::frollsum()|frollmean()|rolling sum"
auto_link_case_sensitive: true
target_keyword: "data.table frollsum"
sibling_block_enabled: true
difficulty: Beginner
---

# data.table frollsum() in R: Fast Rolling Window Sums

<p class="lead">data.table frollsum() computes a fast rolling sum over a sliding window, returning a trailing total for every element of a numeric vector. It is the C-optimized way to build moving totals, rolling counts, and windowed aggregates in R.</p>

[QUICK ANSWER]
frollsum(x, 3)                      # 3-element trailing sum
frollsum(x, c(3, 7))                # two windows at once
frollsum(x, 3, align = "center")    # centered window
frollsum(x, 3, na.rm = TRUE)        # skip NAs inside the window
frollsum(x, 3, fill = 0)            # fill incomplete windows with 0
dt[, s := frollsum(v, 3), by = grp] # rolling sum per group
frollsum(x, lens, adaptive = TRUE)  # per-element window sizes

[DECISION TREE: Is frollsum() the right tool?]
- rolling sum over a fixed window: frollsum(x, 3)
- rolling average instead of a total: frollmean(x, 3)
- running total from the very start: cumsum(x)
- lag or lead a column by k rows: shift(x, 1)
- rolling min, max or standard deviation: frollmax(x, 3)
- any custom function over a window: frollapply(x, 3, FUN)

## What frollsum() does

**frollsum() returns a rolling sum, not a single total.** For each position in a numeric vector it adds up the current value plus the preceding values that fall inside a window of width `n`. The output is the same length as the input, so it slots straight into a data.table column. It is written in C, which makes it far faster than a hand-rolled loop or `sapply()`.

## frollsum() syntax and arguments

**The signature is compact but every argument changes the window.** The core call is `frollsum(x, n)`.

```r title="frollsum function signature"
frollsum(x, n, fill = NA, algo = "fast",
         align = "right", na.rm = FALSE, adaptive = FALSE)
```

| Argument | Purpose |
|---|---|
| `x` | Numeric vector, or a list of vectors, to roll over. |
| `n` | Window width. A single integer, or a vector for several windows at once. |
| `fill` | Value placed where the window is incomplete (default `NA`). |
| `align` | Window position: `"right"` (trailing), `"left"` (leading), `"center"`. |
| `na.rm` | If `TRUE`, missing values are dropped inside each window. |
| `adaptive` | If `TRUE`, `n` is a per-element vector of window lengths. |

The first `n - 1` positions have no full window, so they receive `fill`. With the default `align = "right"`, the window ends on the current element, meaning each result includes the current row.

[KEY INSIGHT]
**The window includes the current row.** `frollsum(x, 3)` at position 5 sums elements 3, 4, and 5, not 2, 3, and 4. For a trailing total that excludes today, shift the input first with `shift(x, 1)`.

## frollsum() examples

**Start with a plain vector to see the sliding window.** Each result is the sum of the current value and the two before it.

```r title="Basic rolling sum"
library(data.table)

x <- 1:10
frollsum(x, 3)
#>  [1] NA NA  6  9 12 15 18 21 24 27
```

The first two slots are `NA` because a 3-wide window cannot fill yet. Position 3 is `1 + 2 + 3 = 6`.

**Pass several window widths in one call.** `frollsum()` then returns a list, one vector per window.

```r title="Multiple windows at once"
frollsum(x, c(2, 4))
#> [[1]]
#>  [1] NA  3  5  7  9 11 13 15 17 19
#>
#> [[2]]
#>  [1] NA NA NA 10 14 18 22 26 30 34
```

**Compute a rolling total per group inside a data.table.** Combine `frollsum()` with `by` and the walrus `:=` operator to add the column by reference.

```r title="Grouped rolling sum in data.table"
dt <- data.table(
  store = rep(c("A", "B"), each = 6),
  day   = rep(1:6, 2),
  sales = c(10, 20, 30, 40, 50, 60, 5, 15, 25, 35, 45, 55)
)
dt[, roll3 := frollsum(sales, 3), by = store]
dt[store == "A"]
#>    store day sales roll3
#> 1:     A   1    10    NA
#> 2:     A   2    20    NA
#> 3:     A   3    30    60
#> 4:     A   4    40    90
#> 5:     A   5    50   120
#> 6:     A   6    60   150
```

The `by = store` clause restarts the window at each store, so no total ever leaks across groups.

**Sum a 0/1 indicator to count events in a window.** This is the sum-specific trick `frollmean()` cannot do: a rolling count.

```r title="Rolling event count"
events <- c(0, 1, 1, 0, 1, 1, 1, 0)
frollsum(events, 4)
#> [1] NA NA NA  2  3  3  3  3
```

Position 4 reports 2 events in the last four days; position 5 reports 3.

## frollsum() vs frollmean and cumsum

**Pick the function by the shape of total you need.** All three aggregate, but over different spans.

| Function | Window | Returns |
|---|---|---|
| `frollsum(x, n)` | Fixed `n`-wide sliding window | Rolling total |
| `frollmean(x, n)` | Fixed `n`-wide sliding window | Rolling average |
| `cumsum(x)` | Expanding window from element 1 | Running total |

Use `frollsum()` when only the last `n` observations matter, such as a trailing 7-day revenue figure. Use `cumsum()` when every past value should keep contributing. Use `frollmean()` when you want the level rather than the total.

[NOTE]
**Coming from Python pandas?** The equivalent of `frollsum(x, 3)` is `series.rolling(3).sum()`. pandas defaults to a right-aligned window too, so the results line up directly.

## Common pitfalls

**A single NA wipes out the whole window.** With the default `na.rm = FALSE`, any missing value inside a window makes that result `NA`. Set `na.rm = TRUE` to skip it.

```r title="Handling missing values"
y <- c(1, 2, NA, 4, 5)
frollsum(y, 3)
#> [1] NA NA NA NA NA
frollsum(y, 3, na.rm = TRUE)
#> [1] NA NA  3  6  9
```

[WARNING]
**A window wider than the vector returns all NA.** `frollsum(1:3, 5)` yields `NA NA NA` because no window is ever complete. Check `length(x)` against `n` before rolling, especially inside `by` groups where some groups may be short.

Two more traps: forgetting `by` in a data.table mixes groups into one window, and assuming the window excludes the current row when `align = "right"` actually includes it.

## Try it yourself

**Try it:** Build a rolling 3-day sum of `daily` and store it in `ex_roll`. The first two values should be `NA`.

```r title="Your turn: rolling 3-day sum"
# Try it: rolling sum with window 3
daily <- c(4, 8, 6, 10, 2, 7)
ex_roll <- # your code here

ex_roll
#> Expected: NA NA 18 24 18 19
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
daily <- c(4, 8, 6, 10, 2, 7)
ex_roll <- frollsum(daily, 3)
ex_roll
#> [1] NA NA 18 24 18 19
```

**Explanation:** With `n = 3` the first two positions lack a full window and return `NA`. Position 3 sums `4 + 8 + 6 = 18`, and the window then slides one element at a time.

</details>

## Related data.table functions

- [frollmean()](datatable-frollmean-in-R.html) computes a rolling average over the same sliding window.
- `frollapply()` runs any custom function over a rolling window.
- [shift()](datatable-shift-in-R.html) lags or leads a column, useful for excluding the current row.
- `frollmax()` and `frollmin()` return rolling extremes.
- `cumsum()` gives an expanding running total instead of a fixed window.

See the official [rolling functions reference](https://rdatatable.gitlab.io/data.table/reference/froll.html) for the full argument list.

## FAQ

**What is the difference between frollsum and rollsum?**

`frollsum()` is the data.table function; `rollsum()` is from the zoo package. They compute the same rolling sum, but `frollsum()` is written in C, runs faster on large vectors, and supports multiple windows in one call. If you already use data.table, `frollsum()` avoids a second dependency and integrates cleanly with `:=` and `by`.

**How do I compute a rolling sum by group in R?**

Call `frollsum()` inside a data.table with the `by` argument: `dt[, total := frollsum(value, 3), by = group]`. The `by` clause restarts the window at each group boundary, so totals never leak from one group into the next. This is the standard pattern for per-store or per-customer rolling metrics.

**Why does frollsum return NA at the start?**

The first `n - 1` elements do not have enough preceding values to fill a window of width `n`, so `frollsum()` places the `fill` value there, which is `NA` by default. Pass `fill = 0` to use zero instead, or trim those rows if a partial window is meaningless for your analysis.

**Can frollsum use a variable window size?**

Yes. Set `adaptive = TRUE` and pass `n` as a vector the same length as `x`, where each element gives the window width for that position. This is useful when the window should grow over time or depend on another column, such as days-since-signup.

**Is frollsum faster than a for loop?**

Yes, substantially. `frollsum()` runs its sliding window in compiled C code, so it is typically orders of magnitude faster than an R `for` loop or `sapply()` on large vectors. For millions of rows the difference is the gap between milliseconds and seconds.
