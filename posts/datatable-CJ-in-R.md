---
title: "data.table CJ() in R: Generate All Value Combinations"
slug: "datatable-CJ-in-R"
description: "Use data.table CJ() in R to build the cross join of vectors, generate every value combination, and fill missing rows, with sorted and unique examples."
keywords: "data.table CJ, CJ function R, data.table CJ examples, R cross join data.table, CJ Cartesian product R, expand grid data.table, all combinations in R"
mathjax: false
webr: true
date: "2026-05-16"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "datatable-functions"
fr_parent: "data-table-vs-dplyr.html"
auto_link_terms: "CJ()|data.table CJ|data.table::CJ()|cross join|Cartesian product"
auto_link_case_sensitive: true
target_keyword: "data.table CJ"
sibling_block_enabled: true
difficulty: "Beginner"
---

# data.table CJ() in R: Generate All Value Combinations

<p class="lead">The <code>CJ()</code> function in data.table builds a cross join: a data.table containing every combination of the vectors you pass, sorted and keyed by default, ready to join against your data.</p>

[QUICK ANSWER]
CJ(1:3, c("a", "b"))                     # all combos of two vectors
CJ(id = 1:3, grp = c("a", "b"))          # name the output columns
CJ(c(2, 1, 2), c("a", "a"), unique = TRUE) # dedupe inputs first
CJ(c(3, 1, 2), 1:2, sorted = FALSE)      # keep input order, unkeyed
CJ(year = 2021:2023, quarter = 1:4)      # build a full panel grid
sales[CJ(unique(store), unique(month))]  # join to fill missing combos
nrow(CJ(1:10, 1:10))                     # rows = product of lengths

[DECISION TREE: Is CJ() the right tool?]
- all combinations of values: CJ(x, y)
- combinations as a data.frame: expand.grid(x, y)
- combinations in the tidyverse: tidyr::crossing(x, y)
- fill missing panel rows: dt[CJ(ids, dates)]
- only count combinations: prod(lengths(list(x, y)))
- full join of two whole tables: merge(a, b, allow.cartesian = TRUE)

## What CJ() does in one sentence

**`CJ()` produces the cross product of its input vectors as a data.table.** The name stands for Cross Join. You hand it two or more vectors, and it returns a table whose rows are every possible combination of one value from each vector. Two vectors of length 3 and 2 give a 6-row table.

The reason `data.table CJ` exists is to make grid building fast and join-ready. Base R has `expand.grid()`, but it returns an unsorted `data.frame`. `CJ()` returns a `data.table` that is sorted and keyed on every column by default, so it slots straight into a `data.table` join to expand or complete a dataset. That keying is what makes `CJ()` the standard tool for filling missing rows in a panel.

## Syntax

**`CJ()` takes any number of vectors plus two switches.** Every vector becomes one column of the result; the switches control ordering and deduplication.

```r title="Load data.table and cross join two vectors"
library(data.table)

CJ(1:3, c("a", "b"))
#>       V1     V2
#>    <int> <char>
#> 1:     1      a
#> 2:     1      b
#> 3:     2      a
#> 4:     2      b
#> 5:     3      a
#> 6:     3      b
```

The full signature is `CJ(..., sorted = TRUE, unique = FALSE)`. Its arguments are:

- `...`: the vectors to cross. Each one becomes a column. Pass them with names (`id = 1:3`) to name the output columns; bare vectors become `V1`, `V2`, and so on.
- `sorted`: `TRUE` (the default) sorts the result and sets a key on all columns. `FALSE` keeps input order and leaves the table unkeyed.
- `unique`: `TRUE` applies `unique()` to each input before crossing. `FALSE` (the default) keeps duplicate inputs, which inflates the row count.

[TIP]
**Always name your inputs.** Writing `CJ(year = 2021:2023, quarter = 1:4)` gives readable `year` and `quarter` columns instead of `V1` and `V2`, and it makes the result join cleanly against tables that already use those names.

## Cross joining vectors: four common patterns

### 1. All combinations of two or more vectors

**The core use of `CJ()` is enumerating every combination.** Pass as many vectors as you like; the result has one row per combination and one column per vector.

```r title="Cross join three vectors"
CJ(size = c("S", "M"), color = c("red", "blue"), pack = 1:2)
#>      size  color  pack
#>    <char> <char> <int>
#> 1:      M   blue     1
#> 2:      M   blue     2
#> 3:      M    red     1
#> 4:      M    red     2
#> 5:      S   blue     1
#> 6:      S   blue     2
#> 7:      S    red     1
#> 8:      S    red     2
```

Two sizes, two colors, and two pack counts give `2 * 2 * 2 = 8` rows. The last vector varies fastest, and because `sorted = TRUE`, each column comes out in ascending order.

### 2. Keep input order with sorted = FALSE

**Set `sorted = FALSE` when the original order of your vectors matters.** The default sorts every column, which is usually helpful but discards any deliberate ordering.

```r title="Retain input order with sorted FALSE"
CJ(c(3, 1, 2), c("b", "a"), sorted = FALSE)
#>       V1     V2
#>    <num> <char>
#> 1:      3      b
#> 2:      3      a
#> 3:      1      b
#> 4:      1      a
#> 5:      2      b
#> 6:      2      a
```

The first value `3` is no longer pushed to the bottom. The result is also unkeyed, so a later join against it will not get the speed boost that a keyed table provides.

### 3. Drop duplicate inputs with unique = TRUE

**`CJ()` keeps duplicate inputs unless you ask it not to.** A vector with repeats produces repeated rows, which is rarely what you want for a grid.

```r title="Cross join unique values only"
ids <- c(1, 1, 2, 3, 3)

nrow(CJ(ids, c("a", "b")))
#> [1] 10

nrow(CJ(ids, c("a", "b"), unique = TRUE))
#> [1] 6
```

With duplicates kept, the five-element `ids` vector crosses with two letters for 10 rows. Passing `unique = TRUE` first reduces `ids` to its three distinct values, giving the expected `3 * 2 = 6` rows.

### 4. Build a panel and fill missing rows

**The headline use of `CJ()` is completing a dataset.** Join a `CJ()` grid against a keyed table and every missing combination appears as a row with `NA`.

```r title="Fill missing combinations with a CJ join"
sales <- data.table(
  store = c("A", "A", "B"),
  month = c(1L, 2L, 1L),
  units = c(10, 15, 7)
)
setkey(sales, store, month)

sales[CJ(store = c("A", "B"), month = 1:2)]
#>     store month units
#>    <char> <int> <num>
#> 1:      A     1    10
#> 2:      A     2    15
#> 3:      B     1     7
#> 4:      B     2     NA
```

Store `B` had no row for month 2 in the raw data. The `CJ()` grid lists both stores against both months, and the join surfaces the gap as `units = NA`, ready for you to fill with zero or impute.

[KEY INSIGHT]
**`CJ()` turns an incomplete dataset into a rectangular one.** Real data has holes: a store with no sales in a month, a sensor that skipped a reading. Joining against the complete `CJ()` grid makes every expected row exist, so downstream sums, rolling windows, and plots no longer silently skip the gaps.

## CJ() vs expand.grid() and crossing()

**Three functions build cross products, but they differ in output type and ordering.** `CJ()` returns a keyed `data.table`, `expand.grid()` returns a base `data.frame`, and `tidyr::crossing()` returns a sorted tibble.

```r title="CJ versus expand.grid"
cj_out <- CJ(x = 1:2, y = c("a", "b"))
class(cj_out)
#> [1] "data.table" "data.frame"

eg_out <- expand.grid(x = 1:2, y = c("a", "b"))
class(eg_out)
#> [1] "data.frame"
```

| Function | Package | Returns | Sorted and keyed | Auto-dedupe |
|---|---|---|---|---|
| `CJ()` | data.table | data.table | yes, by default | with `unique = TRUE` |
| `expand.grid()` | base R | data.frame | no | no |
| `crossing()` | tidyr | tibble | yes, sorted | yes |

Reach for `CJ()` when the result feeds a `data.table` join, since the key makes that join fast. Use `expand.grid()` for a quick base-R grid with no extra dependency. Use `crossing()` inside a tidyverse pipeline.

[NOTE]
**Coming from Python pandas?** The closest equivalent of `CJ()` is `pd.merge(df1, df2, how="cross")`, or `itertools.product()` when you only need the raw tuples rather than a labelled table.

## Common pitfalls

**Pitfall 1: the result grows multiplicatively.** A cross join of two vectors has `length(x) * length(y)` rows, so large inputs explode fast.

```r title="Cross joins grow multiplicatively"
nrow(CJ(1:1000, 1:1000))
#> [1] 1000000
```

Crossing two thousand-element vectors yields a million rows. Check `prod(lengths(list(x, y)))` before running `CJ()` on big inputs so you do not exhaust memory by accident.

**Pitfall 2: duplicate inputs are kept by default.** Because `unique` defaults to `FALSE`, a vector with repeated values produces repeated rows. If your inputs come from a raw column rather than a clean lookup, pass `unique = TRUE` or wrap each input in `unique()` yourself.

**Pitfall 3: bare vectors get generic column names.** `CJ(1:3, 1:2)` produces columns `V1` and `V2`, which will not match the names in the table you join against. Always pass named arguments so the join keys line up.

[WARNING]
**A `CJ()` join can fail with an `allow.cartesian` error.** When the grid is large relative to the data, data.table refuses the join as a safety check. If the size is genuinely intended, add `allow.cartesian = TRUE` to the join call rather than disabling the guard globally.

## Try it yourself

**Try it:** Build a grid of every combination of three shirt sizes (`S`, `M`, `L`) and two colors (`red`, `blue`). Save the result to `ex_grid`.

```r title="Your turn: cross join sizes and colors"
# Try it: all size-color combinations
ex_grid <- # your code here

nrow(ex_grid)
#> Expected: 6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_grid <- CJ(size = c("S", "M", "L"), color = c("red", "blue"))
nrow(ex_grid)
#> [1] 6
```

**Explanation:** `CJ()` crosses the three sizes with the two colors, producing `3 * 2 = 6` rows. Naming the arguments gives readable `size` and `color` columns instead of `V1` and `V2`.

</details>

## Related data.table functions

These functions pair naturally with `CJ()` when you build grids or join tables:

- `expand.grid()`: the base R cross product, returning an unsorted `data.frame`.
- `setkey()`: sets the key that makes a `CJ()` join fast.
- `merge()`: joins two whole tables, with `allow.cartesian` for full cross joins.
- `rbindlist()`: stacks a list of tables into one, often after a grid expansion.
- `data.table()`: the constructor; `CJ()` is effectively a grid-shaped constructor.

## FAQ

**What does CJ stand for in data.table?**

CJ stands for Cross Join. It is named after the SQL cross join, which pairs every row of one table with every row of another. In data.table, `CJ()` does the same for vectors: it returns every combination of one value from each input vector as a new `data.table`. The companion functions `J()` and `SJ()` build join tables too, with `SJ()` being a sorted variant.

**How is CJ different from expand.grid in R?**

Both return every combination of their inputs, but `CJ()` produces a `data.table` that is sorted and keyed on all columns, while `expand.grid()` produces an unsorted base `data.frame`. The key matters: a keyed `CJ()` table joins against other data.tables quickly, which is why `CJ()` is preferred for completing panels. `expand.grid()` is fine when you only need a quick grid and want no extra package dependency.

**How do I use CJ to fill missing dates in R?**

Build a grid of every id and every date with `CJ(id = unique(dt$id), date = seq_dates)`, then join it against your keyed table: `dt[CJ(...)]`. Set the key first with `setkey(dt, id, date)`. Combinations present in the data keep their values, and missing combinations appear as new rows with `NA`, which you can then fill with zero or carry forward.

**Does CJ remove duplicate values?**

Not by default. `CJ()` has a `unique` argument that defaults to `FALSE`, so duplicate values in an input vector produce duplicate rows. Pass `unique = TRUE` to apply `unique()` to every input before crossing. If only some inputs have duplicates, you can instead wrap those specific vectors in `unique()` yourself.

**How large can a CJ result get?**

A `CJ()` result has exactly `prod(lengths(inputs))` rows, so it grows multiplicatively. Crossing two vectors of length 1,000 gives a million rows, and a third vector of length 100 makes it 100 million. Always estimate the size with `prod()` before crossing large vectors, since a too-large grid can exhaust memory.

For the official argument reference, see the [data.table CJ documentation](https://rdatatable.gitlab.io/data.table/reference/J.html).
</content>
</invoke>
