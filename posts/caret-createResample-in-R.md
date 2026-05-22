---
title: "caret createResample() in R: Bootstrap Sample Indexes"
slug: "caret-createResample-in-R"
description: "caret createResample() in R draws stratified bootstrap samples with replacement. Syntax, times argument, examples, OOB rows, pitfalls, and FAQ covered."
keywords: "caret createResample, createResample function R, caret createResample examples, R bootstrap resampling caret, createResample bootstrap, caret bootstrap sample indexes, createResample vs createFolds"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "caret-functions"
fr_parent: "R-Tutorial.html"
auto_link_terms: "createResample()|caret createResample|caret::createResample()|bootstrap resampling|bootstrap sample indexes"
auto_link_case_sensitive: true
target_keyword: "caret createResample"
sibling_block_enabled: true
difficulty: "Beginner"
---

# caret createResample() in R: Bootstrap Sample Indexes

<p class="lead">The <code>createResample()</code> function in caret draws bootstrap samples with replacement, returning a list of training-row indexes where each resample is the same size as the input vector. Roughly 63.2% of the original rows appear in each resample, the rest are out-of-bag, and factor outcomes are sampled within class to keep the bootstrap stratified.</p>

[QUICK ANSWER]
createResample(y, times = 25)                       # 25 bootstrap resamples (list)
createResample(y, times = 100)                      # 100 resamples for tighter CIs
createResample(y, times = 25, list = FALSE)         # matrix, one column per resample
createResample(iris$Species, times = 10)            # stratify by factor levels
createResample(mtcars$mpg, times = 10)              # numeric outcome, plain sampling
length(unique(resamples$Resample01)) / length(y)    # ~0.632 unique fraction
setdiff(seq_along(y), resamples$Resample01)         # out-of-bag rows for resample 1

[DECISION TREE: Is createResample() the right tool?]
- bootstrap resamples for variance estimates: createResample(y, times = 100)
- k-fold cross-validation indexes: createFolds(y, k = 10)
- repeated k-fold CV: createMultiFolds(y, k = 5, times = 3)
- one stratified train/test split: createDataPartition(y, p = 0.7)
- rolling-origin time-series folds: createTimeSlices(y, initialWindow, horizon)
- automate bootstrap inside train(): trainControl(method = "boot", number = 25)
- leave-one-out resampling: createFolds(y, k = length(y))

## What createResample() does in one sentence

**`createResample()` is caret's bootstrap sampler.** You give it an outcome vector and a count, and it returns a named list of integer vectors, each one a bootstrap sample drawn with replacement from the row positions of the outcome.

The function exists because most bootstrap workflows need stratified training indexes, and writing `sample(seq_along(y), replace = TRUE)` by hand ignores the outcome distribution. `createResample()` samples within each class for factor outcomes, so a resample on a 50/50 binary target stays close to 50/50 even with replacement noise. The output shape matches what `caret::train()` expects via `trainControl(method = "boot")`, so the same indexes that drive a manual bootstrap loop can be plugged straight into a `train()` call.

## createResample() syntax and arguments

**`createResample()` needs only an outcome vector; the rest is shape and count.** Three arguments cover every option the function exposes.

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

```r title="createResample signature"
createResample(y, times = 10, list = TRUE)
```

- `y`: the outcome vector. Factors trigger per-class sampling with replacement; numerics are sampled across the whole vector.
- `times`: number of bootstrap resamples. 25 is the caret default for `trainControl(method = "boot")`, 100 is common for stable bootstrap confidence intervals.
- `list`: if `TRUE` (the default), return a named list of integer vectors, one per resample. Set to `FALSE` to get an integer matrix where each column is one resample.

Every element of the returned list has the same length as `y`, because bootstrap resamples are full-size draws with replacement, not partitions. That is the first difference from `createFolds()`, where fold sizes sum to the input length rather than each matching it.

[NOTE]
**Coming from Python scikit-learn?** The closest equivalent is `resample(X, y, n_samples = len(y), stratify = y)` from `sklearn.utils`. Both draw with replacement and stratify on a factor outcome; `createResample()` returns indexes in one shot and lets you generate many resamples in a single call via `times`.

## createResample() examples by use case

**Most bootstrap workflows grab the list, iterate over it, and refit per resample.** The examples below build from the basic list output up to a hand-rolled bootstrap loop with out-of-bag prediction.

A 10-resample bootstrap on the iris species column:

```r title="Stratified bootstrap on a factor outcome"
set.seed(42)
boots <- createResample(iris$Species, times = 10)
names(boots)
#>  [1] "Resample01" "Resample02" "Resample03" "Resample04" "Resample05"
#>  [6] "Resample06" "Resample07" "Resample08" "Resample09" "Resample10"
sapply(boots, length)
#> Resample01 Resample02 Resample03 Resample04 Resample05 Resample06 
#>        150        150        150        150        150        150 
#> Resample07 Resample08 Resample09 Resample10 
#>        150        150        150        150
table(iris$Species[boots$Resample01])
#> 
#>     setosa versicolor  virginica 
#>         50         50         50
```

Each resample is 150 rows (same as the input) with the class counts preserved, because caret sampled with replacement inside each level of `Species`. Loop over the list to fit one model per resample.

The unique-row fraction is the bootstrap fingerprint:

```r title="Out-of-bag fraction per resample"
set.seed(42)
boots <- createResample(iris$Species, times = 10)
unique_frac <- sapply(boots, function(idx) length(unique(idx)) / 150)
round(unique_frac, 3)
#> Resample01 Resample02 Resample03 Resample04 Resample05 Resample06 
#>      0.633      0.660      0.640      0.633      0.633      0.620 
#> Resample07 Resample08 Resample09 Resample10 
#>      0.620      0.620      0.640      0.620
mean(unique_frac)
#> [1] 0.6319
```

The average sits near 0.632, which is the limit of `1 - (1 - 1/n)^n` as n grows. The rows missing from each resample are the out-of-bag set used for honest error estimates in the .632 bootstrap.

The same call with `list = FALSE` returns a matrix:

```r title="Matrix output for vectorised loops"
set.seed(42)
boot_mat <- createResample(iris$Species, times = 5, list = FALSE)
dim(boot_mat)
#> [1] 150   5
head(boot_mat[, 1])
#> [1] 49 65 25 74 33 36
```

The matrix has 150 rows (one per training-position slot) and 5 columns (one per resample). Column-major iteration with `apply(boot_mat, 2, your_fn)` runs slightly faster than list iteration for large `times`.

A hand-rolled bootstrap loop that fits a model per resample and averages out-of-bag RMSE:

```r title="Custom bootstrap with OOB RMSE"
library(caret)

set.seed(123)
boots <- createResample(mtcars$mpg, times = 25)
oob_rmse <- numeric(length(boots))

for (i in seq_along(boots)) {
  train_idx <- boots[[i]]
  oob_idx   <- setdiff(seq_len(nrow(mtcars)), train_idx)
  fit       <- lm(mpg ~ wt + hp, data = mtcars[train_idx, ])
  preds     <- predict(fit, mtcars[oob_idx, ])
  oob_rmse[i] <- sqrt(mean((mtcars$mpg[oob_idx] - preds)^2))
}

mean(oob_rmse)
#> [1] 2.794958
```

The loop uses `setdiff()` to find rows missing from the resample, fits on the bootstrap sample, and scores on the held-out rows. Swap `lm()` for any modelling function; the structure is unchanged.

[TIP]
**Seed once before the call, not inside the loop.** `createResample()` reads the active RNG state on every internal sample, so seeding before the function and using its output gives you the same 25 resamples every run. Seeding inside the loop after the call has no effect on the indexes; it only affects model fitting.

## createResample() vs createFolds() and trainControl()

**`createResample()` draws bootstrap samples; `createFolds()` partitions for cross-validation; `trainControl(method = "boot")` runs the bootstrap for you.** Pick by what kind of resampling variance you need.

| Function | Sampling | Each element | Used when |
|---|---|---|---|
| `createResample(y, times = 25)` | with replacement, size n | training indexes | bootstrap CI, .632 estimators |
| `createFolds(y, k = 10)` | without replacement, partition | test indexes | k-fold cross-validation |
| `createMultiFolds(y, k = 5, times = 3)` | without replacement, partition | training indexes | repeated k-fold CV |
| `createDataPartition(y, p = 0.7)` | without replacement, one split | training indexes | initial holdout |
| `trainControl(method = "boot", number = 25)` | with replacement, size n | a control object | inside `caret::train()` |

If you are calling `train()`, pass `trainControl(method = "boot", number = 25)` and caret runs `createResample()` internally. Call `createResample()` directly when you need a bootstrap loop outside `train()`, such as bootstrapping a custom statistic (a median, a quantile, a feature-importance score) where you control the per-resample computation.

## Common pitfalls

**Three mistakes cause most bootstrap bugs.** Each one shows up in the resample diagnostics before model fitting.

The first is treating the list elements as test indexes. `createResample()` returns TRAINING indexes; the out-of-bag rows are `setdiff(seq_along(y), boots[[i]])`. Indexing `mtcars[boots[[1]], ]` gives you the training set, not the holdout. This is the opposite of `createFolds()`, where the default list holds test indexes.

The second is forgetting that duplicated rows inflate row-weighted losses. A row appearing 4 times in a resample contributes 4x to the loss. That is correct bootstrap behaviour for trees and regression, but weighted estimators may need a frequency vector instead.

[WARNING]
**Bootstrap is not a substitute for a held-out test set.** The .632 estimator from `createResample()` corrects in-sample optimism, but it does not replace a true holdout when comparing models across many tuning configurations. Keep a `createDataPartition()` cut on top of any bootstrap workflow you plan to publish.

The third is comparing models with different `set.seed()` values upstream of `createResample()`. Two different seeds give two different sets of 25 resamples, so any RMSE difference between models is partly resample noise rather than a real model effect. Seed once before the resample call and freeze the resample list for every model you compare.

## Try it yourself

**Try it:** Build a 50-resample bootstrap on `iris$Species` and confirm the average unique-row fraction sits near 0.632.

```r title="Your turn: bootstrap unique fraction"
set.seed(7)
ex_boots <- # your code here

ex_frac <- sapply(ex_boots, function(idx) length(unique(idx)) / 150)
round(mean(ex_frac), 3)
#> Expected: ~0.632
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(7)
ex_boots <- createResample(iris$Species, times = 50)

ex_frac <- sapply(ex_boots, function(idx) length(unique(idx)) / 150)
round(mean(ex_frac), 3)
#> [1] 0.633
```

**Explanation:** The unique-row fraction converges to `1 - 1/e` (about 0.632) as `n` grows. With 50 resamples on a 150-row vector, the empirical mean lands close to that limit, confirming bootstrap behaviour.

</details>

## Related caret functions

Caret ships a small family of resampler functions. `createResample()` is the one for bootstrap; the others handle non-bootstrap resampling strategies.

- `createFolds(y, k = 10)`: k-fold cross-validation indexes (partition, no replacement).
- `createMultiFolds(y, k = 5, times = 3)`: repeated k-fold for `method = "repeatedcv"`.
- `createDataPartition(y, p = 0.7)`: one stratified train/test split before any resampling.
- `createTimeSlices(y, initialWindow, horizon)`: rolling-origin folds for time-series outcomes.
- `trainControl(method = "boot", number = 25)`: the wrapper that calls `createResample()` internally inside `train()`.

For an authoritative argument reference see the [caret documentation on data splitting](https://topepo.github.io/caret/data-splitting.html). The usual pipeline splits once with `createDataPartition()`, then resamples the training partition via `trainControl(method = "boot")` or `"cv"`; call `createResample()` directly only for manual bootstrap loops.

## FAQ

**What is the difference between createResample() and createFolds()?**

`createResample()` draws bootstrap samples with replacement, so each resample is the same size as the input vector and some rows appear multiple times. `createFolds()` partitions the data without replacement into k disjoint groups so each row lands in exactly one fold. Use `createResample()` for bootstrap variance estimates and .632-style error correction; use `createFolds()` for k-fold cross-validation where every row should be held out exactly once.

**Why does createResample() return training indexes by default?**

Most bootstrap workflows refit a model on each resample, so caret defaulted the list to training indexes for convenience. The convention is the opposite of `createFolds()`, which defaults to test indexes because CV loops typically iterate over the held-out fold. Compute the out-of-bag set with `setdiff(seq_along(y), boots[[i]])` whenever you need the rows not drawn into a resample.

**How many resamples should I pass to times?**

25 is the caret default and gives a stable mean estimate, but bootstrap confidence intervals usually need 100 or more resamples to settle. Push to 500 or 1000 whenever you report a CI; the cost is linear in `times`. For very expensive fits, 25 is a reasonable compromise.

**Does createResample() stratify numeric outcomes?**

No. Stratification only kicks in for factor outcomes; numerics are sampled across the whole vector with replacement, ignoring distribution. For quantile-balanced bootstrap on a numeric target, bin the outcome first with `cut(y, breaks = quantile(y))` and pass the binned factor, or use `rsample::bootstraps()` which offers stratified numeric resampling.

**Can I pass createResample() output directly to trainControl()?**

Yes, via `trainControl(index = my_boots)` where `my_boots` is the list returned by `createResample(y, times = 25)`. This reuses the same resamples across multiple `train()` calls so model comparisons are not contaminated by resample randomness.
