---
title: "parsnip fit_xy() in R: Train Models With X/Y Matrices"
slug: parsnip-fit_xy-in-R
description: "Learn parsnip fit_xy() in R, the matrix interface for fitting tidymodels. See syntax, examples, how it differs from fit(), plus common pitfalls to avoid."
keywords: "parsnip fit_xy, fit_xy function R, parsnip fit_xy examples, R fit_xy vs fit, tidymodels fit_xy, fit_xy matrix interface"
mathjax: false
webr: true
date: "2026-05-18"
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "fit_xy()|parsnip fit_xy|parsnip::fit_xy()|fit_xy|fit_xy function"
auto_link_case_sensitive: true
target_keyword: "parsnip fit_xy"
sibling_block_enabled: true
difficulty: Beginner
---

# parsnip fit_xy() in R: Train Models With X/Y Matrices

<p class="lead">The parsnip <code>fit_xy()</code> function trains a tidymodels model from a predictor matrix <code>x</code> and an outcome <code>y</code>, skipping the formula interface that <code>fit()</code> uses.</p>

[QUICK ANSWER]
fit_xy(spec, x = preds, y = outcome)         # core matrix-interface call
fit_xy(spec, x = df[-1], y = df$target)      # split predictors from a frame
fit_xy(spec, x = as.matrix(preds), y = y)    # pass a numeric matrix
fit_xy(spec, x = preds, y = factor(labels))  # classification outcome
fit_xy(spec, x, y, case_weights = w)         # weighted fit
predict(model_fit, new_data = preds)         # score new rows

[DECISION TREE: Is fit_xy() the right tool?]
- predictors already a matrix or data frame: fit_xy(spec, x, y)
- need formula transforms like log(x): fit(spec, y ~ log(x), data)
- want recipe preprocessing steps: workflow() |> add_recipe(rec)
- predict on fresh rows: predict(model_fit, new_data)
- fit many models together: workflow_map(wf_set, "fit_resamples")
- inspect the underlying engine model: extract_fit_engine(model_fit)

## What fit_xy() does

**fit_xy() is the matrix interface to model fitting in parsnip.** You hand it a model specification, a data frame or matrix of predictor columns (`x`), and a vector of outcome values (`y`). It returns a fitted `model_fit` object, exactly the kind that `fit()` returns. Only the data handoff changes.

**The function exists because not every workflow starts with a formula.** Sometimes the predictors already sit in a clean numeric matrix, the output of a recipe, or a feature-engineering step. Writing a formula just so parsnip can take it apart again is wasted work. `fit_xy()` lets you skip that round trip.

[KEY INSIGHT]
**fit() and fit_xy() build the same model object.** They differ only in the data handoff: `fit()` derives predictors from a formula, while `fit_xy()` takes them directly. Pick the interface that matches the shape of the data you already have.

The example below splits `mtcars` into a predictor frame and an outcome vector, the two pieces `fit_xy()` expects.

```r title="Load parsnip and split predictors"
library(parsnip)

# Predictors as a data frame, outcome as a vector
x_train <- mtcars[, c("hp", "wt", "cyl")]
y_train <- mtcars$mpg

head(x_train, 3)
#>                hp    wt cyl
#> Mazda RX4     110 2.620   6
#> Mazda RX4 Wag 110 2.875   6
#> Datsun 710     93 2.320   4
```

The predictor frame holds three columns and no outcome. The outcome lives in its own vector. That separation is the whole idea behind the matrix interface.

## fit_xy() syntax and arguments

**The signature is short and positional.** `fit_xy(object, x, y, case_weights = NULL, control = control_parsnip(), ...)`. The first three arguments carry all the information the model needs.

| Argument | What it does |
|---|---|
| `object` | A parsnip model specification, such as `linear_reg()` or `rand_forest()`. |
| `x` | A data frame or matrix of predictor columns, with no outcome column. |
| `y` | A vector or one-column data frame of outcomes. A factor for classification. |
| `case_weights` | Optional vector of per-row weights, for engines that support them. |
| `control` | A `control_parsnip()` object that toggles verbosity and logging. |

**Predictors go in x, the outcome goes in y.** With the data already split, fitting is one call. The block below fits an ordinary linear regression with the `lm` engine.

```r title="Fit a linear model with fit_xy"
lm_spec <- linear_reg() |> set_engine("lm")

lm_fit <- fit_xy(lm_spec, x = x_train, y = y_train)
lm_fit
#> parsnip model object
#>
#> Call:
#> stats::lm(formula = ..y ~ ., data = data)
#>
#> Coefficients:
#> (Intercept)           hp           wt          cyl
#>    38.75179     -0.01804     -3.16697     -0.94162
```

parsnip wraps the predictors and outcome into an internal formula (`..y ~ .`) and passes them to `lm`. The fitted object is a `model_fit`, ready for `predict()`.

## Fit models with fit_xy(): two more examples

**fit_xy() works for classification, not just regression.** Switch the specification, set the mode, and pass a factor outcome. The block below trains a random forest on `iris` and scores three rows.

```r title="Fit and predict a classifier"
rf_spec <- rand_forest(trees = 100) |>
  set_engine("ranger") |>
  set_mode("classification")

rf_fit <- fit_xy(rf_spec, x = iris[, 1:4], y = iris$Species)

predict(rf_fit, new_data = iris[c(1, 51, 101), 1:4])
#> # A tibble: 3 x 1
#>   .pred_class
#>   <fct>
#> 1 setosa
#> 2 versicolor
#> 3 virginica
```

[TIP]
**Reuse one model specification across both interfaces.** A spec like `linear_reg() |> set_engine("lm")` is just a blueprint for a model. You can pass the same object to `fit()` or `fit_xy()` without redefining it.

The outcome `y` is the `Species` factor, so parsnip knows each class. `predict()` then returns a tibble with a `.pred_class` column, one prediction per supplied row.

## fit_xy() vs fit(): the formula difference

**The split comes down to formula preprocessing.** `fit()` reads a formula, so it can build dummy variables, interactions, and inline transforms like `log(hp)`. `fit_xy()` runs no formula, so it takes the predictor columns exactly as you supply them.

| Aspect | `fit()` | `fit_xy()` |
|---|---|---|
| Input | `formula` plus `data` | `x` predictors plus `y` outcome |
| Formula preprocessing | Applied (dummies, `log()`, interactions) | None; predictors used as-is |
| Dummy variables | Created from factors via the formula | Left to the engine's default encoding |
| Best for | Transforms expressed in a formula | Predictors already in matrix form |

[WARNING]
**fit_xy() does not expand factors the way a formula does.** Because no formula runs, factor predictors are passed straight to the engine. If the engine needs numeric columns, convert factors to indicator columns yourself before calling fit_xy().

When no formula transforms are involved, both interfaces produce identical coefficients. The check below confirms it.

```r title="fit_xy and fit agree without formula terms"
xy_fit <- fit_xy(lm_spec, x = x_train, y = y_train)
fm_fit <- fit(lm_spec, mpg ~ hp + wt + cyl, data = mtcars)

all.equal(coef(xy_fit$fit), coef(fm_fit$fit), check.attributes = FALSE)
#> [1] TRUE
```

See the [parsnip reference for fit_xy()](https://parsnip.tidymodels.org/reference/fit.html) for the full argument list and engine notes.

## Common pitfalls

**Forgetting to set the mode.** A bare `rand_forest()` has no mode, and `fit_xy()` cannot reliably guess it from the outcome. Call `set_mode("classification")` or `set_mode("regression")` on the specification before fitting, or the call errors.

**Expecting a formula to apply.** `fit_xy()` ignores formulas entirely. A predictor you intend to transform, such as `log(hp)`, must be built as a real column before the call. Use `fit()` instead when you want formula transforms computed for you.

**Mismatched columns at predict time.** `predict()` expects `new_data` to carry the same predictor column names that appeared in `x`. Rename or reorder new data to match the training predictors, or prediction fails with a column error.

## Try it yourself

**Try it:** Use `fit_xy()` to fit a `linear_reg()` model that predicts `qsec` from `hp` and `wt` in `mtcars`. Save the fitted model to `ex_fit`.

```r title="Your turn: fit with fit_xy"
# Try it: predict qsec from hp and wt
ex_spec <- linear_reg() |> set_engine("lm")
ex_fit  <- # your code here

ex_fit
#> Expected: a model_fit object with 3 coefficients
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_spec <- linear_reg() |> set_engine("lm")
ex_fit  <- fit_xy(ex_spec, x = mtcars[, c("hp", "wt")], y = mtcars$qsec)
length(coef(ex_fit$fit))
#> [1] 3
```

**Explanation:** fit_xy() takes the predictor columns as `x` and the outcome vector as `y`, so no formula is needed. The fitted `lm` has three coefficients: an intercept plus one per predictor.

</details>

## Related parsnip functions

- [fit()](parsnip-fit-in-R.html) is the formula interface counterpart of fit_xy().
- [predict()](parsnip-predict-in-R.html) scores new data from a fitted model.
- [set_engine()](parsnip-set_engine-in-R.html) chooses the computational engine.
- [set_mode()](parsnip-set_mode-in-R.html) declares regression or classification.
- [extract_fit_engine()](parsnip-extract_fit_engine-in-R.html) reaches the underlying engine object.

## FAQ

**What is the difference between fit() and fit_xy() in parsnip?**

`fit()` takes a formula and a data frame, reading the outcome and predictors from the formula and applying any preprocessing the formula describes, such as dummy variables and interactions. `fit_xy()` takes the predictors and outcome as separate objects, `x` and `y`, and applies no formula preprocessing. Both return the same `model_fit` object. Choose `fit()` when transformations live in a formula, and `fit_xy()` when your predictors are already a clean matrix or data frame.

**Does fit_xy() create dummy variables for factor predictors?**

Not on its own. Because `fit_xy()` runs no formula, factor columns are passed straight to the modeling engine. Some engines, such as ranger, accept factors directly. Others, such as glmnet or xgboost, need a fully numeric matrix and will error. The safe approach is to convert factors to indicator columns before calling `fit_xy()`, or to use a recipe with `step_dummy()` inside a workflow so the encoding is explicit and reproducible.

**Can I use fit_xy() with a recipe or workflow?**

Recipes and workflows use their own fitting path. A workflow built with `add_recipe()` and `add_model()` is fitted with `fit()`, not `fit_xy()`; the recipe handles preprocessing and produces the predictor matrix internally. Use `fit_xy()` for the simpler case of a standalone model specification with predictors you have already prepared yourself.

**Why does fit_xy() fail for some models?**

`fit_xy()` relies on the engine supporting a non-formula interface. A few model and engine combinations only register a formula method, so parsnip raises an error stating that `fit_xy()` is not available. The fix is to call `fit()` with a formula instead. You can also check parsnip's documentation or run `show_engines()` to see which interfaces an engine exposes before committing to one.

**Should x be a matrix or a data frame in fit_xy()?**

Either works for most engines. A data frame keeps column names, which makes `predict()` and model summaries easier to read, so it is the better default. Use a matrix only when the engine specifically expects one, such as glmnet. parsnip converts between the two as the engine requires, but starting from a named data frame gives the clearest output and the safest `predict()` behavior later.
