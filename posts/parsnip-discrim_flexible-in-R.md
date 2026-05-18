---
title: "parsnip discrim_flexible() in R: Fit FDA Models"
slug: parsnip-discrim_flexible-in-R
description: "Use parsnip discrim_flexible() to fit flexible discriminant analysis (FDA) models in R. Covers syntax, the earth engine, MARS tuning, and common pitfalls."
keywords: "parsnip discrim_flexible, discrim_flexible function R, parsnip discrim_flexible examples, flexible discriminant analysis R, discrim_flexible tidymodels, FDA in R, discrim_flexible earth engine"
mathjax: false
webr: true
date: 2026-05-18
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "discrim_flexible()|parsnip discrim_flexible|discrim::discrim_flexible()|flexible discriminant analysis|discrim_flexible"
auto_link_case_sensitive: true
target_keyword: "parsnip discrim_flexible"
sibling_block_enabled: true
difficulty: Beginner
---

# parsnip discrim_flexible() in R: Fit FDA Models

<p class="lead">The parsnip <code>discrim_flexible()</code> function defines a flexible discriminant analysis (FDA) model in R. It keeps the discriminant analysis framework but swaps the linear step for a MARS basis expansion, so the decision boundary can bend instead of staying straight.</p>

[QUICK ANSWER]
discrim_flexible()                                 # default FDA spec, earth engine
discrim_flexible(prod_degree = 1)                  # additive model, no interactions
discrim_flexible(prod_degree = 2)                  # allow two-way interactions
discrim_flexible(num_terms = 8)                    # cap retained MARS terms
discrim_flexible(prune_method = "backward")        # MARS pruning method
discrim_flexible(num_terms = tune())               # mark a parameter for tuning
discrim_flexible() |> set_engine("earth")          # the only engine
discrim_flexible() |> fit(Species ~ ., train)      # fit to training data

[DECISION TREE: Is discrim_flexible() the right tool?]
- nonlinear class boundary, basis expansion: discrim_flexible()
- classes share covariance, linear boundary: discrim_linear()
- classes differ in spread, curved boundary: discrim_quad()
- want an LDA-to-QDA shrinkage blend: discrim_regularized()
- tree-based splits, mixed predictors: decision_tree()
- two classes, want interpretable odds: logistic_reg()

## What discrim_flexible() does

**`discrim_flexible()` creates a flexible discriminant analysis specification.** Like its discriminant siblings it belongs to the parsnip model family but ships in the companion `discrim` package, so you load both `tidymodels` and `discrim`. The function returns a model specification, not a fitted model. You pair it with the `earth` engine, set the mode, then call `fit()`.

FDA, introduced by Hastie, Tibshirani, and Buja in 1994, generalizes linear discriminant analysis. Plain LDA fits a linear regression internally to separate classes. FDA replaces that linear step with a flexible nonparametric regression. With the `earth` engine, that regression is MARS, multivariate adaptive regression splines, which means the model can capture curved boundaries that LDA cannot.

## discrim_flexible() syntax and arguments

**`discrim_flexible()` exposes three hyperparameters, all passed through to the `earth` engine.** That is more than `discrim_linear()` and `discrim_quad()`, which have nothing to tune, and it reflects the extra flexibility of the MARS basis.

| Argument | Purpose | Typical values |
|---|---|---|
| `num_terms` | Number of MARS terms retained in the final model | integer, or `tune()` |
| `prod_degree` | Highest interaction degree among predictors | 1 (additive) or 2 |
| `prune_method` | MARS pruning method passed to `earth` | `"backward"`, `"none"`, `"cv"` |
| `mode` | Prediction type | `"classification"` (the only valid mode) |
| `engine` | Computational backend | `"earth"` (the only engine) |

A complete specification chains the spec with `set_engine()` and `set_mode()`.

```r title="Define a flexible discriminant spec"
library(tidymodels)
library(discrim)

fda_spec <- discrim_flexible(prod_degree = 1) |>
  set_engine("earth") |>
  set_mode("classification")

fda_spec
#> Flexible Discriminant Model Specification (classification)
#>
#> Main Arguments:
#>   prod_degree = 1
#>
#> Computational engine: earth
```

The printed object confirms the argument, the mode, and the engine. Nothing is fitted yet, so this spec is reusable across resamples and workflows.

[NOTE]
**`earth` is the only engine.** `discrim_flexible()` always calls `mda::fda()` with `method = earth::earth`, so the `earth` package must be installed alongside `discrim`. There is no engine choice to make, though keeping `set_engine("earth")` documents intent.

## Fit a flexible discriminant model

**`fit()` runs the MARS basis search and estimates the discriminant directions.** Split the data first so you can measure honest accuracy on rows the model never saw. The `iris` dataset works well: three classes and four numeric predictors.

```r title="Fit FDA on the iris data"
set.seed(42)
iris_split <- initial_split(iris, prop = 0.75, strata = Species)
iris_train <- training(iris_split)
iris_test  <- testing(iris_split)

fda_fit <- fda_spec |>
  fit(Species ~ ., data = iris_train)

fda_fit
#> parsnip model object
#>
#> Call:
#> fda(formula = Species ~ ., data = data, degree = ~1, method = earth)
#>
#> Dimension: 2
#>
#> Percent Between-Group Variance Explained:
#>     v1     v2
#>  99.08 100.00
#>
#> Training Misclassification Error: 0.0273 ( N = 110 )
```

The fitted object reports the discriminant dimensions and a training error. Predictions arrive as tidy tibbles, one column for the class and one column per class for probabilities.

```r title="Predict classes and probabilities"
predict(fda_fit, iris_test) |> head(3)
#> # A tibble: 3 x 1
#>   .pred_class
#>   <fct>
#> 1 setosa
#> 2 setosa
#> 3 setosa

predict(fda_fit, iris_test, type = "prob") |> head(3)
#> # A tibble: 3 x 3
#>   .pred_setosa .pred_versicolor .pred_virginica
#>          <dbl>            <dbl>           <dbl>
#> 1         1.00        0.0000571       0.00000002
#> 2         1.00        0.0000419       0.00000001
#> 3         1.00        0.0000332       0.00000001
```

Bind the predictions back to the test set to score the model with `yardstick`'s `accuracy()`.

## Tune num_terms and prod_degree

**The flexibility of FDA is only an advantage when the MARS settings are chosen by data, not by guesswork.** Mark `num_terms` and `prod_degree` with `tune()`, build a grid, and resample with cross-validation. The `dials` package supplies parameter objects named after each argument.

```r title="Tune the MARS parameters"
fda_tune <- discrim_flexible(
  num_terms   = tune(),
  prod_degree = tune()
) |>
  set_engine("earth") |>
  set_mode("classification")

set.seed(7)
folds <- vfold_cv(iris_train, v = 5, strata = Species)

fda_grid <- grid_regular(
  num_terms(range = c(2, 12)),
  prod_degree(),
  levels = 4
)

fda_res <- tune_grid(fda_tune, Species ~ ., resamples = folds, grid = fda_grid)

show_best(fda_res, metric = "accuracy", n = 3)
#> # A tibble: 3 x 8
#>   num_terms prod_degree .metric  .estimator  mean     n std_err .config
#>       <int>       <int> <chr>    <chr>      <dbl> <int>   <dbl> <chr>
#> 1         8           1 accuracy multiclass 0.973     5  0.0163 Prepro~
#> 2         5           1 accuracy multiclass 0.964     5  0.0201 Prepro~
#> 3        12           2 accuracy multiclass 0.955     5  0.0226 Prepro~
```

On `iris` an additive model with a modest term count scores highest, since the classes are nearly linearly separable. Harder data rewards more terms and a higher product degree.

[TIP]
**Finalize the spec with the winning settings.** Pass `select_best(fda_res, metric = "accuracy")` to `finalize_model()` to lock the tuned values, then refit on the full training set before predicting on test data.

## discrim_flexible() vs linear discriminant models

**FDA is the nonlinear member of the discriminant family.** Its three linear siblings keep the boundary straight or quadratic, while `discrim_flexible()` lets MARS bend it wherever the data asks. The table shows where each function sits.

| Function | Boundary | Covariance assumption | Tuning parameters |
|---|---|---|---|
| `discrim_linear()` | Linear | Shared across classes | None |
| `discrim_quad()` | Quadratic | One per class | None |
| `discrim_regularized()` | Between linear and quadratic | Shrunk blend | 2 fractions |
| `discrim_flexible()` | Nonlinear, piecewise | Replaced by MARS regression | 3 (terms, degree, pruning) |

Allowing two-way interactions with `prod_degree = 2` gives MARS more freedom, which helps when classes overlap in a curved region.

```r title="Compare additive and interaction FDA"
fda_d2 <- discrim_flexible(prod_degree = 2) |>
  set_engine("earth") |>
  set_mode("classification") |>
  fit(Species ~ ., data = iris_train)

iris_test |>
  bind_cols(predict(fda_d2, iris_test)) |>
  accuracy(Species, .pred_class) |>
  pull(.estimate)
#> [1] 0.9736842
```

[KEY INSIGHT]
**FDA is LDA with the linear step swapped out.** Classic LDA hides a linear regression inside its machinery. `discrim_flexible()` keeps the discriminant framework but replaces that regression with MARS, so the same model now draws piecewise boundaries instead of straight lines.

## Common pitfalls

**FDA fails in a few predictable ways.** Each has a clear fix.

- **`discrim` not loaded.** `discrim_flexible()` is not in parsnip core. Without `library(discrim)` you get `could not find function`.
- **`earth` package missing.** The only engine calls `earth`. If that package is not installed, `fit()` errors when it tries to build the MARS basis.
- **`prod_degree` set too high.** Degrees above 2 rarely help classification and invite overfitting. Stick to 1 or 2 and let `num_terms` control complexity.

```r title="Pitfall: discrim package not loaded"
# library(discrim) was never called
discrim_flexible()
#> Error: could not find function "discrim_flexible"
```

[WARNING]
**Loading `tidymodels` alone is not enough.** The core `tidymodels` bundle does not attach `discrim`. Always call `library(discrim)` in the same script, or the model function will not be found.

## Try it yourself

**Try it:** Tune `num_terms` only, holding `prod_degree` at 1, on `iris_train` with 5-fold cross-validation, and report the best accuracy. Save the tuning result to `ex_res`.

```r title="Your turn: tune num_terms"
# Try it: tune num_terms with prod_degree fixed at 1
ex_spec <- discrim_flexible(num_terms = tune(), prod_degree = 1) |>
  set_engine("earth") |>
  set_mode("classification")
ex_res <- # your code here

show_best(ex_res, metric = "accuracy", n = 1)
#> Expected: one row with the best num_terms
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(7)
ex_folds <- vfold_cv(iris_train, v = 5, strata = Species)
ex_grid  <- grid_regular(num_terms(range = c(2, 12)), levels = 5)
ex_res <- tune_grid(ex_spec, Species ~ ., resamples = ex_folds, grid = ex_grid)

show_best(ex_res, metric = "accuracy", n = 1)
#> # A tibble: 1 x 7
#>   num_terms .metric  .estimator  mean     n std_err .config
#>       <int> <chr>    <chr>      <dbl> <int>   <dbl> <chr>
#> 1         7 accuracy multiclass 0.973     5  0.0163 Preprocessor1_Model1
```

**Explanation:** Fixing `prod_degree` at 1 keeps the model additive, so the grid only varies how many MARS terms survive pruning. `grid_regular()` with `levels = 5` spreads `num_terms` evenly across the chosen range.

</details>

## Related parsnip functions

**These functions pair naturally with `discrim_flexible()`.**

- [discrim_linear()](discrim_linear-in-R.html) defines an LDA model with a shared covariance.
- [discrim_quad()](discrim_quad-in-R.html) defines a QDA model with one covariance per class.
- [discrim_regularized()](discrim_regularized-in-R.html) blends LDA and QDA through two shrinkage fractions.
- `set_engine()` selects the computational backend.
- `tune()` marks an argument for grid search.

## FAQ

**What is flexible discriminant analysis?**

Flexible discriminant analysis (FDA) is a classification method that generalizes linear discriminant analysis. LDA fits a linear regression internally to map predictors onto discriminant coordinates. FDA replaces that linear regression with a flexible nonparametric one, which with the `earth` engine is MARS. The result keeps the interpretable discriminant framework but allows curved, piecewise decision boundaries. `discrim_flexible()` is the parsnip interface to this model.

**What is the difference between discrim_flexible() and discrim_linear()?**

`discrim_linear()` fits classic LDA with a single linear boundary and a covariance shared across classes. It has no tuning parameters. `discrim_flexible()` keeps the discriminant framework but swaps the internal linear regression for a MARS basis expansion, so the boundary can bend. That flexibility comes with three hyperparameters, `num_terms`, `prod_degree`, and `prune_method`, which control how complex the MARS model becomes.

**Which engine does discrim_flexible() support?**

`discrim_flexible()` supports a single engine, `"earth"`, which calls `mda::fda()` with `method = earth::earth` under the hood. There is no alternative backend, so `set_engine("earth")` is optional, though keeping it makes the specification explicit. The `earth` package must be installed in addition to `discrim`. Run `discrim_flexible() |> translate()` to see the exact engine call parsnip will make.

**How do I tune a flexible discriminant model in R?**

Mark `num_terms` and `prod_degree` with `tune()`, build a grid with `grid_regular(num_terms(range = c(2, 12)), prod_degree())`, and pass it to `tune_grid()` with a `vfold_cv()` resampling object. Inspect results with `show_best()` and lock the winner with `select_best()` plus `finalize_model()`. Cross-validation matters here because more MARS terms always cut training error but can hurt test accuracy.

**Does discrim_flexible() handle nonlinear decision boundaries?**

Yes. That is the whole point of the model. The MARS basis behind the `earth` engine builds piecewise linear hinge functions, and combining them produces curved class boundaries. Setting `prod_degree = 2` adds two-way interactions, bending the boundary further. This is what separates `discrim_flexible()` from `discrim_linear()` and `discrim_quad()`, whose boundaries are fixed as linear or quadratic.

For the full argument reference, see the [discrim package documentation](https://discrim.tidymodels.org/reference/discrim_flexible.html).
