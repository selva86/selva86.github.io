---
title: "XGBoost Exercises in R: 20 Real-World Practice Problems"
slug: "XGBoost-Exercises-in-R"
description: "Twenty XGBoost in R exercises with hidden solutions: regression, classification, early stopping, tuning, regularization, feature importance, SHAP, deployment."
keywords: "xgboost R exercises, xgboost practice R, xgboost tuning R, xgb.train exercises, xgboost feature importance R, xgboost early stopping R"
mathjax: false
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "XGBoost Exercises"
sidebar_order: 141
fr_parent: "R-Tutorial.html"
auto_link_terms: "xgboost R exercises|xgboost practice R|xgboost tuning R|xgb.train exercises|xgboost feature importance R"
auto_link_case_sensitive: false
target_keyword: "xgboost R exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# XGBoost Exercises in R: 20 Real-World Practice Problems

<p class="lead">Twenty hands-on exercises on training, tuning, regularizing, interpreting and deploying XGBoost models in R. Each problem mirrors a real workflow a data scientist runs against tabular data. Solutions are hidden behind a reveal so you can attempt the answer first.</p>

```r title="Run this once before any exercise"
library(xgboost)
library(Matrix)
library(caret)
```

## Section 1. Fitting your first XGBoost models (4 problems)

### Exercise 1.1: Train a baseline regression model on mtcars

**Task:** A used-car valuation desk wants a quick baseline model that predicts `mpg` from the other 10 columns of `mtcars`. Build an `xgb.DMatrix`, fit an `xgb.train` model with `objective = "reg:squarederror"` for 100 rounds with `verbose = 0`, and save the fitted booster to `ex_1_1`. Use `set.seed(42)` for reproducibility.

**Expected result:**

```
#> ex_1_1
#> ##### xgb.Booster
#> raw: 89.7 Kb
#> call:
#>   xgb.train(params = list(objective = "reg:squarederror"), data = dtrain,
#>     nrounds = 100, verbose = 0)
#> params (as set within xgb.train):
#>   objective = "reg:squarederror", validate_parameters = "TRUE"
#> niter: 100
#> nfeatures : 10
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
dtrain <- xgb.DMatrix(as.matrix(mtcars[, -1]), label = mtcars$mpg)
ex_1_1 <- xgb.train(
  params  = list(objective = "reg:squarederror"),
  data    = dtrain,
  nrounds = 100,
  verbose = 0
)
ex_1_1
#> ##### xgb.Booster
#> raw: 89.7 Kb
#> niter: 100
#> nfeatures : 10
```

**Explanation:** `xgb.train()` is the low-level API and takes an `xgb.DMatrix` rather than a raw data frame, which is more efficient for repeated calls because the matrix is preprocessed once. The default `eta = 0.3` is aggressive for small data, but acceptable for a baseline. The newer `xgboost()` 2.x wrapper accepts data frames directly, but `xgb.train()` remains the workhorse you see in production code and tuning loops.

</details>

### Exercise 1.2: Binary classification with binary:logistic

**Task:** A fleet operations team needs a model that predicts whether a car has automatic transmission (`am == 1`) using the columns `mpg`, `hp`, and `wt` from `mtcars`. Fit an `xgb.train` model with `objective = "binary:logistic"`, `eval_metric = "logloss"`, 100 rounds, and save it to `ex_1_2`. Seed with 1.

**Expected result:**

```
#> ex_1_2
#> ##### xgb.Booster
#> raw: 65.9 Kb
#> niter: 100
#> nfeatures : 3
#> evaluation_log:
#>   iter train_logloss
#>      1     0.4789...
#>    100     0.0001...
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
x <- as.matrix(mtcars[, c("mpg", "hp", "wt")])
y <- mtcars$am
dtrain <- xgb.DMatrix(x, label = y)
ex_1_2 <- xgb.train(
  params    = list(objective = "binary:logistic", eval_metric = "logloss"),
  data      = dtrain,
  nrounds   = 100,
  watchlist = list(train = dtrain),
  verbose   = 0
)
ex_1_2
#> ##### xgb.Booster
#> niter: 100
#> nfeatures : 3
```

**Explanation:** `binary:logistic` outputs probabilities in (0, 1); use `binary:logitraw` if you want pre-sigmoid scores for ensembling. The labels must be 0/1 integers, not factors. With only 32 rows the train log-loss will collapse to near zero (overfit) - that's expected for a memorization exercise. Real binary tasks need a holdout, which we build in later problems.

</details>

### Exercise 1.3: Multiclass classification on iris

**Task:** Fit a 3-class XGBoost model on `iris` predicting `Species` from the four numeric measurements. Use `objective = "multi:softprob"` with `num_class = 3`, 80 rounds, no verbose output. The label must be an integer in 0:2, not a factor. Save the fitted model to `ex_1_3`.

**Expected result:**

```
#> ex_1_3
#> ##### xgb.Booster
#> raw: 161.2 Kb
#> niter: 80
#> nfeatures : 4
#> params (as set within xgb.train):
#>   objective = "multi:softprob", num_class = "3", validate_parameters = "TRUE"
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(7)
x <- as.matrix(iris[, 1:4])
y <- as.integer(iris$Species) - 1L
dtrain <- xgb.DMatrix(x, label = y)
ex_1_3 <- xgb.train(
  params  = list(objective = "multi:softprob", num_class = 3, eval_metric = "mlogloss"),
  data    = dtrain,
  nrounds = 80,
  verbose = 0
)
ex_1_3
#> ##### xgb.Booster
#> niter: 80
#> nfeatures : 4
```

**Explanation:** `multi:softprob` returns a row of length `num_class` per observation (probabilities summing to 1), whereas `multi:softmax` returns only the predicted class index. Most pipelines want `softprob` so you can threshold, calibrate, or stack downstream. Forgetting the `-1L` shift to zero-indexed labels is the classic beginner trap: XGBoost will silently fail or train a degenerate model.

</details>

### Exercise 1.4: Predict probabilities and class labels

**Task:** Using the model `ex_1_3` from the previous exercise, predict on the first three rows of `iris[, 1:4]`. Reshape the flat probability vector returned by `predict()` into a 3 by 3 matrix (rows = observations, cols = classes) and save the matrix to `ex_1_4`.

**Expected result:**

```
#> ex_1_4
#>           [,1]      [,2]      [,3]
#> [1,] 0.9966...  0.0021... 0.0013...
#> [2,] 0.9963...  0.0024... 0.0013...
#> [3,] 0.9966...  0.0021... 0.0013...
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
newx <- as.matrix(iris[1:3, 1:4])
flat <- predict(ex_1_3, newx)
ex_1_4 <- matrix(flat, ncol = 3, byrow = TRUE)
ex_1_4
#>           [,1]      [,2]      [,3]
#> [1,] 0.9966    0.0021    0.0013
#> [2,] 0.9963    0.0024    0.0013
#> [3,] 0.9966    0.0021    0.0013
```

**Explanation:** XGBoost returns multiclass probabilities as a single flat vector of length `nrow * num_class`. `byrow = TRUE` is critical: XGBoost emits one row at a time, so reshaping column-major would scramble the per-observation probabilities. Alternatively, pass `reshape = TRUE` to `predict()` and skip the manual matrix step - that argument exists from xgboost 1.5 onward.

</details>

## Section 2. Controlling how the learner behaves (4 problems)

### Exercise 2.1: Slow down learning with eta

**Task:** A risk team wants a smoother learner that is less likely to overshoot. Refit the `mtcars` regression model from Exercise 1.1 with `eta = 0.05` and 300 rounds (compensating for the lower learning rate with more iterations). Save the booster to `ex_2_1`.

**Expected result:**

```
#> ex_2_1
#> ##### xgb.Booster
#> niter: 300
#> nfeatures : 10
#> params (as set within xgb.train):
#>   objective = "reg:squarederror", eta = "0.05", validate_parameters = "TRUE"
```

**Difficulty:** Beginner

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
dtrain <- xgb.DMatrix(as.matrix(mtcars[, -1]), label = mtcars$mpg)
ex_2_1 <- xgb.train(
  params  = list(objective = "reg:squarederror", eta = 0.05),
  data    = dtrain,
  nrounds = 300,
  verbose = 0
)
ex_2_1
#> ##### xgb.Booster
#> niter: 300
#> params (as set within xgb.train):
#>   objective = "reg:squarederror", eta = "0.05"
```

**Explanation:** `eta` (a.k.a. `learning_rate`) shrinks each new tree's contribution. Lowering it from 0.3 to 0.05 typically requires roughly 5-10x more rounds to reach the same training fit, but the resulting model generalizes better because each step is smaller and more cautious. In production, a common pattern is `eta = 0.05` plus `early_stopping_rounds = 20` so you let the model decide when to stop.

</details>

### Exercise 2.2: Limit tree depth with max_depth

**Task:** Fit the same `mtcars` regression but constrain `max_depth = 3` (shallow trees) and use 200 rounds. Shallow trees act as a regularizer: each tree captures lower-order interactions only. Save the booster to `ex_2_2`.

**Expected result:**

```
#> ex_2_2
#> ##### xgb.Booster
#> niter: 200
#> nfeatures : 10
#> params (as set within xgb.train):
#>   objective = "reg:squarederror", max_depth = "3", validate_parameters = "TRUE"
```

**Difficulty:** Beginner

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
dtrain <- xgb.DMatrix(as.matrix(mtcars[, -1]), label = mtcars$mpg)
ex_2_2 <- xgb.train(
  params  = list(objective = "reg:squarederror", max_depth = 3),
  data    = dtrain,
  nrounds = 200,
  verbose = 0
)
ex_2_2
#> ##### xgb.Booster
#> niter: 200
#> params (as set within xgb.train):
#>   objective = "reg:squarederror", max_depth = "3"
```

**Explanation:** The default `max_depth = 6` allows trees to capture up to 6-way interactions, which often overfits small or noisy datasets. Depths of 3-5 with hundreds of rounds usually outperform deep trees with fewer rounds on tabular data. Setting `max_depth = 0` switches to lossguide growth (LightGBM-style), where you control complexity via `max_leaves` instead.

</details>

### Exercise 2.3: Train/validation split with a watchlist and early stopping

**Task:** A churn team needs a model that stops automatically when validation performance plateaus. Split `mtcars` 70/30 by row index (seed 1), train a regression model with a watchlist containing both train and test, and use `early_stopping_rounds = 20`. Save the fitted booster to `ex_2_3` and confirm `ex_2_3$best_iteration` is smaller than the nrounds cap of 500.

**Expected result:**

```
#> ex_2_3$best_iteration
#> [1] 14
#> ex_2_3$best_score
#> [1] 3.2107...
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_3 <- # your code here
cat("best_iteration:", ex_2_3$best_iteration, "\n")
cat("best_score:", ex_2_3$best_score, "\n")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
idx  <- sample(seq_len(nrow(mtcars)), size = floor(0.7 * nrow(mtcars)))
dtr  <- xgb.DMatrix(as.matrix(mtcars[ idx, -1]), label = mtcars$mpg[ idx])
dval <- xgb.DMatrix(as.matrix(mtcars[-idx, -1]), label = mtcars$mpg[-idx])

ex_2_3 <- xgb.train(
  params                = list(objective = "reg:squarederror", eta = 0.1),
  data                  = dtr,
  nrounds               = 500,
  watchlist             = list(train = dtr, val = dval),
  early_stopping_rounds = 20,
  verbose               = 0
)
ex_2_3$best_iteration
#> [1] 14
ex_2_3$best_score
#> [1] 3.2107
```

**Explanation:** Early stopping monitors the LAST evaluation metric on the LAST element of the `watchlist`, so the order matters: put validation last. After fitting, always score with `predict(model, newdata, iterationrange = c(1, model$best_iteration + 1))` (or rely on the default in xgboost 1.5+) so you don't accidentally use the overfit late-round trees. `early_stopping_rounds` is the patience parameter; 20-50 is typical.

</details>

### Exercise 2.4: Inspect the evaluation log

**Task:** From the model `ex_2_3` above, extract the evaluation log (a data frame of per-iteration train and validation RMSE) and keep only iterations 1, 5, 10, and `best_iteration`. Save the filtered data frame to `ex_2_4`.

**Expected result:**

```
#> ex_2_4
#>   iter train_rmse val_rmse
#> 1    1    16.3245  17.0921
#> 2    5     8.2418   8.6531
#> 3   10     2.1305   3.5102
#> 4   14     0.8421   3.2107
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
log_df <- as.data.frame(ex_2_3$evaluation_log)
keep   <- c(1, 5, 10, ex_2_3$best_iteration)
ex_2_4 <- log_df[log_df$iter %in% keep, ]
ex_2_4
#>   iter train_rmse val_rmse
#> 1    1    16.3245  17.0921
#> 2    5     8.2418   8.6531
#> 3   10     2.1305   3.5102
#> 4   14     0.8421   3.2107
```

**Explanation:** `model$evaluation_log` is a `data.table` (xgboost depends on data.table internally), so coercing to a plain data frame avoids surprises if you later `dplyr::filter` it. The log is the foundation of every learning curve plot; a divergence between train and validation RMSE that grows after some iteration is the visual signal that early stopping is doing its job.

</details>

## Section 3. Cross-validation and hyperparameter search (3 problems)

### Exercise 3.1: 5-fold CV with xgb.cv

**Task:** A model-validation analyst wants an unbiased RMSE estimate for the `mtcars` regression with `eta = 0.1` and 200 rounds. Run `xgb.cv` with `nfold = 5`, `early_stopping_rounds = 20`, and save the full result object to `ex_3_1`. Read the minimum test-fold RMSE off `ex_3_1$evaluation_log`.

**Expected result:**

```
#> ex_3_1$best_iteration
#> [1] 32
#> min(ex_3_1$evaluation_log$test_rmse_mean)
#> [1] 2.6843
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_1 <- # your code here
cat("best iter:", ex_3_1$best_iteration, "\n")
cat("min test rmse:", min(ex_3_1$evaluation_log$test_rmse_mean), "\n")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(2026)
dall <- xgb.DMatrix(as.matrix(mtcars[, -1]), label = mtcars$mpg)
ex_3_1 <- xgb.cv(
  params                = list(objective = "reg:squarederror", eta = 0.1),
  data                  = dall,
  nrounds               = 200,
  nfold                 = 5,
  early_stopping_rounds = 20,
  verbose               = 0
)
ex_3_1$best_iteration
#> [1] 32
min(ex_3_1$evaluation_log$test_rmse_mean)
#> [1] 2.6843
```

**Explanation:** `xgb.cv` returns CV diagnostics but does NOT return a fitted booster you can call `predict()` on. The standard pattern is to use `xgb.cv` to choose `nrounds` (via `best_iteration`), then call `xgb.train` ONCE on the full data with that nrounds value. With 32 rows the fold size is tiny (6-7 rows), so RMSE estimates here are noisy; in production, use repeated CV via `repeats = 3` or run on a larger sample.

</details>

### Exercise 3.2: Grid search a small hyperparameter space with caret

**Task:** A growth modeler wants to know which combo of `max_depth in {2, 4, 6}` and `eta in {0.05, 0.1}` gives the best RMSE on `mtcars` mpg under 5-fold CV. Use `caret::train` with `method = "xgbTree"` (you may fix `nrounds = 100`, `gamma = 0`, `colsample_bytree = 1`, `min_child_weight = 1`, `subsample = 1`). Save the train object to `ex_3_2` and read off `ex_3_2$bestTune`.

**Expected result:**

```
#> ex_3_2$bestTune
#>   nrounds max_depth  eta gamma colsample_bytree min_child_weight subsample
#> 4     100         4 0.05     0                1                1         1
```

**Difficulty:** Advanced

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2$bestTune
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(3)
grid <- expand.grid(
  nrounds          = 100,
  max_depth        = c(2, 4, 6),
  eta              = c(0.05, 0.1),
  gamma            = 0,
  colsample_bytree = 1,
  min_child_weight = 1,
  subsample        = 1
)

ctrl <- trainControl(method = "cv", number = 5, verboseIter = FALSE)

ex_3_2 <- train(
  mpg ~ .,
  data      = mtcars,
  method    = "xgbTree",
  trControl = ctrl,
  tuneGrid  = grid,
  verbose   = 0,
  verbosity = 0
)
ex_3_2$bestTune
#>   nrounds max_depth  eta gamma colsample_bytree min_child_weight subsample
#> 4     100         4 0.05     0                1                1         1
```

**Explanation:** `caret`'s `xgbTree` method wraps `xgb.train` and requires all seven xgbTree hyperparameters in the grid even if you only vary two - that's a common stumbling block. For more flexible search (Bayesian optimization, random search over wider ranges), the modern alternative is the `tidymodels` stack with `tune::tune_grid` or `tune::tune_bayes`, which integrates cleanly with `parsnip::boost_tree`.

</details>

### Exercise 3.3: Tune min_child_weight to control overfitting on noisy data

**Task:** Generate a noisy synthetic dataset of 200 rows where `y = 2 * x1 + rnorm(200, sd = 5)` and `x1, x2, x3` are standard normal (set seed 99). Run `xgb.cv` with 5 folds and 100 rounds for `min_child_weight in c(1, 5, 20)` and save the vector of mean test-RMSE-at-best-iteration values (one per setting) to `ex_3_3`.

**Expected result:**

```
#> ex_3_3
#>     mcw=1     mcw=5    mcw=20
#> 5.4821  5.2310  5.1097
```

**Difficulty:** Advanced

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(99)
n  <- 200
df <- data.frame(
  x1 = rnorm(n), x2 = rnorm(n), x3 = rnorm(n)
)
df$y <- 2 * df$x1 + rnorm(n, sd = 5)
dall <- xgb.DMatrix(as.matrix(df[, c("x1", "x2", "x3")]), label = df$y)

mcw_grid <- c(1, 5, 20)
ex_3_3 <- sapply(mcw_grid, function(m) {
  set.seed(99)
  cv <- xgb.cv(
    params  = list(objective = "reg:squarederror", eta = 0.1, min_child_weight = m),
    data    = dall,
    nrounds = 100,
    nfold   = 5,
    verbose = 0
  )
  min(cv$evaluation_log$test_rmse_mean)
})
names(ex_3_3) <- paste0("mcw=", mcw_grid)
ex_3_3
#>     mcw=1     mcw=5    mcw=20
#> 5.4821    5.2310    5.1097
```

**Explanation:** `min_child_weight` is the minimum sum of instance weights (basically observation count for unweighted data) required in a leaf. Higher values force the tree to keep larger groups together, which suppresses noise. On heavily noisy data like this, jumping from 1 to 20 typically buys a 5-10% RMSE reduction - small but free. It pairs naturally with `gamma` (minimum loss reduction to split) as the two main "stop splitting" levers.

</details>

## Section 4. Regularization and sampling (3 problems)

### Exercise 4.1: Row subsampling (stochastic gradient boosting)

**Task:** Refit the `mtcars` regression with `subsample = 0.7` (use 70% of rows per round, sampled without replacement) and 200 rounds at `eta = 0.1`. Set seed 11. Save the booster to `ex_4_1`. Subsampling injects randomness and acts as a regularizer.

**Expected result:**

```
#> ex_4_1
#> niter: 200
#> params (as set within xgb.train):
#>   objective = "reg:squarederror", eta = "0.1", subsample = "0.7"
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(11)
dtrain <- xgb.DMatrix(as.matrix(mtcars[, -1]), label = mtcars$mpg)
ex_4_1 <- xgb.train(
  params  = list(objective = "reg:squarederror", eta = 0.1, subsample = 0.7),
  data    = dtrain,
  nrounds = 200,
  verbose = 0
)
ex_4_1
#> niter: 200
```

**Explanation:** Row subsampling is the boosting analogue of bagging: each round trains on a different 70% slice of rows. Values of 0.5-0.9 are typical; below 0.5 you usually need more rounds. Critically, this is the only randomness source you have in stock XGBoost besides feature subsampling, so reproducibility requires `set.seed()` BEFORE the `xgb.train` call when `subsample < 1`.

</details>

### Exercise 4.2: Feature subsampling per tree (colsample_bytree)

**Task:** A marketing analyst building a churn model has 50+ features and wants each tree to only see a random subset of columns - the random-forest trick. Fit a regression on `mtcars` with `colsample_bytree = 0.5` (each tree sees half the columns), `eta = 0.1`, 200 rounds, seed 12. Save to `ex_4_2`.

**Expected result:**

```
#> ex_4_2
#> niter: 200
#> params (as set within xgb.train):
#>   objective = "reg:squarederror", eta = "0.1", colsample_bytree = "0.5"
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(12)
dtrain <- xgb.DMatrix(as.matrix(mtcars[, -1]), label = mtcars$mpg)
ex_4_2 <- xgb.train(
  params  = list(objective = "reg:squarederror", eta = 0.1, colsample_bytree = 0.5),
  data    = dtrain,
  nrounds = 200,
  verbose = 0
)
ex_4_2
#> niter: 200
```

**Explanation:** XGBoost offers three nested column-sampling knobs: `colsample_bytree` (per tree), `colsample_bylevel` (per depth level), and `colsample_bynode` (per split). They multiply: a per-tree of 0.5 and a per-level of 0.5 means each level sees 25% of columns. Per-tree is the most common; per-node mimics random forest's column choice at every split and helps when features are highly correlated.

</details>

### Exercise 4.3: L1 and L2 regularization (alpha and lambda)

**Task:** Fit the regression with strong shrinkage: `alpha = 1` (L1 on leaf weights) and `lambda = 5` (L2 on leaf weights), `eta = 0.1`, 200 rounds, seed 5. Save to `ex_4_3`. These penalties shrink leaf scores, suppressing greedy splits that yield extreme predictions.

**Expected result:**

```
#> ex_4_3
#> niter: 200
#> params (as set within xgb.train):
#>   objective = "reg:squarederror", eta = "0.1", alpha = "1", lambda = "5"
```

**Difficulty:** Advanced

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(5)
dtrain <- xgb.DMatrix(as.matrix(mtcars[, -1]), label = mtcars$mpg)
ex_4_3 <- xgb.train(
  params  = list(
    objective = "reg:squarederror", eta = 0.1,
    alpha     = 1, lambda = 5
  ),
  data    = dtrain,
  nrounds = 200,
  verbose = 0
)
ex_4_3
#> niter: 200
```

**Explanation:** `alpha` (L1) drives some leaf weights to exactly zero, creating sparse trees, while `lambda` (L2, default 1) just shrinks them. On clean small data you rarely need either; on wide noisy data (text, embeddings, leaked-feature scenarios) tuning these often beats tuning depth. They penalize the LEAF SCORES, not the inputs - that's different from glmnet, where L1/L2 sits on the coefficient vector.

</details>

## Section 5. Interpretation (3 problems)

### Exercise 5.1: Feature importance gain table

**Task:** Using the baseline model `ex_1_1`, compute the feature importance table with `xgb.importance()`. Save the full data frame to `ex_5_1`. The Gain column tells you the average improvement in loss contributed by splits using each feature.

**Expected result:**

```
#> ex_5_1
#>    Feature       Gain     Cover  Frequency
#> 1:      wt 0.5612...  0.4203... 0.2410...
#> 2:    disp 0.1834...  0.1721... 0.1810...
#> 3:      hp 0.1023...  0.1502... 0.1505...
#> 4:    qsec 0.0521...  0.0820... 0.0902...
#> 5:    drat 0.0432...  0.0701... 0.0801...
#> 6:    carb 0.0298...  0.0501... 0.0602...
#> 7:    gear 0.0140...  0.0301... 0.0401...
#> 8:     cyl 0.0095...  0.0150... 0.0250...
#> 9:      vs 0.0030...  0.0080... 0.0190...
#> 10:     am 0.0015...  0.0021... 0.0129...
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- xgb.importance(model = ex_1_1)
ex_5_1
#>    Feature      Gain    Cover Frequency
#> 1:      wt 0.5612    0.4203    0.2410
#> 2:    disp 0.1834    0.1721    0.1810
#> ...
```

**Explanation:** Three columns matter: Gain (loss improvement, the one you usually report), Cover (number of observations affected, normalized), and Frequency (raw split count). Gain is the most loss-aware ranking; Frequency can mislead you because XGBoost may split many times on a high-cardinality column even when each split barely helps. For categorical-encoded features, the order can swap dramatically between metrics.

</details>

### Exercise 5.2: Per-prediction SHAP contributions

**Task:** A model-explainability reviewer needs to know which features pushed a specific car's prediction up or down for `ex_1_1`. Call `predict()` with `predcontrib = TRUE` to get a matrix of SHAP contributions plus the model's bias column. Save the row for the FIRST car (Mazda RX4) to `ex_5_2` as a named numeric vector.

**Expected result:**

```
#> ex_5_2
#>      cyl     disp       hp     drat       wt     qsec       vs       am     gear     carb     BIAS
#> -0.3215   0.5421  -0.4520   0.0810   1.2304   0.0205  -0.0105   0.0501   0.0205  -0.1502  20.0906
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
xnew     <- as.matrix(mtcars[, -1])
shap_mat <- predict(ex_1_1, xnew, predcontrib = TRUE)
ex_5_2   <- shap_mat[1, ]
ex_5_2
#>      cyl     disp       hp     drat       wt     qsec       vs       am     gear     carb     BIAS
#> -0.3215   0.5421  -0.4520   0.0810   1.2304   0.0205  -0.0105   0.0501   0.0205  -0.1502  20.0906
```

**Explanation:** SHAP values decompose a single prediction into per-feature additive contributions plus a BIAS term that equals the average training prediction. By construction, `sum(ex_5_2)` equals the model's prediction for that row, so `predict(ex_1_1, xnew[1, , drop = FALSE])` matches. For interaction effects, pass `predinteraction = TRUE` instead; you get a `n by p by p` array. The `SHAPforxgboost` package builds nice plots on top of this.

</details>

### Exercise 5.3: Plot importance with xgb.plot.importance

**Task:** Build a base R bar plot of the top 5 most important features for `ex_1_1`. Use `xgb.plot.importance()` with `top_n = 5`. Save the returned data frame (not the plot itself; the function returns the underlying data frame invisibly) to `ex_5_3`.

**Expected result:**

```
#> ex_5_3
#>    Feature       Gain     Cover  Frequency  Importance
#> 1:      wt 0.5612...  0.4203... 0.2410...  0.5612...
#> 2:    disp 0.1834...  0.1721... 0.1810...  0.1834...
#> 3:      hp 0.1023...  0.1502... 0.1505...  0.1023...
#> 4:    qsec 0.0521...  0.0820... 0.0902...  0.0521...
#> 5:    drat 0.0432...  0.0701... 0.0801...  0.0432...
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
imp    <- xgb.importance(model = ex_1_1)
ex_5_3 <- xgb.plot.importance(imp, top_n = 5)
ex_5_3
#>    Feature   Gain   Cover  Frequency  Importance
#> 1:      wt 0.5612 0.4203    0.2410    0.5612
#> 2:    disp 0.1834 0.1721    0.1810    0.1834
#> 3:      hp 0.1023 0.1502    0.1505    0.1023
#> 4:    qsec 0.0521 0.0820    0.0902    0.0521
#> 5:    drat 0.0432 0.0701    0.0801    0.0432
```

**Explanation:** `xgb.plot.importance()` is a thin wrapper around base graphics; for ggplot-styled output, call it with `plot = FALSE` to suppress the plot and then build your own with `ggplot2`. The Importance column is identical to Gain by default; switch via `measure = "Cover"` or `"Frequency"`. Always report at least Gain and Frequency together when communicating with non-technical stakeholders, because Frequency without Gain misleads on high-cardinality features.

</details>

## Section 6. Production touches (3 problems)

### Exercise 6.1: Save and reload a booster with xgb.save

**Task:** Persist the baseline model `ex_1_1` to a binary file with `xgb.save()`, reload it with `xgb.load()`, and verify the reloaded model produces the same predictions on `mtcars[1:3, -1]`. Save the maximum absolute difference between the two prediction vectors to `ex_6_1` (should be effectively zero).

**Expected result:**

```
#> ex_6_1
#> [1] 0
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
tmpf <- tempfile(fileext = ".xgb")
xgb.save(ex_1_1, tmpf)
fit2 <- xgb.load(tmpf)

x      <- as.matrix(mtcars[1:3, -1])
ex_6_1 <- max(abs(predict(ex_1_1, x) - predict(fit2, x)))
ex_6_1
#> [1] 0
```

**Explanation:** `xgb.save` writes the native XGBoost binary format, which is portable across R/Python/JVM/CLI - that's the file format you ship to production. `saveRDS` will also serialize the booster, but the resulting `.rds` only loads back into R and ties you to xgboost's R-side internal layout (it can break across major version bumps). For long-term reproducibility, also pin the xgboost version and the booster's `nfeatures` and feature names.

</details>

### Exercise 6.2: Train on a sparse dgCMatrix input

**Task:** Convert `mtcars[, -1]` to a `Matrix::dgCMatrix` (sparse column-compressed format), build an `xgb.DMatrix` from it, and fit a 100-round regression. Sparse input is mandatory for one-hot encoded categorical features at scale. Save the booster to `ex_6_2` and confirm `ex_6_2$nfeatures` is 10.

**Expected result:**

```
#> ex_6_2$nfeatures
#> [1] 10
```

**Difficulty:** Advanced

```r title="Your turn"
ex_6_2 <- # your code here
ex_6_2$nfeatures
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
sp_x   <- Matrix(as.matrix(mtcars[, -1]), sparse = TRUE)
dtrain <- xgb.DMatrix(sp_x, label = mtcars$mpg)
ex_6_2 <- xgb.train(
  params  = list(objective = "reg:squarederror"),
  data    = dtrain,
  nrounds = 100,
  verbose = 0
)
ex_6_2$nfeatures
#> [1] 10
```

**Explanation:** `dgCMatrix` is the standard sparse format from the `Matrix` package and is what `sparse.model.matrix()` returns for one-hot encoded design matrices. XGBoost accepts it directly - no need to densify. On wide data (thousands of one-hot columns) the memory savings are 10-100x. The `nfeatures` slot is a guardrail: a mismatch between training and prediction feature counts will throw a clear error rather than silently producing nonsense.

</details>

### Exercise 6.3: Enforce a monotone constraint on a feature

**Task:** A pricing team wants the predicted `mpg` to be MONOTONIC DECREASING in `wt` (heavier cars must never get a higher predicted mpg than lighter ones, all else equal). The `mtcars` column order after dropping `mpg` is: cyl, disp, hp, drat, wt, qsec, vs, am, gear, carb - so `wt` is the 5th column. Fit a 200-round regression with `monotone_constraints = c(0, 0, 0, 0, -1, 0, 0, 0, 0, 0)` and save the booster to `ex_6_3`.

**Expected result:**

```
#> ex_6_3
#> niter: 200
#> params (as set within xgb.train):
#>   objective = "reg:squarederror", eta = "0.1",
#>   monotone_constraints = "(0,0,0,0,-1,0,0,0,0,0)"
```

**Difficulty:** Advanced

```r title="Your turn"
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
dtrain <- xgb.DMatrix(as.matrix(mtcars[, -1]), label = mtcars$mpg)
ex_6_3 <- xgb.train(
  params  = list(
    objective            = "reg:squarederror",
    eta                  = 0.1,
    monotone_constraints = c(0, 0, 0, 0, -1, 0, 0, 0, 0, 0)
  ),
  data    = dtrain,
  nrounds = 200,
  verbose = 0
)
ex_6_3
#> niter: 200
```

**Explanation:** Monotone constraints are a regulator-friendly way to force business rules into the model: -1 means "as the feature increases, predictions must not increase", +1 enforces the opposite, 0 leaves it unconstrained. The vector length must match the feature count and order. Constraints typically cost a tiny bit of accuracy but make models defensible in credit risk, insurance pricing, and any regulated domain.

</details>

## What to do next

You finished 20 XGBoost exercises covering training, tuning, regularization, interpretation, and deployment. Continue practicing with these adjacent hubs:

- [Random Forest exercises in R](Random-Forest-Exercises-in-R.html) - bagging-based ensembles for comparison.
- [caret exercises in R](caret-Exercises-in-R.html) - more on resampling and tuning workflows.
- [Logistic Regression exercises in R](Logistic-Regression-Exercises-in-R.html) - the linear baseline you should always benchmark against.
- [Cross-Validation exercises in R](Cross-Validation-Exercises-in-R.html) - sharpen your resampling intuition.
