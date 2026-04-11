---
title: "Base R's Functional Triad: Reduce(), Filter(), Map() — Without purrr"
slug: "Reduce-Filter-Map-in-R"
description: "Base R already ships with Reduce(), Filter(), Map() — the functional triad. Learn when they beat purrr, and how to get the same work done with zero dependencies."
keywords: "base R Reduce, base R Filter, base R Map, R functional triad, R without purrr, base R functional programming"
mathjax: false
webr: true
date: "2026-04-12"
curriculum_id: "4.2.6"
post_type: "C"
auto_link_terms: "base R Reduce|base R Filter|base R Map|functional triad"
auto_link_case_sensitive: false
sidebar_section: "Learn R"
sidebar_title: "Reduce, Filter, Map (Base R)"
sidebar_order: 38
---

# Base R's Functional Triad: Reduce(), Filter(), Map() — Without purrr

<p class="lead">Base R ships with <code>Reduce()</code>, <code>Filter()</code>, and <code>Map()</code> — three higher-order functions that together replace most loops. You never have to install purrr to write clean functional code.</p>

Every tutorial teaches `purrr::map` and `purrr::reduce`. Far fewer mention that base R has shipped the same three building blocks since forever, under the names `Map`, `Filter`, and `Reduce`. For scripts you want to run on a vanilla R install, for package code where every dependency hurts, or for the satisfaction of knowing what purrr is doing under the hood — this is the tutorial for you.

## What Are the Three Functions and What Do They Do?

The functional triad has one job each. `Map` walks a collection and transforms every element. `Filter` walks a collection and keeps only the elements matching a predicate. `Reduce` walks a collection and collapses it to a single value using a binary function.

```r
nums <- 1:5

Map(\(x) x^2, nums)
#> [[1]]
#> [1] 1
#>
#> [[2]]
#> [1] 4
#>
#> [[3]]
#> [1] 9
#>
#> [[4]]
#> [1] 16
#>
#> [[5]]
#> [1] 25

Filter(\(x) x %% 2 == 0, nums)
#> [1] 2 4

Reduce(`+`, nums)
#> [1] 15
```

Three lines, three shapes of answer: a list of squares, a filtered vector of evens, and a single sum. The same input flows through all three. Notice `Map` always returns a *list* — like `lapply`, not like `sapply`. If you want a vector back, wrap the result in `unlist()` or use `sapply()` instead.

[KEY INSIGHT]
**Reduce, Filter, Map = "combine, keep, transform" — and they cover most loops.** If your loop accumulates a total, use `Reduce`. If it builds a keep-list, use `Filter`. If it produces one output per input, use `Map` or `sapply`. These three shapes handle the majority of imperative R code you will ever write.

## How Is `Reduce()` Different From a `for` Loop?

`Reduce(f, xs)` applies a two-argument function `f` repeatedly, starting with `f(xs[1], xs[2])`, then `f(result, xs[3])`, and so on. The final return value is whatever is left at the end.

```r
# Running total
Reduce(`+`, c(10, 20, 30, 40))
#> [1] 100

# Building a cumulative result with accumulate = TRUE
Reduce(`+`, c(10, 20, 30, 40), accumulate = TRUE)
#> [1]  10  30  60 100

# Starting from an initial value
Reduce(`+`, c(10, 20, 30), init = 1000)
#> [1] 1060
```

The `init` argument gives you a starting value when the collection is empty or when the first call should use a non-obvious seed. The `accumulate = TRUE` argument returns every intermediate step rather than just the final one — handy for debugging or for building running totals.

**Try it:** Use `Reduce(paste, ..., accumulate = TRUE)` on `c("a", "b", "c", "d")` to see every intermediate concatenation.

```r
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
Reduce(paste, c("a", "b", "c", "d"), accumulate = TRUE)
#> [1] "a"       "a b"     "a b c"   "a b c d"
```

**Explanation:** Each step adds the next element to the running string, and `accumulate = TRUE` returns the list of every step.

</details>

## When Should You Use `Filter()` Instead of Logical Subsetting?

`Filter(predicate, xs)` is equivalent to `xs[sapply(xs, predicate)]` for atomic vectors and to element-wise predicate checks on lists. The difference is readability: `Filter` says "keep the ones where the predicate is TRUE" without making you write a second expression for the subsetting.

```r
grades <- list(alice = 92, bob = 55, cara = 78, dave = 48)

# Filter on a list: returns a (smaller) list
Filter(\(g) g >= 60, grades)
#> $alice
#> [1] 92
#>
#> $cara
#> [1] 78

# On a vector, returns a vector
Filter(\(g) g >= 60, c(92, 55, 78, 48))
#> [1] 92 78
```

For data frames you typically stick with `[` and logical indexing, but `Filter` is unbeatable for lists whose elements are arbitrary objects — each element might be a model, a plot, a nested list — and subsetting by a predicate means "keep the ones that pass this check".

## How Do You Map Over Multiple Inputs in Parallel?

`Map` accepts *multiple* collections, walking them in parallel and passing the positional elements to the function. This is base R's answer to `mapply` and `purrr::map2`.

```r
xs <- c(1, 2, 3)
ys <- c(10, 20, 30)

Map(`+`, xs, ys)
#> [[1]]
#> [1] 11
#>
#> [[2]]
#> [1] 22
#>
#> [[3]]
#> [1] 33
```

`Map(`+`, xs, ys)` calls `xs[1] + ys[1]`, then `xs[2] + ys[2]`, and so on. Unlike `mapply`, `Map` always returns a list — no simplification to matrix or vector. Use `unlist()` or `sapply`/`mapply` if you want simplification.

**Try it:** Use `Map(paste, ...)` to combine `c("Monday", "Tuesday")` and `c("rain", "sun")` into one list of length-2 strings.

```r
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
Map(paste, c("Monday", "Tuesday"), c("rain", "sun"))
#> $Monday
#> [1] "Monday rain"
#>
#> $Tuesday
#> [1] "Tuesday sun"
```

**Explanation:** `Map` walks both vectors position by position; the names of the result come from the first vector.

</details>

## How Do the Three Functions Compose?

The real power shows up when you chain them. A "filter, map, reduce" pipeline is one of the most common shapes in functional programming — "keep what I care about, transform those, then total them".

```r
orders <- list(
  list(item = "pen",  qty = 3,  price = 2.0),
  list(item = "pad",  qty = 1,  price = 8.0),
  list(item = "bag",  qty = 2,  price = 25.0),
  list(item = "clip", qty = 10, price = 0.5)
)

# Filter orders of at least $10 total, then sum the totals
Reduce(`+`,
  Map(\(o) o$qty * o$price,
    Filter(\(o) o$qty * o$price >= 10, orders)))
#> [1] 58
```

Read the inside-out call: `Filter` keeps big orders, `Map` computes the line total for each, `Reduce` sums them. The whole pipeline fits in three function names — no loop, no counter, no intermediate variables. This is the idiom you reach for any time the shape is "keep then total".

[TIP]
**The pipe makes these chains readable.** `orders |> Filter(f = ...) |> Map(f = ..., ...)` flips the inside-out call into a left-to-right chain. For Reduce, you often need an anonymous wrapper since it expects the function as the first argument.

## Practice Exercises

### Exercise 1: Sum of Squares of Evens

Given `1:10`, use `Filter` + `Map` + `Reduce` to compute the sum of the squares of the even numbers. Save to `my_result`.

```r
# your code here
#> Expected: 220
```

<details>
<summary>Click to reveal solution</summary>

```r
my_result <- Reduce(`+`,
  Map(\(x) x^2,
    Filter(\(x) x %% 2 == 0, 1:10)))
my_result
#> [1] 220
```

**Explanation:** `Filter` keeps `2, 4, 6, 8, 10`; `Map` squares to `4, 16, 36, 64, 100`; `Reduce(+)` sums to `220`.

</details>

### Exercise 2: Flatten a List With Reduce

Use `Reduce(c, lst)` to flatten `list(c(1, 2), c(3, 4, 5), c(6))` into a single vector.

```r
# your code here
#> Expected: 1 2 3 4 5 6
```

<details>
<summary>Click to reveal solution</summary>

```r
Reduce(c, list(c(1, 2), c(3, 4, 5), c(6)))
#> [1] 1 2 3 4 5 6
```

**Explanation:** `c` concatenates two vectors; `Reduce` chains the concatenation across every element.

</details>

## Summary

| Function     | Takes                          | Returns                  | purrr equivalent   |
|--------------|--------------------------------|--------------------------|---------------------|
| `Map(f, ...)`| One or more collections        | List                     | `map`, `map2`, `pmap` |
| `Filter(f, x)`| Collection + predicate         | Filtered vector or list  | `keep`, `discard`    |
| `Reduce(f, x)`| Collection + binary function   | Single value             | `reduce`             |
| `Reduce(f, x, accumulate = TRUE)`| Same, but returns every step | Vector/list  | `accumulate`         |
| `Negate(f)`  | A predicate                    | Opposite predicate       | `negate`             |

## References

1. R Core Team — `base::funprog` help page covering `Reduce`, `Filter`, `Map`, `Find`, `Position`. [Link](https://rdrr.io/r/base/funprog.html)
2. Wickham, H. — *Advanced R*, 2nd Edition, Chapter 9: Functionals. [Link](https://adv-r.hadley.nz/functionals.html)
3. `purrr` package — the tidyverse extension of the same ideas. [Link](https://purrr.tidyverse.org/)
4. Chambers, J. M. — *Software for Data Analysis: Programming with R*. Springer (2008).
5. R Language Definition — `Reduce` and `Map` implementation notes. [Link](https://cran.r-project.org/doc/manuals/r-release/R-lang.html)

## Continue Learning

- [Functional Programming in R](Functional-Programming-in-R.html) — the mindset where these three belong.
- [purrr map() Variants](purrr-map-Variants.html) — the typed tidyverse version of the same ideas.
- [R Function Operators](R-Function-Operators.html) — wrap existing functions to extend their behaviour.
