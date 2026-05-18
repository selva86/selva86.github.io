---
title: "parsnip mlp() in R: Single-Layer Neural Network Spec"
slug: parsnip-mlp-in-R
description: "parsnip mlp() in R defines a single-layer neural network for tidymodels. Covers syntax, the nnet engine, hidden_units, penalty, epochs, and model tuning."
keywords: "parsnip mlp, mlp function R, parsnip mlp examples, neural network tidymodels R, mlp model spec R, tidymodels neural network, parsnip nnet engine"
mathjax: false
webr: true
date: "2026-05-18"
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "mlp()|parsnip mlp|parsnip::mlp()|multilayer perceptron|neural network in R"
auto_link_case_sensitive: true
target_keyword: "parsnip mlp"
sibling_block_enabled: true
difficulty: Beginner
---

# parsnip mlp() in R: Single-Layer Neural Network Spec

<p class="lead">The parsnip <code>mlp()</code> function defines a single-layer neural network, a multilayer perceptron, for classification or regression in tidymodels. It gives you one interface to a feed-forward net with a hidden layer of units, fitted with the nnet engine underneath.</p>

[QUICK ANSWER]
mlp()                                  # default spec, nnet engine
mlp() |> set_mode("classification")    # classify a factor outcome
mlp() |> set_mode("regression")        # predict a numeric outcome
mlp(hidden_units = 5)                  # 5 units in the hidden layer
mlp(penalty = 0.01)                    # weight decay to curb overfitting
mlp(epochs = 100)                      # number of training iterations
fit(spec, Species ~ ., data = iris)    # train the spec on data

[DECISION TREE: Is mlp() the right tool?]
- fit a single-layer neural net: mlp() |> set_mode("classification")
- predict a number with a net: mlp() |> set_mode("regression")
- a tree-based ensemble instead: rand_forest() |> set_engine("ranger")
- gradient-boosted trees: boost_tree() |> set_engine("xgboost")
- a linear baseline first: logistic_reg() |> set_engine("glm")
- tune the hidden layer size: mlp(hidden_units = tune())

## What mlp() does

**mlp() is a model specification, not a fitted model.** It records your intent to build a multilayer perceptron and the hyperparameters you want, but no data touches it until you call `fit()`. That separation lets you reuse one specification across many datasets or resampling folds.

A multilayer perceptron is a feed-forward neural network. The parsnip `mlp()` function builds the single-hidden-layer version: inputs feed a layer of hidden units, and those units feed the output. The hidden layer is what lets the model learn non-linear patterns that a plain linear model cannot.

The function belongs to the tidymodels framework. Because parsnip standardizes the interface, the same `mlp()` code drops straight into a `workflow()` or a `tune_grid()` call without rewriting.

[KEY INSIGHT]
**A parsnip spec is a recipe for a model, not the model itself.** You build the specification once, then `fit()` turns it into a trained network. Keeping those two steps apart is what makes tidymodels workflows reproducible across resamples.

[NOTE]
**mlp() ships in core parsnip, but the engine does not.** The default engine is `nnet`, a recommended R package that is usually already installed. Other engines such as `brulee`, `keras`, and `h2o` need their own packages before you can `fit()` with them.

## mlp() syntax and arguments

**mlp() takes up to six hyperparameters plus two setup verbs.** The arguments shape the network, while `set_engine()` and `set_mode()` finish the specification.

```r title="The mlp specification skeleton"
library(tidymodels)

mlp(
  mode = "unknown",      # set to "classification" or "regression"
  engine = "nnet",       # nnet is the default engine
  hidden_units = NULL,   # number of units in the hidden layer
  penalty = NULL,        # weight decay, larger values regularize more
  dropout = NULL,        # proportion of weights zeroed (not used by nnet)
  epochs = NULL,         # number of training iterations
  activation = NULL,     # hidden-layer activation (engine dependent)
  learn_rate = NULL      # step size for gradient updates
)
```

The `hidden_units` argument sets how many neurons live in the hidden layer, where more units add capacity but risk overfitting. The `penalty` argument applies weight decay, a regularization term that shrinks weights toward zero. The `epochs` argument caps how many passes the optimizer makes over the data.

**Not every argument applies to every engine.** The default `nnet` engine uses `hidden_units`, `penalty`, and `epochs`, but ignores `dropout` and `learn_rate`. Those belong to the `brulee` and `keras` engines. Setting an unused argument is harmless, parsnip just drops it.

## Fit a neural network: four examples

**Every example below uses a built-in R dataset.** The `iris` data drives the classification examples and `mtcars` drives the regression example, so the code runs anywhere with no downloads.

### Example 1: Classify iris with the nnet engine

**Build the specification, then fit it to data.** The nnet engine trains a small network to separate the three iris species.

```r title="Fit mlp on the iris data"
mlp_spec <- mlp(hidden_units = 5, penalty = 0.01, epochs = 100) |>
  set_engine("nnet") |>
  set_mode("classification")

mlp_fit <- mlp_spec |>
  fit(Species ~ ., data = iris)

mlp_fit
#> parsnip model object
#>
#> a 4-5-3 network with 43 weights
#> inputs: Sepal.Length Sepal.Width Petal.Length Petal.Width
#> output(s): ..y
#> options were - softmax modelling  decay=0.01
```

The `4-5-3 network` line confirms the shape: four input predictors, five hidden units, three output classes. The 43 weights are the parameters the optimizer learned during the 100 epochs.

### Example 2: Predict classes and probabilities

**predict() returns a tidy tibble with one row per input row.** Use `type = "prob"` to get per-class probabilities instead of the hard label.

```r title="Predict iris species and class probabilities"
sample_rows <- iris[c(1, 70, 130), ]

predict(mlp_fit, new_data = sample_rows)
#> # A tibble: 3 x 1
#>   .pred_class
#>   <fct>
#> 1 setosa
#> 2 versicolor
#> 3 virginica

predict(mlp_fit, new_data = sample_rows, type = "prob")
#> # A tibble: 3 x 3
#>   .pred_setosa .pred_versicolor .pred_virginica
#>          <dbl>            <dbl>           <dbl>
#> 1        0.99             0.01            0.00
#> 2        0.01             0.97            0.02
#> 3        0.00             0.03            0.97
```

The probability columns are named `.pred_<class>` and each row sums to one. They come from the softmax output layer, useful for ranking predictions or applying a custom decision threshold.

### Example 3: Fit a neural network regression on mtcars

**Switch the mode to "regression" and the same function predicts a number.** Nothing else about the call structure changes.

```r title="Fit an mlp regression model on mtcars"
mlp_reg <- mlp(hidden_units = 3, penalty = 0.1, epochs = 200) |>
  set_engine("nnet") |>
  set_mode("regression")

mlp_reg_fit <- mlp_reg |>
  fit(mpg ~ ., data = mtcars)

predict(mlp_reg_fit, new_data = mtcars[c(1, 15, 30), ])
#> # A tibble: 3 x 1
#>   .pred
#>   <dbl>
#> 1  21.3
#> 2  14.9
#> 3  19.0
```

A regression network outputs a single numeric value per row in the `.pred` column. With raw `mtcars` predictors, keep `hidden_units` small so the tiny dataset does not overfit.

[TIP]
**Tune hidden_units and penalty with cross-validation rather than guessing.** The best network size depends on the data, so set both to `tune()` and let `tune_grid()` score a range on resamples. A small grid of 1 to 10 hidden units is a sensible start.

### Example 4: Mark hyperparameters for tuning

**Pass tune() instead of a value to defer a hyperparameter.** The specification stays valid and prints the placeholders so you can confirm what will be searched.

```r title="A tunable mlp specification"
mlp_tune <- mlp(hidden_units = tune(), penalty = tune()) |>
  set_engine("nnet") |>
  set_mode("classification")

mlp_tune
#> Single Layer Neural Network Model Specification (classification)
#>
#> Main Arguments:
#>   hidden_units = tune()
#>   penalty = tune()
#>
#> Computational engine: nnet
```

This specification is not fitted yet. You hand it to `tune_grid()` with a resampling object such as `vfold_cv()`, and the framework fills in the best `hidden_units` and `penalty` from cross-validation.

## Compare mlp() engines

**The engine decides which backend trains the network.** All engines share the `mlp()` interface, so you swap them with one `set_engine()` call and keep the rest of the specification.

| Engine | Backend | Use when |
|---|---|---|
| `nnet` | Base recommended package | You want a fast, dependency-free default |
| `brulee` | Torch via the brulee package | You need dropout, learn_rate, and GPU support |
| `keras` | TensorFlow through keras | You already work in the Keras ecosystem |
| `h2o` | The h2o cluster engine | You train large data on an h2o backend |

The decision rule is simple. Start with `nnet` for a quick baseline, move to `brulee` when you need modern training controls like dropout, and reach for `keras` or `h2o` only when an existing stack or data size demands it.

## Common pitfalls

**Three mistakes catch most newcomers to mlp().** Each one below shows the problem and the fix.

The most common is forgetting to set the mode. A neural network can classify or predict a number, so parsnip cannot guess which one you want and `fit()` fails until you call `set_mode()`.

```r title="Mode must be set before fitting"
# Wrong: no mode, fit() cannot dispatch
mlp(hidden_units = 5) |>
  set_engine("nnet") |>
  fit(Species ~ ., data = iris)
#> Error: Please set the mode in the model specification.

# Right: set the mode first
mlp(hidden_units = 5) |>
  set_engine("nnet") |>
  set_mode("classification") |>
  fit(Species ~ ., data = iris)
```

The second pitfall is leaving predictors on different scales. A neural network is sensitive to input magnitude, so a wide-range column dominates training. In a `workflow()`, add `step_normalize()` to a recipe so every predictor is centered and scaled. The third is asking the `nnet` engine for too many weights, since it caps the network size and errors with `too many weights` when `hidden_units` is large.

[WARNING]
**A neural network gives different results across runs unless you set a seed.** Weight initialization is random, so two fits of the same `mlp()` specification can disagree. Call `set.seed()` before `fit()` to make the network reproducible.

## Try it yourself

**Try it:** Fit a classification network on `iris` with 4 hidden units and `penalty = 0.05`, then predict the class for the 120th row. Save the prediction to `ex_pred`.

```r title="Your turn: classify iris with mlp"
# Try it: fit a 4-unit mlp, then predict row 120
ex_spec <- # your code here
ex_fit  <- # your code here
ex_pred <- # your code here

ex_pred
#> Expected: a 1-row tibble with .pred_class = virginica
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)

ex_spec <- mlp(hidden_units = 4, penalty = 0.05, epochs = 100) |>
  set_engine("nnet") |>
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

**Explanation:** The `hidden_units` argument sizes the hidden layer at 4, and `set_mode("classification")` tells parsnip to predict the `Species` factor. Row 120 of iris is a virginica flower, so the trained network labels it virginica.

</details>

## Related parsnip functions

**mlp() works alongside the rest of the parsnip model family.** These functions cover the neighboring tasks in a tidymodels project.

- `rand_forest()` defines a random forest ensemble of decision trees.
- `boost_tree()` defines a gradient-boosted tree model.
- `logistic_reg()` defines a logistic regression classifier baseline.
- `set_engine()` chooses the computational backend for any specification.
- `fit()` trains a specification on data and returns a model object.

## FAQ

**What package is mlp() in?**

`mlp()` ships in core parsnip, so `library(tidymodels)` or `library(parsnip)` makes it available. The function only describes the network, though, and the actual fitting happens in an engine package. The default engine is `nnet`, a recommended R package that is usually installed already, so most users can fit an `mlp()` specification without installing anything extra.

**What is the default engine for mlp()?**

The default engine is `nnet`, which fits a single-hidden-layer neural network in base R. Name it explicitly with `set_engine("nnet")` for clarity. To see every registered backend, run `show_engines("mlp")`, which lists `nnet`, `brulee`, `keras`, `h2o`, and a few others. Pick `nnet` for a fast baseline and switch only when you need a specific feature.

**How many hidden layers does mlp() support?**

The parsnip `mlp()` function builds a single hidden layer, which is what makes it a classic multilayer perceptron. For two hidden layers, parsnip provides `mlp(engine = "brulee_two_layer")`. Deeper architectures are outside the parsnip interface and call for `keras` or `torch` directly.

**How do I tune the network size in mlp()?**

Set `hidden_units = tune()` and `penalty = tune()` in the specification, then pass it to `tune_grid()` with a resampling object such as `vfold_cv()`. The framework scores each combination with cross-validation. Use `select_best()` to pick the winner, then `finalize_workflow()` to lock the values before the final fit.

**Why do my mlp() predictions change every run?**

A neural network starts from random weights, so each fit can land on a different solution. Call `set.seed()` immediately before `fit()` to make the result reproducible. Inside a tuning workflow, the resampling object also carries a seed, so set it once at the top of the script for consistent runs.

For the full argument reference, see the [parsnip mlp() documentation](https://parsnip.tidymodels.org/reference/mlp.html).
