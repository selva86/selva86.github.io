---
title: "Tail Call Optimization in R: Why Deep Recursion Blows the Stack"
slug: "Tail-Call-Optimization-in-R"
description: "R does not perform tail call optimization, so deep recursion blows the stack. Learn what TCO is, why R skips it, and three practical workarounds: iteration, trampolines, and Reduce."
keywords: "tail call optimization R, R recursion stack overflow, R TCO, trampoline R, R recursion to iteration"
mathjax: false
webr: true
date: "2026-04-12"
curriculum_id: "FR-func-3"
post_type: "FR"
auto_link_terms: "tail call optimization|TCO|recursion in R|stack overflow R"
auto_link_case_sensitive: false
fr_parent: "Functional-Programming-in-R.html"
---

# Tail Call Optimization in R: Why Deep Recursion Blows the Stack

<p class="lead">Tail call optimization (TCO) is a compiler trick that reuses the current stack frame when a function's last action is to call itself. Scheme and Haskell do it; R does not. This post explains why, and shows three ways to write recursive-looking R code that still handles huge inputs.</p>

Write a naive recursive factorial in R, call it with `n = 100000`, and R throws `Error: C stack usage ... is too close to the limit`. The same recursion in Scheme runs forever without a hiccup, because Scheme converts tail calls into jumps rather than stack pushes. R keeps every call frame alive until the recursion unwinds, so deep recursion hits a hard ceiling — typically a few thousand frames.

## What Is a Tail Call, Exactly?

A tail call is a function call that is the **last** thing a function does before returning. If the result of the recursive call is returned directly, with no extra work, it is a tail call. If there is any pending operation — an addition, a multiplication, anything — it is not.

```r
# Tail call: the recursive call's result is returned directly
count_down_tco <- function(n) {
  if (n <= 0) return("done")
  count_down_tco(n - 1)          # nothing left to do after this returns
}

# NOT a tail call: the result is multiplied before being returned
factorial_naive <- function(n) {
  if (n <= 1) return(1)
  n * factorial_naive(n - 1)     # must wait for result, then multiply
}
```

The naive factorial cannot be tail-optimized even in Scheme. Each call has to wait for the inner result, multiply by `n`, and return — so the stack frame has to stay alive. The "tail call" version of factorial uses an accumulator to move the multiplication *before* the recursive call.

[KEY INSIGHT]
**Tail position means "nothing left to do".** If a function's return value is literally "whatever the recursive call returns", the current frame is useless once the call is made — a TCO-aware language discards it. Without TCO, the language keeps the dead frame alive anyway, which is why R's recursion is shallow.

## Why Does R Skip Tail Call Optimization?

R's evaluator is designed around **lazy evaluation** and **environment frames**: every function call creates an environment, arguments are promises, and the debugger (`traceback`) relies on the full stack being intact. TCO would require either eagerly discarding frames (breaking `traceback`) or adding a whole new calling convention.

The R Core team has discussed TCO repeatedly; it has been judged not worth the complexity. See R-devel archives for the long version. The practical upshot: if your recursion might go deeper than a few thousand levels, rewrite it.

## Workaround 1: Rewrite as a Loop

The simplest fix is also the most boring: a `while` or `for` loop with an accumulator. Loops never touch the stack, so they scale to any input.

```r
# Factorial as a loop — handles any n (up to numerical overflow)
factorial_iter <- function(n) {
  result <- 1
  for (i in seq_len(n)) {
    result <- result * i
  }
  result
}

factorial_iter(10)
#> [1] 3628800
```

Twenty years of FP tutorials make loops feel unclean — but in R they are the performant, idiomatic choice. Save recursion for cases where the problem is *naturally* recursive (tree traversal, divide-and-conquer) and the depth is bounded.

## Workaround 2: Use a Trampoline

A **trampoline** is a small loop that repeatedly calls a function which returns either a result or the next call to make. The recursion becomes data — a function value that the trampoline keeps invoking until it returns something non-function.

```r
trampoline <- function(f, ...) {
  result <- f(...)
  while (is.function(result)) {
    result <- result()
  }
  result
}

# "Recursive" countdown that returns a thunk instead of self-calling
count_down <- function(n, acc = 0) {
  if (n <= 0) return(acc)
  function() count_down(n - 1, acc + 1)
}

trampoline(count_down, 100000)
#> [1] 100000
```

`count_down(1, 0)` does not call itself — it returns a **thunk** (a zero-arg function) that, when called, will do the next step. The trampoline invokes the thunk, gets another thunk, invokes that, and so on. The stack depth stays at 1 forever. This is how you simulate TCO by hand.

[TIP]
**Trampolines are ideal for interpreters and state machines.** If you are writing a small language inside R, or a turn-based simulation, the trampoline pattern lets you write recursive code that scales. For everyday work, a loop is simpler.

## Workaround 3: Use `Reduce()` for Accumulations

Many recursions are really "fold this function across a list" — and R has a built-in fold called `Reduce`. Instead of recursion, express the accumulation declaratively and let `Reduce` handle the iteration.

```r
# Instead of recursive sum:
sum_recursive <- function(xs) {
  if (length(xs) == 0) return(0)
  xs[1] + sum_recursive(xs[-1])  # not tail, and O(n^2) because of xs[-1]
}

# Use Reduce:
Reduce(`+`, 1:100000)
#> [1] 5000050000
```

`Reduce(`+`, 1:100000)` runs in a simple loop inside C code — fast, stack-safe, and idiomatic. Many "naturally recursive" problems collapse into a `Reduce` once you stare at them. Ask yourself: is my recursion really "start with an accumulator, walk the list, fold each element in"? If yes, `Reduce` is the answer.

**Try it:** Rewrite `factorial_iter` using `Reduce(`*`, seq_len(n))` and test on `10`.

```r
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
factorial_reduce <- function(n) Reduce(`*`, seq_len(n), accumulate = FALSE)
factorial_reduce(10)
#> [1] 3628800
```

**Explanation:** `Reduce(`*`, 1:10)` chains multiplications: `1*2*3*...*10`. No recursion, no stack growth.

</details>

## When Is Recursion Still OK in R?

Recursion is fine when the depth is naturally bounded. Walking a tree of 30 levels, parsing nested parentheses 20 deep, or dividing a sorted array (binary search: `log2(n)` deep) are all trivially safe — the stack never exceeds a few dozen frames.

```r
# Binary search: log2(1e6) = 20 frames deep — totally fine
binary_search <- function(xs, target, lo = 1, hi = length(xs)) {
  if (lo > hi) return(NA_integer_)
  mid <- (lo + hi) %/% 2
  if      (xs[mid] == target) mid
  else if (xs[mid] <  target) binary_search(xs, target, mid + 1, hi)
  else                        binary_search(xs, target, lo, mid - 1)
}

binary_search(1:1e6, 500000)
#> [1] 500000
```

Twenty stack frames is nothing — the issue only shows up at thousands. Know which regime you are in.

## Practice Exercises

### Exercise 1: Convert Naive Fibonacci to a Loop

Rewrite naive recursive Fibonacci as a loop with two running variables. Test `fib(30)`.

```r
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
fib_loop <- function(n) {
  if (n < 2) return(n)
  a <- 0; b <- 1
  for (i in seq_len(n - 1)) {
    tmp <- a + b
    a <- b
    b <- tmp
  }
  b
}
fib_loop(30)
#> [1] 832040
```

**Explanation:** Two-variable accumulator walks up from `(0, 1)` to `(F_{n-1}, F_n)` in `n-1` steps — no recursion, no stack.

</details>

### Exercise 2: Reduce for Running Maximum

Use `Reduce(pmax, xs, accumulate = TRUE)` on `c(3, 1, 4, 1, 5, 9, 2, 6)` to produce the cumulative running max.

```r
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
Reduce(pmax, c(3, 1, 4, 1, 5, 9, 2, 6), accumulate = TRUE)
#> [1] 3 3 4 4 5 9 9 9
```

**Explanation:** `accumulate = TRUE` emits every intermediate step; `pmax` keeps the larger of the running value and the next element.

</details>

## Summary

| Approach             | Stack-safe? | When to use                          |
|----------------------|:-----------:|--------------------------------------|
| Naive recursion      | No          | Only when depth is bounded (<~1000)  |
| `for` / `while` loop | Yes         | Default for accumulations in R       |
| Trampoline           | Yes         | Simulating TCO, interpreters         |
| `Reduce()`           | Yes         | Fold-shaped problems                 |

## References

1. Wickham, H. — *Advanced R*, 2nd Edition, Chapter 9: Functionals. [Link](https://adv-r.hadley.nz/functionals.html)
2. R-devel mailing list — TCO discussions. [Link](https://stat.ethz.ch/pipermail/r-devel/)
3. Abelson and Sussman — *Structure and Interpretation of Computer Programs*, section on tail recursion. [Link](https://mitpress.mit.edu/sicp/)
4. Steele, G. L. — *Debunking the "Expensive Procedure Call" Myth* (1977). The original TCO paper.
5. `Recall()` in base R — the function for naming-independent recursion. [Link](https://rdrr.io/r/base/Recall.html)

## Continue Learning

- [Functional Programming in R](Functional-Programming-in-R.html) — the broader mindset and parent topic.
- [Reduce, Filter, Map in Base R](Reduce-Filter-Map-in-R.html) — the fold that often replaces recursion.
- [Writing Composable R Code](Writing-Composable-R-Code.html) — composition patterns that sidestep deep recursion.
