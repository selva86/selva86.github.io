---
title: "dplyr add_count() in R: Add Group Count Without Summarising"
slug: "dplyr-add_count-in-R"
description: "Use dplyr add_count() to add a group count column to a tibble without collapsing rows in R. Covers add_count vs count, weighted, sort, and 5 examples."
keywords: "dplyr add_count, R add count column, add_count vs count, dplyr group count, mutate group n, R count without summarise"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "add_count()|dplyr add_count|add count column|group count mutate|count without summarise"
auto_link_case_sensitive: true
target_keyword: "dplyr add_count"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr add_count() in R: Add Group Count Without Summarising

<p class="lead">The <code>add_count()</code> function in dplyr adds a column with the per-group row count to every row, WITHOUT collapsing the data. It is <code>mutate()</code>-style; <code>count()</code> is <code>summarise()</code>-style.</p>

[QUICK ANSWER]
df |> add_count(g)                            # adds n column per group
df |> add_count(g, sort = TRUE)               # sort desc by n
df |> add_count(g, name = "group_size")       # rename added column
df |> add_count(g, wt = price)                # weighted (sum of price)
df |> group_by(g) |> mutate(n = n())          # equivalent
df |> count(g)                                # collapses (different result!)
df |> add_count(g) |> filter(n > 5)           # use n in downstream filter

[DECISION TREE: add_count vs count?]
- need ALL rows, count as new column: add_count()
- need SUMMARY (one row per group): count()
- using count for downstream filter: add_count() is cleaner
- weighted: add_count(wt = w) or count(wt = w)
- already grouped: add_tally() (no extra group args needed)
- multiple aggregates: group_by + mutate

## What add_count() does in one sentence

**`add_count(df, ...)` is `df |> group_by(...) |> mutate(n = n()) |> ungroup()`.** It adds a column `n` containing the per-group row count, WITHOUT collapsing rows.

This is the "mutate" cousin of `count()`. Use it when you need the count alongside the original data, not as a summary.

## Syntax

**`add_count(x, ..., wt = NULL, sort = FALSE, name = NULL)`. `...` are grouping columns.**

```r title="Add group_size column to mtcars"
library(dplyr)

mtcars |>
  add_count(cyl) |>
  select(mpg, cyl, n) |>
  head(5)
#>                    mpg cyl  n
#> Mazda RX4         21.0   6  7
#> Mazda RX4 Wag     21.0   6  7
#> Datsun 710        22.8   4 11
#> Hornet 4 Drive    21.4   6  7
#> Hornet Sportabout 18.7   8 14
```

[TIP]
**Use `add_count()` whenever you need to filter or sort by group size.** Without it, you have to count, then join back. `add_count()` does it in one step and keeps all rows.

## Five common patterns

### 1. Add count column

```r title="Each row knows its group's size"
mtcars |>
  add_count(cyl) |>
  head(3)
#>            mpg cyl ... n
#> Mazda RX4 21.0   6     7
#> ...
```

### 2. Filter to common groups

```r title="Keep only groups with >= 10 rows"
mtcars |>
  add_count(cyl) |>
  filter(n >= 10) |>
  select(mpg, cyl, n) |>
  head(3)
#> Only cyl 4 (n=11) and cyl 8 (n=14) survive
```

A clean idiom for "filter rare categories".

### 3. Sort by group size

```r title="Largest group first"
mtcars |>
  add_count(cyl, sort = TRUE) |>
  head(3)
```

`sort = TRUE` arranges rows so the largest group appears first.

### 4. Custom column name

```r title="Avoid the default 'n' name"
mtcars |>
  add_count(cyl, name = "cyl_count")
```

Useful when `n` would clash with an existing column.

### 5. Weighted count

```r title="Sum of a column instead of row count"
mtcars |>
  add_count(cyl, wt = wt, name = "total_weight")
```

`total_weight` = sum of `wt` per cyl group. Same idea as `tally(wt = ...)`.

[KEY INSIGHT]
**`add_count()` is the dplyr idiom for "I need group size as a column".** Without it, you have to do count, then join : two steps that are easy to misorder. `add_count()` is one verb and stays inside the pipeline.

## add_count() vs count() vs add_tally()

**Three ways to handle group counts in dplyr.**

| Function | Style | Pre-grouped? | Output rows |
|---|---|---|---|
| `add_count(df, g)` | mutate (keep rows) | No (does grouping) | Original count |
| `count(df, g)` | summarise (collapse) | No (does grouping) | One per group |
| `add_tally()` | mutate (keep rows) | YES (already grouped) | Original count |
| `tally()` | summarise (collapse) | YES (already grouped) | One per group |

When to use which:

- `add_count(g)` : most common; one-step add a count column.
- `count(g)` : when you only need the summary table.
- `add_tally()` : when the data is already grouped and you want to keep all rows.
- `tally()` : when already grouped and you want a summary.

## A practical workflow

**The classic "filter rare values" pattern uses add_count + filter.**

```r title="Filter to common categories"
df |>
  add_count(category) |>
  filter(n >= 10) |>           # keep categories with >= 10 rows
  select(-n)
```

This is the cleanest base pattern for cleaning categorical variables. Equivalent without add_count:

```r title="Two-step alternative"
common <- df |> count(category) |> filter(n >= 10) |> pull(category)
df |> filter(category %in% common)
```

Same result, more code, easier to make a mistake.

## Common pitfalls

**Pitfall 1: column name clash.** If your data already has an `n` column, `add_count()` will silently overwrite it. Use `name = "..."` to avoid this.

**Pitfall 2: confusing add_count with count.** `count(df, g)` returns ONE row per group; `add_count(df, g)` returns ALL rows with `n` added. Easy to type the wrong one.

[WARNING]
**`add_count()` ungroups the result by default; `add_tally()` keeps existing grouping.** If you have grouped data and want to preserve grouping, use `add_tally()`. If you want a single-step group + count + ungroup, use `add_count()`.

## Try it yourself

**Try it:** Add a column showing each cylinder group's size, then filter to rows where the group has at least 10 cars. Save to `ex_common`.

```r title="Your turn: filter to common cyl groups"
ex_common <- mtcars |>
  # your code here

head(ex_common)
#> Expected: only rows where cyl group has 10+ members
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_common <- mtcars |>
  add_count(cyl) |>
  filter(n >= 10)

nrow(ex_common)
#> [1] 25  (11 cyl=4 + 14 cyl=8; cyl=6 dropped at n=7)
```

**Explanation:** `add_count(cyl)` adds an `n` column with each row's cyl group size. `filter(n >= 10)` keeps only the rows from groups of at least 10.

</details>

## Related count functions

After mastering add_count, look at:

- `count()`: collapse-style sister of add_count
- `add_tally()`: same as add_count but for already-grouped data
- `tally()`: collapse-style; already-grouped data
- `n()`: per-group row count inside mutate / summarise
- `n_distinct()`: count of unique values
- `cur_group_rows()`: row indexes within current group

For more complex group-aware mutations, use `group_by() |> mutate()` directly.

## FAQ

**What is the difference between add_count and count in dplyr?**

`count(df, g)` collapses to one row per group with column `n`. `add_count(df, g)` keeps ALL rows and adds `n` as a new column. Use add_count when you need the count alongside the original data.

**How do I add a count column to a data frame without summarising?**

Use `add_count(df, group_col)`. It adds `n` with the per-group row count and returns all rows.

**What is the difference between add_count and add_tally?**

`add_count(df, g)` does the grouping for you. `add_tally(df)` requires the data to already be grouped via `group_by()`. Otherwise identical.

**How do I filter to common categories with add_count?**

`df |> add_count(category) |> filter(n >= threshold)` keeps only rows whose category has at least `threshold` members.

**Can I weight add_count?**

Yes: `add_count(df, g, wt = price)` sums `price` per group instead of counting rows.
