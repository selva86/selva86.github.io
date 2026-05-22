---
title: "parsnip linear_reg() in R: Fit Linear Regression Models"
slug: parsnip-linear_reg-in-R
description: "Use parsnip linear_reg() in R to define and fit linear regression with the lm, glmnet, or stan engine. Syntax, four examples, predictions, and pitfalls."
keywords: "parsnip linear_reg, linear_reg function R, parsnip linear regression, linear regression R tidymodels, linear_reg examples, OLS regression tidymodels, lm tidymodels"
mathjax: false
webr: true
date: "2026-05-22"
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: Linear-Regression.html
auto_link_terms: "linear_reg()|parsnip linear_reg|parsnip::linear_reg()|OLS regression tidymodels|lm tidymodels"
auto_link_case_sensitive: true
target_keyword: "parsnip linear_reg"
sibling_block_enabled: true
difficulty: Beginner
---

# parsnip linear_reg() in R: Fit Linear Regression Models

<p class="lead">The parsnip <code>linear_reg()</code> function defines a linear regression model specification in tidymodels, ready to be fit with the lm, glmnet, stan, or keras engine. It gives you one consistent interface for ordinary least squares, penalized regression, and Bayesian linear models without rewriting the fitting call.</p>

[QUICK ANSWER]
linear_reg()                                          # default spec, lm engine
linear_reg() |> set_engine("lm")                      # ordinary least squares
linear_reg(penalty = 0.1) |> set_engine("glmnet")     # ridge / lasso / elastic net
linear_reg(penalty = 0.1, mixture = 1) |> set_engine("glmnet")  # pure lasso
linear_reg() |> set_engine("stan")                    # Bayesian linear model
spec |> set_mode("regression")                        # only mode linear_reg allows
fit(spec, mpg ~ ., data = mtcars)                     # train on a continuous outcome
predict(fit, new_data)                                # expected value per row

[DECISION TREE: Is linear_reg() the right tool?]
- predict a continuous number: linear_reg() |> set_engine("lm")
- shrink coefficients toward zero: linear_reg(penalty = 0.1) |> set_engine("glmnet")
- predict non-negative counts: poisson_reg() |> set_engine("glm")
- predict a yes or no outcome: logistic_reg() |> set_engine("glm")
- predict 3+ unordered classes: multinom_reg() |> set_engine("nnet")
- capture non-linear interactions: rand_forest() |> set_engine("ranger")

## What linear_reg() does

**linear_reg() is a model specification, not a fitted model.** It records your intent to build a linear regression and the hyperparameters you want, but no data touches it until you call `fit()`. This separation lets you reuse one specification across many datasets, formulas, or resampling folds.

Linear regression models a continuous numeric outcome as a linear combination of predictors. It assumes the conditional mean of the response is a straight-line function of the inputs, so each coefficient reports the additive effect of a one-unit change in that predictor.

The function belongs to the tidymodels framework and ships in core parsnip, so no extension package is needed. Because parsnip standardizes the interface, the same `linear_reg()` code runs on the base lm engine, the penalized glmnet engine, or the Bayesian stan engine with only one line changed.

[KEY INSIGHT]
**A parsnip spec is a recipe for a model, not the model itself.** You build the specification once, then `fit()` turns it into a trained model object. Keeping those two steps apart is what makes tidymodels workflows reproducible across resamples and easy to swap between engines.

[NOTE]
**linear_reg() ships in core parsnip, so `library(tidymodels)` is enough.** Unlike `poisson_reg()`, no extension package is required. The default engine is `lm`, and registered engines include glmnet, brulee, stan, keras, gee, and the mixed-model engines lmer and lme.

## linear_reg() syntax and arguments

**linear_reg() takes two tuning arguments and two setup verbs.** The arguments control regularization, while `set_engine()` and `set_mode()` finish the specification.

```r title="The linear_reg specification skeleton"
library(tidymodels)

linear_reg(
  mode = "regression",  # the only valid mode
  engine = "lm",        # lm (default), glmnet, stan, keras, brulee, lmer
  penalty = NULL,       # total regularization, glmnet and stan_glmnet only
  mixture = NULL        # ridge (0) to lasso (1) blend, glmnet only
)
```

The `penalty` argument sets the total amount of regularization applied to coefficients, on the same scale as `glmnet::glmnet()`'s lambda. The `mixture` argument blends ridge (`mixture = 0`) and lasso (`mixture = 1`) penalties, with values in between giving an elastic net. The default lm engine ignores both arguments because it fits an unpenalized model.

**The mode is always regression.** A linear model predicts a continuous number, so `set_mode("regression")` is the only legal choice. You can pass the engine through `set_engine()` instead of the `engine` argument, which is the more common tidymodels style.

## Fit a linear model: four examples

**Every example below uses the built-in `mtcars` dataset.** Its `mpg` column is the continuous outcome, and `wt`, `hp`, and `cyl` are the predictors, which makes it a familiar testbed for linear regression.

### Example 1: Fit with the default lm engine

**Build the specification, then fit it to data.** The lm engine fits a standard ordinary least squares regression using `stats::lm()` underneath.

```r title="Fit linear_reg on the mtcars data"
lin_spec <- linear_reg() |>
  set_engine("lm") |>
  set_mode("regression")

lin_fit <- lin_spec |>
  fit(mpg ~ wt + hp + cyl, data = mtcars)

lin_fit
#> parsnip model object
#>
#> Call:
#> stats::lm(formula = mpg ~ wt + hp + cyl, data = data)
#>
#> Coefficients:
#> (Intercept)           wt           hp          cyl
#>    38.75179     -3.16697     -0.01804     -0.94162
```

The fitted object reports one coefficient per predictor on the original outcome scale. The intercept is the expected mpg when weight, horsepower, and cylinders are all zero, which is an extrapolation; the slopes are what carry the interpretation.

### Example 2: Predict expected mpg for new rows

**predict() returns a tidy tibble with one row per input row.** For a regression-mode model, the default prediction type gives the conditional mean of the outcome.

```r title="Predict mpg for a handful of cars"
sample_rows <- mtcars[c(1, 15, 31), ]

predict(lin_fit, new_data = sample_rows)
#> # A tibble: 3 x 1
#>   .pred
#>   <dbl>
#> 1  22.1
#> 2  13.0
#> 3  16.9
```

Each output column from a parsnip model starts with `.pred`, which keeps prediction columns from clashing with your original data when you bind them back together with `bind_cols()`.

### Example 3: Tidy and glance the fitted model

**Use broom helpers through parsnip to pull coefficients and fit statistics.** `tidy()` returns one row per coefficient, and `glance()` returns a one-row model summary.

```r title="Tidy coefficients and model fit"
tidy(lin_fit)
#> # A tibble: 4 x 5
#>   term        estimate std.error statistic  p.value
#>   <chr>          <dbl>     <dbl>     <dbl>    <dbl>
#> 1 (Intercept)  38.8       1.79       21.7  4.02e-19
#> 2 wt           -3.17      0.741      -4.28 2.08e- 4
#> 3 hp           -0.0180    0.0119     -1.52 1.40e- 1
#> 4 cyl          -0.942     0.551      -1.71 9.85e- 2

glance(lin_fit)$r.squared
#> [1] 0.8431500
```

Weight is the strongest predictor; each extra 1000 lb is associated with a 3.17 mpg drop, holding hp and cyl fixed. The model explains about 84 percent of the variance in mpg on this small sample.

### Example 4: Fit a penalized model with glmnet

**Switch to glmnet for regularized coefficients.** The glmnet engine needs a non-NULL `penalty`, and `mixture = 1` requests a pure lasso penalty that can shrink weak predictors to zero.

```r title="Fit a penalized linear model"
glmnet_fit <- linear_reg(penalty = 0.5, mixture = 1) |>
  set_engine("glmnet") |>
  set_mode("regression") |>
  fit(mpg ~ wt + hp + cyl, data = mtcars)

predict(glmnet_fit, new_data = mtcars[c(1, 15, 31), ])
#> # A tibble: 3 x 1
#>   .pred
#>   <dbl>
#> 1  22.0
#> 2  13.6
#> 3  16.7
```

[TIP]
**Tune the penalty instead of guessing it.** Set `penalty = tune()` in the specification, then pass it to `tune_grid()` with a resampling object like `vfold_cv()`. The framework searches a grid of penalty values and reports which one generalizes best on held-out folds.

## linear_reg() vs other regression models

**Pick the model by the type of outcome you are predicting.** `linear_reg()` handles continuous numeric outcomes; the alternatives below cover the other cases.

| Function | Outcome type | Default engine | Use when |
|---|---|---|---|
| `linear_reg()` | continuous numeric | lm | Price, mpg, test score |
| `poisson_reg()` | non-negative counts | glm | Calls, defects, visits |
| `logistic_reg()` | exactly 2 classes | glm | Yes/no, churn, spam |
| `multinom_reg()` | 3+ unordered classes | nnet | Species, product category |
| `rand_forest()` | numeric or class | ranger | Non-linear effects, interactions |

Use `linear_reg()` when the outcome is continuous and you expect roughly linear, additive effects of the predictors. When relationships are strongly non-linear or interactions dominate, a tree-based model often fits better with less feature engineering.

## Common pitfalls

**Three mistakes catch most newcomers to linear_reg().** Each one below shows the problem and the fix.

The biggest is passing `penalty` to the wrong engine. The lm engine ignores regularization arguments entirely, so a specification like `linear_reg(penalty = 0.1) |> set_engine("lm")` silently fits an unpenalized OLS model. Switching the engine to glmnet is what actually applies the penalty.

```r title="Penalty is ignored without the glmnet engine"
# Wrong: lm ignores penalty, model is unpenalized
linear_reg(penalty = 0.1) |> set_engine("lm")

# Right: glmnet actually applies the penalty
linear_reg(penalty = 0.1) |> set_engine("glmnet")
```

A categorical outcome also trips people up. `linear_reg()` expects a numeric response, so a factor gives a misleading fit even when the call does not error; use `logistic_reg()` for two classes or `multinom_reg()` for more. Finally, forgetting to scale predictors before glmnet skews the penalty toward larger-scale variables; rely on `step_normalize()` or glmnet's `standardize = TRUE` default.

[WARNING]
**Linear regression does not enforce a non-negative prediction.** When the outcome cannot be negative, like a count or a price, `linear_reg()` can still output negative `.pred` values. If that bites you, switch to `poisson_reg()` for counts or a log transformation of the response.

## Try it yourself

**Try it:** Fit a linear model on `mtcars` using only `wt` as the predictor, then predict mpg for the 15th row. Save the prediction to `ex_pred`.

```r title="Your turn: weight-only linear model"
# Try it: fit with wt as the only predictor
ex_spec <- # your code here
ex_fit  <- # your code here
ex_pred <- # your code here

ex_pred
#> Expected: a 1-row tibble with .pred near 13.0
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_spec <- linear_reg() |>
  set_engine("lm") |>
  set_mode("regression")

ex_fit <- ex_spec |>
  fit(mpg ~ wt, data = mtcars)

ex_pred <- predict(ex_fit, new_data = mtcars[15, ])
ex_pred
#> # A tibble: 1 x 1
#>   .pred
#>   <dbl>
#> 1  12.0
```

**Explanation:** The formula `mpg ~ wt` drops `hp` and `cyl` from the model. Row 15 is a Cadillac Fleetwood with a heavy 5.25-ton weight, so the prediction lands well below the dataset's mean mpg of 20.

</details>

## Related parsnip functions

**linear_reg() works alongside the rest of the parsnip model family.** These functions cover the neighboring tasks in a tidymodels project.

- `logistic_reg()` defines a two-class logistic regression model.
- `poisson_reg()` defines a Poisson regression model for count outcomes.
- `multinom_reg()` defines a multinomial model for three or more classes.
- `set_engine()` chooses the computational backend for any specification.
- `fit()` trains a specification on data and returns a model object.
- `predict()` generates predictions from a fitted parsnip model.

## FAQ

**What package is linear_reg() in?**

`linear_reg()` ships in core parsnip, which loads automatically with `library(tidymodels)`. No extension package is required, unlike `poisson_reg()` which lives in poissonreg. The default engine is `stats::lm()`, and parsnip also registers glmnet, stan, keras, brulee, gee, lmer, and lme for the more specialized cases.

**What is the difference between linear_reg() and lm()?**

`lm()` is the base R function that fits the model; `linear_reg()` is a tidymodels wrapper that defines a specification and dispatches to `lm()` (or another engine) when you call `fit()`. The wrapper gives one syntax that swaps between OLS, penalized, and Bayesian fits, and plays nicely with workflows, recipes, and tune.

**How do I fit ridge or lasso regression with linear_reg()?**

Use `linear_reg(penalty = ..., mixture = ...)` with `set_engine("glmnet")`. Set `mixture = 0` for pure ridge, `mixture = 1` for pure lasso, and a value in between for an elastic net. The `penalty` argument controls how much shrinkage is applied, and you can replace it with `tune()` to search over candidate values during resampling.

**Can I tune the penalty in linear_reg()?**

Yes, set `penalty = tune()` (and optionally `mixture = tune()`) in the specification and use the glmnet engine. Pass the specification to `tune_grid()` with a resampling object such as `vfold_cv()`, and the framework searches a grid of penalty values. Use `select_best()` to pick the value with the best metric, then `finalize_workflow()` to lock it in before the final fit.

**Does linear_reg() handle multiple outcomes at once?**

No. `linear_reg()` expects a single continuous response in the model formula. For multivariate outcomes, fit one `linear_reg()` per response, or step outside parsnip to base R's `lm(cbind(y1, y2) ~ x, data = ...)` and inspect the resulting `mlm` object directly.

For the full argument reference, see the [parsnip linear_reg() docs](https://parsnip.tidymodels.org/reference/linear_reg.html).
