---
title: "data.table dcast() in R: Reshape Long Data to Wide Format"
slug: "datatable-dcast-in-R"
description: "Reshape long data.tables to wide format with dcast() in R. Learn formula syntax, value.var, fun.aggregate, fill, multi-measure casts, and common pitfalls."
keywords: "data.table dcast, dcast function R, data.table dcast examples, R dcast long to wide, dcast.data.table, data.table reshape, dcast fun.aggregate"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "datatable-functions"
fr_parent: "data-table-vs-dplyr.html"
auto_link_terms: "dcast()|data.table dcast|data.table::dcast()|dcast.data.table|reshape long to wide"
auto_link_case_sensitive: true
target_keyword: "data.table dcast"
sibling_block_enabled: true
difficulty: "Beginner"
---

# data.table dcast() in R: Reshape Long Data to Wide Format

<p class="lead">The <code>dcast()</code> function from data.table reshapes a long <code>data.table</code> into wide format by spreading one column's values across new columns named after the levels of another column, with optional aggregation when duplicate id-by-variable combinations exist.</p>

[QUICK ANSWER]
dcast(dt, id ~ variable)                                   # default reshape
dcast(dt, id ~ variable, value.var = "value")              # specify value column
dcast(dt, id ~ variable, fun.aggregate = sum)              # aggregate duplicates
dcast(dt, id ~ variable, fill = 0)                         # fill missing combos
dcast(dt, id ~ variable, value.var = c("v1", "v2"))        # multiple value cols
dcast(dt, id + grp ~ variable)                             # multiple LHS ids
dcast(dt, id ~ year + qtr, value.var = "x")                # cross multiple RHS
dcast(dt, id ~ ., value.var = "x", fun.aggregate = mean)   # collapse to one col

[DECISION TREE: Is dcast() the right tool?]
- reshape long to wide: dcast(dt, id ~ variable)
- reshape wide back to long: melt(dt, id.vars = "id")
- compute group summaries without pivoting: dt[, mean(x), by = grp]
- join two tables by a key: merge(dt, lookup, by = "id")
- count occurrences in a cross-tab: table(dt$col1, dt$col2)
- transpose rows and columns: data.table(t(dt))
- split one column into many: tstrsplit(dt$col, ",")

## What dcast() does in one sentence

**`dcast()` spreads a long table into a wide one using a formula.** You hand it a long `data.table` and a formula of the form `id_cols ~ category_col`, and it returns a wide `data.table` where each unique value of the category column becomes its own column, populated by the values from `value.var`.

The reason `data.table dcast` exists alongside base `reshape()` is speed and ergonomics. The implementation is written in C and pre-allocates the output, and it accepts an aggregation function inline so a pivot and a summarise step run in a single call.

## Syntax

**`dcast()` takes a long data table, a formula, and optional value, aggregator, and fill arguments.** Only the data and formula are required; everything else has sensible defaults.

```r title="Load data.table and prepare long data"
library(data.table)

DT <- data.table(
  family = c("F1", "F1", "F2", "F2", "F3", "F3"),
  child  = c("c1", "c2", "c1", "c2", "c1", "c2"),
  dob    = c("1998-04-12", "2001-03-15",
             "1996-06-09", NA,
             "2002-08-22", "2005-11-30")
)
DT
#>    family  child        dob
#>    <char> <char>     <char>
#> 1:     F1     c1 1998-04-12
#> 2:     F1     c2 2001-03-15
#> 3:     F2     c1 1996-06-09
#> 4:     F2     c2       <NA>
#> 5:     F3     c1 2002-08-22
#> 6:     F3     c2 2005-11-30
```

The full signature is `dcast(data, formula, fun.aggregate = NULL, ..., margins = NULL, subset = NULL, fill = NULL, drop = TRUE, value.var = guess(data), verbose = getOption("datatable.verbose"))`. Its arguments are:

- `data`: the long `data.table` to reshape.
- `formula`: an expression like `id_cols ~ category_cols`. Left side becomes row keys; right side names the column spread into new columns. Use `+` to combine columns on either side.
- `value.var`: the column whose values fill the new wide cells. Pass a character vector to spread several at once.
- `fun.aggregate`: a function that collapses duplicate id-by-category rows into one value. Defaults to `length` with a warning if omitted when duplicates exist.
- `fill`: value written into missing id-by-category cells. Defaults to `NA`.
- `drop`: when `TRUE`, unused factor levels in the formula are dropped; set `FALSE` to keep empty columns.

[TIP]
**Always state `value.var` explicitly when more than one non-id column exists.** `dcast()` will guess, and the guess is usually right, but spelling it out makes the call self-documenting and removes the friendly "Aggregate function missing, defaulting to 'length'" warning that hides real aggregation bugs.

## Reshaping long data: four common patterns

### 1. Basic pivot with one id and one category

**Specifying `id ~ category` is the minimal pivot.** The unique values in the category column become the new column names; the value column fills the cells.

```r title="Pivot one id by one category"
dcast(DT, family ~ child, value.var = "dob")
#>    family         c1         c2
#>    <char>     <char>     <char>
#> 1:     F1 1998-04-12 2001-03-15
#> 2:     F2 1996-06-09       <NA>
#> 3:     F3 2002-08-22 2005-11-30
```

Six long rows collapse into three wide rows. Every unique `child` value becomes a column; missing combinations show up as `NA`.

### 2. Aggregate duplicates with fun.aggregate

**When an id-by-category combination appears more than once, `dcast()` needs an aggregator.** Pass any single-value-returning function to `fun.aggregate`: `sum`, `mean`, `median`, `length`, or a user-defined function.

```r title="Aggregate duplicate combinations"
sales <- data.table(
  store   = c("S1", "S1", "S1", "S2", "S2", "S2"),
  month   = c("jan", "jan", "feb", "jan", "feb", "feb"),
  revenue = c(120,    30,   150,   200,   80,   100)
)

dcast(sales, store ~ month,
      value.var     = "revenue",
      fun.aggregate = sum)
#>     store   feb   jan
#>    <char> <num> <num>
#> 1:     S1   150   150
#> 2:     S2   180   200
```

Store `S1` has two January rows that sum to 150; store `S2` has two February rows that sum to 180. Without `fun.aggregate`, `dcast()` warns and uses `length`, which returns counts rather than totals.

### 3. Spread multiple value columns in one pass

**`value.var` accepts a character vector to spread several measures at once.** The result has one set of wide columns per measure, with names prefixed by the measure name.

```r title="Spread two measures in one call"
records <- data.table(
  family = c("F1", "F1", "F2", "F2", "F3", "F3"),
  child  = c("c1", "c2", "c1", "c2", "c1", "c2"),
  name   = c("Aiden", "Bea", "Liam", "Noah", "Mia", "Eli"),
  gender = c("M",     "F",   "M",    "M",    "F",   "M")
)

dcast(records, family ~ child,
      value.var = c("name", "gender"))
#>    family name_c1 name_c2 gender_c1 gender_c2
#>    <char>  <char>  <char>    <char>    <char>
#> 1:     F1   Aiden     Bea         M         F
#> 2:     F2    Liam    Noah         M         M
#> 3:     F3     Mia     Eli         F         M
```

Both `name` and `gender` spread by `child`, producing four wide columns. This is the inverse of a `melt()` call with `patterns()`, in one pre-allocated pass.

### 4. Fill missing combinations with fill = value

**By default, absent id-by-category combinations become `NA`.** Pass `fill` to substitute a different value, which is handy for counts and incidence tables where zero is the correct answer.

```r title="Replace NA cells with zero"
inventory <- data.table(
  warehouse = c("A", "A", "B"),
  product   = c("widget", "gadget", "widget"),
  units     = c(5,         10,       8)
)

dcast(inventory, warehouse ~ product,
      value.var = "units",
      fill      = 0)
#>    warehouse gadget widget
#>       <char>  <num>  <num>
#> 1:         A     10      5
#> 2:         B      0      8
```

Warehouse `B` has no `gadget` row, so without `fill = 0` that cell would be `NA`. For counts, presence-absence matrices, or contingency tables, `fill = 0` is usually the right answer.

[KEY INSIGHT]
**A `dcast()` formula with `fun.aggregate` is a pivot table in one line.** It collapses duplicates, spreads categories into columns, and fills gaps in a single C pass, where a tidyverse equivalent needs `group_by()` plus `summarise()` plus `pivot_wider()`.

## dcast() vs base reshape() and tidyr pivot_wider()

**All three reshape long to wide but differ in speed, syntax, and feature coverage.** `dcast()` is fastest and the only one with built-in aggregation; `pivot_wider()` reads cleanest; base `reshape()` needs no extra package.

| Feature                       | data.table `dcast()`         | base `reshape()`           | tidyr `pivot_wider()`         |
|---|---|---|---|
| Speed on large data           | Fastest (written in C)       | Slow                       | Moderate                      |
| Inline aggregation            | `fun.aggregate = sum`        | Not supported              | `values_fn = sum`             |
| Multiple value columns        | `value.var = c("a", "b")`    | Awkward                    | `values_from = c(a, b)`       |
| Fill missing combinations     | `fill = 0`                   | Not supported              | `values_fill = 0`             |
| Return type                   | `data.table`                 | `data.frame`               | `tibble`                      |
| Available without extras      | needs `data.table`           | base R                     | needs `tidyr`                 |

Pick `dcast()` when the input is already a `data.table`, when aggregation belongs in the same step, or when the data is large. Reach for `pivot_wider()` in a tidyverse pipeline, and use base `reshape()` only when extra packages are unavailable.

[NOTE]
**Coming from Python pandas?** The equivalent of `dcast(dt, id ~ var, value.var = "x")` is `df.pivot(index = "id", columns = "var", values = "x")`. To aggregate duplicates, use `df.pivot_table(..., aggfunc = "sum")`.

## Common pitfalls

**Pitfall 1: forgetting `fun.aggregate` when duplicates exist.** If the same id-by-category combination appears more than once and no aggregator is given, `dcast()` defaults to `length` and prints a warning. The result is a count, not the value you expected.

```r title="Missing fun.aggregate produces counts"
dups <- data.table(id = c(1, 1, 2), k = c("a", "a", "b"), x = c(10, 20, 30))
dcast(dups, id ~ k, value.var = "x")
#> Aggregate function missing, defaulting to 'length'
#>       id     a     b
#>    <num> <int> <int>
#> 1:     1     2     0
#> 2:     2     0     1
```

The `a` cell for id 1 shows `2` because two rows match, not `10` or `20`. Pass `fun.aggregate = sum` (or `mean`, `first`) for the expected behaviour.

**Pitfall 2: `value.var` is guessed and the guess can be wrong.** When several non-id columns exist, `dcast()` picks the first non-formula column and warns. If you intended a different column, the wide table is silently filled with the wrong values.

**Pitfall 3: factor levels in formula columns are dropped by default.** `drop = TRUE` removes columns for unused factor levels. For a full grid (e.g. a monthly report covering months with no data), pass `drop = FALSE`.

[WARNING]
**Never ignore the "Aggregate function missing" warning in production code.** It always points at a real ambiguity in the input. Either the data has unexpected duplicates that need investigation, or the call needs an explicit `fun.aggregate`. Treat the warning as an error during data validation.

## Try it yourself

**Try it:** Pivot the long table `scores_long` below into wide format. Use `student` as the row id, spread by `subject`, and fill empty cells with zero. Save the result to `ex_wide`.

```r title="Your turn: pivot scores wide"
# Try it: pivot scores_long wide by subject
scores_long <- data.table(
  student = c("Ana", "Ana", "Ben", "Ben", "Cal"),
  subject = c("math", "sci", "math", "eng", "sci"),
  score   = c(82,     91,    74,     88,    65)
)

ex_wide <- # your code here

ex_wide
#> Expected: 3 rows with columns student, eng, math, sci
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_wide <- dcast(scores_long, student ~ subject,
                 value.var = "score",
                 fill      = 0)
ex_wide
#>    student   eng  math   sci
#>     <char> <num> <num> <num>
#> 1:     Ana     0    82    91
#> 2:     Ben    88    74     0
#> 3:     Cal     0     0    65
```

**Explanation:** `student ~ subject` lays out one row per student and one column per subject; `value.var = "score"` tells `dcast()` which column to spread; `fill = 0` writes zero into the cells where a student did not take a subject, so the result is a clean three-by-four wide table.

</details>

## Related data.table functions

These functions pair naturally with `dcast()` when reshaping, aggregating, or combining tables:

- `melt()`: the inverse of `dcast()`; collapses many columns into one variable and one value column.
- `merge()`: joins two tables on a shared key, often used to attach lookups before or after a cast.
- `rbindlist()`: stacks a list of tables by row, useful when several long tables need to be cast together.
- `setnames()`: renames columns in place, handy for cleaning the auto-generated names after a multi-measure cast.
- `setkey()`: sets a sort key on a `data.table`, which speeds up the merge that often follows a cast.

## FAQ

**What is the difference between dcast and melt in data.table?**

`dcast()` reshapes long to wide by spreading one column's values across new columns; `melt()` does the reverse, stacking many measure columns into a `variable` and `value` pair. They are inverses: `dcast(melt(dt, id.vars = "id"), id ~ variable)` returns the original wide table. Use `dcast()` to get one row per observation with one column per measure.

**How do you aggregate while reshaping with data.table dcast?**

Pass a function to `fun.aggregate`. For example, `dcast(sales, store ~ month, value.var = "revenue", fun.aggregate = sum)` sums duplicate store-by-month rows during the pivot. Any single-value-returning function works: `mean`, `median`, `min`, `max`, or a user-defined wrapper like `function(x) sum(x, na.rm = TRUE)`. This collapses group-by and pivot into one call.

**How do you spread multiple value columns at once with dcast?**

Pass a character vector to `value.var`. For example, `dcast(records, family ~ child, value.var = c("name", "gender"))` returns one set of wide columns per measure, with the measure name prefixed to the category value (e.g. `name_c1`, `gender_c1`). It runs in a single pre-allocated pass.

**Is data.table dcast faster than tidyr pivot_wider?**

Yes, on large data. `dcast()` is written in C and pre-allocates the result, so on millions of rows it typically runs several times faster than `pivot_wider()`. On small tables the difference is negligible. Use `dcast()` when speed matters or the input is already a `data.table`; reach for `pivot_wider()` in a tidyverse pipeline.

For the official argument reference, see the [data.table melt and dcast vignette](https://rdatatable.gitlab.io/data.table/articles/datatable-reshape.html).
