---
title: "Advanced R Exercises: 10 Functional Programming Practice Problems — Solved Step-by-Step"
slug: "R-Functional-Programming-Exercises"
description: "Practice functional programming in R with 10 hands-on exercises — pure functions, closures, map, reduce, composition. Starter code and worked solutions."
keywords: "R functional programming exercises, R map reduce exercises, functional programming practice R, R closures exercises, higher-order functions exercises R, R practice problems functional, purrr exercises R, R Reduce Filter exercises"
mathjax: false
webr: true
date: "2026-04-12"
curriculum_id: "E11.1"
post_type: "EX"
sidebar_title: "Functional Programming (10 problems)"
auto_link_terms: "functional programming exercises|R functional programming exercises|FP exercises R|functional programming practice problems"
auto_link_case_sensitive: false
fr_parent: "Functional-Programming-in-R.html"
---

# Advanced R Exercises: 10 Functional Programming Practice Problems — Solved Step-by-Step

<p class="lead">Sharpen your functional programming skills in R with 10 hands-on exercises covering pure functions, first-class functions, higher-order operations (<code>map</code>, <code>filter</code>, <code>reduce</code>), immutability, closures, and pipeline composition — each with starter code and a fully worked solution.</p>

These exercises follow the same progression as the [Functional Programming in R](Functional-Programming-in-R.html) tutorial. Work through them in order — earlier problems build habits you need for the later ones. Type your answer before opening the solution; the struggle is where the learning happens.

## How Should You Use These Exercises?

Every code block on this page shares a single R session, so variables you create in one exercise carry forward to the next. Let's confirm that with a quick warm-up.

```r
fp_ready <- "Session is live — let's go!"
fp_ready
#> [1] "Session is live — let's go!"
```

That variable now exists for the rest of this page. Each exercise gives you a **starter block** with a skeleton and expected output, plus a collapsible **worked solution** with a line-by-line explanation. Aim to solve it yourself first.

[NOTE]
**These exercises assume you know the five FP ideas from the parent tutorial.** If terms like "pure function", "first-class", or "higher-order function" feel unfamiliar, read [Functional Programming in R](Functional-Programming-in-R.html) first and come back.

## Exercise 1: Can You Write a Pure Function That Scales a Vector?

A pure function takes its inputs and returns a result — no globals, no side effects, same input always gives the same output. Your job: write `scale_between(x, low, high)` that rescales a numeric vector `x` to fall within `[low, high]`.

```r
# Write scale_between() — a pure function
scale_between <- function(x, low, high) {
  # your code here
}

# Test:
scale_between(c(10, 20, 30, 40, 50), 0, 1)
#> Expected: 0.00 0.25 0.50 0.75 1.00
```

<details>
<summary>Click to reveal solution</summary>

```r
scale_between <- function(x, low, high) {
  scaled <- (x - min(x)) / (max(x) - min(x))
  scaled * (high - low) + low
}

scale_between(c(10, 20, 30, 40, 50), 0, 1)
#> [1] 0.00 0.25 0.50 0.75 1.00

scale_between(c(10, 20, 30, 40, 50), 0, 100)
#> [1]   0  25  50  75 100
```

**Explanation:** First we normalise `x` to the 0-1 range by subtracting the minimum and dividing by the range. Then we stretch it to `[low, high]` by multiplying by the target width and adding `low`. The function touches nothing outside its own body — pure by construction.

</details>

## Exercise 2: Can You Spot and Fix the Impure Function?

The function below tracks a running total using `<<-`, which writes to the global environment. That makes it impure — calling it twice with the same input gives different results. Rewrite it so the same inputs always produce the same output.

```r
# Impure version — DO NOT use this pattern
total <- 0
add_and_track <- function(value) {
  total <<- total + value
  total
}

add_and_track(5)
#> [1] 5
add_and_track(5)
#> [1] 10   # same input, different output!

# Rewrite as a PURE function:
add_pure <- function(current_total, value) {
  # your code here
}

# Test:
add_pure(0, 5)
#> Expected: 5
add_pure(0, 5)
#> Expected: 5  (same input, same output!)
```

<details>
<summary>Click to reveal solution</summary>

```r
add_pure <- function(current_total, value) {
  current_total + value
}

add_pure(0, 5)
#> [1] 5
add_pure(0, 5)
#> [1] 5

# Chain calls to build a running total without any global state:
0 |> add_pure(5) |> add_pure(10) |> add_pure(3)
#> [1] 18
```

**Explanation:** The impure version hid state in a global variable, making the output depend on *when* you call it. The pure version takes the current total as an explicit argument, so the output depends only on the inputs. To accumulate, you chain calls or use `Reduce` — the state travels through the function, not around it.

</details>

[KEY INSIGHT]
**The `<<-` operator is a code smell in functional R.** Every time you see `<<-`, it means a function is reaching outside its own scope to change something. Replace that hidden state with an explicit argument and the function becomes testable, predictable, and safe to run in parallel.

## Exercise 3: Can You Store Functions in a List and Dispatch by Name?

In R, functions are first-class values — you can store them in variables, lists, or pass them as arguments. Create a named list of four summary statistics and write a dispatcher function.

```r
# Create a named list of summary functions:
# "mean", "median", "sd", "iqr"
# Then write summarise_with(x, stat_name) that looks up the
# function by name and applies it to x.

summarise_with <- function(x, stat_name) {
  # your code here
}

# Tests:
summarise_with(1:100, "mean")
#> Expected: 50.5
summarise_with(1:100, "median")
#> Expected: 50.5
summarise_with(1:100, "sd")
#> Expected: 29.01149
summarise_with(1:100, "iqr")
#> Expected: 49.5
```

<details>
<summary>Click to reveal solution</summary>

```r
stat_funs <- list(
  mean   = mean,
  median = median,
  sd     = sd,
  iqr    = IQR
)

summarise_with <- function(x, stat_name) {
  stat_funs[[stat_name]](x)
}

summarise_with(1:100, "mean")
#> [1] 50.5
summarise_with(1:100, "median")
#> [1] 50.5
summarise_with(1:100, "sd")
#> [1] 29.01149
summarise_with(1:100, "iqr")
#> [1] 49.5
```

**Explanation:** `stat_funs` is a named list where each element is a function. `stat_funs[[stat_name]]` retrieves the function by name, and the trailing `(x)` calls it. This pattern is called "dispatch by name" — it replaces long `if`/`else` chains with a clean lookup.

</details>

## Exercise 4: Can You Build a Function Factory for Power Functions?

A function factory is a function that *returns* a new function. The returned function "closes over" (remembers) the variables from its creation environment. Write `make_power(n)` that returns a function raising its argument to the `n`th power.

```r
# Write the factory:
make_power <- function(n) {
  # return a function that raises x to the nth power
}

# Use it to create specialised functions:
square <- make_power(2)
cube   <- make_power(3)

# Tests:
square(5)
#> Expected: 25
cube(3)
#> Expected: 27
make_power(0.5)(16)
#> Expected: 4
```

<details>
<summary>Click to reveal solution</summary>

```r
make_power <- function(n) {
  function(x) x^n
}

square <- make_power(2)
cube   <- make_power(3)

square(5)
#> [1] 25
cube(3)
#> [1] 27
make_power(0.5)(16)
#> [1] 4
```

**Explanation:** `make_power(2)` creates a new function whose body is `x^n`, where `n` is locked to `2` in the enclosing environment. That binding persists even after `make_power` finishes. This is a **closure** — the returned function "closes over" `n`. The `0.5` test shows that square roots are just power-0.5, and the factory handles that without any special case.

</details>

[TIP]
**Closures capture the environment, not the value at call time.** If you modify the captured variable later (e.g., via a loop index), every closure sees the latest value. When building closures in a loop, use `force(n)` inside the factory to lock in the current value.

## Exercise 5: Can You Replace a For Loop With sapply?

Higher-order functions like `sapply` replace explicit loops with a single, declarative call. Below is a for loop that z-score normalises each column of a data frame. Rewrite it as a one-liner using `sapply`.

```r
df <- data.frame(
  height = c(170, 180, 160, 175, 165),
  weight = c(65, 80, 55, 72, 60),
  age    = c(25, 30, 22, 28, 35)
)

# For-loop version (rewrite this):
df_z <- df
for (col in names(df)) {
  df_z[[col]] <- (df[[col]] - mean(df[[col]])) / sd(df[[col]])
}
round(df_z, 2)

# Your one-liner using sapply:
# df_z <- ???
#> Expected (first row): height=0.00, weight=-0.42, age=-0.49
```

<details>
<summary>Click to reveal solution</summary>

```r
df_z <- as.data.frame(sapply(df, \(col) (col - mean(col)) / sd(col)))
round(df_z, 2)
#>   height weight   age
#> 1   0.00  -0.42 -0.49
#> 2   1.26   1.05  0.49
#> 3  -1.26  -1.37 -1.08
#> 4   0.63   0.32  0.10
#> 5  -0.63  -0.58  0.98
```

**Explanation:** `sapply(df, fun)` applies the anonymous function to each column and simplifies the result to a matrix. Wrapping it in `as.data.frame()` gives back a data frame. One line replaces four. More importantly, the intent — "normalise each column" — is visible at a glance, while the loop buries it in index bookkeeping.

</details>

## Exercise 6: Can You Chain Filter and Reduce to Solve a Data Problem?

`Filter` keeps elements that satisfy a predicate. `Reduce` collapses a sequence into a single value using a binary function. Combine them: given a mixed list, keep only the positive numbers and compute their running product.

```r
mixed <- list("a", -3, 7, "hello", 2, -1, 5, TRUE, 4)

# Keep only positive numbers, then compute their product.
# Use Filter() and Reduce() — no manual loops.

# your code here
#> Expected: 280   (7 * 2 * 5 * 4)
```

<details>
<summary>Click to reveal solution</summary>

```r
positives <- Filter(\(x) is.numeric(x) && x > 0, mixed)
product <- Reduce(`*`, positives)
product
#> [1] 280

# Or as a pipeline:
mixed |>
  Filter(f = \(x) is.numeric(x) && x > 0) |>
  Reduce(f = `*`)
#> [1] 280
```

**Explanation:** `Filter` applies the predicate to each element. Strings fail `is.numeric()`, negatives fail `x > 0`, and `TRUE` is technically numeric but not `> 0` in the way we want (it equals 1, so the predicate passes — if you want to exclude it, add `!is.logical(x)`). `Reduce` then folds `*` across the surviving values: `7 * 2 = 14`, `14 * 5 = 70`, `70 * 4 = 280`.

</details>

[WARNING]
**Reduce() on an empty vector throws an error.** If your Filter might return nothing, pass `accumulate = FALSE` (the default) and provide an `init` value: `Reduce(\`*\`, x, init = 1)`. The `init` acts as the identity element and also saves you from the empty-input crash.

## Exercise 7: Can You Write Your Own Map From Scratch?

The best way to understand a higher-order function is to build one. Implement `my_map(x, f)` that applies `f` to every element of `x` and returns a list — without using `lapply`, `sapply`, `Map`, `purrr::map`, or any apply variant.

```r
my_map <- function(x, f) {
  # your code here — no apply/map functions allowed!
}

# Tests:
my_map(1:5, \(n) n^2)
#> Expected: list(1, 4, 9, 16, 25)

my_map(c("hello", "world"), toupper)
#> Expected: list("HELLO", "WORLD")
```

<details>
<summary>Click to reveal solution</summary>

```r
my_map <- function(x, f) {
  result <- vector("list", length(x))
  for (i in seq_along(x)) {
    result[[i]] <- f(x[[i]])
  }
  result
}

my_map(1:5, \(n) n^2)
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

my_map(c("hello", "world"), toupper)
#> [[1]]
#> [1] "HELLO"
#>
#> [[2]]
#> [1] "WORLD"
```

**Explanation:** We pre-allocate a list with `vector("list", length(x))` to avoid growing the list inside the loop (which is slow). `seq_along(x)` generates indices safely even if `x` is empty. Then we apply `f` to each element and store the result. This is essentially what `lapply` does internally in C — you've just written the R version.

</details>

[KEY INSIGHT]
**Every higher-order function is hiding a loop.** The value of `sapply`, `Filter`, and `Reduce` isn't that they avoid loops — it's that they give the loop a *name*. When you see `sapply`, you know "one call per element, collect results." When you see a raw `for` loop, you have to read the body to know what pattern it follows.

## Exercise 8: Can You Prove That Copy-on-Modify Keeps Your Data Safe?

R's copy-on-modify rule means a function cannot corrupt the data you pass in. Write a function `mangle(df)` that sorts the rows, renames a column, and adds a new column — then prove the original data frame is identical before and after the call.

```r
original_df <- data.frame(
  name  = c("Zara", "Ali", "Mia"),
  score = c(88, 95, 72)
)

# Write mangle() — it should modify the data in at least 3 ways:
mangle <- function(df) {
  # your code here
}

# Proof:
before <- original_df
result <- mangle(original_df)

# Show that original_df is unchanged:
identical(original_df, before)
#> Expected: TRUE
```

<details>
<summary>Click to reveal solution</summary>

```r
mangle <- function(df) {
  df <- df[order(df$name), ]          # sort rows
  names(df)[2] <- "points"            # rename column
  df$grade <- ifelse(df$points >= 90, "A", "B")  # add column
  df
}

before <- original_df
result <- mangle(original_df)

result
#>   name points grade
#> 2  Ali     95     A
#> 3  Mia     72     B
#> 1 Zara     88     B

identical(original_df, before)
#> [1] TRUE

original_df
#>   name score
#> 1 Zara    88
#> 2  Ali    95
#> 3  Mia    72
```

**Explanation:** Inside `mangle`, every modification triggers R's copy-on-modify: the `df` inside the function becomes a private copy the moment we sort, rename, or add a column. The caller's `original_df` is never touched. This is why functional R code is safe for data analysis — mistakes inside a function cannot retroactively poison your source data.

</details>

## Exercise 9: Can You Compose Three Functions Into a Single Pipeline?

Function composition means chaining small, focused functions together. Below are three helpers that each do one text-cleaning step. Combine them into a single pipeline using `|>` that takes a messy character vector and returns a clean one.

```r
messy <- c("  Hello, World!  ", "R is GREAT!!!", "   functional Programming.  ")

# The three steps (already defined):
# 1. trimws()       — remove leading/trailing whitespace
# 2. tolower()      — convert to lowercase
# 3. Remove all punctuation

# Write a pipeline that applies all three:
# cleaned <- ???

#> Expected: "hello world"  "r is great"  "functional programming"
```

<details>
<summary>Click to reveal solution</summary>

```r
cleaned <- messy |>
  trimws() |>
  tolower() |>
  gsub(pattern = "[[:punct:]]", replacement = "", x = _)

cleaned
#> [1] "hello world"            "r is great"
#> [3] "functional programming"
```

**Explanation:** The native pipe `|>` passes the left-hand result as the first argument of the next function. `trimws()` and `tolower()` both take a character vector as their first argument, so they work directly. `gsub` needs the input as its third argument (`x`), so we use the `_` placeholder to tell the pipe where to put it. Each function does one thing; the pipe composes them into a readable left-to-right flow.

</details>

[TIP]
**The native pipe's `_` placeholder works only in named arguments.** You can write `gsub(pattern = "[[:punct:]]", replacement = "", x = _)` but not `gsub("[[:punct:]]", "", _)`. If you need positional placeholders, use magrittr's `%>%` with `.` instead.

## Exercise 10: Can You Build a Memoised Fibonacci Function?

Memoisation caches the results of expensive function calls so repeated calls with the same input return instantly. The naive recursive Fibonacci is painfully slow for large `n` because it recomputes the same values over and over. Build a memoised version using a closure.

```r
# Naive version (slow for n > 30):
fib_naive <- function(n) {
  if (n <= 1) return(n)
  fib_naive(n - 1) + fib_naive(n - 2)
}
fib_naive(10)
#> [1] 55

# Write a memoised version using a closure:
make_fib_memo <- function() {
  # create a cache environment
  # return a function that checks cache before computing
}

fib <- make_fib_memo()

# Tests:
fib(10)
#> Expected: 55
fib(30)
#> Expected: 832040
fib(50)
#> Expected: 12586269025
```

<details>
<summary>Click to reveal solution</summary>

```r
make_fib_memo <- function() {
  cache <- new.env(parent = emptyenv())

  fib_inner <- function(n) {
    key <- as.character(n)
    if (exists(key, envir = cache)) {
      return(get(key, envir = cache))
    }
    val <- if (n <= 1) n else fib_inner(n - 1) + fib_inner(n - 2)
    assign(key, val, envir = cache)
    val
  }

  fib_inner
}

fib <- make_fib_memo()

fib(10)
#> [1] 55
fib(30)
#> [1] 832040
fib(50)
#> [1] 12586269025
```

**Explanation:** `make_fib_memo` creates an environment (`cache`) that lives as long as the returned function does — this is a closure in action. On each call, `fib_inner` first checks if the result is already cached. If yes, it returns instantly. If no, it computes the value recursively, stores it in `cache`, and returns it. The naive version computes `fib(30)` with over a billion recursive calls; the memoised version computes each value exactly once — 30 calls total.

</details>

[KEY INSIGHT]
**Memoisation turns exponential time into linear time for overlapping subproblems.** The cache is just an environment (R's native hash map), and the closure keeps it private — no global variables, no side effects visible to the caller. This pattern works for any pure function with expensive, repeated computations: API calls, file parsing, or matrix factorisation.

## Summary

| Exercise | Concept | Key Takeaway |
|---|---|---|
| 1 | Pure functions | Same input, same output — no side effects |
| 2 | Pure vs impure | Replace `<<-` with explicit arguments |
| 3 | First-class functions | Store functions in lists for clean dispatch |
| 4 | Function factories | Closures capture their enclosing environment |
| 5 | Map (sapply) | Replace column-wise loops with one declarative call |
| 6 | Filter + Reduce | Chain higher-order functions for complex logic |
| 7 | Build your own map | Understanding HOFs = understanding the loop they hide |
| 8 | Immutability | Copy-on-modify guarantees your data stays safe |
| 9 | Composition | Pipes chain small functions into readable flows |
| 10 | Memoisation | Closures + caching = exponential → linear performance |

## References

1. Wickham, H. — *Advanced R*, 2nd Edition. Chapter 6: Functions. [Link](https://adv-r.hadley.nz/functions.html)
2. Wickham, H. — *Advanced R*, 2nd Edition. Chapter 9: Functionals. [Link](https://adv-r.hadley.nz/functionals.html)
3. Wickham, H. — *Advanced R*, 2nd Edition. Chapter 10: Function Factories. [Link](https://adv-r.hadley.nz/function-factories.html)
4. purrr package documentation — Functional programming tools for R. [Link](https://purrr.tidyverse.org/)
5. R Core Team — base R `Reduce`, `Filter`, `Map`, and `Position` reference. [Link](https://rdrr.io/r/base/funprog.html)
6. R Core Team — *An Introduction to R*. [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html)

## Continue Learning

- [Functional Programming in R](Functional-Programming-in-R.html) — the parent tutorial covering all five concepts these exercises test.
- [Base R's Functional Triad: Reduce(), Filter(), Map()](Reduce-Filter-Map-in-R.html) — deep dive into the three base R higher-order functions used in exercises 6 and 7.
- [purrr map() Variants](purrr-map-Variants.html) — typed map alternatives when you want vectors instead of lists.
