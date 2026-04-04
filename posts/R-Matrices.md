---
title: "R Matrices: Fast Linear Algebra Data Frames Can't Do"
slug: "R-Matrices"
description: "Master R matrices — create, index, transpose, multiply, invert. Matrices are single-type 2D arrays that power R's linear algebra. Interactive examples throughout."
keywords: "R matrices, matrix() in R, matrix multiplication R, solve() R, t() transpose, linear algebra R"
mathjax: false
webr: true
date: "2026-04-05"
curriculum_id: "FR-fund-2"
post_type: "FR"
auto_link_terms: "R matrices|matrix in R|matrix multiplication|matrix() function"
auto_link_case_sensitive: false
fr_parent: "R-Data-Frames.html"
---

<nav class="breadcrumb-nav">Home &gt; Learn R &gt; Further Reading &gt; R Matrices</nav>

# R Matrices: Fast Linear Algebra Data Frames Can't Do

<p class="lead">A matrix is a 2D array of values of a <strong>single type</strong> — faster and more memory-efficient than a data frame for numerical computation. Every statistical function that involves linear algebra (regression, PCA, correlation) uses matrices under the hood.</p>

## Introduction

A data frame stores multiple types per row. A matrix stores one type throughout. This trade-off makes matrices faster for math but less flexible for mixed data. If your data is all numeric and you need matrix multiplication, transposition, or inversion, use a matrix.

This tutorial covers creating matrices, indexing, transposing, matrix multiplication, and solving linear systems. Every example runs live — click **Run**.

## How do you create a matrix in R?

Use `matrix()` with a vector of values plus `nrow` or `ncol`.

```r
# Fill column-wise (default)
m <- matrix(1:12, nrow = 3, ncol = 4)
m
#>      [,1] [,2] [,3] [,4]
#> [1,]    1    4    7   10
#> [2,]    2    5    8   11
#> [3,]    3    6    9   12

# Fill row-wise
m_row <- matrix(1:12, nrow = 3, ncol = 4, byrow = TRUE)
m_row
#>      [,1] [,2] [,3] [,4]
#> [1,]    1    2    3    4
#> [2,]    5    6    7    8
#> [3,]    9   10   11   12

# Check dimensions
dim(m)
#> [1] 3 4
nrow(m)
#> [1] 3
ncol(m)
#> [1] 4
```

By default, `matrix()` fills column-by-column. Use `byrow = TRUE` to fill row-by-row. `dim()`, `nrow()`, `ncol()` return dimensions.

[KEY INSIGHT]
**A matrix is a vector with a `dim` attribute.** R stores matrix values as a single vector in column-major order, plus a `dim` attribute telling R it's 3×4 (or whatever). This is why matrices are memory-efficient.

## How do you access matrix elements?

Use `[row, col]` syntax. Leave either blank to select all.

```r
m <- matrix(1:12, nrow = 3, ncol = 4)

# Single element
m[2, 3]
#> [1] 8

# Entire row
m[1, ]
#> [1]  1  4  7 10

# Entire column
m[, 2]
#> [1] 4 5 6

# Submatrix
m[1:2, 2:3]
#>      [,1] [,2]
#> [1,]    4    7
#> [2,]    5    8

# Rows where first column > 1
m[m[, 1] > 1, ]
#>      [,1] [,2] [,3] [,4]
#> [1,]    2    5    8   11
#> [2,]    3    6    9   12
```

The `[row, col]` syntax is the same as for data frames. The difference: matrices drop to vectors by default when you select one row or column. Use `drop = FALSE` to keep the matrix shape:

```r
m[1, , drop = FALSE]    # stays a 1-row matrix
#>      [,1] [,2] [,3] [,4]
#> [1,]    1    4    7   10
```

## How do you do linear algebra with matrices?

R has full matrix arithmetic built in.

```r
A <- matrix(c(1, 2, 3, 4), nrow = 2)
A
#>      [,1] [,2]
#> [1,]    1    3
#> [2,]    2    4

B <- matrix(c(5, 6, 7, 8), nrow = 2)
B
#>      [,1] [,2]
#> [1,]    5    7
#> [2,]    6    8

# Element-wise arithmetic
A + B
#>      [,1] [,2]
#> [1,]    6   10
#> [2,]    8   12

A * B   # element-wise multiply (NOT matrix multiply)
#>      [,1] [,2]
#> [1,]    5   21
#> [2,]   12   32

# Matrix multiplication — use %*%
A %*% B
#>      [,1] [,2]
#> [1,]   23   31
#> [2,]   34   46

# Transpose
t(A)
#>      [,1] [,2]
#> [1,]    1    2
#> [2,]    3    4

# Inverse (square matrices only)
solve(A)
#>      [,1] [,2]
#> [1,]   -2  1.5
#> [2,]    1 -0.5

# Verify: A %*% solve(A) should equal identity
round(A %*% solve(A), 10)
#>      [,1] [,2]
#> [1,]    1    0
#> [2,]    0    1
```

Key distinction: `*` is element-wise; `%*%` is matrix multiplication. `t()` transposes. `solve()` inverts a square matrix OR solves `Ax = b`.

[WARNING]
**`*` on matrices is element-wise, not matrix multiplication.** Use `%*%` for matrix multiply. Mixing these is a top bug source when translating math formulas.

## How do you solve a linear system?

`solve()` handles the equation `Ax = b`.

```r
# Solve 3x + 2y = 13, x + 4y = 14
A <- matrix(c(3, 1, 2, 4), nrow = 2)
b <- c(13, 14)

x <- solve(A, b)
x
#> [1] 2.4 2.9

# Verify: A %*% x should equal b
A %*% x
#>      [,1]
#> [1,]   13
#> [2,]   14
```

`solve(A, b)` is faster and more numerically stable than `solve(A) %*% b` when you just need `x`. Use the two-argument form whenever possible.

## How do matrices compare to data frames?

| Aspect | Matrix | Data Frame |
|---|---|---|
| Column types | Single (homogeneous) | Mixed (any type per column) |
| Memory | Compact (single vector + dim) | List of vectors |
| Speed for math | Fast (BLAS/LAPACK) | Slow (column-by-column) |
| Use case | Numerical computing, linear algebra | Tabular data analysis |
| Convert | `as.matrix(df)` | `as.data.frame(m)` |

Use matrices when: computing distances, fitting linear models manually, doing matrix decompositions, correlations. Use data frames when: mixing types, labeling columns, running dplyr/tidyverse pipelines.

## Common Mistakes and How to Fix Them

### Mistake 1: Using `*` when you meant `%*%`

❌ **Wrong:**
```r
A <- matrix(1:4, 2, 2)
B <- matrix(1:4, 2, 2)
A * B
#>      [,1] [,2]
#> [1,]    1    9   # element-wise
#> [2,]    4   16
```

✅ **Correct:**
```r
A <- matrix(1:4, 2, 2)
B <- matrix(1:4, 2, 2)
A %*% B
#>      [,1] [,2]
#> [1,]    7   15   # matrix multiply
#> [2,]   10   22
```

### Mistake 2: Forgetting drop = FALSE drops the matrix

❌ **Wrong:**
```r
m <- matrix(1:12, 3, 4)
m[1, ]          # drops to a vector
class(m[1, ])
#> [1] "integer"
```

**Why it is wrong:** Downstream code expects a matrix; getting a vector fails silently.

✅ **Correct:**
```r
m <- matrix(1:12, 3, 4)
m[1, , drop = FALSE]
class(m[1, , drop = FALSE])
#> [1] "matrix" "array"
```

### Mistake 3: Mixing types creates a character matrix

❌ **Wrong:**
```r
m <- matrix(c(1, 2, "three", 4), 2, 2)
m
#>      [,1]    [,2]
#> [1,] "1"     "three"
#> [2,] "2"     "4"
```

**Why it is wrong:** Matrix is single-type. Mixing forces character coercion — numbers become strings.

✅ **Correct:** Use a data frame for mixed types, or keep matrix numeric-only.

### Mistake 4: `solve()` on a non-invertible matrix

❌ **Wrong:**
```r
singular <- matrix(c(1, 2, 2, 4), 2, 2)
solve(singular)
#> Error in solve.default(singular) :
#>   Lapack routine dgesv: system is exactly singular
```

**Why it is wrong:** Matrix is singular (rows are linearly dependent). No inverse exists.

✅ **Correct:** Check with `det(m)` — if zero, the matrix is singular. Use `MASS::ginv()` for pseudoinverse if needed.

## Practice Exercises

### Exercise 1: Build a Matrix

Create a 3×3 matrix named `my_m` with values 1 to 9 filled row-wise.

```r
# Hint: matrix(values, nrow, ncol, byrow = TRUE)
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_m <- matrix(1:9, nrow = 3, ncol = 3, byrow = TRUE)
my_m
#>      [,1] [,2] [,3]
#> [1,]    1    2    3
#> [2,]    4    5    6
#> [3,]    7    8    9
```

</details>

### Exercise 2: Transpose

Transpose `my_m` from Exercise 1.

```r
# Hint: t()
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_m <- matrix(1:9, nrow = 3, byrow = TRUE)
my_t <- t(my_m)
my_t
#>      [,1] [,2] [,3]
#> [1,]    1    4    7
#> [2,]    2    5    8
#> [3,]    3    6    9
```

</details>

### Exercise 3: Matrix Multiply

Multiply a 2×3 matrix by a 3×2 matrix. What's the shape of the result?

```r
my_A <- matrix(1:6, nrow = 2)    # 2x3
my_B <- matrix(1:6, nrow = 3)    # 3x2
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_A <- matrix(1:6, nrow = 2)
my_B <- matrix(1:6, nrow = 3)
my_result <- my_A %*% my_B
my_result
#>      [,1] [,2]
#> [1,]   22   49
#> [2,]   28   64

dim(my_result)
#> [1] 2 2
```

**Explanation:** (2×3) × (3×2) = (2×2). The inner dimensions (3) must match; outer dimensions give the result shape.

</details>

### Exercise 4: Solve a System

Solve 2x + 3y = 13, 4x - y = 5.

```r
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_A <- matrix(c(2, 4, 3, -1), nrow = 2)
my_b <- c(13, 5)
my_x <- solve(my_A, my_b)
my_x
#> [1] 2 3

# Verify
my_A %*% my_x
#>      [,1]
#> [1,]   13
#> [2,]    5
```

</details>

### Exercise 5: Correlation Matrix

Compute the correlation matrix of the numeric columns in `mtcars`.

```r
# Hint: cor() takes a matrix or data frame
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_cor <- cor(mtcars)
round(my_cor[1:4, 1:4], 2)   # show just corner
#>        mpg   cyl  disp    hp
#> mpg   1.00 -0.85 -0.85 -0.78
#> cyl  -0.85  1.00  0.90  0.83
#> disp -0.85  0.90  1.00  0.79
#> hp   -0.78  0.83  0.79  1.00
```

**Explanation:** `cor()` produces a square matrix of pairwise correlations. This is one of R's most common matrix uses.

</details>

## Complete Example: Manual Linear Regression

Fit a linear model using matrix algebra — the math behind `lm()`.

```r
# --- Manual linear regression via normal equations ---
# Solve: beta_hat = (X'X)^-1 X'y

# Setup
set.seed(42)
n <- 100
x1 <- rnorm(n)
x2 <- rnorm(n)
y <- 2 + 3 * x1 - 1.5 * x2 + rnorm(n)

# Design matrix with intercept
X <- cbind(1, x1, x2)
head(X, 3)
#>             x1         x2
#> [1,] 1 1.3709584 -0.8356286
#> [2,] 1 -0.5646982 1.5952808
#> [3,] 1 0.3631284 0.3295078

# Normal equations: beta = (X'X)^-1 X'y
beta_hat <- solve(t(X) %*% X) %*% t(X) %*% y
beta_hat
#>         [,1]
#>    1.9744123
#> x1 2.9671443
#> x2 -1.5123988

# Compare to lm()
coef(lm(y ~ x1 + x2))
#> (Intercept)         x1         x2
#>    1.974412   2.967144  -1.512399
```

The manual matrix math returns identical coefficients to `lm()`. This is exactly what R computes internally — though `lm()` uses QR decomposition for numerical stability instead of inverting `X'X` directly.

## Summary

| Operation | Syntax |
|---|---|
| Create | `matrix(vec, nrow, ncol)` |
| Fill row-wise | `matrix(vec, nrow, byrow = TRUE)` |
| Dimensions | `dim()`, `nrow()`, `ncol()` |
| Element access | `m[i, j]` |
| Transpose | `t(m)` |
| Element-wise multiply | `A * B` |
| Matrix multiply | `A %*% B` |
| Inverse | `solve(A)` |
| Solve system | `solve(A, b)` |
| Determinant | `det(m)` |
| Diagonal | `diag(m)` |
| Identity | `diag(n)` |

## FAQ

### Is a matrix the same as a 2D data frame?

No. A matrix is homogeneous (one type), a data frame is heterogeneous (mixed types per column). Matrices are faster for math; data frames are more flexible for data.

### Why does `m[1, ]` return a vector instead of a 1-row matrix?

R's default `drop = TRUE` simplifies results. Add `drop = FALSE` to preserve the matrix shape: `m[1, , drop = FALSE]`.

### What's the difference between `solve()` and `MASS::ginv()`?

`solve()` computes the true inverse; requires invertible (non-singular) matrices. `ginv()` computes the Moore-Penrose pseudoinverse; works for any matrix including singular and non-square.

### When do I use `crossprod()`?

`crossprod(X)` computes `t(X) %*% X` faster than writing it out, and is numerically more stable. Same for `tcrossprod(X)` = `X %*% t(X)`.

### Can matrices have row/column names?

Yes — use `rownames(m) <- ...` and `colnames(m) <- ...`, or set `dimnames = list(rows, cols)` in `matrix()`.

## References

1. R Core Team — *An Introduction to R*, Chapter 5 (Arrays and matrices). [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html)
2. Wickham, H. — *Advanced R*, Section 3.4 (Matrices and arrays). [Link](https://adv-r.hadley.nz/vectors-chap.html#matrices-arrays)
3. R manual — `matrix()` reference. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/matrix.html)
4. R manual — `solve()` reference. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/solve.html)
5. R manual — `%*%` and matrix multiplication. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/matmult.html)
6. Venables & Ripley — *Modern Applied Statistics with S*, Chapter 3 (Linear algebra). Springer (2002).
7. Strang, G. — *Linear Algebra and Its Applications*, 4th Edition. Brooks Cole (2005).
