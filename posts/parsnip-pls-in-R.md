---
title: "parsnip pls() in R: Partial Least Squares Models"
slug: "parsnip-pls-in-R"
description: "Learn how parsnip pls() builds partial least squares models in R. Load the plsmod engine, fit regression and PLS-DA classification, and tune components."
keywords: "parsnip pls, pls function R, parsnip pls examples, partial least squares R tidymodels, plsmod, pls model spec R, PLS regression R"
mathjax: false
webr: true
date: "2026-05-18"
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: "tidymodels-Exercises-in-R.html"
auto_link_terms: "pls()|parsnip pls|plsmod::pls()|partial least squares|PLS regression"
auto_link_case_sensitive: true
target_keyword: "parsnip pls"
sibling_block_enabled: true
difficulty: Intermediate
---

# parsnip pls() in R: Partial Least Squares Models

<p class="lead">parsnip pls() defines a partial least squares model in R. It compresses many correlated predictors into a few latent components, choosing each component to maximize covariance with the outcome.</p>

[QUICK ANSWER]
pls(num_comp = 3)                              # 3 latent components
pls(mode = "regression")                       # regression mode
pls(mode = "classification")                   # PLS-DA classification
pls(num_comp = 3, predictor_prop = 0.5)        # sparse PLS, variable selection
pls() |> set_engine("mixOmics")                # the only engine
pls(num_comp = tune())                         # tune the component count
fit(spec, mpg ~ ., data = mtcars)              # fit the spec

[DECISION TREE: Is pls() the right tool?]
- many correlated predictors, want components: pls(num_comp = 3)
- few roughly independent predictors: linear_reg()
- unsupervised reduction before any model: step_pca() recipe
- penalize coefficients instead of reducing: linear_reg(penalty = 0.1)
- classify using latent components: pls(mode = "classification")
- nonlinear structure in the data: rand_forest() or boost_tree()

## What pls() does

**pls() defines a partial least squares model specification.** PLS builds a small set of latent components from the predictors and chooses each component to maximize its covariance with the outcome. It is the tool of choice when predictors are many and strongly correlated, such as spectra or gene expression columns.

The function comes from the **plsmod** package, a parsnip extension. It returns a model specification, not a fitted model, so you pair it with `set_engine()`, `set_mode()`, and `fit()` like any other parsnip spec. The only engine is `mixOmics`.

[NOTE]
**plsmod and mixOmics are separate installs.** pls() lives in plsmod, and the mixOmics engine is a Bioconductor package. Install plsmod from CRAN, install mixOmics with `BiocManager::install("mixOmics")`, then load `library(plsmod)` before defining a spec.

## pls() syntax and arguments

**The signature has two model arguments plus a mode and an engine.** Both model arguments default to `NULL`, which lets the mixOmics engine pick a value.

```r title="pls signature"
pls(
  mode = "unknown",
  engine = "mixOmics",
  predictor_prop = NULL,
  num_comp = NULL
)
```

| Argument | What it controls |
|---|---|
| `mode` | `"regression"` or `"classification"`. Required before fitting. |
| `num_comp` | Number of PLS components (latent variables) to retain. |
| `predictor_prop` | Maximum proportion of predictors with a non-zero coefficient per component. Values below 1 give sparse PLS. |
| `engine` | Always `"mixOmics"`. |

The `num_comp` argument is the main lever on fit quality. `predictor_prop` controls sparsity: at 1 every predictor loads on every component, while a value below 1 makes mixOmics zero out the weakest loadings, which performs variable selection.

## Fit a PLS model: regression and classification

**Build the spec, set the engine and mode, then call fit().** This regression example predicts `mpg` from every other column of `mtcars` using three components.

```r title="Fit a PLS regression"
library(tidymodels)
library(plsmod)

pls_spec <- pls(num_comp = 3) |>
  set_engine("mixOmics") |>
  set_mode("regression")

pls_fit <- pls_spec |>
  fit(mpg ~ ., data = mtcars)

predict(pls_fit, new_data = mtcars[1:3, ])
#> # A tibble: 3 x 1
#>   .pred
#>   <dbl>
#> 1  22.6
#> 2  22.1
#> 3  26.0
```

Switching to classification needs only a different mode. With a factor outcome, mixOmics fits PLS-DA, partial least squares discriminant analysis.

```r title="Fit a PLS-DA classifier"
pls_cls <- pls(num_comp = 2) |>
  set_engine("mixOmics") |>
  set_mode("classification") |>
  fit(Species ~ ., data = iris)

predict(pls_cls, new_data = iris[c(1, 70, 130), ])
#> # A tibble: 3 x 1
#>   .pred_class
#>   <fct>
#> 1 setosa
#> 2 versicolor
#> 3 virginica
```

[KEY INSIGHT]
**PLS regresses on components, not raw predictors.** Each component is a weighted blend of the original columns. The components are uncorrelated by construction, so PLS stays stable even when the raw predictors are collinear, where ordinary least squares would break down.

## Choose the number of components

**num_comp is the one setting that decides fit quality.** Too few components underfit the data; too many reabsorb noise. Mark the argument with `tune()` and search a small grid with resampling.

```r title="Tune the component count"
pls_tune <- pls(num_comp = tune()) |>
  set_engine("mixOmics") |>
  set_mode("regression")

folds <- vfold_cv(mtcars, v = 5)
grid <- tibble(num_comp = 1:6)

res <- tune_grid(pls_tune, mpg ~ ., resamples = folds, grid = grid)
show_best(res, metric = "rmse", n = 3)
#> # A tibble: 3 x 7
#>   num_comp .metric .estimator  mean     n std_err .config
#>      <int> <chr>   <chr>      <dbl> <int>   <dbl> <chr>
#> 1        3 rmse    standard    2.71     5   0.402 Model3
#> 2        4 rmse    standard    2.78     5   0.391 Model4
#> 3        2 rmse    standard    2.95     5   0.508 Model2
```

Here three components give the lowest cross-validated RMSE. Beyond that point the error climbs again, because later components fit noise rather than signal.

## pls() vs linear_reg() vs a PCA recipe

**Reach for pls() when predictors are many and correlated.** All three options handle collinear data, but they differ in how they build the reduced space.

| Approach | How it reduces dimensions | Best when |
|---|---|---|
| `pls()` | Components maximize covariance with the outcome | Predictors are correlated and you want supervised reduction |
| `linear_reg()` | No reduction; one coefficient per predictor | Predictors are few and roughly independent |
| `step_pca()` recipe | Components maximize predictor variance, ignore outcome | You want unsupervised reduction before any model |

A PCA recipe picks directions that explain the predictors alone. PLS picks directions that also predict the outcome, so it usually needs fewer components to reach the same accuracy.

## Common pitfalls

**Three mistakes account for most pls() errors.** Each has a quick fix.

- **Forgetting plsmod.** `library(plsmod)` must run before `pls()`. Loading only `tidymodels` triggers a "could not find function" error.
- **Skipping the mode.** A spec left at `mode = "unknown"` fails at `fit()`. Set the mode with `set_mode()` or the `mode` argument.
- **Asking for too many components.** `num_comp` cannot exceed the number of predictors. A value that is too large errors inside the mixOmics engine.

[WARNING]
**Predictor scale matters for PLS.** PLS weights predictors by covariance, so a column on a large numeric scale dominates the components. Add `step_normalize()` in a recipe, or center and scale the predictors, before fitting.

## Try it yourself

**Try it:** Fit a PLS regression on `mtcars` predicting `hp` from `disp`, `wt`, `cyl`, and `qsec` with two components. Save the fitted model to `ex_fit`.

```r title="Your turn: PLS on mtcars"
# Try it: build the spec, set engine and mode, fit
ex_fit <- # your code here

predict(ex_fit, new_data = mtcars[1:3, ])
#> Expected: a 3-row tibble with a .pred column
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_fit <- pls(num_comp = 2) |>
  set_engine("mixOmics") |>
  set_mode("regression") |>
  fit(hp ~ disp + wt + cyl + qsec, data = mtcars)

predict(ex_fit, new_data = mtcars[1:3, ])
#> # A tibble: 3 x 1
#>   .pred
#>   <dbl>
#> 1  124.
#> 2  118.
#> 3  103.
```

**Explanation:** `pls(num_comp = 2)` requests two latent components, `set_engine()` and `set_mode()` complete the spec, and `fit()` trains it on the four predictors. `predict()` returns one value per row.

</details>

## Related parsnip functions

- [parsnip linear_reg()](parsnip-linear_reg-in-R.html) fits ordinary and penalized linear regression.
- [parsnip discrim_linear()](parsnip-discrim_linear-in-R.html) builds a linear discriminant classifier.
- [parsnip mars()](parsnip-mars-in-R.html) captures nonlinear structure with spline terms.
- [parsnip rand_forest()](parsnip-rand_forest-in-R.html) builds a random forest ensemble.
- [parsnip fit()](parsnip-fit-in-R.html) trains any model spec on a data frame.

See the official [parsnip pls() reference](https://parsnip.tidymodels.org/reference/pls.html) for the full argument list.

## FAQ

**What package provides parsnip pls()?**
pls() ships in the plsmod package, a parsnip model extension maintained by the tidymodels team. parsnip itself does not include it. Install plsmod from CRAN, install the mixOmics engine from Bioconductor with `BiocManager::install("mixOmics")`, and load `library(plsmod)` alongside `library(tidymodels)`. Once loaded, pls() behaves like any built-in parsnip spec and works inside workflows and recipes.

**What is the difference between PLS and PCA regression?**
Both compress correlated predictors into a few components, but they choose those components differently. PCA picks directions that explain the most variance in the predictors, ignoring the outcome. PLS picks directions that maximize covariance between predictors and the outcome, so its components are supervised. PLS usually reaches the same accuracy with fewer components, which is why it is preferred when the goal is prediction rather than description.

**Can pls() do classification?**
Yes. Set `mode = "classification"` and pass a factor outcome. The mixOmics engine then fits PLS-DA, partial least squares discriminant analysis, which finds components that separate the classes. Use `predict(fit, new_data, type = "prob")` for class probabilities or the default `type = "class"` for hard labels. The `num_comp` argument works the same way as in regression mode.

**How many components should I use in PLS?**
There is no fixed answer; it depends on the data. Mark `num_comp` with `tune()`, build a grid such as `num_comp = 1:6`, and compare cross-validated RMSE or accuracy with `tune_grid()`. Pick the smallest component count whose error is close to the minimum. Adding components past that point fits noise and can hurt performance on new data.
</content>
</invoke>
