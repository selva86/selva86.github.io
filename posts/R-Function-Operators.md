---
title: "R Function Operators: Transform Existing Functions Without Rewriting Them"
slug: "R-Function-Operators"
description: "Function operators in R take a function and return a transformed version. Compose, negate, memoise, and log function calls — all without touching the originals."
keywords: "R function operators, compose functions R, negate function R, purrr function operators, higher-order functions"
mathjax: false
webr: true
date: "2026-04-12"
curriculum_id: "4.2.5"
post_type: "C"
auto_link_terms: "function operators|compose functions|negate function|function adverbs"
auto_link_case_sensitive: false
sidebar_section: "Learn R"
sidebar_title: "R Function Operators"
sidebar_order: 37
---

# R Function Operators: Transform Existing Functions Without Rewriting Them

<p class="lead">A function operator in R takes one or more functions and returns a new, transformed function. Unlike function factories (which take settings), operators take functions themselves — letting you compose, negate, memoise, or log any existing function.</p>

If a function factory is "settings in, function out", a function operator is "function in, function out". The distinction matters because operators let you *modify behaviour* without touching the original code — wrap a slow function to cache its results, wrap a predicate to negate it, wrap a pipeline to log every call. This guide covers the four operators you will actually use and how to build your own.

## What Is a Function Operator?

A function operator is a higher-order function whose input includes at least one function and whose output is a function. The classic example is `Negate()` — give it a predicate, get back the logical opposite.

```r
is_positive <- \(x) x > 0
is_not_positive <- Negate(is_positive)

is_positive(5)
#> [1] TRUE

is_not_positive(5)
#> [1] FALSE
```

`Negate(is_positive)` did not call `is_positive`. It returned a brand new function that calls `is_positive` internally and flips the answer. You can now pass `is_not_positive` to `Filter`, `which`, or anywhere else you need a predicate — without ever writing "not positive" by hand.

[KEY INSIGHT]
**Operators separate "what to do" from "how to run it".** The original function knows how to compute a result. The operator knows how to *change* the running of any function — cache it, time it, negate it. Because the two concerns live in different functions, you can mix and match freely.

## How Do You Compose Functions With `Reduce()` or `purrr::compose()`?

Function composition means chaining: take the output of `g`, feed it to `f`. Mathematically this is `f ∘ g`. In R you can build a composed function once and reuse it.

```r
# Base R: compose with Reduce and Function()
compose2 <- function(f, g) function(x) f(g(x))

shout <- compose2(toupper, trimws)
shout("  hello world  ")
#> [1] "HELLO WORLD"
```

`shout` first trims whitespace, then uppercases. You never had to name an intermediate variable; the composed function is a single value you can pass around. For a longer pipeline, `purrr::compose()` takes any number of functions at once.

```r
library(purrr)

clean_name <- compose(tolower, trimws, \(s) gsub("[^a-z ]", "", s, ignore.case = TRUE))
clean_name("  HELLO World! 42 ")
#> [1] "hello world "
```

Read `compose(tolower, trimws, ...)` right to left: the rightmost function runs first, just like mathematical composition. If that reads backwards to you, pass `.dir = "forward"` to reverse the order.

**Try it:** Use base R composition (nested functions or your own `compose2`) to build a function that takes a number, adds 1, then squares the result. Test on `3`.

```r
# your code here
#> Expected: 16
```

<details>
<summary>Click to reveal solution</summary>

```r
compose2 <- function(f, g) function(x) f(g(x))
square_after_add1 <- compose2(\(x) x^2, \(x) x + 1)
square_after_add1(3)
#> [1] 16
```

**Explanation:** `compose2` fires the rightmost function first (`x + 1 = 4`), then the leftmost (`4^2 = 16`).

</details>

## What Does `Negate()` Give You That an `!` Does Not?

`Negate` returns a *function*, not a value. You can pass that function into another higher-order function without inventing a name.

```r
mixed <- c(-2, 0, 3, -1, 5, -4)

# With Negate
is_positive <- \(x) x > 0
Filter(Negate(is_positive), mixed)
#> [1] -2  0 -1 -4
```

`Filter(Negate(is_positive), mixed)` reads almost like English: keep everything that is not positive. The alternative — `Filter(\(x) !is_positive(x), mixed)` — works but requires you to define the inline wrapper each time.

## How Do You Time or Log Any Function With an Operator?

Here is a useful operator — `with_timing` — that wraps any function so every call prints its duration.

```r
with_timing <- function(f) {
  function(...) {
    t0 <- Sys.time()
    out <- f(...)
    cat("Elapsed:", format(Sys.time() - t0), "\n")
    out
  }
}

timed_sum <- with_timing(sum)
timed_sum(1:1e6)
#> Elapsed: 0.01 secs
#> [1] 500000500000
```

`timed_sum` is `sum` with side-effect logging bolted on. The original `sum` is unchanged — you can still use it everywhere else. Any function can be wrapped this way: `read.csv`, your custom model fitter, the whole lot. That is the power of an operator — it is a *modifier* for a behaviour, applicable to any function.

[TIP]
**Stack operators for layered behaviour.** Want a memoised, timed, logging version of a function? Wrap it three times: `with_timing(memoise(with_logging(f)))`. Each layer adds one concern without touching the others.

## How Does `purrr::safely()` Turn Errors Into Values?

`safely()` is one of the most useful operators in `purrr`. It wraps a function so it never errors — instead, it returns a list with `$result` and `$error`, exactly one of which is `NULL`.

```r
library(purrr)

safe_log <- safely(log)

safe_log(10)
#> $result
#> [1] 2.302585
#>
#> $error
#> NULL

safe_log("not a number")
#> $result
#> NULL
#>
#> $error
#> <simpleError in log(x): non-numeric argument to mathematical function>
```

Once a risky function is safely-wrapped, you can `map()` it over a messy list without one bad element crashing the whole pipeline. Filter `$error`-ed results at the end.

**Try it:** Use `safely(sqrt)` on the vector `c(4, -1, 9)` via `map` and print the errors count.

```r
library(purrr)
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
library(purrr)
safe_sqrt <- safely(sqrt)
results <- map(c(4, -1, 9), safe_sqrt)
sum(sapply(results, \(r) !is.null(r$result)))
#> [1] 3
```

**Explanation:** `sqrt(-1)` returns `NaN` with a warning rather than an error, so all three have a `$result`. Try `safely(log)` on negatives for a real error.

</details>

## Practice Exercises

### Exercise 1: Build a Retry Operator

Write a function operator `with_retry(f, times = 3)` that calls `f` up to `times` times and returns the first successful result. If all attempts fail, it rethrows the last error.

```r
# your code here

```

<details>
<summary>Click to reveal solution</summary>

```r
with_retry <- function(f, times = 3) {
  function(...) {
    for (i in seq_len(times)) {
      result <- tryCatch(f(...), error = \(e) e)
      if (!inherits(result, "error")) return(result)
    }
    stop(result)
  }
}

my_safe_sqrt <- with_retry(sqrt, times = 3)
my_safe_sqrt(16)
#> [1] 4
```

**Explanation:** `tryCatch` captures any error; the loop retries up to `times` times and rethrows the final error.

</details>

### Exercise 2: Chain Two Operators

Use `Negate()` and `Filter()` together to keep only the strings in `c("cat", "canary", "dog", "cow")` that do NOT start with `"c"`.

```r
# your code here
#> Expected: "dog"
```

<details>
<summary>Click to reveal solution</summary>

```r
starts_with_c <- \(s) startsWith(s, "c")
Filter(Negate(starts_with_c), c("cat", "canary", "dog", "cow"))
#> [1] "dog"
```

**Explanation:** `Negate(starts_with_c)` is the predicate "does NOT start with c"; `Filter` keeps everything that matches.

</details>

## Summary

| Operator            | Takes                 | Returns                                     |
|---------------------|-----------------------|---------------------------------------------|
| `Negate(f)`         | A predicate           | The opposite predicate                     |
| `compose(f, g)`     | Two functions         | `f(g(x))` as one call                      |
| `with_timing(f)`    | Any function          | Same function, prints elapsed time         |
| `purrr::safely(f)`  | Any function          | Returns `$result`/`$error` instead of erroring |
| `purrr::possibly(f)`| Function + default    | Returns default on error                   |

## References

1. Wickham, H. — *Advanced R*, 2nd Edition, Chapter 11: Function operators. [Link](https://adv-r.hadley.nz/function-operators.html)
2. `purrr::safely`, `possibly`, `quietly`, `compose`. [Link](https://purrr.tidyverse.org/reference/safely.html)
3. R Core Team — `base::Negate`. [Link](https://rdrr.io/r/base/funprog.html)
4. `memoise` package — caching as an operator. [Link](https://memoise.r-lib.org/)
5. Wickham, H. — *R for Data Science*, 2nd Edition. [Link](https://r4ds.hadley.nz/)

## Continue Learning

- [R Function Factories](R-Function-Factories.html) — settings in, function out; the sibling pattern to operators.
- [Memoization in R](Memoization-in-R.html) — an operator that caches results for speedups.
- [Infix Functions in R](Infix-Functions-in-R.html) — write your own `%op%` operators for custom composition.
