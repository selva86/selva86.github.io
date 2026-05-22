---
title: "broom tidy() for Survival Models in R: coxph and survfit"
slug: "broom-tidy-survival-in-R"
description: "Tidy survival models in R using broom::tidy(). Get clean data frames of coefficients, hazard ratios, and KM curves from coxph, survfit, and survreg fits."
keywords: "broom tidy survival, tidy coxph R, tidy survfit, broom survival objects, broom tidy survreg, tidy survival models R, broom hazard ratio"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "broom-functions"
fr_parent: "Linear-Regression.html"
auto_link_terms: "broom::tidy()|broom tidy|tidy coxph|tidy survfit|tidy survival models"
auto_link_case_sensitive: true
target_keyword: "broom tidy survival"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# broom tidy() for Survival Models in R: coxph and survfit

<p class="lead">The <code>broom::tidy()</code> function turns survival model objects into one-row-per-term data frames you can pipe into <code>dplyr</code>, <code>ggplot2</code>, or a report. It works on <code>coxph</code>, <code>survfit</code>, and <code>survreg</code>, and can return hazard ratios with confidence intervals in a single call.</p>

[QUICK ANSWER]
tidy(cox_fit)                                   # coefficients, log hazard
tidy(cox_fit, exponentiate = TRUE)              # hazard ratios
tidy(cox_fit, conf.int = TRUE)                  # add 95% CI columns
tidy(cox_fit, exponentiate = TRUE, conf.int = TRUE)  # HR + CI together
tidy(km_fit)                                    # KM curve: time, estimate, CI
tidy(km_fit) |> filter(strata == "sex=Female")  # subset stratified output
tidy(aft_fit)                                   # survreg AFT coefficients

[DECISION TREE: Is tidy() the right tool?]
- coefficients or HR table from a fitted model: tidy(cox_fit, exponentiate = TRUE)
- one-row model summary (concordance, n, AIC): glance(cox_fit)
- per-observation predictions or residuals: augment(cox_fit, newdata = df)
- raw survival probabilities at custom times: summary(survfit_fit, times = c(...))
- plot Kaplan-Meier curves: ggsurvfit::ggsurvfit() or survminer::ggsurvplot()
- export results to Word or HTML: gtsummary::tbl_regression(cox_fit)

## What tidy() does for survival models in one sentence

**`tidy()` reshapes survival objects into rectangular data frames.** A fitted Cox model is an S3 object with deeply nested matrices for coefficients, variance, and call metadata. `broom::tidy()` extracts the parts you usually need (term, estimate, standard error, statistic, p-value) and returns a tibble with one row per term.

For a `survfit` object (a Kaplan-Meier curve), `tidy()` returns one row per event time with the survival estimate, the number at risk, the number of events, and confidence bounds. This makes downstream plotting and reporting much easier than working with the `$surv`, `$time`, and `$n.risk` slots by hand.

## Syntax

**`tidy()` is an S3 generic, so the call is the same regardless of model class.** broom dispatches to the right method (`tidy.coxph`, `tidy.survfit`, `tidy.survreg`) based on the input object.

```r title="Load packages and fit a Cox model"
library(survival)
library(broom)
library(dplyr)

# lung dataset ships with the survival package
data(lung, package = "survival")

cox_fit <- coxph(Surv(time, status) ~ age + sex + ph.ecog, data = lung)
class(cox_fit)
#> [1] "coxph"
```

The most useful arguments are:

- `exponentiate`: `TRUE` returns hazard ratios (exp of the coefficient) for Cox and Weibull AFT models; default `FALSE` gives log scale
- `conf.int`: `TRUE` adds `conf.low` and `conf.high` columns; default `FALSE`
- `conf.level`: confidence level for the interval; default `0.95`

These three cover almost every reporting use case.

[TIP]
**Combine `exponentiate = TRUE` and `conf.int = TRUE` for a publication-ready hazard ratio table.** This single call gives you the columns most journals require: HR, lower CI, upper CI, and p-value. No manual `exp(coef())` or `confint()` step needed.

## Common patterns

### 1. Coefficient table from a Cox model

```r title="Tidy a coxph fit with log coefficients"
tidy(cox_fit)
#> # A tibble: 3 x 5
#>   term    estimate std.error statistic   p.value
#>   <chr>      <dbl>     <dbl>     <dbl>     <dbl>
#> 1 age      0.0170    0.00922    1.84   0.0657
#> 2 sex     -0.513     0.167     -3.06   0.00219
#> 3 ph.ecog  0.464     0.116      3.99   0.0000661
```

Each row corresponds to a predictor. The `estimate` column holds the log hazard ratio. A positive estimate means higher hazard (shorter survival), and a negative estimate means lower hazard.

### 2. Hazard ratios with confidence intervals

```r title="Hazard ratios with 95% CI"
tidy(cox_fit, exponentiate = TRUE, conf.int = TRUE)
#> # A tibble: 3 x 7
#>   term    estimate std.error statistic   p.value conf.low conf.high
#>   <chr>      <dbl>     <dbl>     <dbl>     <dbl>    <dbl>     <dbl>
#> 1 age        1.02    0.00922    1.84   0.0657      0.999      1.04
#> 2 sex        0.599   0.167     -3.06   0.00219     0.431      0.831
#> 3 ph.ecog    1.59    0.116      3.99   0.0000661   1.27       1.99
```

This is the table you put in a Methods / Results section. Each `estimate` is a hazard ratio; values below 1 mean protective, above 1 mean increased risk. Females (`sex = 2`) have about 40% lower hazard than males in `lung`.

### 3. Kaplan-Meier curves with tidy(survfit)

```r title="Tidy a stratified survfit object"
km_fit <- survfit(Surv(time, status) ~ sex, data = lung)
km_tidy <- tidy(km_fit)
head(km_tidy, 4)
#> # A tibble: 4 x 9
#>    time n.risk n.event n.censor estimate std.error conf.high conf.low strata
#>   <dbl>  <int>   <int>    <int>    <dbl>     <dbl>     <dbl>    <dbl> <chr>
#> 1    11    138       3        0    0.978   0.0126     1.00     0.954 sex=1
#> 2    12    135       1        0    0.971   0.0145     0.999    0.943 sex=1
#> 3    13    134       2        0    0.957   0.0179     0.991    0.924 sex=1
#> 4    15    132       1        0    0.949   0.0194     0.986    0.914 sex=1
```

Every row is one event time. The `strata` column appears because we fit `~ sex`. With `strata`, you can pipe straight into `ggplot2`:

```r title="Plot survival curves from tidy output"
library(ggplot2)
ggplot(km_tidy, aes(x = time, y = estimate, color = strata)) +
  geom_step() +
  geom_ribbon(aes(ymin = conf.low, ymax = conf.high, fill = strata),
              alpha = 0.2, linetype = 0) +
  labs(y = "Survival probability", x = "Days")
#> A two-curve step plot with shaded CI ribbons
```

[NOTE]
**For an unstratified KM curve, `tidy()` omits the `strata` column.** `survfit(Surv(time, status) ~ 1, data = lung)` returns a single overall curve, so the tidy output has 8 columns instead of 9.

### 4. AFT models with tidy(survreg)

```r title="Tidy a Weibull AFT model"
aft_fit <- survreg(Surv(time, status) ~ age + sex, data = lung, dist = "weibull")
tidy(aft_fit, conf.int = TRUE)
#> # A tibble: 3 x 7
#>   term        estimate std.error statistic   p.value conf.low conf.high
#>   <chr>          <dbl>     <dbl>     <dbl>     <dbl>    <dbl>     <dbl>
#> 1 (Intercept)   6.89     0.420     16.4    1.30e-60   6.07      7.72
#> 2 age          -0.00733  0.00686   -1.07   2.85e-01  -0.0208    0.00611
#> 3 sex           0.396    0.124      3.20   1.39e-03   0.153     0.638
```

`survreg` uses the accelerated failure time (AFT) parameterization, so coefficients are on the log-time scale. A positive estimate means longer survival.

## tidy() vs base summary() and gtsummary

**Three tools cover the same job from different angles.** Pick by what you do next with the output.

| Tool | Output type | Best for |
|---|---|---|
| `summary(fit)` | printed text + nested list | Quick console check |
| `broom::tidy(fit)` | tibble (data frame) | dplyr piping, ggplot, custom tables |
| `gtsummary::tbl_regression(fit)` | rendered HTML/Word table | Final reports without manual formatting |

Use `tidy()` whenever the next step is code: filtering terms, combining models, drawing a forest plot, writing to CSV. Use `gtsummary` for the final document; under the hood it calls `broom::tidy()` for you.

[KEY INSIGHT]
**The tidy data frame is the bridge between modeling and tidyverse tooling.** Once `tidy()` returns a tibble, every dplyr verb, every ggplot geom, and every `gt`/`flextable` layout works without any custom shim. This is why `broom` is in the tidymodels meta-package even when you only fit one model.

## Common pitfalls

**Pitfall 1: forgetting `exponentiate = TRUE`.** The default is the log scale, which is rarely what you want to report. If your hazard ratio column looks like 0.017 instead of 1.02, you forgot the argument.

```r title="Wrong scale: log hazard reported as if it were a ratio"
tidy(cox_fit) |> select(term, estimate)
#> # A tibble: 3 x 2
#>   term    estimate
#>   <chr>      <dbl>
#> 1 age      0.0170
#> 2 sex     -0.513
#> 3 ph.ecog  0.464
```

**Pitfall 2: `tidy()` on a `Surv` object instead of a fit.** `Surv(time, status)` is a response object, not a model. Pass the output of `coxph()`, `survfit()`, or `survreg()`, not the bare `Surv` call.

[WARNING]
**broom does not provide `tidy.survfit.cox` for adjusted survival curves.** If you call `survfit(cox_fit, newdata = ...)` you get a `survfitcox` object. `tidy()` will fall back to the generic `survfit` method and may drop the adjustment metadata. For Cox-adjusted curves, use `ggsurvfit::tidy_survfit()` instead.

**Pitfall 3: mixing `conf.int` with `level`.** Older broom versions used `conf.level`. Some tutorials still show `level = 0.9`; the current argument name is `conf.level`. Check the version with `packageVersion("broom")` if you see an unused-argument warning.

## Try it yourself

**Try it:** Fit a Cox model on `lung` with `age`, `sex`, and `ph.karno` as predictors. Use `tidy()` to produce a hazard-ratio table with 95% confidence intervals. Save the result to `ex_hr_table`.

```r title="Your turn: build a hazard ratio table"
# Try it: tidy a coxph fit as HR + CI
ex_hr_table <- # your code here

ex_hr_table
#> Expected: 3 rows with estimate (HR), conf.low, conf.high columns
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_fit <- coxph(Surv(time, status) ~ age + sex + ph.karno, data = lung)
ex_hr_table <- tidy(ex_fit, exponentiate = TRUE, conf.int = TRUE)
ex_hr_table
#> # A tibble: 3 x 7
#>   term     estimate std.error statistic  p.value conf.low conf.high
#>   <chr>       <dbl>     <dbl>     <dbl>    <dbl>    <dbl>     <dbl>
#> 1 age          1.02   0.00937     1.94  0.0521     1.000      1.04
#> 2 sex          0.598  0.169      -3.04  0.00233    0.430      0.832
#> 3 ph.karno     0.984  0.00614    -2.65  0.00805    0.972      0.996
```

**Explanation:** Combining `exponentiate = TRUE` with `conf.int = TRUE` returns hazard ratios alongside their 95% interval in a single call. No manual `exp()` or `confint()` step is required.

</details>

## Related broom functions for survival

After mastering `tidy()`, look at:

- `glance()`: one-row model summary with `n`, `nevent`, `concordance`, and `AIC`
- `augment()`: per-observation residuals and predictions (Cox only)
- `tidy_survfit()` in the ggsurvfit package: drop-in replacement that handles Cox-adjusted curves
- `gtsummary::tbl_regression()`: formatted regression table built on top of broom

For a forest plot of hazard ratios, pipe `tidy(cox_fit, exponentiate = TRUE, conf.int = TRUE)` into `ggplot2::geom_pointrange()`. Use a log x-axis so HR = 1 sits in the middle.

See the official [broom documentation for survival methods](https://broom.tidymodels.org/reference/index.html#survival) for the complete argument list per method.

## FAQ

**How do I get hazard ratios from a coxph object?**

Call `tidy(cox_fit, exponentiate = TRUE)`. The `estimate` column then holds hazard ratios instead of log coefficients. Add `conf.int = TRUE` to include 95% confidence bounds in the same call. This replaces the older two-step pattern of `exp(coef(cox_fit))` plus `exp(confint(cox_fit))`.

**Does broom tidy work with survfit objects?**

Yes. `tidy(survfit_object)` returns one row per event time with columns for `time`, `n.risk`, `n.event`, `estimate` (survival probability), `std.error`, `conf.high`, and `conf.low`. If the survfit call was stratified, a `strata` column identifies each group.

**What is the difference between tidy(), glance(), and augment()?**

`tidy()` returns one row per model term. `glance()` returns one row total summarizing the whole model (n, log-likelihood, AIC, concordance). `augment()` returns one row per observation with predictions, residuals, or fitted values. All three are S3 generics that dispatch on model class.

**Can tidy() return median survival from a survfit object?**

Not directly. `tidy(survfit_fit)` gives the full survival curve, but median survival is a summary statistic, not a row in the tidy output. Use `summary(survfit_fit)$table` or `survminer::surv_median()` to extract median survival time per stratum.

**Why does tidy() drop my model name or call?**

By design. `tidy()` returns coefficient-level data, not metadata. Model-level information lives in `glance()`. If you fit many models with `purrr::map()`, combine them with `bind_rows(.id = "model")` after tidying so the model identifier becomes a column.
