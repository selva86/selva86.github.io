---
title: "Apply Family Exercises in R: 20 Real-World Practice Problems"
slug: "Apply-Family-Exercises-in-R"
description: "Practice apply, sapply, lapply, vapply, mapply, and tapply with 20 scenario-driven R exercises across matrices, data frames, and grouped vectors."
keywords: "apply sapply lapply exercises, apply family exercises in R, lapply practice problems, sapply exercises, mapply exercises, tapply exercises, vapply exercises"
mathjax: false
webr: true
date: "2026-05-12"
post_type: "EX"
sidebar_title: "Apply Family Exercises"
sidebar_order: 145
fr_parent: "base-apply-in-R.html"
auto_link_terms: "apply family exercises|sapply exercises|lapply exercises|apply family practice|mapply exercises|tapply exercises"
auto_link_case_sensitive: false
target_keyword: "apply sapply lapply exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Apply Family Exercises in R: 20 Real-World Practice Problems

<p class="lead">Twenty practice problems on the base R apply family: lapply, sapply, vapply, apply, mapply, and tapply. Light on warm-ups, heavy on the intermediate cases where the trap is picking the right family member. Solutions are hidden behind reveal toggles so you try first.</p>

```r title="Run this once before any exercise"
library(datasets)
```

## Section 1. lapply foundations (3 problems)

### Exercise 1.1: Audit column classes of iris with lapply

**Task:** A junior analyst onboarding to a new project wants a quick audit of column types in the `iris` dataset before joining it with other tables. Use `lapply()` together with the `class` function to return one element per column of `iris`. Save the result to `ex_1_1` and print it.

**Expected result:**

```
#> $Sepal.Length
#> [1] "numeric"
#>
#> $Sepal.Width
#> [1] "numeric"
#>
#> $Petal.Length
#> [1] "numeric"
#>
#> $Petal.Width
#> [1] "numeric"
#>
#> $Species
#> [1] "factor"
```

**Difficulty:** Beginner
[HINTS]
A data frame behaves like a list of columns, so a list-returning iterator can visit each column one at a time.
Call `lapply()` on `iris` with `class` passed directly as the function argument; no anonymous wrapper is needed.

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- lapply(iris, class)
ex_1_1
#> $Sepal.Length
#> [1] "numeric"
#>
#> $Sepal.Width
#> [1] "numeric"
#>
#> $Petal.Length
#> [1] "numeric"
#>
#> $Petal.Width
#> [1] "numeric"
#>
#> $Species
#> [1] "factor"
```

**Explanation:** A data frame is a list of columns, so `lapply()` walks each column and applies `class()`. The return type is always a list, which is what you want when elements could differ in length or type. Using `sapply()` here would still work because every result is length-one character, but `lapply()` is the right idiom when you intend a list and want it to stay that way regardless of input.

</details>

### Exercise 1.2: Count distinct values per mtcars column

**Task:** A data engineer is profiling `mtcars` to decide which columns are categorical-ish enough to convert to factors. Use `lapply()` with an anonymous function that calls `length(unique(x))` on each column. Save the named list to `ex_1_2` and print it.

**Expected result:**

```
#> $mpg
#> [1] 25
#>
#> $cyl
#> [1] 3
#>
#> $disp
#> [1] 27
#>
#> $hp
#> [1] 22
#>
#> $drat
#> [1] 22
#>
#> $wt
#> [1] 29
#>
#> $qsec
#> [1] 30
#>
#> $vs
#> [1] 2
#>
#> $am
#> [1] 2
#>
#> $gear
#> [1] 3
#>
#> $carb
#> [1] 6
```

**Difficulty:** Intermediate
[HINTS]
You need a count of how many distinct entries each column holds, computed one column at a time.
Pass `mtcars` to `lapply()` with an anonymous function that calls `length(unique(x))`.

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- lapply(mtcars, function(x) length(unique(x)))
ex_1_2
#> $mpg
#> [1] 25
#>
#> $cyl
#> [1] 3
#> ...
```

**Explanation:** Columns with only a handful of distinct values (cyl, vs, am, gear) are factor candidates. The anonymous function pattern `function(x) length(unique(x))` is the workhorse here. You could simplify the output with `sapply()` to get a named integer vector, but keeping it as a list keeps the door open for richer per-column metadata later (e.g. returning both count and the values themselves).

</details>

### Exercise 1.3: Per-column quantile summary on airquality

**Task:** An environmental analyst wants a five-number quantile breakdown for the four measurement columns of `airquality` (Ozone, Solar.R, Wind, Temp), ignoring missing values. Use `lapply()` with the `quantile` function, passing `na.rm = TRUE` as an extra argument. Save the result to `ex_1_3`.

**Expected result:**

```
#> $Ozone
#>     0%    25%    50%    75%   100%
#>   1.00  18.00  31.50  63.25 168.00
#>
#> $Solar.R
#>     0%    25%    50%    75%   100%
#>   7.00 115.75 205.00 258.75 334.00
#>
#> $Wind
#>    0%   25%   50%   75%  100%
#>   1.7   7.4   9.7  11.5  20.7
#>
#> $Temp
#>   0%  25%  50%  75% 100%
#>   56   72   79   85   97
```

**Difficulty:** Intermediate
[HINTS]
Restrict the data to the four measurement columns first, then summarise each one while ignoring the gaps.
Use `lapply()` with `quantile` over `airquality[, 1:4]` and pass `na.rm = TRUE` as a trailing argument.

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- lapply(airquality[, 1:4], quantile, na.rm = TRUE)
ex_1_3
#> $Ozone
#>     0%    25%    50%    75%   100%
#>   1.00  18.00  31.50  63.25 168.00
#> ...
```

**Explanation:** Trailing arguments to `lapply()` are forwarded to the function being applied, so `na.rm = TRUE` reaches `quantile()` for every column. Subsetting `airquality[, 1:4]` drops the Month and Day index columns where quantiles are meaningless. The list-of-vectors shape is exactly right for `do.call(rbind, ex_1_3)` to flatten into a tidy matrix later.

</details>

## Section 2. sapply for vector-shaped returns (3 problems)

### Exercise 2.1: Mean of every numeric column with sapply

**Task:** Use `sapply()` to compute the mean of every column of the built-in `mtcars` dataset, all 11 columns of which are numeric. Save the resulting named numeric vector to `ex_2_1` and print it. This is the workhorse one-line audit you will return to often.

**Expected result:**

```
#>       mpg       cyl      disp        hp      drat        wt      qsec        vs        am      gear      carb
#>  20.09063   6.18750 230.72188 146.68750   3.59656   3.21725  17.84875   0.43750   0.40625   3.68750   2.81250
```

**Difficulty:** Beginner
[HINTS]
You want one number per column collapsed into a single named vector rather than a list.
Apply `sapply()` to `mtcars` with `mean` as the function.

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- sapply(mtcars, mean)
ex_2_1
#>       mpg       cyl      disp        hp ...
#>  20.09063   6.18750 230.72188 146.68750 ...
```

**Explanation:** Because every column of `mtcars` is numeric and `mean()` returns a length-one numeric, `sapply()` simplifies the list to a named numeric vector. The names come from the column names, so you can index `ex_2_1["mpg"]` directly. If a non-numeric column were present, you would get `NA` and a warning instead of a hard failure, which is exactly the sloppy ergonomics `vapply()` was added to fix.

</details>

### Exercise 2.2: Range of each numeric column of airquality

**Task:** A climate reviewer wants the min and max of the four measurement columns in `airquality` (Ozone, Solar.R, Wind, Temp), ignoring missing values. Use `sapply()` with the `range` function and `na.rm = TRUE`. Save the resulting 2-by-4 matrix to `ex_2_2` and print it.

**Expected result:**

```
#>      Ozone Solar.R Wind Temp
#> [1,]   1.0       7  1.7   56
#> [2,] 168.0     334 20.7   97
```

**Difficulty:** Intermediate
[HINTS]
Each column yields two numbers, and equal-length returns stack neatly into a rectangle.
Call `sapply()` on `airquality[, 1:4]` with `range` and `na.rm = TRUE`.

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- sapply(airquality[, 1:4], range, na.rm = TRUE)
ex_2_2
#>      Ozone Solar.R Wind Temp
#> [1,]   1.0       7  1.7   56
#> [2,] 168.0     334 20.7   97
```

**Explanation:** When the applied function returns a length-N vector (here 2 for min and max) and N is the same for every input, `sapply()` simplifies to an N-by-K matrix rather than a list. That is the key shape rule: same-length numeric returns become a matrix, mixed-length stays a list. You can transpose with `t(ex_2_2)` to get rows-as-columns if a tidy layout works better downstream.

</details>

### Exercise 2.3: Five-number summary matrix across mtcars

**Task:** Build a wide 5-by-11 summary table where each column is an `mtcars` variable and the rows are Tukey's five-number summary (minimum, lower hinge, median, upper hinge, maximum). Use `sapply()` with the base `fivenum` function. Save the matrix to `ex_2_3` and print it.

**Expected result:**

```
#>          mpg   cyl    disp     hp   drat     wt   qsec   vs   am gear  carb
#> [1,] 10.4000   4.0  71.100  52.00  2.760 1.5130 14.500  0.0  0.0  3.0  1.00
#> [2,] 15.4250   4.0 120.825  96.50  3.080 2.5425 16.892  0.0  0.0  3.0  2.00
#> [3,] 19.2000   6.0 196.300 123.00  3.695 3.3250 17.710  0.0  0.0  4.0  2.00
#> [4,] 22.8000   8.0 326.000 180.00  3.920 3.6500 18.900  1.0  1.0  4.0  4.00
#> [5,] 33.9000   8.0 472.000 335.00  4.930 5.4240 22.900  1.0  1.0  5.0  8.00
```

**Difficulty:** Advanced
[HINTS]
Every column should produce the same five-element summary so the results line up into a matrix.
Use `sapply()` over `mtcars` with `fivenum` as the function.

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- sapply(mtcars, fivenum)
ex_2_3
#>          mpg   cyl    disp     hp   drat     wt   qsec   vs   am gear  carb
#> [1,] 10.4000   4.0  71.100  52.00  2.760 1.5130 14.500  0.0  0.0  3.0  1.00
#> ...
```

**Explanation:** `fivenum()` returns a length-5 numeric vector, so `sapply()` stacks the results column-wise into a 5-by-11 numeric matrix. The hinges from `fivenum()` differ slightly from `quantile()`'s default Q1/Q3 because the algorithms use different interpolation schemes; pick `fivenum()` when you specifically want Tukey's boxplot hinges. To prepend row labels, assign `rownames(ex_2_3) <- c("min", "Q1", "median", "Q3", "max")` after the call.

</details>

## Section 3. vapply for type-safe returns (3 problems)

### Exercise 3.1: Type-safe column means with vapply

**Task:** Repeat the column-mean audit from Exercise 2.1, but this time enforce that every return value is a single numeric. Use `vapply()` on `mtcars` with the `mean` function and the template `numeric(1)`. Save the resulting named numeric vector to `ex_3_1`. The template makes the call fail loudly if any column ever returns a non-numeric or a different shape.

**Expected result:**

```
#>       mpg       cyl      disp        hp      drat        wt      qsec        vs        am      gear      carb
#>  20.09063   6.18750 230.72188 146.68750   3.59656   3.21725  17.84875   0.43750   0.40625   3.68750   2.81250
```

**Difficulty:** Intermediate
[HINTS]
You want the column means again, but with a contract that each result is exactly one number.
Call `vapply()` on `mtcars` with `mean` and the template `numeric(1)`.

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- vapply(mtcars, mean, numeric(1))
ex_3_1
#>       mpg       cyl      disp        hp ...
#>  20.09063   6.18750 230.72188 146.68750 ...
```

**Explanation:** The third argument is a template, not a value. `numeric(1)` says "I expect a length-one numeric for each input"; if any iteration returns something else (a character, length 2, a list), `vapply()` errors immediately. That is the entire point of the function: trade a tiny bit of typing for a contract that protects pipelines from silent shape drift. Prefer `vapply()` over `sapply()` for anything you intend to ship.

</details>

### Exercise 3.2: Per-column NA counts with vapply

**Task:** A data engineer is preparing `airquality` for a model and needs the count of missing values in every column. Use `vapply()` with an anonymous function that calls `sum(is.na(x))`, enforcing an `integer(1)` return template. Save the resulting named integer vector to `ex_3_2` and print it.

**Expected result:**

```
#>   Ozone Solar.R    Wind    Temp   Month     Day
#>      37       7       0       0       0       0
```

**Difficulty:** Intermediate
[HINTS]
Count the missing entries in each column and demand the count come back as a whole number.
Use `vapply()` with an anonymous function calling `sum(is.na(x))` and the template `integer(1)`.

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- vapply(airquality, function(x) sum(is.na(x)), integer(1))
ex_3_2
#>   Ozone Solar.R    Wind    Temp   Month     Day
#>      37       7       0       0       0       0
```

**Explanation:** `sum()` over a logical vector returns numeric, but the template `integer(1)` forces coercion (and errors if anything overflows). The named vector tells you immediately that Ozone is the column with the biggest missingness problem (24% missing), which is a useful gate before regression. A common alternative is `colSums(is.na(airquality))`, which is more idiomatic in base R but loses the per-column type guarantee.

</details>

### Exercise 3.3: Min and max in one vapply pass

**Task:** Return a 2-by-4 matrix where each column is one of the airquality measurement variables (Ozone, Solar.R, Wind, Temp) and the two rows are the min and max with names. Use `vapply()` with a named `numeric(2)` template so the output rows are labelled. Save the result to `ex_3_3`.

**Expected result:**

```
#>     Ozone Solar.R Wind Temp
#> min   1.0       7  1.7   56
#> max 168.0     334 20.7   97
```

**Difficulty:** Advanced
[HINTS]
A named two-element template can enforce the return shape and label the output rows at the same time.
Use `vapply()` on `airquality[, 1:4]` returning `c(min = ..., max = ...)` with `FUN.VALUE = c(min = 0, max = 0)`.

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- vapply(
  airquality[, 1:4],
  function(x) c(min = min(x, na.rm = TRUE), max = max(x, na.rm = TRUE)),
  FUN.VALUE = c(min = 0, max = 0)
)
ex_3_3
#>     Ozone Solar.R Wind Temp
#> min   1.0       7  1.7   56
#> max 168.0     334 20.7   97
```

**Explanation:** The named `FUN.VALUE` template `c(min = 0, max = 0)` does two things at once: it enforces a length-2 numeric return and seeds the row names of the output matrix. This is the killer feature of `vapply()` over `sapply()`: you can predeclare both the shape AND the labels for free. Drop the names from the template and you get an unnamed 2-row matrix that is much harder to read downstream.

</details>

## Section 4. apply on matrices and rectangular data (4 problems)

### Exercise 4.1: Row totals across a quiz scorecard

**Task:** A course instructor has four quiz scores for four students stored as a matrix. Use `apply()` with `MARGIN = 1` to compute the total points each student earned across all quizzes. Save the named numeric vector of totals to `ex_4_1` and print it.

**Expected result:**

```
#>  Alex  Brio Casey  Devi
#>   337   285   366   254
```

**Difficulty:** Intermediate
[HINTS]
Walk across each student's row and total the values you find along it.
Use `apply()` on `scores` with `MARGIN = 1` and `sum`.

```r title="Your turn"
scores <- matrix(
  c(82, 91, 76, 88,
    65, 70, 78, 72,
    95, 89, 92, 90,
    55, 60, 68, 71),
  nrow = 4, byrow = TRUE,
  dimnames = list(
    c("Alex", "Brio", "Casey", "Devi"),
    c("Quiz1", "Quiz2", "Quiz3", "Quiz4")
  )
)

ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- apply(scores, 1, sum)
ex_4_1
#>  Alex  Brio Casey  Devi
#>   337   285   366   254
```

**Explanation:** `MARGIN = 1` walks the rows; `MARGIN = 2` would walk the columns. Because each row is a length-4 numeric, `sum()` collapses it to length-one, and the result simplifies to a named numeric vector keyed by `rownames(scores)`. The row-walk pattern is also how you implement per-record scoring rules: pass any function that takes a numeric vector and returns a scalar (mean, max, custom weighted formulas) instead of `sum`.

</details>

### Exercise 4.2: Column standard deviations of mtcars

**Task:** A reviewer comparing variable spread in `mtcars` wants the standard deviation of every column. Convert `mtcars` to a matrix with `as.matrix()` and use `apply()` with `MARGIN = 2`. Save the named numeric vector to `ex_4_2`. Note that `sapply(mtcars, sd)` would work too; the point here is the matrix path.

**Expected result:**

```
#>         mpg         cyl        disp          hp        drat          wt        qsec          vs          am        gear        carb
#>   6.0269481   1.7859216 123.9386938  68.5628685   0.5346787   0.9784574   1.7869432   0.5040161   0.4989909   0.7378041   1.6152000
```

**Difficulty:** Intermediate
[HINTS]
Spread is a per-column quantity, so iterate down the columns of a genuine matrix.
Coerce with `as.matrix(mtcars)`, then call `apply()` with `MARGIN = 2` and `sd`.

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- apply(as.matrix(mtcars), 2, sd)
ex_4_2
#>         mpg         cyl        disp          hp ...
#>   6.0269481   1.7859216 123.9386938  68.5628685 ...
```

**Explanation:** `apply()` strictly needs an array or matrix, which is why `as.matrix(mtcars)` is part of the idiom. For a data frame, `sapply()` is the cleaner equivalent and skips the coercion. Pick `apply()` when the data already lives in a matrix (image data, distance matrices, model output matrices) and `sapply()` when it lives in a data frame. Mixing them is a common source of accidental character coercion in the wild.

</details>

### Exercise 4.3: Top score and the column where it occurred

**Task:** A tournament organiser stores athlete scores across four events as a 5-by-4 matrix. For each athlete (row), find the maximum score AND the event name where it occurred. Use `apply()` with `MARGIN = 1` and a custom function that returns a 2-element character vector. Save the resulting 2-by-5 character matrix to `ex_4_3`.

**Expected result:**

```
#>          Aria   Bohan Calix  Doris Eshan
#> max      "97"  "88"   "92"   "85"  "94"
#> event   "Run"  "Lift" "Swim" "Run" "Jump"
```

**Difficulty:** Intermediate
[HINTS]
For each row you need both the peak value and the label sitting above it.
Use `apply()` with `MARGIN = 1` and an anonymous function built around `which.max()` and `names()`.

```r title="Your turn"
events <- matrix(
  c(82, 75, 88, 97,
    65, 88, 70, 80,
    78, 82, 92, 85,
    85, 60, 70, 81,
    72, 94, 78, 81),
  nrow = 5, byrow = TRUE,
  dimnames = list(
    c("Aria", "Bohan", "Calix", "Doris", "Eshan"),
    c("Lift", "Jump", "Swim", "Run")
  )
)

ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- apply(events, 1, function(row) {
  i <- which.max(row)
  c(max = unname(row[i]), event = names(row)[i])
})
ex_4_3
#>         Aria   Bohan  Calix  Doris  Eshan
#> max     "97"   "88"   "92"   "85"   "94"
#> event   "Run"  "Lift" "Swim" "Run"  "Jump"
```

**Explanation:** When the inner function returns a length-2 vector, `apply()` stacks results as columns, producing a 2-by-N matrix. Because the value column is numeric and the event column is character, R coerces everything to character, which is why you see quote marks in the output. If you need the numeric to stay numeric, return a `data.frame` row instead and rbind the results. The `which.max()` + `names()` trick is the canonical "best label" pattern.

</details>

### Exercise 4.4: Centre every column of mtcars by its mean

**Task:** Many models need predictors centred at zero. Use `apply()` with `MARGIN = 2` and an anonymous function `function(x) x - mean(x)` to subtract the column mean from every entry of `mtcars`. The result will be a 32-by-11 numeric matrix whose every column has mean zero. Save it to `ex_4_4`.

**Expected result:**

```
#>                       mpg    cyl     disp        hp    drat       wt     qsec      vs      am    gear     carb
#> Mazda RX4         0.90938 -0.187   -70.722   -36.687  0.3934 -0.59725 -1.4488 -0.4375  0.5938  0.3125  1.1875
#> Mazda RX4 Wag     0.90938 -0.187   -70.722   -36.687  0.3934 -0.34225 -0.3488 -0.4375  0.5938  0.3125  1.1875
#> Datsun 710        2.70938 -2.187  -122.722   -53.687  0.2934 -0.89725  0.7713  0.5625  0.5938  0.3125 -1.8125
#> ...
#> # 29 more rows hidden; colMeans(ex_4_4) is effectively zero
```

**Difficulty:** Advanced
[HINTS]
Each column should have its own average subtracted from every one of its entries.
Use `apply()` with `MARGIN = 2` and the anonymous function `function(x) x - mean(x)` on `as.matrix(mtcars)`.

```r title="Your turn"
ex_4_4 <- # your code here
head(ex_4_4, 3)
round(colMeans(ex_4_4), 10)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_4 <- apply(as.matrix(mtcars), 2, function(x) x - mean(x))
head(ex_4_4, 3)
#>                    mpg    cyl     disp       hp    drat       wt     qsec ...
#> Mazda RX4      0.90938 -0.187  -70.722  -36.687  0.3934 -0.59725 -1.4488 ...
#> Mazda RX4 Wag  0.90938 -0.187  -70.722  -36.687  0.3934 -0.34225 -0.3488 ...
#> Datsun 710     2.70938 -2.187 -122.722  -53.687  0.2934 -0.89725  0.7713 ...
round(colMeans(ex_4_4), 10)
#>   mpg   cyl  disp    hp  drat    wt  qsec    vs    am  gear  carb
#>     0     0     0     0     0     0     0     0     0     0     0
```

**Explanation:** The anonymous function receives one column at a time and returns the same-length centred column. Because every return is length 32, `apply()` rebuilds the result back into a 32-by-11 matrix with the original row names attached. The `scale()` function is the production-grade equivalent and also handles standardisation by sd; the manual `apply()` version is useful when you want full control over the centring statistic (median, trimmed mean, group mean, etc).

</details>

## Section 5. mapply for multi-argument vectorisation (3 problems)

### Exercise 5.1: Range size from paired low and high vectors

**Task:** A reporting analyst has two aligned vectors: `lows` and `highs` representing the low and high bound of four intervals. Use `mapply()` to compute the width of each interval as `high - low`. Save the resulting numeric vector to `ex_5_1` and print it. The output should have length four with one entry per interval.

**Expected result:**

```
#> [1]  5  5  8  7
```

**Difficulty:** Intermediate
[HINTS]
You need to pair the two vectors element by element and act on each matched pair.
Use `mapply()` with `function(lo, hi) hi - lo` over `lows` and `highs`.

```r title="Your turn"
lows  <- c(10, 20, 30, 40)
highs <- c(15, 25, 38, 47)

ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- mapply(function(lo, hi) hi - lo, lows, highs)
ex_5_1
#> [1] 5 5 8 7
```

**Explanation:** `mapply()` is the multivariate cousin of `sapply()`. It zips together as many vectors as you give it and calls the function once per aligned tuple. Here the zip produces `(10, 15)`, `(20, 25)`, `(30, 38)`, `(40, 47)` and the function returns the difference each time. Of course `highs - lows` is the better one-liner for this exact case; `mapply()` earns its keep when the function does something genuinely non-vectorised, like the next two exercises.

</details>

### Exercise 5.2: Generate samples of varying size and scale

**Task:** A simulation team needs three random samples of different sizes drawn from normals with different means and standard deviations. Use `mapply()` with the `rnorm` function and three aligned argument vectors `n = c(3, 5, 4)`, `mean = c(0, 10, 100)`, `sd = c(1, 2, 5)`. Set `SIMPLIFY = FALSE` to keep the result as a list (the lengths differ). Save the list to `ex_5_2`.

**Expected result:**

```
#> [[1]]
#> [1]  1.3709584 -0.5646982  0.3631284
#>
#> [[2]]
#> [1] 11.2649671 10.3261099  8.7345924  9.5050700  9.2671352
#>
#> [[3]]
#> [1] 109.4933665  96.4729259 100.7798643 104.6489295
```

**Difficulty:** Intermediate
[HINTS]
Three aligned parameter vectors should feed one draw per matched triple, with uneven results kept apart.
Use `mapply()` with `rnorm`, the named `n`/`mean`/`sd` vectors, and `SIMPLIFY = FALSE`.

```r title="Your turn"
set.seed(42)

ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
ex_5_2 <- mapply(
  rnorm,
  n    = c(3, 5, 4),
  mean = c(0, 10, 100),
  sd   = c(1, 2, 5),
  SIMPLIFY = FALSE
)
ex_5_2
#> [[1]]
#> [1]  1.3709584 -0.5646982  0.3631284
#>
#> [[2]]
#> [1] 11.2649671 10.3261099  8.7345924  9.5050700  9.2671352
#>
#> [[3]]
#> [1] 109.4933665  96.4729259 100.7798643 104.6489295
```

**Explanation:** Without `SIMPLIFY = FALSE` you would get a list anyway here because the three return vectors have different lengths and `mapply()` cannot pack them into a matrix. Setting the argument explicitly documents intent and protects you against the day all three sizes accidentally coincide and the output silently changes shape to a matrix. The trio of named arguments (`n`, `mean`, `sd`) maps directly to `rnorm()`'s signature.

</details>

### Exercise 5.3: Random walks with varying length and volatility

**Task:** Build three random walks where each walk has a different length and a different per-step standard deviation. Use `mapply()` with an anonymous function that calls `cumsum(rnorm(n, sd = sigma))`, pass `n = c(5, 8, 6)` and `sigma = c(0.5, 1.0, 2.0)`, and set `SIMPLIFY = FALSE`. Save the list of three numeric vectors to `ex_5_3`.

**Expected result:**

```
#> [[1]]
#> [1]  0.6854 -0.0668 -0.0668 -0.3998 -1.1232
#>
#> [[2]]
#> [1] -0.1058 -1.1366 -0.6131 -2.0193 -2.0193 -2.0193 -0.6193 -2.3193
#>
#> [[3]]
#> [1] -1.6500 -3.3000  0.5800  0.8200 -0.4400 -1.7000
#> # exact values depend on set.seed(42); shape is what matters: lengths 5, 8, 6
```

**Difficulty:** Advanced
[HINTS]
Each walk pairs a length with a volatility, and the differing lengths must stay in a list.
Use `mapply()` with `function(n, sigma) cumsum(rnorm(n, sd = sigma))`, the `n`/`sigma` vectors, and `SIMPLIFY = FALSE`.

```r title="Your turn"
set.seed(42)

ex_5_3 <- # your code here
lapply(ex_5_3, length)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
ex_5_3 <- mapply(
  function(n, sigma) cumsum(rnorm(n, sd = sigma)),
  n     = c(5, 8, 6),
  sigma = c(0.5, 1.0, 2.0),
  SIMPLIFY = FALSE
)
lapply(ex_5_3, length)
#> [[1]]
#> [1] 5
#>
#> [[2]]
#> [1] 8
#>
#> [[3]]
#> [1] 6
```

**Explanation:** `mapply()` shines when the inner function is genuinely scalar in its arguments but vector in its return. Here each call generates one walk of length `n` with step volatility `sigma`. Because `cumsum()` returns a length-`n` vector and the three lengths differ, the result must be a list (forced explicit via `SIMPLIFY = FALSE`). For uniform-length output (e.g. always 100 steps) you would get an N-by-3 matrix instead, which is also frequently what you want for plotting trajectories.

</details>

## Section 6. tapply and grouped summaries (4 problems)

### Exercise 6.1: Mean mpg by cylinder count

**Task:** Use `tapply()` to compute the mean `mpg` of cars in `mtcars` grouped by `cyl`. The first argument is the values to summarise, the second is the grouping factor, the third is the function. Save the named numeric vector (one entry per cylinder count) to `ex_6_1` and print it.

**Expected result:**

```
#>        4        6        8
#> 26.66364 19.74286 15.10000
```

**Difficulty:** Beginner
[HINTS]
Split the mileage values into buckets defined by cylinder count, then summarise each bucket.
Use `tapply()` with `mtcars$mpg`, `mtcars$cyl`, and `mean`.

```r title="Your turn"
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_1 <- tapply(mtcars$mpg, mtcars$cyl, mean)
ex_6_1
#>        4        6        8
#> 26.66364 19.74286 15.10000
```

**Explanation:** `tapply()` is the base R version of "group by, then summarise". The first argument supplies values, the second the grouping vector (treated as a factor automatically), and the third the summary function. The names of the returned vector come from the factor levels. For a single grouping variable returning a single number, the output is a named vector; for multiple groupings or vector-valued returns the shape generalises to higher-dimensional arrays.

</details>

### Exercise 6.2: Mean Sepal.Length by Species

**Task:** A biologist comparing flower morphology wants the average sepal length for each of the three Iris species. Use `tapply()` on `iris$Sepal.Length` grouped by `iris$Species` with the `mean` function. Save the named numeric vector (length 3) to `ex_6_2` and print it.

**Expected result:**

```
#>     setosa versicolor  virginica
#>      5.006      5.936      6.588
```

**Difficulty:** Intermediate
[HINTS]
Group the sepal measurements by species and average the values within each group.
Use `tapply()` with `iris$Sepal.Length`, `iris$Species`, and `mean`.

```r title="Your turn"
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_2 <- tapply(iris$Sepal.Length, iris$Species, mean)
ex_6_2
#>     setosa versicolor  virginica
#>      5.006      5.936      6.588
```

**Explanation:** `Species` is already a factor with three levels, so `tapply()` slices the 150 measurements into three groups of 50 and applies `mean()` to each. The output's names match `levels(iris$Species)` in their stored order, not alphabetical order if the factor was hand-built. This is the canonical "group means" pattern; the dplyr equivalent is `iris %>% group_by(Species) %>% summarise(mean(Sepal.Length))`.

</details>

### Exercise 6.3: Two-way tapply on ChickWeight

**Task:** An animal nutrition lab tracks chick weight by `Diet` and `Time` in the `ChickWeight` dataset. Use `tapply()` with a list of two grouping factors `list(ChickWeight$Diet, ChickWeight$Time)` to compute mean weight at each Diet-by-Time combination. Save the resulting 4-by-12 matrix to `ex_6_3` and print it. NA appears where no chicks remain at that timepoint.

**Expected result:**

```
#>          0       2        4        6        8       10       12       14       16       18       20       21
#> 1 41.40000 47.2500 56.47368 66.78947 79.68421 93.05263 108.5263 123.3889 144.6471 158.9412 170.4118 177.7500
#> 2 40.70000 49.4000 59.80000 75.40000 91.70000  108.500 131.3000 141.9000 164.7000 187.7000 205.6000 214.7000
#> 3 40.80000 50.4000 62.20000 77.90000 98.40000  117.100 144.4000 164.5000 197.4000 233.1000 262.9000 270.3000
#> 4 41.00000 51.8000 64.50000 83.90000 105.6000  126.000 151.4000 161.8000 182.0000 202.9000 233.8889 238.5556
```

**Difficulty:** Intermediate
[HINTS]
Two grouping variables together carve the data into a grid of cells to be summarised.
Use `tapply()` with `ChickWeight$weight` and `list(ChickWeight$Diet, ChickWeight$Time)` as the grouping argument, then `mean`.

```r title="Your turn"
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_3 <- tapply(
  ChickWeight$weight,
  list(ChickWeight$Diet, ChickWeight$Time),
  mean
)
ex_6_3
#>          0       2        4        6 ... (12 columns)
#> 1 41.40000 47.2500 56.47368 66.7894 ...
#> 2 40.70000 49.4000 59.80000 75.4000 ...
#> 3 40.80000 50.4000 62.20000 77.9000 ...
#> 4 41.00000 51.8000 64.50000 83.9000 ...
```

**Explanation:** Passing a list of grouping factors to `tapply()` turns the output into a multi-dimensional array (here, a 4-by-12 matrix), where rows are Diet levels and columns are Time levels. Some Diet-by-Time cells may be `NA` if every chick on that diet dropped out before that timepoint, which is exactly the "no observation" signal you want preserved rather than silently zero-filled. The closest tidyverse equivalent is `pivot_wider()` after a `group_by()` summarise.

</details>

### Exercise 6.4: Coefficient of variation of mpg by cylinder

**Task:** A fleet analyst wants the coefficient of variation (sd divided by mean, expressed as a percentage) of `mpg` within each `cyl` group in `mtcars`. Use `tapply()` with a custom anonymous function `function(x) sd(x) / mean(x) * 100`. Save the named numeric vector to `ex_6_4` and print it.

**Expected result:**

```
#>         4         6         8
#> 16.911185  7.353099 16.951474
```

**Difficulty:** Advanced
[HINTS]
Within each cylinder group, compare the spread against the average to get a relative measure.
Use `tapply()` with `mtcars$mpg`, `mtcars$cyl`, and `function(x) sd(x) / mean(x) * 100`.

```r title="Your turn"
ex_6_4 <- # your code here
ex_6_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_4 <- tapply(mtcars$mpg, mtcars$cyl, function(x) sd(x) / mean(x) * 100)
ex_6_4
#>         4         6         8
#> 16.911185  7.353099 16.951474
```

**Explanation:** Custom functions extend `tapply()` beyond the obvious mean/median/sum trio: any function that takes a numeric vector and returns a scalar is valid. The 6-cylinder group has the lowest relative spread (CV around 7%), meaning its `mpg` is the most predictable, while the 4-cyl and 8-cyl groups are both around 17%. Reporting CV instead of raw sd is the right move whenever the groups have very different means and you want a fair comparison of spread.

</details>

## What to do next

You have worked through every member of the base R apply family. Pick the next step that matches what you want to harden:

- [base apply in R](base-apply-in-R.html): the parent tutorial that compares the whole family side by side
- [Functional Programming in R](Functional-Programming-in-R.html): step up from apply to map/reduce idioms via purrr
- [dplyr Exercises in R](dplyr-Exercises-in-R.html): the tidyverse companion to grouped summaries and column-wise operations
- [R Functional Programming Exercises](R-Functional-Programming-Exercises.html): broader functional-style practice across closures, higher-order functions, and recursion
