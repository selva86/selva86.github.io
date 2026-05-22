---
title: "caret downSample() in R: Balance Classes by Undersampling"
slug: "caret-downSample-in-R"
description: "caret downSample() in R undersamples the majority class to match the minority count, balancing classification training data. Syntax, examples, pitfalls, FAQ."
keywords: "caret downSample, downSample function R, caret downSample examples, R undersample majority class, caret undersampling, caret downSample classification, R class imbalance undersampling"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "caret-functions"
fr_parent: "R-Tutorial.html"
auto_link_terms: "downSample()|caret downSample|caret::downSample()|random undersampling|caret undersampling"
auto_link_case_sensitive: true
target_keyword: "caret downSample"
sibling_block_enabled: true
difficulty: "Beginner"
---

# caret downSample() in R: Balance Classes by Undersampling

<p class="lead">The <code>downSample()</code> function in caret balances a classification dataset by randomly dropping rows from the majority classes until every class matches the smallest class count. It returns one combined data frame containing the predictors plus a renamed outcome column, and it handles binary or multiclass factor targets without extra arguments.</p>

[QUICK ANSWER]
downSample(x = predictors, y = labels)                # default, balances all classes
downSample(x, y, yname = "Outcome")                   # rename the outcome column
downSample(x, y, list = TRUE)                         # list with $x and $y separately
downSample(train[, -1], train$Class)                  # typical training-only call
downSample(iris[, 1:4], iris$Species)                 # no-op when already balanced
table(downSample(x, y)$Class)                         # confirm equal class counts
set.seed(1); downSample(x, y)                         # reproducible draws
nrow(downSample(x, y))                                # minority count times n classes

[DECISION TREE: Is downSample() the right tool?]
- random undersampling of the majority: downSample(x, y)
- random oversampling of the minority: upSample(x, y)
- synthetic minority samples (SMOTE): themis::step_smote() in a recipe
- weighted classes instead of resampling: train(weights = case_weights, ...)
- resampling driven inside train(): trainControl(sampling = "down")
- stratified train/test split before any sampling: createDataPartition(y, p = 0.7)
- numeric target (regression): downSample() does not apply, use a different approach

## What downSample() does in one sentence

**`downSample()` is caret's random undersampler for classification.** You pass a predictor matrix and a factor outcome, and it removes rows at random from every non-minority class until each class count equals the smallest one, returning a single data frame with the predictors plus a `Class` column.

The function targets the same problem as oversampling, from the opposite direction. When 99% of training rows belong to one class, a model can score 99% accuracy by always predicting that class while catching zero minority cases. Undersampling trims the majority to the minority size so the loss function sees equal examples from each class. It is the natural first move when the majority is large enough that throwing rows away does not collapse the signal.

## downSample() syntax and arguments

**`downSample()` takes predictors and outcomes separately, not a formula.** Four arguments cover everything the function exposes.

```r title="Load caret and build an imbalanced dataset"
library(caret)

set.seed(42)
df <- data.frame(
  x1 = c(rnorm(800, 0, 1), rnorm(40, 1.5, 1)),
  x2 = c(rnorm(800, 0, 1), rnorm(40, 1.5, 1)),
  Class = factor(c(rep("neg", 800), rep("pos", 40)))
)
table(df$Class)
#> 
#> neg pos 
#> 800  40
```

The signature is compact:

```r title="downSample signature"
downSample(x, y, list = FALSE, yname = "Class")
```

- `x`: predictor data frame or matrix. Do not include the outcome column here.
- `y`: factor outcome vector. The class with the smallest count sets the target size for every other class.
- `list`: if `FALSE` (the default), return a single data frame. Set to `TRUE` for a named list with `$x` and `$y` separately.
- `yname`: name for the outcome column when `list = FALSE`. Defaults to `"Class"`.

The returned object has `n_classes * minority_count` rows, so an 800/40 binary problem collapses to 80 rows. For multiclass, every non-minority class is sampled down to the minority size, so a 500/200/50 split shrinks to 150 rows. Dropped rows are gone for that training run.

[NOTE]
**Coming from Python imbalanced-learn?** The closest equivalent is `RandomUnderSampler().fit_resample(X, y)` from `imblearn.under_sampling`. Both drop majority rows at random until classes balance; `downSample()` returns one combined data frame, `imblearn` returns X and y as separate arrays.

## downSample() examples by use case

**Most undersampling workflows split first, then downsample only the training partition.** The examples below build from a single call up to a pipeline with `caret::train()` and a held-out test set.

A single binary undersampling call on the toy data:

```r title="Balance a binary classification frame"
set.seed(1)
balanced <- downSample(x = df[, c("x1", "x2")], y = df$Class)
table(balanced$Class)
#> 
#> neg pos 
#>  40  40
nrow(balanced)
#> [1] 80
```

The majority fell from 800 rows to 40, matching the minority. The 760 dropped rows are removed from this frame, and the predictor space loses most of its majority-side coverage. That information loss is the cost of undersampling and the reason it pairs well with bagging.

The same call with `list = TRUE` keeps predictors and labels separate:

```r title="List output for matrix workflows"
set.seed(1)
balanced_list <- downSample(x = df[, c("x1", "x2")], y = df$Class, list = TRUE)
names(balanced_list)
#> [1] "x" "y"
dim(balanced_list$x)
#> [1] 80  2
length(balanced_list$y)
#> [1] 80
```

Use `list = TRUE` when downstream code expects X and y as separate arguments, for example `glmnet()` or `xgboost::xgb.DMatrix()`.

A train/test split before undersampling, then balanced training:

```r title="Split first, downsample only the train half"
set.seed(7)
train_idx <- createDataPartition(df$Class, p = 0.7, list = FALSE)
train <- df[train_idx, ]
test  <- df[-train_idx, ]

set.seed(7)
train_bal <- downSample(x = train[, c("x1", "x2")], y = train$Class)
table(train_bal$Class)
#> 
#> neg pos 
#>  28  28
table(test$Class)
#> 
#> neg pos 
#> 240  12
```

The training set is balanced 28/28 while the test set keeps the natural imbalance. Evaluating on the imbalanced test set keeps metrics honest; balancing it hides the true deployment distribution.

Multiclass undersampling works the same way:

```r title="Multiclass downSample on a 3-level factor"
set.seed(3)
multi <- data.frame(
  x1 = rnorm(500),
  Class = factor(c(rep("A", 300), rep("B", 150), rep("C", 50)))
)
multi_bal <- downSample(x = multi[, "x1", drop = FALSE], y = multi$Class)
table(multi_bal$Class)
#> 
#>  A  B  C 
#> 50 50 50
```

Every non-minority class is sampled down to the minority size. A 3-class problem with counts 300/150/50 collapses to 150 rows, an 80% reduction.

[TIP]
**Let `train()` do it for you when tuning.** Pass `trainControl(sampling = "down")` to caret's `train()` and the undersampling runs inside each resample, not on the full training set. This gives an honest performance estimate because the downsampling is recomputed per fold, and the discarded majority rows differ across folds, recovering some of the information that a one-shot downsample throws away.

## downSample() vs upSample() and other balancing tools

**`downSample()` drops majority rows; `upSample()` duplicates minority rows; SMOTE creates synthetic minority points.** Pick by dataset size, model variance, and how much majority signal you can afford to lose.

| Method | Sample size | Risk | Best for |
|---|---|---|---|
| `downSample(x, y)` | `n_classes * minority_count` | throws away majority information | very large datasets, fast training, bagging |
| `upSample(x, y)` | `n_classes * majority_count` | overfits to repeated minority rows | small datasets where dropping majority hurts |
| `themis::step_smote()` | synthetic interpolations | distorts feature manifold | continuous features, large enough minority to interpolate |
| `trainControl(sampling = "down")` | resamples inside CV | none above resample noise | hyperparameter tuning with caret |
| `weights` in `train()` | unchanged | weights only, no resampling | log-loss or weighted likelihood models |

Downsampling shines when the majority is large enough that the random sample still represents it well. With 100,000 majority and 1,000 minority rows, downsampling produces a 2,000-row frame that fits a model in seconds. Upsampling the same data inflates the frame to 200,000 rows and slows every fold, often without a measurable accuracy gain.

The natural partner for downsampling is bagging on multiple balanced subsets. Build several downsampled sets with different seeds and aggregate the predictions. Each model sees a different slice of the majority, and the ensemble recovers most of the information one downsample throws away. Random forest via `caret::train(method = "rf")` with `trainControl(sampling = "down")` is the simplest form of this pattern.

## Common pitfalls

**Three mistakes cause most undersampling bugs.**

The first is undersampling before the train/test split. If you call `downSample()` on the full data and then split, the test set inherits the artificially balanced prior and the test metric stops describing real-world performance. Always split first, then downsample only the training partition.

The second is reporting accuracy on the balanced training data. Once `downSample()` runs, accuracy on the balanced sample is meaningless because the prior distribution has been rewritten. Score on the natural-prevalence test partition and report precision, recall, F1, and AUPRC instead.

[WARNING]
**Information loss can be severe with small majority classes.** Dropping 800 majority rows down to 40 throws away 95% of the majority signal. If the majority count is below a few thousand rows, prefer oversampling, SMOTE, or class weights. Downsampling pays off when the majority class is genuinely large.

The third is forgetting to set a seed. `downSample()` draws random row indexes, so two calls produce different training frames. Seed once before each call and the same balanced frame is rebuilt every run.

## Try it yourself

**Try it:** Take the built-in `iris` dataset, duplicate the `versicolor` and `virginica` rows to create imbalance, then use `downSample()` to rebalance and confirm all three species drop back to 50 rows.

```r title="Your turn: rebalance iris by downsampling"
library(caret)

set.seed(13)
ex_iris <- rbind(iris, iris[iris$Species %in% c("versicolor", "virginica"), ])
table(ex_iris$Species)

set.seed(13)
ex_bal <- # your code here

table(ex_bal$Class)
#> Expected: setosa 50, versicolor 50, virginica 50
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
library(caret)

set.seed(13)
ex_iris <- rbind(iris, iris[iris$Species %in% c("versicolor", "virginica"), ])
table(ex_iris$Species)
#> 
#>     setosa versicolor  virginica 
#>         50        100        100

set.seed(13)
ex_bal <- downSample(x = ex_iris[, 1:4], y = ex_iris$Species)

table(ex_bal$Class)
#> 
#>     setosa versicolor  virginica 
#>         50         50         50
```

**Explanation:** `setosa` is the minority with 50 rows so it sets the target size. `versicolor` and `virginica` get sampled down from 100 to 50 each, leaving a balanced 150-row frame.

</details>

## Related caret functions

`downSample()` is one piece of caret's class-balancing toolkit.

- `upSample(x, y)`: random oversampling of the minority class to match the majority size.
- `createDataPartition(y, p = 0.7)`: stratified train/test split, runs before any sampling.
- `trainControl(sampling = "down")`: runs `downSample()` inside each resample during `train()`.
- `train(method, weights = w)`: class-weighted fitting without resampling.
- `confusionMatrix(predicted, actual)`: scores a classifier on the natural-prevalence test set.

See the [caret documentation on subsampling for class imbalance](https://topepo.github.io/caret/subsampling-for-class-imbalances.html) for the authoritative reference.

## FAQ

**Why does downSample() rename my outcome column to Class?**

The default `yname = "Class"` makes the returned frame work with caret's formula interface, where `train(Class ~ ., data = balanced)` finds the outcome by name. Pass `yname = "Species"` to keep the original name. The renaming is purely cosmetic; the factor values are identical to the input.

**Should I downsample the validation set too?**

No. Downsample only the training partition. The validation and test sets must reflect the real-world class prior so metrics generalise to production. Scoring on a balanced validation set inflates accuracy and obscures the precision-recall trade-off at deployment.

**How does downSample() compare with upSample()?**

`downSample()` drops majority rows so the training frame shrinks to `n_classes * minority_count`. `upSample()` duplicates minority rows so the frame grows to `n_classes * majority_count`. Choose downsampling when the majority is large and training time matters, and oversampling when the dataset is small and throwing rows away hurts more than duplicating them.

**Can I combine downSample() with cross-validation?**

Yes, by passing `trainControl(sampling = "down")` to `train()`. caret then downsamples inside each CV fold so the resample estimates are honest. Calling `downSample()` once before `train()` reuses the same shrunken set across every fold, which biases the cross-validation error.

**Does downSample() work with regression targets?**

No. `downSample()` requires a factor outcome and balances by class count. For numeric targets, stratify on a binned target with `createDataPartition()`, transform the response with `log1p()`, or fit a quantile loss.
