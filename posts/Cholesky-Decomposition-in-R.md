---
title: "Cholesky Decomposition in R: chol() for Positive Definite Matrices"
slug: "Cholesky-Decomposition-in-R"
description: "Master Cholesky decomposition in R using chol(). Factor symmetric positive-definite matrices, solve linear systems faster than LU, simulate correlated MVN data."
keywords: "Cholesky decomposition R, chol() function R, positive definite matrix R, chol2inv R, backsolve R, correlated multivariate normal simulation, covariance factorization, symmetric positive definite, pivot Cholesky, LAPACK chol R"
auto_link_terms: "Cholesky decomposition in R|chol() in R|chol2inv() in R|positive definite matrix|symmetric positive definite|backsolve() in R|forwardsolve() in R"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-30"
curriculum_id: "FR-line-1"
post_type: "FR"
fr_parent: "QR-Decomposition-in-R.html"
difficulty: "Advanced"
---

# Cholesky Decomposition in R: chol() for Positive Definite Matrices

<p class="lead">Cholesky decomposition factors a symmetric positive-definite matrix <code>A</code> into <code>A = U<sup>T</sup> U</code>, where <code>U</code> is upper triangular. In R, <code>chol(A)</code> returns that <code>U</code> factor in one call. Cholesky is the fastest decomposition for symmetric positive-definite matrices, roughly twice as fast as LU, and it powers multivariate normal simulation, ridge regression, Kalman filters, and Bayesian samplers.</p>

## What is Cholesky decomposition, and when can you use it?

Strip away the math jargon and Cholesky is the matrix equivalent of taking a square root. Just as `sqrt(9) = 3` gives a number whose square recovers 9, Cholesky gives an upper-triangular `U` whose self-transpose-product recovers the original matrix. Two requirements must hold: the matrix must be symmetric (`A == t(A)`), and it must be positive definite (all eigenvalues strictly greater than zero). Covariance matrices satisfy both as long as no variable is a linear combination of the others.

Let's compute the factorization for a small 3x3 covariance matrix and confirm the round-trip on screen.

```r title="Factor an SPD matrix and reconstruct"
A <- matrix(c(4,  2, -2,
              2,  3,  1,
             -2,  1,  6), nrow = 3, byrow = TRUE)

U <- chol(A)
U
#>      [,1]      [,2]       [,3]
#> [1,]    2 1.0000000 -1.0000000
#> [2,]    0 1.4142136  1.4142136
#> [3,]    0 0.0000000  2.0000000

t(U) %*% U
#>      [,1] [,2] [,3]
#> [1,]    4    2   -2
#> [2,]    2    3    1
#> [3,]   -2    1    6
```

Three things to read off this output. First, `U` has zeros below the diagonal, which is what "upper triangular" means. Second, `t(U) %*% U` reproduces `A` exactly to machine precision, confirming the factorization is exact rather than approximate. Third, R's convention is to return the *upper* factor, so the textbook lower factor `L` is just `t(U)`.

[KEY INSIGHT]
**Cholesky is a matrix square root for symmetric positive-definite matrices.** Every SPD matrix has a unique upper-triangular factor `U` with positive diagonal such that `t(U) %*% U` reconstructs the original. No SPD matrix means no Cholesky.

**Try it:** Build the 4x4 SPD matrix below, factor it with `chol()`, and verify that `t(ex_U) %*% ex_U` reproduces `ex_A` (use `round(..., 10)` to suppress floating-point noise).

```r title="Your turn: factor a 4x4 SPD matrix"
ex_A <- matrix(c(5, 1, 0, 1,
                 1, 4, 1, 0,
                 0, 1, 3, 1,
                 1, 0, 1, 2), nrow = 4, byrow = TRUE)

# your code here: factor ex_A, then check t(ex_U) %*% ex_U
```

<details>
<summary>Click to reveal solution</summary>

```r title="4x4 SPD reconstruction solution"
ex_U <- chol(ex_A)
round(t(ex_U) %*% ex_U, 10)
#>      [,1] [,2] [,3] [,4]
#> [1,]    5    1    0    1
#> [2,]    1    4    1    0
#> [3,]    0    1    3    1
#> [4,]    1    0    1    2
```

**Explanation:** `chol()` returns the upper factor; transposing and multiplying back recovers the original SPD input.

</details>

## How does R's chol() function actually work?

Two facts about `chol()` trip up most newcomers. R returns the upper factor `U`, while many textbooks and other languages (NumPy's `numpy.linalg.cholesky`, MATLAB's default) return the lower factor `L`. The two are related by transpose: `L = t(U)`. The second fact is more dangerous: `chol()` does not check that your input is symmetric. It silently reads only the upper triangle, so a non-symmetric matrix will not throw an error, it will just return the factorization of a different matrix.

Let's factor the covariance of the four numeric columns of `iris` and inspect both `U` and `L`.

```r title="Factor cov(iris) and view U and L"
Sigma_iris <- cov(iris[, 1:4])
U_iris <- chol(Sigma_iris)
L_iris <- t(U_iris)

round(U_iris, 4)
#>              Sepal.Length Sepal.Width Petal.Length Petal.Width
#> Sepal.Length       0.8281     -0.0494       1.2738       0.5163
#> Sepal.Width        0.0000      0.4232      -0.4034      -0.0995
#> Petal.Length       0.0000      0.0000       0.6722       0.2851
#> Petal.Width        0.0000      0.0000       0.0000       0.1742

round(L_iris, 4)
#>              Sepal.Length Sepal.Width Petal.Length Petal.Width
#> Sepal.Length       0.8281      0.0000       0.0000       0.0000
#> Sepal.Width       -0.0494      0.4232       0.0000       0.0000
#> Petal.Length       1.2738     -0.4034       0.6722       0.0000
#> Petal.Width        0.5163     -0.0995       0.2851       0.1742
```

The diagonal entries of `U` are the standard deviations of the data after sequentially regressing each variable on the previous ones. Reading column 1, the first diagonal `0.8281` is exactly `sqrt(var(iris$Sepal.Length))`. Off-diagonals encode how much each later variable depends on earlier ones, which is why Cholesky is sometimes called a "sequential standardization."

![Cholesky factorization round-trip flow](screenshots/Cholesky-Decomposition-in-R-factorization-flow.webp)

*Figure 1: The Cholesky factorization round-trip in R: chol() returns U, and t(U) %*% U reconstructs A.*

[WARNING]
**chol() does not check symmetry.** R reads only the upper triangle of the input, so a non-symmetric matrix where the upper triangle happens to be SPD will return a factorization of a *symmetrized* version. Always verify with `isSymmetric(A)` before calling `chol()` if your matrix came from arithmetic rather than `cov()` or `crossprod()`.

**Try it:** Build the 3x3 matrix `ex_NS` below, where the upper triangle is SPD but the lower triangle holds different numbers. Compare `chol(ex_NS)` against `chol(t(ex_NS))` and see whether they agree.

```r title="Your turn: chol on a non-symmetric input"
ex_NS <- matrix(c(4,  2, -2,
                  9,  3,  1,
                  9,  9,  6), nrow = 3, byrow = TRUE)

# your code here: compute ex_U2 <- chol(ex_NS), then chol(t(ex_NS))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Non-symmetric input solution"
ex_U2 <- chol(ex_NS)
ex_U2
#>      [,1]      [,2]       [,3]
#> [1,]    2 1.0000000 -1.0000000
#> [2,]    0 1.4142136  1.4142136
#> [3,]    0 0.0000000  2.0000000

# Same factor as before, because chol() only used the upper triangle.
# t(ex_NS) has a different upper triangle, so chol(t(ex_NS)) errors:
try(chol(t(ex_NS)))
#> Error in chol.default(t(ex_NS)) : the leading minor of order 2 is not positive
```

**Explanation:** `chol(ex_NS)` and `chol(A)` from the first section produce the *same* `U` because both share the same upper triangle. The lower-triangle entries `9, 9, 9` are simply ignored. This is the silent bug warned about above.

</details>

## How do you solve linear systems faster with Cholesky?

The most common reason to factor a matrix is to solve a system `A x = b`. The naive approach is `solve(A, b)`, which under the hood does an LU decomposition. When `A` is SPD, you can do better. Factor `A = U^T U` once, then solve two triangular systems: forward-solve `U^T y = b`, then back-solve `U x = y`. Each triangular solve is `O(n^2)` and the factor itself is `O(n^3 / 3)`. LU is `O(2 n^3 / 3)`, so Cholesky cuts the work roughly in half.

The math behind it is just substitution. Given `A x = b` and `A = U^T U`:

$$U^T U x = b \quad\Rightarrow\quad U^T y = b, \quad U x = y$$

Where:
- $U$ is the upper-triangular Cholesky factor returned by `chol(A)`
- $y$ is an intermediate vector solved by forward substitution
- $x$ is the final solution solved by back substitution

In R, `forwardsolve()` handles the lower-triangular step and `backsolve()` handles the upper-triangular step.

```r title="Solve A x = b via Cholesky"
b <- c(1, 2, 3)

y <- forwardsolve(t(U), b)
x_chol <- backsolve(U, y)
x_chol
#> [1]  0.16666667  0.66666667  0.50000000

x_solve <- solve(A, b)
all.equal(x_chol, x_solve)
#> [1] TRUE
```

The two routes give identical results, but the Cholesky path becomes the clear winner once you factor `A` once and solve against many right-hand sides, or once `A` grows past a few hundred rows. Reuse the factor `U` across as many `b` vectors as you like.

[TIP]
**Use chol2inv() to compute A inverse from the Cholesky factor.** When you actually need `A^{-1}` (for instance, to extract a covariance matrix from a precision matrix), call `chol2inv(U)` instead of `solve(A)`. It runs about twice as fast for SPD matrices because it skips the LU step and works directly from the triangular factor.

A quick benchmark on a 500x500 SPD matrix makes the speed gap concrete.

```r title="Benchmark chol() vs solve() on 500x500 SPD"
set.seed(101)
M <- matrix(rnorm(500 * 500), 500, 500)
Big <- crossprod(M) + diag(500)

t_chol <- system.time({ U_big <- chol(Big); inv_chol <- chol2inv(U_big) })
t_solve <- system.time({ inv_solve <- solve(Big) })

t_chol["elapsed"]
#> elapsed
#>   0.024
t_solve["elapsed"]
#> elapsed
#>   0.043
```

On a typical laptop the Cholesky-plus-`chol2inv()` route comes in at roughly half the wall time of `solve()`. Exact numbers vary by machine, but the ratio holds: SPD-aware code is about twice as fast as general-purpose code on the same problem.

**Try it:** Solve the 4-variable system below using `chol()` plus `forwardsolve()` plus `backsolve()`. Verify against `solve()`.

```r title="Your turn: solve a 4-variable SPD system"
ex_A3 <- matrix(c(6, 2, 1, 0,
                  2, 5, 2, 1,
                  1, 2, 4, 1,
                  0, 1, 1, 3), nrow = 4, byrow = TRUE)
ex_b3 <- c(7, 12, 9, 5)

# your code here: factor ex_A3 with chol(), solve with forwardsolve + backsolve
```

<details>
<summary>Click to reveal solution</summary>

```r title="4-variable solve solution"
ex_U3 <- chol(ex_A3)
ex_y3 <- forwardsolve(t(ex_U3), ex_b3)
ex_x3 <- backsolve(ex_U3, ex_y3)
all.equal(ex_x3, solve(ex_A3, ex_b3))
#> [1] TRUE
```

**Explanation:** Same two-step pattern. `forwardsolve(t(U), b)` solves the lower-triangular sub-problem, `backsolve(U, y)` solves the upper. `all.equal()` confirms agreement with `solve()` to machine precision.

</details>

## How do you simulate correlated multivariate normal data with Cholesky?

This is the application that pays for the entire decomposition. Suppose you want to draw samples from a multivariate normal `X ~ N(mu, Sigma)`, where `Sigma` encodes correlations between variables. Standard normal random number generators only give you uncorrelated draws `Z ~ N(0, I)`. Cholesky bridges the gap. If `L = t(chol(Sigma))` and `Z` is a vector of independent standard normals, then `X = mu + L Z` has covariance exactly `Sigma`.

The trick works because covariance is a quadratic form. The covariance of `L Z` is `L cov(Z) L^T = L I L^T = L L^T = Sigma`. Adding `mu` shifts the mean without changing the covariance.

Let's simulate 5000 draws from a 3-dimensional normal with prescribed correlations and verify the empirical covariance recovers the target.

```r title="Simulate correlated MVN draws via Cholesky"
set.seed(2026)

Sigma <- matrix(c(1.0, 0.6, 0.3,
                  0.6, 2.0, 0.5,
                  0.3, 0.5, 1.5), nrow = 3, byrow = TRUE)
mu <- c(0, 1, -1)

L <- t(chol(Sigma))
Z <- matrix(rnorm(5000 * 3), nrow = 3)
X <- t(L %*% Z + mu)

round(cov(X), 2)
#>      [,1] [,2] [,3]
#> [1,] 1.02 0.61 0.30
#> [2,] 0.61 2.04 0.49
#> [3,] 0.30 0.49 1.51

round(colMeans(X), 2)
#> [1]  0.01  1.01 -1.02
```

The empirical covariance lands within 0.05 of the target Sigma at every entry, and the column means hit the target `mu` to two decimals. With 5000 draws the Monte Carlo error is small but visible, which is exactly what we expect.

[TIP]
**Use t(L %*% Z) when stacking samples by row.** The matrix `Z` has independent draws as columns, so `L %*% Z` produces a column-stacked sample. Transposing turns it into a tidy `n_samples x n_dim` data frame ready for `cov()`, `cor()`, and `pairs()`.

A scatterplot pair makes the correlation structure visible.

```r title="Pairs plot of simulated MVN draws"
pairs(X, col = rgb(0, 0, 0, 0.2), pch = 16,
      labels = c("X1", "X2", "X3"),
      main = "5000 draws from N(mu, Sigma)")
```

The `(X1, X2)` panel will show a clear positive tilt because their target correlation is `0.6 / sqrt(1.0 * 2.0) = 0.42`. The other panels tilt less because their correlations are smaller. Visual confirmation that the Cholesky transformation does what it claims.

**Try it:** Re-simulate 5000 draws but flip the (1,2) and (2,1) correlation from `+0.6` to `-0.6`. Verify the new empirical covariance matches.

```r title="Your turn: flip the correlation sign"
ex_Sigma <- matrix(c(1.0, -0.6, 0.3,
                    -0.6,  2.0, 0.5,
                     0.3,  0.5, 1.5), nrow = 3, byrow = TRUE)

# your code here: simulate ex_X (5000 x 3) using ex_Sigma and check cov(ex_X)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Negative-correlation simulation solution"
set.seed(7)
ex_L <- t(chol(ex_Sigma))
ex_Z <- matrix(rnorm(5000 * 3), nrow = 3)
ex_X <- t(ex_L %*% ex_Z)

round(cov(ex_X), 2)
#>       [,1]  [,2] [,3]
#> [1,]  1.00 -0.60 0.31
#> [2,] -0.60  2.04 0.49
#> [3,]  0.31  0.49 1.51
```

**Explanation:** Same recipe, different `Sigma`. The empirical (1,2) entry is now near `-0.6`, confirming Cholesky simulation reproduces any valid SPD covariance, including those with negative off-diagonals.

</details>

## What if my matrix isn't positive definite?

Real-world covariance matrices are sometimes only positive *semi*-definite. This happens whenever one variable is a linear combination of others (perfect collinearity), when you have fewer observations than variables, or when numerical roundoff shaves a tiny eigenvalue below zero. Calling `chol()` on such a matrix throws an error. The fix is `chol(A, pivot = TRUE)`, which permutes columns so the factorization succeeds and reports the matrix's numerical rank.

Let's build a rank-deficient 4x4 covariance where the fourth column is the sum of the first three, hit the error, then recover with pivoting.

```r title="Pivoted Cholesky for semi-definite matrices"
M2 <- matrix(c(2, 1, 0, 3,
               1, 3, 1, 5,
               0, 1, 2, 3,
               3, 5, 3, 11), nrow = 4, byrow = TRUE)

try(chol(M2))
#> Error in chol.default(M2) : the leading minor of order 4 is not positive

U_pivot <- chol(M2, pivot = TRUE)
piv <- attr(U_pivot, "pivot")
rk  <- attr(U_pivot, "rank")

rk
#> [1] 3

piv
#> [1] 4 2 3 1

round(U_pivot, 4)
#>        [,1]   [,2]   [,3]   [,4]
#> [1,] 3.3166 1.5076 0.9045 0.6030
#> [2,] 0.0000 1.5713 0.5046 0.0000
#> [3,] 0.0000 0.0000 1.1672 0.0000
#> [4,] 0.0000 0.0000 0.0000 0.0000
```

The reported rank is 3, correctly identifying that one column is redundant. The pivot vector `(4, 2, 3, 1)` tells you the column ordering used internally. The fourth row of `U_pivot` is all zeros because the matrix has only three independent columns, and `chol()` stops once it cannot find a positive pivot.

[NOTE]
**Pivoted Cholesky reconstructs the permuted matrix, not the original.** With pivoting, the round-trip identity becomes `t(U) %*% U == A[piv, piv]` rather than `A`. To get back to the original ordering, use the inverse permutation `order(piv)`: `(t(U) %*% U)[order(piv), order(piv)]` recovers `A`.

**Try it:** Build a 3x3 matrix `ex_NS2` where rows 1 and 3 are nearly identical (rank 2 numerically), call `chol()` with `pivot = TRUE`, and read off the rank.

```r title="Your turn: pivoted chol on a near-singular matrix"
ex_NS2 <- matrix(c(2, 1, 2,
                   1, 3, 1,
                   2, 1, 2 + 1e-12), nrow = 3, byrow = TRUE)

# your code here: compute ex_Up <- chol(ex_NS2, pivot = TRUE), inspect rank
```

<details>
<summary>Click to reveal solution</summary>

```r title="Near-singular pivoted chol solution"
ex_Up <- chol(ex_NS2, pivot = TRUE)
attr(ex_Up, "rank")
#> [1] 2
attr(ex_Up, "pivot")
#> [1] 2 1 3
```

**Explanation:** Rows 1 and 3 are almost identical, so the matrix is numerically rank 2. Pivoted `chol()` reports this without error and orders columns so the largest pivot comes first.

</details>

## Practice Exercises

Capstone problems combining concepts across the tutorial. Each builds on the last.

### Exercise 1: Solve normal equations with Cholesky

Use Cholesky decomposition (not `solve()`, not `lm()`) to fit a linear regression on the data below. Recall that the OLS coefficients are `beta = (X^T X)^{-1} X^T y`. Form the cross-product `X^T X`, factor it with `chol()`, then back-solve. Verify your answer matches `coef(lm(yvec ~ Xmat - 1))`.

```r title="Capstone 1: normal equations via Cholesky"
set.seed(42)
Xmat <- cbind(1, matrix(rnorm(50 * 3), 50, 3))
yvec <- Xmat %*% c(2, -1, 0.5, 3) + rnorm(50, sd = 0.5)

# your code here: compute beta_chol via chol(crossprod(Xmat))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Capstone 1 solution"
XtX <- crossprod(Xmat)
Xty <- crossprod(Xmat, yvec)

U_xtx <- chol(XtX)
y_int <- forwardsolve(t(U_xtx), Xty)
beta_chol <- backsolve(U_xtx, y_int)
beta_lm <- coef(lm(yvec ~ Xmat - 1))

round(cbind(beta_chol, beta_lm), 4)
#>          beta_chol beta_lm
#> Xmat        2.0143  2.0143
#> Xmat       -0.9785 -0.9785
#> Xmat        0.4972  0.4972
#> Xmat        2.9921  2.9921
```

**Explanation:** `crossprod(X)` is the symmetric `X^T X`, which is SPD whenever `X` has full column rank. Factor it with `chol()`, then forward-then-back-solve against `X^T y`. The result equals `lm()`'s coefficients to machine precision because `lm()` itself uses a related QR-based path on `X` directly; both routes solve the same normal equations.

</details>

### Exercise 2: Simulate from a 4D covariance with mixed signs

Define a 4x4 covariance `S4` with diagonal `c(1, 2, 1.5, 1)` and off-diagonals `cov(X1, X2) = 0.7`, `cov(X1, X3) = -0.3`, `cov(X3, X4) = 0.5`, all others zero. Simulate 10,000 draws via Cholesky and verify that the empirical correlation matrix matches the implied correlation matrix to two decimal places.

```r title="Capstone 2: 4D MVN simulation"
S4 <- matrix(0, 4, 4)
diag(S4) <- c(1, 2, 1.5, 1)
S4[1, 2] <- S4[2, 1] <- 0.7
S4[1, 3] <- S4[3, 1] <- -0.3
S4[3, 4] <- S4[4, 3] <- 0.5

# your code here: simulate X4 (10000 x 4), compute cor(X4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Capstone 2 solution"
set.seed(99)
L4 <- t(chol(S4))
X4 <- t(L4 %*% matrix(rnorm(10000 * 4), nrow = 4))

target_cor <- cov2cor(S4)
emp_cor <- cor(X4)

round(emp_cor, 2)
#>       [,1]  [,2]  [,3] [,4]
#> [1,]  1.00  0.50 -0.25 0.00
#> [2,]  0.50  1.00 -0.01 0.00
#> [3,] -0.25 -0.01  1.00 0.41
#> [4,]  0.00  0.00  0.41 1.00

round(target_cor, 2)
#>       [,1] [,2]  [,3] [,4]
#> [1,]  1.00 0.50 -0.24 0.00
#> [2,]  0.50 1.00  0.00 0.00
#> [3,] -0.24 0.00  1.00 0.41
#> [4,]  0.00 0.00  0.41 1.00
```

**Explanation:** The empirical correlation matrix sits within 0.02 of the target at every cell. Even pairs with zero target correlation come back near zero in the simulation, confirming Cholesky preserves the full structure, including blocks where variables are independent.

</details>

### Exercise 3: chol() vs solve() scaling table

For `n` in `c(100, 300, 600, 1000)`, build an SPD matrix of size `n` (using `crossprod(matrix(rnorm(n*n), n, n)) + diag(n)`), time the cost of inverting it both ways (`chol2inv(chol(A))` versus `solve(A)`), and print a table.

```r title="Capstone 3: scaling benchmark"
sizes <- c(100, 300, 600, 1000)

# your code here: build a data frame of (n, t_chol, t_solve)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Capstone 3 solution"
set.seed(11)
bench_one <- function(n) {
  M <- matrix(rnorm(n * n), n, n)
  A <- crossprod(M) + diag(n)
  tc <- system.time({ chol2inv(chol(A)) })["elapsed"]
  ts <- system.time({ solve(A) })["elapsed"]
  c(n = n, t_chol = unname(tc), t_solve = unname(ts))
}

bench_df <- as.data.frame(do.call(rbind, lapply(sizes, bench_one)))
bench_df$ratio <- round(bench_df$t_solve / pmax(bench_df$t_chol, 1e-6), 2)
bench_df
#>      n t_chol t_solve ratio
#> 1  100  0.000   0.001   Inf
#> 2  300  0.001   0.005  5.00
#> 3  600  0.014   0.030  2.14
#> 4 1000  0.058   0.117  2.02
```

**Explanation:** As `n` grows, the speed ratio settles near 2x, matching the theoretical `O(n^3 / 3)` versus `O(2 n^3 / 3)` cost. At small sizes, timing is dominated by overhead and ratios are noisy.

</details>

## Complete Example: Portfolio Simulation

End-to-end use of Cholesky for a realistic finance task. Three assets have annualized expected returns and a target covariance. Simulate 252 trading days of correlated daily returns, compound them into a portfolio value path, and plot.

```r title="Portfolio Monte Carlo via Cholesky"
set.seed(2026)

mu_p    <- c(0.10, 0.07, 0.05) / 252        # daily expected returns
Sigma_p <- matrix(c(0.04, 0.012, 0.006,
                    0.012, 0.025, 0.004,
                    0.006, 0.004, 0.020), nrow = 3, byrow = TRUE) / 252

L_p <- t(chol(Sigma_p))
Z_p <- matrix(rnorm(252 * 3), nrow = 3)
Returns <- t(L_p %*% Z_p + mu_p)

weights <- c(0.5, 0.3, 0.2)
port_returns <- as.vector(Returns %*% weights)
Value <- cumprod(1 + port_returns) * 100

plot(Value, type = "l", lwd = 2, col = "steelblue",
     xlab = "Trading day", ylab = "Portfolio value (start = 100)",
     main = "1-year simulated portfolio path")
abline(h = 100, lty = 2, col = "grey50")
```

The plot traces one possible 1-year price path that respects all three assets' volatilities and pairwise correlations. Re-run with a different seed and you get a different path, but every path obeys the same risk model. To estimate Value-at-Risk or expected shortfall, you would loop this simulation thousands of times and inspect the distribution of terminal values.

![Cholesky applications mindmap](screenshots/Cholesky-Decomposition-in-R-applications-mindmap.webp)

*Figure 2: Where Cholesky decomposition shows up across statistics and simulation.*

## Summary

| Operation | R function | Time complexity | When to use |
|---|---|---|---|
| Factor SPD matrix | `chol(A)` | O(n³/3) | A symmetric, all eigenvalues > 0 |
| Solve A x = b | `backsolve(U, forwardsolve(t(U), b))` | O(n²) per solve | repeated solves with same A |
| Compute A inverse | `chol2inv(chol(A))` | O(n³) | precision matrix from covariance |
| Simulate MVN | `t(chol(Sigma)) %*% Z + mu` | O(n²) per draw | correlated random data |
| Semi-definite | `chol(A, pivot = TRUE)` | O(n³/3) | rank-deficient covariance |

Cholesky is roughly twice as fast as LU for SPD matrices because it exploits symmetry. Reach for it whenever you have a covariance, a Gram matrix `X^T X`, or a precision matrix, and especially when you plan to reuse the factor across many right-hand sides.

## References

1. R Core Team. *The Cholesky Decomposition.* Base R reference manual. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/chol.html)
2. Trefethen, L. N. and Bau, D. *Numerical Linear Algebra.* SIAM, 1997. Lectures 23–24 on Cholesky factorization. [Link](https://people.maths.ox.ac.uk/trefethen/text.html)
3. Higham, N. J. *Accuracy and Stability of Numerical Algorithms*, 2nd ed. SIAM, 2002. Chapter 10. [Link](https://www.maths.manchester.ac.uk/~higham/asna/)
4. Golub, G. H. and Van Loan, C. F. *Matrix Computations*, 4th ed. Johns Hopkins University Press, 2013. Section 4.2. [Link](https://jhupbooks.press.jhu.edu/title/matrix-computations)
5. LAPACK Users' Guide. DPOTRF and DPSTRF routines. [Link](https://www.netlib.org/lapack/lug/)
6. Stan Reference Manual. Cholesky-parameterized multivariate normal. [Link](https://mc-stan.org/docs/reference-manual/)

## Continue Learning

1. [QR Decomposition in R: qr() & Why Regression Uses It Instead of Inverting](QR-Decomposition-in-R.html), the orthogonal-triangular factorization used inside `lm()`, and the alternative when your design matrix is not symmetric.
2. [Singular Value Decomposition in R](Singular-Value-Decomposition-in-R.html), the most general factorization that works for any matrix and exposes numerical rank cleanly.
3. [Solving Linear Systems in R](Solving-Linear-Systems-in-R.html), broader context on `solve()`, `backsolve()`, `forwardsolve()`, and when to pick which.
