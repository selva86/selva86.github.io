---
title: "data.table Keys in R: Fast Joins and Subsetting"
slug: datatable-key-in-R
description: "A data.table key in R is a sorted set of columns that lets data.table use binary search for fast subsets and joins. See how to set, read, and use keys."
keywords: "data.table key, data.table key column, R data.table set key, data.table keyed join, data.table key vs index, key function data.table, data.table binary search"
mathjax: false
webr: true
date: "2026-05-16"
post_type: PSEO
category_id: function-deep
subcategory_id: datatable-functions
fr_parent: data-table-vs-dplyr.html
auto_link_terms: "data.table key|key()|data.table::key()|keyed data.table|haskey()"
auto_link_case_sensitive: true
target_keyword: "data.table key"
sibling_block_enabled: true
difficulty: Beginner
---

# data.table Keys in R: Fast Joins and Subsetting

<p class="lead">A <code>data.table key</code> in R is one or more columns the table is sorted by and tagged on, which lets data.table use binary search for fast subsetting and joins instead of scanning every row.</p>

[QUICK ANSWER]
setkey(dt, id)              # set id as the key
key(dt)                     # read the current key
haskey(dt)                  # TRUE if a key is set
dt[.(4)]                    # keyed subset by binary search
X[Y]                        # keyed join of two data.tables
dt[.(4), on = "cyl"]        # ad-hoc lookup, no key needed
setkey(dt, NULL)            # remove the key

[DECISION TREE: Do you need a key on this data.table?]
- repeated joins or subsets on the same cols: setkey(dt, cols)
- one ad-hoc join, no reuse: dt[Y, on = "id"]
- fast lookup but keep row order: setindex(dt, cols)
- sort the rows once, no key: setorder(dt, col)
- check if a key already exists: haskey(dt)
- see which columns are keyed: key(dt)

## What a key is in data.table

**A key is a sort order plus a tag that data.table trusts.** When you set a key, the rows are physically sorted in ascending order by the key columns, and data.table records those columns as the key. Because the rows are now known to be sorted, data.table can run a binary search to find matching rows instead of scanning the whole column.

That difference is the whole point. A linear scan checks every row, so it costs time proportional to the number of rows. A binary search on a keyed column jumps to the answer in a number of steps proportional to the logarithm of the row count. On large tables this turns a slow query into an instant one, and it speeds up joins on the key columns too.

```r title="Build a keyed data.table"
library(data.table)

dt <- as.data.table(mtcars, keep.rownames = "model")
setkey(dt, cyl)
key(dt)
#> [1] "cyl"
haskey(dt)
#> [1] TRUE
```

[KEY INSIGHT]
**A key is a promise, not a separate lookup table.** `setkey()` does not build an index structure on the side. It sorts the rows and records that they are sorted, so a binary search is mathematically valid. That is why keying always reorders the data.

## Setting, reading, and removing a key

**Three small functions cover the whole key lifecycle.** You set a key with `setkey()`, inspect it with `key()` and `haskey()`, and drop it by keying on `NULL`.

```r title="Read, check, and remove a key"
key(dt)
#> [1] "cyl"
haskey(dt)
#> [1] TRUE
setkey(dt, NULL)
key(dt)
#> NULL
```

`key()` returns a character vector of the key columns, or `NULL` when no key is set. `haskey()` returns a single `TRUE` or `FALSE`, which is handy inside `if` statements. Removing a key with `setkey(dt, NULL)` leaves the rows in their current sorted order but tells data.table to stop assuming they are ordered. For the full argument list of the setter, see the dedicated guide to the `setkey()` function.

## Keyed subsetting and joins

**A key speeds up two operations: subsetting one table and joining two.** Both use the sorted key columns to run a binary search instead of a full scan.

### Subset rows with `.()`

**Wrap a value in `.()` to match it against the key.** The `.()` notation is data.table shorthand for `list()`. Inside `i`, it tells data.table to look the value up in the key columns by binary search rather than scan a column.

```r title="Keyed subset with binary search"
setkey(dt, cyl)
dt[.(4), .(model, mpg)]
#>             model   mpg
#>            <char> <num>
#> 1:     Datsun 710  22.8
#> 2:      Merc 240D  24.4
#> 3:       Merc 230  22.8
#> 4:       Fiat 128  32.4
#> 5:    Honda Civic  30.4
#> 6: Toyota Corolla  33.9
#> 7:  Toyota Corona  21.5
#> 8:      Fiat X1-9  27.3
#> 9:  Porsche 914-2  26.0
#> 10:   Lotus Europa  30.4
#> 11:     Volvo 142E  21.4
```

### Join two data.tables

**When both tables are keyed, `X[Y]` joins them on the key.** This is the classic data.table join. For each row of `Y`, data.table finds the matching rows of `X` through the key, with no `by` argument needed.

```r title="Keyed join of two tables"
X <- data.table(id = c(1, 2, 3), x = c("a", "b", "c"))
Y <- data.table(id = c(2, 3, 4), y = c(20, 30, 40))
setkey(X, id)
setkey(Y, id)
X[Y]
#>       id      x     y
#>    <num> <char> <num>
#> 1:     2      b    20
#> 2:     3      c    30
#> 3:     4   <NA>    40
```

The result keeps every row of `Y` and pulls in the matching `x` value from `X`. Row `id = 4` has no match in `X`, so `x` is filled with `NA`.

[TIP]
**Key once, query many times.** Setting a key has a one-time sort cost. Every subset and join on the key columns afterward is fast, so keying pays off when you reuse the same lookup columns across a script.

## Keys vs secondary indexes

**A data.table can have one key but many secondary indexes.** A key sorts the rows; a secondary index records a sort order without moving any rows. Indexes are created with `setindex()`, and the `on=` argument lets you join or subset on any columns, using an index automatically if one exists.

```r title="Ad-hoc lookup with on= needs no key"
setkey(dt, NULL)
dt[.(6), .N, on = "cyl"]
#> [1] 7
```

| Feature | Key | Secondary index |
|---|---|---|
| Reorders rows | Yes | No |
| How many per table | One | Many |
| Set with | `setkey()` | `setindex()` |
| Used by | `dt[.(v)]` and joins | `dt[.(v), on=]` |

The decision rule is short. Use a key when one set of columns drives most of your subsets and joins. Use secondary indexes when you query several different column sets, or when row order must stay as it is.

## Common pitfalls

**A key matches `.()` values by position, not by name.** With a two-column key, passing one value matches only the first key column.

```r title="Partial key match uses leading columns"
setkey(dt, cyl, gear)
dt[.(4), .N]
#> [1] 11
dt[.(4, 4), .N]
#> [1] 8
```

[WARNING]
**A key does not enforce uniqueness.** Unlike a SQL primary key, a data.table key happily allows duplicate values in the key columns. If you need unique rows, call `unique(dt, by = key(dt))` yourself; setting a key will not deduplicate anything.

A third trap is forgetting the key entirely. Writing `dt[.(4)]` on an unkeyed table raises an error, because data.table has no sorted column to search. Either set a key first, or pass `on=` to do an ad-hoc lookup without one.

## Try it yourself

**Try it:** Convert `airquality` to a data.table, set `Month` as the key, then count the rows where `Month` is 7. Save the count to `ex_count`.

```r title="Your turn: key and subset airquality"
# Try it: key airquality by Month, then count Month 7
ex_dt <- as.data.table(airquality)
ex_count <- # your code here

ex_count
#> Expected: 31
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_dt <- as.data.table(airquality)
setkey(ex_dt, Month)
ex_count <- ex_dt[.(7), .N]
ex_count
#> [1] 31
```

**Explanation:** `setkey(ex_dt, Month)` sorts the table and tags `Month` as the key. `ex_dt[.(7), .N]` then uses binary search to find every July row and `.N` counts them.

</details>

## Related data.table functions

**Keys connect to the rest of data.table's ordering and lookup toolkit.** Explore these next:

- `setkey()`: sort a data.table by reference and set the key columns.
- `key()`: read the current key, returning `NULL` when none is set.
- `haskey()`: test whether a data.table has a key.
- `setindex()`: build a secondary index without reordering rows.
- `setorder()`: sort by reference without storing a key.

See the official [data.table keys and indexes vignette](https://rdatatable.gitlab.io/data.table/articles/datatable-keys-fast-subset.html) for a deeper reference.

## FAQ

**What is a key in data.table in R?**

A key in data.table is one or more columns that the table is sorted by and tagged on. Setting a key with `setkey()` physically reorders the rows in ascending order and records the columns as the key. Once a key exists, data.table runs a binary search for subsets like `dt[.(value)]` and for joins, which is far faster than scanning every row on a large table.

**How do I set a key on a data.table?**

Call `setkey(dt, col)` with one or more unquoted column names, or `setkeyv(dt, cols)` when the names sit in a character vector. Both modify the table by reference, with no copy. The order you list the columns is the sort priority. After the call, `key(dt)` reports the key and the rows are sorted accordingly.

**What is the difference between a key and a secondary index?**

A key physically sorts the rows and a table can have only one. A secondary index, set with `setindex()`, records a sort order without moving any rows, and a table can hold many. Keys power `dt[.(v)]` and keyed joins directly; indexes are used by queries that pass the `on=` argument. Choose an index when row order must stay fixed.

**Does a data.table key have to be unique?**

No. A data.table key does not enforce uniqueness, so duplicate values in the key columns are allowed. This differs from a SQL primary key. If you need unique rows, run `unique(dt, by = key(dt))` explicitly. The key only guarantees the rows are sorted, which is what makes binary search valid.

**How do I remove a key from a data.table?**

Call `setkey(dt, NULL)` to drop the key. The rows keep their current sorted order, but the key tag is removed and `haskey(dt)` returns `FALSE`. Removing a key does not unsort the data; it only tells data.table to stop assuming the rows are ordered, so later keyed subsets will need a fresh key or an `on=` clause.
</content>
</invoke>
