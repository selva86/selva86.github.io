---
title: "workflows add_variables() in R: Bare Columns, No Formula"
slug: workflows-add_variables-in-R
description: "Use workflows add_variables() in R to attach predictors and outcomes as bare columns to a tidymodels workflow. Syntax, four worked examples, and pitfalls."
keywords: "workflows add_variables, add_variables function R, workflows add_variables example, tidymodels add_variables, R add_variables, workflows add variables, add_variables tidymodels examples"
mathjax: false
webr: true
date: "2026-05-23"
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "add_variables()|workflows add_variables|workflows::add_variables()|attach variables to workflow|tidy-select predictors"
auto_link_case_sensitive: true
target_keyword: "workflows add_variables"
sibling_block_enabled: true
difficulty: Beginner
---

# workflows add_variables() in R: Bare Columns, No Formula

<p class="lead">The workflows <code>add_variables()</code> function in R attaches outcome and predictor columns to a tidymodels workflow using bare column names and tidy-select helpers. No formula is built, no dummy expansion is forced, so the engine sees the columns exactly as they sit in the data frame.</p>

[QUICK ANSWER]
workflow() |> add_variables(mpg, c(wt, hp))            # bare outcome and predictors
workflow() |> add_variables(mpg, c(wt, hp, cyl))       # multiple predictors as vector
workflow() |> add_variables(mpg, everything())         # all other columns as predictors
workflow() |> add_variables(mpg, starts_with("disp"))  # tidy-select helper
workflow() |> add_variables(c(mpg, qsec), c(wt, hp))   # multiple outcomes
add_variables(wf, mpg, c(wt, hp), blueprint = bp)      # custom hardhat blueprint
update_variables(wf, mpg, c(wt, hp, disp))             # swap selection in place
remove_variables(wf)                                   # detach the selection

[DECISION TREE: Is add_variables() the right tool?]
- attach bare outcome and predictor columns: workflow() |> add_variables(y, c(x1, x2))
- attach a formula with interactions or `.`: workflow() |> add_formula(y ~ x1 * x2)
- attach a recipe with explicit prep steps: workflow() |> add_recipe(rec)
- select predictors with tidyselect helpers: add_variables(wf, y, starts_with("v_"))
- replace the variable selection in place: update_variables(wf, y, c(x1, x2, x3))
- handle engines that refuse formulas: xgboost or lightgbm via add_variables

## What add_variables() does

**add_variables() registers a pair of column selections as the preprocessor of a workflow.** It stores one tidy-select expression for the outcome and another for the predictors in the workflow's preprocessor slot. Nothing is computed. The actual column lookup runs inside `fit()`, `fit_resamples()`, or `tune_grid()`, when `hardhat::mold()` resolves the selections against the training data.

The selections are held as quosures, so anything tidyselect accepts works on either side: bare names, vectors, and helpers like `starts_with()`, `where()`, and `everything()`. Factors stay as factors, character columns stay as character, and no `model.matrix()` expansion runs unless the engine itself asks for one.

[KEY INSIGHT]
**add_variables() is the "raw columns" preprocessor.** It is the right verb when you want the engine to see the data frame columns untouched. That matters for tree-based engines that accept categorical predictors natively, for XGBoost where you usually want to control encoding yourself, and for any spec where formula expansion would force unwanted dummy variables.

## add_variables() syntax and arguments

**add_variables() takes a workflow, an outcome selection, a predictor selection, and an optional blueprint.** The function dispatches on tidyselect, so the second and third arguments accept anything `dplyr::select()` would accept.

```r title="The add_variables argument skeleton"
library(tidymodels)

add_variables(
  x,                # a workflow object
  outcomes,         # tidy-select for the outcome column(s)
  predictors,       # tidy-select for the predictor columns
  ...,
  blueprint = NULL  # default_xy_blueprint() object
)
```

The `x` argument is a `workflow()` object, usually piped in from `workflow()`. The `outcomes` argument accepts a bare name like `mpg` or a vector like `c(mpg, qsec)` for multi-outcome specs. The `predictors` argument accepts any tidy-select expression: `c(wt, hp)`, `everything()`, `starts_with("v_")`, and `where(is.numeric)` all work. The `blueprint` argument is a `hardhat::default_xy_blueprint()` object that controls how missing rows are handled at prediction time; the default rarely needs overriding.

**add_variables() returns a new workflow.** Like every workflows verb, it is pure and does not mutate its input. Assign the result back to a variable or chain it into the next pipe step.

[NOTE]
**The selection is stored, not run.** Calling `workflows::add_variables()` is cheap. The two quosures are held alongside the parsnip spec until the workflow is fit. To preview which columns the selection will pick, evaluate the expressions with `tidyselect::eval_select()` on the data, outside the workflow.

**add_variables() is one of three preprocessor verbs in the workflows package.** The right verb depends on how much expansion you want.

| Verb | Preprocessor input | When to use |
|------|--------------------|-------------|
| `add_variables()` | Outcome and predictor selections | Engine handles encoding, or you want raw columns |
| `add_formula()` | A model formula `y ~ x1 + x2` | Need base R formula expansion (`*`, `poly`, `.`) |
| `add_recipe()` | A `recipe()` with explicit steps | Need imputation, scaling, or custom transforms |

Reach for `add_variables()` when no transformation is needed and you want the engine to receive the columns exactly as they appear in the source data.

## Build workflows with add_variables(): four examples

**Every example below uses the built-in mtcars and iris datasets** so the focus stays on the variable-selection plumbing rather than on the data.

### Example 1: Bare outcome and predictor names

**The simplest call lists the outcome first and the predictors as a vector.** No quotes, no formula, just column names.

```r title="Bare names for outcome and predictors"
library(tidymodels)

lin_spec <- linear_reg() |> set_engine("lm")

wf_var <- workflow() |>
  add_variables(outcomes = mpg, predictors = c(wt, hp)) |>
  add_model(lin_spec)

wf_var
#> == Workflow ====================================================================
#> Preprocessor: Variables
#> Model: linear_reg()
#>
#> -- Preprocessor ----------------------------------------------------------------
#> Outcomes: mpg
#> Predictors: c(wt, hp)
#>
#> -- Model -----------------------------------------------------------------------
#> Linear Regression Model Specification (regression)
#>
#> Computational engine: lm
```

The workflow prints `Preprocessor: Variables` rather than `Formula` or `Recipe`, signalling that no formula was built. Calling `fit(wf_var, data = mtcars)` hands `mpg`, `wt`, and `hp` to `lm()` as plain columns; `lm()` then builds its own internal formula because that is what the engine needs, but the workflow itself stays formula-free.

### Example 2: Tidy-select helpers for the predictor set

**Predictor selection accepts every tidyselect helper.** That makes column-pattern selection trivial without listing names by hand.

```r title="starts_with and where helpers"
wf_select <- workflow() |>
  add_variables(
    outcomes   = mpg,
    predictors = c(starts_with("d"), where(is.numeric) & !mpg)
  ) |>
  add_model(linear_reg() |> set_engine("lm"))

wf_select_fit <- fit(wf_select, data = mtcars)

predict(wf_select_fit, new_data = head(mtcars, 3))
#> # A tibble: 3 x 1
#>   .pred
#>   <dbl>
#> 1  22.0
#> 2  22.0
#> 3  25.7
```

The `starts_with("d")` part grabs `disp` and `drat`. The `where(is.numeric) & !mpg` part adds every other numeric column, minus the outcome. The two halves combine into one predictor set at fit time. Because the selection is stored as a quosure, it re-evaluates inside each resample, so adding or renaming columns upstream is picked up automatically.

### Example 3: An engine that prefers raw columns

**Some engines refuse formula input and need bare columns.** XGBoost is the canonical case: it expects a numeric matrix and handles its own categorical encoding, so a `model.matrix()` expansion gets in the way.

```r title="add_variables with xgboost"
xgb_spec <- boost_tree(trees = 50) |>
  set_engine("xgboost") |>
  set_mode("regression")

wf_xgb <- workflow() |>
  add_variables(outcomes = mpg, predictors = c(wt, hp, disp, cyl)) |>
  add_model(xgb_spec)

wf_xgb_fit <- fit(wf_xgb, data = mtcars)

predict(wf_xgb_fit, new_data = head(mtcars, 3))
#> # A tibble: 3 x 1
#>   .pred
#>   <dbl>
#> 1  20.9
#> 2  20.9
#> 3  22.9
```

With `add_variables()`, XGBoost receives the four numeric columns directly and never sees a formula. Swapping in `add_formula(mpg ~ wt + hp + disp + cyl)` would also work for this engine, but the formula path adds an intercept column and pulls factors through `model.matrix()`, which is wasted work when the engine already handles encoding internally.

### Example 4: Multiple outcomes in one workflow

**add_variables() accepts more than one outcome column.** That is unusual for `add_formula()`, where the left side is typically a single response, but tidyselect lets you list a vector.

```r title="Two outcome columns at once"
multi_spec <- linear_reg() |> set_engine("lm")

wf_multi <- workflow() |>
  add_variables(outcomes = c(Sepal.Length, Sepal.Width),
                predictors = c(Petal.Length, Petal.Width)) |>
  add_model(multi_spec)

wf_multi
#> == Workflow ====================================================================
#> Preprocessor: Variables
#> Model: linear_reg()
#>
#> -- Preprocessor ----------------------------------------------------------------
#> Outcomes: c(Sepal.Length, Sepal.Width)
#> Predictors: c(Petal.Length, Petal.Width)
```

Whether the model engine fits multi-outcome regression depends on the engine, not the workflow. With `set_engine("lm")` only the first outcome is used; engines built for multivariate response, like `mgcv::gam` with a list-formula, can consume the full set. The workflow itself happily records both outcomes and passes them along, leaving the rest to the engine.

## Common pitfalls

**A workflow holds exactly one preprocessor.** These four errors show up most often when picking up `add_variables()` for the first time.

```r title="Four errors and their fixes"
# Pitfall 1: mixing a formula and a variable selection
workflow() |>
  add_variables(mpg, c(wt, hp)) |>
  add_formula(mpg ~ wt)
#> Error: A variables action has already been added to this workflow.
#> Fix: pick one. add_variables() OR add_formula(), never both.

# Pitfall 2: quoting the column names
workflow() |> add_variables("mpg", c("wt", "hp"))
#> Error in `add_variables()`: Predictors must be a tidy-select expression.
#> Fix: drop the quotes. add_variables(mpg, c(wt, hp)) works.

# Pitfall 3: column not present in fit data
wf_typo <- workflow() |>
  add_variables(MPG, c(wt, hp)) |>
  add_model(linear_reg() |> set_engine("lm"))
fit(wf_typo, data = mtcars)
#> Error: Can't subset columns that don't exist. Column `MPG` doesn't exist.
#> Fix: match the exact column name; R is case sensitive.

# Pitfall 4: a predictor selection that also picks the outcome
workflow() |>
  add_variables(outcomes = mpg, predictors = everything()) |>
  add_model(linear_reg() |> set_engine("lm")) |>
  fit(data = mtcars)
#> Error: Following columns are specified as both predictors and outcomes: mpg.
#> Fix: exclude the outcome: predictors = !mpg, or use everything() & !mpg.
```

[WARNING]
**Tidy-select expressions inside add_variables() re-evaluate against each new dataset.** That is usually a feature, but it bites when the new data has different columns from the training data. A selection like `starts_with("v_")` may pick five columns at fit time and three at predict time, which raises a `hardhat::forge()` error. Pin the exact column names with `c(...)` when the column set is stable; reserve helpers for cases where you control both the train and predict frames.

## Try it yourself

**Try it:** Build a workflow with `workflows::add_variables()` that uses `Petal.Length` as the outcome and the two sepal columns as predictors in the `iris` dataset, pairs it with a linear regression engine, and fits it. Save the fitted workflow to `ex_fit`.

```r title="Your turn: add_variables with iris"
# Try it: add_variables for a linear regression
library(tidymodels)

ex_fit <- # your code here

predict(ex_fit, new_data = head(iris))
#> Expected: tibble with 6 .pred values between 1 and 3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_fit <- workflow() |>
  add_variables(
    outcomes   = Petal.Length,
    predictors = c(Sepal.Length, Sepal.Width)
  ) |>
  add_model(linear_reg() |> set_engine("lm")) |>
  fit(data = iris)

predict(ex_fit, new_data = head(iris))
#> # A tibble: 6 x 1
#>   .pred
#>   <dbl>
#> 1  2.65
#> 2  2.36
#> 3  2.31
#> 4  2.42
#> 5  2.71
#> 6  2.94
```

**Explanation:** `add_variables()` records the two sepal columns as predictors and `Petal.Length` as the outcome without building a formula. When `fit()` runs, `hardhat::mold()` resolves the selections against the `iris` data and hands plain columns to the `lm` engine. No interaction or expansion is added, so the linear regression uses exactly two predictors.

</details>

## Related workflows functions

**add_variables() is one verb in a small family.** These functions sit beside it in almost every tidymodels script.

- `workflow()` creates the empty workflow that `add_variables()` updates.
- `add_model()` attaches the parsnip spec that pairs with the variable selection.
- `add_formula()` swaps the bare selection for a base R formula preprocessor.
- `add_recipe()` swaps the bare selection for a full recipes preprocessor.
- `update_variables()` replaces the selection in place without rebuilding the workflow.
- `remove_variables()` detaches the selection entirely.

See the [workflows package reference](https://workflows.tidymodels.org/reference/) for the full verb family.

## FAQ

**When should I use add_variables() instead of add_formula()?**

Reach for `workflows::add_variables()` whenever a formula would force expansion you do not want. Tree-based engines like XGBoost and LightGBM accept categorical predictors natively, so a `model.matrix()` path wastes work. Use `add_variables()` when you only need to name columns; pick `add_formula()` when you need interactions, polynomial terms, or the `.` shorthand.

**Does add_variables() support tidyselect helpers?**

Yes. Both `outcomes` and `predictors` accept any tidyselect expression: `starts_with()`, `ends_with()`, `contains()`, `matches()`, `where()`, `everything()`, and the `&`, `|`, `!` operators all work. The selections are stored as quosures and resolved at fit time and again at predict time. Pin column names with `c(...)` when the column set must not drift between train and predict.

**Can add_variables() handle multiple outcomes?**

Yes, on the workflow side. Passing `outcomes = c(y1, y2)` records two outcome columns. Whether the engine fits a multi-outcome model depends on the engine. The `lm` engine uses only the first; engines built for multivariate response can consume the full vector.

**How is add_variables() different from add_recipe()?**

`workflows::add_variables()` records bare column selections and runs no transformations. `add_recipe()` records a `recipe()` with explicit `step_*()` operations, all of which are re-estimated on each resample. Use `add_variables()` when no preprocessing is needed; use `add_recipe()` when imputation, scaling, or other learned steps must stay leak-free across folds.

**Can I swap the selection later?**

Yes. Use `update_variables(wf, new_outcome, new_predictors)`. It replaces the selection in the existing workflow without touching the model spec or any fitted state. Calling `add_variables()` twice on the same workflow fails because the preprocessor slot is already filled.
