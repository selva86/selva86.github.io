---
title: "workflows extract_recipe() in R: Pull the Trained Recipe Out"
slug: workflows-extract_recipe-in-R
description: "Use workflows extract_recipe() in R to pull the trained recipes object out of a fitted tidymodels workflow. Syntax, four examples, plus the estimated flag."
keywords: "workflows extract_recipe, extract_recipe function R, workflows extract_recipe examples, extract_recipe tidymodels, R extract recipe, tidymodels extract recipe, extract_recipe estimated"
mathjax: false
webr: true
date: "2026-05-23"
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "extract_recipe()|workflows extract_recipe|workflows::extract_recipe()|extract the trained recipe|pull the recipe from workflow"
auto_link_case_sensitive: true
target_keyword: "workflows extract_recipe"
sibling_block_enabled: true
difficulty: Beginner
---

# workflows extract_recipe() in R: Pull the Trained Recipe Out

<p class="lead">The workflows <code>extract_recipe()</code> function in R pulls the recipes object back out of a tidymodels workflow, either as the trained recipe carrying learned values like means and medians, or as the original unprepped recipe you attached. It is the standard tool for inspecting, debugging, and auditing what the preprocessor inside a fitted workflow actually learned.</p>

[QUICK ANSWER]
extract_recipe(wf_fit)                              # trained recipe from fitted workflow
extract_recipe(wf_fit, estimated = TRUE)            # explicit, same as default
extract_recipe(wf_fit, estimated = FALSE)           # original unprepped recipe
extract_recipe(wf_fit) |> tidy(number = 1)          # learned values for step 1
extract_recipe(wf_fit) |> bake(new_data = df)       # apply the trained recipe by hand
extract_preprocessor(wf_fit)                        # also works, recipe or formula
extract_mold(wf_fit)$predictors                     # baked predictors after preprocessing

[DECISION TREE: Is extract_recipe() the right tool?]
- pull the trained recipe from a fitted workflow: extract_recipe(wf_fit)
- pull the parsnip model spec instead: extract_spec_parsnip(wf_fit)
- pull the underlying engine fit (lm, glm): extract_fit_engine(wf_fit)
- pull the parsnip fit object: extract_fit_parsnip(wf_fit)
- pull any preprocessor (recipe or formula): extract_preprocessor(wf_fit)
- pull baked predictors and outcomes: extract_mold(wf_fit)
- attach a recipe to a fresh workflow: workflow() |> add_recipe(rec)

## What extract_recipe() does

**extract_recipe() returns the recipes object stored inside a workflow.** By default it returns the trained recipe, the one prepped during `fit()` with all learned statistics baked in. Pass `estimated = FALSE` to get the original, unprepped recipe you handed to `add_recipe()` instead.

The function exists because a workflow hides its preprocessor inside a slot you should not reach into by hand. `wf_fit$pre$mold$blueprint$recipe` works, but it is implementation detail that the tidymodels team can change. `extract_recipe()` is the stable, supported door, and it is part of a wider `extract_*()` family that does the same job for the model spec, the engine fit, and the baked data.

[KEY INSIGHT]
**The trained recipe is a complete, replayable transformer.** Once `extract_recipe()` hands it back, you can `bake()` any new data through it without the workflow, share it with a colleague, or save it to disk. The learned means, medians, dummy levels, and PCA loadings travel with the object.

## extract_recipe() syntax and arguments

**extract_recipe() takes a workflow and one flag.** The signature is short, and the flag is the whole story.

```r title="The extract_recipe argument skeleton"
library(tidymodels)

extract_recipe(
  x,                # a workflow object
  estimated = TRUE  # TRUE pulls the trained recipe, FALSE pulls the original
)
```

The `x` argument must be a `workflow()` object. If the workflow was never fit, `extract_recipe()` still returns the unprepped recipe regardless of the flag, because no trained version exists. If the workflow uses a formula or variables preprocessor instead of a recipe, `extract_recipe()` raises an error; reach for `extract_preprocessor()` in that case.

**The estimated argument switches between two snapshots of the same recipe.** Both are useful at different points in your modeling cycle.

| `estimated` | Returns | Typical use |
|-------------|---------|-------------|
| `TRUE` (default) | Prepped recipe with learned step values | Inspect means, medians, dummy levels; bake new data |
| `FALSE` | Original unprepped recipe with step specs | Reuse the recipe in a different workflow or rerun on new data |

[NOTE]
**extract_recipe() is one of seven extract verbs.** The siblings are `extract_spec_parsnip()`, `extract_fit_engine()`, `extract_fit_parsnip()`, `extract_preprocessor()`, `extract_mold()`, and `extract_parameter_set_dials()`. Each targets a different slot of the workflow.

## Pull recipes with extract_recipe(): four examples

**Every example below fits a workflow first, then extracts the trained recipe** so the focus stays on what `extract_recipe()` reveals about the prepped pipeline.

### Example 1: Inspect learned means and standard deviations

**Step_normalize() learns one mean and one standard deviation per column.** `extract_recipe()` plus `tidy()` shows them.

```r title="Extract a normalized recipe and inspect"
library(tidymodels)

rec_norm <- recipe(mpg ~ wt + hp + disp, data = mtcars) |>
  step_normalize(all_numeric_predictors())

wf_norm_fit <- workflow() |>
  add_recipe(rec_norm) |>
  add_model(linear_reg() |> set_engine("lm")) |>
  fit(data = mtcars)

extract_recipe(wf_norm_fit) |>
  tidy(number = 1)
#> # A tibble: 6 x 4
#>   terms statistic  value id
#>   <chr> <chr>      <dbl> <chr>
#> 1 wt    mean       3.22  normalize_xxxxx
#> 2 hp    mean     147.    normalize_xxxxx
#> 3 disp  mean     231.    normalize_xxxxx
#> 4 wt    sd         0.978 normalize_xxxxx
#> 5 hp    sd        68.6   normalize_xxxxx
#> 6 disp  sd       124.    normalize_xxxxx
```

The numbers come from `mtcars` and are computed only from rows passed to `fit()`. Under cross-validation they would be different for each fold, which is exactly the leakage-safe behaviour `add_recipe()` exists to provide.

### Example 2: Bake new data with the trained recipe

**A trained recipe can transform new rows directly.** No workflow needed once you have the recipe back.

```r title="Bake new data with the extracted recipe"
trained_rec <- extract_recipe(wf_norm_fit)

new_cars <- mtcars[1:3, c("wt", "hp", "disp")]

bake(trained_rec, new_data = new_cars)
#> # A tibble: 3 x 3
#>      wt     hp   disp
#>   <dbl>  <dbl>  <dbl>
#> 1 -0.610 -0.535 -0.571
#> 2 -0.350 -0.535 -0.571
#> 3 -0.917 -0.783 -0.990
```

`bake()` uses the means and standard deviations the recipe learned during `fit()`. Calling `predict(wf_norm_fit, new_data = new_cars)` does the same thing internally; pulling the recipe out is only useful when you want the transformed columns without the model on top.

### Example 3: Compare estimated = TRUE vs estimated = FALSE

**Both snapshots come from the same workflow.** The trained one carries learned values; the untrained one carries only the step specifications.

```r title="Compare trained and untrained recipes"
aq <- airquality |>
  mutate(Month = factor(Month))

rec_full <- recipe(Ozone ~ Solar.R + Wind + Temp + Month, data = aq) |>
  step_impute_median(all_numeric_predictors()) |>
  step_dummy(all_nominal_predictors())

wf_full_fit <- workflow() |>
  add_recipe(rec_full) |>
  add_model(linear_reg() |> set_engine("lm")) |>
  fit(data = aq)

trained   <- extract_recipe(wf_full_fit, estimated = TRUE)
untrained <- extract_recipe(wf_full_fit, estimated = FALSE)

tidy(trained,   number = 1)
#> # A tibble: 3 x 3
#>   terms     value model
#>   <chr>     <dbl> <chr>
#> 1 Solar.R  205    impute_median
#> 2 Wind       9.7  impute_median
#> 3 Temp      79    impute_median

tidy(untrained, number = 1)
#> # A tibble: 3 x 3
#>   terms     value model
#>   <chr>     <dbl> <chr>
#> 1 Solar.R    NA   impute_median
#> 2 Wind       NA   impute_median
#> 3 Temp       NA   impute_median
```

The trained recipe reports the actual learned medians. The untrained recipe reports `NA` for every value because no data has been seen yet. Pass `estimated = FALSE` only when you want to reuse the step specs on a different dataset.

### Example 4: Reuse a recipe across workflows

**Pulling an unprepped recipe lets you wire it into a different workflow** without rebuilding the steps from scratch.

```r title="Reuse the recipe with a different engine"
original_rec <- extract_recipe(wf_full_fit, estimated = FALSE)

wf_rf <- workflow() |>
  add_recipe(original_rec) |>
  add_model(rand_forest(mode = "regression") |> set_engine("ranger")) |>
  fit(data = aq)

predict(wf_rf, new_data = head(aq, 3))
#> # A tibble: 3 x 1
#>   .pred
#>   <dbl>
#> 1  37.8
#> 2  29.4
#> 3  17.6
```

Same recipe, different model. The unprepped recipe is the right snapshot here because the random forest will retrain the preprocessing on its own training rows, exactly the same way the linear regression did. Passing `estimated = TRUE` would freeze the medians learned during the first fit and skip re-estimation.

## Common pitfalls

**extract_recipe() looks innocent but the estimated flag is easy to misuse.** These are the three failure modes you will hit while learning the function.

```r title="Three errors and their fixes"
# Pitfall 1: workflow has a formula, not a recipe
wf_form <- workflow() |>
  add_formula(mpg ~ wt) |>
  add_model(linear_reg() |> set_engine("lm")) |>
  fit(data = mtcars)
extract_recipe(wf_form)
#> Error: The workflow does not have a recipe preprocessor.
#> Fix: use extract_preprocessor(wf_form) for formulas.

# Pitfall 2: extracting before fit() finishes
wf_unfit <- workflow() |>
  add_recipe(rec_norm) |>
  add_model(linear_reg() |> set_engine("lm"))
extract_recipe(wf_unfit, estimated = TRUE)
#> Returns the unprepped recipe with a warning.
#> Fix: call fit() first, then extract.

# Pitfall 3: baking with the wrong snapshot
new_rec <- recipe(mpg ~ wt + hp + disp, data = mtcars) |>
  step_normalize(all_numeric_predictors())
extract_recipe(wf_norm_fit, estimated = FALSE) |>
  bake(new_data = mtcars[1:3, ])
#> Error: At least one step has not been trained. Run prep() first.
#> Fix: pass estimated = TRUE if you want bake to work.
```

[WARNING]
**Untrained recipes cannot bake.** `extract_recipe(wf_fit, estimated = FALSE)` returns a recipe that knows the steps but has not learned any values. Calling `bake()` on it raises an error because medians, means, and dummy levels do not exist yet. Pass `estimated = TRUE` whenever the next step is `bake()`.

## Try it yourself

**Try it:** Fit a workflow on the iris dataset that uses `step_log()` on `Sepal.Length` and dummy-encodes `Species`, then pull the trained recipe back out and tidy its first step. Save the trained recipe to `ex_rec_trained`.

```r title="Your turn: extract a trained recipe"
# Try it: extract the trained recipe back out
library(tidymodels)

ex_wf_fit <- # your code here

ex_rec_trained <- # your code here

tidy(ex_rec_trained, number = 1)
#> Expected: tibble showing step_log info for Sepal.Length
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_rec <- recipe(Petal.Length ~ Sepal.Length + Species, data = iris) |>
  step_log(Sepal.Length) |>
  step_dummy(all_nominal_predictors())

ex_wf_fit <- workflow() |>
  add_recipe(ex_rec) |>
  add_model(linear_reg() |> set_engine("lm")) |>
  fit(data = iris)

ex_rec_trained <- extract_recipe(ex_wf_fit)

tidy(ex_rec_trained, number = 1)
#> # A tibble: 1 x 3
#>   terms        base    id
#>   <chr>       <dbl> <chr>
#> 1 Sepal.Length 2.72 log_xxxxx
```

**Explanation:** `extract_recipe()` returns the trained recipe from the fitted workflow. `tidy(number = 1)` then reports the parameters for the first step, here the log base (e) used by `step_log()`. Step 2 would report the dummy levels learned for `Species`.

</details>

## Related tidymodels functions

**extract_recipe() rarely flies solo.** These are the functions you will reach for alongside it.

- `add_recipe()` attaches the recipe that `extract_recipe()` will later return.
- `recipe()` builds the recipes object in the first place.
- `extract_preprocessor()` works on workflows with any preprocessor type, not only recipes.
- `extract_spec_parsnip()` pulls the model spec out of the same workflow.
- `extract_fit_engine()` pulls the underlying engine fit (lm, glm, ranger).
- `tidy()` summarizes the learned values of any step in the extracted recipe.
- `bake()` applies the trained recipe to new data by hand.

See the [workflows extract reference](https://workflows.tidymodels.org/reference/extract-workflow.html) for the full extract verb family.

## FAQ

**What is the difference between extract_recipe() and extract_preprocessor()?**

`extract_recipe()` only works when the preprocessor is a recipes object and raises an error otherwise. `extract_preprocessor()` is the generic version: it returns whatever preprocessor is attached, whether that is a recipe, a formula, or a `workflow_variables()` selector. Use `extract_recipe()` when you know the workflow uses a recipe and you want a clear error if that ever changes; use `extract_preprocessor()` in code that needs to handle multiple preprocessor types.

**Does extract_recipe() work on a workflow that was never fit?**

It returns the unprepped recipe with a warning. The flag `estimated = TRUE` cannot deliver a trained recipe when no training happened, so the function falls back to the original recipe. If you want the warning to go away, call `fit()` first or pass `estimated = FALSE` explicitly.

**Can I save the extracted recipe to disk and reload it later?**

Yes. The trained recipe is a regular R object and survives `saveRDS()` and `readRDS()` round-trips. Save the trained recipe when you want to apply the same preprocessing to fresh data in a different session without rebuilding the workflow. Watch the version of the recipes package: prepped objects load only against compatible versions.

**Why does tidy() on the extracted recipe show NA values?**

You passed `estimated = FALSE`. The untrained recipe stores step specifications without learned parameters, so `tidy()` reports `NA` for every value. Drop the flag, or set it to `TRUE`, and tidy will return the learned means, medians, or dummy levels instead.

**How do I see all the columns the recipe produced after baking?**

Call `extract_mold(wf_fit)$predictors`. The mold contains the baked predictor matrix the workflow handed to the model, with one row per training row and one column per output of the recipe. This is useful when a recipe creates many indicator columns and you want to confirm their names before predicting.
