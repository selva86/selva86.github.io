---
title: "caret train() in R: Fit and Tune ML Models"
slug: "caret-train-in-R"
description: "Learn how caret train() in R fits, resamples, and tunes machine learning models. trainControl, tuneGrid, preProcess, predict(), and resamples examples."
keywords: "caret train, train function R, caret train examples, R caret train models, caret train cross validation, caret train tuneGrid, caret train classification"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "caret-functions"
fr_parent: "R-Tutorial.html"
auto_link_terms: "train()|caret train|caret::train()|caret train function|train function in caret"
auto_link_case_sensitive: true
target_keyword: "caret train"
sibling_block_enabled: true
difficulty: "Beginner"
---

# caret train() in R: Fit and Tune ML Models

<p class="lead">The <code>train()</code> function in caret fits a predictive model, resamples it to estimate out-of-sample error, and searches over a tuning grid in one call. It accepts 200+ algorithms behind a single formula interface, so swapping methods only changes one argument.</p>

[QUICK ANSWER]
train(y ~ ., data = df, method = "lm")                          # regression
train(y ~ ., data = df, method = "rf")                          # random forest
train(y ~ ., data = df, method = "knn", tuneLength = 5)         # auto-tune k
train(y ~ ., data = df, method = "glmnet", tuneGrid = grid)     # explicit grid
train(y ~ ., data = df, method = "rf", trControl = ctrl)        # custom CV
train(y ~ ., data = df, method = "lm", preProcess = c("center", "scale"))
predict(fit, newdata = test)                                    # score new data

[DECISION TREE: Is train() the right tool?]
- fit and tune one model with resampling: train(y ~ ., data = df, method = "rf")
- compare many fitted models side by side: resamples(list(a = fit1, b = fit2))
- preprocess predictors before modelling: preProcess(df, method = "...")
- one-hot encode factor columns: dummyVars(~ ., data = df)
- pick a stratified train/test split: createDataPartition(y, p = 0.7)
- recursive feature elimination: rfe(x, y, sizes = ..., rfeControl = ...)

## What train() does in one sentence

**`train()` is caret's universal model fitter and tuner.** You hand it a formula, a data frame, and a `method` string, and it loops over a resampling scheme (bootstrap by default), fits the model with every candidate hyperparameter combination, scores each fold, and returns the configuration with the best mean metric. The returned object knows how to `predict()` on new data without any extra wiring.

The point of `train()` is uniform syntax. The same line that fits a linear model fits a gradient boosting machine, a kNN classifier, or a neural net. You change `method = "lm"` to `method = "gbm"` and nothing else. That is why caret is still common for teaching even after tidymodels arrived.

## train() syntax and arguments

**The core signature wraps three ideas: a model, a resampling scheme, and a tuning grid.** Everything else is convenience.

```r title="Load caret and inspect mtcars"
library(caret)

set.seed(1)
head(mtcars[, c("mpg", "hp", "wt", "cyl")], 3)
#>                mpg  hp    wt cyl
#> Mazda RX4     21.0 110 2.620   6
#> Mazda RX4 Wag 21.0 110 2.875   6
#> Datsun 710    22.8  93 2.320   4
```

The bare minimum is a formula and a method.

```
train(form, data, method, trControl, tuneGrid, tuneLength, preProcess, metric)
```

- `form`: a formula like `y ~ .` or an `x` matrix plus a `y` vector.
- `data`: a data frame containing the columns in the formula.
- `method`: a string naming one of 230+ algorithms (`"lm"`, `"rf"`, `"knn"`, `"glmnet"`, `"xgbTree"`, `"gbm"`, `"svmRadial"`, `"rpart"`, `"nnet"`, and many more).
- `trControl`: a `trainControl()` object that defines the resampling strategy (bootstrap, k-fold CV, repeated CV, LOOCV, time slices).
- `tuneGrid`: a data frame of hyperparameter combinations to try. Each row is one candidate.
- `tuneLength`: integer alternative to `tuneGrid`; caret picks `n` values along each hyperparameter axis automatically.
- `preProcess`: a character vector of transformations (`"center"`, `"scale"`, `"BoxCox"`, `"knnImpute"`, ...) applied inside every resampling fold.
- `metric`: the score used to pick the winning tune (`"RMSE"` for regression, `"Accuracy"` or `"ROC"` for classification).

[NOTE]
**Use a formula for small data and the `x`, `y` interface for large data.** The formula path expands factors into a model matrix in memory; for wide data with many factors, pass a pre-built numeric matrix as `x` to skip that step and save memory.

## train() examples by use case

### 1. Fit a regression with defaults

The simplest call regresses mpg on three predictors. caret resamples 25 times with the bootstrap by default and prints RMSE, R-squared, and MAE.

```r title="Train a linear regression"
set.seed(1)
fit_lm <- train(mpg ~ hp + wt + cyl, data = mtcars, method = "lm")
fit_lm
#> Linear Regression
#>
#> 32 samples, 3 predictor
#>
#> No pre-processing
#> Resampling: Bootstrapped (25 reps)
#> Summary of sample sizes: 32, 32, 32, 32, 32, 32, ...
#> Resampling results:
#>
#>   RMSE   Rsquared  MAE
#>   2.65   0.83      2.10
```

The `fit_lm$results` table holds the score for every candidate. With `method = "lm"` there is only one row because linear regression has no hyperparameter to tune.

### 2. Switch to k-fold cross-validation

The default bootstrap is fine for a quick estimate; 5- or 10-fold CV is what you actually want for reportable numbers. Override the resampling with `trainControl()`.

```r title="Run 5-fold cross-validation"
ctrl <- trainControl(method = "cv", number = 5)

set.seed(1)
fit_cv <- train(mpg ~ hp + wt + cyl, data = mtcars,
                method = "lm", trControl = ctrl)
fit_cv$results[, c("RMSE", "Rsquared", "MAE")]
#>     RMSE Rsquared      MAE
#> 1  2.626    0.853    2.122
```

Use `method = "repeatedcv"` with a `repeats` argument when you want repeated cross-validation, or `method = "LOOCV"` for leave-one-out on small datasets.

### 3. Tune a hyperparameter with tuneGrid

For methods that have hyperparameters, supply a data frame of candidates. caret refits the model on every fold for every row of the grid and picks the row with the best mean metric.

```r title="Tune k in a kNN classifier"
data(iris)
set.seed(1)
fit_knn <- train(
  Species ~ ., data = iris, method = "knn",
  trControl = trainControl(method = "cv", number = 5),
  tuneGrid = data.frame(k = c(3, 5, 7, 9, 11))
)
fit_knn$bestTune
#>   k
#> 3 7
```

The `bestTune` slot stores the winning row. `fit_knn$results` shows the full search. If you do not care about exact values and want caret to choose for you, use `tuneLength = 5` and skip the grid.

### 4. Preprocess inside the resampling loop

Pass `preProcess` directly to `train()` so the transformation is estimated inside every fold (and never leaks test statistics into training).

```r title="Standardize predictors during training"
set.seed(1)
fit_pp <- train(
  Species ~ ., data = iris, method = "knn",
  preProcess = c("center", "scale"),
  trControl = trainControl(method = "cv", number = 5),
  tuneLength = 5
)
predict(fit_pp, newdata = iris[c(1, 60, 130), ])
#> [1] setosa     versicolor virginica
#> Levels: setosa versicolor virginica
```

[KEY INSIGHT]
**`preProcess` inside `train()` is the safe default.** Estimating means and standard deviations on the full data before splitting leaks test information into the recipe. Letting `train()` apply the recipe per fold keeps every estimate honest.

### 5. Compare two models with resamples()

After fitting several models on the *same* `trControl`, pass them to `resamples()` to get matched per-fold comparisons.

```r title="Benchmark two classifiers on iris"
set.seed(1)
ctrl <- trainControl(method = "cv", number = 5)
fit_rpart <- train(Species ~ ., data = iris, method = "rpart", trControl = ctrl)
fit_knn2  <- train(Species ~ ., data = iris, method = "knn",   trControl = ctrl)

res <- resamples(list(rpart = fit_rpart, knn = fit_knn2))
summary(res)$statistics$Accuracy[, c("Min.", "Mean", "Max.")]
#>        Min. Mean  Max.
#> rpart 0.900 0.940 0.967
#> knn   0.933 0.960 1.000
```

Because both models saw the same folds, the comparison is paired and `bwplot(res)` or `diff(res)` lets you test whether the gap is real or noise.

## train() vs lm() and tidymodels

**`train()` is the unified caret API; `lm()` and `tidymodels` cover the cases around it.** Reach for `lm()` when you only want a single linear fit with no resampling. Reach for `tidymodels` when you want a modular, pipe-friendly successor that is actively developed.

| Tool | Best for | Tunes hyperparameters | Active development |
|---|---|---|---|
| `train()` | one-line fit + tune + resample across 230 models | Yes, via `tuneGrid` or `tuneLength` | Maintenance mode |
| `lm()` / `glm()` | a single linear or generalized linear fit | No | Stable base R |
| `tidymodels` (`workflows`, `tune`) | modern modular pipelines and recipe-style preprocessing | Yes, via `tune_grid()` | Yes, primary tidyverse modelling stack |

Pick `train()` when you want the shortest path to a tuned, resampled model in a teaching or one-off setting. Move to `tidymodels` for production pipelines where preprocessing, modelling, and tuning steps need to be composed and reused. See the official caret documentation at [topepo.github.io/caret](https://topepo.github.io/caret/) for the full list of supported methods.

## Common pitfalls

**Pitfall 1: forgetting to `set.seed()` before `train()`.** caret's resampling is stochastic. Without a seed, every run returns slightly different metrics and the `bestTune` row can flip between candidates that scored close together.

**Pitfall 2: passing a factor outcome to a regression method.** If `y` is a factor, caret picks a classification scoring scheme; if it is numeric, it picks a regression one. A factor accidentally stored as character gets coerced silently and you train the wrong model. Always check `class(df$y)` first.

**Pitfall 3: tuning on the test set.** `train()` uses the data you hand it for both training and resampling. Split your data with `createDataPartition()` first, run `train()` only on the training partition, then call `predict()` on the held-out test rows.

[WARNING]
**`train()` runs the inner resampling on the data you pass.** It does not hold out a separate test set for you. Split first with `createDataPartition()`, then fit, then evaluate on the held-out fold.

## Try it yourself

**Try it:** Train a 10-fold cross-validated kNN classifier on `iris`, searching `k` over `c(3, 5, 7, 9)`. Save the fitted model to `ex_fit` and report `ex_fit$bestTune`.

```r title="Your turn: tune kNN on iris"
# Try it: tune kNN with 10-fold CV
ex_fit <- # your code here

ex_fit$bestTune
#> Expected: a data frame with one row giving the winning k
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
ex_fit <- train(
  Species ~ ., data = iris, method = "knn",
  trControl = trainControl(method = "cv", number = 10),
  tuneGrid = data.frame(k = c(3, 5, 7, 9))
)
ex_fit$bestTune
#>   k
#> 3 7
```

**Explanation:** `trainControl(method = "cv", number = 10)` switches resampling to 10-fold CV. The `tuneGrid` data frame tells caret which `k` values to try; the winning row lands in `bestTune`.

</details>

## Related caret functions

After `train()`, these caret functions complete a typical modelling loop:

- `trainControl()`: builds the resampling-and-search object passed to `train()`
- `createDataPartition()`: stratified train/test split for any outcome
- `predict.train()`: scores new data with a fitted train object
- `resamples()`: pairs multiple fitted models on the same folds for comparison
- `varImp()`: model-agnostic variable importance for any train object

## FAQ

**What is the difference between train() and trainControl()?**

`train()` fits and tunes the model; `trainControl()` only configures how that fitting happens. You build a `trainControl` object once (saying "5-fold CV, repeated 3 times, with up-sampling for class imbalance") and pass it into every `train()` call so all your models share the same resampling scheme. Keeping the control object separate is what lets `resamples()` later compare models on matched folds.

**How does caret train() handle hyperparameter tuning?**

For each row of `tuneGrid`, caret refits the model on every resample, scores it on the held-out fold, and averages the metric across folds. The candidate with the best mean wins and is stored in `bestTune`. If you do not supply `tuneGrid`, `tuneLength` tells caret how many points to sample along each hyperparameter axis. With neither argument, caret uses a small built-in default grid for the chosen method.

**Why is my caret train() so slow?**

Resampling multiplies the cost: 5-fold CV times a 10-row tune grid means 50 model fits, not one. Speed it up with `trainControl(allowParallel = TRUE)` plus a registered parallel backend, by reducing `number` or grid size during exploration, or by precomputing preprocessing once if you do not need it inside the resampling loop. A profiled tip: `gbm` and `rf` are slow per fit, `glmnet` and `rpart` are fast.

**Can train() do classification and regression?**

Yes. caret picks the task from the outcome's class: a factor `y` triggers classification (with `Accuracy` or `ROC` as the metric depending on `trainControl(classProbs = TRUE, summaryFunction = ...)`), and a numeric `y` triggers regression (`RMSE` by default). The same `method` strings often serve both; for example, `method = "rf"` fits a random forest either way and reads the outcome class to choose splits.
