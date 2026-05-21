---
title: "data.table .N in R: Count Rows by Group, Fast"
slug: datatable-N-keyword-in-R
description: "The data.table .N symbol holds the row count of the current group in R. Use dt[, .N, by=...] for grouped counts, last row picks, and group-size filters."
keywords: "data.table .N, .N data.table, .N keyword R, data.table count rows, dt .N by group, R data.table N, data.table grouped count"
mathjax: false
webr: true
date: "2026-05-22"
post_type: PSEO
category_id: function-deep
subcategory_id: datatable-functions
fr_parent: data-table-vs-dplyr.html
auto_link_terms: ".N|data.table .N|.N keyword|dt[, .N]|.N symbol"
auto_link_case_sensitive: true
target_keyword: "data.table .N"
sibling_block_enabled: true
difficulty: Beginner
---

# data.table .N in R: Count Rows by Group, Fast

<p class="lead">The <code>.N</code> symbol in <code>data.table</code> is an integer that holds the number of rows in the current group inside <code>j</code>, so <code>dt[, .N, by = grp]</code> returns one count per group without any helper function.</p>

[QUICK ANSWER]
dt[, .N]                                    # total rows in the table
dt[, .N, by = cyl]                          # row count per group
dt[mpg > 20, .N, by = cyl]                  # count after filtering on i
dt[, .SD[.N], by = cyl]                     # last row per group
dt[, .(last_mpg = mpg[.N]), by = cyl]       # last value of a column per group
dt[, if (.N >= 5) .SD, by = cyl]            # keep only groups with 5+ rows
dt[, .(idx = seq_len(.N)), by = cyl]        # 1..n row index inside each group

[DECISION TREE: Is .N the right tool?]
- count rows per group: dt[, .N, by = grp]
- count rows in the whole table: dt[, .N]
- count distinct values: dt[, uniqueN(x)]
- pick the last row in each group: dt[, .SD[.N], by = grp]
- add a 1..n row index per group: dt[, rid := rowid(grp)]
- keep only groups above a size: dt[, if (.N >= n) .SD, by = grp]
- run total or cumulative count: dt[, csum := cumsum(x), by = grp]

## What .N does in one sentence

**`.N` is the integer row count of the current group inside `j`.** Without `by`, the current group is the whole table, so `dt[, .N]` returns a single integer equal to `nrow(dt)`. With `by = grp`, data.table evaluates `j` once per group and `.N` is the size of that group for each call.

The name reads as "Number". It is a scalar, not a table, which is what separates it from its sibling `.SD`. Because the value is computed during the bracket call rather than pulled from a column, `.N` reflects whatever `i` filtered out.

## Syntax

**`.N` is only meaningful inside `DT[i, j, by]`.** Outside the bracket call it does not exist. The position you put it in determines what it returns.

```r title="Three places .N appears"
DT[, .N]                  # j is .N         -> single integer
DT[, .N, by = grp]        # j is .N         -> one integer per group
DT[, .SD[.N], by = grp]   # .N indexes .SD  -> last row per group
```

A few rules follow from `.N` being a scalar:

- `j = .N` returns a one-column data.table with column name `N` and one row per group.
- `mpg[.N]` returns the last element of `mpg` in the current group.
- `seq_len(.N)` builds a 1 to n integer index for the current group.
- `.N` is updated by `i`: filtering rows out before `j` lowers the value.

## Examples by use case

**Build a single `dt` and reuse it for every example.** Every block below works on the same table created from `mtcars`.

```r title="Create a data.table from mtcars"
library(data.table)

dt <- as.data.table(mtcars, keep.rownames = "model")
dt[1:3, .(model, mpg, cyl, hp)]
#>            model   mpg   cyl    hp
#>           <char> <num> <num> <num>
#> 1:     Mazda RX4  21.0     6   110
#> 2: Mazda RX4 Wag  21.0     6   110
#> 3:    Datsun 710  22.8     4    93
```

**Count rows per group.** This is the canonical use of `.N`.

```r title="Row count per cylinder group"
dt[, .N, by = cyl]
#>      cyl     N
#>    <num> <int>
#> 1:     6     7
#> 2:     4    11
#> 3:     8    14
```

The column is named `N` because that is the symbol returned. Rename inline with `.()`: `dt[, .(cars = .N), by = cyl]`.

[TIP]
**`dt[, .N, by = grp]` is the data.table replacement for `table(dt$grp)` and `dplyr::count(dt, grp)`.** It returns a real data.table, scales to keyed tables, and composes with `i` filters in one bracket call.

**Count rows after a filter.** `.N` reflects whatever survives `i`, so the count is "matching rows per group" with no extra step.

```r title="Count fuel-efficient cars per cylinder group"
dt[mpg > 20, .N, by = cyl]
#>      cyl     N
#>    <num> <int>
#> 1:     6     3
#> 2:     4    11
```

The `cyl == 8` group disappears because no eight-cylinder car in `mtcars` clears `mpg > 20`. There is no zero-row placeholder; missing groups simply do not appear.

**Pick the highest or lowest value per group with `[.N]`.** Inside `j`, every column of the current group is a vector of length `.N`, so subscripting at position `.N` returns the last entry, and pairing with `order()` in `i` controls what "last" means.

```r title="Top mpg model per cylinder group"
dt[order(mpg), .(top_model = model[.N], top_mpg = mpg[.N]), by = cyl]
#>      cyl        top_model top_mpg
#>    <num>           <char>   <num>
#> 1:     8 Pontiac Firebird    19.2
#> 2:     6   Hornet 4 Drive    21.4
#> 3:     4   Toyota Corolla    33.9
```

Sorting ascending by `mpg` makes the last element in each group the maximum. The same trick with `mpg[1L]` gives the minimum, and the same idea applies to any column you sort on.

**Filter groups by size.** Wrap `.SD` in an `if (.N >= n)` to drop small groups, mirroring `dplyr::filter(n() >= n)`.

```r title="Keep only groups with 10 or more rows"
dt[, if (.N >= 10) .SD, by = cyl][, .N, by = cyl]
#>      cyl     N
#>    <num> <int>
#> 1:     4    11
#> 2:     8    14
```

The `if (.N >= 10) .SD` returns the whole group when the size test passes and an empty data.table otherwise. The chained `[, .N, by = cyl]` confirms the result.

**Add a 1..n row index inside each group.** `seq_len(.N)` builds the index without a helper function.

```r title="Position of each car within its cyl group"
dt[order(cyl, -mpg), .(model, mpg, rid = seq_len(.N)), by = cyl][1:6]
#>      cyl          model   mpg   rid
#>    <num>         <char> <num> <int>
#> 1:     4 Toyota Corolla  33.9     1
#> 2:     4   Fiat 128       32.4     2
#> 3:     4 Honda Civic    30.4     3
#> 4:     4 Lotus Europa   30.4     4
#> 5:     4 Fiat X1-9      27.3     5
#> 6:     4 Porsche 914-2  26.0     6
```

For a row index across the unsorted table, `rowid(cyl)` from data.table is shorter and avoids the `seq_len` call.

## .N vs nrow() vs uniqueN() vs seq_len(.N)

**Each helper answers a different counting question.** Pick by what you need back.

| Helper | Returns | Use when |
|---|---|---|
| `.N` | Integer row count of current group | Per-group counts inside `j`; positional index inside the group |
| `nrow(dt)` | Integer row count of the whole table | Outside `j`, no grouping involved |
| `uniqueN(x)` | Number of distinct values in `x` | Counting distinct levels, not rows |
| `seq_len(.N)` | Integer vector 1 to `.N` | Adding a row index column per group |
| `rowid(grp)` | Integer vector of group-wise row ids | Building the row index without writing `seq_len` |

The substitution rule is short: `.N` for "how many", `uniqueN` for "how many different", `seq_len(.N)` for "label each one".

## Common pitfalls

**Using `.N` outside `j` raises an error.** `.N` is a special symbol that only exists during a `DT[i, j, by]` call.

```r title="Calling .N outside the bracket fails"
.N
#> Error: object '.N' not found
```

[WARNING]
**`dt[, .N, by = grp]` returns groups, not zero-filled bins.** If a level of `grp` has zero matching rows after the `i` filter, that level is silently omitted. For complete grouping including empty bins, build the keys yourself with `CJ()` and merge.

**`.N` inside `i` means something different.** Inside `i`, `.N` is the table's total row count, used for tail-style indexing like `dt[(.N - 2):.N]` to grab the last three rows. Confusing the `i` use and the `j` use of `.N` leads to wrong counts.

```r title="Last three rows of the whole table"
dt[(.N - 2):.N, .(model, mpg, cyl)]
#>              model   mpg   cyl
#>             <char> <num> <num>
#> 1: Ferrari Dino    19.7     6
#> 2: Maserati Bora   15.0     8
#> 3:     Volvo 142E  21.4     4
```

[NOTE]
**Coming from dplyr?** The equivalent of `dt[, .N, by = grp]` is `dplyr::count(df, grp)` or `df %>% group_by(grp) %>% summarise(n = n())`. `n()` plays the same role as `.N`; both are integer row counts of the current group.

## Try it yourself

**Try it:** Using `dt`, count cars per cylinder group and report the last model listed in each group in natural row order. Save the result to `ex_n`.

```r title="Your turn: count and last model per cyl"
# Try it: per-cylinder count and the last-listed model
ex_n <- # your code here

ex_n
#> Expected: 3 rows with cyl, n, and last_model
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_n <- dt[, .(n = .N, last_model = model[.N]), by = cyl]
ex_n
#>      cyl     n    last_model
#>    <num> <int>        <char>
#> 1:     6     7  Ferrari Dino
#> 2:     4    11    Volvo 142E
#> 3:     8    14 Maserati Bora
```

**Explanation:** `.N` counts rows in each `cyl` group, and `model[.N]` reads the last entry of the `model` vector inside that group. Because there is no `order()` in `i`, "last" is the last car in natural mtcars row order for each cylinder count.

</details>

## Related data.table functions

**`.N` belongs to the `DT[i, j, by]` symbol family.** Explore these next:

- `.SD`: the data behind the count; pair with `.N` for last-row picks like `.SD[.N]`.
- `.GRP`: integer group id of the current group, complements `.N` for indexing.
- `uniqueN()`: distinct-value count, the right tool when rows are not the unit.
- `rowid()` and `rleid()`: vectorized row-id helpers that often replace `seq_len(.N)`.
- `cumsum()` and `cummax()`: running aggregates that read `.N` rows in order.

See the official [data.table introduction vignette](https://rdatatable.gitlab.io/data.table/articles/datatable-intro.html) for `.N` in context with the rest of the special symbols.

## FAQ

**What does .N mean in data.table?**

`.N` is a special symbol that holds the integer number of rows in the current group inside a `DT[i, j, by]` call. Without `by`, the current group is the entire (post-`i`) table, so `dt[, .N]` is the total row count. With `by`, data.table evaluates `j` once per group and `.N` is each group's size. The value is computed at call time, so `i` filters reduce `.N` before `j` ever sees it.

**How is .N different from nrow()?**

`nrow(dt)` is a regular function that returns the row count of any data.table, and it ignores grouping. `.N` is only meaningful inside the bracket call, where it tracks the current group's row count and reflects whatever `i` keeps. Use `nrow()` outside `j`, and `.N` whenever you need a per-group count or a positional index inside `j`.

**Can I use .N inside i?**

Yes. Inside `i`, `.N` is the total row count of the table, which makes tail-style indexing concise: `dt[(.N - 2):.N]` returns the last three rows, and `dt[.N]` returns the last row. This is the same symbol with a position-dependent meaning: in `j` it is per-group; in `i` it is whole-table.

**Does .N count distinct values?**

No. `.N` counts rows. For distinct values, use `uniqueN(x)` which returns the number of unique entries in a vector or column. The two are often paired in the same call, like `dt[, .(rows = .N, drivers = uniqueN(driver)), by = team]` to report both per group.

**Why does .N appear as a column called N in my result?**

When `j` is just `.N`, data.table names the resulting column after the symbol, so the column is `N`. Rename inline by wrapping in `.()`: `dt[, .(rows = .N), by = grp]` produces a column called `rows`. The same naming rule applies to any symbol used bare in `j`.
