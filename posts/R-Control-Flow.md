---
title: "R Control Flow: if/else, for, and while, Stop Avoiding Loops"
slug: "R-Control-Flow"
description: "Master R's control flow: if/else conditionals, for loops with real iteration patterns, while loops, and when to replace all of them with vectorised alternatives."
keywords: "R control flow, if else R, for loop R, while loop R, next break R, ifelse vectorized, R conditionals"
auto_link_terms: "R control flow|if else in R|for loop in R|while loop in R|ifelse()|next and break in R"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: 2026-04-11
curriculum_id: "1.1.9"
post_type: C
sidebar_section: "R Fundamentals"
sidebar_title: "R Control Flow"
sidebar_order: 9
difficulty: "Beginner"
---

# R Control Flow: if/else, for, and while, Stop Avoiding Loops

<p class="lead">Control flow is how you tell R to make decisions (<code>if/else</code>) and repeat work (<code>for</code>, <code>while</code>). R has a reputation for hating loops, but that's half-true. This guide shows you when loops are fine, when they're slow, and when a vectorized one-liner replaces twenty lines of iteration.</p>

## How does if/else work in R?

An `if` statement runs a block of code only when a condition is `TRUE`. Attach an `else` and you get a two-way branch. Attach `else if` and you chain as many branches as you need. The syntax is C-like, with one important R twist: the condition must be a single `TRUE` or `FALSE`, not a vector.

```r title="if, else if, else branching"
temperature <- 28

if (temperature > 30) {
  message("Hot")
} else if (temperature > 20) {
  message("Warm")
} else {
  message("Cool")
}
#> Warm
```

The braces `{ }` aren't strictly required for one-line bodies, but they prevent bugs, always use them. The message functions `message()`, `warning()`, and `stop()` are the three channels for progress, caution, and error output.

![How R's control flow decisions work](screenshots/R-Control-Flow-decision.webp)
*Figure 1: An if/else if/else chain evaluates conditions top to bottom and runs the first block whose condition is TRUE. At most one block runs.*

> [WARNING]
> `if (x > 0)` requires `x` to be length-1. If `x` is a vector, you get "the condition has length > 1" (an error in R 4.2+). For vectors, use `ifelse()` or logical indexing, see the next section.

**Try it:** Write an `if/else if/else` that classifies a grade (0-100) as "A", "B", "C", or "F".

```r title="Exercise: Letter grade ladder"
grade <- 83
if (grade >= 90) {
  "A"
} else if (grade >= 80) {
  "___"
} else if (grade >= 70) {
  "___"
} else {
  "___"
}

```

<details>
<summary>Click to reveal solution</summary>

```r title="Letter grade ladder solution"
grade <- 83
if (grade >= 90) {
  "A"
} else if (grade >= 80) {
  "B"
} else if (grade >= 70) {
  "C"
} else {
  "F"
}
#> [1] "B"
```

The chain evaluates top to bottom and runs the first branch whose condition is TRUE, `83` fails `>= 90` but passes `>= 80`, so "B" is returned and the remaining branches are skipped. The final `else` is the fallback for anything below 70.
</details>

## How do you branch across a whole vector with ifelse() and dplyr::case_when()?

For vectors, `if` is the wrong tool. Use `ifelse()`, the vectorized, element-wise version. It takes a logical vector, a value for the `TRUE` positions, and a value for the `FALSE` positions.

```r title="Vectorized ifelse for warm or cool"
temps <- c(12, 25, 31, 18, 28)
ifelse(temps > 20, "warm", "cool")
#> [1] "cool" "warm" "warm" "cool" "warm"

ifelse(temps > 30, "hot",
  ifelse(temps > 20, "warm", "cool"))
#> [1] "cool" "warm" "hot"  "cool" "warm"
```

The nested `ifelse()` works but gets ugly fast. For multi-way branching across vectors, `dplyr::case_when()` is far cleaner:

```r title="casewhen for multi-way branching"
library(dplyr)
case_when(
  temps > 30 ~ "hot",
  temps > 20 ~ "warm",
  TRUE       ~ "cool"
)
#> [1] "cool" "warm" "hot"  "cool" "warm"
```

The `TRUE` at the end is the catch-all, think of it as the `else`. Every row must match at least one condition, so always include a fallback.

> [KEY INSIGHT]
> If you're reaching for an `if` statement inside a `for` loop over a vector, stop and ask: can I use `ifelse()` or `case_when()` instead? Nine times out of ten you can, and the vectorized version is 10-100× faster.

**Try it:** Use `ifelse()` on `c(-3, 5, -1, 8, 0)` to return "neg", "pos", or "zero", note that basic `ifelse()` handles two branches; you'll need a nested call.

```r title="Exercise: Sign with nested ifelse"
v <- c(-3, 5, -1, 8, 0)
ifelse(v > 0, "pos", ifelse(v < 0, "neg", "___"))

```

<details>
<summary>Click to reveal solution</summary>

```r title="Nested ifelse sign solution"
v <- c(-3, 5, -1, 8, 0)
ifelse(v > 0, "pos", ifelse(v < 0, "neg", "zero"))
#> [1] "neg"  "pos"  "neg"  "pos"  "zero"
```

`ifelse()` only handles a two-way split, so the third category is expressed by nesting another `ifelse()` in the "FALSE" slot. The outer call catches positives, the inner call catches negatives, and anything that fails both conditions (only `0` here) falls through to "zero".
</details>

## How do for loops work in R?

A `for` loop in R iterates over any object with a length, most commonly a vector. The loop variable takes each value in turn.

```r title="Basic for loop over integers"
for (i in 1:5) {
  cat("Step", i, "squared is", i^2, "\n")
}
#> Step 1 squared is 1 
#> Step 2 squared is 4 
#> Step 3 squared is 9 
#> Step 4 squared is 16 
#> Step 5 squared is 25
```

You can iterate over any vector, not just integers:

```r title="for loop over character vector"
fruits <- c("apple", "banana", "cherry")
for (f in fruits) {
  cat("I love", f, "\n")
}
#> I love apple 
#> I love banana 
#> I love cherry
```

When you need the index *and* the value, iterate over `seq_along()`:

```r title="Loop by index with seqalong"
for (i in seq_along(fruits)) {
  cat(i, ":", fruits[i], "\n")
}
#> 1 : apple 
#> 2 : banana 
#> 3 : cherry
```

Prefer `seq_along(x)` over `1:length(x)`, if `x` is empty, `1:length(x)` gives `1:0 = c(1, 0)` and loops twice with wrong values. `seq_along(c())` correctly returns an empty vector.

**Try it:** Loop over `c(10, 20, 30)` and print the running sum at each step.

```r title="Exercise: Running sum inside loop"
running <- 0
for (x in c(10, 20, 30)) {
  running <- running + x
  print(running)
}

```

<details>
<summary>Click to reveal solution</summary>

```r title="Running sum loop solution"
running <- 0
for (x in c(10, 20, 30)) {
  running <- running + x
  print(running)
}
#> [1] 10
#> [1] 30
#> [1] 60
```

`running` is initialized to 0 outside the loop so each iteration can read the accumulated total and add the current `x` to it. Printing inside the loop shows the running total after each step, 10, then 30, then 60.
</details>

## When is a for loop the wrong tool?

R's reputation for slow loops comes from one specific anti-pattern: **growing a result inside a loop**. Watch this:

```r title="Grow-inside-loop anti-pattern"
n <- 10000
result <- c()
for (i in 1:n) {
  result <- c(result, i^2)
}
```

Every `c(result, i^2)` *copies the entire vector* and allocates a new one. It's O(n²), slow enough to notice past a few thousand elements. The fix is either pre-allocation:

```r title="Pre-allocate result vector"
result <- numeric(n)
for (i in 1:n) {
  result[i] <- i^2
}
```

…or skipping the loop entirely with vectorization:

```r title="Vectorized squared sequence"
result <- (1:n)^2
```

All three give the same answer. The vectorized version is by far the fastest (and shortest), the pre-allocated loop is a respectable second, and the growing-vector version is the one that gave R loops their bad name.

> [TIP]
> If you ever write `result <- c(result, ...)` inside a loop, stop. Either pre-allocate with `numeric(n)` / `vector("list", n)`, or find the vectorized equivalent. Your future self and your coworkers will thank you.

**Try it:** Rewrite this slow loop as a one-line vectorized expression: `out <- c(); for (x in 1:5) out <- c(out, x * 10)`.

```r title="Exercise: One-line times ten"
# one line
out <- ___

```

<details>
<summary>Click to reveal solution</summary>

```r title="Vectorized times ten solution"
out <- (1:5) * 10
out
#> [1] 10 20 30 40 50
```

Multiplying a vector by a scalar applies the operation to every element at once, no loop, no pre-allocation, no `c()` calls. That's what "vectorized" means in R: the work happens in compiled C code with a single allocation instead of N append-and-copy steps.
</details>

## How do while loops and break/next work?

A `while` loop runs as long as its condition is `TRUE`. Use it when you don't know in advance how many iterations you need, typically convergence loops, polling, or random-stopping situations.

```r title="while loop doubling until limit"
x <- 1
while (x < 100) {
  x <- x * 2
}
x
#> [1] 128
```

`break` exits a loop immediately. `next` skips the rest of the current iteration and starts the next one. Both work in `for` and `while`.

```r title="break and next inside for"
for (i in 1:10) {
  if (i == 5) break
  if (i %% 2 == 0) next
  print(i)
}
#> [1] 1
#> [1] 3
```

The loop printed 1 and 3 (odd numbers), skipped 2 and 4 via `next`, and broke at 5 before printing. `break` and `next` are sharp tools, useful, but a clue that your logic could often be expressed more declaratively.

> [NOTE]
> `repeat { ... }` is R's infinite loop, equivalent to `while (TRUE)`. Always pair it with a `break` or you'll lock up your session.

**Try it:** Write a `while` loop that keeps dividing `n` by 2 until it's below 10, starting from `n = 1000`. Print the final value.

```r title="Exercise: Halve until threshold"
n <- 1000
while (n >= 10) {
  n <- n / ___
}
n

```

<details>
<summary>Click to reveal solution</summary>

```r title="Halve until threshold solution"
n <- 1000
while (n >= 10) {
  n <- n / 2
}
n
#> [1] 7.8125
```

The loop halves `n` each pass (1000 → 500 → 250 → 125 → 62.5 → 31.25 → 15.625 → 7.8125) and rechecks the condition at the top. Once `n` drops below 10, `n >= 10` becomes FALSE and the loop exits with the first value that fell under the threshold.
</details>

## When should you prefer apply-family functions over loops?

R has a family of functions, `lapply()`, `sapply()`, `vapply()`, `mapply()`, `apply()`, that replace many loops with a single function call. They're not magically faster than a well-written `for` loop (they use loops under the hood), but they express intent more clearly.

```r title="lapply, sapply, and apply basics"
values <- list(a = 1:5, b = 10:15, c = 100:105)

lapply(values, sum)
#> $a
#> [1] 15
#> 
#> $b
#> [1] 75
#> 
#> $c
#> [1] 615

sapply(values, sum)
#>   a   b   c 
#>  15  75 615

mat <- matrix(1:12, nrow = 3)
apply(mat, 1, sum)
#> [1] 22 26 30
apply(mat, 2, sum)
#> [1]  6 15 24 33
```

`apply(mat, 1, f)` applies `f` to every row (margin = 1); `apply(mat, 2, f)` to every column. The apply family shines when you want "for each element, compute X" without the bookkeeping of indexing, pre-allocation, and assembling results.

**Try it:** Use `sapply()` to get the length of each vector in `values`.

```r title="Exercise: sapply column lengths"
sapply(values, ___)

```

<details>
<summary>Click to reveal solution</summary>

```r title="sapply column lengths solution"
values <- list(a = 1:5, b = 10:15, c = 100:105)
sapply(values, length)
#>  a  b  c
#>  5  6  6
```

`sapply()` calls `length()` on each list element and simplifies the result to a named integer vector, the names come from the list's own names. `a` has 5 elements, while `b` and `c` each have 6 (inclusive integer ranges).
</details>

## Practice Exercises

### Exercise 1: FizzBuzz in R

Print numbers 1 to 15. For multiples of 3 print "Fizz", multiples of 5 print "Buzz", multiples of both print "FizzBuzz".

<details>
<summary>Show solution</summary>

```r title="FizzBuzz with for loop"
for (i in 1:15) {
  out <- ""
  if (i %% 3 == 0) out <- paste0(out, "Fizz")
  if (i %% 5 == 0) out <- paste0(out, "Buzz")
  if (out == "") out <- as.character(i)
  cat(out, "\n")
}
```

Or vectorized:

```r title="Vectorized FizzBuzz with ifelse"
n <- 1:15
ifelse(n %% 15 == 0, "FizzBuzz",
  ifelse(n %% 3 == 0, "Fizz",
    ifelse(n %% 5 == 0, "Buzz", as.character(n))))
#>  [1] "1"        "2"        "Fizz"     "4"        "Buzz"     "Fizz"    
#>  [7] "7"        "8"        "Fizz"     "Buzz"     "11"       "Fizz"    
#> [13] "13"       "14"       "FizzBuzz"
```
</details>

### Exercise 2: First power of 2 exceeding N

Write a `while` loop that finds the smallest power of 2 strictly greater than 1,000,000.

<details>
<summary>Show solution</summary>

```r title="Smallest power of two over million"
x <- 1
while (x <= 1e6) x <- x * 2
x
#> [1] 1048576
```
</details>

### Exercise 3: Convert a loop to vectorized

This loop computes squared distance from the mean for each element. Rewrite it in one vectorized line.

```r title="Squared-distance loop to rewrite"
x <- c(4, 7, 2, 9, 5)
out <- numeric(length(x))
for (i in seq_along(x)) {
  out[i] <- (x[i] - mean(x))^2
}
```

<details>
<summary>Show solution</summary>

```r title="Vectorized squared-distance solution"
out <- (x - mean(x))^2
out
#> [1]  1.44  4.84  9.24 11.56  0.04
```
</details>

## Putting It All Together

A realistic workflow: simulate 1,000 coin flips, track how many flips you need until you hit 5 heads in a row, and repeat the experiment 500 times to estimate the average.

```r title="End-to-end 5-heads streak simulation"
set.seed(42)

flips_until_5_heads <- function() {
  streak <- 0
  flips  <- 0
  while (streak < 5) {
    flips <- flips + 1
    if (sample(c(0, 1), 1) == 1) {
      streak <- streak + 1
    } else {
      streak <- 0
    }
  }
  flips
}

results <- sapply(1:500, function(i) flips_until_5_heads())
mean(results)
#> [1] 62.012
summary(results)
#>    Min. 1st Qu.  Median    Mean 3rd Qu.    Max. 
#>    6.00   21.00   41.00   62.01   84.00  486.00
```

One `while` loop wrapped in a function, then `sapply()` to replicate it 500 times, then one-line summaries. That's the idiomatic R pattern: iterate where you must, vectorize where you can.

## Summary

| Construct | Use when |
|-----------|----------|
| `if / else if / else` | A single scalar decision |
| `ifelse()` / `case_when()` | Element-wise branching across a vector |
| `for (x in seq) { }` | Known iteration count; pre-allocate the result |
| `while (cond) { }` | Unknown iteration count; convergence or polling |
| `break` / `next` | Early exit / skip iteration, use sparingly |
| `lapply()` / `sapply()` / `apply()` | "For each element, compute X", cleaner than a loop |
| Vectorized op | Arithmetic or boolean work on every element, always preferred |

## References

1. [R Language Definition, Control Flow](https://cran.r-project.org/doc/manuals/r-release/R-lang.html#Control-structures)
2. [Advanced R, Control flow](https://adv-r.hadley.nz/control-flow.html) by Hadley Wickham
3. [R for Data Science, Iteration](https://r4ds.hadley.nz/iteration)
4. [R Inferno, Growing objects](https://www.burns-stat.com/pages/Tutor/R_inferno.pdf), why growing vectors in loops kills performance
5. [The R Inferno, Circle 2](https://www.burns-stat.com/pages/Tutor/R_inferno.pdf), vectorization patterns

## Continue Learning

- [R Vectors: The Foundation of Everything in R](R-Vectors.html), why vectorized ops beat loops.
- [R Data Frames: Every Operation You'll Need](R-Data-Frames.html), filter and transform without explicit loops.
- [R Lists: When Data Frames Aren't Flexible Enough](R-Lists.html), the structure that `lapply()` returns by default.
