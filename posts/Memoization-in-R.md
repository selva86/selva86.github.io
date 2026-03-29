---
title: "Memoization in R: memoise Package — Cache Expensive Functions"
slug: "Memoization-in-R"
description: "Speed up R with memoization. Cache function results using the memoise package. Interactive examples with benchmarks, cache control, and real use cases."
keywords: "R memoization, memoise package, cache functions R, speed up R, R performance, function caching"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "4.2.7"
post_type: "C"
auto_link_terms: "memoization|memoise|cache functions"
auto_link_case_sensitive: false
---

# Memoization in R: memoise Package — Cache Expensive Functions

<p class="lead"><strong>Memoization</strong> caches a function's results so that calling it again with the same arguments returns the cached result instantly. The <code>memoise</code> package makes this a one-line change in R.</p>

If your function is slow and you call it repeatedly with the same inputs, memoization can eliminate redundant computation entirely. The first call computes and stores the result; every subsequent call with the same arguments returns the stored answer in microseconds.

## The Problem: Redundant Computation

```r
# Simulate a slow function (e.g., API call, complex model)
slow_square <- function(x) {
  Sys.sleep(0.5)  # Pretend this takes time
  x^2
}

# Calling it twice with same input wastes time
t1 <- system.time(slow_square(5))
t2 <- system.time(slow_square(5))  # Same input, same wait
cat("First call:", t1["elapsed"], "sec\n")
cat("Second call:", t2["elapsed"], "sec\n")
cat("Total wasted:", t1["elapsed"] + t2["elapsed"], "sec\n")
```

## Basic Memoization with memoise

```r
library(memoise)

slow_square <- function(x) {
  Sys.sleep(0.5)
  x^2
}

# Wrap with memoise — one line change
fast_square <- memoise(slow_square)

# First call: computes and caches
t1 <- system.time(result1 <- fast_square(5))
cat("First call:", t1["elapsed"], "sec, result:", result1, "\n")

# Second call: instant from cache
t2 <- system.time(result2 <- fast_square(5))
cat("Second call:", t2["elapsed"], "sec, result:", result2, "\n")

# Different argument: computes fresh
t3 <- system.time(result3 <- fast_square(10))
cat("New input:", t3["elapsed"], "sec, result:", result3, "\n")
```

> `memoise(f)` returns a new function that behaves identically to `f` but caches results. The cache key is the function arguments — same arguments, same cached result.

## How Memoization Works

```mermaid
graph LR
    A[Call f(x)] --> B{x in cache?}
    B -->|Yes| C[Return cached result]
    B -->|No| D[Compute f(x)]
    D --> E[Store result in cache]
    E --> C
```

The cache is a key-value store:
- **Key**: The function's arguments (hashed)
- **Value**: The computed result

```r
library(memoise)

# Simple example showing cache behavior
counter <- 0
tracked_fn <- function(x) {
  counter <<- counter + 1
  x * 10
}

memo_fn <- memoise(tracked_fn)

memo_fn(5)   # Computes: counter = 1
memo_fn(5)   # Cached: counter still 1
memo_fn(10)  # Computes: counter = 2
memo_fn(5)   # Cached: counter still 2

cat("Function was actually called", counter, "times\n")
cat("But memo_fn was called 4 times\n")
```

## When to Memoize

Memoization works best when a function is:

| Condition | Why it matters |
|-----------|---------------|
| **Pure** (same input → same output) | Cached results must be correct next time |
| **Expensive** (slow to compute) | Otherwise caching overhead isn't worth it |
| **Called repeatedly with same args** | No reuse = no benefit |
| **Results fit in memory** | Large results bloat the cache |

Functions that should NOT be memoized:
- Functions with side effects (printing, writing files, database updates)
- Functions that depend on external state (current time, random numbers)
- Functions with very large return values that would exhaust memory

## Cache Management

### Clearing the Cache

```r
library(memoise)

fn <- memoise(\(x) { cat("Computing...\n"); x^2 })

fn(5)   # Computing...
fn(5)   # Cached (no output)

# Clear all cached results
forget(fn)

fn(5)   # Computing... (recomputed)
```

### Checking if a Result is Cached

```r
library(memoise)

fn <- memoise(\(x) x + 1)
fn(10)

cat("Is fn memoised?", is.memoised(fn), "\n")
cat("Has fn(10) been cached?", has_cache(fn)(10), "\n")
cat("Has fn(20) been cached?", has_cache(fn)(20), "\n")
```

## Practical Examples

### Caching API Responses

```r
library(memoise)

# Simulate an API call
fetch_user <- function(id) {
  Sys.sleep(0.3)  # Network delay
  list(id = id, name = paste("User", id), score = sample(100, 1))
}

cached_fetch <- memoise(fetch_user)

# First call: slow
t1 <- system.time(u1 <- cached_fetch(42))
cat("First:", t1["elapsed"], "sec —", u1$name, "\n")

# Repeated calls: instant
t2 <- system.time(u2 <- cached_fetch(42))
cat("Cached:", t2["elapsed"], "sec —", u2$name, "\n")
```

### Caching Recursive Functions (Fibonacci)

```r
library(memoise)

# Naive recursive fibonacci (exponentially slow)
fib_slow <- function(n) {
  if (n <= 1) return(n)
  fib_slow(n - 1) + fib_slow(n - 2)
}

# Memoized version (linear time)
fib <- memoise(function(n) {
  if (n <= 1) return(n)
  fib(n - 1) + fib(n - 2)
})

cat("fib(10):", fib(10), "\n")
cat("fib(20):", fib(20), "\n")
cat("fib(30):", fib(30), "\n")

# Compare speed
t_slow <- system.time(fib_slow(25))
forget(fib)
t_fast <- system.time(fib(25))
cat("\nSlow fib(25):", t_slow["elapsed"], "sec\n")
cat("Memo fib(25):", t_fast["elapsed"], "sec\n")
```

## DIY Memoization (Without memoise)

You can implement basic memoization with an environment as a cache.

```r
make_memo <- function(f) {
  cache <- new.env(parent = emptyenv())
  function(...) {
    key <- paste(..., sep = "_")
    if (exists(key, envir = cache)) {
      return(get(key, envir = cache))
    }
    result <- f(...)
    assign(key, result, envir = cache)
    result
  }
}

slow_fn <- function(x) { Sys.sleep(0.3); x^2 }
memo_fn <- make_memo(slow_fn)

t1 <- system.time(memo_fn(5))
t2 <- system.time(memo_fn(5))
cat("First:", t1["elapsed"], "sec\n")
cat("Cached:", t2["elapsed"], "sec\n")
```

## Practice Exercises

### Exercise 1: Memoize a Computation

Create a function that simulates an expensive calculation and memoize it.

```r
library(memoise)

# Create a function that: takes a number, sleeps 0.2 sec, returns its factorial
# Memoize it and verify the cache works

```

<details>
<summary>Click to reveal solution</summary>

```r
library(memoise)

slow_factorial <- function(n) {
  Sys.sleep(0.2)
  factorial(n)
}

fast_factorial <- memoise(slow_factorial)

# First calls compute
for (n in c(5, 10, 5, 10, 15)) {
  t <- system.time(r <- fast_factorial(n))
  cached <- if (t["elapsed"] < 0.1) "CACHED" else "COMPUTED"
  cat(sprintf("n=%2d: %s (%.3fs) = %s\n", n, cached, t["elapsed"], format(r, big.mark=",")))
}
```

**Explanation:** The first call for each unique `n` computes and caches. Subsequent calls with the same `n` return instantly from cache.

</details>

## Summary

| Feature | Function | Description |
|---------|----------|-------------|
| Memoize | `memoise(f)` | Wrap function with cache |
| Clear cache | `forget(f)` | Remove all cached results |
| Check cache | `has_cache(f)(args)` | Test if specific args are cached |
| Check memoized | `is.memoised(f)` | Test if function is memoized |

## FAQ

### Does memoization use a lot of memory?

It depends on the size of results being cached. Each unique set of arguments stores one result. For small return values (numbers, short strings), memory is minimal. For large objects (data frames, model objects), the cache can grow quickly. Use `forget()` to clear when done.

### Can I memoize functions from packages?

Yes. `memoise(stats::lm)` would cache linear model fits. But be careful — model-fitting functions may depend on mutable data, making cached results stale.

### Is memoization the same as caching?

Memoization is a specific type of caching: caching function results based on their arguments. General caching can store anything anywhere. Memoization is automatic, transparent, and tied to a specific function.

## What's Next?

- [R Function Operators](/R-Function-Operators.html) — other ways to transform functions
- [Writing Composable R Code](/Writing-Composable-R-Code.html) — pipes, functions, and architecture
- [Functional Programming in R](/Functional-Programming-in-R.html) — the FP foundation
