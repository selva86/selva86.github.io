---
title: "caret upSample() in R: Oversample Minority Class for Balance"
slug: "caret-upSample-in-R"
description: "caret upSample() in R oversamples the minority class with replacement to balance binary or multiclass training data. Syntax, examples, pitfalls, full FAQ."
keywords: "caret upSample, upSample function R, caret upSample examples, R upsample minority class, caret oversampling, caret upSample classification, R class imbalance upsampling"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "caret-functions"
fr_parent: "R-Tutorial.html"
auto_link_terms: "upSample()|caret upSample|caret::upSample()|random oversampling|caret oversampling"
auto_link_case_sensitive: true
target_keyword: "caret upSample"
sibling_block_enabled: true
difficulty: "Beginner"
---

# caret upSample() in R: Oversample Minority Class for Balance

<p class="lead">The <code>upSample()</code> function in caret balances a classification dataset by sampling rows from minority classes with replacement until every class matches the majority count. It returns one combined data frame containing the predictors plus a renamed outcome column, and it works for binary or multiclass factor targets out of the box.</p>

[QUICK ANSWER]
upSample(x = predictors, y = labels)                  # default, balances all classes
upSample(x, y, yname = "Outcome")                     # rename the outcome column
upSample(x, y, list = TRUE)                           # list with $x and $y separately
upSample(train[, -1], train$Class)                    # typical training-only call
upSample(iris[, 1:4], iris$Species)                   # no-op when already balanced
table(upSample(x, y)$Class)                           # confirm equal class counts
set.seed(1); upSample(x, y)                           # reproducible draws
nrow(upSample(x, y))                                  # majority count times n classes

[DECISION TREE: Is upSample() the right tool?]
- random oversampling for a classifier: upSample(x, y)
- random undersampling of the majority: downSample(x, y)
- synthetic minority samples (SMOTE): themis::step_smote() in a recipe
- weighted classes instead of resampling: train(weights = case_weights, ...)
- resampling driven inside train(): trainControl(sampling = "up")
- stratified train/test split before any sampling: createDataPartition(y, p = 0.7)
- numeric target (regression): upSample() does not apply, use a different approach

## What upSample() does in one sentence

**`upSample()` is caret's random oversampler for classification.** You give it a predictor matrix and a factor outcome, and it draws rows from each minority class with replacement until every class has the same count as the largest one, returning a single data frame with the predictors plus a `Class` column.

The function exists because most classifiers minimise overall error, and an imbalanced training set lets a model hit high accuracy by predicting the majority for everything. A fraud-detection model trained on 99% legitimate transactions and 1% fraud can score 99% accuracy by predicting "legitimate" for every row, while catching zero fraud. Random oversampling on the training set lifts the minority signal so the loss function pays equal attention to each class. `upSample()` is the right starting point before reaching for SMOTE or cost-sensitive learning, and the baseline against which more sophisticated balancing strategies should be measured.

## upSample() syntax and arguments

**`upSample()` takes the predictors and the outcome separately, not a formula or a single data frame.** Four arguments cover every option the function exposes.

```r title="Load caret and build an imbalanced dataset"
library(caret)

set.seed(42)
df <- data.frame(
  x1 = c(rnorm(200, 0, 1), rnorm(30, 1.5, 1)),
  x2 = c(rnorm(200, 0, 1), rnorm(30, 1.5, 1)),
  Class = factor(c(rep("neg", 200), rep("pos", 30)))
)
table(df$Class)
#> 
#> neg pos 
#> 200  30
```

The signature is short:

```r title="upSample signature"
upSample(x, y, list = FALSE, yname = "Class")
```

- `x`: predictor data frame or matrix. Do not include the outcome column here.
- `y`: factor outcome vector. The class with the largest count sets the target size for every other class.
- `list`: if `FALSE` (the default), return a single data frame. Set to `TRUE` for a named list with `$x` and `$y` separately.
- `yname`: name for the outcome column when `list = FALSE`. Defaults to `"Class"`.

The returned object has one row per class times the majority count, so a 200/30 binary problem becomes 400 rows. For multiclass, every minority class is independently sampled up to the majority size, so a 100/60/20 split produces 300 rows. The added rows are exact duplicates of existing minority observations.

[NOTE]
**Coming from Python imbalanced-learn?** The closest equivalent is `RandomOverSampler().fit_resample(X, y)` from `imblearn.over_sampling`. Both draw minority rows with replacement until classes balance; `upSample()` returns one combined data frame while `imblearn` returns X and y as separate arrays.

## upSample() examples by use case

**Most oversampling workflows split first, then upsample only the training partition.** The examples below build from the basic call up to a pipeline with `caret::train()` and a held-out test set.

A single binary oversampling call on the toy data:

```r title="Balance a binary classification frame"
set.seed(1)
balanced <- upSample(x = df[, c("x1", "x2")], y = df$Class)
table(balanced$Class)
#> 
#> neg pos 
#> 200 200
nrow(balanced)
#> [1] 400
```

The minority class jumped from 30 rows to 200, matching the majority. The 170 added rows are bootstrap copies of the original 30 minority observations, so the predictor space is unchanged but each minority point now appears about 6.7 times on average.

The same call with `list = TRUE` keeps predictors and labels separate:

```r title="List output for matrix workflows"
set.seed(1)
balanced_list <- upSample(x = df[, c("x1", "x2")], y = df$Class, list = TRUE)
names(balanced_list)
#> [1] "x" "y"
dim(balanced_list$x)
#> [1] 400   2
length(balanced_list$y)
#> [1] 400
```

Use `list = TRUE` when downstream code expects X and y as separate arguments, for example `glmnet()` or `xgboost::xgb.DMatrix()`.

A train/test split before oversampling, then balanced training:

```r title="Split first, upsample only the train half"
set.seed(7)
train_idx <- createDataPartition(df$Class, p = 0.7, list = FALSE)
train <- df[train_idx, ]
test  <- df[-train_idx, ]

set.seed(7)
train_bal <- upSample(x = train[, c("x1", "x2")], y = train$Class)
table(train_bal$Class)
#> 
#> neg pos 
#> 140 140
table(test$Class)
#> 
#> neg pos 
#>  60   9
```

The training set is balanced 140/140 while the test set keeps the natural imbalance. Evaluating on the imbalanced test set is what makes the metrics honest; balancing the test set hides the real deployment distribution.

Multiclass oversampling works the same way:

```r title="Multiclass upSample on a 3-level factor"
set.seed(3)
multi <- data.frame(
  x1 = rnorm(180),
  Class = factor(c(rep("A", 100), rep("B", 60), rep("C", 20)))
)
multi_bal <- upSample(x = multi[, "x1", drop = FALSE], y = multi$Class)
table(multi_bal$Class)
#> 
#>   A   B   C 
#> 100 100 100
```

Every non-majority class is sampled with replacement up to the majority size. A 3-class problem with counts 100/60/20 becomes 300 rows after the call.

[TIP]
**Let `train()` do it for you when tuning.** Pass `trainControl(sampling = "up")` to caret's `train()` and the oversampling runs inside each resample, not on the full training set. This gives an honest performance estimate because the upsampling is recomputed per fold instead of leaking duplicated rows across the cross-validation splits.

## upSample() vs downSample() and other balancing tools

**`upSample()` adds minority copies; `downSample()` drops majority rows; SMOTE creates synthetic minority points.** Pick by what you can afford to lose and how much variance you tolerate.

| Method | Sample size | Risk | Best for |
|---|---|---|---|
| `upSample(x, y)` | `n_classes * majority_count` | overfits to repeated minority rows | small datasets where dropping majority hurts |
| `downSample(x, y)` | `n_classes * minority_count` | throws away majority information | very large datasets, fast training |
| `themis::step_smote()` | synthetic interpolations | distorts feature manifold | continuous features, large enough minority to interpolate |
| `trainControl(sampling = "up")` | resamples inside CV | none above resample noise | hyperparameter tuning with caret |
| `weights` in `train()` | unchanged | weights only, no resampling | log-loss or weighted likelihood models |

For most first attempts, oversample with `upSample()`, tune with `trainControl(sampling = "up")`, then compare against `downSample()` on the same folds. The choice often comes down to dataset size: with 10,000 majority and 200 minority rows, downsampling drops the training frame to 400 and the majority signal collapses, while upsampling keeps the majority intact and inflates the minority to 10,000.

Class weights are a third lever. Passing a per-row weight vector to `train()` tells the loss function to penalise minority errors more heavily without changing the row count. Weights are usually cheaper than oversampling, but only work when the model exposes a `weights` argument.

## Common pitfalls

**Three mistakes cause most upsampling bugs.**

The first is oversampling before the train/test split. If you call `upSample()` on the full data and then split, identical minority copies appear on both sides of the split, leaking labels into evaluation. The test metric will look excellent and collapse in production. Always split first.

The second is reading test metrics on a balanced test set. After `upSample()`, accuracy on the balanced sample is meaningless because the prior distribution has been rewritten. Score on the natural-prevalence test partition and report precision, recall, F1, and AUPRC, not accuracy.

[WARNING]
**Random oversampling exaggerates noise in tiny minorities.** A 30-row positive class oversampled to 200 rows is still only 30 distinct points. If the minority is below 50 to 100 rows, prefer SMOTE or collect more data.

The third is forgetting to set a seed. `upSample()` draws random row indexes, so two calls produce different oversampled frames. Seed once before `upSample()` and the same balanced training frame is rebuilt every run.

## Try it yourself

**Try it:** Take the built-in `iris` dataset, drop 40 rows from the `virginica` class to create imbalance, then use `upSample()` to rebalance and confirm all three species reach 50 rows.

```r title="Your turn: rebalance virginica"
library(caret)

set.seed(11)
ex_iris <- iris[-sample(which(iris$Species == "virginica"), 40), ]
table(ex_iris$Species)

set.seed(11)
ex_bal <- # your code here

table(ex_bal$Class)
#> Expected: setosa 50, versicolor 50, virginica 50
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
library(caret)

set.seed(11)
ex_iris <- iris[-sample(which(iris$Species == "virginica"), 40), ]
table(ex_iris$Species)
#> 
#>     setosa versicolor  virginica 
#>         50         50         10

set.seed(11)
ex_bal <- upSample(x = ex_iris[, 1:4], y = ex_iris$Species)

table(ex_bal$Class)
#> 
#>     setosa versicolor  virginica 
#>         50         50         50
```

**Explanation:** `setosa` and `versicolor` already have 50 rows so they are passed through untouched. `virginica` jumps from 10 to 50 via sampling with replacement, leaving the balanced frame with 150 rows and a uniform class distribution.

</details>

## Related caret functions

`upSample()` is one piece of caret's class-balancing toolkit.

- `downSample(x, y)`: random undersampling of the majority class to match the minority size.
- `createDataPartition(y, p = 0.7)`: stratified train/test split, runs before any sampling.
- `trainControl(sampling = "up")`: runs `upSample()` inside each resample during `train()`.
- `train(method, weights = w)`: class-weighted fitting without resampling.
- `confusionMatrix(predicted, actual)`: scores a classifier on the natural-prevalence test set.

See the [caret documentation on subsampling for class imbalance](https://topepo.github.io/caret/subsampling-for-class-imbalances.html) for the authoritative reference.

## FAQ

**Why does upSample() rename my outcome column to Class?**

The default `yname = "Class"` makes the returned frame work with caret's formula interface, where `train(Class ~ ., data = balanced)` finds the outcome by name. Pass `yname = "Species"` to keep the original name. Renaming is purely cosmetic; values are identical to the input factor.

**Should I oversample the validation set too?**

No. Oversample only the training partition. The validation and test sets should reflect the real-world class prior so metrics generalise to production. Scoring on a balanced validation set inflates accuracy and obscures the precision-recall trade-off at deployment.

**How does upSample() compare with SMOTE?**

`upSample()` duplicates existing minority rows, so the model sees the same points many times. SMOTE generates synthetic rows by interpolating between minority neighbours, expanding the predictor space in a way that can hurt high-cardinality categorical features. Start with `upSample()` for a baseline; switch to SMOTE only when interpolation is plausible.

**Can I combine upSample() with cross-validation?**

Yes, by passing `trainControl(sampling = "up")` to `train()`. caret then upsamples inside each CV fold so the resample estimates are honest. Calling `upSample()` on the full training set before `train()` leaks duplicated rows across folds.
