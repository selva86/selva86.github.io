---
title: "data.table rleid() in R: Number Consecutive Runs"
slug: datatable-rleid-in-R
description: "Learn data.table rleid() in R to generate run-length group ids for consecutive values. Covers syntax, rleidv, the prefix argument, grouping, and pitfalls."
keywords: "data.table rleid, rleid function R, data.table rleid examples, R rleid run length, rleid group consecutive, rleidv data.table, rleid vs rle"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: datatable-functions
fr_parent: data-table-vs-dplyr.html
auto_link_terms: "rleid()|data.table rleid|data.table::rleid()|rleidv()|run-length id"
auto_link_case_sensitive: true
target_keyword: "data.table rleid"
sibling_block_enabled: true
difficulty: Beginner
---

# data.table rleid() in R: Number Consecutive Runs

<p class="lead">The data.table rleid() function in R assigns a run-length integer id to every element, giving each block of consecutive identical values its own group number. It is the fast, vectorized way to group runs before aggregating.</p>

[QUICK ANSWER]
rleid(x)                          # run-length ids for one vector
rleid(x, prefix = "run")          # character ids: run1, run2 ...
rleid(a, b)                       # id changes when a OR b changes
rleidv(DT, "grp")                 # rleid driven by a data.table column
DT[, run := rleid(grp)]           # add the run id by reference
DT[, sum(val), by = rleid(grp)]   # group consecutive runs inline

[DECISION TREE: Is rleid() the right tool?]
- number consecutive runs of a value: rleid(x)
- count occurrences within each group: rowid(grp)
- get run lengths and values, not ids: rle(x)
- one id per distinct value (not run): DT[, .N, by = grp]
- plain row number across the table: seq_len(.N)
- detect where a value changes: x != shift(x)

## What rleid() does

**rleid() turns consecutive runs into group ids.** Whenever a value is identical to the element before it, both share a run id. The moment the value changes, the id increments by one. The result is an integer vector the same length as the input, ready to use in a `by =` clause.

This matters because ordinary grouping ignores position. A standard group id gives every `"A"` the same number no matter where it sits. `rleid()` instead respects order, so two separate blocks of `"A"` get two different ids.

```r title="Basic run-length ids"
library(data.table)

x <- c(5, 5, 9, 9, 9, 5)
rleid(x)
#> [1] 1 1 2 2 2 3
```

The first run of `5` is id 1, the run of `9` is id 2, and the final lone `5` is id 3, not id 1.

[KEY INSIGHT]
**rleid() is position-aware, not value-aware.** A group id answers "which value is this?" A run-length id answers "which consecutive block is this?" Use `rleid()` whenever a gap between identical values should start a fresh group.

## rleid() and rleidv() syntax

**rleid() takes one or more vectors; rleidv() takes a table plus column names.** They produce the same kind of output but accept input differently. Pick `rleid()` for loose vectors and `rleidv()` when the data already lives in a data.table.

```r title="The two function signatures"
# rleid(..., prefix = NULL)
# rleidv(x, cols = seq_along(x), prefix = NULL)
```

| Argument | Belongs to | Purpose |
|---|---|---|
| `...` | `rleid` | One or more atomic vectors or lists of equal length |
| `x` | `rleidv` | A list, data.frame, or data.table |
| `cols` | `rleidv` | Character or integer columns of `x` to use |
| `prefix` | both | Optional string; returns character ids instead of integers |

Both functions live in `data.table`, so the package must be loaded with `library(data.table)` before you call them. Neither one needs the `DT[i, j, by]` query syntax, so you can use `rleid()` on any plain vector.

## rleid() examples by use case

**These four patterns cover almost every real use of rleid().** Each builds on the last: a single vector, a labelled prefix, multiple inputs, and finally grouping inside a data.table.

### Label runs with a prefix

**The prefix argument returns readable character ids.** Pass any string and the integer ids become `prefix1`, `prefix2`, and so on. This is useful when the run id will appear in a report or a plot legend.

```r title="Prefix turns ids into labels"
grp <- c("lo", "lo", "hi", "hi", "lo")
rleid(grp, prefix = "run")
#> [1] "run1" "run1" "run2" "run2" "run3"
```

### Track runs across multiple columns

**Pass several vectors and the id changes when any of them changes.** `rleid()` compares the element-wise tuple of all inputs. A new run starts as soon as one column differs from the previous row.

```r title="Runs across two vectors"
a <- c("x", "x", "y", "y", "x")
b <- c(1,   1,   1,   2,   2)
rleid(a, b)
#> [1] 1 1 2 3 4
```

Rows 1 and 2 match on both `a` and `b`. Row 3 changes `a`, row 4 changes `b`, and row 5 changes `a` again, so every later row opens a new run.

### Group consecutive runs in a data.table

**The classic job for rleid() is collapsing consecutive runs before aggregation.** Add the run id with `:=`, then use it in `by =`. Here three blocks of sensor readings get summarized without merging the two separate `"A"` stretches.

```r title="Aggregate consecutive sensor runs"
DT <- data.table(
  sensor  = c("A", "A", "A", "B", "B", "A", "A"),
  reading = c(21, 22, 20, 30, 31, 25, 26)
)
DT[, run := rleid(sensor)]
DT[, .(sensor = sensor[1], n = .N, avg = mean(reading)), by = run]
#>      run sensor     n   avg
#>    <int> <char> <int> <num>
#> 1:     1      A     3  21.0
#> 2:     2      B     2  30.5
#> 3:     3      A     2  25.5
```

The two `"A"` runs stay separate because they are not adjacent. The equivalent call with `rleidv()` reads the column straight from the table:

```r title="Same result with rleidv"
rleidv(DT, "sensor")
#> [1] 1 1 1 2 2 3 3
```

[TIP]
**Group inline to skip a temporary column.** You do not have to store the id first. `DT[, mean(reading), by = rleid(sensor)]` computes the run id and groups in a single pass, which keeps the table tidy.

## rleid() vs rle() vs rowid()

**rleid(), rle(), and rowid() are close cousins that answer different questions.** Choosing the wrong one is the most common source of confusion, so compare them on the same input.

| Function | Returns | Length of output | Use when |
|---|---|---|---|
| `rleid(x)` | Run-length group id per element | Same as input | You need a `by =` grouping key |
| `rle(x)` | Run lengths and values | One row per run | You need run sizes, not ids |
| `rowid(x)` | Occurrence counter within each value | Same as input | You need a within-group sequence |

```r title="Compare rleid rle and rowid"
g <- c("A", "A", "B", "A")
rleid(g)
#> [1] 1 2 3 4
rowid(g)
#> [1] 1 2 1 3
rle(g)$lengths
#> [1] 2 1 1
```

`rleid()` numbers consecutive blocks, `rowid()` counts how many times each value has appeared, and `rle()` reports how long each run is.

## Common pitfalls

**Three mistakes catch most newcomers to rleid().** Each one stems from forgetting that the function is strictly position-based.

**Non-consecutive matches are different runs.** If you expect every `"A"` to share an id, you want a value-based group id, not `rleid()`. The function gives separated blocks separate numbers.

```r title="Separated values get separate ids"
y <- c("A", "B", "A", "A")
rleid(y)
#> [1] 1 2 3 3
```

**Unsorted data produces tiny runs.** `rleid()` never sorts. If rows alternate, every element becomes its own run. Call `setorder()` or `setkey()` first when you want grouped runs.

```r title="Alternating data has no runs"
status <- c("on", "off", "on", "off")
rleid(status)
#> [1] 1 2 3 4
```

[WARNING]
**A run of NAs counts as a run.** `rleid()` treats consecutive `NA` values as identical, so they form their own run. A single `NA` breaks a run just like any other changed value, which can split groups you expected to stay whole.

```r title="NA values form their own run"
rleid(c(1, NA, NA, 2, NA))
#> [1] 1 2 2 3 4
```

## Try it yourself

**Try it:** Given a vector of consecutive weather states, generate the run-length id and save it to `ex_runs`.

```r title="Your turn: number the runs"
# Try it: number consecutive runs
states <- c("sun", "sun", "rain", "rain", "rain", "sun")
ex_runs <- # your code here

ex_runs
#> Expected: 1 1 2 2 2 3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
states <- c("sun", "sun", "rain", "rain", "rain", "sun")
ex_runs <- rleid(states)
ex_runs
#> [1] 1 1 2 2 2 3
```

**Explanation:** `rleid()` walks the vector once, incrementing the id at every change. The two `"sun"` blocks are not adjacent, so they receive ids 1 and 3.

</details>

## Related data.table functions

**rleid() works best alongside a handful of other data.table helpers.** These pair naturally with run-length grouping:

- `rowid()` builds a within-group occurrence counter instead of a run id.
- `shift()` lags or leads a column, which is how you detect where a value changes.
- `setorder()` sorts a data.table in place so that runs actually form.
- `uniqueN()` counts the distinct values, a quick sanity check against run ids.
- `rle()` from base R returns run lengths and values when ids are not what you need.

See the [data.table vs dplyr](data-table-vs-dplyr.html) guide for how run-length grouping compares with the tidyverse approach. The official [rleid reference](https://rdatatable.gitlab.io/data.table/reference/rleid.html) lists every argument.

## FAQ

**What is rleid in data.table?**

`rleid()` is a data.table convenience function that generates a run-length type group id. It scans a vector and assigns the same integer to every block of consecutive identical values, incrementing the id whenever the value changes. The output is an integer vector the same length as the input, designed to be used as a grouping key in a `by =` clause.

**What is the difference between rleid and rowid?**

`rleid()` numbers consecutive runs, so the id changes every time the value changes. `rowid()` counts how many times each distinct value has appeared so far, restarting the count per value. For `c("A","A","B","A")`, `rleid()` returns `1 2 3 4` while `rowid()` returns `1 2 1 3`. Use `rleid()` for run grouping and `rowid()` for within-group sequence numbers.

**How is rleid different from rle?**

Base R's `rle()` returns a compact summary: one run length and one value per run. `rleid()` instead returns a full-length vector with one id per element. `rle()` answers "how long is each run?" while `rleid()` answers "which run does this element belong to?" The latter is what you need for grouping and aggregation.

**Can rleid handle multiple columns at once?**

Yes. Pass several vectors to `rleid()` and a new run starts whenever any input changes. With a data.table, use `rleidv(DT, c("col1", "col2"))` to drive the id from named columns. The id increments at the first row where the tuple of column values differs from the previous row.
