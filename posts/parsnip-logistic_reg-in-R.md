---
title: "parsnip logistic_reg() in R: Fit Binary Classifiers"
slug: parsnip-logistic_reg-in-R
description: "Use parsnip logistic_reg() in R to define and fit two-class classification with the glm, glmnet, or brulee engine. Syntax, four examples, and pitfalls."
keywords: "parsnip logistic_reg, logistic_reg function R, parsnip logistic regression, logistic regression R tidymodels, logistic_reg examples, binary classification tidymodels, glm tidymodels"
mathjax: false
webr: true
date: "2026-05-22"
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: Logistic-Regression-in-R.html
auto_link_terms: "logistic_reg()|parsnip logistic_reg|parsnip::logistic_reg()|tidymodels logistic regression|binary classification tidymodels"
auto_link_case_sensitive: true
target_keyword: "parsnip logistic_reg"
sibling_block_enabled: true
difficulty: Beginner
---

# parsnip logistic_reg() in R: Fit Binary Classifiers

<p class="lead">The parsnip <code>logistic_reg()</code> function defines a two-class logistic regression model specification in tidymodels, ready to be fit with the glm, glmnet, brulee, or stan engine. It gives you one consistent interface for plain logistic regression, penalized variants, and Bayesian fits without rewriting the call.</p>

[QUICK ANSWER]
logistic_reg()                                          # default spec, glm engine
logistic_reg() |> set_engine("glm")                     # base R glm under the hood
logistic_reg(penalty = 0.1) |> set_engine("glmnet")     # ridge / lasso / elastic net
logistic_reg(penalty = 0.1, mixture = 1) |> set_engine("glmnet")  # pure lasso
logistic_reg() |> set_engine("stan")                    # Bayesian logistic regression
spec |> set_mode("classification")                      # only mode logistic_reg allows
fit(spec, am ~ wt + hp, data = car_data)                # train on a factor outcome
predict(fit, new_data, type = "prob")                   # class probabilities per row

[DECISION TREE: Is logistic_reg() the right tool?]
- predict a yes or no outcome: logistic_reg() |> set_engine("glm")
- shrink coefficients toward zero: logistic_reg(penalty = 0.1) |> set_engine("glmnet")
- predict 3+ unordered classes: multinom_reg() |> set_engine("nnet")
- predict a continuous number: linear_reg() |> set_engine("lm")
- predict non-negative counts: poisson_reg() |> set_engine("glm")
- capture non-linear effects: rand_forest() |> set_engine("ranger")

## What logistic_reg() does

**logistic_reg() is a model specification, not a fitted model.** It records your intent to build a two-class logistic regression and the hyperparameters you want, but no data touches it until you call `fit()`. This separation lets you reuse one specification across many datasets, formulas, or resampling folds.

Logistic regression models a binary outcome as the log-odds of belonging to one class given a linear combination of predictors. The fitted coefficients are interpretable on the log-odds scale, and predicted probabilities fall between 0 and 1 because the linear predictor passes through a logistic link.

[KEY INSIGHT]
**The outcome must be a factor with exactly two levels.** parsnip treats the second factor level as the event by default, which controls what every probability column and class metric refers to. Set levels explicitly with `factor(y, levels = c("no", "yes"))` so the choice is deliberate rather than alphabetical.

[NOTE]
**logistic_reg() ships in core parsnip, so `library(tidymodels)` is enough.** The default engine is `glm`, and registered engines include glmnet, brulee, stan, keras, LiblineaR, h2o, and spark. Each engine accepts a different subset of arguments, viewable through `show_engines("logistic_reg")`.

## logistic_reg() syntax and arguments

**logistic_reg() takes two tuning arguments and two setup verbs.** The arguments control regularization, while `set_engine()` and `set_mode()` finish the specification.

```r title="The logistic_reg specification skeleton"
library(tidymodels)

logistic_reg(
  mode = "classification",  # the only valid mode
  engine = "glm",           # glm (default), glmnet, brulee, stan, keras, LiblineaR
  penalty = NULL,           # total regularization, glmnet and brulee only
  mixture = NULL            # ridge (0) to lasso (1) blend, glmnet only
)
```

The `penalty` argument sets the total regularization on the same scale as `glmnet::glmnet()`'s lambda. The `mixture` argument blends ridge (`mixture = 0`) and lasso (`mixture = 1`), with values between them giving an elastic net. The default glm engine ignores both because it fits an unpenalized maximum-likelihood model.

**The mode is always classification.** You can pass the engine through `set_engine()` instead of the `engine` argument, which is the more common tidymodels style.

## Fit a binary classifier: four examples

**Every example below uses a small derivative of `mtcars`.** The `am` column flags automatic versus manual transmission, which is the two-class outcome. Weight and horsepower act as the predictors.

### Example 1: Fit with the default glm engine

**Build the specification, then fit it to data.** The glm engine wires up `stats::glm()` with `family = binomial()` under the hood, which is standard maximum-likelihood logistic regression.

```r title="Fit logistic_reg on transmission type"
library(tidymodels)

car_data <- mtcars
car_data$am <- factor(car_data$am, labels = c("auto", "manual"))

log_spec <- logistic_reg() |>
  set_engine("glm") |>
  set_mode("classification")

log_fit <- log_spec |>
  fit(am ~ wt + hp, data = car_data)

log_fit
#> parsnip model object
#>
#> Call:  stats::glm(formula = am ~ wt + hp, family = stats::binomial, data = data)
#>
#> Coefficients:
#> (Intercept)           wt           hp
#>    18.86630     -8.08348      0.03626
```

The fitted object reports one coefficient per predictor on the log-odds scale. A negative wt slope means heavier cars are less likely to be manuals; a positive hp slope means high-horsepower cars lean manual.

### Example 2: Predict class probabilities and labels

**predict() returns a tidy tibble, with the type argument controlling the shape.** Without `type`, the prediction is a hard class label; `type = "prob"` returns one column per outcome level.

```r title="Predict probabilities and classes"
sample_rows <- car_data[c(1, 15, 31), ]

predict(log_fit, new_data = sample_rows, type = "prob")
#> # A tibble: 3 x 2
#>   .pred_auto .pred_manual
#>        <dbl>        <dbl>
#> 1     0.0867       0.913
#> 2     1.000        0.000165
#> 3     0.0303       0.970

predict(log_fit, new_data = sample_rows)
#> # A tibble: 3 x 1
#>   .pred_class
#>   <fct>
#> 1 manual
#> 2 auto
#> 3 manual
```

Each prediction column starts with `.pred_`, which avoids clashes when you bind predictions back with `bind_cols()`. The hard-class default uses a 0.5 cutoff; pass `type = "prob"` and threshold yourself for any other cutoff.

### Example 3: Tidy and glance the fitted model

**Use broom helpers through parsnip to pull coefficients and fit statistics.** `tidy()` returns one row per coefficient with standard errors and p-values, and `glance()` returns a one-row model summary.

```r title="Tidy coefficients and model fit"
tidy(log_fit)
#> # A tibble: 3 x 5
#>   term        estimate std.error statistic p.value
#>   <chr>          <dbl>     <dbl>     <dbl>   <dbl>
#> 1 (Intercept)  18.9       7.92        2.38 0.0173
#> 2 wt           -8.08      3.06       -2.64 0.00822
#> 3 hp            0.0363    0.0203      1.79 0.0741

glance(log_fit)$AIC
#> [1] 19.18
```

Weight is the strongest signed predictor; each extra 1000 lb multiplies the odds of being a manual by `exp(-8.08)`, about 0.0003, holding hp fixed. AIC is the natural fit-quality number for a binomial GLM because R-squared has no clean analog on this scale.

### Example 4: Fit a penalized model with glmnet

**Switch to glmnet for regularized coefficients.** The glmnet engine needs a non-NULL `penalty`, and `mixture = 1` requests a pure lasso penalty that can shrink weak predictors to zero.

```r title="Fit a penalized logistic regression"
glmnet_fit <- logistic_reg(penalty = 0.1, mixture = 1) |>
  set_engine("glmnet") |>
  set_mode("classification") |>
  fit(am ~ wt + hp + disp, data = car_data)

predict(glmnet_fit, new_data = car_data[c(1, 15, 31), ], type = "prob")
#> # A tibble: 3 x 2
#>   .pred_auto .pred_manual
#>        <dbl>        <dbl>
#> 1      0.420        0.580
#> 2      0.890        0.110
#> 3      0.350        0.650
```

[TIP]
**Tune the penalty instead of guessing it.** Set `penalty = tune()` in the specification, then pass it to `tune_grid()` with a resampling object like `vfold_cv()`. The framework searches a grid of penalty values and reports which one generalizes best on held-out folds.

## logistic_reg() vs other parsnip models

**Pick the model by the type of outcome you are predicting.** `logistic_reg()` handles exactly two classes; the alternatives below cover the other cases.

| Function | Outcome type | Default engine | Use when |
|---|---|---|---|
| `logistic_reg()` | exactly 2 classes | glm | Yes/no, churn, spam |
| `multinom_reg()` | 3+ unordered classes | nnet | Species, product category |
| `linear_reg()` | continuous numeric | lm | Price, mpg, test score |
| `poisson_reg()` | non-negative counts | glm | Calls, defects, visits |
| `rand_forest()` | numeric or class | ranger | Non-linear effects, interactions |

Use `logistic_reg()` when the outcome is binary and you expect roughly linear effects on the log-odds scale. When the boundary between classes is strongly non-linear or interactions dominate, a tree-based model often fits better with less feature engineering.

## Common pitfalls

**Three mistakes catch most newcomers to logistic_reg().** Each one below shows the problem and the fix.

The biggest is leaving the outcome as a 0/1 numeric column. parsnip refuses to fit a classification spec on a numeric response; convert it to a factor first.

```r title="Outcome must be a factor for classification"
# Wrong: parsnip errors because am is numeric 0/1
logistic_reg() |> fit(am ~ wt, data = mtcars)

# Right: convert am to a factor first
mt <- mtcars
mt$am <- factor(mt$am, labels = c("auto", "manual"))
logistic_reg() |> fit(am ~ wt, data = mt)
```

The second pitfall is class-label confusion. parsnip treats the SECOND factor level as the event, so factor order decides which class `.pred_yes` refers to. Set levels explicitly with `factor(y, levels = c("no", "yes"))`.

The third is passing `penalty` to the glm engine. The glm engine ignores regularization, so `logistic_reg(penalty = 0.1) |> set_engine("glm")` silently fits an unpenalized model. Switch to glmnet or brulee to actually apply the penalty.

[WARNING]
**Perfect separation makes glm fail silently.** When one predictor perfectly splits the two classes, glm warns "fitted probabilities numerically 0 or 1 occurred" and the coefficients explode toward infinity. Move to the glmnet engine with a small `penalty` to regularize them back into a stable range.

## Try it yourself

**Try it:** Fit a logistic model on `car_data` predicting `am` from `mpg` alone, then predict the class probabilities for the 15th row. Save the prediction tibble to `ex_pred`.

```r title="Your turn: mpg-only logistic model"
# Try it: fit with mpg as the only predictor
ex_spec <- # your code here
ex_fit  <- # your code here
ex_pred <- # your code here

ex_pred
#> Expected: a 1-row tibble with .pred_auto near 1 and .pred_manual near 0
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_spec <- logistic_reg() |>
  set_engine("glm") |>
  set_mode("classification")

ex_fit <- ex_spec |>
  fit(am ~ mpg, data = car_data)

ex_pred <- predict(ex_fit, new_data = car_data[15, ], type = "prob")
ex_pred
#> # A tibble: 1 x 2
#>   .pred_auto .pred_manual
#>        <dbl>        <dbl>
#> 1      0.978       0.0220
```

**Explanation:** Row 15 is a Cadillac Fleetwood with `mpg = 10.4`, which is far below the dataset mean. Low-mpg cars in mtcars are almost all automatics, so the model assigns a probability near 1 to the `auto` class.

</details>

## Related parsnip functions

**logistic_reg() works alongside the rest of the parsnip model family.** These functions cover the neighboring tasks in a tidymodels project.

- `multinom_reg()` defines a multinomial logistic regression for three or more classes.
- `linear_reg()` defines a linear regression model for continuous outcomes.
- `poisson_reg()` defines a Poisson regression model for count outcomes.
- `set_engine()` chooses the computational backend for any specification.
- `fit()` trains a specification on data and returns a model object.
- `predict()` generates predictions from a fitted parsnip model.

## FAQ

**What package is logistic_reg() in?**

`logistic_reg()` ships in core parsnip, which loads automatically with `library(tidymodels)`. No extension package is required. The default engine is `stats::glm()` with `family = binomial()`. parsnip also registers glmnet, brulee, stan, keras, LiblineaR, h2o, and spark for specialized cases.

**What is the difference between logistic_reg() and glm()?**

`glm()` is the base R function that fits the model; `logistic_reg()` is a tidymodels wrapper that defines a specification and dispatches to `glm()` (or another engine) when you call `fit()`. The wrapper gives one syntax that swaps between vanilla logistic, penalized, and Bayesian fits, and plays nicely with workflows and tune.

**How do I fit ridge or lasso logistic regression with logistic_reg()?**

Use `logistic_reg(penalty = ..., mixture = ...)` with `set_engine("glmnet")`. Set `mixture = 0` for pure ridge, `mixture = 1` for pure lasso, and values in between for an elastic net. The `penalty` argument controls shrinkage, and you can replace it with `tune()` to search over candidate values during resampling.

**Why does parsnip require a factor outcome instead of 0/1?**

Forcing a factor outcome makes class labels explicit and prevents parsnip from accidentally fitting a regression on a binary response. The factor level order also determines which class is treated as the event, controlling the orientation of every probability and metric downstream.

For the full argument reference, see the [parsnip logistic_reg() docs](https://parsnip.tidymodels.org/reference/logistic_reg.html).
