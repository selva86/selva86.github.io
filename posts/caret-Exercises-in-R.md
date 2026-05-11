---
title: "caret Exercises in R: 15 Practice Problems"
slug: "caret-Exercises-in-R"
description: "Master caret in R with 15 practice problems: train, trainControl, tuning, preprocessing, model comparison."
keywords: "caret R exercises, caret practice, caret tune R, caret train R, R caret examples"
mathjax: false
webr: true
date: "2026-05-11"
post_type: "EX"
sidebar_title: "caret Exercises"
sidebar_order: 171
fr_parent: "R-Tutorial.html"
auto_link_terms: "caret R exercises|caret practice|caret tune R|R caret examples"
auto_link_case_sensitive: false
target_keyword: "caret R exercises"
sibling_block_enabled: false
difficulty: "Intermediate"
---

# caret Exercises in R: 15 Practice Problems

<p class="lead">Fifteen practice problems on caret in R: train, trainControl, preprocessing, tuning, model comparison.</p>

```r
library(caret)
```

### Exercise 1: train lm

<details><summary>Show solution</summary>

```r
train(mpg ~ ., data = mtcars, method = "lm")
```

</details>

### Exercise 2: 5-fold CV

<details><summary>Show solution</summary>

```r
train(mpg ~ ., data = mtcars, method = "lm",
      trControl = trainControl(method = "cv", number = 5))
```

</details>

### Exercise 3: Repeated CV

<details><summary>Show solution</summary>

```r
train(mpg ~ ., data = mtcars, method = "lm",
      trControl = trainControl(method = "repeatedcv", number = 5, repeats = 3))
```

</details>

### Exercise 4: RF with tuneGrid

<details><summary>Show solution</summary>

```r
train(mpg ~ ., data = mtcars, method = "rf",
      tuneGrid = expand.grid(mtry = c(2, 4, 6)))
```

</details>

### Exercise 5: createDataPartition

<details><summary>Show solution</summary>

```r
set.seed(1)
idx <- createDataPartition(iris$Species, p = 0.7, list = FALSE)
nrow(iris[idx, ])
```

</details>

### Exercise 6: Preprocessing center/scale

<details><summary>Show solution</summary>

```r
train(Species ~ ., data = iris, method = "knn",
      preProcess = c("center","scale"))
```

</details>

### Exercise 7: NearZeroVar

<details><summary>Show solution</summary>

```r
nearZeroVar(mtcars)
```

</details>

### Exercise 8: Class probabilities

<details><summary>Show solution</summary>

```r
train(Species ~ ., data = iris, method = "rf",
      trControl = trainControl(classProbs = TRUE))
```

</details>

### Exercise 9: ROC summary metric

<details><summary>Show solution</summary>

```r
binary <- iris |> dplyr::filter(Species != "setosa") |>
  dplyr::mutate(Species = droplevels(Species))
train(Species ~ ., data = binary, method = "rf",
      trControl = trainControl(method = "cv", number = 5,
                               classProbs = TRUE, summaryFunction = twoClassSummary),
      metric = "ROC")
```

</details>

### Exercise 10: confusionMatrix

<details><summary>Show solution</summary>

```r
fit <- train(Species ~ ., data = iris, method = "rf")
confusionMatrix(predict(fit, iris), iris$Species)
```

</details>

### Exercise 11: Compare with resamples

<details><summary>Show solution</summary>

```r
ctrl <- trainControl(method = "cv", number = 5)
m1 <- train(mpg ~ ., data = mtcars, method = "lm", trControl = ctrl)
m2 <- train(mpg ~ ., data = mtcars, method = "rf", trControl = ctrl)
resamples(list(m1 = m1, m2 = m2)) |> summary()
```

</details>

### Exercise 12: varImp

<details><summary>Show solution</summary>

```r
fit <- train(mpg ~ ., data = mtcars, method = "rf")
varImp(fit)
```

</details>

### Exercise 13: predict on test set

<details><summary>Show solution</summary>

```r
set.seed(1)
idx <- createDataPartition(iris$Species, p = 0.7, list = FALSE)
fit <- train(Species ~ ., data = iris[idx, ], method = "rf")
predict(fit, iris[-idx, ]) |> head()
```

</details>

### Exercise 14: Adaptive resampling

<details><summary>Show solution</summary>

```r
train(mpg ~ ., data = mtcars, method = "rf",
      trControl = trainControl(method = "adaptive_cv",
                               adaptive = list(min = 3, alpha = 0.05, method = "BT", complete = TRUE),
                               search = "random"))
```

</details>

### Exercise 15: Save and load

<details><summary>Show solution</summary>

```r
fit <- train(mpg ~ ., data = mtcars, method = "lm")
saveRDS(fit, "caret_fit.rds")
```

</details>

## What to do next

- **tidymodels-Exercises** (shipped) — modern alternative.
- **Machine-Learning-Exercises** (shipped) — broader practice.
