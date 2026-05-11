---
title: "Apply Family Exercises in R: 20 Real-World Practice Problems"
slug: "Apply-Family-Exercises-in-R"
description: "Practice apply, sapply, lapply, mapply, tapply, and vapply with 20 scenario-driven R exercises across matrices, data frames, and grouped vectors. Hidden solutions."
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

<p class="lead">Twenty practice problems on the apply family in base R: lapply, sapply, vapply, apply, mapply, and tapply. Light on warm-ups, heavy on the intermediate cases where the trap is picking the right family member. Solutions are hidden behind reveal toggles so you try first.</p>

```r title="Run this once before any exercise"
library(datasets)
library(stats)
```

## Section 1. lapply foundations (3 problems)

### Exercise 1.1: Inspect column classes of iris with lapply

**Task:** A junior analyst onboarding to a new project wants a quick audit of column types in `iris` before joining it with other tables. Use `lapply()` with the `class` function to return one element per column of `iris`, then save the result to `ex_1_1`.

**Dataset:** `iris` is a 150-row built-in dataset of flower measurements. Four numeric columns (`Sepal.Length`, `Sepal.Width`, `Petal.Length`, `Petal.Width`) and one factor (`Species`, 3 levels).

**Expected result:** A named list of length 5. Names match `names(iris)`. The first four elements are `"numeric"`, and the `Species` element is `"factor"`. The shape stays a list (not a vector).

**Difficulty:** Beginner

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

**Explanation:** A data frame is internally a list of columns, so `lapply()` walks each column and applies `class()`. The return type is always a list, which is why the output keeps the column names as list element names. Switch to `sapply(iris, class)` if you would rather collapse the result into a length-5 character vector. Use `lapply()` whenever downstream code expects iterable list semantics or when the per-element return shape might vary.

</details>

### Exercise 1.2: Compute the range of each quarter in an inline sales list

**Task:** A retail analyst has Q1, Q2, and Q3 daily revenue for one store stored in three separate vectors. Bundle them into a list and use `lapply()` to compute `range()` per quarter, saving the result to `ex_1_2`.

**Dataset:** Inline list `quarters` of three numeric vectors (Q1, Q2, Q3) constructed below; each vector holds 5 daily revenue values in dollars.

**Expected result:** A list of length 3 named `Q1`, `Q2`, `Q3`. Each element is a length-2 numeric vector (min, max). For Q1 the result equals `c(120, 410)`. The list keeps the original quarter names as element names.

**Difficulty:** Intermediate

```r title="Inline data for Exercise 1.2"
quarters <- list(
  Q1 = c(180, 240, 120, 410, 305),
  Q2 = c(220, 360, 175, 450, 290),
  Q3 = c(310, 405, 215, 520, 360)
)
```

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- lapply(quarters, range)
ex_1_2
#> $Q1
#> [1] 120 410
#>
#> $Q2
#> [1] 175 450
#>
#> $Q3
#> [1] 215 520
```

**Explanation:** `lapply()` is the right choice here because every per-element output is a length-2 vector and you want the structure preserved. `sapply()` would simplify these into a 2x3 matrix, which is also useful but loses the list semantics. A common mistake is to call `range(quarters)`, which flattens all three vectors into one min and one max instead of returning per-quarter ranges. Pair `lapply()` with `range()` whenever you need per-element bounds without collapsing.

</details>

### Exercise 1.3: Mean ozone per month with split + lapply

**Task:** An environmental analyst studying `airquality` wants the average daily ozone level for every month in the New York 1973 sample. Split the data by `Month`, then use `lapply()` to compute `mean(x$Ozone, na.rm = TRUE)`, and save the named numeric list to `ex_1_3`.

**Dataset:** `airquality` is 153 daily NYC air-quality readings from May to September 1973. Relevant columns: `Ozone` (ppb, has NAs) and `Month` (5-9, integer).

**Expected result:** A list of length 5 with names `5`, `6`, `7`, `8`, `9`. Each element is a single numeric (the mean Ozone for that month). The `5` (May) value is approximately `23.62`. July is the highest at roughly `59.12`.

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- lapply(split(airquality, airquality$Month),
                 function(x) mean(x$Ozone, na.rm = TRUE))
ex_1_3
#> $`5`
#> [1] 23.61538
#>
#> $`6`
#> [1] 29.44444
#>
#> $`7`
#> [1] 59.11538
#>
#> $`8`
#> [1] 59.96154
#>
#> $`9`
#> [1] 31.44828
```

**Explanation:** `split()` cuts the data frame into a named list of monthly subsets, which is exactly the input shape `lapply()` wants. Forgetting `na.rm = TRUE` returns `NA` for any month with a missing ozone reading, masking the real signal. For a flatter output use `sapply()` to collapse to a named numeric vector, or jump straight to `tapply(airquality$Ozone, airquality$Month, mean, na.rm = TRUE)` and skip the split entirely. The split-apply pattern generalises to richer per-group calculations later.

</details>

## Section 2. sapply and vapply for type simplification (3 problems)

### Exercise 2.1: Mean of every numeric column with sapply

**Task:** A code reviewer wants a one-line audit of the column means of `mtcars` for a sanity check before publishing a regression model. Use `sapply()` to apply `mean` to every column of `mtcars` and save the simplified named numeric vector to `ex_2_1`.

**Dataset:** `mtcars` is a 32-row built-in dataset of 1974 cars; all 11 columns are numeric (`mpg`, `cyl`, `disp`, `hp`, `drat`, `wt`, `qsec`, `vs`, `am`, `gear`, `carb`).

**Expected result:** A named numeric vector of length 11. The first element is `mpg = 20.09`, the last is `carb = 2.81`. Order matches `names(mtcars)`. No simplification to a matrix because each call returns a scalar.

**Difficulty:** Beginner

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- sapply(mtcars, mean)
ex_2_1
#>      mpg      cyl     disp       hp     drat       wt     qsec       vs       am     gear     carb
#> 20.09063  6.18750 230.7188 146.6875  3.59656  3.21725 17.84875  0.43750  0.40625  3.68750  2.81250
```

**Explanation:** A data frame is a list of columns, so `sapply()` walks each column and applies `mean()`. Because every column is numeric and the same length, the result simplifies to a named numeric vector, perfect for a one-line audit. If any column were non-numeric, `mean()` would emit `NA` with a warning. For type-stable code, prefer `vapply(mtcars, mean, numeric(1))`, which errors loudly if a column ever returns the wrong type.

</details>

### Exercise 2.2: Simplify lapply output to a matrix with sapply

**Task:** A statistician wants a 2-by-4 matrix that holds the minimum and maximum of each numeric column in `iris` (excluding `Species`). Use `sapply()` with the `range` function and save the resulting matrix to `ex_2_2`.

**Dataset:** `iris` has 150 rows. Use only the four numeric columns (`Sepal.Length`, `Sepal.Width`, `Petal.Length`, `Petal.Width`); drop `Species` for this exercise.

**Expected result:** A 2 x 4 numeric matrix. Row 1 holds the minimum, row 2 the maximum. Column names are the four flower-measurement columns. The `Sepal.Length` column equals `c(4.3, 7.9)`.

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- sapply(iris[, 1:4], range)
ex_2_2
#>      Sepal.Length Sepal.Width Petal.Length Petal.Width
#> [1,]          4.3         2.0          1.0         0.1
#> [2,]          7.9         4.4          6.9         2.5
```

**Explanation:** When every iteration of the function returns a vector of the same length, `sapply()` simplifies the result into a matrix with one column per input element. This is the cleanest way to build wide summary matrices without writing a loop or binding lists. If the per-element vectors had different lengths, `sapply()` would silently fall back to a list, which is a frequent source of broken downstream code. Use `vapply(iris[, 1:4], range, numeric(2))` to enforce the 2-row return contract.

</details>

### Exercise 2.3: Use vapply to count NAs per column type-stably

**Task:** A data engineer is building a CI script that fails when the per-column NA count of `airquality` is not a length-1 integer per column. Use `vapply()` with `FUN.VALUE = integer(1)` to count NAs in every column, and save the resulting integer vector to `ex_2_3`.

**Dataset:** `airquality` is a 153-row NYC air dataset. All six columns are numeric; `Ozone` and `Solar.R` contain NAs.

**Expected result:** A named integer vector of length 6 (one per column of airquality). `Ozone` equals `37L`, `Solar.R` equals `7L`, the remaining four (`Wind`, `Temp`, `Month`, `Day`) equal `0L`. Total NAs across columns: `44`.

**Difficulty:** Advanced

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- vapply(airquality, function(x) sum(is.na(x)), integer(1))
ex_2_3
#> Ozone Solar.R    Wind    Temp   Month     Day
#>    37       7       0       0       0       0
```

**Explanation:** `vapply()` is `sapply()` with a contract: every iteration must return a value matching the `FUN.VALUE` template. Pass `integer(1)` and any iteration returning a double, a length-2 vector, or a logical raises an error at the call site rather than silently producing the wrong shape. This makes `vapply()` the right choice for production utilities and CI checks. The cost is more typing; the payoff is failing fast when an upstream column changes type.

</details>

## Section 3. apply over matrix margins (3 problems)

### Exercise 3.1: Total arrests per state with apply over rows

**Task:** A criminologist studying the 1973 USA arrest dataset wants total reported violent-crime rates per state. Use `apply()` over the row margin of `USArrests[, c("Murder","Assault","Rape")]` to sum the three crime columns, and save the named numeric vector to `ex_3_1`.

**Dataset:** `USArrests` is 50 rows (one per US state) and 4 columns. Use the three crime-rate columns: `Murder` (per 100k), `Assault` (per 100k), `Rape` (per 100k).

**Expected result:** A named numeric vector of length 50, one entry per US state. The `Alabama` element equals `13.2 + 236 + 21.2 = 270.4`. The names equal `rownames(USArrests)`. No matrix output, only a flat numeric vector.

**Difficulty:** Beginner

```r title="Your turn"
ex_3_1 <- # your code here
head(ex_3_1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- apply(USArrests[, c("Murder", "Assault", "Rape")], 1, sum)
head(ex_3_1)
#>    Alabama     Alaska    Arizona   Arkansas California   Colorado
#>      270.4      314.3      321.2      211.3      287.5      244.7
```

**Explanation:** Margin `1` means "iterate over rows", so each call to `sum()` receives a length-3 numeric vector for one state. The names of the result come from the data frame row names, which is why the output is automatically labelled by state. `rowSums(USArrests[, c("Murder","Assault","Rape")])` is faster and more readable for this exact case; reach for `apply()` when the per-row reduction is something more complex than a sum or mean.

</details>

### Exercise 3.2: Standardize iris numeric columns column-by-column

**Task:** A machine-learning engineer needs z-scored versions of the four numeric `iris` columns before fitting a clustering model. Use `apply()` over the column margin to subtract the mean and divide by `sd`, and save the resulting numeric matrix to `ex_3_2`.

**Dataset:** `iris` has 150 rows. Use only the four numeric columns: `Sepal.Length`, `Sepal.Width`, `Petal.Length`, `Petal.Width`.

**Expected result:** A 150 x 4 numeric matrix. Each column has `mean(x)` essentially zero and `sd(x)` equal to 1 (verify with `colMeans(round(., 10))` and `apply(., 2, sd)`). Column names match the original four iris columns.

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_2 <- # your code here
head(ex_3_2, 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- apply(iris[, 1:4], 2, function(x) (x - mean(x)) / sd(x))
head(ex_3_2, 3)
#>      Sepal.Length Sepal.Width Petal.Length Petal.Width
#> [1,]   -0.8976739  1.01560199    -1.335752   -1.311052
#> [2,]   -1.1392005 -0.13153881    -1.335752   -1.311052
#> [3,]   -1.3807271  0.32731751    -1.392399   -1.311052
```

**Explanation:** Margin `2` says "iterate over columns", so the anonymous function receives one column at a time. `apply()` returns a matrix of the same shape as the numeric input because every per-column output has 150 entries. A common slip is using margin `1` (rows), which would z-score each row of measurements (treating each flower's four traits as a vector), producing a meaningless matrix. For a one-call shortcut, `scale(iris[, 1:4])` does exactly the same z-scoring with a centred attribute trail.

</details>

### Exercise 3.3: Apply over a 3D array via the third margin

**Task:** A junior analyst learning `apply()` margins is given the built-in `Titanic` 4-D contingency array. Collapse it down by summing across `Class`, `Sex`, and `Age` to leave only `Survived` totals via `apply(Titanic, 4, sum)`, and save the named numeric vector to `ex_3_3`.

**Dataset:** `Titanic` is a 4-dimensional integer array with margins `Class` (4 levels), `Sex` (2), `Age` (2), `Survived` (2). Total passengers in the array equal 2,201.

**Expected result:** A named numeric vector of length 2 with names `No` and `Yes`. `No` equals `1490`, `Yes` equals `711`. The two values sum to the dataset total of `2201`. Names come from the `Survived` dimnames.

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- apply(Titanic, 4, sum)
ex_3_3
#>   No  Yes
#> 1490  711
```

**Explanation:** Margin `4` keeps only the fourth dimension (`Survived`) and sums every cell across the other three. `apply()` accepts arrays of any rank, not just matrices, which makes it the cleanest way to collapse contingency tables. To collapse along two dimensions instead (say, marginalising over `Sex` only), pass `c(1, 3, 4)` for the margin: every dimension you list is kept, every dimension you omit is collapsed by the function.

</details>

## Section 4. mapply for vectorized multi-arg calls (3 problems)

### Exercise 4.1: Compute revenue per category from paired vectors

**Task:** A reporting analyst has three product categories with paired vectors of unit prices and units sold per SKU. Use `mapply()` to compute each category's total revenue (`sum(price * units)`) by walking two parallel lists in lockstep, and save the named numeric vector to `ex_4_1`.

**Dataset:** Inline construction below: two named lists `prices` and `units`, each of length 3 (one per category: `electronics`, `apparel`, `home`).

**Expected result:** A named numeric vector of length 3. Names: `electronics`, `apparel`, `home`. Values are scalar revenues. For `electronics` (prices `c(50, 80, 120)` and units `c(10, 5, 2)`), the value equals `50*10 + 80*5 + 120*2 = 1140`.

**Difficulty:** Intermediate

```r title="Inline data for Exercise 4.1"
prices <- list(electronics = c(50, 80, 120),
               apparel     = c(20, 25, 35),
               home        = c(15, 22, 40))
units  <- list(electronics = c(10, 5, 2),
               apparel     = c(40, 30, 20),
               home        = c(50, 25, 15))
```

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- mapply(function(p, u) sum(p * u), prices, units)
ex_4_1
#> electronics     apparel        home
#>        1140        2050        1525
```

**Explanation:** `mapply()` is the multi-argument cousin of `sapply()`: it walks two or more parallel iterables in lockstep and calls a function on the matching elements. The output is named after the first argument's names, which is why categories carry through. A frequent mistake is to use `sapply()` over indices and reach into the lists by hand, which is verbose and error-prone. Whenever you find yourself writing `sapply(seq_along(x), function(i) f(a[[i]], b[[i]]))`, reach for `mapply(f, a, b)` instead.

</details>

### Exercise 4.2: Generate paired ranges with mapply

**Task:** A code reviewer is writing test fixtures and needs three integer sequences with different start and end points: `1:5`, `10:13`, and `100:102`. Use `mapply()` over two paired vectors of `from` and `to` values calling `seq()` with `SIMPLIFY = FALSE`, and save the resulting list to `ex_4_2`.

**Dataset:** Inline pair of integer vectors `from = c(1, 10, 100)` and `to = c(5, 13, 102)`. Both have length 3.

**Expected result:** A list of length 3 (set `SIMPLIFY = FALSE` because the sequences differ in length). Element 1 is `1:5`, element 2 is `10:13`, element 3 is `100:102`. Total elements across the three sequences: `5 + 4 + 3 = 12`.

**Difficulty:** Intermediate

```r title="Inline data for Exercise 4.2"
from <- c(1, 10, 100)
to   <- c(5, 13, 102)
```

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- mapply(seq, from = from, to = to, SIMPLIFY = FALSE)
ex_4_2
#> [[1]]
#> [1] 1 2 3 4 5
#>
#> [[2]]
#> [1] 10 11 12 13
#>
#> [[3]]
#> [1] 100 101 102
```

**Explanation:** Without `SIMPLIFY = FALSE`, `mapply()` would try to combine the three return values into a matrix and fail because the per-element lengths differ. The flag forces a list output, exactly what you want when sequences have different lengths. Naming the arguments `from = ` and `to = ` makes the call self-documenting and matches `seq()`'s signature. For a tidyverse-flavoured equivalent, `purrr::map2()` plays the same role with stricter type checks.

</details>

### Exercise 4.3: Cap and floor scores with mapply and MoreArgs

**Task:** A risk-team analyst has a vector of customer credit scores and a parallel vector of per-customer cap values; she wants `pmin(score, cap)` for every pair while passing a third constant floor through `MoreArgs`. Use `mapply()` to clip each score, and save the resulting numeric vector to `ex_4_3`.

**Dataset:** Inline numeric vectors `scores = c(720, 650, 800, 580, 690)` and `caps = c(750, 700, 780, 600, 720)`. The constant floor is `600`.

**Expected result:** A numeric vector of length 5 holding `max(min(score, cap), floor)` for every pair. Concretely: `c(720, 650, 780, 600, 690)`. The cap clamps element 3 down from 800 to 780, and the floor lifts element 4 up from 580 to 600.

**Difficulty:** Advanced

```r title="Inline data for Exercise 4.3"
scores <- c(720, 650, 800, 580, 690)
caps   <- c(750, 700, 780, 600, 720)
```

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- mapply(function(score, cap, fl) max(min(score, cap), fl),
                 scores, caps, MoreArgs = list(fl = 600))
ex_4_3
#> [1] 720 650 780 600 690
```

**Explanation:** `MoreArgs` lets you pass arguments that are NOT iterated, perfect for constants like the floor here. Every iteration receives the same `fl = 600` while `score` and `cap` advance in lockstep. The vectorised single-line shortcut `pmax(pmin(scores, caps), 600)` is faster and more idiomatic for this exact pattern, but the `mapply()` form generalises naturally to non-vectorised functions where you still need a constant context argument piped through every call.

</details>

## Section 5. tapply for grouped summaries (3 problems)

### Exercise 5.1: Mean tooth length by supplement with tapply

**Task:** A biostatistician analyzing the `ToothGrowth` guinea-pig experiment wants the mean tooth length within each supplement group (orange juice vs. ascorbic acid). Use `tapply()` with `len` as the value vector and `supp` as the grouping index, and save the named numeric vector to `ex_5_1`.

**Dataset:** `ToothGrowth` is 60 rows. Columns used: `len` (tooth length, numeric) and `supp` (factor with levels `OJ`, `VC`).

**Expected result:** A named numeric vector of length 2 with names `OJ` and `VC`. `OJ` equals approximately `20.66`, `VC` equals approximately `16.96`. The OJ mean is higher than the VC mean by roughly `3.7` units.

**Difficulty:** Beginner

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- tapply(ToothGrowth$len, ToothGrowth$supp, mean)
ex_5_1
#>       OJ       VC
#> 20.66333 16.96333
```

**Explanation:** `tapply()` groups the first vector by the second and applies the function to each group. The output is a named numeric vector when the grouping argument is a single factor. This is the lightest-weight grouped summary in base R: no `split()` and no list comprehension needed. For a richer multi-statistic summary (mean and standard deviation in one call), step up to `aggregate(len ~ supp, data = ToothGrowth, FUN = function(x) c(mean = mean(x), sd = sd(x)))`.

</details>

### Exercise 5.2: Median mpg per cylinder count

**Task:** A performance analyst comparing engine sizes wants the median fuel economy of `mtcars` per cylinder bucket (4, 6, 8). Use `tapply()` with `mpg` as the value vector, `cyl` as the grouping factor, and `median` as the function. Save the named numeric vector to `ex_5_2`.

**Dataset:** `mtcars` has 32 rows. Columns used: `mpg` (numeric, miles per gallon) and `cyl` (numeric, 3 unique values: 4, 6, 8).

**Expected result:** A named numeric vector of length 3 with names `4`, `6`, `8`. The 4-cylinder group equals `26.0`, 6-cylinder `19.7`, 8-cylinder `15.2`. Larger engines deliver lower medians, exactly as expected.

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_2 <- tapply(mtcars$mpg, mtcars$cyl, median)
ex_5_2
#>    4    6    8
#> 26.0 19.7 15.2
```

**Explanation:** `tapply()` coerces a numeric `cyl` to a factor on the fly, so the result is named by the unique cylinder values. Median is the natural summary when the per-group distribution is small or skewed; for a normal-ish distribution `mean` is fine, but `median` is more robust to outliers like the few high-mpg compact cars in `mtcars`. To return both mean and median in one shot, replace `median` with `function(x) c(mean = mean(x), median = median(x))` and `tapply()` will return a list of length-2 vectors.

</details>

### Exercise 5.3: Two-way grouped table with tapply

**Task:** A pharmacology team wants average tooth length crossed by supplement and dose in `ToothGrowth`. Use `tapply()` with `len` as the value vector and a list of two factors (`supp`, `dose`) as the index, and save the resulting numeric matrix to `ex_5_3`.

**Dataset:** `ToothGrowth` is 60 rows. Columns: `len` (numeric), `supp` (factor: `OJ`, `VC`), `dose` (numeric, 3 unique values: 0.5, 1, 2).

**Expected result:** A 2 x 3 numeric matrix. Row names `OJ`, `VC`; column names `0.5`, `1`, `2`. The `OJ` row at dose `1` equals `22.7`. Larger doses yield larger means within each supplement.

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_3 <- tapply(ToothGrowth$len, list(ToothGrowth$supp, ToothGrowth$dose), mean)
ex_5_3
#>     0.5    1    2
#> OJ 13.23 22.7 26.06
#> VC  7.98 16.77 26.14
```

**Explanation:** Passing a list of two indices to `tapply()` produces a 2-D output (a matrix) with one dimension per index, instead of a flat vector. The order of the index list controls the row vs. column orientation. This is the cleanest way in base R to build a cross-tabulated mean table, no `pivot_wider()` required. If a particular `(supp, dose)` cell is empty, the matrix entry would be `NA`; check with `is.na(ex_5_3)` before downstream arithmetic.

</details>

## Section 6. Apply family in real workflows (5 problems)

### Exercise 6.1: Per-column NA count for a quick QA

**Task:** A data engineer needs a one-line QA report listing the number of NAs in every column of `airquality` so a downstream pipeline step can decide whether to impute or drop. Use `sapply()` with an anonymous function applying `is.na` and `sum`, saving the named integer vector to `ex_6_1`.

**Dataset:** `airquality` is a 153-row NYC air-quality dataset. All six columns numeric; `Ozone` and `Solar.R` carry the NAs.

**Expected result:** A named integer vector of length 6. `Ozone` equals `37`, `Solar.R` equals `7`, the remaining four (`Wind`, `Temp`, `Month`, `Day`) equal `0`. Total NAs across all columns equal `44`.

**Difficulty:** Intermediate

```r title="Your turn"
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_1 <- sapply(airquality, function(x) sum(is.na(x)))
ex_6_1
#>   Ozone Solar.R    Wind    Temp   Month     Day
#>      37       7       0       0       0       0
```

**Explanation:** `is.na()` is vectorised, so `sum(is.na(x))` collapses the per-element logical vector into a count. `sapply()` walks every column of the data frame and collects the per-column scalar. For type-stable behaviour in production code, switch to `vapply(airquality, function(x) sum(is.na(x)), integer(1))` so the result is guaranteed to be an integer vector. Tidyverse equivalent: `dplyr::summarise(across(everything(), ~ sum(is.na(.))))`.

</details>

### Exercise 6.2: Mean-center iris columns with apply + sweep

**Task:** A statistician preparing `iris` for PCA needs all four numeric columns mean-centered (column mean subtracted from every value). Use `apply()` to compute per-column means, then `sweep()` along margin 2 with `FUN = "-"`, saving the centered numeric matrix to `ex_6_2`.

**Dataset:** `iris` has 150 rows. Use only the four numeric columns: `Sepal.Length`, `Sepal.Width`, `Petal.Length`, `Petal.Width`.

**Expected result:** A 150 x 4 numeric matrix. Every column has a mean essentially equal to zero (verify with `round(colMeans(ex_6_2), 10)`). Column names match the original four iris columns. Row count and column count are preserved.

**Difficulty:** Intermediate

```r title="Your turn"
ex_6_2 <- # your code here
head(ex_6_2, 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
col_means <- apply(iris[, 1:4], 2, mean)
ex_6_2 <- sweep(as.matrix(iris[, 1:4]), 2, col_means, FUN = "-")
head(ex_6_2, 3)
#>      Sepal.Length Sepal.Width Petal.Length Petal.Width
#> [1,]   -0.7433333    0.442667     -2.358   -0.998667
#> [2,]   -0.9433333   -0.057333     -2.358   -0.998667
#> [3,]   -1.1433333    0.142667     -2.458   -0.998667
```

**Explanation:** `apply()` produces the per-column statistic; `sweep()` then broadcasts that vector along the chosen margin and applies the operator. Margin `2` sweeps across columns, so each row gets the column-specific mean subtracted. Use `as.matrix()` because `sweep()` is matrix-native. The single-line shortcut `scale(iris[, 1:4], center = TRUE, scale = FALSE)` does the same job and adds an attribute trail so you can recover the centring values later. The `apply` + `sweep` pattern shines when the per-column statistic is custom (winsorised mean, geometric mean, anything `scale()` cannot do).

</details>

### Exercise 6.3: Per-cylinder summary frame with lapply + do.call

**Task:** A reporting analyst wants a tidy data frame with one row per `cyl` level holding `n`, `mean_mpg`, and `sd_mpg`. Use `lapply()` over `split(mtcars, mtcars$cyl)` returning a one-row data frame per group, then bind with `do.call(rbind, .)`, and save the data frame to `ex_6_3`.

**Dataset:** `mtcars` is 32 rows. Columns used: `mpg` (numeric) and `cyl` (numeric grouping variable: 4, 6, 8).

**Expected result:** A data frame with 3 rows and 4 columns: `cyl`, `n`, `mean_mpg`, `sd_mpg`. The `cyl == 4` row has `n = 11`, `mean_mpg = 26.66`, `sd_mpg = 4.51` (rounded). Row names are the cylinder labels (`"4"`, `"6"`, `"8"`).

**Difficulty:** Advanced

```r title="Your turn"
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
parts <- lapply(split(mtcars, mtcars$cyl), function(d) {
  data.frame(cyl = unique(d$cyl), n = nrow(d),
             mean_mpg = mean(d$mpg), sd_mpg = sd(d$mpg))
})
ex_6_3 <- do.call(rbind, parts)
ex_6_3
#>   cyl  n mean_mpg   sd_mpg
#> 4   4 11 26.66364 4.509828
#> 6   6  7 19.74286 1.453567
#> 8   8 14 15.10000 2.560048
```

**Explanation:** `split()` produces a named list of per-group data frames; `lapply()` reduces each subset to a one-row summary frame; `do.call(rbind, .)` stacks them into the final tidy frame. This split-apply-combine triplet is the base-R cousin of `dplyr::group_by() %>% summarise()`. The `do.call()` step matters because `rbind()` is a binary operator: passing a list to `do.call(rbind, list_of_frames)` is equivalent to `Reduce(rbind, list_of_frames)` but faster on long lists. For very large groupings, `dplyr` or `data.table` will outpace this idiom, but the pattern is portable to any environment without those packages.

</details>

### Exercise 6.4: Custom percentile per group via tapply

**Task:** A growth team wants the 90th-percentile sepal length per `Species` in `iris` so they can flag unusually large flowers in a future field survey. Use `tapply()` with `Sepal.Length` as the value, `Species` as the index, and a custom function returning `quantile(x, 0.9)`. Save the named numeric vector to `ex_6_4`.

**Dataset:** `iris` has 150 rows; `Sepal.Length` (numeric, cm) and `Species` (3-level factor).

**Expected result:** A named numeric vector of length 3 with names `setosa`, `versicolor`, `virginica`. Approximate values: `setosa` `5.41`, `versicolor` `6.7`, `virginica` `7.7`. The factor order (alphabetical) is preserved in the output.

**Difficulty:** Advanced

```r title="Your turn"
ex_6_4 <- # your code here
ex_6_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_4 <- tapply(iris$Sepal.Length, iris$Species,
                 function(x) unname(quantile(x, 0.9)))
ex_6_4
#>   setosa versicolor  virginica
#>     5.41       6.70       7.70
```

**Explanation:** `quantile()` returns a named numeric vector of length 1 (named `90%`) when called with a single probability. The `unname()` strips that inner name so the outer `tapply()` names (`setosa`, `versicolor`, `virginica`) appear cleanly in the result. Without `unname()`, every element of the output would also carry the `90%` tag, which clutters downstream printing and confuses extraction by name. For multiple quantiles (say 0.1, 0.5, 0.9 in one go), the per-group return becomes a 3-vector and `tapply()` returns a list rather than a vector.

</details>

### Exercise 6.5: Type-safe column reducer with vapply

**Task:** A platform engineer is hardening a data-validation library and needs a column reducer that always returns a numeric scalar, errors on type drift, and works on `mtcars`. Use `vapply()` with `FUN.VALUE = numeric(1)` and `function(x) sum(x > median(x))`, saving the named numeric vector to `ex_6_5`.

**Dataset:** `mtcars` has 32 rows; all 11 columns are numeric.

**Expected result:** A named numeric vector of length 11 (one entry per column). For `mpg`, the count of cars strictly above the column median equals `15`. For `am` (binary 0/1), the count equals `13` (the number of manual cars, since the median is `0`).

**Difficulty:** Advanced

```r title="Your turn"
ex_6_5 <- # your code here
ex_6_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_5 <- vapply(mtcars, function(x) sum(x > median(x)), numeric(1))
ex_6_5
#>  mpg  cyl disp   hp drat   wt qsec   vs   am gear carb
#>   15   11   16   16   16   16   16   14   13   16   16
```

**Explanation:** `vapply()` enforces a per-iteration return contract via `FUN.VALUE`. Pass `numeric(1)` and any iteration that returns a different type or length raises an error, which is exactly what you want in a CI-style validator. The body `sum(x > median(x))` is a quick "above-median" count: for ties at the median, the strict `>` excludes them, which is why columns like `mpg` (with two values exactly at the median 19.2) report `15` instead of `16`. Replace `>` with `>=` if you would rather count the ties on the high side.

</details>

## What to do next

Sharpen the family further:

- [base R apply family explained](base-apply-in-R.html) revisits when each member is the right tool, with side-by-side timing comparisons.
- [Functional programming in R](Functional-Programming-in-R.html) puts the apply family inside the broader pure-function style (closures, higher-order functions, function factories).
- [R lists exercises](R-Lists-Exercises.html) drill the list manipulation skills the lapply family depends on.
- [dplyr exercises](dplyr-Exercises-in-R.html) cover the tidyverse alternative to tapply and aggregated apply patterns, useful when your data lives in a tibble.
