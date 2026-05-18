---
title: "parsnip discrim_quad() in R: Fit QDA Models"
slug: parsnip-discrim_quad-in-R
description: "Use parsnip discrim_quad() to fit quadratic discriminant analysis (QDA) models in R. Covers syntax, engines, QDA vs LDA, predictions, and common pitfalls."
keywords: "parsnip discrim_quad, discrim_quad function R, parsnip discrim_quad examples, quadratic discriminant analysis R, QDA tidymodels, discrim_quad tidymodels, QDA in R"
mathjax: false
webr: true
date: 2026-05-18
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "discrim_quad()|parsnip discrim_quad|discrim::discrim_quad()|quadratic discriminant analysis|discrim_quad"
auto_link_case_sensitive: true
target_keyword: "parsnip discrim_quad"
sibling_block_enabled: true
difficulty: Beginner
---

# parsnip discrim_quad() in R: Fit QDA Models

<p class="lead">The parsnip <code>discrim_quad()</code> function defines a quadratic discriminant analysis (QDA) model in R. It fits one covariance matrix per class, so the decision boundary can curve, which makes QDA a strong choice when classes have different spreads.</p>

[QUICK ANSWER]
discrim_quad()                                   # default QDA spec, MASS engine
discrim_quad() |> set_engine("MASS")             # set engine explicitly
discrim_quad(mode = "classification")            # set mode inline
discrim_quad() |> fit(Species ~ ., data = train) # fit to training data
predict(qda_fit, test)                           # hard class predictions
predict(qda_fit, test, type = "prob")            # per-class probabilities
discrim_quad() |> set_engine("sparsediscrim")    # high-dimensional engine

[DECISION TREE: Is discrim_quad() the right tool?]
- classes differ in spread, want curved boundary: discrim_quad()
- classes share one covariance, linear boundary: discrim_linear()
- many predictors, want shrinkage: discrim_regularized()
- nonlinear fit via basis expansion: discrim_flexible()
- predictors far from normal: try decision_tree()
- two classes, want interpretable odds: logistic_reg()

## What discrim_quad() does

**`discrim_quad()` creates a QDA model specification.** It belongs to the parsnip model family but lives in the companion `discrim` package, so you load both `tidymodels` and `discrim` before using it. The function returns a specification object, not a fitted model. You pair it with an engine and a mode, then call `fit()` to estimate parameters from data.

QDA learns a separate covariance matrix for every class. That extra flexibility lets it draw quadratic (curved) decision boundaries, unlike linear discriminant analysis, which forces one shared covariance.

## discrim_quad() syntax and arguments

**`discrim_quad()` takes only two arguments because QDA has no tuning hyperparameters.** The model is fully determined by the class means and covariances estimated from data, so there is no penalty or smoothing term to set.

| Argument | Purpose | Typical value |
|---|---|---|
| `mode` | Prediction type | `"classification"` (the only valid mode) |
| `engine` | Computational backend | `"MASS"` (default) or `"sparsediscrim"` |

A complete specification chains the spec with `set_engine()` and `set_mode()`.

```r title="Define a QDA model spec"
library(tidymodels)
library(discrim)

qda_spec <- discrim_quad() |>
  set_engine("MASS") |>
  set_mode("classification")

qda_spec
#> Quadratic Discriminant Model Specification (classification)
#>
#> Computational engine: MASS
```

The printed object confirms the mode and engine. Nothing is fitted yet, so this spec is reusable across resamples and workflows.

## Fit a QDA model

**`fit()` estimates the per-class means and covariances.** Split the data first so you can measure honest accuracy on rows the model never saw. The `iris` dataset works well here: three classes and four numeric predictors.

```r title="Fit QDA on the iris data"
set.seed(42)
iris_split <- initial_split(iris, prop = 0.75, strata = Species)
iris_train <- training(iris_split)
iris_test  <- testing(iris_split)

qda_fit <- qda_spec |>
  fit(Species ~ ., data = iris_train)

qda_fit
#> parsnip model object
#>
#> Call:
#> qda(formula = Species ~ ., data = data)
#>
#> Prior probabilities of groups:
#>     setosa versicolor  virginica
#>  0.3333333  0.3333333  0.3333333
```

The fitted object wraps `MASS::qda()`. Prior probabilities default to the observed class frequencies in the training data.

**`predict()` returns a tidy tibble.** Ask for hard classes with the default call, or probabilities with `type = "prob"`.

```r title="Predict classes and probabilities"
predict(qda_fit, iris_test) |> head(3)
#> # A tibble: 3 x 1
#>   .pred_class
#>   <fct>
#> 1 setosa
#> 2 setosa
#> 3 setosa

predict(qda_fit, iris_test, type = "prob") |> head(3)
#> # A tibble: 3 x 3
#>   .pred_setosa .pred_versicolor .pred_virginica
#>          <dbl>            <dbl>           <dbl>
#> 1            1         3.21e-22        8.10e-41
#> 2            1         2.55e-18        1.04e-35
#> 3            1         5.99e-25        2.66e-44
```

Bind the predictions back to the test set to score the model with `yardstick`.

```r title="Evaluate QDA accuracy"
iris_test |>
  bind_cols(predict(qda_fit, iris_test)) |>
  accuracy(truth = Species, estimate = .pred_class)
#> # A tibble: 1 x 3
#>   .metric  .estimator .estimate
#>   <chr>    <chr>          <dbl>
#> 1 accuracy multiclass     0.974
```

[TIP]
**Reuse the spec inside a workflow.** Wrap `qda_spec` in `workflow()` with a recipe so preprocessing and the model fit together during resampling. The spec object itself never changes.

## QDA vs LDA: when each fits

**Choose QDA when class covariances clearly differ; choose LDA when they look similar.** QDA estimates more parameters, so it needs more rows per class to stay stable. LDA pools information across classes and is steadier on small samples.

```r title="Compare QDA with LDA"
lda_fit <- discrim_linear() |>
  set_engine("MASS") |>
  set_mode("classification") |>
  fit(Species ~ ., data = iris_train)

iris_test |>
  bind_cols(predict(lda_fit, iris_test)) |>
  accuracy(Species, .pred_class) |>
  pull(.estimate)
#> [1] 0.9736842
```

On `iris` the two models score almost identically because the classes are well separated. The gap widens on data where one class is much more spread out than another.

[KEY INSIGHT]
**The shared-covariance assumption is the dividing line.** LDA assumes every class has the same covariance and draws straight boundaries. QDA drops that assumption, fits a covariance per class, and bends the boundary. More flexibility costs more parameters and more data.

| Aspect | discrim_quad() (QDA) | discrim_linear() (LDA) |
|---|---|---|
| Covariance | One per class | One shared |
| Boundary shape | Quadratic (curved) | Linear |
| Parameters | More | Fewer |
| Small samples | Less stable | More stable |

## Choosing an engine

**The `"MASS"` engine handles most cases.** It calls `MASS::qda()` and is the default. For wide data where predictors outnumber rows in a class, switch to `"sparsediscrim"`, which applies shrinkage to keep the per-class covariance matrices invertible.

```r title="Switch to the sparsediscrim engine"
discrim_quad() |>
  set_engine("sparsediscrim") |>
  set_mode("classification")
#> Quadratic Discriminant Model Specification (classification)
#>
#> Computational engine: sparsediscrim
```

Run `discrim_quad() |> translate()` to see the exact engine call parsnip will make.

## Common pitfalls

**QDA breaks in three predictable ways.** Each has a clear fix.

- **Group too small.** QDA needs more rows than predictors in every class. A tiny class triggers `some group is too small for 'qda'`.
- **Collinear predictors.** Perfectly correlated columns make a class covariance singular and the fit fails with a rank-deficiency error. Drop or combine the columns.
- **Skipping the assumption check.** QDA assumes predictors are roughly normal within each class. Heavily skewed features hurt accuracy even when the code runs fine.

```r title="Pitfall: too few rows per class"
tiny <- iris_train[1:8, ]
discrim_quad() |>
  set_engine("MASS") |>
  set_mode("classification") |>
  fit(Species ~ ., data = tiny)
#> Error in qda.default(x, grouping): some group is too small for 'qda'
```

[WARNING]
**QDA is hungrier for data than LDA.** Because it estimates a full covariance matrix per class, a class with fewer rows than predictors will fail outright. Use `discrim_regularized()` or `discrim_linear()` when classes are small.

## Try it yourself

**Try it:** Fit a QDA model on the first 100 rows of `iris` (setosa and versicolor only) and report test accuracy. Save the fitted model to `ex_qda`.

```r title="Your turn: fit QDA on two classes"
# Try it: fit QDA on a two-class subset
two_class <- droplevels(iris[1:100, ])
ex_qda <- # your code here

ex_qda
#> Expected: a fitted parsnip QDA model object
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
two_class <- droplevels(iris[1:100, ])
ex_qda <- discrim_quad() |>
  set_engine("MASS") |>
  set_mode("classification") |>
  fit(Species ~ ., data = two_class)

class(ex_qda)
#> [1] "_qda"        "model_fit"
```

**Explanation:** `droplevels()` removes the unused `virginica` factor level so QDA only models the two classes present. The fitted object carries the `model_fit` class from parsnip.

</details>

## Related parsnip functions

**These functions pair naturally with `discrim_quad()`.**

- [discrim_linear()](discrim_linear-in-R.html) defines an LDA model with a shared covariance.
- [discrim_regularized()](discrim_regularized-in-R.html) blends QDA and LDA with shrinkage.
- `set_engine()` selects the computational backend.
- `fit()` estimates model parameters from data.
- `predict()` produces class or probability predictions.

## FAQ

**What is the difference between discrim_quad() and discrim_linear()?**

`discrim_quad()` fits quadratic discriminant analysis with a separate covariance matrix for each class, so its decision boundary can curve. `discrim_linear()` fits linear discriminant analysis with one covariance shared across all classes, giving straight boundaries. QDA is more flexible but estimates more parameters, so it needs more data per class. LDA is steadier when samples are small or class covariances look similar.

**Which engines does discrim_quad() support?**

`discrim_quad()` supports two engines. The default `"MASS"` engine calls `MASS::qda()` and suits most datasets. The `"sparsediscrim"` engine applies shrinkage to the per-class covariance matrices, which helps when predictors outnumber the rows in a class. Set the engine with `set_engine()` and inspect the underlying call with `translate()`.

**Does discrim_quad() need feature scaling?**

No. QDA is based on covariance matrices, and scaling the predictors does not change the fitted decision boundary or the predictions. You can still center and scale inside a recipe for consistency with other models in a workflow, but it is not required for `discrim_quad()` to work correctly.

**Why does QDA fail with "some group is too small"?**

QDA estimates a full covariance matrix for each class, which requires more rows than predictors within every class. When a class has too few observations, that matrix cannot be estimated and `MASS::qda()` stops with `some group is too small for 'qda'`. Collect more data for the small class, drop predictors, or switch to `discrim_linear()` or `discrim_regularized()`.

**Can discrim_quad() return class probabilities?**

Yes. Call `predict()` with `type = "prob"` to get one probability column per class, named `.pred_<class>`. The default `predict()` call returns hard class labels in a `.pred_class` column. Both outputs arrive as tidy tibbles that align row-for-row with the input data, so you can bind them to the test set for scoring.

For the full argument reference, see the [discrim package documentation](https://discrim.tidymodels.org/reference/discrim_quad.html).
