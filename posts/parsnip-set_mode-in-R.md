---
title: "parsnip set_mode() in R: Set Regression or Classification"
slug: parsnip-set_mode-in-R
description: "Learn how parsnip's set_mode() in R declares a model as regression or classification. Includes syntax, runnable examples, fit pipelines, and common error fixes."
keywords: "parsnip set_mode, set_mode function R, parsnip set_mode examples, tidymodels set_mode, R set model mode, set regression classification mode"
mathjax: false
webr: true
date: 2026-05-18
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "set_mode()|parsnip set_mode|parsnip::set_mode()|set_mode|set_mode function|set the model mode"
auto_link_case_sensitive: true
target_keyword: "parsnip set_mode"
sibling_block_enabled: true
difficulty: Beginner
---

# parsnip set_mode() in R: Set Regression or Classification

<p class="lead">The parsnip set_mode() function declares whether an R model predicts a number or a category. You pass a model specification and the string <code>"regression"</code>, <code>"classification"</code>, or <code>"censored regression"</code>, and parsnip wires up the correct engine and prediction behavior.</p>

[QUICK ANSWER]
linear_reg() |> set_mode("regression")            # numeric outcome
logistic_reg() |> set_mode("classification")      # factor outcome
rand_forest() |> set_mode("classification")       # forest classifier
decision_tree() |> set_mode("regression")         # tree regressor
svm_rbf() |> set_mode("classification")           # SVM classifier
boost_tree() |> set_mode("regression")            # boosted regressor
proportional_hazards() |> set_mode("censored regression")  # survival

[DECISION TREE: Is set_mode() the right tool?]
- declare regression or classification: set_mode(spec, "regression")
- pick the computational backend: set_engine(spec, "ranger")
- set hyperparameters like trees or mtry: set_args(spec, trees = 500)
- train the model on a dataset: fit(spec, y ~ ., data = train)
- list engines a model allows: show_engines("rand_forest")
- see the translated engine call: translate(spec)

## What set_mode() does

**set_mode() declares the prediction task.** A parsnip model specification stays task-agnostic until you tell it what kind of outcome it predicts. set_mode() supplies that with one of three strings: `"regression"` for a numeric outcome, `"classification"` for a factor outcome, and `"censored regression"` for survival times.

parsnip needs the mode because one model function can solve different problems. `rand_forest()` builds a regression forest or a classification forest depending on the mode. Without it, parsnip cannot choose the engine's prediction routine or validate your outcome column.

```r title="Set a regression model specification"
library(parsnip)

reg_spec <- linear_reg() |>
  set_mode("regression")

reg_spec
#> Linear Regression Model Specification (regression)
#>
#> Computational engine: lm
```

The printed `(regression)` confirms the mode is attached. The specification is still just a recipe for a model, no data has touched it yet.

[KEY INSIGHT]
**The mode is metadata, not computation.** set_mode() does not fit anything or change your data. It records an intent that parsnip reads later, when fit() and predict() decide which engine routines to call.

## set_mode() syntax and arguments

**set_mode() takes a specification and a mode string.** The function signature is short:

```
set_mode(object, mode, ...)
```

| Argument | Description |
|---|---|
| `object` | A parsnip model specification, such as `rand_forest()` or `logistic_reg()`. |
| `mode` | One of `"regression"`, `"classification"`, or `"censored regression"`. |
| `...` | Reserved for future use; leave it empty. |

set_mode() returns an updated specification, so it chains cleanly with the native pipe. Models that support only one task carry a default mode, but stating it explicitly keeps a script readable.

```r title="Set a classification model specification"
clf_spec <- logistic_reg() |>
  set_mode("classification")

clf_spec
#> Logistic Regression Model Specification (classification)
#>
#> Computational engine: glm
```

`logistic_reg()` is classification-only, so this call is documentation rather than a requirement. For a dual-mode model the call is mandatory.

## Setting the mode: four examples

**Most models need an explicit mode.** These examples cover the common cases you meet when building a tidymodels pipeline.

### One model, two modes

**One model function covers both tasks.** `rand_forest()` becomes a regressor or a classifier purely through set_mode(), with every other argument unchanged.

```r title="One model used two ways"
rf_reg <- rand_forest(trees = 200) |>
  set_mode("regression")

rf_clf <- rand_forest(trees = 200) |>
  set_mode("classification")

rf_reg
#> Random Forest Model Specification (regression)
#>
#> Main Arguments:
#>   trees = 200
#>
#> Computational engine: ranger
```

### Mode before or after the engine

**Order does not matter.** parsnip stores the mode and the engine in independent slots, so both pipelines below produce an identical specification.

```r title="Order of set_mode and set_engine"
spec_a <- decision_tree() |>
  set_mode("regression") |>
  set_engine("rpart")

spec_b <- decision_tree() |>
  set_engine("rpart") |>
  set_mode("regression")

identical(spec_a, spec_b)
#> [1] TRUE
```

### A complete fit

**Once the mode is set, fit() can train the model.** Here a linear model predicts `mpg` from the `mtcars` dataset.

```r title="Fit a model after setting the mode"
lm_fit <- linear_reg() |>
  set_mode("regression") |>
  set_engine("lm") |>
  fit(mpg ~ wt + hp, data = mtcars)

class(lm_fit)
#> [1] "_lm"        "model_fit"
```

### Censored regression for survival models

**Survival models use a third mode.** `proportional_hazards()` and `survival_reg()` take the `"censored regression"` mode. The string differs, but the set_mode() call is identical in shape to the examples above.

[TIP]
**Check supported modes before you guess.** Run `show_engines("rand_forest")` to list every engine and mode pair a model offers. The mode column tells you exactly which strings set_mode() will accept.

## When set_mode() is required vs optional

**Single-task models default the mode; flexible models do not.** Regression-only and classification-only models ship a built-in default, so set_mode() is optional for them. Flexible models leave the mode as `"unknown"` until you set it, and calling fit() on an unknown-mode specification raises an error before any computation starts.

| Model function | Modes supported | set_mode() needed? |
|---|---|---|
| `linear_reg()` | regression | Optional (default) |
| `logistic_reg()` | classification | Optional (default) |
| `rand_forest()` | regression, classification, censored regression | Required |
| `decision_tree()` | regression, classification, censored regression | Required |
| `boost_tree()` | regression, classification | Required |

[NOTE]
**Coming from Python scikit-learn?** There is no mode to set; you pick a class like `RandomForestRegressor` or `RandomForestClassifier`. parsnip instead uses one model function and switches behavior through set_mode().

## Common pitfalls

**Three mistakes account for most set_mode() errors.** Each one fails loudly, which makes it quick to diagnose once you know the pattern.

1. **Misspelling the mode string.** parsnip accepts only three exact strings, so a typo such as `"classifcation"` triggers an immediate error.
2. **Choosing a mode the model cannot do.** `linear_reg()` has no classification mode, so requesting one fails.
3. **Skipping set_mode() on a flexible model.** Fitting a `rand_forest()` spec with an unknown mode stops before training begins.

```r title="Errors set_mode can raise"
# Typo in the mode string
rand_forest() |> set_mode("classifcation")
#> Error: "classifcation" is not a known mode for model `rand_forest()`.

# Mode the model does not support
linear_reg() |> set_mode("classification")
#> Error: "classification" is not a known mode for model `linear_reg()`.
```

[WARNING]
**An unknown mode fails late, at fit() time.** A flexible specification with no mode set looks fine when printed and only errors when you call fit(). Set the mode while you build the spec so the problem surfaces immediately.

## Try it yourself

**Try it:** Build a classification decision tree specification for the `iris` dataset, set its mode, and confirm the mode prints correctly. Save the spec to `ex_spec`.

```r title="Your turn: set a classification mode"
# Try it: set the mode to classification
ex_spec <- decision_tree() |>
  set_engine("rpart")  # add set_mode here

ex_spec
#> Expected: prints "(classification)"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_spec <- decision_tree() |>
  set_engine("rpart") |>
  set_mode("classification")

ex_spec
#> Decision Tree Model Specification (classification)
#>
#> Computational engine: rpart
```

**Explanation:** decision_tree() supports both modes, so set_mode("classification") is required. The printed `(classification)` confirms parsnip will build a classifier when you fit it.

</details>

## Related parsnip functions

**set_mode() is one step in building a model specification.** These functions complete the workflow:

- `set_engine()` selects the computational backend, such as `ranger` or `glm`.
- `set_args()` sets or updates model hyperparameters after the spec exists.
- `fit()` trains the specification on a data frame.
- `translate()` shows the exact engine call parsnip will run.
- `show_engines()` lists the engine and mode pairs a model supports.

See the official [parsnip documentation](https://parsnip.tidymodels.org/reference/set_args.html) for the full reference.

## FAQ

**What is the default mode in parsnip?**
There is no single default. Single-task models carry their own: `linear_reg()` defaults to regression and `logistic_reg()` defaults to classification. Flexible models such as `rand_forest()` and `boost_tree()` start with an `"unknown"` mode and have no default at all, so set_mode() is mandatory for them before fitting. Printing any specification shows its current mode in parentheses, so you can always check what is set.

**Do I need set_mode() for linear_reg() and logistic_reg()?**
Not strictly. Both are single-task models with a built-in default mode, so they fit without an explicit set_mode() call. Many practitioners still add it for clarity, because a reader scanning the pipeline sees the prediction task immediately. It also protects the script if you later swap in a flexible model that does require the mode.

**Can I change the mode after setting it?**
Yes. set_mode() overwrites whatever mode the specification currently holds, so calling it twice keeps the last value. Because a specification is just an object, reassigning it with a new set_mode() call costs nothing until you fit. Nothing is computed, so there is no penalty for changing your mind while building the pipeline.

**Does the order of set_mode() and set_engine() matter?**
No. parsnip stores the mode and the engine as independent slots on the specification, then merges them when you fit. You can call set_mode() before or after set_engine() and get an identical object, as `identical()` confirms. Pick whichever order reads more naturally in your pipeline.
