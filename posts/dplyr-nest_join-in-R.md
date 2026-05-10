---
title: "dplyr nest_join() in R: Right Matches as List Column"
slug: "dplyr-nest_join-in-R"
description: "Use dplyr nest_join() to join two tables where the right's matches are stored as a list column on the left in R. Covers vs left_join, unnest, 5 examples."
keywords: "dplyr nest_join, R nested join, nest_join vs left_join, dplyr list column join, nest_join unnest, R hierarchical merge"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "nest_join()|dplyr nest_join|nested join|list column join|nest_join vs left_join"
auto_link_case_sensitive: true
target_keyword: "dplyr nest_join"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# dplyr nest_join() in R: Join With Right Stored as List Column

<p class="lead">The <code>nest_join()</code> function in dplyr joins two tables where each matched group from the RIGHT is stored as a NESTED data frame inside a list column. Each row of x ends up with a list-column of all matching y rows.</p>

[QUICK ANSWER]
nest_join(x, y, by = "id")              # right matches as list column
nest_join(x, y, by = "id", name = "data") # custom column name
left_join(x, y, by = "id")               # different: rows multiply
inner_join(x, y, by = "id")              # different: only matched rows
df |> nest_join(...) |> tidyr::unnest(y) # back to flat form

[DECISION TREE: Is nest_join() the right tool?]
- keep one row per left, with right matches as a list column: nest_join()
- flatten matches into multiple rows: left_join() or inner_join()
- many-models pipeline (model per row): nest_join() + map
- group-and-summarise downstream: nest_join() lets you keep raw matches
- simple lookup: left_join() is cleaner

## What nest_join() does in one sentence

**`nest_join(x, y, by)` returns a copy of x with ONE additional list column where each row holds a tibble of all matching rows from y.** Unlike left_join, the row count of x is preserved; matching y rows are bundled instead of duplicated.

This is the "nested" filter+merge pattern. Useful when you want each x row to keep ALL its y matches in one place for downstream per-row computation.

## Syntax

**`nest_join(x, y, by = NULL, keep = FALSE, name = NULL)`. `name` is the new list-column's name (defaults to the y data frame's deparsed name).**

```r title="Each customer with all their orders nested"
library(dplyr)

library(purrr)
library(tibble)
library(tidyr)
customers <- data.frame(id = 1:3, name = c("a","b","c"))
orders    <- data.frame(id = c(1, 1, 3, 5), amount = c(10, 20, 30, 40))

nest_join(customers, orders, by = "id")
#>   id name             orders
#> 1  1    a tibble [2 x 1]   <-- amounts 10, 20
#> 2  2    b tibble [0 x 1]   <-- empty (no orders)
#> 3  3    c tibble [1 x 1]   <-- amount 30
```

Customer 2 has an empty tibble (no orders). The new column is named after the y argument.

[TIP]
**`nest_join()` preserves x's row count exactly (one nested cell per row).** This is the key difference from left_join, which multiplies rows when y has multiple matches.

## Five common patterns

### 1. Standard nest_join

```r title="Each customer + their orders"
nest_join(customers, orders, by = "id")
```

### 2. Custom column name

```r title="Rename the nested column"
nest_join(customers, orders, by = "id", name = "all_orders")
#> # ... new column "all_orders" instead of "orders"
```

### 3. Inspect a single row's nested data

```r title="Look at one customer's orders"
nested <- nest_join(customers, orders, by = "id")
nested$orders[[1]]
#>   amount
#> 1     10
#> 2     20
```

The list column is accessed with `[[i]]` (each cell is a tibble).

### 4. Combine with map for many-models or per-row analysis

```r title="Compute total amount per customer"
nest_join(customers, orders, by = "id") |>
  mutate(total = purrr::map_dbl(orders, ~ sum(.x$amount)))
#>   id name             orders total
#> 1  1    a tibble [2 x 1]    30
#> 2  2    b tibble [0 x 1]     0
#> 3  3    c tibble [1 x 1]    30
```

`purrr::map_dbl` over the list column gives per-row aggregation without losing the raw rows.

### 5. Unnest back to flat form

```r title="Convert back to long form"
nested <- nest_join(customers, orders, by = "id")

flat <- nested |>
  tidyr::unnest(orders, keep_empty = TRUE)
#> Same as left_join(customers, orders, by = "id")
```

`unnest` reverses nest_join.

[KEY INSIGHT]
**`nest_join()` is the dplyr way to express "for each x row, give me ALL its y matches as a sub-table".** This is the "many-models" / "per-customer summary" pattern made first-class. left_join multiplies rows; nest_join keeps them and stores matches as a list column.

## nest_join() vs left_join() vs group_by() + nest()

**Three approaches to "x with its y matches" in dplyr.**

| Approach | Result shape | Best for |
|---|---|---|
| `nest_join(x, y)` | x's row count, list column from y | Direct nested lookup |
| `left_join(x, y)` | Possibly multiplied rows | Flat output |
| `left_join + group_by(x_id) + nest()` | Same as nest_join | More verbose; equivalent |

When to use which:

- `nest_join` for direct "x with nested y matches".
- `left_join` for flat output with one row per match.
- `group_by + nest` if you need additional aggregation before nesting.

## A practical workflow

**Use nest_join when each x row needs to do per-row computation on ALL its y matches.**

```r title="Per-customer order summary via nest_join"
customers |>
  nest_join(orders, by = "id") |>
  mutate(
    n_orders   = purrr::map_int(orders, nrow),
    total_amt  = purrr::map_dbl(orders, ~ sum(.x$amount, na.rm = TRUE)),
    avg_amt    = purrr::map_dbl(orders, ~ mean(.x$amount, na.rm = TRUE))
  )
```

Per customer, compute order count, total, and average from the nested tibble. Without nest_join you'd group_by + summarise, then join back; nest_join compresses the workflow.

## Common pitfalls

**Pitfall 1: empty tibble for unmatched rows.** Customers without orders get a 0-row tibble (not NA). Map functions need to handle empty input gracefully.

**Pitfall 2: assuming nest_join is a JSON-like nested join.** It is not: each cell is a TIBBLE (data frame), not a list of fields. Access with `[[i]]` or `purrr::map`.

[WARNING]
**`nest_join` is more memory-intensive than left_join because each cell holds a tibble.** For very large data, the overhead matters. Profile before using on >1M rows.

## Try it yourself

**Try it:** For each car name in `mtcars`, attach a nested tibble of all cars sharing the same `cyl` value (a "siblings" list). Save to `ex_nested`.

```r title="Your turn: nest siblings by cyl"
mtcars_named <- mtcars |> tibble::rownames_to_column("car")

ex_nested <- mtcars_named |>
  # your code here

ex_nested$siblings[[1]]
#> Expected: tibble of all cars with the same cyl as row 1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_nested <- mtcars_named |>
  nest_join(mtcars_named, by = "cyl", name = "siblings")

# Look at the first car's siblings:
nrow(ex_nested$siblings[[1]])
#> [1] 7 (Mazda RX4 has cyl=6; 7 cars share that)
```

**Explanation:** Self-nest_join by cyl. Each car's "siblings" cell is a tibble of all cars (including itself) with the same cyl.

</details>

## Related dplyr / tidyr functions

After mastering nest_join, look at:

- `left_join()`: flat alternative
- `tidyr::nest()`: pure nesting on grouped data
- `tidyr::unnest()`: flatten list columns
- `purrr::map()`: per-row computation on nested cells
- `dplyr::group_by()` + `summarise()`: alternative aggregation pattern
- `tibble::tribble()`: build nested tibbles by hand

For tidymodels / many-models workflows, `tidyr::nest()` followed by `mutate(model = map(data, ~ lm(y ~ x, .)))` is the canonical pattern.

## FAQ

**What does nest_join do in dplyr?**

`nest_join(x, y, by)` adds a list column to x where each cell is a tibble of all matching rows from y. x's row count is preserved.

**What is the difference between nest_join and left_join?**

left_join multiplies x's rows when y has multiple matches. nest_join keeps x's row count and stores y's matches as a list column. Same data, different shape.

**How do I unnest the result of nest_join?**

`tidyr::unnest(result, name_of_list_col)` flattens the nested column. Equivalent to left_join (with keep_empty option for unmatched rows).

**Why does my unmatched row have a 0-row tibble?**

Because nest_join keeps x's row but no y rows match. The cell is an empty tibble, not NA. `purrr::map(orders, nrow)` returns 0 for those rows.

**When should I use nest_join over left_join?**

When each x row needs per-row computation on ALL its y matches (counting, summing, fitting a model). nest_join keeps the raw y rows with the x row instead of separating them.
