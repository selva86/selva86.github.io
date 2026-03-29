---
title: "R Control Flow: if/else, for, and while — Stop Avoiding Loops"
slug: "R-Control-Flow"
description: "Master R's if/else, for loops, while loops, and vectorized alternatives. Real examples, common patterns, and when loops are actually the right choice."
keywords: "R if else, R for loop, R while loop, R control flow, R ifelse, R switch, R loop examples"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "1.1.9"
post_type: "C"
auto_link_terms: "R if else|R for loop|R while loop|R control flow"
auto_link_case_sensitive: false
sidebar_section: "Learn R"
sidebar_title: "R Control Flow"
sidebar_order: 9
---

# R Control Flow: if/else, for, and while — Stop Avoiding Loops

<p class="lead">Control flow lets your code make decisions and repeat actions. R provides if/else for branching, for/while for looping, and vectorized alternatives like ifelse() and sapply() that often replace loops entirely.</p>

You'll hear people say "never use loops in R." That's an oversimplification. Loops are perfectly fine — R just gives you powerful alternatives that are often cleaner. This tutorial teaches you all the control flow tools, when to use each one, and when a vectorized solution is genuinely better.

## Introduction

**Control flow** determines which code runs and how many times. Without it, code runs top to bottom, one line at a time. Control flow adds two capabilities:

1. **Choices** — run different code depending on a condition (if/else)
2. **Repetition** — run the same code multiple times (for, while)

Here's what we'll cover:

- `if`, `else if`, `else` — make decisions
- `ifelse()` — vectorized decisions (apply to whole vectors)
- `switch()` — choose from multiple options
- `for` — repeat a known number of times
- `while` — repeat until a condition changes
- `next` and `break` — control loop flow
- When to use loops vs vectorized solutions

## if / else: Making Decisions

The `if` statement runs code only when a condition is TRUE:

```r
temperature <- 35

if (temperature > 30) {
  cat("It's hot! Stay hydrated.\n")
}

if (temperature < 0) {
  cat("It's freezing!\n")
}

cat("Temperature check complete.\n")
```

The second `if` block doesn't run because 35 is not less than 0. The code after the `if` blocks always runs.

### if / else

When you want to do one thing OR another:

```r
score <- 78

if (score >= 80) {
  grade <- "Pass with distinction"
} else {
  grade <- "Pass"
}

cat("Score:", score, "→", grade, "\n")
```

### if / else if / else

For multiple conditions, chain them with `else if`:

```r
score <- 85

if (score >= 90) {
  grade <- "A"
} else if (score >= 80) {
  grade <- "B"
} else if (score >= 70) {
  grade <- "C"
} else if (score >= 60) {
  grade <- "D"
} else {
  grade <- "F"
}

cat("Score:", score, "→ Grade:", grade, "\n")
```

R checks conditions top to bottom and stops at the first TRUE condition. Order matters — put the most specific conditions first.

### Common if/else patterns

```r
# Pattern 1: Assign based on condition
x <- -5
result <- if (x >= 0) "positive" else "negative"
cat("x is", result, "\n")

# Pattern 2: Check before doing something risky
data_file <- "mydata.csv"
if (file.exists(data_file)) {
  cat("File found! Reading...\n")
} else {
  cat("File not found:", data_file, "\n")
}

# Pattern 3: Validate input
value <- "42"
if (is.numeric(value)) {
  cat("Doubling:", value * 2, "\n")
} else {
  cat("Not a number! Converting...\n")
  value <- as.numeric(value)
  cat("Doubled:", value * 2, "\n")
}
```

> **Important:** The condition inside `if()` must be a single TRUE or FALSE value, not a vector. If you pass a vector, R uses only the first element and warns you. For vectorized conditions, use `ifelse()` (covered next).

## ifelse(): Vectorized Decisions

`ifelse()` applies a condition to every element of a vector — no loop needed:

```r
scores <- c(88, 72, 95, 61, 83, 77, 90)

# Vectorized: applies to ALL elements at once
results <- ifelse(scores >= 80, "Pass", "Fail")
cat("Scores:", scores, "\n")
cat("Results:", results, "\n")
cat("Pass rate:", mean(scores >= 80) * 100, "%\n")
```

Compare this to a loop version:

```r
# Loop version (works but verbose)
scores <- c(88, 72, 95, 61, 83)
results_loop <- character(length(scores))
for (i in seq_along(scores)) {
  if (scores[i] >= 80) {
    results_loop[i] <- "Pass"
  } else {
    results_loop[i] <- "Fail"
  }
}
cat("Loop result:", results_loop, "\n")

# ifelse version (one line!)
results_vec <- ifelse(scores >= 80, "Pass", "Fail")
cat("ifelse result:", results_vec, "\n")
```

`ifelse()` is cleaner and faster. Use it whenever you're applying a condition to a vector.

### Nested ifelse for multiple conditions

```r
scores <- c(95, 85, 72, 60, 45)

grades <- ifelse(scores >= 90, "A",
          ifelse(scores >= 80, "B",
          ifelse(scores >= 70, "C",
          ifelse(scores >= 60, "D", "F"))))

cat("Scores:", scores, "\n")
cat("Grades:", grades, "\n")
```

Nested `ifelse()` gets hard to read. For many conditions, consider `dplyr::case_when()` instead:

```r
library(dplyr)

scores <- c(95, 85, 72, 60, 45)

grades <- case_when(
  scores >= 90 ~ "A",
  scores >= 80 ~ "B",
  scores >= 70 ~ "C",
  scores >= 60 ~ "D",
  TRUE ~ "F"    # default
)

cat("Grades:", grades, "\n")
```

Much more readable. `case_when()` is the modern R way to handle multiple vectorized conditions.

## switch(): Choose from Named Options

`switch()` picks one option based on a string value — cleaner than long if/else chains:

```r
# Calculate based on operation type
calculate <- function(x, y, operation) {
  result <- switch(operation,
    "add" = x + y,
    "subtract" = x - y,
    "multiply" = x * y,
    "divide" = x / y,
    stop(paste("Unknown operation:", operation))
  )
  return(result)
}

cat("10 + 3 =", calculate(10, 3, "add"), "\n")
cat("10 - 3 =", calculate(10, 3, "subtract"), "\n")
cat("10 * 3 =", calculate(10, 3, "multiply"), "\n")
cat("10 / 3 =", round(calculate(10, 3, "divide"), 2), "\n")
```

`switch()` is especially useful in functions where an argument selects a method or mode.

## for Loops: Repeat a Known Number of Times

A `for` loop iterates over each element in a sequence:

```r
# Basic for loop
for (i in 1:5) {
  cat("Iteration", i, "\n")
}
```

### Looping over vectors

```r
# Loop over values directly
fruits <- c("apple", "banana", "cherry")
for (fruit in fruits) {
  cat("I like", fruit, "\n")
}

# Loop over indices (when you need the position)
scores <- c(88, 72, 95, 61, 83)
for (i in seq_along(scores)) {
  status <- if (scores[i] >= 80) "PASS" else "FAIL"
  cat(sprintf("Student %d: %d (%s)\n", i, scores[i], status))
}
```

> **Tip:** Use `seq_along(x)` instead of `1:length(x)`. If `x` is empty, `1:length(x)` gives `c(1, 0)` which causes bugs. `seq_along(x)` correctly gives an empty sequence.

### Building results in a loop

```r
# Pre-allocate the result vector (important for performance!)
n <- 10
squares <- numeric(n)  # Pre-allocate

for (i in 1:n) {
  squares[i] <- i^2
}

cat("Squares:", squares, "\n")
```

**Critical:** Always pre-allocate your result vector with `numeric(n)`, `character(n)`, etc. Growing a vector inside a loop (`result <- c(result, new_value)`) is extremely slow in R because it copies the entire vector each time.

### Nested loops

```r
# Multiplication table
cat("Multiplication table (1-5):\n")
for (i in 1:5) {
  for (j in 1:5) {
    cat(sprintf("%3d", i * j))
  }
  cat("\n")
}
```

### Looping over data frame rows

```r
df <- data.frame(
  name = c("Alice", "Bob", "Carol"),
  score = c(92, 78, 85)
)

for (i in 1:nrow(df)) {
  cat(sprintf("%s scored %d — %s\n",
    df$name[i], df$score[i],
    if (df$score[i] >= 80) "Pass" else "Fail"))
}
```

### Storing results in a list

When each iteration produces a complex result (not just a single value), use a list:

```r
# Simulate 5 random datasets and store summaries
set.seed(42)
results <- list()

for (i in 1:5) {
  data <- rnorm(100, mean = i * 10, sd = 5)
  results[[i]] <- list(
    mean = round(mean(data), 2),
    sd = round(sd(data), 2),
    n = length(data)
  )
}

# Access results
for (i in seq_along(results)) {
  cat(sprintf("Run %d: mean=%.2f, sd=%.2f, n=%d\n",
    i, results[[i]]$mean, results[[i]]$sd, results[[i]]$n))
}
```

## while Loops: Repeat Until a Condition Changes

A `while` loop keeps running as long as a condition is TRUE:

```r
# Count up to a target
count <- 1
while (count <= 5) {
  cat("Count:", count, "\n")
  count <- count + 1  # Don't forget this! Otherwise infinite loop
}
cat("Done! Final count:", count, "\n")
```

**Warning:** Always make sure the condition will eventually become FALSE. A `while(TRUE)` without a `break` creates an infinite loop that locks up your R session.

### Real use case: iterative convergence

```r
# Newton's method to find square root of 25
target <- 25
guess <- 1
tolerance <- 0.0001
iterations <- 0

while (abs(guess^2 - target) > tolerance) {
  guess <- (guess + target / guess) / 2
  iterations <- iterations + 1
  cat(sprintf("Iteration %d: guess = %.6f\n", iterations, guess))
}

cat("\nSquare root of", target, "≈", guess, "(in", iterations, "iterations)\n")
```

`while` loops are best for situations where you don't know in advance how many iterations you need.

## break and next: Loop Control

### break — exit the loop early

```r
# Search for a value
data <- c(23, 45, 12, 67, 34, 89, 56)
target <- 67

for (i in seq_along(data)) {
  if (data[i] == target) {
    cat("Found", target, "at position", i, "\n")
    break  # Stop the loop immediately
  }
  cat("Checking position", i, ":", data[i], "\n")
}
```

### next — skip to the next iteration

```r
# Process only even numbers
for (i in 1:10) {
  if (i %% 2 != 0) {
    next  # Skip odd numbers
  }
  cat("Processing even number:", i, "\n")
}
```

## Loops vs Vectorized: When to Use Which

R's vectorized operations are usually better than loops for element-wise operations. Here's a decision guide:

| Situation | Use | Why |
|-----------|-----|-----|
| Apply math to a vector | Vectorized (`x * 2`) | Faster, cleaner |
| Filter/subset | Vectorized (`x[x > 0]`) | One line vs many |
| Conditional on each element | `ifelse()` or `case_when()` | Vectorized, readable |
| Apply function to each element | `sapply()`/`lapply()` | Cleaner than loop |
| Iterations depend on previous result | `for`/`while` loop | Can't vectorize |
| Side effects (print, write files) | `for` loop | Clear intent |
| Complex multi-step per iteration | `for` loop | Easier to debug |
| Unknown number of iterations | `while` loop | Convergence, search |

```r
# Example: These two do the same thing
x <- 1:1000000

# Vectorized (fast — ~0.001 sec)
system.time(result1 <- x^2 + 2*x + 1)

# Loop (slower — ~0.3 sec)
system.time({
  result2 <- numeric(length(x))
  for (i in seq_along(x)) {
    result2[i] <- x[i]^2 + 2*x[i] + 1
  }
})

cat("Results match:", all.equal(result1, result2), "\n")
```

The vectorized version is typically 100-300x faster for simple math. But for complex logic, a well-written loop is perfectly acceptable.

## Practice Exercises

### Exercise 1: FizzBuzz

```r
# Exercise: Print numbers 1 to 30, but:
# - For multiples of 3, print "Fizz" instead
# - For multiples of 5, print "Buzz" instead
# - For multiples of both 3 and 5, print "FizzBuzz"
# Hint: Use %% (modulo) to check divisibility

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
# Solution
for (i in 1:30) {
  if (i %% 15 == 0) {
    cat("FizzBuzz ")
  } else if (i %% 3 == 0) {
    cat("Fizz ")
  } else if (i %% 5 == 0) {
    cat("Buzz ")
  } else {
    cat(i, "")
  }
}
cat("\n")
```

**Explanation:** Check `%% 15` first (divisible by both 3 and 5) because if you check `%% 3` first, multiples of 15 would hit that condition and never reach the FizzBuzz check. Order matters in if/else chains.

</details>

### Exercise 2: Grade Calculator with case_when

```r
# Exercise: Given these scores and a curve of +5 points:
scores <- c(62, 88, 74, 91, 55, 83, 77, 96, 68, 80)
# 1. Apply the curve (add 5, cap at 100)
# 2. Assign letter grades: A(90+), B(80+), C(70+), D(60+), F(<60)
# 3. Print a summary: count of each grade
# Use: pmin() to cap at 100, case_when() for grades, table() for counts

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
# Solution
library(dplyr)

scores <- c(62, 88, 74, 91, 55, 83, 77, 96, 68, 80)

# Apply curve, cap at 100
curved <- pmin(scores + 5, 100)

# Assign grades
grades <- case_when(
  curved >= 90 ~ "A",
  curved >= 80 ~ "B",
  curved >= 70 ~ "C",
  curved >= 60 ~ "D",
  TRUE ~ "F"
)

# Print results
cat("Original:", scores, "\n")
cat("Curved:  ", curved, "\n")
cat("Grades:  ", grades, "\n\n")

# Summary
cat("Grade distribution:\n")
print(table(grades))
```

**Explanation:** `pmin(scores + 5, 100)` adds 5 to each score and caps at 100 (parallel minimum). `case_when()` vectorizes the grade assignment. `table()` counts occurrences.

</details>

### Exercise 3: Simulation Loop

```r
# Exercise: Simulate a coin-flipping game:
# Start with $100. Flip a coin each round.
# Heads: win $10. Tails: lose $10.
# Stop when you reach $0 (broke) or $200 (win).
# Track and print: number of rounds, final outcome, balance history
# Hint: Use sample(c("H", "T"), 1) for a coin flip

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
# Solution
set.seed(42)  # For reproducibility

balance <- 100
history <- balance
rounds <- 0

while (balance > 0 & balance < 200) {
  flip <- sample(c("H", "T"), 1)
  if (flip == "H") {
    balance <- balance + 10
  } else {
    balance <- balance - 10
  }
  history <- c(history, balance)
  rounds <- rounds + 1
}

outcome <- if (balance >= 200) "WON!" else "BROKE!"
cat("Game over after", rounds, "rounds:", outcome, "\n")
cat("Final balance: $", balance, "\n")
cat("Peak balance: $", max(history), "\n")
cat("Low point: $", min(history), "\n")

# Plot the history
plot(0:(length(history)-1), history, type = "l",
     main = paste("Coin Flip Game —", outcome),
     xlab = "Round", ylab = "Balance ($)",
     col = "steelblue", lwd = 2)
abline(h = c(0, 200), col = "red", lty = 2)
```

**Explanation:** A `while` loop is perfect here — we don't know how many rounds the game will take. `sample(c("H","T"), 1)` simulates a fair coin. The history vector lets us plot the balance over time.

</details>

## Summary

| Tool | Syntax | Use when |
|------|--------|----------|
| `if/else` | `if (cond) {} else {}` | Single condition, one decision |
| `else if` | `else if (cond) {}` | Multiple exclusive conditions |
| `ifelse()` | `ifelse(vec, yes, no)` | Apply condition to whole vector |
| `case_when()` | `case_when(cond ~ val)` | Multiple vectorized conditions |
| `switch()` | `switch(x, "a"=1, "b"=2)` | Choose by string value |
| `for` | `for (i in seq) {}` | Known iterations, side effects |
| `while` | `while (cond) {}` | Unknown iterations, convergence |
| `break` | `break` | Exit loop early |
| `next` | `next` | Skip current iteration |

**Golden rule:** If you're applying the same operation to every element of a vector, try a vectorized solution first. If the logic is complex, iterative, or involves side effects, use a loop.

## FAQ

### Are R loops really that slow?

R loops are slower than vectorized operations for simple math, but they're not slow in absolute terms. A loop over 10,000 iterations takes milliseconds. Loops only become a problem with millions of iterations doing simple operations — and those are exactly the cases where vectorization shines.

### What's the difference between for and while?

`for` loops iterate over a predefined sequence — you know in advance how many times the loop will run. `while` loops keep going until a condition changes — you don't know in advance how many iterations you'll need. Use `for` when you can; use `while` for convergence, searching, or games.

### Can I use for loops with data frames?

Yes. Loop over rows with `for (i in 1:nrow(df))`, or over columns with `for (col in names(df))`. But for most data frame operations, dplyr functions (`filter`, `mutate`, `summarise`) are cleaner than loops.

### What does seq_along() do?

`seq_along(x)` generates the sequence `1, 2, 3, ..., length(x)`. It's safer than `1:length(x)` because when `x` is empty, `1:length(x)` gives `c(1, 0)` (which causes bugs), while `seq_along(x)` correctly gives an empty sequence.

### How do I avoid infinite while loops?

Three safeguards: (1) Make sure the condition can become FALSE — something inside the loop must change the variables in the condition. (2) Add a maximum iteration counter. (3) Use `break` as an escape hatch. When in doubt, start with a `for` loop with a maximum count.

## What's Next?

Now that you can make decisions and repeat actions, you're ready to encapsulate logic into reusable pieces:

1. **Writing R Functions** — create your own functions with arguments, defaults, and return values
2. **R Special Values** — handle NA, NULL, NaN, and Inf properly in your control flow
3. **Getting Help in R** — navigate R's documentation system efficiently

Each tutorial builds on the control flow patterns you've learned here.
