---
title: "caret bagEarth() in R: Bagged MARS Ensemble Models"
slug: "caret-bagEarth-in-R"
description: "Learn how caret bagEarth() in R fits a bagged MARS ensemble. Formula and matrix interfaces, predict() options, tuning B, and common pitfalls explained."
keywords: "caret bagEarth, bagEarth function R, caret bagEarth examples, bagged earth R, bagged MARS R, caret bagEarth predict, bagEarth ensemble"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "caret-functions"
fr_parent: "R-Tutorial.html"
auto_link_terms: "bagEarth()|caret bagEarth|caret::bagEarth()|bagged MARS|bagged earth model|MARS ensemble"
auto_link_case_sensitive: true
target_keyword: "caret bagEarth"
sibling_block_enabled: true
difficulty: "Beginner"
---

# caret bagEarth() in R: Bagged MARS Ensemble Models

<p class="lead">The <code>bagEarth()</code> function in caret fits a bagged ensemble of MARS models by drawing many bootstrap samples, fitting <code>earth::earth()</code> on each, and averaging the predictions. It stabilizes a learner that is otherwise sensitive to the exact training rows, and exposes a familiar formula and matrix interface with full <code>predict()</code> support.</p>

[QUICK ANSWER]
bagEarth(mpg ~ ., data = mtcars)                   # formula interface
bagEarth(x = mtcars[, -1], y = mtcars$mpg)         # x, y interface
bagEarth(mpg ~ ., data = mtcars, B = 100)          # 100 bootstrap samples
bagEarth(mpg ~ ., data = mtcars, keepX = FALSE)    # smaller model object
predict(fit, newdata = mtcars[1:5, ])              # averaged prediction
train(mpg ~ ., method = "bagEarth", data = mtcars) # CV-tuned via caret
varImp(fit)                                         # importance over bag

[DECISION TREE: Is bagEarth() the right tool?]
- bagged MARS for stable predictions: bagEarth(mpg ~ ., data = mtcars)
- single MARS model (not bagged): earth::earth(mpg ~ ., data = mtcars)
- bagged regression trees: ipred::bagging(mpg ~ ., data = mtcars)
- random forest of trees: randomForest(mpg ~ ., data = mtcars)
- gradient boosting on stumps: train(method = "gbm", data = mtcars)
- tune degree and nprune by CV: train(method = "bagEarth")

## What bagEarth() does in one sentence

**`bagEarth()` is caret's bootstrap aggregator for the earth (MARS) model.** You hand it a formula or `x` and `y`, set `B` (the number of bootstrap samples, default 50), and caret resamples the training rows `B` times, fits an earth model on each resample, and stores every fitted model inside a single `bagEarth` object. Calling `predict()` later averages predictions across the bag, which absorbs the variance MARS picks up from sensitive knot placement and typically beats a single MARS fit on noisy data.

## bagEarth() syntax and arguments

**Two equivalent entry points cover formula and matrix workflows.** caret mirrors the `lm()` and `glm()` API, then layers the bagging parameter on top.

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
bagEarth(formula, data, B = 50, summary = mean, keepX = TRUE, ...)
```

Matrix form:

```
bagEarth(x, y, weights = NULL, B = 50, summary = mean, keepX = TRUE, ...)
```

- `formula`: like `mpg ~ .`, numeric outcome for regression or factor for two-class classification.
- `data`: a data frame holding the columns named in the formula.
- `x`, `y`: matrix or data frame of predictors, plus a numeric or factor outcome vector.
- `B`: number of bootstrap samples drawn from the training rows. Default 50.
- `summary`: function used to combine predictions across the `B` models. Default `mean`.
- `keepX`: keep the bootstrap predictor matrices for inspection. Default `TRUE`; set `FALSE` for smaller objects.
- `...`: forwarded to the underlying earth fit (`degree`, `nprune`, etc.).

[NOTE]
**`bagEarth()` accepts every `earth()` tuning knob.** Pass `degree = 2` to allow two-way interactions, or `nprune = 15` to cap the number of basis functions per bootstrap fit. The same hyperparameters apply uniformly to every model in the bag.

## bagEarth() examples by use case

### 1. Fit a bagged regression model on mtcars

The shortest call uses every column to predict `mpg`. The fitted object stores all 50 underlying earth models plus the bootstrap row indices.

```r title="Fit bagEarth with defaults"
set.seed(1)
fit <- bagEarth(mpg ~ ., data = mtcars)
fit
#> Bagged Earth
#>
#> Call:
#> bagEarth.formula(formula = mpg ~ ., data = mtcars)
#>
#> B: 50
```

Each model has its own selected basis functions, so different bootstraps may keep different predictors, and the averaged prediction inherits stability from this diversity. Saving the object with `saveRDS()` is enough to score new data later.

### 2. Score new data with predict()

`predict()` returns the ensemble average across all bootstrap models for regression.

```r title="Predict for first five cars"
predict(fit, newdata = mtcars[1:5, ])
#> [1] 21.45 21.06 24.92 21.07 18.36
```

Compare these to the actual `mtcars$mpg[1:5]` values (21.0, 21.0, 22.8, 21.4, 18.7) and the ensemble tracks the truth closely. To inspect individual bootstrap predictions, look at `fit$fit` and apply `predict()` to each member.

### 3. Increase B for a smoother ensemble

A larger bag reduces Monte Carlo noise in the averaged prediction. The marginal gain shrinks quickly: 100 to 200 is usually enough for tabular regression.

```r title="Refit with 100 bootstrap samples"
set.seed(1)
fit_big <- bagEarth(mpg ~ ., data = mtcars, B = 100)
mean((predict(fit_big, mtcars) - mtcars$mpg)^2)
#> [1] 4.123
mean((predict(fit, mtcars) - mtcars$mpg)^2)
#> [1] 4.512
```

Training MSE drops because more bootstrap samples cover the input space more evenly. For honest evaluation always use a holdout split or `train()` with cross-validation, never the training set itself.

### 4. Hold out a test set and check RMSE

The `mtcars` sample is tiny, but the same pattern applies to any tabular regression task.

```r title="Train and score on holdout"
set.seed(1)
idx <- createDataPartition(mtcars$mpg, p = 0.7, list = FALSE)
train_df <- mtcars[idx, ]
test_df  <- mtcars[-idx, ]

fit_split <- bagEarth(mpg ~ ., data = train_df, B = 100)
pred <- predict(fit_split, newdata = test_df)
sqrt(mean((pred - test_df$mpg)^2))
#> [1] 3.214
```

A test-set RMSE around 3 mpg on 32 rows is the noise floor. The real value of bagEarth shows on hundreds to thousands of rows where a single MARS fit becomes unstable; swap `bagEarth` for `earth::earth` on the same split to see the variance bagging absorbed.

### 5. Tune through caret train()

For grid search over `degree` and `nprune`, hand bagEarth to `train()` and let caret cross-validate.

```r title="Cross-validate via caret train"
set.seed(1)
grid <- expand.grid(degree = 1:2, nprune = c(5, 10, 15))
ctrl <- trainControl(method = "cv", number = 5)
fit_tuned <- train(
  mpg ~ ., data = mtcars,
  method = "bagEarth",
  tuneGrid = grid,
  trControl = ctrl,
  B = 50
)
fit_tuned$bestTune
#>   nprune degree
#> 4     10      2
```

`train()` refits the bagged ensemble once per hyperparameter combination, so total cost is `nrow(grid) * folds * B` earth fits. Cap `B` modestly during search, then refit with a larger `B` at the winning hyperparameters.

[KEY INSIGHT]
**Bagging stabilizes high-variance learners, not biased ones.** MARS is exactly that kind of learner: small changes to the training rows can move knots and selected features. Bagging averages the noise out without changing the underlying bias, so a poorly specified earth model will not improve from being bagged. Tune `degree` and `nprune` first; then bag.

## bagEarth() vs other ensembles

**`bagEarth()` is the right pick when MARS is already a sensible base learner.** Other ensembles target different biases.

| Function | Base learner | Resampling | When to use |
|---|---|---|---|
| `bagEarth()` (caret) | earth/MARS | bootstrap, B copies | smooth nonlinear regression with noisy training rows |
| `earth::earth()` | single MARS | none | quick interpretable fit, no ensemble cost |
| `ipred::bagging()` | rpart tree | bootstrap | piecewise constant fit, simple step relationships |
| `randomForest()` | rpart tree | bootstrap plus column subsampling | tabular default, handles interactions |
| `gbm::gbm()` | trees | sequential boosting | small base learners, careful tuning, top accuracy |

For the full caret method registry, see the [caret reference](https://topepo.github.io/caret/).

## Common pitfalls

**Pitfall 1: forgetting the earth package.** caret loads earth lazily on first use. Run `install.packages("earth")` once and keep `library(earth)` available before calling `bagEarth()` to avoid an opaque "could not find function" error.

**Pitfall 2: B too low.** With `B = 10` predictions still wobble because the bootstrap average has not stabilized. Default 50; scale to 100-200 when time allows.

**Pitfall 3: ignoring the size of the model object.** Each bootstrap stores its earth fit and (by default) the bootstrap predictor matrix. For 100 bootstraps on a 50,000-row dataset, the saved object can run into gigabytes. Set `keepX = FALSE` for production deployments.

**Pitfall 4: bagging a misconfigured earth model.** Bagging cannot fix a wrong `degree`. Validate a single `earth::earth()` fit before wrapping it.

[WARNING]
**`predict()` does not accept a bare numeric vector.** Pass a data frame or matrix with the same column structure as the training data. A single new observation must be wrapped as a one-row data frame, not a numeric vector, or the call will silently misalign predictors.

## Try it yourself

**Try it:** Fit a bagged MARS model on mtcars with `B = 80`, predict mpg for the first three rows, and compute the residuals. Save the predictions to `ex_pred` and residuals to `ex_resid`.

```r title="Your turn fit and score"
# Try it: bagEarth with B = 80
set.seed(1)
ex_fit <- bagEarth(mpg ~ ., data = mtcars, B = 80)
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
ex_fit <- bagEarth(mpg ~ ., data = mtcars, B = 80)
ex_pred  <- predict(ex_fit, newdata = mtcars[1:3, ])
ex_resid <- mtcars$mpg[1:3] - ex_pred

ex_pred
#> [1] 21.42 21.08 24.85
ex_resid
#> [1] -0.42 -0.08 -2.05
```

**Explanation:** `predict()` averages over the 80 bootstrap earth fits. Subtracting the predictions from the true `mpg` values gives per-row residuals; small residuals confirm the ensemble fits the training rows well.

</details>

## Related caret functions

These complete a typical bagEarth workflow:

- `train()` with `method = "bagEarth"`: cross-validated hyperparameter search
- `varImp()`: variable importance averaged across the bagged earth models
- `createDataPartition()`: stratified train and test split before fitting
- `preProcess()`: center, scale, or impute predictors prior to bagging
- `bagFDA()`: caret's bagged flexible discriminant analysis cousin

## FAQ

**What is bagEarth in caret used for?**

`bagEarth()` fits a bagged ensemble of MARS models for regression. It resamples the training rows `B` times, fits an earth model on each bootstrap, and averages the predictions. The averaging stabilizes the high-variance MARS estimator, which is sensitive to knot selection. Use it when a single earth fit looks promising but predictions shift noticeably across reruns or holdout splits.

**How many bootstrap samples should I use for bagEarth?**

Start with the default `B = 50`, then scale to 100 or 200 if predictions are still noisy across reruns. Marginal gain decays after about 100 bootstraps for most tabular regression problems, while model size and prediction time scale linearly with `B`. Sweep `B = 25, 50, 100, 200` once and pick the smallest value where validation error plateaus.

**How is bagEarth different from random forest?**

Both are bootstrap ensembles, but the base learner differs. `bagEarth()` bags MARS models, which fit smooth piecewise-linear functions with selected knots. `randomForest()` bags decision trees with random column subsampling at each split. Forests handle high-dimensional inputs and categorical splits naturally; bagEarth is better for smooth nonlinear regression on continuous predictors.

**Can bagEarth do variable importance?**

Yes. Call `varImp(fit)` on a fitted `bagEarth` object and caret averages the earth variable importance across all `B` bootstraps. The output is a `varImp.bagEarth` object with one row per predictor; print it for a ranking or pass it to `plot()`. Variables that appear in many bootstrap fits and contribute large reductions in GCV rank highest.

**Why is my bagEarth model object so large?**

Each bootstrap stores its fitted earth model and, by default, the bootstrap predictor matrix. For 100 bootstraps on tens of thousands of rows, that adds up fast. Set `keepX = FALSE` at fit time to drop predictor matrices, and use `saveRDS(fit, compress = "xz")` to compress the saved object. A smaller `nprune` also shrinks each earth fit.
