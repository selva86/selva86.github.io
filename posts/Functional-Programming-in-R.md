---
title: "Functional Programming in R: The Mindset That Makes Your Code 10× Cleaner"
slug: "Functional-Programming-in-R"
description: "Master functional programming in R: treat functions as data, replace loops with map/filter/reduce, and write code that is shorter, safer, and 10x cleaner."
keywords: "functional programming R, R map function, R reduce, R filter, higher-order functions R, first-class functions R, R functionals, R lapply vs map, pure functions R"
auto_link_terms: "functional programming in R|first-class functions|higher-order functions|R functionals|map reduce filter|pure functions R"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-14"
curriculum_id: "4.2.1"
post_type: "C"
sidebar_section: "Functional Programming"
sidebar_title: "Functional Programming"
sidebar_order: 1
difficulty: "Advanced"
---

# Functional Programming in R: The Mindset That Makes Your Code 10× Cleaner

<p class="lead">Functional programming in R is the discipline of treating functions as ordinary values, you can store them, pass them around, and compose them, so repetitive loops collapse into single lines that say exactly what they do. Once the mindset clicks, most of your R code gets dramatically shorter, safer, and easier to read.</p>

## Why is functional programming a mindset, not a package?

You've written the loop before: declare an empty vector, count indices, assign by position, try not to break the bookkeeping. It works, but most of the code is scaffolding, not meaning. Functional style flips that ratio. You describe the transformation once and hand it to R, the iteration disappears into a single call. Here is the same answer, both ways.

```r
# The loop way: lots of scaffolding
nums <- 1:5
squares_loop <- numeric(length(nums))
for (i in seq_along(nums)) {
  squares_loop[i] <- nums[i]^2
}
squares_loop
#> [1]  1  4  9 16 25

# The functional way: hand the operation to R
squares_fp <- sapply(nums, function(x) x^2)
squares_fp
#> [1]  1  4  9 16 25
```

Both blocks produce the same vector. The loop spends four lines managing an index and a result buffer before it ever mentions squaring. The `sapply` call says, in one line, "apply this function to each element." That is the entire pitch of functional style: stop writing the bookkeeping, start writing the meaning.

[KEY INSIGHT]
**Stop describing how to iterate, start describing what to do to each item.** Loops ask you to manage a counter, a buffer, and an assignment. Functionals only ask you what transformation to apply, R handles the rest.

[NOTE]
**Every example here uses base R, so you need zero packages.** `sapply`, `Map`, `Filter`, and `Reduce` ship with R itself. The popular purrr package is a modern, type-stable wrapper on the same ideas, we will see one line of it near the end so you can recognise the pattern later.

**Try it:** Convert a vector of Celsius temperatures `temps_c <- c(15, 22, 8, 30, 18)` to Fahrenheit using `sapply` and the formula `F = C * 9/5 + 32`. Save the result to `ex_temps_f`.

```r
# Try it: convert Celsius to Fahrenheit
temps_c <- c(15, 22, 8, 30, 18)

ex_temps_f <- sapply(temps_c, function(x) {
  # your code here
})
ex_temps_f
#> Expected: 59.0 71.6 46.4 86.0 64.4
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_temps_f <- sapply(temps_c, function(x) x * 9/5 + 32)
ex_temps_f
#> [1] 59.0 71.6 46.4 86.0 64.4
```

**Explanation:** `sapply` calls the anonymous function on every element of `temps_c` and simplifies the result to a numeric vector. The whole conversion is a one-liner because the "what" fits in one expression.

</details>

## How are functions first-class objects in R?

"First-class" is a claim about status: a value is first-class when you can do the same things to it that you can do to any other value. Integers are first-class, you can assign them, put them in a list, pass them to a function, or return them. In R, functions have exactly the same privileges. Seeing the proof of that is the fastest way to unlock the mindset.

```r
# 1. Assign a function to a variable, just like you would assign a number
double <- function(x) x * 2
double(7)
#> [1] 14

# 2. Store several functions inside a list and look them up by name
ops <- list(
  double = function(x) x * 2,
  square = function(x) x^2,
  negate = function(x) -x
)
ops$square(4)
#> [1] 16
```

`double` is now a name that refers to a function, exactly the way `x <- 7` makes `x` refer to a number. The `ops` list holds three functions together, each retrievable with `$`. If this feels normal, good, that is the goal. Functions in R are ordinary values you can carry around in any container.

The other two privileges are "pass as an argument" and "return from another function." Here is a function that takes another function and applies it twice.

```r
apply_twice <- function(f, x) f(f(x))

# Pass the named `double` function
apply_twice(double, 5)     # 5 -> 10 -> 20
#> [1] 20

# Pass an anonymous function — no need to name a helper you will use once
apply_twice(function(x) x + 3, 0)   # 0 -> 3 -> 6
#> [1] 6
```

`apply_twice` is a higher-order function: a function whose argument (or return value) is itself a function. The first call hands over `double`, the second hands over an inline anonymous function. R treats them identically because, to R, they are just values of type `function`.

![Four privileges of first-class functions](screenshots/Functional-Programming-in-R-first-class.webp)
*Figure 1: Four things you can do with a function that you can also do with any value.*

[TIP]
**Anonymous functions are perfect for one-shot transformations.** Writing `function(x) x + 1` inline is shorter than defining a helper you will never reuse. R 4.1+ also supports the shorthand `\(x) x + 1`, which reads especially well inside `sapply` and `Map`.

**Try it:** Write `ex_apply_thrice(f, x)` that applies `f` three times to `x`. Test it using `\(x) x + 1` on `0`, the answer should be `3`.

```r
# Try it: apply f three times
ex_apply_thrice <- function(f, x) {
  # your code here
}

ex_apply_thrice(\(x) x + 1, 0)
#> Expected: 3
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_apply_thrice <- function(f, x) f(f(f(x)))
ex_apply_thrice(\(x) x + 1, 0)
#> [1] 3
```

**Explanation:** The function composes `f` with itself three times. Starting from `0`, each call adds one: `0 -> 1 -> 2 -> 3`. This is a tiny taste of how you build behaviour by combining functions instead of writing more code.

</details>

## What are map, filter, and reduce, R's three core functionals?

Nearly every repetitive task on a collection fits one of three shapes. **Map** transforms each element, **filter** keeps elements that pass a test, and **reduce** collapses everything into a single value. R ships all three as base functions, `Map()`, `Filter()`, and `Reduce()`, plus the friendly vector-returning cousins `sapply()` and `vapply()`. Once you recognise the three shapes, you will spot them everywhere.

```r
numbers <- 1:6

# MAP: apply a function to every element (returns a list)
Map(function(x) x^2, numbers)
#> [[1]] [1] 1
#> [[2]] [1] 4
#> [[3]] [1] 9
#> ... up to [[6]] [1] 36

# sapply is the same idea but simplifies to a vector
sapply(numbers, function(x) x^2)
#> [1]  1  4  9 16 25 36

# FILTER: keep elements that satisfy a predicate (a function returning TRUE/FALSE)
Filter(function(x) x %% 2 == 0, numbers)
#> [1] 2 4 6

# REDUCE: collapse a collection into one value using a binary function
Reduce(`+`, numbers)          # sum via repeated addition
#> [1] 21

# Reduce can show its work with accumulate = TRUE
Reduce(`+`, numbers, accumulate = TRUE)
#> [1]  1  3  6 10 15 21
```

Read from top to bottom: `Map` returned a list (one squared value per input), `sapply` did the same job but gave back a plain numeric vector, `Filter` kept only the even values, and `Reduce` collapsed `1:6` to the sum `21`. The `accumulate = TRUE` variant is a debugging gift, it shows you every intermediate value, so you can see why repeatedly adding `1:6` must end at `21`.

![Map filter reduce data flow](screenshots/Functional-Programming-in-R-map-filter-reduce.webp)
*Figure 2: How map, filter, and reduce transform a collection step by step.*

[WARNING]
**Map() always returns a list, even for numeric output.** If you want a vector back, use `sapply()` or `vapply()` (stricter, type-checked), or wrap the `Map()` call in `unlist()`. Forgetting this is a top reason beginners think functional code "looks weird", they are getting lists where they expected numbers.

**Try it:** Use `Filter` to keep only strings longer than 3 characters from `words <- c("R", "cat", "tiger", "ox", "whale")`. Save the result to `ex_long_words`.

```r
# Try it: filter strings by length
words <- c("R", "cat", "tiger", "ox", "whale")

ex_long_words <- Filter(function(w) {
  # your code here
}, words)
ex_long_words
#> Expected: "tiger" "whale"
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_long_words <- Filter(function(w) nchar(w) > 3, words)
ex_long_words
#> [1] "tiger" "whale"
```

**Explanation:** `nchar(w) > 3` is the predicate, a function that returns `TRUE` or `FALSE` for each element. `Filter` keeps only the inputs for which the predicate is `TRUE`. "tiger" (5) and "whale" (5) pass; the rest are dropped.

</details>

## How do pure functions and closures power functional style?

Two ideas make functional code safe and reusable. A **pure function** depends only on its arguments and changes nothing else, given the same inputs, it always returns the same output. A **closure** is a function that remembers the environment it was created in, so it can carry a piece of state without using a global variable. Together they explain why functional R is easy to test and easy to compose.

```r
# PURE: add depends only on its inputs and changes nothing outside
add <- function(a, b) a + b
add(2, 3)
#> [1] 5

# IMPURE: the result depends on hidden global state
counter <- 0
impure_increment <- function() {
  counter <<- counter + 1    # <<- reaches out and mutates the outside world
  counter
}

impure_increment()
#> [1] 1
impure_increment()
#> [1] 2
```

`add(2, 3)` will return `5` forever, no matter how many times or in what order you call it, that is purity. `impure_increment()` returns a different number on every call because its answer depends on the hidden `counter` variable. Impure functions can be useful, but they make code harder to reason about: to predict the output, you need to know the history of every prior call. Functional style prefers purity because purity is what makes `Map`, `Filter`, and `Reduce` trustworthy, R can call them in any order without surprises.

A closure looks similar but uses the outer environment in a controlled, read-only way.

```r
make_multiplier <- function(factor) {
  function(x) x * factor   # the inner function "closes over" `factor`
}

times_three <- make_multiplier(3)
times_ten   <- make_multiplier(10)

times_three(7)
#> [1] 21
times_ten(7)
#> [1] 70
```

`make_multiplier(3)` returns a brand-new function whose body refers to `factor`. That `factor` lives in the environment `make_multiplier` was running in when it returned, and the returned function keeps a reference to it forever. `times_three` and `times_ten` are two different closures, each remembering its own `factor`. This is how you build specialised functions from a general recipe, no classes, no templates, just one line.

[KEY INSIGHT]
**A closure is a function that remembers its birth environment.** The inner function sees `factor` because it was born inside `make_multiplier`. This "memory" is what lets one recipe generate many specialised workers without repeating yourself.

**Try it:** Write `ex_make_greeter(greeting)` that returns a function pasting `greeting` before a name. Use it to build a `hi` function and call it on `"Selva"`.

```r
# Try it: a greeting factory
ex_make_greeter <- function(greeting) {
  # your code here
}

hi <- ex_make_greeter("Hi")
hi("Selva")
#> Expected: "Hi, Selva"
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_make_greeter <- function(greeting) {
  function(name) paste0(greeting, ", ", name)
}

hi <- ex_make_greeter("Hi")
hi("Selva")
#> [1] "Hi, Selva"
```

**Explanation:** `ex_make_greeter` returns an inner function that closes over `greeting`. Calling `ex_make_greeter("Hi")` creates a new closure where `greeting` is `"Hi"` forever, so `hi("Selva")` pastes `"Hi"` in front of any name you pass.

</details>

## When should you reach for functional style instead of a loop?

Not every loop needs to be refactored. If the loop is tiny, imperative, and easier to read than the alternative, leave it alone, the goal is clarity, not ideological purity. But the moment a loop is describing a **transformation** (each → something), a **filter** (keep items where), or an **accumulation** (combine all into one), that loop is secretly a functional, and rewriting it usually shrinks the code by half.

Here is a concrete comparison on the built-in `mtcars` dataset, compute the mean of three columns.

```r
# Functional: declarative, one line
col_means_fp <- sapply(mtcars[, c("mpg", "hp", "wt")], mean)
col_means_fp
#>        mpg         hp         wt
#>  20.090625 146.687500   3.217250

# Loop: same answer, more scaffolding
col_means_loop <- numeric(3)
names(col_means_loop) <- c("mpg", "hp", "wt")
for (col in names(col_means_loop)) {
  col_means_loop[col] <- mean(mtcars[[col]])
}
col_means_loop
#>        mpg         hp         wt
#>  20.090625 146.687500   3.217250
```

Both versions return the same named numeric vector. The functional version is a single line because `sapply` already knows how to iterate over a list (a data frame *is* a list of columns) and collect results by name. The loop version needs four lines to reproduce that plumbing by hand. Read the `sapply` line aloud: "apply `mean` to each of these columns." That sentence is the code.

If you work in the tidyverse, the same idea is one line of purrr:

```r
# One-liner with purrr::map_dbl — guaranteed to return a double vector
library(purrr)
map_dbl(mtcars[, c("mpg", "hp", "wt")], mean)
#>        mpg         hp         wt
#>  20.090625 146.687500   3.217250
```

`map_dbl` is the type-stable sibling of `sapply`: it returns a double vector or it errors, it never silently gives you a list. That guarantee is the main reason purrr exists alongside base R's functionals.

[TIP]
**Start with base R's functionals, move to purrr when you need type safety.** `sapply`, `lapply`, `Map`, `Filter`, and `Reduce` are always available and teach the vocabulary. `purrr::map_dbl`, `map_chr`, `map_lgl`, and `map_df` add type-stable returns and pipe-friendly ergonomics when you want them.

A practical decision list:

1. **Describing a transformation?** Use `sapply`, `Map`, or `purrr::map_*`.
2. **Keeping only some elements?** Use `Filter` or `purrr::keep`.
3. **Collapsing to one value?** Use `Reduce` or `purrr::reduce`.
4. **Need a running side-effect like printing, plotting, or writing files?** Use `for`, or `purrr::walk` if you want the functional style, side effects are legal, they are just not the functionals' strength.

**Try it:** Replace the loop `total <- 0; for (i in 1:100) total <- total + i` with a one-line `Reduce` call. Save the result to `ex_total`.

```r
# Try it: sum 1 to 100 with Reduce
ex_total <- NA  # your code here
ex_total
#> Expected: 5050
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_total <- Reduce(`+`, 1:100)
ex_total
#> [1] 5050
```

**Explanation:** `Reduce` applies `+` pairwise across the vector: `1 + 2 = 3`, then `3 + 3 = 6`, then `6 + 4 = 10`, and so on. The final value is the classic Gauss sum `5050`. One line replaces a three-line loop, and the intent reads right off the page.

</details>

## Practice Exercises

These capstones combine two or more ideas from the tutorial. Each uses distinct variable names prefixed with `my_` so you can experiment without overwriting tutorial state.

### Exercise 1: Filter then map for word lengths

Given the list below, use `Filter` and `sapply` together to return a numeric vector of **lengths** of words that have at least 5 letters. Save the result to `my_long_lengths`.

```r
# Exercise 1: filter by length, then measure
word_list <- list("banana", "kiwi", "strawberry", "fig", "watermelon")

# Write your code below:

# Expected: 6 10 10
```

<details>
<summary>Click to reveal solution</summary>

```r
long_words <- Filter(function(w) nchar(w) >= 5, word_list)
my_long_lengths <- sapply(long_words, nchar)
my_long_lengths
#> [1]  6 10 10
```

**Explanation:** `Filter` keeps `"banana"`, `"strawberry"`, and `"watermelon"`. `sapply(long_words, nchar)` then measures each surviving word. This is the canonical filter-then-map shape and is how most real data pipelines begin.

</details>

### Exercise 2: Build a power function with a factory

Write a function factory `make_power(n)` that returns a function raising its input to the `n`th power. Use it to create `cube` and then apply `cube` to `1:5`. Save the resulting vector to `my_cubes`.

```r
# Exercise 2: function factory

make_power <- function(n) {
  # your code here
}

cube <- make_power(3)
my_cubes <- sapply(1:5, cube)
my_cubes
#> Expected: 1 8 27 64 125
```

<details>
<summary>Click to reveal solution</summary>

```r
make_power <- function(n) {
  function(x) x^n
}

cube <- make_power(3)
my_cubes <- sapply(1:5, cube)
my_cubes
#> [1]   1   8  27  64 125
```

**Explanation:** `make_power(3)` returns a closure that remembers `n = 3`. Every call to `cube(x)` computes `x^3`. You could also build `square <- make_power(2)` from the same factory, one recipe, many specialised workers.

</details>

### Exercise 3: Running factorial with accumulate

Use `Reduce` with `accumulate = TRUE` to compute the running product of `1:6`, these are the factorials `1!`, `2!`, `3!`, up to `6!`. Save the resulting vector to `my_factorials`.

```r
# Exercise 3: factorials via Reduce
# Hint: Reduce(f, x, accumulate = TRUE) returns all intermediate results

my_factorials <- NA  # your code here
my_factorials
#> Expected: 1 2 6 24 120 720
```

<details>
<summary>Click to reveal solution</summary>

```r
my_factorials <- Reduce(`*`, 1:6, accumulate = TRUE)
my_factorials
#> [1]   1   2   6  24 120 720
```

**Explanation:** Multiplication is the reducer. `accumulate = TRUE` captures each intermediate product: `1`, then `1*2 = 2`, then `2*3 = 6`, then `6*4 = 24`, and so on. Running totals and running products are the two most useful `Reduce` patterns in practice.

</details>

## Complete Example

Let's put all five ideas to work on a tiny but realistic task: given a small inventory, compute the **average price of items that are currently in stock**. This example uses first-class functions (stored in a list-of-records), a filter, a map, and a reduce, the whole FP toolkit on three lines of data.

```r
inventory <- list(
  list(name = "pen",    price = 2,  in_stock = TRUE),
  list(name = "book",   price = 15, in_stock = FALSE),
  list(name = "eraser", price = 1,  in_stock = TRUE),
  list(name = "ruler",  price = 3,  in_stock = TRUE)
)

# Step 1 — FILTER: keep only records where in_stock is TRUE
in_stock_items <- Filter(function(item) item$in_stock, inventory)
length(in_stock_items)
#> [1] 3

# Step 2 — MAP: pull the price field out of each surviving record
prices <- sapply(in_stock_items, function(item) item$price)
prices
#> [1] 2 1 3

# Step 3 — REDUCE: sum the prices, then divide by count to get the mean
avg_price <- Reduce(`+`, prices) / length(prices)
avg_price
#> [1] 2
```

Each step has a single job and a single shape. You filter to drop out-of-stock items, map to extract the field you care about, and reduce to collapse many values into one. Every intermediate result is visible, so debugging is trivial, you check each pipe one at a time. Once the steps work, you can chain them into a single line for production:

```r
# The same pipeline, written as one fluent expression
mean(sapply(Filter(function(i) i$in_stock, inventory), function(i) i$price))
#> [1] 2
```

That one-liner is the reward for learning the vocabulary. It reads right to left like a sentence: "take the mean of the prices of the in-stock items in `inventory`." Your future self will thank you for writing it this way.

## Summary

Functional programming in R is a mindset before it is a toolkit. Once you accept that functions are ordinary values, the rest falls out naturally, map, filter, and reduce become the obvious way to describe repetitive work, pure functions become the obvious way to keep results predictable, and closures become the obvious way to build specialised workers from a single recipe.

![Mindset shift from loops to functional style](screenshots/Functional-Programming-in-R-mindset-shift.webp)
*Figure 3: The mental move from looping to functional style.*

Five takeaways to keep:

1. **Functions are values.** Assign them, store them in lists, pass them as arguments, return them from other functions.
2. **Three shapes cover most iteration.** Transform with `Map`/`sapply`, filter with `Filter`, collapse with `Reduce`. Spot the shape, pick the functional.
3. **Pure functions are easier to reason about.** Same inputs, same output, no hidden state, that is the guarantee that makes composition safe.
4. **Closures carry state cleanly.** A function returned from another function remembers the environment it was born in, use that to build specialised workers.
5. **Start with base R, graduate to purrr.** `sapply`, `Map`, `Filter`, `Reduce` teach the vocabulary. `purrr::map_dbl` and friends add type safety when you need it.

## References

1. Wickham, H., *Advanced R*, 2nd Edition. Chapter 9: Functionals. [Link](https://adv-r.hadley.nz/functionals.html)
2. Wickham, H., *Advanced R*, 2nd Edition. Chapter 6: Functions. [Link](https://adv-r.hadley.nz/functions.html)
3. Peng, R. D., *Mastering Software Development in R*, §2.3 Functional Programming. [Link](https://bookdown.org/rdpeng/RProgDA/functional-programming.html)
4. R Core Team, `Map`, `Filter`, `Reduce` reference (`funprog`). [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/funprog.html)
5. purrr tidyverse package documentation. [Link](https://purrr.tidyverse.org/)
6. Rodrigues, B., *Modern R with the tidyverse*, Chapter 8: Functional Programming. [Link](https://modern-rstats.eu/functional-programming.html)

## Continue Learning

- [purrr map() Variants](purrr-map-Variants.html), the type-stable, pipe-friendly modern alternative to `sapply`.
- [R Anonymous Functions](R-Anonymous-Functions.html), a deep dive into `function(x) ...` and the R 4.1+ shorthand `\(x) ...`.
- [Reduce, Filter, Map in R](Reduce-Filter-Map-in-R.html), a focused walkthrough of the base-R trio with more examples.
