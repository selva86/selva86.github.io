---
title: "parsnip decision_tree() in R: Build Tree-Based Models"
slug: parsnip-decision_tree-in-R
description: "Learn how parsnip decision_tree() defines classification and regression tree models in R. Set the engine, tune tree_depth and min_n, and fit with examples."
keywords: "parsnip decision_tree, decision_tree function R, parsnip decision_tree examples, R decision tree tidymodels, decision_tree engine, tidymodels decision tree"
mathjax: false
webr: true
date: 2026-05-18
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "decision_tree()|parsnip decision_tree|parsnip::decision_tree()|decision tree model spec|tidymodels decision tree"
auto_link_case_sensitive: true
target_keyword: parsnip decision_tree
sibling_block_enabled: true
difficulty: Beginner
---

# parsnip decision_tree() in R: Build Tree-Based Models

<p class="lead">The parsnip decision_tree() function defines a tree-based model specification in R that works for both classification and regression, without locking you into one engine.</p>

[QUICK ANSWER]
decision_tree()                                  # bare spec, mode unset
decision_tree(mode = "classification")           # set mode inline
decision_tree(tree_depth = 5)                    # cap how deep the tree grows
decision_tree(min_n = 10)                        # minimum rows to split a node
decision_tree(cost_complexity = 0.01)            # pruning penalty
decision_tree() |> set_engine("C5.0")            # switch the fitting engine
decision_tree() |> set_mode("regression")        # build a regression tree

[DECISION TREE: Is decision_tree() the right tool?]
- single interpretable tree: decision_tree() |> set_engine("rpart")
- many trees averaged for accuracy: rand_forest()
- sequential boosted trees: boost_tree()
- straight-line numeric outcome: linear_reg()
- binary yes or no outcome: logistic_reg()
- bagged trees to cut variance: bag_tree()

## What decision_tree() does

**decision_tree() declares a model, it does not train one.** The function from the parsnip package returns a model specification: a tidy, engine-agnostic description of the tree you want. No data touches it until you call `fit()`. This split keeps your modeling code portable across the whole tidymodels stack.

A decision tree splits the predictor space into rectangular regions and predicts a constant within each region. It handles both numeric and categorical predictors, needs no scaling, and produces a model you can read as plain if-then rules. That interpretability is the reason a single tree is still worth reaching for.

[KEY INSIGHT]
**A parsnip spec is a recipe, not a meal.** `decision_tree()` records your intent (depth, engine, mode). The `fit()` call is what actually runs `rpart` or `C5.0` on your data. Separating the two lets you reuse one spec across resamples and tuning grids.

## decision_tree() syntax and arguments

**Three hyperparameters control the shape of the tree.** Each argument is optional, and any you leave out falls back to the engine default.

| Argument | What it controls | Typical range |
|---|---|---|
| `tree_depth` | Maximum depth the tree can grow | 1 to 15 |
| `min_n` | Minimum data points needed to split a node | 2 to 40 |
| `cost_complexity` | Penalty that prunes weak splits | 0 to 0.1 |
| `mode` | `"classification"` or `"regression"` | set inline or via `set_mode()` |
| `engine` | Fitting backend, set with `set_engine()` | `"rpart"`, `"C5.0"` |

You build a spec by piping the constructor into `set_engine()` and `set_mode()`.

```r title="Define a decision tree spec"
library(parsnip)

tree_spec <- decision_tree(tree_depth = 5, min_n = 10) |>
  set_engine("rpart") |>
  set_mode("classification")

tree_spec
#> Decision Tree Model Specification (classification)
#>
#> Main Arguments:
#>   tree_depth = 5
#>   min_n = 10
#>
#> Computational engine: rpart
```

The printed spec shows your chosen arguments and the engine. Nothing is fitted yet, so this object is cheap to create and copy.

## Fit a decision tree: classification and regression

**The same spec fits classification and regression by switching the mode.** Pass a formula and a data frame to `fit()`, then call `predict()` on new rows. Here is a classification tree on the built-in `iris` dataset.

```r title="Fit a classification tree on iris"
tree_fit <- tree_spec |>
  fit(Species ~ ., data = iris)

predict(tree_fit, iris[c(1, 60, 130), ])
#> # A tibble: 3 x 1
#>   .pred_class
#>   <fct>
#> 1 setosa
#> 2 versicolor
#> 3 virginica
```

The fitted object holds the trained `rpart` model and predicts a tidy tibble. For a numeric target, rebuild the spec in regression mode and fit against `mtcars`.

```r title="Fit a regression tree on mtcars"
reg_spec <- decision_tree(tree_depth = 4, min_n = 5) |>
  set_engine("rpart") |>
  set_mode("regression")

reg_fit <- reg_spec |> fit(mpg ~ ., data = mtcars)
predict(reg_fit, mtcars[1:3, ])
#> # A tibble: 3 x 1
#>   .pred
#>   <dbl>
#> 1  20.4
#> 2  20.4
#> 3  26.2
```

Regression trees return `.pred` instead of `.pred_class`. Notice the first two cars share a prediction: both fall into the same leaf, so the tree gives them the leaf average.

## Choosing an engine: rpart vs C5.0

**The engine decides the splitting algorithm behind a shared interface.** `rpart` is the default and the only engine that supports regression. `C5.0` is classification-only but builds compact, accurate trees with built-in boosting hooks.

```r title="Switch to the C5.0 engine"
c5_fit <- decision_tree() |>
  set_engine("C5.0") |>
  set_mode("classification") |>
  fit(Species ~ ., data = iris)

predict(c5_fit, iris[c(1, 60, 130), ])
#> # A tibble: 3 x 1
#>   .pred_class
#>   <fct>
#> 1 setosa
#> 2 versicolor
#> 3 virginica
```

[NOTE]
**`cost_complexity` only applies to `rpart`.** The `C5.0` engine prunes internally and ignores that argument. Run `show_engines("decision_tree")` to see every engine and the modes each one supports.

## Common pitfalls

**Most decision_tree() errors trace back to a missing mode.** A spec with no mode cannot be fitted, because parsnip does not know whether to call a classification or regression routine.

```r title="A spec with no mode fails to fit"
decision_tree() |>
  fit(Species ~ ., data = iris)
#> Error: Please set the mode in the model specification.
```

Set the mode with `set_mode()` or the `mode` argument and the fit succeeds. Two more traps to watch:

- Passing `cost_complexity` to a `C5.0` spec does nothing. The argument is silently dropped because that engine prunes on its own.
- A regression target that is stored as a factor throws a type error. Convert it with `as.numeric()` before fitting.

[WARNING]
**A single tree overfits fast.** With `tree_depth` left high and `min_n` low, the tree memorizes noise. Tune both with the dials package, or move to `rand_forest()` when one tree is too unstable.

## Try it yourself

**Try it:** Build a regression decision tree spec with `tree_depth = 3`, fit it to predict `hp` from all columns of `mtcars`, and save the fitted model to `ex_tree_fit`.

```r title="Your turn: fit a regression tree"
# Try it: build and fit a depth-3 regression tree
ex_tree_fit <- # your code here

ex_tree_fit
#> Expected: a parsnip model fit object
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_tree_fit <- decision_tree(tree_depth = 3) |>
  set_engine("rpart") |>
  set_mode("regression") |>
  fit(hp ~ ., data = mtcars)

class(ex_tree_fit)
#> [1] "_rpart"      "model_fit"
```

**Explanation:** The spec sets the depth and mode, `set_engine("rpart")` picks the backend, and `fit()` trains the tree on `mtcars`. The result is a parsnip `model_fit` wrapping the `rpart` object.

</details>

## Related parsnip functions

**decision_tree() is one model in a family of parsnip specifications.** When a single tree is not the right fit, these neighbors share the same `set_engine()` and `fit()` workflow:

- `rand_forest()` averages many trees to cut variance.
- `boost_tree()` builds trees sequentially for higher accuracy.
- `bag_tree()` bags trees for a stabilized ensemble.
- `set_engine()` chooses the computational backend for any spec.
- `fit()` trains a spec on a formula and data frame.

See the [tidymodels parsnip reference](https://parsnip.tidymodels.org/reference/decision_tree.html) for the full list of supported engines.

## FAQ

**What is the difference between decision_tree() and rpart()?**
`rpart()` from the rpart package fits a tree directly and returns an `rpart` object. `decision_tree()` is a parsnip wrapper that defines an engine-agnostic spec, then calls `rpart` (or another engine) under the hood when you `fit()`. The wrapper gives you tidy predictions, consistent argument names, and easy swapping between engines.

**How do I plot a decision tree from parsnip?**
Extract the underlying engine object first with `extract_fit_engine()`, then pass it to a plotting function. The `rpart.plot` package works well: `library(rpart.plot); rpart.plot(extract_fit_engine(tree_fit))`. Plotting the parsnip `model_fit` object directly will not work.

**Which engine should I use for decision_tree()?**
Use `rpart` for regression or when you want the classic CART algorithm; it is the default and needs no extra setup. Use `C5.0` for classification when you want smaller, often more accurate trees and rule-based output. Both share the same parsnip interface, so switching is one line.

**Can decision_tree() handle missing values?**
The `rpart` engine handles missing predictor values automatically using surrogate splits, so you usually do not need to impute. The `C5.0` engine also tolerates missing data. Even so, inspecting and treating missingness with a recipes step often improves results.

**How do I tune tree_depth and min_n?**
Mark an argument for tuning by setting it to `tune()`, as in `decision_tree(tree_depth = tune())`. Then build a grid with the dials package and pass it to `tune_grid()` with a resampling object. The tuning step searches the values and reports the best-performing combination.
