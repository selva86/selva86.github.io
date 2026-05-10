---
title: "dplyr distinct() in R: Remove Duplicate Rows"
slug: "dplyr-distinct-in-R"
description: "Use dplyr distinct() to remove duplicate rows from a data frame in R. Covers .keep_all flag, multi-column dedup, NA handling, and 6 worked code examples."
keywords: "dplyr distinct, remove duplicates R, R unique rows, dplyr distinct keep_all, dedupe data frame R, dplyr drop duplicates"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "distinct()|dplyr distinct|dplyr::distinct()|remove duplicates|deduplicate rows"
auto_link_case_sensitive: true
target_keyword: "dplyr distinct"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr distinct() in R: Remove Duplicate Rows

<p class="lead">The <code>distinct()</code> function in dplyr removes duplicate rows from a data frame. Without arguments it dedupes on all columns; with column names it dedupes on those columns only. Use <code>.keep_all = TRUE</code> to keep the rest of the row.</p>

[QUICK ANSWER]
distinct(df)                              # all columns must match
distinct(df, cyl)                         # unique cyl values, returns 1 col
distinct(df, cyl, .keep_all = TRUE)       # unique by cyl, keep first row
distinct(df, cyl, gear)                   # unique combinations, returns 2 cols
distinct(df, cyl, gear, .keep_all = TRUE) # unique by cyl+gear, keep all cols
n_distinct(df$cyl)                        # count unique values
df |> count(cyl) |> filter(n > 1)         # find duplicates

[DECISION TREE: Is distinct() the right tool?]
- remove duplicate rows (all cols): distinct(df)
- unique values in one column: distinct(df, x)
- unique combinations, keep other cols: distinct(df, x, y, .keep_all = TRUE)
- count distinct values: summarise(df, n = n_distinct(x))
- find duplicate rows: df |> count(x) |> filter(n > 1)
- first occurrence per group: slice(df, 1, .by = g)
- keep highest version per group: slice_max(df, version, n = 1, .by = id)

## What distinct() does in one sentence

**`distinct()` returns rows where the specified columns form a unique combination.** Without arguments, it considers ALL columns. With column names, only those columns determine uniqueness. By default, it returns ONLY the deduplicating columns; use `.keep_all = TRUE` to keep every column of the first matching row.

Unlike base R `unique()`, distinct integrates into pipelines, supports `.keep_all` semantics, and works on grouped data frames. It is also faster than `unique()` for large data frames.

## Syntax

**`distinct()` takes a data frame plus optional dedup columns plus `.keep_all` flag.** Empty arguments dedup on all columns; named arguments dedup on those only.

```r title="Load dplyr and inspect mtcars"
library(dplyr)

nrow(mtcars)
#> [1] 32
```

The full signature:

```
distinct(.data, ..., .keep_all = FALSE)
```

`...` is zero or more columns to dedup on. `.keep_all = FALSE` (default) returns only the dedup columns; `TRUE` returns the first occurrence of each unique combination with all columns.

[TIP]
**Default `.keep_all = FALSE` returns only the dedup columns.** `distinct(mtcars, cyl)` returns a 3-row, 1-column tibble (the unique cyl values). To keep the full row of the first occurrence, set `.keep_all = TRUE`.

## Six common patterns

### 1. Dedup on all columns

```r title="Remove rows that are duplicates of an entire row"
df <- tibble(a = c(1, 1, 2, 3), b = c("x", "x", "y", "z"))
df |> distinct()
#> # A tibble: 3 x 2
#>       a b
#>   <dbl> <chr>
#> 1     1 x
#> 2     2 y
#> 3     3 z
```

The two identical `(1, "x")` rows collapse to one. Rows must match on EVERY column to be considered duplicates.

### 2. Unique values in one column

```r title="Distinct cyl values in mtcars"
mtcars |> distinct(cyl)
#>   cyl
#> 1   6
#> 2   4
#> 3   8
```

Only the dedup column is returned. Result is a 1-column data frame, not a vector.

### 3. Unique combinations of multiple columns

```r title="Distinct cyl and gear pairs"
mtcars |> distinct(cyl, gear)
#>   cyl gear
#> 1   6    4
#> 2   4    4
#> 3   8    3
#> 4   6    3
#> 5   4    3
#> 6   4    5
#> 7   8    5
#> 8   6    5
```

The result has one row per UNIQUE COMBINATION of the listed columns.

### 4. Keep first occurrence with all columns (.keep_all = TRUE)

```r title="One row per cyl with all original columns"
mtcars |> distinct(cyl, .keep_all = TRUE)
#>                 mpg cyl  disp  hp drat    wt  qsec vs am gear carb
#> Mazda RX4     21.0   6 160.0 110 3.90 2.620 16.46  0  1    4    4
#> Datsun 710    22.8   4 108.0  93 3.85 2.320 18.61  1  1    4    1
#> Hornet Sport. 18.7   8 360.0 175 3.15 3.440 17.02  0  0    3    2
```

The FIRST occurrence of each unique cyl value is kept, with all other columns intact.

### 5. Count duplicates instead of removing them

```r title="Find rows that appear more than once"
df <- tibble(a = c(1, 1, 2, 3, 1), b = c("x","x","y","z","x"))
df |> count(a, b) |> filter(n > 1)
#> # A tibble: 1 x 3
#>       a b         n
#>   <dbl> <chr> <int>
#> 1     1 x         3
```

Sometimes you want to KNOW which rows are duplicated before deciding what to do. `count()` plus `filter(n > 1)` lists every duplicate group.

### 6. Distinct within groups

```r title="One distinct row per group"
df <- tibble(
  group = c("A","A","A","B","B"),
  value = c(1, 2, 1, 3, 3)
)
df |>
  distinct(value, .keep_all = TRUE)
#> # A tibble: 3 x 2
#>   group value
#>   <chr> <dbl>
#> 1 A         1
#> 2 A         2
#> 3 B         3
```

Globally distinct on `value`. The `(A, 1)` and `(B, 3)` are kept once each (first occurrence), and the duplicate `(A, 1)` is dropped.

[KEY INSIGHT]
**`distinct(df, x)` and `distinct(df, x, .keep_all = TRUE)` look similar but return DIFFERENT widths.** Without `.keep_all`, you get only column x. With `.keep_all`, you get every column. Pick based on what the next step in your pipeline needs.

## distinct() vs base R unique()

**Base R `unique()` works on vectors and matrices and data frames; distinct() is data-frame specific but more powerful.**

| Task | dplyr | Base R |
|---|---|---|
| Dedup full data frame | `distinct(df)` | `unique(df)` |
| Unique values, one column | `distinct(df, x)` | `unique(df$x)` (returns vector) |
| Unique by column, keep all | `distinct(df, x, .keep_all=TRUE)` | (multi-step: `df[!duplicated(df$x), ]`) |
| Multi-col unique combinations | `distinct(df, x, y)` | `unique(df[, c("x","y")])` |
| Pipeline-friendly | Yes | Awkward |

When to use which:

- Use `distinct()` inside any dplyr pipeline.
- Use `unique()` for vectors and outside the tidyverse.

## Common pitfalls

**Pitfall 1: forgetting `.keep_all = TRUE`.** `distinct(mtcars, cyl)` returns a 3-row, 1-column tibble. If you wanted "one row per cyl with all columns", you need `.keep_all = TRUE`. New users frequently miss this and end up with surprisingly skinny output.

**Pitfall 2: distinct does not sort.** The result keeps rows in their FIRST-OCCURRENCE order, not alphabetical or numeric order. To sort the result, chain `arrange()` after.

[WARNING]
**`distinct()` treats NA values as identical.** Two rows with `x = NA` are considered duplicates and only one is kept. This matches `unique()` behavior. If you want NA rows treated as distinct, you need a workaround (e.g., add a row index column, dedup, then drop the index).

**Pitfall 3: distinct on a grouped frame may behave unexpectedly.** `group_by(df, g) |> distinct(x)` deduplicates WITHIN each group. The result is unique x values per group, not globally unique. Usually `.by = g` inside distinct is clearer if you need this.

## Try it yourself

**Try it:** From `mtcars`, find the unique combinations of `cyl` and `am` (transmission). Save to `ex_combos`.

```r title="Your turn: unique cyl and am pairs"
# Try it: distinct combinations
ex_combos <- # your code here

ex_combos
#> Expected: tibble with 6 rows showing cyl and am pairs
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_combos <- mtcars |> distinct(cyl, am)
ex_combos
#>   cyl am
#> 1   6  1
#> 2   4  1
#> 3   8  0
#> 4   6  0
#> 5   4  0
#> 6   8  1
```

**Explanation:** `distinct(cyl, am)` returns one row per unique combination of `cyl` and `am`. There are 6 combinations (4 cyl manual, 4 cyl auto, 6 cyl manual, 6 cyl auto, 8 cyl manual, 8 cyl auto). The order matches first-occurrence in the data.

</details>

## Related dplyr functions

After mastering `distinct()`, look at:

- `n_distinct()`: count unique values without returning them
- `count()`: count rows per group, useful for finding duplicates
- `slice()`: explicit row selection by position; `slice(1, .by = g)` keeps first per group
- `slice_max()` / `slice_min()`: keep top per group by some value (better than distinct for "latest version" cases)
- Base R `unique()`, `duplicated()`: vector-level dedup helpers

For "keep the latest record per id", reach for `slice_max(df, version, n = 1, by = id)` instead of distinct, since you usually want the highest version, not just the first.

## FAQ

**How do I remove duplicate rows in dplyr?**

`distinct(df)` removes rows that are duplicates across ALL columns. `distinct(df, x)` deduplicates by column x only and returns just that column. `distinct(df, x, .keep_all = TRUE)` deduplicates by x but keeps every column from the first occurrence.

**What is the difference between distinct and unique in R?**

`unique()` is base R; works on vectors, matrices, and data frames. `distinct()` is dplyr; data-frame specific but supports `.keep_all`, integrates with pipelines, and is faster on large data. For a vector, both return the same unique values.

**How do I count distinct values in dplyr?**

Use `n_distinct(x)` inside `summarise()`: `summarise(df, n = n_distinct(x))` returns the count of unique values. For per-group counts: `summarise(df, n = n_distinct(x), .by = g)`.

**What does .keep_all do in distinct?**

`.keep_all = TRUE` keeps EVERY column of the first matching row, not just the dedup columns. `.keep_all = FALSE` (default) returns only the columns named in the dedup arguments. The flag matters when you dedup by some columns but want to retain others.

**How do I find rows that are duplicated (not remove them)?**

`df |> count(x, y) |> filter(n > 1)` lists every (x, y) combination that appears more than once. To get the actual duplicate ROWS: `df |> group_by(x, y) |> filter(n() > 1)` or `df[duplicated(df[, c("x","y")]) | duplicated(df[, c("x","y")], fromLast = TRUE), ]` in base R.
