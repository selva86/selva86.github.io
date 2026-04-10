---
title: "R Control Flow: if/else, for, while — Stop Avoiding Loops"
slug: "R-Control-Flow"
description: "Master R control flow — if/else branching, for loops, while loops, and when vectorization beats them. Interactive examples with the patterns that actually work."
keywords: "R control flow, if else in R, for loop R, while loop R, R branching, ifelse() vectorized, R iteration"
mathjax: false
webr: true
date: "2026-04-05"
curriculum_id: "1.1.9"
post_type: "C"
auto_link_terms: "R control flow|for loop in R|if else in R|while loop in R"
auto_link_case_sensitive: false
sidebar_section: "Learn R"
sidebar_title: "R Control Flow"
sidebar_order: 9
---


# R Control Flow: if/else, for, while — Stop Avoiding Loops

<p class="lead">R control flow has three building blocks: <code>if/else</code> for branching, <code>for</code> for known-length iteration, and <code>while</code> for condition-based iteration. Knowing when to reach for each — and when to skip them entirely with vectorization — is a defining R skill.</p>

## Introduction

R's reputation for "slow loops" has caused a strange overreaction: some R users avoid loops entirely, even when loops are the right tool. The truth is simpler — loops are fine when iterations depend on each other; vectorization is fine when they don't.

This tutorial teaches the three control-flow constructs, the vectorized `ifelse()` alternative, and how to decide which to use. Every block is interactive — click **Run** to experiment.

By the end you'll write loops when they're appropriate, vectorize when that's faster, and never feel guilty about either choice.

## How do you branch with if/else in R?

Use `if/else` to run different code based on a condition. The condition must be a **single** logical value (length 1).

```r
x <- 15

if (x > 10) {
  print("large")
} else {
  print("small")
}
#> [1] "large"
```

Simple branching. The condition goes in parentheses, the body in braces. If the condition is `TRUE`, the first block runs; otherwise the `else` block runs.

For multiple conditions, chain with `else if`:

```r
score <- 78

if (score >= 90) {
  grade <- "A"
} else if (score >= 80) {
  grade <- "B"
} else if (score >= 70) {
  grade <- "C"
} else {
  grade <- "F"
}
grade
#> [1] "C"
```

R checks conditions in order, stopping at the first `TRUE`. This pattern is readable for 3-5 branches. Beyond that, consider `switch()` or a lookup table.

[WARNING]
**`if()` works on a single logical value, NOT a vector.** `if (c(TRUE, FALSE)) ...` throws an error. Use `ifelse()` (below) when you need vectorized branching.

For vectorized branching, use `ifelse()` — it works element-by-element on vectors:

```r
scores <- c(85, 62, 91, 45, 78)

# Element-wise if/else
ifelse(scores >= 70, "pass", "fail")
#> [1] "pass" "fail" "pass" "fail" "pass"

# Nested for multiple conditions
grades <- ifelse(scores >= 90, "A",
         ifelse(scores >= 80, "B",
         ifelse(scores >= 70, "C", "F")))
grades
#> [1] "B" "F" "A" "F" "C"
```

`ifelse()` returns a vector the same length as its input. This is R's idiomatic way to turn a numeric vector into a categorical one.

## How do you loop over a known set of items with `for`?

A `for` loop iterates over a vector or list, running the body once per element.

```r
# Basic for loop
for (i in 1:5) {
  cat("Iteration", i, "\n")
}
#> Iteration 1
#> Iteration 2
#> Iteration 3
#> Iteration 4
#> Iteration 5

# Iterate over vector elements
fruits <- c("apple", "banana", "cherry")
for (fruit in fruits) {
  cat(fruit, "has", nchar(fruit), "letters\n")
}
#> apple has 5 letters
#> banana has 6 letters
#> cherry has 6 letters
```

`for (var in sequence)` assigns each element of `sequence` to `var` in turn. The body runs once per assignment.

When you need the index too, use `seq_along()`:

```r
fruits <- c("apple", "banana", "cherry")
for (i in seq_along(fruits)) {
  cat(i, ":", fruits[i], "\n")
}
#> 1 : apple
#> 2 : banana
#> 3 : cherry
```

`seq_along(x)` returns `1:length(x)` but handles the empty-vector edge case correctly. Prefer it over `1:length(x)`.

[TIP]
**Always use `seq_along(x)` or `seq_len(n)` instead of `1:length(x)`.** When `x` is empty, `1:length(x)` becomes `1:0` = `c(1, 0)`, which iterates backward and causes bugs. `seq_along(c())` correctly returns an empty sequence.

## When should you use a for loop vs vectorization?

![When to Use Loop vs Vectorization](screenshots/R-Control-Flow-decision.webp)
*Figure 1: Use vectorization when iterations are independent. Use loops when they depend on each other.*

The decision is simple: **if iterations are independent, vectorize. If each iteration depends on previous results, use a loop.**

Example — independent (vectorize):
```r
# Bad: loop for independent operation
x <- c(1, 2, 3, 4, 5)
result <- numeric(length(x))
for (i in seq_along(x)) {
  result[i] <- x[i] * 2
}
result
#> [1]  2  4  6  8 10

# Good: vectorized
result <- x * 2
result
#> [1]  2  4  6  8 10
```

Example — dependent (loop):
```r
# Each Fibonacci number depends on previous two
fib <- numeric(10)
fib[1] <- 1
fib[2] <- 1
for (i in 3:10) {
  fib[i] <- fib[i-1] + fib[i-2]
}
fib
#>  [1]  1  1  2  3  5  8 13 21 34 55
```

You can't vectorize Fibonacci because each value needs the previous two. Loop is the right tool.

## How do you loop while a condition is true with `while`?

Use `while` when you don't know how many iterations you'll need — stopping depends on a condition.

```r
# Halving until below a threshold
x <- 100
steps <- 0
while (x > 1) {
  x <- x / 2
  steps <- steps + 1
}
cat("Steps:", steps, " Final x:", x, "\n")
#> Steps: 7  Final x: 0.78125
```

The loop checks `x > 1` before each iteration. When the condition becomes `FALSE`, the loop exits. Useful for convergence algorithms, retries, and simulations.

[WARNING]
**Always include a guaranteed exit in while loops.** If the condition never becomes `FALSE`, R loops forever. Use `break` or a max-iteration counter as a safety net.

## How do you exit loops early with break and next?

`break` exits the loop immediately. `next` skips to the next iteration.

```r
# break: stop at first match
for (i in 1:100) {
  if (i * i > 50) {
    cat("First square over 50 is", i * i, "\n")
    break
  }
}
#> First square over 50 is 64

# next: skip even numbers
for (i in 1:10) {
  if (i %% 2 == 0) next
  cat(i, " ")
}
#> 1  3  5  7  9
```

`break` jumps out of the loop entirely. `next` skips the remaining body and goes to the next iteration. Together they give you fine-grained loop control.

## Common Mistakes and How to Fix Them

### Mistake 1: Using `if()` with a vector

❌ **Wrong:**
```r
my_x <- c(5, 10, 15)
if (my_x > 7) {
  print("big")
}
#> Error in if (my_x > 7) { : the condition has length > 1
```

**Why it is wrong:** `if()` needs a single TRUE/FALSE. `my_x > 7` returns `c(FALSE, TRUE, TRUE)` — length 3.

✅ **Correct:**
```r
my_x <- c(5, 10, 15)
my_label <- ifelse(my_x > 7, "big", "small")
my_label
#> [1] "small" "big"   "big"
```

### Mistake 2: `1:length(x)` on empty vectors

❌ **Wrong:**
```r
my_empty <- c()
for (i in 1:length(my_empty)) {
  print(i)
}
#> [1] 1
#> [1] 0
```

**Why it is wrong:** `length(c()) == 0`, so `1:0 == c(1, 0)`, iterating backward.

✅ **Correct:**
```r
my_empty <- c()
for (i in seq_along(my_empty)) {
  print(i)
}
# (no output — seq_along returns empty sequence)
```

### Mistake 3: Growing a vector inside a loop

❌ **Wrong:**
```r
my_result <- c()
for (i in 1:1000) {
  my_result <- c(my_result, i * 2)  # reallocates every iteration
}
```

**Why it is wrong:** `c()` copies the entire vector each iteration. For large N, this is O(n²) slow.

✅ **Correct:**
```r
my_result <- numeric(1000)
for (i in 1:1000) {
  my_result[i] <- i * 2
}
# Or better: vectorize
my_result <- (1:1000) * 2
```

### Mistake 4: `if()` with NA condition

❌ **Wrong:**
```r
my_val <- NA
if (my_val > 5) print("big")
#> Error in if (my_val > 5) print("big") : missing value where TRUE/FALSE needed
```

**Why it is wrong:** `NA > 5` is `NA`, and `if()` can't branch on `NA`.

✅ **Correct:**
```r
my_val <- NA
if (!is.na(my_val) && my_val > 5) print("big")
# (no output — NA handled safely)
```

## Practice Exercises

### Exercise 1: Letter Grade with if/else

Write an if/else chain that assigns a letter grade to `my_score`.

```r
my_score <- 84

# Exercise: assign "A" (>=90), "B" (>=80), "C" (>=70), else "F"

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_score <- 84
if (my_score >= 90) {
  my_grade <- "A"
} else if (my_score >= 80) {
  my_grade <- "B"
} else if (my_score >= 70) {
  my_grade <- "C"
} else {
  my_grade <- "F"
}
my_grade
#> [1] "B"
```

</details>

### Exercise 2: Vectorized Grading

Do the same grading for a whole vector of scores using nested `ifelse()`.

```r
my_scores <- c(95, 72, 88, 60, 55)

# Exercise: vectorized grading

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_scores <- c(95, 72, 88, 60, 55)
my_grades <- ifelse(my_scores >= 90, "A",
             ifelse(my_scores >= 80, "B",
             ifelse(my_scores >= 70, "C", "F")))
my_grades
#> [1] "A" "C" "B" "F" "F"
```

</details>

### Exercise 3: Cumulative Sum with a Loop

Compute the running total of `my_values`, storing in `my_cumulative`. Each element is the sum up to that index.

```r
my_values <- c(10, 20, 30, 40, 50)

# Exercise: running total with for loop

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_values <- c(10, 20, 30, 40, 50)
my_cumulative <- numeric(length(my_values))
my_cumulative[1] <- my_values[1]
for (i in 2:length(my_values)) {
  my_cumulative[i] <- my_cumulative[i-1] + my_values[i]
}
my_cumulative
#> [1]  10  30  60 100 150

# R's built-in for comparison:
cumsum(my_values)
#> [1]  10  30  60 100 150
```

**Explanation:** Each iteration depends on the previous — a real loop use case. R's `cumsum()` does this internally.

</details>

### Exercise 4: While Loop for Convergence

Starting at 1, keep doubling until you exceed 1000. Count how many doublings.

```r
# Exercise: double until > 1000, count steps

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_x <- 1
my_steps <- 0
while (my_x <= 1000) {
  my_x <- my_x * 2
  my_steps <- my_steps + 1
}
cat("Final:", my_x, "after", my_steps, "steps\n")
#> Final: 1024 after 10 steps
```

</details>

### Exercise 5: Filter with break

Loop through `1:100` and return the first number divisible by BOTH 7 and 13. Use `break`.

```r
# Exercise: first number divisible by 7 and 13 in 1:100

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_found <- NA
for (i in 1:100) {
  if (i %% 7 == 0 & i %% 13 == 0) {
    my_found <- i
    break
  }
}
my_found
#> [1] 91
```

**Explanation:** `%%` is modulo. `break` exits the loop the moment we find the answer, avoiding wasted iterations.

</details>

## Complete Example: Simulating a Coin Flip Game

A while loop with a stopping condition, tracking the result.

```r
# --- Flip coins until 3 heads in a row ---
set.seed(42)

flips <- character(0)   # growing log (short game, so OK)
consecutive_heads <- 0

while (consecutive_heads < 3) {
  result <- sample(c("H", "T"), 1)
  flips <- c(flips, result)

  if (result == "H") {
    consecutive_heads <- consecutive_heads + 1
  } else {
    consecutive_heads <- 0
  }
}

cat("Flips:", paste(flips, collapse = " "), "\n")
cat("Total flips needed:", length(flips), "\n")
#> Flips: H H T H T T H T H T T T H H H
#> Total flips needed: 15
```

A while loop is the right tool here — we don't know in advance how many flips we'll need. Each iteration updates `consecutive_heads`, and the loop exits when it reaches 3. The random seed makes it reproducible.

## Summary

| Construct | Syntax | When to use |
|---|---|---|
| `if/else` | `if (cond) {...} else {...}` | Single condition, scalar result |
| `ifelse()` | `ifelse(vec_cond, yes, no)` | Vectorized branching |
| `for` | `for (x in seq) {...}` | Known iterations, dependent results |
| `while` | `while (cond) {...}` | Condition-based, unknown iterations |
| `break` | `break` (inside loop) | Exit loop early |
| `next` | `next` (inside loop) | Skip to next iteration |
| `switch()` | `switch(x, "a"=1, "b"=2)` | Many-way branching on a value |
| `seq_along()` | `seq_along(x)` | Safe index iteration |

## FAQ

### Is `ifelse()` always faster than a loop?

For vectorized conditions, yes — `ifelse()` uses compiled C internals. For scalar conditions, use `if/else` because `ifelse()` has overhead.

### What's the difference between `&` and `&&`?

`&` is vectorized (element-wise). `&&` is scalar (short-circuit). Use `&` on vectors, `&&` inside `if()`. Same for `|` vs `||`.

### When should I use `switch()`?

When branching on a single value with 3+ options. Cleaner than nested if/else: `switch(key, "a" = 1, "b" = 2, "c" = 3)`.

### How do I iterate over both index and value?

Use `seq_along(x)` and index into x: `for (i in seq_along(x)) { ... x[i] ... }`. Or use `purrr::imap()` for a named-list pattern.

### Why are R loops slow?

They're not. The myth comes from two factors: (1) growing a vector with `c()` inside the loop is O(n²), (2) R's interpreter is slower than compiled C. Pre-allocate, and loops are fine for most work.

## References

1. R Core Team — *An Introduction to R*, Chapter 9 (Grouping, loops and conditional execution). [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html)
2. Wickham, H. — *Advanced R*, 2nd Edition, Chapter 5 (Control flow). [Link](https://adv-r.hadley.nz/control-flow.html)
3. R manual — `Control` reference. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/Control.html)
4. R manual — `ifelse()` reference. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/ifelse.html)
5. R manual — `seq_along()` and `seq_len()`. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/seq.html)
6. Wickham, H. & Grolemund, G. — *R for Data Science*, 2nd Edition, Chapter 27 (A field guide to base R). [Link](https://r4ds.hadley.nz/base-R.html)
7. Burns, P. — *The R Inferno*, Circle 2 (Growing objects). [Link](https://www.burns-stat.com/pages/Tutor/R_inferno.pdf)

## Continue Learning

- **[Writing R Functions](R-Functions.html)** — package control-flow patterns into reusable functions.
- **[Functional Programming in R](Functional-Programming-in-R.html)** — map, filter, reduce — the higher-level alternative to loops.
- **[purrr map() Variants](purrr-map-Variants.html)** — the tidyverse way to iterate without writing explicit loops.
