---
title: "dplyr lead() in R: Look at the Next Row's Value"
slug: "dplyr-lead-in-R"
description: "Use dplyr lead() to access the next row's value in a column for time-series differencing in R. Covers n, default, order_by, lag mirror, and 5 examples."
keywords: "dplyr lead, R lead function, lead vs lag dplyr, R next row value, dplyr time series shift, lead default, lead order_by"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "lead()|dplyr lead|next row value|lead vs lag|order_by lead"
auto_link_case_sensitive: true
target_keyword: "dplyr lead"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr lead() in R: Look at the Next Row's Value

<p class="lead">The <code>lead()</code> function in dplyr returns the value from the row N positions AFTER the current row, padding with <code>NA</code> at the end. It is the mirror of <code>lag()</code> and the standard tool for "next-row" comparisons.</p>

[QUICK ANSWER]
lead(x)                            # next value (n=1)
lead(x, n = 2)                     # 2 ahead
lead(x, default = 0)               # fill end with 0 instead of NA
lead(x, order_by = ts)             # respect timestamp order
df |> mutate(next_val = lead(value))
df |> group_by(g) |> mutate(next_val = lead(value))
lag(x)                             # mirror: previous value

[DECISION TREE: Is lead() the right tool?]
- next row's value (1 ahead): lead()
- previous row's value: lag() (mirror)
- N rows ahead: lead(x, n = N)
- previous - current difference: x - lag(x)
- next - current difference: lead(x) - x
- per-group lead: group_by + lead
- ordered by another column: lead(x, order_by = col)

## What lead() does in one sentence

**`lead(x, n = 1, default = NA)` returns a vector where each position holds the value `n` rows AFTER the current position; positions past the end are filled with `default`.** It is the natural complement to `lag()`.

Used for time-series differencing, transition detection, and "what's next" calculations.

## Syntax

**`lead(x, n = 1, default = NA, order_by = NULL)`. n is the lead amount; default fills the trailing NA slots.**

```r title="Next row's value"
library(dplyr)

x <- c(10, 20, 30, 40, 50)
lead(x)
#> [1] 20 30 40 50 NA
```

[TIP]
**Use `lead()` and `lag()` whenever you need to compare consecutive rows.** Together they handle "before" and "after" comparisons cleanly without manual indexing.

## Five common patterns

### 1. Next-row value

```r title="What is the next observation?"
x <- c(10, 20, 30, 40, 50)
lead(x)
#> [1] 20 30 40 50 NA
```

### 2. Differences (forward-looking)

```r title="Change to next row"
df <- data.frame(day = 1:5, sales = c(100, 120, 110, 140, 130))

df |>
  mutate(diff_next = lead(sales) - sales)
#>   day sales diff_next
#> 1   1   100        20
#> 2   2   120       -10
#> 3   3   110        30
#> 4   4   140       -10
#> 5   5   130        NA
```

### 3. n rows ahead

```r title="2-step lookahead"
lead(x, n = 2)
#> [1] 30 40 50 NA NA
```

The last 2 positions become NA (default).

### 4. Custom default

```r title="Carry-forward fill instead of NA"
lead(x, default = 0)
#> [1] 20 30 40 50  0
```

### 5. Per-group lead

```r title="Reset at each group boundary"
df <- data.frame(
  user = c("a","a","a","b","b"),
  val  = c(10, 20, 30, 100, 200)
)

df |>
  group_by(user) |>
  mutate(next_val = lead(val))
#> # A tibble: 5 x 3
#>   user  val next_val
#>   a      10       20
#>   a      20       30
#>   a      30       NA
#>   b     100      200
#>   b     200       NA
```

[KEY INSIGHT]
**Always sort the data BEFORE applying lead/lag.** They are positional, so meaningful "next" depends on row order. Use `arrange(time)` (or `lead(x, order_by = time)`) to be explicit.

## lead() vs lag() vs diff() vs shift

**Four ways to access neighboring values in R.**

| Function | Direction | Output | Best for |
|---|---|---|---|
| `lead(x)` | Next row | Same length, NA at end | "What is next?" |
| `lag(x)` | Previous row | Same length, NA at start | "What was before?" |
| `diff(x)` | Difference | Length n-1 | Quick differencing |
| `data.table::shift(x)` | Either direction | Same length | data.table speed |

When to use which:

- `lead`/`lag` for dplyr pipelines and per-group window operations.
- `diff(x)` for `c(NA, x[-1] - x[-length(x)])` style differencing.
- `data.table::shift` for very large data and high-performance code.

## A practical workflow

**The most common lead pattern is forward differencing or transition detection.**

```r title="Time to next event per user"
df |>
  arrange(timestamp) |>
  group_by(user) |>
  mutate(
    next_event_at = lead(timestamp),
    gap_to_next   = as.numeric(next_event_at - timestamp, units = "secs")
  ) |>
  ungroup()
```

For each event, compute time to the next event. Sorted, grouped, lead handles the lookup.

For transition detection, compare adjacent values:

```r title="Detect state transitions"
df |>
  arrange(time) |>
  mutate(transition = lead(state) != state)
```

Marks rows where the next state differs from the current.

## Common pitfalls

**Pitfall 1: forgetting to arrange.** lead is purely positional. If the data isn't sorted, "next row" is meaningless. Always `arrange(time_col)` first.

**Pitfall 2: per-group surprise.** On a grouped tibble, lead resets at each group boundary. The LAST row of each group has NA. Often desired but sometimes surprising.

[WARNING]
**Default `default` is NA, which propagates through arithmetic.** `lead(x) - x` gives NA in the last row. Set `default = 0` (or another sentinel) if you need a non-NA value at the trailing edge.

## Why lead and lag together cover most window needs

**Most "look across rows" questions fall into two categories: backward (lag) or forward (lead).** A pair of these functions, combined with arrange, group_by, and arithmetic, covers period-over-period change, transition detection, rolling differences, and gap calculation. For more complex windows like "average of last 7 days", you outgrow lag/lead and reach for the slider package. For most everyday time-series and longitudinal analyses though, lag and lead are sufficient. They are stable, well-tested, and produce predictable per-group behavior.

## Try it yourself

**Try it:** For chronological log entries, compute the time gap until the next event for each row. Save to `ex_gaps`.

```r title="Your turn: time to next event"
df <- data.frame(
  time = as.POSIXct(c("2024-01-01 09:00","2024-01-01 09:15",
                       "2024-01-01 10:00","2024-01-01 11:30")),
  user = c("a","a","a","a")
)

ex_gaps <- df |>
  # your code here

ex_gaps$gap_min
#> Expected: c(15, 45, 90, NA)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_gaps <- df |>
  arrange(time) |>
  mutate(gap_min = as.numeric(lead(time) - time, units = "mins"))

ex_gaps$gap_min
#> [1] 15 45 90 NA
```

**Explanation:** `lead(time) - time` gives the difftime to the next event. Convert to minutes via `as.numeric(..., units = "mins")`. Last row is NA because there is no "next".

</details>

## Related dplyr functions

After mastering lead, look at:

- `lag()`: previous row's value (mirror)
- `cumsum()`, `cummean()`, etc: cumulative aggregates
- `group_by()`: per-group window operations
- `arrange()`: sort before lead/lag
- `data.table::shift()`: equivalent in data.table
- `slider::slide_dbl()`: rolling-window operations

For multi-position lookups in one call, `slider::slide_dbl(x, identity, .before = 0, .after = 5)` returns a vector of next-5-values per row.

## FAQ

**What does lead do in dplyr?**

`lead(x, n = 1)` returns a vector where each position holds the value n rows AHEAD of the current position. Positions past the end are filled with NA (or `default`).

**What is the difference between lead and lag in dplyr?**

`lead(x)` looks at the NEXT row. `lag(x)` looks at the PREVIOUS row. Mirror operations; identical arguments otherwise.

**How do I compute a forward difference with lead?**

`lead(x) - x` gives the change from current to next row. The last position is NA because there is no "next".

**Why does my lead result have NAs at the end?**

Because there is no row after the last position. lead defaults `default = NA` for those slots. Set `default = 0` or another value to avoid NA.

**How do I lead within groups?**

`df |> group_by(g) |> mutate(next_val = lead(x))`. group_by makes lead reset at each group boundary; the last row per group has NA.
