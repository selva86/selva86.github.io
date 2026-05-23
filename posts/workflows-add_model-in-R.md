---
title: "workflows add_model() in R: Attach a Parsnip Model Spec"
slug: workflows-add_model-in-R
description: "Use workflows add_model() in R to attach a parsnip model spec to a tidymodels workflow. Syntax, four worked examples, the formula override, and pitfalls."
keywords: "workflows add_model, add_model function R, add_model workflow, tidymodels add_model, R add_model, workflows add model, add_model parsnip examples"
mathjax: false
webr: true
date: "2026-05-23"
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "add_model()|workflows add_model|workflows::add_model()|attach a model to workflow|attach a parsnip spec"
auto_link_case_sensitive: true
target_keyword: "workflows add_model"
sibling_block_enabled: true
difficulty: Beginner
---

# workflows add_model() in R: Attach a Parsnip Model Spec

<p class="lead">The workflows <code>add_model()</code> function in R attaches a parsnip model specification to a tidymodels workflow as the model action. The spec stays bundled with the preprocessor, so a single call to <code>fit()</code> trains both pieces together and <code>predict()</code> re-applies the preprocessor automatically on new data.</p>

[QUICK ANSWER]
add_model(wf, spec)                                  # attach a parsnip spec to a workflow
workflow() |> add_recipe(rec) |> add_model(spec)     # full workflow in one pipe
add_model(wf, spec, formula = y ~ .)                 # supply a model-only formula
update_model(wf, new_spec)                           # swap the spec in place
remove_model(wf)                                     # detach the model
extract_spec_parsnip(wf)                             # pull the spec back out
extract_fit_parsnip(wf_fit)                          # pull the trained parsnip fit

[DECISION TREE: Is add_model() the right tool?]
- attach a parsnip model spec to a workflow: workflow() |> add_model(spec)
- attach a preprocessing recipe instead: workflow() |> add_recipe(rec)
- attach a bare formula (no preprocessing): workflow() |> add_formula(y ~ x1 + x2)
- attach raw variables for matrix engines: workflow() |> add_variables(y, predictors)
- replace the spec inside an existing workflow: update_model(wf, new_spec)
- detach the model entirely: remove_model(wf)
- fit a parsnip spec directly without a workflow: spec |> fit(y ~ x, data = df)

## What add_model() does

**add_model() registers a parsnip model specification as the model action of a workflow.** It does not train anything. It records the spec in the workflow's model slot, the same way `add_recipe()` records a preprocessor in the preprocessor slot. The actual call to the engine, whether `lm()`, `glmnet()`, `ranger()`, or `xgboost()`, happens later when you pass the workflow to `fit()`, `fit_resamples()`, or `tune_grid()`.

This separation is what makes a workflow a portable training recipe. The preprocessor describes how to clean and reshape the data, the parsnip spec describes the algorithm and its engine, and `add_model()` is the verb that locks the algorithm in place. Once the spec is attached, the workflow can travel through cross-validation, tuning, and prediction without you having to re-state the engine or re-attach the preprocessor each time.

[KEY INSIGHT]
**A workflow with a model is a frozen training contract.** The recipe says what to compute, the parsnip spec says what to learn, and `add_model()` welds them into one object that downstream resampling functions can pass around without losing either half. You stop juggling separate preprocessor and model objects the moment you call `add_model()`.

## add_model() syntax and arguments

**add_model() takes a workflow, a parsnip spec, and an optional formula.** Three arguments, and most users only ever pass the first two.

```r title="The add_model argument skeleton"
library(tidymodels)

add_model(
  x,                # a workflow object
  spec,             # a parsnip model_spec, e.g. linear_reg() |> set_engine("lm")
  formula = NULL    # optional model-only formula override
)
```

The `x` argument must be a `workflow()` object, usually piped in from `workflow()` or a partial workflow that already has a preprocessor attached. The `spec` argument must be an unfit parsnip spec, the output of one of the model family functions like `linear_reg()`, `logistic_reg()`, `rand_forest()`, or `boost_tree()`, with a `set_engine()` call applied. The `formula` argument lets you give the model a different formula from the preprocessor, which is useful when the recipe creates engineered columns that the engine should treat specially.

**add_model() returns a new workflow.** The function is pure; it does not mutate its input. Always assign the result back to a variable or chain it into another pipe step, otherwise the spec attachment is silently discarded.

[NOTE]
**The spec is stored unfit.** Calling `add_model()` is cheap because nothing reaches the engine yet. The parsnip spec is held alongside the preprocessor until the workflow is fit. To inspect the underlying engine call before training, call `translate(spec)` on the spec directly outside the workflow.

**add_model() is the second half of a two-verb workflow.** Each preprocessor verb has a matching role, and `add_model()` always closes the loop.

| Preprocessor verb | Pairs with | When you reach for this combo |
|-------------------|------------|-------------------------------|
| `add_recipe()` | `add_model()` | Any pipeline with imputation, scaling, dummy encoding, or PCA |
| `add_formula()` | `add_model()` | One-liner workflow, no transformation, formula carries everything |
| `add_variables()` | `add_model()` | Matrix engines like XGBoost or lightgbm that refuse formulas |

In every row, `add_model()` is the same verb. Only the preprocessor changes based on what the data needs.

## Build workflows with add_model(): four examples

**Every example below uses built-in mtcars and airquality datasets** so the focus stays on how the spec attaches, not on the data.

### Example 1: Linear regression workflow

**The minimal workflow pairs a formula preprocessor with a linear regression spec.** Two lines and an `add_model()` call build a complete training contract.

```r title="Attach lm to a formula workflow"
library(tidymodels)

lin_spec <- linear_reg() |> set_engine("lm")

wf_lin <- workflow() |>
  add_formula(mpg ~ wt + hp + disp) |>
  add_model(lin_spec)

wf_lin
#> == Workflow ====================================================================
#> Preprocessor: Formula
#> Model: linear_reg()
#>
#> -- Preprocessor ----------------------------------------------------------------
#> mpg ~ wt + hp + disp
#>
#> -- Model -----------------------------------------------------------------------
#> Linear Regression Model Specification (regression)
#>
#> Computational engine: lm
```

The workflow now knows the formula and the engine. Calling `fit(wf_lin, data = mtcars)` passes the formula and data to `lm()` under the hood and returns a workflow object whose `extract_fit_parsnip()` accessor returns the trained linear model.

### Example 2: Random forest with a recipe

**Combining a recipe and a parsnip spec is where add_model() earns its keep.** The recipe handles preprocessing; `add_model()` locks in the algorithm.

```r title="Recipe plus random forest"
rec_rf <- recipe(am ~ mpg + wt + cyl + hp, data = mtcars) |>
  step_mutate(am = factor(am)) |>
  step_normalize(all_numeric_predictors())

rf_spec <- rand_forest(trees = 500) |>
  set_engine("ranger") |>
  set_mode("classification")

wf_rf <- workflow() |>
  add_recipe(rec_rf) |>
  add_model(rf_spec)

wf_rf_fit <- fit(wf_rf, data = mtcars)
predict(wf_rf_fit, new_data = head(mtcars))
#> # A tibble: 6 x 1
#>   .pred_class
#>   <fct>
#> 1 1
#> 2 1
#> 3 1
#> 4 0
#> 5 0
#> 6 0
```

Notice that `predict()` runs on the raw `mtcars` rows. The workflow re-applies the normalization recipe internally before passing data to ranger, so you never call `bake()` by hand.

### Example 3: Logistic regression with the formula override

**The optional formula argument lets the model use a different formula from the preprocessor.** This is rare, but it matters when a recipe creates engineered columns that the engine should consume directly.

```r title="Recipe makes columns, model sees a subset"
library(tidyr)

aq <- airquality |>
  mutate(High = factor(Ozone > 50, labels = c("low", "high"))) |>
  drop_na(Ozone)

rec_eng <- recipe(High ~ Solar.R + Wind + Temp + Month, data = aq) |>
  step_impute_median(all_numeric_predictors()) |>
  step_mutate(WindSq = Wind^2)

log_spec <- logistic_reg() |> set_engine("glm")

wf_log <- workflow() |>
  add_recipe(rec_eng) |>
  add_model(log_spec, formula = High ~ Solar.R + Temp + WindSq)

wf_log_fit <- fit(wf_log, data = aq)

extract_fit_parsnip(wf_log_fit) |>
  tidy()
#> # A tibble: 4 x 5
#>   term        estimate std.error statistic p.value
#>   <chr>          <dbl>     <dbl>     <dbl>   <dbl>
#> 1 (Intercept) -8.86      2.62        -3.38 0.000719
#> 2 Solar.R      0.00671   0.00282      2.38 0.0173
#> 3 Temp         0.0915    0.0291       3.14 0.00170
#> 4 WindSq       0.00373   0.00525      0.71 0.477
```

The recipe still produces all four predictor columns, but the formula override tells `glm()` to fit on three of them only. Without the override, the engine would fit on every column the recipe emits.

### Example 4: Update the model spec without rebuilding

**update_model() is the matching verb when you need to swap the algorithm.** It edits the model slot in place while leaving the recipe untouched.

```r title="Swap lm for glmnet on the same workflow"
rec_norm <- recipe(mpg ~ wt + hp + disp + cyl, data = mtcars) |>
  step_normalize(all_numeric_predictors())

wf_base <- workflow() |>
  add_recipe(rec_norm) |>
  add_model(linear_reg() |> set_engine("lm"))

glmnet_spec <- linear_reg(penalty = 0.1, mixture = 1) |>
  set_engine("glmnet")

wf_glmnet <- update_model(wf_base, glmnet_spec)

extract_spec_parsnip(wf_glmnet)
#> Linear Regression Model Specification (regression)
#>
#> Main Arguments:
#>   penalty = 0.1
#>   mixture = 1
#>
#> Computational engine: glmnet
```

The recipe is unchanged. Only the model spec is now glmnet with a lasso penalty. This pattern is what `tune_grid()` uses internally when it sweeps engines or hyperparameters across the same preprocessor.

## Common pitfalls

**A workflow holds exactly one model and only takes an unfit parsnip spec.** These are the three errors you will hit while learning `add_model()`.

```r title="Three errors and their fixes"
# Pitfall 1: adding two models to one workflow
workflow() |>
  add_formula(mpg ~ wt) |>
  add_model(linear_reg() |> set_engine("lm")) |>
  add_model(rand_forest() |> set_engine("ranger") |> set_mode("regression"))
#> Error in `add_model()`: A model action has already been added.
#> Fix: use update_model() to replace, not add_model() twice.

# Pitfall 2: forgetting set_mode() on a model that needs it
spec_bad <- rand_forest()
workflow() |>
  add_formula(am ~ wt + mpg) |>
  add_model(spec_bad)
#> Error: Please set the mode in the model specification.
#> Fix: spec_bad |> set_mode("classification") (or "regression").

# Pitfall 3: passing a fitted model instead of a spec
spec_fit <- linear_reg() |>
  set_engine("lm") |>
  fit(mpg ~ wt, data = mtcars)

workflow() |>
  add_formula(mpg ~ wt) |>
  add_model(spec_fit)
#> Error in `add_model()`: `spec` must be a `model_spec`, not a fitted model.
#> Fix: pass the spec object before calling fit().
```

[WARNING]
**Never pass a fitted parsnip object to add_model().** The workflow must train the model itself so resampling and tuning can re-fit it on each split. Pre-fitting and then attaching breaks every leakage guarantee the workflow gives you, and modern workflows versions reject it outright with the error above.

## Try it yourself

**Try it:** Build a workflow that uses `add_recipe()` to scale `Sepal.Length` and `Sepal.Width`, then attaches a k-nearest neighbors classifier to predict `Species`. Save the fitted workflow to `ex_fit`.

```r title="Your turn: kNN classifier with add_model"
# Try it: scale predictors and attach a knn spec
library(tidymodels)

ex_rec <- # your code here

ex_spec <- # your code here

ex_fit <- # your code here

predict(ex_fit, new_data = head(iris))
#> Expected: tibble with 6 .pred_class values, all "setosa"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_rec <- recipe(Species ~ Sepal.Length + Sepal.Width, data = iris) |>
  step_normalize(all_numeric_predictors())

ex_spec <- nearest_neighbor(neighbors = 5) |>
  set_engine("kknn") |>
  set_mode("classification")

ex_fit <- workflow() |>
  add_recipe(ex_rec) |>
  add_model(ex_spec) |>
  fit(data = iris)

predict(ex_fit, new_data = head(iris))
#> # A tibble: 6 x 1
#>   .pred_class
#>   <fct>
#> 1 setosa
#> 2 setosa
#> 3 setosa
#> 4 setosa
#> 5 setosa
#> 6 setosa
```

**Explanation:** `step_normalize()` scales the predictors so kNN's distance metric treats them equally. `nearest_neighbor()` builds the spec, `set_mode("classification")` is required because kNN supports both regression and classification, and `add_model()` attaches the spec to the workflow.

</details>

## Related tidymodels functions

**add_model() rarely appears alone.** These are the functions you will use alongside it.

- `workflow()` creates the empty workflow that `add_model()` updates.
- `add_recipe()` attaches the preprocessing recipe that pairs with the spec.
- `add_formula()` attaches a bare formula preprocessor when no recipe is needed.
- `update_model()` swaps the spec inside an existing workflow without rebuilding.
- `extract_spec_parsnip()` pulls the unfit spec back out of a workflow.
- `extract_fit_parsnip()` pulls the trained parsnip object out of a fitted workflow.

See the [workflows package reference](https://workflows.tidymodels.org/reference/) for the full verb family.

## FAQ

**Does add_model() train the model?**

No. `add_model()` only stores the parsnip spec in the workflow's model slot. Training happens inside `fit()`, `fit_resamples()`, or `tune_grid()`, which call the engine on the preprocessed training data. This is intentional and is what gives the workflow its consistent behaviour across resampling: the same spec is re-fit on each fold rather than carried over as a pre-trained object.

**Can I have two models in one workflow?**

No. A workflow holds exactly one model action, the same way it holds exactly one preprocessor. Calling `add_model()` a second time raises an error. Use `update_model(wf, new_spec)` to replace the existing spec without touching the recipe or formula. To compare several models on the same preprocessor, build separate workflows or use the workflowsets package.

**What is the formula argument for in add_model()?**

It supplies a model-only formula when the preprocessor would otherwise pass everything to the engine. This is needed when a recipe produces engineered columns and you want the engine to see only a subset, or when an engine like survival or zero-inflated models expects a specialised formula syntax that the preprocessor does not natively support. For most workflows, leave it `NULL`.

**Is add_model() different from parsnip::fit()?**

Yes. `parsnip::fit()` takes a spec plus data and trains the model directly. `add_model()` only attaches the spec to a workflow without training. The workflow object adds preprocessor management, resampling support, and `extract_*()` accessors. Pick `parsnip::fit()` for one-off training, `add_model()` when you need any of the workflow features.

**How do I inspect the trained model inside a fitted workflow?**

Call `extract_fit_parsnip(wf_fit)` on the fitted workflow. The returned parsnip fit can be passed to `tidy()` for coefficient tables, `glance()` for fit statistics, or `extract_fit_engine()` for the raw underlying object such as the `lm` or `ranger` model. The workflow's preprocessor is similarly retrievable with `extract_recipe(wf_fit)` or `extract_preprocessor(wf_fit)`.
