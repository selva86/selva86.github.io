---
title: "data.table setcolorder() in R: Reorder Columns by Reference"
slug: datatable-setcolorder-in-R
description: "setcolorder() reorders data.table columns by reference in R with no copy. Learn the syntax, move columns to the front or back, and use before and after."
keywords: "data.table setcolorder, setcolorder function R, data.table setcolorder examples, R reorder columns data.table, setcolorder by reference, move column data.table, data.table column order"
mathjax: false
webr: true
date: "2026-05-16"
post_type: PSEO
category_id: function-deep
subcategory_id: datatable-functions
fr_parent: data-table-vs-dplyr.html
auto_link_terms: "setcolorder()|setcolorder|data.table setcolorder|data.table::setcolorder()|reorder columns"
auto_link_case_sensitive: true
target_keyword: "data.table setcolorder"
sibling_block_enabled: true
difficulty: Beginner
---

# data.table setcolorder() in R: Reorder Columns by Reference

<p class="lead">data.table <code>setcolorder()</code> reorders the columns of a data.table by reference, changing their position in place without copying the whole table. You pass a column order, and data.table rearranges the pointers, so it stays fast even on millions of rows.</p>

[QUICK ANSWER]
setcolorder(DT, c("b","a","c"))         # full explicit order
setcolorder(DT, "c")                     # move one column to front
setcolorder(DT, c(3, 1, 2))              # reorder by position
setcolorder(DT, "id", before = "name")   # place before a column
setcolorder(DT, "ts", after = "id")      # place after a column
setcolorder(DT, rev(names(DT)))          # reverse every column

[DECISION TREE: Is setcolorder() the right tool?]
- reorder columns in place: setcolorder(DT, c("b","a"))
- rename columns instead: setnames(DT, "old", "new")
- reorder rows by value: setorder(DT, score)
- keep only some columns: DT[, .(a, b)]
- set a sort key on columns: setkey(DT, id)
- reorder a plain data.frame copy: df[c("b","a")]

## What setcolorder() does

**setcolorder() changes column position without moving data.** It is one of data.table's `set*` functions, meaning it edits the table by reference. Instead of building a new data.table with columns in a different order, it rewrites the internal column list in place. No copy is made, and the call returns invisibly.

That reference behavior is the whole point. Reordering columns by selecting them, like `DT[, .(c, a, b)]`, copies every value into a fresh table. On a wide or long dataset that copy is wasteful when all you want is a cosmetic change to column order. `setcolorder()` skips the copy entirely.

[KEY INSIGHT]
**Column order in a data.table is just a list of pointers.** `setcolorder()` shuffles those pointers, so the cost is the same whether the table has 100 rows or 100 million. The data itself never moves.

## Syntax and arguments

**The signature is compact but flexible.** `setcolorder()` takes the table plus a description of the order you want.

```r title="setcolorder signature"
setcolorder(x, neworder, before = NULL, after = NULL)
```

Each argument controls a different part of the reorder:

- `x`: the data.table (or data.frame) to modify in place.
- `neworder`: a character vector of column names, or an integer vector of positions, in the order you want. It may list only some columns.
- `before`: place the `neworder` columns immediately before this column.
- `after`: place the `neworder` columns immediately after this column.

If `neworder` lists only a subset of columns, the columns you left out keep their current relative order and are appended after the ones you named. You never lose a column by omitting it.

[NOTE]
**The `before` and `after` arguments require data.table 1.15.0 or newer.** On older versions, pass a full or partial `neworder` vector instead. Check your version with `packageVersion("data.table")`.

## Examples by use case

**Start by building a small data.table to reorder.** Every example below runs against this same table.

```r title="Build a sample data.table"
library(data.table)

DT <- data.table(
  id    = 1:4,
  name  = c("Ann", "Ben", "Cara", "Dan"),
  score = c(88, 92, 75, 81),
  grade = c("B", "A", "C", "B")
)
DT
#>       id   name score  grade
#>    <int> <char> <num> <char>
#> 1:     1    Ann    88      B
#> 2:     2    Ben    92      A
#> 3:     3   Cara    75      C
#> 4:     4    Dan    81      B
```

**Pass a full vector of names to set the exact order.** This is the most explicit form: every column appears once, in the position you want.

```r title="Reorder with a full name vector"
setcolorder(DT, c("name", "id", "grade", "score"))
names(DT)
#> [1] "name"  "id"    "grade" "score"
```

**Pass a single name to move one column to the front.** Because `neworder` can be a subset, naming just `"score"` pulls it first and leaves the rest in place.

```r title="Move one column to the front"
setcolorder(DT, c("id", "name", "score", "grade"))  # reset order
setcolorder(DT, "score")                            # score first
names(DT)
#> [1] "score" "id"    "name"  "grade"
```

**Use integer positions when names are long or generated.** The vector `c(4, 1, 2, 3)` means "the 4th column first, then the 1st, 2nd, and 3rd".

```r title="Reorder by integer position"
setcolorder(DT, c("id", "name", "score", "grade"))  # reset order
setcolorder(DT, c(4, 1, 2, 3))
names(DT)
#> [1] "grade" "id"    "name"  "score"
```

**Use `before` or `after` to place columns relative to another.** This avoids spelling out the entire order when you only want to nudge one column.

```r title="Place a column with after"
setcolorder(DT, c("id", "name", "score", "grade"))  # reset order
setcolorder(DT, "grade", after = "name")
names(DT)
#> [1] "id"    "name"  "grade" "score"
```

## setcolorder() vs other column-ordering approaches

**setcolorder() wins whenever you only need a different order.** The alternatives all build a copy, which matters on large data.

| Approach | Copies data? | Speed | Best when |
|---|---|---|---|
| `setcolorder(DT, ...)` | No | Fastest | Reordering a data.table by reference |
| `DT[, .(b, a, c)]` | Yes | Slower | You also subset or transform columns |
| `df[c("b", "a")]` | Yes | Slow | A plain data.frame, small data |
| `dplyr::relocate()` | Yes | Moderate | A tidyverse pipeline that returns a tibble |

The decision rule is simple. If the only change is column order and the object is a data.table, use `setcolorder()`. If you are already subsetting columns or chaining verbs, fold the reorder into that step instead.

[TIP]
**`setcolorder()` also works on a plain data.frame.** It still reorders by reference, so you get the same zero-copy benefit even without converting to a data.table first.

## Common pitfalls

**The by-reference behavior surprises most newcomers.** A second variable pointing at the same data.table is not a copy. Reordering through one name reorders the other.

```r title="Reference, not a copy"
DT_a  <- data.table(x = 1:2, y = 3:4, z = 5:6)
alias <- DT_a               # same object, not a copy
setcolorder(alias, "z")
names(DT_a)                 # the original is reordered too
#> [1] "z" "x" "y"
```

To reorder an independent version, call `copy()` first, then `setcolorder()` on the copy.

**A misspelled column name throws an error.** `setcolorder()` validates `neworder` against the actual column names and stops if a name is missing.

```r title="Missing column name errors"
setcolorder(DT_a, c("z", "Q"))
#> Error in setcolorder(DT_a, c("z", "Q")) :
#>   Items of 'neworder' not found in column names: [Q]
```

**Do not rely on the return value.** `setcolorder()` returns the table invisibly, so writing `DT <- setcolorder(DT, ...)` works but is redundant and misleading. Call it for its side effect and use `DT` directly afterward.

## Try it yourself

**Try it:** Reorder the columns of `ex_dt` so that `grade` comes first and the rest keep their order. Save nothing new, just modify `ex_dt` in place.

```r title="Your turn: move grade to front"
ex_dt <- data.table(id = 1:3, name = c("Eva", "Finn", "Gus"),
                     grade = c("A", "B", "A"))
# Try it: put grade first
# your code here

names(ex_dt)
#> Expected: "grade" "id" "name"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_dt <- data.table(id = 1:3, name = c("Eva", "Finn", "Gus"),
                     grade = c("A", "B", "A"))
setcolorder(ex_dt, "grade")
names(ex_dt)
#> [1] "grade" "id"    "name"
```

**Explanation:** Passing the single name `"grade"` as `neworder` moves that column to the front. The columns you did not name, `id` and `name`, keep their original relative order and follow behind.

</details>

## Related data.table functions

**setcolorder() sits in a family of by-reference setters.** Each one edits a different aspect of the table in place.

- `setnames()`: rename columns without copying.
- `setorder()`: sort rows by one or more columns.
- `setkey()`: set a sort key for fast joins and lookups.
- `setDT()`: convert a data.frame to a data.table in place.
- `set()`: assign values into cells by reference.

## FAQ

**Does setcolorder() modify the original data.table?**

Yes. `setcolorder()` reorders columns by reference, so the original object changes and no new table is returned for assignment. Any other variable bound to the same data.table sees the new order too. If you need to keep the original layout, make an explicit `copy()` of the table first and call `setcolorder()` on that copy instead.

**Can I use setcolorder() on a data.frame?**

Yes. `setcolorder()` accepts a plain data.frame and reorders its columns by reference, just as it does for a data.table. This is one of the few data.table functions that helps even if you have not converted your object. You do not need `setDT()` first when the only change you want is column order.

**What happens if neworder lists only some columns?**

The columns you name are placed in the order given, and every column you left out is appended afterward in its original relative order. Nothing is dropped. This makes it easy to move one or two columns to the front without typing the full column list.

**Is setcolorder() faster than reordering with column selection?**

Yes, especially on large data. Selecting columns with `DT[, .(c, a, b)]` copies every value into a new table, while `setcolorder()` only rearranges internal pointers. The cost of `setcolorder()` does not grow with the number of rows, so it is the right choice whenever reordering is the only change.

For the full argument reference, see the [official data.table setcolorder documentation](https://rdatatable.gitlab.io/data.table/reference/setcolorder.html).
