---
title: "data.table keyby in R: Group, Sort, and Key the Result"
slug: datatable-keyby-in-R
description: "data.table keyby in R groups rows like by, then sorts and keys the result. See keyby vs by, multi-column grouping, performance gains, and common pitfalls."
keywords: "data.table keyby, keyby data.table, data.table keyby vs by, data.table group by sorted, R keyby example, data.table keyby argument, keyby R"
mathjax: false
webr: true
date: "2026-05-22"
post_type: PSEO
category_id: function-deep
subcategory_id: datatable-functions
fr_parent: data-table-vs-dplyr.html
auto_link_terms: "data.table keyby|keyby keyword|keyby argument|keyby()|keyby vs by"
auto_link_case_sensitive: true
target_keyword: "data.table keyby"
sibling_block_enabled: true
difficulty: Beginner
---

# data.table keyby in R: Group, Sort, and Key the Result

<p class="lead">The <code>keyby</code> keyword in <code>data.table</code> groups rows for aggregation inside <code>DT[i, j, keyby]</code>, then sorts the output and sets a key on the grouping columns so downstream joins and subsets run with binary search.</p>

[QUICK ANSWER]
dt[, .N, keyby = cyl]                       # count per group, sorted by cyl
dt[, mean(mpg), keyby = cyl]                # one summary per group
dt[, .(avg = mean(mpg)), keyby = cyl]       # name the output column
dt[, mean(mpg), keyby = .(cyl, gear)]       # group on two columns
dt[, mean(mpg), keyby = "cyl"]              # column as character
dt[mpg > 18, .N, keyby = cyl]               # filter then group
dt[, lapply(.SD, mean), keyby = cyl]        # summarize every column

[DECISION TREE: Is keyby the right tool?]
- aggregate and sort the result: dt[, mean(x), keyby = grp]
- aggregate without sorting: dt[, mean(x), by = grp]
- sort an existing data.table: setorder(dt, col)
- set a key without aggregating: setkey(dt, col)
- count rows per group: dt[, .N, keyby = grp]
- pick first row per group: dt[, .SD[1], keyby = grp]
- summarize many columns at once: dt[, lapply(.SD, mean), keyby = grp]

## What keyby does in one sentence

**`keyby` is `by` with two extra side effects on the result.** You pass one or more grouping columns; data.table splits the table, runs the `j` expression per group, and stacks the rows into a new table whose grouping columns are sorted ascending. It also calls `setkey()` on that result, so subsequent lookups can use binary search.

The function name reads as a verb phrase: "key by these columns". Read the call site the same way and the behavior follows: group, sort, key.

## Syntax

**`keyby` is the third argument in `DT[i, j, keyby]`.** It accepts the same forms as `by`, plus the result inherits a key:

```r title="data.table keyby call shape"
DT[i, j, keyby]                # i = filter, j = expression, keyby = group + sort + key
DT[i, j, keyby = .(c1, c2)]    # multiple columns
```

The accepted forms are:

- `keyby = col`: one unquoted column name.
- `keyby = .(col1, col2)`: several unquoted column names.
- `keyby = "col"` or `keyby = c("col1", "col2")`: column names as character.
- `keyby = expression`: any expression that returns a vector or list of vectors with one entry per grouped row.

The output is always a new data.table with one row per group, sorted by the grouping columns, with `key(result)` set to those columns.

## Examples by use case

**Build a data.table once and reuse it across examples.** Every block below shares the same `dt` object created from `mtcars`.

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

**Count rows per group.** The classic group-and-count idiom returns one row per unique cylinder count, sorted ascending:

```r title="Count rows per cylinder group"
dt[, .N, keyby = cyl]
#>      cyl     N
#>    <num> <int>
#> 1:     4    11
#> 2:     6     7
#> 3:     8    14
key(dt[, .N, keyby = cyl])
#> [1] "cyl"
```

`.N` is the row count for each group, and `key()` confirms the result is keyed on `cyl`.

**Summarize one column per group.** Wrap the aggregation in `.()` to name the output column:

```r title="Mean mpg by cylinder, named output"
dt[, .(avg_mpg = mean(mpg), n = .N), keyby = cyl]
#>      cyl avg_mpg     n
#>    <num>   <num> <int>
#> 1:     4   26.66    11
#> 2:     6   19.74     7
#> 3:     8   15.10    14
```

The result has three columns (`cyl`, `avg_mpg`, `n`) and is keyed on `cyl`, so `result[J(4)]` would return the 4-cylinder row instantly.

**Group on multiple columns.** Pass a list with `.()`:

```r title="Mean mpg by cylinder and gear"
dt[, .(avg_mpg = mean(mpg)), keyby = .(cyl, gear)]
#>      cyl  gear avg_mpg
#>    <num> <num>   <num>
#> 1:     4     3   21.50
#> 2:     4     4   26.93
#> 3:     4     5   28.20
#> 4:     6     3   19.75
#> 5:     6     4   19.75
#> 6:     6     5   19.70
#> 7:     8     3   15.05
#> 8:     8     5   15.40
```

Rows are sorted first by `cyl`, then by `gear` within each `cyl`. Both columns become the compound key.

**Filter then group.** Anything in `i` runs before grouping, so you can restrict the rows being aggregated:

```r title="Mean mpg by cylinder for fuel-efficient cars only"
dt[mpg > 18, .(avg_mpg = mean(mpg), n = .N), keyby = cyl]
#>      cyl avg_mpg     n
#>    <num>   <num> <int>
#> 1:     4   26.66    11
#> 2:     6   20.50     5
```

Filter, group, sort, key, in a single expression.

[KEY INSIGHT]
**`keyby` is one keystroke past `by`, but it changes the result's shape.** The summary table becomes a sorted, keyed lookup, which is exactly what you want when the aggregation feeds the next join, plot, or report.

## keyby vs by

**The two arguments compute identical aggregates; they differ only in what they leave behind.** `by` preserves the order in which groups first appear in the source; `keyby` sorts groups ascending and attaches a key.

```r title="Side by side: by vs keyby on the same query"
dt[, .(n = .N), by = cyl]      # appearance order from source
#>      cyl     n
#>    <num> <int>
#> 1:     6     7
#> 2:     4    11
#> 3:     8    14

dt[, .(n = .N), keyby = cyl]   # sorted ascending
#>      cyl     n
#>    <num> <int>
#> 1:     4    11
#> 2:     6     7
#> 3:     8    14
```

Use `by` when you need to preserve a meaningful row order from the source (for instance time-of-arrival). Use `keyby` when the output will be joined, indexed, or printed in a table that benefits from sorted groups.

The full contrast in one table:

| Behavior | `by` | `keyby` |
|---|---|---|
| Group rows for `j` | yes | yes |
| Output row order | first-seen in source | ascending by group columns |
| Sets key on result | no | yes (binary search enabled) |
| Modifies source data.table | no | no |
| Typical use case | preserve source order | feed joins, lookups, reports |

## Why a keyed result is faster

**Binary search on a keyed data.table runs in O(log n), not O(n).** After `keyby`, the result is set up for instant lookups using the `J()` helper:

```r title="Lookup a single group from a keyed result"
summary_dt <- dt[, .(avg_mpg = mean(mpg)), keyby = cyl]
summary_dt[J(6)]
#>      cyl avg_mpg
#>    <num>   <num>
#> 1:     6   19.74
```

`J(6)` is shorthand for a one-row data.table that becomes the join target. Because `summary_dt` is keyed, data.table jumps straight to the matching row.

[TIP]
**Reach for `keyby` whenever the aggregation feeds another join or filter.** A keyed summary makes the next call cheaper without an extra `setkey()` line.

## Common pitfalls

**NA groups appear first, not last.** data.table's key ordering places NA values before all other values. If you forget that, an NA row at the top of your summary can look like a bug:

```r title="NA groups land at the top of a keyed result"
dt2 <- copy(dt)
dt2[1:3, cyl := NA]
dt2[, .N, keyby = cyl]
#>      cyl     N
#>    <num> <int>
#> 1:    NA     3
#> 2:     4    11
#> 3:     6     5
#> 4:     8    13
```

[WARNING]
**`keyby` keys the RESULT, not the source.** The original `dt` is untouched. If you want the source itself sorted and keyed, use `setkey(dt, cyl)` or `setorder(dt, cyl)` instead. Confusing the two is the most common keyby mistake.

**Quoted column names need character form.** Inside `keyby`, you can pass names unquoted (`keyby = cyl`) or as character (`keyby = "cyl"`), but not as a symbol stored in a variable unless you wrap with `get()` or use `..varname`. Mixing the two breaks at runtime.

**Expression grouping creates an unnamed key column.** `dt[, .N, keyby = mpg > 20]` returns a column literally named `mpg > 20`. Name it explicitly with `keyby = .(high_mpg = mpg > 20)` if you plan to reference it later.

## Try it yourself

**Try it:** Group `mtcars` by `gear` and compute mean `hp` per group, sorted by gear. Save the result to `ex_hp_by_gear` and confirm it has a key on `gear`.

```r title="Your turn: keyby gear, summarize hp"
# Try it: keyby gear and average hp
ex_hp_by_gear <- # your code here

ex_hp_by_gear
key(ex_hp_by_gear)
#> Expected: 3 rows, key = "gear"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_hp_by_gear <- dt[, .(avg_hp = mean(hp)), keyby = gear]
ex_hp_by_gear
#>     gear avg_hp
#>    <num>  <num>
#> 1:     3 176.13
#> 2:     4   89.50
#> 3:     5 195.60
key(ex_hp_by_gear)
#> [1] "gear"
```

**Explanation:** `keyby = gear` groups by gear, sorts the three groups ascending, and sets `gear` as the key on the returned data.table. `mean(hp)` runs once per group.

</details>

## Related data.table functions

**Pair `keyby` with these neighbors to shape and query grouped output:**

- `by`: aggregate without sorting or keying the result.
- `setkey()`: key an existing data.table in place, without aggregating.
- `setorder()`: sort an existing data.table in place by any columns.
- `.SD` and `.SDcols`: apply `j` expressions to many columns at once inside grouped queries.
- `frollmean()`: rolling means that often follow a `keyby` step.

For a side-by-side syntax tour against the tidyverse, see the [data.table vs dplyr](data-table-vs-dplyr.html) hub.

## FAQ

**What is the difference between by and keyby in data.table?**

Both arguments group rows for the `j` expression, and both return one summary row per group. `by` keeps the order in which groups first appear in the source table. `keyby` sorts the result ascending by the grouping columns and calls `setkey()` on the result so future joins and lookups can use binary search. The aggregation itself is identical; only the post-processing differs.

**Does keyby modify the original data.table?**

No. `keyby` keys the returned summary, not the source. Your original `dt` retains whatever key it had (or none) before the call. To key the source itself, use `setkey(dt, col)`. To sort the source rows without changing key state, use `setorder(dt, col)`.

**Can I keyby on more than one column?**

Yes. Pass the columns inside `.()`, for example `keyby = .(cyl, gear)`. The result is sorted first by the leftmost column, then by the next, and so on. The compound key matches the column order, so `key(result)` returns `c("cyl", "gear")`.

**Why does my keyby result have NA at the top?**

data.table's key ordering places NA values before all other values. After `keyby`, any group whose grouping column is NA appears in the first row of the result. This is consistent with how `setkey()` treats missing values across the package.

**Is keyby slower than by because of the sort step?**

For a single aggregation, the sort and key cost is negligible compared with the group-by work itself. When the result feeds another join or repeated subset, `keyby` is faster overall because the downstream binary-search lookups avoid an extra `setkey()` pass.

For the canonical reference, see the [data.table FAQ on grouping](https://cran.r-project.org/web/packages/data.table/vignettes/datatable-faq.html).
