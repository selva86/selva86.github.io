---
title: "broom tidy() for prcomp in R: PCA Loadings and Scores"
slug: "broom-tidy-prcomp-in-R"
description: "Tidy prcomp PCA output in R with broom::tidy(). Extract loadings, scores, and variance per PC as tidy tibbles ready for dplyr piping and ggplot2 plots."
keywords: "broom tidy prcomp, tidy prcomp R, broom PCA R, tidy PCA output, prcomp loadings tidy, tidy.prcomp, broom principal components"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "broom-functions"
fr_parent: "PCA-in-R.html"
auto_link_terms: "broom::tidy()|broom tidy|tidy prcomp|tidy.prcomp|PCA loadings|principal component scores"
auto_link_case_sensitive: true
target_keyword: "broom tidy prcomp"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# broom tidy() for prcomp in R: PCA Loadings and Scores

<p class="lead">The <code>broom::tidy()</code> function turns a <code>prcomp</code> object into a long-format tibble of loadings, scores, or variance-explained per principal component. It is the fastest way to pipe PCA results into <code>dplyr</code> and <code>ggplot2</code> without reaching into the fitted list.</p>

[QUICK ANSWER]
tidy(pc)                                # loadings: variable, PC, value (default)
tidy(pc, matrix = "v")                  # same as default; "v" or "rotation"
tidy(pc, matrix = "u")                  # scores: row, PC, value
tidy(pc, matrix = "d")                  # variance per PC: std.dev, percent, cumulative
glance(pc)                              # one row: total variance and rank
augment(pc, data = iris[, 1:4])         # append .fittedPC1..k to rows
tidy(pc, matrix = "d") |> filter(percent > 0.05)    # keep PCs above 5% variance

[DECISION TREE: Is tidy() the right tool for a prcomp fit?]
- long table of loadings per variable and PC: tidy(pc, matrix = "v")
- long table of PC scores per observation: tidy(pc, matrix = "u")
- variance and cumulative percent per PC: tidy(pc, matrix = "d")
- attach .fittedPC columns to the data: augment(pc, data = df)
- 2D ordination plot with ellipses: factoextra::fviz_pca_ind(pc)
- variable contribution bar chart: factoextra::fviz_contrib(pc, "var")
- robust PCA on data with outliers: pcaPP::PCAproj(df)

## What tidy() does for prcomp in one sentence

**The tidier reshapes prcomp's matrix output into a long tibble keyed by component.** A fitted prcomp object is an S3 list with separate matrix slots for the rotation (loadings), the principal component scores, and the standard deviations per PC. The tidier reshapes one slot into a long data frame so dplyr verbs and ggplot geoms work without manual matrix wrangling.

The `matrix` argument picks the slot. The default returns loadings; pass `"u"` for scores or `"d"` for the variance summary.

## Syntax

**`tidy.prcomp()` is the S3 method broom dispatches when you call `tidy()` on a prcomp fit.** Two arguments matter: the fitted object and the `matrix` shortcut that selects which slot to tidy.

```r title="Load packages and fit prcomp on iris"
library(broom)
library(dplyr)
library(ggplot2)

iris_x <- iris[, 1:4]
pc <- prcomp(iris_x, center = TRUE, scale. = TRUE)
class(pc)
#> [1] "prcomp"
```

The two arguments worth knowing:

- `x`: the fitted `prcomp` object (required)
- `matrix`: one of `"v"` / `"rotation"` / `"variables"` (loadings, default), `"u"` / `"x"` / `"samples"` / `"scores"` (PC scores), or `"d"` / `"pcs"` / `"eigenvalues"` (variance per PC)

The aliases exist for backward compatibility. Pick the one that reads best in your code.

[TIP]
**Always pass `scale. = TRUE` to `prcomp()` when variables are measured on different scales.** Without scaling, the variable with the largest variance dominates the loadings and the tidy output is misleading. Centering alone (`center = TRUE`) is not enough.

## Common patterns

### 1. Tidy the loadings (matrix = "v")

```r title="Tidy loadings: variable contributions per PC"
tidy(pc, matrix = "v")
#> # A tibble: 16 x 3
#>    column          PC   value
#>    <chr>        <dbl>   <dbl>
#>  1 Sepal.Length     1  0.521
#>  2 Sepal.Length     2 -0.377
#>  3 Sepal.Length     3  0.720
#>  4 Sepal.Length     4  0.261
#>  5 Sepal.Width      1 -0.269
#>  6 Sepal.Width      2 -0.923
#>  7 Sepal.Width      3 -0.244
#>  8 Sepal.Width      4 -0.124
#>  9 Petal.Length     1  0.580
#> 10 Petal.Length     2 -0.0245
#> 11 Petal.Length     3 -0.142
#> 12 Petal.Length     4 -0.801
#> 13 Petal.Width      1  0.565
#> 14 Petal.Width      2 -0.0669
#> 15 Petal.Width      3 -0.634
#> 16 Petal.Width      4  0.524
```

Each row is one (variable, PC) pair. `value` is the rotation weight, a number between -1 and 1 indicating how strongly that variable loads onto that component. For the iris fit, PC1 has positive loadings on three of the four variables, meaning it picks up overall flower size. PC2 is dominated by Sepal.Width with the opposite sign, separating wide-sepal narrow-flower observations.

The long format pays off immediately. To rank variables by their absolute contribution to PC1, run `tidy(pc, matrix = "v") |> filter(PC == 1) |> arrange(desc(abs(value)))`, then take the top three rows. The same one-liner is the foundation for variable-importance reporting in unsupervised pipelines.

### 2. Tidy the scores (matrix = "u")

```r title="Tidy scores: one row per observation per PC"
tidy(pc, matrix = "u")
#> # A tibble: 600 x 3
#>      row    PC    value
#>    <int> <dbl>    <dbl>
#>  1     1     1 -2.26
#>  2     1     2 -0.478
#>  3     1     3  0.127
#>  4     1     4  0.0241
#>  5     2     1 -2.07
#>  6     2     2  0.672
#>  7     2     3  0.234
#>  8     2     4  0.103
#>  9     3     1 -2.36
#> 10     3     2  0.341
#> # i 590 more rows
```

Each row is one (observation, PC) pair. The `row` index lines up with the row number of the data you passed to `prcomp()`, so you can left-join back to the original `iris` frame on `row`. For a scatter plot of PC1 versus PC2, pivot wide on `PC` first, or use `augment()` (next section) to skip the reshape. The long shape is also right when you want facets across all PCs in a single ggplot call.

### 3. Tidy the variance summary (matrix = "d")

```r title="Tidy variance: std.dev, percent, cumulative per PC"
tidy(pc, matrix = "d")
#> # A tibble: 4 x 4
#>      PC std.dev percent cumulative
#>   <dbl>   <dbl>   <dbl>      <dbl>
#> 1     1   1.71   0.730       0.730
#> 2     2   0.956  0.229       0.958
#> 3     3   0.383  0.0367      0.995
#> 4     4   0.144  0.00518     1
```

This is the scree-plot source. `percent` is the fraction of total variance explained by each PC, and `cumulative` is the running sum. For iris, PC1 alone captures 73 percent of the variance and the first two PCs together hit 96 percent, so a 2D plot of the first two scores carries almost all the signal. Filter on `cumulative` to pick the smallest PC subset that retains 95 percent of variance, which is the standard cutoff for dimension reduction before downstream modeling.

The `std.dev` column equals the square root of the eigenvalue of each PC, so squaring it gives the raw eigenvalue if you ever need the Kaiser criterion (drop PCs with eigenvalue below 1 on scaled data).

### 4. Attach scores to the data with augment()

```r title="Augment to add .fittedPC columns to iris"
aug <- augment(pc, data = iris)
head(aug, 3)
#> # A tibble: 3 x 10
#>   .rownames Sepal.Length Sepal.Width Petal.Length Petal.Width Species
#>   <chr>            <dbl>       <dbl>        <dbl>       <dbl> <fct>
#> 1 1                  5.1         3.5          1.4         0.2 setosa
#> 2 2                  4.9         3            1.4         0.2 setosa
#> 3 3                  4.7         3.2          1.3         0.2 setosa
#> # i 4 more variables: .fittedPC1 <dbl>, .fittedPC2 <dbl>, .fittedPC3 <dbl>,
#> #   .fittedPC4 <dbl>
```

`augment()` returns the original frame with `.fittedPC1`, `.fittedPC2`, and so on appended. This is the shortcut for the common case: a wide score table joined to grouping columns, ready to feed into `ggplot(aug, aes(.fittedPC1, .fittedPC2, color = Species))`. Pass the full data frame (not just the numeric columns) to keep grouping variables for faceting.

[KEY INSIGHT]
**The three matrices answer three different questions.** Loadings (`"v"`) tell you what each PC means in terms of the original variables. Scores (`"u"`) tell you where each observation sits in PC space. Variance (`"d"`) tells you how many PCs you actually need. Choosing the right matrix is the whole skill; the tidy output is the same shape regardless of which one you pick.

## tidy.prcomp() vs str(pc) and factoextra

**Three tools cover the same job from different angles.** Pick by what you do next with the output.

| Tool | Output type | Best for |
|---|---|---|
| `str(pc)` | nested list summary | Quick console inspection |
| `broom::tidy(pc, matrix = ...)` | long tibble | dplyr piping, ggplot, joins |
| `factoextra::fviz_pca_biplot(pc)` | ggplot object | Publication-ready biplot |

Use `tidy()` whenever the next step is code: filtering loadings, joining scores to grouping variables, building a custom scree plot. Use `factoextra` for the final figure; it does not return a tibble.

## Common pitfalls

**Pitfall 1: forgetting to scale before tidying.** Without `scale. = TRUE`, the loadings tibble reports raw covariance directions, not correlation directions. The variable with the largest unit hijacks PC1 even when its standardized variance is small.

```r title="Wrong: tidy without scaling"
pc_raw <- prcomp(iris_x)  # no scale.
tidy(pc_raw, matrix = "v") |> filter(PC == 1)
#> # A tibble: 4 x 3
#>   column          PC  value
#>   <chr>        <dbl>  <dbl>
#> 1 Sepal.Length     1  0.361
#> 2 Sepal.Width      1 -0.0857
#> 3 Petal.Length     1  0.857
#> 4 Petal.Width      1  0.358
```

Petal.Length appears to dominate PC1 only because its raw variance is larger. The scaled fit above split the loading evenly across the three correlated size variables, which is the correct read.

**Pitfall 2: confusing `matrix` aliases.** `tidy(pc, matrix = "scores")`, `matrix = "u"`, and `matrix = "x"` all return scores. The slot names in `pc` itself use a different convention (`pc$x` for scores, `pc$rotation` for loadings). Pick one alias and use it consistently.

[WARNING]
**`glance(pc)` returns only two columns and does not include `tot.var`.** Unlike `glance.kmeans` or `glance.lm`, the prcomp glance method is minimal: `r` (rank of the fit) and `var.explained` is NOT returned. For variance summary use `tidy(pc, matrix = "d")`, not `glance(pc)`.

**Pitfall 3: passing a princomp fit by mistake.** Base R has both `prcomp()` (SVD-based) and `princomp()` (eigendecomposition, legacy). `tidy()` covers both, but column conventions differ. Stick with `prcomp()` for consistent broom output.

## Try it yourself

**Try it:** Fit `prcomp()` on the four numeric columns of `iris` with scaling, then use `tidy()` to get the variance summary. Filter to the smallest set of PCs that together explain at least 95 percent of variance. Save the result to `ex_var`.

```r title="Your turn: variance summary and 95-percent filter"
# Try it: tidy variance and keep PCs up to 95% cumulative
ex_var <- # your code here

ex_var
#> Expected: 2 rows; the second has cumulative >= 0.95
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_pc <- prcomp(iris[, 1:4], center = TRUE, scale. = TRUE)
ex_var <- tidy(ex_pc, matrix = "d") |> filter(cumulative <= 0.95 | lag(cumulative, default = 0) < 0.95)
ex_var
#> # A tibble: 2 x 4
#>      PC std.dev percent cumulative
#>   <dbl>   <dbl>   <dbl>      <dbl>
#> 1     1   1.71    0.730      0.730
#> 2     2   0.956   0.229      0.958
```

**Explanation:** The `lag()` trick keeps the first PC that crosses the 95 percent threshold so the cumulative total actually reaches the target. A naive `filter(cumulative <= 0.95)` would drop PC2 because its cumulative is already 0.958, leaving you below the goal.

</details>

## Related broom functions for PCA

After mastering `tidy()` for prcomp, look at:

- `augment.prcomp()`: original data with `.fittedPC1`, `.fittedPC2`, and more appended as columns
- `glance.prcomp()`: one row with the rank of the decomposition
- `tidy.princomp()`: same idea for `princomp()` fits (legacy eigendecomposition)
- `factoextra::fviz_pca_var()`: ggplot variable-loadings plot built on broom output
- `factoextra::fviz_eig()`: scree plot wrapper that consumes the same variance tibble

For a quick loadings heatmap, pipe the `matrix = "v"` output into `ggplot2::geom_tile()`. See the official [broom reference for prcomp tidiers](https://broom.tidymodels.org/reference/prcomp_tidiers.html) for the full column dictionary per matrix option.

## FAQ

**How do I get PCA loadings as a data frame in R?**

Call `broom::tidy(pc, matrix = "v")` on a fitted `prcomp` object. Each row is one (variable, PC) pair with the rotation weight in the `value` column. This is the long-format equivalent of `pc$rotation`, which is a matrix. Use the long form for ggplot or dplyr; pivot wide with `tidyr::pivot_wider(names_from = PC)` if you need the classic loadings matrix back.

**What is the difference between matrix = "u", "v", and "d" in tidy.prcomp?**

`matrix = "v"` returns the loadings (default). `matrix = "u"` returns the principal component scores, one row per observation per PC. `matrix = "d"` returns the variance summary per PC. The letters come from the SVD `X = U D V'`, which is how `prcomp()` computes the PCA internally.

**Can tidy() build a scree plot directly?**

Not directly, but the data is one pipe away. Run `tidy(pc, matrix = "d") |> ggplot(aes(PC, percent)) + geom_col()` for a percent-variance scree plot. Swap `percent` for `cumulative` for the cumulative version, or use `factoextra::fviz_eig(pc)` for a publication-ready figure with reference lines.

**Does tidy work with prcomp on tibbles?**

Yes. `prcomp()` accepts both data frames and tibbles, and the broom method handles both identically. The output is always a tibble regardless of input class. Pass the original tibble to `augment()` to keep grouping columns.

**Why does augment() return more rows than I expected?**

It does not; `augment()` returns exactly as many rows as the data you pass. If you see more rows, check whether you accidentally passed `tidy(pc, matrix = "u")` (rows = observations x PCs) into a downstream step expecting one row per observation. The augmented output preserves your input row count.
