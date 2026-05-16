---
title: "data.table setorder() in R: Sort Rows by Reference"
slug: datatable-setorder-in-R
description: "setorder() in R sorts a data.table or data.frame by reference, ascending or descending, with no copy. See syntax, examples, mixed-order sorts, and pitfalls."
keywords: "data.table setorder, setorder function R, data.table setorder examples, R sort data.table, setorder vs setkey, setorderv R"
mathjax: false
webr: true
date: "2026-05-16"
post_type: PSEO
category_id: function-deep
subcategory_id: datatable-functions
fr_parent: data-table-vs-dplyr.html
auto_link_terms: "setorder()|data.table setorder|data.table::setorder()|setorderv()|sort a data.table"
auto_link_case_sensitive: true
target_keyword: "data.table setorder"
sibling_block_enabled: true
difficulty: Beginner
---

# data.table setorder() in R: Sort Rows by Reference

<p class="lead">The <code>data.table setorder()</code> function sorts a data.table by one or more columns by reference, ascending or descending, without making a copy of the data.</p>

[QUICK ANSWER]
setorder(dt, mpg)                      # ascending sort
setorder(dt, -mpg)                     # descending sort
setorder(dt, cyl, -mpg)                # cyl up, mpg down
setorderv(dt, "mpg")                   # column name as a string
setorderv(dt, c("cyl","mpg"), c(1,-1)) # vector of columns and directions
setorder(df, mpg)                      # works on a data.frame too
setorder(dt, Ozone, na.last = TRUE)    # push NA values to the end

[DECISION TREE: Is setorder() the right tool?]
- sort a data.table by columns: setorder(dt, col)
- sort and store a key for joins: setkey(dt, col)
- get sort indices without reordering: order(dt$col)
- sort by a computed expression: dt[order(-col1 / col2)]
- rank values within the table: frank(dt, col)
- sort by column names held in a variable: setorderv(dt, cols)

## What setorder() does in one sentence

**setorder() reorders the rows of a data.table in place.** You pass a data.table and one or more column names, and the rows are sorted by those columns without any copy being made. The function returns the table invisibly, so the change is permanent on the object you passed.

By default the sort is ascending. Prefix a column with a minus sign to sort it descending. Because the work happens by reference, `setorder()` is both fast and memory-light on large tables, which is why data.table provides it instead of relying on base R's `order()`.

## Syntax

**setorder() takes bare column names; setorderv() takes a character vector.** The two functions do the same job and differ only in how you name the sort columns.

```r title="setorder function signature"
setorder(x, ..., na.last = FALSE)
setorderv(x, cols = NULL, order = 1L, na.last = FALSE)
```

The arguments are:

- `x`: the data.table or data.frame to sort. It is modified in place, not copied.
- `...`: one or more unquoted column names for `setorder()`. Prefix a name with `-` to sort it descending.
- `cols`: a character vector of column names for `setorderv()`. Use this when the names live in a variable.
- `order`: for `setorderv()`, `1` for ascending or `-1` for descending. Pass a vector to set a direction per column.
- `na.last`: where to place `NA` values. `FALSE` (the default) sends them to the front; `TRUE` sends them to the end.

## Examples by use case

**Start by turning a data.frame into a data.table.** The `mtcars` dataset becomes a data.table with `as.data.table()`, keeping the row names in a `model` column.

```r title="Create a data.table"
library(data.table)

dt <- as.data.table(mtcars, keep.rownames = "model")
nrow(dt)
#> [1] 32
```

**Sort ascending, then descending, on a single column.** A plain column name sorts low to high; a `-` prefix flips it.

```r title="Sort one column up or down"
setorder(dt, mpg)
head(dt[, .(model, mpg)], 2)
#>                  model   mpg
#>                 <char> <num>
#> 1:  Cadillac Fleetwood  10.4
#> 2: Lincoln Continental  10.4

setorder(dt, -mpg)
head(dt[, .(model, mpg)], 2)
#>             model   mpg
#>            <char> <num>
#> 1: Toyota Corolla  33.9
#> 2:       Fiat 128  32.4
```

**Sort several columns with mixed directions.** List the columns in priority order and prefix each one you want descending.

```r title="Sort by cyl ascending then mpg descending"
setorder(dt, cyl, -mpg)
head(dt[, .(model, cyl, mpg)], 3)
#>             model   cyl   mpg
#>            <char> <num> <num>
#> 1: Toyota Corolla     4  33.9
#> 2:       Fiat 128     4  32.4
#> 3:    Honda Civic     4  30.4
```

**Use setorderv() when the column names sit in a variable.** This is the form you reach for inside functions and loops.

```r title="Sort from a variable with setorderv"
sort_cols <- c("cyl", "wt")
setorderv(dt, sort_cols)
head(dt[, .(model, cyl, wt)], 3)
#>           model   cyl    wt
#>          <char> <num> <num>
#> 1: Lotus Europa     4 1.513
#> 2:  Honda Civic     4 1.615
#> 3:   Datsun 710     4 2.320
```

[TIP]
**Pass column names from a variable to setorderv(), never setorder().** `setorder(dt, my_var)` looks for a column literally named `my_var`, which usually does not exist. `setorderv(dt, my_var)` reads the names the variable holds. Reach for `setorderv()` in any function or loop.

**setorder() also works on a plain data.frame.** Since data.table 1.9.5 you can sort a base data.frame in place, row names included.

```r title="Sort a data.frame in place"
df <- mtcars
setorder(df, -mpg)
head(df[, c("mpg", "cyl")], 2)
#>                 mpg cyl
#> Toyota Corolla 33.9   4
#> Fiat 128       32.4   4
```

## setorder() vs setkey(), order() and arrange()

**setorder() is one of several sorting tools, and they split along two questions.** Decide whether the sort should happen by reference and whether you also need a stored key.

| Function | Sorts by reference? | Direction | Stores a key? |
|---|---|---|---|
| `setorder()` | Yes | Ascending or descending | No |
| `setkey()` | Yes | Ascending only | Yes |
| `order()` | No, returns indices | Ascending or descending | No |
| `dplyr::arrange()` | No, copies the data | Ascending or descending | No |

The decision rule is short. Use `setorder()` for a fast in-place sort in any direction. Use `setkey()` when you will subset or join on those columns repeatedly and want the key stored. Use `order()` when you need the sort indices rather than a sorted table, for example to reorder a related vector. Use `arrange()` when you are working in a dplyr pipeline and want a fresh copy.

[KEY INSIGHT]
**By reference means no copy is made.** `setorder()` rearranges the rows of the existing object rather than building a sorted duplicate. That saves time and memory on large tables, but it also means there is no separate "sorted version" to fall back on. The original order is gone once the call returns.

[NOTE]
**Coming from Python pandas?** The equivalent of `setorder(dt, mpg)` is `df.sort_values('mpg', inplace=True)`, and `setorder(dt, -mpg)` maps to `df.sort_values('mpg', ascending=False, inplace=True)`.

## Common pitfalls

**setorder() changes every name that points to the same table.** Assigning a data.table to a new variable does not copy it, so sorting through one name sorts the other.

```r title="setorder changes the original object"
dt_a <- data.table(x = c(3, 1, 2))
dt_b <- dt_a
setorder(dt_b, x)
dt_a
#>        x
#>    <num>
#> 1:     1
#> 2:     2
#> 3:     3
```

[WARNING]
**Use copy() before setorder() if you need the original order.** `dt_b <- copy(dt_a)` makes an independent table, so sorting `dt_b` leaves `dt_a` untouched. Without `copy()`, both names share one object and both get sorted.

**setorder() cannot sort by a computed expression.** It only accepts column names. To sort by something like a ratio, use base `order()` inside the data.table `i` argument.

```r title="Sort by an expression with order()"
dt <- as.data.table(mtcars, keep.rownames = "model")
dt[order(-mpg / wt)][1:2, .(model, mpg, wt)]
#>           model   mpg    wt
#>          <char> <num> <num>
#> 1: Lotus Europa  30.4 1.513
#> 2:  Honda Civic  30.4 1.615
```

**setorder() sends NA values to the front by default.** This is the opposite of base `order()`, which keeps `NA` last. Set `na.last = TRUE` to match the familiar behaviour.

```r title="Control where NA values land"
aq <- as.data.table(airquality)
setorder(aq, Ozone)
head(aq$Ozone, 3)
#> [1] NA NA NA

setorder(aq, Ozone, na.last = TRUE)
head(aq$Ozone, 3)
#> [1] 1 4 6
```

## Try it yourself

**Try it:** Convert the `airquality` data.frame to a data.table and sort it by `Temp` descending. Save the result to `ex_dt`.

```r title="Your turn: sort by Temp descending"
# Try it: sort airquality by Temp, hottest first
ex_dt <- as.data.table(airquality)
# your code here

head(ex_dt$Temp, 3)
#> Expected: 97 96 94
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_dt <- as.data.table(airquality)
setorder(ex_dt, -Temp)
head(ex_dt$Temp, 3)
#> [1] 97 96 94
```

**Explanation:** The `-` prefix on `Temp` sorts the column from high to low. Because `setorder()` works by reference, `ex_dt` itself is reordered and no copy is created.

</details>

## Related data.table functions

**setorder() works alongside the rest of data.table's ordering toolkit.** Explore these next:

- `setorderv()`: the vector-input version of `setorder()`, for programmatic use.
- `setkey()`: sort by reference and also store the columns as a key.
- `setcolorder()`: reorder the columns of a data.table, not the rows.
- `frank()`: compute fast ranks of values without reordering rows.
- `order()`: return sort indices, useful inside the data.table `i` argument.

See the official [setorder reference](https://rdatatable.gitlab.io/data.table/reference/setorder.html) for the complete argument list.

## FAQ

**What does setorder() do in data.table in R?**

`setorder()` sorts the rows of a data.table by one or more columns. The sort happens by reference, meaning the existing object is rearranged in place and no copy is created. By default the sort is ascending, and the function returns the table invisibly so you can chain a query after it.

**How do I sort a data.table in descending order?**

Prefix the column name with a minus sign: `setorder(dt, -mpg)` sorts `mpg` from high to low. For `setorderv()`, pass `order = -1` instead, as in `setorderv(dt, "mpg", -1)`. You can mix directions across columns, for example `setorder(dt, cyl, -mpg)` sorts `cyl` ascending and `mpg` descending.

**What is the difference between setorder() and setkey()?**

Both sort a data.table by reference, but `setkey()` also records the columns as the table's key and only sorts ascending. `setorder()` stores nothing and can sort in either direction. Use `setkey()` when you will subset or join on those columns repeatedly; use `setorder()` for a one-time sort.

**Does setorder() create a copy of the data.table?**

No. `setorder()` reorders the rows of the existing object in place, which is what "by reference" means. If another variable points to the same table, it is sorted too. Use `copy()` first when you need to keep the original row order.

**How do I sort by a column name stored in a variable?**

Use `setorderv()`, which accepts a character vector of column names. For example, `cols <- c("cyl", "mpg"); setorderv(dt, cols)` sorts by both columns. Pass an `order` vector such as `c(1, -1)` to set the direction of each column independently.
