---
title: "broom tidy() for rstanarm in R: Tidy Bayesian Fits"
slug: "broom-tidy-rstanarm-in-R"
description: "Tidy rstanarm Bayesian fits with broom.mixed::tidy(). Extract posterior medians, credible intervals, and random-effect SDs from stan_glm and stan_glmer."
keywords: "broom tidy rstanarm, tidy stanreg, broom.mixed rstanarm, tidy stan_glm, tidy stan_glmer, rstanarm coefficients tidy, posterior intervals rstanarm"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "broom-functions"
fr_parent: "Bayesian-Linear-Regression-in-R.html"
auto_link_terms: "tidy.stanreg|broom.mixed tidy|tidy stan_glm|tidy stan_glmer|tidy rstanarm"
auto_link_case_sensitive: true
target_keyword: "broom tidy rstanarm"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# broom tidy() for rstanarm in R: Tidy Bayesian Fits

<p class="lead">The <code>broom.mixed::tidy()</code> function turns rstanarm Bayesian model objects into one-row-per-term data frames you can pipe into <code>dplyr</code>, <code>ggplot2</code>, or a report. It works on <code>stan_glm</code>, <code>stan_glmer</code>, and <code>stan_lmer</code> fits, and returns posterior medians with credible intervals in a single call.</p>

[QUICK ANSWER]
tidy(fit)                                          # fixed-effect posterior medians
tidy(fit, conf.int = TRUE)                         # add 95% credible intervals
tidy(fit, conf.int = TRUE, conf.level = 0.89)      # 89% interval (McElreath default)
tidy(fit, conf.method = "HPDinterval")             # use HPDI instead of quantile
tidy(fit, exponentiate = TRUE)                     # odds ratios for stan_glm logistic
tidy(glmer_fit, effects = "ran_pars")              # random-effect SDs/variances
tidy(glmer_fit, effects = "ran_vals")              # group-level deviations

[DECISION TREE: Is tidy() the right tool?]
- coefficient table with credible intervals: tidy(fit, conf.int = TRUE)
- one-row model summary (n, sigma, R2, looic): glance(fit)
- per-observation fitted values or residuals: augment(fit, newdata = df)
- raw posterior draws for custom summaries: as_draws_df(fit) or as.matrix(fit)
- posterior predictive checks: posterior_predict(fit) then bayesplot::pp_check()
- forest plot of effects: bayesplot::mcmc_intervals(as.matrix(fit))

## What tidy() does for rstanarm models in one sentence

**`tidy()` reshapes Bayesian model objects into rectangular data frames.** A fitted `stan_glm` is an S3 object of class `stanreg` that wraps thousands of posterior draws, prior metadata, the design matrix, and the Stan fit. `broom.mixed::tidy()` extracts the posterior summary you usually need (term, posterior median, MAD as standard error, credible interval bounds) and returns a tibble with one row per term.

For a `stan_glmer` object (a hierarchical model), `tidy()` can also return random-effect standard deviations or individual group-level deviations depending on the `effects` argument. This makes downstream plotting and reporting much easier than digging into the `$stanfit` slot by hand.

## Syntax

**`tidy()` is an S3 generic dispatched on the `stanreg` class.** The method lives in `broom.mixed`, not in `broom` itself, so make sure both packages are loaded.

```r title="Load packages and fit a Bayesian linear model"
library(rstanarm)
library(broom.mixed)
library(dplyr)

fit <- stan_glm(mpg ~ wt + cyl, data = mtcars,
                chains = 2, iter = 1000, refresh = 0, seed = 1)
class(fit)
#> [1] "stanreg" "glm"     "lm"
```

The most useful arguments are:

- `conf.int`: `TRUE` adds `conf.low` and `conf.high` columns from the posterior; default `FALSE`
- `conf.level`: posterior probability covered by the interval; default `0.90` in broom.mixed for stanreg
- `conf.method`: `"quantile"` (equal-tailed CI) or `"HPDinterval"` (highest posterior density)
- `effects`: `"fixed"` (default), `"ran_pars"` (random-effect variances), `"ran_vals"` (group-level deviations), or `"varying"` (synonym for ran_vals)
- `exponentiate`: `TRUE` exponentiates the posterior summary, useful for logistic or Poisson stan_glm fits

These cover almost every reporting use case.

[TIP]
**Combine `conf.int = TRUE` and `conf.method = "HPDinterval"` for the narrowest defensible interval.** The HPDI is the shortest interval containing the requested mass, so for skewed posteriors it reports a tighter, more honest range than the equal-tailed quantile interval.

## Common patterns

### 1. Fixed-effect posterior summary from stan_glm

```r title="Tidy a stan_glm fit with credible intervals"
tidy(fit, conf.int = TRUE, conf.level = 0.90)
#> # A tibble: 3 x 5
#>   term        estimate std.error conf.low conf.high
#>   <chr>          <dbl>     <dbl>    <dbl>     <dbl>
#> 1 (Intercept)   39.7      1.69     36.9     42.4
#> 2 wt            -3.21     0.755    -4.43    -1.97
#> 3 cyl           -1.51     0.418    -2.20    -0.842
```

Each row is a predictor. The `estimate` column is the posterior median, `std.error` is the median absolute deviation (a robust analogue of the standard error), and `conf.low`/`conf.high` bound the 90% credible interval. A negative estimate with an interval entirely below zero means a credibly negative effect on `mpg`.

### 2. Odds ratios from a logistic stan_glm

```r title="Tidy a Bayesian logistic regression"
log_fit <- stan_glm(am ~ wt + hp, data = mtcars,
                    family = binomial(),
                    chains = 2, iter = 1000, refresh = 0, seed = 2)

tidy(log_fit, conf.int = TRUE, exponentiate = TRUE)
#> # A tibble: 3 x 5
#>   term        estimate std.error conf.low conf.high
#>   <chr>          <dbl>     <dbl>    <dbl>     <dbl>
#> 1 (Intercept)  3.78e+5   24.7    8.71e+1  2.62e+11
#> 2 wt           1.30e-2    1.27   3.50e-4  3.71e-1
#> 3 hp           1.04       1.02   1.01     1.09
```

With `exponentiate = TRUE`, `estimate` becomes the posterior median odds ratio. The wide intercept interval is expected on this tiny dataset; what matters is that the `wt` interval sits below 1 (heavier cars are less likely manual) and the `hp` interval sits above 1.

### 3. Random-effect SDs from stan_glmer

```r title="Tidy a hierarchical Bayesian model with ran_pars"
glmer_fit <- stan_glmer(mpg ~ wt + (1 | cyl), data = mtcars,
                        chains = 2, iter = 1000, refresh = 0, seed = 3)

tidy(glmer_fit, effects = "ran_pars")
#> # A tibble: 2 x 4
#>   effect   group    term            estimate
#>   <chr>    <chr>    <chr>              <dbl>
#> 1 ran_pars cyl      sd_(Intercept)      2.41
#> 2 ran_pars Residual sd_Observation      2.59
```

`effects = "ran_pars"` returns one row per variance component. Here the between-cylinder standard deviation (2.41) is similar in magnitude to the residual SD (2.59), so cylinder explains a real share of variation in `mpg` after accounting for weight.

### 4. Group-level deviations with ran_vals

```r title="Per-group random intercepts from stan_glmer"
tidy(glmer_fit, effects = "ran_vals", conf.int = TRUE)
#> # A tibble: 3 x 7
#>   effect   group level term         estimate std.error conf.low conf.high
#>   <chr>    <chr> <chr> <chr>           <dbl>     <dbl>    <dbl>     <dbl>
#> 1 ran_vals cyl   4     (Intercept)    2.41      1.62    -0.247     4.74
#> 2 ran_vals cyl   6     (Intercept)   -0.345     1.45    -2.65      2.04
#> 3 ran_vals cyl   8     (Intercept)   -2.07      1.81    -4.74      0.795
```

Each row is one group's deviation from the global intercept, with its own credible interval. The 4-cylinder group sits about 2.4 mpg above the global mean after adjusting for weight, while the 8-cylinder group sits roughly 2.1 below.

## tidy() vs print(fit) and posterior::summarise_draws

**Three tools cover the same job from different angles.** Pick by what you do next with the output.

| Tool | Output type | Best for |
|---|---|---|
| `print(fit)` | printed text with median + MAD | Quick console check |
| `broom.mixed::tidy(fit)` | tibble (data frame) | dplyr piping, ggplot, custom tables |
| `posterior::summarise_draws(fit)` | tibble with mean, sd, ess, rhat | Convergence diagnostics |

Use `tidy()` whenever the next step is code: filtering terms, joining multiple models, drawing a forest plot, or writing to CSV. Use `summarise_draws()` when you need `rhat` and `ess_bulk` columns to check that chains mixed.

[KEY INSIGHT]
**The tidy data frame is the bridge between Bayesian modelling and tidyverse tooling.** Once `tidy()` returns a tibble, every dplyr verb, every ggplot geom, and every `gt`/`flextable` layout works without any custom shim. This is why broom.mixed is the recommended reporting interface for rstanarm even when you also use bayesplot for diagnostics.

## Common pitfalls

**Pitfall 1: loading broom instead of broom.mixed.** The `tidy.stanreg` method lives in broom.mixed. If you load only broom, `tidy(fit)` falls back to the generic and may error or return an incomplete frame. Always `library(broom.mixed)` for rstanarm fits.

```r title="Missing broom.mixed: confusing fallback"
detach("package:broom.mixed", unload = TRUE)
tidy(fit)
#> Error: no applicable method for 'tidy' applied to an object of class "stanreg"
```

**Pitfall 2: treating the credible interval as a confidence interval.** `tidy(fit, conf.int = TRUE)` returns a Bayesian credible interval, not a frequentist confidence interval. Report it as "90% posterior probability the parameter lies in [low, high]", not "we are 90% confident". The numerical values can be similar for a flat prior, but the interpretation is different.

[WARNING]
**`tidy()` summarises the posterior; it does not show convergence diagnostics.** A perfectly tidy table can hide chains that never mixed. Always check `rhat` and `ess_bulk` with `posterior::summarise_draws()` or `rstanarm::prior_summary()` plus `plot(fit, "trace")` before trusting any estimate.

**Pitfall 3: forgetting `effects = "ran_pars"` for hierarchical fits.** The default `effects = "fixed"` only returns population-level coefficients. For `stan_glmer` fits, variance components and group-level deviations require explicit `effects` arguments. Calling `tidy(glmer_fit)` alone silently omits the random-effect SDs that motivated the hierarchical model in the first place.

## Try it yourself

**Try it:** Fit a Bayesian linear model on `mtcars` with `mpg` as the outcome and `wt`, `hp`, and `cyl` as predictors. Use `tidy()` to produce a posterior summary with 95% credible intervals. Save the result to `ex_post_table`.

```r title="Your turn: build a Bayesian coefficient table"
# Try it: tidy a stan_glm fit with 95% CI
ex_fit <- # your code here

ex_post_table <- # your code here

ex_post_table
#> Expected: 4 rows with estimate, conf.low, conf.high columns
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_fit <- stan_glm(mpg ~ wt + hp + cyl, data = mtcars,
                   chains = 2, iter = 1000, refresh = 0, seed = 4)
ex_post_table <- tidy(ex_fit, conf.int = TRUE, conf.level = 0.95)
ex_post_table
#> # A tibble: 4 x 5
#>   term        estimate std.error conf.low conf.high
#>   <chr>          <dbl>     <dbl>    <dbl>     <dbl>
#> 1 (Intercept) 38.7      1.93     34.9      42.6
#> 2 wt          -3.16     0.870    -4.83     -1.45
#> 3 hp          -0.0182   0.0136   -0.0455    0.00892
#> 4 cyl         -0.937    0.553    -2.03      0.158
```

**Explanation:** Setting `conf.int = TRUE` with `conf.level = 0.95` returns the equal-tailed 95% posterior credible interval for each coefficient. The result is a tibble ready for `ggplot2::geom_pointrange()` or `gt::gt()`.

</details>

## Related broom.mixed functions for rstanarm

After mastering `tidy()`, look at:

- `glance()`: one-row model summary with algorithm, sample size, `pss` (posterior sample size), `sigma`, and approximate `looic`
- `augment()`: per-observation fitted values and residuals from the posterior median
- `posterior::summarise_draws()`: convergence-aware summary with `rhat` and `ess_bulk`
- `bayesplot::mcmc_intervals()`: forest plot from the same draws `tidy()` summarises

For a credible-interval forest plot, pipe `tidy(fit, conf.int = TRUE)` into `ggplot2::geom_pointrange()` with `x = estimate, xmin = conf.low, xmax = conf.high, y = term`. Add a `geom_vline(xintercept = 0)` reference.

See the official [broom.mixed reference for stanreg methods](https://cran.r-project.org/package=broom.mixed) for the full argument list and additional `effects` options.

## FAQ

**How do I get a 95% credible interval from a stan_glm fit?**

Call `tidy(fit, conf.int = TRUE, conf.level = 0.95)`. The default `conf.level` for stanreg objects in broom.mixed is 0.90, so you must set it explicitly if you want the conventional 95% bound. The returned `conf.low` and `conf.high` are quantiles of the posterior draws unless you switch to `conf.method = "HPDinterval"`.

**Does broom tidy work with stan_glmer hierarchical models?**

Yes. By default `tidy(stan_glmer_fit)` returns only fixed effects. Add `effects = "ran_pars"` to get random-effect standard deviations, or `effects = "ran_vals"` to get one row per group-level deviation. You can also pass a vector like `effects = c("fixed", "ran_pars")` to stack both in one tibble.

**What is the difference between tidy(), glance(), and augment() for rstanarm?**

`tidy()` returns one row per model term with posterior summaries. `glance()` returns one row total with model-level metrics like `sigma`, `pss`, and approximate `looic`. `augment()` returns one row per observation with `.fitted` and `.resid` columns based on the posterior median. All three dispatch on the `stanreg` class.

**Can tidy() return individual posterior draws for plotting?**

No. `tidy()` summarises the posterior to one row per term. For raw draws, use `as_draws_df(fit)` from the posterior package or `as.matrix(fit)` from rstanarm. Those give you the full draw-by-parameter matrix needed for density plots, joint posteriors, or custom intervals.

**Why does tidy() show a different intercept than print(fit)?**

Both summaries use the posterior median by default, so they should agree to within Monte Carlo error. If they differ noticeably, the chains have not converged or you have re-run one of them with a different seed. Check `summary(fit)$summary[, "Rhat"]` to confirm Rhat is close to 1 for every parameter.
