---
title: "R Joins With Visual Diagrams: Pick the Right Join Every Time"
slug: "R-Joins"
description: "Inner, left, right, full, semi, and anti joins in dplyr with working examples. Learn when each join is correct and how to handle duplicate keys."
keywords: "R joins, dplyr joins, inner_join, left_join, full_join, semi_join, anti_join, R merge, join tables in R, combine data frames R"
auto_link_terms: "R joins|dplyr joins|inner_join()|left_join()|full_join()|semi_join()|anti_join()|join tables in R"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: 2026-04-11
curriculum_id: "1.2.7"
post_type: C
sidebar_section: "Data Wrangling"
sidebar_title: "R Joins"
sidebar_order: 7
difficulty: "Intermediate"
---

# R Joins With Visual Diagrams: Pick the Right Join Every Time

<p class="lead">A join combines two tables into one by matching rows on a shared key column, dplyr's six join verbs (<code>inner_join</code>, <code>left_join</code>, <code>right_join</code>, <code>full_join</code>, <code>semi_join</code>, <code>anti_join</code>) differ only in which unmatched rows they keep. Pick the right one and your analysis snaps into place.</p>

## What does joining two tables actually do?

Real-world data rarely lives in one table. Customer names sit in one file, orders in another, products in a third, and the only way to answer "what did Alice buy?" is to combine them. A join does exactly that: it takes two tables, finds rows that share a key value, and glues matching rows side-by-side into one wider table. Here's the idea with two tiny tibbles, musicians and the instruments they play:

```r
library(dplyr)

band <- tibble(
  name = c("John", "Paul", "George", "Ringo"),
  band = c("Beatles", "Beatles", "Beatles", "Beatles")
)

instruments <- tibble(
  name  = c("John", "Paul", "Keith"),
  plays = c("guitar", "bass", "guitar")
)

band |> inner_join(instruments, by = "name")
#> # A tibble: 2 × 3
#>   name  band    plays
#>   <chr> <chr>   <chr>
#> 1 John  Beatles guitar
#> 2 Paul  Beatles bass
```

Two rows survive, John and Paul, because they appear in both tables. George and Ringo are in `band` but not in `instruments`, so they're dropped. Keith is in `instruments` but not in `band`, so he's dropped too. That "keep only the matches" behavior is what `inner_join()` does, and it's the strictest of the six joins. The `by = "name"` argument tells dplyr which column to match on.

![Join type decision overview](screenshots/R-Joins-types-overview.webp)
*Figure 1: Choosing a join comes down to which unmatched rows you want to keep.*

[KEY INSIGHT]
**All joins answer the same question: which rows match, and what do you do with the ones that don't?** Every dplyr join verb matches rows identically, the only difference is whether unmatched rows from the left, right, both, or neither side survive the operation.

**Try it:** Create two tibbles, one with employee names and departments, one with names and salaries. Join them on `name` with `inner_join()`. Save to `ex_inner`.

```r
# Try it: inner_join two tibbles
ex_employees <- tibble(
  name = c("Alice", "Bob", "Carol"),
  dept = c("Eng", "Sales", "Eng")
)

ex_salaries <- tibble(
  name   = c("Alice", "Bob", "Dan"),
  salary = c(90000, 75000, 80000)
)

ex_inner <- # your code here

ex_inner
#> Expected: 2 rows (Alice and Bob, both in both tables)
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_inner <- ex_employees |> inner_join(ex_salaries, by = "name")
ex_inner
#> # A tibble: 2 × 3
#>   name  dept  salary
#>   <chr> <chr>  <dbl>
#> 1 Alice Eng    90000
#> 2 Bob   Sales  75000
```

**Explanation:** Carol (in employees only) and Dan (in salaries only) are both dropped because `inner_join()` keeps only the rows that appear in both tables.

</details>

## How does inner_join() decide which rows match?

Under the hood, a join is a lookup. For each row in the left table, dplyr takes the key value, scans the right table for rows with the same key, and pastes the matching right-row columns onto the left row. If there's no match, `inner_join()` drops the left row entirely. If there are multiple matches, it returns one output row per match, so the result can actually be *bigger* than the left table.

![How dplyr matches rows](screenshots/R-Joins-matching-process.webp)
*Figure 2: For each left row, dplyr looks up the key in the right table and decides whether to keep or drop.*

```r
purchases <- tibble(
  customer_id = c(1, 2, 1, 3),
  product     = c("Pen", "Book", "Mug", "Pen")
)

customers <- tibble(
  customer_id = c(1, 2),
  name        = c("Alice", "Bob")
)

purchases |> inner_join(customers, by = "customer_id")
#> # A tibble: 3 × 3
#>   customer_id product name
#>         <dbl> <chr>   <chr>
#> 1           1 Pen     Alice
#> 2           2 Book    Bob
#> 3           1 Mug     Alice
```

Three rows out of four survive. Customer 3's purchase is dropped because customer 3 doesn't exist in the `customers` table. Notice how customer 1 appears twice in the result, once for the Pen and once for the Mug, because Alice made two purchases. That's a key property of joins: one left row can become many output rows if the key has multiple matches.

**Try it:** Inner-join two small tibbles where one key has 2 matches on the right side. Save to `ex_multi`.

```r
ex_left <- tibble(id = 1:2, letter = c("A", "B"))
ex_right <- tibble(id = c(1, 1, 2), score = c(10, 20, 30))

ex_multi <- # your code here

nrow(ex_multi)
#> Expected: 3
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_multi <- ex_left |> inner_join(ex_right, by = "id")
ex_multi
#> # A tibble: 3 × 3
#>      id letter score
#>   <int> <chr>  <dbl>
#> 1     1 A         10
#> 2     1 A         20
#> 3     2 B         30
```

**Explanation:** The row with `id = 1` from `ex_left` matches 2 rows on the right, so it's duplicated in the output, each copy paired with one matching right row.

</details>

## When should you use left_join() vs right_join()?

`inner_join()` drops unmatched rows, which is sometimes what you want and sometimes a disaster. If you're building a sales report with one row per customer, you don't want customers with zero purchases to silently vanish. `left_join()` keeps every row from the left table, if the right side has no match, the new columns fill with `NA`. `right_join()` does the mirror: keep everything on the right, fill left with `NA`. In practice, analysts almost always use `left_join()` and flip their arguments instead of reaching for `right_join()`.

```r
band |> left_join(instruments, by = "name")
#> # A tibble: 4 × 3
#>   name   band    plays
#>   <chr>  <chr>   <chr>
#> 1 John   Beatles guitar
#> 2 Paul   Beatles bass
#> 3 George Beatles NA
#> 4 Ringo  Beatles NA
```

Four rows, every member of `band` survives. George and Ringo get `NA` in the `plays` column because they don't appear in `instruments`. This is exactly what you want for reports: "show every band member, and their instrument if we know it." The presence of `NA` is often meaningful in itself, it tells you which left rows lack a match.

[TIP]
**Treat left_join() as your default.** If most of your analysis flows "left-to-right" (start with a primary table, enrich it with lookups), `left_join()` preserves your row count and prevents silent data loss. Reach for `inner_join()` only when you explicitly want to drop unmatched rows.

**Try it:** Left-join `ex_employees` with `ex_salaries` so Carol appears with `NA` salary. Save to `ex_left`.

```r
ex_left_result <- ex_employees |>
  # your code here

ex_left_result
#> Expected: 3 rows, Carol's salary is NA
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_left_result <- ex_employees |> left_join(ex_salaries, by = "name")
ex_left_result
#> # A tibble: 3 × 3
#>   name  dept  salary
#>   <chr> <chr>  <dbl>
#> 1 Alice Eng    90000
#> 2 Bob   Sales  75000
#> 3 Carol Eng       NA
```

**Explanation:** Carol appears because she's in the left table; her salary is `NA` because she's missing from the right table.

</details>

## How does full_join() keep rows from both sides?

Sometimes you want *everything*, every row from both tables, with `NA` wherever one side lacks a match. That's `full_join()`. It's the union of left and right join: rows that match get combined, rows unique to either side come through unchanged, and unmatched cells fill with `NA`. Use it when you're merging two partial datasets and need to know what each one contributed.

```r
band |> full_join(instruments, by = "name")
#> # A tibble: 5 × 3
#>   name   band    plays
#>   <chr>  <chr>   <chr>
#> 1 John   Beatles guitar
#> 2 Paul   Beatles bass
#> 3 George Beatles NA
#> 4 Ringo  Beatles NA
#> 5 Keith  NA      guitar
```

Five rows, every unique name from either table. John and Paul get combined columns, George and Ringo get `NA` in `plays`, and Keith (only in `instruments`) gets `NA` in `band`. The result shows exactly which rows came from which side, making `full_join()` useful for auditing data sources.

**Try it:** Full-join `ex_employees` with `ex_salaries`. Save to `ex_full`. Confirm the row count equals the union of unique names from both tables.

```r
ex_full <- ex_employees |>
  # your code here

nrow(ex_full)
#> Expected: 4
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_full <- ex_employees |> full_join(ex_salaries, by = "name")
ex_full
#> # A tibble: 4 × 3
#>   name  dept  salary
#>   <chr> <chr>  <dbl>
#> 1 Alice Eng    90000
#> 2 Bob   Sales  75000
#> 3 Carol Eng       NA
#> 4 Dan   NA     80000
```

**Explanation:** Four unique names across both tables: Alice, Bob, Carol, Dan. Each appears exactly once, with `NA` wherever one source lacked the row.

</details>

## What do semi_join() and anti_join() do?

`semi_join()` and `anti_join()` are the odd ones out, they're called "filtering joins" because they don't add columns, they just filter rows. `semi_join(x, y)` keeps rows in `x` that have *a match* in `y`, but adds no columns from `y`. `anti_join(x, y)` is the opposite, it keeps rows in `x` that have *no match* in `y`. Think of them as `filter()` statements that use another table as the condition.

```r
# Who in the band has a known instrument?
band |> semi_join(instruments, by = "name")
#> # A tibble: 2 × 2
#>   name  band
#>   <chr> <chr>
#> 1 John  Beatles
#> 2 Paul  Beatles

# Who in the band has an unknown instrument?
band |> anti_join(instruments, by = "name")
#> # A tibble: 2 × 2
#>   name   band
#>   <chr>  <chr>
#> 1 George Beatles
#> 2 Ringo  Beatles
```

`semi_join()` returns John and Paul (the matched rows), but you'll notice the `plays` column is absent, filtering joins never add columns. `anti_join()` returns George and Ringo (the unmatched rows). These two verbs together express "rows in X that are/aren't in Y", a surprisingly common need when you're hunting missing data or checking which records failed a lookup.

[TIP]
**Use anti_join() to find data-quality problems.** Running `orders |> anti_join(customers, by = "customer_id")` tells you exactly which orders reference customers that don't exist, invaluable when cleaning up ETL pipelines.

**Try it:** Use `anti_join()` to find employees with no salary record. Save to `ex_missing`.

```r
ex_missing <- ex_employees |>
  # your code here

ex_missing
#> Expected: 1 row (Carol)
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_missing <- ex_employees |> anti_join(ex_salaries, by = "name")
ex_missing
#> # A tibble: 1 × 2
#>   name  dept
#>   <chr> <chr>
#> 1 Carol Eng
```

**Explanation:** `anti_join()` keeps only rows from the left that have no match on the right. Carol is in `ex_employees` but absent from `ex_salaries`, so she's the only result.

</details>

## How do you join when the key columns have different names?

Real datasets rarely have matching column names. One table calls it `customer_id`, another calls it `cust_id` or just `id`. Pass a named vector to `by`, `by = c("left_col" = "right_col")`, and dplyr will match on those differently-named columns. The left name ends up in the result.

```r
orders <- tibble(
  order_id    = 1:3,
  customer_id = c(1, 2, 1)
)

people <- tibble(
  id   = c(1, 2),
  name = c("Alice", "Bob")
)

orders |> left_join(people, by = c("customer_id" = "id"))
#> # A tibble: 3 × 3
#>   order_id customer_id name
#>      <int>       <dbl> <chr>
#> 1        1           1 Alice
#> 2        2           2 Bob
#> 3        3           1 Alice
```

The `customer_id` column on the left matches the `id` column on the right, and the merged result uses the left name (`customer_id`). If multiple columns need to match (say, `date` and `region`), pass a longer vector: `by = c("date", "region")` for same-name keys, or `by = c("date" = "dt", "region" = "r")` for different-name keys.

[WARNING]
**Always check what dplyr matched on.** Since dplyr 1.1.0, if you omit the `by` argument, a message warns you which columns were auto-matched. Never rely on auto-matching in production code, typos and silent column drift can cause joins on unintended keys. Always specify `by` explicitly.

**Try it:** Left-join `orders` with a new tibble `shipping` keyed on `order_id` vs `ord_id`. Save to `ex_shipping`.

```r
ex_shipping_info <- tibble(
  ord_id = c(1, 3),
  status = c("shipped", "pending")
)

ex_shipping <- orders |>
  # your code here

ex_shipping
#> Expected: 3 rows with status for orders 1, 3 (NA for order 2)
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_shipping <- orders |>
  left_join(ex_shipping_info, by = c("order_id" = "ord_id"))

ex_shipping
#> # A tibble: 3 × 3
#>   order_id customer_id status
#>      <int>       <dbl> <chr>
#> 1        1           1 shipped
#> 2        2           2 NA
#> 3        3           1 pending
```

**Explanation:** The named-vector `by` tells dplyr which column on each side to match, and the left-side name (`order_id`) is preserved in the result.

</details>

## What happens when keys are duplicated on one or both sides?

Here's where joins get tricky. If the left key has one row and the right key has two matches, you get two output rows (as we saw earlier). But what if *both* sides have duplicates? Then you get a Cartesian explosion, every left duplicate paired with every right duplicate. A 2×3 match produces 6 output rows, and this is almost always a bug.

```r
left_dup <- tibble(
  id  = c(1, 1),
  val = c("A", "B")
)

right_dup <- tibble(
  id    = c(1, 1, 1),
  score = c(10, 20, 30)
)

# 2 x 3 = 6 rows
left_dup |> inner_join(right_dup, by = "id", relationship = "many-to-many")
#> # A tibble: 6 × 3
#>      id val   score
#>   <dbl> <chr> <dbl>
#> 1     1 A        10
#> 2     1 A        20
#> 3     1 A        30
#> 4     1 B        10
#> 5     1 B        20
#> 6     1 B        30
```

Six rows from a 2×3 key collision. Since dplyr 1.1.0, you must explicitly declare `relationship = "many-to-many"` to allow this, otherwise dplyr raises an error, on the grounds that many-to-many joins are usually accidents. The safer relationship types are `"one-to-one"`, `"one-to-many"`, and `"many-to-one"`, each of which dplyr will verify and error on if violated.

[WARNING]
**Unintentional many-to-many joins are the #1 join bug.** If you see your row count explode after a join, you almost certainly have duplicates in a key you thought was unique. Declare the expected `relationship` on every production join so dplyr catches violations for you.

**Try it:** Try joining `left_dup` and `right_dup` with `relationship = "one-to-one"`. What happens? Save the error message (or success) to `ex_rel`.

```r
# Try it: enforce one-to-one
# Expect: error because the relationship is violated
ex_rel <- try(
  left_dup |> inner_join(right_dup, by = "id", relationship = "one-to-one"),
  silent = TRUE
)
class(ex_rel)
#> Expected: "try-error"
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_rel <- try(
  left_dup |> inner_join(right_dup, by = "id", relationship = "one-to-one"),
  silent = TRUE
)
class(ex_rel)
#> [1] "try-error"
```

**Explanation:** Both sides have duplicates, so the relationship isn't one-to-one. dplyr raises an error, which is exactly what you want in production code to catch data issues early.

</details>

## Practice Exercises

Use `my_*` variables to avoid clobbering earlier tutorial state.

### Exercise 1: Customer lifetime value

You have a `customers` table and an `orders` table. Compute each customer's total spend (sum of `amount` over all their orders). Include customers with zero orders (they should show `NA` or 0). Save to `my_ltv`.

```r
cust <- tibble(
  customer_id = 1:4,
  name        = c("Alice", "Bob", "Carol", "Dan")
)
ord <- tibble(
  customer_id = c(1, 1, 2, 4, 4, 4),
  amount      = c(50, 30, 75, 100, 20, 60)
)

my_ltv <- # your code here

my_ltv
```

<details>
<summary>Click to reveal solution</summary>

```r
my_ltv <- cust |>
  left_join(ord, by = "customer_id") |>
  group_by(customer_id, name) |>
  summarise(total = sum(amount, na.rm = TRUE), .groups = "drop")

my_ltv
#> # A tibble: 4 × 3
#>   customer_id name  total
#>         <int> <chr> <dbl>
#> 1           1 Alice    80
#> 2           2 Bob      75
#> 3           3 Carol     0
#> 4           4 Dan     180
```

**Explanation:** `left_join()` preserves every customer; `sum(..., na.rm = TRUE)` handles Carol's missing-orders case by summing nothing to 0.

</details>

### Exercise 2: Orphan detection

Find orders that reference non-existent customers (an `anti_join` use case). Save to `my_orphans`.

```r
cust_v2 <- tibble(customer_id = 1:3, name = c("A", "B", "C"))
ord_v2  <- tibble(order_id = 1:5, customer_id = c(1, 2, 5, 3, 7))

my_orphans <- # your code here

my_orphans
```

<details>
<summary>Click to reveal solution</summary>

```r
my_orphans <- ord_v2 |> anti_join(cust_v2, by = "customer_id")

my_orphans
#> # A tibble: 2 × 2
#>   order_id customer_id
#>      <int>       <dbl>
#> 1        3           5
#> 2        5           7
```

**Explanation:** Orders 3 and 5 reference customer IDs not in `cust_v2`. `anti_join()` keeps left rows that don't match on the right, exactly the orphan-finding pattern.

</details>

### Exercise 3: Join with renamed keys and filter

Join `orders` with `people` from earlier (keys are named differently), then keep only rows where the customer name starts with "A". Save to `my_a_orders`.

```r
my_a_orders <- orders |>
  # your code here

my_a_orders
```

<details>
<summary>Click to reveal solution</summary>

```r
my_a_orders <- orders |>
  left_join(people, by = c("customer_id" = "id")) |>
  filter(startsWith(name, "A"))

my_a_orders
#> # A tibble: 2 × 3
#>   order_id customer_id name
#>      <int>       <dbl> <chr>
#> 1        1           1 Alice
#> 2        3           1 Alice
```

**Explanation:** The named-vector `by` handles the key-name mismatch, and `startsWith()` is a base R helper that works neatly inside `filter()`.

</details>

## Complete Example

Here's a three-table rollup: customers, orders, and products. Question: *for each customer, what's the total spent on "premium" products?*

```r
cust3 <- tibble(customer_id = 1:3, name = c("Alice", "Bob", "Carol"))
ord3  <- tibble(
  order_id    = 1:5,
  customer_id = c(1, 1, 2, 3, 3),
  product_id  = c(10, 20, 10, 30, 20),
  amount      = c(50, 100, 50, 200, 100)
)
prod3 <- tibble(
  product_id = c(10, 20, 30),
  tier       = c("standard", "premium", "premium")
)

customer_premium_spend <- cust3 |>
  left_join(ord3, by = "customer_id") |>
  left_join(prod3, by = "product_id") |>
  filter(tier == "premium") |>
  group_by(customer_id, name) |>
  summarise(premium_total = sum(amount), .groups = "drop")

customer_premium_spend
#> # A tibble: 2 × 3
#>   customer_id name  premium_total
#>         <int> <chr>         <dbl>
#> 1           1 Alice           100
#> 2           3 Carol           300
```

Three joins, one filter, one group-summarise. Alice spent 100 on premium products, Carol spent 300, and Bob drops out of the result entirely because he only bought standard items. That's the whole game: chain joins to enrich, filter to scope, group_by+summarise to aggregate.

## Summary

| Verb | Keeps rows from... | Adds columns from right? | Typical use |
|---|---|---|---|
| `inner_join()` | Both sides (matches only) | Yes | Strict "only rows with matches" |
| `left_join()` | Left side (all rows) | Yes (NA where no match) | Default enrichment pattern |
| `right_join()` | Right side (all rows) | Yes | Rare, usually flip args + left_join |
| `full_join()` | Both sides (all unique keys) | Yes (NA where no match) | Union of two partial datasets |
| `semi_join()` | Left side (matches only) | **No** | "Which left rows exist in right?" |
| `anti_join()` | Left side (non-matches only) | **No** | "Which left rows are missing from right?" |

## References

1. dplyr reference, Mutating joins (`inner_join`, `left_join`, etc.). [Link](https://dplyr.tidyverse.org/reference/mutate-joins.html)
2. dplyr reference, Filtering joins (`semi_join`, `anti_join`). [Link](https://dplyr.tidyverse.org/reference/filter-joins.html)
3. Posit tidyverse blog, dplyr 1.1.0 joins overhaul (`relationship` argument). [Link](https://www.tidyverse.org/blog/2023/01/dplyr-1-1-0-joins/)
4. Wickham, H., & Grolemund, G., *R for Data Science*, Chapter 19: Joins. [Link](https://r4ds.hadley.nz/joins.html)
5. R documentation, base `merge()` function. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/merge.html)
6. dplyr two-table verbs vignette. [Link](https://dplyr.tidyverse.org/articles/two-table.html)
7. SQL join types explained (cross-reference for SQL users). [Link](https://www.postgresql.org/docs/current/tutorial-join.html)

## Continue Learning

1. **[dplyr filter() and select()](dplyr-filter-select.html)**, Row and column subsetting, the verbs you'll pair with joins for enrichment pipelines.
2. **[dplyr group_by() and summarise()](dplyr-group-by-summarise.html)**, Aggregate joined data by category, the natural next step after joining.
3. **[pivot_longer() and pivot_wider()](pivot_longer-pivot_wider-Reshape-Data-in-R.html)**, Reshape data before or after joins when your tables are in different shapes.
