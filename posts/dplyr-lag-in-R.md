---
title: "dplyr lag() in R: Look at the Previous Row's Value"
slug: "dplyr-lag-in-R"
description: "Use dplyr lag() to access the previous row's value in a column for time-series differencing in R. Covers n, default, order_by, lead mirror, 5 examples."
keywords: "dplyr lag, R lag function, lag vs lead dplyr, R previous row value, dplyr time series shift, lag default, lag order_by"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "lag()|dplyr lag|previous row value|lag vs lead|order_by lag"
auto_link_case_sensitive: true
target_keyword: "dplyr lag"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr lag() in R: Look at the Previous Row's Value

<p class="lead">The <code>lag()</code> function in dplyr returns the value from the row N positions BEFORE the current row, padding with <code>NA</code> at the start. It is the mirror of <code>lead()</code> and the standard tool for "previous-row" comparisons.</p>

[QUICK ANSWER]
lag(x)                            # previous value (n=1)
lag(x, n = 2)                     # 2 rows back
lag(x, default = 0)               # fill start with 0 instead of NA
lag(x, order_by = ts)             # respect timestamp order
df |> mutate(prev_val = lag(value))
df |> group_by(g) |> mutate(prev_val = lag(value))
diff(x)                           # quick first-differences (length n-1)

[DECISION TREE: Is lag() the right tool?]
- previous row's value: lag()
- next row's value: lead() (mirror)
- N rows back: lag(x, n = N)
- difference from previous: x - lag(x)
- per-group lag: group_by + lag
- ordered by another column: lag(x, order_by = col)
- compare to first row: x - first(x) (use first instead)

## What lag() does in one sentence

**`lag(x, n = 1, default = NA)` returns a vector where each position holds the value `n` rows BEFORE the current position; the first n positions are filled with `default`.** It is the natural complement to `lead()`.

The most common use case: time-series differencing, "change from previous period" calculations.

## Syntax

**`lag(x, n = 1, default = NA, order_by = NULL)`. n is the lag amount; default fills the leading NA slots.**

```r title="Previous row's value"
library(dplyr)

x <- c(10, 20, 30, 40, 50)
lag(x)
#> [1] NA 10 20 30 40
```

[TIP]
**`x - lag(x)` is the canonical first-difference idiom in dplyr.** It computes "change from previous row" while keeping the data frame's length intact (the first row gets NA).

## Five common patterns

### 1. Previous-row value

```r title="What was the value last time?"
x <- c(10, 20, 30, 40, 50)
lag(x)
#> [1] NA 10 20 30 40
```

### 2. First-difference (period-over-period change)

```r title="Daily change in sales"
df <- data.frame(day = 1:5, sales = c(100, 120, 110, 140, 130))

df |>
  mutate(change = sales - lag(sales))
#>   day sales change
#> 1   1   100     NA
#> 2   2   120     20
#> 3   3   110    -10
#> 4   4   140     30
#> 5   5   130    -10
```

The first row has NA because there is no previous period.

### 3. Percentage change

```r title="Daily % change"
df |>
  mutate(pct_change = (sales - lag(sales)) / lag(sales) * 100)
```

Standard finance / sales metric.

### 4. Per-group lag

```r title="Reset at each group boundary"
df <- data.frame(
  user = c("a","a","a","b","b"),
  val  = c(10, 20, 30, 100, 200)
)

df |>
  group_by(user) |>
  mutate(prev_val = lag(val))
#> # A tibble: 5 x 3
#>   user  val prev_val
#>   a      10       NA
#>   a      20       10
#>   a      30       20
#>   b     100       NA
#>   b     200      100
```

Each user's first row has NA because there is no previous row within the group.

### 5. Lag with a custom default

```r title="Use 0 instead of NA at the start"
lag(x, default = 0)
#> [1]  0 10 20 30 40
```

Useful when you want the first row's "previous" to be a baseline instead of NA.

[KEY INSIGHT]
**Always `arrange()` the data BEFORE using lag.** lag is purely positional. "Previous row" only makes sense if rows are sorted by time (or another meaningful order). Without sorting, lag returns whatever happens to be the previous physical row, which may be meaningless.

## lag() vs lead() vs diff()

**Three approaches to "change between rows" in R.**

| Function | Output length | Best for |
|---|---|---|
| `lag(x)` | Same as x | dplyr pipelines; per-group |
| `lead(x)` | Same as x | "Next row" comparisons |
| `diff(x)` | n-1 | Quick differencing; not pipeline-friendly |
| `data.table::shift(x)` | Same | Very fast for big data |

When to use which:

- `lag` for dplyr pipelines and per-group differencing.
- `lead` for forward-looking comparisons.
- `diff` for one-shot vector operations (loses one element).

## A practical workflow

**The "period-over-period change" pattern is the most common lag use case.**

```r title="Daily return per symbol"
df |>
  arrange(date) |>
  group_by(symbol) |>
  mutate(
    daily_return = (price - lag(price)) / lag(price)
  ) |>
  ungroup()
```

For each symbol's chronological prices, compute daily return. Without lag, this would require a self-join.

For multi-period changes:

```r title="Multi-horizon changes"
df |>
  arrange(date) |>
  mutate(
    change_1d  = price - lag(price, 1),
    change_7d  = price - lag(price, 7),
    change_30d = price - lag(price, 30)
  )
```

`n = 7` and `n = 30` give weekly and monthly changes.

## Common pitfalls

**Pitfall 1: forgetting to arrange.** lag is positional. Without `arrange(date_col)`, "previous row" is whatever happened to be loaded first.

**Pitfall 2: per-group surprise.** On grouped tibbles, lag resets at each group's start. The first row of every group has NA. Often desired but sometimes a bug source.

[WARNING]
**Default `default` is NA, which propagates through arithmetic.** `x - lag(x)` returns NA at the first row. Use `default = 0` or filter NAs downstream if you need a numeric result.

## Why lag matters for time-series in dplyr

**Without lag, computing changes across rows requires self-joins or manual indexing, both of which break the dplyr pipeline.** lag turns "change since yesterday" or "compare to previous quarter" into a single mutate call. For per-group computation (each user, each symbol, each region), pair lag with group_by and arrange. The combination is so common that financial, marketing, and operational analytics all rely on it. Once you internalize the pattern, time-series transforms in R feel as natural as in SQL window functions.

## Try it yourself

**Try it:** Compute the day-over-day percentage change in `mtcars$mpg` (treating row order as time order). Save to `ex_pct`.

```r title="Your turn: row-over-row pct change"
mtcars_mini <- head(mtcars[, c("mpg")], 5)

ex_pct <- # your code here

ex_pct
#> Expected: c(NA, 0, 8.57, -6.14, -12.62) approximately
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mpg_vec <- head(mtcars$mpg, 5)
ex_pct  <- (mpg_vec - lag(mpg_vec)) / lag(mpg_vec) * 100

ex_pct
#> [1]        NA  0.000000  8.571429 -6.140351 -12.616822
```

**Explanation:** First row is NA (no previous). Subsequent rows show pct change from the previous mpg value.

</details>

## Related dplyr functions

After mastering lag, look at:

- `lead()`: next row's value (mirror)
- `first()`, `last()`, `nth()`: pick specific positions
- `cumsum()`, `cummean()`, etc: cumulative aggregates
- `group_by()`: per-group window operations
- `arrange()`: sort before lag/lead
- `slider::slide_dbl()`: rolling-window operations

For multi-period lags or rolling differences, `slider::slide_dbl()` generalizes the pattern.

## FAQ

**What does lag do in dplyr?**

`lag(x, n = 1)` returns a vector where each position holds the value n rows BEFORE the current position. The first n positions are filled with NA (or `default`).

**What is the difference between lag and lead in dplyr?**

`lag(x)` looks at the PREVIOUS row. `lead(x)` looks at the NEXT row. Mirror operations.

**How do I compute first-differences with lag?**

`x - lag(x)` gives the change from the previous row to the current. The first position is NA because there is no previous row.

**Why does my lag result have NAs at the start?**

Because there is no row before the first position. lag defaults `default = NA` for those slots. Set `default = 0` or another value to avoid NA.

**How do I lag within groups?**

`df |> group_by(g) |> mutate(prev = lag(x))`. group_by makes lag reset at each group boundary; the first row per group has NA.
