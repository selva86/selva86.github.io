---
title: "workflows update_model() in R: Swap a Workflow's Model Spec"
slug: workflows-update_model-in-R
description: "Use workflows update_model() in R to swap the parsnip spec inside an existing tidymodels workflow. Syntax, four worked examples, gotchas, and pitfalls."
keywords: "workflows update_model, update_model function R, update_model workflow, tidymodels update_model, R update_model, workflows update model, update_model parsnip examples"
mathjax: false
webr: true
date: "2026-05-23"
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "update_model()|workflows update_model|workflows::update_model()|swap the model in workflow|update the model spec"
auto_link_case_sensitive: true
target_keyword: "workflows update_model"
sibling_block_enabled: true
difficulty: Beginner
---

# workflows update_model() in R: Swap a Workflow's Model Spec

<p class="lead">The workflows <code>update_model()</code> function in R replaces the parsnip model specification inside a tidymodels workflow with a new spec, while leaving the preprocessor untouched. Use it to swap engines, sweep hyperparameters, or A/B two algorithms on the same recipe without rebuilding the pipeline by hand.</p>

[QUICK ANSWER]
update_model(wf, new_spec)                       # swap the model in place
wf |> update_model(rf_spec)                      # pipe-friendly swap
update_model(wf, new_spec, formula = y ~ x)      # swap with a model-only formula
wf |> update_model(spec) |> fit(data = df)       # swap then refit
update_model(wf_fit, new_spec)                   # resets workflow to unfitted
update_recipe(wf, new_rec)                       # sibling verb for the preprocessor
remove_model(wf) |> add_model(new_spec)          # equivalent two-step path

[DECISION TREE: Is update_model() the right tool?]
- swap the model spec in an existing workflow: update_model(wf, spec_v2)
- attach a model to an empty workflow: workflow() |> add_model(spec)
- remove the model and leave the slot empty: remove_model(wf)
- swap the recipe instead: update_recipe(wf, new_rec)
- swap recipe and model together: update_recipe(wf, r) |> update_model(s)
- pull the current spec back out to inspect it: extract_spec_parsnip(wf)

## What update_model() does

**update_model() replaces the parsnip spec slot of a workflow with a new spec.** It returns a new workflow object with the same preprocessor but a different model. The original workflow is not modified; the function is pure and assignment-safe.

The verb exists because add_model() refuses to overwrite an existing spec. Once a model is attached, calling add_model() a second time raises an error. update_model() is the explicit replacement door. It is the right tool whenever the recipe stays the same and only the algorithm or its hyperparameters change, which happens constantly during engine comparison, lambda tuning, and quick A/B tests across model families.

[KEY INSIGHT]
**update_model() always returns an unfitted workflow.** Even if you call it on a fitted workflow, the returned object discards any trained parameters because the new spec would change the fitted state. Treat the result as a fresh workflow that must be refit before predictions.

## update_model() syntax and arguments

**update_model() takes a workflow, a replacement spec, and an optional formula.** The signature mirrors add_model(), so swapping between the two verbs is a one-word rename.

```r title="The update_model argument skeleton"
library(tidymodels)

update_model(
  x,              # a workflow object, fitted or unfitted
  spec,           # an unfit parsnip model_spec
  formula = NULL  # optional model-only formula override
)
```

The `x` argument must be a workflow() object that already has a model attached; calling update_model() on a workflow with no model raises an error. The `spec` argument must be an unfit parsnip spec built with `linear_reg()`, `rand_forest()`, `boost_tree()`, or any other model family function plus `set_engine()`. Passing a fitted parsnip object is rejected. The `formula` argument lets you give the model a different formula from the preprocessor, useful when the recipe creates engineered columns that the engine should consume selectively.

**update_model() is the most common spec-side iteration verb.** The three patterns below cover almost every use case in practice.

| Swap target | Typical pattern | What stays constant |
|-------------|-----------------|---------------------|
| Engine (same family) | `linear_reg() |> set_engine("lm")` to `linear_reg(penalty = 0.1) |> set_engine("glmnet")` | Recipe, outcome, predictor set |
| Hyperparameters | `rand_forest(trees = 500)` to `rand_forest(trees = 2000, min_n = 5)` | Recipe, engine, algorithm family |
| Algorithm family | `linear_reg()` to `rand_forest()` | Recipe and outcome only |

Each row is one update_model() call. The preprocessor is shared across all variants, so any difference in fit or hold-out metric is attributable to the spec alone.

## Swap models with update_model(): four examples

**Every example uses built-in mtcars and airquality datasets** so the focus stays on the swap mechanics rather than on the data.

### Example 1: Swap engines inside the linear regression family

**The base case is one recipe and two engines.** Build the workflow once, then swap engines without touching the preprocessor.

```r title="Build then swap with update_model"
library(tidymodels)

rec_norm <- recipe(mpg ~ wt + hp + disp + cyl, data = mtcars) |>
  step_normalize(all_numeric_predictors())

spec_lm <- linear_reg() |> set_engine("lm")

wf <- workflow() |>
  add_recipe(rec_norm) |>
  add_model(spec_lm)

spec_glmnet <- linear_reg(penalty = 0.1, mixture = 1) |>
  set_engine("glmnet")

wf_glmnet <- update_model(wf, spec_glmnet)
wf_glmnet
#> == Workflow ====================================================================
#> Preprocessor: Recipe
#> Model: linear_reg()
#>
#> -- Preprocessor ----------------------------------------------------------------
#> 1 Recipe Step
#>
#> * step_normalize()
#>
#> -- Model -----------------------------------------------------------------------
#> Linear Regression Model Specification (regression)
#>
#> Main Arguments:
#>   penalty = 0.1
#>   mixture = 1
#>
#> Computational engine: glmnet
```

The original `wf` still holds the lm spec. `wf_glmnet` is a separate object with a lasso-regularized spec. Both can be fit independently to compare ordinary least squares against regularized regression on the same normalized predictors.

### Example 2: Sweep hyperparameters of the same algorithm

**Holding the engine constant and varying hyperparameters is what update_model() does inside tune_grid().** You can run the loop yourself when you want exact control.

```r title="Manual hyperparameter sweep with update_model"
rec <- recipe(mpg ~ wt + hp + disp + cyl, data = mtcars) |>
  step_normalize(all_numeric_predictors())

wf_base <- workflow() |>
  add_recipe(rec) |>
  add_model(rand_forest(trees = 100) |>
    set_engine("ranger") |>
    set_mode("regression"))

tree_grid <- c(100, 500, 1500)

results <- map_dfr(tree_grid, function(n) {
  spec <- rand_forest(trees = n) |>
    set_engine("ranger") |>
    set_mode("regression")

  wf_n <- update_model(wf_base, spec)
  fit_n <- fit(wf_n, data = mtcars)
  preds <- predict(fit_n, new_data = mtcars)
  tibble(trees = n,
         rmse = rmse_vec(mtcars$mpg, preds$.pred))
})

results
#> # A tibble: 3 x 2
#>   trees  rmse
#>   <dbl> <dbl>
#> 1   100  1.07
#> 2   500  1.02
#> 3  1500  1.01
```

update_model() lets you swap just the `trees` argument across iterations. The preprocessor is built once and reused, so the cost of each iteration is the model fit alone. This pattern is what `tune_grid()` automates; doing it by hand is useful for debugging and for sweeps too small to justify a tuning workflow.

### Example 3: A/B compare two algorithm families

**Comparing two algorithms on identical preprocessing is where update_model() earns its keep most often.** The recipe is fixed, the spec varies, and any difference in cross-validated performance is attributable to the algorithm.

```r title="Compare lm and random forest under cross-validation"
rec_cv <- recipe(mpg ~ wt + hp + disp, data = mtcars) |>
  step_normalize(all_numeric_predictors())

wf_lm <- workflow() |>
  add_recipe(rec_cv) |>
  add_model(linear_reg() |> set_engine("lm"))

rf_spec <- rand_forest(trees = 500) |>
  set_engine("ranger") |>
  set_mode("regression")

wf_rf <- update_model(wf_lm, rf_spec)

set.seed(42)
folds <- vfold_cv(mtcars, v = 5)

res_lm <- fit_resamples(wf_lm, folds)
res_rf <- fit_resamples(wf_rf, folds)

bind_rows(
  collect_metrics(res_lm) |> mutate(model = "linear_reg + lm"),
  collect_metrics(res_rf) |> mutate(model = "rand_forest + ranger")
) |>
  filter(.metric == "rmse") |>
  select(model, mean, std_err)
#> # A tibble: 2 x 3
#>   model                 mean std_err
#>   <chr>                <dbl>   <dbl>
#> 1 linear_reg + lm       2.78   0.396
#> 2 rand_forest + ranger  2.56   0.342
```

update_model() returns a workflow that fit_resamples() consumes directly. You never rebuild the recipe, so the comparison is clean: only the model changes between the two metric rows.

### Example 4: Update on a fitted workflow resets it

**Calling update_model() on a fitted workflow is legal but discards the fit.** This is the most common surprise.

```r title="Fitted workflow loses its fit after update_model"
wf_fit <- fit(wf_lm, data = mtcars)

# The fitted workflow can predict
predict(wf_fit, new_data = head(mtcars))
#> # A tibble: 6 x 1
#>   .pred
#>   <dbl>
#> 1  22.6
#> 2  22.1
#> 3  26.3
#> 4  21.2
#> 5  17.7
#> 6  20.4

wf_reset <- update_model(wf_fit, rf_spec)

# After the swap, the workflow is unfitted again
tryCatch(
  predict(wf_reset, new_data = head(mtcars)),
  error = function(e) conditionMessage(e)
)
#> [1] "Can't predict on an untrained workflow."
```

The returned workflow has the new spec attached but no trained parameters. Refit with `fit(wf_reset, data = mtcars)` before calling `predict()`.

[WARNING]
**Never assume update_model() preserves a fit.** Pipelines that branch off a fitted workflow must refit after every spec change. Forgetting the refit raises an "untrained workflow" error at predict time; resampling pipelines silently start from scratch.

## Common pitfalls

**Three errors hit beginners the most.** Each one has a one-line fix.

```r title="Three errors and their fixes"
# Pitfall 1: update_model on a workflow with no model
wf_rec_only <- workflow() |>
  add_recipe(rec_norm)
tryCatch(
  update_model(wf_rec_only, spec_lm),
  error = function(e) conditionMessage(e)
)
#> [1] "The workflow does not have a model action."
# Fix: use add_model() to attach a spec first, OR build the workflow with one.

# Pitfall 2: passing a fitted parsnip object
spec_fit <- linear_reg() |>
  set_engine("lm") |>
  fit(mpg ~ wt, data = mtcars)
tryCatch(
  update_model(wf, spec_fit),
  error = function(e) conditionMessage(e)
)
#> [1] "`spec` must be a `model_spec`, not a fitted model."
# Fix: pass the unfit spec; the workflow fits it.

# Pitfall 3: chaining without assignment
wf |> update_model(spec_glmnet)
# wf is unchanged because update_model() is pure.
# Fix: wf_glmnet <- wf |> update_model(spec_glmnet)
```

[NOTE]
**update_model() and remove_model() then add_model() are equivalent.** Use the single verb. It is faster to type, shorter to read, and signals intent: you are replacing the spec, not detaching it.

## Try it yourself

**Try it:** Build a workflow with a recipe of `Sepal.Length` predicting `Petal.Length` plus a linear regression spec, then use update_model() to swap in a `nearest_neighbor()` regression spec with 5 neighbors. Save the swapped, unfitted workflow to `ex_wf`.

```r title="Your turn: swap a model spec with update_model"
# Try it: swap linear_reg for nearest_neighbor in a workflow
library(tidymodels)

ex_rec <- # your code here

ex_spec_v1 <- # your code here

ex_spec_v2 <- # your code here

ex_wf <- # workflow then update_model

ex_wf
#> Expected: workflow with the kNN spec and the original recipe
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_rec <- recipe(Petal.Length ~ Sepal.Length, data = iris)

ex_spec_v1 <- linear_reg() |> set_engine("lm")

ex_spec_v2 <- nearest_neighbor(neighbors = 5) |>
  set_engine("kknn") |>
  set_mode("regression")

ex_wf <- workflow() |>
  add_recipe(ex_rec) |>
  add_model(ex_spec_v1) |>
  update_model(ex_spec_v2)

ex_wf
#> == Workflow ====================================================================
#> Preprocessor: Recipe
#> Model: nearest_neighbor()
#>
#> -- Preprocessor ----------------------------------------------------------------
#> 0 Recipe Steps
#>
#> -- Model -----------------------------------------------------------------------
#> K-Nearest Neighbor Model Specification (regression)
#>
#> Main Arguments:
#>   neighbors = 5
#>
#> Computational engine: kknn
```

**Explanation:** The first spec attaches with add_model(). The second swap happens through update_model() in the same pipeline. The result is a workflow with the kNN spec and the original recipe untouched.

</details>

## Related tidymodels functions

**update_model() lives inside the workflows verb family.** Knowing the neighbours makes spec iteration faster.

- `workflow()` creates the empty workflow that update_model() later modifies.
- `add_model()` attaches the initial parsnip spec to an empty workflow.
- `remove_model()` strips the spec out and leaves the model slot empty.
- `update_recipe()` swaps the preprocessor while leaving the model in place.
- `extract_spec_parsnip()` returns the unfit spec currently stored in a workflow.
- `fit()` retrains the workflow after a spec swap.

See the [workflows package reference](https://workflows.tidymodels.org/reference/) for the full verb family.

## FAQ

**Does update_model() refit the workflow?**

No. update_model() only replaces the model slot. Any trained parameters from a prior fit are discarded, and the returned workflow is unfitted. Call `fit(wf, data = ...)` after the swap to retrain. This separation lets you queue several spec changes before paying the cost of a fit, which matters during interactive engine comparison and when scripting batch sweeps across hyperparameter values.

**What is the difference between update_model() and tune_grid()?**

update_model() is a single, manual swap of one spec for another. tune_grid() is the automated version: it accepts a workflow with `tune()` placeholders and a parameter grid, then internally calls update_model() once per grid row and per resample to fit every combination. Reach for update_model() when you want explicit control over a small handful of variants; reach for tune_grid() when you want to search a parameter space systematically.

**Can update_model() swap between regression and classification?**

Technically yes; the new spec can declare any mode. In practice you should not, because the recipe was almost certainly built for one outcome type. Changing mode usually means changing the outcome variable, which means rebuilding the recipe too. If you need both regression and classification on the same predictors, build two workflows from the start.

**Does update_model() invalidate tuning results?**

Yes. Tuning grids and resampled metrics are tied to the exact workflow used to produce them. Calling update_model() returns a new workflow that has not been tuned. Rerun tune_grid() or fit_resamples() on the updated workflow to get fresh results, and treat any prior `select_best()` output as invalid for the new spec.

**Can I use update_model() to add steps to an existing spec?**

Not directly. update_model() swaps the whole spec object, not individual settings. To extend a spec, rebuild it with the extra arguments and pass the new object to update_model(). Parsnip itself provides no in-place mutation on a spec; the design philosophy is to construct specs declaratively and swap them whole.
