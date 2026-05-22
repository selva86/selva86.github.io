---
title: "caret icr() in R: Independent Component Regression Models"
slug: "caret-icr-in-R"
description: "Learn how caret icr() in R fits Independent Component Regression. Formula and matrix interfaces, predict() options, tuning n.comp, and common pitfalls."
keywords: "caret icr, icr function R, caret icr examples, independent component regression R, caret icr predict, ICA regression R, caret icr tutorial"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "caret-functions"
fr_parent: "R-Tutorial.html"
auto_link_terms: "icr()|caret icr|caret::icr()|independent component regression|ICA regression|ICR model"
auto_link_case_sensitive: true
target_keyword: "caret icr"
sibling_block_enabled: true
difficulty: "Beginner"
---

# caret icr() in R: Independent Component Regression Models

<p class="lead">The <code>icr()</code> function in caret fits an Independent Component Regression by extracting <code>n.comp</code> independent components from the predictors with <code>fastICA::fastICA()</code> and regressing the response on those components. It is the dimension-reduction cousin of principal component regression for cases where the underlying signals are statistically independent rather than orthogonal.</p>

[QUICK ANSWER]
icr(mpg ~ ., data = mtcars, n.comp = 3)             # formula interface
icr(x = mtcars[, -1], y = mtcars$mpg, n.comp = 3)   # x, y interface
predict(fit, newdata = mtcars[1:5, ])                # score new rows
predict(fit, newdata = mtcars[1:5, ], n.comp = 2)    # subset components at predict
icr(mpg ~ ., data = mtcars, n.comp = 5, maxit = 500) # passthrough to fastICA
train(mpg ~ ., method = "icr", data = mtcars)        # CV-tuned via caret
fit$ica$K                                            # whitening matrix

[DECISION TREE: Is icr() the right tool?]
- regression on independent components: icr(mpg ~ ., data = mtcars, n.comp = 3)
- regression on principal components: pls::pcr(mpg ~ ., data = mtcars)
- partial least squares on collinear x: pls::plsr(mpg ~ ., data = mtcars)
- penalize coefficients instead of rotating: glmnet(x, y, alpha = 0)
- raw ICA decomposition without regression: fastICA::fastICA(x, n.comp = 3)
- pick n.comp by cross-validation: train(method = "icr", tuneGrid = grid)

## What icr() does in one sentence

**`icr()` is caret's regression-on-independent-components wrapper.** You hand it a formula or an `x` and `y`, set `n.comp` (the number of independent components to extract, default 3), and the function calls `fastICA::fastICA()` to rotate the predictors into statistically independent latent variables, then fits an ordinary linear regression of `y` on those components. `predict()` later applies the same rotation to new rows and scores them with the stored linear model.

## icr() syntax and arguments

**Two equivalent entry points cover formula and matrix workflows.** The function mirrors the familiar `lm()` and `pls::pcr()` API, then passes any extra arguments straight to `fastICA::fastICA()`.

```r title="Load caret and inspect mtcars"
library(caret)

set.seed(1)
head(mtcars, 3)
#>                mpg cyl disp  hp drat    wt  qsec vs am gear carb
#> Mazda RX4     21.0   6  160 110 3.90 2.620 16.46  0  1    4    4
#> Mazda RX4 Wag 21.0   6  160 110 3.90 2.875 17.02  0  1    4    4
#> Datsun 710    22.8   4  108  93 3.85 2.320 16.46  1  1    4    1
```

Formula form:

```
icr(formula, data, ..., subset, na.action, contrasts = NULL)
```

Matrix form:

```
icr(x, y, ...)
```

- `formula`: like `mpg ~ .`, a numeric outcome regressed on the predictor columns.
- `data`: a data frame holding the columns named in the formula.
- `x`, `y`: a numeric matrix or data frame of predictors plus a numeric outcome vector.
- `n.comp`: number of independent components to extract. Passed to `fastICA`. Default 3. Must be at most `ncol(x)`.
- `...`: forwarded to `fastICA::fastICA()`, including `alg.typ`, `fun`, `maxit`, `tol`, and `row.norm`.
- `subset`, `na.action`, `contrasts`: standard model-fitting controls used by the formula method.

[NOTE]
**`icr()` accepts every `fastICA()` tuning knob.** Pass `alg.typ = "deflation"` to extract components one at a time instead of in parallel, or raise `maxit = 500` if the default 200 iterations does not converge. The defaults work for most small tabular inputs.

## icr() examples by use case

### 1. Fit a basic ICR model on mtcars

The shortest call extracts three independent components from the ten predictors and regresses `mpg` on them. The returned object stores the linear fit, the ICA rotation matrices, and the call.

```r title="Fit icr with three components"
set.seed(1)
fit <- icr(mpg ~ ., data = mtcars, n.comp = 3)
fit
#> Independent Component Regression
#>
#> Call:
#> icr.formula(formula = mpg ~ ., data = mtcars, n.comp = 3)
#>
#> #Components: 3
```

The model object exposes `fit$model` (the underlying `lm` on the components), `fit$ica$K` (the pre-whitening matrix), and `fit$ica$W` (the unmixing matrix). Together they map raw predictors to the latent components used for prediction.

### 2. Score new data with predict()

`predict()` applies the stored ICA rotation to `newdata` and runs the linear regression on the resulting components.

```r title="Predict for first five cars"
predict(fit, newdata = mtcars[1:5, ])
#> [1] 21.31 21.07 25.04 20.86 18.42
```

Compare these to the actual `mtcars$mpg[1:5]` values (21.0, 21.0, 22.8, 21.4, 18.7). The fit tracks the truth on the high-mpg cars and slightly overestimates the Datsun, which is typical when three components retain most but not all of the predictive structure.

### 3. Use fewer components at prediction time

Pass `n.comp` to `predict()` to score with a prefix of the components stored in the model. This is useful for ablation checks: how much does each component carry?

```r title="Predict with two components only"
predict(fit, newdata = mtcars[1:5, ], n.comp = 2)
#> [1] 20.84 20.61 24.18 20.39 18.95
```

Predictions shift because dropping the third component zeroes out one term of the linear model. Sweep `n.comp` from 1 to the model rank to plot a learning curve.

### 4. Hold out a test set and check RMSE

The training-set fit is optimistic. Always validate on rows that the ICA rotation has never seen.

```r title="Train and score on holdout"
set.seed(1)
idx <- createDataPartition(mtcars$mpg, p = 0.7, list = FALSE)
train_df <- mtcars[idx, ]
test_df  <- mtcars[-idx, ]

fit_split <- icr(mpg ~ ., data = train_df, n.comp = 3)
pred <- predict(fit_split, newdata = test_df)
sqrt(mean((pred - test_df$mpg)^2))
#> [1] 3.482
```

An out-of-sample RMSE near 3.5 mpg sets the noise floor on this tiny holdout. ICR shines on wider tabular inputs where predictors are linear mixtures of a handful of independent drivers.

### 5. Tune n.comp through caret train()

For grid search over `n.comp`, hand `icr` to `train()` and let caret cross-validate.

```r title="Cross-validate n.comp via train"
set.seed(1)
grid <- data.frame(n.comp = 1:5)
ctrl <- trainControl(method = "cv", number = 5)
fit_tuned <- train(
  mpg ~ ., data = mtcars,
  method = "icr",
  tuneGrid = grid,
  trControl = ctrl
)
fit_tuned$bestTune
#>   n.comp
#> 3      3
```

`train()` refits ICR once per `n.comp` value, for `length(grid) * folds` ICA decompositions total. The decomposition dominates cost on high-dimensional `x`; tune on a subsample if the grid runs slow.

[KEY INSIGHT]
**ICR is PCR with statistical independence instead of orthogonality.** PCA produces components that are uncorrelated and ranked by variance; ICA produces components that are statistically independent and ranked by non-Gaussianity. When the true latent drivers of the response are non-Gaussian mixtures (signal processing, finance, neuroimaging) ICA recovers them more faithfully than PCA, and a regression on those components inherits the gain.

## icr() vs other dimension-reduction regressions

**`icr()` is the right pick when the underlying signals are statistically independent.** Other techniques optimize for different criteria.

| Function | Decomposition basis | Optimizes | When to use |
|---|---|---|---|
| `caret::icr()` | independent components | statistical independence, non-Gaussianity | latent signals are non-Gaussian mixtures |
| `pls::pcr()` | principal components | variance of predictors | collinear predictors, no response info in rotation |
| `pls::plsr()` | latent variables | covariance with response | supervised reduction, response-informed axes |
| `glmnet(alpha = 0)` | original predictors | shrinkage of coefficients | keep features, penalize magnitude |
| `fastICA::fastICA()` | independent components | independence only | inspect components without regression |

For the underlying decomposition, see the [fastICA reference](https://cran.r-project.org/web/packages/fastICA/fastICA.pdf).

## Common pitfalls

**Pitfall 1: forgetting the fastICA package.** caret requires `fastICA` but does not install it. Run `install.packages("fastICA")` once; without it, `icr()` errors with "there is no package called 'fastICA'".

**Pitfall 2: setting n.comp larger than ncol(x).** ICA cannot extract more independent components than input features. Cap `n.comp` at `ncol(x)`, or at the rank of the predictor matrix, and set a `set.seed()` for reproducibility.

**Pitfall 3: skipping predictor scaling.** `fastICA` centers predictors but does not scale them. Variables on different scales (`disp` in cubic inches vs `qsec` in seconds) dominate the decomposition. Pre-process with `caret::preProcess(method = c("center", "scale"))` first.

**Pitfall 4: expecting interpretable signs and order.** ICA returns components up to sign and permutation. The same data fit twice can produce sign-flipped or reordered components, even though predictions are identical. Compare by absolute loadings.

[WARNING]
**`predict()` does not accept a bare numeric vector.** Pass a data frame or matrix with the same column structure as the training data. A single new observation must be wrapped as a one-row data frame, or the call will silently misalign predictors with the stored ICA rotation.

## Try it yourself

**Try it:** Fit an ICR model on mtcars with `n.comp = 4`, predict mpg for the first three rows, and compute the residuals. Save the predictions to `ex_pred` and residuals to `ex_resid`.

```r title="Your turn fit and score"
# Try it: icr with n.comp = 4
set.seed(1)
ex_fit <- icr(mpg ~ ., data = mtcars, n.comp = 4)
ex_pred  <- # your code here
ex_resid <- # your code here

ex_pred
ex_resid
#> Expected: 3 numeric predictions and 3 residuals near zero
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
ex_fit <- icr(mpg ~ ., data = mtcars, n.comp = 4)
ex_pred  <- predict(ex_fit, newdata = mtcars[1:3, ])
ex_resid <- mtcars$mpg[1:3] - ex_pred

ex_pred
#> [1] 21.20 20.94 24.61
ex_resid
#> [1]  -0.20   0.06  -1.81
```

**Explanation:** `predict()` rotates the three new rows through the stored ICA matrices, then runs the fitted linear regression on the four resulting components. Subtracting the predictions from the true `mpg` values gives per-row residuals; small residuals confirm the four-component fit captures most of the variance.

</details>

## Related caret functions

These complete a typical ICR workflow:

- `train()` with `method = "icr"`: cross-validated search for the best `n.comp`
- `preProcess()`: center and scale predictors before ICA decomposition
- `createDataPartition()`: stratified train and test split before fitting
- `varImp()`: variable importance from the linear model on the components
- `bagEarth()`: a different dimension-stable regressor when MARS is the natural base learner

## FAQ

**What is icr in caret used for?**

`icr()` fits a regression of a numeric response on a small number of independent components extracted from the predictors. It is the ICA-based counterpart to principal component regression, useful when the underlying drivers are non-Gaussian mixtures. The decomposition is computed by `fastICA::fastICA()`, and the regression on the resulting components is an ordinary `lm` fit, so all of `lm`'s diagnostics still apply.

**How do I choose n.comp for caret icr?**

Sweep `n.comp = 1:k` (where `k` is at most `ncol(x)`) through `train(method = "icr", trControl = trainControl(method = "cv"))` and pick the value with the lowest cross-validated RMSE. Start near the number of latent signals you expect from domain knowledge, then expand the grid. Compare training and holdout RMSE to confirm the choice does not over-fit.

**How is icr different from principal component regression?**

Both rotate the predictors before fitting a linear regression, but they optimize different criteria. PCR uses principal components that maximize predictor variance and are uncorrelated; ICR uses independent components that maximize non-Gaussianity and are statistically independent. When latent factors are non-Gaussian mixtures, ICR recovers them more faithfully; when factors are roughly Gaussian, PCR is usually preferable and faster.

**Does caret icr support classification?**

No. `icr()` regresses a numeric response with `lm()` under the hood, so it is regression-only. For ICA preprocessing on a classification task, use `caret::preProcess(method = "ica")` to extract components, then fit any caret classifier (`glm`, `glmnet`, `rf`) on the rotated data.

**Why are my icr predictions different across reruns?**

`fastICA` initializes its unmixing matrix randomly. Without a seed, the decomposition lands on different but equivalent solutions (sign and permutation differences) and propagates slightly different fitted coefficients. Call `set.seed()` immediately before `icr()` for reproducibility, and read absolute loadings rather than raw values.
