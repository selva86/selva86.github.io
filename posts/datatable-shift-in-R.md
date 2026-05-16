---
title: "data.table shift() in R: Lag and Lead Columns"
slug: datatable-shift-in-R
description: "Learn data.table shift() in R to lag and lead column values. Covers the n, fill, and type arguments, group-wise shifts with by, and common pitfalls to avoid."
keywords: "data.table shift, shift function R, data.table shift examples, R lag lead column, data.table lag, data.table lead, shift vs lag R"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: datatable-functions
fr_parent: data-table-vs-dplyr.html
auto_link_terms: "shift()|data.table shift|data.table::shift()|lag and lead|lead and lag"
auto_link_case_sensitive: true
target_keyword: "data.table shift"
sibling_block_enabled: true
difficulty: Beginner
---

# data.table shift() in R: Lag and Lead Columns

<p class="lead">The data.table shift() function in R moves the values of a vector or column forward (lag) or backward (lead) by a fixed number of positions. It is the fast, vectorized way to compare each row with an earlier or later one.</p>

[QUICK ANSWER]
shift(x)                          # lag by 1 (the default)
shift(x, type = "lead")           # lead by 1
shift(x, n = 3)                   # lag by 3 positions
shift(x, fill = 0)                # fill the gap with 0, not NA
shift(x, n = 1:2)                 # list: lag 1 and lag 2 at once
shift(x, type = "cyclic")         # wrap end values to the front
DT[, p := shift(v), by = g]       # lag within each group

[DECISION TREE: Is shift() the right tool?]
- lag or lead a column: shift(v)
- difference between adjacent rows: v - shift(v)
- rolling mean over a window: frollmean(v, 3)
- cumulative running total: cumsum(v)
- number consecutive runs of a value: rleid(v)
- row number within each group: rowid(g)

## What shift() does

**shift() slides every value to a new position.** A lag pushes values down so each row sees the one before it. A lead pulls values up so each row sees the one after it. The vector keeps its original length, and the positions left empty at the edge are filled with `NA`.

This is the building block for period-over-period analysis. To compute a daily change, a growth rate, or a "same value as yesterday" flag, you need each row paired with its neighbour. `shift()` produces that neighbour as a plain column.

```r title="Lag and lead a vector"
library(data.table)

x <- c(10, 20, 30, 40)
shift(x)
#> [1] NA 10 20 30

shift(x, type = "lead")
#> [1] 20 30 40 NA
```

The lag drops `NA` into position 1 because no row precedes it. The lead drops `NA` into the last position for the same reason at the other end.

[KEY INSIGHT]
**Lag looks backward, lead looks forward.** A lag of 1 gives each row the previous value; a lead of 1 gives each row the next value. If you ever mix them up, remember that "lag" shares a root with "lagging behind".

## shift() syntax and arguments

**shift() takes one vector or list plus four optional controls.** The defaults give a single-step lag filled with `NA`, so calling `shift(x)` alone is the most common form.

```r title="The shift function signature"
# shift(x, n = 1L, fill = NA, type = "lag", give.names = FALSE)
```

| Argument | Default | Purpose |
|---|---|---|
| `x` | required | A vector, or a list of vectors of equal length |
| `n` | `1L` | How many positions to move; accepts a vector for several shifts |
| `fill` | `NA` | Value placed in the gap created at the edge |
| `type` | `"lag"` | One of `"lag"`, `"lead"`, `"shift"`, or `"cyclic"` |
| `give.names` | `FALSE` | If `TRUE`, names the output list elements automatically |

The `type = "shift"` option is an alias that behaves like `"lag"` for positive `n`. The `"cyclic"` option is the odd one out: instead of inserting `fill`, it wraps the values pushed off one end around to the other.

## shift() examples by use case

**Four patterns cover almost every real use of shift().** Each adds one argument: a custom fill, several lags at once, a cyclic wrap, and finally a shift inside a grouped data.table.

### Replace the NA gap with a fill value

**The fill argument controls what lands in the empty edge slot.** Passing `fill = 0` keeps the column fully numeric, which avoids `NA` propagation in later arithmetic.

```r title="Fill the gap instead of NA"
x <- c(10, 20, 30, 40)
shift(x, fill = 0)
#> [1]  0 10 20 30
```

### Produce several lags in one call

**Pass a vector to n and shift() returns a list.** Each list element is one lag, which is handy when a model needs values from the last few periods as separate columns.

```r title="Lag by 1 and 2 together"
shift(x, n = 1:2)
#> [[1]]
#> [1] NA 10 20 30
#>
#> [[2]]
#> [1] NA NA 10 20
```

### Wrap values with a cyclic shift

**The cyclic type recycles edge values rather than discarding them.** The value pushed off the bottom reappears at the top, so no `NA` is ever introduced.

```r title="Cyclic shift wraps the ends"
shift(x, type = "cyclic")
#> [1] 40 10 20 30
```

### Shift within each group

**Inside a data.table, combine shift() with by to lag per group.** This is the single most important pattern: it stops the last value of one group from leaking into the first row of the next.

```r title="Group-wise lag with by"
DT <- data.table(
  grp = c("a", "a", "a", "b", "b"),
  val = c(10, 14, 19, 50, 58)
)
DT[, prev := shift(val), by = grp]
DT
#>    grp val prev
#> 1:   a  10   NA
#> 2:   a  14   10
#> 3:   a  19   14
#> 4:   b  50   NA
#> 5:   b  58   50
```

Notice row 4: group `b` starts fresh with `NA`, not the `19` from group `a`. From there, a change column is one subtraction away.

```r title="Row-over-row change per group"
DT[, change := val - shift(val), by = grp]
DT
#>    grp val prev change
#> 1:   a  10   NA     NA
#> 2:   a  14   10      4
#> 3:   a  19   14      5
#> 4:   b  50   NA     NA
#> 5:   b  58   50      8
```

[TIP]
**Sort before you shift.** `shift()` works on physical row order, not on any logical ordering. Run `setorder(DT, grp, date)` first so each lag pulls the genuinely previous period and not a random earlier row.

## shift() compared with alternatives

**Several functions move data, but shift() is the data.table-native choice.** It is fast, works inside `DT[...]`, and returns the same length it received.

| Function | Package | Notes |
|---|---|---|
| `shift()` | data.table | Lag and lead in one function; vectorized `n`; group-aware with `by` |
| `lag()` / `lead()` | dplyr | Tidyverse equivalent; one function per direction |
| `lag()` | stats | Shifts a time series object's index, not its values; rarely what you want |
| `head()` / `tail()` with padding | base R | Manual, error-prone, changes length unless you re-pad |

Use `shift()` whenever the data already lives in a data.table. Reach for dplyr's `lag()` and `lead()` only when the surrounding pipeline is tidyverse.

[NOTE]
**Coming from dplyr?** `shift(x)` is `lag(x)`, and `shift(x, type = "lead")` is `lead(x)`. data.table folds both directions into one function controlled by `type`.

## Common pitfalls

**Three mistakes account for most shift() bugs.** Each has a quick fix.

First, **forgetting `by` on grouped data.** Without it, `shift()` lags across the whole table and the first row of every group inherits the previous group's last value. Always add `by = grp`.

Second, **shifting an unsorted table.** `shift()` trusts row order. If the rows are not in time order, the "previous" value is meaningless. Call `setorder()` before shifting.

```r title="A shift on unsorted rows is wrong"
bad <- data.table(day = c(3, 1, 2), v = c(30, 10, 20))
bad[, prev := shift(v)]   # lags physical order, not day order
bad
#>    day  v prev
#> 1:   3 30   NA
#> 2:   1 10   30
#> 3:   2 20   10
```

Third, **expecting `n = -1` to mean lead.** A negative `n` does flip direction, but `type = "lead"` is the clear, readable way to express intent.

## Try it yourself

**Try it:** Lag the `mpg` column of `mtcars` by one row, filling the gap with `0`. Save the result to `ex_lagged`.

```r title="Your turn: lag mpg"
library(data.table)
dt <- as.data.table(mtcars)

# Try it: lag mpg by 1, fill with 0
ex_lagged <- # your code here

head(ex_lagged)
#> Expected: 0.0 21.0 21.0 22.8 21.4 18.7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
library(data.table)
dt <- as.data.table(mtcars)

ex_lagged <- shift(dt$mpg, n = 1, fill = 0)
head(ex_lagged)
#> [1]  0.0 21.0 21.0 22.8 21.4 18.7
```

**Explanation:** `shift()` with `n = 1` lags the vector one position and `fill = 0` replaces the leading `NA` with `0`, keeping the column numeric.

</details>

## Related data.table functions

These functions pair naturally with `shift()` for ordered-data work:

- `frollmean()` computes a rolling mean over a sliding window.
- `frollsum()` computes a rolling sum for moving totals.
- `rleid()` numbers consecutive runs of identical values.
- `rowid()` gives a row counter within each group.
- `setorder()` sorts a data.table in place so shifts respect time order.

## FAQ

**What is the difference between shift() and lag() in R?**

`shift()` is the data.table function and `lag()` is the dplyr (or base stats) function. data.table's `shift()` handles both directions through its `type` argument, so `shift(x)` lags and `shift(x, type = "lead")` leads. dplyr splits this into two functions, `lag()` and `lead()`. The base `stats::lag()` is different again: it shifts a time series object's time index rather than its values, which surprises most users.

**How do I shift a column within groups in data.table?**

Add a `by` clause to the data.table call: `DT[, prev := shift(val), by = grp]`. The `by` argument makes `shift()` restart at every group boundary, so the first row of each group gets `NA` instead of leaking the previous group's last value. Sort the table with `setorder()` first if the rows are not already in order.

**Why does shift() return NA values?**

`shift()` keeps the vector the same length, so the positions exposed at the edge have nothing to point to. A lag empties the first `n` rows and a lead empties the last `n`. Pass the `fill` argument, for example `fill = 0`, to replace those `NA` values with a constant of your choice.

**Can shift() move data in both directions?**

Yes. Set `type = "lead"` to pull values backward so each row sees the next one, and keep the default `type = "lag"` to push values forward. You can also pass a negative `n`, which reverses direction, but `type` is the clearer way to express intent in code.

**Does shift() work on a whole data.table at once?**

`shift()` accepts a list of equal-length vectors, and a data.table is a list of columns, so `shift(DT)` lags every column and returns a list. In practice you usually shift specific columns inside `DT[, ...]` with `.SD` and `.SDcols` for clean, named output.
