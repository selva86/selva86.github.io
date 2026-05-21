---
title: "data.table by in R: Group, Aggregate, and Summarize Rows"
slug: datatable-by-keyword-in-R
description: "data.table by in R groups rows for aggregation inside the DT[i, j, by] syntax. See by vs keyby, multi-column grouping, expressions, .SD, and pitfalls."
keywords: "data.table by, data.table by keyword, data.table by argument, data.table group by, R data.table grouping, by keyby data.table, data.table by examples"
mathjax: false
webr: true
date: "2026-05-22"
post_type: PSEO
category_id: function-deep
subcategory_id: datatable-functions
fr_parent: data-table-vs-dplyr.html
auto_link_terms: "data.table by|by argument|by keyword|keyby()|data.table grouping|grouping in data.table"
auto_link_case_sensitive: true
target_keyword: "data.table by"
sibling_block_enabled: true
difficulty: Beginner
---

# data.table by in R: Group, Aggregate, and Summarize Rows

<p class="lead">The <code>by</code> keyword in <code>data.table</code> groups rows so any expression in <code>DT[i, j, by]</code> runs once per unique value of the grouping columns and returns one result row per group.</p>

[QUICK ANSWER]
dt[, .N, by = cyl]                          # count rows per group
dt[, mean(mpg), by = cyl]                   # one summary per group
dt[, .(avg = mean(mpg)), by = cyl]          # name the output column
dt[, mean(mpg), by = .(cyl, gear)]          # group on two columns
dt[, mean(mpg), keyby = cyl]                # group and sort by group
dt[, mean(mpg), by = cyl > 6]               # group by an expression
dt[, lapply(.SD, mean), by = cyl]           # summarize every column

[DECISION TREE: Is by the right tool?]
- aggregate per group: dt[, mean(x), by = grp]
- aggregate and sort the result: dt[, mean(x), keyby = grp]
- add a column without aggregating: dt[, new := x * 2]
- filter rows by condition: dt[x > 5]
- count rows per group: dt[, .N, by = grp]
- pick one row per group: dt[, .SD[1], by = grp]
- summarize many columns at once: dt[, lapply(.SD, mean), by = grp]

## What by does in one sentence

**The `by` keyword splits a data.table into groups and evaluates `j` on each group.** You pass one or more grouping columns, and data.table runs the `j` expression separately for every unique combination, then stacks the results into a new table. The grouping columns appear alongside whatever `j` returns.

Because `by` lives inside `DT[i, j, by]`, you can filter rows with `i` and group what survives in the same call. The split happens on the rows passed by `i`, not on the whole table.

## Syntax

**The grouping clause is the third argument in `DT[i, j, by]`.** You can pass `by` as one column, several columns wrapped in `.()`, a character vector, or an expression that returns one or more vectors.

```r title="data.table query signature"
DT[i, j, by]                # i = filter, j = expression, by = group
DT[i, j, keyby = ...]       # like by, but also sort and key the result
```

The accepted forms are:

- `by = col`: one unquoted column name.
- `by = .(col1, col2)`: several unquoted column names.
- `by = "col"` or `by = c("col1", "col2")`: column names as character.
- `by = expression`: any expression that returns a vector (or list of vectors) the same length as the rows being grouped.
- `keyby = ...`: identical to `by`, but the result is sorted and keyed on the grouping columns.

The output is always a new data.table with one row per group.

## Examples by use case

**Build a data.table once and reuse it for every example.** All blocks share the same `dt` object created from `mtcars`.

```r title="Create a data.table from mtcars"
library(data.table)

dt <- as.data.table(mtcars, keep.rownames = "model")
dt[1:3, .(model, mpg, cyl, gear)]
#>            model   mpg   cyl  gear
#>           <char> <num> <num> <num>
#> 1:     Mazda RX4  21.0     6     4
#> 2: Mazda RX4 Wag  21.0     6     4
#> 3:    Datsun 710  22.8     4     4
```

**Count rows per group with `.N` and a single grouping column.** `.N` is the row count of the current group.

```r title="Count rows per group"
dt[, .N, by = cyl]
#>      cyl     N
#>    <num> <int>
#> 1:     6     7
#> 2:     4    11
#> 3:     8    14
```

**Name the summary column inside `j`.** Wrap `j` in `.()` and pass `name = expression`.

```r title="One named summary per group"
dt[, .(avg_mpg = mean(mpg)), by = cyl]
#>      cyl  avg_mpg
#>    <num>    <num>
#> 1:     6 19.74286
#> 2:     4 26.66364
#> 3:     8 15.10000
```

**Group on two columns by passing `.()`.** Order in the call drives the column order in the output.

```r title="Group by two columns"
dt[, .(avg_mpg = mean(mpg), n = .N), by = .(cyl, gear)]
#>      cyl  gear  avg_mpg     n
#>    <num> <num>    <num> <int>
#> 1:     6     4 19.75000     4
#> 2:     4     4 26.92500     8
#> 3:     6     3 19.75000     2
#> 4:     8     3 15.05000    12
#> 5:     4     3 21.50000     1
#> 6:     4     5 28.20000     2
#> 7:     8     5 15.40000     2
#> 8:     6     5 19.70000     1
```

**Group by an expression to create ad-hoc bins.** The expression is evaluated once per row and the result drives the grouping.

```r title="Group by an expression"
dt[, .(avg_mpg = mean(mpg), n = .N), by = .(big_engine = cyl > 6)]
#>    big_engine  avg_mpg     n
#>        <lgcl>    <num> <int>
#> 1:       TRUE 15.10000    14
#> 2:      FALSE 23.97222    18
```

**Summarize many columns at once with `.SD` and `lapply`.** `.SD` is the Subset of Data, every column except those listed in `by`.

```r title="Apply a function to every column per group"
num_cols <- c("mpg", "hp", "wt")
dt[, lapply(.SD, mean), by = cyl, .SDcols = num_cols]
#>      cyl       mpg        hp       wt
#>    <num>     <num>     <num>    <num>
#> 1:     6 19.742857 122.28571 3.117143
#> 2:     4 26.663636  82.63636 2.285727
#> 3:     8 15.100000 209.21429 3.999214
```

[KEY INSIGHT]
**`by` is the row-splitter; `j` is the per-group recipe.** data.table runs `j` once for every group, so anything you can write for one table works inside `j` for every group: `mean()`, `.N`, `.SD[1]`, a fitted model, even a plot. The grouping columns are added to the result automatically.

## by vs keyby and i grouping

**`by` and `keyby` are the same operation with different output guarantees.** Plain `by` returns groups in the order they first appear; `keyby` sorts the result ascending and stores those columns as the table's key, so later queries on it can use binary search.

| Form | Sorts result? | Keys result? | Best when |
|---|---|---|---|
| `by = cyl` | No | No | One-off summaries; row order does not matter |
| `keyby = cyl` | Yes, ascending | Yes | You will join, subset, or further query the result |
| `dt[cyl == 4, j]` (no by) | N/A | N/A | You want one summary across a filtered slice |
| `by = .(cyl > 6)` | No | No | Ad-hoc bins without adding a column |

The decision rule is short. Reach for `keyby` whenever the grouped table will be subset, joined, or queried again. Use plain `by` when you only need to print or write the result.

## Common pitfalls

**Forgetting `.()` around two columns silently groups by only the first one.** `by = cyl, gear` parses `gear` as a separate argument in some calls and is a parse error in others. Always wrap multi-column groupings in `.()` or pass a character vector.

```r title="Wrong vs right multi-column by"
nrow(dt[, .N, by = .(cyl, gear)])
#> [1] 8
nrow(dt[, .N, by = c("cyl", "gear")])
#> [1] 8
```

[WARNING]
**`by` keeps input order inside each group, but does not sort across groups.** Plain `by` returns groups in the order they first appear in the data, which is fast but not alphabetical. If your `j` depends on order (`head()`, `cummax()`, `shift()`), sort the table with `setorder()` first or use `keyby` for sorted output.

**`.SD` includes every non-`by` column by default, including character columns.** `lapply(.SD, mean)` then warns or returns `NA` on non-numeric columns. Pass `.SDcols` explicitly to keep the summary clean.

[TIP]
**Use `by = .(name = expr)` to label the grouping column in the output.** Without a name, data.table calls the column `V1` for unnamed expressions, which is hard to read. Naming inside `by` works the same way as naming inside `j`.

## Try it yourself

**Try it:** Group `airquality` by `Month` and compute the mean `Ozone` (ignoring `NA`) and the row count per month. Save the result to `ex_by`.

```r title="Your turn: group airquality by Month"
# Try it: mean Ozone and row count per Month
ex_by <- as.data.table(airquality)
# your code here

ex_by
#> Expected: 5 rows with columns Month, avg_ozone, n
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_by <- as.data.table(airquality)
ex_by <- ex_by[, .(avg_ozone = mean(Ozone, na.rm = TRUE), n = .N), by = Month]
ex_by
#>    Month avg_ozone     n
#>    <int>     <num> <int>
#> 1:     5  23.61538    31
#> 2:     6  29.44444    30
#> 3:     7  59.11538    31
#> 4:     8  59.96154    31
#> 5:     9  31.44828    30
```

**Explanation:** Wrapping the two summaries in `.()` makes the output a data.table with named columns. `na.rm = TRUE` keeps the means from collapsing to `NA` on months that have missing Ozone readings.

</details>

## Related data.table functions

**`by` is one part of the `DT[i, j, by]` toolkit.** Explore these next:

- `keyby`: identical to `by` but sorts and keys the result.
- `setkey()`: sort and key a table for fast binary-search subsets.
- `.SD` / `.SDcols`: the subset of columns visible inside `j` for each group.
- `frollmean()`: rolling means that compose with `by` for window summaries.
- `dcast()`: pivot the long output of a `by` query into wide form.

See the official [data.table introduction](https://rdatatable.gitlab.io/data.table/articles/datatable-intro.html) for the canonical reference on `DT[i, j, by]`.

## FAQ

**What does the by keyword do in data.table?**

`by` tells data.table to split the rows by one or more columns and run the `j` expression separately on each group. The result is a new data.table with one row per unique value of the grouping columns. Because `by` is the third argument of `DT[i, j, by]`, you can filter and group in a single call, and the grouping happens on the filtered rows.

**What is the difference between by and keyby in data.table?**

Both group the data and evaluate `j` per group; the difference is the order and indexing of the output. `by` returns groups in the order they first appear; `keyby` sorts the result ascending and stores those columns as the table's key. Use `keyby` when the grouped output will be subset, joined, or queried again. Use `by` for one-off summaries.

**How do I group by multiple columns in data.table?**

Wrap the column names in `.()`, for example `dt[, .N, by = .(cyl, gear)]`. You can also pass a character vector, `dt[, .N, by = c("cyl", "gear")]`, which is useful when the names sit in a variable. Both forms produce one row per unique combination, with the grouping columns added to the result.

**Can by accept an expression instead of a column name?**

Yes. `by` accepts any expression that returns a vector the same length as the rows being grouped. `dt[, .N, by = cyl > 6]` groups by the logical result `TRUE` or `FALSE`. Naming the expression with `.()` keeps the output readable, for example `by = .(big_engine = cyl > 6)`. The expression is evaluated once per row.

**Does by sort the result?**

No. Plain `by` returns groups in the order they first appear in the input, which matches the speed of the implementation. Use `keyby` if you need the result sorted by the grouping columns; that form also stores a key, so later subsets and joins on the result use binary search.
