---
title: "R Function Factories: Functions That Create Functions (With 5 Examples)"
slug: "R-Function-Factories"
description: "Learn R function factories — functions that return functions. 5 practical examples: power functions, formatters, validators, loggers, and memoizers."
keywords: "R function factories, functions that create functions, R closures, R higher-order functions, R metaprogramming"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "4.2.4"
post_type: "C"
auto_link_terms: "function factories|functions that create functions"
auto_link_case_sensitive: false
---

# R Function Factories: Functions That Create Functions (With 5 Examples)

<p class="lead">A <strong>function factory</strong> is a function that creates and returns other functions. This pattern uses closures to "bake in" parameters, producing specialized functions from a general template.</p>

You've already used function factories without knowing it. When you write `make_adder <- function(n) function(x) x + n`, `make_adder` is a factory. Call `make_adder(5)` and you get back a new function that adds 5 to whatever you give it.

## Why Function Factories?

Function factories solve a specific problem: you need several functions that do the same thing but with different parameters. Instead of writing each one by hand, you write one factory.

```r
# Without a factory: repetitive
add_1 <- function(x) x + 1
add_5 <- function(x) x + 5
add_10 <- function(x) x + 10

# With a factory: one template, many functions
make_adder <- function(n) {
  function(x) x + n
}

add_1 <- make_adder(1)
add_5 <- make_adder(5)
add_10 <- make_adder(10)

cat("add_1(100):", add_1(100), "\n")
cat("add_5(100):", add_5(100), "\n")
cat("add_10(100):", add_10(100), "\n")
```

## How It Works: Closures

When a function factory creates a new function, that new function remembers the environment where it was created — including the factory's parameters. This combination of function + its enclosing environment is called a **closure**.

```r
make_adder <- function(n) {
  cat("Factory called with n =", n, "\n")
  function(x) {
    cat("  Adding", n, "to", x, "\n")
    x + n
  }
}

# n=5 is captured when the factory runs
add5 <- make_adder(5)

# The returned function remembers n=5
add5(10)
add5(20)

# Each call to the factory creates independent closures
add100 <- make_adder(100)
add100(1)
```

```r
# Proof: the closure carries its own environment
make_adder <- function(n) function(x) x + n

add5 <- make_adder(5)
add100 <- make_adder(100)

# Look inside the closure's environment
cat("add5's n:", environment(add5)$n, "\n")
cat("add100's n:", environment(add100)$n, "\n")
```

## Example 1: Power Functions

Create a family of power functions from a single factory.

```r
make_power <- function(exp) {
  function(x) x^exp
}

square <- make_power(2)
cube <- make_power(3)
fourth <- make_power(4)

x <- 1:5
cat("x:       ", x, "\n")
cat("square:  ", square(x), "\n")
cat("cube:    ", cube(x), "\n")
cat("fourth:  ", fourth(x), "\n")
```

## Example 2: Custom Formatters

Build formatters that apply consistent formatting rules.

```r
make_formatter <- function(prefix = "", suffix = "", digits = 2) {
  function(x) {
    formatted <- formatC(round(x, digits), format = "f", digits = digits)
    paste0(prefix, formatted, suffix)
  }
}

format_usd <- make_formatter(prefix = "$", digits = 2)
format_pct <- make_formatter(suffix = "%", digits = 1)
format_sci <- make_formatter(digits = 4)

values <- c(1234.567, 0.089, 42.1)
cat("USD:", format_usd(values), "\n")
cat("Pct:", format_pct(values), "\n")
cat("Sci:", format_sci(values), "\n")
```

## Example 3: Input Validators

Create reusable validation functions for data pipelines.

```r
make_range_checker <- function(min_val, max_val, name = "value") {
  function(x) {
    out_of_range <- x < min_val | x > max_val
    if (any(out_of_range, na.rm = TRUE)) {
      bad <- x[which(out_of_range)]
      warning(name, " out of range [", min_val, ", ", max_val, "]: ",
              paste(bad, collapse = ", "))
    }
    invisible(!any(out_of_range, na.rm = TRUE))
  }
}

check_age <- make_range_checker(0, 120, "age")
check_score <- make_range_checker(0, 100, "score")

cat("Valid ages:\n")
check_age(c(25, 30, 45))

cat("\nInvalid ages:\n")
check_age(c(25, -5, 150))

cat("\nValid scores:\n")
check_score(c(88, 92, 76))
```

## Example 4: Stateful Counters

Function factories can create functions with mutable state using `<<-`.

```r
make_counter <- function(start = 0) {
  count <- start
  list(
    increment = function(by = 1) {
      count <<- count + by
      invisible(count)
    },
    get = function() count,
    reset = function() {
      count <<- start
      invisible(count)
    }
  )
}

counter <- make_counter()
counter$increment()
counter$increment()
counter$increment(5)
cat("Count:", counter$get(), "\n")

counter$reset()
cat("After reset:", counter$get(), "\n")
```

## Example 5: Logging Wrapper

Wrap any function with automatic logging.

```r
with_logging <- function(f, name = deparse(substitute(f))) {
  function(...) {
    cat("[LOG]", name, "called with", length(list(...)), "args\n")
    start <- proc.time()["elapsed"]
    result <- f(...)
    elapsed <- proc.time()["elapsed"] - start
    cat("[LOG]", name, "returned in", round(elapsed, 4), "sec\n")
    result
  }
}

logged_mean <- with_logging(mean)
logged_sort <- with_logging(sort)

x <- rnorm(1000)
cat("\n")
m <- logged_mean(x)
cat("Result:", round(m, 4), "\n\n")

s <- logged_sort(x)
cat("First 5 sorted:", round(head(s, 5), 3), "\n")
```

## The Lazy Evaluation Trap

One common gotcha with function factories is R's lazy evaluation. If you use a loop variable in a factory, all functions may share the same value.

```r
# BUG: all functions return 3 (the final value of i)
funs_bad <- list()
for (i in 1:3) {
  funs_bad[[i]] <- function(x) x + i
}
cat("Bad: expecting 1+10=11, got:", funs_bad[[1]](10), "\n")
cat("Bad: expecting 2+10=12, got:", funs_bad[[2]](10), "\n")

# FIX: force evaluation with force() or a factory
make_adder <- function(n) { force(n); function(x) x + n }
funs_good <- list()
for (i in 1:3) {
  funs_good[[i]] <- make_adder(i)
}
cat("\nGood:", funs_good[[1]](10), "\n")
cat("Good:", funs_good[[2]](10), "\n")
cat("Good:", funs_good[[3]](10), "\n")
```

> Always use `force()` on factory arguments that could be lazily evaluated, or use `lapply()` instead of a for-loop: `funs <- lapply(1:3, \(i) \(x) x + i)`.

## Practice Exercises

### Exercise 1: Temperature Converter Factory

Create a factory `make_converter(from, to)` that produces temperature conversion functions.

```r
# Create make_converter that handles:
# "C" to "F": F = C * 9/5 + 32
# "F" to "C": C = (F - 32) * 5/9
# "C" to "K": K = C + 273.15

# c_to_f <- make_converter("C", "F")
# f_to_c <- make_converter("F", "C")
# c_to_f(100)  # should be 212
# f_to_c(32)   # should be 0
```

<details>
<summary>Click to reveal solution</summary>

```r
make_converter <- function(from, to) {
  force(from); force(to)
  if (from == "C" && to == "F") return(\(x) x * 9/5 + 32)
  if (from == "F" && to == "C") return(\(x) (x - 32) * 5/9)
  if (from == "C" && to == "K") return(\(x) x + 273.15)
  if (from == "K" && to == "C") return(\(x) x - 273.15)
  stop("Unknown conversion: ", from, " -> ", to)
}

c_to_f <- make_converter("C", "F")
f_to_c <- make_converter("F", "C")
c_to_k <- make_converter("C", "K")

cat("100°C =", c_to_f(100), "°F\n")
cat("32°F =", f_to_c(32), "°C\n")
cat("0°C =", c_to_k(0), "K\n")
```

**Explanation:** The factory selects the right formula based on `from`/`to` and returns a specialized function. Each converter carries its formula in its closure.

</details>

### Exercise 2: Threshold Classifier

Build a factory that creates classification functions from a list of thresholds and labels.

```r
# Create make_classifier that takes breaks and labels
# Example: grade classifier with A/B/C/D/F

# classify_grade <- make_classifier(
#   breaks = c(0, 60, 70, 80, 90, 100),
#   labels = c("F", "D", "C", "B", "A")
# )
# classify_grade(c(95, 82, 67, 55, 73))
# Expected: "A" "B" "D" "F" "C"
```

<details>
<summary>Click to reveal solution</summary>

```r
make_classifier <- function(breaks, labels) {
  force(breaks); force(labels)
  function(x) {
    cut(x, breaks = breaks, labels = labels, include.lowest = TRUE, right = TRUE)
  }
}

classify_grade <- make_classifier(
  breaks = c(0, 60, 70, 80, 90, 100),
  labels = c("F", "D", "C", "B", "A")
)

scores <- c(95, 82, 67, 55, 73, 91, 88)
grades <- classify_grade(scores)
cat("Scores:", scores, "\n")
cat("Grades:", as.character(grades), "\n")
```

**Explanation:** The factory captures `breaks` and `labels`, then returns a function that uses `cut()` to classify any numeric vector. You could make separate classifiers for grades, risk levels, age groups, etc.

</details>

## Summary

| Concept | Description |
|---------|-------------|
| Function factory | A function that returns a new function |
| Closure | The returned function + its enclosing environment |
| `force()` | Ensures a factory argument is evaluated immediately |
| `<<-` | Modifies a variable in the enclosing environment (for state) |
| `environment(f)` | Access a closure's captured variables |

## FAQ

### What is the difference between a closure and a regular function?

All R functions are technically closures — they all carry a reference to the environment where they were defined. But in practice, "closure" refers to functions that capture and use variables from an enclosing function's scope, like the `n` in `make_adder(n)`.

### When should I use a function factory vs a function with parameters?

Use a regular function with parameters when callers always supply all arguments. Use a factory when you want to "pre-configure" a function with some values and pass the specialized version around — for example, passing a configured formatter to `map()`.

### Does force() affect performance?

No. `force(x)` is literally just `x` — it evaluates the argument. The performance cost is negligible. Always use it in factories to avoid the lazy evaluation trap.

## Continue Learning

- [R Anonymous Functions](/R-Anonymous-Functions.html) — the inline functions you'll use inside factories
- [R Function Operators](/R-Function-Operators.html) — compose, negate, and memoize existing functions
- [Functional Programming in R](/Functional-Programming-in-R.html) — the broader FP landscape in R
