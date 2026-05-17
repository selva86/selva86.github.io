---
title: "data.table funion() in R: Fast Set Union of Tables"
slug: datatable-funion-in-R
description: "Learn data.table funion() in R to compute the set union of two tables, returning every unique row. Covers funion syntax, the all argument, and common pitfalls."
keywords: "data.table funion, funion function R, data.table funion examples, R set union data.table, funion vs union, data.table set operations, combine data.tables unique rows"
mathjax: false
webr: true
date: 2026-05-17
post_type: PSEO
category_id: function-deep
subcategory_id: datatable-functions
fr_parent: data-table-vs-dplyr.html
auto_link_terms: "funion()|data.table funion|data.table::funion()|funion|fast set union in R"
auto_link_case_sensitive: true
target_keyword: "data.table funion"
sibling_block_enabled: true
difficulty: Beginner
---

# data.table funion() in R: Fast Set Union of Tables

<p class="lead">The data.table funion() function in R computes the fast set union of two tables, returning every unique row found in either one. It is the row-wise equivalent of SQL's UNION.</p>

[QUICK ANSWER]
funion(x, y)                         # union, duplicate rows removed
funion(x, y, all = TRUE)             # union all, duplicate rows kept
funion(funion(x, y), z)              # union of three tables, nested
fintersect(x, y)                     # rows present in BOTH tables
fsetdiff(x, y)                       # rows in x but not in y
fsetequal(x, y)                      # TRUE if both hold the same rows
union(v1, v2)                        # base R union for plain vectors

[DECISION TREE: Is funion() the right tool?]
- combine two tables, drop duplicates: funion(x, y)
- combine two tables, keep every row: funion(x, y, all = TRUE)
- stack many tables fast: rbindlist(list(x, y, z))
- rows common to both tables: fintersect(x, y)
- rows in one table but not the other: fsetdiff(x, y)
- drop duplicate rows within one table: unique(x)

## What funion() does

**funion() returns the set union of two tables, every distinct row that appears in `x`, `y`, or both.** You pass two data.tables with the same columns. The function stacks their rows and, by default, removes any duplicate so each unique row appears once.

It is data.table's answer to merging two record sets without double-counting overlaps. A typical case is combining two monthly extracts where some customers appear in both files. Base R's `union()` only works on vectors, so it cannot deduplicate multi-column rows. `funion()` fills that gap and runs as compiled C code, which matters once the tables grow large.

[KEY INSIGHT]
**funion() compares whole rows, not single columns.** Two rows count as duplicates only when every column value is equal. This mirrors SQL's `UNION`: the deduplication runs over the full row, so a table with five columns is compared across all five at once.

## funion() syntax

**The call takes two tables and one optional `all` flag.** The signature is `funion(x, y, all = FALSE)`. Here `x` and `y` are the two tables to combine, and `all` controls whether duplicate rows survive into the result.

| Argument | Role |
|---|---|
| `x` | First data.table |
| `y` | Second data.table, same column names and types as `x` |
| `all` | `FALSE` (default) drops duplicate rows; `TRUE` keeps them (UNION ALL) |

The function returns a new data.table and never modifies `x` or `y` in place. Unlike SQL, data.table preserves row order: rows of `x` come first, then the new rows from `y`.

```r title="The funion call shape"
library(data.table)

dt1 <- data.table(id = 1:3, city = c("NYC", "LA", "Chicago"))
dt2 <- data.table(id = 3:5, city = c("Chicago", "Miami", "Boston"))
funion(dt1, dt2)
#>       id    city
#>    <int>  <char>
#> 1:     1     NYC
#> 2:     2      LA
#> 3:     3 Chicago
#> 4:     4   Miami
#> 5:     5  Boston
```

The shared row `(3, Chicago)` appears once. The result holds five rows, not six.

## funion() examples

**These four examples move from a plain union to a real deduplication task.** Each block builds on the `dt1` and `dt2` tables created above, so run them in order.

The default call removes duplicates. Switch `all = TRUE` when you want a straight UNION ALL that keeps every copy.

```r title="Union all keeps duplicate rows"
funion(dt1, dt2, all = TRUE)
#>       id    city
#>    <int>  <char>
#> 1:     1     NYC
#> 2:     2      LA
#> 3:     3 Chicago
#> 4:     3 Chicago
#> 5:     4   Miami
#> 6:     5  Boston
```

The Chicago row now appears twice, once from each table. Use this when you need the combined row count to equal `nrow(x) + nrow(y)`.

A common job is merging two overlapping snapshots into one clean table. Here two weekly extracts share members, and `funion()` collapses them to the distinct set.

```r title="Deduplicate two weekly extracts"
week1 <- data.table(user = c("amy", "ben", "cara"),
                     plan = c("pro", "free", "pro"))
week2 <- data.table(user = c("ben", "cara", "dan"),
                     plan = c("free", "pro", "free"))
combined <- funion(week1, week2)
nrow(combined)
#> [1] 4
combined
#>      user    plan
#>    <char>  <char>
#> 1:    amy     pro
#> 2:    ben    free
#> 3:   cara     pro
#> 4:    dan    free
```

Six input rows collapse to four because `ben` and `cara` appear identically in both weeks.

[TIP]
**funion() beats `unique(rbind(x, y))` on large data.** Both produce the same deduplicated result, but `funion()` runs the stack and the deduplication in one optimized C pass, so it scales better as row counts climb into the millions.

You can also union subsets pulled from the same source. This example converts the built-in `mtcars` dataset to a data.table and unions two filtered views.

```r title="Union two filtered subsets"
dt <- as.data.table(mtcars, keep.rownames = "model")
high_mpg <- dt[mpg > 30, .(model, mpg, cyl)]
four_cyl <- dt[cyl == 4, .(model, mpg, cyl)]
nrow(high_mpg)
#> [1] 4
nrow(four_cyl)
#> [1] 11
nrow(funion(high_mpg, four_cyl))
#> [1] 11
```

Every high-mpg car is also a 4-cylinder car, so the union deduplicates the four overlapping rows down to the 11 distinct ones.

## funion vs union vs rbindlist

**Pick `funion()` for a two-table deduplicated combine, and `rbindlist()` for fast raw stacking of many tables.** The three functions overlap, but each is tuned for a different job.

| Operation | Removes duplicates? | Inputs | Best for |
|---|---|---|---|
| `funion(x, y)` | Yes | Two data.tables | Distinct union of two tables |
| `funion(x, y, all = TRUE)` | No | Two data.tables | UNION ALL of two tables |
| `rbindlist(list(x, y, z))` | No | Many tables in a list | Fast stacking, no dedup |
| `unique(rbind(x, y))` | Yes | data.frames | Small data, base R only |
| `union(v1, v2)` | Yes | Two vectors | Single-column sets |

The decision rule is simple. Combining exactly two tables and want unique rows? Use `funion()`. Stacking three or more tables, or speed matters more than deduplication? Use `rbindlist()` and call `unique()` afterward only if needed.

[NOTE]
**Coming from Python pandas?** The equivalent of `funion(x, y)` is `pd.concat([x, y]).drop_duplicates()`, and `funion(x, y, all = TRUE)` is a plain `pd.concat([x, y])`.

## Common pitfalls

**Most funion() errors trace back to column shape or input type.** These three mistakes account for nearly every failure.

The columns of `x` and `y` must share the same names and types. A mismatch raises an error rather than guessing an alignment.

```r title="Column names must match"
dt_a <- data.table(id = 1:2, name = c("Ann", "Bob"))
dt_b <- data.table(id = 3:4, city = c("Rome", "Oslo"))
funion(dt_a, dt_b)
#> Error in funion(dt_a, dt_b): x and y must have the same column names
```

The fix is to rename the columns so both tables describe the same fields before calling `funion()`.

[WARNING]
**funion() combines exactly two tables per call.** Passing a third table is an unused-argument error. For three or more tables, nest the calls as `funion(funion(x, y), z)`, or use `unique(rbindlist(list(x, y, z)))`.

Both inputs must be data.tables. A plain data.frame is not accepted, so convert it first with `as.data.table()`.

```r title="Inputs must be data.tables"
df1 <- data.frame(id = 1:2, city = c("NYC", "LA"))
funion(as.data.table(df1), dt2)
#>       id    city
#>    <int>  <char>
#> 1:     1     NYC
#> 2:     2      LA
#> 3:     3 Chicago
#> 4:     4   Miami
#> 5:     5  Boston
```

## Try it yourself

**Try it:** Union two data.tables of stock keeping units, keeping every row including duplicates. Save the result to `ex_union`.

```r title="Your turn: union all of two tables"
ex_q1 <- data.table(sku = c("A1", "B2"), qty = c(5L, 3L))
ex_q2 <- data.table(sku = c("B2", "C3"), qty = c(3L, 7L))
ex_union <- # your code here

ex_union
#> Expected: 4 rows
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_union <- funion(ex_q1, ex_q2, all = TRUE)
nrow(ex_union)
#> [1] 4
```

**Explanation:** With `all = TRUE`, funion() keeps every row from both tables, so the identical `(B2, 3)` row appears twice and the result has four rows. Dropping `all = TRUE` would deduplicate it down to three.

</details>

## Related data.table functions

**funion() is one of four data.table set operations.** The others handle the remaining ways to compare two row sets.

- [fintersect()](datatable-fintersect-in-R.html) returns rows present in both tables.
- [fsetdiff()](datatable-fsetdiff-in-R.html) returns rows in the first table but not the second.
- `fsetequal()` tests whether two tables hold exactly the same rows.
- [rbindlist()](datatable-rbindlist-in-R.html) stacks many tables fast without removing duplicates.
- [uniqueN()](datatable-uniqueN-in-R.html) counts the distinct rows or values in a table.

For the full reference, see the [data.table set operations documentation](https://rdatatable.gitlab.io/data.table/reference/setops.html).

## FAQ

**What is the difference between funion and union in R?**

Base R's `union()` works on vectors and returns the distinct combined values of a single dimension. data.table's `funion()` works on whole tables and deduplicates across every column at once. If you call `union()` on two data.tables, data.table dispatches to `funion()` automatically, so the two names point to the same row-wise behavior for data.tables.

**Does funion remove duplicate rows?**

Yes, by default. With `all = FALSE` (the default), `funion()` returns each distinct row only once, even if it appeared in both input tables. Pass `all = TRUE` to keep every copy, which gives the equivalent of SQL's `UNION ALL` and makes the result row count equal `nrow(x) + nrow(y)`.

**What does the all argument do in funion?**

The `all` argument controls duplicate handling. When `all = FALSE`, duplicate rows are collapsed to one. When `all = TRUE`, all copies are retained, including rows duplicated within a single input table. Use `TRUE` when row counts must be preserved, for example when each row represents a separate transaction.

**Can funion combine data.tables with different columns?**

No. `funion()` requires both tables to have the same column names and the same column types. A mismatch raises an error rather than attempting an alignment. Rename or reorder columns so the two tables describe identical fields before calling `funion()`.

**Is funion faster than rbind?**

For a deduplicated union, `funion()` is faster than `unique(rbind(x, y))` because it combines the stack and the deduplication into one optimized C pass. If you only need to stack tables without removing duplicates, `rbindlist()` is the fastest option and also accepts more than two tables at once.
