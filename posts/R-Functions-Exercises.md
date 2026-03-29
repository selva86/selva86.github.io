---
title: "R Functions Exercises: 10 Problems — Write, Debug & Optimize Functions — Solved Step-by-Step"
slug: "R-Functions-Exercises"
description: "10 R function exercises: write functions with arguments and defaults, validate inputs, return multiple values, and vectorize. Interactive solutions."
keywords: "R function exercises, R function practice, write R functions exercises, R programming exercises"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "E1.6"
post_type: "EX"
auto_link_terms: "R function exercises|R function practice|write R functions exercises"
auto_link_case_sensitive: false
fr_parent: "R-Functions.html"
---

# R Functions Exercises: 10 Problems — Write, Debug & Optimize Functions — Solved Step-by-Step

<p class="lead">Practice writing R functions with 10 exercises: simple calculators, input validation, default arguments, returning multiple values, and vectorized functions. Each problem has interactive code and a solution.</p>

These exercises build your function-writing skills progressively. Easy exercises (1-4) cover basic function structure. Medium (5-7) add validation and multiple returns. Hard (8-10) require design thinking.

## Easy (1-4): Basic Functions

### Exercise 1: Unit Converter

Write a function `cm_to_inches(cm)` that converts centimeters to inches (1 inch = 2.54 cm). Test it on single values and a vector.

```r
# Exercise 1: cm to inches converter

```

<details>
<summary>Click to reveal solution</summary>

```r
cm_to_inches <- function(cm) {
  cm / 2.54
}

cat("10 cm =", round(cm_to_inches(10), 2), "inches\n")
cat("100 cm =", round(cm_to_inches(100), 2), "inches\n")

# Works on vectors automatically!
heights_cm <- c(160, 170, 175, 180, 185)
cat("Heights:", round(cm_to_inches(heights_cm), 1), "inches\n")
```

**Key concept:** Because R math is vectorized, the function works on both single values and vectors — no extra code needed.

</details>

### Exercise 2: Greeting with Defaults

Write a function `greet(name, greeting = "Hello", punctuation = "!")` that returns a formatted greeting string. Test with and without default arguments.

```r
# Exercise 2: Greeting function with defaults

```

<details>
<summary>Click to reveal solution</summary>

```r
greet <- function(name, greeting = "Hello", punctuation = "!") {
  paste0(greeting, ", ", name, punctuation)
}

cat(greet("Alice"), "\n")
cat(greet("Bob", "Hi"), "\n")
cat(greet("Carol", "Good morning", "."), "\n")
cat(greet(greeting = "Hey", name = "David"), "\n")
```

**Key concept:** Arguments with `= value` are optional — the default is used if not provided. Named arguments can be passed in any order.

</details>

### Exercise 3: Range Checker

Write `in_range(x, low = 0, high = 100)` that returns TRUE if x is between low and high (inclusive). It should work on vectors.

```r
# Exercise 3: Range checker

```

<details>
<summary>Click to reveal solution</summary>

```r
in_range <- function(x, low = 0, high = 100) {
  x >= low & x <= high
}

# Single value
cat("50 in 0-100:", in_range(50), "\n")
cat("150 in 0-100:", in_range(150), "\n")

# Vector
scores <- c(-5, 42, 100, 105, 73, 0)
cat("Scores:", scores, "\n")
cat("In range:", in_range(scores), "\n")
cat("Valid count:", sum(in_range(scores)), "\n")

# Custom range
temps <- c(68, 72, 85, 90, 55)
cat("\nComfortable (65-80):", in_range(temps, 65, 80), "\n")
```

</details>

### Exercise 4: Describe a Vector

Write `describe(x)` that prints the count, mean, median, min, max, and standard deviation of a numeric vector. Handle NAs gracefully.

```r
# Exercise 4: Vector summary function

```

<details>
<summary>Click to reveal solution</summary>

```r
describe <- function(x) {
  clean <- x[!is.na(x)]
  cat("Count:", length(x), "(", sum(is.na(x)), "NAs)\n")
  cat("Mean:", round(mean(clean), 2), "\n")
  cat("Median:", round(median(clean), 2), "\n")
  cat("SD:", round(sd(clean), 2), "\n")
  cat("Min:", min(clean), "\n")
  cat("Max:", max(clean), "\n")
  cat("Range:", max(clean) - min(clean), "\n")
}

# Test
describe(c(23, 45, 12, 67, 34, NA, 89, 56, NA))
```

</details>

## Medium (5-7): Validation and Multiple Returns

### Exercise 5: Safe Division with Validation

Write `safe_divide(a, b)` that: validates both inputs are numeric, returns NA (not Inf) when b is 0, returns a named list with `result`, `valid`, and `message`.

```r
# Exercise 5: Safe division with validation
# safe_divide(10, 3) → list(result=3.33, valid=TRUE, message="OK")
# safe_divide(10, 0) → list(result=NA, valid=FALSE, message="Division by zero")

```

<details>
<summary>Click to reveal solution</summary>

```r
safe_divide <- function(a, b) {
  # Validate types
  if (!is.numeric(a) || !is.numeric(b)) {
    return(list(result = NA, valid = FALSE, message = "Inputs must be numeric"))
  }

  # Check for zero
  if (b == 0) {
    return(list(result = NA, valid = FALSE, message = "Division by zero"))
  }

  list(result = a / b, valid = TRUE, message = "OK")
}

# Test cases
tests <- list(
  list(a = 10, b = 3),
  list(a = 10, b = 0),
  list(a = "ten", b = 5),
  list(a = 100, b = -4)
)

for (t in tests) {
  r <- safe_divide(t$a, t$b)
  cat(sprintf("safe_divide(%s, %s) → %s (%s)\n",
      as.character(t$a), as.character(t$b),
      if (is.na(r$result)) "NA" else round(r$result, 2), r$message))
}
```

**Key concept:** Return a list for multiple outputs. Use early `return()` for validation failures — it keeps the main logic clean.

</details>

### Exercise 6: Flexible Summary Function

Write `column_summary(df, func = mean, ...)` that applies a function to all numeric columns of a data frame and passes extra arguments via `...`.

```r
# Exercise 6: Apply a function to all numeric columns
# column_summary(mtcars, mean) → means of all columns
# column_summary(mtcars, quantile, probs = 0.75) → 75th percentile of all columns

```

<details>
<summary>Click to reveal solution</summary>

```r
column_summary <- function(df, func = mean, ...) {
  # Select only numeric columns
  numeric_cols <- sapply(df, is.numeric)
  df_numeric <- df[, numeric_cols]

  # Apply the function to each column
  result <- sapply(df_numeric, func, ...)
  return(round(result, 2))
}

# Test with different functions
cat("Means:\n")
print(column_summary(mtcars[, 1:5], mean))

cat("\nMedians:\n")
print(column_summary(mtcars[, 1:5], median))

cat("\nStandard deviations:\n")
print(column_summary(mtcars[, 1:5], sd))

cat("\nTrimmed means (10%):\n")
print(column_summary(mtcars[, 1:5], mean, trim = 0.1))
```

**Key concept:** `...` (dot-dot-dot) passes extra arguments through to the function being called. This makes your function flexible without listing every possible argument.

</details>

### Exercise 7: Memoized Function

Write a function that computes the nth Fibonacci number using memoization (caching previous results to avoid recomputation).

```r
# Exercise 7: Fibonacci with memoization
# Naive recursion is O(2^n) — extremely slow for large n
# Memoization makes it O(n)

```

<details>
<summary>Click to reveal solution</summary>

```r
# Create a memoized Fibonacci using an environment as cache
make_fibonacci <- function() {
  cache <- new.env(parent = emptyenv())

  fib <- function(n) {
    key <- as.character(n)
    if (exists(key, envir = cache)) {
      return(get(key, envir = cache))
    }

    result <- if (n <= 1) n else fib(n - 1) + fib(n - 2)
    assign(key, result, envir = cache)
    return(result)
  }

  return(fib)
}

fibonacci <- make_fibonacci()

# Test — fast even for large n
cat("fib(10):", fibonacci(10), "\n")
cat("fib(20):", fibonacci(20), "\n")
cat("fib(30):", fibonacci(30), "\n")

# First 15 Fibonacci numbers
fibs <- sapply(1:15, fibonacci)
cat("Sequence:", fibs, "\n")
```

**Key concept:** This uses a closure — a function that carries its own environment (`cache`). The environment persists between calls, storing previously computed values. This is a function factory pattern.

</details>

## Hard (8-10): Design Challenges

### Exercise 8: Pipeable Data Transformer

Write a function `standardize(df, cols)` that standardizes (z-score normalizes) specified columns of a data frame. It should work in a dplyr pipe.

```r
# Exercise 8: Standardize columns (z-score)
# standardize(mtcars, c("mpg", "hp")) → same df with mpg and hp z-scored

```

<details>
<summary>Click to reveal solution</summary>

```r
standardize <- function(df, cols) {
  for (col in cols) {
    if (col %in% names(df) && is.numeric(df[[col]])) {
      df[[col]] <- (df[[col]] - mean(df[[col]], na.rm = TRUE)) /
                    sd(df[[col]], na.rm = TRUE)
    }
  }
  return(df)
}

# Test
library(dplyr)

result <- mtcars |>
  mutate(car = rownames(mtcars)) |>
  standardize(c("mpg", "hp")) |>
  select(car, mpg, hp, wt) |>
  head(5)

cat("Standardized (mean ≈ 0, sd ≈ 1):\n")
print(round(result[, c("mpg", "hp")], 3))

cat("\nVerify mpg: mean =", round(mean(standardize(mtcars, "mpg")$mpg), 10),
    ", sd =", round(sd(standardize(mtcars, "mpg")$mpg), 10), "\n")
```

**Key concept:** The function takes a data frame as first argument and returns a modified data frame — making it pipe-compatible. This is the standard pattern for dplyr-friendly functions.

</details>

### Exercise 9: Function Factory

Write a `make_power(n)` factory that returns a function that raises its input to the nth power. Create square, cube, and fourth-power functions from it.

```r
# Exercise 9: Power function factory
# square <- make_power(2)
# cube <- make_power(3)
# square(5) → 25
# cube(3) → 27

```

<details>
<summary>Click to reveal solution</summary>

```r
make_power <- function(n) {
  force(n)  # Ensure n is evaluated now, not later
  function(x) x^n
}

# Create specialized functions
square <- make_power(2)
cube <- make_power(3)
fourth <- make_power(4)
sqrt_func <- make_power(0.5)

cat("square(5):", square(5), "\n")
cat("cube(3):", cube(3), "\n")
cat("fourth(2):", fourth(2), "\n")
cat("sqrt(16):", sqrt_func(16), "\n")

# They work on vectors!
x <- 1:5
cat("\nSquares of 1:5:", square(x), "\n")
cat("Cubes of 1:5:", cube(x), "\n")

# Compose them
cat("\nsquare(cube(2)):", square(cube(2)), "\n")  # (2^3)^2 = 64
```

**Key concept:** `make_power(n)` returns a function that "remembers" n via closure. `force(n)` ensures n is captured immediately (avoiding a subtle lazy evaluation bug). This is R's function factory pattern.

</details>

### Exercise 10: Complete Data Pipeline Function

Write a function `analyze_by_group(df, group_col, value_col)` that: groups a data frame, computes statistics per group, identifies the top group, and returns a structured report.

```r
# Exercise 10: Grouped analysis pipeline
# analyze_by_group(mtcars, "cyl", "mpg") → complete report

```

<details>
<summary>Click to reveal solution</summary>

```r
analyze_by_group <- function(df, group_col, value_col) {
  # Validate
  if (!group_col %in% names(df)) stop(paste("Column not found:", group_col))
  if (!value_col %in% names(df)) stop(paste("Column not found:", value_col))
  if (!is.numeric(df[[value_col]])) stop(paste(value_col, "must be numeric"))

  # Group statistics
  groups <- split(df[[value_col]], df[[group_col]])
  stats <- data.frame(
    group = names(groups),
    n = sapply(groups, length),
    mean = round(sapply(groups, mean, na.rm = TRUE), 2),
    median = round(sapply(groups, median, na.rm = TRUE), 2),
    sd = round(sapply(groups, sd, na.rm = TRUE), 2),
    min = sapply(groups, min, na.rm = TRUE),
    max = sapply(groups, max, na.rm = TRUE),
    row.names = NULL
  )
  stats <- stats[order(-stats$mean), ]

  # Report
  cat(sprintf("=== %s by %s ===\n\n", value_col, group_col))
  print(stats)

  best <- stats$group[1]
  worst <- stats$group[nrow(stats)]
  cat(sprintf("\nHighest mean %s: %s group (%.2f)\n",
      value_col, best, stats$mean[1]))
  cat(sprintf("Lowest mean %s: %s group (%.2f)\n",
      value_col, worst, stats$mean[nrow(stats)]))

  # Return invisibly for further use
  invisible(stats)
}

# Test with mtcars
result <- analyze_by_group(mtcars, "cyl", "mpg")

cat("\n--- Another analysis ---\n")
analyze_by_group(iris, "Species", "Petal.Length")
```

**Key concept:** The function validates inputs, computes statistics using `split()` + `sapply()`, formats output, and returns results invisibly. This is a production-quality analysis function pattern.

</details>

## Summary: Skills Practiced

| Exercises | Function Skills |
|-----------|----------------|
| 1-4 (Easy) | Basic structure, defaults, vectorized functions, printing |
| 5-7 (Medium) | Validation, multiple returns, `...`, memoization |
| 8-10 (Hard) | Pipe-friendly, function factories, complete pipelines |

## What's Next?

More exercise sets:

1. **R String Exercises** — text manipulation practice
2. **R Date/Time Exercises** — lubridate practice
3. **R apply Family Exercises** — master apply, lapply, sapply

Or continue learning: **R Special Values** tutorial.
