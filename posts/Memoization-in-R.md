---
title: "Memoize R Functions: Cache Results and Call Expensive Code Only Once"
slug: "Memoization-in-R"
description: "Memoization caches the results of pure functions so repeat calls return instantly. Learn how it works, when to use it, and how the memoise package makes it one line of code."
keywords: "memoization R, memoise package R, cache function results R, R performance caching, memoize R"
mathjax: false
webr: true
date: "2026-04-12"
curriculum_id: "4.2.7"
post_type: "C"
auto_link_terms: "memoization in R|memoise|memoization|function caching"
auto_link_case_sensitive: false
sidebar_section: "Learn R"
sidebar_title: "Memoization in R"
sidebar_order: 39
---

# Memoize R Functions: Cache Results and Call Expensive Code Only Once

<p class="lead">Memoization caches the results of a pure function by its inputs, so the second call with the same arguments returns instantly from the cache instead of recomputing. In R, the <code>memoise</code> package turns any function into a memoised version with one line of code.</p>

If your code repeatedly calls the same function with the same arguments — parsing a config, running the same database query, computing a Fibonacci number — memoization is the cheapest possible speedup. You do not rewrite your logic; you just wrap the function. This tutorial covers the idea, the one-liner, and the couple of rules that separate a helpful cache from a subtle bug.

## What Is Memoization and When Should You Use It?

Memoization stores the result of each function call keyed by its arguments. The first call does the real work; every subsequent call with identical arguments skips straight to the answer. It is a space-for-time trade — you spend a little memory to save a lot of compute.

Memoization is the right tool when **all three** of these are true: the function is **pure** (same inputs always give same outputs), it is **expensive** (slow enough that saving the call matters), and it is **called repeatedly** with some overlap in arguments. If any one of those is false, memoization is either wrong (impure functions will cache stale values) or pointless (nothing to skip).

Here is the canonical case. `slow_square` deliberately pauses so the speedup is visible.

```r
slow_square <- function(x) {
  Sys.sleep(0.1)
  x^2
}

# First call is slow, repeat call is just as slow
system.time(slow_square(5))
#>    user  system elapsed
#>   0.000   0.000   0.101

system.time(slow_square(5))
#>    user  system elapsed
#>   0.000   0.000   0.101
```

Two calls, two hundred milliseconds. The second call should have been free — the answer is literally the same. That is what memoization fixes.

[KEY INSIGHT]
**Memoization is "write once, reuse forever" for function calls.** The function body runs exactly once per unique input. Everything after that is a dictionary lookup.

## How Do You Memoise a Function in One Line?

The `memoise` package from Posit provides one function, `memoise::memoise()`, that wraps any function. The wrapper keeps a private cache keyed on the argument list.

```r
library(memoise)

slow_square <- function(x) {
  Sys.sleep(0.1)
  x^2
}

fast_square <- memoise(slow_square)

system.time(fast_square(5))
#>    user  system elapsed
#>   0.000   0.000   0.102

system.time(fast_square(5))
#>    user  system elapsed
#>   0.000   0.000   0.000
```

First call: 100 ms (real work). Second call: 0 ms (cache hit). `fast_square` and `slow_square` are two separate function values — the original is still available untouched if you need it. That is what lets you memoise third-party functions from packages you cannot modify.

**Try it:** Memoise `Sys.sleep` wrapped in a tiny identity function and confirm the second call returns instantly.

```r
library(memoise)
slow_id <- function(x) { Sys.sleep(0.05); x }
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
library(memoise)
slow_id <- function(x) { Sys.sleep(0.05); x }
fast_id <- memoise(slow_id)
system.time(fast_id(1))
system.time(fast_id(1))
#> First call: ~0.05; second call: ~0.000
```

**Explanation:** `memoise` caches on the argument list `list(1)`, so the second call returns the cached value without running the body.

</details>

## How Does Memoization Work Under the Hood?

A memoised function is a closure that owns a hash table. When you call it, it hashes the arguments, looks them up in the table, and either returns the stored answer or runs the real function and stores the new answer.

Here is a pocket implementation. It is not production-quality — `memoise::memoise` handles many edge cases — but it shows the idea in twelve lines.

```r
memoise_simple <- function(f) {
  cache <- new.env(parent = emptyenv())
  function(...) {
    key <- paste(deparse(list(...)), collapse = "")
    if (!exists(key, envir = cache, inherits = FALSE)) {
      assign(key, f(...), envir = cache)
    }
    get(key, envir = cache, inherits = FALSE)
  }
}

slow_double <- function(x) { Sys.sleep(0.05); x * 2 }
fast_double <- memoise_simple(slow_double)

fast_double(10)
#> [1] 20
fast_double(10)  # cache hit
#> [1] 20
```

The factory creates a fresh environment per call to `memoise_simple`, so two different memoised functions have two different caches. The returned closure captures both `f` (the original function) and `cache` (the hash table) in its enclosing environment.

## Why Does Memoization Break Impure Functions?

If a function's output depends on *anything* besides its arguments — current time, a database row, a global variable, a random seed — the cache lies on every call after the first.

```r
library(memoise)

# An impure function: depends on Sys.time()
now <- function() as.numeric(Sys.time())

fast_now <- memoise(now)
fast_now()
#> [1] 1744...

Sys.sleep(0.5)

fast_now()
#> [1] 1744...   # same value — cached, but wrong
```

The cache returned the value from the first call instead of the current timestamp. For pure functions this is exactly what you want; for impure functions it is a silent bug. **Never memoise a function that reaches into the outside world.**

[WARNING]
**Memoising random functions gives you the same "random" number every time.** `memoise(rnorm)(1)` caches the first draw and returns it forever. If randomness is part of your function's contract, do not memoise it — or pass the seed as an explicit argument so different seeds produce different cache entries.

## How Do You Make the Cache Expire?

`memoise` supports a `cache` argument that controls the storage. For caches that should expire or refresh, pass a `cache_filesystem` (persistent across sessions) or use `timeout` to invalidate entries older than N seconds.

```r
library(memoise)

get_config <- memoise(
  function() { Sys.sleep(0.1); list(version = "1.0", debug = TRUE) },
  ~ memoise::timeout(60)  # cache expires after 60 seconds
)

system.time(get_config())
system.time(get_config())
```

The `~ timeout(60)` formula tells `memoise` to key the cache on "which 60-second window am I in". Once the clock ticks past the boundary, the next call recomputes. For most interactive analysis you will never need this — the default in-session cache is plenty.

## Practice Exercises

### Exercise 1: Memoise a Recursive Fibonacci

Write a naive recursive Fibonacci and memoise it. Measure the difference in `system.time()` on `fib(25)`.

```r
library(memoise)
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
library(memoise)

fib_slow <- function(n) {
  if (n < 2) return(n)
  fib_slow(n - 1) + fib_slow(n - 2)
}

fib_fast <- memoise(function(n) {
  if (n < 2) return(n)
  fib_fast(n - 1) + fib_fast(n - 2)
})

system.time(fib_slow(25))
system.time(fib_fast(25))
```

**Explanation:** The naive `fib_slow` recomputes the same subcalls exponentially. Memoised `fib_fast` caches every `n`, so it runs in linear time — often 100x faster.

</details>

### Exercise 2: Detect an Impure Function

Given `random_msg <- function() sample(c("A","B","C"), 1)`, explain why `memoise(random_msg)` is a bad idea.

<details>
<summary>Click to reveal solution</summary>

**Explanation:** `random_msg` is not pure — `sample()` calls R's random number generator, which is stateful. The first call caches whichever value came out, and every subsequent call returns the same cached value, breaking the randomness the caller expects. To memoise "randomness" safely, pass the seed as an explicit argument: `random_msg <- function(seed) { set.seed(seed); sample(c("A","B","C"), 1) }`. Now two different seeds produce two different cache entries.

</details>

## Summary

| Question                          | Answer                                                |
|-----------------------------------|-------------------------------------------------------|
| When is memoization safe?         | The function is pure and expensive.                  |
| How do you apply it in R?         | `memoise::memoise(f)` — one line, returns a new function. |
| What does the cache live in?      | An environment private to the wrapper.               |
| What breaks it?                   | Any side effect or external dependency.             |
| Persistent cache across sessions? | `memoise(..., cache = cache_filesystem(...))`.        |

## References

1. `memoise` package documentation. [Link](https://memoise.r-lib.org/)
2. Wickham, H. — *Advanced R*, 2nd Edition, Chapter 11: Function operators. [Link](https://adv-r.hadley.nz/function-operators.html)
3. Hadley Wickham and Jim Hester — original `memoise` CRAN page. [Link](https://cran.r-project.org/package=memoise)
4. `digest` package — the hashing back-end used by `memoise`. [Link](https://cran.r-project.org/package=digest)
5. Dynamic Programming entry in *The Algorithm Design Manual* (Skiena) — the broader algorithmic context. [Link](https://www.algorist.com/)

## Continue Learning

- [R Function Operators](R-Function-Operators.html) — memoise is an operator; learn the general pattern.
- [R Function Factories](R-Function-Factories.html) — the factory pattern that underlies every memoiser.
- [Functional Programming in R](Functional-Programming-in-R.html) — why pure functions matter for caching to work.
