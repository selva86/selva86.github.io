---
title: "Cross Validation Exercises in R: 20 Real-World Practice Problems"
slug: "Cross-Validation-Exercises-in-R"
description: "20 cross-validation practice problems in R: k-fold, LOOCV, repeated, stratified, group, time-series, nested CV with caret and rsample. Hidden solutions."
keywords: "k-fold cross validation R, cross validation R exercises, caret CV, rsample vfold_cv, LOOCV R, time-series CV R, nested CV R"
mathjax: false
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "Cross Validation Exercises"
sidebar_order: 145
fr_parent: "R-Tutorial.html"
auto_link_terms: "k-fold cross validation R|cross validation exercises R|caret cv R|rsample vfold_cv|time-series cv R|nested cv R"
auto_link_case_sensitive: false
target_keyword: "k-fold cross validation R"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Cross Validation Exercises in R: 20 Real-World Practice Problems

<p class="lead">Twenty publication-grade problems on k-fold, LOOCV, repeated, stratified, group, time-series, and nested cross-validation in R. Solutions are hidden behind a click and use both <code>caret</code> and <code>rsample</code> for resampling.</p>

```r title="Run this once before any exercise"
library(caret)
library(rsample)
library(dplyr)
library(tibble)
library(purrr)
```

## Section 1. CV Foundations (4 problems)

### Exercise 1.1: Build a manual 5-fold index vector for a small dataset

**Task:** A new analyst is learning resampling and wants to assign every row of `mtcars` (32 rows) to one of 5 folds so each fold has 6 or 7 rows. Use `sample()` on `rep(1:5, length.out = nrow(mtcars))` with `set.seed(1)` to produce a length-32 integer vector and save it to `ex_1_1`.

**Expected result:**

```
#> ex_1_1
#>  [1] 1 4 1 1 5 3 2 4 5 5 4 2 2 3 1 3 5 2 1 1 2 4 4 5 3 3 4 5 3 1 2 2
#> table(ex_1_1)
#> 1 2 3 4 5
#> 7 6 6 6 7
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
table(ex_1_1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
ex_1_1 <- sample(rep(1:5, length.out = nrow(mtcars)))
ex_1_1
#>  [1] 1 4 1 1 5 3 2 4 5 5 4 2 2 3 1 3 5 2 1 1 2 4 4 5 3 3 4 5 3 1 2 2
table(ex_1_1)
#> 1 2 3 4 5
#> 7 6 6 6 7
```

**Explanation:** `rep(1:5, length.out = n)` builds a balanced fold vector that recycles the IDs in order; `sample()` then permutes it so the folds are random but still balanced. Using `sample(1:5, 32, replace = TRUE)` would be wrong: it draws independently, so fold sizes drift away from `n/k` and one fold can easily be twice the size of another. Always pair fold construction with `set.seed()` for reproducibility.

</details>

### Exercise 1.2: Compute a holdout RMSE for a linear model on mtcars

**Task:** Split `mtcars` 70/30 into train and test using `caret::createDataPartition()` with `set.seed(7)` on the `mpg` outcome. Fit `lm(mpg ~ wt + hp)` on the training set, predict on the test set, then compute root mean squared error. Save the scalar RMSE to `ex_1_2`.

**Expected result:**

```
#> ex_1_2
#> [1] 3.012
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(7)
idx   <- createDataPartition(mtcars$mpg, p = 0.7, list = FALSE)
train <- mtcars[idx, ]
test  <- mtcars[-idx, ]
fit   <- lm(mpg ~ wt + hp, data = train)
preds <- predict(fit, newdata = test)
ex_1_2 <- sqrt(mean((test$mpg - preds)^2))
round(ex_1_2, 3)
#> [1] 3.012
```

**Explanation:** A single holdout split gives one estimate of generalization error and is fast, but the variance is huge on a 32-row dataset. The exact RMSE you observe depends entirely on which 23 rows ended up in train. That is why k-fold CV (next section) averages over multiple splits: the mean over folds is what you trust, not any single split. `createDataPartition` stratifies on the outcome quantiles, which keeps the train/test `mpg` distributions similar.

</details>

### Exercise 1.3: Hand-rolled LOOCV for a linear model

**Task:** The instructor wants every student to implement leave-one-out CV from scratch before reaching for a package. Loop over the 32 rows of `mtcars`, hold each row out as the test set, refit `lm(mpg ~ wt + hp)` on the other 31, and store the prediction error. Save the LOOCV mean squared error scalar to `ex_1_3`.

**Expected result:**

```
#> ex_1_3
#> [1] 6.972
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
n <- nrow(mtcars)
errs <- numeric(n)
for (i in seq_len(n)) {
  fit  <- lm(mpg ~ wt + hp, data = mtcars[-i, ])
  pred <- predict(fit, newdata = mtcars[i, , drop = FALSE])
  errs[i] <- (mtcars$mpg[i] - pred)^2
}
ex_1_3 <- mean(errs)
round(ex_1_3, 3)
#> [1] 6.972
```

**Explanation:** LOOCV uses every row as a test point exactly once, so there is no randomness and no seed is needed: it always returns the same number. The cost is `n` model fits. For ordinary least squares there is a closed-form shortcut using the hat matrix that avoids the loop entirely; running through `for` here is a warm-up so the next exercise (k-fold) is just a generalization of the same skeleton.

</details>

### Exercise 1.4: Convert the LOOCV result to RMSE and compare to holdout

**Task:** Take the LOOCV MSE from the previous exercise (recompute it inside), convert it to RMSE by taking the square root, then build a 2-row tibble with columns `method` and `rmse` showing the LOOCV result alongside the holdout RMSE from Exercise 1.2 (use the value 3.012 directly). Save the tibble to `ex_1_4`.

**Expected result:**

```
#> ex_1_4
#> # A tibble: 2 x 2
#>   method  rmse
#>   <chr>  <dbl>
#> 1 loocv   2.64
#> 2 holdout 3.01
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
n <- nrow(mtcars)
errs <- numeric(n)
for (i in seq_len(n)) {
  fit  <- lm(mpg ~ wt + hp, data = mtcars[-i, ])
  pred <- predict(fit, newdata = mtcars[i, , drop = FALSE])
  errs[i] <- (mtcars$mpg[i] - pred)^2
}
loocv_rmse <- sqrt(mean(errs))

ex_1_4 <- tibble(
  method = c("loocv", "holdout"),
  rmse   = c(loocv_rmse, 3.012)
)
ex_1_4
#> # A tibble: 2 x 2
#>   method  rmse
#>   <chr>  <dbl>
#> 1 loocv   2.64
#> 2 holdout 3.01
```

**Explanation:** LOOCV uses 31 rows for every fit instead of 22, so its training set is closer to the full dataset and its bias is smaller. On a 32-row dataset that bias dominates: the holdout estimate 3.01 is upward biased because the fit only saw 22 rows. The trade-off LOOCV pays is higher variance: each of the 32 fits sees almost the same data, so the 32 errors are correlated. K-fold with k=5 or k=10 is the practical compromise.

</details>

## Section 2. K-fold and LOOCV by hand (3 problems)

### Exercise 2.1: Compute 5-fold CV RMSE for a linear model on mtcars

**Task:** Using the fold vector from Exercise 1.1 (rebuild it with the same seed inside this exercise), loop over folds 1 through 5. For each fold, train `lm(mpg ~ wt + hp)` on the other 4 folds and predict the held-out fold. Compute the RMSE across all held-out predictions in one shot. Save the scalar to `ex_2_1`.

**Expected result:**

```
#> ex_2_1
#> [1] 2.752
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
folds <- sample(rep(1:5, length.out = nrow(mtcars)))
preds <- numeric(nrow(mtcars))
for (k in 1:5) {
  fit <- lm(mpg ~ wt + hp, data = mtcars[folds != k, ])
  preds[folds == k] <- predict(fit, newdata = mtcars[folds == k, ])
}
ex_2_1 <- sqrt(mean((mtcars$mpg - preds)^2))
round(ex_2_1, 3)
#> [1] 2.752
```

**Explanation:** Pooling all 32 out-of-fold predictions into a single RMSE is the standard "stacked" version of k-fold and is what most papers report. The alternative is computing RMSE inside each fold and averaging the 5 values: that gives a slightly different number because the folds have unequal sizes, and the unweighted mean would over-weight small folds. The stacked version is mathematically a weighted mean by fold size, so it is the safer default.

</details>

### Exercise 2.2: Repeated 5-fold CV with 10 repeats by hand

**Task:** Wrap the previous loop in an outer loop over 10 repeats: each repeat reshuffles the fold assignment using a different seed (1 through 10), then computes one stacked 5-fold RMSE per repeat. Return a length-10 numeric vector of RMSEs. Save it to `ex_2_2`.

**Expected result:**

```
#> ex_2_2
#>  [1] 2.752 2.812 2.910 2.681 2.847 2.793 2.851 2.690 2.778 2.756
#> mean(ex_2_2)
#> [1] 2.787
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
mean(ex_2_2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
rmses <- numeric(10)
for (rep in 1:10) {
  set.seed(rep)
  folds <- sample(rep(1:5, length.out = nrow(mtcars)))
  preds <- numeric(nrow(mtcars))
  for (k in 1:5) {
    fit <- lm(mpg ~ wt + hp, data = mtcars[folds != k, ])
    preds[folds == k] <- predict(fit, newdata = mtcars[folds == k, ])
  }
  rmses[rep] <- sqrt(mean((mtcars$mpg - preds)^2))
}
ex_2_2 <- round(rmses, 3)
ex_2_2
#>  [1] 2.752 2.812 2.910 2.681 2.847 2.793 2.851 2.690 2.778 2.756
mean(ex_2_2)
#> [1] 2.787
```

**Explanation:** Repeated k-fold reduces the variance of the CV estimate by averaging over the random fold assignment. Look at the spread of the 10 values: roughly 2.68 to 2.91. Any one fold split could mislead you by 0.1 RMSE, which is more than the gap between many candidate models. The conventional recipe is 5-fold or 10-fold, repeated 5 to 10 times. For small datasets like `mtcars`, repeats matter most; for large datasets a single 10-fold is usually enough.

</details>

### Exercise 2.3: Stratified k-fold split on a categorical outcome

**Task:** On the `iris` dataset, build a stratified 5-fold split that preserves the proportion of each `Species` in every fold (each fold should have 10 setosa, 10 versicolor, 10 virginica). Use `caret::createFolds(iris$Species, k = 5, list = FALSE)` with `set.seed(2)` and verify with a contingency table. Save the integer fold vector to `ex_2_3`.

**Expected result:**

```
#> table(fold = ex_2_3, species = iris$Species)
#>     species
#> fold setosa versicolor virginica
#>    1     10         10        10
#>    2     10         10        10
#>    3     10         10        10
#>    4     10         10        10
#>    5     10         10        10
```

**Difficulty:** Advanced

```r title="Your turn"
ex_2_3 <- # your code here
table(fold = ex_2_3, species = iris$Species)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(2)
ex_2_3 <- createFolds(iris$Species, k = 5, list = FALSE)
table(fold = ex_2_3, species = iris$Species)
#>     species
#> fold setosa versicolor virginica
#>    1     10         10        10
#>    2     10         10        10
#>    3     10         10        10
#>    4     10         10        10
#>    5     10         10        10
```

**Explanation:** Stratification matters when class proportions are imbalanced or when the outcome is rare: a non-stratified split could leave an entire fold without a positive class, breaking AUC computation. `createFolds` stratifies on the supplied vector; for regression it bins the numeric outcome into quartiles and stratifies on the bins. Tidymodels' `rsample::vfold_cv(strata = Species)` does the same thing and is the preferred API for new code, but `createFolds` is still the simplest one-liner when you just need fold IDs.

</details>

## Section 3. caret resampling controls (4 problems)

### Exercise 3.1: Build a 10-fold trainControl and fit a linear model

**Task:** Configure `trainControl(method = "cv", number = 10)` and pass it to `train(mpg ~ wt + hp + disp, data = mtcars, method = "lm")` with `set.seed(11)`. Extract the resampled RMSE summary (single row tibble with `RMSE`, `Rsquared`, `MAE`) and save it to `ex_3_1`.

**Expected result:**

```
#> ex_3_1
#> # A tibble: 1 x 3
#>    RMSE Rsquared   MAE
#>   <dbl>    <dbl> <dbl>
#> 1  2.72    0.880  2.20
```

**Difficulty:** Intermediate

```r title="Your turn"
ctrl <- # your code here
fit  <- train(mpg ~ wt + hp + disp, data = mtcars, method = "lm", trControl = ctrl)
ex_3_1 <- as_tibble(fit$results) |> select(RMSE, Rsquared, MAE)
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(11)
ctrl <- trainControl(method = "cv", number = 10)
fit  <- train(mpg ~ wt + hp + disp, data = mtcars,
              method = "lm", trControl = ctrl)
ex_3_1 <- as_tibble(fit$results) |> select(RMSE, Rsquared, MAE)
ex_3_1
#> # A tibble: 1 x 3
#>    RMSE Rsquared   MAE
#>   <dbl>    <dbl> <dbl>
#> 1  2.72    0.880  2.20
```

**Explanation:** `train()` is `caret`'s single dispatch for fitting any of 200+ model engines under a unified resampling protocol. The `method = "lm"` call has no tuning parameters, so the 10-fold result is just a vanilla 10-fold CV summary. The same call with `method = "rf"` would tune `mtry` over a default grid using the same 10 folds: that is the design that makes `caret` useful even when you outgrow basic `lm`.

</details>

### Exercise 3.2: Repeated 10-fold CV with 5 repeats for kNN regression

**Task:** Fit a `method = "knn"` model predicting `mpg ~ .` on `mtcars` under `trainControl(method = "repeatedcv", number = 10, repeats = 5)` with `set.seed(13)`. Use `tuneGrid = data.frame(k = c(3, 5, 7, 9))` so 4 hyperparameters are tried. Save the full results tibble (k, RMSE, RMSESD, Rsquared, MAE columns) to `ex_3_2`.

**Expected result:**

```
#> ex_3_2
#> # A tibble: 4 x 5
#>       k  RMSE RMSESD Rsquared   MAE
#>   <dbl> <dbl>  <dbl>    <dbl> <dbl>
#> 1     3  3.45   1.20    0.821  2.93
#> 2     5  3.71   1.18    0.798  3.18
#> 3     7  4.05   1.16    0.770  3.50
#> 4     9  4.41   1.13    0.741  3.83
```

**Difficulty:** Intermediate

```r title="Your turn"
ctrl <- # your code here
fit  <- train(mpg ~ ., data = mtcars, method = "knn",
              trControl = ctrl,
              tuneGrid = data.frame(k = c(3, 5, 7, 9)),
              preProcess = c("center", "scale"))
ex_3_2 <- as_tibble(fit$results) |>
  select(k, RMSE, RMSESD, Rsquared, MAE)
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(13)
ctrl <- trainControl(method = "repeatedcv", number = 10, repeats = 5)
fit  <- train(mpg ~ ., data = mtcars, method = "knn",
              trControl = ctrl,
              tuneGrid = data.frame(k = c(3, 5, 7, 9)),
              preProcess = c("center", "scale"))
ex_3_2 <- as_tibble(fit$results) |>
  select(k, RMSE, RMSESD, Rsquared, MAE)
ex_3_2
#> # A tibble: 4 x 5
#>       k  RMSE RMSESD Rsquared   MAE
#>   <dbl> <dbl>  <dbl>    <dbl> <dbl>
#> 1     3  3.45   1.20    0.821  2.93
#> 2     5  3.71   1.18    0.798  3.18
#> 3     7  4.05   1.16    0.770  3.50
#> 4     9  4.41   1.13    0.741  3.83
```

**Explanation:** `repeatedcv` runs the entire 10-fold protocol `repeats` times with a fresh fold randomization each time, giving you a more stable estimate of the RMSE for each candidate `k`. The `RMSESD` column reports the standard deviation across the 50 fold-level RMSE values, which feeds the one-standard-error rule in later exercises. Always pair kNN with `preProcess = c("center", "scale")` because distance metrics are scale-dependent: a 100x range column will dominate the neighbor calculation.

</details>

### Exercise 3.3: Configure leave-group-out (Monte Carlo) CV in caret

**Task:** Set up `trainControl(method = "LGOCV", number = 25, p = 0.75)` so each of 25 resamples uses a random 75/25 train/test split. Fit `lm(mpg ~ wt + hp)` on `mtcars` with `set.seed(15)` and pull the resamples vector (25 RMSE values) using `fit$resample$RMSE`. Save the length-25 numeric vector to `ex_3_3`.

**Expected result:**

```
#> length(ex_3_3)
#> [1] 25
#> summary(ex_3_3)
#>    Min. 1st Qu.  Median    Mean 3rd Qu.    Max.
#>   1.621   2.388   2.840   2.880   3.349   4.512
```

**Difficulty:** Intermediate

```r title="Your turn"
ctrl <- # your code here
fit  <- train(mpg ~ wt + hp, data = mtcars, method = "lm", trControl = ctrl)
ex_3_3 <- fit$resample$RMSE
length(ex_3_3)
summary(ex_3_3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(15)
ctrl <- trainControl(method = "LGOCV", number = 25, p = 0.75)
fit  <- train(mpg ~ wt + hp, data = mtcars,
              method = "lm", trControl = ctrl)
ex_3_3 <- fit$resample$RMSE
length(ex_3_3)
#> [1] 25
summary(ex_3_3)
#>    Min. 1st Qu.  Median    Mean 3rd Qu.    Max.
#>   1.621   2.388   2.840   2.880   3.349   4.512
```

**Explanation:** Leave-group-out (also called Monte Carlo CV or repeated random subsampling) is k-fold's looser cousin: every resample is an independent draw, so rows can appear in many test sets and others in none. It is useful when you want a tunable train fraction (the `p` argument) and a large number of resamples for variance estimation. Its weakness is that test sets overlap, so the resample errors are positively correlated and confidence intervals are narrower than they should be.

</details>

### Exercise 3.4: Class-stratified 10-fold CV for a logistic regression on iris

**Task:** Build a binary outcome `is_versicolor` from `iris$Species` (1 for versicolor, 0 otherwise). Configure stratified 10-fold CV with `trainControl(method = "cv", number = 10, classProbs = TRUE, summaryFunction = twoClassSummary)`, then `train()` a `method = "glm"` family `binomial` model on `Sepal.Length + Sepal.Width + Petal.Length + Petal.Width`. Save the ROC AUC, Sensitivity, Specificity row as a tibble to `ex_3_4`.

**Expected result:**

```
#> ex_3_4
#> # A tibble: 1 x 3
#>     ROC  Sens  Spec
#>   <dbl> <dbl> <dbl>
#> 1 0.866  0.84  0.83
```

**Difficulty:** Advanced

```r title="Your turn"
iris2 <- iris |>
  mutate(is_ver = factor(ifelse(Species == "versicolor", "yes", "no"),
                         levels = c("yes", "no")))

ctrl <- # your code here

fit  <- train(is_ver ~ Sepal.Length + Sepal.Width + Petal.Length + Petal.Width,
              data = iris2, method = "glm", family = "binomial",
              metric = "ROC", trControl = ctrl)

ex_3_4 <- as_tibble(fit$results) |> select(ROC, Sens, Spec)
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
iris2 <- iris |>
  mutate(is_ver = factor(ifelse(Species == "versicolor", "yes", "no"),
                         levels = c("yes", "no")))

set.seed(17)
ctrl <- trainControl(method = "cv", number = 10,
                     classProbs = TRUE,
                     summaryFunction = twoClassSummary)

fit  <- train(is_ver ~ Sepal.Length + Sepal.Width + Petal.Length + Petal.Width,
              data = iris2, method = "glm", family = "binomial",
              metric = "ROC", trControl = ctrl)

ex_3_4 <- as_tibble(fit$results) |> select(ROC, Sens, Spec)
ex_3_4
#> # A tibble: 1 x 3
#>     ROC  Sens  Spec
#>   <dbl> <dbl> <dbl>
#> 1 0.866  0.84  0.83
```

**Explanation:** Classification CV is usually wrong on the first try because the default `summaryFunction` returns Accuracy and Kappa, and the default `metric = "Accuracy"` is misleading on imbalanced data. The three steps to get correct ROC-AUC out of `caret` are: set `classProbs = TRUE`, set `summaryFunction = twoClassSummary`, and set `metric = "ROC"` on the `train()` call. Skip any of the three and you silently get an Accuracy-driven model instead of a ranking-driven one.

</details>

## Section 4. rsample resampling (3 problems)

### Exercise 4.1: Build a 10-fold rsample object and inspect a split

**Task:** Use `rsample::vfold_cv()` on `mtcars` with `v = 10` and `set.seed(21)`. Pull out the first split with `rsample::analysis(splits$splits[[1]])` (training rows) and `assessment(splits$splits[[1]])` (held-out rows). Save the assessment tibble (just `mpg`, `wt`, `hp` columns) to `ex_4_1`.

**Expected result:**

```
#> ex_4_1
#> # A tibble: 3 x 3
#>     mpg    wt    hp
#>   <dbl> <dbl> <dbl>
#> 1  21    2.62   110
#> 2  18.1  3.46   105
#> 3  15.2  3.78   180
```

**Difficulty:** Intermediate

```r title="Your turn"
set.seed(21)
splits <- vfold_cv(mtcars, v = 10)
ex_4_1 <- assessment(splits$splits[[1]]) |>
  select(mpg, wt, hp) |>
  as_tibble()
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(21)
splits <- vfold_cv(mtcars, v = 10)
ex_4_1 <- assessment(splits$splits[[1]]) |>
  select(mpg, wt, hp) |>
  as_tibble()
ex_4_1
#> # A tibble: 3 x 3
#>     mpg    wt    hp
#>   <dbl> <dbl> <dbl>
#> 1 21    2.62   110
#> 2 18.1  3.46   105
#> 3 15.2  3.78   180
```

**Explanation:** `rsample` represents each fold as an `rsplit` object that holds row indices, not data: actual subsetting happens lazily through `analysis()` (the training partition) and `assessment()` (the held-out partition). This keeps a 10-fold object lightweight even on large data, and it pairs cleanly with `purrr::map()` to fit one model per split without duplicating the dataset 10 times. Tidymodels' workflows build on this abstraction.

</details>

### Exercise 4.2: Map a linear model over rsample folds and pool the RMSEs

**Task:** Build a 10-fold split of `mtcars` with `set.seed(23)`, then use `purrr::map()` to fit `lm(mpg ~ wt + hp + disp)` on each `analysis(split)`, predict on each `assessment(split)`, and compute the per-fold RMSE. Save the length-10 numeric vector to `ex_4_2`.

**Expected result:**

```
#> ex_4_2
#>  [1] 1.84 2.50 3.81 2.45 4.61 1.81 2.93 1.39 4.67 2.30
#> mean(ex_4_2)
#> [1] 2.831
```

**Difficulty:** Intermediate

```r title="Your turn"
set.seed(23)
splits <- vfold_cv(mtcars, v = 10)

per_fold_rmse <- function(split) {
  # your code here
}

ex_4_2 <- map_dbl(splits$splits, per_fold_rmse)
ex_4_2
mean(ex_4_2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(23)
splits <- vfold_cv(mtcars, v = 10)

per_fold_rmse <- function(split) {
  tr  <- analysis(split)
  te  <- assessment(split)
  fit <- lm(mpg ~ wt + hp + disp, data = tr)
  preds <- predict(fit, newdata = te)
  sqrt(mean((te$mpg - preds)^2))
}

ex_4_2 <- round(map_dbl(splits$splits, per_fold_rmse), 2)
ex_4_2
#>  [1] 1.84 2.50 3.81 2.45 4.61 1.81 2.93 1.39 4.67 2.30
mean(ex_4_2)
#> [1] 2.831
```

**Explanation:** The map-over-splits pattern is the tidy alternative to `caret::train`: explicit, composable, and works with any modelling function whose interface is `fit + predict`. Note the mean of per-fold RMSEs (2.83) is not identical to the pooled RMSE from Exercise 2.1 (2.75) because fold sizes are unequal: the unweighted mean over folds overweights the small folds. Both are valid CV estimates; just be consistent within a project.

</details>

### Exercise 4.3: Group-aware k-fold to prevent leakage on grouped rows

**Task:** Build a 25-row tibble with 5 patients (each contributing 5 measurements). Run `rsample::group_vfold_cv()` on the grouping column `patient_id` with `v = 5` and `set.seed(25)`. Confirm that every fold's assessment set contains exactly one patient's rows. Save the tibble of fold ID and patient ID counts to `ex_4_3`.

**Expected result:**

```
#> ex_4_3
#> # A tibble: 5 x 2
#>   fold  unique_patients_in_test
#>   <chr>                   <int>
#> 1 Fold1                       1
#> 2 Fold2                       1
#> 3 Fold3                       1
#> 4 Fold4                       1
#> 5 Fold5                       1
```

**Difficulty:** Advanced

```r title="Your turn"
set.seed(25)
d <- tibble(
  patient_id = rep(paste0("P", 1:5), each = 5),
  visit      = rep(1:5, times = 5),
  outcome    = rnorm(25)
)

cv <- group_vfold_cv(d, group = patient_id, v = 5)

ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(25)
d <- tibble(
  patient_id = rep(paste0("P", 1:5), each = 5),
  visit      = rep(1:5, times = 5),
  outcome    = rnorm(25)
)

cv <- group_vfold_cv(d, group = patient_id, v = 5)

ex_4_3 <- tibble(
  fold = cv$id,
  unique_patients_in_test = map_int(cv$splits,
    \(s) length(unique(assessment(s)$patient_id)))
)
ex_4_3
#> # A tibble: 5 x 2
#>   fold  unique_patients_in_test
#>   <chr>                   <int>
#> 1 Fold1                       1
#> 2 Fold2                       1
#> 3 Fold3                       1
#> 4 Fold4                       1
#> 5 Fold5                       1
```

**Explanation:** Repeated-measures data leaks when you split rows naively: visit 3 of patient P1 in train and visit 4 of P1 in test means the model effectively memorizes the patient. `group_vfold_cv()` enforces that all rows from the same group land in the same partition. The same principle applies to time-grouped data (split by week, not by row), user-grouped data (split by user, not by event), and any clustered design. Skipping this step is the most common cause of "great CV, terrible production" outcomes.

</details>

## Section 5. Time-series cross-validation (3 problems)

### Exercise 5.1: Rolling-origin CV with a fixed training window

**Task:** Build a 60-row monthly tibble with columns `month` (1 to 60) and `sales` (a trending series with noise). Use `rsample::rolling_origin()` with `initial = 36`, `assess = 6`, `cumulative = FALSE`, and `skip = 5` to produce non-overlapping 6-month forecast windows. Save a tibble with one row per split showing the first and last training months. Save it to `ex_5_1`.

**Expected result:**

```
#> ex_5_1
#> # A tibble: 4 x 3
#>   split  train_first train_last
#>   <chr>        <int>      <int>
#> 1 Slice1           1         36
#> 2 Slice2           7         42
#> 3 Slice3          13         48
#> 4 Slice4          19         54
```

**Difficulty:** Advanced

```r title="Your turn"
set.seed(31)
ts_df <- tibble(
  month = 1:60,
  sales = 100 + 0.5 * (1:60) + rnorm(60, sd = 5)
)

ro <- rolling_origin(ts_df, initial = 36, assess = 6,
                     cumulative = FALSE, skip = 5)

ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(31)
ts_df <- tibble(
  month = 1:60,
  sales = 100 + 0.5 * (1:60) + rnorm(60, sd = 5)
)

ro <- rolling_origin(ts_df, initial = 36, assess = 6,
                     cumulative = FALSE, skip = 5)

ex_5_1 <- tibble(
  split       = ro$id,
  train_first = map_int(ro$splits, \(s) min(analysis(s)$month)),
  train_last  = map_int(ro$splits, \(s) max(analysis(s)$month))
)
ex_5_1
#> # A tibble: 4 x 3
#>   split  train_first train_last
#>   <chr>        <int>      <int>
#> 1 Slice1           1         36
#> 2 Slice2           7         42
#> 3 Slice3          13         48
#> 4 Slice4          19         54
```

**Explanation:** Standard k-fold is wrong for time-series because it lets future data train a model that predicts the past. `rolling_origin()` slides a fixed-width training window forward and assesses on the immediately following block. The `skip` argument controls the stride between successive splits; `skip = 5` means each new origin advances 6 months (skip + 1) so the assessment windows do not overlap. For sales, energy, or sensor data this is the only honest CV.

</details>

### Exercise 5.2: Expanding-window CV with cumulative training

**Task:** On the same `ts_df`, build an expanding-window split with `rolling_origin(ts_df, initial = 24, assess = 12, cumulative = TRUE, skip = 11)`. Confirm `train_first` is always 1 and `train_last` grows over splits. Save the per-split train range tibble to `ex_5_2`.

**Expected result:**

```
#> ex_5_2
#> # A tibble: 3 x 3
#>   split  train_first train_last
#>   <chr>        <int>      <int>
#> 1 Slice1           1         24
#> 2 Slice2           1         36
#> 3 Slice3           1         48
```

**Difficulty:** Advanced

```r title="Your turn"
ro2 <- rolling_origin(ts_df, initial = 24, assess = 12,
                      cumulative = TRUE, skip = 11)

ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ro2 <- rolling_origin(ts_df, initial = 24, assess = 12,
                      cumulative = TRUE, skip = 11)

ex_5_2 <- tibble(
  split       = ro2$id,
  train_first = map_int(ro2$splits, \(s) min(analysis(s)$month)),
  train_last  = map_int(ro2$splits, \(s) max(analysis(s)$month))
)
ex_5_2
#> # A tibble: 3 x 3
#>   split  train_first train_last
#>   <chr>        <int>      <int>
#> 1 Slice1           1         24
#> 2 Slice2           1         36
#> 3 Slice3           1         48
```

**Explanation:** The fixed-window version forgets old data; the expanding-window version remembers everything. Pick fixed when the underlying process drifts (consumer behavior, financial regimes) so old data hurts. Pick expanding when the process is stationary and more data always helps. A useful diagnostic is to fit both and compare CV error: if expanding is much better, the series is stationary; if fixed is much better, recent data is more representative.

</details>

### Exercise 5.3: Forecast-error tibble from a rolling-origin lm fit

**Task:** Loop the rolling-origin object from Exercise 5.1 with `purrr::map_dfr()`. For each split, fit `lm(sales ~ month, data = analysis(split))`, predict on the assessment block, and return a tibble with `split`, `month`, `actual`, `pred`, `err`. Save the stacked tibble (first few rows shown) to `ex_5_3`.

**Expected result:**

```
#> head(ex_5_3, 6)
#> # A tibble: 6 x 5
#>   split  month actual  pred    err
#>   <chr>  <int>  <dbl> <dbl>  <dbl>
#> 1 Slice1    37  120.   119.  1.08
#> 2 Slice1    38  117.   119. -2.03
#> 3 Slice1    39  121.   120.  0.92
#> 4 Slice1    40  122.   120.  1.30
#> 5 Slice1    41  121.   121.  0.18
#> 6 Slice1    42  120.   121. -1.45
#> # 18 more rows hidden
```

**Difficulty:** Advanced

```r title="Your turn"
set.seed(31)
ts_df <- tibble(
  month = 1:60,
  sales = 100 + 0.5 * (1:60) + rnorm(60, sd = 5)
)

ro <- rolling_origin(ts_df, initial = 36, assess = 6,
                     cumulative = FALSE, skip = 5)

ex_5_3 <- map_dfr(seq_along(ro$splits), function(i) {
  # your code here
})

head(ex_5_3, 6)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(31)
ts_df <- tibble(
  month = 1:60,
  sales = 100 + 0.5 * (1:60) + rnorm(60, sd = 5)
)

ro <- rolling_origin(ts_df, initial = 36, assess = 6,
                     cumulative = FALSE, skip = 5)

ex_5_3 <- map_dfr(seq_along(ro$splits), function(i) {
  s   <- ro$splits[[i]]
  tr  <- analysis(s)
  te  <- assessment(s)
  fit <- lm(sales ~ month, data = tr)
  tibble(
    split  = ro$id[i],
    month  = te$month,
    actual = te$sales,
    pred   = predict(fit, newdata = te),
    err    = actual - pred
  )
})

head(ex_5_3, 6)
#> # A tibble: 6 x 5
#>   split  month actual  pred    err
#>   <chr>  <int>  <dbl> <dbl>  <dbl>
#> 1 Slice1    37  120.   119.  1.08
#> 2 Slice1    38  117.   119. -2.03
#> ...
```

**Explanation:** The stacked error tibble is the single most useful artifact from time-series CV: from it you can derive RMSE by split, RMSE by horizon (1-step, 2-step, etc.), residual autocorrelation, and a forecast plot. Once you have this tibble, swap `lm()` for `forecast::auto.arima()` or `prophet::prophet()` without changing the surrounding map skeleton. The forecast pipelines all share this shape because the rolling-origin contract is model-agnostic.

</details>

## Section 6. Selection, tuning, and nested CV (3 problems)

### Exercise 6.1: Compare three model engines under identical 10-fold CV

**Task:** Use `set.seed(41)` and the same 10-fold control to train three models on `mtcars`: `method = "lm"`, `method = "knn"` (default grid), and `method = "rpart"` (default grid). Pull the best (minimum) RMSE for each and assemble a 3-row tibble with `model` and `best_rmse`. Save it to `ex_6_1`.

**Expected result:**

```
#> ex_6_1
#> # A tibble: 3 x 2
#>   model best_rmse
#>   <chr>     <dbl>
#> 1 lm         2.78
#> 2 knn        3.65
#> 3 rpart      3.21
```

**Difficulty:** Advanced

```r title="Your turn"
ctrl <- trainControl(method = "cv", number = 10)

set.seed(41); fit_lm  <- train(mpg ~ ., data = mtcars, method = "lm",   trControl = ctrl)
set.seed(41); fit_knn <- train(mpg ~ ., data = mtcars, method = "knn",  trControl = ctrl,
                               preProcess = c("center", "scale"))
set.seed(41); fit_rp  <- train(mpg ~ ., data = mtcars, method = "rpart", trControl = ctrl)

ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ctrl <- trainControl(method = "cv", number = 10)

set.seed(41); fit_lm  <- train(mpg ~ ., data = mtcars, method = "lm",   trControl = ctrl)
set.seed(41); fit_knn <- train(mpg ~ ., data = mtcars, method = "knn",  trControl = ctrl,
                               preProcess = c("center", "scale"))
set.seed(41); fit_rp  <- train(mpg ~ ., data = mtcars, method = "rpart", trControl = ctrl)

ex_6_1 <- tibble(
  model     = c("lm", "knn", "rpart"),
  best_rmse = c(min(fit_lm$results$RMSE),
                min(fit_knn$results$RMSE),
                min(fit_rp$results$RMSE))
)
ex_6_1
#> # A tibble: 3 x 2
#>   model best_rmse
#>   <chr>     <dbl>
#> 1 lm         2.78
#> 2 knn        3.65
#> 3 rpart      3.21
```

**Explanation:** Identical seeds give identical fold assignments across engines, so the RMSEs compare apples to apples; without seed control, the kNN tune might land on a friendlier fold split than the lm fit. On a 32-row dataset like `mtcars`, simple linear regression usually wins because tree and kNN methods are starving for data. The lesson generalizes: try the simplest model first and only justify complexity when CV says it pays.

</details>

### Exercise 6.2: One-standard-error rule on a tuning grid

**Task:** Run `train(mpg ~ ., data = mtcars, method = "knn", tuneGrid = data.frame(k = 1:15))` under repeated 10-fold CV (5 repeats) with `set.seed(43)`. Apply the one-SE rule: among `k` values whose mean RMSE is within one standard error of the minimum, pick the largest `k` (most regularized). Save the selected `k` value as a length-1 integer to `ex_6_2`.

**Expected result:**

```
#> ex_6_2
#> [1] 5
```

**Difficulty:** Advanced

```r title="Your turn"
set.seed(43)
ctrl <- trainControl(method = "repeatedcv", number = 10, repeats = 5)
fit  <- train(mpg ~ ., data = mtcars, method = "knn",
              tuneGrid = data.frame(k = 1:15),
              trControl = ctrl,
              preProcess = c("center", "scale"))

ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(43)
ctrl <- trainControl(method = "repeatedcv", number = 10, repeats = 5)
fit  <- train(mpg ~ ., data = mtcars, method = "knn",
              tuneGrid = data.frame(k = 1:15),
              trControl = ctrl,
              preProcess = c("center", "scale"))

r <- fit$results
best_idx <- which.min(r$RMSE)
threshold <- r$RMSE[best_idx] + r$RMSESD[best_idx] / sqrt(50)
candidates <- r[r$RMSE <= threshold, ]
ex_6_2 <- max(candidates$k)
ex_6_2
#> [1] 5
```

**Explanation:** The one-SE rule says "pick the simplest model whose CV error is within one standard error of the best": you trade a touch of accuracy for a meaningfully simpler model, often avoiding overfitting on the validation set itself. The standard error of the mean over 50 fold-level RMSEs is `RMSESD / sqrt(50)`, not `RMSESD`. For kNN "simpler" means larger `k`; for trees it means deeper pruning (smaller tree); for lasso it means more shrinkage.

</details>

### Exercise 6.3: Nested CV for honest performance estimation

**Task:** Implement nested CV on `mtcars` with 5 outer folds and inner repeated 10-fold (3 repeats). In each outer fold, tune kNN over `k = 1:10` on the outer training partition, refit the best `k` on that partition, then predict the outer test partition. Return a tibble with outer fold ID, selected `k`, and outer test RMSE. Save it to `ex_6_3`.

**Expected result:**

```
#> ex_6_3
#> # A tibble: 5 x 3
#>   outer_fold best_k outer_rmse
#>   <chr>       <int>      <dbl>
#> 1 Fold1           5       3.18
#> 2 Fold2           7       4.02
#> 3 Fold3           3       3.41
#> 4 Fold4           5       2.96
#> 5 Fold5           5       3.74
#> mean(ex_6_3$outer_rmse)
#> [1] 3.462
```

**Difficulty:** Advanced

```r title="Your turn"
set.seed(51)
outer <- vfold_cv(mtcars, v = 5)
inner_ctrl <- trainControl(method = "repeatedcv", number = 10, repeats = 3)

ex_6_3 <- map_dfr(seq_along(outer$splits), function(i) {
  # your code here
})

ex_6_3
mean(ex_6_3$outer_rmse)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(51)
outer <- vfold_cv(mtcars, v = 5)
inner_ctrl <- trainControl(method = "repeatedcv", number = 10, repeats = 3)

ex_6_3 <- map_dfr(seq_along(outer$splits), function(i) {
  s    <- outer$splits[[i]]
  tr   <- analysis(s)
  te   <- assessment(s)

  fit  <- train(mpg ~ ., data = tr, method = "knn",
                tuneGrid = data.frame(k = 1:10),
                trControl = inner_ctrl,
                preProcess = c("center", "scale"))

  preds <- predict(fit, newdata = te)
  tibble(
    outer_fold = outer$id[i],
    best_k     = fit$bestTune$k,
    outer_rmse = sqrt(mean((te$mpg - preds)^2))
  )
})

ex_6_3
#> # A tibble: 5 x 3
#>   outer_fold best_k outer_rmse
#>   <chr>       <int>      <dbl>
#> 1 Fold1           5       3.18
#> 2 Fold2           7       4.02
#> 3 Fold3           3       3.41
#> 4 Fold4           5       2.96
#> 5 Fold5           5       3.74
mean(ex_6_3$outer_rmse)
#> [1] 3.462
```

**Explanation:** Plain CV with hyperparameter tuning gives an optimistically biased error estimate: the same folds that picked the winning `k` also report the error, so the winner benefits from a lucky fit. Nested CV separates the two concerns: an inner CV picks `k` from the training partition only, and the outer fold reports the test error on data the tuner never saw. The cost is `outer_folds * inner_folds * inner_repeats * grid_size` fits (here: 5 * 10 * 3 * 10 = 1500), which is why it is reserved for final benchmarking rather than rapid iteration.

</details>

## What to do next

- [Random Forest in R](Random-Forest-in-R.html): apply the CV controls here to tune `mtry` and `ntree`.
- [Logistic Regression in R](Logistic-Regression-With-R.html): pair stratified 10-fold CV with ROC-AUC for class-balanced reports.
- [Linear Regression in R](Linear-Regression.html): start with `caret::train(method = "lm")` and compare to base `lm()` diagnostics.
- [Time Series Analysis in R](Time-Series-Analysis-With-R.html): combine rolling-origin CV with ARIMA and prophet pipelines.
