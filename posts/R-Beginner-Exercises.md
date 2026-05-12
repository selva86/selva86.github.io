---
title: "R Beginner Exercises: 30 Practice Problems for Newcomers"
slug: "R-Beginner-Exercises"
description: "Thirty hands-on R beginner exercises: vectors, data frames, subsetting, summaries, control flow, and base plots. Hidden solutions, runnable in the browser."
keywords: "R for beginners exercises, R basics practice, R beginner problems, learn R exercises, R intro exercises, R practice problems"
mathjax: false
webr: true
date: "2026-05-12"
post_type: "EX"
sidebar_title: "R Beginner Exercises"
sidebar_order: 120
fr_parent: "R-Tutorial.html"
auto_link_terms: "R for beginners exercises|R basics practice|R beginner exercises|learn R exercises|R practice problems"
auto_link_case_sensitive: false
target_keyword: "R for beginners exercises"
sibling_block_enabled: false
difficulty: "Beginner"
---

# R Beginner Exercises: 30 Practice Problems for Newcomers

<p class="lead">Thirty short, hands-on R practice problems covering vectors, data frames, subsetting, summary statistics, control flow, custom functions, and base plotting. Every exercise has a Task, the exact expected output, and a hidden worked solution with explanation.</p>

```r title="Run this once before any exercise"
library(datasets)   # mtcars, iris, airquality
library(graphics)   # base plot, hist, boxplot, barplot
library(stats)      # mean, sd, lm, aggregate
```

## Section 1. Vectors and arithmetic (5 problems)

### Exercise 1.1: Build a numeric sequence and reverse it

**Task:** Use the colon operator to create a numeric vector containing the integers from 1 to 10, then reverse the order so the result reads 10 down to 1. Save the reversed vector to `ex_1_1` and print it to the console.

**Expected result:**

```
#>  [1] 10  9  8  7  6  5  4  3  2  1
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- rev(1:10)
ex_1_1
#>  [1] 10  9  8  7  6  5  4  3  2  1
```

**Explanation:** `rev()` flips any vector end-to-end and works on numeric, character, or logical vectors alike. You could also write `10:1` directly for this specific case, but `rev()` is the general-purpose tool when the source vector is computed elsewhere. A common beginner mistake is writing `1:10[length(1:10):1]`, which is verbose and prone to off-by-one errors.

</details>

### Exercise 1.2: Element-wise arithmetic with vector recycling

**Task:** Take the vector `c(2, 4, 6, 8, 10)` and add the shorter vector `c(1, 2)` element-wise. R recycles the shorter vector to match the longer length. Save the resulting numeric vector to `ex_1_2` and print it.

**Expected result:**

```
#> [1]  3  6  7 10 11
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- c(2, 4, 6, 8, 10) + c(1, 2)
ex_1_2
#> [1]  3  6  7 10 11
```

**Explanation:** Recycling repeats the shorter vector: `(2+1, 4+2, 6+1, 8+2, 10+1)`. R issues a warning only when the longer length is not a clean multiple of the shorter one. Recycling is convenient for adding a scalar to a vector but can hide bugs when lengths drift apart, so always sanity-check the output dimension after arithmetic.

</details>

### Exercise 1.3: Index into a vector by position and by name

**Task:** Create a named numeric vector `prices <- c(apple=120, mango=60, orange=80, grape=200)`, then extract the prices for "mango" and "grape" by name (not by position) into a new vector. Save the two-element vector to `ex_1_3` and print it.

**Expected result:**

```
#> mango grape
#>    60   200
```

**Difficulty:** Beginner

```r title="Your turn"
prices <- c(apple = 120, mango = 60, orange = 80, grape = 200)
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
prices <- c(apple = 120, mango = 60, orange = 80, grape = 200)
ex_1_3 <- prices[c("mango", "grape")]
ex_1_3
#> mango grape
#>    60   200
```

**Explanation:** Named indexing is more robust than positional indexing because it does not break when the source vector is reordered or extended. The character vector inside `[]` looks up matching names. If a name is missing the result contains `NA` with name `<NA>`, which is a useful sentinel when validating input.

</details>

### Exercise 1.4: Compute total inventory value with vectorized multiplication

**Task:** A grocer has inventory counts `c(10, 5, 8, 3)` and unit prices `c(120, 60, 80, 200)` for four fruits. Compute the total inventory value as a single number using vectorized multiplication and `sum()`. Save the total to `ex_1_4` and print it.

**Expected result:**

```
#> [1] 2740
```

**Difficulty:** Beginner

```r title="Your turn"
counts <- c(10, 5, 8, 3)
prices <- c(120, 60, 80, 200)
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
counts <- c(10, 5, 8, 3)
prices <- c(120, 60, 80, 200)
ex_1_4 <- sum(counts * prices)
ex_1_4
#> [1] 2740
```

**Explanation:** Vectorized arithmetic is one of R's defining strengths: `counts * prices` produces a length-4 element-wise product, and `sum()` collapses it to a scalar. The equivalent `for` loop would be five lines and noticeably slower on large vectors. The same idea generalizes to dot products, weighted means (`sum(w*x) / sum(w)`), and many statistical formulas.

</details>

### Exercise 1.5: Generate a regular sequence with seq()

**Task:** Use `seq()` to generate a numeric vector running from 0 to 1 in steps of 0.1, producing exactly eleven values inclusive of both endpoints. Save the sequence to `ex_1_5` and print it.

**Expected result:**

```
#>  [1] 0.0 0.1 0.2 0.3 0.4 0.5 0.6 0.7 0.8 0.9 1.0
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_5 <- # your code here
ex_1_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_5 <- seq(0, 1, by = 0.1)
ex_1_5
#>  [1] 0.0 0.1 0.2 0.3 0.4 0.5 0.6 0.7 0.8 0.9 1.0
```

**Explanation:** `seq()` accepts either `by =` (step size) or `length.out =` (target length). For this problem `seq(0, 1, length.out = 11)` is equivalent. Prefer `length.out =` when you care about getting exactly N points (for plotting axes, simulation grids); prefer `by =` when the step size is the meaningful quantity (time intervals, percentage thresholds).

</details>

## Section 2. Data frames and built-in datasets (5 problems)

### Exercise 2.1: Inspect the structure of a data frame

**Task:** Use `str()` to inspect the structure of the built-in `mtcars` data frame so you can see column names, types, and the first few values. Save the data frame itself unchanged to `ex_2_1` so the next exercises can reuse it.

**Expected result:**

```
#> 'data.frame':    32 obs. of  11 variables:
#>  $ mpg : num  21 21 22.8 21.4 18.7 18.1 14.3 24.4 22.8 19.2 ...
#>  $ cyl : num  6 6 4 6 8 6 8 4 4 6 ...
#>  $ disp: num  160 160 108 258 360 ...
#>  ...
```

**Difficulty:** Beginner

```r title="Your turn"
ex_2_1 <- # your code here
str(ex_2_1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- mtcars
str(ex_2_1)
#> 'data.frame':    32 obs. of  11 variables:
#>  $ mpg : num  21 21 22.8 21.4 18.7 18.1 14.3 24.4 22.8 19.2 ...
#>  $ cyl : num  6 6 4 6 8 6 8 4 4 6 ...
#>  ...
```

**Explanation:** `str()` is the fastest way to learn what an unknown object looks like: shape, types, and a snippet of values. For very wide objects use `str(x, max.level = 1)` to suppress nested detail. `glimpse()` from the tibble package offers a horizontal variant that is easier to scan when many columns share a wide screen.

</details>

### Exercise 2.2: Get the dimensions of a data frame

**Task:** Use a single base-R function to return both the number of rows and the number of columns of `iris` as a length-two integer vector. Save the dimensions to `ex_2_2` and print them.

**Expected result:**

```
#> [1] 150   5
```

**Difficulty:** Beginner

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- dim(iris)
ex_2_2
#> [1] 150   5
```

**Explanation:** `dim()` returns rows then columns in a single call. `nrow()` and `ncol()` give each dimension separately. For a vector `dim()` returns `NULL`; use `length()` instead. Knowing the shape early in any analysis prevents silent bugs from accidental row drops or column duplications.

</details>

### Exercise 2.3: Show the first six rows of a data frame

**Task:** Use `head()` with its default arguments to show the first six rows of the `airquality` dataset (which has missing values in the first few rows). Save the returned data frame to `ex_2_3` and print it.

**Expected result:**

```
#>   Ozone Solar.R Wind Temp Month Day
#> 1    41     190  7.4   67     5   1
#> 2    36     118  8.0   72     5   2
#> 3    12     149 12.6   74     5   3
#> 4    18     313 11.5   62     5   4
#> 5    NA      NA 14.3   56     5   5
#> 6    28      NA 14.9   66     5   6
```

**Difficulty:** Beginner

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- head(airquality)
ex_2_3
#>   Ozone Solar.R Wind Temp Month Day
#> 1    41     190  7.4   67     5   1
#> 2    36     118  8.0   72     5   2
#> ...
```

**Explanation:** `head()` defaults to six rows; pass `n = 20` for a deeper peek or `n = -10` to drop the last ten rows. `tail()` is the symmetric counterpart. These two functions are the right reflex when first opening any unfamiliar dataset and are far cheaper than printing the whole frame.

</details>

### Exercise 2.4: Extract a single column as a vector

**Task:** Extract the `mpg` column from `mtcars` as a plain numeric vector (not a one-column data frame) using the dollar-sign operator. Save the resulting numeric vector to `ex_2_4` and print it.

**Expected result:**

```
#>  [1] 21.0 21.0 22.8 21.4 18.7 18.1 14.3 24.4 22.8 19.2 17.8 16.4 17.3 15.2
#> [15] 10.4 10.4 14.7 32.4 30.4 33.9 21.5 15.5 15.2 13.3 19.2 27.3 26.0 30.4
#> [29] 15.8 19.7 15.0 21.4
```

**Difficulty:** Beginner

```r title="Your turn"
ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_4 <- mtcars$mpg
ex_2_4
#>  [1] 21.0 21.0 22.8 21.4 18.7 18.1 14.3 24.4 22.8 19.2 17.8 16.4 17.3 15.2
#> ...
```

**Explanation:** The `$` operator returns a vector when the column is a single atomic type. The double-bracket alternative `mtcars[["mpg"]]` does the same thing and is the preferred form when the column name is held in a variable: `col <- "mpg"; mtcars[[col]]`. Using single brackets `mtcars["mpg"]` returns a one-column data frame, which is a different (and often unwanted) type.

</details>

### Exercise 2.5: Count rows that match a condition

**Task:** Use `sum()` on a logical vector to count how many rows in `iris` have `Sepal.Length` strictly greater than 5. The trick is that `TRUE` coerces to `1` and `FALSE` to `0` inside `sum()`. Save the count to `ex_2_5`.

**Expected result:**

```
#> [1] 118
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_5 <- # your code here
ex_2_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_5 <- sum(iris$Sepal.Length > 5)
ex_2_5
#> [1] 118
```

**Explanation:** `iris$Sepal.Length > 5` returns a length-150 logical vector; `sum()` adds up the TRUEs. Swap `sum()` for `mean()` to get the proportion (here `0.787`). For NA-containing columns add `na.rm = TRUE` or the result silently becomes NA. This counting idiom replaces verbose `length(which(...))` and is faster.

</details>

## Section 3. Subsetting and filtering (5 problems)

### Exercise 3.1: Select multiple columns of a data frame by name

**Task:** From `mtcars`, select only the `mpg`, `cyl`, and `hp` columns into a new data frame using bracket notation with a character vector of column names. Preserve the original row order and row names. Save the column subset to `ex_3_1`.

**Expected result:**

```
#>                    mpg cyl  hp
#> Mazda RX4         21.0   6 110
#> Mazda RX4 Wag     21.0   6 110
#> Datsun 710        22.8   4  93
#> Hornet 4 Drive    21.4   6 110
#> Hornet Sportabout 18.7   8 175
#> ...
```

**Difficulty:** Beginner

```r title="Your turn"
ex_3_1 <- # your code here
head(ex_3_1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- mtcars[, c("mpg", "cyl", "hp")]
head(ex_3_1)
#>                    mpg cyl  hp
#> Mazda RX4         21.0   6 110
#> ...
```

**Explanation:** Inside `[ , ]` the comma separates row and column selectors. An empty row slot keeps every row; the character vector picks columns by name. `subset(mtcars, select = c(mpg, cyl, hp))` is an alternative that uses non-standard evaluation, but bracket subsetting is more predictable inside functions and packages.

</details>

### Exercise 3.2: Filter rows using a logical condition

**Task:** Filter `mtcars` to keep only the rows where `cyl` equals 4 (four-cylinder cars). Use bracket-based subsetting with a logical condition on the rows; remember the trailing comma to keep all columns. Save the subset to `ex_3_2`.

**Expected result:**

```
#>                 mpg cyl  disp  hp drat    wt  qsec vs am gear carb
#> Datsun 710     22.8   4 108.0  93 3.85 2.320 18.61  1  1    4    1
#> Merc 240D      24.4   4 146.7  62 3.69 2.870 20.00  1  0    4    2
#> Merc 230       22.8   4 140.8  95 3.92 2.870 22.90  1  0    4    2
#> ...
#> # 11 rows total
```

**Difficulty:** Beginner

```r title="Your turn"
ex_3_2 <- # your code here
head(ex_3_2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- mtcars[mtcars$cyl == 4, ]
head(ex_3_2)
#>                 mpg cyl  disp  hp drat    wt  qsec vs am gear carb
#> Datsun 710     22.8   4 108.0  93 3.85 2.320 18.61  1  1    4    1
#> ...
```

**Explanation:** The condition `mtcars$cyl == 4` is a length-32 logical vector; bracketing with it keeps the TRUE rows. Forgetting the trailing comma is the single most common bug here: `mtcars[mtcars$cyl == 4]` selects a column named `FALSE`/`TRUE` and returns garbage. dplyr's `filter(mtcars, cyl == 4)` is the tidy equivalent.

</details>

### Exercise 3.3: Combine two filter conditions with logical AND

**Task:** From `mtcars`, keep only the rows where `mpg` is greater than 20 AND `wt` is less than 3 (efficient and lightweight cars). Use the element-wise `&` operator inside bracket subsetting and save the resulting data frame to `ex_3_3`.

**Expected result:**

```
#>                 mpg cyl  disp  hp drat    wt  qsec vs am gear carb
#> Mazda RX4      21.0   6 160.0 110 3.90 2.620 16.46  0  1    4    4
#> Mazda RX4 Wag  21.0   6 160.0 110 3.90 2.875 17.02  0  1    4    4
#> Datsun 710     22.8   4 108.0  93 3.85 2.320 18.61  1  1    4    1
#> ...
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_3 <- # your code here
head(ex_3_3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- mtcars[mtcars$mpg > 20 & mtcars$wt < 3, ]
head(ex_3_3)
#>                 mpg cyl  disp  hp drat    wt  qsec vs am gear carb
#> Mazda RX4      21.0   6 160.0 110 3.90 2.620 16.46  0  1    4    4
#> ...
```

**Explanation:** `&` is the element-wise vector AND used inside subsetting. The double form `&&` is short-circuit and only evaluates the first element, so it is wrong here and would silently keep just the first matching row. The same pairing exists for OR: `|` (vector) versus `||` (scalar). Keep the single-symbol forms inside `[ ]` and the double forms inside `if ()` conditions.

</details>

### Exercise 3.4: Drop missing values with na.omit

**Task:** The `airquality` data frame contains NAs in `Ozone` and `Solar.R`. Use `na.omit()` to drop every row with at least one NA in any column, then verify with `nrow()` that the cleaned data frame has 111 rows. Save the cleaned data frame to `ex_3_4`.

**Expected result:**

```
#> [1] 111
```

**Difficulty:** Beginner

```r title="Your turn"
ex_3_4 <- # your code here
nrow(ex_3_4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_4 <- na.omit(airquality)
nrow(ex_3_4)
#> [1] 111
```

**Explanation:** `na.omit()` is row-wise: any row with a single NA in any column is dropped. To target specific columns instead, use `airquality[complete.cases(airquality[, c("Ozone", "Solar.R")]), ]`. Always check how many rows you lose; dropping 28% of a dataset (as here) can bias downstream analyses if missingness is not random.

</details>

### Exercise 3.5: Find the row with the maximum value

**Task:** Find the row number in `mtcars` that contains the highest `hp` value, then return that single row as a data frame. Use `which.max()` to locate the index and bracket subsetting to extract the row. Save the row to `ex_3_5`.

**Expected result:**

```
#>               mpg cyl disp  hp drat   wt qsec vs am gear carb
#> Maserati Bora  15   8  301 335 3.54 3.57 14.6  0  1    5    8
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_5 <- # your code here
ex_3_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_5 <- mtcars[which.max(mtcars$hp), ]
ex_3_5
#>               mpg cyl disp  hp drat   wt qsec vs am gear carb
#> Maserati Bora  15   8  301 335 3.54 3.57 14.6  0  1    5    8
```

**Explanation:** `which.max()` returns the position of the first maximum; `which.min()` does the symmetric job. If two cars tied for top horsepower, only the first would surface. To grab all ties use `mtcars[mtcars$hp == max(mtcars$hp), ]`. Combining `which.max()` with bracket subsetting is the idiomatic way to look up the "row of interest" without sorting the whole frame.

</details>

## Section 4. Summaries and basic statistics (5 problems)

### Exercise 4.1: Compute the mean with NA handling

**Task:** Compute the mean of the `Ozone` column in `airquality`. Because the column contains missing values you must pass `na.rm = TRUE`, otherwise the result is NA. Save the resulting numeric scalar to `ex_4_1` and print it.

**Expected result:**

```
#> [1] 42.12931
```

**Difficulty:** Beginner

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- mean(airquality$Ozone, na.rm = TRUE)
ex_4_1
#> [1] 42.12931
```

**Explanation:** Without `na.rm = TRUE` the result is `NA`, because any single NA poisons the computation. The same flag is accepted by `sd()`, `median()`, `var()`, `min()`, `max()`, and `quantile()`. Forgetting it is one of the top three causes of mysterious NA propagation in beginner R code; make it a habit on any column that might contain missingness.

</details>

### Exercise 4.2: Get a five-number summary of a column

**Task:** Use `summary()` on the `mpg` column of `mtcars` to get the minimum, 1st quartile, median, mean, 3rd quartile, and maximum in a single call. Save the resulting summary object to `ex_4_2` and print it.

**Expected result:**

```
#>    Min. 1st Qu.  Median    Mean 3rd Qu.    Max.
#>   10.40   15.43   19.20   20.09   22.80   33.90
```

**Difficulty:** Beginner

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- summary(mtcars$mpg)
ex_4_2
#>    Min. 1st Qu.  Median    Mean 3rd Qu.    Max.
#>   10.40   15.43   19.20   20.09   22.80   33.90
```

**Explanation:** `summary()` is overloaded: on a numeric vector it returns the six-number summary, on a data frame it returns one summary per column, on a fitted model object it returns coefficients and goodness-of-fit. This polymorphism is what makes `summary()` the universal first step after loading any object. For NA-containing columns it also reports a count of NAs.

</details>

### Exercise 4.3: Build a frequency table of a categorical column

**Task:** The `iris` dataset has a factor column `Species` with three levels. Use `table()` to count how many flowers belong to each species. Save the resulting one-dimensional frequency table to `ex_4_3` and print it.

**Expected result:**

```
#>     setosa versicolor  virginica
#>         50         50         50
```

**Difficulty:** Beginner

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- table(iris$Species)
ex_4_3
#>     setosa versicolor  virginica
#>         50         50         50
```

**Explanation:** `table()` returns a named integer vector with one count per level. Pass two columns to get a contingency table: `table(mtcars$cyl, mtcars$gear)`. Wrap with `prop.table()` to convert counts to proportions; `prop.table(..., margin = 1)` normalizes by row. This trio (`table`, `prop.table`, `margin.table`) covers most beginner cross-tab needs.

</details>

### Exercise 4.4: Compute the mean of every numeric column

**Task:** Use `colMeans()` to compute the mean of every numeric column in `mtcars` (all 11 columns are numeric). Save the resulting named numeric vector to `ex_4_4` and print it.

**Expected result:**

```
#>      mpg      cyl     disp       hp     drat       wt     qsec       vs       am     gear     carb
#> 20.09063  6.18750 230.72188 146.68750  3.59656  3.21725 17.84875  0.43750  0.40625  3.68750  2.81250
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_4 <- # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_4 <- colMeans(mtcars)
ex_4_4
#>      mpg      cyl     disp       hp     drat       wt     qsec       vs       am     gear     carb
#> 20.09063  6.18750 230.72188 146.68750  3.59656  3.21725 17.84875  0.43750  0.40625  3.68750  2.81250
```

**Explanation:** `colMeans()` is fast because it works on a numeric matrix backbone; if any column were non-numeric it would error. The general-purpose alternative is `sapply(mtcars, mean)`, which silently returns NA (with warning) for non-numeric columns. Use `colMeans()` when you know the frame is numeric, `sapply()` when types are mixed.

</details>

### Exercise 4.5: Compare medians across groups with aggregate

**Task:** Compute the median `Sepal.Length` separately for each `Species` in `iris` using `aggregate()` with the formula interface. The result should be a small three-row data frame with one row per species. Save it to `ex_4_5`.

**Expected result:**

```
#>      Species Sepal.Length
#> 1     setosa          5.0
#> 2 versicolor          5.9
#> 3  virginica          6.5
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_5 <- # your code here
ex_4_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_5 <- aggregate(Sepal.Length ~ Species, data = iris, FUN = median)
ex_4_5
#>      Species Sepal.Length
#> 1     setosa          5.0
#> 2 versicolor          5.9
#> 3  virginica          6.5
```

**Explanation:** The formula `y ~ x` reads "y broken down by x" and is shared across `lm()`, `boxplot()`, `aggregate()`, and many model functions. Pass any reducer via `FUN =`: `mean`, `sd`, `length`, or a custom function. The dplyr equivalent `iris |> group_by(Species) |> summarise(med = median(Sepal.Length))` is the modern alternative once you graduate from base R.

</details>

## Section 5. Control flow and functions (5 problems)

### Exercise 5.1: Classify a single number with if/else

**Task:** Write an `if/else if/else` block that takes the number `x <- -7` and returns the character string "positive", "negative", or "zero" depending on its sign. Assign the returned string to `ex_5_1` and print it.

**Expected result:**

```
#> [1] "negative"
```

**Difficulty:** Beginner

```r title="Your turn"
x <- -7
ex_5_1 <- # your if/else here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
x <- -7
ex_5_1 <- if (x > 0) {
  "positive"
} else if (x < 0) {
  "negative"
} else {
  "zero"
}
ex_5_1
#> [1] "negative"
```

**Explanation:** `if` in R is an expression: it returns the value of the matching branch, so you can assign the whole construct directly. Note that `if` only works on a length-one logical; pass it a vector and you get a warning plus only the first element used. For vectors use `ifelse()` (Exercise 5.3) or `dplyr::case_when()`.

</details>

### Exercise 5.2: Compute factorial with a for loop

**Task:** Use a `for` loop to compute the factorial of 6 (i.e., 1*2*3*4*5*6 = 720). Initialize an accumulator at 1, multiply it by each integer from 1 to 6 inside the loop, and save the final accumulated value to `ex_5_2`.

**Expected result:**

```
#> [1] 720
```

**Difficulty:** Beginner

```r title="Your turn"
ex_5_2 <- 1
for (i in 1:6) {
  # update ex_5_2 here
}
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_2 <- 1
for (i in 1:6) {
  ex_5_2 <- ex_5_2 * i
}
ex_5_2
#> [1] 720
```

**Explanation:** The for loop is the most explicit way to express iteration but is rarely the fastest. The vectorized one-liner `prod(1:6)` is shorter and faster, and the built-in `factorial(6)` is shorter still. Use loops when the iteration depends on previous results in a way that resists vectorization; otherwise prefer the vector form.

</details>

### Exercise 5.3: Vectorize sign classification with ifelse

**Task:** Take the vector `nums <- c(-3, 0, 4, -1, 5, 0)` and use the vectorized `ifelse()` to label each element as "neg", "zero", or "pos". Handle the three cases with a nested `ifelse`. Save the resulting character vector to `ex_5_3`.

**Expected result:**

```
#> [1] "neg"  "zero" "pos"  "neg"  "pos"  "zero"
```

**Difficulty:** Intermediate

```r title="Your turn"
nums <- c(-3, 0, 4, -1, 5, 0)
ex_5_3 <- # your nested ifelse here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
nums <- c(-3, 0, 4, -1, 5, 0)
ex_5_3 <- ifelse(nums < 0, "neg",
                 ifelse(nums == 0, "zero", "pos"))
ex_5_3
#> [1] "neg"  "zero" "pos"  "neg"  "pos"  "zero"
```

**Explanation:** `ifelse(test, yes, no)` evaluates `test` as a vector and returns a vector of the same length, picking from `yes` or `no` element-by-element. Nesting it handles three or more cases but quickly becomes hard to read. `dplyr::case_when()` reads top-to-bottom and scales much better when you have four or more branches.

</details>

### Exercise 5.4: Write a function that returns the spread of a vector

**Task:** Define a function called `vector_span` that takes one numeric vector argument and returns the difference between its maximum and minimum (i.e., `max(x) - min(x)`). Test it on `mtcars$mpg` and save the resulting numeric scalar to `ex_5_4`.

**Expected result:**

```
#> [1] 23.5
```

**Difficulty:** Beginner

```r title="Your turn"
vector_span <- function(x) {
  # your code here
}
ex_5_4 <- vector_span(mtcars$mpg)
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
vector_span <- function(x) {
  max(x) - min(x)
}
ex_5_4 <- vector_span(mtcars$mpg)
ex_5_4
#> [1] 23.5
```

**Explanation:** A function body returns the value of its last expression, so no explicit `return()` is needed. The built-in `range(x)` returns both endpoints as a length-two vector; `diff(range(x))` is a one-liner equivalent to `vector_span(x)`. Wrapping logic in a named function pays off once you start calling the same calculation in multiple places.

</details>

### Exercise 5.5: Use a while loop to find the first power of two greater than 1000

**Task:** Use a `while` loop starting from 1, doubling each iteration, that stops as soon as the value exceeds 1000. Save the first value that exceeds 1000 to `ex_5_5`. Hint: 2^10 = 1024 is the answer you should land on.

**Expected result:**

```
#> [1] 1024
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_5 <- 1
while (ex_5_5 <= 1000) {
  # update ex_5_5 here
}
ex_5_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_5 <- 1
while (ex_5_5 <= 1000) {
  ex_5_5 <- ex_5_5 * 2
}
ex_5_5
#> [1] 1024
```

**Explanation:** `while` runs as long as its condition is TRUE, then exits when the condition becomes FALSE. Because the loop body runs once after the threshold is crossed, the saved value is the first one strictly above 1000, not the last one below. Always include something inside the body that can flip the condition or you risk an infinite loop; for known iteration counts prefer `for`.

</details>

## Section 6. Plotting and quick visuals (5 problems)

### Exercise 6.1: Draw a scatter plot of two columns

**Task:** Use base R `plot()` to draw a scatter plot of `mpg` (y-axis) against `wt` (x-axis) from `mtcars`, with axis labels matching the column names. Save the marker string `"scatter drawn"` to `ex_6_1` so the variable exists for grading.

**Expected result:**

```
# Scatter plot: x-axis 'wt' (1.5 to 5.5), y-axis 'mpg' (10 to 35), 32 points; clear downward trend
#> [1] "scatter drawn"
```

**Difficulty:** Beginner

```r title="Your turn"
plot(mtcars$wt, mtcars$mpg, xlab = "wt", ylab = "mpg")
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
plot(mtcars$wt, mtcars$mpg, xlab = "wt", ylab = "mpg")
ex_6_1 <- "scatter drawn"
ex_6_1
#> [1] "scatter drawn"
```

**Explanation:** Base `plot()` is the fastest way to inspect a relationship during exploratory work; one call gives you points, axes, and labels. It returns invisibly (you cannot assign the chart to a variable like ggplot2 objects), which is why we store a marker string. For publication-quality figures, layered ggplot2 code is more flexible, but base plot stays unbeaten for the first look.

</details>

### Exercise 6.2: Draw a histogram and capture its bins

**Task:** Use `hist()` to draw a histogram of `mtcars$mpg` with 10 break points. Save the histogram object that `hist()` returns invisibly to `ex_6_2`; that object holds breaks, counts, and densities so you can inspect bin contents later.

**Expected result:**

```
# Histogram: x-axis mpg (10 to 35), y-axis frequency, ~10 bars peaking near 15-20
#> List of 6
#>  $ breaks  : num [1:11] 10 12 14 16 18 20 22 24 26 28 ...
#>  $ counts  : int [1:10] 4 5 5 ...
```

**Difficulty:** Beginner

```r title="Your turn"
ex_6_2 <- # your code here
str(ex_6_2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_2 <- hist(mtcars$mpg, breaks = 10)
str(ex_6_2)
#> List of 6
#>  $ breaks  : num [1:11] 10 12 14 16 18 20 22 24 26 28 ...
#>  $ counts  : int [1:10] 4 5 5 ...
```

**Explanation:** `hist()` does double duty: it draws the chart and returns a list describing the bins. Adjust granularity with `breaks = 5` for a coarser view or `breaks = 30` for a finer one. Pass `freq = FALSE` to plot densities instead of counts; that scaling is what you want when overlaying a probability density curve.

</details>

### Exercise 6.3: Add a regression line to a scatter plot

**Task:** Draw a scatter plot of `mpg` versus `wt` from `mtcars`, fit a simple linear model with `lm(mpg ~ wt, data = mtcars)`, then overlay the regression line using `abline()`. Save the fitted model object to `ex_6_3` and print its coefficients.

**Expected result:**

```
# Scatter plot with a downward red line through the cloud of points
#> Coefficients:
#> (Intercept)           wt
#>      37.285       -5.344
```

**Difficulty:** Intermediate

```r title="Your turn"
plot(mtcars$wt, mtcars$mpg, xlab = "wt", ylab = "mpg")
ex_6_3 <- # fit the model here
abline(ex_6_3, col = "red")
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
plot(mtcars$wt, mtcars$mpg, xlab = "wt", ylab = "mpg")
ex_6_3 <- lm(mpg ~ wt, data = mtcars)
abline(ex_6_3, col = "red")
ex_6_3
#> Coefficients:
#> (Intercept)           wt
#>      37.285       -5.344
```

**Explanation:** `abline()` accepts a fitted model with exactly one predictor and pulls intercept and slope automatically. For multi-predictor models you need to construct a prediction grid and call `lines()` instead. Storing the model in `ex_6_3` lets you call `summary(ex_6_3)` afterwards to inspect the residual standard error and R-squared.

</details>

### Exercise 6.4: Draw a boxplot grouped by a categorical column

**Task:** Use the formula interface of `boxplot()` to draw `Sepal.Length` from `iris` grouped by `Species`, producing one box per species. Save the printed list of bin statistics that `boxplot()` returns invisibly to `ex_6_4`.

**Expected result:**

```
# Three side-by-side boxplots, medians 5.0 / 5.9 / 6.5 from left to right
#> List of 6
#>  $ stats: num [1:5, 1:3] 4.3 4.8 5 5.2 5.8 ...
#>  $ n    : num [1:3] 50 50 50
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_6_4 <- # your code here
str(ex_6_4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_4 <- boxplot(Sepal.Length ~ Species, data = iris)
str(ex_6_4)
#> List of 6
#>  $ stats: num [1:5, 1:3] 4.3 4.8 5 5.2 5.8 ...
#>  $ n    : num [1:3] 50 50 50
```

**Explanation:** The formula `Sepal.Length ~ Species` mirrors what you would pass to `lm()` or `aggregate()`, which is a deliberate consistency in base R. The returned list exposes `stats` (lower whisker, Q1, median, Q3, upper whisker) per group plus outliers, so you can replicate or annotate the chart programmatically without re-computing the quantiles.

</details>

### Exercise 6.5: Draw a bar chart from a frequency table

**Task:** Build a frequency table of `mtcars$cyl` (counts of 4-, 6-, and 8-cylinder cars) using `table()`, then pass that table to `barplot()` to render a vertical bar chart with the cylinder counts as labels. Save the table itself to `ex_6_5`.

**Expected result:**

```
# Three vertical bars labelled 4, 6, 8 with heights 11, 7, 14
#>
#>  4  6  8
#> 11  7 14
```

**Difficulty:** Beginner

```r title="Your turn"
ex_6_5 <- # build the table here
barplot(ex_6_5)
ex_6_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_5 <- table(mtcars$cyl)
barplot(ex_6_5)
ex_6_5
#>
#>  4  6  8
#> 11  7 14
```

**Explanation:** `barplot()` accepts either a numeric vector of heights or a `table` object; passing a named table is the cleanest way to get axis labels for free. For a horizontal version pass `horiz = TRUE`; for proportions wrap with `prop.table()` first. ggplot2's `geom_bar()` is the more flexible alternative once you outgrow base graphics.

</details>

## What to do next

- Move from beginner to package-based wrangling with [dplyr Exercises in R](dplyr-Exercises-in-R.html).
- Practice cleaner plotting with [ggplot2 Exercises in R](ggplot2-Exercises-in-R.html).
- Get a wider hands-on tour with the [R for Data Science Exercises](R-for-Data-Science-Exercises.html).
- Build statistical reasoning step by step with the [Hypothesis Testing Exercises in R](Hypothesis-Testing-Exercises-in-R.html).
