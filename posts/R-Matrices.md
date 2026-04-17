---
title: "R Matrices: Fast Linear Algebra Operations That Data Frames Can't Do"
slug: "R-Matrices"
description: "R matrices store homogeneous data and unlock fast linear algebra: matrix multiplication, transpose, inverse, determinants. Learn when to use them instead of data frames."
keywords: "R matrices, matrix in R, matrix multiplication R, linear algebra R, solve R, t() R, matrix indexing R"
auto_link_terms: "R matrices|matrix in R|matrix multiplication in R|solve() in R|matrix indexing"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-11"
curriculum_id: "FR-fund-2"
post_type: "FR"
fr_parent: "R-Data-Frames.html"
difficulty: "Intermediate"
---

# R Matrices: Fast Linear Algebra Operations That Data Frames Can't Do

<p class="lead">A **matrix in R** is a 2D container where every element has the same type, usually numeric. Unlike a data frame, a matrix lets you do real linear algebra: `%*%` for matrix multiplication, `t()` for transpose, `solve()` for inverses. If you're doing math instead of wrangling columns, you want a matrix.</p>

## What is a matrix in R and how is it different from a data frame?

A matrix is a vector with a `dim` attribute that tells R "pretend this is rows and columns." Every element must be the same type, all numeric, all character, all logical. Mixing types is a data frame's job; uniform numeric arithmetic is a matrix's job.

```r title="Anatomy of a matrix object"
m <- matrix(1:12, nrow = 3, ncol = 4)
m
#>      [,1] [,2] [,3] [,4]
#> [1,]    1    4    7   10
#> [2,]    2    5    8   11
#> [3,]    3    6    9   12

class(m)
typeof(m)
dim(m)
#> [1] "matrix" "array"
#> [1] "integer"
#> [1] 3 4
```

Three rows, four columns, filled column by column (that's R's default, more on that in a moment). The `dim` attribute is what turns a plain vector into a matrix; strip the dim and you're back to a 12-element vector.

![Matrix vs data frame decision: all one type → matrix, mixed types → data frame](screenshots/R-Matrices-vs-dataframe.webp)

*Figure 1: Use a matrix when every cell is the same type and you want linear algebra. Use a data frame when columns have different types.*

The trade-off is simple: matrices are faster and enable math operators; data frames are flexible and play well with `dplyr`. Use whichever fits the job.

## How do you create a matrix from vectors?

Three common ways: `matrix()`, `cbind()` (bind columns), and `rbind()` (bind rows). Each has its moment.

```r title="Create a matrix with matrix()"
# matrix() — fill from a vector, specify dimensions
m1 <- matrix(c(1, 2, 3, 4, 5, 6), nrow = 2)
m1
#>      [,1] [,2] [,3]
#> [1,]    1    3    5
#> [2,]    2    4    6

# byrow = TRUE flips the fill direction
m2 <- matrix(c(1, 2, 3, 4, 5, 6), nrow = 2, byrow = TRUE)
m2
#>      [,1] [,2] [,3]
#> [1,]    1    2    3
#> [2,]    4    5    6
```

R fills columns first by default, a surprise if you're coming from Python's row-major NumPy. `byrow = TRUE` switches to the more intuitive left-to-right fill.

```r title="Combine vectors with cbind and rbind"
# cbind() — each argument becomes a column
a <- c(1, 2, 3)
b <- c(10, 20, 30)
cbind(a, b)
#>      a  b
#> [1,] 1 10
#> [2,] 2 20
#> [3,] 3 30

# rbind() — each argument becomes a row
rbind(a, b)
#>   [,1] [,2] [,3]
#> a    1    2    3
#> b   10   20   30
```

`cbind` and `rbind` are best when you already have vectors and want to assemble them. `matrix()` is best when you have flat data and know the target shape.

[NOTE]
Row and column names are optional. Set them with `rownames(m)` and `colnames(m)`, or pass `dimnames = list(rnames, cnames)` to `matrix()`.

**Try it:** Create a 2x3 matrix `ex_m` from `c(10, 20, 30, 40, 50, 60)`, row-major. Give it rownames `"r1", "r2"` and colnames `"a", "b", "c"`.

```r title="Exercise: name matrix rows and columns"
# Your code here — build ex_m and set row/column names
```

<details>
<summary>Click to reveal solution</summary>

```r title="Named matrix solution"
ex_m <- matrix(c(10, 20, 30, 40, 50, 60), nrow = 2, byrow = TRUE)
rownames(ex_m) <- c("r1", "r2")
colnames(ex_m) <- c("a", "b", "c")
ex_m
#>     a  b  c
#> r1 10 20 30
#> r2 40 50 60
```

`byrow = TRUE` fills the values left-to-right, top-to-bottom, so `10, 20, 30` become the first row exactly as you read them. Without it, R would default to column-major order and put `10, 20` in column 1 instead, which is rarely what you want when transcribing tabular data by hand. Assigning to `rownames()` and `colnames()` after construction is equivalent to passing `dimnames = list(c("r1","r2"), c("a","b","c"))` to `matrix()`, use whichever reads more clearly in your code.
</details>

## How do you index a matrix by row, column, or both?

Matrix indexing uses `[row, col]`. Leave either blank to mean "all of them." The result is another matrix, unless you ask for a single row or column, in which case R drops it to a vector (you can prevent that with `drop = FALSE`).

```r title="Index a matrix by row and column"
m <- matrix(1:20, nrow = 4)
m
#>      [,1] [,2] [,3] [,4] [,5]
#> [1,]    1    5    9   13   17
#> [2,]    2    6   10   14   18
#> [3,]    3    7   11   15   19
#> [4,]    4    8   12   16   20

m[2, 3]          # single cell
m[1, ]           # whole first row
m[, 2]           # whole second column
m[1:2, 3:4]      # 2x2 block
#> [1] 10
#> [1]  1  5  9 13 17
#> [1] 5 6 7 8
#>      [,1] [,2]
#> [1,]    9   13
#> [2,]   10   14
```

That third call, `m[, 2]`, returned a plain vector, not a column matrix. If you're writing code that expects a matrix back, add `drop = FALSE`:

```r title="Preserve shape with drop = FALSE"
m[, 2, drop = FALSE]
#>      [,1]
#> [1,]    5
#> [2,]    6
#> [3,]    7
#> [4,]    8
```

Now you get a 4x1 matrix, preserving the 2D shape. This matters inside functions where downstream code assumes a matrix-typed argument.

You can also subset with logical vectors and negative indices, just like regular vectors:

```r title="Logical and negative index subsetting"
m[m[, 1] > 2, ]           # rows where column 1 > 2
m[, -c(2, 4)]             # all columns except 2 and 4
#>      [,1] [,2] [,3] [,4] [,5]
#> [1,]    3    7   11   15   19
#> [2,]    4    8   12   16   20
#>      [,1] [,2] [,3]
#> [1,]    1    9   17
#> [2,]    2   10   18
#> [3,]    3   11   19
#> [4,]    4   12   20
```

**Try it:** From `ex_m2 <- matrix(1:20, nrow = 4)`, extract the 2x2 block at rows 3-4, columns 4-5.

```r title="Exercise: extract a 2x2 block"
# Your code here — extract rows 3-4, cols 4-5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Block-extraction solution"
ex_m2 <- matrix(1:20, nrow = 4)
ex_block <- ex_m2[3:4, 4:5]
ex_block
#>      [,1] [,2]
#> [1,]   15   19
#> [2,]   16   20
```

`ex_m2[3:4, 4:5]` reads as "rows 3 and 4, columns 4 and 5", R's two-argument bracket syntax is position-based and sequences work naturally on both sides. The result is still a matrix (2×2) because you asked for more than one row *and* more than one column; R only auto-drops to a vector when one dimension collapses to length 1. If you'd written `ex_m2[3, 4:5]` you'd get a length-2 vector back; add `drop = FALSE` to keep it as a 1×2 matrix.
</details>

## Why is matrix multiplication written with %*% instead of *?

Because `*` does **elementwise** multiplication, not matrix multiplication. If you want the mathematical matrix product, row-dot-column, you need `%*%`. Mixing them up is one of the most common R bugs in linear algebra code.

```r title="Elementwise versus matrix multiplication"
A <- matrix(c(1, 2, 3, 4), nrow = 2)
B <- matrix(c(5, 6, 7, 8), nrow = 2)

# Elementwise — multiplies corresponding cells
A * B
#>      [,1] [,2]
#> [1,]    5   21
#> [2,]   12   32

# Matrix product — rows of A dotted with columns of B
A %*% B
#>      [,1] [,2]
#> [1,]   23   31
#> [2,]   34   46
```

Two different results, two different operations. The `*` operation requires the matrices to have the same shape; `%*%` requires the inner dimensions to match (if `A` is $m \times k$ and `B` is $k \times n$, the product is $m \times n$).

[WARNING]
If `%*%` says "non-conformable arguments," your inner dimensions don't match. Transpose one side with `t()` or rearrange the operands.

Other core linear algebra functions:

```r title="Transpose, determinant, and inverse"
A <- matrix(c(2, 1, 1, 3), nrow = 2)

t(A)              # transpose
det(A)            # determinant
solve(A)          # inverse (only for square, invertible matrices)
A %*% solve(A)    # should be identity
#>      [,1] [,2]
#> [1,]    2    1
#> [2,]    1    3
#> [1] 5
#>      [,1] [,2]
#> [1,]  0.6 -0.2
#> [2,] -0.2  0.4
#>      [,1] [,2]
#> [1,]    1    0
#> [2,]    0    1
```

`solve(A)` gives the inverse; `solve(A, b)` solves the linear system $Ax = b$ without forming the inverse explicitly (faster and more numerically stable).

**Try it:** Solve $Ax = b$ for $A = \begin{pmatrix}3 & 1\\1 & 2\end{pmatrix}$ and $b = \begin{pmatrix}9\\8\end{pmatrix}$ using `solve(A, b)`.

```r title="Exercise: solve a linear system"
# Your code here — solve Ax = b
```

<details>
<summary>Click to reveal solution</summary>

```r title="Linear-system solution"
ex_A <- matrix(c(3, 1, 1, 2), nrow = 2)
ex_b <- c(9, 8)
ex_x <- solve(ex_A, ex_b)
ex_x
#> [1] 2 3
ex_A %*% ex_x   # should recover ex_b
#>      [,1]
#> [1,]    9
#> [2,]    8
```

`solve(A, b)` returns the vector `x` that satisfies `A %*% x == b`, here that's `c(2, 3)`. Verifying with `A %*% ex_x` recovers the original `b`, which is always worth doing when you're double-checking a linear-algebra result. Note that `solve(A, b)` is both faster and more numerically stable than computing `solve(A) %*% b`, skip the explicit inverse whenever you can, especially for larger systems where round-off error accumulates.
</details>

## When should you reach for a matrix instead of a data frame?

Three situations where matrices are the clear choice:

**1. All-numeric tabular data used for math.** If you're computing correlations, covariances, PCA, or doing anything with `%*%`, use a matrix. Most statistical and ML functions in R convert data frames to matrices internally anyway, you save that cost by starting with one.

```r title="Matrix use case: covariance of mtcars"
# Covariance of mtcars — need a matrix
m <- as.matrix(mtcars)
cov(m[, c("mpg", "hp", "wt")])
#>            mpg         hp         wt
#> mpg  36.324103 -320.73206 -5.1166847
#> hp -320.732056 4700.86694 44.1926613
#> wt   -5.116685   44.19266  0.9573790
```

**2. Image and grid data.** A grayscale image is naturally a matrix, `image(m)` draws it. A heatmap is a matrix. An adjacency matrix in graph code is, obviously, a matrix.

**3. Memory-sensitive work on large homogeneous data.** A numeric matrix stores values contiguously in memory; a data frame stores each column separately with per-column overhead. For a million-row all-numeric table, the matrix version uses less memory and runs faster.

[KEY INSIGHT]
If you find yourself writing `as.matrix(df)` a lot, the data was probably a matrix to begin with. Starting with the right data structure saves conversions downstream.

## Practice Exercises

### Exercise 1: Build and inspect

Create a 4x3 matrix `M` filled row-major with values 1-12. Print its dimensions, row sums, and column means.

<details>
<summary>Show solution</summary>

```r title="Row-major fill with sums and means"
M <- matrix(1:12, nrow = 4, byrow = TRUE)
dim(M)
rowSums(M)
colMeans(M)
#> [1] 4 3
#> [1]  6 15 24 33
#> [1] 5.5 6.5 7.5
```

`rowSums`, `colSums`, `rowMeans`, and `colMeans` are vectorised and fast, use them instead of looping.
</details>

### Exercise 2: Scale a matrix

Standardize each column of `M` to have mean 0 and sd 1 using base `scale()`. Verify the result.

<details>
<summary>Show solution</summary>

```r title="Scale columns for preprocessing"
M <- matrix(1:12, nrow = 4, byrow = TRUE)
S <- scale(M)
S
colMeans(S)     # should all be ~0
apply(S, 2, sd) # should all be ~1
```

`scale()` centers (subtracts mean) and scales (divides by sd) each column. It's the standard preprocessing step before PCA or k-means.
</details>

### Exercise 3: Solve a linear system

For $A = \begin{pmatrix}2 & 1 & 0\\1 & 3 & 1\\0 & 1 & 2\end{pmatrix}$ and $b = (5, 10, 7)$, find `x` such that `A %*% x = b`.

<details>
<summary>Show solution</summary>

```r title="Three-equation linear system solution"
A <- matrix(c(2, 1, 0,
              1, 3, 1,
              0, 1, 2), nrow = 3, byrow = TRUE)
b <- c(5, 10, 7)

x <- solve(A, b)
x
A %*% x   # should equal b
#> [1] 1.4 2.2 2.4
#>      [,1]
#> [1,]    5
#> [2,]   10
#> [3,]    7
```
</details>

## Summary

| Task | Use |
|---|---|
| Mixed-type tabular data | `data.frame` |
| All-numeric table for math | `matrix` |
| Elementwise multiply | `A * B` |
| Matrix multiply | `A %*% B` |
| Transpose | `t(A)` |
| Inverse | `solve(A)` |
| Solve `Ax = b` | `solve(A, b)` |
| Row/column stats | `rowSums()`, `colMeans()`, `apply()` |
| Convert a data frame | `as.matrix(df)` |

Rules of thumb:

1. **Matrices are for math.** If you need `%*%`, transpose, or inverse, don't fight with a data frame.
2. **Watch column vs row fill order.** Default is column-major, use `byrow = TRUE` when reading row by row feels more natural.
3. **`drop = FALSE`** when you need to guarantee the result stays 2D.

## References

1. Wickham, H. *Advanced R*, 2nd ed., Vectors and attributes (matrices). <https://adv-r.hadley.nz/vectors-chap.html>
2. R Core Team. *An Introduction to R*, Arrays and matrices. <https://cran.r-project.org/doc/manuals/r-release/R-intro.html#Arrays-and-matrices>
3. R Documentation: `?matrix`, `?solve`, `?%*%`, `?apply`. Run in any R session.

## Continue Learning

- [R Data Frames](R-Data-Frames.html), the other 2D container, for mixed types.
- [R Vectors](R-Vectors.html), matrices are vectors with a `dim` attribute.
- [Write Better R Functions](R-Functions.html), write functions that accept both matrices and data frames gracefully.
