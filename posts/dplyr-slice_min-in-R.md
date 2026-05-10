---
title: "dplyr slice_min() in R: Bottom N Rows by Column Value"
slug: "dplyr-slice_min-in-R"
description: "Use dplyr slice_min() to get the bottom n rows by a column value (per group). Covers n, prop, with_ties, .by, vs arrange + slice_head, and 5 examples."
keywords: "dplyr slice_min, R bottom n by value, slice_min per group, dplyr lowest rows, slice_min with_ties, bottom n by column R, dplyr smallest"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "slice_min()|dplyr slice_min|bottom n by value|lowest rows by group|earliest per group"
auto_link_case_sensitive: true
target_keyword: "dplyr slice_min"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr slice_min() in R: Bottom N Rows by Column Value

<p class="lead">The <code>slice_min()</code> function in dplyr returns the rows with the SMALLEST values of a specified column, optionally per group. It is the mirror of <code>slice_max()</code>.</p>

[QUICK ANSWER]
slice_min(df, mpg, n = 5)                   # 5 lowest by mpg
slice_min(df, mpg, prop = 0.1)              # bottom 10%
slice_min(df, mpg, n = 3, by = cyl)         # bottom 3 per cyl
slice_min(df, mpg, n = 3, with_ties = FALSE)# strict 3 (no ties)
slice_min(df, mpg, n = -3)                  # all but bottom 3
arrange(df, mpg) |> slice_head(n = 5)       # equivalent older form

[DECISION TREE: Is slice_min() the right tool?]
- bottom n by column value: slice_min(col, n = N)
- top n by column value: slice_max(col, n = N)
- bottom n PER GROUP: slice_min(col, n, by = g)
- bottom n by row order: slice_head(n = N)
- bottom n%: slice_min(col, prop = 0.1)
- random sample: slice_sample(n = N)
- handle ties strictly: with_ties = FALSE

## What slice_min() does in one sentence

**`slice_min(.data, order_by, n)` sorts by `order_by` ascending and returns the bottom `n` rows.** On a grouped tibble (or with `by = g`), it returns the bottom n per group.

This is the cleanest way to answer "bottom N by metric" questions, and the natural mirror of `slice_max()`.

## Syntax

**`slice_min(.data, order_by, n = NULL, prop = NULL, by = NULL, with_ties = TRUE, na_rm = FALSE)`.**

```r title="Bottom 5 cars by MPG"
library(dplyr)

mtcars |>
  slice_min(mpg, n = 5)
#>                       mpg cyl ...
#> Cadillac Fleetwood   10.4   8
#> Lincoln Continental  10.4   8
#> Camaro Z28           13.3   8
#> Duster 360           14.3   8
#> Chrysler Imperial    14.7   8
```

[TIP]
**`slice_min()` is more explicit than `arrange(x) |> head(n)`.** It says exactly what it does: "bottom n by x". Reach for it whenever you mean "lowest N by metric".

## Five common patterns

### 1. Bottom n by a column

```r title="3 lowest MPG cars"
mtcars |>
  slice_min(mpg, n = 3)
#> Cadillac Fleetwood   10.4
#> Lincoln Continental  10.4   <-- tie
#> Camaro Z28           13.3
```

By default, ties are included.

### 2. Bottom n per group

```r title="Lowest MPG car per cylinder count"
mtcars |>
  slice_min(mpg, n = 1, by = cyl)
#>                      mpg cyl
#> Volvo 142E          21.4   4
#> Merc 280C           17.8   6
#> Cadillac Fleetwood  10.4   8
```

`by = cyl` returns one row per cyl group.

### 3. Bottom fraction (prop)

```r title="Bottom 10% by MPG"
mtcars |>
  slice_min(mpg, prop = 0.1)
```

10% of 32 = 3 rows (or more with ties).

### 4. Strict bottom n (no ties)

```r title="Exactly 3 rows, drop ties arbitrarily"
mtcars |>
  slice_min(mpg, n = 3, with_ties = FALSE)
```

`with_ties = FALSE` returns exactly `n` rows; ties broken arbitrarily.

### 5. Earliest record per group

```r title="First event per user (chronological)"
events <- data.frame(
  user = c("a","a","b","b"),
  ts   = as.Date(c("2024-01-01","2024-03-15","2024-02-10","2024-04-20")),
  val  = c(10, 20, 30, 40)
)

events |>
  slice_min(ts, n = 1, by = user)
#>   user         ts val
#> 1    a 2024-01-01  10
#> 2    b 2024-02-10  30
```

The mirror of "latest per group": earliest event per user via slice_min on timestamp.

[KEY INSIGHT]
**`slice_min()` and `slice_max()` are exact mirrors.** Anything you can do with one, you can do with the other by reversing the column sign or swapping the function. They share argument names, defaults, and group behavior.

## slice_min() vs slice_max() vs arrange + slice_head vs base which.min

**Four ways to grab "bottom n" in R, with different ergonomics.**

| Function | Sorts | Per group | Output |
|---|---|---|---|
| `slice_min(col, n)` | Yes (asc) | Yes | n rows |
| `slice_max(col, n)` | Yes (desc) | Yes | n rows |
| `arrange(col) |> slice_head(n)` | Yes | Yes if grouped | n rows, sorted |
| `which.min(col)` | No | No | Single index |

When to use which:

- `slice_min` for bottom-n-by-metric in dplyr.
- `slice_max` for top-n-by-metric.
- `arrange + slice_head` if you need the sorted intermediate state.
- `which.min` for the single index of the minimum (base R, returns 1 element).

## A practical slice_min workflow

**Use slice_min for "worst N", "earliest N", or "cheapest N" patterns.**

Common variations:

- Worst 1 per group → `slice_min(metric, n = 1, by = g)`
- Earliest record per user → `slice_min(timestamp, n = 1, by = user)`
- Cheapest item per category → `slice_min(price, n = 1, by = category)`
- 10 worst-rated movies → `slice_min(rating, n = 10)`

The pattern parallels slice_max: pick the column, pick n, pick the group.

## Common pitfalls

**Pitfall 1: ties expand the result.** `slice_min(mpg, n = 3)` returns 4 rows if two share rank 3. Use `with_ties = FALSE` for strict n.

**Pitfall 2: NAs and ascending order.** With `na_rm = FALSE` (default), NAs sort last in ASC order, so they don't appear in `slice_min` output unless `n` is very large. Set `na_rm = TRUE` to be explicit.

[WARNING]
**`slice_min()` returns rows by ASCENDING column value; the original row order is NOT preserved.** Output may appear in different order than input. Chain with `arrange(col)` if you want sorted output explicitly.

## Try it yourself

**Try it:** Find the 2 cars with the lowest `qsec` (quarter-mile time) for each `cyl` group. Save to `ex_fast`.

```r title="Your turn: 2 fastest qsec per cyl"
ex_fast <- mtcars |>
  # your code here

ex_fast
#> Expected: 6 rows (2 per cyl group)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_fast <- mtcars |>
  slice_min(qsec, n = 2, by = cyl)
ex_fast
#> 6 rows: 2 lowest qsec per cyl group
```

**Explanation:** `slice_min(qsec, n = 2, by = cyl)` finds the 2 lowest qsec per cylinder group. Lower qsec = faster acceleration.

</details>

## Related slice functions

After mastering slice_min, look at:

- `slice_max()`: top n by column (mirror)
- `slice_head()` / `slice_tail()`: first/last n by row order
- `slice_sample()`: random n rows
- `slice()`: specific row indexes
- `arrange()`: sort the entire frame
- `which.min()` / `which.max()`: base R, returns single index

For symmetric "top + bottom" reports, combine `slice_max` and `slice_min` results with `bind_rows`.

## FAQ

**What is the difference between slice_min and slice_max?**

`slice_min` returns the LOWEST n rows by column value; `slice_max` returns the HIGHEST. Argument names and behavior are otherwise identical mirrors.

**How does slice_min handle ties?**

Default `with_ties = TRUE` includes all tied rows (may return more than n). Set `with_ties = FALSE` for exactly n rows, with ties broken arbitrarily.

**How do I get the bottom n per group?**

Pass `by = group_col` (dplyr 1.1+): `slice_min(df, col, n = 3, by = g)`. Or `df |> group_by(g) |> slice_min(col, n = 3) |> ungroup()`.

**How does slice_min handle NA values?**

With `na_rm = FALSE` (default), NAs sort to the END of ascending order, so they appear in slice_min output only if n is large enough. Set `na_rm = TRUE` to filter them.

**What is the difference between slice_min and which.min?**

`slice_min` is dplyr; returns N rows of a data frame. `which.min` is base R; returns a SINGLE INTEGER index of the row with the minimum value. Different output shapes for different use cases.
