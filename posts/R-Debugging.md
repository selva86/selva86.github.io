---
title: "Debugging R Code: browser(), debug(), traceback() & RStudio Debugger"
slug: "R-Debugging"
description: "Learn to debug R code with browser(), debug(), traceback(), debugonce(), options(error=recover), and RStudio's visual debugger and breakpoints."
keywords: "R debugging, R browser, R debug, R traceback, R debugonce, RStudio debugger, R breakpoints, options error recover"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "4.1.8"
post_type: "C"
auto_link_terms: "R debugging|browser()|debug()|traceback()|R debugger"
auto_link_case_sensitive: false
---

# Debugging R Code: browser(), debug(), traceback() & RStudio Debugger

<p class="lead">Debugging is finding out why your code produces wrong results or errors. R provides <code>traceback()</code> to see where an error occurred, <code>browser()</code> to pause and inspect, and <code>debug()</code> to step through functions line by line. Combined with RStudio's visual debugger, you have everything you need.</p>

Everyone writes buggy code. The difference between a beginner and an experienced R programmer isn't the number of bugs — it's how fast they find and fix them. This tutorial teaches you R's debugging toolkit.

## Introduction

R's debugging workflow has three phases:

1. **Locate** — find where the error happens (`traceback()`, error messages)
2. **Inspect** — examine the state at that point (`browser()`, `debug()`)
3. **Fix** — correct the code and verify

Here are the tools:

| Tool | What it does | When to use |
|------|-------------|-------------|
| `traceback()` | Shows the call stack after an error | First step — "where did it fail?" |
| `browser()` | Pauses execution, opens interactive prompt | Insert where you want to inspect |
| `debug(fn)` | Auto-inserts browser at the start of fn | Step through a function |
| `debugonce(fn)` | Like debug but only for the next call | Quick one-time inspection |
| `options(error = recover)` | Opens browser at error location | Catch unexpected errors |

## traceback(): Where Did It Fail?

After an error, `traceback()` shows the call stack — the chain of function calls that led to the error:

```r
# Create a chain of functions that will fail
inner <- function(x) {
  log(x)  # fails if x is character
}

middle <- function(x) {
  inner(x)
}

outer <- function(x) {
  middle(x)
}

# Catch the error and show the traceback
tryCatch(
  outer("not a number"),
  error = function(e) {
    cat("Error:", conditionMessage(e), "\n\n")
    cat("The call stack would be:\n")
    cat("  3: inner(x) -> log(x) fails here\n")
    cat("  2: middle(x) -> called inner\n")
    cat("  1: outer('not a number') -> called middle\n")
  }
)
```

In an interactive session, you'd simply call `traceback()` right after the error. Read the output bottom-to-top: the bottom is where execution started, the top is where it failed.

## browser(): Pause and Inspect

Insert `browser()` anywhere in your code to pause execution and open an interactive prompt:

```r
# In a real R session, browser() pauses here and lets you type commands:
# n — execute next line
# s — step into function call
# c — continue (resume execution)
# Q — quit the browser
# ls() — see local variables
# any expression — evaluate it

problematic <- function(data) {
  # Uncomment browser() in a local R session to pause here:
  # browser()

  total <- sum(data)
  avg <- total / length(data)

  # Let's simulate what you'd see in the browser
  cat("In a browser session, you could inspect:\n")
  cat("  data:", data, "\n")
  cat("  total:", total, "\n")
  cat("  avg:", avg, "\n")

  avg
}

result <- problematic(c(10, 20, NA, 40))
cat("Result:", result, "\n")
cat("Oops! NA because sum() returns NA when input has NA\n")
cat("Fix: use na.rm = TRUE\n")
```

### Conditional browser

```r
# Only pause when a condition is met
analyze <- function(values) {
  results <- numeric(length(values))

  for (i in seq_along(values)) {
    results[i] <- sqrt(values[i])

    # In a real session, this would pause only for problem values:
    # if (is.nan(results[i])) browser()
    if (is.nan(results[i])) {
      cat(sprintf("Problem at index %d: sqrt(%g) = NaN\n", i, values[i]))
    }
  }

  results
}

output <- analyze(c(4, 9, -1, 16, -25))
cat("Results:", output, "\n")
```

## debug() and debugonce(): Step Through Functions

`debug(fn)` marks a function so that every call to it opens the browser. `debugonce(fn)` does the same but only for the next call:

```r
# In a real R session:
# debug(my_function)    — every call will enter browser
# my_function(args)     — browser opens, step through with n/s/c
# undebug(my_function)  — stop debugging

# debugonce(my_function) — enters browser only on next call

# Simulated example showing what you'd see:
calculate_bmi <- function(weight_kg, height_m) {
  bmi <- weight_kg / height_m^2
  category <- if (bmi < 18.5) "Underweight"
              else if (bmi < 25) "Normal"
              else if (bmi < 30) "Overweight"
              else "Obese"
  list(bmi = round(bmi, 1), category = category)
}

# If you ran: debugonce(calculate_bmi)
# Then: calculate_bmi(70, 1.75)
# You'd step through each line:
#   Browse[2]> n          (execute: bmi <- 70 / 1.75^2)
#   Browse[2]> bmi        (inspect: 22.85714)
#   Browse[2]> n          (execute: category <- ...)
#   Browse[2]> category   (inspect: "Normal")
#   Browse[2]> c          (continue to end)

result <- calculate_bmi(70, 1.75)
cat("BMI:", result$bmi, "-", result$category, "\n")
```

## options(error = recover): Catch Errors Automatically

Setting `options(error = recover)` makes R open a browser session whenever *any* error occurs — you can inspect the state at each level of the call stack:

```r
# In a real R session:
# options(error = recover)
#
# When an error happens, R shows:
#   Enter a frame number, or 0 to exit
#   1: outer("bad")
#   2: middle("bad")
#   3: inner("bad")
#
# You type a number to inspect that environment:
#   Selection: 3
#   Browse[1]> ls()
#   Browse[1]> x
#   Browse[1]> 0    (exit)

# Reset to default behavior:
# options(error = NULL)

# Demonstrate the concept:
cat("options(error = recover) workflow:\n")
cat("1. Set: options(error = recover)\n")
cat("2. Run your code\n")
cat("3. When error occurs, R lists the call stack\n")
cat("4. Enter a frame number to inspect that environment\n")
cat("5. Type 0 to exit\n")
cat("6. Reset: options(error = NULL)\n")
```

## Practical Debugging Strategy

Here's a systematic approach to debugging R code:

```r
# Step 1: Read the error message carefully
# Step 2: Use traceback() to find where it happened
# Step 3: Insert browser() just before the failing line
# Step 4: Inspect variables and test fixes interactively
# Step 5: Remove browser() and apply the fix

# Example: debugging a data processing pipeline
process_scores <- function(scores) {
  # Step 1: Clean
  clean <- as.numeric(scores)

  # Step 2: Validate
  if (any(is.na(clean))) {
    bad_idx <- which(is.na(clean))
    cat("Warning: NAs at positions:", bad_idx, "\n")
    cat("Original values:", scores[bad_idx], "\n")
    clean <- clean[!is.na(clean)]
  }

  # Step 3: Normalize to 0-100
  if (length(clean) == 0) stop("No valid scores after cleaning")
  min_score <- min(clean)
  max_score <- max(clean)

  if (min_score == max_score) {
    warning("All scores are identical — returning 50 for all")
    return(rep(50, length(clean)))
  }

  normalized <- (clean - min_score) / (max_score - min_score) * 100
  round(normalized, 1)
}

# Test cases that exercise different code paths
cat("Normal:", process_scores(c(60, 70, 80, 90, 100)), "\n")
cat("With bad data:", process_scores(c("80", "ninety", "100", "NA")), "\n")
```

### Common Debugging Patterns

```r
# Pattern 1: Print intermediate values
debug_print <- function(label, value) {
  cat(sprintf("[DEBUG] %s: %s\n", label, paste(value, collapse = ", ")))
  invisible(value)
}

# Pattern 2: Assert expectations
assert <- function(condition, message) {
  if (!condition) stop(message, call. = FALSE)
}

# Pattern 3: Verbose mode
my_function <- function(x, verbose = FALSE) {
  if (verbose) cat("Input length:", length(x), "\n")
  result <- cumsum(x)
  if (verbose) cat("Output range:", range(result), "\n")
  result
}

# Use them:
data <- c(1, 5, 3, 7, 2)
debug_print("input", data)
assert(is.numeric(data), "data must be numeric")
output <- my_function(data, verbose = TRUE)
cat("Final:", output, "\n")
```

## Practice Exercises

### Exercise 1: Find the Bug

```r
# Exercise: This function should return the second-largest value
# in a vector. It has a bug. Find and fix it.

second_largest <- function(x) {
  sorted <- sort(x)
  sorted[length(sorted) - 1]
}

# Test cases:
cat("Test 1:", second_largest(c(5, 3, 8, 1, 9)), "\n")  # Should be 8
cat("Test 2:", second_largest(c(1, 1, 1)), "\n")          # Should be 1
cat("Test 3:", second_largest(c(10, 5)), "\n")             # Should be 5
cat("Test 4:", second_largest(c(7)), "\n")                 # Should be NA or error

# The bug shows with duplicate maximum values:
cat("Test 5:", second_largest(c(9, 9, 5, 3)), "\n")       # Should be 9

# Fix the function below:

```

<details>
<summary>Click to reveal solution</summary>

```r
# The original function works for simple cases but:
# 1. Returns wrong result for single-element vectors
# 2. Returns correct result for duplicates (which is fine)
# The main bug: no handling of edge cases

second_largest <- function(x) {
  if (length(x) < 2) {
    warning("Need at least 2 elements for second largest")
    return(NA)
  }
  unique_sorted <- sort(unique(x), decreasing = TRUE)
  if (length(unique_sorted) < 2) return(x[1])  # All identical
  unique_sorted[2]
}

cat("Test 1:", second_largest(c(5, 3, 8, 1, 9)), "\n")  # 8
cat("Test 2:", second_largest(c(1, 1, 1)), "\n")          # 1
cat("Test 3:", second_largest(c(10, 5)), "\n")             # 5
cat("Test 4:", second_largest(c(7)), "\n")                 # NA
cat("Test 5:", second_largest(c(9, 9, 5, 3)), "\n")       # 9
```

**Explanation:** The debug approach: (1) identify edge cases, (2) check each test case mentally, (3) add guard clauses for edge cases. Using `sort(unique(x), decreasing = TRUE)` ensures we get the second *distinct* largest value.

</details>

### Exercise 2: Debug the Pipeline

```r
# Exercise: This pipeline crashes. Use the error message
# to find and fix the bug. Don't change the input data.

process <- function(df) {
  df$score_pct <- df$score / df$max_score * 100
  df$grade <- ifelse(df$score_pct >= 70, "Pass", "Fail")
  df$summary <- paste(df$name, ":", df$grade)
  df
}

data <- data.frame(
  name = c("Alice", "Bob", "Carol"),
  score = c(85, 62, 91),
  max_score = c(100, 100, 100)
)

result <- process(data)
print(result)

# Now try with this data — what happens?
# data2 <- data.frame(
#   name = c("Alice", "Bob"),
#   score = c(85, 62),
#   max_score = c(100, 0)  # Bug: division by zero
# )
# result2 <- process(data2)

# Fix the process function to handle max_score = 0

```

<details>
<summary>Click to reveal solution</summary>

```r
process <- function(df) {
  # Guard against division by zero
  df$score_pct <- ifelse(df$max_score == 0, 0,
                         df$score / df$max_score * 100)
  df$grade <- ifelse(df$score_pct >= 70, "Pass", "Fail")
  df$summary <- paste(df$name, ":", df$grade)
  df
}

data2 <- data.frame(
  name = c("Alice", "Bob"),
  score = c(85, 62),
  max_score = c(100, 0)
)

result2 <- process(data2)
print(result2)
```

**Explanation:** Division by zero in R produces `Inf`, not an error. But `Inf >= 70` is `TRUE`, so Bob would get "Pass" with 0 max score. The fix checks for `max_score == 0` and assigns 0% instead.

</details>

## Summary

| Tool | Usage | When |
|------|-------|------|
| `traceback()` | Call after error | Find where error occurred |
| `browser()` | Insert in code | Inspect state at a specific point |
| `debug(fn)` | Before calling fn | Step through every call to fn |
| `debugonce(fn)` | Before calling fn | Step through next call only |
| `undebug(fn)` | After debugging | Stop auto-debugging fn |
| `options(error = recover)` | Set once | Auto-debug all errors |
| `options(error = NULL)` | Reset | Return to normal behavior |

**Debugging workflow:** Error message -> `traceback()` -> `browser()` at suspicious line -> inspect variables -> fix -> test.

## FAQ

### Can I debug code in WebR or R Markdown?

`browser()` requires an interactive session, so it won't work in WebR or non-interactive R Markdown renders. Use `cat()` or `print()` for debugging in those contexts. In RStudio, you can use breakpoints (click in the margin) which work like `browser()`.

### What do the browser commands n, s, c, Q mean?

`n` (next) executes the current line and moves to the next. `s` (step) steps *into* a function call. `c` (continue) resumes normal execution. `Q` quits the browser and returns to the top level.

### How do I debug inside apply/lapply/map?

Insert `browser()` inside the function you pass to `lapply()`. Or wrap it in a `tryCatch` to catch which element fails. Example: `lapply(data, function(x) { if (is.character(x)) browser(); process(x) })`.

## Continue Learning

With debugging skills in hand, explore related topics:

1. **R Conditions System** — handle errors gracefully with tryCatch
2. **R Common Errors** — the 50 most frequent errors and their fixes
3. **R Execution Stack** — understand sys.call(), parent.frame() internals
