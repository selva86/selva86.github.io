---
title: "data.table setnames() in R: Rename Columns by Reference"
slug: datatable-setnames-in-R
description: "Learn how data.table setnames() in R renames columns by reference. Rename by name, position, or function and skip missing names, with runnable examples."
keywords: "data.table setnames, setnames function R, data.table setnames examples, R rename columns data.table, setnames by reference, data.table rename column, skip_absent setnames"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: datatable-functions
fr_parent: data-table-vs-dplyr.html
auto_link_terms: "setnames()|data.table setnames|data.table::setnames()|rename columns data.table|data.table rename column"
auto_link_case_sensitive: true
target_keyword: "data.table setnames"
sibling_block_enabled: true
difficulty: Beginner
---

# data.table setnames() in R: Rename Columns by Reference

<p class="lead">data.table <code>setnames()</code> renames columns by reference, changing names in place without copying the table. It accepts names, positions, or a function, making it the fastest way to rename columns in R.</p>

[QUICK ANSWER]
setnames(DT, new_names)                     # rename every column
setnames(DT, "old", "new")                  # rename one column
setnames(DT, c("a","b"), c("x","y"))        # rename several columns
setnames(DT, 1:2, c("x","y"))               # rename by position
setnames(DT, toupper)                       # apply a function to all
setnames(DT, old, new, skip_absent=TRUE)    # ignore missing old names
setnames(df, "old", "new")                  # also works on data.frame

[DECISION TREE: Is setnames() the right tool?]
- rename columns in place: setnames(DT, old, new)
- reorder columns, not rename: setcolorder(DT, new_order)
- rename inside a dplyr pipeline: rename(df, new = old)
- rename a copy in base R: setNames(df, new_names)
- clean every name at once: setnames(DT, janitor::make_clean_names)
- name a column while aggregating: DT[, .(total = sum(x))]

## What setnames() does

**setnames() changes data.table column names without making a copy.** Most R objects follow copy-on-modify semantics, so renaming columns with `names(df) <-` duplicates the whole frame in memory before the change takes effect. `setnames()` skips that copy entirely: it edits the names attribute of the existing object directly. On a small table the difference is invisible, but on a table with millions of rows it is the difference between an instant operation and a noticeable pause that allocates a second copy of your data.

The function works on both `data.table` and `data.frame` objects. When you pass a plain data frame, it is still modified by reference, which surprises people used to R's usual copy semantics. There is no return value worth capturing: `setnames()` returns the table invisibly, so you call it purely for its side effect.

Because the rename happens in place, `setnames()` fits naturally into data.table pipelines where you want a sequence of fast, allocation-free transformations. It pairs with `setkey()`, `setcolorder()`, and `setDT()`, all of which share the same by-reference design and the `set` naming prefix.

[KEY INSIGHT]
**By reference means no assignment needed.** Unlike `names(df) <- value`, you do not write `DT <- setnames(DT, ...)`. The original object already changed in memory. The return value exists only so you can chain calls if you want to.

## Syntax and arguments

**setnames() takes the table, the columns to rename, and their new names.** The full signature is `setnames(x, old, new, skip_absent = FALSE)`. The `old` and `new` arguments are flexible: they accept character vectors, integer positions, or functions. When `new` is omitted entirely, `old` is treated as the complete vector of replacement names for the whole table.

| Argument | Purpose |
|---|---|
| `x` | The data.table or data.frame to modify in place. |
| `old` | Column names or integer positions to rename. If `new` is missing, this becomes the full set of new names. |
| `new` | Replacement names, or a function applied to `old` (or to all names). |
| `skip_absent` | If `TRUE`, names in `old` not found in the table are skipped instead of raising an error. |

Knowing which form to reach for keeps your code readable. Use the single-vector form when you are renaming every column, and the `old`/`new` pair when you only want to touch a few.

## Examples by use case

**Pass a single vector to rename every column.** The vector length must equal the number of columns, and names are assigned left to right in column order.

```r title="Rename every column at once"
library(data.table)
DT <- data.table(a = 1:3, b = 4:6, c = 7:9)
setnames(DT, c("x", "y", "z"))
names(DT)
#> [1] "x" "y" "z"
```

**Pass `old` and `new` vectors to rename only selected columns.** Columns you do not list keep their original names, and the order of the pairs does not matter as long as `old` and `new` line up.

```r title="Rename selected columns by name"
DT <- data.table(mpg = c(21, 22.8), cyl = c(6, 4), hp = c(110, 93))
setnames(DT, old = c("mpg", "hp"), new = c("miles_per_gallon", "horsepower"))
names(DT)
#> [1] "miles_per_gallon" "cyl"              "horsepower"
```

**Use integer positions when names are awkward to type.** Positions are handy when current names contain spaces or special characters. You can also hand `setnames()` a function, which it applies to generate the new names.

```r title="Rename by position or with a function"
DT <- data.table(A = 1:2, B = 3:4, C = 5:6)
setnames(DT, 1:2, c("first", "second"))   # rename by position
names(DT)
#> [1] "first"  "second" "C"
setnames(DT, tolower)                     # function applied to all names
names(DT)
#> [1] "first"  "second" "c"
```

**Set `skip_absent = TRUE` when the old names may not all exist.** This matters in reusable functions where a column might be present in some inputs and missing from others.

```r title="Skip names that do not exist"
DT <- data.table(id = 1:2, val = 3:4)
setnames(DT, c("id", "missing"), c("key", "amount"), skip_absent = TRUE)
names(DT)
#> [1] "key" "val"
```

Here `"missing"` is not a real column, so its rename is silently dropped while `"id"` still becomes `"key"`. Without `skip_absent`, the same call would stop with an error.

## Compare setnames() with alternatives

**setnames() is the in-place option; other tools return copies.** Choose based on whether you want reference semantics and which package your code already depends on.

| Approach | Copies the data? | Best for |
|---|---|---|
| `setnames(DT, old, new)` | No, edits in place | Large tables, data.table workflows |
| `names(df)[i] <- "new"` | Yes, copies the frame | Quick base R edits on small data |
| `dplyr::rename(df, new = old)` | Yes, returns new tibble | tidyverse pipelines |
| `data.table::setattr(DT, "names", v)` | No | Low-level control over all names |

The decision rule is simple. Inside a data.table workflow on data of any real size, use `setnames()`. Reach for `rename()` only when you are already in a dplyr pipeline and the copy cost is acceptable.

[NOTE]
**Coming from dplyr?** `rename()` puts the new name first: `rename(df, horsepower = hp)`. `setnames()` puts old before new: `setnames(DT, "hp", "horsepower")`. The argument order is reversed between the two functions, which is a frequent source of confusion when switching.

## Common pitfalls

**The original object changes even without assignment.** Because `setnames()` works by reference, every variable pointing at that table sees the new names. Copy first with `copy()` if you need the old names preserved.

```r title="Reference semantics surprise"
DT <- data.table(a = 1:3)
DT2 <- DT                 # NOT a copy, same object
setnames(DT2, "a", "x")
names(DT)
#> [1] "x"                # DT changed too
```

**Unmatched names raise an error by default.** If a name in `old` is not a real column, `setnames()` stops unless you set `skip_absent = TRUE`.

```r title="Missing name without skip_absent"
DT <- data.table(a = 1:3)
setnames(DT, "b", "x")
#> Error in setnames(DT, "b", "x"): Items of 'old' not found
#> in column names: [b]
```

**The `old` and `new` vectors must be the same length.** A length mismatch is a common copy-paste mistake and also throws an error, so check both vectors when you extend a rename to more columns.

[WARNING]
**setnames() inside a function mutates the caller's table.** If you pass a data.table to your own function and call `setnames()` on it, the rename leaks back to the caller. Call `copy()` at the top of the function when you want a self-contained transformation.

## Try it yourself

**Try it:** Rename the `wt` column of a data.table to `weight` and `qsec` to `quarter_mile`, leaving other columns untouched. Save the result to `ex_dt`.

```r title="Your turn: rename two columns"
# Try it: rename wt and qsec
ex_dt <- as.data.table(mtcars)
# your code here

names(ex_dt)
#> Expected: "weight" and "quarter_mile" appear
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_dt <- as.data.table(mtcars)
setnames(ex_dt, c("wt", "qsec"), c("weight", "quarter_mile"))
names(ex_dt)[c(6, 7)]
#> [1] "weight"       "quarter_mile"
```

**Explanation:** Passing matched `old` and `new` vectors renames only those columns. Every other column name stays exactly as it was, and no copy of the table is made.

</details>

## Related data.table functions

**setnames() belongs to a family of by-reference `set*` helpers.** Each one modifies a data.table in place for speed, and learning the set is the quickest way to write idiomatic data.table code.

- `setcolorder()` reorders columns without renaming them.
- `setkey()` sorts a table and marks key columns for fast joins and subsetting.
- `setDT()` converts a data.frame or list to a data.table in place.
- `setorder()` sorts rows by one or more columns by reference.

For deeper background on how these by-reference operations differ from the tidyverse approach, the data.table versus dplyr comparison covers the trade-offs in full.

## FAQ

**Does setnames() modify the original data.table?**

Yes. `setnames()` changes the column names by reference, so the original object is updated directly with no copy made. You do not assign the result back to a variable. Any other variable bound to the same table also reflects the new names immediately. If you need the old names kept, make an explicit `copy()` of the table before calling `setnames()`.

**Can setnames() rename columns of a data.frame?**

Yes. `setnames()` works on plain data frames as well as data.tables, and it still modifies them by reference. This is a useful trick for renaming a large data.frame without the memory cost of `names(df) <-`. The data.table package must be loaded with `library(data.table)` for the function to be available in your session.

**How do I rename a column by position instead of name?**

Pass integer positions as the `old` argument. For example, `setnames(DT, 2, "new_name")` renames the second column. You can pass a vector of positions and a matching vector of names to rename several at once. Positions are useful when the current names contain spaces or special characters that are awkward to quote and type.

**What does skip_absent do in setnames()?**

`skip_absent = TRUE` tells `setnames()` to ignore any name in `old` that is not an actual column, instead of stopping with an error. The default is `FALSE`, which raises an error on the first unmatched name. Use `skip_absent = TRUE` in reusable functions where the set of input columns may vary from one call to the next.

**Why use setnames() instead of names()?**

`setnames()` renames columns without copying the entire table, while `names(df) <- value` triggers a full copy of the data. On large datasets this makes `setnames()` far faster and far more memory efficient. It also lets you rename a subset of columns directly by name or position, rather than rebuilding the whole names vector by hand.
