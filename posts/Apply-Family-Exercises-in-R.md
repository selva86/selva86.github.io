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
difficulty: "Intermediate"
---

# Apply Family Exercises in R: 20 Real-World Practice Problems

<p class="lead">Twenty scenario-based problems on the apply family: lapply, sapply, apply, mapply, tapply, and vapply. Light on warm-ups, heavy on the intermediate cases where the trap is picking the right member of the family. Solutions are hidden behind reveal toggles so you try first.</p>

```r title="Run this once before any exercise"
library(datasets)
library(stats)
```

## Section 1. lapply foundations (3 problems)

### Exercise 1.1: Get the mean of every numeric column

**Difficulty:** Beginner

```r title="Your turn"
ex_1_1 <- # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- lapply(mtcars, mean)
ex_1_1$mpg
```

**Explanation:** lapply always returns a list, one element per input column. That makes it the safe default when you do not know whether every result will collapse to a scalar. Use unlist() or sapply() if you want a vector.

</details>

### Exercise 1.2: Summarise only the numeric columns of iris

**Scenario:** A biostatistician hands you `iris` and asks for the median of each measurement column. The `Species` column is a factor and must be excluded before computing anything.

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_2 <- # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
numeric_cols <- iris[, sapply(iris, is.numeric)]
ex_1_2 <- lapply(numeric_cols, median)
ex_1_2
```

**Explanation:** The inner sapply returns a logical vector picking numeric columns. Subsetting with that vector keeps only those columns, and lapply then runs median on each. Passing the whole iris frame would error on Species.

</details>

### Exercise 1.3: Run the same summary across several inline tables

**Scenario:** An ops engineer collects three daily latency vectors from the staging cluster and wants the 95th percentile of each, returned as a named list so the report can iterate.

**Difficulty:** Intermediate

```r title="Your turn"
latency <- list(
  day1 = c(120, 130, 140, 200, 250, 310, 95, 110),
  day2 = c(115, 125, 135, 180, 230, 290, 100, 105),
  day3 = c(140, 150, 160, 220, 270, 330, 115, 130)
)

ex_1_3 <- # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- lapply(latency, quantile, probs = 0.95)
ex_1_3
```

**Explanation:** Extra named arguments after the function get forwarded to each call: lapply(latency, quantile, probs = 0.95) is the idiomatic shortcut. Wrapping it in an anonymous function works too but is noisier and slower to read.

</details>

## Section 2. sapply: simplify when the shape is predictable (3 problems)

### Exercise 2.1: One number per column with sapply

**Scenario:** A marketing analyst wants a quick health check on the `airquality` dataset and asks for the count of missing values in each column as a named numeric vector.

**Difficulty:** Beginner

```r title="Your turn"
ex_2_1 <- # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- sapply(airquality, function(x) sum(is.na(x)))
ex_2_1
```

**Explanation:** sapply tries to simplify a list result. Because every column returns a single integer, you get a clean named numeric vector instead of a list. Switching to lapply here would force you to unlist later.

</details>

### Exercise 2.2: Correlate one column against every other numeric column

**Scenario:** A jeweller modelling diamond pricing wants to know how `carat` correlates with each of the other numeric columns in the `mtcars` style dataset. Use `mtcars` and compute correlations between `mpg` and every other numeric column.

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_2 <- # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
others <- mtcars[, setdiff(names(mtcars), "mpg")]
ex_2_2 <- sapply(others, function(x) cor(mtcars$mpg, x))
sort(ex_2_2)
```

**Explanation:** sapply over the remaining columns yields a named vector you can sort to spot strongest associations. Building a helper that closes over mtcars$mpg keeps the call short. cor() returns scalars so simplification is safe here.

</details>

### Exercise 2.3: Predict whether sapply returns a vector, matrix, or list

**Scenario:** A data engineer is debugging a pipeline that sometimes returns a matrix and sometimes a list from the same sapply call. Use `sapply(1:3, function(i) seq_len(i))` and explain why the return shape changes when the input changes.

**Difficulty:** Advanced

```r title="Your turn"
result_a <- sapply(1:3, function(i) seq_len(2))
result_b <- sapply(1:3, function(i) seq_len(i))

ex_2_3 <- # your code here: assign a list naming each result's class and dim
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- list(
  a_class = class(result_a),
  a_dim   = dim(result_a),
  b_class = class(result_b),
  b_dim   = dim(result_b)
)
ex_2_3
```

**Explanation:** When every iteration returns a vector of identical length, sapply binds them into a matrix. When lengths vary, it falls back to a list. This shape instability is the main reason production code prefers vapply, which forces a fixed return type.

</details>

## Section 3. apply over matrices and arrays (4 problems)

### Exercise 3.1: Row sums of an inline returns matrix

**Difficulty:** Beginner

```r title="Your turn"
returns <- matrix(c(0.01, -0.02, 0.03, 0.00, 0.02, -0.01,
                    0.04, 0.01, -0.02, 0.05, -0.03, 0.02),
                  nrow = 4, byrow = TRUE,
                  dimnames = list(c("d1","d2","d3","d4"),
                                  c("AAPL","MSFT","NVDA")))

ex_3_1 <- # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- apply(returns, 1, sum)
ex_3_1
```

**Explanation:** MARGIN = 1 walks rows, MARGIN = 2 walks columns. For sums and means there are faster shortcuts (rowSums, colMeans), but apply is the general tool when the summary is custom.

</details>

### Exercise 3.2: Median price by index across European stock indices

**Scenario:** A trading desk reviewing `EuStockMarkets` wants the median closing value of each index over the full series to compare against the current quarter.

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_2 <- # your code here using apply on EuStockMarkets
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- apply(EuStockMarkets, 2, median)
ex_3_2
```

**Explanation:** EuStockMarkets is a multivariate time series (a numeric matrix under the hood), so MARGIN = 2 walks each index column. Using sapply on the columns is equivalent but loses the names you get free from apply on a named matrix.

</details>

### Exercise 3.3: Apply a custom range function to USArrests

**Scenario:** A compliance officer auditing `USArrests` asks for the spread (max minus min) of each crime category across all 50 states, returned as a named numeric vector.

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_3 <- # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- apply(USArrests, 2, function(x) max(x) - min(x))
ex_3_3
```

**Explanation:** An anonymous function inside apply is the cleanest way to compute a summary R does not ship with. diff(range(x)) is the named-function alternative. apply preserves the column names so the output reads directly.

</details>

### Exercise 3.4: Reduce a 3D array along two margins

**Scenario:** A climatologist holds an array of monthly temperatures for several cities and years (rows = month, cols = year, slice = city). For each month-and-city pair, report the mean across years using MARGIN = c(1, 3).

**Difficulty:** Advanced

```r title="Your turn"
set.seed(1)
temps <- array(rnorm(12 * 5 * 3, mean = 15, sd = 5),
               dim = c(12, 5, 3),
               dimnames = list(month.abb, paste0("y", 1:5),
                               c("Paris", "Rome", "Madrid")))

ex_3_4 <- # your code here: monthly mean per city, ignoring year
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_4 <- apply(temps, c(1, 3), mean)
ex_3_4
```

**Explanation:** Passing a vector of margins collapses every other dimension. Here c(1, 3) keeps month and city, averaging across years. The result is a 12 by 3 matrix, named by month and city, which is exactly what the report needs.

</details>

## Section 4. mapply: walk multiple arguments in parallel (3 problems)

### Exercise 4.1: Build confidence intervals from means and standard errors

**Scenario:** A statistician has parallel vectors of group means and standard errors and wants a 95% CI for each group, returned as a 2-column matrix with rows = lower, upper.

**Difficulty:** Intermediate

```r title="Your turn"
means <- c(10.2, 11.5, 9.8, 12.1)
ses   <- c(0.4, 0.6, 0.3, 0.5)

ex_4_1 <- # your code here using mapply
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- mapply(function(m, se) c(lower = m - 1.96 * se,
                                   upper = m + 1.96 * se),
                 means, ses)
ex_4_1
```

**Explanation:** mapply walks the two input vectors in lockstep, passing the i-th element of each into the function. When the function returns a length-2 vector every time, mapply simplifies to a matrix. The named c() ensures useful row labels.

</details>

### Exercise 4.2: Pairwise minimum without using pmin

**Scenario:** A fraud team has two parallel risk scores per transaction and wants the element-wise minimum, but in a teaching exercise they cannot use the vectorised `pmin`. Solve it with `mapply` instead.

**Difficulty:** Intermediate

```r title="Your turn"
score_a <- c(0.21, 0.55, 0.88, 0.43, 0.67)
score_b <- c(0.34, 0.41, 0.92, 0.50, 0.60)

ex_4_2 <- # your code here using mapply
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- mapply(min, score_a, score_b)
ex_4_2
```

**Explanation:** Passing min directly works because min is a function of any number of args. mapply takes the i-th from each vector, calls min, and you get back the pairwise minimum. In production code, pmin is faster and clearer, but the mapply pattern generalises to any binary function.

</details>

### Exercise 4.3: Force mapply to return a list with SIMPLIFY

**Scenario:** A reporting analyst is generating per-month forecast objects, each a small list of metrics. They notice mapply collapses the result to a matrix when every output has the same shape. Use SIMPLIFY = FALSE to force a list.

**Difficulty:** Advanced

```r title="Your turn"
forecast_one <- function(level, sd) {
  list(level = level, sd = sd, ci_width = 1.96 * sd)
}

levels <- c(100, 110, 120, 130)
sds    <- c(5, 7, 6, 8)

ex_4_3 <- # your code here, list output, names from levels
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- mapply(forecast_one, levels, sds,
                 SIMPLIFY = FALSE,
                 USE.NAMES = TRUE)
names(ex_4_3) <- paste0("month_", seq_along(levels))
ex_4_3
```

**Explanation:** SIMPLIFY = FALSE makes mapply behave like Map, returning a list regardless of element shapes. Use it whenever you want downstream code to treat the output uniformly. Map(forecast_one, levels, sds) is the shorter, equivalent form.

</details>

## Section 5. tapply: grouped summaries on a vector (3 problems)

### Exercise 5.1: Mean mpg by cylinder count

**Difficulty:** Beginner

```r title="Your turn"
ex_5_1 <- # your code here using tapply on mtcars
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- tapply(mtcars$mpg, mtcars$cyl, mean)
ex_5_1
```

**Explanation:** tapply takes a vector and a grouping factor (or list of factors) and returns a named result with one summary per group. It is the base-R equivalent of a single dplyr group_by + summarise call.

</details>

### Exercise 5.2: Cross-tab summary on ToothGrowth

**Scenario:** A pharmacology team running `ToothGrowth` wants the median tooth length for every supplement-by-dose combination, returned as a matrix indexed by supp and dose.

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_2 <- # your code here using tapply with two grouping vars
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_2 <- tapply(ToothGrowth$len,
                 list(ToothGrowth$supp, ToothGrowth$dose),
                 median)
ex_5_2
```

**Explanation:** Passing a list of grouping vectors to tapply produces a multi-way array (here a 2 by 3 matrix). It is the fastest way in base R to land a cross-tab of medians without melting and recasting the frame.

</details>

### Exercise 5.3: tapply with a custom percentile function

**Scenario:** An audit team reviewing `PlantGrowth` weights wants the 90th percentile of `weight` per treatment group to spot which condition produced extreme high values.

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_3 <- # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_3 <- tapply(PlantGrowth$weight, PlantGrowth$group,
                 function(x) quantile(x, probs = 0.90, names = FALSE))
ex_5_3
```

**Explanation:** tapply happily accepts an anonymous function. Setting names = FALSE inside quantile() avoids the noisy "90%" label, leaving a clean numeric per group. For more than one quantile, return a vector and tapply will give you a list.

</details>

## Section 6. vapply: type-safe apply (2 problems)

### Exercise 6.1: Lock a numeric scalar return type

**Scenario:** A platform engineer is shipping a function that summarises latency series and wants vapply to crash loudly if any element function returns the wrong type, rather than silently producing a list.

**Difficulty:** Intermediate

```r title="Your turn"
series_list <- list(
  s1 = c(120, 140, 130, 200),
  s2 = c(115, 125, 135, 180),
  s3 = c(140, 150, 160, 220)
)

ex_6_1 <- # your code here using vapply with FUN.VALUE
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_1 <- vapply(series_list, mean, FUN.VALUE = numeric(1))
ex_6_1
```

**Explanation:** FUN.VALUE declares the prototype every call must match. If mean ever returned, say, a character, vapply would error instead of silently returning a list. That predictability makes vapply the right choice inside packages.

</details>

### Exercise 6.2: Catch a malformed function with vapply

**Scenario:** A code reviewer notices a helper sometimes returns NA and sometimes a length-2 vector. Wrap the call in vapply with the correct FUN.VALUE so the bug surfaces immediately rather than after a silent downstream cast.

**Difficulty:** Advanced

```r title="Your turn"
buggy_summary <- function(x) {
  if (length(x) < 3) return(NA_real_)
  c(mean = mean(x), sd = sd(x))
}

inputs <- list(c(1, 2, 3, 4),
               c(5, 6, 7),
               c(8, 9))   # this one will trip the bug

ex_6_2 <- # your code here using vapply, expect a 2-row matrix or a clear error
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_2 <- try(
  vapply(inputs, buggy_summary,
         FUN.VALUE = c(mean = 0.0, sd = 0.0)),
  silent = TRUE
)
ex_6_2
```

**Explanation:** vapply checks every call against FUN.VALUE. The third input falls into the length(x) < 3 branch and returns a scalar NA, so vapply raises "values must be length 2". sapply would have hidden the bug by returning a list. That is the value of a typed apply.

</details>

## Section 7. Refactoring and performance (2 problems)

### Exercise 7.1: Convert a for loop to lapply

**Scenario:** A junior analyst wrote a for loop that fits a linear model of mpg on every other numeric column in `mtcars`. Refactor it to a single lapply call that returns a named list of fitted models.

**Difficulty:** Intermediate

```r title="Your turn"
predictors <- setdiff(names(mtcars), "mpg")

# original loop you are replacing
fits_loop <- list()
for (p in predictors) {
  fits_loop[[p]] <- lm(mpg ~ ., data = mtcars[, c("mpg", p)])
}

ex_7_1 <- # your code here using lapply with setNames
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_7_1 <- setNames(
  lapply(predictors, function(p) lm(mpg ~ ., data = mtcars[, c("mpg", p)])),
  predictors
)
coef(ex_7_1$wt)
```

**Explanation:** lapply walks predictors and returns a list of model objects. setNames re-attaches names so you can index by predictor name. The loop and the lapply both allocate once; the apply form is more readable and harder to mis-index.

</details>

### Exercise 7.2: Benchmark apply against the colMeans shortcut

**Scenario:** A performance reviewer suspects apply is slower than the dedicated `colMeans` shortcut for column means on a wide matrix. Build a 5,000-by-20 random matrix and compare the two approaches with `system.time`.

**Difficulty:** Advanced

```r title="Your turn"
set.seed(42)
big <- matrix(rnorm(5000 * 20), nrow = 5000)

ex_7_2 <- # your code here: list with apply_time and colMeans_time
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
t_apply    <- system.time(replicate(50, apply(big, 2, mean)))
t_colmeans <- system.time(replicate(50, colMeans(big)))

ex_7_2 <- list(
  apply_time    = t_apply["elapsed"],
  colMeans_time = t_colmeans["elapsed"]
)
ex_7_2
```

**Explanation:** colMeans is a compiled C primitive and runs many times faster than apply, which dispatches to an R-level function each column. Lesson: reach for the dedicated shortcut (rowSums, colSums, rowMeans, colMeans) before generalising with apply.

</details>

## What to do next

- [base apply in R](base-apply-in-R.html): the matrix-and-array apply function explained from scratch
- [base lapply in R](base-lapply-in-R.html): when you want a list back, no surprises
- [base sapply in R](base-sapply-in-R.html): sapply pitfalls and the rules it uses to simplify
- [Functional Programming in R](Functional-Programming-in-R.html): broader context for higher-order functions and the apply family
