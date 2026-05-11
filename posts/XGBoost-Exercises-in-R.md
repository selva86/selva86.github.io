---
title: "XGBoost Exercises in R: 20 Practice Problems"
slug: "XGBoost-Exercises-in-R"
description: "Master XGBoost in R with 20 practice problems: regression, classification, tuning, early stopping, importance, SHAP. Hidden solutions."
keywords: "xgboost R exercises, xgboost practice R, xgboost tuning R, xgboost feature importance R, xgb.train exercises"
mathjax: false
webr: true
date: "2026-05-11"
post_type: "EX"
sidebar_title: "XGBoost Exercises"
sidebar_order: 141
fr_parent: "R-Tutorial.html"
auto_link_terms: "xgboost R exercises|xgboost practice R|xgboost tuning R|xgb.train exercises"
auto_link_case_sensitive: false
target_keyword: "xgboost R exercises"
sibling_block_enabled: false
difficulty: "Advanced"
---

# XGBoost Exercises in R: 20 Practice Problems

<p class="lead">Twenty practice problems on XGBoost in R: regression, classification, tuning, early stopping, feature importance, SHAP. Hidden solutions.</p>

```r title="Run this once before any exercise"
library(xgboost)
library(caret)
```

### Exercise 1: Regression with xgb.train

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
x <- as.matrix(mtcars[, -1]); y <- mtcars$mpg
d <- xgb.DMatrix(x, label = y)
fit <- xgb.train(params = list(objective = "reg:squarederror"),
                 data = d, nrounds = 100, verbose = 0)
```

</details>

### Exercise 2: Binary classification

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
x <- as.matrix(mtcars[, c("mpg","hp","wt")]); y <- mtcars$am
d <- xgb.DMatrix(x, label = y)
fit <- xgb.train(params = list(objective = "binary:logistic", eval_metric = "logloss"),
                 data = d, nrounds = 100, verbose = 0)
```

</details>

### Exercise 3: Multiclass

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
x <- as.matrix(iris[, 1:4]); y <- as.integer(iris$Species) - 1
d <- xgb.DMatrix(x, label = y)
fit <- xgb.train(params = list(objective = "multi:softprob", num_class = 3),
                 data = d, nrounds = 50, verbose = 0)
```

</details>

### Exercise 4: Set learning rate (eta)

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
x <- as.matrix(mtcars[, -1]); y <- mtcars$mpg
d <- xgb.DMatrix(x, label = y)
xgb.train(list(objective = "reg:squarederror", eta = 0.05),
          d, nrounds = 100, verbose = 0)
```

</details>

### Exercise 5: max_depth

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
xgb.train(list(objective = "reg:squarederror", max_depth = 3),
          xgb.DMatrix(as.matrix(mtcars[,-1]), label = mtcars$mpg),
          nrounds = 50, verbose = 0)
```

</details>

### Exercise 6: Watchlist + early stopping

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
set.seed(1)
idx <- sample(seq_len(nrow(mtcars)), 22)
dtr <- xgb.DMatrix(as.matrix(mtcars[idx, -1]), label = mtcars$mpg[idx])
dte <- xgb.DMatrix(as.matrix(mtcars[-idx, -1]), label = mtcars$mpg[-idx])
fit <- xgb.train(list(objective = "reg:squarederror"),
                 dtr, nrounds = 200, watchlist = list(test = dte),
                 early_stopping_rounds = 10, verbose = 0)
fit$best_iteration
```

</details>

### Exercise 7: Predict on new

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
x <- as.matrix(mtcars[, -1])
d <- xgb.DMatrix(x, label = mtcars$mpg)
fit <- xgb.train(list(objective = "reg:squarederror"), d, nrounds = 50, verbose = 0)
predict(fit, x[1:3, ])
```

</details>

### Exercise 8: xgb.cv built-in CV

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
d <- xgb.DMatrix(as.matrix(mtcars[,-1]), label = mtcars$mpg)
xgb.cv(list(objective = "reg:squarederror"),
       d, nrounds = 100, nfold = 5, verbose = 0)
```

</details>

### Exercise 9: Feature importance

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
d <- xgb.DMatrix(as.matrix(mtcars[,-1]), label = mtcars$mpg)
fit <- xgb.train(list(objective = "reg:squarederror"), d, nrounds = 100, verbose = 0)
xgb.importance(model = fit)
```

</details>

### Exercise 10: Plot importance

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
d <- xgb.DMatrix(as.matrix(mtcars[,-1]), label = mtcars$mpg)
fit <- xgb.train(list(objective = "reg:squarederror"), d, nrounds = 100, verbose = 0)
xgb.plot.importance(xgb.importance(model = fit))
```

</details>

### Exercise 11: Regularization with lambda

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
d <- xgb.DMatrix(as.matrix(mtcars[,-1]), label = mtcars$mpg)
xgb.train(list(objective = "reg:squarederror", lambda = 1),
          d, nrounds = 50, verbose = 0)
```

</details>

### Exercise 12: subsample row sampling

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
d <- xgb.DMatrix(as.matrix(mtcars[,-1]), label = mtcars$mpg)
xgb.train(list(objective = "reg:squarederror", subsample = 0.7),
          d, nrounds = 50, verbose = 0)
```

</details>

### Exercise 13: colsample_bytree

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
d <- xgb.DMatrix(as.matrix(mtcars[,-1]), label = mtcars$mpg)
xgb.train(list(objective = "reg:squarederror", colsample_bytree = 0.7),
          d, nrounds = 50, verbose = 0)
```

</details>

### Exercise 14: caret tuning grid

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
set.seed(1)
train(mpg ~ ., data = mtcars, method = "xgbTree",
      tuneGrid = expand.grid(nrounds = 50, max_depth = c(3, 5),
                             eta = c(0.05, 0.1), gamma = 0,
                             colsample_bytree = 0.7, min_child_weight = 1, subsample = 0.7),
      trControl = trainControl(method = "cv", number = 5))
```

</details>

### Exercise 15: Save model

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
d <- xgb.DMatrix(as.matrix(mtcars[,-1]), label = mtcars$mpg)
fit <- xgb.train(list(objective = "reg:squarederror"), d, nrounds = 50, verbose = 0)
xgb.save(fit, "model.bin")
```

</details>

### Exercise 16: Load model

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
loaded <- xgb.load("model.bin")
```

</details>

### Exercise 17: SHAP values

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
d <- xgb.DMatrix(as.matrix(mtcars[,-1]), label = mtcars$mpg)
fit <- xgb.train(list(objective = "reg:squarederror"), d, nrounds = 50, verbose = 0)
predict(fit, as.matrix(mtcars[,-1]), predcontrib = TRUE) |> head()
```

</details>

### Exercise 18: Custom eval metric

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
mae <- function(preds, dtrain) {
  labels <- getinfo(dtrain, "label")
  list(metric = "mae", value = mean(abs(preds - labels)))
}
d <- xgb.DMatrix(as.matrix(mtcars[,-1]), label = mtcars$mpg)
xgb.train(list(objective = "reg:squarederror"), d, nrounds = 50,
          feval = mae, watchlist = list(train = d), verbose = 0)
```

</details>

### Exercise 19: Class imbalance scale_pos_weight

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
# pos = 100, neg = 900 -> scale = 9
xgb.train(list(objective = "binary:logistic", scale_pos_weight = 9),
          xgb.DMatrix(matrix(rnorm(100), ncol = 10), label = sample(0:1, 10, replace = TRUE)),
          nrounds = 10, verbose = 0)
```

</details>

### Exercise 20: Compare to random forest

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
set.seed(1)
idx <- sample(seq_len(nrow(mtcars)), 22)
tr <- mtcars[idx, ]; te <- mtcars[-idx, ]
rf <- randomForest::randomForest(mpg ~ ., data = tr)
xgb_fit <- xgb.train(list(objective = "reg:squarederror"),
                     xgb.DMatrix(as.matrix(tr[,-1]), label = tr$mpg),
                     nrounds = 100, verbose = 0)
list(rf_rmse = sqrt(mean((te$mpg - predict(rf, te))^2)),
     xgb_rmse = sqrt(mean((te$mpg - predict(xgb_fit, as.matrix(te[,-1])))^2)))
```

</details>

## What to do next

- **Random-Forest-Exercises** (shipped) — comparison.
- **Machine-Learning-Exercises** (shipped) — broader practice.
