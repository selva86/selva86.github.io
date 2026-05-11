---
title: "Random Forest Exercises in R: 20 Practice Problems"
slug: "Random-Forest-Exercises-in-R"
description: "Master Random Forest in R with 20 practice problems: classification, regression, tuning, importance, ranger. Hidden solutions."
keywords: "random forest R exercises, randomForest practice R, ranger R, random forest tuning R, RF feature importance R"
mathjax: false
webr: true
date: "2026-05-11"
post_type: "EX"
sidebar_title: "Random Forest Exercises"
sidebar_order: 140
fr_parent: "R-Tutorial.html"
auto_link_terms: "random forest R exercises|randomForest practice R|ranger R|RF feature importance R"
auto_link_case_sensitive: false
target_keyword: "random forest R exercises"
sibling_block_enabled: false
difficulty: "Intermediate"
---

# Random Forest Exercises in R: 20 Practice Problems

<p class="lead">Twenty practice problems on Random Forest in R: classification, regression, tuning, variable importance, ranger. Hidden solutions.</p>

```r title="Run this once before any exercise"
library(randomForest)
library(ranger)
library(caret)
```

### Exercise 1: Classification RF on iris

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
set.seed(1)
randomForest(Species ~ ., data = iris)
```

</details>

### Exercise 2: Regression RF on mtcars

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
set.seed(1)
randomForest(mpg ~ ., data = mtcars)
```

</details>

### Exercise 3: Specify number of trees

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
set.seed(1)
randomForest(Species ~ ., data = iris, ntree = 100)
```

</details>

### Exercise 4: Specify mtry

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
set.seed(1)
randomForest(Species ~ ., data = iris, mtry = 2)
```

</details>

### Exercise 5: OOB error

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
set.seed(1)
fit <- randomForest(Species ~ ., data = iris)
fit$err.rate[nrow(fit$err.rate), 1]
```

</details>

### Exercise 6: Variable importance

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
set.seed(1)
fit <- randomForest(Species ~ ., data = iris, importance = TRUE)
importance(fit)
```

</details>

### Exercise 7: Variable importance plot

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
set.seed(1)
fit <- randomForest(Species ~ ., data = iris)
varImpPlot(fit)
```

</details>

### Exercise 8: Predict probabilities

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
set.seed(1)
fit <- randomForest(Species ~ ., data = iris)
head(predict(fit, iris, type = "prob"))
```

</details>

### Exercise 9: Confusion matrix

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
set.seed(1)
fit <- randomForest(Species ~ ., data = iris)
fit$confusion
```

</details>

### Exercise 10: ranger basic

**Difficulty:** Intermediate. Faster than randomForest.

<details><summary>Show solution</summary>

```r
set.seed(1)
ranger(Species ~ ., data = iris)
```

</details>

### Exercise 11: ranger importance

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
set.seed(1)
fit <- ranger(Species ~ ., data = iris, importance = "permutation")
importance(fit)
```

</details>

### Exercise 12: Tune mtry with caret

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
set.seed(1)
train(Species ~ ., data = iris, method = "rf",
      tuneGrid = expand.grid(mtry = c(1, 2, 3, 4)),
      trControl = trainControl(method = "cv", number = 5))
```

</details>

### Exercise 13: Cross-validated RF RMSE

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
set.seed(1)
train(mpg ~ ., data = mtcars, method = "rf",
      trControl = trainControl(method = "cv", number = 5))
```

</details>

### Exercise 14: Train-test split + RMSE

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
set.seed(1)
idx <- sample(seq_len(nrow(mtcars)), 22)
tr <- mtcars[idx, ]; te <- mtcars[-idx, ]
fit <- randomForest(mpg ~ ., data = tr)
sqrt(mean((te$mpg - predict(fit, te))^2))
```

</details>

### Exercise 15: Class weights for imbalance

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
set.seed(1)
randomForest(Species ~ ., data = iris, classwt = c(1, 1, 2))
```

</details>

### Exercise 16: Stratified sampling

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
set.seed(1)
randomForest(Species ~ ., data = iris, sampsize = c(20, 20, 20),
             strata = iris$Species)
```

</details>

### Exercise 17: Partial dependence

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
set.seed(1)
fit <- randomForest(mpg ~ ., data = mtcars)
partialPlot(fit, mtcars, "wt")
```

</details>

### Exercise 18: Predict on new data

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
set.seed(1)
fit <- randomForest(mpg ~ ., data = mtcars)
predict(fit, mtcars[1:3, ])
```

</details>

### Exercise 19: nodesize parameter

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
set.seed(1)
randomForest(Species ~ ., data = iris, nodesize = 5)
```

</details>

### Exercise 20: Compare to logistic regression

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
set.seed(1)
binary <- iris |> dplyr::mutate(y = as.integer(Species == "virginica"))
fit_glm <- glm(y ~ Sepal.Length + Petal.Length, data = binary, family = binomial)
fit_rf  <- randomForest(factor(y) ~ Sepal.Length + Petal.Length, data = binary)
list(glm_acc = mean(round(predict(fit_glm, type = "response")) == binary$y),
     rf_acc  = mean(predict(fit_rf) == factor(binary$y)))
```

</details>

## What to do next

- **XGBoost-Exercises** (coming) — gradient boosting alternative.
- **Machine-Learning-Exercises** (shipped) — broader ML drills.
