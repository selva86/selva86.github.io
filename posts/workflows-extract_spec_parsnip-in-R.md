---
title: "workflows extract_spec_parsnip() in R: Pull the Parsnip Spec"
slug: workflows-extract_spec_parsnip-in-R
description: "Use workflows extract_spec_parsnip() in R to pull the parsnip model spec out of a tidymodels workflow. Syntax, arguments, four examples, common pitfalls."
keywords: "workflows extract_spec_parsnip, extract_spec_parsnip function R, workflows extract_spec_parsnip examples, extract_spec_parsnip tidymodels, R extract parsnip spec, extract parsnip model from workflow, tidymodels extract spec"
mathjax: false
webr: true
date: "2026-05-23"
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "extract_spec_parsnip()|workflows extract_spec_parsnip|workflows::extract_spec_parsnip()|extract the parsnip spec|pull the model spec from workflow"
auto_link_case_sensitive: true
target_keyword: "workflows extract_spec_parsnip"
sibling_block_enabled: true
difficulty: Beginner
---

# workflows extract_spec_parsnip() in R: Pull the Parsnip Spec

<p class="lead">The workflows <code>extract_spec_parsnip()</code> function in R returns the parsnip model specification stored inside a tidymodels workflow, whether the workflow has been fit or not. It is the supported way to inspect the engine, mode, and finalized arguments of the model without poking at internal slots.</p>

[QUICK ANSWER]
extract_spec_parsnip(wf)                            # spec from unfit workflow
extract_spec_parsnip(wf_fit)                        # spec from fitted workflow, same object
extract_spec_parsnip(wf_fit)$engine                 # engine name as a string
extract_spec_parsnip(wf_fit)$mode                   # "regression" or "classification"
extract_spec_parsnip(wf_fit)$args                   # quosures for each model argument
extract_spec_parsnip(wf_final) |> translate()       # translated engine call after finalize
extract_fit_parsnip(wf_fit)$spec                    # also reaches the spec, via the fit object

[DECISION TREE: Is extract_spec_parsnip() the right tool?]
- pull the parsnip model spec from a workflow: extract_spec_parsnip(wf)
- pull the trained recipe instead: extract_recipe(wf_fit)
- pull the parsnip fit object with results: extract_fit_parsnip(wf_fit)
- pull the underlying engine fit (lm, ranger): extract_fit_engine(wf_fit)
- pull any preprocessor (recipe or formula): extract_preprocessor(wf)
- pull the tuning parameter set: extract_parameter_set_dials(wf)
- attach a model spec to a fresh workflow: workflow() |> add_model(spec)

## What extract_spec_parsnip() does

**extract_spec_parsnip() returns the parsnip model spec object stored inside a workflow.** It works on both unfit workflows and fitted workflows, and it returns the same spec in both cases. The function reaches into the workflow, finds the `model_spec` slot, and hands it back so you can read the engine, the mode, and the model arguments without reaching into internal structures.

The spec is the object you originally created with calls like `linear_reg() |> set_engine("lm")` or `rand_forest(trees = 500) |> set_mode("classification")`. Inside a workflow it lives behind several layers of list nesting, and the path can change between releases. `extract_spec_parsnip()` is the stable, documented door, and it belongs to the same `extract_*()` family as `extract_recipe()`, `extract_fit_engine()`, and `extract_fit_parsnip()`.

[KEY INSIGHT]
**The spec is a recipe for a model, not the fitted model.** `extract_spec_parsnip()` returns the blueprint that tells parsnip which engine to call and which arguments to pass. To get the trained coefficients or tree splits, reach for `extract_fit_engine()` or `extract_fit_parsnip()` instead. Confusing the two is the most common mistake when working with workflows.

## extract_spec_parsnip() syntax and arguments

**extract_spec_parsnip() takes one required argument.** The signature is short because the function only does one job.

```r title="The extract_spec_parsnip argument skeleton"
library(tidymodels)

extract_spec_parsnip(
  x,    # a workflow object, fit or unfit
  ...   # currently unused, reserved for future arguments
)
```

The `x` argument must be a `workflow()` object that has had a parsnip model attached with `add_model()`. If no model has been attached, the function raises an error pointing you at `add_model()`. The `...` slot is reserved and ignored today, so always call the function with the workflow as the only argument.

**The returned object is a parsnip `model_spec`.** You can inspect it, modify it with `update()`, or attach it to a new workflow.

| Spec slot | What it holds | Typical use |
|-----------|---------------|-------------|
| `engine` | Engine name as a string | Check which package will fit the model |
| `mode` | `"regression"` or `"classification"` | Confirm the model task |
| `args` | Named list of quosures | Read the model arguments like `trees` or `mtry` |
| `eng_args` | Engine-specific arguments | Inspect things passed via `set_engine(arg = ...)` |

[NOTE]
**extract_spec_parsnip() is one of seven extract verbs.** The siblings are `extract_recipe()`, `extract_fit_engine()`, `extract_fit_parsnip()`, `extract_preprocessor()`, `extract_mold()`, and `extract_parameter_set_dials()`. Each targets a different slot of the workflow.

## Pull parsnip specs with extract_spec_parsnip(): four examples

**Every example below builds a workflow first, then extracts the spec** so you can see what `extract_spec_parsnip()` reports back at each stage of the modeling cycle.

### Example 1: Inspect the engine and mode

**The most common use is a quick sanity check.** When you load a saved workflow or audit a teammate's code, the spec tells you exactly which engine and mode are wired up.

```r title="Inspect engine and mode from a fitted workflow"
library(tidymodels)

rf_spec <- rand_forest(trees = 500) |>
  set_engine("ranger") |>
  set_mode("regression")

wf_rf_fit <- workflow() |>
  add_formula(mpg ~ wt + hp + disp) |>
  add_model(rf_spec) |>
  fit(data = mtcars)

spec <- extract_spec_parsnip(wf_rf_fit)

spec$engine
#> [1] "ranger"

spec$mode
#> [1] "regression"

class(spec)
#> [1] "rand_forest" "model_spec"
```

The spec carries the engine name and the mode as plain strings. The class vector confirms it is a `rand_forest` model spec, the same object you would build by hand with `rand_forest()`. Pulling these out is the first step in any audit of a fitted workflow.

### Example 2: Read finalized arguments after tuning

**After `tune_grid()` and `finalize_workflow()`, the spec carries the best hyperparameters.** `extract_spec_parsnip()` is the right way to confirm what was finalized.

```r title="Pull the spec after finalize_workflow"
xgb_spec <- boost_tree(
  trees = tune(),
  learn_rate = tune()
) |>
  set_engine("xgboost") |>
  set_mode("regression")

wf_xgb <- workflow() |>
  add_formula(mpg ~ wt + hp + disp + cyl) |>
  add_model(xgb_spec)

best_params <- tibble(trees = 250, learn_rate = 0.05)

wf_final <- finalize_workflow(wf_xgb, best_params)

extract_spec_parsnip(wf_final)$args
#> $mtry
#> <quosure>
#> expr: ^NULL
#>
#> $trees
#> <quosure>
#> expr: ^250
#>
#> $min_n
#> <quosure>
#> expr: ^NULL
#>
#> $learn_rate
#> <quosure>
#> expr: ^0.05
```

The `args` slot shows quosures, one per model argument. After `finalize_workflow()` replaces the `tune()` placeholders, the quosures hold the actual chosen values. Reading `args$trees` and `args$learn_rate` confirms the workflow is ready to fit.

[TIP]
**Use `translate()` to see the engine call.** Piping the extracted spec into `translate()` reveals the literal call parsnip will make, including engine-specific defaults. This is the cleanest way to verify a hyperparameter survived the finalize step.

### Example 3: Reuse a spec in a different workflow

**Pulling the spec lets you wire the same model into a new workflow** without rebuilding the call from scratch.

```r title="Reuse the parsnip spec with a different preprocessor"
old_spec <- extract_spec_parsnip(wf_rf_fit)

rec_pca <- recipe(mpg ~ wt + hp + disp + qsec, data = mtcars) |>
  step_normalize(all_numeric_predictors()) |>
  step_pca(all_numeric_predictors(), num_comp = 2)

wf_pca <- workflow() |>
  add_recipe(rec_pca) |>
  add_model(old_spec) |>
  fit(data = mtcars)

predict(wf_pca, new_data = head(mtcars, 3))
#> # A tibble: 3 x 1
#>   .pred
#>   <dbl>
#> 1  21.4
#> 2  20.9
#> 3  24.1
```

Same model spec, new preprocessor. The spec is a pure recipe for the model call, so it does not care which preprocessor attaches to it. This pattern is useful when you have settled on hyperparameters and want to test the same model against several feature pipelines.

### Example 4: Compare the spec before and after fit

**The spec survives the fit unchanged.** `extract_spec_parsnip()` returns the same object whether you call it on an unfit or fitted workflow.

```r title="Compare spec from unfit and fitted workflows"
lr_spec <- linear_reg(penalty = 0.01, mixture = 0.5) |>
  set_engine("glmnet")

wf_unfit <- workflow() |>
  add_formula(mpg ~ wt + hp) |>
  add_model(lr_spec)

wf_fit <- fit(wf_unfit, data = mtcars)

identical(
  extract_spec_parsnip(wf_unfit),
  extract_spec_parsnip(wf_fit)
)
#> [1] TRUE
```

The returned specs are identical. Fitting does not mutate the spec; it produces a separate fit object that lives in another slot of the workflow. Reach for `extract_fit_parsnip(wf_fit)` if you want the spec plus the fitted results bundled together.

## Common pitfalls

**extract_spec_parsnip() is small, but three failure modes catch new users.** Each error message points roughly at the fix, and the corrections below remove the ambiguity.

```r title="Three errors and their fixes"
# Pitfall 1: workflow has no model attached
wf_no_model <- workflow() |>
  add_formula(mpg ~ wt)
extract_spec_parsnip(wf_no_model)
#> Error: Can't extract a model spec because the workflow does not have one.
#> Fix: add_model(wf_no_model, linear_reg()) before extracting.

# Pitfall 2: confusing the spec with the fitted model
spec_only <- extract_spec_parsnip(wf_fit)
coef(spec_only)
#> Error: no applicable method for 'coef' applied to an object of class "model_spec".
#> Fix: extract_fit_engine(wf_fit) |> coef() returns the coefficients.

# Pitfall 3: passing a parsnip fit, not a workflow
parsnip_fit <- linear_reg() |>
  set_engine("lm") |>
  fit(mpg ~ wt, data = mtcars)
extract_spec_parsnip(parsnip_fit)
#> Error: 'x' should be a <workflow>, not a <model_fit>.
#> Fix: read parsnip_fit$spec directly, or wrap the fit in a workflow first.
```

[WARNING]
**The spec has no coefficients.** `extract_spec_parsnip()` returns only the model recipe: engine, mode, arguments. Calling `coef()`, `summary()`, or `predict()` on the spec raises an error because there is nothing fitted inside. Reach for `extract_fit_engine()` or `extract_fit_parsnip()` when you need the trained model.

## Try it yourself

**Try it:** Build a workflow that fits a `decision_tree()` on the iris dataset with `tree_depth = 4` using the `rpart` engine in classification mode, then pull the parsnip spec and read its mode and tree depth. Save the extracted spec to `ex_spec`.

```r title="Your turn: extract a decision tree spec"
# Try it: extract the parsnip spec from a fitted workflow
library(tidymodels)

ex_wf_fit <- # your code here

ex_spec <- # your code here

ex_spec$mode
#> Expected: "classification"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_tree_spec <- decision_tree(tree_depth = 4) |>
  set_engine("rpart") |>
  set_mode("classification")

ex_wf_fit <- workflow() |>
  add_formula(Species ~ .) |>
  add_model(ex_tree_spec) |>
  fit(data = iris)

ex_spec <- extract_spec_parsnip(ex_wf_fit)

ex_spec$mode
#> [1] "classification"

ex_spec$args$tree_depth
#> <quosure>
#> expr: ^4
```

**Explanation:** `extract_spec_parsnip()` returns the unchanged parsnip spec from the fitted workflow. The `mode` slot is the string you set with `set_mode()`, and `args$tree_depth` holds the quosure carrying the depth value you passed in.

</details>

## Related tidymodels functions

**extract_spec_parsnip() rarely flies solo.** These are the functions you will reach for alongside it.

- `add_model()` attaches the parsnip spec that `extract_spec_parsnip()` will later return.
- `extract_fit_parsnip()` returns the parsnip fit object, which bundles the spec plus the fitted results.
- `extract_fit_engine()` returns the underlying engine fit, such as the `lm` or `ranger` object.
- `extract_recipe()` pulls the recipe out of the same workflow, when one is attached.
- `extract_preprocessor()` works on any preprocessor type, not only recipes.
- `finalize_workflow()` replaces `tune()` placeholders in the spec with concrete values.
- `translate()` shows the literal engine call the spec will make once fit.

See the [workflows extract reference](https://workflows.tidymodels.org/reference/extract-workflow.html) for the full extract verb family.

## FAQ

**What is the difference between extract_spec_parsnip() and extract_fit_parsnip()?**

`extract_spec_parsnip()` returns only the unfitted parsnip spec, the blueprint describing engine, mode, and arguments. `extract_fit_parsnip()` returns the parsnip fit object, which carries both the spec and the trained results, including coefficients or tree splits. Reach for the spec when auditing what was wired up; reach for the fit when you need the trained model behaviour, like calling `predict()` or `tidy()` on the results.

**Does extract_spec_parsnip() work on a workflow that was never fit?**

Yes. The spec is set when you call `add_model()` and never changes during `fit()`. `extract_spec_parsnip()` happily returns the spec from an unfit workflow, and the returned object is identical to the one you would get after fitting. The function only errors when no model has been attached at all, in which case the message tells you to call `add_model()` first.

**Why does my extracted spec still show `tune()` placeholders?**

You extracted before finalizing. After `tune_grid()` you must call `finalize_workflow()` (or `finalize_model()` for a bare spec) with the chosen parameter values before the spec carries them. Without that step, `args$trees` still holds the `tune()` quosure rather than the chosen integer. Inspect the spec right after finalize to confirm the values stuck.

**Can I edit the extracted spec and put it back into the workflow?**

Yes, via `update_model()`. Extract the spec, change one argument with `update()` or `set_args()`, then call `update_model(wf, new_spec)` to swap the modified spec back into the workflow. Avoid mutating the spec object in place; the workflow holds a copy and will not see your edits until `update_model()` runs.

**How does extract_spec_parsnip() relate to translate()?**

`extract_spec_parsnip()` returns the abstract parsnip spec, the same one across engines. `translate()` takes that spec and shows the literal engine call, like `ranger::ranger(num.trees = 500)`. Pipe one into the other when you want to confirm an argument survived the tidymodels-to-engine translation, especially after `finalize_workflow()` replaces tune placeholders.
