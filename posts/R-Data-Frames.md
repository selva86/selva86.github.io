---
title: "R Data Frames: Every Operation You'll Need, With 10 Real Examples"
slug: "R-Data-Frames"
description: "Master R data frames: create, access, filter, modify, add columns, merge, and reshape. 10 real examples with interactive code you can run."
keywords: "R data frames, data.frame(), R data frame tutorial, R filter rows, R add column, R merge data frames, R subset"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "1.1.7"
post_type: "C"
auto_link_terms: "R data frames|data.frame()|data frame in R"
auto_link_case_sensitive: false
sidebar_section: "Learn R"
sidebar_title: "R Data Frames"
sidebar_order: 7
---

# R Data Frames: Every Operation You'll Need, With 10 Real Examples

<p class="lead">A data frame is R's version of a spreadsheet — a table with rows and columns where each column can hold a different data type. It's the data structure you'll use for 90% of your work in R.</p>

If vectors are R's atoms, data frames are its molecules. Almost every dataset you'll work with — CSV files, database tables, survey results, experimental data — becomes a data frame in R. This tutorial covers every operation you'll need, from creation to merging, with real examples you can run.

## Introduction

A **data frame** is a table where:

- Each **column** is a vector (all values in a column have the same type)
- Each **row** is an observation (a person, a date, a measurement)
- Different columns can have different types (numeric, character, logical)

Think of a data frame as a collection of vectors standing side by side, all the same length. The `name` column is a character vector, the `age` column is numeric, and the `active` column is logical — but they all have the same number of rows.

```r
# A data frame is a table — each column is a vector
employees <- data.frame(
  name = c("Alice", "Bob", "Carol", "David", "Eve"),
  age = c(28, 35, 42, 31, 26),
  department = c("Engineering", "Marketing", "Engineering", "Sales", "Marketing"),
  salary = c(85000, 72000, 95000, 68000, 71000)
)

# Print the data frame
employees
```

## Creating Data Frames

### From vectors with data.frame()

The most common way to create a data frame is `data.frame()`, passing named vectors as arguments:

```r
# Each argument becomes a column
products <- data.frame(
  item = c("Laptop", "Mouse", "Keyboard", "Monitor"),
  price = c(999, 25, 75, 350),
  in_stock = c(TRUE, TRUE, FALSE, TRUE),
  category = c("Electronics", "Accessories", "Accessories", "Electronics")
)
products

# Check the structure
str(products)
cat("\nDimensions:", nrow(products), "rows x", ncol(products), "columns\n")
```

`str()` shows the structure — column names, types, and a preview of values. Use it as your first step whenever you load a new dataset.

### From built-in datasets

R ships with dozens of datasets for practice. These are already data frames:

```r
# mtcars: car performance data (32 cars, 11 variables)
cat("mtcars:", nrow(mtcars), "rows x", ncol(mtcars), "columns\n")
head(mtcars, 5)  # First 5 rows
```

```r
# iris: flower measurements (150 flowers, 5 variables)
cat("iris:", nrow(iris), "rows x", ncol(iris), "columns\n")
head(iris, 5)
```

Other useful built-in datasets: `airquality` (air quality measurements), `ChickWeight` (chick growth), `ToothGrowth` (vitamin C and tooth growth), `diamonds` (from ggplot2 — 54,000 diamonds).

### From CSV files

In practice, most data frames come from files:

```
# Read a CSV file (you'd run this in RStudio)
df <- read.csv("my_data.csv")

# Or from a URL
df <- read.csv("https://example.com/data.csv")

# The tidyverse version (faster, better defaults)
library(readr)
df <- read_csv("my_data.csv")
```

## Exploring Data Frames

Before analyzing, always explore your data first. Here are the essential exploration functions:

```r
# Use the built-in mtcars dataset
df <- mtcars

# Dimensions
cat("Rows:", nrow(df), "\n")
cat("Columns:", ncol(df), "\n")
cat("Dimensions:", dim(df), "\n")

# Column names
cat("Columns:", names(df), "\n")

# First and last rows
cat("\nFirst 3 rows:\n")
print(head(df, 3))

cat("\nLast 3 rows:\n")
print(tail(df, 3))
```

```r
# Structure — the most informative single command
str(mtcars)
```

```r
# Statistical summary of every column
summary(mtcars[, 1:4])  # First 4 columns for readability
```

`summary()` gives you min, max, median, mean, and quartiles for numeric columns — a quick health check for your data.

## Accessing Data

### Columns

There are three ways to access columns:

```r
df <- data.frame(
  name = c("Alice", "Bob", "Carol"),
  score = c(92, 85, 78),
  passed = c(TRUE, TRUE, FALSE)
)

# Method 1: $ operator (most common)
cat("Names:", df$name, "\n")

# Method 2: Double brackets [["column"]]
cat("Scores:", df[["score"]], "\n")

# Method 3: Single bracket with column name
cat("Passed:", df[, "passed"], "\n")

# Get column type
cat("Type of 'score':", class(df$score), "\n")
```

Use `$` for interactive work (quick, readable). Use `[["column"]]` when the column name is stored in a variable.

### Rows

```r
df <- data.frame(
  name = c("Alice", "Bob", "Carol", "David", "Eve"),
  score = c(92, 85, 78, 95, 88)
)

# By position
cat("Row 1:\n")
print(df[1, ])

# Multiple rows
cat("\nRows 2 and 4:\n")
print(df[c(2, 4), ])

# Range of rows
cat("\nRows 1 to 3:\n")
print(df[1:3, ])
```

### Rows AND columns

The general syntax is `df[rows, columns]`:

```r
# Using mtcars for a richer example
# Specific rows and columns
mtcars[1:3, c("mpg", "hp", "wt")]
```

```r
# All rows, specific columns
mtcars[, c("mpg", "cyl", "hp")]  |> head(5)
```

## Filtering Rows

Filtering is selecting rows that meet a condition. This is one of the most common operations in data analysis.

### Base R filtering

```r
# Cars with more than 100 horsepower
fast_cars <- mtcars[mtcars$hp > 100, ]
cat("Cars with HP > 100:", nrow(fast_cars), "of", nrow(mtcars), "\n")
head(fast_cars[, c("hp", "mpg", "cyl")])
```

The pattern is `df[condition, ]` — the comma is important. It means "all columns." Without the comma, R treats the condition differently.

```r
# Multiple conditions with & (AND) and | (OR)
# Efficient cars: MPG > 20 AND cylinders = 4
efficient <- mtcars[mtcars$mpg > 20 & mtcars$cyl == 4, ]
cat("Efficient 4-cyl cars:", nrow(efficient), "\n")
efficient[, c("mpg", "cyl", "hp", "wt")]
```

```r
# Using %in% for matching multiple values
# Cars with 4 or 6 cylinders
four_six <- mtcars[mtcars$cyl %in% c(4, 6), ]
cat("4 or 6 cylinder cars:", nrow(four_six), "\n")
head(four_six[, c("mpg", "cyl", "hp")])
```

### dplyr filtering (modern approach)

The `dplyr` package provides a cleaner syntax for filtering:

```r
library(dplyr)

# Same filter, cleaner syntax
mtcars |>
  filter(mpg > 20, cyl == 4) |>
  select(mpg, cyl, hp, wt) |>
  head(5)
```

The dplyr version is easier to read: "take mtcars, filter where mpg > 20 and cyl = 4, select these columns." No need to repeat `mtcars$` before each column name.

## Modifying Data Frames

### Change existing values

```r
df <- data.frame(
  product = c("Widget", "Gadget", "Doohickey"),
  price = c(10, 25, 15),
  quantity = c(100, 50, 75)
)
cat("Before:\n")
print(df)

# Change a single value
df$price[2] <- 30  # Change Gadget's price

# Change all values meeting a condition
df$price[df$price < 15] <- 15  # Minimum price policy

cat("\nAfter:\n")
print(df)
```

### Add new columns

```r
df <- data.frame(
  product = c("Widget", "Gadget", "Doohickey"),
  price = c(10, 25, 15),
  quantity = c(100, 50, 75)
)

# Method 1: $ assignment
df$revenue <- df$price * df$quantity

# Method 2: Calculated from existing columns
df$tax <- df$revenue * 0.08
df$total <- df$revenue + df$tax

# Method 3: Constant value
df$currency <- "USD"

print(df)
```

```r
# With dplyr::mutate (cleaner for multiple new columns)
library(dplyr)

products <- data.frame(
  item = c("Widget", "Gadget", "Doohickey"),
  price = c(10, 25, 15),
  qty = c(100, 50, 75)
)

products |>
  mutate(
    revenue = price * qty,
    tax = revenue * 0.08,
    total = revenue + tax,
    margin = if_else(price > 20, "High", "Low")
  )
```

### Remove columns

```r
df <- data.frame(a = 1:3, b = 4:6, c = 7:9, d = 10:12)
cat("Before:\n")
print(df)

# Method 1: Set to NULL
df$d <- NULL

# Method 2: Select columns to keep
df <- df[, c("a", "b")]

cat("\nAfter:\n")
print(df)
```

### Add rows

```r
df <- data.frame(
  name = c("Alice", "Bob"),
  score = c(92, 85)
)

# Add a single row with rbind()
new_row <- data.frame(name = "Carol", score = 78)
df <- rbind(df, new_row)

# Add multiple rows
more_rows <- data.frame(
  name = c("David", "Eve"),
  score = c(95, 88)
)
df <- rbind(df, more_rows)

print(df)
```

## Sorting

```r
df <- data.frame(
  name = c("Carol", "Alice", "Eve", "Bob", "David"),
  score = c(78, 92, 88, 85, 95),
  age = c(22, 25, 21, 28, 24)
)

# Sort by score (ascending)
sorted <- df[order(df$score), ]
cat("By score (ascending):\n")
print(sorted)

# Sort by score (descending)
sorted_desc <- df[order(-df$score), ]
cat("\nBy score (descending):\n")
print(sorted_desc)

# Sort by multiple columns
sorted_multi <- df[order(df$age, -df$score), ]
cat("\nBy age, then score (desc):\n")
print(sorted_multi)
```

```r
# With dplyr (much cleaner)
library(dplyr)

data.frame(
  name = c("Carol", "Alice", "Eve", "Bob", "David"),
  score = c(78, 92, 88, 85, 95),
  age = c(22, 25, 21, 28, 24)
) |>
  arrange(desc(score))
```

## Summarizing and Grouping

This is where data frames become powerful — summarizing data by groups:

```r
library(dplyr)

# Group by cylinders and summarize
mtcars |>
  mutate(car = rownames(mtcars)) |>
  group_by(cyl) |>
  summarise(
    count = n(),
    avg_mpg = round(mean(mpg), 1),
    avg_hp = round(mean(hp), 0),
    best_mpg = round(max(mpg), 1),
    worst_mpg = round(min(mpg), 1)
  )
```

The `group_by() |> summarise()` pattern is the workhorse of data analysis. You'll use it in nearly every project.

## Merging (Joining) Data Frames

When your data lives in multiple tables, you need to merge them:

```r
# Two related tables
customers <- data.frame(
  id = c(1, 2, 3, 4),
  name = c("Alice", "Bob", "Carol", "David")
)

orders <- data.frame(
  customer_id = c(1, 1, 2, 3, 5),
  product = c("Widget", "Gadget", "Widget", "Doohickey", "Thingamajig"),
  amount = c(25, 50, 25, 75, 30)
)

# Inner join — only matching rows
inner <- merge(customers, orders, by.x = "id", by.y = "customer_id")
cat("Inner join (only matches):\n")
print(inner)

# Left join — all customers, matching orders
left <- merge(customers, orders, by.x = "id", by.y = "customer_id", all.x = TRUE)
cat("\nLeft join (all customers):\n")
print(left)
```

David has no orders (NA), and customer 5's order is excluded because they're not in the customers table. Left join keeps all rows from the left table.

## Handling Missing Values

Real data always has missing values. Here's how to handle them in data frames:

```r
# Create a data frame with missing values
df <- data.frame(
  name = c("Alice", "Bob", "Carol", "David", "Eve"),
  score = c(92, NA, 78, 95, NA),
  grade = c("A", "B", NA, "A", "B")
)
cat("Original:\n")
print(df)

# Find missing values
cat("\nMissing per column:\n")
print(colSums(is.na(df)))

# Complete cases only (rows with no NAs)
complete <- df[complete.cases(df), ]
cat("\nComplete cases:\n")
print(complete)

# Replace NAs in a specific column
df$score[is.na(df$score)] <- mean(df$score, na.rm = TRUE)
cat("\nAfter imputing mean for score NAs:\n")
print(df)
```

## Practice Exercises

### Exercise 1: Create and Explore

Build a data frame and explore it:

```r
# Exercise: Create a data frame of 5 movies with columns:
# title (character), year (integer), rating (numeric 1-10),
# genre (character), seen (logical)
# Then: print dimensions, structure, and summary

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
# Solution
movies <- data.frame(
  title = c("Inception", "The Matrix", "Interstellar", "Parasite", "Dune"),
  year = c(2010L, 1999L, 2014L, 2019L, 2021L),
  rating = c(8.8, 8.7, 8.7, 8.5, 8.0),
  genre = c("Sci-Fi", "Sci-Fi", "Sci-Fi", "Thriller", "Sci-Fi"),
  seen = c(TRUE, TRUE, TRUE, FALSE, TRUE)
)

cat("Dimensions:", nrow(movies), "rows x", ncol(movies), "columns\n\n")
str(movies)
cat("\n")
summary(movies)
```

**Explanation:** `data.frame()` creates the table. `str()` shows types and structure. `summary()` gives statistics for numeric columns and counts for factors/characters.

</details>

### Exercise 2: Filter and Analyze

Use mtcars to answer questions:

```r
# Exercise: Using the mtcars dataset, find:
# 1. How many cars have automatic transmission? (am == 0)
# 2. What's the average MPG of manual vs automatic cars?
# 3. Which car has the best MPG among 8-cylinder vehicles?
# Hint: Use rownames(mtcars) to get car names

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
# Solution
library(dplyr)

# 1. Count automatic cars
auto_count <- sum(mtcars$am == 0)
cat("Automatic cars:", auto_count, "of", nrow(mtcars), "\n\n")

# 2. Average MPG by transmission type
mtcars |>
  mutate(transmission = if_else(am == 0, "Automatic", "Manual")) |>
  group_by(transmission) |>
  summarise(avg_mpg = round(mean(mpg), 1), count = n()) |>
  print()

# 3. Best MPG among 8-cylinder cars
eight_cyl <- mtcars[mtcars$cyl == 8, ]
best <- eight_cyl[which.max(eight_cyl$mpg), ]
cat("\nBest 8-cyl MPG:", rownames(best), "—", best$mpg, "mpg\n")
```

**Explanation:** Manual cars average ~24 MPG vs ~17 for automatics. Among 8-cylinder cars, the Pontiac Firebird gets the best fuel economy — though 8-cylinder MPG is low overall.

</details>

### Exercise 3: Transform and Summarize

Create a report from raw data:

```r
# Exercise: Given this sales data:
sales <- data.frame(
  rep = c("Alice", "Bob", "Alice", "Carol", "Bob", "Carol", "Alice", "Bob"),
  quarter = c("Q1", "Q1", "Q2", "Q1", "Q2", "Q2", "Q3", "Q3"),
  revenue = c(50000, 42000, 61000, 55000, 48000, 58000, 72000, 51000)
)
# 1. Add a "bonus" column: 5% of revenue if revenue > 50000, else 0
# 2. Group by rep and find: total revenue, total bonus, number of quarters
# 3. Sort by total revenue descending

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
# Solution
library(dplyr)

sales <- data.frame(
  rep = c("Alice", "Bob", "Alice", "Carol", "Bob", "Carol", "Alice", "Bob"),
  quarter = c("Q1", "Q1", "Q2", "Q1", "Q2", "Q2", "Q3", "Q3"),
  revenue = c(50000, 42000, 61000, 55000, 48000, 58000, 72000, 51000)
)

sales |>
  mutate(bonus = if_else(revenue > 50000, revenue * 0.05, 0)) |>
  group_by(rep) |>
  summarise(
    quarters = n(),
    total_revenue = sum(revenue),
    total_bonus = sum(bonus)
  ) |>
  arrange(desc(total_revenue))
```

**Explanation:** `if_else()` is the vectorized conditional — it checks each row's revenue and assigns the bonus accordingly. `group_by() |> summarise()` collapses the data into one row per sales rep.

</details>

## Summary

| Operation | Base R | dplyr |
|-----------|--------|-------|
| Create | `data.frame()` | `tibble()` |
| View structure | `str(df)` | `glimpse(df)` |
| Filter rows | `df[df$x > 5, ]` | `filter(df, x > 5)` |
| Select columns | `df[, c("a", "b")]` | `select(df, a, b)` |
| Add column | `df$new <- value` | `mutate(df, new = value)` |
| Sort | `df[order(df$x), ]` | `arrange(df, x)` |
| Group + summarize | `aggregate()` | `group_by() |> summarise()` |
| Merge | `merge(a, b)` | `left_join(a, b)` |
| Remove column | `df$x <- NULL` | `select(df, -x)` |

## FAQ

### What's the difference between a data frame and a tibble?

A **tibble** (from the tidyverse) is a modern version of a data frame. Key differences: tibbles print more cleanly (showing only what fits on screen), never convert strings to factors, and have stricter subsetting behavior. Use `tibble()` or `as_tibble()` to create them. For beginners, they're interchangeable.

### How do I read a CSV file into a data frame?

`read.csv("file.csv")` for base R, or `readr::read_csv("file.csv")` for the tidyverse version (faster, better defaults). Both return a data frame.

### How do I export a data frame to CSV?

`write.csv(df, "output.csv", row.names = FALSE)`. The `row.names = FALSE` prevents R from adding row numbers as a column.

### What's the maximum size of a data frame?

Limited by your RAM. A data frame with 1 million rows and 10 numeric columns uses about 80 MB. For very large data (millions of rows), consider `data.table` (2-10x faster) or `arrow` (reads Parquet files without loading everything).

### When should I use a matrix instead of a data frame?

Use a matrix when ALL values are the same type (all numeric) and you need fast math operations. Matrices are faster for linear algebra. Use data frames when you have mixed types (numbers + text + logicals), which is almost always the case with real data.

## What's Next?

You now know R's most important data structure. Next up:

1. **R Lists** — the flexible container that holds anything
2. **R Control Flow** — if/else, for loops, while loops
3. **Writing R Functions** — package your logic for reuse

Data frames are the heart of R — every tutorial from here on builds on what you've learned.
