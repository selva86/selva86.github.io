---
title: "dials update() Params in R: Set Custom Tuning Ranges"
slug: dials-update-params-in-R
description: "Use dials update() in R to set custom tuning ranges inside a tidymodels parameter set. Syntax, multi-parameter updates, update vs finalize, pitfalls, FAQ."
keywords: "dials update params, dials update parameters, update parameter range tidymodels, tidymodels update tuning grid, dials update function R, dials update mtry"
mathjax: false
webr: true
date: 2026-05-23
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "dials::update()|dials update params|update.parameters()|update tuning parameters|dials update parameters"
auto_link_case_sensitive: true
target_keyword: dials update params
sibling_block_enabled: true
difficulty: Beginner
---

# dials update() Params in R: Set Custom Tuning Ranges

<p class="lead">The dials update() function in R replaces one or more parameter objects inside a tidymodels parameters set, letting you tighten, widen, or swap the tuning ranges that grid_regular() and tune_grid() will sample from later in the pipeline.</p>

[QUICK ANSWER]
update(params, trees = trees(c(100, 500)))                       # set one range
update(params, mtry = mtry(c(1L, 10L)), min_n = min_n(c(2, 40))) # multiple at once
params |> update(learn_rate = learn_rate(c(-3, -1)))             # log10-scale knob
update(params, !!!list(trees = trees(c(50, 200))))               # splice from a list
update(params, mtry = mtry_prop(c(0.2, 0.9)))                    # swap to a portion knob
update(params, mtry = mtry(c(1L, ncol(train_x))))                # manual finalize
params |> update(penalty = penalty(c(-4, 0)))                    # widen a glmnet range

[DECISION TREE: Is dials::update() the right tool?]
- set a custom numeric range on a known parameter: update(params, mtry = mtry(c(1L, 10L)))
- the range depends on data (mtry, num_comp): finalize(params, train_x)
- inspect ranges already inside a set: extract_parameter_set_dials(wf)
- check if any parameter still has an unknown bound: has_unknowns(params)
- swap one parameter object for a different family member: update(params, mtry = mtry_prop())
- build the grid from the updated set: grid_regular(params, levels = 5)
- override the best params back into a fitted workflow: finalize_workflow(wf, best)

## What dials::update() does in one sentence

**update() replaces named parameter objects inside a parameters set with new ones you supply.** Each tidymodels tunable parameter is itself a small object carrying a type, a default range, and metadata. The parameters set is a tibble of those objects, indexed by the parameter id. update() takes the set plus a series of `id = new_param_object` arguments, swaps the matching rows, and returns a new set with the replacements applied.

The method is `update.parameters()`. It dispatches on the parameters class so the same call signature works whether you built the set by hand with `parameters(list(mtry(), trees()))` or pulled it from a workflow with `extract_parameter_set_dials()`. The set is immutable; update() always returns a new object rather than mutating in place.

## dials::update() syntax and arguments

**The signature accepts a parameters set plus named replacements.**

```r title="update signature"
library(dials)
# S3 method for class 'parameters'
update(object, ...)
```

| Argument | Description |
|---|---|
| `object` | A `parameters` set built by `parameters()` or `extract_parameter_set_dials()`. |
| `...` | Named arguments where each name matches a parameter id in `object` and each value is a new dials parameter object (for example `mtry(c(1L, 10L))`). |

The names in `...` must match parameter identifiers exactly (case-sensitive). The values must be valid dials parameter objects, not raw vectors or numeric ranges. Passing `mtry = c(1, 10)` errors; the correct form is `mtry = mtry(c(1L, 10L))`.

## Examples by use case

**Most update() calls happen after extracting parameters from a workflow.**

```r title="Build a parameters set and update one range"
library(dials)

params <- parameters(list(mtry(), trees(), min_n()))
params
#> Collection of 3 parameters for tuning
#> 
#>  identifier  type    object
#>        mtry  mtry nparam[?]
#>       trees trees nparam[+]
#>       min_n min_n nparam[+]
#> 
#> Parameters needing finalization:
#>    # Randomly Selected Predictors ('mtry')

params <- update(params, trees = trees(c(100, 500)))
extract_parameter_dials(params, "trees")
#> # Trees (quantitative)
#> Range: [100, 500]
```

The default trees range is `[1, 2000]`, which is too wide for a small dataset. update() narrows it to a sensible window without rebuilding the rest of the set.

```r title="Update multiple parameters in one call"
params <- update(params,
                 trees = trees(c(50, 1000)),
                 min_n = min_n(c(2, 40)))

extract_parameter_dials(params, "trees")
#> # Trees (quantitative)
#> Range: [50, 1000]
extract_parameter_dials(params, "min_n")
#> # Minimal Node Size (quantitative)
#> Range: [2, 40]
```

Pass as many `id = value` pairs as needed. The arguments do not need to cover every parameter in the set; rows not named in the call are left untouched.

```r title="Update from a workflow-extracted set"
library(tidymodels)
data(ames, package = "modeldata")
set.seed(42)
train <- ames[sample(nrow(ames), 1500), ]

rf_spec <- rand_forest(mtry = tune(), trees = tune(), min_n = tune()) |>
  set_engine("ranger") |>
  set_mode("regression")

wf <- workflow() |>
  add_formula(Sale_Price ~ Gr_Liv_Area + Year_Built + Lot_Area + Bldg_Type) |>
  add_model(rf_spec)

params <- extract_parameter_set_dials(wf) |>
  update(mtry  = mtry(c(1L, 4L)),
         trees = trees(c(200, 600)),
         min_n = min_n(c(5, 30)))

params
#> Collection of 3 parameters for tuning
#>  identifier  type    object
#>        mtry  mtry nparam[+]
#>       trees trees nparam[+]
#>       min_n min_n nparam[+]
```

All three ranges now carry explicit bounds, including mtry, so `grid_regular(params, levels = 4)` will run without an additional finalize() step. The pattern of "extract, then update" is the canonical tidymodels recipe for overriding default search spaces.

[KEY INSIGHT]
**update() and finalize() are siblings, not substitutes.** finalize() reads the column count from training data and fills `nparam[?]` markers. update() replaces a parameter object outright with one you specify. Reach for update() when you already know the range; reach for finalize() when the data has to tell you the range. They compose: pipe finalize() first, then update() to tighten a specific bound.

## update() versus finalize() and direct grid edits

**Choose by who owns the bound and whether you want a search-space override.**

| Approach | Best when | Trade-off |
|---|---|---|
| `update(params, mtry = mtry(c(1L, 8L)))` | You know the exact range you want to search. | Explicit and reproducible; ignores data shape. |
| `finalize(params, train_x)` | The upper bound depends on the predictor column count. | Couples search space to a specific training set. |
| `mtry_prop()` as a replacement parameter | You want portability across datasets of varying width. | Range is on `[0, 1]`; less intuitive to interpret. |
| Edit the candidate tibble directly | A handful of bespoke candidates, not a range. | Loses the dials metadata; grid functions stop working. |

A common pipeline chains the first two: finalize() to handle data-driven bounds, then update() to tighten any range where you have prior knowledge that the optimum sits in a narrower window.

## Common pitfalls

**Three mistakes account for most update() errors.**

1. **Passing a raw vector instead of a parameter constructor.** `update(params, mtry = c(1, 10))` errors with "must be a 'param' object". Always wrap in the constructor: `update(params, mtry = mtry(c(1L, 10L)))`. The constructor carries the type, transformer, and label that downstream grid functions read.
2. **Misspelling the parameter id.** `update(params, mtry = mtry(c(1L, 10L)))` works, but `update(params, m_try = mtry(c(1L, 10L)))` silently adds nothing because no row matches. Check ids with `params$id` first, or use `extract_parameter_dials(params, "mtry")` to confirm the name.
3. **Updating a log-scaled parameter with raw values.** `learn_rate` lives on `log10` scale by default, so `update(params, learn_rate = learn_rate(c(0.001, 0.1)))` mistakenly searches `[0.001, 0.1]` on the log axis (a tiny window near 1). Pass log10 bounds instead: `learn_rate = learn_rate(c(-3, -1))` searches `[1e-3, 1e-1]` on the natural scale.

[WARNING]
**update() does not check that your range is reachable.** Setting `mtry = mtry(c(1L, 100L))` on a 10-column predictor matrix silently produces an unreachable upper bound; tune_grid will fit invalid candidates and emit warnings inside the resampling loop, not at update time. Always cross-check against the actual column count.

[NOTE]
**update() lives on parameters sets, not on workflows.** To swap a tuning range inside a workflow, extract the set first with `extract_parameter_set_dials(wf)`, update it, then pass the updated set into `tune_grid(wf, ..., param_info = params)`. The workflow itself stays unchanged; tune_grid consumes the updated set as a separate argument.

## Try it yourself

**Try it:** Build a tunable random forest on iris, extract its parameter set, update mtry to `[1L, 3L]` and min_n to `[5, 20]`, then build a regular grid with 3 levels per parameter.

```r title="Your turn: update on iris"
# Try it: update iris params
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
#> Expected: a 9-row tibble with columns mtry and min_n
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_params <- extract_parameter_set_dials(ex_wf) |>
  update(mtry  = mtry(c(1L, 3L)),
         min_n = min_n(c(5, 20)))

ex_grid <- grid_regular(ex_params, levels = 3)

ex_grid
#> # A tibble: 9 x 2
#>    mtry min_n
#>   <int> <int>
#> 1     1     5
#> 2     2     5
#> 3     3     5
#> 4     1    12
#> 5     2    12
#> 6     3    12
#> 7     1    20
#> 8     2    20
#> 9     3    20
```

**Explanation:** update() swaps the mtry and min_n parameter rows with explicit ranges, so the set no longer carries any unknown bounds. grid_regular() then crosses three levels of each, producing a 3 by 3 grid.

</details>

## Related tidymodels functions

**update() sits between parameter inspection and grid construction.**

- `extract_parameter_set_dials()` pulls every tunable parameter from a workflow or model spec.
- `finalize()` fills data-dependent bounds (the companion verb when the data sets the range).
- `parameters()` builds a set from a list of parameter objects when no workflow is involved.
- `mtry()`, `trees()`, `min_n()`, `learn_rate()`, `penalty()` are common parameter constructors you pass into update().
- `grid_regular()`, `grid_random()`, `grid_space_filling()` consume the updated set to produce candidate tibbles.
- `tune_grid()` and `tune_bayes()` accept the updated set via `param_info` to constrain the search.

External reference: the dials documentation at [dials.tidymodels.org/reference/update.parameters.html](https://dials.tidymodels.org/reference/update.parameters.html).

## FAQ

**What is the difference between dials::update() and update_recipe()?**

They touch different layers of the tidymodels stack. dials::update() modifies a parameters set: the tuning ranges that grid functions will sample. update_recipe() is from the workflows package and swaps the entire recipe inside a workflow object. Same English verb, different objects. Use dials::update() when you want a tighter learn_rate search; use update_recipe() when you want to add or remove preprocessing steps without rebuilding the workflow from scratch.

**Can I use dials::update() on a single parameter outside a set?**

No. update.parameter() is not part of the dials API. To change the range of a standalone parameter, just call the constructor again with the new range: `my_param <- mtry(c(1L, 10L))`. update() only makes sense for the parameters tibble because its job is to replace a named row inside the set; a single object has no named index to match against.

**Why does my update() call appear to do nothing?**

Three causes account for almost every silent no-op. First, the parameter id does not match a row in the set (typo or wrong case). Second, you forgot to assign the result back, since update() returns a new set rather than mutating in place: write `params <- update(params, ...)`. Third, you updated a set that you then never passed into `tune_grid(..., param_info = params)`, so the tuner used the workflow's default ranges. Print the set after the update call to confirm the change took effect.

**How do I update only a subset of parameters in a large set?**

Name only the ones you want to change. update() leaves any parameter id not appearing in `...` untouched, so `update(params, trees = trees(c(50, 200)))` modifies the trees row and keeps mtry, min_n, learn_rate, and any others at their previous ranges. For programmatic updates over a variable list of parameters, build a named list and splice it with `!!!`: `update(params, !!!my_updates)`.

**Does dials::update() work with mtry_prop or mtry_long?**

Yes. update() accepts any dials parameter object, including mtry variants. To swap from integer mtry to a portion-based mtry_prop, write `update(params, mtry = mtry_prop(c(0.1, 0.8)))`. The id stays "mtry", but the underlying object changes type, so downstream grid functions sample on `[0, 1]` instead of counts. This is the canonical pattern for portable hyperparameter searches across datasets of varying width.
