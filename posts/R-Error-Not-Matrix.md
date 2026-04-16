---
title: "R apply() Error: 'argument is not a matrix' — Try These Alternatives"
slug: "R-Error-Not-Matrix"
description: "Fix R's apply() error when you pass a data frame, list, or vector. Learn correct matrix conversion, when to use lapply/sapply/vapply, and the dplyr fix."
keywords: "R argument is not a matrix, apply() error R, R apply data frame, as.matrix R, lapply vs apply, sapply alternative, dplyr across"
auto_link_terms: "argument is not a matrix|apply() error|X must have at least 2 dimensions|as.matrix() conversion"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-13"
curriculum_id: "ERR13"
post_type: "FR"
fr_parent: "R-Common-Errors.html"
difficulty: "Intermediate"
---

# R apply() Error: 'argument is not a matrix' — Try These Alternatives

<p class="lead">The message <code>argument is not a matrix</code> (and its modern cousin <code>'X' must have at least 2 dimensions</code>) means you handed <code>apply()</code> something it can't treat as a rectangular, single-type grid — usually a data frame with mixed columns, a list, or a plain vector. The fix is to pick the right tool: convert the structure honestly, or switch to <code>lapply()</code>, <code>sapply()</code>, <code>vapply()</code>, or <code>dplyr::across()</code>.</p>

## Why does apply() throw "argument is not a matrix"?

`apply()` is a matrix function wearing a friendly face. Internally it calls `as.matrix()` on your input and demands a rectangular, single-type grid. A vector has no rows and columns, a list has no shape at all, and a mixed data frame forces every number to become a character. Any of these trips the error. The fastest way to see the fix is to watch it happen.

```r
# A small gradebook with a name column (character) plus two numeric columns.
grades <- data.frame(
  student = c("Alice", "Bob", "Cara"),
  math    = c(88, 92, 75),
  reading = c(81, 95, 79)
)

# Wrong: apply() on the whole data frame coerces everything to character.
# apply(grades, 1, mean)
#> Warning messages: argument is not numeric or logical: returning NA

# Right: drop the character column, then apply row-wise.
row_means <- apply(as.matrix(grades[, c("math", "reading")]), 1, mean)
row_means
#> [1] 84.5 93.5 77.0
```

The first call fails because `as.matrix()` promoted the `student` column (character) and dragged every number along with it — `mean()` on character data returns `NA`. The second call selects only the numeric columns first, so the matrix is genuinely numeric and the row means come out as expected. That one move — "pick numeric columns *before* you convert" — fixes ninety percent of real-world cases.

[KEY INSIGHT]
**A matrix is a single-type grid, and that is the entire source of trouble.** Every time `apply()` surprises you, the explanation is that R was forced to pick one type for the whole rectangle — and the type it picked wasn't the one you wanted.

**Try it:** Using the built-in `iris` dataset, compute the row-wise sum of its four numeric columns (columns 1 through 4) with `apply()`. Store the result in `ex_row_sums` and print the first six values.

```r
# Try it: row sums of iris numeric columns
ex_row_sums <- # your code here

head(ex_row_sums)
#> Expected: 10.2 9.5 9.4 9.4 10.2 11.4
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_row_sums <- apply(as.matrix(iris[, 1:4]), 1, sum)
head(ex_row_sums)
#> [1] 10.2  9.5  9.4  9.4 10.2 11.4
```

**Explanation:** `iris[, 1:4]` drops the `Species` factor column, leaving a purely numeric frame. `as.matrix()` then produces a clean numeric matrix, and `apply(..., 1, sum)` sums across rows.

</details>

## How do you convert a data frame correctly?

The error is almost always a conversion error, not an `apply()` error. Your job is to hand `apply()` a numeric matrix — which means picking the numeric columns explicitly, then coercing. Let's see the silent failure mode up close, because no error is thrown and the wrong answer ships to production.

```r
# iris has four numeric columns plus a Species factor.
# Naive conversion: the factor drags everything to character.
bad <- as.matrix(iris)
typeof(bad)
#> [1] "character"

# Safe conversion: pick numeric columns, then coerce.
iris_num <- as.matrix(iris[, sapply(iris, is.numeric)])
typeof(iris_num)
#> [1] "double"

col_means <- apply(iris_num, 2, mean)
col_means
#> Sepal.Length  Sepal.Width Petal.Length  Petal.Width
#>     5.843333     3.057333     3.758000     1.199333
```

Two things are worth noticing. First, `typeof(bad)` is `"character"` — no warning, no error, just numbers secretly turned into text. Second, the `sapply(iris, is.numeric)` trick returns a logical vector the same length as the number of columns, which you can use to filter. From there, `apply(iris_num, 2, mean)` walks across columns (MARGIN = 2) and returns the four feature means. This pattern — `df[, sapply(df, is.numeric)]` — is the single most useful defensive move in the apply ecosystem.

[WARNING]
**Mixed-type apply() fails silently.** If even one column is character or factor, `as.matrix()` promotes the whole matrix to character, and numeric functions return `NA` with only a warning. Always filter to numeric columns before matrix coercion.

**Try it:** The `airquality` dataset has numeric and integer columns plus some `NA`s. Compute the column means for every numeric column, ignoring `NA`s. Save the result to `ex_aq_means`.

```r
# Try it: column means of airquality
ex_aq_means <- # your code here

ex_aq_means
#> Expected: Ozone ~42.1, Solar.R ~185.9, Wind ~9.96, Temp ~77.88, Month 6.99, Day 15.80
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_aq_means <- apply(
  as.matrix(airquality[, sapply(airquality, is.numeric)]),
  2,
  mean,
  na.rm = TRUE
)
ex_aq_means
#>     Ozone   Solar.R      Wind      Temp     Month       Day
#> 42.129310 185.93151  9.957516 77.882353  6.993464 15.803922
```

**Explanation:** Every column in `airquality` is already numeric, so the `sapply(..., is.numeric)` filter is a no-op here — but it makes the code robust to future columns. `na.rm = TRUE` is passed through `apply()` to `mean()`.

</details>

## When should you use lapply, sapply, or vapply instead?

Some structures have no rows and columns at all — lists in particular. `apply()` can't help them, and trying is the most common cause of the raw "argument is not a matrix" phrasing. The list family (`lapply`, `sapply`, `vapply`) exists specifically for this case.

![Decision flowchart showing which apply-family function to use based on data shape](screenshots/R-Error-Not-Matrix-apply-family-decision.webp)
*Figure 1: Choosing between apply(), lapply()/sapply()/vapply(), tapply(), and mapply() based on your data's shape.*

```r
# A named list of numeric vectors — one per student, lengths may differ later.
scores_list <- list(
  alice = c(88, 92, 85),
  bob   = c(75, 81, 79),
  cara  = c(95, 92, 98)
)

# Wrong: apply() demands dimensions, and a list has none.
# apply(scores_list, 1, mean)
#> Error in apply(scores_list, 1, mean) : 'X' must have at least 2 dimensions

# Right: sapply() walks the list and simplifies to a named vector.
per_student <- sapply(scores_list, mean)
per_student
#> alice   bob  cara
#> 88.33 78.33 95.00

# Safer: vapply() makes you declare the return type up-front.
vapply(scores_list, mean, numeric(1))
#> alice   bob  cara
#> 88.33 78.33 95.00
```

`sapply()` is the lazy-friendly choice: it returns whatever shape is most natural — a vector if each call returns one value, a matrix if each returns the same-length vector. That flexibility is also its weakness, because a single weird element can silently change the return type. `vapply()` asks you to commit: "I promise each call returns a length-one numeric." If one doesn't, it errors immediately, which is exactly what you want in production code.

[TIP]
**Use vapply() in anything you will read again in six months.** The extra argument — a prototype like `numeric(1)` or `character(1)` — costs you a few keystrokes and buys you a loud error the moment the data changes shape.

**Try it:** Given a list of three numeric vectors `ex_list <- list(a = 1:5, b = 6:10, c = 11:15)`, compute the sum of each element and return a named numeric vector. Save it to `ex_sums`.

```r
# Try it: list element sums
ex_list <- list(a = 1:5, b = 6:10, c = 11:15)
ex_sums <- # your code here

ex_sums
#> Expected: a 15, b 40, c 65
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_list <- list(a = 1:5, b = 6:10, c = 11:15)
ex_sums <- sapply(ex_list, sum)
ex_sums
#>  a  b  c
#> 15 40 65
```

**Explanation:** `sapply()` walks each list element, calls `sum()`, and simplifies the list of one-element results into a named numeric vector. `vapply(ex_list, sum, integer(1))` would work identically while declaring the return type.

</details>

## How do you do this the tidyverse way with dplyr::across()?

If your workflow already lives in dplyr, `across()` is the modern, readable alternative to `apply()` for column-wise operations. It picks columns with `tidyselect` helpers like `where(is.numeric)` — no manual filter step needed.

```r
library(dplyr)

# starwars has numeric columns (height, mass, birth_year) and character columns.
sw_numeric <- starwars |>
  summarise(across(where(is.numeric), mean, na.rm = TRUE))

sw_numeric
#> # A tibble: 1 x 3
#>   height  mass birth_year
#>    <dbl> <dbl>      <dbl>
#> 1   174.  97.3       87.6
```

Three things are worth calling out. `where(is.numeric)` is a tidyselect helper that scans the incoming data and keeps only columns matching the predicate, so character columns like `name` and `hair_color` are transparently dropped. `across()` then applies `mean()` to each survivor. And because `across()` lives inside `summarise()`, the result is a tidy one-row tibble — the same shape you'd get for any other aggregation — which plugs straight into downstream joins, plots, and writes.

[NOTE]
**dplyr 1.1+ supersedes the old `mutate_if()` / `summarise_at()` variants with `across()`.** If you see tutorials using `summarise_if(is.numeric, mean)`, the modern rewrite is `summarise(across(where(is.numeric), mean))`. Check your dplyr version with `packageVersion("dplyr")`.

**Try it:** Use `across()` with `summarise()` to compute the median of every numeric column in the built-in `mtcars` data frame. Save the result to `ex_mtcars_medians`.

```r
# Try it: mtcars column medians via across()
ex_mtcars_medians <- # your code here

ex_mtcars_medians
#> Expected: mpg ~19.2, cyl 6, disp ~196.3, hp 123, ...
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_mtcars_medians <- mtcars |>
  summarise(across(where(is.numeric), median))

ex_mtcars_medians
#> # A tibble: 1 x 11
#>     mpg   cyl  disp    hp  drat    wt  qsec    vs    am  gear  carb
#>   <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl>
#> 1  19.2     6  196.   123  3.70  3.33  17.7     0     0     4     2
```

**Explanation:** Every `mtcars` column is already numeric, so `where(is.numeric)` selects them all. `across()` then applies `median` to each, and `summarise()` collapses the eleven results into a one-row tibble.

</details>

## How do you prevent the error in the first place?

Most errors are preventable with three small habits: check shapes before you convert, preserve rectangular structure when subsetting, and prefer specialised functions when they exist. Here's all three in a single demo.

```r
# 1. Guard clause: refuse anything that isn't already numeric and 2D.
safe_row_means <- function(x) {
  stopifnot(is.matrix(x) || is.data.frame(x))
  x_num <- x[, sapply(x, is.numeric), drop = FALSE]
  rowMeans(as.matrix(x_num))
}

# 2. drop = FALSE keeps a single-column subset as a data frame.
one_col <- mtcars[, "mpg", drop = FALSE]
class(one_col)
#> [1] "data.frame"

# 3. Built-ins are faster than apply() for their specific jobs.
fast_means <- colMeans(mtcars)
head(fast_means, 3)
#>     mpg     cyl    disp
#>  20.091   6.188 230.722
```

Each line earns its keep. `stopifnot()` turns a silent misuse ("I passed a vector") into a clear, early error. The `drop = FALSE` argument to `[` stops R from silently collapsing a one-column data frame into a vector — the single most common way users lose dimensionality and then hit the error. And `colMeans()`, `rowMeans()`, `colSums()`, `rowSums()` are implemented in C: for the exact operations they cover, they are 5–50x faster than the equivalent `apply()` call. Reach for them first, and fall back to `apply()` only when you need a custom function.

[TIP]
**Prefer `colMeans()` / `rowMeans()` / `colSums()` / `rowSums()` over `apply()` when you can.** They're implemented in C, run much faster, and sidestep the entire "is this a matrix?" question because they enforce numeric input themselves.

**Try it:** Write a function `ex_col_mins(df)` that returns the minimum of every numeric column in `df` as a named numeric vector. Use a `stopifnot()` guard to refuse non-data-frame input. Test it on `mtcars`.

```r
# Try it: safe column minimums
ex_col_mins <- function(df) {
  # your code here
}

head(ex_col_mins(mtcars), 3)
#> Expected: mpg 10.4, cyl 4, disp 71.1
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_col_mins <- function(df) {
  stopifnot(is.data.frame(df))
  nums <- df[, sapply(df, is.numeric), drop = FALSE]
  apply(as.matrix(nums), 2, min)
}

head(ex_col_mins(mtcars), 3)
#>  mpg  cyl disp
#> 10.4  4.0 71.1
```

**Explanation:** The guard rejects anything that isn't a data frame up front. The numeric-column filter handles mixed-type frames, and `drop = FALSE` preserves the data-frame shape even if only one numeric column survives. `apply(..., 2, min)` walks columns and returns the per-column minimum.

</details>

## Practice Exercises

### Exercise 1: Row-wise means on airquality with missing values

`airquality` has six numeric columns — `Ozone`, `Solar.R`, `Wind`, `Temp`, `Month`, `Day` — and scattered `NA`s in the first two. Compute a numeric vector of row means across all six columns, handling `NA`s. Save the result to `aq_row_means` and show the first six values.

```r
# Exercise 1: row means of airquality (NA-safe)
# Hint: use na.rm = TRUE inside apply()

aq_row_means <- # your code here

head(aq_row_means)
```

<details>
<summary>Click to reveal solution</summary>

```r
aq_row_means <- apply(as.matrix(airquality), 1, mean, na.rm = TRUE)
head(aq_row_means)
#> [1] 38.00000 40.16667 29.33333 30.50000 31.00000 29.83333
```

**Explanation:** Every column in `airquality` is numeric, so direct `as.matrix()` coercion is safe. `apply(..., 1, mean, na.rm = TRUE)` walks rows and passes `na.rm = TRUE` through to `mean()`, so rows with a missing Ozone or Solar.R still produce a finite mean from their remaining values.

</details>

### Exercise 2: Summary stats on a ragged list

You have a list of numeric vectors of *different lengths*. Compute the mean and standard deviation of each element and return a data frame with columns `name`, `mean`, `sd`. Save it to `ragged_summary`.

```r
# Exercise 2: per-element mean + sd from a ragged list
ragged <- list(
  north = c(12, 15, 9, 11),
  south = c(20, 22, 19, 25, 18, 21),
  east  = c(7, 9)
)

# Hint: sapply() for each stat, then assemble a data frame

ragged_summary <- # your code here

ragged_summary
```

<details>
<summary>Click to reveal solution</summary>

```r
ragged <- list(
  north = c(12, 15, 9, 11),
  south = c(20, 22, 19, 25, 18, 21),
  east  = c(7, 9)
)

ragged_summary <- data.frame(
  name = names(ragged),
  mean = sapply(ragged, mean),
  sd   = sapply(ragged, sd),
  row.names = NULL
)
ragged_summary
#>    name    mean       sd
#> 1 north 11.7500 2.629956
#> 2 south 20.8333 2.483277
#> 3  east  8.0000 1.414214
```

**Explanation:** The list has uneven element lengths, so it can never be coerced to a rectangular matrix — `apply()` is off the table. `sapply()` walks the list twice (once for `mean`, once for `sd`), returning a named numeric vector each time. Those two vectors plus the element names become the three columns of the summary data frame. `row.names = NULL` stops R from reusing the list names as row names.

</details>

## Complete Example

Putting every approach side by side on a small sales-by-region data set.

```r
library(dplyr)

sales <- data.frame(
  region = c("North", "South", "East", "West"),
  q1     = c(120, 135, 98, 150),
  q2     = c(145, 140, 110, 162),
  q3     = c(160, 155, 125, 170)
)

# Approach A — base apply() with manual numeric selection
num_cols <- sapply(sales, is.numeric)
apply(as.matrix(sales[, num_cols]), 2, mean)
#>    q1    q2    q3
#> 125.75 139.25 152.50

# Approach B — dplyr across()
sales |>
  summarise(across(where(is.numeric), mean))
#>       q1     q2    q3
#> 1 125.75 139.25 152.5

# Approach C — the built-in shortcut (fastest)
colMeans(sales[, num_cols])
#>    q1    q2    q3
#> 125.75 139.25 152.50
```

All three return the same numbers, but they communicate different intents. Approach A is the explicit fix — useful when you want to see every step and debug a stubborn error. Approach B is the readable pipeline — the right choice inside a tidyverse workflow. Approach C is the performance shortcut — reach for it when your job is one of the four built-in row/column reductions. There is no single winner; the mental model is "match the tool to the shape and to the function."

## Summary

| Situation | Use this | Why |
|---|---|---|
| Rectangular, all-numeric data | `apply()` or `rowMeans()` / `colMeans()` | Matrix-shaped input, single type |
| Mixed-type data frame | Select numeric cols first, then `apply()` | Avoids silent character coercion |
| List (even or uneven lengths) | `lapply()`, `sapply()`, `vapply()` | Lists don't have dimensions |
| dplyr workflow | `summarise(across(where(is.numeric), f))` | Readable, tidyselect-aware |
| Row/column sums or means | `rowSums()` / `colSums()` / `rowMeans()` / `colMeans()` | Implemented in C, much faster |
| Custom function per row/col | `apply()` on a numeric matrix | Only apply() takes a user function with MARGIN |

[KEY INSIGHT]
**The error message is asking you a shape question, not a syntax question.** Every fix on this page is the same move in a different disguise: tell R honestly what shape your data is, and pick the function that expects that shape.

## References

1. R Core Team — `?apply` help page. Official documentation for the apply family. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/apply.html)
2. Wickham, H. — *Advanced R*, 2nd Edition. Chapter 9: Functionals. [Link](https://adv-r.hadley.nz/functionals.html)
3. dplyr reference — `across()`. [Link](https://dplyr.tidyverse.org/reference/across.html)
4. R Core Team — *An Introduction to R*, Section 5: Arrays and Matrices. [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html#Arrays-and-matrices)
5. R Core Team — `?vapply` help page, on type-safe list iteration. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/lapply.html)

## Continue Learning

1. **R Common Errors** — the full reference of 50 R errors, with plain-English fixes for each.
2. **Functional Programming in R** — how `map()`, `reduce()`, and purrr sit on top of the apply family.
3. **dplyr across()** — the modern, tidyselect-aware replacement for column-wise `apply()`.
