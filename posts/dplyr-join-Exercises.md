---
title: "dplyr join() Exercises: 10 Left, Right, Inner & Full Join Problems"
slug: "dplyr-join-Exercises"
description: "10 R join exercises covering inner_join, left_join, full_join, semi_join, anti_join. Practice with employees, orders, and multi-key joins."
keywords: "dplyr join exercises, R join practice, left_join exercises, inner_join practice"
mathjax: false
webr: true
date: "2026-03-30"
curriculum_id: "E2.4"
post_type: "EX"
sidebar_text: "R Joins (10 problems)"
auto_link_terms: "join exercises|R join practice"
auto_link_case_sensitive: false
fr_parent: "R-Joins.html"
---

# dplyr join() Exercises: 10 Left, Right, Inner & Full Join Problems

<p class="lead">10 join exercises: inner, left, right, full, semi, and anti joins. Practice with employee-department, customer-order, and multi-key scenarios.</p>

### Exercise 1: Inner Join

Join students with their test scores. Only show students who have scores.

```r
library(dplyr)
students <- data.frame(id=1:5, name=c("Alice","Bob","Carol","David","Eve"))
scores <- data.frame(student_id=c(1,2,2,4), test=c("A","A","B","A"), score=c(88,76,82,91))

```

<details><summary>Click to reveal solution</summary>

```r
library(dplyr)
students <- data.frame(id=1:5, name=c("Alice","Bob","Carol","David","Eve"))
scores <- data.frame(student_id=c(1,2,2,4), test=c("A","A","B","A"), score=c(88,76,82,91))
inner_join(students, scores, by = c("id" = "student_id"))
```

</details>

### Exercise 2: Left Join

Show ALL students with their scores. Students without scores should show NA.

```r
library(dplyr)
students <- data.frame(id=1:5, name=c("Alice","Bob","Carol","David","Eve"))
scores <- data.frame(student_id=c(1,2,4), score=c(88,76,91))

```

<details><summary>Click to reveal solution</summary>

```r
library(dplyr)
students <- data.frame(id=1:5, name=c("Alice","Bob","Carol","David","Eve"))
scores <- data.frame(student_id=c(1,2,4), score=c(88,76,91))
left_join(students, scores, by = c("id" = "student_id"))
```

</details>

### Exercise 3: Anti Join

Find products that have never been ordered.

```r
library(dplyr)
products <- data.frame(prod_id=1:6, name=c("Laptop","Mouse","Keyboard","Monitor","Webcam","Headset"))
orders <- data.frame(order_id=1:4, prod_id=c(1,2,1,4))

```

<details><summary>Click to reveal solution</summary>

```r
library(dplyr)
products <- data.frame(prod_id=1:6, name=c("Laptop","Mouse","Keyboard","Monitor","Webcam","Headset"))
orders <- data.frame(order_id=1:4, prod_id=c(1,2,1,4))
anti_join(products, orders, by = "prod_id")
```

</details>

### Exercise 4: Full Join

Combine two months of data, keeping all products from both.

```r
library(dplyr)
jan <- data.frame(product=c("A","B","C"), jan_sales=c(100,200,150))
feb <- data.frame(product=c("B","C","D"), feb_sales=c(220,160,90))

```

<details><summary>Click to reveal solution</summary>

```r
library(dplyr)
jan <- data.frame(product=c("A","B","C"), jan_sales=c(100,200,150))
feb <- data.frame(product=c("B","C","D"), feb_sales=c(220,160,90))
full_join(jan, feb, by = "product")
```

</details>

### Exercise 5: Multi-Key Join

Join on both student AND subject.

```r
library(dplyr)
midterms <- data.frame(student=c("Alice","Alice","Bob","Bob"), subject=c("Math","English","Math","English"), midterm=c(88,92,76,81))
finals <- data.frame(student=c("Alice","Alice","Bob"), subject=c("Math","English","Math"), final=c(91,88,82))

```

<details><summary>Click to reveal solution</summary>

```r
library(dplyr)
midterms <- data.frame(student=c("Alice","Alice","Bob","Bob"), subject=c("Math","English","Math","English"), midterm=c(88,92,76,81))
finals <- data.frame(student=c("Alice","Alice","Bob"), subject=c("Math","English","Math"), final=c(91,88,82))
left_join(midterms, finals, by = c("student", "subject"))
```

</details>

### Exercise 6: Semi Join

Find employees who have at least one sale.

```r
library(dplyr)
employees <- data.frame(emp_id=1:5, name=c("Alice","Bob","Carol","David","Eve"))
sales <- data.frame(sale_id=1:4, emp_id=c(2,2,4,5), amount=c(500,300,700,200))

```

<details><summary>Click to reveal solution</summary>

```r
library(dplyr)
employees <- data.frame(emp_id=1:5, name=c("Alice","Bob","Carol","David","Eve"))
sales <- data.frame(sale_id=1:4, emp_id=c(2,2,4,5), amount=c(500,300,700,200))
semi_join(employees, sales, by = "emp_id")
```

</details>

### Exercise 7: Join + Summarise

Join orders with products, then total revenue per product.

```r
library(dplyr)
products <- data.frame(id=1:3, name=c("Widget","Gadget","Doohickey"), price=c(10,25,5))
orders <- data.frame(order_id=1:6, product_id=c(1,2,1,3,2,1), qty=c(5,2,3,10,1,4))

```

<details><summary>Click to reveal solution</summary>

```r
library(dplyr)
products <- data.frame(id=1:3, name=c("Widget","Gadget","Doohickey"), price=c(10,25,5))
orders <- data.frame(order_id=1:6, product_id=c(1,2,1,3,2,1), qty=c(5,2,3,10,1,4))
orders |>
  left_join(products, by = c("product_id" = "id")) |>
  mutate(revenue = qty * price) |>
  group_by(name) |>
  summarise(total_qty = sum(qty), total_revenue = sum(revenue), .groups = "drop") |>
  arrange(desc(total_revenue))
```

</details>

### Exercise 8: Handle Suffix Conflicts

Both tables have a "value" column. Join with clear suffixes.

```r
library(dplyr)
df1 <- data.frame(id=1:3, value=c(10,20,30))
df2 <- data.frame(id=1:3, value=c(100,200,300))

```

<details><summary>Click to reveal solution</summary>

```r
library(dplyr)
df1 <- data.frame(id=1:3, value=c(10,20,30))
df2 <- data.frame(id=1:3, value=c(100,200,300))
left_join(df1, df2, by = "id", suffix = c("_original", "_new"))
```

</details>

### Exercise 9: Chain of Joins

Join three tables together.

```r
library(dplyr)
students <- data.frame(id=1:3, name=c("Alice","Bob","Carol"))
courses <- data.frame(student_id=c(1,1,2,3), course=c("Math","Eng","Math","Eng"))
grades <- data.frame(student_id=c(1,1,2,3), course=c("Math","Eng","Math","Eng"), grade=c("A","B","B","A"))

```

<details><summary>Click to reveal solution</summary>

```r
library(dplyr)
students <- data.frame(id=1:3, name=c("Alice","Bob","Carol"))
courses <- data.frame(student_id=c(1,1,2,3), course=c("Math","Eng","Math","Eng"))
grades <- data.frame(student_id=c(1,1,2,3), course=c("Math","Eng","Math","Eng"), grade=c("A","B","B","A"))

students |>
  left_join(courses, by = c("id" = "student_id")) |>
  left_join(grades, by = c("id" = "student_id", "course"))
```

</details>

### Exercise 10: Find Mismatches Both Ways

Find employees without departments AND departments without employees.

```r
library(dplyr)
emps <- data.frame(name=c("Alice","Bob","Carol","David"), dept_id=c(1,2,1,4))
depts <- data.frame(dept_id=c(1,2,3), dept_name=c("Eng","Mkt","Sales"))

```

<details><summary>Click to reveal solution</summary>

```r
library(dplyr)
emps <- data.frame(name=c("Alice","Bob","Carol","David"), dept_id=c(1,2,1,4))
depts <- data.frame(dept_id=c(1,2,3), dept_name=c("Eng","Mkt","Sales"))

cat("Employees without valid dept:\n")
anti_join(emps, depts, by = "dept_id")

cat("\nDepartments with no employees:\n")
anti_join(depts, emps, by = "dept_id")
```

</details>

## What's Next?

- [R Joins](/R-Joins.html) — review all join types
- [dplyr Exercises](/dplyr-Exercises.html) — broader dplyr practice
