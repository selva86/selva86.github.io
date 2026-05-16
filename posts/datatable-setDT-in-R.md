---
title: "data.table setDT() in R: Convert by Reference"
slug: datatable-setDT-in-R
description: "setDT() in R converts a list or data.frame to a data.table in place, by reference, with zero copy. Learn the syntax, examples, setDF, and common pitfalls."
keywords: "data.table setDT, setDT function R, data.table setDT examples, R setDT data.table, convert data.frame to data.table, setDT vs as.data.table, setDT by reference"
mathjax: false
webr: true
date: "2026-05-16"
post_type: PSEO
category_id: function-deep
subcategory_id: datatable-functions
fr_parent: data-table-vs-dplyr.html
auto_link_terms: "setDT()|data.table setDT|data.table::setDT()|convert to data.table|setDT in R"
auto_link_case_sensitive: true
target_keyword: "data.table setDT"
sibling_block_enabled: true
difficulty: Beginner
---

# data.table setDT() in R: Convert by Reference

<p class="lead">The <code>data.table setDT()</code> function converts a list or data.frame into a data.table by reference, modifying the object in place with no copy. It is the fastest way to upgrade an existing object to a data.table.</p>

[QUICK ANSWER]
setDT(df)                          # data.frame to data.table in place
setDT(my_list)                     # named or unnamed list to data.table
setDT(df, keep.rownames = TRUE)    # keep row names as column "rn"
setDT(df, keep.rownames = "id")    # row names into a named column
setDT(df, key = "grp")             # convert and set a key at once
setDT(df)[, sum(x), by = grp]      # use the result in a compound call
setDF(dt)                          # reverse it: data.table back to data.frame

[DECISION TREE: Is setDT() the right tool?]
- convert an existing object in place: setDT(df)
- keep the original data.frame untouched: as.data.table(df)
- go back to a plain data.frame: setDF(dt)
- read a file straight into a data.table: fread("data.csv")
- build a data.table from scratch: data.table(a = 1:3)
- stack many tables into one: rbindlist(list_of_dt)

## What setDT() does in one sentence

**setDT() coerces an object to a data.table without copying it.** You pass a list or a data.frame, and the same object becomes a data.table in memory. Unlike most R functions, which return a modified copy and leave the original alone, `setDT()` changes its input directly. This makes it both fast and memory-light, since no second copy of the data ever exists.

The function belongs to data.table's family of `set*` functions, all of which modify by reference. The payoff shows on large objects: converting a million-row data.frame with `as.data.table()` briefly holds two copies in memory, while `setDT()` holds only one.

## Syntax

**The signature is short, but each argument changes the result.** Here is the full call:

```r title="setDT function signature"
setDT(x, keep.rownames = FALSE, key = NULL, check.names = FALSE)
```

The arguments are:

- `x`: the list or data.frame to convert. A `data.table` passed in is returned unchanged.
- `keep.rownames`: if `TRUE`, row names are moved into a new column called `rn`. Pass a string to name that column yourself. Default `FALSE` drops row names.
- `key`: a character vector of column names to set as the data.table key during conversion. Same effect as calling `setkey()` afterward.
- `check.names`: if `TRUE`, syntactically invalid column names are repaired, the same way `data.frame()` does it.

`setDT()` returns the converted object invisibly. That return value lets you chain straight into a data.table query, as shown later.

## Examples by use case

**Start with the most common case: a data.frame.** The `mtcars` dataset is a base R data.frame, so it is a good test subject.

```r title="Convert a data.frame to data.table"
library(data.table)

df <- data.frame(mtcars)
class(df)
#> [1] "data.frame"

setDT(df)
class(df)
#> [1] "data.table" "data.frame"
```

Notice that `df` itself changed class. No assignment was needed, because `setDT()` modified `df` by reference.

**setDT() also converts plain lists.** A named list becomes columns by name; an unnamed list gets `V1`, `V2`, and so on.

```r title="Convert a list to data.table"
lst <- list(city = c("NYC", "LA"), pop = c(8.3, 3.9))
setDT(lst)
lst
#>      city  pop
#>    <char> <num>
#> 1:    NYC   8.3
#> 2:     LA   3.9
```

**Use keep.rownames when the row names carry data.** A plain `setDT()` would discard the car names in `mtcars`, so keep them as a column.

```r title="Keep row names as a column"
cars <- data.frame(mtcars)
setDT(cars, keep.rownames = "model")
cars[1:2, .(model, mpg, cyl)]
#>               model   mpg   cyl
#>              <char> <num> <num>
#> 1:        Mazda RX4  21.0     6
#> 2:    Mazda RX4 Wag  21.0     6
```

**Set a key during the conversion to skip a step.** Passing `key` sorts the table and marks the key column in one call.

```r title="Convert and set a key at once"
ir <- data.frame(iris)
setDT(ir, key = "Species")
key(ir)
#> [1] "Species"
ir[, .(avg = mean(Sepal.Length)), by = Species]
#>       Species   avg
#>        <fctr> <num>
#> 1:     setosa 5.006
#> 2: versicolor 5.936
#> 3:  virginica 6.588
```

## Compare with as.data.table() and setDF()

**setDT() is one of three conversion routes, and they differ on copying.** Pick the function that matches whether you need the original preserved.

| Function | Direction | Copies? | Use when |
|---|---|---|---|
| `setDT()` | list/data.frame to data.table | No, by reference | You no longer need the original object |
| `as.data.table()` | any object to data.table | Yes, returns a copy | You must keep the original intact |
| `setDF()` | data.table to data.frame | No, by reference | You need a plain data.frame back |

The decision rule is simple. If keeping the source object as it was matters, use [as.data.table()](datatable-as-data-table-in-R.html), which leaves the input alone. If the source object is disposable and speed matters, use `setDT()`.

[KEY INSIGHT]
**"By reference" means there is only ever one object.** After `setDT(df)`, there is no separate data.table, `df` *is* the data.table. `as.data.table(df)` instead produces a second object and leaves `df` as a data.frame. That single distinction explains every behavior difference between the two.

## Common pitfalls

**setDT() modifies the caller's variable, which surprises people.** Because it works by reference, the change is visible everywhere the object is referenced, even outside the current function.

```r title="setDT modifies the original"
original <- data.frame(x = 1:3)
twin <- original
setDT(original)
class(twin)
#> [1] "data.table" "data.frame"
```

Here `twin` was never passed to `setDT()`, yet it changed too, because it pointed at the same object.

[WARNING]
**Take a copy first if you need the data.frame preserved.** Run `safe <- copy(df)` before `setDT(df)`, or use `as.data.table(df)` instead. A plain `safe <- df` does not protect you, since both names still point to one object.

A second trap is calling `setDT()` on something already a data.table. That is harmless, it simply returns the object, but the missing assignment can mislead readers into thinking nothing happened.

[TIP]
**Use the invisible return value to chain operations.** Because `setDT()` returns the object, you can write `setDT(df)[, sum(x), by = grp]` in a single line, converting and querying together.

## Try it yourself

**Try it:** Convert the `airquality` data.frame to a data.table by reference and set `Month` as its key. Save the result to `ex_aq`.

```r title="Your turn: convert with setDT"
# Try it: convert airquality and key it by Month
ex_aq <- # your code here

key(ex_aq)
#> Expected: "Month"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_aq <- data.frame(airquality)
setDT(ex_aq, key = "Month")
key(ex_aq)
#> [1] "Month"
```

**Explanation:** Passing `key = "Month"` to `setDT()` converts the object and sets the key in one call, so a separate `setkey()` is not needed.

</details>

## Related data.table functions

**setDT() works alongside the rest of the conversion and setup toolkit.** Explore these next:

- `as.data.table()`: copy-based conversion when the original must survive.
- `setDF()`: the reverse trip, data.table back to data.frame by reference.
- `fread()`: read a file directly into a data.table, no conversion step needed.
- `setkey()`: set or change the key on an existing data.table.
- `rbindlist()`: bind a list of data.tables or data.frames into one.

See the official [setDT reference](https://rdatatable.gitlab.io/data.table/reference/setDT.html) for the complete argument list.

## FAQ

**What is the difference between setDT() and as.data.table()?**

`setDT()` converts by reference, modifying the object in place with no copy, and works only on lists and data.frames. `as.data.table()` returns a new copy and leaves the original unchanged, and it accepts more input types such as vectors and matrices. Use `setDT()` when the original object is disposable and speed matters; use `as.data.table()` when you must keep the source intact.

**Does setDT() modify the original data frame?**

Yes. `setDT()` changes the object in place, so the variable you passed in becomes a data.table without any assignment. Any other variable pointing at the same object also reflects the change. If you need the original data.frame preserved, call `copy()` on it first or use `as.data.table()` instead.

**Can setDT() convert a list to a data.table?**

Yes. `setDT()` accepts both named and unnamed lists. A named list becomes columns named after the list elements. An unnamed list gets default column names `V1`, `V2`, and so on. Every element must be the same length, just as columns in a table must align.

**How do I convert a data.table back to a data.frame?**

Use `setDF()`, the mirror image of `setDT()`. It coerces a data.table back to a plain data.frame by reference, again with no copy. This is useful when passing data to a function or package that does not understand data.table syntax.

**Is setDT() faster than as.data.table()?**

For large objects, yes. `setDT()` skips the full copy that `as.data.table()` makes, so it uses roughly half the peak memory and less time. On small objects the difference is negligible, but on multi-million-row tables the in-place conversion is a clear win.
