---
title: "caret findLinearCombos() in R: Detect Linear Dependencies"
slug: caret-findLinearCombos-in-R
description: "Use caret findLinearCombos() in R to detect and remove linearly dependent predictor columns. Covers QR-based detection, the dummy variable trap, and fixes."
keywords: "caret findLinearCombos, findLinearCombos function R, caret findLinearCombos examples, R remove linearly dependent columns, detect linear combinations R, findLinearCombos caret"
mathjax: false
webr: true
date: "2026-05-18"
post_type: PSEO
category_id: function-deep
subcategory_id: caret-functions
fr_parent: R-Tutorial.html
auto_link_terms: "findLinearCombos()|caret findLinearCombos|caret::findLinearCombos()|findLinearCombos|findLinearCombos function|linearly dependent columns"
auto_link_case_sensitive: true
target_keyword: "caret findLinearCombos"
sibling_block_enabled: true
difficulty: Beginner
---

# caret findLinearCombos() in R: Detect Linear Dependencies

<p class="lead">caret findLinearCombos() in R finds exact linear dependencies among predictor columns and tells you which ones to drop, so your model matrix is full rank before you fit a model.</p>

[QUICK ANSWER]
findLinearCombos(x)                  # x must be a numeric matrix
findLinearCombos(as.matrix(df))      # convert a data frame first
findLinearCombos(x)$remove           # column indices to drop
findLinearCombos(x)$linearCombos     # which columns form each dependency
x[, -findLinearCombos(x)$remove]     # drop the redundant columns
findLinearCombos(scale(x))           # works on standardized data too

[DECISION TREE: Is findLinearCombos() the right tool?]
- exact linear dependency among columns: findLinearCombos(x)
- high pairwise correlation only: findCorrelation(cor(x), 0.9)
- near-constant low-variance columns: nearZeroVar(x)
- center, scale or impute predictors: preProcess(x)
- build one-hot dummy columns: dummyVars(~ ., data = df)
- drop one column manually by name: x[, colnames(x) != "d"]

## What findLinearCombos() does in one sentence

**findLinearCombos() finds exact linear dependencies in a numeric matrix.** It runs a QR decomposition to measure the matrix rank, then enumerates every set of columns that can be written as a linear combination of the others. A linearly dependent column carries no new information, so it makes the matrix rank-deficient and can cause model fitting to fail or return `NA` coefficients.

The return value has two parts. `$linearCombos` is a list describing each dependency, and `$remove` is a vector of column indices you can drop to make the matrix full rank.

```r title="Load caret and build a matrix"
library(caret)

set.seed(1)
x <- matrix(rnorm(30), ncol = 3)
x <- cbind(x, x[, 1] + x[, 2])   # column 4 = column 1 + column 2
colnames(x) <- c("a", "b", "c", "d")
dim(x)
#> [1] 10  4
```

Column `d` is the sum of columns `a` and `b`, so the matrix has only three independent columns even though it has four.

## findLinearCombos() syntax and arguments

**findLinearCombos() takes a single argument.** You pass `x`, a numeric matrix, and the function returns a list. It does not accept a data frame directly, so convert one with `as.matrix()` or build a numeric design matrix with `model.matrix()` first.

```r title="The function signature"
findLinearCombos(x)
```

The return list always has the same two components.

| Component | Type | Meaning |
|---|---|---|
| `$linearCombos` | list of integer vectors | Each vector: the first index is the dependent column, the rest combine to produce it |
| `$remove` | integer vector or `NULL` | Column indices to drop so the matrix becomes full rank |

[NOTE]
**findLinearCombos() needs a numeric matrix.** A data frame with factor or character columns coerces to a character matrix and the QR step fails. Encode factors with `model.matrix()` before calling the function.

## findLinearCombos() examples by use case

### Detect and read the result

**Run findLinearCombos() on the matrix to see the dependency.** The output names both the redundant column and the columns it depends on.

```r title="Detect the linear combination"
findLinearCombos(x)
#> $linearCombos
#> $linearCombos[[1]]
#> [1] 4 1 2
#>
#>
#> $remove
#> [1] 4
```

The vector `4 1 2` reads as "column 4 is a linear combination of columns 1 and 2". The `$remove` slot recommends dropping column 4 to resolve it.

### Drop the recommended columns

**Use `$remove` to subset the matrix.** Negative indexing keeps every column except the redundant ones.

```r title="Drop the recommended columns"
combo <- findLinearCombos(x)
x_reduced <- x[, -combo$remove]
colnames(x_reduced)
#> [1] "a" "b" "c"
```

The reduced matrix has three independent columns and is now full rank.

### A full-rank matrix returns nothing

**A matrix with no dependencies returns empty results.** `$linearCombos` is an empty list and `$remove` is `NULL`.

```r title="A full-rank matrix returns nothing"
set.seed(2)
clean <- matrix(rnorm(40), ncol = 4)
findLinearCombos(clean)
#> $linearCombos
#> list()
#>
#> $remove
#> NULL
```

### Catch the dummy variable trap

**The most common real-world dependency is one-hot encoding plus an intercept.** When every factor level gets its own column, those columns sum to the intercept, producing an exact linear combination.

```r title="Catch the dummy variable trap"
df <- data.frame(grp = factor(c("x", "y", "z", "x", "y", "z", "x", "y")))
dummies <- model.matrix(~ grp - 1, df)   # one column per level
full <- cbind(intercept = 1, dummies)
findLinearCombos(full)
#> $linearCombos
#> $linearCombos[[1]]
#> [1] 4 1 2 3
#>
#>
#> $remove
#> [1] 4
```

[KEY INSIGHT]
**Full dummy encoding plus an intercept is always rank-deficient.** The level columns sum to 1, which equals the intercept. Drop one level (a reference category) or the intercept, and findLinearCombos() tells you exactly which column to cut.

## findLinearCombos() vs findCorrelation() and nearZeroVar()

**Three caret functions screen problematic predictors, but each targets a different problem.** `findLinearCombos()` catches exact rank deficiency, `findCorrelation()` catches strong pairwise correlation, and `nearZeroVar()` catches near-constant columns.

| Function | Targets | Detection method | Use when |
|---|---|---|---|
| `findLinearCombos()` | Exact linear dependencies | QR decomposition | Dummy traps, engineered sums, redundant ratios |
| `findCorrelation()` | High pairwise correlation | Correlation matrix | Two predictors nearly duplicate each other |
| `nearZeroVar()` | Near-constant columns | Variance and frequency ratio | A column has one dominant value |

The decision rule is simple. Run `findLinearCombos()` first to remove columns that break the math outright, then run `findCorrelation()` to thin out redundancy that only hurts stability.

[WARNING]
**findLinearCombos() does not detect approximate collinearity.** Two predictors correlated at 0.98 are not an exact linear combination, so the function ignores them. Pair it with `findCorrelation()` to handle near-redundant predictors.

## Common pitfalls

**Three mistakes account for most findLinearCombos() trouble.** Each has a quick fix.

First, passing a data frame with factors fails. The matrix coercion turns numbers into text, so encode factors numerically before the call.

```r title="Factor columns break the matrix"
df2 <- data.frame(a = rnorm(5), grp = factor(c("x", "y", "x", "y", "x")))
# findLinearCombos(as.matrix(df2))  # fails: matrix becomes character
m <- model.matrix(~ . - 1, df2)     # encode factors numerically first
findLinearCombos(m)
#> $linearCombos
#> list()
#>
#> $remove
#> NULL
```

Second, findLinearCombos() only reports. It never modifies your data, so you must subset with `$remove` yourself.

Third, an empty `$remove` is `NULL`, and `x[, -NULL]` silently drops every column. Always guard the subset.

```r title="Guard against an empty remove vector"
combo <- findLinearCombos(clean)   # clean is full rank
combo$remove
#> NULL
# clean[, -combo$remove] would drop EVERY column
safe <- if (length(combo$remove)) clean[, -combo$remove] else clean
dim(safe)
#> [1] 10  4
```

## Try it yourself

**Try it:** Build a matrix where column 3 equals column 1 minus column 2, then use findLinearCombos() to find which column to drop. Save the result to `ex_combo`.

```r title="Your turn: find the dependency"
set.seed(7)
ex_x <- matrix(rnorm(24), ncol = 3)
ex_x[, 3] <- ex_x[, 1] - ex_x[, 2]
ex_combo <- # your code here

ex_combo$remove
#> Expected: 3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_combo <- findLinearCombos(ex_x)
ex_combo$remove
#> [1] 3
```

**Explanation:** Column 3 is an exact linear combination of columns 1 and 2, so the QR step flags it as redundant and `$remove` returns its index, 3.

</details>

## Related caret functions

**findLinearCombos() is one step in caret's predictor-screening toolkit.** These functions handle the adjacent tasks.

- [findCorrelation()](caret-findCorrelation-in-R.html) flags highly correlated predictor pairs.
- [nearZeroVar()](caret-nearZeroVar-in-R.html) flags columns with almost no variance.
- [preProcess()](caret-preProcess-in-R.html) centers, scales, and imputes predictors.
- [dummyVars()](caret-dummyVars-in-R.html) builds one-hot encoded design matrices.
- [train()](caret-train-in-R.html) fits a model once the predictors are clean.

## FAQ

**What does findLinearCombos() return when there are no linear combinations?**

It returns a list where `$linearCombos` is an empty list (`list()`) and `$remove` is `NULL`. That means the matrix is already full rank and no columns need to be dropped. Always test `length(combo$remove)` before subsetting, because indexing with `-NULL` drops every column instead of none.

**Does findLinearCombos() detect correlated variables?**

No. It only detects exact linear dependencies, where one column equals a precise weighted sum of others. Two predictors correlated at 0.95 are not an exact combination, so findLinearCombos() ignores them. Use `findCorrelation()` on a correlation matrix to screen for strong but inexact relationships.

**Why does findLinearCombos() need a matrix instead of a data frame?**

The function relies on a QR decomposition, which operates on a purely numeric matrix. A data frame with factor or character columns coerces to a character matrix and the math fails. Convert numeric frames with `as.matrix()`, or build a design matrix with `model.matrix()` to encode factors first.

**How does findLinearCombos() decide which column to remove?**

It works through the dependencies and, for each one, marks a later column in the combination for removal. After flagging a column it rechecks the rank, so the final `$remove` vector is a minimal set that makes the whole matrix full rank.
