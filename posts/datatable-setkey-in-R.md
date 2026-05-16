---
title: "data.table setkey() in R: Sort Tables for Fast Lookups"
slug: datatable-setkey-in-R
description: "setkey() in R sorts a data.table by reference and marks key columns, enabling fast binary-search subsetting and joins. See syntax, examples, and pitfalls."
keywords: "data.table setkey, setkey function R, data.table setkey examples, R setkey data.table, set key data.table, setkey vs setorder, setkeyv R"
mathjax: false
webr: true
date: "2026-05-16"
post_type: PSEO
category_id: function-deep
subcategory_id: datatable-functions
fr_parent: data-table-vs-dplyr.html
auto_link_terms: "setkey()|data.table setkey|data.table::setkey()|setkeyv()|set key data.table"
auto_link_case_sensitive: true
target_keyword: "data.table setkey"
sibling_block_enabled: true
difficulty: Beginner
---

# data.table setkey() in R: Sort Tables for Fast Lookups

<p class="lead">The <code>data.table setkey()</code> function sorts a data.table by one or more columns by reference and marks those columns as the key, which turns later subsets and joins into fast binary searches.</p>

[QUICK ANSWER]
setkey(dt, cyl)                    # set a single-column key
setkey(dt, cyl, gear)              # set a multi-column key
setkeyv(dt, c("cyl", "gear"))      # set a key from a character vector
key(dt)                            # see the current key
haskey(dt)                         # TRUE if a key is set
setkey(dt, NULL)                   # remove the key
dt[.(4)]                           # fast keyed subset on cyl == 4

[DECISION TREE: Is setkey() the right tool?]
- sort and key for fast joins: setkey(dt, col)
- just sort, no key needed: setorder(dt, col)
- index without reordering rows: setindex(dt, col)
- read the current key: key(dt)
- test whether a key is set: haskey(dt)
- set a key from a variable: setkeyv(dt, cols)

## What setkey() does in one sentence

**setkey() physically sorts a data.table and tags its key columns.** You pass a data.table and one or more column names, and the table is reordered in ascending order by those columns. The same columns are then recorded as the table's key. Both changes happen by reference, so no copy of the data is made.

A key matters because data.table uses it for binary search. Once `cyl` is the key, a query like `dt[.(4)]` jumps straight to the matching rows instead of scanning every row. The same sorted order also speeds up joins and grouped operations on the key columns.

## Syntax

**setkey() takes unquoted column names; setkeyv() takes a vector.** The two functions do the same job and differ only in how you pass the columns.

```r title="setkey function signature"
setkey(x, ..., physical = TRUE, verbose = getOption("datatable.verbose"))
setkeyv(x, cols, physical = TRUE, verbose = getOption("datatable.verbose"))
```

The arguments are:

- `x`: the data.table to key. It is modified in place, not copied.
- `...`: one or more unquoted column names for `setkey()`. The order you list them is the sort order.
- `cols`: a character vector of column names for `setkeyv()`. Use this when the names live in a variable.
- `physical`: if `TRUE` (default), the rows are physically reordered. `FALSE` sets an index instead, leaving row order untouched.
- `verbose`: if `TRUE`, prints timing details about the sort.

Both functions return the data.table invisibly, so you can chain a query right after the call.

## Examples by use case

**Start by building a data.table and confirming it has no key.** The `mtcars` dataset becomes a data.table with `as.data.table()`.

```r title="Create a data.table"
library(data.table)

dt <- as.data.table(mtcars, keep.rownames = "model")
haskey(dt)
#> [1] FALSE
```

**Set a key on one column to sort and tag it.** After the call, the rows are ordered by `cyl` and `key()` reports the key.

```r title="Set a key on one column"
setkey(dt, cyl)
key(dt)
#> [1] "cyl"
head(dt[, .(model, cyl, mpg)], 3)
#>            model   cyl   mpg
#>           <char> <num> <num>
#> 1:    Datsun 710     4  22.8
#> 2:     Merc 240D     4  24.4
#> 3:      Merc 230     4  22.8
```

**Subset on the key with `.()` to trigger binary search.** Wrapping the value in `.()` tells data.table to match against the key rather than scan a column.

```r title="Subset fast with the key"
nrow(dt[.(4)])
#> [1] 11
dt[.(6), .N]
#> [1] 7
```

**Set a multi-column key when you query on several columns.** List the columns in the order you want the sort applied.

```r title="Set a key on multiple columns"
setkey(dt, cyl, gear)
key(dt)
#> [1] "cyl"  "gear"
dt[.(4, 4), .N]
#> [1] 8
```

**Use setkeyv() when the column names sit in a variable.** This is the form you reach for inside functions and loops.

```r title="Set a key from a variable with setkeyv"
key_cols <- c("gear", "carb")
setkeyv(dt, key_cols)
key(dt)
#> [1] "gear" "carb"
```

## setkey() vs setorder(), setindex() and key()

**setkey() is one of four related tools, and they split along two questions.** Decide whether you need a stored key and whether row order should change.

| Function | Sorts rows? | Stores a key? | Use when |
|---|---|---|---|
| `setkey()` | Yes, ascending | Yes | You query or join on these columns often |
| `setorder()` | Yes, any direction | No | You only need a sort, not a key |
| `setindex()` | No | Yes, as an index | You want fast lookup but must keep row order |
| `key()` | No | Reads it | You only want to see the current key |

The decision rule is short. If you need the table sorted and will subset or join on those columns repeatedly, use `setkey()`. If you just want a one-off sort, use `setorder()`, which also allows descending order. If row order must stay as it is, use `setindex()`.

[KEY INSIGHT]
**A key is a sort order plus a promise.** `setkey()` does not build a separate lookup structure. It sorts the rows and records that they are sorted, so data.table can safely run a binary search instead of a full scan. That is why the data must be physically reordered.

## Common pitfalls

**setkey() reorders rows in place, so the original order is lost.** If you need the incoming order later, save it in a column before keying.

```r title="setkey reorders rows in place"
dt2 <- data.table(id = c(3, 1, 2), val = c("c", "a", "b"))
setkey(dt2, id)
dt2
#>       id    val
#>    <num> <char>
#> 1:     1      a
#> 2:     2      b
#> 3:     3      c
```

[WARNING]
**Save the row order first if you need it back.** Run `dt2[, rn := .I]` before `setkey()`, then `setorder(dt2, rn)` later restores the original sequence. Once the rows are sorted there is no other way to recover the order they arrived in.

**A keyed subset needs `.()`, or it falls back to a slow scan.** Writing `dt2[id == 2]` works but ignores the key; `dt2[.(2)]` uses the binary search the key enables.

```r title="Use the key, not a column scan"
dt2[.(2)]
#>       id    val
#>    <num> <char>
#> 1:     2      b
dt2[id == 2]
#>       id    val
#>    <num> <char>
#> 1:     2      b
```

[TIP]
**Pass column names from a variable to setkeyv(), never setkey().** `setkey(dt, my_var)` keys a column literally named `my_var`, which usually does not exist. `setkeyv(dt, my_var)` reads the names the variable holds. Reach for `setkeyv()` in any function or loop.

## Try it yourself

**Try it:** Convert the `airquality` data.frame to a data.table and set `Month` then `Day` as a two-column key. Save the result to `ex_dt`.

```r title="Your turn: set a compound key"
# Try it: key airquality by Month then Day
ex_dt <- as.data.table(airquality)
# your code here

key(ex_dt)
#> Expected: "Month" "Day"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_dt <- as.data.table(airquality)
setkey(ex_dt, Month, Day)
key(ex_dt)
#> [1] "Month" "Day"
```

**Explanation:** Listing `Month` then `Day` keys both columns and sorts the table by `Month` first, then `Day` within each month. The order you pass the names is the sort priority.

</details>

## Related data.table functions

**setkey() works alongside the rest of data.table's ordering and lookup toolkit.** Explore these next:

- `setkeyv()`: the vector-input version of `setkey()`, for programmatic use.
- `key()`: read the current key of a data.table.
- `haskey()`: test whether a data.table has a key set.
- `setorder()`: sort a data.table by reference without storing a key.
- `setindex()`: build a secondary index without reordering rows.

See the official [setkey reference](https://rdatatable.gitlab.io/data.table/reference/setkey.html) for the complete argument list.

## FAQ

**What does setkey() do in data.table in R?**

`setkey()` sorts a data.table in ascending order by the columns you name and records those columns as the table's key. Both steps happen by reference, with no copy of the data. Once a key is set, data.table can use binary search for subsets like `dt[.(value)]` and for joins, which is far faster than scanning every row.

**What is the difference between setkey() and setorder()?**

Both sort a data.table by reference, but `setkey()` also stores a key and only sorts ascending. `setorder()` stores nothing and can sort descending, for example `setorder(dt, -mpg)`. Use `setkey()` when you will subset or join on those columns repeatedly; use `setorder()` for a one-time sort.

**Does setkey() sort the data.table?**

Yes. By default `setkey()` physically reorders the rows in ascending order by the key columns. This is required, because the key is a promise that the rows are sorted so binary search is valid. If you must keep the current row order, use `setindex()` instead, which builds a lookup index without moving any rows.

**What is the difference between setkey() and setindex()?**

`setkey()` sorts the rows and marks the key, so the table is physically ordered. `setindex()` creates a secondary index that records a sort order without touching the actual rows. Both speed up lookups. Choose `setindex()` when row order matters or when you want fast access on several different column sets at once.

**How do I remove a key from a data.table?**

Call `setkey(dt, NULL)` to drop the key. The rows stay in their current sorted order, but the key tag is removed and `haskey(dt)` returns `FALSE`. Removing a key does not unsort the data; it only tells data.table to stop assuming the rows are ordered.
