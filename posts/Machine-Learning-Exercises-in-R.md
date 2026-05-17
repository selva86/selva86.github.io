---
title: "Machine Learning Exercises in R: 50 Real Practice Problems"
slug: "Machine-Learning-Exercises-in-R"
description: "Practice machine learning in R with 50 hands-on exercises: train/test splits, regression, classification, tuning, feature engineering, and evaluation. Hidden solutions."
keywords: "machine learning exercises in R, ML exercises R, machine learning practice R, R machine learning tutorial, ML practice problems R, random forest exercises R"
mathjax: false
webr: true
date: "2026-05-12"
post_type: "EX"
sidebar_title: "Machine Learning Exercises"
sidebar_order: 107
fr_parent: "R-Tutorial.html"
auto_link_terms: "machine learning exercises in R|ML exercises in R|machine learning practice in R|R machine learning exercises"
auto_link_case_sensitive: false
target_keyword: "machine learning exercises in R"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Machine Learning Exercises in R: 50 Real Practice Problems

<p class="lead">Fifty practice problems that walk you through every stage of a machine learning project in R: splitting data, fitting regression and classification models, resampling, tuning, feature engineering, and judging the result. Each problem has hidden solutions and runnable code.</p>

```r title="Run this once before any exercise"
library(rpart)
library(randomForest)
library(class)
library(e1071)
set.seed(1)
```

## Section 1. Workflow basics (8 problems)

### Exercise 1.1: Build a reproducible 70/30 train-test split

**Task:** A junior analyst onboarding to the team needs a reproducible 70/30 split of the `mtcars` dataset so that two collaborators get identical training rows. Use `set.seed(1)` and `sample()` to pull row indices, then create `mtcars_train` and `mtcars_test`, and save the test frame to `ex_1_1`.

**Expected result:**

```
#> dim(ex_1_1)
#> [1] 10 11
#> head(rownames(ex_1_1), 3)
#> [1] "Cadillac Fleetwood" "Lincoln Continental" "Chrysler Imperial"
```

**Difficulty:** Beginner

[HINTS]
A split is reproducible only if the random number stream is fixed before you draw the row indices; positive indices select the training rows and negative indices select the rest.
Call `set.seed(1)`, then `sample(nrow(mtcars), size = round(0.7 * nrow(mtcars)))` for the indices, and subset with `mtcars[idx, ]` versus `mtcars[-idx, ]`.

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
idx <- sample(nrow(mtcars), size = round(0.7 * nrow(mtcars)))
mtcars_train <- mtcars[idx, ]
mtcars_test  <- mtcars[-idx, ]
ex_1_1 <- mtcars_test
dim(ex_1_1)
#> [1] 10 11
```

**Explanation:** Setting the seed before `sample()` is the only guarantee that two runs (or two analysts) produce the same split. `sample(n, k)` returns `k` unique row indices, so `mtcars[idx, ]` and `mtcars[-idx, ]` partition the rows without overlap. A common mistake is to call `set.seed()` once at the top of a long script and then run interactive snippets out of order, breaking reproducibility.

</details>

### Exercise 1.2: Stratified split of iris that keeps class ratios intact

**Task:** Build a stratified 80/20 split of `iris` so that each `Species` keeps roughly the same proportion of rows in train and test. Split within each species, then row-bind. Save the test frame to `ex_1_2` and confirm the species counts are balanced.

**Expected result:**

```
#> table(ex_1_2$Species)
#>     setosa versicolor  virginica
#>         10         10         10
```

**Difficulty:** Intermediate

[HINTS]
Draw 20 percent of the rows separately inside each species group, then stack the per-group test pieces back together so class ratios survive.
Use `split(iris, iris$Species)` to get per-species frames, `lapply` a sampler over them, and `do.call(rbind, ...)` to recombine.

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
split_one <- function(df) {
  n_test <- round(0.2 * nrow(df))
  df[sample(nrow(df), n_test), ]
}
ex_1_2 <- do.call(rbind, lapply(split(iris, iris$Species), split_one))
table(ex_1_2$Species)
#>     setosa versicolor  virginica
#>         10         10         10
```

**Explanation:** A plain random split can over-sample one class by chance, especially when the minority class is rare. Splitting within each species, then re-combining, preserves the marginal distribution and is the right default for classification. `split()` returns a list keyed by factor level; `do.call(rbind, ...)` glues the pieces back into a data frame.

</details>

### Exercise 1.3: Carve a validation set out of the training data

**Task:** A modeller wants a three-way split: 60 percent train, 20 percent validation, 20 percent test on `mtcars`. The validation set is used to compare candidate models, the test set is touched only once at the end. Produce all three, save the validation frame to `ex_1_3`.

**Expected result:**

```
#> nrow(ex_1_3)
#> [1] 6
```

**Difficulty:** Intermediate

[HINTS]
Shuffle the row order once, then cut that single permutation into three contiguous blocks so no row can land in two splits.
Build `idx <- sample(n)`, compute cut points at `round(0.6 * n)` and `round(0.8 * n)`, and slice `idx` into the three ranges.

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
n <- nrow(mtcars)
idx <- sample(n)
train_end <- round(0.6 * n)
val_end   <- round(0.8 * n)
mt_train <- mtcars[idx[1:train_end], ]
mt_val   <- mtcars[idx[(train_end + 1):val_end], ]
mt_test  <- mtcars[idx[(val_end + 1):n], ]
ex_1_3 <- mt_val
nrow(ex_1_3)
#> [1] 6
```

**Explanation:** A validation set lets you peek at model selection without spending your test budget. The single-shuffle trick (`sample(n)` once, slice three ways) avoids the bug where independent random draws can put the same row in two splits. Holding out a true test set is the practical defence against tuning yourself into an optimistic accuracy number.

</details>

### Exercise 1.4: Convert character columns to factors before modeling

**Task:** Many model functions in R refuse character columns and either error or silently drop them. Build a frame with `Sys.Date`, a character `region` column, and a numeric column, then convert character columns to factors in one pass with `lapply`. Save the cleaned frame to `ex_1_4`.

**Expected result:**

```
#> str(ex_1_4)
#> 'data.frame': 6 obs. of  3 variables:
#>  $ region: Factor w/ 3 levels "east","north",..: 2 2 1 1 3 3
#>  $ x     : num  1 2 3 4 5 6
#>  $ y     : num  10 12 14 16 18 20
```

**Difficulty:** Beginner

[HINTS]
Identify which columns hold text, then convert just those columns in a single sweep rather than one at a time.
Flag character columns with `vapply(raw, is.character, logical(1))` and reassign `raw[chr_cols] <- lapply(raw[chr_cols], factor)`.

```r title="Your turn"
ex_1_4 <- # your code here
str(ex_1_4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
raw <- data.frame(
  region = c("north", "north", "east", "east", "west", "west"),
  x = 1:6,
  y = seq(10, 20, by = 2),
  stringsAsFactors = FALSE
)
chr_cols <- vapply(raw, is.character, logical(1))
raw[chr_cols] <- lapply(raw[chr_cols], factor)
ex_1_4 <- raw
str(ex_1_4)
```

**Explanation:** `vapply()` returns a typed logical vector, so `raw[chr_cols]` selects exactly the character columns. `lapply()` walks each one and replaces it in place via the assignment. Doing the conversion in one pass beats a column-by-column copy: it keeps the data frame intact and avoids subtle bugs where you forget to convert one column.

</details>

### Exercise 1.5: Count and locate missing values before modeling

**Task:** Take `airquality` and produce a one-line summary of how many `NA` values each column carries, sorted from worst to best. Most ML algorithms in base R drop rows with any missing value, so this is the first audit you do before deciding to impute or drop. Save the named integer vector to `ex_1_5`.

**Expected result:**

```
#> ex_1_5
#>   Ozone Solar.R    Wind    Temp   Month     Day
#>      37       7       0       0       0       0
```

**Difficulty:** Beginner

[HINTS]
Missing values coerce to 1 when summed, so a per-column total of the missingness flags gives the NA count, and sorting reorders it.
Combine `colSums(is.na(airquality))` with `sort(..., decreasing = TRUE)`.

```r title="Your turn"
ex_1_5 <- # your code here
ex_1_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_5 <- sort(colSums(is.na(airquality)), decreasing = TRUE)
ex_1_5
#>   Ozone Solar.R    Wind    Temp   Month     Day
#>      37       7       0       0       0       0
```

**Explanation:** `is.na()` returns a logical matrix the same shape as the data; `colSums()` then counts the `TRUE` cells per column because logicals coerce to 0/1. Sorting descending puts the problem columns first. If a column is more than half missing, that's usually a deletion candidate; small gaps are imputed.

</details>

### Exercise 1.6: Baseline regressor that predicts the training mean

**Task:** Before fitting anything fancy, build the simplest possible regressor for `mtcars`: predict `mean(mtcars_train$mpg)` for every test row. This is the score any real model has to beat. Compute predictions and the test RMSE, save the RMSE to `ex_1_6`.

**Expected result:**

```
#> ex_1_6
#> [1] 6.108
```

**Difficulty:** Beginner

[HINTS]
The constant prediction that minimises squared error is the average of the training target; score it against the held-out rows.
Repeat `mean(mt_train$mpg)` across the test rows, then compute `sqrt(mean((mt_test$mpg - preds)^2))`.

```r title="Your turn"
ex_1_6 <- # your code here
ex_1_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
idx <- sample(nrow(mtcars), 0.7 * nrow(mtcars))
mt_train <- mtcars[idx, ]
mt_test  <- mtcars[-idx, ]
baseline <- mean(mt_train$mpg)
preds <- rep(baseline, nrow(mt_test))
ex_1_6 <- sqrt(mean((mt_test$mpg - preds)^2))
round(ex_1_6, 3)
#> [1] 6.108
```

**Explanation:** A naive baseline anchors your interpretation of every later RMSE. If the linear model lands at 3 and the baseline is 6, that's a 50 percent improvement. Without the anchor, "RMSE 3" is meaningless. The mean predictor minimises squared error among constant predictors, which is why it's the default null model for regression.

</details>

### Exercise 1.7: Baseline classifier that predicts the majority class

**Task:** On `iris`, work out the majority class (it's a three-way tie, so any class works as the constant prediction). Predict that constant for every row and compute the classification accuracy. Save the accuracy to `ex_1_7`. This is your null-model floor before any real classifier earns its keep.

**Expected result:**

```
#> ex_1_7
#> [1] 0.3333
```

**Difficulty:** Beginner

[HINTS]
Find the most common class label, predict it for every row, and the accuracy is just the share of rows that already carry that label.
Get the top label from `sort(table(iris$Species), decreasing = TRUE)` and compare it against `as.character(iris$Species)` with `mean()`.

```r title="Your turn"
ex_1_7 <- # your code here
ex_1_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
majority <- names(sort(table(iris$Species), decreasing = TRUE))[1]
preds <- rep(majority, nrow(iris))
ex_1_7 <- mean(preds == as.character(iris$Species))
round(ex_1_7, 4)
#> [1] 0.3333
```

**Explanation:** For balanced multi-class problems the majority-class baseline is `1 / k`, here `1/3`. On an imbalanced dataset (say 95 percent class A), the baseline jumps to 0.95 and headline accuracy stops being informative. That's the moment to switch to precision, recall, or balanced accuracy, all of which we explore in Section 6.

</details>

### Exercise 1.8: Wrap the split-and-evaluate steps into a reusable function

**Task:** Two collaborators keep re-pasting the same split-and-RMSE code into every notebook. Build a function `evaluate_rmse(formula, data, seed)` that splits 70/30, fits an `lm()` on the training portion, and returns the test RMSE. Save the test RMSE for `mpg ~ wt + hp` on `mtcars` to `ex_1_8`.

**Expected result:**

```
#> ex_1_8
#> [1] 3.018
```

**Difficulty:** Intermediate

[HINTS]
Make the helper general by reading the response name out of the formula instead of hardcoding the target column.
Inside the function call `set.seed(seed)`, `sample()` for the split, fit with `lm(formula, ...)`, and pull the response with `all.vars(formula)[1]`.

```r title="Your turn"
evaluate_rmse <- function(formula, data, seed = 1) {
  # your code here
}
ex_1_8 <- evaluate_rmse(mpg ~ wt + hp, mtcars)
ex_1_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
evaluate_rmse <- function(formula, data, seed = 1) {
  set.seed(seed)
  idx <- sample(nrow(data), round(0.7 * nrow(data)))
  fit <- lm(formula, data = data[idx, ])
  y_name <- all.vars(formula)[1]
  preds <- predict(fit, newdata = data[-idx, ])
  sqrt(mean((data[-idx, y_name] - preds)^2))
}
ex_1_8 <- evaluate_rmse(mpg ~ wt + hp, mtcars)
round(ex_1_8, 3)
#> [1] 3.018
```

**Explanation:** Passing the formula in as an argument is what makes the helper general: `all.vars(formula)[1]` pulls the response name so the function can extract `y_test` without hardcoding `mpg`. The same skeleton extends to other model families by swapping `lm` for `rpart` or `randomForest`. Once you have this helper, comparing five models is five one-liners.

</details>

## Section 2. Regression algorithms (8 problems)

### Exercise 2.1: Multiple linear regression with two predictors on mtcars

**Task:** Fit `mpg ~ wt + hp` on `mtcars` with `lm()` and inspect the coefficients. The fitted model is the simplest regression baseline that gets used in nearly every real workflow. Save the fitted model object to `ex_2_1` and print the coefficients to confirm both predictors have negative slopes.

**Expected result:**

```
#> coef(ex_2_1)
#> (Intercept)          wt          hp
#>     37.2273     -3.8778     -0.0318
```

**Difficulty:** Beginner

[HINTS]
A two-predictor linear model is one model-fitting call; the coefficients then come straight off the fitted object.
Assign `lm(mpg ~ wt + hp, data = mtcars)` and read it with `coef()`.

```r title="Your turn"
ex_2_1 <- # your code here
coef(ex_2_1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- lm(mpg ~ wt + hp, data = mtcars)
round(coef(ex_2_1), 4)
#> (Intercept)          wt          hp
#>     37.2273     -3.8778     -0.0318
```

**Explanation:** Each coefficient is the change in `mpg` for a one-unit increase in that predictor while holding the other fixed. Negative slopes for `wt` and `hp` match the physical intuition: heavier and more powerful cars use more fuel. `lm()` solves the normal equations under the hood; for problems with multicollinearity or huge `p`, ridge or lasso are safer.

</details>

### Exercise 2.2: Add an interaction term and read the coefficients

**Task:** Some modellers suspect the wt-mpg relationship changes with cylinder count. Fit `mpg ~ wt * factor(cyl)` on `mtcars` and read the four wt-related coefficients to see how the slope shifts across 4, 6, and 8 cylinder cars. Save the fitted model to `ex_2_2`.

**Expected result:**

```
#> coef(ex_2_2)
#>     (Intercept)              wt    factor(cyl)6    factor(cyl)8 wt:factor(cyl)6 wt:factor(cyl)8
#>          39.571          -5.647         -11.162         -15.703           2.867           3.455
```

**Difficulty:** Intermediate

[HINTS]
The `*` in a formula expands to both main effects and their interaction, and wrapping cylinder count makes it categorical rather than numeric.
Fit `lm(mpg ~ wt * factor(cyl), data = mtcars)`.

```r title="Your turn"
ex_2_2 <- # your code here
coef(ex_2_2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- lm(mpg ~ wt * factor(cyl), data = mtcars)
round(coef(ex_2_2), 3)
```

**Explanation:** The base slope `-5.647` is the wt effect for the reference level (4 cylinders). The interaction terms `wt:factor(cyl)6` and `wt:factor(cyl)8` add to that base slope, so 8-cylinder cars actually have a less steep wt-mpg relationship (-5.647 + 3.455 = -2.192). The `factor()` wrapper is what stops R from treating `cyl` as a number and forces it to be a categorical predictor.

</details>

### Exercise 2.3: Polynomial regression captures a curved relationship

**Task:** The mpg-wt relationship isn't perfectly linear. Fit a degree-2 polynomial of weight with `poly(wt, 2)` and compare its in-sample R-squared against the linear `mpg ~ wt`. A practitioner uses polynomials when residuals show a clear pattern. Save the fitted polynomial model to `ex_2_3`.

**Expected result:**

```
#> summary(ex_2_3)$r.squared
#> [1] 0.8191
```

**Difficulty:** Intermediate

[HINTS]
A curved fit needs a quadratic basis for weight rather than the raw column alone.
Fit `lm(mpg ~ poly(wt, 2), data = mtcars)` and read `summary(...)$r.squared`.

```r title="Your turn"
ex_2_3 <- # your code here
summary(ex_2_3)$r.squared
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- lm(mpg ~ poly(wt, 2), data = mtcars)
round(summary(ex_2_3)$r.squared, 4)
#> [1] 0.8191
```

**Explanation:** `poly(wt, 2)` builds orthogonal polynomial basis columns, which is numerically safer than raw `wt + I(wt^2)` when degrees climb. The R-squared jumps from about 0.75 (linear) to 0.82, a real improvement. The risk: high-degree polynomials overfit, so always validate on a holdout or via cross-validation before deploying.

</details>

### Exercise 2.4: Decision tree regression with rpart

**Task:** Fit a regression tree for `mpg ~ wt + hp + cyl + disp` on `mtcars` using `rpart()`. Trees are non-parametric and handle non-linearities and interactions automatically, which is why they're often the second model a practitioner tries after `lm`. Save the fitted tree to `ex_2_4`.

**Expected result:**

```
#> print(ex_2_4)
#> n= 32
#>
#> node), split, n, deviance, yval
#>       * denotes terminal node
#>
#> 1) root 32 1126 20.09
#>   2) cyl>=5 21  198 16.65 *
#>   3) cyl< 5 11  204 26.66 *
```

**Difficulty:** Intermediate

[HINTS]
A regression tree is fit much like a linear model but recursively partitions the predictor space instead of fitting a global slope.
Call `rpart(mpg ~ wt + hp + cyl + disp, data = mtcars, method = "anova")`.

```r title="Your turn"
ex_2_4 <- # your code here
print(ex_2_4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_4 <- rpart(mpg ~ wt + hp + cyl + disp, data = mtcars, method = "anova")
print(ex_2_4)
```

**Explanation:** With default complexity parameter the tree often stops at a single split, here on `cyl`. That's expected: `rpart` prunes aggressively by default to avoid overfitting on the small 32-row mtcars dataset. Drop the complexity parameter via `control = rpart.control(cp = 0.01)` to grow a bushier tree. Trees split on the variable that most reduces residual variance at each node.

</details>

### Exercise 2.5: Grow a bushier tree and inspect splits via printcp

**Task:** The default-pruned tree from Exercise 2.4 was almost a stump. Refit with `cp = 0.001` to allow more splits, then call `printcp()` to see how cross-validated error changes with tree size. The output guides where to prune. Save the cp table (a matrix) to `ex_2_5`.

**Expected result:**

```
#> ex_2_5
#>           CP nsplit rel error xerror   xstd
#> [1,] 0.6431      0    1.0000  1.0712 0.2535
#> [2,] 0.1530      1    0.3569  0.5421 0.1326
#> [3,] 0.0140      2    0.2039  0.3744 0.1186
#> [4,] 0.0010      3    0.1899  0.3686 0.1183
```

**Difficulty:** Intermediate

[HINTS]
Lowering the complexity threshold lets the tree keep splitting, and the resulting model carries its own cross-validated error table.
Pass `control = rpart.control(cp = 0.001)` to `rpart`, then extract `fit$cptable`.

```r title="Your turn"
ex_2_5 <- # your code here
ex_2_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
fit <- rpart(mpg ~ wt + hp + cyl + disp, data = mtcars,
             control = rpart.control(cp = 0.001))
ex_2_5 <- fit$cptable
round(ex_2_5, 4)
```

**Explanation:** `xerror` is the cross-validated relative error and `xstd` is its standard deviation. The "1-SE rule" says pick the smallest tree within one `xstd` of the minimum `xerror`; that's typically more robust than picking the absolute minimum. Pruning back to that point reduces variance without giving up much accuracy.

</details>

### Exercise 2.6: Random forest regression on mtcars

**Task:** A modeller wants an ensemble that averages many trees to reduce variance. Fit `randomForest(mpg ~ ., data = mtcars)` with 500 trees and the default `mtry`. Random forests trade interpretability for accuracy, and they're the workhorse default for tabular problems. Save the fitted forest to `ex_2_6`.

**Expected result:**

```
#> print(ex_2_6)
#> Call:
#>  randomForest(formula = mpg ~ ., data = mtcars, ntree = 500)
#>                Type of random forest: regression
#>                      Number of trees: 500
#> No. of variables tried at each split: 3
#>
#>           Mean of squared residuals: 5.7
#>                     % Var explained: 84
```

**Difficulty:** Intermediate

[HINTS]
An averaging ensemble is one fitting call; the dot on the right of the formula means use every other column as a predictor.
Call `randomForest(mpg ~ ., data = mtcars, ntree = 500)` after `set.seed(1)`.

```r title="Your turn"
set.seed(1)
ex_2_6 <- # your code here
print(ex_2_6)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
ex_2_6 <- randomForest(mpg ~ ., data = mtcars, ntree = 500)
print(ex_2_6)
```

**Explanation:** Each tree sees a bootstrap sample of rows and a random subset of `mtry` predictors at each split, which decorrelates the trees and lets averaging cut variance. The reported "Mean of squared residuals" is the out-of-bag error: each row is scored only by trees that didn't see it during training, so OOB stands in for a free validation set.

</details>

### Exercise 2.7: Variable importance from the random forest

**Task:** Use the fitted forest from Exercise 2.6 (or refit it) and pull variable importance with `importance()`. Importance ranks predictors by how much OOB error rises when their values are permuted, which is a model-agnostic way to read a black-box ensemble. Save the importance matrix to `ex_2_7`.

**Expected result:**

```
#> round(ex_2_7, 1)
#>      IncNodePurity
#> cyl          181.0
#> disp         224.4
#> hp           179.5
#> drat          70.7
#> wt           257.0
#> qsec          26.4
#> vs            34.5
#> am            32.5
#> gear          18.4
#> carb          37.3
```

**Difficulty:** Intermediate

[HINTS]
Once a forest is fitted, predictor rankings are read directly off it rather than recomputed by hand.
Fit the forest, then call `importance(fit)`.

```r title="Your turn"
ex_2_7 <- # your code here
round(ex_2_7, 1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
fit <- randomForest(mpg ~ ., data = mtcars, ntree = 500)
ex_2_7 <- importance(fit)
round(ex_2_7, 1)
```

**Explanation:** With default settings `randomForest` reports node-purity decrease, which is the total drop in sum-of-squares across all splits using that variable. Pass `importance = TRUE` at fit time to also get the permutation-based `%IncMSE`, which is generally the more honest metric because it isn't biased toward high-cardinality predictors.

</details>

### Exercise 2.8: Compare RMSE on a holdout across three regressors

**Task:** A reporting analyst needs a one-table comparison of `lm`, `rpart`, and `randomForest` on `mtcars`. Split 70/30 with `set.seed(1)`, fit all three on the training set, score on the holdout, and compute test RMSE for each. Save a named numeric vector of RMSEs to `ex_2_8`.

**Expected result:**

```
#> round(ex_2_8, 3)
#>           lm        rpart randomForest
#>        3.018        3.451        2.484
```

**Difficulty:** Advanced

[HINTS]
Train all three models on the same training rows and score each one on the identical holdout so the comparison is fair.
Fit `lm`, `rpart`, and `randomForest` on `tr`, then build a named vector of `sqrt(mean((y - predict(...))^2))` for each.

```r title="Your turn"
set.seed(1)
ex_2_8 <- # your code here
round(ex_2_8, 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
idx <- sample(nrow(mtcars), round(0.7 * nrow(mtcars)))
tr <- mtcars[idx, ]; te <- mtcars[-idx, ]
m_lm <- lm(mpg ~ wt + hp, data = tr)
m_rp <- rpart(mpg ~ wt + hp, data = tr)
m_rf <- randomForest(mpg ~ wt + hp, data = tr, ntree = 500)
rmse <- function(p, y) sqrt(mean((y - p)^2))
ex_2_8 <- c(
  lm           = rmse(predict(m_lm, te), te$mpg),
  rpart        = rmse(predict(m_rp, te), te$mpg),
  randomForest = rmse(predict(m_rf, te), te$mpg)
)
round(ex_2_8, 3)
```

**Explanation:** On this tiny 32-row dataset the random forest wins, but the gap shrinks (and `lm` often wins) when predictors are mostly linear. The general rule: pick the simplest model that meets your accuracy bar. A one-line `lm` is easier to debug, ship, and explain than a forest, and the bar to switch models should be a clear improvement on a real holdout.

</details>

## Section 3. Classification algorithms (10 problems)

### Exercise 3.1: Binary logistic regression on a mtcars-derived target

**Task:** Engineer a binary target: `am` is already 0/1 in `mtcars` (automatic vs manual). Fit a logistic regression `am ~ mpg + wt + hp` with `glm(family = binomial)` and inspect the coefficients. Logistic regression is the linear baseline for two-class problems. Save the fitted model to `ex_3_1`.

**Expected result:**

```
#> coef(ex_3_1)
#> (Intercept)         mpg          wt          hp
#>      36.499      -0.180      -8.838       0.039
```

**Difficulty:** Intermediate

[HINTS]
A two-class linear baseline is fit by a generalised linear model with the logit link rather than ordinary least squares.
Call `glm(am ~ mpg + wt + hp, data = mtcars, family = binomial)`.

```r title="Your turn"
ex_3_1 <- # your code here
round(coef(ex_3_1), 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- glm(am ~ mpg + wt + hp, data = mtcars, family = binomial)
round(coef(ex_3_1), 3)
```

**Explanation:** Coefficients are log-odds, not probabilities. `exp(coef)` turns them into odds ratios: a one-unit drop in `wt` multiplies the odds of being a manual transmission by `exp(8.838)`, which is enormous. Big coefficients on a 32-row dataset are a warning sign of near-perfect separation; on real data you'd want regularisation or more rows before trusting the standard errors.

</details>

### Exercise 3.2: Decision boundary as predicted probability

**Task:** Using the logistic fit from Exercise 3.1, generate predicted probabilities for every row of `mtcars` with `predict(type = "response")`. Then map them to a 0/1 class label using a 0.5 threshold and count how many predictions match the true `am` value. Save the named vector of predicted probabilities to `ex_3_2`.

**Expected result:**

```
#> head(round(ex_3_2, 3), 5)
#>         Mazda RX4     Mazda RX4 Wag        Datsun 710    Hornet 4 Drive Hornet Sportabout
#>             0.964             0.964             0.967             0.005             0.001
```

**Difficulty:** Intermediate

[HINTS]
The fitted model returns scores on the probability scale only when you ask for the response scale, not the default link scale.
Call `predict(fit, type = "response")` and threshold with `ifelse(... > 0.5, 1, 0)`.

```r title="Your turn"
ex_3_2 <- # your code here
head(round(ex_3_2, 3), 5)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- glm(am ~ mpg + wt + hp, data = mtcars, family = binomial)
ex_3_2 <- predict(fit, type = "response")
preds <- ifelse(ex_3_2 > 0.5, 1, 0)
mean(preds == mtcars$am)
#> [1] 0.9375
```

**Explanation:** `type = "response"` returns probabilities in `[0, 1]`. Without it you get log-odds. The 0.5 threshold is arbitrary and tuned later in Exercise 3.10. For imbalanced classes or asymmetric costs (a missed fraud is worse than a false alarm), shift the threshold to trade precision against recall.

</details>

### Exercise 3.3: kNN classifier on iris using class::knn

**Task:** Build a kNN classifier on `iris`. Split 80/20, then call `class::knn()` with `k = 5` to predict the test species using the four numeric predictors. kNN is a zero-training-time baseline that's surprisingly strong on small, well-scaled datasets. Save the factor of predicted species to `ex_3_3`.

**Expected result:**

```
#> table(ex_3_3, iris[-tr_idx, "Species"])
#>             setosa versicolor virginica
#>   setosa         10          0         0
#>   versicolor      0         10         1
#>   virginica       0          0         9
```

**Difficulty:** Intermediate

[HINTS]
kNN has no training step; you hand the labelled training rows and the unlabelled test rows to the classifier together.
After splitting, call `class::knn(train = X_tr, test = X_te, cl = y_tr, k = 5)`.

```r title="Your turn"
set.seed(1)
ex_3_3 <- # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
tr_idx <- sample(nrow(iris), 0.8 * nrow(iris))
X_tr <- iris[tr_idx, 1:4]; X_te <- iris[-tr_idx, 1:4]
y_tr <- iris$Species[tr_idx]
ex_3_3 <- class::knn(train = X_tr, test = X_te, cl = y_tr, k = 5)
table(ex_3_3, iris[-tr_idx, "Species"])
```

**Explanation:** kNN votes among the `k` closest training points by Euclidean distance, so feature scale matters. `iris` is already on a comparable scale; on real data you'd standardise first with `scale()`. The trade-off in `k`: small `k` overfits (noisy boundary), large `k` underfits (smooths over class boundaries). Tune `k` via cross-validation in the next exercise.

</details>

### Exercise 3.4: Choose k for kNN via validation accuracy

**Task:** Try `k` from 1 to 15 and record validation accuracy for each value using the same iris split from Exercise 3.3. The best `k` is the one with the highest validation accuracy, but you usually break ties with the larger `k` to favour smoother boundaries. Save the named numeric vector of accuracies to `ex_3_4`.

**Expected result:**

```
#> round(ex_3_4, 3)
#>     1     2     3     4     5     6     7     8     9    10    11    12    13    14    15
#> 0.967 0.967 0.967 0.967 0.967 0.967 0.967 0.967 0.967 0.967 0.967 0.933 0.933 0.933 0.933
```

**Difficulty:** Advanced

[HINTS]
Loop the neighbour count over a range and record how often the prediction matches the held-out label at each value.
Use `sapply(1:15, function(k) mean(class::knn(...) == y_te))` and name the result with the k values.

```r title="Your turn"
set.seed(1)
ex_3_4 <- # your code here
round(ex_3_4, 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
tr_idx <- sample(nrow(iris), 0.8 * nrow(iris))
X_tr <- iris[tr_idx, 1:4]; X_te <- iris[-tr_idx, 1:4]
y_tr <- iris$Species[tr_idx]; y_te <- iris$Species[-tr_idx]
ks <- 1:15
acc <- sapply(ks, function(k) {
  pred <- class::knn(X_tr, X_te, cl = y_tr, k = k)
  mean(pred == y_te)
})
names(acc) <- ks
ex_3_4 <- acc
round(ex_3_4, 3)
```

**Explanation:** Iris is easy enough that many `k` values tie. On a harder dataset you'd see a U-shape: error falls then rises as `k` grows past the optimum. Picking `k` from a holdout is fine for one shot, but cross-validation (Section 4) gives a less noisy estimate. Re-running the search on a different seed quickly tells you whether the chosen `k` is robust.

</details>

### Exercise 3.5: Naive Bayes classifier with e1071

**Task:** Fit a naive Bayes classifier on `iris` predicting `Species` from the four numeric features. Naive Bayes assumes features are conditionally independent given the class. It's a fast, low-variance baseline that works surprisingly well when training data is scarce. Save the fitted model to `ex_3_5`.

**Expected result:**

```
#> ex_3_5
#>
#> Naive Bayes Classifier for Discrete Predictors
#>
#> Call:
#> naiveBayes.default(x = X, y = Y, laplace = laplace)
#>
#> A-priori probabilities:
#> Y
#>     setosa versicolor  virginica
#>  0.3333333  0.3333333  0.3333333
```

**Difficulty:** Intermediate

[HINTS]
A naive Bayes classifier is a single fitting call using the standard formula interface.
Call `e1071::naiveBayes(Species ~ ., data = iris)`.

```r title="Your turn"
ex_3_5 <- # your code here
ex_3_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_5 <- e1071::naiveBayes(Species ~ ., data = iris)
ex_3_5
```

**Explanation:** Naive Bayes estimates `P(feature | class)` separately per class. For numeric features it uses a Gaussian by default, parameterised by per-class mean and variance. The independence assumption is almost always wrong, yet the classifier still ranks classes well because mis-specification cancels out across features. Great for text and high-cardinality categorical data.

</details>

### Exercise 3.6: Decision tree classifier on iris

**Task:** Fit a classification tree `Species ~ .` on `iris` with `rpart()` and method `"class"`. Decision trees are interpretable: you can read the splits as rules. Save the fitted tree to `ex_3_6` and print it to confirm the model splits on `Petal.Length` and `Petal.Width`, the two most informative features.

**Expected result:**

```
#> print(ex_3_6)
#> n= 150
#>
#> node), split, n, loss, yval, (yprob)
#>       * denotes terminal node
#>
#> 1) root 150 100 setosa (0.333 0.333 0.333)
#>   2) Petal.Length< 2.45 50   0 setosa (1.000 0.000 0.000) *
#>   3) Petal.Length>=2.45 100 50 versicolor (0.000 0.500 0.500)
#>     6) Petal.Width< 1.75 54   5 versicolor (0.000 0.907 0.093) *
#>     7) Petal.Width>=1.75 46   1 virginica (0.000 0.022 0.978) *
```

**Difficulty:** Intermediate

[HINTS]
The same tree-fitting routine does classification when you tell it the target is categorical rather than continuous.
Call `rpart(Species ~ ., data = iris, method = "class")`.

```r title="Your turn"
ex_3_6 <- # your code here
print(ex_3_6)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_6 <- rpart(Species ~ ., data = iris, method = "class")
print(ex_3_6)
```

**Explanation:** Trees pick the split that maximises information gain (Gini by default) at each node. On `iris` two splits separate the three species with only 6 mistakes. The misclassification loss `100` at the root drops to `0 + 5 + 1 = 6` total across leaves, which is the empirical training error. Test accuracy is usually lower; always score on a holdout.

</details>

### Exercise 3.7: Random forest classifier on iris

**Task:** Fit `randomForest(Species ~ ., data = iris)` with 500 trees. Random forests are the default ensemble for classification: they handle multi-class, missing values, and feature interactions without much tuning. Save the fitted classifier to `ex_3_7` and confirm the OOB confusion matrix.

**Expected result:**

```
#> ex_3_7$confusion
#>            setosa versicolor virginica class.error
#> setosa         50          0         0        0.00
#> versicolor      0         47         3        0.06
#> virginica       0          4        46        0.08
```

**Difficulty:** Intermediate

[HINTS]
A multi-class ensemble is one fitting call; its built-in confusion matrix comes from rows each tree never saw.
Call `randomForest(Species ~ ., data = iris, ntree = 500)` after `set.seed(1)`.

```r title="Your turn"
set.seed(1)
ex_3_7 <- # your code here
ex_3_7$confusion
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
ex_3_7 <- randomForest(Species ~ ., data = iris, ntree = 500)
ex_3_7$confusion
```

**Explanation:** The confusion matrix here is built from out-of-bag predictions, so it estimates generalisation error without a separate test set. About 5 percent of versicolor and virginica rows are confused with each other, which matches the known overlap between those species on petal measurements. Class error per row is a quick way to spot which class is hardest.

</details>

### Exercise 3.8: Predict class probabilities, not just labels

**Task:** Many downstream tools need a probability not a hard label: ranking customers by churn risk, picking a threshold, calibrating. Use the iris forest from Exercise 3.7 and `predict(type = "prob")` to get a probability matrix. Save the first 6 rows of that matrix to `ex_3_8`.

**Expected result:**

```
#> ex_3_8
#>   setosa versicolor virginica
#> 1  1.000      0.000     0.000
#> 2  1.000      0.000     0.000
#> 3  1.000      0.000     0.000
#> 4  1.000      0.000     0.000
#> 5  1.000      0.000     0.000
#> 6  1.000      0.000     0.000
```

**Difficulty:** Intermediate

[HINTS]
Ask the forest for per-class scores instead of hard labels, then keep only the opening rows of that matrix.
Call `predict(fit, type = "prob")` and `head(..., 6)`.

```r title="Your turn"
set.seed(1)
ex_3_8 <- # your code here
ex_3_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
fit <- randomForest(Species ~ ., data = iris, ntree = 500)
probs <- predict(fit, type = "prob")
ex_3_8 <- head(probs, 6)
round(ex_3_8, 3)
```

**Explanation:** For random forests, the class probability is the fraction of trees that voted for each class. Rows in the easy `setosa` region get unanimous 1.000 estimates; rows near the versicolor / virginica boundary spread their probability mass across both. A practitioner uses these probabilities for threshold tuning, cost-sensitive decisions, or building a stacked ensemble downstream.

</details>

### Exercise 3.9: Build a confusion matrix from scratch

**Task:** Without using `caret::confusionMatrix`, build a 2x2 confusion matrix for the logistic predictions from Exercise 3.2: predicted positive vs predicted negative crossed with actual positive vs actual negative on `mtcars$am`. Save the 2x2 table to `ex_3_9`.

**Expected result:**

```
#> ex_3_9
#>          actual
#> predicted  0  1
#>         0 18  1
#>         1  1 12
```

**Difficulty:** Beginner

[HINTS]
Cross-tabulate the predicted label against the true label; the diagonal counts the correct calls.
Threshold the probabilities to 0/1, then `table(predicted = preds, actual = mtcars$am)`.

```r title="Your turn"
ex_3_9 <- # your code here
ex_3_9
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- glm(am ~ mpg + wt + hp, data = mtcars, family = binomial)
probs <- predict(fit, type = "response")
preds <- ifelse(probs > 0.5, 1, 0)
ex_3_9 <- table(predicted = preds, actual = mtcars$am)
ex_3_9
```

**Explanation:** A confusion matrix lays the foundation for accuracy, precision, recall, and F1. The diagonal counts correct predictions; off-diagonal cells are the two error types. Naming the dimensions (`predicted`, `actual`) keeps the orientation clear so you don't accidentally swap rows and columns and report transposed metrics. Many production bugs trace back to this exact mix-up.

</details>

### Exercise 3.10: Tune the decision threshold to maximise F1

**Task:** A fraud team prefers high recall to high precision. Sweep the threshold from 0.05 to 0.95 in steps of 0.05 on the logistic-regression probabilities from Exercise 3.2, compute F1 at each threshold, and pick the best. F1 balances precision and recall in one score. Save the named numeric vector of F1 values to `ex_3_10`.

**Expected result:**

```
#> round(ex_3_10, 3)
#>  0.05   0.1  0.15   0.2  0.25   0.3  0.35   0.4  0.45   0.5  0.55   0.6  0.65   0.7
#> 0.812 0.812 0.875 0.875 0.875 0.875 0.875 0.917 0.917 0.923 0.923 0.917 0.917 0.917
#>  0.75   0.8  0.85   0.9  0.95
#> 0.870 0.870 0.870 0.778 0.500
```

**Difficulty:** Advanced

[HINTS]
Walk a grid of cut points, turn probabilities into labels at each one, and score the precision-recall balance.
Build `seq(0.05, 0.95, by = 0.05)`, and `sapply` an F1 helper (counting TP, FP, FN) over it.

```r title="Your turn"
ex_3_10 <- # your code here
round(ex_3_10, 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- glm(am ~ mpg + wt + hp, data = mtcars, family = binomial)
probs <- predict(fit, type = "response")
f1_at <- function(t) {
  preds <- ifelse(probs > t, 1, 0)
  tp <- sum(preds == 1 & mtcars$am == 1)
  fp <- sum(preds == 1 & mtcars$am == 0)
  fn <- sum(preds == 0 & mtcars$am == 1)
  prec <- tp / (tp + fp); rec <- tp / (tp + fn)
  2 * prec * rec / (prec + rec)
}
ts <- seq(0.05, 0.95, by = 0.05)
ex_3_10 <- sapply(ts, f1_at)
names(ex_3_10) <- ts
round(ex_3_10, 3)
```

**Explanation:** F1 is the harmonic mean of precision and recall: it punishes the case where one metric is high and the other low. Sweeping the threshold and picking the F1-maximising point is a standard tuning move for imbalanced binary problems. For asymmetric cost matrices (say, missing a fraud is 10x worse than a false alarm), use weighted F1 or expected cost instead.

</details>

## Section 4. Resampling and tuning (8 problems)

### Exercise 4.1: 5-fold cross-validation written by hand

**Task:** A statistician wants to estimate the test RMSE of `lm(mpg ~ wt + hp, data = mtcars)` more reliably than a single holdout. Write a 5-fold CV by hand: shuffle row indices, split into 5 groups, fit on 4 and score on the held-out one. Save the mean fold RMSE to `ex_4_1`.

**Expected result:**

```
#> ex_4_1
#> [1] 2.612
```

**Difficulty:** Advanced

[HINTS]
Assign each row a fold label, then loop the folds so every row is scored exactly once by a model that did not see it.
Build fold labels with `sample(rep(1:5, length.out = nrow(mtcars)))`, loop fitting `lm` on `folds != k` and scoring on `folds == k`.

```r title="Your turn"
set.seed(1)
ex_4_1 <- # your code here
round(ex_4_1, 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
folds <- sample(rep(1:5, length.out = nrow(mtcars)))
rmses <- numeric(5)
for (k in 1:5) {
  tr <- mtcars[folds != k, ]; te <- mtcars[folds == k, ]
  fit <- lm(mpg ~ wt + hp, data = tr)
  rmses[k] <- sqrt(mean((te$mpg - predict(fit, te))^2))
}
ex_4_1 <- mean(rmses)
round(ex_4_1, 3)
#> [1] 2.612
```

**Explanation:** Writing the CV loop yourself is the most reliable way to understand exactly which rows the model sees at each step. Many bugs come from accidentally leaking the response into preprocessing. `sample(rep(1:k, length.out = n))` is the idiomatic way to assign each row a fold label uniformly at random. The mean of the fold RMSEs is your CV-RMSE estimate.

</details>

### Exercise 4.2: 10-fold cross-validation reusing the same skeleton

**Task:** Generalise the 5-fold loop from Exercise 4.1 into a function `cv_rmse(formula, data, k, seed)` that runs k-fold CV for any formula and returns the mean fold RMSE. Test it on `mpg ~ wt + hp + cyl` with k = 10. Save the mean fold RMSE to `ex_4_2`.

**Expected result:**

```
#> ex_4_2
#> [1] 2.728
```

**Difficulty:** Intermediate

[HINTS]
Wrap the fold loop in a function and read the response name from the formula so it works for any model.
Inside `cv_rmse`, build `folds` with `sample(rep(1:k, length.out = nrow(data)))` and pull the target with `all.vars(formula)[1]`.

```r title="Your turn"
cv_rmse <- function(formula, data, k = 10, seed = 1) {
  # your code here
}
ex_4_2 <- cv_rmse(mpg ~ wt + hp + cyl, mtcars, k = 10)
round(ex_4_2, 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
cv_rmse <- function(formula, data, k = 10, seed = 1) {
  set.seed(seed)
  folds <- sample(rep(1:k, length.out = nrow(data)))
  y_name <- all.vars(formula)[1]
  rmses <- numeric(k)
  for (j in 1:k) {
    tr <- data[folds != j, ]; te <- data[folds == j, ]
    fit <- lm(formula, data = tr)
    rmses[j] <- sqrt(mean((te[[y_name]] - predict(fit, te))^2))
  }
  mean(rmses)
}
ex_4_2 <- cv_rmse(mpg ~ wt + hp + cyl, mtcars, k = 10)
round(ex_4_2, 3)
```

**Explanation:** Wrapping CV into a function is the move that lets you compare many models on the same folds. With small datasets like `mtcars`, 10-fold or even leave-one-out CV gives a less noisy RMSE estimate than 5-fold, at the cost of more compute. For larger data, 5-fold is usually enough and runs in a fifth of the time.

</details>

### Exercise 4.3: Repeated k-fold CV to reduce estimation variance

**Task:** A single 5-fold CV depends on the random fold assignment. Run 10 repetitions of 5-fold CV on `mpg ~ wt + hp` with seeds 1 through 10 and average the 50 fold RMSEs. Save the mean of all 50 fold RMSEs to `ex_4_3`. Repeated CV is the go-to when sample size is small and variance matters.

**Expected result:**

```
#> ex_4_3
#> [1] 2.738
```

**Difficulty:** Advanced

[HINTS]
Re-run the whole fold procedure under several different seeds and pool every fold error before averaging.
Write a one-seed CV function and `unlist(lapply(1:10, cv_one))`, then take `mean()`.

```r title="Your turn"
ex_4_3 <- # your code here
round(ex_4_3, 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
cv_one <- function(seed) {
  set.seed(seed)
  folds <- sample(rep(1:5, length.out = nrow(mtcars)))
  sapply(1:5, function(k) {
    tr <- mtcars[folds != k, ]; te <- mtcars[folds == k, ]
    fit <- lm(mpg ~ wt + hp, data = tr)
    sqrt(mean((te$mpg - predict(fit, te))^2))
  })
}
all_rmses <- unlist(lapply(1:10, cv_one))
ex_4_3 <- mean(all_rmses)
round(ex_4_3, 3)
```

**Explanation:** Each repetition gives one CV estimate; averaging across repetitions cuts the variance contributed by the random fold assignment. You'll see a tighter confidence interval around the mean. Don't confuse repeated CV with nested CV: repeated CV smooths the same level, nested CV avoids leakage when you also tune hyperparameters.

</details>

### Exercise 4.4: Leave-one-out cross-validation on a small dataset

**Task:** When the dataset is small, leave-one-out CV uses n folds of size 1 to squeeze every drop of information out. Run LOOCV on `lm(mpg ~ wt + hp, data = mtcars)` and save the RMSE to `ex_4_4`. Bonus check: see how close it is to the analytic shortcut using residuals divided by `1 - h_ii`.

**Expected result:**

```
#> ex_4_4
#> [1] 2.628
```

**Difficulty:** Advanced

[HINTS]
With one row held out at a time, refit on everything else and record that single row's prediction error.
Loop `i` over `1:nrow(mtcars)`, fit `lm` on `mtcars[-i, ]`, predict `mtcars[i, , drop = FALSE]`, then `sqrt(mean(errs^2))`.

```r title="Your turn"
ex_4_4 <- # your code here
round(ex_4_4, 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
n <- nrow(mtcars)
errs <- numeric(n)
for (i in 1:n) {
  fit <- lm(mpg ~ wt + hp, data = mtcars[-i, ])
  errs[i] <- mtcars$mpg[i] - predict(fit, mtcars[i, , drop = FALSE])
}
ex_4_4 <- sqrt(mean(errs^2))
round(ex_4_4, 3)
```

**Explanation:** LOOCV has very low bias because each fit sees almost all the training data, but it has higher variance because the n estimates are highly correlated. For OLS there's a closed-form shortcut using leverage `h_ii` that avoids n separate refits: PRESS = sum of `(resid_i / (1 - h_ii))^2`. For other model families, you do the n refits.

</details>

### Exercise 4.5: Bootstrap resampling to estimate model variance

**Task:** A risk team wants a confidence interval around the slope of `wt` in `lm(mpg ~ wt, data = mtcars)`. Draw 1000 bootstrap samples (with replacement), refit the model on each, and collect the wt coefficients. Save the 1000 bootstrap slope estimates to `ex_4_5`. The interval comes from the 2.5 and 97.5 percentiles.

**Expected result:**

```
#> quantile(ex_4_5, c(0.025, 0.975))
#>      2.5%     97.5%
#>   -6.6052   -4.4108
```

**Difficulty:** Advanced

[HINTS]
Resample the rows with replacement many times, refit on each resample, and keep the one coefficient you care about.
Loop 1000 times drawing `sample(nrow(mtcars), replace = TRUE)`, refit `lm(mpg ~ wt, ...)`, and store `coef(...)["wt"]`.

```r title="Your turn"
set.seed(1)
ex_4_5 <- # your code here
quantile(ex_4_5, c(0.025, 0.975))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
B <- 1000
slopes <- numeric(B)
for (b in 1:B) {
  idx <- sample(nrow(mtcars), replace = TRUE)
  slopes[b] <- coef(lm(mpg ~ wt, data = mtcars[idx, ]))["wt"]
}
ex_4_5 <- slopes
round(quantile(ex_4_5, c(0.025, 0.975)), 4)
```

**Explanation:** The bootstrap simulates draws from the population by sampling rows with replacement. The empirical 2.5 to 97.5 percentile range is the percentile confidence interval. This works without assuming a particular sampling distribution for the estimator, which is the whole point: when residuals aren't normal or the model isn't standard, the bootstrap is still valid.

</details>

### Exercise 4.6: Grid search over rpart complexity parameter

**Task:** Tune the `cp` knob of `rpart` for `mpg ~ wt + hp + cyl + disp` on `mtcars`. Try `cp` in `c(0.001, 0.005, 0.01, 0.05, 0.1)`, score each tree via 5-fold CV RMSE, and pick the winner. Save the named numeric vector of CV RMSEs (one per cp) to `ex_4_6`.

**Expected result:**

```
#> round(ex_4_6, 3)
#> 0.001 0.005  0.01  0.05   0.1
#> 3.428 3.428 3.428 3.428 3.428
```

**Difficulty:** Advanced

[HINTS]
For each candidate complexity value, run a full cross-validation and record its mean error so the grid points are comparable.
Loop the cp grid, fitting `rpart` with `control = rpart.control(cp = cp_val)` inside a 5-fold loop, and name the result by cp.

```r title="Your turn"
set.seed(1)
ex_4_6 <- # your code here
round(ex_4_6, 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
folds <- sample(rep(1:5, length.out = nrow(mtcars)))
cps <- c(0.001, 0.005, 0.01, 0.05, 0.1)
cv_for <- function(cp_val) {
  rmses <- numeric(5)
  for (k in 1:5) {
    tr <- mtcars[folds != k, ]; te <- mtcars[folds == k, ]
    fit <- rpart(mpg ~ wt + hp + cyl + disp, data = tr,
                 control = rpart.control(cp = cp_val))
    rmses[k] <- sqrt(mean((te$mpg - predict(fit, te))^2))
  }
  mean(rmses)
}
ex_4_6 <- sapply(cps, cv_for)
names(ex_4_6) <- cps
round(ex_4_6, 3)
```

**Explanation:** With only 32 rows, `rpart` keeps prefering a stump regardless of the `cp` knob, so all grid points tie. On bigger datasets you'd see a U-shape: tiny `cp` overfits, huge `cp` underfits, and the minimum CV RMSE is the practical choice. Always pair grid search with CV, not a single holdout, when the dataset is small.

</details>

### Exercise 4.7: Tune mtry for random forest via OOB error

**Task:** Random forests have one main knob: `mtry`, the number of predictors sampled at each split. Try `mtry` from 2 to 6 on `randomForest(mpg ~ ., data = mtcars)` and record the OOB MSE for each. The OOB error is a no-cost stand-in for CV here. Save the named numeric vector of OOB MSEs to `ex_4_7`.

**Expected result:**

```
#> round(ex_4_7, 3)
#>     2     3     4     5     6
#> 5.962 5.700 5.553 5.452 5.500
```

**Difficulty:** Advanced

[HINTS]
Refit the forest once per candidate split-width and read its out-of-bag error rather than building a separate validation set.
`sapply` over `2:6`, fitting `randomForest(mpg ~ ., data = mtcars, mtry = m, ntree = 500)` and taking `mean(rf$mse)`.

```r title="Your turn"
set.seed(1)
ex_4_7 <- # your code here
round(ex_4_7, 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
mtrys <- 2:6
fit_one <- function(m) {
  rf <- randomForest(mpg ~ ., data = mtcars, mtry = m, ntree = 500)
  mean(rf$mse)
}
ex_4_7 <- sapply(mtrys, fit_one)
names(ex_4_7) <- mtrys
round(ex_4_7, 3)
```

**Explanation:** Larger `mtry` lets trees be greedier on each split, which can lower bias but increase variance because trees end up more correlated. The default `mtry = floor(p/3)` for regression is usually a strong starting point, and tuning it rarely moves OOB error by more than a few percent. Tune only if the default is clearly off.

</details>

### Exercise 4.8: Learning curve to diagnose bias vs variance

**Task:** Build a learning curve for `lm(mpg ~ wt + hp, data = mtcars)`: train on 50, 60, 70, 80, 90 percent of the data and record training and validation RMSE at each step. The gap diagnoses bias vs variance. Save a 5-by-2 matrix (train, val) named by training fraction to `ex_4_8`.

**Expected result:**

```
#> round(ex_4_8, 3)
#>      train   val
#> 0.5  2.211 3.243
#> 0.6  2.297 3.118
#> 0.7  2.385 3.018
#> 0.8  2.464 2.952
#> 0.9  2.546 2.901
```

**Difficulty:** Advanced

[HINTS]
At each training-set size, score the model both on the rows it learned from and on the rows it did not, and store the pair.
Loop the fractions, `sample()` that share of rows, fit `lm(mpg ~ wt + hp, ...)`, and fill a named two-column matrix.

```r title="Your turn"
set.seed(1)
ex_4_8 <- # your code here
round(ex_4_8, 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
fracs <- c(0.5, 0.6, 0.7, 0.8, 0.9)
out <- matrix(NA, nrow = length(fracs), ncol = 2,
              dimnames = list(fracs, c("train", "val")))
for (i in seq_along(fracs)) {
  idx <- sample(nrow(mtcars), round(fracs[i] * nrow(mtcars)))
  tr <- mtcars[idx, ]; te <- mtcars[-idx, ]
  fit <- lm(mpg ~ wt + hp, data = tr)
  out[i, "train"] <- sqrt(mean((tr$mpg - predict(fit, tr))^2))
  out[i, "val"]   <- sqrt(mean((te$mpg - predict(fit, te))^2))
}
ex_4_8 <- out
round(ex_4_8, 3)
```

**Explanation:** Two error curves on one plot tell you a lot. A large train-val gap that doesn't close with more data is high variance: regularise, simplify, or get more training rows. A train error that's already high is high bias: the model is underfit, swap in a more flexible family. The shape of the curves is the diagnostic, not any one number.

</details>

## Section 5. Feature engineering and preprocessing (8 problems)

### Exercise 5.1: One-hot encode a factor with model.matrix

**Task:** Many ML algorithms expect numeric input. Take `mtcars` and add a factor column `cyl_f <- factor(cyl)`, then use `model.matrix(~ cyl_f - 1, data = mtcars)` to expand it into one-hot columns. Save the resulting numeric matrix (first 6 rows) to `ex_5_1`.

**Expected result:**

```
#> ex_5_1
#>                   cyl_f4 cyl_f6 cyl_f8
#> Mazda RX4              0      1      0
#> Mazda RX4 Wag          0      1      0
#> Datsun 710             1      0      0
#> Hornet 4 Drive         0      1      0
#> Hornet Sportabout      0      0      1
#> Valiant                0      1      0
```

**Difficulty:** Beginner

[HINTS]
Turn the categorical column into one indicator column per level, dropping the intercept so no level is treated as a baseline.
Add `factor(cyl)`, call `model.matrix(~ cyl_f - 1, data = mt)`, and `head(..., 6)`.

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mt <- mtcars
mt$cyl_f <- factor(mt$cyl)
M <- model.matrix(~ cyl_f - 1, data = mt)
ex_5_1 <- head(M, 6)
ex_5_1
```

**Explanation:** Dropping the intercept via `- 1` produces k columns instead of `k - 1`, which is what you want when you feed the matrix to a tree-based model or kNN. For `lm` you usually keep the intercept and accept the reference-level encoding, since collinear columns wreck OLS. The choice depends on what consumes the matrix downstream.

</details>

### Exercise 5.2: Standardize numeric predictors before kNN

**Task:** kNN computes Euclidean distance, so a feature on a scale of 1000 dominates a feature on a scale of 0.1. Use `scale()` to standardise the four numeric columns of `iris`, then confirm each column has mean 0 and standard deviation 1. Save the standardised matrix (first 6 rows) to `ex_5_2`.

**Expected result:**

```
#> round(ex_5_2, 3)
#>   Sepal.Length Sepal.Width Petal.Length Petal.Width
#> 1       -0.898       1.019       -1.336      -1.311
#> 2       -1.139      -0.132       -1.336      -1.311
#> 3       -1.381       0.328       -1.392      -1.311
#> 4       -1.501       0.098       -1.279      -1.311
#> 5       -1.018       1.249       -1.336      -1.311
#> 6       -0.535       1.939       -1.166      -1.049
```

**Difficulty:** Beginner

[HINTS]
Re-express each numeric column in standard-deviation units so no feature dominates a distance calculation.
Apply `scale(iris[, 1:4])` and keep `head(..., 6)`.

```r title="Your turn"
ex_5_2 <- # your code here
round(ex_5_2, 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
X <- scale(iris[, 1:4])
ex_5_2 <- head(X, 6)
round(ex_5_2, 3)
colMeans(X); apply(X, 2, sd)
#> means near 0, sd near 1
```

**Explanation:** `scale(x)` subtracts the column mean and divides by the column SD. The result is unitless, so kNN and clustering algorithms treat all features fairly. The catch in real pipelines: compute mean and SD on the training set only, then apply the same shift and scale to the test set. Otherwise you leak test information through the standardisation step.

</details>

### Exercise 5.3: Median-impute missing values for a numeric column

**Task:** `airquality` has 37 missing values in `Ozone`. Build a copy of the dataset where `NA` Ozone values are filled with the training-set median of Ozone. This is the simplest imputation that gets used everywhere in real pipelines. Save the imputed Ozone column to `ex_5_3` and confirm zero NAs.

**Expected result:**

```
#> sum(is.na(ex_5_3))
#> [1] 0
#> summary(ex_5_3)
#>    Min. 1st Qu.  Median    Mean 3rd Qu.    Max.
#>    1.00   21.00   31.50   38.99   46.00  168.00
```

**Difficulty:** Beginner

[HINTS]
Fill each missing entry with the column's typical central value, computed while ignoring the gaps themselves.
Compute `median(oz, na.rm = TRUE)` and assign it into `oz[is.na(oz)]`.

```r title="Your turn"
ex_5_3 <- # your code here
sum(is.na(ex_5_3))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
oz <- airquality$Ozone
med <- median(oz, na.rm = TRUE)
oz[is.na(oz)] <- med
ex_5_3 <- oz
sum(is.na(ex_5_3))
#> [1] 0
summary(ex_5_3)
```

**Explanation:** Median imputation is robust to outliers and preserves the central tendency; mean imputation distorts the distribution when there are skewed values. For more sophisticated work, use multivariate imputation (mice) or model-based imputation (missForest). Always compute the imputation statistic on training data and apply it to test, or you'll leak.

</details>

### Exercise 5.4: Mode-impute a categorical column

**Task:** Build a synthetic dataset with a character column `region` and a few `NA` values, then replace missing entries with the most frequent (mode) category. Numeric medians don't work for categorical data, so you need the mode. Save the imputed factor vector to `ex_5_4`.

**Expected result:**

```
#> table(ex_5_4)
#> ex_5_4
#> east  north  west
#>    2     6     2
```

**Difficulty:** Intermediate

[HINTS]
For a text column the stand-in for a missing value is the most frequent category, not an average.
Take the top name from `sort(table(regions), decreasing = TRUE)`, assign it into `regions[is.na(regions)]`, then `factor()`.

```r title="Your turn"
regions <- c("north", "north", NA, "east", "north", "west", "west", NA, "north", "north")
ex_5_4 <- # your code here
table(ex_5_4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
regions <- c("north", "north", NA, "east", "north", "west", "west", NA, "north", "north")
mode_val <- names(sort(table(regions), decreasing = TRUE))[1]
regions[is.na(regions)] <- mode_val
ex_5_4 <- factor(regions)
table(ex_5_4)
```

**Explanation:** `table()` counts the non-NA levels; sorting by count and taking the top name gives the mode. Mode imputation is the categorical equivalent of median imputation, but it concentrates mass on the majority class. If the missingness isn't random (say, the questionnaire skipped a follow-up for low-engagement users), mode imputation can bias downstream models toward that pattern.

</details>

### Exercise 5.5: Drop near-zero variance columns

**Task:** Predictors that barely vary contribute nothing to the model and slow it down. Build a small frame with one constant column, one near-constant column, and two real predictors. Drop columns whose standard deviation is below 0.05 times the column mean. Save the cleaned data frame to `ex_5_5`.

**Expected result:**

```
#> str(ex_5_5)
#> 'data.frame': 6 obs. of  2 variables:
#>  $ real1: num  1 2 3 4 5 6
#>  $ real2: num  10 12 14 16 18 20
```

**Difficulty:** Intermediate

[HINTS]
Score each column by how much it varies relative to its own level, and keep only the ones that clear the threshold.
Compute `sd(x) / mean(x)` per column with `vapply`, then subset `df[, keep, drop = FALSE]`.

```r title="Your turn"
df <- data.frame(
  constant   = rep(5, 6),
  near_const = c(5, 5, 5, 5, 5, 5.001),
  real1      = 1:6,
  real2      = seq(10, 20, by = 2)
)
ex_5_5 <- # your code here
str(ex_5_5)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
df <- data.frame(
  constant   = rep(5, 6),
  near_const = c(5, 5, 5, 5, 5, 5.001),
  real1      = 1:6,
  real2      = seq(10, 20, by = 2)
)
cv <- function(x) sd(x) / mean(x)
keep <- vapply(df, function(x) cv(x) > 0.05, logical(1))
ex_5_5 <- df[, keep, drop = FALSE]
str(ex_5_5)
```

**Explanation:** Coefficient of variation (`sd / mean`) is a scale-free way to spot uninformative columns. Pure constant columns make `lm` refuse to estimate a coefficient (NA) and break some algorithms outright. Near-zero variance columns rarely help and often inflate variance estimates because the small denominator amplifies noise.

</details>

### Exercise 5.6: Prune highly correlated predictors

**Task:** Highly correlated predictors hurt linear models (unstable coefficients) and slow down tree ensembles for no gain. From `mtcars[, c("wt", "disp", "hp", "cyl", "mpg")]`, drop any predictor that has correlation above 0.85 with another retained predictor. Save the pruned matrix to `ex_5_6`.

**Expected result:**

```
#> colnames(ex_5_6)
#> [1] "wt"  "hp"  "mpg"
```

**Difficulty:** Advanced

[HINTS]
Repeatedly find the most correlated pair and drop whichever member is more entangled with the rest until nothing exceeds the limit.
In a `repeat` loop, take `abs(cor(...))`, zero the diagonal, and drop the column with the higher `colMeans` until `max` is at or below 0.85.

```r title="Your turn"
ex_5_6 <- # your code here
colnames(ex_5_6)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
X <- mtcars[, c("wt", "disp", "hp", "cyl", "mpg")]
keep <- colnames(X)
repeat {
  C <- abs(cor(X[, keep]))
  diag(C) <- 0
  if (max(C) <= 0.85) break
  worst <- which(C == max(C), arr.ind = TRUE)[1, ]
  # drop the column with higher mean correlation
  means <- colMeans(C)
  drop_name <- names(which.max(means[keep[worst]]))
  keep <- setdiff(keep, drop_name)
}
ex_5_6 <- X[, keep]
colnames(ex_5_6)
```

**Explanation:** The iterative greedy prune drops the predictor with the highest average correlation to remaining columns at each step. It's the same approach `caret::findCorrelation` uses. An alternative is to keep all predictors but use a regularised model (ridge), which handles collinearity without losing variables. Pruning is preferred when interpretability or runtime matters.

</details>

### Exercise 5.7: Log-transform a right-skewed predictor

**Task:** `diamonds$price` is right-skewed: most diamonds are cheap, a few are expensive. Linear models perform better when target and predictors are roughly symmetric. Apply `log1p()` to `price` on a 1000-row sample of `diamonds` and compare skewness before and after via the third moment formula. Save the log-prices to `ex_5_7`.

**Expected result:**

```
#> length(ex_5_7); range(ex_5_7)
#> [1] 1000
#> [1] 5.886 9.834
```

**Difficulty:** Intermediate

[HINTS]
A skew-reducing transform compresses the long right tail; apply it to a random subset of the rows.
Sample 1000 rows of `diamonds`, then apply `log1p()` to the `price` column.

```r title="Your turn"
set.seed(1)
ex_5_7 <- # your code here
length(ex_5_7); range(ex_5_7)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
samp <- diamonds[sample(nrow(diamonds), 1000), ]
ex_5_7 <- log1p(samp$price)
length(ex_5_7); round(range(ex_5_7), 3)
skew <- function(x) mean((x - mean(x))^3) / sd(x)^3
skew(samp$price); skew(ex_5_7)
#> raw skew about 1.6, log skew about 0.5
```

**Explanation:** `log1p(x) = log(x + 1)` is numerically safer than `log(x)` when zeros are possible. After the transform, a linear model fits the geometric mean rather than the arithmetic mean of `price`, and the residuals are usually closer to homoscedastic. Predict on the log scale, then back-transform with `expm1()` to report dollar predictions.

</details>

### Exercise 5.8: Build interaction features manually

**Task:** Sometimes you want explicit interaction columns rather than relying on the modelling function to expand `:`. Add three columns to `mtcars`: `wt_hp = wt * hp`, `wt_cyl = wt * cyl`, and `hp_cyl = hp * cyl`. These are common feature crosses for vehicle datasets. Save the enriched 35-column data frame to `ex_5_8`.

**Expected result:**

```
#> dim(ex_5_8); tail(colnames(ex_5_8), 3)
#> [1] 32 14
#> [1] "wt_hp"  "wt_cyl" "hp_cyl"
```

**Difficulty:** Intermediate

[HINTS]
Create explicit product columns by multiplying pairs of existing predictors together.
Add `mt$wt_hp <- mt$wt * mt$hp` and the analogous `wt_cyl` and `hp_cyl` columns.

```r title="Your turn"
ex_5_8 <- # your code here
dim(ex_5_8); tail(colnames(ex_5_8), 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mt <- mtcars
mt$wt_hp  <- mt$wt * mt$hp
mt$wt_cyl <- mt$wt * mt$cyl
mt$hp_cyl <- mt$hp * mt$cyl
ex_5_8 <- mt
dim(ex_5_8); tail(colnames(ex_5_8), 3)
```

**Explanation:** Pre-computing interactions makes the resulting frame portable across model families: trees, kNN, and any model that doesn't understand R formulae can use them directly. The downside is feature-set sprawl: three columns becomes nine for a 4-way frame, and 21 columns for a 7-way one. Tools like `model.matrix(~ .^2)` automate two-way interactions when you want all of them at once.

</details>

## Section 6. Evaluation and diagnostics (8 problems)

### Exercise 6.1: Compute RMSE and MAE side by side

**Task:** A reporting analyst wants both root mean squared error and mean absolute error for the same fitted model on `mtcars`. RMSE punishes large errors more, MAE is more robust to outliers. Fit `lm(mpg ~ wt + hp)`, score on the full data, and save a named vector `c(RMSE, MAE)` to `ex_6_1`.

**Expected result:**

```
#> round(ex_6_1, 3)
#>  RMSE   MAE
#> 2.473 1.879
```

**Difficulty:** Beginner

[HINTS]
Both metrics start from the same residual vector; one squares the errors, the other takes their absolute size.
From `err <- mtcars$mpg - predict(fit)`, build `c(RMSE = sqrt(mean(err^2)), MAE = mean(abs(err)))`.

```r title="Your turn"
ex_6_1 <- # your code here
round(ex_6_1, 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- lm(mpg ~ wt + hp, data = mtcars)
err <- mtcars$mpg - predict(fit)
ex_6_1 <- c(RMSE = sqrt(mean(err^2)), MAE = mean(abs(err)))
round(ex_6_1, 3)
```

**Explanation:** RMSE > MAE always, and the gap widens when errors are heavy-tailed. If your business cares more about avoiding big misses than small ones, optimise RMSE; if all errors cost the same regardless of size, use MAE. The choice should match the cost function in the real world, not be picked because one is more familiar.

</details>

### Exercise 6.2: Compute R-squared from scratch

**Task:** Many practitioners read R-squared off `summary(lm)` but don't remember the formula. Compute it manually: `1 - SS_res / SS_tot`, where `SS_res = sum((y - y_hat)^2)` and `SS_tot = sum((y - mean(y))^2)`. Save the manual R-squared to `ex_6_2` and confirm it matches `summary(fit)$r.squared`.

**Expected result:**

```
#> ex_6_2
#> [1] 0.8268
```

**Difficulty:** Beginner

[HINTS]
Compare the model's leftover squared error against the squared error of just predicting the overall average.
Compute `ss_res` as `sum((y - predict(fit))^2)`, `ss_tot` as `sum((y - mean(y))^2)`, then `1 - ss_res / ss_tot`.

```r title="Your turn"
ex_6_2 <- # your code here
round(ex_6_2, 4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- lm(mpg ~ wt + hp, data = mtcars)
ss_res <- sum((mtcars$mpg - predict(fit))^2)
ss_tot <- sum((mtcars$mpg - mean(mtcars$mpg))^2)
ex_6_2 <- 1 - ss_res / ss_tot
round(ex_6_2, 4)
#> [1] 0.8268
summary(fit)$r.squared
#> matches
```

**Explanation:** R-squared is the fraction of variance the model explains relative to the mean-only baseline. It's bounded by 1 from above but unbounded below: on a holdout, you can easily get negative R-squared if your model is worse than predicting the train mean. That's the standard sanity check for whether a model is actually adding value.

</details>

### Exercise 6.3: Accuracy and error rate for a classifier

**Task:** Compute classification accuracy and the complementary error rate for the iris random forest from Exercise 3.7 on the OOB predictions. Many teams report just accuracy; reporting both makes the imbalance obvious. Save a named vector `c(accuracy, error)` to `ex_6_3`.

**Expected result:**

```
#> round(ex_6_3, 4)
#> accuracy    error
#>   0.9533   0.0467
```

**Difficulty:** Beginner

[HINTS]
Accuracy is the share of out-of-bag predictions that match the truth, and the error rate is simply its complement.
Compare `fit$predicted` against `iris$Species` with `mean()`, then form `c(accuracy = acc, error = 1 - acc)`.

```r title="Your turn"
set.seed(1)
ex_6_3 <- # your code here
round(ex_6_3, 4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
fit <- randomForest(Species ~ ., data = iris, ntree = 500)
preds <- fit$predicted
acc <- mean(preds == iris$Species)
ex_6_3 <- c(accuracy = acc, error = 1 - acc)
round(ex_6_3, 4)
```

**Explanation:** OOB accuracy is the random-forest specific equivalent of CV accuracy. Each tree votes only for rows it didn't see during training. On balanced data accuracy is fine; on a 95/5 split, a constant majority predictor scores 0.95 and accuracy stops being informative. Then you switch to precision-recall (Exercise 6.4) or balanced accuracy.

</details>

### Exercise 6.4: Precision, recall, and F1 from a confusion matrix

**Task:** From the 2x2 confusion matrix you built in Exercise 3.9, compute precision, recall, and F1 for the positive class (`am = 1`). Precision = TP / (TP + FP), recall = TP / (TP + FN). Save a named numeric vector with all three metrics to `ex_6_4`.

**Expected result:**

```
#> round(ex_6_4, 3)
#> precision    recall        F1
#>     0.923     0.923     0.923
```

**Difficulty:** Intermediate

[HINTS]
Count the three relevant cells - true positives, false positives, false negatives - then plug them into the standard ratios.
Compute `tp`, `fp`, `fn` with logical `sum()`s, derive precision and recall, and set `F1 = 2 * prec * rec / (prec + rec)`.

```r title="Your turn"
ex_6_4 <- # your code here
round(ex_6_4, 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- glm(am ~ mpg + wt + hp, data = mtcars, family = binomial)
preds <- ifelse(predict(fit, type = "response") > 0.5, 1, 0)
tp <- sum(preds == 1 & mtcars$am == 1)
fp <- sum(preds == 1 & mtcars$am == 0)
fn <- sum(preds == 0 & mtcars$am == 1)
prec <- tp / (tp + fp)
rec  <- tp / (tp + fn)
ex_6_4 <- c(precision = prec, recall = rec, F1 = 2 * prec * rec / (prec + rec))
round(ex_6_4, 3)
```

**Explanation:** Precision answers: of the rows I called positive, how many really are? Recall answers: of all the real positives, how many did I catch? F1 mashes them into one number via the harmonic mean. For a fraud team, recall matters most. For a marketing team that pays per outreach, precision matters most. Pick the metric your stakeholder actually cares about.

</details>

### Exercise 6.5: ROC AUC implemented from probabilities

**Task:** AUC is the probability that a randomly chosen positive scores higher than a randomly chosen negative. Compute it for the logistic predictions on `mtcars$am` by ranking the predicted probabilities and using the Mann-Whitney equivalence. Save the AUC scalar to `ex_6_5`.

**Expected result:**

```
#> ex_6_5
#> [1] 0.9947
```

**Difficulty:** Advanced

[HINTS]
AUC equals the rank-based chance that a positive outscores a negative, so work from the ranks of the predicted scores.
Rank the probabilities with `rank()`, sum the positives' ranks, subtract `n_pos * (n_pos + 1) / 2`, and divide by `n_pos * n_neg`.

```r title="Your turn"
ex_6_5 <- # your code here
round(ex_6_5, 4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- glm(am ~ mpg + wt + hp, data = mtcars, family = binomial)
probs <- predict(fit, type = "response")
y <- mtcars$am
r <- rank(probs)
n_pos <- sum(y == 1); n_neg <- sum(y == 0)
ex_6_5 <- (sum(r[y == 1]) - n_pos * (n_pos + 1) / 2) / (n_pos * n_neg)
round(ex_6_5, 4)
#> [1] 0.9947
```

**Explanation:** The formula uses the link between AUC and the Mann-Whitney U statistic: rank the probabilities, sum the ranks of positives, subtract the expected sum if positives were tied at the bottom, then normalise by the maximum possible. AUC = 0.5 means no skill, 1.0 means perfect separation. It doesn't depend on the threshold, which is why ROC AUC is preferred over accuracy for tuning probabilistic classifiers.

</details>

### Exercise 6.6: Compare stratified vs simple random split impact

**Task:** A bias-spotting exercise. Build a 95/5 imbalanced dataset (95 zeros and 5 ones), then do 50 simple random 80/20 splits and 50 stratified 80/20 splits. Count how many of the simple splits put zero ones in the test set. Save that count to `ex_6_6`. The bigger the count, the more you need stratification.

**Expected result:**

```
#> ex_6_6
#> [1] 22
```

**Difficulty:** Advanced

[HINTS]
Repeatedly draw a plain random test set from the imbalanced labels and tally how often it captures none of the rare class.
Loop 50 times, draw `sample(seq_along(y), 0.2 * length(y))`, and increment a counter when `sum(y[idx] == 1) == 0`.

```r title="Your turn"
set.seed(1)
ex_6_6 <- # your code here
ex_6_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
y <- c(rep(0, 95), rep(1, 5))
empty_test <- 0
for (i in 1:50) {
  idx <- sample(seq_along(y), 0.2 * length(y))
  if (sum(y[idx] == 1) == 0) empty_test <- empty_test + 1
}
ex_6_6 <- empty_test
ex_6_6
```

**Explanation:** With only 5 positives, simple random sampling routinely lands a test set with zero positives, making downstream metrics meaningless or undefined (recall divided by zero positives). Stratified sampling guarantees at least one positive in each split as long as the test fraction times the positive count is at least one. This is non-negotiable on real fraud, churn, or rare-disease datasets.

</details>

### Exercise 6.7: Calibration check via predicted-probability bins

**Task:** A model can be accurate yet miscalibrated: among rows it gives a 0.7 score, the true positive rate might be 0.4. Bin logistic predictions on `mtcars$am` into 5 quantile bins and compare bin mean prediction vs bin observed rate. Save the data frame of bin means to `ex_6_7`.

**Expected result:**

```
#> ex_6_7
#>     mean_pred mean_obs
#> 20%     0.000    0.000
#> 40%     0.000    0.000
#> 60%     0.142    0.333
#> 80%     0.972    0.857
#> 100%    1.000    1.000
```

**Difficulty:** Advanced

[HINTS]
Group rows by where their predicted score falls, then within each group compare the average prediction to the average actual outcome.
Cut probabilities at `quantile(probs, seq(0, 1, by = 0.2))`, then `aggregate` the predictions and the target by bin with `mean`.

```r title="Your turn"
ex_6_7 <- # your code here
ex_6_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- glm(am ~ mpg + wt + hp, data = mtcars, family = binomial)
probs <- predict(fit, type = "response")
bin <- cut(probs, breaks = quantile(probs, probs = seq(0, 1, by = 0.2)),
           include.lowest = TRUE, labels = c("20%", "40%", "60%", "80%", "100%"))
agg <- aggregate(cbind(probs, mtcars$am), by = list(bin = bin), mean)
ex_6_7 <- setNames(data.frame(round(agg$probs, 3), round(agg$V2, 3)),
                   c("mean_pred", "mean_obs"))
rownames(ex_6_7) <- agg$bin
ex_6_7
```

**Explanation:** If a model is well-calibrated, mean_pred should track mean_obs along the identity line. Deviations tell you where the model lies: a row predicting 0.95 when the bin observed rate is 0.6 is over-confident. Calibration is fixed post-hoc via isotonic or Platt scaling, which doesn't change rankings (so AUC stays) but realigns probabilities to observed rates.

</details>

### Exercise 6.8: Residual diagnostics for a fitted lm

**Task:** A code reviewer wants four standard residual checks for `lm(mpg ~ wt + hp, data = mtcars)`: mean of residuals (should be near zero), sd of residuals, max absolute residual, and correlation between fitted values and residuals (should be near zero by construction). Save a named numeric vector with all four to `ex_6_8`.

**Expected result:**

```
#> round(ex_6_8, 4)
#>     mean_resid    sd_resid    max_abs_resid  cor_fit_resid
#>         0.0000      2.4252           5.0410         0.0000
```

**Difficulty:** Intermediate

[HINTS]
Pull the residuals and fitted values off the model, then summarise their centre, spread, extreme, and mutual association.
From `resid(fit)` and `fitted(fit)`, build `c(mean_resid = mean(res), sd_resid = sd(res), max_abs_resid = max(abs(res)), cor_fit_resid = cor(fits, res))`.

```r title="Your turn"
ex_6_8 <- # your code here
round(ex_6_8, 4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- lm(mpg ~ wt + hp, data = mtcars)
res <- resid(fit); fits <- fitted(fit)
ex_6_8 <- c(
  mean_resid    = mean(res),
  sd_resid      = sd(res),
  max_abs_resid = max(abs(res)),
  cor_fit_resid = cor(fits, res)
)
round(ex_6_8, 4)
```

**Explanation:** OLS forces mean(residuals) = 0 and cor(fitted, residuals) = 0 algebraically, so deviations are signs of numerical issues, not modelling problems. The sd of residuals tells you the typical error scale; the max absolute residual flags outliers. To diagnose non-linearity or heteroscedasticity, plot residuals against each predictor and look for patterns, not just summary statistics.

</details>

## What to do next

- [Linear Regression Exercises in R](Linear-Regression-Exercises-in-R.html): 50 problems focused on the regression layer, including ridge, lasso, and diagnostic plots.
- [EDA Exercises in R](EDA-Exercises-in-R.html): clean and explore data before you ever fit a model.
- [Apply Family Exercises in R](Apply-Family-Exercises-in-R.html): the `sapply`, `lapply`, `vapply` patterns that power most of the code in this hub.
- [Data Wrangling Exercises in R](Data-Wrangling-Exercises-in-R.html): the `dplyr` and `tidyr` moves needed to shape any dataset before it's model-ready.
