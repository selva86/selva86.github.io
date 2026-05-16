---
title: "data.table uniqueN() in R: Count Distinct Values Fast"
slug: "datatable-uniqueN-in-R"
description: "Use data.table uniqueN() in R to count distinct values in a vector, unique rows in a table, or distinct combinations by group, with na.rm and by examples."
keywords: "data.table uniqueN, uniqueN function R, data.table uniqueN examples, count distinct values R, uniqueN by group, uniqueN vs unique, count unique values data.table"
mathjax: false
webr: true
date: "2026-05-16"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "datatable-functions"
fr_parent: "data-table-vs-dplyr.html"
auto_link_terms: "uniqueN()|data.table uniqueN|data.table::uniqueN()|uniqueN|count distinct values"
auto_link_case_sensitive: true
target_keyword: "data.table uniqueN"
sibling_block_enabled: true
difficulty: "Beginner"
---

# data.table uniqueN() in R: Count Distinct Values Fast

<p class="lead">The <code>uniqueN()</code> function from data.table counts the number of distinct values in a vector, or distinct rows in a table, in a single fast pass, returning one integer instead of a list of values.</p>

[QUICK ANSWER]
uniqueN(dt$cyl)                        # distinct values in a column
uniqueN(c(1, 2, 2, NA))                # NA counts as a value
uniqueN(c(1, 2, 2, NA), na.rm = TRUE)  # exclude NA from the count
uniqueN(dt)                            # distinct rows in a table
uniqueN(dt, by = c("a", "b"))          # distinct combinations of columns
dt[, uniqueN(gear), by = cyl]          # distinct count per group
uniqueN(iris$Species)                  # quick cardinality check

[DECISION TREE: Is uniqueN() the right tool?]
- count distinct values fast: uniqueN(dt$col)
- list the distinct values themselves: unique(dt$col)
- keep only the distinct rows of a table: unique(dt)
- count total rows per group: dt[, .N, by = grp]
- frequency of each value: table(dt$col)
- count distinct in dplyr: n_distinct(df$col)

## What uniqueN() does in one sentence

**`uniqueN()` answers "how many different things are here?" with one number.** You hand it a vector, a `data.table`, a `data.frame`, or a list, and it returns the count of distinct values or distinct rows as a single integer. It is the data.table shortcut for the common `length(unique(x))` idiom.

The reason `data.table uniqueN` exists is speed and clarity. Writing `length(unique(x))` builds the full vector of unique values in memory just to measure it, then throws that vector away. `uniqueN()` counts distinctness directly in C without materialising the intermediate vector, which is faster on large columns and reads better inside a `data.table` query. It also accepts a `by` argument and an `na.rm` switch that the base idiom lacks.

## Syntax

**`uniqueN()` takes one object plus two optional controls.** Only the first argument is required; the rest tune how tables and missing values are handled.

```r title="Load data.table and count distinct values"
library(data.table)
dt <- as.data.table(mtcars)

uniqueN(dt$cyl)
#> [1] 3

uniqueN(dt$carb)
#> [1] 6
```

The full signature is `uniqueN(x, by = NULL, na.rm = FALSE)`. Its arguments are:

- `x`: the object to measure. A vector, `data.table`, `data.frame`, or list.
- `by`: when `x` is a table, the columns whose distinct combinations are counted. Defaults to all columns, so `uniqueN(dt)` counts fully distinct rows.
- `na.rm`: `TRUE` drops `NA` before counting, so a missing value is not treated as one of the distinct values.

[TIP]
**Reach for `uniqueN()` instead of `length(unique(x))` everywhere.** It is shorter to read, faster on long vectors, and works inside a `data.table` `j` expression without nesting two function calls. The two return the same integer for a plain vector.

## Counting distinct values: four common patterns

### 1. Distinct values in a single column

**The most common use is column cardinality.** Pass one column and `uniqueN()` returns how many different values it holds.

```r title="Count distinct values in a column"
uniqueN(dt$gear)
#> [1] 3

uniqueN(iris$Species)
#> [1] 3
```

This is the quick check you run before deciding whether a column is a good grouping key or whether a join column is unique enough.

### 2. Distinct rows in a whole table

**Call `uniqueN()` on a table with no `by` and it counts fully distinct rows.** Every column is compared, so two rows count as one only if they match in every field.

```r title="Count distinct rows of a table"
uniqueN(dt)
#> [1] 32
```

All 32 rows of `mtcars` differ somewhere, so the count equals the row total. When duplicates exist, `uniqueN(dt)` is smaller than `nrow(dt)`, and the gap is your duplicate count.

### 3. Distinct combinations with by

**The `by` argument counts unique combinations of chosen columns.** This answers "how many distinct pairs of region and product appear?" without building the pairs yourself.

```r title="Count distinct column combinations"
events <- data.table(
  user = c("a", "a", "b", "b", "b", "c"),
  day  = c(1, 1, 1, 2, 2, 3)
)

uniqueN(events, by = "user")
#> [1] 3

uniqueN(events, by = c("user", "day"))
#> [1] 4
```

There are three users but four distinct user-day pairs, because user `b` appears on two different days.

### 4. Distinct count per group inside a query

**`uniqueN()` shines inside the `j` slot of a `data.table` query.** Combined with `by`, it computes a distinct count for every group in one expression.

```r title="Count distinct values per group"
dt[, .(n_gears = uniqueN(gear)), by = cyl]
#>      cyl n_gears
#>    <num>   <int>
#> 1:     6       3
#> 2:     4       3
#> 3:     8       2
```

Each row reports how many different gear counts appear among cars with that cylinder count. Eight-cylinder cars use only two distinct gear values.

[KEY INSIGHT]
**`uniqueN()` collapses a column to its cardinality, the single number that drives many decisions.** High cardinality means a column behaves like an identifier; low cardinality means it behaves like a category. Knowing that number before you group, join, or plot saves you from grouping on a key that explodes into thousands of tiny groups.

## uniqueN() vs unique(), length(unique()), and n_distinct()

**All four relate to distinctness, but only `uniqueN()` and `n_distinct()` return a count directly.** `unique()` returns the distinct values themselves, and `length(unique())` is the base R idiom that wraps it.

```r title="uniqueN matches length unique"
v <- c(1, 1, 2, 3, 3, 3)

uniqueN(v)
#> [1] 3

length(unique(v))
#> [1] 3
```

| Function | Returns | Counts table rows | NA control |
|---|---|---|---|
| `uniqueN()` | one integer | yes, with `by` | `na.rm` argument |
| `length(unique())` | one integer | only via `nrow()` | manual |
| `unique()` | the distinct values | yes (distinct rows) | no |
| `dplyr::n_distinct()` | one integer | no | `na.rm` argument |

Use `uniqueN()` when you want a count and you are already in data.table. Use `unique()` when you need the values, not their count. Use `n_distinct()` for the same job inside a dplyr pipeline.

[NOTE]
**Coming from dplyr?** The equivalent of `uniqueN(dt$col)` is `n_distinct(df$col)`, and `uniqueN(dt, by = c("a", "b"))` matches `n_distinct(df$a, df$b)`. Both families default to counting `NA` as a value unless you pass `na.rm = TRUE`.

## Common pitfalls

**Pitfall 1: NA counts as a distinct value by default.** A column with `NA` in it counts the missing value as one of its distinct entries unless you ask otherwise.

```r title="NA handling with na.rm"
x <- c(10, 20, 20, NA, 30, NA)

uniqueN(x)
#> [1] 4

uniqueN(x, na.rm = TRUE)
#> [1] 3
```

The first call counts `10`, `20`, `30`, and `NA`. Pass `na.rm = TRUE` when a missing value should not inflate the distinct count.

**Pitfall 2: `uniqueN()` on a table counts rows, not columns.** Passing a whole `data.table` measures distinct rows. If you meant the cardinality of one column, index that column with `dt$col` or `dt[["col"]]`.

**Pitfall 3: `uniqueN()` is a count, `unique()` is the values.** Swapping the two is a frequent mistake. If downstream code expects the actual distinct values, `uniqueN()` hands it a single integer instead and the error surfaces far from its cause.

[WARNING]
**Do not use `uniqueN(dt)` to count distinct values of one column.** With no `by`, it compares every column and counts distinct rows, which is almost always larger than the count you wanted. Always pass the column itself, as in `uniqueN(dt$col)`, or name it in `by`.

## Try it yourself

**Try it:** Using the table below, count the number of distinct `region`/`product` combinations. Save the count to `ex_n`.

```r title="Your turn: count distinct combinations"
# Try it: count distinct region-product pairs
ex_sales <- data.table(
  region  = c("N", "N", "S", "S", "S"),
  product = c("x", "x", "x", "y", "y")
)
ex_n <- # your code here

ex_n
#> Expected: 3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_n <- uniqueN(ex_sales, by = c("region", "product"))
ex_n
#> [1] 3
```

**Explanation:** The `by` argument tells `uniqueN()` to count distinct combinations of the named columns. The pairs are `(N, x)`, `(S, x)`, and `(S, y)`, so the count is 3 even though the table has five rows.

</details>

## Related data.table functions

These functions pair naturally with `uniqueN()` when summarising or deduplicating data:

- `unique()`: returns the distinct values or rows themselves, not their count.
- `.N`: the special symbol for the row count of a group inside a query.
- `duplicated()`: flags which rows or values are repeats.
- `setkey()`: sorts a table by a key, which speeds up grouped `uniqueN()` calls.
- `tabulate()` and `table()`: build a frequency count of each distinct value.

## FAQ

**How do I count unique values in R with data.table?**

Call `uniqueN()` on the column: `uniqueN(dt$col)`. It returns a single integer, the number of distinct values, and runs faster than `length(unique(dt$col))` on large columns. To count distinct rows of a whole table use `uniqueN(dt)`, and to count distinct combinations of selected columns use `uniqueN(dt, by = c("a", "b"))`. All three forms work inside a `data.table` query as well.

**What is the difference between uniqueN and unique in R?**

`unique()` returns the distinct values or rows themselves, so its result is a vector or table. `uniqueN()` returns only how many distinct items there are, as one integer. In effect `uniqueN(x)` equals `length(unique(x))` for a vector, but it computes the count directly without building the intermediate vector, which makes it faster and cleaner to read.

**How do I count distinct values by group in data.table?**

Put `uniqueN()` in the `j` expression and name the grouping column in `by`: `dt[, uniqueN(value_col), by = group_col]`. data.table evaluates `uniqueN()` separately within each group and returns one row per group with its distinct count. You can name the result, as in `dt[, .(n = uniqueN(value_col)), by = group_col]`, for a cleaner output column.

**Does uniqueN count NA as a value?**

Yes, by default. A vector containing `NA` treats the missing value as one of its distinct entries, so `uniqueN(c(1, 2, NA))` returns 3. Pass `na.rm = TRUE` to exclude missing values from the count: `uniqueN(c(1, 2, NA), na.rm = TRUE)` returns 2. This matches the behaviour of `dplyr::n_distinct()`, which also keeps `NA` unless told otherwise.

**Is uniqueN faster than length(unique())?**

For large vectors, yes. `length(unique(x))` first materialises the complete vector of distinct values, then measures its length, allocating memory it immediately discards. `uniqueN()` counts distinct entries in C in a single pass without that intermediate allocation. For small vectors the difference is negligible, but `uniqueN()` is still preferable because it is shorter and reads clearly inside a data.table query.

For the official argument reference, see the [data.table uniqueN documentation](https://rdatatable.gitlab.io/data.table/reference/duplicated.html).
