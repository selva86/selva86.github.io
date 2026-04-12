---
title: "R apply Family Exercises: 12 apply(), lapply(), sapply() Practice Problems — Solved Step-by-Step)"
slug: "R-Apply-Exercises"
description: "Practice the R apply family with 12 exercises covering apply(), lapply(), sapply(), vapply(), tapply(), and mapply(). Starter code and solutions included."
keywords: "R apply exercises, lapply exercises, sapply exercises, R apply family practice problems, tapply exercises, vapply exercises, mapply exercises, R apply practice, apply function R exercises"
mathjax: false
webr: true
date: "2026-04-12"
curriculum_id: "E1.9"
post_type: "EX"
auto_link_terms: "R apply exercises|apply family exercises|lapply exercises|sapply exercises|tapply exercises|apply() practice|lapply() practice|sapply() practice"
auto_link_case_sensitive: false
sidebar_title: "R apply Family (12 problems)"
fr_parent: "R-Functions.html"
---

# R apply Family Exercises: 12 apply(), lapply(), sapply() Practice Problems — Solved Step-by-Step)

<p class="lead">The R apply family — <code>apply()</code>, <code>lapply()</code>, <code>sapply()</code>, <code>vapply()</code>, <code>tapply()</code>, and <code>mapply()</code> — lets you run a function across rows, columns, lists, or groups without writing a single loop. These 12 exercises take you from basic row/column operations to multi-input parallel mapping, each with starter code you can run and a full worked solution.</p>

## Which apply Function Should You Use?

The apply family replaces explicit for-loops with a single function call. The tricky part is choosing the right one — each takes a different input shape and returns a different output shape. Here's the cheat sheet you'll need for the exercises below.

| Function | Input | Iterates Over | Returns | Use When |
|----------|-------|--------------|---------|----------|
| `apply()` | matrix / data frame | rows or columns | vector / matrix | You need row-wise or column-wise operations |
| `lapply()` | list / vector | each element | always a list | You want predictable list output |
| `sapply()` | list / vector | each element | vector / matrix (tries to simplify) | Quick interactive exploration |
| `vapply()` | list / vector | each element | vector / matrix (type-checked) | Production code — type safety |
| `tapply()` | vector + factor | groups | array | Summarizing data by category |
| `mapply()` | multiple vectors/lists | elements in parallel | vector / matrix / list | Multiple corresponding inputs |

Let's see how three of these handle the same task — computing column means of `mtcars` — so you can spot the output differences immediately.

```r
# apply(): returns a named numeric vector
col_means_apply <- apply(mtcars, 2, mean)
col_means_apply[1:4]
#>        mpg        cyl       disp         hp
#>  20.090625   6.187500 230.721875 146.687500

# lapply(): returns a list (one element per column)
col_means_lapply <- lapply(mtcars, mean)
col_means_lapply[1:3]
#> $mpg
#> [1] 20.09062
#>
#> $cyl
#> [1] 6.1875
#>
#> $disp
#> [1] 230.7219

# sapply(): simplifies the list into a named vector
col_means_sapply <- sapply(mtcars, mean)
col_means_sapply[1:4]
#>        mpg        cyl       disp         hp
#>  20.090625   6.187500 230.721875 146.687500
```

Notice `apply()` and `sapply()` both returned named numeric vectors, while `lapply()` returned a list. That list output from `lapply()` is actually the safest — it never surprises you by changing shape.

[KEY INSIGHT]
**Choose by output shape, not input shape.** If you need a list, use lapply(). If you need a vector with type guarantees, use vapply(). If you're exploring interactively and want quick results, use sapply(). Save apply() for matrices where row/column operations make sense.

**Try it:** Use `sapply()` to get the class of every column in `iris`. Before you run it, predict: will the result be a vector or a list?

```r
# Try it: get column classes from iris
ex_classes <- sapply(iris, function(col) {
  # your code here
})
ex_classes
#> Expected: a named character vector with 5 elements
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_classes <- sapply(iris, class)
ex_classes
#> Sepal.Length  Sepal.Width Petal.Length  Petal.Width      Species
#>    "numeric"    "numeric"    "numeric"    "numeric"     "factor"
```

**Explanation:** Each column's `class()` returns a single string, so `sapply()` simplifies the list into a character vector. Since every result is length 1, you get a clean named vector.

</details>

## How Does apply() Work on Matrices? (Exercises 1–2)

`apply()` is the only member of the family that takes a `MARGIN` argument — set it to 1 for rows and 2 for columns. It works best on numeric matrices or data frames where every column is the same type.

### Exercise 1: Row-Wise Statistics on a Matrix

Create a 5×4 numeric matrix with `matrix(1:20, nrow = 5)`. Use `apply()` twice: once to compute the **mean** of each row, and once to compute the **range** (max − min) of each row.

```r
# Exercise 1: Row-wise mean and range
mat <- matrix(1:20, nrow = 5)
mat
#> Check: 5 rows, 4 columns

# Compute row means using apply()
# your code here

# Compute row ranges (max - min) using apply()
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
mat <- matrix(1:20, nrow = 5)
mat
#>      [,1] [,2] [,3] [,4]
#> [1,]    1    6   11   16
#> [2,]    2    7   12   17
#> [3,]    3    8   13   18
#> [4,]    4    9   14   19
#> [5,]    5   10   15   20

# Row means (MARGIN = 1 means "iterate over rows")
row_means <- apply(mat, 1, mean)
row_means
#> [1]  8.5  9.5 10.5 11.5 12.5

# Row ranges using an anonymous function
row_ranges <- apply(mat, 1, function(x) max(x) - min(x))
row_ranges
#> [1] 15 15 15 15 15
```

**Explanation:** With `MARGIN = 1`, `apply()` feeds each row as a vector to the function. Every row spans from its minimum (column 1) to its maximum (column 4), and since the matrix fills column-by-column, each row has the same range of 15.

</details>

### Exercise 2: Column-Wise Custom Function

Write a function that computes the **coefficient of variation** (CV) — that's the standard deviation divided by the mean, times 100 — and use `apply()` with `MARGIN = 2` to compute the CV for each column of `mtcars[, 1:4]`.

```r
# Exercise 2: Coefficient of variation per column
# CV = (sd / mean) * 100 — higher means more spread relative to the mean

# Write your cv function and apply it column-wise
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
cv_fn <- function(x) (sd(x) / mean(x)) * 100

cv_results <- apply(mtcars[, 1:4], 2, cv_fn)
round(cv_results, 1)
#>  mpg  cyl disp   hp
#> 29.9 28.6 53.7 46.7
```

**Explanation:** `MARGIN = 2` means "iterate over columns." The `disp` column has the highest CV (53.7%), meaning engine displacement varies the most relative to its average. `mpg` and `cyl` are more tightly clustered.

</details>

[TIP]
**Handle NAs inside the applied function, not outside.** Writing `apply(airquality, 2, mean, na.rm = TRUE)` passes `na.rm` through to `mean()` via the `...` argument. This is cleaner than pre-filtering with `na.omit()`, which drops entire rows.

**Try it:** Use `apply()` to find which column has the **largest range** (max − min) in `airquality[, 1:4]`. Remember to pass `na.rm = TRUE`.

```r
# Try it: which column has the largest range?
ex_ranges <- apply(airquality[, 1:4], 2, function(x) {
  # your code here
})
# Which column name has the max range?
#> Expected: "Ozone"
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_ranges <- apply(airquality[, 1:4], 2, function(x) {
  max(x, na.rm = TRUE) - min(x, na.rm = TRUE)
})
ex_ranges
#>   Ozone Solar.R    Wind    Temp
#>   167.0   333.0    16.6    41.0

names(which.max(ex_ranges))
#> [1] "Solar.R"
```

**Explanation:** `Solar.R` actually has the largest absolute range (333), not `Ozone`. The raw range depends on the scale of each variable. If you wanted a scale-free comparison, you'd use the coefficient of variation from Exercise 2.

</details>

## How Do lapply() and sapply() Differ? (Exercises 3–5)

Both `lapply()` and `sapply()` iterate element-by-element over a list or vector. The difference is purely in the output: `lapply()` always returns a list, while `sapply()` tries to simplify the result into a vector or matrix. That simplification is convenient in the console but can bite you in scripts.

### Exercise 3: String Manipulation with lapply()

Given a list of city-name vectors (one vector per country), use `lapply()` to collapse each vector into a single comma-separated string.

```r
# Exercise 3: Collapse city names
cities <- list(
  USA = c("New York", "Chicago", "Houston"),
  UK = c("London", "Manchester"),
  Japan = c("Tokyo", "Osaka", "Kyoto", "Nagoya")
)

# Use lapply() to paste each country's cities into one string
# Hint: paste(..., collapse = ", ")
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
cities <- list(
  USA = c("New York", "Chicago", "Houston"),
  UK = c("London", "Manchester"),
  Japan = c("Tokyo", "Osaka", "Kyoto", "Nagoya")
)

city_strings <- lapply(cities, function(x) paste(x, collapse = ", "))
city_strings
#> $USA
#> [1] "New York, Chicago, Houston"
#>
#> $UK
#> [1] "London, Manchester"
#>
#> $Japan
#> [1] "Tokyo, Osaka, Kyoto, Nagoya"
```

**Explanation:** `lapply()` feeds each element of the list (a character vector of city names) to the anonymous function. `paste(collapse = ", ")` squashes each vector into a single string. The result is a named list — one string per country.

</details>

### Exercise 4: sapply() for Quick Column Summaries

Use `sapply()` on `mtcars` to count the number of **unique values** in each column. The result should be a named integer vector.

```r
# Exercise 4: Unique value counts per column
# Hint: combine length() and unique()
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
unique_counts <- sapply(mtcars, function(x) length(unique(x)))
unique_counts
#>  mpg  cyl disp   hp drat   wt qsec   vs   am gear carb
#>   25    3   27   22   22   29   30    2    2    3    6
```

**Explanation:** `sapply()` applied the function to each column and simplified the 11 single-number results into a named integer vector. Columns like `vs` and `am` have only 2 unique values (they're binary), while `qsec` has 30 distinct values across 32 rows.

</details>

### Exercise 5: When sapply() Surprises You

Apply a function that returns **different-length results** to a list. Compare what `lapply()` and `sapply()` return. Why does `sapply()` not simplify this time?

```r
# Exercise 5: sapply() vs lapply() on ragged output
mixed_list <- list(
  a = 1:3,
  b = 1:5,
  c = 1:2
)

# Apply range() to each element using both lapply() and sapply()
# Compare the structure of the results
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
mixed_list <- list(
  a = 1:3,
  b = 1:5,
  c = 1:2
)

result_lapply <- lapply(mixed_list, range)
result_lapply
#> $a
#> [1] 1 3
#>
#> $b
#> [1] 1 5
#>
#> $c
#> [1] 1 2

result_sapply <- sapply(mixed_list, range)
result_sapply
#>      a b c
#> [1,] 1 1 1
#> [2,] 3 5 2

class(result_sapply)
#> [1] "matrix"
```

**Explanation:** Here `sapply()` *does* simplify — because every result has the same length (2). It stacks them into a 2×3 matrix. The surprise would come if one element returned a different length — then `sapply()` would silently fall back to a list. That inconsistency is why `vapply()` exists.

</details>

[KEY INSIGHT]
**lapply() is the safest default.** It always returns a list, regardless of what your function produces. Start with lapply(), then switch to sapply() only when you're exploring interactively and want a quick vector.

[WARNING]
**sapply() can silently change output types between runs.** If your data sometimes has groups of different sizes, sapply() might return a matrix one day and a list the next. In production code, use vapply() to lock in the expected shape.

**Try it:** Use `lapply()` to split the `iris` data frame by `Species`, then check the class and length of the result.

```r
# Try it: split + lapply
ex_split <- split(iris, iris$Species)
# What is class(ex_split)?
# How many elements does it have?
#> Expected: a list of 3 data frames
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_split <- split(iris, iris$Species)
class(ex_split)
#> [1] "list"
length(ex_split)
#> [1] 3
lapply(ex_split, nrow)
#> $setosa
#> [1] 50
#>
#> $versicolor
#> [1] 50
#>
#> $virginica
#> [1] 50
```

**Explanation:** `split()` divides a data frame by a factor and returns a named list — one data frame per level. Each species has 50 rows. This `split()` + `lapply()` pattern is the base R equivalent of `group_by()` + `summarise()`.

</details>

## Why Should You Use vapply() Over sapply()? (Exercises 6–7)

`vapply()` is the type-safe version of `sapply()`. You specify the expected return type and length with `FUN.VALUE`. If the actual result doesn't match, R throws an error immediately instead of silently returning the wrong shape. This one extra argument makes `vapply()` the professional choice for scripts and packages.

### Exercise 6: Type-Safe Column Summaries with vapply()

Redo Exercise 4 (counting unique values per column in `mtcars`) using `vapply()` instead of `sapply()`. Specify `FUN.VALUE = integer(1)` to guarantee you get back an integer vector.

```r
# Exercise 6: vapply() for type-safe unique counts
# Hint: vapply(X, FUN, FUN.VALUE)
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
unique_safe <- vapply(mtcars, function(x) length(unique(x)), FUN.VALUE = integer(1))
unique_safe
#>  mpg  cyl disp   hp drat   wt qsec   vs   am gear carb
#>   25    3   27   22   22   29   30    2    2    3    6
```

**Explanation:** The result is identical to Exercise 4's `sapply()` output, but now you have a guarantee. If any column's function returned something other than a single integer — say, a character string or a vector of length 2 — R would stop with an error instead of returning a quietly broken result.

</details>

### Exercise 7: Catching Type Mismatches

Write a `vapply()` call that **deliberately fails** because the function returns a character instead of a numeric. Wrap it in `tryCatch()` so your code handles the error gracefully instead of crashing.

```r
# Exercise 7: Deliberate vapply() failure + error handling
# Step 1: Write a function that returns the class of a column (character)
# Step 2: Call vapply() expecting numeric(1) — this should fail
# Step 3: Wrap in tryCatch() to catch and print the error message
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
safe_result <- tryCatch(
  vapply(mtcars, class, FUN.VALUE = numeric(1)),
  error = function(e) paste("Caught error:", e$message)
)
safe_result
#> [1] "Caught error: values must be type 'double',\n but FUN(X[[1]]) result is type 'character'"
```

**Explanation:** `class()` returns a character string, but we told `vapply()` to expect `numeric(1)`. The mismatch triggers an error. `tryCatch()` intercepts it so the script continues instead of stopping. In real code, you'd log the error or fall back to a default.

</details>

[KEY INSIGHT]
**vapply() is sapply() with a contract.** You tell R what shape to expect. If a column suddenly returns 2 values instead of 1, vapply() errors immediately rather than silently returning a list. That instant failure is a feature — it catches bugs at the source.

**Try it:** Use `vapply()` to extract the `class()` of every column in `mtcars`. What should `FUN.VALUE` be?

```r
# Try it: vapply for column classes
ex_types <- vapply(mtcars, class, FUN.VALUE = "placeholder")
# What should replace "placeholder"?
#> Expected: character(1)
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_types <- vapply(mtcars, class, FUN.VALUE = character(1))
ex_types
#>       mpg       cyl      disp        hp      drat        wt      qsec
#> "numeric" "numeric" "numeric" "numeric" "numeric" "numeric" "numeric"
#>        vs        am      gear      carb
#> "numeric" "numeric" "numeric" "numeric"
```

**Explanation:** `class()` returns a single character string, so `FUN.VALUE = character(1)` is the correct template. Every column in `mtcars` is numeric, so they all match.

</details>

## How Does tapply() Compute Group Statistics? (Exercises 8–9)

`tapply()` splits a vector by one or more factors and applies a function to each group. Think of it as the base R equivalent of `dplyr::group_by() |> summarise()`. The result is a named vector (one factor) or a matrix (two factors).

### Exercise 8: Group Means with tapply()

Compute the mean `Sepal.Length` for each `Species` in the `iris` dataset using `tapply()`.

```r
# Exercise 8: tapply() for group means
# tapply(vector, grouping_factor, function)
# your code here
#> Expected: named numeric vector with 3 species means
```

<details>
<summary>Click to reveal solution</summary>

```r
species_means <- tapply(iris$Sepal.Length, iris$Species, mean)
species_means
#>     setosa versicolor  virginica
#>      5.006      5.936      6.588
```

**Explanation:** `tapply()` split the 150 `Sepal.Length` values into three groups (one per species), computed the mean of each, and returned a named numeric vector. Virginica has the longest sepals on average at 6.588 cm.

</details>

### Exercise 9: Two-Way tapply() Table

Use `tapply()` with **two** grouping factors — `cyl` and `am` (transmission: 0 = automatic, 1 = manual) — to compute the mean `mpg` for each combination in `mtcars`. The result should be a 3×2 matrix.

```r
# Exercise 9: Two-way table with tapply()
# Hint: pass a list of factors as the INDEX argument
# your code here
#> Expected: 3x2 matrix (3 cyl levels × 2 am levels)
```

<details>
<summary>Click to reveal solution</summary>

```r
mpg_table <- tapply(mtcars$mpg, list(cyl = mtcars$cyl, am = mtcars$am), mean)
round(mpg_table, 1)
#>      0     1
#> 4 22.9  28.1
#> 6 19.1  20.6
#> 8 15.1  15.4
```

**Explanation:** When `INDEX` is a list of two factors, `tapply()` returns a matrix. Rows are `cyl` levels (4, 6, 8), columns are `am` levels (0 = auto, 1 = manual). Manual 4-cylinder cars average 28.1 mpg — the highest group. Eight-cylinder automatics average only 15.1 mpg.

</details>

[TIP]
**tapply() with two factors returns a matrix.** Rows correspond to the first factor's levels, columns to the second. This is a quick way to build cross-tabulation summaries without loading any packages.

**Try it:** Use `tapply()` to find the **maximum** `hp` for each combination of `cyl` and `gear` in `mtcars`.

```r
# Try it: max hp by cyl and gear
ex_hp <- tapply(mtcars$hp, list(mtcars$cyl, mtcars$gear), max)
ex_hp
#> Expected: a matrix with some NA cells (not all combinations exist)
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_hp <- tapply(mtcars$hp, list(cyl = mtcars$cyl, gear = mtcars$gear), max)
ex_hp
#>    3   4   5
#> 4 97 109  91
#> 6 NA 123 175
#> 8 245  NA 335
```

**Explanation:** Some combinations don't exist in the data (e.g., no 6-cylinder cars with 3 gears), so those cells are `NA`. The 8-cylinder, 5-gear group has the most powerful car at 335 hp — that's the Maserati Bora.

</details>

## How Does mapply() Handle Multiple Inputs? (Exercises 10–11)

`mapply()` is the multivariate version — it takes multiple vectors or lists and feeds corresponding elements to the function in parallel. Think of it as "zip then apply," similar to Python's `map(func, list1, list2)`.

### Exercise 10: Pasting Parallel Vectors

Given separate vectors of first names and last names, use `mapply()` with `paste()` to create full names.

```r
# Exercise 10: mapply() with paste
first_names <- c("Ada", "Grace", "Linus")
last_names <- c("Lovelace", "Hopper", "Torvalds")

# Use mapply() to paste first and last names together
# your code here
#> Expected: "Ada Lovelace" "Grace Hopper" "Linus Torvalds"
```

<details>
<summary>Click to reveal solution</summary>

```r
first_names <- c("Ada", "Grace", "Linus")
last_names <- c("Lovelace", "Hopper", "Torvalds")

full_names <- mapply(paste, first_names, last_names)
full_names
#> [1] "Ada Lovelace"   "Grace Hopper"   "Linus Torvalds"
```

**Explanation:** `mapply()` passes the first elements together (`"Ada"`, `"Lovelace"`), then the second elements, then the third. Since `paste()` naturally takes multiple arguments, this works without an anonymous function. The result simplifies to a character vector.

</details>

### Exercise 11: Generating Custom Sequences

Use `mapply()` to generate four different numeric sequences where the `from`, `to`, and `by` arguments come from three separate vectors. Since the sequences have different lengths, set `SIMPLIFY = FALSE` to get a list.

```r
# Exercise 11: mapply() with seq()
starts <- c(1, 10, 100, 0)
ends <- c(5, 50, 300, 1)
steps <- c(1, 10, 50, 0.25)

# Use mapply() to generate each sequence
# Hint: mapply(seq, from, to, by, SIMPLIFY = FALSE)
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
starts <- c(1, 10, 100, 0)
ends <- c(5, 50, 300, 1)
steps <- c(1, 10, 50, 0.25)

sequences <- mapply(seq, from = starts, to = ends, by = steps, SIMPLIFY = FALSE)
sequences
#> [[1]]
#> [1] 1 2 3 4 5
#>
#> [[2]]
#> [1] 10 20 30 40 50
#>
#> [[3]]
#> [1] 100 150 200 250 300
#>
#> [[4]]
#> [1] 0.00 0.25 0.50 0.75 1.00
```

**Explanation:** `mapply()` zips the three vectors element-wise: `seq(1, 5, 1)`, `seq(10, 50, 10)`, `seq(100, 300, 50)`, `seq(0, 1, 0.25)`. Since the sequences have different lengths (5, 5, 5, 5 in this case — but they could differ), `SIMPLIFY = FALSE` guarantees a list output.

</details>

[NOTE]
**mapply() with SIMPLIFY = FALSE is equivalent to Map().** `Map(seq, starts, ends, steps)` gives the same result with cleaner syntax. Use `Map()` when you always want a list back.

**Try it:** Use `mapply()` to compute `weighted.mean()` for three pairs of values and weights.

```r
# Try it: weighted means with mapply
ex_vals <- list(c(80, 90, 70), c(95, 85), c(60, 70, 80, 90))
ex_wts <- list(c(0.3, 0.5, 0.2), c(0.6, 0.4), c(0.1, 0.2, 0.3, 0.4))

ex_wmeans <- mapply(weighted.mean, ex_vals, ex_wts)
ex_wmeans
#> Expected: numeric vector of 3 weighted means
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_vals <- list(c(80, 90, 70), c(95, 85), c(60, 70, 80, 90))
ex_wts <- list(c(0.3, 0.5, 0.2), c(0.6, 0.4), c(0.1, 0.2, 0.3, 0.4))

ex_wmeans <- mapply(weighted.mean, ex_vals, ex_wts)
ex_wmeans
#> [1] 83.0 91.0 80.0
```

**Explanation:** `mapply()` passes the first value-weight pair to `weighted.mean()`, then the second pair, then the third. The first group (80, 90, 70 with weights 0.3, 0.5, 0.2) gives 83.0 — the 90 gets the heaviest weight.

</details>

## Practice Exercises

These capstone exercises combine multiple apply functions. They're harder than the exercises above — you'll need to chain concepts together.

### Exercise 12: Full Pipeline — Split, Fit, Extract

Start with the `airquality` dataset. Remove rows with any `NA`. Split by `Month`. Use `lapply()` to fit a linear model (`Ozone ~ Solar.R`) for each month. Then use `sapply()` to extract the R-squared value from each model. Return a named vector of R-squared values.

```r
# Exercise 12: split + lapply + sapply pipeline
# Step 1: Remove rows with NA
# Step 2: Split by Month
# Step 3: Fit lm(Ozone ~ Solar.R) per month with lapply()
# Step 4: Extract R-squared with sapply()
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
# Step 1: Remove rows with NA
aq_clean <- na.omit(airquality)

# Step 2: Split by Month
aq_split <- split(aq_clean, aq_clean$Month)

# Step 3: Fit a linear model per month
models <- lapply(aq_split, function(df) lm(Ozone ~ Solar.R, data = df))

# Step 4: Extract R-squared from each model
r_squared <- sapply(models, function(m) summary(m)$r.squared)
round(r_squared, 3)
#>     5     6     7     8     9
#> 0.348 0.040 0.265 0.183 0.352
```

**Explanation:** This is the classic split-apply-combine pattern. `split()` creates a list of data frames (one per month). `lapply()` fits a linear model inside each. `sapply()` pulls one number (R²) from each model, simplifying to a vector. Months 5 and 9 show the strongest solar-ozone relationship (R² ≈ 0.35), while June barely explains any variance (R² = 0.04).

</details>

## Putting It All Together

Let's walk through a complete analysis using every apply function. We'll analyze the `mtcars` dataset from five angles.

```r
# --- Step 1: apply() — Normalize columns to 0-1 range ---
normalize <- function(x) (x - min(x)) / (max(x) - min(x))
mtcars_norm <- apply(mtcars[, c("mpg", "hp", "wt")], 2, normalize)
head(round(mtcars_norm, 2), 4)
#>                   mpg   hp   wt
#> Mazda RX4        0.45 0.20 0.28
#> Mazda RX4 Wag    0.45 0.20 0.35
#> Datsun 710       0.53 0.07 0.20
#> Hornet 4 Drive   0.47 0.20 0.44

# --- Step 2: lapply() — Per-group summary stats ---
cyl_groups <- split(mtcars, mtcars$cyl)
cyl_stats <- lapply(cyl_groups, function(df) {
  data.frame(
    n = nrow(df),
    mean_mpg = round(mean(df$mpg), 1),
    mean_hp = round(mean(df$hp), 1)
  )
})
do.call(rbind, cyl_stats)
#>   n mean_mpg mean_hp
#> 4 11     26.7    82.6
#> 6  7     19.7   122.3
#> 8 14     15.1   209.2

# --- Step 3: vapply() — Type-safe extraction ---
cyl_mpg_only <- vapply(cyl_groups, function(df) mean(df$mpg), numeric(1))
cyl_mpg_only
#>        4        6        8
#> 26.66364 19.74286 15.10000

# --- Step 4: tapply() — Two-way table ---
cyl_mpg_am <- tapply(mtcars$mpg, list(cyl = mtcars$cyl, am = mtcars$am), mean)
round(cyl_mpg_am, 1)
#>      0     1
#> 4 22.9  28.1
#> 6 19.1  20.6
#> 8 15.1  15.4

# --- Step 5: mapply() — Generate labels ---
labels <- mapply(
  function(cyl, am) paste0(cyl, "-cyl ", ifelse(am == 0, "Auto", "Manual")),
  rep(c(4, 6, 8), each = 2),
  rep(c(0, 1), 3)
)
labels
#> [1] "4-cyl Auto"   "4-cyl Manual" "6-cyl Auto"   "6-cyl Manual"
#> [5] "8-cyl Auto"   "8-cyl Manual"
```

Each function plays to its strength: `apply()` for column-wise math, `lapply()` for per-group summaries, `vapply()` for safe single-value extraction, `tapply()` for cross-tabulation, and `mapply()` for combining parallel vectors into labels.

[TIP]
**The split-apply-combine pattern covers 90% of grouped analysis in base R.** Use split() to divide data by a factor, lapply() to process each group, and do.call(rbind, ...) to reassemble. It works without loading any packages.

## Summary

![Which apply function to use — decision flowchart](screenshots/R-Apply-Exercises-choose-function.webp)

*Figure 1: Decision flowchart — which apply function to use based on your input data and desired output.*

| Function | Input | MARGIN? | Returns | Best For |
|----------|-------|---------|---------|----------|
| `apply()` | matrix / data frame | Yes (1 = row, 2 = col) | vector / matrix | Row/column operations |
| `lapply()` | list / vector | No | always a list | Safe iteration — predictable output |
| `sapply()` | list / vector | No | vector / matrix (tries) | Quick interactive exploration |
| `vapply()` | list / vector | No | vector / matrix (type-checked) | Production code — type safety |
| `tapply()` | vector + factor | No | array | Group-by statistics |
| `mapply()` | multiple vectors | No | vector / matrix / list | Parallel iteration over inputs |

Key takeaways:

1. **Start with lapply()** as your default — lists are predictable and never surprise you
2. **Use vapply()** in scripts and packages — the type contract catches bugs at the source
3. **Reserve apply()** for matrices and data frames where row/column operations make sense
4. **Use tapply()** for quick group summaries; switch to dplyr for complex grouped pipelines
5. **Use mapply() or Map()** when you need to iterate over multiple corresponding inputs

## References

1. R Core Team — apply() documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/apply.html)
2. R Core Team — lapply() and sapply() documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/lapply.html)
3. R Core Team — tapply() documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/tapply.html)
4. R Core Team — mapply() documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/mapply.html)
5. Wickham, H. — *Advanced R*, 2nd Edition. Chapter 9: Functionals. [Link](https://adv-r.hadley.nz/functionals.html)
6. Wickham, H. & Grolemund, G. — *R for Data Science*, 2nd Edition. Chapter 26: Iteration. [Link](https://r4ds.hadley.nz/iteration)
7. Burns, P. — *The R Inferno*. Circle 4: Over-Vectorizing. [Link](https://www.burns-stat.com/pages/Tutor/R_inferno.pdf)
8. DataCamp — R Tutorial on the Apply Family. [Link](https://www.datacamp.com/tutorial/r-tutorial-apply-family)

## Continue Learning

1. [Writing R Functions](/R-Functions.html) — Master function arguments, defaults, scope, and return values before tackling the apply family
2. [Functional Programming in R](/Functional-Programming-in-R.html) — Go deeper with closures, function factories, and the mindset that makes R code 10× cleaner
3. [purrr map() in R](/purrr-map-Variants.html) — Every variant explained with the mental model that makes them click
