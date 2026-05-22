---
title: "caret specificity() in R: Compute True Negative Rate"
slug: "caret-specificity-in-R"
description: "Use caret specificity() in R to compute true negative rate. Factor or table input, per-class examples, with sensitivity and confusionMatrix comparisons."
keywords: "caret specificity, specificity function R, caret specificity examples, R true negative rate, caret specificity binary classification, caret spec sens, R classification metrics"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "caret-functions"
fr_parent: "R-Tutorial.html"
auto_link_terms: "specificity()|caret specificity|caret::specificity()|true negative rate in R|specificity in caret"
auto_link_case_sensitive: true
target_keyword: "caret specificity"
sibling_block_enabled: true
difficulty: "Beginner"
---

# caret specificity() in R: Compute True Negative Rate

<p class="lead">The <code>caret specificity()</code> function in R computes the true negative rate of a classifier: the share of actual negatives the model correctly labels negative. It accepts factor vectors or a precomputed contingency table, returns a single numeric value, and treats the second factor level as the negative class unless you override it.</p>

[QUICK ANSWER]
specificity(pred, ref)                           # default, second level is negative
specificity(pred, ref, negative = "no")          # set negative class
specificity(table(pred, ref))                    # pass a precomputed table
specificity(pred, ref, na.rm = TRUE)             # drop NA before counting
specificity(pred, ref, negative = "versicolor")  # per-class in a multi-class problem
1 - sensitivity(pred, ref, positive = "yes")     # false negative rate

[DECISION TREE: Is specificity() the right tool?]
- compute true negative rate only: specificity(pred, ref, negative = "no")
- want a full classifier scorecard: confusionMatrix(pred, ref, positive = "yes")
- need true positive rate: sensitivity(pred, ref, positive = "yes")
- need precision and F1: posPredValue(pred, ref); F_meas(pred, ref)
- score probabilities with AUC: pROC::roc(ref, probs); twoClassSummary inside trainControl
- tidymodels equivalent: yardstick::spec(df, truth, estimate)

## What specificity() does in one sentence

**`specificity()` is caret's single-number true-negative-rate metric.** It counts negatives your classifier correctly labeled, then divides by the total negatives in the reference. The result lies between 0 and 1; 1 means every actual negative was left alone, 0 means none were. The function needs no fitted model, only two aligned vectors of class labels (or a contingency table).

caret defines specificity as `TN / (TN + FP)`, identical to selectivity. For a full scorecard with accuracy, Kappa, sensitivity, and F1 in one call, use `confusionMatrix()` instead.

## specificity() syntax and arguments

**The function dispatches on the type of its first argument.** Pass a factor and it expects a second factor as reference; pass a table and it reads negatives off the rows excluding the first.

```r title="Load caret and build a quick classifier"
library(caret)

set.seed(1)
two_class      <- iris
two_class$flag <- factor(ifelse(two_class$Species == "setosa", "yes", "no"),
                         levels = c("no", "yes"))

idx  <- createDataPartition(two_class$flag, p = 0.7, list = FALSE)
fit  <- train(flag ~ Sepal.Length + Sepal.Width + Petal.Length + Petal.Width,
              data = two_class[idx, ], method = "glm", family = "binomial")
pred <- predict(fit, newdata = two_class[-idx, ])
ref  <- two_class[-idx, "flag"]

length(pred)
#> [1] 44
```

The two calling styles are:

```
specificity(data, reference, negative = levels(reference)[-1], na.rm = TRUE, ...)

specificity(data, negative = rownames(data)[-1], ...)
```

- `data`: predicted class labels (factor) or a precomputed `table()` of predictions versus reference.
- `reference`: ground-truth class labels (factor). Same length and levels as `data`.
- `negative`: which factor level counts as the negative class. Defaults to every level except the first, which collapses non-positive labels in a multi-class problem.
- `na.rm`: drop records where either prediction or reference is `NA` before counting. Default `TRUE`.

[NOTE]
**Both vectors must be factors with identical level sets.** Comparing a character vector against a factor coerces silently but the level order may differ, flipping which class counts as negative. Always wrap inputs in `factor(..., levels = c("no", "yes"))` before the call so the negative slot is the one you intend.

## specificity() examples by use case

### 1. Specificity from two factor vectors

The simplest call passes the prediction vector and the reference vector. caret extracts the negative level from the reference factor.

```r title="Specificity from prediction and reference"
spec_default <- specificity(pred, ref, negative = "no")
spec_default
#> [1] 1
```

A value of 1 means every actual `no` record was predicted `no`. On harder problems specificity usually lands between 0.7 and 0.95.

### 2. Specificity from a precomputed table

If you already cross-tabbed predictions and references with `table()`, hand the matrix in directly. Rows after the first are treated as the negative class unless you override.

```r title="Specificity from a contingency table"
tab <- table(prediction = pred, reference = ref)
tab
#>           reference
#> prediction no yes
#>        no  29   0
#>        yes  0  15

specificity(tab, negative = "no")
#> [1] 1
```

The table form bypasses the factor-level coercion that trips up the vector form, and it is the only option when predictions arrive as counts (e.g., aggregated logs).

### 3. Set the negative class explicitly

The default negative is every level except the first. For binary outcomes this is usually fine, but for multi-class problems you almost always want to set `negative` by hand so the metric matches the question you are asking.

```r title="Compare specificity for both negative choices"
spec_no  <- specificity(pred, ref, negative = "no")
spec_yes <- specificity(pred, ref, negative = "yes")

c(negative_no = spec_no, negative_yes = spec_yes)
#> negative_no negative_yes
#>           1            1
```

In a binary problem, specificity for one class equals sensitivity for the other. On noisy data the numbers diverge and the negative choice flips the metric. Pick the class whose false positives cost the most: spam flags on legitimate mail, false fraud alerts, false-positive cancer screens.

[KEY INSIGHT]
**Specificity is asymmetric and ignores the positive class entirely.** A model that predicts `no` for every record scores a perfect specificity of 1.0, because it never raises a false alarm. The same model scores 0 on sensitivity. Always read specificity alongside sensitivity (or balanced accuracy) so the trivial-negative trick cannot fool you.

### 4. Specificity for each class in a multi-class problem

For three or more classes, specificity is computed one class at a time, treating that class as positive and everything else as negative. Loop over the levels to get a per-class vector of the share of non-class records the model correctly excluded.

```r title="Per-class specificity on iris"
set.seed(1)
idx3   <- createDataPartition(iris$Species, p = 0.7, list = FALSE)
fit3   <- train(Species ~ ., data = iris[idx3, ], method = "rpart")
pred3  <- predict(fit3, newdata = iris[-idx3, ])
ref3   <- iris[-idx3, "Species"]

spec_by_class <- sapply(levels(ref3), function(cl) {
  ref_bin  <- factor(ifelse(ref3  == cl, cl, "other"), levels = c(cl, "other"))
  pred_bin <- factor(ifelse(pred3 == cl, cl, "other"), levels = c(cl, "other"))
  specificity(pred_bin, ref_bin, negative = "other")
})
round(spec_by_class, 3)
#>     setosa versicolor  virginica
#>      1.000      0.967      1.000
```

Setosa and virginica hit 1.0; versicolor drops to 0.967 because one non-versicolor flower was wrongly flagged as versicolor. This is the specificity column of `confusionMatrix()$byClass`; the loop form just skips the rest of the report.

### 5. Compare sensitivity, specificity, and precision side by side

caret pairs `specificity()` with sibling functions for the other corners of the confusion matrix. Calling them together gives a three-number summary without building the whole `confusionMatrix` object.

```r title="Three-number summary of a binary classifier"
metrics <- c(
  sensitivity = sensitivity(pred, ref, positive = "yes"),
  specificity = specificity(pred, ref, negative = "no"),
  precision   = posPredValue(pred, ref, positive = "yes")
)
round(metrics, 3)
#> sensitivity specificity   precision
#>           1           1           1
```

Specificity (`TN / (TN + FP)`) answers "of the negatives, how many did we leave alone?" Sensitivity (`TP / (TP + FN)`) answers "of the positives, how many did we catch?" Precision (`TP / (TP + FP)`) answers "of the predicted positives, how many were right?" Together they describe the classifier more honestly than accuracy.

## specificity() vs alternatives

**caret's `specificity()` is a one-metric extractor; pick a fuller tool when you want more than the true negative rate.** The choice usually comes down to whether you also need sensitivity, accuracy, or F1 in the same call.

| Tool | Returns | Multi-class | Best for |
|---|---|---|---|
| `caret::specificity()` | Single numeric | One-class-at-a-time via `negative=` | A single TNR number in scripts |
| `caret::confusionMatrix()` | List with overall and per-class metrics | Yes, all classes at once | Full classifier scorecard |
| `yardstick::spec()` | Tibble with `.metric`, `.estimate` | Yes, with macro or micro estimator | Tidymodels pipelines |
| `MLmetrics::Specificity()` | Single numeric | No (binary only) | Drop-in replacement, no caret dependency |

Reach for `specificity()` when you only need TNR or are comparing it against `sensitivity()` and `posPredValue()` side by side. Use `confusionMatrix()` when you also want accuracy, Kappa, F1, and confidence intervals from the same call. See the official caret reference at [topepo.github.io/caret/measuring-performance.html](https://topepo.github.io/caret/measuring-performance.html) for the full metric family.

## Common pitfalls

**Pitfall 1: leaving `negative` on the default.** caret picks every level except the first, collapsing labels into one negative bucket in a multi-class problem. Always pass `negative` explicitly so the metric matches the class you treat as negative.

**Pitfall 2: passing character vectors instead of factors.** caret coerces internally, but the resulting level order is alphabetical, not the order you typed; the negative class can silently flip. Wrap inputs in `factor(x, levels = c("no", "yes"))`.

**Pitfall 3: comparing specificity across imbalanced datasets.** A 99 percent negative dataset can produce specificity 1.0 from a model that always predicts negative. Read it alongside sensitivity, or use balanced accuracy.

[WARNING]
**`specificity()` does not score probabilities.** It needs hard class labels. For probability-based curves (ROC), use `pROC::roc(ref, probs)` and read specificity off the curve at your chosen threshold, or call `twoClassSummary()` inside `trainControl` to get ROC, sensitivity, and specificity per resample.

## Try it yourself

**Try it:** Compute specificity for the `versicolor` class on the multi-class iris classifier built in example 4. Use the existing `pred3` and `ref3` objects. Save the result to `ex_spec_versicolor`.

```r title="Your turn: specificity for versicolor"
# Try it: per-class specificity
ex_spec_versicolor <- # your code here

ex_spec_versicolor
#> Expected: a numeric value near 0.967
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ref_bin  <- factor(ifelse(ref3  == "versicolor", "versicolor", "other"),
                   levels = c("versicolor", "other"))
pred_bin <- factor(ifelse(pred3 == "versicolor", "versicolor", "other"),
                   levels = c("versicolor", "other"))
ex_spec_versicolor <- specificity(pred_bin, ref_bin, negative = "other")
round(ex_spec_versicolor, 3)
#> [1] 0.967
```

**Explanation:** Binarising the labels into `versicolor` versus `other` lets caret count true negatives as records that are not versicolor and were not predicted versicolor. The single number is the specificity for versicolor in a one-vs-rest framing.

</details>

## Related caret functions

After `specificity()`, these caret functions round out classification evaluation:

- `sensitivity()`: true positive rate, the companion metric to specificity
- `posPredValue()`: positive predictive value (precision); the column-wise twin of sensitivity
- `negPredValue()`: negative predictive value; precision for the negative class
- `confusionMatrix()`: full classifier scorecard with both overall and per-class metrics
- `twoClassSummary()`: drop-in `summaryFunction` for `trainControl` that returns ROC, sensitivity, and specificity per resample

## FAQ

**Is caret specificity the same as true negative rate?**

Yes. caret defines specificity as `TN / (TN + FP)`, the same formula epidemiologists call true negative rate or selectivity. The numbers are identical; only the field convention differs.

**Why does caret specificity return 0 when my model looks fine?**

Usually the negative class is set to the wrong level. caret defaults to every level except the first, so for `c("no", "yes")` it reads specificity off the "yes" row, which is empty in your positives. Pass `negative = "no"` and the number should jump.

**How do I compute specificity for each class in a multi-class problem?**

Binarise the labels per class, then call `specificity(pred_bin, ref_bin, negative = "other")`. caret's stock per-class output via `confusionMatrix()$byClass[, "Specificity"]` does the same thing in one call and is usually faster than the loop.

**What is the difference between specificity and precision?**

Specificity is `TN / (TN + FP)`: of all true negatives, how many did we leave alone. Precision is `TP / (TP + FP)`: of all positive predictions, how many were right. Both penalise false positives, but specificity normalises by the negative population while precision normalises by predictions, so they diverge sharply on imbalanced data.

**Can I use specificity inside trainControl for model tuning?**

Yes. Set `summaryFunction = twoClassSummary` and `classProbs = TRUE` in `trainControl()`, then pick `metric = "Spec"` in `train()`. caret will tune hyperparameters to maximise average specificity across resamples.
