---
title: "caret confusionMatrix() in R: Evaluate Classification Models"
slug: "caret-confusionMatrix-in-R"
description: "Use caret confusionMatrix() in R to score classifiers. Accuracy, Kappa, sensitivity, specificity, F1, positive class, multi-class, and yardstick comparisons."
keywords: "caret confusionMatrix, confusionMatrix function R, caret confusionMatrix examples, R classification metrics, caret accuracy kappa, R confusion matrix caret"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "caret-functions"
fr_parent: "R-Tutorial.html"
auto_link_terms: "confusionMatrix()|caret confusionMatrix|caret::confusionMatrix()|confusion matrix in caret|caret confusion matrix"
auto_link_case_sensitive: true
target_keyword: "caret confusionMatrix"
sibling_block_enabled: true
difficulty: "Beginner"
---

# caret confusionMatrix() in R: Evaluate Classification Models

<p class="lead">The <code>confusionMatrix()</code> function in caret takes predicted and observed class labels and returns the confusion matrix plus a battery of classification metrics: accuracy, Kappa, sensitivity, specificity, PPV, NPV, F1, balanced accuracy, and prevalence. It works for two-class and multi-class outcomes from a single call.</p>

[QUICK ANSWER]
confusionMatrix(pred, ref)                                # default, picks first level as positive
confusionMatrix(pred, ref, positive = "yes")              # set positive class
confusionMatrix(table(pred, ref))                         # pass a precomputed table
confusionMatrix(pred, ref, mode = "prec_recall")          # F1, precision, recall
confusionMatrix(pred, ref, mode = "everything")           # all 15 metrics
confusionMatrix(pred, ref)$byClass["F1"]                  # extract one metric
cm$table                                                  # the raw 2x2 (or k x k) matrix

[DECISION TREE: Is confusionMatrix() the right tool?]
- score a classifier on labels: confusionMatrix(pred, ref)
- need a ROC curve or AUC: pROC::roc(ref, probs)
- need calibration of probabilities: caret::calibration(ref ~ probs)
- compare many fitted models: resamples(list(a = fit1, b = fit2))
- want tidy tibble output: yardstick::conf_mat(df, truth, estimate)
- multi-class macro metrics only: yardstick::f_meas(df, truth, estimate)

## What confusionMatrix() does in one sentence

**`confusionMatrix()` is caret's classifier scorecard.** You hand it a vector of predicted class labels and a vector of reference (true) labels, and it cross-tabulates them, then derives every standard classification metric from that table in one call. The return object holds the raw table, overall metrics (accuracy and Kappa with confidence intervals), and per-class metrics (sensitivity, specificity, PPV, NPV, prevalence, balanced accuracy).

The function does not need a fitted model. It only sees labels, so it works with any classifier in R, not just caret-trained ones. Pass the output of `predict()` from `glm`, `randomForest`, `xgboost`, or `nnet` and you get the same scorecard. The same call covers two-class and multi-class problems: for k classes the per-class metric table widens to k rows, one per class as the positive label.

## confusionMatrix() syntax and arguments

**The signature accepts predictions in two shapes: vectors of labels, or a precomputed contingency table.** Both produce the same output object.

```r title="Load caret and build a quick classifier"
library(caret)

set.seed(1)
idx     <- createDataPartition(iris$Species, p = 0.7, list = FALSE)
train_d <- iris[idx, ]
test_d  <- iris[-idx, ]

fit  <- train(Species ~ ., data = train_d, method = "rpart")
pred <- predict(fit, newdata = test_d)
ref  <- test_d$Species

length(pred)
#> [1] 42
```

The two main calling styles are:

```
confusionMatrix(data, reference, positive = NULL, dnn = c("Prediction", "Reference"),
                mode = "sens_spec", ...)

confusionMatrix(table, positive = NULL, prevalence = NULL, mode = "sens_spec", ...)
```

- `data`: predicted class labels (factor). Same length and levels as `reference`.
- `reference`: ground-truth class labels (factor).
- `positive`: which factor level counts as the positive class for two-class metrics. Defaults to the first level, which is rarely what you want.
- `table`: a precomputed `table()` of predictions versus reference, used when you already cross-tabbed the labels yourself.
- `mode`: `"sens_spec"` (default), `"prec_recall"`, or `"everything"`. Controls which per-class metrics get reported.
- `prevalence`: optional override of the base rate. Useful when the test set under- or over-samples the positive class.

[NOTE]
**Both vectors must be factors with identical levels.** Comparing a factor with three levels (`c("a","b","c")`) against a factor with two (`c("a","b")`) raises `the data cannot have more levels than the reference`. Coerce both with `factor(..., levels = expected_levels)` before the call.

## confusionMatrix() examples by use case

### 1. Two-class confusion matrix with default metrics

Build a binary outcome from `iris` and score a logistic-regression-style classifier. The default `mode = "sens_spec"` reports accuracy, Kappa, sensitivity, and specificity.

```r title="Score a two-class classifier"
set.seed(1)
two_class      <- iris
two_class$flag <- factor(ifelse(two_class$Species == "setosa", "yes", "no"),
                         levels = c("no", "yes"))

idx2  <- createDataPartition(two_class$flag, p = 0.7, list = FALSE)
fit2  <- train(flag ~ Sepal.Length + Sepal.Width + Petal.Length + Petal.Width,
               data = two_class[idx2, ], method = "glm", family = "binomial")
pred2 <- predict(fit2, newdata = two_class[-idx2, ])
ref2  <- two_class[-idx2, "flag"]

cm <- confusionMatrix(pred2, ref2, positive = "yes")
cm$overall[c("Accuracy", "Kappa")]
#>  Accuracy     Kappa
#>     1.000     1.000
```

The overall section gives accuracy with a 95 percent exact-binomial confidence interval; `cm$byClass` gives sensitivity, specificity, PPV, NPV, prevalence, and balanced accuracy. Kappa adjusts accuracy for chance agreement, which matters when one class dominates. A Kappa near one beats constant prediction; near zero is no better than guessing the majority class.

### 2. Multi-class confusion matrix

For three or more classes, caret reports metrics per class instead of for one positive class. The same call works; only the output table widens.

```r title="Score a three-class classifier"
cm_multi <- confusionMatrix(pred, ref)
cm_multi$table
#>             Reference
#> Prediction   setosa versicolor virginica
#>   setosa         14          0         0
#>   versicolor      0         14         1
#>   virginica       0          0        13

cm_multi$byClass[, c("Sensitivity", "Specificity", "Balanced Accuracy")]
#>                   Sensitivity Specificity Balanced Accuracy
#> Class: setosa           1.000       1.000             1.000
#> Class: versicolor       1.000       0.964             0.982
#> Class: virginica        0.929       1.000             0.964
```

Each row of `cm_multi$byClass` is one class treated as positive against everything else (one-vs-rest). The per-class view exposes asymmetries a single accuracy number hides. For multi-class problems the `positive` argument is ignored; macro and micro averages must be computed from `byClass` manually.

### 3. Set the positive class explicitly

The default positive class is the first factor level, alphabetical for character data. That is rarely the medically or commercially interesting class. Always set `positive` for binary problems.

```r title="Set positive class to yes"
no_pos  <- confusionMatrix(pred2, ref2)
yes_pos <- confusionMatrix(pred2, ref2, positive = "yes")

c(default_positive = levels(ref2)[1], explicit_positive = "yes")
#> default_positive explicit_positive
#>             "no"             "yes"
```

The matrix is identical either way; only which row of `byClass` is reported as sensitivity versus specificity flips. Mislabeling the positive class is the most common reason metrics look reasonable for the wrong reason.

[KEY INSIGHT]
**Pick the positive class to match the cost asymmetry.** In churn modelling, churners are positive because false negatives (missed churners) hurt revenue. In fraud, fraud is positive. In a screening test, the disease is positive. Sensitivity is always "how well we catch the positive class," so the positive choice decides which error type sensitivity measures.

### 4. Get F1, precision, and recall

Switch to `mode = "prec_recall"` for precision, recall, and F1, or `mode = "everything"` for all 15 metrics.

```r title="Report F1 instead of sensitivity and specificity"
cm_f1 <- confusionMatrix(pred2, ref2, positive = "yes", mode = "prec_recall")
cm_f1$byClass[c("Precision", "Recall", "F1")]
#> Precision    Recall        F1
#>     1.000     1.000     1.000
```

Precision is the same as positive predictive value (PPV); recall is the same as sensitivity. caret renames them under `mode = "prec_recall"` to match the information-retrieval convention. F1 is the harmonic mean of precision and recall, so it drops sharply if either is weak. The `mode = "everything"` option reports all 15 per-class metrics at once.

### 5. Pass a precomputed table

If you already have a contingency table from `table()`, hand it in directly. Useful when predictions and labels arrive as a precomputed cross-tabulation.

```r title="Use a precomputed table"
tab <- table(prediction = pred, reference = ref)
cm_tab <- confusionMatrix(tab)
cm_tab$overall[c("Accuracy", "AccuracyPValue")]
#>       Accuracy AccuracyPValue
#>      0.9761905      0.0000000
```

`AccuracyPValue` tests whether observed accuracy beats the no-information rate (always predicting the majority class). A low p-value means the model beats a constant predictor. The row dimension of the input table is the prediction and the column is the reference; reverse this and sensitivity and specificity flip.

## confusionMatrix() vs alternatives

**caret's `confusionMatrix()` is the most comprehensive scorecard; tidymodels' `yardstick::conf_mat()` and base `table()` cover the simpler cases.** The choice usually comes down to how much downstream tidyverse code consumes the output.

| Tool | Returns | Multi-class metrics | Confidence intervals on accuracy |
|---|---|---|---|
| `caret::confusionMatrix()` | List of overall + per-class metrics | Yes, one-vs-rest per class | Yes, exact binomial |
| `yardstick::conf_mat()` | A tibble-friendly conf_mat object | Yes, via `summary()` | No (use `yardstick::accuracy()` separately) |
| `base::table()` | Raw contingency table | None | None |
| `MLmetrics::ConfusionMatrix()` | A plain matrix | Limited | None |

Reach for `confusionMatrix()` when you want one call and a complete report. Use `yardstick::conf_mat()` when the rest of your code is tidymodels or you want to pipe into ggplot. The metric numbers are the same across libraries; what changes is the output shape. See the official caret reference at [topepo.github.io/caret/measuring-performance.html](https://topepo.github.io/caret/measuring-performance.html) for the full metric list.

## Common pitfalls

**Pitfall 1: factor levels mismatch between prediction and reference.** If the model never predicted some classes, those levels are missing from the prediction factor. caret then refuses to compare. Force the levels: `pred <- factor(pred, levels = levels(ref))`.

**Pitfall 2: leaving the positive class on the default first level.** A "no" first-positive flips sensitivity and specificity in the report, leading to plausible but inverted conclusions. Always pass `positive = "yes"` (or your domain-relevant level) for binary outcomes.

**Pitfall 3: comparing accuracy across imbalanced classes.** If 95 percent of records are negative, predicting "negative" every time scores 95 percent accuracy. Kappa, balanced accuracy, and F1 in `byClass` are designed for that case; the `AccuracyPValue` flags it.

**Pitfall 4: treating one test matrix as the model's quality.** A single train/test split gives one matrix; cross-validation gives one per fold. For stable estimates, average per-fold metrics from a cross-validated fit instead.

[WARNING]
**`confusionMatrix()` does not score probabilities.** It needs hard class labels. For probability-based metrics (AUC, log loss, Brier score), pair it with `pROC::roc()` or `caret::twoClassSummary()` inside `trainControl()`.

## Try it yourself

**Try it:** Score a kNN classifier on the `iris` test split (use the `train_d`, `test_d`, `ref`, `pred` objects defined earlier in this post) and pull out the balanced accuracy column from `byClass`. Save the resulting vector to `ex_bal_acc`.

```r title="Your turn: extract balanced accuracy"
# Try it: balanced accuracy for each class
ex_bal_acc <- # your code here

ex_bal_acc
#> Expected: a numeric vector of length 3 with one balanced accuracy per Species
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_cm      <- confusionMatrix(pred, ref)
ex_bal_acc <- ex_cm$byClass[, "Balanced Accuracy"]
ex_bal_acc
#> Class: setosa Class: versicolor  Class: virginica
#>         1.000             0.982             0.964
```

**Explanation:** `byClass` is a matrix when there are 3+ classes (one row per class, one column per metric). Subset with `[, "Balanced Accuracy"]` to pull a single metric across classes.

</details>

## Related caret functions

After `confusionMatrix()`, these caret functions round out classification evaluation:

- `train()`: fits and resamples the model whose predictions you score
- `predict.train()`: produces the class-label vector you feed in as `data`
- `trainControl(classProbs = TRUE)`: enables probability output for ROC-based tuning
- `twoClassSummary()`: drop-in for `summaryFunction` to get ROC, sensitivity, specificity during resampling
- `varImp()`: model-agnostic variable importance for a fitted classifier

## FAQ

**What does caret confusionMatrix() return exactly?**

It returns an S3 object with five named slots: `table` (the raw k x k contingency table), `overall` (accuracy, Kappa, accuracy CI, no-information rate, McNemar p-value), `byClass` (per-class sensitivity, specificity, PPV, NPV, prevalence, balanced accuracy), `mode`, and `dots`. Subset `cm$overall["Accuracy"]` to pull individual numbers.

**How do I plot a caret confusion matrix?**

The matrix lives in `cm$table`. Convert to a data frame and use `ggplot2::geom_tile()` for a heatmap. For a quick base R version, `fourfoldplot(cm$table)` works for 2x2 matrices and `mosaicplot(cm$table)` works for k x k.

**Why is sensitivity 100 percent but the model still bad?**

Sensitivity ignores the negative class. A model that predicts "positive" for every record has 100 percent sensitivity and 0 percent specificity. Always read sensitivity, specificity, and prevalence together. Balanced accuracy and Kappa correct for the asymmetry.

**Can confusionMatrix() handle multi-class outputs?**

Yes, with no extra arguments. caret detects k > 2 levels and reports per-class metrics one-vs-rest. There is no built-in macro or micro averaging; compute that manually as `mean(cm$byClass[, "F1"], na.rm = TRUE)` or switch to `yardstick::f_meas(df, truth, estimate, estimator = "macro")`.
