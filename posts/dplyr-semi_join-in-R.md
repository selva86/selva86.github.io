---
title: "dplyr semi_join() in R: Filter to Rows With Match in Right"
slug: "dplyr-semi_join-in-R"
description: "Use dplyr semi_join() to keep rows of left that have a match in right WITHOUT adding columns in R. Covers semi_join vs inner_join, anti_join, 5 examples."
keywords: "dplyr semi_join, R semi join, semi_join vs inner_join, dplyr filter by match, semi_join no columns, R join filter"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "semi_join()|dplyr semi_join|filtering join|semi_join vs inner_join|filter by match"
auto_link_case_sensitive: true
target_keyword: "dplyr semi_join"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr semi_join() in R: Filter to Rows With Match in Right

<p class="lead">The <code>semi_join()</code> function in dplyr keeps rows from the left table that have a MATCH in the right table, WITHOUT adding any of right's columns. It is the filtering join: subset by membership.</p>

[QUICK ANSWER]
semi_join(x, y, by = "id")             # x rows that match y
semi_join(x, y, by = c("id","date"))   # multi-key
inner_join(x, y, by = "id")            # different: ALSO adds y's columns
anti_join(x, y, by = "id")             # opposite: x rows that DON'T match
filter(x, id %in% y$id)                # equivalent for one-col key

[DECISION TREE: Is semi_join() the right tool?]
- filter x to rows with match in y, no y columns: semi_join()
- filter x to rows WITHOUT match in y: anti_join()
- filter AND add y columns: inner_join()
- multi-column key membership test: semi_join()
- single-column membership test: filter(x, col %in% y$col)
- check duplicates against another set: anti_join() then inspect

## What semi_join() does in one sentence

**`semi_join(x, y, by)` returns rows of `x` whose `by` key appears at least once in `y`, with NO columns added from y.** It is a filter: same column count as x, possibly fewer rows.

semi_join is used when you want to filter without changing the data shape. inner_join also filters but adds y's columns; semi_join doesn't.

## Syntax

**`semi_join(x, y, by = NULL)`. Same key arguments as inner_join. No `suffix` (no column name conflicts).**

```r title="Customers who placed an order"
library(dplyr)

customers <- data.frame(id = 1:4, name = c("a","b","c","d"))
orders    <- data.frame(id = c(1, 1, 3, 5), amount = c(10, 20, 30, 40))

semi_join(customers, orders, by = "id")
#>   id name
#> 1  1    a
#> 2  3    c
#> (customers 2 and 4 dropped: no orders)
```

[TIP]
**`semi_join` deduplicates the right table for matching purposes.** Customer id 1 has 2 orders, but only one row appears in the result. semi_join is row-CARDINALITY preserving on the left.

## Five common patterns

### 1. Filter by membership

```r title="Customers with at least one order"
semi_join(customers, orders, by = "id")
```

Cleaner than `filter(customers, id %in% unique(orders$id))`.

### 2. Multi-column key

```r title="Sales of products in catalog"
sales   <- data.frame(region=c("NA","EU","AS"), product=c("X","Y","Z"))
catalog <- data.frame(region=c("NA","EU"), product=c("X","Y"))

semi_join(sales, catalog, by = c("region","product"))
#>   region product
#> 1     NA       X
#> 2     EU       Y
#> (AS/Z dropped: not in catalog)
```

### 3. Inverse membership filter

```r title="Customers who DID order: semi_join"
semi_join(customers, orders, by = "id")

# Customers who did NOT order: anti_join
anti_join(customers, orders, by = "id")
```

### 4. Cardinality-preserving (no duplication)

```r title="semi_join doesn't multiply rows"
nrow(semi_join(customers, orders, by = "id"))
#> [1] 2  (customers 1 and 3; not duplicated despite multiple orders)

nrow(inner_join(customers, orders, by = "id"))
#> [1] 3  (rows multiplied by orders)
```

This is the key advantage of semi_join over inner_join for filtering tasks.

### 5. Filter with mapped keys

```r title="Different column names"
semi_join(customers, orders, by = c("id" = "user_id"))
```

[KEY INSIGHT]
**`semi_join` is the ONLY join that filters without ever multiplying rows.** Each row of x appears at most once. inner_join can multiply (each match in y becomes a separate row). Use semi_join when you only care about membership, not the join data itself.

## semi_join() vs inner_join() vs anti_join() vs filter

**Four ways to filter x by relationship to y.**

| Approach | Keeps | Adds y cols | Multiplies rows |
|---|---|---|---|
| `semi_join(x, y)` | x rows that match | No | No |
| `inner_join(x, y)` | x rows that match | Yes | Yes (if y has duplicates) |
| `anti_join(x, y)` | x rows that DON'T match | No | No |
| `filter(x, col %in% y$col)` | Same as semi for 1 col | No | No |

When to use which:

- `semi_join` for clean filter, multi-key, no row duplication.
- `inner_join` when you also want y's columns.
- `anti_join` for the opposite filter.
- `filter(... %in% ...)` for simple single-column tests in scripts.

## A practical workflow

**The "filter to known-good keys" pattern is semi_join's main use case.**

```r title="Filter transactions to approved users"
transactions |>
  semi_join(approved_users, by = "user_id")
```

Keeps only transactions where user_id is in approved_users. No columns added; no row multiplication. Cleaner than `filter(user_id %in% approved_users$user_id)` for multi-column keys.

For data quality:

```r title="Split by membership in master list"
expected_skus  <- skus_master
data_with_skus <- raw_data |> semi_join(expected_skus, by = "sku")
data_unknown   <- raw_data |> anti_join(expected_skus, by = "sku")
```

Split data by membership in a master list.

## Common pitfalls

**Pitfall 1: confusing semi_join with inner_join.** semi_join filters without adding y's columns. inner_join filters AND adds. Pick based on whether you need the y data downstream.

**Pitfall 2: forgetting that semi_join deduplicates the y side automatically.** If y has multiple matching rows per x key, the result is still ONE row per x. inner_join would produce multiple rows.

[WARNING]
**`semi_join` errors if the `by` columns don't exist in both tables.** Same as other joins. Make sure the column names match (or use named `by` for differently-named columns).

## Try it yourself

**Try it:** From `mtcars`, keep only cars with cyl values listed in a separate vector `valid_cyl`. Save to `ex_filtered`.

```r title="Your turn: filter to allowed cyl values"
valid_cyl <- data.frame(cyl = c(4, 6))

ex_filtered <- mtcars |>
  # your code here

nrow(ex_filtered)
#> Expected: 18 (11 cyl=4 + 7 cyl=6; cyl=8 dropped)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_filtered <- mtcars |>
  semi_join(valid_cyl, by = "cyl")

nrow(ex_filtered)
#> [1] 18

# Equivalent for single-column key:
ex_alt <- mtcars |> filter(cyl %in% valid_cyl$cyl)
```

**Explanation:** semi_join keeps rows whose cyl is in valid_cyl. cyl=8 cars are dropped.

</details>

## Related dplyr functions

After mastering semi_join, look at:

- `anti_join()`: opposite filtering join
- `inner_join()`: filter + add columns
- `filter()`: scalar membership tests
- `intersect()`: set intersection on whole rows
- `match()`: base R; index lookups
- `%in%`: base R; one-column membership

For one-column key membership, `filter(x, col %in% y$col)` is shorter and equally clear.

## FAQ

**What does semi_join do in dplyr?**

`semi_join(x, y, by)` keeps rows of x whose `by` key appears in y, WITHOUT adding any of y's columns. It is a filtering join.

**What is the difference between semi_join and inner_join?**

semi_join filters without adding columns. inner_join also filters but ADDS y's columns. semi_join never multiplies rows; inner_join can if y has duplicate keys.

**Why use semi_join instead of filter(... %in% ...)?**

For multi-column keys: `semi_join(x, y, by = c("region","product"))` is clean. `filter(x, region %in% y$region & product %in% y$product)` is wrong (it tests each column independently). semi_join handles tuple membership.

**Does semi_join multiply rows?**

No. semi_join keeps each x row at most once, regardless of how many matches exist in y. inner_join would multiply.

**What is the inverse of semi_join?**

`anti_join(x, y, by)` keeps x rows that do NOT have a match in y. Together they partition x by membership in y.
