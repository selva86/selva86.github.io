---
title: "purrr Exercises: 13 Functional Programming Practice Problems, Solved Step-by-Step"
slug: "purrr-Exercises"
description: "Practise purrr with 13 functional programming problems and worked solutions, runnable R exercises from beginner warm-ups to advanced iteration patterns."
keywords: "purrr exercises, purrr practice problems, purrr map exercises, functional programming R exercises, map2 pmap exercises, tidyverse iteration practice, map_dfr exercises, safely purrr, nest map purrr"
mathjax: false
webr: true
date: "2026-04-14"
curriculum_id: "E2.8"
post_type: "EX"
sidebar_title: "purrr (13 problems)"
auto_link_terms: "purrr exercises|purrr practice problems|purrr map exercises|functional programming exercises R|map2 practice|pmap practice|map_dfr exercises"
auto_link_case_sensitive: false
fr_parent: "Functional-Programming-in-R.html"
difficulty: "Intermediate"
exercise_count: 13
time_estimate_min: 50
---


# purrr Exercises: 13 Functional Programming Practice Problems

<p class="lead">Thirteen hands-on purrr problems covering the typed <code>map_*()</code> family, <code>map2()</code>, <code>pmap()</code>, <code>map_dfr()</code>, <code>nest()</code>, <code>safely()</code>, and the <code>\(x)</code> lambda shortcut, each with an expected result so you can verify and a runnable solution behind a reveal. Difficulty progresses from beginner to advanced.</p>

The 13 problems are grouped into three sections. Section 1 covers the typed `map_*()` family one variant at a time. Section 2 mixes predicates, row-binding, and parallel iteration with `map2()` and `pmap()`. Section 3 stitches list-columns, error handling, and lambdas into the kind of pipelines you write on the job. Every problem ships with an expected result, two progressive hints, and a hidden solution with an explanation.

```r title="Run this once before any exercise"
library(purrr)
library(dplyr)
library(tidyr)
library(broom)
library(tibble)
```

All code runs in one shared R session, so the setup block above loads the packages once and the exercises do not repeat it. Use `ex_` prefixed names (already scaffolded) so you do not overwrite anything by accident.

## Section 1. The typed map family

These three problems use one `map_*()` variant each. The typed `map_*()` family is the workhorse of purrr: you hand it a list (or a data frame, which is a list of columns) and a function, and it applies the function to every element, returning a guaranteed-type atomic vector instead of a list.

### Exercise 1.1: Mean of every column with map_dbl

**Task:** Compute the mean of every column in `airquality` and store it in `ex_1_1`. The dataset has missing values, so pass `na.rm = TRUE` through `map_dbl()` using its `...` slot. Save the result to `ex_1_1`.

**Expected result:**

```
#>     Ozone   Solar.R      Wind      Temp     Month       Day
#>  42.12931 185.93151   9.95752  77.88235   6.99346  15.80392
```

**Difficulty:** Beginner

[HINTS]
Any argument you put after the function is forwarded to every call, so the missing-value option travels along with it.
Use the variant that guarantees a numeric vector and pass `na.rm = TRUE` as a trailing argument: `map_dbl(airquality, mean, na.rm = TRUE)`.

```r title="Your turn"
ex_1_1 <- map_dbl(airquality, mean, ___)
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- map_dbl(airquality, mean, na.rm = TRUE)
ex_1_1
#>     Ozone   Solar.R      Wind      Temp     Month       Day
#>  42.12931 185.93151   9.95752  77.88235   6.99346  15.80392
```

**Explanation:** Any argument you put after the function in `map_dbl()` is forwarded to every call. Here `na.rm = TRUE` tells `mean()` to ignore NAs in `Ozone` and `Solar.R`. Without it, those two columns would come back as `NA` and poison any downstream arithmetic. `map_dbl()` guarantees the output is a named `numeric` vector, so downstream code that does `round(..., 2)` or `sort()` just works.

</details>

### Exercise 1.2: Column classes with map_chr

**Task:** Return the class of every column in `iris` as a character vector. The right variant here is `map_chr()` because each call returns one string. Save the result to `ex_1_2`.

**Expected result:**

```
#> Sepal.Length  Sepal.Width Petal.Length  Petal.Width      Species
#>    "numeric"    "numeric"    "numeric"    "numeric"     "factor"
```

**Difficulty:** Beginner

[HINTS]
You want one string back per column, so pick the typed variant whose contract is exactly one character value.
Call `map_chr(iris, class)` to apply `class()` to every column and coerce the result to a character vector.

```r title="Your turn"
ex_1_2 <- ___(iris, class)
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- map_chr(iris, class)
ex_1_2
#> Sepal.Length  Sepal.Width Petal.Length  Petal.Width      Species
#>    "numeric"    "numeric"    "numeric"    "numeric"     "factor"
```

**Explanation:** `map_chr()` enforces that every call returns exactly one character value. `class()` fits that shape for every column in `iris`. If you ran `map_chr()` against an object where `class()` returns multiple strings (some S4 objects do), you would get a clear type error, which is better than a quietly malformed result.

</details>

### Exercise 1.3: Distinct value counts with map_int

**Task:** Count the number of unique values in every column of `iris` and save the result. Use `map_int()` with a lambda that calls `length(unique(x))`. Save the result to `ex_1_3`.

**Expected result:**

```
#> Sepal.Length  Sepal.Width Petal.Length  Petal.Width      Species
#>           35           23           43           22            3
```

**Difficulty:** Beginner

[HINTS]
The per-column answer is a whole-number count, so reach for the integer-typed variant and write a one-off function inline.
Use `map_int(iris, \(x) length(unique(x)))`, where `\(x)` is the R 4.1+ lambda shortcut.

```r title="Your turn"
ex_1_3 <- map_int(iris, ___)
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- map_int(iris, \(x) length(unique(x)))
ex_1_3
#> Sepal.Length  Sepal.Width Petal.Length  Petal.Width      Species
#>           35           23           43           22            3
```

**Explanation:** The `\(x)` lambda is R 4.1+ shorthand for `function(x)`. `length(unique(x))` is one common way to count distinct values; `map_int()` then coerces the result to a named integer vector. `dplyr::n_distinct()` does the same job and is slightly faster on large vectors, but `length(unique())` needs no extra package.

</details>

## Section 2. Predicates, row-binding, and parallel inputs

These four problems combine two or more ideas. `map_lgl()` answers TRUE/FALSE questions about every element, `map_dfr()` stacks data frames returned by each iteration into one tidy frame, `map2()` walks two inputs in parallel, and `pmap()` generalises to three or more inputs by iterating over the rows of a data frame.

### Exercise 2.1: Centered non-negative check with map_lgl

**Task:** `airquality` has values that become negative after centering. Center every numeric column (subtract the mean) then find which columns still contain only non-negative values. Handle NAs with `na.rm = TRUE`. Save the result to `ex_2_1`.

**Expected result:**

```
#>   Ozone Solar.R    Wind    Temp   Month     Day
#>   FALSE   FALSE   FALSE   FALSE   FALSE   FALSE
```

**Difficulty:** Intermediate

[HINTS]
First transform every column, then test each one with a predicate; the test step needs a variant that returns TRUE/FALSE.
After `centered <- map(airquality, \(x) x - mean(x, na.rm = TRUE))`, use `map_lgl(centered, \(x) all(x >= 0, na.rm = TRUE))`.

```r title="Your turn"
centered <- map(airquality, \(x) x - mean(x, na.rm = TRUE))
ex_2_1 <- ___(centered, \(x) all(x >= 0, na.rm = TRUE))
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
centered <- map(airquality, \(x) x - mean(x, na.rm = TRUE))
ex_2_1 <- map_lgl(centered, \(x) all(x >= 0, na.rm = TRUE))
ex_2_1
#>   Ozone Solar.R    Wind    Temp   Month     Day
#>   FALSE   FALSE   FALSE   FALSE   FALSE   FALSE
```

**Explanation:** Centering by the mean guarantees the new column sums to zero, which forces at least some values below zero. Every entry in `ex_2_1` is FALSE, exactly as you would expect from the math. The chain `map() |> map_lgl()` is very common: first transform, then test. `map_lgl()` plus a predicate gives you a keep/drop mask in one line, no loop required.

</details>

### Exercise 2.2: Per-group tidy regression with map_dfr

**Task:** For each cylinder group in `mtcars`, fit `lm(mpg ~ wt)` and row-bind the tidy coefficient tables into one data frame. Use `split()` to get a list of three data frames, then `map_dfr()` to stack the tidy results with a `.id` column naming the group. Save the result to `ex_2_2`.

**Expected result:**

```
#> # A tibble: 6 x 6
#>   cyl   term        estimate std.error statistic  p.value
#>   <chr> <chr>          <dbl>     <dbl>     <dbl>    <dbl>
#> 1 4     (Intercept)    39.6       4.35      9.10 7.77e- 6
#> 2 4     wt             -5.65     1.85      -3.05 1.37e- 2
#> 3 6     (Intercept)    28.4       4.18      6.79 1.05e- 3
#> 4 6     wt             -2.78     1.33      -2.08 9.18e- 2
#> 5 8     (Intercept)    23.9       3.01      7.94 4.05e- 6
#> 6 8     wt             -2.19     0.739    -2.97 1.18e- 2
```

**Difficulty:** Intermediate

[HINTS]
You need each iteration to return a small data frame and all of them stacked into one, with a column recording the group.
Use `split(mtcars, mtcars$cyl)`, then `map_dfr(groups, \(df) tidy(lm(mpg ~ wt, data = df)), .id = "cyl")`.

```r title="Your turn"
groups <- split(mtcars, mtcars$cyl)

ex_2_2 <- ___(groups, \(df) tidy(lm(mpg ~ wt, data = df)), .id = "cyl")
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
groups <- split(mtcars, mtcars$cyl)

ex_2_2 <- map_dfr(groups, \(df) tidy(lm(mpg ~ wt, data = df)), .id = "cyl")
ex_2_2
#> # A tibble: 6 x 6
#>   cyl   term        estimate std.error statistic  p.value
#>   <chr> <chr>          <dbl>     <dbl>     <dbl>    <dbl>
#> 1 4     (Intercept)    39.6       4.35      9.10 7.77e- 6
#> 2 4     wt             -5.65     1.85      -3.05 1.37e- 2
#> 3 6     (Intercept)    28.4       4.18      6.79 1.05e- 3
#> 4 6     wt             -2.78     1.33      -2.08 9.18e- 2
#> 5 8     (Intercept)    23.9       3.01      7.94 4.05e- 6
#> 6 8     wt             -2.19     0.739    -2.97 1.18e- 2
```

**Explanation:** `split()` returns a named list keyed by `cyl`. `map_dfr()` walks that list, calls `tidy(lm(...))` on each data frame, and row-binds the six resulting mini-tables. The `.id = "cyl"` argument copies the list name into a new column so you know which row came from which group. `map_dfr()` is the purrr answer to `do.call(rbind, lapply(...))`, with better readability and the free `.id` column.

</details>

### Exercise 2.3: Pointwise maximum with map2

**Task:** Given the two numeric vectors of equal length in the starter block, compute the pointwise maximum for each index. Use `map2_dbl()` so the output is a plain numeric vector. Save the result to `ex_2_3`.

**Expected result:**

```
#> [1]  5  8  7  6 10
```

**Difficulty:** Intermediate

[HINTS]
Two vectors must be walked in step, one index at a time, and you want a plain numeric vector back.
Use `map2_dbl(a, b, max)` to call `max(a[i], b[i])` for every index.

```r title="Your turn"
a <- c(3, 8, 1, 6, 10)
b <- c(5, 4, 7, 2, 9)

ex_2_3 <- ___(a, b, max)
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
a <- c(3, 8, 1, 6, 10)
b <- c(5, 4, 7, 2, 9)

ex_2_3 <- map2_dbl(a, b, max)
ex_2_3
#> [1]  5  8  7  6 10
```

**Explanation:** `map2_dbl()` walks `a` and `b` together, calling `max(a[i], b[i])` for every index and returning a numeric vector. This is the same as `pmax(a, b)` in base R; `map2()` shines when the per-element function is more complex than `max()`, say a custom calculation that base R cannot vectorise.

</details>

### Exercise 2.4: Compound interest with pmap

**Task:** Using the loans tibble in the starter block (columns `principal`, `rate`, and `years`), compute the compound interest final value for each row with `pmap_dbl()` and the formula `principal * (1 + rate)^years`. Save the result to `ex_2_4`.

**Expected result:**

```
#> [1] 1628.895 6083.264 3062.575
```

**Difficulty:** Intermediate

[HINTS]
Each row supplies three values to the same calculation, so you need the variant that iterates over rows of a data frame.
Use `pmap_dbl(loans, \(principal, rate, years) principal * (1 + rate)^years)`, naming the lambda arguments to match the columns.

```r title="Your turn"
loans <- data.frame(
  principal = c(1000, 5000, 2500),
  rate      = c(0.05, 0.04, 0.07),
  years     = c(10, 5, 3)
)

ex_2_4 <- ___(loans, \(principal, rate, years) principal * (1 + rate)^years)
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
loans <- data.frame(
  principal = c(1000, 5000, 2500),
  rate      = c(0.05, 0.04, 0.07),
  years     = c(10, 5, 3)
)

ex_2_4 <- pmap_dbl(loans, \(principal, rate, years) principal * (1 + rate)^years)
ex_2_4
#> [1] 1628.895 6083.264 3062.575
```

**Explanation:** `pmap()` treats each column of `loans` as a parallel input. For row *i* it calls your lambda with `principal = loans$principal[i]`, `rate = loans$rate[i]`, `years = loans$years[i]`. Name your lambda arguments to match the column names and the binding is automatic. `pmap_dbl()` then coerces the three results into a numeric vector.

</details>

## Section 3. List-columns, error handling, and real pipelines

These six problems stitch three or more concepts into the kind of pipelines you write on the job: grouped data kept in one tidy frame via `nest()` plus `map()`, iterations that might fail handled with `safely()` and `quietly()`, and short one-off `\(x)` lambdas.

### Exercise 3.1: Per-group nested correlation

**Task:** For each cylinder group in `mtcars`, compute the Pearson correlation between `mpg` and `wt`. Nest the data frame with `nest()`, map a correlation function over the `data` list-column, and keep only `cyl` and `corr`. Save the result to `ex_3_1`.

**Expected result:**

```
#> # A tibble: 3 x 2
#> # Groups:   cyl [3]
#>     cyl   corr
#>   <dbl>  <dbl>
#> 1     6 -0.682
#> 2     4 -0.713
#> 3     8 -0.650
```

**Difficulty:** Advanced

[HINTS]
Once each group is collapsed into a list-column, you need a typed variant that returns one number per nested data frame.
Inside `mutate()`, use `map_dbl(data, \(df) cor(df$mpg, df$wt))`, then `select(cyl, corr)`.

```r title="Your turn"
nested <- mtcars |>
  group_by(cyl) |>
  nest()

ex_3_1 <- nested |>
  mutate(corr = ___(data, \(df) cor(df$mpg, df$wt))) |>
  select(cyl, corr)
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
nested <- mtcars |>
  group_by(cyl) |>
  nest()

ex_3_1 <- nested |>
  mutate(corr = map_dbl(data, \(df) cor(df$mpg, df$wt))) |>
  select(cyl, corr)
ex_3_1
#> # A tibble: 3 x 2
#> # Groups:   cyl [3]
#>     cyl   corr
#>   <dbl>  <dbl>
#> 1     6 -0.682
#> 2     4 -0.713
#> 3     8 -0.650
```

**Explanation:** `group_by() |> nest()` creates a list-column called `data` where each row holds a mini data frame for one cylinder group. `map_dbl()` walks that list-column, computes one correlation per group, and returns a numeric vector that `mutate()` stores alongside the grouping key. This is the foundation of the tidyverse split-apply-combine pattern.

</details>

### Exercise 3.2: Error-tolerant log with safely

**Task:** Wrap `log()` with `safely()` so a problematic input returns the error slot instead of stopping the pipeline. Map the safe version over `c(4, -2, 9)` and inspect the shape of the results. Save the list of results to `ex_3_2` and print its first element.

**Expected result:**

```
#> $result
#> [1] 1.386294
#>
#> $error
#> NULL
```

**Difficulty:** Advanced

[HINTS]
You need a wrapper that converts a stop into data, returning a two-slot list for every call instead of crashing.
Build `safe_log <- safely(log)`, then `map(c(4, -2, 9), safe_log)` and look at `ex_3_2[[1]]`.

```r title="Your turn"
safe_log <- ___(log)
ex_3_2 <- map(c(4, -2, 9), safe_log)
ex_3_2[[1]]
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
safe_log <- safely(log)
ex_3_2 <- map(c(4, -2, 9), safe_log)
ex_3_2[[1]]
#> $result
#> [1] 1.386294
#>
#> $error
#> NULL
```

**Explanation:** `safely()` takes a function and returns a new function that wraps every call in a try/catch. On success, `$result` holds the value and `$error` is NULL; on failure the reverse. For `log(-2)` R returns NaN with a warning (not an error), so `$error` is still NULL, a reminder that "warning" and "error" are different in R. `safely()` returns a list of lists, so use `map("result")` or `transpose()` to separate successes from failures.

</details>

### Exercise 3.3: Z-score numeric columns with a lambda

**Task:** Z-score every numeric column of `iris` (subtract the mean, divide by the standard deviation) using a `\(x)` lambda inside `map()`. The `Species` column is not numeric, so drop it first with `keep(is.numeric)`. Save the result to `ex_3_3` and print the first six values of the scaled `Sepal.Length` column.

**Expected result:**

```
#> [1] -0.8976739 -1.1392005 -1.3807271 -1.5014904 -1.0184372 -0.5353840
```

**Difficulty:** Advanced

[HINTS]
Filter the columns down to the numeric ones first, then apply the standardisation formula to each with an inline function.
Use `keep(is.numeric)` then `map(\(x) (x - mean(x)) / sd(x))`.

```r title="Your turn"
ex_3_3 <- iris |>
  keep(is.numeric) |>
  map(___)
head(ex_3_3$Sepal.Length, 6)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- iris |>
  keep(is.numeric) |>
  map(\(x) (x - mean(x)) / sd(x))
head(ex_3_3$Sepal.Length, 6)
#> [1] -0.8976739 -1.1392005 -1.3807271 -1.5014904 -1.0184372 -0.5353840
```

**Explanation:** `keep(is.numeric)` drops `Species` before the iteration starts. Then `map()` applies the z-score lambda to every remaining column. The `\(x)` shortcut lets you write the formula inline without a `function(x) { ... }` wrapper, perfect for a one-off transformation you do not plan to reuse.

</details>

### Exercise 3.4: Grouped summary table in one pipeline

**Task:** For `mtcars`, nest by `cyl` and compute three per-group aggregates in one `mutate()` plus `map_*()` sweep: mean `mpg`, max `hp`, and row count. Return a single tidy frame with columns `cyl`, `mean_mpg`, `max_hp`, and `n_rows`. Save the result to `ex_3_4`.

**Expected result:**

```
#> # A tibble: 3 x 4
#> # Groups:   cyl [3]
#>     cyl mean_mpg max_hp n_rows
#>   <dbl>    <dbl>  <dbl>  <int>
#> 1     6     19.7    175      7
#> 2     4     26.7    113     11
#> 3     8     15.1    335     14
```

**Difficulty:** Advanced

[HINTS]
Each aggregate has a different shape, so match the typed variant to its answer: numbers for two, a count for the third.
Inside one `mutate()`, use `map_dbl(data, \(df) mean(df$mpg))`, `map_dbl(data, \(df) max(df$hp))`, and `map_int(data, nrow)`.

```r title="Your turn"
ex_3_4 <- mtcars |>
  group_by(cyl) |>
  nest() |>
  # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_4 <- mtcars |>
  group_by(cyl) |>
  nest() |>
  mutate(
    mean_mpg = map_dbl(data, \(df) mean(df$mpg)),
    max_hp   = map_dbl(data, \(df) max(df$hp)),
    n_rows   = map_int(data, nrow)
  ) |>
  select(cyl, mean_mpg, max_hp, n_rows)
ex_3_4
#> # A tibble: 3 x 4
#> # Groups:   cyl [3]
#>     cyl mean_mpg max_hp n_rows
#>   <dbl>    <dbl>  <dbl>  <int>
#> 1     6     19.7    175      7
#> 2     4     26.7    113     11
#> 3     8     15.1    335     14
```

**Explanation:** Three `map_*()` calls inside one `mutate()` let you build the summary in a single pipe. Each call picks the typed variant that matches its answer: `map_dbl()` for the two numeric summaries, `map_int()` for the row count. Using the right typed variant keeps the downstream columns from becoming list-columns of numerics.

</details>

### Exercise 3.5: Safely parse many character vectors with quietly

**Task:** Using the list of three character vectors in the starter block (two cleanly numeric, one with a non-numeric token), wrap `as.numeric` in `quietly()`, map it over the list, and build a tidy tibble with columns `input_id` (which vector) and `status` (`"ok"` if the conversion produced no warnings, `"failed"` otherwise). Save the result to `ex_3_5`.

**Expected result:**

```
#> # A tibble: 3 x 2
#>   input_id status
#>   <chr>    <chr>
#> 1 a        ok
#> 2 b        failed
#> 3 c        ok
```

**Difficulty:** Advanced

[HINTS]
A failed numeric conversion raises a warning, not an error, so you need the wrapper that captures warnings alongside results.
Build `quiet_numeric <- quietly(as.numeric)`, map it over the list, then test each result's `$warnings` slot with `map_chr()`.

```r title="Your turn"
raw <- list(
  a = c("1", "2", "3"),
  b = c("4.5", "oops", "6"),
  c = c("7", "8", "9")
)

quiet_numeric <- ___(as.numeric)
parsed <- map(raw, quiet_numeric)
ex_3_5 <- tibble(
  input_id = names(parsed),
  status   = map_chr(parsed, \(p) if (length(p$warnings) == 0) "ok" else "failed")
)
ex_3_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
raw <- list(
  a = c("1", "2", "3"),
  b = c("4.5", "oops", "6"),
  c = c("7", "8", "9")
)

quiet_numeric <- quietly(as.numeric)
parsed <- map(raw, quiet_numeric)
ex_3_5 <- tibble(
  input_id = names(parsed),
  status   = map_chr(parsed, \(p) if (length(p$warnings) == 0) "ok" else "failed")
)
ex_3_5
#> # A tibble: 3 x 2
#>   input_id status
#>   <chr>    <chr>
#> 1 a        ok
#> 2 b        failed
#> 3 c        ok
```

**Explanation:** `quietly()` is the sibling of `safely()` that also captures warnings, and `as.numeric()` issues a warning (not an error) when a token fails to parse. The solution uses `map()` to run the quiet version, then `map_chr()` to inspect each result's `$warnings` slot. Pattern: pick `safely()` for errors, `quietly()` for warnings, `possibly()` when you just want a default value on failure.

</details>

### Exercise 3.6: All pairwise correlations with pmap_dbl

**Task:** Using the tibble `df` with three numeric columns `x`, `y`, `w` in the starter block, compute the three pairwise Pearson correlations, `cor(x,y)`, `cor(x,w)`, `cor(y,w)`, in a single `pmap_dbl()` call over a helper tibble that lists the column pairs. Save the result to `ex_3_6` as a named numeric vector with entries `x_y`, `x_w`, `y_w`.

**Expected result:**

```
#>       x_y       x_w       y_w
#> 0.1204519 0.1596373 0.1893028
```

**Difficulty:** Advanced

[HINTS]
Build a small table whose rows name the two columns to correlate, then iterate over its rows pulling each pair out by name.
Make a `pairs` tibble of column-name pairs and call `pmap_dbl(pairs, \(a, b) cor(df[[a]], df[[b]]))`.

```r title="Your turn"
set.seed(17)
df <- tibble(
  x = rnorm(50),
  y = rnorm(50) + 0.4 * rnorm(50),
  w = rnorm(50)
)
pairs <- tibble(
  a = c("x", "x", "y"),
  b = c("y", "w", "w")
)

ex_3_6 <- ___(pairs, \(a, b) cor(df[[a]], df[[b]]))
names(ex_3_6) <- paste(pairs$a, pairs$b, sep = "_")
ex_3_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(17)
df <- tibble(
  x = rnorm(50),
  y = rnorm(50) + 0.4 * rnorm(50),
  w = rnorm(50)
)
pairs <- tibble(
  a = c("x", "x", "y"),
  b = c("y", "w", "w")
)

ex_3_6 <- pmap_dbl(pairs, \(a, b) cor(df[[a]], df[[b]]))
names(ex_3_6) <- paste(pairs$a, pairs$b, sep = "_")
ex_3_6
#>       x_y       x_w       y_w
#> 0.1204519 0.1596373 0.1893028
```

**Explanation:** The trick is building a small `pairs` tibble with the column names you want to correlate, then `pmap_dbl()` walks its rows, pulling out `df[[a]]` and `df[[b]]` at each step. This pattern scales: if you had 20 columns and wanted all pairs, you would generate `pairs` with `utils::combn(names(df), 2)` and feed the same `pmap_dbl()` call unchanged.

</details>

## Summary

The 13 problems together exercise the purrr vocabulary you will use in 90% of real analysis code.

| Function / helper | Exercises that use it |
|---|---|
| `map_dbl()` | 1.1, 3.1, 3.4 |
| `map_chr()` | 1.2, 3.5 |
| `map_int()` | 1.3, 3.4 |
| `map_lgl()` | 2.1 |
| `map()` | 2.1, 3.2, 3.3, 3.5 |
| `map_dfr()` | 2.2 |
| `map2_dbl()` | 2.3 |
| `pmap_dbl()` | 2.4, 3.6 |
| `nest()` + list-columns | 3.1, 3.4 |
| `safely()` / `quietly()` | 3.2, 3.5 |
| `keep()` + `\(x)` lambda | 3.3 |

If you solved Sections 1 and 2 without peeking, you are comfortable with everyday purrr. If you solved Section 3 too, you are ready for list-columns, error-tolerant iteration, and real analytical pipelines.

## FAQ

**Q: When should I use `map()` versus a typed variant like `map_dbl()`?**
Use `map()` when each iteration returns something irregular (a model object, a multi-row table) that has to stay in a list. Use the typed variant whenever the per-element answer is a single value of a known type: `map_dbl()` for numbers, `map_chr()` for strings, `map_int()` for counts, `map_lgl()` for predicates. The typed variant is a contract, it fails loudly when the function misbehaves instead of handing you a broken list three pipes downstream.

**Q: How do I forward extra arguments to the mapped function?**
Put them after the function in the `map_*()` call. `map_dbl(airquality, mean, na.rm = TRUE)` forwards `na.rm = TRUE` to every `mean()` call. For anything more complex, wrap the call in a `\(x)` lambda.

**Q: What is the difference between `safely()`, `quietly()`, and `possibly()`?**
All three wrap a function to survive bad input. `safely()` traps errors and returns a `$result` / `$error` list. `quietly()` also captures warnings and printed output. `possibly()` just substitutes a default value when the call fails. Pick `safely()` for errors, `quietly()` for warnings, `possibly()` for a clean fallback.

**Q: What does the `\(x)` syntax mean?**
`\(x)` is the lambda shorthand added in R 4.1, equivalent to `function(x)`. It lets you write a one-off function inline, for example `map(xs, \(x) (x - mean(x)) / sd(x))`, without naming it. For functions you reuse, define them normally.

**Q: How is `map_dfr()` different from `do.call(rbind, lapply(...))`?**
Both produce one stacked data frame. `map_dfr()` reads more clearly and adds an optional `.id` column recording which iteration each row came from, which you would otherwise have to track by hand.

## References

1. Wickham, H. & Grolemund, G., *R for Data Science*, 2nd ed. Chapter 27: Iteration. [Link](https://r4ds.hadley.nz/iteration.html)
2. purrr package reference and articles. [Link](https://purrr.tidyverse.org/)
3. Wickham, H., *Advanced R*, 2nd ed. Chapter 9: Functionals. [Link](https://adv-r.hadley.nz/functionals.html)
4. tidyr `nest()` documentation. [Link](https://tidyr.tidyverse.org/reference/nest.html)
5. Tidyverse blog, purrr 1.0.0 release notes. [Link](https://www.tidyverse.org/blog/2022/12/purrr-1-0-0/)

## Continue Learning

- [Functional Programming in R](Functional-Programming-in-R.html), the parent tutorial covering why functional style works so well for data analysis.
- [purrr map() Variants](purrr-map-Variants.html), a function-by-function deep dive on every typed `map_*()` in the package.
- [Reduce, Filter, Map in Base R](Reduce-Filter-Map-in-R.html), the same ideas using only base R, useful when you cannot add tidyverse as a dependency.
