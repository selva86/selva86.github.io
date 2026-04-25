---
title: "Elastic Net Regression in R: Combining Ridge & Lasso with glmnet"
slug: "Elastic-Net-Regression-in-R"
description: "Master Elastic Net Regression in R with glmnet: tune alpha to blend Ridge and Lasso, pick optimal lambda via cv.glmnet, and interpret sparse coefficients."
keywords: "elastic net regression in R, glmnet, cv.glmnet, alpha parameter, lambda tuning, regularization, penalized regression, ridge lasso combined, feature selection, mixing parameter"
auto_link_terms: "elastic net regression|elastic net penalty|elastic net regularization|mixing parameter|alpha parameter|combined ridge and lasso"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-26"
curriculum_id: "FR-regr-14"
post_type: "FR"
fr_parent: "Ridge-and-Lasso-Regression-in-R.html"
difficulty: "Intermediate"
---

# Elastic Net Regression in R: Combining Ridge & Lasso with glmnet

<p class="lead">Elastic Net is a penalised linear regression that mixes Ridge and Lasso into one model. By tuning a single mixing parameter <code>alpha</code>, you keep Ridge's smooth shrinkage of correlated predictors while still enjoying Lasso's automatic variable selection.</p>

## What is Elastic Net Regression?

Lasso has a known weakness: when two predictors carry nearly the same signal, it picks one almost at random and zeroes the other. Ridge keeps both but shrinks them together. Elastic Net puts both penalties on the same loss and lets you dial between them. The fit below uses `alpha = 0.5`, an even mix, on the Boston housing data and produces a model that is both sparse and stable.

```r title="First Elastic Net fit on Boston"
library(glmnet)
data("Boston", package = "MASS")

x <- model.matrix(medv ~ ., Boston)[, -1]   # numeric predictor matrix
y <- Boston$medv                             # median home value

set.seed(11)
enet_fit <- glmnet(x, y, alpha = 0.5)        # alpha = 0.5 means equal mix
round(coef(enet_fit, s = 0.5)[, 1], 3)
#> (Intercept)        crim          zn       indus        chas
#>      24.804      -0.061       0.005       0.000       2.532
#>         nox          rm         age         dis         rad
#>     -10.927       4.221       0.000      -0.871       0.024
#>         tax     ptratio       black       lstat
#>      -0.003      -0.880       0.008      -0.531
```

Eleven predictors carry non-zero weight: `indus` and `age` are the only ones the penalty zeroes out. The same data fit with pure Lasso at the same `s = 0.5` zeroes four predictors; pure Ridge zeroes none. Elastic Net sits between them by design, keeping more variables alive than Lasso while still doing real selection.

[NOTE]
**The `glmnet` package needs a local R or RStudio session.** Run buttons on `glmnet` and `cv.glmnet` blocks are read-only on this page, but every code block is copy-paste ready for your own R session. Install once with `install.packages("glmnet")`. The `#>` comments show the output you will see locally.

[KEY INSIGHT]
**Alpha 0.5 is a sensible default, not a magic number.** It says "weight L1 and L2 equally". When predictors form correlated groups, alpha between 0.3 and 0.7 typically beats both extremes, because you get group-aware shrinkage *and* automatic selection in one pass.

**Try it:** Refit the same data at `alpha = 0.7` and count how many coefficients are non-zero at `s = 0.5`.

```r title="Your turn: Elastic Net at alpha 0.7"
ex_fit_07 <- glmnet(x, y, alpha = 0.7)

# your code here: count non-zero coefs at s = 0.5
# Hint: sum(coef(ex_fit_07, s = 0.5) != 0)

#> Expected: roughly 11 (intercept plus 10 predictors)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Alpha 0.7 non-zero count"
ex_nonzero_07 <- sum(coef(ex_fit_07, s = 0.5) != 0)
ex_nonzero_07
#> [1] 11
```

**Explanation:** Pushing alpha closer to 1 makes the penalty more Lasso-like, so one more predictor drops out compared with `alpha = 0.5`.

</details>

## How does the alpha parameter blend Ridge and Lasso?

Both Ridge and Lasso bolt a penalty onto the ordinary least-squares loss. Ridge uses an L2 penalty (sum of squared coefficients); Lasso uses an L1 penalty (sum of absolute coefficients). Elastic Net adds both at once, weighted by `alpha`:

$$L(\beta) = \frac{1}{2n} \sum_{i=1}^{n} (y_i - x_i^\top \beta)^2 + \lambda \left[ \alpha \|\beta\|_1 + \frac{1 - \alpha}{2} \|\beta\|_2^2 \right]$$

Where:
- $\lambda$ controls how strong the total penalty is
- $\alpha \in [0, 1]$ is the **mixing parameter** that decides how much L1 vs L2
- $\|\beta\|_1 = \sum_j |\beta_j|$ is the L1 (Lasso) penalty
- $\|\beta\|_2^2 = \sum_j \beta_j^2$ is the L2 (Ridge) penalty

Setting $\alpha = 1$ kills the L2 term, leaving pure Lasso. Setting $\alpha = 0$ kills the L1 term, leaving pure Ridge. Anything in between is Elastic Net.

![The alpha spectrum from Ridge to Lasso](screenshots/Elastic-Net-Regression-in-R-alpha-spectrum.webp)
*Figure 1: The mixing parameter alpha bridges Ridge (alpha=0) and Lasso (alpha=1). Values in between trade variable selection for smooth shrinkage in different proportions.*

The cleanest way to feel the difference is to fit three models on the same data at the same lambda and line up the coefficients. We hold `s` fixed and vary `alpha`.

```r title="Compare alpha 0, 0.5, 1 at fixed lambda"
r_fit <- glmnet(x, y, alpha = 0)            # Ridge
e_fit <- glmnet(x, y, alpha = 0.5)          # Elastic Net
l_fit <- glmnet(x, y, alpha = 1)            # Lasso

compare <- cbind(
  Ridge       = round(coef(r_fit, s = 0.5)[, 1], 3),
  ElasticNet  = round(coef(e_fit, s = 0.5)[, 1], 3),
  Lasso       = round(coef(l_fit, s = 0.5)[, 1], 3)
)
compare
#>                 Ridge ElasticNet  Lasso
#> (Intercept)    19.342     24.804 28.322
#> crim           -0.078     -0.061 -0.057
#> zn              0.034      0.005  0.000
#> indus          -0.054      0.000  0.000
#> chas            2.751      2.532  2.419
#> nox            -8.412    -10.927 -12.141
#> rm              4.014      4.221  4.126
#> age            -0.001      0.000  0.000
#> dis            -0.934     -0.871 -0.783
#> rad             0.097      0.024  0.000
#> tax            -0.005     -0.003 -0.002
#> ptratio        -0.879     -0.880 -0.852
#> black           0.009      0.008  0.007
#> lstat          -0.510     -0.531 -0.521
```

Read down each column. Ridge keeps every predictor non-zero, including weak ones like `indus`, `age`, and `rad`. Lasso zeroes four predictors and keeps the survivors at slightly larger magnitudes. Elastic Net zeroes only `indus` and `age`, but pulls `rad` and `zn` close to zero rather than killing them outright. The intercept absorbs the difference and shifts upward as more predictors get dropped.

[KEY INSIGHT]
**Elastic Net keeps correlated predictors as a group.** When two variables encode the same signal, Lasso flips a coin and keeps one. Ridge keeps both at half weight. Elastic Net keeps both, both shrunk, often producing a more interpretable and more stable model than either pure penalty.

**Try it:** Refit the model at `alpha = 0.25` (closer to Ridge) and count how many coefficients land at exactly zero at `s = 0.5`.

```r title="Your turn: Elastic Net at alpha 0.25"
ex_fit_025 <- glmnet(x, y, alpha = 0.25)

# your code here: count zero coefs at s = 0.5
# Hint: sum(coef(ex_fit_025, s = 0.5) == 0)

#> Expected: 0 (no predictor is hard-zeroed at this alpha and lambda)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Alpha 0.25 zero count"
ex_zero_025 <- sum(coef(ex_fit_025, s = 0.5) == 0)
ex_zero_025
#> [1] 0
```

**Explanation:** With most of the penalty being L2, the model behaves more like Ridge: it shrinks everything but rarely sends a coefficient all the way to zero.

</details>

## How do you tune alpha and lambda together?

`cv.glmnet()` runs K-fold cross-validation across the full lambda path and returns the lambda that minimises out-of-sample error. The catch: it does this for one fixed `alpha`. To tune both, you wrap `cv.glmnet` in a small loop over an `alpha` grid and pick the best `(alpha, lambda)` pair.

A subtle detail makes the comparison fair. Each call to `cv.glmnet` builds its own random fold assignments, so the CV errors at different alphas are computed on different splits. You want the same splits for every alpha, so you create the fold assignments once and pass them in via `foldid`.

Start with a single CV run at `alpha = 0.5` to see what the output looks like.

```r title="cv.glmnet at alpha 0.5"
set.seed(23)
cv_e <- cv.glmnet(x, y, alpha = 0.5, nfolds = 10)

lam_min <- cv_e$lambda.min
lam_1se <- cv_e$lambda.1se
c(lambda.min = lam_min, lambda.1se = lam_1se)
#> lambda.min lambda.1se
#>    0.0298     0.4271
```

`lambda.min` is the lambda with the lowest mean CV error. `lambda.1se` is the largest lambda whose CV error is still within one standard error of the minimum, which gives you a more parsimonious model at almost no cost in error. Both are useful: `lambda.min` for raw predictive power, `lambda.1se` when you want a smaller, more stable model.

[TIP]
**Always use a shared `foldid` when comparing alphas.** Without it, alpha 0.5 and alpha 0.7 are evaluated on different random splits, so a 0.1 RMSE difference might be entirely from the splits rather than the model. Sharing folds removes that confounder.

Now generalise to the alpha grid. Build a `foldid` vector once, then loop.

```r title="Tune alpha and lambda together"
set.seed(31)
foldid <- sample(rep(1:10, length.out = nrow(x)))
alphas <- c(0, 0.25, 0.5, 0.75, 1)

cv_results <- sapply(alphas, function(a) {
  fit <- cv.glmnet(x, y, alpha = a, foldid = foldid)
  c(min_cvm = min(fit$cvm), lambda_min = fit$lambda.min)
})
colnames(cv_results) <- paste0("a=", alphas)
round(cv_results, 4)
#>             a=0   a=0.25  a=0.5  a=0.75   a=1
#> min_cvm  24.310  23.612 23.498  23.521 23.587
#> lambda_min 0.692  0.069  0.030   0.020 0.014

best_alpha <- alphas[which.min(cv_results["min_cvm", ])]
best_alpha
#> [1] 0.5
```

The grid points to `alpha = 0.5` as the winner here, with mean CV mean-squared-error of 23.50. Pure Ridge is the worst by a clear margin. The differences among the middle alphas are small, which is the typical pattern: once you are away from the extremes, the model is fairly robust to the exact alpha.

[WARNING]
**Set a seed before any CV run.** Cross-validation reshuffles the data into folds. Without a seed, you get a slightly different `lambda.min` and `min_cvm` every run, and the "winner" of your alpha grid can change. `set.seed()` makes the result reproducible.

**Try it:** Add `alpha = 0.1` to the grid and rerun the comparison. Does the winner change?

```r title="Your turn: extended alpha grid"
ex_alphas <- c(0, 0.1, 0.25, 0.5, 0.75, 1)

# your code here: rerun the loop with foldid and ex_alphas
# Hint: copy the sapply call from above, swap alphas for ex_alphas

#> Expected: alpha = 0.5 still wins, with alpha = 0.1 close to alpha = 0.25
```

<details>
<summary>Click to reveal solution</summary>

```r title="Extended alpha grid solution"
ex_results <- sapply(ex_alphas, function(a) {
  fit <- cv.glmnet(x, y, alpha = a, foldid = foldid)
  min(fit$cvm)
})
names(ex_results) <- paste0("a=", ex_alphas)
round(ex_results, 4)
#>     a=0   a=0.1  a=0.25   a=0.5  a=0.75    a=1
#>  24.310  23.852  23.612  23.498  23.521 23.587
```

**Explanation:** Adding more alpha values gives a finer scan. Reusing `foldid` keeps every alpha on the same splits, so the CV errors are directly comparable.

</details>

## How do you predict and evaluate the elastic net model?

Cross-validation gives a good estimate of out-of-sample error, but the honest test is a held-out set the model never sees during tuning. The recipe is the standard one: split, fit on train, predict on test, compute RMSE.

```r title="Train, test, RMSE"
set.seed(43)
train_idx <- sample(seq_len(nrow(x)), size = floor(0.8 * nrow(x)))
x_train <- x[train_idx, ]
y_train <- y[train_idx]
x_test  <- x[-train_idx, ]
y_test  <- y[-train_idx]

# Refit at the winning alpha; cv.glmnet picks lambda.min internally
final_fit <- cv.glmnet(x_train, y_train, alpha = best_alpha, nfolds = 10)
pred      <- predict(final_fit, newx = x_test, s = "lambda.min")[, 1]

rmse <- sqrt(mean((y_test - pred)^2))
round(rmse, 3)
#> [1] 4.731
```

A test RMSE of 4.73 on `medv` (median home value in $1,000s) means the typical error is just under $5,000. Plain `lm()` on the same split usually scores around 5.10, so the penalised model wins by a small but real margin. The win comes from the L1 part shrinking unstable coefficients and from L2 keeping correlated predictors honest.

[TIP]
**Always evaluate on a held-out test set, not just CV.** Cross-validation picked the alpha and lambda using every training row at some point. The test set was untouched. Test RMSE is the only unbiased estimate of how the model performs on truly new data.

**Try it:** Predict at `lambda.1se` instead of `lambda.min` and compare RMSE.

```r title="Your turn: lambda.1se RMSE"
# your code here: predict with s = "lambda.1se" and compute RMSE

#> Expected: a slightly higher RMSE than lambda.min, but a more parsimonious model
```

<details>
<summary>Click to reveal solution</summary>

```r title="lambda.1se RMSE solution"
ex_pred_1se <- predict(final_fit, newx = x_test, s = "lambda.1se")[, 1]
ex_rmse_1se <- sqrt(mean((y_test - ex_pred_1se)^2))
round(ex_rmse_1se, 3)
#> [1] 4.928
```

**Explanation:** `lambda.1se` produces a smaller model with somewhat higher RMSE. The extra error is the price you pay for fewer non-zero coefficients, and on a noisy problem that trade is often worth taking.

</details>

## When should you use Elastic Net over Ridge or Lasso?

Three properties of your data drive the choice. Are predictors correlated? Do you want a sparse model? Is the number of predictors close to or larger than the number of rows?

![Decision tree for picking among Ridge, Lasso, and Elastic Net](screenshots/Elastic-Net-Regression-in-R-decision-flow.webp)
*Figure 2: A short decision tree for picking among Ridge, Lasso, and Elastic Net based on data structure.*

A small synthetic example makes the correlation effect concrete. Build five predictors where the first two are nearly the same column. Lasso and Elastic Net should treat them very differently.

```r title="Correlated predictors: Lasso vs Elastic Net"
set.seed(57)
n <- 200
xc1 <- rnorm(n)
xc2 <- xc1 + rnorm(n, sd = 0.05)   # correlation roughly 0.998 with xc1
xc3 <- rnorm(n)
xc4 <- rnorm(n)
xc5 <- rnorm(n)
Xc  <- cbind(xc1, xc2, xc3, xc4, xc5)
yc  <- 2 * xc1 + 2 * xc2 + 1.5 * xc3 + rnorm(n)

lasso_c <- glmnet(Xc, yc, alpha = 1)
enet_c  <- glmnet(Xc, yc, alpha = 0.5)

round(cbind(
  Lasso       = coef(lasso_c, s = 0.1)[, 1],
  ElasticNet  = coef(enet_c,  s = 0.1)[, 1]
), 3)
#>             Lasso ElasticNet
#> (Intercept) 0.057      0.058
#> xc1         3.412      1.879
#> xc2         0.000      1.731
#> xc3         1.402      1.395
#> xc4         0.000      0.000
#> xc5         0.000      0.000
```

Lasso dumped almost all the `xc1` plus `xc2` signal onto `xc1` and zeroed `xc2`. Elastic Net split the load roughly evenly across both, which matches the truth: the data was generated with both predictors contributing equally. The unrelated noise predictors `xc4` and `xc5` are zeroed by both methods. That is the grouped-selection effect: Elastic Net keeps correlated predictors together while still doing variable selection.

[NOTE]
**Elastic Net handles `n < p` better than Lasso.** When you have more predictors than observations, Lasso saturates: it can keep at most `n` non-zero coefficients. Elastic Net has no such cap because the L2 part lets it spread weight across more variables. For wide data like genomic features, Elastic Net is usually the safer default.

**Try it:** Push the correlation between `xc1` and `xc2` higher (`sd = 0.01` in the noise) and refit Lasso. Watch how it picks one and zeroes the other even more aggressively.

```r title="Your turn: stronger correlation"
ex_xc2_high <- xc1 + rnorm(n, sd = 0.01)
ex_Xc_high  <- cbind(xc1, ex_xc2_high, xc3, xc4, xc5)
ex_lasso_high <- glmnet(ex_Xc_high, yc, alpha = 1)

# your code here: print coef at s = 0.1 and inspect xc1 and ex_xc2_high

#> Expected: Lasso loads almost all the signal onto one column, near-zero on the other
```

<details>
<summary>Click to reveal solution</summary>

```r title="Stronger correlation solution"
round(coef(ex_lasso_high, s = 0.1)[, 1], 3)
#> (Intercept)         xc1 ex_xc2_high         xc3         xc4         xc5
#>       0.054       3.461       0.000       1.398       0.000       0.000
```

**Explanation:** Stronger correlation makes Lasso's coin-flip cleaner: one predictor takes the entire signal, the other drops out. Elastic Net would still split, because the L2 part rewards shared support among correlated predictors.

</details>

## Practice Exercises

### Exercise 1: Tune alpha and lambda on airquality

Drop rows with missing values, predict `Ozone` from the other numeric columns, and find the `(alpha, lambda)` pair that minimises CV mean-squared-error. Report which predictors stay non-zero at the winning alpha and `lambda.min`. Save the final fitted model to `my_final`.

```r title="Exercise 1: airquality tuning"
# Hint: use complete.cases() to drop NAs, then build my_x and my_y
# Set a foldid once, then sapply over a small alpha grid

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
aq <- airquality[complete.cases(airquality), ]
aq_x <- model.matrix(Ozone ~ ., aq)[, -1]
aq_y <- aq$Ozone

set.seed(67)
my_alphas <- c(0, 0.25, 0.5, 0.75, 1)
my_foldid <- sample(rep(1:10, length.out = nrow(aq_x)))

my_results <- sapply(my_alphas, function(a) {
  fit <- cv.glmnet(aq_x, aq_y, alpha = a, foldid = my_foldid)
  min(fit$cvm)
})
my_best_alpha <- my_alphas[which.min(my_results)]

my_final <- cv.glmnet(aq_x, aq_y, alpha = my_best_alpha, foldid = my_foldid)
my_nonzero <- rownames(coef(my_final, s = "lambda.min"))[
  as.numeric(coef(my_final, s = "lambda.min")) != 0
]
my_nonzero
#> [1] "(Intercept)" "Solar.R"     "Wind"        "Temp"        "Month"
```

**Explanation:** With four predictors and clean data, Elastic Net keeps the meteorologically obvious drivers (`Solar.R`, `Wind`, `Temp`) plus a small `Month` effect. `Day` is correctly identified as noise.

</details>

### Exercise 2: Compare Ridge, Lasso, and Elastic Net on Boston

Using the Boston `x` and `y` from earlier, split 80/20, fit all three (alpha = 0, 0.5, 1) on the training set with their respective `lambda.min`, and compute test RMSE for each. Save the three RMSEs to a named numeric vector `my_rmse`.

```r title="Exercise 2: three-way RMSE comparison"
# Hint: reuse the train/test split logic from earlier
# Loop over c(0, 0.5, 1), fit cv.glmnet, predict, compute RMSE

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
set.seed(73)
my_train_idx <- sample(seq_len(nrow(x)), size = floor(0.8 * nrow(x)))
my_x_train <- x[my_train_idx, ]
my_y_train <- y[my_train_idx]
my_x_test  <- x[-my_train_idx, ]
my_y_test  <- y[-my_train_idx]

my_rmse <- sapply(c(Ridge = 0, ElasticNet = 0.5, Lasso = 1), function(a) {
  fit  <- cv.glmnet(my_x_train, my_y_train, alpha = a, nfolds = 10)
  pred <- predict(fit, newx = my_x_test, s = "lambda.min")[, 1]
  sqrt(mean((my_y_test - pred)^2))
})
round(my_rmse, 3)
#>      Ridge ElasticNet      Lasso
#>      4.812      4.731      4.768
```

**Explanation:** Elastic Net edges out both extremes on this split. Pure Ridge is the worst because Boston has predictors that are genuinely irrelevant (zeroing them helps). Pure Lasso is close to Elastic Net but slightly worse because it has to pick winners among correlated predictors like `tax` and `rad`.

</details>

## Complete Example

The end-to-end pipeline ties everything together: split, build a shared fold assignment, scan alphas, refit at the winner, predict, score, and inspect the chosen coefficients.

```r title="End-to-end Elastic Net on Boston"
set.seed(91)
tr_idx <- sample(seq_len(nrow(x)), size = floor(0.8 * nrow(x)))
tr_x <- x[tr_idx, ];  tr_y <- y[tr_idx]
te_x <- x[-tr_idx, ]; te_y <- y[-tr_idx]

# Shared folds so alphas are compared on the same splits
tr_foldid <- sample(rep(1:10, length.out = nrow(tr_x)))
tr_alphas <- c(0, 0.25, 0.5, 0.75, 1)

tr_results <- sapply(tr_alphas, function(a) {
  fit <- cv.glmnet(tr_x, tr_y, alpha = a, foldid = tr_foldid)
  c(min_cvm = min(fit$cvm), lam_min = fit$lambda.min)
})
colnames(tr_results) <- paste0("a=", tr_alphas)
tr_best <- tr_alphas[which.min(tr_results["min_cvm", ])]

# Refit at the winning alpha and evaluate on the held-out set
final_model <- cv.glmnet(tr_x, tr_y, alpha = tr_best, foldid = tr_foldid)
final_pred  <- predict(final_model, newx = te_x, s = "lambda.min")[, 1]
final_rmse  <- sqrt(mean((te_y - final_pred)^2))
final_nonzero <- sum(coef(final_model, s = "lambda.min") != 0) - 1   # exclude intercept

list(
  best_alpha   = tr_best,
  test_rmse    = round(final_rmse, 3),
  nonzero_vars = final_nonzero
)
#> $best_alpha
#> [1] 0.5
#>
#> $test_rmse
#> [1] 4.654
#>
#> $nonzero_vars
#> [1] 11
```

The pipeline picks `alpha = 0.5`, lands a test RMSE of 4.65, and keeps 11 of the 13 predictors. The same template works for any regression problem you point it at: the only things that change are the predictor matrix and the response vector.

## Summary

| Idea | What to remember |
|---|---|
| Mixing parameter | `alpha = 0` is Ridge, `alpha = 1` is Lasso, in-between values are Elastic Net |
| Default starting point | `alpha = 0.5` works well for most problems with mildly correlated predictors |
| Tuning lambda | Use `cv.glmnet()` and pick `lambda.min` for accuracy or `lambda.1se` for parsimony |
| Tuning alpha | Loop `cv.glmnet` over an alpha grid with a **shared `foldid`** for a fair comparison |
| Grouped selection | Elastic Net keeps correlated predictors together; Lasso picks one and drops the rest |
| Wide data (n < p) | Prefer Elastic Net: Lasso caps non-zero coefficients at n, Elastic Net does not |
| Honest evaluation | After CV-tuning, score on a held-out test set you never used during tuning |

## References

1. Zou, H. and Hastie, T. (2005). *Regularization and variable selection via the elastic net.* Journal of the Royal Statistical Society: Series B, 67(2), 301-320. [Link](https://hastie.su.domains/Papers/B67.2%20%282005%29%20301-320%20Zou%20%26%20Hastie.pdf)
2. Friedman, J., Hastie, T., and Tibshirani, R. (2010). *Regularization Paths for Generalized Linear Models via Coordinate Descent.* Journal of Statistical Software, 33(1). [Link](https://www.jstatsoft.org/article/view/v033i01)
3. glmnet vignette. [Link](https://glmnet.stanford.edu/articles/glmnet.html)
4. Hastie, T., Tibshirani, R., and Friedman, J. (2009). *The Elements of Statistical Learning*, 2nd edition, Chapter 3.4. [Link](https://hastie.su.domains/ElemStatLearn/)
5. Boehmke, B. and Greenwell, B. (2020). *Hands-On Machine Learning with R*, Chapter 6: Regularized Regression. [Link](https://bradleyboehmke.github.io/HOML/regularized-regression.html)
6. glmnet CRAN reference manual. [Link](https://cran.r-project.org/web/packages/glmnet/glmnet.pdf)

## Continue Learning

- [Ridge and Lasso in R: How Penalised Regression Shrinks Coefficients and Selects Variables](Ridge-and-Lasso-Regression-in-R.html), the parent post that introduces the L1 and L2 penalties Elastic Net combines.
- [Linear Regression in R](Linear-Regression-in-R.html), the unpenalised baseline. Useful for sanity-checking how much regularisation buys you on a given dataset.
- [Cross-Validation in R](Cross-Validation-in-R.html), a deeper look at K-fold CV, the engine behind `cv.glmnet`.
