---
title: "data.table Grouping in R: by, keyby, and .SD Patterns"
slug: datatable-grouping-in-R
description: "Grouping in data.table runs j once per group inside DT[i, j, by]. Compare by, keyby, .SD, multi-column grouping, performance tips, and common pitfalls in R."
keywords: "data.table grouping, data.table group by, R data.table aggregate, data.table by vs keyby, grouping in data.table, R group by data.table, data.table aggregate by group"
mathjax: false
webr: true
date: "2026-05-22"
post_type: PSEO
category_id: function-deep
subcategory_id: datatable-functions
fr_parent: data-table-vs-dplyr.html
auto_link_terms: "data.table grouping|grouping in data.table|data.table group by|data.table aggregate|R group by data.table"
auto_link_case_sensitive: true
target_keyword: "data.table grouping"
sibling_block_enabled: true
difficulty: Beginner
---

# data.table Grouping in R: by, keyby, and .SD Patterns

<p class="lead">data.table grouping splits a table by one or more columns and evaluates the <code>j</code> expression once per group inside the <code>DT[i, j, by]</code> syntax, returning one result row per unique group.</p>

[QUICK ANSWER]
dt[, .N, by = cyl]                          # count rows per group
dt[, mean(mpg), by = cyl]                   # one summary per group
dt[, .(avg = mean(mpg)), by = .(cyl, gear)] # group on two columns
dt[, mean(mpg), keyby = cyl]                # group AND sort the result
dt[, lapply(.SD, mean), by = cyl]           # summarize every column
dt[cyl == 4, mean(mpg), by = gear]          # filter first, then group
dt[, .SD[1], by = cyl]                      # first row per group

[DECISION TREE: Which grouping form should I use?]
- one-off summary, order does not matter: dt[, mean(x), by = grp]
- result will be joined or queried again: dt[, mean(x), keyby = grp]
- already keyed and reused often: setkey(dt, grp); dt[, mean(x), by = grp]
- summarize many columns: dt[, lapply(.SD, mean), by = grp, .SDcols = cols]
- pick one row per group: dt[, .SD[1], by = grp]
- ad-hoc bins without a new column: dt[, .N, by = .(big = x > 10)]
- rolling window inside groups: dt[, frollmean(x, 3), by = grp]

## What grouping means in data.table

**Grouping is the third argument of `DT[i, j, by]`.** You pass one or more columns (or an expression) to `by` or `keyby`, and data.table splits the table into one chunk per unique value of those columns. The `j` expression then runs separately on each chunk, and the results are stacked into a new table with the grouping columns on the left.

Because grouping lives inside the bracket, filtering and grouping happen in a single call. The split runs on the rows that survive `i`, not the whole table. This makes a grouped aggregate one expression rather than a chain of filters, group operations, and joins.

## The grouping toolkit: by, keyby, and .SD

**Three pieces cover almost every grouping problem in data.table.** `by` and `keyby` choose how rows are split; `.SD` and `.SDcols` choose which columns each per-group expression sees.

```r title="The grouping query signature"
DT[i, j, by]                            # filter, expression, group
DT[i, j, keyby = ...]                   # group AND sort/key the result
DT[i, j, by, .SDcols = c("a", "b")]     # restrict .SD to a subset
```

The pieces compose like this:

- `by = col` or `by = .(col1, col2)` splits the table and returns groups in first-appearance order.
- `keyby = ...` is the same split but sorts the result ascending and stores the grouping columns as the new key.
- `.SD` is the per-group "Subset of Data": every column except those used in `by` (or only those in `.SDcols` if you set it).
- Expressions like `by = .(big = mpg > 25)` create bins on the fly without adding a column.

[KEY INSIGHT]
**The whole grouping pattern fits in one mental model: split with `by`, summarize with `j`, optionally restrict columns with `.SDcols`.** Once you internalize that `j` is just "the recipe data.table runs per group," every grouping problem reduces to writing the right recipe.

## Examples by use case

**Build one data.table and reuse it across every example.** All blocks share the same `dt` object created from `mtcars`.

```r title="Create a data.table from mtcars"
library(data.table)

dt <- as.data.table(mtcars, keep.rownames = "model")
dt[1:3, .(model, mpg, cyl, gear)]
#>            model   mpg   cyl  gear
#>           <char> <num> <num> <num>
#> 1:     Mazda RX4  21.0     6     4
#> 2: Mazda RX4 Wag  21.0     6     4
#> 3:    Datsun 710  22.8     4     4
```

**Count rows in each group with `.N`.** `.N` is a special symbol that always equals the row count of the current group.

```r title="Count rows per group"
dt[, .N, by = cyl]
#>      cyl     N
#>    <num> <int>
#> 1:     6     7
#> 2:     4    11
#> 3:     8    14
```

**Return one named summary per group.** Wrapping `j` in `.()` gives the output column a real name instead of the default `V1`.

```r title="Mean mpg per cyl"
dt[, .(avg_mpg = mean(mpg)), by = cyl]
#>      cyl  avg_mpg
#>    <num>    <num>
#> 1:     6 19.74286
#> 2:     4 26.66364
#> 3:     8 15.10000
```

**Group on multiple columns by passing `.()` to `by`.** The order of columns in `.()` matches the column order in the output.

```r title="Group by cyl and gear"
dt[, .(avg_mpg = mean(mpg), n = .N), by = .(cyl, gear)]
#>      cyl  gear  avg_mpg     n
#>    <num> <num>    <num> <int>
#> 1:     6     4 19.75000     4
#> 2:     4     4 26.92500     8
#> 3:     6     3 19.75000     2
#> 4:     8     3 15.05000    12
#> 5:     4     3 21.50000     1
#> 6:     4     5 28.20000     2
#> 7:     8     5 15.40000     2
#> 8:     6     5 19.70000     1
```

**Summarize many columns at once with `.SD` and `lapply`.** Pair it with `.SDcols` to keep the summary clean and avoid warnings on character or non-numeric columns.

```r title="Apply mean to several columns per group"
num_cols <- c("mpg", "hp", "wt")
dt[, lapply(.SD, mean), by = cyl, .SDcols = num_cols]
#>      cyl       mpg        hp       wt
#>    <num>     <num>     <num>    <num>
#> 1:     6 19.742857 122.28571 3.117143
#> 2:     4 26.663636  82.63636 2.285727
#> 3:     8 15.100000 209.21429 3.999214
```

**Pick the first row of each group with `.SD[1]`.** This is the data.table idiom for "the top row per category," and it works because `.SD` is itself a data.table you can subset.

```r title="First row per group"
dt[order(-mpg), .SD[1, .(model, mpg)], by = cyl]
#>      cyl            model   mpg
#>    <num>           <char> <num>
#> 1:     4   Toyota Corolla  33.9
#> 2:     6   Hornet 4 Drive  21.4
#> 3:     8 Pontiac Firebird  19.2
```

**Filter rows in `i`, then group what survives.** The grouping operates on the rows passed by `i`, so you do not need a separate filter pipe.

```r title="Filter first, then group"
dt[mpg > 18, .(avg_hp = mean(hp), n = .N), by = cyl]
#>      cyl    avg_hp     n
#>    <num>     <num> <int>
#> 1:     6 122.16667     6
#> 2:     4  82.63636    11
#> 3:     8 175.00000     1
```

## Choosing by, keyby, or a pre-keyed table

**The choice is a trade-off between three things: output sort, input sort, and reuse.** Plain `by` is the default for one-off summaries. `keyby` sorts and keys the result, which makes the output cheaper to query. Calling `setkey()` on the input ahead of time pays for itself when you group the same table many times.

| Form | Sorts output? | Keys output? | Pre-sorts input? | Best when |
|---|---|---|---|---|
| `by = cyl` | No | No | No | One-off summary; result is printed or written and discarded |
| `keyby = cyl` | Yes (ascending) | Yes | No | The grouped result will be subset, joined, or queried again |
| `setkey(dt, cyl); dt[, j, by = cyl]` | No | No | Yes | You will group the same table many times in the session |
| `by = .(big = mpg > 25)` | No | No | No | Ad-hoc bins without a new column on disk |

A simple rule: reach for `keyby` whenever the grouped table becomes input to something else, and reach for `setkey()` once, ahead of time, whenever the same source table will be grouped repeatedly. Use plain `by` for everything else.

[TIP]
**Name your grouping expressions with `by = .(name = expr)`.** Without a name, data.table calls the bin column `V1`, which is hard to read in downstream code. Naming inside `by` works the same way as naming inside `j`: `by = .(big_engine = cyl > 6)` produces a column called `big_engine`.

## Common pitfalls

**Forgetting `.()` around two columns silently groups by only the first one.** Writing `by = cyl, gear` parses `gear` as a separate bracket argument in some calls and is a parse error in others. Always wrap multi-column groupings in `.()` or pass a character vector.

```r title="Right vs wrong multi-column by"
nrow(dt[, .N, by = .(cyl, gear)])
#> [1] 8
nrow(dt[, .N, by = c("cyl", "gear")])
#> [1] 8
```

[WARNING]
**`by` keeps each group in the order it appears, but does not sort across groups.** Operations like `head()`, `cummax()`, and `shift()` depend on row order, so a `j` that uses them needs either `keyby` (sort across groups) or a prior `setorder()` (sort the whole table). Without this, the same query can return different numbers on differently ordered inputs.

**`.SD` includes every non-`by` column by default, including non-numeric ones.** A call like `dt[, lapply(.SD, mean), by = cyl]` will warn or return `NA` for character columns. Always pair `lapply(.SD, ...)` with an explicit `.SDcols` vector to avoid surprises.

[NOTE]
**Coming from dplyr?** The equivalent of `dt[, .(avg = mean(x)), by = grp]` is `df |> group_by(grp) |> summarise(avg = mean(x))`. dplyr's `.by =` inline argument now mirrors data.table's per-call grouping, but the bracket form stays significantly faster on tables above a few million rows.

## Try it yourself

**Try it:** Group `airquality` by `Month` and compute both the mean `Ozone` (ignoring `NA`) and the row count per month. Sort the output so months come back in calendar order. Save the result to `ex_grouped`.

```r title="Your turn: group airquality by Month"
# Try it: mean Ozone and row count per Month, sorted
ex_grouped <- as.data.table(airquality)
# your code here

ex_grouped
#> Expected: 5 rows, sorted by Month, with avg_ozone and n
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_grouped <- as.data.table(airquality)
ex_grouped <- ex_grouped[, .(avg_ozone = mean(Ozone, na.rm = TRUE), n = .N), keyby = Month]
ex_grouped
#>    Month avg_ozone     n
#>    <int>     <num> <int>
#> 1:     5  23.61538    31
#> 2:     6  29.44444    30
#> 3:     7  59.11538    31
#> 4:     8  59.96154    31
#> 5:     9  31.44828    30
```

**Explanation:** Using `keyby = Month` sorts the result by month and stores the key, so later subsets like `ex_grouped["7"]` use binary search. `na.rm = TRUE` keeps the months that have missing Ozone readings from collapsing to `NA`.

</details>

## Related data.table functions

**Grouping composes with the rest of the data.table toolkit.** Explore these next:

- `by`: the grouping argument; deep dive on every variant and edge case.
- `keyby`: identical to `by` but sorts and keys the result.
- `.SD`: the per-group subset of data visible inside `j`.
- `setkey()`: pre-sort and key the input table for repeated grouping.
- `frollmean()`: rolling window aggregates that compose with grouping.
- `dcast()`: pivot a long grouped result into wide form.

See the official [data.table grouping vignette](https://rdatatable.gitlab.io/data.table/articles/datatable-keys-fast-subset.html) for the canonical reference on `DT[i, j, by]` and key-based subsetting.

## FAQ

**How do I group by a column in data.table?**

Pass the column name to `by` inside the bracket: `dt[, mean(x), by = grp]`. data.table splits the table into one chunk per unique value of `grp`, runs `mean(x)` on each chunk, and stacks the results into a new table with `grp` on the left. The grouping column is always added to the output automatically, so you do not need to repeat it inside `j`.

**What is the difference between by and keyby in data.table?**

Both group the table the same way; the difference is the result. Plain `by` returns groups in the order they first appear in the input, which is the fastest path. `keyby` sorts the result ascending by the grouping columns and stores those columns as the table's key, so later subsets and joins on the result use binary search. Use `keyby` whenever the grouped output becomes input to something else.

**How do I group by multiple columns in data.table?**

Wrap the columns in `.()`, for example `dt[, .N, by = .(cyl, gear)]`. You can also pass them as a character vector, `dt[, .N, by = c("cyl", "gear")]`, which is handy when the names live in a variable. Both forms return one row per unique combination, with the grouping columns added to the result in the order you listed them.

**How do I aggregate every column by group in data.table?**

Use `lapply(.SD, fun)` inside `j`. The pattern `dt[, lapply(.SD, mean), by = grp, .SDcols = num_cols]` applies `mean()` to every column listed in `.SDcols`, returning one summary row per group. Always set `.SDcols` explicitly; otherwise `.SD` includes character columns and the summary warns or returns `NA` for them.

**Is data.table grouping faster than dplyr group_by?**

Usually yes, especially on tables above a few million rows. data.table groups by reference and avoids the intermediate copies that `group_by()` plus `summarise()` create. The gap narrows on small tables and on simple summaries, where both libraries finish in milliseconds. For repeated grouping on the same table, calling `setkey()` once turns later groupings into near-instant binary-search lookups.
