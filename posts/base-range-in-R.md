---
title: "range() in R: Find Min and Max in One Call"
slug: "base-range-in-R"
description: "Use base R range() to return min and max in one call. Covers na.rm, multi-vector input, plot axis limits, dates, normalization, and 3 common pitfalls."
keywords: "range in R, R range function, base range R, range na.rm, R min and max, range vector R, R range dates"
mathjax: false
webr: true
date: "2026-05-23"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "base-r-essentials"
fr_parent: "Descriptive-Statistics-in-R.html"
auto_link_terms: "range()|base range|base::range()|min and max|R range function"
auto_link_case_sensitive: true
target_keyword: "range in R"
sibling_block_enabled: true
difficulty: "Beginner"
---

# range() in R: Find Min and Max in One Call

<p class="lead">The <code>range()</code> function in base R returns a length-2 vector containing the minimum and maximum of one or more numeric, character, or date inputs in a single call. It is the fastest way to get both bounds at once.</p>

[QUICK ANSWER]
range(x)                        # c(min, max)
range(x, na.rm = TRUE)          # ignore NA
range(x, y, z)                  # bounds across many vectors
diff(range(x))                  # spread (max - min)
range(as.Date(d))               # earliest and latest date
range(c("apple", "pear"))       # lexical min and max
plot(x, y, ylim = range(y))               # set axis limits

[DECISION TREE: Is range() the right tool?]
- need min and max together: range(x)
- need only the minimum: min(x)
- need only the maximum: max(x)
- need the spread (max - min): diff(range(x))
- need full summary (Q1, median, etc.): summary(x)
- need bounds across multiple vectors: range(x, y, z)
- need axis limits for plotting: range(y) feeds ylim

## What range() does in one sentence

**`range(x, na.rm = FALSE)` returns `c(min(x), max(x))` as a length-2 vector for any orderable input.** One call replaces two, which matters when you need both bounds for axis limits, normalization, or bin edges in a single line of code.

`range()` accepts numeric, integer, character (lexical order), logical, `Date`, and `POSIXct` inputs. It also accepts multiple arguments and pools them, so `range(x, y, z)` gives you the global minimum and maximum across all three vectors at once. The return type matches the input class, which makes `range()` safe to pipe into plotting and modelling functions without surprise coercion.

## Syntax

**`range(..., na.rm = FALSE, finite = FALSE)`. The `...` accepts one or more vectors of the same orderable type.**

```r title="Basic range on a numeric vector"
x <- c(4, 7, 2, 9, 1, 5)

range(x)
#> [1] 1 9

min(x); max(x)
#> [1] 1
#> [1] 9
```

The first element of the result is the minimum; the second is the maximum. Two arguments worth knowing beyond the input: `na.rm = TRUE` drops `NA` values before computing bounds, and `finite = TRUE` drops `NA`, `NaN`, `Inf`, and `-Inf`. Setting `finite = TRUE` implies `na.rm = TRUE`, so you only need one.

[TIP]
**Assign `range()` to a name to reuse the bounds.** `b <- range(x)` lets you write `b[1]` and `b[2]` later without recomputing. This is the idiomatic pattern for plot axis limits and rescaling. It also doubles the speedup over `min()` plus `max()`, since you scan the vector once and reuse the answer.

## Five common patterns

### 1. Both bounds at once

```r title="Replace two calls with one"
x <- c(15, 8, 23, 42, 11, 4)

bounds <- range(x)
bounds
#> [1]  4 42

bounds[1]   # min
#> [1] 4

bounds[2]   # max
#> [1] 42
```

This is the canonical use case: you want both numbers, and a single call is clearer than `c(min(x), max(x))`. The result is an ordinary numeric vector, so indexing with `[1]` and `[2]` extracts the bounds wherever you need them downstream.

### 2. Handling NA values

```r title="na.rm controls NA handling"
y <- c(3, NA, 7, 1, NA, 9)

range(y)
#> [1] NA NA

range(y, na.rm = TRUE)
#> [1] 1 9
```

By default `range()` propagates `NA`, returning `c(NA, NA)`. This is consistent with `min()` and `max()` and protects you from silently using corrupt bounds. Set `na.rm = TRUE` to compute bounds over the non-missing values only. In production code, always pass `na.rm = TRUE` explicitly so the intent is visible.

### 3. Bounds across multiple vectors

```r title="Pool inputs for a global range"
a <- c(1, 3, 5)
b <- c(2, 8, 4)
c <- c(7, 6, 9)

range(a, b, c)
#> [1] 1 9
```

Passing several vectors via `...` is the cleanest way to find global axis limits when comparing series on a shared plot. Internally, R scans the inputs once, avoiding the intermediate allocation of `range(c(a, b, c))`.

### 4. Spread with diff(range())

```r title="diff(range(x)) is the spread"
x <- c(10, 25, 4, 18, 30)

diff(range(x))
#> [1] 26

max(x) - min(x)
#> [1] 26
```

`diff(range(x))` and `max(x) - min(x)` give the same number. The `diff()` version is one fewer pass over the data; both are fine in practice. Note that the statistics term "range" usually means the spread (a single number), while R's `range()` function returns the endpoints. This naming mismatch is the most common source of confusion among new R users.

### 5. Range on dates

```r title="Earliest and latest dates"
d <- as.Date(c("2025-03-12", "2024-11-05", "2025-08-21", "2024-06-30"))

range(d)
#> [1] "2024-06-30" "2025-08-21"
```

`range()` works on `Date` and `POSIXct` because they are orderable. The result is the earliest and latest timestamp, which is the data-science default for time-series summaries. The same code applies to `POSIXct` timestamps; you do not need a special function for date-time data.

[KEY INSIGHT]
**`range()` is one function call, not two.** It traverses the vector once instead of twice; on a million-element vector that is roughly a 2x speedup over calling `min()` and `max()` separately. The difference is invisible in interactive use but matters in tight loops and column-wise summaries.

## range() vs min, max, summary, diff

**Four functions sit in the same neighbourhood as `range()`; each answers a slightly different question.** Pick by what you need to do next with the answer.

| Function | Returns | Use when |
|---|---|---|
| `range(x)` | `c(min, max)` length-2 vector | You need both bounds for axis limits, normalization, or bin edges |
| `min(x)` | Single value | You only need the lower bound |
| `max(x)` | Single value | You only need the upper bound |
| `diff(range(x))` | Single value | You need the spread (max - min) |
| `summary(x)` | 6-number summary | You need quartiles plus min and max |

For machine-learning normalization (`(x - min) / (max - min)`), `range()` is the natural choice because you use both numbers once. For exploratory analysis with quartiles, `summary()` is more informative. For peak detection, `which.max()` plus `which.min()` returns positions rather than values.

## Normalization with range()

**Min-max scaling rescales a numeric vector to the [0, 1] interval and `range()` makes it a one-liner.** This is the most common practical use of `range()` outside plotting.

```r title="Min-max normalization in one expression"
x <- c(15, 8, 23, 42, 11, 4)
b <- range(x)

x_scaled <- (x - b[1]) / (b[2] - b[1])
round(x_scaled, 3)
#> [1] 0.289 0.105 0.500 1.000 0.184 0.000
```

The smallest value maps to 0; the largest maps to 1; everything else falls between. Saving `range()` to `b` avoids two extra scans. For modeling pipelines, prefer `scale()` for z-score standardization, or `caret::preProcess(method = "range")` for a tidy interface.

## Range on character vectors

**`range()` orders strings lexically, the same as `sort()`.** That gives you the alphabetically first and last entries, which is rarely what you want for free-text but useful for IDs and categorical codes.

```r title="Character range is lexical"
codes <- c("B12", "A07", "C99", "B03")

range(codes)
#> [1] "A07" "C99"
```

The result follows the locale collation order. For numeric IDs stored as strings (`"100"`, `"99"`), lexical order will surprise you (`"99"` comes after `"100"`); convert to numeric first with `as.numeric()`.

## Common pitfalls

**Pitfall 1: forgetting na.rm.** Any `NA` in the input yields `c(NA, NA)`. Check with `anyNA(x)` and pass `na.rm = TRUE` to ignore missing values.

**Pitfall 2: empty input.** `range(numeric(0))` returns `c(Inf, -Inf)` with a warning. Guard with `if (length(x) > 0)` before calling.

[WARNING]
**`range()` on a data frame pools across all columns.** `range(df)` returns one pair of bounds, not bounds per column. For mixed-type frames, coercion may corrupt the result. Apply `range()` per column with `sapply(df, range)` or `purrr::map(df, range)`.

**Pitfall 3: Inf in real data.** If the vector contains `Inf` or `-Inf` (common after division by zero or floating-point overflow), `range()` returns them as the bounds. Use `range(x, finite = TRUE)` to exclude non-finite values.

## Range in plotting workflows

**Setting `xlim` and `ylim` with `range()` is the most common use of the function in practice.** Both base graphics and ggplot2 accept a length-2 vector for axis bounds, which is exactly what `range()` returns.

```r title="Use range() to align two plots on the same axis"
x <- 1:30
y1 <- cumsum(rnorm(30))
y2 <- cumsum(rnorm(30))

ylim <- range(y1, y2)

plot(x, y1, type = "l", ylim = ylim, col = "steelblue")
lines(x, y2, col = "tomato")
```

By pooling `y1` and `y2` into one `range()` call, both curves fit inside a shared axis. The same idea applies to faceted ggplot2 charts when you want a consistent y-axis across panels: compute `range()` over the full data and pass it to `coord_cartesian(ylim = ...)`. For histograms, `range()` feeds `breaks = seq(min, max, length.out = 21)` to produce equal-width bins across the data span.

## Try it yourself

**Try it:** Use `range()` to find the min and max of `mtcars$mpg`, then compute the spread. Save the bounds to `ex_bounds` and the spread to `ex_spread`.

```r title="Your turn: mpg bounds and spread"
ex_bounds <- # your code here
ex_spread <- # your code here

ex_bounds
ex_spread
#> Expected: c(10.4, 33.9) and 23.5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_bounds <- range(mtcars$mpg)
ex_spread <- diff(ex_bounds)

ex_bounds
#> [1] 10.4 33.9

ex_spread
#> [1] 23.5
```

**Explanation:** `range()` returns both bounds in one call. `diff()` on a length-2 vector subtracts the first element from the second, giving the spread. Same result as `max(mtcars$mpg) - min(mtcars$mpg)` but one fewer scan of the vector.

</details>

## Related base R functions

After mastering `range()`, look at:

- `min()`, `max()`: single-bound versions when you only need one end
- `summary()`: full 6-number summary including quartiles and the mean
- `quantile()`: arbitrary quantiles, not just the bounds
- `diff()`: pair with `range()` to compute the spread
- `pmin()`, `pmax()`: parallel min and max for vector-vs-vector comparison
- `which.min()`, `which.max()`: position of the min or max, not the value

For grouped bounds, `dplyr::summarise(across(x, list(min = min, max = max)))` gives a tidy output with one row per group. For column-wise bounds across a data frame, `sapply(df, range)` returns a 2-by-N matrix.

## FAQ

**What does the range() function return in R?**

`range()` returns a length-2 numeric (or character, or Date) vector. The first element is the minimum, the second is the maximum. So `range(c(4, 1, 7))` returns `c(1, 7)`. It is not a single number; if you need just the spread, wrap it in `diff()`. The class of the result matches the input, which makes `range()` safe to feed directly into plotting and modelling functions.

**How do I get the range as a single number in R?**

Use `diff(range(x))` or `max(x) - min(x)`. Both give the spread (max minus min). `range()` itself returns both bounds. Statistics calls this the range of the data, but R's `range()` function returns the endpoints, not their difference. The `diff(range(x))` form scans the vector once instead of twice.

**Why does range() return NA in R?**

If your vector contains any `NA` value and you do not set `na.rm = TRUE`, `range()` returns `c(NA, NA)` by default. Pass `na.rm = TRUE` to ignore missing values: `range(x, na.rm = TRUE)`. This behaviour is intentional; it forces you to acknowledge missing data. To check before calling, run `anyNA(x)`.

**Can range() handle dates in R?**

Yes. `range()` works on `Date` and `POSIXct` vectors because they have a defined order. `range(my_dates)` returns the earliest and latest date. The output is the same class as the input, so you can feed the result into `seq.Date()` or `xlim` for a time-series chart. Character dates need conversion first with `as.Date()`.

**Is range() faster than min() and max() separately?**

Yes, by roughly 2x on large numeric vectors. `range()` makes one pass through the data; calling `min()` and `max()` separately makes two. The difference is invisible on small data and meaningful on millions of elements. For specialized matrix operations, `matrixStats::rowRanges()` and `colRanges()` are even faster than `apply(m, 1, range)`.
