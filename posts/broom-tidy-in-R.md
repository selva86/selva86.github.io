---
title: broom tidy() in R: Turn Any Model Into a Data Frame
slug: broom-tidy-in-R
description: "broom tidy() turns a fitted model into a data frame with one row per term and the same column names for every model type. Examples, intervals, pitfalls."
keywords: broom tidy, tidy function R, broom tidy examples, R tidy model output, tidy model coefficients R, broom tidy lm, convert model to data frame R
mathjax: false
webr: true
date: 2026-08-07
post_type: PSEO
category_id: function-deep
subcategory_id: broom-functions
fr_parent: Linear-Regression.html
auto_link_terms: tidy()|broom tidy|broom::tidy()|tidy model output|tidy a model
auto_link_case_sensitive: true
target_keyword: broom tidy
sibling_block_enabled: true
difficulty: Beginner
---

<p class="lead">broom's <code>tidy()</code> takes a fitted model object and returns a data frame with one row per model term and a fixed set of columns: <code>term</code>, <code>estimate</code>, <code>std.error</code>, <code>statistic</code> and <code>p.value</code>. The same call works on a linear model, a t-test or a logistic fit, which is what makes model output something you can filter, join and plot.</p>

[QUICK ANSWER]
tidy(fit)                             # one row per term
tidy(fit, conf.int = TRUE)            # add conf.low and conf.high
tidy(fit, conf.level = 0.99)          # change the interval width
tidy(g, exponentiate = TRUE)          # odds ratios from a glm
tidy(t.test(y ~ grp, data = df))      # works on htest too
glance(fit)                           # one row for the whole model
augment(fit)                          # fitted values onto the data

R models print beautifully and store their results terribly. `summary()` gives you a screenful you can read but not use, and getting the coefficients out means digging into a matrix and remembering which column is which. `tidy()` skips that step.

## What tidy() returns

**One row per term, five columns, names that mean the same thing whatever produced them.** Fit a model, call `tidy()` on it, and a tibble comes back.

```r title="Tidy a linear model"
library(broom)
library(dplyr)

fit <- lm(mpg ~ wt + hp, data = mtcars)
tidy(fit)
#> # A tibble: 3 × 5
#>   term        estimate std.error statistic  p.value
#>   <chr>          <dbl>     <dbl>     <dbl>    <dbl>
#> 1 (Intercept)  37.2      1.60        23.3  2.57e-20
#> 2 wt           -3.88     0.633       -6.13 1.12e- 6
#> 3 hp           -0.0318   0.00903     -3.52 1.45e- 3
```

`term` is the predictor, `estimate` its coefficient, and the remaining three are the standard error, the test statistic and the p-value.

The point is not that this is prettier. It is a real data frame, so everything you already know about data frames applies to it.

```r title="Filter tidy output like data"
tidy(fit) |>
  filter(p.value < 0.05) |>
  select(term, estimate, p.value)
#> # A tibble: 3 × 3
#>   term        estimate  p.value
#>   <chr>          <dbl>    <dbl>
#> 1 (Intercept)  37.2    2.57e-20
#> 2 wt           -3.88   1.12e- 6
#> 3 hp           -0.0318 1.45e- 3
```

## Syntax

**The signature is short, and only one argument catches people out.**

```r-static title="The tidy signature"
tidy(x, conf.int = FALSE, conf.level = 0.95, ...)
```

`x` is the fitted model. `conf.int` adds `conf.low` and `conf.high` columns.

[WARNING]
`conf.int` defaults to `FALSE`. If your plot needs error bars and they are missing, this is almost always why.

```r title="Add confidence intervals"
tidy(fit, conf.int = TRUE)
#> # A tibble: 3 × 7
#>   term        estimate std.error statistic  p.value conf.low conf.high
#>   <chr>          <dbl>     <dbl>     <dbl>    <dbl>    <dbl>     <dbl>
#> 1 (Intercept)  37.2      1.60        23.3  2.57e-20  34.0      40.5   
#> 2 wt           -3.88     0.633       -6.13 1.12e- 6  -5.17     -2.58  
#> 3 hp           -0.0318   0.00903     -3.52 1.45e- 3  -0.0502   -0.0133
```

Other arguments depend on the model class, and `exponentiate = TRUE` is the common one for logistic and Cox models.

## One function, many model types

**`tidy()` is generic, so the call does not change when the model does.** A t-test comes back with columns suited to what a t-test estimates.

```r title="Tidy a t-test"
tidy(t.test(mpg ~ am, data = mtcars))
#> # A tibble: 1 × 10
#>   estimate estimate1 estimate2 statistic p.value parameter conf.low conf.high
#>      <dbl>     <dbl>     <dbl>     <dbl>   <dbl>     <dbl>    <dbl>     <dbl>
#> 1    -7.24      17.1      24.4     -3.77 0.00137      18.3    -11.3     -3.21
#> # ℹ 2 more variables: method <chr>, alternative <chr>
```

A logistic regression takes `exponentiate = TRUE` to report odds ratios rather than log-odds.

```r title="Tidy a logistic regression"
g <- glm(am ~ wt, data = mtcars, family = binomial)
tidy(g, exponentiate = TRUE, conf.int = TRUE)
#> # A tibble: 2 × 7
#>   term           estimate std.error statistic p.value   conf.low conf.high
#>   <chr>             <dbl>     <dbl>     <dbl>   <dbl>      <dbl>     <dbl>
#> 1 (Intercept) 169460.          4.51      2.67 0.00759 184.        1.83e+10
#> 2 wt               0.0179      1.44     -2.80 0.00509   0.000453  1.60e- 1
```

Because every result is a data frame with the same column names, you can stack fits from different models into one table and compare them. That is awkward from `summary()` output and trivial once everything is rectangular.

## tidy() versus summary()

**You can pull coefficients out of `summary()` without broom; the difference is what you get back.**

```r title="Compare the return types"
class(summary(fit)$coefficients)
#> [1] "matrix" "array"

class(tidy(fit))
#> [1] "tbl_df"     "tbl"        "data.frame"
```

| | `summary(fit)$coefficients` | `tidy(fit)` |
|---|---|---|
| Return type | matrix | tibble / data frame |
| Term names | in row names | in a `term` column |
| Statistic column | `t value` or `z value` | always `statistic` |
| Works with dplyr and ggplot2 | needs conversion first | directly |
| Confidence intervals | separate `confint()` call | `conf.int = TRUE` |

A matrix keeps the term names in the row names rather than in a column, so a dplyr verb or a ggplot2 aesthetic cannot reach them without an extra step. The column names also change between model types, `t value` for a linear model and `z value` for a logistic one, whereas `tidy()` calls it `statistic` either way. That is what lets one piece of downstream code handle both.

## Common pitfalls

**Confidence intervals are off by default.** `tidy(fit)` gives five columns and no interval. Pass `conf.int = TRUE` when a plot or table needs them.

**Odds ratios need exponentiating.** `tidy()` on a `glm` with `family = binomial` reports coefficients on the log-odds scale. Readers usually want odds ratios, which is `exponentiate = TRUE`.

**Not every object has a method.** broom covers a long list of model classes, but it is a list, and passing something outside it fails clearly.

```r title="An unsupported object"
tidy(list(a = 1, b = 2))
#> Error: No `tidy()` method recognized for this list.
```

[NOTE]
When you hit that error, check whether the model's own package ships broom methods. Several do, and `broom.mixed` covers mixed models that base broom does not.

## Try it yourself

**Try it:** Fit `lm(mpg ~ wt + hp + disp, data = mtcars)`, tidy it with confidence intervals, and keep only the terms whose interval excludes zero.

```r title="Your turn: keep terms excluding zero"
# Try it: which terms have an interval that excludes zero?
ex_terms <- # your code here

ex_terms
#> Expected: 3 rows
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_terms <- lm(mpg ~ wt + hp + disp, data = mtcars) |>
  tidy(conf.int = TRUE) |>
  filter(conf.low > 0 | conf.high < 0) |>
  select(term, estimate, conf.low, conf.high)

ex_terms
#> # A tibble: 3 × 4
#>   term        estimate conf.low conf.high
#>   <chr>          <dbl>    <dbl>     <dbl>
#> 1 (Intercept)  37.1     32.8     41.4    
#> 2 wt           -3.80    -5.98    -1.62   
#> 3 hp           -0.0312  -0.0546  -0.00773
```

**Explanation:** An interval excludes zero when both bounds sit on the same side of it, which is what `conf.low > 0 | conf.high < 0` tests. `disp` drops out because its interval spans zero once `wt` and `hp` are in the model.

</details>

## Related broom functions

`glance()` returns one row of model-level statistics such as R-squared and AIC. `augment()` adds fitted values and residuals back onto the original data. Between them, `tidy()` covers the terms, `glance()` covers the model, and `augment()` covers the observations.

## FAQ

**What does tidy() do in R?**

`tidy()` converts a fitted model object into a data frame with one row per term. It standardises the column names across model types, so a linear model, a t-test and a logistic fit all come back with `estimate`, `std.error`, `statistic` and `p.value` in columns you can filter, join and plot.

**What is the difference between tidy() and glance()?**

`tidy()` describes the terms, one row each. `glance()` describes the model as a whole in a single row, with fit statistics such as R-squared, AIC and the residual degrees of freedom. Reach for `tidy()` when you care about coefficients and `glance()` when you are comparing whole models against each other.

**How do I get confidence intervals from tidy()?**

Pass `conf.int = TRUE`, which adds `conf.low` and `conf.high` to the output. The default level is 95%, and `conf.level` changes it, so `conf.level = 0.99` widens the interval accordingly.

**Does tidy() work with any model?**

Only with classes that have a `tidy()` method. broom ships methods for most base R and common package models, and companion packages such as broom.mixed cover mixed models. An unsupported object raises an error naming the class it could not handle, which tells you to go looking for a companion package.

**Why is tidy() better than summary() for plotting?**

`summary()` returns a matrix whose term names live in the row names, so ggplot2 cannot map them to an aesthetic without converting first. `tidy()` returns a data frame with `term` as a real column, which plots directly and keeps working when you swap the model underneath.
