---
title: "caret dummyVars() in R: One-Hot Encode Categorical Data"
slug: "caret-dummyVars-in-R"
description: "Learn caret dummyVars() in R to one-hot encode categorical predictors. Covers syntax, fullRank, applying the encoder to new data, and common pitfalls."
keywords: "caret dummyVars, dummyVars function R, caret dummyVars examples, R one-hot encoding, dummyVars predict, dummyVars fullRank, one-hot encode in R"
mathjax: false
webr: true
date: "2026-05-18"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "caret-functions"
fr_parent: "R-Tutorial.html"
auto_link_terms: "dummyVars()|caret dummyVars|caret::dummyVars()|one-hot encoding|one-hot encode"
auto_link_case_sensitive: true
target_keyword: "caret dummyVars"
sibling_block_enabled: true
difficulty: "Beginner"
---

# caret dummyVars() in R: One-Hot Encode Categorical Data

<p class="lead">The <code>dummyVars()</code> function in caret turns categorical predictors into numeric indicator columns, a process called one-hot encoding. It defines the encoding once and replays it on any data with <code>predict()</code>, keeping train and test columns aligned.</p>

[QUICK ANSWER]
dv <- dummyVars(~ ., data = df)              # define the encoder
predict(dv, newdata = df)                    # apply it -> numeric matrix
dummyVars(~ ., data = df, fullRank = TRUE)   # drop the reference level
dummyVars(~ color, data = df)                # encode one column only
predict(dv, newdata = test)                  # apply to unseen data
as.data.frame(predict(dv, newdata = df))     # matrix -> data frame

[DECISION TREE: Is dummyVars() the right tool?]
- one-hot encode factor columns: dummyVars(~ ., data = df)
- center and scale numeric columns: preProcess(df, method = "scale")
- drop near-zero-variance columns: nearZeroVar(df, names = TRUE)
- drop highly correlated columns: findCorrelation(cor(df))
- encode inside a tidymodels pipeline: recipes::step_dummy(all_nominal())
- collapse rare factor levels first: forcats::fct_lump(x, n = 5)

## What dummyVars() does in one sentence

**`dummyVars()` defines an encoder; `predict()` applies it.** You pass it a formula and a data frame, and it returns a `dummyVars` object that records every factor level it saw. The data itself is not transformed yet. Numeric columns are left alone, and each factor column is marked for expansion into one indicator column per level.

To produce the encoded numbers, you call `predict()` on that object. This two-step split matters because a model trained on encoded data must see new data encoded with the *same* set of columns. Storing the encoding rule once and replaying it everywhere is what stops a missing or extra category from silently breaking your test set.

## dummyVars() syntax and arguments

**`dummyVars()` reads a formula and a data frame, nothing else is required.** The formula picks which columns to consider, and the data frame supplies the factor levels.

```r title="Load caret and inspect the data"
library(caret)

data(warpbreaks)
str(warpbreaks)
#> 'data.frame':	54 obs. of  3 variables:
#>  $ breaks : num  26 30 54 25 70 52 51 26 67 18 ...
#>  $ wool   : Factor w/ 2 levels "A","B": 1 1 1 1 1 1 1 1 1 2 ...
#>  $ tension: Factor w/ 3 levels "L","M","H": 1 1 1 1 1 1 1 1 1 2 ...
```

The main arguments are:

- `formula`: use `~ .` for every column, or `~ col1 + col2` to encode a subset.
- `data`: the data frame used to learn the factor levels.
- `fullRank`: if `TRUE`, drop one level per factor (the reference level) to avoid collinearity. Defaults to `FALSE`.
- `sep`: the separator between the variable name and the level in output column names. Defaults to `"."`.
- `levelsOnly`: if `TRUE`, name columns by the level alone and drop the variable prefix.

[NOTE]
**Coming from Python pandas?** The closest equivalent of `dummyVars()` plus `predict()` is `pd.get_dummies(df)`, and `fullRank = TRUE` matches `drop_first=True`.

## dummyVars() examples by use case

**Encode every column at once with the `~ .` formula.** Numeric columns pass straight through, and each factor expands into one indicator per level.

```r title="One-hot encode every column"
dv <- dummyVars(~ ., data = warpbreaks)
encoded <- predict(dv, newdata = warpbreaks)
head(encoded)
#>   breaks wool.A wool.B tension.L tension.M tension.H
#> 1     26      1      0         1         0         0
#> 2     30      1      0         1         0         0
#> 3     54      1      0         1         0         0
#> 4     25      1      0         1         0         0
#> 5     70      1      0         1         0         0
#> 6     52      1      0         1         0         0
```

The `wool` factor with two levels became `wool.A` and `wool.B`; `tension` with three levels became three columns. The numeric `breaks` column is untouched.

**Use `fullRank = TRUE` to drop the reference level.** This produces `k - 1` columns per factor, which is what linear and logistic regression expect.

```r title="Drop the reference level with fullRank"
dv_fr <- dummyVars(~ ., data = warpbreaks, fullRank = TRUE)
head(predict(dv_fr, newdata = warpbreaks))
#>   breaks wool.B tension.M tension.H
#> 1     26      0         0         0
#> 2     30      0         0         0
#> 3     54      0         0         0
#> 4     25      0         0         0
#> 5     70      0         0         0
#> 6     52      0         0         0
```

[WARNING]
**A full indicator set breaks linear models.** With the default `fullRank = FALSE`, the `k` dummy columns of a factor sum to 1, so they are perfectly collinear with the intercept. Always set `fullRank = TRUE` for `lm()` or `glm()`.

**Encode a single column by naming it in the formula.** Only the columns on the right side of `~` appear in the output.

```r title="Encode a single factor column"
dv_one <- dummyVars(~ tension, data = warpbreaks)
head(predict(dv_one, newdata = warpbreaks), 3)
#>   tension.L tension.M tension.H
#> 1         1         0         0
#> 2         1         0         0
#> 3         1         0         0
```

**Apply a fitted encoder to new rows.** Because the `dummyVars` object stores every level, new data always comes back with the same columns in the same order.

```r title="Apply the encoder to new rows"
new_rows <- warpbreaks[c(1, 20, 40), ]
predict(dv, newdata = new_rows)
#>    breaks wool.A wool.B tension.L tension.M tension.H
#> 1      26      1      0         1         0         0
#> 20     21      1      0         0         0         1
#> 40     16      0      1         0         1         0
```

## dummyVars() vs model.matrix() and recipes

**`dummyVars()` is one of three common ways to build a numeric design matrix.** The right choice depends on whether you want a saved, reusable encoder and how you handle the reference level.

| Tool | Reference level | Output type | Best for |
|---|---|---|---|
| `dummyVars()` | Kept unless `fullRank = TRUE` | Numeric matrix | Tree models, reusable encoders |
| `model.matrix()` | Always dropped, adds an intercept | Numeric matrix | Quick design matrix for `lm()` |
| `recipes::step_dummy()` | Dropped by default | Step in a workflow | tidymodels pipelines |

Reach for `model.matrix()` when you just need a one-off matrix for a base R model. Reach for `recipes::step_dummy()` when the encoding is part of a tidymodels workflow that bundles preprocessing with the model. Reach for `dummyVars()` when you want a standalone object you can save, share, and replay on many data sets, especially with tree-based models that benefit from the full indicator set.

## Common pitfalls

**The output is a matrix, not a data frame.** `predict()` on a `dummyVars` object returns a numeric matrix, so `dplyr` verbs and `$` column access do not work until you convert it.

```r title="Convert the matrix to a data frame"
class(predict(dv, newdata = warpbreaks))
#> [1] "matrix" "array"

encoded_df <- as.data.frame(predict(dv, newdata = warpbreaks))
class(encoded_df)
#> [1] "data.frame"
```

**Numeric codes are not encoded.** If a category is stored as numbers, such as grade `1`, `2`, `3`, `dummyVars()` treats it as a numeric column and leaves it alone. Convert it to a factor first.

```r title="Numeric codes are not encoded"
grades <- data.frame(level = c(1, 2, 3, 1), score = c(80, 92, 71, 65))
predict(dummyVars(~ ., data = grades), newdata = grades)
#>   level score
#> 1     1    80
#> 2     2    92
#> 3     3    71
#> 4     1    65

grades$level <- factor(grades$level)
predict(dummyVars(~ ., data = grades), newdata = grades)
#>   level.1 level.2 level.3 score
#> 1       1       0       0    80
#> 2       0       1       0    92
#> 3       0       0       1    71
#> 4       1       0       0    65
```

**Unseen levels in new data become all-zero rows.** If test data contains a category the encoder never saw, that row gets `0` for every dummy of that factor rather than a new column. Fit the encoder on the full training set so every level is captured.

## Try it yourself

**Try it:** Use dummyVars to one-hot encode all columns of the iris data set, then save the encoded result to ex_encoded.

```r title="Your turn: encode iris"
# Try it: one-hot encode iris
ex_dv <- # your code here
ex_encoded <- # your code here

ncol(ex_encoded)
#> Expected: 7 columns
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_dv <- dummyVars(~ ., data = iris)
ex_encoded <- predict(ex_dv, newdata = iris)
ncol(ex_encoded)
#> [1] 7
```

**Explanation:** iris has four numeric columns that pass through unchanged plus the three-level Species factor, which expands into three indicator columns, giving 7 columns in total.

</details>

[TIP]
**Fit the encoder on training data only.** Build the `dummyVars` object from your training set, then call `predict()` on both train and test. This guarantees identical columns and prevents leakage of test-set information.

## Related caret functions

These caret functions pair naturally with `dummyVars()` in a preprocessing pipeline:

- [preProcess()](caret-preProcess-in-R.html) centers, scales, and imputes numeric predictors.
- [nearZeroVar()](caret-nearZeroVar-in-R.html) drops constant or near-constant columns.
- [findCorrelation()](caret-findCorrelation-in-R.html) removes highly correlated predictors.
- [createDataPartition()](caret-createDataPartition-in-R.html) splits data into train and test sets.
- [train()](caret-train-in-R.html) fits and tunes a model on the encoded data.

## FAQ

**What is the difference between dummyVars() and model.matrix() in R?**

Both build a numeric design matrix from factors, but they differ in two ways. `model.matrix()` always drops one reference level and adds an intercept column, so it is rank-correct for regression by default. `dummyVars()` keeps every level unless you set `fullRank = TRUE`, and it returns a reusable object you can `predict()` on later. Use `model.matrix()` for a quick one-off matrix and `dummyVars()` when you need a saved, replayable encoder.

**Does dummyVars() drop a reference level?**

Not by default. With `fullRank = FALSE`, a factor with `k` levels expands into `k` indicator columns. Set `fullRank = TRUE` to drop the first level and get `k - 1` columns, which avoids the dummy variable trap. Tree-based models such as random forests are fine with the full set, but linear and logistic regression need `fullRank = TRUE`.

**How do I convert the dummyVars() output to a data frame?**

`predict()` on a `dummyVars` object returns a numeric matrix. Wrap it in `as.data.frame()` to get a data frame you can use with `dplyr` or base `$` access. For example, `encoded_df <- as.data.frame(predict(dv, newdata = df))`. You can then `cbind()` it back to other columns or pass it directly to a modeling function.

**Can dummyVars() handle new factor levels in test data?**

It handles missing levels gracefully but not brand-new ones. If test data lacks a level the encoder saw, that column still appears, filled with zeros. If test data contains a level the encoder never saw, that observation gets zeros for every dummy of the factor and the new level is ignored. Always fit the encoder on a training set that covers all expected categories.
