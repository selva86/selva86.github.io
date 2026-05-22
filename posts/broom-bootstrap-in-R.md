---
title: "broom Bootstrap in R: Tidy Resampled Estimates"
slug: "broom-bootstrap-in-R"
description: "Run bootstrap resampling in R and tidy the output with broom. Get tidy data frames of resampled coefficients ready for confidence intervals and ggplot."
keywords: "broom bootstrap, broom bootstrap R, tidy bootstrap results, broom rsample bootstrap, broom bootstrap confidence interval, tidy resample estimates R, broom map_df bootstrap"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "broom-functions"
fr_parent: "Linear-Regression.html"
auto_link_terms: "broom::bootstrap()|broom bootstrap|tidy bootstrap|tidy resamples|bootstrap resamples"
auto_link_case_sensitive: true
target_keyword: "broom bootstrap"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# broom Bootstrap in R: Tidy Resampled Estimates

<p class="lead">A broom bootstrap workflow combines <code>rsample::bootstraps()</code> (or a manual <code>map_dfr()</code> loop) with <code>broom::tidy()</code> so every resample produces a one-row-per-term tibble. Stack those tibbles and you get bootstrap distributions for every coefficient, ready for confidence intervals, density plots, or report tables.</p>

[QUICK ANSWER]
map_dfr(1:B, ~tidy(lm(y ~ x, data = slice_sample(df, prop = 1, replace = TRUE))))   # manual loop
bootstraps(df, times = 1000)                                                       # rsample resamples
map_dfr(boots$splits, ~tidy(lm(y ~ x, data = analysis(.x))), .id = "id")           # tidy each fit
boot_estimates |> group_by(term) |> summarise(lo = quantile(estimate, 0.025))     # percentile CI
boot_estimates |> ggplot(aes(estimate)) + geom_histogram() + facet_wrap(~term)    # bootstrap density
int_pctl(boot_results, results)                                                    # rsample percentile CI

[DECISION TREE: Is broom the right tool for bootstrap output?]
- per-term tibbles you can stack and summarise: broom::tidy(model_fit)
- one-row model summary per resample (r.squared, sigma): broom::glance(model_fit)
- per-observation predictions per resample: broom::augment(model_fit)
- create the resamples themselves: rsample::bootstraps(df, times = 1000)
- BCa or studentized intervals from boot output: boot::boot.ci(boot_obj)
- bootstrap a non-model statistic (median, ratio): boot::boot(df, stat_fn, R = 1000)
- nested resamples for cross-validated bootstrap: rsample::nested_cv(df)

## What broom does for bootstrap output in one sentence

**broom turns each resampled model fit into a tidy tibble that you can row-bind across resamples.** A bootstrap routine produces hundreds or thousands of model fits, one per resample. Without tidying, every fit is an S3 list with coefficients, standard errors, fit statistics, and residuals buried in nested slots.

`broom::tidy()` rectangularises one fit into a per-term data frame. Loop the tidier across all resamples and `bind_rows()` (or `map_dfr()`) gives you a long table keyed by `term` and resample id. That table is the input to every downstream task: percentile intervals, bias estimates, distribution plots, and side-by-side comparisons.

## Syntax

**The pattern is loop, tidy, stack.** You generate bootstrap resamples, fit a model to each, tidy each fit, and combine the tibbles. The looping primitive can be `purrr::map_dfr()`, `replicate()` plus `do.call(rbind, ...)`, or `rsample::bootstraps()` paired with `map_dfr()`.

```r title="Load packages and inspect mtcars"
library(broom)
library(dplyr)
library(ggplot2)
library(purrr)
library(tidyr)

set.seed(42)
df <- mtcars |> select(mpg, wt, hp)
head(df, 3)
#>                    mpg    wt  hp
#> Mazda RX4         21.0 2.620 110
#> Mazda RX4 Wag     21.0 2.875 110
#> Datsun 710        22.8 2.320  93
```

The three arguments that matter when wiring broom into a bootstrap loop are:

- the resample generator (manual `slice_sample(replace = TRUE)`, `rsample::bootstraps()`, or `modelr::bootstrap()`)
- the model formula (passed once to `lm()`, `glm()`, `nls()`, etc.)
- the tidier (`tidy()` for coefficients, `glance()` for fit stats, `augment()` for predictions)

[TIP]
**Set a seed before the bootstrap loop, not inside it.** A seed inside the loop reuses the same draw every iteration, which collapses the bootstrap distribution to one point. Set `set.seed()` once before `map_dfr()` or `bootstraps()` and you get reproducible yet varied resamples.

## Common patterns

### 1. Manual bootstrap with map_dfr and tidy

```r title="Bootstrap lm coefficients with map dfr"
B <- 500
boot_fits <- map_dfr(1:B, function(i) {
  resample <- slice_sample(df, prop = 1, replace = TRUE)
  fit <- lm(mpg ~ wt + hp, data = resample)
  tidy(fit) |> mutate(boot_id = i)
})
head(boot_fits, 4)
#> # A tibble: 4 x 6
#>   term        estimate std.error statistic  p.value boot_id
#>   <chr>          <dbl>     <dbl>     <dbl>    <dbl>   <int>
#> 1 (Intercept) 38.0       1.78        21.4  1.46e-18       1
#> 2 wt          -3.97      0.870       -4.56 9.16e- 5       1
#> 3 hp          -0.0290    0.0125      -2.32 2.79e- 2       1
#> 4 (Intercept) 36.4       1.96        18.6  9.42e-17       2
```

Each row is one term from one resample. `boot_id` keeps the resamples separate so you can group later. With `B = 500` and three terms (intercept, `wt`, `hp`) the result has 1500 rows.

### 2. Percentile confidence intervals from the bootstrap table

```r title="Percentile CIs by term"
boot_ci <- boot_fits |>
  group_by(term) |>
  summarise(
    mean_est = mean(estimate),
    lo = quantile(estimate, 0.025),
    hi = quantile(estimate, 0.975),
    .groups = "drop"
  )
boot_ci
#> # A tibble: 3 x 4
#>   term        mean_est      lo       hi
#>   <chr>          <dbl>   <dbl>    <dbl>
#> 1 (Intercept) 37.4     32.4    42.5
#> 2 hp          -0.0317  -0.0574 -0.0086
#> 3 wt          -3.85    -5.38   -2.31
```

The 2.5% and 97.5% quantiles of the bootstrap distribution are the percentile 95% confidence interval. Compare these limits with the parametric intervals from `confint(lm(mpg ~ wt + hp, data = df))` to see how much the normal-theory assumption matters for your data.

### 3. Bootstrap with rsample::bootstraps()

```r title="rsample bootstraps then tidy"
library(rsample)

boots <- bootstraps(df, times = 500)
boot_results <- boots |>
  mutate(
    fit = map(splits, ~lm(mpg ~ wt + hp, data = analysis(.x))),
    coefs = map(fit, tidy)
  ) |>
  select(id, coefs) |>
  unnest(coefs)
head(boot_results, 3)
#> # A tibble: 3 x 6
#>   id            term        estimate std.error statistic  p.value
#>   <chr>         <chr>          <dbl>     <dbl>     <dbl>    <dbl>
#> 1 Bootstrap001  (Intercept) 38.1       2.04        18.7  2.13e-16
#> 2 Bootstrap001  wt          -3.79      0.939       -4.04 4.18e- 4
#> 3 Bootstrap001  hp          -0.0345    0.0117      -2.94 6.91e- 3
```

`bootstraps()` returns a tibble of `rsplit` objects. `analysis()` extracts the resampled data frame from each split; `tidy()` runs once per fit. The unnested result is the same long table as the manual version, but `rsample` keeps the split objects available for paired holdout analysis.

### 4. Bootstrap density plot per term

```r title="Density of bootstrap estimates"
ggplot(boot_fits, aes(estimate)) +
  geom_histogram(bins = 30, fill = "steelblue", colour = "white") +
  facet_wrap(~term, scales = "free") +
  labs(title = "Bootstrap distribution of lm coefficients",
       x = "Estimate", y = "Frequency") +
  theme_minimal()
#> (histogram with one panel per term)
```

Faceting by `term` is only possible because `tidy()` puts every coefficient on its own row. Heavy tails or visible skew flag terms whose normal-theory standard errors are misleading.

[KEY INSIGHT]
**Tidying is what makes bootstrap output composable.** Once every fit is a row-major tibble, downstream code stops caring whether the original model was `lm()`, `glm()`, or `nls()`. The same `group_by(term) |> summarise()` pipeline produces intervals for all of them.

## Compare with alternatives

**Four routes generate bootstrap resamples; broom tidies whichever you pick.** The choice between manual, `rsample`, `modelr`, and `boot` is about resample bookkeeping and interval type, not about whether broom plays nicely.

| Approach | Strength | When to use |
|---|---|---|
| `map_dfr()` + `slice_sample()` + `tidy()` | No extra dependency; transparent loop | Quick exploratory bootstrap, teaching |
| `rsample::bootstraps()` + `tidy()` | Holds splits as objects; integrates with tidymodels | Production workflows, paired holdout |
| `modelr::bootstrap()` + `tidy()` | Compact list-column workflow | Modeling chapters in R for Data Science style |
| `boot::boot()` + `boot::boot.ci()` | BCa and studentized intervals out of the box | Inference where percentile intervals are insufficient |

The `boot` package is the rigorous choice when you need BCa or studentized intervals. Everything else (manual, `rsample`, `modelr`) wraps the same resample-then-fit pattern; broom is what makes their output drillable.

## Common pitfalls

**Bootstrap output that ignores the intercept term.** A naive `summarise(mean(estimate))` without `group_by(term)` averages intercepts with slopes and the answer is meaningless. Always group by `term` before summarising; broom guarantees the column exists for every model class it supports.

**Resampling rows of a paired or time-series dataset.** Standard bootstrap assumes exchangeable observations. For time series, use `rsample::sliding_period()` or a block bootstrap; for paired data, resample pairs (not individuals). Otherwise the resamples violate the dependence structure and the intervals shrink.

**Treating bootstrap p-values as gospel.** Bootstrap percentile intervals are valid; bootstrap p-values from `boot_fits$p.value` are per-resample test statistics, not corrected inferential p-values. Compute p-values from the bootstrap distribution of the estimate itself, not from the per-resample fits.

[WARNING]
**Do not use the deprecated `broom::bootstrap()` function.** Older broom releases shipped a `bootstrap()` helper that worked with `dplyr::do()`. It was removed when `do()` was retired. Use `rsample::bootstraps()` or a manual `map_dfr()` loop instead; both are demonstrated above.

## Try it yourself

**Try it:** Bootstrap 200 linear fits of `mpg ~ wt` on `mtcars` and report the 95% percentile confidence interval for the `wt` coefficient. Save the interval to `ex_wt_ci`.

```r title="Your turn: bootstrap wt CI"
set.seed(7)
# Try it: bootstrap the wt slope
ex_wt_ci <- # your code here

ex_wt_ci
#> Expected: a tibble with one row and columns lo, hi (both negative)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(7)
ex_wt_ci <- map_dfr(1:200, ~{
  resample <- slice_sample(mtcars, prop = 1, replace = TRUE)
  tidy(lm(mpg ~ wt, data = resample))
}) |>
  filter(term == "wt") |>
  summarise(lo = quantile(estimate, 0.025),
            hi = quantile(estimate, 0.975))
ex_wt_ci
#> # A tibble: 1 x 2
#>      lo    hi
#>   <dbl> <dbl>
#> 1 -6.78 -4.16
```

**Explanation:** The loop fits `lm(mpg ~ wt)` to 200 row-resamples of mtcars, tidies each fit, filters to the `wt` term, and takes the empirical 2.5% and 97.5% quantiles. Both bounds are negative, matching the well-known negative association between weight and mileage.

</details>

## Related broom functions

- `broom::tidy()` for per-term coefficient tibbles, the workhorse of every bootstrap loop
- `broom::glance()` for one-row model summaries (`r.squared`, `sigma`, `AIC`) per resample
- `broom::augment()` for per-observation predictions when bootstrapping prediction intervals
- `broom.mixed::tidy()` for mixed models inside the resample loop
- `rsample::int_pctl()` for percentile intervals computed directly from an rsample object

## FAQ

**Does broom have a bootstrap function?**

Older broom releases shipped `broom::bootstrap()` for use with `dplyr::do()`, but it was deprecated and removed. Modern workflows replace it with `rsample::bootstraps()` for the resample generation step and reserve broom for tidying the fits. Reaching for `broom::bootstrap()` in current code triggers a "could not find function" error; substitute `rsample::bootstraps()` and the rest of the pipeline is identical.

**How many bootstrap resamples should I use with broom::tidy()?**

For point estimates and 95% percentile intervals, 1,000 resamples is the conventional minimum and 2,000 to 5,000 is safer for tails. Each resample is cheap because broom only tidies the fit once it converges, so the bottleneck is `lm()` or `glm()`, not `tidy()`. For 99% intervals or BCa intervals from the `boot` package, push to 10,000 resamples; the tidier handles the extra rows without code changes.

**Can I bootstrap glm or nls with the same workflow?**

Yes. `broom::tidy()` dispatches on model class, so swap `lm()` for `glm()`, `nls()`, `survival::survreg()`, or `lme4::lmer()` and the surrounding `map_dfr()` plus `summarise()` pipeline is unchanged. For mixed models, load `broom.mixed` first so its `tidy.merMod()` method is registered. The output columns (`term`, `estimate`, `std.error`, `statistic`) are stable across classes, which is the entire point of using broom.

**Why use rsample::bootstraps() instead of manual resampling?**

`bootstraps()` returns split objects that hold both the analysis (resampled) and assessment (out-of-bag) rows. That separation matters for the .632 bootstrap, oob error estimates, and any nested cross-validation. A manual `slice_sample()` loop is shorter but throws away the oob rows. If you only need percentile intervals on coefficients, manual is fine; for predictive performance, use `rsample`.

**How do I compute BCa or studentized confidence intervals?**

Use the `boot` package: `boot::boot(df, function(d, i) coef(lm(y ~ x, data = d[i, ])), R = 2000)` produces a `boot` object, and `boot::boot.ci(out, type = c("bca", "stud"))` returns the BCa and studentized intervals. broom does not implement BCa directly because the correction requires the Jacobian of the influence function. Stack `boot` (for the interval math) with broom (for the per-fit summary) when you need both.

Authoritative reference: the [broom tidiers index](https://broom.tidymodels.org/articles/available-methods.html) and the [rsample bootstrap article](https://rsample.tidymodels.org/articles/Working_with_rsets.html) cover every supported class and split type.
