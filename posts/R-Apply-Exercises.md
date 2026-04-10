---
title: "R apply Family Exercises: 12 apply(), lapply(), sapply() Practice Problems — Solved Step-by-Step"
slug: "R-Apply-Exercises"
description: "12 R apply family exercises: apply() on matrices, lapply/sapply on lists, tapply for groups, and mapply for parallel iteration. Interactive solutions."
keywords: "R apply exercises, lapply exercises, sapply exercises, R apply family practice, tapply, mapply"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "E1.9"
post_type: "EX"
auto_link_terms: "R apply exercises|lapply exercises|sapply exercises|R apply family practice"
auto_link_case_sensitive: false
fr_parent: "R-Functions.html"
---

# R apply Family Exercises: 12 apply(), lapply(), sapply() Practice Problems — Solved Step-by-Step

<p class="lead">Master R's apply family with 12 exercises: <code>apply()</code> for matrices, <code>lapply()</code>/<code>sapply()</code> for lists and vectors, <code>tapply()</code> for grouped operations, and <code>mapply()</code> for parallel iteration. Each problem has an interactive solution.</p>

The apply family replaces explicit loops with concise, functional alternatives. These exercises cover every member of the family with practical data analysis tasks.

## Quick Reference

| Function | Input | Output | Use case |
|----------|-------|--------|----------|
| `apply(X, MARGIN, FUN)` | Matrix/data frame | Vector/matrix | Row or column operations |
| `lapply(X, FUN)` | List/vector | List | Apply to each element |
| `sapply(X, FUN)` | List/vector | Vector/matrix | Simplified lapply |
| `tapply(X, INDEX, FUN)` | Vector + grouping | Vector | Grouped operations |
| `mapply(FUN, ...)` | Multiple vectors | Vector/list | Parallel iteration |
| `vapply(X, FUN, FUN.VALUE)` | List/vector | Type-safe vector | Safe sapply |

## Easy (1-4): apply() and sapply()

### Exercise 1: Matrix Row and Column Stats

Given a 5x4 matrix of exam scores, calculate the average score per student (rows) and per exam (columns).

```r
# Exercise 1: Row and column means
set.seed(42)
scores <- matrix(round(rnorm(20, 80, 10)), nrow = 5,
  dimnames = list(
    c("Alice", "Bob", "Carol", "David", "Eve"),
    c("Exam1", "Exam2", "Exam3", "Exam4")))

print(scores)
# Calculate: row means, column means, row max, column sd

```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(42)
scores <- matrix(round(rnorm(20, 80, 10)), nrow = 5,
  dimnames = list(
    c("Alice", "Bob", "Carol", "David", "Eve"),
    c("Exam1", "Exam2", "Exam3", "Exam4")))

cat("Scores:\n"); print(scores)

# MARGIN=1 → rows, MARGIN=2 → columns
cat("\nStudent averages (rows):", apply(scores, 1, mean), "\n")
cat("Exam averages (columns):", apply(scores, 2, mean), "\n")
cat("Best score per student:", apply(scores, 1, max), "\n")
cat("Score variation per exam:", round(apply(scores, 2, sd), 1), "\n")

# Top student
avgs <- apply(scores, 1, mean)
cat("\nTop student:", names(which.max(avgs)), "—", round(max(avgs), 1), "\n")
```

**Key concept:** `apply(X, 1, FUN)` applies across rows (MARGIN=1). `apply(X, 2, FUN)` applies down columns (MARGIN=2).

</details>

### Exercise 2: sapply Basics

Given a list of character vectors, use sapply to find the length, first element, and last element of each.

```r
# Exercise 2: sapply on a list of vectors
shopping <- list(
  monday = c("bread", "milk", "eggs"),
  tuesday = c("chicken", "rice"),
  wednesday = c("apples", "bananas", "oranges", "grapes"),
  thursday = c("pasta"),
  friday = c("steak", "wine", "cheese", "crackers", "olives")
)

# Use sapply to get: count, first item, last item for each day

```

<details>
<summary>Click to reveal solution</summary>

```r
shopping <- list(
  monday = c("bread", "milk", "eggs"),
  tuesday = c("chicken", "rice"),
  wednesday = c("apples", "bananas", "oranges", "grapes"),
  thursday = c("pasta"),
  friday = c("steak", "wine", "cheese", "crackers", "olives")
)

# Individual sapply calls
counts <- sapply(shopping, length)
firsts <- sapply(shopping, function(x) x[1])
lasts <- sapply(shopping, function(x) x[length(x)])

cat("Items per day:", counts, "\n")
cat("First items:", firsts, "\n")
cat("Last items:", lasts, "\n")

# Combined summary (returns a matrix)
summary <- sapply(shopping, function(x) {
  c(count = length(x), first = x[1], last = x[length(x)])
})
cat("\nSummary matrix:\n")
print(summary)
```

</details>

### Exercise 3: lapply vs sapply

Apply a custom function to each column of mtcars that returns multiple statistics. Show the difference between lapply and sapply output.

```r
# Exercise 3: Compare lapply and sapply output
# For mtcars columns mpg, hp, wt: get min, mean, max

```

<details>
<summary>Click to reveal solution</summary>

```r
cols <- mtcars[, c("mpg", "hp", "wt")]

# Custom function returning a named vector
my_stats <- function(x) {
  c(min = round(min(x), 1), mean = round(mean(x), 1), max = round(max(x), 1))
}

# lapply returns a LIST
cat("lapply result:\n")
result_l <- lapply(cols, my_stats)
str(result_l)

# sapply returns a MATRIX (when possible)
cat("\nsapply result:\n")
result_s <- sapply(cols, my_stats)
print(result_s)

cat("\nlapply class:", class(result_l), "\n")
cat("sapply class:", class(result_s), "\n")
```

**Key concept:** When each function call returns a vector of the same length, `sapply()` combines them into a matrix. `lapply()` always returns a list — safer but less convenient.

</details>

### Exercise 4: vapply for Type Safety

Rewrite Exercise 3 using vapply to guarantee the output type.

```r
# Exercise 4: vapply �� type-safe sapply
# Same task as Exercise 3 but with guaranteed output

```

<details>
<summary>Click to reveal solution</summary>

```r
cols <- mtcars[, c("mpg", "hp", "wt")]

my_stats <- function(x) {
  c(min = round(min(x), 1), mean = round(mean(x), 1), max = round(max(x), 1))
}

# vapply: specify the expected output template
result <- vapply(cols, my_stats, FUN.VALUE = numeric(3))
cat("vapply result:\n")
print(result)

# Why vapply is safer:
# If my_stats returned 2 values for one column and 3 for another,
# vapply would throw an error. sapply would silently return a list.
cat("\nvapply guarantees:", class(result), "with", nrow(result), "rows\n")
```

**Key concept:** `vapply(X, FUN, FUN.VALUE)` requires you to specify the expected return type and length. If the function returns something different, vapply throws an error instead of silently changing the output type.

</details>

## Medium (5-8): tapply() and Grouped Operations

### Exercise 5: tapply for Grouped Statistics

Use tapply to calculate average mpg by cylinder count AND by transmission type in mtcars.

```r
# Exercise 5: Grouped means with tapply
# 1. Average mpg by number of cylinders
# 2. Average hp by transmission type (am: 0=auto, 1=manual)
# 3. Cross-tabulation: average mpg by cyl AND am

```

<details>
<summary>Click to reveal solution</summary>

```r
# 1. Average mpg by cylinders
mpg_by_cyl <- tapply(mtcars$mpg, mtcars$cyl, mean)
cat("MPG by cylinders:\n")
print(round(mpg_by_cyl, 1))

# 2. Average hp by transmission
hp_by_trans <- tapply(mtcars$hp, mtcars$am, mean)
names(hp_by_trans) <- c("Automatic", "Manual")
cat("\nHP by transmission:\n")
print(round(hp_by_trans, 1))

# 3. Cross-tabulation: mpg by cyl AND am
mpg_cross <- tapply(mtcars$mpg, list(cyl = mtcars$cyl, am = mtcars$am), mean)
colnames(mpg_cross) <- c("Automatic", "Manual")
cat("\nMPG by cylinders and transmission:\n")
print(round(mpg_cross, 1))
```

**Key concept:** `tapply(values, group, FUN)` is the simplest way to compute grouped statistics. Pass a list of grouping variables for cross-tabulation.

</details>

### Exercise 6: sapply with Data Frames

Write a function that classifies each column of a data frame as numeric, character, logical, or other, and counts the unique values.

```r
# Exercise 6: Column profiler
df <- data.frame(
  name = c("Alice", "Bob", "Carol", "Alice", "Bob"),
  age = c(25, 32, 28, 25, 32),
  score = c(88.5, 72.0, 95.3, 88.5, 72.0),
  passed = c(TRUE, FALSE, TRUE, TRUE, FALSE),
  grade = factor(c("A", "C", "A", "A", "C"))
)

# For each column: type, unique count, any NAs

```

<details>
<summary>Click to reveal solution</summary>

```r
df <- data.frame(
  name = c("Alice", "Bob", "Carol", "Alice", "Bob"),
  age = c(25, 32, 28, 25, 32),
  score = c(88.5, 72.0, 95.3, 88.5, 72.0),
  passed = c(TRUE, FALSE, TRUE, TRUE, FALSE),
  grade = factor(c("A", "C", "A", "A", "C")),
  stringsAsFactors = FALSE
)

profile <- sapply(df, function(col) {
  c(type = class(col)[1],
    unique = length(unique(col)),
    nas = sum(is.na(col)),
    example = as.character(col[1]))
})

cat("Column profile:\n")
print(profile)
```

</details>

### Exercise 7: Nested lapply

Given a list of data frames, apply a function to a specific column in each data frame.

```r
# Exercise 7: lapply on a list of data frames
datasets <- list(
  class_A = data.frame(student = paste0("A", 1:5), score = c(88, 92, 75, 95, 81)),
  class_B = data.frame(student = paste0("B", 1:4), score = c(72, 68, 85, 90)),
  class_C = data.frame(student = paste0("C", 1:6), score = c(91, 88, 76, 82, 94, 87))
)

# 1. Get the mean score for each class
# 2. Get the top student from each class
# 3. Combine all classes into one data frame with a class column

```

<details>
<summary>Click to reveal solution</summary>

```r
datasets <- list(
  class_A = data.frame(student = paste0("A", 1:5), score = c(88, 92, 75, 95, 81)),
  class_B = data.frame(student = paste0("B", 1:4), score = c(72, 68, 85, 90)),
  class_C = data.frame(student = paste0("C", 1:6), score = c(91, 88, 76, 82, 94, 87))
)

# 1. Mean score per class
means <- sapply(datasets, function(df) round(mean(df$score), 1))
cat("Class means:", means, "\n")

# 2. Top student per class
tops <- sapply(datasets, function(df) {
  best <- df[which.max(df$score), ]
  paste0(best$student, " (", best$score, ")")
})
cat("Top students:", tops, "\n")

# 3. Combine with class column
combined <- do.call(rbind, lapply(names(datasets), function(name) {
  df <- datasets[[name]]
  df$class <- name
  df
}))
cat("\nCombined data:\n")
print(combined)
```

**Key concept:** `lapply()` over `names(list)` lets you access both the name and the element. `do.call(rbind, list_of_dfs)` stacks them into one data frame.

</details>

### Exercise 8: apply with Custom Functions

Use apply to normalize each column of a matrix (z-score: subtract mean, divide by sd).

```r
# Exercise 8: Column-wise normalization with apply
set.seed(42)
data <- matrix(rnorm(30, mean = rep(c(10, 50, 100), each = 10),
                     sd = rep(c(2, 10, 20), each = 10)),
               nrow = 10, ncol = 3,
               dimnames = list(NULL, c("Small", "Medium", "Large")))

# Normalize each column to mean=0, sd=1 using apply

```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(42)
data <- matrix(rnorm(30, mean = rep(c(10, 50, 100), each = 10),
                     sd = rep(c(2, 10, 20), each = 10)),
               nrow = 10, ncol = 3,
               dimnames = list(NULL, c("Small", "Medium", "Large")))

cat("Before normalization:\n")
cat("Means:", round(apply(data, 2, mean), 1), "\n")
cat("SDs:", round(apply(data, 2, sd), 1), "\n\n")

# Normalize: z = (x - mean) / sd
normalized <- apply(data, 2, function(col) {
  (col - mean(col)) / sd(col)
})

cat("After normalization:\n")
cat("Means:", round(apply(normalized, 2, mean), 10), "\n")
cat("SDs:", round(apply(normalized, 2, sd), 10), "\n")

cat("\nFirst 5 rows (normalized):\n")
print(round(head(normalized, 5), 3))
```

**Key concept:** `apply(data, 2, function(col) ...)` applies a custom function to each column. The anonymous function receives one column vector as input and returns the transformed column.

</details>

## Hard (9-12): mapply and Combined Challenges

### Exercise 9: mapply for Parallel Iteration

Use mapply to generate multiple random samples with different sizes, means, and standard deviations.

```r
# Exercise 9: Parallel random generation with mapply
sizes <- c(100, 200, 150)
means <- c(10, 50, 100)
sds <- c(2, 10, 25)
names <- c("Small", "Medium", "Large")

# Generate 3 random samples with different parameters using mapply

```

<details>
<summary>Click to reveal solution</summary>

```r
sizes <- c(100, 200, 150)
means <- c(10, 50, 100)
sds <- c(2, 10, 25)
sample_names <- c("Small", "Medium", "Large")

set.seed(42)
samples <- mapply(rnorm, n = sizes, mean = means, sd = sds, SIMPLIFY = FALSE)
names(samples) <- sample_names

# Summarize each sample
cat("Generated samples:\n")
for (name in sample_names) {
  s <- samples[[name]]
  cat(sprintf("  %s: n=%d, mean=%.1f, sd=%.1f\n",
    name, length(s), mean(s), sd(s)))
}

# mapply is like a multi-argument sapply
# It iterates over all arguments in parallel
cat("\nSimpler example:\n")
result <- mapply(function(x, y, label) sprintf("%s: %d + %d = %d", label, x, y, x+y),
                 x = 1:3, y = c(10, 20, 30), label = c("First", "Second", "Third"))
cat(result, sep = "\n")
```

**Key concept:** `mapply(FUN, arg1, arg2, ...)` calls FUN with the first element of each argument, then the second, etc. It's vectorized function application across multiple inputs.

</details>

### Exercise 10: Replace Loops with apply

Convert a loop-based analysis into apply-family equivalents.

```r
# Exercise 10: Convert this loop to apply
# Loop version:
results <- list()
for (col_name in c("mpg", "hp", "wt", "qsec")) {
  x <- mtcars[[col_name]]
  results[[col_name]] <- c(
    mean = round(mean(x), 2),
    median = round(median(x), 2),
    cv = round(sd(x) / mean(x) * 100, 1)
  )
}
loop_result <- do.call(rbind, results)
cat("Loop version:\n"); print(loop_result)

# Rewrite using sapply (should produce the same output)

```

<details>
<summary>Click to reveal solution</summary>

```r
# Loop version (for comparison)
results <- list()
for (col_name in c("mpg", "hp", "wt", "qsec")) {
  x <- mtcars[[col_name]]
  results[[col_name]] <- c(
    mean = round(mean(x), 2),
    median = round(median(x), 2),
    cv = round(sd(x) / mean(x) * 100, 1)
  )
}
loop_result <- do.call(rbind, results)

# sapply version (one line!)
apply_result <- t(sapply(mtcars[, c("mpg", "hp", "wt", "qsec")], function(x) {
  c(mean = round(mean(x), 2),
    median = round(median(x), 2),
    cv = round(sd(x) / mean(x) * 100, 1))
}))

cat("Loop version:\n"); print(loop_result)
cat("\napply version:\n"); print(apply_result)
cat("\nIdentical:", identical(loop_result, apply_result), "\n")
```

**Key concept:** `sapply()` over data frame columns replaces the loop. `t()` transposes so columns become rows. The result is identical but more concise.

</details>

### Exercise 11: Nested apply Operations

Calculate a correlation matrix using apply functions, then find the most correlated pair of variables.

```r
# Exercise 11: Build correlation analysis with apply
vars <- mtcars[, c("mpg", "cyl", "hp", "wt", "qsec")]

# 1. Compute the correlation matrix
# 2. Find the strongest positive and negative correlations
# 3. For each variable, find its most correlated partner

```

<details>
<summary>Click to reveal solution</summary>

```r
vars <- mtcars[, c("mpg", "cyl", "hp", "wt", "qsec")]

# 1. Correlation matrix
cor_mat <- round(cor(vars), 3)
cat("Correlation matrix:\n")
print(cor_mat)

# 2. Strongest correlations (exclude diagonal)
diag(cor_mat) <- NA
# Find max and min
max_pos <- which(cor_mat == max(cor_mat, na.rm = TRUE), arr.ind = TRUE)[1,]
max_neg <- which(cor_mat == min(cor_mat, na.rm = TRUE), arr.ind = TRUE)[1,]

cat("\nStrongest positive:", rownames(cor_mat)[max_pos[1]], "&",
    colnames(cor_mat)[max_pos[2]], "=",
    cor(vars)[max_pos[1], max_pos[2]], "\n")
cat("Strongest negative:", rownames(cor_mat)[max_neg[1]], "&",
    colnames(cor_mat)[max_neg[2]], "=",
    cor(vars)[max_neg[1], max_neg[2]], "\n")

# 3. Most correlated partner for each variable (using apply!)
diag(cor_mat) <- NA
best_partner <- apply(abs(cor_mat), 1, function(row) {
  idx <- which.max(row)
  paste0(names(row)[idx], " (", cor_mat[names(row)[idx], names(which.max(row))], ")")
})
cat("\nMost correlated partner:\n")
for (v in names(best_partner)) {
  cat(sprintf("  %s → %s\n", v, best_partner[v]))
}
```

</details>

### Exercise 12: Complete Pipeline with apply Family

Build a complete data quality report using only apply-family functions (no explicit loops).

```r
# Exercise 12: Data quality report with apply functions only
set.seed(42)
messy <- data.frame(
  id = 1:100,
  age = c(sample(18:80, 95, replace = TRUE), NA, NA, -5, 150, NA),
  income = c(round(rlnorm(96, 10.5, 0.8)), NA, NA, NA, -1000),
  score = c(round(runif(97, 0, 100), 1), NA, 150, -10),
  category = sample(c("A", "B", "C", NA), 100, replace = TRUE, prob = c(0.3, 0.3, 0.3, 0.1))
)

# Build a quality report using sapply/lapply:
# For each column: type, total, NAs, NA%, unique values, min, max, outliers

```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(42)
messy <- data.frame(
  id = 1:100,
  age = c(sample(18:80, 95, replace = TRUE), NA, NA, -5, 150, NA),
  income = c(round(rlnorm(96, 10.5, 0.8)), NA, NA, NA, -1000),
  score = c(round(runif(97, 0, 100), 1), NA, 150, -10),
  category = sample(c("A", "B", "C", NA), 100, replace = TRUE, prob = c(0.3, 0.3, 0.3, 0.1)),
  stringsAsFactors = FALSE
)

# Quality report — all sapply, no loops!
report <- sapply(messy, function(col) {
  n <- length(col)
  nas <- sum(is.na(col))

  if (is.numeric(col)) {
    clean <- col[!is.na(col)]
    q1 <- quantile(clean, 0.25)
    q3 <- quantile(clean, 0.75)
    iqr <- q3 - q1
    outliers <- sum(clean < q1 - 1.5*iqr | clean > q3 + 1.5*iqr)

    c(type = "numeric", total = n, NAs = nas,
      `NA%` = round(nas/n*100, 1),
      unique = length(unique(clean)),
      min = round(min(clean), 1),
      max = round(max(clean), 1),
      outliers = outliers)
  } else {
    c(type = class(col), total = n, NAs = nas,
      `NA%` = round(nas/n*100, 1),
      unique = length(unique(na.omit(col))),
      min = "-", max = "-", outliers = "-")
  }
})

cat("=== Data Quality Report ===\n\n")
print(report)

# Summary
cat("\nTotal NAs:", sum(is.na(messy)), "of", prod(dim(messy)), "cells\n")
cat("Complete rows:", sum(complete.cases(messy)), "of", nrow(messy), "\n")
```

**Key concept:** `sapply()` with a complex anonymous function that handles numeric and character columns differently. The result is a matrix — a complete quality report built without a single explicit loop.

</details>

## Summary: Skills Practiced

| Exercises | apply Family Skills |
|-----------|-------------------|
| 1-4 (Easy) | `apply()` row/column, `sapply()` basics, `lapply()` vs `sapply()`, `vapply()` |
| 5-8 (Medium) | `tapply()` groups, column profiling, nested `lapply()`, custom apply functions |
| 9-12 (Hard) | `mapply()` parallel, loop-to-apply conversion, correlation analysis, data quality pipeline |

**When to use each:**
- `apply()` → matrices (row or column operations)
- `sapply()` → quick results from lists/vectors (simplified output)
- `lapply()` → safe results from lists (always returns list)
- `vapply()` → type-safe results (production code)
- `tapply()` → grouped operations on vectors
- `mapply()` → parallel iteration over multiple inputs

## Continue Learning

You've completed all the R Fundamentals exercise sets! Continue your R journey:

1. **Functional Programming in R** — closures, higher-order functions, purrr
2. **Data Wrangling with dplyr** — modern data manipulation
3. **ggplot2 Visualization** — create publication-quality plots
