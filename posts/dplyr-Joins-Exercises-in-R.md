---
title: "dplyr Joins Exercises in R: 30 Practice Problems"
slug: "dplyr-Joins-Exercises-in-R"
description: "Master dplyr joins with 30 practice problems: left, right, inner, full, semi, anti, multi-key, inequality, rolling. Hidden solutions."
keywords: "dplyr joins exercises, joins in R exercises, left_join exercises R, dplyr joins practice, R join exercises"
mathjax: false
webr: true
date: "2026-05-11"
post_type: "EX"
sidebar_title: "dplyr Joins Exercises"
sidebar_order: 121
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "dplyr joins exercises|joins in R exercises|left_join exercises|dplyr joins practice"
auto_link_case_sensitive: false
target_keyword: "dplyr joins exercises"
sibling_block_enabled: false
difficulty: "Intermediate"
---

# dplyr Joins Exercises in R: 30 Practice Problems

<p class="lead">Thirty practice problems on dplyr joins: left, right, inner, full, semi, anti, multi-key, inequality, and rolling. Hidden solutions.</p>

```r title="Run this once before any exercise"
library(dplyr)
library(tibble)
```

```r title="Setup tables for the exercises"
customers <- tibble(id = 1:5, name = c("Alice","Bob","Carol","Dan","Eve"))
orders    <- tibble(order_id = 101:106, customer_id = c(1, 2, 7, 3, 9, 1),
                    amount = c(50, 80, 30, 65, 120, 25))
products  <- tibble(product_id = 1:3, name = c("X","Y","Z"))
```

## Section 1. Basic joins (8 problems)

### Exercise 1.1: left_join

**Difficulty:** Beginner. Augment customers with orders.

<details><summary>Show solution</summary>

```r
customers |> left_join(orders, by = c("id" = "customer_id"))
```

</details>

### Exercise 1.2: right_join

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
customers |> right_join(orders, by = c("id" = "customer_id"))
```

</details>

### Exercise 1.3: inner_join

**Difficulty:** Beginner. Only matching rows.

<details><summary>Show solution</summary>

```r
customers |> inner_join(orders, by = c("id" = "customer_id"))
```

</details>

### Exercise 1.4: full_join

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
customers |> full_join(orders, by = c("id" = "customer_id"))
```

</details>

### Exercise 1.5: semi_join

**Difficulty:** Intermediate. Customers WITH at least one order; no order columns added.

<details><summary>Show solution</summary>

```r
customers |> semi_join(orders, by = c("id" = "customer_id"))
```

</details>

### Exercise 1.6: anti_join

**Difficulty:** Intermediate. Customers without orders.

<details><summary>Show solution</summary>

```r
customers |> anti_join(orders, by = c("id" = "customer_id"))
```

</details>

### Exercise 1.7: cross_join

**Difficulty:** Intermediate. All combinations.

<details><summary>Show solution</summary>

```r
tibble(a = 1:3) |> cross_join(tibble(b = c("x","y")))
```

</details>

### Exercise 1.8: nest_join

**Difficulty:** Advanced. Each customer with a list-column of their orders.

<details><summary>Show solution</summary>

```r
customers |> nest_join(orders, by = c("id" = "customer_id"))
```

</details>

## Section 2. Multi-key and key tricks (6 problems)

### Exercise 2.1: Multi-key vector

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
sales <- tibble(region = c("US","EU"), product = c("X","X"), qty = c(100,50))
prices <- tibble(region = c("US","EU"), product = c("X","X"), price = c(10,12))
sales |> left_join(prices, by = c("region","product"))
```

</details>

### Exercise 2.2: Different key names with c()

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
customers |> left_join(orders, by = c("id" = "customer_id"))
```

</details>

### Exercise 2.3: join_by syntax

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
customers |> left_join(orders, by = join_by(id == customer_id))
```

</details>

### Exercise 2.4: Suffix on collisions

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
a <- tibble(id = 1:2, name = c("A","B"))
b <- tibble(id = 1:2, name = c("X","Y"))
a |> inner_join(b, by = "id", suffix = c("_a","_b"))
```

</details>

### Exercise 2.5: relationship = "one-to-one"

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
a <- tibble(id = 1:3, val = 10:12)
b <- tibble(id = 1:3, info = c("x","y","z"))
a |> left_join(b, by = "id", relationship = "one-to-one")
```

</details>

### Exercise 2.6: relationship = "many-to-many"

**Difficulty:** Advanced. Acknowledge intentional explosion.

<details><summary>Show solution</summary>

```r
a <- tibble(id = c(1, 1, 2), x = c("a","b","c"))
b <- tibble(id = c(1, 1, 2), y = c("p","q","r"))
a |> left_join(b, by = "id", relationship = "many-to-many")
```

</details>

## Section 3. Inequality and rolling (6 problems)

### Exercise 3.1: Inequality join_by

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
txns <- tibble(id = 1:3, amount = c(50, 200, 1500))
tiers <- tibble(min_amount = c(0, 100, 1000), tier = c("micro","small","medium"))
txns |> left_join(tiers, by = join_by(closest(amount >= min_amount)))
```

</details>

### Exercise 3.2: Range overlap (between)

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
events <- tibble(id = 1:2, t = c(10, 50))
windows <- tibble(start = c(0, 40), end = c(20, 60), label = c("A","B"))
events |> left_join(windows, by = join_by(between(t, start, end)))
```

</details>

### Exercise 3.3: Rolling join via closest

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
prices <- tibble(time = c(0, 10, 20), price = c(100, 105, 110))
queries <- tibble(time = c(5, 15, 25))
queries |> left_join(prices, by = join_by(closest(time >= time)))
```

</details>

### Exercise 3.4: Strict inequality

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
a <- tibble(x = c(5, 15, 25))
b <- tibble(threshold = c(10, 20), level = c("low","mid"))
a |> left_join(b, by = join_by(x > threshold))
```

</details>

### Exercise 3.5: Time-window match

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
a <- tibble(ts = as.POSIXct(c("2024-01-15 10:00","2024-01-15 11:00")))
b <- tibble(start = as.POSIXct(c("2024-01-15 09:00","2024-01-15 10:30")),
            end   = as.POSIXct(c("2024-01-15 10:30","2024-01-15 12:00")),
            tag   = c("morn","late_morn"))
a |> left_join(b, by = join_by(between(ts, start, end)))
```

</details>

### Exercise 3.6: Multi-condition join_by

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
a <- tibble(region = c("US","EU"), x = c(50, 200))
b <- tibble(region = c("US","US","EU"), threshold = c(10, 100, 100), tier = c("a","b","c"))
a |> left_join(b, by = join_by(region == region, closest(x >= threshold)))
```

</details>

## Section 4. Reconciliation patterns (5 problems)

### Exercise 4.1: Detect added rows

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
prev <- tibble(id = 1:5)
curr <- tibble(id = c(2,3,5,6))
curr |> anti_join(prev, by = "id")
```

</details>

### Exercise 4.2: Detect removed rows

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
prev <- tibble(id = 1:5)
curr <- tibble(id = c(2,3,5,6))
prev |> anti_join(curr, by = "id")
```

</details>

### Exercise 4.3: Detect changes (full diff)

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
prev <- tibble(id = 1:3, val = c(10, 20, 30))
curr <- tibble(id = 1:3, val = c(10, 25, 30))
prev |> inner_join(curr, by = "id", suffix = c("_p","_c")) |>
  filter(val_p != val_c)
```

</details>

### Exercise 4.4: Full upsert with coalesce

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
prev <- tibble(id = 1:3, val = c(10, 20, 30))
curr <- tibble(id = 2:4, val = c(25, NA, 40))
prev |> full_join(curr, by = "id", suffix = c("_p","_c")) |>
  mutate(val = coalesce(val_c, val_p)) |> select(id, val)
```

</details>

### Exercise 4.5: Find unmatched on either side

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
a <- tibble(id = 1:3)
b <- tibble(id = 2:4)
list(only_a = anti_join(a, b, by = "id"),
     only_b = anti_join(b, a, by = "id"))
```

</details>

## Section 5. Real workflows (5 problems)

### Exercise 5.1: Lookup + augment

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
mt <- mtcars |> tibble::rownames_to_column("car")
labels <- tibble(cyl = c(4, 6, 8), label = c("small","mid","large"))
mt |> left_join(labels, by = "cyl") |> head()
```

</details>

### Exercise 5.2: Latest record per group + join

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
sales <- tibble(prod = rep(c("X","Y"), each = 3),
                date = as.Date(rep(c("2024-01-01","2024-02-01","2024-03-01"), 2)),
                qty = c(10, 20, 30, 40, 50, 60))
info <- tibble(prod = c("X","Y"), category = c("hw","tool"))
sales |> slice_max(date, n = 1, by = prod) |> left_join(info, by = "prod")
```

</details>

### Exercise 5.3: Order summary per customer

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
customer_summary <- orders |>
  group_by(customer_id) |>
  summarise(n = n(), total = sum(amount), .groups = "drop")
customers |> left_join(customer_summary, by = c("id" = "customer_id"))
```

</details>

### Exercise 5.4: Aggregate child counts on parent

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
orders_count <- orders |> count(customer_id, name = "n_orders")
customers |> left_join(orders_count, by = c("id" = "customer_id")) |>
  mutate(n_orders = coalesce(n_orders, 0L))
```

</details>

### Exercise 5.5: Multi-table reduce join

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
dfs <- list(tibble(id = 1:3, a = 10:12),
            tibble(id = 1:3, b = 20:22),
            tibble(id = 1:3, c = 30:32))
purrr::reduce(dfs, inner_join, by = "id")
```

</details>

## What to do next

- **dplyr-Exercises** (shipped) — broader dplyr drills.
- **dplyr-Window-Functions-Exercises** (coming) — lead/lag/rank focus.
