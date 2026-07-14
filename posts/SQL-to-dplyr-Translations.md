---
title: "SQL to dplyr: 30 Translations Every Analyst Needs"
slug: "SQL-to-dplyr-Translations"
description: "SQL to dplyr: 30 worked translations for analysts moving from SQL to R. SELECT, WHERE, GROUP BY, HAVING, joins, window functions and CASE WHEN, solved."
keywords: "sql to dplyr, sql to dplyr translation, dplyr for sql users, sql in R, dplyr equivalents of sql, group by dplyr, sql joins in dplyr, window functions dplyr"
mathjax: false
webr: true
date: "2026-07-15"
post_type: "EX"
sidebar_title: "SQL to dplyr Translations"
sidebar_order: 150
fr_parent: "dplyr-Exercises-in-R.html"
auto_link_terms: "sql to dplyr|dplyr for sql users|sql to dplyr translation|dplyr equivalents|translate sql to dplyr"
auto_link_case_sensitive: false
target_keyword: "sql to dplyr"
sibling_block_enabled: false
difficulty: "Mixed"
---

# SQL to dplyr: 30 Translations Every Analyst Needs

<p class="lead">A hands-on collection for analysts switching from SQL to R: 30 worked translations that turn familiar SQL queries into their exact dplyr equivalents. You move from SELECT, WHERE and ORDER BY through GROUP BY, HAVING, the four join types, window functions and CASE WHEN, ending on full multi-clause reports. Every query has a hidden dplyr solution, so try each one before revealing it.</p>

If you already think in SQL, dplyr is mostly a vocabulary swap: `SELECT` becomes `select()`, `WHERE` becomes `filter()`, `GROUP BY` becomes `group_by()`, and joins keep the same names. This set drills that mapping on two tiny tables plus the built-in `mtcars` and `iris`, so you can focus on the translation and not on the data.

```r title="Run this once before any exercise"
library(dplyr)
library(tibble)
```

```r title="Setup: build the orders and customers tables (Section 1 onward reuses these)"
customers <- tibble(
  customer_id = 1:6,
  name        = c("Ava","Ben","Cara","Dan","Eve","Finn"),
  city        = c("Austin","Boston","Austin","Chicago","Boston","Austin"),
  segment     = c("retail","wholesale","retail","retail","wholesale","retail")
)

orders <- tibble(
  order_id    = 101:110,
  customer_id = c(1L,1L,2L,3L,3L,3L,4L,5L,2L,1L),
  amount      = c(120, 80, 200, 50, 75, 300, 60, 90, 150, 40),
  order_date  = as.Date(c("2024-01-05","2024-01-18","2024-02-02","2024-02-11",
                          "2024-03-03","2024-03-20","2024-03-25","2024-04-01",
                          "2024-04-15","2024-05-02"))
)
```

Note: `Finn` (customer 6) has placed no orders. Several join exercises rely on that gap. The `mtcars` and `iris` tables are built in, so no setup is needed for them.

## Section 1. SELECT, WHERE and ORDER BY (5 problems)

The bread and butter of any query: pick columns, keep rows, sort the result. These map almost word for word to `select()`, `filter()` and `arrange()`.

### Exercise 1.1: Select two columns with the select verb

**Task:** A finance analyst moving off a SQL reporting stack needs the dplyr version of this query, which selects just two columns from the `customers` table. Reproduce the same result and save it to `ex_1_1`:

```sql
SELECT name, city FROM customers;
```

**Expected result:**

```
#> # A tibble: 6 × 2
#>   name  city   
#>   <chr> <chr>  
#> 1 Ava   Austin 
#> 2 Ben   Boston 
#> 3 Cara  Austin 
#> 4 Dan   Chicago
#> 5 Eve   Boston 
#> 6 Finn  Austin 
```

**Difficulty:** Beginner

[HINTS]
You only need to pick columns here, not rows. Which single dplyr verb chooses a subset of columns by name?
Call `select(customers, name, city)` to keep just those two columns in that order.

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- select(customers, name, city)
ex_1_1
#> # A tibble: 6 × 2
#>   name  city   
#>   <chr> <chr>  
#> 1 Ava   Austin 
#> 2 Ben   Boston 
#> 3 Cara  Austin 
#> 4 Dan   Chicago
#> 5 Eve   Boston 
#> 6 Finn  Austin 
```

**Explanation:** `select()` is dplyr's column chooser and the direct translation of the SQL SELECT list. It keeps the named columns in the order you list them and drops the rest. A common mistake is reaching for `filter()`, which chooses rows, not columns.

</details>

### Exercise 1.2: Filter rows to one city with a WHERE clause

**Task:** Translate this SQL filter to dplyr on the `customers` table, keeping only the rows where the city equals Austin and returning every column, then store the resulting tibble in `ex_1_2`:

```sql
SELECT * FROM customers WHERE city = 'Austin';
```

**Expected result:**

```
#> # A tibble: 3 × 4
#>   customer_id name  city   segment
#>         <int> <chr> <chr>  <chr>  
#> 1           1 Ava   Austin retail 
#> 2           3 Cara  Austin retail 
#> 3           6 Finn  Austin retail 
```

**Difficulty:** Beginner

[HINTS]
A WHERE clause keeps rows that satisfy a condition. Which dplyr verb filters rows rather than columns?
Use `filter(customers, city == "Austin")`, remembering that equality in R is a double equals sign.

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- filter(customers, city == "Austin")
ex_1_2
#> # A tibble: 3 × 4
#>   customer_id name  city   segment
#>         <int> <chr> <chr>  <chr>  
#> 1           1 Ava   Austin retail 
#> 2           3 Cara  Austin retail 
#> 3           6 Finn  Austin retail 
```

**Explanation:** `filter()` is the row-level counterpart of SQL's WHERE, keeping only rows where the condition is TRUE. Note the double equals `==` for comparison: a single `=` is assignment in R and will error here. Character values must be quoted.

</details>

### Exercise 1.3: Filter and sort with WHERE plus ORDER BY DESC

**Task:** Rewrite this query in dplyr against the `orders` table: it keeps orders of at least 100, sorts them from largest amount to smallest, and returns three columns. Save the output to `ex_1_3`:

```sql
SELECT order_id, customer_id, amount
FROM orders
WHERE amount >= 100
ORDER BY amount DESC;
```

**Expected result:**

```
#> # A tibble: 4 × 3
#>   order_id customer_id amount
#>      <int>       <int>  <dbl>
#> 1      106           3    300
#> 2      103           2    200
#> 3      109           2    150
#> 4      101           1    120
```

**Difficulty:** Intermediate

[HINTS]
You need three operations: keep some rows, reorder them, and drop to three columns. Chain them with the pipe.
Combine `filter(amount >= 100)`, `arrange(desc(amount))` and `select(...)` in a single piped sequence.

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- orders |>
  filter(amount >= 100) |>
  arrange(desc(amount)) |>
  select(order_id, customer_id, amount)
ex_1_3
#> # A tibble: 4 × 3
#>   order_id customer_id amount
#>      <int>       <int>  <dbl>
#> 1      106           3    300
#> 2      103           2    200
#> 3      109           2    150
#> 4      101           1    120
```

**Explanation:** The pipe `|>` passes each result into the next verb, so `filter()` narrows rows, `arrange(desc())` sorts them high to low, and `select()` trims columns. Order matters for readability but not for the result here. `desc()` is dplyr's descending helper.

</details>

### Exercise 1.4: Rename with AS and filter with an IN list

**Task:** This query aliases `name` to `customer` and filters `customers` to two cities with an IN list. Produce the identical dplyr pipeline, keeping the column rename, and assign the result to `ex_1_4`:

```sql
SELECT name AS customer, segment
FROM customers
WHERE city IN ('Austin', 'Boston');
```

**Expected result:**

```
#> # A tibble: 5 × 2
#>   customer segment  
#>   <chr>    <chr>    
#> 1 Ava      retail   
#> 2 Ben      wholesale
#> 3 Cara     retail   
#> 4 Eve      wholesale
#> 5 Finn     retail   
```

**Difficulty:** Intermediate

[HINTS]
SQL's AS renames a column and IN tests membership in a set. dplyr has direct counterparts for both.
Filter with `city %in% c("Austin", "Boston")` and rename inside `select(customer = name, segment)`.

```r title="Your turn"
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_4 <- customers |>
  filter(city %in% c("Austin", "Boston")) |>
  select(customer = name, segment)
ex_1_4
#> # A tibble: 5 × 2
#>   customer segment  
#>   <chr>    <chr>    
#> 1 Ava      retail   
#> 2 Ben      wholesale
#> 3 Cara     retail   
#> 4 Eve      wholesale
#> 5 Finn     retail   
```

**Explanation:** SQL's `AS` becomes `new = old` inside `select()`, and `IN (...)` becomes the `%in%` operator against a vector. Renaming inside `select()` both keeps and relabels a column in one step, which is cleaner than a separate `rename()` call.

</details>

### Exercise 1.5: Return the top three rows with ORDER BY and LIMIT

**Task:** SQL uses LIMIT to cap rows after sorting. Translate this top-three query on the `orders` table into dplyr, returning the three highest-value orders with all their columns, and save it to `ex_1_5`:

```sql
SELECT * FROM orders ORDER BY amount DESC LIMIT 3;
```

**Expected result:**

```
#> # A tibble: 3 × 4
#>   order_id customer_id amount order_date
#>      <int>       <int>  <dbl> <date>    
#> 1      106           3    300 2024-03-20
#> 2      103           2    200 2024-02-02
#> 3      109           2    150 2024-04-15
```

**Difficulty:** Intermediate

[HINTS]
LIMIT just caps the number of rows after sorting. Which verb returns the first n rows of a table?
Sort with `arrange(desc(amount))`, then take the top rows with `slice_head(n = 3)`.

```r title="Your turn"
ex_1_5 <- # your code here
ex_1_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_5 <- orders |>
  arrange(desc(amount)) |>
  slice_head(n = 3)
ex_1_5
#> # A tibble: 3 × 4
#>   order_id customer_id amount order_date
#>      <int>       <int>  <dbl> <date>    
#> 1      106           3    300 2024-03-20
#> 2      103           2    200 2024-02-02
#> 3      109           2    150 2024-04-15
```

**Explanation:** SQL's LIMIT has no single dplyr keyword; you sort with `arrange()` then take the first rows. `slice_head(n = 3)` is clearer than base `head()` inside a pipeline. For ties you might prefer `slice_max()`, which can keep or break tied ranks explicitly.

</details>

## Section 2. GROUP BY and aggregates (5 problems)

Aggregation is where dplyr splits SQL's single GROUP BY clause into two verbs: `group_by()` sets the groups and `summarise()` collapses each one.

### Exercise 2.1: Count rows per group with COUNT star

**Task:** Aggregation begins with GROUP BY. Convert this query, which counts how many orders each customer placed in the `orders` table, into a dplyr grouped summary and save the counts to `ex_2_1`:

```sql
SELECT customer_id, COUNT(*) AS n_orders
FROM orders
GROUP BY customer_id;
```

**Expected result:**

```
#> # A tibble: 5 × 2
#>   customer_id n_orders
#>         <int>    <int>
#> 1           1        3
#> 2           2        2
#> 3           3        3
#> 4           4        1
#> 5           5        1
```

**Difficulty:** Beginner

[HINTS]
Counting rows per group needs a grouping step followed by a summary that tallies rows.
Use `group_by(customer_id)` then `summarise(n_orders = n())`, where `n()` counts rows in each group.

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- orders |>
  group_by(customer_id) |>
  summarise(n_orders = n())
ex_2_1
#> # A tibble: 5 × 2
#>   customer_id n_orders
#>         <int>    <int>
#> 1           1        3
#> 2           2        2
#> 3           3        3
#> 4           4        1
#> 5           5        1
```

**Explanation:** `group_by()` sets the grouping and `n()` counts rows within each group, exactly like `COUNT(*)`. `summarise()` collapses each group to one row. The shortcut `count(orders, customer_id)` does the same thing in a single verb when you only need counts.

</details>

### Exercise 2.2: Compute SUM and AVG in one summarise

**Task:** This query returns the total and the average order amount for every customer in the `orders` table. Recreate both aggregates in a single dplyr summarise call and store the result in `ex_2_2`:

```sql
SELECT customer_id,
       SUM(amount) AS total,
       AVG(amount) AS avg_amount
FROM orders
GROUP BY customer_id;
```

**Expected result:**

```
#> # A tibble: 5 × 3
#>   customer_id total avg_amount
#>         <int> <dbl>      <dbl>
#> 1           1   240        80 
#> 2           2   350       175 
#> 3           3   425       142.
#> 4           4    60        60 
#> 5           5    90        90 
```

**Difficulty:** Intermediate

[HINTS]
Two aggregates can live in one summarise call, separated by commas, each naming its own output column.
Inside `summarise()`, write `total = sum(amount)` and `avg_amount = mean(amount)` together.

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- orders |>
  group_by(customer_id) |>
  summarise(total = sum(amount), avg_amount = mean(amount))
ex_2_2
#> # A tibble: 5 × 3
#>   customer_id total avg_amount
#>         <int> <dbl>      <dbl>
#> 1           1   240        80 
#> 2           2   350       175 
#> 3           3   425       142.
#> 4           4    60        60 
#> 5           5    90        90 
```

**Explanation:** A single `summarise()` can return several aggregates at once, each as a named column, so `SUM` and `AVG` map to `sum()` and `mean()`. dplyr sorts groups by the grouping key, which is why customers appear in id order without an explicit ORDER BY.

</details>

### Exercise 2.3: Count per group then sort by the count

**Task:** Translate this query on the `customers` table: it counts customers per city and orders the cities from most to fewest. Produce the same grouped, sorted summary in dplyr and save it to `ex_2_3`:

```sql
SELECT city, COUNT(*) AS n
FROM customers
GROUP BY city
ORDER BY n DESC;
```

**Expected result:**

```
#> # A tibble: 3 × 2
#>   city        n
#>   <chr>   <int>
#> 1 Austin      3
#> 2 Boston      2
#> 3 Chicago     1
```

**Difficulty:** Beginner

[HINTS]
This is a count per group followed by a sort on that count, highest first.
After `group_by(city)` and `summarise(n = n())`, order with `arrange(desc(n))`.

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- customers |>
  group_by(city) |>
  summarise(n = n()) |>
  arrange(desc(n))
ex_2_3
#> # A tibble: 3 × 2
#>   city        n
#>   <chr>   <int>
#> 1 Austin      3
#> 2 Boston      2
#> 3 Chicago     1
```

**Explanation:** This pairs an aggregate with a sort on that aggregate. `summarise()` produces the per-city counts, then `arrange(desc(n))` orders them. Because the sort references a freshly created summary column, it must come after `summarise()`, mirroring how ORDER BY runs after GROUP BY.

</details>

### Exercise 2.4: Group mtcars by cylinder and average mpg

**Task:** Group the built-in `mtcars` table by cylinder count, then report the mean miles per gallon and the number of cars in each group, exactly as this SQL does. Save the summary to `ex_2_4`:

```sql
SELECT cyl, AVG(mpg) AS avg_mpg, COUNT(*) AS n
FROM mtcars
GROUP BY cyl;
```

**Expected result:**

```
#> # A tibble: 3 × 3
#>     cyl avg_mpg     n
#>   <dbl>   <dbl> <int>
#> 1     4    26.7    11
#> 2     6    19.7     7
#> 3     8    15.1    14
```

**Difficulty:** Intermediate

[HINTS]
`mtcars` is a plain data frame, but grouping it and summarising still returns a tidy table of results.
Group by `cyl`, then `summarise(avg_mpg = mean(mpg), n = n())`.

```r title="Your turn"
ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_4 <- mtcars |>
  group_by(cyl) |>
  summarise(avg_mpg = mean(mpg), n = n())
ex_2_4
#> # A tibble: 3 × 3
#>     cyl avg_mpg     n
#>   <dbl>   <dbl> <int>
#> 1     4    26.7    11
#> 2     6    19.7     7
#> 3     8    15.1    14
```

**Explanation:** Even though `mtcars` is a base data frame rather than a tibble, `group_by()` plus `summarise()` returns a clean grouped result. Mixing `mean()` and `n()` in one summary is idiomatic. Watch for `NA` values, which would make `mean()` return `NA` unless you set `na.rm = TRUE`.

</details>

### Exercise 2.5: Group by two keys at once

**Task:** SQL can group by more than one column at once. Translate this two-key aggregation on `mtcars`, which counts cars for every combination of cylinders and gears, into dplyr and save the counts to `ex_2_5`:

```sql
SELECT cyl, gear, COUNT(*) AS n
FROM mtcars
GROUP BY cyl, gear;
```

**Expected result:**

```
#> # A tibble: 8 × 3
#>     cyl  gear     n
#>   <dbl> <dbl> <int>
#> 1     4     3     1
#> 2     4     4     8
#> 3     4     5     2
#> 4     6     3     2
#> 5     6     4     4
#> 6     6     5     1
#> 7     8     3    12
#> 8     8     5     2
```

**Difficulty:** Advanced

[HINTS]
Grouping by two columns is just two arguments to the same grouping verb; the summary then counts each combination.
Use `group_by(cyl, gear)` then `summarise(n = n(), .groups = "drop")`.

```r title="Your turn"
ex_2_5 <- # your code here
ex_2_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_5 <- mtcars |>
  group_by(cyl, gear) |>
  summarise(n = n(), .groups = "drop")
ex_2_5
#> # A tibble: 8 × 3
#>     cyl  gear     n
#>   <dbl> <dbl> <int>
#> 1     4     3     1
#> 2     4     4     8
#> 3     4     5     2
#> 4     6     3     2
#> 5     6     4     4
#> 6     6     5     1
#> 7     8     3    12
#> 8     8     5     2
```

**Explanation:** Passing two columns to `group_by()` creates one group per observed combination, matching `GROUP BY cyl, gear`. The `.groups = "drop"` argument ungroups the result and silences the grouping message. Without it the output stays grouped by `cyl`, which can surprise later verbs.

</details>

## Section 3. HAVING: filtering aggregates (3 problems)

HAVING trips up SQL learners because it looks like WHERE but runs after aggregation. In dplyr the distinction is obvious: a `filter()` after `summarise()` is HAVING, a `filter()` before `group_by()` is WHERE.

### Exercise 3.1: Keep groups with HAVING COUNT

**Task:** HAVING filters groups after aggregation, unlike WHERE. Translate this query on `orders`, which keeps only customers with two or more orders, into a dplyr pipeline and save the filtered summary to `ex_3_1`:

```sql
SELECT customer_id, COUNT(*) AS n_orders
FROM orders
GROUP BY customer_id
HAVING COUNT(*) >= 2;
```

**Expected result:**

```
#> # A tibble: 3 × 2
#>   customer_id n_orders
#>         <int>    <int>
#> 1           1        3
#> 2           2        2
#> 3           3        3
```

**Difficulty:** Intermediate

[HINTS]
HAVING filters the aggregated result, so in dplyr the filter comes after the summary, not before.
Follow `summarise(n_orders = n())` with `filter(n_orders >= 2)`.

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- orders |>
  group_by(customer_id) |>
  summarise(n_orders = n()) |>
  filter(n_orders >= 2)
ex_3_1
#> # A tibble: 3 × 2
#>   customer_id n_orders
#>         <int>    <int>
#> 1           1        3
#> 2           2        2
#> 3           3        3
```

**Explanation:** The key insight is that HAVING filters groups after aggregation, so its dplyr equivalent is a `filter()` placed after `summarise()`. A `filter()` before `group_by()` would instead act like WHERE, removing rows before counting and changing the result entirely.

</details>

### Exercise 3.2: Filter groups on an aggregated sum

**Task:** This query keeps only the customers whose total spend exceeds 300 in the `orders` table. Reproduce the grouped sum and the HAVING filter with dplyr verbs, then assign the result to `ex_3_2`:

```sql
SELECT customer_id, SUM(amount) AS total
FROM orders
GROUP BY customer_id
HAVING SUM(amount) > 300;
```

**Expected result:**

```
#> # A tibble: 2 × 2
#>   customer_id total
#>         <int> <dbl>
#> 1           2   350
#> 2           3   425
```

**Difficulty:** Intermediate

[HINTS]
Compute the group total first, then apply a row filter to those totals, mirroring HAVING.
Chain `summarise(total = sum(amount))` into `filter(total > 300)`.

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- orders |>
  group_by(customer_id) |>
  summarise(total = sum(amount)) |>
  filter(total > 300)
ex_3_2
#> # A tibble: 2 × 2
#>   customer_id total
#>         <int> <dbl>
#> 1           2   350
#> 2           3   425
```

**Explanation:** Here the group total drives the filter, so you compute `sum(amount)` per customer first and then keep totals above 300. Trying to write the threshold inside `summarise()` will not work, because the filtering step is logically separate from the aggregation.

</details>

### Exercise 3.3: Combine WHERE, GROUP BY and HAVING

**Task:** This query combines WHERE, GROUP BY and HAVING on `mtcars`: it filters to powerful cars, groups by cylinder, and keeps groups whose mean mpg beats 15. Translate the whole thing into dplyr and save it to `ex_3_3`:

```sql
SELECT cyl, AVG(mpg) AS avg_mpg
FROM mtcars
WHERE hp > 100
GROUP BY cyl
HAVING AVG(mpg) > 15;
```

**Expected result:**

```
#> # A tibble: 3 × 2
#>     cyl avg_mpg
#>   <dbl>   <dbl>
#> 1     4    25.9
#> 2     6    19.7
#> 3     8    15.1
```

**Difficulty:** Advanced

[HINTS]
WHERE runs before grouping and HAVING after, so you need a filter, a summary, then a second filter.
Order the verbs as `filter(hp > 100)`, `group_by(cyl)`, `summarise(avg_mpg = mean(mpg))`, `filter(avg_mpg > 15)`.

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- mtcars |>
  filter(hp > 100) |>
  group_by(cyl) |>
  summarise(avg_mpg = mean(mpg)) |>
  filter(avg_mpg > 15)
ex_3_3
#> # A tibble: 3 × 2
#>     cyl avg_mpg
#>   <dbl>   <dbl>
#> 1     4    25.9
#> 2     6    19.7
#> 3     8    15.1
```

**Explanation:** This shows all three phases in order: `filter(hp > 100)` is WHERE and runs before grouping, while `filter(avg_mpg > 15)` is HAVING and runs after the summary. Keeping the two filters on the correct sides of `summarise()` is what reproduces the SQL exactly.

</details>

## Section 4. Joins: inner, left, anti and semi (5 problems)

dplyr keeps SQL's join names. Mutating joins (`inner_join`, `left_join`) add columns; filtering joins (`semi_join`, `anti_join`) only keep or drop rows. Matching the SQL to the right family is the whole game.

### Exercise 4.1: Attach customer names with an inner join

**Task:** Joins are where SQL and dplyr feel most different. Translate this inner join between `orders` and `customers`, which attaches each order to its customer name, into dplyr and save the joined result to `ex_4_1`:

```sql
SELECT o.order_id, c.name, o.amount
FROM orders o
INNER JOIN customers c ON o.customer_id = c.customer_id;
```

**Expected result:**

```
#> # A tibble: 10 × 3
#>    order_id name  amount
#>       <int> <chr>  <dbl>
#>  1      101 Ava      120
#>  2      102 Ava       80
#>  3      103 Ben      200
#>  4      104 Cara      50
#>  5      105 Cara      75
#>  6      106 Cara     300
#>  7      107 Dan       60
#>  8      108 Eve       90
#>  9      109 Ben      150
#> 10      110 Ava       40
```

**Difficulty:** Intermediate

[HINTS]
An inner join keeps only rows with a match on both sides, joined on the shared key column.
Use `inner_join(customers, by = "customer_id")` on `orders`, then `select()` the three columns.

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- orders |>
  inner_join(customers, by = "customer_id") |>
  select(order_id, name, amount)
ex_4_1
#> # A tibble: 10 × 3
#>    order_id name  amount
#>       <int> <chr>  <dbl>
#>  1      101 Ava      120
#>  2      102 Ava       80
#>  3      103 Ben      200
#>  4      104 Cara      50
#>  5      105 Cara      75
#>  6      106 Cara     300
#>  7      107 Dan       60
#>  8      108 Eve       90
#>  9      109 Ben      150
#> 10      110 Ava       40
```

**Explanation:** `inner_join()` matches rows on the shared key and keeps only pairs that exist on both sides, the default join semantics in SQL. By default dplyr joins on all common column names, but naming `by = "customer_id"` is safer and self-documenting. The result keeps the left table's row order.

</details>

### Exercise 4.2: Keep every customer with a left join

**Task:** A left join keeps every row from the left table even when there is no match. Translate this query, which lists every customer and any order ids they have, into dplyr and save it to `ex_4_2`:

```sql
SELECT c.name, o.order_id
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id;
```

**Expected result:**

```
#> # A tibble: 11 × 2
#>    name  order_id
#>    <chr>    <int>
#>  1 Ava        101
#>  2 Ava        102
#>  3 Ava        110
#>  4 Ben        103
#>  5 Ben        109
#>  6 Cara       104
#>  7 Cara       105
#>  8 Cara       106
#>  9 Dan        107
#> 10 Eve        108
#> 11 Finn        NA
```

**Difficulty:** Intermediate

[HINTS]
A left join preserves every row of the first table, filling unmatched columns with NA.
Start from `customers` and call `left_join(orders, by = "customer_id")`.

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- customers |>
  left_join(orders, by = "customer_id") |>
  select(name, order_id)
ex_4_2
#> # A tibble: 11 × 2
#>    name  order_id
#>    <chr>    <int>
#>  1 Ava        101
#>  2 Ava        102
#>  3 Ava        110
#>  4 Ben        103
#>  5 Ben        109
#>  6 Cara       104
#>  7 Cara       105
#>  8 Cara       106
#>  9 Dan        107
#> 10 Eve        108
#> 11 Finn        NA
```

**Explanation:** `left_join()` keeps every customer even when they have no orders, filling the missing `order_id` with `NA`, exactly what a SQL LEFT JOIN does with NULLs. Reversing the tables would change which side is preserved, so the first argument is the table you must keep whole.

</details>

### Exercise 4.3: Total spend per customer including zeros

**Task:** This report totals each customer's spend but must include customers with no orders as zero, so it uses a left join before aggregating. Translate the whole query into dplyr and save the result to `ex_4_3`:

```sql
SELECT c.name, COALESCE(SUM(o.amount), 0) AS total
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
GROUP BY c.name
ORDER BY total DESC;
```

**Expected result:**

```
#> # A tibble: 6 × 2
#>   name  total
#>   <chr> <dbl>
#> 1 Cara    425
#> 2 Ben     350
#> 3 Ava     240
#> 4 Eve      90
#> 5 Dan      60
#> 6 Finn      0
```

**Difficulty:** Intermediate

[HINTS]
You must join before summarising, and unmatched customers produce NA amounts you need to treat as zero.
After the left join, use `summarise(total = sum(amount, na.rm = TRUE))` to mimic COALESCE around SUM.

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- customers |>
  left_join(orders, by = "customer_id") |>
  group_by(name) |>
  summarise(total = sum(amount, na.rm = TRUE)) |>
  arrange(desc(total))
ex_4_3
#> # A tibble: 6 × 2
#>   name  total
#>   <chr> <dbl>
#> 1 Cara    425
#> 2 Ben     350
#> 3 Ava     240
#> 4 Eve      90
#> 5 Dan      60
#> 6 Finn      0
```

**Explanation:** The join must happen before the summary so unmatched customers still appear, then `sum(amount, na.rm = TRUE)` turns their `NA` into 0, mirroring `COALESCE(SUM(...), 0)`. Forgetting `na.rm` would return `NA` for customers with no orders rather than a clean zero.

</details>

### Exercise 4.4: Find non-matching rows with an anti join

**Task:** An anti join returns rows on the left with no match on the right. Translate this NOT IN subquery, which finds customers who have never ordered, into a dplyr filtering join and save the result to `ex_4_4`:

```sql
SELECT *
FROM customers
WHERE customer_id NOT IN (SELECT customer_id FROM orders);
```

**Expected result:**

```
#> # A tibble: 1 × 4
#>   customer_id name  city   segment
#>         <int> <chr> <chr>  <chr>  
#> 1           6 Finn  Austin retail 
```

**Difficulty:** Intermediate

[HINTS]
A NOT IN subquery on keys is exactly a filtering join that drops matched rows.
Use `anti_join(customers, orders, by = "customer_id")`.

```r title="Your turn"
ex_4_4 <- # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_4 <- anti_join(customers, orders, by = "customer_id")
ex_4_4
#> # A tibble: 1 × 4
#>   customer_id name  city   segment
#>         <int> <chr> <chr>  <chr>  
#> 1           6 Finn  Austin retail 
```

**Explanation:** `anti_join()` is the tidy translation of a `NOT IN` key subquery: it returns left rows with no match on the right and adds no columns. It is far more readable than a manual `filter(!customer_id %in% ...)` and handles the key comparison for you.

</details>

### Exercise 4.5: Keep matching rows with a semi join

**Task:** A semi join keeps left rows that have at least one match, without duplicating them. Translate this IN subquery, which returns customers who have placed an order, into dplyr and save the result to `ex_4_5`:

```sql
SELECT *
FROM customers
WHERE customer_id IN (SELECT customer_id FROM orders);
```

**Expected result:**

```
#> # A tibble: 5 × 4
#>   customer_id name  city    segment  
#>         <int> <chr> <chr>   <chr>    
#> 1           1 Ava   Austin  retail   
#> 2           2 Ben   Boston  wholesale
#> 3           3 Cara  Austin  retail   
#> 4           4 Dan   Chicago retail   
#> 5           5 Eve   Boston  wholesale
```

**Difficulty:** Intermediate

[HINTS]
An IN subquery on keys keeps matched left rows without adding columns, which is a semi join.
Use `semi_join(customers, orders, by = "customer_id")`.

```r title="Your turn"
ex_4_5 <- # your code here
ex_4_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_5 <- semi_join(customers, orders, by = "customer_id")
ex_4_5
#> # A tibble: 5 × 4
#>   customer_id name  city    segment  
#>         <int> <chr> <chr>   <chr>    
#> 1           1 Ava   Austin  retail   
#> 2           2 Ben   Boston  wholesale
#> 3           3 Cara  Austin  retail   
#> 4           4 Dan   Chicago retail   
#> 5           5 Eve   Boston  wholesale
```

**Explanation:** `semi_join()` keeps left rows that have at least one match on the right, without duplicating them or adding right-hand columns, which is precisely what an `IN` key subquery does. Using an `inner_join()` here would instead multiply rows and append columns you did not ask for.

</details>

## Section 5. Window functions (5 problems)

`OVER (PARTITION BY ... ORDER BY ...)` has no single dplyr keyword. Instead you `group_by()` for the partition and use a windowed helper (`row_number`, `min_rank`, `lag`, `cumsum`) inside `mutate()`, which keeps every row.

### Exercise 5.1: Number rows within a partition with ROW_NUMBER

**Task:** Window functions rank rows without collapsing them. Translate this query, which numbers each customer's orders from largest to smallest amount using ROW_NUMBER, into a grouped dplyr mutate and save the result to `ex_5_1`:

```sql
SELECT order_id, customer_id, amount,
       ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY amount DESC) AS rn
FROM orders;
```

**Expected result:**

```
#> # A tibble: 10 × 4
#>    order_id customer_id amount    rn
#>       <int>       <int>  <dbl> <int>
#>  1      101           1    120     1
#>  2      102           1     80     2
#>  3      110           1     40     3
#>  4      103           2    200     1
#>  5      109           2    150     2
#>  6      106           3    300     1
#>  7      105           3     75     2
#>  8      104           3     50     3
#>  9      107           4     60     1
#> 10      108           5     90     1
```

**Difficulty:** Advanced

[HINTS]
OVER (PARTITION BY ...) maps to grouping, and ROW_NUMBER ranks rows within each group by the ORDER BY.
After `group_by(customer_id)`, `mutate(rn = row_number(desc(amount)))`, then ungroup.

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- orders |>
  group_by(customer_id) |>
  mutate(rn = row_number(desc(amount))) |>
  ungroup() |>
  select(order_id, customer_id, amount, rn) |>
  arrange(customer_id, rn)
ex_5_1
#> # A tibble: 10 × 4
#>    order_id customer_id amount    rn
#>       <int>       <int>  <dbl> <int>
#>  1      101           1    120     1
#>  2      102           1     80     2
#>  3      110           1     40     3
#>  4      103           2    200     1
#>  5      109           2    150     2
#>  6      106           3    300     1
#>  7      105           3     75     2
#>  8      104           3     50     3
#>  9      107           4     60     1
#> 10      108           5     90     1
```

**Explanation:** `OVER (PARTITION BY ... ORDER BY ...)` splits into `group_by()` for the partition and a ranking helper for the order. `row_number(desc(amount))` assigns 1 to the largest amount per customer. Because windows keep every row, you use `mutate()`, not `summarise()`, then `ungroup()`.

</details>

### Exercise 5.2: Rank all rows globally with RANK

**Task:** This query ranks every order by amount across the whole `orders` table with RANK and no partition. Translate it into dplyr using the matching ranking helper, sort by the rank, and save the result to `ex_5_2`:

```sql
SELECT order_id, amount,
       RANK() OVER (ORDER BY amount DESC) AS amount_rank
FROM orders
ORDER BY amount_rank;
```

**Expected result:**

```
#> # A tibble: 10 × 3
#>    order_id amount amount_rank
#>       <int>  <dbl>       <int>
#>  1      106    300           1
#>  2      103    200           2
#>  3      109    150           3
#>  4      101    120           4
#>  5      108     90           5
#>  6      102     80           6
#>  7      105     75           7
#>  8      107     60           8
#>  9      104     50           9
#> 10      110     40          10
```

**Difficulty:** Intermediate

[HINTS]
A window with no PARTITION BY ranks across the whole table, so no grouping is needed.
Use `mutate(amount_rank = min_rank(desc(amount)))`, which matches SQL RANK for ties.

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_2 <- orders |>
  mutate(amount_rank = min_rank(desc(amount))) |>
  select(order_id, amount, amount_rank) |>
  arrange(amount_rank)
ex_5_2
#> # A tibble: 10 × 3
#>    order_id amount amount_rank
#>       <int>  <dbl>       <int>
#>  1      106    300           1
#>  2      103    200           2
#>  3      109    150           3
#>  4      101    120           4
#>  5      108     90           5
#>  6      102     80           6
#>  7      105     75           7
#>  8      107     60           8
#>  9      104     50           9
#> 10      110     40          10
```

**Explanation:** With no PARTITION BY the window spans the whole table, so no `group_by()` is needed. `min_rank()` matches SQL `RANK()` by giving tied values the same rank and leaving gaps afterwards; `dense_rank()` would instead match `DENSE_RANK()` with no gaps.

</details>

### Exercise 5.3: Build a running total with a windowed SUM

**Task:** A running total is a windowed SUM ordered within each partition. Translate this query, which accumulates each customer's spend in order date sequence, into a grouped dplyr mutate with cumsum and save it to `ex_5_3`:

```sql
SELECT order_id, customer_id, amount, order_date,
       SUM(amount) OVER (PARTITION BY customer_id ORDER BY order_date) AS running_total
FROM orders;
```

**Expected result:**

```
#> # A tibble: 10 × 5
#>    order_id customer_id amount order_date running_total
#>       <int>       <int>  <dbl> <date>             <dbl>
#>  1      101           1    120 2024-01-05           120
#>  2      102           1     80 2024-01-18           200
#>  3      110           1     40 2024-05-02           240
#>  4      103           2    200 2024-02-02           200
#>  5      109           2    150 2024-04-15           350
#>  6      104           3     50 2024-02-11            50
#>  7      105           3     75 2024-03-03           125
#>  8      106           3    300 2024-03-20           425
#>  9      107           4     60 2024-03-25            60
#> 10      108           5     90 2024-04-01            90
```

**Difficulty:** Advanced

[HINTS]
A running SUM ordered within a partition is a cumulative sum computed per group in date order.
Arrange by date, `group_by(customer_id)`, then `mutate(running_total = cumsum(amount))`.

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_3 <- orders |>
  arrange(customer_id, order_date) |>
  group_by(customer_id) |>
  mutate(running_total = cumsum(amount)) |>
  ungroup()
ex_5_3
#> # A tibble: 10 × 5
#>    order_id customer_id amount order_date running_total
#>       <int>       <int>  <dbl> <date>             <dbl>
#>  1      101           1    120 2024-01-05           120
#>  2      102           1     80 2024-01-18           200
#>  3      110           1     40 2024-05-02           240
#>  4      103           2    200 2024-02-02           200
#>  5      109           2    150 2024-04-15           350
#>  6      104           3     50 2024-02-11            50
#>  7      105           3     75 2024-03-03           125
#>  8      106           3    300 2024-03-20           425
#>  9      107           4     60 2024-03-25            60
#> 10      108           5     90 2024-04-01            90
```

**Explanation:** A running total is a per-group cumulative sum in a defined order, so you `arrange()` by date, `group_by()` the partition, then `mutate(cumsum(amount))`. Arranging before grouping guarantees the accumulation follows date order, since `cumsum()` respects the current row order.

</details>

### Exercise 5.4: Look back one row with LAG

**Task:** LAG pulls the previous row's value inside a partition. Translate this query, which shows each order's amount alongside the customer's prior order amount by date, into dplyr and save the result to `ex_5_4`:

```sql
SELECT order_id, customer_id, amount,
       LAG(amount) OVER (PARTITION BY customer_id ORDER BY order_date) AS prev_amount
FROM orders;
```

**Expected result:**

```
#> # A tibble: 10 × 4
#>    order_id customer_id amount prev_amount
#>       <int>       <int>  <dbl>       <dbl>
#>  1      101           1    120          NA
#>  2      102           1     80         120
#>  3      110           1     40          80
#>  4      103           2    200          NA
#>  5      109           2    150         200
#>  6      104           3     50          NA
#>  7      105           3     75          50
#>  8      106           3    300          75
#>  9      107           4     60          NA
#> 10      108           5     90          NA
```

**Difficulty:** Intermediate

[HINTS]
LAG returns the previous row's value within an ordered partition; dplyr has a direct offset helper.
Arrange by date and group, then `mutate(prev_amount = lag(amount))`.

```r title="Your turn"
ex_5_4 <- # your code here
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_4 <- orders |>
  arrange(customer_id, order_date) |>
  group_by(customer_id) |>
  mutate(prev_amount = lag(amount)) |>
  ungroup() |>
  select(order_id, customer_id, amount, prev_amount)
ex_5_4
#> # A tibble: 10 × 4
#>    order_id customer_id amount prev_amount
#>       <int>       <int>  <dbl>       <dbl>
#>  1      101           1    120          NA
#>  2      102           1     80         120
#>  3      110           1     40          80
#>  4      103           2    200          NA
#>  5      109           2    150         200
#>  6      104           3     50          NA
#>  7      105           3     75          50
#>  8      106           3    300          75
#>  9      107           4     60          NA
#> 10      108           5     90          NA
```

**Explanation:** `lag()` returns the previous row's value within each group, filling the first row with `NA` just as SQL `LAG` returns NULL at a partition's start. The arrange step defines what previous means, so ordering by date is essential before applying the offset.

</details>

### Exercise 5.5: Compute each row's share of its group total

**Task:** Dividing a value by a windowed SUM gives each row's share of its group. Translate this query, which computes every order's fraction of its customer total, into a grouped dplyr mutate and save it to `ex_5_5`:

```sql
SELECT order_id, customer_id, amount,
       amount * 1.0 / SUM(amount) OVER (PARTITION BY customer_id) AS pct_of_customer
FROM orders;
```

**Expected result:**

```
#> # A tibble: 10 × 4
#>    order_id customer_id amount pct_of_customer
#>       <int>       <int>  <dbl>           <dbl>
#>  1      101           1    120           0.5  
#>  2      102           1     80           0.333
#>  3      103           2    200           0.571
#>  4      104           3     50           0.118
#>  5      105           3     75           0.176
#>  6      106           3    300           0.706
#>  7      107           4     60           1    
#>  8      108           5     90           1    
#>  9      109           2    150           0.429
#> 10      110           1     40           0.167
```

**Difficulty:** Advanced

[HINTS]
Dividing by a windowed SUM keeps every row, because the group total is recycled across the group's rows.
Inside `group_by(customer_id)`, `mutate(pct_of_customer = amount / sum(amount))`.

```r title="Your turn"
ex_5_5 <- # your code here
ex_5_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_5 <- orders |>
  group_by(customer_id) |>
  mutate(pct_of_customer = amount / sum(amount)) |>
  ungroup() |>
  select(order_id, customer_id, amount, pct_of_customer)
ex_5_5
#> # A tibble: 10 × 4
#>    order_id customer_id amount pct_of_customer
#>       <int>       <int>  <dbl>           <dbl>
#>  1      101           1    120           0.5  
#>  2      102           1     80           0.333
#>  3      103           2    200           0.571
#>  4      104           3     50           0.118
#>  5      105           3     75           0.176
#>  6      106           3    300           0.706
#>  7      107           4     60           1    
#>  8      108           5     90           1    
#>  9      109           2    150           0.429
#> 10      110           1     40           0.167
```

**Explanation:** Because `sum(amount)` inside a grouped `mutate()` is recycled across the group, dividing keeps every row while giving each order its share of the customer total. This is a windowed aggregate, not a collapsing one, so `mutate()` is correct and `summarise()` would wrongly reduce the rows.

</details>

## Section 6. CASE WHEN, DISTINCT and UNION (4 problems)

The remaining common clauses map cleanly: CASE WHEN becomes `case_when()`, SELECT DISTINCT becomes `distinct()`, COUNT(DISTINCT) becomes `n_distinct()`, and UNION becomes `union()`.

### Exercise 6.1: Bucket a numeric column with CASE WHEN

**Task:** CASE WHEN builds a labelled column from conditions. Translate this query on `orders`, which buckets each amount into big, medium or small tiers, into a dplyr mutate with case_when and save the result to `ex_6_1`:

```sql
SELECT order_id, amount,
       CASE WHEN amount >= 200 THEN 'big'
            WHEN amount >= 100 THEN 'medium'
            ELSE 'small' END AS bucket
FROM orders;
```

**Expected result:**

```
#> # A tibble: 10 × 3
#>    order_id amount bucket
#>       <int>  <dbl> <chr> 
#>  1      101    120 medium
#>  2      102     80 small 
#>  3      103    200 big   
#>  4      104     50 small 
#>  5      105     75 small 
#>  6      106    300 big   
#>  7      107     60 small 
#>  8      108     90 small 
#>  9      109    150 medium
#> 10      110     40 small 
```

**Difficulty:** Intermediate

[HINTS]
SQL CASE WHEN has a one-to-one dplyr counterpart that evaluates conditions top to bottom.
Use `mutate(bucket = case_when(amount >= 200 ~ "big", amount >= 100 ~ "medium", TRUE ~ "small"))`.

```r title="Your turn"
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_1 <- orders |>
  mutate(bucket = case_when(
    amount >= 200 ~ "big",
    amount >= 100 ~ "medium",
    TRUE          ~ "small"
  )) |>
  select(order_id, amount, bucket)
ex_6_1
#> # A tibble: 10 × 3
#>    order_id amount bucket
#>       <int>  <dbl> <chr> 
#>  1      101    120 medium
#>  2      102     80 small 
#>  3      103    200 big   
#>  4      104     50 small 
#>  5      105     75 small 
#>  6      106    300 big   
#>  7      107     60 small 
#>  8      108     90 small 
#>  9      109    150 medium
#> 10      110     40 small 
```

**Explanation:** `case_when()` is the direct translation of SQL CASE WHEN and evaluates its conditions from top to bottom, taking the first match. The final `TRUE ~ "small"` is the ELSE branch; omitting it would leave unmatched rows as `NA` instead of the small label.

</details>

### Exercise 6.2: Return unique values with DISTINCT

**Task:** SELECT DISTINCT removes duplicate rows. Translate this query, which returns the unique cities present in the `customers` table, into the matching dplyr verb and save the deduplicated single-column result to `ex_6_2`:

```sql
SELECT DISTINCT city FROM customers;
```

**Expected result:**

```
#> # A tibble: 3 × 1
#>   city   
#>   <chr>  
#> 1 Austin 
#> 2 Boston 
#> 3 Chicago
```

**Difficulty:** Beginner

[HINTS]
SELECT DISTINCT on one column returns its unique values; dplyr has a verb named for exactly this.
Use `distinct(customers, city)`.

```r title="Your turn"
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_2 <- distinct(customers, city)
ex_6_2
#> # A tibble: 3 × 1
#>   city   
#>   <chr>  
#> 1 Austin 
#> 2 Boston 
#> 3 Chicago
```

**Explanation:** `distinct()` returns unique combinations of the columns you name, so `distinct(customers, city)` is SELECT DISTINCT city. Called with no columns it deduplicates whole rows. Unlike base `unique()`, it returns a data frame, keeping the result tidy for further piping.

</details>

### Exercise 6.3: Count unique values with COUNT DISTINCT

**Task:** COUNT with DISTINCT counts unique values, not rows. Translate this query, which reports how many distinct customers appear in the `orders` table, into a dplyr summarise with n_distinct and save it to `ex_6_3`:

```sql
SELECT COUNT(DISTINCT customer_id) AS n_customers FROM orders;
```

**Expected result:**

```
#> # A tibble: 1 × 1
#>   n_customers
#>         <int>
#> 1           5
```

**Difficulty:** Intermediate

[HINTS]
COUNT(DISTINCT x) counts unique values, which is a single summary statistic, not a grouping.
Use `summarise(n_customers = n_distinct(customer_id))`.

```r title="Your turn"
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_3 <- orders |>
  summarise(n_customers = n_distinct(customer_id))
ex_6_3
#> # A tibble: 1 × 1
#>   n_customers
#>         <int>
#> 1           5
```

**Explanation:** `n_distinct()` counts unique values in one pass, the tidy equivalent of `COUNT(DISTINCT ...)`. It lives inside `summarise()` because it produces a single number, not a grouping. Wrapping the column in `distinct()` first and then counting rows would work too but is more verbose.

</details>

### Exercise 6.4: Combine two result sets with UNION

**Task:** UNION stacks two result sets and drops duplicates. Translate this query, which combines the names of Austin customers with the names of wholesale customers, into dplyr using union and save the result to `ex_6_4`:

```sql
SELECT name FROM customers WHERE city = 'Austin'
UNION
SELECT name FROM customers WHERE segment = 'wholesale';
```

**Expected result:**

```
#> # A tibble: 5 × 1
#>   name 
#>   <chr>
#> 1 Ava  
#> 2 Cara 
#> 3 Finn 
#> 4 Ben  
#> 5 Eve  
```

**Difficulty:** Intermediate

[HINTS]
UNION combines two same-shaped result sets and removes duplicates, just like the set operator of the same name.
Wrap two filtered, single-column pipelines in `union(...)`.

```r title="Your turn"
ex_6_4 <- # your code here
ex_6_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_4 <- union(
  customers |> filter(city == "Austin") |> select(name),
  customers |> filter(segment == "wholesale") |> select(name)
)
ex_6_4
#> # A tibble: 5 × 1
#>   name 
#>   <chr>
#> 1 Ava  
#> 2 Cara 
#> 3 Finn 
#> 4 Ben  
#> 5 Eve  
```

**Explanation:** dplyr's `union()` stacks two same-shaped results and removes duplicates, matching SQL UNION. If you want to keep duplicates, use `union_all()`, which corresponds to UNION ALL. Both require the two inputs to have identical column names and types, just like the SQL operator.

</details>

## Section 7. Multi-clause queries (3 problems)

Real reports stack every clause you have practiced. Translate them by reading the SQL top to bottom and laying the verbs out in execution order: FROM and JOIN, WHERE, GROUP BY, HAVING, then ORDER BY.

### Exercise 7.1: Join, group, filter and sort a revenue report

**Task:** This report joins orders to customers, rolls revenue up by city, keeps only high-revenue cities with HAVING, and sorts them. Translate the entire multi-clause query into one dplyr pipeline and save it to `ex_7_1`:

```sql
SELECT c.city,
       COUNT(*) AS n_orders,
       SUM(o.amount) AS revenue
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
GROUP BY c.city
HAVING SUM(o.amount) > 200
ORDER BY revenue DESC;
```

**Expected result:**

```
#> # A tibble: 2 × 3
#>   city   n_orders revenue
#>   <chr>     <int>   <dbl>
#> 1 Austin        6     665
#> 2 Boston        3     440
```

**Difficulty:** Advanced

[HINTS]
Translate clause by clause: JOIN, then GROUP BY, then HAVING as a post-summary filter, then ORDER BY.
Chain `inner_join`, `group_by(city)`, `summarise(n_orders = n(), revenue = sum(amount), .groups = "drop")`, `filter(revenue > 200)`, `arrange(desc(revenue))`.

```r title="Your turn"
ex_7_1 <- # your code here
ex_7_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_7_1 <- orders |>
  inner_join(customers, by = "customer_id") |>
  group_by(city) |>
  summarise(n_orders = n(), revenue = sum(amount), .groups = "drop") |>
  filter(revenue > 200) |>
  arrange(desc(revenue))
ex_7_1
#> # A tibble: 2 × 3
#>   city   n_orders revenue
#>   <chr>     <int>   <dbl>
#> 1 Austin        6     665
#> 2 Boston        3     440
```

**Explanation:** Reading the query clause by clause gives the pipeline order: join, group, summarise the two measures, filter on the aggregate (HAVING), then sort. Because `revenue` is created in `summarise()`, both the HAVING filter and the ORDER BY must come after it, never before.

</details>

### Exercise 7.2: Return each customer's single largest order

**Task:** This query finds each customer's single largest order by joining, ranking within customer, and keeping the top row. Translate the whole pattern into dplyr with a grouped slice, sort by amount, and save it to `ex_7_2`:

```sql
SELECT name, order_id, amount
FROM (
  SELECT c.name, o.order_id, o.amount,
         ROW_NUMBER() OVER (PARTITION BY o.customer_id ORDER BY o.amount DESC) AS rn
  FROM orders o
  JOIN customers c ON o.customer_id = c.customer_id
) ranked
WHERE rn = 1
ORDER BY amount DESC;
```

**Expected result:**

```
#> # A tibble: 5 × 3
#>   name  order_id amount
#>   <chr>    <int>  <dbl>
#> 1 Cara       106    300
#> 2 Ben        103    200
#> 3 Ava        101    120
#> 4 Eve        108     90
#> 5 Dan        107     60
```

**Difficulty:** Advanced

[HINTS]
The top row per group is a rank-then-keep pattern; dplyr can do it in one grouped slice.
After joining and `group_by(customer_id)`, use `slice_max(amount, n = 1, with_ties = FALSE)`.

```r title="Your turn"
ex_7_2 <- # your code here
ex_7_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_7_2 <- orders |>
  inner_join(customers, by = "customer_id") |>
  group_by(customer_id) |>
  slice_max(amount, n = 1, with_ties = FALSE) |>
  ungroup() |>
  select(name, order_id, amount) |>
  arrange(desc(amount))
ex_7_2
#> # A tibble: 5 × 3
#>   name  order_id amount
#>   <chr>    <int>  <dbl>
#> 1 Cara       106    300
#> 2 Ben        103    200
#> 3 Ava        101    120
#> 4 Eve        108     90
#> 5 Dan        107     60
```

**Explanation:** The top-row-per-group pattern collapses the window-plus-filter into a single `slice_max()`. Setting `with_ties = FALSE` guarantees exactly one row per customer even when amounts tie, matching the `WHERE rn = 1` cut. Grouping first is what makes the slice act within each customer.

</details>

### Exercise 7.3: Full aggregate pipeline on iris with HAVING and ORDER BY

**Task:** Close with a full aggregation on the built-in `iris` table: group by species, average the sepal length, count rows, keep species averaging over 5, and sort descending. Translate it into dplyr and save it to `ex_7_3`:

```sql
SELECT Species, AVG(Sepal_Length) AS avg_sepal, COUNT(*) AS n
FROM iris
GROUP BY Species
HAVING AVG(Sepal_Length) > 5
ORDER BY avg_sepal DESC;
```

**Expected result:**

```
#> # A tibble: 3 × 3
#>   Species    avg_sepal     n
#>   <fct>          <dbl> <int>
#> 1 virginica       6.59    50
#> 2 versicolor      5.94    50
#> 3 setosa          5.01    50
```

**Difficulty:** Advanced

[HINTS]
This is the full aggregate pattern: group, summarise two measures, filter on an aggregate, then sort.
Use `group_by(Species)`, `summarise(avg_sepal = mean(Sepal.Length), n = n())`, `filter(avg_sepal > 5)`, `arrange(desc(avg_sepal))`.

```r title="Your turn"
ex_7_3 <- # your code here
ex_7_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_7_3 <- iris |>
  group_by(Species) |>
  summarise(avg_sepal = mean(Sepal.Length), n = n()) |>
  filter(avg_sepal > 5) |>
  arrange(desc(avg_sepal))
ex_7_3
#> # A tibble: 3 × 3
#>   Species    avg_sepal     n
#>   <fct>          <dbl> <int>
#> 1 virginica       6.59    50
#> 2 versicolor      5.94    50
#> 3 setosa          5.01    50
```

**Explanation:** This is the canonical aggregate pipeline: group, summarise two measures, filter on an aggregate, and sort. `Sepal.Length` keeps R's dot in the name, whereas SQL would use an underscore. All three species clear the threshold here, so the HAVING filter changes nothing but still documents intent.

</details>

## What to do next

You have now translated the SQL you use daily into idiomatic dplyr. Reinforce specific clauses with these focused hubs:

- [dplyr Exercises in R](dplyr-Exercises-in-R.html): a broad set of practice problems across every core verb.
- [dplyr Joins Exercises in R](dplyr-Joins-Exercises-in-R.html): drill inner, left, semi, anti and rolling joins in depth.
- [dplyr Group By Exercises in R](dplyr-Group-By-Exercises-in-R.html): more grouped-summary practice, the heart of GROUP BY translation.
- [dplyr Window Functions Exercises in R](dplyr-Window-Functions-Exercises-in-R.html): go deeper on ROW_NUMBER, RANK, LAG and running totals.
