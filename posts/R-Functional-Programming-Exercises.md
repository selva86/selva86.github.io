---
title: "R Functional Programming Exercises: 10 Practice Problems With Solutions"
slug: "R-Functional-Programming-Exercises"
description: "Ten functional programming exercises for R — map, reduce, filter, closures, composition, memoization. Starter code and fully worked solutions for every problem."
keywords: "R functional programming exercises, R map reduce exercises, R closures exercises, R practice problems, functional R"
mathjax: false
webr: true
date: "2026-04-12"
curriculum_id: "E11.1"
post_type: "EX"
sidebar_title: "Functional Programming (10 problems)"
auto_link_terms: "functional programming exercises|FP exercises R"
auto_link_case_sensitive: false
fr_parent: "Functional-Programming-in-R.html"
---

# R Functional Programming Exercises: 10 Practice Problems With Solutions

<p class="lead">Ten exercises to cement the core functional programming ideas in R — <code>map</code>, <code>Reduce</code>, <code>Filter</code>, closures, function factories, composition, and memoization. Every problem has a starter block and a worked solution.</p>

Each exercise is self-contained. Do them in order — earlier problems build the habits you need for the later ones. Aim to write your answer before opening the solution; the point is the struggle, not the final code.

## Exercise 1: Square the Evens

Using `Filter` and `Map`, return the squares of the even numbers in `1:20` as a single numeric vector.

```r
# your code here
#> Expected: 4 16 36 64 100 144 196 256 324 400
```

<details>
<summary>Click to reveal solution</summary>

```r
unlist(Map(\(x) x^2, Filter(\(x) x %% 2 == 0, 1:20)))
#>  [1]   4  16  36  64 100 144 196 256 324 400
```

**Explanation:** `Filter` keeps the evens, `Map` squares each one, `unlist` flattens the list to a vector. If you prefer purrr: `map_dbl(keep(1:20, \(x) x %% 2 == 0), \(x) x^2)`.

</details>

## Exercise 2: Sum of Log-Squared Positives

Given `x <- c(-3, 1, -1, 2, 4, -5, 8)`, compute `sum(log(x^2))` restricted to positive values, using a pipeline of `Filter`, `Map`, and `Reduce`.

```r
x <- c(-3, 1, -1, 2, 4, -5, 8)
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
x <- c(-3, 1, -1, 2, 4, -5, 8)
Reduce(`+`, Map(\(v) log(v^2), Filter(\(v) v > 0, x)))
#> [1] 8.317766
```

**Explanation:** Filter keeps `c(1, 2, 4, 8)`, Map computes `log(v^2)` on each, Reduce sums them.

</details>

## Exercise 3: Build a Counter Factory

Write `make_counter()` that returns a function which, each time it is called, increments a private counter and returns the current count. Verify three independent counters do not interfere.

```r
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
make_counter <- function() {
  count <- 0
  function() {
    count <<- count + 1
    count
  }
}

a <- make_counter()
b <- make_counter()
a(); a(); a(); b()
#> [1] 1
#> [1] 2
#> [1] 3
#> [1] 1
```

**Explanation:** `<<-` updates `count` in the enclosing environment. Each factory call creates a fresh environment, so `a` and `b` have independent counters.

</details>

## Exercise 4: Compose Functions

Using base R (no purrr), write `compose2(f, g)` that returns a function equivalent to `f(g(x))`. Use it to build `shout` = `toupper` after `trimws` and call it on `"  hello  "`.

```r
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
compose2 <- function(f, g) function(x) f(g(x))
shout <- compose2(toupper, trimws)
shout("  hello  ")
#> [1] "HELLO"
```

**Explanation:** `compose2` returns a closure capturing `f` and `g`. Calling `shout("  hello  ")` runs `trimws` first, then `toupper` on the result.

</details>

## Exercise 5: Memoise a Slow Function

Write a minimal `memoise_simple(f)` that caches results in a private environment. Apply it to `function(x) { Sys.sleep(0.1); x * 2 }` and verify the second call is instant.

```r
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
memoise_simple <- function(f) {
  cache <- new.env(parent = emptyenv())
  function(x) {
    key <- as.character(x)
    if (!exists(key, envir = cache, inherits = FALSE)) {
      assign(key, f(x), envir = cache)
    }
    get(key, envir = cache, inherits = FALSE)
  }
}

slow_double <- function(x) { Sys.sleep(0.1); x * 2 }
fast_double <- memoise_simple(slow_double)

system.time(fast_double(5))  # ~0.1 s
system.time(fast_double(5))  # ~0.0 s
```

**Explanation:** The closure captures `cache` and `f`. First call runs `f` and stores the result; second call hits the cache directly.

</details>

## Exercise 6: Partial Application by Hand

Without `purrr`, write `partial_apply(f, ...)` that fixes the given arguments and returns a new function taking the rest. Use it to build `round2 <- partial_apply(round, digits = 2)`.

```r
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
partial_apply <- function(f, ...) {
  fixed <- list(...)
  function(...) do.call(f, c(fixed, list(...)))
}

round2 <- partial_apply(round, digits = 2)
round2(3.14159)
#> [1] 3.14
```

**Explanation:** `do.call` merges the fixed arguments with whatever arrives at call time and invokes `f`. This is the base R equivalent of `purrr::partial`.

</details>

## Exercise 7: Running Total With `Reduce`

Use `Reduce` with `accumulate = TRUE` to produce the running total of `c(3, 1, 4, 1, 5, 9, 2, 6)`.

```r
# your code here
#> Expected: 3 4 8 9 14 23 25 31
```

<details>
<summary>Click to reveal solution</summary>

```r
Reduce(`+`, c(3, 1, 4, 1, 5, 9, 2, 6), accumulate = TRUE)
#> [1]  3  4  8  9 14 23 25 31
```

**Explanation:** `accumulate = TRUE` returns every intermediate step of the fold — the running total.

</details>

## Exercise 8: Negate a Predicate

Using `Negate` and `Filter`, keep only the strings in `c("cat", "canary", "dog", "cow", "elk")` that do NOT start with `"c"`.

```r
# your code here
#> Expected: "dog" "elk"
```

<details>
<summary>Click to reveal solution</summary>

```r
Filter(Negate(\(s) startsWith(s, "c")), c("cat", "canary", "dog", "cow", "elk"))
#> [1] "dog" "elk"
```

**Explanation:** `Negate` flips the predicate; `Filter` keeps everything for which the flipped predicate is `TRUE`.

</details>

## Exercise 9: Clamp Factory

Write `make_clamp(lo, hi)` that returns a function clamping its numeric input into `[lo, hi]`. Build `clamp_0_1` and test on `c(-0.5, 0.3, 1.5)`.

```r
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
make_clamp <- function(lo, hi) {
  function(x) pmin(pmax(x, lo), hi)
}
clamp_0_1 <- make_clamp(0, 1)
clamp_0_1(c(-0.5, 0.3, 1.5))
#> [1] 0.0 0.3 1.0
```

**Explanation:** The factory captures `lo` and `hi` in its enclosing environment. `pmax` floors at `lo`; `pmin` caps at `hi`.

</details>

## Exercise 10: Full Pipeline

Given a list of orders, filter to those with qty >= 5, compute the line total for each, and sum them — using `Filter`, `Map`, and `Reduce`.

```r
orders <- list(
  list(item = "pen",  qty = 3,  price = 2.0),
  list(item = "pad",  qty = 6,  price = 3.0),
  list(item = "bag",  qty = 2,  price = 25.0),
  list(item = "clip", qty = 10, price = 0.5)
)
# your code here
#> Expected: 23
```

<details>
<summary>Click to reveal solution</summary>

```r
orders <- list(
  list(item = "pen",  qty = 3,  price = 2.0),
  list(item = "pad",  qty = 6,  price = 3.0),
  list(item = "bag",  qty = 2,  price = 25.0),
  list(item = "clip", qty = 10, price = 0.5)
)

Reduce(`+`,
  Map(\(o) o$qty * o$price,
    Filter(\(o) o$qty >= 5, orders)))
#> [1] 23
```

**Explanation:** Filter keeps pad (6) and clip (10); Map computes `6*3 = 18` and `10*0.5 = 5`; Reduce sums to `23`. This is the canonical filter-map-reduce shape.

</details>

## Summary

| Exercise | Technique                  |
|----------|----------------------------|
| 1-2      | Filter/Map/Reduce chains   |
| 3        | Closures with mutable state|
| 4        | Function composition       |
| 5        | Memoization                |
| 6        | Partial application        |
| 7        | Accumulating folds         |
| 8        | Negated predicates         |
| 9        | Function factories         |
| 10       | Full FP pipeline           |

## References

1. Wickham, H. — *Advanced R*, 2nd Edition, Chapter 9: Functionals. [Link](https://adv-r.hadley.nz/functionals.html)
2. `base::funprog` — Reduce, Filter, Map, Negate. [Link](https://rdrr.io/r/base/funprog.html)
3. `memoise` package. [Link](https://memoise.r-lib.org/)
4. `purrr` package. [Link](https://purrr.tidyverse.org/)
5. Hughes, J. — *Why Functional Programming Matters* (1989). [Link](https://www.cs.kent.ac.uk/people/staff/dat/miranda/whyfp90.pdf)

## Continue Learning

- [Functional Programming in R](Functional-Programming-in-R.html) — the parent topic.
- [Reduce, Filter, Map in Base R](Reduce-Filter-Map-in-R.html) — the functional triad.
- [R Function Factories](R-Function-Factories.html) — the pattern used in Exercises 3 and 9.
