---
title: "data.table Update by Reference in R: := and set()"
slug: datatable-update-by-reference-in-R
description: "Update by reference in data.table modifies columns in place using := and set(), with no copy. Learn the semantics, syntax, examples, and common pitfalls."
keywords: "data.table update by reference, data.table := operator, data.table set function, modify in place R, data.table reference semantics, R data.table no copy, set vs := data.table"
mathjax: false
webr: true
date: "2026-05-22"
post_type: PSEO
category_id: function-deep
subcategory_id: datatable-functions
fr_parent: data-table-vs-dplyr.html
auto_link_terms: "update by reference|data.table :=|data.table set()|modify in place|reference semantics data.table"
auto_link_case_sensitive: true
target_keyword: "data.table update by reference"
sibling_block_enabled: true
difficulty: Beginner
---

# data.table Update by Reference in R: := and set()

<p class="lead">Update by reference in <code>data.table</code> modifies a column in place using the <code>:=</code> operator or the <code>set()</code> function. The original object changes directly, no copy is made, and the result is far faster and more memory-light than R's default copy-on-modify behavior.</p>

[QUICK ANSWER]
DT[, new_col := x * 2]                        # add or overwrite one column
DT[, c("a", "b") := list(x + 1, y + 1)]       # several columns at once
DT[, `:=`(a = x + 1, b = y + 1)]              # functional form, same effect
DT[cyl == 4, mpg := mpg * 1.1]                # update rows matching a filter
DT[, new_col := NULL]                         # delete a column by reference
set(DT, i = 1:3, j = "x", value = NA)         # set() updates specific cells
for (j in names(DT)) set(DT, j = j, value = 0) # set() shines inside loops

[DECISION TREE: Should you update by reference?]
- add or overwrite a column without copying: DT[, x := value]
- update many cells in a tight loop: set(DT, i, j, value)
- rename columns in place: setnames(DT, "old", "new")
- reorder columns in place: setcolorder(DT, c("b", "a"))
- sort the whole table in place: setorder(DT, col)
- you actually want a fresh copy: copy(DT) before assigning

## What update by reference means in one sentence

**Update by reference changes an existing object in memory instead of returning a modified copy.** When you write `DT[, x := 1]`, the column `x` is added or overwritten inside the same `data.table` that lives at `DT`. Nothing is copied, and no assignment with `<-` is needed. Any other variable bound to the same object sees the change too.

This is the opposite of how base R and tidyverse data frames behave. `df$x <- 1` makes a fresh copy of `df`, modifies the copy, and rebinds the name `df` to it. The distinction looks subtle on small data but becomes the dominant cost on large tables.

## How update by reference differs from copy-on-modify

**R's default rule is copy-on-modify.** Whenever you change a value inside a data frame, R quietly duplicates the underlying storage so the original is not affected. That guarantees safety but pays for it with memory and time, especially on wide or tall tables.

`data.table` opts out of this rule for a specific set of operations. `:=`, `set()`, and the `set*` family (`setnames()`, `setcolorder()`, `setorder()`, `setkey()`, `setattr()`) all modify the existing object directly. The trade-off is awareness: aliases of the same table now point to one shared object, so changes propagate.

[KEY INSIGHT]
**Treat a data.table the way you treat a Python list or a JavaScript object.** It is a mutable container, not a value. Reassigning with `<-` is unnecessary, and aliases share state. Once that mental model clicks, the rest of the data.table API stops feeling surprising.

## The two main entry points: := and set()

**`:=` is the everyday tool; `set()` is the loop tool.** Both modify by reference; they differ in syntax and where each shines.

```r title="Set up a data.table to experiment with"
library(data.table)

DT <- as.data.table(mtcars)
DT <- DT[, .(mpg, cyl, hp, wt)]
DT
#>      mpg   cyl    hp    wt
#>    <num> <num> <num> <num>
#> 1:  21.0     6   110 2.620
#> 2:  21.0     6   110 2.875
#> 3:  22.8     4    93 2.320
#> 4:  21.4     6   110 3.215
#> 5:  18.7     8   175 3.440
#> 6:  18.1     6   105 3.460
```

`:=` lives inside the `j` slot of `DT[i, j, by]`. It can add, overwrite, or delete columns, and it can be combined with an `i` filter to update only matching rows. `set()` is a standalone function that takes `i`, `j`, and `value` arguments. It avoids the small overhead of the `[.data.table` dispatcher, which matters when you call it thousands of times in a loop.

## Examples by use case

**Add a single column by reference.** No `<-` is needed; the table itself changes.

```r title="Add one column with :="
DT[, kpl := mpg * 0.4251]
DT[1:3]
#>      mpg   cyl    hp    wt    kpl
#>    <num> <num> <num> <num>  <num>
#> 1:  21.0     6   110 2.620 8.9271
#> 2:  21.0     6   110 2.875 8.9271
#> 3:  22.8     4    93 2.320 9.6923
```

**Add several columns in one call.** The multi-column form takes character vectors and a `list()` of values.

```r title="Add multiple columns at once"
DT[, c("wt_kg", "hp_per_ton") := list(wt * 453.6, hp / wt)]
DT[1:3]
#>      mpg   cyl    hp    wt    kpl   wt_kg hp_per_ton
#>    <num> <num> <num> <num>  <num>   <num>      <num>
#> 1:  21.0     6   110 2.620 8.9271 1188.43      41.98
#> 2:  21.0     6   110 2.875 8.9271 1304.10      38.26
#> 3:  22.8     4    93 2.320 9.6923 1052.35      40.09
```

**Update only the rows that match a filter.** Combine `i` and `:=` so the assignment touches just the targeted rows.

```r title="Update a subset of rows"
DT[, mpg_adj := mpg]
DT[cyl == 4, mpg_adj := mpg * 1.10]
DT[, .(cyl, mpg, mpg_adj)][order(cyl)][1:5]
#>      cyl   mpg mpg_adj
#>    <num> <num>   <num>
#> 1:     4  22.8  25.080
#> 2:     4  24.4  26.840
#> 3:     4  22.8  25.080
#> 4:     4  32.4  35.640
#> 5:     4  30.4  33.440
```

**Delete a column by setting it to NULL.** This is the canonical drop pattern; the column vanishes from the table in place.

```r title="Delete a column by reference"
DT[, mpg_adj := NULL]
names(DT)
#> [1] "mpg"        "cyl"        "hp"         "wt"
#> [5] "kpl"        "wt_kg"      "hp_per_ton"
```

**Use set() when you are looping.** The `set()` function avoids the per-call overhead of `[.data.table`, which adds up when you touch many cells.

```r title="set() inside a loop is fast"
num_cols <- c("mpg", "hp", "wt")
for (col in num_cols) {
  set(DT, j = col, value = round(DT[[col]], 1))
}
DT[1:3, ..num_cols]
#>      mpg    hp    wt
#>    <num> <num> <num>
#> 1:  21.0   110   2.6
#> 2:  21.0   110   2.9
#> 3:  22.8    93   2.3
```

## Compare with copy-on-modify alternatives

**Choose the right tool by how much data you touch and whether you need the original untouched.** The table below summarises the trade-offs.

| Operation | Copies data? | Returns object? | Best for |
|-----------|--------------|-----------------|----------|
| `DT[, x := value]` | No | No (invisible) | Most column updates |
| `set(DT, i, j, value)` | No | No (invisible) | Many small updates in a loop |
| `setnames(DT, ...)` | No | No (invisible) | Rename columns in place |
| `DT$x <- value` (base R) | Yes (whole DT) | No | Avoid on data.tables |
| `dplyr::mutate(df, ...)` | Yes | New tibble | When you must keep the original |
| `copy(DT)` then modify | Yes (once) | New data.table | When aliases must not see the change |

Decision rule: default to `:=` for clarity, switch to `set()` when profiling shows the `[.data.table` overhead matters, and reach for `copy()` only when an alias must stay frozen.

[TIP]
**Wrap `set()` in a loop, not `:=`.** Each `DT[, := ]` call goes through `[.data.table`, which adds tens of microseconds of overhead per call. With `set()`, that overhead disappears, and updating thousands of cells one by one becomes practical.

## Common pitfalls

**Pitfall 1: assigning the result back to a new name.** `:=` returns invisibly, so writing `DT2 <- DT[, x := 1]` rebinds `DT2` to the same object as `DT`. Both names now point to one mutable table, and the next update touches both.

```r title="Aliasing trap with :="
DT2 <- DT[, demo_col := 99]
identical(DT, DT2)
#> [1] TRUE
DT[, demo_col := 0]
DT2[1, demo_col]
#> [1] 0
```

The fix is to use `copy()` whenever you need an independent snapshot.

```r title="Use copy() for independence"
DT3 <- copy(DT)
DT3[, demo_col := 42]
DT[1, demo_col]
#> [1] 0
```

**Pitfall 2: silent output at the console.** `DT[, x := 1]` prints nothing because the return value is invisible. New users sometimes think the call failed. It did not; `DT` was updated. Print `DT` explicitly to confirm, or chain `[]` at the end: `DT[, x := 1][]`.

**Pitfall 3: using := on a regular data.frame.** `:=` is a data.table feature. Calling it on a plain data.frame raises a confusing error. Convert with `setDT(df)` first.

## Try it yourself

**Try it:** Convert `iris` to a data.table, then add a column `petal_area` equal to `Petal.Length * Petal.Width` by reference. Confirm the column appears in the original object without reassignment.

```r title="Your turn: add a column by reference"
# Try it: add petal_area to iris in place
ex_iris <- as.data.table(iris)

# your code here

head(ex_iris, 3)
#> Expected: petal_area column visible
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_iris <- as.data.table(iris)
ex_iris[, petal_area := Petal.Length * Petal.Width]
head(ex_iris, 3)
#>    Sepal.Length Sepal.Width Petal.Length Petal.Width Species petal_area
#> 1:          5.1         3.5          1.4         0.2  setosa       0.28
#> 2:          4.9         3.0          1.4         0.2  setosa       0.28
#> 3:          4.7         3.2          1.4         0.2  setosa       0.28
```

**Explanation:** The `:=` call adds `petal_area` to `ex_iris` directly. No assignment with `<-` is needed because `data.table` modifies the object in place.

</details>

## Related data.table functions

A short list of reference-modifying helpers worth knowing:

- `setnames()`: rename columns in place
- `setcolorder()`: reorder columns in place
- `setorder()`: sort rows in place
- `setkey()`: set a key in place for fast joins and lookups
- `setattr()`: change attributes (class, names) in place
- `copy()`: opt out of reference semantics when you need a true duplicate

For the broader contrast with tidyverse copy-on-modify, see the parent guide on [data.table vs dplyr](data-table-vs-dplyr.html). The official reference is the [data.table semantics vignette](https://cran.r-project.org/web/packages/data.table/vignettes/datatable-reference-semantics.html).

## FAQ

**Why does data.table modify in place when most R does not?**

Modifying in place avoids the cost of duplicating large objects. On a million-row table, copy-on-modify can mean copying tens or hundreds of megabytes for each column change. data.table sacrifices the safety net of automatic copies to gain that speed and memory headroom, and exposes `copy()` for cases where the safety net is what you actually want.

**Does := work on a data.frame?**

No. The `:=` operator is defined only inside `[.data.table`. Calling it on a regular data.frame returns an error about an unexpected operator. Convert the data.frame first with `setDT(df)` or `as.data.table(df)`, then `:=` becomes available.

**When should I prefer set() over :=?**

Use `set()` inside loops or when you are touching many individual cells. `:=` is more readable for single-column or multi-column updates outside a loop, while `set()` avoids the small dispatch overhead of `[.data.table` and is faster for high-frequency updates.

**Does := return the updated table?**

`:=` returns the table invisibly, so a console call shows nothing. If you want to print the result in one line, append `[]`: `DT[, x := 1][]`. Inside a pipeline, the invisible return still works; only the auto-print behavior is suppressed.

**How do I undo an update by reference?**

There is no automatic undo. The original column values are gone once `:=` runs. If you might need the previous state, call `copy(DT)` before the update and keep the copy. For column deletion specifically, you can reassign the column with `:=` if you still have its values in another object.
