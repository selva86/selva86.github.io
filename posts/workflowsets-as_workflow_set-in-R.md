---
title: "workflowsets as_workflow_set() in R: Wrap Workflow Lists"
slug: workflowsets-as_workflow_set-in-R
description: "Use workflowsets as_workflow_set() in R to convert a named list of workflows into a workflow_set. Syntax, four examples, validation rules, and pitfalls."
keywords: "workflowsets as_workflow_set, as_workflow_set function R, workflowsets as_workflow_set examples, R tidymodels as_workflow_set, convert workflows to workflow_set, workflow_set from list, tidymodels workflow_set"
mathjax: false
webr: true
date: "2026-05-23"
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "as_workflow_set()|workflowsets as_workflow_set|workflowsets::as_workflow_set()|convert workflows to workflow set|build workflow set from list"
auto_link_case_sensitive: true
target_keyword: "workflowsets as_workflow_set"
sibling_block_enabled: true
difficulty: Beginner
---

# workflowsets as_workflow_set() in R: Wrap Workflow Lists

The workflowsets `as_workflow_set()` function in R converts a named list of pre-built `workflow` objects into a single `workflow_set` tibble, so you can fit, tune, and rank a hand-picked collection of models with the same one-line calls that `workflow_set()` enables for combinatorial designs.

[QUICK ANSWER]
as_workflow_set(lr = wf_lr)                          # one workflow, one row
as_workflow_set(lr = wf_lr, rf = wf_rf)              # multiple named workflows
as_workflow_set(!!!list_of_wfs)                      # splice a named list
as_workflow_set(simple = wf1, tuned = wf2)           # mix tunable and fixed
res <- as_workflow_set(lr = wf_lr) |> workflow_map() # then fit or resample
bind_rows(set_a, set_b)                              # combine two sets (not as_workflow_set)

[DECISION TREE: Is as_workflow_set() the right tool?]
- wrap an existing named list of workflows: as_workflow_set(lr = wf_lr, rf = wf_rf)
- build a set from preprocessor x model combinations: workflow_set(preproc, models)
- add a fresh workflow to an existing set: bind_rows(set, as_workflow_set(new = wf))
- fit or resample every workflow in the set: workflow_map(set, "fit_resamples", resamples = folds)
- rank workflows after tuning: rank_results(set, rank_metric = "rmse")
- pull one workflow back out by id: extract_workflow(set, id = "lr")

## What as_workflow_set() does in one sentence

**as_workflow_set() wraps existing workflows into the workflow_set container.** You pass one or more named `workflow` objects and receive a tibble with one row per workflow, ready to be piped into `workflow_map()` for fitting or tuning across the same resamples. The companion function `workflow_set()` builds rows from a preprocessor crossing a model list; `as_workflow_set()` skips that crossing and lets you assemble a hand-curated lineup directly.

[NOTE]
**Available since workflowsets 1.0.0.** Earlier releases shipped only `workflow_set()`. If `as_workflow_set` is unknown to your session, run `update.packages("workflowsets")` before continuing.

## as_workflow_set() syntax and arguments

**The signature accepts a dynamic dots list of named workflows.** Every element of `...` must be a `workflow` object and every argument must be named, since names become the `wflow_id` column used for joining metrics, predictions, and ranks downstream.

```r title="Signature and a minimal call"
library(workflows)
library(workflowsets)
library(parsnip)

# Signature
# as_workflow_set(...)
# ...        named workflow objects; names become wflow_id

# Build one workflow, then wrap it
wf_lr <- workflow() |>
  add_model(linear_reg() |> set_engine("lm")) |>
  add_formula(mpg ~ disp + hp)

set1 <- as_workflow_set(lr_simple = wf_lr)
set1
#> # A workflow set/tibble: 1 x 4
#>   wflow_id  info             option    result    
#>   <chr>     <list>           <list>    <list>    
#> 1 lr_simple <tibble [1 x 4]> <opts[0]> <list [0]>
```

The returned object inherits from `tbl_df` so any tibble verb works on it, and from `workflow_set` so workflowsets verbs like `workflow_map()` and `rank_results()` dispatch correctly.

## Four examples of as_workflow_set() in action

**Example 1: wrap two complete workflows for a head-to-head fit.**

```r title="Wrap two workflows side by side"
library(rsample)

set.seed(1)
splits <- initial_split(mtcars, prop = 0.75)
train  <- training(splits)
folds  <- vfold_cv(train, v = 3)

wf_lr <- workflow() |>
  add_model(linear_reg() |> set_engine("lm")) |>
  add_formula(mpg ~ disp + hp + wt)

wf_rf <- workflow() |>
  add_model(rand_forest(mode = "regression") |> set_engine("ranger")) |>
  add_formula(mpg ~ disp + hp + wt)

set_two <- as_workflow_set(lr = wf_lr, rf = wf_rf)
nrow(set_two)
#> [1] 2
set_two$wflow_id
#> [1] "lr" "rf"
```

**Example 2: splice a programmatically built list with `!!!`.** When you assemble workflows in a loop or `purrr::map()`, the result is a list. The bang-bang-bang operator from rlang splices that list into the dots so each element becomes a named argument.

```r title="Splice a named list into the set"
library(rlang)

wf_list <- list(
  lr_disp = workflow() |> add_model(linear_reg()) |> add_formula(mpg ~ disp),
  lr_hp   = workflow() |> add_model(linear_reg()) |> add_formula(mpg ~ hp),
  lr_wt   = workflow() |> add_model(linear_reg()) |> add_formula(mpg ~ wt)
)

set_spliced <- as_workflow_set(!!!wf_list)
set_spliced$wflow_id
#> [1] "lr_disp" "lr_hp"   "lr_wt"
```

**Example 3: pipe straight into `workflow_map()` to fit on resamples.** A wrapped set behaves identically to a set built by `workflow_set()`, so the standard fitting verbs apply.

```r title="Fit every workflow on the same resamples"
library(tune)
library(yardstick)

res <- set_two |>
  workflow_map(
    "fit_resamples",
    seed = 42,
    resamples = folds,
    metrics   = metric_set(rmse, rsq),
    verbose   = FALSE
  )

rank_results(res, rank_metric = "rmse")[, c("wflow_id", ".metric", "mean")]
#> # A tibble: 4 x 3
#>   wflow_id .metric  mean
#>   <chr>    <chr>   <dbl>
#> 1 lr       rmse     2.74
#> 2 lr       rsq      0.81
#> 3 rf       rmse     2.91
#> 4 rf       rsq      0.79
```

**Example 4: extend an existing set instead of rebuilding it.** Use `bind_rows()` to combine two workflow sets; `as_workflow_set()` itself does not append to a set.

```r title="Append a third workflow to an existing set"
wf_extra <- workflow() |>
  add_model(linear_reg() |> set_engine("lm")) |>
  add_formula(mpg ~ disp * hp)

set_three <- bind_rows(set_two, as_workflow_set(lr_interact = wf_extra))
set_three$wflow_id
#> [1] "lr"          "rf"          "lr_interact"
```

[TIP]
**Name workflows by their identifying contrast.** Good ids read as labels in plots: `lr_basic`, `lr_poly`, `rf_500_trees`. Avoid numeric suffixes like `wf1`, `wf2`; they reduce a rank table to a guessing game when you revisit it weeks later.

## as_workflow_set() compared with workflow_set() and bind_rows

**Pick the constructor that matches how your workflows came into being.**

| Function | Input | Use when | Row count |
|---|---|---|---|
| `as_workflow_set()` | Named workflow objects (via `...`) | You already built complete workflows by hand or in a loop | Number of inputs |
| `workflow_set()` | A list of preprocessors and a list of model specs | You want every preprocessor x model combination | preprocessors x models |
| `bind_rows()` (on sets) | Two or more `workflow_set` tibbles | You need to merge sets built at different times | Sum of input rows |

[KEY INSIGHT]
**`workflow_set()` does the crossing; `as_workflow_set()` does the wrapping.** Reach for `workflow_set()` when you want a grid of preprocessor times model. Reach for `as_workflow_set()` when each workflow is already its own thing and you only need them collected so tuning verbs can sweep through them.

## Common pitfalls

**Unnamed arguments fail loudly.** `as_workflow_set()` requires every dot to be named because the names become `wflow_id` values used by every downstream join.

```r title="Unnamed argument triggers an error"
try(as_workflow_set(wf_lr))
#> Error in `as_workflow_set()`: All elements of `...` must be named.
```

**Non-workflow inputs are rejected.** Passing a raw `parsnip` model spec or a `recipe` instead of a full `workflow` raises an error rather than silently coercing.

```r title="Only workflow objects are accepted"
try(as_workflow_set(broken = linear_reg()))
#> Error in `as_workflow_set()`: All elements of `...` must be workflows.
```

**Duplicate ids overwrite silently in some pipelines.** Reusing the same name across two `as_workflow_set()` calls and then `bind_rows`-ing the results leaves you with two rows sharing one `wflow_id`. `workflow_map()` will run both, but `rank_results()` then treats them as different configurations of the same model. Always sweep names with `make.unique()` before binding sets that may collide.

## Try it yourself

**Try it:** Build two regression workflows on `mtcars` (a basic linear model and a polynomial term), wrap them with `as_workflow_set()`, and store the result in `ex_set`.

```r title="Your turn: wrap two workflows"
# Try it: build and wrap
ex_wf_basic <- # your code here
ex_wf_poly  <- # your code here
ex_set      <- # your code here

ex_set$wflow_id
#> Expected: "basic" "poly"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_wf_basic <- workflow() |>
  add_model(linear_reg() |> set_engine("lm")) |>
  add_formula(mpg ~ disp)

ex_wf_poly <- workflow() |>
  add_model(linear_reg() |> set_engine("lm")) |>
  add_formula(mpg ~ poly(disp, 2))

ex_set <- as_workflow_set(basic = ex_wf_basic, poly = ex_wf_poly)
ex_set$wflow_id
#> [1] "basic" "poly"
```

**Explanation:** Each argument name becomes the `wflow_id` for that row, so `basic` and `poly` show up as the labels you can later filter, rank, or plot by.

</details>

## Related workflowsets and tidymodels functions

- [workflow_set()](workflowsets-workflow_set-in-R.html) builds a set from preprocessor crossed with model lists.
- [workflow_map()](workflowsets-workflow_map-in-R.html) fits or tunes every workflow in a set across one resample object.
- [rank_results()](workflowsets-rank_results-in-R.html) sorts a fitted set by a chosen metric.
- [workflow()](workflows-workflow-in-R.html) is the single-model object that `as_workflow_set()` wraps.
- [extract_workflow()](workflows-extract_workflow-in-R.html) pulls a named workflow back out of a set.

For the canonical reference, see the [workflowsets package site](https://workflowsets.tidymodels.org/reference/as_workflow_set.html).

## FAQ

**What is the difference between as_workflow_set() and workflow_set()?**

`workflow_set()` takes a list of preprocessors and a list of model specs and returns the cross-product (every preprocessor paired with every model). `as_workflow_set()` takes workflows that are already complete and wraps them into the same `workflow_set` container without any combinatorial step. Use the first for grids; use the second for hand-picked lineups.

**Can I add a new workflow to an existing workflow_set?**

Not directly with `as_workflow_set()`. Wrap the new workflow as a one-row set, then combine: `bind_rows(existing, as_workflow_set(new_id = new_wf))`. The resulting tibble keeps the `workflow_set` class so verbs like `workflow_map()` and `rank_results()` continue to work.

**Why does as_workflow_set() require named arguments?**

Names become the `wflow_id` column, the join key used by `workflow_map()`, `collect_metrics()`, `rank_results()`, and every other workflowsets verb. Without names the join would have nothing to grip and most downstream calls would fail with a missing-column error.

**Can I pass a parsnip model spec instead of a full workflow?**

No. `as_workflow_set()` validates each input with `is_workflow()` and aborts on anything else. Wrap your model spec in `workflow() |> add_model(spec) |> add_formula(y ~ .)` first, then pass the result.

**How do I splice a list of workflows built by purrr::map()?**

Use the rlang splice operator `!!!`. If `wf_list` is a named list of workflows, `as_workflow_set(!!!wf_list)` unpacks it so each element becomes a separate named argument. This is the cleanest way to feed programmatically constructed workflows into a set.
