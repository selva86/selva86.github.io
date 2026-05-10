---
title: "Machine Learning Exercises in R: 50 Real Practice Problems"
slug: "Machine-Learning-Exercises-in-R"
description: "Sharpen ML skills with 50 practice problems in R: classification, regression, tuning, feature engineering, evaluation. tidymodels and caret. Hidden solutions."
keywords: "machine learning exercises in R, ML exercises R, machine learning practice R, tidymodels exercises, R ML practice problems, R machine learning tutorial practice"
mathjax: false
webr: true
date: "2026-05-11"
post_type: "EX"
sidebar_title: "Machine Learning Exercises"
sidebar_order: 107
fr_parent: "R-Tutorial.html"
auto_link_terms: "machine learning exercises|ML exercises in R|machine learning practice in R|R ML exercises"
auto_link_case_sensitive: false
target_keyword: "machine learning exercises in R"
sibling_block_enabled: false
difficulty: "Intermediate"
---

# Machine Learning Exercises in R: 50 Real Practice Problems

<p class="lead">Fifty practice problems on machine learning in R: workflow basics, classification, regression, tuning, feature engineering, and end-to-end pipelines. Hidden solutions, runnable code.</p>

| Section | Topic | Problems | Difficulty mix |
|---|---|---|---|
| 1 | Workflow basics | 8 | beginner to intermediate |
| 2 | Classification | 10 | mostly intermediate |
| 3 | Regression ML | 8 | intermediate |
| 4 | Tuning & validation | 8 | intermediate to advanced |
| 5 | Feature engineering | 8 | intermediate |
| 6 | End-to-end ML pipelines | 8 | advanced |

```r title="Run this once before any exercise"
library(dplyr)
library(rpart)
library(randomForest)
library(class)
library(caret)
library(tibble)
library(ggplot2)
```

## Section 1. Workflow basics (8 problems)

### Exercise 1.1: Train-test split

**Scenario:** Split iris 70/30 into training and test sets reproducibly.

**Difficulty:** Beginner

```r title="Your turn"
set.seed(1)
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
n <- nrow(iris)
idx <- sample(seq_len(n), size = floor(0.7 * n))
train <- iris[idx, ]; test <- iris[-idx, ]

c(train = nrow(train), test = nrow(test))
```

**Explanation:** sample without replacement gives a random index. set.seed makes it reproducible.

</details>

### Exercise 1.2: Stratified split

**Scenario:** Same split but ensure class proportions are preserved per fold.

**Difficulty:** Intermediate

```r title="Your turn"
set.seed(1)
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
idx <- caret::createDataPartition(iris$Species, p = 0.7, list = FALSE)
train <- iris[idx, ]; test <- iris[-idx, ]

prop.table(table(train$Species))
```

**Explanation:** createDataPartition stratifies on the y argument. Critical for imbalanced classes; random split could leave some classes absent in a fold.

</details>

### Exercise 1.3: First k-NN classifier

**Scenario:** k-NN with k=5 for iris Species.

**Difficulty:** Intermediate

```r title="Your turn"
set.seed(1)
idx <- sample(seq_len(nrow(iris)), 100)
tr <- iris[idx, 1:4]; te <- iris[-idx, 1:4]
y_tr <- iris$Species[idx]; y_te <- iris$Species[-idx]
ex_1_3 <- # your code here
mean(ex_1_3 == y_te)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
idx <- sample(seq_len(nrow(iris)), 100)
tr <- iris[idx, 1:4]; te <- iris[-idx, 1:4]
y_tr <- iris$Species[idx]; y_te <- iris$Species[-idx]
ex_1_3 <- class::knn(tr, te, y_tr, k = 5)
mean(ex_1_3 == y_te)
```

**Explanation:** Class probabilities are decided by k nearest neighbors. Critical preprocessing: scale features so distances are comparable.

</details>

### Exercise 1.4: First decision tree

**Scenario:** Fit a decision tree for iris Species using all 4 predictors.

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_4 <- # your code here
print(ex_1_4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_4 <- rpart::rpart(Species ~ ., data = iris)
print(ex_1_4)
```

**Explanation:** rpart uses CART. Default stops based on cp (complexity). Inspect splits via the printed tree or `rpart.plot::rpart.plot`.

</details>

### Exercise 1.5: Compute accuracy

**Scenario:** Given predictions and truth, compute accuracy.

**Difficulty:** Beginner

```r title="Your turn"
truth <- c("a","b","a","c","b","a")
pred  <- c("a","b","b","c","b","c")
ex_1_5 <- # your code here
ex_1_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_5 <- mean(pred == truth)
ex_1_5
```

**Explanation:** Mean of TRUE/FALSE comparisons gives the proportion correct.

</details>

### Exercise 1.6: Confusion matrix

**Scenario:** Build a confusion matrix from the same predictions.

**Difficulty:** Intermediate

```r title="Your turn"
truth <- factor(c("a","b","a","c","b","a"))
pred  <- factor(c("a","b","b","c","b","c"))
ex_1_6 <- # your code here
ex_1_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
truth <- factor(c("a","b","a","c","b","a"))
pred  <- factor(c("a","b","b","c","b","c"))
ex_1_6 <- table(truth = truth, pred = pred)
ex_1_6
```

**Explanation:** table cross-tabulates truth vs pred. Diagonal = correct. caret::confusionMatrix adds per-class metrics.

</details>

### Exercise 1.7: Per-class accuracy from confusion matrix

**Scenario:** From the confusion matrix in 1.6, compute precision per class.

**Difficulty:** Intermediate

```r title="Your turn"
cm <- table(truth = factor(c("a","b","a","c","b","a")),
            pred  = factor(c("a","b","b","c","b","c")))
ex_1_7 <- # your code here
ex_1_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
cm <- table(truth = factor(c("a","b","a","c","b","a")),
            pred  = factor(c("a","b","b","c","b","c")))
ex_1_7 <- diag(cm) / colSums(cm)
ex_1_7
```

**Explanation:** Precision = TP / (TP + FP) per class = diag / column sum. Recall = diag / row sum. F1 = 2*P*R / (P+R).

</details>

### Exercise 1.8: Save and load a model

**Scenario:** Save an rpart model to disk and load it back.

**Difficulty:** Intermediate

```r title="Your turn"
fit <- rpart::rpart(Species ~ ., data = iris)
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- rpart::rpart(Species ~ ., data = iris)
saveRDS(fit, "model.rds")
loaded <- readRDS("model.rds")
identical(predict(fit), predict(loaded))
```

**Explanation:** saveRDS for one R object; readRDS to restore. Standard for serializing models.

</details>

## Section 2. Classification (10 problems)

### Exercise 2.1: Logistic regression

**Scenario:** Predict am (0/1) from mpg in mtcars.

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_1 <- # your code here
coef(ex_2_1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- glm(am ~ mpg, data = mtcars, family = binomial)
coef(ex_2_1)
```

**Explanation:** glm with family = binomial fits logistic regression. Coefficient is on log-odds scale; exp() gives odds ratio.

</details>

### Exercise 2.2: Predict probabilities

**Scenario:** Get predicted probabilities from the model in 2.1.

**Difficulty:** Intermediate

```r title="Your turn"
fit <- glm(am ~ mpg, data = mtcars, family = binomial)
ex_2_2 <- # your code here
head(ex_2_2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- glm(am ~ mpg, data = mtcars, family = binomial)
ex_2_2 <- predict(fit, type = "response")
head(ex_2_2)
```

**Explanation:** type = "response" returns probabilities; type = "link" returns log-odds; default is "link" for glm.

</details>

### Exercise 2.3: Threshold to classify

**Scenario:** Convert probabilities to 0/1 predictions at threshold 0.5.

**Difficulty:** Beginner

```r title="Your turn"
fit <- glm(am ~ mpg, data = mtcars, family = binomial)
prob <- predict(fit, type = "response")
ex_2_3 <- # your code here
table(ex_2_3, mtcars$am)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- glm(am ~ mpg, data = mtcars, family = binomial)
prob <- predict(fit, type = "response")
ex_2_3 <- as.integer(prob > 0.5)
table(ex_2_3, mtcars$am)
```

**Explanation:** Default threshold 0.5; tune for imbalanced classes or asymmetric costs.

</details>

### Exercise 2.4: ROC curve and AUC

**Scenario:** ROC curve and AUC for the logistic model.

**Difficulty:** Advanced

```r title="Your turn"
fit <- glm(am ~ mpg + hp, data = mtcars, family = binomial)
prob <- predict(fit, type = "response")
ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- glm(am ~ mpg + hp, data = mtcars, family = binomial)
prob <- predict(fit, type = "response")
roc_obj <- pROC::roc(mtcars$am, prob)
ex_2_4 <- pROC::auc(roc_obj)
ex_2_4
```

**Explanation:** ROC plots TPR vs FPR across thresholds. AUC is the area: 1 = perfect, 0.5 = random. Threshold-independent metric.

</details>

### Exercise 2.5: Random forest classifier

**Scenario:** Random forest for iris Species.

**Difficulty:** Intermediate

```r title="Your turn"
set.seed(1)
ex_2_5 <- # your code here
ex_2_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
ex_2_5 <- randomForest::randomForest(Species ~ ., data = iris)
ex_2_5
```

**Explanation:** Bootstrap aggregating with random feature subsets per split. ntree default 500; mtry sqrt(p) for classification. Out-of-bag error printed.

</details>

### Exercise 2.6: Variable importance

**Scenario:** Extract variable importance from the random forest.

**Difficulty:** Intermediate

```r title="Your turn"
set.seed(1)
fit <- randomForest::randomForest(Species ~ ., data = iris)
ex_2_6 <- # your code here
ex_2_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
fit <- randomForest::randomForest(Species ~ ., data = iris)
ex_2_6 <- randomForest::importance(fit)
ex_2_6
```

**Explanation:** MeanDecreaseGini measures average impurity reduction by each feature. Higher = more useful.

</details>

### Exercise 2.7: Naive Bayes

**Scenario:** Naive Bayes classifier for iris.

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_7 <- # your code here
ex_2_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_7 <- e1071::naiveBayes(Species ~ ., data = iris)
ex_2_7
```

**Explanation:** Assumes feature independence given class. Fast, simple, surprisingly competitive on text and high-dimensional data.

</details>

### Exercise 2.8: Imbalanced class handling

**Scenario:** Up-sample the minority class to balance.

**Difficulty:** Advanced

```r title="Your turn"
df <- tibble(x = rnorm(100), y = factor(c(rep("A", 90), rep("B", 10))))
set.seed(1)
ex_2_8 <- # your code here
table(ex_2_8$y)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
df <- tibble(x = rnorm(100), y = factor(c(rep("A", 90), rep("B", 10))))
set.seed(1)
ex_2_8 <- caret::upSample(df["x"], df$y, yname = "y")
table(ex_2_8$y)
```

**Explanation:** Replicates minority rows to match majority count. Alternatives: downSample (cut majority), SMOTE (synthetic), class weights in the model.

</details>

### Exercise 2.9: SVM with caret

**Scenario:** Train an SVM with linear kernel on iris.

**Difficulty:** Advanced

```r title="Your turn"
set.seed(1)
ex_2_9 <- # your code here
ex_2_9
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
ex_2_9 <- caret::train(Species ~ ., data = iris, method = "svmLinear")
ex_2_9
```

**Explanation:** caret::train wraps many ML methods with consistent interface. Auto-tunes when method allows. tidymodels is the modern equivalent.

</details>

### Exercise 2.10: Gradient boosting

**Scenario:** Fit a gradient-boosted classifier (gbm).

**Difficulty:** Advanced

```r title="Your turn"
ir <- iris
ir$Species_int <- as.integer(ir$Species == "virginica")
set.seed(1)
ex_2_10 <- # your code here
ex_2_10
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ir <- iris
ir$Species_int <- as.integer(ir$Species == "virginica")
set.seed(1)
ex_2_10 <- gbm::gbm(Species_int ~ Sepal.Length + Sepal.Width + Petal.Length + Petal.Width,
                    data = ir, distribution = "bernoulli", n.trees = 500,
                    interaction.depth = 3, verbose = FALSE)
ex_2_10
```

**Explanation:** GBM trains many shallow trees, each correcting predecessors. interaction.depth controls tree complexity. xgboost::xgboost is the production-grade alternative.

</details>

## Section 3. Regression ML (8 problems)

### Exercise 3.1: Regression tree

**Scenario:** Predict mpg from mtcars predictors with rpart.

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- rpart::rpart(mpg ~ ., data = mtcars)
ex_3_1
```

**Explanation:** Same rpart, regression mode (continuous y). Splits minimize within-node variance.

</details>

### Exercise 3.2: Random forest regression

**Scenario:** Random forest to predict mpg.

**Difficulty:** Intermediate

```r title="Your turn"
set.seed(1)
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
ex_3_2 <- randomForest::randomForest(mpg ~ ., data = mtcars)
ex_3_2
```

**Explanation:** Same RF; default mtry = p/3 for regression. % Var explained reported via OOB.

</details>

### Exercise 3.3: Compute RMSE

**Scenario:** Compute RMSE on a holdout for the RF in 3.2.

**Difficulty:** Intermediate

```r title="Your turn"
set.seed(1)
idx <- sample(seq_len(nrow(mtcars)), 22)
tr <- mtcars[idx, ]; te <- mtcars[-idx, ]
fit <- randomForest::randomForest(mpg ~ ., data = tr)
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
idx <- sample(seq_len(nrow(mtcars)), 22)
tr <- mtcars[idx, ]; te <- mtcars[-idx, ]
fit <- randomForest::randomForest(mpg ~ ., data = tr)
preds <- predict(fit, te)
ex_3_3 <- sqrt(mean((te$mpg - preds)^2))
ex_3_3
```

**Explanation:** RMSE = sqrt(mean(squared errors)). Same units as y; standard regression metric.

</details>

### Exercise 3.4: MAE

**Scenario:** Mean absolute error for the same predictions.

**Difficulty:** Beginner

```r title="Your turn"
preds <- c(20, 25, 30); actual <- c(22, 24, 31)
ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
preds <- c(20, 25, 30); actual <- c(22, 24, 31)
ex_3_4 <- mean(abs(preds - actual))
ex_3_4
```

**Explanation:** MAE is more robust to outliers than RMSE. Each unit error contributes linearly, not squared.

</details>

### Exercise 3.5: R-squared on test set

**Scenario:** Compute test-set R-squared for the RF.

**Difficulty:** Intermediate

```r title="Your turn"
set.seed(1)
idx <- sample(seq_len(nrow(mtcars)), 22)
tr <- mtcars[idx, ]; te <- mtcars[-idx, ]
fit <- randomForest::randomForest(mpg ~ ., data = tr)
preds <- predict(fit, te)
ex_3_5 <- # your code here
ex_3_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
idx <- sample(seq_len(nrow(mtcars)), 22)
tr <- mtcars[idx, ]; te <- mtcars[-idx, ]
fit <- randomForest::randomForest(mpg ~ ., data = tr)
preds <- predict(fit, te)
ss_res <- sum((te$mpg - preds)^2)
ss_tot <- sum((te$mpg - mean(te$mpg))^2)
ex_3_5 <- 1 - ss_res / ss_tot
ex_3_5
```

**Explanation:** R-squared on test = 1 - residual SS / total SS. Tells you how much variance the model explains beyond the test mean.

</details>

### Exercise 3.6: Ridge regression

**Scenario:** Ridge regression to predict mpg.

**Difficulty:** Advanced

```r title="Your turn"
x <- as.matrix(mtcars[, -1])
y <- mtcars$mpg
ex_3_6 <- # your code here
coef(ex_3_6, s = 0.1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
x <- as.matrix(mtcars[, -1])
y <- mtcars$mpg
ex_3_6 <- glmnet::glmnet(x, y, alpha = 0)
coef(ex_3_6, s = 0.1)
```

**Explanation:** alpha=0 is ridge (L2); alpha=1 is lasso (L1); 0<alpha<1 is elastic net. s = lambda picks the regularization strength.

</details>

### Exercise 3.7: Lasso for variable selection

**Scenario:** Lasso to predict mpg, identify zeroed coefficients.

**Difficulty:** Advanced

```r title="Your turn"
x <- as.matrix(mtcars[, -1])
y <- mtcars$mpg
fit <- glmnet::glmnet(x, y, alpha = 1)
ex_3_7 <- # your code here
ex_3_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
x <- as.matrix(mtcars[, -1])
y <- mtcars$mpg
fit <- glmnet::glmnet(x, y, alpha = 1)
ex_3_7 <- coef(fit, s = 0.5)
ex_3_7
```

**Explanation:** Lasso shrinks some coefficients to exactly 0, performing automatic variable selection. Increase s to drop more.

</details>

### Exercise 3.8: Cross-validate to pick lambda

**Scenario:** Use cv.glmnet to find the best lambda for ridge.

**Difficulty:** Advanced

```r title="Your turn"
set.seed(1)
x <- as.matrix(mtcars[, -1])
y <- mtcars$mpg
ex_3_8 <- # your code here
ex_3_8$lambda.min
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
x <- as.matrix(mtcars[, -1])
y <- mtcars$mpg
ex_3_8 <- glmnet::cv.glmnet(x, y, alpha = 0)
ex_3_8$lambda.min
```

**Explanation:** cv.glmnet runs k-fold CV across a lambda grid. lambda.min minimizes CV error; lambda.1se gives a more parsimonious choice within 1 SE.

</details>

## Section 4. Tuning and validation (8 problems)

### Exercise 4.1: 5-fold CV manually

**Scenario:** 5-fold CV for a linear model on mtcars.

**Difficulty:** Intermediate

```r title="Your turn"
set.seed(1)
folds <- sample(rep(1:5, length.out = nrow(mtcars)))
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
folds <- sample(rep(1:5, length.out = nrow(mtcars)))

rmses <- sapply(1:5, function(i) {
  tr <- mtcars[folds != i, ]; te <- mtcars[folds == i, ]
  fit <- lm(mpg ~ wt + hp, data = tr)
  sqrt(mean((te$mpg - predict(fit, te))^2))
})

mean(rmses)
```

**Explanation:** Each fold tests once. Average RMSE is the CV estimate.

</details>

### Exercise 4.2: caret::train with CV

**Scenario:** Use caret to train a random forest with 5-fold CV.

**Difficulty:** Intermediate

```r title="Your turn"
set.seed(1)
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
ex_4_2 <- caret::train(mpg ~ ., data = mtcars, method = "rf",
                       trControl = caret::trainControl(method = "cv", number = 5))
ex_4_2
```

**Explanation:** caret::train abstracts the CV loop. trainControl configures resampling. Method names: "lm", "rf", "glmnet", "xgbTree", etc.

</details>

### Exercise 4.3: Hyperparameter grid search

**Scenario:** Tune RF mtry over c(2, 4, 6) using caret.

**Difficulty:** Advanced

```r title="Your turn"
set.seed(1)
ex_4_3 <- # your code here
ex_4_3$bestTune
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
ex_4_3 <- caret::train(mpg ~ ., data = mtcars, method = "rf",
                       trControl = caret::trainControl(method = "cv", number = 5),
                       tuneGrid = expand.grid(mtry = c(2, 4, 6)))
ex_4_3$bestTune
```

**Explanation:** tuneGrid passes candidate hyperparameter values. caret picks the best by CV metric. expand.grid supports multi-parameter grids.

</details>

### Exercise 4.4: Repeated CV

**Scenario:** Repeated 5-fold CV (3 repeats) to reduce variance of the estimate.

**Difficulty:** Advanced

```r title="Your turn"
set.seed(1)
ex_4_4 <- # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
ex_4_4 <- caret::train(mpg ~ ., data = mtcars, method = "lm",
                       trControl = caret::trainControl(method = "repeatedcv",
                                                        number = 5, repeats = 3))
ex_4_4
```

**Explanation:** Repeated CV reshuffles folds and repeats. Smoother estimate of CV error at the cost of compute.

</details>

### Exercise 4.5: Bootstrap validation

**Scenario:** Use 100 bootstrap resamples for model evaluation.

**Difficulty:** Advanced

```r title="Your turn"
set.seed(1)
ex_4_5 <- # your code here
ex_4_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
ex_4_5 <- caret::train(mpg ~ ., data = mtcars, method = "lm",
                       trControl = caret::trainControl(method = "boot", number = 100))
ex_4_5
```

**Explanation:** Bootstrap resamples with replacement; out-of-bag observations form the test fold. Common alternative to CV when n is small.

</details>

### Exercise 4.6: Holdout for true generalization

**Scenario:** Split off a 20% test set BEFORE any CV, then evaluate at the end.

**Difficulty:** Intermediate

```r title="Your turn"
set.seed(1)
n <- nrow(mtcars)
test_idx <- sample(seq_len(n), size = floor(0.2 * n))
test <- mtcars[test_idx, ]; train <- mtcars[-test_idx, ]
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
n <- nrow(mtcars)
test_idx <- sample(seq_len(n), size = floor(0.2 * n))
test <- mtcars[test_idx, ]; train <- mtcars[-test_idx, ]

fit <- caret::train(mpg ~ ., data = train, method = "rf",
                    trControl = caret::trainControl(method = "cv", number = 5))
preds <- predict(fit, test)
sqrt(mean((test$mpg - preds)^2))
```

**Explanation:** Two-level split: test never touches CV/tuning. Final test RMSE is the most honest estimate of deployment performance.

</details>

### Exercise 4.7: Compare models on CV RMSE

**Scenario:** Compare lm, rf, gbm on mpg using caret resamples.

**Difficulty:** Advanced

```r title="Your turn"
set.seed(1)
ctrl <- caret::trainControl(method = "cv", number = 5)
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
ctrl <- caret::trainControl(method = "cv", number = 5)

m_lm  <- caret::train(mpg ~ ., data = mtcars, method = "lm",  trControl = ctrl)
m_rf  <- caret::train(mpg ~ ., data = mtcars, method = "rf",  trControl = ctrl)

caret::resamples(list(lm = m_lm, rf = m_rf)) |> summary()
```

**Explanation:** caret::resamples bundles CV results from multiple models for direct comparison. Always evaluate at the same resampling seed for fair comparison.

</details>

### Exercise 4.8: Early stopping

**Scenario:** xgboost with early stopping on a validation fold.

**Difficulty:** Advanced

```r title="Your turn"
set.seed(1)
n <- nrow(mtcars)
idx <- sample(seq_len(n), 22)
x_tr <- as.matrix(mtcars[idx, -1])
y_tr <- mtcars$mpg[idx]
x_te <- as.matrix(mtcars[-idx, -1])
y_te <- mtcars$mpg[-idx]
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
dtrain <- xgboost::xgb.DMatrix(x_tr, label = y_tr)
dtest  <- xgboost::xgb.DMatrix(x_te, label = y_te)

fit <- xgboost::xgb.train(
  params = list(objective = "reg:squarederror"),
  data = dtrain, nrounds = 200,
  watchlist = list(test = dtest), early_stopping_rounds = 10,
  verbose = 0
)

fit$best_iteration
```

**Explanation:** Watch test loss per round; stop when no improvement for early_stopping_rounds. Prevents overfitting and saves compute.

</details>

## Section 5. Feature engineering (8 problems)

### Exercise 5.1: One-hot encode a factor

**Scenario:** Convert factor to dummy variables.

**Difficulty:** Beginner

```r title="Your turn"
df <- tibble(color = c("red","blue","green","red","blue"))
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
df <- tibble(color = c("red","blue","green","red","blue"))
ex_5_1 <- model.matrix(~ color - 1, data = df)
ex_5_1
```

**Explanation:** model.matrix expands factors to dummy columns. `-1` removes the intercept so all levels appear. lm/glm do this automatically; for ML methods you may need to do it manually.

</details>

### Exercise 5.2: Min-max scale numeric features

**Scenario:** Rescale all numeric columns of iris to [0, 1].

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_2 <- iris |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_2 <- iris |>
  mutate(across(where(is.numeric), ~ (.x - min(.x)) / (max(.x) - min(.x))))

summary(ex_5_2[, 1:4])
```

**Explanation:** Critical preprocessing for distance-based methods (kNN, SVM, k-means). Z-scoring (mean 0, sd 1) is the alternative.

</details>

### Exercise 5.3: Z-score standardization

**Scenario:** Standardize numeric columns to mean 0, sd 1.

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_3 <- iris |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_3 <- iris |>
  mutate(across(where(is.numeric), scale))

head(ex_5_3)
```

**Explanation:** scale() centers and scales by sd. across applies it to all numeric. Always fit the scaler on train only and apply to test.

</details>

### Exercise 5.4: Log-transform skewed feature

**Scenario:** Log-transform diamonds carat (right-skewed).

**Difficulty:** Beginner

```r title="Your turn"
ex_5_4 <- diamonds |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_4 <- diamonds |>
  mutate(log_carat = log(carat))

head(ex_5_4 |> select(carat, log_carat))
```

**Explanation:** log compresses right tail, often improving linear model fit. log1p (log(1+x)) handles 0 values.

</details>

### Exercise 5.5: Bin a continuous variable

**Scenario:** Bin mpg into low/mid/high terciles.

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_5 <- mtcars |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_5 <- mtcars |>
  mutate(mpg_bin = cut(mpg,
                       breaks = quantile(mpg, c(0, 1/3, 2/3, 1)),
                       labels = c("low","mid","high"),
                       include.lowest = TRUE))

count(ex_5_5, mpg_bin)
```

**Explanation:** cut creates bins from breaks. include.lowest brings the minimum value into the first bin. ntile() is the dplyr alternative for equal-frequency bins.

</details>

### Exercise 5.6: Interaction features

**Scenario:** Add a wt:hp interaction column manually.

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_6 <- mtcars |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_6 <- mtcars |>
  mutate(wt_hp = wt * hp)

head(ex_5_6 |> select(wt, hp, wt_hp))
```

**Explanation:** For methods that don't handle interactions natively (RF, k-NN), engineer them manually. lm/glm support `*` in formula directly.

</details>

### Exercise 5.7: Impute missing with median

**Scenario:** Fill NAs in airquality with column median.

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_7 <- airquality |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_7 <- airquality |>
  mutate(across(where(is.numeric),
                ~ if_else(is.na(.x), median(.x, na.rm = TRUE), .x)))

sum(is.na(ex_5_7))
```

**Explanation:** Median is more robust to outliers than mean. For tree-based models, you can often skip imputation; rpart and xgboost handle NAs.

</details>

### Exercise 5.8: Recipe-based preprocessing

**Scenario:** Use recipes to define a reusable preprocessing pipeline.

**Difficulty:** Advanced

```r title="Your turn"
ex_5_8 <- recipes::recipe(mpg ~ ., data = mtcars) |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_8 <- recipes::recipe(mpg ~ ., data = mtcars) |>
  recipes::step_normalize(recipes::all_numeric_predictors()) |>
  recipes::step_corr(recipes::all_numeric_predictors(), threshold = 0.9) |>
  recipes::prep()

recipes::bake(ex_5_8, mtcars) |> head()
```

**Explanation:** recipes is the tidymodels preprocessing engine. Each step is named and parameterizable. prep() learns from data; bake() applies. Essential for production workflows.

</details>

## Section 6. End-to-end ML pipelines (8 problems)

### Exercise 6.1: Iris classifier mini-pipeline

**Scenario:** Split, scale, fit kNN, evaluate.

**Difficulty:** Intermediate

```r title="Your turn"
set.seed(1)
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
idx <- caret::createDataPartition(iris$Species, p = 0.7, list = FALSE)
tr <- iris[idx, ]; te <- iris[-idx, ]

# Scale based on training only
mu <- sapply(tr[, 1:4], mean); sg <- sapply(tr[, 1:4], sd)
tr_x <- sweep(sweep(tr[, 1:4], 2, mu), 2, sg, "/")
te_x <- sweep(sweep(te[, 1:4], 2, mu), 2, sg, "/")

pred <- class::knn(tr_x, te_x, tr$Species, k = 5)
mean(pred == te$Species)
```

**Explanation:** Critical: fit scaling on train only, apply same to test. sweep applies a row/column operation.

</details>

### Exercise 6.2: Cross-validated tidymodels workflow

**Scenario:** tidymodels workflow with recipe + lm + 5-fold CV.

**Difficulty:** Advanced

```r title="Your turn"
library(tidymodels)
set.seed(1)
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
library(tidymodels)
set.seed(1)

split <- initial_split(mtcars, prop = 0.7)
tr <- training(split); te <- testing(split)

rec <- recipe(mpg ~ ., data = tr) |>
  step_normalize(all_numeric_predictors())

mod <- linear_reg() |> set_engine("lm")

wf <- workflow() |> add_recipe(rec) |> add_model(mod)

cv_folds <- vfold_cv(tr, v = 5)
results <- fit_resamples(wf, cv_folds, metrics = metric_set(rmse, rsq))

collect_metrics(results)
```

**Explanation:** tidymodels stack: rsample (split), recipes (preprocess), parsnip (model), workflows (combine), tune/yardstick (tune/eval). Modern, composable.

</details>

### Exercise 6.3: Feature importance ranking

**Scenario:** Random forest, then plot variable importance.

**Difficulty:** Intermediate

```r title="Your turn"
set.seed(1)
fit <- randomForest::randomForest(mpg ~ ., data = mtcars, importance = TRUE)
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
fit <- randomForest::randomForest(mpg ~ ., data = mtcars, importance = TRUE)
imp <- as.data.frame(randomForest::importance(fit))
imp$var <- rownames(imp)

ggplot(imp, aes(x = reorder(var, `%IncMSE`), y = `%IncMSE`)) +
  geom_col() +
  coord_flip() +
  labs(title = "RF variable importance", x = NULL)
```

**Explanation:** importance = TRUE enables permutation importance. %IncMSE measures how much CV-MSE rises when a feature is shuffled.

</details>

### Exercise 6.4: Confusion matrix viz

**Scenario:** Visualize confusion matrix as a heatmap.

**Difficulty:** Advanced

```r title="Your turn"
set.seed(1)
fit <- randomForest::randomForest(Species ~ ., data = iris)
pred <- predict(fit)
cm <- table(truth = iris$Species, pred = pred)
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
fit <- randomForest::randomForest(Species ~ ., data = iris)
pred <- predict(fit)
cm <- table(truth = iris$Species, pred = pred)

cm_df <- as.data.frame(cm)
ggplot(cm_df, aes(pred, truth, fill = Freq)) +
  geom_tile() +
  geom_text(aes(label = Freq), color = "white", size = 5) +
  scale_fill_gradient(low = "lightblue", high = "navy")
```

**Explanation:** Tile + text labels. Easy to scan vs raw table.

</details>

### Exercise 6.5: Calibration check for probabilities

**Scenario:** Plot predicted probability vs actual rate in deciles.

**Difficulty:** Advanced

```r title="Your turn"
set.seed(1)
fit <- glm(am ~ mpg + hp + wt, data = mtcars, family = binomial)
prob <- predict(fit, type = "response")
df <- tibble(prob = prob, actual = mtcars$am)
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
fit <- glm(am ~ mpg + hp + wt, data = mtcars, family = binomial)
prob <- predict(fit, type = "response")
df <- tibble(prob = prob, actual = mtcars$am)

calib <- df |>
  mutate(decile = ntile(prob, 10)) |>
  group_by(decile) |>
  summarise(mean_pred = mean(prob), actual_rate = mean(actual))

ggplot(calib, aes(mean_pred, actual_rate)) +
  geom_point() +
  geom_abline(slope = 1, linetype = "dashed")
```

**Explanation:** Well-calibrated model has predicted probability close to actual frequency. Off-diagonal points reveal miscalibration.

</details>

### Exercise 6.6: Compare models with ROC curves

**Scenario:** Plot ROC curves for two models on the same axes.

**Difficulty:** Advanced

```r title="Your turn"
fit1 <- glm(am ~ mpg, data = mtcars, family = binomial)
fit2 <- glm(am ~ mpg + hp + wt, data = mtcars, family = binomial)
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit1 <- glm(am ~ mpg, data = mtcars, family = binomial)
fit2 <- glm(am ~ mpg + hp + wt, data = mtcars, family = binomial)

r1 <- pROC::roc(mtcars$am, predict(fit1, type = "response"))
r2 <- pROC::roc(mtcars$am, predict(fit2, type = "response"))

plot(r1, col = "blue")
plot(r2, col = "red", add = TRUE)
legend("bottomright", legend = c("Simple","Full"), col = c("blue","red"), lty = 1)
```

**Explanation:** ROC curves on same plot reveal which model dominates across thresholds.

</details>

### Exercise 6.7: SHAP-style local explanation (caret)

**Scenario:** Explain a single prediction with feature attribution.

**Difficulty:** Advanced

```r title="Your turn"
set.seed(1)
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
fit <- randomForest::randomForest(mpg ~ wt + hp, data = mtcars)

# DALEX/iml provide model-agnostic SHAP-like explanations
explainer <- DALEX::explain(fit, data = mtcars[, c("wt","hp")], y = mtcars$mpg, verbose = FALSE)
single_obs <- mtcars["Mazda RX4", c("wt","hp")]
DALEX::predict_parts(explainer, single_obs)
```

**Explanation:** DALEX offers model-agnostic local explanations: feature contribution to a single prediction. iml is an alternative.

</details>

### Exercise 6.8: Save and serve a tidymodels workflow

**Scenario:** Train, save, load, predict.

**Difficulty:** Intermediate

```r title="Your turn"
library(tidymodels)
set.seed(1)
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
library(tidymodels)
set.seed(1)

rec <- recipe(mpg ~ ., data = mtcars) |>
  step_normalize(all_numeric_predictors())
mod <- linear_reg() |> set_engine("lm")
wf  <- workflow() |> add_recipe(rec) |> add_model(mod)
fit <- fit(wf, mtcars)

saveRDS(fit, "wf.rds")
loaded <- readRDS("wf.rds")
predict(loaded, new_data = mtcars[1:3, ])
```

**Explanation:** Workflow object is portable (preprocessing + model bundled). Save + load + predict on new data. Production deployment patterns.

</details>

## What to do next

After 50 problems, the ML workflow loop should be second nature. Natural follow-ups:

- **Linear-Regression-Exercises** (shipped) — go deeper on regression diagnostics.
- **Hypothesis-Testing-Exercises** (coming) — statistical foundation.
- **Random-Forest-Exercises**, **XGBoost-Exercises**, **Clustering-Exercises** (coming) — algorithm-specific drills.
- **tidymodels-Exercises** (coming) — modern R ML stack end-to-end.
