---
title: "Write Better R Functions: Arguments, Defaults, Scope & When to Vectorise"
slug: "R-Functions"
description: "Learn to write R functions: arguments, defaults, scope, return values, error handling, and when to vectorize. Interactive examples and exercises."
keywords: "R functions, function() in R, R function arguments, R default arguments, R scope, R return value, write R functions"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "1.1.10"
post_type: "C"
auto_link_terms: "R functions|function() in R|write R functions"
auto_link_case_sensitive: false
sidebar_section: "Learn R"
sidebar_title: "Writing R Functions"
sidebar_order: 10
---

# Write Better R Functions: Arguments, Defaults, Scope & When to Vectorise

<p class="lead">A function in R packages a block of code so you can reuse it. You define it once with <code>function()</code>, give it a name, and call it whenever you need it — with different inputs each time.</p>

Once your R scripts grow beyond 50 lines, you'll start copying and pasting code blocks. That's a sign you need functions. Functions make your code shorter, easier to test, and much easier to change — fix a bug in the function and every call benefits.

## Introduction

A **function** takes inputs (arguments), does something with them, and returns a result. You've been using functions since your first R script — `mean()`, `sum()`, `cat()` are all functions. Now you'll learn to write your own.

Here's the anatomy of an R function:

```r
# Define a function
greet <- function(name) {
  message <- paste("Hello,", name, "! Welcome to R.")
  return(message)
}

# Call it
cat(greet("Alice"), "\n")
cat(greet("Bob"), "\n")
```

`greet` is the name. `name` is the argument. `return(message)` is the output. Everything between `{}` is the body.

## Your First Function

Let's start with a simple function and build from there:

```r
# A function that converts Fahrenheit to Celsius
f_to_c <- function(temp_f) {
  temp_c <- (temp_f - 32) * 5/9
  return(round(temp_c, 1))
}

# Use it
cat("72°F =", f_to_c(72), "°C\n")
cat("32°F =", f_to_c(32), "°C\n")
cat("212°F =", f_to_c(212), "°C\n")

# It works on vectors too!
temps <- c(32, 50, 72, 100, 212)
cat("Batch conversion:", f_to_c(temps), "\n")
```

Because R math is vectorized, `f_to_c()` automatically works on single values AND vectors. You don't need to add a loop.

## Arguments and Defaults

### Required vs optional arguments

```r
# tax_rate has a default — it's optional
calculate_total <- function(price, quantity, tax_rate = 0.08) {
  subtotal <- price * quantity
  tax <- subtotal * tax_rate
  total <- subtotal + tax
  return(round(total, 2))
}

# Use default tax rate
cat("Default tax:", calculate_total(25, 3), "\n")

# Override the default
cat("No tax:", calculate_total(25, 3, tax_rate = 0), "\n")
cat("High tax:", calculate_total(25, 3, tax_rate = 0.15), "\n")
```

Arguments without defaults are **required** — omitting them causes an error. Arguments with defaults are **optional** — the default is used if you don't provide a value.

### Positional vs named arguments

```r
# These all call the same function the same way
calculate_total <- function(price, quantity, tax_rate = 0.08) {
  return(round(price * quantity * (1 + tax_rate), 2))
}

# Positional (order matters)
cat("Positional:", calculate_total(25, 3, 0.10), "\n")

# Named (order doesn't matter)
cat("Named:", calculate_total(tax_rate = 0.10, quantity = 3, price = 25), "\n")

# Mixed (positional first, then named)
cat("Mixed:", calculate_total(25, 3, tax_rate = 0.10), "\n")
```

> **Best practice:** Use positional arguments for the first 1-2 obvious arguments, then named arguments for everything else. `mean(x)` is clear; `substring(x, 3, 7)` is unclear — better as `substring(x, first = 3, last = 7)`.

### The ... (dot-dot-dot) argument

`...` passes extra arguments to other functions. It's extremely common in R:

```r
# A wrapper function that passes ... to paste()
shout <- function(..., sep = " ") {
  text <- paste(..., sep = sep)
  return(toupper(text))
}

cat(shout("hello", "world"), "\n")
cat(shout("r", "is", "great", sep = "-"), "\n")
```

You'll see `...` in functions like `cat()`, `paste()`, `c()`, and most plotting functions. It makes functions flexible without needing to list every possible argument.

## Return Values

### Explicit return

```r
# Explicit return — recommended for clarity
divide_safe <- function(a, b) {
  if (b == 0) {
    return(NA)  # Early return for edge case
  }
  return(a / b)
}

cat("10 / 3 =", divide_safe(10, 3), "\n")
cat("10 / 0 =", divide_safe(10, 0), "\n")
```

### Implicit return

R returns the last evaluated expression automatically. Many R programmers omit `return()`:

```r
# Implicit return — the last expression is returned
add <- function(x, y) {
  x + y  # This value is returned
}

cat("3 + 4 =", add(3, 4), "\n")
```

Both styles are valid. Use explicit `return()` when you have early exits or the function is long. Use implicit return for short, simple functions.

### Returning multiple values

R functions can only return one object — but that object can be a list:

```r
# Return multiple values as a named list
describe <- function(x) {
  list(
    mean = round(mean(x), 2),
    sd = round(sd(x), 2),
    min = min(x),
    max = max(x),
    n = length(x)
  )
}

data <- c(23, 45, 12, 67, 34, 89, 56)
result <- describe(data)
cat("Mean:", result$mean, "\n")
cat("SD:", result$sd, "\n")
cat("Range:", result$min, "to", result$max, "\n")
```

## Scope: Where Variables Live

**Scope** determines where a variable is visible. Functions create their own scope — variables inside a function don't leak out:

```r
x <- 100  # Global variable

my_func <- function() {
  x <- 999  # Local variable — different from the global x
  y <- 42   # Also local
  cat("Inside function: x =", x, ", y =", y, "\n")
}

my_func()
cat("Outside function: x =", x, "\n")
# cat("y =", y)  # Would error — y doesn't exist outside the function
```

The function has its own `x` (999) that doesn't affect the global `x` (100). And `y` only exists inside the function.

### Lexical scoping: looking up the chain

If a variable isn't found inside the function, R looks in the **parent environment** (where the function was defined):

```r
tax_rate <- 0.08  # Global variable

calculate_tax <- function(price) {
  # tax_rate not defined here — R looks in the parent (global) environment
  return(price * tax_rate)
}

cat("Tax on $100:", calculate_tax(100), "\n")

# Change the global variable
tax_rate <- 0.10
cat("Tax on $100 (new rate):", calculate_tax(100), "\n")
```

This works, but it's fragile — the function depends on a global variable. Better to pass `tax_rate` as an argument:

```r
# Better: make dependencies explicit
calculate_tax <- function(price, tax_rate = 0.08) {
  return(price * tax_rate)
}

cat("Tax:", calculate_tax(100), "\n")           # Uses default
cat("Tax:", calculate_tax(100, 0.10), "\n")     # Override
```

> **Best practice:** Functions should get all their data from arguments, not global variables. This makes them predictable, testable, and reusable.

## Error Handling: stop(), warning(), message()

Good functions validate their inputs and give clear error messages:

```r
# A function with input validation
bmi <- function(weight_kg, height_m) {
  # Validate inputs
  if (!is.numeric(weight_kg) || !is.numeric(height_m)) {
    stop("Both weight and height must be numeric")
  }
  if (weight_kg <= 0 || height_m <= 0) {
    stop("Weight and height must be positive")
  }
  if (height_m > 3) {
    warning("Height > 3m is unusual. Did you pass height in cm instead of m?")
  }

  result <- weight_kg / height_m^2
  return(round(result, 1))
}

# Normal use
cat("BMI:", bmi(70, 1.75), "\n")

# Suspicious input (triggers warning)
cat("BMI:", bmi(70, 175), "\n")  # Probably cm, not meters
```

| Function | Behavior | Use when |
|----------|----------|----------|
| `stop("msg")` | Stops execution, throws error | Input is invalid, can't continue |
| `warning("msg")` | Continues but shows warning | Something suspicious but not fatal |
| `message("msg")` | Shows info message | Progress updates, FYI messages |

## Common Function Patterns

### Pattern 1: Data summarizer

```r
# Summarize any numeric vector
quick_stats <- function(x, digits = 2) {
  x <- x[!is.na(x)]  # Remove NAs
  data.frame(
    n = length(x),
    mean = round(mean(x), digits),
    median = round(median(x), digits),
    sd = round(sd(x), digits),
    min = round(min(x), digits),
    max = round(max(x), digits)
  )
}

quick_stats(mtcars$mpg)
```

### Pattern 2: Data transformer

```r
# Normalize a vector to 0-1 range
normalize <- function(x) {
  (x - min(x, na.rm = TRUE)) / (max(x, na.rm = TRUE) - min(x, na.rm = TRUE))
}

scores <- c(45, 67, 82, 91, 73)
cat("Original:", scores, "\n")
cat("Normalized:", round(normalize(scores), 3), "\n")
```

### Pattern 3: Pipeable function

```r
library(dplyr)

# A function that works in a pipe chain
add_grade_column <- function(df, score_col = "score") {
  df |>
    mutate(
      grade = case_when(
        .data[[score_col]] >= 90 ~ "A",
        .data[[score_col]] >= 80 ~ "B",
        .data[[score_col]] >= 70 ~ "C",
        .data[[score_col]] >= 60 ~ "D",
        TRUE ~ "F"
      )
    )
}

# Use in a pipe
data.frame(student = c("Alice", "Bob", "Carol"), score = c(92, 78, 85)) |>
  add_grade_column() |>
  print()
```

## When to Vectorize (and When Not To)

R functions are automatically vectorized if the operations inside them are vectorized:

```r
# This function is automatically vectorized
celsius_to_fahr <- function(c) {
  c * 9/5 + 32
}

# Works on single values AND vectors — no changes needed
cat("Single:", celsius_to_fahr(100), "\n")
cat("Vector:", celsius_to_fahr(c(0, 20, 37, 100)), "\n")
```

If your function uses `if/else` (not `ifelse()`), it won't work on vectors:

```r
# NOT vectorized — uses if/else
grade_single <- function(score) {
  if (score >= 90) return("A")
  if (score >= 80) return("B")
  if (score >= 70) return("C")
  return("F")
}

# Works for one value
cat("Single:", grade_single(85), "\n")

# Fails for a vector — uncomment to see:
# grade_single(c(85, 92, 68))  # Warning: only first element used

# Fix: use Vectorize() to make it work on vectors
grade <- Vectorize(grade_single)
cat("Vectorized:", grade(c(85, 92, 68)), "\n")
```

Or better yet, write it with `ifelse()` or `case_when()` from the start.

## Practice Exercises

### Exercise 1: Temperature Converter

```r
# Exercise: Write a function temp_convert() that:
# - Takes a temperature value and a "from" unit ("C", "F", or "K")
# - Converts to all three units
# - Returns a named vector with C, F, K values
# Test: temp_convert(100, "C") should give C=100, F=212, K=373.15

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
# Solution
temp_convert <- function(temp, from = "C") {
  if (from == "C") {
    c_val <- temp
  } else if (from == "F") {
    c_val <- (temp - 32) * 5/9
  } else if (from == "K") {
    c_val <- temp - 273.15
  } else {
    stop("'from' must be 'C', 'F', or 'K'")
  }

  c(C = round(c_val, 2),
    F = round(c_val * 9/5 + 32, 2),
    K = round(c_val + 273.15, 2))
}

cat("100°C =", temp_convert(100, "C"), "\n")
cat("32°F =", temp_convert(32, "F"), "\n")
cat("0K =", temp_convert(0, "K"), "\n")
```

**Explanation:** The function first converts any input to Celsius (the base unit), then computes all three outputs from Celsius. Using `stop()` for invalid input gives a clear error message.

</details>

### Exercise 2: Statistical Outlier Detector

```r
# Exercise: Write a function find_outliers() that:
# - Takes a numeric vector
# - Identifies outliers using the IQR method (< Q1-1.5*IQR or > Q3+1.5*IQR)
# - Returns a list with: outlier_values, outlier_positions, bounds (lower, upper)
# Test with: c(1, 2, 3, 4, 5, 100, -50, 3, 4, 5)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
# Solution
find_outliers <- function(x) {
  q1 <- quantile(x, 0.25, na.rm = TRUE)
  q3 <- quantile(x, 0.75, na.rm = TRUE)
  iqr <- q3 - q1
  lower <- q1 - 1.5 * iqr
  upper <- q3 + 1.5 * iqr

  is_outlier <- x < lower | x > upper

  list(
    outlier_values = x[is_outlier],
    outlier_positions = which(is_outlier),
    bounds = c(lower = unname(lower), upper = unname(upper)),
    n_outliers = sum(is_outlier),
    n_total = length(x)
  )
}

data <- c(1, 2, 3, 4, 5, 100, -50, 3, 4, 5)
result <- find_outliers(data)
cat("Data:", data, "\n")
cat("Outliers:", result$outlier_values, "\n")
cat("At positions:", result$outlier_positions, "\n")
cat("Bounds: [", result$bounds["lower"], ",", result$bounds["upper"], "]\n")
```

**Explanation:** The IQR method defines outliers as values more than 1.5 × IQR below Q1 or above Q3. The function returns a list so the caller gets the outlier values, their positions, and the bounds — all in one call.

</details>

### Exercise 3: Flexible Summary Function

```r
# Exercise: Write a function column_report() that:
# - Takes a data frame
# - For numeric columns: prints mean, sd, % missing
# - For character columns: prints unique count, most common value, % missing
# - Returns invisible(NULL) (it's a printing function)
# Test with: data.frame(x = c(1,2,NA,4), y = c("a","b","a","a"))

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
# Solution
column_report <- function(df) {
  for (col_name in names(df)) {
    col <- df[[col_name]]
    pct_missing <- round(mean(is.na(col)) * 100, 1)

    if (is.numeric(col)) {
      cat(sprintf("%-15s [numeric]  mean=%.2f  sd=%.2f  missing=%s%%\n",
        col_name, mean(col, na.rm = TRUE), sd(col, na.rm = TRUE), pct_missing))
    } else {
      tbl <- sort(table(col), decreasing = TRUE)
      most_common <- names(tbl)[1]
      cat(sprintf("%-15s [character] unique=%d  mode='%s'  missing=%s%%\n",
        col_name, length(tbl), most_common, pct_missing))
    }
  }
  invisible(NULL)
}

# Test
test_df <- data.frame(
  age = c(25, 30, NA, 45, 28),
  score = c(88, 92, 75, NA, 83),
  grade = c("A", "A", "B", "A", "B"),
  city = c("NYC", "LA", "NYC", "NYC", "SF")
)

column_report(test_df)
```

**Explanation:** The function loops over column names, checks each column's type with `is.numeric()`, and prints the appropriate summary. `invisible(NULL)` means it's called for its side effect (printing), not its return value.

</details>

## Summary

| Concept | Syntax | Example |
|---------|--------|---------|
| Define | `function(args) { body }` | `add <- function(x, y) x + y` |
| Default arg | `arg = default` | `f <- function(x, n = 10)` |
| Return | `return(value)` | `return(result)` |
| Multiple returns | `list(a = x, b = y)` | Return a named list |
| Early exit | `return()` inside `if` | Guard clause pattern |
| Validation | `stop("msg")` | `if (!is.numeric(x)) stop(...)` |
| Vectorize | `Vectorize(f)` | Or write with `ifelse()`/`case_when()` |
| Pipe-friendly | First arg = data | `my_func <- function(df, ...)` |

## FAQ

### Should I use return() explicitly or rely on implicit return?

Both are acceptable. Use explicit `return()` for functions longer than ~5 lines, functions with early exits (`if (error) return(NA)`), or when returning in the middle of the function. Use implicit return for short, one-expression functions.

### How many arguments should a function have?

As few as possible. Functions with 1-3 arguments are easy to understand. If you need more than 5, consider grouping related arguments into a list or creating multiple smaller functions.

### Can functions modify their arguments?

No. R uses **copy-on-modify** semantics. When you pass a variable to a function and modify it inside, R creates a copy — the original is unchanged. This is a feature, not a bug — it prevents unexpected side effects.

### What does invisible() do?

`invisible(x)` returns `x` but doesn't print it. Use it when your function is called for a side effect (printing, plotting, writing files) and you don't want the return value cluttering the console.

### When should I write a function vs use existing ones?

Write a function when you're copying and pasting the same code block more than twice. Before writing your own, search CRAN — there's probably a package that does what you need. The tidyverse, in particular, has functions for most common data manipulation tasks.

## What's Next?

You can now write reusable R functions. Next:

1. **R Special Values** — handle NA, NULL, NaN, and Inf in your functions
2. **Getting Help in R** — find and understand R documentation
3. **Functional Programming** — use functions as arguments to other functions

Functions are the building blocks of all serious R programming.
