---
title: "var() in R: Sample Variance With NA and Covariance Handling"
slug: "base-var-in-R"
description: "Compute sample variance with base R var(). Covers the n-1 denominator, na.rm, covariance matrices, population variance, pitfalls, and 5 worked examples."
keywords: "var in R, R var function, base R var, sample variance in R, variance function R, var() with na.rm, population variance R"
mathjax: false
webr: true
date: "2026-05-23"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "base-r-essentials"
fr_parent: "Descriptive-Statistics-in-R.html"
auto_link_terms: "base var()|R var function|sample variance in R|var() with na.rm|var() covariance matrix"
auto_link_case_sensitive: true
target_keyword: "var in R"
sibling_block_enabled: true
difficulty: "Beginner"
---

# var() in R: Sample Variance With NA and Covariance Handling

<p class="lead">The <code>var()</code> function in base R computes the sample variance of a numeric vector using the unbiased <code>n-1</code> denominator. Pass <code>na.rm = TRUE</code> to ignore missing values, supply a second vector for covariance, or pass a matrix to get a full covariance matrix.</p>

[QUICK ANSWER]
var(x)                               # sample variance of a vector
var(x, na.rm = TRUE)                 # ignore NA values
var(x) * (length(x) - 1) / length(x) # population variance (n denominator)
var(x, y)                            # covariance between two vectors
var(mtcars)                          # covariance matrix of a data frame
sqrt(var(x))                         # standard deviation (same as sd(x))
diag(var(mtcars))                    # per-column variances from a frame

[DECISION TREE: Is var() the right tool?]
- sample variance of one numeric vector: var(x)
- variance ignoring missing values: var(x, na.rm = TRUE)
- population variance (n denominator): var(x) * (n - 1) / n
- standard deviation instead of variance: sd(x)
- covariance between two vectors: cov(x, y) or var(x, y)
- correlation, not covariance: cor(x, y)
- per-column variances of a data frame: sapply(df, var)

## What var() does in one sentence

**var() returns the sum of squared deviations from the mean divided by n-1 as a single numeric value.** It accepts numeric, integer, and logical vectors (where `TRUE = 1`). For matrices and data frames, it returns the full sample covariance matrix instead of a single number.

The `n-1` denominator (Bessel's correction) makes the estimate unbiased when `x` is a sample drawn from a larger population. R uses sample variance by default; population variance requires a manual adjustment.

## Syntax

**`var(x, y = NULL, na.rm = FALSE, use)` takes a vector or matrix plus optional second vector and missing-value controls.** When `y` is supplied, the function returns covariance; when `x` is a matrix or data frame, it returns a covariance matrix.

```r title="Variance of a numeric vector"
x <- c(2, 4, 6, 8, 10)
var(x)
#> [1] 10
```

The four arguments:

- `x`: numeric vector, matrix, or data frame
- `y`: optional second numeric vector for covariance; default `NULL`
- `na.rm`: if `TRUE`, drop `NA` before computing; default `FALSE`
- `use`: how to handle `NA` in matrix input; one of `"everything"`, `"all.obs"`, `"complete.obs"`, `"na.or.complete"`, `"pairwise.complete.obs"`

[TIP]
**Always set `na.rm = TRUE` for real-world data.** With the default `na.rm = FALSE`, a single `NA` makes the entire result `NA`. This is the most common reason a variance summary silently returns `NA` and breaks downstream reporting.

## Five common patterns

### 1. Plain sample variance

```r title="Variance of a small vector"
var(c(1, 2, 3, 4, 5))
#> [1] 2.5
```

The mean is 3, the squared deviations are `(1-3)^2, (2-3)^2, ..., (5-3)^2 = 4, 1, 0, 1, 4`. Their sum is 10, divided by `n-1 = 4` gives 2.5.

### 2. Ignore missing values

```r title="Drop NA before computing variance"
x <- c(10, 20, NA, 30, 40)
var(x)
#> [1] NA

var(x, na.rm = TRUE)
#> [1] 166.6667
```

Without `na.rm = TRUE`, any `NA` poisons the result. With it, the function drops `NA` and computes variance from the remaining four values.

### 3. Population variance instead of sample variance

```r title="Adjust from sample to population variance"
x <- c(2, 4, 6, 8, 10)
n <- length(x)

var(x)                        # sample variance (n - 1 denominator)
#> [1] 10

var(x) * (n - 1) / n          # population variance (n denominator)
#> [1] 8
```

R has no built-in population variance function. Multiply the sample variance by `(n - 1) / n` whenever your data represents the entire population, not a sample drawn from one.

### 4. Covariance between two vectors

```r title="Variance with a second vector returns covariance"
var(mtcars$mpg, mtcars$hp)
#> [1] -320.7321

cov(mtcars$mpg, mtcars$hp)
#> [1] -320.7321
```

When you pass a second vector, `var()` returns the sample covariance between the two. This is identical to `cov(x, y)` and measures how the two variables move together. The negative value confirms that higher horsepower goes with lower miles per gallon in `mtcars`.

### 5. Covariance matrix of a data frame

```r title="Variance of a data frame returns a covariance matrix"
var(mtcars[, c("mpg", "hp", "wt")])
#>             mpg         hp         wt
#> mpg   36.324103  -320.7321  -5.116685
#> hp  -320.732056  4700.8669  44.192661
#> wt    -5.116685    44.1927   0.957379
```

For a matrix or data frame, `var()` returns a full covariance matrix: variances on the diagonal, pairwise covariances off-diagonal. To get just the per-column variances, use `diag(var(df))` or `sapply(df, var)`.

[KEY INSIGHT]
**`var()` is one function with two outputs depending on input shape.** A vector gives a single number (sample variance); a matrix or pair of vectors gives a covariance object. That overloaded behaviour is why `var(mtcars)` does not return a per-column summary, and why beginners often expect a vector and get a matrix.

## var vs sd vs cov vs population variance

**Pick the spread function that matches your need.** The table compares `var()`, `sd()`, `cov()`, and the manual population variance.

| Function | What it computes | When to use |
|---|---|---|
| `var(x)` | Sample variance (n-1 denominator) | Default for samples drawn from a population |
| `sd(x)` | Sample standard deviation, `sqrt(var(x))` | Spread in the same units as the data |
| `cov(x, y)` | Covariance between two vectors | How two variables move together |
| `var(x) * (n-1) / n` | Population variance (n denominator) | When `x` is the entire population, not a sample |
| `sapply(df, var)` | Per-column variances of a data frame | Vector of variances, not a covariance matrix |

Sample variance is the right default for almost every applied analysis. Switch to population variance only when you genuinely have the full population (not a sample of it). Use `sd()` when you want a spread measure on the original scale.

## Common pitfalls

**Pitfall 1: `var()` returns `NA` when any element is `NA`.** Always set `na.rm = TRUE` for real-world data. If you forget, summaries silently propagate `NA` and break tables and plots downstream.

**Pitfall 2: `var()` uses the n-1 denominator, not n.** R reports the unbiased sample estimate. If your textbook formula has `n` in the denominator, you are computing population variance; multiply the R result by `(n - 1) / n`.

**Pitfall 3: `var(df)` returns a covariance matrix, not column-wise variances.** To get a vector of per-column variances, use `sapply(df, var)` or `diag(var(df))`. Beginners often pass a data frame expecting a per-column summary and get a square matrix instead.

**Pitfall 4: `var()` of a single value returns `NA`.** With one observation, `n - 1 = 0` and the division is undefined. Check `length(x) > 1` before computing if your data may shrink to a single row after filtering.

[WARNING]
**Never confuse `var()` with population variance in statistical homework.** The `n-1` denominator is correct for inference from a sample, but most introductory formulas write variance with `n` in the denominator. Multiply by `(n - 1) / n` to convert, or use `mean((x - mean(x))^2)` to compute population variance directly without the correction.

## Try it yourself

**Try it:** Compute the sample variance of `mtcars$mpg` for cars with exactly 6 cylinders, ignoring any missing values. Save the result to `ex_var_6cyl`.

```r title="Your turn: conditional variance"
ex_var_6cyl <- # your code here

ex_var_6cyl
#> Expected: about 2.11
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_var_6cyl <- var(mtcars$mpg[mtcars$cyl == 6], na.rm = TRUE)
ex_var_6cyl
#> [1] 2.109286
```

**Explanation:** The subset `mtcars$mpg[mtcars$cyl == 6]` keeps mpg values only where cylinder count is 6. Passing the filtered vector to `var()` with `na.rm = TRUE` returns the sample variance of that subgroup. The same logical-subset pattern powers most "variance of a subgroup" questions in base R.

</details>

## Related base R spread functions

After mastering `var()`, look at:

- `sd()`: sample standard deviation, the square root of `var()`
- `cov()` and `cor()`: covariance and correlation between two vectors
- `range()`, `IQR()`, `mad()`: alternative spread measures
- `summary()`: five-number summary plus mean in one call
- `apply(m, 2, var)`: per-column variances of a matrix
- `aggregate()` and `dplyr::summarise()`: group-wise variances

For a full breakdown of spread, central tendency, and shape measures, see the descriptive statistics in R guide. The official base R documentation lives at the [R stats package reference](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/cor.html).

## FAQ

**How do I compute variance in R while ignoring missing values?**

Pass `na.rm = TRUE`: `var(x, na.rm = TRUE)`. By default, `var()` returns `NA` if any element of `x` is `NA`, which silently propagates into downstream summaries. Always set `na.rm = TRUE` when working with real-world data, or impute missing values first using a domain-appropriate rule before computing the variance.

**What is the difference between var() and sd() in R?**

`var()` returns the sample variance (average squared deviation from the mean, with n-1 denominator); `sd()` returns the sample standard deviation, which is the square root of the variance. They measure the same spread, but `sd()` is in the same units as the original data while `var()` is in squared units. Use `sd()` for reporting, `var()` when you need the squared quantity for downstream formulas.

**Does var() in R use the n or n-1 denominator?**

R's `var()` always uses `n - 1` (Bessel's correction), giving the unbiased sample variance estimator. For population variance with the `n` denominator, multiply by `(n - 1) / n`, or compute `mean((x - mean(x))^2)` directly. The choice matters most in small samples where the difference between dividing by `n` and `n-1` is meaningful.

**Why does var() return a matrix when I pass a data frame?**

Because `var()` is overloaded: a vector input returns a scalar variance, a matrix or data frame input returns a full sample covariance matrix with variances on the diagonal and pairwise covariances off-diagonal. To get a simple vector of per-column variances, use `sapply(df, var)` or `diag(var(df))` to extract the diagonal of the covariance matrix.

**How do I compute the variance of every column in a data frame?**

Use `sapply(df, var)` for a named numeric vector of per-column variances. For numeric-only frames you can also extract the diagonal of the covariance matrix with `diag(var(df))`. The tidyverse equivalent is `dplyr::summarise(across(where(is.numeric), var, na.rm = TRUE))` for a one-line column-wise variance with NA handling.
