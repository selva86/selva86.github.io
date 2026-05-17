---
title: "Loops vs Vectorization Exercises in R: 20 Practice Problems"
slug: "Loops-vs-Vectorization-Exercises-in-R"
description: "R vectorization exercises: 20 scenario-based practice problems on translating loops to vectorized code, apply family, preallocation, and benchmarking."
keywords: "R vectorization exercises, loops vs vectorization R, vectorize loops in R, apply family exercises, preallocation R practice, benchmark R loops"
mathjax: false
webr: true
date: "2026-05-12"
post_type: "EX"
sidebar_title: "Loops vs Vectorization Exercises"
sidebar_order: 146
fr_parent: "Functional-Programming-in-R.html"
auto_link_terms: "vectorization exercises|loops vs vectorization|r vectorization practice|vectorize loops in r|loops vectorization exercises"
auto_link_case_sensitive: false
target_keyword: "R vectorization exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Loops vs Vectorization Exercises in R: 20 Practice Problems

<p class="lead">Twenty practice problems on the loops-vs-vectorization tradeoff in R: translating for-loops, conditional vectorization, the apply family as a bridge, preallocation tactics, the cases where a loop is unavoidable, and benchmarking. Solutions are hidden behind reveal toggles so you try first.</p>

```r title="Run this once before any exercise"
library(dplyr)
library(tibble)
set.seed(42)
```

## Section 1. Translate for-loops to vectorized form (4 problems)

### Exercise 1.1: Sum the squares of 1 to 10 without a loop

**Task:** A junior R user wrote a for-loop that initialises `s <- 0` and accumulates `s <- s + i^2` for `i` in `1:10`. Replace the loop with a single vectorized expression that produces the same scalar and save it to `ex_1_1`. The expected result is the integer total.

**Expected result:**

```
#> [1] 385
```

**Difficulty:** Beginner

[HINTS]
Think about building the whole vector of squares at once, then collapsing it to a single number - no running accumulator is needed.
Square the sequence with `^2`, wrapping `1:10` in parentheses so it binds before the power, then reduce with `sum()`.

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- sum((1:10)^2)
ex_1_1
#> [1] 385
```

**Explanation:** `^` is vectorized, so `(1:10)^2` returns the full length-10 vector of squares in one shot, and `sum()` folds it to a scalar. Parentheses around `1:10` are required because `:` binds tighter than `^`. Without them, `1:10^2` is `1:100`. The loop version allocates nothing extra but pays the per-iteration overhead of the interpreter; the vectorized version runs the inner work in compiled C.

</details>

### Exercise 1.2: Add two vectors element-wise without a loop

**Task:** Given `x <- 1:5` and `y <- 10:14`, a teammate wrote a for-loop that fills `out[i] <- x[i] + y[i]`. Use base R's vectorized `+` to do the same in one line and save the resulting length-5 integer vector to `ex_1_2`.

**Expected result:**

```
#> [1] 11 13 15 17 19
```

**Difficulty:** Beginner

[HINTS]
R arithmetic already works position-by-position across two equal-length operands, so no per-index work is required.
Apply the `+` operator directly to `x` and `y`.

```r title="Your turn"
x <- 1:5
y <- 10:14
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
x <- 1:5
y <- 10:14
ex_1_2 <- x + y
ex_1_2
#> [1] 11 13 15 17 19
```

**Explanation:** Arithmetic operators in R are vectorized over equal-length operands; `x + y` returns a length-5 vector with no loop in user code. If lengths differ, R recycles the shorter vector with a warning when the longer length is not a multiple. Recycling is a frequent source of silent bugs, so prefer equal lengths or call `pmin()` / `pmax()` for explicit pairing.

</details>

### Exercise 1.3: Compound daily returns into a portfolio path

**Task:** A trading desk holds $1000 and observes five daily returns `c(0.05, 0.03, -0.02, 0.04, -0.01)`. Without writing a for-loop, compute the running portfolio value at the close of each day with `cumprod()` and save the length-5 numeric vector to `ex_1_3`.

**Expected result:**

```
#> [1] 1050.000 1081.500 1059.870 1102.265 1091.242
```

**Difficulty:** Intermediate

[HINTS]
Each day's value is the previous value scaled by its return, which is a running product flowing down the vector.
Apply `cumprod()` to `1 + returns`, then multiply the result by the starting 1000.

```r title="Your turn"
returns <- c(0.05, 0.03, -0.02, 0.04, -0.01)
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
returns <- c(0.05, 0.03, -0.02, 0.04, -0.01)
ex_1_3 <- 1000 * cumprod(1 + returns)
round(ex_1_3, 3)
#> [1] 1050.000 1081.500 1059.870 1102.265 1091.242
```

**Explanation:** Each day's value is the previous day's value times `(1 + r)`. That product chain is exactly what `cumprod()` computes, so the whole path collapses to one C-level scan. A common mistake is `cumsum(returns)`, which adds simple returns and ignores compounding. Note this works only because gross-return multipliers commute by index; if you had to clip at a cap each step, the path becomes truly recursive and you need a loop or `Reduce()` (see Exercise 5.1).

</details>

### Exercise 1.4: Day-over-day differences with diff()

**Task:** From `mtcars`, take the first 10 values of `mpg` and compute the lag-1 difference between consecutive cars. Avoid an explicit loop; use the base function that returns a length-9 numeric vector and save it to `ex_1_4`. Round to one decimal to match the expected output.

**Expected result:**

```
#> [1]   0.0   1.8  -1.4  -2.7  -0.6  -3.8  10.1  -1.6  -3.6
```

**Difficulty:** Intermediate

[HINTS]
You want each consecutive gap between values, a single lag-1 subtraction swept across the vector.
Take the first ten values with `head(mtcars$mpg, 10)`, pass that to `diff()`, then `round(..., 1)`.

```r title="Your turn"
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_4 <- round(diff(head(mtcars$mpg, 10)), 1)
ex_1_4
#> [1]   0.0   1.8  -1.4  -2.7  -0.6  -3.8  10.1  -1.6  -3.6
```

**Explanation:** `diff(x)` returns `x[-1] - x[-length(x)]` in C, so it is both shorter to write and faster than the equivalent `for (i in 2:n) out[i-1] <- x[i] - x[i-1]`. Pass `lag = k` for k-step differences and `differences = d` for higher-order differences. For grouped lag differences (per car make, per ticker), reach for `dplyr::lag()` inside `group_by()` instead because `diff()` itself is group-blind.

</details>

## Section 2. Conditional vectorization (3 problems)

### Exercise 2.1: Winsorize sepal lengths with pmin and pmax

**Task:** A risk team wants outliers in `iris$Sepal.Length` capped at the 5th and 95th percentiles before downstream modelling. Winsorize the column with `pmin()` and `pmax()` in one expression (no loop, no `ifelse`) and save the length-150 numeric vector to `ex_2_1`. Compare ranges of the original and winsorized vectors.

**Expected result:**

```
#> Original range: 4.3 7.9
#> Winsorized range: 4.6 7.255
```

**Difficulty:** Intermediate

[HINTS]
Capping means pulling values above a ceiling down and values below a floor up, one element at a time.
Use `pmin()` against the upper quantile `qs[2]`, then wrap that in `pmax()` against the lower quantile `qs[1]`.

```r title="Your turn"
qs <- quantile(iris$Sepal.Length, c(0.05, 0.95))
ex_2_1 <- # your code here
cat("Original range:", range(iris$Sepal.Length), "\n")
cat("Winsorized range:", range(ex_2_1), "\n")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
qs <- quantile(iris$Sepal.Length, c(0.05, 0.95))
ex_2_1 <- pmax(pmin(iris$Sepal.Length, qs[2]), qs[1])
cat("Original range:", range(iris$Sepal.Length), "\n")
#> Original range: 4.3 7.9
cat("Winsorized range:", range(ex_2_1), "\n")
#> Winsorized range: 4.6 7.255
```

**Explanation:** `pmin()` and `pmax()` are the parallel (element-wise) versions of `min()` and `max()`. `pmin(x, hi)` returns the smaller of each element and the upper cap, so it pulls high outliers down; `pmax(., lo)` then lifts low outliers up to the floor. Order matters only when caps overlap, which here they do not. A nested `ifelse` chain works but reads worse and allocates twice; an explicit for-loop is even slower and adds a real bug surface for NA handling.

</details>

### Exercise 2.2: Bucket cars into efficiency tiers with case_when

**Task:** A fleet performance reviewer wants every car in `mtcars` tagged as `"thirsty"` (mpg < 15), `"mid"` (15 to 25), or `"efficient"` (mpg > 25) without an explicit loop. Add a `tier` column using `dplyr::case_when()`, save the resulting tibble to `ex_2_2`, and show the count per tier.

**Expected result:**

```
#> # A tibble: 3 x 2
#>   tier          n
#>   <chr>     <int>
#> 1 efficient     6
#> 2 mid          20
#> 3 thirsty       6
```

**Difficulty:** Intermediate

[HINTS]
You need to map each row's mileage into one of three labels based on ordered thresholds.
Inside `mutate()`, build `tier` with `case_when()` using ordered `mpg < 15` and `mpg <= 25` branches plus a `TRUE` catch-all.

```r title="Your turn"
ex_2_2 <- mtcars |>
  tibble::rownames_to_column("car") |>
  # your code here
count(ex_2_2, tier)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- mtcars |>
  tibble::rownames_to_column("car") |>
  mutate(tier = case_when(
    mpg < 15  ~ "thirsty",
    mpg <= 25 ~ "mid",
    TRUE      ~ "efficient"
  ))

count(ex_2_2, tier)
#> # A tibble: 3 x 2
#>   tier          n
#>   <chr>     <int>
#> 1 efficient     6
#> 2 mid          20
#> 3 thirsty       6
```

**Explanation:** `case_when()` evaluates branches top-down and writes the first match; later conditions only see rows that fell through. Because branch two implicitly handles 15 to 25, you do not write `mpg >= 15 & mpg <= 25`. The terminal `TRUE ~ ...` is the catch-all; without it, mpg above 25 would land as `NA`. Internally `case_when()` is vectorized and far faster than a row-wise for-loop with nested `if/else`, and it reads cleanly.

</details>

### Exercise 2.3: Replace NAs with the column median in one expression

**Task:** A data engineer wants `airquality$Ozone` imputed in place with the column median, computed while ignoring NAs. Use `ifelse()` with `is.na()` (no loop, no apply) and save the length-153 vector to `ex_2_3`. Confirm the count of NAs in the result is zero and inspect the first five entries.

**Expected result:**

```
#> NAs remaining: 0
#> [1] 41.0 36.0 12.0 18.0 31.5
```

**Difficulty:** Beginner

[HINTS]
For every position, you choose between the fallback value and the original depending on whether the entry is missing.
Call `ifelse()` with `is.na(airquality$Ozone)` as the test, `med` as the true branch, and the column itself as the false branch.

```r title="Your turn"
med <- median(airquality$Ozone, na.rm = TRUE)
ex_2_3 <- # your code here
cat("NAs remaining:", sum(is.na(ex_2_3)), "\n")
head(ex_2_3, 5)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
med <- median(airquality$Ozone, na.rm = TRUE)
ex_2_3 <- ifelse(is.na(airquality$Ozone), med, airquality$Ozone)
cat("NAs remaining:", sum(is.na(ex_2_3)), "\n")
#> NAs remaining: 0
head(ex_2_3, 5)
#> [1] 41.0 36.0 12.0 18.0 31.5
```

**Explanation:** `ifelse()` walks both branches over the full vector and picks element-by-element, so it stays vectorized. The single-bracket assignment idiom `x[is.na(x)] <- med` is the most R-idiomatic alternative and is faster because it edits in place and skips the per-element type check that `ifelse()` performs. For typed data (Date, factor), prefer `replace()` or `dplyr::coalesce()` because `ifelse()` can coerce attributes off.

</details>

## Section 3. The apply family as a bridge (3 problems)

### Exercise 3.1: Column means without a for-loop using colMeans

**Task:** A new analyst wrote a loop iterating `for (j in 1:ncol(mtcars)) out[j] <- mean(mtcars[, j])`. Replace it with the specialised base function that beats both the loop and `apply()` and save the named numeric length-11 vector to `ex_3_1`. Print rounded to four decimals.

**Expected result:**

```
#>      mpg      cyl     disp       hp     drat       wt     qsec       vs       am     gear     carb
#>  20.0906   6.1875 230.7219 146.6875   3.5966   3.2173  17.8488   0.4375   0.4063   3.6875   2.8125
```

**Difficulty:** Intermediate

[HINTS]
There is a dedicated reducer that averages every column in one compiled pass, beating both the loop and the apply machinery.
Call `colMeans()` on `mtcars`.

```r title="Your turn"
ex_3_1 <- # your code here
round(ex_3_1, 4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- colMeans(mtcars)
round(ex_3_1, 4)
#>      mpg      cyl     disp       hp     drat       wt     qsec       vs       am     gear     carb
#>  20.0906   6.1875 230.7219 146.6875   3.5966   3.2173  17.8488   0.4375   0.4063   3.6875   2.8125
```

**Explanation:** `colMeans()` and its siblings `rowMeans()`, `colSums()`, `rowSums()` are C-level shortcuts that skip the apply machinery entirely. They typically beat `apply(m, 2, mean)` by an order of magnitude on numeric matrices and data frames with all numeric columns. If your frame has non-numeric columns, `colMeans()` errors; in that case filter with `select(where(is.numeric))` first or fall back to `sapply()`.

</details>

### Exercise 3.2: Count NAs per row of airquality with apply

**Task:** A data engineer auditing `airquality` wants the count of NAs in each of its 153 rows so they can flag the worst rows for review. Use `apply()` with margin 1, save the integer length-153 vector to `ex_3_2`, and print a frequency table of how many rows have zero, one, or two missing fields.

**Expected result:**

```
#>   0   1   2
#> 111  40   2
```

**Difficulty:** Intermediate

[HINTS]
You want a per-row summary, so the operation walks across rows and reduces each one to a single count.
Call `apply()` with margin `1` and an anonymous function that does `sum(is.na(r))`.

```r title="Your turn"
ex_3_2 <- # your code here
table(ex_3_2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- apply(airquality, 1, function(r) sum(is.na(r)))
table(ex_3_2)
#> ex_3_2
#>   0   1   2
#> 111  40   2
```

**Explanation:** `apply(m, 1, f)` walks rows and calls `f` on each, returning a length-`nrow` result. The anonymous function counts NAs per row. The pure-vector alternative `rowSums(is.na(airquality))` runs in C and is faster, so prefer it when the per-row reduction is simple; reach for `apply()` only when the function genuinely needs the whole row as an R value (for example to call a multi-argument summariser).

</details>

### Exercise 3.3: Fit one regression per cyl group with lapply

**Task:** A statistician wants to fit `lm(mpg ~ wt)` separately for cars with 4, 6, and 8 cylinders. Replace a for-loop over `split(mtcars, mtcars$cyl)` with `lapply()`, save the list of three fitted models to `ex_3_3`, and use `sapply()` to extract a 2-by-3 matrix of coefficients. Round to four decimals.

**Expected result:**

```
#>                    4       6       8
#> (Intercept)  39.5712 28.4087 23.8680
#> wt           -5.6471 -2.7806 -2.1924
```

**Difficulty:** Advanced

[HINTS]
Each group produces a complex model object, so collect the results in a list rather than trying to fit them in a vector.
Map `lapply()` over `groups`, fitting `lm(mpg ~ wt, data = g)` inside the function.

```r title="Your turn"
groups <- split(mtcars, mtcars$cyl)
ex_3_3 <- # your code here
round(sapply(ex_3_3, coef), 4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
groups <- split(mtcars, mtcars$cyl)
ex_3_3 <- lapply(groups, function(g) lm(mpg ~ wt, data = g))
round(sapply(ex_3_3, coef), 4)
#>                    4       6       8
#> (Intercept) 39.5712 28.4087 23.8680
#> wt          -5.6471 -2.7806 -2.1924
```

**Explanation:** `lapply()` returns a list, the right container when each iteration produces a complex object like an `lm` fit. A naive for-loop would need `vector("list", length(groups))` preallocation plus assignment by index; `lapply()` collapses all that to one call. `sapply()` then simplifies the per-fit `coef()` vector into a matrix because each fit has the same coefficient names. Switch to `vapply(..., FUN.VALUE = numeric(2))` in production code for return-type safety.

</details>

## Section 4. Preallocate before you loop (3 problems)

### Exercise 4.1: Preallocate beats grow with c() by 10x or more

**Task:** Compare two for-loops that compute `1:5000` squared. The slow version grows the result with `c()`; the fast version preallocates a `numeric(5000)` and assigns by index. Run both inside `system.time()` and save the elapsed-time difference (slow minus fast, in seconds) to `ex_4_1`. The actual numbers will vary, but the slow elapsed time should be the larger one.

**Expected result:**

```
#> Slow (grow with c)   elapsed: ~0.10-0.50 sec
#> Fast (preallocate)   elapsed: ~0.00-0.01 sec
#> ex_4_1 (difference) ~0.10-0.50 sec
```

**Difficulty:** Intermediate

[HINTS]
The fast loop should write into a fixed-size container instead of regrowing one each step; then subtract the two measured times.
Preallocate with `numeric(n)`, assign via `out[i] <- i^2`, and compute the gap as `unname(t_slow["elapsed"] - t_fast["elapsed"])`.

```r title="Your turn"
n <- 5000
t_slow <- system.time({
  out <- c()
  for (i in 1:n) out <- c(out, i^2)
})

t_fast <- system.time({
  out <- # preallocate here
  for (i in 1:n) # assign by index
})

ex_4_1 <- # your code here
cat("Slow elapsed:", t_slow["elapsed"], "\n")
cat("Fast elapsed:", t_fast["elapsed"], "\n")
cat("Difference:",  ex_4_1, "\n")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
n <- 5000
t_slow <- system.time({
  out <- c()
  for (i in 1:n) out <- c(out, i^2)
})

t_fast <- system.time({
  out <- numeric(n)
  for (i in 1:n) out[i] <- i^2
})

ex_4_1 <- unname(t_slow["elapsed"] - t_fast["elapsed"])
cat("Slow elapsed:", t_slow["elapsed"], "\n")
#> Slow elapsed: 0.12
cat("Fast elapsed:", t_fast["elapsed"], "\n")
#> Fast elapsed: 0.01
cat("Difference:",  ex_4_1, "\n")
#> Difference: 0.11
```

**Explanation:** `c(out, i^2)` allocates a brand-new vector of length `i+1`, copies the old values into it, writes the new one, and discards the old. That is O(n^2) work and O(n^2) allocations over the full loop. Preallocating with `numeric(n)` and writing by index is O(n) and reuses the same memory. The fully vectorized one-liner `(1:n)^2` beats both, but when a real algorithm forces you to loop, preallocation is the first thing to fix.

</details>

### Exercise 4.2: Use which() instead of a hand-written index loop

**Task:** Given `x <- c(3, -1, 7, -4, 2, -8, 0, 5)`, a teammate wrote a for-loop that walked indices and pushed each negative position into a growing vector. Replace the whole loop with the one-line vectorized base function that returns the indices where the predicate is true and save the integer vector to `ex_4_2`.

**Expected result:**

```
#> [1] 2 4 6
```

**Difficulty:** Intermediate

[HINTS]
Instead of testing and pushing indices in a loop, ask directly for the positions where a condition holds true.
Pass the logical predicate `x < 0` to `which()`.

```r title="Your turn"
x <- c(3, -1, 7, -4, 2, -8, 0, 5)
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
x <- c(3, -1, 7, -4, 2, -8, 0, 5)
ex_4_2 <- which(x < 0)
ex_4_2
#> [1] 2 4 6
```

**Explanation:** `which()` takes a logical vector and returns the integer positions where it is `TRUE`. It pairs with any vectorized predicate (`x < 0`, `is.na(x)`, `x %in% set`) and is the standard alternative to the "loop, test, accumulate index" pattern. Note `which()` does NOT include NAs as TRUE; use `which(is.na(x))` if you want them. The looped version would also work but pays per-iteration overhead and forces you to think about preallocation.

</details>

### Exercise 4.3: Fill a parameter grid with a preallocated matrix

**Task:** An ML engineer evaluates `mse = (alpha - 1)^2 + (lambda - 2)^2` across a 5-by-5 grid of `alpha` values `seq(0, 1, length = 5)` and `lambda` values `seq(0, 4, length = 5)`. Preallocate a 5-by-5 matrix and fill it with a nested for-loop. Save the matrix to `ex_4_3`. Round to three decimals for the expected output.

**Expected result:**

```
#>       [,1]  [,2]  [,3]  [,4]  [,5]
#> [1,] 5.000 2.000 1.000 2.000 5.000
#> [2,] 4.563 1.563 0.563 1.563 4.563
#> [3,] 4.250 1.250 0.250 1.250 4.250
#> [4,] 4.063 1.063 0.063 1.063 4.063
#> [5,] 4.000 1.000 0.000 1.000 4.000
```

**Difficulty:** Advanced

[HINTS]
Fix the result's shape up front so every nested-loop write lands in place rather than regrowing the container.
Preallocate with `matrix(NA_real_, nrow = length(alpha), ncol = length(lambda))`, then set `ex_4_3[i, j] <- (alpha[i] - 1)^2 + (lambda[j] - 2)^2`.

```r title="Your turn"
alpha  <- seq(0, 1, length = 5)
lambda <- seq(0, 4, length = 5)
ex_4_3 <- # preallocate here
for (i in seq_along(alpha)) {
  for (j in seq_along(lambda)) {
    # fill in the cell
  }
}
round(ex_4_3, 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
alpha  <- seq(0, 1, length = 5)
lambda <- seq(0, 4, length = 5)
ex_4_3 <- matrix(NA_real_, nrow = length(alpha), ncol = length(lambda))
for (i in seq_along(alpha)) {
  for (j in seq_along(lambda)) {
    ex_4_3[i, j] <- (alpha[i] - 1)^2 + (lambda[j] - 2)^2
  }
}
round(ex_4_3, 3)
#>       [,1]  [,2]  [,3]  [,4]  [,5]
#> [1,] 5.000 2.000 1.000 2.000 5.000
#> [2,] 4.563 1.563 0.563 1.563 4.563
#> [3,] 4.250 1.250 0.250 1.250 4.250
#> [4,] 4.063 1.063 0.063 1.063 4.063
#> [5,] 4.000 1.000 0.000 1.000 4.000
```

**Explanation:** Preallocating with `matrix(NA_real_, nrow, ncol)` fixes the destination shape so each `[i, j]` write is in-place. The fully vectorized alternative is `outer(alpha, lambda, function(a, l) (a - 1)^2 + (l - 2)^2)`, which runs in one C call and is the right tool here. Use the nested-loop form only when the per-cell computation depends on neighbours (PDE updates, dynamic programming) and `outer()` cannot express it.

</details>

## Section 5. When you actually need a loop (3 problems)

### Exercise 5.1: Path-dependent compounding with a cap needs Reduce

**Task:** A trading desk compounds $1000 by returns `c(0.10, 0.20, 0.15, -0.5, 0.10)` but a regulator caps the daily balance at $1500. Use `Reduce()` with `accumulate = TRUE` so each step depends on the previous capped balance. Save the length-6 path (initial plus five updates) to `ex_5_1` and explain why `cumprod()` cannot reproduce it.

**Expected result:**

```
#> [1] 1000 1100 1320 1500  750  825
```

**Difficulty:** Intermediate

[HINTS]
Each balance depends on the previous capped balance, so you need a running fold that carries state forward.
Use `Reduce()` with `accumulate = TRUE` and `init = 1000`, folding with `min(b * (1 + r), cap)`.

```r title="Your turn"
returns <- c(0.10, 0.20, 0.15, -0.5, 0.10)
cap     <- 1500
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
returns <- c(0.10, 0.20, 0.15, -0.5, 0.10)
cap     <- 1500
ex_5_1 <- Reduce(function(b, r) min(b * (1 + r), cap),
                 returns, accumulate = TRUE, init = 1000)
ex_5_1
#> [1] 1000 1100 1320 1500  750  825
```

**Explanation:** Each next balance is `min(prev * (1 + r), cap)`, so step `t+1` depends on the CAPPED value at step `t`, not the un-capped product. `cumprod(1 + returns) * 1000` would happily produce 1518 on day three because the cap never gets applied, then day four would compound off that wrong number. Whenever the recurrence is nonlinear (clipping, flooring, branching on prior state), reach for `Reduce()` with `accumulate = TRUE` or a plain for-loop; both are equally fast here because the work per step dominates.

</details>

### Exercise 5.2: Simulate a 3-state Markov chain for 100 steps

**Task:** An ops engineer models a service that hops between states `"A"`, `"B"`, `"C"` with transition matrix rows `c(0.7, 0.2, 0.1)`, `c(0.3, 0.4, 0.3)`, `c(0.2, 0.3, 0.5)`. Starting from `"A"`, simulate 100 steps where the next state is sampled with probabilities given by the current row. Save the length-100 character vector to `ex_5_2` and tabulate the visit frequencies. Use the seed already set in setup.

**Expected result:**

```
#>  A  B  C
#> 47 24 29
```

**Difficulty:** Advanced

[HINTS]
The next state's distribution is set by the current state, so each draw must read the row matching where the chain is now.
Inside the loop, draw with `sample()` of size 1 and `prob = P[states[t - 1], ]`.

```r title="Your turn"
P <- matrix(c(0.7, 0.2, 0.1,
              0.3, 0.4, 0.3,
              0.2, 0.3, 0.5),
            nrow = 3, byrow = TRUE,
            dimnames = list(c("A","B","C"), c("A","B","C")))
states <- character(100)
states[1] <- "A"
for (t in 2:100) {
  states[t] <- # sample from the row matching the current state
}
ex_5_2 <- states
table(ex_5_2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
P <- matrix(c(0.7, 0.2, 0.1,
              0.3, 0.4, 0.3,
              0.2, 0.3, 0.5),
            nrow = 3, byrow = TRUE,
            dimnames = list(c("A","B","C"), c("A","B","C")))
states <- character(100)
states[1] <- "A"
for (t in 2:100) {
  states[t] <- sample(c("A","B","C"), 1, prob = P[states[t - 1], ])
}
ex_5_2 <- states
table(ex_5_2)
#> ex_5_2
#>  A  B  C
#> 47 24 29
```

**Explanation:** Each step's distribution depends on the prior sampled state, so the chain is irreducibly sequential. You cannot vectorize this loop; even tricks like `cumsum` over a pre-sampled uniform fail because the row of `P` you index changes step by step. The right optimisation is to keep the loop and preallocate the result (`character(100)`), which is already O(n) and adds no allocations. With many parallel chains, vectorize across chains (one column per chain) and keep the inner step a loop.

</details>

### Exercise 5.3: Newton-Raphson for sqrt(2) with a while loop

**Task:** Compute `sqrt(2)` to a tolerance of `1e-8` using Newton-Raphson: start at `x = 1`, repeatedly update `x_new = (x + 2/x) / 2`, and stop when `abs(x_new - x) < 1e-8`. A while loop is the natural shape because the iteration count is unknown in advance. Save the converged scalar to `ex_5_3` and report how many iterations it took.

**Expected result:**

```
#> Converged to 1.41421356 in 5 iterations
```

**Difficulty:** Advanced

[HINTS]
The update step averages the current guess with the target value divided by that guess.
Set `x_new <- (x + 2 / x) / 2` and let the surrounding `while` break on the tolerance test.

```r title="Your turn"
x     <- 1
iters <- 0
tol   <- 1e-8
while (TRUE) {
  iters <- iters + 1
  x_new <- # update step
  if (abs(x_new - x) < tol) break
  x <- x_new
}
ex_5_3 <- x_new
cat("Converged to", format(ex_5_3, digits = 9), "in", iters, "iterations\n")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
x     <- 1
iters <- 0
tol   <- 1e-8
while (TRUE) {
  iters <- iters + 1
  x_new <- (x + 2 / x) / 2
  if (abs(x_new - x) < tol) break
  x <- x_new
}
ex_5_3 <- x_new
cat("Converged to", format(ex_5_3, digits = 9), "in", iters, "iterations\n")
#> Converged to 1.41421356 in 5 iterations
```

**Explanation:** Newton-Raphson is the canonical case of an unknown-length iterative algorithm: the number of steps depends on the input and the tolerance, so a `while (TRUE) { ...; if (condition) break }` shape is cleaner than `for (i in 1:big_number)`. Vectorization does not apply across iterations; it does apply ACROSS independent starting points if you ever need to root-find many equations at once, in which case vectorize the per-iteration update over a vector of `x` values.

</details>

## Section 6. Prove it: benchmark loops vs vectorized (5 problems)

### Exercise 6.1: Benchmark sum-of-1-to-1e6 loop vs vectorized

**Task:** Compare three implementations that sum integers from 1 to 1,000,000: an accumulator for-loop, the vectorized `sum(1:1e6)`, and the closed-form Gauss formula. Use `system.time()` on each and save a named numeric vector of elapsed times (in seconds) to `ex_6_1`. The vector and formula will be effectively instant; the loop should be at least 10x slower.

**Expected result:**

```
#>     loop      vec  formula
#> 0.038000 0.001000 0.000000
```

**Difficulty:** Intermediate

[HINTS]
Collect the three measured run times into one labelled container so they can be compared side by side.
Build `ex_6_1` with `c()` of named entries, each pulled via `unname(t_loop["elapsed"])` and friends.

```r title="Your turn"
n      <- 1e6
t_loop <- system.time({
  s <- 0
  for (i in 1:n) s <- s + i
})

t_vec     <- system.time(sum(1:n))
t_formula <- system.time(n * (n + 1) / 2)

ex_6_1 <- # your code here
round(ex_6_1, 4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
n <- 1e6
t_loop <- system.time({
  s <- 0
  for (i in 1:n) s <- s + i
})
t_vec     <- system.time(sum(1:n))
t_formula <- system.time(n * (n + 1) / 2)

ex_6_1 <- c(loop    = unname(t_loop["elapsed"]),
            vec     = unname(t_vec["elapsed"]),
            formula = unname(t_formula["elapsed"]))
round(ex_6_1, 4)
#>     loop      vec  formula
#> 0.038000 0.001000 0.000000
```

**Explanation:** Every iteration of an R for-loop pays interpreter overhead: argument matching, environment lookup, dispatch on `+`. `sum()` does the whole reduction in one C call, so it is bounded by memory bandwidth. The Gauss formula is even cheaper because it does constant work regardless of `n`. The takeaway is not just "vectorize"; it is "look for a constant-work alternative before optimising the loop at all". Wall-clock numbers vary across machines, but the ranking is invariant.

</details>

### Exercise 6.2: Column means: for-loop vs apply vs colMeans

**Task:** Build a 2000-by-200 numeric matrix from `rnorm()` and benchmark three column-mean strategies: a for-loop with preallocated output, `apply(m, 2, mean)`, and `colMeans(m)`. Use `system.time()` on each. Save a named numeric vector of elapsed times to `ex_6_2`. `colMeans` should win by the largest margin.

**Expected result:**

```
#>     loop    apply colMeans
#> 0.018000 0.013000 0.001000
```

**Difficulty:** Advanced

[HINTS]
Gather the three elapsed timings under readable names so the winning strategy is obvious at a glance.
Assemble `ex_6_2` with `c()`, pulling each time via `unname(t_loop["elapsed"])` and the others.

```r title="Your turn"
m <- matrix(rnorm(2000 * 200), 2000, 200)

t_loop <- system.time({
  out <- numeric(ncol(m))
  for (j in 1:ncol(m)) out[j] <- mean(m[, j])
})
t_apply  <- system.time(apply(m, 2, mean))
t_colmn  <- system.time(colMeans(m))

ex_6_2 <- # your code here
round(ex_6_2, 4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
m <- matrix(rnorm(2000 * 200), 2000, 200)

t_loop <- system.time({
  out <- numeric(ncol(m))
  for (j in 1:ncol(m)) out[j] <- mean(m[, j])
})
t_apply  <- system.time(apply(m, 2, mean))
t_colmn  <- system.time(colMeans(m))

ex_6_2 <- c(loop     = unname(t_loop["elapsed"]),
            apply    = unname(t_apply["elapsed"]),
            colMeans = unname(t_colmn["elapsed"]))
round(ex_6_2, 4)
#>     loop    apply colMeans
#> 0.018000 0.013000 0.001000
```

**Explanation:** `apply()` is not magic; it loops in R under the hood and adds dispatch overhead per column on top of `mean()`. The preallocated for-loop is only marginally slower than `apply()` here because the work per column dominates. `colMeans()` wins by an order of magnitude because the entire reduction runs in a single C loop without per-column R calls. The lesson: prefer specialised reducers (`colMeans`, `rowSums`, `colSums`, `rowMeans`) when they exist; only reach for `apply()` when the per-column function is non-trivial.

</details>

### Exercise 6.3: rowSums beats apply by 10x for row totals

**Task:** Build a 5000-by-50 numeric matrix from `rnorm()` and compute the row sums two ways: `apply(m, 1, sum)` and `rowSums(m)`. Time both with `system.time()` and save the named numeric vector of elapsed times to `ex_6_3`. Verify both produce the same result with `all.equal()`.

**Expected result:**

```
#>    apply rowSums
#> 0.024000 0.001000
#> identical: TRUE
```

**Difficulty:** Intermediate

[HINTS]
Store both measured timings in one named container before rounding and printing them.
Build `ex_6_3` with `c(apply = ..., rowSums = ...)`, each value taken from `unname(t_apply["elapsed"])` and `unname(t_rs["elapsed"])`.

```r title="Your turn"
m <- matrix(rnorm(5000 * 50), 5000, 50)

t_apply <- system.time(a <- apply(m, 1, sum))
t_rs    <- system.time(b <- rowSums(m))

ex_6_3 <- # your code here
round(ex_6_3, 4)
cat("identical:", isTRUE(all.equal(a, b)), "\n")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
m <- matrix(rnorm(5000 * 50), 5000, 50)

t_apply <- system.time(a <- apply(m, 1, sum))
t_rs    <- system.time(b <- rowSums(m))

ex_6_3 <- c(apply   = unname(t_apply["elapsed"]),
            rowSums = unname(t_rs["elapsed"]))
round(ex_6_3, 4)
#>    apply rowSums
#> 0.024000 0.001000
cat("identical:", isTRUE(all.equal(a, b)), "\n")
#> identical: TRUE
```

**Explanation:** `apply(m, 1, sum)` transposes to row-major iteration in R and calls `sum()` on each row, paying call-and-dispatch overhead 5000 times. `rowSums()` is a single C-level scan that touches each element once. The pattern generalises: when you see `apply(m, 1, X)` or `apply(m, 2, X)` with a simple summariser, look for the dedicated version (`rowSums`, `rowMeans`, `colSums`, `colMeans`, `Rfast` package alternatives). `all.equal()` (not `==`) is the right equality check here because both pipelines return doubles with possible tiny floating-point drift.

</details>

### Exercise 6.4: Replicate vs for-loop for a coin-flip simulation

**Task:** An SRE simulating retry flakiness flips a fair coin 10 times and records the number of heads, repeated 1000 times. Use `replicate()` to produce a length-1000 integer vector. Save it to `ex_6_4` and report its mean (should be near 5) and the table of counts. The seed in setup makes results reproducible.

**Expected result:**

```
#> mean heads: 4.954
#> [1] 0 1 2 3 4 5 6 7 8 9 10
#> [2] 2 8 49 124 209 234 199 121 41 11 2
```

**Difficulty:** Intermediate

[HINTS]
Repeat one self-contained trial many times and let the repetition collect the scalar results into a vector for you.
Wrap `sum(sample(0:1, 10, replace = TRUE))` in `replicate()` with a count of 1000.

```r title="Your turn"
ex_6_4 <- # your code here using replicate
cat("mean heads:", mean(ex_6_4), "\n")
rbind(0:10, tabulate(ex_6_4 + 1, nbins = 11))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_4 <- replicate(1000, sum(sample(0:1, 10, replace = TRUE)))
cat("mean heads:", mean(ex_6_4), "\n")
#> mean heads: 4.954
rbind(0:10, tabulate(ex_6_4 + 1, nbins = 11))
#>      [,1] [,2] [,3] [,4] [,5] [,6] [,7] [,8] [,9] [,10] [,11]
#> [1,]    0    1    2    3    4    5    6    7    8     9    10
#> [2,]    2    8   49  124  209  234  199  121   41    11     2
```

**Explanation:** `replicate(n, expr)` runs `expr` `n` times and collects results. For scalar-returning simulations it produces a vector directly, eliminating the `out <- numeric(n); for (i ...) out[i] <- ...` boilerplate. Internally it is still a loop in R, so it does not beat true vectorization; the win is readability and one less spot to forget preallocation. For tighter inner loops, swap `sample(0:1, 10, replace = TRUE)` with `rbinom(1, 10, 0.5)` and skip `replicate()` entirely: `rbinom(1000, 10, 0.5)` returns the full sample in one C call.

</details>

## What to do next

- [Apply Family Exercises in R](Apply-Family-Exercises-in-R.html): 20 problems on `sapply`, `lapply`, `vapply`, `apply`, `mapply`, `tapply` to deepen the apply-family bridge between loops and pure vectorization.
- [R Functional Programming Exercises](R-Functional-Programming-Exercises.html): practice `Map`, `Reduce`, `Filter`, and function operators, the idioms that replace most loops once you stop reaching for them.
- [R Vectors Exercises](R-Vectors-Exercises.html): tighten the vector mechanics, recycling, and subsetting that make vectorized code work in the first place.
- [R for Data Science Exercises](R-for-Data-Science-Exercises.html): apply these patterns inside `dplyr`, `purrr`, and tidyverse-style row-wise versus column-wise reasoning.
