---
title: "parsnip bart() in R: Bayesian Additive Regression Trees"
slug: parsnip-bart-in-R
description: "Learn how parsnip bart() defines Bayesian Additive Regression Tree models in R. Load the dbarts engine, set trees and priors, then fit and predict with code."
keywords: "parsnip bart, bart function R, parsnip bart examples, BART model R, Bayesian additive regression trees R, bart tidymodels, dbarts engine"
mathjax: false
webr: true
date: 2026-05-18
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "bart()|parsnip bart|parsnip::bart()|Bayesian additive regression trees|BART model"
auto_link_case_sensitive: true
target_keyword: parsnip bart
sibling_block_enabled: true
difficulty: Beginner
---

# parsnip bart() in R: Bayesian Additive Regression Trees

<p class="lead">The parsnip bart() function defines a Bayesian Additive Regression Trees model in R, an additive ensemble of shallow trees fitted with Bayesian sampling instead of a tuned learning rate.</p>

[QUICK ANSWER]
bart()                                       # bare spec, mode unset
bart(mode = "regression")                    # set mode inline
bart(trees = 50)                             # number of trees in ensemble
bart(prior_terminal_node_coef = 0.95)        # prior depth penalty base
bart(prior_terminal_node_expo = 2)           # prior depth penalty exponent
bart() |> set_engine("dbarts")               # the only engine
bart() |> set_mode("classification")         # binary classification BART

[DECISION TREE: Is bart() the right tool?]
- Bayesian tree ensemble with uncertainty: bart() |> set_engine("dbarts")
- sequential boosted trees: boost_tree()
- bagged de-correlated trees: rand_forest()
- one interpretable tree: decision_tree()
- bagged plain trees: bag_tree()
- straight-line numeric outcome: linear_reg()

## What bart() does

**bart() declares a Bayesian tree ensemble, it does not train one.** The function returns a parsnip model specification, an engine-agnostic description of a Bayesian Additive Regression Trees model. BART sums many shallow trees, but unlike boosting it fits them with Markov chain Monte Carlo sampling. No data touches the spec until you call `fit()`.

Each tree in a BART ensemble is deliberately weak. The model adds their predictions together, and a prior pulls every tree toward being small so no single tree dominates. The Bayesian fitting step then explores many tree structures and averages over them, which gives you a prediction plus a natural sense of its uncertainty.

[KEY INSIGHT]
**BART is boosting with a Bayesian prior instead of a learning rate.** Gradient boosting controls overfitting with a step size you tune by hand. BART controls it with a prior that keeps every tree shallow, then samples the ensemble with MCMC. You get regularization without a learning-rate grid, plus posterior intervals for free.

## bart() syntax and arguments

**bart() takes a tree count and three prior controls.** The constructor lives in parsnip, but the fitting backend comes from the dbarts package. Load dbarts, or the fit fails with a missing-package error.

| Argument | What it controls | Typical value |
|---|---|---|
| `trees` | Number of trees in the ensemble | 50 to 200 |
| `prior_terminal_node_coef` | Base of the prior that favors shallow trees | 0.95 |
| `prior_terminal_node_expo` | Exponent of that depth prior | 2 |
| `prior_outcome_range` | Width of the prior on the outcome scale | 2 |

You build a spec by piping the constructor into `set_engine()` and `set_mode()`. dbarts is the only engine, and BART supports both regression and classification modes.

```r title="Define a BART model spec"
library(parsnip)

bart_spec <- bart(trees = 50) |>
  set_engine("dbarts") |>
  set_mode("regression")

bart_spec
#> BART Model Specification (regression)
#>
#> Main Arguments:
#>   trees = 50
#>
#> Computational engine: dbarts
```

The printed spec lists your tree count and engine. Nothing is fitted yet, so the object stays cheap to copy and reuse across experiments.

## Fit a BART model: regression and classification

**The same spec fits regression and classification by switching the mode.** Pass a formula and a data frame to `fit()`, then call `predict()` on new rows. Here is a BART regression ensemble on the built-in `mtcars` dataset.

```r title="Fit a BART regression model"
set.seed(42)
bart_fit <- bart_spec |>
  fit(mpg ~ ., data = mtcars)

predict(bart_fit, mtcars[1:3, ])
#> # A tibble: 3 x 1
#>   .pred
#>   <dbl>
#> 1  21.8
#> 2  21.3
#> 3  25.6
```

BART regression returns a tidy tibble with a `.pred` column. Because the fit uses MCMC sampling, set a seed first so the predictions reproduce on the next run.

For a categorical target, rebuild the spec in classification mode. The dbarts engine handles binary classification, so drop one `iris` species to get a clean two-class problem.

```r title="Fit a BART classification model"
iris2 <- subset(iris, Species != "setosa")
iris2$Species <- factor(iris2$Species)

bart_clf <- bart(trees = 50) |>
  set_engine("dbarts") |>
  set_mode("classification") |>
  fit(Species ~ ., data = iris2)

predict(bart_clf, iris2[c(1, 60), ])
#> # A tibble: 2 x 1
#>   .pred_class
#>   <fct>
#> 1 versicolor
#> 2 virginica
```

[NOTE]
**The dbarts engine does binary classification only.** A BART classification spec expects a two-level factor outcome. For three or more classes, fit one model per class or reach for `rand_forest()` or `boost_tree()`, which handle multiclass targets directly.

Classification predictions come back as `.pred_class`. Ask for `type = "prob"` to see the posterior class probabilities, which is where BART's Bayesian fitting really shows.

```r title="Predict class probabilities"
predict(bart_clf, iris2[c(1, 60), ], type = "prob")
#> # A tibble: 2 x 2
#>   .pred_versicolor .pred_virginica
#>              <dbl>           <dbl>
#> 1            0.962          0.0380
#> 2            0.041          0.959
```

The probability columns are posterior means across the MCMC samples, so they carry the model's uncertainty rather than a single hard split.

## Tune the priors and tree count

**The priors decide how hard BART regularizes.** `trees` sets the ensemble size, and the two `prior_terminal_node` arguments shape how deep each tree is allowed to grow. A larger `prior_terminal_node_coef` and a smaller `prior_terminal_node_expo` permit deeper trees.

```r title="Adjust the terminal node prior"
deep_spec <- bart(
  trees = 200,
  prior_terminal_node_coef = 0.95,
  prior_terminal_node_expo = 2
) |>
  set_engine("dbarts") |>
  set_mode("regression")

deep_spec
#> BART Model Specification (regression)
#>
#> Main Arguments:
#>   trees = 200
#>   prior_terminal_node_coef = 0.95
#>   prior_terminal_node_expo = 2
#>
#> Computational engine: dbarts
```

More trees give the ensemble more capacity, but BART rarely overfits because the depth prior keeps each tree small. A count of 50 works for quick fits, while 200 is a common default for a final model.

[TIP]
**Tune trees with the dials package, not by hand.** The `trees` argument is taggable for tuning. Pair `bart(trees = tune())` with `tune_grid()` and a `trees()` parameter range to let cross-validation pick the count instead of guessing.

## bart() vs boost_tree() vs rand_forest()

**All three are tree ensembles, but they assemble the trees differently.** Boosting adds trees sequentially to fix earlier errors. A random forest grows independent trees and averages them. BART sums shallow trees and fits them with Bayesian sampling.

| Model | How it builds trees | Tuning effort | Uncertainty estimates |
|---|---|---|---|
| `boost_tree()` | Sequential, each fixes the last | High, needs a learning rate | None by default |
| `rand_forest()` | Independent trees, averaged | Low | None by default |
| `bart()` | Additive shallow trees, MCMC-fitted | Low, priors self-regularize | Posterior intervals |

The decision rule is short. Use `boost_tree()` when you can afford to tune for peak accuracy. Use `rand_forest()` for a strong, low-effort baseline. Use `bart()` when you want competitive accuracy and honest uncertainty without a tuning grid.

## Common pitfalls

**Most bart() errors trace back to the missing dbarts package.** The constructor is in parsnip, but the engine is not. Calling `fit()` without dbarts installed raises a package error.

```r title="Fitting without dbarts installed fails"
library(parsnip)

bart() |>
  set_engine("dbarts") |>
  set_mode("regression") |>
  fit(mpg ~ ., data = mtcars)
#> Error: The package "dbarts" is required but not installed.
#> Please install it with install.packages("dbarts").
```

Install dbarts and the fit succeeds. Two more traps to watch:

- BART fitting uses MCMC, so results shift between runs. Always call `set.seed()` before `fit()` to make predictions reproducible.
- A multiclass factor outcome fails, because the dbarts engine is binary only. Collapse the target to two levels or switch models.

[WARNING]
**BART is slower than a random forest on large data.** The MCMC sampler iterates over every tree many times, so a fit that takes seconds with `rand_forest()` can take minutes with `bart()`. Start with a small `trees` value and a data sample while prototyping.

## Try it yourself

**Try it:** Build a BART regression model with 100 trees, fit it to predict `hp` from all columns of `mtcars`, and save the fitted model to `ex_bart_fit`.

```r title="Your turn: fit a BART regression model"
# Try it: build and fit a BART regression model
ex_bart_fit <- # your code here

ex_bart_fit
#> Expected: a parsnip BART model fit object
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_bart_fit <- bart(trees = 100) |>
  set_engine("dbarts") |>
  set_mode("regression") |>
  fit(hp ~ ., data = mtcars)

class(ex_bart_fit)
#> [1] "_bart"     "model_fit"
```

**Explanation:** The spec sets `trees = 100`, `set_engine("dbarts")` picks the only BART backend, `set_mode("regression")` declares a numeric outcome, and `fit()` runs the MCMC sampler on `mtcars`. The result is a parsnip `model_fit` wrapping a dbarts object.

</details>

## Related parsnip functions

**bart() is one model in a family of parsnip specifications.** When a Bayesian ensemble is not the right fit, these neighbors share the same `set_engine()` and `fit()` workflow:

- `boost_tree()` builds trees sequentially with gradient boosting.
- `rand_forest()` averages many de-correlated trees.
- `decision_tree()` builds one interpretable tree.
- `bag_tree()` averages bagged trees to cut variance.
- `set_engine()` chooses the computational backend for any spec.

See the [tidymodels bart reference](https://parsnip.tidymodels.org/reference/bart.html) for the full argument list and engine details.

## FAQ

**What package provides bart() in R?**
The `bart()` constructor is exported by the parsnip package, but its fitting engine comes from the dbarts package. You need both: parsnip defines the engine-agnostic model spec, and dbarts implements the actual Bayesian sampler. Loading `library(tidymodels)` attaches parsnip, but dbarts is a separate install, so run `install.packages("dbarts")` once and load it before you fit.

**What is the dbarts engine?**
dbarts is the discrete Bayesian Additive Regression Trees package, and it is the only engine parsnip registers for `bart()`. It runs the MCMC sampler that draws tree structures and leaf values from the posterior. The engine handles regression and binary classification. Any engine-specific control, such as the number of MCMC samples to keep, is passed through `set_engine("dbarts", ...)`.

**How many trees should I use in a BART model?**
The `trees` argument sets the ensemble size. BART rarely overfits when you add trees, because the depth prior keeps each one shallow, so more trees mainly cost compute. A value of 50 is fine for quick experiments, and 200 is a widely used default for a final model. Tune it with `tune_grid()` if accuracy matters and the dataset is small enough to resample.

**Is BART better than random forest or boosting?**
BART is competitive with both and often wins on tabular data with moderate sample sizes. Its edge is built-in regularization and posterior uncertainty, so you get prediction intervals without extra work. The cost is speed, since MCMC sampling is slower than a random forest. Choose BART when calibrated uncertainty matters, and choose boosting when you need the last bit of accuracy and can tune for it.
