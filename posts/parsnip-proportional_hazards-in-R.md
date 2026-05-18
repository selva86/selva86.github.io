---
title: "parsnip proportional_hazards() in R: Cox Survival Models"
slug: parsnip-proportional_hazards-in-R
description: "proportional_hazards() in R fits a Cox proportional hazards model via parsnip and the censored package. Covers engines, hazard ratios, and prediction types."
keywords: "parsnip proportional_hazards, proportional_hazards function R, parsnip proportional_hazards examples, Cox proportional hazards tidymodels, Cox model parsnip, censored regression R"
mathjax: false
webr: true
date: "2026-05-18"
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "proportional_hazards()|parsnip proportional_hazards|parsnip::proportional_hazards()|Cox proportional hazards model|Cox model in R"
auto_link_case_sensitive: true
target_keyword: "parsnip proportional_hazards"
sibling_block_enabled: true
difficulty: Intermediate
---

# parsnip proportional_hazards() in R: Cox Survival Models

<p class="lead">The parsnip <code>proportional_hazards()</code> function defines a Cox proportional hazards model for time-to-event data in tidymodels. It gives you one interface that fits a classic or penalized Cox model underneath.</p>

[QUICK ANSWER]
proportional_hazards()                                  # Cox model, survival engine
proportional_hazards() |> set_engine("survival")        # classic Cox via coxph
proportional_hazards(penalty = 0.01) |> set_engine("glmnet")  # penalized Cox
fit(spec, Surv(time, status) ~ ., data = df)            # train on a Surv() outcome
predict(fit, new_data, type = "time")                   # predicted event time
predict(fit, new_data, type = "linear_pred")            # linear predictor (log-hazard)
predict(fit, new_data, type = "survival", eval_time = t)  # survival probability

[DECISION TREE: Is proportional_hazards() the right tool?]
- hazard ratios from a Cox model: proportional_hazards()
- assume a named event-time distribution: survival_reg(dist = "weibull")
- tree-based survival model: decision_tree() with censored mode
- boosted survival model: boost_tree() with censored mode
- plain numeric outcome, no censoring: linear_reg()
- count of events per period: poisson_reg()

## What proportional_hazards() does

**proportional_hazards() is a model specification, not a fitted model.** It records your intent to build a Cox proportional hazards model in tidymodels, but no data touches it until you call `fit()`. The same specification can be reused across datasets or resampling folds.

The Cox model studies time-to-event data, where the outcome is the time until an event such as death, relapse, or customer churn. Its defining feature is that it models the hazard rate, the instantaneous risk of the event, as a baseline hazard multiplied by `exp()` of a linear predictor. The word proportional means each covariate scales the hazard by a constant factor that does not change over time.

Unlike `survival_reg()`, the Cox model never assumes a shape for the baseline hazard. It is semi-parametric: it estimates covariate effects while leaving the baseline unspecified. That makes it the default choice when hazard ratios, not predicted times, are the goal. See the [parsnip reference](https://parsnip.tidymodels.org/reference/proportional_hazards.html) for the full argument list.

[KEY INSIGHT]
**The Cox model estimates relative risk without ever modeling the baseline hazard.** It cancels the baseline out of the likelihood and keeps only the hazard ratios. That is why `proportional_hazards()` hands you clean `exp(coef)` ratios but needs extra steps to produce an absolute predicted time.

## proportional_hazards() syntax and arguments

**The signature is short, and most arguments only matter for one engine.** The `survival` engine has no tuning parameters at all.

```r title="proportional_hazards arguments"
proportional_hazards(
  mode    = "censored regression",  # the only supported mode
  engine  = "survival",             # backend: survival or glmnet
  penalty = NULL,                   # glmnet only: regularization amount
  mixture = NULL                    # glmnet only: 0 = ridge, 1 = lasso
)
```

The `mode` argument is fixed at `"censored regression"`, so you rarely set it. The `engine` argument picks the backend: `survival` fits a classic Cox model with `survival::coxph()`, while `glmnet` fits a penalized Cox model for variable selection. The `penalty` and `mixture` arguments tune that penalization and are ignored by the survival engine.

[NOTE]
**proportional_hazards() ships in core parsnip, but the engines need the censored package.** Loading `library(censored)` registers the survival and glmnet engines with parsnip. Without it, parsnip reports that the engine is unavailable even though the survival package is installed.

## Fitting a proportional_hazards() model: examples

**Start by loading the framework and defining a specification.** The `lung` dataset from the survival package records survival times for advanced lung cancer patients.

```r title="Define a proportional_hazards specification"
library(tidymodels)
library(censored)
library(survival)

cox_spec <- proportional_hazards() |>
  set_engine("survival")

cox_spec
#> Proportional Hazards Model Specification (censored regression)
#>
#> Computational engine: survival
```

The outcome must be a `Surv()` object that pairs the follow-up `time` with the event `status`. In `lung`, status is coded 1 for censored and 2 for dead, which `Surv()` reads automatically.

```r title="Fit the Cox model to lung data"
cox_fit <- cox_spec |>
  fit(Surv(time, status) ~ age + sex + ph.ecog, data = lung)

cox_fit
#> parsnip model object
#>
#> Call:
#> survival::coxph(formula = Surv(time, status) ~ age + sex + ph.ecog,
#>     data = data, x = TRUE, model = TRUE)
#>
#>             coef exp(coef)  se(coef)      z        p
#> age     0.011281  1.011345  0.009319  1.211  0.22606
#> sex    -0.548562  0.577780  0.174861 -3.137  0.00171
#> ph.ecog 0.461585  1.586590  0.113493  4.067 4.76e-05
#>
#> Likelihood ratio test=30.5  on 3 df, p=1.083e-06
#> n= 227, number of events= 164
#>    (1 observation deleted due to missingness)
```

The `exp(coef)` column holds the hazard ratios. A value of `0.578` for `sex` means the higher-coded group has roughly 58 percent of the reference hazard, while `1.587` for `ph.ecog` means each one-point rise in the performance score lifts the hazard by about 59 percent.

```r title="Hazard ratios with broom tidy"
tidy(cox_fit, exponentiate = TRUE)
#> # A tibble: 3 x 5
#>   term    estimate std.error statistic  p.value
#>   <chr>      <dbl>     <dbl>     <dbl>    <dbl>
#> 1 age        1.01    0.00932     1.21  0.226
#> 2 sex        0.578   0.175      -3.14  0.00171
#> 3 ph.ecog    1.59    0.113       4.07  0.0000476
```

[TIP]
**Test the proportional hazards assumption before trusting the coefficients.** Pull the underlying model with `extract_fit_engine()` and run `survival::cox.zph()` on it. A small p-value flags a covariate whose effect drifts over time, which breaks the model.

To get a survival curve, use `type = "survival"` and pass the times at which to evaluate it through `eval_time`. The result is a list column of small tibbles, one per subject.

```r title="Predict survival probabilities"
predict(
  cox_fit,
  new_data  = lung[1:3, ],
  type      = "survival",
  eval_time = c(100, 500)
)
#> # A tibble: 3 x 1
#>   .pred
#>   <list>
#> 1 <tibble [2 x 2]>
#> 2 <tibble [2 x 2]>
#> 3 <tibble [2 x 2]>
```

The linear predictor, the log-hazard relative to the average subject, comes from `type = "linear_pred"`. Negative values mean lower risk than average, positive values mean higher.

```r title="Predict the linear predictor"
predict(cox_fit, new_data = lung[1:3, ], type = "linear_pred")
#> # A tibble: 3 x 1
#>   .pred_linear_pred
#>               <dbl>
#> 1            -0.166
#> 2             0.291
#> 3             0.146
```

[WARNING]
**type = "time" returns the median survival time, which can be NA.** A Cox model has no parametric form, so a predicted time is read off the estimated survival curve. If a subject's curve never drops below 0.5 within the observed follow-up, the median is undefined and the prediction is `NA`.

## proportional_hazards() vs other censored models

**The censored package registers several model types.** Choose by the question you are asking, not just the shape of the data.

| Model | parsnip function | Best for |
|---|---|---|
| Cox proportional hazards | `proportional_hazards()` | Hazard ratios, no distribution assumption |
| Parametric survival | `survival_reg()` | Predicted times, smooth extrapolation |
| Penalized Cox | `proportional_hazards()` + glmnet | Many predictors, variable selection |
| Survival decision tree | `decision_tree()` | Non-linear effects, interpretable splits |
| Boosted survival model | `boost_tree()` | Highest predictive accuracy |

Use `proportional_hazards()` when relative risk between groups is the goal and you prefer not to commit to a distribution. Switch to `survival_reg()` when you trust a distributional assumption and want predicted times or curves that extend past the observed follow-up. Reach for tree or boosting engines when raw predictive accuracy outweighs interpretability.

## Common pitfalls

**Forgetting to load the censored package** is the most frequent error. The engine looks registered in the documentation but fails at fit time.

```r title="Pitfall: censored package not loaded"
# censored package not loaded
proportional_hazards() |> set_engine("survival") |> fit(Surv(time, status) ~ age, data = lung)
#> Error: The parsnip extension package censored is required.
# Fix: run library(censored) first
```

**Passing a bare numeric outcome** instead of a `Surv()` object silently changes the problem. The Cox model needs the censoring indicator, so the left side of the formula must be `Surv(time, status)`, never `time` alone.

**Requesting `type = "survival"` without `eval_time`** raises an error. Survival probabilities are only defined at specific times, so you must state which times you want.

## Try it yourself

**Try it:** Fit a Cox `proportional_hazards()` model on the `lung` dataset using `age` and `sex` as predictors, then get the hazard ratios with `tidy()`. Save the result to `ex_hr`.

```r title="Your turn: fit proportional_hazards"
# Try it: fit a Cox model and get hazard ratios
ex_fit <- # your code here
ex_hr <- # your code here

ex_hr
#> Expected: a 2-row tibble with hazard ratios in the estimate column
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_fit <- proportional_hazards() |>
  set_engine("survival") |>
  fit(Surv(time, status) ~ age + sex, data = lung)

ex_hr <- tidy(ex_fit, exponentiate = TRUE)
ex_hr
#> # A tibble: 2 x 5
#>   term  estimate std.error statistic  p.value
#>   <chr>    <dbl>     <dbl>     <dbl>    <dbl>
#> 1 age      1.02    0.00922     1.85  0.0646
#> 2 sex      0.599   0.167      -3.06  0.00221
```

**Explanation:** The specification fits a Cox model with the survival engine, and `tidy(exponentiate = TRUE)` converts the log-hazard coefficients into hazard ratios. The `sex` ratio near 0.6 means the higher-coded group has lower risk.

</details>

## Related tidymodels functions

- [survival_reg()](parsnip-survival_reg-in-R.html) fits a parametric survival model with assumed distributions.
- [set_engine()](parsnip-set_engine-in-R.html) swaps the backend, such as glmnet for a penalized Cox model.
- [fit()](parsnip-fit-in-R.html) trains a specification on a `Surv()` outcome.
- [predict()](parsnip-predict-in-R.html) returns times, survival probabilities, or the linear predictor.
- [extract_fit_engine()](parsnip-extract_fit_engine-in-R.html) reaches the underlying `coxph` object.

## FAQ

**What is proportional_hazards() in R?**
`proportional_hazards()` is a parsnip function that defines a Cox proportional hazards model for censored, time-to-event data. It records the engine and any penalization, but does not touch data until you call `fit()`. The Cox model estimates how covariates scale the event hazard without assuming a shape for the baseline hazard, which makes it a semi-parametric model.

**What is the difference between proportional_hazards() and survival_reg()?**
`proportional_hazards()` fits a Cox model that makes no distributional assumption and reports hazard ratios between groups. `survival_reg()` fits a parametric model that assumes a named distribution, such as Weibull, and can predict absolute event times. Use proportional_hazards() when relative risk is the goal; use survival_reg() when you want predicted times or smooth survival curves.

**What does the proportional hazards assumption mean?**
The assumption says each covariate multiplies the hazard by a constant factor that stays the same at every point in time. If a treatment helps early but stops helping later, that effect is not constant and the assumption is violated. Check it by running `survival::cox.zph()` on the model extracted with `extract_fit_engine()`.

**Why do I need the censored package for proportional_hazards()?**
`proportional_hazards()` lives in core parsnip, but its engines are registered by the `censored` extension package. Running `library(censored)` connects parsnip to the survival and glmnet backends. Without that call, parsnip reports the engine is unavailable even though the underlying survival package is installed.

**How do I get hazard ratios from a proportional_hazards() model?**
Fit the model, then call `tidy()` with `exponentiate = TRUE`. The Cox model estimates coefficients on the log-hazard scale, and exponentiating them converts each one into a hazard ratio. A ratio above 1 means higher risk, below 1 means lower risk, and the `std.error` and `p.value` columns help you judge significance.
