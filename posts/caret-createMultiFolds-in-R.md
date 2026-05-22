---
title: "caret createMultiFolds() in R: Repeated K-Fold CV Indices"
slug: "caret-createMultiFolds-in-R"
description: "caret createMultiFolds() in R returns repeated stratified k-fold training indices. Syntax, times, repeatedcv with train(), examples, pitfalls, and FAQ inside."
keywords: "caret createMultiFolds, createMultiFolds function R, caret createMultiFolds examples, R repeated k-fold cross validation, caret repeatedcv, createMultiFolds vs createFolds, caret cross validation indices"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "caret-functions"
fr_parent: "R-Tutorial.html"
auto_link_terms: "createMultiFolds()|caret createMultiFolds|caret::createMultiFolds()|repeated k-fold cross validation|repeatedcv indices"
auto_link_case_sensitive: true
target_keyword: "caret createMultiFolds"
sibling_block_enabled: true
difficulty: "Beginner"
---

# caret createMultiFolds() in R: Repeated K-Fold CV Indices

<p class="lead">The <code>createMultiFolds()</code> function in caret returns stratified training-row indices for repeated k-fold cross-validation, producing <code>k * times</code> resamples in a single named list. It is the resampler that backs <code>trainControl(method = "repeatedcv")</code> and the one to use when a single 10-fold run is too noisy to trust.</p>

[QUICK ANSWER]
createMultiFolds(y, k = 10, times = 5)               # 50 training-index folds
createMultiFolds(y, k = 5,  times = 3)               # 15 folds: 5-fold x 3 reps
createMultiFolds(iris$Species, k = 5, times = 2)     # stratify by factor levels
createMultiFolds(mtcars$mpg, k = 5, times = 2)       # numeric outcome, binned
names(folds)[1:3]                                    # "Fold1.Rep1" "Fold2.Rep1" ...
length(folds)                                        # k * times
trainControl(method = "repeatedcv", number = 10, repeats = 5)  # uses it internally

[DECISION TREE: Is createMultiFolds() the right tool?]
- repeated k-fold CV indices: createMultiFolds(y, k = 10, times = 5)
- single k-fold CV (faster): createFolds(y, k = 10)
- one stratified train/test split: createDataPartition(y, p = 0.7)
- bootstrap resamples: createResample(y, times = 25)
- rolling-origin time-series folds: createTimeSlices(y, initialWindow, horizon)
- automate repeated CV inside train(): trainControl(method = "repeatedcv", number = 10, repeats = 5)

## What createMultiFolds() does in one sentence

**`createMultiFolds()` is caret's repeated k-fold splitter for cross-validation.** It calls the stratified k-fold splitter `times` times with fresh randomness inside each repetition, then concatenates the training-index lists into one flat named list of length `k * times`.

Each element holds the row positions to train on, so the held-out rows for that fold are the complement. Naming follows `Fold<i>.Rep<j>`, which lets you slice by repetition with a single regex. The function exists because a single 10-fold split can swing several percentage points in accuracy depending on which rows landed in which fold. Repeating the procedure 5 or 10 times and averaging tightens that variance, which is why `repeatedcv` is caret's default recommendation for small-to-medium data.

## createMultiFolds() syntax and arguments

**`createMultiFolds()` accepts three arguments and returns a list of training indices.** The signature is minimal because the function inherits stratification logic from `createFolds()` under the hood.

```r title="Load caret and inspect the outcome"
library(caret)

set.seed(1)
str(iris$Species)
#>  Factor w/ 3 levels "setosa","versicolor",..: 1 1 1 1 1 1 1 1 1 1 ...
length(iris$Species)
#> [1] 150
```

The signature:

```r title="createMultiFolds signature"
createMultiFolds(y, k = 10, times = 5)
```

- `y`: the outcome vector. Factors trigger per-class stratification; numerics are binned by quantile, identical to `createFolds()`.
- `k`: number of folds per repetition. 10 is the conventional default for small data; 5 is common when models are slow to fit.
- `times`: number of repetitions of the full k-fold procedure. The output list has `k * times` elements.

There is no `returnTrain` flag because the function always returns training indices. That is the opposite of `createFolds()`, which returns test indices by default. The reason is integration: `trainControl(method = "repeatedcv")` consumes training indices through its `index` argument, so caret made `createMultiFolds()` match that shape directly.

[KEY INSIGHT]
**`createMultiFolds()` and `createFolds()` use opposite defaults.** `createFolds()` returns test indices unless you set `returnTrain = TRUE`; `createMultiFolds()` always returns training indices and has no flag to flip. Mixing the two in the same script is the most common source of off-by-complement bugs.

## createMultiFolds() examples by use case

**Most repeated-CV workflows either iterate over the list directly or hand the list to `trainControl()`.** The examples below build from the raw output to a fully wired `train()` call.

A 5-fold by 3-repetition resample on the iris species column:

```r title="Stratified 5x3 repeated CV indices"
set.seed(42)
folds <- createMultiFolds(iris$Species, k = 5, times = 3)
length(folds)
#> [1] 15
names(folds)[1:6]
#> [1] "Fold1.Rep1" "Fold2.Rep1" "Fold3.Rep1" "Fold4.Rep1" "Fold5.Rep1" "Fold1.Rep2"
sapply(folds, length)[1:3]
#> Fold1.Rep1 Fold2.Rep1 Fold3.Rep1 
#>        120        120        120
```

Fifteen elements, each carrying 120 training rows (the four non-held-out folds of 30 rows each). Loop over the list to train on `iris[folds[[i]], ]` and predict on `iris[-folds[[i]], ]`.

A hand-rolled repeated-CV loop that averages RMSE across all `k * times` folds:

```r title="Custom repeated CV with createMultiFolds"
library(caret)

set.seed(123)
folds <- createMultiFolds(mtcars$mpg, k = 5, times = 3)
rmse  <- numeric(length(folds))

for (i in seq_along(folds)) {
  train_idx <- folds[[i]]
  train_set <- mtcars[ train_idx, ]
  test_set  <- mtcars[-train_idx, ]
  fit       <- lm(mpg ~ wt + hp, data = train_set)
  preds     <- predict(fit, test_set)
  rmse[i]   <- sqrt(mean((test_set$mpg - preds)^2))
}

mean(rmse)
#> [1] 2.794165
sd(rmse)
#> [1] 0.7869868
```

The mean is the repeated-CV point estimate; the standard deviation across the 15 folds gives you a feel for fold-level variance, which is the whole reason you repeated the procedure.

Per-repetition averaging when you want one RMSE per repetition rather than per fold:

```r title="Average within each repetition"
rep_id <- sub(".*Rep", "", names(folds))
rmse_by_rep <- tapply(rmse, rep_id, mean)
rmse_by_rep
#>        1        2        3 
#> 2.728961 2.875132 2.778402
```

Three numbers, one per repetition, each averaged across its 5 folds. This is the shape caret uses internally when it prints "Resampling: Cross-Validated (5 fold, repeated 3 times)" in `train()` output.

Passing the indices straight into `train()` for a model comparison:

```r title="Reuse the same folds across two models"
set.seed(123)
folds <- createMultiFolds(mtcars$mpg, k = 5, times = 3)
ctrl  <- trainControl(method = "repeatedcv", index = folds)

lm_fit  <- train(mpg ~ wt + hp, data = mtcars, method = "lm",  trControl = ctrl)
rpart_fit <- train(mpg ~ wt + hp, data = mtcars, method = "rpart", trControl = ctrl)

lm_fit$results$RMSE
#> [1] 2.794165
rpart_fit$results$RMSE[1]
#> [1] 3.41213
```

Both models train on identical folds, so the RMSE difference reflects model behavior rather than fold randomness.

[TIP]
**Seed once before `createMultiFolds()` and freeze the folds for every comparison.** The function consumes the active RNG state, so re-calling it without `set.seed()` produces different folds on every run. Build the fold list once, pass it through `trainControl(index = ...)`, and every model you compare sees the same splits.

## createMultiFolds() vs createFolds() and trainControl()

**`createMultiFolds()` is the repeated-CV cousin of `createFolds()`.** Both stratify the same way; the difference is the repetition loop and the default index direction.

| Function | Default returns | Output length | Used when |
|---|---|---|---|
| `createFolds(y, k = 10)` | test indices (list) | k | one round of k-fold CV |
| `createMultiFolds(y, k = 10, times = 5)` | training indices (list) | k * times | repeated k-fold CV |
| `createDataPartition(y, p = 0.7)` | training indices (list of 1) | 1 | initial train/test split |
| `createResample(y, times = 25)` | training indices (list) | times | bootstrap resamples |
| `trainControl(method = "repeatedcv")` | a control object | NA | inside `caret::train()` |

If you are already calling `train()`, skip `createMultiFolds()` and pass `trainControl(method = "repeatedcv", number = 10, repeats = 5)`; caret builds the folds for you. Reach for `createMultiFolds()` directly when you need a manual loop outside `train()`, or when you want to reuse identical folds across several `train()` calls for an apples-to-apples comparison.

## Common pitfalls

**Three mistakes account for most repeated-CV bugs.** Each one has a clear signature in the fold list or output.

The first is mixing up the index direction. `createFolds()` returns test indices by default and `createMultiFolds()` returns training indices, with no flag to flip on `createMultiFolds()`. If you ported a CV loop from `createFolds()` and forgot to flip the slicing, your training set is 30 rows and your test set is 120; the RMSE will spike, and the per-fold sizes via `sapply(folds, length)` will show this.

The second is asking for too many repetitions on a slow model. Output length is `k * times`, so 10-fold by 10-reps is 100 model fits. Random forest on a 10,000-row dataset can easily push that into the hour range. Start with `times = 5`, profile one fit, then scale up only if variance across repetitions is still wide.

[WARNING]
**Time-ordered data needs a different resampler.** `createMultiFolds()` shuffles rows by class, so future rows leak into the training set when the outcome is ordered by time. Use `createTimeSlices()` or a manual time-based window for any temporal target; repeated random k-fold gives optimistic metrics on time series.

The third is using `createMultiFolds()` when `createDataPartition()` is what you want. `createDataPartition()` returns ONE training-index vector for a single train/test split, not folds for CV. If your goal is to carve out a holdout set before any CV, that is the function; `createMultiFolds()` is for the CV phase that follows.

## Try it yourself

**Try it:** Build a stratified 5-fold by 2-repetition set on `iris$Species` and confirm the list has 10 elements named `FoldX.RepY`.

```r title="Your turn: 5x2 repeated CV"
set.seed(7)
ex_folds <- # your code here

length(ex_folds)
#> Expected: 10
head(names(ex_folds), 3)
#> Expected: "Fold1.Rep1" "Fold2.Rep1" "Fold3.Rep1"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(7)
ex_folds <- createMultiFolds(iris$Species, k = 5, times = 2)

length(ex_folds)
#> [1] 10
head(names(ex_folds), 3)
#> [1] "Fold1.Rep1" "Fold2.Rep1" "Fold3.Rep1"
```

**Explanation:** `k * times` is `5 * 2 = 10`, so the list holds 10 elements. The naming follows `Fold<i>.Rep<j>`, which is the exact string format `trainControl(method = "repeatedcv")` produces internally and lets you slice by repetition with a simple `sub()` call.

</details>

## Related caret functions

Caret's resampling family covers every standard cross-validation strategy. `createMultiFolds()` is for repeated k-fold; the others handle adjacent cases.

- `createFolds(y, k = 10)`: single k-fold CV; returns test indices by default.
- `createDataPartition(y, p = 0.7)`: one stratified train/test cut before any CV.
- `createResample(y, times = 25)`: bootstrap resamples for `method = "boot"`.
- `createTimeSlices(y, initialWindow, horizon)`: rolling-origin folds for time series.
- `trainControl(method = "repeatedcv", number = 10, repeats = 5)`: the wrapper that calls `createMultiFolds()` internally.

The conventional workflow is split once with `createDataPartition()`, then cross-validate the training partition through `trainControl(method = "repeatedcv")`; you only call `createMultiFolds()` directly for a custom loop or when comparing models on frozen folds.

## FAQ

**What is the difference between createMultiFolds() and createFolds()?**

`createFolds()` runs k-fold cross-validation once and returns test indices by default. `createMultiFolds()` runs the whole k-fold procedure `times` times and returns training indices, with no option to flip. The output list length is `k` for `createFolds()` and `k * times` for `createMultiFolds()`. Use `createFolds()` when one round of CV is enough, and `createMultiFolds()` when variance across folds is wide enough that you want to average over repetitions.

**Why does createMultiFolds() return training indices instead of test indices?**

caret designed it that way so the output drops directly into `trainControl(index = folds)`, which expects training indices. `createFolds()` predates that integration and defaulted to test indices. Flip the slicing with the minus sign (`mtcars[-train_idx, ]`) for the holdout fold.

**How many repetitions should I use with createMultiFolds()?**

Five is the standard starting point. If your model is fast to fit and you see noticeable variance across the five repetitions, bump to 10. Above 10 the marginal variance reduction is small relative to the doubled compute cost.

**Can I pass createMultiFolds() output directly to trainControl()?**

Yes, via `trainControl(method = "repeatedcv", index = folds)` where `folds` is the list returned by `createMultiFolds()`. The function-name match is intentional, and reusing one fold list across several `train()` calls is the canonical way to compare models without contaminating the comparison with fold-randomness noise.

**Does createMultiFolds() stratify numeric outcomes?**

Yes. It delegates to `createFolds()` internally, which cuts a numeric outcome into quantile bins and samples within each bin. The resulting folds keep the outcome distribution close to the full data, which matters most when the response is skewed or has heavy tails. For a regression target like `mtcars$mpg` this stratification is invisible but real.
