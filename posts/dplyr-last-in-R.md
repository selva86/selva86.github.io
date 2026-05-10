---
title: "dplyr last() in R: Get the Last Value of a Vector"
slug: "dplyr-last-in-R"
description: "Use dplyr last() to extract the last value of a vector with optional default in R. Covers last vs tail, order_by, default, NA handling, and 5 examples."
keywords: "dplyr last, R last value, last vs tail dplyr, dplyr last default, last order_by, R last per group, latest record"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "dplyr last()|last() function|last value vector|last per group|last vs tail"
auto_link_case_sensitive: true
target_keyword: "dplyr last"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr last() in R: Get the Last Value of a Vector

<p class="lead">The <code>last()</code> function in dplyr returns the LAST element of a vector, with optional <code>default</code> for empty input and <code>order_by</code> for sorting. It is the cleaner alternative to <code>x[length(x)]</code> inside dplyr pipelines.</p>

[QUICK ANSWER]
last(c(10, 20, 30))                  # 30
last(c())                             # default = NA
last(x, default = 0)                  # specify fallback
last(x, order_by = ts)                # latest by ts
df |> summarise(last_val = last(value))
df |> group_by(g) |> summarise(last_val = last(value, order_by = ts))

[DECISION TREE: Is last() the right tool?]
- last element of a vector: last(x)
- last n rows of a tibble: slice_tail(n) or tail()
- last by another column's order: last(x, order_by = col)
- per-group last: group_by + summarise(last(x))
- first element: first() (mirror)
- nth element: nth(x, n)
- latest non-NA: last(na.omit(x))

## What last() does in one sentence

**`last(x, default = NA, order_by = NULL)` returns the last element of `x`; on empty input it returns `default` instead of erroring.** With `order_by`, x is reordered by that vector before extracting the last position.

The dplyr-friendly version of `x[length(x)]`, with safer empty-input handling.

## Syntax

**`last(x, default = NA, order_by = NULL)`. Default is NA of x's type.**

```r title="Last value of a vector"
library(dplyr)

last(c(10, 20, 30))
#> [1] 30
```

[TIP]
**Use `last(x, order_by = ts)` for "latest by timestamp" semantics.** Without order_by, "last" is whatever happens to be physically last in the input.

## Five common patterns

### 1. Last element

```r title="Position length(x)"
last(c(10, 20, 30))
#> [1] 30
```

### 2. With a default

```r title="Empty input fallback"
last(numeric(0), default = 0)
#> [1] 0
```

### 3. Per-group last

```r title="Last value per user (in row order)"
df <- data.frame(
  user = c("a","a","a","b","b"),
  ts   = c(3, 1, 2, 5, 4),
  val  = c(10, 20, 30, 40, 50)
)

df |>
  group_by(user) |>
  summarise(last_val = last(val))
#> # A tibble: 2 x 2
#>   user  last_val
#>   a           30
#>   b           50
```

### 4. Last by another column's order

```r title="Latest by timestamp"
df |>
  group_by(user) |>
  summarise(latest = last(val, order_by = ts))
#> # A tibble: 2 x 2
#>   user  latest
#>   a         10   <-- val at ts=3 (the max ts)
#>   b         40   <-- val at ts=5
```

`order_by = ts` sorts by ts ascending; `last()` takes the position with the LARGEST ts.

### 5. Last non-NA

```r title="Most recent non-missing value"
x <- c(10, NA, 30, NA, NA)
last(na.omit(x))
#> [1] 30
```

[KEY INSIGHT]
**`last(x, order_by = ts)` is the dplyr idiom for "latest record".** Combined with group_by, it answers "what was each user's most recent X?" in one summarise step. Without order_by, "last" means physical row order, which is rarely what you want.

## last() vs tail() vs slice_tail() vs nth()

**Four "last element" functions in R, with different return shapes.**

| Function | Input | Output | Best for |
|---|---|---|---|
| `last(x)` | Vector | Scalar | dplyr summarise / mutate |
| `tail(x, 1)` | Vector | Length-1 vector | Quick base R |
| `tail(df, 1)` | Data frame | 1-row df | Last row of a frame |
| `slice_tail(df, n = 1)` | Data frame | 1-row tibble | dplyr; group-aware |
| `nth(x, -1)` | Vector | Scalar | Pick by negative index |

When to use which:

- `last(x)` for scalar output inside summarise.
- `slice_tail` for row-level extraction.
- `nth(x, -1)` is equivalent (negative index = from end).

## A practical workflow

**The "latest per group" pattern is last's killer use case.**

```r title="Latest visit and action per user"
df |>
  group_by(user) |>
  summarise(
    latest_visit  = last(timestamp, order_by = timestamp),
    latest_action = last(action,    order_by = timestamp),
    .groups       = "drop"
  )
```

Per user, the chronologically latest visit and action. Equivalent to `slice_max(timestamp, n = 1, by = user)` for getting the WHOLE row; last() is for scalar values inside summarise.

For multi-stat per-group with first AND last:

```r title="First seen and last seen per user"
df |>
  group_by(user) |>
  summarise(
    first_seen = first(ts, order_by = ts),
    last_seen  = last(ts,  order_by = ts),
    n_events   = n(),
    .groups    = "drop"
  )
```

## Common pitfalls

**Pitfall 1: order_by silent without sorting.** Without `order_by`, last() uses physical row order. The latest by timestamp might NOT be the physically last row.

**Pitfall 2: confusing last() with slice_tail().** last returns a scalar; slice_tail returns a tibble. Pick by what shape you need downstream.

[WARNING]
**`last()` is sensitive to input order in ways that are easy to overlook.** Always pass `order_by = sort_col` for time-series queries, even if you "just sorted" upstream: being explicit prevents bugs from later refactors.

## Why "latest per group" needs order_by

**`last()` without `order_by` returns whatever happens to be physically last in the input.** This is fine if your data is already sorted by time, but it is fragile: any upstream change that re-orders the rows silently changes the result. `last(val, order_by = ts)` is robust: dplyr explicitly sorts by ts before picking the last value. The cost is small (one sort per group); the benefit is that the result depends only on the data's semantics, not its loading order. In production pipelines, prefer the explicit form.

## Try it yourself

**Try it:** For each `cyl` group in mtcars, get the mpg of the LAST car (chronological by row order). Save to `ex_last`.

```r title="Your turn: last mpg per cyl"
ex_last <- mtcars |>
  # your code here

ex_last
#> Expected: 3 rows (one per cyl) with last_mpg
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_last <- mtcars |>
  group_by(cyl) |>
  summarise(last_mpg = last(mpg))

ex_last
#> # A tibble: 3 x 2
#>     cyl last_mpg
#>     4     21.4
#>     6     19.7
#>     8     15.0
```

**Explanation:** `last(mpg)` per cyl group returns the mpg of the last physical row in each group.

</details>

## Related dplyr functions

After mastering last, look at:

- `first()`: first value (mirror)
- `nth(x, k)`: arbitrary position; `nth(x, -1)` equals last(x)
- `slice_tail()` / `slice_head()`: row-level versions
- `tail()` / `head()`: base R
- `slice_max()` / `slice_min()`: top n by column value (often a cleaner equivalent)

For "latest record per group", `slice_max(timestamp, n = 1, by = group)` is often cleaner than last + summarise.

## FAQ

**What does last do in dplyr?**

`last(x)` returns the last element of a vector as a scalar. Inside summarise / mutate, with optional `default` for empty input and `order_by` for sorting.

**What is the difference between last() and tail() in R?**

`last(x)` returns a scalar. `tail(x, 1)` returns a length-1 vector. Different shape, same value. For data frames, `tail(df, 1)` returns a 1-row data frame; `last()` doesn't apply directly.

**How do I get the latest record per group with last()?**

`df |> group_by(g) |> summarise(latest = last(val, order_by = ts))`. Without `order_by`, last uses physical row order; with it, last picks the row with the maximum ts.

**How do I get the latest non-NA value with last()?**

`last(na.omit(x))` drops NAs first. Or `last(x, order_by = ts, default = NA)` if you want explicit handling.

**Should I use last() or slice_max()?**

`last()` returns a scalar inside summarise. `slice_max(col, n = 1)` returns the WHOLE ROW as a tibble. Pick based on what you need downstream.
