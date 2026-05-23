---
title: "workflows add_recipe() in R: Attach a Preprocessing Recipe"
slug: workflows-add_recipe-in-R
description: "Use workflows add_recipe() in R to attach a recipes preprocessor to a tidymodels workflow. Syntax, four worked examples, leakage protection, and pitfalls."
keywords: "workflows add_recipe, add_recipe function R, add_recipe workflow, tidymodels add_recipe, R add_recipe, workflows add recipe, add_recipe tidymodels examples"
mathjax: false
webr: true
date: "2026-05-23"
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "add_recipe()|workflows add_recipe|workflows::add_recipe()|add a recipe to workflow|attach a recipe"
auto_link_case_sensitive: true
target_keyword: "workflows add_recipe"
sibling_block_enabled: true
difficulty: Beginner
---

# workflows add_recipe() in R: Attach a Preprocessing Recipe

<p class="lead">The workflows <code>add_recipe()</code> function in R attaches a recipes object to a tidymodels workflow as the preprocessor. The recipe stays with the workflow, so resampling, tuning, and prediction all re-estimate the same preprocessing steps on each fold and keep data leakage out of the pipeline.</p>

[QUICK ANSWER]
add_recipe(wf, rec)                                  # attach a recipe to a workflow
workflow() |> add_recipe(rec) |> add_model(spec)     # full workflow in one pipe
add_recipe(wf, rec, blueprint = bp)                  # custom hardhat blueprint
update_recipe(wf, new_rec)                           # swap the recipe in place
remove_recipe(wf)                                    # detach the recipe
extract_recipe(wf_fit)                               # pull the trained recipe back
extract_recipe(wf_fit, estimated = FALSE)            # pull the untrained recipe

[DECISION TREE: Is add_recipe() the right tool?]
- attach a recipes preprocessor to a workflow: workflow() |> add_recipe(rec)
- attach a formula instead, no preprocessing: workflow() |> add_formula(mpg ~ wt + hp)
- attach raw variables, no preprocessing: workflow() |> add_variables(mpg, c(wt, hp))
- replace an attached recipe in place: update_recipe(wf, new_rec)
- detach the recipe entirely: remove_recipe(wf)
- prep and bake by hand outside a workflow: rec |> prep() |> bake(new_data = df)

## What add_recipe() does

**add_recipe() registers a recipes object as the preprocessor of a workflow.** It does not run the recipe. It only records the recipe in the workflow's preprocessor slot, the same way `add_model()` records a parsnip spec in the model slot. The actual `prep()` and `bake()` calls happen later, when you call `fit()`, `fit_resamples()`, or `tune_grid()` on the workflow.

This is the plumbing trick at the centre of tidymodels. By keeping the recipe inside the workflow, the workflow re-estimates the recipe on the training half of each resample and re-applies it to the held out half. Means, standard deviations, dummy levels, and PCA loadings are learned from training rows only, never from validation rows. Hand-rolled pipelines that call `prep()` once on the full data leak summary statistics into every fold; `add_recipe()` removes that risk by construction.

[KEY INSIGHT]
**A workflow with a recipe is one object that knows both what to compute and what to learn.** The recipe describes data prep, the parsnip spec describes the model, and the workflow binds them so resampling and prediction stay in sync. You never need to remember to `bake()` new data before `predict()`; the workflow does it for you.

## add_recipe() syntax and arguments

**add_recipe() takes a workflow, a recipe, and an optional blueprint.** The signature is short, and most users never touch the blueprint argument.

```r title="The add_recipe argument skeleton"
library(tidymodels)

add_recipe(
  x,                # a workflow object
  recipe,           # an untrained recipes object built with recipe()
  blueprint = NULL  # a hardhat blueprint controlling indicator handling
)
```

The `x` argument must be a `workflow()` object, usually piped in from `workflow()`. The `recipe` argument must be an unprepped recipes object; pass the raw output of `recipe()` plus any `step_*()` calls, not a prepped recipe. The `blueprint` argument is a `hardhat::default_recipe_blueprint()` object that controls how predictors with missing values, indicator variables, and intercepts are handled at prediction time; the default usually does the right thing.

**add_recipe() returns a new workflow.** The function is pure: it does not mutate its input. You always need to assign the result back to a variable or chain it into another pipe step.

[NOTE]
**The recipe is stored, not run.** Calling `add_recipe()` is cheap because nothing is computed. The recipe is held alongside the model spec until the workflow is fit. If you want to inspect what the recipe will do before training, call `prep()` and `bake()` on the recipe directly, outside the workflow.

**add_recipe() is one of three preprocessor verbs in the workflows package.** Knowing when to reach for each one is half the battle.

| Verb | Preprocessor input | When to use |
|------|--------------------|-------------|
| `add_recipe()` | A `recipe()` object with steps | Anything beyond a one-line formula (impute, scale, encode, PCA) |
| `add_formula()` | A model formula like `y ~ x1 + x2` | Lightweight workflow, no transformation needed |
| `add_variables()` | Outcome and predictor column names | Engines that refuse formulas (XGBoost matrix input) |

Pick `add_recipe()` whenever the preprocessing must be re-estimated on each resample, which is most production cases.

## Build workflows with add_recipe(): four examples

**Every example below uses the built-in mtcars and airquality datasets** so the focus stays on the workflow rather than on the data.

### Example 1: Normalize numeric predictors

**Centering and scaling predictors is the canonical use case for a recipe.** It takes two recipe steps and one `add_recipe()` call.

```r title="Normalize then fit linear regression"
rec_norm <- recipe(mpg ~ wt + hp + disp, data = mtcars) |>
  step_normalize(all_numeric_predictors())

lin_spec <- linear_reg() |> set_engine("lm")

wf_norm <- workflow() |>
  add_recipe(rec_norm) |>
  add_model(lin_spec)

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

The workflow now stores both the recipe and the spec. Calling `fit(wf_norm, data = mtcars)` first estimates the means and standard deviations of `wt`, `hp`, and `disp`, applies the standardization, then fits the linear regression on the transformed columns.

### Example 2: One-hot encode a categorical predictor

**Recipes shines when you mix transformation types.** Here `step_dummy()` converts the factor `cyl` into indicator columns before the model sees them.

```r title="Dummy encode then logistic regression"
mt <- mtcars |>
  mutate(cyl = factor(cyl),
                am  = factor(am))

rec_dummy <- recipe(am ~ mpg + wt + cyl, data = mt) |>
  step_dummy(all_nominal_predictors())

log_spec <- logistic_reg() |> set_engine("glm")

wf_dummy <- workflow() |>
  add_recipe(rec_dummy) |>
  add_model(log_spec)

wf_dummy_fit <- fit(wf_dummy, data = mt)
predict(wf_dummy_fit, new_data = head(mt))
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

Notice that `predict()` works on the raw `mt` data with `cyl` still a factor. The workflow re-applies `step_dummy()` automatically; you never call `bake()` by hand.

### Example 3: Impute missing values, then dummy encode

**Recipe steps run in the order you declare them.** This matters for imputation: impute before any step that fails on `NA`, then encode.

```r title="Impute, encode, then linear regression"
aq <- airquality |>
  mutate(Month = factor(Month))

rec_full <- recipe(Ozone ~ Solar.R + Wind + Temp + Month, data = aq) |>
  step_impute_median(all_numeric_predictors()) |>
  step_dummy(all_nominal_predictors())

wf_full <- workflow() |>
  add_recipe(rec_full) |>
  add_model(linear_reg() |> set_engine("lm"))

wf_full_fit <- fit(wf_full, data = aq)

extract_recipe(wf_full_fit) |>
  tidy(number = 1)
#> # A tibble: 3 x 3
#>   terms     value model
#>   <chr>     <dbl> <chr>
#> 1 Solar.R  205.   impute_median
#> 2 Wind       9.96 impute_median
#> 3 Temp      79.0  impute_median
```

`extract_recipe()` pulls the trained recipe back out of the fitted workflow, and `tidy()` shows the learned medians. Those medians were computed only from rows passed to `fit()`, so they are safe to use under cross-validation.

### Example 4: add_recipe() vs the workflow constructor

**The constructor argument and the verb form behave identically.** Prefer the verb form because it reads like a pipeline.

```r title="Two ways to wire the same workflow"
rec_min <- recipe(mpg ~ wt, data = mtcars)
spec    <- linear_reg() |> set_engine("lm")

wf_a <- workflow() |>
  add_recipe(rec_min) |>
  add_model(spec)

wf_b <- workflow(preprocessor = rec_min, spec = spec)

identical(wf_a$pre$actions, wf_b$pre$actions)
#> [1] TRUE
```

Both objects fit and predict the same way. The verb form is what every tidymodels vignette uses, and it scales better when you reach for `update_recipe()` or `update_model()` later.

## Common pitfalls

**A workflow holds exactly one preprocessor and one untrained recipe.** These are the three errors you will hit while learning `add_recipe()`.

```r title="Three errors and their fixes"
# Pitfall 1: two preprocessors in one workflow
workflow() |>
  add_recipe(rec_norm) |>
  add_formula(mpg ~ wt + hp)
#> Error in `add_formula()`: A recipe action has already been added.
#> Fix: pick one. add_recipe() OR add_formula(), never both.

# Pitfall 2: passing a prepped recipe
rec_prepped <- prep(rec_norm)
workflow() |>
  add_recipe(rec_prepped)
#> Error in `add_recipe()`: `recipe` must not be a trained recipe.
#> Fix: pass the unprepped recipe; the workflow preps it for you.

# Pitfall 3: outcome name in recipe disagrees with data
rec_typo <- recipe(MPG ~ wt, data = mtcars)
workflow() |> add_recipe(rec_typo) |> add_model(spec) |> fit(mtcars)
#> Error in `fit()`: object 'MPG' not found
#> Fix: use lowercase mpg, matching the column in mtcars.
```

[WARNING]
**Never pass a prepped recipe to add_recipe().** The workflow re-estimates the recipe inside `fit()` on each resample. Passing a prepped recipe defeats leakage protection and is rejected outright by modern versions of workflows.

## Try it yourself

**Try it:** Build a workflow that uses a recipe to apply `step_log()` to `Sepal.Length`, dummy-encodes `Species`, then fits a linear regression of `Petal.Length`. Save the fitted workflow to `ex_fit`.

```r title="Your turn: log transform with add_recipe"
# Try it: log transform then linear regression
library(tidymodels)

ex_rec <- # your code here

ex_fit <- # your code here

predict(ex_fit, new_data = head(iris))
#> Expected: tibble with 6 .pred values around 1.3 to 1.5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_rec <- recipe(Petal.Length ~ Sepal.Length + Species, data = iris) |>
  step_log(Sepal.Length) |>
  step_dummy(all_nominal_predictors())

ex_fit <- workflow() |>
  add_recipe(ex_rec) |>
  add_model(linear_reg() |> set_engine("lm")) |>
  fit(data = iris)

predict(ex_fit, new_data = head(iris))
#> # A tibble: 6 x 1
#>   .pred
#>   <dbl>
#> 1  1.42
#> 2  1.39
#> 3  1.35
#> 4  1.37
#> 5  1.42
#> 6  1.50
```

**Explanation:** `step_log()` applies a natural-log transform to the named column. `step_dummy()` then one-hot encodes `Species` because linear regression cannot consume a factor directly. Wrapping both steps in `add_recipe()` ensures `predict()` re-applies them to new rows automatically.

</details>

## Related tidymodels functions

**add_recipe() rarely appears alone.** These are the functions you will use alongside it.

- `workflow()` creates the empty workflow that `add_recipe()` updates.
- `recipe()` builds the recipes object that `add_recipe()` expects.
- `add_model()` attaches the parsnip spec that pairs with the recipe.
- `update_recipe()` swaps the recipe inside an existing workflow.
- `extract_recipe()` pulls the trained recipe out of a fitted workflow.
- `remove_recipe()` detaches the recipe entirely.

See the [workflows package reference](https://workflows.tidymodels.org/reference/) for the full verb family.

## FAQ

**Does add_recipe() prep the recipe?**

No. `add_recipe()` only stores the recipe in the workflow's preprocessor slot. Estimation happens inside `fit()`, `fit_resamples()`, or `tune_grid()`, which call `prep()` internally on the training data of each split. This is intentional: it is what gives the workflow its leakage-safe behaviour across resamples and why the workflow object is the right unit of work for cross-validation.

**Can I use add_recipe() and add_formula() in the same workflow?**

No. A workflow can hold only one preprocessor. Stacking `add_recipe()` and `add_formula()` raises an error. Choose `add_recipe()` when you want named transformation steps and want preprocessing to be re-estimated on each resample. Choose `add_formula()` when a one-line model formula is enough and you need no preprocessing.

**How do I inspect what the recipe did inside the fitted workflow?**

Call `extract_recipe(wf_fit)` on the fitted workflow. The returned recipe is trained, so `tidy()` on individual steps reveals the learned values, such as means from `step_normalize()` or medians from `step_impute_median()`. Pass `estimated = FALSE` if you want the original, untrained recipe back instead of the fitted one.

**Is add_recipe() different from recipes::recipe()?**

Yes. `recipe()` constructs the recipes object. `add_recipe()` attaches that object to a workflow. The two functions live in different packages (recipes and workflows) and serve different roles. You always build the recipe first, then attach it to a workflow with `add_recipe()` before adding a model spec.

**How do I update a recipe attached to a workflow?**

Use `update_recipe(wf, new_recipe)`. This replaces the existing recipe without touching the model spec or refitting anything. Calling `add_recipe()` a second time on the same workflow fails because the preprocessor slot is already filled, so the workflows team built `update_recipe()` as the explicit replacement verb.
