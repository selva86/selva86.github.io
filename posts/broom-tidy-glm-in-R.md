---
title: "broom tidy() for glm in R: Logistic and Poisson Output"
slug: "broom-tidy-glm-in-R"
description: "Tidy glm models in R with broom::tidy(). Extract coefficients, odds ratios, IRRs, and confidence intervals from logistic and Poisson fits in a single call."
keywords: "broom tidy glm, tidy glm R, broom glm output, tidy logistic regression coefficients, glm tidy data frame, broom::tidy glm, glm odds ratio R"
mathjax: false
webr: true
date: "2026-05-23"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "broom-functions"
fr_parent: "Linear-Regression.html"
auto_link_terms: "broom::tidy()|broom tidy|tidy glm|tidy glm model|tidy logistic regression"
auto_link_case_sensitive: true
target_keyword: "broom tidy glm"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# broom tidy() for glm in R: Logistic and Poisson Output

<p class="lead">The <code>broom::tidy()</code> function turns a fitted <code>glm</code> object into a one-row-per-term tibble you can pipe into <code>dplyr</code>, <code>ggplot2</code>, or a report. It works on every <code>glm</code> family (binomial, Poisson, Gamma, quasi) and can return odds ratios, incidence rate ratios, and confidence intervals in a single call.</p>

[QUICK ANSWER]
tidy(logit_fit)                                   # log-odds coefficients
tidy(logit_fit, exponentiate = TRUE)              # odds ratios
tidy(logit_fit, conf.int = TRUE)                  # add 95% CI columns
tidy(logit_fit, exponentiate = TRUE, conf.int = TRUE)  # OR plus CI
tidy(poisson_fit, exponentiate = TRUE)            # incidence rate ratios
tidy(logit_fit, conf.level = 0.99)                # custom CI level
tidy(logit_fit) |> arrange(p.value)               # rank terms by p-value

[DECISION TREE: Is tidy() the right tool?]
- coefficient or OR table from a fitted glm: tidy(fit, exponentiate = TRUE)
- one-row model summary (AIC, deviance, df): glance(fit)
- per-observation residuals or fitted values: augment(fit)
- compare nested models with a likelihood test: anova(fit1, fit2, test = "Chisq")
- marginal effects on the response scale: marginaleffects::avg_slopes(fit)
- formatted Word or HTML report: gtsummary::tbl_regression(fit, exponentiate = TRUE)

## What tidy() does for glm in one sentence

**`tidy()` reshapes a `glm` object into a rectangular tibble.** A fitted glm is an S3 list with deeply nested slots for coefficients, the design matrix, the link function, and the IRLS trace. `broom::tidy()` extracts the parts you usually need (term, estimate, standard error, statistic, p.value) and returns one row per predictor.

For a binomial fit, the `estimate` column is on the log-odds scale by default. Set `exponentiate = TRUE` and it flips to odds ratios, with standard errors and p-values left on the link scale (the statistically correct presentation under the delta method). The same flag returns incidence rate ratios for Poisson and quasi-Poisson, and untransformed values for Gaussian and Gamma families.

## Syntax

**`tidy.glm()` is the S3 method that broom dispatches to when you pass a `glm` fit.** You almost never call it directly; just call `tidy()` on the fit and the right method runs.

```r title="Fit a logistic regression on mtcars"
library(broom)
library(dplyr)

# Predict manual transmission (am) from mpg and weight
logit_fit <- glm(am ~ mpg + wt, data = mtcars, family = binomial)
class(logit_fit)
#> [1] "glm" "lm"
```

The three arguments that matter for daily reporting are:

- `exponentiate`: `TRUE` returns odds ratios for binomial fits and incidence rate ratios for Poisson; default `FALSE` returns log-scale coefficients
- `conf.int`: `TRUE` adds `conf.low` and `conf.high` columns derived from a profile likelihood; default `FALSE`
- `conf.level`: confidence level for the interval; default `0.95`

Everything else (`quick`, `expone`, `...` passed to `confint()`) is rarely needed.

[TIP]
**Combine `exponentiate = TRUE` and `conf.int = TRUE` for a publication-ready odds ratio table.** A single call returns OR, lower CI, upper CI, and p-value, which is the format most journals expect. You skip the manual `exp(coef())` plus `exp(confint())` two-step.

## Common patterns

### 1. Coefficient table from a logistic regression

```r title="Tidy a binomial glm with log-odds"
tidy(logit_fit)
#> # A tibble: 3 x 5
#>   term        estimate std.error statistic p.value
#>   <chr>          <dbl>     <dbl>     <dbl>   <dbl>
#> 1 (Intercept)   25.9      12.1       2.14   0.0322
#> 2 mpg            0.307     0.231     1.33   0.184
#> 3 wt            -9.15      4.15     -2.20   0.0276
```

Each row is one predictor. The `estimate` for `wt` is the change in log-odds of `am = 1` for a one-unit (one-thousand-pound) increase in weight, holding `mpg` constant. Negative means heavier cars are less likely to be manual. The `statistic` column is the Wald z-statistic and `p.value` is its two-sided p-value, copied straight from `summary(fit)$coefficients`.

### 2. Odds ratios with confidence intervals

```r title="Odds ratios with 95% CI"
tidy(logit_fit, exponentiate = TRUE, conf.int = TRUE)
#> # A tibble: 3 x 7
#>   term         estimate std.error statistic p.value     conf.low conf.high
#>   <chr>           <dbl>     <dbl>     <dbl>   <dbl>        <dbl>     <dbl>
#> 1 (Intercept) 1.79e+11    12.1       2.14   0.0322   1.55e+01    9.79e+24
#> 2 mpg         1.36e+00     0.231     1.33   0.184    8.81e-01    2.32e+00
#> 3 wt          1.07e-04     4.15     -2.20   0.0276   5.99e-09    1.69e-01
```

This is the table you put in a Methods or Results section. Each `estimate` is an odds ratio: 1.36 for `mpg` means a one-mpg increase multiplies the odds of being a manual transmission by 1.36, controlling for weight. The huge intercept OR is normal in glm output; it represents the baseline odds when all predictors are zero, which is far outside the support of the data and rarely interpretable on its own. Most reporting workflows drop the intercept row before plotting or printing, which is what the forest plot in pattern 4 does.

### 3. Poisson glm with incidence rate ratios

```r title="Tidy a Poisson glm as IRRs"
# Count of carb (carburetors) modeled as a function of hp and cyl
pois_fit <- glm(carb ~ hp + cyl, data = mtcars, family = poisson)

tidy(pois_fit, exponentiate = TRUE, conf.int = TRUE)
#> # A tibble: 3 x 7
#>   term        estimate std.error statistic p.value conf.low conf.high
#>   <chr>          <dbl>     <dbl>     <dbl>   <dbl>    <dbl>     <dbl>
#> 1 (Intercept)    0.586     0.674    -0.793   0.428    0.150     2.16
#> 2 hp             1.005     0.00263   1.95    0.0517   1.000     1.01
#> 3 cyl            1.16      0.0962    1.55    0.122    0.962     1.40
```

For Poisson and quasi-Poisson fits, `exponentiate = TRUE` returns incidence rate ratios. An IRR of 1.005 for `hp` means each additional unit of horsepower multiplies the expected carburetor count by 1.005, or about a 0.5% increase, holding cylinders constant. Counts are a stretch on a 32-row toy dataset, but the mechanics generalize: any Poisson glm, including those with offsets for exposure, tidies into the same seven-column tibble.

### 4. Plot odds ratios as a forest plot

```r title="Forest plot from tidy() output"
library(ggplot2)

or_tbl <- tidy(logit_fit, exponentiate = TRUE, conf.int = TRUE) |>
  filter(term != "(Intercept)")

ggplot(or_tbl, aes(x = estimate, y = term)) +
  geom_pointrange(aes(xmin = conf.low, xmax = conf.high)) +
  geom_vline(xintercept = 1, linetype = "dashed") +
  scale_x_log10() +
  labs(x = "Odds ratio (log scale)", y = NULL)
#> A two-row pointrange plot centered on OR = 1
```

The log-scale x-axis keeps `OR = 1` visually centered between protective and risk-increasing effects, which matches how analysts read forest plots. Dropping the intercept avoids the extreme value squashing the rest of the plot into the left margin.

[NOTE]
**`tidy.glm()` covers every family `glm()` supports.** Gaussian, binomial, Poisson, Gamma, inverse.gaussian, quasi, quasibinomial, quasipoisson all dispatch to the same method. The only thing that changes is what `exponentiate = TRUE` means: odds ratio (binomial), IRR (Poisson and quasi-Poisson), or untransformed (Gaussian).

## tidy() vs base summary() and gtsummary

**Three tools cover the same job from different angles.** Pick by what you do next with the output.

| Tool | Output type | Best for |
|---|---|---|
| `summary(fit)` | printed text plus nested list | Quick console check |
| `broom::tidy(fit)` | tibble (data frame) | dplyr piping, ggplot, custom tables |
| `gtsummary::tbl_regression(fit)` | rendered HTML or Word table | Final reports without manual formatting |

Use `tidy()` whenever the next step is code: filtering significant terms, combining many glm fits with `purrr::map()`, drawing a forest plot, or writing to CSV. Use `gtsummary` for the final document; it calls `broom::tidy()` under the hood and adds publication formatting. The `summary()` printout is still the fastest way to eyeball a single fit interactively, but it is a dead end for anything programmatic.

[KEY INSIGHT]
**The tidy data frame is the bridge between modeling and tidyverse tooling.** Once `tidy()` returns a tibble, every dplyr verb, every ggplot geom, and every `gt` or `flextable` layout works without a custom shim. This is why `broom` ships inside the tidymodels meta-package even if you only fit a single glm.

## Common pitfalls

**Pitfall 1: forgetting `exponentiate = TRUE`.** The default is the link scale (log-odds for binomial, log-rate for Poisson), which is rarely what you report. If your "odds ratio" column has negative numbers, you forgot the argument.

```r title="Wrong scale: log-odds reported as if it were an OR"
tidy(logit_fit) |> select(term, estimate)
#> # A tibble: 3 x 2
#>   term        estimate
#>   <chr>          <dbl>
#> 1 (Intercept)   25.9
#> 2 mpg            0.307
#> 3 wt            -9.15
```

**Pitfall 2: tidying a `glm` fit on the response scale by hand.** Manually calling `exp(tidy(fit)$estimate)` works for the point estimate but is brittle: the standard error of an exponentiated coefficient is not simply `exp(SE)`. Let `exponentiate = TRUE` do the bookkeeping: it returns OR for the estimate and CI but keeps SE, statistic, and p-value on the link scale where they were computed.

[WARNING]
**Profile-likelihood CIs from `tidy(fit, conf.int = TRUE)` can fail to converge on sparse data.** broom calls `MASS::confint.glm()` internally, which uses profiling. With separation or very few events per predictor, you may see a `glm.fit: fitted probabilities numerically 0 or 1 occurred` warning and `NA` CI bounds. Switch to Wald intervals (`confint.default()`) or refit with `brglm2::brglm()` to handle separation.

**Pitfall 3: passing `level = 0.9` instead of `conf.level = 0.9`.** The current argument name is `conf.level`. Older broom accepted `level`; tutorials predating broom 0.7 still show it. Check `packageVersion("broom")` if you see `unused argument`.

## Try it yourself

**Try it:** Fit a logistic regression on `mtcars` predicting `am` from `hp` and `qsec`. Use `tidy()` to produce an odds-ratio table with 95% confidence intervals. Save the result to `ex_or_table`.

```r title="Your turn: build an odds ratio table"
# Try it: tidy a binomial glm as OR plus CI
ex_or_table <- # your code here

ex_or_table
#> Expected: 3 rows with estimate (OR), conf.low, conf.high columns
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_fit <- glm(am ~ hp + qsec, data = mtcars, family = binomial)
ex_or_table <- tidy(ex_fit, exponentiate = TRUE, conf.int = TRUE)
ex_or_table
#> # A tibble: 3 x 7
#>   term        estimate std.error statistic p.value conf.low conf.high
#>   <chr>          <dbl>     <dbl>     <dbl>   <dbl>    <dbl>     <dbl>
#> 1 (Intercept) 4.83e+05   8.45      1.55   0.121   0.0173    1.40e+13
#> 2 hp          1.02       0.0118    1.49   0.137   0.997     1.05
#> 3 qsec        0.484      0.464    -1.56   0.118   0.180     1.18
```

**Explanation:** Combining `exponentiate = TRUE` with `conf.int = TRUE` returns odds ratios and their 95% interval in a single call. No manual `exp()` or `confint()` step is required, and the standard errors stay on the link scale where they belong.

</details>

## Related broom functions for glm

After mastering `tidy()`, the next two broom verbs round out the workflow:

- `glance(fit)`: one-row model summary with `null.deviance`, `df.null`, `logLik`, `AIC`, `BIC`, `deviance`, and `nobs`
- `augment(fit)`: per-observation tibble with `.fitted`, `.resid`, `.std.resid`, `.hat`, and `.cooksd`
- `gtsummary::tbl_regression(fit, exponentiate = TRUE)`: formatted regression table built on top of broom

To combine multiple glm fits from `purrr::map()`, use `map_dfr(fits, tidy, .id = "model")`. The `.id` column lets you facet a forest plot by model.

See the official [broom documentation for glm methods](https://broom.tidymodels.org/reference/tidy.glm.html) for the full argument list.

## FAQ

**How do I get odds ratios from a glm in R?**

Call `tidy(glm_fit, exponentiate = TRUE)` on a binomial fit. The `estimate` column will hold odds ratios instead of log-odds coefficients. Add `conf.int = TRUE` to include 95% confidence bounds in the same call. This single line replaces the older two-step pattern of `exp(coef(fit))` plus `exp(confint(fit))`, and it keeps the term, standard error, and p-value aligned with the OR in one tibble.

**Does broom tidy work with quasibinomial and quasipoisson fits?**

Yes. `tidy.glm()` handles every family `glm()` accepts, including `quasibinomial`, `quasipoisson`, `Gamma`, and `inverse.gaussian`. The `exponentiate = TRUE` argument follows the same convention as the parent family: odds ratios for quasibinomial, IRRs for quasipoisson, and untransformed values for Gamma and Gaussian.

**What is the difference between tidy(), glance(), and augment() for a glm?**

`tidy()` returns one row per coefficient (term-level). `glance()` returns one row summarizing the whole fit (AIC, deviance, null deviance, degrees of freedom). `augment()` returns one row per observation in the training data, with fitted values, residuals, hat values, and Cook's distance. The three together replace nearly every base R `summary()`, `coef()`, `fitted()`, and `residuals()` call.

**Why are my confidence intervals different from `confint.default()`?**

By default, `tidy(fit, conf.int = TRUE)` calls `MASS::confint.glm()`, which produces profile-likelihood intervals. These are usually narrower and more accurate than Wald (`confint.default()`) intervals on small samples. If you need Wald intervals for speed or reproducibility, pass `conf.int = TRUE` together with `conf.method = "Wald"` (broom 1.0 and later).

**Can tidy() handle a glm with an offset or weights?**

Yes. broom reads the offset and weights from the fit object, so the standard errors and p-values in the tidy output reflect them. The estimates are interpreted exactly as in the underlying glm: an offset shifts the linear predictor, and weights rescale each observation's contribution to the deviance.
