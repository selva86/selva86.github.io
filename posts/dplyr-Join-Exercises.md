---
title: "dplyr join() Exercises: 10 Left, Right, Inner & Full Join Problems, Solved Step-by-Step)"
slug: "dplyr-Join-Exercises"
description: "Practise dplyr joins with 10 left, right, inner & full join problems and worked solutions. Build real R skills through hands-on exercises, beginner to advanced."
keywords: "dplyr join exercises, R join practice, left_join exercises, inner_join exercises, full_join exercises, right_join R, dplyr practice problems, R data wrangling exercises"
mathjax: false
webr: true
date: "2026-04-14"
curriculum_id: "E2.4"
post_type: "EX"
sidebar_title: "dplyr join() (10 problems)"
auto_link_terms: "dplyr join exercises|join practice problems|dplyr joins practice|left_join exercises|inner_join exercises"
auto_link_case_sensitive: false
fr_parent: "R-Joins.html"
difficulty: "Intermediate"
---


# dplyr join() Exercises: 10 Left, Right, Inner & Full Join Problems

<p class="lead">Ten progressive exercises turn <code>left_join()</code>, <code>right_join()</code>, <code>inner_join()</code>, and <code>full_join()</code> into reflexes. Every problem runs in your browser, states the expected row count so you know when you are right, and hides a worked solution you can reveal after trying.</p>

## What datasets will you use for these exercises?

Every problem on this page reuses four tiny hand-built tables: `employees`, `departments`, `salaries`, and `projects`. They are deliberately small so you can eyeball every row and spot join bugs by hand. The keys are picked to expose the situations that trip learners up, employees with no department, departments with no employees, and a table that uses a different column name for its foreign key. Run the setup block once, then work through the problems in order.

```r title="Build the four practice tables"
# Setup: load dplyr and build four small tables
library(dplyr)

employees <- tibble(
  emp_id  = c(1, 2, 3, 4, 5),
  name    = c("Asha", "Bo", "Cara", "Dan", "Evi"),
  dept_id = c(10, 20, 10, 30, 20)
)

departments <- tibble(
  dept_id   = c(10, 20, 40),
  dept_name = c("Sales", "Engineering", "Legal")
)

salaries <- tibble(
  dept_id    = c(10, 20, 30),
  avg_salary = c(55000, 85000, 60000)
)

projects <- tibble(
  project_id  = c("P1", "P2", "P3", "P4"),
  employee_id = c(1, 1, 3, 99),
  project     = c("Alpha", "Beta", "Gamma", "Ghost")
)

employees
#> # A tibble: 5 × 3
#>   emp_id name  dept_id
#>    <dbl> <chr>   <dbl>
#> 1      1 Asha       10
#> 2      2 Bo         20
#> 3      3 Cara       10
#> 4      4 Dan        30
#> 5      5 Evi        20

departments
#> # A tibble: 3 × 2
#>   dept_id dept_name
#>     <dbl> <chr>
#> 1      10 Sales
#> 2      20 Engineering
#> 3      40 Legal
```

Look closely at the keys before you touch any join. The `employees$dept_id` column contains 10, 20, 30. The `departments$dept_id` column contains 10, 20, 40. They overlap on just {10, 20}. Dept 30 (Dan) has no department row. Dept 40 (Legal) has no employees. These gaps drive every exercise below.

[TIP]
**Run the setup block first, once.** Every exercise reuses `employees`, `departments`, `salaries`, and `projects`. If your WebR session resets, come back and re-run Setup before continuing.

## Warm-Up, Your First Joins (Exercises 1–3)

These three exercises use one join each. If you get them right, you understand the core mechanics. Match the expected row counts exactly.

### Exercise 1: Attach department names (inner join)

Join `employees` to `departments` so every row has a `dept_name`. Drop any employee whose `dept_id` is missing from `departments`. Save to `ans1`. Expected: **4 rows** (Dan is dropped because dept 30 is not in `departments`).

```r title="Exercise: inner-join employees and departments"
# Exercise 1: inner join employees and departments on dept_id
# Hint: inner_join() keeps only matching keys

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Inner-join solution"
ans1 <- employees |> inner_join(departments, by = "dept_id")
ans1
#> # A tibble: 4 × 4
#>   emp_id name  dept_id dept_name
#>    <dbl> <chr>   <dbl> <chr>
#> 1      1 Asha       10 Sales
#> 2      2 Bo         20 Engineering
#> 3      3 Cara       10 Sales
#> 4      5 Evi        20 Engineering
```

**Explanation:** `inner_join()` keeps rows only when the key exists in both tables. Dan has `dept_id = 30`, which is absent from `departments`, so he is dropped. Dept 40 (Legal) has no employees and is also dropped. Four rows survive.

</details>

### Exercise 2: Keep every employee (left join)

Same tables, same key. This time keep every employee, even those without a department. Save to `ans2`. Expected: **5 rows** (Dan stays, with `dept_name = NA`).

```r title="Exercise: left-join for every employee"
# Exercise 2: left_join - keep every employee
# Hint: left_join() keeps all rows from the left table

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Left-join solution"
ans2 <- employees |> left_join(departments, by = "dept_id")
ans2
#> # A tibble: 5 × 4
#>   emp_id name  dept_id dept_name
#>    <dbl> <chr>   <dbl> <chr>
#> 1      1 Asha       10 Sales
#> 2      2 Bo         20 Engineering
#> 3      3 Cara       10 Sales
#> 4      4 Dan        30 NA
#> 5      5 Evi        20 Engineering
```

**Explanation:** `left_join()` keeps every row from the left table (`employees`). When the right table has no match, the new columns fill with `NA`. This is the single most common join, use it whenever you want to enrich a primary table without losing rows.

</details>

### Exercise 3: See what's missing on both sides (full join)

Join `departments` and `salaries` on `dept_id`. Show every department and every salary record, even orphans. Save to `ans3`. Expected: **4 rows** (depts 10 and 20 match; dept 40 is in departments only; dept 30 is in salaries only).

```r title="Exercise: full-join departments and salaries"
# Exercise 3: full_join - keep everything from both tables
# Hint: full_join() returns the union of keys

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Full-join solution"
ans3 <- departments |> full_join(salaries, by = "dept_id")
ans3
#> # A tibble: 4 × 3
#>   dept_id dept_name   avg_salary
#>     <dbl> <chr>            <dbl>
#> 1      10 Sales            55000
#> 2      20 Engineering      85000
#> 3      40 Legal               NA
#> 4      30 NA               60000
```

**Explanation:** `full_join()` returns the union of keys from both tables. Legal (dept 40) has no salary record, so `avg_salary` is `NA`. Dept 30 has a salary but no department name. Full join is the join you reach for when you need to audit data, it shows gaps on both sides.

</details>

## Core Problems, Join Types That Feel Alike (Exercises 4–7)

Warm-up done. These four exercises mix join types, chain joins together, and handle keys whose column names do not match.

### Exercise 4: Right join, then rewrite it as a left join

First, use `right_join()` to join `employees` to `departments` on `dept_id`. Save to `ans4a`. Expected: **5 rows** (the 4 matched employees plus Legal with `NA` name).

Then rewrite the same result using `left_join()` by swapping the arguments. Save to `ans4b`. The two should contain the same rows.

```r title="Exercise: right-join versus left-join"
# Exercise 4: right_join vs left_join equivalence
# Hint: right_join(A, B) == left_join(B, A) with columns reordered

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Right-versus-left solution"
ans4a <- employees |> right_join(departments, by = "dept_id")
ans4a
#> # A tibble: 5 × 4
#>   emp_id name  dept_id dept_name
#>    <dbl> <chr>   <dbl> <chr>
#> 1      1 Asha       10 Sales
#> 2      3 Cara       10 Sales
#> 3      2 Bo         20 Engineering
#> 4      5 Evi        20 Engineering
#> 5     NA NA         40 Legal

ans4b <- departments |> left_join(employees, by = "dept_id")
ans4b
#> # A tibble: 5 × 4
#>   dept_id dept_name   emp_id name
#>     <dbl> <chr>        <dbl> <chr>
#> 1      10 Sales            1 Asha
#> 2      10 Sales            3 Cara
#> 3      20 Engineering      2 Bo
#> 4      20 Engineering      5 Evi
#> 5      40 Legal           NA NA
```

**Explanation:** `right_join(A, B)` and `left_join(B, A)` return the same rows, only the column order differs. Most R style guides recommend `left_join()` because it reads naturally: "start with this table, attach extras." Reach for `right_join()` only when pipe order makes the intent clearer.

</details>

### Exercise 5: Chain two joins into one pipeline

Build a single table that has every employee, their department name, and their department's average salary. Use two joins. Save to `ans5`. Expected: **5 rows** (Dan has a salary but no dept name; Cara and Asha share dept 10).

```r title="Exercise: chain three tables with left-join"
# Exercise 5: chain employees -> departments -> salaries
# Hint: two left_join() calls in one pipe

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Chained-join solution"
ans5 <- employees |>
  left_join(departments, by = "dept_id") |>
  left_join(salaries,    by = "dept_id")
ans5
#> # A tibble: 5 × 5
#>   emp_id name  dept_id dept_name   avg_salary
#>    <dbl> <chr>   <dbl> <chr>            <dbl>
#> 1      1 Asha       10 Sales            55000
#> 2      2 Bo         20 Engineering      85000
#> 3      3 Cara       10 Sales            55000
#> 4      4 Dan        30 NA               60000
#> 5      5 Evi        20 Engineering      85000
```

**Explanation:** Chaining joins is just piping the result of one join into the next. Both joins share the `dept_id` key, so each `by =` looks identical. Dan keeps his salary (dept 30 exists in `salaries`) but has no `dept_name` (dept 30 is missing from `departments`).

</details>

### Exercise 6: Join when key columns have different names

The `employees` table uses `emp_id`. The `projects` table uses `employee_id`. Join them so every employee gets their project list. Keep every employee, even those with no project. Save to `ans6`. Expected: **6 rows** (Asha has 2 projects; Cara has 1; Bo, Dan, Evi have `NA` project rows; the orphan project "Ghost" is dropped).

```r title="Exercise: join on mismatched key names"
# Exercise 6: join on mismatched column names
# Hint: use by = c("emp_id" = "employee_id")

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Renamed-key solution"
ans6 <- employees |>
  left_join(projects, by = c("emp_id" = "employee_id"))
ans6
#> # A tibble: 6 × 5
#>   emp_id name  dept_id project_id project
#>    <dbl> <chr>   <dbl> <chr>      <chr>
#> 1      1 Asha       10 P1         Alpha
#> 2      1 Asha       10 P2         Beta
#> 3      2 Bo         20 NA         NA
#> 4      3 Cara       10 P3         Gamma
#> 5      4 Dan        30 NA         NA
#> 6      5 Evi        20 NA         NA
```

**Explanation:** The `by = c("left_col" = "right_col")` syntax maps differently named keys. The result keeps the left table's column name (`emp_id`). Asha appears twice because she has two projects, this row expansion is expected for one-to-many joins, not a bug.

</details>

[NOTE]
**Since dplyr 1.1, `join_by()` is the modern alternative to `by =` strings.** You can write `by = join_by(emp_id == employee_id)` for clearer intent and support for inequality joins. The string form still works everywhere and is fine for simple equality matches.

### Exercise 7: Join on multiple keys

Two tiny tables are built inline below. `sales_q` has one row per (region, quarter). `targets_q` has the target for each (region, quarter). Inner join them on **both** keys. Save to `ans7`. Expected: **3 rows** (three combinations match; two targets rows have no matching sales).

```r title="Exercise: join on region and quarter"
# Exercise 7: join on multiple keys
# Hint: by = c("region", "quarter")

sales_q <- tibble(
  region  = c("N", "N", "S", "S"),
  quarter = c("Q1", "Q2", "Q1", "Q2"),
  sales   = c(100, 120, 80, 95)
)

targets_q <- tibble(
  region  = c("N", "N", "N", "S"),
  quarter = c("Q1", "Q2", "Q3", "Q1"),
  target  = c(110, 115, 120, 90)
)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Multi-key solution"
ans7 <- sales_q |> inner_join(targets_q, by = c("region", "quarter"))
ans7
#> # A tibble: 3 × 4
#>   region quarter sales target
#>   <chr>  <chr>   <dbl>  <dbl>
#> 1 N      Q1        100    110
#> 2 N      Q2        120    115
#> 3 S      Q1         80     90
```

**Explanation:** Pass a character vector to `by =` to join on multiple keys. Both columns must match simultaneously. Only three (region, quarter) pairs appear in both tables: (N, Q1), (N, Q2), (S, Q1). The rest are dropped by the inner join.

</details>

## Advanced Challenges, Filter Joins and Debugging (Exercises 8–10)

The last three exercises move past basic joining. You will filter rows by membership in another table, and debug joins that silently produce wrong answers.

### Exercise 8: Filter employees by project membership

Use `semi_join()` to return only employees who have **at least one project**. Save to `ans8a`. Expected: **2 rows** (Asha and Cara).

Then use `anti_join()` to return employees with **no projects**. Save to `ans8b`. Expected: **3 rows** (Bo, Dan, Evi).

```r title="Exercise: semi-join and anti-join"
# Exercise 8: semi_join keeps matches; anti_join keeps non-matches
# Hint: both filter employees without adding project columns

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Semi-and-anti solution"
ans8a <- employees |> semi_join(projects, by = c("emp_id" = "employee_id"))
ans8a
#> # A tibble: 2 × 3
#>   emp_id name  dept_id
#>    <dbl> <chr>   <dbl>
#> 1      1 Asha       10
#> 2      3 Cara       10

ans8b <- employees |> anti_join(projects, by = c("emp_id" = "employee_id"))
ans8b
#> # A tibble: 3 × 3
#>   emp_id name  dept_id
#>    <dbl> <chr>   <dbl>
#> 1      2 Bo         20
#> 2      4 Dan        30
#> 3      5 Evi        20
```

**Explanation:** `semi_join()` and `anti_join()` are **filtering joins**. They return rows from the left table only, no columns from the right table are added. `semi_join()` keeps rows that have a match; `anti_join()` keeps rows that do not. Reach for them when you want to subset one table by membership in another without altering its columns.

</details>

[KEY INSIGHT]
**Filter joins return only the left table's columns.** This is the cleanest way to say "keep the rows of X that also appear in Y" without accidentally duplicating rows when Y has many matches per key. A `semi_join()` on duplicated keys in the right table still returns the left table's row count, not an inflated one.

### Exercise 9: Spot the row explosion

The `coupons` table below has **duplicated keys**, the same `customer_id` appears several times. Left-join `customers` to `coupons` on `customer_id` and examine how many rows come back. Save to `ans9`. Expected: **5 rows**, not 3, because customer 1 has three coupons.

Then ask yourself: is this a bug or expected behaviour?

```r title="Exercise: duplicate-key row explosion"
# Exercise 9: duplicate keys create a row explosion
# Hint: left_join() multiplies rows when the right side has duplicates

customers <- tibble(
  customer_id = c(1, 2, 3),
  cust_name   = c("Amy", "Ben", "Cal")
)

coupons <- tibble(
  customer_id = c(1, 1, 1, 2),
  coupon_code = c("X10", "X20", "X30", "Y5")
)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Row-explosion solution"
ans9 <- customers |> left_join(coupons, by = "customer_id")
ans9
#> # A tibble: 5 × 3
#>   customer_id cust_name coupon_code
#>         <dbl> <chr>     <chr>
#> 1           1 Amy       X10
#> 2           1 Amy       X20
#> 3           1 Amy       X30
#> 4           2 Ben       Y5
#> 5           3 Cal       NA
```

**Explanation:** The result has 5 rows because Amy matches three coupons. This is **expected** for one-to-many joins and is exactly what you want when you need all coupons per customer. It becomes a **bug** only when you thought you were doing a one-to-one join. Rule of thumb: if the result has more rows than the left table did, inspect the right side for duplicated keys before trusting the output.

</details>

### Exercise 10: Detect and fix an unintended many-to-many join

Two new tables below share the key `product_id`. Both sides have duplicates, `orders` has two rows for product 101, and `prices` has two rows for product 101 (two price tiers). A naive left join multiplies them into a 4-row cross product for that one product.

Do the naive join first and observe the row count. Then fix it by deduplicating `prices` to keep only the latest price per product, and join again. Save the fixed result to `ans10`. Expected after the fix: **3 rows**, one per order.

```r title="Exercise: fix many-to-many with slicemax"
# Exercise 10: many-to-many explosion and its fix
# Hint: use slice_max() on the right table before joining

orders <- tibble(
  order_id   = c("O1", "O2", "O3"),
  product_id = c(101, 101, 102),
  qty        = c(2, 1, 3)
)

prices <- tibble(
  product_id = c(101, 101, 102),
  price_date = as.Date(c("2026-01-01", "2026-03-01", "2026-02-01")),
  price      = c(9.99, 11.99, 4.50)
)

# First: do the naive join and check the row count.
# Then: fix it. Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Slice-max solution"
# Naive join: 4 rows (the explosion)
naive <- orders |> left_join(prices, by = "product_id")
nrow(naive)
#> [1] 4

# Fix: keep only the latest price per product, then join
latest_prices <- prices |>
  group_by(product_id) |>
  slice_max(price_date, n = 1) |>
  ungroup()

ans10 <- orders |> left_join(latest_prices, by = "product_id")
ans10
#> # A tibble: 3 × 5
#>   order_id product_id   qty price_date price
#>   <chr>         <dbl> <dbl> <date>     <dbl>
#> 1 O1              101     2 2026-03-01 11.99
#> 2 O2              101     1 2026-03-01 11.99
#> 3 O3              102     3 2026-02-01  4.50
```

**Explanation:** The naive join has 4 rows because product 101 has 2 orders and 2 prices, so the join creates 2 × 2 = 4 rows for that product. Real order tables expect one price per order, not two. The fix reduces the right side to one row per key before joining, `slice_max(price_date, n = 1)` keeps the most recent price per product. Since dplyr 1.1.0, an uncontrolled many-to-many join also emits a warning; that warning is a red flag, not noise.

</details>

[WARNING]
**Since dplyr 1.1, a many-to-many match triggers a warning by default.** If you see `Detected an unexpected many-to-many relationship`, stop and inspect, the join is almost certainly producing wrong row counts. Silence the warning only after you have verified the duplication is intentional by setting `relationship = "many-to-many"`.

## How can you avoid the most common join bugs?

Four mistakes catch almost every dplyr learner. Each one has a simple fix.

### Mistake 1: Omitting `by =` and hoping for the best

Leaving `by =` out lets dplyr guess keys by common column names. That works today, until a future table gains a shared column (`updated_at`, `id`) that was not meant as a join key.

```r title="Common mistake: joining without by"
# Joins on ALL shared columns - silently changes as schemas evolve
employees |> left_join(departments)
#> Joining with `by = join_by(dept_id)`

# Explicit, stable, reviewable
employees |> left_join(departments, by = "dept_id")
```

Always name the key. It is one extra argument, and it stops silent bugs.

### Mistake 2: Ignoring the many-to-many warning

Since dplyr 1.1.0, `left_join()` warns when the right side has duplicate keys and the match is not one-to-one. Many learners ignore it. If the row count jumps, that warning was pointing at a real bug, fix the right side before the join.

### Mistake 3: Type mismatch on keys drops every match

If the left key is `character` ("101") and the right key is `numeric` (101), every join returns zero matches without an error. Check key types before joining:

```r title="Check that key types match"
typeof(orders$product_id)
#> [1] "double"
typeof(prices$product_id)
#> [1] "double"
```

If they differ, coerce one side with `as.character()` or `as.integer()`.

### Mistake 4: Using `inner_join()` when you meant `left_join()`

`inner_join()` drops left-table rows that have no match. If you joined a primary table to a lookup and the row count fell, you probably wanted `left_join()`. Default to `left_join()` when enriching a primary table, use `inner_join()` only when missing matches truly mean "exclude this row."

[WARNING]
**Row count is your primary sanity check.** After every join, compare `nrow(result)` to the left table's row count. If the counts differ and you did not expect them to, stop and inspect before continuing.

## Putting It All Together: A Full Employee Report

Now combine what you practised into one pipeline. The goal is a single report that, for every employee, shows their department name, department salary, and the list of projects they are on. Missing data should show `"—"` instead of `NA` for readability.

```r title="End-to-end employee report"
full_report <- employees |>
  left_join(departments, by = "dept_id") |>
  left_join(salaries,    by = "dept_id") |>
  left_join(
    projects |>
      group_by(employee_id) |>
      summarise(projects = paste(project, collapse = ", "), .groups = "drop"),
    by = c("emp_id" = "employee_id")
  ) |>
  mutate(
    dept_name = coalesce(dept_name, "—"),
    projects  = coalesce(projects,  "—")
  ) |>
  select(emp_id, name, dept_name, avg_salary, projects)

full_report
#> # A tibble: 5 × 5
#>   emp_id name  dept_name   avg_salary projects
#>    <dbl> <chr> <chr>            <dbl> <chr>
#> 1      1 Asha  Sales            55000 Alpha, Beta
#> 2      2 Bo    Engineering      85000 —
#> 3      3 Cara  Sales            55000 Gamma
#> 4      4 Dan   —                60000 —
#> 5      5 Evi   Engineering      85000 —
```

This pipeline leans on every idea from the exercises above. The two `left_join()` calls keep every employee regardless of missing lookups. The inline `group_by() |> summarise()` collapses multiple projects per employee into a single string **before** joining, this is the defensive version of Exercise 10, preventing a row explosion up front. The `coalesce()` calls replace `NA` with `"—"` for display. The final result has exactly 5 rows, one per employee, with every piece of information needed for a management report.

## Summary

Commit the row-keeping rules to memory. The join type is the answer to one question: which rows must survive?

| Join | Keeps from Left | Keeps from Right | Typical Use |
|---|---|---|---|
| `inner_join()` | matches only | matches only | Strict, both sides required |
| `left_join()` | all rows | matches only | Enrich the primary table |
| `right_join()` | matches only | all rows | Rarely used; prefer left_join |
| `full_join()` | all rows | all rows | Audit gaps on both sides |
| `semi_join()` | matches only | none (filter) | "Keep rows that exist over there" |
| `anti_join()` | non-matches only | none (filter) | "Keep rows missing over there" |

[KEY INSIGHT]
**A join is a question about row-keeping, not table-merging.** Pick the join by asking "which rows must survive?", left only? right only? both? intersection? The answer names the join.

## References

1. dplyr mutating joins documentation. [Link](https://dplyr.tidyverse.org/reference/mutate-joins.html)
2. dplyr filtering joins documentation. [Link](https://dplyr.tidyverse.org/reference/filter-joins.html)
3. Wickham, H., Cetinkaya-Rundel, M., & Grolemund, G., *R for Data Science (2e)*, Chapter 19: Joins. [Link](https://r4ds.hadley.nz/joins.html)
4. Posit, dplyr 1.1.0 Joins announcement (introduces `join_by()` and the many-to-many warning). [Link](https://www.tidyverse.org/blog/2023/01/dplyr-1-1-0-joins/)
5. STAT 545, Join cheatsheet. [Link](https://stat545.com/join-cheatsheet.html)

## Continue Learning

- [R Joins: left, right, inner, full](R-Joins.html), the parent tutorial that walks through each mutating join with diagrams.
- [dplyr group_by() & summarise() Exercises](dplyr-group-by-summarise-Exercises.html), ten more problems covering aggregation and per-group slicing.
- [dplyr filter() and select()](dplyr-Filter-Select.html), upstream verbs you often use before joining.
