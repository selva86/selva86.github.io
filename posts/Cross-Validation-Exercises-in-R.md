---
title: "Cross Validation Exercises in R: 20 Practice Problems"
slug: "Cross-Validation-Exercises-in-R"
description: "Master cross-validation in R with 20 practice problems: k-fold, LOOCV, repeated CV, time-series CV, caret, rsample. Hidden solutions."
keywords: "cross validation R exercises, k-fold CV R, LOOCV R practice, caret CV exercises, rsample R"
mathjax: false
webr: true
date: "2026-05-11"
post_type: "EX"
sidebar_title: "Cross Validation Exercises"
sidebar_order: 139
fr_parent: "R-Tutorial.html"
auto_link_terms: "cross validation R exercises|k-fold CV R|LOOCV R practice|caret CV exercises|rsample R"
auto_link_case_sensitive: false
target_keyword: "cross validation R exercises"
sibling_block_enabled: false
difficulty: "Intermediate"
---

# Cross Validation Exercises in R: 20 Practice Problems

<p class="lead">Twenty practice problems on CV: k-fold, LOOCV, repeated, stratified, time-series, with caret and rsample. Hidden solutions.</p>

```r title="Run this once before any exercise"
library(caret)
library(rsample)
library(dplyr)
```

### Exercise 1: Manual 5-fold CV indices

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
set.seed(1)
folds <- sample(rep(1:5, length.out = nrow(mtcars)))
table(folds)
```

</details>

### Exercise 2: Manual k-fold loop

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
set.seed(1); folds <- sample(rep(1:5, length.out = nrow(mtcars)))
sapply(1:5, function(i) {
  tr <- mtcars[folds != i, ]; te <- mtcars[folds == i, ]
  fit <- lm(mpg ~ wt, data = tr)
  sqrt(mean((te$mpg - predict(fit, te))^2))
}) |> mean()
```

</details>

### Exercise 3: caret CV control

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ctrl <- trainControl(method = "cv", number = 5)
train(mpg ~ ., data = mtcars, method = "lm", trControl = ctrl)
```

</details>

### Exercise 4: caret repeated CV

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ctrl <- trainControl(method = "repeatedcv", number = 5, repeats = 3)
train(mpg ~ ., data = mtcars, method = "lm", trControl = ctrl)
```

</details>

### Exercise 5: LOOCV

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ctrl <- trainControl(method = "LOOCV")
train(mpg ~ wt, data = mtcars, method = "lm", trControl = ctrl)
```

</details>

### Exercise 6: rsample vfold_cv

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
set.seed(1); vfold_cv(mtcars, v = 5)
```

</details>

### Exercise 7: rsample bootstrap

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
set.seed(1); bootstraps(mtcars, times = 25)
```

</details>

### Exercise 8: Stratified CV

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
set.seed(1); vfold_cv(iris, v = 5, strata = Species)
```

</details>

### Exercise 9: Time-series CV (caret)

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
ctrl <- trainControl(method = "timeslice", initialWindow = 20, horizon = 5, fixedWindow = TRUE)
ctrl
```

</details>

### Exercise 10: rolling_origin (rsample)

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
set.seed(1)
rolling_origin(mtcars, initial = 25, assess = 5, cumulative = TRUE)
```

</details>

### Exercise 11: Compare two models with caret

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
ctrl <- trainControl(method = "cv", number = 5)
m1 <- train(mpg ~ wt, data = mtcars, method = "lm", trControl = ctrl)
m2 <- train(mpg ~ wt + hp, data = mtcars, method = "lm", trControl = ctrl)
resamples(list(m1 = m1, m2 = m2)) |> summary()
```

</details>

### Exercise 12: CV with tidymodels workflow

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
library(tidymodels)
folds <- vfold_cv(mtcars, v = 5)
fit_resamples(linear_reg() |> set_engine("lm") |> set_mode("regression"),
              mpg ~ wt, folds)
```

</details>

### Exercise 13: Compute RMSE manually

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
sqrt(mean((c(1, 2, 3) - c(1.1, 2.2, 2.7))^2))
```

</details>

### Exercise 14: Compute MAE

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
mean(abs(c(1, 2, 3) - c(1.1, 2.2, 2.7)))
```

</details>

### Exercise 15: Out-of-fold predictions

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
set.seed(1); folds <- sample(rep(1:5, length.out = nrow(mtcars)))
oof <- numeric(nrow(mtcars))
for (i in 1:5) {
  tr <- mtcars[folds != i, ]; te <- mtcars[folds == i, ]
  oof[folds == i] <- predict(lm(mpg ~ wt, data = tr), te)
}
sqrt(mean((mtcars$mpg - oof)^2))
```

</details>

### Exercise 16: CV with feature engineering

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
ctrl <- trainControl(method = "cv", number = 5)
train(mpg ~ wt + I(wt^2), data = mtcars, method = "lm", trControl = ctrl)
```

</details>

### Exercise 17: Tuning grid with CV

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
ctrl <- trainControl(method = "cv", number = 5)
train(mpg ~ ., data = mtcars, method = "rf",
      tuneGrid = expand.grid(mtry = c(2, 4, 6)),
      trControl = ctrl)
```

</details>

### Exercise 18: Bootstrap validation

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
ctrl <- trainControl(method = "boot", number = 50)
train(mpg ~ ., data = mtcars, method = "lm", trControl = ctrl)
```

</details>

### Exercise 19: Reproducible CV with seeds

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
set.seed(1)
seeds <- vector(mode = "list", length = 6)
for (i in 1:5) seeds[[i]] <- sample.int(1e4, 1)
seeds[[6]] <- 1
ctrl <- trainControl(method = "cv", number = 5, seeds = seeds)
```

</details>

### Exercise 20: Nested CV concept

**Difficulty:** Advanced. Outer CV for evaluation, inner CV for tuning.

<details><summary>Show solution</summary>

```r
# Conceptual outline
# outer: vfold_cv(data, v = 5)
# for each outer fold: tune model on inner CV, evaluate on outer test
# Returns honest performance estimate when tuning is part of the model
```

</details>

## What to do next

- **Machine-Learning-Exercises** (shipped) — CV inside ML pipelines.
- **tidymodels-Exercises** (coming) — modern workflow CV.
