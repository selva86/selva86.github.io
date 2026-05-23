---
title: "workflows add_formula() in R: Attach a Formula to a Workflow"
slug: workflows-add_formula-in-R
description: "Use workflows add_formula() in R to attach a model formula to a tidymodels workflow. See the syntax, four worked examples, pitfalls, and when to pick it."
keywords: "workflows add_formula, add_formula function R, add_formula workflow, tidymodels add_formula, R add_formula, workflows add formula, add_formula tidymodels examples"
mathjax: false
webr: true
date: "2026-05-23"
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "add_formula()|workflows add_formula|workflows::add_formula()|attach formula to workflow|formula preprocessor"
auto_link_case_sensitive: true
target_keyword: "workflows add_formula"
sibling_block_enabled: true
difficulty: Beginner
---

# workflows add_formula() in R: Attach a Formula to a Workflow

<p class="lead">The workflows <code>add_formula()</code> function in R attaches a model formula like <code>y ~ x1 + x2</code> to a tidymodels workflow as the preprocessor. The workflow stores the formula and replays it inside <code>fit()</code> and <code>predict()</code>, so you get the formula syntax of base R with the resampling and tuning machinery of tidymodels.</p>

[QUICK ANSWER]
workflow() |> add_formula(mpg ~ wt + hp)            # basic formula preprocessor
workflow() |> add_formula(am ~ .)                   # all other columns as predictors
workflow() |> add_formula(mpg ~ wt * hp)            # main effects plus interaction
workflow() |> add_formula(mpg ~ poly(wt, 2) + hp)   # polynomial term, expanded by stats
add_formula(wf, mpg ~ wt, blueprint = bp)           # custom hardhat blueprint
update_formula(wf, mpg ~ wt + hp + disp)            # swap the formula in place
remove_formula(wf)                                  # detach the formula

[DECISION TREE: Is add_formula() the right tool?]
- attach a lightweight model formula to a workflow: workflow() |> add_formula(y ~ x1 + x2)
- attach a recipe with explicit preprocessing steps: workflow() |> add_recipe(rec)
- attach bare predictor and outcome columns, no formula: workflow() |> add_variables(y, c(x1, x2))
- replace an attached formula in place: update_formula(wf, y ~ x1 + x2 + x3)
- detach the formula entirely: remove_formula(wf)
- write the formula straight into the model call: lm(y ~ x1 + x2, data = df)

## What add_formula() does

**add_formula() registers a model formula as the preprocessor of a workflow.** It does not run the formula. The function records the formula in the workflow's preprocessor slot, the same way `add_recipe()` records a recipes object and `add_model()` records a parsnip spec. The actual `model.matrix()` expansion happens later, when `fit()`, `fit_resamples()`, or `tune_grid()` is called on the workflow.

The formula is held as an unevaluated R expression. When the workflow is fit, the formula and the training data are passed through the hardhat preprocessor, which builds the predictor matrix and outcome vector. Factor columns become dummy variables, interaction terms multiply out, and inline transformations like `log()` or `poly()` are evaluated. The resulting design matrix goes to the engine that the parsnip spec selected.

[KEY INSIGHT]
**add_formula() gives you base R formula semantics inside a tidymodels workflow.** You write `mpg ~ wt * hp` and the workflow expands it the same way `lm()` would. The win is that the formula travels with the workflow, so resampling, tuning, and prediction all see the same predictor expansion without you re-typing the formula in three places.

## add_formula() syntax and arguments

**add_formula() takes a workflow, a formula, and an optional blueprint.** The signature is short and most users only ever pass the first two arguments.

```r title="The add_formula argument skeleton"
library(tidymodels)

add_formula(
  x,                # a workflow object
  formula,          # a model formula like y ~ x1 + x2
  blueprint = NULL  # a default_formula_blueprint() object
)
```

The `x` argument must be a `workflow()` object, usually piped in from `workflow()`. The `formula` argument is any valid model formula; the left side is the outcome and the right side is the predictor expression. The `blueprint` argument from the hardhat package controls indicator coding, intercept handling, and how `NA` rows are dropped at prediction time. The default blueprint matches what `lm()` and `glm()` do, so you rarely need to override it.

**add_formula() returns a new workflow.** The function is pure and does not mutate its input. Assign the result back to a variable or chain it into another pipe step.

[NOTE]
**The formula is stored, not evaluated.** Calling `workflows::add_formula()` is cheap because nothing is computed yet. The formula is held alongside the model spec until the workflow is fit. To preview the expansion, call `model.matrix(formula, data)` on the formula and data directly, outside the workflow.

**add_formula() is one of three preprocessor verbs in the workflows package.** Picking the right verb upfront avoids restructuring later.

| Verb | Preprocessor input | When to use |
|------|--------------------|-------------|
| `add_formula()` | A model formula `y ~ x1 + x2` | Lightweight model, base R formula expansion is enough |
| `add_recipe()` | A `recipe()` with explicit steps | Need imputation, scaling, or custom transformations |
| `add_variables()` | Outcome and predictor column names | Engine refuses formulas (XGBoost matrix input) |

Reach for `add_formula()` when the formula syntax is enough and you do not need preprocessing steps to be re-estimated on each resample.

## Build workflows with add_formula(): four examples

**Every example below uses the built-in mtcars and airquality datasets** so the focus stays on the formula plumbing rather than on the data.

### Example 1: A two-predictor linear regression

**The smallest useful workflow has a formula and a model.** This is the form most tidymodels tutorials open with.

```r title="Formula plus linear regression"
lin_spec <- linear_reg() |> set_engine("lm")

wf_lin <- workflow() |>
  add_formula(mpg ~ wt + hp) |>
  add_model(lin_spec)

wf_lin
#> == Workflow ====================================================================
#> Preprocessor: Formula
#> Model: linear_reg()
#>
#> -- Preprocessor ----------------------------------------------------------------
#> mpg ~ wt + hp
#>
#> -- Model -----------------------------------------------------------------------
#> Linear Regression Model Specification (regression)
#>
#> Computational engine: lm
```

The workflow now holds both the formula and the parsnip spec. Calling `fit(wf_lin, data = mtcars)` hands `mpg ~ wt + hp` to `lm()` along with the training data and returns a fitted workflow you can pass to `predict()` or `tune::tune_grid()`.

### Example 2: All-other-columns shorthand and dot expansion

**Formulas accept the `.` shorthand for "every other column in data".** This works inside a workflow the same way it does in `lm()`.

```r title="Use the dot to include every other predictor"
wf_dot <- workflow() |>
  add_formula(mpg ~ .) |>
  add_model(linear_reg() |> set_engine("lm"))

wf_dot_fit <- fit(wf_dot, data = mtcars)

predict(wf_dot_fit, new_data = head(mtcars))
#> # A tibble: 6 x 1
#>   .pred
#>   <dbl>
#> 1  22.6
#> 2  22.1
#> 3  26.3
#> 4  21.2
#> 5  17.7
#> 6  20.4
```

The `.` is expanded at fit time using the column names present in the training data. New data passed to `predict()` must contain those same columns; missing predictors raise an error from `hardhat::forge()`. This is one of the rare moments the workflow surfaces a base R behaviour rather than smoothing it over.

### Example 3: Interactions and polynomial terms

**Formula syntax expands interactions and polynomial expressions in place.** You get the same `x * z` and `poly(x, 2)` shortcuts that base R supplies.

```r title="Interaction and polynomial inside add_formula"
wf_poly <- workflow() |>
  add_formula(mpg ~ wt * hp + poly(disp, 2)) |>
  add_model(linear_reg() |> set_engine("lm"))

wf_poly_fit <- fit(wf_poly, data = mtcars)

extract_fit_engine(wf_poly_fit) |>
  coef() |>
  round(3)
#>            (Intercept)                     wt
#>                 47.812                 -9.179
#>                     hp           poly(disp, 2)1
#>                 -0.108                -16.231
#>         poly(disp, 2)2                  wt:hp
#>                  9.444                  0.029
```

The `wt * hp` term added the two main effects plus the `wt:hp` interaction without you naming them. The `poly(disp, 2)` term created two orthogonal polynomial columns. Both expansions happen inside `model.matrix()` when the workflow is fit, so new data only needs the raw `wt`, `hp`, and `disp` columns at predict time.

### Example 4: When add_formula() is not enough

**Formula transformations like `log()` are evaluated on the data passed in, not re-estimated.** That is fine for fixed transformations and wrong for anything that learns from the data.

```r title="Fixed transform vs learned transform"
# OK: log() is a fixed, data-free transformation
wf_log <- workflow() |>
  add_formula(log(Ozone) ~ Solar.R + Wind + Temp) |>
  add_model(linear_reg() |> set_engine("lm"))

# Not OK: scale() inside a formula uses the WHOLE dataset
wf_bad <- workflow() |>
  add_formula(Ozone ~ scale(Solar.R) + scale(Wind)) |>
  add_model(linear_reg() |> set_engine("lm"))
#> Builds fine, but scale() learns its mean and sd from each fit() call
#> on the data passed in. Inside resampling this leaks information
#> between folds when scale() is computed on combined data.
```

For learned transformations, swap `add_formula()` for `add_recipe()` and use `step_normalize()` so the standardization is re-estimated on the training half of every resample. The formula path is correct for `log`, `sqrt`, `poly`, and similar deterministic expressions.

## Common pitfalls

**A workflow holds exactly one preprocessor and one formula.** These are the four errors you will hit while learning `add_formula()`.

```r title="Four errors and their fixes"
# Pitfall 1: two preprocessors in one workflow
workflow() |>
  add_formula(mpg ~ wt) |>
  add_recipe(recipe(mpg ~ wt, data = mtcars))
#> Error: A formula action has already been added to this workflow.
#> Fix: pick one. add_formula() OR add_recipe(), never both.

# Pitfall 2: passing a string instead of a formula
workflow() |> add_formula("mpg ~ wt")
#> Error in `add_formula()`: `formula` must be a formula.
#> Fix: drop the quotes. mpg ~ wt is already an R expression.

# Pitfall 3: column name not in data
wf_typo <- workflow() |>
  add_formula(MPG ~ wt) |>
  add_model(linear_reg() |> set_engine("lm"))
fit(wf_typo, data = mtcars)
#> Error in `fit()`: object 'MPG' not found.
#> Fix: match the exact column name; R is case sensitive.

# Pitfall 4: adding the formula after the model
workflow() |>
  add_model(linear_reg() |> set_engine("lm")) |>
  add_formula(mpg ~ wt)
#> Works, but the convention is preprocessor first.
#> Fix: pipe add_formula() before add_model() for readability.
```

[WARNING]
**Inline data-learning transformations like `scale()` leak across resamples.** A formula such as `Ozone ~ scale(Solar.R)` will fit, but the mean and standard deviation are computed on whatever data the current `fit()` call receives. Under cross-validation that means summary statistics drift from fold to fold and can mix train and test rows. Move the standardization into a recipe with `step_normalize()` whenever the transform learns from the data.

## Try it yourself

**Try it:** Build a workflow that uses `workflows::add_formula()` to fit a linear regression of `Petal.Length` on `Sepal.Length`, `Sepal.Width`, and their interaction in the `iris` dataset. Save the fitted workflow to `ex_fit`.

```r title="Your turn: add_formula with interaction"
# Try it: interaction term inside add_formula
library(tidymodels)

ex_fit <- # your code here

predict(ex_fit, new_data = head(iris))
#> Expected: tibble with 6 .pred values between 1 and 2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_fit <- workflow() |>
  add_formula(Petal.Length ~ Sepal.Length * Sepal.Width) |>
  add_model(linear_reg() |> set_engine("lm")) |>
  fit(data = iris)

predict(ex_fit, new_data = head(iris))
#> # A tibble: 6 x 1
#>   .pred
#>   <dbl>
#> 1  1.55
#> 2  1.32
#> 3  1.25
#> 4  1.36
#> 5  1.55
#> 6  1.94
```

**Explanation:** The `Sepal.Length * Sepal.Width` term expands inside `model.matrix()` into the two main effects plus their interaction, exactly as `lm()` would. Wrapping the formula in `add_formula()` lets you reuse the same workflow object for resampling or tuning later, without redeclaring the formula.

</details>

## Related workflows functions

**add_formula() is one verb in a small family.** These functions appear next to it in almost every tidymodels script.

- `workflow()` creates the empty workflow that `add_formula()` updates.
- `add_model()` attaches the parsnip spec that pairs with the formula.
- `add_recipe()` swaps the formula for a full recipes preprocessor.
- `add_variables()` attaches bare column names when even a formula is too much structure.
- `update_formula()` replaces the formula inside an existing workflow.
- `remove_formula()` detaches the formula entirely.

See the [workflows package reference](https://workflows.tidymodels.org/reference/) for the full verb family.

## FAQ

**Does add_formula() do any preprocessing?**

No. `workflows::add_formula()` only stores the formula in the workflow's preprocessor slot. The formula is expanded into a design matrix later, inside `fit()`, by `hardhat::mold()`. That expansion runs whatever inline functions appear in the formula, such as `log()` or `poly()`, but it does not learn parameters from the data. For learned preprocessing like normalization or imputation, use `add_recipe()` so the transformations are re-estimated on each resample.

**Can I use add_formula() and add_recipe() in the same workflow?**

No. A workflow holds exactly one preprocessor. Calling both `add_formula()` and `add_recipe()` on the same workflow raises an error. Choose `add_formula()` when a base R formula is enough and the engine accepts formulas. Choose `add_recipe()` when the preprocessing needs explicit steps that must be re-estimated on each fold of cross-validation.

**How is add_formula() different from writing the formula directly in lm()?**

The formula is identical, but the workflow keeps it bundled with the model spec and any tuning grid. That means resampling, tuning, and prediction all reuse the same formula without you typing it again. The workflow object also makes the pipeline easier to swap engines on; flipping `set_engine("lm")` to `set_engine("glmnet")` does not touch the formula at all.

**Why does scale() inside a formula leak across resamples?**

`scale()` computes the mean and standard deviation of its argument at the moment the formula is evaluated. Inline transformations cannot remember what they saw on a previous fold, so the statistics drift fold by fold. A recipe step like `step_normalize()` records training-fold statistics inside the workflow, so prediction on the held-out fold uses the matching values.

**Can I update the formula after adding it?**

Yes. Use `update_formula(wf, new_formula)`. It replaces the formula in place without touching the model spec or refitting anything. Calling `add_formula()` twice on the same workflow fails because the preprocessor slot is already filled.
