---
title: "dplyr inner_join() in R: Keep Only Matched Rows"
slug: "dplyr-inner_join-in-R"
description: "Use dplyr inner_join() to keep only rows that match in both tables in R. Covers inner_join vs left_join, by, multiple keys, NA, and 5 worked examples."
keywords: "dplyr inner_join, R inner join, inner_join vs left_join, dplyr matched rows, inner_join by, R intersect tables"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "inner_join()|dplyr inner_join|inner join|matched rows only|intersect rows"
auto_link_case_sensitive: true
target_keyword: "dplyr inner_join"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr inner_join() in R: Keep Only Matched Rows

<p class="lead">The <code>inner_join()</code> function in dplyr keeps ONLY rows that have matches in BOTH tables, returning the intersection. Unmatched rows from either side are DROPPED.</p>

[QUICK ANSWER]
inner_join(x, y, by = "id")              # only matched rows
inner_join(x, y, by = c("id","date"))    # multi-column key
inner_join(x, y, by = c("id" = "uid"))   # mapped key
inner_join(x, y, by = join_by(id))       # tidy syntax
left_join(x, y, by = "id")                # different: keep all x
semi_join(x, y, by = "id")                # filter only, no y columns

[DECISION TREE: Is inner_join() the right tool?]
- keep ONLY matched rows from both: inner_join()
- keep ALL rows from left: left_join()
- keep ALL rows from right: right_join()
- keep ALL rows from BOTH: full_join()
- filter without adding columns: semi_join() (cleaner)
- filter to NON-matches: anti_join()
- combine without key: bind_cols()

## What inner_join() does in one sentence

**`inner_join(x, y, by)` returns rows where the `by` key appears in BOTH x and y, with columns from both sides combined.** Unmatched rows from either table are dropped.

It is the strictest of the mutating joins: rows survive only if they have a partner. Useful when you only care about complete records.

## Syntax

**`inner_join(x, y, by = NULL, suffix = c(".x", ".y"))`. Same arguments as left_join.**

```r title="Only customers with orders"
library(dplyr)

customers <- data.frame(id = 1:4, name = c("a","b","c","d"))
orders    <- data.frame(id = c(1, 1, 3, 5), amount = c(10, 20, 30, 40))

inner_join(customers, orders, by = "id")
#>   id name amount
#> 1  1    a     10
#> 2  1    a     20
#> 3  3    c     30
#> (customer 2, 4 dropped: no orders; order 5 dropped: no customer)
```

[TIP]
**Use `inner_join` when you only want to analyze records that have data in BOTH tables.** It is the cleanest way to express "I need a match" without filtering after a left_join.

## Five common patterns

### 1. Standard inner join

```r title="Match by id"
inner_join(customers, orders, by = "id")
```

Drops customers with no orders AND orders with no customer.

### 2. Multi-column key

```r title="Match by composite key"
sales   <- data.frame(region=c("NA","EU","AS"), product=c("X","Y","X"), qty=c(100,200,50))
catalog <- data.frame(region=c("NA","EU"), product=c("X","Z"), price=c(10, 20))

inner_join(sales, catalog, by = c("region","product"))
#>   region product qty price
#> 1     NA       X 100    10
#> (EU/Y dropped: not in catalog; EU/Z and AS/X dropped: not in sales)
```

### 3. Different column names

```r title="Map keys"
inner_join(customers, orders, by = c("id" = "user_id"))
```

### 4. Self-inner-join

```r title="Customers who placed multiple orders"
inner_join(orders, orders, by = "id", suffix = c("_a","_b")) |>
  filter(amount_a < amount_b) |>
  distinct(id)
```

Self-join with filter to find pairs.

### 5. Chained inner joins

```r title="Triple-table intersection"
sales |>
  inner_join(products, by = "product_id") |>
  inner_join(regions,  by = "region_id")
```

Each step drops unmatched rows from the prior result.

[KEY INSIGHT]
**`inner_join` is the SAFEST join for downstream analysis.** No NAs introduced by missing matches. The trade-off: rows you forgot existed (without partners) silently disappear. Always check `nrow(result)` after an inner_join to make sure the drop count matches your expectation.

## inner_join() vs left_join() vs semi_join() vs filter

**Four ways to combine "match against y" semantics in dplyr.**

| Approach | Keeps | Adds y columns? |
|---|---|---|
| `inner_join(x, y)` | x rows that match y | Yes |
| `left_join(x, y)` | All x rows | Yes (NA where no match) |
| `semi_join(x, y)` | x rows that match y | No |
| `filter(x %in% y)` | x rows where col is in y | No |

When to use which:

- `inner_join` for "match AND augment".
- `semi_join` for "match WITHOUT augmenting" (filter only).
- `left_join` for "augment, keep unmatched as NA".
- `filter(... %in% ...)` for simple membership tests.

## A practical workflow

**The "complete cases only" pattern is inner_join's signature use case.**

```r title="Complete cases via chained inner_join"
results <- experiments |>
  inner_join(metadata, by = "experiment_id") |>
  inner_join(outcomes, by = "experiment_id")
```

Only experiments with both metadata and outcomes survive. NAs are impossible (assuming each table has no internal NAs).

For an outer report (showing what was DROPPED):

```r title="Audit unmatched rows"
unmatched <- experiments |>
  anti_join(metadata, by = "experiment_id")
```

Reports experiments without metadata; useful for data-quality auditing.

## Common pitfalls

**Pitfall 1: silent row drops.** inner_join silently removes rows without a match. Always check `nrow(result)` against expectations, especially in production pipelines.

**Pitfall 2: row multiplication.** If both tables have duplicate keys, inner_join multiplies rows (cartesian product per key). Use `relationship = "one-to-one"` or `"many-to-one"` to error instead.

[WARNING]
**`inner_join` is NOT the same as `left_join + filter(!is.na(y_col))`.** They look similar but the filter approach is slower and may drop rows that legitimately had NA in y_col before the join.

## Try it yourself

**Try it:** Find cars in `mtcars` with cyl values present in a lookup table `cyl_info`. Save to `ex_match`.

```r title="Your turn: keep only matched cyl values"
cyl_info <- data.frame(cyl = c(4, 8), label = c("eco","power"))

ex_match <- mtcars |>
  # your code here

nrow(ex_match)
#> Expected: 25 (cyl=6 dropped, only 4 and 8 in lookup)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_match <- mtcars |>
  inner_join(cyl_info, by = "cyl")

nrow(ex_match)
#> [1] 25  (11 cyl=4 + 14 cyl=8; 7 cyl=6 dropped)
```

**Explanation:** inner_join drops cars whose cyl is not in cyl_info (cyl=6) and adds the label column.

</details>

## Related dplyr functions

After mastering inner_join, look at:

- `left_join()` / `right_join()` / `full_join()`: other mutating joins
- `semi_join()`: same row-filtering as inner_join, no extra columns
- `anti_join()`: opposite of semi_join
- `join_by()`: dplyr 1.1+ key spec; supports inequality
- `intersect()`: set intersection on whole rows
- `data.table::merge()`: very fast for big data

For very large data, the data.table package's joins are typically much faster.

## FAQ

**What does inner_join do in dplyr?**

`inner_join(x, y, by)` returns rows where the `by` key matches in both x and y, with columns from both. Unmatched rows from either side are dropped.

**What is the difference between inner_join and left_join?**

inner_join keeps only rows that match in BOTH tables. left_join keeps ALL rows of x, putting NA in y's columns where no match. inner may return fewer rows; left always has at least as many as x.

**What is the difference between inner_join and semi_join?**

inner_join adds y's columns; semi_join does not. Use semi_join when you only need to filter, not augment.

**How do I do a many-to-many inner join?**

Pass `relationship = "many-to-many"` to suppress the warning. Result is the cartesian product per key.

**Why did my inner_join return fewer rows than expected?**

Because some rows in one table had keys that didn't appear in the other. Use `anti_join(x, y)` to inspect which rows of x were dropped.
