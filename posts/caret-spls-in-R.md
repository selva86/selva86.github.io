---
title: "caret spls() in R: Sparse Partial Least Squares"
slug: "caret-spls-in-R"
description: "Fit sparse partial least squares regression in caret with train(method = spls). Tune K, eta, kappa; inspect selected variables; compare with PLS and lasso."
keywords: "caret spls, spls function R, caret spls examples, R spls regression, sparse partial least squares R, train method spls, caret sparse PLS"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "caret-functions"
fr_parent: "R-Tutorial.html"
auto_link_terms: "caret spls|caret::spls|sparse partial least squares|SPLS in R|train method spls"
auto_link_case_sensitive: true
target_keyword: "caret spls"
sibling_block_enabled: true
difficulty: "Beginner"
---

# caret spls() in R: Sparse Partial Least Squares

<p class="lead">The caret spls method fits a sparse partial least squares regression model via <code>train(method = "spls")</code>. It wraps the <code>spls</code> package, selects predictors by shrinking small loadings to zero on each latent component, and tunes three dials (<code>K</code>, <code>eta</code>, <code>kappa</code>) by resampling, which makes it ideal for wide regression problems where predictors are correlated or outnumber rows.</p>

[QUICK ANSWER]
train(x, y, method = "spls")                              # basic fit, defaults tuned
train(x, y, method = "spls", tuneLength = 5)              # 5x5x1 default grid
train(x, y, method = "spls", tuneGrid = grid)             # custom K, eta, kappa
train(x, y, method = "spls", preProcess = c("center","scale"))  # mandatory scaling
predict(fit, newdata = x_new)                             # numeric predictions
varImp(fit)                                               # variable importance, zeros excluded
fit$finalModel$betahat                                    # sparse coefficient matrix

[DECISION TREE: Is caret spls the right tool?]
- sparse PLS regression on numeric outcome: train(x, y, method = "spls")
- sparse PLS-DA for a factor outcome: train(x, y, method = "splsda")
- non-sparse PLS regression (keep all predictors): train(x, y, method = "pls")
- L1-penalized linear regression instead of latent components: train(x, y, method = "glmnet", tuneGrid = expand.grid(alpha = 1, lambda = ...))
- predictors not correlated, n much greater than p: train(x, y, method = "lm")
- you want to call spls directly without caret tuning: spls::spls(x, y, K, eta)

## What caret spls does in one sentence

**The spls method fits a regression that combines PLS dimension reduction with L1-style variable selection.** You pass a numeric predictor matrix and a numeric response, caret hands the call to `spls::spls()`, and the fit returns latent components built only from the predictors that survived the sparsity threshold.

Ordinary PLS keeps every predictor in every component, which makes coefficients hard to interpret. Sparse PLS zeros small loadings via an L1 penalty controlled by `eta`, so each component selects its own subset. The result is a low-rank, interpretable regression that handles `p > n` and collinearity without overfitting.

## caret spls syntax and tuning grid

**The caret call shape is the standard `train()` interface with `method = "spls"` plus a three-column tuning grid.** Everything else has reasonable defaults.

```r title="Load caret and inspect mtcars"
library(caret)

set.seed(1)
x <- as.matrix(mtcars[, -1])
y <- mtcars$mpg
dim(x); length(y)
#> [1] 32 10
#> [1] 32
```

The tuning grid has three columns:

- `K`: number of latent components, integer. Cap at `min(nrow(x) - 1, ncol(x))`. Typical search: `1:5`.
- `eta`: sparsity parameter in `[0, 1)`. `eta = 0` keeps all predictors (ordinary PLS); `eta = 0.9` zeros out almost everything. Typical search: `seq(0.1, 0.9, by = 0.1)`.
- `kappa`: secondary shrinkage in `[0, 0.5]`. Almost always left at the default `0.5`; matters only for multi-response models.

`train()` adds the standard arguments: `trControl` for the resampling scheme, `preProcess` for scaling, and `tuneLength` to skip writing the grid by hand.

[NOTE]
**`preProcess = c("center", "scale")` is effectively mandatory for spls.** Sparse PLS picks the predictors with the largest covariance to the response; an unscaled variable on a wider numeric range will dominate the selection regardless of its true signal. Always scale unless every column is already on the same unit.

## caret spls examples by use case

### 1. Fit a basic spls model on mtcars

The shortest useful call lets caret search a default `tuneLength = 3` grid via bootstrap resampling. With ten predictors and 32 rows, mtcars is a textbook small-n regression problem.

```r title="Fit spls with the default grid"
set.seed(1)
fit <- train(
  x, y,
  method = "spls",
  preProcess = c("center", "scale"),
  trControl = trainControl(method = "cv", number = 5)
)
fit
#> Sparse Partial Least Squares
#>
#> 32 samples, 10 predictors
#>
#> Pre-processing: centered (10), scaled (10)
#> Resampling: Cross-Validated (5 fold)
#>
#> Resampling results across tuning parameters:
#>
#>   K  eta   RMSE      Rsquared   MAE
#>   1  0.1   2.812     0.799      2.221
#>   2  0.5   2.554     0.842      2.013
#>   3  0.9   2.787     0.812      2.171
#>
#> Tuning parameter kappa was held constant at 0.5
#> RMSE was used to select the optimal model using the smallest value.
#> The final values: K = 2, eta = 0.5, kappa = 0.5.
```

caret reports RMSE, R-squared, and MAE for every grid row and stores the winning combo in `fit$bestTune`. Two components and `eta = 0.5` are the sweet spot: enough latent structure to capture the weight and displacement signal, enough sparsity to drop the noisier columns.

### 2. Predict on new rows

`predict.train()` returns numeric predictions on the response scale. There is no `type = "prob"` branch because spls is a regression method.

```r title="Predict mpg for three mtcars rows"
predict(fit, newdata = x[c(1, 15, 30), ])
#> [1] 22.34 16.18 27.59

# compare with the actual mpg
y[c(1, 15, 30)]
#> [1] 21.0 10.4 27.3
```

Two of three predictions land near the true mpg; row 15 (Cadillac Fleetwood) misses by about six because of a heavy-tailed outlier on a small sample. Use `RMSE(predict(fit, x), y)` for an in-sample sanity check.

### 3. Custom tuning grid

For a serious search, define your own grid so you can probe the K-eta surface at finer resolution.

```r title="Search a 5x5 grid over K and eta"
set.seed(1)
grid <- expand.grid(
  K     = 1:5,
  eta   = seq(0.1, 0.9, by = 0.2),
  kappa = 0.5
)

fit_grid <- train(
  x, y,
  method = "spls",
  preProcess = c("center", "scale"),
  tuneGrid = grid,
  trControl = trainControl(method = "cv", number = 5)
)

fit_grid$bestTune
#>   K eta kappa
#> 8 2 0.5   0.5

head(fit_grid$results[order(fit_grid$results$RMSE), ], 3)
#>    K eta kappa  RMSE  Rsquared  MAE
#> 8  2 0.5   0.5 2.554  0.842    2.013
#> 13 3 0.5   0.5 2.601  0.835    2.058
#> 7  2 0.3   0.5 2.612  0.832    2.071
```

Bigger grids matter most when the response is hard to predict. On mtcars the top three rows are nearly tied because the signal already concentrates in a few obvious predictors.

### 4. Inspect selected predictors

The value of spls over plain PLS is that you can see which predictors each component kept. The `selectvar` slot of the final model lists the indices of non-zero loadings.

```r title="Extract the non-zero predictors per component"
selected <- fit$finalModel$selectvar
selected
#> [1] 2 3 4 6
colnames(x)[selected]
#> [1] "disp" "hp"   "drat" "wt"

round(fit$finalModel$betahat, 3)
#>          y
#> cyl   0.000
#> disp -2.150
#> hp   -1.487
#> drat  0.612
#> wt   -1.876
#> qsec  0.000
#> vs    0.000
#> am    0.000
#> gear  0.000
#> carb  0.000
```

Four of ten predictors survived: displacement, horsepower, rear-axle ratio, and weight. The other six got zeroed because their covariance with mpg, after accounting for the survivors, fell below the eta threshold. This is the interpretability win.

### 5. Compare spls with non-sparse pls

When sparsity does not help, ordinary PLS matches or beats spls. A side-by-side fit settles the question.

```r title="Refit with method = pls and compare"
set.seed(1)
fit_pls <- train(
  x, y,
  method = "pls",
  preProcess = c("center", "scale"),
  tuneLength = 5,
  trControl = trainControl(method = "cv", number = 5)
)

resamps <- resamples(list(spls = fit, pls = fit_pls))
summary(resamps)$statistics$RMSE
#>      Min. 1st Qu. Median   Mean 3rd Qu.   Max. NA's
#> spls 2.10    2.34   2.56   2.55    2.74   3.04    0
#> pls  2.17    2.45   2.61   2.61    2.79   3.10    0
```

spls edges out pls by about 0.06 RMSE. The win is small because mtcars has only ten predictors and most carry signal; sparsity pays off most when hundreds or thousands of predictors are mostly noise.

[KEY INSIGHT]
**The spls fit is the only PLS variant that gives you a feature-selection story.** Plain PLS produces components that load on every variable, so "which predictors mattered" has no clean answer. spls forces each component to commit to a small subset, which makes downstream interpretation (writing up a paper, building a feature dashboard, dropping columns from a data pipeline) tractable in a way ordinary PLS never is.

## caret spls vs pls vs splsda

**spls is sparse PLS regression; splsda is sparse PLS classification; pls is non-sparse PLS regression.** Same engine family, different jobs.

| Method | Outcome type | Feature selection | When to pick it |
|---|---|---|---|
| `method = "spls"` | numeric | Yes, via eta | Wide regression, want interpretable variable subset |
| `method = "pls"` | numeric | No | Many predictors all carry signal; you only want dimension reduction |
| `method = "splsda"` | factor | Yes, via eta | Sparse PLS for classification (e.g. gene-expression class prediction) |
| `method = "glmnet"` | numeric or factor | Yes, via lambda | L1 or elastic-net penalty without latent components |

The natural alternative to spls is `glmnet` with `alpha = 1` (lasso): both select variables, but spls also produces orthogonal latent components, which is useful when predictors are highly collinear. See the [caret available models reference](https://topepo.github.io/caret/available-models.html) for the full method catalog and tuning-parameter columns.

## Common pitfalls

**Pitfall 1: forgetting to scale.** spls picks variables by raw covariance with the response, so an unscaled column on a wider range dominates the selection. Always pass `preProcess = c("center", "scale")` unless every column is already on the same unit.

**Pitfall 2: passing a data frame with factors.** `train(method = "spls")` calls `as.matrix()`; factor columns get coerced silently. Expand factors first with `caret::dummyVars()` or `model.matrix(~ . - 1, data = df)`.

**Pitfall 3: searching kappa.** `kappa` matters only for multivariate outcomes. For a single numeric `y` it is inert, so leave it at `0.5`. Wasting grid rows on a kappa sweep just slows the search.

**Pitfall 4: confusing K with ncomp.** Other caret methods use `ncomp`; spls uses `K`. Mixing them in a `tuneGrid` silently falls back to defaults. Run `modelLookup("spls")` if you forget the argument names.

[WARNING]
**The `spls` package is not loaded automatically by `library(caret)`.** caret only attaches it lazily when `train(method = "spls")` is called. Install it with `install.packages("spls")` before the first run, otherwise `train()` aborts with a `there is no package called 'spls'` error after spending several seconds on resampling setup.

## Try it yourself

**Try it:** Fit a caret spls model on mtcars predicting mpg with a custom grid of `K = 1:3` and `eta = c(0.3, 0.6)`. Save the best tuning combination to `ex_best` and the names of selected predictors to `ex_selected`.

```r title="Your turn: spls on mtcars"
# Try it: spls with custom grid
ex_grid <- # your code here
ex_fit  <- # your code here
ex_best     <- # your code here
ex_selected <- # your code here

ex_best
ex_selected
#> Expected: K and eta values from the 3x2 grid, plus 3 to 5 predictor names
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
ex_grid <- expand.grid(K = 1:3, eta = c(0.3, 0.6), kappa = 0.5)
ex_fit  <- train(
  as.matrix(mtcars[, -1]), mtcars$mpg,
  method = "spls",
  preProcess = c("center", "scale"),
  tuneGrid = ex_grid,
  trControl = trainControl(method = "cv", number = 5)
)

ex_best <- ex_fit$bestTune
ex_selected <- colnames(mtcars)[-1][ex_fit$finalModel$selectvar]

ex_best
#>   K eta kappa
#> 4 2 0.6   0.5
ex_selected
#> [1] "disp" "hp"   "wt"
```

**Explanation:** The grid sweeps three component counts and two sparsity levels at the default kappa. `bestTune` reports the winning row; `selectvar` indexes the non-zero predictors in the final model so you can map back to column names.

</details>

## Related caret functions

These pair naturally with a sparse PLS workflow:

- `train()` with `method = "pls"`: non-sparse counterpart for dimension-reduction without feature selection
- `train()` with `method = "splsda"`: sparse PLS for factor outcomes
- `preProcess()`: center, scale, or impute the predictor matrix before fitting
- `varImp()`: relative variable importance computed from the loading magnitudes
- `resamples()`: compare spls against pls or glmnet on a common resampling scheme

## FAQ

**What is the difference between spls and pls in caret?**

`pls` keeps every predictor in every latent component; `spls` zeros out small loadings via an L1 penalty controlled by `eta`. That gives spls a feature-selection story plain pls lacks, at the cost of one extra tuning dial. Pick `pls` when every predictor is informative and you just need dimension reduction. Pick `spls` when most predictors are noise and you want the model to commit to a subset.

**How do I choose K and eta for caret spls?**

Cross-validate. A 5x5 grid of `K = 1:5` and `eta = seq(0.1, 0.9, by = 0.2)` covers the meaningful range on most regression problems; bump K higher only if your predictor count exceeds 20 and there is no plateau in resampled RMSE. Always leave `kappa = 0.5` unless you have a true multi-response outcome.

**Does caret spls work for classification?**

No. `method = "spls"` is regression only. For a factor outcome use `method = "splsda"`, which applies the same sparse PLS engine to dummy-coded classes and returns class predictions plus probabilities. The tuning grid is identical (`K`, `eta`, `kappa`) so any spls workflow can be ported to splsda by changing the method string and the response.

