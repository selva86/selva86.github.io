---
title: "parsnip extract_fit_engine() in R: Get the Engine Model"
slug: "parsnip-extract_fit_engine-in-R"
description: "Learn how parsnip extract_fit_engine() in R pulls the raw engine model object, like an lm or ranger fit, from a fitted parsnip model or workflow object."
keywords: "parsnip extract_fit_engine, extract_fit_engine function R, parsnip extract_fit_engine example, tidymodels extract engine model, extract underlying model parsnip, extract_fit_engine vs extract_fit_parsnip, R extract engine fit"
mathjax: false
webr: true
date: "2026-05-18"
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: "tidymodels-Exercises-in-R.html"
auto_link_terms: "extract_fit_engine()|parsnip extract_fit_engine|parsnip::extract_fit_engine()|extract the engine fit|extract_fit_engine function"
auto_link_case_sensitive: true
target_keyword: "parsnip extract_fit_engine"
sibling_block_enabled: true
difficulty: Beginner
---

# parsnip extract_fit_engine() in R: Get the Engine Model

<p class="lead">The parsnip extract_fit_engine() function in R returns the raw, engine-specific model object stored inside a fitted <code>model_fit</code> or <code>workflow</code>, such as the underlying <code>lm</code> or <code>ranger</code> fit.</p>

[QUICK ANSWER]
extract_fit_engine(fit)              # raw engine model object
extract_fit_engine(wf_fit)           # works on a fitted workflow too
summary(extract_fit_engine(fit))     # run engine-specific summary()
extract_fit_engine(fit)$coefficients # reach into engine internals
class(extract_fit_engine(fit))       # confirm the engine class
plot(extract_fit_engine(lm_fit))     # engine diagnostic plots

[DECISION TREE: Is extract_fit_engine() the right tool?]
- the raw engine object (lm, ranger): extract_fit_engine(fit)
- the parsnip model_fit wrapper: extract_fit_parsnip(fit)
- a per-term coefficient table: tidy(fit)
- a one-row model summary: glance(fit)
- predictions as a tidy tibble: predict(fit, new_data = df)
- the recipe used by a workflow: extract_recipe(wf_fit)

## What extract_fit_engine() does

**extract_fit_engine() unwraps a parsnip fit and hands you the model object the engine actually built.** When you call `fit()` on a parsnip specification, parsnip stores the native result inside a `model_fit` wrapper. A model fit with the `lm` engine holds a real `lm` object; one fit with `ranger` holds a `ranger` object. `extract_fit_engine()` reaches in and returns that object.

You need this whenever a function only understands the native object. parsnip gives you an engine-agnostic interface, but tools like `summary()`, `confint()`, `anova()`, `car::vif()`, or the `plot()` diagnostics for `lm` dispatch on the original class. They have no idea what a `model_fit` is.

The function is an S3 generic re-exported from the `generics` package. parsnip supplies the method for `model_fit` objects, `workflows` supplies one for fitted `workflow` objects, and `tune` adds one for `last_fit()` results. The same call therefore works at every layer of a tidymodels pipeline.

For a parsnip `model_fit`, the method is a thin accessor: it returns the element `x$fit`. Reaching for `fit_object$fit` by hand would do the same thing, but `extract_fit_engine()` is the supported API and stays correct if parsnip changes its internals.

[KEY INSIGHT]
**extract_fit_engine() is the escape hatch from the tidy interface.** Stay in parsnip for fitting and prediction, then drop to the engine object only for the engine-specific diagnostics that tidymodels does not re-export.

## extract_fit_engine() syntax and arguments

**The signature is minimal because the function only locates an object, it does not compute anything.** It is an S3 generic, so the method that runs depends on the class of `x`.

```r title="extract_fit_engine generic signature"
extract_fit_engine(x, ...)
```

| Argument | Description |
|---|---|
| `x` | A fitted object: a parsnip `model_fit`, a fitted `workflow`, or a `last_fit()` result. |
| `...` | Currently unused for the parsnip and workflow methods. Reserved for future methods. |

The return value is whatever the engine produced. Its class is the engine's class, not a tidymodels class, so always confirm it with `class()` before you assume which functions apply.

Passing an unfitted specification raises an error. `extract_fit_engine()` needs a trained object, because there is no engine fit until `fit()` has run. Extract from the result of `fit()`, never from the `linear_reg()` spec itself.

## Extract the engine fit: four examples

**Each example uses a built-in dataset so you can run it as-is.** Start by training a linear regression model through the `parsnip` interface.

```r title="Fit a linear model with parsnip"
library(parsnip)

lm_fit <- linear_reg() |>
  set_engine("lm") |>
  fit(mpg ~ wt + hp, data = mtcars)
```

**Example 1 extracts an `lm` object.** The returned object carries the `lm` class, so every base R tool for linear models works on it.

```r title="Confirm the engine class"
eng <- extract_fit_engine(lm_fit)
class(eng)
#> [1] "lm"
```

**Example 2 runs `lm`-specific tools.** Confidence intervals are not part of the parsnip interface, but `confint()` works once you have the raw `lm`.

```r title="Run confint on the engine fit"
confint(extract_fit_engine(lm_fit))
#>                   2.5 %      97.5 %
#> (Intercept) 33.95738245 40.49715778
#> wt          -5.17191604 -2.58374544
#> hp          -0.06337733 -0.00016857
```

Each predictor has an interval that excludes zero, so both `wt` and `hp` are significant at the 5% level. This is the kind of output you reach the engine object to obtain.

**Example 3 extracts a `ranger` random forest.** A different engine returns a different class, with its own fields.

```r title="Extract a ranger engine object"
rf_fit <- rand_forest(trees = 200, mode = "regression") |>
  set_engine("ranger") |>
  fit(mpg ~ ., data = mtcars)

rf_eng <- extract_fit_engine(rf_fit)
c(class = class(rf_eng), trees = rf_eng$num.trees, mtry = rf_eng$mtry)
#>  class  trees   mtry 
#> "ranger" "200"    "3"
```

The `ranger` object exposes internals such as `num.trees` and `mtry` that have no equivalent in the parsnip wrapper. Extracting the engine fit is the only way to inspect them.

**Example 4 extracts from a workflow.** `extract_fit_engine()` works directly on a fitted `workflow`, so you do not have to pull the parsnip fit first.

```r title="Extract the engine fit from a workflow"
library(workflows)

wf_fit <- workflow() |>
  add_model(linear_reg() |> set_engine("lm")) |>
  add_formula(mpg ~ wt + hp) |>
  fit(data = mtcars)

class(extract_fit_engine(wf_fit))
#> [1] "lm"
```

The workflow method digs through the workflow to the parsnip fit and then to the engine object in one step. The same call covers a bare `model_fit` and a full `workflow`.

[TIP]
**Chain the extraction into the diagnostic call.** Write `summary(extract_fit_engine(lm_fit))` or `plot(extract_fit_engine(lm_fit))` directly. There is no need to store the engine object in a variable unless you reuse it several times.

## extract_fit_engine() vs extract_fit_parsnip()

**Pick extract_fit_engine() for the native object and extract_fit_parsnip() for the parsnip wrapper.** Both pull something out of a fitted workflow, but they stop at different layers.

```r title="Compare the two extractors"
class(extract_fit_engine(wf_fit))
#> [1] "lm"

class(extract_fit_parsnip(wf_fit))
#> [1] "_lm"        "model_fit"
```

| Aspect | `extract_fit_engine()` | `extract_fit_parsnip()` |
|---|---|---|
| Returns | The native engine object | The parsnip `model_fit` wrapper |
| Class | Engine class (`lm`, `ranger`) | `model_fit` |
| Use for | `summary()`, `confint()`, engine internals | `tidy()`, `glance()`, `predict()` |
| Layer | Deepest, engine level | One level up, parsnip level |

The decision rule is about which functions you plan to call next. If the next step is a base R or engine-specific function, extract the engine object. If the next step is a `broom` verb or a parsnip `predict()`, extract the parsnip fit, because those methods dispatch on `model_fit`.

[NOTE]
**Both functions accept a workflow.** On a fitted `workflow`, `extract_fit_engine()` and `extract_fit_parsnip()` both reach the model. Use `extract_recipe()` or `extract_spec_parsnip()` when you need the workflow's preprocessing or the untrained specification instead.

## Common pitfalls

**Two mistakes cause most extract_fit_engine() trouble.** Each has a clear fix.

The first is predicting with the extracted object after a recipe was applied. If your workflow used a `recipe`, the engine fit was trained on preprocessed columns. Calling `predict()` on the raw engine object with the original data feeds it the wrong columns and returns wrong numbers. Always predict through the parsnip fit or the workflow, which replay the preprocessing for you.

The second is assuming every engine returns the same class. `extract_fit_engine()` on an `lm` engine gives an `lm`, but on a `glmnet` engine it gives an `elnet` or `lognet`, and on `xgboost` it gives an `xgb.Booster`. A script that hard-codes `summary()` will break when the engine changes. Confirm with `class()` first.

```r title="Engine class depends on the engine"
class(extract_fit_engine(rf_fit))
#> [1] "ranger"
```

[WARNING]
**Never use the engine object for production prediction.** The engine fit has lost the parsnip preprocessing and factor handling. Predicting through it silently skips dummy encoding and normalization. Keep `predict()` on the `model_fit` or `workflow` and treat the engine object as inspect-only.

## Try it yourself

**Try it:** Fit a `linear_reg()` model of `mpg` on `disp` and `drat` with the `lm` engine, extract the engine object, and store its class in `ex_class`.

```r title="Your turn extract the engine fit"
# Try it: fit, then extract the engine object
ex_fit <- # your code here
ex_class <- # your code here

ex_class
#> Expected: "lm"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_fit <- linear_reg() |>
  set_engine("lm") |>
  fit(mpg ~ disp + drat, data = mtcars)

ex_class <- class(extract_fit_engine(ex_fit))
ex_class
#> [1] "lm"
```

**Explanation:** `extract_fit_engine()` returns the native object the engine built, so its class is `lm`, not `model_fit`. That `lm` object accepts every base R linear-model tool.

</details>

## Related parsnip functions

**extract_fit_engine() belongs to a family of tidymodels extractors.** These functions cover the rest of what you might pull from a fit or a workflow.

- `extract_fit_parsnip()` returns the parsnip `model_fit` wrapper instead of the engine object.
- `extract_spec_parsnip()` returns the untrained model specification from a workflow.
- `extract_recipe()` returns the prepped recipe used by a workflow.
- `tidy()` returns a tibble with one row per model coefficient.
- `glance()` returns a one-row tibble of whole-model statistics.

See the official [parsnip reference](https://parsnip.tidymodels.org/reference/extract-parsnip.html) for the full list of extractor methods.

## FAQ

**What does extract_fit_engine() return for a parsnip model?**

`extract_fit_engine()` returns the native model object the engine produced, not a tidymodels wrapper. A model fit with the `lm` engine returns an `lm` object, a `ranger` engine returns a `ranger` object, and an `xgboost` engine returns an `xgb.Booster`. The class is whatever the engine package defines, so you can pass the result to any function that understands that class, such as `summary()`, `confint()`, or `plot()`.

**What is the difference between extract_fit_engine() and extract_fit_parsnip()?**

`extract_fit_engine()` returns the deepest object, the raw engine fit with its native class. `extract_fit_parsnip()` stops one level higher and returns the parsnip `model_fit` wrapper. Use `extract_fit_engine()` when the next call is a base R or engine-specific function, and `extract_fit_parsnip()` when the next call is a `broom` verb like `tidy()` or `glance()`, since those dispatch on `model_fit`.

**Can I call extract_fit_engine() on a workflow?**

Yes. The `workflows` package supplies a method for fitted `workflow` objects, so `extract_fit_engine(wf_fit)` works directly. It digs through the workflow to the parsnip fit and then to the engine object in a single call. The workflow must be fitted first; calling it on an unfitted workflow raises an error because no engine fit exists yet.

**Why should I avoid predicting with the extracted engine object?**

The engine object was trained on the columns parsnip or a recipe produced, which may include dummy variables, normalized values, or transformed terms. Predicting on the raw engine object with your original data skips that preprocessing and returns incorrect results. Always call `predict()` on the `model_fit` or `workflow`, which replays the preprocessing, and treat the engine object as inspect-only.
