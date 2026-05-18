---
title: "parsnip svm_linear() in R: Linear SVM Specification"
slug: parsnip-svm_linear-in-R
description: "parsnip svm_linear() in R defines linear support vector machine models for tidymodels. Covers syntax, the LiblineaR and kernlab engines, and examples."
keywords: "parsnip svm_linear, svm_linear function R, parsnip svm_linear examples, linear SVM R tidymodels, support vector machine R parsnip, svm_linear kernlab engine"
mathjax: false
webr: true
date: "2026-05-18"
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: Support-Vector-Machines-With-R.html
auto_link_terms: "svm_linear()|parsnip svm_linear|parsnip::svm_linear()|linear SVM in R|tidymodels SVM"
auto_link_case_sensitive: true
target_keyword: "parsnip svm_linear"
sibling_block_enabled: true
difficulty: Beginner
---

# parsnip svm_linear() in R: Linear SVM Specification

<p class="lead">The parsnip <code>svm_linear()</code> function defines a linear support vector machine, a maximum-margin classifier or regressor, for tidymodels. It gives you one interface that fits with the LiblineaR or kernlab engine underneath.</p>

[QUICK ANSWER]
svm_linear()                                  # default spec, LiblineaR engine
svm_linear() |> set_mode("classification")    # classify a factor outcome
svm_linear() |> set_mode("regression")        # predict a numeric outcome
svm_linear(cost = 2)                          # set the margin-violation penalty
svm_linear(margin = 0.1)                      # set epsilon for regression
svm_linear() |> set_engine("kernlab")         # swap the backend engine
fit(spec, Species ~ ., data = iris)           # train on a dataset

[DECISION TREE: Is svm_linear() the right tool?]
- linear boundary, maximum margin: svm_linear() |> set_engine("LiblineaR")
- non-linear boundary via RBF kernel: svm_rbf() |> set_engine("kernlab")
- polynomial decision boundary: svm_poly() |> set_engine("kernlab")
- a linear classifier with probabilities: logistic_reg() |> set_engine("glm")
- tree-based non-linear model: rand_forest() |> set_engine("ranger")
- tune the cost penalty by grid: tune_grid() with svm_linear()

## What svm_linear() does

**svm_linear() is a model specification, not a fitted model.** It records your choice of a linear support vector machine and its hyperparameters, but no data touches it until you call `fit()`. This separation lets you reuse one specification across many datasets or resampling folds.

A linear SVM finds the straight boundary, a hyperplane, that separates classes with the widest possible margin. The `cost` argument trades margin width against misclassified points: a high cost fits the training data tightly, a low cost keeps a wider, smoother margin. For regression, the model fits a flat band of width `margin` and penalizes only points outside it.

The function belongs to the tidymodels framework. Because parsnip standardizes the interface, the same `svm_linear()` code runs on the fast LiblineaR engine or the kernlab engine with only one line changed.

[KEY INSIGHT]
**A parsnip spec is a recipe for a model, not the model itself.** You build the specification once, then `fit()` turns it into a trained model object. Keeping those two steps apart is what makes tidymodels workflows reproducible across resamples.

[NOTE]
**svm_linear() ships in core parsnip, but the engines do not.** The default `LiblineaR` engine needs the `LiblineaR` package installed, and `set_engine("kernlab")` needs the `kernlab` package. Install the engine package before you fit, or R reports that the engine is not available.

## svm_linear() syntax and arguments

**svm_linear() takes two hyperparameters and two setup verbs.** The arguments control how strict the margin is, while `set_engine()` and `set_mode()` finish the specification.

```r title="The svm_linear specification skeleton"
library(tidymodels)

svm_linear(
  mode = "unknown",      # set to "classification" or "regression"
  engine = "LiblineaR",  # LiblineaR (default) or kernlab
  cost = NULL,           # penalty for margin violations
  margin = NULL          # epsilon insensitivity band (regression only)
)
```

The `cost` argument sets the penalty for points that fall inside the margin or on the wrong side of the boundary, where a larger cost means a tighter, lower-bias fit. The `margin` argument sets the epsilon insensitivity band used only in regression, where residuals smaller than `margin` cost nothing.

**The mode is never "unknown" at fit time.** A linear SVM can predict a class or a number, so you must call `set_mode("classification")` or `set_mode("regression")` before fitting. You can pass the engine through `set_engine()` instead of the `engine` argument, which is the more common tidymodels style.

## Fit a linear SVM: four examples

**Every example below uses a built-in R dataset.** The `iris` data drives the classification examples and `mtcars` drives the regression example, so the code runs anywhere with no downloads.

### Example 1: Classify with the default LiblineaR engine

**Build the specification, then fit it to data.** The LiblineaR engine trains a linear SVM quickly and is the parsnip default.

```r title="Fit svm_linear on the iris data"
svm_spec <- svm_linear(cost = 1) |>
  set_engine("LiblineaR") |>
  set_mode("classification")

svm_fit <- svm_spec |>
  fit(Species ~ ., data = iris)

preds <- predict(svm_fit, new_data = iris)
mean(preds$.pred_class == iris$Species)
#> [1] 0.9666667
```

The model assigns a class to every iris flower, and comparing those labels to the true species gives a training accuracy near 97%. A straight boundary separates the three species well because the petal measurements are close to linearly separable.

### Example 2: Predict species for new rows

**predict() returns a tidy tibble with one row per input row.** Each prediction is the class on whichever side of the hyperplane the row falls.

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

The `.pred_class` column holds the predicted species as a factor. The LiblineaR engine returns hard class labels only; for per-class probabilities you switch to the kernlab engine, shown in Example 4.

### Example 3: Fit a regression linear SVM on mtcars

**Switch the mode to "regression" and the same function predicts a number.** The `margin` argument now controls the width of the insensitivity band.

```r title="Fit a regression linear SVM on mtcars"
svm_reg <- svm_linear(cost = 1, margin = 0.1) |>
  set_engine("LiblineaR") |>
  set_mode("regression")

svm_reg_fit <- svm_reg |>
  fit(mpg ~ ., data = mtcars)

predict(svm_reg_fit, new_data = mtcars[1:3, ])
#> # A tibble: 3 x 1
#>   .pred
#>   <dbl>
#> 1  22.6
#> 2  22.1
#> 3  26.3
```

The regression SVM returns a numeric `.pred` column. Residuals inside the `margin` band of 0.1 add nothing to the loss, so the fit ignores tiny errors and concentrates on the larger ones.

### Example 4: Get class probabilities with the kernlab engine

**Swap to kernlab when you need predicted probabilities.** The LiblineaR engine cannot produce them, but kernlab can.

```r title="Predict class probabilities with kernlab"
svm_prob <- svm_linear(cost = 1) |>
  set_engine("kernlab") |>
  set_mode("classification")

prob_fit <- svm_prob |>
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
**Normalize your predictors before fitting a linear SVM.** The cost penalty treats every predictor on its raw scale, so a variable measured in thousands drowns out one measured in fractions. Add `step_normalize(all_numeric_predictors())` in a recipe so each predictor contributes fairly.

## Compare svm_linear() engines

**svm_linear() runs on two engines that share the same code.** You swap engines with one `set_engine()` call, and parsnip translates `cost` and `margin` to each backend.

| Engine | Package | Strengths | Use when |
|---|---|---|---|
| `LiblineaR` | LiblineaR | Very fast on wide or sparse data | Large datasets; the default choice |
| `kernlab` | kernlab | Supports class probabilities, scales predictors | You need `.pred` probability columns |

The decision rule is short. Use `LiblineaR` for speed on large or sparse data, and switch to `kernlab` when you need class probabilities or want to match other kernlab SVM models in the same project.

## Common pitfalls

**Three mistakes catch most newcomers to svm_linear().** Each one below shows the problem and the fix.

The most common is forgetting to set the mode. A linear SVM can classify or predict a number, so parsnip cannot guess which one you want and `fit()` fails until you call `set_mode()`.

```r title="Mode must be set before fitting"
# Wrong: no mode, fit() cannot dispatch
svm_linear(cost = 1) |>
  set_engine("LiblineaR") |>
  fit(Species ~ ., data = iris)
#> Error: Please set the mode in the model specification.

# Right: set the mode first
svm_linear(cost = 1) |>
  set_engine("LiblineaR") |>
  set_mode("classification") |>
  fit(Species ~ ., data = iris)
```

The second pitfall is asking the LiblineaR engine for probabilities. `predict(fit, type = "prob")` errors unless the model was fit with the kernlab engine. The third is leaving predictors unscaled, which lets a large-scale variable dominate the cost penalty and skews the boundary.

[WARNING]
**type = "prob" fails on the LiblineaR engine.** parsnip reports that the LiblineaR engine does not support probability predictions. Refit the specification with `set_engine("kernlab")` if your workflow needs `.pred_<class>` probability columns.

## Try it yourself

**Try it:** Fit a regression linear SVM on `mtcars` with `cost = 2`, then predict `mpg` for the first row. Save the prediction to `ex_pred`.

```r title="Your turn: regression SVM on mtcars"
# Try it: fit a cost = 2 regression SVM, then predict row 1
ex_spec <- # your code here
ex_fit  <- # your code here
ex_pred <- # your code here

ex_pred
#> Expected: a 1-row tibble with one .pred value near 21
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_spec <- svm_linear(cost = 2) |>
  set_engine("LiblineaR") |>
  set_mode("regression")

ex_fit <- ex_spec |>
  fit(mpg ~ ., data = mtcars)

ex_pred <- predict(ex_fit, new_data = mtcars[1, ])
ex_pred
#> # A tibble: 1 x 1
#>   .pred
#>   <dbl>
#> 1  21.8
```

**Explanation:** Setting the mode to "regression" makes svm_linear() predict the numeric `mpg` column, and `cost = 2` tightens the fit. Row 1 of mtcars is the Mazda RX4, whose true mpg is 21, so the linear SVM lands close.

</details>

## Related parsnip functions

**svm_linear() works alongside the rest of the parsnip model family.** These functions cover the neighboring tasks in a tidymodels project.

- `svm_poly()` defines a support vector machine with a polynomial kernel.
- `svm_rbf()` defines a support vector machine with a radial basis kernel.
- `logistic_reg()` defines a linear classifier that returns probabilities directly.
- `set_engine()` chooses the computational backend for any specification.
- `fit()` trains a specification on data and returns a model object.

## FAQ

**What package is svm_linear() in?**

`svm_linear()` ships in core parsnip, so `library(tidymodels)` or `library(parsnip)` makes it available. The function only describes the model, though, and the actual fitting happens in an engine package. The default `LiblineaR` engine needs the `LiblineaR` package, and `set_engine("kernlab")` needs the `kernlab` package installed separately.

**What is the difference between svm_linear() and svm_rbf()?**

`svm_linear()` fits a straight decision boundary, a hyperplane, between classes. `svm_rbf()` uses a radial basis kernel that bends the boundary into flexible curves. Choose `svm_linear()` when the classes are close to linearly separable or the data has many predictors, and `svm_rbf()` when the boundary is clearly non-linear. The linear model trains faster and is easier to interpret.

**What engine does svm_linear() use by default?**

The default engine is `LiblineaR`, a fast C++ library built for linear classification and regression on large or sparse datasets. You can confirm or change it with `set_engine()`, and `show_engines("svm_linear")` lists every registered option. Switch to `kernlab` when you need predicted class probabilities, which LiblineaR does not provide.

**Does svm_linear() give class probabilities?**

Only with the kernlab engine. The default LiblineaR engine returns hard class labels, so `predict(fit, type = "prob")` errors. Refit with `set_engine("kernlab")` and kernlab estimates probabilities with Platt scaling. If you need calibrated probabilities and a linear boundary together, kernlab is the engine to use.

**How do I tune the cost parameter in svm_linear()?**

Set the argument to `tune()`, as in `svm_linear(cost = tune())`, then pass the specification to `tune_grid()` with a resampling object such as `vfold_cv()`. The framework scores a grid of cost values with cross-validation. Use `select_best()` to pick the winner, then `finalize_workflow()` to lock the value before the final fit.

For the full argument reference, see the [parsnip svm_linear() documentation](https://parsnip.tidymodels.org/reference/svm_linear.html).
