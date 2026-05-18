---
title: "parsnip predict() in R: Score New Data With a Fit"
slug: parsnip-predict-in-R
description: "parsnip predict() in R scores new data from a fitted model. Covers the new_data argument, prediction types like class and prob, the .pred tibble, and errors."
keywords: "parsnip predict, predict function R, parsnip predict examples, predict tidymodels R, parsnip predict new data, model_fit predict"
mathjax: false
webr: true
date: "2026-05-18"
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "predict()|parsnip predict|parsnip::predict()|predict.model_fit|parsnip predict()"
auto_link_case_sensitive: true
target_keyword: "parsnip predict"
sibling_block_enabled: true
difficulty: Beginner
---

# parsnip predict() in R: Score New Data With a Fit

<p class="lead">The parsnip <code>predict()</code> function in R scores new data from a fitted model and returns a tidy tibble. You pass a <code>model_fit</code> object and a <code>new_data</code> frame, and predict() returns one row per input row with standardized <code>.pred</code> columns.</p>

[QUICK ANSWER]
predict(model_fit, new_data = df)                     # default prediction
predict(model_fit, new_data = df, type = "class")     # predicted class label
predict(model_fit, new_data = df, type = "prob")      # class probabilities
predict(model_fit, new_data = df, type = "conf_int")  # confidence interval
predict(model_fit, new_data = df, type = "pred_int")  # prediction interval
predict(model_fit, new_data = df, type = "raw")       # raw engine output
augment(model_fit, new_data = df)                     # predictions joined to data

[DECISION TREE: Is predict() the right tool?]
- score new rows from a fit: predict(model_fit, new_data = df)
- predictions joined to the data: augment(model_fit, new_data = df)
- fit then predict the test split: last_fit(spec, split)
- predictions across CV folds: collect_predictions(resamples)
- compare predicted vs actual: bind_cols(predict(fit, df), df)
- reach the raw engine method: extract_fit_engine(model_fit)

## What predict() does

**predict() turns a fitted model into predictions on new data.** It takes a `model_fit` object produced by `fit()` and a data frame of rows to score, then returns a tibble of predicted values. The parsnip method behind it is `predict.model_fit()`.

The headline feature is consistency. Base R prediction methods each return a different shape: `lm` gives a named vector, `glm` gives probabilities, `ranger` gives a list. parsnip wraps all of them so `predict()` always returns a tibble with the same number of rows as `new_data`, in the same order.

That tidy output is what makes the result safe to bind back onto your data with `bind_cols()`. No row scrambling, no length mismatches, no guessing which column holds the answer.

[KEY INSIGHT]
**predict() always returns a tibble, never a bare vector.** Because the row count and order match `new_data` exactly, you can column-bind the result straight onto the input frame. This single guarantee removes the most common class of prediction bugs in base R.

## predict() syntax and arguments

**predict() needs a fitted model and new data, with type controlling the output.** Every other argument is optional.

```r title="The predict argument skeleton"
predict(
  object,            # a fitted model_fit object
  new_data,          # a data frame of rows to score
  type = NULL,       # "numeric", "class", "prob", "conf_int", ...
  opts = list(),     # options passed to the engine predict method
  ...                # passed on to the engine
)
```

The `object` argument is the result of `fit()`. The `new_data` argument holds the rows you want scored, and it must contain every predictor column the model was trained on. When `type` is `NULL`, parsnip picks a sensible default: `"numeric"` for regression and `"class"` for classification.

**The type argument decides which prediction you get.** Setting `type = "prob"` returns class probabilities, while `type = "conf_int"` returns interval bounds. The column names in the returned tibble follow from the type, so the output is predictable before you run it.

## Predict from a model: four examples

**Each example below uses a built-in R dataset.** The `mtcars` data drives regression, and a factor version of its `am` column drives classification, so the code runs anywhere with no downloads.

### Example 1: Predict numeric values

**For a regression fit, predict() returns a single .pred column.** This is the default, so no `type` argument is needed.

```r title="Predict numeric values from a regression fit"
library(tidymodels)

lm_fit <- linear_reg() |>
  set_engine("lm") |>
  fit(mpg ~ wt + hp, data = mtcars)

predict(lm_fit, new_data = mtcars[1:5, ])
#> # A tibble: 5 x 1
#>   .pred
#>   <dbl>
#> 1  23.6
#> 2  22.6
#> 3  25.3
#> 4  21.3
#> 5  18.3
```

The result is a five-row tibble with one `.pred` column, matching the five rows passed in. Predicted fuel economy falls as weight and horsepower rise, which tracks the data.

### Example 2: Predict the class label

**For classification, predict() returns a .pred_class factor.** The fitted spec must be a classifier and the outcome a factor.

```r title="Predict the class label of new rows"
cars <- mtcars
cars$am <- factor(cars$am, labels = c("auto", "manual"))

glm_fit <- logistic_reg() |>
  set_engine("glm") |>
  fit(am ~ mpg + hp, data = cars)

predict(glm_fit, new_data = cars[1:5, ], type = "class")
#> # A tibble: 5 x 1
#>   .pred_class
#>   <fct>
#> 1 manual
#> 2 manual
#> 3 manual
#> 4 auto
#> 5 auto
```

The `.pred_class` column holds the predicted label for each row. parsnip applies the standard 0.5 probability cutoff to turn the model output into a class.

### Example 3: Predict class probabilities

**Set type = "prob" to get one probability column per class.** The columns are named `.pred_<level>` using the factor levels.

```r title="Predict class probabilities"
predict(glm_fit, new_data = cars[1:5, ], type = "prob")
#> # A tibble: 5 x 2
#>   .pred_auto .pred_manual
#>        <dbl>        <dbl>
#> 1     0.244        0.756
#> 2     0.244        0.756
#> 3     0.110        0.890
#> 4     0.621        0.379
#> 5     0.665        0.335
```

Each row's probabilities sum to one. Use this output when you need a score rather than a hard label, for example to set a custom decision threshold or to compute `roc_auc()`.

### Example 4: Join predictions back to the data

**Because predict() preserves row order, bind_cols() lines predictions up with actuals.** This is the standard way to build a results table for plotting or scoring.

```r title="Bind predictions to the original rows"
results <- mtcars[1:5, ] |>
  bind_cols(predict(lm_fit, new_data = mtcars[1:5, ]))

results[, c("mpg", ".pred")]
#> # A tibble: 5 x 2
#>     mpg .pred
#>   <dbl> <dbl>
#> 1  21    23.6
#> 2  21    22.6
#> 3  22.8  25.3
#> 4  21.4  21.3
#> 5  18.7  18.3
```

The `augment()` function does this same join in one call and also adds a `.resid` column for regression. Use `bind_cols()` when you want only the prediction, and `augment()` when you want the full annotated frame.

## Prediction types in parsnip

**The type argument is the same across every engine, which is the whole point of parsnip.** A `decision_tree()` and a `rand_forest()` accept the identical `type` values even though their engines differ.

| type | Returns columns | Works with |
|---|---|---|
| `"numeric"` | `.pred` | Regression models |
| `"class"` | `.pred_class` | Classification models |
| `"prob"` | `.pred_<level>` | Classification models |
| `"conf_int"` | `.pred_lower`, `.pred_upper` | Regression, engine permitting |
| `"pred_int"` | `.pred_lower`, `.pred_upper` | Regression, engine permitting |
| `"raw"` | Engine-native output | Any model |

The decision rule is simple. Use `"numeric"` or `"class"` for point predictions, `"prob"` when you need scores, and the interval types when you need uncertainty. Reach for `"raw"` only when an engine offers something parsnip does not standardize, since `"raw"` gives back the unwrapped engine result.

[NOTE]
**Not every engine supports every type.** Interval types such as `"conf_int"` need an engine that can produce them, and `predict()` raises a clear error if you ask for an unsupported type. The `lm` engine supports intervals; many tree engines do not.

## Common pitfalls

**Two mistakes catch most newcomers to predict().** Each one below shows the problem and the fix.

The most common is naming the data argument `data` instead of `new_data`. Base R `predict()` methods use `newdata`, and parsnip deliberately renamed it to `new_data`, so the wrong name fails.

```r title="predict() needs new_data, not data"
# Wrong: parsnip predict() has no data argument
predict(lm_fit, data = mtcars)
#> Error: argument "new_data" is missing, with no default

# Right: name the argument new_data
predict(lm_fit, new_data = mtcars)
```

The second pitfall is a `new_data` frame missing a predictor column. parsnip checks that every column used in the training formula is present, and stops with an error naming the missing variable. Build `new_data` with the same columns as the training data, even if some are not the outcome.

[WARNING]
**Asking for type = "prob" on a regression fit fails.** Probability output only exists for classification models. If `predict()` reports that the type is not supported, check that your spec set `set_mode("classification")` and the outcome column is a factor.

## Try it yourself

**Try it:** Fit a `linear_reg()` model with the `lm` engine predicting `mpg` from `disp` on `mtcars`, then predict the first three rows. Save the prediction tibble to `ex_pred`.

```r title="Your turn: predict mpg from disp"
# Try it: fit then predict with parsnip
ex_fit  <- # your code here
ex_pred <- # your code here

ex_pred
#> Expected: a 3-row tibble with one .pred column
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_fit <- linear_reg() |>
  set_engine("lm") |>
  fit(mpg ~ disp, data = mtcars)

ex_pred <- predict(ex_fit, new_data = mtcars[1:3, ])

ex_pred
#> # A tibble: 3 x 1
#>   .pred
#>   <dbl>
#> 1  23.0
#> 2  23.0
#> 3  25.1
```

**Explanation:** `fit()` trains the model and `predict()` scores the three rows. The result is a tibble with one `.pred` column and three rows, matching the rows passed to `new_data`.

</details>

## Related parsnip functions

**predict() is the scoring step of the parsnip workflow.** These functions cover the neighboring steps in a tidymodels project.

- `fit()` trains a model specification and returns the `model_fit` that `predict()` consumes.
- `augment()` predicts and binds the result onto `new_data` in one call.
- `set_mode()` sets classification or regression, which decides the default prediction type.
- `last_fit()` fits on the training split and predicts the test split together.
- `extract_fit_engine()` pulls the raw engine object when you need its native predict method.

## FAQ

**What does parsnip predict() return?**

`predict()` returns a tibble, never a bare vector. It has the same number of rows as `new_data` and keeps the original row order, so you can bind it back onto your data safely. The column names depend on the prediction type: `.pred` for regression, `.pred_class` for class labels, and `.pred_<level>` columns for probabilities. This consistent shape is the main reason parsnip wraps the many different base R predict methods.

**What is the difference between data and new_data in predict()?**

parsnip `predict()` uses the argument name `new_data`, with an underscore. Base R methods use `newdata` and some functions use `data`, so it is easy to type the wrong one. If you pass `data =`, parsnip does not recognize it and reports that `new_data` is missing. Always name the scoring frame `new_data` when calling the parsnip method.

**How do I get class probabilities from predict()?**

Pass `type = "prob"` to `predict()`. The model must be a classification spec, meaning its mode is `"classification"` and the outcome column is a factor. The result has one column per class, named `.pred_<level>`, and each row's probabilities sum to one. Use probability output to compute metrics like `roc_auc()` or to apply a custom decision threshold instead of the default 0.5 cutoff.

**Why does predict() say a column is missing?**

parsnip checks that `new_data` contains every predictor used in the training formula. If a column is absent, `predict()` stops and names the missing variable. Build `new_data` with the same predictor columns as the training data. The outcome column does not need to be present, but every predictor does, and the column types should match the training data.

**Can I predict from a workflow the same way?**

Yes. When you `fit()` a workflow, the result is a fitted workflow, and `predict()` works on it identically. The workflow first applies its recipe or formula preprocessing to `new_data`, then runs the model prediction. You do not re-apply the recipe yourself, which is one of the main reasons to wrap a model and preprocessing in a workflow.

For the full argument reference, see the [parsnip predict() documentation](https://parsnip.tidymodels.org/reference/predict.model_fit.html).
</content>
</invoke>
