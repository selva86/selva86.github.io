---
title: "R apply Family Exercises: 12 apply(), lapply(), sapply() Practice Problems — Solved Step-by-Step"
slug: "R-Apply-Exercises"
description: "Practice R's apply family with 12 hands-on exercises covering apply(), lapply(), sapply(), vapply(), mapply(), and tapply(). Run solutions in your browser."
keywords: "R apply exercises, apply family practice, lapply exercises, sapply exercises, tapply exercises, vapply exercises, mapply exercises, R apply practice problems, R vectorized functions exercises"
mathjax: false
webr: true
date: "2026-04-12"
curriculum_id: "E1.9"
post_type: "EX"
auto_link_terms: "apply family exercises|apply() exercises|lapply() exercises|sapply() exercises|tapply() exercises|apply family practice problems"
auto_link_case_sensitive: false
sidebar_title: "R apply Family (12 problems)"
fr_parent: "R-Functions.html"
---

# R apply Family Exercises: 12 apply(), lapply(), sapply() Practice Problems — Solved Step-by-Step

<p class="lead">Practice R's apply family — <code>apply()</code>, <code>lapply()</code>, <code>sapply()</code>, <code>vapply()</code>, <code>mapply()</code>, and <code>tapply()</code> — with 12 progressively harder exercises you can run directly in your browser. Each problem targets a specific function, builds on real datasets, and includes a full worked solution with line-by-line explanation.</p>

The apply family replaces explicit `for` loops with a single function call. The tricky part is choosing the *right* function — each one takes a different input shape and returns a different output shape. These 12 exercises force you to make that choice deliberately. Work through them in order: early ones warm up matrix thinking, middle ones explore lists and type safety, and later ones combine several variants in one pipeline.

## Which apply Function Should You Use?

Before you start, here is the cheat sheet you will keep coming back to. Each function takes a different input shape, iterates in a different way, and returns a different output shape. Pick by matching your *input* to the first column and your *desired output* to the last column.

| Function   | Input               | Iterates over            | Returns                                   | When to use                    |
|------------|---------------------|--------------------------|-------------------------------------------|--------------------------------|
| `apply()`  | Matrix / data frame | Rows (1) or columns (2)  | Vector, matrix, or list                   | Row/column operations          |
| `lapply()` | List or vector      | Elements                 | List (always)                             | Safe iteration, predictable    |
| `sapply()` | List or vector      | Elements                 | Vector, matrix, or list (auto-simplified) | Quick interactive exploration  |
| `vapply()` | List or vector      | Elements                 | Vector / matrix of a declared type        | Production code, type safety   |
| `tapply()` | Vector + factor(s)  | Groups defined by factor | Array, one value per group                | Group statistics               |
| `mapply()` | Multiple vectors    | Parallel elements        | Vector, matrix, or list                   | Iterating over paired inputs   |

Let's make this concrete. Here is the same task — column means of `mtcars` — done three different ways so you can see how each function behaves.

```r
col_means_apply  <- apply(mtcars[, 1:3], 2, mean)
col_means_lapply <- lapply(mtcars[, 1:3], mean)
col_means_sapply <- sapply(mtcars[, 1:3], mean)

cat("apply() returns:\n")
print(col_means_apply)
#>       mpg       cyl      disp
#>  20.09062   6.18750 230.72188

cat("\nlapply() returns a list:\n")
str(col_means_lapply)
#> List of 3
#>  $ mpg : num 20.1
#>  $ cyl : num 6.19
#>  $ disp: num 231

cat("\nsapply() returns a named vector:\n")
print(col_means_sapply)
#>       mpg       cyl      disp
#>  20.09062   6.18750 230.72188
```

Notice the difference: `apply()` and `sapply()` both returned a named numeric vector, but `lapply()` returned a list. The computation is identical — the only difference is the *shape* of the result. That shape decision is the core skill these exercises build.

[KEY INSIGHT]
**Choose by output shape, not by habit.** Need a guaranteed list? Use `lapply()`. Need a vector and you're working interactively? Use `sapply()`. Need a vector in production code? Use `vapply()`. Need row/column operations on a matrix? Use `apply()`.

**Try it:** Use `sapply()` to get the class of every column in `iris`. Before running, predict: will the result be a list or a vector?

```r
# Try it: get the class of every iris column
ex_classes <- sapply(iris, class)
# What type is ex_classes?

#> Expected: a named character vector
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_classes <- sapply(iris, class)
print(ex_classes)
#> Sepal.Length  Sepal.Width Petal.Length  Petal.Width      Species
#>   "numeric"    "numeric"    "numeric"    "numeric"     "factor"

class(ex_classes)
#> [1] "character"
```

**Explanation:** Every column's `class()` returns a single string, so `sapply()` simplifies the result into a named character vector.

</details>

## How Does apply() Work on Matrices? (Exercises 1-2)

`apply()` is the only family member that takes a `MARGIN` argument. Set `MARGIN = 1` to iterate over rows, `MARGIN = 2` to iterate over columns. That one argument is the entire decision with `apply()` — everything else is just which function you feed in.

### Exercise 1: Row-wise and Column-wise Totals

You are given a 5x4 matrix of monthly test scores for five students across four subjects. Use `apply()` twice: once to get total scores per student (rows), and once to get total scores per subject (columns).

```r
# Exercise 1: row and column totals
set.seed(42)
mat <- matrix(sample(60:100, 20, replace = TRUE),
              nrow = 5,
              dimnames = list(c("Ava", "Ben", "Cid", "Dan", "Eva"),
                              c("Math", "Science", "English", "History")))
print(mat)

# 1a. Total score per student (row totals) — use MARGIN = 1
# 1b. Total score per subject (column totals) — use MARGIN = 2

```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(42)
mat <- matrix(sample(60:100, 20, replace = TRUE),
              nrow = 5,
              dimnames = list(c("Ava", "Ben", "Cid", "Dan", "Eva"),
                              c("Math", "Science", "English", "History")))

row_totals <- apply(mat, 1, sum)
print(row_totals)
#> Ava Ben Cid Dan Eva
#> 341 334 311 323 338

col_totals <- apply(mat, 2, sum)
print(col_totals)
#>    Math Science English History
#>     399     370     428     450
```

**Explanation:** `MARGIN = 1` feeds each *row* (one student, all four subjects) into `sum()`. `MARGIN = 2` feeds each *column* (one subject, all five students) into `sum()`. Built-in shortcuts `rowSums()` and `colSums()` exist, but `apply()` generalises to any function — not just `sum()`.

</details>

### Exercise 2: Column-wise Coefficient of Variation

Write a custom function that computes the coefficient of variation — `sd(x) / mean(x) * 100` — then use `apply()` to compute it for each of the first four columns of `mtcars`. This tells you which variable has the most relative spread.

```r
# Exercise 2: coefficient of variation per column
# Step 1: define cv_fn(x) that returns sd(x) / mean(x) * 100
# Step 2: apply it to mtcars[, 1:4] with MARGIN = 2

```

<details>
<summary>Click to reveal solution</summary>

```r
cv_fn <- function(x) sd(x) / mean(x) * 100

cv_results <- apply(mtcars[, 1:4], 2, cv_fn)
round(cv_results, 1)
#>  mpg  cyl disp   hp
#> 29.9 32.6 53.7 46.7
```

**Explanation:** `disp` has the highest CV at 53.7%, meaning displacement varies most relative to its mean. `mpg` varies least at 29.9%. The custom function receives one column at a time as a plain numeric vector — `apply()` handles the iteration and reassembly.

</details>

[TIP]
**Handle NAs inside your function, not outside.** If your data has missing values, pass `na.rm = TRUE` inside the applied function rather than dropping rows with `na.omit()` on the whole matrix. Dropping rows throws away good data from other columns.

**Try it:** Use `apply()` on columns 1-4 of `airquality` to find which column has the largest range (`max - min`). Remember: `airquality` has NAs, so pass `na.rm = TRUE` inside your function.

```r
# Try it: which airquality column has the widest range?
ex_ranges <- apply(airquality[, 1:4], 2, function(x) {
  # your code here
})

# Which column name has the largest value?
#> Expected: "Ozone" or "Solar.R" (check!)
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_ranges <- apply(airquality[, 1:4], 2, function(x) {
  max(x, na.rm = TRUE) - min(x, na.rm = TRUE)
})
print(ex_ranges)
#>   Ozone Solar.R    Wind    Temp
#>   167.0   333.0    16.6    41.0

names(which.max(ex_ranges))
#> [1] "Solar.R"
```

**Explanation:** `Solar.R` has the widest range (333) because solar radiation values span from 7 to 334. The anonymous function handles `NA`s internally with `na.rm = TRUE`.

</details>

## How Do lapply() and sapply() Differ? (Exercises 3-5)

Both functions iterate element-by-element over a list or vector. The computation is identical — the only difference is the return type. `lapply()` *always* returns a list. `sapply()` tries to simplify the result into a vector or matrix. That simplification is convenient in interactive work but dangerous in production code, because the output shape depends on the data.

### Exercise 3: String Manipulation with lapply()

You have a list where each element is a character vector of city names. Use `lapply()` to collapse each vector into a single comma-separated string.

```r
# Exercise 3: collapse city names per region
cities <- list(
  west  = c("Seattle", "Portland", "San Francisco"),
  east  = c("Boston", "New York"),
  south = c("Austin", "Miami", "Atlanta", "Nashville")
)

# Use lapply() with paste() and collapse = ", "

```

<details>
<summary>Click to reveal solution</summary>

```r
cities <- list(
  west  = c("Seattle", "Portland", "San Francisco"),
  east  = c("Boston", "New York"),
  south = c("Austin", "Miami", "Atlanta", "Nashville")
)

city_strings <- lapply(cities, function(x) paste(x, collapse = ", "))
print(city_strings)
#> $west
#> [1] "Seattle, Portland, San Francisco"
#>
#> $east
#> [1] "Boston, New York"
#>
#> $south
#> [1] "Austin, Miami, Atlanta, Nashville"
```

**Explanation:** Each element of `cities` is a character vector of different length. `paste()` with `collapse = ", "` squashes each vector into one string. `lapply()` preserves the list structure with the original names (`west`, `east`, `south`).

</details>

### Exercise 4: sapply() for Quick Column Summaries

Use `sapply()` on `mtcars` to count the number of unique values in each column. This is a quick way to spot which columns are categorical (few unique values) versus continuous (many unique values).

```r
# Exercise 4: count unique values per column
# Hint: function(x) length(unique(x))

```

<details>
<summary>Click to reveal solution</summary>

```r
unique_counts <- sapply(mtcars, function(x) length(unique(x)))
print(unique_counts)
#>  mpg  cyl disp   hp drat   wt qsec   vs   am gear carb
#>   25    3   27   22   22   29   30    2    2    3    6
```

**Explanation:** `vs` and `am` have only 2 unique values — they are binary flags. `cyl` and `gear` have 3 — they are categorical. Everything else has 22-30 unique values — continuous. This is a fast first-pass exploration trick. `sapply()` returns a clean named integer vector because every call returns a single number.

</details>

### Exercise 5: When sapply() Surprises You

Here is a list where each element has a *different* number of items. Apply `toupper()` to each element. Compare what `lapply()` and `sapply()` return. When would `sapply()` fail to simplify?

```r
# Exercise 5: ragged list — sapply vs lapply
mixed_list <- list(
  a = c("hello", "world"),
  b = c("foo"),
  c = c("one", "two", "three")
)

# Run both and compare:
# result_lapply <- lapply(mixed_list, toupper)
# result_sapply <- sapply(mixed_list, toupper)
# What class is each result?

```

<details>
<summary>Click to reveal solution</summary>

```r
mixed_list <- list(
  a = c("hello", "world"),
  b = c("foo"),
  c = c("one", "two", "three")
)

result_lapply <- lapply(mixed_list, toupper)
result_sapply <- sapply(mixed_list, toupper)

cat("lapply() class:", class(result_lapply), "\n")
#> lapply() class: list
str(result_lapply)
#> List of 3
#>  $ a: chr [1:2] "HELLO" "WORLD"
#>  $ b: chr "FOO"
#>  $ c: chr [1:3] "ONE" "TWO" "THREE"

cat("\nsapply() class:", class(result_sapply), "\n")
#> sapply() class: list
str(result_sapply)
#> List of 3
#>  $ a: chr [1:2] "HELLO" "WORLD"
#>  $ b: chr "FOO"
#>  $ c: chr [1:3] "ONE" "TWO" "THREE"
```

**Explanation:** Because the results have different lengths (2, 1, and 3), `sapply()` cannot simplify to a vector or matrix. It silently falls back to returning a plain list — identical to `lapply()`. This is exactly why `sapply()` is unpredictable: the same code returns a vector on one dataset and a list on another, depending on whether the results happen to be the same length.

</details>

[WARNING]
**sapply() output shape depends on your data, not your code.** If every result happens to be length 1, you get a vector. If they are the same length > 1, you get a matrix. If they differ, you get a list. This silent shape-shifting causes subtle bugs. Use `vapply()` when the return type matters.

**Try it:** Use `lapply()` to split the `iris` data frame by `Species`, then check the class and length of the result.

```r
# Try it: split + lapply
ex_split <- split(iris, iris$Species)

# What is the class of ex_split?
# How many elements does it have?
class(ex_split)
#> Expected: "list"
length(ex_split)
#> Expected: 3
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_split <- split(iris, iris$Species)
class(ex_split)
#> [1] "list"
length(ex_split)
#> [1] 3
names(ex_split)
#> [1] "setosa"     "versicolor" "virginica"
nrow(ex_split[["setosa"]])
#> [1] 50
```

**Explanation:** `split()` divides a data frame into a named list of sub-data-frames, one per factor level. Each element is a 50-row data frame (iris has 50 observations per species). This list is the perfect input for `lapply()` or `sapply()`.

</details>

## Why Should You Use vapply() Over sapply()? (Exercises 6-7)

`vapply()` is the type-safe version of `sapply()`. You specify the expected return type and length via the `FUN.VALUE` argument. If any call to your function returns something that doesn't match that template, R throws an error instead of silently returning the wrong shape. This makes `vapply()` the professional choice for scripts and packages where you need predictable output.

### Exercise 6: Type-Safe Column Summaries with vapply()

Redo Exercise 4 — count unique values per column of `mtcars` — but use `vapply()` instead of `sapply()`. You need to declare `FUN.VALUE = integer(1)` because each result is a single integer.

```r
# Exercise 6: vapply() version of unique counts
# Hint: vapply(X, FUN, FUN.VALUE)

```

<details>
<summary>Click to reveal solution</summary>

```r
unique_safe <- vapply(mtcars, function(x) length(unique(x)), FUN.VALUE = integer(1))
print(unique_safe)
#>  mpg  cyl disp   hp drat   wt qsec   vs   am gear carb
#>   25    3   27   22   22   29   30    2    2    3    6
```

**Explanation:** The output is identical to Exercise 4's `sapply()` result. The difference is the *contract*: `FUN.VALUE = integer(1)` tells R "I expect exactly one integer per element." If your function ever returned a character, a logical, or a length-2 vector, `vapply()` would immediately throw an error instead of silently changing the output shape.

</details>

### Exercise 7: Catching Type Mismatches

Write a `vapply()` call where the function sometimes returns a character and sometimes a numeric. Wrap it in `tryCatch()` to handle the error gracefully. This demonstrates why `vapply()` is safer than `sapply()` — it catches bugs at the source.

```r
# Exercise 7: deliberate type mismatch
mixed_fn <- function(x) {
  if (is.numeric(x)) return(mean(x))
  else return("not numeric")
}

test_data <- list(a = 1:5, b = c("hello"), c = 10:20)

# Use vapply() with FUN.VALUE = numeric(1) wrapped in tryCatch()
# What happens?

```

<details>
<summary>Click to reveal solution</summary>

```r
mixed_fn <- function(x) {
  if (is.numeric(x)) return(mean(x))
  else return("not numeric")
}

test_data <- list(a = 1:5, b = c("hello"), c = 10:20)

safe_result <- tryCatch(
  vapply(test_data, mixed_fn, FUN.VALUE = numeric(1)),
  error = function(e) {
    cat("vapply() caught a type mismatch:\n")
    cat(conditionMessage(e), "\n")
    return(NULL)
  }
)
#> vapply() caught a type mismatch:
#> values must be type 'double',
#>  but FUN(X[[2]]) result is type 'character'

print(safe_result)
#> NULL
```

**Explanation:** When `mixed_fn()` hits element `b` (a character vector), it returns `"not numeric"` — a character, not a numeric. `vapply()` immediately stops with a clear error message telling you *which* element and *which* type mismatch. Compare this to `sapply()`, which would silently coerce everything to character and return a character vector — hiding the bug.

</details>

[KEY INSIGHT]
**vapply() = sapply() + a contract on the output shape.** The `FUN.VALUE` argument is a template that says "every call must return an object that looks exactly like this." That contract catches bugs at the point of failure, not three function calls later when some downstream code breaks on an unexpected type.

**Try it:** Use `vapply()` to extract the class of every column in `mtcars`. What should `FUN.VALUE` be?

```r
# Try it: vapply() for column classes
ex_types <- vapply(mtcars, class, FUN.VALUE = character(1))
# Does this work? Why or why not?

#> Expected: a named character vector
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_types <- vapply(mtcars, class, FUN.VALUE = character(1))
print(ex_types)
#>       mpg       cyl      disp        hp      drat        wt      qsec
#> "numeric" "numeric" "numeric" "numeric" "numeric" "numeric" "numeric"
#>        vs        am      gear      carb
#> "numeric" "numeric" "numeric" "numeric"
```

**Explanation:** `FUN.VALUE = character(1)` works because every column in `mtcars` has a single-word class. Be careful with data frames that have columns with multi-class objects (like `POSIXct` which has class `c("POSIXct", "POSIXt")`) — `vapply()` would error because that returns length 2, not length 1.

</details>

## How Does tapply() Compute Group Statistics? (Exercises 8-9)

`tapply()` splits a vector by one or more factors and applies a function to each group. Think of it as the base R equivalent of `dplyr::group_by() |> summarise()` — but for a single column at a time. The syntax is `tapply(values, groups, FUN)`.

### Exercise 8: Group Means with tapply()

Compute the mean `Sepal.Length` for each `Species` in `iris`. This is exactly the kind of one-line group summary that `tapply()` was designed for.

```r
# Exercise 8: mean Sepal.Length by Species
# Hint: tapply(values_vector, grouping_factor, function)

```

<details>
<summary>Click to reveal solution</summary>

```r
species_means <- tapply(iris$Sepal.Length, iris$Species, mean)
print(species_means)
#>     setosa versicolor  virginica
#>      5.006      5.936      6.588
```

**Explanation:** `tapply()` takes three arguments: the numeric vector to summarise (`Sepal.Length`), the factor that defines groups (`Species`), and the function to apply within each group (`mean`). The result is a named numeric vector — one value per species, ordered by factor level.

</details>

### Exercise 9: Two-Way tapply() Table

Use `tapply()` with *two* grouping factors to compute mean `mpg` for each combination of `cyl` and `am` in `mtcars`. Pass the grouping factors as a list. The result will be a 2D array (a cross-tabulation table).

```r
# Exercise 9: two-way table of mean mpg
# Hint: tapply(values, list(factor1, factor2), FUN)

```

<details>
<summary>Click to reveal solution</summary>

```r
mpg_table <- tapply(mtcars$mpg, list(mtcars$cyl, mtcars$am), mean)
print(round(mpg_table, 1))
#>      0     1
#> 4 22.9  28.1
#> 6 19.1  20.6
#> 8 15.1  15.4
```

**Explanation:** Rows are `cyl` levels (4, 6, 8) and columns are `am` levels (0 = automatic, 1 = manual). The cell at row "4", column "1" is the mean mpg of 4-cylinder manual cars (28.1). This is a quick way to build contingency-style summary tables without loading any packages. For more complex multi-column summaries, switch to `dplyr::group_by() |> summarise()`.

</details>

[TIP]
**tapply() returns an array, not a data frame.** If you need a tidy data frame from a two-way tapply() result, wrap it: `as.data.frame.table(mpg_table)` gives you a long-format data frame with columns `Var1`, `Var2`, and `Freq`.

**Try it:** Use `tapply()` to find the maximum `hp` for each combination of `cyl` and `gear` in `mtcars`.

```r
# Try it: max hp by cyl x gear
ex_hp <- tapply(mtcars$hp, list(mtcars$cyl, mtcars$gear), max)

#> Expected: a matrix with NA where no cars exist for that combination
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_hp <- tapply(mtcars$hp, list(mtcars$cyl, mtcars$gear), max)
print(ex_hp)
#>      3   4   5
#> 4   97 109  91
#> 6  105 123 175
#> 8  245  NA 335
```

**Explanation:** There are no 8-cylinder cars with 4 gears in `mtcars`, so that cell is `NA`. This is useful information — it tells you which combinations don't exist in your data. The 8-cylinder, 5-gear cell (335 hp) is the Maserati Bora.

</details>

## How Does mapply() Handle Multiple Inputs? (Exercises 10-11)

`mapply()` is the multivariate sibling — it iterates over multiple arguments *in parallel*, like Python's `zip()`. While `lapply()` feeds one element at a time from one list, `mapply()` feeds one element at a time from *each* of several vectors simultaneously. Use it when you need to combine corresponding pairs (or triples) of values.

### Exercise 10: Pasting Parallel Vectors

Given separate vectors of first names and last names, use `mapply()` to create full names. `paste()` already vectorises, so this is a warm-up to understand the mechanics — the next exercise uses a function that doesn't vectorise.

```r
# Exercise 10: full names from parallel vectors
first_names <- c("Ada", "Grace", "Alan", "Linus")
last_names  <- c("Lovelace", "Hopper", "Turing", "Torvalds")

# Use mapply() to build "Ada Lovelace", "Grace Hopper", ...

```

<details>
<summary>Click to reveal solution</summary>

```r
first_names <- c("Ada", "Grace", "Alan", "Linus")
last_names  <- c("Lovelace", "Hopper", "Turing", "Torvalds")

full_names <- mapply(paste, first_names, last_names)
print(full_names)
#> [1] "Ada Lovelace"   "Grace Hopper"   "Alan Turing"    "Linus Torvalds"
```

**Explanation:** `mapply()` calls `paste("Ada", "Lovelace")`, then `paste("Grace", "Hopper")`, and so on — walking both vectors in lockstep. Yes, `paste(first_names, last_names)` works here because `paste()` is already vectorised. The real power of `mapply()` shows up with functions that are *not* vectorised — like Exercise 11.

</details>

### Exercise 11: Generating Custom Sequences

You have three vectors specifying the start, end, and step of several sequences. Use `mapply()` to generate each sequence with `seq()`. Since each sequence may have a different length, set `SIMPLIFY = FALSE` to get a list back.

```r
# Exercise 11: parallel seq() calls
starts <- c(1, 10, 100)
ends   <- c(5, 50, 105)
steps  <- c(1, 10, 1)

# Use mapply() with seq() and SIMPLIFY = FALSE

```

<details>
<summary>Click to reveal solution</summary>

```r
starts <- c(1, 10, 100)
ends   <- c(5, 50, 105)
steps  <- c(1, 10, 1)

sequences <- mapply(seq, from = starts, to = ends, by = steps, SIMPLIFY = FALSE)
print(sequences)
#> [[1]]
#> [1] 1 2 3 4 5
#>
#> [[2]]
#> [1] 10 20 30 40 50
#>
#> [[3]]
#> [1] 100 101 102 103 104 105
```

**Explanation:** Without `SIMPLIFY = FALSE`, `mapply()` would try to combine the results into a matrix — but these sequences have different lengths (5, 5, and 6), so it would fall back to a list anyway. Setting `SIMPLIFY = FALSE` explicitly makes the intent clear and avoids surprises. This is equivalent to `Map(seq, from = starts, to = ends, by = steps)` — `Map()` is just `mapply()` with `SIMPLIFY = FALSE` baked in.

</details>

[NOTE]
**Map() is mapply() with SIMPLIFY = FALSE.** If you always want a list back (the safe default), use `Map(f, ...)` instead of `mapply(f, ..., SIMPLIFY = FALSE)`. Shorter, clearer, and no risk of accidental simplification.

**Try it:** Use `mapply()` to compute the weighted mean of three pairs of (values, weights). Use `weighted.mean()` as the function.

```r
# Try it: parallel weighted means
ex_vals <- list(c(10, 20, 30), c(5, 15), c(100, 200, 300, 400))
ex_wts  <- list(c(1, 2, 3),   c(1, 1),  c(4, 3, 2, 1))

# your code here

#> Expected: a length-3 numeric vector
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_vals <- list(c(10, 20, 30), c(5, 15), c(100, 200, 300, 400))
ex_wts  <- list(c(1, 2, 3),   c(1, 1),  c(4, 3, 2, 1))

mapply(weighted.mean, ex_vals, ex_wts)
#> [1]  23.33333  10.00000 200.00000
```

**Explanation:** `mapply()` calls `weighted.mean(c(10, 20, 30), c(1, 2, 3))` for the first pair, and so on. Each call returns one number, so `mapply()` simplifies to a numeric vector.

</details>

## Practice Exercises

These capstone exercises combine multiple apply functions in a single problem. They are harder than the exercises above — you need to pick the right function *and* chain steps together.

### Exercise 12: Full Pipeline — Clean, Split, Apply, Combine

Start with the `airquality` dataset. Your task: for each `Month`, fit a linear model predicting `Ozone` from `Solar.R`, then extract the R-squared value. Return a named numeric vector of R-squared values, one per month.

Steps: (1) remove rows with `NA` in `Ozone` or `Solar.R`, (2) `split()` by `Month`, (3) `lapply()` to fit `lm(Ozone ~ Solar.R)` per month, (4) `sapply()` to extract R-squared from each model's `summary()`.

```r
# Exercise 12: per-month R-squared for Ozone ~ Solar.R
# Hint: summary(model)$r.squared extracts R-squared from an lm object

```

<details>
<summary>Click to reveal solution</summary>

```r
aq_clean <- airquality[complete.cases(airquality[, c("Ozone", "Solar.R")]), ]

aq_split <- split(aq_clean, aq_clean$Month)

models <- lapply(aq_split, function(df) lm(Ozone ~ Solar.R, data = df))

r_squared <- sapply(models, function(m) summary(m)$r.squared)
round(r_squared, 3)
#>     5     6     7     8     9
#> 0.120 0.175 0.437 0.178 0.305
```

**Explanation:** This pipeline uses three apply-family functions in sequence. `split()` creates a list of data frames keyed by month. `lapply()` fits one model per month — using `lapply()` here is the right choice because `lm()` objects are complex and cannot be simplified. `sapply()` then extracts one number (R-squared) per model, so it simplifies to a named numeric vector. July (month 7) has the strongest relationship at R-squared = 0.437 — solar radiation explains about 44% of ozone variation that month.

</details>

## Putting It All Together

Here is one complete analysis using all five main apply functions on `mtcars`. Each step builds on the previous one, showing how the functions work together in a real workflow.

```r
# Step 1: apply() — normalise columns to 0-1 range
normalise <- function(x) (x - min(x)) / (max(x) - min(x))
mtcars_norm <- apply(mtcars[, c("mpg", "hp", "wt")], 2, normalise)
head(round(mtcars_norm, 2), 4)
#>                   mpg   hp   wt
#> Mazda RX4        0.45 0.20 0.28
#> Mazda RX4 Wag    0.45 0.20 0.35
#> Datsun 710       0.53 0.07 0.21
#> Hornet 4 Drive   0.47 0.20 0.44

# Step 2: lapply() — split by cyl and get nrow per group
cyl_groups <- split(mtcars, mtcars$cyl)
group_sizes <- lapply(cyl_groups, nrow)
print(group_sizes)
#> $`4`
#> [1] 11
#>
#> $`6`
#> [1] 7
#>
#> $`8`
#> [1] 14

# Step 3: vapply() — type-safe extraction of mean mpg per group
cyl_mpg <- vapply(cyl_groups, function(df) mean(df$mpg), FUN.VALUE = numeric(1))
print(round(cyl_mpg, 1))
#>    4    6    8
#> 26.7 19.7 15.1

# Step 4: tapply() — two-way table of mean mpg by cyl x am
cyl_mpg_am <- tapply(mtcars$mpg, list(cyl = mtcars$cyl, am = mtcars$am), mean)
print(round(cyl_mpg_am, 1))
#>    0     1
#> 4 22.9  28.1
#> 6 19.1  20.6
#> 8 15.1  15.4

# Step 5: mapply() — build descriptive labels
cyl_labels <- c("4-cylinder", "6-cylinder", "8-cylinder")
mpg_labels <- round(cyl_mpg, 1)
labels <- mapply(function(c, m) paste0(c, ": ", m, " mpg avg"), cyl_labels, mpg_labels)
print(labels)
#> [1] "4-cylinder: 26.7 mpg avg" "6-cylinder: 19.7 mpg avg" "8-cylinder: 15.1 mpg avg"
```

This pipeline shows the natural division of labour. `apply()` handles the column-wise normalisation (a matrix operation). `lapply()` splits data and keeps results as a safe list. `vapply()` extracts exactly one number per group with a type guarantee. `tapply()` builds a quick cross-tabulation. `mapply()` combines parallel vectors into formatted output. Each function earns its place by matching the shape of the problem.

## Summary

Here are the one-line rules to keep next to your screen.

| Function   | One-line rule                                                                  |
|------------|--------------------------------------------------------------------------------|
| `apply()`  | `MARGIN = 1` for rows, `MARGIN = 2` for columns. Only for matrices/data frames. |
| `lapply()` | Always returns a list. Your safe default for any iteration.                    |
| `sapply()` | Same as `lapply()` but auto-simplifies. Fine for interactive use, risky in scripts. |
| `vapply()` | Same as `sapply()` but with a type contract. Use in production code.           |
| `tapply()` | One value per group, driven by a factor. Base R's group_by + summarise.       |
| `mapply()` | Parallel iteration over multiple vectors. Use `Map()` when you want a list back. |

Key takeaways:

- Use `lapply()` as your default — lists are predictable and never surprise you
- Use `vapply()` in scripts and packages — the type contract catches bugs early
- Use `apply()` only on matrices or data frames, always with a MARGIN argument
- Use `tapply()` for quick group statistics; switch to `dplyr` for complex grouped pipelines
- Use `mapply()` or `Map()` when iterating over two or more vectors in lockstep
- `sapply()` is convenient but dangerous — it changes output type based on data, not code

## References

1. R Core Team — `?apply` help page. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/apply.html)
2. R Core Team — `?lapply` help page (covers lapply, sapply, vapply). [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/lapply.html)
3. R Core Team — `?tapply` help page. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/tapply.html)
4. R Core Team — `?mapply` help page. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/mapply.html)
5. Wickham, H. — *Advanced R*, 2nd Edition. Chapter 9: Functionals. [Link](https://adv-r.hadley.nz/functionals.html)
6. Wickham, H. & Grolemund, G. — *R for Data Science*, 2nd Edition. Chapter 26: Iteration. [Link](https://r4ds.hadley.nz/iteration)
7. Dataquest — Apply Functions in R with Examples. [Link](https://www.dataquest.io/blog/apply-functions-in-r-sapply-lapply-tapply/)

## Continue Learning

- [Writing R Functions](R-Functions.html) — Master function arguments, defaults, scope, and return values — the prerequisite for every apply exercise
- [Functional Programming in R](Functional-Programming-in-R.html) — Go deeper with purrr::map(), closures, and function factories
- [R Functional Programming Exercises](R-Functional-Programming-Exercises.html) — More practice with higher-order functions and purrr
