---
title: "dplyr Joins Exercises in R: 25 Practice Problems"
slug: "dplyr-Joins-Exercises-in-R"
description: "Joins in R exercises: 25 dplyr practice problems on left, right, inner, full, semi, anti, nest, multi-key, inequality and rolling joins. Hidden solutions."
keywords: "joins in R exercises, dplyr joins practice, left_join exercises, inner_join exercises R, join_by exercises, rolling join R"
mathjax: false
webr: true
date: "2026-05-12"
post_type: "EX"
sidebar_title: "dplyr Joins Exercises"
sidebar_order: 121
fr_parent: "dplyr-joins-in-R.html"
auto_link_terms: "dplyr joins exercises|joins in R exercises|left_join exercises|inner_join practice|join_by exercises|rolling join exercises"
auto_link_case_sensitive: false
target_keyword: "joins in R exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# dplyr Joins Exercises in R: 25 Practice Problems

<p class="lead">Twenty-five practice problems on dplyr joins covering mutating joins (left, right, inner, full, nest), filtering joins (semi, anti), multi-key joins, the modern <code>join_by()</code> helper, inequality joins, rolling joins, NA handling, self-joins, and full end-to-end reconciliation workflows. Solutions are hidden behind a click so you can attempt each problem first.</p>

```r title="Run this once before any exercise"
library(dplyr)
library(tibble)
```

```r title="Setup tables shared across the exercises"
customers <- tibble(
  customer_id = c(1L, 2L, 3L, 4L, 5L, 6L),
  name        = c("Alice","Bob","Carol","Dan","Eve","Frank"),
  segment     = c("Pro","Free","Pro","Free","Pro","Free"),
  signup      = as.Date(c("2024-01-15","2024-02-08","2024-03-22",
                          "2024-05-01","2024-06-18","2024-09-04"))
)

orders <- tibble(
  order_id    = 101:110,
  customer_id = c(1L, 2L, 1L, 3L, 7L, 5L, 1L, 4L, 5L, 9L),
  order_date  = as.Date(c("2024-04-02","2024-04-15","2024-05-10",
                          "2024-05-22","2024-06-01","2024-07-04",
                          "2024-08-12","2024-09-09","2024-10-21",
                          "2024-11-30")),
  amount      = c(50, 80, 30, 65, 120, 200, 45, 75, 90, 150)
)

products <- tibble(
  product_id = 1:4,
  product    = c("Widget","Gadget","Sprocket","Gizmo"),
  category   = c("Tools","Tools","Parts","Tools")
)

returns <- tibble(
  order_id = c(101L, 105L, 110L),
  reason   = c("damaged","wrong size","late delivery"),
  refund   = c(50, 120, 150)
)

price_tiers <- tibble(
  min_amount = c(0, 50, 100, 200),
  max_amount = c(50, 100, 200, Inf),
  tier       = c("micro","small","mid","large")
)
```

Note: `orders` deliberately contains two orphan rows (customer_id 7 and 9 do not exist in `customers`). Several exercises rely on those gaps to demonstrate how joins handle unmatched keys.

## Section 1. Mutating joins (5 problems)

### Exercise 1.1: Augment every customer with their order history using left_join

**Task:** A customer success manager wants a single roster showing every customer plus their order history, including customers who never placed an order. Use `left_join()` to attach `orders` to `customers` on the matching `customer_id`, keeping every customer row even when no orders exist. Save the result to `ex_1_1`.

**Expected result:**

```
#> # A tibble: 11 x 7
#>    customer_id name  segment signup     order_id order_date amount
#>          <int> <chr> <chr>   <date>        <int> <date>      <dbl>
#>  1           1 Alice Pro     2024-01-15      101 2024-04-02     50
#>  2           1 Alice Pro     2024-01-15      103 2024-05-10     30
#>  3           1 Alice Pro     2024-01-15      107 2024-08-12     45
#>  4           2 Bob   Free    2024-02-08      102 2024-04-15     80
#>  5           3 Carol Pro     2024-03-22      104 2024-05-22     65
#>  6           4 Dan   Free    2024-05-01      108 2024-09-09     75
#>  7           5 Eve   Pro     2024-06-18      106 2024-07-04    200
#>  8           5 Eve   Pro     2024-06-18      109 2024-10-21     90
#>  9           6 Frank Free    2024-09-04       NA NA             NA
#> # 2 more rows where customer 1 also matches (order 101, 103, 107)
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- customers |>
  left_join(orders, by = "customer_id")
ex_1_1
```

**Explanation:** `left_join()` keeps every row of the LEFT table and pulls matching columns from the RIGHT. When the right side has no match (Frank, customer 6, never ordered), the new columns become `NA`. Use this whenever the left table is the entity you must preserve completely. `inner_join()` would silently drop Frank, which is the most common bug in customer reports.

</details>

### Exercise 1.2: Combine orders and products with inner_join

**Task:** Use `inner_join()` to combine `orders` and `products` so every row carries both the order details and the product details. Add a `product_id` column to `orders` first using `c(1, 2, 1, 3, 4, 1, 2, 3, 4, 1)`, then inner-join on `product_id`. Save the result to `ex_1_2`.

**Expected result:**

```
#> # A tibble: 10 x 7
#>    order_id customer_id order_date amount product_id product  category
#>       <int>       <int> <date>      <dbl>      <dbl> <chr>    <chr>
#>  1      101           1 2024-04-02     50          1 Widget   Tools
#>  2      102           2 2024-04-15     80          2 Gadget   Tools
#>  3      103           1 2024-05-10     30          1 Widget   Tools
#>  4      104           3 2024-05-22     65          3 Sprocket Parts
#>  5      105           7 2024-06-01    120          4 Gizmo    Tools
#>  6      106           5 2024-07-04    200          1 Widget   Tools
#> # 4 more rows
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- orders |>
  mutate(product_id = c(1, 2, 1, 3, 4, 1, 2, 3, 4, 1)) |>
  inner_join(products, by = "product_id")
ex_1_2
```

**Explanation:** `inner_join()` keeps only rows that exist in BOTH tables. Because every assigned `product_id` (1-4) exists in `products`, no rows are dropped here. If you had typed `99` for any order, that row would vanish silently. Use `inner_join()` when the join key represents a foreign-key constraint you trust; switch to `left_join()` when you must preserve every fact-table row regardless of dimension coverage.

</details>

### Exercise 1.3: Reconcile the universe of customer ids with full_join

**Task:** An auditor reconciling two ledgers wants to see every `customer_id` that appears in EITHER `customers` or `orders`, including the orphan ids 7 and 9 in `orders` that never registered as customers. Use `full_join()` to combine both tables and save the unioned result to `ex_1_3`.

**Expected result:**

```
#> # A tibble: 12 x 7
#>    customer_id name  segment signup     order_id order_date amount
#>          <int> <chr> <chr>   <date>        <int> <date>      <dbl>
#>  1           1 Alice Pro     2024-01-15      101 2024-04-02     50
#>  ...
#> 10           6 Frank Free    2024-09-04       NA NA             NA
#> 11           7 NA    NA      NA              105 2024-06-01    120
#> 12           9 NA    NA      NA              110 2024-11-30    150
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- customers |>
  full_join(orders, by = "customer_id")
ex_1_3
```

**Explanation:** `full_join()` returns the union of both keysets; anything missing on a side becomes `NA`. This is the right tool for reconciliation: rows where the LEFT columns are `NA` flag orphan orders (data integrity bugs); rows where the RIGHT columns are `NA` flag dormant customers. An inner_join would mask both signals and a left_join would only catch one of the two.

</details>

### Exercise 1.4: Preserve the orders table with right_join

**Task:** A reporting analyst wants every order enriched with customer metadata, but rows for orphan `customer_id` values 7 and 9 must still appear with `NA` name. Use `right_join()` from `customers` to `orders` so that the right-hand `orders` table is the one preserved in full. Save to `ex_1_4`.

**Expected result:**

```
#> # A tibble: 10 x 7
#>    customer_id name  segment signup     order_id order_date amount
#>          <int> <chr> <chr>   <date>        <int> <date>      <dbl>
#>  1           1 Alice Pro     2024-01-15      101 2024-04-02     50
#>  ...
#>  9           7 NA    NA      NA              105 2024-06-01    120
#> 10           9 NA    NA      NA              110 2024-11-30    150
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_4 <- customers |>
  right_join(orders, by = "customer_id")
ex_1_4
```

**Explanation:** `right_join(x, y)` preserves every row of `y`. It is the mirror of `left_join()`. In real pipelines most people prefer the left form because it reads naturally with the pipe operator: `orders |> left_join(customers, ...)` is the same result with the order of arguments flipped. Pick whichever orientation puts your fact table on the left.

</details>

### Exercise 1.5: Nest each customer's orders into a list-column with nest_join

**Task:** A junior analyst wants every customer row to carry a nested tibble of that customer's orders, instead of duplicating the customer columns across multiple rows. Use `nest_join()` to attach a list-column called `orders` (one tibble per customer) to `customers`. Save the nested table to `ex_1_5`.

**Expected result:**

```
#> # A tibble: 6 x 5
#>   customer_id name  segment signup     orders
#>         <int> <chr> <chr>   <date>     <list>
#> 1           1 Alice Pro     2024-01-15 <tibble [3 x 3]>
#> 2           2 Bob   Free    2024-02-08 <tibble [1 x 3]>
#> 3           3 Carol Pro     2024-03-22 <tibble [1 x 3]>
#> 4           4 Dan   Free    2024-05-01 <tibble [1 x 3]>
#> 5           5 Eve   Pro     2024-06-18 <tibble [2 x 3]>
#> 6           6 Frank Free    2024-09-04 <tibble [0 x 3]>
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_5 <- # your code here
ex_1_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_5 <- customers |>
  nest_join(orders, by = "customer_id")
ex_1_5
```

**Explanation:** `nest_join()` keeps every left-side row exactly once and adds a list-column where each entry is a tibble of matching rows from the right table. This shape is ideal for one-row-per-entity reports or for downstream `purrr::map()` work where you fit a model per customer. Frank gets an empty 0-row tibble rather than `NA`, so subsequent map calls return clean empty results instead of erroring.

</details>

## Section 2. Filtering joins (3 problems)

### Exercise 2.1: Find customers who placed at least one order using semi_join

**Task:** The marketing team is preparing a thank-you email blast and wants the list of customers who have placed AT LEAST one order. Use `semi_join()` to filter `customers` down to those whose `customer_id` appears in `orders`, without bringing in any of the order columns. Save the resulting roster to `ex_2_1`.

**Expected result:**

```
#> # A tibble: 5 x 4
#>   customer_id name  segment signup
#>         <int> <chr> <chr>   <date>
#> 1           1 Alice Pro     2024-01-15
#> 2           2 Bob   Free    2024-02-08
#> 3           3 Carol Pro     2024-03-22
#> 4           4 Dan   Free    2024-05-01
#> 5           5 Eve   Pro     2024-06-18
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- customers |>
  semi_join(orders, by = "customer_id")
ex_2_1
```

**Explanation:** `semi_join()` is a filtering join: it keeps only rows of the left table that match in the right and never adds new columns. It is the dplyr equivalent of `customers |> filter(customer_id %in% orders$customer_id)` but is faster on large tables and reads better with multi-column keys. Frank, who never ordered, is correctly excluded.

</details>

### Exercise 2.2: Detect orphan orders with anti_join

**Task:** The data team is hunting orphan records where an order references a `customer_id` that does not exist in `customers`. Use `anti_join()` to return only the orders whose `customer_id` is NOT in the customers table. Save the offending rows to `ex_2_2` so the team can file a data-quality ticket.

**Expected result:**

```
#> # A tibble: 2 x 4
#>   order_id customer_id order_date amount
#>      <int>       <int> <date>      <dbl>
#> 1      105           7 2024-06-01    120
#> 2      110           9 2024-11-30    150
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- orders |>
  anti_join(customers, by = "customer_id")
ex_2_2
```

**Explanation:** `anti_join()` is the inverse of `semi_join()`: it keeps only rows with NO match. This is the canonical pattern for data-quality reports. These two orders point to `customer_id` values that were never created, which signals either a deletion bug, a data-load race, or stale FK references. The fix is to investigate; using `inner_join()` to silently drop them would only hide the problem.

</details>

### Exercise 2.3: Flag dormant customers with anti_join after a date filter

**Task:** A churn analyst wants to flag customers who have NOT placed any order in the last 90 days as of `2024-12-01`. First filter `orders` to those after `2024-09-02`, then use `anti_join()` against the recent set so that only dormant customers remain. Save the dormant roster to `ex_2_3`.

**Expected result:**

```
#> # A tibble: 4 x 4
#>   customer_id name  segment signup
#>         <int> <chr> <chr>   <date>
#> 1           1 Alice Pro     2024-01-15
#> 2           2 Bob   Free    2024-02-08
#> 3           3 Carol Pro     2024-03-22
#> 4           6 Frank Free    2024-09-04
```

**Difficulty:** Advanced

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
recent_orders <- orders |>
  filter(order_date >= as.Date("2024-09-02"))

ex_2_3 <- customers |>
  anti_join(recent_orders, by = "customer_id")
ex_2_3
```

**Explanation:** Combine `filter()` with `anti_join()` to express "in A, not in B-after-filter". This is the canonical churn-flag pattern: define what "active" means in B, then anti-join to get the inactive set. Note that `semi_join()` would give the OPPOSITE result, the active customers. Always state the question to yourself in plain language before choosing semi vs anti, since the two are easy to swap by accident.

</details>

## Section 3. Multi-key joins and renamed columns (4 problems)

### Exercise 3.1: Join two tables whose key columns have different names

**Task:** Joining tables whose key columns have different names is the most common dplyr-joins gotcha. Rename `customers$customer_id` to `id`, then use `inner_join()` with `by = c("customer_id" = "id")` to merge `orders` with the renamed customers table. The result should keep the left side's column name. Save to `ex_3_1`.

**Expected result:**

```
#> # A tibble: 8 x 7
#>   order_id customer_id order_date amount name  segment signup
#>      <int>       <int> <date>      <dbl> <chr> <chr>   <date>
#> 1      101           1 2024-04-02     50 Alice Pro     2024-01-15
#> 2      102           2 2024-04-15     80 Bob   Free    2024-02-08
#> 3      103           1 2024-05-10     30 Alice Pro     2024-01-15
#> 4      104           3 2024-05-22     65 Carol Pro     2024-03-22
#> # 4 more rows; orphan orders 105 and 110 are dropped
```

**Difficulty:** Beginner

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
customers_renamed <- customers |>
  rename(id = customer_id)

ex_3_1 <- orders |>
  inner_join(customers_renamed, by = c("customer_id" = "id"))
ex_3_1
```

**Explanation:** The named vector `c("customer_id" = "id")` reads as "left side's `customer_id` matches right side's `id`". The result keeps the LEFT side's column name. The modern `join_by(customer_id == id)` does the same thing more readably. Either form avoids the noisy alternative of renaming one side first just so the names line up.

</details>

### Exercise 3.2: Join on a composite key of two columns

**Task:** Build two inline tibbles `sales` and `targets` keyed jointly on `(region, quarter)`, then `left_join()` them on BOTH columns at once by passing `by = c("region", "quarter")`. Compute a `gap` column as `actual - target` so the result reads as a variance report. Save to `ex_3_2`.

**Expected result:**

```
#> # A tibble: 6 x 5
#>   region quarter actual target   gap
#>   <chr>  <chr>    <dbl>  <dbl> <dbl>
#> 1 West   Q1         120    100    20
#> 2 West   Q2         140    150   -10
#> 3 East   Q1         200    180    20
#> 4 East   Q2         210    220   -10
#> 5 South  Q1          90    100   -10
#> 6 South  Q2         110    100    10
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
sales <- tibble(
  region  = c("West","West","East","East","South","South"),
  quarter = c("Q1","Q2","Q1","Q2","Q1","Q2"),
  actual  = c(120, 140, 200, 210,  90, 110)
)
targets <- tibble(
  region  = c("West","West","East","East","South","South"),
  quarter = c("Q1","Q2","Q1","Q2","Q1","Q2"),
  target  = c(100, 150, 180, 220, 100, 100)
)

ex_3_2 <- sales |>
  left_join(targets, by = c("region","quarter")) |>
  mutate(gap = actual - target)
ex_3_2
```

**Explanation:** Passing a character vector to `by` joins on every column listed, in the order given. If you forget one and join only on `region`, you get a many-to-many explosion (each region matches all four quarters). dplyr 1.1+ now warns about unintended many-to-many joins; previously this was a silent foot-gun that produced quietly inflated revenue numbers in dashboards.

</details>

### Exercise 3.3: Use the modern join_by helper for the same composite key

**Task:** A reporting analyst prefers the modern `join_by()` syntax over the older string-vector `by`. Re-do the sales-versus-targets join from Exercise 3.2, but this time pass `by = join_by(region, quarter)` to `inner_join()`. Add the same `gap` column and save to `ex_3_3`.

**Expected result:**

```
#> # A tibble: 6 x 5
#>   region quarter actual target   gap
#>   <chr>  <chr>    <dbl>  <dbl> <dbl>
#> 1 West   Q1         120    100    20
#> 2 West   Q2         140    150   -10
#> 3 East   Q1         200    180    20
#> 4 East   Q2         210    220   -10
#> 5 South  Q1          90    100   -10
#> 6 South  Q2         110    100    10
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- sales |>
  inner_join(targets, by = join_by(region, quarter)) |>
  mutate(gap = actual - target)
ex_3_3
```

**Explanation:** `join_by()` (added in dplyr 1.1.0) is the recommended modern form for join keys. It accepts bare column names without quotes, supports inequalities like `>=`, and exposes helpers such as `between()` and `closest()`. For plain equality joins it is a stylistic choice; for non-equi or rolling joins it is the only option. Adopting it everywhere keeps the codebase consistent.

</details>

### Exercise 3.4: Combine an equality with closest() for an SCD-Type-2 lookup

**Task:** A trading desk wants every order joined to the SAME customer's segment AS OF the order date, not the current segment. Build inline `segment_history` (each customer can have multiple historical segment changes with `effective_date`), then use `inner_join()` with `join_by(customer_id, closest(order_date >= effective_date))` so each order picks its segment as of the order date. Save to `ex_3_4`.

**Expected result:**

```
#> # A tibble: 8 x 6
#>   order_id customer_id order_date amount effective_date segment_at
#>      <int>       <int> <date>      <dbl> <date>         <chr>
#> 1      101           1 2024-04-02     50 2024-01-15     Free
#> 2      102           2 2024-04-15     80 2024-02-08     Free
#> 3      103           1 2024-05-10     30 2024-01-15     Free
#> 4      104           3 2024-05-22     65 2024-03-22     Pro
#> 5      106           5 2024-07-04    200 2024-06-18     Free
#> 6      107           1 2024-08-12     45 2024-06-01     Pro
#> 7      108           4 2024-09-09     75 2024-05-01     Free
#> 8      109           5 2024-10-21     90 2024-08-01     Pro
```

**Difficulty:** Advanced

```r title="Your turn"
ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
segment_history <- tibble(
  customer_id    = c(1L, 1L, 2L, 3L, 4L, 5L, 5L),
  effective_date = as.Date(c("2024-01-15","2024-06-01","2024-02-08",
                             "2024-03-22","2024-05-01","2024-06-18","2024-08-01")),
  segment_at     = c("Free","Pro","Free","Pro","Free","Free","Pro")
)

ex_3_4 <- orders |>
  inner_join(segment_history,
             by = join_by(customer_id, closest(order_date >= effective_date)))
ex_3_4
```

**Explanation:** Combining an equality (`customer_id`) with `closest()` is the canonical SCD-Type-2 lookup: for each fact row, find the dimension version that was effective at the fact's timestamp. Without `join_by()` you would have to inner_join on the equality, then `group_by()` and `slice_max()`, which is several times slower and harder to verify. Orphan customer ids 7 and 9 drop out because there is no history row for them.

</details>

## Section 4. Many-to-many and join helpers (4 problems)

### Exercise 4.1: Acknowledge a many-to-many fan-out with relationship

**Task:** A platform engineer wants a deliberate cartesian product of orders and promo codes per customer. Build an inline `promos` tibble where customer 1 has two promo codes and customer 5 has two as well, then `inner_join()` `orders` to `promos` with `relationship = "many-to-many"` to silence the warning. Save the fanned-out table to `ex_4_1`.

**Expected result:**

```
#> # A tibble: 11 x 6
#>   order_id customer_id order_date amount promo_code pct_off
#>      <int>       <int> <date>      <dbl> <chr>        <dbl>
#> 1      101           1 2024-04-02     50 WELCOME         10
#> 2      101           1 2024-04-02     50 SUMMER          15
#> 3      103           1 2024-05-10     30 WELCOME         10
#> 4      103           1 2024-05-10     30 SUMMER          15
#> # 7 more rows for customers 2 and 5
```

**Difficulty:** Advanced

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
promos <- tibble(
  customer_id = c(1L, 1L, 2L, 5L, 5L),
  promo_code  = c("WELCOME","SUMMER","WELCOME","SUMMER","FALL"),
  pct_off     = c(10, 15, 10, 15, 20)
)

ex_4_1 <- orders |>
  inner_join(promos, by = "customer_id", relationship = "many-to-many")
ex_4_1
```

**Explanation:** When BOTH sides have duplicate keys, dplyr 1.1+ warns because the row count balloons unexpectedly. Setting `relationship = "many-to-many"` is your written acknowledgement that this fan-out is intentional. The cleaner alternative is to first aggregate one side to one-row-per-key, but for a true cartesian product within each key (every order paired with every promo), this is correct.

</details>

### Exercise 4.2: Disambiguate duplicate column names with the suffix argument

**Task:** When two tables share a non-key column name, dplyr appends `.x` and `.y` by default. Build two tibbles `feb_prices` and `mar_prices` each with columns `product_id` and `price`, then `inner_join()` them passing `suffix = c("_feb","_mar")` so the result has clearly named `price_feb` and `price_mar` columns. Save to `ex_4_2`.

**Expected result:**

```
#> # A tibble: 4 x 3
#>   product_id price_feb price_mar
#>        <int>     <dbl>     <dbl>
#> 1          1        10        11
#> 2          2        20        19
#> 3          3        30        35
#> 4          4        40        38
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
feb_prices <- tibble(product_id = 1:4, price = c(10, 20, 30, 40))
mar_prices <- tibble(product_id = 1:4, price = c(11, 19, 35, 38))

ex_4_2 <- feb_prices |>
  inner_join(mar_prices, by = "product_id", suffix = c("_feb","_mar"))
ex_4_2
```

**Explanation:** The default `.x` and `.y` suffixes become useless once a column is shadowed twice in a chain (you end up with `price.x.x`). Always pass an explicit `suffix` when joining time-series snapshots, A/B variants, or before-and-after panels. A cleaner alternative is to rename one side BEFORE the join (`rename(price_feb = price)`) so the columns survive without machine suffixes.

</details>

### Exercise 4.3: Force a hard failure on orphans with unmatched = "error"

**Task:** An ETL engineer wants every order to have a matching customer or the pipeline must FAIL LOUDLY rather than silently dropping rows. Use `inner_join()` with `unmatched = "error"` to force a hard error, wrap it in `tryCatch()` to capture the message, and save the captured error string (or the success string) to `ex_4_3` so the pipeline can log it.

**Expected result:**

```
#> [1] "Each row of `x` must have a match in `y`.
#> i Row 5 of `x` does not have a match."
```

**Difficulty:** Advanced

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- tryCatch(
  {
    orders |>
      inner_join(customers, by = "customer_id", unmatched = "error")
    "OK: every order matched a customer"
  },
  error = function(e) conditionMessage(e)
)
ex_4_3
```

**Explanation:** `unmatched = "error"` turns silent row-loss into a loud failure, which is the right behavior for ETL where data integrity matters more than a partial result. The default `"drop"` quietly removes orphans, which is dangerous in production. Pair it with `tryCatch()` so a failed batch gets logged rather than crashing the whole job. The exact error wording can vary by dplyr version.

</details>

### Exercise 4.4: Stop NA-to-NA matches with na_matches = "never"

**Task:** When a join key has `NA` values, dplyr's default is to match `NA`-against-`NA`, which is rarely what you want. Build two tibbles `obs` (with values `1, 2, NA, 3`) and `lookup` (with values `1, NA, 3`) on a key column called `id`, then `left_join()` them with `na_matches = "never"` so the `NA` rows do NOT join. Save to `ex_4_4`.

**Expected result:**

```
#> # A tibble: 4 x 3
#>      id val_x val_y
#>   <dbl> <chr> <chr>
#> 1     1 a     X
#> 2     2 b     NA
#> 3    NA c     NA
#> 4     3 d     Z
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_4 <- # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
obs    <- tibble(id = c(1, 2, NA, 3), val_x = c("a","b","c","d"))
lookup <- tibble(id = c(1, NA, 3),    val_y = c("X","Y","Z"))

ex_4_4 <- obs |>
  left_join(lookup, by = "id", na_matches = "never")
ex_4_4
```

**Explanation:** By default dplyr matches `NA` against `NA` in join keys, which descends from R's three-valued comparison semantics. `na_matches = "never"` changes this so `NA`s are excluded, matching base R's `merge()` behavior. Using the default ('na') would have joined obs's `NA`-id row to lookup's `NA`-id row, almost always a bug rather than intent in production data.

</details>

## Section 5. Inequality and rolling joins (4 problems)

### Exercise 5.1: Bucket each order into a price tier with an inequality join

**Task:** An accounting analyst wants to assign every order to the correct price tier from `price_tiers` (where each tier is a half-open range like `[0, 50)`). Use `inner_join()` with `by = join_by(amount >= min_amount, amount < max_amount)` to attach the matching tier label to each order. Save to `ex_5_1`.

**Expected result:**

```
#> # A tibble: 10 x 6
#>    order_id customer_id order_date amount min_amount tier
#>       <int>       <int> <date>      <dbl>      <dbl> <chr>
#>  1      101           1 2024-04-02     50         50 small
#>  2      102           2 2024-04-15     80         50 small
#>  3      103           1 2024-05-10     30          0 micro
#>  4      104           3 2024-05-22     65         50 small
#>  5      105           7 2024-06-01    120        100 mid
#>  6      106           5 2024-07-04    200        200 large
#> # 4 more rows
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- orders |>
  inner_join(price_tiers,
             by = join_by(amount >= min_amount, amount < max_amount))
ex_5_1
```

**Explanation:** Inequality joins (also called non-equi joins) match rows where columns satisfy a comparison rather than an exact equality. Each order picks up the single tier whose half-open range contains its `amount`. Without `join_by()` you would have to cross-join then filter, which is O(n*m) and wastes memory. dplyr 1.1+ rewrites this into an efficient interval scan internally.

</details>

### Exercise 5.2: Attach the most recent FX rate with a closest() rolling join

**Task:** A finance team wants to attach the most recent FX rate available on or before each transaction date. Build inline `transactions` (5 rows with `txn_date` and `amount_usd`) and `fx_rates` (4 rows with `rate_date` and `eur_per_usd`), then use `inner_join()` with `join_by(closest(txn_date >= rate_date))` to pick exactly one rate per transaction. Save to `ex_5_2`.

**Expected result:**

```
#> # A tibble: 5 x 5
#>   txn_id txn_date   amount_usd rate_date  eur_per_usd
#>    <int> <date>          <dbl> <date>           <dbl>
#> 1      1 2024-03-04       1000 2024-03-01        0.92
#> 2      2 2024-03-15       2500 2024-03-10        0.91
#> 3      3 2024-04-01        800 2024-04-01        0.93
#> 4      4 2024-04-09       1500 2024-04-01        0.93
#> 5      5 2024-05-02        600 2024-05-01        0.94
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
transactions <- tibble(
  txn_id     = 1:5,
  txn_date   = as.Date(c("2024-03-04","2024-03-15","2024-04-01",
                         "2024-04-09","2024-05-02")),
  amount_usd = c(1000, 2500, 800, 1500, 600)
)
fx_rates <- tibble(
  rate_date   = as.Date(c("2024-03-01","2024-03-10","2024-04-01","2024-05-01")),
  eur_per_usd = c(0.92, 0.91, 0.93, 0.94)
)

ex_5_2 <- transactions |>
  inner_join(fx_rates, by = join_by(closest(txn_date >= rate_date)))
ex_5_2
```

**Explanation:** `closest()` wraps an inequality and asks for the SINGLE best match per left-side row. `closest(txn_date >= rate_date)` picks the latest rate that is still on-or-before the transaction date. This is the dplyr equivalent of a SQL correlated subquery with `LIMIT 1` or a `data.table` rolling join. Without `closest()` you would get every prior rate and then have to `slice_max()` per group, which is slower and more verbose.

</details>

### Exercise 5.3: Tag each customer signup with the active campaign using between()

**Task:** A subscription analyst wants to join each customer signup to the campaign that was running on that signup date. Build inline `campaigns` (3 rows with `campaign`, `starts`, `ends`) and use `inner_join()` with `by = join_by(between(signup, starts, ends))` to attach the active campaign per customer. Save to `ex_5_3`.

**Expected result:**

```
#> # A tibble: 6 x 7
#>   customer_id name  segment signup     campaign starts     ends
#>         <int> <chr> <chr>   <date>     <chr>    <date>     <date>
#> 1           1 Alice Pro     2024-01-15 WINTER   2024-01-01 2024-03-31
#> 2           2 Bob   Free    2024-02-08 WINTER   2024-01-01 2024-03-31
#> 3           3 Carol Pro     2024-03-22 WINTER   2024-01-01 2024-03-31
#> 4           4 Dan   Free    2024-05-01 SPRING   2024-04-01 2024-06-14
#> 5           5 Eve   Pro     2024-06-18 SUMMER   2024-06-15 2024-09-30
#> 6           6 Frank Free    2024-09-04 SUMMER   2024-06-15 2024-09-30
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
campaigns <- tibble(
  campaign = c("WINTER","SPRING","SUMMER"),
  starts   = as.Date(c("2024-01-01","2024-04-01","2024-06-15")),
  ends     = as.Date(c("2024-03-31","2024-06-14","2024-09-30"))
)

ex_5_3 <- customers |>
  inner_join(campaigns, by = join_by(between(signup, starts, ends)))
ex_5_3
```

**Explanation:** `between(x, lo, hi)` is shorthand for `x >= lo, x <= hi` with both bounds inclusive by default. Pass `bounds = "[)"` to mirror SQL's left-inclusive, right-exclusive convention if your campaign windows abut. A common mistake is leaving overlapping ranges in the right table, which silently fans rows out; validate the right table for non-overlap before relying on the join.

</details>

### Exercise 5.4: Pair every order with its prior orders via a self inequality join

**Task:** An analyst wants every order paired with all PRIOR orders by the same customer (so each row reads "this order followed that earlier one"). Use a self inner_join on `orders` with `join_by(customer_id, order_date > order_date)` and pick informative suffixes `c("_curr","_prev")`. Save the chronological pairs to `ex_5_4`.

**Expected result:**

```
#> # A tibble: 4 x 7
#>   order_id_curr customer_id order_date_curr amount_curr order_id_prev order_date_prev amount_prev
#>           <int>       <int> <date>                <dbl>         <int> <date>                <dbl>
#> 1           103           1 2024-05-10               30           101 2024-04-02               50
#> 2           107           1 2024-08-12               45           101 2024-04-02               50
#> 3           107           1 2024-08-12               45           103 2024-05-10               30
#> 4           109           5 2024-10-21               90           106 2024-07-04              200
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_4 <- # your code here
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_4 <- orders |>
  inner_join(orders,
             by = join_by(customer_id, order_date > order_date),
             suffix = c("_curr","_prev"))
ex_5_4
```

**Explanation:** Self-joins on inequalities are the dplyr way to express "pair each row with all prior rows by the same group". The `>` operator forms a triangular join: for n events per customer you get n*(n-1)/2 pairs, which can blow up. For huge tables prefer window functions (`lag()` for just-the-previous, or `lead()`) over a full triangular self-join, and reserve this pattern for "all prior" reports.

</details>

## Section 6. End-to-end join workflows (5 problems)

### Exercise 6.1: Top three customers by total revenue for a quarterly review

**Task:** The GM is preparing for a quarterly business review and wants the top three customers by total order amount, with their full name and segment. Combine `orders` and `customers` with the appropriate join, aggregate per customer, then keep the top three rows by revenue. Save the leaderboard to `ex_6_1`.

**Expected result:**

```
#> # A tibble: 3 x 3
#>   name  segment total_revenue
#>   <chr> <chr>           <dbl>
#> 1 Eve   Pro               290
#> 2 Alice Pro               125
#> 3 Bob   Free               80
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_1 <- orders |>
  inner_join(customers, by = "customer_id") |>
  group_by(name, segment) |>
  summarise(total_revenue = sum(amount), .groups = "drop") |>
  slice_max(total_revenue, n = 3)
ex_6_1
```

**Explanation:** Standard top-N report pattern: inner_join (drops orphan orders), aggregate per customer, slice the top N. Using `inner_join()` here is intentional because the report is for legitimate customers only, so the orphan orders 105 and 110 are correctly excluded. Always justify whether orphans should appear or be silently filtered, and pick the join type that matches the decision.

</details>

### Exercise 6.2: Identify Pro-segment churn candidates

**Task:** The customer success team wants the list of Pro-segment customers who have NOT placed any order in the last 90 days as of `2024-12-01`, sorted by signup date with oldest first. Use a filtering join after restricting `orders` to recent activity. Save the at-risk roster to `ex_6_2`.

**Expected result:**

```
#> # A tibble: 2 x 4
#>   customer_id name  segment signup
#>         <int> <chr> <chr>   <date>
#> 1           1 Alice Pro     2024-01-15
#> 2           3 Carol Pro     2024-03-22
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
recent <- orders |>
  filter(order_date >= as.Date("2024-09-02"))

ex_6_2 <- customers |>
  filter(segment == "Pro") |>
  anti_join(recent, by = "customer_id") |>
  arrange(signup)
ex_6_2
```

**Explanation:** Filtering joins compose well with regular filters: pre-filter the right side to define "active", pre-filter the left side to define "in scope", then anti_join. Order matters less for correctness than for readability. Many analysts put the segment filter after the anti_join, which works but reads less like the stakeholder's plain-English question and so is harder to review.

</details>

### Exercise 6.3: Build a system reconciliation table with a derived status column

**Task:** A compliance officer wants a single reconciliation table showing every `customer_id` from EITHER `orders` or `customers`, plus a `status` column with values `"matched"`, `"orphan_order"`, or `"no_orders"`. Use `full_join()` on the two distinct keysets with boolean flags, derive `status` with `case_when()`, and save the audit table to `ex_6_3`.

**Expected result:**

```
#> # A tibble: 8 x 2
#>   customer_id status
#>         <int> <chr>
#> 1           1 matched
#> 2           2 matched
#> 3           3 matched
#> 4           4 matched
#> 5           5 matched
#> 6           6 no_orders
#> 7           7 orphan_order
#> 8           9 orphan_order
```

**Difficulty:** Advanced

```r title="Your turn"
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_3 <- customers |>
  distinct(customer_id) |>
  mutate(in_customers = TRUE) |>
  full_join(
    orders |> distinct(customer_id) |> mutate(in_orders = TRUE),
    by = "customer_id"
  ) |>
  mutate(status = case_when(
    in_customers & in_orders ~ "matched",
    in_customers             ~ "no_orders",
    TRUE                     ~ "orphan_order"
  )) |>
  select(customer_id, status) |>
  arrange(customer_id)
ex_6_3
```

**Explanation:** Reconciliation queries always start with `full_join()` to get the union of both keysets. The trick to deriving "where did this row come from" is to add boolean flags BEFORE the join, then use `case_when()` after. `NA` after a full join means "no row on this side", which is the same signal but harder to read in a status column shown to a stakeholder.

</details>

### Exercise 6.4: Build a denormalized orders fact table for a dashboard

**Task:** A BI engineer wants a single denormalized "orders fact" table that the dashboard can query without further joins. Combine `orders` (with an added `product_id = c(1,2,1,3,4,1,2,3,4,1)`), `customers`, `products`, and the optional `returns` table. Use `left_join()` for everything so the order grain is preserved. Save to `ex_6_4`.

**Expected result:**

```
#> # A tibble: 10 x 11
#>    order_id customer_id order_date amount product_id name  segment signup     product   category reason
#>       <int>       <int> <date>      <dbl>      <dbl> <chr> <chr>   <date>     <chr>     <chr>    <chr>
#>  1      101           1 2024-04-02     50          1 Alice Pro     2024-01-15 Widget    Tools    damaged
#>  2      102           2 2024-04-15     80          2 Bob   Free    2024-02-08 Gadget    Tools    NA
#>  3      103           1 2024-05-10     30          1 Alice Pro     2024-01-15 Widget    Tools    NA
#>  4      104           3 2024-05-22     65          3 Carol Pro     2024-03-22 Sprocket  Parts    NA
#>  5      105           7 2024-06-01    120          4 NA    NA      NA         Gizmo     Tools    wrong size
#> # 5 more rows; refund column also present
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_6_4 <- # your code here
ex_6_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_4 <- orders |>
  mutate(product_id = c(1, 2, 1, 3, 4, 1, 2, 3, 4, 1)) |>
  left_join(customers, by = "customer_id") |>
  left_join(products,  by = "product_id") |>
  left_join(returns,   by = "order_id")
ex_6_4
```

**Explanation:** Star-schema denormalization is a sequence of `left_join()`s anchored on the fact table (`orders`). Always start from the fact, never from a dimension, so the row count of the result equals the row count of the fact. Watch the column-count tax: wide tables hurt downstream pivot performance. For analytical engines prefer this shape; for OLTP storage keep it normalized.

</details>

### Exercise 6.5: Compute days-to-first-order per customer with a left_join

**Task:** The growth team wants `days_to_first_order` for every customer, computed as the gap in days between their `signup` date and their first order date. Aggregate `orders` (after a `semi_join()` to drop orphans) to one row per customer using `min(order_date)`, `left_join()` back to `customers`, then derive the lag in days. Save to `ex_6_5`.

**Expected result:**

```
#> # A tibble: 6 x 4
#>   customer_id name  signup     days_to_first_order
#>         <int> <chr> <date>                   <dbl>
#> 1           1 Alice 2024-01-15                  78
#> 2           2 Bob   2024-02-08                  67
#> 3           3 Carol 2024-03-22                  61
#> 4           4 Dan   2024-05-01                 131
#> 5           5 Eve   2024-06-18                  16
#> 6           6 Frank 2024-09-04                  NA
```

**Difficulty:** Advanced

```r title="Your turn"
ex_6_5 <- # your code here
ex_6_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
first_orders <- orders |>
  semi_join(customers, by = "customer_id") |>
  group_by(customer_id) |>
  summarise(first_order_date = min(order_date), .groups = "drop")

ex_6_5 <- customers |>
  left_join(first_orders, by = "customer_id") |>
  mutate(days_to_first_order = as.numeric(first_order_date - signup)) |>
  select(customer_id, name, signup, days_to_first_order)
ex_6_5
```

**Explanation:** Time-to-first-X is one of the most common growth metrics. The pattern is: aggregate the event table to a per-entity minimum date, left-join back to the entity dimension to keep entities with no events visible (Frank gets `NA`, not dropped), then compute the lag. The `semi_join()` step is defensive: it removes orphans so the per-customer min is computed only over events whose customer actually exists.

</details>

## What to do next

Once you finish these, work through these closely related hubs:

- [dplyr Exercises in R: 50 Practice Problems](dplyr-Exercises-in-R.html) covers the full verb set (select, filter, mutate, arrange, summarise) so the joins above slot into longer pipelines.
- [dplyr Group By Exercises in R](dplyr-Group-By-Exercises-in-R.html) drills the aggregation patterns that almost always follow a join in real reports.
- [tidyr Exercises in R](tidyr-Exercises-in-R.html) covers the pivot and unite/separate operations that prepare wide or long tables before a join.
- [Data Wrangling Exercises in R](Data-Wrangling-Exercises-in-R.html) is the broader mixed-package hub if you want a longer end-to-end workout.
