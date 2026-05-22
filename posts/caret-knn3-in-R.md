---
title: "caret knn3() in R: k-Nearest Neighbors Classification"
slug: "caret-knn3-in-R"
description: "Learn how caret knn3() in R fits a k-nearest neighbors classifier. Formula and matrix interfaces, predict() probabilities, tuning k, and pitfalls explained."
keywords: "caret knn3, knn3 function R, caret knn3 examples, R knn3 classification, knn3 caret package, k nearest neighbors caret, knn3 vs knn"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "caret-functions"
fr_parent: "R-Tutorial.html"
auto_link_terms: "knn3()|caret knn3|caret::knn3()|k-nearest neighbors caret|knn3 classifier"
auto_link_case_sensitive: true
target_keyword: "caret knn3"
sibling_block_enabled: true
difficulty: "Beginner"
---

# caret knn3() in R: k-Nearest Neighbors Classification

<p class="lead">The <code>knn3()</code> function in caret fits a k-nearest neighbors classifier directly, without the resampling overhead of <code>train()</code>. It accepts a formula or an x-y interface, returns a model object that predicts both classes and class probabilities, and is the classification cousin of <code>knnreg()</code>.</p>

[QUICK ANSWER]
knn3(Species ~ ., data = iris, k = 5)                  # formula interface
knn3(x = iris[, 1:4], y = iris$Species, k = 5)         # x, y interface
knn3(Species ~ ., data = iris, k = 1)                  # 1-NN (max variance)
knn3(Species ~ ., data = iris, k = 7, na.action = na.omit) # drop NA rows
predict(fit, newdata = iris[1:5, ], type = "class")    # predicted class
predict(fit, newdata = iris[1:5, ], type = "prob")     # class probabilities
caret::knn3Train(train, test, cl, k = 5)               # low-level vector path

[DECISION TREE: Is knn3() the right tool?]
- direct k-NN classification, no resampling: knn3(Species ~ ., data = iris, k = 5)
- k-NN with cross-validation and tuning: train(Species ~ ., method = "knn")
- k-NN for regression (numeric outcome): knnreg(mpg ~ ., data = mtcars, k = 5)
- distance-weighted neighbors: kknn::kknn(formula, train, test)
- nearest neighbors search without modelling: FNN::get.knn(x, k = 5)
- find best k via grid search: train(method = "knn", tuneGrid = data.frame(k = 1:15))

## What knn3() does in one sentence

**`knn3()` is caret's formula-friendly k-nearest neighbors classifier.** You hand it a formula and a data frame, pick a `k`, and it stores the training rows; calling `predict()` later finds the k closest training points to each new observation (by Euclidean distance on the predictors) and assigns the majority class.

There is no model to "fit" in the parametric sense. `knn3()` simply packages the training data, the response, and `k` into an object that `predict()` knows how to query. The actual classification work happens at prediction time, which is why k-NN is called a lazy learner. The entire training set travels with the model; prediction cost scales linearly with the number of training rows.

## knn3() syntax and arguments

**The signature has just three required pieces: predictors, an outcome, and a value of k.** caret offers two equivalent entry points.

```r title="Load caret and inspect iris"
library(caret)

set.seed(1)
head(iris, 3)
#>   Sepal.Length Sepal.Width Petal.Length Petal.Width Species
#> 1          5.1         3.5          1.4         0.2  setosa
#> 2          4.9         3.0          1.4         0.2  setosa
#> 3          4.7         3.2          1.3         0.2  setosa
```

The formula form mirrors `lm()`:

```
knn3(formula, data, subset, na.action, k = 5, ...)
```

The matrix form skips the formula expansion:

```
knn3(x, y, k = 5, ...)
```

- `formula`: a model formula like `Species ~ .` with a factor on the left.
- `data`: a data frame holding the columns named in the formula.
- `x`: a numeric matrix of predictors, one column per feature.
- `y`: a factor vector of class labels, one entry per row of `x`.
- `k`: the number of nearest neighbors used at prediction time. Default 5.
- `na.action`: `na.action = na.omit` drops rows with missing values before fitting.

[NOTE]
**The x-y interface is faster on wide numeric data.** The formula path builds a model matrix in memory and copies columns; passing `x` and `y` directly skips that work, which matters when you have hundreds of predictors or millions of rows.

## knn3() examples by use case

### 1. Fit a basic classifier on iris

The shortest call uses every column to predict `Species`. The fitted object prints its training size, `k`, and the class levels.

```r title="Fit knn3 with default settings"
set.seed(1)
fit <- knn3(Species ~ ., data = iris, k = 5)
fit
#> 5-nearest neighbor classification model
#> Training set class distribution:
#>
#>     setosa versicolor  virginica
#>         50         50         50
```

The returned object is of class `knn3` and carries the training rows. Saving it to disk and loading it later is enough to score new data; there are no learned coefficients to ship.

### 2. Predict classes and probabilities

`predict.knn3()` has two prediction types. `"class"` returns a factor; `"prob"` returns a numeric matrix with one column per class.

```r title="Score the first three rows two ways"
predict(fit, newdata = iris[c(1, 60, 130), ], type = "class")
#> [1] setosa     versicolor virginica
#> Levels: setosa versicolor virginica

predict(fit, newdata = iris[c(1, 60, 130), ], type = "prob")
#>     setosa versicolor virginica
#> 1      1.0        0.0       0.0
#> 60     0.0        1.0       0.0
#> 130    0.0        0.2       0.8
```

The probability is the fraction of the `k` neighbors that belong to each class. With `k = 5`, possible values are 0, 0.2, 0.4, 0.6, 0.8, 1.0. Tied votes default to alphabetical class order. Use these probabilities to set custom decision thresholds or compute area under the ROC curve via `pROC::roc()`.

### 3. Use the x, y interface for speed

When the predictors are already a numeric matrix and the response is a factor, skip the formula entirely.

```r title="Fit knn3 via the x, y interface"
x <- as.matrix(iris[, 1:4])
y <- iris$Species

set.seed(1)
fit_mat <- knn3(x = x, y = y, k = 5)
predict(fit_mat, newdata = x[c(1, 60, 130), ], type = "class")
#> [1] setosa     versicolor virginica
#> Levels: setosa versicolor virginica
```

The fit is identical to the formula version on the same columns; only the construction cost changes. For a dataset wider than a few hundred predictors, the matrix path is noticeably faster. It also makes it easy to drop in pre-standardized predictors: scale `x` once with `scale()` and pass the result.

### 4. Hold out a test set and check accuracy

k-NN scores on training data look unrealistically good because each row is its own nearest neighbor. Split the data first.

```r title="Train on 70 percent and score on the rest"
set.seed(1)
idx <- createDataPartition(iris$Species, p = 0.7, list = FALSE)
train_df <- iris[idx, ]
test_df  <- iris[-idx, ]

fit_split <- knn3(Species ~ ., data = train_df, k = 5)
pred <- predict(fit_split, newdata = test_df, type = "class")
mean(pred == test_df$Species)
#> [1] 0.9555556
```

The 0.95 accuracy on held-out rows is an honest estimate. Re-running with `k = 1` inflates training accuracy to 1.0 but typically drops test accuracy because the model memorizes noise. Larger k values smooth the boundary at the cost of letting rare classes get outvoted.

### 5. Compare k values without resampling

A quick sweep over candidate k values, scored once on a held-out set, is enough to pick a reasonable neighborhood size for exploration.

```r title="Score multiple k values on the same split"
ks <- c(1, 3, 5, 7, 11, 15)
acc <- sapply(ks, function(k) {
  fit_k <- knn3(Species ~ ., data = train_df, k = k)
  mean(predict(fit_k, test_df, type = "class") == test_df$Species)
})
data.frame(k = ks, accuracy = acc)
#>    k  accuracy
#> 1  1 0.9333333
#> 2  3 0.9555556
#> 3  5 0.9555556
#> 4  7 0.9777778
#> 5 11 0.9777778
#> 6 15 0.9555556
```

The sweet spot here is `k = 7` to `k = 11`. A single split is a noisy estimator; for a defensible choice, switch to repeated cross-validation through `train()` once the rough range is known.

[KEY INSIGHT]
**Standardize predictors before any k-NN fit.** Euclidean distance treats one unit of `Petal.Width` (a centimeter difference) the same as one unit of `Sepal.Length`. When features live on different scales, the larger-range variable silently dominates the distance. Run `scale()` or wrap `knn3` inside a `train()` call with `preProcess = c("center", "scale")` to neutralize that bias.

## knn3() vs knn() and caret train(method = "knn")

**`knn3()` is the model object; `knn()` is a one-shot call; `train(method = "knn")` is the resampled wrapper.** All three compute the same neighbors and majority vote, but expose the result differently.

| Function | Returns | Resampling built in | Probability output |
|---|---|---|---|
| `knn3()` (caret) | a `knn3` model object that supports `predict()` | No, use `train()` for that | Yes, `predict(fit, type = "prob")` |
| `class::knn()` | a factor of predicted classes only | No | No, only votes |
| `train(method = "knn")` | a `train` object with cross-validated metrics and a `bestTune` row | Yes, via `trControl` | Yes, via `predict(fit, type = "prob")` |

Pick `knn3()` when you want a saved model to `predict()` on later. Pick `class::knn()` for one-line scripts. Pick `train(method = "knn")` when you want caret to pick `k` via cross-validation. See the [caret reference](https://topepo.github.io/caret/) for the full option list.

## Common pitfalls

**Pitfall 1: passing a numeric outcome.** `knn3()` is classification-only; for numeric outcomes use `knnreg()`. Check `class(df$y)` first.

**Pitfall 2: forgetting to scale predictors.** Variables on larger scales dominate the Euclidean distance. Standardize with `scale()` first, or use `preProcess = c("center", "scale")` inside `train()`.

**Pitfall 3: choosing k by training accuracy.** k = 1 always achieves perfect training accuracy because each row is its closest neighbor. Score on a held-out partition, never on training rows.

**Pitfall 4: imbalanced classes.** Majority voting biases toward whichever class fills the neighborhood. Rebalance with `caret::upSample()`, or use distance-weighted `kknn::kknn()`.

[WARNING]
**`predict()` on `knn3` does not accept a vector.** Pass a data frame or matrix with the same column names and structure as the training data. A single new observation must be wrapped as a one-row data frame, not a numeric vector.

## Try it yourself

**Try it:** Fit a knn3 classifier on iris with `k = 7`, predict the class of the first row of the training data, and check the predicted probabilities. Save the predictions to `ex_class` and `ex_prob`.

```r title="Your turn: predict class and probability"
# Try it: knn3 with k = 7
ex_fit <- knn3(Species ~ ., data = iris, k = 7)
ex_class <- # your code here
ex_prob  <- # your code here

ex_class
ex_prob
#> Expected: setosa and a probability row with 1.0 in the setosa column
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_fit <- knn3(Species ~ ., data = iris, k = 7)
ex_class <- predict(ex_fit, newdata = iris[1, ], type = "class")
ex_prob  <- predict(ex_fit, newdata = iris[1, ], type = "prob")

ex_class
#> [1] setosa
#> Levels: setosa versicolor virginica
ex_prob
#>   setosa versicolor virginica
#> 1      1          0         0
```

**Explanation:** `type = "class"` returns the majority vote; `type = "prob"` returns the vote fractions. For the first iris row (a clear setosa), all 7 neighbors are setosa.

</details>

## Related caret functions

These complete a typical k-NN workflow:

- `knnreg()`: regression counterpart for numeric outcomes
- `train()` with `method = "knn"`: resampled, cross-validated k-NN
- `createDataPartition()`: stratified train/test split before fitting
- `confusionMatrix()`: per-class metrics for predictions
- `preProcess()`: center, scale, or impute predictors before distances

## FAQ

**What is the difference between knn3() and knn() in R?**

`class::knn()` is a one-shot base R function that takes training data, test data, and labels, and returns predictions in a single call. `knn3()` returns a model object you can save and reuse; call `predict()` on it later with new data. `knn3()` also exposes `type = "prob"` for class probabilities, which base `knn()` does not. Pick `knn3()` when you want to score multiple test sets without rebuilding the training structure.

**How do I choose the best k for knn3?**

Cross-validate over a grid of candidate values via `train(Species ~ ., method = "knn", tuneGrid = data.frame(k = c(3, 5, 7, 9, 11)), trControl = trainControl(method = "cv", number = 10))`. The `bestTune` slot stores the winning k. Start near the square root of the training-set size and search 5 values around it.

**Does knn3() return probabilities?**

Yes. Call `predict(fit, newdata = ..., type = "prob")` to get a numeric matrix with one column per class. Each row sums to 1. The probability is the fraction of the `k` neighbors in that class, so with `k = 5` the possible values are 0, 0.2, 0.4, 0.6, 0.8, and 1.0.

**Can knn3() handle missing values?**

Not directly. By default it errors on `NA` rows. Either pre-impute with `caret::preProcess(..., method = "knnImpute")` or drop incomplete rows with `na.action = na.omit`. Imputing is safer when missingness is not at random; dropping works for a quick exploratory fit on otherwise clean data.

**Is knn3() suitable for large datasets?**

Not really. k-NN computes distances from every test row to every training row at prediction time, so cost scales with `n_train * n_test * p`. For training sets above 100,000 rows, use approximate-neighbor packages like `FNN` or `RANN`, or switch to a parametric model. `knn3()` is best for teaching, prototyping, and moderate-sized tabular problems.
