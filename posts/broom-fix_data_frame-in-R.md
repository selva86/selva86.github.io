---
title: "broom fix_data_frame() in R: Rownames to Term Column"
slug: "broom-fix_data_frame-in-R"
description: "Use broom::fix_data_frame() in R to convert a coefficient matrix into a tidy data frame, renaming the columns and lifting the rownames into a term column."
keywords: "broom fix_data_frame, fix_data_frame R, broom tidy matrix, rownames to column R, broom coefficient matrix, broom term column, R matrix to data frame"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "broom-functions"
fr_parent: "Linear-Regression.html"
auto_link_terms: "fix_data_frame()|broom fix_data_frame|broom::fix_data_frame()|rownames to term column|coefficient matrix to tibble"
auto_link_case_sensitive: true
target_keyword: "broom fix_data_frame"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# broom fix_data_frame() in R: Rownames to Term Column

<p class="lead">The <code>broom::fix_data_frame()</code> helper turns a matrix or data frame with informative rownames into a tidy tibble whose first column holds those names as values. It is the small but load-bearing utility that powers every <code>tidy.lm()</code>, <code>tidy.glm()</code>, and <code>tidy.htest()</code> method inside broom.</p>

[QUICK ANSWER]
fix_data_frame(coef(summary(fit)))                  # default term column
fix_data_frame(mat, newnames = c("est","se"))       # rename data columns
fix_data_frame(mat, newcol = "predictor")           # rename the term column
fix_data_frame(df_with_rownames)                    # data frame input works
tibble::rownames_to_column(df, var = "term")        # modern public replacement
as_tibble(mat, rownames = "term")                   # tibble-native one-liner
broom:::fix_data_frame(x)                           # access from broom 1.0+

[DECISION TREE: Is fix_data_frame() the right tool?]
- promote rownames into a term column on a matrix: fix_data_frame(mat)
- same job on a data frame, public API: tibble::rownames_to_column(df)
- coefficient table for a fitted model: broom::tidy(fit)
- one-row model summary: broom::glance(fit)
- per-observation predictions: broom::augment(fit, data)
- generic matrix to tibble: tibble::as_tibble(mat, rownames = "term")
- write your own tidier for a new model class: tidy_method = function(x) ...

## What fix_data_frame() does in one sentence

**fix_data_frame() takes any rectangular object with meaningful rownames and returns a tibble in which those rownames are an explicit first column.** R model objects expose their coefficients as a numeric matrix where each row name is a predictor (`(Intercept)`, `wt`, `cyl`). That layout is hostile to dplyr, ggplot2, and report tooling because rownames are a side channel, not a column.

The helper renames the data columns to broom's canonical names (`estimate`, `std.error`, `statistic`, `p.value`), prepends a `term` column built from the rownames, and drops the resulting tibble back as a data frame. Every method in broom that wraps a base-R model uses it to standardize output. As of broom 1.0+ the function lives in the package's internal namespace, so user code reaches it via `broom:::fix_data_frame()` or the public stand-ins shown below.

## Syntax

**fix_data_frame() has three arguments and zero hidden behavior.** The first is the matrix or data frame to convert, the second renames the data columns, and the third names the rownames column.

```r title="Load broom and inspect a coefficient matrix"
library(broom)
library(dplyr)
library(tibble)

fit <- lm(mpg ~ wt + cyl, data = mtcars)
mat <- coef(summary(fit))
class(mat)
#> [1] "matrix" "array"
rownames(mat)
#> [1] "(Intercept)" "wt"          "cyl"
```

The three arguments are:

- `x`: a matrix or data frame whose rownames carry information (required)
- `newnames`: a character vector of column names for the data columns; length must match `ncol(x)` (optional; default keeps existing colnames)
- `newcol`: a string naming the new column built from `rownames(x)`; default `"term"`

The return value is a tibble (an unclassed data frame in pre-1.0 broom) with `newcol` first, followed by the renamed data columns.

[NOTE]
**fix_data_frame() became internal in broom 1.0.0 (2020).** Before that it was exported and called directly by users. Today the function still ships with broom but lives in the private namespace, so user code that needs the exact behavior must use the `:::` operator or switch to `tibble::rownames_to_column()` and `tibble::as_tibble(..., rownames = "term")`.

## Common patterns

### 1. Convert a coefficient matrix to a tidy tibble

```r title="Promote rownames to a term column with default names"
broom:::fix_data_frame(mat)
#> # A tibble: 3 x 5
#>   term        estimate std.error statistic  p.value
#>   <chr>          <dbl>     <dbl>     <dbl>    <dbl>
#> 1 (Intercept)   39.7      1.71      23.1   3.04e-20
#> 2 wt            -3.19     0.757     -4.22  2.22e- 4
#> 3 cyl           -1.51     0.415     -3.64  1.06e- 3
```

The first column is term, lifted straight from the matrix rownames. The next four columns are broom canonical names because the helper recognized the four-column shape produced by the summary call and applied the default labels. From here, downstream verbs in dplyr, geoms in ggplot, and report tables in gt all consume the result without rownames gymnastics.

This is the entire reason broom uses fix_data_frame as a building block. Base R coefficient matrices store the predictor name as a rowname rather than a column, and every modern reporting tool assumes columns. Doing the lift in one tested helper rather than hand-rolling rownames extraction in every method keeps broom internally consistent.

### 2. Rename the data columns explicitly

```r title="Pass custom newnames to override the defaults"
broom:::fix_data_frame(
  mat,
  newnames = c("estimate", "std_err", "t_stat", "pvalue")
)
#> # A tibble: 3 x 5
#>   term        estimate std_err t_stat   pvalue
#>   <chr>          <dbl>   <dbl>  <dbl>    <dbl>
#> 1 (Intercept)   39.7    1.71   23.1   3.04e-20
#> 2 wt            -3.19   0.757  -4.22  2.22e- 4
#> 3 cyl           -1.51   0.415  -3.64  1.06e- 3
```

Use newnames when you want snake_case columns, or when the matrix has nonstandard headers that broom would otherwise leave untouched. The vector length must equal the number of data columns, and off-by-one errors abort with a clear length-mismatch message rather than producing a corrupted tibble. That strictness is a feature, not a bug, because silent column misalignment is the kind of error that survives review and shows up months later in a report.

### 3. Rename the term column

```r title="Use newcol to label the rowname column for a domain"
broom:::fix_data_frame(mat, newcol = "predictor")
#> # A tibble: 3 x 5
#>   predictor   estimate std.error statistic  p.value
#>   <chr>          <dbl>     <dbl>     <dbl>    <dbl>
#> 1 (Intercept)   39.7      1.71      23.1   3.04e-20
#> 2 wt            -3.19     0.757     -4.22  2.22e- 4
#> 3 cyl           -1.51     0.415     -3.64  1.06e- 3
```

Calling the column predictor, coefficient, or feature makes downstream code more readable in reports written for non-statisticians. The default term is what the broom tidy generic always emits, so keep that name if you plan to bind tibbles from many models into one long data frame later. A simple rule covers both cases: keep the default for any tibble that will be combined with broom output elsewhere, and override only at the last step that produces a finished report.

### 4. Data-frame input passes through untouched

```r title="Data frames keep their structure; only rownames move"
df <- data.frame(a = 1:3, b = 4:6, row.names = c("x", "y", "z"))
broom:::fix_data_frame(df)
#> # A tibble: 3 x 3
#>   term      a     b
#>   <chr> <int> <int>
#> 1 x         1     4
#> 2 y         2     5
#> 3 z         3     6
```

The helper does not require a matrix. When you hand it a data frame, it copies the columns verbatim and prepends the term column, which is useful for cleaning up the output of base aggregation and summary calls that emit data frames with informative rownames. This is especially handy when working with older packages that return tables with rownames containing group labels, factor levels, or time stamps; one helper covers all of them without custom extraction code.

## fix_data_frame() vs the modern alternatives

**The two replacements live in the tibble package and cover the same ground.** Choose based on whether you start with a matrix or a data frame.

| Goal                                | fix_data_frame()                | tibble alternative                          |
|-------------------------------------|---------------------------------|---------------------------------------------|
| Matrix to tibble with term column   | `broom:::fix_data_frame(mat)`   | `tibble::as_tibble(mat, rownames = "term")` |
| Data frame, move rownames to column | `broom:::fix_data_frame(df)`    | `tibble::rownames_to_column(df, "term")`    |
| Rename data columns at the same time| `newnames = c(...)`             | `as_tibble() |> rename(...)`                |
| Available without `:::`             | No, internal since broom 1.0    | Yes, exported tibble API                    |

```r title="Equivalent one-liners with public APIs"
as_tibble(mat, rownames = "term")
df |> rownames_to_column(var = "term") |> as_tibble()
```

For new code, prefer the tibble verbs since they ship as part of an exported public interface and survive broom version bumps without warnings. Reach for the broom helper only when reading or maintaining package code that already depends on it, or when writing a new tidier method that should match the broom internal style.

## Common pitfalls

[WARNING]
**Calling `broom::fix_data_frame()` without the triple colon fails on broom 1.0+.** The function is no longer exported, so the public form errors with `'fix_data_frame' is not an exported object from 'namespace:broom'`. Use `broom:::fix_data_frame()` for direct calls, or switch to `tibble::as_tibble(mat, rownames = "term")`.

A second trap: rownames silently collapse when a matrix has none. If `is.null(rownames(x))` is `TRUE`, the term column is filled with `NA`, which then breaks `bind_rows()` deduplication downstream. Always inspect `rownames(x)` before passing the matrix in.

The third trap is `newnames` length mismatch. The function does not recycle short vectors; a length-3 `newnames` against a four-column matrix aborts with a hard error. When you do not know `ncol(x)` ahead of time, build the vector with `paste0("col", seq_len(ncol(x)))`.

## Try it yourself

**Try it:** Fit `lm(mpg ~ hp + wt, data = mtcars)`, extract the coefficient matrix, and use `fix_data_frame()` to produce a tibble whose columns are `term`, `estimate`, `se`, `t`, and `p`.

```r title="Your turn: tidy a coefficient matrix"
# Try it: tidy the coefficient matrix
ex_fit <- lm(mpg ~ hp + wt, data = mtcars)
ex_mat <- # your code here
ex_tidy <- # your code here

ex_tidy
#> Expected: 3 rows, 5 columns starting with term
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_fit <- lm(mpg ~ hp + wt, data = mtcars)
ex_mat <- coef(summary(ex_fit))
ex_tidy <- broom:::fix_data_frame(
  ex_mat,
  newnames = c("estimate", "se", "t", "p")
)
ex_tidy
#> # A tibble: 3 x 5
#>   term        estimate     se     t        p
#>   <chr>          <dbl>  <dbl> <dbl>    <dbl>
#> 1 (Intercept)   37.2    1.60  23.3  2.57e-20
#> 2 hp            -0.0318 0.00903 -3.52 1.45e- 3
#> 3 wt            -3.88   0.633 -6.13 1.12e- 6
```

**Explanation:** `coef(summary(fit))` returns a 4-column numeric matrix with predictor rownames. `fix_data_frame()` moves those rownames into a `term` column and applies your `newnames` to the four data columns in order.

</details>

## Related broom functions

For day-to-day model output, the higher-level wrappers do more in one call:

- [tidy()](broom-tidy-survival-in-R.html): one row per term with `estimate`, `std.error`, `statistic`, `p.value`
- `glance()`: one-row model summary with R-squared, AIC, BIC, residual df
- `augment()`: per-observation fitted values, residuals, and influence diagnostics
- [tidy.kmeans()](broom-tidy-kmeans-in-R.html): cluster centers, sizes, withinss as a tibble
- [tidy.prcomp()](broom-tidy-prcomp-in-R.html): principal component loadings as a tibble

## FAQ

**Why was fix_data_frame() unexported?**

Broom 1.0 reorganized the package around the `tidy()`, `glance()`, and `augment()` generics. The maintainers moved low-level helpers into the internal namespace so the public API would be smaller and easier to document. `fix_data_frame()` still ships with broom and is called by dozens of internal methods; only direct user calls now need the `:::` operator.

**What is the difference between fix_data_frame() and tidy()?**

`tidy()` is a generic that dispatches on the class of its argument (`lm`, `glm`, `htest`, etc.) and applies a model-specific method. `fix_data_frame()` is one building block those methods reach for after they have already extracted the coefficient matrix. You almost never need `fix_data_frame()` directly when a tidier exists for your model.

**Does fix_data_frame() preserve matrix attributes?**

No. The helper coerces the input to a data frame, drops the `dim`, `dimnames`, and any custom attributes, and returns a fresh tibble. If you need to keep, say, a `units` attribute on a column, extract it first, run `fix_data_frame()`, then re-attach the attribute after the conversion.

**How do I write a new tidier that uses fix_data_frame() under the hood?**

Define a method like `tidy.myclass <- function(x, ...) broom:::fix_data_frame(my_coef_matrix(x), newnames = c("estimate", "std.error", "statistic", "p.value"))`. Register the method with `S3method(tidy, myclass)` in the package NAMESPACE. The convention is to expose the canonical four columns so downstream broom helpers and reporting code work without per-model branches.

**Can I use fix_data_frame() outside of broom?**

Yes, but the public alternatives are friendlier. `tibble::as_tibble(mat, rownames = "term")` covers the matrix case in one call, and `tibble::rownames_to_column(df, var = "term")` covers data frames. Both are exported, both survive package updates, and both are documented in the tibble reference.
