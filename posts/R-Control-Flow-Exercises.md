---
title: "R Control Flow Exercises: 12 if/else, Loop & Function Practice Problems — Solved Step-by-Step"
slug: "R-Control-Flow-Exercises"
description: "12 R control flow exercises: if/else decisions, for loops, while loops, and vectorized alternatives. Interactive problems with step-by-step solutions."
keywords: "R control flow exercises, R loop exercises, R if else exercises, R for loop practice, R while loop problems"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "E1.5"
post_type: "EX"
auto_link_terms: "R control flow exercises|R loop exercises|R if else exercises"
auto_link_case_sensitive: false
fr_parent: "R-Control-Flow.html"
---

# R Control Flow Exercises: 12 if/else, Loop & Function Practice Problems — Solved Step-by-Step

<p class="lead">Practice R control flow with 12 exercises: if/else branching, for loops, while loops, break/next, and vectorized alternatives. Each problem has interactive code and a detailed solution.</p>

These exercises cover the skills from the R Control Flow tutorial. They progress from if/else decisions (Easy) through loop patterns (Medium) to combined challenges (Hard).

## Easy (1-4): if/else Decisions

### Exercise 1: Age Classifier

Write code that classifies an age into: "Child" (0-12), "Teen" (13-17), "Adult" (18-64), "Senior" (65+). Test with ages 8, 16, 35, and 70.

```r
# Exercise 1: Classify ages
ages <- c(8, 16, 35, 70)

# Classify each age and print the result

```

<details>
<summary>Click to reveal solution</summary>

```r
ages <- c(8, 16, 35, 70)

# Vectorized approach with ifelse
categories <- ifelse(ages < 13, "Child",
              ifelse(ages < 18, "Teen",
              ifelse(ages < 65, "Adult", "Senior")))

for (i in seq_along(ages)) {
  cat("Age", ages[i], "→", categories[i], "\n")
}
```

</details>

### Exercise 2: Leap Year Checker

Write a function `is_leap_year(year)` that returns TRUE if the year is a leap year. Rules: divisible by 4, BUT not by 100, UNLESS also by 400.

```r
# Exercise 2: Leap year checker
# Test: 2024 (yes), 1900 (no), 2000 (yes), 2023 (no)

```

<details>
<summary>Click to reveal solution</summary>

```r
is_leap_year <- function(year) {
  if (year %% 400 == 0) return(TRUE)
  if (year %% 100 == 0) return(FALSE)
  if (year %% 4 == 0) return(TRUE)
  return(FALSE)
}

test_years <- c(2024, 1900, 2000, 2023, 2100, 2400)
for (y in test_years) {
  cat(y, "→", if (is_leap_year(y)) "Leap year" else "Not leap year", "\n")
}
```

**Key concept:** Order matters — check the most specific condition (divisible by 400) first, then the exceptions.

</details>

### Exercise 3: Number Classifier

Given a number, determine if it's: positive/negative/zero, even/odd, and prime/composite. Print all three properties.

```r
# Exercise 3: Classify a number
# Test with: 17, -4, 0, 12, 1

```

<details>
<summary>Click to reveal solution</summary>

```r
classify_number <- function(n) {
  # Sign
  sign <- if (n > 0) "positive" else if (n < 0) "negative" else "zero"

  # Even/odd (only for integers)
  parity <- if (n == 0) "neither" else if (n %% 2 == 0) "even" else "odd"

  # Prime check
  is_prime <- FALSE
  if (n > 1) {
    is_prime <- TRUE
    for (i in 2:floor(sqrt(n))) {
      if (n %% i == 0) { is_prime <- FALSE; break }
    }
  }
  primality <- if (n <= 1) "N/A" else if (is_prime) "prime" else "composite"

  cat(sprintf("%3d → %s, %s, %s\n", n, sign, parity, primality))
}

for (num in c(17, -4, 0, 12, 1, 97, 100)) {
  classify_number(num)
}
```

</details>

### Exercise 4: Vectorized vs Loop

Classify temperatures as "Cold" (<50), "Mild" (50-75), or "Hot" (>75). Do it first with a for loop, then with ifelse(). Verify both give the same result.

```r
# Exercise 4: Two approaches
temps <- c(42, 68, 81, 55, 90, 47, 73, 85)

# Method 1: for loop
# Method 2: ifelse()
# Verify they match

```

<details>
<summary>Click to reveal solution</summary>

```r
temps <- c(42, 68, 81, 55, 90, 47, 73, 85)

# Method 1: for loop
result_loop <- character(length(temps))
for (i in seq_along(temps)) {
  if (temps[i] < 50) result_loop[i] <- "Cold"
  else if (temps[i] <= 75) result_loop[i] <- "Mild"
  else result_loop[i] <- "Hot"
}

# Method 2: ifelse (vectorized — one line)
result_vec <- ifelse(temps < 50, "Cold", ifelse(temps <= 75, "Mild", "Hot"))

cat("Loop:  ", result_loop, "\n")
cat("ifelse:", result_vec, "\n")
cat("Match:", identical(result_loop, result_vec), "\n")
```

**Key concept:** `ifelse()` does in one line what the loop does in 5. For element-wise conditions on vectors, `ifelse()` is the R way.

</details>

## Medium (5-8): Loops

### Exercise 5: Multiplication Table

Print a formatted 10x10 multiplication table using nested for loops.

```r
# Exercise 5: 10x10 multiplication table

```

<details>
<summary>Click to reveal solution</summary>

```r
# Header
cat("    ")
for (j in 1:10) cat(sprintf("%4d", j))
cat("\n")
cat("    ", paste(rep("----", 10), collapse = ""), "\n")

# Table
for (i in 1:10) {
  cat(sprintf("%2d |", i))
  for (j in 1:10) {
    cat(sprintf("%4d", i * j))
  }
  cat("\n")
}
```

</details>

### Exercise 6: Collatz Sequence

The Collatz conjecture: start with any positive integer n. If even, divide by 2. If odd, multiply by 3 and add 1. Repeat until you reach 1. Generate the sequence for n=27 and count the steps.

```r
# Exercise 6: Collatz sequence for n=27

```

<details>
<summary>Click to reveal solution</summary>

```r
collatz <- function(n) {
  sequence <- n
  steps <- 0
  while (n != 1) {
    if (n %% 2 == 0) {
      n <- n / 2
    } else {
      n <- 3 * n + 1
    }
    sequence <- c(sequence, n)
    steps <- steps + 1
  }
  list(sequence = sequence, steps = steps, max = max(sequence))
}

result <- collatz(27)
cat("Starting number: 27\n")
cat("Steps to reach 1:", result$steps, "\n")
cat("Maximum value reached:", result$max, "\n")
cat("First 20 values:", head(result$sequence, 20), "...\n")

# Try several starting values
for (start in c(7, 27, 100, 871)) {
  r <- collatz(start)
  cat(sprintf("n=%d: %d steps, max=%d\n", start, r$steps, r$max))
}
```

**Key concept:** `while` loops are perfect when you don't know how many iterations are needed. The Collatz sequence for 27 takes 111 steps and reaches a maximum of 9232.

</details>

### Exercise 7: break and next

Process a vector of mixed data. Skip negative values (use `next`), stop if you encounter NA (use `break`), and accumulate the running total.

```r
# Exercise 7: Process data with break and next
data <- c(10, 25, -5, 30, 15, -8, 42, NA, 20, 35)

# Skip negatives, stop at NA, accumulate running total

```

<details>
<summary>Click to reveal solution</summary>

```r
data <- c(10, 25, -5, 30, 15, -8, 42, NA, 20, 35)
total <- 0
processed <- 0

for (i in seq_along(data)) {
  val <- data[i]

  # Stop at NA
  if (is.na(val)) {
    cat("  Position", i, ": NA found — stopping\n")
    break
  }

  # Skip negatives
  if (val < 0) {
    cat("  Position", i, ": skipping negative (", val, ")\n")
    next
  }

  # Process
  total <- total + val
  processed <- processed + 1
  cat("  Position", i, ": added", val, "→ total =", total, "\n")
}

cat("\nProcessed:", processed, "values\n")
cat("Skipped:", sum(data[1:(i-1)] < 0, na.rm = TRUE), "negatives\n")
cat("Running total:", total, "\n")
```

**Key concept:** `next` skips to the next iteration. `break` exits the loop entirely. Together they control complex loop logic.

</details>

### Exercise 8: Pattern Matching with switch

Write a calculator function that uses `switch()` to perform operations. Support: add, subtract, multiply, divide, power, and modulo.

```r
# Exercise 8: Calculator with switch()
# calc(10, 3, "add") → 13
# calc(10, 3, "power") → 1000

```

<details>
<summary>Click to reveal solution</summary>

```r
calc <- function(a, b, op) {
  result <- switch(op,
    "add" = a + b,
    "subtract" = a - b,
    "multiply" = a * b,
    "divide" = if (b != 0) a / b else NA,
    "power" = a ^ b,
    "modulo" = a %% b,
    stop(paste("Unknown operation:", op))
  )
  cat(sprintf("%g %s %g = %g\n", a, op, b, result))
  invisible(result)
}

calc(10, 3, "add")
calc(10, 3, "subtract")
calc(10, 3, "multiply")
calc(10, 3, "divide")
calc(10, 3, "power")
calc(10, 3, "modulo")
```

**Key concept:** `switch()` maps a string value to different expressions. The last unnamed argument is the default (here we use `stop()` for unknown operations).

</details>

## Hard (9-12): Combined Challenges

### Exercise 9: Binary Search

Implement binary search: given a sorted vector, find the position of a target value using a while loop. Return -1 if not found.

```r
# Exercise 9: Binary search
# Search for 73 in a sorted vector

```

<details>
<summary>Click to reveal solution</summary>

```r
binary_search <- function(vec, target) {
  low <- 1
  high <- length(vec)
  steps <- 0

  while (low <= high) {
    steps <- steps + 1
    mid <- floor((low + high) / 2)

    if (vec[mid] == target) {
      return(list(position = mid, steps = steps, found = TRUE))
    } else if (vec[mid] < target) {
      low <- mid + 1
    } else {
      high <- mid - 1
    }
  }

  return(list(position = -1, steps = steps, found = FALSE))
}

# Test
sorted_vec <- sort(sample(1:100, 20))
cat("Vector:", sorted_vec, "\n\n")

for (target in c(sorted_vec[5], sorted_vec[15], 999)) {
  result <- binary_search(sorted_vec, target)
  if (result$found) {
    cat(sprintf("Found %d at position %d in %d steps\n",
        target, result$position, result$steps))
  } else {
    cat(sprintf("%d not found (searched %d steps)\n", target, result$steps))
  }
}

cat("\nBinary search: log2(", length(sorted_vec), ") ≈",
    ceiling(log2(length(sorted_vec))), "max steps\n")
```

**Key concept:** Binary search halves the search space each step — O(log n) vs O(n) for linear search. A while loop is the natural choice since the number of steps depends on where the target is.

</details>

### Exercise 10: Monte Carlo Pi Estimation

Estimate pi by randomly throwing "darts" at a unit square and counting how many land inside the inscribed circle. Use a for loop with increasing sample sizes to show convergence.

```r
# Exercise 10: Estimate pi with Monte Carlo simulation

```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(42)
estimate_pi <- function(n) {
  x <- runif(n, -1, 1)
  y <- runif(n, -1, 1)
  inside <- sum(x^2 + y^2 <= 1)
  return(4 * inside / n)
}

# Show convergence
sample_sizes <- c(100, 1000, 10000, 100000, 1000000)
cat("Convergence to pi:\n")
for (n in sample_sizes) {
  est <- estimate_pi(n)
  error <- abs(est - pi)
  cat(sprintf("  n=%7d: pi ≈ %.6f (error: %.6f)\n", n, est, error))
}

cat("\nActual pi:", pi, "\n")

# Visualize (small sample)
set.seed(42)
n <- 1000
x <- runif(n, -1, 1)
y <- runif(n, -1, 1)
inside <- x^2 + y^2 <= 1
colors <- ifelse(inside, "steelblue", "tomato")
plot(x, y, col = colors, pch = 16, cex = 0.5, asp = 1,
     main = paste("Monte Carlo Pi (n=1000):", round(4*sum(inside)/n, 4)))
```

**Key concept:** The ratio of darts inside the circle to total darts approximates pi/4. More darts = better estimate. This shows how for loops and random simulation work together.

</details>

### Exercise 11: Text Pattern Generator

Generate these patterns using nested loops:

```
Pattern 1:    Pattern 2:    Pattern 3:
*             *****         1
**            ****          22
***           ***           333
****          **            4444
*****         *             55555
```

```r
# Exercise 11: Generate all three patterns
# Use nested for loops

```

<details>
<summary>Click to reveal solution</summary>

```r
cat("Pattern 1 (triangle):\n")
for (i in 1:5) {
  cat(paste(rep("*", i), collapse = ""), "\n")
}

cat("\nPattern 2 (inverted):\n")
for (i in 5:1) {
  cat(paste(rep("*", i), collapse = ""), "\n")
}

cat("\nPattern 3 (numbers):\n")
for (i in 1:5) {
  cat(paste(rep(i, i), collapse = ""), "\n")
}

# Bonus: Diamond
cat("\nBonus - Diamond:\n")
n <- 5
for (i in 1:n) {
  cat(paste0(paste(rep(" ", n - i), collapse = ""),
             paste(rep("*", 2*i - 1), collapse = ""), "\n"))
}
for (i in (n-1):1) {
  cat(paste0(paste(rep(" ", n - i), collapse = ""),
             paste(rep("*", 2*i - 1), collapse = ""), "\n"))
}
```

**Key concept:** `rep("*", n)` creates n asterisks, `paste(collapse="")` joins them. Nested loops handle rows and columns independently.

</details>

### Exercise 12: Game Simulation

Simulate a dice game: roll two dice. If the sum is 7 or 11 on the first roll, you win. If it's 2, 3, or 12, you lose. Otherwise, the sum becomes your "point" — keep rolling until you hit your point (win) or roll a 7 (lose). Simulate 10,000 games and find the win percentage.

```r
# Exercise 12: Craps dice game simulation

```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(42)

play_craps <- function() {
  roll <- function() sum(sample(1:6, 2, replace = TRUE))

  first <- roll()
  if (first %in% c(7, 11)) return("win")
  if (first %in% c(2, 3, 12)) return("lose")

  # Establish point
 point <- first
  while (TRUE) {
    next_roll <- roll()
    if (next_roll == point) return("win")
    if (next_roll == 7) return("lose")
  }
}

# Simulate 10,000 games
n_games <- 10000
results <- replicate(n_games, play_craps())

wins <- sum(results == "win")
cat("=== Craps Simulation (", n_games, "games) ===\n")
cat("Wins:", wins, "\n")
cat("Losses:", n_games - wins, "\n")
cat("Win rate:", round(wins / n_games * 100, 2), "%\n")
cat("Theoretical:", round(244/495 * 100, 2), "%\n")
```

**Key concept:** This combines if/else (first roll logic), while loop (point phase), and `replicate()` for running the simulation many times. The theoretical win probability in craps is 244/495 ≈ 49.29%.

</details>

## Summary: Skills Practiced

| Exercises | Control Flow Skills |
|-----------|-------------------|
| 1-4 (Easy) | if/else, `ifelse()`, function writing, vectorized vs loop |
| 5-8 (Medium) | Nested loops, while loops, break/next, `switch()` |
| 9-12 (Hard) | Binary search, Monte Carlo, pattern generation, game simulation |

## What's Next?

More exercise sets:

1. **R Functions Exercises** — write, debug, and optimize functions
2. **R String Exercises** — text manipulation with stringr
3. **R apply Family Exercises** — master apply, lapply, sapply

Or continue learning: **Writing R Functions** tutorial.
