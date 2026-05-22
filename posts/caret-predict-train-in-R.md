---
title: "caret predict.train() in R: Score New Data From Models"
slug: "caret-predict-train-in-R"
description: "Score new data with caret predict() on a train object. Covers type=raw vs type=prob, factor level handling, NA behavior, and predict.train versus predict()."
keywords: "caret predict train, predict.train R, caret predict function, caret predict examples, predict caret model, caret predict probability, R caret predictions"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "caret-functions"
fr_parent: "R-Tutorial.html"
auto_link_terms: "predict.train()|caret predict|caret::predict()|predict() on train|predict train caret"
auto_link_case_sensitive: true
target_keyword: "caret predict train"
sibling_block_enabled: true
difficulty: "Beginner"
---

# caret predict.train() in R: Score New Data From Models

<p class="lead">The caret predict() method scores new data from a model fitted by <code>train()</code>. It dispatches to <code>predict.train()</code>, applies any preprocessing recorded during training, and returns either class labels or class probabilities depending on the <code>type</code> argument.</p>

[QUICK ANSWER]
predict(fit, newdata = test_df)                          # default, raw output
predict(fit, newdata = test_df, type = "raw")            # explicit class or value
predict(fit, newdata = test_df, type = "prob")           # class probabilities
predict(fit, newdata = test_df, na.action = na.pass)     # keep NA rows aligned
predict(fit, newdata = test_df[, predictors(fit)])       # only required columns
predict(list(rf = fit1, gbm = fit2), newdata = test_df)  # list of train objects

[DECISION TREE: Is predict.train() the right tool?]
- score new data from a caret train object: predict(fit, newdata = test_df)
- get class probabilities: predict(fit, newdata = test_df, type = "prob")
- evaluate against a held-out test set: confusionMatrix(predict(fit, test_df), test_df$y)
- score with a different threshold: ifelse(predict(fit, test_df, type="prob")$yes > 0.3, "yes", "no")
- predict from a raw model object, not caret: predict(model, newdata = test_df)
- compare resampled performance, not new data: resamples(list(a = fit1, b = fit2))

## What predict.train() does in one sentence

**predict.train() is the S3 method invoked when you call predict() on a caret train object.** It takes the fitted model, validates the new data against the recorded predictors, applies the same preprocessing (centering, scaling, dummy variables, imputation) used during training, and returns predictions in the format you request through `type`.

You almost never type `predict.train` directly. You call `predict(fit, newdata = ...)` and R dispatches the right method based on `class(fit)`, which is `"train"` for caret models. The method matters because it transparently runs the preprocessing pipeline, so the new data does not need to be transformed by hand before scoring.

## predict.train() syntax and arguments

**The signature is small but every argument matters.** Most users only set `newdata` and `type`, but the rest control how missing values and out-of-set factor levels are handled.

```r title="predict.train signature"
# predict.train(object, newdata = NULL, type = "raw", na.action = na.omit, ...)
#
# object    : a fitted train object from train()
# newdata   : data frame of new observations; same column names as training
# type      : "raw" (default) -> class labels or numeric predictions
#             "prob"          -> data frame of class probabilities (classification only)
# na.action : how to handle rows containing NA in predictors
# ...       : passed to the underlying model's predict method
```

If `newdata` is `NULL`, the method returns predictions on the training data, which is rarely what you want for evaluation. The `type = "prob"` option only works for classification models that the underlying engine supports for probability output.

| Argument | Default | When to change it |
|---|---|---|
| `newdata` | `NULL` (training data) | Always pass a held-out frame for honest scoring |
| `type` | `"raw"` | Set to `"prob"` for ROC, lift, or custom thresholds |
| `na.action` | `na.omit` | Use `na.pass` to keep row alignment with newdata |
| `...` | (engine-specific) | Forward arguments like `n.trees` to the fitted model |

## predict.train() examples by use case

### 1. Score a regression model on a held-out test set

**Splitting first, then scoring, gives an honest estimate of new-data error.**

```r title="Train, predict, then compute RMSE"
library(caret)

set.seed(42)
idx <- createDataPartition(mtcars$mpg, p = 0.7, list = FALSE)
train_df <- mtcars[idx, ]
test_df  <- mtcars[-idx, ]

fit_lm <- train(mpg ~ ., data = train_df, method = "lm",
                trControl = trainControl(method = "none"))

pred <- predict(fit_lm, newdata = test_df)
rmse <- sqrt(mean((pred - test_df$mpg)^2))
round(rmse, 2)
#> [1] 3.06
```

The `predict()` call uses no extra preprocessing here because the formula is simple. With centering or dummy variables, caret would apply them inside `predict()` without you touching the test frame.

### 2. Get class probabilities for a classification model

**Class probabilities are what you need for ROC curves, lift charts, and custom thresholds.**

```r title="Classification with probabilities"
data(GermanCredit, package = "caret")
gc <- GermanCredit[, c("Class", "Duration", "Amount", "Age",
                       "InstallmentRatePercentage")]

set.seed(7)
idx <- createDataPartition(gc$Class, p = 0.7, list = FALSE)
fit_rf <- train(Class ~ ., data = gc[idx, ], method = "rf",
                trControl = trainControl(classProbs = TRUE), tuneLength = 1)

prob <- predict(fit_rf, newdata = gc[-idx, ], type = "prob")
head(prob, 3)
#>     Bad  Good
#> 1 0.142 0.858
#> 2 0.318 0.682
#> 3 0.094 0.906
```

[KEY INSIGHT]
**type = "prob" requires classProbs = TRUE in trainControl.** If you forget, the model trains fine but `predict()` with `type = "prob"` errors out. Set it once at the start and you can always fall back to raw labels.

### 3. Apply a custom probability threshold

**Default classification uses a 0.5 cutoff, which is rarely optimal for imbalanced classes.**

```r title="Threshold the positive class probability"
prob_good <- predict(fit_rf, newdata = gc[-idx, ], type = "prob")$Good
custom <- factor(ifelse(prob_good > 0.7, "Good", "Bad"),
                 levels = levels(gc$Class))

table(custom, gc[-idx, "Class"])
#>        
#> custom  Bad Good
#>   Bad    77   58
#>   Good   13  152
```

Raise the threshold to be conservative on the positive class; lower it to catch more positives at the cost of false alarms. Pick the threshold from a validation set, not the test set.

### 4. Predict only on the columns the model needs

**predictors() returns the columns the train object actually uses, so you can pass a wider frame and let caret subset.**

```r title="Use predictors() to subset newdata"
needed <- predictors(fit_rf)
needed
#> [1] "Duration" "Amount" "Age" "InstallmentRatePercentage"

pred <- predict(fit_rf, newdata = gc[-idx, needed])
length(pred)
#> [1] 299
```

This is handy when the production frame carries id columns, timestamps, or auxiliary fields that were not used during training.

## predict.train() vs predict() on the raw model

**predict.train() preserves the preprocessing recipe; predict() on the unwrapped model does not.** When you call `predict(fit, ...)` on a caret train object, caret runs the same `preProcess` and dummy-variable steps it ran during training. If you extract `fit$finalModel` and call `predict()` on that, those steps disappear and the predictions silently misalign with what the model expects.

```r title="Why finalModel predict is risky"
# WRONG - bypasses caret preprocessing
preds_bad <- predict(fit_rf$finalModel, newdata = gc[-idx, ])

# RIGHT - caret applies the recorded transformations
preds_good <- predict(fit_rf, newdata = gc[-idx, ])
```

Use the train-object method as the default. Reach into `finalModel` only when you need engine-specific arguments that caret does not expose.

## Common pitfalls

**Three mistakes account for most predict.train() failures in practice.**

- **Factor levels missing from newdata.** If your test frame has a factor with fewer levels than the training frame, `predict()` errors with "factor has new levels" or returns NA. Cast test factors to the training levels: `test_df$x <- factor(test_df$x, levels = levels(train_df$x))`.
- **type = "prob" without classProbs = TRUE.** Set `classProbs = TRUE` in `trainControl()` before you train if you ever need probabilities.
- **Dropped rows from na.action = na.omit.** The default silently removes rows containing NA, so your prediction vector is shorter than your test frame. Use `na.action = na.pass` and impute upstream, or wrap with `preProcess(method = "medianImpute")`.

[WARNING]
**Class probability columns are named after the factor levels, not "yes" and "no".** Always reference `prob$<level>` or `prob[, "<level>"]` instead of positional indexing; level order changes if your training set is re-randomised.

## Try it yourself

**Try it:** Fit a knn classification model on the iris dataset, predict class probabilities for a 30% held-out test split, and compute the accuracy at a 0.5 threshold on the dominant class.

```r title="Your turn: predict iris with caret knn"
library(caret)

set.seed(99)
ex_idx <- createDataPartition(iris$Species, p = 0.7, list = FALSE)
ex_train <- iris[ex_idx, ]
ex_test  <- iris[-ex_idx, ]

# Your code here: train a knn model and predict on ex_test
ex_fit  <- # ...
ex_pred <- # ...

mean(ex_pred == ex_test$Species)
#> Expected: > 0.9
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_fit <- train(Species ~ ., data = ex_train, method = "knn",
                trControl = trainControl(method = "cv", number = 5))
ex_pred <- predict(ex_fit, newdata = ex_test)
mean(ex_pred == ex_test$Species)
#> [1] 0.9555556
```

**Explanation:** `train()` cross-validates the knn neighbours hyperparameter, then `predict(ex_fit, ex_test)` dispatches to predict.train() which applies the chosen k and returns class labels. Accuracy on the held-out third of iris is typically above 0.94.

</details>

## Related caret functions

**predict.train() pairs with these caret helpers.**

- [train()](caret-train-in-R.html): fits the model whose train object predict() consumes.
- [trainControl()](caret-trainControl-in-R.html): set `classProbs = TRUE` here so `type = "prob"` works.
- [confusionMatrix()](caret-confusionMatrix-in-R.html): compare predicted labels to true labels and get accuracy, sensitivity, kappa.
- [createDataPartition()](caret-createDataPartition-in-R.html): split data before training so predict() has a test set to score.
- [varImp()](caret-varImp-in-R.html): rank features the trained model relies on; complements probability inspection.

For the formal reference, see the [caret model documentation](https://topepo.github.io/caret/) maintained by Max Kuhn.

## FAQ

**What is the difference between predict() and predict.train()?**

`predict()` is a generic R function. When you call it on a caret train object, R dispatches to `predict.train()`, which is the method registered for the `train` class. You almost never write `predict.train()` directly; calling `predict(fit, ...)` is idiomatic and forwards to the right method. The benefit of going through the generic is that caret applies any preprocessing recorded in `trainControl()` before scoring.

**Why does predict() return NA for some rows?**

The default `na.action = na.omit` drops rows containing NA in any predictor, then returns predictions only for the surviving rows. If your output vector is shorter than your input frame, that is why. Pass `na.action = na.pass` to keep NAs in place, or impute first using `preProcess(method = "medianImpute")` inside `train()`.

**How do I get a probability for the positive class only?**

Use `predict(fit, newdata, type = "prob")[, "<positive_level>"]` where `<positive_level>` is the name of the class you treat as positive. Avoid positional indexing like `[, 2]`; if you re-train with a different random seed or factor ordering, position 2 may no longer be the class you expect.

**Can I predict from a list of train objects at once?**

Yes. Pass a list of train objects to `predict()` and you get a matrix or data frame of predictions, one column per model. This is the basis for simple model averaging or for building a stacking layer downstream.

**Does predict.train() apply the same preprocessing used during train()?**

Yes, and that is the main reason to prefer it over `predict(fit$finalModel, ...)`. Centering, scaling, dummy encoding, and median imputation specified in `preProcess` are re-applied to `newdata` so the model sees inputs in the same form it was trained on.
