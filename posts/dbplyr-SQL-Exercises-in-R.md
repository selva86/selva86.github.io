---
title: "dbplyr / SQL Exercises in R: 20 Real-World Practice Problems"
slug: "dbplyr-SQL-Exercises-in-R"
description: "Practice dbplyr and SQL in R with 20 problems: connections, lazy evaluation, joins, window functions, parameterized SQL. Hidden solutions and explanations."
keywords: "dbplyr R exercises, R SQL exercises, dbplyr practice, dbplyr lazy evaluation, dbplyr window functions, dbplyr show_query"
mathjax: false
webr: false
date: "2026-05-13"
post_type: "EX"
sidebar_title: "dbplyr / SQL Exercises"
sidebar_order: 160
fr_parent: "R-Tutorial.html"
auto_link_terms: "dbplyr r exercises|r sql exercises|dbplyr practice|dbplyr lazy evaluation|dbplyr window functions"
auto_link_case_sensitive: false
target_keyword: "dbplyr SQL R exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# dbplyr / SQL Exercises in R: 20 Real-World Practice Problems

<p class="lead">Twenty practice problems on dbplyr and SQL from R: connecting, translating dplyr to SQL, lazy evaluation, joins, window functions, and parameterized raw SQL. Every solution stays hidden until you click reveal so you can attempt the problem first.</p>

```r title="Run this once before any exercise"
library(dplyr)
library(dbplyr)
library(DBI)
library(RSQLite)

con <- dbConnect(SQLite(), ":memory:")

orders <- data.frame(
  order_id    = 1:12,
  customer_id = c(101, 102, 101, 103, 102, 104, 101, 103, 105, 102, 104, 103),
  product     = c("widget", "gadget", "widget", "gizmo", "gadget", "widget",
                  "gizmo", "widget", "gadget", "widget", "gizmo", "gadget"),
  qty         = c(2, 1, 5, 3, 2, 4, 1, 7, 2, 3, 5, 1),
  unit_price  = c(10, 25, 10, 50, 25, 10, 50, 10, 25, 10, 50, 25),
  order_date  = as.Date("2024-01-01") + c(0, 1, 2, 5, 7, 10, 11, 14, 15, 18, 20, 25)
)
dbWriteTable(con, "orders", orders)

customers <- data.frame(
  customer_id = 101:106,
  region      = c("North", "South", "North", "East", "South", "West"),
  signup_year = c(2021, 2022, 2020, 2023, 2022, 2024)
)
dbWriteTable(con, "customers", customers)
```

## Section 1. Connect, inspect, and write (3 problems)

### Exercise 1.1: List tables in an active SQLite connection

**Task:** A reporting analyst has just inherited an in-memory SQLite database and needs to know which tables are available before writing any queries. Use `dbListTables()` on the `con` object created in the setup block to retrieve a character vector of every table name, then save it to `ex_1_1`.

**Expected result:**

```
#> [1] "customers" "orders"
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- dbListTables(con)
ex_1_1
#> [1] "customers" "orders"
```

**Explanation:** `dbListTables()` is the DBI introspection call that works against any backend (SQLite, Postgres, MySQL, BigQuery), not just SQLite, so this is the same first step you would run against a real production database. SQLite returns names in alphabetical order by default. Pair it with `dbListFields(con, "table_name")` when you need column-level detail. Confused beginners often try `tbl(con)` (no table name), which errors; always pass the table name to `tbl()`.

</details>

### Exercise 1.2: Write a new data frame and confirm it exists

**Task:** Use `dbWriteTable()` to add a small `audit_log` table containing two rows (`event_id` 1 and 2, `event` "boot" and "login") to `con`, then call `dbExistsTable()` to verify the new table is present. Save the logical TRUE/FALSE result of the existence check to `ex_1_2`.

**Expected result:**

```
#> [1] TRUE
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
audit_log <- data.frame(event_id = 1:2, event = c("boot", "login"))
dbWriteTable(con, "audit_log", audit_log)

ex_1_2 <- dbExistsTable(con, "audit_log")
ex_1_2
#> [1] TRUE
```

**Explanation:** `dbWriteTable()` creates the table and inserts rows in one call, which is convenient for staging small reference data. For production loads, use `dbAppendTable()` to add rows to an existing schema without overwriting, or pass `append = TRUE` to `dbWriteTable()`. The `dbExistsTable()` check is cheap and is the right guard before `dbCreateTable()` to avoid the "table already exists" error.

</details>

### Exercise 1.3: Inspect the schema of the orders table

**Task:** Before joining or filtering, a data engineer wants to know which columns the `orders` table contains. Use `dbListFields()` to return the column names of the `orders` table on `con` as a character vector, and save it to `ex_1_3`.

**Expected result:**

```
#> [1] "order_id"    "customer_id" "product"     "qty"         "unit_price"  "order_date"
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- dbListFields(con, "orders")
ex_1_3
#> [1] "order_id"    "customer_id" "product"     "qty"         "unit_price"  "order_date"
```

**Explanation:** `dbListFields()` is faster than `tbl(con, "orders") |> head(0) |> collect() |> names()` because it queries the system catalog rather than the data itself; this matters on tables with billions of rows. On Postgres the column metadata comes from `information_schema.columns`. Use this in scripted pipelines where you cannot hard-code column names because the schema evolves.

</details>

## Section 2. Translate dplyr to SQL (4 problems)

### Exercise 2.1: Filter rows lazily without materializing

**Task:** The audit team only wants orders with `qty` strictly greater than 3 from the `orders` table. Build a lazy dbplyr pipeline using `tbl()` and `filter()` (do NOT call `collect()`), and save the lazy query object to `ex_2_1` so the SQL can later be inspected and reused.

**Expected result:**

```
#> # Source:   SQL [4 x 6]
#> # Database: sqlite ... [:memory:]
#>   order_id customer_id product   qty unit_price order_date
#>      <int>       <dbl> <chr>   <dbl>      <dbl>      <dbl>
#> 1        3         101 widget      5         10      19725
#> 2        6         104 widget      4         10      19733
#> 3        8         103 widget      7         10      19737
#> 4       11         104 gizmo       5         50      19743
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- tbl(con, "orders") |>
  filter(qty > 3)

ex_2_1
#> # Source:   SQL [4 x 6]
#> # Database: sqlite ... [:memory:]
#>   order_id customer_id product   qty unit_price order_date
#>      <int>       <dbl> <chr>   <dbl>      <dbl>      <dbl>
#> 1        3         101 widget      5         10      19725
#> 2        6         104 widget      4         10      19733
#> 3        8         103 widget      7         10      19737
#> 4       11         104 gizmo       5         50      19743
```

**Explanation:** A lazy dbplyr query is not a tibble. It is a recipe that gets compiled to SQL only when you print, collect, or pull. Printing executes a preview (the first 10 rows) and shows the `# Source: SQL` header, which is your visual cue that nothing has been pulled into R yet. The `order_date` is shown as days-since-epoch because SQLite has no native date type. This laziness is what lets dbplyr push joins, filters, and aggregations down to the database where they belong.

</details>

### Exercise 2.2: Inspect generated SQL with show_query

**Task:** A junior analyst wants to verify the SQL that dbplyr generates for a filter + select pipeline before running it against a multi-terabyte warehouse. Build a pipeline that filters `orders` to `qty > 3`, selects only `order_id, product, qty`, then pipes the result through `show_query()`. Save the lazy query (not the printed SQL) to `ex_2_2`.

**Expected result:**

```
#> <SQL>
#> SELECT `order_id`, `product`, `qty`
#> FROM `orders`
#> WHERE (`qty` > 3.0)
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- tbl(con, "orders") |>
  filter(qty > 3) |>
  select(order_id, product, qty)

ex_2_2 |> show_query()
#> <SQL>
#> SELECT `order_id`, `product`, `qty`
#> FROM `orders`
#> WHERE (`qty` > 3.0)
```

**Explanation:** `show_query()` is your primary debugging tool when a query is slow or returns wrong rows: it prints the SQL dbplyr will send to the backend so you can paste it into a database client, run EXPLAIN, or share it with a DBA. The order of dplyr verbs maps to clause order, so `filter()` becomes WHERE and `select()` becomes the column list. If you want a subquery instead of flattened SQL, force one with `compute()` mid-pipeline.

</details>

### Exercise 2.3: Compute a revenue column with mutate

**Task:** The finance team wants a flat extract of every order with a derived `revenue` column equal to `qty * unit_price`. Build a dbplyr pipeline that mutates this column on `tbl(con, "orders")`, then `collect()` the result so it is materialized as a local tibble. Save the local tibble to `ex_2_3`.

**Expected result:**

```
#> # A tibble: 12 x 7
#>    order_id customer_id product   qty unit_price order_date revenue
#>       <int>       <dbl> <chr>   <dbl>      <dbl>      <dbl>   <dbl>
#>  1        1         101 widget      2         10      19723      20
#>  2        2         102 gadget      1         25      19724      25
#>  3        3         101 widget      5         10      19725      50
#>  4        4         103 gizmo       3         50      19728     150
#>  5        5         102 gadget      2         25      19730      50
#>  6        6         104 widget      4         10      19733      40
#>  7        7         101 gizmo       1         50      19734      50
#>  8        8         103 widget      7         10      19737      70
#>  9        9         105 gadget      2         25      19738      50
#> 10       10         102 widget      3         10      19741      30
#> 11       11         104 gizmo       5         50      19743     250
#> 12       12         103 gadget      1         25      19748      25
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- tbl(con, "orders") |>
  mutate(revenue = qty * unit_price) |>
  collect()

ex_2_3
#> # A tibble: 12 x 7
#>    order_id customer_id product   qty unit_price order_date revenue
#>       <int>       <dbl> <chr>   <dbl>      <dbl>      <dbl>   <dbl>
#>  1        1         101 widget      2         10      19723      20
#>  2        2         102 gadget      1         25      19724      25
#> # 10 more rows hidden
```

**Explanation:** `mutate()` translates to a `SELECT col1, col2, qty * unit_price AS revenue` projection, computed inside the database, then `collect()` pulls the result over the wire. For a small table this is fine; for huge tables you almost always want to also filter or aggregate before collect. The `order_date` column comes back as a numeric (days since epoch) because RSQLite does not roundtrip the Date class; pipe through `mutate(order_date = as.Date(order_date, origin = "1970-01-01"))` after collect if you need Date semantics in R.

</details>

### Exercise 2.4: Aggregate revenue by product

**Task:** The product manager needs total revenue by product across all orders. Build a dbplyr pipeline that groups `orders` by `product`, computes `total_revenue = sum(qty * unit_price)`, collects to a local tibble, and arranges by descending revenue. Save the resulting tibble to `ex_2_4`.

**Expected result:**

```
#> # A tibble: 3 x 2
#>   product total_revenue
#>   <chr>           <dbl>
#> 1 gizmo             450
#> 2 widget            210
#> 3 gadget            150
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_4 <- tbl(con, "orders") |>
  group_by(product) |>
  summarise(total_revenue = sum(qty * unit_price, na.rm = TRUE)) |>
  arrange(desc(total_revenue)) |>
  collect()

ex_2_4
#> # A tibble: 3 x 2
#>   product total_revenue
#>   <chr>           <dbl>
#> 1 gizmo             450
#> 2 widget            210
#> 3 gadget            150
```

**Explanation:** `group_by()` plus `summarise()` becomes GROUP BY in SQL, and `arrange(desc())` becomes ORDER BY ... DESC. The expression `sum(qty * unit_price)` is computed inside the aggregation, so the database does the math, not R. Use `arrange()` BEFORE `collect()` if the result set is large; sorting in the database is far cheaper than pulling everything and then sorting in R. Always pass `na.rm = TRUE` in `sum()` for production code or NULLs will silently poison your totals.

</details>

## Section 3. Lazy evaluation and collection (3 problems)

### Exercise 3.1: Compare classes of lazy versus collected queries

**Task:** A code reviewer wants you to demonstrate the difference between a dbplyr lazy query and a local tibble. Build a filter pipeline on `orders` (any condition), then capture two class vectors: the class of the lazy object and the class of the same object after `collect()`. Save them as a named list with elements `lazy` and `local` to `ex_3_1`.

**Expected result:**

```
#> $lazy
#> [1] "tbl_SQLiteConnection" "tbl_dbi"              "tbl_sql"              "tbl_lazy"            
#> [5] "tbl"                 
#> 
#> $local
#> [1] "tbl_df"     "tbl"        "data.frame"
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
lazy_q  <- tbl(con, "orders") |> filter(qty > 3)
local_t <- lazy_q |> collect()

ex_3_1 <- list(lazy = class(lazy_q), local = class(local_t))
ex_3_1
#> $lazy
#> [1] "tbl_SQLiteConnection" "tbl_dbi"              "tbl_sql"              "tbl_lazy"            
#> [5] "tbl"                 
#> 
#> $local
#> [1] "tbl_df"     "tbl"        "data.frame"
```

**Explanation:** The class vector tells you where computation happens. `tbl_sql` means the object holds a SQL query and dispatches dplyr verbs to SQL translation; `tbl_df` means it is a regular tibble in memory and dplyr verbs evaluate in R via base/Rcpp. Forgetting `collect()` is a common bug source: you pass a `tbl_sql` into a function expecting a `data.frame` and get errors like "no applicable method" or, worse, partial results because `head()` defaults differ across backends.

</details>

### Exercise 3.2: Peek at the first three rows without pulling everything

**Task:** When prototyping against a billion-row table, you never want to collect the whole thing. Build a pipeline that uses `head(n = 3)` on `tbl(con, "orders")` then `collect()` to pull just those three rows. Save the resulting three-row tibble to `ex_3_2`.

**Expected result:**

```
#> # A tibble: 3 x 6
#>   order_id customer_id product   qty unit_price order_date
#>      <int>       <dbl> <chr>   <dbl>      <dbl>      <dbl>
#> 1        1         101 widget      2         10      19723
#> 2        2         102 gadget      1         25      19724
#> 3        3         101 widget      5         10      19725
```

**Difficulty:** Beginner

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- tbl(con, "orders") |>
  head(n = 3) |>
  collect()

ex_3_2
#> # A tibble: 3 x 6
#>   order_id customer_id product   qty unit_price order_date
#>      <int>       <dbl> <chr>   <dbl>      <dbl>      <dbl>
#> 1        1         101 widget      2         10      19723
#> 2        2         102 gadget      1         25      19724
#> 3        3         101 widget      5         10      19725
```

**Explanation:** `head()` on a lazy query becomes `LIMIT 3` in SQL, so only three rows ever travel from the database to R. Compare this to `tbl(con, "orders") |> collect() |> head(3)`, which pulls EVERYTHING and then takes the first three locally. The difference can be the gap between a 50ms query and a 30-minute one. As a rule, push `head()`, `filter()`, `arrange()`, and aggregations BEFORE the `collect()` call.

</details>

### Exercise 3.3: Materialize a query as a temporary table with compute

**Task:** An ETL pipeline owner wants to compute a derived per-customer revenue summary once and reuse it across several downstream queries without re-running the aggregation. Build a grouped summary on `orders` (sum of `qty * unit_price` per `customer_id`), pipe through `compute()` to create a temporary table on the connection, then list all tables on `con` and save the character vector to `ex_3_3`.

**Expected result:**

```
#> [1] "audit_log"            "customers"            "dbplyr_<random_hash>" "orders"
```

**Difficulty:** Advanced

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
tbl(con, "orders") |>
  group_by(customer_id) |>
  summarise(rev = sum(qty * unit_price, na.rm = TRUE)) |>
  compute(name = "rev_by_cust", temporary = TRUE)

ex_3_3 <- dbListTables(con)
ex_3_3
#> [1] "audit_log"   "customers"   "orders"      "rev_by_cust"
```

**Explanation:** `compute()` issues a `CREATE TEMPORARY TABLE ... AS SELECT ...` against the backend, persisting the result inside the database session. Subsequent `tbl(con, "rev_by_cust")` calls hit that materialized table instead of re-running the aggregation. Use it when a derived dataset feeds multiple downstream queries; the alternative, `collapse()`, only wraps the existing query in a subquery without materializing. Drop temp tables with `dbRemoveTable(con, "rev_by_cust")` when finished to free memory.

</details>

## Section 4. Joins across tables (3 problems)

### Exercise 4.1: Inner join orders with customer reference data

**Task:** The reporting team needs every order enriched with its customer's `region` and `signup_year`. Build a dbplyr pipeline that inner-joins `tbl(con, "orders")` with `tbl(con, "customers")` on `customer_id`, collects to a local tibble, and arranges by `order_id`. Save the result to `ex_4_1`.

**Expected result:**

```
#> # A tibble: 12 x 8
#>    order_id customer_id product   qty unit_price order_date region signup_year
#>       <int>       <dbl> <chr>   <dbl>      <dbl>      <dbl> <chr>        <dbl>
#>  1        1         101 widget      2         10      19723 North         2021
#>  2        2         102 gadget      1         25      19724 South         2022
#>  3        3         101 widget      5         10      19725 North         2021
#>  4        4         103 gizmo       3         50      19728 North         2020
#>  5        5         102 gadget      2         25      19730 South         2022
#> # 7 more rows hidden
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- inner_join(
  tbl(con, "orders"),
  tbl(con, "customers"),
  by = "customer_id"
) |>
  arrange(order_id) |>
  collect()

ex_4_1
#> # A tibble: 12 x 8
#>    order_id customer_id product   qty unit_price order_date region signup_year
#>       <int>       <dbl> <chr>   <dbl>      <dbl>      <dbl> <chr>        <dbl>
#>  1        1         101 widget      2         10      19723 North         2021
#>  2        2         102 gadget      1         25      19724 South         2022
#> # 10 more rows hidden
```

**Explanation:** dbplyr translates `inner_join()` to an `INNER JOIN ... USING (customer_id)` clause that runs entirely on the database. Both inputs MUST be `tbl()` references against the SAME connection; you cannot mix a local data frame with a lazy tbl in a join without first uploading the local data via `copy_to()`. Joining a local frame against a remote one is a classic mistake that errors with "all inputs must have the same source." Always check `show_query()` on a new join before running it against production.

</details>

### Exercise 4.2: Left join to keep customers without orders

**Task:** The customer success team wants a customer-centric view: every customer should appear, with their orders listed if any exist, and NULL columns for customers who have not placed an order. Build a left join from `customers` to `orders` on `customer_id`, collect locally, arrange by `customer_id`, and save to `ex_4_2`.

**Expected result:**

```
#> # A tibble: 13 x 8
#>    customer_id region signup_year order_id product   qty unit_price order_date
#>          <int> <chr>        <dbl>    <int> <chr>   <dbl>      <dbl>      <dbl>
#>  1         101 North         2021        1 widget      2         10      19723
#>  2         101 North         2021        3 widget      5         10      19725
#>  3         101 North         2021        7 gizmo       1         50      19734
#>  4         102 South         2022        2 gadget      1         25      19724
#>  5         102 South         2022        5 gadget      2         25      19730
#> # 7 more rows hidden, including customer 106 with NA orders
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- left_join(
  tbl(con, "customers"),
  tbl(con, "orders"),
  by = "customer_id"
) |>
  arrange(customer_id) |>
  collect()

ex_4_2
#> # A tibble: 13 x 8
#>    customer_id region signup_year order_id product   qty unit_price order_date
#>          <int> <chr>        <dbl>    <int> <chr>   <dbl>      <dbl>      <dbl>
#> # ... rows for customers 101-105 with their orders ...
#> 13         106 West          2024       NA  NA         NA         NA         NA
```

**Explanation:** Customer 106 has no rows in `orders`, so the left join emits a single row with all the right-side columns as NA. The result has 13 rows: 12 from matched orders plus the single NA row for 106. Note SQL's NULL becomes R's NA on collect. This is the right shape for a "which customers have not yet ordered" report. If you want only matched rows, switch to `inner_join()`; if you want a strict anti-join, use `anti_join()` (see the next exercise).

</details>

### Exercise 4.3: Find customers with no orders using anti_join

**Task:** Marketing wants a re-engagement list: every customer in `customers` who has never appeared in `orders`. Build a dbplyr `anti_join()` from `customers` against `orders` keyed on `customer_id`, collect to a local tibble, and save to `ex_4_3`.

**Expected result:**

```
#> # A tibble: 1 x 3
#>   customer_id region signup_year
#>         <int> <chr>        <dbl>
#> 1         106 West          2024
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- anti_join(
  tbl(con, "customers"),
  tbl(con, "orders"),
  by = "customer_id"
) |>
  collect()

ex_4_3
#> # A tibble: 1 x 3
#>   customer_id region signup_year
#>         <int> <chr>        <dbl>
#> 1         106 West          2024
```

**Explanation:** `anti_join()` keeps only rows from the left input whose key is NOT present in the right input, translating to either `NOT EXISTS (SELECT 1 FROM ...)` or `LEFT JOIN ... WHERE right.key IS NULL` depending on the backend dialect. It returns only the columns of the LEFT input, which is exactly what you want for an "uncovered" list. The mirror operation is `semi_join()`: keep left rows that DO have a match on the right, again returning only left columns. Anti-joins beat manual `filter(!customer_id %in% ...)` because they push everything to the database engine.

</details>

## Section 5. Window functions and ranking (4 problems)

### Exercise 5.1: Rank orders within each product by quantity

**Task:** The supply chain team wants the orders of each `product` ranked from largest `qty` down to smallest. Group `orders` by `product`, add a `rk` column using `row_number(desc(qty))`, ungroup, collect to a local tibble, and arrange by product and rank. Save the result to `ex_5_1`.

**Expected result:**

```
#> # A tibble: 12 x 7
#>    order_id customer_id product   qty unit_price order_date    rk
#>       <int>       <dbl> <chr>   <dbl>      <dbl>      <dbl> <int>
#>  1        2         102 gadget      2         25      19724     1
#>  2        5         102 gadget      2         25      19730     2
#>  3        9         105 gadget      2         25      19738     3
#>  4       12         103 gadget      1         25      19748     4
#>  5        4         103 gizmo       3         50      19728     2
#>  6        7         101 gizmo       1         50      19734     3
#>  7       11         104 gizmo       5         50      19743     1
#>  8        1         101 widget      2         10      19723     5
#>  9        3         101 widget      5         10      19725     2
#> # 3 more rows hidden
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- tbl(con, "orders") |>
  group_by(product) |>
  mutate(rk = row_number(desc(qty))) |>
  ungroup() |>
  arrange(product, rk) |>
  collect()

ex_5_1
#> # A tibble: 12 x 7
#> # ... ranks 1, 2, 3, 4 within each of gadget, gizmo, widget ...
```

**Explanation:** `mutate()` inside `group_by()` becomes a window function in SQL: `ROW_NUMBER() OVER (PARTITION BY product ORDER BY qty DESC)`. The `desc()` wrapper translates to the SQL `DESC` keyword. Always `ungroup()` after a windowed mutate or downstream verbs may keep the grouping silently and emit surprising results. Use `min_rank()` instead of `row_number()` if you want ties to share a rank, or `dense_rank()` if you want no gaps after ties.

</details>

### Exercise 5.2: Cumulative revenue ordered by date

**Task:** A finance lead is preparing a daily YTD revenue chart and needs the running total of revenue (`qty * unit_price`) over the order timeline. Build a pipeline on `tbl(con, "orders")` that adds `revenue` via `mutate()`, then a `cum_rev` column using `cumsum()` ordered by `order_date` with `window_order()`, collects, arranges by date, and saves to `ex_5_2`.

**Expected result:**

```
#> # A tibble: 12 x 8
#>    order_id customer_id product   qty unit_price order_date revenue cum_rev
#>       <int>       <dbl> <chr>   <dbl>      <dbl>      <dbl>   <dbl>   <dbl>
#>  1        1         101 widget      2         10      19723      20      20
#>  2        2         102 gadget      1         25      19724      25      45
#>  3        3         101 widget      5         10      19725      50      95
#>  4        4         103 gizmo       3         50      19728     150     245
#>  5        5         102 gadget      2         25      19730      50     295
#>  6        6         104 widget      4         10      19733      40     335
#>  7        7         101 gizmo       1         50      19734      50     385
#>  8        8         103 widget      7         10      19737      70     455
#>  9        9         105 gadget      2         25      19738      50     505
#> 10       10         102 widget      3         10      19741      30     535
#> 11       11         104 gizmo       5         50      19743     250     785
#> 12       12         103 gadget      1         25      19748      25     810
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_2 <- tbl(con, "orders") |>
  window_order(order_date) |>
  mutate(
    revenue = qty * unit_price,
    cum_rev = cumsum(revenue)
  ) |>
  arrange(order_date) |>
  collect()

ex_5_2
#> # A tibble: 12 x 8
#> # ... cum_rev runs 20, 45, 95, 245, 295, 335, 385, 455, 505, 535, 785, 810 ...
```

**Explanation:** `cumsum()` inside a windowed mutate translates to `SUM(revenue) OVER (ORDER BY order_date ROWS UNBOUNDED PRECEDING)`. `window_order()` tells dbplyr the ordering clause to apply to subsequent window functions; without it you get a warning and the backend picks an order. Combine `window_order()` with `group_by()` (or `window_frame()`) when you want a per-partition cumulative; here we want the global running total, so we use `window_order()` alone.

</details>

### Exercise 5.3: Previous quantity per customer with lag

**Task:** A growth analyst wants to see, for each customer, the quantity of their PREVIOUS order ordered chronologically by `order_date`. Add a `prev_qty` column using `lag(qty)` with `window_order(order_date)` inside `group_by(customer_id)`, ungroup, collect, arrange by customer and date, and save to `ex_5_3`.

**Expected result:**

```
#> # A tibble: 12 x 7
#>    order_id customer_id product   qty order_date unit_price prev_qty
#>       <int>       <dbl> <chr>   <dbl>      <dbl>      <dbl>    <dbl>
#>  1        1         101 widget      2      19723         10       NA
#>  2        3         101 widget      5      19725         10        2
#>  3        7         101 gizmo       1      19734         50        5
#>  4        2         102 gadget      1      19724         25       NA
#>  5        5         102 gadget      2      19730         25        1
#>  6       10         102 widget      3      19741         10        2
#>  7        4         103 gizmo       3      19728         50       NA
#>  8        8         103 widget      7      19737         10        3
#>  9       12         103 gadget      1      19748         25        7
#> 10        6         104 widget      4      19733         10       NA
#> 11       11         104 gizmo       5      19743         50        4
#> 12        9         105 gadget      2      19738         25       NA
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_3 <- tbl(con, "orders") |>
  group_by(customer_id) |>
  window_order(order_date) |>
  mutate(prev_qty = lag(qty)) |>
  ungroup() |>
  arrange(customer_id, order_date) |>
  collect()

ex_5_3
#> # A tibble: 12 x 7
#> # ... NA for the first order per customer, then the prior qty ...
```

**Explanation:** `lag(qty)` becomes `LAG(qty) OVER (PARTITION BY customer_id ORDER BY order_date)`. The first row in each partition has no predecessor, so SQL emits NULL and R sees NA. This pattern is the backbone of churn analysis, retention curves, and session-stitching: a single `lag()` per group reveals "what did each customer just do?" without writing any explicit SQL. Use `lag(qty, n = 2)` for the order before the previous, or `lead(qty)` for the NEXT order's quantity.

</details>

### Exercise 5.4: Top product per customer by revenue

**Task:** The CRM team wants a one-row-per-customer summary listing each customer's TOP-grossing product. For every (customer, product) pair compute total revenue, rank by descending revenue within each customer, keep only rank 1, collect, arrange by `customer_id`, and save the resulting tibble to `ex_5_4`.

**Expected result:**

```
#> # A tibble: 5 x 4
#>   customer_id product   total_rev    rk
#>         <dbl> <chr>         <dbl> <int>
#> 1         101 widget           70     1
#> 2         102 gadget           75     1
#> 3         103 gizmo           150     1
#> 4         104 gizmo           250     1
#> 5         105 gadget           50     1
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_4 <- # your code here
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_4 <- tbl(con, "orders") |>
  group_by(customer_id, product) |>
  summarise(total_rev = sum(qty * unit_price, na.rm = TRUE), .groups = "drop") |>
  group_by(customer_id) |>
  mutate(rk = row_number(desc(total_rev))) |>
  ungroup() |>
  filter(rk == 1) |>
  arrange(customer_id) |>
  collect()

ex_5_4
#> # A tibble: 5 x 4
#>   customer_id product   total_rev    rk
#>         <dbl> <chr>         <dbl> <int>
#> 1         101 widget           70     1
#> 2         102 gadget           75     1
#> 3         103 gizmo           150     1
#> 4         104 gizmo           250     1
#> 5         105 gadget           50     1
```

**Explanation:** This is the classic "top-N within a group" pattern. The first `group_by + summarise` collapses every (customer, product) pair to one row. The second `group_by + mutate` adds a within-customer ranking. The final `filter(rk == 1)` keeps the winner; switch to `rk <= 3` for top-3 per customer. Avoid `slice_max()` here on dbplyr versions older than 2.4 because translation support has historically been spotty; the explicit `row_number()` + `filter()` form is portable across all backends.

</details>

## Section 6. Raw SQL and parameterized queries (3 problems)

### Exercise 6.1: Run a raw aggregation with dbGetQuery

**Task:** When dbplyr cannot express what you need (or you just want to sanity-check a result), drop down to raw SQL. Use `dbGetQuery()` to run a single statement that returns customer count per `region` from the `customers` table, ordered alphabetically by region. Save the returned data frame to `ex_6_1`.

**Expected result:**

```
#>   region n
#> 1   East 1
#> 2  North 2
#> 3  South 2
#> 4   West 1
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_1 <- dbGetQuery(
  con,
  "SELECT region, COUNT(*) AS n FROM customers GROUP BY region ORDER BY region"
)
ex_6_1
#>   region n
#> 1   East 1
#> 2  North 2
#> 3  South 2
#> 4   West 1
```

**Explanation:** `dbGetQuery()` is the one-shot path for SELECT statements: prepare, execute, fetch all rows, free the result, return a data frame. It is the right tool for small ad-hoc queries. For statements that DO NOT return rows (INSERT, UPDATE, DELETE, CREATE), use `dbExecute()`, which returns the affected row count instead. Never paste user input directly into the SQL string; use parameterized queries (next exercise) to prevent SQL injection.

</details>

### Exercise 6.2: Parameterize a query to prevent SQL injection

**Task:** A web application accepts a `customer_id` from user input and returns that customer's orders. Build a parameterized query using `dbSendQuery()`, `dbBind()`, `dbFetch()`, and `dbClearResult()` to safely pull all orders for `customer_id = 101`. Save the returned data frame to `ex_6_2`.

**Expected result:**

```
#>   order_id customer_id product qty unit_price order_date
#> 1        1         101  widget   2         10      19723
#> 2        3         101  widget   5         10      19725
#> 3        7         101   gizmo   1         50      19734
```

**Difficulty:** Advanced

```r title="Your turn"
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
rs <- dbSendQuery(con, "SELECT * FROM orders WHERE customer_id = ?")
dbBind(rs, list(101L))
ex_6_2 <- dbFetch(rs)
dbClearResult(rs)

ex_6_2
#>   order_id customer_id product qty unit_price order_date
#> 1        1         101  widget   2         10      19723
#> 2        3         101  widget   5         10      19725
#> 3        7         101   gizmo   1         50      19734
```

**Explanation:** Placeholder syntax varies by backend: SQLite, MySQL, and ODBC use `?`, while Postgres uses `$1, $2, ...`. The DBI layer abstracts these into the same `dbBind()` API. Parameterized queries serialize values as DATA, never as code, so an attacker who passes `1 OR 1=1` cannot turn it into a destructive statement. The four-call sequence (`dbSendQuery` -> `dbBind` -> `dbFetch` -> `dbClearResult`) is also more efficient when reused, because the database compiles the plan once and then re-binds across many executions. Always `dbClearResult()` to free the server-side cursor.

</details>

### Exercise 6.3: Inline backend-specific SQL with sql for vendor functions

**Task:** SQLite has no native Date type but ships a `strftime()` function that extracts components from ISO date strings. Use `tbl(con, "orders")` with `mutate()` and `dplyr::sql()` to add a `year` column built from `strftime('%Y', order_date)`, collect a small slice (`head(3)`), and save to `ex_6_3`.

**Expected result:**

```
#> # A tibble: 3 x 7
#>   order_id customer_id product   qty unit_price order_date year 
#>      <int>       <dbl> <chr>   <dbl>      <dbl>      <dbl> <chr>
#> 1        1         101 widget      2         10      19723 2024 
#> 2        2         102 gadget      1         25      19724 2024 
#> 3        3         101 widget      5         10      19725 2024
```

**Difficulty:** Advanced

```r title="Your turn"
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_3 <- tbl(con, "orders") |>
  mutate(year = sql("strftime('%Y', order_date)")) |>
  head(3) |>
  collect()

ex_6_3
#> # A tibble: 3 x 7
#>   order_id customer_id product   qty unit_price order_date year 
#>      <int>       <dbl> <chr>   <dbl>      <dbl>      <dbl> <chr>
#> 1        1         101 widget      2         10      19723 2024 
#> 2        2         102 gadget      1         25      19724 2024 
#> 3        3         101 widget      5         10      19725 2024
```

**Explanation:** `dplyr::sql()` is the escape hatch for backend functions dbplyr does not know how to translate: window frames you cannot express, JSON extractors, geospatial operators, regex flavors. The string you pass is inlined verbatim into the generated SQL, so you are responsible for getting the dialect right (here `strftime` is SQLite specific; Postgres would want `to_char(order_date, 'YYYY')`). For maximum portability, isolate vendor-specific SQL behind a helper function and swap implementations by backend. Always confirm with `show_query()` after using `sql()`.

</details>

## What to do next

- [dplyr Exercises in R](dplyr-Exercises-in-R.html): the in-memory dplyr counterpart; practice the same verbs against local tibbles to build the muscle memory you will lean on with dbplyr.
- [Data Wrangling Exercises in R](Data-Wrangling-Exercises-in-R.html): broader transformation problems across tidyr, dplyr, and joins.
- [SQL Joins in R](SQL-Joins-in-R.html): conceptual reference for inner, left, anti, and semi joins as they map to SQL.
- [R Tutorial](R-Tutorial.html): the parent learning path with the full database access curriculum.
