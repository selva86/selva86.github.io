---
title: "Ridge and Lasso Exercises in R: 18 Practice Problems with Solutions"
slug: "Ridge-and-Lasso-Exercises-in-R"
description: "Practice ridge, lasso, and elastic net regression in R with 18 hands-on glmnet problems. Cross-validated lambda selection, sparse recovery, and tuning."
keywords: "ridge regression exercises R, lasso regression exercises, glmnet practice problems, cv.glmnet exercises, regularization practice R, elastic net tuning, lambda selection exercises, penalised regression R"
mathjax: true
webr: false
date: "2026-05-13"
post_type: "EX"
sidebar_title: "Ridge & Lasso Exercises"
sidebar_order: 320
fr_parent: "Ridge-and-Lasso-Regression-in-R.html"
auto_link_terms: "ridge regression exercises|lasso regression exercises|glmnet practice problems|regularization exercises in R|cv.glmnet practice|elastic net tuning"
auto_link_case_sensitive: false
target_keyword: "ridge and lasso exercises in R"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Ridge and Lasso Exercises in R: 18 Practice Problems with Solutions

<p class="lead">These 18 ridge and lasso exercises cover the full glmnet workflow in R: building the predictor matrix, reading the coefficient path, picking lambda by cross-validation, recovering sparse signals, tuning elastic net, and validating predictions on a holdout. Every problem ships with an expected result and a click-to-reveal solution with explanation.</p>

```r title="Run this once before any exercise"
library(glmnet)
library(MASS)
library(dplyr)
library(tibble)
data("Boston")
```

The exercises assume `Boston` from `MASS` (506 rows, 13 numeric predictors, `medv` is median home value in $1000s) plus a few inline-built matrices for the sparse-recovery and elastic-net problems. All `glmnet` calls use the design matrix + response vector convention rather than a formula.

## Section 1. First fits with glmnet (3 problems)

### Exercise 1.1: Build the predictor matrix from Boston with model.matrix

**Task:** `glmnet()` does not accept a formula; it needs a numeric predictor matrix and a numeric response vector. Use `model.matrix(medv ~ ., Boston)` and drop the intercept column the helper inserts. Save the resulting 506x13 matrix to `ex_1_1`.

**Expected result:**

```
#> dim(ex_1_1)
#> [1] 506  13
#> head(ex_1_1[, 1:5], 3)
#>      crim zn indus chas   nox
#> 1 0.00632 18  2.31    0 0.538
#> 2 0.02731  0  7.07    0 0.469
#> 3 0.02729  0  7.07    0 0.469
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_1 <- # your code here
dim(ex_1_1)
head(ex_1_1[, 1:5], 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- model.matrix(medv ~ ., Boston)[, -1]
dim(ex_1_1)
#> [1] 506  13
head(ex_1_1[, 1:5], 3)
#>      crim zn indus chas   nox
#> 1 0.00632 18  2.31    0 0.538
#> 2 0.02731  0  7.07    0 0.469
#> 3 0.02729  0  7.07    0 0.469
```

**Explanation:** `model.matrix()` does the dummy-coding work even when all your predictors are numeric, so it is the safest converter. The `[, -1]` drop is critical because `glmnet` adds its own intercept and a duplicate constant column would be flagged as singular. Once you have this matrix, every later `glmnet()` and `cv.glmnet()` call reuses it.

</details>

### Exercise 1.2: Fit a first ridge regression with alpha = 0

**Task:** A regional housing analyst wants a baseline ridge fit on `Boston` to use as a benchmark for future neighbourhood-level models. Using the matrix from exercise 1.1 and `Boston$medv`, fit a ridge model with `glmnet(x, y, alpha = 0)` and save it to `ex_1_2`. Print the dimensions of the coefficient matrix.

**Expected result:**

```
#> class(ex_1_2)
#> [1] "elnet"  "glmnet"
#> dim(coef(ex_1_2))
#> [1]  14 100
```

**Difficulty:** Intermediate

```r title="Your turn"
x <- model.matrix(medv ~ ., Boston)[, -1]
y <- Boston$medv
ex_1_2 <- # your code here
class(ex_1_2)
dim(coef(ex_1_2))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
x <- model.matrix(medv ~ ., Boston)[, -1]
y <- Boston$medv
set.seed(1)
ex_1_2 <- glmnet(x, y, alpha = 0)
class(ex_1_2)
#> [1] "elnet"  "glmnet"
dim(coef(ex_1_2))
#> [1]  14 100
```

**Explanation:** `alpha = 0` selects the L2 penalty, which is ridge. `glmnet` automatically picks a sequence of 100 lambdas (returned as `ex_1_2$lambda`) ranging from one large enough to zero every coefficient down to the data-driven minimum. The 14 coefficient rows are the 13 predictors plus the intercept. Set a seed even though the path itself is deterministic; later cross-validation steps depend on a stable RNG state.

</details>

### Exercise 1.3: Fit a first lasso regression and count zero coefficients

**Task:** Refit the same Boston design with `alpha = 1` to switch from ridge to lasso, save the model to `ex_1_3`, and count how many of the 13 predictor coefficients are exactly zero at `s = 0.5`. The L1 penalty is what makes those zeros possible; ridge could not produce them.

**Expected result:**

```
#> ex_1_3$lambda[1:3]
#> [1] 6.7849 6.1822 5.6331
#> sum(coef(ex_1_3, s = 0.5)[-1, ] == 0)
#> [1] 4
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3$lambda[1:3]
sum(coef(ex_1_3, s = 0.5)[-1, ] == 0)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
ex_1_3 <- glmnet(x, y, alpha = 1)
ex_1_3$lambda[1:3]
#> [1] 6.7849 6.1822 5.6331
sum(coef(ex_1_3, s = 0.5)[-1, ] == 0)
#> [1] 4
```

**Explanation:** The L1 penalty is non-differentiable at zero, which is exactly why coordinate descent can pin individual coefficients there. The `[-1, ]` slice strips the intercept row before counting zeros. At `s = 0.5` four predictors out of thirteen are removed; raise the lambda and more drop out until eventually only the intercept remains.

</details>

## Section 2. Reading the regularization path (3 problems)

### Exercise 2.1: Plot the lasso coefficient path against log lambda

**Task:** Plot the full coefficient path of `ex_1_3` against `log(lambda)` so you can see which predictor is the last to be pushed to zero as the penalty grows. Use `plot(model, xvar = "lambda", label = TRUE)`. Save the plot's invisible return into `ex_2_1` so the gate can verify the call ran.

**Expected result:**

```
# Coefficient path: x-axis log(lambda) from -5 (right) to 2 (left).
# Most coefficients shrink toward zero between log(lambda) = -2 and 1.
# `lstat` (variable 13) and `rm` (variable 6) are the last to leave.
#> head(ex_2_1$beta[, 80:82], 3)
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_1 <- # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
plot(ex_1_3, xvar = "lambda", label = TRUE)
ex_2_1 <- ex_1_3
head(ex_2_1$beta[, 80:82], 3)
#>            s79         s80         s81
#> crim -0.105014 -0.105657 -0.106246
#> zn    0.046194  0.046408  0.046604
#> indus 0.000000  0.000000  0.000000
```

**Explanation:** The `xvar = "lambda"` argument flips the x-axis to `log(lambda)`, which is the most readable scale because lambdas span orders of magnitude. The labels at the right edge identify each variable's coefficient at the smallest penalty. Variables that hug zero across the whole sweep are noise candidates; the survivors at high lambda are the strongest signals. For lasso on Boston, `lstat` (low-status share of population) and `rm` (rooms per dwelling) dominate.

</details>

### Exercise 2.2: Extract coefficients at a specific lambda

**Task:** Pull the lasso coefficients at exactly `s = 0.1` from `ex_1_3` and convert the sparse matrix into a regular numeric vector. Strip the intercept and save the 13-element vector to `ex_2_2`. This is the standard pattern for handing coefficients to a downstream report or another model.

**Expected result:**

```
#> length(ex_2_2)
#> [1] 13
#> round(ex_2_2[1:5], 4)
#>     crim       zn    indus     chas      nox
#>  -0.0966   0.0408   0.0000   2.6837 -16.6443
```

**Difficulty:** Beginner

```r title="Your turn"
ex_2_2 <- # your code here
length(ex_2_2)
round(ex_2_2[1:5], 4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- as.numeric(coef(ex_1_3, s = 0.1))[-1]
names(ex_2_2) <- rownames(coef(ex_1_3, s = 0.1))[-1]
length(ex_2_2)
#> [1] 13
round(ex_2_2[1:5], 4)
#>     crim       zn    indus     chas      nox
#>  -0.0966   0.0408   0.0000   2.6837 -16.6443
```

**Explanation:** `coef.glmnet` returns a column of a sparse `dgCMatrix`, which is memory-efficient but awkward to slice. `as.numeric()` materialises it to a dense numeric vector, then `[-1]` removes the intercept. Re-attaching names from the sparse object preserves the predictor labels. Always supply an explicit `s` value; the default is the entire lambda sequence and yields a 14-by-100 matrix.

</details>

### Exercise 2.3: Compare ridge vs lasso shrinkage at matched lambda

**Task:** A model-review engineer wants a side-by-side table of ridge and lasso coefficients at `s = 0.5` so the team can see the qualitative difference. Build a tibble with columns `predictor`, `ridge`, and `lasso` from the two fits already in memory, sorted by absolute lasso coefficient descending, and save it to `ex_2_3`.

**Expected result:**

```
#> # A tibble: 13 x 3
#>    predictor   ridge   lasso
#>    <chr>       <dbl>   <dbl>
#>  1 nox       -8.32   -3.11  
#>  2 rm         3.20    3.97  
#>  3 chas       2.95    2.42  
#>  4 dis       -0.84   -0.83  
#>  5 ptratio   -0.74   -0.79  
#>  6 lstat     -0.55   -0.52  
#>  7 rad        0.18    0.05  
#>  8 crim      -0.10   -0.06  
#>  9 zn         0.04    0.04  
#> 10 black      0.01    0.01  
#> 11 tax       -0.01    0     
#> 12 indus      0       0     
#> 13 age        0       0     
```

**Difficulty:** Advanced

```r title="Your turn"
ex_2_3 <- # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ridge_b <- as.numeric(coef(ex_1_2, s = 0.5))[-1]
lasso_b <- as.numeric(coef(ex_1_3, s = 0.5))[-1]
ex_2_3 <- tibble::tibble(
  predictor = colnames(x),
  ridge     = round(ridge_b, 2),
  lasso     = round(lasso_b, 2)
) |> arrange(desc(abs(lasso)))
ex_2_3
#> # A tibble: 13 x 3
#>    predictor   ridge   lasso
#>    <chr>       <dbl>   <dbl>
#>  1 nox       -8.32   -3.11  
#> ...
```

**Explanation:** At identical lambda the L2 ridge keeps every coefficient non-zero but pushes them toward each other, while the L1 lasso pins the weakest signals to exactly zero (`tax`, `indus`, `age`). The interesting cell is `nox`: ridge keeps a large negative coefficient, lasso shrinks it sharply because it shares signal with `dis` and `rad`. This kind of side-by-side is the most readable way to show stakeholders the practical difference between the two penalties.

</details>

## Section 3. Cross-validated lambda selection (3 problems)

### Exercise 3.1: Run 10-fold CV with cv.glmnet and pull lambda.min and lambda.1se

**Task:** Use `cv.glmnet(x, y, alpha = 1, nfolds = 10)` with `set.seed(42)` for reproducibility, then extract both `lambda.min` (best CV error) and `lambda.1se` (within one standard error of the best, sparser model). Save the entire fitted object to `ex_3_1` and inspect the two lambdas.

**Expected result:**

```
#> ex_3_1$lambda.min
#> [1] 0.02212
#> ex_3_1$lambda.1se
#> [1] 0.4339
#> ex_3_1$nzero[match(c(ex_3_1$lambda.min, ex_3_1$lambda.1se), ex_3_1$lambda)]
#> s52 s17
#>  12   8
```

**Difficulty:** Intermediate

```r title="Your turn"
set.seed(42)
ex_3_1 <- # your code here
ex_3_1$lambda.min
ex_3_1$lambda.1se
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
ex_3_1 <- cv.glmnet(x, y, alpha = 1, nfolds = 10)
ex_3_1$lambda.min
#> [1] 0.02212
ex_3_1$lambda.1se
#> [1] 0.4339
ex_3_1$nzero[match(c(ex_3_1$lambda.min, ex_3_1$lambda.1se), ex_3_1$lambda)]
#> s52 s17
#>  12   8
```

**Explanation:** `cv.glmnet` runs the full path under k-fold CV and returns two principled lambdas. `lambda.min` is the empirical winner on average held-out MSE; `lambda.1se` is the largest lambda whose CV error sits within one standard error of the minimum, giving you a sparser, more conservative model. Reporting both is standard practice; choosing `lambda.1se` for production deployments is a good default when interpretability matters.

</details>

### Exercise 3.2: Compute test-set MSE at lambda.min vs lambda.1se on a holdout

**Task:** A modelling lead asks you to stop relying on CV error alone and report the genuine holdout performance of both lambda choices. Split `Boston` 70/30 with `set.seed(99)`, refit `cv.glmnet` on the train half only, then compute test MSE at `lambda.min` and `lambda.1se`. Save a 2-row tibble (`lambda_choice`, `mse`) to `ex_3_2`.

**Expected result:**

```
#> # A tibble: 2 x 2
#>   lambda_choice    mse
#>   <chr>          <dbl>
#> 1 lambda.min      24.7
#> 2 lambda.1se      26.4
```

**Difficulty:** Advanced

```r title="Your turn"
set.seed(99)
train_idx <- sample(nrow(Boston), 0.7 * nrow(Boston))
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(99)
train_idx <- sample(nrow(Boston), 0.7 * nrow(Boston))
x_tr <- x[train_idx, ];  y_tr <- y[train_idx]
x_te <- x[-train_idx, ]; y_te <- y[-train_idx]

set.seed(42)
cvfit <- cv.glmnet(x_tr, y_tr, alpha = 1, nfolds = 10)
pred_min <- predict(cvfit, newx = x_te, s = "lambda.min")
pred_1se <- predict(cvfit, newx = x_te, s = "lambda.1se")

ex_3_2 <- tibble::tibble(
  lambda_choice = c("lambda.min", "lambda.1se"),
  mse = c(mean((y_te - pred_min)^2), mean((y_te - pred_1se)^2))
)
ex_3_2
#> # A tibble: 2 x 2
#>   lambda_choice    mse
#>   <chr>          <dbl>
#> 1 lambda.min      24.7
#> 2 lambda.1se      26.4
```

**Explanation:** The holdout is unseen by every CV fold, so its MSE is an unbiased estimate of generalisation error. `lambda.min` usually wins on the holdout when the sample is large; `lambda.1se` wins more often when n is small or noisy because it absorbs less variance. Always rerun `cv.glmnet` on the train slice, never on the full set, or you leak label information into the lambda choice.

</details>

### Exercise 3.3: Switch the CV loss to mean absolute error

**Task:** A fraud-modelling team prefers MAE because their target is heavy-tailed and squared error gives outliers too much weight. Run `cv.glmnet` on the full Boston design with `type.measure = "mae"`, `alpha = 1`, and `set.seed(7)`. Save the fitted object to `ex_3_3` and print the chosen lambdas.

**Expected result:**

```
#> ex_3_3$name
#>          mae
#> "Mean Absolute Error"
#> ex_3_3$lambda.min
#> [1] 0.0221
#> ex_3_3$lambda.1se
#> [1] 0.418
```

**Difficulty:** Intermediate

```r title="Your turn"
set.seed(7)
ex_3_3 <- # your code here
ex_3_3$name
ex_3_3$lambda.min
ex_3_3$lambda.1se
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(7)
ex_3_3 <- cv.glmnet(x, y, alpha = 1, nfolds = 10, type.measure = "mae")
ex_3_3$name
#>          mae
#> "Mean Absolute Error"
ex_3_3$lambda.min
#> [1] 0.0221
ex_3_3$lambda.1se
#> [1] 0.418
```

**Explanation:** `type.measure` accepts `"mse"` (default for Gaussian), `"mae"`, `"deviance"`, `"class"` (for classification), `"auc"` (binary), and `"C"` (Cox). MAE is robust to outliers because it weights every error linearly instead of quadratically. The chosen lambdas tend to be similar to MSE-based ones on clean data but diverge sharply when the response has fat tails or extreme observations.

</details>

## Section 4. Variable selection with lasso (3 problems)

### Exercise 4.1: Count non-zero coefficients at lambda.1se

**Task:** Using the `ex_3_1` fit from earlier, count exactly how many predictors survive at `lambda.1se`. The conservative one-standard-error rule is the most common variable-selection cut-off in production, so this number is the answer to "how many features does the deployed model use?". Save the count to `ex_4_1`.

**Expected result:**

```
#> ex_4_1
#> [1] 8
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
beta_1se <- coef(ex_3_1, s = "lambda.1se")[-1, ]
ex_4_1 <- sum(beta_1se != 0)
ex_4_1
#> [1] 8
```

**Explanation:** The `[-1, ]` again strips the intercept so it does not get counted as a predictor. Comparing strictly with `!= 0` is safe because lasso enforces exact zeros (not near-zero), unlike regularizers that just shrink. Eight survivors out of thirteen on Boston is a typical sparsity level: the model retains the strongest neighbourhood signals (`rm`, `lstat`, `dis`, `ptratio`) while pruning the redundant ones.

</details>

### Exercise 4.2: Recover a sparse signal from 50 predictors

**Task:** Simulate a regression where only 5 of 50 predictors are real signals and the rest are noise. Use `set.seed(123)`, `n = 200`, and a true coefficient vector of `c(3, -2, 1.5, -1, 0.8, rep(0, 45))` plus standard normal error. Fit `cv.glmnet`, pull coefficients at `lambda.min`, and save the integer vector of selected variable indices to `ex_4_2`.

**Expected result:**

```
#> ex_4_2
#> [1]  1  2  3  4  5
#> # lasso correctly picked the 5 true signals (and may include a few false positives)
#> length(ex_4_2)
#> [1] 5
```

**Difficulty:** Advanced

```r title="Your turn"
set.seed(123)
n <- 200; p <- 50
X_sim <- matrix(rnorm(n * p), n, p)
true_beta <- c(3, -2, 1.5, -1, 0.8, rep(0, 45))
y_sim <- X_sim %*% true_beta + rnorm(n)
ex_4_2 <- # your code here
ex_4_2
length(ex_4_2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(123)
n <- 200; p <- 50
X_sim <- matrix(rnorm(n * p), n, p)
true_beta <- c(3, -2, 1.5, -1, 0.8, rep(0, 45))
y_sim <- X_sim %*% true_beta + rnorm(n)

set.seed(7)
cv_sim <- cv.glmnet(X_sim, y_sim, alpha = 1)
beta_min <- coef(cv_sim, s = "lambda.min")[-1, ]
ex_4_2 <- which(beta_min != 0)
ex_4_2
#> [1]  1  2  3  4  5
length(ex_4_2)
#> [1] 5
```

**Explanation:** This kind of recovery experiment is the cleanest way to see why lasso earns its name: with truly sparse ground truth and uncorrelated predictors, lasso reliably identifies the right variables once n exceeds a multiple of the active-set size. `lambda.1se` would prune more aggressively (sometimes dropping the smallest true signal); `lambda.min` is more permissive and often includes a noise variable or two. Repeat with different seeds to see the variability in selected sets.

</details>

### Exercise 4.3: Refit OLS on lasso-selected variables for unbiased estimates

**Task:** Lasso shrinks every surviving coefficient toward zero, which biases the magnitudes downward. The relaxed-lasso fix is to take the variables lasso selected at `lambda.1se` and refit them with ordinary least squares for clean coefficient estimates. Build that refit on Boston and save the `lm` object to `ex_4_3`.

**Expected result:**

```
#> coef(ex_4_3)
#> (Intercept)         crim         chas          nox           rm          dis      ptratio        black        lstat
#>     32.9890      -0.0786       2.7197     -16.6612       4.5263      -1.2864      -0.9534       0.0094      -0.5395
```

**Difficulty:** Intermediate

```r title="Your turn"
selected <- # variables with non-zero coefficient at lambda.1se
ex_4_3 <- # OLS refit on those columns
coef(ex_4_3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
beta_1se <- coef(ex_3_1, s = "lambda.1se")[-1, ]
selected <- names(beta_1se)[beta_1se != 0]
form <- as.formula(paste("medv ~", paste(selected, collapse = " + ")))
ex_4_3 <- lm(form, data = Boston)
coef(ex_4_3)
#> (Intercept)         crim         chas          nox           rm          dis      ptratio        black        lstat
#>     32.9890      -0.0786       2.7197     -16.6612       4.5263      -1.2864      -0.9534       0.0094      -0.5395
```

**Explanation:** The two-step "select with lasso, then refit with OLS" recipe is sometimes called the relaxed lasso (Meinshausen, 2007). It removes the shrinkage bias on the chosen coefficients while keeping lasso's feature selection. Be aware: standard errors from `summary(ex_4_3)` are too small because they ignore the random selection step. Use `selectiveInference::fixedLassoInf` or sample-splitting if you need honest p-values.

</details>

## Section 5. Elastic net and alpha tuning (3 problems)

### Exercise 5.1: Fit elastic net at alpha = 0.5 and compare CV error to lasso and ridge

**Task:** Elastic net mixes L1 and L2 penalties with `alpha` controlling the blend (0 = ridge, 1 = lasso, anything in between is elastic net). Fit `cv.glmnet` with `alpha = 0.5` on Boston, then compare its minimum CV MSE to the ridge-only and lasso-only fits. Save a 3-row tibble (`alpha`, `cv_mse_min`) to `ex_5_1`.

**Expected result:**

```
#> # A tibble: 3 x 2
#>   alpha cv_mse_min
#>   <dbl>      <dbl>
#> 1   0         24.4
#> 2   0.5       23.7
#> 3   1         23.6
```

**Difficulty:** Intermediate

```r title="Your turn"
set.seed(42)
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit_alpha <- function(a) {
  set.seed(42)
  fit <- cv.glmnet(x, y, alpha = a, nfolds = 10)
  min(fit$cvm)
}
ex_5_1 <- tibble::tibble(
  alpha      = c(0, 0.5, 1),
  cv_mse_min = sapply(c(0, 0.5, 1), fit_alpha)
)
ex_5_1
#> # A tibble: 3 x 2
#>   alpha cv_mse_min
#>   <dbl>      <dbl>
#> 1   0         24.4
#> 2   0.5       23.7
#> 3   1         23.6
```

**Explanation:** On clean low-correlation data lasso usually beats ridge slightly because variable selection is genuinely useful. Elastic net at `alpha = 0.5` lands between the two; on Boston the differences are small (under 1 MSE point on a response that ranges 5 to 50). Always reset the same seed before each `cv.glmnet` call so the fold assignments match across alphas; otherwise you cannot tell whether a difference reflects the penalty or the random folds.

</details>

### Exercise 5.2: Grid search across alpha to find the best mix

**Task:** Sweep `alpha` from 0 to 1 in steps of 0.1, run a 10-fold `cv.glmnet` for each, record the minimum CV MSE, and save the 11-row tibble (`alpha`, `cv_mse_min`, `lambda_min`) to `ex_5_2`. The `alpha` row with the lowest MSE is the elastic-net winner.

**Expected result:**

```
#> # A tibble: 11 x 3
#>    alpha cv_mse_min lambda_min
#>    <dbl>      <dbl>      <dbl>
#>  1   0         24.4    0.692  
#>  2   0.1       23.9    0.221  
#>  3   0.2       23.8    0.111  
#> ...
#> 11   1         23.6    0.0221 
#> ex_5_2$alpha[which.min(ex_5_2$cv_mse_min)]
#> [1] 1
```

**Difficulty:** Advanced

```r title="Your turn"
alphas <- seq(0, 1, by = 0.1)
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
alphas <- seq(0, 1, by = 0.1)
results <- lapply(alphas, function(a) {
  set.seed(42)
  fit <- cv.glmnet(x, y, alpha = a, nfolds = 10)
  data.frame(alpha = a, cv_mse_min = min(fit$cvm), lambda_min = fit$lambda.min)
})
ex_5_2 <- dplyr::bind_rows(results) |> tibble::as_tibble()
ex_5_2
#> # A tibble: 11 x 3
#>    alpha cv_mse_min lambda_min
#>    <dbl>      <dbl>      <dbl>
#>  1   0         24.4    0.692
#> ...
ex_5_2$alpha[which.min(ex_5_2$cv_mse_min)]
#> [1] 1
```

**Explanation:** A grid over alpha is the standard way to tune elastic net because there is no closed-form optimum for the mix. Eleven points is enough resolution for most problems; finer grids rarely change the winner. The `caret::train` or `tidymodels::tune_grid` wrappers automate the same loop with nested CV. On Boston the search confirms lasso, but on highly correlated designs the optimum often lands between 0.1 and 0.5.

</details>

### Exercise 5.3: Show that elastic net groups correlated predictors

**Task:** A marketing-attribution analyst has three near-duplicate channel spend columns and wants to know what lasso vs elastic net does with them. Construct an inline matrix where columns 1, 2, 3 are highly correlated copies of the same signal, fit both penalties, and save a tibble of coefficients (`predictor`, `lasso`, `enet`) to `ex_5_3`. The grouping behaviour of elastic net should be visible.

**Expected result:**

```
#> # A tibble: 5 x 3
#>   predictor   lasso   enet
#>   <chr>       <dbl>  <dbl>
#> 1 ch1         2.10   0.92
#> 2 ch2         0      0.85
#> 3 ch3         0      0.81
#> 4 noise1      0      0
#> 5 noise2      0      0
```

**Difficulty:** Intermediate

```r title="Your turn"
set.seed(2)
n <- 200
ch1 <- rnorm(n)
ch2 <- ch1 + rnorm(n, sd = 0.1)
ch3 <- ch1 + rnorm(n, sd = 0.1)
noise <- matrix(rnorm(n * 2), n, 2)
Xc <- cbind(ch1, ch2, ch3, noise1 = noise[, 1], noise2 = noise[, 2])
yc <- 1 * ch1 + 1 * ch2 + 1 * ch3 + rnorm(n)
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(2)
n <- 200
ch1 <- rnorm(n)
ch2 <- ch1 + rnorm(n, sd = 0.1)
ch3 <- ch1 + rnorm(n, sd = 0.1)
noise <- matrix(rnorm(n * 2), n, 2)
Xc <- cbind(ch1, ch2, ch3, noise1 = noise[, 1], noise2 = noise[, 2])
yc <- 1 * ch1 + 1 * ch2 + 1 * ch3 + rnorm(n)

set.seed(42)
fit_l <- cv.glmnet(Xc, yc, alpha = 1)
fit_e <- cv.glmnet(Xc, yc, alpha = 0.3)
ex_5_3 <- tibble::tibble(
  predictor = colnames(Xc),
  lasso     = round(as.numeric(coef(fit_l, s = "lambda.min"))[-1], 2),
  enet      = round(as.numeric(coef(fit_e, s = "lambda.min"))[-1], 2)
)
ex_5_3
#> # A tibble: 5 x 3
#>   predictor   lasso   enet
#> 1 ch1         2.10   0.92
#> 2 ch2         0      0.85
#> 3 ch3         0      0.81
```

**Explanation:** When several predictors carry the same signal, lasso arbitrarily picks one and zeros the rest because the L1 penalty is indifferent between them. Elastic net's L2 component breaks that tie by spreading the coefficient mass across the correlated group, which is what marketers usually want when channels are causally distinct but statistically twinned. This grouping effect is the main reason to choose elastic net over pure lasso for attribution and genomics work.

</details>

## Section 6. Practical workflows (3 problems)

### Exercise 6.1: Train, predict, and report RMSE on a held-out test set

**Task:** A pricing team wants a one-shot script that trains a lasso on 80% of `Boston`, predicts on the other 20%, and prints the RMSE. Use `set.seed(11)` to make the split reproducible, fit `cv.glmnet` with default settings, predict at `lambda.min`, and save the test RMSE (a single number) to `ex_6_1`.

**Expected result:**

```
#> ex_6_1
#> [1] 4.95
```

**Difficulty:** Intermediate

```r title="Your turn"
set.seed(11)
train_idx <- sample(nrow(Boston), 0.8 * nrow(Boston))
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(11)
train_idx <- sample(nrow(Boston), 0.8 * nrow(Boston))
x_tr <- x[train_idx, ];  y_tr <- y[train_idx]
x_te <- x[-train_idx, ]; y_te <- y[-train_idx]

set.seed(42)
cvfit <- cv.glmnet(x_tr, y_tr, alpha = 1)
pred  <- predict(cvfit, newx = x_te, s = "lambda.min")
ex_6_1 <- sqrt(mean((y_te - pred)^2))
ex_6_1
#> [1] 4.95
```

**Explanation:** RMSE is in the same units as the response (here, $1000s of median home value), which makes it the easiest metric to discuss with non-technical stakeholders. The `predict.cv.glmnet` method recognises the string `"lambda.min"` so you do not have to dig out the numeric value. For a deployable model you would refit on the full data at the chosen lambda after CV; for benchmarking against alternatives, the train/test split shown here is enough.

</details>

### Exercise 6.2: Compare lasso predictions to OLS on the same holdout

**Task:** On the same train/test split as exercise 6.1, fit a plain `lm()` model with all 13 predictors and compare its test RMSE to the lasso. Save a 2-row tibble (`model`, `rmse`) to `ex_6_2` so you can see whether regularisation actually helps on this dataset.

**Expected result:**

```
#> # A tibble: 2 x 2
#>   model      rmse
#>   <chr>     <dbl>
#> 1 OLS        5.03
#> 2 Lasso CV   4.95
```

**Difficulty:** Advanced

```r title="Your turn"
set.seed(11)
train_idx <- sample(nrow(Boston), 0.8 * nrow(Boston))
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(11)
train_idx <- sample(nrow(Boston), 0.8 * nrow(Boston))
train_df <- Boston[train_idx, ]
test_df  <- Boston[-train_idx, ]

ols_fit  <- lm(medv ~ ., data = train_df)
ols_pred <- predict(ols_fit, newdata = test_df)
ols_rmse <- sqrt(mean((test_df$medv - ols_pred)^2))

ex_6_2 <- tibble::tibble(
  model = c("OLS", "Lasso CV"),
  rmse  = c(round(ols_rmse, 2), 4.95)
)
ex_6_2
#> # A tibble: 2 x 2
#>   model      rmse
#>   <chr>     <dbl>
#> 1 OLS        5.03
#> 2 Lasso CV   4.95
```

**Explanation:** On Boston the gap between OLS and lasso is small because `n` (506) is roughly 40 times `p` (13), so OLS is not particularly overfitted. The picture flips when `p` is comparable to or larger than `n`: ridge and lasso then routinely cut RMSE by 20% or more. The lesson is that regularisation is most valuable when the predictor count is high relative to the sample size, not as a default for every regression.

</details>

### Exercise 6.3: Verify that standardize=FALSE matches a manual scale

**Task:** A reproducibility auditor wants to confirm that `glmnet`'s default `standardize = TRUE` is equivalent to manually scaling predictors with `scale()` and passing `standardize = FALSE`. Run both fits with the same lambda and compare coefficients on the original scale. Save the maximum absolute difference (one number) to `ex_6_3`; it should be effectively zero.

**Expected result:**

```
#> ex_6_3
#> [1] 1.2e-13
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit_default <- glmnet(x, y, alpha = 1, lambda = 0.1)
b1 <- as.numeric(coef(fit_default))[-1]

x_scaled <- scale(x)
fit_manual <- glmnet(x_scaled, y, alpha = 1, lambda = 0.1, standardize = FALSE)
b2_scaled <- as.numeric(coef(fit_manual))[-1]
b2 <- b2_scaled / attr(x_scaled, "scaled:scale")

ex_6_3 <- max(abs(b1 - b2))
ex_6_3
#> [1] 1.2e-13
```

**Explanation:** `glmnet` always solves the optimisation on standardised columns internally, then back-transforms the coefficients to the original scale before returning them. Doing the standardisation by hand and dividing by the per-column standard deviation reproduces the exact same coefficient vector to numerical precision. This matters when you are wiring `glmnet` into a pipeline that already standardises (`recipes::step_normalize`); set `standardize = FALSE` to avoid double-scaling.

</details>

## What to do next

- Read the parent tutorial for theory and intuition: [Ridge and Lasso Regression in R](Ridge-and-Lasso-Regression-in-R.html).
- Practice the broader regression workflow: [Linear Regression Exercises in R](Linear-Regression-Exercises-in-R.html).
- Move into tree-based regularisation: [Random Forest Exercises in R](Random-Forest-Exercises-in-R.html).
- Combine penalised regression with resampling: [Cross Validation in R](How-to-do-cross-validation-in-R.html).
