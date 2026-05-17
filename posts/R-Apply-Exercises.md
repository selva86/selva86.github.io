---
title: "R apply Exercises: 20 Practice Problems on apply, sapply, lapply"
slug: "R-Apply-Exercises"
description: "Practice the R apply family with 20 scenario-driven problems on apply, lapply, sapply, vapply, mapply, and tapply. Starter code, hidden solutions, and explanations."
keywords: "R apply exercises, lapply exercises, sapply exercises, R apply family practice problems, tapply exercises, vapply exercises, mapply exercises, R apply practice, apply function R exercises"
mathjax: false
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "R apply Exercises"
sidebar_order: 146
fr_parent: "R-Functions.html"
auto_link_terms: "R apply exercises|apply family practice|lapply exercises|sapply exercises|tapply exercises|vapply exercises"
auto_link_case_sensitive: false
target_keyword: "R apply exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# R apply Exercises: 20 Practice Problems on apply, sapply, lapply

<p class="lead">Twenty scenario-driven practice problems on the base R apply family: apply, lapply, sapply, vapply, mapply, and tapply. The mix leans intermediate, with a few advanced multi-step problems that mirror real reporting and data-cleaning work. Solutions are hidden behind reveal toggles, so try first.</p>

```r title="Run this once before any exercise"
library(datasets)
set.seed(42)
```

## Section 1. lapply for predictable list output (3 problems)

### Exercise 1.1: Per-column mean of airquality as a list

**Task:** A reporting analyst building a daily air-quality dashboard wants the mean of every numeric column of `airquality` (Ozone, Solar.R, Wind, Temp, Month, Day) returned as a named list, because downstream JSON serializers expect list-shaped output. Use `lapply()` with `mean()` and `na.rm = TRUE` (since Ozone and Solar.R have NAs). Save the result to `ex_1_1`.

**Expected result:**

```
#> $Ozone
#> [1] 42.12931
#>
#> $Solar.R
#> [1] 185.9315
#>
#> $Wind
#> [1] 9.957516
#>
#> $Temp
#> [1] 77.88235
#>
#> $Month
#> [1] 6.993464
#>
#> $Day
#> [1] 15.80392
```

**Difficulty:** Beginner

[HINTS]
A data frame is already a collection of columns; you want one summary number per column, kept in a named, list-shaped container.
Reach for `lapply()` over `airquality`, passing `mean` and `na.rm = TRUE` as extra arguments.

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- lapply(airquality, mean, na.rm = TRUE)
ex_1_1
#> $Ozone
#> [1] 42.12931
#>
#> $Solar.R
#> [1] 185.9315
#>
#> $Wind
#> [1] 9.957516
#>
#> $Temp
#> [1] 77.88235
#>
#> $Month
#> [1] 6.993464
#>
#> $Day
#> [1] 15.80392
```

**Explanation:** A data frame is internally a list of columns, so `lapply()` walks each column and applies `mean()`. The `na.rm = TRUE` argument is passed through as the third positional argument to `mean()` for every column. `lapply()` always returns a list, which is exactly what a JSON encoder like `jsonlite::toJSON()` wants. If you used `sapply()` instead you would get a numeric vector, which can confuse downstream tooling that expects key-value objects.

</details>

### Exercise 1.2: Fit one linear model per cylinder group of mtcars

**Task:** A motoring magazine columnist wants to see how strongly `wt` predicts `mpg` separately for 4-, 6-, and 8-cylinder cars. Split `mtcars` by `cyl` and use `lapply()` to fit `lm(mpg ~ wt)` to each group. Save the resulting list of three fitted models to `ex_1_2`.

**Expected result:**

```
#> $`4`
#>
#> Call:
#> lm(formula = mpg ~ wt, data = ...)
#>
#> Coefficients:
#> (Intercept)           wt
#>      39.571       -5.647
#>
#> $`6`
#>
#> Call:
#> lm(formula = mpg ~ wt, data = ...)
#>
#> Coefficients:
#> (Intercept)           wt
#>      28.41        -2.78
#>
#> $`8`
#>
#> Call:
#> lm(formula = mpg ~ wt, data = ...)
#>
#> Coefficients:
#> (Intercept)           wt
#>      23.868       -2.192
```

**Difficulty:** Intermediate

[HINTS]
First break the data into one group per cylinder count, then run the same model on each piece.
Use `split()` on `mtcars$cyl`, then `lapply()` with an anonymous function calling `lm(mpg ~ wt, data = ...)`.

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- lapply(split(mtcars, mtcars$cyl), function(df) lm(mpg ~ wt, data = df))
ex_1_2
#> $`4`
#>
#> Call:
#> lm(formula = mpg ~ wt, data = df)
#>
#> Coefficients:
#> (Intercept)           wt
#>      39.571       -5.647
#> ...
```

**Explanation:** `split()` returns a named list of data frames keyed by the factor levels of `cyl`, which is the perfect input for `lapply()`. The anonymous function lets you parameterize over `data` without writing a separate helper. The list output is convenient because you can later do `lapply(ex_1_2, coef)` or `lapply(ex_1_2, summary)` to dig deeper. A common mistake is passing `mtcars` to `lapply()` directly, which iterates over columns, not groups.

</details>

### Exercise 1.3: Per-element conversion of a mixed list to characters

**Task:** A data engineer ingesting a config blob needs every element of a heterogeneous list converted to its character representation so the whole structure can be written to a key-value store. Given the list `cfg <- list(host = "db01", port = 5432L, timeout = 30.5, ssl = TRUE)`, use `lapply()` with `as.character()` to coerce every element. Save the result as `ex_1_3`.

**Expected result:**

```
#> $host
#> [1] "db01"
#>
#> $port
#> [1] "5432"
#>
#> $timeout
#> [1] "30.5"
#>
#> $ssl
#> [1] "TRUE"
```

**Difficulty:** Beginner

[HINTS]
You need every value turned into text while keeping the original key for each entry.
Call `lapply()` on `cfg` with `as.character` as the function.

```r title="Your turn"
cfg <- list(host = "db01", port = 5432L, timeout = 30.5, ssl = TRUE)
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
cfg <- list(host = "db01", port = 5432L, timeout = 30.5, ssl = TRUE)
ex_1_3 <- lapply(cfg, as.character)
ex_1_3
#> $host
#> [1] "db01"
#> $port
#> [1] "5432"
#> $timeout
#> [1] "30.5"
#> $ssl
#> [1] "TRUE"
```

**Explanation:** `lapply()` preserves the original list's names, which matters here since each key has a meaning (host, port, etc.). Using `sapply()` would simplify the result into a named character vector of length 4, which loses the list structure that a downstream JSON or YAML writer expects. `as.character()` knows how to coerce integers, doubles, and logicals, so a single call handles all four element types.

</details>

## Section 2. sapply for vector-shaped returns (3 problems)

### Exercise 2.1: NA count per column of airquality

**Task:** A data-quality auditor reviewing the `airquality` dataset before publishing a monthly report needs to know how many missing values each column carries. Use `sapply()` with `function(x) sum(is.na(x))` over `airquality` and save the named integer vector to `ex_2_1`.

**Expected result:**

```
#>   Ozone Solar.R    Wind    Temp   Month     Day
#>      37       7       0       0       0       0
```

**Difficulty:** Beginner

[HINTS]
For each column you want a single count of how many entries are missing, collected into one labelled vector.
Use `sapply()` over `airquality` with `function(x) sum(is.na(x))`.

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- sapply(airquality, function(x) sum(is.na(x)))
ex_2_1
#>   Ozone Solar.R    Wind    Temp   Month     Day
#>      37       7       0       0       0       0
```

**Explanation:** Because every column returns a single integer, `sapply()` simplifies the list of length-1 results into a named integer vector, which is easier to print and easier to index than the lapply list. This is the canonical NA audit pattern. A type-safer variant is `vapply(airquality, function(x) sum(is.na(x)), integer(1))`, which guarantees the result is integer and fails loudly if any column unexpectedly returns something else.

</details>

### Exercise 2.2: Median absolute deviation of every USArrests metric

**Task:** A criminologist comparing the spread of crime rates across US states wants the robust MAD (median absolute deviation) for each numeric column of `USArrests`: Murder, Assault, UrbanPop, Rape. Use `sapply()` with `mad()` and save the named numeric vector to `ex_2_2`.

**Expected result:**

```
#>   Murder  Assault UrbanPop     Rape
#>   5.4115  74.1300  14.8260  9.0440
```

**Difficulty:** Intermediate

[HINTS]
Each column should collapse to one robust spread number, and one-number-per-column simplifies neatly into a plain vector.
Call `sapply()` on `USArrests` with `mad` as the function.

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- sapply(USArrests, mad)
ex_2_2
#>   Murder  Assault UrbanPop     Rape
#>   5.4115  74.1300  14.8260  9.0440
```

**Explanation:** `mad()` returns one number per column, so `sapply()` simplifies to a named numeric vector. MAD is preferred over `sd()` when you suspect outliers; the constant of 1.4826 inside `mad()` makes it consistent with the standard deviation for normal data. If you want both `mad` and `sd` per column you would switch to `sapply(USArrests, function(x) c(mad = mad(x), sd = sd(x)))`, which simplifies to a 2-row matrix.

</details>

### Exercise 2.3: Side-by-side mean and median per ToothGrowth metric

**Task:** A pharmacology team validating tooth-growth measurements wants both the mean and median of `len` and `dose` shown next to each other in a single matrix, so reviewers can spot skew at a glance. Use `sapply()` on `ToothGrowth[, c("len", "dose")]` with a custom function that returns a length-2 named numeric vector. Save the resulting 2-row matrix to `ex_2_3`.

**Expected result:**

```
#>          len  dose
#> mean   18.81 1.166
#> median 19.25 1.000
```

**Difficulty:** Intermediate

[HINTS]
When each column returns two labelled numbers, the results stack side by side into a small table.
Use `sapply()` on `ToothGrowth[, c("len", "dose")]` with a function returning `c(mean = mean(x), median = median(x))`.

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- sapply(
  ToothGrowth[, c("len", "dose")],
  function(x) c(mean = mean(x), median = median(x))
)
round(ex_2_3, 3)
#>          len  dose
#> mean   18.813 1.167
#> median 19.250 1.000
```

**Explanation:** When the function returns a length-N named vector for every column, `sapply()` stacks the results column-wise into an NxK matrix. The row names come from the names of the returned vector, the column names come from the input. This is the cleanest way to build a small summary table in base R without dplyr. If even one column returned a different-length vector, `sapply()` would silently fall back to a list, which is a common source of bugs.

</details>

## Section 3. apply on matrices and data frames (4 problems)

### Exercise 3.1: Row totals from a weekly quiz scorecard

**Task:** A teacher tallying weekly quiz scores has the matrix `scores <- matrix(c(8, 7, 9, 6, 10, 5, 7, 8, 9, 6, 4, 8), nrow = 4, byrow = TRUE, dimnames = list(c("Ann", "Ben", "Cara", "Dev"), c("Q1", "Q2", "Q3")))`. Compute each student's total across the three quizzes using `apply()` with `MARGIN = 1`. Save the named numeric vector to `ex_3_1`.

**Expected result:**

```
#>  Ann  Ben Cara  Dev
#>   24   21   24   18
```

**Difficulty:** Beginner

[HINTS]
You are walking across the rows of the matrix, totalling each student's three quizzes.
Use `apply()` on `scores` with `MARGIN = 1` and `sum`.

```r title="Your turn"
scores <- matrix(
  c(8, 7, 9, 6, 10, 5, 7, 8, 9, 6, 4, 8),
  nrow = 4, byrow = TRUE,
  dimnames = list(c("Ann", "Ben", "Cara", "Dev"), c("Q1", "Q2", "Q3"))
)
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
scores <- matrix(
  c(8, 7, 9, 6, 10, 5, 7, 8, 9, 6, 4, 8),
  nrow = 4, byrow = TRUE,
  dimnames = list(c("Ann", "Ben", "Cara", "Dev"), c("Q1", "Q2", "Q3"))
)
ex_3_1 <- apply(scores, 1, sum)
ex_3_1
#>  Ann  Ben Cara  Dev
#>   24   21   24   18
```

**Explanation:** `MARGIN = 1` walks rows; `MARGIN = 2` walks columns. For pure row or column sums on numeric matrices, `rowSums(scores)` and `colSums(scores)` are faster and clearer, but `apply()` is the general-purpose tool when the per-row function is anything more complex than a sum or mean. Row names are preserved because the matrix has dimnames.

</details>

### Exercise 3.2: Z-score every column of USArrests

**Task:** A criminologist preparing inputs for a clustering model needs every column of `USArrests` standardized to zero mean and unit standard deviation so no single metric dominates the distance calculation. Use `apply()` with `MARGIN = 2` and a function that returns `(x - mean(x)) / sd(x)`. Save the 50x4 numeric matrix to `ex_3_2`.

**Expected result:**

```
#>               Murder    Assault   UrbanPop       Rape
#> Alabama    1.2425641  0.7828393 -0.5209066 -0.0034165
#> Alaska     0.5078625  1.1068225 -1.2117642  2.4842029
#> Arizona    0.0716334  1.4788032  0.9989801  1.0428784
#> Arkansas   0.2323494  0.2308680 -1.0735927 -0.1858593
#> California 0.2783634  1.2628140  1.7589532  2.0678203
#> ...
#> # 45 more rows hidden
```

**Difficulty:** Intermediate

[HINTS]
Each column should be re-centred and rescaled independently so no single metric dominates.
Use `apply()` with `MARGIN = 2` and a function returning `(x - mean(x)) / sd(x)`.

```r title="Your turn"
ex_3_2 <- # your code here
head(ex_3_2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- apply(USArrests, 2, function(x) (x - mean(x)) / sd(x))
head(ex_3_2)
#>               Murder    Assault   UrbanPop       Rape
#> Alabama    1.2425641  0.7828393 -0.5209066 -0.0034165
#> Alaska     0.5078625  1.1068225 -1.2117642  2.4842029
#> Arizona    0.0716334  1.4788032  0.9989801  1.0428784
#> Arkansas   0.2323494  0.2308680 -1.0735927 -0.1858593
#> California 0.2783634  1.2628140  1.7589532  2.0678203
#> Colorado   0.0256194  0.3988637  0.8608086  1.8649672
```

**Explanation:** `apply()` with `MARGIN = 2` returns a matrix when each column-wise call returns a vector of equal length. The base R one-liner `scale(USArrests)` is the canonical way to do this, but the `apply()` form is worth knowing because it generalizes to non-standard scalers (median centering, robust scaling). The output is a matrix, not a data frame; wrap in `as.data.frame()` if you need the latter.

</details>

### Exercise 3.3: Row-wise best subject and its name

**Task:** Continuing the scorecard from Exercise 3.1, the teacher now wants each student's best subject (the column name where they scored highest), not the maximum score itself. Use `apply()` with `MARGIN = 1` and `which.max()` to get the index, then look up the matching column name. Save the named character vector to `ex_3_3`.

**Expected result:**

```
#>  Ann  Ben Cara  Dev
#> "Q3" "Q1" "Q2" "Q1"
```

**Difficulty:** Intermediate

[HINTS]
You need the position of the top score in each row, then translate that position into the matching subject label.
Use `apply()` with `MARGIN = 1` and `which.max`, then index `colnames(scores)` with the result.

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- colnames(scores)[apply(scores, 1, which.max)]
names(ex_3_3) <- rownames(scores)
ex_3_3
#>  Ann  Ben Cara  Dev
#> "Q3" "Q1" "Q2" "Q1"
```

**Explanation:** `which.max()` returns the index of the first maximum per row, then a vectorized lookup against `colnames(scores)` translates those indices into subject names. The `names()<-` assignment restores the student identifiers because indexing dropped them. A common mistake is using `max()` instead of `which.max()`, which gives you the score, not the subject. For ties, `which.max()` returns only the first index, which may or may not be what you want.

</details>

### Exercise 3.4: Flag outlier rows by the 1.5 x IQR rule per column

**Task:** A finance team auditing a daily P&L matrix wants to know which days had an outlier in at least one of the four metrics. Build the data with `pnl <- matrix(c(rnorm(48), 12, -10, 0.5, 0.2), nrow = 13, byrow = FALSE)` and `colnames(pnl) <- c("equities", "fx", "rates", "credit")`. Use `apply()` with `MARGIN = 2` to flag each cell as TRUE if it is more than 1.5 x IQR outside the column quartiles, then take row-wise `any()` to flag the day. Save the logical vector to `ex_3_4`.

**Expected result:**

```
#>  [1] FALSE FALSE FALSE FALSE FALSE FALSE FALSE FALSE FALSE FALSE FALSE FALSE  TRUE
```

**Difficulty:** Advanced

[HINTS]
First mark every cell that sits too far outside its column's middle range, then check whether any cell in a row was marked.
Use `apply()` with `MARGIN = 2` and `quantile(x, c(0.25, 0.75))` to build a logical flag matrix, then `apply()` with `MARGIN = 1` and `any`.

```r title="Your turn"
set.seed(42)
pnl <- matrix(c(rnorm(48), 12, -10, 0.5, 0.2), nrow = 13, byrow = FALSE)
colnames(pnl) <- c("equities", "fx", "rates", "credit")
ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
pnl <- matrix(c(rnorm(48), 12, -10, 0.5, 0.2), nrow = 13, byrow = FALSE)
colnames(pnl) <- c("equities", "fx", "rates", "credit")

flag_matrix <- apply(pnl, 2, function(x) {
  q  <- quantile(x, c(0.25, 0.75))
  iqr <- q[2] - q[1]
  x < q[1] - 1.5 * iqr | x > q[2] + 1.5 * iqr
})

ex_3_4 <- apply(flag_matrix, 1, any)
ex_3_4
#>  [1] FALSE FALSE FALSE FALSE FALSE FALSE FALSE FALSE FALSE FALSE FALSE FALSE  TRUE
```

**Explanation:** A two-stage apply pattern: the inner `apply()` produces a same-shape logical matrix where TRUE marks an outlier cell, and the outer `apply()` collapses each row with `any()`. The row with the planted shock (12, -10) in the last position trips equities and fx, so the day is flagged. The 1.5 x IQR rule is Tukey's classic outlier definition; for noisier financial data analysts often widen it to 3 x IQR.

</details>

## Section 4. vapply for type-safe production code (3 problems)

### Exercise 4.1: NA proportion per column with vapply

**Task:** A pipeline owner running the `airquality` audit nightly needs the NA proportion per column to come back as a guaranteed-numeric vector so the downstream alerting rule can compare against a threshold without a class check. Use `vapply()` with a template `numeric(1)` and save the named numeric vector to `ex_4_1`.

**Expected result:**

```
#>      Ozone    Solar.R       Wind       Temp      Month        Day
#> 0.24183007 0.04575163 0.00000000 0.00000000 0.00000000 0.00000000
```

**Difficulty:** Intermediate

[HINTS]
You want the fraction of missing values per column, guaranteed to come back as plain numbers.
Use `vapply()` over `airquality` with `function(x) mean(is.na(x))` and a `numeric(1)` template.

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- vapply(airquality, function(x) mean(is.na(x)), numeric(1))
ex_4_1
#>      Ozone    Solar.R       Wind       Temp      Month        Day
#> 0.24183007 0.04575163 0.00000000 0.00000000 0.00000000 0.00000000
```

**Explanation:** `mean(is.na(x))` is the cleanest way to compute the NA proportion because `is.na()` returns a logical vector and `mean()` of logicals is the fraction TRUE. The template `numeric(1)` declares the expected return shape: a length-1 double per column. If any column accidentally returned a character or an integer, `vapply()` would error immediately rather than silently changing the result class, which is exactly the guarantee a production pipeline needs.

</details>

### Exercise 4.2: Validate that every mtcars column is numeric

**Task:** A code reviewer wants a one-line sanity check confirming every column of `mtcars` is numeric before passing it into a model that assumes numeric inputs. Use `vapply()` with `is.numeric` and a `logical(1)` template, then wrap the result with `all()` so the final value is a single TRUE or FALSE. Save the single logical to `ex_4_2`.

**Expected result:**

```
#> [1] TRUE
```

**Difficulty:** Intermediate

[HINTS]
Check each column's type, then reduce all those checks to a single yes-or-no answer.
Use `vapply()` with `is.numeric` and a `logical(1)` template, wrapped in `all()`.

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- all(vapply(mtcars, is.numeric, logical(1)))
ex_4_2
#> [1] TRUE
```

**Explanation:** `vapply()` with template `logical(1)` enforces that each column returns a single TRUE or FALSE. `all()` collapses the named logical vector to a single value. If any column were a factor or character, the result would be FALSE and you could chain to a named printout: `names(which(!vapply(mtcars, is.numeric, logical(1))))`. Cleaner than `sapply()` because the type guarantee removes a class assertion step.

</details>

### Exercise 4.3: Column profiler returning min, median, max

**Task:** An EDA helper wants a small 3-row summary matrix showing the min, median, and max for every numeric column of `airquality`, with NAs ignored. Use `vapply()` with a `numeric(3)` template so the result is guaranteed to be a 3xK numeric matrix even when the data has missing values. Save the matrix to `ex_4_3`.

**Expected result:**

```
#>          Ozone Solar.R  Wind Temp Month  Day
#> min       1.0     7.0  1.70   56     5  1.0
#> median   31.5   205.0  9.70   79     7 16.0
#> max     168.0   334.0 20.70   97     9 31.0
```

**Difficulty:** Advanced

[HINTS]
Each column should produce three labelled numbers, and a fixed-length return shape lets them stack into a guaranteed matrix.
Use `vapply()` over `airquality` with a function returning `c(min, median, max)` (each with `na.rm = TRUE`) and a `numeric(3)` template.

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- vapply(
  airquality,
  function(x) c(min = min(x, na.rm = TRUE),
                median = median(x, na.rm = TRUE),
                max = max(x, na.rm = TRUE)),
  numeric(3)
)
ex_4_3
#>         Ozone Solar.R  Wind Temp Month Day
#> min       1.0     7.0  1.70   56     5   1
#> median   31.5   205.0  9.70   79     7  16
#> max     168.0   334.0 20.70   97     9  31
```

**Explanation:** When the template is `numeric(3)`, `vapply()` stacks the per-column 3-vectors into a 3xK matrix, with the names of the template becoming row names. The `na.rm = TRUE` argument keeps the columns with NAs (Ozone, Solar.R) from collapsing to NA. If you changed the template to `numeric(2)` but the function still returned 3 values, `vapply()` would error, which is the whole point: shape correctness is enforced.

</details>

## Section 5. mapply for parallel multi-input iteration (3 problems)

### Exercise 5.1: Element-wise pairwise sums

**Task:** A junior analyst handed two vectors `lows <- c(2, 5, 9, 12, 18)` and `highs <- c(8, 11, 14, 20, 25)` wants the size of each range (high - low + 1, inclusive count). Use `mapply()` over the two vectors with `function(l, h) h - l + 1`. Save the integer vector to `ex_5_1`.

**Expected result:**

```
#> [1] 7 7 6 9 8
```

**Difficulty:** Beginner

[HINTS]
You are stepping through two vectors together, combining the matching pair at each position.
Use `mapply()` with `function(l, h) h - l + 1` over `lows` and `highs`.

```r title="Your turn"
lows  <- c(2, 5, 9, 12, 18)
highs <- c(8, 11, 14, 20, 25)
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
lows  <- c(2, 5, 9, 12, 18)
highs <- c(8, 11, 14, 20, 25)
ex_5_1 <- mapply(function(l, h) h - l + 1, lows, highs)
ex_5_1
#> [1] 7 7 6 9 8
```

**Explanation:** `mapply()` walks the two vectors in parallel: the first call uses `(2, 8)`, the second `(5, 11)`, and so on. For pure arithmetic on equal-length vectors, the operator form `highs - lows + 1` is faster and clearer; the value of `mapply()` shows up when the per-element operation is non-vectorized (a custom function, a non-vectorized sampler, or a function that needs its own scalar arguments).

</details>

### Exercise 5.2: Per-customer randomized samples with varying size and scale

**Task:** A marketing analyst preparing a synthetic test cohort needs one normal sample per customer, but each customer has their own sample size and spend variance. Given `sizes <- c(3, 5, 2)`, `means <- c(50, 100, 200)`, and `sds <- c(5, 20, 30)`, use `mapply()` with `rnorm` to generate a list where the i-th element is `rnorm(sizes[i], means[i], sds[i])`. Use `SIMPLIFY = FALSE` so the output stays a list. Save it to `ex_5_2`.

**Expected result:**

```
#> [[1]]
#> [1] 56.85479 47.17651 51.81564
#>
#> [[2]]
#> [1]  86.34829  87.39561 100.91140 109.78936 100.74220
#>
#> [[3]]
#> [1] 222.5363 230.1543
```

**Difficulty:** Intermediate

[HINTS]
Each customer needs its own draw with its own size and scale, and the varying-length results must stay separate.
Use `mapply()` with `rnorm` over `sizes`, `means`, and `sds`, setting `SIMPLIFY = FALSE`.

```r title="Your turn"
set.seed(42)
sizes <- c(3, 5, 2)
means <- c(50, 100, 200)
sds   <- c(5, 20, 30)
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
sizes <- c(3, 5, 2)
means <- c(50, 100, 200)
sds   <- c(5, 20, 30)
ex_5_2 <- mapply(rnorm, sizes, means, sds, SIMPLIFY = FALSE)
ex_5_2
#> [[1]]
#> [1] 56.85479 47.17651 51.81564
#> [[2]]
#> [1]  86.34829  87.39561 100.91140 109.78936 100.74220
#> [[3]]
#> [1] 222.5363 230.1543
```

**Explanation:** The arguments to `mapply()` after the function are matched positionally to `rnorm(n, mean, sd)`. Because each call returns a different-length vector, `SIMPLIFY = FALSE` is required; otherwise `mapply()` would try to coerce to a matrix and fall back to a list anyway (but inconsistently). For variable-length parallel iteration, `SIMPLIFY = FALSE` makes the intent explicit.

</details>

### Exercise 5.3: Compute compound interest for a portfolio of paired terms and rates

**Task:** A wealth manager modeling client outcomes has three accounts with principals `principal <- c(1000, 2500, 5000)`, annualized rates `rate <- c(0.04, 0.06, 0.05)`, and term lengths `years <- c(5, 10, 7)`. Use `mapply()` to compute `principal * (1 + rate)^years` for each account. Save the named numeric vector to `ex_5_3`, with names taken from `c("A", "B", "C")`.

**Expected result:**

```
#>        A        B        C
#> 1216.653 4477.119 7035.504
```

**Difficulty:** Advanced

[HINTS]
Three aligned inputs feed one formula per account, producing a single number each.
Use `mapply()` with `function(p, r, y) p * (1 + r)^y` over `principal`, `rate`, and `years`, then set `names()`.

```r title="Your turn"
principal <- c(1000, 2500, 5000)
rate      <- c(0.04, 0.06, 0.05)
years     <- c(5, 10, 7)
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
principal <- c(1000, 2500, 5000)
rate      <- c(0.04, 0.06, 0.05)
years     <- c(5, 10, 7)
ex_5_3 <- mapply(function(p, r, y) p * (1 + r)^y, principal, rate, years)
names(ex_5_3) <- c("A", "B", "C")
ex_5_3
#>        A        B        C
#> 1216.653 4477.119 7035.504
```

**Explanation:** `mapply()` zips three input vectors in parallel and applies the per-account compound interest formula. Because the result is a length-1 numeric per call, `mapply()` simplifies the output to a numeric vector by default. The vectorized equivalent `principal * (1 + rate)^years` is faster and just as readable here; `mapply()` becomes essential when the per-account function is more complex (different compounding frequency per account, conditional fee logic, lookup against an external table).

</details>

## Section 6. tapply for grouped aggregation (4 problems)

### Exercise 6.1: Mean weight by Diet in ChickWeight

**Task:** A nutrition researcher comparing four chick diets wants the mean weight across all observations within each diet group from the `ChickWeight` dataset. Use `tapply()` with `ChickWeight$weight` as the value vector and `ChickWeight$Diet` as the grouping factor. Save the resulting named numeric vector to `ex_6_1`.

**Expected result:**

```
#>        1        2        3        4
#> 102.6455 122.6167 142.9500 135.2627
```

**Difficulty:** Beginner

[HINTS]
Split one measurement vector by a grouping label and summarise within each group.
Use `tapply()` with `ChickWeight$weight`, `ChickWeight$Diet`, and `mean`.

```r title="Your turn"
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_1 <- tapply(ChickWeight$weight, ChickWeight$Diet, mean)
ex_6_1
#>        1        2        3        4
#> 102.6455 122.6167 142.9500 135.2627
```

**Explanation:** `tapply()` splits the value vector by the factor, applies `mean()` to each group, and returns a named array. Group order follows the factor levels of Diet (1, 2, 3, 4). For a longer pipeline you would reach for `aggregate()` or dplyr's `summarise()`, but `tapply()` is the most direct base R tool when the output is a single statistic per group.

</details>

### Exercise 6.2: Sepal width quartiles by Species

**Task:** A botanist comparing the spread of `Sepal.Width` across iris species wants the 25th, 50th, and 75th percentile reported separately for setosa, versicolor, and virginica. Use `tapply()` with `iris$Sepal.Width`, `iris$Species`, and `function(x) quantile(x, c(0.25, 0.5, 0.75))`. The result is a list of three length-3 numeric vectors. Save it to `ex_6_2`.

**Expected result:**

```
#> $setosa
#>   25%   50%   75%
#> 3.200 3.400 3.675
#>
#> $versicolor
#>   25%   50%   75%
#> 2.525 2.800 3.000
#>
#> $virginica
#>   25%   50%   75%
#> 2.800 3.000 3.175
```

**Difficulty:** Intermediate

[HINTS]
For each species you want a small set of percentile values, so a per-group multi-number result stays as a list.
Use `tapply()` with `iris$Sepal.Width`, `iris$Species`, and `function(x) quantile(x, c(0.25, 0.5, 0.75))`.

```r title="Your turn"
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_2 <- tapply(
  iris$Sepal.Width,
  iris$Species,
  function(x) quantile(x, c(0.25, 0.5, 0.75))
)
ex_6_2
#> $setosa
#>   25%   50%   75%
#> 3.200 3.400 3.675
#>
#> $versicolor
#>   25%   50%   75%
#> 2.525 2.800 3.000
#>
#> $virginica
#>   25%   50%   75%
#> 2.800 3.000 3.175
```

**Explanation:** When the per-group function returns a vector longer than 1, `tapply()` produces a list with one element per group rather than simplifying to an array. The result is easy to bind into a tidy frame with `do.call(rbind, ex_6_2)` if a 3x3 matrix layout is preferred. This is the base R analogue of `dplyr::group_by(Species) |> summarise(...)` with multi-value summaries.

</details>

### Exercise 6.3: Two-way table of mean breaks by wool and tension in warpbreaks

**Task:** A textile engineer running a 2x3 yarn experiment with the `warpbreaks` dataset wants the mean number of `breaks` for every combination of `wool` (A, B) and `tension` (L, M, H), laid out as a 2x3 matrix. Use `tapply()` with `warpbreaks$breaks` and `list(warpbreaks$wool, warpbreaks$tension)`. Save the matrix to `ex_6_3`.

**Expected result:**

```
#>          L        M        H
#> A 44.55556 24.00000 24.55556
#> B 28.22222 28.77778 18.77778
```

**Difficulty:** Intermediate

[HINTS]
Grouping by two factors at once lays the group means out across a rows-by-columns grid.
Use `tapply()` with `warpbreaks$breaks`, `list(warpbreaks$wool, warpbreaks$tension)`, and `mean`.

```r title="Your turn"
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_3 <- tapply(
  warpbreaks$breaks,
  list(warpbreaks$wool, warpbreaks$tension),
  mean
)
ex_6_3
#>          L        M        H
#> A 44.55556 24.00000 24.55556
#> B 28.22222 28.77778 18.77778
```

**Explanation:** Passing a list of two factors to `tapply()` produces a 2-D array; with three factors you would get a 3-D array. Empty combinations (cells with no observations) would come back as `NA`, which `tapply()` shows verbatim. This is the fastest way to inspect a factorial design's cell means before fitting an ANOVA with `aov(breaks ~ wool * tension, data = warpbreaks)`.

</details>

### Exercise 6.4: Coefficient of variation of mpg by gear count

**Task:** An auto-magazine columnist comparing fuel economy spread across 3-, 4-, and 5-gear cars wants the coefficient of variation (sd divided by mean) of `mpg` for each `gear` group of `mtcars`, expressed as a percentage. Use `tapply()` with a custom function `function(x) 100 * sd(x) / mean(x)`. Save the named numeric vector to `ex_6_4`.

**Expected result:**

```
#>        3        4        5
#> 18.50762 19.86711 31.45211
```

**Difficulty:** Advanced

[HINTS]
For each gear group, compute a unit-free spread measure that relates variability to the group's average.
Use `tapply()` with `mtcars$mpg`, `mtcars$gear`, and `function(x) 100 * sd(x) / mean(x)`.

```r title="Your turn"
ex_6_4 <- # your code here
ex_6_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_4 <- tapply(mtcars$mpg, mtcars$gear, function(x) 100 * sd(x) / mean(x))
ex_6_4
#>        3        4        5
#> 18.50762 19.86711 31.45211
```

**Explanation:** CoV (the ratio of standard deviation to mean) is a unit-free spread measure handy when comparing groups with different means. 5-gear cars have the highest CoV because the group has only 5 observations and a wide mpg range. A common mistake is forgetting to multiply by 100 when reporting CoV as a percentage; the raw ratio is also valid as long as the unit is clearly labeled.

</details>

## What to do next

You have just drilled the six core members of the apply family across audit, modeling, simulation, and grouped-aggregation patterns. To keep the momentum:

- [Apply Family Exercises in R](Apply-Family-Exercises-in-R.html) for a parallel 20-problem set with different scenarios.
- [Loops vs Vectorization Exercises in R](Loops-vs-Vectorization-Exercises-in-R.html) to compare apply-family idioms against explicit loops on speed and clarity.
- [R Functional Programming Exercises](R-Functional-Programming-Exercises.html) to step beyond apply into Reduce, Filter, Map, and purrr-style helpers.
- [dplyr Exercises in R](dplyr-Exercises-in-R.html) to see the tidyverse counterpart of grouped aggregation.
