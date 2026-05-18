---
title: "parsnip svm_rbf() in R: Radial Basis Kernel SVM"
slug: parsnip-svm_rbf-in-R
description: "parsnip svm_rbf() in R defines radial basis kernel support vector machines for tidymodels. Covers syntax, the kernlab engine, rbf_sigma, and examples."
keywords: "parsnip svm_rbf, svm_rbf function R, parsnip svm_rbf examples, RBF kernel SVM R tidymodels, support vector machine R parsnip, svm_rbf kernlab engine"
mathjax: false
webr: true
date: "2026-05-18"
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: Support-Vector-Machines-With-R.html
auto_link_terms: "svm_rbf()|parsnip svm_rbf|parsnip::svm_rbf()|RBF kernel SVM|radial basis SVM in R"
auto_link_case_sensitive: true
target_keyword: "parsnip svm_rbf"
sibling_block_enabled: true
difficulty: Beginner
---

# parsnip svm_rbf() in R: Radial Basis Kernel SVM

<p class="lead">The parsnip <code>svm_rbf()</code> function defines a radial basis kernel support vector machine for tidymodels. It gives you one interface for a model that draws smooth, locally flexible decision boundaries, fitted through the kernlab engine.</p>

[QUICK ANSWER]
svm_rbf()                                   # default spec, kernlab engine
svm_rbf() |> set_mode("classification")     # classify a factor outcome
svm_rbf() |> set_mode("regression")         # predict a numeric outcome
svm_rbf(rbf_sigma = 0.1)                    # set the kernel width
svm_rbf(cost = 2)                           # set the margin-violation penalty
svm_rbf(margin = 0.1)                       # epsilon band, regression only
fit(spec, Species ~ ., data = iris)         # train on a dataset

[DECISION TREE: Is svm_rbf() the right tool?]
- smooth non-linear boundary from an RBF kernel: svm_rbf() |> set_engine("kernlab")
- straight maximum-margin boundary: svm_linear() |> set_engine("LiblineaR")
- curved boundary from a polynomial kernel: svm_poly() |> set_engine("kernlab")
- a linear classifier with probabilities: logistic_reg() |> set_engine("glm")
- tree-based non-linear model: rand_forest() |> set_engine("ranger")
- tune cost and rbf_sigma by grid: tune_grid() with svm_rbf()

## What svm_rbf() does

**svm_rbf() is a model specification, not a fitted model.** It records your choice of a radial basis kernel support vector machine and its hyperparameters, but no data touches it until you call `fit()`. This separation lets you reuse one specification across many datasets or resampling folds.

A radial basis SVM maps the predictors into a high-dimensional space through a Gaussian kernel, then finds the widest-margin boundary there. Back in the original space, that boundary looks like a smooth curve. The `rbf_sigma` argument sets how far each training point's influence reaches, and `cost` trades margin width against misclassified points.

The function belongs to the tidymodels framework. Because parsnip standardizes the interface, `svm_rbf()` shares the same `fit()` and `predict()` verbs used by every other parsnip model.

[KEY INSIGHT]
**rbf_sigma controls locality, cost controls tolerance.** A large `rbf_sigma` makes each point influence only its near neighbors, so the boundary wiggles tightly; a small one smooths it out. A large `cost` punishes every margin violation, pulling the boundary toward the training data. Tuning the two together is what separates a good RBF SVM from an overfit one.

## svm_rbf() syntax and arguments

**svm_rbf() takes three hyperparameters and two setup verbs.** The arguments shape the radial basis kernel, while `set_engine()` and `set_mode()` finish the specification.

```r title="The svm_rbf specification skeleton"
library(tidymodels)

svm_rbf(
  mode = "unknown",      # set to "classification" or "regression"
  engine = "kernlab",    # kernlab is the standard engine
  cost = NULL,           # penalty for margin violations
  rbf_sigma = NULL,      # width of the radial basis kernel
  margin = NULL          # epsilon insensitivity band (regression only)
)
```

The `rbf_sigma` argument is what makes this model non-linear: it sets the precision of the Gaussian kernel. The `cost` argument sets the penalty for margin violations, and `margin` sets the epsilon band used only in regression. Unlike `svm_poly()`, there is no `degree` argument, because the RBF kernel has no fixed shape to control.

[NOTE]
**svm_rbf() ships in core parsnip, but its engine does not.** The standard engine is `kernlab`, so you need the `kernlab` package installed before you fit. Install it first, or R reports that the engine is not available. When `rbf_sigma` is left `NULL`, kernlab estimates a sensible value from the data with its `sigest` heuristic.

**The mode is never "unknown" at fit time.** A radial basis SVM can predict a class or a number, so you must call `set_mode("classification")` or `set_mode("regression")` before fitting. You can pass the engine through `set_engine()` instead of the `engine` argument, which is the more common tidymodels style.

## Fit an RBF SVM: four examples

**Every example below uses a built-in R dataset.** The `iris` data drives the classification examples and `mtcars` drives the regression example, so the code runs anywhere with no downloads.

### Example 1: Classify with the kernlab engine

**Build the specification, then fit it to data.** Leaving `rbf_sigma` unset lets kernlab pick the kernel width, which works well on the iris species.

```r title="Fit svm_rbf on the iris data"
svm_spec <- svm_rbf(cost = 1) |>
  set_engine("kernlab") |>
  set_mode("classification")

svm_fit <- svm_spec |>
  fit(Species ~ ., data = iris)

preds <- predict(svm_fit, new_data = iris)
mean(preds$.pred_class == iris$Species)
#> [1] 0.973
```

Comparing the predicted labels to the true species gives a training accuracy near 97%. The radial kernel bends the boundary smoothly, separating versicolor from virginica where the two species overlap.

### Example 2: Predict species for new rows

**predict() returns a tidy tibble with one row per input row.** Each prediction is the class on whichever side of the smooth boundary the row falls.

```r title="Predict iris species for new rows"
sample_rows <- iris[c(1, 70, 130), ]

predict(svm_fit, new_data = sample_rows)
#> # A tibble: 3 x 1
#>   .pred_class
#>   <fct>
#> 1 setosa
#> 2 versicolor
#> 3 virginica
```

The `.pred_class` column holds the predicted species as a factor. The output keeps the same row order as the input, so you can bind it back to `sample_rows` with `bind_cols()`.

### Example 3: Fit a regression RBF SVM on mtcars

**Switch the mode to "regression" and the same function predicts a number.** The `margin` argument now controls the width of the insensitivity band.

```r title="Fit a regression RBF SVM on mtcars"
svm_reg <- svm_rbf(cost = 1, margin = 0.1) |>
  set_engine("kernlab") |>
  set_mode("regression")

svm_reg_fit <- svm_reg |>
  fit(mpg ~ ., data = mtcars)

predict(svm_reg_fit, new_data = mtcars[1:3, ])
#> # A tibble: 3 x 1
#>   .pred
#>   <dbl>
#> 1  20.9
#> 2  20.8
#> 3  25.3
```

The regression SVM returns a numeric `.pred` column. Residuals inside the `margin` band of 0.1 add nothing to the loss, so the fit ignores tiny errors.

### Example 4: Get class probabilities

**The kernlab engine can return per-class probabilities.** Pass `type = "prob"` to `predict()` to get them.

```r title="Predict class probabilities with svm_rbf"
prob_fit <- svm_rbf(cost = 1) |>
  set_engine("kernlab") |>
  set_mode("classification") |>
  fit(Species ~ ., data = iris)

predict(prob_fit, new_data = iris[c(1, 70, 130), ], type = "prob")
#> # A tibble: 3 x 3
#>   .pred_setosa .pred_versicolor .pred_virginica
#>          <dbl>            <dbl>           <dbl>
#> 1        0.98             0.01            0.01
#> 2        0.02             0.95            0.03
#> 3        0.01             0.04            0.95
```

The probability columns are named `.pred_<class>` and each row sums to one. kernlab estimates these with Platt scaling, which fits a logistic curve to the SVM decision values.

[TIP]
**Normalize your predictors before fitting a radial basis SVM.** The RBF kernel measures distance between points, so a variable measured in thousands swamps one measured in fractions. Add `step_normalize(all_numeric_predictors())` in a recipe so each predictor contributes fairly to the distance.

## svm_rbf() vs svm_linear() vs svm_poly()

**parsnip ships three SVM specifications, one per kernel.** They share the same verbs, so swapping between them is a one-line change.

| Function | Kernel | Boundary shape | Use when |
|---|---|---|---|
| `svm_linear()` | Linear | Straight hyperplane | Classes are close to linearly separable |
| `svm_poly()` | Polynomial | Curved, degree-controlled | You expect interaction effects or gentle curves |
| `svm_rbf()` | Radial basis | Smooth, locally flexible | The boundary is clearly non-linear and irregular |

Start with `svm_linear()` for speed, reach for `svm_poly()` when a low-degree curve fits, and use `svm_rbf()` when the boundary is too irregular for a polynomial. The RBF kernel is the most common default for non-linear classification.

## Common pitfalls

**Three mistakes catch most newcomers to svm_rbf().** Each one below shows the problem and the fix.

The most common is forgetting to set the mode. A radial basis SVM can classify or predict a number, so parsnip cannot guess which one you want and `fit()` fails until you call `set_mode()`.

```r title="Mode must be set before fitting"
# Wrong: no mode, fit() cannot dispatch
svm_rbf(cost = 1) |>
  set_engine("kernlab") |>
  fit(Species ~ ., data = iris)
#> Error: Please set the mode in the model specification.

# Right: set the mode first
svm_rbf(cost = 1) |>
  set_engine("kernlab") |>
  set_mode("classification") |>
  fit(Species ~ ., data = iris)
```

The second pitfall is pushing `rbf_sigma` too high. A large value makes each point influence only its immediate neighbors, so the boundary wraps tightly around individual training rows and fails to generalize. The third is leaving predictors unscaled, which lets a large-scale variable dominate the distance the RBF kernel measures.

[WARNING]
**A large rbf_sigma overfits fast.** Each increase narrows the kernel and gives the model more freedom to memorize the training data. Leave `rbf_sigma` at `NULL` for kernlab's data-driven estimate, or tune it across resampling folds rather than trusting training accuracy.

## Try it yourself

**Try it:** Fit a regression RBF SVM on `mtcars` with `cost = 2`, then predict `mpg` for the first row. Save the prediction to `ex_pred`.

```r title="Your turn: regression SVM on mtcars"
# Try it: fit a cost = 2 regression RBF SVM, then predict row 1
ex_spec <- # your code here
ex_fit  <- # your code here
ex_pred <- # your code here

ex_pred
#> Expected: a 1-row tibble with one .pred value near 21
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_spec <- svm_rbf(cost = 2) |>
  set_engine("kernlab") |>
  set_mode("regression")

ex_fit <- ex_spec |>
  fit(mpg ~ ., data = mtcars)

ex_pred <- predict(ex_fit, new_data = mtcars[1, ])
ex_pred
#> # A tibble: 1 x 1
#>   .pred
#>   <dbl>
#> 1  21.0
```

**Explanation:** Setting the mode to "regression" makes svm_rbf() predict the numeric `mpg` column, and `cost = 2` raises the penalty for margin violations. Row 1 of mtcars is the Mazda RX4, whose true mpg is 21, so the radial basis SVM lands close.

</details>

## Related parsnip functions

**svm_rbf() works alongside the rest of the parsnip model family.** These functions cover the neighboring tasks in a tidymodels project.

- `svm_linear()` defines a support vector machine with a straight, linear boundary.
- `svm_poly()` defines a support vector machine with a polynomial kernel.
- `set_engine()` chooses the computational backend for any specification.
- `set_mode()` declares whether the model classifies or regresses.
- `fit()` trains a specification on data and returns a model object.

## FAQ

**What package is svm_rbf() in?**

`svm_rbf()` ships in core parsnip, so `library(tidymodels)` or `library(parsnip)` makes it available. The function only describes the model; the actual fitting happens in an engine package. The standard registered engine is `kernlab`, so install the `kernlab` package separately before you call `fit()`.

**What is the difference between svm_rbf() and svm_poly()?**

`svm_rbf()` uses a radial basis kernel that produces a smooth boundary with no fixed shape. `svm_poly()` uses a polynomial kernel, so its boundary is a degree-controlled curve that bends a fixed number of times. Choose `svm_rbf()` when the boundary is irregular, and `svm_poly()` when you expect gentle curves or interaction effects. The RBF kernel is the more common default for non-linear problems.

**What does rbf_sigma control in svm_rbf()?**

The `rbf_sigma` argument sets the precision of the Gaussian kernel, controlling how far each training point's influence reaches. A small value spreads the influence wide for a smooth boundary; a large value narrows it, giving a wiggly boundary that can overfit. When `rbf_sigma` is `NULL`, the kernlab engine estimates a value from the data with its `sigest` heuristic.

**Does svm_rbf() give class probabilities?**

Yes. The kernlab engine supports probability predictions, so `predict(fit, type = "prob")` returns one `.pred_<class>` column per class. kernlab estimates the probabilities with Platt scaling, which fits a logistic curve to the raw SVM decision values. The columns in each row sum to one, which makes them safe to use as calibrated class scores.

**How do I tune svm_rbf() hyperparameters?**

Mark the arguments with `tune()`, as in `svm_rbf(cost = tune(), rbf_sigma = tune())`, then pass the specification to `tune_grid()` with a resampling object such as `vfold_cv()`. The framework scores a grid of cost and sigma combinations with cross-validation. Use `select_best()` to pick the winner, then `finalize_workflow()` to lock the values before the final fit.

For the full argument reference, see the [parsnip svm_rbf() documentation](https://parsnip.tidymodels.org/reference/svm_rbf.html).
