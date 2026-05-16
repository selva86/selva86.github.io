---
title: "data.table setDF() in R: Convert to a data.frame"
slug: datatable-setDF-in-R
description: "setDF() in R converts a data.table or list to a data.frame in place, by reference, with zero copy. Learn the syntax, examples, rownames, and common pitfalls."
keywords: "data.table setDF, setDF function R, data.table setDF examples, R setDF data.frame, convert data.table to data.frame, setDF vs setDT, setDF by reference"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: datatable-functions
fr_parent: data-table-vs-dplyr.html
auto_link_terms: "setDF()|data.table setDF|data.table::setDF()|convert to data.frame|setDF in R"
auto_link_case_sensitive: true
target_keyword: data.table setDF
sibling_block_enabled: true
difficulty: Beginner
---

# data.table setDF() in R: Convert to a data.frame

<p class="lead">The <code>data.table setDF()</code> function converts a data.table or list into a plain data.frame by reference, modifying the object in place with no copy. It is the fastest way to hand data.table results to code that expects a base data.frame.</p>

[QUICK ANSWER]
setDF(dt)                       # data.table to data.frame in place
setDF(my_list)                  # list of equal-length vectors to data.frame
setDF(dt, rownames = ids)       # set row names from a vector
setDF(dt, rownames = "id")      # move a column into row names
class(setDF(dt))                # "data.frame"
as.data.frame(dt)               # copy instead, leaves dt untouched
setDT(df)                       # reverse it: data.frame back to data.table

[DECISION TREE: Is setDF() the right tool?]
- strip the data.table class in place: setDF(dt)
- keep the data.table untouched: as.data.frame(dt)
- go the other way to a data.table: setDT(df)
- convert to a matrix instead: as.matrix(dt)
- pull one column out as a vector: dt[["col"]]
- bind many tables into one frame: rbindlist(parts)

## What setDF() does in one sentence

**setDF() coerces an object to a data.frame without copying it.** You pass a data.table or a list, and that same object becomes a plain data frame in memory. Most R functions return a modified copy, but setDF changes its argument directly, in place. No second copy is ever created, so the conversion stays fast and light on memory even for a large table.

setDF is the exact mirror of setDT. Where setDT upgrades a list or data frame into a data.table, setDF downgrades a data.table back into an ordinary data frame, and both work by reference. You reach for it whenever a function or package does not understand data.table syntax and expects a base data frame. That case is common, because a data.table is also a data frame, yet the two classes subset differently. Indexing one column by position returns a vector from a data frame but a one-column data.table from a data.table. Older modeling functions assume the data frame behaviour, so converting with setDF removes that risk in one step.

## Syntax

**The signature has just two arguments.** Here is the full call:

```r title="setDF function signature"
setDF(x, rownames = NULL)
```

The first argument, `x`, is the object to convert: a data.table, or a list whose elements are equal-length vectors. A data frame passed in is returned unchanged, so the call is safe even when the input type is uncertain.

The second argument, `rownames`, is optional and sets the row labels of the result. A data.table has no row names, so this is your chance to add them. Pass a character or numeric vector to use as the row names directly, or pass a single column name to lift that column out and use its values as the row names. setDF returns the converted object invisibly, which lets you chain the conversion straight into another call.

## Examples by use case

**Start with the most common case, an existing data.table.** Build a small table, then collapse it back and inspect the class.

```r title="Convert a data.table to a data.frame"
library(data.table)

dt <- data.table(model = c("Civic", "Accord"), mpg = c(33, 30))
class(dt)
#> [1] "data.table" "data.frame"

setDF(dt)
class(dt)
#> [1] "data.frame"
```

The variable changed class with no assignment. Its class vector held both `"data.table"` and `"data.frame"` before the call, since every data.table inherits from data frame; afterward only `"data.frame"` remains.

**setDF also accepts a plain list.** Every element must be a vector of the same length, because the columns must line up row for row.

```r title="Convert a list to a data.frame"
lst <- list(city = c("NYC", "LA"), pop = c(8.3, 3.9))
setDF(lst)
class(lst)
#> [1] "data.frame"
lst
#>   city pop
#> 1  NYC 8.3
#> 2   LA 3.9
```

A named list becomes columns named after its elements. An unnamed list would instead get the default names `V1`, `V2` and so on.

**Pass a vector to rownames to label each row.** A data.table never carries row names, so this is where you add them.

```r title="Set row names from a vector"
dt2 <- data.table(score = c(91, 84, 78))
setDF(dt2, rownames = c("Ann", "Bo", "Cy"))
dt2
#>     score
#> Ann    91
#> Bo     84
#> Cy     78
```

A data frame stores row names as an attribute, so they print down the left edge of every row.

**Point rownames at a column to promote it.** Passing a column name moves that column's values into the row names and drops the column.

```r title="Move a column into row names"
dt3 <- data.table(id = c("r1", "r2"), value = c(10, 20))
setDF(dt3, rownames = "id")
dt3
#>    value
#> r1    10
#> r2    20
```

This helps when a data.table carries an identifier column that base R code expects to find in the row names. The column is consumed, so the result has one fewer column, and the promoted values must be unique.

## Compare with as.data.frame() and setDT()

**setDF is one of three conversion routes, and they differ on copying.** Choose the function that matches whether the original object must survive.

| Function | Direction | Copies? | Use when |
|---|---|---|---|
| `setDF()` | data.table or list to data.frame | No, by reference | The data.table is disposable |
| `as.data.frame()` | any object to data.frame | Yes, returns a copy | You must keep the data.table intact |
| `setDT()` | list or data.frame to data.table | No, by reference | You need a data.table back |

The rule is short. If keeping the source data.table intact matters, use as.data.frame, which builds a separate result. If the source is disposable and speed matters, use setDF.

The copy that as.data.frame makes is cheap on small data but expensive at scale. Converting a data.table of several million rows briefly holds two full copies in memory, doubling the peak footprint. setDF never allocates that copy, so it suits memory-tight pipelines. A common workflow reads a file with fread, aggregates with data.table syntax, then calls setDF to hand the result to a plotting or modeling function.

[KEY INSIGHT]
**"By reference" means there is only ever one object.** After `setDF(dt)`, there is no separate data.frame, `dt` itself is the data.frame. `as.data.frame(dt)` instead produces a second object and leaves `dt` as a data.table. That single distinction explains every behavior difference between the two.

## Common pitfalls

**setDF modifies the caller's variable, which surprises people.** Because it works by reference, the change is visible through any variable name that points at the object.

```r title="setDF modifies the original"
original <- data.table(x = 1:3)
twin <- original
setDF(original)
class(twin)
#> [1] "data.frame"
```

Here `twin` was never passed to setDF, yet it changed class too, because both names referred to one object. Plain assignment in R does not duplicate data, it only adds a name.

[WARNING]
**Take a copy first if you need the data.table preserved.** Run `safe <- copy(dt)` before `setDF(dt)`, or use `as.data.frame(dt)` instead. A plain `safe <- dt` does not protect you, since both names still point to one object.

**setDF silently strips the key and any indices.** A data frame has no concept of a key, so the conversion drops it without a warning.

```r title="setDF drops the data.table key"
dt4 <- data.table(g = c("b", "a"), v = c(2, 1))
setkey(dt4, g)
key(dt4)
#> [1] "g"

setDF(dt4)
key(dt4)
#> NULL
```

If you convert back with setDT, the key does not return on its own; call setkey again to rebuild it. Calling setDF on an object that is already a data frame is harmless, it simply returns it unchanged.

[TIP]
**Convert back with setDT() to restore data.table speed.** If you only needed a data.frame for one function call, wrap that call and run `setDT()` afterward to regain keyed joins and by-reference updates.

## Try it yourself

**Try it:** Convert this data.table of three cities to a plain data.frame by reference, using the `city` column as the row names. Save the result to `ex_cities`.

```r title="Your turn: convert with setDF"
# Try it: convert to a data.frame with city as row names
ex_cities <- data.table(city = c("NYC", "LA", "Chicago"), pop = c(8.3, 3.9, 2.7))
# your code here

class(ex_cities)
#> Expected: "data.frame"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_cities <- data.table(city = c("NYC", "LA", "Chicago"), pop = c(8.3, 3.9, 2.7))
setDF(ex_cities, rownames = "city")
class(ex_cities)
#> [1] "data.frame"
```

**Explanation:** Passing `rownames = "city"` moves that column into the row names and removes it, while `setDF()` strips the data.table class in place so `ex_cities` becomes a plain data.frame.

</details>

## Related data.table functions

**setDF() works alongside the rest of the conversion toolkit.** Explore these next:

- `setDT()`: the reverse trip, list or data.frame to data.table by reference.
- `as.data.frame()`: copy-based conversion that leaves the data.table intact.
- `as.data.table()`: copy-based conversion in the other direction, to a data.table.
- `copy()`: take a deep copy before any by-reference call to protect the original.
- `rbindlist()`: bind a list of data.tables or data.frames into one object.

See the official [setDF reference](https://rdatatable.gitlab.io/data.table/reference/setDF.html) for the complete argument list.

## FAQ

**What is the difference between setDF() and as.data.frame()?**

setDF converts by reference with no copy, and it works only on data.tables and lists. as.data.frame returns a new copy and accepts almost any object type. Use setDF when the data.table is disposable and speed matters, and use as.data.frame when you must keep the source data.table intact for code that runs later.

**Does setDF() modify the original data.table?**

Yes. setDF changes the object in place, so the variable you passed becomes a data frame with no assignment statement. Any other name pointing at the same object changes too. To preserve the original, call copy on it first, or use as.data.frame, which builds a separate result.

**Does setDF() keep the data.table key?**

No. A data frame has no key, so setDF strips the key and any secondary indices during the conversion, without printing a warning. If you later convert the object back with setDT, you must call setkey again to rebuild the key.

**How do I convert a data.frame back to a data.table?**

Use setDT, the mirror image of setDF. It coerces a data frame or list into a data.table by reference, again with no copy. The pair lets you move one object between the two forms as different functions require, without duplicating the data.

**Is setDF() faster than as.data.frame()?**

For large objects, yes. setDF skips the full copy that as.data.frame makes, so it uses roughly half the peak memory and less time. On small objects the difference is negligible, but on multi-million-row tables the in-place conversion is a clear win.
