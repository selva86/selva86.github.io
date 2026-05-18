---
title: "parsnip tidy() in R: Tidy Model Coefficients"
slug: parsnip-tidy-fit-in-R
description: "Learn how parsnip tidy() in R turns a fitted model into a tidy tibble with one row per coefficient, plus regression, classification, and conf.int examples."
keywords: "parsnip tidy, tidy parsnip fit, parsnip tidy function, tidy model_fit, tidymodels tidy coefficients, parsnip tidy examples, R tidy parsnip model"
mathjax: false
webr: true
date: 2026-05-18
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: tidy()|parsnip tidy|parsnip::tidy()|tidy.model_fit|tidy model fit|parsnip tidy function
auto_link_case_sensitive: true
target_keyword: parsnip tidy
sibling_block_enabled: true
difficulty: Beginner
---

# parsnip tidy() in R: Tidy Model Coefficients

<p class="lead">The parsnip tidy() function in R turns a fitted model into a tidy tibble with one row per coefficient, giving you estimates, standard errors, and p-values in a clean, plot-ready frame.</p>

[QUICK ANSWER]
tidy(fit)                              # one row per model term
tidy(lm_fit)                           # term, estimate, std.error, p.value
tidy(fit, conf.int = TRUE)             # add conf.low and conf.high
tidy(fit)$estimate                     # pull the coefficient vector
tidy(fit, exponentiate = TRUE)         # odds ratios for glm fits
tidy(extract_fit_engine(fit))          # tidy the raw engine object

[DECISION TREE: Is tidy() the right tool?]
- per-term coefficient table: tidy(fit)
- one-row model summary stats: glance(fit)
- predictions joined to your data: augment(fit, new_data = df)
- predictions only as a tibble: predict(fit, new_data = df)
- the raw engine model object: extract_fit_engine(fit)
- see the engine call parsnip builds: translate(spec)

## What tidy() does

**tidy() converts a fitted model into a rectangular tibble of coefficients.** You pass a parsnip `model_fit` object and `tidy()` returns one row per model term, with columns for the estimate, standard error, test statistic, and p-value. The result is a regular tibble, so it works directly with `dplyr`, `ggplot2`, or `subset()`.

This is the parsnip method `tidy.model_fit()`. It is a thin wrapper: parsnip hands the underlying engine object to the matching `broom` tidier, so a model fit with the `lm` engine gets `broom::tidy.lm()` applied for you. You never have to reach inside the fit yourself.

The point of `tidy()` is consistency. A `summary()` call prints model output as text that differs by engine and cannot be filtered or joined. The tidy tibble has the same shape and column names across engines, which makes coefficient tables comparable and scriptable.

The word "tidy" is precise here. Each variable is a column, each observation is a row, and each cell holds one value. A model term such as `(Intercept)` or `wt` is the observation, and its estimate, standard error, and p-value are the variables. That layout is exactly what `dplyr` verbs and `ggplot2` expect, so a tidy coefficient table drops straight into the rest of a tidyverse workflow with no reshaping.

`tidy()` is one of three broom verbs parsnip re-exports: `tidy()` for coefficients, `glance()` for whole-model statistics, and `augment()` for row-level predictions. Together they give an engine-agnostic vocabulary for inspecting any model you fit.

[KEY INSIGHT]
**tidy() is the "coefficients as data" verb.** Whenever the next step needs to filter, sort, plot, or export model terms, tidy the fit first instead of parsing printed `summary()` text.

## tidy() syntax and arguments

**The signature is short because tidy() infers almost everything from the fit.** It is an S3 generic; the method that runs for a parsnip object is `tidy.model_fit()`.

```r title="tidy generic signature"
tidy(x, ...)
```

| Argument | Description |
|----------|-------------|
| `x` | A fitted `model_fit` object produced by `fit()` or `fit_xy()`. |
| `...` | Extra arguments passed through to the engine's `broom` tidier, such as `conf.int` or `exponentiate`. |

The `...` is where most control lives. Arguments like `conf.int = TRUE` are forwarded to the underlying tidier, so what you can pass depends on the engine behind the model.

Because dispatch happens at the engine level, support for `tidy()` is not universal. The `lm`, `glm`, and `glmnet` engines all have mature broom tidiers and return rich coefficient tables. Tree and ensemble engines such as `ranger` and `xgboost` raise an error, since they have no coefficients to report. When in doubt, call `tidy()` once interactively before building it into a script.

## Tidy a model: four examples

**Each example uses a built-in dataset so you can run it as-is.** Start by fitting a linear regression model through the `parsnip` interface.

```r title="Fit a linear model with parsnip"
library(parsnip)

lm_fit <- linear_reg() |>
  set_engine("lm") |>
  fit(mpg ~ wt + hp, data = mtcars)
```

**Example 1 tidies a regression fit into a coefficient table.** The `lm` engine produces the standard five-column broom layout.

```r title="Tidy a linear regression fit"
tidy(lm_fit)
#> # A tibble: 3 x 5
#>   term        estimate std.error statistic  p.value
#>   <chr>          <dbl>     <dbl>     <dbl>    <dbl>
#> 1 (Intercept)  37.2       1.60       23.3  2.57e-20
#> 2 wt           -3.88      0.633      -6.13 1.12e- 6
#> 3 hp           -0.0318    0.00903    -3.52 1.45e- 3
```

Each row is one predictor. The `estimate` column holds the fitted coefficient, `std.error` its uncertainty, `statistic` the t-value, and `p.value` the significance test. Reading the `wt` row tells you that every extra 1,000 lbs lowers predicted `mpg` by about 3.88, and the tiny p-value confirms the effect is reliable.

**Example 2 tidies a classification model.** A logistic regression fit returns coefficients on the log-odds scale, one row per predictor.

```r title="Tidy a logistic regression fit"
mtcars2 <- transform(mtcars, vs = factor(vs))

glm_fit <- logistic_reg() |>
  set_engine("glm") |>
  fit(vs ~ mpg, data = mtcars2)

tidy(glm_fit)
#> # A tibble: 2 x 5
#>   term        estimate std.error statistic p.value
#>   <chr>          <dbl>     <dbl>     <dbl>   <dbl>
#> 1 (Intercept)   -8.83      3.16      -2.80 0.00518
#> 2 mpg            0.430     0.156      2.76 0.00578
```

The classification fit has the same five columns as the regression one, which is the whole appeal of `tidy()`. The `mpg` estimate of 0.43 is a change in log-odds, not a probability, so a one-unit rise in `mpg` multiplies the odds of `vs = 1` by `exp(0.43)`, roughly 1.5.

**Example 3 adds confidence intervals.** Passing `conf.int = TRUE` flows through to the broom tidier, which appends `conf.low` and `conf.high`.

```r title="Add confidence intervals to tidy output"
tidy(lm_fit, conf.int = TRUE)[, c("term", "estimate", "conf.low", "conf.high")]
#> # A tibble: 3 x 4
#>   term        estimate conf.low conf.high
#>   <chr>          <dbl>    <dbl>     <dbl>
#> 1 (Intercept)  37.2     33.96     40.50
#> 2 wt           -3.88    -5.17     -2.58
#> 3 hp           -0.0318  -0.0503   -0.0133
```

Confidence intervals turn point estimates into ranges. None of the three intervals here cross zero, so every term is significant at the chosen level. This is the same conclusion the p-values give, shown in a form that is easier to plot as error bars.

**Example 4 filters the tidy tibble to significant terms.** Because the output is plain data, ordinary subsetting selects the rows you want.

```r title="Keep only significant coefficients"
coefs <- tidy(lm_fit)
subset(coefs, p.value < 0.05, select = c(term, estimate, p.value))
#> # A tibble: 3 x 3
#>   term        estimate  p.value
#>   <chr>          <dbl>    <dbl>
#> 1 (Intercept)  37.2     2.57e-20
#> 2 wt           -3.88    1.12e- 6
#> 3 hp           -0.0318  1.45e- 3
```

## tidy() vs glance() vs summary()

**Pick tidy() for per-term detail, glance() for whole-model stats, and summary() only for a quick console look.** All three describe the same fit but answer different questions.

| Aspect | `tidy()` | `glance()` | `summary()` |
|--------|----------|------------|-------------|
| Returns | Tibble, one row per term | Tibble, one row per model | Printed text |
| Granularity | Coefficient level | Model level | Mixed |
| Scriptable | Yes | Yes | No |
| Best for | Coefficient plots, term filtering | Comparing models, R-squared, AIC | Eyeballing output |

The decision rule is simple. If you need the individual coefficients as data, call `tidy()`. If you need a single-row report card for the model, call `glance()`. Reach for `summary()` only when a quick printed view is enough and you will not reuse the numbers.

A common pattern combines the first two: run `glance()` across candidate models to compare AIC, then `tidy()` the winner to report its coefficients. Because both verbs return tibbles, model-comparison tables stay inside the tidyverse.

[TIP]
**Tidy output is ggplot-ready.** Because `tidy(fit, conf.int = TRUE)` returns `estimate`, `conf.low`, and `conf.high` as columns, you can build a coefficient plot with `geom_pointrange()` in a couple of lines, no manual data wrangling required.

## Common pitfalls

**Three mistakes account for most tidy() surprises.** Each one below shows the failing pattern and the fix.

The first is calling `tidy()` on a model whose engine has no tidier. Tree ensembles such as `ranger` random forests have thousands of split rules, not coefficients, so there is nothing to tidy.

```r title="No tidy method for some engines"
# rf_fit <- rand_forest(mode = "regression") |>
#   set_engine("ranger") |> fit(mpg ~ ., data = mtcars)
# tidy(rf_fit)
#> Error: No tidy method for objects of class ranger
```

The second is confusing `tidy()` with `glance()`. If you want R-squared, AIC, or the residual standard error, those are model-level statistics that live in `glance(fit)`, not in the per-term `tidy()` tibble.

The third is reading classification estimates as probabilities. A `logistic_reg()` fit reports coefficients on the log-odds scale. Pass `exponentiate = TRUE` to convert them to odds ratios, which are easier to interpret.

[WARNING]
**tidy() on a workflow needs an extracted fit.** Calling `tidy()` directly on a fitted `workflow` object can dispatch unexpectedly. Pull the parsnip model first with `extract_fit_parsnip(wf_fit)`, then tidy that.

## Try it yourself

**Try it:** Fit a `logistic_reg()` model of `vs` on `mpg` and `wt` using the `glm` engine, then tidy it and store the result in `ex_tidy`.

```r title="Your turn tidy a fit"
# Try it: fit, then tidy
ex_fit <- # your code here
ex_tidy <- # your code here

nrow(ex_tidy)
#> Expected: 3 rows
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_fit <- logistic_reg() |>
  set_engine("glm") |>
  fit(factor(vs) ~ mpg + wt, data = mtcars)

ex_tidy <- tidy(ex_fit)
nrow(ex_tidy)
#> [1] 3
```

**Explanation:** The tidy tibble has one row per model term: the intercept plus the `mpg` and `wt` coefficients, giving 3 rows total.

</details>

## Related parsnip functions

**tidy() sits inside a small family of model-inspection verbs.** These functions cover the rest of what you might extract from a fit.

- `glance()` returns a one-row tibble of model-level statistics like R-squared and AIC.
- `augment()` adds predictions and residuals to a data frame.
- `predict()` returns predictions only, as a clean tibble.
- `extract_fit_engine()` returns the raw underlying engine model object.
- `fit()` trains the model specification that `tidy()` later inspects.

See the official [parsnip reference](https://parsnip.tidymodels.org/reference/index.html) for engine-specific tidier notes.

## FAQ

**What does tidy() return for a parsnip model?**

`tidy()` returns a tibble with one row per model term. For a linear or logistic regression fit, the columns are `term`, `estimate`, `std.error`, `statistic`, and `p.value`. The exact columns depend on the engine, because parsnip forwards the fit to the matching `broom` tidier. Some engines, such as `glmnet`, add columns like `penalty`. The result is always a rectangular tibble, so you can filter, sort, and plot it.

**What is the difference between tidy() and glance() in parsnip?**

`tidy()` works at the coefficient level and returns one row per model term, so a three-predictor model gives three or four rows. `glance()` works at the model level and returns exactly one row holding whole-model statistics such as R-squared, AIC, and the residual standard error. Use `tidy()` when you care about individual predictors and `glance()` when you are comparing or summarizing entire models.

**Why does tidy() fail on my random forest model?**

Random forest engines like `ranger` have no `broom` tidier, because the model is an ensemble of trees rather than a set of coefficients. Calling `tidy()` on such a fit raises a "No tidy method" error. For tree-based models, inspect variable importance through the engine object returned by `extract_fit_engine()` instead, or use `vip::vi()`.

**Can I get confidence intervals from tidy()?**

Yes. Pass `conf.int = TRUE` and `tidy()` forwards it to the underlying broom tidier, which appends `conf.low` and `conf.high` columns. This works for `lm` and `glm` engines. You can also set the confidence level with `conf.level`, for example `tidy(fit, conf.int = TRUE, conf.level = 0.90)`. The interval columns make the output ready for a coefficient plot.
</content>
</invoke>
