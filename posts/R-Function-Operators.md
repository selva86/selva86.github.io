---
title: "R Function Operators: Compose, Negate & Partial Application"
slug: "R-Function-Operators"
description: "Master R function operators: compose functions with pipes, negate predicates, apply partial arguments, and memoize results. Interactive examples."
keywords: "R function operators, compose R, Negate R, partial application R, purrr partial, function composition R"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "4.2.5"
post_type: "C"
auto_link_terms: "function operators|compose|Negate|partial application"
auto_link_case_sensitive: false
---

# R Function Operators: Compose, Negate & Partial Application

<p class="lead"><strong>Function operators</strong> take one or more functions as input and return a modified function as output. They let you compose, negate, partially apply, and otherwise transform functions without rewriting them.</p>

A function factory creates functions from parameters. A function operator creates functions from other functions. The distinction is simple: if the input is data, it's a factory. If the input is a function, it's an operator.

## Function Composition

Function composition chains two functions together so the output of one feeds directly into the input of the next. Instead of writing `f(g(x))`, you create a single combined function.

### Base R: Compose with the Pipe

R 4.1+ introduced the native pipe `|>`, which passes the left side as the first argument of the right side.

```r
# Without composition: nested calls (read inside-out)
result <- round(mean(abs(c(-3, 5, -1, 8, -2))), 2)
cat("Nested:", result, "\n")

# With pipe: read left to right
result <- c(-3, 5, -1, 8, -2) |> abs() |> mean() |> round(2)
cat("Piped:", result, "\n")
```

### purrr::compose()

`compose()` creates a new function by chaining multiple functions. The last function listed runs first (right-to-left by default).

```r
library(purrr)

# compose() chains functions into one
abs_mean <- compose(mean, abs)
cat("abs_mean(c(-3, 5, -1)):", abs_mean(c(-3, 5, -1)), "\n")

# .dir = "forward" for left-to-right order
clean_string <- compose(trimws, tolower, .dir = "forward")
cat("clean_string('  HELLO  '):", clean_string("  HELLO  "), "\n")
```

```r
library(purrr)

# Practical: create a data cleaning pipeline as a single function
clean_vector <- compose(
  \(x) x[!is.na(x)],       # remove NAs
  \(x) round(x, 2),         # round
  sort,                       # sort
  .dir = "forward"
)

messy <- c(3.14159, NA, 1.41421, 2.71828, NA, 0.57722)
cat("Cleaned:", clean_vector(messy), "\n")
```

## Negate: Flipping TRUE to FALSE

`Negate()` (base R) or `negate()` (purrr) takes a predicate function and returns a new function that returns the opposite logical value.

```r
# is.na returns TRUE for NAs
x <- c(1, NA, 3, NA, 5)

# Negate flips it: TRUE becomes FALSE and vice versa
is_not_na <- Negate(is.na)
cat("is.na:    ", is.na(x), "\n")
cat("is_not_na:", is_not_na(x), "\n")

# Use with Filter
cat("Non-NA values:", Filter(Negate(is.na), x), "\n")
```

```r
library(purrr)

# purrr's negate() works the same way
is_even <- \(x) x %% 2 == 0
is_odd <- negate(is_even)

numbers <- 1:10
cat("Even:", numbers[map_lgl(numbers, is_even)], "\n")
cat("Odd: ", numbers[map_lgl(numbers, is_odd)], "\n")
```

## Partial Application

**Partial application** fixes some arguments of a function, returning a new function that takes the remaining arguments. It's like pre-filling a form — you lock in some values and leave the rest blank.

### purrr::partial()

```r
library(purrr)

# Fix the 'na.rm' argument of mean
safe_mean <- partial(mean, na.rm = TRUE)

data_with_na <- c(10, 20, NA, 40, 50)
cat("mean (default):", mean(data_with_na), "\n")       # NA
cat("safe_mean:     ", safe_mean(data_with_na), "\n")   # 30
```

```r
library(purrr)

# Fix 'base' argument of log
log2 <- partial(log, base = 2)
log10_custom <- partial(log, base = 10)

cat("log2(8):  ", log2(8), "\n")
cat("log10(100):", log10_custom(100), "\n")

# Fix 'sep' in paste
comma_paste <- partial(paste, sep = ", ")
cat(comma_paste("a", "b", "c"), "\n")
```

### Base R: Creating Partial Functions Manually

Without purrr, you can create partial functions using closures.

```r
# Manual partial application
make_rounder <- function(digits) {
  function(x) round(x, digits)
}

round2 <- make_rounder(2)
round0 <- make_rounder(0)

pi_val <- 3.14159265
cat("round2(pi):", round2(pi_val), "\n")
cat("round0(pi):", round0(pi_val), "\n")
```

## safely() and possibly(): Error Handling Operators

These purrr operators wrap a function to handle errors gracefully.

```r
library(purrr)

# safely() returns a list with $result and $error
safe_log <- safely(log)

cat("safe_log(10):\n")
str(safe_log(10))

cat("\nsafe_log('text'):\n")
str(safe_log("text"))
```

```r
library(purrr)

# possibly() returns a default value on error
maybe_log <- possibly(log, otherwise = NA)

inputs <- list(10, "text", 100, NULL, 1)
results <- map_dbl(inputs, maybe_log)
cat("Results:", results, "\n")
```

> Use `safely()` when you need to inspect errors. Use `possibly()` when you just want a default fallback. Both are function operators — they take a function and return a modified function.

## Combining Operators

Function operators compose naturally. Chain them to build sophisticated behavior.

```r
library(purrr)

# Chain operators: partial + safely + compose
safe_divide <- safely(partial(`/`, 100))

results <- map(c(5, 0, 25, "x"), safe_divide)
cat("100/5:", results[[1]]$result, "\n")
cat("100/0:", results[[2]]$result, "\n")
cat("100/25:", results[[3]]$result, "\n")
cat("100/'x' error:", results[[4]]$error$message, "\n")
```

## Summary Table

| Operator | Package | Input | Output | Use case |
|----------|---------|-------|--------|----------|
| `compose(f, g)` | purrr | 2+ functions | Combined function | Chain transformations |
| `Negate(f)` | base | Predicate | Opposite predicate | Flip TRUE/FALSE |
| `partial(f, ...)` | purrr | Function + args | Specialized function | Pre-fill arguments |
| `safely(f)` | purrr | Function | Error-safe function | Capture errors |
| `possibly(f, default)` | purrr | Function | Fallback function | Default on error |

## Practice Exercises

### Exercise 1: Compose a Text Cleaner

Create a single `clean_text` function by composing `trimws`, `tolower`, and a function that replaces multiple spaces with one.

```r
library(purrr)

# Create clean_text using compose()
messy <- c("  Hello   World  ", "  R   PROGRAMMING  ", "DATA   science  ")

# Expected output: "hello world", "r programming", "data science"
```

<details>
<summary>Click to reveal solution</summary>

```r
library(purrr)

clean_text <- compose(
  trimws,
  tolower,
  \(x) gsub("\\s+", " ", x),
  .dir = "forward"
)

messy <- c("  Hello   World  ", "  R   PROGRAMMING  ", "DATA   science  ")
cat("Cleaned:", map_chr(messy, clean_text), "\n")
```

**Explanation:** `compose(.dir = "forward")` applies functions left-to-right: trim first, then lowercase, then collapse spaces.

</details>

### Exercise 2: Safe Map Pipeline

Use `possibly()` to safely parse a mix of valid and invalid numbers.

```r
library(purrr)

raw <- c("42", "3.14", "abc", "100", "xyz", "0.5")

# Convert to numbers safely, using NA for failures
# Then calculate mean of successful conversions

```

<details>
<summary>Click to reveal solution</summary>

```r
library(purrr)

raw <- c("42", "3.14", "abc", "100", "xyz", "0.5")

safe_as_num <- possibly(as.numeric, otherwise = NA)
nums <- map_dbl(raw, safe_as_num)
cat("Parsed:", nums, "\n")
cat("Mean (excluding NA):", mean(nums, na.rm = TRUE), "\n")
```

**Explanation:** `possibly(as.numeric, NA)` wraps `as.numeric` so it returns `NA` instead of throwing a warning on non-numeric input. Combine with `map_dbl` for type-safe output.

</details>

## FAQ

### What is the difference between compose() and the pipe |>?

The pipe `|>` applies functions to data immediately: `x |> f() |> g()` runs now. `compose(g, f)` creates a new function that you can call later, pass to `map()`, or assign to a variable. Compose creates tools; pipes use them.

### When should I use partial() vs writing a wrapper function?

Use `partial()` for simple argument pre-filling — it's concise and self-documenting. Write a wrapper when you need conditional logic, validation, or transformation of arguments before passing them to the inner function.

### Does Negate() work with functions that return vectors?

Yes. `Negate(f)` applies `!` to whatever `f` returns. If `f` returns a logical vector, `Negate(f)` returns the element-wise negation.

## What's Next?

- [R Function Factories](/R-Function-Factories.html) — functions that create functions from data
- [Reduce, Filter, Map in Base R](/Reduce-Filter-Map-in-R.html) — the functional trifecta in base R
- [purrr map() Variants](/purrr-map-Variants.html) — where function operators are used most
