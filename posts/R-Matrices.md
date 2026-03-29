---
title: "R Matrices: Fast Linear Algebra Operations That Data Frames Can't Do"
slug: "R-Matrices"
description: "R matrices store uniform numeric data for fast math. Learn to create, index, multiply, transpose, and solve linear systems with interactive examples."
keywords: "R matrix, matrix() in R, R linear algebra, R matrix operations, matrix multiplication R, R transpose, R solve"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "FR-fund-2"
post_type: "FR"
auto_link_terms: "R matrix|matrix() in R|R linear algebra"
auto_link_case_sensitive: false
fr_parent: "R-Data-Frames.html"
---

# R Matrices: Fast Linear Algebra Operations That Data Frames Can't Do

<p class="lead">A matrix is a 2D array where every element has the same type — typically numeric. Matrices are faster than data frames for math-heavy operations like linear algebra, statistics, and machine learning algorithms.</p>

Data frames are great for mixed data (numbers + text + logical). But when all your data is numeric and you need matrix math — multiplication, transposition, decomposition, solving equations — matrices are the right tool. They're faster, use less memory, and support operations that data frames don't.

## Introduction

A **matrix** in R is a 2D collection of values with rows and columns, where **every element has the same type**. Think of it as a vector arranged in a grid:

- A vector is 1D: `[1, 2, 3, 4, 5, 6]`
- A matrix is 2D: the same 6 values arranged as 2 rows × 3 columns (or 3×2, etc.)

```r
# Create a matrix from a vector
m <- matrix(1:12, nrow = 3, ncol = 4)
print(m)
cat("\nDimensions:", nrow(m), "rows x", ncol(m), "columns\n")
cat("Total elements:", length(m), "\n")
```

Notice R fills the matrix **column by column** (column-major order) by default. The first column gets 1, 2, 3, then the second column gets 4, 5, 6, etc.

## Creating Matrices

### matrix() function

```r
# Fill by column (default)
m1 <- matrix(1:12, nrow = 3)
cat("By column (default):\n")
print(m1)

# Fill by row
m2 <- matrix(1:12, nrow = 3, byrow = TRUE)
cat("\nBy row:\n")
print(m2)

# With row and column names
m3 <- matrix(c(88, 92, 75, 95, 81, 90), nrow = 3,
  dimnames = list(
    c("Alice", "Bob", "Carol"),     # row names
    c("Math", "Science")            # column names
  ))
cat("\nNamed matrix:\n")
print(m3)
```

### From vectors: rbind() and cbind()

```r
# Stack vectors as rows
row1 <- c(1, 2, 3)
row2 <- c(4, 5, 6)
row3 <- c(7, 8, 9)
m_rows <- rbind(row1, row2, row3)
cat("rbind (rows):\n")
print(m_rows)

# Stack vectors as columns
col_a <- c(10, 20, 30)
col_b <- c(40, 50, 60)
m_cols <- cbind(col_a, col_b)
cat("\ncbind (columns):\n")
print(m_cols)
```

### Special matrices

```r
# Identity matrix
I <- diag(4)
cat("4x4 Identity:\n")
print(I)

# Diagonal matrix from a vector
d <- diag(c(2, 5, 8))
cat("\nDiagonal:\n")
print(d)

# Matrix of zeros or ones
zeros <- matrix(0, nrow = 3, ncol = 3)
ones <- matrix(1, nrow = 2, ncol = 4)
cat("\nZeros:\n")
print(zeros)
cat("\nOnes:\n")
print(ones)
```

## Accessing Elements

Matrix indexing uses `[row, col]`:

```r
m <- matrix(1:20, nrow = 4, ncol = 5)
cat("Matrix:\n")
print(m)

# Single element
cat("\nm[2, 3]:", m[2, 3], "\n")

# Entire row (leave column blank)
cat("Row 1:", m[1, ], "\n")

# Entire column (leave row blank)
cat("Column 3:", m[, 3], "\n")

# Submatrix
cat("\nRows 1-2, Columns 3-5:\n")
print(m[1:2, 3:5])

# By name (if named)
grades <- matrix(c(88, 92, 75, 95, 81, 90), nrow = 3,
  dimnames = list(c("Alice", "Bob", "Carol"), c("Math", "Science")))
cat("\nAlice's Math:", grades["Alice", "Math"], "\n")
cat("All Science:", grades[, "Science"], "\n")
```

## Matrix Arithmetic

### Element-wise operations

Standard operators apply element by element — just like vector math:

```r
A <- matrix(c(1, 2, 3, 4), nrow = 2)
B <- matrix(c(5, 6, 7, 8), nrow = 2)

cat("A:\n"); print(A)
cat("\nB:\n"); print(B)

cat("\nA + B (element-wise addition):\n"); print(A + B)
cat("\nA * B (element-wise multiplication):\n"); print(A * B)
cat("\nA^2 (element-wise square):\n"); print(A^2)
cat("\nA / B (element-wise division):\n"); print(round(A / B, 3))
```

**Important:** `A * B` is **element-wise** multiplication, not matrix multiplication. For matrix multiplication, use `%*%`.

### Matrix multiplication

```r
# Matrix multiplication uses %*%
A <- matrix(c(1, 2, 3, 4, 5, 6), nrow = 2)  # 2x3
B <- matrix(c(7, 8, 9, 10, 11, 12), nrow = 3)  # 3x2

cat("A (2x3):\n"); print(A)
cat("\nB (3x2):\n"); print(B)

# A %*% B produces a 2x2 matrix
C <- A %*% B
cat("\nA %*% B (2x2):\n"); print(C)

# Dimensions must match: A's columns = B's rows
cat("\nA:", nrow(A), "x", ncol(A), "\n")
cat("B:", nrow(B), "x", ncol(B), "\n")
cat("Result:", nrow(C), "x", ncol(C), "\n")
```

Matrix multiplication is the foundation of linear regression, PCA, neural networks, and most statistical algorithms.

### Transpose

```r
A <- matrix(1:6, nrow = 2)
cat("A (2x3):\n"); print(A)

# t() transposes — swaps rows and columns
At <- t(A)
cat("\nt(A) (3x2):\n"); print(At)

# Transpose + multiply: A'A (common in statistics)
AtA <- t(A) %*% A
cat("\nt(A) %*% A (3x3):\n"); print(AtA)
```

`t(A) %*% A` appears everywhere in statistics — it's the basis of least squares regression.

## Matrix Functions

```r
M <- matrix(c(4, 2, 7, 6), nrow = 2)
cat("M:\n"); print(M)

# Determinant
cat("\nDeterminant:", det(M), "\n")

# Inverse (M^-1 such that M %*% M^-1 = I)
M_inv <- solve(M)
cat("\nInverse of M:\n"); print(M_inv)

# Verify: M %*% M_inv should be identity
cat("\nM %*% M_inv (should be identity):\n")
print(round(M %*% M_inv, 10))
```

```r
# Solving linear equations: Ax = b
# 2x + 3y = 8
# 4x + 1y = 10

A <- matrix(c(2, 4, 3, 1), nrow = 2)
b <- c(8, 10)

x <- solve(A, b)
cat("Solution: x =", x[1], ", y =", x[2], "\n")

# Verify: A %*% x should equal b
cat("Verification:", A %*% x, "\n")
```

```r
# Eigenvalues and eigenvectors
M <- matrix(c(4, 1, 2, 3), nrow = 2)
eigen_result <- eigen(M)
cat("Eigenvalues:", eigen_result$values, "\n")
cat("\nEigenvectors:\n")
print(eigen_result$vectors)
```

## Row and Column Operations

```r
m <- matrix(c(10, 20, 30, 40, 50, 60, 70, 80, 90), nrow = 3,
  dimnames = list(c("R1", "R2", "R3"), c("A", "B", "C")))
cat("Matrix:\n"); print(m)

# Row sums and means
cat("\nRow sums:", rowSums(m), "\n")
cat("Row means:", rowMeans(m), "\n")

# Column sums and means
cat("Col sums:", colSums(m), "\n")
cat("Col means:", colMeans(m), "\n")

# Apply any function across rows or columns
# MARGIN = 1 → apply to each row
# MARGIN = 2 → apply to each column
cat("\nRow max:", apply(m, 1, max), "\n")
cat("Col sd:", round(apply(m, 2, sd), 2), "\n")
```

`apply()` is the matrix equivalent of `sapply()` for lists. `MARGIN = 1` means "apply the function to each row," `MARGIN = 2` means "each column."

## Matrix vs Data Frame: When to Use Which

```r
# Speed comparison: matrix is faster for numeric operations
n <- 1000
mat <- matrix(rnorm(n * 100), nrow = n)
df <- as.data.frame(mat)

t_mat <- system.time(for (i in 1:100) colMeans(mat))
t_df <- system.time(for (i in 1:100) colMeans(as.matrix(df)))

cat("Matrix colMeans (100x):", t_mat["elapsed"], "sec\n")
cat("Data frame colMeans (100x):", t_df["elapsed"], "sec\n")
```

| Feature | Matrix | Data Frame |
|---------|--------|-----------|
| Data types | Single type only | Mixed types |
| Math operations | `%*%`, `solve()`, `eigen()` | Not supported |
| Speed | Faster | Slower |
| Column types | All same | Each can differ |
| Row names | Optional | Optional |
| Use case | Linear algebra, statistics | Tabular data analysis |

**Rule of thumb:** Use a matrix when all data is numeric and you need matrix math. Use a data frame for everything else.

## Converting Between Matrix and Data Frame

```r
# Data frame to matrix
df <- data.frame(x = 1:3, y = 4:6, z = 7:9)
mat <- as.matrix(df)
cat("Data frame to matrix:\n"); print(mat)
cat("Type:", class(mat), "\n\n")

# Matrix to data frame
mat2 <- matrix(1:12, nrow = 3, dimnames = list(NULL, c("a", "b", "c", "d")))
df2 <- as.data.frame(mat2)
cat("Matrix to data frame:\n"); print(df2)
cat("Type:", class(df2), "\n")
```

## Practice Exercises

### Exercise 1: Matrix Basics

```r
# Exercise: Create a 3x3 matrix representing sales data:
#        Q1   Q2   Q3
# Prod A: 100  120  110
# Prod B: 200  180  220
# Prod C: 150  160  170
#
# 1. Find total sales per product (row sums)
# 2. Find total sales per quarter (column sums)
# 3. Find which product had the highest Q2 sales

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
# Solution
sales <- matrix(c(100, 200, 150, 120, 180, 160, 110, 220, 170), nrow = 3,
  dimnames = list(c("Prod A", "Prod B", "Prod C"), c("Q1", "Q2", "Q3")))

cat("Sales:\n"); print(sales)

cat("\nTotal per product:", rowSums(sales), "\n")
cat("Total per quarter:", colSums(sales), "\n")

best_q2 <- rownames(sales)[which.max(sales[, "Q2"])]
cat("Highest Q2 sales:", best_q2, "with", max(sales[, "Q2"]), "\n")
```

**Explanation:** `rowSums()` adds across columns for each row. `which.max()` finds the position of the maximum, and `rownames()` converts that position to a product name.

</details>

### Exercise 2: Solve a System of Equations

```r
# Exercise: Solve this system of 3 equations:
# 2x + y - z = 8
# -3x - y + 2z = -11
# -2x + y + 2z = -3
#
# Set up as Ax = b and use solve()

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
# Solution
A <- matrix(c(2, -3, -2, 1, -1, 1, -1, 2, 2), nrow = 3)
b <- c(8, -11, -3)

cat("A:\n"); print(A)
cat("b:", b, "\n")

x <- solve(A, b)
cat("\nSolution: x =", x[1], ", y =", x[2], ", z =", x[3], "\n")

# Verify
cat("Verification (A %*% x):", A %*% x, "\n")
cat("Should equal b:", b, "\n")
```

**Explanation:** The matrix `A` contains the coefficients (filled column-by-column: first column is x coefficients, second is y, third is z). `solve(A, b)` finds the vector x such that `A %*% x = b`.

</details>

### Exercise 3: Correlation Matrix

```r
# Exercise: Using mtcars, create a correlation matrix for
# mpg, hp, wt, and qsec. Then find which pair has the
# strongest correlation (positive or negative).
# Hint: cor() creates a correlation matrix

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
# Solution
vars <- mtcars[, c("mpg", "hp", "wt", "qsec")]
cor_mat <- round(cor(vars), 3)

cat("Correlation matrix:\n")
print(cor_mat)

# Find strongest correlation (excluding diagonal)
diag(cor_mat) <- 0  # Zero out the 1.0 diagonal
strongest <- which(abs(cor_mat) == max(abs(cor_mat)), arr.ind = TRUE)[1,]
cat("\nStrongest correlation:",
    rownames(cor_mat)[strongest[1]], "&",
    colnames(cor_mat)[strongest[2]],
    "=", cor(vars)[strongest[1], strongest[2]], "\n")
```

**Explanation:** `cor()` computes pairwise correlations for all columns. We zero the diagonal (self-correlation = 1.0) then find the maximum absolute value. The strongest correlation is between `wt` and `mpg` (about -0.87) — heavier cars get worse fuel economy.

</details>

## Summary

| Operation | Code | Notes |
|-----------|------|-------|
| Create | `matrix(data, nrow, ncol)` | Fills column-by-column by default |
| By row | `matrix(data, nrow, byrow = TRUE)` | Fills row-by-row |
| From vectors | `rbind()` / `cbind()` | Stack rows or columns |
| Access | `m[row, col]` | Leave blank for all: `m[1,]`, `m[,2]` |
| Element-wise | `+`, `-`, `*`, `/` | Applied to matching positions |
| Matrix multiply | `A %*% B` | Columns of A must = rows of B |
| Transpose | `t(A)` | Swap rows and columns |
| Inverse | `solve(A)` | Only for square, non-singular matrices |
| Solve Ax=b | `solve(A, b)` | Linear system of equations |
| Determinant | `det(A)` | 0 means singular (no inverse) |
| Row/col stats | `rowSums()`, `colMeans()`, etc. | Very fast |
| Apply function | `apply(m, MARGIN, fun)` | 1=rows, 2=columns |

## FAQ

### When does R use matrices internally?

All the time. Linear regression (`lm()`) builds a design matrix internally. PCA uses eigen decomposition of a covariance matrix. Distance calculations (`dist()`) produce matrices. Most statistical algorithms work with matrices under the hood.

### Can a matrix hold text?

Technically yes — `matrix(c("a","b","c","d"), nrow=2)` works. But text matrices are rare and slow. If you need mixed types, use a data frame. If you need fast text operations, use character vectors.

### What's the difference between `*` and `%*%`?

`*` is element-wise: `A[i,j] * B[i,j]`. `%*%` is matrix multiplication: each element of the result is a dot product of a row of A with a column of B. For 2×2 matrices: `(A %*% B)[1,1] = A[1,1]*B[1,1] + A[1,2]*B[2,1]`.

### What happens if I multiply matrices with wrong dimensions?

R throws an error: "non-conformable arguments." For `A %*% B`, the number of columns in A must equal the number of rows in B.

## What's Next?

Now you understand both data frames (mixed data) and matrices (numeric data). Explore further:

1. **R Subsetting** — advanced indexing for all data structures
2. **R Type Coercion** — how R converts between types
3. **Linear Regression** — see matrices in action for statistical modeling
