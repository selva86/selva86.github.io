---
title: "dplyr n() in R: Count Rows Inside summarise or mutate"
slug: "dplyr-n-in-R"
description: "Use dplyr n() to count rows in the current group inside summarise() or mutate() in R. Covers n vs nrow, vs n_distinct, per group behavior, 5 examples."
keywords: "dplyr n, R n() function, n vs nrow, dplyr count rows, summarise n, mutate n group, n_distinct vs n, R group size"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "dplyr n()|n() function|count rows in group|n vs nrow|group size"
auto_link_case_sensitive: true
target_keyword: "dplyr n"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr n() in R: Count Rows Inside summarise or mutate

<p class="lead">The <code>n()</code> function in dplyr returns the number of rows in the CURRENT group when called inside <code>summarise()</code>, <code>mutate()</code>, or <code>filter()</code>. It is the standard "group size" expression.</p>

[QUICK ANSWER]
df |> summarise(count = n())               # one row, total count
df |> group_by(g) |> summarise(count = n()) # per group
df |> group_by(g) |> mutate(group_size = n())
df |> filter(n() > 5)                       # filter groups of size > 5
df |> count(g)                              # shortcut for group_by + summarise(n())
n_distinct(df$x)                            # different: unique count

[DECISION TREE: Is n() the right tool?]
- count rows in current group: n()
- count unique values: n_distinct(col)
- count rows in a data frame: nrow(df)
- count without grouping (summarise): summarise(n = n())
- shortcut "count by column": count(df, col)
- per-group row count as new column: add_count() or add_tally()

## What n() does in one sentence

**`n()` returns the size of the current group as an integer; it can ONLY be called inside dplyr verbs (`summarise`, `mutate`, `filter`).** Outside those contexts, it errors.

This is the canonical way to express "how many rows are in this group" inside a dplyr pipeline.

## Syntax

**`n()`. No arguments. Must be called inside a dplyr verb on a (possibly grouped) tibble.**

```r title="Total row count"
library(dplyr)

mtcars |>
  summarise(count = n())
#>   count
#> 1    32
```

[TIP]
**Use `count(df, g)` when you only need a count by column.** It is a shortcut for `df |> group_by(g) |> summarise(n = n()) |> ungroup()`: same result, less typing.

## Five common patterns

### 1. Total count

```r title="Just count the rows"
mtcars |>
  summarise(count = n())
#>   count
#> 1    32
```

For a scalar without the tibble wrapper, use `nrow(mtcars)`.

### 2. Count per group

```r title="Group then count"
mtcars |>
  group_by(cyl) |>
  summarise(n = n())
#>     cyl     n
#>     4    11
#>     6     7
#>     8    14
```

### 3. Add count column without summarising

```r title="Each row knows its group's size"
mtcars |>
  group_by(cyl) |>
  mutate(group_size = n())
#> Each row gets group_size: 11 / 7 / 14 by cyl
```

For a one-step idiom, `add_count(df, cyl)` does the same.

### 4. Filter groups by size

```r title="Keep groups with at least 10 rows"
mtcars |>
  group_by(cyl) |>
  filter(n() >= 10) |>
  ungroup()
```

`n()` inside filter is per-group: keeps every row from groups of size 10 or more.

### 5. Combine n() with other aggregates

```r title="Multiple stats in one summarise"
mtcars |>
  group_by(cyl) |>
  summarise(
    n      = n(),
    avg    = mean(mpg),
    sd     = sd(mpg)
  )
```

n() coexists with mean, sd, sum, etc., inside summarise.

[KEY INSIGHT]
**`n()` only makes sense inside dplyr verbs and a (possibly grouped) tibble.** Outside, it errors with "Must only be used inside dplyr verbs". This restriction lets dplyr inject the correct group size at evaluation time.

## n() vs nrow() vs n_distinct() vs count()

**Four counting functions in R, with different scope.**

| Function | Counts | Scope | Where |
|---|---|---|---|
| `n()` | Rows | Current group | Inside dplyr verbs |
| `nrow(df)` | Rows | Entire data frame | Anywhere |
| `n_distinct(x)` | Unique values | Vector | Anywhere |
| `count(df, g)` | Rows | Per group | Top-level dplyr |
| `length(x)` | Elements | Vector | Anywhere |

When to use which:

- `n()` inside summarise/mutate/filter for group size.
- `nrow(df)` outside dplyr; for the total row count as a scalar.
- `n_distinct(col)` for unique value counts.
- `count(df, g)` for one-step count by column.

## A practical workflow

**The most common n() usage is inside summarise alongside other aggregates.**

```r title="Per-category multi-stat summary"
df |>
  group_by(category) |>
  summarise(
    n        = n(),
    avg      = mean(value),
    sd       = sd(value),
    n_unique = n_distinct(item_id),
    .groups  = "drop"
  )
```

This produces a per-category summary with row count, average, SD, and unique-item count in one block. n() captures the group size; n_distinct gets unique counts.

## Common pitfalls

**Pitfall 1: calling n() outside dplyr.** `mtcars |> n()` errors. n must be inside `summarise`, `mutate`, or `filter`.

**Pitfall 2: confusing n() with n_distinct().** `n()` counts rows; `n_distinct(col)` counts unique values. `n()` ignores the column and just counts rows.

[WARNING]
**`n()` does NOT take arguments.** It is a zero-arg function that gets the current group size from dplyr's internal state. If you want to count NON-NA values in a column, use `sum(!is.na(col))`, NOT `n()`.

## Try it yourself

**Try it:** For each `cyl` group, compute the count, the mean of `mpg`, and the count of unique `gear` values. Save to `ex_summary`.

```r title="Your turn: per-group multi-stat"
ex_summary <- mtcars |>
  # your code here

ex_summary
#> Expected: 3 rows (one per cyl) with n, mean_mpg, n_gear columns
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_summary <- mtcars |>
  group_by(cyl) |>
  summarise(
    n        = n(),
    mean_mpg = mean(mpg),
    n_gear   = n_distinct(gear),
    .groups  = "drop"
  )

ex_summary
#> # A tibble: 3 x 4
#>     cyl     n mean_mpg n_gear
#>     4    11     26.7      3
#>     6     7     19.7      3
#>     8    14     15.1      3
```

**Explanation:** n() gives the row count. mean(mpg) the average. n_distinct(gear) the unique gear values per cyl group.

</details>

## Related dplyr functions

After mastering n(), look at:

- `n_distinct(x)`: count unique values
- `count(df, g)`: shortcut for group_by + summarise(n = n())
- `tally()`: shortcut for summarise(n = n()) when already grouped
- `add_count()` / `add_tally()`: keep all rows + add count
- `cur_group_id()`: integer ID of the current group
- `cur_group_rows()`: row indices within current group

For unique-value counts, `n_distinct(col)` is the direct counterpart.

## FAQ

**What does n() do in dplyr?**

`n()` returns the number of rows in the current group when called inside `summarise()`, `mutate()`, or `filter()`. It can only be used inside dplyr verbs.

**What is the difference between n() and nrow() in R?**

`nrow(df)` returns total rows in the data frame. `n()` returns the size of the CURRENT group inside a dplyr verb. They differ on grouped tibbles.

**What is the difference between n() and n_distinct()?**

`n()` counts ROWS. `n_distinct(col)` counts UNIQUE values in a column. n() ignores any column; n_distinct works on a specific vector.

**Why does my n() call error with 'Must only be used inside dplyr verbs'?**

Because n() is restricted to dplyr verb contexts. You cannot call it as a standalone function. Wrap in `summarise(n = n())` or `mutate(group_size = n())`.

**Can I use n() inside filter?**

Yes: `filter(n() >= 5)` keeps every row from groups of size 5+. Inside filter, n() is the current group's size.
