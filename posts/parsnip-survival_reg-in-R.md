---
title: "parsnip survival_reg() in R: Parametric Survival Models"
slug: parsnip-survival_reg-in-R
description: "survival_reg() in R fits parametric survival regression models via parsnip and the censored package. Covers engines, distributions, and prediction types."
keywords: "parsnip survival_reg, survival_reg function R, parsnip survival_reg examples, parametric survival model R, censored regression tidymodels, survival_reg engine R"
mathjax: false
webr: true
date: "2026-05-18"
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "survival_reg()|parsnip survival_reg|parsnip::survival_reg()|parametric survival regression|censored regression in R"
auto_link_case_sensitive: true
target_keyword: "parsnip survival_reg"
sibling_block_enabled: true
difficulty: Intermediate
---

# parsnip survival_reg() in R: Parametric Survival Models

<p class="lead">The parsnip <code>survival_reg()</code> function defines a parametric survival regression model for time-to-event data in tidymodels. It gives you one interface that fits with the survival, flexsurv, or flexsurvspline engine underneath.</p>

[QUICK ANSWER]
survival_reg()                              # default Weibull, survival engine
survival_reg(dist = "exponential")          # exponential AFT model
survival_reg(dist = "lognormal")            # log-normal accelerated failure
survival_reg() |> set_engine("flexsurv")    # flexible parametric engine
fit(spec, Surv(time, status) ~ ., data = df) # train on a Surv() outcome
predict(fit, new_data, type = "time")       # predicted event time
predict(fit, new_data, type = "survival", eval_time = t)  # survival prob

[DECISION TREE: Is survival_reg() the right tool?]
- parametric time-to-event model: survival_reg(dist = "weibull")
- hazard ratios from a Cox model: proportional_hazards()
- tree-based survival model: decision_tree() with censored mode
- boosted survival model: boost_tree() with censored mode
- plain numeric outcome, no censoring: linear_reg()
- count of events per period: poisson_reg()

## What survival_reg() does

**survival_reg() is a model specification, not a fitted model.** It records your intent to build a parametric survival model and the distribution you want, but no data touches it until you call `fit()`. The same specification can then be reused across many datasets or resampling folds.

Survival regression models the time until an event happens, such as death, failure, or churn. The defining feature of this data is censoring: some subjects have not had the event by the end of the study, so you only know their time exceeds some value. A parametric survival model assumes the event times follow a named distribution, like Weibull or log-normal, and estimates that distribution from both observed and censored records.

The function belongs to the tidymodels framework. Because parsnip standardizes the interface, the same `survival_reg()` code runs on the classic survival engine or the more flexible flexsurv engine with only one line changed.

[KEY INSIGHT]
**Censored regression treats "still alive" as information, not missing data.** A subject who survives past the study end contributes a lower bound on their event time. survival_reg() uses that bound directly, which is why you cannot model this data with ordinary `linear_reg()`.

## survival_reg() syntax and arguments

**The function signature is short.** Most of the modeling choices live in `dist` and the engine.

```r title="survival_reg arguments"
survival_reg(
  mode   = "censored regression",  # the only supported mode
  engine = "survival",             # backend: survival, flexsurv, flexsurvspline
  dist   = NULL                    # distribution: weibull, exponential, lognormal
)
```

The `mode` argument is fixed at `"censored regression"`, so you rarely set it. The `engine` argument picks the backend package that does the math. The `dist` argument names the assumed event-time distribution; leaving it `NULL` lets the engine choose its default, which is Weibull for the survival engine.

[NOTE]
**survival_reg() ships in core parsnip, but the engines need the censored package.** Loading `library(censored)` registers the survival, flexsurv, and flexsurvspline engines with parsnip. Without it, parsnip reports that the engine is not available even though the survival package is installed.

## Fitting a survival_reg() model: examples

**Start by loading the framework and defining a specification.** The `lung` dataset from the survival package records survival times for advanced lung cancer patients.

```r title="Define a survival_reg specification"
library(tidymodels)
library(censored)
library(survival)

surv_spec <- survival_reg(dist = "weibull") |>
  set_engine("survival")

surv_spec
#> Parametric Survival Regression Model Specification (censored regression)
#>
#> Main Arguments:
#>   dist = weibull
#>
#> Computational engine: survival
```

The outcome must be a `Surv()` object that pairs the follow-up `time` with the event `status`. In `lung`, status is coded 1 for censored and 2 for dead, which `Surv()` interprets automatically.

```r title="Fit the model to lung data"
surv_fit <- surv_spec |>
  fit(Surv(time, status) ~ age + sex + ph.ecog, data = lung)

surv_fit
#> parsnip model object
#>
#> Call:
#> survival::survreg(formula = Surv(time, status) ~ age + sex +
#>     ph.ecog, data = data, model = TRUE)
#>
#> Coefficients:
#> (Intercept)         age         sex     ph.ecog
#>  6.27243757 -0.00585765  0.39942216 -0.34642110
#>
#> Scale= 0.7273694
#>
#> n=227 (1 observation deleted due to missingness)
```

To get predictions, pick a `type`. Use `"time"` for a single predicted event time per subject.

```r title="Predict event times"
predict(surv_fit, new_data = lung[1:3, ], type = "time")
#> # A tibble: 3 x 1
#>   .pred_time
#>        <dbl>
#> 1       470.
#> 2       402.
#> 3       246.
```

For a survival curve, use `type = "survival"` and pass the times at which to evaluate it through `eval_time`. The result is a list column of small tibbles, one per subject.

```r title="Predict survival probabilities"
predict(
  surv_fit,
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

Switching distributions takes one argument. An exponential model assumes a constant hazard, while a log-normal model allows the hazard to rise and then fall.

```r title="Compare two distributions"
exp_fit <- survival_reg(dist = "exponential") |>
  set_engine("survival") |>
  fit(Surv(time, status) ~ age + sex, data = lung)

logn_fit <- survival_reg(dist = "lognormal") |>
  set_engine("survival") |>
  fit(Surv(time, status) ~ age + sex, data = lung)

c(exponential = logLik(extract_fit_engine(exp_fit)),
  lognormal   = logLik(extract_fit_engine(logn_fit)))
#> exponential   lognormal
#>   -1156.300   -1143.726
```

[TIP]
**Compare distributions by log-likelihood or AIC, not by eye.** Fit several `dist` values on the same data and pick the one with the best fit statistic. The log-normal often beats the exponential because real hazards are rarely constant over time.

## survival_reg() vs other censored models

**The censored package registers several model types.** Choose by the question you are asking, not just the data shape.

| Model | parsnip function | Best for |
|---|---|---|
| Parametric survival | `survival_reg()` | Smooth survival curves, extrapolation |
| Cox proportional hazards | `proportional_hazards()` | Hazard ratios, no distribution assumption |
| Survival decision tree | `decision_tree()` | Non-linear effects, interpretable splits |
| Boosted survival model | `boost_tree()` | Highest predictive accuracy |

Use `survival_reg()` when you trust a distributional assumption and want predicted times or curves that extend beyond the observed follow-up. Switch to `proportional_hazards()` when you care about hazard ratios and prefer not to commit to a distribution. Reach for tree or boosting engines when prediction accuracy matters more than interpretability.

## Common pitfalls

**Forgetting to load the censored package** is the most frequent error. The engine looks registered in the docs but fails at fit time.

```r title="Pitfall: engine not loaded"
# censored package not loaded
survival_reg() |> set_engine("survival") |> fit(Surv(time, status) ~ age, data = lung)
#> Error: The parsnip extension package censored is required.
# Fix: run library(censored) first
```

**Passing a bare numeric outcome** instead of a `Surv()` object silently changes the problem. survival_reg() needs the censoring indicator, so the left side of the formula must be `Surv(time, status)`, never `time` alone.

**Requesting `type = "survival"` without `eval_time`** raises an error. Survival probabilities are only defined at specific times, so you must say which times you want.

## Try it yourself

**Try it:** Fit a Weibull `survival_reg()` model on the `lung` dataset using `age` and `sex` as predictors, then predict the event time for the first two rows. Save the predictions to `ex_pred`.

```r title="Your turn: fit survival_reg"
# Try it: fit a Weibull model and predict
ex_fit <- # your code here
ex_pred <- # your code here

ex_pred
#> Expected: a 2-row tibble with a .pred_time column
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_fit <- survival_reg(dist = "weibull") |>
  set_engine("survival") |>
  fit(Surv(time, status) ~ age + sex, data = lung)

ex_pred <- predict(ex_fit, new_data = lung[1:2, ], type = "time")
ex_pred
#> # A tibble: 2 x 1
#>   .pred_time
#>        <dbl>
#> 1       434.
#> 2       368.
```

**Explanation:** The specification sets the Weibull distribution and survival engine, then `fit()` trains it on a `Surv()` outcome. Asking for `type = "time"` returns one predicted event time per row.

</details>

## Related tidymodels functions

- [proportional_hazards()](parsnip-proportional_hazards-in-R.html) defines a Cox model for hazard ratios.
- [set_engine()](parsnip-set_engine-in-R.html) swaps the backend, such as flexsurv.
- [fit()](parsnip-fit-in-R.html) trains a specification on data.
- [predict()](parsnip-predict-in-R.html) returns times, survival, or hazard.
- [extract_fit_engine()](parsnip-extract_fit_engine-in-R.html) reaches the underlying survreg object.

## FAQ

**What is survival_reg() in R?**
`survival_reg()` is a parsnip function that defines a parametric survival regression model for censored, time-to-event data. It specifies the assumed event-time distribution and the engine, but does not touch data until you call `fit()`. The model handles censored records, where the event has not yet happened, by treating their times as lower bounds rather than missing values.

**What is the difference between survival_reg() and proportional_hazards()?**
`survival_reg()` fits a parametric model that assumes a named distribution, such as Weibull, and can predict absolute event times. `proportional_hazards()` fits a Cox model that makes no distributional assumption and instead estimates hazard ratios between groups. Use survival_reg() when you want predicted times or smooth curves; use proportional_hazards() when relative risk is the goal.

**What distributions does survival_reg() support?**
The survival engine supports weibull, exponential, gaussian, logistic, lognormal, and loglogistic distributions through the `dist` argument. The flexsurv and flexsurvspline engines add further options, including spline-based hazards. Weibull is the default for the survival engine because it flexibly models hazards that rise or fall over time.

**Why do I need the censored package for survival_reg()?**
`survival_reg()` lives in core parsnip, but its engines are registered by the `censored` extension package. Running `library(censored)` connects parsnip to the survival, flexsurv, and flexsurvspline backends. Without that call, parsnip reports the engine is unavailable even though the underlying survival package is installed.

**How do I predict survival probabilities with survival_reg()?**
Call `predict()` with `type = "survival"` and supply an `eval_time` vector of the times at which you want probabilities. The result is a list column of tibbles, each holding the evaluation times and matching survival probabilities for one subject. Use `tidyr::unnest()` to flatten it into a tidy frame for plotting.
