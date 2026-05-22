---
title: "caret trainControl() in R: Configure CV and Resampling"
slug: "caret-trainControl-in-R"
description: "Configure resampling in caret with trainControl(). Set cross-validation, bootstrap, classProbs, sampling, and parallel options. Examples in R included."
keywords: "caret trainControl, trainControl function R, caret trainControl examples, R caret cross validation, trainControl k-fold, caret resampling, trainControl repeatedcv"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "caret-functions"
fr_parent: "R-Tutorial.html"
auto_link_terms: "trainControl()|caret trainControl|caret::trainControl()|trainControl function|caret resampling"
auto_link_case_sensitive: true
target_keyword: "caret trainControl"
sibling_block_enabled: true
difficulty: "Beginner"
---

# caret trainControl() in R: Configure CV and Resampling

<p class="lead">The <code>trainControl()</code> function in caret builds a configuration object that tells <code>train()</code> how to resample, score, and tune a model. One control object can drive every model in a benchmark so all fits share the same folds.</p>

[QUICK ANSWER]
trainControl(method = "cv", number = 10)                           # 10-fold CV
trainControl(method = "repeatedcv", number = 5, repeats = 3)       # repeated CV
trainControl(method = "LOOCV")                                     # leave-one-out
trainControl(method = "boot", number = 100)                        # bootstrap
trainControl(classProbs = TRUE, summaryFunction = twoClassSummary) # AUC
trainControl(sampling = "up")                                      # class imbalance
trainControl(allowParallel = TRUE, savePredictions = "final")      # speed + audit

[DECISION TREE: Is trainControl() the right tool?]
- configure resampling for train(): trainControl(method = "cv", number = 10)
- configure rfe() instead: rfeControl(functions = rfFuncs, method = "cv")
- configure gafs() / safs() instead: gafsControl(), safsControl()
- pre-split the data first: createDataPartition(y, p = 0.7, list = FALSE)
- compare models after fitting: resamples(list(a = fit1, b = fit2))
- score predictions after fitting: postResample(pred, obs)

## What trainControl() does in one sentence

**`trainControl()` is the configuration object behind every `train()` call.** You hand it a resampling method, a fold count, an optional summary function, and audit switches, and it returns a list that `train()` consumes to drive its resampling loop. The object is reusable, so a benchmark of five models on the same folds only writes the control once.

Separating control from fitting matters because caret's `resamples()` requires every model to share resampling indices. If two fits use different `trControl` settings, their comparison is unmatched and the variance estimate is wrong.

## trainControl() syntax and arguments

**The signature has 20+ arguments; the four that matter most are `method`, `number`, `repeats`, and `summaryFunction`.** Everything else is a fine-grained switch you reach for once you know the basics.

```r title="Load caret and inspect defaults"
library(caret)

defaults <- trainControl()
defaults$method
#> [1] "boot"
defaults$number
#> [1] 25
```

The bare minimum is no argument at all; the defaults give you bootstrap with 25 reps.

```
trainControl(method, number, repeats, p, search, classProbs,
             summaryFunction, sampling, savePredictions,
             returnResamp, verboseIter, allowParallel, seeds,
             index, indexOut)
```

- `method`: resampling scheme. `"boot"`, `"boot632"`, `"cv"`, `"repeatedcv"`, `"LOOCV"`, `"LGOCV"`, `"timeslice"`, `"none"`, or `"oob"`.
- `number`: folds (CV) or resamples (bootstrap). Defaults to 10 for CV, 25 for boot.
- `repeats`: repeats of `repeatedcv` (NA otherwise). Common values 3, 5, 10.
- `p`: training fraction for `"LGOCV"`. Default 0.75.
- `search`: `"grid"` or `"random"`; switches tuning strategy when `tuneLength` is supplied.
- `classProbs`: `TRUE` to compute class probabilities. Required for ROC scoring.
- `summaryFunction`: function returning a named metric vector. Built-ins: `defaultSummary`, `twoClassSummary`, `prSummary`, `multiClassSummary`, `mnLogLoss`.
- `sampling`: balances class outcomes per fold. `"up"`, `"down"`, `"smote"`, `"rose"`, or `NULL`.
- `savePredictions`: `"all"`, `"final"`, or `FALSE`. Keeps per-fold predictions.
- `returnResamp`: `"all"`, `"final"`, or `"none"`. Keeps per-fold metrics.
- `verboseIter`, `allowParallel`: progress printing and parallel-backend switch.
- `seeds`, `index`, `indexOut`: custom seeds or hand-built fold indices.

[NOTE]
**Defaults are a quick first pass, not a final answer.** Bootstrap with 25 reps gives a fast variance estimate; switch to `method = "cv"` with 5 or 10 folds before reporting numbers.

## trainControl() examples by use case

### 1. Plain 10-fold cross-validation

The most common configuration. Pass the control object into `train()` and every model in your script uses the same scheme.

```r title="Configure 10-fold CV"
ctrl <- trainControl(method = "cv", number = 10)

set.seed(1)
fit <- train(mpg ~ hp + wt + cyl, data = mtcars,
             method = "lm", trControl = ctrl)
fit$results[, c("RMSE", "Rsquared", "MAE")]
#>     RMSE Rsquared      MAE
#> 1  2.612    0.864    2.103
```

Ten folds is the modelling-literature default; five is acceptable on small data where each fold needs enough rows to estimate the metric stably.

### 2. Repeated cross-validation

Repeats stabilise the fold-to-fold variance estimate, which matters when the metric will go into a report or a paper. Five folds repeated three times costs you 15 model fits instead of 5.

```r title="Configure repeated CV"
ctrl_r <- trainControl(method = "repeatedcv", number = 5, repeats = 3)

set.seed(1)
fit_r <- train(mpg ~ hp + wt + cyl, data = mtcars,
               method = "lm", trControl = ctrl_r)
nrow(fit_r$resample)
#> [1] 15
```

The `resample` slot has one row per (fold, repeat) so a 5x3 design yields 15 entries.

### 3. AUC scoring for binary classification

ROC scoring needs two opt-ins: `classProbs = TRUE` so caret returns class probabilities, and `summaryFunction = twoClassSummary` so it actually computes AUC, Sensitivity, and Specificity.

```r title="Configure AUC scoring"
ctrl_auc <- trainControl(method = "cv", number = 5,
                         classProbs = TRUE,
                         summaryFunction = twoClassSummary)

set.seed(1)
iris_bin <- subset(iris, Species != "setosa")
iris_bin$Species <- factor(iris_bin$Species)

fit_auc <- train(Species ~ ., data = iris_bin,
                 method = "glm", family = "binomial",
                 trControl = ctrl_auc, metric = "ROC")
fit_auc$results[, c("ROC", "Sens", "Spec")]
#>     ROC  Sens  Spec
#> 1  0.99  0.96  0.96
```

[KEY INSIGHT]
**The metric name in `train()` must match what `summaryFunction` returns.** `twoClassSummary` produces `ROC`, `Sens`, `Spec`; `prSummary` produces `AUC`, `Precision`, `Recall`, `F`. A typo silently falls back to the first column of the summary output.

### 4. Handle class imbalance with sampling

Up-sampling the minority class inside every fold prevents leakage that would happen if you balanced once before `train()`.

```r title="Up-sample inside resampling"
set.seed(1)
imb <- data.frame(
  x = rnorm(200),
  y = factor(c(rep("yes", 20), rep("no", 180)))
)

ctrl_up <- trainControl(method = "cv", number = 5, sampling = "up")
fit_up <- train(y ~ x, data = imb, method = "glm",
                family = "binomial", trControl = ctrl_up)
fit_up$results$Accuracy
#> [1] 0.65
```

Swap `"up"` for `"down"` to remove majority rows, or `"smote"` (needs the `themis` or `DMwR` package) for synthetic interpolation.

### 5. Custom holdouts with index and indexOut

For time-ordered or grouped data, hand-build the fold indices so the same group is never split across train and test. `index` is the rows used to fit; `indexOut` is the held-out rows.

```r title="Configure leave-one-group-out"
set.seed(1)
groups <- rep(1:5, each = 30)
df <- data.frame(x = rnorm(150), y = rnorm(150), grp = groups)

idx <- lapply(1:5, function(g) which(df$grp != g))
idx_out <- lapply(1:5, function(g) which(df$grp == g))

ctrl_lg <- trainControl(method = "cv", index = idx, indexOut = idx_out)
fit_lg <- train(y ~ x, data = df, method = "lm", trControl = ctrl_lg)
nrow(fit_lg$resample)
#> [1] 5
```

This pattern handles panel data, clinical sites, or any setting where rows within a group are correlated.

### 6. Save predictions for downstream audit

`savePredictions = "final"` keeps per-fold predictions for the winning tune only; `"all"` keeps them for every tune row (expensive on big grids).

```r title="Persist out-of-fold predictions"
ctrl_keep <- trainControl(method = "cv", number = 5,
                          savePredictions = "final")
set.seed(1)
fit_keep <- train(mpg ~ ., data = mtcars,
                  method = "lm", trControl = ctrl_keep)
head(fit_keep$pred[, c("pred", "obs", "Resample")], 3)
#>      pred  obs Resample
#> 1   21.46 21.0    Fold1
#> 2   16.79 18.7    Fold1
#> 3   25.07 22.8    Fold1
```

These rows feed calibration plots, residual diagnostics, and stacking models built on out-of-fold scores.

[TIP]
**Set `allowParallel = TRUE` and register a backend before fitting expensive models.** With `library(doParallel); registerDoParallel(cores = 4)`, the inner fold loop runs across CPU cores and 10-fold CV roughly quarters in wall time.

## trainControl() vs other caret control objects

**caret has a separate control function for each high-level routine; `trainControl()` only configures `train()`.** Use the matching control object for the routine you are running.

| Control object | Drives | Key arguments unique to it |
|---|---|---|
| `trainControl()` | `train()` | `summaryFunction`, `sampling`, `tuneGrid` interplay |
| `rfeControl()` | `rfe()` (recursive feature elimination) | `functions`, `rerank`, `returnResamp` |
| `gafsControl()` | `gafs()` (genetic algorithm feature selection) | `functions`, `holdout`, `genParallel` |
| `safsControl()` | `safs()` (simulated annealing feature selection) | `functions`, `improve`, `holdout` |
| `sbfControl()` | `sbf()` (selection by filtering) | `functions`, `multivariate` |

Mixing them is a silent bug: `train(trControl = rfeControl(...))` accepts the object because R duck-types lists, but the resampling will not behave as you expect. Always pair `train()` with `trainControl()`. The full reference for every argument lives in [topepo.github.io/caret/model-training-and-tuning.html](https://topepo.github.io/caret/model-training-and-tuning.html).

## Common pitfalls

**Pitfall 1: forgetting `classProbs = TRUE` before scoring with ROC.** `twoClassSummary` reads class probabilities from the prediction frame; without `classProbs`, those columns do not exist and the summary returns `NA`. caret then picks the first non-NA column as the optimisation target, which is usually Accuracy, and your "AUC tuning" silently optimises Accuracy.

**Pitfall 2: rebuilding the control object inside every `train()` call.** A fresh `trainControl()` generates new fold indices (unless you set `seeds`). Two models with separate control objects sit on different folds and cannot be compared with `resamples()`. Build the control once, then reuse it.

**Pitfall 3: setting `sampling = "up"` outside `trainControl()`.** Upsampling before you call `train()` leaks information into every fold because the same synthetic minority rows appear in train and test partitions. Keep the sampling inside the control so it runs per fold.

[WARNING]
**`trainControl()` returns a configuration, not a result.** It does no resampling itself; the splits happen when `train()` consumes the object. Inspecting `ctrl$index` before passing it to `train()` returns `NULL` unless you handed in explicit indices.

## Try it yourself

**Try it:** Configure a 5-fold repeated CV (3 repeats) with class probabilities and ROC scoring, then fit a logistic regression on `iris_bin`. Save the control to `ex_ctrl` and the fit to `ex_fit`. Report the held-out ROC.

```r title="Your turn: configure repeated CV with ROC"
# Try it: build repeated CV control with ROC
ex_ctrl <- # your code here
ex_fit  <- # your code here

ex_fit$results$ROC
#> Expected: a single ROC value near 0.99
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
iris_bin <- subset(iris, Species != "setosa")
iris_bin$Species <- factor(iris_bin$Species)

ex_ctrl <- trainControl(method = "repeatedcv", number = 5, repeats = 3,
                        classProbs = TRUE,
                        summaryFunction = twoClassSummary)

set.seed(1)
ex_fit <- train(Species ~ ., data = iris_bin,
                method = "glm", family = "binomial",
                trControl = ex_ctrl, metric = "ROC")
ex_fit$results$ROC
#> [1] 0.992
```

**Explanation:** `repeatedcv` with `repeats = 3` runs the 5-fold split three times for a steadier estimate. `classProbs = TRUE` plus `summaryFunction = twoClassSummary` turns on ROC scoring; `metric = "ROC"` in `train()` selects it as the optimisation target.

</details>

## Related caret functions

These caret functions surround `trainControl()` in a typical pipeline:

- `train()`: consumes the control object to fit and tune a model
- `createDataPartition()`: stratified train/test split before resampling
- `resamples()`: compares models on matched folds defined by the control
- `twoClassSummary()`, `prSummary()`, `multiClassSummary()`: built-in summary functions
- `rfeControl()`, `gafsControl()`, `safsControl()`: control objects for feature selection routines

## FAQ

**What is the difference between trainControl() method "cv" and "repeatedcv"?**

`method = "cv"` runs k-fold cross-validation once; `method = "repeatedcv"` runs the whole k-fold scheme multiple times with different random partitions and averages across all the runs. Repeated CV gives a steadier metric estimate at the cost of `repeats x number` model fits instead of `number`. Use it when the headline metric will go into a report or paper, and use plain `"cv"` during model exploration.

**How does trainControl() handle stratified sampling?**

caret stratifies on the outcome variable automatically when it is a factor; numeric outcomes are split on quantile bins so the fold distributions stay close to the population. You do not need a separate argument. If you need a custom stratification (for example, by a grouping variable that is not the outcome), build the fold indices yourself and pass them through `index` and `indexOut`.

**Why does my caret model ignore summaryFunction?**

The metric name in `train(metric = "...")` must match a column the `summaryFunction` returns. `twoClassSummary` returns `ROC`, `Sens`, `Spec`; ask for `metric = "AUC"` and caret falls back to the first column. Inspect the summary output once with `summaryFunction(test_pred, lev = c("yes", "no"), model = "glm")` before plugging it into `trainControl()`.

**Can I use one trainControl() object across multiple train() calls?**

Yes, and that is the recommended pattern. Build the object once, reuse it for every model in a benchmark, then feed the fitted models to `resamples()` for a paired comparison. The same fold indices apply to all models, so any difference in performance comes from the model rather than from a luckier split.

**Does trainControl() set random seeds for me?**

Not by default. Call `set.seed()` before each `train()` for reproducible resampling, or pass an explicit `seeds` list to `trainControl()` for deterministic parallel runs. The `seeds` argument is a list of length `number * repeats + 1` where each element is an integer vector of seeds, one per tune-grid row.
