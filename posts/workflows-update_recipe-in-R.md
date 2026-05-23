---
title: "workflows update_recipe() in R: Swap a Workflow's Recipe"
slug: workflows-update_recipe-in-R
description: "Use workflows update_recipe() in R to swap the recipes preprocessor inside an existing tidymodels workflow. Syntax, four worked examples, gotchas, and pitfalls."
keywords: "workflows update_recipe, update_recipe function R, update_recipe workflow, tidymodels update_recipe, R update_recipe, workflows update recipe, update_recipe tidymodels examples"
mathjax: false
webr: true
date: "2026-05-23"
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "update_recipe()|workflows update_recipe|workflows::update_recipe()|swap the recipe in workflow|update the recipe"
auto_link_case_sensitive: true
target_keyword: "workflows update_recipe"
sibling_block_enabled: true
difficulty: Beginner
---

# workflows update_recipe() in R: Swap a Workflow's Recipe

<p class="lead">The workflows <code>update_recipe()</code> function in R replaces the recipes preprocessor inside a tidymodels workflow with a new recipe, while leaving the model spec untouched. Use it to A/B preprocessing strategies, iterate on feature engineering, or rebuild a workflow after recipe changes without reassembling the pipeline by hand.</p>

[QUICK ANSWER]
update_recipe(wf, new_rec)                       # swap the recipe in place
wf |> update_recipe(rec_v2)                      # pipe-friendly swap
update_recipe(wf, new_rec, blueprint = bp)       # swap with custom blueprint
wf |> update_recipe(rec) |> fit(data = df)       # swap then refit
update_recipe(wf_fit, new_rec)                   # resets workflow to unfitted
update_model(wf, new_spec)                       # sibling verb for the model
remove_recipe(wf) |> add_recipe(new_rec)         # equivalent two-step path

[DECISION TREE: Is update_recipe() the right tool?]
- swap the recipe in an existing workflow: update_recipe(wf, new_rec)
- attach a recipe to an empty workflow: workflow() |> add_recipe(rec)
- remove the recipe and leave the slot empty: remove_recipe(wf)
- swap the model spec instead: update_model(wf, new_spec)
- swap recipe and model together: update_recipe(wf, r) |> update_model(s)
- swap a formula preprocessor: update_formula(wf, y ~ x1 + x2)

## What update_recipe() does

**update_recipe() replaces the recipe slot of a workflow with a new recipe.** It returns a new workflow object with the same model spec but a different preprocessor. The original workflow is not modified; the function is pure and assignment-safe.

The verb exists because `add_recipe()` refuses to overwrite an existing preprocessor. Once a recipe is attached, calling `add_recipe()` again raises an error. `update_recipe()` is the explicit replacement door. It is the right tool whenever the model stays the same and only the preprocessing changes, which happens often during feature-engineering iteration and when comparing recipe variants under cross-validation.

[KEY INSIGHT]
**update_recipe() always returns an unfitted workflow.** Even if you call it on a fitted workflow, the returned object discards any trained parameters because the new recipe would change the fitted state. Treat the result as a fresh workflow that must be refit before predictions.

## update_recipe() syntax and arguments

**update_recipe() takes a workflow, a replacement recipe, and an optional blueprint.** The signature mirrors `add_recipe()`, so swapping between the two verbs is a one-word rename.

```r title="The update_recipe argument skeleton"
library(tidymodels)

update_recipe(
  x,                # a workflow object, fitted or unfitted
  recipe,           # an untrained recipes object built with recipe()
  blueprint = NULL  # a hardhat blueprint controlling indicator handling
)
```

The `x` argument must be a `workflow()` object that already has a recipe attached; calling `update_recipe()` on a workflow with a formula or variables preprocessor raises an error. The `recipe` argument must be an unprepped recipes object; passing a prepped recipe is rejected. The `blueprint` argument lets you override how indicators, intercepts, and `NA` handling work at prediction time, and is rarely needed.

**update_recipe() is one of four workflow update verbs.** They are symmetric: each one targets a different slot.

| Verb | Replaces | When to reach for it |
|------|----------|----------------------|
| `update_recipe()` | The recipes preprocessor | Iterate on feature engineering with the same model |
| `update_model()` | The parsnip model spec | Compare engines or hyperparameters with the same preprocessing |
| `update_formula()` | A formula preprocessor | Adjust predictors without touching a recipe |
| `update_variables()` | A variables preprocessor | Swap outcome or predictor selectors |

Each verb is targeted: changing one slot never disturbs the others.

## Swap recipes with update_recipe(): four examples

**Every example uses built-in mtcars and airquality datasets** so the focus stays on the swap mechanics rather than on the data.

### Example 1: Swap a minimal recipe for a normalized one

**The base case is two recipes and one update.** Build the workflow once, then swap as needed.

```r title="Build then swap with update_recipe"
rec_min <- recipe(mpg ~ wt + hp, data = mtcars)

rec_norm <- recipe(mpg ~ wt + hp, data = mtcars) |>
  step_normalize(all_numeric_predictors())

spec <- linear_reg() |> set_engine("lm")

wf <- workflow() |>
  add_recipe(rec_min) |>
  add_model(spec)

wf_norm <- update_recipe(wf, rec_norm)
wf_norm
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
#> Computational engine: lm
```

The original `wf` still holds the minimal recipe. `wf_norm` is a separate object with the normalization step. Both can be fit independently to compare model behaviour with and without scaling.

### Example 2: A/B compare two preprocessing strategies

**Holding the model constant and varying the recipe is the canonical use of update_recipe().** It lets you isolate the effect of preprocessing on hold-out performance.

```r title="Compare two recipes under cross-validation"
rec_a <- recipe(mpg ~ wt + hp + disp, data = mtcars) |>
  step_normalize(all_numeric_predictors())

rec_b <- recipe(mpg ~ wt + hp + disp, data = mtcars) |>
  step_log(disp) |>
  step_normalize(all_numeric_predictors())

wf_base <- workflow() |>
  add_recipe(rec_a) |>
  add_model(linear_reg() |> set_engine("lm"))

set.seed(42)
folds <- vfold_cv(mtcars, v = 5)

res_a <- fit_resamples(wf_base, folds)
res_b <- fit_resamples(update_recipe(wf_base, rec_b), folds)

bind_rows(
  collect_metrics(res_a) |> mutate(recipe = "A: normalize only"),
  collect_metrics(res_b) |> mutate(recipe = "B: log(disp) + normalize")
) |>
  filter(.metric == "rmse") |>
  select(recipe, mean, std_err)
#> # A tibble: 2 x 3
#>   recipe                    mean std_err
#>   <chr>                    <dbl>   <dbl>
#> 1 A: normalize only         2.71   0.376
#> 2 B: log(disp) + normalize  2.58   0.391
```

`update_recipe()` returns a workflow that `fit_resamples()` consumes directly. You never rebuild the model spec, so any difference in the metric is attributable to preprocessing alone.

### Example 3: Iterate during development

**Feature engineering is a tight loop.** `update_recipe()` shortens the loop by avoiding workflow reassembly.

```r title="Iterate on recipe versions"
aq <- airquality |>
  mutate(Month = factor(Month))

wf_v1 <- workflow() |>
  add_recipe(recipe(Ozone ~ Solar.R + Wind + Temp, data = aq)) |>
  add_model(linear_reg() |> set_engine("lm"))

rec_v2 <- recipe(Ozone ~ Solar.R + Wind + Temp + Month, data = aq) |>
  step_impute_median(all_numeric_predictors()) |>
  step_dummy(all_nominal_predictors())

wf_v2 <- update_recipe(wf_v1, rec_v2)

wf_v2_fit <- fit(wf_v2, data = aq)
extract_recipe(wf_v2_fit) |>
  tidy(number = 1)
#> # A tibble: 3 x 3
#>   terms     value model
#>   <chr>     <dbl> <chr>
#> 1 Solar.R  205.   impute_median
#> 2 Wind       9.96 impute_median
#> 3 Temp      79.0  impute_median
```

Each new recipe version is a one-line swap from the prior workflow. The model spec, engine choice, and any other workflow state carries forward intact.

### Example 4: Update on a fitted workflow resets it

**Calling update_recipe() on a fitted workflow is legal but discards the fit.** This is the most common surprise.

```r title="Fitted workflow loses its fit after update_recipe"
wf_fit <- fit(wf_v1, data = aq)

class(wf_fit)
#> [1] "workflow"

# The fitted workflow can predict
predict(wf_fit, new_data = head(aq))
#> # A tibble: 6 x 1
#>   .pred
#>   <dbl>
#> 1  44.3
#> 2  37.7
#> 3  35.1
#> 4  37.4
#> 5  NA
#> 6  29.9

wf_reset <- update_recipe(wf_fit, rec_v2)

# After the swap, the workflow is unfitted again
tryCatch(
  predict(wf_reset, new_data = head(aq)),
  error = function(e) conditionMessage(e)
)
#> [1] "Can't predict on an untrained workflow."
```

The returned workflow has the new recipe attached but no trained parameters. Refit with `fit(wf_reset, data = aq)` before calling `predict()`.

[WARNING]
**Never assume update_recipe() preserves a fit.** Pipelines that branch off a fitted workflow must refit after every recipe change. Forgetting the refit raises an "untrained workflow" error at predict time; tuning pipelines silently start from scratch.

## Common pitfalls

**Three errors hit beginners the most.** Each one has a one-line fix.

```r title="Three errors and their fixes"
# Pitfall 1: update_recipe on a workflow with no recipe
wf_form <- workflow() |>
  add_formula(mpg ~ wt + hp) |>
  add_model(spec)
tryCatch(
  update_recipe(wf_form, rec_norm),
  error = function(e) conditionMessage(e)
)
#> [1] "The workflow does not have a recipe preprocessor."
# Fix: use add_recipe() to attach a recipe first, OR use update_formula().

# Pitfall 2: passing a prepped recipe
rec_prepped <- prep(rec_norm)
tryCatch(
  update_recipe(wf, rec_prepped),
  error = function(e) conditionMessage(e)
)
#> [1] "`recipe` must not be a trained recipe."
# Fix: pass the unprepped recipe; the workflow preps it.

# Pitfall 3: chaining without assignment
wf |> update_recipe(rec_norm)
# wf is unchanged because update_recipe() is pure.
# Fix: wf_norm <- wf |> update_recipe(rec_norm)
```

[NOTE]
**`update_recipe()` and `remove_recipe() |> add_recipe()` are equivalent.** Use the single verb. It is faster to type, shorter to read, and signals intent: you are replacing, not detaching.

## Try it yourself

**Try it:** Build a workflow with a recipe of `Sepal.Length` predicting `Petal.Length`, then use `update_recipe()` to switch to a recipe that also includes `step_dummy()` on `Species`. Save the swapped workflow to `ex_wf`.

```r title="Your turn: swap a recipe with update_recipe"
# Try it: swap a basic recipe for one with dummy encoding
library(tidymodels)

ex_rec_v1 <- # your code here
ex_rec_v2 <- # your code here

ex_wf <- # workflow then update_recipe

ex_wf
#> Expected: workflow with linear_reg + 1 Recipe Step (step_dummy)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_rec_v1 <- recipe(Petal.Length ~ Sepal.Length, data = iris)

ex_rec_v2 <- recipe(Petal.Length ~ Sepal.Length + Species, data = iris) |>
  step_dummy(all_nominal_predictors())

ex_wf <- workflow() |>
  add_recipe(ex_rec_v1) |>
  add_model(linear_reg() |> set_engine("lm")) |>
  update_recipe(ex_rec_v2)

ex_wf
#> == Workflow ====================================================================
#> Preprocessor: Recipe
#> Model: linear_reg()
#>
#> -- Preprocessor ----------------------------------------------------------------
#> 1 Recipe Step
#>
#> * step_dummy()
```

**Explanation:** The first recipe attaches with `add_recipe()`. The second swap happens through `update_recipe()` in the same pipeline. The result is a workflow with the upgraded recipe and the same `linear_reg()` spec.

</details>

## Related tidymodels functions

**update_recipe() lives inside the workflows verb family.** Knowing the neighbours makes recipe iteration faster.

- `workflow()` creates the empty workflow that `update_recipe()` later modifies.
- `add_recipe()` attaches the initial recipe to an empty workflow.
- `remove_recipe()` strips the recipe out and leaves the preprocessor slot empty.
- `update_model()` swaps the parsnip model spec while leaving the recipe in place.
- `extract_recipe()` returns the recipe currently stored in a fitted or unfitted workflow.
- `fit()` retrains the workflow after a recipe swap.

See the [workflows package reference](https://workflows.tidymodels.org/reference/) for the full verb family.

## FAQ

**Does update_recipe() refit the workflow?**

No. `update_recipe()` only replaces the recipe slot. Any trained parameters from a prior fit are discarded, and the returned workflow is unfitted. Call `fit(wf, data = ...)` after the swap to retrain. This separation lets you queue several updates before paying the cost of a fit, which matters during interactive feature engineering and when scripting batch comparisons across recipe variants.

**What is the difference between update_recipe() and remove_recipe() then add_recipe()?**

They produce the same workflow. `update_recipe(wf, new_rec)` is one verb and one allocation; `remove_recipe(wf) |> add_recipe(new_rec)` is two verbs and two allocations. The single-verb form is the idiomatic choice in tidymodels code because it signals replacement intent and reads more naturally inside pipelines.

**Can I use update_recipe() to add steps to an existing recipe?**

Not directly. `update_recipe()` swaps the whole recipe object, not individual steps. To extend a recipe, rebuild it with the extra `step_*()` calls and pass the new object to `update_recipe()`. The recipes package itself provides no in-place mutation; the design philosophy is to construct recipes declaratively and swap them whole.

**Does update_recipe() invalidate tuning results?**

Yes. Tuning grids and resampled metrics are tied to the exact workflow used to produce them. Calling `update_recipe()` returns a new workflow that has not been tuned. Rerun `tune_grid()` or `fit_resamples()` on the updated workflow to get fresh results, and treat any prior `select_best()` output as invalid for the new recipe.

**Can update_recipe() change the outcome variable?**

Technically yes; the new recipe can declare any formula. In practice you should not change the outcome inside `update_recipe()` because doing so silently changes what the model predicts and breaks any prior metrics. Treat the outcome as fixed across recipe versions and use `update_recipe()` only for predictor-side and step-side changes.
