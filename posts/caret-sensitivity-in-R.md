---
title: "caret sensitivity() in R: Compute True Positive Rate"
slug: "caret-sensitivity-in-R"
description: "Use caret sensitivity() in R to compute true positive rate (recall). Two-class and per-class examples, factor or table input, with confusionMatrix comparison."
keywords: "caret sensitivity, sensitivity function R, caret sensitivity examples, R true positive rate, caret recall, R sensitivity binary classification, caret sens spec"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "caret-functions"
fr_parent: "R-Tutorial.html"
auto_link_terms: "sensitivity()|caret sensitivity|caret::sensitivity()|true positive rate in R|recall in caret"
auto_link_case_sensitive: true
target_keyword: "caret sensitivity"
sibling_block_enabled: true
difficulty: "Beginner"
---

# caret sensitivity() in R: Compute True Positive Rate

<p class="lead">The <code>caret sensitivity()</code> function in R computes the true positive rate of a classifier: the share of actual positives the model correctly labels positive. It accepts factor vectors or a precomputed contingency table, returns a single numeric value, and treats the first factor level as the positive class unless you override it.</p>

[QUICK ANSWER]
sensitivity(pred, ref)                           # default, first level is positive
sensitivity(pred, ref, positive = "yes")         # set positive class
sensitivity(table(pred, ref))                    # pass a precomputed table
sensitivity(pred, ref, na.rm = TRUE)             # drop NA before counting
sensitivity(pred, ref, positive = "virginica")   # per-class in a multi-class problem
1 - specificity(pred, ref, negative = "no")      # false positive rate

[DECISION TREE: Is sensitivity() the right tool?]
- compute true positive rate only: sensitivity(pred, ref, positive = "yes")
- want a full classifier scorecard: confusionMatrix(pred, ref, positive = "yes")
- need true negative rate: specificity(pred, ref, negative = "no")
- need precision (PPV) and F1: posPredValue(pred, ref); F_meas(pred, ref)
- score probabilities with AUC: pROC::roc(ref, probs); twoClassSummary inside trainControl
- tidymodels equivalent: yardstick::sens(df, truth, estimate)

## What sensitivity() does in one sentence

**`sensitivity()` is caret's single-number recall metric.** It counts positives your classifier correctly labeled, then divides by the total positives in the reference. The result lies between 0 and 1; 1 means every actual positive was caught, 0 means none were. The function needs no fitted model, only two aligned vectors of class labels (or a contingency table).

caret defines sensitivity as `TP / (TP + FN)`, identical to recall, hit rate, and true positive rate. For a full scorecard with accuracy, Kappa, specificity, and F1 in one call, use `confusionMatrix()` instead.

## sensitivity() syntax and arguments

**The function dispatches on the type of its first argument.** Pass a factor and it expects a second factor as reference; pass a table and it reads positives off the rows.

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
sensitivity(data, reference, positive = levels(reference)[1], na.rm = TRUE, ...)

sensitivity(data, positive = rownames(data)[1], ...)
```

- `data`: predicted class labels (factor) or a precomputed `table()` of predictions versus reference.
- `reference`: ground-truth class labels (factor). Same length and levels as `data`.
- `positive`: which factor level counts as the positive class. Defaults to the first level (alphabetical), which is rarely what you want for medical or fraud problems.
- `na.rm`: drop records where either prediction or reference is `NA` before counting. Default `TRUE`.

[NOTE]
**Both vectors must be factors with identical level sets.** Comparing a character vector against a factor coerces silently but the level order may differ, flipping which class counts as positive. Always wrap inputs in `factor(..., levels = c("no", "yes"))` before the call.

## sensitivity() examples by use case

### 1. Sensitivity from two factor vectors

The simplest call passes the prediction vector and the reference vector. caret extracts the positive level from the reference factor.

```r title="Sensitivity from prediction and reference"
sens_default <- sensitivity(pred, ref, positive = "yes")
sens_default
#> [1] 1
```

A value of 1 means every actual `yes` record was predicted `yes`. Setosa separates cleanly from the other iris classes, so recall is perfect; on harder problems sensitivity usually lands between 0.7 and 0.95.

### 2. Sensitivity from a precomputed table

If you already cross-tabbed predictions and references with `table()`, hand the matrix in directly. The first row is treated as the positive class unless you override.

```r title="Sensitivity from a contingency table"
tab <- table(prediction = pred, reference = ref)
tab
#>           reference
#> prediction no yes
#>        no  29   0
#>        yes  0  15

sensitivity(tab, positive = "yes")
#> [1] 1
```

The table form bypasses the factor-level coercion that trips up the vector form, and it is the only option when predictions arrive as counts (e.g., aggregated logs).

### 3. Set the positive class explicitly

The default positive level is the first factor level, which is the alphabetically first label for character data. For binary outcomes this is almost never the class you care about.

```r title="Compare sensitivity for both positive choices"
sens_yes <- sensitivity(pred, ref, positive = "yes")
sens_no  <- sensitivity(pred, ref, positive = "no")

c(positive_yes = sens_yes, positive_no = sens_no)
#> positive_yes  positive_no
#>            1            1
```

In a binary problem, sensitivity for one class equals specificity for the other. Numbers match here because both classes are predicted perfectly; on noisy data they diverge and the positive choice flips the metric. Pick the class whose false negatives cost the most: churners, fraud, disease-positive patients.

[KEY INSIGHT]
**Sensitivity is asymmetric and ignores the negative class entirely.** A model that predicts `yes` for every record scores a perfect sensitivity of 1.0, because it catches every true positive. The same model scores 0 on specificity. Always read sensitivity alongside specificity (or balanced accuracy) so the positive-bias trick cannot fool you.

### 4. Sensitivity for each class in a multi-class problem

For three or more classes, sensitivity is computed one class at a time, treating that class as positive and everything else as negative. Loop over the levels to get a per-class vector.

```r title="Per-class sensitivity on iris"
set.seed(1)
idx3   <- createDataPartition(iris$Species, p = 0.7, list = FALSE)
fit3   <- train(Species ~ ., data = iris[idx3, ], method = "rpart")
pred3  <- predict(fit3, newdata = iris[-idx3, ])
ref3   <- iris[-idx3, "Species"]

sens_by_class <- sapply(levels(ref3),
                        function(cl) sensitivity(pred3, ref3, positive = cl))
round(sens_by_class, 3)
#>     setosa versicolor  virginica
#>      1.000      1.000      0.929
```

Setosa and versicolor hit 1.0; virginica drops to 0.93 because one flower was misclassified. This is the recall column of `confusionMatrix()$byClass`; the loop form just skips the rest of the report.

### 5. Compare sensitivity, specificity, and precision side by side

caret pairs `sensitivity()` with sibling functions for the other corners of the confusion matrix. Calling them together gives a three-number summary without building the whole `confusionMatrix` object.

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

Sensitivity (`TP / (TP + FN)`) answers "of the positives, how many did we catch?" Specificity (`TN / (TN + FP)`) answers "of the negatives, how many did we leave alone?" Precision (`TP / (TP + FP)`) answers "of the predicted positives, how many were right?" Together they describe the classifier more honestly than accuracy.

## sensitivity() vs alternatives

**caret's `sensitivity()` is a one-metric extractor; pick a fuller tool when you want more than recall.** The choice usually comes down to whether you also need specificity, accuracy, or F1 in the same call.

| Tool | Returns | Multi-class | Best for |
|---|---|---|---|
| `caret::sensitivity()` | Single numeric | One-class-at-a-time via `positive=` | A single recall number in scripts |
| `caret::confusionMatrix()` | List with overall + per-class metrics | Yes, all classes at once | Full classifier scorecard |
| `yardstick::sens()` | Tibble with `.metric`, `.estimate` | Yes, with macro or micro estimator | Tidymodels pipelines |
| `MLmetrics::Sensitivity()` | Single numeric | No (binary only) | Drop-in replacement, no caret dependency |

Reach for `sensitivity()` when you only need recall, when you want the metric inside a `summaryFunction` for `trainControl`, or when you are comparing it against `specificity()` and `posPredValue()` side by side. Use `confusionMatrix()` when you also want accuracy, Kappa, F1, and confidence intervals from the same call. See the official caret reference at [topepo.github.io/caret/measuring-performance.html](https://topepo.github.io/caret/measuring-performance.html) for the full metric family.

## Common pitfalls

**Pitfall 1: leaving `positive` on the default first level.** caret picks `levels(reference)[1]`, which for `c("no", "yes")` is `"no"`, so the metric measures how well the model catches `no` records. Always pass `positive` explicitly for binary outcomes.

**Pitfall 2: passing character vectors instead of factors.** caret coerces internally, but the resulting level order is alphabetical, not the order you typed; the positive class can silently flip. Wrap inputs in `factor(x, levels = c("no", "yes"))`.

**Pitfall 3: comparing sensitivity across imbalanced datasets.** A 99 percent negative dataset can produce sensitivity 1.0 from a model that predicts positive every time, with specificity 0. Read both metrics together, or use balanced accuracy.

**Pitfall 4: trusting one test split.** Sensitivity from a single train/test split has wide variance on small data. Average per-fold sensitivities by setting `summaryFunction = twoClassSummary` in `trainControl()`.

[WARNING]
**`sensitivity()` does not score probabilities.** It needs hard class labels. For probability-based recall curves (ROC), use `pROC::roc(ref, probs)` and read sensitivity off the curve at your chosen threshold, or call `twoClassSummary()` inside `trainControl` to get ROC, sensitivity, and specificity per resample.

## Try it yourself

**Try it:** Compute sensitivity for the `virginica` class on the multi-class iris classifier built in example 4. Use the existing `pred3` and `ref3` objects. Save the result to `ex_sens_virginica`.

```r title="Your turn: sensitivity for virginica"
# Try it: per-class sensitivity
ex_sens_virginica <- # your code here

ex_sens_virginica
#> Expected: a numeric value near 0.929
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_sens_virginica <- sensitivity(pred3, ref3, positive = "virginica")
round(ex_sens_virginica, 3)
#> [1] 0.929
```

**Explanation:** Setting `positive = "virginica"` tells caret to count virginica as the positive class and treat setosa plus versicolor as negative. The single number is the recall for that class in a one-vs-rest framing.

</details>

## Related caret functions

After `sensitivity()`, these caret functions round out classification evaluation:

- `specificity()`: true negative rate, the companion metric to sensitivity
- `posPredValue()`: positive predictive value (precision); the column-wise twin of sensitivity
- `negPredValue()`: negative predictive value; precision for the negative class
- `confusionMatrix()`: full classifier scorecard with both overall and per-class metrics
- `twoClassSummary()`: drop-in `summaryFunction` for `trainControl` that returns ROC, sensitivity, and specificity per resample

## FAQ

**Is caret sensitivity the same as recall?**

Yes. caret defines sensitivity as `TP / (TP + FN)`, the same formula statisticians call recall, hit rate, or true positive rate. The numbers are identical; only the field convention differs.

**Why does caret sensitivity return 0 when my model looks fine?**

Usually the positive class is set to the wrong level. caret defaults to the first factor level, so `c("no", "yes")` reports sensitivity for `no`. Pass `positive = "yes"` and the number should jump.

**How do I compute sensitivity for each class in a multi-class problem?**

Call `sensitivity(pred, ref, positive = cl)` per class: `sapply(levels(ref), function(cl) sensitivity(pred, ref, positive = cl))`. Each call treats that class as positive against everything else (one-vs-rest), matching the recall column of `confusionMatrix()$byClass`.

**What is the difference between sensitivity and balanced accuracy?**

Sensitivity is recall for the positive class only. Balanced accuracy is the mean of sensitivity and specificity. Use sensitivity when missing positives is the dominant cost (medical screening); use balanced accuracy when both error types matter equally on imbalanced data.

**Can I use sensitivity inside trainControl for model tuning?**

Yes. Set `summaryFunction = twoClassSummary` and `classProbs = TRUE` in `trainControl()`, then pick `metric = "Sens"` in `train()`. caret will tune hyperparameters to maximize average sensitivity across resamples.
