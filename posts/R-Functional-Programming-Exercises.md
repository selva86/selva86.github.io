---
title: "Advanced R Exercises: 10 Functional Programming Practice Problems"
slug: "R-Functional-Programming-Exercises"
description: "10 functional programming exercises in R: closures, map/reduce, function factories, composition, and purrr. Interactive solutions step by step."
keywords: "R functional programming exercises, R closures practice, purrr exercises, map reduce exercises R, FP practice R"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "E11.1"
post_type: "EX"
auto_link_terms: "functional programming exercises|FP practice|closure exercises"
auto_link_case_sensitive: false
fr_parent: "Functional-Programming-in-R.html"
---

# Advanced R Exercises: 10 Functional Programming Practice Problems

<p class="lead">Test your functional programming skills with 10 exercises covering closures, <code>map()</code>/<code>Reduce()</code>, function factories, composition, and error handling. Each problem has an interactive solution.</p>

These exercises assume you're familiar with first-class functions, purrr map variants, closures, and function factories. They're designed to cement those concepts through hands-on practice.

## Easy (1-3): Core FP Concepts

### Exercise 1: First-Class Functions

Prove that functions are objects in R by storing them in a list and applying them dynamically.

```r
# Create a list of 5 math functions: square, cube, negate, double, half
# Apply each one to the number 6 using sapply

```

<details>
<summary>Click to reveal solution</summary>

```r
math_fns <- list(
  square = \(x) x^2,
  cube = \(x) x^3,
  negate = \(x) -x,
  double = \(x) x * 2,
  half = \(x) x / 2
)

results <- sapply(math_fns, \(f) f(6))
cat("Results:\n")
print(results)
```

**Explanation:** Functions are regular R objects — you can put them in lists, pass them to `sapply()`, and call them dynamically. This is the foundation of functional programming.

</details>

### Exercise 2: Closures

Create a function that returns a counter — each call increments and returns the count.

```r
# Create make_counter(start = 0)
# It should return a function that:
#   - Returns the current count each time it's called
#   - Increments the count after each call

# counter <- make_counter()
# counter() -> 1
# counter() -> 2
# counter() -> 3

```

<details>
<summary>Click to reveal solution</summary>

```r
make_counter <- function(start = 0) {
  count <- start
  function() {
    count <<- count + 1
    count
  }
}

counter <- make_counter()
cat("Call 1:", counter(), "\n")
cat("Call 2:", counter(), "\n")
cat("Call 3:", counter(), "\n")

# Independent counters don't share state
counter_from_10 <- make_counter(10)
cat("\nFrom 10:", counter_from_10(), "\n")
cat("From 10:", counter_from_10(), "\n")
cat("Original:", counter(), "\n")  # Still independent
```

**Explanation:** The inner function closes over `count` from the outer function's environment. `<<-` modifies `count` in the enclosing scope. Each call to `make_counter()` creates a separate environment.

</details>

### Exercise 3: Map and Reduce

Given a list of numeric vectors, calculate the grand mean (mean of means) using `map_dbl` and `Reduce`.

```r
library(purrr)

data_list <- list(
  group_a = c(23, 45, 12, 67),
  group_b = c(89, 34, 56),
  group_c = c(11, 22, 33, 44, 55),
  group_d = c(100, 200)
)

# 1. Calculate the mean of each group using map_dbl
# 2. Find the overall mean of those group means
# 3. Use Reduce to concatenate all vectors, then compute grand mean

```

<details>
<summary>Click to reveal solution</summary>

```r
library(purrr)

data_list <- list(
  group_a = c(23, 45, 12, 67),
  group_b = c(89, 34, 56),
  group_c = c(11, 22, 33, 44, 55),
  group_d = c(100, 200)
)

# 1. Mean per group
group_means <- map_dbl(data_list, mean)
cat("Group means:", round(group_means, 1), "\n")

# 2. Mean of means (unweighted)
cat("Mean of means:", round(mean(group_means), 1), "\n")

# 3. Grand mean (weighted by group size)
all_values <- Reduce(c, data_list)
cat("Grand mean:", round(mean(all_values), 1), "\n")
cat("(These differ because groups have different sizes)\n")
```

**Explanation:** `map_dbl` extracts one number per group. `Reduce(c, list)` concatenates all vectors into one. The mean-of-means and grand mean differ when groups have unequal sizes.

</details>

## Medium (4-7): Combining Concepts

### Exercise 4: Function Factory

Build a `make_scaler()` factory that creates scaling functions for different ranges.

```r
# Create make_scaler(new_min, new_max) that returns a function
# The returned function scales input to [new_min, new_max] range

# scale_0_1 <- make_scaler(0, 1)
# scale_0_1(c(10, 20, 30, 40, 50)) -> c(0, 0.25, 0.5, 0.75, 1)

# scale_neg1_1 <- make_scaler(-1, 1)
# scale_neg1_1(c(10, 20, 30, 40, 50)) -> c(-1, -0.5, 0, 0.5, 1)

```

<details>
<summary>Click to reveal solution</summary>

```r
make_scaler <- function(new_min = 0, new_max = 1) {
  force(new_min); force(new_max)
  function(x) {
    old_min <- min(x, na.rm = TRUE)
    old_max <- max(x, na.rm = TRUE)
    if (old_min == old_max) return(rep(mean(c(new_min, new_max)), length(x)))
    (x - old_min) / (old_max - old_min) * (new_max - new_min) + new_min
  }
}

scale_0_1 <- make_scaler(0, 1)
scale_neg1_1 <- make_scaler(-1, 1)
scale_pct <- make_scaler(0, 100)

data <- c(10, 20, 30, 40, 50)
cat("[0,1]:    ", scale_0_1(data), "\n")
cat("[-1,1]:   ", scale_neg1_1(data), "\n")
cat("[0,100]:  ", scale_pct(data), "\n")
```

**Explanation:** The factory captures `new_min` and `new_max` in the closure. The returned function computes min-max scaling using both the captured range and the data's actual range.

</details>

### Exercise 5: Compose a Data Pipeline

Use `Reduce` or purrr `compose` to build a text processing pipeline.

```r
library(purrr)

# Create individual functions:
# 1. remove_digits: removes all digits
# 2. remove_extra_spaces: collapses multiple spaces to one
# 3. trim_and_lower: trims whitespace and lowercases

# Compose them into a single clean_text function
# Test on: "  Hello 123   World  456 "
# Expected: "hello world"

```

<details>
<summary>Click to reveal solution</summary>

```r
library(purrr)

remove_digits <- \(s) gsub("[0-9]", "", s)
remove_extra_spaces <- \(s) gsub("\\s+", " ", s)
trim_and_lower <- \(s) tolower(trimws(s))

# Using compose (right-to-left by default)
clean_text <- compose(trim_and_lower, remove_extra_spaces, remove_digits)

# Or left-to-right
clean_text2 <- compose(remove_digits, remove_extra_spaces, trim_and_lower, .dir = "forward")

test <- "  Hello 123   World  456 "
cat("compose (R-to-L):", clean_text(test), "\n")
cat("compose (L-to-R):", clean_text2(test), "\n")

# Using Reduce
clean_text3 <- function(s) {
  Reduce(\(x, f) f(x), list(remove_digits, remove_extra_spaces, trim_and_lower), init = s)
}
cat("Reduce:          ", clean_text3(test), "\n")
```

**Explanation:** `compose()` chains functions. With `.dir = "forward"`, they run left-to-right. The `Reduce` approach applies each function in sequence, passing the result forward.

</details>

### Exercise 6: safely() Error Handling

Process a mixed list of inputs, capturing both successes and failures.

```r
library(purrr)

inputs <- list(4, "abc", 9, NULL, 16, "xyz", 25)

# Use safely(sqrt) to attempt sqrt on each input
# Collect all successful results into one vector
# Collect all error messages into another vector

```

<details>
<summary>Click to reveal solution</summary>

```r
library(purrr)

inputs <- list(4, "abc", 9, NULL, 16, "xyz", 25)

safe_sqrt <- safely(sqrt)
results <- map(inputs, safe_sqrt)

successes <- map_dbl(keep(results, ~ is.null(.x$error)), "result")
errors <- map_chr(discard(results, ~ is.null(.x$error)), ~ .x$error$message)

cat("Successes:", successes, "\n")
cat("Errors:\n")
walk(errors, ~ cat("  -", .x, "\n"))
cat("\nSuccess rate:", length(successes), "/", length(inputs), "\n")
```

**Explanation:** `safely()` wraps each result in a list with `$result` and `$error`. Use `keep()` and `discard()` to separate successes from failures. This is the FP way to handle errors — no try/catch spaghetti.

</details>

### Exercise 7: imap with Reporting

Use `imap` to create a formatted report from a named list of statistics.

```r
library(purrr)

quarterly_sales <- list(
  Q1 = c(150, 200, 180, 220),
  Q2 = c(250, 300, 275, 310),
  Q3 = c(180, 190, 210, 200),
  Q4 = c(350, 400, 380, 420)
)

# Use imap to create a report line for each quarter:
# "Q1: total=$750, avg=$187.5, best=$220"
# Calculate which quarter had the highest total

```

<details>
<summary>Click to reveal solution</summary>

```r
library(purrr)

quarterly_sales <- list(
  Q1 = c(150, 200, 180, 220),
  Q2 = c(250, 300, 275, 310),
  Q3 = c(180, 190, 210, 200),
  Q4 = c(350, 400, 380, 420)
)

report <- imap_chr(quarterly_sales, \(sales, quarter) {
  sprintf("%s: total=$%d, avg=$%.1f, best=$%d",
          quarter, sum(sales), mean(sales), max(sales))
})

walk(report, ~ cat(.x, "\n"))

totals <- map_dbl(quarterly_sales, sum)
best <- names(which.max(totals))
cat("\nBest quarter:", best, "($", totals[best], ")\n")
```

**Explanation:** `imap_chr` passes both the value (`.x`) and the name (`.y`) to your function. This is perfect for creating formatted output from named data.

</details>

## Hard (8-10): Advanced Patterns

### Exercise 8: Memoized Recursive Function

Write a memoized version of the Collatz sequence length calculator.

```r
library(memoise)

# The Collatz conjecture: start with n
# If even: n/2. If odd: 3n+1. Repeat until n=1.
# Count the steps.

# Example: 6 -> 3 -> 10 -> 5 -> 16 -> 8 -> 4 -> 2 -> 1 (8 steps)

# Write collatz_length(n) and memoize it
# Then find which number from 1 to 100 has the longest sequence

```

<details>
<summary>Click to reveal solution</summary>

```r
library(memoise)

collatz_length <- memoise(function(n) {
  if (n == 1) return(0)
  if (n %% 2 == 0) 1 + collatz_length(n / 2)
  else 1 + collatz_length(3 * n + 1)
})

# Test
cat("Collatz length of 6:", collatz_length(6), "\n")
cat("Collatz length of 27:", collatz_length(27), "\n")

# Find the longest chain from 1 to 100
lengths <- sapply(1:100, collatz_length)
best <- which.max(lengths)
cat("\nLongest chain: n =", best, "with", lengths[best], "steps\n")
```

**Explanation:** Memoization caches intermediate results. When computing the chain for 6, it caches lengths for 3, 10, 5, 16, 8, 4, 2, 1. Later numbers reuse these cached values, making the sweep from 1-100 very fast.

</details>

### Exercise 9: Function Operator Chain

Create a `with_retry(f, n)` function operator that retries a function up to n times on failure.

```r
# Create with_retry(f, max_attempts = 3)
# It should return a new function that:
# - Calls f(...)
# - If it errors, retries up to max_attempts times
# - Returns the first successful result
# - If all attempts fail, throws the last error

# Test with a function that fails randomly

```

<details>
<summary>Click to reveal solution</summary>

```r
with_retry <- function(f, max_attempts = 3) {
  function(...) {
    for (i in seq_len(max_attempts)) {
      result <- tryCatch(f(...), error = function(e) e)
      if (!inherits(result, "error")) return(result)
      if (i < max_attempts) cat("  Attempt", i, "failed, retrying...\n")
    }
    stop("All ", max_attempts, " attempts failed. Last error: ", result$message)
  }
}

# Unreliable function: fails 60% of the time
set.seed(42)
unreliable <- function(x) {
  if (runif(1) < 0.6) stop("Random failure!")
  x * 10
}

safe_fn <- with_retry(unreliable, max_attempts = 5)
result <- safe_fn(7)
cat("Result:", result, "\n")
```

**Explanation:** `with_retry` is a function operator — it takes a function and returns an enhanced version. The retry loop uses `tryCatch` to catch errors and loop until success or exhaustion.

</details>

### Exercise 10: Full FP Pipeline

Combine map, reduce, compose, and closures to build a complete data analysis pipeline.

```r
library(purrr)

# Given: a list of CSV-like text strings (simulating file reads)
raw_data <- list(
  "Alice,88,A", "Bob,76,C", "Carol,92,A",
  "David,NA,B", "Eve,95,A", "Frank,81,B"
)

# 1. Parse each string into a named list (name, score, grade)
# 2. Filter out entries with NA scores
# 3. Calculate mean score of remaining entries
# 4. Find the person with highest score

```

<details>
<summary>Click to reveal solution</summary>

```r
library(purrr)

raw_data <- list(
  "Alice,88,A", "Bob,76,C", "Carol,92,A",
  "David,NA,B", "Eve,95,A", "Frank,81,B"
)

# 1. Parse: map each string to a named list
parse_record <- \(s) {
  parts <- strsplit(s, ",")[[1]]
  list(name = parts[1],
       score = suppressWarnings(as.numeric(parts[2])),
       grade = parts[3])
}

records <- map(raw_data, parse_record)
cat("Parsed", length(records), "records\n")

# 2. Filter: keep only non-NA scores
valid <- keep(records, \(r) !is.na(r$score))
cat("Valid:", length(valid), "records\n")

# 3. Mean score
scores <- map_dbl(valid, "score")
cat("Mean score:", mean(scores), "\n")

# 4. Highest score
best_idx <- which.max(scores)
cat("Top scorer:", valid[[best_idx]]$name,
    "with", valid[[best_idx]]$score, "\n")
```

**Explanation:** This exercise chains `map` (parse), `keep` (filter), `map_dbl` (extract), and base R `which.max` (find). Each step is a pure function that transforms data — classic FP style.

</details>

## Summary

| Concept Tested | Exercises |
|---------------|-----------|
| First-class functions | 1 |
| Closures and `<<-` | 2 |
| map/Reduce | 3, 7 |
| Function factories | 4 |
| compose/pipeline | 5, 10 |
| safely/error handling | 6 |
| Memoization | 8 |
| Function operators | 9 |
| Full pipeline | 10 |

## Continue Learning

- [Functional Programming in R](/Functional-Programming-in-R.html) — review the core concepts
- [purrr map() Variants](/purrr-map-Variants.html) — deep dive on map family
- [R Function Factories](/R-Function-Factories.html) — more on closures and factories
