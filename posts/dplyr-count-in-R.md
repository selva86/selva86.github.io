---
title: "dplyr count() in R: Count Rows and Frequencies"
slug: "dplyr-count-in-R"
description: "Use dplyr count(), n(), tally(), and add_count() to count rows and frequencies in R. Covers grouped counts, sort flag, weighted, and 6 worked examples."
keywords: "dplyr count, count rows in R, dplyr n(), dplyr tally, R frequency table, dplyr add_count, weighted count dplyr"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "count()|dplyr count|dplyr::count()|n()|tally()|frequency table"
auto_link_case_sensitive: true
target_keyword: "dplyr count"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr count() in R: Count Rows and Frequencies

<p class="lead">The <code>count()</code> function in dplyr counts the rows in a data frame, optionally grouped by one or more columns. It is shorthand for <code>group_by()</code> + <code>summarise(n = n())</code> and the most common way to build frequency tables.</p>

[QUICK ANSWER]
count(df)                              # total rows: returns n
count(df, cyl)                         # rows per cyl
count(df, cyl, gear)                   # rows per (cyl, gear) combination
count(df, cyl, sort = TRUE)            # sorted desc by count
count(df, cyl, name = "n_cars")        # custom column name
count(df, cyl, wt = hp)                # weighted (sum of hp per cyl)
add_count(df, cyl)                     # add count col without collapsing

[DECISION TREE: Is count() the right tool?]
- count rows per group: count(df, g)
- count and add to original rows: add_count(df, g)
- compute one summary per group (not just count): summarise(df, .by = g, ...)
- count distinct values in column: summarise(df, n = n_distinct(x))
- frequency table with percentages: count() |> mutate(pct = n / sum(n))
- find duplicates: count(df, x, y) |> filter(n > 1)
- weighted count by another column: count(df, g, wt = weight_col)

## What count() does in one sentence

**`count()` returns the number of rows per unique combination of grouping columns.** Without arguments, it returns the total row count. With column names, it returns one row per unique combination with a column `n` for the count.

`count(df, x)` is sugar for `summarise(df, n = n(), .by = x)`. The shortcut form is more readable for the common "frequency table" use case.

## Syntax

**`count()` takes a data frame plus optional grouping columns plus options.** Add `sort = TRUE` to sort by count descending. Add `wt = column` for weighted counts.

```r title="Load dplyr and inspect mtcars"
library(dplyr)

nrow(mtcars)
#> [1] 32
```

The full signature:

```
count(x, ..., wt = NULL, sort = FALSE, name = NULL)
```

`x` is the data frame. `...` are grouping columns. `wt` is an optional weighting column (sums values instead of counting rows). `sort = TRUE` orders the result by `n` descending. `name` overrides the default count column name `n`.

[TIP]
**`count()` is the shortcut for the most common summarise pattern.** `count(df, x)` produces the same result as `summarise(df, n = n(), .by = x)`. Use `count()` when the only summary you want is row count; use `summarise()` when you want multiple statistics or non-count aggregations.

## Six common patterns

### 1. Total row count

```r title="Just count all rows"
mtcars |> count()
#>    n
#> 1 32
```

No grouping argument means the total count of rows in the data frame.

### 2. Count by one group

```r title="Cars per cylinder count"
mtcars |> count(cyl)
#>   cyl  n
#> 1   4 11
#> 2   6  7
#> 3   8 14
```

The result has one row per unique `cyl` value, with column `n` showing the count.

### 3. Multi-column counts

```r title="Cars per (cyl, gear) combination"
mtcars |> count(cyl, gear)
#>   cyl gear  n
#> 1   4    3  1
#> 2   4    4  8
#> 3   4    5  2
#> 4   6    3  2
#> 5   6    4  4
#> 6   6    5  1
#> 7   8    3 12
#> 8   8    5  2
```

One row per UNIQUE COMBINATION of cyl and gear.

### 4. Sort by count

```r title="Sorted descending by count"
mtcars |> count(cyl, sort = TRUE)
#>   cyl  n
#> 1   8 14
#> 2   4 11
#> 3   6  7
```

`sort = TRUE` is shorthand for chaining `arrange(desc(n))` after count.

### 5. Weighted count

```r title="Total hp per cylinder count (sum, not row count)"
mtcars |> count(cyl, wt = hp)
#>   cyl    n
#> 1   4  909
#> 2   6  856
#> 3   8 2929
```

`wt = hp` sums the `hp` column for each cyl group instead of counting rows. The column is still named `n` by default; use `name = "total_hp"` to rename.

### 6. add_count: add count column without collapsing

```r title="Add a count column to every row, no rollup"
mtcars |>
  add_count(cyl) |>
  select(cyl, mpg, n) |>
  head(4)
#>                 cyl  mpg  n
#> Mazda RX4         6 21.0  7
#> Mazda RX4 Wag     6 21.0  7
#> Datsun 710        4 22.8 11
#> Hornet 4 Drive    6 21.4  7
```

`add_count()` keeps every original row and adds a column `n` showing the size of each row's group. Useful for filtering ("keep only rows where group has at least 5 members").

[KEY INSIGHT]
**`count()` collapses; `add_count()` preserves.** `count(df, x)` reduces a 100-row data frame to maybe 10 rows (one per unique x). `add_count(df, x)` keeps all 100 rows but adds a column `n` showing each row's group size. Pick based on whether you want a frequency table or an annotated row-level data frame.

## count() vs base R alternatives

**Base R uses `table()` for frequency counts; dplyr uses `count()`. The major difference is output format: `table()` returns a named array; `count()` returns a tibble.**

| Task | dplyr | Base R |
|---|---|---|
| Frequency by one col | `count(df, x)` | `table(df$x)` |
| Cross-tabulation | `count(df, x, y)` | `table(df$x, df$y)` |
| Sorted descending | `count(df, x, sort=TRUE)` | `sort(table(df$x), decreasing=TRUE)` |
| Weighted | `count(df, x, wt=w)` | `xtabs(w ~ x, data=df)` |
| Add count to rows | `add_count(df, x)` | (multi-step: ave + assign) |
| Output type | tibble | array (table object) |

When to use which:

- Use `count()` for any analysis that continues in dplyr (output is a regular tibble).
- Use `table()` for quick interactive exploration; the named-array format is compact in print.

## Common pitfalls

**Pitfall 1: confusing `count()` and `n()`.** `count(df, x)` is a verb that returns a new data frame. `n()` is a context-only function that returns the size of the current group inside `summarise()` or `mutate()`. They are related but not interchangeable.

**Pitfall 2: forgetting that `count()` collapses rows.** After `count(df, x)`, the original row-level data is gone; you have a frequency table. To preserve every row AND add count info, use `add_count(df, x)` instead.

[WARNING]
**`wt` argument is for SUMMING, not for filtering.** `count(df, x, wt = w)` returns sum of `w` per group, not a count of rows where `w > 0`. To filter then count, use `filter(df, w > 0) |> count(x)`.

**Pitfall 3: NA in grouping column creates an NA row.** `count(df, x)` with NAs in x returns one row with `x = NA` and the count of those NA rows. To exclude: `filter(df, !is.na(x)) |> count(x)`.

## Try it yourself

**Try it:** Count cars per `gear` value in `mtcars`, sorted descending by count. Save to `ex_gears`.

```r title="Your turn: count gears sorted desc"
# Try it: gears with counts, descending
ex_gears <- # your code here

ex_gears
#> Expected: 3 rows; gear=3 has 15, gear=4 has 12, gear=5 has 5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_gears <- mtcars |> count(gear, sort = TRUE)
ex_gears
#>   gear  n
#> 1    3 15
#> 2    4 12
#> 3    5  5
```

**Explanation:** `count(gear, sort = TRUE)` groups by gear, counts rows in each group, then sorts the result by `n` descending. The `sort = TRUE` flag is shorthand for chaining `arrange(desc(n))` after a regular count.

</details>

## Related dplyr functions

After mastering `count()`, look at:

- `n()`: row count helper used inside `summarise()` and `mutate()`
- `n_distinct(x)`: count unique values of x (not rows)
- `tally()`: count without grouping; nearly synonymous with `count()` no-args
- `add_count()`: add count column to row-level data without collapsing
- `add_tally()`: add the tally column without collapsing
- `summarise(.by = g, n = n(), other_stat = ...)`: when you need count plus other stats

For percentages and proportions, chain `mutate(pct = n / sum(n))` after count.

## FAQ

**What is the difference between count and n() in dplyr?**

`count()` is a verb returning a frequency table: `count(df, x)` returns one row per unique x value with column `n` for the count. `n()` is a HELPER used inside `summarise()` or `mutate()` that returns the size of the current group: `summarise(df, num = n(), .by = x)`.

**How do I count rows per group in dplyr?**

`count(df, group_col)` returns one row per unique group with column `n` showing the count. For multiple group columns: `count(df, col1, col2)`. To sort by count descending: add `sort = TRUE`.

**What is the difference between count and tally in dplyr?**

They are nearly identical. `tally()` does not group on its own; it counts whatever is currently grouped. `count()` is shorthand for `group_by() |> tally() |> ungroup()`. For most uses, just use `count()`.

**How do I count distinct values in a column with dplyr?**

Use `n_distinct(col)` inside `summarise()`: `summarise(df, n_unique = n_distinct(col))`. This is different from `count()`, which counts ROWS per group, not unique values.

**How do I get a frequency table with percentages?**

`count(df, x) |> mutate(pct = n / sum(n) * 100)`. The `mutate()` adds a `pct` column showing each group's percentage of the total. Chain `arrange(desc(pct))` for sorted output.
