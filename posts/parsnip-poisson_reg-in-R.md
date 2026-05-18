---
title: "parsnip poisson_reg() in R: Model Count Data"
slug: parsnip-poisson_reg-in-R
description: "Use parsnip poisson_reg() in R to fit Poisson regression for count outcomes. Syntax, glm and glmnet engines, predictions, overdispersion, and pitfalls."
keywords: "parsnip poisson_reg, poisson_reg function R, parsnip poisson regression, poisson regression R tidymodels, poisson_reg examples, count data regression R"
mathjax: false
webr: true
date: "2026-05-18"
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: Poisson-Regression-in-R.html
auto_link_terms: "poisson_reg()|parsnip poisson_reg|parsnip::poisson_reg()|Poisson regression in R|count data regression"
auto_link_case_sensitive: true
target_keyword: "parsnip poisson_reg"
sibling_block_enabled: true
difficulty: Beginner
---

# parsnip poisson_reg() in R: Model Count Data

<p class="lead">The parsnip <code>poisson_reg()</code> function defines a Poisson regression model for non-negative count outcomes, such as events per period or defects per unit. It gives you one tidymodels interface that fits with the glm, glmnet, or zeroinfl engine underneath.</p>

[QUICK ANSWER]
poisson_reg()                                       # default spec, glm engine
poisson_reg() |> set_engine("glm")                  # standard Poisson GLM
poisson_reg(penalty = 0.1) |> set_engine("glmnet")  # penalized Poisson fit
poisson_reg() |> set_engine("zeroinfl")             # zero-inflated count model
spec |> set_mode("regression")                      # only mode poisson_reg allows
fit(spec, breaks ~ ., data = warpbreaks)            # train on a count outcome
predict(fit, new_data)                              # expected count per row

[DECISION TREE: Is poisson_reg() the right tool?]
- model non-negative event counts: poisson_reg() |> set_engine("glm")
- counts with many extra zeros: poisson_reg() |> set_engine("zeroinfl")
- variance far above the mean: negative binomial (MASS::glm.nb)
- predict a continuous number: linear_reg() |> set_engine("lm")
- predict a yes or no outcome: logistic_reg() |> set_engine("glm")
- predict 3+ unordered classes: multinom_reg() |> set_engine("nnet")

## What poisson_reg() does

**poisson_reg() is a model specification, not a fitted model.** It records your intent to build a Poisson regression and the hyperparameters you want, but no data touches it until you call `fit()`. This separation lets you reuse one specification across many datasets or resampling folds.

Poisson regression models a count outcome whose values are non-negative integers, like the number of customer calls per day or breaks per loom. It assumes the log of the expected count is a linear function of the predictors, so coefficients describe multiplicative effects on the rate.

The function belongs to the tidymodels framework. Because parsnip standardizes the interface, the same `poisson_reg()` code runs on the base glm engine or the penalized glmnet engine with only one line changed.

[KEY INSIGHT]
**A parsnip spec is a recipe for a model, not the model itself.** You build the specification once, then `fit()` turns it into a trained model object. Keeping those two steps apart is what makes tidymodels workflows reproducible across resamples.

[NOTE]
**poisson_reg() lives in the poissonreg extension package, not core parsnip.** Load it with `library(poissonreg)` after `library(tidymodels)`, or the function is not found. The extension registers the glm, glmnet, hurdle, zeroinfl, and stan engines.

## poisson_reg() syntax and arguments

**poisson_reg() takes two tuning arguments and two setup verbs.** The arguments control regularization, while `set_engine()` and `set_mode()` finish the specification.

```r title="The poisson_reg specification skeleton"
library(tidymodels)
library(poissonreg)

poisson_reg(
  mode = "regression",  # the only valid mode
  engine = "glm",       # glm (default), glmnet, zeroinfl, hurdle, stan
  penalty = NULL,       # amount of regularization, glmnet only
  mixture = NULL        # ridge-to-lasso blend, glmnet only
)
```

The `penalty` argument sets the total amount of regularization applied to coefficients. The `mixture` argument, used only by glmnet, blends ridge (`mixture = 0`) and lasso (`mixture = 1`) penalties. The default glm engine ignores both because it fits an unpenalized model.

**The mode is always regression.** A Poisson model predicts an expected count, which is a number, so `set_mode("regression")` is the only legal choice. You can pass the engine through `set_engine()` instead of the `engine` argument, which is the more common tidymodels style.

## Fit a Poisson model: four examples

**Every example below uses the built-in `warpbreaks` dataset.** Its `breaks` column counts warp breaks per loom, and `wool` and `tension` are the categorical predictors, which makes it a natural fit for a count model.

### Example 1: Fit with the default glm engine

**Build the specification, then fit it to data.** The glm engine fits a standard Poisson generalized linear model with a log link.

```r title="Fit poisson_reg on the warpbreaks data"
pois_spec <- poisson_reg() |>
  set_engine("glm") |>
  set_mode("regression")

pois_fit <- pois_spec |>
  fit(breaks ~ wool + tension, data = warpbreaks)

pois_fit
#> parsnip model object
#>
#> Call:  stats::glm(formula = breaks ~ wool + tension,
#>                    family = stats::poisson, data = data)
#>
#> Coefficients:
#> (Intercept)        woolB     tensionM     tensionH
#>      3.6920      -0.2060      -0.3213      -0.5185
#>
#> Degrees of Freedom: 53 Total (i.e. Null);  50 Residual
#> Null Deviance:      297.4
#> Residual Deviance: 210.4    AIC: 493.1
```

The fitted object reports one coefficient per predictor level on the log scale. The intercept is the log expected count for the reference levels, wool A and tension L.

### Example 2: Predict expected counts

**predict() returns a tidy tibble with one row per input row.** For a regression-mode model, the default prediction type gives the expected count.

```r title="Predict expected counts for new rows"
sample_rows <- warpbreaks[c(1, 28, 54), ]

predict(pois_fit, new_data = sample_rows)
#> # A tibble: 3 x 1
#>   .pred
#>   <dbl>
#> 1  40.1
#> 2  32.7
#> 3  19.4
```

Each output column from a parsnip model starts with `.pred`, which keeps prediction columns from clashing with your original data when you bind them back together.

### Example 3: Interpret coefficients as rate ratios

**Exponentiate a coefficient to read it as a rate ratio.** On the count scale, `exp(coef)` tells you the multiplicative change in expected count for that predictor level.

```r title="Convert log coefficients to rate ratios"
exp(coef(extract_fit_engine(pois_fit)))
#> (Intercept)       woolB    tensionM    tensionH
#>   40.124386   0.813835   0.725147   0.595403
```

Wool B has a rate ratio of 0.81, so switching from wool A to wool B multiplies the expected break count by 0.81, a 19 percent drop. High tension cuts the rate to about 60 percent of the low-tension baseline.

### Example 4: Fit a penalized model with glmnet

**Switch to glmnet for regularized coefficients.** The glmnet engine needs a non-NULL `penalty`, and `mixture = 1` requests a pure lasso penalty that can shrink weak predictors to zero.

```r title="Fit a penalized Poisson model"
glmnet_fit <- poisson_reg(penalty = 0.05, mixture = 1) |>
  set_engine("glmnet") |>
  set_mode("regression") |>
  fit(breaks ~ wool + tension, data = warpbreaks)

predict(glmnet_fit, new_data = warpbreaks[c(1, 54), ])
#> # A tibble: 2 x 1
#>   .pred
#>   <dbl>
#> 1  37.8
#> 2  20.6
```

[TIP]
**Tune the penalty instead of guessing it.** Set `penalty = tune()` in the specification, then pass it to `tune_grid()` with a resampling object. The framework searches a grid of penalty values and reports which one generalizes best.

## poisson_reg() vs other regression models

**Pick the model by the type of outcome you are predicting.** `poisson_reg()` handles non-negative counts; the alternatives below cover the other cases.

| Function | Outcome type | Default engine | Use when |
|---|---|---|---|
| `poisson_reg()` | non-negative counts | glm | Calls, defects, visits |
| `linear_reg()` | numeric, continuous | lm | Price, temperature, score |
| `logistic_reg()` | exactly 2 classes | glm | Yes/no, churn, spam |
| `multinom_reg()` | 3+ unordered classes | nnet | Species, product category |
| `rand_forest()` | counts or any outcome | ranger | Non-linear effects, interactions |

Use `poisson_reg()` when the outcome is a count and its variance is close to its mean. When the variance is much larger, the data is overdispersed and a negative binomial model fits better.

## Common pitfalls

**Three mistakes catch most newcomers to poisson_reg().** Each one below shows the problem and the fix.

The biggest is ignoring overdispersion. Poisson regression assumes the mean and variance of the count are equal. When the variance is far larger, standard errors come out too small and predictors look more significant than they are. Check the ratio of residual deviance to degrees of freedom; a value well above 1 signals trouble.

```r title="Penalty ignored without the glmnet engine"
# Wrong: glm ignores penalty, model is unpenalized
poisson_reg(penalty = 0.1) |> set_engine("glm")

# Right: glmnet actually applies the penalty
poisson_reg(penalty = 0.1) |> set_engine("glmnet")
```

A non-count outcome also trips people up. Poisson regression expects non-negative integers, so a continuous or negative response gives misleading results even though the fit may not error. Finally, forgetting `library(poissonreg)` makes `poisson_reg()` itself undefined, since the function ships in that extension package rather than core parsnip.

[WARNING]
**Overdispersion silently inflates significance.** If residual deviance divided by residual degrees of freedom is much greater than 1, refit with a negative binomial model (`MASS::glm.nb`) or a quasi-Poisson family before trusting any p-value.

## Try it yourself

**Try it:** Fit a Poisson model on `warpbreaks` using only `tension` as the predictor, then predict the expected count for the 54th row. Save the prediction to `ex_pred`.

```r title="Your turn: tension-only Poisson model"
# Try it: fit with tension as the only predictor
ex_spec <- # your code here
ex_fit  <- # your code here
ex_pred <- # your code here

ex_pred
#> Expected: a 1-row tibble with .pred near 24.7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_spec <- poisson_reg() |>
  set_engine("glm") |>
  set_mode("regression")

ex_fit <- ex_spec |>
  fit(breaks ~ tension, data = warpbreaks)

ex_pred <- predict(ex_fit, new_data = warpbreaks[54, ])
ex_pred
#> # A tibble: 1 x 1
#>   .pred
#>   <dbl>
#> 1  24.7
```

**Explanation:** The formula `breaks ~ tension` drops `wool` from the model. Row 54 has high tension, so the predicted expected count reflects only the tension effect against the low-tension baseline.

</details>

## Related parsnip functions

**poisson_reg() works alongside the rest of the parsnip model family.** These functions cover the neighboring tasks in a tidymodels project.

- `linear_reg()` defines a regression model for continuous numeric outcomes.
- `logistic_reg()` defines a two-class logistic regression model.
- `multinom_reg()` defines a multinomial model for three or more classes.
- `set_engine()` chooses the computational backend for any specification.
- `fit()` trains a specification on data and returns a model object.

## FAQ

**What package is poisson_reg() in?**

`poisson_reg()` ships in the `poissonreg` package, a parsnip extension, not in core parsnip itself. Load it with `library(poissonreg)` after loading tidymodels, or R reports that the function cannot be found. Installing the extension also registers its engines, including glm, glmnet, zeroinfl, hurdle, and stan.

**What is the difference between poisson_reg() and linear_reg()?**

`linear_reg()` models a continuous numeric outcome and assumes errors are roughly normal. `poisson_reg()` models a count outcome and assumes it follows a Poisson distribution with a log link. Because of the log link, Poisson coefficients describe multiplicative rate changes, while linear coefficients describe additive changes. Using `linear_reg()` on counts can predict impossible negative values.

**How do I handle overdispersion with poisson_reg()?**

First diagnose it by dividing the residual deviance by the residual degrees of freedom; a value well above 1 indicates overdispersion. Poisson regression assumes the mean equals the variance, and overdispersion violates that. The usual fix is a negative binomial model through `MASS::glm.nb`, or a quasi-Poisson family that inflates the standard errors.

**Does poisson_reg() support an offset or exposure term?**

Yes. When counts come from units of different size or exposure, add an offset directly in the model formula, for example `fit(spec, events ~ . + offset(log(exposure)), data = df)`. The offset enters the linear predictor with a fixed coefficient of one, so the model predicts a rate per unit of exposure rather than a raw count.

**Can I tune the penalty in poisson_reg()?**

Yes, set `penalty = tune()` in the specification and use the glmnet engine. Pass the specification to `tune_grid()` with a resampling object such as `vfold_cv()`, and the framework searches a grid of penalty values. Use `select_best()` to pick the value with the best metric, then `finalize_workflow()` to lock it in before the final fit.

For the full argument reference, see the [parsnip poisson_reg() documentation](https://parsnip.tidymodels.org/reference/poisson_reg.html).
</content>
</invoke>
