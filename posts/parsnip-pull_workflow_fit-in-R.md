---
title: "pull_workflow_fit() in R: Extract a Model From a Workflow"
slug: "parsnip-pull_workflow_fit-in-R"
description: "pull_workflow_fit() extracts the fitted parsnip model from a trained workflow in R. Learn its syntax, examples, and the extract_fit_parsnip() replacement."
keywords: "pull_workflow_fit, pull_workflow_fit R, pull_workflow_fit function, extract fit from workflow R, pull_workflow_fit deprecated, extract_fit_parsnip, tidymodels extract model"
mathjax: false
webr: true
date: "2026-05-18"
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: "tidymodels-Exercises-in-R.html"
auto_link_terms: "pull_workflow_fit()|pull_workflow_fit|workflows::pull_workflow_fit()|extract_fit_parsnip()|extract the workflow fit"
auto_link_case_sensitive: true
target_keyword: "pull_workflow_fit"
sibling_block_enabled: true
difficulty: Beginner
---

# pull_workflow_fit() in R: Extract a Model From a Workflow

<p class="lead">The pull_workflow_fit() function in R returns the fitted parsnip <code>model_fit</code> object stored inside a trained <code>workflow</code>. It is the older name for <code>extract_fit_parsnip()</code> and still works, with a deprecation warning.</p>

[QUICK ANSWER]
pull_workflow_fit(wf_fit)              # extract the parsnip model_fit
extract_fit_parsnip(wf_fit)            # modern, non-deprecated replacement
tidy(pull_workflow_fit(wf_fit))        # coefficient table from the fit
pull_workflow_fit(wf_fit)$fit          # reach the raw engine object
pull_workflow_spec(wf_fit)             # extract the model spec instead
pull_workflow_preprocessor(wf_fit)     # extract the recipe or formula

[DECISION TREE: Is pull_workflow_fit() the right tool?]
- the parsnip model fit from a workflow: pull_workflow_fit(wf_fit)
- the same result without a warning: extract_fit_parsnip(wf_fit)
- the raw engine object (lm, ranger): extract_fit_engine(wf_fit)
- the recipe a workflow used: extract_recipe(wf_fit)
- a tidy coefficient table directly: tidy(wf_fit)
- predictions from the workflow: predict(wf_fit, new_data = df)

## What pull_workflow_fit() does

**pull_workflow_fit() unwraps a trained workflow and returns the parsnip model inside it.** A `workflow` bundles a preprocessor (a formula or recipe) and a model specification. When you call `fit()` on it, the fitted model is stored inside the workflow object. `pull_workflow_fit()` reaches in and hands you that fitted model.

The object you get back is a parsnip `model_fit`, the same class you would get from calling `fit()` on a bare parsnip specification. That means every parsnip tool works on it: `predict()`, `tidy()`, `glance()`, and `augment()`.

The function comes from the [`workflows` package](https://workflows.tidymodels.org/reference/extract-workflow.html), not parsnip. It was renamed to `extract_fit_parsnip()` in workflows 0.2.3 to match a family of `extract_*()` generics shared across tidymodels. The old name still works but prints a deprecation warning on every call.

[NOTE]
**pull_workflow_fit() was soft-deprecated, not removed.** Existing scripts keep running, but new code should call `extract_fit_parsnip()`. The two functions return the identical object.

## pull_workflow_fit() syntax and arguments

**The signature takes a single argument because the function only locates an object.** It does no computation; it walks into the fitted workflow and returns one element.

```r title="pull_workflow_fit signature"
pull_workflow_fit(x)
```

| Argument | Description |
|---|---|
| `x` | A fitted `workflow` object: the result of `fit(workflow, data)`. |

The return value is a parsnip `model_fit`. Its class also carries the engine, so a workflow fit with the `lm` engine returns an object of class `c("_lm", "model_fit")`.

Passing an unfitted workflow raises an error. There is no model to extract until `fit()` has run, so always call `pull_workflow_fit()` on the output of `fit()`, never on the `workflow()` you assembled.

## Extract a workflow model: four examples

**Each example uses the built-in mtcars dataset so you can run it directly.** Start by assembling and fitting a linear regression workflow.

```r title="Fit a workflow on mtcars"
library(workflows)
library(parsnip)

lm_spec <- linear_reg() |>
  set_engine("lm")

car_wf <- workflow() |>
  add_formula(mpg ~ wt + hp) |>
  add_model(lm_spec)

wf_fit <- fit(car_wf, data = mtcars)
```

**Example 1 extracts the parsnip fit.** The returned object carries both the engine tag and the `model_fit` class.

```r title="Extract the parsnip model fit"
model_fit <- pull_workflow_fit(wf_fit)
#> Warning: `pull_workflow_fit()` was deprecated in workflows 0.2.3.
#> Please use `extract_fit_parsnip()` instead.
class(model_fit)
#> [1] "_lm"        "model_fit"
```

**Example 2 produces a tidy coefficient table.** Once you hold the `model_fit`, parsnip and broom tools apply directly.

```r title="Tidy the extracted model"
library(broom)

tidy(model_fit)
#> # A tibble: 3 x 5
#>   term        estimate std.error statistic  p.value
#>   <chr>          <dbl>     <dbl>     <dbl>    <dbl>
#> 1 (Intercept)  37.2      1.60        23.3  2.57e-20
#> 2 wt           -3.88     0.633       -6.13 1.12e-06
#> 3 hp           -0.0318   0.00903     -3.52 1.45e-03
```

[KEY INSIGHT]
**Extracting the fit turns a workflow back into a plain parsnip model.** Once you hold the `model_fit`, every parsnip and broom verb behaves exactly as it would on a model fitted without a workflow.

**Example 3 reaches the raw engine object.** The `model_fit` stores the native model under `$fit`, so you can drop to base R tools when needed.

```r title="Reach the raw engine object"
eng <- pull_workflow_fit(wf_fit)$fit
class(eng)
#> [1] "lm"
coef(eng)
#> (Intercept)          wt          hp
#>  37.2272701  -3.8778307  -0.0317729
```

**Example 4 switches to the current name.** Replace `pull_workflow_fit()` with `extract_fit_parsnip()` and the warning disappears.

```r title="Use the modern replacement"
model_fit <- extract_fit_parsnip(wf_fit)
class(model_fit)
#> [1] "_lm"        "model_fit"
```

## pull_workflow_fit() vs extract_fit_parsnip()

**The two functions are interchangeable; only the name and the warning differ.** `extract_fit_parsnip()` belongs to a consistent `extract_*()` family that also covers recipes, engines, and model specifications.

| Function | Status | Returns |
|---|---|---|
| `pull_workflow_fit()` | Deprecated since 0.2.3 | parsnip `model_fit` |
| `extract_fit_parsnip()` | Current | parsnip `model_fit` |
| `extract_fit_engine()` | Current | raw engine object (`lm`, `ranger`) |

Use `extract_fit_parsnip()` in all new code. Reach for `extract_fit_engine()` instead when you need the native object directly, for example to call `summary()` or `confint()`, which dispatch on the engine class rather than on `model_fit`.

[TIP]
**Find and replace `pull_workflow_` with `extract_`.** The whole `pull_workflow_*()` family maps one to one onto `extract_*()` names, so migrating an old tidymodels script is a mechanical rename.

## Common pitfalls

**Three mistakes account for most pull_workflow_fit() errors.**

- **Calling it on an unfitted workflow.** `pull_workflow_fit(car_wf)` fails because `car_wf` was never trained. Pass the result of `fit()`, not the assembled workflow.
- **Expecting the raw engine object.** `pull_workflow_fit()` returns a parsnip `model_fit`, not an `lm`. Functions like `confint()` need the native object, reached with `$fit` or `extract_fit_engine()`.
- **Ignoring the deprecation warning.** The warning is harmless today, but a future workflows release may remove the function. Migrate to `extract_fit_parsnip()` now.

## Try it yourself

**Try it:** Fit a workflow that predicts `mpg` from `disp` on `mtcars`, then extract its parsnip model and save it to `ex_fit`.

```r title="Your turn: extract a workflow fit"
# Try it: build, fit, and extract
ex_fit <- # your code here

class(ex_fit)
#> Expected: "_lm" "model_fit"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_wf <- workflow() |>
  add_formula(mpg ~ disp) |>
  add_model(linear_reg() |> set_engine("lm"))

ex_fit <- extract_fit_parsnip(fit(ex_wf, data = mtcars))
class(ex_fit)
#> [1] "_lm"        "model_fit"
```

**Explanation:** `fit()` trains the workflow, and `extract_fit_parsnip()` pulls the parsnip `model_fit` back out. It returns the same object `pull_workflow_fit()` would, without the deprecation warning.

</details>

## Related workflows functions

**The `pull_workflow_*()` and `extract_*()` families cover every part of a workflow.**

- `extract_fit_parsnip()`: the current name for `pull_workflow_fit()`.
- `extract_fit_engine()`: returns the raw engine model instead of the parsnip wrapper.
- `extract_recipe()`: returns the prepped recipe used by the workflow.
- `extract_spec_parsnip()`: returns the model specification held by the workflow.
- `extract_preprocessor()`: returns the formula or recipe before prepping.

## FAQ

**Is pull_workflow_fit() the same as extract_fit_parsnip()?**

Yes. `extract_fit_parsnip()` is the renamed version of `pull_workflow_fit()`, introduced in workflows 0.2.3. Both functions take a fitted workflow and return the identical parsnip `model_fit` object. The only practical difference is that `pull_workflow_fit()` prints a deprecation warning. Any code using the old name keeps working, but the tidymodels team recommends the `extract_*()` family for all new projects.

**Why does pull_workflow_fit() show a deprecation warning?**

The `workflows` package renamed its `pull_workflow_*()` accessors to `extract_*()` so they would match a shared set of generics across tidymodels packages. The old functions were kept for backward compatibility but marked as deprecated. The warning is a reminder to migrate; it does not stop your code from running.

**How do I get the raw lm or ranger object from a workflow?**

`pull_workflow_fit()` returns a parsnip `model_fit` wrapper, not the native model. To reach the underlying object, either index into the `$fit` element of the result or call `extract_fit_engine()` on the workflow. The engine object carries its own class, so base R tools such as `summary()` and `plot()` then dispatch correctly.

**Can I call pull_workflow_fit() on a workflow before fitting it?**

No. The function only locates an already-trained model inside the workflow. An assembled but unfitted workflow has no model to return, so the call raises an error. Always run `fit(workflow, data)` first and pass that result to `pull_workflow_fit()` or `extract_fit_parsnip()`.
