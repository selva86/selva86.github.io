---
title: "parsnip augment() in R: Add Predictions to Data"
slug: parsnip-augment-in-R
description: "Learn how parsnip augment() in R appends model predictions and residuals to your data frame, with hands-on regression and classification model fit examples."
keywords: "parsnip augment, augment function R, parsnip augment examples, R augment predictions, tidymodels augment, augment model_fit, add predictions to data R"
mathjax: false
webr: true
date: 2026-05-18
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: augment()|parsnip augment|parsnip::augment()|augment.model_fit|augment model fit|parsnip augment function
auto_link_case_sensitive: true
target_keyword: parsnip augment
sibling_block_enabled: true
difficulty: Beginner
---

# parsnip augment() in R: Add Predictions to Data

<p class="lead">The parsnip augment() function in R adds model predictions and residuals directly to your data frame, returning every original column plus new prediction columns in a single call.</p>

[QUICK ANSWER]
augment(fit, new_data = df)            # append .pred column to df
augment(lm_fit, new_data = test)       # regression: adds .pred and .resid
augment(cls_fit, new_data = test)      # classification: adds .pred_class + probs
augment(fit, new_data = df[, -1])      # no outcome column means no .resid
augment(fit, new_data = df)$.pred      # pull only the predictions vector
augment(fit, new_data = df)$.resid     # pull residuals for diagnostics

[DECISION TREE: Is augment() the right tool?]
- keep your data and add predictions: augment(fit, new_data = df)
- want only a predictions tibble: predict(fit, new_data = df)
- model not fitted yet: fit(spec, y ~ ., data = train)
- augment a full workflow object: augment(wf_fit, new_data = df)
- tidy the model coefficients: tidy(fit)
- one-row model fit summary: glance(fit)

## What augment() does

**augment() attaches predictions to your data instead of returning them separately.** You pass a fitted parsnip model and a data frame, and `augment()` runs the model on that data, then column-binds the prediction columns onto the original rows. The output is a tibble with the same number of rows as the input.

This is the key difference from `predict()`, which returns only the new columns. With `augment()` you never have to manually `bind_cols()` predictions back to your data, so the result is ready for plotting, error analysis, or export.

The columns added depend on the model's mode. A regression model gains a `.pred` column, and a `.resid` column when the true outcome is present. A classification model gains a `.pred_class` column plus one probability column per class.

[KEY INSIGHT]
**augment() is predict() plus your original data.** Reach for it whenever the next step needs predictions sitting next to the predictors that produced them, such as residual plots or grouped accuracy checks.

## augment() syntax and arguments

**The signature is short because most behavior is inferred from the model.** `augment()` is an S3 generic; the method for parsnip is `augment.model_fit()`.

```r title="augment generic signature"
augment(x, new_data, eval_time = NULL, ...)
```

| Argument | Description |
|----------|-------------|
| `x` | A fitted `model_fit` object produced by `fit()` or `fit_xy()`. |
| `new_data` | A data frame or matrix of predictors to generate predictions for. |
| `eval_time` | Evaluation times, used only for censored regression (survival) models. |
| `...` | Extra arguments passed through to `predict()`, such as `type`. |

The argument is named `new_data`, with an underscore. Passing `data =` instead is the single most common mistake, covered in the pitfalls section below.

## Augment a model: four examples

**Each example below uses a built-in dataset so you can run it as-is.** First, fit a linear regression model with the `parsnip` interface.

```r title="Fit a linear model with parsnip"
library(parsnip)

lm_fit <- linear_reg() |>
  set_engine("lm") |>
  fit(mpg ~ wt + hp, data = mtcars)

lm_fit
#> parsnip model object
#>
#> Call:  stats::lm(formula = mpg ~ wt + hp, data = data)
#>
#> Coefficients:
#> (Intercept)           wt           hp
#>    37.22727     -3.87783     -0.03177
```

**Example 1 augments regression data and adds residuals.** Because `mtcars` still contains the `mpg` outcome, `augment()` returns both `.pred` and `.resid`.

```r title="Augment regression predictions"
aug <- augment(lm_fit, new_data = mtcars)
aug[1:4, c("mpg", "wt", "hp", ".pred", ".resid")]
#> # A tibble: 4 x 5
#>     mpg    wt    hp .pred .resid
#>   <dbl> <dbl> <dbl> <dbl>  <dbl>
#> 1  21    2.62   110  23.0  -1.97
#> 2  21    2.88   110  22.0  -0.98
#> 3  22.8  2.32    93  25.3  -2.53
#> 4  21.4  3.22   110  21.1   0.30
```

**Example 2 augments a classification model.** A fitted classifier adds `.pred_class` and one probability column per outcome level.

```r title="Augment classification predictions"
tree_fit <- decision_tree(mode = "classification") |>
  set_engine("rpart") |>
  fit(Species ~ ., data = iris)

augment(tree_fit, new_data = iris)[c(1, 60, 120), 
  c("Species", ".pred_class", ".pred_setosa", ".pred_versicolor")]
#> # A tibble: 3 x 4
#>   Species    .pred_class .pred_setosa .pred_versicolor
#>   <fct>      <fct>              <dbl>            <dbl>
#> 1 setosa     setosa                 1            0
#> 2 versicolor versicolor             0            0.907
#> 3 virginica  virginica              0            0.022
```

**Example 3 augments fresh data with no outcome column.** When `new_data` lacks the response variable, `augment()` can still predict but omits `.resid`.

```r title="Augment new data without the outcome"
new_cars <- mtcars[1:3, c("wt", "hp")]
augment(lm_fit, new_data = new_cars)
#> # A tibble: 3 x 3
#>      wt    hp .pred
#>   <dbl> <dbl> <dbl>
#> 1  2.62   110  23.0
#> 2  2.88   110  22.0
#> 3  2.32    93  25.3
```

**Example 4 turns the augmented frame into a residual diagnostic.** Because predictions and residuals share one tibble, plotting them takes a single step.

```r title="Plot residuals from augmented data"
aug <- augment(lm_fit, new_data = mtcars)
plot(aug$.pred, aug$.resid,
     xlab = "Predicted mpg", ylab = "Residual")
abline(h = 0, lty = 2)
```

## augment() vs predict(): which to use

**Use augment() when you want context, and predict() when you want only the numbers.** Both call the same underlying model, so predictions are identical; they differ in what comes back.

| Aspect | `augment()` | `predict()` |
|--------|-------------|-------------|
| Returns | Original data plus prediction columns | Only prediction columns |
| Row count | Same as `new_data` | Same as `new_data` |
| Residuals | Adds `.resid` when outcome is present | Never |
| Best for | Diagnostics, plotting, grouped error | Feeding predictions into another step |

The decision rule is simple. If your next line of code needs the predictors or the true outcome alongside `.pred`, call `augment()`. If you only need a clean predictions tibble to bind elsewhere, `predict()` is leaner.

[TIP]
**Chain augment() straight into yardstick.** Since the augmented tibble holds both the truth and `.pred`, you can pipe it directly into metric functions like `rmse(aug, truth = mpg, estimate = .pred)` with no extra joins.

## Common pitfalls

**Three mistakes account for most augment() errors.** Each one below shows the failing pattern and the fix.

The first is using `data =` instead of `new_data =`. The parsnip method only recognizes `new_data`, so the wrong name triggers an unused-argument error.

```r title="Wrong argument name fails"
# augment(lm_fit, data = mtcars)
#> Error: unused argument (data = mtcars)
augment(lm_fit, new_data = mtcars)   # correct
```

The second is expecting `.resid` on data that has no outcome column. Residuals need the true value, so scoring data without the response returns predictions only. Include the outcome column in `new_data` if you need residuals.

The third is calling `augment()` on a raw engine object instead of a parsnip `model_fit`. A plain `lm()` result dispatches to `broom::augment()`, which uses different column names. Always augment the object returned by `parsnip::fit()`.

[WARNING]
**Column names can collide.** If `new_data` already contains a column called `.pred` or `.resid`, `augment()` overwrites it without warning. Rename pre-existing dotted columns before augmenting.

## Try it yourself

**Try it:** Fit a `linear_reg()` model of `mpg` on `disp` using the `lm` engine, then augment `mtcars` and save the result to `ex_aug`.

```r title="Your turn augment mtcars"
# Try it: fit, then augment
ex_fit <- # your code here
ex_aug <- # your code here

ncol(ex_aug)
#> Expected: 13 columns (11 original + .pred + .resid)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_fit <- linear_reg() |>
  set_engine("lm") |>
  fit(mpg ~ disp, data = mtcars)

ex_aug <- augment(ex_fit, new_data = mtcars)
ncol(ex_aug)
#> [1] 13
```

**Explanation:** `mtcars` has 11 columns, and `augment()` appends `.pred` plus `.resid` because the `mpg` outcome is present, giving 13 columns total.

</details>

## Related parsnip functions

**augment() works alongside the rest of the parsnip prediction toolkit.** These functions cover the steps before and after augmenting.

- `predict()` returns only the prediction columns, without the original data.
- `fit()` trains the model specification that `augment()` later consumes.
- `fit_xy()` trains a model from separate predictor and outcome objects.
- `set_engine()` chooses the computational engine behind the model.
- `translate()` shows the exact engine call parsnip will run.

See the official [augment.model_fit reference](https://parsnip.tidymodels.org/reference/augment.html) for engine-specific notes.

## FAQ

**What is the difference between augment() and predict() in parsnip?**

Both functions generate the same predictions from a fitted model. `predict()` returns a tibble containing only the new prediction columns, so you must bind it back to your data yourself. `augment()` does that bind for you, returning the full `new_data` with `.pred` (and `.resid` when the outcome is present) appended. Use `augment()` for diagnostics and plotting, and `predict()` when you only need the prediction values.

**Why does augment() not return a .resid column?**

The `.resid` column appears only when `new_data` includes the true outcome variable. Residuals are computed as the observed value minus the predicted value, so without the observed value there is nothing to subtract. If you augment holdout or scoring data that lacks the response column, you get `.pred` but no `.resid`. Add the outcome column to `new_data` to get residuals back.

**Can I use augment() on a workflow object?**

Yes. The `workflows` package provides its own `augment.workflow()` method that behaves like the parsnip one, applying any recipe preprocessing first. Calling `augment(wf_fit, new_data = df)` on a fitted workflow returns the original data with prediction columns added, and recent versions also return `.resid` under the same conditions as `augment.model_fit()`.

**What columns does augment() add for classification models?**

A classification `model_fit` gains a `.pred_class` column holding the predicted label. It also adds one probability column per outcome level, named `.pred_<level>`, such as `.pred_setosa` and `.pred_versicolor`. The probability columns sum to 1 across each row, and `.pred_class` is the level with the highest probability.
