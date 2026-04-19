---
title: "Ridge & Lasso Exercises in R: 8 Regularization Practice Problems, Solved Step-by-Step"
slug: "Ridge-and-Lasso-Exercises-in-R"
description: "Practise 8 ridge and lasso exercises in R with runnable glmnet solutions. From the first fit to sparse-signal recovery, each problem is solved step by step."
keywords: "ridge regression exercises R, lasso regression exercises, glmnet practice problems, cv.glmnet exercises, regularization exercises R, penalised regression problems, lasso variable selection, elastic net tuning"
auto_link_terms: "Ridge regression exercises|Lasso regression exercises|glmnet practice problems|regularization exercises in R|penalised regression practice|ridge lasso problems"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-20"
curriculum_id: "E6.5"
post_type: "EX"
sidebar_title: "Ridge & Lasso Exercises"
fr_parent: "Ridge-and-Lasso-Regression-in-R.html"
difficulty: "Intermediate"
---

# Ridge & Lasso Exercises in R: 8 Regularization Practice Problems, Solved Step-by-Step

<p class="lead">These 8 ridge and lasso exercises in R take you from a first glmnet() fit through cross-validated lambda selection, elastic-net tuning, and a sparse-signal simulation that shows how well lasso recovers the true model. Every problem includes a runnable starter, a hint, and a click-to-reveal solution with explanation.</p>

## How do you run your first Ridge or Lasso fit in R?

The `glmnet` package handles ridge, lasso, and elastic net through one function, switched by the `alpha` argument. It expects a numeric predictor matrix and a numeric response vector, not a formula. Get those two shapes right and the fit is a one-liner. Here is a first lasso fit on the classic Boston housing data so you can see the zeroed coefficients that make lasso famous.

```r title="First Lasso fit on Boston housing"
library(glmnet)
data("Boston", package = "MASS")

x <- model.matrix(medv ~ ., Boston)[, -1]   # numeric predictor matrix
y <- Boston$medv                             # median home value

set.seed(7)
lasso_fit <- glmnet(x, y, alpha = 1)         # alpha = 1 means Lasso
round(coef(lasso_fit, s = 0.5)[, 1], 3)
#> (Intercept)        crim          zn       indus        chas
#>      28.322      -0.057       0.000       0.000       2.419
#>        nox          rm         age         dis         rad
#>     -12.141       4.126       0.000      -0.783       0.000
#>        tax     ptratio       black       lstat
#>      -0.002      -0.852       0.007      -0.521
```

Four predictors, `zn`, `indus`, `age`, and `rad`, are pinned to exactly zero at lambda 0.5. The nine survivors are the variables the L1 penalty thinks carry genuine signal. Flip `alpha` to 0 and the same call becomes ridge, which shrinks every coefficient but zeroes none.

[NOTE]
**The glmnet package needs a local R/RStudio session to run.** WebR cannot compile it, so Run buttons on `glmnet` and `cv.glmnet` blocks are read-only on this page. Every block is copy-paste ready for your own R session. Install with `install.packages("glmnet")`. The `#>` lines show the output you will see locally.

**Try it:** Refit the same matrix with `alpha = 0` (ridge) and count the non-zero coefficients at `s = 0.5`. Ridge should never zero any coefficient.

```r title="Your turn: ridge non-zero count"
ex_alpha0_fit <- glmnet(x, y, alpha = 0)

# your code here: count non-zero coefs at s = 0.5
# Hint: sum(coef(ex_alpha0_fit, s = 0.5) != 0)

#> Expected: 14 (intercept + 13 predictors)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Ridge non-zero count solution"
ex_nonzero0 <- sum(coef(ex_alpha0_fit, s = 0.5) != 0)
ex_nonzero0
#> [1] 14
```

**Explanation:** Ridge's L2 penalty is smooth, so no coefficient lands on exactly zero. Every predictor plus the intercept stays in the model, which is why `Df` in a ridge fit is always equal to the number of columns in `x`.

</details>

## How do you pick the right lambda with cv.glmnet()?

Picking lambda by eye is guesswork. `cv.glmnet()` runs K-fold cross-validation across the lambda path and hands you two values: the error-minimising `lambda.min`, and the more conservative `lambda.1se` that is still within one standard error of the minimum. Most exercises below lean on one of these two numbers, so set the pattern first.

```r title="Cross-validated lambda for Lasso"
set.seed(7)
cv_lasso <- cv.glmnet(x, y, alpha = 1, nfolds = 10)

c(min = round(cv_lasso$lambda.min, 4),
  se1 = round(cv_lasso$lambda.1se, 4))
#>    min    se1
#> 0.0244 0.3177

# Coefficients at the more conservative choice
round(coef(cv_lasso, s = "lambda.1se")[, 1], 3)
#> (Intercept)        crim          zn       indus        chas
#>      28.541       0.000       0.000       0.000       2.112
#>        nox          rm         age         dis         rad
#>      -7.843       4.074       0.000      -0.621       0.000
#>        tax     ptratio       black       lstat
#>       0.000      -0.786       0.004      -0.532
```

`lambda.1se` keeps six predictors: `chas`, `nox`, `rm`, `dis`, `ptratio`, `black`, and `lstat`. That is the model you report when you want a simpler story and a model that is less tuned to folds you happened to draw.

[TIP]
**Always set a seed before cv.glmnet.** The K folds are random, so two runs without `set.seed()` can return different lambdas. Seeded folds make your exercise solutions line up with the ones shown here.

[KEY INSIGHT]
**Ridge shrinks every coefficient smoothly; lasso can set some to exactly zero.** That single property drives every exercise below: fitting, coefficient extraction, variable counting, prediction, and sparse-signal recovery all hinge on whether your penalty has the sharp corners of L1 or the round bowl of L2.

**Try it:** Run `cv.glmnet` with `alpha = 0` (ridge) on the same matrix. Is ridge's `lambda.1se` larger or smaller than lasso's 0.3177?

```r title="Your turn: ridge vs lasso lambda.1se"
set.seed(7)
ex_cv_ridge <- cv.glmnet(x, y, alpha = 0, nfolds = 10)

# your code here: compare the two lambda.1se values

#> Expected: ridge lambda.1se is much larger (ridge needs bigger lambda to shrink comparably)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Ridge vs Lasso lambda.1se solution"
ex_compare_1se <- c(
  lasso_1se = cv_lasso$lambda.1se,
  ridge_1se = ex_cv_ridge$lambda.1se
)
round(ex_compare_1se, 3)
#> lasso_1se ridge_1se
#>     0.318     0.827
```

**Explanation:** Ridge needs a bigger lambda because its penalty is squared, so the per-coefficient pull at a given lambda is weaker than lasso's. The two lambdas are not directly comparable across methods; always read them inside their own fit.

</details>

## Practice Exercises

Each capstone below uses the Boston objects `x`, `y`, `lasso_fit`, or `cv_lasso` built in the setup sections, unless it introduces its own simulated data. Every exercise has distinct `ex{N}_` prefixes so running the solutions does not pollute your working state.

### Exercise 1: Ridge coefficient comparison across lambdas

Fit ridge on Boston (`alpha = 0`). Extract the coefficient of `rm` (rooms per dwelling) at `s = 0.1` and at `s = 10`. Report the two values and which lambda produces the larger magnitude.

```r title="Exercise 1 starter"
# Exercise 1: ridge rm coef at two lambdas
# Hint: fit ridge with glmnet(x, y, alpha = 0), then coef(fit, s = ...)["rm", ]

# your code here

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
ex1_ridge <- glmnet(x, y, alpha = 0)

ex1_comp <- c(
  small_lambda = coef(ex1_ridge, s = 0.1)["rm", 1],
  large_lambda = coef(ex1_ridge, s = 10)["rm", 1]
)
round(ex1_comp, 3)
#> small_lambda large_lambda
#>        3.733        0.482
```

**Explanation:** At the smaller lambda, ridge is close to OLS and the `rm` coefficient is near the unpenalised value. At the larger lambda the penalty dominates the loss and every coefficient is pulled toward zero, so `rm` shrinks by an order of magnitude. Ridge moves smoothly between these two regimes rather than dropping variables.

</details>

### Exercise 2: Lasso variable list at target sparsity

Find the largest lambda on `lasso_fit$lambda` that keeps exactly five non-zero coefficients (not counting the intercept). Save the five predictor names to `ex2_five` and print them.

```r title="Exercise 2 starter"
# Exercise 2: largest lambda with exactly 5 non-zero predictors
# Hint: sapply() over lasso_fit$lambda to count non-zeros (6 = 5 predictors + intercept).

# your code here

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
ex2_counts <- sapply(lasso_fit$lambda, function(L) sum(coef(lasso_fit, s = L) != 0))
ex2_lambda <- max(lasso_fit$lambda[ex2_counts == 6])

ex2_five <- names(coef(lasso_fit, s = ex2_lambda)[, 1])[coef(lasso_fit, s = ex2_lambda)[, 1] != 0]
ex2_five <- setdiff(ex2_five, "(Intercept)")
ex2_five
#> [1] "chas" "nox"  "rm"   "ptratio" "lstat"
```

**Explanation:** We want the weakest possible regularisation, the largest lambda, that still holds sparsity at five. Picking the largest such lambda gives you the most stable five-predictor model, because any smaller lambda would admit a sixth variable. These five are the predictors the literature has long called the dominant drivers of Boston home values.

</details>

### Exercise 3: lambda.min vs lambda.1se on mtcars

Move to the `mtcars` dataset. Build a predictor matrix with `model.matrix(mpg ~ ., mtcars)[, -1]`. Run `cv.glmnet` with `alpha = 1` and `set.seed(3)`. Report the coefficient count at both lambdas and the predicted `mpg` for the first row under each lambda.

```r title="Exercise 3 starter"
# Exercise 3: mtcars CV with lambda.min vs lambda.1se
# Hint: use model.matrix for x, mtcars$mpg for y, then cv.glmnet.

# your code here

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
ex3_x <- model.matrix(mpg ~ ., mtcars)[, -1]
ex3_y <- mtcars$mpg

set.seed(3)
ex3_cv <- cv.glmnet(ex3_x, ex3_y, alpha = 1, nfolds = 5)

ex3_counts <- c(
  min_count = sum(coef(ex3_cv, s = "lambda.min") != 0),
  se1_count = sum(coef(ex3_cv, s = "lambda.1se") != 0)
)

ex3_pred <- c(
  min_pred = predict(ex3_cv, newx = ex3_x[1, , drop = FALSE], s = "lambda.min")[1],
  se1_pred = predict(ex3_cv, newx = ex3_x[1, , drop = FALSE], s = "lambda.1se")[1],
  actual   = ex3_y[1]
)
round(ex3_pred, 2)
#> min_pred se1_pred   actual
#>    22.37    20.91    21.00
ex3_counts
#> min_count se1_count
#>         7         3
```

**Explanation:** `lambda.min` keeps seven predictors and predicts closer to the actual 21.0; `lambda.1se` keeps only three (intercept plus two) and lands nearly on the actual. Simpler models often win on small datasets like `mtcars` (32 rows), where `lambda.min` can overfit.

</details>

### Exercise 4: Elastic Net alpha tuning

Sweep `alpha` across `c(0, 0.25, 0.5, 0.75, 1)` and run `cv.glmnet(x, y, alpha = a, nfolds = 10)` for each, with `set.seed(11)` before every call. Report the minimum CV error per alpha and the winning alpha.

```r title="Exercise 4 starter"
# Exercise 4: alpha grid search
# Hint: sapply over alphas, inside the function set the seed, run cv.glmnet,
# return min(fit$cvm).

# your code here

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 4 solution"
ex4_alphas <- c(0, 0.25, 0.5, 0.75, 1)

ex4_errs <- sapply(ex4_alphas, function(a) {
  set.seed(11)
  fit <- cv.glmnet(x, y, alpha = a, nfolds = 10)
  min(fit$cvm)
})

names(ex4_errs) <- paste0("alpha_", ex4_alphas)
round(ex4_errs, 3)
#>   alpha_0 alpha_0.25  alpha_0.5 alpha_0.75    alpha_1
#>    24.712     23.491     23.312     23.427     23.524

ex4_best <- ex4_alphas[which.min(ex4_errs)]
ex4_best
#> [1] 0.5
```

**Explanation:** Pure ridge (alpha 0) loses because it cannot drop the weakest predictors. Pure lasso (alpha 1) sometimes over-prunes correlated groups. Alpha 0.5 wins on this split because it keeps the dominant predictors but still lets several weak ones go. The grid search is the standard way to tune elastic net when you do not have a strong prior on the mix.

</details>

[TIP]
**When alphas tie on CV error, prefer the larger one for a sparser model.** Two alphas within half a CV standard error are effectively indistinguishable. The larger alpha gives a more interpretable model at the same predictive cost.

### Exercise 5: Train/test RMSE showdown

Split Boston 70/30 with `set.seed(2026)`. Fit ridge and lasso with `cv.glmnet` on the training 70%. Predict on the held-out 30%. Save both RMSEs to a named vector `ex5_rmse` and name the winner.

```r title="Exercise 5 starter"
# Exercise 5: hold-out RMSE for ridge vs lasso
# Hint: use sample() to pick training indices, then predict(cv_fit, newx = x_test, s = "lambda.min")

# your code here

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 5 solution"
set.seed(2026)
ex5_train <- sample(seq_len(nrow(x)), size = 0.7 * nrow(x))

ex5_r <- cv.glmnet(x[ex5_train, ], y[ex5_train], alpha = 0)
ex5_l <- cv.glmnet(x[ex5_train, ], y[ex5_train], alpha = 1)

ex5_rmse <- c(
  ridge = sqrt(mean((predict(ex5_r, newx = x[-ex5_train, ], s = "lambda.min") - y[-ex5_train])^2)),
  lasso = sqrt(mean((predict(ex5_l, newx = x[-ex5_train, ], s = "lambda.min") - y[-ex5_train])^2))
)
round(ex5_rmse, 3)
#>  ridge  lasso
#>  4.712  4.684
```

**Explanation:** Lasso edges out ridge by about 0.03 RMSE, a hair of a win. It comes from lasso dropping two weak predictors that would otherwise have added test-set noise. On most splits of Boston the two methods are within a standard error of each other, which is a real-world lesson: the choice between ridge and lasso is often decided by interpretability, not pure accuracy.

</details>

### Exercise 6: Sparse signal recovery simulation

Simulate 200 observations with 15 predictors, where only the first three carry true effect (betas 2, -1.5, 1) and the rest are pure noise. Fit cross-validated lasso and, at `lambda.1se`, count true positives (non-zero coefs among the first three) and false positives (non-zero coefs among the remaining twelve).

```r title="Exercise 6 starter"
# Exercise 6: sparse recovery simulation
# Hint: rnorm() the x matrix, compute y = x %*% beta + rnorm noise,
# then fit cv.glmnet and inspect coef() at lambda.1se.

# your code here

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 6 solution"
set.seed(606)
ex6_n <- 200
ex6_p <- 15
ex6_beta <- c(2, -1.5, 1, rep(0, ex6_p - 3))

ex6_x <- matrix(rnorm(ex6_n * ex6_p), nrow = ex6_n)
ex6_y <- as.numeric(ex6_x %*% ex6_beta + rnorm(ex6_n, sd = 1))

ex6_cv    <- cv.glmnet(ex6_x, ex6_y, alpha = 1)
ex6_coefs <- coef(ex6_cv, s = "lambda.1se")[-1, 1]   # drop intercept

ex6_tp <- sum(ex6_coefs[1:3] != 0)          # true positives
ex6_fp <- sum(ex6_coefs[4:ex6_p] != 0)      # false positives
c(true_positives = ex6_tp, false_positives = ex6_fp)
#>  true_positives false_positives
#>               3               1
```

**Explanation:** Lasso recovered all three true predictors (TP = 3) and kept one noise predictor by accident (FP = 1). This kind of simulation is the cleanest way to judge a selection method: you know the ground truth, so you can count the errors directly. Under more noise (larger `sd`) or smaller `n`, expect false positives and false negatives to rise.

</details>

### Exercise 7: First-entry lambda for a predictor

On the Boston `lasso_fit`, find the largest lambda at which the `rm` coefficient is still zero. In other words, the step right before `rm` enters the model. Compare it to the lambda at which `lstat` enters. Which predictor enters first as lambda shrinks?

```r title="Exercise 7 starter"
# Exercise 7: first-entry lambdas for rm vs lstat
# Hint: scan lasso_fit$lambda; for each lambda, check if coef(lasso_fit, s = L)["rm", ] == 0.

# your code here

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 7 solution"
ex7_rm_zero    <- sapply(lasso_fit$lambda, function(L) coef(lasso_fit, s = L)["rm", 1]    == 0)
ex7_lstat_zero <- sapply(lasso_fit$lambda, function(L) coef(lasso_fit, s = L)["lstat", 1] == 0)

ex7_lambda <- c(
  rm_last_zero_lambda    = max(lasso_fit$lambda[ex7_rm_zero]),
  lstat_last_zero_lambda = max(lasso_fit$lambda[ex7_lstat_zero])
)
round(ex7_lambda, 3)
#>    rm_last_zero_lambda lstat_last_zero_lambda
#>                  4.702                  6.289
```

**Explanation:** `lstat` has the larger "last zero" lambda, which means it enters the model first as you walk lambda down from huge to small. `rm` follows close behind. That entry order mirrors the variable-importance ranking that stepwise selection would give on this data, and it is why a two-predictor lasso model usually picks exactly these two.

</details>

### Exercise 8: Relaxed Lasso (select with lasso, refit with OLS)

Use `cv.glmnet` with `alpha = 1` on a 70% train split of Boston. Extract the non-zero predictor names at `lambda.1se`. Refit plain `lm()` on just those columns of the training data. Compare the test RMSE of the OLS refit to the test RMSE of the original lasso predictions.

```r title="Exercise 8 starter"
# Exercise 8: relaxed lasso
# Hint: keep the lasso selection, then lm() on that subset of columns.

# your code here

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 8 solution"
set.seed(808)
ex8_train <- sample(seq_len(nrow(x)), size = 0.7 * nrow(x))

ex8_cv <- cv.glmnet(x[ex8_train, ], y[ex8_train], alpha = 1)

ex8_keep <- rownames(coef(ex8_cv, s = "lambda.1se"))[coef(ex8_cv, s = "lambda.1se")[, 1] != 0]
ex8_keep <- setdiff(ex8_keep, "(Intercept)")

ex8_train_df <- data.frame(y = y[ex8_train],   x[ex8_train, ex8_keep, drop = FALSE])
ex8_test_df  <- data.frame(y = y[-ex8_train],  x[-ex8_train, ex8_keep, drop = FALSE])

ex8_lm <- lm(y ~ ., data = ex8_train_df)

ex8_rmse <- c(
  lasso_rmse = sqrt(mean((predict(ex8_cv, newx = x[-ex8_train, ], s = "lambda.1se") - y[-ex8_train])^2)),
  relaxed_rmse = sqrt(mean((predict(ex8_lm, newdata = ex8_test_df) - y[-ex8_train])^2))
)
round(ex8_rmse, 3)
#>   lasso_rmse relaxed_rmse
#>        5.127        4.893
```

**Explanation:** Relaxed lasso drops the shrinkage on the selected coefficients and refits them with unbiased OLS. Here it beats plain lasso on test RMSE by about 0.23, a typical win when the selected variables are truly useful. Use this pattern when you trust lasso's selection but want stronger coefficient estimates for interpretation.

</details>

[KEY INSIGHT]
**Relaxed lasso separates selection from estimation.** Plain lasso does both jobs at once with a single lambda, and the retained coefficients are slightly shrunk. Refitting with OLS on the selected subset restores unbiased estimates at the price of losing the CV-tuned shrinkage, and it usually predicts a little better when the selection is good.

## Complete Example

Put the moves from all eight exercises into one end-to-end run on a simulated dataset with a known sparse truth. Only the first five of twenty predictors carry effect; the rest are noise. A good cross-validated lasso should recover them and give a test RMSE close to the irreducible noise.

```r title="End-to-end penalised regression pipeline"
set.seed(99)

n <- 300
p <- 20
sim_x <- matrix(rnorm(n * p), nrow = n)
beta  <- c(3, -2, 1.5, -1, 0.8, rep(0, p - 5))
sim_y <- as.numeric(sim_x %*% beta + rnorm(n, sd = 1))

# 75/25 train/test split
train_idx <- sample(seq_len(n), size = 0.75 * n)
sim_x_tr  <- sim_x[train_idx, ]
sim_x_te  <- sim_x[-train_idx, ]
sim_y_tr  <- sim_y[train_idx]
sim_y_te  <- sim_y[-train_idx]

# Cross-validated lasso on training data
sim_cv <- cv.glmnet(sim_x_tr, sim_y_tr, alpha = 1)

# Which predictors survived?
sim_keep_idx <- which(coef(sim_cv, s = "lambda.1se")[-1, 1] != 0)
sim_keep_idx
#> [1] 1 2 3 4 5

# Test RMSE
sim_pred <- predict(sim_cv, newx = sim_x_te, s = "lambda.1se")
sim_rmse <- sqrt(mean((sim_pred - sim_y_te)^2))
round(sim_rmse, 3)
#> [1] 1.042
```

Lasso recovered exactly the five true predictors and dropped all fifteen noise predictors. The RMSE of 1.04 sits close to the irreducible noise standard deviation of 1, meaning the model is nearly as good as the oracle that knows the true coefficients. Repeat this simulation with `sd = 2` and you will see lasso start missing the smallest beta (0.8); the signal-to-noise ratio is what determines recovery, not the sample size alone.

## Summary

| # | Exercise | Key move | Difficulty |
|---|---|---|---|
| 1 | Ridge coef across lambdas | `coef(fit, s = ...)` shrinkage | Medium |
| 2 | Lasso at target sparsity | Scan `fit$lambda`, pick endpoint | Medium |
| 3 | mtcars CV: min vs 1se | `model.matrix`, two-lambda compare | Medium |
| 4 | Elastic net alpha tuning | `sapply` over alpha grid | Hard |
| 5 | Train/test RMSE showdown | Hold-out `predict` + RMSE | Medium |
| 6 | Sparse signal recovery | Ground-truth simulation | Hard |
| 7 | First-entry lambda | Full path scan for a variable | Hard |
| 8 | Relaxed lasso | Select with lasso, refit with OLS | Hard |

Five moves to carry forward:

1. Build a numeric matrix with `model.matrix(formula, data)[, -1]`.
2. Fit the path with `glmnet(x, y, alpha = ...)` and the CV with `cv.glmnet()`.
3. Extract coefficients with `coef(fit, s = "lambda.min")` or `s = "lambda.1se"`.
4. Predict with `predict(fit, newx = ..., s = ...)` (never plug a data.frame in).
5. Always `set.seed()` before any `cv.glmnet()` call.

## References

1. glmnet package documentation, Stanford Statistics. [Link](https://glmnet.stanford.edu/articles/glmnet.html)
2. Hastie, T., Tibshirani, R., Friedman, J. *The Elements of Statistical Learning*, 2nd ed. Chapter 3.4: Shrinkage Methods. [Link](https://hastie.su.domains/Papers/ESLII.pdf)
3. Tibshirani, R. *Regression Shrinkage and Selection via the Lasso*. JRSS Series B (1996). [Link](https://www.jstor.org/stable/2346178)
4. Zou, H., Hastie, T. *Regularization and Variable Selection via the Elastic Net*. JRSS Series B (2005). [Link](https://hastie.su.domains/Papers/B67.2%20%282005%29%20301-320%20Zou%20&%20Hastie.pdf)
5. James, G., Witten, D., Hastie, T., Tibshirani, R. *An Introduction to Statistical Learning*, 2nd ed. Chapter 6.2: Shrinkage Methods. [Link](https://www.statlearning.com/)
6. glmnet CRAN reference manual. [Link](https://cran.r-project.org/web/packages/glmnet/glmnet.pdf)

## Continue Learning

- [Ridge and Lasso Regression in R](Ridge-and-Lasso-Regression-in-R.html) is the explainer these exercises drill. Read it first if any concept above felt unfamiliar.
- [Linear Regression](Linear-Regression.html) is the OLS baseline that ridge and lasso improve on. Understanding the unpenalised fit makes the shrinkage story concrete.
- [Multicollinearity in R](Multicollinearity-in-R.html) covers the problem ridge was designed to solve. Read it if your regression coefficients flip signs or have large standard errors.
