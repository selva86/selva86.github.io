---
title: "R Beginner Exercises: 30 Hands-on Practice Problems"
slug: "R-Beginner-Exercises"
description: "Thirty beginner R exercises with hidden solutions: vectors, data frames, subsetting, summaries, control flow, functions, and base plots. Runnable in the browser."
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

# R Beginner Exercises: 30 Hands-on Practice Problems

<p class="lead">Thirty short R practice problems built for newcomers. Every exercise gives you a clear task, the exact expected output, and a hidden worked solution with an explanation. Topics covered: vectors, data frames, subsetting, summary statistics, control flow, custom functions, and base plotting.</p>

```r title="Run this once before any exercise"
library(datasets)   # mtcars, iris, airquality, ChickWeight
library(graphics)   # plot, hist, boxplot, barplot, pie
library(stats)      # mean, sd, var, cor, lm, aggregate, quantile
```

## Section 1. Vectors and arithmetic (5 problems)

### Exercise 1.1: Build a numeric vector and check its type

**Task:** Use the `c()` constructor to build a numeric vector holding the five values 4, 9, 16, 25, 36. Then call `class()` on the vector to confirm R stored it as numeric, not integer. Save the vector itself to `ex_1_1` and print it.

**Expected result:**

```
#> [1]  4  9 16 25 36
#> [1] "numeric"
```

**Difficulty:** Beginner

[HINTS]
Think about which constructor bundles several separate values into one vector, and what label R attaches to plain whole numbers by default.
Use `c()` to combine the five values, then `class()` on the result to inspect its type.

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
class(ex_1_1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- c(4, 9, 16, 25, 36)
ex_1_1
#> [1]  4  9 16 25 36
class(ex_1_1)
#> [1] "numeric"
```

**Explanation:** Bare numeric literals default to "numeric" (double precision), even when every value is a whole number. To force the integer type, append `L`: `c(4L, 9L, 16L, 25L, 36L)`. The distinction matters when you interact with C, Rcpp, or database drivers that care about column types. For most analysis code numeric is the right default.

</details>

### Exercise 1.2: Sum of squares from 1 to 100

**Task:** A student verifying the closed-form formula wants to check that the sum of squares from 1 to 100 equals 338350. Compute the sum using a vectorized expression (no loop) by squaring the sequence `1:100` and passing it to `sum()`. Save the resulting scalar to `ex_1_2`.

**Expected result:**

```
#> [1] 338350
```

**Difficulty:** Beginner

[HINTS]
Square every element of the sequence first, then collapse all the squared values into a single total.
Build the sequence with `1:100`, raise it with `^2`, and total it with `sum()`.

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- sum((1:100)^2)
ex_1_2
#> [1] 338350
```

**Explanation:** `1:100` produces an integer sequence, `^2` squares each element in place, and `sum()` collapses the result to a scalar. The whole expression runs in a single C-level loop, which is far faster than an explicit R `for` loop accumulating into a variable. The closed-form formula n(n+1)(2n+1)/6 confirms the answer: 100 * 101 * 201 / 6.

</details>

### Exercise 1.3: Find numbers divisible by both 3 and 5

**Task:** From the integers 1 to 50, find the elements that are divisible by both 3 and 5 (so divisible by 15). Combine two logical conditions with `&` inside a single subsetting expression and save the resulting integer vector to `ex_1_3`.

**Expected result:**

```
#> [1] 15 30 45
```

**Difficulty:** Beginner

[HINTS]
Test each number against both divisibility conditions, then keep only the positions where both are true.
Use the modulo operator `%%` for each remainder test and join the two checks with `&` inside the subsetting brackets.

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
x <- 1:50
ex_1_3 <- x[x %% 3 == 0 & x %% 5 == 0]
ex_1_3
#> [1] 15 30 45
```

**Explanation:** `%%` is the modulo operator; `x %% 3 == 0` is a length-50 logical vector that is TRUE on multiples of 3. Combining two such vectors with `&` gives an element-wise AND, and bracketing keeps the TRUE positions. Use `|` for OR, and `xor()` for exclusive OR. This idiom replaces verbose `for` loops with explicit `if` checks.

</details>

### Exercise 1.4: Extract the three largest values from a vector

**Task:** A retail analyst preparing a weekly top-sellers report has the vector `sales <- c(220, 175, 410, 95, 360, 280, 410, 130)`. Return the three largest values in descending order using `sort()` and bracket subsetting. Save the resulting length-three numeric vector to `ex_1_4`.

**Expected result:**

```
#> [1] 410 410 360
```

**Difficulty:** Intermediate

[HINTS]
Arrange the values from highest to lowest, then take just the front of that arrangement.
Call `sort()` with `decreasing = TRUE`, then slice the first three positions with `[1:3]`.

```r title="Your turn"
sales <- c(220, 175, 410, 95, 360, 280, 410, 130)
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
sales <- c(220, 175, 410, 95, 360, 280, 410, 130)
ex_1_4 <- sort(sales, decreasing = TRUE)[1:3]
ex_1_4
#> [1] 410 410 360
```

**Explanation:** `sort()` returns the values themselves, in this case repeating 410 because there are two ties. If you needed the positions instead, use `order(sales, decreasing = TRUE)[1:3]`, which returns indices. For very large vectors `head(sort(...), 3)` is no faster than slicing with `[1:3]`; both still sort the whole vector. A partial sort via `sort.int(..., partial = ...)` is faster when N is huge.

</details>

### Exercise 1.5: Generate indices with seq_along

**Task:** Use `seq_along()` to produce an integer index vector for the character vector `cities <- c("Mumbai", "Delhi", "Bengaluru", "Chennai")`. The output should run from 1 to the length of the input, matching the position of each element. Save the resulting indices to `ex_1_5`.

**Expected result:**

```
#> [1] 1 2 3 4
```

**Difficulty:** Beginner

[HINTS]
You want one index per element, running from the first position to the last.
Pass the `cities` vector to `seq_along()`.

```r title="Your turn"
cities <- c("Mumbai", "Delhi", "Bengaluru", "Chennai")
ex_1_5 <- # your code here
ex_1_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
cities <- c("Mumbai", "Delhi", "Bengaluru", "Chennai")
ex_1_5 <- seq_along(cities)
ex_1_5
#> [1] 1 2 3 4
```

**Explanation:** `seq_along(x)` is safer than `1:length(x)` because it returns an empty integer vector when `x` is empty, whereas `1:length(x)` returns `c(1, 0)` and silently iterates twice. Always prefer `seq_along()` (or `seq_len(n)`) inside `for` loops over `1:length(x)`. This single substitution prevents the most common off-by-one bug in beginner R code.

</details>

## Section 2. Data frames and built-in datasets (5 problems)

### Exercise 2.1: Build a data frame from parallel vectors

**Task:** A marketing analyst is logging a small campaign experiment. Build a data frame with three columns: `channel` (vector of "email", "social", "search"), `clicks` (210, 540, 780), and `cost` (45, 120, 300). Save the resulting three-row data frame to `ex_2_1` and print it.

**Expected result:**

```
#>   channel clicks cost
#> 1   email    210   45
#> 2  social    540  120
#> 3  search    780  300
```

**Difficulty:** Beginner

[HINTS]
Each named column of the table comes from its own equal-length vector.
Call `data.frame()` with `channel`, `clicks`, and `cost` as named arguments.

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- data.frame(
  channel = c("email", "social", "search"),
  clicks  = c(210, 540, 780),
  cost    = c(45, 120, 300)
)
ex_2_1
#>   channel clicks cost
#> 1   email    210   45
#> 2  social    540  120
#> 3  search    780  300
```

**Explanation:** `data.frame()` takes named vector arguments; each vector becomes a column. Since R 4.0 character columns are kept as character by default (older R versions auto-converted to factor, which surprised many beginners). All input vectors must share a length or be a length-one recyclable scalar. The tibble equivalent `tibble::tibble()` skips row names and prints more compactly.

</details>

### Exercise 2.2: Look at the dimensions of a built-in dataset

**Task:** Inspect the `ChickWeight` dataset (a base R dataset on chick growth experiments) by reporting its row and column counts as a length-two integer vector using a single function call. Save the dimensions to `ex_2_2` and print them.

**Expected result:**

```
#> [1] 578   4
```

**Difficulty:** Beginner

[HINTS]
You need both the row and column counts returned together in a single length-two result.
Pass `ChickWeight` to `dim()`.

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- dim(ChickWeight)
ex_2_2
#> [1] 578   4
```

**Explanation:** `dim()` returns rows first, columns second, consistent with how R indexes `[row, column]`. The separate helpers `nrow()` and `ncol()` return each piece individually. On a matrix `dim()` works identically; on a plain vector it returns `NULL`, so use `length()` for one-dimensional objects. Always check dimensions before joins or column-wise operations to catch silent shape bugs.

</details>

### Exercise 2.3: Add a computed column with a vectorized expression

**Task:** A motoring magazine writing in metric units wants to add a `wt_kg` column to `mtcars` that converts the imperial `wt` column (thousands of pounds) to kilograms by multiplying by 453.592. Add the column and save the resulting wider data frame to `ex_2_3`.

**Expected result:**

```
#>                    mpg cyl disp  hp drat   wt ... wt_kg
#> Mazda RX4         21.0   6  160 110 3.90 2.62 ... 1188.4
#> Mazda RX4 Wag     21.0   6  160 110 3.90 2.88 ... 1304.0
#> Datsun 710        22.8   4  108  93 3.85 2.32 ... 1052.3
#> ...
```

**Difficulty:** Beginner

[HINTS]
Multiply the existing weight column by the conversion factor; the operation runs across every row at once.
Reference the `ex_2_3$wt` column and multiply it by `453.592`.

```r title="Your turn"
ex_2_3 <- mtcars
ex_2_3$wt_kg <- # your code here
head(ex_2_3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- mtcars
ex_2_3$wt_kg <- ex_2_3$wt * 453.592
head(ex_2_3[, c("wt", "wt_kg")])
#>                    wt    wt_kg
#> Mazda RX4        2.620 1188.41
#> Mazda RX4 Wag    2.875 1303.55
#> Datsun 710       2.320 1052.33
#> ...
```

**Explanation:** Assigning to `df$newcol <- value` either creates a column or overwrites it in place. The right-hand expression must be either a scalar (which gets recycled) or a vector with the same length as `nrow(df)`. The dplyr equivalent is `mutate(mtcars, wt_kg = wt * 453.592)`, which is friendlier inside a pipe chain. Both produce identical results.

</details>

### Exercise 2.4: Append a row with rbind

**Task:** Starting from the small inventory data frame `inv <- data.frame(item = c("pen", "notebook"), qty = c(40, 15))`, append a new row containing item "stapler" and qty 8 using `rbind()`. Save the resulting three-row data frame to `ex_2_4`.

**Expected result:**

```
#>       item qty
#> 1      pen  40
#> 2 notebook  15
#> 3  stapler   8
```

**Difficulty:** Beginner

[HINTS]
Stack a one-row table beneath the existing one, matching its column names and types.
Call `rbind()` with `inv` and a new `data.frame(item = "stapler", qty = 8)`.

```r title="Your turn"
inv <- data.frame(item = c("pen", "notebook"), qty = c(40, 15))
ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
inv <- data.frame(item = c("pen", "notebook"), qty = c(40, 15))
ex_2_4 <- rbind(inv, data.frame(item = "stapler", qty = 8))
ex_2_4
#>       item qty
#> 1      pen  40
#> 2 notebook  15
#> 3  stapler   8
```

**Explanation:** `rbind()` requires that the new row match column names and types. Passing a bare named list or a vector works but is fragile; wrapping in `data.frame()` is the safest pattern. For repeated appending inside a loop, prefer collecting rows in a list and calling `do.call(rbind, list_of_rows)` once at the end. dplyr's `bind_rows()` is more tolerant of missing columns and aligns by name.

</details>

### Exercise 2.5: Convert a factor column to character

**Task:** The `iris` dataset stores `Species` as a factor. For downstream string manipulation you often need it as plain character. Convert the column with `as.character()` and save the resulting length-150 character vector to `ex_2_5`. Print the first six values to verify.

**Expected result:**

```
#> [1] "setosa" "setosa" "setosa" "setosa" "setosa" "setosa"
```

**Difficulty:** Intermediate

[HINTS]
Convert the factor's text labels into a plain character vector rather than its internal integer codes.
Apply `as.character()` to `iris$Species`.

```r title="Your turn"
ex_2_5 <- # your code here
head(ex_2_5)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_5 <- as.character(iris$Species)
head(ex_2_5)
#> [1] "setosa" "setosa" "setosa" "setosa" "setosa" "setosa"
```

**Explanation:** Factors are stored internally as integer codes with a `levels` attribute; `as.character()` looks up each code and returns the label. A common trap is calling `as.numeric(factor_var)`, which returns the underlying integer codes (1, 2, 3), not the original numeric values. To recover the original numbers from a numeric factor, write `as.numeric(as.character(factor_var))`.

</details>

## Section 3. Subsetting and filtering (5 problems)

### Exercise 3.1: Drop a column with negative indexing

**Task:** Return a version of `mtcars` that excludes the `carb` column (the last column) using negative integer indexing inside bracket notation. Keep every other column and every row. Save the resulting ten-column data frame to `ex_3_1` and verify with `ncol()`.

**Expected result:**

```
#> [1] 10
#> [1] "carb" not in column names: TRUE
```

**Difficulty:** Beginner

[HINTS]
Find the position of the unwanted column, then exclude just that position while keeping every row.
Locate the index with `which(names(mtcars) == "carb")` and negate it inside the column slot of `[ , ]`.

```r title="Your turn"
ex_3_1 <- # your code here
ncol(ex_3_1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- mtcars[, -which(names(mtcars) == "carb")]
ncol(ex_3_1)
#> [1] 10
cat("\"carb\" not in column names:", !"carb" %in% names(ex_3_1), "\n")
#> "carb" not in column names: TRUE
```

**Explanation:** Negative integers inside `[ , ]` mean "exclude these positions". Looking up the position by name with `which(names(df) == "carb")` is robust if the column order ever changes. A simpler alternative is `mtcars[, names(mtcars) != "carb"]`, which uses a logical vector. dplyr's `select(mtcars, -carb)` is the cleanest one-liner once you graduate from base R.

</details>

### Exercise 3.2: Filter rows with subset() and the formula style

**Task:** A horticulturist studying `iris` wants only the flowers with `Sepal.Width` greater than 3.5 across all species. Use `subset()` so you can refer to column names without the `$` prefix. Save the filtered data frame to `ex_3_2` and report its row count with `nrow()`.

**Expected result:**

```
#> [1] 20
#> rows removed: 130
```

**Difficulty:** Intermediate

[HINTS]
Filter the rows by a condition while referring to the column by its bare name, no `$` prefix.
Call `subset()` with `iris` and the condition `Sepal.Width > 3.5`.

```r title="Your turn"
ex_3_2 <- # your code here
nrow(ex_3_2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- subset(iris, Sepal.Width > 3.5)
nrow(ex_3_2)
#> [1] 20
cat("rows removed:", nrow(iris) - nrow(ex_3_2), "\n")
#> rows removed: 130
```

**Explanation:** `subset()` evaluates its condition in the context of the data frame, so `Sepal.Width` resolves without `iris$`. Inside packages and functions this non-standard evaluation can backfire if a column name matches a variable in scope; in those cases prefer `iris[iris$Sepal.Width > 3.5, ]`. dplyr's `filter()` is the modern replacement and behaves predictably inside functions when paired with `.data$Sepal.Width`.

</details>

### Exercise 3.3: Match a category against a set with %in%

**Task:** From `mtcars` keep only cars whose number of `gear` values is either 4 or 5 (so a two-element set). Use the `%in%` operator inside row-bracket subsetting. Save the filtered data frame to `ex_3_3` and report the row count.

**Expected result:**

```
#> [1] 17
#> gears kept: 4 5
```

**Difficulty:** Beginner

[HINTS]
Test whether each row's gear value belongs to a small set of allowed values.
Use `%in% c(4, 5)` on `mtcars$gear` as the row condition inside `[ , ]`.

```r title="Your turn"
ex_3_3 <- # your code here
nrow(ex_3_3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- mtcars[mtcars$gear %in% c(4, 5), ]
nrow(ex_3_3)
#> [1] 17
cat("gears kept:", sort(unique(ex_3_3$gear)), "\n")
#> gears kept: 4 5
```

**Explanation:** `%in%` returns a logical vector the same length as the left-hand side, with TRUE where the element matches any value in the right-hand set. It is the vector-friendly substitute for chaining `==` with `|`: `cyl == 4 | cyl == 5 | cyl == 6` becomes `cyl %in% c(4, 5, 6)`. To exclude a set, negate the result with `!`: `!(gear %in% c(4, 5))`.

</details>

### Exercise 3.4: Find rows where a column is missing

**Task:** The `airquality` dataset has NAs in its `Ozone` column. Return only the rows where `Ozone` is missing using `is.na()` inside row-bracket subsetting. Save the resulting subset to `ex_3_4` and verify the count with `nrow()`.

**Expected result:**

```
#> [1] 37
#> total rows in airquality: 153
```

**Difficulty:** Intermediate

[HINTS]
Keep only the rows where the column holds no recorded value.
Use `is.na(airquality$Ozone)` as the row condition inside `[ , ]`.

```r title="Your turn"
ex_3_4 <- # your code here
nrow(ex_3_4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_4 <- airquality[is.na(airquality$Ozone), ]
nrow(ex_3_4)
#> [1] 37
cat("total rows in airquality:", nrow(airquality), "\n")
#> total rows in airquality: 153
```

**Explanation:** Use `is.na()` to test for NA, never `== NA`, because any comparison with NA returns NA (not TRUE or FALSE) and the subset silently keeps zero rows. The complement is `!is.na(col)` for the non-missing rows. For multiple columns, combine with `&` and `|` as needed, or use `complete.cases(df[, cols])` to check several columns at once.

</details>

### Exercise 3.5: Order a data frame by a column

**Task:** Sort the entire `mtcars` data frame in descending order by `mpg` so the most fuel-efficient car ends up in row one. Use `order()` to compute the row indices and bracket subsetting to reorder. Save the reordered data frame to `ex_3_5` and inspect the top three rows with `head(..., 3)`.

**Expected result:**

```
#>                 mpg cyl disp hp drat    wt qsec vs am gear carb
#> Toyota Corolla 33.9   4 71.1 65 4.22 1.835 19.9  1  1    4    1
#> Fiat 128       32.4   4 78.7 66 4.08 2.200 19.5  1  1    4    1
#> Honda Civic    30.4   4 75.7 52 4.93 1.615 18.5  1  1    4    2
```

**Difficulty:** Intermediate

[HINTS]
Compute the row order that sorts the table by the column, then apply that order back to all the rows.
Pass `mtcars$mpg` with `decreasing = TRUE` to `order()` and use the result in the row slot of `[ , ]`.

```r title="Your turn"
ex_3_5 <- # your code here
head(ex_3_5, 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_5 <- mtcars[order(mtcars$mpg, decreasing = TRUE), ]
head(ex_3_5, 3)
#>                 mpg cyl disp hp drat    wt qsec vs am gear carb
#> Toyota Corolla 33.9   4 71.1 65 4.22 1.835 19.9  1  1    4    1
#> Fiat 128       32.4   4 78.7 66 4.08 2.200 19.5  1  1    4    1
#> Honda Civic    30.4   4 75.7 52 4.93 1.615 18.5  1  1    4    2
```

**Explanation:** `order(x)` returns the permutation of indices that would sort `x` ascending; pass `decreasing = TRUE` to flip. Multi-key sorting works by passing several vectors: `order(cyl, -mpg)` sorts by cylinder ascending, breaking ties on descending mpg. `sort()` sorts the values themselves but does not reorder companion columns, so for tabular data `order()` is the right tool.

</details>

## Section 4. Summaries and basic statistics (5 problems)

### Exercise 4.1: Mean and standard deviation of a column

**Task:** Compute the arithmetic mean and the sample standard deviation of `mtcars$mpg` and combine the two values into a named numeric vector with names `"mean"` and `"sd"`. Save the resulting length-two named vector to `ex_4_1` and print it.

**Expected result:**

```
#>      mean        sd
#> 20.09063   6.02695
```

**Difficulty:** Intermediate

[HINTS]
Compute the two statistics separately, then bind them into one vector that carries a label for each.
Call `mean()` and `sd()` on `mtcars$mpg`, combining them as `c(mean = ..., sd = ...)`.

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- c(mean = mean(mtcars$mpg), sd = sd(mtcars$mpg))
ex_4_1
#>      mean        sd
#> 20.09063   6.02695
```

**Explanation:** `sd()` in R divides by n minus 1 (sample standard deviation), which is the unbiased estimator. If you actually need the population standard deviation (divide by n), multiply by `sqrt((n-1)/n)`. Naming vector elements with `c(name = value, ...)` is a fast way to keep labels next to numbers. For multiple columns, `sapply(mtcars, function(x) c(mean = mean(x), sd = sd(x)))` returns a tidy two-row matrix.

</details>

### Exercise 4.2: Quantiles at custom probabilities

**Task:** A risk analyst preparing a stress test wants the 5th, 50th, and 95th percentiles of the `Wind` column in `airquality`. Pass the probabilities as a numeric vector to `quantile()` and remove NAs. Save the resulting length-three named vector to `ex_4_2` and print it.

**Expected result:**

```
#>   5%   50%   95%
#> 3.45  9.70 16.40
```

**Difficulty:** Intermediate

[HINTS]
Ask for the three cut points at the requested fractions, and make sure missing values do not poison the result.
Call `quantile()` with `probs = c(0.05, 0.50, 0.95)` and `na.rm = TRUE`.

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- quantile(airquality$Wind, probs = c(0.05, 0.50, 0.95), na.rm = TRUE)
ex_4_2
#>   5%   50%   95%
#> 3.45  9.70 16.40
```

**Explanation:** Without `na.rm = TRUE`, even a single NA propagates and the result is NA across the board. The `probs` argument can take any vector in [0, 1]. R has nine different `type` options for how interpolation between observed values is done; `type = 7` is the default and the only one most users will ever need. For extreme tails on small samples consider a parametric model instead of empirical quantiles.

</details>

### Exercise 4.3: Group means with tapply

**Task:** Compute the mean `mpg` for each level of `cyl` in `mtcars` using `tapply()`. The output should be a named numeric vector with one element per cylinder count (4, 6, 8). Save the resulting vector to `ex_4_3` and print it.

**Expected result:**

```
#>        4        6        8
#> 26.66364 19.74286 15.10000
```

**Difficulty:** Intermediate

[HINTS]
Split the values into groups defined by the cylinder column, then summarize each group.
Call `tapply()` with `mtcars$mpg`, `mtcars$cyl`, and `mean`.

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- tapply(mtcars$mpg, mtcars$cyl, mean)
ex_4_3
#>        4        6        8
#> 26.66364 19.74286 15.10000
```

**Explanation:** `tapply(X, INDEX, FUN)` splits `X` by `INDEX` and applies `FUN` to each group. The output is a vector when there is one grouping variable and an array when there are several. The modern equivalent in dplyr is `mtcars |> group_by(cyl) |> summarise(mean(mpg))`, which returns a tibble instead of a named vector. `aggregate()` is a halfway alternative that returns a data frame in base R.

</details>

### Exercise 4.4: Correlation between two columns

**Task:** Compute the Pearson correlation coefficient between `hp` (horsepower) and `mpg` (miles per gallon) in `mtcars`. The value should be negative since heavier-engine cars typically consume more fuel. Save the resulting single numeric scalar to `ex_4_4` and print it.

**Expected result:**

```
#> [1] -0.7761684
```

**Difficulty:** Beginner

[HINTS]
Measure how strongly the two columns move together in a straight-line sense.
Pass `mtcars$hp` and `mtcars$mpg` to `cor()`.

```r title="Your turn"
ex_4_4 <- # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_4 <- cor(mtcars$hp, mtcars$mpg)
ex_4_4
#> [1] -0.7761684
```

**Explanation:** `cor()` defaults to Pearson, which measures linear association. For monotonic but non-linear relationships pass `method = "spearman"`. To get a correlation matrix for many columns at once, call `cor(mtcars)`. Correlation does not imply causation, and a correlation near zero only rules out linear association; non-linear dependence can still be strong (think of a parabola, which has Pearson cor ~ 0).

</details>

### Exercise 4.5: Cross-tabulate two categorical columns

**Task:** Build a contingency table that cross-tabulates `mtcars$cyl` against `mtcars$gear`, showing how many cars share each combination. Use `table()` with both columns. Save the resulting two-dimensional table to `ex_4_5` and print it.

**Expected result:**

```
#>      gear
#> cyl    3  4  5
#>   4    1  8  2
#>   6    2  4  1
#>   8   12  0  2
```

**Difficulty:** Intermediate

[HINTS]
Count how many rows fall into each combination of the two categorical columns.
Pass both columns to `table()`, naming the arguments `cyl` and `gear`.

```r title="Your turn"
ex_4_5 <- # your code here
ex_4_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_5 <- table(cyl = mtcars$cyl, gear = mtcars$gear)
ex_4_5
#>      gear
#> cyl    3  4  5
#>   4    1  8  2
#>   6    2  4  1
#>   8   12  0  2
```

**Explanation:** Passing two arguments to `table()` produces a row-by-column matrix; naming each argument labels the dimensions of the output. Wrap the result in `prop.table()` to convert counts to proportions, and pass `margin = 1` (rows) or `margin = 2` (columns) to normalize by one axis. For inferential tests, feed the table to `chisq.test()` or `fisher.test()` directly.

</details>

## Section 5. Control flow and functions (5 problems)

### Exercise 5.1: Vectorized branching with ifelse

**Task:** Given the temperature vector `temps <- c(18, 25, 31, 12, 29, 36, 22)` (in Celsius), label each element as "cold" (below 20), "warm" (20 to 29), or "hot" (30 or above). Use a nested `ifelse()` call. Save the resulting length-seven character vector to `ex_5_1` and print it.

**Expected result:**

```
#> [1] "cold" "warm" "hot"  "cold" "warm" "hot"  "warm"
```

**Difficulty:** Intermediate

[HINTS]
Apply the three-way labelling to every element at once, layering one test inside the false branch of another.
Nest one `ifelse()` (testing `< 20`) inside another (testing `< 30`).

```r title="Your turn"
temps <- c(18, 25, 31, 12, 29, 36, 22)
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
temps <- c(18, 25, 31, 12, 29, 36, 22)
ex_5_1 <- ifelse(temps < 20, "cold",
                 ifelse(temps < 30, "warm", "hot"))
ex_5_1
#> [1] "cold" "warm" "hot"  "cold" "warm" "hot"  "warm"
```

**Explanation:** `ifelse()` is vectorized, evaluating the condition once per element of the input and picking from the matching branch. Nesting it works for three or more buckets but becomes hard to read past three levels. For four or more conditions, `dplyr::case_when()` is dramatically cleaner because each branch is on its own line, top to bottom, first match wins.

</details>

### Exercise 5.2: Write a function with default arguments

**Task:** Define a function `bmi` that takes `weight_kg` and `height_m` and returns the body mass index as `weight_kg / height_m^2`. Give `height_m` a default of 1.7 so a single-argument call uses the average height. Test it with `bmi(70)` and save the resulting numeric scalar to `ex_5_2`.

**Expected result:**

```
#> [1] 24.22145
```

**Difficulty:** Beginner

[HINTS]
The function body only needs the BMI division formula; the default value handles a missing second argument.
Return `weight_kg / height_m^2` as the last expression in the body.

```r title="Your turn"
bmi <- function(weight_kg, height_m = 1.7) {
  # your code here
}
ex_5_2 <- bmi(70)
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
bmi <- function(weight_kg, height_m = 1.7) {
  weight_kg / height_m^2
}
ex_5_2 <- bmi(70)
ex_5_2
#> [1] 24.22145
```

**Explanation:** Default values are evaluated lazily, only when the parameter is actually used inside the function body. That means a default can reference other parameters: `function(x, y = x * 2)`. Named arguments make calls self-documenting: `bmi(weight_kg = 70, height_m = 1.82)` is clearer than positional `bmi(70, 1.82)`. Keep the most commonly varied argument first.

</details>

### Exercise 5.3: Guard a function against bad input with stop

**Task:** Write a function `safe_log` that returns `log(x)` when `x` is strictly positive and calls `stop("x must be positive")` otherwise. Test it on `safe_log(7.389)` (the value of e squared) and save the resulting numeric scalar to `ex_5_3`.

**Expected result:**

```
#> [1] 2.000128
```

**Difficulty:** Intermediate

[HINTS]
Reject invalid input before doing any real work, and otherwise compute the result normally.
Guard with `if (x <= 0) stop("x must be positive")`, then return `log(x)`.

```r title="Your turn"
safe_log <- function(x) {
  # your code here
}
ex_5_3 <- safe_log(7.389)
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
safe_log <- function(x) {
  if (x <= 0) stop("x must be positive")
  log(x)
}
ex_5_3 <- safe_log(7.389)
ex_5_3
#> [1] 2.000128
```

**Explanation:** `stop()` throws an error and halts execution, which is the right reflex for invalid input that downstream code cannot recover from. Use `warning()` when the situation is suspicious but the code can continue with sensible defaults, and `message()` for purely informational text. Catch errors at the call site with `tryCatch()` if the caller wants to recover; `try()` is the older, less flexible alternative.

</details>

### Exercise 5.4: Repeat with break to find the first match

**Task:** Use a `repeat` loop to draw integers between 1 and 100 with `sample(1:100, 1)`, stopping as soon as you draw an integer greater than 95. To make the result reproducible call `set.seed(42)` first. Save the first qualifying integer to `ex_5_4`.

**Expected result:**

```
#> [1] 97
#> [1] "qualifying integer found"
```

**Difficulty:** Intermediate

[HINTS]
Keep drawing values until one clears the threshold, then leave the loop immediately.
Inside the loop test `if (draw > 95)`, store `draw` into `ex_5_4`, and exit with `break`.

```r title="Your turn"
set.seed(42)
ex_5_4 <- NULL
repeat {
  draw <- sample(1:100, 1)
  # break out when draw exceeds 95
}
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
ex_5_4 <- NULL
repeat {
  draw <- sample(1:100, 1)
  if (draw > 95) {
    ex_5_4 <- draw
    break
  }
}
ex_5_4
#> [1] 97
if (ex_5_4 > 95) "qualifying integer found"
#> [1] "qualifying integer found"
```

**Explanation:** `repeat` has no built-in exit condition, so an explicit `break` is mandatory. Without one the loop runs forever. `repeat` is the right choice when the stopping condition depends on values generated inside the body (rejection sampling, retry loops). For known iteration counts use `for`; for a condition on a quantity computed before each iteration, use `while`.

</details>

### Exercise 5.5: Build a closure that remembers its counter

**Task:** Write a constructor `make_counter` that returns a function which, each time it is called, returns the count of how many times it has been called so far. Build one counter, call it three times, and save the final returned value to `ex_5_5`.

**Expected result:**

```
#> [1] 3
#> independent counter starts fresh: 1
```

**Difficulty:** Advanced

[HINTS]
The constructor holds a tally that the returned inner function updates and reports back on each call.
Initialize `count <- 0`, then return an inner function that does `count <<- count + 1` before yielding `count`.

```r title="Your turn"
make_counter <- function() {
  # your code here
}
counter <- make_counter()
counter(); counter()
ex_5_5 <- counter()
ex_5_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
make_counter <- function() {
  count <- 0
  function() {
    count <<- count + 1
    count
  }
}
counter <- make_counter()
counter(); counter()
ex_5_5 <- counter()
ex_5_5
#> [1] 3
fresh <- make_counter()
cat("independent counter starts fresh:", fresh(), "\n")
#> independent counter starts fresh: 1
```

**Explanation:** The inner function "closes over" the `count` variable from its enclosing environment, preserving state across calls. The double-arrow `<<-` writes to the parent environment instead of creating a new local binding. Closures are the building block for stateful objects without an OOP system, and they power packages like rlang and purrr. Each call to `make_counter()` returns an independent counter.

</details>

## Section 6. Plotting and quick visuals (5 problems)

### Exercise 6.1: Draw a scatter plot with colored groups

**Task:** Draw a scatter plot of `Sepal.Length` against `Petal.Length` from `iris`, coloring the points by `Species`. Pass the factor to the `col` argument so each species gets its own automatic color. Save the marker string `"colored scatter drawn"` to `ex_6_1`.

**Expected result:**

```
# Scatter plot: x-axis Petal.Length 1 to 7, y-axis Sepal.Length 4.5 to 8, three color clusters
#> [1] "colored scatter drawn"
```

**Difficulty:** Intermediate

[HINTS]
The plot is already drawn; the variable just needs to hold the expected marker text for grading.
Assign the string `"colored scatter drawn"` to `ex_6_1`.

```r title="Your turn"
plot(iris$Petal.Length, iris$Sepal.Length, col = iris$Species)
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
plot(iris$Petal.Length, iris$Sepal.Length,
     col = iris$Species, pch = 19,
     xlab = "Petal.Length", ylab = "Sepal.Length")
legend("topleft", legend = levels(iris$Species),
       col = 1:3, pch = 19)
ex_6_1 <- "colored scatter drawn"
ex_6_1
#> [1] "colored scatter drawn"
```

**Explanation:** Base R turns a factor into its integer codes (1, 2, 3) when you pass it to `col`, picking colors from the default palette. `pch = 19` switches to solid filled circles. Always add a `legend()` manually because base graphics will not generate one automatically. The ggplot2 alternative `aes(color = Species)` handles legends automatically and is the right choice when figures need polishing.

</details>

### Exercise 6.2: Compare distributions with side-by-side histograms

**Task:** Draw two histograms on the same plotting region using `par(mfrow = c(1, 2))`: the first of `mtcars$mpg`, the second of `mtcars$hp`. Save the marker string `"two histograms drawn"` to `ex_6_2` so the variable exists for grading.

**Expected result:**

```
# Two histograms side by side, mpg (10-35) on left, hp (50-340) on right
#> [1] "two histograms drawn"
```

**Difficulty:** Intermediate

[HINTS]
The two histograms are already drawn; the variable only needs the grading marker text.
Assign the string `"two histograms drawn"` to `ex_6_2`.

```r title="Your turn"
par(mfrow = c(1, 2))
hist(mtcars$mpg, main = "mpg")
hist(mtcars$hp, main = "hp")
par(mfrow = c(1, 1))
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
par(mfrow = c(1, 2))
hist(mtcars$mpg, main = "mpg")
hist(mtcars$hp, main = "hp")
par(mfrow = c(1, 1))
ex_6_2 <- "two histograms drawn"
ex_6_2
#> [1] "two histograms drawn"
```

**Explanation:** `par(mfrow = c(rows, cols))` splits the plotting region into a grid that fills row by row; `par(mfcol = ...)` fills column by column instead. Reset to `c(1, 1)` after the multi-panel block, otherwise subsequent plots inherit the layout and surprise you. For richer arrangements the `layout()` function supports unequal panel sizes, and `patchwork` does the same for ggplot2 grobs.

</details>

### Exercise 6.3: Draw a pie chart from a category count

**Task:** Build a one-dimensional frequency table of `mtcars$gear` (counts of cars with three, four, and five gears) and pass it to `pie()` to render a pie chart with the gear counts as labels. Save the underlying frequency table to `ex_6_3`.

**Expected result:**

```
# Pie chart with three slices labelled 3, 4, 5
#>  3  4  5
#> 15 12  5
```

**Difficulty:** Beginner

[HINTS]
Build a one-dimensional count of the gear categories, then hand that table to the pie drawer.
Use `table(mtcars$gear)` to make the frequency table.

```r title="Your turn"
ex_6_3 <- # build the table here
pie(ex_6_3)
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_3 <- table(mtcars$gear)
pie(ex_6_3)
ex_6_3
#>  3  4  5
#> 15 12  5
```

**Explanation:** `pie()` accepts a numeric vector of counts and uses its names for labels; passing a `table` object gives you names for free. Pie charts are notoriously hard for humans to read accurately; for two or more slices a bar chart with `barplot()` is almost always preferable. Reach for a pie only with two or three slices and when communicating composition is the primary goal.

</details>

### Exercise 6.4: Visualize all pairs of columns with pairs()

**Task:** Use `pairs()` to draw a scatter plot matrix of the first four columns of `iris` (Sepal.Length, Sepal.Width, Petal.Length, Petal.Width). This gives a quick overview of every bivariate relationship at once. Save the marker string `"pairs matrix drawn"` to `ex_6_4`.

**Expected result:**

```
# 4-by-4 grid of scatter plots, diagonal blank, strong correlations between petal length and width
#> [1] "pairs matrix drawn"
```

**Difficulty:** Intermediate

[HINTS]
The scatter-plot matrix is already drawn; the variable just needs its marker text.
Assign the string `"pairs matrix drawn"` to `ex_6_4`.

```r title="Your turn"
pairs(iris[, 1:4])
ex_6_4 <- # your code here
ex_6_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
pairs(iris[, 1:4], col = iris$Species, pch = 19)
ex_6_4 <- "pairs matrix drawn"
ex_6_4
#> [1] "pairs matrix drawn"
```

**Explanation:** `pairs()` is the fastest way to spot strong linear relationships and outliers before fitting any model. The function takes either a data frame or a matrix and renders each pair on a separate panel. Coloring by a categorical variable (`col = Species`) often reveals that an apparent overall correlation is actually a group artifact. `GGally::ggpairs()` is the ggplot2 cousin with richer panels.

</details>

### Exercise 6.5: Draw multiple time series with matplot

**Task:** The `EuStockMarkets` time series matrix contains daily closing prices for four European indices (DAX, SMI, CAC, FTSE). Draw all four series on a single plot with `matplot()` so each column gets its own line. Save the marker string `"matplot drawn"` to `ex_6_5`.

**Expected result:**

```
# Four overlapping line series rising together over 1860 trading days, with a legend area
#> [1] "matplot drawn"
```

**Difficulty:** Advanced

[HINTS]
The multi-series line plot is already drawn; only the grading marker text remains.
Assign the string `"matplot drawn"` to `ex_6_5`.

```r title="Your turn"
matplot(EuStockMarkets, type = "l")
ex_6_5 <- # your code here
ex_6_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
matplot(EuStockMarkets, type = "l", lty = 1,
        col = 1:4, xlab = "trading day", ylab = "index value")
legend("topleft", legend = colnames(EuStockMarkets),
       col = 1:4, lty = 1)
ex_6_5 <- "matplot drawn"
ex_6_5
#> [1] "matplot drawn"
```

**Explanation:** `matplot()` plots each column of a matrix against a common x-axis, perfect for wide-format time series. `type = "l"` selects lines (use `"b"` for lines plus points). `lty = 1` forces a solid line across all series so they are distinguished only by color, which is usually easier to read than mixing line types. For long-format data, `ggplot2::geom_line(aes(group = series, color = series))` is the tidy alternative.

</details>

## What to do next

- Move on to package-based wrangling with [dplyr Exercises in R](dplyr-Exercises-in-R.html).
- Layer a cleaner visualization grammar in [ggplot2 Exercises in R](ggplot2-Exercises-in-R.html).
- Practice the full transformation toolkit in [Data Wrangling Exercises in R](Data-Wrangling-Exercises-in-R.html).
- Build statistical reasoning step by step with [Hypothesis Testing Exercises in R](Hypothesis-Testing-Exercises-in-R.html).
