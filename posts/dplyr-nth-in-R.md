---
title: "dplyr nth() in R: Get the Nth Value of a Vector"
slug: "dplyr-nth-in-R"
description: "Use dplyr nth() to get the value at any position in a vector with optional default in R. Covers nth vs first/last, negative index, order_by, 5 examples."
keywords: "dplyr nth, R nth value, nth vs first last, dplyr nth negative, nth order_by, R element by index, nth_element"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "dplyr nth()|nth() function|nth value vector|nth per group|nth vs first"
auto_link_case_sensitive: true
target_keyword: "dplyr nth"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr nth() in R: Get the Nth Value of a Vector

<p class="lead">The <code>nth()</code> function in dplyr returns the value at position <code>n</code> of a vector. Negative <code>n</code> counts from the end. It generalizes <code>first()</code> and <code>last()</code> for arbitrary positions.</p>

[QUICK ANSWER]
nth(c(10, 20, 30, 40), 2)             # 20 (2nd element)
nth(c(10, 20, 30, 40), -1)            # 40 (last; same as last(x))
nth(c(10, 20, 30, 40), 1)             # 10 (first; same as first(x))
nth(c(10, 20, 30, 40), 5)             # NA (out of bounds)
nth(x, 2, default = 0)                # default for out-of-bounds
nth(x, 2, order_by = ts)               # 2nd by ts column

[DECISION TREE: Is nth() the right tool?]
- pick a specific position: nth(x, n)
- first element: first(x) (clearer for n=1)
- last element: last(x) (clearer for n=length)
- nth from the end: nth(x, -k)
- arbitrary index by sort order: nth(x, n, order_by = col)
- per-group nth: group_by + summarise(nth(x, n))
- multiple positions: x[c(2, 5, 9)]

## What nth() does in one sentence

**`nth(x, n, default = NA, order_by = NULL)` returns the element at position `n` of `x`; positive `n` counts from the start, negative from the end.** Out-of-bounds positions return `default` instead of erroring.

The general-purpose "pick by index" function. `first` and `last` are special cases of nth (n = 1 and n = -1).

## Syntax

**`nth(x, n, default = NA, order_by = NULL)`. n is positive (from start) or negative (from end).**

```r title="Get the 3rd element"
library(dplyr)

x <- c(10, 20, 30, 40, 50)
nth(x, 3)
#> [1] 30
```

[TIP]
**Use `nth(x, k)` for arbitrary positions; reserve `first()` and `last()` for the specific cases of n = 1 and n = -1.** They are equivalent but the specialized names are clearer.

## Five common patterns

### 1. Pick by position

```r title="3rd element"
nth(c(10, 20, 30, 40, 50), 3)
#> [1] 30
```

### 2. Negative index (from the end)

```r title="Second-to-last element"
nth(c(10, 20, 30, 40, 50), -2)
#> [1] 40
```

`-1` is last, `-2` is second-to-last, and so on.

### 3. Out-of-bounds with default

```r title="What if n exceeds length?"
nth(c(10, 20, 30), 5, default = 0)
#> [1] 0
```

Without `default`, nth returns NA.

### 4. nth by another column's order

```r title="2nd-earliest event per user"
df <- data.frame(
  user = c("a","a","a","b","b","b"),
  ts   = c(3, 1, 2, 5, 4, 6),
  val  = c(10, 20, 30, 40, 50, 60)
)

df |>
  group_by(user) |>
  summarise(second_earliest = nth(val, 2, order_by = ts))
#> # A tibble: 2 x 2
#>   user  second_earliest
#>   a                  30   <-- val at ts=2 (2nd lowest ts)
#>   b                  40   <-- val at ts=5
```

### 5. Per-group nth

```r title="3rd visit per user"
df |>
  group_by(user) |>
  summarise(third_visit = nth(val, 3, order_by = ts))
```

[KEY INSIGHT]
**`nth(x, k)` generalizes positional access; `first(x)` is `nth(x, 1)` and `last(x)` is `nth(x, -1)`.** Use the specialized names for clarity in those cases. Use nth when k is dynamic or positions other than first/last are needed.

## nth() vs first() vs last() vs x[n]

**Four ways to access positional elements in R.**

| Approach | Out-of-bounds | Order-aware | Best for |
|---|---|---|---|
| `nth(x, k)` | Returns default | Yes (order_by) | dplyr summarise / mutate |
| `first(x)` | Returns default | Yes | First specifically |
| `last(x)` | Returns default | Yes | Last specifically |
| `x[k]` | Returns NA | No | Quick base R |
| `head(x, k)` | Returns shorter vector | No | First k as vector |

When to use which:

- `nth(x, k)` for safe positional access in dplyr.
- `first` / `last` for n = 1 / n = -1 (clearer).
- `x[k]` for quick, no-checks indexing.

## A practical workflow

**Use nth() inside summarise to extract specific positions per group.**

```r title="First, second, last event per user"
df |>
  group_by(user) |>
  arrange(ts) |>
  summarise(
    first_event   = nth(action, 1),
    second_event  = nth(action, 2),
    last_event    = nth(action, -1),
    .groups       = "drop"
  )
```

Per user, the 1st, 2nd, and last action. nth handles out-of-bounds gracefully (NA when the user has only 1 event).

## Common pitfalls

**Pitfall 1: forgetting that nth uses 1-based indexing.** `nth(x, 0)` returns NA (out of bounds in R). Use `nth(x, 1)` for the first element.

**Pitfall 2: not specifying default.** `nth(x, 100, default = 0)` returns 0 if x has fewer than 100 elements. Without `default`, nth returns NA, which may break downstream type-strict code.

[WARNING]
**`nth(x, n)` returns a SCALAR.** For multiple positions like nth element 2, 5, 9 simultaneously, use base R indexing: `x[c(2, 5, 9)]`.

## When nth beats first/last

**Most "pick by position" needs are first or last; reach for nth for second-element, second-to-last, or programmatic position.** A common case is "what was the user's THIRD action?" or "what is the second-to-most-recent measurement?". With first or last you would have to filter then take first; nth does it in one call. Negative indices (nth(x, -1) = last, nth(x, -2) = second-from-end) are particularly handy for time-series queries where you want the recent past without computing length first.

## Try it yourself

**Try it:** For each `cyl` group in mtcars, get the mpg of the 2nd row (in original order). Save to `ex_second_mpg`.

```r title="Your turn: 2nd mpg per cyl"
ex_second_mpg <- mtcars |>
  # your code here

ex_second_mpg
#> Expected: 3 rows (one per cyl) with second_mpg
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_second_mpg <- mtcars |>
  group_by(cyl) |>
  summarise(second_mpg = nth(mpg, 2))

ex_second_mpg
#> # A tibble: 3 x 2
#>     cyl second_mpg
#>     4       24.4
#>     6       21.0
#>     8       18.7
```

**Explanation:** `nth(mpg, 2)` per cyl group returns the 2nd row's mpg in each group.

</details>

## Related dplyr functions

After mastering nth, look at:

- `first()`: shortcut for n = 1
- `last()`: shortcut for n = -1
- `slice()`: row-level positional access
- `head()` / `tail()`: first / last k as vectors
- `pull()`: extract a column as a vector

For multi-position pulls, `x[c(2, 5, 9)]` (base R indexing) is more direct than chaining nth.

## FAQ

**What does nth do in dplyr?**

`nth(x, n)` returns the value at position n of a vector as a scalar. Positive n counts from the start; negative n counts from the end.

**What is the difference between nth, first, and last?**

`first(x)` is `nth(x, 1)`. `last(x)` is `nth(x, -1)`. nth generalizes for arbitrary positions.

**How do I handle out-of-bounds with nth?**

Set `default`: `nth(x, 10, default = NA_real_)`. nth returns the default if n exceeds the vector length.

**How do I use order_by in nth?**

`nth(x, n, order_by = ts)` sorts x by ts first, then picks the element at position n. Useful for "Nth earliest" / "Nth latest" queries.

**Can I use negative indexing with nth?**

Yes. `nth(x, -1)` is the last element. `nth(x, -2)` is the second-to-last. Negative counts from the end.
