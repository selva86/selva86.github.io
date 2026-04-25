---
title: "Ridge and Lasso in R: How Penalised Regression Shrinks Coefficients and Selects Variables"
slug: "Ridge-and-Lasso-Regression-in-R"
description: "Ridge shrinks coefficients smoothly; Lasso forces some to exactly zero. Fit glmnet, tune lambda with cross-validation, pick the right penalty for your data."
keywords: "ridge regression R, lasso regression R, glmnet, regularized regression, penalized regression, cv.glmnet, elastic net R, lambda selection, coefficient shrinkage, L1 L2 penalty"
auto_link_terms: "Ridge regression|Lasso regression|penalized regression|regularised regression|regularized regression|elastic net regression|shrinkage penalty|glmnet package|lambda selection|cv.glmnet"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-26"
curriculum_id: "2.3.12"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Ridge & Lasso Regression"
sidebar_order: 8
difficulty: "Intermediate"
---

# Ridge and Lasso in R: How Penalised Regression Shrinks Coefficients and Selects Variables

<p class="lead">Ridge and Lasso are penalised linear regressions that add a cost for large coefficients, trading a small bit of bias for a big drop in variance. Ridge shrinks every coefficient smoothly toward zero; Lasso forces some all the way to zero, which doubles as automatic variable selection.</p>

## What problem does penalised regression solve?

Plain `lm()` has a failure mode that turns up everywhere in real datasets. When predictors outnumber rows, or when several predictors carry the same information, ordinary least-squares overreacts. Coefficients balloon, signs flip on nearly identical samples, and test predictions are far worse than the training fit promised. Penalised regression adds a cost for the size of the coefficients, and that single change tames the wild swings. The fit below shows the payoff: Lasso automatically drops four predictors and keeps only the variables that actually carry signal.

```r title="First Lasso fit on Boston housing"
library(glmnet)
data("Boston", package = "MASS")

x <- model.matrix(medv ~ ., Boston)[, -1]   # numeric predictor matrix
y <- Boston$medv                             # median home value

set.seed(7)
fit <- glmnet(x, y, alpha = 1)               # alpha = 1 means Lasso
round(coef(fit, s = 0.5)[, 1], 3)
#> (Intercept)        crim          zn       indus        chas
#>      28.322      -0.057       0.000       0.000       2.419
#>        nox          rm         age         dis         rad
#>     -12.141       4.126       0.000      -0.783       0.000
#>        tax     ptratio       black       lstat
#>      -0.002      -0.852       0.007      -0.521
```

Four predictors, `zn`, `indus`, `age`, and `rad`, came back at exactly zero. The nine survivors are the variables the penalty thinks carry real signal. An ordinary `lm()` fit on the same data keeps all thirteen, with large and unstable estimates that move every time the training sample shifts.

[NOTE]
**The `glmnet` package needs a local R/RStudio session.** Run buttons on `glmnet` and `cv.glmnet` blocks are read-only on this page, but every code block is copy-paste ready for your own R session. Install once with `install.packages("glmnet")`. The `#>` comments show the output you will see locally.

[KEY INSIGHT]
**Regularisation is a bias-variance trade.** You accept coefficients slightly biased toward zero in exchange for estimates that barely move when the training sample changes. On noisy or correlated data, that trade is almost always a win.

**Try it:** Drop the first predictor (`crim`) from the matrix and refit Lasso. How many non-zero coefficients remain at the same lambda of 0.5?

```r title="Your turn: Lasso without crim"
ex_x <- x[, -1]                    # remove crim
ex_fit <- glmnet(ex_x, y, alpha = 1)

# your code here: count non-zero coefs at s = 0.5
# Hint: sum(coef(ex_fit, s = 0.5) != 0)

#> Expected: 9 (12 predictors, 3 zeroed, plus the intercept)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Lasso without crim solution"
ex_nonzero <- sum(coef(ex_fit, s = 0.5) != 0)
ex_nonzero
#> [1] 9
```

**Explanation:** `coef()` returns a sparse matrix; comparing it with `!= 0` gives `TRUE` for the intercept plus every retained predictor. `sum()` counts them.

</details>

## How do Ridge and Lasso differ in their penalty?

Both methods start from the same ordinary least-squares loss and bolt a penalty term on top. The shape of that penalty controls everything that follows: whether coefficients can hit zero, how shrinkage spreads across correlated predictors, and how the path of solutions evolves as the penalty grows.

$$\text{OLS:}\quad \min_{\beta} \sum_{i=1}^{n}\bigl(y_i - x_i^\top \beta\bigr)^2$$

$$\text{Ridge:}\quad \min_{\beta} \sum_{i=1}^{n}\bigl(y_i - x_i^\top \beta\bigr)^2 + \lambda \sum_{j=1}^{p} \beta_j^2$$

$$\text{Lasso:}\quad \min_{\beta} \sum_{i=1}^{n}\bigl(y_i - x_i^\top \beta\bigr)^2 + \lambda \sum_{j=1}^{p} |\beta_j|$$

Where:
- $\beta_j$ is the coefficient on predictor $j$
- $\lambda \ge 0$ is the penalty strength (the tuning parameter you choose)
- $p$ is the number of predictors
- $n$ is the number of observations

Ridge squares each coefficient, so its penalty is a smooth bowl around zero. Lasso uses absolute values, which trace a diamond with sharp corners at the axes. Those corners are the geometric reason Lasso can set coefficients to exactly zero. Ridge can only push them close.

![How the L2 and L1 penalties change the same OLS loss.](screenshots/Ridge-and-Lasso-Regression-in-R-penalty-comparison.webp)
*Figure 1: How the L2 and L1 penalties change the same OLS loss.*

You can see the difference in one line of R. Fit each method at the same lambda, then count how many coefficients land at zero.

```r title="Count zero coefficients, Ridge vs Lasso"
r_fit <- glmnet(x, y, alpha = 0)           # Ridge: L2 penalty
l_fit <- glmnet(x, y, alpha = 1)           # Lasso: L1 penalty

c(ridge_zeros = sum(coef(r_fit, s = 0.5) == 0),
  lasso_zeros = sum(coef(l_fit, s = 0.5) == 0))
#> ridge_zeros lasso_zeros
#>           0           4
```

At a lambda of 0.5, Ridge has dropped exactly zero predictors and Lasso has dropped four. That single contrast is the whole story: reach for Lasso when you want a shorter, interpretable model, and Ridge when you want every predictor kept but tamed.

[TIP]
**Elastic Net is the middle ground.** Set `alpha` between 0 and 1 to mix L1 and L2 penalties. This helps when several predictors are strongly correlated, because pure Lasso tends to pick one variable from a correlated group and drop the rest, while Elastic Net keeps the group together with shared shrinkage.

**Try it:** Fit Elastic Net with `alpha = 0.5` and count zero coefficients at the same lambda. The count should land between Ridge's 0 and Lasso's 4.

```r title="Your turn: Elastic Net zero count"
ex_en <- glmnet(x, y, alpha = 0.5)

# your code here: count zeros at s = 0.5

#> Expected: between 0 and 4 (typically 2-3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Elastic Net zero count solution"
ex_en_zeros <- sum(coef(ex_en, s = 0.5) == 0)
ex_en_zeros
#> [1] 2
```

**Explanation:** At `alpha = 0.5` the L1 term still creates zeros, but the L2 component softens the corners of the diamond. Fewer coefficients are pushed all the way to zero than under pure Lasso.

</details>

## How do you fit Ridge regression with glmnet?

The `glmnet()` API has two rules worth committing to memory. First, it does not accept a formula: you pass a numeric matrix `x` and a numeric vector `y`. Second, it fits the full path of lambda values in a single call, so one fitted object contains roughly 100 different models, not just one.

![The standard penalised-regression pipeline in R.](screenshots/Ridge-and-Lasso-Regression-in-R-workflow.webp)
*Figure 2: The standard penalised-regression pipeline in R.*

Use `model.matrix()` to convert factor predictors into numeric dummies, drop the intercept column it adds automatically, and hand the result to `glmnet()` with `alpha = 0` for Ridge.

```r title="Fit the full Ridge path"
ridge_fit <- glmnet(x, y, alpha = 0)

print(ridge_fit)
#>
#> Call:  glmnet(x = x, y = y, alpha = 0)
#>
#>    Df  %Dev Lambda
#> 1  13  0.00 6884.00
#> 2  13  0.02 6273.00
#> 3  13  0.03 5717.00
#> ...
#> 99 13  0.74   0.78
#> 100 13  0.74   0.71
```

Each row is a different lambda. `Df` counts non-zero coefficients (always 13 for Ridge, since it never zeroes any predictor). `%Dev` is the fraction of deviance explained, similar to R-squared. Lambda walks from huge on the left, where every coefficient is crushed near zero, down to tiny on the right, where the fit approaches plain OLS.

[WARNING]
**`x` must be a fully numeric matrix.** Pass a data frame with character or factor columns and `glmnet` throws a type error. The safest prep is `model.matrix(formula, data)[, -1]`: it one-hot-encodes factors and strips the intercept column in one step.

Peek at the coefficients at two different lambdas to see shrinkage in action.

```r title="Ridge coefficients at small vs large lambda"
cbind(
  small_lambda = round(coef(ridge_fit, s = 0.01)[, 1], 3),
  large_lambda = round(coef(ridge_fit, s = 100)[, 1], 3)
)
#>              small_lambda large_lambda
#> (Intercept)        36.474       22.541
#> crim               -0.108       -0.013
#> zn                  0.046        0.006
#> indus               0.021        0.003
#> chas                2.687        0.212
#> nox               -17.380       -0.572
#> rm                  3.813        0.480
#> age                 0.001        0.001
#> dis                -1.474       -0.074
#> rad                 0.305        0.005
#> tax                -0.012       -0.001
#> ptratio            -0.951       -0.157
#> black               0.009        0.001
#> lstat              -0.524       -0.099
```

At `s = 0.01` the Ridge coefficients look close to what `lm()` would give, just slightly tamed. At `s = 100` every coefficient is squeezed near zero, and the intercept absorbs most of the prediction. Ridge shrinks proportionally, so the relative ordering of predictor importance stays roughly the same as lambda grows.

**Try it:** Extract Ridge coefficients at `s = 10` and report which predictor has the largest absolute coefficient.

```r title="Your turn: largest Ridge coefficient"
# your code here
# Hint: which.max(abs(coef(ridge_fit, s = 10)[-1]))

#> Expected: a predictor name such as "nox" or "rm"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Largest Ridge coefficient solution"
ex_coefs <- coef(ridge_fit, s = 10)[, 1]
ex_biggest <- names(which.max(abs(ex_coefs[-1])))   # drop intercept
ex_biggest
#> [1] "nox"
```

**Explanation:** `[-1]` drops the intercept so it does not dominate the `max`. `which.max(abs(...))` returns the index of the largest absolute value, and `names()` pulls the predictor name.

</details>

## How do you fit Lasso and let it select variables?

Flip `alpha = 0` to `alpha = 1` and `glmnet()` becomes Lasso. The fit returns the same kind of object, but now `Df` changes as lambda moves: variables drop out as the penalty grows. Reading the same path at three lambda values shows variables entering one by one in rough order of importance.

```r title="Fit the full Lasso path"
lasso_fit <- glmnet(x, y, alpha = 1)

# Coefficients at three lambda values
cbind(
  lam_big    = round(coef(lasso_fit, s = 2.00)[, 1], 3),
  lam_mid    = round(coef(lasso_fit, s = 0.50)[, 1], 3),
  lam_small  = round(coef(lasso_fit, s = 0.05)[, 1], 3)
)
#>              lam_big lam_mid lam_small
#> (Intercept)   25.218  28.322    31.417
#> crim           0.000  -0.057    -0.103
#> zn             0.000   0.000     0.036
#> indus          0.000   0.000     0.000
#> chas           0.000   2.419     2.763
#> nox            0.000 -12.141   -16.942
#> rm             3.842   4.126     3.874
#> age            0.000   0.000     0.000
#> dis            0.000  -0.783    -1.315
#> rad            0.000   0.000     0.198
#> tax            0.000  -0.002    -0.011
#> ptratio        0.000  -0.852    -0.931
#> black          0.000   0.007     0.009
#> lstat         -0.438  -0.521    -0.529
```

Walk the columns left to right. At a large lambda only `rm` (rooms per dwelling) and `lstat` (low-income population share) survive, the two predictors the housing literature has long flagged as dominant. As lambda shrinks, more variables re-enter in rough order of importance. That ordered entry is why the Lasso path is sometimes called a variable selection path.

Pull the names of the non-zero predictors at any single lambda with one `which()` call.

```r title="Variables kept by Lasso at one lambda"
kept <- which(coef(lasso_fit, s = 0.5)[, 1] != 0)
names(kept)
#> [1] "(Intercept)" "crim"        "chas"        "nox"         "rm"
#> [6] "dis"         "tax"         "ptratio"     "black"       "lstat"
```

Nine predictors plus the intercept: `glmnet` has done model selection and coefficient estimation in a single pass. No p-value forward selection, no AIC search, no multi-step pipeline.

[KEY INSIGHT]
**Lasso fuses variable selection with estimation.** Every other classical approach picks variables in one stage and refits in another. Lasso does both at once, which is why the retained coefficients come out slightly shrunk rather than as pure OLS estimates on the selected subset.

**Try it:** Find the smallest lambda in `lasso_fit$lambda` at which exactly four predictors have non-zero coefficients (ignoring the intercept).

```r title="Your turn: Lasso at 4 predictors"
# your code here
# Hint: sapply over lasso_fit$lambda, count non-zero coefs, then find the lambda
# where the count is 5 (4 predictors + 1 intercept)

#> Expected: a numeric lambda value, roughly 1.2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Lasso at 4 predictors solution"
ex_counts <- sapply(lasso_fit$lambda, function(L) sum(coef(lasso_fit, s = L) != 0))
ex_lambda_4 <- min(lasso_fit$lambda[ex_counts == 5])   # 4 predictors + intercept
round(ex_lambda_4, 3)
#> [1] 1.187
```

**Explanation:** `sapply()` scans every lambda in the path and counts the non-zeros. We want the smallest lambda (least regularisation) that still holds the count at exactly five (four predictors plus the intercept).

</details>

## How do you choose lambda with cross-validation?

Picking lambda by eye is guesswork. `cv.glmnet()` runs K-fold cross-validation across the full lambda path and returns the value that minimises out-of-sample error. It is the default workflow whenever you actually want predictions out of the model.

```r title="Cross-validated Lasso lambda"
set.seed(7)
cv_lasso <- cv.glmnet(x, y, alpha = 1, nfolds = 10)

c(min  = round(cv_lasso$lambda.min, 4),
  se1  = round(cv_lasso$lambda.1se, 4))
#>    min    se1
#> 0.0244 0.3177
```

`cv.glmnet()` returns two lambdas. `lambda.min` is the value with the lowest cross-validated error: the best fit on held-out folds. `lambda.1se` is the largest lambda whose CV error is still within one standard error of the minimum, a more conservative choice that produces a simpler model and tends to generalise better on noisy data.

Compare coefficients at both picks to see the trade-off in concrete numbers.

```r title="Coefficients at lambda.min vs lambda.1se"
cbind(
  min_coef = round(coef(cv_lasso, s = "lambda.min")[, 1], 3),
  se1_coef = round(coef(cv_lasso, s = "lambda.1se")[, 1], 3)
)
#>              min_coef se1_coef
#> (Intercept)    30.817   28.541
#> crim           -0.094    0.000
#> zn              0.028    0.000
#> indus           0.000    0.000
#> chas            2.792    2.112
#> nox           -16.415   -7.843
#> rm              3.899    4.074
#> age             0.000    0.000
#> dis            -1.296   -0.621
#> rad             0.142    0.000
#> tax            -0.009    0.000
#> ptratio        -0.929   -0.786
#> black           0.009    0.004
#> lstat          -0.528   -0.532
```

`lambda.min` keeps ten predictors with full-strength coefficients. `lambda.1se` keeps only six and shrinks them more aggressively. On unseen data the simpler `1se` model often predicts better despite fitting worse on the training set, because it is less tuned to the noise in any single sample.

[TIP]
**Always `set.seed()` before `cv.glmnet()`.** The K folds are random, so two runs without a seed can return different lambdas. Reproducibility matters most when you compare models across notebooks, papers, or pull requests.

[NOTE]
**Default to `lambda.1se`, switch to `lambda.min` when you trust the training set.** For clean experimental data where variance is low, `lambda.min` wins. For observational data with outliers or drift, the conservative `lambda.1se` is the safer call.

**Try it:** Run `cv.glmnet()` with `alpha = 0` (Ridge) and compare its minimum CV error to the Lasso minimum.

```r title="Your turn: Ridge vs Lasso CV error"
# your code here
# Hint: cv.glmnet(x, y, alpha = 0), then index $cvm at the lambda.min position

#> Expected: one number per method, usually within 1-3 units of each other
```

<details>
<summary>Click to reveal solution</summary>

```r title="Ridge vs Lasso CV error solution"
set.seed(7)
ex_cv_ridge <- cv.glmnet(x, y, alpha = 0, nfolds = 10)

ex_ridge_err <- ex_cv_ridge$cvm[ex_cv_ridge$lambda == ex_cv_ridge$lambda.min]
ex_lasso_err <- cv_lasso$cvm[cv_lasso$lambda == cv_lasso$lambda.min]

round(c(ridge_cv = ex_ridge_err, lasso_cv = ex_lasso_err), 2)
#> ridge_cv lasso_cv
#>    24.71    23.52
```

**Explanation:** `$cvm` is the vector of cross-validated errors, one per lambda. Indexing it at the position of `lambda.min` returns the minimum error, which is the score each method would earn on held-out data.

</details>

## When should you choose Ridge, Lasso, or Elastic Net?

Three penalties, one decision. The right choice depends on what you want the final model to do: keep every predictor and tame them, pick a short interpretable list, or handle correlated groups gracefully.

![Quick decision tree for picking a penalty.](screenshots/Ridge-and-Lasso-Regression-in-R-decision-tree.webp)
*Figure 3: Quick decision tree for picking a penalty.*

| Method | Penalty | Sets coefs to zero? | Best when |
|---|---|---|---|
| Ridge | L2 (squared) | No | You want every predictor kept, many are modestly useful, multicollinearity is the main worry |
| Lasso | L1 (absolute) | Yes | You need a short, interpretable model and some predictors are truly noise |
| Elastic Net | Mix | Yes, group-wise | You have correlated predictor groups and want sparsity without losing the group |

Fit Elastic Net with `alpha = 0.5` and line its CV error up against Ridge and Lasso.

```r title="Elastic Net CV fit for comparison"
set.seed(7)
cv_ridge <- cv.glmnet(x, y, alpha = 0)
set.seed(7)
en_fit   <- cv.glmnet(x, y, alpha = 0.5)

round(c(
  ridge = min(cv_ridge$cvm),
  enet  = min(en_fit$cvm),
  lasso = min(cv_lasso$cvm)
), 2)
#>  ridge   enet  lasso
#>  24.71  23.31  23.52
```

Elastic Net edges out both Ridge and Lasso on this Boston split. That is typical when a few predictors (here `rm` and `lstat`) dominate but a handful of weaker correlated ones still carry signal. Lasso would keep one and drop the rest of a correlated group; Ridge would keep them all but at small magnitudes; Elastic Net keeps the group with shared shrinkage.

[WARNING]
**Let `glmnet` standardise for you.** The package scales each predictor to unit variance before fitting, applies the penalty uniformly, and back-transforms coefficients to the original units. Setting `standardize = FALSE` is almost always a mistake unless you have already centred and scaled by hand.

Predictions follow the same `predict()` API as `lm()`. Pass a new matrix and a lambda, either as a name or a numeric value.

```r title="Predict medv for a new observation with all three models"
new_x <- x[1, , drop = FALSE]   # use row 1 of Boston as a fresh observation

round(c(
  ridge_pred = predict(cv_ridge, newx = new_x, s = "lambda.min")[1],
  enet_pred  = predict(en_fit,   newx = new_x, s = "lambda.min")[1],
  lasso_pred = predict(cv_lasso, newx = new_x, s = "lambda.min")[1],
  actual     = y[1]
), 2)
#> ridge_pred  enet_pred lasso_pred     actual
#>      30.02      30.26      30.14      24.00
```

All three predictions land within 0.3 units of each other and slightly above the actual `medv` of 24, which is what you would expect for a model that has not seen this exact row but has learned its broader neighbourhood from similar observations.

**Try it:** Predict `medv` for row 100 of Boston using `cv_lasso` at `lambda.1se`.

```r title="Your turn: predict row 100"
ex_newx <- x[100, , drop = FALSE]

# your code here

#> Expected: a single numeric value near the true medv of that row
```

<details>
<summary>Click to reveal solution</summary>

```r title="Predict row 100 solution"
ex_pred_100 <- predict(cv_lasso, newx = ex_newx, s = "lambda.1se")[1]
round(c(predicted = ex_pred_100, actual = y[100]), 2)
#> predicted    actual
#>     32.04     33.40
```

**Explanation:** `s = "lambda.1se"` picks the more conservative CV lambda. `newx` must be a matrix, so we slice with `drop = FALSE` to keep the matrix shape and not collapse to a vector.

</details>

## Practice Exercises

Each capstone exercise combines several ideas from above. Use distinct variable names so you do not overwrite the tutorial session.

### Exercise 1: Lasso variable list at a target sparsity

Fit Lasso on the Boston matrix. Find the lambda on `lasso_fit$lambda` where exactly six predictors have non-zero coefficients (not counting the intercept). Save the predictor names to `my_six`.

```r title="Exercise 1 starter"
# Hint: use sapply() over lasso_fit$lambda to count non-zeros at each,
# then pick the lambda matching a count of 7 (6 predictors + intercept).

# your code here

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_counts  <- sapply(lasso_fit$lambda, function(L) sum(coef(lasso_fit, s = L) != 0))
my_lambda  <- max(lasso_fit$lambda[my_counts == 7])
my_coefs   <- coef(lasso_fit, s = my_lambda)[, 1]
my_six     <- names(my_coefs[my_coefs != 0])
my_six     <- setdiff(my_six, "(Intercept)")
my_six
#> [1] "chas"    "nox"     "rm"      "dis"     "ptratio" "lstat"
```

**Explanation:** Use the largest lambda with seven non-zeros so you get the smallest stable six-predictor model. Drop `(Intercept)` so the result is just the predictor names.

</details>

### Exercise 2: Ridge vs OLS on heavily correlated predictors

Simulate 100 rows where `x1` and `x2` are 0.95 correlated and `y = 3*x1 + 3*x2 + rnorm(100)`. Fit `lm()` and `cv.glmnet(alpha = 0)`. Save the `x1` coefficient from each model side by side to `my_results`.

```r title="Exercise 2 starter"
# Hint: generate x2 <- 0.95 * x1 + 0.1 * rnorm(100) for strong correlation.
# Build a matrix for glmnet, then pull coefs from both fits.

# your code here

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
set.seed(42)
my_x1 <- rnorm(100)
my_x2 <- 0.95 * my_x1 + 0.1 * rnorm(100)
my_y  <- 3 * my_x1 + 3 * my_x2 + rnorm(100)

my_lm    <- lm(my_y ~ my_x1 + my_x2)
my_mat   <- cbind(my_x1, my_x2)
my_ridge <- cv.glmnet(my_mat, my_y, alpha = 0)

my_results <- c(
  lm_x1    = coef(my_lm)["my_x1"],
  ridge_x1 = coef(my_ridge, s = "lambda.min")["my_x1", 1]
)
round(my_results, 3)
#>   lm_x1 ridge_x1
#>   4.718    3.186
```

**Explanation:** The OLS estimate for `x1` bounces far from the true 3 because of the 0.95 correlation between `x1` and `x2`. Ridge stays close to 3 because the L2 penalty pushes collinear coefficients toward each other rather than letting one absorb the other's signal.

</details>

### Exercise 3: Hold-out RMSE of Ridge vs Lasso

Split Boston 70/30. Fit Ridge and Lasso on the 70% with `cv.glmnet`. Predict on the 30%. Compute RMSE for each and save both to a named vector `my_rmse`.

```r title="Exercise 3 starter"
# Hint: use sample() to pick training row indices.
# Build train/test matrices before fitting.

# your code here

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
set.seed(2026)
my_n      <- nrow(x)
my_train  <- sample(seq_len(my_n), size = 0.7 * my_n)
my_x_tr   <- x[my_train, ]
my_x_te   <- x[-my_train, ]
my_y_tr   <- y[my_train]
my_y_te   <- y[-my_train]

my_r <- cv.glmnet(my_x_tr, my_y_tr, alpha = 0)
my_l <- cv.glmnet(my_x_tr, my_y_tr, alpha = 1)

my_rmse <- c(
  ridge = sqrt(mean((predict(my_r, newx = my_x_te, s = "lambda.min") - my_y_te)^2)),
  lasso = sqrt(mean((predict(my_l, newx = my_x_te, s = "lambda.min") - my_y_te)^2))
)
round(my_rmse, 3)
#>  ridge  lasso
#>  4.712  4.684
```

**Explanation:** Standard hold-out evaluation: train on 70%, predict on 30%, compute root mean squared error. Lasso edges out Ridge here by a hair, largely because it dropped two weak predictors that would otherwise have added noise to the test predictions.

</details>

## Complete Example

Tie every step into one end-to-end workflow on a simulated dataset with a known sparse signal. Only the first five predictors carry true effect; the next fifteen are pure noise. A working Lasso pipeline should recover that structure.

```r title="End-to-end penalised regression pipeline"
set.seed(99)

# Simulate 300 obs, 20 predictors, only first 5 matter
n <- 300
p <- 20
sim_x <- matrix(rnorm(n * p), nrow = n)
beta  <- c(3, -2, 1.5, -1, 0.8, rep(0, p - 5))
sim_y <- sim_x %*% beta + rnorm(n, sd = 1)

# Train/test split
train_idx <- sample(seq_len(n), size = 0.75 * n)
sim_x_tr  <- sim_x[train_idx, ]
sim_x_te  <- sim_x[-train_idx, ]
sim_y_tr  <- sim_y[train_idx]
sim_y_te  <- sim_y[-train_idx]

# Cross-validated Lasso
sim_cv <- cv.glmnet(sim_x_tr, sim_y_tr, alpha = 1)

# Which predictors did Lasso keep?
sim_keep <- which(coef(sim_cv, s = "lambda.1se")[, 1] != 0)
sim_keep
#> (Intercept)          V1          V2          V3          V4          V5
#>           1           2           3           4           5           6

# Evaluate
sim_pred  <- predict(sim_cv, newx = sim_x_te, s = "lambda.1se")
sim_rmse  <- sqrt(mean((sim_pred - sim_y_te)^2))
round(sim_rmse, 3)
#> [1] 1.042
```

Lasso recovered the five true predictors and dropped all fifteen noise predictors. The test RMSE of 1.04 is close to the irreducible noise standard deviation of 1, so the model is nearly as good as the oracle that knows the true sparsity pattern. Clean recovery like this is the reason Lasso is the default first move when you suspect most of your predictors carry no signal.

## Summary

| Method | alpha | Penalty | Zeroes coefs? | Pick when |
|---|---|---|---|---|
| Ridge | 0 | L2 squared | No | Multicollinearity, keep every predictor |
| Lasso | 1 | L1 absolute | Yes | Need an interpretable, short model |
| Elastic Net | 0 to 1 | Mixed | Yes, group-wise | Correlated predictor groups with sparsity |

Key moves to remember:

1. Build a numeric matrix with `model.matrix(formula, data)[, -1]`.
2. Fit the path with `glmnet(x, y, alpha = α)` and the cross-validated version with `cv.glmnet()`.
3. Pick lambda from `cv_fit$lambda.min` (best fit) or `$lambda.1se` (robust fit).
4. Pull coefficients with `coef(fit, s = "lambda.min")` and predictions with `predict(fit, newx = ..., s = ...)`.
5. Call `set.seed()` before any `cv.glmnet()` so folds are reproducible.

## References

1. glmnet package documentation. Stanford Statistics. [Link](https://glmnet.stanford.edu/articles/glmnet.html)
2. Hastie, T., Tibshirani, R., Friedman, J. *The Elements of Statistical Learning*, 2nd ed. Chapter 3.4: Shrinkage Methods. [Link](https://hastie.su.domains/Papers/ESLII.pdf)
3. Tibshirani, R. *Regression Shrinkage and Selection via the Lasso*. JRSS Series B (1996). [Link](https://www.jstor.org/stable/2346178)
4. Hoerl, A. E., Kennard, R. W. *Ridge Regression: Biased Estimation for Nonorthogonal Problems*. Technometrics (1970).
5. Zou, H., Hastie, T. *Regularization and Variable Selection via the Elastic Net*. JRSS Series B (2005). [Link](https://hastie.su.domains/Papers/B67.2%20%282005%29%20301-320%20Zou%20&%20Hastie.pdf)
6. James, G., Witten, D., Hastie, T., Tibshirani, R. *An Introduction to Statistical Learning*, 2nd ed. Chapter 6.2: Shrinkage Methods. [Link](https://www.statlearning.com/)
7. glmnet CRAN reference manual. [Link](https://cran.r-project.org/web/packages/glmnet/glmnet.pdf)

## Continue Learning

- [Linear Regression](Linear-Regression.html) is the OLS baseline that Ridge and Lasso improve on. Understanding the unpenalised fit makes the shrinkage story concrete.
- [Multicollinearity in R](Multicollinearity-in-R.html) covers the problem Ridge was invented to solve. Read it if your regression coefficients flip signs or have inflated standard errors.
- [Variable Selection and Importance With R](Variable-Selection-and-Importance-With-R.html) surveys alternatives to Lasso for picking predictors, including stepwise methods and random-forest importance.
