---
title: "data.table fintersect() in R: Set Intersection of Tables"
slug: datatable-fintersect-in-R
description: "Learn data.table fintersect() in R to find rows present in both tables. Covers fintersect syntax, the all argument, whole-row matching, and common pitfalls."
keywords: "data.table fintersect, fintersect function R, data.table fintersect examples, R intersect data.table rows, fintersect vs intersect, data.table set operations, common rows two data.tables"
mathjax: false
webr: true
date: 2026-05-17
post_type: PSEO
category_id: function-deep
subcategory_id: datatable-functions
fr_parent: data-table-vs-dplyr.html
auto_link_terms: "fintersect()|data.table fintersect|data.table::fintersect()|fintersect|set intersection in R"
auto_link_case_sensitive: true
target_keyword: "data.table fintersect"
sibling_block_enabled: true
difficulty: Beginner
---

# data.table fintersect() in R: Set Intersection of Tables

<p class="lead">The data.table fintersect() function in R returns the set intersection of two tables, every row that appears in both. It is the row-wise equivalent of SQL's INTERSECT.</p>

[QUICK ANSWER]
fintersect(x, y)                     # rows present in BOTH tables
fintersect(x, y, all = TRUE)         # keep duplicate matching rows
fintersect(fintersect(x, y), z)      # intersection of three tables
nrow(fintersect(x, y))               # count of common rows
funion(x, y)                         # all unique rows from either
fsetdiff(x, y)                       # rows in x but not in y
intersect(v1, v2)                    # base R intersect for vectors

[DECISION TREE: Is fintersect() the right tool?]
- rows common to both tables: fintersect(x, y)
- rows in either table, deduped: funion(x, y)
- rows in x but not in y: fsetdiff(x, y)
- keep x rows matching y on a key: x[y, on = "id", nomatch = 0]
- test if two tables are equal: fsetequal(x, y)
- overlap of one column only: intersect(x$col, y$col)

## What fintersect() does

**fintersect() returns the set intersection of two tables, every distinct row that appears in both `x` and `y`.** You pass two data.tables with the same columns. The function keeps only the rows whose values match across every column in both inputs, and by default returns each such row once.

It is data.table's tool for finding the overlap between two record sets. A typical case is spotting customers who appear in both a January and a February export. Base R's `intersect()` only works on vectors, so it cannot compare multi-column rows. `fintersect()` fills that gap and runs as compiled C code, which matters once the tables grow large.

[KEY INSIGHT]
**fintersect() compares whole rows, not single columns.** Two rows match only when every column value is equal. A record that exists in both tables but differs in even one field is excluded. This mirrors SQL's `INTERSECT`, where the comparison spans the full row.

## fintersect() syntax

**The call takes two tables and one optional `all` flag.** The signature is `fintersect(x, y, all = FALSE)`. Here `x` and `y` are the tables to compare, and `all` controls how duplicate matching rows are counted.

| Argument | Role |
|---|---|
| `x` | First data.table |
| `y` | Second data.table, same column names and types as `x` |
| `all` | `FALSE` (default) returns each common row once; `TRUE` keeps the minimum number of copies found in either table |

The function returns a new data.table and never modifies `x` or `y` in place. Result rows follow the order they appear in `x`.

```r title="The fintersect call shape"
library(data.table)

dt1 <- data.table(id = 1:4, city = c("NYC", "LA", "Chicago", "Miami"))
dt2 <- data.table(id = 3:6, city = c("Chicago", "Miami", "Boston", "Denver"))
fintersect(dt1, dt2)
#>       id    city
#>    <int>  <char>
#> 1:     3 Chicago
#> 2:     4   Miami
```

Only `(3, Chicago)` and `(4, Miami)` exist in both tables, so the result holds two rows.

## fintersect() examples

**These four examples move from a plain intersection to a real retention task.** The first two build on the `dt1` and `dt2` tables above, so run them in order.

The default call returns each shared row once. Switch `all = TRUE` when you want to keep duplicate matches.

```r title="The all argument keeps duplicate matches"
a <- data.table(x = c("p", "p", "q", "r"))
b <- data.table(x = c("p", "p", "q", "s"))
fintersect(a, b)
#>         x
#>    <char>
#> 1:      p
#> 2:      q
fintersect(a, b, all = TRUE)
#>         x
#>    <char>
#> 1:      p
#> 2:      p
#> 3:      q
```

With `all = TRUE`, `p` appears twice because it occurs twice in both tables, while `q` appears once. The default call drops the repeat.

A common job is finding records that survived unchanged between two snapshots. Here two monthly extracts share users, and `fintersect()` returns the ones whose plan did not change.

```r title="Find users retained without change"
jan <- data.table(user = c("amy", "ben", "cara", "dan"),
                   plan = c("pro", "free", "pro", "free"))
feb <- data.table(user = c("ben", "cara", "dan", "eve"),
                   plan = c("free", "pro", "pro", "free"))
fintersect(jan, feb)
#>      user    plan
#>    <char>  <char>
#> 1:    ben    free
#> 2:   cara     pro
```

`dan` appears in both months but upgraded from free to pro, so the row differs and is excluded. Only `ben` and `cara` match on every column.

[TIP]
**Wrap fintersect() in `nrow()` to count the overlap.** `nrow(fintersect(x, y))` gives the number of shared rows in one expression, a fast way to measure how much two tables overlap without inspecting the result.

You can also intersect subsets pulled from the same source. This example converts the built-in `mtcars` dataset to a data.table and intersects two filtered views.

```r title="Intersect two filtered subsets"
dt <- as.data.table(mtcars, keep.rownames = "model")
high_mpg <- dt[mpg > 25, .(model, mpg, cyl)]
four_cyl <- dt[cyl == 4, .(model, mpg, cyl)]
nrow(high_mpg)
#> [1] 6
nrow(four_cyl)
#> [1] 11
nrow(fintersect(high_mpg, four_cyl))
#> [1] 6
```

Every car with mpg above 25 also has four cylinders, so all six high-mpg rows survive the intersection.

## fintersect vs intersect vs merge

**Pick `fintersect()` for whole-row overlap of two tables, and a join when you need to match on a key.** The functions overlap, but each answers a different question.

| Operation | Compares | Inputs | Best for |
|---|---|---|---|
| `fintersect(x, y)` | Every column | Two data.tables | Rows identical across all columns |
| `intersect(v1, v2)` | Single values | Two vectors | Overlap of one column |
| `merge(x, y)` | Join keys | Tables or frames | Inner join that combines columns |
| `x[y, on = "id", nomatch = 0]` | Key columns only | data.tables | Keep `x` rows that match `y` on a key |
| `fsetdiff(x, y)` | Every column | Two data.tables | Rows in `x` but not in `y` |

The decision rule is short. Comparing complete rows of two tables with identical columns? Use `fintersect()`. Matching on a key while keeping columns from both sides? Use `merge()` or a data.table join.

[NOTE]
**Coming from Python pandas?** The equivalent of `fintersect(x, y)` is `x.merge(y).drop_duplicates()`, an inner merge across all shared columns followed by deduplication.

## Common pitfalls

**Most fintersect() errors trace back to column shape or input type.** These three mistakes cause nearly every failure.

The columns of `x` and `y` must share the same names and types. A mismatch raises an error rather than guessing an alignment.

```r title="Column names must match"
dt_a <- data.table(id = 1:2, name = c("Ann", "Bob"))
dt_b <- data.table(id = 1:2, city = c("Rome", "Oslo"))
fintersect(dt_a, dt_b)
#> Error in fintersect(dt_a, dt_b): x and y must have the same column names
```

The fix is to rename the columns so both tables describe the same fields before calling `fintersect()`.

[WARNING]
**fintersect() compares exactly two tables per call.** Passing a third table is an unused-argument error. For three or more tables, nest the calls as `fintersect(fintersect(x, y), z)`.

Both inputs must be data.tables. A plain data.frame is rejected, so convert it first with `as.data.table()`.

```r title="Inputs must be data.tables"
df1 <- data.frame(id = 3:4, city = c("Chicago", "Miami"))
fintersect(as.data.table(df1), dt2)
#>       id    city
#>    <int>  <char>
#> 1:     3 Chicago
#> 2:     4   Miami
```

## Try it yourself

**Try it:** Find the rows common to two data.tables of stock keeping units, keeping duplicate matches. Save the result to `ex_common`.

```r title="Your turn: intersect two tables"
ex_q1 <- data.table(sku = c("A1", "A1", "B2"), grade = c("x", "x", "y"))
ex_q2 <- data.table(sku = c("A1", "A1", "C3"), grade = c("x", "x", "z"))
ex_common <- # your code here

ex_common
#> Expected: 2 rows
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_common <- fintersect(ex_q1, ex_q2, all = TRUE)
nrow(ex_common)
#> [1] 2
```

**Explanation:** The row `(A1, x)` occurs twice in both tables, so `all = TRUE` keeps both copies. The `(B2, y)` and `(C3, z)` rows have no match and are dropped.

</details>

## Related data.table functions

**fintersect() is one of four data.table set operations.** The others cover the remaining ways to compare two row sets.

- [funion()](datatable-funion-in-R.html) returns every distinct row from either table.
- [fsetdiff()](datatable-fsetdiff-in-R.html) returns rows in the first table but not the second.
- `fsetequal()` tests whether two tables hold exactly the same rows.
- [merge()](datatable-merge-in-R.html) joins two tables on a key and combines their columns.
- [uniqueN()](datatable-uniqueN-in-R.html) counts the distinct rows or values in a table.

For the full reference, see the [data.table set operations documentation](https://rdatatable.gitlab.io/data.table/reference/setops.html).

## FAQ

**What is the difference between fintersect and intersect in R?**

Base R's `intersect()` works on vectors and returns the shared values of a single dimension. data.table's `fintersect()` works on whole tables and compares every column at once. If you call `intersect()` on two data.tables, data.table dispatches to `fintersect()` automatically, so both names give the same row-wise result for data.tables.

**Does fintersect remove duplicate rows?**

By default yes. `fintersect(x, y)` returns each shared row exactly once, even if it appears several times in the inputs. Pass `all = TRUE` to keep duplicates: the result then holds each common row the minimum number of times it appears in either `x` or `y`, matching SQL's `INTERSECT ALL` behavior.

**Why does fintersect return zero rows?**

An empty result means no row matches across every column. Because `fintersect()` compares the full row, a small difference in one field, such as a trailing space, a different column type, or a rounding gap in a numeric value, blocks a match. Inspect both tables with `str()` to confirm the types and values line up.

**Is fintersect faster than merge for finding common rows?**

For finding rows identical across all columns, `fintersect()` is both faster and clearer than an inner `merge()` on every column. `merge()` is built to join on a key and combine columns from both sides, which adds work you do not need when you only want the overlap. Reach for `merge()` when you need columns from both tables, not just the shared rows.
