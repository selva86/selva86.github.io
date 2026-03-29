---
title: "R Data Frames Exercises: 15 Practice Questions (Beginner to Advanced — Solved Step-by-Step)"
slug: "R-Data-Frames-Exercises"
description: "15 R data frame exercises: create, filter, modify, group, summarize, and merge. Beginner to advanced with interactive solutions."
keywords: "R data frame exercises, R data frame practice, R data frame problems, R dplyr exercises, R filter exercises"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "E1.3"
post_type: "EX"
auto_link_terms: "R data frame exercises|R data frame practice|R data frame problems"
auto_link_case_sensitive: false
fr_parent: "R-Data-Frames.html"
---

# R Data Frames Exercises: 15 Practice Questions (Beginner to Advanced — Solved Step-by-Step)

<p class="lead">Practice R data frames with 15 progressively harder exercises. Create, explore, filter, modify, group, summarize, and merge — using both base R and dplyr. Each problem has interactive code and a detailed solution.</p>

These exercises use built-in datasets (`mtcars`, `iris`) and small custom data frames so you can run everything in your browser. Try each one before checking the solution.

## Easy (1-5): Create and Explore

### Exercise 1: Build a Data Frame

Create a data frame of 5 books with columns: title, author, pages, rating (1-5), and fiction (TRUE/FALSE).

```r
# Exercise 1: Create a books data frame
# Then print it and show its structure with str()

```

<details>
<summary>Click to reveal solution</summary>

```r
books <- data.frame(
  title = c("Dune", "1984", "Sapiens", "The Hobbit", "Thinking Fast and Slow"),
  author = c("Herbert", "Orwell", "Harari", "Tolkien", "Kahneman"),
  pages = c(412, 328, 443, 310, 499),
  rating = c(4.5, 4.7, 4.3, 4.8, 4.2),
  fiction = c(TRUE, TRUE, FALSE, TRUE, FALSE),
  stringsAsFactors = FALSE
)

print(books)
cat("\n")
str(books)
```

</details>

### Exercise 2: Explore mtcars

Using `mtcars`, find: number of rows, column names, first 3 rows, and summary statistics for mpg and hp.

```r
# Exercise 2: Explore mtcars

```

<details>
<summary>Click to reveal solution</summary>

```r
cat("Rows:", nrow(mtcars), "\n")
cat("Columns:", ncol(mtcars), "\n")
cat("Column names:", names(mtcars), "\n\n")

cat("First 3 rows:\n")
print(head(mtcars, 3))

cat("\nMPG summary:\n")
print(summary(mtcars$mpg))

cat("\nHP summary:\n")
print(summary(mtcars$hp))
```

</details>

### Exercise 3: Column Access

From `iris`, extract the Sepal.Length column three different ways ($, [[]], and [,]). Verify they're identical.

```r
# Exercise 3: Three ways to access a column

```

<details>
<summary>Click to reveal solution</summary>

```r
# Three ways
method1 <- iris$Sepal.Length
method2 <- iris[["Sepal.Length"]]
method3 <- iris[, "Sepal.Length"]

cat("$ method (first 5):", head(method1, 5), "\n")
cat("[[]]] method (first 5):", head(method2, 5), "\n")
cat("[,] method (first 5):", head(method3, 5), "\n")

cat("\nAll identical:", identical(method1, method2) & identical(method2, method3), "\n")
cat("Length:", length(method1), "\n")
cat("Type:", class(method1), "\n")
```

</details>

### Exercise 4: Add Columns

Using mtcars, add two new columns: `kpl` (kilometers per liter = mpg * 0.425) and `power_class` ("High" if hp > 150, else "Normal").

```r
# Exercise 4: Add calculated columns to mtcars

```

<details>
<summary>Click to reveal solution</summary>

```r
df <- mtcars
df$kpl <- round(df$mpg * 0.425, 2)
df$power_class <- ifelse(df$hp > 150, "High", "Normal")

# Show a few columns
print(df[1:6, c("mpg", "kpl", "hp", "power_class")])

cat("\nPower class distribution:\n")
print(table(df$power_class))
```

</details>

### Exercise 5: Sort

Sort mtcars by mpg (best first), then show the top 5 most fuel-efficient cars.

```r
# Exercise 5: Sort by mpg descending, show top 5

```

<details>
<summary>Click to reveal solution</summary>

```r
sorted <- mtcars[order(-mtcars$mpg), ]
top5 <- head(sorted, 5)
cat("Top 5 most fuel-efficient cars:\n")
print(top5[, c("mpg", "cyl", "hp", "wt")])
```

**Key concept:** `order(-mtcars$mpg)` sorts descending. `head()` takes the first n rows.

</details>

## Medium (6-10): Filter and Transform

### Exercise 6: Filter Rows

From mtcars, find all 4-cylinder cars with mpg > 25. How many are there? What's their average horsepower?

```r
# Exercise 6: Filter 4-cylinder, mpg > 25

```

<details>
<summary>Click to reveal solution</summary>

```r
efficient_4cyl <- mtcars[mtcars$cyl == 4 & mtcars$mpg > 25, ]
cat("Count:", nrow(efficient_4cyl), "\n")
cat("Average HP:", round(mean(efficient_4cyl$hp), 1), "\n\n")
cat("Cars:\n")
print(efficient_4cyl[, c("mpg", "cyl", "hp", "wt")])
```

</details>

### Exercise 7: dplyr Pipeline

Using dplyr, take mtcars, filter for automatic transmission (am == 0), select mpg, hp, and wt, add a column for hp_per_ton (hp / wt), and sort by hp_per_ton descending.

```r
# Exercise 7: dplyr pipeline
library(dplyr)

# Filter am == 0, select columns, add hp_per_ton, sort

```

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)

result <- mtcars |>
  mutate(car = rownames(mtcars)) |>
  filter(am == 0) |>
  select(car, mpg, hp, wt) |>
  mutate(hp_per_ton = round(hp / wt, 1)) |>
  arrange(desc(hp_per_ton))

print(result)
```

**Key concept:** The pipe `|>` chains operations left-to-right. Each step takes the result of the previous step as input.

</details>

### Exercise 8: Group and Summarize

Group mtcars by number of cylinders and calculate: count, average mpg, average hp, and the car with the best mpg in each group.

```r
# Exercise 8: Group by cyl, summarize
library(dplyr)

```

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)

mtcars |>
  mutate(car = rownames(mtcars)) |>
  group_by(cyl) |>
  summarise(
    count = n(),
    avg_mpg = round(mean(mpg), 1),
    avg_hp = round(mean(hp), 0),
    best_car = car[which.max(mpg)],
    best_mpg = max(mpg)
  )
```

</details>

### Exercise 9: Handle Missing Data

Create a data frame with NAs, then: count NAs per column, find complete rows, and fill numeric NAs with column means.

```r
# Exercise 9: Missing data handling
df <- data.frame(
  name = c("Alice", "Bob", "Carol", "David", "Eve", "Frank"),
  age = c(25, NA, 42, 31, NA, 55),
  score = c(88, 72, NA, 95, 81, NA),
  dept = c("Sales", "Eng", "Sales", NA, "Eng", "Sales")
)

# 1. Count NAs per column
# 2. Show complete cases
# 3. Fill numeric NAs with column means

```

<details>
<summary>Click to reveal solution</summary>

```r
df <- data.frame(
  name = c("Alice", "Bob", "Carol", "David", "Eve", "Frank"),
  age = c(25, NA, 42, 31, NA, 55),
  score = c(88, 72, NA, 95, 81, NA),
  dept = c("Sales", "Eng", "Sales", NA, "Eng", "Sales"),
  stringsAsFactors = FALSE
)

# 1. NAs per column
cat("NAs per column:\n")
print(colSums(is.na(df)))

# 2. Complete cases
cat("\nComplete cases:\n")
print(df[complete.cases(df), ])

# 3. Fill numeric NAs with column means
df$age[is.na(df$age)] <- round(mean(df$age, na.rm = TRUE))
df$score[is.na(df$score)] <- round(mean(df$score, na.rm = TRUE))

cat("\nAfter imputation:\n")
print(df)
```

</details>

### Exercise 10: Conditional Columns with case_when

Add a fuel_efficiency category to mtcars: "Excellent" (mpg > 25), "Good" (20-25), "Average" (15-20), "Poor" (< 15). Count cars in each category.

```r
# Exercise 10: Categorize with case_when
library(dplyr)

```

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)

result <- mtcars |>
  mutate(
    car = rownames(mtcars),
    efficiency = case_when(
      mpg > 25 ~ "Excellent",
      mpg > 20 ~ "Good",
      mpg > 15 ~ "Average",
      TRUE ~ "Poor"
    )
  )

# Category counts
cat("Fuel efficiency distribution:\n")
print(table(result$efficiency))

# Show examples from each category
cat("\nExamples:\n")
result |>
  group_by(efficiency) |>
  slice_max(mpg, n = 1) |>
  select(car, mpg, cyl, efficiency) |>
  arrange(desc(mpg)) |>
  print()
```

</details>

## Hard (11-15): Merge, Reshape, and Analysis

### Exercise 11: Merge Two Data Frames

Merge employee info with department budgets. Show each employee's department budget.

```r
# Exercise 11: Merge
employees <- data.frame(
  name = c("Alice", "Bob", "Carol", "David", "Eve"),
  dept = c("Eng", "Sales", "Eng", "HR", "Sales")
)
budgets <- data.frame(
  department = c("Eng", "Sales", "Marketing", "HR"),
  budget = c(500000, 300000, 200000, 150000)
)

# Merge employees with their department budgets

```

<details>
<summary>Click to reveal solution</summary>

```r
employees <- data.frame(
  name = c("Alice", "Bob", "Carol", "David", "Eve"),
  dept = c("Eng", "Sales", "Eng", "HR", "Sales")
)
budgets <- data.frame(
  department = c("Eng", "Sales", "Marketing", "HR"),
  budget = c(500000, 300000, 200000, 150000)
)

merged <- merge(employees, budgets, by.x = "dept", by.y = "department")
merged <- merged[order(merged$name), ]
print(merged)

cat("\nNote: Marketing has no employees — excluded from inner join\n")

# Left join to keep all budgets:
all_depts <- merge(employees, budgets, by.x = "dept", by.y = "department", all.y = TRUE)
print(all_depts)
```

</details>

### Exercise 12: Pivot/Reshape

Given wide-format quarterly data, calculate the annual total and find the best quarter for each product.

```r
# Exercise 12: Wide format analysis
sales <- data.frame(
  product = c("Widget", "Gadget", "Doohickey"),
  Q1 = c(100, 200, 150),
  Q2 = c(120, 180, 160),
  Q3 = c(140, 220, 130),
  Q4 = c(110, 250, 170)
)

# 1. Add an 'annual' total column
# 2. Which quarter was best for each product?

```

<details>
<summary>Click to reveal solution</summary>

```r
sales <- data.frame(
  product = c("Widget", "Gadget", "Doohickey"),
  Q1 = c(100, 200, 150),
  Q2 = c(120, 180, 160),
  Q3 = c(140, 220, 130),
  Q4 = c(110, 250, 170)
)

# 1. Annual total
quarter_cols <- c("Q1", "Q2", "Q3", "Q4")
sales$annual <- rowSums(sales[, quarter_cols])

# 2. Best quarter
sales$best_quarter <- apply(sales[, quarter_cols], 1, function(row) {
  quarter_cols[which.max(row)]
})

sales$best_value <- apply(sales[, quarter_cols], 1, max)

print(sales)
```

**Key concept:** `rowSums()` adds across columns. `apply(df, 1, func)` applies a function to each row (MARGIN=1).

</details>

### Exercise 13: Multi-step Analysis

Using iris, find the species with the largest average petal area (Petal.Length * Petal.Width) and the individual flower with the largest petal area.

```r
# Exercise 13: Iris petal area analysis
library(dplyr)

```

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)

result <- iris |>
  mutate(petal_area = Petal.Length * Petal.Width) |>
  group_by(Species) |>
  summarise(
    avg_area = round(mean(petal_area), 2),
    max_area = round(max(petal_area), 2),
    min_area = round(min(petal_area), 2),
    count = n()
  ) |>
  arrange(desc(avg_area))

cat("Average petal area by species:\n")
print(result)

# Individual flower with largest petal area
biggest <- iris |>
  mutate(petal_area = Petal.Length * Petal.Width) |>
  slice_max(petal_area, n = 1)

cat("\nLargest individual petal:\n")
print(biggest)
```

</details>

### Exercise 14: Cross-tabulation

From mtcars, create a cross-tabulation of cylinders vs transmission type. Show both counts and proportions.

```r
# Exercise 14: Cross-tabulation (cyl vs am)

```

<details>
<summary>Click to reveal solution</summary>

```r
df <- mtcars
df$transmission <- ifelse(df$am == 0, "Automatic", "Manual")
df$cylinders <- paste0(df$cyl, "-cyl")

# Count table
cat("Counts:\n")
count_tab <- table(df$cylinders, df$transmission)
print(count_tab)

# Proportions (by row — within each cylinder group)
cat("\nRow proportions (% within cylinder group):\n")
print(round(prop.table(count_tab, margin = 1) * 100, 1))

# Proportions (of total)
cat("\nOverall proportions:\n")
print(round(prop.table(count_tab) * 100, 1))
```

**Key concept:** `table()` creates a contingency table. `prop.table(tab, margin)` converts to proportions: margin=1 for rows, margin=2 for columns, no margin for overall.

</details>

### Exercise 15: Complete Analysis Report

Build a complete analysis of mtcars: summary by groups, top/bottom performers, correlation, and a final insight.

```r
# Exercise 15: Full mtcars analysis
library(dplyr)

# 1. Summary by cyl: count, avg mpg, avg hp, avg wt
# 2. Top 3 most efficient cars overall
# 3. Bottom 3 least efficient
# 4. Correlation between mpg and wt
# 5. Which is the most efficient car that has 8 cylinders?

```

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)

# 1. Summary by cylinders
cat("=== Performance by Cylinder Count ===\n")
mtcars |>
  group_by(cyl) |>
  summarise(
    count = n(),
    avg_mpg = round(mean(mpg), 1),
    avg_hp = round(mean(hp), 0),
    avg_wt = round(mean(wt), 2)
  ) |>
  print()

# 2. Top 3 most efficient
cat("\n=== Top 3 Most Efficient ===\n")
top3 <- mtcars |>
  mutate(car = rownames(mtcars)) |>
  arrange(desc(mpg)) |>
  head(3) |>
  select(car, mpg, cyl, hp, wt)
print(top3)

# 3. Bottom 3
cat("\n=== Bottom 3 Least Efficient ===\n")
bottom3 <- mtcars |>
  mutate(car = rownames(mtcars)) |>
  arrange(mpg) |>
  head(3) |>
  select(car, mpg, cyl, hp, wt)
print(bottom3)

# 4. Correlation
cat("\n=== MPG vs Weight Correlation ===\n")
cat("Correlation:", round(cor(mtcars$mpg, mtcars$wt), 3), "\n")
cat("Interpretation: Strong negative — heavier cars get worse MPG\n")

# 5. Best 8-cylinder car
cat("\n=== Most Efficient 8-Cylinder ===\n")
best_v8 <- mtcars |>
  mutate(car = rownames(mtcars)) |>
  filter(cyl == 8) |>
  slice_max(mpg, n = 1) |>
  select(car, mpg, hp, wt)
print(best_v8)
```

</details>

## Summary: Skills Practiced

| Exercises | Data Frame Skills |
|-----------|------------------|
| 1-5 (Easy) | Create, explore, `str()`, add columns, sort |
| 6-10 (Medium) | Filter, dplyr pipes, `group_by`/`summarise`, NAs, `case_when` |
| 11-15 (Hard) | Merge, reshape, cross-tabulation, complete analysis |

## What's Next?

More exercise sets:

1. **R Lists Exercises** — 10 problems with nested structures
2. **R Control Flow Exercises** — if/else and loop practice
3. **R Functions Exercises** — write, debug, and optimize functions

Or continue learning: **R Lists** tutorial.
