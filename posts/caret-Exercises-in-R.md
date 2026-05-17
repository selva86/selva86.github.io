---
title: "caret Exercises in R: 21 Real-World Practice Problems"
slug: "caret-Exercises-in-R"
description: "caret R exercises: 21 hands-on practice problems on train(), trainControl, preProcess pipelines, tuning grids, ROC, varImp, and resample comparison."
keywords: "caret R exercises, caret practice, caret tune R, caret train R, trainControl R, tuneGrid R, varImp R, resamples R"
mathjax: false
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "caret Exercises"
sidebar_order: 171
fr_parent: "R-Tutorial.html"
auto_link_terms: "caret r exercises|caret practice problems|trainControl r|tunegrid r|varimp r|resamples r"
auto_link_case_sensitive: false
target_keyword: "caret R exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# caret Exercises in R: 21 Real-World Practice Problems

<p class="lead">Twenty-one practice problems on the caret package: fitting models with train(), wiring resampling through trainControl, building preProcess pipelines, tuning hyperparameter grids, comparing models with resamples(), inspecting variable importance, and rebalancing imbalanced classes. Solutions are hidden behind expandable details so you can attempt every problem first, then check.</p>

```r title="Run this once before any exercise"
library(caret)
library(dplyr)
library(rpart)
```

## Section 1. Train your first models (3 problems)

### Exercise 1.1: Wrap a linear regression inside the caret train interface

**Task:** A junior analyst onboarding to caret wants one command that drops a base lm() into the caret API so future hyperparameter sweeps and cross-validation come for free. Use train() to fit mpg against every other column of the built-in mtcars dataset with method = "lm" and save the fitted train object to `ex_1_1`.

**Expected result:**

```
#> Linear Regression
#>
#> 32 samples
#> 10 predictors
#>
#> No pre-processing
#> Resampling: Bootstrapped (25 reps)
#> Summary of sample sizes: 32, 32, 32, 32, 32, 32, ...
#> Resampling results:
#>
#>   RMSE      Rsquared   MAE
#>   3.13      0.83       2.59
#>
#> Tuning parameter 'intercept' was held constant at a value of TRUE
```

**Difficulty:** Beginner
[HINTS]
caret gives you one unified entry point so any model family is fitted the same way; you only declare which family you want.
Call train() with the formula mpg ~ ., data = mtcars, and method = "lm".

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- train(mpg ~ ., data = mtcars, method = "lm")
ex_1_1
#> Linear Regression
#> 32 samples, 10 predictors
#> RMSE 3.13, Rsquared 0.83, MAE 2.59
```

**Explanation:** train() is caret's universal front door: pass a formula, a data frame, and a method string, and the same call works for over 200 models. With no trainControl specified, caret defaults to 25 bootstrap resamples, which is why you see resampling output even though you only asked for lm. The bootstrap RMSE is honest out-of-bag error, not the in-sample residual SD that summary(lm(...)) prints.

</details>

### Exercise 1.2: Fit a decision tree baseline on iris with method rpart

**Task:** An ops engineer needs a quick interpretable baseline for the three-class iris classification before evaluating heavier methods. Use train() with method = "rpart" on the iris dataset, Species as the response and the other four columns as predictors, and save the trained object to `ex_1_2`.

**Expected result:**

```
#> CART
#>
#> 150 samples, 4 predictors, 3 classes
#>
#> Resampling: Bootstrapped (25 reps)
#> Resampling results across tuning parameters:
#>
#>   cp        Accuracy   Kappa
#>   0.000     0.93       0.90
#>   0.440     0.71       0.57
#>   0.500     0.40       0.10
#>
#> Accuracy was used to select the optimal model using the largest value.
#> The final value used for the model was cp = 0.00.
```

**Difficulty:** Intermediate
[HINTS]
An interpretable tree baseline is just another model family routed through the same training interface.
Use train() with Species ~ ., data = iris, and method = "rpart".

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- train(Species ~ ., data = iris, method = "rpart")
ex_1_2
#> CART, 150 samples, 4 predictors, 3 classes
#> Final cp = 0.00, Accuracy = 0.93
```

**Explanation:** method = "rpart" hands the formula to the rpart package and asks caret to tune the complexity parameter cp, which controls when splits are pruned. The default tune grid picks three cp values from the unpruned tree's pruning sequence, which is why the readout shows exactly three rows. For an actual production tree, prefer rpart2 (tuned by maxdepth) when you need a depth ceiling rather than a complexity ceiling.

</details>

### Exercise 1.3: Train a random forest through the x slash y interface instead of a formula

**Task:** Some caret workflows pass predictors and the response as separate arguments rather than through a formula, which matters when feature columns are computed on the fly. Use train() with the x and y arguments to fit method = "rf" on iris (drop Species from x and pass it as y), set tuneLength = 2 to keep runtime small, and save the trained object to `ex_1_3`.

**Expected result:**

```
#> Random Forest
#> 150 samples, 4 predictors, 3 classes: setosa, versicolor, virginica
#>
#> Resampling: Bootstrapped (25 reps)
#> Resampling results across tuning parameters:
#>
#>   mtry  Accuracy   Kappa
#>   2     0.95       0.93
#>   4     0.95       0.92
#>
#> Accuracy was used to select the optimal model using the largest value.
#> The final value used for the model was mtry = 2.
```

**Difficulty:** Intermediate
[HINTS]
Predictors and the response can be supplied as two separate inputs instead of bundled into a single formula.
Pass x = iris[, -5] and y = iris$Species to train() with method = "rf" and tuneLength = 2.

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- train(
  x = iris[, -5],
  y = iris$Species,
  method    = "rf",
  tuneLength = 2
)
ex_1_3
#> Random Forest, mtry = 2 selected, Accuracy = 0.95
```

**Explanation:** The x and y interface skips formula parsing, which preserves factor encodings and is friendlier when predictor columns are matrices or sparse objects (the formula interface would densify them). tuneLength = 2 narrows caret's auto-generated mtry grid to two candidate values, cutting fit time on small datasets. For real binary classification with many predictors, switch to a tuneGrid expand.grid(mtry = c(2, 4, 8, 16)) so the search is explicit and reproducible.

</details>

## Section 2. Wire up the right resampling (3 problems)

### Exercise 2.1: Replace caret's default bootstrap with 5-fold cross-validation

**Task:** The team standard at most modelling shops is 5-fold cross-validation rather than caret's default of 25 bootstrap reps because k-fold gives a less optimistic bias on small samples. Build a trainControl with method = "cv" and number = 5, pass it as trControl to a knn fit on iris, and save the trained object to `ex_2_1`.

**Expected result:**

```
#> k-Nearest Neighbors
#> 150 samples, 4 predictors, 3 classes
#>
#> Resampling: Cross-Validated (5 fold)
#> Summary of sample sizes: 120, 120, 120, 120, 120
#> Resampling results across tuning parameters:
#>
#>   k  Accuracy   Kappa
#>   5  0.96       0.94
#>   7  0.96       0.93
#>   9  0.95       0.93
#>
#> Accuracy was used to select the optimal model using the largest value.
#> The final value used for the model was k = 5.
```

**Difficulty:** Intermediate
[HINTS]
The resampling scheme is a separate configuration object you build once and hand to the training call.
Build trainControl(method = "cv", number = 5) and pass it as trControl to a knn train() call.

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ctrl <- trainControl(method = "cv", number = 5)
ex_2_1 <- train(Species ~ ., data = iris, method = "knn", trControl = ctrl)
ex_2_1
#> Resampling: Cross-Validated (5 fold)
#> Final k = 5, Accuracy = 0.96
```

**Explanation:** trainControl is the single object that holds every resampling decision: method, number, repeats, summaryFunction, classProbs, sampling, and seeds. Building it once and reusing it across competing models guarantees identical fold assignments so resamples() can make fair pairwise comparisons later. Bootstrap (the default) tends to bias estimates downward on small training sets and is harder to interpret than honest k-fold accuracy.

</details>

### Exercise 2.2: Stabilize the accuracy estimate with repeated cross-validation

**Task:** A risk team wants a stable accuracy estimate for the iris baseline by averaging across multiple cross-validation runs because a single 5-fold split has high variance on 150 rows. Use trainControl with method = "repeatedcv", number = 5, and repeats = 3 to train a glmnet model on iris with tuneLength = 3, and save the fitted result to `ex_2_2`.

**Expected result:**

```
#> glmnet
#> 150 samples, 4 predictors, 3 classes
#>
#> Resampling: Cross-Validated (5 fold, repeated 3 times)
#> Resampling results across tuning parameters:
#>
#>   alpha  lambda    Accuracy   Kappa
#>   0.10   0.0002    0.96       0.94
#>   0.55   0.0019    0.96       0.95
#>   1.00   0.0193    0.93       0.90
#>
#> Accuracy was used to select the optimal model using the largest value.
```

**Difficulty:** Intermediate
[HINTS]
Averaging the whole k-fold scheme over several runs tightens a noisy estimate on a small sample.
Set method = "repeatedcv" with number = 5 and repeats = 3 in trainControl, then train glmnet with tuneLength = 3.

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ctrl <- trainControl(method = "repeatedcv", number = 5, repeats = 3)
ex_2_2 <- train(
  Species ~ .,
  data       = iris,
  method     = "glmnet",
  trControl  = ctrl,
  tuneLength = 3
)
ex_2_2
#> Resampling: Cross-Validated (5 fold, repeated 3 times)
```

**Explanation:** Repeated k-fold runs the entire k-fold scheme multiple times with different random fold assignments, then averages across the repeats. This is the standard remedy when 5-fold variance is high relative to model-to-model differences (commonly under 1000 rows). With 5 folds and 3 repeats you get 15 held-out accuracy estimates per hyperparameter row, so the readout has tighter standard deviations than a single 5-fold run.

</details>

### Exercise 2.3: Use stratified folds so class proportions hold inside every fold

**Task:** Stratifying folds preserves class proportions across every fold, which matters when classes are imbalanced or when a small class could end up missing from a fold entirely. Pre-generate stratified indices with createFolds() on iris$Species (k = 5, returnTrain = TRUE), pass them via the index argument of trainControl, train a knn model, and save the fitted object to `ex_2_3`.

**Expected result:**

```
#> k-Nearest Neighbors
#> 150 samples, 4 predictors, 3 classes
#>
#> Resampling: Cross-Validated (5 fold)
#> Summary of sample sizes: 120, 120, 120, 120, 120
#>
#>   k  Accuracy   Kappa
#>   5  0.96       0.94
#>   7  0.95       0.93
#>   9  0.95       0.93
```

**Difficulty:** Advanced
[HINTS]
You can pre-compute fold membership yourself so each fold keeps the same class mix as the whole dataset.
Generate folds with createFolds(iris$Species, k = 5, returnTrain = TRUE) and pass them to trainControl via the index argument.

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
folds <- createFolds(iris$Species, k = 5, returnTrain = TRUE)
ctrl  <- trainControl(method = "cv", index = folds)
ex_2_3 <- train(Species ~ ., data = iris, method = "knn", trControl = ctrl)
ex_2_3
#> 5 stratified folds, Accuracy ~0.96
```

**Explanation:** createFolds() with the response as input does stratified splitting: each fold contains roughly the same proportion of each class as the full dataset. Passing returnTrain = TRUE flips its default behaviour (otherwise it returns held-out indices). Stratification is mandatory whenever a class is rare enough that a random split could put zero positives in a fold, which collapses metrics like sensitivity and ROC. The createDataPartition() helper does the same job for a single train/test split.

</details>

## Section 3. Preprocess inside the cross-validation loop (4 problems)

### Exercise 3.1: Center and scale predictors so distance is not dominated by scale

**Task:** A junior analyst training knn on mtcars notices that unscaled disp (hundreds) dominates the Euclidean distance metric versus drat (around four), so neighbours are picked almost entirely by displacement. Refit knn through train() with preProcess = c("center", "scale") and 5-fold CV so the predictors are standardized inside every fold, and save the fitted train object to `ex_3_1`.

**Expected result:**

```
#> k-Nearest Neighbors
#> 32 samples, 10 predictors
#>
#> Pre-processing: centered (10), scaled (10)
#> Resampling: Cross-Validated (5 fold)
#>
#>   k  RMSE   Rsquared   MAE
#>   5  3.05   0.81       2.45
#>   7  3.21   0.79       2.58
#>   9  3.40   0.76       2.71
```

**Difficulty:** Beginner
[HINTS]
Standardizing predictors should happen inside each fold so no held-out information leaks into the scaling.
Add preProcess = c("center", "scale") to a knn train() call alongside a 5-fold trainControl.

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ctrl <- trainControl(method = "cv", number = 5)
ex_3_1 <- train(
  mpg ~ .,
  data       = mtcars,
  method     = "knn",
  preProcess = c("center", "scale"),
  trControl  = ctrl
)
ex_3_1
#> Pre-processing: centered (10), scaled (10)
```

**Explanation:** Passing preProcess inside train() (not as a separate preProcess() call upstream) is the only way to keep the scaling parameters honest: caret fits the mean and SD on each training fold and applies them to the held-out fold, so no test-time information leaks into the means used at training time. Centering and scaling are required for any distance- or kernel-based model (knn, SVM, kernel ridge) and they are harmless for tree-based models.

</details>

### Exercise 3.2: Compress predictors onto principal components before the model fits

**Task:** A genomics team handling highly correlated expression columns wants to compress the predictor space before fitting a tree because correlated splits waste depth on the same axis. Use train() on iris with method = "rpart" and preProcess = c("center", "scale", "pca"), so caret rotates onto principal components inside each fold before splitting. Save the trained model to `ex_3_2`.

**Expected result:**

```
#> CART
#> 150 samples, 4 predictors, 3 classes
#>
#> Pre-processing: centered (4), scaled (4), principal component signal extraction (4)
#> Resampling: Bootstrapped (25 reps)
#>
#>   cp     Accuracy   Kappa
#>   0.00   0.91       0.86
#>   0.44   0.69       0.54
#>   0.50   0.38       0.07
```

**Difficulty:** Intermediate
[HINTS]
Correlated predictors can be rotated onto uncorrelated axes before the model ever sees them.
Pass preProcess = c("center", "scale", "pca") to train() with method = "rpart" on iris.

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- train(
  Species ~ .,
  data       = iris,
  method     = "rpart",
  preProcess = c("center", "scale", "pca")
)
ex_3_2
#> Pre-processing: centered (4), scaled (4), pca (4 components)
```

**Explanation:** caret's pca preprocessor keeps enough components to retain 95 percent of variance by default (override with trainControl(preProcOptions = list(thresh = 0.99))). The center and scale steps run first (PCA assumes unit variance) and are not optional when preProcess includes pca. For trees this rotation usually hurts interpretability without helping accuracy (tree splits already partition arbitrary directions), but for linear and distance models on correlated predictors PCA acts as a poor-man's regularizer.

</details>

### Exercise 3.3: Apply Box-Cox to normalize right-skewed predictors

**Task:** A finance team noticed right-skewed dollar values in their feature set and wants caret to apply a Box-Cox transformation inside cross-validation so the predictors look more Gaussian before fitting an OLS model. Use train() on mtcars predicting mpg with method = "lm" and preProcess = c("BoxCox", "center", "scale"), and save the trained object to `ex_3_3`.

**Expected result:**

```
#> Linear Regression
#> 32 samples, 10 predictors
#>
#> Pre-processing: Box-Cox transformation (5), centered (10), scaled (10)
#> Resampling: Bootstrapped (25 reps)
#>
#>   RMSE   Rsquared   MAE
#>   2.86   0.86       2.34
```

**Difficulty:** Intermediate
[HINTS]
A power transformation can pull right-skewed columns toward a more symmetric shape before fitting.
Use preProcess = c("BoxCox", "center", "scale") in a method = "lm" train() call on mtcars.

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- train(
  mpg ~ .,
  data       = mtcars,
  method     = "lm",
  preProcess = c("BoxCox", "center", "scale")
)
ex_3_3
#> Pre-processing: Box-Cox transformation (5), centered (10), scaled (10)
```

**Explanation:** Box-Cox only applies to strictly positive numeric columns, which is why the readout often shows fewer transformed columns than total predictors (it silently skips columns with zeros or negatives). The estimated lambda per column is fit on each training fold and applied to the held-out fold, just like center and scale. For columns with zeros, swap to "YeoJohnson", which handles non-positive values; for log-only transformations the plain log1p is simpler if you have a domain reason.

</details>

### Exercise 3.4: Chain median imputation, near-zero-variance drop, and standardization

**Task:** Production data often arrives with scattered NAs and the occasional constant column that crashes naive models, so a robust preprocessing chain belongs inside the resampling loop, not as a separate upstream step. Drop rows where Ozone is NA in airquality, then use train() predicting Ozone with method = "lm" and preProcess = c("medianImpute", "nzv", "center", "scale"), and save the model to `ex_3_4`.

**Expected result:**

```
#> Linear Regression
#> 116 samples, 5 predictors
#>
#> Pre-processing: median imputation (5), centered (5), scaled (5)
#> Resampling: Bootstrapped (25 reps)
#>
#>   RMSE     Rsquared   MAE
#>   21.7     0.62       16.0
```

**Difficulty:** Advanced
[HINTS]
A robust cleaning chain that fills gaps, drops dead columns, then standardizes belongs inside the resampling loop, and the order of those steps matters.
Drop rows with NA Ozone, then set preProcess = c("medianImpute", "nzv", "center", "scale") on a method = "lm" train() call.

```r title="Your turn"
ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
aq <- airquality[!is.na(airquality$Ozone), ]
ex_3_4 <- train(
  Ozone ~ .,
  data       = aq,
  method     = "lm",
  preProcess = c("medianImpute", "nzv", "center", "scale")
)
ex_3_4
#> Pre-processing: median imputation (5), centered (5), scaled (5)
```

**Explanation:** Order matters inside preProcess: caret runs imputation first (so NAs do not break variance calculations), then nzv (so constant columns are dropped before scaling produces NaN), then center, then scale. The medianImpute step computes a per-column median on each training fold, never peeking at the held-out fold. If you need richer imputation switch to "knnImpute" or "bagImpute" (slower but multivariate). Always drop rows where the response is NA before train(), because caret cannot impute targets.

</details>

## Section 4. Tune hyperparameters deliberately (3 problems)

### Exercise 4.1: Widen the auto-generated tune grid with tuneLength

**Task:** An ML engineer prototyping a random forest on iris wants caret to evaluate more mtry values than the default of three so the search has a real chance of finding the sweet spot. Set tuneLength = 5 on a train() call with method = "rf" and a 5-fold trainControl so caret expands the search grid automatically, and save the fitted object to `ex_4_1`.

**Expected result:**

```
#> Random Forest
#> 150 samples, 4 predictors, 3 classes
#>
#>   mtry  Accuracy   Kappa
#>   2     0.96       0.94
#>   3     0.96       0.94
#>   4     0.95       0.93
#>   5     0.95       0.93
#>   6     0.95       0.93
#>
#> The final value used for the model was mtry = 2.
```

**Difficulty:** Intermediate
[HINTS]
You can ask the trainer to auto-generate a wider set of candidate settings than its sparse default.
Set tuneLength = 5 on a train() call with method = "rf" and a 5-fold trainControl.

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ctrl <- trainControl(method = "cv", number = 5)
ex_4_1 <- train(
  Species ~ .,
  data       = iris,
  method     = "rf",
  tuneLength = 5,
  trControl  = ctrl
)
ex_4_1
#> mtry = 2 selected, Accuracy 0.96
```

**Explanation:** tuneLength is caret's "give me N candidate values per tunable parameter" knob: it asks the method's underlying grid generator for that many values, spread sensibly across the legal range. It is the fastest way to explore beyond the default three rows when you do not have a strong prior on the parameter. For method = "rf" the grid contains only mtry (ntree is treated as a fixed hyperparameter and overridden via the ntree dot argument).

</details>

### Exercise 4.2: Replace tuneLength with an explicit tuneGrid data frame

**Task:** When you know exactly which parameter values you want to test, an explicit tuneGrid is cleaner and more reproducible than tuneLength, and it documents intent. Build a data frame with cp = c(0.001, 0.01, 0.05, 0.1, 0.2) and pass it as tuneGrid to train() with method = "rpart" on iris, then save the fitted model to `ex_4_2`.

**Expected result:**

```
#> CART
#> 150 samples, 4 predictors, 3 classes
#>
#>   cp      Accuracy   Kappa
#>   0.001   0.94       0.91
#>   0.010   0.94       0.91
#>   0.050   0.93       0.90
#>   0.100   0.93       0.90
#>   0.200   0.71       0.57
#>
#> The final value used for the model was cp = 0.001.
```

**Difficulty:** Intermediate
[HINTS]
Instead of letting the trainer guess, you can hand it the exact list of parameter values to test.
Build a data.frame with a cp column and pass it as tuneGrid to train() with method = "rpart".

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
grid <- data.frame(cp = c(0.001, 0.01, 0.05, 0.1, 0.2))
ex_4_2 <- train(
  Species ~ .,
  data     = iris,
  method   = "rpart",
  tuneGrid = grid
)
ex_4_2
#> Final cp = 0.001
```

**Explanation:** The columns of tuneGrid must exactly match the method's tunable parameters, which you can look up with modelLookup("rpart") (returns cp, parameter type, and label). Any typo in the column name produces "The tuning parameter grid should have columns ..." which is the most common caret error after silent failures from a misnamed method. Use expand.grid() when you have more than one tunable parameter, which produces the cartesian product automatically.

</details>

### Exercise 4.3: Sweep alpha and lambda jointly with expand.grid for glmnet

**Task:** A statistician fitting an elastic net on mtcars wants to scan both alpha (the mix between ridge and lasso) and lambda (the penalty strength) jointly, not one at a time, because the optima interact. Build a grid via expand.grid(alpha = c(0, 0.5, 1), lambda = c(0.01, 0.1, 1)) and pass it to train() with method = "glmnet", then save the tuned model to `ex_4_3`.

**Expected result:**

```
#> glmnet
#> 32 samples, 10 predictors
#>
#>   alpha  lambda  RMSE   Rsquared   MAE
#>   0.0    0.01    2.85   0.86       2.31
#>   0.0    0.10    2.84   0.86       2.30
#>   0.0    1.00    2.97   0.84       2.42
#>   0.5    0.01    2.83   0.86       2.30
#>   0.5    0.10    2.81   0.87       2.27
#>   0.5    1.00    3.05   0.83       2.50
#>   1.0    0.01    2.83   0.86       2.30
#>   1.0    0.10    2.80   0.87       2.26
#>   1.0    1.00    3.45   0.78       2.85
#>
#> The final values used for the model were alpha = 1 and lambda = 0.1.
```

**Difficulty:** Advanced
[HINTS]
When two parameters interact, their candidate values must be crossed together rather than scanned one at a time.
Use expand.grid(alpha = ..., lambda = ...) and pass the result as tuneGrid to a method = "glmnet" train() call.

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
grid <- expand.grid(alpha = c(0, 0.5, 1), lambda = c(0.01, 0.1, 1))
ex_4_3 <- train(
  mpg ~ .,
  data     = mtcars,
  method   = "glmnet",
  tuneGrid = grid
)
ex_4_3$bestTune
#> alpha = 1, lambda = 0.1
```

**Explanation:** alpha = 0 is pure ridge regression (every coefficient shrinks toward zero but stays non-zero), alpha = 1 is pure lasso (some coefficients become exactly zero), and intermediate values blend the two. lambda controls the overall penalty strength: zero is OLS, infinity zeros everything out. Sweep both because the surface is two-dimensional and tuning lambda at a fixed alpha can land in a poor neighbourhood. glmnet internally fits along a full lambda path per alpha for free, so the joint grid is cheap.

</details>

## Section 5. Classification metrics and class imbalance (3 problems)

### Exercise 5.1: Switch the summary function to twoClassSummary to get ROC

**Task:** A binary classifier on mtcars with am as the target only reports accuracy by default, which is uninformative when classes are imbalanced or when the decision threshold matters. Convert am to a labelled factor first, then switch trainControl to summaryFunction = twoClassSummary and classProbs = TRUE, train a glm with metric = "ROC", and save the fitted object to `ex_5_1`.

**Expected result:**

```
#> Generalized Linear Model
#> 32 samples, 10 predictors, 2 classes: auto, manual
#>
#> Resampling: Cross-Validated (5 fold)
#>
#>   ROC    Sens   Spec
#>   0.96   0.92   0.90
#>
#> ROC was used to select the optimal model using the largest value.
```

**Difficulty:** Advanced
[HINTS]
To rank models on ranking quality rather than raw accuracy, you must tell the trainer which performance summary to compute and let it keep class probabilities.
Set summaryFunction = twoClassSummary and classProbs = TRUE in trainControl, then train glm with metric = "ROC".

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
dat <- mtcars
dat$am <- factor(dat$am, levels = c(0, 1), labels = c("auto", "manual"))
ctrl <- trainControl(
  method          = "cv",
  number          = 5,
  summaryFunction = twoClassSummary,
  classProbs      = TRUE
)
ex_5_1 <- train(
  am ~ .,
  data      = dat,
  method    = "glm",
  family    = binomial,
  trControl = ctrl,
  metric    = "ROC"
)
ex_5_1
#> ROC 0.96, Sens 0.92, Spec 0.90
```

**Explanation:** twoClassSummary computes area under the ROC curve, sensitivity, and specificity (in that order) and only works when classProbs = TRUE so caret has probabilities to threshold. The factor levels matter: caret treats the FIRST level as the "positive" class for sensitivity (so "auto" here is positive). Flip with relevel() if your convention is the opposite. For multi-class problems, replace twoClassSummary with multiClassSummary (from the caret extras) or build a custom summary function.

</details>

### Exercise 5.2: Cut a holdout slice and score it with confusionMatrix

**Task:** An audit team wants a confusion matrix on a genuinely held-out slice of iris rather than the cross-validation rolled-up estimate, because external reviewers prefer one clean test set. Split iris with createDataPartition(iris$Species, p = 0.7), train rpart on the training slice, predict on the test slice, pass observed and predicted factors to confusionMatrix(), and save the result to `ex_5_2`.

**Expected result:**

```
#> Confusion Matrix and Statistics
#>
#>             Reference
#> Prediction   setosa versicolor virginica
#>   setosa         15          0         0
#>   versicolor      0         14         1
#>   virginica       0          1        14
#>
#> Overall Statistics
#>
#>                Accuracy : 0.9556
#>     95% CI : (0.847, 0.994)
#>     Kappa : 0.9333
```

**Difficulty:** Intermediate
[HINTS]
A single honest holdout slice scored after training is the audit-friendly alternative to a rolled-up resampling number.
Split with createDataPartition(iris$Species, p = 0.7), train rpart on the train slice, predict() on the rest, and pass the predicted and observed factors to confusionMatrix().

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
idx <- createDataPartition(iris$Species, p = 0.7, list = FALSE)
mod <- train(Species ~ ., data = iris[idx, ], method = "rpart")
pred <- predict(mod, newdata = iris[-idx, ])
ex_5_2 <- confusionMatrix(pred, iris[-idx, "Species"])
ex_5_2
#> Accuracy 0.956, Kappa 0.933
```

**Explanation:** createDataPartition() does stratified train/test splits, preserving class proportions in both halves, which matters more than people expect on three-class iris because a naive sample.int() can put unequal counts in the test slice and warp the accuracy estimate. confusionMatrix() prints both the counts table and a battery of derived metrics (PPV, NPV, balanced accuracy, kappa, exact binomial CI), so it is the natural one-line audit report for a classifier.

</details>

### Exercise 5.3: Downsample the majority class to fix accuracy on an imbalanced dataset

**Task:** A fraud team's classifier looks great on accuracy but is silently predicting "no fraud" for everyone because positives are only 5 percent of rows, so the model wins by ignoring the minority class. Build an imbalanced two-class dataset inline, set trainControl(sampling = "down") to balance each training fold by downsampling the majority, train rpart, and save the trained object to `ex_5_3`.

**Expected result:**

```
#> CART
#> 1000 samples, 4 predictors, 2 classes: neg, pos
#>
#> Pre-processing: Down-sampling
#> Resampling: Cross-Validated (5 fold)
#>
#>   cp        Accuracy   Kappa
#>   0.0100    0.83       0.32
#>   0.0500    0.81       0.28
#>   0.1000    0.79       0.21
#>
#> Without down-sampling, accuracy would have been 0.95 by predicting "neg" always.
```

**Difficulty:** Advanced
[HINTS]
Rebalancing an imbalanced training set has to happen inside resampling so held-out scores still reflect the real prevalence.
Set sampling = "down" in trainControl and train rpart on the imbalanced data with that control.

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(7)
n <- 1000
imb <- data.frame(
  x1 = rnorm(n),
  x2 = rnorm(n),
  x3 = rnorm(n),
  x4 = rnorm(n),
  y  = factor(ifelse(runif(n) < 0.05, "pos", "neg"))
)
ctrl <- trainControl(method = "cv", number = 5, sampling = "down")
ex_5_3 <- train(y ~ ., data = imb, method = "rpart", trControl = ctrl)
ex_5_3
#> Pre-processing: Down-sampling
```

**Explanation:** sampling = "down" tells caret to randomly drop majority-class rows inside each training fold until the classes are balanced, then fit the model on that balanced slice; the held-out fold is left untouched so metrics still reflect the real prevalence. Alternatives are "up" (oversample minority with replacement), "smote" (synthetic minority oversampling, needs the themis or DMwR helper), and "rose" (a different synthetic method). Set the sampling on trainControl rather than upstream of train() so the rebalancing happens INSIDE the resampling loop, otherwise CV scores are optimistic.

</details>

## Section 6. Compare and select competing models (3 problems)

### Exercise 6.1: Pool two models with resamples to compare on identical folds

**Task:** A modelling lead wants a head-to-head comparison of knn versus rpart on iris using identical cross-validation folds, because comparing across different fold draws inflates the variance of the comparison. Train both with the same trainControl seeds, pool them through resamples(list(knn = mod_knn, rpart = mod_rpart)), and save the resamples object to `ex_6_1`.

**Expected result:**

```
#> Models: knn, rpart
#> Number of resamples: 5
#> Performance metrics: Accuracy, Kappa
#> Time estimates for each model: <time>
```

**Difficulty:** Intermediate
[HINTS]
A fair head-to-head needs both models scored on the exact same fold draws.
Train knn and rpart under one shared trainControl (same seed set before each), then pool them with resamples(list(knn = ..., rpart = ...)).

```r title="Your turn"
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(99)
ctrl <- trainControl(method = "cv", number = 5)
mod_knn   <- train(Species ~ ., data = iris, method = "knn",   trControl = ctrl)
set.seed(99)
mod_rpart <- train(Species ~ ., data = iris, method = "rpart", trControl = ctrl)
ex_6_1 <- resamples(list(knn = mod_knn, rpart = mod_rpart))
ex_6_1
#> Models: knn, rpart; 5 resamples; metrics: Accuracy, Kappa
```

**Explanation:** Two train() calls with the same seed BEFORE each call produce identical fold assignments, which is the prerequisite for a paired comparison. resamples() collates the per-fold metrics into a long table you can summarize, diff(), and plot with bwplot() or dotplot(). The cleaner alternative when you have many models is to use trainControl(seeds = ...) to pre-generate seeds for every resample, which decouples reproducibility from the order of model calls.

</details>

### Exercise 6.2: Summarize the resamples object to read accuracy distributions

**Task:** After collecting resamples from competing models, the next step is a side-by-side summary of accuracy distributions so you can see whether one model is consistently better or merely better on average. Take a resamples() object comparing knn and rpart on iris and call summary() on it to get min, median, mean, max per metric per model, and save the summary to `ex_6_2`.

**Expected result:**

```
#> Call:
#> summary.resamples(object = res)
#>
#> Accuracy
#>         Min.  1st Qu. Median  Mean  3rd Qu.  Max.  NAs
#> knn     0.93  0.95    0.97   0.96  0.97     1.00  0
#> rpart   0.87  0.90    0.93   0.93  0.97     1.00  0
#>
#> Kappa
#>         Min.  1st Qu. Median  Mean  3rd Qu.  Max.  NAs
#> knn     0.90  0.92    0.95   0.95  0.95     1.00  0
#> rpart   0.80  0.85    0.90   0.90  0.95     1.00  0
```

**Difficulty:** Intermediate
[HINTS]
Once per-fold scores are pooled, you want the full distribution per model, not just one average.
Call summary() on the resamples() object comparing knn and rpart.

```r title="Your turn"
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(99)
ctrl <- trainControl(method = "cv", number = 5)
mod_knn   <- train(Species ~ ., data = iris, method = "knn",   trControl = ctrl)
set.seed(99)
mod_rpart <- train(Species ~ ., data = iris, method = "rpart", trControl = ctrl)
res <- resamples(list(knn = mod_knn, rpart = mod_rpart))
ex_6_2 <- summary(res)
ex_6_2
#> Accuracy, Kappa quantiles per model
```

**Explanation:** summary.resamples() returns a list with one table per metric, each row a model, each column a quantile or mean. For visual comparison reach for bwplot(res) (box-and-whisker per model) or dotplot(res, metric = "Accuracy") which also draws Tukey confidence intervals. The mean alone hides skew and outliers, so always check the full quartile table before declaring a winner; a higher-mean model with a long left tail is often worse in practice than a slightly-lower-mean model with a tight distribution.

</details>

### Exercise 6.3: Run paired t-tests on resamples with diff and summary

**Task:** A statistician on the model-selection committee wants a formal paired test of whether knn outperforms rpart on iris across the resampling folds, not just a visual eyeball of the box plot. Build a resamples() object comparing knn and rpart, pass it to diff(), call summary() on the diff object to get the matrix of paired t-tests, and save the summary to `ex_6_3`.

**Expected result:**

```
#> p-value adjustment: bonferroni
#> Upper diagonal: estimates of the difference
#> Lower diagonal: p-value for H0: difference = 0
#>
#> Accuracy
#>         knn      rpart
#> knn              0.03
#> rpart   0.011
#>
#> Kappa
#>         knn      rpart
#> knn              0.05
#> rpart   0.011
```

**Difficulty:** Advanced
[HINTS]
A formal verdict on whether one model truly beats another comes from a paired test on the per-fold differences.
Pass the resamples() object to diff(), then call summary() on that diff object.

```r title="Your turn"
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(99)
ctrl <- trainControl(method = "cv", number = 5)
mod_knn   <- train(Species ~ ., data = iris, method = "knn",   trControl = ctrl)
set.seed(99)
mod_rpart <- train(Species ~ ., data = iris, method = "rpart", trControl = ctrl)
res <- resamples(list(knn = mod_knn, rpart = mod_rpart))
ex_6_3 <- summary(diff(res))
ex_6_3
#> Bonferroni-adjusted paired t-tests
```

**Explanation:** diff() on a resamples object computes per-fold pairwise differences (knn fold 1 minus rpart fold 1, and so on), then summary() runs a paired t-test on each pair with Bonferroni-adjusted p-values. The upper triangle holds the mean difference (positive favours the row), the lower triangle holds the adjusted p-value. This is the cleanest defensible answer to "is model A really better than model B" when both share folds, and it is what to put in a report when stakeholders ask for statistical significance, not just a higher mean.

</details>

## Section 7. Predict, importance, and best tune (2 problems)

### Exercise 7.1: Rank predictors with varImp on a random forest

**Task:** An XAI reviewer needs to know which predictors drive a random forest's iris predictions before signing off on the model card. Train rf on iris with method = "rf" and tuneLength = 2 to keep runtime small, pass the trained object to varImp(), and save the variable-importance result to `ex_7_1`.

**Expected result:**

```
#> rf variable importance
#>
#>               Overall
#> Petal.Width    100.00
#> Petal.Length    93.45
#> Sepal.Length    20.13
#> Sepal.Width      0.00
```

**Difficulty:** Beginner
[HINTS]
After fitting, you can ask which predictors carried the most weight in the model's decisions.
Train rf with tuneLength = 2, then pass the fitted object to varImp().

```r title="Your turn"
ex_7_1 <- # your code here
ex_7_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mod <- train(Species ~ ., data = iris, method = "rf", tuneLength = 2)
ex_7_1 <- varImp(mod)
ex_7_1
#> Petal.Width 100, Petal.Length 93.45, Sepal.Length 20.13, Sepal.Width 0
```

**Explanation:** varImp() returns a model-specific importance score scaled to 0 through 100 by default, with the most important predictor pinned at 100. For random forest the underlying number is mean decrease in Gini impurity, summed across trees; for glm it is the absolute value of the t-statistic; for rpart it is the surrogate-split score. Always read varImp values relative to the others in the same model, never compare raw values across model types (the scales are not commensurable).

</details>

### Exercise 7.2: Extract bestTune and predict class probabilities for a new batch

**Task:** A reporting analyst wants both the winning hyperparameter row and the class probability columns for a fresh batch of iris-shaped rows so the downstream calibration step has uncertainty to work with. Train rpart on iris with a small tuneGrid, extract model$bestTune, then call predict(model, newdata = iris[1:5, ], type = "prob"). Save the predicted probability data frame to `ex_7_2`.

**Expected result:**

```
#>   setosa versicolor virginica
#> 1   1.00       0.00      0.00
#> 2   1.00       0.00      0.00
#> 3   1.00       0.00      0.00
#> 4   1.00       0.00      0.00
#> 5   1.00       0.00      0.00
```

**Difficulty:** Intermediate
[HINTS]
A fitted, tuned model exposes both its winning settings and per-class probability output for new rows.
Read model$bestTune, then call predict() with newdata = iris[1:5, ] and type = "prob".

```r title="Your turn"
ex_7_2 <- # your code here
ex_7_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
grid <- data.frame(cp = c(0.001, 0.01, 0.05))
mod  <- train(Species ~ ., data = iris, method = "rpart", tuneGrid = grid)
mod$bestTune
#>     cp
#> 1 0.001
ex_7_2 <- predict(mod, newdata = iris[1:5, ], type = "prob")
ex_7_2
#>   setosa versicolor virginica
#> 1   1.00       0.00      0.00
```

**Explanation:** predict() on a caret train object defaults to type = "raw" (class label or numeric prediction), but type = "prob" returns one column per class for classification models, which is what most downstream calibration, threshold tuning, and lift analysis needs. Class probability output requires that the model was trained with classProbs = TRUE in trainControl, otherwise caret will refuse and raise an error. model$bestTune holds the single hyperparameter row that won on the resampling metric, which is what predict() uses by default.

</details>

## What to do next

You now have a working catalogue of caret recipes: training, resampling, preprocessing, tuning, imbalance handling, model comparison, and prediction. Three good follow-ups:

- [Random Forest Exercises in R](randomForest-Exercises-in-R.html) for deeper tuning of the underlying RF engine that caret wraps.
- [Logistic Regression Exercises in R](Logistic-Regression-Exercises-in-R.html) to practice the classification side without the caret wrapper.
- [Linear Regression Exercises in R](Linear-Regression-Exercises-in-R.html) for the regression baselines that caret defers to under method = "lm".
