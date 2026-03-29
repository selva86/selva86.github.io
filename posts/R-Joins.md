---
title: "R Joins Explained: inner_join, left_join, full_join — With Visual Diagrams"
slug: "R-Joins"
description: "Master R joins: inner_join, left_join, right_join, full_join, semi_join, anti_join. Visual diagrams, multiple keys, and suffix handling."
keywords: "R joins, inner_join, left_join, right_join, full_join, dplyr joins, merge R, semi_join, anti_join"
mathjax: false
webr: true
date: "2026-03-30"
curriculum_id: "1.2.7"
post_type: "C"
sidebar_text: "R Joins"
curriculum_path: "/data-wrangling/dplyr/"
auto_link_terms: "R joins|inner_join|left_join|right_join|full_join|semi_join|anti_join"
auto_link_case_sensitive: false
---

# R Joins Explained: inner_join, left_join, full_join — With Visual Diagrams

<p class="lead">Joins combine two data frames by matching rows on shared columns. dplyr provides six join types: <code>inner_join</code>, <code>left_join</code>, <code>right_join</code>, <code>full_join</code>, <code>semi_join</code>, and <code>anti_join</code>.</p>

## Setup: Two Tables

```r
library(dplyr)

employees <- data.frame(
  id = c(1, 2, 3, 4, 5),
  name = c("Alice", "Bob", "Carol", "David", "Eve"),
  dept_id = c(10, 20, 10, 30, 20)
)

departments <- data.frame(
  dept_id = c(10, 20, 40),
  dept_name = c("Engineering", "Marketing", "Sales")
)

cat("Employees:\n"); print(employees)
cat("\nDepartments:\n"); print(departments)
```

## inner_join: Keep Only Matches

Keeps rows that have a match in BOTH tables. David (dept 30) and Sales (dept 40) are dropped.

```r
library(dplyr)

employees <- data.frame(id=1:5, name=c("Alice","Bob","Carol","David","Eve"), dept_id=c(10,20,10,30,20))
departments <- data.frame(dept_id=c(10,20,40), dept_name=c("Engineering","Marketing","Sales"))

inner_join(employees, departments, by = "dept_id")
```

## left_join: Keep All Left Rows

Keeps ALL rows from the left table. Unmatched right-side values become NA.

```r
library(dplyr)

employees <- data.frame(id=1:5, name=c("Alice","Bob","Carol","David","Eve"), dept_id=c(10,20,10,30,20))
departments <- data.frame(dept_id=c(10,20,40), dept_name=c("Engineering","Marketing","Sales"))

left_join(employees, departments, by = "dept_id")
# David has dept_id 30 — no match, so dept_name is NA
```

## right_join: Keep All Right Rows

```r
library(dplyr)

employees <- data.frame(id=1:5, name=c("Alice","Bob","Carol","David","Eve"), dept_id=c(10,20,10,30,20))
departments <- data.frame(dept_id=c(10,20,40), dept_name=c("Engineering","Marketing","Sales"))

right_join(employees, departments, by = "dept_id")
# Sales (dept 40) has no employees — id, name are NA
```

## full_join: Keep Everything

```r
library(dplyr)

employees <- data.frame(id=1:5, name=c("Alice","Bob","Carol","David","Eve"), dept_id=c(10,20,10,30,20))
departments <- data.frame(dept_id=c(10,20,40), dept_name=c("Engineering","Marketing","Sales"))

full_join(employees, departments, by = "dept_id")
# David (no dept match) AND Sales (no employee match) both kept with NAs
```

## semi_join and anti_join: Filtering Joins

These don't add columns — they filter rows.

```r
library(dplyr)

employees <- data.frame(id=1:5, name=c("Alice","Bob","Carol","David","Eve"), dept_id=c(10,20,10,30,20))
departments <- data.frame(dept_id=c(10,20,40), dept_name=c("Engineering","Marketing","Sales"))

# semi_join: keep employees who HAVE a matching department
cat("semi_join (employees with matching dept):\n")
semi_join(employees, departments, by = "dept_id")
```

```r
library(dplyr)

employees <- data.frame(id=1:5, name=c("Alice","Bob","Carol","David","Eve"), dept_id=c(10,20,10,30,20))
departments <- data.frame(dept_id=c(10,20,40), dept_name=c("Engineering","Marketing","Sales"))

# anti_join: keep employees who DON'T have a matching department
cat("anti_join (employees without matching dept):\n")
anti_join(employees, departments, by = "dept_id")
```

## Join Summary Table

| Join Type | Keeps from Left | Keeps from Right | Adds Columns? |
|-----------|----------------|-----------------|---------------|
| `inner_join` | Matched only | Matched only | Yes |
| `left_join` | All | Matched only | Yes |
| `right_join` | Matched only | All | Yes |
| `full_join` | All | All | Yes |
| `semi_join` | Matched only | — | No |
| `anti_join` | Unmatched only | — | No |

## Joining on Multiple Keys

```r
library(dplyr)

scores <- data.frame(
  student = c("Alice", "Alice", "Bob", "Bob"),
  subject = c("Math", "English", "Math", "English"),
  score = c(92, 88, 76, 82)
)

grades <- data.frame(
  student = c("Alice", "Bob"),
  subject = c("Math", "Math"),
  grade = c("A", "C")
)

# Join on BOTH student AND subject
left_join(scores, grades, by = c("student", "subject"))
```

## Handling Column Name Conflicts

```r
library(dplyr)

df1 <- data.frame(id = 1:3, value = c(10, 20, 30))
df2 <- data.frame(id = 1:3, value = c(100, 200, 300))

# Both have "value" — dplyr adds suffixes
left_join(df1, df2, by = "id", suffix = c("_original", "_new"))
```

## dplyr Joins vs base R merge()

| Feature | dplyr joins | `merge()` |
|---------|------------|-----------|
| Syntax | `left_join(a, b, by=)` | `merge(a, b, by=, all.x=TRUE)` |
| Speed | Faster | Slower |
| Row order | Preserved | Changed |
| Filtering joins | `semi_join`, `anti_join` | Not available |
| Pipe-friendly | Yes | Awkward |

## Practice Exercises

### Exercise 1: Customer Orders

Join customers with their orders and find customers with no orders.

```r
library(dplyr)

customers <- data.frame(
  cust_id = c(1, 2, 3, 4, 5),
  name = c("Alice", "Bob", "Carol", "David", "Eve")
)

orders <- data.frame(
  order_id = c(101, 102, 103, 104),
  cust_id = c(1, 1, 3, 5),
  amount = c(50, 30, 75, 20)
)

# 1. Join customers with their orders (keep all customers)
# 2. Find customers who have never ordered

```

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)

customers <- data.frame(cust_id=c(1,2,3,4,5), name=c("Alice","Bob","Carol","David","Eve"))
orders <- data.frame(order_id=c(101,102,103,104), cust_id=c(1,1,3,5), amount=c(50,30,75,20))

# 1. All customers with their orders
cat("All customers + orders:\n")
left_join(customers, orders, by = "cust_id")

# 2. Customers with no orders
cat("\nNo orders:\n")
anti_join(customers, orders, by = "cust_id")
```

</details>

## FAQ

### What happens with duplicate keys?

If a key matches multiple rows in the other table, you get all combinations (a Cartesian product for that key). This is correct behavior for one-to-many joins, but can unexpectedly multiply rows in many-to-many joins.

### Should I use dplyr joins or merge()?

Use dplyr joins. They're faster, preserve row order, offer filtering joins (semi/anti), and chain with the pipe. Use `merge()` only if you can't install dplyr.

### What if the key columns have different names?

Use `by = c("left_name" = "right_name")`: `left_join(df1, df2, by = c("emp_id" = "employee_id"))`.

## What's Next?

- [dplyr filter & select](/dplyr-filter-select.html) — filter before joining
- [dplyr group_by & summarise](/dplyr-group-by-summarise.html) — summarise after joining
- [Tidy Data](/Tidy-Data-in-R.html) — reshape joined data
