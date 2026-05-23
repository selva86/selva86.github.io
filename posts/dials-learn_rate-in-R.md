---
title: "dials learn_rate() in R: Tune Boosting Learning Rate"
slug: dials-learn_rate-in-R
description: "Use dials learn_rate() in R to tune the boosting learning rate range. See log10 defaults, boost_tree examples, the trees tradeoff, and common pitfalls."
keywords: "dials learn_rate, learn_rate function R, dials learn_rate examples, R learning rate hyperparameter, tune learn_rate tidymodels, boost_tree learn_rate, dials::learn_rate"
mathjax: false
webr: true
date: 2026-05-23
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "learn_rate()|dials learn_rate|dials::learn_rate()|tune learn_rate|learning rate parameter"
auto_link_case_sensitive: true
target_keyword: dials learn_rate
sibling_block_enabled: true
difficulty: Beginner
---

# dials learn_rate() in R: Tune Boosting Learning Rate

<p class="lead">The dials learn_rate() function in R defines the numeric hyperparameter for the per-iteration shrinkage applied in boosted tree and neural network models. It defaults to a log10-transformed range of 10^-10 to 10^-1, which is the search space almost every boosting library expects.</p>

[QUICK ANSWER]
learn_rate()                                  # default log10 range -10 to -1
learn_rate(range = c(-3, -1))                 # narrower band, still log10
learn_rate(range = c(0.001, 0.3), trans = NULL) # raw scale instead of log
update(params, learn_rate = learn_rate(c(-4, -1)))  # override in param set
grid_regular(learn_rate(c(-3, -1)), levels = 5)     # 5 log-spaced points
boost_tree(trees = tune(), learn_rate = tune())     # tune the pair together
finalize(params, train)                       # no-op for learn_rate, still safe

[DECISION TREE: Is learn_rate() the right tool?]
- tune the shrinkage in xgboost or lightgbm: learn_rate()
- tune the ensemble size that pairs with it: trees()
- tune individual tree depth in boosting: tree_depth()
- stop boosting early when validation plateaus: stop_iter()
- tune the L2 penalty on leaf weights: loss_reduction()
- tune variable sampling at each split: mtry()
- set the learning rate for a neural net (mlp): learn_rate() (same function)

## What learn_rate() does in one sentence

**learn_rate() returns a dials parameter object describing the shrinkage applied to each boosting iteration or the step size used in gradient descent.** It is the knob you tune when you mark `learn_rate = tune()` inside `boost_tree()`, `mlp()`, or `bart()`. Smaller values force the model to take many small steps and usually need more trees to compensate. Larger values converge faster but risk overshooting the minimum and overfitting on the residual structure.

The function is part of the same dials family as `trees()`, `tree_depth()`, and `min_n()`. The one thing that sets it apart is the default log10 transform, which means the range you pass and the values the model actually sees live on different scales.

## learn_rate() syntax and arguments

**The signature is two arguments with a non-obvious default.**

```r title="learn_rate signature and defaults"
library(dials)
learn_rate(range = c(-10, -1), trans = transform_log10())
#> Learning Rate (quantitative)
#> Transformer: log-10 [1e-100, Inf]
#> Range (transformed scale): [-10, -1]
```

| Argument | Description |
|---|---|
| `range` | Two-element numeric vector. Defaults to `c(-10, -1)` on the log10 scale, i.e. 10^-10 to 10^-1 on the natural scale. |
| `trans` | A transformation from the scales package. Default `transform_log10()`. Pass `NULL` to search on the raw scale instead. |

The return is a `quant_param` S3 object. Print it to inspect the range, call `value_seq()` to draw points, or hand it to `grid_*()` helpers.

```r title="Inspect the parameter object"
p <- learn_rate(range = c(-3, -1))
p
#> Learning Rate (quantitative)
#> Transformer: log-10 [1e-100, Inf]
#> Range (transformed scale): [-3, -1]

value_seq(p, 5)
#> [1] 0.001000000 0.005623413 0.031622777 0.177827941 1.000000000
```

[NOTE]
**The default range looks tiny but is enormous on the natural scale.** `c(-10, -1)` expands to `[10^-10, 0.1]`. Few boosting problems benefit from learning rates below 0.001, so most authors tighten the range to `c(-3, -1)` (0.001 to 0.1) before tuning.

## Examples by use case

**Start with a tunable boosted tree, pair learn_rate with trees, then build a small grid.**

```r title="Tunable xgboost spec with learn_rate"
library(tidymodels)
data(ames, package = "modeldata")
ames <- ames |> mutate(Sale_Price = log10(Sale_Price))

set.seed(42)
split <- initial_split(ames, prop = 0.8, strata = Sale_Price)
train <- training(split)

xgb_spec <- boost_tree(
  trees      = tune(),
  learn_rate = tune(),
  tree_depth = 6
) |>
  set_engine("xgboost") |>
  set_mode("regression")

wf <- workflow() |>
  add_formula(Sale_Price ~ Gr_Liv_Area + Year_Built + Bldg_Type + Neighborhood) |>
  add_model(xgb_spec)
```

Extract the parameter set and tighten the learn_rate range from the wide default to something practical.

```r title="Override learn_rate range in a param set"
params <- extract_parameter_set_dials(wf) |>
  update(learn_rate = learn_rate(range = c(-3, -1)))

params
#> Collection of 2 parameters for tuning
#>  identifier      type    object
#>       trees      trees nparam[+]
#>  learn_rate learn_rate nparam[+]
```

A regular grid over the pair samples five learn_rate values on a log scale and three tree counts on a linear scale.

```r title="Regular grid over trees and learn_rate"
xgb_grid <- grid_regular(params, levels = c(trees = 3, learn_rate = 5))
xgb_grid
#> # A tibble: 15 x 2
#>    trees learn_rate
#>    <int>      <dbl>
#>  1   100    0.001
#>  2  1000    0.001
#>  3  2000    0.001
#>  4   100    0.00562
#>  5  1000    0.00562
#>  6  2000    0.00562
#>  7   100    0.0316
#>  8  1000    0.0316
#>  9  2000    0.0316
#> 10   100    0.178
#> ...
```

The grid's learn_rate column is on the natural scale, even though we passed the range on the log10 scale. dials handles the back-transform for you.

```r title="Raw-scale variant when you do not want log"
lr_raw <- learn_rate(range = c(0.01, 0.3), trans = NULL)
value_seq(lr_raw, 4)
#> [1] 0.01000000 0.10666667 0.20333333 0.30000000
```

[KEY INSIGHT]
**learn_rate and trees move in opposite directions.** A small learn_rate of 0.01 typically needs 1000+ trees to fit the same signal that learn_rate 0.1 catches in 200. When you tune both together, expect the optimum corner of the grid to land in the small-learn_rate + large-trees region, then trim the wasteful cells in the next refinement pass.

## learn_rate() versus the raw boost_tree(learn_rate = 0.1) argument

**Pick by whether you are tuning or fitting one model.**

| Form | What it does | When to use |
|---|---|---|
| `learn_rate()` | Returns a parameter object for tune_grid() to sample | Hyperparameter tuning, parameter set construction |
| `boost_tree(learn_rate = 0.1)` | Fixes the rate at 0.1 for a single fit | Production, after tuning has chosen a value |
| `boost_tree(learn_rate = tune())` | Marks the slot as tunable, leaves the range to dials | Inside a workflow you will pass to tune_grid() |

Behind the scenes, `tune()` is a placeholder. `extract_parameter_set_dials()` walks the spec, sees the placeholder, and asks dials for the default `learn_rate()` object. You only call `learn_rate()` directly when you want to override the default range or transform.

## Common pitfalls

**Four mistakes catch most learn_rate tuning runs in their first iteration.**

1. **Reading the default range as natural-scale.** `c(-10, -1)` looks like a tiny set of rates; it is actually 10 orders of magnitude on the natural scale. A 5-point regular grid hits 10^-10, 10^-7.75, 10^-5.5, 10^-3.25, 10^-1, which is useless for any real model.
2. **Tuning learn_rate without tuning trees.** A fixed `trees = 100` plus a small learn_rate yields a model that barely moves off the intercept. Always tune the pair together, or fix trees high enough (say 1500) and use `stop_iter()` to find the right ensemble size during fit.
3. **Mixing log and raw scales in a custom grid.** A tibble grid with `learn_rate = c(0.001, 0.01, 0.1)` works only if the workflow's parameter has `trans = NULL`. If the default log10 transform is still in place, dials interprets those values as exponents and silently samples 10^0.001, 10^0.01, 10^0.1.
4. **Calling finalize() and expecting it to do something.** `finalize()` only fills in `unknown()` bounds. learn_rate has both bounds set by default, so finalize is a no-op. Harmless to call, but it is not the missing piece if your tune_grid still errors.

[WARNING]
**Different engines interpret learn_rate differently at the extremes.** xgboost clamps to `[0, 1]`. lightgbm allows higher values up to 2 or 3 in practice. h2o has its own scaling. Always check the engine's accepted range before pushing the upper bound above `-1` on the log10 scale.

## Try it yourself

**Try it:** Build a tunable boost_tree on mtcars (regression on mpg), tighten learn_rate to the practical range 0.005 to 0.2 with log10 transform, and produce a regular grid with 4 learn_rate values and 3 tree counts. Print the grid.

```r title="Your turn: tune learn_rate on mtcars"
# Try it: tune learn_rate on mtcars
library(tidymodels)

ex_spec <- boost_tree(trees = tune(), learn_rate = tune(), tree_depth = 4) |>
  set_engine("xgboost") |>
  set_mode("regression")

ex_wf <- workflow() |>
  add_formula(mpg ~ .) |>
  add_model(ex_spec)

ex_params <- # your code here

ex_grid <- # your code here

ex_grid
#> Expected: a 12-row tibble with columns trees and learn_rate
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_params <- extract_parameter_set_dials(ex_wf) |>
  update(learn_rate = learn_rate(range = c(log10(0.005), log10(0.2))))

ex_grid <- grid_regular(ex_params, levels = c(trees = 3, learn_rate = 4))

ex_grid
#> # A tibble: 12 x 2
#>    trees learn_rate
#>    <int>      <dbl>
#>  1   100    0.005
#>  2  1000    0.005
#>  3  2000    0.005
#>  4   100    0.0189
#>  5  1000    0.0189
#>  6  2000    0.0189
#>  7   100    0.0712
#>  8  1000    0.0712
#>  9  2000    0.0712
#> 10   100    0.2
#> 11  1000    0.2
#> 12  2000    0.2
```

**Explanation:** Wrapping the raw bounds in `log10()` keeps the parameter on the log10 scale so the four sampled values are spaced geometrically between 0.005 and 0.2. Crossed with three tree counts, the grid has 12 candidates.

</details>

## Related tidymodels functions

**learn_rate() rarely tunes alone; the typical call lives inside a small cluster.**

- `trees()` to set the ensemble size that pairs with it. Small learn_rate needs many trees.
- `tree_depth()` to control individual tree complexity in boosting.
- `stop_iter()` to halt boosting once validation stops improving, which protects you from oversized tree counts.
- `loss_reduction()` to tune the minimum gain required to split a node (gamma in xgboost).
- `extract_parameter_set_dials()` to pull every tunable parameter from a workflow at once.
- `grid_regular()`, `grid_space_filling()`, `grid_max_entropy()` to expand the parameter set into a candidate tibble.

External reference: the official dials documentation at [dials.tidymodels.org](https://dials.tidymodels.org/reference/learn_rate.html).

## FAQ

**What is a good default learning rate for xgboost in R?**

For most tabular regression and classification problems, a learn_rate between 0.01 and 0.05 paired with 500 to 2000 trees lands close to the optimum. Smaller rates like 0.005 work when the signal is subtle and you can afford the compute. Rates above 0.1 tend to overfit on small datasets and skip past the minimum on noisy data. xgboost's own default is 0.3, which is tuned for speed not accuracy; lower it before you tune anything else.

**Why does learn_rate() use a log scale by default?**

Because the practically useful range spans three to four orders of magnitude, from roughly 0.001 to 0.3. A linear grid would waste most candidates in the upper half of the range, where models overfit or fail to converge. A log10 grid spaces candidates geometrically, so a 5-point grid hits 0.001, 0.003, 0.01, 0.03, 0.1 instead of 0.001, 0.075, 0.15, 0.225, 0.3. The log transform makes the search efficient even when the optimal rate is close to the lower end.

**How is dials learn_rate() different from setting learn_rate in xgboost directly?**

dials learn_rate() builds a parameter object that tune_grid() can sample across many candidate values. Setting `boost_tree(learn_rate = 0.1)` fixes the rate at one value for a single fit. The dials version is what you reach for during hyperparameter search. The direct value is what you write into your production spec once tuning has chosen a winner.

**Do I need finalize() with learn_rate() like I do with mtry()?**

No. learn_rate() ships with both bounds set, so `is_unknown()` returns FALSE on both endpoints. `finalize()` only replaces unknown bounds with data-derived values, so calling it on learn_rate is harmless but does nothing. mtry() is different because its upper bound depends on the predictor count, which dials cannot know until you hand it data.

**Can I tune learn_rate for a neural network instead of boosting?**

Yes. `mlp(learn_rate = tune())` with `set_engine("keras")` accepts the same dials learn_rate() parameter. The default log10 range still applies, though neural networks often want a narrower band like `c(-4, -2)`. The mechanics are identical: extract the parameter set, optionally update the range, build a grid, fit through tune_grid().
