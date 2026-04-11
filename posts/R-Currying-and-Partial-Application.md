---
title: "R Currying and Partial Application: purrr::partial() and Friends"
slug: "R-Currying-and-Partial-Application"
description: "Currying turns a multi-argument function into a chain of one-argument functions. Partial application fixes some arguments and returns a new function. Here is how both work in R."
keywords: "R currying, partial application R, purrr partial, R functional programming, R higher order functions"
mathjax: false
webr: true
date: "2026-04-12"
curriculum_id: "FR-func-2"
post_type: "FR"
auto_link_terms: "currying|partial application|purrr::partial"
auto_link_case_sensitive: false
fr_parent: "R-Function-Operators.html"
---

# R Currying and Partial Application: purrr::partial() and Friends

<p class="lead">Currying rewrites <code>f(x, y, z)</code> as <code>f(x)(y)(z)</code> — a chain of single-argument functions. Partial application is the weaker cousin: fix <em>some</em> arguments in advance and return a new function that takes the rest. Both are one-liners in R.</p>

These two techniques come from lambda calculus and Haskell, where they are the default calling convention. R does not curry automatically, but it gives you everything needed to simulate it in a handful of lines. And the practical version — partial application — is something you will reach for constantly once you know how.

## What Is Currying vs. Partial Application?

Currying is a mathematical transformation. A function of `n` arguments becomes `n` nested single-argument functions. Partial application is an operational move: you call the function with some arguments now and save the rest for later.

```r
# Uncurried: normal R function
add3 <- function(x, y, z) x + y + z
add3(1, 2, 3)
#> [1] 6

# Curried: chain of one-argument functions
add3_curried <- function(x) function(y) function(z) x + y + z
add3_curried(1)(2)(3)
#> [1] 6

# Partially applied: fix x and y, leave z
add_1_2 <- function(z) add3(1, 2, z)
add_1_2(3)
#> [1] 6
```

Three shapes, one answer. Currying is pure — every intermediate step is itself a function. Partial application is pragmatic — it collapses the intermediate steps into "fix this now, call later". In practice, partial application is what you want 95% of the time.

[KEY INSIGHT]
**Partial application turns generic functions into task-specific ones.** When you write `round2 <- partial(round, digits = 2)`, you are saying "this is the `round` function I will use in *this* pipeline" — no more repeating `digits = 2` at every call site.

## How Do You Curry a Function in Base R?

Manually, you nest one-argument functions. Programmatically, you can write a `curry` helper that transforms any function.

```r
curry <- function(f) {
  function(x) function(y) f(x, y)
}

multiply <- function(x, y) x * y
multiply_curried <- curry(multiply)

double <- multiply_curried(2)
double(10)
#> [1] 20

triple <- multiply_curried(3)
triple(10)
#> [1] 30
```

The helper only handles two-argument functions; a general version for `n` arguments needs `Reduce` or recursion. Full currying is rarely worth the code in R because the language has better tools for the same job — which brings us to partial application.

## How Do You Partially Apply With `purrr::partial()`?

`purrr::partial()` is the canonical way to fix arguments. It takes a function and a named subset of its arguments, and returns a new function that takes the rest.

```r
library(purrr)

round2 <- partial(round, digits = 2)
round2(3.14159)
#> [1] 3.14

round4 <- partial(round, digits = 4)
round4(3.14159)
#> [1] 3.1416
```

`round2` is "round with `digits = 2` baked in". You can now pass it to `sapply`, `map`, or anywhere else you need a one-argument rounder. No lambda, no wrapper function, no noise.

```r
# Before: wrapping in an anonymous function
sapply(c(3.14159, 2.71828), \(x) round(x, digits = 2))
#> [1] 3.14 2.72

# After: partial application
sapply(c(3.14159, 2.71828), partial(round, digits = 2))
#> [1] 3.14 2.72
```

The second form is shorter and reads left-to-right: "sapply this vector with `round`-digits-2".

**Try it:** Use `partial()` to create a `log10_round <- partial(log, base = 10)` and compute it for `c(1, 10, 100)`.

```r
library(purrr)
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
library(purrr)
log10_round <- partial(log, base = 10)
log10_round(c(1, 10, 100))
#> [1] 0 1 2
```

**Explanation:** `partial(log, base = 10)` returns a function equivalent to `\(x) log(x, base = 10)`.

</details>

## Why Bother When You Can Just Write a Lambda?

Because `partial` captures *intent* better than a lambda does. A lambda says "here is some code"; `partial(f, x = ..., y = ...)` says "here is `f` with these arguments pre-filled". When scanning code weeks later, the partial version tells you at a glance what the specialised function is.

```r
library(purrr)

# Lambda: you have to read the body to know the intent
gt_zero <- \(x) x > 0

# Partial: the purpose is in the name
gt_zero <- partial(`>`, e2 = 0)
```

It also composes more cleanly with `compose()` and with pipelines — since the result is a plain function, it can flow through anything that expects a function.

[TIP]
**Partial application and function factories are the same idea.** A factory like `make_adder(5)` is exactly `partial(` `` `+` ``, `e2 = 5)`. The factory gives you a custom wrapper per specialisation; `partial` gives you a general tool that works for any function.

## How Do You Partially Apply in Base R?

If you do not want a `purrr` dependency, `functional::Curry` once served this purpose, but the package is archived. A tiny helper does the job:

```r
partial_base <- function(f, ...) {
  fixed <- list(...)
  function(...) do.call(f, c(fixed, list(...)))
}

round2 <- partial_base(round, digits = 2)
round2(3.14159)
#> [1] 3.14
```

`do.call(f, c(fixed, list(...)))` merges the fixed arguments with whatever you pass at call time. For most everyday needs this is enough; `purrr::partial` adds niceties like lazy evaluation and named-argument inspection.

## Practice Exercises

### Exercise 1: Build a Clamper With Partial Application

Use `partial()` (or your own helper) to build `clamp_0_100` from a generic `clamp(x, lo, hi)` function.

```r
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
library(purrr)
clamp <- function(x, lo, hi) pmin(pmax(x, lo), hi)
clamp_0_100 <- partial(clamp, lo = 0, hi = 100)
clamp_0_100(c(-5, 50, 150))
#> [1]   0  50 100
```

**Explanation:** `partial` burns `lo = 0, hi = 100` into the closure; the returned function takes only `x`.

</details>

### Exercise 2: Curried Multiplier

Write a manually curried `multiply(x)(y)` and use it to create `times7`, then apply to `1:5`.

```r
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
multiply <- function(x) function(y) x * y
times7 <- multiply(7)
times7(1:5)
#> [1]  7 14 21 28 35
```

**Explanation:** `multiply(7)` returns a closure capturing `x = 7`; calling it with `1:5` runs `7 * 1:5`.

</details>

## Summary

| Concept            | What it does                              | How                          |
|--------------------|-------------------------------------------|------------------------------|
| Currying           | Chain of one-argument functions           | Manual nesting or `curry()`  |
| Partial application| Fix some arguments, return new function   | `purrr::partial(f, arg = x)` |
| Factory shortcut   | Same as partial, but handwritten          | `make_X <- function(p) ...`  |

## References

1. Wickham, H. — *Advanced R*, 2nd Edition, Chapter 10: Function factories. [Link](https://adv-r.hadley.nz/function-factories.html)
2. `purrr::partial` documentation. [Link](https://purrr.tidyverse.org/reference/partial.html)
3. Hudak, P. et al. — *A History of Haskell* (on currying as default). [Link](https://haskell.org/)
4. `rlang` — language tools for partial application and NSE. [Link](https://rlang.r-lib.org/)
5. Chambers, J. M. — *Extending R*. CRC Press (2016).

## Continue Learning

- [R Function Factories](R-Function-Factories.html) — the pattern that generates partial applications.
- [R Function Operators](R-Function-Operators.html) — the parent topic.
- [Functional Programming in R](Functional-Programming-in-R.html) — the mindset.
