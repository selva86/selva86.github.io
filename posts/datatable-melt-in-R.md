---
title: "data.table melt() in R: Reshape Wide Data to Long Format"
slug: "datatable-melt-in-R"
description: "Reshape wide data.tables into long format with melt() in R. Covers id.vars, measure.vars, variable.name, value.name, na.rm, and patterns() with examples."
keywords: "data.table melt, melt function R, data.table melt examples, R melt wide to long, melt.data.table, data.table reshape, melt id.vars measure.vars"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "datatable-functions"
fr_parent: "data-table-vs-dplyr.html"
auto_link_terms: "melt()|data.table melt|data.table::melt()|melt.data.table|melt data.table|reshape wide to long"
auto_link_case_sensitive: true
target_keyword: "data.table melt"
sibling_block_enabled: true
difficulty: "Beginner"
---

# data.table melt() in R: Reshape Wide Data to Long Format

<p class="lead">The <code>melt()</code> function from data.table reshapes a wide <code>data.table</code> into long format, stacking many measure columns into one <code>variable</code> column and one <code>value</code> column for fast, memory-efficient pivoting.</p>

[QUICK ANSWER]
melt(dt)                                                           # melt every non-id column
melt(dt, id.vars = "id")                                           # keep id, melt the rest
melt(dt, id.vars = "id", measure.vars = c("a", "b"))               # melt selected columns
melt(dt, id.vars = "id", variable.name = "var", value.name = "val") # name the new columns
melt(dt, id.vars = "id", na.rm = TRUE)                             # drop NA rows
melt(dt, measure.vars = patterns("^x_", "^y_"), value.name = c("x", "y")) # multi-melt by regex
melt(dt, measure.vars = list(c("a1","a2"), c("b1","b2")), value.name = c("a","b")) # multi-melt by list

[DECISION TREE: Is melt() the right tool?]
- reshape wide to long: melt(dt, id.vars = "id")
- reshape long back to wide: dcast(dt, id ~ variable, value.var = "value")
- stack many tables vertically: rbindlist(list_of_tables)
- join two tables by a key: merge(dt, lookup, by = "id")
- split a delimited string column: tstrsplit(dt$col, ",")
- count distinct values: uniqueN(dt$col)

## What melt() does in one sentence

**`melt()` collapses many columns into two.** You hand it a wide `data.table` plus a list of identifier columns, and it returns a long `data.table` where every former column header becomes a value in a new `variable` column and every former cell becomes a value in a new `value` column. One wide row with N measure columns turns into N long rows.

The reason `data.table melt` exists separately from base R `reshape()` is speed. The implementation is written in C and designed for in-memory data sets up to tens of gigabytes. It also handles features `reshape()` cannot, such as melting groups of columns into multiple value columns in a single pass.

## Syntax

**`melt()` takes a data table plus identifier and measure column specs.** Only the data argument is strictly required; sensible defaults fill in the rest.

```r title="Load data.table and prepare wide data"
library(data.table)

DT <- data.table(
  family     = c("F1", "F2", "F3"),
  age_mother = c(30, 27, 35),
  dob_child1 = c("1998-04-12", "1996-06-09", "2002-08-22"),
  dob_child2 = c("2001-03-15", NA,           "2005-11-30"),
  dob_child3 = c(NA,           NA,           "2010-07-04")
)
DT
#>    family age_mother dob_child1 dob_child2 dob_child3
#>    <char>      <num>     <char>     <char>     <char>
#> 1:     F1         30 1998-04-12 2001-03-15       <NA>
#> 2:     F2         27 1996-06-09       <NA>       <NA>
#> 3:     F3         35 2002-08-22 2005-11-30 2010-07-04
```

The full signature is `melt(data, id.vars, measure.vars, variable.name = "variable", value.name = "value", ..., na.rm = FALSE, variable.factor = TRUE, value.factor = FALSE)`. Its arguments are:

- `data`: the wide `data.table` to reshape.
- `id.vars`: columns to keep as identifiers, repeated in every long row.
- `measure.vars`: columns to stack. Accepts a character vector, integer indices, a `list()` of vectors, or `patterns()` for regex matching.
- `variable.name`: name of the new column that stores the original column headers. Defaults to `"variable"`.
- `value.name`: name of the new value column, or a vector of names when melting into multiple value columns.
- `na.rm`: when `TRUE`, drops rows where the value is `NA`.
- `variable.factor`: when `TRUE` (the default), returns the `variable` column as a factor; set to `FALSE` for character.

[TIP]
**Always set `variable.name` and `value.name` to meaningful labels.** The defaults `"variable"` and `"value"` produce ambiguous downstream code. A column called `child` is far easier to filter and group on than one called `variable`.

## Melting wide data: four common patterns

### 1. Melt every non-identifier column

**Specifying only `id.vars` melts every other column automatically.** This is the fastest way to convert a typical wide dataset.

```r title="Melt every column except id.vars"
melt(DT, id.vars = c("family", "age_mother"))
#>    family age_mother   variable      value
#>    <char>      <num>     <fctr>     <char>
#> 1:     F1         30 dob_child1 1998-04-12
#> 2:     F2         27 dob_child1 1996-06-09
#> 3:     F3         35 dob_child1 2002-08-22
#> 4:     F1         30 dob_child2 2001-03-15
#> 5:     F2         27 dob_child2       <NA>
#> 6:     F3         35 dob_child2 2005-11-30
#> 7:     F1         30 dob_child3       <NA>
#> 8:     F2         27 dob_child3       <NA>
#> 9:     F3         35 dob_child3 2010-07-04
```

Three families with three child columns become nine rows. The `dob_child*` headers move into the `variable` column, the dates move into the `value` column, and the identifiers repeat once per former measure column.

### 2. Name the measure subset and the new columns

**Passing both `id.vars` and `measure.vars` selects a subset and renames the output.** Use this when only some columns should be reshaped, or when the default names are unhelpful.

```r title="Subset measure columns and rename"
melt(DT,
     id.vars       = "family",
     measure.vars  = c("dob_child1", "dob_child2"),
     variable.name = "child",
     value.name    = "dob")
#>    family      child        dob
#>    <char>     <fctr>     <char>
#> 1:     F1 dob_child1 1998-04-12
#> 2:     F2 dob_child1 1996-06-09
#> 3:     F3 dob_child1 2002-08-22
#> 4:     F1 dob_child2 2001-03-15
#> 5:     F2 dob_child2       <NA>
#> 6:     F3 dob_child2 2005-11-30
```

`dob_child3` is excluded because it is not in `measure.vars`, and the result columns now read as `family`, `child`, `dob` rather than the cryptic defaults.

### 3. Drop NA rows with na.rm = TRUE

**Wide tables with missing measures produce long rows full of `NA`s.** Setting `na.rm = TRUE` removes them during the melt itself, which is faster than melting first and filtering after.

```r title="Drop NA rows during melt"
melt(DT,
     id.vars      = c("family", "age_mother"),
     na.rm        = TRUE,
     variable.name = "child",
     value.name    = "dob")
#>    family age_mother      child        dob
#>    <char>      <num>     <fctr>     <char>
#> 1:     F1         30 dob_child1 1998-04-12
#> 2:     F2         27 dob_child1 1996-06-09
#> 3:     F3         35 dob_child1 2002-08-22
#> 4:     F1         30 dob_child2 2001-03-15
#> 5:     F3         35 dob_child2 2005-11-30
#> 6:     F3         35 dob_child3 2010-07-04
```

Six rows instead of nine, with every row carrying a real date.

### 4. Melt into multiple value columns with patterns()

**Some wide tables have parallel column families.** A family record may store `name_child1`, `name_child2`, `gender_child1`, `gender_child2`. The right long shape is one row per child with separate `name` and `gender` columns, not a single `value` column mixing names and genders.

```r title="Wider table with two parallel families"
DT2 <- data.table(
  family        = c("F1", "F2", "F3"),
  name_child1   = c("Aiden", "Liam", "Mia"),
  name_child2   = c("Bea",   "Noah", "Eli"),
  gender_child1 = c("M",     "M",    "F"),
  gender_child2 = c("F",     "M",    "M")
)

melt(DT2,
     id.vars      = "family",
     measure.vars = patterns("^name_", "^gender_"),
     value.name   = c("name",  "gender"))
#>    family variable   name gender
#>    <char>   <fctr> <char> <char>
#> 1:     F1        1  Aiden      M
#> 2:     F2        1   Liam      M
#> 3:     F3        1    Mia      F
#> 4:     F1        2    Bea      F
#> 5:     F2        2   Noah      M
#> 6:     F3        2    Eli      M
```

`patterns()` matches each regex against the column names, groups the matches in order, and stacks each group into its own value column. The `variable` column then numbers the position within a group (1 for `*_child1`, 2 for `*_child2`).

[KEY INSIGHT]
**`patterns()` turns one melt into a parallel multi-melt.** Without it, you would call `melt()` twice (once for names, once for genders) and then `merge()` the results. `patterns()` does the same job in a single pass, allocating the result once instead of twice.

## melt() vs base reshape() and tidyr pivot_longer()

**All three reshape wide to long, but they differ in speed, syntax, and feature coverage.** `melt()` is the fastest and the only one with built-in parallel-column melting; `pivot_longer()` is the most readable; `reshape()` requires no extra packages.

| Feature                       | data.table `melt()`        | base `reshape()`           | tidyr `pivot_longer()`     |
|---|---|---|---|
| Speed on large data           | Fastest (written in C)     | Slow                       | Moderate                   |
| Multiple value columns        | `patterns()` / list        | Awkward                    | `names_to` + `names_pattern` |
| Return type                   | `data.table`               | `data.frame`               | `tibble`                   |
| Key argument names            | `id.vars`, `measure.vars`  | `varying`, `v.names`, `timevar` | `cols`, `names_to`, `values_to` |
| Available without extras      | needs `data.table`         | base R                     | needs `tidyr`              |

Pick `melt()` when the input is already a `data.table` or when the data is large enough that the C implementation matters. Reach for `pivot_longer()` when the rest of your pipeline is tidyverse, and use base `reshape()` only when you cannot install additional packages.

[NOTE]
**Coming from Python pandas?** The equivalent of `melt(dt, id.vars = "id")` is `pandas.melt(df, id_vars = "id")`. The argument names match almost one-to-one.

## Common pitfalls

**Pitfall 1: mixed-type measure columns get coerced to a common type.** A long `value` column can only hold one type, so melting a numeric column alongside a character column promotes everything to character.

```r title="Type coercion when measure columns differ"
DT3 <- data.table(id = 1:2, x = c(1.5, 2.5), y = c("a", "b"))
melt(DT3, id.vars = "id")
#>       id variable  value
#>    <int>   <fctr> <char>
#> 1:     1        x    1.5
#> 2:     2        x    2.5
#> 3:     1        y      a
#> 4:     2        y      b
```

The numeric `1.5` and `2.5` come back as strings. Keep measure columns to a single type, or split the melt into two calls.

**Pitfall 2: the variable column is a factor by default.** `variable.factor = TRUE` is convenient for plotting but inconvenient for string operations like `grepl()` or `substr()`. Set `variable.factor = FALSE` if you plan to manipulate the column as text.

**Pitfall 3: forgetting `na.rm` produces inflated row counts.** A wide table with sparse measure cells melts to a long table dominated by `NA` rows. Always check `nrow()` before and after, and add `na.rm = TRUE` when the `NA`s carry no meaning.

[WARNING]
**Never melt a table with columns of incompatible types and ignore the warning.** `melt()` does its best, but silently promoting numbers to strings or dates to characters breaks downstream joins and aggregations. If you see a "All measure variables are not of the same type" message, fix the input rather than the output.

## Try it yourself

**Try it:** Melt the wide table `sales_wide` below into long format. Keep `store` as the identifier, rename the new columns to `month` and `revenue`, and drop rows where revenue is `NA`. Save the result to `ex_long`.

```r title="Your turn: melt sales data"
# Try it: melt sales_wide into long format
sales_wide <- data.table(
  store = c("S1", "S2", "S3"),
  jan   = c(120, NA,  90),
  feb   = c(150, 200, NA),
  mar   = c(NA,  180, 110)
)

ex_long <- # your code here

ex_long
#> Expected: 6 rows with columns store, month, revenue
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_long <- melt(sales_wide,
                id.vars       = "store",
                variable.name = "month",
                value.name    = "revenue",
                na.rm         = TRUE)
ex_long
#>     store  month revenue
#>    <char> <fctr>   <num>
#> 1:     S1    jan     120
#> 2:     S3    jan      90
#> 3:     S1    feb     150
#> 4:     S2    feb     200
#> 5:     S2    mar     180
#> 6:     S3    mar     110
```

**Explanation:** `id.vars = "store"` keeps `store` repeated on every row, `variable.name` and `value.name` rename the stacked columns, and `na.rm = TRUE` drops the three rows whose revenue was missing. The result has six rows and three columns instead of three rows and four columns.

</details>

## Related data.table functions

These functions pair naturally with `melt()` when reshaping or combining wide and long data:

- `dcast()`: the inverse of `melt()`; pivots a long table back to wide format.
- `rbindlist()`: stacks a list of tables by row, often used before melting many files.
- `merge()`: joins two tables on a shared key, useful for adding lookup columns after a melt.
- `tstrsplit()`: splits a delimited string column into multiple columns, sometimes a substitute for `melt()` plus `patterns()`.
- `setnames()`: renames columns in place, handy for tidying the `variable` column after a melt.

## FAQ

**What is the difference between melt and dcast in data.table?**

`melt()` reshapes a wide table to long format by stacking many measure columns into a `variable` and `value` pair; `dcast()` does the reverse, pivoting a long table back to wide by spreading one column's values across new columns. They are inverses: `dcast(melt(dt, id.vars = "id"), id ~ variable)` returns the original wide table. Use `melt()` when you have one column per measure and want one row per observation; use `dcast()` when you have one row per observation and want one column per measure.

**How do you melt multiple columns at once in data.table?**

Pass a `list()` of column vectors or a `patterns()` call to `measure.vars`, and a vector of names to `value.name`. For example, `melt(dt, measure.vars = patterns("^name_", "^gender_"), value.name = c("name", "gender"))` collapses every column starting with `name_` into a `name` column and every column starting with `gender_` into a `gender` column, all in one pass.

**Is data.table melt faster than tidyr pivot_longer?**

Yes, on large data. `melt()` is written in C and pre-allocates the result, so on tables with millions of rows it typically runs several times faster than `pivot_longer()`. On small tables the difference is negligible and `pivot_longer()` reads more clearly. The rule of thumb is to use `melt()` when speed matters or the input is already a `data.table`, and `pivot_longer()` when the rest of the pipeline is tidyverse.

**Why is the variable column a factor after melt?**

`melt()` sets `variable.factor = TRUE` by default because plotting and grouping run faster on factors. To manipulate the column as a string, pass `variable.factor = FALSE` to get a character column instead.

For the official argument reference, see the [data.table melt and dcast vignette](https://rdatatable.gitlab.io/data.table/articles/datatable-reshape.html).
