---
title: "dplyr slice_tail() in R: Take the Last N Rows (Per Group)"
slug: "dplyr-slice_tail-in-R"
description: "Use dplyr slice_tail() to take the last n rows of a tibble (or per group) in R. Covers n, prop, .by, vs base tail(), grouped behavior, and 5 examples."
keywords: "dplyr slice_tail, R last n rows, slice_tail per group, dplyr bottom rows, slice_tail vs tail, dplyr slice_tail .by"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "slice_tail()|dplyr slice_tail|last n rows|tail rows by group|latest per group"
auto_link_case_sensitive: true
target_keyword: "dplyr slice_tail"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr slice_tail() in R: Take the Last N Rows (Per Group)

<p class="lead">The <code>slice_tail()</code> function in dplyr returns the LAST n (or fraction) rows of a data frame, optionally per group. It is the dplyr-pipe-friendly replacement for base R <code>tail()</code>.</p>

[QUICK ANSWER]
slice_tail(df, n = 5)                       # last 5 rows
slice_tail(df, prop = 0.1)                  # last 10% of rows
df |> group_by(g) |> slice_tail(n = 3)      # 3 per group from end
slice_tail(df, n = 3, by = cyl)             # per group via .by (dplyr 1.1+)
df |> arrange(x) |> slice_tail(n = 5)       # largest by x (after sort)
tail(df, 5)                                 # base R alternative

[DECISION TREE: Is slice_tail() the right tool?]
- last n rows of a tibble: slice_tail(n = N)
- last n rows PER GROUP: group_by + slice_tail, or slice_tail(.by = g)
- top n by column value: slice_max() (semantically cleaner)
- bottom n by column value: slice_min()
- random sample: slice_sample(n = N)
- specific row indexes: slice(c(1,3,5))
- first n rows: slice_head(n = N)

## What slice_tail() does in one sentence

**`slice_tail(.data, n = X)` keeps the last X rows of a tibble; on a grouped tibble it keeps the last X per group.** Use `prop = 0.1` instead of `n` to take a fraction.

This is dplyr's pipe-friendly answer to `tail()`. The big advantage: it respects `group_by()` automatically and integrates cleanly with the rest of the dplyr verb set.

## Syntax

**`slice_tail(.data, n = NULL, prop = NULL, by = NULL)`. Pass `n` OR `prop`, not both.**

```r title="Last 5 rows"
library(dplyr)

mtcars |>
  slice_tail(n = 5)
#>                  mpg cyl ...
#> Lotus Europa    30.4   4
#> Ford Pantera L  15.8   8
#> Ferrari Dino    19.7   6
#> Maserati Bora   15.0   8
#> Volvo 142E      21.4   4
```

[TIP]
**On a grouped tibble, `slice_tail(n = 3)` returns 3 rows PER GROUP.** Three groups means 9 rows total, not 3. Ungroup first if you want a global tail.

## Five common patterns

### 1. Last n rows of an ungrouped data frame

```r title="Bottom 10"
mtcars |>
  slice_tail(n = 10)
```

Equivalent to `tail(mtcars, 10)`, but pipeline-friendly.

### 2. Last n rows per group

```r title="Last 3 per cylinder count"
mtcars |>
  group_by(cyl) |>
  slice_tail(n = 3) |>
  ungroup()
```

Returns 3 rows per cyl group (9 total).

### 3. Use .by for one-step grouping

```r title="No group_by needed"
mtcars |>
  slice_tail(n = 3, by = cyl)
```

`by = cyl` scopes grouping to this verb only.

### 4. Last fraction with prop

```r title="Last 10% of rows"
mtcars |>
  slice_tail(prop = 0.1)
```

Returns ~3 rows (10% of 32).

### 5. Latest record per group (sorted timeline)

```r title="Most recent observation per group"
events <- data.frame(
  user = c("a","a","b","b"),
  ts   = c(1, 5, 2, 9),
  val  = c(10, 20, 30, 40)
)

events |>
  arrange(ts) |>
  group_by(user) |>
  slice_tail(n = 1) |>
  ungroup()
#>   user ts val
#> 1    a  5  20
#> 2    b  9  40
```

A common time-series idiom: get the latest event per user.

[KEY INSIGHT]
**`slice_tail()` cares about ROW ORDER, not value rank.** "Last n rows" means physically last in the current sort. To get "highest n values", use `slice_max()` instead: it sorts internally and is semantically clearer for ranking.

## slice_tail() vs tail() vs slice_max() vs slice_sample()

**Four R functions for "rows from the end" or "extreme values".**

| Function | Returns | Per group? | Best for |
|---|---|---|---|
| `slice_tail(n)` | Last n rows (positional) | Yes | dplyr pipelines |
| `base::tail(n)` | Last n rows | No | Quick interactive use |
| `slice_max(col, n)` | Top n by column value | Yes | "Top n by metric" |
| `slice_sample(n)` | Random n rows | Yes | Random sampling |

When to use which:

- `slice_tail` when row order is meaningful (e.g., latest in chronological order after `arrange()`).
- `slice_max` when you want "top N by metric" without sorting first.
- `tail` for quick base-R inspection.
- `slice_sample` for randomness.

## A practical workflow

**The classic "latest per group" pattern uses arrange + group_by + slice_tail.**

```r title="Latest record per group"
df |>
  arrange(timestamp) |>
  group_by(group_var) |>
  slice_tail(n = 1) |>
  ungroup()
```

This returns the most recent record per group. Equivalent: `slice_max(timestamp, n = 1, by = group_var)` for newer dplyr.

## Common pitfalls

**Pitfall 1: per-group surprise.** `mtcars |> group_by(cyl) |> slice_tail(n = 5)` returns 15 rows. Always ungroup downstream if you assumed a global tail.

**Pitfall 2: implicit row order.** `slice_tail` returns whatever rows happen to be last in current order. If the data is unsorted, the "tail" is arbitrary. Always `arrange()` first when order matters.

[WARNING]
**On grouped tibbles, the per-group tail count is independent of group size.** A group with only 2 rows will return both even if you asked for `n = 5`. No warning is issued.

## Try it yourself

**Try it:** Get the 2 cars with the HIGHEST `mpg` per `cyl` group using slice_tail. Save to `ex_top_mpg`.

```r title="Your turn: top 2 mpg per cyl via slice_tail"
ex_top_mpg <- mtcars |>
  # your code here

ex_top_mpg
#> Expected: 6 rows (2 per cyl group)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_top_mpg <- mtcars |>
  group_by(cyl) |>
  arrange(mpg) |>
  slice_tail(n = 2) |>
  ungroup()

# Or equivalently:
ex_top_mpg <- mtcars |>
  slice_max(mpg, n = 2, by = cyl)
```

**Explanation:** `arrange(mpg)` sorts ascending; `slice_tail(n = 2)` per group picks the 2 highest. `slice_max(mpg, n = 2)` does both internally.

</details>

## Related slice functions

After mastering slice_tail, look at:

- `slice_head()`: first n rows (per group)
- `slice_max()` / `slice_min()`: top/bottom n by column value
- `slice_sample()`: random n rows
- `slice()`: specific positional rows
- `last()`: last value of a vector (not data frame)
- `tail()`: base R alternative

For "latest record per group", `slice_max(timestamp, n = 1, by = group)` is the cleanest pattern in modern dplyr.

## FAQ

**What is the difference between slice_tail and tail in R?**

`tail(df, n)` is base R: returns last n rows of the WHOLE frame, ignores grouping. `slice_tail(df, n)` is dplyr: respects `group_by()` and works inside pipelines.

**How do I get the last n rows per group in dplyr?**

`df |> group_by(g) |> slice_tail(n = 3)` returns the last 3 rows per group. Or `slice_tail(df, n = 3, by = g)` in dplyr 1.1+.

**What is the difference between slice_tail and slice_max?**

`slice_tail(n)` returns the LAST n rows in current order. `slice_max(col, n)` returns the n highest BY a column value (sorts internally). Use slice_max when ranking is the criterion.

**How do I get the latest record per group?**

Sort by timestamp, group, take the tail of size 1: `df |> arrange(ts) |> group_by(g) |> slice_tail(n = 1)`. Or directly: `slice_max(df, ts, n = 1, by = g)`.

**Why did I get more rows than I asked for?**

Because the data frame was grouped. `slice_tail(n = 5)` on a grouped df returns 5 rows PER GROUP. Ungroup first if you want 5 total.
