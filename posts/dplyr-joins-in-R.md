---
title: "dplyr Joins in R: left_join, inner_join, full_join"
slug: "dplyr-joins-in-R"
description: "Master dplyr joins in R: left_join, inner_join, right_join, full_join, semi_join, anti_join. Covers join keys, suffix conflicts, NA matching, examples."
keywords: "dplyr joins, left_join in R, inner_join R, full_join, semi_join, anti_join, R merge data frames, dplyr join_by"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "left_join()|inner_join()|full_join()|dplyr joins|join data frames"
auto_link_case_sensitive: true
target_keyword: "dplyr joins"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr Joins in R: left_join, inner_join, full_join

<p class="lead">dplyr joins combine two data frames on one or more matching key columns. Use <code>left_join()</code> to keep all rows of the first; <code>inner_join()</code> to keep only matched rows; <code>full_join()</code> to keep everything; <code>semi_join()</code> and <code>anti_join()</code> as filtering joins.</p>

[QUICK ANSWER]
left_join(x, y, by = "id")              # keep all rows of x
right_join(x, y, by = "id")             # keep all rows of y
inner_join(x, y, by = "id")             # keep only matched rows
full_join(x, y, by = "id")              # keep all from both
semi_join(x, y, by = "id")              # x rows that match (no y cols)
anti_join(x, y, by = "id")              # x rows with NO match
left_join(x, y, by = c("id", "date"))   # multi-column join

[DECISION TREE: Which join do I need?]
- keep all of x: left_join(x, y, by = "id")
- keep all of y: right_join(x, y, by = "id")
- keep only matches: inner_join(x, y, by = "id")
- keep all from both: full_join(x, y, by = "id")
- filter x by membership: semi_join(x, y, by = "id")
- filter x by non-membership: anti_join(x, y, by = "id")
- match on multiple cols: left_join(x, y, by = c("a","b"))
- match on different col names: left_join(x, y, by = c("xid"="yid"))

## What dplyr joins do in one sentence

**A dplyr join combines two data frames by matching values in one or more key columns.** The six join verbs differ in WHICH rows they keep: `left_join()` keeps all rows of the first table, `right_join()` keeps all of the second, `inner_join()` keeps only rows present in both, `full_join()` keeps everything, and `semi_join()`/`anti_join()` are filtering joins that return only rows from the first table without adding columns from the second.

Unlike base R's `merge()`, dplyr joins make the join type explicit in the function name, never accidentally turn factors into characters, and integrate cleanly into pipelines.

## Syntax

**Every join takes two data frames `x` and `y` plus a `by` argument that names the matching keys.** If columns share the same name in both tables, dplyr can auto-detect them, but always passing `by` explicitly is clearer.

```r title="Set up two small data frames to join"
library(dplyr)

bands <- tibble(
  band   = c("Beatles","Beatles","Stones","Stones","Queen"),
  name   = c("John","Paul","Mick","Keith","Freddie")
)

instruments <- tibble(
  name        = c("John","Paul","Mick","Keith","Brian"),
  instrument  = c("guitar","bass","vocals","guitar","guitar")
)
```

The full signature for `left_join()` (others are similar):

```
left_join(x, y, by = NULL, copy = FALSE, suffix = c(".x", ".y"),
          ..., keep = FALSE, na_matches = "na", multiple = "all",
          unmatched = "drop", relationship = NULL)
```

Most useful arguments: `by` for keys, `suffix` for resolving column-name conflicts, `relationship` for asserting one-to-one or many-to-one expectations.

[TIP]
**Always pass `by` explicitly, even when keys share names.** `left_join(x, y, by = "id")` is more readable than `left_join(x, y)`. The latter prints "Joining with `by = join_by(id)`" warnings that clutter logs and miss when the auto-detected keys are wrong.

## Seven common patterns

### 1. left_join: keep all rows of x

```r title="Add instruments to band members"
bands |>
  left_join(instruments, by = "name")
#> # A tibble: 5 x 3
#>   band    name    instrument
#>   <chr>   <chr>   <chr>
#> 1 Beatles John    guitar
#> 2 Beatles Paul    bass
#> 3 Stones  Mick    vocals
#> 4 Stones  Keith   guitar
#> 5 Queen   Freddie NA
```

Freddie has no instrument in the second table, so `instrument` is NA. left_join keeps every row of the left table regardless of match.

### 2. inner_join: only matched rows

```r title="Only band members with a known instrument"
bands |>
  inner_join(instruments, by = "name")
#> # A tibble: 4 x 3
#>   band    name  instrument
#>   <chr>   <chr> <chr>
#> 1 Beatles John  guitar
#> 2 Beatles Paul  bass
#> 3 Stones  Mick  vocals
#> 4 Stones  Keith guitar
```

Freddie is dropped because he is not in the second table. Brian is dropped because he is not in the first.

### 3. full_join: keep all rows from both

```r title="Combine everything"
bands |>
  full_join(instruments, by = "name")
#> # A tibble: 6 x 3
#>   band    name    instrument
#>   <chr>   <chr>   <chr>
#> 1 Beatles John    guitar
#> 2 Beatles Paul    bass
#> 3 Stones  Mick    vocals
#> 4 Stones  Keith   guitar
#> 5 Queen   Freddie NA
#> 6 NA      Brian   guitar
```

Brian appears with `band = NA` because he is not in the first table. Freddie has `instrument = NA` because he is not in the second.

### 4. semi_join: filter, do not add columns

```r title="Band members who have a known instrument (filter only)"
bands |>
  semi_join(instruments, by = "name")
#> # A tibble: 4 x 2
#>   band    name
#>   <chr>   <chr>
#> 1 Beatles John
#> 2 Beatles Paul
#> 3 Stones  Mick
#> 4 Stones  Keith
```

`semi_join()` returns rows of `x` that match in `y`, but does NOT bring over columns from `y`. Use it as a presence filter.

### 5. anti_join: rows in x with NO match in y

```r title="Band members missing from instruments table"
bands |>
  anti_join(instruments, by = "name")
#> # A tibble: 1 x 2
#>   band  name
#>   <chr> <chr>
#> 1 Queen Freddie
```

`anti_join()` is the natural way to find "rows in x that are missing in y". Useful for reconciliation and validation.

### 6. Joining on multiple columns

```r title="Join on two keys at once"
sales <- tibble(
  region = c("US","US","EU","EU"),
  product = c("A","B","A","B"),
  units = c(100, 80, 60, 50)
)

prices <- tibble(
  region = c("US","US","EU","EU"),
  product = c("A","B","A","B"),
  price = c(10, 12, 9, 11)
)

sales |>
  left_join(prices, by = c("region", "product"))
#> # A tibble: 4 x 4
#>   region product units price
#>   <chr>  <chr>   <dbl> <dbl>
#> 1 US     A         100    10
#> 2 US     B          80    12
#> 3 EU     A          60     9
#> 4 EU     B          50    11
```

Pass a character vector to `by` to match on multiple columns. Both keys must match for a row to join.

### 7. Joining when key columns have different names

```r title="When the join column names differ"
left_table <- tibble(customer_id = 1:3, name = c("A","B","C"))
right_table <- tibble(cust_id = 1:3, balance = c(100, 200, 300))

left_table |>
  left_join(right_table, by = c("customer_id" = "cust_id"))
#> # A tibble: 3 x 3
#>   customer_id name  balance
#>         <int> <chr>   <dbl>
#> 1           1 A         100
#> 2           2 B         200
#> 3           3 C         300
```

Pass a named vector: `c("name_in_x" = "name_in_y")`. The result keeps only the left table's name for the joined column.

[KEY INSIGHT]
**The "left/right/inner/full" terminology comes from SQL, where it describes which side of the JOIN keyword keeps unmatched rows.** Mentally: x is "left", y is "right". `left_join` keeps all left, `right_join` keeps all right, `inner_join` keeps only the intersection, `full_join` keeps everything. `semi_join` and `anti_join` have no SQL one-word equivalent; they are filtering joins, returning only x's columns.

## dplyr joins vs base R merge()

**Base R has one `merge()` function with `all.x`, `all.y`, `all` arguments to select join type. dplyr uses six explicit verbs.** Explicit beats positional: `left_join(x, y)` is clearer than `merge(x, y, all.x = TRUE)`.

| Task | dplyr | Base R |
|---|---|---|
| Left join | `left_join(x, y, by = "id")` | `merge(x, y, by = "id", all.x = TRUE)` |
| Inner join | `inner_join(x, y, by = "id")` | `merge(x, y, by = "id")` |
| Full join | `full_join(x, y, by = "id")` | `merge(x, y, by = "id", all = TRUE)` |
| Semi join | `semi_join(x, y, by = "id")` | `x[x$id %in% y$id, ]` |
| Anti join | `anti_join(x, y, by = "id")` | `x[!x$id %in% y$id, ]` |
| Different key names | `left_join(x, y, by = c("xid"="yid"))` | `merge(x, y, by.x="xid", by.y="yid", all.x=TRUE)` |

When to use which:

- Use dplyr joins inside any pipeline.
- Use base `merge()` only when you want zero package dependencies.

## Common pitfalls

**Pitfall 1: row duplication from many-to-many joins.** If both `x` and `y` have multiple matches for a key, the result is the cross product. `left_join(x, y)` where x has 100 rows for id=1 and y has 5 rows for id=1 returns 500 rows for id=1. If you do not expect this, set `relationship = "one-to-many"` and dplyr will error if your assumption is violated.

**Pitfall 2: column name conflicts get suffix.x and suffix.y.** If both tables have a column named "value" (besides the key), the result has "value.x" and "value.y". To control naming, pass `suffix = c("_left", "_right")` or rename one table's column before joining.

[WARNING]
**NA in key columns: dplyr matches NA to NA by default.** Two rows with `id = NA` in different tables WILL join. This is `na_matches = "na"` (the default). To treat NAs as non-matching (SQL convention), set `na_matches = "never"`. For most data this default is fine; for SQL-style strict behavior, override.

**Pitfall 3: forgetting to dedupe before joining.** If `x` has duplicate keys you did not expect, the join silently produces duplicates. Always inspect `x |> count(key) |> filter(n > 1)` before a join if you suspect duplication. Or use `relationship = "one-to-one"` to assert and fail loudly.

## Related dplyr functions

After mastering dplyr joins, look at:

- `bind_rows()`, `bind_cols()`: stack tables vertically or horizontally without keys
- `cross_join()`: explicit cross product (Cartesian)
- `nest_join()`: each x row gets a list-column of matching y rows
- `join_by()`: rich syntax for inequality joins, rolling joins, and overlap joins (dplyr 1.1+)
- `setdiff()`, `union()`, `intersect()`: set operations on whole rows

For very large data, also check `data.table` joins (`X[Y, on = "id"]` syntax), often faster.

## FAQ

**What is the difference between left_join and inner_join in dplyr?**

`left_join(x, y)` keeps every row of `x`, filling NA where there is no match in `y`. `inner_join(x, y)` keeps only rows that match in both. Use left_join when x is your primary table and you want to enrich it with optional info from y. Use inner_join when you want only fully-matched records.

**How do I join two data frames in R with dplyr?**

Pick a join function based on which rows you want to keep, then call it with `by = "key_column"`: `left_join(x, y, by = "id")`. For multi-column keys, pass a character vector: `by = c("a", "b")`. For different column names: `by = c("x_col" = "y_col")`.

**What is the difference between semi_join and inner_join?**

`inner_join(x, y)` returns matched rows AND brings over columns from y. `semi_join(x, y)` returns the same rows but does NOT bring y's columns. Use semi_join when you only need to filter x by membership in y, not to add y's data.

**How do I do a full outer join in dplyr?**

Use `full_join(x, y, by = "id")`. Every row from both tables appears; unmatched cells become NA. This is the equivalent of SQL `FULL OUTER JOIN`.

**Why do I have duplicate rows after a dplyr join?**

The join key has multiple matches in one or both tables. The result is the cross product of matches. To diagnose: `x |> count(key) |> filter(n > 1)` and same for y. To prevent: deduplicate before joining or use `distinct()`. To assert: pass `relationship = "one-to-many"` (dplyr 1.1+) and dplyr errors if your assumption is wrong.
