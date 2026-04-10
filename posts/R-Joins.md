---
title: "R Joins Explained: inner_join, left_join, full_join — With Visual Diagrams"
slug: "R-Joins"
description: "Master R joins with dplyr: inner_join, left_join, right_join, full_join, semi_join, anti_join. Visual diagrams, multiple keys, and suffix handling."
keywords: "R joins, inner_join, left_join, right_join, full_join, dplyr joins, merge R, semi_join, anti_join, join by multiple keys"
mathjax: false
webr: true
date: "2026-03-30"
curriculum_id: "1.2.7"
post_type: "C"
sidebar_text: "R Joins"
curriculum_path: "/data-wrangling/dplyr/"
auto_link_terms: "R joins|inner_join|left_join|right_join|full_join|semi_join|anti_join|dplyr joins"
auto_link_case_sensitive: false
---

# R Joins Explained: inner_join, left_join, full_join — With Visual Diagrams

<p class="lead">Joins combine two data frames by matching rows on shared columns. dplyr provides six join types: <code>inner_join</code> (only matches), <code>left_join</code> (all left rows), <code>right_join</code> (all right rows), <code>full_join</code> (everything), plus <code>semi_join</code> and <code>anti_join</code> for filtering.</p>

Joins are how you combine information from different tables — employees with departments, orders with products, students with grades. The join type determines what happens to rows that don't have a match.

## Setup: Two Example Tables

```r
library(dplyr)

employees <- data.frame(
  id      = c(1, 2, 3, 4, 5),
  name    = c("Alice", "Bob", "Carol", "David", "Eve"),
  dept_id = c(10, 20, 10, 30, 20)
)

departments <- data.frame(
  dept_id   = c(10, 20, 40),
  dept_name = c("Engineering", "Marketing", "Sales")
)

cat("Employees:\n"); print(employees)
cat("\nDepartments:\n"); print(departments)
cat("\nNote: David has dept_id=30 (no match). Sales has dept_id=40 (no employees).\n")
```

## inner_join: Only Matching Rows

Keeps rows that have a match in BOTH tables. David (dept 30) and Sales (dept 40) are both dropped.

```r
library(dplyr)

employees <- data.frame(id=1:5, name=c("Alice","Bob","Carol","David","Eve"), dept_id=c(10,20,10,30,20))
departments <- data.frame(dept_id=c(10,20,40), dept_name=c("Engineering","Marketing","Sales"))

inner_join(employees, departments, by = "dept_id")
```

## left_join: All Left Rows + Matches

Keeps ALL rows from the left table. Unmatched right values become NA. This is the most common join type.

```r
library(dplyr)

employees <- data.frame(id=1:5, name=c("Alice","Bob","Carol","David","Eve"), dept_id=c(10,20,10,30,20))
departments <- data.frame(dept_id=c(10,20,40), dept_name=c("Engineering","Marketing","Sales"))

left_join(employees, departments, by = "dept_id")
# David (dept 30) has NA for dept_name — no matching department
```

## right_join: All Right Rows + Matches

```r
library(dplyr)

employees <- data.frame(id=1:5, name=c("Alice","Bob","Carol","David","Eve"), dept_id=c(10,20,10,30,20))
departments <- data.frame(dept_id=c(10,20,40), dept_name=c("Engineering","Marketing","Sales"))

right_join(employees, departments, by = "dept_id")
# Sales (dept 40) appears with NA for id, name — no matching employee
```

## full_join: Keep Everything

Keeps ALL rows from BOTH tables. Missing matches become NA on either side.

```r
library(dplyr)

employees <- data.frame(id=1:5, name=c("Alice","Bob","Carol","David","Eve"), dept_id=c(10,20,10,30,20))
departments <- data.frame(dept_id=c(10,20,40), dept_name=c("Engineering","Marketing","Sales"))

full_join(employees, departments, by = "dept_id")
# Both David (no dept match) AND Sales (no employee match) kept
```

## Join Type Summary

| Join | Left rows kept | Right rows kept | Adds columns? |
|------|---------------|----------------|---------------|
| `inner_join` | Matched only | Matched only | Yes |
| `left_join` | All | Matched only | Yes |
| `right_join` | Matched only | All | Yes |
| `full_join` | All | All | Yes |
| `semi_join` | Matched only | — | No |
| `anti_join` | Unmatched only | — | No |

## semi_join and anti_join: Filtering Joins

These don't add columns — they filter the left table based on whether matches exist in the right table.

```r
library(dplyr)

employees <- data.frame(id=1:5, name=c("Alice","Bob","Carol","David","Eve"), dept_id=c(10,20,10,30,20))
departments <- data.frame(dept_id=c(10,20,40), dept_name=c("Engineering","Marketing","Sales"))

# semi_join: employees who HAVE a matching department
cat("Employees with matching dept:\n")
semi_join(employees, departments, by = "dept_id")
```

```r
library(dplyr)

employees <- data.frame(id=1:5, name=c("Alice","Bob","Carol","David","Eve"), dept_id=c(10,20,10,30,20))
departments <- data.frame(dept_id=c(10,20,40), dept_name=c("Engineering","Marketing","Sales"))

# anti_join: employees who DON'T have a matching department
cat("Employees without matching dept:\n")
anti_join(employees, departments, by = "dept_id")
```

> Use `semi_join` when you want "give me rows from A that exist in B" without adding B's columns. Use `anti_join` for "give me rows from A that DON'T exist in B" — perfect for finding orphan records.

## Joining on Multiple Keys

When a single column isn't enough to identify a match, join on multiple columns.

```r
library(dplyr)

midterms <- data.frame(
  student = c("Alice","Alice","Bob","Bob"),
  subject = c("Math","English","Math","English"),
  midterm = c(88, 92, 76, 81)
)

finals <- data.frame(
  student = c("Alice","Alice","Bob"),
  subject = c("Math","English","Math"),
  final   = c(91, 88, 82)
)

# Join on BOTH student AND subject
left_join(midterms, finals, by = c("student", "subject"))
# Bob's English final is NA — no match for that combination
```

## Different Column Names

When the key columns have different names in each table, use a named vector.

```r
library(dplyr)

orders <- data.frame(order_id = 1:3, customer_id = c(101, 102, 101))
customers <- data.frame(cust_id = c(101, 102, 103), name = c("Alice", "Bob", "Carol"))

# Key is customer_id in orders, cust_id in customers
left_join(orders, customers, by = c("customer_id" = "cust_id"))
```

## Handling Column Name Conflicts

When both tables have a non-key column with the same name, dplyr adds suffixes.

```r
library(dplyr)

df1 <- data.frame(id = 1:3, value = c(10, 20, 30))
df2 <- data.frame(id = 1:3, value = c(100, 200, 300))

left_join(df1, df2, by = "id", suffix = c("_old", "_new"))
```

## Join + Summarise Pipeline

A common pattern: join tables, then aggregate.

```r
library(dplyr)

products <- data.frame(
  prod_id = 1:4,
  name    = c("Widget", "Gadget", "Doohickey", "Thingamajig"),
  price   = c(10, 25, 5, 50)
)

orders <- data.frame(
  order_id = 1:6,
  prod_id  = c(1, 2, 1, 3, 2, 1),
  qty      = c(5, 2, 3, 10, 1, 4)
)

orders |>
  left_join(products, by = "prod_id") |>
  mutate(revenue = qty * price) |>
  group_by(name) |>
  summarise(
    total_qty = sum(qty),
    total_rev = sum(revenue),
    .groups = "drop"
  ) |>
  arrange(desc(total_rev))
```

## dplyr Joins vs base R merge()

| Feature | dplyr joins | `merge()` |
|---------|------------|-----------|
| Syntax | `left_join(a, b, by=)` | `merge(a, b, by=, all.x=TRUE)` |
| Speed | Faster | Slower |
| Row order | Preserved | Shuffled |
| Filtering joins | `semi_join`, `anti_join` | Not available |
| Pipe-friendly | Yes | Awkward |
| Error messages | Clear | Cryptic |

## Practice Exercises

### Exercise 1: Customer Orders

Join customers with orders, then find customers who have never ordered.

```r
library(dplyr)

customers <- data.frame(id = 1:5, name = c("Alice","Bob","Carol","David","Eve"))
orders <- data.frame(order_id = 1:4, cust_id = c(1,1,3,5), amount = c(50,30,75,20))

# 1. Show all customers with their orders (keep all customers)
# 2. Find customers who have zero orders

```

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)

customers <- data.frame(id = 1:5, name = c("Alice","Bob","Carol","David","Eve"))
orders <- data.frame(order_id = 1:4, cust_id = c(1,1,3,5), amount = c(50,30,75,20))

cat("All customers with orders:\n")
left_join(customers, orders, by = c("id" = "cust_id"))

cat("\nCustomers with no orders:\n")
anti_join(customers, orders, by = c("id" = "cust_id"))
```

**Explanation:** `left_join` keeps all customers; those without orders have NA in order columns. `anti_join` returns only customers with no match in the orders table.

</details>

### Exercise 2: Three-Table Join

Join students → enrollments → courses to get a complete picture.

```r
library(dplyr)

students    <- data.frame(student_id = 1:4, name = c("Alice","Bob","Carol","David"))
enrollments <- data.frame(student_id = c(1,1,2,3), course_id = c("CS101","MATH201","CS101","MATH201"))
courses     <- data.frame(course_id = c("CS101","MATH201","ENG101"), title = c("Intro CS","Calculus","English"))

# Chain two joins to get: student name + course title

```

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)

students    <- data.frame(student_id = 1:4, name = c("Alice","Bob","Carol","David"))
enrollments <- data.frame(student_id = c(1,1,2,3), course_id = c("CS101","MATH201","CS101","MATH201"))
courses     <- data.frame(course_id = c("CS101","MATH201","ENG101"), title = c("Intro CS","Calculus","English"))

students |>
  left_join(enrollments, by = "student_id") |>
  left_join(courses, by = "course_id") |>
  select(name, title)
```

**Explanation:** Chain joins with the pipe. David has no enrollment → NA for course_id and title. ENG101 has no students → doesn't appear (it's not in the left tables).

</details>

### Exercise 3: Find Mismatches Both Ways

Find employees without valid departments AND departments without any employees.

```r
library(dplyr)

emps  <- data.frame(name = c("Alice","Bob","Carol","David"), dept_id = c(1,2,1,4))
depts <- data.frame(dept_id = c(1,2,3), dept_name = c("Eng","Mkt","Sales"))

```

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)

emps  <- data.frame(name = c("Alice","Bob","Carol","David"), dept_id = c(1,2,1,4))
depts <- data.frame(dept_id = c(1,2,3), dept_name = c("Eng","Mkt","Sales"))

cat("Employees without valid dept:\n")
anti_join(emps, depts, by = "dept_id")

cat("\nDepartments with no employees:\n")
anti_join(depts, emps, by = "dept_id")
```

**Explanation:** `anti_join(A, B)` returns rows in A with no match in B. Swap the arguments to find the opposite direction's mismatches.

</details>

## Summary

| Join | Keeps | Use case |
|------|-------|----------|
| `inner_join(a, b)` | Only matching rows | "Give me rows that exist in both" |
| `left_join(a, b)` | All from a + matches from b | "Keep all of a, add b's info" (most common) |
| `right_join(a, b)` | Matches from a + all from b | Same as left_join with arguments swapped |
| `full_join(a, b)` | Everything from both | "Keep everything, fill gaps with NA" |
| `semi_join(a, b)` | a rows that match b | "Filter a to things that exist in b" |
| `anti_join(a, b)` | a rows that DON'T match b | "Find orphans — what's in a but not b" |

## FAQ

### What happens with duplicate keys?

If a key matches multiple rows in the other table, you get all combinations. For a one-to-many join (one customer, many orders), this is correct — each order gets the customer info. For accidental many-to-many joins, rows multiply unexpectedly.

### Should I use dplyr joins or merge()?

Use dplyr joins. They preserve row order, offer semi/anti joins, produce clear error messages, and work naturally with the pipe. Use `merge()` only when dplyr isn't available.

### What if the key columns have different names?

Use a named vector: `left_join(a, b, by = c("emp_id" = "employee_id"))`. The left side is the column name in `a`, the right side in `b`.

### How do I join on ALL shared column names?

Omit `by =` — dplyr will auto-detect shared column names and join on all of them. But being explicit is safer to avoid accidental joins on unintended columns.

## Continue Learning

- [dplyr filter & select](/dplyr-filter-select.html) — filter before joining
- [dplyr group_by & summarise](/dplyr-group-by-summarise.html) — summarise after joining
- [Tidy Data](/Tidy-Data-in-R.html) — reshape joined data into tidy format
