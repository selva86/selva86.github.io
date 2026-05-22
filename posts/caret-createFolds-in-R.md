---
title: "caret createFolds() in R: K-Fold Cross-Validation Indices"
slug: "caret-createFolds-in-R"
description: "caret createFolds() in R builds stratified k-fold cross-validation indices. Syntax, returnTrain, examples, custom CV loops, pitfalls, and FAQ covered."
keywords: "caret createFolds, createFolds function R, caret createFolds examples, R k-fold cross validation indices, createFolds stratified, caret cross validation folds, createFolds vs createDataPartition"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "caret-functions"
fr_parent: "R-Tutorial.html"
auto_link_terms: "createFolds()|caret createFolds|caret::createFolds()|k-fold cross validation indices|stratified k-fold"
auto_link_case_sensitive: true
target_keyword: "caret createFolds"
sibling_block_enabled: true
difficulty: "Beginner"
---

# caret createFolds() in R: K-Fold Cross-Validation Indices

<p class="lead">The <code>createFolds()</code> function in caret builds stratified k-fold cross-validation indices, returning a list of k row groups so each row is held out exactly once across the folds. It stratifies factor outcomes by class and bins numeric outcomes by quantile, keeping each fold's outcome distribution close to the full data.</p>

[QUICK ANSWER]
createFolds(y, k = 10)                              # 10 test-index folds (list)
createFolds(y, k = 5)                               # 5-fold CV indices
createFolds(y, k = 10, list = FALSE)                # integer vector of fold IDs
createFolds(y, k = 10, returnTrain = TRUE)          # training indices instead
createFolds(iris$Species, k = 5)                    # stratify by factor levels
createFolds(mtcars$mpg, k = 5)                      # numeric outcome, quantile-binned
df[-folds[[1]], ]                                   # training rows for fold 1

[DECISION TREE: Is createFolds() the right tool?]
- k-fold CV indices: createFolds(y, k = 10)
- one stratified train/test split: createDataPartition(y, p = 0.7)
- repeated k-fold CV: createMultiFolds(y, k = 5, times = 3)
- bootstrap resamples: createResample(y, times = 25)
- rolling-origin time-series folds: createTimeSlices(y, initialWindow, horizon)
- automate CV inside train(): trainControl(method = "cv", number = 10)
- leave-one-out CV: createFolds(y, k = length(y))

## What createFolds() does in one sentence

**`createFolds()` is caret's k-fold splitter for cross-validation.** You give it an outcome vector and a fold count, and it returns a named list of k integer vectors. By default each element holds the row positions of the held-out fold, so the training rows for that fold are everything else.

The function exists so you can stratify your folds without writing the bin logic by hand. A naive k-fold split, such as `split(seq_along(y), cut(seq_along(y), k))`, ignores the outcome and can produce folds where a rare class is missing entirely. `createFolds()` samples within each class (for factor outcomes) or within each quantile bin (for numeric outcomes), so every fold carries the same outcome shape as the full data. That keeps per-fold metrics comparable and avoids degenerate folds during model fitting.

## createFolds() syntax and arguments

**`createFolds()` needs only an outcome vector; everything else has a sensible default.** The four arguments control fold count, output shape, and whether the indices point to test or training rows.

```r title="Load caret and inspect iris"
library(caret)

set.seed(1)
str(iris$Species)
#>  Factor w/ 3 levels "setosa","versicolor",..: 1 1 1 1 1 1 1 1 1 1 ...
table(iris$Species)
#> 
#>     setosa versicolor  virginica 
#>         50         50         50
```

The signature is short:

```r title="createFolds signature"
createFolds(y, k = 10, list = TRUE, returnTrain = FALSE)
```

- `y`: the outcome vector. Factors trigger per-class stratification; numerics are binned by quantile first.
- `k`: number of folds. 10 is the conventional default, 5 is common for small data, and `k = length(y)` gives leave-one-out CV.
- `list`: if `TRUE` (the default), return a named list of integer vectors, one per fold. Set to `FALSE` to get a single integer vector of fold IDs (1 to k) the same length as `y`.
- `returnTrain`: if `FALSE` (the default), each list element holds the held-out (test) indices for that fold. Set to `TRUE` to invert and return the training indices instead.

[NOTE]
**Coming from Python scikit-learn?** The closest equivalent is `StratifiedKFold(n_splits = 10).split(X, y)`. Both stratify per class, but `createFolds()` returns indices in one shot rather than a generator, and it bins numeric outcomes automatically.

## createFolds() examples by use case

**Most cross-validation loops grab the list, iterate over it, and refit per fold.** The examples below build from the basic list output up to a hand-rolled CV loop.

A 5-fold stratified set on the iris species column:

```r title="Stratified 5-fold on a factor outcome"
set.seed(42)
folds <- createFolds(iris$Species, k = 5)
names(folds)
#> [1] "Fold1" "Fold2" "Fold3" "Fold4" "Fold5"
sapply(folds, length)
#> Fold1 Fold2 Fold3 Fold4 Fold5 
#>    30    30    30    30    30
table(iris$Species[folds$Fold1])
#> 
#>     setosa versicolor  virginica 
#>         10         10         10
```

Each fold holds 30 rows with 10 from each class, because caret sampled inside each level of `Species`. Loop over the list to train on the other four folds and predict on the held-out one.

The same call with `returnTrain = TRUE` inverts the indices:

```r title="Return training indices instead of test"
set.seed(42)
train_folds <- createFolds(iris$Species, k = 5, returnTrain = TRUE)
sapply(train_folds, length)
#> Fold1 Fold2 Fold3 Fold4 Fold5 
#>   120   120   120   120   120
```

Each element now lists 120 training rows for its fold. This is the shape caret itself uses inside `trainControl(method = "cv")`, which is why you almost never call `createFolds()` directly when you are using `train()`.

A fold-ID vector for a tidy CV loop:

```r title="Vector of fold IDs"
set.seed(42)
fold_id <- createFolds(iris$Species, k = 5, list = FALSE)
table(fold_id)
#> fold_id
#>  1  2  3  4  5 
#> 30 30 30 30 30
```

`fold_id` is the same length as `iris$Species` and labels each row with its fold. Use it with `split()` or `tapply()` for per-fold summaries.

A hand-rolled CV loop that fits a model per fold and averages RMSE:

```r title="Custom 5-fold CV with createFolds"
library(caret)

set.seed(123)
folds <- createFolds(mtcars$mpg, k = 5)
rmse <- numeric(length(folds))

for (i in seq_along(folds)) {
  test_idx  <- folds[[i]]
  train_set <- mtcars[-test_idx, ]
  test_set  <- mtcars[ test_idx, ]
  fit       <- lm(mpg ~ wt + hp, data = train_set)
  preds     <- predict(fit, test_set)
  rmse[i]   <- sqrt(mean((test_set$mpg - preds)^2))
}

mean(rmse)
#> [1] 2.736444
```

The loop is short because `folds[[i]]` already holds the test rows and the complement is the training set. Swap `lm()` for any modeling function and the structure is unchanged.

[TIP]
**Set a seed before `createFolds()`.** The function reads the active RNG state, so without `set.seed()` you get different folds on every run and your CV metrics are not reproducible. Seed once before the call; the value (`42`, `123`, `998`) does not matter, the consistency does.

## createFolds() vs createDataPartition() and trainControl()

**`createFolds()` builds k folds for cross-validation; `createDataPartition()` builds one train/test cut; `trainControl()` runs CV for you.** Pick by where you sit in the modeling workflow.

| Function | Purpose | Default returns | Used when |
|---|---|---|---|
| `createFolds(y, k = 10)` | k-fold CV indices | list of k test-index vectors | hand-rolled CV loops |
| `createDataPartition(y, p = 0.7)` | one stratified split | list with training indices | initial holdout |
| `createMultiFolds(y, k = 5, times = 3)` | repeated k-fold | list of k * times train-index vectors | repeated CV |
| `createResample(y, times = 25)` | bootstrap resamples | list of training-index vectors | bootstrap validation |
| `trainControl(method = "cv", number = 10)` | CV config for train() | a control object | inside `caret::train()` |

If you are calling `train()`, do not bother with `createFolds()`. Pass `trainControl(method = "cv", number = 10)` and caret runs the folds internally. Reach for `createFolds()` when you need a CV loop outside `train()`, for example to fit a model that `train()` does not expose, or to compute a custom metric per fold.

## Common pitfalls

**Three mistakes cause most CV bugs.** Each one has a clear symptom in the fold-size table.

The first is forgetting that the default returns TEST indices, not training indices. `mtcars[folds[[1]], ]` gives you the holdout fold, not the training set. Use `mtcars[-folds[[1]], ]` for training, or set `returnTrain = TRUE` and flip the slicing.

The second is choosing `k` larger than the smallest class size. With 5 rows of a rare class and `k = 10`, some folds will not contain that class at all, and stratification breaks silently. Check class counts with `table(y)` and keep `k` at or below the smallest class size.

[WARNING]
**Time-ordered data needs a different fold strategy.** `createFolds()` shuffles rows by class, so future observations can leak into the training set when the outcome is ordered by time. Use `createTimeSlices()` or a manual time-based window for any temporal target.

The third is reusing folds across model comparisons without seeding. Two `createFolds()` calls in a row without `set.seed()` produce different folds, so RMSE differences may be noise rather than a real model improvement. Seed once before the fold call and freeze the folds for every model you compare.

## Try it yourself

**Try it:** Build a stratified 10-fold set on `iris$Species` and confirm every fold contains all three classes.

```r title="Your turn: stratified k-fold"
set.seed(7)
ex_folds <- # your code here

sapply(ex_folds, function(idx) length(unique(iris$Species[idx])))
#> Expected: 3 for every fold
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(7)
ex_folds <- createFolds(iris$Species, k = 10)

sapply(ex_folds, function(idx) length(unique(iris$Species[idx])))
#> Fold01 Fold02 Fold03 Fold04 Fold05 Fold06 Fold07 Fold08 Fold09 Fold10 
#>      3      3      3      3      3      3      3      3      3      3
```

**Explanation:** Passing `iris$Species` triggers per-class stratification, so caret samples 5 rows from each of the three classes into every fold. Every fold therefore contains all three species, which is exactly what stratified k-fold guarantees.

</details>

## Related caret functions

Caret ships a small family of resampler functions. `createFolds()` is the one for k-fold cross-validation; the others handle adjacent resampling strategies.

- `createDataPartition(y, p = 0.7)`: one stratified train/test split before any CV.
- `createMultiFolds(y, k = 5, times = 3)`: repeated k-fold indices for `method = "repeatedcv"`.
- `createResample(y, times = 25)`: bootstrap resamples for `method = "boot"`.
- `createTimeSlices(y, initialWindow, horizon)`: rolling-origin folds for time-series outcomes.
- `trainControl(method = "cv", number = 10)`: the wrapper that calls `createFolds()` internally inside `train()`.

The usual pipeline is split once with `createDataPartition()`, then resample the training partition inside `train()` via a `trainControl()` object; you only call `createFolds()` directly when you need a manual CV loop.

## FAQ

**What is the difference between createFolds() and createDataPartition()?**

`createDataPartition()` builds one stratified train/test split and returns the training indices. `createFolds()` builds k folds for cross-validation and returns a list of k test-index vectors (or training indices with `returnTrain = TRUE`). Use `createDataPartition()` at the top of the workflow to carve out an initial holdout, then use `createFolds()` (or `trainControl()`) to cross-validate inside the training partition.

**Why does createFolds() return test indices by default?**

Most CV loops iterate over the held-out fold to compute predictions, so caret defaulted the list to test indices for convenience. The convention surprises new users because `createDataPartition()` returns training indices instead. Flip with `returnTrain = TRUE` if you prefer training indices, or use `mtcars[-folds[[i]], ]` to subset the complement.

**How do I do leave-one-out cross-validation with createFolds()?**

Call `createFolds(y, k = length(y))`. Each fold will hold exactly one row, so you get LOOCV. For larger data this is slow because you train `length(y)` models; consider `k = 10` first and only drop to LOOCV when the dataset is small enough that 10-fold variance is too high.

**Does createFolds() stratify numeric outcomes?**

Yes. caret cuts the numeric vector into quantile bins internally (the cut points are computed from the data), then samples within each bin so the distribution of `y` is similar across folds. The behavior matches `createDataPartition()`'s numeric branch and uses the same internal logic, so a numeric regression target stays roughly balanced across folds.

**Can I pass createFolds() output directly to trainControl()?**

Yes, via `trainControl(index = my_train_folds)` where `my_train_folds` is the list returned by `createFolds(y, k = 10, returnTrain = TRUE)`. Pair it with `indexOut = my_test_folds` if you want explicit test indices. This lets you reuse the exact same folds across multiple `train()` calls so model comparisons are not contaminated by fold randomness.
