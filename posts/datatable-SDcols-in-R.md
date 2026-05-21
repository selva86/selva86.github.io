---
title: "data.table .SDcols in R: Apply Functions to Many Columns"
slug: datatable-SDcols-in-R
description: "data.table .SDcols picks which columns .SD exposes inside j. Select by name, index, regex, range, or type predicate to apply lapply across many columns."
keywords: "data.table .SDcols, .SDcols data.table, R .SDcols, data.table apply to multiple columns, .SDcols examples, SDcols by group, data.table column subset"
mathjax: false
webr: true
date: "2026-05-22"
post_type: PSEO
category_id: function-deep
subcategory_id: datatable-functions
fr_parent: data-table-vs-dplyr.html
auto_link_terms: ".SDcols|data.table .SDcols|.SDcols argument|SDcols|.SDcols selector"
auto_link_case_sensitive: true
target_keyword: "data.table .SDcols"
sibling_block_enabled: true
difficulty: Beginner
---

# data.table .SDcols in R: Apply Functions to Many Columns

<p class="lead">The <code>.SDcols</code> argument in <code>data.table</code> picks which columns <code>.SD</code> exposes inside <code>j</code>, so one <code>lapply</code> call can summarize or rewrite many columns selected by name, index, regex, or a type predicate like <code>is.numeric</code>.</p>

[QUICK ANSWER]
dt[, lapply(.SD, mean), .SDcols = c("mpg","hp")]              # by name
dt[, lapply(.SD, mean), .SDcols = is.numeric]                 # by type predicate
dt[, lapply(.SD, mean), .SDcols = patterns("^d")]             # by regex
dt[, lapply(.SD, mean), .SDcols = !c("vs","am")]              # by exclusion
dt[, lapply(.SD, mean), .SDcols = mpg:hp]                     # by range
dt[, lapply(.SD, mean), by = cyl, .SDcols = c("mpg","hp")]    # combined with by
dt[, (cols) := lapply(.SD, round, 1), .SDcols = cols]         # update in place

[DECISION TREE: Is .SDcols the right tool?]
- apply one function to many chosen columns: lapply(.SD, fn), .SDcols = cols
- apply to ALL non-by columns: omit .SDcols; .SD already defaults to all of them
- summarize one column only: dt[, mean(x), by = grp]
- pick columns by name without j: dt[, ..cols] or dt[, .SD, .SDcols = cols]
- update many columns in place: dt[, (cols) := lapply(.SD, fn), .SDcols = cols]
- aggregate many columns with different functions: dt[, .(m = mean(x), s = sd(y))]
- select rows of .SD per group: dt[, .SD[1L], by = grp]

## What .SDcols does in one sentence

**`.SDcols` is the column filter for `.SD`.** Inside `DT[i, j, by, .SDcols = ...]`, the argument tells data.table which columns to include in the `Subset of Data` that `j` works on. Without `.SDcols`, `.SD` contains every column except those named in `by`.

The filter accepts many input shapes: a character vector, an integer index, a column range, a regex via `patterns()`, or even a function like `is.numeric`. That flexibility is what makes `.SDcols` the standard idiom for applying one operation across many related columns.

## Syntax

**`.SDcols` only has meaning inside the `DT[i, j, by]` bracket call.** It pairs with `.SD` and never appears on its own.

```r title="Bracket call shape"
DT[i, j, by, .SDcols = <selector>]
```

`.SDcols` accepts any of these selectors:

| Selector form | Example | When to use |
|---|---|---|
| Character vector | `c("mpg", "hp")` | Explicit list of columns |
| Integer index | `2:4` or `-1` | Position-based, drop one column |
| Column range | `mpg:hp` | Contiguous block by name |
| Logical negation | `!c("vs", "am")` | Drop a few, keep the rest |
| Regex helper | `patterns("^d")` | Match a prefix or suffix |
| Predicate function | `is.numeric` | Type-based selection |

The selected columns become available as `.SD` inside `j`. The columns named in `by` are excluded automatically and do not need to be removed by hand.

[NOTE]
**`.SDcols` is the argument, not a function.** It does not take parentheses on its own. Write `.SDcols = is.numeric`, not `.SDcols(is.numeric)`. The latter is a syntax error.

## Examples by use case

**Each selector form below solves a different column-picking problem.** Load `data.table` and convert `mtcars` to a data.table once; the examples reuse `DT` through the section.

```r title="Set up data.table from mtcars"
library(data.table)
DT <- as.data.table(mtcars, keep.rownames = "car")
head(DT, 3)
#>                  car  mpg cyl disp  hp drat    wt  qsec vs am gear carb
#> 1:         Mazda RX4 21.0   6  160 110 3.90 2.620 16.46  0  1    4    4
#> 2:     Mazda RX4 Wag 21.0   6  160 110 3.875 17.02  0  1    4    4
#> 3:        Datsun 710 22.8   4  108  93 3.85 2.320 18.61  1  1    4    1
```

**Select columns by name.** Pass a character vector of column names; the result has one row per group when combined with `by`, or one row total when `by` is omitted.

```r title="Mean of mpg and hp by cylinder"
DT[, lapply(.SD, mean), by = cyl, .SDcols = c("mpg", "hp")]
#>    cyl      mpg        hp
#> 1:   6 19.74286 122.28571
#> 2:   4 26.66364  82.63636
#> 3:   8 15.10000 209.21429
```

**Select columns by regex.** The `patterns()` helper accepts one or more regex strings and returns the matching column names. Useful when columns share a prefix or suffix.

```r title="Columns starting with the letter d"
DT[, lapply(.SD, mean), .SDcols = patterns("^d")]
#>        disp     drat
#> 1: 230.7219 3.596563
```

**Select columns by type.** Pass a predicate function like `is.numeric`; data.table evaluates it on each column and keeps the ones returning `TRUE`. This is the cleanest way to aggregate every numeric column without hard-coding names.

```r title="Mean of every numeric column per cyl"
DT[, lapply(.SD, mean), by = cyl, .SDcols = is.numeric]
#>    cyl      mpg     disp        hp     drat       wt     qsec        vs   ...
#> 1:   6 19.74286 183.3143 122.28571 3.585714 3.117143 17.97714 0.5714286   ...
#> 2:   4 26.66364 105.1364  82.63636 4.070909 2.285727 19.13727 0.9090909   ...
#> 3:   8 15.10000 353.1000 209.21429 3.229286 3.999214 16.77214 0.0000000   ...
```

**Update many columns in place.** Combine `.SDcols` with `:=` to overwrite the chosen columns; this avoids copying the whole table.

```r title="Round selected columns in place"
cols <- c("mpg", "wt", "qsec")
DT[, (cols) := lapply(.SD, round, 1), .SDcols = cols]
head(DT[, ..cols], 3)
#>     mpg  wt qsec
#> 1: 21.0 2.6 16.5
#> 2: 21.0 2.9 17.0
#> 3: 22.8 2.3 18.6
```

[TIP]
**Wrap target column names in parentheses when assigning in place.** `dt[, (cols) := ...]` updates the columns named in `cols`; without the parens, data.table creates one literal column called `cols`. The parentheses force evaluation of the variable.

[KEY INSIGHT]
**`.SDcols` decouples column selection from the operation.** The same `lapply(.SD, fn)` pattern handles three of name lists, regex matches, and type predicates without rewriting `j`. Treat `.SDcols` as the where and `j` as the what.

## Common pitfalls

**Forgetting that `by` columns are excluded.** If `cyl` appears in `by`, it will not be in `.SD` even when `.SDcols = is.numeric` would otherwise match it. Add it back explicitly in `j` if you need it in the output.

**Confusing `.SDcols = cols` with `.SDcols = "cols"`.** The first uses the variable's value (a vector of names). The second selects the literal column called `cols`, which probably does not exist. Always use the bare variable.

**Using a non-vectorized function inside `lapply(.SD, fn)`.** `.SD` is a list of columns, so `fn` must accept one column at a time. `lapply(.SD, sum)` works; `lapply(.SD, function(x) x + .SD$other)` does not, because each call sees only one column. Reach for `mapply` or write an explicit loop when columns interact.

[WARNING]
**`patterns()` only works inside `melt`, `dcast`, and `.SDcols`.** Calling `patterns("^d")` at the top level throws an error. It is a data.table helper recognized only by these contexts.

## Try it yourself

**Try it:** Use `iris` to compute the mean of every column whose name ends in `Length`, grouped by `Species`. Save the result to `ex_means`.

```r title="Your turn: mean lengths by species"
ex_means <- # your code here

ex_means
#> Expected: one row per species, columns Sepal.Length and Petal.Length
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_means <- as.data.table(iris)[
  , lapply(.SD, mean), by = Species, .SDcols = patterns("Length$")
]
ex_means
#>       Species Sepal.Length Petal.Length
#> 1:     setosa        5.006        1.462
#> 2: versicolor        5.936        4.260
#> 3:  virginica        6.588        5.552
```

**Explanation:** `patterns("Length$")` matches column names ending in `Length`, so `.SD` exposes only `Sepal.Length` and `Petal.Length`. `lapply(.SD, mean)` then runs once per group.

</details>

## Related data.table keywords

- `.SD`: the Subset of Data itself. `.SDcols` decides which columns are in it.
- `.N`: the row count of the current group. Pairs well with `.SD` for picking the last row.
- `by`: the grouping keys. Columns named here are excluded from `.SD`.
- `:=`: in-place assignment. Combine with `.SDcols` to update many columns at once.
- `patterns()`: regex selector that data.table recognizes inside `.SDcols`, `melt`, and `dcast`.

## FAQ

**What is the difference between .SD and .SDcols in data.table?**

`.SD` is the data, `.SDcols` is the filter. `.SD` evaluates inside `j` to a data.table holding the current group's rows. `.SDcols` is the argument that tells data.table which columns to put into `.SD` before `j` runs. You almost always use them together: `.SDcols` shapes `.SD`, and `j` operates on `.SD`.

**Can I use .SDcols without lapply?**

Yes. `.SDcols` works with any `j` expression that references `.SD`. Common shapes include `DT[, .SD, .SDcols = cols]` for selecting columns, `DT[, head(.SD, 2), .SDcols = cols]` for the first two rows of a subset, and `DT[, .SD[1L], by = grp, .SDcols = cols]` for the first row per group. `lapply` is the most common partner but not the only one.

**How do I pick columns by type with .SDcols?**

Pass a predicate function. `.SDcols = is.numeric` keeps numeric columns; `.SDcols = is.character` keeps character columns. data.table calls the function on each candidate column and keeps the ones returning `TRUE`. The function must return a single logical value per column.

**Does .SDcols accept negative selection?**

Yes. Two shapes work: `.SDcols = !c("vs", "am")` (logical negation of a name vector) and `.SDcols = -c(8, 9)` (negative integer index). Both drop the listed columns and keep the rest. The first is safer because it survives column reordering.

**What does .SDcols stand for?**

The `SD` portion refers to the Subset of Data symbol `.SD`, and `cols` is short for columns. So `.SDcols` reads as "the columns that go into Subset of Data". The leading dot follows the data.table convention for special symbols that only exist inside the bracket call.
