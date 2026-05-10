---
title: "dplyr tally() in R: Count Rows Quickly After group_by"
slug: "dplyr-tally-in-R"
description: "Use dplyr tally() to count rows per group as a shortcut for summarise(n = n()) in R. Covers tally vs count, weighted tally, sort, and 5 worked examples."
keywords: "dplyr tally, R count rows per group, tally vs count dplyr, dplyr summarise n n, tally sort, weighted tally R, dplyr row count"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "tally()|dplyr tally|count rows|tally vs count|summarise n"
auto_link_case_sensitive: true
target_keyword: "dplyr tally"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr tally() in R: Count Rows Quickly After group_by

<p class="lead">The <code>tally()</code> function in dplyr is a shortcut for <code>summarise(n = n())</code>. On a grouped tibble it returns one row per group with the count; ungrouped, it returns a single row with the total.</p>

[QUICK ANSWER]
df |> group_by(g) |> tally()                 # n per group
df |> tally()                                 # total row count
df |> group_by(g) |> tally(sort = TRUE)       # sort desc by n
df |> group_by(g) |> tally(name = "rows")     # rename count column
df |> group_by(g) |> tally(wt = price)        # weighted: sum(price)
df |> count(g)                                # equivalent: shorter
df |> summarise(n = n())                      # explicit form

[DECISION TREE: tally vs count vs summarise?]
- already grouped, need a count: tally()
- not grouped yet, count by columns: count()
- want a custom aggregation (mean, sum): summarise()
- weighted count: tally(wt = w) or count(wt = w)
- sorted by frequency: tally(sort = TRUE) or count(sort = TRUE)
- multiple aggregations: summarise(n = n(), avg = mean(x), ...)

## What tally() does in one sentence

**`tally(x)` counts the rows of a (possibly grouped) data frame and returns the count as a column named `n`.** It is purely a shortcut for `summarise(n = n())`.

`tally` and `count` are sister functions. The difference: `count` does the grouping for you (`count(df, g)` ≈ `group_by(df, g) |> tally()`). For already-grouped data, tally is the cleaner choice.

## Syntax

**`tally(x, wt = NULL, sort = FALSE, name = NULL)`. Operates on a data frame, possibly grouped.**

```r title="Count cars per cylinder"
library(dplyr)

mtcars |>
  group_by(cyl) |>
  tally()
#>     cyl     n
#>     4    11
#>     6     7
#>     8    14
```

[TIP]
**Use `count(df, cyl)` for one-step counting; use `tally()` only when the data is ALREADY grouped.** For the common case of "count by columns", `count` saves a `group_by` line.

## Five common patterns

### 1. Count per group

```r title="One row per group with count"
mtcars |>
  group_by(cyl) |>
  tally()
```

### 2. Total count (ungrouped)

```r title="Just the row count"
mtcars |>
  tally()
#>    n
#> 1 32
```

Returns a 1-row tibble. For a scalar, use `nrow(mtcars)`.

### 3. Sort by frequency

```r title="Most-frequent group first"
mtcars |>
  group_by(cyl) |>
  tally(sort = TRUE)
#>     cyl     n
#>     8    14
#>     4    11
#>     6     7
```

### 4. Weighted tally

```r title="Sum of weights per group, not row count"
mtcars |>
  group_by(cyl) |>
  tally(wt = wt)
#>     cyl     n
#>     4    25.143
#>     6    21.820
#>     8    55.989
```

`wt = wt` returns `sum(wt)` per group (the column name happens to be wt; coincidence).

### 5. Custom name

```r title="Rename the count column"
mtcars |>
  group_by(cyl) |>
  tally(name = "n_cars")
#>     cyl  n_cars
#>     4      11
#>     6       7
#>     8      14
```

[KEY INSIGHT]
**`tally(wt = col)` is `summarise(n = sum(col))`, NOT a count.** It is a weighted SUM. The arg name `wt` is shorthand for "weight". Use it when you have pre-aggregated counts (e.g., a row-per-event table with a `count` column) and want to roll them up by group.

## tally() vs count() vs summarise(n = n())

**Three ways to count rows in dplyr; pick by what you have already.**

| Function | When to use | Equivalent |
|---|---|---|
| `tally()` | Data already grouped | `summarise(n = n())` |
| `count(g)` | Need to group AND count in one step | `group_by(g) |> tally()` |
| `summarise(n = n())` | Explicit form, more control | (the canonical version) |
| `add_tally()` | Add count without summarising | `mutate(n = n())` |
| `add_count(g)` | Add per-group count without summarising | `group_by(g) |> mutate(n = n())` |

When to use which:

- `count(g)` for "count by column": most common pattern.
- `tally()` after an existing `group_by()`.
- `summarise(n = n(), avg = mean(x))` when you also need other aggregates.

## A practical workflow

**Most "frequency table" tasks in dplyr use `count()` (or `tally()` after group_by).** Standard pattern:

```r title="Top categories by frequency"
df |> count(category, sort = TRUE) |> head(10)
```

This gives the top 10 categories by frequency in one line. For grouped pipelines that already aggregate other things, swap in tally:

```r title="Tally inside summarise pipeline"
df |>
  group_by(category) |>
  summarise(avg = mean(value), tally(.))   # one of many aggregates
```

## Common pitfalls

**Pitfall 1: `tally()` collapses rows, mutate-style alternatives don't.** If you want to ADD a count column without losing rows, use `add_tally()` or `add_count()` (mutate-style: keeps all rows, adds `n`).

**Pitfall 2: `wt` is a SUM, not a count.** `tally(wt = price)` returns sum(price) per group, not the row count. Easy to misread.

[WARNING]
**`tally()` on an ungrouped data frame returns a 1-row tibble, not a scalar.** Use `nrow(df)` if you want a single integer; reserve `tally()` for grouped contexts where it actually adds value.

## Why tally and count exist as separate functions

**Two patterns dominate counting in dplyr: count-by-column and tally-after-grouping.** They could be the same function, but separating them keeps each call site short. `count(df, g)` is a one-liner that does the most common task. `tally()` is for the case when grouping has already happened (perhaps multi-step) and you only need to add the count step. Splitting the work like this avoids forcing one function to handle both shapes. Both share the same underlying machinery: `tally` wraps `summarise(n = n())`; `count` wraps `group_by + tally + ungroup`.

## Try it yourself

**Try it:** Find which `gear` value has the most cars in `mtcars`. Save the count to `ex_top_gear`.

```r title="Your turn: most-frequent gear"
ex_top_gear <- mtcars |>
  # your code here

ex_top_gear
#> Expected: 1 row showing the gear with the highest count
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_top_gear <- mtcars |>
  count(gear, sort = TRUE) |>
  slice_head(n = 1)

ex_top_gear
#>   gear  n
#> 1    3 15
```

**Explanation:** `count(gear, sort = TRUE)` returns gear values sorted by frequency descending. `slice_head(n = 1)` takes the top.

</details>

## Related count functions

After mastering tally, look at:

- `count()`: count + group in one step
- `add_tally()` / `add_count()`: mutate-style; keep all rows
- `summarise(n = n())`: explicit canonical form
- `n()`: per-group row count, used inside summarise/mutate
- `n_distinct()`: count unique values
- `nrow()`: scalar row count (base R)

For frequency tables across multiple columns, `count(df, col1, col2)` is the standard idiom.

## FAQ

**What is the difference between tally and count in dplyr?**

`count(df, g)` does both grouping and counting in one call. `tally()` only counts; the data must already be grouped. So `count(df, g)` is `group_by(df, g) |> tally()` in one step.

**How do I count rows per group in dplyr?**

`df |> count(group_col)` is the simplest form. Or `df |> group_by(group_col) |> tally()`.

**What does the wt argument do in tally?**

`tally(wt = col)` returns `sum(col)` per group instead of the row count. Useful when rows already represent counts and you want to roll them up.

**How do I sort tally output by frequency?**

Pass `sort = TRUE`: `tally(sort = TRUE)` (or `count(sort = TRUE)`). Sorts by descending count.

**What is the difference between tally and add_tally?**

`tally` SUMMARISES (collapses to one row per group). `add_tally` MUTATES (keeps all rows; adds an `n` column). Use add_tally when you need the count alongside the original rows.
