---
title: "data.table .SD in R: Subset of Data for Per-Group Operations"
slug: datatable-SD-keyword-in-R
description: "data.table .SD in R is the Subset of Data inside j, letting lapply, head and tail run once per group. See .SDcols, update-in-place, examples, pitfalls."
keywords: "data.table .SD, .SD data.table, .SDcols data.table, .SD keyword data.table, R data.table SD, data.table SD examples, lapply .SD"
mathjax: false
webr: true
date: "2026-05-22"
post_type: PSEO
category_id: function-deep
subcategory_id: datatable-functions
fr_parent: data-table-vs-dplyr.html
auto_link_terms: ".SD|data.table .SD|.SDcols|.SD keyword|Subset of Data"
auto_link_case_sensitive: true
target_keyword: "data.table .SD"
sibling_block_enabled: true
difficulty: Beginner
---

# data.table .SD in R: Subset of Data for Per-Group Operations

<p class="lead">The <code>.SD</code> symbol in <code>data.table</code> stands for Subset of Data and represents a data.table of the current group's rows inside <code>j</code>, so any function that takes a data frame can be applied once per group.</p>

[QUICK ANSWER]
dt[, lapply(.SD, mean), by = cyl]                       # mean of every column per group
dt[, lapply(.SD, mean), by = cyl, .SDcols = c("mpg","hp")]   # restrict to columns
dt[, .SD[1L], by = cyl]                                 # first row per group
dt[, .SD[.N], by = cyl]                                 # last row per group
dt[, .SD[which.max(mpg)], by = cyl]                     # row with max mpg per group
dt[, head(.SD, 2), by = cyl]                            # top 2 rows per group
dt[, (cols) := lapply(.SD, scale), .SDcols = cols]      # update many columns in place

[DECISION TREE: Is .SD the right tool?]
- apply one function to many columns per group: dt[, lapply(.SD, mean), by = grp]
- restrict which columns .SD sees: dt[, lapply(.SD, mean), .SDcols = patterns("^x")]
- aggregate one column only: dt[, mean(x), by = grp]
- pick rows by position per group: dt[, .SD[1L], by = grp]
- add or modify columns in place: dt[, x := x * 2]
- summarize many columns with different functions: dt[, .(m = mean(x), s = sd(y)), by = grp]
- pivot long to wide: dcast(dt, id ~ name, value.var = "x")

## What .SD does in one sentence

**`.SD` is a data.table that holds the current group's rows.** Inside `j`, `.SD` refers to all columns of the table except the ones listed in `by`, unless you narrow it with `.SDcols`. data.table builds a fresh `.SD` for every group and exposes it as a local variable, so `lapply(.SD, fn)` runs `fn` once per column per group.

Without `by`, `.SD` is the whole table. The name reads as "Subset of Data" and matches that intuition: it is whichever slice `j` is currently working on.

## Syntax

**`.SD` and `.SDcols` are paired symbols that only have meaning inside `DT[i, j, by]`.** You use `.SD` as a value (often inside `lapply` or `head`) and `.SDcols` as an argument to the bracket call that controls which columns `.SD` contains.

```r title="data.table query with .SD and .SDcols"
DT[i, j, by, .SDcols = ...]   # .SDcols restricts the columns visible inside .SD
```

`.SDcols` accepts:

- A character vector of column names, like `c("mpg", "hp")`.
- A numeric or negative index, like `2:4` or `-1`.
- A `patterns()` helper that matches by regex, like `patterns("^d")`.
- A function predicate, like `is.numeric` (one column kept if the predicate returns `TRUE`).

The grouping columns named in `by` are always excluded from `.SD` so you do not double-summarize them.

## Examples by use case

**Build a single `dt` and reuse it for every example.** Every block below works on the same table created from `mtcars`.

```r title="Create a data.table from mtcars"
library(data.table)

dt <- as.data.table(mtcars, keep.rownames = "model")
dt[1:3, .(model, mpg, cyl, hp, wt)]
#>            model   mpg   cyl    hp    wt
#>           <char> <num> <num> <num> <num>
#> 1:     Mazda RX4  21.0     6   110 2.620
#> 2: Mazda RX4 Wag  21.0     6   110 2.875
#> 3:    Datsun 710  22.8     4    93 2.320
```

**Summarize every numeric column per group with `lapply(.SD, mean)`.** Without `.SDcols`, `.SD` contains every column except `cyl`.

```r title="Mean of all columns per group"
num_cols <- c("mpg", "hp", "wt", "qsec")
dt[, lapply(.SD, mean), by = cyl, .SDcols = num_cols]
#>      cyl       mpg        hp       wt     qsec
#>    <num>     <num>     <num>    <num>    <num>
#> 1:     6 19.742857 122.28571 3.117143 17.97714
#> 2:     4 26.663636  82.63636 2.285727 19.13727
#> 3:     8 15.100000 209.21429 3.999214 16.77214
```

**Pick the first or last row per group with `.SD[1L]` or `.SD[.N]`.** `.SD` is a data.table, so you can subscript it like any other table.

```r title="First and last row per group"
dt[, .SD[1L], by = cyl, .SDcols = c("model", "mpg", "hp")]
#>      cyl         model   mpg    hp
#>    <num>        <char> <num> <num>
#> 1:     6     Mazda RX4  21.0   110
#> 2:     4    Datsun 710  22.8    93
#> 3:     8 Hornet Sportabout 18.7   175
```

**Pick the row with the highest value per group using `.SD[which.max(...)]`.** This pattern returns whole rows, not just the maximum value.

```r title="Row with max mpg per group"
dt[, .SD[which.max(mpg)], by = cyl, .SDcols = c("model", "mpg", "hp")]
#>      cyl          model   mpg    hp
#>    <num>         <char> <num> <num>
#> 1:     6  Hornet 4 Drive  21.4   110
#> 2:     4    Toyota Corolla 33.9    65
#> 3:     8 Pontiac Firebird 19.2   175
```

[KEY INSIGHT]
**`.SD` turns "per group" into "per data frame".** Any function that already takes a data frame, like `head()`, `tail()`, `lm()`, or a custom function returning a data.table, slots straight in as `fn(.SD)` and runs once per group. The group key columns are stitched back on automatically.

**Update many columns in place with `:=` and `lapply(.SD, fn)`.** Wrap the target column names in parentheses on the left so data.table treats them as a vector of names.

```r title="Scale several columns in place"
cols <- c("mpg", "hp", "wt")
dt2 <- copy(dt)
dt2[, (cols) := lapply(.SD, scale), .SDcols = cols]
dt2[1:2, ..cols]
#>          mpg        hp         wt
#>        <num>     <num>      <num>
#> 1: 0.1508 -0.5350528 -0.6103996
#> 2: 0.1508 -0.5350528 -0.3497853
```

## .SD vs .SDcols vs explicit columns

**Pick `.SD` when the function applies uniformly to many columns.** Pick a named `j` when each output column needs its own expression.

| Pattern | Best when | Example |
|---|---|---|
| `lapply(.SD, fn)` with `.SDcols` | Same function on many columns | `dt[, lapply(.SD, mean), .SDcols = num_cols]` |
| Named `j` in `.()` | Different function per column | `dt[, .(m = mean(mpg), s = sd(hp)), by = cyl]` |
| `.SD[1L]` or `.SD[.N]` | Pick rows by position per group | `dt[, .SD[1L], by = cyl]` |
| `(cols) := lapply(.SD, fn)` | Update many columns in place | `dt[, (cols) := lapply(.SD, scale), .SDcols = cols]` |
| `lapply(.SD, fn, ...)` extra args | Pass arguments to `fn` per call | `dt[, lapply(.SD, mean, na.rm = TRUE), .SDcols = cols]` |

The decision rule is short. Reach for `.SD` whenever a column-loop would otherwise repeat the same expression with different column names.

## Common pitfalls

**Omitting `.SDcols` makes `.SD` include every non-grouping column.** `lapply(.SD, mean)` then warns or returns `NA` on character columns and dates. Pass `.SDcols` whenever the table has mixed types.

```r title="Mixed types break a naive lapply"
dt3 <- copy(dt)
suppressWarnings(dt3[, lapply(.SD, mean), by = cyl][1, 1:3])
#>      cyl model    mpg
#>    <num> <num>  <num>
#> 1:     6    NA 19.74286
```

[WARNING]
**`.SD` is read-only inside `j`.** Assigning to `.SD$col` does nothing useful; the change is discarded when `j` returns. To modify columns in place, use the bracketed `(cols) := lapply(.SD, fn)` form with `.SDcols`, which writes back through `:=`.

[TIP]
**Use `.SDcols = patterns("regex")` to select columns by name pattern.** This avoids hard-coding column lists when the table has many similarly named columns. `patterns("^q|^m")` matches every column whose name starts with `q` or `m`.

## Try it yourself

**Try it:** Using the `airquality` dataset as a data.table, compute the mean of `Ozone`, `Solar.R`, `Wind`, and `Temp` per `Month`, ignoring `NA`. Save the result to `ex_sd`.

```r title="Your turn: mean of four columns per Month"
# Try it: per-Month means of four columns
aq <- as.data.table(airquality)
target_cols <- c("Ozone", "Solar.R", "Wind", "Temp")
ex_sd <- # your code here

ex_sd
#> Expected: 5 rows with Month and four mean columns
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
aq <- as.data.table(airquality)
target_cols <- c("Ozone", "Solar.R", "Wind", "Temp")
ex_sd <- aq[, lapply(.SD, mean, na.rm = TRUE), by = Month, .SDcols = target_cols]
ex_sd
#>    Month    Ozone   Solar.R     Wind     Temp
#>    <int>    <num>     <num>    <num>    <num>
#> 1:     5 23.61538 181.2963 11.62258 65.54839
#> 2:     6 29.44444 190.1667 10.26667 79.10000
#> 3:     7 59.11538 216.4839  8.94194 83.90323
#> 4:     8 59.96154 171.8571  8.79355 83.96774
#> 5:     9 31.44828 167.4333 10.18000 76.90000
```

**Explanation:** Passing `na.rm = TRUE` as an extra argument to `lapply(.SD, mean, ...)` forwards it to every per-column call. `.SDcols` restricts `.SD` to the four numeric columns, so the result is one row per `Month` with four mean columns.

</details>

## Related data.table functions

**`.SD` is one part of the `DT[i, j, by]` toolkit.** Explore these next:

- `.SDcols`: the column filter that controls what `.SD` contains.
- `by` and `keyby`: the row-splitters that drive per-group `.SD` creation.
- `:=`: in-place update operator, often paired with `lapply(.SD, fn)`.
- `setDT()`: convert a data frame to a data.table without copying.
- `frollmean()`: rolling means that compose with `.SD` for window summaries.

See the official [data.table .SD vignette](https://rdatatable.gitlab.io/data.table/articles/datatable-sd-usage.html) for the canonical reference.

## FAQ

**What does .SD stand for in data.table?**

`.SD` stands for Subset of Data. Inside `j`, it is a data.table containing the rows of the current group and all columns except the ones in `by`, unless restricted by `.SDcols`. The name reflects what it holds: whichever slice the current `j` call is working on. data.table builds a fresh `.SD` for every group and discards it once `j` returns.

**When should I use .SD instead of a named j expression?**

Use `.SD` when the same operation applies to many columns and would otherwise be repeated with different column names. `lapply(.SD, mean)` replaces a list of named means. Use a named `j` wrapped in `.()` when each output column needs a different expression, like `mean(x)` for one column and `sd(y)` for another. The two patterns coexist freely in the same query.

**What is the difference between .SD and .SDcols?**

`.SD` is the data; `.SDcols` is the filter that picks which columns end up in `.SD`. Without `.SDcols`, `.SD` contains every non-grouping column. With `.SDcols = c("mpg", "hp")`, `.SD` is restricted to those two columns. `.SDcols` accepts character vectors, indices, `patterns()` regex, and function predicates like `is.numeric`.

**Can I modify columns through .SD?**

No, not directly. `.SD` is read-only inside `j`, so `.SD$col <- value` is discarded when `j` returns. To update many columns in place, use `dt[, (cols) := lapply(.SD, fn), .SDcols = cols]`. The `(cols)` form on the left tells data.table to write back through `:=`, and `.SDcols` ensures `lapply` walks only the target columns.

**Why does lapply(.SD, mean) return NA on character columns?**

Because `.SD` contains every non-grouping column by default, including character and date columns where `mean()` is undefined. Pass `.SDcols` with only the numeric columns, or use `.SDcols = is.numeric` to let data.table pick numeric columns automatically. The same applies to other column-summary functions like `sum()` and `sd()`.
