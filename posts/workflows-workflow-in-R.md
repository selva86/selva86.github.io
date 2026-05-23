---
title: "workflows workflow() in R: Bundle Preprocessor and Model"
slug: workflows-workflow-in-R
description: "Use workflows workflow() in R to bundle a recipe or formula with a parsnip model spec. Syntax, four examples, fit, predict, and the most common pitfalls."
keywords: "workflows workflow, workflow function R, tidymodels workflow, workflow() R, add_recipe workflow R, add_model workflow R, workflow tidymodels examples"
mathjax: false
webr: true
date: "2026-05-23"
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "workflow()|workflows workflow|workflows::workflow()|tidymodels workflow|tidymodels workflow object"
auto_link_case_sensitive: true
target_keyword: "workflows workflow"
sibling_block_enabled: true
difficulty: Beginner
---

# workflows workflow() in R: Bundle Preprocessor and Model

<p class="lead">The workflows <code>workflow()</code> function in R creates a tidymodels workflow object that bundles a preprocessor (formula, recipe, or variable set) with a parsnip model specification. Fitting the workflow trains the preprocessor and the model together, so the same object can be passed to <code>predict()</code>, <code>tune_grid()</code>, or <code>last_fit()</code> without rewiring the pipeline.</p>

[QUICK ANSWER]
workflow()                                            # empty workflow scaffold
workflow() |> add_model(spec)                         # attach a parsnip model
workflow() |> add_formula(mpg ~ wt + hp)              # formula preprocessor
workflow() |> add_recipe(rec)                         # recipes preprocessor
workflow() |> add_variables(mpg, c(wt, hp))           # variables preprocessor
wf |> fit(data = mtcars)                              # train the workflow
predict(wf_fit, new_data = new_rows)                  # predict from fitted workflow
extract_fit_parsnip(wf_fit)                           # pull the underlying parsnip fit

[DECISION TREE: Is workflow() the right tool?]
- bundle preprocessor and model in one object: workflow() |> add_recipe(rec) |> add_model(spec)
- fit only a model, no preprocessing: spec |> fit(mpg ~ ., data = mtcars)
- build only a feature engineering pipeline: recipe(mpg ~ ., data = mtcars)
- compare many workflows at once: workflow_set(preproc, models)
- tune a workflow on resamples: tune_grid(wf, resamples = folds)
- swap the model inside an existing workflow: update_model(wf, new_spec)

## What workflow() does

**workflow() is a container, not a model.** It records two slots, one for a preprocessor and one for a model specification, and refuses to fit until both are filled. The container guarantees the preprocessor is estimated on each resample and applied identically at prediction time, which is the single biggest source of leakage when you wire preprocessing by hand.

A workflow holds the preprocessor, the parsnip model spec, and an optional case-weights column. When `fit()` runs, parsnip trains the model on the preprocessor's output; the trained preprocessor travels with the fitted object so `predict()` re-applies it at scoring time. Every tidymodels API (`tune_grid()`, `fit_resamples()`, `last_fit()`, `workflow_set()`) accepts a workflow.

[KEY INSIGHT]
**A workflow is the only tidymodels object that knows both what to compute and what to learn.** Recipes alone describe data prep but never see a model; parsnip specs alone describe a model but never see preprocessing. The workflow binds them so resampling, tuning, and prediction stay leak-free without you having to remember which step happens where.

## workflow() syntax and arguments

**workflow() takes three optional arguments and four setup verbs.** The arguments let you build a workflow in one call; the verbs let you build one piece at a time.

```r title="The workflow constructor and setup verbs"
library(tidymodels)

workflow(
  preprocessor = NULL,   # a formula, recipe, or workflow_variables object
  spec         = NULL,   # a parsnip model spec
  case_weights = NULL    # column name holding case weights, if any
)

# Setup verbs (composable with |>):
# add_formula(wf, formula)
# add_recipe(wf, recipe)
# add_variables(wf, outcomes, predictors)
# add_model(wf, spec, formula = NULL)
```

The `preprocessor` argument accepts a formula, a `recipe()` object, or a `workflow_variables()` object. The `spec` argument accepts any parsnip model function such as `linear_reg()` or `logistic_reg()`. The `case_weights` argument names a column holding frequency or importance weights.

**A workflow allows exactly one preprocessor.** Stacking `add_recipe()` and `add_formula()` errors. Pick recipe for transformations, formula for one-line interfaces, variables when an engine refuses formulas (such as XGBoost).

[NOTE]
**Use add_model() and add_recipe() instead of the constructor arguments when reading code later.** The verb form makes the pipeline self-documenting and matches every workflow example in the tidymodels book and vignettes. The constructor form is mostly for programmatic workflow generation.

## Build a workflow: four examples

**Every example below uses the built-in `mtcars` dataset.** The outcome is `mpg`, and `wt`, `hp`, and `cyl` are the predictors, which keeps the focus on the workflow object rather than on the data.

### Example 1: Formula preprocessor and lm model

**Wire a formula and a parsnip spec, then fit.** This is the lightest possible workflow and the right choice when no real preprocessing is needed.

```r title="Formula plus linear_reg workflow"
lin_spec <- linear_reg() |> set_engine("lm")

wf1 <- workflow() |>
  add_formula(mpg ~ wt + hp + cyl) |>
  add_model(lin_spec)

wf1
#> == Workflow ====================================================================
#> Preprocessor: Formula
#> Model: linear_reg()
#>
#> -- Preprocessor ----------------------------------------------------------------
#> mpg ~ wt + hp + cyl
#>
#> -- Model -----------------------------------------------------------------------
#> Linear Regression Model Specification (regression)
#>
#> Computational engine: lm
```

The print method shows the workflow is not yet trained. Calling `fit()` flips the header to `[trained]`.

### Example 2: Fit and predict from the workflow

**fit() trains, predict() scores; both go through the workflow object.** The fitted workflow holds the model and the preprocessor, so prediction stays consistent with training.

```r title="Train and score a workflow"
wf1_fit <- wf1 |> fit(data = mtcars)

predict(wf1_fit, new_data = mtcars[c(1, 15, 31), ])
#> # A tibble: 3 x 1
#>   .pred
#>   <dbl>
#> 1  22.1
#> 2  13.0
#> 3  16.9
```

Predictions arrive in a tibble with a single `.pred` column, ready to `bind_cols()` back onto the input. Naming matches a bare parsnip fit because the workflow delegates to parsnip.

### Example 3: Recipe preprocessor with feature engineering

**Swap the formula for a recipe to add transformations.** A recipe is the right choice when you need scaling, dummy coding, imputation, or any step that should be re-estimated on each resample.

```r title="Recipe plus linear_reg workflow"
rec <- recipe(mpg ~ wt + hp + cyl, data = mtcars) |>
  step_normalize(all_numeric_predictors())

wf2 <- workflow() |>
  add_recipe(rec) |>
  add_model(lin_spec)

wf2_fit <- wf2 |> fit(data = mtcars)

extract_fit_parsnip(wf2_fit) |> tidy()
#> # A tibble: 4 x 5
#>   term        estimate std.error statistic  p.value
#>   <chr>          <dbl>     <dbl>     <dbl>    <dbl>
#> 1 (Intercept)   20.1      0.542      37.1  1.05e-25
#> 2 wt            -3.10     0.726      -4.28 2.08e- 4
#> 3 hp            -1.23     0.811      -1.52 1.40e- 1
#> 4 cyl           -1.66     0.972      -1.71 9.85e- 2
```

`step_normalize()` mean-centers and scales each predictor on the training data, so the coefficients are comparable. The centering and scaling parameters live inside the workflow and re-apply automatically at `predict()` time.

### Example 4: Variables preprocessor for matrix engines

**add_variables() bypasses a formula entirely.** Use it when the engine expects raw column vectors, such as XGBoost or some keras setups, and you do not want R to materialize a dummy-coded model matrix.

```r title="Variables preprocessor workflow"
wf3 <- workflow() |>
  add_variables(outcomes = mpg, predictors = c(wt, hp, cyl)) |>
  add_model(lin_spec)

wf3_fit <- wf3 |> fit(data = mtcars)
predict(wf3_fit, new_data = mtcars[1:2, ])
#> # A tibble: 2 x 1
#>   .pred
#>   <dbl>
#> 1  22.1
#> 2  22.1
```

Outcomes and predictors use tidyselect, so `c()`, `starts_with()`, and `where()` all work. No interactions or polynomial terms are created; the engine sees the columns as supplied.

[TIP]
**Use update_recipe() or update_model() to change one slot without rebuilding.** During tuning you often swap engines or hyperparameters; the update verbs replace a single slot in place rather than forcing you to reconstruct the workflow from scratch.

## workflow() vs raw fit() and recipes

**Pick a workflow when any step beyond a single model call is involved.** The table below covers the three common alternatives.

| Approach | When to use | Trade-off |
|---|---|---|
| `workflow()` | preprocessing + model, tuning, resampling | one extra object to track |
| `spec |> fit(formula, data)` | quick one-shot model, no transforms | no leak-safe preprocessing |
| `recipe() |> prep() |> bake()` | feature engineering only, no model | manual rewiring at prediction |
| `workflow_set()` | comparing many preprocessor + model combos | heavier, returns a tibble of workflows |

A bare parsnip fit is fine for a quick check, but hand-rolled preprocessing is not re-estimated on resamples and silently leaks. The workflow is the smallest object that fixes that.

## Common pitfalls

**Three mistakes trip up most newcomers to workflow().** Each one below shows the broken pattern and the fix.

The first is mixing preprocessors. A workflow accepts one of `add_formula()`, `add_recipe()`, or `add_variables()`; calling two of them throws an error. If a recipe already encodes the formula, do not also call `add_formula()`.

```r title="Pick one preprocessor"
# Wrong: cannot mix a recipe with a formula
workflow() |>
  add_recipe(rec) |>
  add_formula(mpg ~ wt)

# Right: the recipe carries the formula already
workflow() |>
  add_recipe(rec) |>
  add_model(lin_spec)
```

The second is calling `predict()` on raw test data instead of through the workflow. Skipping the workflow skips the recipe; the model sees unscaled inputs. Always pass `new_data = ...` to `predict()` on the fitted workflow.

The third is reaching for the inner model too early. Use `extract_fit_parsnip()` or `extract_recipe()`; touching `wf$fit$fit$fit` is brittle and breaks across versions.

[WARNING]
**A workflow loses its preprocessor metadata when saved with base saveRDS() in some R versions.** For long-term storage, use `butcher::butcher()` to strip unused environments, then save with `qs::qsave()` or the standard `saveRDS()`. Re-loading restores the workflow with full fit and prediction support.

## Try it yourself

**Try it:** Build a workflow that uses a recipe to log-transform `hp`, fits a linear regression on `mpg ~ wt + hp + cyl`, then predicts mpg for the 15th row of `mtcars`. Save the prediction to `ex_pred`.

```r title="Your turn: workflow with a log step"
# Try it: workflow with log(hp) step
ex_rec  <- # your code here
ex_wf   <- # your code here
ex_fit  <- # your code here
ex_pred <- # your code here

ex_pred
#> Expected: 1-row tibble with .pred near 13.6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_rec <- recipe(mpg ~ wt + hp + cyl, data = mtcars) |>
  step_log(hp)

ex_wf <- workflow() |>
  add_recipe(ex_rec) |>
  add_model(linear_reg() |> set_engine("lm"))

ex_fit  <- ex_wf |> fit(data = mtcars)
ex_pred <- predict(ex_fit, new_data = mtcars[15, ])

ex_pred
#> # A tibble: 1 x 1
#>   .pred
#>   <dbl>
#> 1  13.6
```

**Explanation:** `step_log()` replaces the `hp` column with its natural log before the model sees it, so the workflow trains a linear regression on `log(hp)` instead of the raw value. The recipe's log transform is re-applied at prediction time, so row 15 (a heavy Cadillac with high hp) yields a slightly different mpg estimate than the untransformed model.

</details>

## Related workflows functions

**workflow() sits at the center of the workflows package family.** These helpers cover the neighboring tasks.

- `add_recipe()` attaches a recipes preprocessor.
- `add_model()` attaches a parsnip model specification.
- `add_formula()` attaches a one-line formula preprocessor.
- `add_variables()` attaches a tidyselect variable selector for matrix engines.
- `update_recipe()` and `update_model()` swap a single slot inside an existing workflow.
- `extract_fit_parsnip()` pulls the trained parsnip model out of a fitted workflow.
- `workflow_set()` builds a tibble of multiple workflows for batch comparison.

## FAQ

**What package is workflow() in?**

`workflow()` ships in the workflows package and loads automatically with `library(tidymodels)`. The function returns a `workflow` S3 object; methods for `fit()`, `predict()`, `tune_grid()`, and `print()` are defined in workflows and tune. Loading workflows on its own is only useful for a slimmer dependency set.

**What is the difference between workflow() and recipe()?**

A recipe describes feature engineering steps (centering, dummy coding, imputation) but has no model attached. A workflow binds a recipe to a parsnip spec so they fit and predict together. A bare recipe forces you to call `prep()`, `bake()`, and `fit()` manually, which is the bookkeeping the workflow eliminates.

**Can a workflow hold both a formula and a recipe?**

No. A workflow has one preprocessor slot, filled by `add_formula()`, `add_recipe()`, or `add_variables()`. Calling two of them errors. A recipe can express any formula already, so you rarely need both.

**How do I tune hyperparameters inside a workflow?**

Set tunable arguments to `tune()` in the model spec or recipe, then pass the workflow to `tune_grid()` with a resampling object such as `vfold_cv()`. The tuner returns a metrics tibble; `select_best()` and `finalize_workflow()` lock in the winning values for the final fit.

**How do I extract the underlying lm or glmnet model from a fitted workflow?**

Use `extract_fit_parsnip()` for the parsnip fit, then `extract_fit_engine()` for the raw engine object. The extractors stay stable across workflows versions; indexing the nested list manually does not.

For the full argument reference, see the [workflows workflow() docs](https://workflows.tidymodels.org/reference/workflow.html).
