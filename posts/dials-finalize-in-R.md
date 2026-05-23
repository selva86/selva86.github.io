---
title: "dials finalize() in R: Set Tuning Parameter Ranges From Data"
slug: dials-finalize-in-R
description: "Use dials finalize() in R to fill unknown tidymodels tuning ranges like mtry from training data. Syntax, workflow examples, recipe handling, pitfalls, FAQ."
keywords: "dials finalize, finalize function R, dials finalize examples, R finalize tuning parameters, dials finalize mtry, tidymodels finalize parameters, finalize parameter ranges"
mathjax: false
webr: true
date: 2026-05-23
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "finalize()|dials finalize|dials::finalize()|finalize tuning parameters|finalize parameter ranges"
auto_link_case_sensitive: true
target_keyword: dials finalize
sibling_block_enabled: true
difficulty: Beginner
---

# dials finalize() in R: Set Tuning Parameter Ranges From Data

<p class="lead">The dials finalize() function in R substitutes data-dependent bounds (mostly the upper bound of mtry) into a parameter object or parameter set, turning unknown ranges into concrete numeric ranges that grid_regular() and tune_grid() can actually sample.</p>

[QUICK ANSWER]
finalize(mtry(), train_x)                       # single parameter, raw predictors
finalize(params, train_x)                       # full parameter set
params |> finalize(train |> select(-outcome))   # drop outcome first
finalize(params, bake(prep(rec), new_data = NULL)) # post-recipe column count
extract_parameter_set_dials(wf) |> finalize(train) # straight from a workflow
finalize(mtry_long(), train_x)                  # log-scaled mtry variant
update(params, mtry = mtry(c(2L, 8L)))          # skip finalize with an explicit range

[DECISION TREE: Is finalize() the right tool?]
- fill an unknown upper bound from training data: finalize(params, train_x)
- set an explicit numeric range without touching data: update(params, mtry = mtry(c(1L, 10L)))
- inspect what still needs finalization: extract_parameter_set_dials(wf)
- pull tuning ranges out of a fitted workflow: extract_parameter_dials(fit)
- swap finalize for a portion-based knob: mtry_prop()
- finalize one parameter set inside a workflow: finalize_workflow(wf, best_params)
- finalize many workflows at once: workflow_map() with control_grid()

## What finalize() does in one sentence

**finalize() resolves data-dependent endpoints in a dials parameter object.** Most tuning parameters ship with sensible defaults baked in, but mtry, finalize_tree, and a handful of others carry an `unknown()` upper bound because their maximum depends on the column count of the predictor matrix. finalize() takes the parameter (or a whole parameters set) plus a data frame, calls each parameter's stored finalizer, and returns a copy with the unknowns replaced by integers.

The function is generic. It dispatches on parameter type, so `finalize.mtry()` reads `ncol(x)`, `finalize.num_comp()` reads the same column count for PCA, and parameters with no finalizer pass through unchanged. The output is the same shape as the input, which means you can chain it inside a pipe without restructuring downstream code.

## finalize() syntax and arguments

**The signature is a method with two required arguments.**

```r title="finalize signature"
library(dials)
finalize(x, ...)
# S3 generic; methods include:
#   finalize.parameters(x, x_dat = NULL, force = TRUE, ...)
#   finalize.list(x, x_dat = NULL, force = TRUE, ...)
#   finalize.param(x, x_dat = NULL, force = TRUE, ...)
```

| Argument | Description |
|---|---|
| `x` | A dials parameter object, a list of parameters, or a `parameters` set built by `extract_parameter_set_dials()`. |
| `x_dat` | The predictor data used to compute the finalized bound. Pass predictors only, not the outcome column. |
| `force` | If TRUE (default), finalize even parameters whose bounds are already known. Set FALSE to only fill unknowns. |

The return type matches the input: a `param` for a single parameter, a `parameters` tibble for a set. Both print themselves nicely so you can confirm the unknown markers are gone.

## Examples by use case

**Most calls flow inside a tunable workflow rather than against a bare parameter object.**

```r title="Finalize a single parameter object"
library(dials)
data(ames, package = "modeldata")
ames <- transform(ames, Sale_Price = log10(Sale_Price))
set.seed(42)
train <- ames[sample(nrow(ames), 1500), ]

mtry_param <- mtry()
mtry_param
#> # Randomly Selected Predictors (quantitative)
#> Range: [1, ?]

train_x <- subset(train, select = c(Gr_Liv_Area, Year_Built, Bldg_Type, Neighborhood, Lot_Area))
mtry_finalized <- finalize(mtry_param, train_x)
mtry_finalized
#> # Randomly Selected Predictors (quantitative)
#> Range: [1, 5]
```

The upper bound flips from `?` to the column count of the predictor frame. Inside a real pipeline you almost never call finalize on a single parameter; you call it on the full set pulled from a workflow.

```r title="Finalize a parameter set from a workflow"
library(tidymodels)

rf_spec <- rand_forest(mtry = tune(), trees = 500, min_n = tune()) |>
  set_engine("ranger") |>
  set_mode("regression")

wf <- workflow() |>
  add_formula(Sale_Price ~ Gr_Liv_Area + Year_Built + Bldg_Type + Neighborhood + Lot_Area) |>
  add_model(rf_spec)

params <- extract_parameter_set_dials(wf)
params
#> Collection of 2 parameters for tuning
#>  identifier  type    object
#>        mtry  mtry nparam[?]
#>       min_n min_n nparam[+]
#> Parameters needing finalization:
#>    Randomly Selected Predictors ('mtry')

params <- params |> finalize(train)
params
#> Collection of 2 parameters for tuning
#>  identifier  type    object
#>        mtry  mtry nparam[+]
#>       min_n min_n nparam[+]
```

The `nparam[?]` marker becomes `nparam[+]`, which is the signal `grid_regular()` and `tune_grid()` need before they will run.

```r title="Finalize after a recipe with step_dummy"
rec <- recipe(Sale_Price ~ Gr_Liv_Area + Year_Built + Bldg_Type + Neighborhood, data = train) |>
  step_dummy(all_nominal_predictors())

wf2 <- workflow() |>
  add_recipe(rec) |>
  add_model(rf_spec)

train_baked <- bake(prep(rec), new_data = NULL) |>
  subset(select = -Sale_Price)

params2 <- extract_parameter_set_dials(wf2) |>
  finalize(train_baked)
params2
#> Collection of 2 parameters for tuning
#>  identifier  type    object
#>        mtry  mtry nparam[+]
#>       min_n min_n nparam[+]
```

Bldg_Type and Neighborhood expand into many dummy columns after prep, so the finalized upper bound is much larger than the four raw predictor columns. The grid will now sample mtry across the post-prep predictor space, which is what the model actually sees.

[KEY INSIGHT]
**finalize() reads ncol(x) at call time, not at fit time.** Whatever predictor frame you hand in determines the upper bound forever. Pass the same data you expect the model to see, including post-recipe columns when a recipe is in the workflow.

## finalize() versus update() and explicit ranges

**Pick by who owns the bound: the data or the analyst.**

| Approach | When to reach for it | Trade-off |
|---|---|---|
| `finalize(params, train_x)` | The data dictates the bound (mtry, num_comp). | Couples the search space to the training set; re-finalize per resample if needed. |
| `update(params, mtry = mtry(c(2L, 10L)))` | You want a tighter or wider bound than the data implies. | Explicit and reproducible, but ignores data-driven information. |
| `mtry_prop()` instead of `mtry()` | You want portability across datasets of varying width. | No finalize needed, but the search space is on `[0, 1]` rather than counts. |

The three are not mutually exclusive. A common pattern is to finalize first to get a sane upper bound, then call update() to shrink the range when you have prior knowledge that the optimum sits in a smaller window.

## Common pitfalls

**Four mistakes account for most failed tune_grid() calls that involve finalize.**

1. **Passing the full data frame with the outcome column.** finalize uses ncol(x), so an outcome column inflates the mtry upper bound by one. Pass predictors only: `train |> select(-Sale_Price)` or a recipe-baked frame.
2. **Finalizing before adding the recipe to the workflow.** If the recipe uses step_dummy() or step_pca(), the prepped column count differs from the raw one. Either extract the parameter set after `add_recipe()` and finalize against the baked predictors, or finalize after `extract_parameter_set_dials(wf)` so the workflow already carries the recipe.
3. **Setting force = FALSE without realizing what is being skipped.** With `force = FALSE`, finalize touches only parameters that report `is_unknown()`. If a previous step manually narrowed the range, that narrowed range is preserved, which can silently cap the search.
4. **Forgetting that finalize is a method, not a function on a tibble.** `finalize(my_grid, train)` errors because finalize dispatches on parameter or parameters classes, not on tibbles. Build the grid AFTER finalize: `params |> finalize(train) |> grid_regular(levels = 5)`.

[WARNING]
**Re-finalizing inside a resampling loop is rare but valid.** When each fold has a different recipe (for example, recipe-tuned column-selection steps), the post-prep column count differs per fold. tune_grid handles this internally for built-in recipes, but custom workflows may need an explicit finalize step inside the resampling function. Watch the `nparam[?]` marker; if it survives extract_parameter_set_dials(), finalize again.

[NOTE]
**finalize is package-aware.** Parameters from extension packages (themis, embed, recipeselectors) carry their own finalize methods. Updating dials alone does not retrofit new finalizers onto third-party parameters; update the source package when a new finalize behavior is needed.

## Try it yourself

**Try it:** Build a tunable random forest on the iris dataset, extract its parameter set from a workflow, finalize mtry against the four predictor columns, and produce a 6-row regular grid over mtry and min_n.

```r title="Your turn: finalize on iris"
# Try it: finalize on iris
library(tidymodels)

ex_spec <- rand_forest(mtry = tune(), trees = 200, min_n = tune()) |>
  set_engine("ranger") |>
  set_mode("classification")

ex_wf <- workflow() |>
  add_formula(Species ~ .) |>
  add_model(ex_spec)

ex_params <- # your code here

ex_grid <- # your code here

ex_grid
#> Expected: a 6-row tibble with columns mtry and min_n
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_params <- extract_parameter_set_dials(ex_wf) |>
  finalize(iris |> subset(select = -Species))

ex_grid <- grid_regular(ex_params, levels = c(mtry = 3, min_n = 2))

ex_grid
#> # A tibble: 6 x 2
#>    mtry min_n
#>   <int> <int>
#> 1     1     2
#> 2     2     2
#> 3     4     2
#> 4     1    40
#> 5     2    40
#> 6     4    40
```

**Explanation:** iris has four predictor columns once Species is dropped. finalize sets the mtry upper bound to 4. grid_regular then spreads three points across mtry and two across min_n for a 3 by 2 grid.

</details>

## Related tidymodels functions

**finalize sits at the boundary between parameter specification and grid construction.**

- `extract_parameter_set_dials()` to pull every tunable parameter from a workflow at once.
- `mtry()`, `mtry_prop()`, `mtry_long()` for the three variants of the predictor-count knob.
- `update()` to override one parameter range inside a set without rebuilding the spec.
- `grid_regular()`, `grid_random()`, `grid_space_filling()` to turn the finalized set into candidate tibbles.
- `tune_grid()`, `tune_bayes()` to actually sample and fit each candidate.
- `finalize_workflow()` and `finalize_model()` to lock in the BEST hyperparameters after tuning (different verb, different stage).

External reference: the official dials documentation at [dials.tidymodels.org/reference/finalize.html](https://dials.tidymodels.org/reference/finalize.html).

## FAQ

**What is the difference between finalize() and finalize_workflow()?**

They operate at opposite ends of the tuning pipeline. finalize() runs BEFORE tuning: it fills data-dependent bounds in a parameter set so grid construction succeeds. finalize_workflow() runs AFTER tuning: it substitutes the chosen hyperparameter values (typically `select_best()` output) back into the workflow so it can be fit on the full training set. Same root word, different jobs. Mistaking one for the other is a common beginner error.

**Does finalize() change my data?**

No. finalize() reads ncol(x) and any other shape statistics it needs, then writes results into the parameter object. The data frame you pass is not modified, not stored inside the parameters, and not referenced again. You can safely pass a temporary slice or even a `head(train, 100)` since only the column count matters for mtry-style parameters.

**Why does extract_parameter_set_dials() still show nparam[?] after I added a recipe?**

Because extract_parameter_set_dials() collects parameter objects, not their finalized forms. The recipe defines what the predictors will look like at fit time, but the dials parameters do not auto-finalize when a recipe is attached. You still need an explicit finalize() call against the post-prep data or against the raw training frame if the recipe does not change the predictor count.

**Can I finalize a parameter that does not need it?**

Yes, and it is safe. The default finalize methods for already-known parameters are no-ops; they return the parameter unchanged. With force = TRUE (the default), even known parameters pass through finalize, which means you can call `finalize(params, train)` on any parameter set without first checking which ones are unknown. The function is designed to be idempotent on already-finalized inputs.

**How do I finalize multiple workflows in a workflowset?**

Use `option_add(param_info = ...)` on the workflow_set, passing a finalized parameter set per workflow, or rely on workflow_map() with `tune_grid` and a control object that triggers internal finalization. For most cases, building each workflow individually, calling extract_parameter_set_dials() then finalize(), and feeding the finalized set into the workflowset via option_add keeps the search space explicit and reproducible.
