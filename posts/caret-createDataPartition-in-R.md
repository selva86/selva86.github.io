---
title: "caret createDataPartition() in R: Stratified Train Splits"
slug: "caret-createDataPartition-in-R"
description: "caret createDataPartition() in R creates stratified train/test splits for machine learning models. Syntax, arguments, examples, pitfalls, and FAQ covered."
keywords: "caret createDataPartition, createDataPartition function R, caret createDataPartition examples, R createDataPartition stratified split, createDataPartition train test split, caret partition data, R createDataPartition example"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "caret-functions"
fr_parent: "R-Tutorial.html"
auto_link_terms: "createDataPartition()|caret createDataPartition|caret::createDataPartition()|stratified data partition|stratified train test split"
auto_link_case_sensitive: true
target_keyword: "caret createDataPartition"
sibling_block_enabled: true
difficulty: "Beginner"
---

# caret createDataPartition() in R: Stratified Train Splits

<p class="lead">The <code>createDataPartition()</code> function in caret builds a stratified train/test split, picking row indices so the outcome distribution in the training set mirrors the full data. It works on both factor and numeric outcomes and returns indices you slice into your data frame.</p>

[QUICK ANSWER]
createDataPartition(y, p = 0.7)                       # 70/30 stratified split (list)
createDataPartition(y, p = 0.8, list = FALSE)         # matrix output (1 column)
createDataPartition(y, p = 0.7, times = 5)            # five resamples
createDataPartition(iris$Species, p = 0.75)           # stratify by factor levels
createDataPartition(mtcars$mpg, p = 0.7, groups = 4)  # numeric outcome, 4 strata
df[createDataPartition(y, p = 0.7, list = FALSE), ]   # training rows
df[-createDataPartition(y, p = 0.7, list = FALSE), ]  # holdout rows

[DECISION TREE: Is createDataPartition() the right tool?]
- stratified train/test split: createDataPartition(y, p = 0.7)
- k-fold CV indices: createFolds(y, k = 10)
- bootstrap resamples: createResample(y, times = 25)
- time-series rolling windows: createTimeSlices(y, initialWindow, horizon)
- repeated k-fold CV: createMultiFolds(y, k = 5, times = 3)
- rebalance class imbalance: upSample(x, y) or downSample(x, y)
- unstratified random split: sample.int(n, size = floor(0.7 * n))

## What createDataPartition() does in one sentence

**`createDataPartition()` is caret's stratified splitter for the training set.** You hand it an outcome vector and a target proportion, and it returns the row positions that should belong to the training partition. The remaining rows become your holdout.

The point of stratification is to keep the outcome distribution stable across splits. If your data has 30 percent positives and 70 percent negatives, a plain random split can produce a training set with 35 percent positives and a test set with 22 percent, which biases every metric you compute downstream. `createDataPartition()` avoids this by sampling within each class (for factors) or within each quantile bin (for numeric outcomes), so the training and test sets carry roughly the same outcome shape as the original.

## createDataPartition() syntax and arguments

**`createDataPartition()` needs only an outcome vector and a split proportion.** Every other argument changes the output shape or the strategy used to bin numeric outcomes.

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

```r title="createDataPartition signature"
createDataPartition(y, times = 1, p = 0.5, list = TRUE, groups = min(5, length(y)))
```

- `y`: the outcome vector. A factor triggers per-class stratification; a numeric vector is binned first.
- `times`: how many resamples to generate. Default is 1; raise it for repeated holdout.
- `p`: the proportion that goes to the training set. Common values are 0.7, 0.75, or 0.8.
- `list`: if `TRUE` (the default), return a named list of integer vectors. Set to `FALSE` for a single integer matrix, which is easier to index with.
- `groups`: only used when `y` is numeric. caret cuts `y` into this many quantile bins before sampling, then strata are applied within bins.

[NOTE]
**Coming from Python scikit-learn?** The closest equivalent is `train_test_split(X, y, stratify = y)`. Both stratify on the outcome, but `createDataPartition()` returns indices rather than slicing the data, which keeps the function decoupled from your data frame.

## createDataPartition() examples by use case

**Most splits are one-off and use `list = FALSE` for clean indexing.** The examples below build up from the basic case to repeated and numeric-outcome variants.

A 70/30 stratified split on the iris species column:

```r title="Stratified split on a factor outcome"
set.seed(42)
idx   <- createDataPartition(iris$Species, p = 0.7, list = FALSE)
train <- iris[idx, ]
test  <- iris[-idx, ]

prop.table(table(train$Species))
#> 
#>     setosa versicolor  virginica 
#>  0.3333333  0.3333333  0.3333333
prop.table(table(test$Species))
#> 
#>     setosa versicolor  virginica 
#>  0.3333333  0.3333333  0.3333333
```

Both partitions hold the same 1/3 share for each class because caret sampled inside each level of `Species`.

A 70/30 split on a numeric outcome, using quantile groups:

```r title="Stratified split on a numeric outcome"
set.seed(42)
idx   <- createDataPartition(mtcars$mpg, p = 0.7, groups = 4, list = FALSE)
train <- mtcars[idx, ]
test  <- mtcars[-idx, ]

c(nrow(train), nrow(test))
#> [1] 24  8
summary(train$mpg); summary(test$mpg)
#>    Min. 1st Qu.  Median    Mean 3rd Qu.    Max. 
#>   10.40   15.50   19.20   20.27   22.80   33.90 
#>    Min. 1st Qu.  Median    Mean 3rd Qu.    Max. 
#>   13.30   17.80   19.20   19.61   21.05   30.40
```

The summaries are close because each quartile of `mpg` contributed proportionally to both partitions.

Five repeated 80/20 splits for repeated-holdout validation:

```r title="Multiple resamples in one call"
set.seed(42)
idx_list <- createDataPartition(iris$Species, p = 0.8, times = 5)
names(idx_list)
#> [1] "Resample1" "Resample2" "Resample3" "Resample4" "Resample5"
sapply(idx_list, length)
#> Resample1 Resample2 Resample3 Resample4 Resample5 
#>       120       120       120       120       120
```

Each element is one training set of 120 rows. Loop over `idx_list` to fit and score a model on every resample.

[TIP]
**Set a seed before every call.** `createDataPartition()` uses the active RNG state; calling it without `set.seed()` produces a different split on every run, which makes results irreproducible. A seed of `42` or `1` is enough; the value does not matter, the consistency does.

## createDataPartition() vs sample() and rsample::initial_split()

**`createDataPartition()` is the stratified default; base `sample()` is not stratified, and tidymodels uses `rsample::initial_split()`.** Pick by ecosystem and by whether you need stratification.

| Function | Package | Stratified? | Returns |
|---|---|---|---|
| `createDataPartition()` | caret | Yes (default) | indices |
| `sample()` / `sample.int()` | base R | No | indices |
| `initial_split()` | rsample | Optional via `strata =` | split object |
| `vfold_cv()` | rsample | Optional | resample set |

Use base `sample()` only when class balance is irrelevant or when the dataset is huge and randomization is sufficient. Reach for `rsample::initial_split()` if the rest of your pipeline is tidymodels because it returns a `split` object that feeds straight into `training()` and `testing()`. Stick with `createDataPartition()` when you are already inside caret and want indices you can reuse across `train()`, `predict()`, and metric calls.

## Common pitfalls

**Three mistakes account for most broken splits.** All are easy to spot once you know the symptom.

The first is forgetting `list = FALSE`. The default returns a one-element named list, so `iris[idx, ]` errors because `idx` is a list, not an integer vector. Either set `list = FALSE` or extract with `idx[[1]]`.

The second is passing the wrong column. If `y` is your feature matrix instead of the outcome, the function still runs but stratifies on nonsense. Always pass the outcome column directly, for example `createDataPartition(df$target, ...)`.

[WARNING]
**Time-series data needs a different splitter.** `createDataPartition()` shuffles rows, so it leaks future information into the training set when your data is ordered by time. Use `createTimeSlices()` or a manual time-based filter for any temporal outcome.

The third is reusing the same split across model comparisons without seeding. Two `train()` calls in a row without `set.seed()` produce different folds, so any RMSE difference may be noise. Set the seed once before the first `createDataPartition()` and again before each `train()` call.

## Try it yourself

**Try it:** Build a stratified 75/25 split on `iris$Species` and confirm both partitions hold equal proportions of the three classes.

```r title="Your turn: stratified split"
set.seed(7)
ex_idx   <- # your code here
ex_train <- iris[ex_idx, ]
ex_test  <- iris[-ex_idx, ]

prop.table(table(ex_train$Species))
#> Expected: roughly 1/3 for each class
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(7)
ex_idx   <- createDataPartition(iris$Species, p = 0.75, list = FALSE)
ex_train <- iris[ex_idx, ]
ex_test  <- iris[-ex_idx, ]

prop.table(table(ex_train$Species))
#>     setosa versicolor  virginica 
#>  0.3362832  0.3362832  0.3274336
```

**Explanation:** Passing `iris$Species` as the outcome triggers per-class stratification. Setting `list = FALSE` returns an integer vector you can use to subset rows directly. The slight imbalance (37/37/36) reflects rounding inside each class; the function preserves proportions as closely as the row count allows.

</details>

## Related caret functions

Caret ships several splitters and resamplers; `createDataPartition()` is the one for the initial train/test cut. The others handle the resampling that happens later in a modeling pipeline.

- `createFolds(y, k = 10)`: k-fold cross-validation indices, used by `trainControl(method = "cv")`.
- `createMultiFolds(y, k = 5, times = 3)`: repeated k-fold indices for `method = "repeatedcv"`.
- `createResample(y, times = 25)`: bootstrap resamples for `method = "boot"`.
- `createTimeSlices(y, initialWindow, horizon)`: rolling-origin folds for time-series outcomes.
- `upSample()` / `downSample()`: class-balance the training partition after splitting.

A typical workflow chains these: split once with `createDataPartition()`, then resample the training partition inside `train()` using a `trainControl()` object.

## FAQ

**Why does createDataPartition() return a list by default?**

The list shape comes from the `times` argument. caret expected most users to ask for multiple resamples in one call, so it returns one named element per resample. With `times = 1` you still get a one-element list, which surprises new users. Pass `list = FALSE` for a single integer vector or a one-column matrix, which is simpler to slice your data frame with.

**Is createDataPartition() different from sample() in base R?**

Yes. `sample()` picks rows uniformly at random with no awareness of the outcome, so a rare class can be over or under-sampled by chance. `createDataPartition()` samples within each class (for factor outcomes) or within each quantile bin (for numeric outcomes), so both partitions keep the original outcome distribution. Use `sample()` only when class balance is irrelevant.

**Can I use createDataPartition() with multi-label or multi-output targets?**

Not directly. caret stratifies on a single vector. For a multi-label outcome, concatenate the label columns into a single factor key (for example, `paste(y1, y2, sep = "_")`) and pass that key to `createDataPartition()`, then split your real data using the returned indices. For multi-output regression, pick the most important target as the strata column.

**Does the seed matter and how should I set it?**

Yes. `createDataPartition()` uses the active R RNG, so without `set.seed()` you get a different split every run and your results are not reproducible. Call `set.seed()` immediately before `createDataPartition()` and before every `train()` call that follows. Any integer works; the convention in the caret docs is `set.seed(998)`, but the value itself is arbitrary.

**How does createDataPartition() stratify a numeric outcome?**

caret cuts the numeric vector into quantile bins using the `groups` argument (default 5), then samples within each bin at proportion `p`. This keeps the distribution of `y` similar across train and test. With very small samples or `groups` set higher than `length(y)/2`, the binning becomes unstable and you can end up with empty bins, so cap `groups` at 4 or 5 unless you have thousands of rows.
