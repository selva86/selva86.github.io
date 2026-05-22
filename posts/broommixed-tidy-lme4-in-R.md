---
title: "broom tidy() for lme4 in R: Tidy Mixed-Effects Models"
slug: "broommixed-tidy-lme4-in-R"
description: "Tidy lme4 lmer and glmer fits with broom.mixed::tidy(). Extract fixed effects, random-effect SDs, group deviations, and confidence intervals in one call."
keywords: "broom tidy lme4, tidy merMod, broom.mixed lme4, tidy lmer, tidy glmer, lme4 coefficients tidy, mixed model tidy R"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "broom-functions"
fr_parent: "Linear-Regression.html"
auto_link_terms: "tidy.merMod|broom.mixed tidy|tidy lmer|tidy glmer|tidy lme4"
auto_link_case_sensitive: true
target_keyword: "broom tidy lme4"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# broom tidy() for lme4 in R: Tidy Mixed-Effects Models

<p class="lead">The <code>broom.mixed::tidy()</code> function turns lme4 mixed-effects model objects into one-row-per-term data frames you can pipe straight into <code>dplyr</code>, <code>ggplot2</code>, or a report. It works on <code>lmer</code>, <code>glmer</code>, and <code>nlmer</code> fits and returns fixed-effect estimates, random-effect standard deviations, and confidence intervals in a single call.</p>

[QUICK ANSWER]
tidy(fit)                                          # fixed-effect estimates
tidy(fit, conf.int = TRUE)                         # add 95% Wald CIs
tidy(fit, conf.int = TRUE, conf.method = "profile") # likelihood profile CIs
tidy(fit, effects = "ran_pars")                    # random-effect SDs/variances
tidy(fit, effects = "ran_vals", conf.int = TRUE)   # group-level deviations
tidy(fit, effects = c("fixed", "ran_pars"))        # both blocks in one tibble
tidy(glmer_fit, exponentiate = TRUE)               # odds ratios for logistic glmer

[DECISION TREE: Is tidy() the right tool?]
- coefficient table with confidence intervals: tidy(fit, conf.int = TRUE)
- one-row model summary (sigma, AIC, BIC, logLik): glance(fit)
- per-observation fitted values or residuals: augment(fit, data = df)
- p-values for lmer fixed effects: load lmerTest, then summary(fit)
- random-effect variance covariance matrix: VarCorr(fit)
- forest plot of fixed effects: ggplot(tidy(fit, conf.int = TRUE), aes(...))

## What tidy() does for lme4 models in one sentence

**`tidy()` reshapes mixed-effects model objects into rectangular data frames.** A fitted `lmer` object is an S4 object of class `lmerMod` (or `glmerMod` for `glmer`) that stores fixed-effect coefficients, random-effect covariance components, the model frame, and optimisation diagnostics. `broom.mixed::tidy()` extracts the parts you usually need for reporting (term, estimate, standard error, statistic, and optional confidence bounds) and returns a tibble with one row per term.

For a hierarchical fit like `lmer(y ~ x + (1 | group))`, `tidy()` can also return random-effect standard deviations or the group-level conditional modes depending on the `effects` argument. This is much faster than digging into `summary(fit)$coefficients` and `VarCorr(fit)` by hand.

## Syntax

**`tidy()` is an S3 generic dispatched on the `merMod` superclass.** The method lives in `broom.mixed`, not in `broom` itself, so make sure to load broom.mixed for lme4 fits even if broom is already attached.

```r title="Load packages and fit a mixed model"
library(lme4)
library(broom.mixed)
library(dplyr)

fit <- lmer(Reaction ~ Days + (Days | Subject), data = sleepstudy)
class(fit)
#> [1] "lmerMod"
#> attr(,"package")
#> [1] "lme4"
```

The most useful arguments are:

- `conf.int`: `TRUE` adds `conf.low` and `conf.high` columns; default `FALSE`
- `conf.level`: nominal coverage of the interval; default `0.95`
- `conf.method`: `"Wald"` (fast, default), `"profile"` (likelihood profile, slower but better for variance components), or `"boot"` (parametric bootstrap)
- `effects`: `"fixed"` (default), `"ran_pars"` (random-effect SDs and correlations), `"ran_vals"` (conditional modes per group), or `"ran_modes"` (synonym)
- `exponentiate`: `TRUE` exponentiates estimates and intervals, useful for logistic or Poisson `glmer` fits
- `ddf`: denominator degrees of freedom method for p-values when `lmerTest` is attached

These cover almost every reporting use case.

[TIP]
**Use `conf.method = "profile"` for variance components.** Wald intervals on a random-effect SD can dip below zero, which is meaningless. The likelihood profile interval respects the natural boundary at 0 and gives a defensible range for `ran_pars` rows.

## Common patterns

### 1. Fixed-effect table with Wald intervals

```r title="Tidy an lmer fit with default Wald CIs"
tidy(fit, effects = "fixed", conf.int = TRUE)
#> # A tibble: 2 x 7
#>   effect term        estimate std.error statistic conf.low conf.high
#>   <chr>  <chr>          <dbl>     <dbl>     <dbl>    <dbl>     <dbl>
#> 1 fixed  (Intercept)   251.       6.82      36.8    238.      265.
#> 2 fixed  Days           10.5      1.55       6.77     7.42     13.5
```

Each row is one fixed-effect term. `estimate` is the REML coefficient, `std.error` is its standard error from the Hessian, and `statistic` is the t-ratio. The `Days` slope of 10.5 ms per day, with a Wald interval well clear of zero, says reaction time grows reliably with sleep deprivation in the `sleepstudy` cohort.

### 2. Random-effect variances and correlations

```r title="Tidy random-effect parameters"
tidy(fit, effects = "ran_pars")
#> # A tibble: 4 x 5
#>   effect   group    term                       estimate std.error
#>   <chr>    <chr>    <chr>                         <dbl>     <dbl>
#> 1 ran_pars Subject  sd__(Intercept)              24.7        NA
#> 2 ran_pars Subject  cor__(Intercept).Days         0.0656     NA
#> 3 ran_pars Subject  sd__Days                      5.92       NA
#> 4 ran_pars Residual sd__Observation              25.6        NA
```

`effects = "ran_pars"` returns one row per variance or correlation component. Here the between-subject SD on the intercept (24.7 ms) is similar in magnitude to the residual SD (25.6 ms), so subjects differ on baseline reaction time about as much as observations differ within a subject. The intercept-slope correlation near zero says subjects with slower baselines do not systematically deteriorate faster.

### 3. Group-level conditional modes with ran_vals

```r title="Per-subject random intercepts and slopes"
ran_vals <- tidy(fit, effects = "ran_vals", conf.int = TRUE)
head(ran_vals, 4)
#> # A tibble: 4 x 8
#>   effect   group   level term         estimate std.error conf.low conf.high
#>   <chr>    <chr>   <chr> <chr>           <dbl>     <dbl>    <dbl>     <dbl>
#> 1 ran_vals Subject 308   (Intercept)     2.26      13.0    -23.2     27.7
#> 2 ran_vals Subject 308   Days            9.20       2.74     3.83    14.6
#> 3 ran_vals Subject 309   (Intercept)   -40.4       13.0    -65.9    -14.9
#> 4 ran_vals Subject 309   Days           -8.62       2.74   -14.0     -3.26
```

Each pair of rows is one subject's deviation from the population intercept and slope. Subject 308 has a slope 9.2 ms/day above the average, Subject 309 has a slope 8.6 ms/day below. The confidence interval is conditional on the estimated variance components, so treat it as descriptive rather than fully calibrated.

### 4. Combining fixed and random effects

```r title="Stack fixed and ran_pars into one tibble"
tidy(fit, effects = c("fixed", "ran_pars"), conf.int = TRUE)
#> # A tibble: 6 x 8
#>   effect   group    term                  estimate std.error statistic conf.low conf.high
#>   <chr>    <chr>    <chr>                    <dbl>     <dbl>     <dbl>    <dbl>     <dbl>
#> 1 fixed    NA       (Intercept)            251.        6.82      36.8    238.      265.
#> 2 fixed    NA       Days                    10.5       1.55       6.77     7.42     13.5
#> 3 ran_pars Subject  sd__(Intercept)         24.7      NA         NA       14.4      37.7
#> 4 ran_pars Subject  cor__(Intercept).Days    0.0656   NA         NA       -0.482     0.685
#> 5 ran_pars Subject  sd__Days                 5.92     NA         NA        3.81      8.75
#> 6 ran_pars Residual sd__Observation         25.6      NA         NA       22.9      28.9
```

Passing a vector to `effects` puts both blocks in one frame, ready for a `gt::gt()` table or a single forest plot grouped by `effect`. The `ran_pars` confidence bounds here are Wald, which `broom.mixed` warns about for variances; switch `conf.method = "profile"` for a publication-grade interval.

### 5. Odds ratios from a logistic glmer

```r title="Tidy a binomial glmer with exponentiate"
cbpp$prop <- cbpp$incidence / cbpp$size
glmer_fit <- glmer(cbind(incidence, size - incidence) ~ period + (1 | herd),
                   data = cbpp, family = binomial())

tidy(glmer_fit, effects = "fixed", conf.int = TRUE, exponentiate = TRUE)
#> # A tibble: 4 x 7
#>   effect term        estimate std.error statistic conf.low conf.high
#>   <chr>  <chr>          <dbl>     <dbl>     <dbl>    <dbl>     <dbl>
#> 1 fixed  (Intercept)    0.235     0.232    -6.25     0.149     0.371
#> 2 fixed  period2        0.371     0.302    -3.28     0.205     0.671
#> 3 fixed  period3        0.323     0.323    -3.50     0.171     0.609
#> 4 fixed  period4        0.197     0.422    -3.85     0.0862    0.451
```

With `exponentiate = TRUE`, `estimate` is the odds ratio for each period relative to baseline. Every period sits below 1 with a confidence interval clear of 1, so the odds of contagious bovine pleuropneumonia drop after the first observation period in every herd.

## tidy() vs summary(fit) and parameters::model_parameters

**Three tools cover the same job from different angles.** Pick by what you do next with the output.

| Tool | Output type | Best for |
|---|---|---|
| `summary(fit)` | printed text with coefficients + VarCorr | Quick console check |
| `broom.mixed::tidy(fit)` | tibble (data frame) | dplyr piping, ggplot, custom tables |
| `parameters::model_parameters(fit)` | data frame with bootstrap CIs and p-values | Reporting with degrees-of-freedom logic baked in |

Use `tidy()` whenever the next step is code: filtering terms, joining several models, drawing a forest plot, or writing to CSV. Use `parameters::model_parameters()` when you need Satterthwaite or Kenward-Roger denominator df without attaching `lmerTest` and re-fitting.

[KEY INSIGHT]
**The tidy data frame is the bridge between lme4 and the tidyverse.** Once `tidy()` returns a tibble, every dplyr verb, every ggplot geom, and every `gt`/`flextable` layout works without custom shims. This is why `broom.mixed` is the recommended reporting interface for `merMod` objects even when you stay frequentist throughout the modelling.

## Common pitfalls

**Pitfall 1: loading broom instead of broom.mixed.** The `tidy.merMod` method lives in broom.mixed. If only broom is attached, `tidy(fit)` may dispatch to a stale fallback that returns just the fixed effects without the `effect` column, or warn about missing methods. Always `library(broom.mixed)` for lme4 fits.

```r title="Missing broom.mixed: incomplete output"
library(broom)
detach("package:broom.mixed", unload = TRUE)
tidy(fit)
#> Warning: Tidiers for objects of class lmerMod are not maintained by the broom team...
```

**Pitfall 2: expecting p-values in the default output.** Base `lme4` deliberately omits p-values for fixed effects because the reference distribution is unclear for unbalanced designs. `tidy()` mirrors this: you get `statistic` (the t-ratio) but no `p.value` column. Attach `lmerTest` before fitting to get Satterthwaite-approximated p-values via `summary(fit)`, or compute them with `parameters::model_parameters(fit)`.

[WARNING]
**Wald confidence intervals on variance components can be misleading.** They are symmetric and can extend below zero for small samples, which is impossible. For any `ran_pars` row you plan to report, use `conf.method = "profile"` or `"boot"`. Profile intervals are slower but respect the boundary at 0.

**Pitfall 3: forgetting `effects = "ran_pars"` for hierarchical fits.** The default `effects = "fixed"` only returns population-level coefficients. For `lmer` and `glmer` fits, variance components and group-level deviations require explicit `effects` arguments. Calling `tidy(fit)` alone silently omits the random-effect SDs that motivated the hierarchical model in the first place.

## Try it yourself

**Try it:** Fit a random-intercept model on `sleepstudy` with `Reaction` as the outcome, `Days` as a fixed effect, and `Subject` as the grouping variable. Use `tidy()` to produce a combined fixed + ran_pars table with 95% profile confidence intervals. Save it to `ex_mixed_table`.

```r title="Your turn: build a mixed-model coefficient table"
# Try it: tidy an lmer fit with profile CIs
ex_fit <- # your code here

ex_mixed_table <- # your code here

ex_mixed_table
#> Expected: 4 rows; one each for (Intercept), Days, sd__(Intercept), sd__Observation
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_fit <- lmer(Reaction ~ Days + (1 | Subject), data = sleepstudy)
ex_mixed_table <- tidy(ex_fit,
                       effects = c("fixed", "ran_pars"),
                       conf.int = TRUE,
                       conf.method = "profile")
ex_mixed_table
#> # A tibble: 4 x 8
#>   effect   group    term            estimate std.error statistic conf.low conf.high
#>   <chr>    <chr>    <chr>              <dbl>     <dbl>     <dbl>    <dbl>     <dbl>
#> 1 fixed    NA       (Intercept)      251.       9.75     25.8     232.      271.
#> 2 fixed    NA       Days              10.5      0.804    13.0       8.89     12.1
#> 3 ran_pars Subject  sd__(Intercept)   37.1     NA        NA        24.7      54.4
#> 4 ran_pars Residual sd__Observation   30.99    NA        NA        28.4      33.9
```

**Explanation:** Passing `effects = c("fixed", "ran_pars")` stacks both blocks; `conf.method = "profile"` swaps the Wald default for a likelihood-profile interval, which is the right choice for variance components.

</details>

## Related broom.mixed functions for lme4

After mastering `tidy()`, look at:

- `glance()`: one-row model summary with `sigma`, `logLik`, `AIC`, `BIC`, `deviance`, and `df.residual`
- `augment()`: per-observation fitted values, residuals, and conditional modes
- `lme4::VarCorr()`: the raw variance-covariance matrix of the random effects
- `parameters::model_parameters()`: similar coefficient table with degrees-of-freedom-aware p-values
- `performance::check_model()`: diagnostic plots for `merMod` fits

For a coefficient forest plot, pipe `tidy(fit, conf.int = TRUE)` into `ggplot2::geom_pointrange()` with `x = estimate, xmin = conf.low, xmax = conf.high, y = term` and add a `geom_vline(xintercept = 0)` reference line.

See the official [broom.mixed reference for lme4 methods](https://cran.r-project.org/package=broom.mixed) for the full argument list and additional `effects` options.

## FAQ

**How do I get p-values from broom tidy on an lme4 model?**

Attach `lmerTest` before fitting, then call `tidy(fit, effects = "fixed")`. lmerTest re-classes the fit so the Satterthwaite degrees-of-freedom and corresponding p-values flow through to the tibble's `p.value` column. For a glmer fit, p-values come from the Wald z-test by default and appear without any extra package.

**What is the difference between effects = "ran_pars" and effects = "ran_vals"?**

`ran_pars` returns one row per random-effect parameter (standard deviations and correlations of the covariance matrix), so the size depends on the random-effect structure, not the data. `ran_vals` returns one row per group per random term (the conditional modes, also called BLUPs), so it grows with the number of groups. Use `ran_pars` to report variance components, `ran_vals` to plot per-group deviations.

**Can broom.mixed tidy return profile confidence intervals?**

Yes. Set `conf.method = "profile"` and `tidy()` calls `confint(fit, method = "profile")` under the hood, returning likelihood profile bounds for both fixed effects and variance components. The call is several times slower than the Wald default but produces intervals that respect the natural boundary at zero for SDs.

**Why does tidy(fit) show different standard errors than summary(fit)?**

They should match exactly for fixed effects under `conf.method = "Wald"`. If the numbers differ, you have probably loaded `lmerTest` after fitting, which can change the `summary()` standard errors when Kenward-Roger adjustments kick in. Refit the model after attaching lmerTest, or call `tidy()` on the lmerTest-classed object to bring the two into agreement.

**Does tidy() work with nlme::lme objects?**

No. `tidy.merMod` only dispatches on lme4's S4 classes. For `nlme::lme` fits, broom.mixed provides a separate `tidy.lme` method that takes similar arguments but lives in the same package. Both share the column conventions (`effect`, `group`, `term`, `estimate`, `std.error`, `conf.low`, `conf.high`) so downstream code can stay model-agnostic.
