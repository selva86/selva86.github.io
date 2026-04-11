---
title: "R apply Family Exercises: 12 apply(), lapply(), sapply() Practice Problems"
slug: "R-Apply-Exercises"
description: "Practice R's apply family with 12 exercises on apply(), lapply(), sapply(), vapply(), mapply(), tapply(). Interactive solutions you can run in-browser."
keywords: "R apply exercises, apply family practice, lapply exercises, sapply exercises, tapply exercises, mapply exercises, R vectorized loops"
mathjax: false
webr: true
date: "2026-04-12"
curriculum_id: "E1.9"
post_type: "EX"
auto_link_terms: "apply family exercises|apply() exercises|lapply() exercises|sapply() exercises"
auto_link_case_sensitive: false
sidebar_title: "R apply Family (12 problems)"
fr_parent: "R-Functions.html"
---

# R apply Family Exercises: 12 apply(), lapply(), sapply() Practice Problems

<p class="lead">Practice R's apply family — <code>apply()</code>, <code>lapply()</code>, <code>sapply()</code>, <code>vapply()</code>, <code>mapply()</code>, and <code>tapply()</code> — with 12 progressively harder exercises. Each exercise has an interactive solution you can run in your browser.</p>

The apply family replaces verbose `for` loops with a single readable call. These 12 exercises force you to pick the *right* function for the shape of your input and the shape you want back. Work through them in order — early ones warm up matrix thinking, later ones combine several variants in one pipeline.

## Quick Reference: Which apply Should I Use?

Before you start, here is the one table you will keep coming back to. Each function takes a different input shape, iterates in a different way, and returns a different output shape. Pick by matching your *input* to the first column.

| Function  | Input                | Iterates over           | Returns                                  |
|-----------|----------------------|-------------------------|------------------------------------------|
| `apply()` | Matrix / data frame  | Rows (1) or columns (2) | Vector or matrix                         |
| `lapply()`| List or vector       | Elements                | List (same length as input)              |
| `sapply()`| List or vector       | Elements                | Vector, matrix, or list (auto-simplified)|
| `vapply()`| List or vector       | Elements                | Vector / matrix of a declared type       |
| `mapply()`| Multiple vectors     | Parallel elements       | Vector, matrix, or list                  |
| `tapply()`| Vector + factor(s)   | Groups defined by factor| Vector or array, one value per group     |

Here is a tiny warm-up so the table above becomes muscle memory. We build a 3x3 matrix of exam scores and ask apply() for the mean of each row (one student) and each column (one exam).

```r
scores <- matrix(c(80, 70, 90,
                   85, 95, 75,
                   60, 65, 70),
                 nrow = 3, byrow = TRUE,
                 dimnames = list(c("Ava", "Ben", "Cid"),
                                 c("Exam1", "Exam2", "Exam3")))

apply(scores, MARGIN = 1, FUN = mean)  # row means = per student
#>      Ava      Ben      Cid
#> 80.00000 85.00000 65.00000

apply(scores, MARGIN = 2, FUN = mean)  # col means = per exam
#>    Exam1    Exam2    Exam3
#> 75.00000 76.66667 78.33333
```

The `MARGIN` argument is the entire game with `apply()`: `1` means "walk down the rows", `2` means "walk across the columns". Everything in the exercises below follows that simple rule — you just change what function you feed in.

[KEY INSIGHT]
**The apply family is not about speed — it is about expressing intent.** A `for` loop says "here is a procedure"; `apply()` says "here is a computation on every row". The reader of your code instantly knows the shape of the answer.

## Easy (1-4): apply() on Matrices and Data Frames

Exercises 1-4 focus entirely on `apply()`. Matrices and data frames are two-dimensional, so you always need to decide: rows or columns? That one decision is the whole point of these four problems.

### Exercise 1: Row Totals and Column Totals

You are given a 4x3 matrix of quarterly sales for 4 products. Use `apply()` once for the total sales per product (rows) and once for the total sales per quarter (columns).

```r
# Exercise 1: sales totals by product and by quarter
sales <- matrix(c(120, 150, 170, 200,
                  110, 130, 145, 160,
                  100, 125, 140, 180),
                nrow = 4,
                dimnames = list(paste0("Product", 1:4),
                                c("Q1", "Q2", "Q3")))

# 1. Total per product (row totals)
# 2. Total per quarter (column totals)

```

<details>
<summary>Click to reveal solution</summary>

```r
sales <- matrix(c(120, 150, 170, 200,
                  110, 130, 145, 160,
                  100, 125, 140, 180),
                nrow = 4,
                dimnames = list(paste0("Product", 1:4),
                                c("Q1", "Q2", "Q3")))

# Row totals: MARGIN = 1 walks across the rows
apply(sales, 1, sum)
#> Product1 Product2 Product3 Product4
#>      330      405      455      540

# Column totals: MARGIN = 2 walks across the columns
apply(sales, 2, sum)
#>   Q1   Q2   Q3
#>  640  545  545
```

**Key concept:** `rowSums()` and `colSums()` exist as faster shortcuts, but `apply(x, 1, FUN)` and `apply(x, 2, FUN)` generalise to *any* summary function, not just sum. Learn the general form first.

</details>

### Exercise 2: Column Means on mtcars (Numeric Columns Only)

Apply `mean()` to every numeric column of `mtcars`. All columns are numeric, so you can pass the whole data frame directly. Round each mean to 2 decimal places.

```r
# Exercise 2: mean of every column in mtcars, rounded
# Hint: apply() coerces a data frame to matrix under the hood.
#       Then wrap the result in round().

```

<details>
<summary>Click to reveal solution</summary>

```r
col_means <- apply(mtcars, 2, mean)
round(col_means, 2)
#>    mpg    cyl   disp     hp   drat     wt   qsec     vs     am   gear   carb
#>  20.09   6.19 230.72 146.69   3.60   3.22  17.85   0.44   0.41   3.69   2.81
```

**Key concept:** When every column of a data frame is numeric, `apply(df, 2, FUN)` is perfectly safe. It silently coerces the data frame to a matrix first. If you had a mix of numeric and character columns, everything would become character and `mean()` would break — that is when you switch to `sapply()` or `colMeans()` on a numeric subset.

</details>

### Exercise 3: Row-Wise Best Exam Per Student

Using the `scores` matrix from the warm-up (Ava, Ben, Cid), find the *name* of each student's best exam. You want a length-3 character vector back: one exam label per student.

```r
# Exercise 3: which exam was each student's best?
# Hint: which.max() returns a position; use it to index into column names.
scores <- matrix(c(80, 70, 90,
                   85, 95, 75,
                   60, 65, 70),
                 nrow = 3, byrow = TRUE,
                 dimnames = list(c("Ava", "Ben", "Cid"),
                                 c("Exam1", "Exam2", "Exam3")))

```

<details>
<summary>Click to reveal solution</summary>

```r
apply(scores, 1, function(row) colnames(scores)[which.max(row)])
#>     Ava     Ben     Cid
#> "Exam3" "Exam2" "Exam3"
```

**Key concept:** The function passed to `apply()` can be an anonymous function that returns *any* length-1 value — a number, a string, a logical. Here each row returns one character label, so `apply()` stacks them into a character vector.

</details>

### Exercise 4: Column Spread with a Custom Function

Write a custom function `spread()` that returns `max - min`, then use `apply()` to compute the spread of every column of `mtcars`. The column with the biggest spread is the one with the widest range in that unit.

```r
# Exercise 4: max - min per column
# Hint: define spread() first, then pass it to apply().

```

<details>
<summary>Click to reveal solution</summary>

```r
spread <- function(x) max(x) - min(x)

apply(mtcars, 2, spread)
#>     mpg     cyl    disp      hp    drat      wt    qsec      vs      am    gear    carb
#>  23.500   4.000 400.900 283.000   2.170   3.911   8.400   1.000   1.000   2.000   7.000
```

**Key concept:** Custom functions are where `apply()` earns its keep. `colSums()` cannot compute "max minus min" — but `apply()` can compute anything you can express as a one-liner.

</details>

**Try it:** Given a 5x4 matrix of random values from `matrix(runif(20), nrow = 5)`, use `apply()` to return the *standard deviation* of each column.

```r
set.seed(11)
ex_mat <- matrix(runif(20), nrow = 5)

# your code here

#> Expected: a length-4 numeric vector of column SDs
```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(11)
ex_mat <- matrix(runif(20), nrow = 5)
apply(ex_mat, 2, sd)
#> [1] 0.3395523 0.3044968 0.2717040 0.2877519
```

**Explanation:** `sd()` takes a numeric vector and returns one number, so `apply()` with `MARGIN = 2` produces one SD per column.

</details>

## Medium (5-8): lapply() and sapply() on Lists and Vectors

The next four exercises move from matrices to lists. `lapply()` always returns a list the same length as the input. `sapply()` is the same computation with a "please simplify if you can" wrapper.

### Exercise 5: List Element Lengths with lapply()

You have a list of three character vectors. Use `lapply()` to return a list of their lengths.

```r
# Exercise 5: length of each vector in a list
words <- list(
  fruits  = c("apple", "banana", "cherry"),
  cars    = c("ford", "toyota"),
  colours = c("red", "green", "blue", "yellow", "black")
)

# Return a list where each element is the length of the corresponding vector.

```

<details>
<summary>Click to reveal solution</summary>

```r
words <- list(
  fruits  = c("apple", "banana", "cherry"),
  cars    = c("ford", "toyota"),
  colours = c("red", "green", "blue", "yellow", "black")
)

lapply(words, length)
#> $fruits
#> [1] 3
#>
#> $cars
#> [1] 2
#>
#> $colours
#> [1] 5
```

**Key concept:** `lapply()` always returns a list with named elements preserved from the input. The value inside each slot is whatever your function returned — in this case a single integer.

</details>

### Exercise 6: Same Problem, But Simplified with sapply()

Repeat Exercise 5, but use `sapply()` instead. Notice how the return shape changes.

```r
# Exercise 6: sapply() on the same list
words <- list(
  fruits  = c("apple", "banana", "cherry"),
  cars    = c("ford", "toyota"),
  colours = c("red", "green", "blue", "yellow", "black")
)

# Use sapply() and inspect the output shape.

```

<details>
<summary>Click to reveal solution</summary>

```r
words <- list(
  fruits  = c("apple", "banana", "cherry"),
  cars    = c("ford", "toyota"),
  colours = c("red", "green", "blue", "yellow", "black")
)

sapply(words, length)
#>  fruits    cars colours
#>       3       2       5
```

**Key concept:** Every result from `length()` is a single integer, so `sapply()` sees "three length-1 results" and simplifies to a named integer vector. If the results had been different lengths, `sapply()` would have returned a list — identical to `lapply()`.

</details>

[WARNING]
**sapply() output shape is not guaranteed.** Because it auto-simplifies, your function might return a vector on test data and a list on production data. For code you ship, use `vapply()` (Exercise 11) — it forces you to declare the return type up front.

### Exercise 7: sapply() on a Data Frame Returns a Matrix

Apply the `range()` function to every numeric column of `iris`. `range()` returns a length-2 vector (min, max). Because every result is length 2, `sapply()` stacks them into a matrix.

```r
# Exercise 7: min and max for every numeric column of iris
iris_num <- iris[, 1:4]

# Use sapply() with range() here.

```

<details>
<summary>Click to reveal solution</summary>

```r
iris_num <- iris[, 1:4]
sapply(iris_num, range)
#>      Sepal.Length Sepal.Width Petal.Length Petal.Width
#> [1,]          4.3         2.0          1.0         0.1
#> [2,]          7.9         4.4          6.9         2.5
```

**Key concept:** When every result from the function is the *same* length > 1, `sapply()` puts them side by side as matrix columns. The column names come from the data frame names.

</details>

### Exercise 8: lapply() to Convert All Character Columns to Factors

You have a small data frame with a mix of character and numeric columns. Use `lapply()` with a helper function to convert *only* the character columns to factors, leaving numerics alone.

```r
# Exercise 8: convert character columns to factors
dat <- data.frame(
  id    = 1:4,
  group = c("A", "B", "A", "B"),
  score = c(10.1, 12.3, 9.8, 11.7),
  grade = c("pass", "pass", "fail", "pass"),
  stringsAsFactors = FALSE
)

# Use lapply() so that character columns become factors and others are unchanged.

```

<details>
<summary>Click to reveal solution</summary>

```r
dat <- data.frame(
  id    = 1:4,
  group = c("A", "B", "A", "B"),
  score = c(10.1, 12.3, 9.8, 11.7),
  grade = c("pass", "pass", "fail", "pass"),
  stringsAsFactors = FALSE
)

dat[] <- lapply(dat, function(col) {
  if (is.character(col)) factor(col) else col
})
str(dat)
#> 'data.frame':    4 obs. of  4 variables:
#>  $ id   : int  1 2 3 4
#>  $ group: Factor w/ 2 levels "A","B": 1 2 1 2
#>  $ score: num  10.1 12.3 9.8 11.7
#>  $ grade: Factor w/ 2 levels "fail","pass": 2 2 1 2
```

**Key concept:** A data frame is a list of columns. `lapply(df, FUN)` iterates one column at a time. The `dat[] <- ...` assignment preserves the data frame structure; plain `dat <- lapply(...)` would turn it into a bare list.

</details>

**Try it:** Use `sapply()` to return the *class* of every column of the built-in `airquality` data frame.

```r
# your code here

#> Expected: a named character vector, one class per column
```

<details>
<summary>Click to reveal solution</summary>

```r
sapply(airquality, class)
#>     Ozone   Solar.R      Wind      Temp     Month       Day
#> "integer" "integer" "numeric" "integer" "integer" "integer"
```

**Explanation:** `class()` returns a length-1 character for these columns, so `sapply()` flattens the results into a named character vector.

</details>

## Hard (9-12): vapply(), mapply(), tapply(), and a Pipeline

The last four exercises cover the three less-common members of the family and finish with a combined pipeline. These are the problems that make you *pick* the right function rather than reach for `sapply()` out of habit.

### Exercise 9: Grouped Means with tapply()

Using `mtcars`, compute the mean `mpg` for each level of `cyl` (4, 6, 8). `tapply()` is built for exactly this: one value per group.

```r
# Exercise 9: mean mpg by number of cylinders
# Hint: tapply(values, groups, FUN)

```

<details>
<summary>Click to reveal solution</summary>

```r
tapply(mtcars$mpg, mtcars$cyl, mean)
#>        4        6        8
#> 26.66364 19.74286 15.10000
```

**Key concept:** `tapply()` is the base-R answer to `group_by() |> summarise()`. The first argument is the values to summarise, the second is the grouping factor, the third is the summary function. The result is named by the group levels.

</details>

### Exercise 10: mapply() for Parallel Iteration

`mapply()` is the multivariate sibling of `sapply()` — it walks over *several* vectors in parallel. Use it to create a vector of strings like `"Product1: 330"` by pasting product names with their row totals from Exercise 1.

```r
# Exercise 10: pair product names with their totals
products <- c("Product1", "Product2", "Product3", "Product4")
totals   <- c(330, 405, 455, 540)

# Use mapply() to build "Product1: 330", "Product2: 405", ...

```

<details>
<summary>Click to reveal solution</summary>

```r
products <- c("Product1", "Product2", "Product3", "Product4")
totals   <- c(330, 405, 455, 540)

mapply(function(p, t) paste0(p, ": ", t), products, totals)
#>      Product1      Product2      Product3      Product4
#> "Product1: 330" "Product2: 405" "Product3: 455" "Product4: 540"
```

**Key concept:** `mapply()` iterates position by position. Call N=1 uses `products[1]` and `totals[1]`, call N=2 uses `products[2]` and `totals[2]`, and so on. The function receives as many arguments as the number of vectors you pass.

</details>

### Exercise 11: vapply() with an Explicit Type Check

Rewrite Exercise 6 using `vapply()`. You must declare the return type via `FUN.VALUE`. If any call to `length()` returned something that is not a length-1 integer, `vapply()` would throw an error — that is the safety net.

```r
# Exercise 11: vapply() with a type contract
words <- list(
  fruits  = c("apple", "banana", "cherry"),
  cars    = c("ford", "toyota"),
  colours = c("red", "green", "blue", "yellow", "black")
)

# Use vapply() with FUN.VALUE = integer(1).

```

<details>
<summary>Click to reveal solution</summary>

```r
words <- list(
  fruits  = c("apple", "banana", "cherry"),
  cars    = c("ford", "toyota"),
  colours = c("red", "green", "blue", "yellow", "black")
)

vapply(words, length, FUN.VALUE = integer(1))
#>  fruits    cars colours
#>       3       2       5
```

**Key concept:** `FUN.VALUE` is a template — "I promise every call returns an object shaped like this". `integer(1)` means "exactly one integer". If your function accidentally returned `NA_character_` for one element, `vapply()` would stop with a clear error instead of silently degrading to a list.

</details>

[TIP]
**Prefer vapply() in reusable functions.** Inside a quick script, `sapply()` is fine. Inside a function others will call, `vapply()` catches bad inputs at the point of failure rather than three stack frames later.

### Exercise 12: A Combined Pipeline

Here is one realistic problem that pulls several pieces together. Using `iris`: for every `Species`, compute the mean of every numeric column, and return the result as a matrix with one column per species. This combines `split()` and `sapply()` with `colMeans()`.

```r
# Exercise 12: per-species column means
# Hint: split() iris into a list by Species,
#       then sapply() that list with colMeans() applied to just the numeric columns.

```

<details>
<summary>Click to reveal solution</summary>

```r
by_species <- split(iris[, 1:4], iris$Species)

sapply(by_species, colMeans)
#>              setosa versicolor virginica
#> Sepal.Length  5.006      5.936     6.588
#> Sepal.Width   3.428      2.770     2.974
#> Petal.Length  1.462      4.260     5.552
#> Petal.Width   0.246      1.326     2.026
```

**Key concept:** `split()` turns a data frame into a list keyed by a factor. Once you have a list, the whole `lapply()`/`sapply()` machinery is available. Every "grouped analysis" problem in base R can be rewritten as `split() |> lapply()` — `tapply()` is just a pre-packaged version for one-column summaries.

</details>

**Try it:** For every `Species` in `iris`, compute the *maximum* Petal.Length using `tapply()`.

```r
# your code here

#> Expected: a length-3 named numeric vector
```

<details>
<summary>Click to reveal solution</summary>

```r
tapply(iris$Petal.Length, iris$Species, max)
#>     setosa versicolor  virginica
#>        1.9        5.1        6.9
```

**Explanation:** `tapply()` applies `max()` within each level of `Species` and returns one value per group, named by the level.

</details>

## Summary

Here are the one-line takeaways to keep next to your screen.

| Exercise | Function       | One-line rule                                                         |
|----------|----------------|-----------------------------------------------------------------------|
| 1, 2     | `apply()`      | `MARGIN = 1` for rows, `MARGIN = 2` for columns.                       |
| 3, 4     | `apply()`      | Pass any function that takes a vector and returns a length-1 value.    |
| 5, 6     | `lapply`/`sapply` | Same computation, different return shape — `sapply()` auto-simplifies. |
| 7        | `sapply()`     | Same-length results stack into a matrix.                               |
| 8        | `lapply()`     | Data frames are lists of columns; iterate safely with `lapply()`.      |
| 9        | `tapply()`     | One value per group, driven by a factor.                               |
| 10       | `mapply()`     | Parallel iteration over multiple vectors.                              |
| 11       | `vapply()`     | `sapply()` with a type contract — use in reusable code.                |
| 12       | `sapply` + `split` | Any grouped computation = `split()` into a list, then iterate.     |

## References

1. R Core Team — *Writing R Extensions*. [Link](https://cran.r-project.org/doc/manuals/r-release/R-exts.html)
2. `base::apply` reference page. [Link](https://rdrr.io/r/base/apply.html)
3. `base::lapply` reference page (covers `lapply`, `sapply`, `vapply`, `mapply`, `rapply`). [Link](https://rdrr.io/r/base/lapply.html)
4. Wickham, H. — *Advanced R*, 2nd Edition, Chapter 9: Functionals. [Link](https://adv-r.hadley.nz/functionals.html)
5. R Core Team — *An Introduction to R*, section on grouped operations. [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html)

## Continue Learning

- [R Functions](R-Functions.html) — the prerequisite for every apply exercise: how to write the functions you pass in.
- [R Lists](R-Lists.html) — deep dive into the data structure `lapply()` and `sapply()` return.
- [R Control Flow Exercises](R-Control-Flow-Exercises.html) — when a `for` loop *is* the right answer, and when it is not.
