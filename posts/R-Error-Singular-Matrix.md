---
title: "R solve() Error: 'singular matrix' — Diagnose Multicollinearity and Fix It"
slug: "R-Error-Singular-Matrix"
description: "R's solve() fails on singular matrices when columns are linearly dependent. Diagnose with rcond(), then fix via ridge, variable removal, or MASS::ginv()."
keywords: "R singular matrix error, system is computationally singular R, solve() error R, rcond R, multicollinearity R, ridge regression R, MASS ginv, R matrix inversion"
mathjax: true
webr: true
date: "2026-04-13"
curriculum_id: "ERR18"
post_type: "FR"
auto_link_terms: "computationally singular|singular matrix error|rcond()|MASS::ginv()|multicollinearity in R"
auto_link_case_sensitive: false
fr_parent: "R-Common-Errors.html"
difficulty: "Intermediate"
---

# R solve() Error: 'singular matrix' — Diagnose Multicollinearity and Fix It

<p class="lead"><code>Error in solve.default(...) : system is computationally singular</code> means R tried to invert a matrix whose columns carry duplicate information — one column can be written as a weighted sum of the others. In regression language, that is <strong>multicollinearity</strong>, and the fix is to find which columns collide and then drop, combine, or regularise them.</p>

## Why does solve() complain that my matrix is 'computationally singular'?

`solve()` inverts a matrix by running Gaussian elimination. If a column repeats information already carried by other columns, one elimination step ends up dividing by zero — or by a number so small that the result explodes into machine noise. R refuses to return nonsense and throws the error instead. The quickest way to see it is to feed `solve()` a 3×3 matrix whose second column is exactly twice the first, then watch R call out the zero determinant and refuse the inverse.

Let's build that matrix and hit the error on purpose. We'll measure how singular it is with `det()` and `rcond()`, then call `solve()` inside `tryCatch()` so the error text prints instead of stopping the page.

```r
# Build a 3x3 matrix where column 2 is exactly twice column 1.
X <- matrix(c(1, 2, 3,
              2, 4, 6,
              5, 1, 4), nrow = 3)
X
#>      [,1] [,2] [,3]
#> [1,]    1    2    5
#> [2,]    2    4    1
#> [3,]    3    6    4

det(X)
#> [1] 0

# rcond() returns the reciprocal condition number in [0, 1].
# Values near 0 mean "effectively singular".
rcond(X)
#> [1] 0

# solve() refuses to invert the matrix.
tryCatch(solve(X),
         error = function(e) conditionMessage(e))
#> [1] "Lapack routine dgesv: system is exactly singular: U[2,2] = 0"
```

The determinant is zero because column 2 is a scalar multiple of column 1, so the three columns span only a 2D plane instead of the full 3D space. `rcond()` confirms this with a value of 0 — the reciprocal condition number is LAPACK's way of asking "how far is this matrix from singular?" on a scale where 1 is perfectly invertible and 0 is hopelessly singular. `solve()` reports the exact elimination step where the zero pivot appeared (`U[2,2] = 0`), which is LAPACK-speak for "the second diagonal entry of the upper-triangular factor was zero."

[KEY INSIGHT]
**An NA in `coef(lm_fit)` is the friendlier face of the same singular-matrix error.** When `lm()` silently drops a predictor and returns NA, R has internally detected the exact collinearity that would have crashed `solve(t(X) %*% X)` had you called it yourself. Treat the NA as a warning, not a feature.

**Try it:** Compute the numerical rank of `X` using `qr(X)$rank` and store it in `ex_rank`. The rank should be less than `ncol(X)` — that's what "singular" means numerically.

```r
# Try it: numerical rank of a singular matrix
ex_rank <- NA  # your code here

# Test:
c(rank = ex_rank, ncol = ncol(X))
#> Expected: rank = 2, ncol = 3
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_rank <- qr(X)$rank
c(rank = ex_rank, ncol = ncol(X))
#> rank ncol
#>    2    3
```

**Explanation:** `qr()` factors the matrix and reports its numerical rank — the count of linearly independent columns. Rank 2 on a 3-column matrix confirms one column is a combination of the others.

</details>

## What kinds of R models quietly trigger a singular matrix?

The 3×3 toy above is easy to spot. Real bugs hide inside regression design matrices where a hidden collinearity only shows up a few rows deep. The situation most R users meet first is a linear model with a predictor that's a scaled copy of another — say, the same measurement in two units. `lm()` tries to mask it by dropping the redundant term and returning NA for its coefficient, but the underlying `solve(t(X) %*% X)` call still fails if you reach for it yourself.

Below, we simulate body-height data in both centimetres and metres. Both columns carry the same information (one is the other divided by 100), so the design matrix is guaranteed to be singular.

```r
set.seed(2026)
n <- 80
height_cm <- rnorm(n, mean = 170, sd = 10)
# height in metres is height_cm / 100 — a perfect linear copy.
height_m  <- height_cm / 100
y <- 2 + 0.05 * height_cm + rnorm(n, sd = 0.5)

fit <- lm(y ~ height_cm + height_m)
coef(fit)
#> (Intercept)   height_cm    height_m
#>   1.9805751   0.0503247          NA

# lm() silently drops one term. solve() on X'X would crash.
Xd <- model.matrix(fit)
tryCatch(solve(t(Xd) %*% Xd),
         error = function(e) conditionMessage(e))
#> [1] "Lapack routine dgesv: system is computationally singular: reciprocal condition number = 1.23e-18"
```

`lm()` prints an NA for `height_m` because it detected the perfect dependency during its QR-based fit and dropped the column. The NA is R's polite way of telling you "I couldn't separate these two predictors." If you skip `lm()` and compute the normal-equations solution by hand, you see the raw LAPACK message with a reciprocal condition number near $10^{-18}$, which is effectively zero in double-precision arithmetic.

**Try it:** Use `alias(fit)` to print the exact linear dependency between `height_cm` and `height_m`. The output shows which column was dropped and the coefficients of the dependency equation.

```r
# Try it: show the alias equation
ex_alias <- NA  # your code here
ex_alias
#> Expected: a matrix naming height_m as an alias of height_cm
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_alias <- alias(fit)$Complete
ex_alias
#>          (Intercept) height_cm
#> height_m 0           0.01
```

**Explanation:** `alias()` reports each dropped column as a linear combination of the remaining ones. Here `height_m = 0.01 * height_cm`, which is just the unit conversion in numeric form.

</details>

## How do I find the exact column causing the problem?

Knowing that a design matrix is singular is only half the job — you still want the name of the guilty column. QR decomposition does both things at once: it reports the numerical rank, and its `pivot` vector orders columns so that the independent ones come first and the redundant ones trail at the end. That means you can read off both "which columns to keep" and "which column is the culprit" in two lines.

We'll build a 5-column matrix where the fifth column is the sum of the first two, then ask `qr()` to locate it for us.

```r
set.seed(7)
n <- 50
X5 <- cbind(
  x1 = rnorm(n),
  x2 = rnorm(n),
  x3 = rnorm(n),
  x4 = rnorm(n),
  redundant = NA
)
X5[, "redundant"] <- X5[, "x1"] + X5[, "x2"]

qr_X <- qr(X5)
qr_X$rank
#> [1] 4

# pivot[seq_len(rank)] holds the linearly independent columns.
independent_cols <- qr_X$pivot[seq_len(qr_X$rank)]
colnames(X5)[independent_cols]
#> [1] "x1" "x2" "x3" "x4"

# Columns after rank are redundant.
redundant_cols <- qr_X$pivot[(qr_X$rank + 1):ncol(X5)]
colnames(X5)[redundant_cols]
#> [1] "redundant"
```

The rank is 4 on a 5-column matrix, which tells us exactly one column can be removed. The pivot splits naturally: the first four pivot positions name the keepers, and whatever sits past `rank` is the redundant column we need to drop. This works for any rectangular matrix, regardless of where the collinearity sits — `qr()` will always float the redundant columns to the back.

[TIP]
**`qr(X)$rank` is the fastest rank check in base R.** No package needed, and it works for matrices of any shape. If `qr(X)$rank < ncol(X)`, your matrix is singular and the pivot vector names the problem columns.

**Try it:** Drop the `redundant` column from `X5` and verify that `solve(t(X_fixed) %*% X_fixed)` succeeds. Store the fixed matrix in `ex_X_fixed`.

```r
# Try it: drop the redundant column and invert X'X
ex_X_fixed <- NA  # your code here

# Test:
dim(solve(t(ex_X_fixed) %*% ex_X_fixed))
#> Expected: [1] 4 4
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_X_fixed <- X5[, qr_X$pivot[seq_len(qr_X$rank)]]
dim(solve(t(ex_X_fixed) %*% ex_X_fixed))
#> [1] 4 4
```

**Explanation:** Indexing with `pivot[seq_len(rank)]` keeps only the independent columns. The resulting 4×4 `X'X` is full rank, so `solve()` returns its inverse.

</details>

## When should I use ridge regularisation versus a generalised inverse?

Dropping a column is the right fix when the redundancy is accidental — a duplicate, a unit-converted copy, a lagged version of the same series. It's the wrong fix when many predictors are each slightly correlated with each other, because now every column carries unique signal and you'd throw some of it away. Two alternatives keep all the columns: **ridge regression**, which adds a small penalty to the diagonal of $X^TX$ so it's always invertible, and the **Moore–Penrose pseudoinverse**, which uses the singular value decomposition to define a unique solution even when the matrix is exactly singular.

Ridge changes the normal equation from $\hat{\beta} = (X^TX)^{-1} X^T y$ to:

$$\hat{\beta}_{ridge} = (X^TX + \lambda I)^{-1} X^T y$$

Where:

- $X$ is the $n \times p$ predictor matrix
- $y$ is the length-$n$ response vector
- $\lambda$ is a small positive constant (the ridge penalty)
- $I$ is the $p \times p$ identity matrix

Adding $\lambda I$ lifts the diagonal just enough to push every eigenvalue away from zero, which is exactly what `solve()` needs. Below, we build a 60×6 matrix where columns `a` and `b` are almost identical — close enough that `rcond()` reports a value near $10^{-8}$ — then compute both fixes and compare the coefficients.

```r
library(MASS)

set.seed(42)
n <- 60
z <- rnorm(n)
X_near <- cbind(
  a = z + rnorm(n, sd = 0.001),  # almost identical to b
  b = z,
  c = rnorm(n),
  d = rnorm(n),
  e = rnorm(n),
  f = rnorm(n)
)
y_near <- 1.5 * z + rnorm(n, sd = 0.5)

rcond(t(X_near) %*% X_near)
#> [1] 4.37e-08

# Ridge: add lambda to the diagonal of X'X
lambda <- 0.1
beta_ridge <- solve(t(X_near) %*% X_near + lambda * diag(ncol(X_near))) %*% t(X_near) %*% y_near
round(drop(beta_ridge), 4)
#>       a       b       c       d       e       f
#>  0.7502  0.7498  0.0078 -0.0392 -0.0211  0.0147

# Generalised inverse via MASS::ginv() — always succeeds
beta_ginv <- MASS::ginv(t(X_near) %*% X_near) %*% t(X_near) %*% y_near
round(drop(beta_ginv), 4)
#>  0.7500  0.7500  0.0078 -0.0392 -0.0211  0.0147
```

The reciprocal condition number is so small that the naive `solve()` would refuse this matrix. Ridge splits the shared signal (true coefficient 1.5) roughly evenly between the near-duplicate columns `a` and `b` — about 0.75 each — and leaves the other coefficients near zero. `MASS::ginv()` does almost the same thing via SVD with no tuning parameter to set. On this extreme near-perfect collinearity the two methods agree to four decimal places.

[WARNING]
**Ridge and ginv diverge on moderate collinearity.** They look identical here because `a` and `b` are nearly perfect copies, but when correlations are moderate (0.7–0.9) the two methods produce visibly different coefficients and ridge usually generalises better out of sample. Use cross-validation to pick `lambda` on real data — don't default to 0.1.

**Try it:** Recompute the ridge coefficients with `lambda <- 1.0` and store the result in `ex_beta_ridge_big`. Larger lambda means more shrinkage toward zero.

```r
# Try it: stronger ridge penalty
ex_beta_ridge_big <- NA  # your code here

# Test:
round(drop(ex_beta_ridge_big)[1:2], 4)
#> Expected: ~0.74 each (smaller than with lambda=0.1)
```

<details>
<summary>Click to reveal solution</summary>

```r
lambda_big <- 1.0
ex_beta_ridge_big <- solve(
  t(X_near) %*% X_near + lambda_big * diag(ncol(X_near))
) %*% t(X_near) %*% y_near
round(drop(ex_beta_ridge_big)[1:2], 4)
#>      a      b
#> 0.7427 0.7424
```

**Explanation:** Increasing lambda pulls every coefficient closer to zero. The shrinkage is mild on the signal-carrying `a` and `b` but the effect grows as lambda rises — which is exactly how ridge trades a bit of bias for a lot of variance reduction.

</details>

## How do I avoid the dummy-variable trap with factor-heavy models?

Categorical variables open a second route to singularity. If you expand a factor into one dummy column per level and also keep the intercept, the dummy columns sum to the intercept — a perfect linear dependency hiding in plain sight. R's `model.matrix()` knows this and automatically drops one level when you write `~ factor_name`, but hand-built design matrices or `~ 0 + factor_name` formulas bypass the drop and re-introduce the problem.

Let's build both versions on a 3-level factor and compare their ranks.

```r
group <- factor(c("A", "A", "B", "B", "C", "C"))
y_fac <- c(10, 12, 20, 22, 30, 32)

# BAD: one dummy per level + an intercept
dummies_all <- model.matrix(~ 0 + group)
X_bad <- cbind(Intercept = 1, dummies_all)
X_bad
#>      Intercept groupA groupB groupC
#> [1,]         1      1      0      0
#> [2,]         1      1      0      0
#> [3,]         1      0      1      0
#> [4,]         1      0      1      0
#> [5,]         1      0      0      1
#> [6,]         1      0      0      1
qr(X_bad)$rank
#> [1] 3

# GOOD: let model.matrix() drop one level
X_good <- model.matrix(~ group)
colnames(X_good)
#> [1] "(Intercept)" "groupB"      "groupC"
qr(X_good)$rank
#> [1] 3
```

Both matrices have rank 3, but `X_bad` has 4 columns and `X_good` has 3. The fourth column in `X_bad` is redundant — adding `groupA + groupB + groupC` gives the intercept column exactly. Writing `~ group` (without the `0 +` prefix) tells `model.matrix()` to use level A as the baseline and skip its dummy, which is the standard way to parametrise a factor with an intercept.

[NOTE]
**Drop the intercept if you want all K level coefficients.** `lm(y ~ 0 + group)` gives you one coefficient per level (their group means) instead of an intercept plus K-1 contrasts. The rank stays the same, and the interpretation flips from "differences from baseline" to "absolute level means."

**Try it:** Build the design matrix for a two-factor interaction `group * rep(c("pre","post"), 3)` and check its rank with `qr()$rank`. Store the matrix in `ex_X_inter`.

```r
# Try it: two-factor interaction design matrix
time_fac <- factor(rep(c("pre", "post"), 3))
ex_X_inter <- NA  # your code here
qr(ex_X_inter)$rank
#> Expected: 6 (full rank for 3 groups x 2 times)
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_X_inter <- model.matrix(~ group * time_fac)
dim(ex_X_inter)
#> [1] 6 6
qr(ex_X_inter)$rank
#> [1] 6
```

**Explanation:** `group * time_fac` expands to main effects plus the interaction. `model.matrix()` drops the baseline level for each factor, leaving six columns: intercept, two `group` contrasts, one `time_fac` contrast, and two interaction terms — all linearly independent.

</details>

## Practice Exercises

### Exercise 1: Build a diagnose-and-fix wrapper

Write a function `my_diagnose(X)` that takes a numeric matrix, checks whether it's singular, finds the redundant columns if any, and returns a list with three fields: `rank`, `redundant_cols` (names of columns to drop), and `X_fixed` (the matrix with redundant columns removed). Test it on a matrix where `col3 = col1 + col2`.

```r
# Exercise 1: diagnose-and-fix wrapper
# Hint: use qr() and the pivot vector

my_diagnose <- function(X) {
  # your code here
}

# Test data
set.seed(1)
my_X <- cbind(a = rnorm(10), b = rnorm(10), c = NA)
my_X[, "c"] <- my_X[, "a"] + my_X[, "b"]

my_diagnose(my_X)
#> Expected: rank = 2, redundant_cols = "c", X_fixed has 2 columns
```

<details>
<summary>Click to reveal solution</summary>

```r
my_diagnose <- function(X) {
  qr_X <- qr(X)
  r <- qr_X$rank
  keep <- qr_X$pivot[seq_len(r)]
  drop_idx <- if (r < ncol(X)) qr_X$pivot[(r + 1):ncol(X)] else integer(0)
  list(
    rank = r,
    redundant_cols = colnames(X)[drop_idx],
    X_fixed = X[, keep, drop = FALSE]
  )
}

set.seed(1)
my_X <- cbind(a = rnorm(10), b = rnorm(10), c = NA)
my_X[, "c"] <- my_X[, "a"] + my_X[, "b"]
result <- my_diagnose(my_X)
result$rank
#> [1] 2
result$redundant_cols
#> [1] "c"
dim(result$X_fixed)
#> [1] 10  2
```

**Explanation:** `qr()` returns the numerical rank and a pivot vector that sorts columns with the independent ones first. Everything after position `rank` is redundant and gets dropped. Using `drop = FALSE` protects against the single-column edge case.

</details>

### Exercise 2: Closed-form ridge regression from scratch

Write a function `my_ridge(X, y, lambda)` that implements ridge regression via the closed-form formula $\hat{\beta} = (X^TX + \lambda I)^{-1} X^T y$ and returns the coefficient vector. Compare your output against `MASS::lm.ridge(y ~ X - 1, lambda = lambda)` on the `X_near` dataset from the ridge section.

```r
# Exercise 2: ridge regression from scratch
my_ridge <- function(X, y, lambda) {
  # your code here
}

# Test: should match lm.ridge closely
my_beta <- my_ridge(X_near, y_near, lambda = 0.1)
round(my_beta, 4)
#> Expected: ~0.7502, 0.7498, 0.0078, -0.0392, -0.0211, 0.0147
```

<details>
<summary>Click to reveal solution</summary>

```r
my_ridge <- function(X, y, lambda) {
  p <- ncol(X)
  drop(solve(t(X) %*% X + lambda * diag(p)) %*% t(X) %*% y)
}

my_beta <- my_ridge(X_near, y_near, lambda = 0.1)
round(my_beta, 4)
#>       a       b       c       d       e       f
#>  0.7502  0.7498  0.0078 -0.0392 -0.0211  0.0147
```

**Explanation:** The formula is a direct translation of the math. Wrapping the result in `drop()` converts the one-column matrix to a named numeric vector, which matches the output format readers expect from base R regression helpers.

</details>

### Exercise 3: Build a safe_solve() wrapper

Write `safe_solve(A)` that tries `solve(A)` normally, but falls back to `MASS::ginv(A)` with a warning if the reciprocal condition number is below `1e-12`. The function should always return an inverse (or pseudoinverse), never throw an error.

```r
# Exercise 3: safe solve wrapper
safe_solve <- function(A) {
  # your code here
}

# Test 1: well-conditioned matrix works normally
safe_solve(diag(3))
#> Expected: 3x3 identity (no warning)

# Test 2: singular matrix falls back to ginv
singular_A <- matrix(c(1, 2, 2, 4), nrow = 2)
safe_solve(singular_A)
#> Expected: warning + a valid pseudoinverse
```

<details>
<summary>Click to reveal solution</summary>

```r
safe_solve <- function(A) {
  rc <- rcond(A)
  if (rc < 1e-12) {
    warning(sprintf("Matrix is near-singular (rcond = %.2e). Falling back to MASS::ginv().", rc))
    return(MASS::ginv(A))
  }
  solve(A)
}

safe_solve(diag(3))
#>      [,1] [,2] [,3]
#> [1,]    1    0    0
#> [2,]    0    1    0
#> [3,]    0    0    1

singular_A <- matrix(c(1, 2, 2, 4), nrow = 2)
safe_solve(singular_A)
#> Warning: Matrix is near-singular (rcond = 0.00e+00). Falling back to MASS::ginv().
#>      [,1] [,2]
#> [1,] 0.04 0.08
#> [2,] 0.08 0.16
```

**Explanation:** `rcond()` costs almost nothing to compute, so the early-exit check adds no meaningful overhead. The fallback gives you a usable pseudoinverse whenever the matrix would otherwise crash `solve()`, which is the behaviour you usually want in a long-running pipeline.

</details>

## Complete Example: Full diagnose-then-fix workflow

Let's walk through an end-to-end case that mirrors what you'd do on real data. We'll simulate 100 observations with 6 predictors where two predictors are near-copies of a third, detect the problem with `rcond()`, name the offender with `qr()`, and fix it two ways: drop-and-solve for the exact redundancy, and ridge for the remaining near-collinearity.

```r
# Step 1: simulate multicollinear data
set.seed(2026)
n_full <- 100
z1 <- rnorm(n_full)
z2 <- rnorm(n_full)
full_X <- cbind(
  x1 = z1,
  x2 = z2,
  x3 = z1 + z2,              # EXACT linear combination
  x4 = z1 + rnorm(n_full, sd = 0.05),  # near-copy of x1
  x5 = rnorm(n_full),
  x6 = rnorm(n_full)
)
full_y <- 2 * z1 - 1.5 * z2 + rnorm(n_full, sd = 0.5)

# Step 2: diagnose with rcond
rcond(t(full_X) %*% full_X)
#> [1] 3.12e-18

# Step 3: find the exact redundancy with qr
qr_full <- qr(full_X)
qr_full$rank
#> [1] 5
colnames(full_X)[qr_full$pivot[(qr_full$rank + 1):ncol(full_X)]]
#> [1] "x3"

# Step 4a: drop the exact duplicate and check again
X_dropped <- full_X[, qr_full$pivot[seq_len(qr_full$rank)]]
rcond(t(X_dropped) %*% X_dropped)
#> [1] 0.000198   # bigger, but still small because x1 ~ x4

# Step 4b: apply ridge to the remainder
lambda <- 0.1
beta_final <- solve(
  t(X_dropped) %*% X_dropped + lambda * diag(ncol(X_dropped))
) %*% t(X_dropped) %*% full_y
round(drop(beta_final), 3)
#>     x1     x2     x4     x5     x6
#>  0.994 -1.496  0.996  0.031 -0.056
```

The workflow is deliberately layered. `rcond()` at step 2 flags the matrix as singular (reciprocal condition number near $10^{-18}$). `qr()` at step 3 names `x3` as the exact-duplicate offender. Dropping `x3` lifts `rcond()` by fourteen orders of magnitude, but the matrix is still mildly ill-conditioned because `x4` remains nearly identical to `x1`. A ridge penalty absorbs that residual near-singularity and returns coefficients that split the shared signal between `x1` and `x4` (each around 0.99, summing to the true value of 2) while recovering `x2`'s true coefficient of -1.5 cleanly.

[TIP]
**Combine drop-then-ridge for messy real data.** Dropping handles exact duplicates that ridge would otherwise absorb poorly, and ridge handles the leftover near-collinearity that dropping would discard signal for. Running them in order is almost always safer than using either on its own.

## Summary

| Symptom | Diagnosis | Fix |
|---|---|---|
| `Error in solve.default: system is computationally singular` | `det(X) == 0`; `rcond(X)` near 0 | Diagnose with `qr()` before fixing |
| NA coefficient in `lm()` output | `alias(fit)` shows the dependency | Drop the duplicated column |
| Redundant column after feature engineering | `qr(X)$pivot[(rank+1):ncol(X)]` names it | Drop via `X[, qr(X)$pivot[seq_len(rank)]]` |
| Many mildly correlated predictors | `kappa(X)` very large, `rcond()` small | Ridge: `solve(X'X + lambda*I)` |
| p > n matrix | Rank capped at n | `MASS::ginv()` or ridge + cross-validation |
| Dummy variable trap | `qr()$rank < ncol` on factor design | Use `~ factor` (not `~ 0 + factor + intercept`) |

## References

1. R Core Team — `?solve`, `?rcond`, `?qr`. [R documentation](https://stat.ethz.ch/R-manual/R-devel/library/base/html/solve.html)
2. Venables, W. N. & Ripley, B. D. — *Modern Applied Statistics with S*, 4th ed. MASS package reference, especially `ginv()`. [CRAN](https://cran.r-project.org/package=MASS)
3. Hastie, T., Tibshirani, R. & Friedman, J. — *The Elements of Statistical Learning*, 2nd ed. Chapter 3: Ridge Regression. [Free PDF](https://hastie.su.domains/ElemStatLearn/)
4. Wickham, H. — *Advanced R*, 2nd ed. Numerical linear algebra notes. [adv-r.hadley.nz](https://adv-r.hadley.nz/)
5. Wikipedia — Condition number of a matrix. [Link](https://en.wikipedia.org/wiki/Condition_number)
6. Wikipedia — Moore–Penrose inverse. [Link](https://en.wikipedia.org/wiki/Moore%E2%80%93Penrose_inverse)
7. Statistics Globe — "R Error in solve.default: system is exactly singular." [Link](https://statisticsglobe.com/r-error-in-solve-system-is-exactly-singular)

## Continue Learning

1. **[R Common Errors](R-Common-Errors.html)** — the full reference of R errors, with quick fixes for the most frequent crashes.
2. **[Linear Regression in R](Linear-Regression.html)** — the method where singular design matrices appear most often; includes diagnostic plots and assumption checks.
3. **[Ridge and Lasso Regression in R](Ridge-Regression.html)** — a deeper treatment of regularisation, including how to tune `lambda` with cross-validation.
