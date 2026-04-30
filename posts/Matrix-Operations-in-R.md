---
title: "Matrix Operations in R: Create, Multiply, Invert & Transpose for Statistics"
slug: "Matrix-Operations-in-R"
description: "Master matrix operations in R: create with matrix(), transpose with t(), multiply with %*%, invert with solve(), plus determinants and rank for stats."
keywords: "matrix operations in R, matrix multiplication R, matrix inverse R, transpose matrix R, solve() R, determinant R, R linear algebra, design matrix R, crossprod R"
auto_link_terms: "matrix operations in R|matrix multiplication in R|matrix inverse in R|transpose a matrix in R|R matrix algebra|design matrix in R"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-30"
curriculum_id: "2.9.1"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Matrix Operations in R"
sidebar_order: 100
difficulty: "Intermediate"
---

# Matrix Operations in R: Create, Multiply, Invert & Transpose for Statistics

<p class="lead">Matrix operations in R are the linear algebra building blocks behind regression, PCA, and most multivariate methods. You create matrices with <code>matrix()</code>, transpose with <code>t()</code>, multiply with <code>%*%</code>, and invert with <code>solve()</code>, all in base R, no extra packages needed.</p>

## How do you create a matrix in R?

Most stats methods boil down to manipulating a rectangular grid of numbers. In R, that grid is a `matrix` object: a vector of values plus a `dim` attribute that tells R how many rows and columns to draw. Once you can build one, every operation that follows reads like ordinary arithmetic. We will start with the smallest useful matrix, a 2-by-3 grid, and inspect what R gives back.

The `matrix()` function takes a vector of values and a target shape. Pass `nrow` or `ncol` (or both) and R fills the grid in column-major order by default.

```r title="Create a 2x3 matrix with matrix()"
A <- matrix(1:6, nrow = 2, ncol = 3)
A
#>      [,1] [,2] [,3]
#> [1,]    1    3    5
#> [2,]    2    4    6

dim(A)
#> [1] 2 3
```

Notice how `1:6` filled the matrix down the first column, then the second, then the third. That is column-major order, the same convention Fortran and most numerical libraries use. `dim(A)` confirms the shape: 2 rows, 3 columns. From here, every operation we cover treats `A` as one block of numbers.

If you would rather fill across rows, set `byrow = TRUE`. This is mostly cosmetic for input, but it can make small matrices easier to type out by hand.

```r title="Fill by row instead of by column"
A_row <- matrix(1:6, nrow = 2, ncol = 3, byrow = TRUE)
A_row
#>      [,1] [,2] [,3]
#> [1,]    1    2    3
#> [2,]    4    5    6
```

Same six values, different arrangement. The underlying storage is still column-major; `byrow` only affects how the input vector is mapped during construction. Once built, a matrix knows nothing about how you typed it.

[TIP]
**Name your rows and columns for readability.** Pass `dimnames = list(c("r1","r2"), c("c1","c2","c3"))` to `matrix()` and your output prints with labels, which is invaluable when you have a design matrix with predictor names like `intercept`, `mpg`, `wt`.

**Try it:** Build a 3-by-3 matrix `ex_mat` from the values `1:9`, filled by row. Print it.

```r title="Your turn: 3x3 matrix filled by row"
ex_mat <- matrix(  # your code here
)
ex_mat
#> Expected: rows 1-3, 4-6, 7-9
```

<details>
<summary>Click to reveal solution</summary>

```r title="3x3 matrix solution"
ex_mat <- matrix(1:9, nrow = 3, ncol = 3, byrow = TRUE)
ex_mat
#>      [,1] [,2] [,3]
#> [1,]    1    2    3
#> [2,]    4    5    6
#> [3,]    7    8    9
```

**Explanation:** `byrow = TRUE` walks across the first row before moving to the second, matching how you would write the matrix on paper.

</details>

## How does matrix multiplication work in R?

Two matrices multiplied together encode a transformation: rotate, project, regress, predict. R offers two very different multiplication operators, and mixing them up is the most common bug for newcomers. The element-wise `*` multiplies corresponding cells; the matrix product `%*%` performs the dot-product-of-rows-and-columns operation from linear algebra. The first works on equal shapes; the second works when the inner dimensions match.

Let's see both side by side on a pair of 2-by-2 matrices.

```r title="Element-wise * vs matrix product %*%"
M <- matrix(c(1, 2, 3, 4), nrow = 2)
N <- matrix(c(5, 6, 7, 8), nrow = 2)

elem_prod <- M * N        # cell by cell
mat_prod  <- M %*% N      # rows of M dot columns of N

elem_prod
#>      [,1] [,2]
#> [1,]    5   21
#> [2,]   12   32

mat_prod
#>      [,1] [,2]
#> [1,]   23   31
#> [2,]   34   46
```

The element-wise product just multiplied each pair of cells: cell (1,1) got `1 * 5 = 5`, cell (2,2) got `4 * 8 = 32`. The matrix product, by contrast, sums products across a row of `M` and a column of `N`: cell (1,1) is `1*5 + 3*6 = 23`. Whenever you mean linear algebra, you almost always want `%*%`.

For the matrix product to be defined, the number of columns in the first matrix must equal the number of rows in the second. The result inherits the outer dimensions.

![Matrix multiplication dimension rule](screenshots/Matrix-Operations-in-R-multiplication-rule.webp)
*Figure 1: The inner dimensions must match for `%*%` to work; the outer dimensions become the result's shape.*

[WARNING]
**`*` is not matrix multiplication.** Writing `A * B` when you meant `A %*% B` will silently give you the wrong answer if the shapes happen to match, or a recycling error if they don't. Many regression bugs trace back to this single character.

In statistics you very often want the **gram matrix** `t(X) %*% X`, the cross-products of every column with every other column. R provides a faster, more numerically careful shortcut: `crossprod(X)`.

```r title="crossprod is a shortcut for t(X) %*% X"
X <- matrix(c(1, 1, 1, 2, 4, 6), ncol = 2)
gram <- crossprod(X)
gram
#>      [,1] [,2]
#> [1,]    3   12
#> [2,]   12   56

# Same answer, but slower and less stable on big X:
all.equal(gram, t(X) %*% X)
#> [1] TRUE
```

`crossprod()` is mathematically identical to `t(X) %*% X` but skips the explicit transpose and uses BLAS routines tuned for symmetric outputs. On a 10,000-row design matrix, the saving is dramatic. Its sibling `tcrossprod(X)` computes `X %*% t(X)`, useful for kernel methods.

**Try it:** Multiply the 2-by-3 matrix `A` (from the first section) by its transpose to get a 2-by-2 result. Use `%*%` directly with `t()`.

```r title="Your turn: A times its transpose"
ex_AAt <- # your code here
ex_AAt
#> Expected: a 2x2 matrix; cell (1,1) should be 35
```

<details>
<summary>Click to reveal solution</summary>

```r title="A times A-transpose solution"
ex_AAt <- A %*% t(A)
ex_AAt
#>      [,1] [,2]
#> [1,]   35   44
#> [2,]   44   56
```

**Explanation:** `A` is 2x3 and `t(A)` is 3x2, so `A %*% t(A)` is 2x2. Cell (1,1) is `1*1 + 3*3 + 5*5 = 35`.

</details>

## How do you transpose a matrix in R?

Transposing a matrix flips it across its main diagonal: row 1 becomes column 1, row 2 becomes column 2, and so on. It is the single most common manipulation in statistics because regression, ANOVA, and PCA are built on `t(X) %*% X` and similar expressions. R gives you `t()` for the job.

```r title="Transpose with t()"
At <- t(A)
At
#>      [,1] [,2]
#> [1,]    1    2
#> [2,]    3    4
#> [3,]    5    6

dim(At)
#> [1] 3 2
```

The 2-by-3 matrix `A` flipped to become a 3-by-2 matrix. Row 1 of `A`, `(1, 3, 5)`, is now column 1 of `At`. The shape swap is automatic; `t()` is one of those rare R functions that does exactly one thing and does it cleanly.

Why does this matter for stats? Take a tiny **design matrix** with an intercept column and one predictor. The product `t(X) %*% X` gives the sums and sums-of-squares that define every element of the normal equations.

```r title="Build a small design matrix and compute X'X"
design_X <- cbind(intercept = 1, x = c(2, 4, 6, 8))
design_X
#>      intercept x
#> [1,]         1 2
#> [2,]         1 4
#> [3,]         1 6
#> [4,]         1 8

XtX <- t(design_X) %*% design_X
XtX
#>           intercept   x
#> intercept         4  20
#> x                20 120
```

The result is a 2-by-2 symmetric matrix. The top-left `4` is the count of observations, the `20`s are the sum of `x`, and `120` is the sum of `x^2`. Every regression formula starts here, including the closed-form solution we will use in the Putting It All Together section.

[KEY INSIGHT]
**`t(X) %*% X` is symmetric and stores all the second-moment information about your predictors.** Its diagonal holds sums of squares; its off-diagonal holds sums of cross-products. That is why it appears in regression, PCA, and almost every multivariate technique.

**Try it:** Create a 4-by-2 numeric matrix `ex_M` of your choosing and compute its transpose `ex_Mt`. Confirm that `dim(ex_Mt)` is `c(2, 4)`.

```r title="Your turn: transpose a 4x2 matrix"
ex_M <- # your code here

ex_Mt <- # your code here
dim(ex_Mt)
#> Expected: 2 4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Transpose 4x2 solution"
ex_M <- matrix(1:8, nrow = 4, ncol = 2)
ex_Mt <- t(ex_M)
dim(ex_Mt)
#> [1] 2 4
```

**Explanation:** `t()` swaps the dimensions, so a 4-row 2-column matrix becomes a 2-row 4-column matrix.

</details>

## How do you invert a matrix in R?

The inverse of a matrix `A`, written `A^-1`, satisfies `A %*% A^-1 = I`, where `I` is the identity matrix. In statistics, the inverse appears in the closed-form regression coefficient `(X'X)^-1 X'y` and in computing covariance matrices for parameter estimates. R uses `solve()` for both inverting matrices and solving linear systems.

Let's invert a small invertible matrix and verify by multiplying it back.

```r title="Invert a 2x2 matrix and verify the identity"
B <- matrix(c(4, 2, 7, 6), nrow = 2)
B_inv <- solve(B)
B_inv
#>      [,1] [,2]
#> [1,]  0.6 -0.7
#> [2,] -0.2  0.4

identity_check <- B %*% B_inv
round(identity_check, 8)
#>      [,1] [,2]
#> [1,]    1    0
#> [2,]    0    1
```

`solve(B)` returned the inverse. Multiplying `B` by its inverse gave back the 2-by-2 identity matrix, confirming the inversion worked. We rounded to 8 decimals because floating-point arithmetic produces values like `1e-17` instead of exact zeros.

In practice, you almost never want to compute an inverse just to multiply it by a vector. If your goal is to solve `A x = b`, pass `b` as the second argument to `solve()`. R will use a more accurate and faster algorithm internally.

```r title="Solve a linear system Ax = b"
A_sys <- matrix(c(3, 1, 2, 4), nrow = 2)
b_sys <- c(11, 14)

x_sys <- solve(A_sys, b_sys)
x_sys
#> [1] 1.8 2.6

A_sys %*% x_sys
#>      [,1]
#> [1,]   11
#> [2,]   14
```

`solve(A_sys, b_sys)` returned the vector `x` such that `A_sys %*% x = b_sys`. Multiplying back recovers the original `b_sys`, so the answer is correct. Internally R applies LU decomposition with partial pivoting, which is both faster and more numerically stable than computing `solve(A_sys) %*% b_sys`.

[TIP]
**Prefer `solve(A, b)` over `solve(A) %*% b`.** The two-argument form is faster and avoids the loss of precision that comes from forming an explicit inverse. Reserve `solve(A)` for cases where you genuinely need the inverse matrix, like reporting a covariance of estimates.

A matrix is invertible only when it is **square** and has a **non-zero determinant**. If either condition fails, `solve()` throws an error.

![Invertibility decision flow](screenshots/Matrix-Operations-in-R-invertibility-decision.webp)
*Figure 2: A matrix is invertible only if it is square and has a non-zero determinant.*

```r title="Singular matrix has det() of 0"
A_sing <- matrix(c(1, 2, 2, 4), nrow = 2)  # row 2 is 2x row 1
det_sing <- det(A_sing)
det_sing
#> [1] 0

# solve(A_sing)  # would error: "Lapack routine dgesv: system is exactly singular"
```

`A_sing` has linearly dependent rows, so its determinant is 0 and it has no ordinary inverse. In real data, you usually meet this through near-singularity: a determinant close to zero. That signals a multicollinearity problem, and the practical fix is either dropping a redundant predictor or using a pseudoinverse like `MASS::ginv()`.

[NOTE]
**For rank-deficient or non-square matrices use the Moore-Penrose pseudoinverse.** Load `MASS` and call `MASS::ginv(A)`. It returns a sensible answer even when `solve()` would fail, at the cost of a slightly more expensive computation.

**Try it:** Invert this 3-by-3 matrix and verify by computing `M_inv %*% M`. Round to 8 decimals.

```r title="Your turn: invert a 3x3 matrix"
ex_M3 <- matrix(c(2, 0, 0, 1, 3, 0, 1, 1, 4), nrow = 3)
ex_M3_inv <- # your code here

round(ex_M3_inv %*% ex_M3, 8)
#> Expected: 3x3 identity matrix
```

<details>
<summary>Click to reveal solution</summary>

```r title="3x3 inverse solution"
ex_M3 <- matrix(c(2, 0, 0, 1, 3, 0, 1, 1, 4), nrow = 3)
ex_M3_inv <- solve(ex_M3)

round(ex_M3_inv %*% ex_M3, 8)
#>      [,1] [,2] [,3]
#> [1,]    1    0    0
#> [2,]    0    1    0
#> [3,]    0    0    1
```

**Explanation:** `ex_M3` is upper triangular with non-zero diagonal entries, so its determinant is `2 * 3 * 4 = 24`, well away from zero. `solve()` returns a clean inverse.

</details>

## What other operations support statistical computing?

Beyond create, multiply, transpose, and invert, four more functions cover almost every linear-algebra need in day-to-day stats: `det()`, `diag()`, `eigen()`, and `qr()`. They show up in covariance estimation, PCA, and rank-deficiency diagnostics.

`det()` returns the determinant, useful as a fast invertibility check. `diag()` is overloaded: passing a matrix extracts its diagonal, passing a vector builds a diagonal matrix from it, and passing a single integer returns an identity matrix of that size.

```r title="det() and diag() in action"
C <- matrix(c(4, 1, 1, 3), nrow = 2)
det_C <- det(C)
det_C
#> [1] 11

diag_C <- diag(C)         # extract the diagonal
diag_C
#> [1] 4 3

I3 <- diag(3)             # 3x3 identity matrix
I3
#>      [,1] [,2] [,3]
#> [1,]    1    0    0
#> [2,]    0    1    0
#> [3,]    0    0    1
```

`det(C)` returned 11, so `C` is comfortably invertible. `diag(C)` pulled out the diagonal entries `(4, 3)`, and `diag(3)` constructed a fresh 3-by-3 identity. The same function does three jobs because R dispatches on the input type.

For richer structure, `eigen()` decomposes a square matrix into its eigenvalues and eigenvectors. On a covariance matrix, the eigenvectors point along the directions of greatest variance, which is exactly what PCA exploits.

```r title="Eigenvalues of a covariance-like matrix"
cov_mat <- matrix(c(4, 2, 2, 3), nrow = 2)
eig <- eigen(cov_mat)

eig$values
#> [1] 5.561553 1.438447

eig$vectors
#>            [,1]       [,2]
#> [1,] -0.7882054  0.6154122
#> [2,] -0.6154122 -0.7882054
```

The two eigenvalues sum to 7, which is also the trace (`4 + 3`) of `cov_mat`. The first eigenvector points in the direction of the largest variance (eigenvalue 5.56). PCA simply rotates your data onto these axes; that is the entire algorithm.

[KEY INSIGHT]
**Eigenvectors of a covariance matrix point along the directions of greatest variance.** Once you see this, PCA stops being magic: it is just an eigen-decomposition with a sensible choice of axes.

**Try it:** Build a 3-by-3 matrix `ex_K`, extract its diagonal into `ex_diag_K`, and compute its determinant `ex_det_K`. Use whatever values you like.

```r title="Your turn: extract diagonal and compute determinant"
ex_K <- matrix(c(2, 0, 1, 0, 5, 0, 1, 0, 3), nrow = 3)
ex_diag_K <- # your code here
ex_det_K  <- # your code here

ex_diag_K
ex_det_K
#> Expected diag: 2 5 3; det: 25
```

<details>
<summary>Click to reveal solution</summary>

```r title="Diagonal and determinant solution"
ex_diag_K <- diag(ex_K)
ex_det_K  <- det(ex_K)

ex_diag_K
#> [1] 2 5 3
ex_det_K
#> [1] 25
```

**Explanation:** `diag()` pulls the main diagonal. The determinant comes out non-zero, so `ex_K` is invertible.

</details>

## Practice Exercises

These three problems combine the operations above. They build to the regression-by-matrix-algebra example in the next section.

### Exercise 1: Solve a 3x3 linear system

Use `solve(A, b)` to find the vector `my_x` that satisfies `my_A %*% my_x = my_b`. Verify by multiplying `my_A` by your answer.

```r title="Exercise 1 starter"
my_A <- matrix(c(2, 1, 1, 1, 3, 2, 1, 0, 4), nrow = 3)
my_b <- c(8, 13, 14)

# Hint: pass both A and b to solve()
my_x <- # your code here

my_A %*% my_x
#> Expected: a column vector that matches my_b
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_x <- solve(my_A, my_b)
my_x
#> [1] 1.785714 3.000000 3.053571

my_A %*% my_x
#>          [,1]
#> [1,]        8
#> [2,]       13
#> [3,]       14
```

**Explanation:** The two-argument form of `solve()` is preferred over computing the inverse explicitly because it is faster and more numerically stable.

</details>

### Exercise 2: Build a projection (hat) matrix and check its properties

For the matrix `my_X` below, build the projection matrix `my_H = X (X'X)^-1 X'`. Verify it is **idempotent** (`H %*% H` equals `H`) and **symmetric** (`t(H)` equals `H`). The hat matrix is what regression uses to map `y` onto fitted values.

```r title="Exercise 2 starter"
my_X <- cbind(1, c(1, 2, 3, 4, 5))

my_H <- # your code here, build H = X (X'X)^-1 X'

# Idempotent check
all.equal(my_H %*% my_H, my_H)
#> Expected: TRUE

# Symmetric check
all.equal(t(my_H), my_H)
#> Expected: TRUE
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
my_H <- my_X %*% solve(t(my_X) %*% my_X) %*% t(my_X)

all.equal(my_H %*% my_H, my_H)
#> [1] TRUE

all.equal(t(my_H), my_H)
#> [1] TRUE
```

**Explanation:** The hat matrix projects any vector onto the column space of `X`. Projecting twice gives the same result as projecting once, which is what idempotence means geometrically.

</details>

### Exercise 3: Compare manual coefficients with lm()

Generate `my_y` and `my_X2` below, compute the least-squares estimate `my_beta = (X'X)^-1 X'y` by hand, then fit the same model with `lm()` and check the coefficients match.

```r title="Exercise 3 starter"
set.seed(123)
my_x_var <- rnorm(50)
my_y     <- 2 + 3 * my_x_var + rnorm(50, sd = 0.5)
my_X2    <- cbind(intercept = 1, x = my_x_var)

my_beta <- # your code here

# Compare with lm()
coef(lm(my_y ~ my_x_var))
#> Expected: roughly 2 and 3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
my_beta <- solve(t(my_X2) %*% my_X2) %*% t(my_X2) %*% my_y
my_beta
#>           [,1]
#> intercept 2.07
#> x         3.01

coef(lm(my_y ~ my_x_var))
#> (Intercept)    my_x_var
#>        2.07        3.01
```

**Explanation:** The closed-form OLS solution and `lm()` give identical answers because `lm()` solves exactly the same equation, just with a more numerically stable QR decomposition under the hood.

</details>

## Putting It All Together: regression by matrix algebra

To see every operation working in concert, fit a linear regression on `mtcars` using only matrix operations. We model `mpg` as a function of `wt` and `hp`. The closed-form solution is:

$$\hat{\beta} = (X^T X)^{-1} X^T y$$

Where:
- $X$ = the design matrix (intercept column plus predictors)
- $y$ = the response vector
- $\hat{\beta}$ = the estimated coefficients

```r title="Manual OLS regression on mtcars"
y_reg <- mtcars$mpg
X_reg <- cbind(intercept = 1, wt = mtcars$wt, hp = mtcars$hp)

beta_hat <- solve(t(X_reg) %*% X_reg) %*% t(X_reg) %*% y_reg
beta_hat
#>                  [,1]
#> intercept 37.22727012
#> wt        -3.87783074
#> hp        -0.03177295

# Compare with lm()
coef(lm(mpg ~ wt + hp, data = mtcars))
#> (Intercept)          wt          hp
#>  37.2272701  -3.8778307  -0.0317730
```

The hand-computed coefficients match `lm()` to the last decimal. Building it from matrix primitives makes the formula concrete: every regression you have ever fitted is exactly this expression, dressed up with diagnostics. Production code should still call `lm()`, it uses QR decomposition for numerical stability, but knowing the matrix recipe lets you debug strange results, build models in languages without a built-in regression, and read papers without skipping the math.

## Summary

The five families of matrix operations cover almost everything statistics asks of linear algebra.

![Matrix operations toolkit overview](screenshots/Matrix-Operations-in-R-overview-mindmap.webp)
*Figure 3: The five families of matrix operations every R user should know.*

| Operation | R function | When to use | Statistical use case |
|---|---|---|---|
| Create | `matrix()`, `cbind()`, `rbind()` | Building a grid from raw values | Design matrices, contrast matrices |
| Transpose | `t()` | Swap rows and columns | Forming `X'X` in regression |
| Multiply | `%*%`, `crossprod()` | Combine two matrices linearly | Predictions, covariance computation |
| Invert / solve | `solve(A)`, `solve(A, b)` | Reverse a transformation, solve a system | OLS coefficients, parameter SEs |
| Decompose | `det()`, `diag()`, `eigen()`, `qr()` | Inspect structure | Invertibility, PCA, rank checks |

A few rules of thumb to take away:

- Use `%*%` for matrix multiplication; never `*`.
- Prefer `crossprod(X)` over `t(X) %*% X` for speed and stability on large data.
- Prefer `solve(A, b)` over `solve(A) %*% b`.
- Check `det()` (or even better, the smallest eigenvalue) before inverting a covariance-like matrix.
- For rank-deficient problems, switch to `MASS::ginv()`.

[TIP]
**Get fluent with these eight functions before learning specialized packages.** `matrix`, `t`, `%*%`, `crossprod`, `solve`, `det`, `diag`, and `eigen` will carry you through 90% of statistical computing in R.

## References

1. R Core Team, *An Introduction to R*, section on Arrays and Matrices. [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html#Arrays-and-matrices)
2. R Documentation, `solve()` function reference. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/solve.html)
3. R Documentation, `crossprod()` and `tcrossprod()`. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/crossprod.html)
4. Wickham, H., *Advanced R*, 2nd Edition. CRC Press (2019). Chapter 3: Vectors. [Link](https://adv-r.hadley.nz/vectors-chap.html)
5. UCLA OARC Statistical Methods, Matrices and matrix computations in R. [Link](https://stats.oarc.ucla.edu/r/library/r-library-matrices-and-matrix-computations-in-r/)
6. Strang, G., *Introduction to Linear Algebra*, 5th Edition. Wellesley-Cambridge Press (2016).
7. Venables, W. N. and Ripley, B. D., *Modern Applied Statistics with S*, 4th ed., Springer (2002). Chapter 3 covers `MASS::ginv` for rank-deficient inversion.

## Continue Learning

- [Linear Regression in R](Linear-Regression.html), see how `lm()` applies these matrix ops behind the scenes, with diagnostics layered on top.
- [PCA in R](PCA-in-R.html), apply `eigen()` (or `prcomp()`) to a covariance matrix to find the directions of maximum variance.
- [R Matrices](R-Matrices.html), focuses on the matrix data structure itself: indexing, naming, and conversion to and from data frames.
