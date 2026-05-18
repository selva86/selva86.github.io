---
title: "parsnip svm_poly() in R: Polynomial Kernel SVM"
slug: parsnip-svm_poly-in-R
description: "parsnip svm_poly() in R defines polynomial-kernel support vector machine models for tidymodels. Covers syntax, the kernlab engine, degree, and examples."
keywords: "parsnip svm_poly, svm_poly function R, parsnip svm_poly examples, polynomial SVM R tidymodels, support vector machine R parsnip, svm_poly kernlab engine"
mathjax: false
webr: true
date: "2026-05-18"
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: Support-Vector-Machines-With-R.html
auto_link_terms: "svm_poly()|parsnip svm_poly|parsnip::svm_poly()|polynomial SVM in R|tidymodels SVM"
auto_link_case_sensitive: true
target_keyword: "parsnip svm_poly"
sibling_block_enabled: true
difficulty: Beginner
---

# parsnip svm_poly() in R: Polynomial Kernel SVM

<p class="lead">The parsnip <code>svm_poly()</code> function defines a polynomial-kernel support vector machine for tidymodels. It gives you one interface for a model that draws curved decision boundaries, fitted through the kernlab engine.</p>

[QUICK ANSWER]
svm_poly()                                  # default spec, kernlab engine
svm_poly() |> set_mode("classification")    # classify a factor outcome
svm_poly() |> set_mode("regression")        # predict a numeric outcome
svm_poly(degree = 3)                        # set the polynomial degree
svm_poly(cost = 2)                          # set the margin-violation penalty
svm_poly(scale_factor = 0.1)                # scale the kernel inner product
fit(spec, Species ~ ., data = iris)         # train on a dataset

[DECISION TREE: Is svm_poly() the right tool?]
- curved boundary from a polynomial kernel: svm_poly() |> set_engine("kernlab")
- straight maximum-margin boundary: svm_linear() |> set_engine("LiblineaR")
- smooth non-linear boundary via RBF kernel: svm_rbf() |> set_engine("kernlab")
- a linear classifier with probabilities: logistic_reg() |> set_engine("glm")
- tree-based non-linear model: rand_forest() |> set_engine("ranger")
- tune degree and cost by grid: tune_grid() with svm_poly()

## What svm_poly() does

**svm_poly() is a model specification, not a fitted model.** It records your choice of a polynomial-kernel support vector machine and its hyperparameters, but no data touches it until you call `fit()`. This separation lets you reuse one specification across many datasets or resampling folds.

A polynomial SVM maps the predictors into a higher-dimensional space through a polynomial kernel, then finds the widest-margin boundary in that space. Back in the original space, that boundary looks like a curve. The `degree` argument sets how flexible the curve is: degree 1 is a straight line, degree 2 bends once, and higher degrees bend more. The `cost` argument trades margin width against misclassified points.

The function belongs to the tidymodels framework. Because parsnip standardizes the interface, `svm_poly()` shares the same `fit()` and `predict()` verbs used by every other parsnip model.

[KEY INSIGHT]
**A parsnip spec is a recipe for a model, not the model itself.** You build the specification once, then `fit()` turns it into a trained model object. Keeping those two steps apart is what makes tidymodels workflows reproducible across resamples.

[NOTE]
**svm_poly() ships in core parsnip, but its engine does not.** The only engine is `kernlab`, so you need the `kernlab` package installed before you fit. Install it first, or R reports that the engine is not available.

## svm_poly() syntax and arguments

**svm_poly() takes four hyperparameters and two setup verbs.** The arguments shape the polynomial kernel, while `set_engine()` and `set_mode()` finish the specification.

```r title="The svm_poly specification skeleton"
library(tidymodels)

svm_poly(
  mode = "unknown",      # set to "classification" or "regression"
  engine = "kernlab",    # kernlab is the only engine
  cost = NULL,           # penalty for margin violations
  degree = NULL,         # degree of the polynomial kernel
  scale_factor = NULL,   # scaling applied to the kernel inner product
  margin = NULL          # epsilon insensitivity band (regression only)
)
```

The `degree` argument is what makes this model non-linear: it sets the power of the polynomial kernel. The `scale_factor` argument multiplies the inner product inside the kernel and controls how strongly far-apart points influence each other. The `cost` argument sets the penalty for margin violations, and `margin` sets the epsilon band used only in regression.

**The mode is never "unknown" at fit time.** A polynomial SVM can predict a class or a number, so you must call `set_mode("classification")` or `set_mode("regression")` before fitting. You can pass the engine through `set_engine()` instead of the `engine` argument, which is the more common tidymodels style.

## Fit a polynomial SVM: four examples

**Every example below uses a built-in R dataset.** The `iris` data drives the classification examples and `mtcars` drives the regression example, so the code runs anywhere with no downloads.

### Example 1: Classify with the kernlab engine

**Build the specification, then fit it to data.** A degree of 2 gives the boundary a single bend, enough to separate the iris species cleanly.

```r title="Fit svm_poly on the iris data"
svm_spec <- svm_poly(cost = 1, degree = 2) |>
  set_engine("kernlab") |>
  set_mode("classification")

svm_fit <- svm_spec |>
  fit(Species ~ ., data = iris)

preds <- predict(svm_fit, new_data = iris)
mean(preds$.pred_class == iris$Species)
#> [1] 0.98
```

The model assigns a class to every iris flower, and comparing those labels to the true species gives a training accuracy near 98%. The polynomial kernel bends the boundary slightly, which separates versicolor from virginica a touch better than a straight line would.

### Example 2: Predict species for new rows

**predict() returns a tidy tibble with one row per input row.** Each prediction is the class on whichever side of the curved boundary the row falls.

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

### Example 3: Fit a regression polynomial SVM on mtcars

**Switch the mode to "regression" and the same function predicts a number.** The `margin` argument now controls the width of the insensitivity band.

```r title="Fit a regression polynomial SVM on mtcars"
svm_reg <- svm_poly(cost = 1, degree = 2, margin = 0.1) |>
  set_engine("kernlab") |>
  set_mode("regression")

svm_reg_fit <- svm_reg |>
  fit(mpg ~ ., data = mtcars)

predict(svm_reg_fit, new_data = mtcars[1:3, ])
#> # A tibble: 3 x 1
#>   .pred
#>   <dbl>
#> 1  21.3
#> 2  21.0
#> 3  25.9
```

The regression SVM returns a numeric `.pred` column. Residuals inside the `margin` band of 0.1 add nothing to the loss, so the fit ignores tiny errors and concentrates on the larger ones.

### Example 4: Get class probabilities

**The kernlab engine can return per-class probabilities.** Pass `type = "prob"` to `predict()` to get them.

```r title="Predict class probabilities with svm_poly"
prob_fit <- svm_poly(cost = 1, degree = 2) |>
  set_engine("kernlab") |>
  set_mode("classification") |>
  fit(Species ~ ., data = iris)

predict(prob_fit, new_data = iris[c(1, 70, 130), ], type = "prob")
#> # A tibble: 3 x 3
#>   .pred_setosa .pred_versicolor .pred_virginica
#>          <dbl>            <dbl>           <dbl>
#> 1        0.98             0.01            0.01
#> 2        0.02             0.94            0.04
#> 3        0.01             0.03            0.96
```

The probability columns are named `.pred_<class>` and each row sums to one. kernlab estimates these with Platt scaling, which fits a logistic curve to the SVM decision values.

[TIP]
**Normalize your predictors before fitting a polynomial SVM.** The kernel multiplies predictor values together, so a variable measured in thousands swamps one measured in fractions. Add `step_normalize(all_numeric_predictors())` in a recipe so each predictor contributes fairly.

## svm_poly() vs svm_linear() vs svm_rbf()

**parsnip ships three SVM specifications, one per kernel.** They share the same verbs, so swapping between them is a one-line change.

| Function | Kernel | Boundary shape | Use when |
|---|---|---|---|
| `svm_linear()` | Linear | Straight hyperplane | Classes are close to linearly separable |
| `svm_poly()` | Polynomial | Curved, degree-controlled | You expect interaction effects or gentle curves |
| `svm_rbf()` | Radial basis | Smooth, locally flexible | The boundary is clearly non-linear and irregular |

The decision rule is short. Start with `svm_linear()` for speed and interpretability, reach for `svm_poly()` when a low-degree curve fits the problem, and use `svm_rbf()` when the boundary is too irregular for a polynomial.

## Common pitfalls

**Three mistakes catch most newcomers to svm_poly().** Each one below shows the problem and the fix.

The most common is forgetting to set the mode. A polynomial SVM can classify or predict a number, so parsnip cannot guess which one you want and `fit()` fails until you call `set_mode()`.

```r title="Mode must be set before fitting"
# Wrong: no mode, fit() cannot dispatch
svm_poly(degree = 2) |>
  set_engine("kernlab") |>
  fit(Species ~ ., data = iris)
#> Error: Please set the mode in the model specification.

# Right: set the mode first
svm_poly(degree = 2) |>
  set_engine("kernlab") |>
  set_mode("classification") |>
  fit(Species ~ ., data = iris)
```

The second pitfall is pushing `degree` too high. A degree of 4 or 5 bends the boundary so much that it memorizes the training data and generalizes poorly. The third is leaving predictors unscaled, which lets a large-scale variable dominate the polynomial kernel and skews the boundary.

[WARNING]
**A high degree overfits fast.** Each extra degree adds curvature the model can use to wrap around individual training points. Keep `degree` at 2 or 3 unless cross-validation clearly favors more, and always score the choice on held-out folds rather than training accuracy.

## Try it yourself

**Try it:** Fit a regression polynomial SVM on `mtcars` with `degree = 3`, then predict `mpg` for the first row. Save the prediction to `ex_pred`.

```r title="Your turn: regression SVM on mtcars"
# Try it: fit a degree = 3 regression SVM, then predict row 1
ex_spec <- # your code here
ex_fit  <- # your code here
ex_pred <- # your code here

ex_pred
#> Expected: a 1-row tibble with one .pred value near 21
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_spec <- svm_poly(cost = 1, degree = 3) |>
  set_engine("kernlab") |>
  set_mode("regression")

ex_fit <- ex_spec |>
  fit(mpg ~ ., data = mtcars)

ex_pred <- predict(ex_fit, new_data = mtcars[1, ])
ex_pred
#> # A tibble: 1 x 1
#>   .pred
#>   <dbl>
#> 1  21.2
```

**Explanation:** Setting the mode to "regression" makes svm_poly() predict the numeric `mpg` column, and `degree = 3` gives the kernel a cubic shape. Row 1 of mtcars is the Mazda RX4, whose true mpg is 21, so the polynomial SVM lands close.

</details>

## Related parsnip functions

**svm_poly() works alongside the rest of the parsnip model family.** These functions cover the neighboring tasks in a tidymodels project.

- `svm_linear()` defines a support vector machine with a straight, linear boundary.
- `svm_rbf()` defines a support vector machine with a radial basis kernel.
- `set_engine()` chooses the computational backend for any specification.
- `set_mode()` declares whether the model classifies or regresses.
- `fit()` trains a specification on data and returns a model object.

## FAQ

**What package is svm_poly() in?**

`svm_poly()` ships in core parsnip, so `library(tidymodels)` or `library(parsnip)` makes it available. The function only describes the model, though, and the actual fitting happens in an engine package. The single registered engine is `kernlab`, so you must install the `kernlab` package separately before you call `fit()`.

**What is the difference between svm_poly() and svm_rbf()?**

`svm_poly()` uses a polynomial kernel, so its decision boundary is a degree-controlled curve that bends a fixed number of times. `svm_rbf()` uses a radial basis kernel that produces a smooth, locally flexible boundary with no fixed shape. Choose `svm_poly()` when you expect gentle curves or interaction effects, and `svm_rbf()` when the boundary is irregular. The RBF kernel is the more common default for non-linear problems.

**What does the degree argument control in svm_poly()?**

The `degree` argument sets the power of the polynomial kernel. Degree 1 produces a straight boundary, the same shape `svm_linear()` gives. Degree 2 lets the boundary bend once, degree 3 twice, and so on. Higher degrees add flexibility but also raise the risk of overfitting, so most problems are well served by a degree of 2 or 3 chosen with cross-validation.

**Does svm_poly() give class probabilities?**

Yes. The kernlab engine supports probability predictions, so `predict(fit, type = "prob")` returns one `.pred_<class>` column per class. kernlab estimates the probabilities with Platt scaling, which fits a logistic curve to the raw SVM decision values. The columns in each row sum to one, which makes them safe to use as calibrated class scores.

**How do I tune svm_poly() hyperparameters?**

Mark the arguments with `tune()`, as in `svm_poly(cost = tune(), degree = tune())`, then pass the specification to `tune_grid()` with a resampling object such as `vfold_cv()`. The framework scores a grid of cost and degree combinations with cross-validation. Use `select_best()` to pick the winner, then `finalize_workflow()` to lock the values before the final fit.

For the full argument reference, see the [parsnip svm_poly() documentation](https://parsnip.tidymodels.org/reference/svm_poly.html).
