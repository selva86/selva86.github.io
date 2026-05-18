---
title: "parsnip glance() in R: One-Row Model Summary"
slug: "parsnip-glance-fit-in-R"
description: "Learn how parsnip glance() in R returns a one-row tibble of whole-model statistics like R-squared, AIC, and deviance, across regression and classification fits."
keywords: "parsnip glance, glance parsnip fit, parsnip glance function, glance model_fit, tidymodels glance, parsnip glance examples, R glance parsnip model"
mathjax: false
webr: true
date: "2026-05-18"
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: "tidymodels-Exercises-in-R.html"
auto_link_terms: "glance()|parsnip glance|parsnip::glance()|glance.model_fit|glance model fit|parsnip glance function"
auto_link_case_sensitive: true
target_keyword: "parsnip glance"
sibling_block_enabled: true
difficulty: Beginner
---

# parsnip glance() in R: One-Row Model Summary

<p class="lead">The parsnip glance() function in R returns a one-row tibble of whole-model statistics, such as R-squared, AIC, and deviance, for any fitted <code>model_fit</code> object.</p>

[QUICK ANSWER]
glance(fit)                       # one-row model summary
glance(lm_fit)$r.squared          # pull a single statistic
glance(lm_fit)$AIC                # AIC for model comparison
glance(fit)[c("AIC", "BIC")]      # keep selected columns
rbind(glance(f1), glance(f2))     # stack models for comparison
glance(extract_fit_engine(fit))   # glance the raw engine fit

[DECISION TREE: Is glance() the right tool?]
- one-row whole-model summary: glance(fit)
- per-term coefficient table: tidy(fit)
- predictions joined to data: augment(fit, new_data = df)
- predictions only as a tibble: predict(fit, new_data = df)
- the raw engine model object: extract_fit_engine(fit)
- compare many tuned models: collect_metrics(tune_results)

## What glance() does

**glance() condenses an entire fitted model into a single tibble row.** You pass a parsnip `model_fit` object and `glance()` returns one row whose columns are model-level statistics: R-squared, adjusted R-squared, AIC, BIC, log-likelihood, deviance, and the residual degrees of freedom. Nothing in that row describes an individual predictor.

This is the parsnip method `glance.model_fit()`. It is a thin wrapper. parsnip hands the underlying engine object to the matching `broom` glance method, so a model fit with the `lm` engine gets `broom::glance.lm()` applied for you. You never reach inside the fit yourself.

The value of `glance()` is comparison. Whole-model statistics let you rank candidate models on a common scale, and because the result is a tibble with stable column names, those report cards stack into a single comparison table. A printed `summary()` cannot be stacked or joined.

`glance()` is one of three `broom` verbs parsnip re-exports. `tidy()` returns coefficients, `glance()` returns whole-model statistics, and `augment()` returns row-level predictions. Together they give an engine-agnostic vocabulary for inspecting any model you fit.

[KEY INSIGHT]
**glance() is the "model as one row" verb.** When the next step compares, ranks, or logs whole models rather than their coefficients, glance each fit so the summaries stack into a tidy comparison frame.

## glance() syntax and arguments

**The signature is short because glance() infers everything from the fit.** It is an S3 generic, and the method that runs for a parsnip object is `glance.model_fit()`.

```r title="glance generic signature"
glance(x, ...)
```

| Argument | Description |
|---|---|
| `x` | A fitted `model_fit` object produced by `fit()` or `fit_xy()`. |
| `...` | Extra arguments passed through to the engine's `broom` glance method. Most engines accept none. |

Unlike `tidy()`, `glance()` rarely needs extra arguments. The `...` exists for completeness, but the standard call is just `glance(fit)`.

Because dispatch happens at the engine level, support for `glance()` is not universal. The `lm`, `glm`, and `glmnet` engines have mature `broom` glance methods and return rich summary rows. Tree and ensemble engines such as `ranger` and `xgboost` raise an error, since there is no single likelihood or R-squared to report. Call `glance()` once interactively before building it into a script.

## Glance a model: four examples

**Each example uses a built-in dataset so you can run it as-is.** Start by fitting a linear regression model through the `parsnip` interface.

```r title="Fit a linear model with parsnip"
library(parsnip)

lm_fit <- linear_reg() |>
  set_engine("lm") |>
  fit(mpg ~ wt + hp, data = mtcars)
```

**Example 1 glances a regression fit.** The `lm` engine produces the full broom summary row with twelve columns.

```r title="Glance a linear regression fit"
glance(lm_fit)
#> # A tibble: 1 x 12
#>   r.squared adj.r.squared sigma statistic  p.value    df logLik   AIC   BIC
#>       <dbl>         <dbl> <dbl>     <dbl>    <dbl> <dbl>  <dbl> <dbl> <dbl>
#> 1     0.827         0.815  2.59      69.2 9.11e-12     2  -74.3  157.  163.
#> # i 3 more variables: deviance <dbl>, df.residual <int>, nobs <int>
```

One row holds the whole picture. The model explains 83% of the variance in `mpg` (`r.squared`), the overall F test is highly significant (`p.value`), and the `AIC` of 157 is the number you compare against rival models.

**Example 2 glances a classification model.** A logistic regression fit returns a different column set, because a `glm` has no R-squared.

```r title="Glance a logistic regression fit"
mtcars2 <- transform(mtcars, vs = factor(vs))

glm_fit <- logistic_reg() |>
  set_engine("glm") |>
  fit(vs ~ mpg, data = mtcars2)

glance(glm_fit)
#> # A tibble: 1 x 8
#>   null.deviance df.null logLik   AIC   BIC deviance df.residual  nobs
#>           <dbl>   <int>  <dbl> <dbl> <dbl>    <dbl>       <int> <int>
#> 1          43.9      31  -10.1  24.1  27.1     20.1          30    32
```

The classification summary swaps R-squared for `null.deviance` and `deviance`. The drop from a null deviance of 43.9 to a residual deviance of 20.1 shows that `mpg` explains a large share of the variation in `vs`.

**Example 3 compares two models.** Because each `glance()` call returns a one-row tibble, stacking them builds a comparison table.

```r title="Compare two models with glance"
lm_fit2 <- linear_reg() |>
  set_engine("lm") |>
  fit(mpg ~ wt, data = mtcars)

rbind(
  glance(lm_fit)[c("r.squared", "AIC", "BIC")],
  glance(lm_fit2)[c("r.squared", "AIC", "BIC")]
)
#> # A tibble: 2 x 3
#>   r.squared   AIC   BIC
#>       <dbl> <dbl> <dbl>
#> 1     0.827  157.  163.
#> 2     0.753  166.  170.
```

The two-predictor model wins on every column: higher R-squared and lower AIC and BIC. Lower information criteria mean a better fit-versus-complexity trade-off, so `mpg ~ wt + hp` is the model to keep.

**Example 4 pulls single statistics.** The glance row is a plain tibble, so `$` extracts any column as a value.

```r title="Pull statistics from the glance row"
g <- glance(lm_fit)
round(c(r2 = g$r.squared, adj_r2 = g$adj.r.squared, aic = g$AIC), 3)
#>      r2  adj_r2     aic
#>   0.827   0.815 156.652
```

Extracting named values like this is handy when you log model metrics to a results table or print a short fit report inside a larger script.

## glance() vs tidy() vs summary()

**Pick glance() for whole-model stats, tidy() for per-term detail, and summary() only for a quick console look.** All three describe the same fit but answer different questions.

| Aspect | `glance()` | `tidy()` | `summary()` |
|---|---|---|---|
| Returns | Tibble, one row per model | Tibble, one row per term | Printed text |
| Granularity | Model level | Coefficient level | Mixed |
| Scriptable | Yes | Yes | No |
| Best for | Comparing models, AIC, R-squared | Coefficient plots, term filtering | Eyeballing output |

The decision rule is simple. If you need a single report card for the model, call `glance()`. If you need the individual coefficients as data, call `tidy()`. Reach for `summary()` only when a quick printed view is enough and you will not reuse the numbers.

A common pattern combines the first two verbs. Run `glance()` across candidate models to compare AIC, then `tidy()` the winner to report its coefficients. Because both return tibbles, the model-selection workflow stays inside the tidyverse.

[TIP]
**glance() output stacks cleanly across models.** Map `glance()` over a list of fits and bind the rows to get a leaderboard. Sort that frame by `AIC` and the best model rises to the top with no manual bookkeeping.

## Common pitfalls

**Three mistakes account for most glance() surprises.** Each one has a clear fix.

The first is calling `glance()` on a model whose engine has no glance method. Tree ensembles such as `ranger` random forests have no single likelihood or R-squared, so there is nothing to summarize.

```r title="No glance method for some engines"
# rf_fit <- rand_forest(mode = "regression") |>
#   set_engine("ranger") |> fit(mpg ~ ., data = mtcars)
# glance(rf_fit)
#> Error: No glance method for objects of class ranger
```

The second is comparing the wrong models. AIC and BIC are only comparable when the models are fit to the same response and the same rows. Comparing the AIC of a regression model against a classification model is meaningless.

The third is confusing `glance()` with `tidy()`. If you want a coefficient and its p-value, that is per-term information and lives in `tidy(fit)`, not in the one-row `glance()` summary.

[WARNING]
**glance() on a workflow needs an extracted fit.** Calling `glance()` directly on a fitted `workflow` object can dispatch unexpectedly. Pull the parsnip model first with `extract_fit_parsnip(wf_fit)`, then glance that.

## Try it yourself

**Try it:** Fit a `linear_reg()` model of `mpg` on `disp` and `carb` with the `lm` engine, glance it, and store the result in `ex_glance`.

```r title="Your turn glance a fit"
# Try it: fit, then glance
ex_fit <- # your code here
ex_glance <- # your code here

nrow(ex_glance)
#> Expected: 1 row
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_fit <- linear_reg() |>
  set_engine("lm") |>
  fit(mpg ~ disp + carb, data = mtcars)

ex_glance <- glance(ex_fit)
nrow(ex_glance)
#> [1] 1
```

**Explanation:** `glance()` always returns exactly one row regardless of how many predictors the model has, because it summarizes the whole model rather than its terms.

</details>

## Related parsnip functions

**glance() sits inside a small family of model-inspection verbs.** These functions cover the rest of what you might extract from a fit.

- `tidy()` returns a tibble with one row per coefficient, including estimates and p-values.
- `augment()` adds predictions and residuals to a data frame.
- `predict()` returns predictions only, as a clean tibble.
- `extract_fit_engine()` returns the raw underlying engine model object.
- `fit()` trains the model specification that `glance()` later inspects.

See the official [parsnip reference](https://parsnip.tidymodels.org/reference/index.html) for engine-specific glance notes.

## FAQ

**What does glance() return for a parsnip model?**

`glance()` returns a tibble with exactly one row of whole-model statistics. For a linear regression fit, the columns include `r.squared`, `adj.r.squared`, `sigma`, `AIC`, `BIC`, `logLik`, and `deviance`. The exact columns depend on the engine, because parsnip forwards the fit to the matching `broom` glance method. A logistic regression fit, for example, reports `null.deviance` and `deviance` instead of R-squared.

**What is the difference between glance() and tidy() in parsnip?**

`glance()` works at the model level and returns one row of whole-model statistics such as R-squared and AIC. `tidy()` works at the coefficient level and returns one row per model term, with estimates, standard errors, and p-values. Use `glance()` when you compare or summarize entire models, and `tidy()` when you care about individual predictors.

**Why does glance() fail on my random forest model?**

Random forest engines like `ranger` have no `broom` glance method, because an ensemble of trees has no single likelihood, R-squared, or AIC to report. Calling `glance()` on such a fit raises a "No glance method" error. For tree-based models, evaluate performance with `yardstick` metrics on a test set instead, or inspect the engine object returned by `extract_fit_engine()`.

**How do I compare models with glance()?**

Call `glance()` on each fitted model and bind the one-row results together with `rbind()` or `dplyr::bind_rows()`. Sort the combined frame by `AIC` or `BIC`, lower values being better, to rank the candidates. This works only when the models share the same response variable and the same rows, since information criteria are not comparable across different datasets.
