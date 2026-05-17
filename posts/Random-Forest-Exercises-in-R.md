---
title: "Random Forest Exercises in R: 20 Real Practice Problems"
slug: "Random-Forest-Exercises-in-R"
description: "Practice random forest in R with 20 hands-on exercises: classification, regression, tuning, variable importance, ranger, evaluation. Hidden solutions."
keywords: "random forest R exercises, randomForest practice R, ranger R exercises, random forest tuning R, RF variable importance R, random forest classification R"
mathjax: true
webr: true
date: "2026-05-12"
post_type: "EX"
sidebar_title: "Random Forest Exercises"
sidebar_order: 140
fr_parent: "R-Tutorial.html"
auto_link_terms: "random forest in r|randomforest package|ranger package|rf feature importance|out of bag error|mtry tuning"
auto_link_case_sensitive: false
target_keyword: "random forest R exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Random Forest Exercises in R: 20 Real Practice Problems

<p class="lead">Twenty practice problems that walk through every stage of fitting random forests in R: classification, regression, tuning <code>mtry</code> and <code>ntree</code>, reading variable importance, switching to the faster <code>ranger</code> backend, and judging the result on a holdout. Every problem ships with a hidden solution.</p>

```r title="Run this once before any exercise"
library(randomForest)
library(ranger)
set.seed(1)
```

## Section 1. Build your first random forest (3 problems)

### Exercise 1.1: Fit a baseline classification forest on iris

**Task:** Use `randomForest()` to fit a classification model on `iris` that predicts `Species` from the four numeric measurements. Use the default 500 trees and set the seed before calling so the output is reproducible. Save the fitted model to `ex_1_1` and print it to see the OOB error and confusion matrix.

**Expected result:**

```
#> Call:
#>  randomForest(formula = Species ~ ., data = iris)
#>                Type of random forest: classification
#>                      Number of trees: 500
#> No. of variables tried at each split: 2
#>
#>         OOB estimate of  error rate: 4%
#> Confusion matrix:
#>            setosa versicolor virginica class.error
#> setosa         50          0         0        0.00
#> versicolor      0         47         3        0.06
#> virginica       0          3        47        0.06
```

**Difficulty:** Beginner

[HINTS]
A factor response makes the model do classification on its own; set the seed first so the bootstrap sampling is reproducible.
Call the fitting function with the formula `Species ~ .` and `data = iris` after `set.seed(1)`; the default 500 trees needs no extra argument.

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
ex_1_1 <- randomForest(Species ~ ., data = iris)
ex_1_1
#>                Type of random forest: classification
#>                      Number of trees: 500
#> No. of variables tried at each split: 2
#>         OOB estimate of  error rate: 4%
```

**Explanation:** With the formula interface, `randomForest()` treats a factor response as a classification target and a numeric response as regression. The default `mtry` for classification is `floor(sqrt(p))` where `p` is the predictor count, so with 4 features it becomes 2. The reported OOB (out-of-bag) error is computed by passing each training row through the trees that did NOT see that row during bootstrap sampling, which is why no separate validation set is needed.

</details>

### Exercise 1.2: Extract the OOB confusion matrix as a standalone object

**Task:** After fitting the iris random forest, you need the confusion matrix on its own (without the surrounding model printout) so you can store it next to a dozen other model artifacts. Refit the model, pull the `confusion` element out of the fit object, and save the resulting matrix to `ex_1_2`.

**Expected result:**

```
#>            setosa versicolor virginica class.error
#> setosa         50          0         0        0.00
#> versicolor      0         47         3        0.06
#> virginica       0          3        47        0.06
```

**Difficulty:** Beginner

[HINTS]
The fitted model is just a list, so any single piece of it can be pulled out on its own without re-running anything.
After refitting, index the fit object's `confusion` element with `$`.

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
fit <- randomForest(Species ~ ., data = iris)
ex_1_2 <- fit$confusion
ex_1_2
#>            setosa versicolor virginica class.error
#> setosa         50          0         0        0.00
#> versicolor      0         47         3        0.06
#> virginica       0          3        47        0.06
```

**Explanation:** The fit object is a regular list, so any of its elements (`confusion`, `err.rate`, `importance`, `predicted`, `votes`) can be pulled with `$` or `[[`. The `confusion` slot is computed from OOB predictions, so it is honest in the sense that it never uses a row to score the same row that trained it. The `class.error` column equals `1 - diag / rowSums`, which is the per-class misclassification rate.

</details>

### Exercise 1.3: Predict on a holdout split and check the test accuracy

**Task:** A data analyst preparing a demo wants honest test accuracy, not OOB. Split `iris` 120 train / 30 test, fit `randomForest()` on the training rows only, predict the 30 holdout rows, then compute the accuracy. Save the holdout predictions (factor vector) to `ex_1_3` and check that its length is 30.

**Expected result:**

```
#> length(ex_1_3)
#> [1] 30
#> levels(ex_1_3)
#> [1] "setosa"     "versicolor" "virginica"
#> mean(ex_1_3 == iris$Species[-train_idx])
#> [1] 0.9666667
```

**Difficulty:** Intermediate

[HINTS]
Train on one slice of rows and score on the rows the model never saw, so the accuracy is honest.
Use `sample(nrow(iris), 120)` for the train index, fit on `iris[train_idx, ]`, then call `predict()` with `newdata` set to the held-out rows.

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
train_idx <- sample(nrow(iris), 120)
fit <- randomForest(Species ~ ., data = iris[train_idx, ])
ex_1_3 <- predict(fit, newdata = iris[-train_idx, ])
length(ex_1_3)
#> [1] 30
mean(ex_1_3 == iris$Species[-train_idx])
#> [1] 0.9666667
```

**Explanation:** OOB error is usually close to test error, but the test set gives a single number to report and to compare against a baseline. `predict.randomForest()` defaults to `type = "response"`, returning the majority-vote class label. Pass `type = "prob"` to get the soft scores instead, which is what you need any time you plan to threshold or calibrate.

</details>

## Section 2. Classification scenarios (3 problems)

### Exercise 2.1: Fit a binary fraud classifier on inline transaction data

**Task:** A fraud team has logged 200 transactions with `amount`, `hour`, and a binary `is_fraud` label. Build the inline tibble shown below, fit `randomForest()` predicting `is_fraud` (as a factor) from the two numeric features with 500 trees, and save the fit to `ex_2_1`. Inspect the OOB confusion matrix afterwards.

```r
set.seed(42)
n <- 200
txn <- data.frame(
  amount  = round(c(rgamma(180, 2, 0.02), rgamma(20, 8, 0.02)), 2),
  hour    = c(sample(8:22, 180, TRUE), sample(0:5, 20, TRUE)),
  is_fraud = factor(c(rep("no", 180), rep("yes", 20)))
)
```

**Expected result:**

```
#>                Type of random forest: classification
#>                      Number of trees: 500
#> No. of variables tried at each split: 1
#>         OOB estimate of  error rate: 9.5%
#> Confusion matrix:
#>      no yes class.error
#> no  178   2  0.01111111
#> yes  17   3  0.85000000
```

**Difficulty:** Intermediate

[HINTS]
Make sure the label is stored as a factor so the model treats this as a two-class problem, not a numeric one.
Fit with the formula `is_fraud ~ amount + hour`, `data = txn`, and `ntree = 500`.

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
n <- 200
txn <- data.frame(
  amount   = round(c(rgamma(180, 2, 0.02), rgamma(20, 8, 0.02)), 2),
  hour     = c(sample(8:22, 180, TRUE), sample(0:5, 20, TRUE)),
  is_fraud = factor(c(rep("no", 180), rep("yes", 20)))
)
set.seed(1)
ex_2_1 <- randomForest(is_fraud ~ amount + hour, data = txn, ntree = 500)
ex_2_1
#>         OOB estimate of  error rate: 9.5%
```

**Explanation:** Notice the trap: the headline error rate is 9.5%, which sounds great, but the per-class column shows the model misses 85% of actual frauds. This happens in every imbalanced setup when you optimize plain accuracy: predicting "no" all the time already gets you 90% right. The fix is to change the loss, the threshold, or the sampling, which is what the next exercise tackles.

</details>

### Exercise 2.2: Upweight the minority class with classwt and recover recall

**Task:** A risk analyst reviewing the previous fraud model needs recall on the `yes` class to rise above 30% before sign-off. Refit the same forest using the `classwt` argument to give the minority class roughly 9x more weight than the majority. Save the refit to `ex_2_2` and report the new per-class error rates.

**Expected result:**

```
#>      no yes class.error
#> no  170  10        0.05
#> yes   8  12        0.40
```

**Difficulty:** Advanced

[HINTS]
When one class is rare, you can tell the trees to treat its votes as worth more so it stops being ignored.
Add `classwt = c(no = 1, yes = 9)` to the same fitting call.

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
n <- 200
txn <- data.frame(
  amount   = round(c(rgamma(180, 2, 0.02), rgamma(20, 8, 0.02)), 2),
  hour     = c(sample(8:22, 180, TRUE), sample(0:5, 20, TRUE)),
  is_fraud = factor(c(rep("no", 180), rep("yes", 20)))
)
set.seed(1)
ex_2_2 <- randomForest(is_fraud ~ amount + hour, data = txn,
                       ntree = 500, classwt = c(no = 1, yes = 9))
ex_2_2$confusion
#>      no yes class.error
#> no  170  10        0.05
#> yes   8  12        0.40
```

**Explanation:** `classwt` scales how often each class is treated as the "winning" vote when ties are broken at a node, effectively making the trees more willing to predict the rare class. Other levers for class imbalance are `sampsize` (down-sample the majority within each bootstrap) and `cutoff` (shift the vote threshold). In production fraud work, threshold shifting plus calibrated probabilities tends to be cleaner than `classwt` because it leaves the trees untouched.

</details>

### Exercise 2.3: Get class probabilities instead of hard labels

**Task:** Sometimes you want a ranked list, not a label: who are the 10 most-likely-virginica flowers? Refit the iris model, call `predict()` with `type = "prob"` on the same data, and save the resulting probability matrix to `ex_2_3`. Confirm each row sums to 1.

**Expected result:**

```
#>      setosa versicolor virginica
#> 1         1       0.000     0.000
#> 2         1       0.000     0.000
#> 3         1       0.000     0.000
#> 4         1       0.000     0.000
#> 5         1       0.000     0.000
#> ...
#> rowSums(ex_2_3)[1:3]
#> 1 2 3
#> 1 1 1
```

**Difficulty:** Intermediate

[HINTS]
Ask the model for the share of votes each class received instead of the single winning label.
Call `predict()` on the refit with `type = "prob"` to get the probability matrix.

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
fit <- randomForest(Species ~ ., data = iris)
ex_2_3 <- predict(fit, newdata = iris, type = "prob")
head(ex_2_3)
all.equal(unname(rowSums(ex_2_3)), rep(1, nrow(ex_2_3)))
#> [1] TRUE
```

**Explanation:** Each row of the probability matrix is the share of trees that voted for that class. Because random forest is itself an ensemble of votes, these scores are not perfectly calibrated, but they are good enough for ranking, lift charts, and AUC. If you need calibrated probabilities for thresholding, fit isotonic regression or Platt scaling on a held-out slice.

</details>

## Section 3. Regression with random forests (3 problems)

### Exercise 3.1: Predict mpg from car specs with a regression forest

**Task:** Use `randomForest()` to fit a regression model on `mtcars` predicting `mpg` from the other ten columns. Set the seed, fit with the default 500 trees, save the fit to `ex_3_1`, and print the model to read the "% Var explained" line.

**Expected result:**

```
#>                Type of random forest: regression
#>                      Number of trees: 500
#> No. of variables tried at each split: 3
#>
#>           Mean of squared residuals: 5.6
#>                     % Var explained: 84
```

**Difficulty:** Intermediate

[HINTS]
A numeric response makes the forest switch to regression on its own; read the variance-explained line from the printout.
Fit with the formula `mpg ~ .` and `data = mtcars` after setting the seed.

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
ex_3_1 <- randomForest(mpg ~ ., data = mtcars)
ex_3_1
#>           Mean of squared residuals: 5.6
#>                     % Var explained: 84
```

**Explanation:** For regression, the default `mtry` jumps to `floor(p / 3)` because trees benefit from more candidate splits when predicting a continuous target. "% Var explained" is `1 - MSE / Var(y)`, which is an OOB equivalent of R-squared. Note that random forest regression cannot extrapolate beyond the range of the training response: predictions are averages of leaf means, so you will never see a prediction larger than the maximum training `y`.

</details>

### Exercise 3.2: Beat a linear regression baseline on a 70/30 split

**Task:** A pricing analyst wants to know if random forest actually beats `lm()` on `mtcars` for predicting `mpg`, or if linear regression is good enough. Split 70/30, fit both models on the training rows, score both on the test rows using mean squared error, and save the result as a named numeric vector `c(rf = ..., lm = ...)` in `ex_3_2`.

**Expected result:**

```
#>       rf       lm
#> 4.412821 9.022324
```

**Difficulty:** Intermediate

[HINTS]
Train both models on the same rows and judge them on the same untouched test rows so the comparison is fair.
Build the split with `sample()`, fit one forest and one `lm()`, then compute `mean((y - yhat)^2)` from each model's `predict()` output.

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
idx <- sample(nrow(mtcars), round(0.7 * nrow(mtcars)))
train <- mtcars[idx, ]
test  <- mtcars[-idx, ]

set.seed(1)
fit_rf <- randomForest(mpg ~ ., data = train)
fit_lm <- lm(mpg ~ ., data = train)

mse <- function(y, yhat) mean((y - yhat)^2)
ex_3_2 <- c(
  rf = mse(test$mpg, predict(fit_rf, test)),
  lm = mse(test$mpg, predict(fit_lm, test))
)
ex_3_2
#>       rf       lm
#> 4.412821 9.022324
```

**Explanation:** With only 32 rows, `lm()` is already overparameterized (10 predictors), so the linear baseline is fragile and RF wins comfortably here. On a real-sized regression problem the gap usually shrinks because linear regression scales gracefully with sample size. The right lesson is: always benchmark RF against a stripped-down `lm()` before reporting that you used "advanced ML".

</details>

### Exercise 3.3: Forecast daily ozone and inspect residuals

**Task:** An environmental analyst is forecasting daily `Ozone` in `airquality`. Drop rows where any predictor or response is missing (use `na.omit`), fit a regression random forest of `Ozone` on `Solar.R + Wind + Temp`, then compute the residual vector (`observed - predicted`) using OOB predictions. Save the residual vector to `ex_3_3`.

**Expected result:**

```
#> length(ex_3_3)
#> [1] 111
#> summary(ex_3_3)
#>      Min.   1st Qu.    Median      Mean   3rd Qu.      Max.
#> -42.6890   -7.1525   -1.4570    0.0214    7.0220   53.8410
```

**Difficulty:** Intermediate

[HINTS]
Drop the incomplete rows first, then build the residuals from out-of-bag predictions so no separate holdout is needed.
After `na.omit()`, subtract the fit object's `predicted` element from the observed `Ozone` column.

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
aq <- na.omit(airquality[, c("Ozone", "Solar.R", "Wind", "Temp")])
set.seed(1)
fit <- randomForest(Ozone ~ Solar.R + Wind + Temp, data = aq)
ex_3_3 <- aq$Ozone - fit$predicted
length(ex_3_3)
#> [1] 111
summary(ex_3_3)
```

**Explanation:** `fit$predicted` is the OOB prediction for each training row, so `observed - predicted` is an honest residual without needing a holdout. A symmetric residual cloud around zero is what you want; heavy tails or a fan shape signals that variance grows with the prediction, which random forest cannot fix on its own. Log-transforming the response, or moving to a quantile regression forest, are the usual next steps.

</details>

## Section 4. Tuning the forest (4 problems)

### Exercise 4.1: Sweep mtry automatically with tuneRF

**Task:** Use `tuneRF()` on `iris` to scan candidate `mtry` values and find the one that minimizes OOB error. Pass `doBest = FALSE` so the call returns the scan table rather than refitting at the best value. Save the resulting two-column matrix (`mtry`, `OOBError`) to `ex_4_1`.

**Expected result:**

```
#>       mtry OOBError
#> 1.OOB    1   0.0467
#> 2.OOB    2   0.0400
#> 4.OOB    4   0.0467
```

**Difficulty:** Intermediate

[HINTS]
Let a helper scan several candidate split-width settings and report the out-of-bag error for each.
Call `tuneRF()` with `x`, `y`, `doBest = FALSE` and `plot = FALSE` so it returns the scan matrix.

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
ex_4_1 <- tuneRF(
  x = iris[, 1:4], y = iris$Species,
  stepFactor = 2, improve = 0.01, plot = FALSE, doBest = FALSE
)
ex_4_1
#>       mtry OOBError
#> 1.OOB    1   0.0467
#> 2.OOB    2   0.0400
#> 4.OOB    4   0.0467
```

**Explanation:** `tuneRF()` walks outward from the default `mtry`, multiplying by `stepFactor` until OOB stops improving by at least `improve` percent. It is greedier and faster than a full grid search but can miss flat valleys, so for serious tuning prefer `caret::train()` or a manual grid over `mtry` and `nodesize` together. Smaller `mtry` makes trees more decorrelated; the sweet spot is usually near `sqrt(p)` for classification and `p/3` for regression.

</details>

### Exercise 4.2: Find how many trees are enough

**Task:** A model-review engineer wants to know how many trees the iris forest actually needs: too few gives noisy OOB error, too many wastes compute. Fit a 1000-tree forest, then read `err.rate[, "OOB"]` at row indices 50, 100, 500, and 1000. Save the four numbers as a named numeric vector (names `"50"`, `"100"`, `"500"`, `"1000"`) to `ex_4_2`.

**Expected result:**

```
#>         50        100        500       1000
#> 0.04666667 0.04666667 0.04000000 0.04000000
```

**Difficulty:** Intermediate

[HINTS]
The forest records its running error as each tree is added, so you can inspect several tree counts from one fit.
Fit with `ntree = 1000`, then index `fit$err.rate[, "OOB"]` at rows 50, 100, 500, and 1000.

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
fit <- randomForest(Species ~ ., data = iris, ntree = 1000)
checkpoints <- c(50, 100, 500, 1000)
ex_4_2 <- fit$err.rate[checkpoints, "OOB"]
names(ex_4_2) <- as.character(checkpoints)
ex_4_2
```

**Explanation:** The `err.rate` matrix stores the OOB error at every added tree, so you can see exactly where the curve flattens without refitting four separate models. For most tabular problems, 200 to 500 trees is enough; going to 2000 rarely improves test accuracy and just slows scoring. Use `plot(fit)` to see the full curve before committing to a final `ntree`.

</details>

### Exercise 4.3: Control tree depth by sweeping nodesize

**Task:** Smaller `nodesize` produces deeper, more overfit trees; larger values shrink the forest toward a stump. For each `nodesize` in `c(1, 5, 10, 20)`, fit a 500-tree iris classifier and record the final OOB error. Save the result as a `data.frame` with columns `nodesize` and `oob` to `ex_4_3`.

**Expected result:**

```
#>   nodesize        oob
#> 1        1 0.04000000
#> 2        5 0.04000000
#> 3       10 0.04666667
#> 4       20 0.05333333
```

**Difficulty:** Advanced

[HINTS]
A larger minimum leaf size makes shallower trees; loop over a few values and grab each forest's final error.
Vary the `nodesize` argument of the fitting call and read the last value of `fit$err.rate[, "OOB"]`.

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
sweep_one <- function(ns) {
  set.seed(1)
  fit <- randomForest(Species ~ ., data = iris, nodesize = ns, ntree = 500)
  tail(fit$err.rate[, "OOB"], 1)
}
sizes <- c(1, 5, 10, 20)
ex_4_3 <- data.frame(nodesize = sizes, oob = sapply(sizes, sweep_one))
ex_4_3
```

**Explanation:** Default `nodesize` is 1 for classification (every leaf can be pure) and 5 for regression. Bumping it up acts as a depth regulator and reduces variance, but can also blunt the signal. On a tiny dataset like `iris`, the OOB curve is almost flat across reasonable values; on noisy data with thousands of rows, the same sweep often shows a clear minimum.

</details>

### Exercise 4.4: Grid-search mtry and nodesize jointly

**Task:** A senior data scientist preparing model-card documentation wants a small joint grid: `mtry` in `c(2, 3, 4)` crossed with `nodesize` in `c(1, 5, 10)`. For each of the 9 combinations, fit on `iris` with 500 trees and record the final OOB error. Save the 9-row tibble (columns `mtry`, `nodesize`, `oob`) to `ex_4_4`.

**Expected result:**

```
#>   mtry nodesize        oob
#> 1    2        1 0.04000000
#> 2    2        5 0.04000000
#> 3    2       10 0.04000000
#> 4    3        1 0.04000000
#> 5    3        5 0.04000000
#> 6    3       10 0.04666667
#> 7    4        1 0.04666667
#> 8    4        5 0.04666667
#> 9    4       10 0.04666667
```

**Difficulty:** Advanced

[HINTS]
Cross every split-width choice with every leaf-size choice and fit one forest per combination.
Build the combinations with `expand.grid()`, then pass each pair as `mtry` and `nodesize` to the fitting call.

```r title="Your turn"
ex_4_4 <- # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
grid <- expand.grid(mtry = c(2, 3, 4), nodesize = c(1, 5, 10))
grid$oob <- mapply(function(m, ns) {
  set.seed(1)
  fit <- randomForest(Species ~ ., data = iris,
                      mtry = m, nodesize = ns, ntree = 500)
  tail(fit$err.rate[, "OOB"], 1)
}, grid$mtry, grid$nodesize)
ex_4_4 <- grid
ex_4_4
```

**Explanation:** `expand.grid()` is the cheapest way to enumerate a small parameter grid; for larger spaces use `caret::train()` with `trControl = trainControl("oob")` so resampling is free. The pattern of OOB across the grid is more useful than the single minimum: if the surface is flat, you are not really tuning, you are just picking a tie. If one corner stands out, retrain with more trees there and confirm before locking it in.

</details>

## Section 5. Variable importance and interpretation (3 problems)

### Exercise 5.1: Rank features by mean decrease in Gini

**Task:** Refit the iris classifier with `importance = TRUE` so the model stores both impurity- and permutation-based importance. Extract the `MeanDecreaseGini` column, sort it descending, and save the resulting named numeric vector (one entry per predictor) to `ex_5_1`.

**Expected result:**

```
#> Petal.Width Petal.Length Sepal.Length  Sepal.Width
#>    44.32420     43.16424     10.07227     2.20308
```

**Difficulty:** Intermediate

[HINTS]
Ask the model to store how much each feature reduced node impurity, then order the features by that score.
Fit with `importance = TRUE`, pull the `MeanDecreaseGini` column via `importance(fit, type = 2)`, and `sort()` it descending.

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
fit <- randomForest(Species ~ ., data = iris, importance = TRUE)
imp <- importance(fit, type = 2)[, "MeanDecreaseGini"]
ex_5_1 <- sort(imp, decreasing = TRUE)
ex_5_1
```

**Explanation:** Gini importance sums the reduction in node impurity contributed by each variable across all trees, weighted by the rows that reach the split. It is fast (computed during training, no extra passes) but biased toward continuous and high-cardinality predictors. When two variables are correlated, Gini can split the importance arbitrarily between them, so the ranking is more reliable than the magnitudes.

</details>

### Exercise 5.2: Compare Gini importance with permutation importance

**Task:** A model-review reviewer doesn't trust Gini importance because it favors high-cardinality features. Compute both `MeanDecreaseGini` (type 2) and `MeanDecreaseAccuracy` (type 1, permutation) from the same iris fit. Save a data frame with columns `gini` and `permutation`, rows named by predictor, to `ex_5_2`.

**Expected result:**

```
#>                   gini permutation
#> Sepal.Length  10.07227   0.6932735
#> Sepal.Width    2.20308   0.1668776
#> Petal.Length  43.16424   3.3447244
#> Petal.Width   44.32420   3.4218322
```

**Difficulty:** Advanced

[HINTS]
Compare the impurity-based ranking against the one that measures accuracy loss when a feature is scrambled.
From `importance(fit)` take both the `MeanDecreaseGini` and `MeanDecreaseAccuracy` columns into a data frame.

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
fit <- randomForest(Species ~ ., data = iris, importance = TRUE)
imp <- importance(fit)
ex_5_2 <- data.frame(
  gini        = imp[, "MeanDecreaseGini"],
  permutation = imp[, "MeanDecreaseAccuracy"]
)
ex_5_2
```

**Explanation:** Permutation importance shuffles one feature at a time on the OOB rows and measures how much accuracy drops. It is the "fair" version (not biased by cardinality) but is roughly k times more expensive, where k is the number of features. On `iris` the two rankings happen to agree, but on real datasets with mixed-type features they often disagree, and the permutation ranking is the one to trust.

</details>

### Exercise 5.3: Read a partial dependence curve for Petal.Length

**Task:** A botanist wants to see how the model's score for the setosa class changes as `Petal.Length` varies, holding all other features at their typical values. Use `partialPlot()` with `which.class = "setosa"` (and `plot = FALSE`) and save the returned list (with `$x` and `$y` of equal length) to `ex_5_3`.

**Expected result:**

```
#> length(ex_5_3$x)
#> [1] 51
#> head(round(ex_5_3$x, 2))
#> [1] 1.00 1.18 1.36 1.54 1.72 1.90
#> range(ex_5_3$y)
#> [1] -1.099  1.099
```

**Difficulty:** Intermediate

[HINTS]
Trace how the model's score for one class shifts as a single feature sweeps across its range.
Call `partialPlot()` with `x.var = "Petal.Length"`, `which.class = "setosa"`, and `plot = FALSE`.

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
fit <- randomForest(Species ~ ., data = iris)
ex_5_3 <- partialPlot(fit, pred.data = iris, x.var = "Petal.Length",
                      which.class = "setosa", plot = FALSE)
length(ex_5_3$x)
#> [1] 51
range(ex_5_3$y)
#> [1] -1.099  1.099
```

**Explanation:** A partial dependence plot fixes every row at the candidate value of one feature, scores the forest, and averages the score across rows. The y-axis for a classification PDP is on a logit-style scale (`log(p / (1 - p))`), not a probability, which is why values can be negative. PDPs assume features are independent, so they are misleading when predictors are strongly correlated; in that case use ICE (individual conditional expectation) plots or SHAP values instead.

</details>

## Section 6. ranger: the production-grade backend (2 problems)

### Exercise 6.1: Re-fit the iris classifier with ranger

**Task:** Re-fit the iris classifier using `ranger()` (multi-threaded, written in C++) with 500 trees and `importance = "impurity"`. Save the model object to `ex_6_1` and inspect the prediction-error line in the printed summary.

**Expected result:**

```
#> Ranger result
#>
#> Type:                            Classification
#> Number of trees:                 500
#> Sample size:                     150
#> Number of independent variables: 4
#> Mtry:                            2
#> Target node size:                1
#> Variable importance mode:        impurity
#> OOB prediction error:            4.00 %
```

**Difficulty:** Intermediate

[HINTS]
Swap to the faster compiled backend; its arguments map closely to the ones you already know.
Call `ranger()` with the formula `Species ~ .`, `num.trees = 500`, and `importance = "impurity"`.

```r title="Your turn"
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
ex_6_1 <- ranger(Species ~ ., data = iris, num.trees = 500,
                 importance = "impurity")
ex_6_1
#> OOB prediction error:            4.00 %
```

**Explanation:** `ranger` is API-compatible enough that switching from `randomForest` is usually a name swap (`ntree` becomes `num.trees`, `mtry` is the same), but it is dramatically faster on data with more than a few thousand rows and parallelizes across cores by default. The OOB error matches `randomForest` here because the algorithm is the same; only the implementation differs.

</details>

### Exercise 6.2: Check that ranger and randomForest agree on predictions

**Task:** A data engineer is migrating from `randomForest` to `ranger` for production speed, but the lead won't sign off until predictions agree on at least 95% of the rows. Fit both on `iris` (same seed, 500 trees), predict on `iris` itself, then compute the fraction of rows where the two label predictions match. Save the scalar agreement rate to `ex_6_2`.

**Expected result:**

```
#> ex_6_2
#> [1] 1
```

**Difficulty:** Advanced

[HINTS]
Score both models on the same rows and measure how often their predicted labels line up.
The ranger prediction lives in the `$predictions` slot of `predict(rg_fit, data = iris)`; compare it with `mean()`.

```r title="Your turn"
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
rf_fit <- randomForest(Species ~ ., data = iris, ntree = 500)
set.seed(1)
rg_fit <- ranger(Species ~ ., data = iris, num.trees = 500)

rf_pred <- predict(rf_fit, iris)
rg_pred <- predict(rg_fit, data = iris)$predictions
ex_6_2  <- mean(as.character(rf_pred) == as.character(rg_pred))
ex_6_2
#> [1] 1
```

**Explanation:** Two forests trained with the same hyperparameters won't be byte-identical (their RNG streams differ) but should agree on the vast majority of rows on a clean dataset. A drop below 95% usually points to a column-order or factor-level mismatch, not a real algorithmic disagreement. The `predict.ranger()` return is a list with a `$predictions` slot, which is the common gotcha when porting code.

</details>

## Section 7. Honest evaluation on a holdout (2 problems)

### Exercise 7.1: Compute holdout accuracy with a stratified split

**Task:** Build a stratified 80/20 split of `iris` (so each `Species` keeps the same ratio in both halves), fit a random forest on the 120-row training slice, predict on the 30-row test slice, and compute the accuracy as a scalar. Save the accuracy value to `ex_7_1`.

**Expected result:**

```
#> ex_7_1
#> [1] 0.9666667
```

**Difficulty:** Beginner

[HINTS]
Draw the test rows class by class so each species keeps its share in both halves.
Use `split()` on the row indices by `Species`, `sample()` within each group, then `mean(pred == test$Species)`.

```r title="Your turn"
ex_7_1 <- # your code here
ex_7_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
test_rows <- unlist(lapply(split(seq_len(nrow(iris)), iris$Species),
                           function(rows) sample(rows, length(rows) * 0.2)))
train <- iris[-test_rows, ]
test  <- iris[test_rows, ]

fit <- randomForest(Species ~ ., data = train)
pred <- predict(fit, newdata = test)
ex_7_1 <- mean(pred == test$Species)
ex_7_1
#> [1] 0.9666667
```

**Explanation:** Stratified sampling preserves the marginal distribution of the response, which matters more when the class ratios are skewed. A single split is still a noisy estimate; for a more stable number, repeat the split (or use k-fold CV) and average the per-fold accuracies. Random forest's OOB error usually tracks the test error closely, so on small data the OOB number is fine to report.

</details>

### Exercise 7.2: Compute per-class recall from a confusion matrix

**Task:** A QA reviewer needs per-class recall (true positives divided by row totals) from the iris random forest's OOB confusion matrix, because overall accuracy can hide a class that the model can barely identify. Pull the 3x3 prediction sub-matrix out of `fit$confusion`, divide each row by its sum, and save the resulting 3-element named numeric (the diagonal) to `ex_7_2`.

**Expected result:**

```
#>     setosa versicolor  virginica
#>       1.00       0.94       0.94
```

**Difficulty:** Intermediate

[HINTS]
Recall is each class's correctly predicted count divided by how many of that class actually existed.
Take `fit$confusion[, 1:3]`, then compute `diag(cm) / rowSums(cm)`.

```r title="Your turn"
ex_7_2 <- # your code here
ex_7_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
fit <- randomForest(Species ~ ., data = iris)
cm  <- fit$confusion[, 1:3]
recalls <- diag(cm) / rowSums(cm)
ex_7_2 <- round(recalls, 2)
ex_7_2
#>     setosa versicolor  virginica
#>       1.00       0.94       0.94
```

**Explanation:** Recall (or sensitivity, or TPR) is the right per-class metric whenever missing a true positive is costly: disease screening, fraud, defect detection. Precision (`diag / colSums`) is its mirror image and matters when false alarms are costly. The full picture is best read off the confusion matrix itself; single-number metrics like accuracy or F1 are convenient but always discard structure.

</details>

## What to do next

- [Machine Learning Exercises in R](Machine-Learning-Exercises-in-R.html) covers the full workflow: splitting, resampling, feature engineering, and evaluation across models.
- [XGBoost Exercises in R](XGBoost-Exercises-in-R.html) for gradient-boosted trees, the usual next stop after random forest.
- [tidymodels Exercises in R](tidymodels-Exercises-in-R.html) wraps random forest, ranger, and other engines behind a single tidy interface.
- [Cross-Validation Exercises in R](Cross-Validation-Exercises-in-R.html) to replace single-split holdouts with k-fold and repeated-CV estimates.
