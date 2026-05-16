---
title: "data.table frank() in R: Fast Ranking of Vectors"
slug: datatable-frank-in-R
description: "Learn data.table frank() in R to rank vectors and columns fast. Covers ties.method options, descending ranks, group-wise ranking, and frank vs base rank."
keywords: "data.table frank, frank function R, data.table frank examples, R frank ranking, frank vs rank R, frankv data.table, fast rank R"
mathjax: false
webr: true
date: "2026-05-16"
post_type: PSEO
category_id: function-deep
subcategory_id: datatable-functions
fr_parent: data-table-vs-dplyr.html
auto_link_terms: "frank()|data.table frank|data.table::frank()|frankv()|frankv|frank function"
auto_link_case_sensitive: true
target_keyword: "data.table frank"
sibling_block_enabled: true
difficulty: Beginner
---

# data.table frank() in R: Fast Ranking of Vectors

<p class="lead">data.table frank() in R returns the rank of every value in a vector or column, with seven tie-breaking methods and built-in descending order. It is a faster, more flexible drop-in for base rank().</p>

[QUICK ANSWER]
frank(x)                          # rank a vector, average ties
frank(x, ties.method = "dense")   # no gaps after tied values
frank(x, ties.method = "min")     # all ties get the lowest rank
frank(dt, col)                    # rank a data.table by a column
frank(dt, -col)                   # descending rank
frank(.SD, -col)                  # rank inside a by-group
frankv(x, order = -1L)            # vector API, descending

[DECISION TREE: Is frank() the right tool?]
- rank values fast: frank(dt, -mpg)
- sort rows by a column: setorder(dt, -mpg)
- row number within groups: rowid(grp)
- consecutive run IDs: rleid(grp)
- pull the top N rows: dt[order(-mpg)][1:5]
- cut values into percentiles: quantile(x)

## What frank() does in R

**data.table frank() assigns a numeric rank to each value.** It takes a vector, list, data.frame, or data.table and returns one rank per element, ordering from smallest to largest by default. The function is part of the `data.table` package and runs in C, so it stays fast even on millions of rows.

Unlike base `rank()`, `frank()` supports every common tie-breaking rule, accepts a `data.table` directly, and lets you rank by several columns at once. The vector-only variant is `frankv()`.

[NOTE]
**Coming from Python pandas?** The equivalent of `frank()` is the Series method `.rank()`, and `ties.method = "dense"` matches pandas `method="dense"`.

## frank() syntax and arguments

**frank() has one data argument and three controls.** The signature is `frank(x, ..., na.last = TRUE, ties.method = "average")`. Each argument changes a specific part of the ranking behaviour.

- `x`: the data to rank. A vector ranks directly. A `data.table`, `data.frame`, or list ranks by the columns named in `...`.
- `...`: column names or expressions to rank by when `x` is a table. Prefix a column with `-` to rank it in descending order, as in `frank(dt, -mpg)`.
- `na.last`: where missing values go. `TRUE` ranks `NA` last, `FALSE` ranks it first, and `NA` drops it.
- `ties.method`: how equal values share ranks. Options are `"average"` (default), `"first"`, `"last"`, `"min"`, `"max"`, `"dense"`, and `"random"`.

The vector-focused form, `frankv(x, cols, order = 1L, ...)`, is identical except it takes column names as a character vector and an `order` argument (`1L` ascending, `-1L` descending). Use `frankv()` when you build the column list programmatically.

## frank() examples by use case

**Start with a plain vector.** Pass any numeric vector and `frank()` returns its ranks. With the default `"average"` method, tied values share the mean of the ranks they would occupy.

```r title="Rank a vector with frank"
library(data.table)

x <- c(30, 10, 20, 10)
frank(x)
#> [1] 4.0 1.5 3.0 1.5
```

The two `10`s would take ranks 1 and 2, so each gets `1.5`. The `ties.method` argument changes that. `"dense"` never leaves gaps, `"min"` gives every tie the lowest available rank, and `"first"` breaks ties by position.

```r title="Control tie handling"
x <- c(30, 10, 20, 10)
frank(x, ties.method = "dense")
#> [1] 3 1 2 1
frank(x, ties.method = "min")
#> [1] 4 1 3 1
frank(x, ties.method = "first")
#> [1] 4 1 3 2
```

[KEY INSIGHT]
**Use "dense" when you want rank labels, "average" when you want statistics.** Dense ranks are consecutive integers (1, 2, 3) ideal for grouping, while average ranks preserve the spacing needed for rank-based tests.

**Rank a column inside a data.table.** Pass the table as `x` and the column as `...`. Prefix the column with `-` to rank from highest to lowest, which is what "rank 1 = best" usually means.

```r title="Rank a data.table column"
dt <- as.data.table(mtcars, keep.rownames = "car")
dt[, mpg_rank := frank(dt, -mpg)]
head(dt[order(mpg_rank), .(car, mpg, mpg_rank)], 4)
#>               car  mpg mpg_rank
#> 1: Toyota Corolla 33.9      1.0
#> 2:      Fiat 128 32.4      2.0
#> 3:    Honda Civic 30.4      3.5
#> 4:   Lotus Europa 30.4      3.5
```

**Rank within groups.** Combine `frank()` with `.SD` and `by` to rank rows inside each group. Here every car is ranked by `mpg` against other cars with the same cylinder count.

```r title="Rank within groups"
dt[, rank_in_cyl := frank(.SD, -mpg), by = cyl]
dt[cyl == 6, .(car, mpg, rank_in_cyl)][order(rank_in_cyl)]
#>              car  mpg rank_in_cyl
#> 1: Hornet 4 Drive 21.4         1.0
#> 2:      Mazda RX4 21.0         2.5
#> 3:  Mazda RX4 Wag 21.0         2.5
#> 4:   Ferrari Dino 19.7         4.0
#> 5:       Merc 280 19.2         5.0
#> 6:        Valiant 18.1         6.0
#> 7:      Merc 280C 17.8         7.0
```

## frank() vs base rank()

**frank() does everything rank() does, plus three things it cannot.** Base `rank()` works on vectors only and lacks the `"dense"` and `"last"` tie methods. The table below shows where `frank()` pulls ahead.

| Feature | frank() | base rank() |
|---|---|---|
| Speed on large vectors | Fast, multi-threaded | Slower |
| ties.method = "dense" | Supported | Not supported |
| Rank a data.table column | Direct | Needs `rank(dt$col)` |
| Rank by multiple columns | Yes | No |
| Descending order | `-col` or `order = -1L` | `rank(-x)` only |

For a one-off rank on a short vector, base `rank()` is fine. Reach for `frank()` when the data is large, when you need dense ranks, or when ranking happens inside a `data.table` workflow.

[TIP]
**frank() is the safe default in any data.table pipeline.** It is faster, supports more tie rules, and reads consistently with `setorder()` and `frollmean()`, so mixing it with base `rank()` only adds friction.

## Common pitfalls

**Watch the default tie method.** With `ties.method = "average"`, tied values return decimals like `3.5`. If a later step expects whole numbers, switch to `"min"` or `"dense"`.

**A misspelled tie method errors immediately.** Only the seven documented strings are valid.

```r title="Invalid ties.method"
frank(c(3, 1, 2), ties.method = "smallest")
#> Error: 'arg' should be one of "average", "first", "last",
#>   "min", "max", "dense", "random"
```

The fix is to use `"min"`, the method most people mean by "smallest".

[WARNING]
**frank() ranks NA values instead of skipping them.** With the default `na.last = TRUE`, a missing value receives a real numeric rank at the end, not `NA`. Set `na.last = NA` to drop missing values from the result entirely.

## Try it yourself

**Try it:** Rank the cars in `mtcars` by horsepower (`hp`) so that the most powerful car is rank 1, breaking ties densely. Save the ranks to `ex_ranks`.

```r title="Your turn: rank by horsepower"
# Try it: rank mtcars by hp, highest = rank 1
ex_ranks <- # your code here

head(ex_ranks)
#> Expected: the highest-hp car has rank 1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_ranks <- frank(mtcars, -hp, ties.method = "dense")
head(ex_ranks)
#> [1] 11 11 14 11 8 15
```

**Explanation:** Prefixing `hp` with `-` ranks from highest to lowest, so the strongest engine gets rank 1. The `"dense"` method keeps the ranks as consecutive integers with no gaps after ties.

</details>

## Related data.table functions

**frank() sits next to data.table's ordering and grouping helpers.** Use these when ranking is not quite the operation you need.

- `setorder()`: sort the rows of a table in place instead of ranking them.
- `rowid()`: number rows 1, 2, 3 within each group.
- `rleid()`: assign run-length IDs to consecutive equal values.
- `uniqueN()`: count distinct values, often paired with dense ranks.
- `shift()`: lag or lead a column, useful for rank-change calculations.

See the official [data.table frank reference](https://rdatatable.gitlab.io/data.table/reference/frank.html) for the full argument list.

## FAQ

**What is the difference between frank and rank in R?**

`frank()` is data.table's ranking function and `rank()` is base R's. They return the same result for a simple vector with the default settings. `frank()` adds multi-threaded speed, the `"dense"` and `"last"` tie methods, direct support for ranking `data.table` columns, and ranking by several columns at once. Base `rank()` handles only vectors.

**How do I rank in descending order with frank?**

Prefix the column or vector with a minus sign: `frank(dt, -mpg)` ranks the highest `mpg` as rank 1. For the `frankv()` API, pass `order = -1L` instead. Negating works because `frank()` ranks ascending by default, so flipping the sign flips the order.

**What does ties.method = "dense" do?**

Dense ranking assigns consecutive integers with no gaps after tied values. If two values tie for rank 1, the next value gets rank 2, not rank 3. This contrasts with `"min"`, which would jump to rank 3. Dense ranks are ideal when you want compact group labels rather than positions.

**Can frank rank multiple columns at once?**

Yes. Pass several columns to the `...` argument: `frank(dt, cyl, -mpg)` ranks first by `cyl` ascending, then breaks ties by `mpg` descending. This mirrors how `setorder()` sorts by multiple keys, and base `rank()` cannot do it.

**Does frank work on character or date columns?**

Yes. `frank()` ranks any orderable type, including characters (alphabetical), factors (by level), and `Date` or `POSIXct` values (chronological). The same `ties.method` and descending rules apply, so `frank(dt, -order_date)` ranks the most recent date as rank 1.
