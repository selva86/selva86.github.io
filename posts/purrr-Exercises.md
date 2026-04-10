---
title: "purrr Exercises: 10 Functional Programming Practice Problems — Solved Step-by-Step"
slug: "purrr-Exercises"
description: "Practise purrr with 10 functional programming problems and worked solutions. Build real R skills through hands-on exercises, beginner to advanced."
keywords: "purrr exercises, purrr map exercises, functional programming R exercises, purrr practice problems, map2 pmap exercises, tidyverse iteration practice, R functional programming practice, purrr tutorial problems"
mathjax: false
webr: true
date: "2026-04-06"
curriculum_id: "E2.8"
post_type: "EX"
sidebar_title: "purrr (10 problems)"
auto_link_terms: "purrr exercises|purrr practice problems|purrr map exercises|functional programming exercises R|map2 practice|pmap practice|map_dfr exercises"
auto_link_case_sensitive: false
fr_parent: "Functional-Programming-in-R.html"
---


# purrr Exercises: 10 Functional Programming Practice Problems

<p class="lead">Ten runnable exercises to practise <code>purrr::map()</code>, <code>map2()</code>, <code>pmap()</code>, typed variants, row-wise operations, and safe iteration — each with a worked solution and explanation you can run in your browser.</p>

## Introduction

Reading about `map()` is quick. Writing `map_dfr()` fluently — remembering which typed variant to reach for, when to use `map2()` versus `pmap()`, and how to handle errors mid-iteration — takes practice. These ten exercises give you that practice.

The problems grow from simple to genuine. The first three ask you to compute column summaries with `map_dbl()`, `map_chr()`, and `map_int()`. The middle four bring in `map_lgl()`, `map_dfr()`, `map2()`, and `pmap()`. The last three mix purrr with `nest()` for split-apply-combine, `safely()` for error-tolerant pipelines, and the `\(x)` lambda shortcut for compact code.

Try writing your own answer first. Run it. Compare with the solution. Read the short explanation under the solution to check your reasoning. If you are new to functional programming in R, skim the parent tutorial on [Functional Programming in R](Functional-Programming-in-R.html) before starting.

All code on this page runs in one shared R session, so variables you create in one block are available in the next. Use distinct names like `my_result` in your exercise code so you do not overwrite tutorial variables from earlier blocks.

## Quick Reference

Skim this cheat sheet before you start. It lists the functions you will use in the ten exercises.

| Task | Function | Example |
|---|---|---|
| Apply a function, return list | `map()` | `map(mtcars, mean)` |
| Return numeric vector | `map_dbl()` | `map_dbl(mtcars, mean)` |
| Return character vector | `map_chr()` | `map_chr(iris, class)` |
| Return integer vector | `map_int()` | `map_int(iris, n_distinct)` |
| Return logical vector | `map_lgl()` | `map_lgl(mtcars, is.numeric)` |
| Iterate and row-bind tibbles | `map_dfr()` | `map_dfr(list_of_dfs, identity)` |
| Walk two inputs in parallel | `map2()` | `map2(x, y, \(a, b) a * b)` |
| Walk many inputs in parallel | `pmap()` | `pmap(list(x, y, z), fn)` |
| Error-tolerant wrapper | `safely()` | `safely(log)(x)` |
| Anonymous function (R 4.1+) | `\(x)` | `map_dbl(x, \(v) v^2)` |

[TIP]
**Load purrr once. Every later block reuses it.** The first code block loads `purrr` and `dplyr` and previews the datasets. Because all blocks share a single R session, later exercises can call `map()` and friends without reloading.

```r
# Load libraries and preview the datasets we will use
library(purrr)
library(dplyr)

# mtcars: 32 rows, 11 numeric columns
head(mtcars, 3)
#>                mpg cyl disp  hp drat    wt  qsec vs am gear carb
#> Mazda RX4     21.0   6  160 110 3.90 2.620 16.46  0  1    4    4
#> Mazda RX4 Wag 21.0   6  160 110 3.90 2.875 17.02  0  1    4    4
#> Datsun 710    22.8   4  108  93 3.85 2.320 18.61  1  1    4    1

# iris: 150 rows, 4 numeric + 1 factor column
head(iris, 3)
#>   Sepal.Length Sepal.Width Petal.Length Petal.Width Species
#> 1          5.1         3.5          1.4         0.2  setosa
#> 2          4.9         3.0          1.4         0.2  setosa
#> 3          4.7         3.2          1.3         0.2  setosa
```

Both datasets are ready. `mtcars` gives clean numeric columns for simple `map_dbl()` reductions. `iris` mixes numeric and factor columns, which is perfect for `map_chr()` and `map_lgl()` practice.

## Easy (1-3): Column Summaries with Typed map() Variants

Start here if you have barely used purrr before. Each exercise applies one function to each column of a data frame — the bread-and-butter purrr pattern.

### Exercise 1: Column means with map_dbl()

Compute the mean of every column in `mtcars`. Save the result to `my_means`. The output should be a named numeric vector of length 11, not a list.

```r
# Exercise 1: mean of each column
# Hint: map_dbl(mtcars, mean) — the _dbl returns a numeric vector

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_means <- map_dbl(mtcars, mean)

print(round(my_means, 2))
#>    mpg    cyl   disp     hp   drat     wt   qsec     vs     am   gear   carb
#>  20.09   6.19 230.72 146.69   3.60   3.22  17.85   0.44   0.41   3.69   2.81
```

**Explanation:** `map_dbl()` applies `mean()` to each column of `mtcars` and collects the results in a numeric vector. A data frame is a list of columns under the hood, so purrr iterates column-by-column. The output keeps column names as vector names. If you had used plain `map(mtcars, mean)` you would get a list of eleven single-element numeric vectors instead.

</details>

### Exercise 2: Column classes with map_chr()

Get the class of each column in `iris`. Save to `my_classes`. The output should be a named character vector.

```r
# Exercise 2: class of each column
# Hint: map_chr(iris, class) — _chr returns character vector

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_classes <- map_chr(iris, class)

print(my_classes)
#> Sepal.Length  Sepal.Width Petal.Length  Petal.Width      Species
#>    "numeric"    "numeric"    "numeric"    "numeric"     "factor"
```

**Explanation:** `map_chr()` expects each function call to return a length-1 character value. `class()` on a simple column does exactly that. The four measurement columns are numeric; `Species` is a factor. If any column had multiple classes (like a tibble column tagged `c("ordered", "factor")`), `map_chr()` would error — it is strict about the length-1 rule, which catches surprises early.

</details>

### Exercise 3: Unique values per column with map_int()

Count distinct values in each `iris` column. Save to `my_uniques`. Use `dplyr::n_distinct()`.

```r
# Exercise 3: count distinct values per column
# Hint: map_int(iris, n_distinct)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_uniques <- map_int(iris, n_distinct)

print(my_uniques)
#> Sepal.Length  Sepal.Width Petal.Length  Petal.Width      Species
#>           35           23           43           22            3
```

**Explanation:** `map_int()` requires each call to return a length-1 integer. `n_distinct()` returns an integer count, so the pair is a perfect match. `Species` has three distinct levels, which matches the three iris species. `Petal.Length` varies most (43 unique values out of 150 rows), a hint that it discriminates species well.

[TIP]
**Pick the typed variant that matches your return type.** Use `map_dbl()` for doubles, `map_int()` for integers, `map_chr()` for strings, `map_lgl()` for logicals. You get a simple vector back instead of a list, and purrr errors loudly if any iteration returns the wrong type — which catches bugs that `sapply()` hides.

</details>

## Medium (4-7): Logical Predicates, Row-Binding, and Parallel Iteration

These four exercises mix two ideas at once. Take them slowly.

### Exercise 4: Find columns with all positive values

For each column in `mtcars`, check whether every value is strictly greater than zero. Save the named logical vector to `my_positive`.

```r
# Exercise 4: which columns are all positive?
# Hint: map_lgl(mtcars, \(col) all(col > 0))

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_positive <- map_lgl(mtcars, \(col) all(col > 0))

print(my_positive)
#>   mpg   cyl  disp    hp  drat    wt  qsec    vs    am  gear  carb
#>  TRUE  TRUE  TRUE  TRUE  TRUE  TRUE  TRUE FALSE FALSE  TRUE  TRUE
```

**Explanation:** `map_lgl()` returns a logical vector by calling your function once per column. The anonymous function `\(col) all(col > 0)` is R 4.1+ shorthand for `function(col) all(col > 0)`. `vs` and `am` contain zeros (they are 0/1 dummy variables), so `all(col > 0)` returns `FALSE` for those. This pattern is the purrr way to build column-level predicates for filtering.

</details>

### Exercise 5: Per-group linear models with map_dfr()

Split `mtcars` by `cyl`, fit `mpg ~ wt` inside each group, and return a tibble where each row has the group's `cyl`, intercept, and slope. Save to `my_models`.

```r
# Exercise 5: lm per cyl group, return tibble
# Hint: split(mtcars, mtcars$cyl) gives a list; map_dfr returns a tibble

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_models <- split(mtcars, mtcars$cyl) |>
  map_dfr(\(df) tibble(
    cyl       = df$cyl[1],
    intercept = coef(lm(mpg ~ wt, data = df))[1],
    slope     = coef(lm(mpg ~ wt, data = df))[2]
  ))

print(my_models)
#> # A tibble: 3 × 3
#>     cyl intercept  slope
#>   <dbl>     <dbl>  <dbl>
#> 1     4      39.6  -5.65
#> 2     6      28.4  -2.78
#> 3     8      23.9  -2.19
```

**Explanation:** `split()` turns `mtcars` into a list of three data frames, one per `cyl` value. `map_dfr()` iterates over the list, runs the anonymous function on each piece, and row-binds the returned tibbles into one. Each row captures one group's regression: four-cylinder cars lose 5.65 mpg per 1,000-lb weight increase, while eight-cylinder cars lose only 2.19.

[KEY INSIGHT]
**map_dfr() = iterate plus row-bind.** Whenever you have a list of items and want to produce one tibble with one row (or block of rows) per item, `map_dfr()` is the tool. It replaces the common `do.call(rbind, lapply(x, fn))` pattern with a single, clearer call.

</details>

### Exercise 6: Parallel iteration with map2()

You have two vectors of equal length: `values <- c(10, 20, 30, 40)` and `weights <- c(0.1, 0.2, 0.3, 0.4)`. Compute the weighted value (value * weight) for each pair. Save the numeric vector to `my_wtd`.

```r
# Exercise 6: pairwise weighted values
# Hint: map2_dbl(values, weights, \(v, w) v * w)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
values  <- c(10, 20, 30, 40)
weights <- c(0.1, 0.2, 0.3, 0.4)

my_wtd <- map2_dbl(values, weights, \(v, w) v * w)

print(my_wtd)
#> [1]  1  4  9 16
```

**Explanation:** `map2_dbl()` walks two input vectors in parallel, passing the i-th element of each into the function. The function returns one double per pair, so you get a length-4 numeric vector. This is the clean replacement for a for-loop that zips two inputs. In plain R you would write `values * weights` here — `map2()` shows its real value when the function is more complex than arithmetic.

[WARNING]
**map2() requires equal-length inputs.** If `values` has 4 elements and `weights` has 3, `map2()` errors immediately. It does not recycle silently the way `values * weights` does. That strictness is a feature: it forces you to notice the mismatch.

</details>

### Exercise 7: Three-argument iteration with pmap()

You have three vectors: `names <- c("Alice", "Bob", "Carol")`, `scores <- c(92, 78, 85)`, `grades <- c("A", "C", "B")`. Build a character vector where each element reads like `"Alice scored 92 (grade A)"`. Save to `my_labels`.

```r
# Exercise 7: format three aligned vectors
# Hint: pmap_chr(list(names, scores, grades), \(n, s, g) sprintf("%s scored %d (grade %s)", n, s, g))

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
names  <- c("Alice", "Bob", "Carol")
scores <- c(92, 78, 85)
grades <- c("A", "C", "B")

my_labels <- pmap_chr(
  list(names, scores, grades),
  \(n, s, g) sprintf("%s scored %d (grade %s)", n, s, g)
)

print(my_labels)
#> [1] "Alice scored 92 (grade A)" "Bob scored 78 (grade C)"
#> [3] "Carol scored 85 (grade B)"
```

**Explanation:** `pmap()` is `map2()` generalised to any number of inputs. You pass a list of vectors; purrr walks them row-wise, calling your function once per aligned tuple. The function takes as many arguments as there are list elements. `pmap_chr()` forces each call to return a length-1 string, giving you a character vector at the end. This is the tidy replacement for `mapply()` when you need more than two inputs.

</details>

## Challenging (8-10): List-Columns, Error Handling, and Lambdas

These last three combine purrr with other tidyverse tools and defensive coding. They are what separate purrr users from purrr fluency.

### Exercise 8: Per-group correlations with nest() + map()

For each `cyl` group in `mtcars`, compute the Pearson correlation between `mpg` and `wt`. Return a tibble with columns `cyl` and `cor_mpg_wt`. Save to `my_cors`.

```r
# Exercise 8: correlation per group using nest + map
# Hint: mtcars |> group_by(cyl) |> tidyr::nest() then mutate(cor = map_dbl(data, \(d) cor(d$mpg, d$wt)))

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
library(tidyr)

my_cors <- mtcars |>
  group_by(cyl) |>
  nest() |>
  mutate(cor_mpg_wt = map_dbl(data, \(d) cor(d$mpg, d$wt))) |>
  select(cyl, cor_mpg_wt) |>
  arrange(cyl)

print(my_cors)
#> # A tibble: 3 × 2
#> # Groups:   cyl [3]
#>     cyl cor_mpg_wt
#>   <dbl>      <dbl>
#> 1     4     -0.713
#> 2     6     -0.682
#> 3     8     -0.650
```

**Explanation:** `nest()` turns each group into a single row with a `data` list-column holding the group's sub-tibble. `map_dbl(data, ...)` then walks that list-column, computing one correlation per group. All three groups show a strong negative correlation between mpg and wt — heavier cars use more fuel, across every cylinder count.

[TIP]
**nest() + map() is the tidyverse split-apply-combine pattern.** It keeps everything in one tibble (no list-of-data-frames bookkeeping), composes cleanly with `mutate()`, and lets you attach fitted models, plots, or summaries as new list-columns.

</details>

### Exercise 9: Error-tolerant logging with safely()

You have a vector `inputs <- c(100, 10, -1, 1, -5)`. Applying `log()` to negatives returns `NaN` with a warning. Use `safely()` to wrap `log()` so each call returns a list with `result` and `error`. Save the full list of results to `my_safe`. Then extract just the numeric results (with NULL for errors) using `map()`.

```r
# Exercise 9: safely wrap log()
# Hint: safe_log <- safely(log); my_safe <- map(inputs, safe_log)
# safely() never throws — but log(negative) gives NaN, not an error.
# Wrap in a stricter function: \(x) if (x <= 0) stop("non-positive") else log(x)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
inputs <- c(100, 10, -1, 1, -5)

strict_log <- function(x) {
  if (x <= 0) stop("non-positive input")
  log(x)
}
safe_log <- safely(strict_log)

my_safe <- map(inputs, safe_log)

# Extract the result field only (NULL where there was an error)
results <- map(my_safe, "result")
print(results)
#> [[1]]
#> [1] 4.605
#>
#> [[2]]
#> [1] 2.303
#>
#> [[3]]
#> NULL
#>
#> [[4]]
#> [1] 0
#>
#> [[5]]
#> NULL

# Extract error messages
errors <- map(my_safe, "error") |> compact()
print(errors[[1]]$message)
#> [1] "non-positive input"
```

**Explanation:** `safely()` returns a new function that never throws. Instead, it returns a list with two slots: `result` (the value, or `NULL` on error) and `error` (the condition, or `NULL` on success). This lets you run iterations that would otherwise halt at the first failure, then inspect what went wrong afterwards. `map(my_safe, "result")` uses purrr's shortcut for extracting a named element from each list. It is the purrr idiom for "get the third field of every element".

</details>

### Exercise 10: Lambda shortcut for column scaling

Scale every numeric column of `iris` to have mean 0 and standard deviation 1. Use the `\(x)` anonymous-function shortcut. Return a data frame with the scaled numeric columns plus the original `Species` column. Save to `my_scaled`.

```r
# Exercise 10: z-score every numeric column
# Hint: use map() with \(col) (col - mean(col)) / sd(col), then cbind Species

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
numeric_cols <- iris |> select(where(is.numeric))

scaled_list <- map(numeric_cols, \(col) (col - mean(col)) / sd(col))

my_scaled <- as.data.frame(scaled_list)
my_scaled$Species <- iris$Species

head(my_scaled, 3)
#>   Sepal.Length Sepal.Width Petal.Length Petal.Width Species
#> 1   -0.8976739  1.01560199    -1.335752   -1.311052  setosa
#> 2   -1.1392005 -0.13153881    -1.335752   -1.311052  setosa
#> 3   -1.3807271  0.32731751    -1.392399   -1.311052  setosa

# Verify: every numeric column now has mean ~0, sd 1
round(map_dbl(my_scaled[, 1:4], mean), 10)
#> Sepal.Length  Sepal.Width Petal.Length  Petal.Width
#>            0            0            0            0
round(map_dbl(my_scaled[, 1:4], sd), 2)
#> Sepal.Length  Sepal.Width Petal.Length  Petal.Width
#>            1            1            1            1
```

**Explanation:** `select(where(is.numeric))` picks the four measurement columns. `map()` then applies the z-score formula to each column. Because `map()` returns a list, `as.data.frame()` reshapes it back to a data frame. The verification step reuses `map_dbl()` to confirm each scaled column has mean zero and standard deviation one.

[KEY INSIGHT]
**The `\(x)` lambda keeps functional code compact.** Before R 4.1 you wrote `function(x) x^2`. Now you write `\(x) x^2`. Combined with typed map variants, you get one-line transformations that read left-to-right: "for each column, compute the z-score". No loop counter, no intermediate accumulator.

</details>

## Summary

Ten exercises, ten purrr patterns. You practised:

| Pattern | When to use |
|---|---|
| `map_dbl()`, `map_chr()`, `map_int()`, `map_lgl()` | Apply a function to each element, return a typed vector |
| `map_dfr()` | Apply a function that returns a tibble, row-bind results |
| `map2()` / `map2_dbl()` | Walk two equal-length inputs in parallel |
| `pmap()` / `pmap_chr()` | Walk three or more inputs in parallel |
| `nest() + map()` | Split-apply-combine with list-columns |
| `safely()` | Wrap a function so it never throws |
| `\(x)` lambda | Compact anonymous functions in one-liners |

The underlying skill is picking the right variant for the return type you want. Once you internalise "list out? use `map()`. Named numeric? use `map_dbl()`. Row-bind tibbles? `map_dfr()`", most iteration problems become one line of code.

## FAQ

**Q: When should I use purrr instead of base R `sapply()` or `lapply()`?**
Use purrr when you want type safety. `sapply()` will silently return a list if one iteration returns a different length — purrr's `map_dbl()` errors instead. Use `lapply()` when you are writing a package and want zero dependencies.

**Q: What is the difference between `\(x)` and `~ .x`?**
Both define anonymous functions inside purrr calls. `\(x) x^2` is base R 4.1+ syntax and works anywhere. `~ .x^2` is purrr's older twiddle syntax. Prefer `\(x)` today — it is standard R and reads the same everywhere.

**Q: What replaces `do.call(rbind, lapply(x, fn))`?**
`map_dfr(x, fn)`. It iterates and row-binds in one step, and it keeps a `.id` column if you pass `.id = "source"`, labelling each row with its list-name.

**Q: Do I need to unlist the result of `map_dbl()`?**
No. `map_dbl()` already returns a plain numeric vector. You only need `unlist()` on `map()` output — and even then, prefer switching to a typed variant (`map_dbl()`, `map_int()`, etc.) which returns the right type directly.

## References

1. Wickham, H. — *Advanced R*, 2nd Edition. CRC Press (2019). Chapter 9: Functionals. [Link](https://adv-r.hadley.nz/functionals.html)
2. Wickham, H., Çetinkaya-Rundel, M., & Grolemund, G. — *R for Data Science*, 2nd Edition. Chapter 27: Iteration. [Link](https://r4ds.hadley.nz/iteration.html)
3. purrr package documentation — official function reference. [Link](https://purrr.tidyverse.org/reference/index.html)
4. purrr 1.0.0 release notes — modern map semantics and lambda syntax. [Link](https://www.tidyverse.org/blog/2022/12/purrr-1-0-0/)
5. tidyr nest documentation — list-columns and `nest()`. [Link](https://tidyr.tidyverse.org/reference/nest.html)
6. R Core Team — *An Introduction to R*: functionals and apply-family. [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html)

## Continue Learning

- [Functional Programming in R](Functional-Programming-in-R.html) — the mindset behind map, reduce, and filter.
- [purrr map() Variants](purrr-map-Variants.html) — deep dive on every map variant with the mental model.
- [R Functional Programming Exercises](R-Functional-Programming-Exercises.html) — base R versions (Map, Reduce, Filter) for comparison.
