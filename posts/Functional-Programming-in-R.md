---
title: "Functional Programming in R: First-Class Functions & purrr Explained"
slug: "Functional-Programming-in-R"
description: "Master functional programming in R with first-class functions, purrr map/reduce, closures, and function factories. Interactive examples you can run in your browser."
keywords: "functional programming in R, first-class functions R, purrr map, purrr reduce, R closures, function factories R, anonymous functions R, lapply vs map"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "4.2.1"
post_type: "C"
auto_link_terms: "functional programming in R|first-class functions|purrr map"
auto_link_case_sensitive: false
---

R is a functional programming language at its core. Every operation you run — from subsetting a vector to fitting a model — relies on functions. But most R users treat functions as commands to call, not as objects to manipulate. That's the difference between using R and thinking in R.

## Introduction

In most programming languages, functions are special. You define them, you call them, and that's it. R is different. In R, functions are **first-class citizens** — they're regular objects, just like numbers and character strings. You can assign a function to a variable, toss it into a list, pass it as an argument, or return it from another function.

This isn't just a language trivia fact. It's the foundation of a programming style called **functional programming** (FP) that makes your R code shorter, safer, and easier to reason about. Instead of writing loops that mutate variables step by step, you describe *what* to compute by passing functions to other functions.

In this tutorial, you'll learn:

- What "first-class functions" actually means (with proof)
- How closures and function factories work
- How to replace loops with `lapply()`, `sapply()`, and `purrr::map()`
- The complete purrr toolkit — `map`, `map2`, `pmap`, `walk`, `reduce`
- Error handling, function composition, and memoization
- When functional programming helps and when it gets in the way

## Functions Are First-Class Citizens

What does it mean for functions to be "first-class"? It means functions are values. You can do with a function everything you can do with a number or a string.

Let's prove it with five demonstrations:

```r
# 1. Assign a function to a variable
square <- function(x) x^2
square(5)
#> [1] 25

# 2. Store functions in a list
math_ops <- list(
  double = function(x) x * 2,
  halve  = function(x) x / 2,
  negate = function(x) -x
)
math_ops$double(10)
#> [1] 20
math_ops$negate(7)
#> [1] -7
```

```r
# 3. Pass a function as an argument
apply_to_five <- function(f) f(5)

apply_to_five(sqrt)
#> [1] 2.236068

apply_to_five(function(x) x^3)
#> [1] 125
```

```r
# 4. Return a function from a function
make_adder <- function(n) {
  function(x) x + n
}

add_10 <- make_adder(10)
add_10(3)
#> [1] 13
add_10(100)
#> [1] 110

# 5. Functions are objects — they have class and type
class(sqrt)
#> [1] "function"
typeof(mean)
#> [1] "closure"
```

That last line reveals something important: most R functions are **closures**, which means they carry their own environment with them. We'll explore that next.

> **Key insight:** In R, there is no fundamental difference between a function and any other object. Functions can be created anywhere, passed anywhere, and stored in any data structure.

## Anonymous Functions

When you pass a small function as an argument, you often don't need to give it a name. These unnamed functions are called **anonymous functions**, and R has evolved three ways to write them.

```r
numbers <- 1:5

# Style 1: Traditional (verbose)
sapply(numbers, function(x) x^2)
#> [1]  1  4  9 16 25

# Style 2: Lambda shorthand (R 4.1+, recommended)
sapply(numbers, \(x) x^2)
#> [1]  1  4  9 16 25

# Style 3: purrr formula shorthand (inside purrr only)
library(purrr)
map_dbl(numbers, ~ .x^2)
#> [1]  1  4  9 16 25
```

```r
# When to use each style:
# \(x) — preferred everywhere in modern R (clean, universal)
# ~ .x — only works inside purrr functions, convenient for quick transforms
# function(x) — use when you need multiple lines or clarity for beginners

# Multi-line anonymous function
result <- sapply(1:3, \(x) {
  squared <- x^2
  cubed <- x^3
  squared + cubed
})
result
#> [1]  2 12 36
```

Use `\(x)` as your default. It's the modern R standard, works everywhere, and reads cleanly.

## Closures: Functions That Remember

A **closure** is a function that captures variables from the environment where it was created. When `make_adder(10)` returned a function, that function *remembered* that `n` was 10 — even after `make_adder` finished running.

This is closures at work, and they're one of the most powerful ideas in R.

```r
make_counter <- function() {
  count <- 0
  list(
    increment = function() {
      count <<- count + 1
      count
    },
    get = function() count,
    reset = function() {
      count <<- 0
      invisible(NULL)
    }
  )
}

counter <- make_counter()
counter$increment()
#> [1] 1
counter$increment()
#> [1] 2
counter$increment()
#> [1] 3
counter$get()
#> [1] 3
counter$reset()
counter$get()
#> [1] 0
```

The `count` variable lives inside `make_counter()`'s environment. The inner functions (increment, get, reset) are closures that captured that environment. The `<<-` operator modifies `count` in the enclosing scope rather than creating a local copy.

```r
# Closures in practice: creating a family of power functions
make_power <- function(exp) {
  function(x) x^exp
}

square <- make_power(2)
cube <- make_power(3)
fourth <- make_power(4)

sapply(1:5, square)
#> [1]  1  4  9 16 25
sapply(1:5, cube)
#> [1]   1   8  27  64 125
sapply(1:5, fourth)
#> [1]   1  16  81 256 625

# Each function remembers its own `exp` value
environment(square)$exp
#> [1] 2
environment(cube)$exp
#> [1] 3
```

> **When to use closures:** Create closures when you need a family of similar functions that differ by one or two parameters. They're cleaner than copying and pasting code with minor variations.

## Function Factories

A **function factory** is a function whose job is to create other functions. You already saw two examples: `make_adder()` and `make_power()`. Let's look at a more practical one.

```r
# Factory: create formatters for different decimal places
make_formatter <- function(digits) {
  function(x) format(round(x, digits), nsmall = digits)
}

fmt_2 <- make_formatter(2)
fmt_4 <- make_formatter(4)

pi_value <- 3.14159265
fmt_2(pi_value)
#> [1] "3.14"
fmt_4(pi_value)
#> [1] "3.1416"
```

```r
# Factory: create threshold checkers
make_threshold <- function(cutoff, direction = "above") {
  if (direction == "above") {
    function(x) x > cutoff
  } else {
    function(x) x < cutoff
  }
}

is_hot <- make_threshold(30, "above")
is_freezing <- make_threshold(0, "below")

temps <- c(-5, 10, 25, 35, 40)
is_hot(temps)
#> [1] FALSE FALSE FALSE  TRUE  TRUE
is_freezing(temps)
#> [1]  TRUE FALSE FALSE FALSE FALSE
```

Function factories are especially useful in ggplot2. The `scale_*` functions like `scale_x_continuous(labels = scales::comma)` work this way — `scales::comma` is a function factory that returns a formatting function.

## Replacing Loops with Functionals

A **functional** is a function that takes another function as input. The apply family (`lapply`, `sapply`, `vapply`) and purrr's `map()` are functionals. They're R's answer to `for` loops.

Let's solve the same problem three ways and compare:

```r
# Task: compute the mean of each column in mtcars (first 5 columns)
data <- mtcars[, 1:5]

# Way 1: for loop
means_loop <- numeric(ncol(data))
names(means_loop) <- names(data)
for (i in seq_along(data)) {
  means_loop[i] <- mean(data[[i]])
}
means_loop
```

```r
# Way 2: sapply (base R functional)
means_sapply <- sapply(data, mean)
means_sapply
```

```r
# Way 3: purrr::map_dbl (tidyverse functional)
library(purrr)
means_purrr <- map_dbl(data, mean)
means_purrr
```

All three produce identical results. But the functional versions are:
- **Shorter** — one line instead of four
- **Declarative** — they say *what* to compute, not *how* to compute it
- **Safer** — no index variable to accidentally mess up

```r
# Performance comparison
library(purrr)
big_list <- replicate(1000, rnorm(100), simplify = FALSE)

system.time(lapply(big_list, mean))
system.time(map(big_list, mean))
system.time({
  result <- vector("list", length(big_list))
  for (i in seq_along(big_list)) result[[i]] <- mean(big_list[[i]])
})
```

The three approaches have nearly identical speed. Use whichever reads clearest for your situation. Use `lapply()` when you want zero dependencies, `map()` when you want type-safe variants and a consistent API.

## The purrr Toolkit

The purrr package provides a complete, consistent set of functionals. Here's the toolkit organized by what you need to do.

### map() — Apply a Function to Each Element

```r
library(purrr)

# map() always returns a list
map(1:4, \(x) x^2)

# Type-specific variants return vectors
map_dbl(1:4, \(x) x^2)       # double vector
#> [1]  1  4  9 16

map_chr(1:4, \(x) paste("Item", x))  # character vector
#> [1] "Item 1" "Item 2" "Item 3" "Item 4"

map_lgl(1:4, \(x) x > 2)     # logical vector
#> [1] FALSE FALSE  TRUE  TRUE

map_int(1:4, \(x) as.integer(x * 10))  # integer vector
#> [1] 10 20 30 40
```

### map2() and pmap() — Multiple Inputs

```r
# map2: iterate over two vectors in parallel
names <- c("Alice", "Bob", "Charlie")
ages <- c(30, 25, 35)

map2_chr(names, ages, \(n, a) paste(n, "is", a, "years old"))
#> [1] "Alice is 30 years old"   "Bob is 25 years old"     "Charlie is 35 years old"
```

```r
# pmap: iterate over any number of inputs (pass as list)
params <- list(
  n    = c(10, 20, 30),
  mean = c(0, 5, 10),
  sd   = c(1, 2, 3)
)

samples <- pmap(params, \(n, mean, sd) rnorm(n, mean, sd))
map_dbl(samples, mean)  # roughly 0, 5, 10
```

### walk() — Side Effects (No Return Value)

Use `walk()` when you want to do something for each element but don't need a result back — like printing, writing files, or making plots.

```r
# walk: call a function for side effects
filenames <- c("report_Q1.csv", "report_Q2.csv", "report_Q3.csv")
walk(filenames, \(f) cat("Processing:", f, "\n"))
#> Processing: report_Q1.csv
#> Processing: report_Q2.csv
#> Processing: report_Q3.csv
```

### imap() — Indexed Mapping

`imap()` passes both the element and its name (or index) to your function.

```r
# imap: access both value and name/index
scores <- c(math = 92, science = 87, english = 95)

imap_chr(scores, \(score, subject) paste(subject, ":", score, "points"))
#> [1] "math : 92 points"    "science : 87 points" "english : 95 points"
```

### reduce() — Combine Elements

`reduce()` takes a list and collapses it into a single value by repeatedly applying a two-argument function.

```r
# reduce: collapse a list to a single value
reduce(1:5, `+`)
#> [1] 15
# Same as: ((((1 + 2) + 3) + 4) + 5) = 15

# Practical: find the intersection of multiple vectors
lists <- list(
  c(1, 2, 3, 4, 5),
  c(2, 3, 4, 6),
  c(3, 4, 7, 8)
)
reduce(lists, intersect)
#> [1] 3 4

# accumulate: like reduce but keeps intermediate results
accumulate(1:5, `+`)
#> [1]  1  3  6 10 15
```

## Error Handling in Functional Code

When you `map()` over many elements, one error stops everything. purrr provides wrappers that let you keep going.

```r
library(purrr)

# A function that sometimes fails
safe_log <- function(x) {
  if (x <= 0) stop("x must be positive")
  log(x)
}

inputs <- list(10, -5, 100, 0, 42)

# safely() wraps each call — returns result + error
results <- map(inputs, safely(safe_log))
results[[1]]  # success: result has value, error is NULL
results[[2]]  # failure: result is NULL, error has message
```

```r
# possibly() is simpler — just returns a default on error
library(purrr)

safe_log <- function(x) {
  if (x <= 0) stop("x must be positive")
  log(x)
}

inputs <- list(10, -5, 100, 0, 42)
map_dbl(inputs, possibly(safe_log, otherwise = NA_real_))
#> [1] 2.302585       NA 4.605170       NA 3.737670
```

Use `possibly()` when you just want a default value. Use `safely()` when you need to inspect what went wrong.

## Function Operators

A **function operator** takes a function as input and returns a modified version. Think of them as function decorators.

```r
library(purrr)

# compose(): chain functions together (right to left)
round_sqrt <- compose(round, sqrt)
round_sqrt(7)
#> [1] 3

# Left-to-right with the pipe-friendly approach
library(purrr)
add_one_then_double <- compose(\(x) x * 2, \(x) x + 1)
add_one_then_double(5)
#> [1] 12
```

```r
# negate(): flip a predicate
library(purrr)

is_even <- \(x) x %% 2 == 0
is_odd <- negate(is_even)

keep(1:10, is_even)
#> [1]  2  4  6  8 10
keep(1:10, is_odd)
#> [1] 1 3 5 7 9
```

```r
# partial(): pre-fill some arguments
library(purrr)

mean_na_rm <- partial(mean, na.rm = TRUE)

x <- c(1, 2, NA, 4, 5)
mean(x)
#> [1] NA
mean_na_rm(x)
#> [1] 3
```

```r
# memoise: cache expensive function results
library(memoise)

slow_square <- function(x) {
  Sys.sleep(0.5)  # Simulate slow computation
  x^2
}

fast_square <- memoise(slow_square)

system.time(fast_square(42))  # slow: ~0.5s
system.time(fast_square(42))  # instant: cached
```

## When NOT to Use Functional Programming

Functional programming isn't always the best choice. Here's when to reach for a different tool:

| Situation | Use Instead | Why |
|-----------|-------------|-----|
| Loop body modifies multiple variables | `for` loop | Closures with `<<-` are confusing |
| You need early termination (`break`) | `for` or `while` loop | `map()` always processes every element |
| Sequential dependencies (step N depends on step N-1) | `for` loop or `reduce()` | `map()` is for independent operations |
| Deeply nested logic | Named function + loop | Anonymous functions become unreadable |
| Performance-critical tight loop | Vectorized operation or C++ | Functional overhead matters at millions of iterations |

> **Rule of thumb:** Use functional programming when each element can be processed independently. Use a loop when iterations depend on each other.

## Practice Exercises

### Exercise 1: Custom Mapper

Write a function `apply_all` that takes a value and a list of functions, and returns the result of applying each function to that value.

```r
# Exercise: apply_all(10, list(sqrt, log, exp)) should return c(3.162, 2.302, 22026.466)
# Hint: use map_dbl()

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
apply_all <- function(x, fns) {
  map_dbl(fns, \(f) f(x))
}
apply_all(10, list(sqrt, log, exp))
#> [1] 3.162278e+00 2.302585e+00 2.202647e+04
```

**Explanation:** `map_dbl()` iterates over the list of functions, applying each one to `x`. Since each function returns a single number, `map_dbl()` returns a numeric vector.

</details>

### Exercise 2: Safe Converter

Create a function that safely converts a vector of strings to numbers, returning `NA` for any that fail.

```r
# Exercise: safe_as_numeric(c("1", "abc", "3.14", "")) should return c(1, NA, 3.14, NA)
# Hint: use map_dbl() with possibly() or tryCatch()

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
safe_as_numeric <- function(x) {
  map_dbl(x, possibly(\(val) {
    result <- as.numeric(val)
    if (is.na(result)) stop("not a number")
    result
  }, otherwise = NA_real_))
}
safe_as_numeric(c("1", "abc", "3.14", ""))
#> [1] 1.00   NA 3.14   NA
```

**Explanation:** `possibly()` catches errors and returns `NA_real_`. The inner function converts each string and raises an error if the result is `NA`, so both non-numeric strings and empty strings get caught.

</details>

### Exercise 3: Function Factory

Create a function factory `make_validator` that takes a min and max value and returns a function that checks whether its input falls within that range.

```r
# Exercise:
# is_valid_age <- make_validator(0, 120)
# is_valid_age(25) should be TRUE
# is_valid_age(-5) should be FALSE
# Hint: the returned function should use the closure to remember min/max

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
make_validator <- function(min_val, max_val) {
  function(x) x >= min_val & x <= max_val
}

is_valid_age <- make_validator(0, 120)
is_valid_age(25)
#> [1] TRUE
is_valid_age(-5)
#> [1] FALSE
is_valid_age(c(0, 50, 121, -1))
#> [1]  TRUE  TRUE FALSE FALSE
```

**Explanation:** `make_validator()` is a function factory. It returns a closure that remembers `min_val` and `max_val` from its enclosing environment. The returned function works with both single values and vectors because `>=` and `<=` are vectorized.

</details>

### Exercise 4: Reduce Challenge

Use `reduce()` to find the union of all character vectors in a list.

```r
# Exercise:
# word_lists <- list(c("apple", "banana"), c("banana", "cherry"), c("cherry", "date", "apple"))
# Result should be: c("apple", "banana", "cherry", "date")
# Hint: use reduce() with union()

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
library(purrr)
word_lists <- list(
  c("apple", "banana"),
  c("banana", "cherry"),
  c("cherry", "date", "apple")
)
reduce(word_lists, union)
#> [1] "apple"  "banana" "cherry" "date"
```

**Explanation:** `reduce()` applies `union()` cumulatively: first `union(c("apple","banana"), c("banana","cherry"))` gives `c("apple","banana","cherry")`, then `union(that, c("cherry","date","apple"))` gives the final four-element vector.

</details>

### Exercise 5: Pipeline Builder

Write a function `compose_pipeline` that takes a list of functions and returns a single function that applies them in order (left to right).

```r
# Exercise:
# pipeline <- compose_pipeline(list(\(x) x + 1, \(x) x * 2, \(x) x - 3))
# pipeline(5) should return 9: (5 + 1) * 2 - 3 = 9
# Hint: use reduce() creatively

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
compose_pipeline <- function(fns) {
  function(x) reduce(fns, \(val, f) f(val), .init = x)
}

pipeline <- compose_pipeline(list(\(x) x + 1, \(x) x * 2, \(x) x - 3))
pipeline(5)
#> [1] 9

# Verify: (5 + 1) = 6, * 2 = 12, - 3 = 9
```

**Explanation:** `reduce()` starts with `.init = x` and applies each function in order, passing the result of each step as the input to the next. This creates left-to-right composition — the opposite of `compose()` which works right-to-left.

</details>

## Complete Example: Data Analysis Pipeline

Let's bring everything together. We'll analyze the `mtcars` dataset using a purely functional approach — no loops, no intermediate variables.

```r
library(purrr)

# Step 1: Split data by cylinder count
by_cyl <- split(mtcars, mtcars$cyl)

# Step 2: For each group, compute summary stats using map
summaries <- imap(by_cyl, \(df, cyl_name) {
  tibble::tibble(
    cylinders = as.integer(cyl_name),
    n_cars    = nrow(df),
    avg_mpg   = round(mean(df$mpg), 1),
    avg_hp    = round(mean(df$hp), 0),
    avg_wt    = round(mean(df$wt), 2)
  )
})

# Step 3: Combine all summaries into one data frame
result <- list_rbind(summaries)
result
```

```r
# Step 4: Fit a linear model for each group
library(purrr)
by_cyl <- split(mtcars, mtcars$cyl)

models <- map(by_cyl, \(df) lm(mpg ~ wt + hp, data = df))

# Step 5: Extract R-squared from each model
r_squared <- map_dbl(models, \(mod) summary(mod)$r.squared)
r_squared

# Step 6: Extract coefficients as a tidy table
coefs <- imap(models, \(mod, cyl) {
  cf <- coef(mod)
  tibble::tibble(
    cylinders = cyl,
    intercept = round(cf[1], 2),
    wt_effect = round(cf["wt"], 2),
    hp_effect = round(cf["hp"], 3)
  )
})
list_rbind(coefs)
```

This pipeline is readable, composable, and each step does one thing. You can swap out any step without touching the others.

## Summary

| Concept | What It Does | Key Function |
|---------|-------------|--------------|
| First-class functions | Treat functions as values — assign, pass, return | `function()`, `\()` |
| Anonymous functions | Unnamed functions for one-off use | `\(x) x^2` |
| Closures | Functions that capture their creation environment | `environment()` |
| Function factories | Functions that return new functions | `make_power(2)` |
| Functionals | Functions that take functions as arguments | `map()`, `lapply()` |
| map variants | Type-safe iteration | `map_dbl()`, `map_chr()`, `map_lgl()` |
| Multi-input mapping | Iterate over 2+ inputs in parallel | `map2()`, `pmap()` |
| Side-effect mapping | Iterate for effects, not results | `walk()`, `walk2()` |
| Error handling | Keep going when individual calls fail | `safely()`, `possibly()` |
| reduce | Collapse a list to a single value | `reduce()`, `accumulate()` |
| Function operators | Modify functions | `compose()`, `negate()`, `partial()` |
| Memoization | Cache expensive computations | `memoise::memoise()` |

## FAQ

<h4>Is R a functional programming language?</h4>

R is a multi-paradigm language with strong functional programming support. Functions are first-class citizens, and the language was heavily influenced by Scheme (a functional Lisp dialect). You can write R in a functional, imperative, or object-oriented style.

<h4>Should I use lapply() or purrr::map()?</h4>

Both work well. Use `lapply()` when you want zero dependencies or you're writing a package. Use `purrr::map()` when you want type-safe variants (`map_dbl`, `map_chr`), better error handling (`safely`, `possibly`), and a consistent API. For interactive analysis, purrr is usually more convenient.

<h4>What's the difference between a closure and a regular function?</h4>

All user-defined functions in R are technically closures — they carry a reference to the environment where they were created. The term "closure" is most useful when a function captures variables from an enclosing function, like when a function factory returns an inner function that remembers the factory's arguments.

<h4>Why use map() instead of a for loop?</h4>

Readability and safety. A `map()` call says "apply this function to every element" in one line. A for loop requires initializing a container, writing the loop header, and indexing correctly. With `map()`, there's no index variable to mess up and no container to pre-allocate.

<h4>Can functional programming be slower than loops in R?</h4>

In most practical cases, the performance difference is negligible. Both `lapply()` and `map()` use optimized C code internally. The real performance gains come from vectorized operations (which avoid both loops and functionals) or parallelization. Use functional style for clarity, and optimize only when profiling reveals a bottleneck.
