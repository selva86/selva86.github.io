---
title: "dplyr full_join() in R: Keep All Rows From Both Tables"
slug: "dplyr-full_join-in-R"
description: "Use dplyr full_join() to keep all rows from both tables, filling unmatched with NA in R. Covers full_join vs left/right/inner_join, by, NA, 5 examples."
keywords: "dplyr full_join, R full outer join, full_join vs left_join, dplyr keep all rows, full join NA, R outer join"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "full_join()|dplyr full_join|full outer join|full_join vs left_join|keep all rows"
auto_link_case_sensitive: true
target_keyword: "dplyr full_join"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr full_join() in R: Keep All Rows From Both Tables

<p class="lead">The <code>full_join()</code> function in dplyr keeps EVERY row from BOTH tables, filling unmatched rows with <code>NA</code>. It is the outer join: nothing is dropped.</p>

[QUICK ANSWER]
full_join(x, y, by = "id")              # all rows from both
full_join(x, y, by = c("id","date"))    # multi-key
left_join(x, y, by = "id")               # keep only x's rows
inner_join(x, y, by = "id")              # only matched
full_join(x, y, by = join_by(id))        # tidy syntax
bind_rows(x, y)                          # different: stack vertically

[DECISION TREE: Is full_join() the right tool?]
- keep ALL rows from BOTH tables: full_join()
- keep ALL from x: left_join()
- keep ALL from y: right_join() (or flip + left_join)
- keep ONLY matched: inner_join()
- combine same-shape tables vertically: bind_rows()
- diff-detection (in x but not y): anti_join()

## What full_join() does in one sentence

**`full_join(x, y, by)` returns a data frame containing every row from both x and y, with columns from both sides; rows present in only one table get NA in the other side's columns.** Nothing is silently dropped.

This is the outer join. Use it when missing matches are themselves the answer (e.g., reconciling two source systems).

## Syntax

**`full_join(x, y, by = NULL, suffix = c(".x", ".y"))`. Same arguments as left_join.**

```r title="All customers and all orders, even unmatched"
library(dplyr)

customers <- data.frame(id = 1:3, name = c("a","b","c"))
orders    <- data.frame(id = c(1, 1, 4), amount = c(10, 20, 30))

full_join(customers, orders, by = "id")
#>   id name amount
#> 1  1    a     10
#> 2  1    a     20
#> 3  2    b     NA
#> 4  3    c     NA
#> 5  4 <NA>     30
```

[TIP]
**`full_join` is the right tool for reconciliation tasks: "what rows are in A only, in B only, or in both?".** Combined with `is.na` checks, it lets you classify each row.

## Five common patterns

### 1. Reconciliation between two systems

```r title="Find what each system has"
system_a <- data.frame(id = c(1,2,3), val_a = c("X","Y","Z"))
system_b <- data.frame(id = c(2,3,4), val_b = c("Y2","Z2","W2"))

full_join(system_a, system_b, by = "id") |>
  mutate(
    status = case_when(
      is.na(val_a)             ~ "B-only",
      is.na(val_b)             ~ "A-only",
      val_a != val_b           ~ "diff",
      TRUE                      ~ "match"
    )
  )
#>   id val_a val_b status
#> 1  1     X    NA A-only
#> 2  2     Y    Y2   diff
#> 3  3     Z    Z2   diff
#> 4  4    NA    W2 B-only
```

A classic full_join + classify pattern for reconciliation.

### 2. Multi-key join

```r title="Two-column key full join"
sales_a <- data.frame(year=c(2024,2024,2025), q=c(1,2,1), val=c(100,200,300))
sales_b <- data.frame(year=c(2024,2025,2025), q=c(2,1,2),  val=c(220,310,400))

full_join(sales_a, sales_b, by = c("year","q"), suffix = c("_a","_b"))
```

### 3. Outer join then count missing

```r title="How many rows are in only one side"
result <- full_join(customers, orders, by = "id")

result |>
  summarise(
    only_left  = sum(!is.na(name) & is.na(amount)),
    only_right = sum(is.na(name) & !is.na(amount)),
    matched    = sum(!is.na(name) & !is.na(amount))
  )
```

### 4. Mapped-key full_join

```r title="Keys with different names"
full_join(customers, orders, by = c("id" = "user_id"))
```

### 5. Tidy join_by syntax

```r title="dplyr 1.1+ key spec"
full_join(customers, orders, by = join_by(id))
```

[KEY INSIGHT]
**`full_join` is the only join that NEVER drops a row.** Use it when "row missing on one side" is itself meaningful information. For most analysis pipelines, left_join or inner_join is what you actually want.

## full_join() vs left_join() vs inner_join() vs union

**The mutating-join family.**

| Function | Keeps |
|---|---|
| `full_join(x, y)` | All rows from both; NA for unmatched |
| `left_join(x, y)` | All rows of x |
| `right_join(x, y)` | All rows of y |
| `inner_join(x, y)` | Only matched rows |
| `union(x, y)` | All distinct rows from BOTH (set union, requires same columns) |

When to use which:

- `full_join` for reconciliation / outer joins.
- `left_join` for "augment my main table".
- `inner_join` for "complete records only".
- `union` for set-style row union (same shape).

## A practical workflow

**The "data reconciliation" pattern is full_join's signature use case.**

```r title="Inventory reconciliation"
inventory_reported  |>
  full_join(inventory_actual, by = "sku", suffix = c("_reported","_actual")) |>
  mutate(
    diff = qty_actual - qty_reported,
    status = case_when(
      is.na(qty_reported) ~ "untracked SKU",
      is.na(qty_actual)   ~ "missing physical",
      diff != 0           ~ "discrepancy",
      TRUE                 ~ "OK"
    )
  )
```

Compare reported and actual inventory; classify each SKU. Without full_join you'd miss SKUs present in only one source.

## Common pitfalls

**Pitfall 1: row count grows.** full_join often returns more rows than either input. Always check `nrow(result)` against expectations.

**Pitfall 2: NAs everywhere.** Unmatched rows have NA in the OTHER side's columns. Downstream code must handle NA, or use `coalesce(col_a, col_b)` to merge.

[WARNING]
**`full_join` does NOT preserve any natural row order.** The result interleaves matches and unmatched rows in implementation-defined order. Always `arrange()` after if order matters.

## Why full_join is rarely the right default

**full_join is necessary for reconciliation but rarely the right choice for analysis.** When merging fact and dimension tables for analysis, you almost always want left_join or inner_join. Reaching for full_join by default produces an explosion of NAs in your result, which then needs careful handling in every downstream step. Use full_join only when "what's missing from each side" is the question itself. For "augment my main table", left_join is the right tool. For "complete records only", inner_join. For "reconcile two systems", full_join. Train yourself to pick by the question, not by the verb's name.

## Try it yourself

**Try it:** Find which mtcars are also in a separate `featured` lookup table, classifying each as "in mtcars only", "in featured only", or "in both". Save to `ex_status`.

```r title="Your turn: reconcile two car lists"
featured <- data.frame(
  car  = c("Mazda RX4", "Honda Civic", "Tesla Model 3"),
  flag = c(TRUE, TRUE, TRUE)
)

mtcars_named <- mtcars |> tibble::rownames_to_column("car")

ex_status <- mtcars_named |>
  # your code here
  select(car, status)

table(ex_status$status)
#> Expected: counts for each status category
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_status <- mtcars_named |>
  full_join(featured, by = "car") |>
  mutate(status = case_when(
    is.na(mpg)  ~ "featured only",
    is.na(flag) ~ "mtcars only",
    TRUE        ~ "in both"
  )) |>
  select(car, status)

table(ex_status$status)
#> featured only       in both   mtcars only
#>             1             2            30
```

**Explanation:** full_join brings together all 32 mtcars + Tesla (only in featured). case_when classifies each row.

</details>

## Related dplyr functions

After mastering full_join, look at:

- `left_join()` / `right_join()` / `inner_join()`: other mutating joins
- `semi_join()` / `anti_join()`: filtering joins
- `coalesce()`: pick first non-NA across columns (post-full_join cleanup)
- `union()`, `intersect()`, `setdiff()`: set operations on rows
- `bind_rows()`: vertical row stacking
- `merge(x, y, all = TRUE)`: base R equivalent

For post-join NA cleanup, `coalesce(col.x, col.y)` is the cleanest way to merge same-named columns from both sides.

## FAQ

**What does full_join do in dplyr?**

`full_join(x, y, by)` keeps EVERY row from both x and y, with columns from both. Rows present in only one table get NA in the other side's columns.

**What is the difference between full_join and inner_join?**

full_join keeps ALL rows from both. inner_join keeps ONLY matched rows. full_join may include many NAs; inner_join has no NAs from missing matches.

**When should I use full_join?**

For reconciliation tasks (comparing two source systems), or when missing matches are themselves the answer. For most analysis, left_join or inner_join is what you actually want.

**How do I find rows in only one table after full_join?**

Filter by NA in the other table's columns: `filter(is.na(col_from_y))` keeps rows that were in x but not y.

**Does full_join preserve row order?**

No. The result has implementation-defined ordering. Always `arrange()` if you need a specific order.
