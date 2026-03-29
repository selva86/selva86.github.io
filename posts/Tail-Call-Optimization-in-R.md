---
title: "Tail Call Optimization in R: Recursive Functions Without Stack Overflow"
slug: "Tail-Call-Optimization-in-R"
description: "R doesn't optimize tail calls, but you can avoid stack overflows with trampolining, Recall(), and iterative rewrites. Practical solutions for deep recursion."
keywords: "R tail call optimization, R recursion, stack overflow R, trampoline R, Recall function, deep recursion R"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "FR-func-3"
post_type: "FR"
auto_link_terms: "tail call optimization|tail recursion|stack overflow R"
auto_link_case_sensitive: false
fr_parent: "Functional-Programming-in-R.html"
---

# Tail Call Optimization in R: Recursive Functions Without Stack Overflow

<p class="lead">R does <strong>not</strong> perform tail call optimization (TCO). Deep recursion will crash with a stack overflow. This tutorial shows three workarounds: converting to iteration, using trampolines, and increasing the stack limit.</p>

A recursive function calls itself. In languages with TCO (like Scheme or Haskell), tail-recursive functions use constant stack space. R isn't one of those languages — every recursive call adds a frame to the call stack, and R's default limit is about 1,000 frames.

## The Problem: Stack Overflow

```r
# This will crash for large n
factorial_recursive <- function(n) {
  if (n <= 1) return(1)
  n * factorial_recursive(n - 1)
}

# Works for small n
cat("10!:", factorial_recursive(10), "\n")

# Stack overflow for large n (don't run with n > 900)
# factorial_recursive(10000)  # Error: C stack usage is too close to the limit
```

## What Is Tail Call Optimization?

A function call is in **tail position** when it's the last thing the function does before returning. With TCO, the runtime reuses the current stack frame instead of creating a new one.

```r
# NOT tail recursive: multiplication happens AFTER the recursive call
factorial_not_tail <- function(n) {
  if (n <= 1) return(1)
  n * factorial_not_tail(n - 1)  # Must multiply after return
}

# Tail recursive form: the recursive call IS the last operation
factorial_tail <- function(n, acc = 1) {
  if (n <= 1) return(acc)
  factorial_tail(n - 1, n * acc)  # Nothing left to do after this
}

cat("Tail form, 10!:", factorial_tail(10), "\n")
# But R still uses O(n) stack space — TCO doesn't happen!
```

## Solution 1: Convert to Iteration

The most reliable fix. Any tail-recursive function can be mechanically converted to a while loop.

```r
# Iterative factorial — no recursion, no stack issues
factorial_iter <- function(n) {
  acc <- 1
  while (n > 1) {
    acc <- acc * n
    n <- n - 1
  }
  acc
}

cat("factorial_iter(10):", factorial_iter(10), "\n")
cat("factorial_iter(100):", format(factorial_iter(100), scientific = TRUE), "\n")
# Works for any n (limited only by numeric overflow, not stack)
```

```r
# Iterative Fibonacci
fib_iter <- function(n) {
  if (n <= 1) return(n)
  a <- 0; b <- 1
  for (i in 2:n) {
    temp <- a + b
    a <- b
    b <- temp
  }
  b
}

cat("fib(10):", fib_iter(10), "\n")
cat("fib(30):", fib_iter(30), "\n")
cat("fib(50):", fib_iter(50), "\n")
```

## Solution 2: Trampolining

A trampoline converts recursive calls into a loop that repeatedly calls returned functions until a final value is reached.

```r
# Trampoline: keeps calling the result until it's not a function
trampoline <- function(f, ...) {
  result <- f(...)
  while (is.function(result)) {
    result <- result()
  }
  result
}

# Trampolined factorial
factorial_tramp <- function(n, acc = 1) {
  if (n <= 1) return(acc)
  # Return a THUNK (zero-argument function) instead of recursing
  function() factorial_tramp(n - 1, n * acc)
}

cat("Trampolined 10!:", trampoline(factorial_tramp, 10), "\n")
cat("Trampolined 100!:", format(trampoline(factorial_tramp, 100), scientific = TRUE), "\n")
```

## Solution 3: Recall() for Self-Reference

`Recall()` calls the current function. It doesn't solve the stack problem, but it makes recursive functions more robust to renaming.

```r
# Recall() is syntactic sugar for calling the current function
countdown <- function(n) {
  cat(n, "")
  if (n > 0) Recall(n - 1)
}

countdown(5)
cat("\n")
```

## Solution 4: Memoization for Overlapping Subproblems

When recursion recomputes the same values (like Fibonacci), memoization eliminates redundant work.

```r
library(memoise)

fib <- memoise(function(n) {
  if (n <= 1) return(n)
  fib(n - 1) + fib(n - 2)
})

cat("fib(10):", fib(10), "\n")
cat("fib(30):", fib(30), "\n")
```

## When to Use Each Approach

| Approach | Best for | Limitation |
|----------|----------|------------|
| Iteration (while/for) | Any recursive algorithm | Requires manual rewrite |
| Trampolining | Tail-recursive algorithms | Overhead of thunk creation |
| Memoization | Overlapping subproblems (DP) | Memory for cache |
| Increase stack limit | Quick fix for moderate depth | Still finite; fragile |

## Practice Exercises

### Exercise 1: Convert Recursion to Iteration

Convert this recursive `sum_to(n)` function to an iterative version.

```r
# Recursive (crashes for large n)
sum_to_recursive <- function(n) {
  if (n <= 0) return(0)
  n + sum_to_recursive(n - 1)
}

cat("sum_to(10):", sum_to_recursive(10), "\n")

# Write sum_to_iter using a while loop

```

<details>
<summary>Click to reveal solution</summary>

```r
sum_to_iter <- function(n) {
  total <- 0
  while (n > 0) {
    total <- total + n
    n <- n - 1
  }
  total
}

cat("Iterative sum_to(10):", sum_to_iter(10), "\n")
cat("Iterative sum_to(10000):", sum_to_iter(10000), "\n")

# Verify: n*(n+1)/2
cat("Formula check:", 10000 * 10001 / 2, "\n")
```

**Explanation:** Replace the recursive call with a while loop that updates an accumulator. The tail-recursive pattern `f(n-1, acc+n)` maps directly to `acc <- acc + n; n <- n - 1`.

</details>

## Summary

| Concept | R Support |
|---------|-----------|
| Tail call optimization | Not supported |
| Default stack depth | ~1,000 frames |
| `Recall()` | Syntactic sugar for self-call |
| Trampoline | Manual implementation |
| Best practice | Convert to iteration |

## FAQ

### Will R ever support tail call optimization?

There are no plans to add TCO to R. The interpreter architecture would need significant changes. The R Core team recommends using iteration for deep recursion.

### What is R's stack limit?

R's default C stack limit is typically 8 MB. You can check with `Cstack_info()`. The `options(expressions = N)` setting controls the number of nested expressions allowed (default ~5000).

### Is recursion ever appropriate in R?

Yes — for tree traversals, divide-and-conquer algorithms, and problems with natural recursive structure, as long as the depth stays under ~500. Combine with memoization for dynamic programming problems.

## What's Next?

- [Functional Programming in R](/Functional-Programming-in-R.html) — the parent tutorial
- [Memoization in R](/Memoization-in-R.html) — cache recursive function results
- [R Function Factories](/R-Function-Factories.html) — closures and environment capture
