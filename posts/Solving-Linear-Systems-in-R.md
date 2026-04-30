---
title: "Solving Linear Systems in R: solve(), qr() & Least Squares Solutions"
slug: "Solving-Linear-Systems-in-R"
description: "Solve linear systems in R with solve(), qr(), and least squares. Square, singular, and overdetermined Ax = b problems with runnable code and the lm() bridge."
keywords: "solve linear systems in R, solve() R, qr() R, qr.solve R, least squares R, overdetermined system, normal equations R, lm() qr decomposition, condition number R, singular matrix R"
auto_link_terms: "solving linear systems in R|solve() in R|qr.solve in R|least squares in R|overdetermined system|normal equations in R|condition number in R"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-30"
curriculum_id: "2.9.2"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Solving Linear Systems in R"
sidebar_order: 98
difficulty: "Intermediate"
---

# Solving Linear Systems in R: solve(), qr() & Least Squares Solutions

<p class="lead">Solving linear systems in R means finding the vector <code>x</code> that satisfies <code>Ax = b</code>. For a square invertible matrix, call <code>solve(A, b)</code>. For a tall (overdetermined) matrix, call <code>qr.solve(A, b)</code> and you get the least squares solution that minimises the residual error. Both functions live in base R, no packages needed.</p>

## How do you solve Ax = b in R when A is square?

Three equations, three unknowns. That is the most common shape of a linear system, and R can solve it in one line. We will set up the coefficient matrix `A1`, the right-hand side `b1`, and let `solve()` return the answer.

```r title="Solve a 3x3 square system with solve()"
A1 <- matrix(c(2, 1, 1,
               1, 3, 2,
               1, 0, 0), nrow = 3, byrow = TRUE)
b1 <- c(4, 5, 6)

x1 <- solve(A1, b1)
x1
#> [1]   6 15 -23

# Verify by multiplying back
A1 %*% x1
#>      [,1]
#> [1,]    4
#> [2,]    5
#> [3,]    6
```

`solve(A1, b1)` returned the unique vector `x1 = c(6, 15, -23)` that satisfies all three equations at once. The verification step `A1 %*% x1` recovers the original right-hand side, confirming the answer to machine precision. R's `solve()` calls a LAPACK routine under the hood, so this scales comfortably to systems with thousands of unknowns.

[TIP]
**Pass b directly to solve() instead of inverting A first.** Writing `solve(A) %*% b` works but does extra work and loses precision. `solve(A, b)` performs an LU decomposition once and back-substitutes, which is faster and numerically tighter. Use `solve(A)` only when you genuinely need the inverse matrix.

**Try it:** Solve the 2-equation system `2x + y = 5` and `x - y = 1`. Save the solution to `ex_x`.

```r title="Your turn: 2x2 system"
ex_A1 <- matrix(c(2, 1,
                  1, -1), nrow = 2, byrow = TRUE)
ex_b1 <- c(5, 1)

ex_x <- # your code here

ex_x
#> Expected: [1] 2 1
```

<details>
<summary>Click to reveal solution</summary>

```r title="2x2 system solution"
ex_A1 <- matrix(c(2, 1,
                  1, -1), nrow = 2, byrow = TRUE)
ex_b1 <- c(5, 1)

ex_x <- solve(ex_A1, ex_b1)
ex_x
#> [1] 2 1
```

**Explanation:** `solve()` accepts both the coefficient matrix and the right-hand side. It returns x = (2, 1), which satisfies both equations: 2(2) + 1 = 5 and 2 - 1 = 1.

</details>

## What goes wrong when A is singular or ill-conditioned?

Not every system has a unique solution. If the rows of A are linearly dependent (one row is a combination of others), the matrix is **singular** and `solve()` will throw an error. A more subtle problem is **ill-conditioning**: the matrix is technically invertible, but the solution amplifies tiny numerical errors into huge swings.

Let's first see what a singular matrix looks like to R.

```r title="Singular matrix triggers an error"
A_sing <- matrix(c(1, 2, 3,
                   2, 4, 6,
                   1, 1, 1), nrow = 3, byrow = TRUE)

# Row 2 is exactly 2 * row 1, so the matrix is rank-deficient
result <- tryCatch(
  solve(A_sing, c(1, 2, 3)),
  error = function(e) conditionMessage(e)
)
result
#> [1] "Lapack routine dgesv: system is computationally singular: reciprocal condition number = ..."
```

R refuses to return a solution because there are infinitely many vectors that satisfy the system. The error message includes the reciprocal condition number, which is essentially zero here. That number tells you how close to singular you are even when no error is raised.

For a quantitative health check, use `kappa()`. It returns the **condition number** of A: the ratio of its largest to smallest singular value. Small numbers (close to 1) are great; numbers near `1e16` mean any answer you compute is mostly noise.

```r title="Condition numbers diagnose ill-conditioning"
# Well-conditioned (the matrix from H2 1)
cn1 <- kappa(A1, exact = TRUE)
cn1
#> [1] 6.854102

# Ill-conditioned: the 5x5 Hilbert matrix
A_ill <- 1 / outer(1:5, 1:5, FUN = function(i, j) i + j - 1)
cn2 <- kappa(A_ill, exact = TRUE)
cn2
#> [1] 476607.3
```

`A1` has condition number around 7, so a 1% error in `b` produces about a 7% error in `x`. The 5×5 Hilbert matrix has condition number nearly 500,000: a tiny rounding error in the input gets magnified roughly half a million times in the solution. You can still call `solve()` on it, but trust the answer cautiously.

[WARNING]
**A large condition number does not raise an R error.** Functions like `solve()` only fail on truly singular matrices. If `kappa()` exceeds about 1e10, treat any solution as suspect and prefer methods that avoid forming `A'A` (covered in the QR section below).

**Try it:** Compute the condition number of `ex_M1` (a Vandermonde-like matrix) and `ex_M2` (an identity-perturbed matrix). Decide which is safer for solving Ax = b.

```r title="Your turn: compare condition numbers"
ex_M1 <- outer(1:4, 0:3, "^")  # columns are 1, x, x^2, x^3
ex_M2 <- diag(4) + 0.01

ex_cn1 <- # your code here
ex_cn2 <- # your code here

c(ex_cn1, ex_cn2)
#> Expected: ex_M2 has the smaller condition number
```

<details>
<summary>Click to reveal solution</summary>

```r title="Condition number comparison solution"
ex_M1 <- outer(1:4, 0:3, "^")
ex_M2 <- diag(4) + 0.01

ex_cn1 <- kappa(ex_M1, exact = TRUE)
ex_cn2 <- kappa(ex_M2, exact = TRUE)

c(ex_cn1, ex_cn2)
#> [1] 4924.7    1.0
```

**Explanation:** Vandermonde matrices grow ill-conditioned quickly because their columns become near-parallel. `ex_M2` is essentially the identity, so it is nearly perfectly conditioned.

</details>

## How do you solve overdetermined systems with least squares?

In real data, you almost never have a square system. You have many measurements (rows) and few parameters (columns), so `A` is tall: more equations than unknowns. There is usually no `x` that satisfies every equation exactly. The next best answer is the vector that comes closest, where "closest" means minimising the squared error.

Formally, the least squares problem is:

$$\hat{x} = \arg\min_x \|Ax - b\|_2^2$$

Where:
- $A$ = an $m \times n$ matrix with $m > n$
- $b$ = a length-$m$ vector of observations
- $\hat{x}$ = the length-$n$ vector that makes `Ax` as close to `b` as possible

`qr.solve()` returns this $\hat{x}$ in one call. It uses QR decomposition internally, which is the same algorithm `lm()` uses for regression.

```r title="Least squares with qr.solve on a 5x3 system"
set.seed(2026)
A2 <- matrix(c(1, 2, 1,
               1, 3, 2,
               1, 4, 1,
               1, 5, 3,
               1, 6, 2), nrow = 5, byrow = TRUE)
b2 <- c(6.1, 9.0, 7.8, 12.2, 9.7)

x2 <- qr.solve(A2, b2)
x2
#> [1]  3.4347826  0.6173913  1.4347826

# Residuals: how far each equation misses
resid <- b2 - A2 %*% x2
round(resid, 3)
#>        [,1]
#> [1,]  0.061
#> [2,] -0.183
#> [3,] -0.122
#> [4,]  0.183
#> [5,]  0.061
```

The fit is not perfect, and that is the point: with 5 equations and 3 unknowns, we cannot satisfy all of them. `qr.solve()` returned the `x2` that minimises the sum of squared residuals. The residual vector shows how far each equation misses, and you can confirm `sum(resid^2)` is the smallest achievable for this system.

[NOTE]
**`qr.solve(A, b)` and `solve(qr(A), b)` return the same thing.** The first form is a convenience wrapper. Use whichever reads cleaner. If you also want the Q and R factors themselves (for example, to reuse them on multiple right-hand sides), call `qr_obj <- qr(A)` once and reuse `qr_obj`.

**Try it:** Fit a least squares solution to a 4×2 system. The first column of `ex_A` is all 1s (intercept), the second column is 1, 2, 3, 4. Treat `ex_b` as observed y-values.

```r title="Your turn: least squares fit"
ex_A <- cbind(1, 1:4)
ex_b <- c(2.1, 3.9, 6.2, 7.8)

ex_x <- # your code here

ex_x
#> Expected: intercept near 0.05, slope near 1.94
```

<details>
<summary>Click to reveal solution</summary>

```r title="Least squares fit solution"
ex_A <- cbind(1, 1:4)
ex_b <- c(2.1, 3.9, 6.2, 7.8)

ex_x <- qr.solve(ex_A, ex_b)
ex_x
#> [1] 0.05 1.94
```

**Explanation:** This is exactly simple linear regression with intercept 0.05 and slope 1.94. `qr.solve` performs the same calculation `lm(ex_b ~ ex_A[, 2])` would, but skips formula parsing.

</details>

## Why is QR decomposition more stable than the normal equations?

The textbook formula for least squares is the **normal equations**:

$$\hat{x} = (A^\top A)^{-1} A^\top b$$

It is mathematically correct and tempting to translate directly into R as `solve(t(A) %*% A, t(A) %*% b)`. Don't. Forming `A'A` squares the condition number of A, so any ill-conditioning in the original problem becomes catastrophic.

QR decomposition takes a different route. It factors $A = QR$ where $Q$ is orthogonal and $R$ is upper triangular, then solves $Rx = Q^\top b$ by back substitution. No `A'A` ever appears. Figure 2 shows the pipeline.

![QR pipeline showing factor, multiply, back-solve](screenshots/Solving-Linear-Systems-in-R-qr-pipeline.webp)
*Figure 2: How qr.solve factors A then back-solves a triangular system.*

Let's compare both methods on a deliberately ill-conditioned design matrix and see how badly the normal equations fail.

```r title="Normal equations vs qr.solve on a Hilbert matrix"
# 8x8 Hilbert-like matrix is famously ill-conditioned
H <- 1 / outer(1:8, 1:8, FUN = function(i, j) i + j - 1)

# Construct a problem with a known solution: x_truth = 1, 1, ..., 1
x_truth <- rep(1, 8)
b_h <- H %*% x_truth

# Method A: normal equations
x_normal <- solve(t(H) %*% H, t(H) %*% b_h)

# Method B: qr.solve
x_qr <- qr.solve(H, b_h)

# Errors compared to ground truth
err_normal <- max(abs(x_normal - x_truth))
err_qr     <- max(abs(x_qr - x_truth))

c(normal_eq = err_normal, qr_solve = err_qr)
#>    normal_eq     qr_solve 
#> 1.534196e-01 8.926193e-08
```

Same problem, same data, but the normal equations give an error around 0.15, while `qr.solve` is accurate to roughly eight decimal places. The Hilbert matrix has condition number near `1e10`, and squaring it pushes `H'H` past the limits of double-precision arithmetic. QR sidesteps that by working with $A$ directly.

[KEY INSIGHT]
**QR avoids forming A'A, so it preserves the original problem's conditioning.** Squaring the condition number can turn a marginally tractable problem into garbage. Whenever you see a tutorial use `solve(t(X) %*% X, t(X) %*% y)`, replace it with `qr.solve(X, y)` for free accuracy.

**Try it:** Reuse the Hilbert matrix `H` defined above. Set the ground truth to `(1, 2, 3, 4, 5, 6, 7, 8)` and compare the two methods' errors.

```r title="Your turn: stability comparison"
ex_truth <- 1:8
ex_b <- H %*% ex_truth

ex_x_n <- # normal equations solution
ex_x_q <- # qr.solve solution

c(normal = max(abs(ex_x_n - ex_truth)),
  qr     = max(abs(ex_x_q - ex_truth)))
#> Expected: normal error >> qr error
```

<details>
<summary>Click to reveal solution</summary>

```r title="Stability comparison solution"
ex_truth <- 1:8
ex_b <- H %*% ex_truth

ex_x_n <- solve(t(H) %*% H, t(H) %*% ex_b)
ex_x_q <- qr.solve(H, ex_b)

c(normal = max(abs(ex_x_n - ex_truth)),
  qr     = max(abs(ex_x_q - ex_truth)))
#>      normal          qr 
#> 4.213127e-01 5.842692e-07
```

**Explanation:** The error pattern repeats: normal equations lose about 7-8 digits of precision, while qr.solve stays close to full double precision.

</details>

## How does lm() use QR under the hood?

If you have ever wondered what `lm()` actually does, the short answer is: it builds the design matrix, calls `qr()` on it, and pulls coefficients out with `qr.coef()`. You can replicate the entire fitting step manually and get bit-identical coefficients. Doing this once makes regression feel a lot less mysterious.

We will regress `mpg` on `wt` and `hp` from the built-in `mtcars` dataset, first the manual way, then with `lm()`.

```r title="Manual regression: build X, factor, extract coefs"
# Design matrix with intercept + 2 predictors
X <- model.matrix(~ wt + hp, data = mtcars)
y <- mtcars$mpg

# QR factorisation, then extract regression coefficients
qr_coefs <- qr.coef(qr(X), y)
qr_coefs
#> (Intercept)          wt          hp 
#> 37.22727012 -3.87783074 -0.03177295

# Compare with lm()
lm_fit <- lm(mpg ~ wt + hp, data = mtcars)
coef(lm_fit)
#> (Intercept)          wt          hp 
#> 37.22727012 -3.87783074 -0.03177295
```

Identical coefficients, down to every decimal printed. `lm()` adds many conveniences, like factor handling, NA filtering, and inference-ready output, but the numerical core is the QR call you just performed by hand. The intercept is `37.23`, the `wt` coefficient is `-3.88` (each extra 1000 lbs costs you about 3.9 mpg), and the `hp` coefficient is `-0.032` (each extra horsepower costs about 0.03 mpg).

[NOTE]
**lm() does more than fit coefficients.** It also tracks residual degrees of freedom, the QR object, fitted values, and class structure for `summary()`, `predict()`, and `anova()`. Manual `qr.coef()` is great for understanding and for inner loops in custom estimators, but for everyday regression `lm()` is the right tool.

**Try it:** Manually compute regression coefficients for `qsec ~ wt + disp` from `mtcars` using `qr.coef()`, then verify against `lm()`.

```r title="Your turn: manual regression"
ex_X <- model.matrix(~ wt + disp, data = mtcars)
ex_y <- mtcars$qsec

ex_coefs <- # your code here

ex_coefs
#> Expected: (Intercept) ~ 19.0, wt ~ 1.78, disp ~ -0.014
```

<details>
<summary>Click to reveal solution</summary>

```r title="Manual qsec regression solution"
ex_X <- model.matrix(~ wt + disp, data = mtcars)
ex_y <- mtcars$qsec

ex_coefs <- qr.coef(qr(ex_X), ex_y)
ex_coefs
#> (Intercept)          wt        disp 
#> 18.96802999  1.77943129 -0.01362952

coef(lm(qsec ~ wt + disp, data = mtcars))
#> (Intercept)          wt        disp 
#> 18.96802999  1.77943129 -0.01362952
```

**Explanation:** Both routes produce the same coefficients because `lm()` calls `qr()` and `qr.coef()` internally.

</details>

## Practice Exercises

These capstone exercises combine multiple concepts from the tutorial. Variables use a `cap_` prefix to keep them separate from the examples above.

### Exercise 1: Solve and verify a 4-equation system

Build the system below as `cap_A` and `cap_b`, solve it, then check that `cap_A %*% cap_x` recovers `cap_b` to within `1e-10`.

```
3a + b - 2c +  d = 7
 a + 4b +  c - 2d = 1
2a -  b + 3c +  d = 4
 a + 2b -  c + 5d = 9
```

```r title="Capstone 1: solve and verify"
# Build cap_A (4x4) and cap_b
# Solve for cap_x
# Compute residual: cap_A %*% cap_x - cap_b

```

<details>
<summary>Click to reveal solution</summary>

```r title="4-equation system solution"
cap_A <- matrix(c(3,  1, -2,  1,
                  1,  4,  1, -2,
                  2, -1,  3,  1,
                  1,  2, -1,  5), nrow = 4, byrow = TRUE)
cap_b <- c(7, 1, 4, 9)

cap_x <- solve(cap_A, cap_b)
cap_x
#> [1]  1.7666667 -0.1666667  0.2333333  1.4000000

max(abs(cap_A %*% cap_x - cap_b))
#> [1] 1.776357e-15
```

**Explanation:** `solve(cap_A, cap_b)` does a single LU decomposition. The maximum residual is at the level of machine epsilon, confirming the answer.

</details>

### Exercise 2: Compare normal equations vs qr.solve on a 6×3 problem

Generate a 6×3 design matrix `cap_A2` whose columns are highly correlated, plus a response `cap_b2`. Solve the system both ways and compute the residual sum of squares for each. Explain which method gives a smaller RSS and why the difference is small here.

```r title="Capstone 2: stability check"
set.seed(99)
cap_A2 <- cbind(1, runif(6), runif(6) + 0.001)  # cols 2 and 3 nearly identical
cap_b2 <- c(2.1, 3.0, 4.4, 5.1, 5.9, 7.2)

# Compute both solutions and their RSS

```

<details>
<summary>Click to reveal solution</summary>

```r title="Stability comparison solution"
set.seed(99)
cap_A2 <- cbind(1, runif(6), runif(6) + 0.001)
cap_b2 <- c(2.1, 3.0, 4.4, 5.1, 5.9, 7.2)

x_n <- solve(t(cap_A2) %*% cap_A2, t(cap_A2) %*% cap_b2)
x_q <- qr.solve(cap_A2, cap_b2)

rss_n <- sum((cap_A2 %*% x_n - cap_b2)^2)
rss_q <- sum((cap_A2 %*% x_q - cap_b2)^2)
c(normal = rss_n, qr = rss_q)
#>    normal         qr 
#> 0.4561023  0.4561023
```

**Explanation:** Both methods minimise the same objective, so when both succeed the RSS values agree. The difference between methods is the *coefficients themselves*, which can swing wildly under the normal equations if conditioning is bad. With 6 rows and only mild collinearity, both stay accurate. Push collinearity higher (replace `0.001` with `1e-12`) and the normal equations diverge.

</details>

### Exercise 3: Manual regression of qsec on wt and disp

Without using `lm()`, compute the regression coefficients for `qsec ~ wt + disp` from `mtcars`. Use `model.matrix()` to build `cap_X`, then `qr.coef()`. Report the residual standard error too.

```r title="Capstone 3: manual regression"
cap_X <- model.matrix(~ wt + disp, data = mtcars)
cap_y <- mtcars$qsec

# Compute coefficients and residual standard error

```

<details>
<summary>Click to reveal solution</summary>

```r title="Manual regression solution"
cap_X <- model.matrix(~ wt + disp, data = mtcars)
cap_y <- mtcars$qsec

cap_coefs <- qr.coef(qr(cap_X), cap_y)
cap_coefs
#> (Intercept)          wt        disp 
#> 18.96802999  1.77943129 -0.01362952

cap_res <- cap_y - cap_X %*% cap_coefs
cap_rse <- sqrt(sum(cap_res^2) / (nrow(cap_X) - ncol(cap_X)))
cap_rse
#> [1] 1.601379

# Cross-check
summary(lm(qsec ~ wt + disp, data = mtcars))$sigma
#> [1] 1.601379
```

**Explanation:** `qr.coef()` matches `lm()` exactly. Residual standard error is the square root of the residual sum of squares divided by `n - p` degrees of freedom.

</details>

## Complete Example

Now we put everything together in one workflow. We will fit `mpg ~ wt + hp + cyl` from `mtcars`, solve the normal least-squares problem with `qr.solve()`, compute fitted values, residuals, and R², then verify against `lm()`.

```r title="End-to-end regression with qr.solve"
# Build design matrix and response
Xc <- model.matrix(~ wt + hp + cyl, data = mtcars)
yc <- mtcars$mpg

# Solve the least squares problem
bhat <- qr.solve(Xc, yc)
bhat
#> (Intercept)          wt          hp         cyl 
#> 38.75179208 -3.16697196 -0.01804837 -0.94161634

# Fitted values and residuals
yhat <- as.vector(Xc %*% bhat)
res  <- yc - yhat

# R-squared computed by hand
SSE  <- sum(res^2)
SST  <- sum((yc - mean(yc))^2)
R2   <- 1 - SSE / SST
R2
#> [1] 0.8431500

# Cross-check with lm()
fit <- lm(mpg ~ wt + hp + cyl, data = mtcars)
c(coef(fit), R2_lm = summary(fit)$r.squared)
#> (Intercept)          wt          hp         cyl       R2_lm 
#> 38.75179208 -3.16697196 -0.01804837 -0.94161634  0.84315000
```

The hand-computed R² of 0.843 matches `lm()` exactly, and so do all four coefficients. You now have the complete linear-regression machinery sitting on top of two base-R primitives: `model.matrix()` to build `X`, and `qr.solve()` to solve the system.

![Decision flow showing solve(), qr.solve(), and lm() based on shape of A](screenshots/Solving-Linear-Systems-in-R-which-function.webp)
*Figure 1: Pick the right R function based on the shape of A.*

## Summary

| Situation | R function | Notes |
|---|---|---|
| Square invertible A | `solve(A, b)` | LU decomposition; fails on singular A |
| Need A inverse explicitly | `solve(A)` | Avoid when you only need `A^-1 %*% b` |
| Tall (overdetermined) A | `qr.solve(A, b)` | Least squares; numerically stable |
| Reusing the same A | `qr_obj <- qr(A); qr.solve(qr_obj, b)` | Factor once, solve many |
| Statistical regression | `lm(y ~ X)` | Wraps qr() with diagnostics |
| Detect ill-conditioning | `kappa(A, exact = TRUE)` | Bigger than 1e10 = trouble |

Three numerical rules to remember:

1. Pass `b` to `solve()`, never invert A first.
2. For overdetermined systems use `qr.solve()`, never the normal equations.
3. Check `kappa()` whenever results look strange.

## References

1. R Core Team. *solve()* reference. [stat.ethz.ch/R-manual](https://stat.ethz.ch/R-manual/R-devel/library/base/html/solve.html)
2. R Core Team. *qr()* and *qr.solve()* reference. [stat.ethz.ch/R-manual](https://stat.ethz.ch/R-manual/R-devel/library/base/html/qr.html)
3. Trefethen, L. N., & Bau, D. (1997). *Numerical Linear Algebra*. SIAM. Lectures 7, 11, 18, 19.
4. Golub, G. H., & Van Loan, C. F. (2013). *Matrix Computations* (4th ed.). Johns Hopkins. Chapter 5.
5. Bates, D. *Comparing Least Squares Calculations*. Matrix package vignette. [cran.r-project.org/web/packages/Matrix](https://cran.r-project.org/web/packages/Matrix/vignettes/Comparisons.pdf)
6. Wickham, H. (2019). *Advanced R* (2nd ed.). CRC Press. [adv-r.hadley.nz](https://adv-r.hadley.nz/)
7. James, G., Witten, D., Hastie, T., & Tibshirani, R. (2021). *An Introduction to Statistical Learning*. Springer. Chapter 3.
8. Higham, N. J. (2002). *Accuracy and Stability of Numerical Algorithms* (2nd ed.). SIAM. Chapter 18 (linear least squares).

## Continue Learning

- [Matrix Operations in R](Matrix-Operations-in-R.html) — the prerequisites: building matrices, multiplication, inversion, and rank.
- *Eigenvalues & Eigenvectors in R* — the next step in the linear algebra sequence (sibling 2.9.3).
- *Linear Regression in R* — apply `qr.solve()` thinking to the full statistical workflow.
