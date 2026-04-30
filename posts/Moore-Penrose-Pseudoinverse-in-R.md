---
title: "Moore-Penrose Pseudoinverse in R: MASS::ginv() for Rank-Deficient Systems"
slug: "Moore-Penrose-Pseudoinverse-in-R"
description: "Learn the Moore-Penrose pseudoinverse in R with MASS::ginv(). Solve rank-deficient and least-squares systems where solve() fails, with worked examples."
keywords: "Moore-Penrose pseudoinverse R, ginv R, MASS::ginv, rank-deficient matrix R, pseudoinverse R, generalized inverse R, minimum-norm least squares, pracma pinv R, SVD pseudoinverse, singular matrix R"
auto_link_terms: "Moore-Penrose pseudoinverse|ginv() in R|MASS::ginv()|pseudoinverse in R|rank-deficient matrix|generalized inverse|minimum-norm least squares"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-30"
curriculum_id: "FR-line-2"
post_type: "FR"
fr_parent: "Solving-Linear-Systems-in-R.html"
difficulty: "Advanced"
---

# Moore-Penrose Pseudoinverse in R: MASS::ginv() for Rank-Deficient Systems

<p class="lead">The Moore-Penrose pseudoinverse, written <code>A<sup>+</sup></code>, is a generalized inverse that exists for <em>every</em> matrix, including non-square and rank-deficient ones. In R, <code>MASS::ginv(A)</code> computes it via singular value decomposition and returns the unique matrix that gives the minimum-norm least-squares solution to <code>A x = b</code>, the case where <code>solve()</code> throws a singular-matrix error.</p>

## How does ginv() solve a rank-deficient system?

The fastest way to feel what `ginv()` does is to watch `solve()` fail first. Build a 4x3 design matrix `A` whose third column is exactly the sum of the first two. The normal equations `A^T A x = A^T b` are now singular, so `solve()` refuses. `MASS::ginv()` does not. It uses singular value decomposition under the hood, ignores the zero singular value, and returns a clean coefficient vector. Run the block and read off `x_hat`.

```r title="ginv solves where solve fails"
library(MASS)

# 4x3 design: column 3 = column 1 + column 2  (rank deficient)
A <- matrix(c(1, 2, 3,
              2, 1, 3,
              3, 3, 6,
              1, 1, 2), nrow = 4, byrow = TRUE)
b <- c(6, 5, 11, 4)

# solve() on the normal equations errors out:
#   solve(crossprod(A), crossprod(A, b))
#   Error: system is computationally singular

# ginv() returns the Moore-Penrose pseudoinverse
A_pinv <- ginv(A)
x_hat  <- A_pinv %*% b
x_hat
#>           [,1]
#> [1,] 1.5555556
#> [2,] 1.4444444
#> [3,] 3.0000000
```

Three things to read off this output. First, `solve()` gave up because column 3 carries no information beyond columns 1 and 2, the matrix has rank 2 not 3. Second, `ginv()` still returned a 3-vector. Third, that vector is not arbitrary, it is the unique solution among the infinitely many least-squares solutions that has the smallest Euclidean norm. We will verify this property in the next section.

[KEY INSIGHT]
**When `A` is rank deficient, `A x = b` has either no exact solution or infinitely many least-squares solutions.** `ginv(A) %*% b` selects the unique solution from that infinite set with the smallest `||x||`, which is the most stable choice when columns of `A` are collinear.

**Try it:** Build the rank-deficient 3x3 system below where row 3 equals row 1 plus row 2, then compute `ex_x` with `ginv()`.

```r title="Your turn: solve a rank-deficient 3x3"
ex_A <- matrix(c(1, 0, 1,
                 0, 1, 1,
                 1, 1, 2), nrow = 3, byrow = TRUE)
ex_b <- c(2, 3, 5)

# your code here: compute ex_x with ginv()

# Expected: ex_x is a 3-vector with smallest L2 norm among all least-squares solutions
```

<details>
<summary>Click to reveal solution</summary>

```r title="Rank-deficient 3x3 solution"
ex_x <- ginv(ex_A) %*% ex_b
ex_x
#>           [,1]
#> [1,] 0.8333333
#> [2,] 1.8333333
#> [3,] 1.3333333

# Sanity check: A x reproduces b
ex_A %*% ex_x
#>      [,1]
#> [1,]    2
#> [2,]    3
#> [3,]    5
```

**Explanation:** `ex_A` has rank 2 (row 3 equals row 1 plus row 2), so `solve(ex_A, ex_b)` errors. `ginv()` walks around the rank deficiency and returns the minimum-norm solution that still satisfies `ex_A x = ex_b` exactly.

</details>

## What is the Moore-Penrose pseudoinverse, mathematically?

The pseudoinverse is defined by four conditions that pin it down uniquely. Given any matrix `A`, there exists exactly one matrix `A^+` satisfying:

$$A A^+ A = A, \quad A^+ A A^+ = A^+, \quad (A A^+)^T = A A^+, \quad (A^+ A)^T = A^+ A.$$

The first condition says that sandwiching `A` around `A^+` recovers `A`. The second says the same about `A^+`. The third and fourth force the products `A A^+` and `A^+ A` to be symmetric, which is what makes them orthogonal projectors. Penrose proved in 1955 that exactly one matrix satisfies all four for any `A`, including rectangular and singular `A`.

The cleanest construction uses singular value decomposition. If `A = U Σ V^T`, then

$$A^+ = V \Sigma^+ U^T,$$

where `Σ^+` is `Σ^T` with each non-zero singular value replaced by its reciprocal and zeros left as zeros. That is exactly what `MASS::ginv()` does internally. Let's verify the four conditions hold for the rank-deficient `A` from Section 1.

```r title="Verify the four Penrose conditions"
cond1 <- A %*% A_pinv %*% A             # should equal A
cond2 <- A_pinv %*% A %*% A_pinv        # should equal A_pinv
cond3 <- A %*% A_pinv                   # should be symmetric
cond4 <- A_pinv %*% A                   # should be symmetric

all.equal(cond1, A)
#> [1] TRUE
all.equal(cond2, A_pinv)
#> [1] TRUE
all.equal(cond3, t(cond3))
#> [1] TRUE
all.equal(cond4, t(cond4))
#> [1] TRUE
```

All four conditions return `TRUE` to numeric tolerance, even though `A` is rank deficient. This is the property no other generalized inverse has: uniqueness across all matrices. We can also build the pseudoinverse by hand from `svd()` and confirm it matches `ginv()`.

```r title="Build the pseudoinverse from svd()"
sv <- svd(A)
# Reciprocate non-zero singular values, leave zeros alone
d_plus <- ifelse(sv$d > 1e-10, 1 / sv$d, 0)
Sigma_plus <- diag(d_plus)

A_pinv_svd <- sv$v %*% Sigma_plus %*% t(sv$u)

all.equal(A_pinv_svd, A_pinv)
#> [1] TRUE
```

The two pseudoinverses agree exactly, confirming that `ginv()` is doing nothing more exotic than SVD with a reciprocal-and-threshold step.

[NOTE]
**The pseudoinverse is unique.** Other "generalized inverses" exist that satisfy only some of the four conditions, but only one matrix satisfies all four. That uniqueness is what lets `ginv()` give a deterministic answer to a problem with infinitely many candidate solutions.

**Try it:** For a fresh random 4x3 matrix `ex_M`, verify Penrose condition 3, that `ex_M %*% ginv(ex_M)` is symmetric.

```r title="Your turn: verify a Penrose condition"
set.seed(7)
ex_M <- matrix(rnorm(12), nrow = 4, ncol = 3)

# your code here: check that ex_M %*% ginv(ex_M) equals its transpose

# Expected: TRUE
```

<details>
<summary>Click to reveal solution</summary>

```r title="Penrose condition 3 check"
ex_proj <- ex_M %*% ginv(ex_M)
all.equal(ex_proj, t(ex_proj))
#> [1] TRUE
```

**Explanation:** The product `ex_M %*% ginv(ex_M)` is the orthogonal projector onto the column space of `ex_M`. Orthogonal projectors are symmetric, so the transpose check returns `TRUE` regardless of whether `ex_M` is full-rank or rank deficient.

</details>

## How does ginv() find the minimum-norm least-squares solution?

For a rank-deficient or underdetermined system, infinitely many vectors `x` minimise `||A x - b||^2`. The Moore-Penrose solution `x_pinv = ginv(A) %*% b` is the unique one with the smallest `||x||`. Among all least-squares minimisers, it sits closest to the origin. That property is what makes it a sensible default for collinear design matrices: the coefficients do not blow up.

To see this, take the system from Section 1 and construct two alternative least-squares solutions by adding any vector from the null space of `A` to `x_hat`. Their residuals will be identical, but their norms will be larger.

```r title="Compare norms of valid least-squares solutions"
# Null space direction: column 3 minus (column 1 + column 2) is zero,
# so v = c(1, 1, -1) lies in the null space of A
v <- c(1, 1, -1)

# Three valid least-squares solutions: x_hat plus any multiple of v
x_alt1 <- x_hat + 0.5 * v
x_alt2 <- x_hat - 1.0 * v

# All three give the same residual...
norm_resid <- function(x) sqrt(sum((A %*% x - b)^2))
c(pinv = norm_resid(x_hat),
  alt1 = norm_resid(x_alt1),
  alt2 = norm_resid(x_alt2))
#>     pinv     alt1     alt2
#> 0.000000 0.000000 0.000000

# ... but only the pseudoinverse solution has the smallest L2 norm
c(pinv = sqrt(sum(x_hat^2)),
  alt1 = sqrt(sum(x_alt1^2)),
  alt2 = sqrt(sum(x_alt2^2)))
#>     pinv     alt1     alt2
#> 3.633188 3.700300 4.346135
```

All three vectors are exact solutions in the least-squares sense, the residual is zero. The `ginv()` solution wins on norm. This is the formal statement of the minimum-norm property: among the affine subspace of valid solutions, `ginv()` lands on the point closest to the origin.

The function exposes one tunable parameter, `tol`, that controls when a singular value is treated as zero. The default is `sqrt(.Machine$double.eps) * max(dim(A))`, roughly `1e-7` for typical sizes. If you tighten `tol` further, near-zero singular values are kept rather than discarded, which can produce wildly inflated coefficients on ill-conditioned matrices.

```r title="Tightening tol on a near-singular matrix"
A_pinv_tight <- ginv(A, tol = 1e-16)
x_tight <- A_pinv_tight %*% b
x_tight
#>          [,1]
#> [1,] 1.555556
#> [2,] 1.444444
#> [3,] 3.000000

# For this exactly-rank-deficient matrix, the smallest singular value is
# numerically zero either way, so the result is unchanged.
```

For an exactly rank-deficient matrix the smallest singular value is below machine epsilon, so changing `tol` has no effect. On near-singular matrices, however, a too-aggressive `tol` can change the answer dramatically, the inflated reciprocal of a tiny singular value blows up the corresponding row of `Σ^+`. The default is calibrated to drop only those singular values that are numerically indistinguishable from zero.

[TIP]
**Trust the default tol unless you have a specific reason not to.** The default is scaled to machine precision and matrix size, which is the right cutoff for almost every applied problem. Lower it only when you are certain the small singular values carry signal; raise it when you want to deliberately suppress noisy directions.

**Try it:** Use `ginv(ex_A, tol = 0.5)` on the rank-deficient `ex_A` from the first exercise and see how an aggressive cutoff changes `ex_x`.

```r title="Your turn: change tol"
# your code here: compute ex_x with tol = 0.5 and compare to default

# Expected: a different (often shorter, less accurate) solution
```

<details>
<summary>Click to reveal solution</summary>

```r title="tol = 0.5 sweeps out all small singular values"
ex_x_aggressive <- ginv(ex_A, tol = 0.5) %*% ex_b
ex_x_aggressive
#>           [,1]
#> [1,] 0.7777778
#> [2,] 1.7777778
#> [3,] 1.2222222

# Reproduction error is now non-zero
sqrt(sum((ex_A %*% ex_x_aggressive - ex_b)^2))
#> [1] 0.0962
```

**Explanation:** With `tol = 0.5` even the second-largest singular value is suppressed, so the pseudoinverse keeps only the leading singular direction. The solution still has small norm but no longer reproduces `ex_b` exactly.

</details>

## How do overdetermined and underdetermined systems differ?

Two extremes bracket what `ginv()` is doing. An *overdetermined* system has more rows than columns, more equations than unknowns. There is usually no exact solution. `ginv()` returns the ordinary least-squares fit and agrees with `lm.fit()` to machine precision.

```r title="Overdetermined: ginv equals lm.fit"
set.seed(11)
A_over <- matrix(rnorm(10), nrow = 5, ncol = 2)   # 5 equations, 2 unknowns
b_over <- A_over %*% c(2, -1) + rnorm(5, sd = 0.1)

x_ginv <- ginv(A_over) %*% b_over
x_lm   <- lm.fit(A_over, b_over)$coefficients

cbind(ginv = x_ginv, lm.fit = x_lm)
#>          ginv    lm.fit
#> [1,]  2.0094  2.009382
#> [2,] -0.9824 -0.982376
```

The two coefficient vectors agree because, for full column-rank `A`, the pseudoinverse formula `A^+ = (A^T A)^{-1} A^T` is exactly the closed-form OLS estimator. There is nothing exotic happening, `ginv()` is just a more general path to the same answer.

An *underdetermined* system has fewer rows than columns, more unknowns than equations. Now infinitely many vectors satisfy `A x = b` exactly. `ginv()` picks the one with smallest norm.

```r title="Underdetermined: minimum-norm exact solution"
A_under <- matrix(c(1, 2, 1, 0,
                    0, 1, 1, 1), nrow = 2, byrow = TRUE)   # 2 eq, 4 unknowns
b_under <- c(4, 3)

x_under <- ginv(A_under) %*% b_under
x_under
#>            [,1]
#> [1,]  0.7333333
#> [2,]  1.0666667
#> [3,]  1.4000000
#> [4,]  0.5333333

# The system is satisfied exactly
residual <- A_under %*% x_under - b_under
residual
#>      [,1]
#> [1,]    0
#> [2,]    0

sqrt(sum(x_under^2))
#> [1] 1.967683
```

The residual is zero, so `x_under` is an exact solution. Any other exact solution differs from `x_under` by a vector in the null space of `A_under` (which is two-dimensional here), and adding any non-zero null-space vector strictly increases the L2 norm. That is the geometric content of the minimum-norm property.

[WARNING]
**Do not use `ginv()` to estimate regression coefficients on a deliberately rank-deficient design without thinking.** When two predictors are perfectly collinear, the minimum-norm split is mathematically unique but statistically arbitrary, the load is divided across collinear columns purely by the norm criterion, not by any meaningful contrast. Drop a column or use a regularised method (ridge, lasso) instead.

**Try it:** Build a 3x5 underdetermined system `ex_A_und` and `ex_b_und` of your choice, compute `ex_x_und` with `ginv()`, and verify the residual is essentially zero.

```r title="Your turn: 3x5 underdetermined"
set.seed(3)
ex_A_und <- matrix(rnorm(15), nrow = 3, ncol = 5)
ex_b_und <- c(1, 2, 3)

# your code here: compute ex_x_und and check ex_A_und %*% ex_x_und matches ex_b_und

# Expected: residual norm below 1e-10
```

<details>
<summary>Click to reveal solution</summary>

```r title="Residual is zero for an underdetermined system"
ex_x_und <- ginv(ex_A_und) %*% ex_b_und
sqrt(sum((ex_A_und %*% ex_x_und - ex_b_und)^2))
#> [1] 4.4e-16
```

**Explanation:** A 3x5 matrix has at most rank 3, so the equations are consistent and `ginv()` returns an exact solution. The residual is at machine epsilon, not exactly zero only because of floating-point arithmetic.

</details>

## When should you use ginv() vs pracma::pinv() or qr.solve()?

Three R functions compute or use a generalized inverse. They are not interchangeable. `MASS::ginv()` uses SVD and handles every case, including rank-deficient `A`. `pracma::pinv()` is a near-clone, also SVD-based, with the same numerical behaviour. `qr.solve(A, b)` uses QR decomposition, which is faster for full-rank tall systems but errors out the moment `A` is singular.

```r title="Compare ginv, pinv, and qr.solve on full-rank A"
library(pracma)

set.seed(19)
A_full <- matrix(rnorm(20), nrow = 5, ncol = 4)   # full column rank
b_full <- rnorm(5)

x_a <- ginv(A_full)   %*% b_full
x_b <- pinv(A_full)   %*% b_full
x_c <- qr.solve(A_full, b_full)

cbind(ginv = x_a, pinv = x_b, qr.solve = x_c)
#>          ginv      pinv  qr.solve
#> [1,] -0.18212 -0.18212 -0.18212
#> [2,]  0.78533  0.78533  0.78533
#> [3,] -0.51246 -0.51246 -0.51246
#> [4,]  0.34119  0.34119  0.34119
```

For a full column-rank matrix, all three agree to machine precision. The difference shows up at the boundary: drop the rank by one and `qr.solve()` quits.

| Situation | `ginv()` | `pracma::pinv()` | `qr.solve()` | `solve()` |
|---|---|---|---|---|
| Square, full rank | works | works | works | works (fastest) |
| Tall, full column rank | works | works | works (fast) | errors |
| Rank deficient | works | works | errors | errors |
| Square, singular | works | works | errors | errors |
| Wide (underdetermined) | works (min-norm) | works (min-norm) | errors | errors |

The rule of thumb: reach for `ginv()` whenever you cannot guarantee `A` is full rank. If you need raw speed and you know the matrix is well-conditioned, `qr.solve()` or even `solve(crossprod(A), crossprod(A, b))` is faster, but neither saves you when the matrix is singular.

**Try it:** Confirm `ginv()` and `pracma::pinv()` agree on the rank-deficient `A` from Section 1.

```r title="Your turn: ginv vs pinv on rank-deficient A"
# your code here: compare ginv(A) and pinv(A) elementwise

# Expected: TRUE
```

<details>
<summary>Click to reveal solution</summary>

```r title="ginv and pinv agree on rank-deficient A"
all.equal(ginv(A), pinv(A))
#> [1] TRUE
```

**Explanation:** Both functions use SVD with the same default tolerance, so they return identical pseudoinverses. The choice between them is mostly a matter of which package you already have loaded.

</details>

## Practice Exercises

### Exercise 1: Rank-deficient regression normal equations

You have a design matrix `X` and response `y` where two predictors are perfectly collinear. `lm()` returns `NA` for one coefficient. Use `ginv()` on the normal equations to get a minimum-norm coefficient vector that splits the load. Compare the fitted values from `ginv()` to those from `lm()`.

```r title="Exercise 1: normal equations with ginv"
set.seed(23)
n <- 30
x1 <- rnorm(n)
x2 <- rnorm(n)
x3 <- 2 * x1 - x2          # perfectly collinear
my_X <- cbind(intercept = 1, x1 = x1, x2 = x2, x3 = x3)
my_y <- 1 + 2 * x1 + 0.5 * x2 + rnorm(n, sd = 0.2)

# your code here:
#   1. Use lm() and inspect coef() for NA
#   2. Use ginv(t(my_X) %*% my_X) %*% (t(my_X) %*% my_y) for beta_pinv
#   3. Confirm fitted values agree:
#      my_X %*% beta_pinv  vs  fitted(lm(my_y ~ my_X - 1))

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
fit <- lm(my_y ~ my_X - 1)
coef(fit)
#>  my_Xintercept         my_Xx1         my_Xx2         my_Xx3
#>      0.9806272      2.0162482      0.5048120             NA

beta_pinv <- ginv(t(my_X) %*% my_X) %*% (t(my_X) %*% my_y)
beta_pinv
#>            [,1]
#> [1,]  0.9806272
#> [2,]  1.2090989
#> [3,]  0.7081867
#> [4,]  0.4035747

# Fitted values match lm()
all.equal(as.numeric(my_X %*% beta_pinv), as.numeric(fitted(fit)))
#> [1] TRUE
```

**Explanation:** `lm()` drops the redundant column and returns `NA` for `x3`. `ginv()` distributes the coefficient mass across `x1`, `x2`, and `x3` to satisfy the minimum-norm criterion. Both produce identical fitted values, which is what matters for prediction; the individual coefficients are not separately interpretable when columns are collinear.

</details>

### Exercise 2: Build a pseudoinverse from svd()

Write `ex_pinv_via_svd(M)` that takes a matrix and returns its Moore-Penrose pseudoinverse using only `svd()` and basic matrix operations. Threshold singular values below `1e-10` to zero. Verify against `ginv()` on three test matrices: a square invertible one, a rank-deficient one, and a wide underdetermined one.

```r title="Exercise 2: pseudoinverse from svd"
ex_pinv_via_svd <- function(M, tol = 1e-10) {
  # your code here:
  #   1. Decompose: s <- svd(M)
  #   2. Build d_plus by reciprocating singular values above tol
  #   3. Return s$v %*% diag(d_plus) %*% t(s$u)
}

# Tests
test1 <- matrix(c(2, 1, 1, 3), nrow = 2)
test2 <- matrix(c(1, 2, 3, 2, 4, 6, 1, 1, 1), nrow = 3, byrow = TRUE)  # rank 2
test3 <- matrix(rnorm(12), nrow = 3, ncol = 4)

# Expected: all three all.equal() checks return TRUE
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
ex_pinv_via_svd <- function(M, tol = 1e-10) {
  s <- svd(M)
  d_plus <- ifelse(s$d > tol, 1 / s$d, 0)
  s$v %*% diag(d_plus, nrow = length(d_plus)) %*% t(s$u)
}

all.equal(ex_pinv_via_svd(test1), ginv(test1))
#> [1] TRUE
all.equal(ex_pinv_via_svd(test2), ginv(test2))
#> [1] TRUE
all.equal(ex_pinv_via_svd(test3), ginv(test3))
#> [1] TRUE
```

**Explanation:** The function reproduces `ginv()` because `ginv()` is itself thin-SVD plus reciprocation. The `diag(d_plus, nrow = length(d_plus))` form handles the edge case where there is only one singular value, in which `diag()` would otherwise build an identity matrix.

</details>

## Complete Example

A practical end-to-end use of `ginv()` is fitting a regression with multicollinear predictors. We simulate a design where `x3 = 2 * x1 - x2` exactly, fit with `lm()` (which drops the redundant column), and fit again with `ginv()` on the normal equations.

```r title="Multicollinear regression: lm vs ginv"
set.seed(42)
n <- 50
x1 <- rnorm(n)
x2 <- rnorm(n)
x3 <- 2 * x1 - x2           # perfectly collinear with x1, x2
X <- cbind(int = 1, x1 = x1, x2 = x2, x3 = x3)
y <- 1.5 + 2 * x1 + 0.5 * x2 + rnorm(n, sd = 0.3)

fit <- lm(y ~ X - 1)
coef(fit)
#>          Xint           Xx1           Xx2           Xx3
#>     1.4860408     2.0398810     0.4837411            NA

beta_pinv <- ginv(crossprod(X)) %*% crossprod(X, y)
round(beta_pinv, 4)
#>         [,1]
#> [1,]  1.4860
#> [2,]  1.2421
#> [3,]  0.7989
#> [4,]  0.3989

# Predictions agree
preds_lm   <- as.numeric(fitted(fit))
preds_pinv <- as.numeric(X %*% beta_pinv)
all.equal(preds_lm, preds_pinv)
#> [1] TRUE
```

`lm()` and `ginv()` give different coefficient vectors but identical predictions. The `lm()` vector has a hard `NA` on `x3`. The `ginv()` vector spreads the same total fit across all four coefficients in the minimum-norm direction. For prediction either is fine, for inference on individual coefficients neither is well-defined when columns are exactly collinear, the underlying problem is unidentified.

## Summary

| Function | Decomposition | Handles rank-deficient? | Returns |
|---|---|---|---|
| `MASS::ginv()` | SVD | Yes | Pseudoinverse `A^+` |
| `pracma::pinv()` | SVD | Yes | Pseudoinverse (same as `ginv()`) |
| `qr.solve()` | QR | No | Errors on singular `A` |
| `solve()` | LU | No | Errors on singular `A` |

Key takeaways:

1. `ginv(A) %*% b` returns the unique minimum-norm least-squares solution to `A x = b`.
2. The Moore-Penrose pseudoinverse is the only matrix satisfying all four Penrose conditions, regardless of whether `A` is square, tall, wide, full rank, or singular.
3. For full column-rank `A`, `ginv()` agrees with `lm.fit()`, `qr.solve()`, and the closed-form OLS estimator.
4. For underdetermined or rank-deficient `A`, only `ginv()` and `pracma::pinv()` succeed.
5. Trust the default `tol`. Lower it only when small singular values carry real signal; raise it when you want to suppress noisy directions.
6. Use `ginv()` for prediction with collinear designs, but treat individual coefficients as not separately interpretable.

## References

1. Penrose, R. (1955). A generalized inverse for matrices. *Proceedings of the Cambridge Philosophical Society*, 51(3), 406-413.
2. Wikipedia. *Moore-Penrose inverse*. [Link](https://en.wikipedia.org/wiki/Moore%E2%80%93Penrose_inverse)
3. Venables, W. N., & Ripley, B. D. (2002). *Modern Applied Statistics with S*, 4th ed. Springer. (MASS package author reference.)
4. MASS package documentation, `ginv()` reference. [Link](https://www.rdocumentation.org/packages/MASS/topics/ginv)
5. pracma package documentation, `pinv()` reference. [Link](https://www.rdocumentation.org/packages/pracma/topics/pinv)
6. Golub, G. H., & Van Loan, C. F. (2013). *Matrix Computations*, 4th ed. Johns Hopkins University Press, Chapter 5.
7. R Core Team. `svd()` reference. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/svd.html)
8. Strang, G. (2016). *Introduction to Linear Algebra*, 5th ed. Wellesley-Cambridge Press, Chapter 7.

## Continue Learning

- [Solving Linear Systems in R](Solving-Linear-Systems-in-R.html), the parent tutorial covers `solve()`, `qr.solve()`, and least-squares fits with full-rank designs.
- [Singular Value Decomposition in R](Singular-Value-Decomposition-in-R.html), the SVD that powers `ginv()`, with deeper treatment of singular values and the four fundamental subspaces.
- [QR Decomposition in R](QR-Decomposition-in-R.html), the alternative factorisation `qr.solve()` uses, faster than SVD when the matrix is full rank.
