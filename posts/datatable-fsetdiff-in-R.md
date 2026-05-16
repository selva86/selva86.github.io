---
title: "data.table fsetdiff() in R: Set Difference of Tables"
slug: datatable-fsetdiff-in-R
description: "Learn data.table fsetdiff() in R to find rows in one table that are not in another. Covers syntax, the all argument, fsetdiff vs setdiff, and pitfalls."
keywords: "data.table fsetdiff, fsetdiff function R, data.table fsetdiff examples, R set difference data.table, fsetdiff vs setdiff, fsetdiff all argument, set difference rows R"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: datatable-functions
fr_parent: data-table-vs-dplyr.html
auto_link_terms: "fsetdiff()|data.table fsetdiff|data.table::fsetdiff()|fsetdiff|set difference in R"
auto_link_case_sensitive: true
target_keyword: "data.table fsetdiff"
sibling_block_enabled: true
difficulty: Beginner
---

# data.table fsetdiff() in R: Set Difference of Tables

<p class="lead">The data.table fsetdiff() function in R returns the rows of one table that are not present in another, the set difference of two tables. It is the row-wise equivalent of SQL's EXCEPT.</p>

[QUICK ANSWER]
fsetdiff(x, y)                       # rows in x not in y, distinct
fsetdiff(x, y, all = TRUE)           # keep duplicate row counts
fsetdiff(new, old)                   # rows added since the old table
fsetdiff(old, new)                   # rows removed since the old table
fsetdiff(DT1[, .(id)], DT2[, .(id)]) # diff on selected columns only
setdiff(v1, v2)                      # vector version, single column

[DECISION TREE: Is fsetdiff() the right tool?]
- rows in one table not another: fsetdiff(x, y)
- rows common to both tables: fintersect(x, y)
- all rows of both, deduplicated: funion(x, y)
- check whether two tables are equal: fsetequal(x, y)
- difference of two plain vectors: setdiff(v1, v2)
- rows of x with no key match in y: x[!y, on = "id"]

## What fsetdiff() does

**fsetdiff() takes the set difference of two tables, returning every row of `x` that does not appear in `y`.** You pass two data.tables with the same columns. The function compares them row by row and keeps the rows from `x` that have no match in `y`.

It is data.table's tool for answering "what changed between these two tables". A typical case is comparing an old snapshot against a new one to list added or removed records. Base R's `setdiff()` only works on vectors, so it cannot compare multi-column rows. `fsetdiff()` fills that gap and runs as fast C code, which matters once the tables grow large.

[KEY INSIGHT]
**fsetdiff() compares whole rows, not single columns.** Two rows match only when every column value is equal. This is exactly how SQL's `EXCEPT` behaves: the difference is computed over the full row, so a table with five columns is diffed across all five at once.

## fsetdiff() syntax

**The call takes two tables and one optional `all` flag.** The signature is `fsetdiff(x, y, all = FALSE)`. Here `x` and `y` are the two tables to compare, and `all` controls whether duplicate rows are kept in the result.

```r title="The fsetdiff call shape"
library(data.table)

x <- data.table(id = 1:4, grp = c("a", "a", "b", "b"))
y <- data.table(id = c(3L, 4L, 5L), grp = c("b", "b", "c"))
fsetdiff(x, y)
#>       id    grp
#>    <int> <char>
#> 1:     1      a
#> 2:     2      a
```

Two rules govern every call. Both tables must have the same number of columns, and matching columns must share a type, because rows are compared position by position. The result keeps the column names and row order of `x`. With the default `all = FALSE`, the output holds only distinct rows, mirroring SQL `EXCEPT`. See the official [data.table set operations reference](https://rdatatable.gitlab.io/data.table/reference/setops.html) for the full argument list.

## fsetdiff() examples

**These examples cover the four most common fsetdiff() tasks.** Each one shows a different real job: a basic two-table difference, finding added rows, finding removed rows, and a duplicate-aware difference.

The first example takes two small tables and keeps the rows of `x` that `y` does not contain. Rows `id = 3` and `id = 4` exist in both, so only the first two rows survive.

```r title="Basic difference of two tables"
sales_a <- data.table(region = c("N", "N", "S", "E"),
                       units  = c(10, 20, 30, 40))
sales_b <- data.table(region = c("S", "E"),
                       units  = c(30, 40))
fsetdiff(sales_a, sales_b)
#>    region units
#>    <char> <num>
#> 1:      N    10
#> 2:      N    20
```

A frequent use is comparing two snapshots to list new records. Here two slices of `mtcars` overlap, and `fsetdiff()` returns the cars present in the newer slice but absent from the older one.

```r title="Find rows added between two snapshots"
cars_v1 <- as.data.table(mtcars, keep.rownames = "model")[1:6, .(model, mpg, cyl)]
cars_v2 <- as.data.table(mtcars, keep.rownames = "model")[4:9, .(model, mpg, cyl)]
fsetdiff(cars_v2, cars_v1)
#>         model   mpg   cyl
#>        <char> <num> <num>
#> 1: Duster 360  14.3     8
#> 2:  Merc 240D  24.4     4
#> 3:   Merc 230  22.8     4
```

Swapping the argument order answers the opposite question: which rows were removed. The same two slices now report the cars that were in the old snapshot but dropped out of the new one.

```r title="Find rows removed between two snapshots"
fsetdiff(cars_v1, cars_v2)
#>            model   mpg   cyl
#>           <char> <num> <num>
#> 1:     Mazda RX4  21.0     6
#> 2: Mazda RX4 Wag  21.0     6
#> 3:    Datsun 710  22.8     4
```

Setting `all = TRUE` switches to multiset semantics, like SQL `EXCEPT ALL`. The default drops duplicates; `all = TRUE` keeps a row as many times as its count in `x` exceeds its count in `y`.

```r title="Keep duplicate rows with all = TRUE"
a <- data.table(v = c(1, 1, 2, 2, 2, 3))
b <- data.table(v = c(1, 2))
fsetdiff(a, b)
#>        v
#>    <num>
#> 1:     3
fsetdiff(a, b, all = TRUE)
#>        v
#>    <num>
#> 1:     1
#> 2:     2
#> 3:     2
#> 4:     3
```

[TIP]
**Reach for `all = TRUE` when row counts carry meaning.** Order lines, log entries, and transaction records often repeat on purpose. With the default `all = FALSE` those repeats collapse to one row, which silently understates the difference. Keep `all = TRUE` whenever each duplicate is a distinct event.

[NOTE]
**Coming from Python pandas?** Pandas has no single set-difference function for rows. The common idiom is a left merge with an indicator, `x.merge(y, how="left", indicator=True)` followed by keeping the rows where `_merge == "left_only"`.

## fsetdiff vs setdiff vs anti_join

**Pick the function that matches your data shape and how rows are compared.** All of these subtract one collection from another, but they differ in what they operate on.

| Function | Package | Operates on | Best for |
|---|---|---|---|
| `fsetdiff()` | data.table | whole rows of tables | row-level difference of two tables |
| `setdiff()` | base R | vectors, single column | difference of two plain vectors |
| `anti_join()` | dplyr | tables, matched by key | rows of `x` with no key match in `y` |
| `fintersect()` | data.table | whole rows of tables | rows common to both tables |

The decision rule is short. Use `fsetdiff()` when you compare entire rows of two tables that share the same columns, and you want the SQL `EXCEPT` behaviour. Drop to base `setdiff()` only for a single vector or one column. Choose `anti_join()` when the two tables have different columns and you want to match on a key rather than on every column. Reach for `fintersect()` when you need the rows the two tables have in common instead of the difference.

## Common pitfalls

**Most fsetdiff() bugs trace back to mismatched columns, argument order, or the silent de-duplication.** All three surface quickly once you know the symptom.

The tables must have the same number of columns. A column-count mismatch fails loudly before any comparison runs.

```r title="Both tables need the same columns"
fsetdiff(x, data.table(id = 1:4))
#> Error in fsetdiff(x, data.table(id = 1:4)) :
#>   x and y must have the same number of columns
```

[WARNING]
**fsetdiff() is not symmetric, so argument order changes the answer.** `fsetdiff(x, y)` and `fsetdiff(y, x)` return different tables. The first lists rows only in `x`; the second lists rows only in `y`. Always put the table you are subtracting from first.

```r title="Argument order is not symmetric"
p <- data.table(v = 1:3)
q <- data.table(v = 2:4)
list(p_minus_q = fsetdiff(p, q)$v,
     q_minus_p = fsetdiff(q, p)$v)
#> $p_minus_q
#> [1] 1
#>
#> $q_minus_p
#> [1] 4
```

Finally, the default `all = FALSE` removes duplicate rows from the result even when nothing in `y` matched them. Here `y` is empty, yet the repeated `5` collapses to a single row.

```r title="The default drops duplicate rows"
dups <- data.table(v = c(5, 5, 6))
fsetdiff(dups, data.table(v = numeric(0)))
#>        v
#>    <num>
#> 1:     5
#> 2:     6
```

## Try it yourself

**Try it:** You have two product catalogs, catalog_2023 and catalog_2024. Use fsetdiff() to find the SKUs that appear in catalog_2024 but were not in catalog_2023, the new arrivals. Save the result to ex_new.

```r title="Your turn: find new products"
catalog_2023 <- data.table(sku = c("A1", "B2", "C3"))
catalog_2024 <- data.table(sku = c("B2", "C3", "D4", "E5"))
ex_new <- # your code here

ex_new
#> Expected: D4 and E5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
catalog_2023 <- data.table(sku = c("A1", "B2", "C3"))
catalog_2024 <- data.table(sku = c("B2", "C3", "D4", "E5"))
ex_new <- fsetdiff(catalog_2024, catalog_2023)
ex_new
#>       sku
#>    <char>
#> 1:     D4
#> 2:     E5
```

**Explanation:** Passing the newer table as `x` and the older one as `y` returns the rows that exist only in the newer catalog. `B2` and `C3` appear in both, so they are subtracted out, leaving the two genuinely new SKUs.

</details>

## Related data.table functions

**fsetdiff() is one of data.table's four fast set operations.** These functions pair well with it for combining and comparing tables:

- `funion()`: stack two tables and drop duplicate rows. See [data.table funion in R](datatable-funion-in-R.html).
- `fintersect()`: keep only the rows common to both tables. See [data.table fintersect in R](datatable-fintersect-in-R.html).
- `uniqueN()`: count the distinct rows or values in a result. See [data.table uniqueN in R](datatable-uniqueN-in-R.html).
- `rbindlist()`: combine many tables into one before a diff. See [data.table rbindlist in R](datatable-rbindlist-in-R.html).
- `merge()`: key-based join when the tables have different columns. See [data.table merge in R](datatable-merge-in-R.html).

## FAQ

**What is the difference between fsetdiff() and setdiff()?**

Base R's `setdiff()` works on vectors, so it can only compare one column of values at a time. `fsetdiff()` works on whole tables and compares every row across all of its columns at once. If you pass single-column tables, the two return equivalent results, but `fsetdiff()` keeps the data.table structure and runs as optimized C code. Use `setdiff()` for plain vectors and `fsetdiff()` whenever the comparison spans more than one column.

**Does fsetdiff() keep duplicate rows?**

Not by default. With `all = FALSE`, which is the default, the result holds only distinct rows, exactly like SQL `EXCEPT`. Set `all = TRUE` to switch to multiset semantics, like SQL `EXCEPT ALL`. In that mode a row appears in the output as many times as its count in `x` exceeds its count in `y`. Choose `all = TRUE` when each duplicate is a separate, meaningful record such as an order line or a log event.

**Can fsetdiff() compare data.frames, not just data.tables?**

Yes. `fsetdiff()` accepts plain data.frames as well as data.tables, and it returns a data.table either way. The only requirement is that both inputs have the same number of columns and that matching columns share a type. If you work mainly with data.frames, you can call `fsetdiff()` directly without converting first, though converting once with `setDT()` is worth it when you run many operations.

**Why does fsetdiff() return a different result when I swap the arguments?**

Because set difference is directional. `fsetdiff(x, y)` returns rows that are in `x` but not in `y`, while `fsetdiff(y, x)` returns rows in `y` but not in `x`. The two answers are different sets, so the order of arguments is not interchangeable. When comparing an old and a new table, decide which question you are asking: pass the new table first to find added rows, and the old table first to find removed rows.
</content>
</invoke>
