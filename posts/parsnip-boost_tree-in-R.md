---
title: "parsnip boost_tree() in R: Define Gradient Boosting Models"
slug: parsnip-boost_tree-in-R
description: "parsnip boost_tree() in R defines gradient-boosted tree models for tidymodels. Covers syntax, the xgboost and C5.0 engines, classification, and regression."
keywords: "parsnip boost_tree, boost_tree function R, parsnip boost_tree examples, gradient boosting tidymodels R, boost_tree xgboost engine, tidymodels gradient boosting"
mathjax: false
webr: true
date: "2026-05-18"
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "boost_tree()|parsnip boost_tree|parsnip::boost_tree()|gradient boosting in R|tidymodels gradient boosting"
auto_link_case_sensitive: true
target_keyword: "parsnip boost_tree"
sibling_block_enabled: true
difficulty: Beginner
---

# parsnip boost_tree() in R: Define Gradient Boosting Models

<p class="lead">The parsnip <code>boost_tree()</code> function defines a gradient-boosted tree model for classification or regression in tidymodels. It gives you one interface that fits with the xgboost, C5.0, or lightgbm engine underneath.</p>

[QUICK ANSWER]
boost_tree()                                  # default spec, xgboost engine
boost_tree() |> set_mode("classification")    # classify a factor outcome
boost_tree() |> set_mode("regression")        # predict a numeric outcome
boost_tree(trees = 500, learn_rate = 0.1)     # set boosting rounds and step size
boost_tree(tree_depth = 4, min_n = 10)        # control how large each tree grows
boost_tree() |> set_engine("C5.0")            # swap the backend engine
fit(spec, Species ~ ., data = iris)           # train on a dataset

[DECISION TREE: Is boost_tree() the right tool?]
- gradient-boosted trees: boost_tree() |> set_engine("xgboost")
- bagged random-split trees: rand_forest() |> set_engine("ranger")
- one interpretable tree: decision_tree() |> set_engine("rpart")
- a plain linear model: linear_reg() |> set_engine("lm")
- bagged trees without boosting: bag_tree() |> set_engine("rpart")
- tune learn_rate and tree_depth: tune_grid() with boost_tree()

## What boost_tree() does

**boost_tree() is a model specification, not a fitted model.** It records your intent to build a gradient-boosted tree ensemble and the hyperparameters you want, but no data touches it until you call `fit()`. This separation lets you reuse one specification across many datasets or resampling folds.

Gradient boosting grows trees one after another, where each new tree corrects the errors of the trees before it. Predictions sum the contributions of every tree, scaled by a learning rate that keeps each step small. This sequential, error-driven design is what separates boosting from a random forest, which grows its trees independently.

The function belongs to the tidymodels framework. Because parsnip standardizes the interface, the same `boost_tree()` code runs on the fast xgboost engine or the classic C5.0 engine with only one line changed.

[KEY INSIGHT]
**A parsnip spec is a recipe for a model, not the model itself.** You build the specification once, then `fit()` turns it into a trained model object. Keeping those two steps apart is what makes tidymodels workflows reproducible across resamples.

[NOTE]
**boost_tree() ships in core parsnip, but the engines do not.** The default `xgboost` engine needs the `xgboost` package installed, and `set_engine("C5.0")` needs the `C50` package. Install the engine package before you fit, or R reports that the engine is not available.

## boost_tree() syntax and arguments

**boost_tree() takes up to eight hyperparameters and two setup verbs.** The arguments control how trees are grown and combined, while `set_engine()` and `set_mode()` finish the specification.

```r title="The boost_tree specification skeleton"
library(tidymodels)

boost_tree(
  mode = "unknown",      # set to "classification" or "regression"
  engine = "xgboost",    # xgboost (default), C5.0, lightgbm, h2o, spark
  trees = NULL,          # number of boosting rounds (trees)
  tree_depth = NULL,     # maximum depth of each tree
  learn_rate = NULL,     # shrinkage applied to each tree
  min_n = NULL,          # minimum rows in a node before a split
  loss_reduction = NULL, # minimum loss drop required to split
  sample_size = NULL,    # fraction of rows sampled per tree
  stop_iter = NULL       # rounds with no gain before early stop
)
```

The `trees` argument sets how many boosting rounds run, and `learn_rate` shrinks each tree's contribution so the ensemble improves gradually. The `tree_depth` and `min_n` arguments cap tree size, while `loss_reduction` and `sample_size` add regularization. The `stop_iter` argument halts training early once extra rounds stop helping.

**The mode is never "unknown" at fit time.** A boosted model can predict a class or a number, so you must call `set_mode("classification")` or `set_mode("regression")` before fitting. You can pass the engine through `set_engine()` instead of the `engine` argument, which is the more common tidymodels style.

## Fit a boosted model: four examples

**Every example below uses a built-in R dataset.** The `iris` data drives the classification examples and `mtcars` drives the regression example, so the code runs anywhere with no downloads.

### Example 1: Classify with the default xgboost engine

**Build the specification, then fit it to data.** The xgboost engine is the parsnip default and grows trees quickly in C++.

```r title="Fit boost_tree on the iris data"
bt_spec <- boost_tree(trees = 500, learn_rate = 0.1) |>
  set_engine("xgboost") |>
  set_mode("classification")

bt_fit <- bt_spec |>
  fit(Species ~ ., data = iris)

bt_fit
#> parsnip model object
#>
#> ##### xgb.Booster
#> raw: 92.5 Kb
#> call:
#>   xgboost::xgb.train(params = list(eta = 0.1, max_depth = 6, ...))
#> params (as set within xgb.train):
#>   eta = "0.1", max_depth = "6", gamma = "0"
#> niter: 500
#> # of features: 4
```

The printout confirms the engine ran 500 boosting rounds (`niter`) with a learning rate (`eta`) of 0.1 on the four iris predictors. The model is now trained and ready to predict.

### Example 2: Predict classes and probabilities

**predict() returns a tidy tibble with one row per input row.** Use `type = "prob"` to get per-class probabilities instead of the hard label.

```r title="Predict iris species and class probabilities"
sample_rows <- iris[c(1, 70, 130), ]

predict(bt_fit, new_data = sample_rows)
#> # A tibble: 3 x 1
#>   .pred_class
#>   <fct>
#> 1 setosa
#> 2 versicolor
#> 3 virginica

predict(bt_fit, new_data = sample_rows, type = "prob")
#> # A tibble: 3 x 3
#>   .pred_setosa .pred_versicolor .pred_virginica
#>          <dbl>            <dbl>           <dbl>
#> 1        0.997          0.002            0.001
#> 2        0.002          0.991            0.007
#> 3        0.001          0.013            0.986
```

The probability columns are named `.pred_<class>` and each row sums to one. Probabilities come from the summed tree scores passed through a softmax, which makes them useful for ranking or for a custom decision threshold.

### Example 3: Fit a regression model on mtcars

**Switch the mode to "regression" and the same function predicts a number.** Nothing else about the call changes.

```r title="Fit a boosted regression model on mtcars"
bt_reg <- boost_tree(trees = 200, learn_rate = 0.05, tree_depth = 3) |>
  set_engine("xgboost") |>
  set_mode("regression")

bt_reg_fit <- bt_reg |>
  fit(mpg ~ ., data = mtcars)

predict(bt_reg_fit, new_data = mtcars[1:3, ])
#> # A tibble: 3 x 1
#>   .pred
#>   <dbl>
#> 1  21.3
#> 2  21.0
#> 3  24.8
```

The regression model predicts miles per gallon directly. A shallow `tree_depth` of 3 paired with a small `learn_rate` keeps each round modest, which guards a 32-row dataset against overfitting.

[TIP]
**Pair a low learn_rate with more trees, not fewer.** Shrinking the learning rate makes each tree contribute less, so the ensemble needs more rounds to converge. A common starting point is `learn_rate = 0.05` to `0.1` with `trees` between 200 and 1000, then tune both together.

### Example 4: Rank predictors by importance

**The xgboost engine stores an importance table you can read straight from the fit.** Call `xgb.importance()` on the underlying engine object.

```r title="Rank iris predictors by xgboost importance"
library(xgboost)

imp_fit <- boost_tree(trees = 300, learn_rate = 0.1) |>
  set_engine("xgboost") |>
  set_mode("classification") |>
  fit(Species ~ ., data = iris)

xgb.importance(model = imp_fit$fit)
#>         Feature   Gain  Cover Frequency
#> 1: Petal.Length 0.6841 0.5523    0.4012
#> 2:  Petal.Width 0.2796 0.3134    0.3188
#> 3: Sepal.Length 0.0241 0.0876    0.1554
#> 4:  Sepal.Width 0.0122 0.0467    0.1246
```

Petal length and petal width dominate the `Gain` column, which matches the known biology of the iris dataset. The `imp_fit$fit` object is the raw xgboost booster, so any xgboost helper works on it directly.

## Compare boost_tree() engines

**boost_tree() runs on several engines that share the same code.** You swap engines with one `set_engine()` call, and parsnip translates the hyperparameters to each backend.

| Engine | Package | Strengths | Use when |
|---|---|---|---|
| `xgboost` | xgboost | Fast, regularized, default | Almost always; the standard choice |
| `C5.0` | C50 | Boosted C5.0 rules, classification only | You need rule-based, interpretable trees |
| `lightgbm` | bonsai, lightgbm | Leaf-wise growth, very fast on wide data | Many features or large row counts |
| `h2o` | h2o, agua | Scales beyond memory | Data is too large for one machine |
| `spark` | sparklyr | Distributed training | Data already lives in a Spark cluster |

The decision rule is simple. Use `xgboost` unless you have a specific reason not to, switch to `C5.0` when you want interpretable boosted rules, and reach for `lightgbm` when training speed on wide data matters.

## Common pitfalls

**Three mistakes catch most newcomers to boost_tree().** Each one below shows the problem and the fix.

The most common is forgetting to set the mode. A boosted model can classify or predict a number, so parsnip cannot guess which one you want and `fit()` fails until you call `set_mode()`.

```r title="Mode must be set before fitting"
# Wrong: no mode, fit() cannot dispatch
boost_tree(trees = 200) |>
  set_engine("xgboost") |>
  fit(Species ~ ., data = iris)
#> Error: Please set the mode in the model specification.

# Right: set the mode first
boost_tree(trees = 200) |>
  set_engine("xgboost") |>
  set_mode("classification") |>
  fit(Species ~ ., data = iris)
```

The second pitfall is using the `C5.0` engine for regression. C5.0 only builds classification trees, so a `set_mode("regression")` specification with that engine errors before training starts. The third is leaving `learn_rate` at a high value with many trees, which lets the ensemble memorize noise.

[WARNING]
**A high learn_rate with many trees overfits fast.** Each tree corrects the last, so a large step size combined with hundreds of rounds drives training error to zero while test error climbs. Lower `learn_rate`, cap `trees`, or set `stop_iter` so early stopping halts the run once gains stall.

## Try it yourself

**Try it:** Fit a classification model on `iris` with 200 trees, `learn_rate = 0.1`, and `tree_depth = 3`, then predict the class for the 120th row. Save the prediction to `ex_pred`.

```r title="Your turn: classify iris with boost_tree"
# Try it: fit a 200-round boosted model, then predict row 120
ex_spec <- # your code here
ex_fit  <- # your code here
ex_pred <- # your code here

ex_pred
#> Expected: a 1-row tibble with .pred_class = virginica
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_spec <- boost_tree(trees = 200, learn_rate = 0.1, tree_depth = 3) |>
  set_engine("xgboost") |>
  set_mode("classification")

ex_fit <- ex_spec |>
  fit(Species ~ ., data = iris)

ex_pred <- predict(ex_fit, new_data = iris[120, ])
ex_pred
#> # A tibble: 1 x 1
#>   .pred_class
#>   <fct>
#> 1 virginica
```

**Explanation:** The `trees`, `learn_rate`, and `tree_depth` arguments shape the boosting run, while `set_mode("classification")` tells parsnip to predict the `Species` factor. Row 120 of iris is a virginica flower, so the trained model assigns that class.

</details>

## Related parsnip functions

**boost_tree() works alongside the rest of the parsnip model family.** These functions cover the neighboring tasks in a tidymodels project.

- `rand_forest()` defines a random forest, an ensemble of independent trees.
- `decision_tree()` defines a single classification or regression tree.
- `bag_tree()` defines a bagged tree ensemble without boosting.
- `set_engine()` chooses the computational backend for any specification.
- `fit()` trains a specification on data and returns a model object.

## FAQ

**What package is boost_tree() in?**

`boost_tree()` ships in core parsnip, so `library(tidymodels)` or `library(parsnip)` makes it available. The function only describes the model, though, and the actual fitting happens in an engine package. The default `xgboost` engine needs the `xgboost` package, and `set_engine("C5.0")` needs the `C50` package installed separately.

**What is the difference between boost_tree() and rand_forest()?**

Both build tree ensembles, but they grow trees differently. `rand_forest()` grows many trees independently on bootstrap samples and averages them to lower variance. `boost_tree()` grows trees in sequence, where each tree corrects the errors of the ones before it, which lowers bias. Boosting often reaches higher accuracy but is more sensitive to its `learn_rate` and `trees` settings.

**What engine does boost_tree() use by default?**

The default engine is `xgboost`, a fast, regularized C++ implementation of gradient boosting. You can confirm or change it with `set_engine()`, and `show_engines("boost_tree")` lists every registered option. Most projects keep xgboost because it is quick and well tuned, switching only for interpretable rules or distributed scaling.

**How do I tune learn_rate and trees in boost_tree()?**

Set the arguments to `tune()`, as in `boost_tree(trees = tune(), learn_rate = tune())`, then pass the specification to `tune_grid()` with a resampling object such as `vfold_cv()`. The framework searches a grid of values and scores each with cross-validation. Use `select_best()` to pick the winner, then `finalize_workflow()` to lock the values before the final fit.

**Does boost_tree() handle early stopping?**

Yes, through the `stop_iter` argument. Setting `stop_iter = 20` tells the xgboost engine to stop adding trees once 20 consecutive rounds bring no improvement on a validation split. Early stopping protects against overfitting and saves compute, which makes it a good default companion to a low `learn_rate`.

For the full argument reference, see the [parsnip boost_tree() documentation](https://parsnip.tidymodels.org/reference/boost_tree.html).
