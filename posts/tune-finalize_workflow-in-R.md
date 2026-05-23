---
title: "tune finalize_workflow() in R: Lock In Best Hyperparameters"
slug: tune-finalize_workflow-in-R
description: "tune finalize_workflow() in R substitutes tuned parameter values into a tunable workflow, producing a fittable pipeline ready for last_fit() or fit()."
keywords: "tune finalize_workflow, finalize_workflow function R, tune finalize_workflow examples, finalize_workflow tidymodels, R hyperparameter tuning finalize, tune package finalize_workflow, finalize_model vs finalize_workflow"
mathjax: false
webr: true
date: 2026-05-23
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "finalize_workflow()|tune finalize_workflow|tune::finalize_workflow()|finalize workflow with tuned parameters|finalize tuned workflow"
auto_link_case_sensitive: true
target_keyword: tune finalize_workflow
sibling_block_enabled: true
difficulty: Beginner
---

# tune finalize_workflow() in R: Lock In Best Hyperparameters

<p class="lead">The tune <code>finalize_workflow()</code> function in R takes a workflow that still contains <code>tune()</code> placeholders and substitutes them with the winning parameter values returned by <code>select_best()</code>. The output is a regular workflow ready for <code>last_fit()</code> or a final <code>fit()</code> on the full training data.</p>

[QUICK ANSWER]
finalize_workflow(wf, best_params)                       # standard finalization
finalize_workflow(wf, select_best(tune_res, "rmse"))     # inline pick + finalize
finalize_workflow(wf, tibble(mtry = 4, trees = 500))     # manual parameter row
finalize_workflow(wf, best_params) |> last_fit(split)    # finalize and last_fit
finalize_workflow(wf, best_params) |> fit(data = train)  # finalize and full fit
finalize_model(spec, best_params)                        # bare spec sibling

[DECISION TREE: Is finalize_workflow() the right tool?]
- finalize a tuned workflow with best params: finalize_workflow(wf, best_params)
- finalize a bare model spec (no recipe): finalize_model(spec, best_params)
- finalize a bare recipe (no model): finalize_recipe(rec, best_params)
- pick the best params first: select_best(tune_res, metric = "rmse")
- train and score the test split in one go: last_fit(final_wf, split)
- train on the full training set only: fit(final_wf, data = train)

## What finalize_workflow() does in one sentence

**finalize_workflow() swaps every tune() placeholder for a concrete value.** Hand it a workflow that was built with `tune()` markers on model or recipe arguments, plus a one-row tibble of parameter values from `select_best()`, and you get back the same workflow with those `tune()` markers replaced by the picked numbers. The returned workflow is fully specified, so `fit()` and `last_fit()` accept it without any further setup.

The function does not retrain or score anything by itself. It is a parameter substitution step that sits between tuning and the final fit, separating model selection from model training.

[KEY INSIGHT]
**Tuning produces parameters; finalization produces a usable workflow.** A tune_results object is a leaderboard, not a model. `finalize_workflow()` is the bridge that turns the winning row into a workflow you can train. Skip this step and `last_fit()` errors because the workflow still contains unresolved `tune()` calls.

## finalize_workflow() syntax and arguments

**finalize_workflow() takes exactly two arguments and returns a workflow.** Both arguments are positional and required.

```r title="The finalize_workflow argument skeleton"
finalize_workflow(
  x,           # a workflow containing tune() placeholders
  parameters   # a 1-row tibble of parameter values (from select_best)
)
```

The `x` argument is the tunable workflow you originally passed to `tune_grid()` or `tune_bayes()`. The `parameters` argument is a single-row tibble whose column names match the tunable arguments inside the workflow. Calling `select_best()` returns exactly this shape, so the two functions chain naturally.

For a bare model spec (no preprocessor wrapped in a workflow), reach for `finalize_model()`. For a bare recipe (no model), use `finalize_recipe()`. The call shape is identical; only the target object changes.

## Use finalize_workflow() in four scenarios

**Every example below runs on built-in R data so the tuning, selection, and finalization chain reproduces in one session.** A small random forest on `mtcars` keeps each tune fast.

### Example 1: Finalize a random forest workflow with select_best()

**Tune mtry and trees, pick the best row, then finalize the workflow.** The result is a workflow with concrete numbers instead of `tune()` placeholders.

```r title="Tune, pick, and finalize a random forest"
library(tidymodels)
set.seed(42)

cars_split <- initial_split(mtcars, prop = 0.75)
cars_train <- training(cars_split)

rf_spec <- rand_forest(mtry = tune(), trees = tune()) |>
  set_engine("ranger") |>
  set_mode("regression")

rf_wf <- workflow() |>
  add_formula(mpg ~ .) |>
  add_model(rf_spec)

folds   <- vfold_cv(cars_train, v = 3)
rf_grid <- expand.grid(mtry = c(2, 4, 6), trees = c(100, 500))

rf_res <- tune_grid(rf_wf, resamples = folds, grid = rf_grid,
                    metrics = metric_set(rmse, rsq))

best_rf  <- select_best(rf_res, metric = "rmse")
final_wf <- finalize_workflow(rf_wf, best_rf)

final_wf
#> == Workflow ============================================================
#> Preprocessor: Formula
#> Model: rand_forest()
#>
#> -- Preprocessor --------------------------------------------------------
#> mpg ~ .
#>
#> -- Model ---------------------------------------------------------------
#> Random Forest Model Specification (regression)
#>
#> Main Arguments:
#>   mtry = 4
#>   trees = 500
#>
#> Computational engine: ranger
```

Notice how the model block now shows `mtry = 4` and `trees = 500` instead of `mtry = tune()` and `trees = tune()`. The workflow is ready to fit. `finalize_workflow()` reads the column names of `best_rf`, finds matching `tune()` markers inside the workflow, and substitutes them in place; the `.config` column from `select_best()` is silently ignored.

### Example 2: Finalize and run last_fit() in one chain

**Pair finalize_workflow() with last_fit() to train on the full training set and score the test split.** This is the canonical end-of-tuning pattern.

```r title="Finalize, then last_fit on the test split"
final_fit <- finalize_workflow(rf_wf, best_rf) |>
  last_fit(cars_split)

collect_metrics(final_fit)
#> # A tibble: 2 x 4
#>   .metric .estimator .estimate .config
#>   <chr>   <chr>          <dbl> <chr>
#> 1 rmse    standard       3.10  Preprocessor1_Model1
#> 2 rsq    standard       0.741 Preprocessor1_Model1
```

`last_fit()` consumes the finalized workflow, trains it on the training split, and scores the test split. Calling `collect_metrics()` on the result returns the held-out test metrics, the number you report. The pipe-chained form makes the intent explicit: take the tunable workflow, substitute the winning parameters, then train and score on the test split in one step.

### Example 3: Finalize with a manually constructed parameter tibble

**You can hand finalize_workflow() any one-row tibble whose columns match the tunable arguments.** This is useful when you want to refit at a specific operating point rather than the tuner's pick.

```r title="Finalize with hand-picked parameters"
my_params <- tibble(mtry = 3, trees = 250)

manual_wf <- finalize_workflow(rf_wf, my_params)
manual_fit <- fit(manual_wf, data = cars_train)

manual_fit |>
  extract_fit_parsnip() |>
  pluck("fit") |>
  pluck("num.trees")
#> [1] 250
```

The column names of `my_params` must match the tunable arguments exactly. Extra columns are ignored; missing columns cause an error. This manual path is the same one `select_best()` walks under the hood: it constructs a tibble with the right shape and hands it to `finalize_workflow()`. The manual route is useful when you want to refit at a runner-up combination, reproduce a model from a saved config file, or sanity-check the pipeline at a known-good point.

### Example 4: Finalize a classification workflow

**The call shape is identical for classification.** Switch the model and metric; everything else stays the same.

```r title="Finalize a classification workflow by ROC AUC"
cars_cls <- mtcars
cars_cls$am <- factor(cars_cls$am, labels = c("auto", "manual"))

cls_spec <- logistic_reg(penalty = tune(), mixture = tune()) |>
  set_engine("glmnet") |>
  set_mode("classification")

cls_wf <- workflow() |>
  add_formula(am ~ mpg + hp + wt) |>
  add_model(cls_spec)

cls_folds <- vfold_cv(cars_cls, v = 3)
cls_grid  <- expand.grid(penalty = c(0.001, 0.01, 0.1),
                         mixture = c(0, 0.5, 1))

cls_res <- tune_grid(cls_wf, resamples = cls_folds, grid = cls_grid,
                     metrics = metric_set(roc_auc, accuracy))

best_cls <- select_best(cls_res, metric = "roc_auc")
final_cls_wf <- finalize_workflow(cls_wf, best_cls)
#> Workflow now has penalty = 0.01 and mixture = 0.5 substituted in.
```

The pattern reads identically: tune, select, finalize. Only the model spec and the metric change between regression and classification problems. The substitution mechanics inside `finalize_workflow()` are agnostic to the model family; the same chain extends unchanged to survival and censored-regression models.

[TIP]
**Save the finalized workflow as a separate object before fitting.** Keeping `final_wf` around lets you refit on new data, inspect the resolved arguments with `extract_spec_parsnip()`, or serialize the recipe alongside the model without re-running the tuner.

## Compare finalize_workflow() with finalize_model() and finalize_recipe()

**The three finalize verbs do the same job on different objects.** Pick the one whose input shape matches what you tuned.

| Function | Operates on | Returns | Use when |
|---|---|---|---|
| `finalize_workflow()` | a workflow with `tune()` markers | finalized workflow | Tuning included model and recipe steps |
| `finalize_model()` | a bare model spec | finalized spec | Tuning only model hyperparameters |
| `finalize_recipe()` | a bare recipe | finalized recipe | Tuning only preprocessing parameters |
| `finalize_workflow()` (with manual tibble) | any workflow | finalized workflow | You want to refit at a chosen point |

Reach for `finalize_workflow()` first; it is the only verb that handles both a recipe and a model together. When in doubt, follow the shape of the object you tuned: a workflow goes to `finalize_workflow()`, a bare model spec to `finalize_model()`, a bare recipe to `finalize_recipe()`. Mixing them returns an error pointing at the mismatch, so the wrong choice surfaces immediately.

## Common pitfalls

**Three finalize_workflow() mistakes account for most stuck pipelines.** Each shows the symptom and the fix.

The first is passing a `show_best()` result instead of a `select_best()` result. `show_best()` returns the parameters plus mean, std_err, n, and `.config`. The extra columns confuse `finalize_workflow()`, which expects only parameter columns and `.config`.

```r title="select_best, not show_best, feeds finalize_workflow"
# Wrong: show_best returns metric columns that finalize_workflow does not expect
finalize_workflow(rf_wf, show_best(rf_res, n = 1, metric = "rmse"))
#> Error: Some required parameter columns are missing or extra columns found.

# Right: select_best returns parameters only
finalize_workflow(rf_wf, select_best(rf_res, metric = "rmse"))
```

The second is forgetting the `tune()` markers on the workflow. If the workflow was built without `tune()` placeholders, there is nothing to finalize, and the call errors with `no tunable parameters`. The third is feeding parameters with wrong column names, often from a manual tibble. The column names must match the tunable arguments exactly, case included.

[WARNING]
**finalize_workflow() does not validate the parameter values themselves.** A typo like `trees = -5` finalizes silently; the error surfaces later when the underlying engine refuses the value. Always sanity-check the printed workflow before fitting.

## Try it yourself

**Try it:** Tune a `decision_tree()` spec on `mtcars` over `tree_depth` values 3, 5, and 7, pick the best row, then finalize the workflow. Save the finalized workflow to `ex_final_wf`.

```r title="Your turn: finalize a decision tree workflow"
# Try it: tune, select, finalize a decision tree
library(tidymodels)
set.seed(123)

dt_spec <- decision_tree(tree_depth = tune()) |>
  set_engine("rpart") |>
  set_mode("regression")

dt_wf <- workflow() |>
  add_formula(mpg ~ .) |>
  add_model(dt_spec)

dt_folds <- vfold_cv(mtcars, v = 3)
dt_grid  <- tibble(tree_depth = c(3, 5, 7))

dt_res <- tune_grid(dt_wf, resamples = dt_folds, grid = dt_grid,
                    metrics = metric_set(rmse))

ex_final_wf <- # your code here

ex_final_wf
#> Expected: a workflow with tree_depth resolved to a concrete number
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_best     <- select_best(dt_res, metric = "rmse")
ex_final_wf <- finalize_workflow(dt_wf, ex_best)

ex_final_wf
#> == Workflow ====================================
#> Model: decision_tree()
#>
#> Main Arguments:
#>   tree_depth = 5
#>
#> Computational engine: rpart
```

**Explanation:** `select_best()` returns a one-row tibble with the winning `tree_depth`. Passing it to `finalize_workflow()` substitutes that value into the workflow, replacing the `tune()` placeholder so `fit()` or `last_fit()` can run.

</details>

## Related tune and workflows functions

**finalize_workflow() sits between selection and final fit.** These siblings cover the steps on either side.

- `select_best()` returns the one-row parameter tibble that feeds `finalize_workflow()`.
- `finalize_model()` does the same substitution on a bare model spec.
- `finalize_recipe()` does the same substitution on a bare recipe.
- `last_fit()` trains the finalized workflow on the training split and scores the test split.
- `fit()` trains the finalized workflow on whatever data you pass.
- `extract_spec_parsnip()` pulls the resolved model spec out of the finalized workflow.

## FAQ

**What is the difference between finalize_workflow() and finalize_model()?**

`finalize_workflow()` operates on a workflow that wraps a recipe and a model together; `finalize_model()` operates on a bare model spec without a workflow. The call shape is identical and both substitute `tune()` markers with values from a one-row parameter tibble. Choose `finalize_workflow()` when your tuning target includes a recipe step. Choose `finalize_model()` when you tune only the model hyperparameters in isolation.

**Does finalize_workflow() refit the model?**

No. `finalize_workflow()` only substitutes the tuned parameter values into the workflow; it does not fit anything. To train the finalized workflow, pass the result to `fit(final_wf, data = train)` or to `last_fit(final_wf, split)` for the combined train-and-score pattern. Skipping the fit step leaves a workflow with parameters but no trained model.

**Can I pass a manually constructed tibble to finalize_workflow()?**

Yes. Any one-row tibble whose column names match the tunable arguments works. This is useful for refitting at a runner-up combination, a value loaded from a config file, or a known-good point during debugging. The column names must match the `tune()` arguments exactly; extra columns are ignored, missing columns cause an error. The reference docs at [tune.tidymodels.org](https://tune.tidymodels.org/) describe the contract.

**What if my workflow has no tune() markers at all?**

`finalize_workflow()` errors because there is nothing to substitute. The workflow is already concrete and you can call `fit()` on it directly. Use `finalize_workflow()` only when at least one model or recipe argument is wrapped in `tune()`. To check whether a workflow has tunable parameters, call `extract_parameter_set_dials(wf)` and look for non-empty output.
