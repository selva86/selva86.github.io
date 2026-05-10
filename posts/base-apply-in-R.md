---
title: "apply() in R: Apply a Function Over Matrix Rows or Columns"
slug: "base-apply-in-R"
description: "Use base R apply() to run a function over rows (MARGIN=1) or columns (MARGIN=2) of a matrix or data frame. Covers MARGIN, simplification, and 5 examples."
keywords: "apply in R, R apply function rows, apply MARGIN, apply matrix R, apply vs sapply, R apply data frame, apply by column"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "base-r-essentials"
fr_parent: "Functional-Programming-in-R.html"
auto_link_terms: "apply()|base apply|apply over rows|apply over columns|R apply matrix"
auto_link_case_sensitive: true
target_keyword: "apply in R"
sibling_block_enabled: true
difficulty: "Beginner"
---

# apply() in R: Apply a Function Over Matrix Rows or Columns

<p class="lead">The <code>apply()</code> function in base R applies a function over rows (MARGIN = 1) or columns (MARGIN = 2) of a matrix or data frame. It is the matrix-specific cousin of <code>lapply</code> and <code>sapply</code>.</p>

[QUICK ANSWER]
apply(m, MARGIN = 1, FUN = sum)             # row sums
apply(m, MARGIN = 2, FUN = mean)            # column means
apply(m, 2, function(x) sum(is.na(x)))      # NA count per col
apply(m, 1, max)                            # max per row
apply(m, c(1,2), fn)                        # element-wise (rare)
rowSums(m); colSums(m)                      # faster for sum/mean
matrixStats::rowMaxs(m)                     # faster specialized

[DECISION TREE: Is apply() the right tool?]
- function over matrix rows: apply(m, 1, fn)
- function over matrix columns: apply(m, 2, fn)
- column means / sums: colMeans / colSums (faster)
- row means / sums: rowMeans / rowSums (faster)
- function over list / vector: lapply / sapply
- mixed-type data frame: lapply or sapply (apply may fail)
- N-dimensional array: apply(a, MARGIN = c(...), fn)

## What apply() does in one sentence

**`apply(X, MARGIN, FUN)` repeatedly calls `FUN` on each row (MARGIN = 1) or column (MARGIN = 2) of a matrix or 2D array, returning the results as a vector or matrix.** For data frames, apply implicitly converts to a matrix, which loses type information.

`apply()` is matrix-specific. For lists and vectors, use `lapply` or `sapply`. For column-wise transforms on data frames, prefer `dplyr::mutate(across(...))` or `lapply(df, fn)`.

## Syntax

**`apply(X, MARGIN, FUN, ...)`. MARGIN: 1 = rows, 2 = columns, c(1,2) = each cell.**

```r title="Build a matrix and apply functions"
m <- matrix(1:12, nrow = 3)
m
#>      [,1] [,2] [,3] [,4]
#> [1,]    1    4    7   10
#> [2,]    2    5    8   11
#> [3,]    3    6    9   12

apply(m, MARGIN = 1, sum)   # row sums
#> [1] 22 26 30

apply(m, MARGIN = 2, mean)  # column means
#> [1]  2  5  8 11
```

[TIP]
**For sum / mean by row or column, use `rowSums`, `colSums`, `rowMeans`, `colMeans` instead of `apply`.** They are faster and clearer. `apply(m, 2, sum)` and `colSums(m)` produce the same result; the latter is specialized C code.

## Five common patterns

### 1. Row sums, column sums

```r title="Most common apply uses"
apply(m, 1, sum)
#> [1] 22 26 30

apply(m, 2, sum)
#> [1]  6 15 24 33
```

For these specific cases, `rowSums(m)` and `colSums(m)` are the recommended fast alternatives.

### 2. Column-wise NA count

```r title="How many NAs per column?"
m_na <- matrix(c(1, NA, 3, NA, 5, 6), nrow = 2)
apply(m_na, 2, function(x) sum(is.na(x)))
#> [1] 1 1 0
```

`apply` with a custom function is the standard tool for arbitrary column-wise computations.

### 3. Max per row

```r title="Row-wise max"
apply(m, 1, max)
#> [1] 10 11 12
```

### 4. Element-wise transformation (MARGIN = c(1, 2))

```r title="Apply fn to each cell"
apply(m, c(1, 2), function(x) x^2)
#>      [,1] [,2] [,3] [,4]
#> [1,]    1   16   49  100
#> [2,]    4   25   64  121
#> [3,]    9   36   81  144
```

`MARGIN = c(1, 2)` calls fn on every element. Same as `m^2` for vectorized ops; only useful for non-vectorized functions.

### 5. apply on data frame (with caution)

```r title="apply silently converts df to matrix"
df <- data.frame(a = 1:3, b = c(10, 20, 30))
apply(df, 1, sum)
#> [1] 11 22 33
```

This works only because all columns are numeric. With a character column, `apply` converts everything to character, breaking the operation. For data frames, prefer `lapply(df, fn)` or `dplyr::summarise(across(...))`.

[KEY INSIGHT]
**`apply()` is for MATRICES; for DATA FRAMES, use `lapply()` or `purrr::map()`.** Data frames may have mixed column types. `apply()` silently converts everything to the most general type (usually character), which breaks numeric operations. The matrix-specific `apply` is only safe when all data are the same type.

## apply vs sapply vs lapply vs purrr::map

**Four R iteration functions, each tuned to a different input shape and output expectation.** Knowing which one to reach for is essentially a matter of "what shape is my input, and what shape do I want back?"

| Function | Input | Output | Best for |
|---|---|---|---|
| `apply()` | Matrix / 2D array | Vector or matrix | Row/column-wise on matrix |
| `sapply()` | List or vector | Vector or matrix | Quick interactive simplification |
| `lapply()` | List or vector | List | Type-predictable list output |
| `vapply()` | List or vector | Type-strict vector | Production code |
| `purrr::map_*()` | List or vector | Type-strict per variant | Tidyverse |

When to use which:

- Use `apply()` only on matrices and 2D numeric arrays.
- Use `lapply` / `sapply` / `vapply` for lists and vectors.
- Use `dplyr::mutate(across(...))` for data frame column transforms.

## Common pitfalls

**Pitfall 1: applying to a data frame with mixed types.** `apply(df, 2, mean)` errors if any column is character. `apply` silently coerces; the coercion changes the data.

**Pitfall 2: forgetting MARGIN.** `apply(m, sum)` (no MARGIN) errors. Always specify `MARGIN = 1` or `2`.

[WARNING]
**`apply()` is SLOWER than `rowSums()` / `colSums()` for sum / mean.** For large matrices, the specialized functions are 10x faster. Use them for performance-sensitive code.

## Try it yourself

**Try it:** Compute the standard deviation of each column in matrix `m` using `apply`. Save to `ex_sds`.

```r title="Your turn: column SDs"
m <- matrix(rnorm(20), nrow = 4)

ex_sds <- # your code here

ex_sds
#> Expected: 5 SDs (one per column)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_sds <- apply(m, 2, sd)
ex_sds
#> [1] (5 numbers, depends on random seed)
```

**Explanation:** `apply(m, 2, sd)` runs `sd()` on each of the 5 columns (MARGIN = 2 means columns). Each call returns one number; the result is a numeric vector of length 5.

</details>

## Related apply functions

After mastering apply, look at:

- `rowSums()`, `colSums()`, `rowMeans()`, `colMeans()`: fast specialized versions
- `lapply()`, `sapply()`, `vapply()`: for lists and vectors
- `mapply()`: multi-argument apply
- `purrr::map()` family: tidyverse alternatives
- `matrixStats` package: many specialized matrix operations

For data frame transforms, `dplyr::summarise(across(...))` and `dplyr::mutate(across(...))` are more idiomatic than apply.

## FAQ

**What does the MARGIN argument do in apply?**

`MARGIN = 1` applies the function to each ROW. `MARGIN = 2` applies to each COLUMN. `MARGIN = c(1, 2)` applies to each ELEMENT.

**What is the difference between apply and sapply in R?**

`apply()` works on matrices and 2D arrays, applying a function over rows or columns. `sapply()` works on lists and vectors, applying a function over elements. They serve different data shapes.

**Can I use apply on a data frame in R?**

Yes, but it converts the data frame to a matrix first. If your columns are all numeric, this works. If any column is character, all data become character. For mixed data frames, prefer `lapply(df, fn)` or `dplyr::summarise(across(...))`.

**How do I compute row means in R?**

Use `rowMeans(m)` for fast specialized computation. Or `apply(m, 1, mean)` for the general approach. For data frames with mixed types, `dplyr::rowwise() %>% mutate(rm = mean(c_across(everything())))`.

**Why is apply slow on large matrices?**

`apply()` is implemented in R, so it loops in interpreted code. For sum / mean / etc., specialized C-level functions like `rowSums` and `colMeans` are much faster. For other operations on large matrices, consider the `matrixStats` package.
