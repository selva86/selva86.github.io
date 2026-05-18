---
title: "caret findCorrelation() in R: Drop Collinear Predictors"
slug: "caret-findCorrelation-in-R"
description: "Use caret findCorrelation() in R to detect and drop highly correlated predictors before modeling. Covers the cutoff argument, names, and worked examples."
keywords: "caret findCorrelation, findCorrelation function R, caret findCorrelation example, R remove correlated variables, findCorrelation cutoff, remove highly correlated predictors R"
mathjax: false
webr: true
date: "2026-05-18"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "caret-functions"
fr_parent: "R-Tutorial.html"
auto_link_terms: "findCorrelation()|caret findCorrelation|caret::findCorrelation()|highly correlated predictors|remove correlated variables"
auto_link_case_sensitive: true
target_keyword: "caret findCorrelation"
sibling_block_enabled: true
difficulty: "Beginner"
---

# caret findCorrelation() in R: Drop Collinear Predictors

<p class="lead">caret <code>findCorrelation()</code> finds predictors that are highly correlated with each other and tells you which columns to drop. It scans a correlation matrix, finds every pair above a cutoff, and flags the more redundant member of each pair so you can remove collinearity before training a model.</p>

[QUICK ANSWER]
findCorrelation(cor(df))                    # indices to drop, cutoff 0.9
findCorrelation(cor(df), names = TRUE)      # column names instead
findCorrelation(cor(df), cutoff = 0.75)     # stricter: catch weaker pairs
df[, -findCorrelation(cor(df))]             # drop the flagged columns
findCorrelation(cor(df), verbose = TRUE)    # print the pairwise decisions
cor(df, use = "complete.obs")               # build the matrix, NA-safe
findCorrelation(cor(df), exact = TRUE)      # re-rank after each removal

[DECISION TREE: Is findCorrelation() the right tool?]
- drop highly correlated predictors: findCorrelation(cor(df))
- drop near-constant predictors: nearZeroVar(df, names = TRUE)
- drop exact linear combinations: findLinearCombos(df)
- compress correlated features into components: preProcess(df, method = "pca")
- rank predictors by model importance: varImp(model)
- center and scale before modeling: preProcess(df, method = "scale")

## What findCorrelation() does in one sentence

**`findCorrelation()` searches a correlation matrix for redundant predictors.** It looks at every pair of columns, finds the pairs whose absolute correlation exceeds a cutoff, and reports the column positions you should delete to break that redundancy.

The function does not touch your data frame. It takes a correlation matrix, usually the output of `cor()`, and returns a vector of column indices. When two predictors carry nearly the same information, a model gains nothing from keeping both. Worse, near-duplicate columns inflate variance in linear models and make coefficients unstable. `findCorrelation()` automates the cleanup that you would otherwise do by squinting at a correlation table, and it scales to data frames with hundreds of columns where manual inspection is hopeless.

## findCorrelation() syntax and arguments

**`findCorrelation()` needs a correlation matrix, not raw data.** Build the matrix with `cor()` first, then pass it in. Every other argument tunes how aggressive the filter is or changes the output shape.

```r title="Load caret and build correlated predictors"
library(caret)

set.seed(100)
n <- 200
sales   <- rnorm(n)
weather <- rnorm(n)
df <- data.frame(
  revenue_usd = sales * 1000 + 8000,
  revenue_eur = sales * 920 + 7400,      # revenue in another currency
  temp_c      = weather * 6 + 18,
  temp_f      = weather * 10.8 + 64,     # the same temperature in Fahrenheit
  staff_count = round(rnorm(n, 40, 8))
)
cor_mat <- cor(df)
round(cor_mat, 2)
#>             revenue_usd revenue_eur temp_c temp_f staff_count
#> revenue_usd        1.00        1.00  -0.04  -0.04        0.05
#> revenue_eur        1.00        1.00  -0.04  -0.04        0.05
#> temp_c            -0.04       -0.04   1.00   1.00       -0.09
#> temp_f            -0.04       -0.04   1.00   1.00       -0.09
#> staff_count        0.05        0.05  -0.09  -0.09        1.00
```

The arguments that matter most are:

- `x`: a correlation matrix, square and symmetric. Pass `cor(df)`, never the data frame.
- `cutoff`: the absolute correlation above which a pair counts as redundant. Defaults to `0.90`.
- `names`: if `TRUE`, return column names instead of column indices.
- `verbose`: if `TRUE`, print each pairwise comparison and which column was flagged.
- `exact`: if `TRUE`, recompute the average correlations after every removal. Defaults to `TRUE` when the matrix has fewer than 100 columns.

[NOTE]
**Coming from Python scikit-learn?** There is no single drop-in equivalent. You would compute `df.corr().abs()` and filter the upper triangle by hand, which is exactly the loop `findCorrelation()` wraps for you.

## findCorrelation() examples by use case

**Call `findCorrelation()` on the correlation matrix to get the columns to drop.** With the default cutoff of 0.90, only pairs above that threshold are flagged. Here both currency columns and both temperature columns are perfectly correlated, so one member of each pair is returned.

```r title="Find the predictors to remove"
findCorrelation(cor_mat, cutoff = 0.90)
#> [1] 4 2
```

The result `4 2` means columns `temp_f` and `revenue_eur` are the redundant ones. The function keeps the first column of each correlated pair and flags the later one.

**Add `names = TRUE` to get column names instead of positions.** Names are easier to read and safer to reuse, because they survive a column reorder that would break a position vector.

```r title="Return column names instead"
findCorrelation(cor_mat, cutoff = 0.90, names = TRUE)
#> [1] "temp_f"      "revenue_eur"
```

[KEY INSIGHT]
**Within a correlated pair, findCorrelation() drops the more redundant column.** It compares each column's mean absolute correlation with all other predictors and removes the one with the higher average. The survivor is the predictor that overlaps least with the rest of the data.

**Use the result to subset the data frame.** Negative indexing drops the flagged columns and keeps the informative ones.

```r title="Drop the redundant predictors"
to_drop <- findCorrelation(cor_mat, cutoff = 0.90)
clean   <- df[, -to_drop]
names(clean)
#> [1] "revenue_usd" "temp_c"      "staff_count"
```

**Lower the `cutoff` to catch weaker correlations.** A cutoff of 0.75 flags any pair above 0.75, so it removes more columns. Raising the cutoff toward 1 makes the filter conservative; a cutoff of exactly 1 flags nothing, since no pair can exceed it.

```r title="A strict cutoff flags nothing"
findCorrelation(cor_mat, cutoff = 1.0)
#> integer(0)
```

## findCorrelation() vs PCA and manual filtering

**`findCorrelation()` is one of three common ways to handle collinearity.** The right choice depends on whether you need interpretable columns, maximum variance retention, or only exact duplicates removed.

| Approach | What it does | Best for |
|---|---|---|
| `findCorrelation()` | Drops one column from each correlated pair | Keeping the data interpretable |
| `preProcess(method = "pca")` | Replaces predictors with components | Retaining variance, accepting opaque features |
| `findLinearCombos()` | Drops exact linear-combination columns | Perfect collinearity only |
| Manual `cor()` review | You inspect and choose by hand | Small data with domain knowledge |

Reach for `findCorrelation()` when you want a fast, reproducible filter that leaves the surviving columns named and meaningful. Reach for PCA when even moderate correlation hurts and you do not need to explain individual features. Use `findLinearCombos()` only for columns that are exact linear combinations, such as a set of one-hot dummies that sum to a constant.

The distinction matters once a model goes to production. PCA components are hard to monitor and explain to stakeholders, while a `findCorrelation()` result is just a shorter list of the original, named predictors.

## Common pitfalls

**Passing a data frame instead of a correlation matrix is the most common error.** `findCorrelation()` expects the square output of `cor()`. Hand it raw data and it fails, because a data frame is not symmetric. Always wrap the data in `cor()` first.

**`cor()` cannot handle non-numeric columns.** A factor or character column makes `cor()` fail. Select the numeric columns before building the matrix.

```r title="Build the matrix from numeric columns only"
mixed <- data.frame(
  x1  = rnorm(50),
  x2  = rnorm(50),
  grp = sample(c("a", "b"), 50, replace = TRUE)   # a character column
)

num_only <- mixed[, sapply(mixed, is.numeric)]
findCorrelation(cor(num_only), cutoff = 0.90)
#> integer(0)
```

[WARNING]
**Missing values silently break the matrix.** If any column has `NA`, `cor(df)` fills cells with `NA` and `findCorrelation()` errors out. Pass `use = "complete.obs"` or `use = "pairwise.complete.obs"` to `cor()` so the matrix is fully populated before you filter.

**`findCorrelation()` ranks by correlation, not by usefulness.** It drops the statistically redundant column, which is not always the one you want gone. If the dropped predictor is the cheaper one to measure or the more interpretable one, override the choice manually after reviewing the flagged list.

## Try it yourself

**Try it:** Build a data frame where one column is another column in different units, then use findCorrelation() to flag the redundant column name. Save the result to `ex_drop`.

```r title="Your turn: drop correlated predictors"
# Try it: flag the redundant column
set.seed(7)
ex_v <- rnorm(60)
ex_df <- data.frame(
  meters = ex_v * 3 + 10,
  feet   = ex_v * 9.84 + 33,   # meters converted to feet
  score  = rnorm(60, 50, 9)
)
ex_drop <- # your code here

ex_drop
#> Expected: "feet"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_drop <- findCorrelation(cor(ex_df), cutoff = 0.90, names = TRUE)
ex_drop
#> [1] "feet"
```

**Explanation:** `meters` and `feet` are the same measurement in different units, so their correlation is 1. findCorrelation() keeps the first column of the pair and flags the second, which is `feet`.

</details>

[TIP]
**Run findCorrelation() with `verbose = TRUE` while you are learning.** It prints each pair it compares and the average correlation it used to pick a loser, so you can see exactly why a column was dropped instead of trusting the index vector blindly.

## Related caret functions

These caret functions pair naturally with `findCorrelation()` when preparing predictors for a model:

- [nearZeroVar()](caret-nearZeroVar-in-R.html) drops near-constant predictors that barely vary.
- [findLinearCombos()](caret-findLinearCombos-in-R.html) drops columns that are exact linear combinations of others.
- [preProcess()](caret-preProcess-in-R.html) centers, scales, imputes, and can run PCA.
- [dummyVars()](caret-dummyVars-in-R.html) one-hot encodes categorical predictors.
- [train()](caret-train-in-R.html) fits and tunes a model on the cleaned data.

See the [caret pre-processing documentation](https://topepo.github.io/caret/pre-processing.html) for the full preprocessing toolkit.

## FAQ

**What does findCorrelation() do in caret?**

`findCorrelation()` scans a correlation matrix and identifies predictors that are highly correlated with one another. For each pair whose absolute correlation exceeds the cutoff, it flags the column with the larger mean absolute correlation across all predictors. It returns a vector of column indices, or names if `names = TRUE`, that you then drop from the data. The goal is to remove collinearity before fitting a model, which stabilizes coefficients and speeds up training.

**Does findCorrelation() take a data frame or a correlation matrix?**

It takes a correlation matrix, the square symmetric output of `cor()`. Passing a raw data frame fails because a data frame is not symmetric. The standard call is `findCorrelation(cor(df))`. If your data frame has missing values, compute the matrix with `cor(df, use = "complete.obs")` so no cell is `NA`, since `findCorrelation()` cannot process a matrix that contains `NA`.

**What cutoff should I use for findCorrelation()?**

The default cutoff is 0.90, which removes only strongly redundant pairs and is a safe starting point. Lower it toward 0.75 when even moderate correlation hurts your model, such as with linear regression where multicollinearity inflates standard errors. Raise it toward 0.95 when you want to keep as many predictors as possible and only delete near-duplicates. Tree-based models tolerate correlation well, so a higher cutoff is usually fine for them.

**How does findCorrelation() decide which column in a pair to drop?**

For every flagged pair, it computes each column's average absolute correlation with all other predictors. It removes the column with the higher average, on the logic that this column overlaps most with the rest of the data and is therefore the most redundant. With `exact = TRUE`, the averages are recomputed after each removal so the decisions stay accurate as the matrix shrinks.
</content>
</invoke>
