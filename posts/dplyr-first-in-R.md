---
title: "dplyr first() in R: Get the First Value of a Vector"
slug: "dplyr-first-in-R"
description: "Use dplyr first() to extract the first value of a vector with optional default in R. Covers first vs head, order_by, default arg, NA handling, 5 examples."
keywords: "dplyr first, R first value, first vs head dplyr, dplyr first default, first order_by, R first per group, first non-NA"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "dplyr first()|first() function|first value vector|first per group|first vs head"
auto_link_case_sensitive: true
target_keyword: "dplyr first"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr first() in R: Get the First Value of a Vector

<p class="lead">The <code>first()</code> function in dplyr returns the FIRST element of a vector, with optional <code>default</code> for empty input and <code>order_by</code> for sorting. It is the cleaner alternative to <code>x[1]</code> inside dplyr pipelines.</p>

[QUICK ANSWER]
first(c(10, 20, 30))                  # 10
first(c())                             # default = NA
first(x, default = 0)                  # specify fallback
first(x, order_by = ts)                # first by ts column
df |> summarise(first_val = first(value))
df |> group_by(g) |> summarise(first_val = first(value))

[DECISION TREE: Is first() the right tool?]
- first element of a vector: first(x)
- first n rows of a tibble: slice_head(n) or head()
- first non-NA value: coalesce(x[!is.na(x)])[1] or first(na.omit(x))
- first by another column's order: first(x, order_by = col)
- per-group first: group_by + summarise(first(x))
- last element: last() (mirror)
- nth element: nth(x, n)

## What first() does in one sentence

**`first(x, default = NA, order_by = NULL)` returns the first element of `x`; on empty input it returns `default` instead of erroring.** With `order_by`, x is reordered by that vector before extracting position 1.

The dplyr-friendly version of `x[1]`. Returns a scalar, integrates with summarise / mutate, and handles the empty-input edge case gracefully.

## Syntax

**`first(x, default = NA, order_by = NULL)`. Default is NA of x's type.**

```r title="First value of a vector"
library(dplyr)

first(c(10, 20, 30))
#> [1] 10

first(integer(0))
#> [1] NA
```

[TIP]
**`first()` returns a SCALAR; `slice_head()` returns a tibble.** Use `first()` inside summarise / mutate where you want a single value; use slice_head for row-level filtering.

## Five common patterns

### 1. First element

```r title="Position 1"
first(c(10, 20, 30))
#> [1] 10
```

### 2. With a custom default

```r title="What if vector is empty?"
first(integer(0), default = 0)
#> [1] 0

first(c(), default = "unknown")
#> [1] "unknown"
```

### 3. Per-group first

```r title="First value per group inside summarise"
df <- data.frame(
  user = c("a","a","a","b","b"),
  ts   = c(3, 1, 2, 5, 4),
  val  = c(10, 20, 30, 40, 50)
)

df |>
  group_by(user) |>
  summarise(first_val = first(val))
#> # A tibble: 2 x 2
#>   user  first_val
#>   a            10
#>   b            40
```

By default, "first" means the first row order. To get chronological first, use `order_by`.

### 4. First by another column's order

```r title="Earliest by timestamp per user"
df |>
  group_by(user) |>
  summarise(first_val = first(val, order_by = ts))
#> # A tibble: 2 x 2
#>   user  first_val
#>   a            20   <-- val at ts=1
#>   b            50   <-- val at ts=4
```

`order_by = ts` sorts by ts before picking position 1.

### 5. First non-NA

```r title="Skip leading NAs"
x <- c(NA, NA, 30, NA, 50)
first(na.omit(x))
#> [1] 30

# Or via coalesce:
coalesce(x[1], x[2], x[3], x[4], x[5])
#> [1] 30
```

`first(na.omit(x))` returns the first non-NA value.

[KEY INSIGHT]
**`first()` and `last()` are scalar-returning equivalents of `slice_head(1)` and `slice_tail(1)`.** Use first/last inside summarise; use slice_head/slice_tail when you want the row as a tibble. Different return shapes, similar intent.

## first() vs head() vs slice_head() vs nth()

**Four ways to get "first" elements in R, with different return shapes.**

| Function | Input | Output | Best for |
|---|---|---|---|
| `first(x)` | Vector | Scalar | dplyr summarise/mutate |
| `head(x, 1)` | Vector | Length-1 vector | Quick base R |
| `head(df, 1)` | Data frame | 1-row df | First row of a frame |
| `slice_head(df, n = 1)` | Data frame | 1-row tibble | dplyr; group-aware |
| `nth(x, 1)` | Vector | Scalar | Pick by index, generalizes |

When to use which:

- `first(x)` for scalar output inside summarise.
- `slice_head` for row-level extraction.
- `nth(x, k)` for arbitrary positions.
- `head` for quick base R.

## A practical workflow

**Use first() for the "first event per user" pattern alongside group_by.**

```r title="First event chronologically per user"
df |>
  group_by(user) |>
  summarise(
    first_visit  = first(timestamp, order_by = timestamp),
    first_action = first(action,    order_by = timestamp),
    .groups      = "drop"
  )
```

Per user, get the chronologically first visit and action. order_by = timestamp ensures correct order regardless of input row order.

## Common pitfalls

**Pitfall 1: confusing first() with slice_head().** first returns a scalar; slice_head returns a tibble. Different shapes. Inside summarise, use first; inside mutate to keep multiple rows, use slice_head.

**Pitfall 2: order_by silent if data is unsorted.** Without `order_by`, first uses physical row order. If your data isn't sorted, "first" is whatever happened to be loaded first.

[WARNING]
**`first()` returns NA on empty input by default.** If your downstream code can't handle NA, set `default` explicitly: `first(x, default = 0)`.

## Why first/last beat x[1] inside dplyr

**Inside summarise() and mutate(), `first(x)` is preferred over `x[1]` for two reasons.** First, it handles the empty-input case gracefully: `first(integer(0))` returns NA instead of erroring; `integer(0)[1]` returns NA but with a warning in some configurations. Second, it accepts an `order_by` argument, so you can express "first chronologically" without an explicit arrange step. For pure speed, `x[1]` is slightly faster, but the readability and safety wins of `first()` make it the right default in pipeline code. For interactive sketching `x[1]` is fine.

## Try it yourself

**Try it:** For each `cyl` group in mtcars, get the mpg of the first car (in row order). Save to `ex_first`.

```r title="Your turn: first mpg per cyl"
ex_first <- mtcars |>
  # your code here

ex_first
#> Expected: 3 rows (one per cyl) with first_mpg
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_first <- mtcars |>
  group_by(cyl) |>
  summarise(first_mpg = first(mpg))

ex_first
#> # A tibble: 3 x 2
#>     cyl first_mpg
#>     4     22.8
#>     6     21.0
#>     8     18.7
```

**Explanation:** `first(mpg)` per cyl group returns the mpg of the first row in each group (in original row order).

</details>

## Related dplyr functions

After mastering first, look at:

- `last()`: last value (mirror)
- `nth(x, k)`: arbitrary position
- `slice_head()` / `slice_tail()`: row-level versions
- `head()` / `tail()`: base R; data-frame friendly
- `coalesce()`: first non-NA across vectors
- `na.omit()`: drop NAs before first()

For "first non-NA", `first(na.omit(x))` is the cleanest pattern.

## FAQ

**What does first do in dplyr?**

`first(x)` returns the first element of a vector as a scalar. Used inside summarise / mutate, with optional `default` for empty input and `order_by` for sorting.

**What is the difference between first() and head() in R?**

`first(x)` returns a scalar (single value). `head(x, 1)` returns a length-1 vector. They differ in shape, not semantics. For data frames, `head(df, 1)` returns a 1-row data frame; `first()` doesn't apply directly.

**How do I get the first non-NA value in dplyr?**

`first(na.omit(x))` drops NAs first, then takes position 1. Or `coalesce(x[1], x[2], ...)` for explicit fallback.

**How do I use order_by in first()?**

`first(x, order_by = ts)` sorts x by the corresponding ts values, then takes the first. Useful for "earliest event" queries when input rows aren't sorted.

**How do I get the first value per group?**

`df |> group_by(g) |> summarise(first_val = first(x))`. Add `order_by = ts` to specify sort order within group.
