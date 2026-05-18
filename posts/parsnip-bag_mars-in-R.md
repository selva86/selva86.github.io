---
title: "parsnip bag_mars() in R: Build Bagged MARS Models"
slug: "parsnip-bag_mars-in-R"
description: "Learn how parsnip bag_mars() builds bagged MARS ensembles in R. Load the baguette engine, fit regression and classification models, and read importance."
keywords: "bag_mars, bag_mars R, baguette bag_mars, bagged MARS R, bag_mars tidymodels, bag_mars example, parsnip bag_mars"
mathjax: false
webr: true
date: "2026-05-18"
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: "tidymodels-Exercises-in-R.html"
auto_link_terms: "bag_mars()|parsnip bag_mars|baguette::bag_mars()|bagged MARS|bagged MARS ensemble"
auto_link_case_sensitive: true
target_keyword: "bag_mars"
sibling_block_enabled: true
difficulty: Intermediate
---

# parsnip bag_mars() in R: Build Bagged MARS Models

<p class="lead">bag_mars() defines a bagged ensemble of MARS (Multivariate Adaptive Regression Splines) models in R. It fits many MARS models on bootstrap samples and averages them, which trims the variance of a single spline fit.</p>

[QUICK ANSWER]
bag_mars(mode = "regression")                   # regression ensemble
bag_mars(mode = "classification")               # classification ensemble
bag_mars() |> set_engine("earth")               # set the engine
bag_mars() |> set_engine("earth", times = 25)   # 25 bagged members
bag_mars(prod_degree = 2)                        # allow 2-way interactions
bag_mars(num_terms = 10)                         # cap retained model terms
bag_mars(prune_method = "none")                  # skip backward pruning
fit(spec, mpg ~ ., data = mtcars)                # fit the spec

[DECISION TREE: Is bag_mars() the right tool?]
- nonlinear fit, want a stable ensemble: bag_mars(mode = "regression")
- single MARS model, easier to read: mars(mode = "regression")
- bagged decision trees instead: bag_tree(mode = "regression")
- random forest of trees: rand_forest(trees = 500)
- gradient boosted trees: boost_tree(mode = "regression")
- plain linear relationship: linear_reg()

## What bag_mars() does

**bag_mars() wraps MARS in a bagging ensemble.** A single MARS model builds piecewise-linear hinge functions to capture nonlinear relationships, but it can be unstable: small changes in the data shift the chosen knots. Bagging fixes that by fitting the model on many bootstrap resamples and averaging the predictions.

The function comes from the **baguette** package, a parsnip extension. It returns a model specification, not a fitted model, so you pair it with `set_engine()` and `fit()` like any other parsnip spec. The only engine is `earth`, the package that implements MARS.

[NOTE]
**baguette is a separate install.** bag_mars() lives in the baguette package, not parsnip itself. Run `install.packages("baguette")` and load it with `library(baguette)` before defining a spec, or parsnip cannot find the model.

## bag_mars() syntax and arguments

**The signature has four model arguments plus an engine.** Every argument defaults to `NULL`, which means the underlying `earth` engine picks a sensible value.

```r title="bag_mars signature"
bag_mars(
  mode = "unknown",
  num_terms = NULL,
  prod_degree = NULL,
  prune_method = NULL,
  engine = "earth"
)
```

| Argument | What it controls |
|---|---|
| `mode` | `"regression"` or `"classification"`. Required before fitting. |
| `num_terms` | Number of model terms (hinge functions) kept in each member. |
| `prod_degree` | Highest interaction degree: 1 is additive, 2 allows pairwise terms. |
| `prune_method` | Pruning passed to earth, such as `"backward"` or `"none"`. |
| `engine` | Always `"earth"`. The number of bagged members is set here. |

The count of bagged models is not a main argument. You pass it to `set_engine()` as `times`, which defaults to 11.

## Fit a bagged MARS model: regression and classification

**Build the spec, set the engine, then call fit().** This regression example predicts `mpg` from every other column of `mtcars` using a 25-member ensemble.

```r title="Fit a regression ensemble"
library(tidymodels)
library(baguette)

bag_spec <- bag_mars(mode = "regression") |>
  set_engine("earth", times = 25)

mars_fit <- bag_spec |>
  fit(mpg ~ ., data = mtcars)

predict(mars_fit, new_data = mtcars[1:3, ])
#> # A tibble: 3 x 1
#>   .pred
#>   <dbl>
#> 1  22.3
#> 2  22.1
#> 3  25.9
```

Switching to classification needs only a different `mode`. The `earth` engine handles factor outcomes by fitting a generalized linear model on the spline basis.

```r title="Fit a classification ensemble"
cls_fit <- bag_mars(mode = "classification") |>
  set_engine("earth", times = 25) |>
  fit(Species ~ ., data = iris)

predict(cls_fit, new_data = iris[c(1, 60, 120), ])
#> # A tibble: 3 x 1
#>   .pred_class
#>   <fct>
#> 1 setosa
#> 2 versicolor
#> 3 virginica
```

[KEY INSIGHT]
**Bagging buys stability, not a new model class.** Each ensemble member is still a MARS model. Averaging 25 of them cancels the knot-placement noise of any single fit, so predictions move less when the training data changes.

## Read aggregated variable importance

**baguette aggregates importance across every member.** The fitted object stores a tidy table at `$fit$imp`, with the mean importance and its standard error over the bootstrap members.

```r title="Aggregated variable importance"
mars_fit$fit$imp
#> # A tibble: 10 x 4
#>   term  value std.error  used
#>   <chr> <dbl>     <dbl> <int>
#> 1 wt     61.2      2.84    25
#> 2 disp   24.7      3.10    22
#> 3 hp     18.5      2.41    19
#> 4 qsec    9.3      1.88    14
#> 5 am      4.1      1.02     8
```

The `used` column counts how many of the 25 members kept that predictor. A variable used in only a few members is a weak signal worth dropping.

## bag_mars() vs mars() vs rand_forest()

**Choose bag_mars() when a single MARS fit is too jumpy.** All three handle nonlinear relationships, but they trade interpretability for stability differently.

| Model | Captures nonlinearity by | Best when |
|---|---|---|
| `mars()` | Hinge functions, one model | You want a readable, fast spline model |
| `bag_mars()` | Bagging many MARS fits | Single MARS is unstable on your data |
| `rand_forest()` | Bagging many decision trees | Relationships are step-like or high-order |

If a plain `mars()` model already gives stable cross-validated error, the ensemble adds compute for little gain. Reach for `bag_mars()` when resampling shows the single fit swinging between folds.

## Common pitfalls

**Three mistakes account for most bag_mars() errors.** Each has a quick fix.

- **Forgetting baguette.** `library(baguette)` must run before `bag_mars()`. Loading only `tidymodels` triggers a "could not find function" error.
- **Setting times in the wrong place.** `times` is an engine argument. Pass it inside `set_engine("earth", times = 25)`, not inside `bag_mars()`.
- **Skipping the mode.** A spec left at `mode = "unknown"` fails at `fit()`. Set `mode = "regression"` or `mode = "classification"` explicitly.

[WARNING]
**More members is not always better.** Past roughly 25 to 50 members the variance reduction flattens while fit time keeps climbing. Tune `times` on a resample rather than setting it to a large number by reflex.

## Try it yourself

**Try it:** Fit a 30-member bagged MARS regression on `mtcars` predicting `hp` from `disp`, `wt`, and `cyl`. Save the fitted model to `ex_fit`.

```r title="Your turn: bagged MARS on mtcars"
# Try it: build, set engine, fit
ex_fit <- # your code here

predict(ex_fit, new_data = mtcars[1:3, ])
#> Expected: a 3-row tibble with a .pred column
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_fit <- bag_mars(mode = "regression") |>
  set_engine("earth", times = 30) |>
  fit(hp ~ disp + wt + cyl, data = mtcars)

predict(ex_fit, new_data = mtcars[1:3, ])
#> # A tibble: 3 x 1
#>   .pred
#>   <dbl>
#> 1  116.
#> 2  112.
#> 3   97.4
```

**Explanation:** `bag_mars()` defines the spec, `set_engine("earth", times = 30)` requests 30 bagged members, and `fit()` trains them on the formula. `predict()` returns one averaged prediction per row.

</details>

## Related parsnip functions

- [parsnip mars()](parsnip-mars-in-R.html) defines a single, unbagged MARS model.
- [parsnip bag_tree()](parsnip-bag_tree-in-R.html) bags decision trees instead of splines.
- [parsnip rand_forest()](parsnip-rand_forest-in-R.html) builds a random forest ensemble.
- [parsnip boost_tree()](parsnip-boost_tree-in-R.html) fits gradient boosted trees.
- [parsnip fit()](parsnip-fit-in-R.html) trains any model spec on a data frame.

See the official [baguette bag_mars() reference](https://baguette.tidymodels.org/reference/bag_mars.html) for the full argument list.

## FAQ

**What package provides bag_mars()?**
bag_mars() ships in the baguette package, a parsnip model extension maintained by the tidymodels team. parsnip itself does not include it. Install baguette with `install.packages("baguette")` and load it alongside `library(tidymodels)`. Once loaded, bag_mars() behaves like any built-in parsnip spec and works inside workflows and recipes.

**How many models does bag_mars() bag?**
The ensemble size is the `times` engine argument, which defaults to 11. Set it with `set_engine("earth", times = 25)`. More members reduce variance, but the benefit flattens after roughly 25 to 50 fits while training time keeps growing. Tune `times` on a resample if compute is a concern.

**Can bag_mars() do classification?**
Yes. Set `mode = "classification"` and pass a factor outcome. The earth engine fits a generalized linear model on the MARS spline basis for class probabilities. Use `predict(fit, new_data, type = "prob")` for probabilities or the default `type = "class"` for hard labels.

**bag_mars() vs mars(): which should I use?**
Start with `mars()`. It is faster and easier to inspect. Move to `bag_mars()` only when cross-validation shows the single MARS model swinging between resamples. Bagging averages away that knot-selection noise at the cost of extra compute and a less directly interpretable model.
