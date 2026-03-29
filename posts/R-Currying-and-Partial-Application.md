---
title: "R Currying & Partial Application: purrr::partial() & rlang"
slug: "R-Currying-and-Partial-Application"
description: "Master currying and partial application in R with purrr::partial(), manual closures, and rlang tools. Simplify function calls by pre-filling arguments."
keywords: "R currying, partial application R, purrr partial, rlang, pre-fill arguments R, higher-order functions"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "FR-func-2"
post_type: "FR"
auto_link_terms: "currying|partial application"
auto_link_case_sensitive: false
fr_parent: "Functional-Programming-in-R.html"
---

# R Currying & Partial Application: purrr::partial() & rlang

<p class="lead"><strong>Partial application</strong> fixes some arguments of a function, returning a new function that takes the rest. <strong>Currying</strong> transforms a multi-argument function into a chain of single-argument functions. Both reduce repetition in functional R code.</p>

When you call `mean(x, na.rm = TRUE)` over and over, partial application lets you create `safe_mean <- partial(mean, na.rm = TRUE)` so you only write `safe_mean(x)`.

## Partial Application with purrr

```r
library(purrr)

# Fix na.rm = TRUE for common stats functions
safe_mean <- partial(mean, na.rm = TRUE)
safe_sd <- partial(sd, na.rm = TRUE)
safe_sum <- partial(sum, na.rm = TRUE)

data <- c(10, NA, 30, NA, 50)
cat("safe_mean:", safe_mean(data), "\n")
cat("safe_sd:  ", round(safe_sd(data), 2), "\n")
cat("safe_sum: ", safe_sum(data), "\n")
```

```r
library(purrr)

# Fix formatting parameters
format_usd <- partial(formatC, format = "f", digits = 2, big.mark = ",")
format_pct <- partial(formatC, format = "f", digits = 1)

prices <- c(1234.5, 99.99, 50000)
cat("USD:", paste0("$", sapply(prices, format_usd)), "\n")
cat("PCT:", paste0(sapply(c(0.156, 0.892, 0.034) * 100, format_pct), "%"), "\n")
```

## Manual Partial Application with Closures

Without purrr, use a closure to capture the fixed arguments.

```r
# Manual partial application
make_partial <- function(f, ...) {
  captured <- list(...)
  function(...) {
    do.call(f, c(captured, list(...)))
  }
}

safe_mean <- make_partial(mean, na.rm = TRUE)
cat("Result:", safe_mean(c(1, NA, 3)), "\n")

round2 <- make_partial(round, digits = 2)
cat("Rounded:", round2(3.14159), "\n")
```

## Currying: One Argument at a Time

Currying transforms `f(a, b, c)` into `f(a)(b)(c)`. Each call returns a new function expecting the next argument.

```r
# Curried add function
curried_add <- function(a) {
  function(b) {
    a + b
  }
}

add5 <- curried_add(5)
cat("add5(10):", add5(10), "\n")
cat("curried_add(3)(7):", curried_add(3)(7), "\n")

# Curried string formatter
curried_format <- function(prefix) {
  function(suffix) {
    function(x) paste0(prefix, x, suffix)
  }
}

format_dollars <- curried_format("$")("")
format_percent <- curried_format("")("%")
cat(format_dollars(42.5), "\n")
cat(format_percent(85), "\n")
```

## Practical: Building Configurable Pipelines

```r
library(purrr)

# Partial application creates pipeline steps
filter_above <- partial(Filter, f = \(x) x > 0)
round_to <- partial(round, digits = 2)

data <- c(-1.234, 3.456, -0.789, 2.345, -5.678, 1.111)
result <- data |> filter_above() |> round_to()
cat("Filtered and rounded:", result, "\n")
```

```r
library(purrr)

# Create a family of map functions with fixed transformations
map_sqrt <- partial(map_dbl, .f = sqrt)
map_log <- partial(map_dbl, .f = log)
map_abs <- partial(map_dbl, .f = abs)

values <- list(4, 9, 16, 25)
cat("Sqrt:", map_sqrt(values), "\n")
cat("Log: ", round(map_log(values), 2), "\n")
```

## Currying vs Partial Application

| Feature | Currying | Partial Application |
|---------|---------|-------------------|
| Transforms | `f(a,b,c)` → `f(a)(b)(c)` | `f(a,b,c)` → `g(c)` where a,b fixed |
| Arguments fixed | One at a time, in order | Any subset, any order |
| Common in R | Rare (manual only) | Common (purrr::partial) |
| Use case | Theoretical FP, specialized chains | Everyday convenience |

## Practice Exercises

### Exercise 1: Configurable Logger

Use partial application to create logging functions with different severity levels.

```r
library(purrr)

log_msg <- function(level, timestamp, msg) {
  cat(sprintf("[%s] %s: %s\n", level, timestamp, msg))
}

# Create: log_info, log_warn, log_error using partial
# All should auto-fill the timestamp with Sys.time()

```

<details>
<summary>Click to reveal solution</summary>

```r
library(purrr)

log_msg <- function(level, timestamp, msg) {
  cat(sprintf("[%s] %s: %s\n", level, timestamp, msg))
}

log_info <- partial(log_msg, level = "INFO", timestamp = format(Sys.time()))
log_warn <- partial(log_msg, level = "WARN", timestamp = format(Sys.time()))
log_error <- partial(log_msg, level = "ERROR", timestamp = format(Sys.time()))

log_info("Application started")
log_warn("Memory usage high")
log_error("Connection failed")
```

**Explanation:** `partial()` pre-fills `level` and `timestamp`, leaving only `msg` for the caller. This eliminates repeated boilerplate arguments.

</details>

## Summary

| Tool | Package | Use |
|------|---------|-----|
| `partial(f, ...)` | purrr | Fix some arguments of `f` |
| Closure `function(x) f(x, fixed)` | base | Manual partial application |
| Curried `f(a)(b)(c)` | manual | Chain of single-arg functions |

## FAQ

### Is partial application the same as default arguments?

No. Default arguments are set in the function definition and can be overridden by any caller. Partial application creates a new function where certain arguments are permanently fixed. The caller of the partially applied function can't change them (without accessing the closure).

### Does R have a built-in curry function?

No. R doesn't have a built-in curry function. You can implement one manually or use `functional::Curry()` from the functional package. In practice, partial application with `purrr::partial()` is more useful in R than currying.

## What's Next?

- [R Function Operators](/R-Function-Operators.html) — compose, negate, and more
- [R Function Factories](/R-Function-Factories.html) — functions that create functions
- [purrr map() Variants](/purrr-map-Variants.html) — where partial application shines
