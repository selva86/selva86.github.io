---
title: "R Error: singular matrix in solve() — Near-Singular Matrix Solutions"
slug: "R-Error-Singular-Matrix"
description: "Fix the R error 'system is computationally singular' in solve(). Learn about collinearity, determinants, ginv(), regularization, and practical matrix solutions."
keywords: "R singular matrix, R solve error, R computationally singular, R matrix inverse error, R collinearity, R near-singular matrix, R ginv"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "ERR18"
post_type: "FR"
auto_link_terms: "singular matrix|computationally singular|singular matrix in solve"
auto_link_case_sensitive: false
fr_parent: "R-Common-Errors.html"
---

# R Error: singular matrix in solve() — Near-Singular Matrix Solutions

<p class="lead"><code>Error in solve.default(X) : system is computationally singular</code> means R cannot invert the matrix because it is singular (determinant is zero) or nearly singular. This happens when columns are perfectly or highly correlated (multicollinearity).</p>

## The Error

```r
# Reproduce the error: a matrix with linearly dependent columns
mat <- matrix(c(1, 2, 3, 2, 4, 6, 5, 10, 15), nrow = 3)
cat("Matrix:\n")
print(mat)
cat("\nDeterminant:", det(mat), "\n")
cat("Column 2 = 2 * Column 1, Column 3 = 5 * Column 1\n")

# solve(mat)  # Error: system is computationally singular
cat("Cannot invert: the matrix has no inverse.\n")
```

## Cause 1: Perfect Multicollinearity

One column is an exact linear combination of others:

```r
# Common example: including both a variable and its transformation
set.seed(42)
x1 <- rnorm(100)
x2 <- 2 * x1 + 3  # perfectly correlated with x1

X <- cbind(1, x1, x2)
cat("Correlation between x1 and x2:", cor(x1, x2), "\n")
cat("Determinant of X'X:", det(t(X) %*% X), "\n")

# Fix: remove the redundant variable
X_fixed <- cbind(1, x1)
cat("Fixed determinant:", det(t(X_fixed) %*% X_fixed), "\n")

inv <- solve(t(X_fixed) %*% X_fixed)
cat("Inverse computed successfully.\n")
```

**Fix:** Remove one of the perfectly correlated variables. Use `cor(X)` to identify pairs with correlation of 1 or -1.

## Cause 2: More Variables Than Observations

When p > n (more columns than rows), the matrix is always singular:

```r
# 3 observations, 5 variables
set.seed(1)
X <- matrix(rnorm(15), nrow = 3, ncol = 5)
cat("Dimensions:", nrow(X), "x", ncol(X), "\n")
cat("Rank at most:", min(nrow(X), ncol(X)), "\n")

# X'X is 5x5 but rank at most 3 - singular
XtX <- t(X) %*% X
cat("Det of X'X:", det(XtX), "\n")

# Fix: use regularization (ridge penalty)
lambda <- 0.01
XtX_ridge <- XtX + lambda * diag(ncol(X))
cat("Det with ridge:", det(XtX_ridge), "\n")
inv <- solve(XtX_ridge)
cat("Ridge inverse computed successfully.\n")
```

**Fix:** Add a ridge penalty: `solve(t(X) %*% X + lambda * diag(ncol(X)))`. Or use dimensionality reduction (PCA).

## Cause 3: Near-Singular (High Condition Number)

The matrix is technically invertible but so close to singular that numerical errors dominate:

```r
# Near-singular matrix
mat <- matrix(c(1, 1, 1, 1.0001), nrow = 2)
cat("Matrix:\n")
print(mat)
cat("Determinant:", det(mat), "(very small)\n")

# Check condition number
cond <- kappa(mat)
cat("Condition number:", cond, "\n")
cat("Rule of thumb: condition > 1e10 = trouble\n\n")

# solve() may work but results are unreliable
inv <- solve(mat)
cat("Inverse (may be inaccurate):\n")
print(round(inv, 2))

# Fix: check if the result makes sense
cat("\nVerification (should be identity):\n")
print(round(mat %*% inv, 6))
```

**Fix:** Check `kappa(mat)`. If the condition number is very large (>10^10), the inverse is unreliable. Use `MASS::ginv()` (generalized inverse) instead.

## Cause 4: Dummy Variable Trap

Including all levels of a factor plus an intercept creates perfect collinearity:

```r
# Example: 3 groups with dummy encoding
group <- factor(c("A", "A", "B", "B", "C", "C"))
y <- c(10, 12, 20, 22, 30, 32)

# Full dummy encoding + intercept = singular
dummies <- model.matrix(~ 0 + group)
X <- cbind(1, dummies)  # intercept + all 3 dummies
cat("Design matrix:\n")
print(X)
cat("Columns sum to intercept -> singular!\n")
cat("Det:", det(t(X) %*% X), "\n")

# Fix: let model.matrix handle it (drops one level)
X_fixed <- model.matrix(~ group)
cat("\nCorrect design matrix:\n")
print(X_fixed)
cat("Det:", det(t(X_fixed) %*% X_fixed), "\n")
```

**Fix:** Use `model.matrix(~ factor_var)` which automatically drops one level. Never manually include all dummy columns with an intercept.

## Cause 5: Duplicated Columns or Rows

Identical columns or insufficient unique rows:

```r
# Duplicate column
mat <- matrix(c(1, 2, 3, 1, 2, 3, 4, 5, 6), nrow = 3)
cat("Matrix (column 1 = column 2):\n")
print(mat)

# Diagnose: check rank
r <- qr(mat)$rank
cat("Rank:", r, "out of", ncol(mat), "columns\n")

# Fix: find and remove redundant columns
cor_mat <- cor(mat)
cat("\nCorrelation matrix:\n")
print(round(cor_mat, 3))

# Keep only linearly independent columns
independent <- mat[, qr(mat)$pivot[1:r]]
cat("\nIndependent columns:\n")
print(independent)
cat("Now invertible:", det(independent) != 0, "\n")
```

**Fix:** Check `qr(X)$rank`. Remove redundant columns identified by the QR decomposition pivot.

## Practice Exercise

```r
# Exercise: This linear system can't be solved directly.
# Find a solution using regularization.

set.seed(42)
n <- 5
p <- 5
X <- matrix(rnorm(n * p), nrow = n)
X[, 5] <- X[, 1] + X[, 2]  # column 5 = col 1 + col 2 (singular)
y <- rnorm(n)

# solve(t(X) %*% X) %*% t(X) %*% y  # This fails!

# Write code to find a solution:

```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(42)
n <- 5
p <- 5
X <- matrix(rnorm(n * p), nrow = n)
X[, 5] <- X[, 1] + X[, 2]
y <- rnorm(n)

# Solution 1: Ridge regression (add penalty to diagonal)
lambda <- 0.1
XtX <- t(X) %*% X
beta_ridge <- solve(XtX + lambda * diag(p)) %*% t(X) %*% y
cat("Ridge solution (lambda=0.1):\n")
cat("  beta:", round(beta_ridge, 4), "\n")

# Solution 2: Use generalized inverse (Moore-Penrose)
ginv <- function(X) {
  s <- svd(X)
  tol <- max(dim(X)) * max(s$d) * .Machine$double.eps
  pos <- s$d > tol
  s$v[, pos] %*% diag(1/s$d[pos], nrow = sum(pos)) %*% t(s$u[, pos])
}
beta_ginv <- ginv(t(X) %*% X) %*% t(X) %*% y
cat("Generalized inverse solution:\n")
cat("  beta:", round(beta_ginv, 4), "\n")

# Solution 3: Remove the redundant column
X_reduced <- X[, 1:4]
beta_reduced <- solve(t(X_reduced) %*% X_reduced) %*% t(X_reduced) %*% y
cat("Reduced model (4 cols):\n")
cat("  beta:", round(beta_reduced, 4), "\n")
```

**Explanation:** Three approaches: (1) Ridge regression adds a penalty that makes the matrix invertible. (2) The generalized inverse (via SVD) handles singular matrices directly. (3) Removing the redundant column is the simplest fix. In practice, ridge regression is often preferred because it also reduces overfitting.

</details>

## Summary

| Cause | Fix | Prevention |
|-------|-----|------------|
| Perfect multicollinearity | Remove redundant variables | Check `cor(X)` before modeling |
| More variables than observations | Ridge penalty or PCA | Reduce dimensionality first |
| Near-singular (high condition) | `MASS::ginv()` | Check `kappa(X)` |
| Dummy variable trap | Use `model.matrix()` | Let R handle factor encoding |
| Duplicate columns | Remove via QR rank | Check `qr(X)$rank` |

## FAQ

### What is the generalized inverse and when should I use it?

The Moore-Penrose generalized inverse (`MASS::ginv()`) always exists, even for singular matrices. It gives a least-squares solution that minimizes the norm of the coefficient vector. Use it when you need a solution and the matrix is singular, but be aware the solution is not unique.

### How do I check if a matrix is singular before calling solve()?

Compute `det(mat)` — if it's zero (or very close), the matrix is singular. A more reliable check is `kappa(mat)` (condition number) or `qr(mat)$rank` (numerical rank). If rank < ncol, the matrix is singular.

## What's Next?

1. **lme4 Error: Model failed to converge** — mixed model convergence fixes
2. **R Warning: longer object length is not a multiple** — vector recycling
3. **R Common Errors** — the full reference of 50 common errors
