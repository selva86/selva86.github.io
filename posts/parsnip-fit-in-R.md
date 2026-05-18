---
title: "parsnip fit() in R: Train a Model Specification"
slug: parsnip-fit-in-R
description: "parsnip fit() in R trains a model specification on data. Covers the formula interface, fitting workflows, fit_xy, the model_fit object, and common errors."
keywords: "parsnip fit, fit function R, parsnip fit examples, R fit model tidymodels, train parsnip model, fit model specification R, model_fit object"
mathjax: false
webr: true
date: "2026-05-18"
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "fit()|parsnip fit|parsnip::fit()|fit a model spec|model_fit object"
auto_link_case_sensitive: true
target_keyword: "parsnip fit"
sibling_block_enabled: true
difficulty: Beginner
---

# parsnip fit() in R: Train a Model Specification

<p class="lead">The parsnip <code>fit()</code> function in R trains a model specification on data and returns a fitted model object. You pass a parsnip spec, a formula, and a data frame, and <code>fit()</code> hands the work to the underlying engine.</p>

[QUICK ANSWER]
fit(spec, y ~ ., data = df)               # formula interface
fit(spec, y ~ x1 + x2, data = df)         # choose predictors
fit_xy(spec, x = predictors, y = outcome) # matrix interface
fit(workflow_obj, data = df)              # fit a bundled workflow
model_fit$fit                             # the raw engine object
predict(model_fit, new_data = df)         # use the fitted model
extract_fit_engine(model_fit)             # pull the engine fit

[DECISION TREE: Is fit() the right tool?]
- train a spec with a formula: fit(spec, y ~ ., data = df)
- train with separate x and y: fit_xy(spec, x = preds, y = out)
- fit then score on a test split: last_fit(spec, split)
- fit across CV resamples: fit_resamples(spec, resamples = folds)
- predict from a trained model: predict(model_fit, new_data)
- pull the raw engine object: extract_fit_engine(model_fit)

## What fit() does

**fit() is the verb that turns a specification into a trained model.** A parsnip spec such as `linear_reg()` only records your intent. No data touches it until you call `fit()`, which estimates the parameters and returns a `model_fit` object you can predict from.

The function takes three core inputs: the model specification, a formula that names the outcome and predictors, and the data frame to learn from. It then translates your spec into a call to the chosen engine, such as `stats::lm()` or `ranger::ranger()`, and stores the result.

Because `fit()` is a generic, it also accepts a `workflow` object. That lets one call train a preprocessing recipe and a model together, which is the pattern most tidymodels projects use in production.

[KEY INSIGHT]
**A spec is a recipe and fit() does the cooking.** Keeping specification and fitting apart is what makes tidymodels reproducible. You build the spec once, then call `fit()` on every resample or dataset without rewriting the model definition.

[NOTE]
**fit() comes from the generics package and is re-exported by parsnip.** Loading `library(tidymodels)` or `library(parsnip)` makes it available. The method that handles model specs is `fit.model_spec()`, and a separate `fit.workflow()` method handles workflows.

## fit() syntax and arguments

**fit() needs a spec, a formula, and data, with everything else optional.** The remaining arguments tune how the fit is reported and weighted.

```r title="The fit() argument skeleton"
fit(
  object,                      # a parsnip model specification
  formula,                     # outcome ~ predictors
  data,                        # a data frame or tibble
  case_weights = NULL,         # optional per-row weights
  control = control_parsnip(), # verbosity and error catching
  ...                          # passed to the engine
)
```

The `object` argument is the spec you built with verbs like `set_engine()` and `set_mode()`. The `formula` argument follows base R rules, so `mpg ~ .` means predict `mpg` from every other column. The `data` argument holds the training rows.

**The control argument changes how fit() behaves on failure.** By default a fitting error stops execution. Pass `control_parsnip(catch = TRUE)` to capture the error inside the result instead, which is useful when fitting many models in a loop.

## Fit a model: four examples

**Every example below uses a built-in R dataset.** The `mtcars` data drives the regression examples and a factor version drives the classification example, so the code runs anywhere with no downloads.

### Example 1: Fit a regression model with a formula

**Build the spec, then fit it with a formula.** The `lm` engine needs no extra package, so this is the simplest possible `fit()` call.

```r title="Fit a linear regression on mtcars"
library(tidymodels)

lm_spec <- linear_reg() |>
  set_engine("lm")

lm_fit <- lm_spec |>
  fit(mpg ~ wt + hp, data = mtcars)

lm_fit
#> parsnip model object
#>
#>
#> Call:
#> stats::lm(formula = mpg ~ wt + hp, data = data)
#>
#> Coefficients:
#> (Intercept)           wt           hp
#>    37.22727     -3.87783     -0.03177
```

The printed result is a `model_fit` object wrapping the `lm()` output. The coefficients show fuel economy falls as weight and horsepower rise, which matches the data.

### Example 2: Fit a classification model

**Switch the spec to logistic_reg() and fit() trains a classifier.** The outcome column must be a factor, so convert it first.

```r title="Fit a logistic model on a factor outcome"
cars <- mtcars
cars$am <- factor(cars$am, labels = c("auto", "manual"))

glm_spec <- logistic_reg() |>
  set_engine("glm")

glm_fit <- glm_spec |>
  fit(am ~ mpg + hp, data = cars)

glm_fit$fit$converged
#> [1] TRUE
```

The same `fit()` call handles classification once the spec and the outcome type agree. Here the `glm` engine converged, so the model is ready for `predict()`.

### Example 3: Fit a workflow object

**fit() also accepts a workflow, training preprocessing and model in one call.** A workflow bundles a formula or recipe with a model spec.

```r title="Fit a bundled workflow"
wf <- workflow() |>
  add_formula(mpg ~ wt + hp) |>
  add_model(lm_spec)

wf_fit <- fit(wf, data = mtcars)

class(wf_fit)
#> [1] "workflow"
```

Calling `fit()` on the workflow runs the formula step and the model fit together. The result is a fitted `workflow`, not a bare `model_fit`, so you predict from it the same way.

### Example 4: Inspect the model_fit object

**fit() returns a structured object, not just the engine output.** The `model_fit` object stores the spec, timing, and the raw engine result side by side.

```r title="Look inside the fitted object"
class(lm_fit)
#> [1] "_lm"        "model_fit"

names(lm_fit)
#> [1] "lvl"          "spec"         "fit"
#> [4] "preproc"      "elapsed"      "censor_probs"

extract_fit_engine(lm_fit)$rank
#> [1] 3
```

The `fit` element holds the underlying `lm` object, and `extract_fit_engine()` is the safe way to reach it. Use that helper rather than digging into `$fit` directly, since the internal layout can change.

[TIP]
**Use extract_fit_engine() instead of $fit for engine-specific work.** When you need `summary()`, diagnostics, or other native methods, `extract_fit_engine(model_fit)` returns the raw engine object cleanly. It works the same whether you fit a spec or a workflow.

## Compare fit() with fit_xy() and last_fit()

**fit() is one of three training verbs in tidymodels.** Each one trains a model but expects different inputs and produces a different result.

| Function | Inputs | Returns | Use when |
|---|---|---|---|
| `fit()` | spec, formula, data | `model_fit` | Standard training with a formula |
| `fit_xy()` | spec, `x`, `y` | `model_fit` | Predictors and outcome are separate objects |
| `last_fit()` | spec, `rsplit` | results tibble | Final fit on train, scored on test |

The decision rule is simple. Use `fit()` for everyday training with a formula, reach for `fit_xy()` when your predictors are already a matrix, and call `last_fit()` only for the one final evaluation on held-out test data. If you come from caret, the parsnip `fit()` plus `predict()` pair replaces `caret::train()`.

## Common pitfalls

**Three mistakes catch most newcomers to fit().** Each one below shows the problem and the fix.

The most common is swapping the formula and data arguments. `fit()` expects the formula second and the data third, so a named `data =` argument with no formula fails.

```r title="Formula must come before data"
# Wrong: no formula, fit() cannot build the model
linear_reg() |>
  set_engine("lm") |>
  fit(data = mtcars)
#> Error: argument "formula" is missing, with no default

# Right: formula first, then data
linear_reg() |>
  set_engine("lm") |>
  fit(mpg ~ ., data = mtcars)
```

The second pitfall is a missing mode. Models that can both classify and regress, such as `decision_tree()`, need `set_mode()` before `fit()` can dispatch. The third is a character outcome for classification, since parsnip requires the response column to be a factor, not plain text.

[WARNING]
**fit() will not classify a character outcome.** If the response column is a character vector, parsnip stops and asks for a factor. Convert it first with `factor()` or `as.factor()`, otherwise `fit()` cannot learn the class levels.

## Try it yourself

**Try it:** Fit a `linear_reg()` model with the `lm` engine that predicts `mpg` from `disp` and `cyl` on `mtcars`. Save the fitted model to `ex_fit`.

```r title="Your turn: fit a linear model"
# Try it: fit mpg ~ disp + cyl with parsnip
ex_spec <- # your code here
ex_fit  <- # your code here

ex_fit
#> Expected: a model_fit object with three coefficients
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_spec <- linear_reg() |>
  set_engine("lm")

ex_fit <- ex_spec |>
  fit(mpg ~ disp + cyl, data = mtcars)

ex_fit
#> parsnip model object
#>
#> Call:
#> stats::lm(formula = mpg ~ disp + cyl, data = data)
#>
#> Coefficients:
#> (Intercept)         disp          cyl
#>    34.66099     -0.02058     -1.58728
```

**Explanation:** The spec sets the model type and engine, then `fit()` estimates the coefficients from the formula and data. The result is a `model_fit` object holding the trained `lm` model.

</details>

## Related parsnip functions

**fit() works alongside the rest of the parsnip workflow.** These functions cover the neighboring steps in a tidymodels project.

- `fit_xy()` trains a spec from separate predictor and outcome objects.
- `predict()` generates predictions from a fitted `model_fit`.
- `set_engine()` chooses the computational backend before fitting.
- `set_mode()` sets classification or regression for dual-mode models.
- `extract_fit_engine()` pulls the raw engine object out of a fit.

## FAQ

**What package is fit() in?**

The `fit()` generic is defined in the `generics` package and re-exported by parsnip, so `library(parsnip)` or `library(tidymodels)` makes it available. The method that handles parsnip specifications is `fit.model_spec()`, and `fit.workflow()` handles workflow objects. You never call those methods by name; R dispatches the right one based on the object you pass.

**What is the difference between fit() and fit_xy()?**

Both train a parsnip spec, but they take different inputs. `fit()` uses a formula and a data frame, so it can apply factor encoding and other formula-driven preprocessing. `fit_xy()` takes predictors and outcome as separate objects and skips formula handling, which is faster when your data is already a numeric matrix. Most projects use `fit()` because the formula interface is clearer.

**What does fit() return in R?**

`fit()` returns a `model_fit` object. It is a structured list that stores the original specification, the elapsed fitting time, the outcome levels, and the raw engine result in the `fit` element. Reach the engine object with `extract_fit_engine()` rather than indexing `$fit` directly. When you call `fit()` on a workflow, the result is a fitted `workflow` instead.

**Why does fit() say the mode is missing?**

Some model types, such as `decision_tree()` and `rand_forest()`, can predict either a class or a number. parsnip cannot guess which you want, so `fit()` stops until you call `set_mode("classification")` or `set_mode("regression")`. Single-mode models like `linear_reg()` set the mode automatically, so the error only appears for dual-mode specifications.

**How do I fit a model across cross-validation folds?**

Use `fit_resamples()` from the tune package instead of `fit()`. It takes the spec and a resampling object such as `vfold_cv()`, fits the model on each fold, and collects the metrics. Plain `fit()` trains one model on one dataset, so it is the wrong tool for resampling. Use `fit()` for the final model once tuning is done.

For the full argument reference, see the [parsnip fit() documentation](https://parsnip.tidymodels.org/reference/fit.html).
