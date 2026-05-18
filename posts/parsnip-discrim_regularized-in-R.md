---
title: "parsnip discrim_regularized() in R: Fit RDA Models"
slug: parsnip-discrim_regularized-in-R
description: "Use parsnip discrim_regularized() to fit regularized discriminant analysis (RDA) models in R. Covers syntax, the two shrinkage knobs, tuning, and pitfalls."
keywords: "parsnip discrim_regularized, discrim_regularized function R, parsnip discrim_regularized examples, regularized discriminant analysis R, RDA tidymodels, discrim_regularized tidymodels, RDA in R"
mathjax: false
webr: true
date: 2026-05-18
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "discrim_regularized()|parsnip discrim_regularized|discrim::discrim_regularized()|regularized discriminant analysis|discrim_regularized"
auto_link_case_sensitive: true
target_keyword: "parsnip discrim_regularized"
sibling_block_enabled: true
difficulty: Beginner
---

# parsnip discrim_regularized() in R: Fit RDA Models

<p class="lead">The parsnip <code>discrim_regularized()</code> function defines a regularized discriminant analysis (RDA) model in R. It blends linear and quadratic discriminant analysis through two shrinkage knobs, so one model can sit anywhere between LDA and QDA.</p>

[QUICK ANSWER]
discrim_regularized()                              # default RDA spec, klaR engine
discrim_regularized(frac_common_cov = 1)           # behaves like LDA
discrim_regularized(frac_common_cov = 0)           # behaves like QDA
discrim_regularized(frac_identity = 0.5)           # shrink covariance to identity
discrim_regularized(frac_common_cov = tune())      # mark a parameter for tuning
discrim_regularized() |> set_engine("klaR")        # the only engine
discrim_regularized() |> fit(Species ~ ., train)   # fit to training data
predict(rda_fit, test, type = "prob")              # per-class probabilities

[DECISION TREE: Is discrim_regularized() the right tool?]
- many predictors, small classes, want shrinkage: discrim_regularized()
- classes share covariance, linear boundary: discrim_linear()
- classes differ in spread, curved boundary: discrim_quad()
- nonlinear fit via basis expansion: discrim_flexible()
- predictors far from normal: try decision_tree()
- two classes, want interpretable odds: logistic_reg()

## What discrim_regularized() does

**`discrim_regularized()` creates a regularized discriminant analysis specification.** Like its siblings it belongs to the parsnip model family but ships in the companion `discrim` package, so you load both `tidymodels` and `discrim`. The function returns a model specification, not a fitted model. You pair it with the `klaR` engine, set the mode, then call `fit()`.

RDA, introduced by Friedman in 1989, sits on a continuum between LDA and QDA. Two fractions control where it lands. `frac_common_cov` decides how much covariance is pooled across classes, and `frac_identity` decides how strongly each covariance is shrunk toward the identity matrix. Tuning those two values often beats picking plain LDA or QDA.

## discrim_regularized() syntax and arguments

**`discrim_regularized()` exposes two real hyperparameters, which is what sets it apart from `discrim_linear()` and `discrim_quad()`.** Those siblings have nothing to tune. RDA has two knobs that move it across the LDA-to-QDA spectrum.

| Argument | Purpose | Range |
|---|---|---|
| `frac_common_cov` | Fraction of covariance pooled across classes. 1 = LDA, 0 = QDA | 0 to 1 |
| `frac_identity` | Fraction shrinking each covariance toward the identity matrix | 0 to 1 |
| `mode` | Prediction type | `"classification"` (the only valid mode) |
| `engine` | Computational backend | `"klaR"` (the only engine) |

A complete specification chains the spec with `set_engine()` and `set_mode()`.

```r title="Define a regularized discriminant spec"
library(tidymodels)
library(discrim)

rda_spec <- discrim_regularized(frac_common_cov = 0.5, frac_identity = 0.1) |>
  set_engine("klaR") |>
  set_mode("classification")

rda_spec
#> Regularized Discriminant Model Specification (classification)
#>
#> Main Arguments:
#>   frac_common_cov = 0.5
#>   frac_identity = 0.1
#>
#> Computational engine: klaR
```

The printed object confirms both fractions, the mode, and the engine. Nothing is fitted yet, so this spec is reusable across resamples and workflows.

[NOTE]
**`klaR` is the only engine.** Unlike `discrim_quad()`, which also offers `sparsediscrim`, `discrim_regularized()` always calls `klaR::rda()`. There is no engine choice to make, so `set_engine("klaR")` is optional but worth keeping for clarity.

## Fit a regularized discriminant model

**`fit()` estimates the class means and the regularized covariance matrices.** Split the data first so you can measure honest accuracy on rows the model never saw. The `iris` dataset works well: three classes and four numeric predictors.

```r title="Fit RDA on the iris data"
set.seed(42)
iris_split <- initial_split(iris, prop = 0.75, strata = Species)
iris_train <- training(iris_split)
iris_test  <- testing(iris_split)

rda_fit <- rda_spec |>
  fit(Species ~ ., data = iris_train)

rda_fit
#> parsnip model object
#>
#> Call:
#> rda(formula = Species ~ ., data = data, lambda = ~0.5, gamma = ~0.1)
#>
#> Regularization parameters:
#>  gamma lambda
#>    0.1    0.5
```

Parsnip maps `frac_common_cov` to `klaR`'s `lambda` and `frac_identity` to `gamma`, so the printed call shows `lambda = 0.5` and `gamma = 0.1`. Predictions arrive as tidy tibbles.

```r title="Predict classes and probabilities"
predict(rda_fit, iris_test) |> head(3)
#> # A tibble: 3 x 1
#>   .pred_class
#>   <fct>
#> 1 setosa
#> 2 setosa
#> 3 setosa

predict(rda_fit, iris_test, type = "prob") |> head(3)
#> # A tibble: 3 x 3
#>   .pred_setosa .pred_versicolor .pred_virginica
#>          <dbl>            <dbl>           <dbl>
#> 1        1.000         0.000256      0.00000011
#> 2        1.000         0.000691      0.00000043
#> 3        1.000         0.000113      0.00000002
```

Bind the predictions back to the test set to score the model with `yardstick`'s `accuracy()`.

## Tune frac_common_cov and frac_identity

**The point of RDA is to let the data choose the LDA-to-QDA blend.** Mark both arguments with `tune()`, build a grid, and resample with cross-validation. The `dials` package supplies parameter objects named after each argument.

```r title="Tune the regularization parameters"
rda_tune <- discrim_regularized(
  frac_common_cov = tune(),
  frac_identity   = tune()
) |>
  set_engine("klaR") |>
  set_mode("classification")

set.seed(7)
folds <- vfold_cv(iris_train, v = 5, strata = Species)

rda_grid <- grid_regular(frac_common_cov(), frac_identity(), levels = 4)

rda_res <- tune_grid(rda_tune, Species ~ ., resamples = folds, grid = rda_grid)

show_best(rda_res, metric = "accuracy", n = 3)
#> # A tibble: 3 x 8
#>   frac_common_cov frac_identity .metric  .estimator  mean     n std_err .config
#>             <dbl>         <dbl> <chr>    <chr>      <dbl> <int>   <dbl> <chr>
#> 1           0.333             0 accuracy multiclass 0.973     5  0.0163 Prepro~
#> 2           1                 0 accuracy multiclass 0.964     5  0.0201 Prepro~
#> 3           0.667             0 accuracy multiclass 0.964     5  0.0201 Prepro~
```

On `iris` the classes are well separated, so a partial pooling of covariance scores highest. The gap between settings widens on harder data.

[TIP]
**Finalize the spec with the winning fractions.** Pass `select_best(rda_res, metric = "accuracy")` to `finalize_model()` to lock the tuned values, then refit on the full training set before predicting on test data.

## discrim_regularized() vs LDA and QDA

**RDA contains LDA and QDA as special cases.** Set `frac_common_cov` to 1 and RDA reproduces linear discriminant analysis. Set it to 0 and RDA reproduces quadratic discriminant analysis. Every value in between is a mixture that neither sibling can express.

| Setting | Equivalent model | Boundary |
|---|---|---|
| `frac_common_cov = 1` | LDA (`discrim_linear()`) | Linear |
| `frac_common_cov = 0` | QDA (`discrim_quad()`) | Quadratic |
| `0 < frac_common_cov < 1` | Regularized blend | Between |
| `frac_identity > 0` | Extra shrinkage to identity | Stabilized |

```r title="Reproduce LDA with RDA"
as_lda <- discrim_regularized(frac_common_cov = 1, frac_identity = 0) |>
  set_engine("klaR") |>
  set_mode("classification") |>
  fit(Species ~ ., data = iris_train)

iris_test |>
  bind_cols(predict(as_lda, iris_test)) |>
  accuracy(Species, .pred_class) |>
  pull(.estimate)
#> [1] 0.9736842
```

[KEY INSIGHT]
**RDA is a dial, not a third model.** LDA and QDA are the two endpoints of a single slider. `discrim_regularized()` exposes that slider so cross-validation can land between them, which is useful when classes are too small for stable QDA but too distinct for LDA.

## Common pitfalls

**RDA fails in a few predictable ways.** Each has a clear fix.

- **`discrim` not loaded.** `discrim_regularized()` is not in parsnip core. Without `library(discrim)` you get `could not find function`.
- **Fractions outside 0 to 1.** Both `frac_common_cov` and `frac_identity` are fractions. Values above 1 or below 0 produce errors or meaningless covariance estimates.
- **Tuning on a single split.** One train-test split makes the chosen fractions noisy. Always resample with `vfold_cv()` before trusting a setting.

```r title="Pitfall: discrim package not loaded"
# library(discrim) was never called
discrim_regularized()
#> Error: could not find function "discrim_regularized"
```

[WARNING]
**Loading `tidymodels` alone is not enough.** The core `tidymodels` bundle does not attach `discrim`. Always call `library(discrim)` in the same script, or the model function will not be found.

## Try it yourself

**Try it:** Tune `frac_common_cov` only, holding `frac_identity` at 0, on `iris_train` with 5-fold cross-validation, and report the best accuracy. Save the tuning result to `ex_res`.

```r title="Your turn: tune frac_common_cov"
# Try it: tune frac_common_cov with frac_identity fixed
ex_spec <- discrim_regularized(frac_common_cov = tune(), frac_identity = 0) |>
  set_engine("klaR") |>
  set_mode("classification")
ex_res <- # your code here

show_best(ex_res, metric = "accuracy", n = 1)
#> Expected: one row with the best frac_common_cov
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(7)
ex_folds <- vfold_cv(iris_train, v = 5, strata = Species)
ex_grid  <- grid_regular(frac_common_cov(), levels = 5)
ex_res <- tune_grid(ex_spec, Species ~ ., resamples = ex_folds, grid = ex_grid)

show_best(ex_res, metric = "accuracy", n = 1)
#> # A tibble: 1 x 7
#>   frac_common_cov .metric  .estimator  mean     n std_err .config
#>             <dbl> <chr>    <chr>      <dbl> <int>   <dbl> <chr>
#> 1            0.25 accuracy multiclass 0.973     5  0.0163 Preprocessor1_Model1
```

**Explanation:** Fixing `frac_identity` at 0 keeps the second regularizer off, so the grid only varies the LDA-to-QDA blend. `grid_regular()` with `levels = 5` spreads `frac_common_cov` evenly from 0 to 1.

</details>

## Related parsnip functions

**These functions pair naturally with `discrim_regularized()`.**

- [discrim_linear()](discrim_linear-in-R.html) defines an LDA model with a shared covariance.
- [discrim_quad()](discrim_quad-in-R.html) defines a QDA model with one covariance per class.
- `discrim_flexible()` fits flexible discriminant analysis via basis expansion.
- `set_engine()` selects the computational backend.
- `tune()` marks an argument for grid search.

## FAQ

**What is the difference between discrim_regularized() and discrim_quad()?**

`discrim_quad()` fits quadratic discriminant analysis with a separate covariance matrix per class and has no tuning parameters. `discrim_regularized()` adds two fractions, `frac_common_cov` and `frac_identity`, that pull the covariance estimates toward a pooled matrix or toward the identity. QDA is one fixed point on that scale, recovered when `frac_common_cov` is 0. RDA can sit anywhere between LDA and QDA, which helps when a class is too small for stable QDA.

**What do frac_common_cov and frac_identity control?**

`frac_common_cov` sets how much of each class covariance is replaced by one pooled covariance shared across all classes. A value of 1 gives linear discriminant analysis; 0 gives quadratic. `frac_identity` sets how strongly each covariance is shrunk toward the identity matrix, which stabilizes estimates when predictors are correlated or rows are scarce. Both are fractions between 0 and 1, and both can be tuned.

**Which engine does discrim_regularized() support?**

`discrim_regularized()` supports a single engine, `"klaR"`, which calls `klaR::rda()` under the hood. There is no alternative backend, so `set_engine("klaR")` is optional, though keeping it makes the specification explicit. Run `discrim_regularized() |> translate()` to see the exact engine call parsnip will make, including how the two fractions map to `klaR`'s `lambda` and `gamma`.

**Does discrim_regularized() need feature scaling?**

No. RDA is built on covariance matrices, and rescaling predictors does not change the fitted decision boundary. You can still center and scale inside a recipe for consistency with other models in a workflow, but `discrim_regularized()` does not require it. What does matter is roughly normal predictors within each class, since discriminant analysis assumes class-conditional normality.

**How do I tune a regularized discriminant model in R?**

Mark `frac_common_cov` and `frac_identity` with `tune()`, build a grid with `grid_regular(frac_common_cov(), frac_identity())`, and pass it to `tune_grid()` with a `vfold_cv()` resampling object. Inspect results with `show_best()` and lock the winner with `select_best()` plus `finalize_model()`. Cross-validation is essential here because the right blend depends on the data, not a fixed rule.

For the full argument reference, see the [discrim package documentation](https://discrim.tidymodels.org/reference/discrim_regularized.html).
