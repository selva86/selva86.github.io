---
title: "purrr Exercises: 10 Functional Programming Practice Problems — Solved Step-by-Step"
slug: "purrr-Exercises"
description: "Practise purrr with 10 functional programming problems and worked solutions — runnable R exercises from beginner warm-ups to advanced iteration patterns."
keywords: "purrr exercises, purrr practice problems, purrr map exercises, functional programming R exercises, map2 pmap exercises, tidyverse iteration practice, map_dfr exercises, safely purrr, nest map purrr"
mathjax: false
webr: true
date: "2026-04-14"
curriculum_id: "E2.8"
post_type: "EX"
sidebar_title: "purrr (10 problems)"
auto_link_terms: "purrr exercises|purrr practice problems|purrr map exercises|functional programming exercises R|map2 practice|pmap practice|map_dfr exercises"
auto_link_case_sensitive: false
fr_parent: "Functional-Programming-in-R.html"
difficulty: "Intermediate"
---


# purrr Exercises: 10 Functional Programming Practice Problems

<p class="lead">Reading about <code>map()</code> is fast. Writing <code>map_dfr()</code>, <code>map2()</code>, <code>pmap()</code>, <code>safely()</code>, and the <code>\(x)</code> lambda shortcut fluently takes practice — and that's what these ten runnable problems give you.</p>

## How do you apply a function to every column of a data frame?

The typed `map_*()` family is the workhorse of purrr. You hand it a list (or a data frame, which is a list of columns) and a function, and it applies the function to every element — returning a guaranteed-type atomic vector instead of a list. Reach for `map_dbl()` when the answer is numeric, `map_chr()` for text, `map_int()` for counts, and `map_lgl()` for yes/no. The first three warm-ups all fit this one idea, starting with the simplest: one number per column.

```r
library(purrr)

# Mean of every column in mtcars, one line, named numeric output
map_dbl(mtcars, mean)
#>        mpg        cyl       disp         hp       drat         wt       qsec
#>  20.090625   6.187500 230.721875 146.687500   3.596563   3.217250  17.848750
#>         vs         am       gear       carb
#>   0.437500   0.406250   3.687500   2.812500
```

That one line replaces `sapply(mtcars, mean)` and a ritual `as.numeric()` call. `map_dbl()` inspects each column, computes `mean()`, and guarantees the output is a named `numeric` vector — so downstream code that does `round(..., 2)` or `sort()` just works. If any column returned something non-numeric (say, you accidentally passed a character column), you'd get a clear error instead of a silent list-of-mixed-types.

[KEY INSIGHT]
**Typed variants are a contract, not a convenience.** `map()` returns a list, which is flexible but unpredictable — every caller has to unpack it. `map_dbl()`, `map_chr()`, `map_int()`, and `map_lgl()` promise the exact type, so they fail loudly when the function misbehaves instead of handing you a broken list three pipes downstream.

**Try it:** Compute the mean of every column in `airquality` and store it in `ex_means`. The dataset has missing values, so pass `na.rm = TRUE` through `map_dbl()` using its `...` slot.

```r
# Warm-up 1: per-column means on airquality
ex_means <- map_dbl(airquality, mean, ___)
ex_means
#> Expected: Ozone ~42.13, Solar.R ~185.93, Wind ~9.96, Temp ~77.88, Month 6.99, Day 15.80
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_means <- map_dbl(airquality, mean, na.rm = TRUE)
ex_means
#>     Ozone   Solar.R      Wind      Temp     Month       Day
#>  42.12931 185.93151   9.95752  77.88235   6.99346  15.80392
```

**Explanation:** Any argument you put after the function in `map_dbl()` is forwarded to every call. Here `na.rm = TRUE` tells `mean()` to ignore NAs in `Ozone` and `Solar.R`. Without it, those two columns would come back as `NA` and poison any downstream arithmetic.

</details>

**Try it:** Return the class of every column in `iris` as a character vector called `ex_classes`. The right variant here is `map_chr()` because each call returns one string.

```r
# Warm-up 2: column classes of iris
ex_classes <- ___(iris, class)
ex_classes
#> Expected: four "numeric" columns plus Species as "factor"
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_classes <- map_chr(iris, class)
ex_classes
#> Sepal.Length  Sepal.Width Petal.Length  Petal.Width      Species
#>    "numeric"    "numeric"    "numeric"    "numeric"     "factor"
```

**Explanation:** `map_chr()` enforces that every call returns exactly one character value. `class()` fits that shape for every column in `iris`. If you ran `map_chr()` against an object where `class()` returns multiple strings (some S4 objects do), you'd get a clear type error — which is better than a quietly malformed result.

</details>

**Try it:** Count the number of unique values in every column of `iris` and save the result as `ex_uniques`. Use `map_int()` with a lambda that calls `length(unique(x))`.

```r
# Warm-up 3: distinct value counts per iris column
ex_uniques <- map_int(iris, ___)
ex_uniques
#> Expected: Sepal.Length 35, Sepal.Width 23, Petal.Length 43, Petal.Width 22, Species 3
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_uniques <- map_int(iris, \(x) length(unique(x)))
ex_uniques
#> Sepal.Length  Sepal.Width Petal.Length  Petal.Width      Species
#>           35           23           43           22            3
```

**Explanation:** The `\(x)` lambda is R 4.1+ shorthand for `function(x)`. `length(unique(x))` is one common way to count distinct values; `map_int()` then coerces the result to a named integer vector.

</details>

[TIP]
**`length(unique(x))` versus `dplyr::n_distinct()`.** Both count distinct values. `n_distinct()` is slightly faster on large vectors and has an `na.rm` argument; `length(unique())` needs no extra package. Use whichever matches the dependencies already loaded in your project.

## How do you iterate over logic, row-bind results, and walk parallel inputs?

The next tier of purrr covers four patterns that come up constantly in real analysis code. `map_lgl()` answers TRUE/FALSE questions about every element. `map_dfr()` stacks data frames returned by each iteration into one tidy frame — the purrr answer to `do.call(rbind, ...)`. `map2()` walks two inputs in parallel, useful for pairwise arithmetic. And `pmap()` generalises to three or more inputs by iterating over the rows of a data frame or list of vectors.

```r
# Which columns of mtcars are strictly positive?
pos_cols <- map_lgl(mtcars, \(x) all(x > 0))
pos_cols
#>   mpg   cyl  disp    hp  drat    wt  qsec    vs    am  gear  carb
#>  TRUE  TRUE  TRUE  TRUE  TRUE  TRUE  TRUE FALSE FALSE  TRUE  TRUE
```

Every column gets the same check — `all(x > 0)` — and the result is a named logical vector you can immediately plug into `mtcars[, pos_cols]` to subset. `vs` and `am` come back FALSE because both contain zeros. That's the pattern: `map_lgl()` + a predicate gives you a keep/drop mask in one line, no loop required.

[NOTE]
**`map2()` versus base `mapply()`.** Base R's `mapply()` does similar work but its return type depends on inputs — sometimes a vector, sometimes a matrix, sometimes a list. `map2()` and `map2_dbl()` give you the same typed contract as `map_dbl()`, so you know exactly what comes back.

**Try it:** `airquality` has some values that become negative after centering. Center every numeric column (`subtract the mean`) then find which columns still contain only non-negative values. Save the result to `ex_pos`. Handle NAs with `na.rm = TRUE`.

```r
# Warm-up 4: centered airquality, then check non-negative
centered <- map(airquality, \(x) x - mean(x, na.rm = TRUE))
ex_pos <- ___(centered, \(x) all(x >= 0, na.rm = TRUE))
ex_pos
#> Expected: all FALSE (every centered column has negative values by construction)
```

<details>
<summary>Click to reveal solution</summary>

```r
centered <- map(airquality, \(x) x - mean(x, na.rm = TRUE))
ex_pos <- map_lgl(centered, \(x) all(x >= 0, na.rm = TRUE))
ex_pos
#>   Ozone Solar.R    Wind    Temp   Month     Day
#>   FALSE   FALSE   FALSE   FALSE   FALSE   FALSE
```

**Explanation:** Centering by the mean guarantees the new column sums to zero, which forces at least some values below zero. Every entry in `ex_pos` is FALSE — exactly as you'd expect from the math. The chain `map() |> map_lgl()` is very common: first transform, then test.

</details>

**Try it:** For each cylinder group in `mtcars`, fit `lm(mpg ~ wt)` and row-bind the tidy coefficient tables into one data frame called `ex_models`. Use `split()` to get a list of three data frames, `map()` to fit a model per group, and `map_dfr()` to stack the tidy results with a `.id` column naming the group.

```r
# Warm-up 5: per-cylinder regression, row-bound tidy output
library(dplyr)
library(broom)

groups <- split(mtcars, mtcars$cyl)

ex_models <- ___(groups, \(df) tidy(lm(mpg ~ wt, data = df)), .id = "cyl")
ex_models
#> Expected: 6 rows (2 terms x 3 groups), columns cyl / term / estimate / std.error / statistic / p.value
```

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)
library(broom)

groups <- split(mtcars, mtcars$cyl)

ex_models <- map_dfr(groups, \(df) tidy(lm(mpg ~ wt, data = df)), .id = "cyl")
ex_models
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

**Explanation:** `split()` returns a named list keyed by `cyl`. `map_dfr()` walks that list, calls `tidy(lm(...))` on each data frame, and row-binds the six resulting mini-tables. The `.id = "cyl"` argument copies the list name into a new column so you know which row came from which group.

</details>

[TIP]
**`map_dfr()` is the purrr answer to `do.call(rbind, lapply(...))`.** Both produce one stacked data frame. `map_dfr()` wins on readability and adds the `.id` column for free, which matters every time you need to remember which group each row came from.

**Try it:** Given two numeric vectors of equal length, compute the pointwise maximum for each index and store it in `ex_paired`. Use `map2_dbl()` so the output is a plain numeric vector.

```r
# Warm-up 6: pointwise maximum of two vectors
a <- c(3, 8, 1, 6, 10)
b <- c(5, 4, 7, 2, 9)

ex_paired <- ___(a, b, max)
ex_paired
#> Expected: 5 8 7 6 10
```

<details>
<summary>Click to reveal solution</summary>

```r
a <- c(3, 8, 1, 6, 10)
b <- c(5, 4, 7, 2, 9)

ex_paired <- map2_dbl(a, b, max)
ex_paired
#> [1]  5  8  7  6 10
```

**Explanation:** `map2_dbl()` walks `a` and `b` together, calling `max(a[i], b[i])` for every index and returning a numeric vector. This is the same as `pmax(a, b)` in base R — `map2()` shines when the per-element function is more complex than `max()`, say a custom calculation that base R can't vectorise.

</details>

**Try it:** You have a tibble with columns `principal`, `rate`, and `years` describing three loans. Compute the compound interest final value for each row using `pmap_dbl()` and the formula `principal * (1 + rate)^years`. Save the result as `ex_compound`.

```r
# Warm-up 7: compound interest with pmap_dbl
loans <- data.frame(
  principal = c(1000, 5000, 2500),
  rate      = c(0.05, 0.04, 0.07),
  years     = c(10, 5, 3)
)

ex_compound <- ___(loans, \(principal, rate, years) principal * (1 + rate)^years)
ex_compound
#> Expected: ~1628.89, ~6083.26, ~3062.59
```

<details>
<summary>Click to reveal solution</summary>

```r
loans <- data.frame(
  principal = c(1000, 5000, 2500),
  rate      = c(0.05, 0.04, 0.07),
  years     = c(10, 5, 3)
)

ex_compound <- pmap_dbl(loans, \(principal, rate, years) principal * (1 + rate)^years)
ex_compound
#> [1] 1628.895 6083.264 3062.575
```

**Explanation:** `pmap()` treats each column of `loans` as a parallel input. For row *i* it calls your lambda with `principal = loans$principal[i]`, `rate = loans$rate[i]`, `years = loans$years[i]`. Name your lambda arguments to match the column names and the binding is automatic. `pmap_dbl()` then coerces the three results into a numeric vector.

</details>

## How do you handle list-columns, errors, and lambda shortcuts?

The hardest purrr patterns show up when iteration meets three real-world wrinkles: grouped data that you want to keep in one tidy frame (list-columns via `nest()` + `map()`), iterations that might fail on some inputs (`safely()`), and short one-off functions that would clutter your code if you had to name them (`\(x)` lambdas). The three closing problems cover exactly these.

```r
# Row counts per species using split + map + lambda shortcut
row_counts <- split(iris, iris$Species) |> map(\(df) nrow(df))
row_counts
#> $setosa
#> [1] 50
#>
#> $versicolor
#> [1] 50
#>
#> $virginica
#> [1] 50
```

The pipeline reads left-to-right: split `iris` into one data frame per species, then `map()` over that list applying the lambda. The result is a named list with one element per group. You'd use this shape when the per-group answer is richer than a single number — for example, a fitted model or a multi-row tidy table.

**Try it:** For each cylinder group in `mtcars`, compute the Pearson correlation between `mpg` and `wt`. Nest the data frame with `tidyr::nest()`, map a correlation function over the `data` list-column, and save the result as `ex_corr`.

```r
# Warm-up 8: per-cyl correlation using nest + map_dbl
library(tidyr)

nested <- mtcars |>
  group_by(cyl) |>
  nest()

ex_corr <- nested |>
  mutate(corr = ___(data, \(df) cor(df$mpg, df$wt)))
ex_corr |> select(cyl, corr)
#> Expected: cyl 4 ~-0.71, cyl 6 ~-0.68, cyl 8 ~-0.65
```

<details>
<summary>Click to reveal solution</summary>

```r
library(tidyr)

nested <- mtcars |>
  group_by(cyl) |>
  nest()

ex_corr <- nested |>
  mutate(corr = map_dbl(data, \(df) cor(df$mpg, df$wt)))
ex_corr |> select(cyl, corr)
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

**Try it:** Wrap `log()` with `safely()` so that a negative input returns the error instead of stopping the pipeline. Map the safe version over `c(4, -2, 9)` and pull out the successful results. Save the error-tolerant function as `safe_log` and the list of results as `ex_safe`.

```r
# Warm-up 9: error-tolerant log with safely()
safe_log <- ___(log)
ex_safe <- map(c(4, -2, 9), safe_log)

# Pull the first result out so you can see the shape
ex_safe[[1]]
#> Expected: $result = 1.386294, $error = NULL
ex_safe[[2]]
#> Expected: $result = NaN, $error = NULL  (log(-2) returns NaN with a warning, not an error)
```

<details>
<summary>Click to reveal solution</summary>

```r
safe_log <- safely(log)
ex_safe <- map(c(4, -2, 9), safe_log)

ex_safe[[1]]
#> $result
#> [1] 1.386294
#>
#> $error
#> NULL

ex_safe[[2]]
#> $result
#> [1] NaN
#>
#> $error
#> NULL
```

**Explanation:** `safely()` takes a function and returns a new function that wraps every call in a try/catch. On success, `$result` holds the value and `$error` is NULL; on failure the reverse. For `log(-2)` R returns NaN with a warning (not an error), so `$error` is still NULL — a nice reminder that "warning" and "error" are different in R. Swap `log` for a function that genuinely throws (say, `readLines` on a missing file) and you'll see the error slot populated.

</details>

[WARNING]
**`safely()` returns a list of lists — you have to pick the piece you want.** After `map(x, safely(f))` you get `list(list(result=..., error=NULL), list(result=NULL, error=...), ...)`. Use `map("result")` or `transpose()` to separate successes from failures. Forgetting this is the top purrr bug in production code.

**Try it:** Z-score every numeric column of `iris` (i.e. subtract the mean, divide by the standard deviation) using a `\(x)` lambda inside `map()`. The `Species` column isn't numeric, so filter it out first with `keep(is.numeric)`. Save the result as `ex_scaled`.

```r
# Warm-up 10: z-score every numeric column with a lambda
ex_scaled <- iris |>
  keep(is.numeric) |>
  map(___)

# Check: the first six values of the scaled Sepal.Length column
head(ex_scaled$Sepal.Length, 6)
#> Expected: -0.898 -1.139 -1.381 -1.501 -1.018 -0.535
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_scaled <- iris |>
  keep(is.numeric) |>
  map(\(x) (x - mean(x)) / sd(x))

head(ex_scaled$Sepal.Length, 6)
#> [1] -0.8976739 -1.1392005 -1.3807271 -1.5014904 -1.0184372 -0.5353840
```

**Explanation:** `keep(is.numeric)` drops `Species` before the iteration starts. Then `map()` applies the z-score lambda to every remaining column. The `\(x)` shortcut lets you write the formula inline without a `function(x) { ... }` wrapper — perfect for a one-off transformation you don't plan to reuse.

</details>

## Practice Exercises

Three capstone problems that combine multiple purrr concepts from above. These are harder than the warm-ups and meant to consolidate what you've just learned. Every solution uses variables prefixed with `my_` so they don't collide with the warm-up state.

### Exercise 1: Grouped summary table in one pipeline

For `mtcars`, nest by `cyl` and compute three per-group aggregates in one `mutate()` + `map_dbl()` sweep: mean `mpg`, max `hp`, and row count. Return a single tidy frame with one row per cylinder group and columns `cyl`, `mean_mpg`, `max_hp`, `n_rows`. Save the result as `my_summary`.

```r
# Capstone 1: your code here. Start with mtcars |> group_by(cyl) |> nest()

```

<details>
<summary>Click to reveal solution</summary>

```r
my_summary <- mtcars |>
  group_by(cyl) |>
  nest() |>
  mutate(
    mean_mpg = map_dbl(data, \(df) mean(df$mpg)),
    max_hp   = map_dbl(data, \(df) max(df$hp)),
    n_rows   = map_int(data, nrow)
  ) |>
  select(cyl, mean_mpg, max_hp, n_rows)
my_summary
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

### Exercise 2: Safely parse many character vectors

You receive a list of three character vectors. Two are cleanly convertible to numeric, one contains a non-numeric token. Wrap `as.numeric` in `safely()`, map it over the list, and build a tidy data frame called `my_parse` with two columns: `input_id` (which vector) and `status` (`"ok"` if the conversion produced no warnings, `"failed"` otherwise). Hint: use `purrr::quietly()` if you want warnings captured alongside errors.

```r
# Capstone 2: your code here
raw <- list(
  a = c("1", "2", "3"),
  b = c("4.5", "oops", "6"),
  c = c("7", "8", "9")
)

```

<details>
<summary>Click to reveal solution</summary>

```r
raw <- list(
  a = c("1", "2", "3"),
  b = c("4.5", "oops", "6"),
  c = c("7", "8", "9")
)

quiet_numeric <- quietly(as.numeric)
parsed <- map(raw, quiet_numeric)

my_parse <- tibble::tibble(
  input_id = names(parsed),
  status   = map_chr(parsed, \(p) if (length(p$warnings) == 0) "ok" else "failed")
)
my_parse
#> # A tibble: 3 x 2
#>   input_id status
#>   <chr>    <chr>
#> 1 a        ok
#> 2 b        failed
#> 3 c        ok
```

**Explanation:** `quietly()` is the sibling of `safely()` that also captures warnings — and `as.numeric()` issues a warning (not an error) when a token fails to parse. The solution uses `map()` to run the quiet version, then `map_chr()` to inspect each result's `$warnings` slot. Pattern: pick `safely()` for errors, `quietly()` for warnings, `possibly()` when you just want a default value on failure.

</details>

### Exercise 3: All pairwise correlations with pmap_dbl

You have a tibble with three numeric columns `x`, `y`, `w`. Compute the three pairwise Pearson correlations — `cor(x,y)`, `cor(x,w)`, `cor(y,w)` — in a single `pmap_dbl()` call over a helper tibble that lists the column pairs. Save the result as `my_corrs` (named numeric vector with entries `x_y`, `x_w`, `y_w`).

```r
# Capstone 3: your code here
library(tibble)
set.seed(17)
df <- tibble(
  x = rnorm(50),
  y = rnorm(50) + 0.4 * rnorm(50),
  w = rnorm(50)
)

```

<details>
<summary>Click to reveal solution</summary>

```r
library(tibble)
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

my_corrs <- pmap_dbl(pairs, \(a, b) cor(df[[a]], df[[b]]))
names(my_corrs) <- paste(pairs$a, pairs$b, sep = "_")
my_corrs
#>       x_y       x_w       y_w
#> 0.1204519 0.1596373 0.1893028
```

**Explanation:** The trick is building a small `pairs` tibble with the column names you want to correlate — then `pmap_dbl()` walks its rows, pulling out `df[[a]]` and `df[[b]]` at each step. This pattern scales: if you had 20 columns and wanted all pairs, you'd generate `pairs` with `utils::combn(names(df), 2)` and feed the same `pmap_dbl()` call unchanged.

</details>

## Complete Example

Here's what a real-world purrr pipeline looks like: per-cylinder multiple regression of `mpg ~ wt + hp`, extracting both the tidy coefficient tables and the R² values in one flow. Every step uses a concept from the warm-ups above.

```r
final_nested <- mtcars |>
  group_by(cyl) |>
  nest() |>
  mutate(
    model    = map(data, \(df) lm(mpg ~ wt + hp, data = df)),
    tidied   = map(model, broom::tidy),
    r2       = map_dbl(model, \(m) summary(m)$r.squared)
  )

# Per-cyl R² values
final_r2 <- final_nested |> select(cyl, r2)
final_r2
#> # A tibble: 3 x 2
#> # Groups:   cyl [3]
#>     cyl    r2
#>   <dbl> <dbl>
#> 1     6 0.755
#> 2     4 0.812
#> 3     8 0.524

# Row-bound tidy coefficient table across all three groups
final_coefs <- final_nested |>
  select(cyl, tidied) |>
  tidyr::unnest(tidied)
final_coefs
#> # A tibble: 9 x 6
#> # Groups:   cyl [3]
#>     cyl term        estimate std.error statistic p.value
#>   <dbl> <chr>          <dbl>     <dbl>     <dbl>   <dbl>
#> 1     6 (Intercept)   30.6       9.33      3.28   0.0305
#> 2     6 wt            -3.50     2.20      -1.59   0.187
#> 3     6 hp            -0.0100   0.0309   -0.323   0.763
#> 4     4 (Intercept)   45.8       3.99     11.5    1.58e-6
#> 5     4 wt            -4.88     1.37     -3.56    0.00743
#> 6     4 hp            -0.0354   0.0169   -2.09    0.0661
#> 7     8 (Intercept)   25.1       5.43      4.63   0.000714
#> 8     8 wt            -1.40     1.07     -1.31    0.217
#> 9     8 hp            -0.0130   0.0125   -1.04    0.319
```

Three things happen in one pipeline. First, `nest()` collapses each cyl group into a list-column. Second, `map()` fits a model per group and stashes the fit object in a new column. Third, `map_dbl()` extracts R² into a plain numeric column while `map()` pulls the tidy coefficient frame into another list-column that `unnest()` expands into the final 9-row table. One read-through tells you which coefficients are significant in which groups — all without a single explicit for-loop.

## Summary

The ten problems above cover the purrr vocabulary you'll use in 90% of real analysis code. If you can fluently pick the right verb from this table, you're past the "purrr is confusing" phase.

| Function | Returns | When to use | One-line example |
|---|---|---|---|
| `map(x, f)` | list | You need the flexibility of a list output | `map(mtcars, summary)` |
| `map_dbl(x, f)` | numeric | Per-element answer is one number | `map_dbl(mtcars, mean)` |
| `map_chr(x, f)` | character | Per-element answer is one string | `map_chr(iris, class)` |
| `map_int(x, f)` | integer | Per-element answer is a count | `map_int(iris, \(x) length(unique(x)))` |
| `map_lgl(x, f)` | logical | Predicate / mask | `map_lgl(mtcars, \(x) all(x > 0))` |
| `map_dfr(x, f)` | data frame | Each iteration returns a frame to stack | `map_dfr(groups, \(d) tidy(lm(y ~ x, d)))` |
| `map2(x, y, f)` | list/typed | Two parallel inputs | `map2_dbl(a, b, max)` |
| `pmap(l, f)` | list/typed | Three or more parallel inputs | `pmap_dbl(loans, \(p, r, y) p * (1 + r)^y)` |
| `safely(f)` | function | Trap errors per iteration | `map(x, safely(log))` |
| `\(x) ...` | function | One-off lambda without naming | `map(xs, \(x) (x - mean(x)) / sd(x))` |

[KEY INSIGHT]
**purrr replaces `for` loops with verbs that return predictable types.** Once you internalise that every `map_*()` is a contract — "give me a list, I'll give you exactly this shape back" — you stop writing loops and start writing pipelines.

## References

1. Wickham, H. & Grolemund, G. — *R for Data Science*, 2nd ed. Chapter 27: Iteration. [Link](https://r4ds.hadley.nz/iteration.html)
2. purrr package reference and articles. [Link](https://purrr.tidyverse.org/)
3. Wickham, H. — *Advanced R*, 2nd ed. Chapter 9: Functionals. [Link](https://adv-r.hadley.nz/functionals.html)
4. tidyr `nest()` documentation. [Link](https://tidyr.tidyverse.org/reference/nest.html)
5. Tidyverse blog — purrr 1.0.0 release notes. [Link](https://www.tidyverse.org/blog/2022/12/purrr-1-0-0/)

## Continue Learning

- [Functional Programming in R](Functional-Programming-in-R.html) — the parent tutorial covering why functional style works so well for data analysis.
- [purrr map() Variants](purrr-map-Variants.html) — a function-by-function deep dive on every typed `map_*()` in the package.
- [Reduce, Filter, Map in Base R](Reduce-Filter-Map-in-R.html) — the same ideas using only base R, useful when you can't add tidyverse as a dependency.
