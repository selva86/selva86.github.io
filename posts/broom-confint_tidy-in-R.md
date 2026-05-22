---
title: "broom confint_tidy() in R: Tidy Model Confidence Intervals"
slug: "broom-confint_tidy-in-R"
description: "Use broom::confint_tidy() in R to build a tidy tibble of conf.low and conf.high columns for any model whose confint() method works, ready for joining."
keywords: "broom confint_tidy, confint_tidy R, broom confidence intervals, tidy confint R, R model confidence interval tibble, broom conf.int, broom confint_tidy examples"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "broom-functions"
fr_parent: "Linear-Regression.html"
auto_link_terms: "confint_tidy()|broom confint_tidy|broom::confint_tidy()|tidy confidence intervals|model confidence interval tibble"
auto_link_case_sensitive: true
target_keyword: "broom confint_tidy"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# broom confint_tidy() in R: Tidy Model Confidence Intervals

<p class="lead">The <code>broom::confint_tidy()</code> helper calls <code>confint()</code> on a fitted model and returns the result as a two-column tibble with <code>conf.low</code> and <code>conf.high</code>, ready to bind onto a tidy coefficient table. It is the building block that powers the <code>conf.int = TRUE</code> argument of every <code>tidy.lm()</code>, <code>tidy.glm()</code>, and <code>tidy.survreg()</code> method inside broom.</p>

[QUICK ANSWER]
broom:::confint_tidy(fit)                                # default 95% interval
broom:::confint_tidy(fit, conf.level = 0.90)             # widen or tighten
broom:::confint_tidy(fit, func = MASS::confint.glm)      # profile likelihood for glm
tidy(fit, conf.int = TRUE)                               # the public way
tidy(fit, conf.int = TRUE, conf.level = 0.99)            # public + level
as_tibble(confint(fit), rownames = "term")               # exported alternative

[DECISION TREE: Is confint_tidy() the right tool?]
- tibble of conf.low/conf.high for an internal broom method: broom:::confint_tidy(fit)
- public coefficient table with conf.int columns: broom::tidy(fit, conf.int = TRUE)
- raw matrix from base R: stats::confint(fit)
- profile likelihood interval for a glm: MASS::confint.glm(fit)
- bootstrap interval, not Wald: broom::tidy_bootstrap(fit, conf.int = TRUE)
- Bayesian credible interval: broom.mixed::tidy(fit, conf.int = TRUE)
- one-row model summary: broom::glance(fit)

## What confint_tidy() does in one sentence

**confint_tidy() takes a fitted model, calls confint() on it, and returns a tibble whose two columns are conf.low and conf.high.** Base R's `confint()` method returns a numeric matrix whose column names depend on the conf.level you pass: at 95% you get "2.5 %" and "97.5 %", at 90% you get "5 %" and "95 %", and so on. Those percentage headers are unfriendly for downstream binding because they change with every level and contain whitespace.

The helper fixes that by renaming the matrix columns to the broom canonical names `conf.low` and `conf.high`, then wrapping the result in `tibble::as_tibble()`. Because the function only emits the interval columns, broom's tidy methods bind it next to a coefficient tibble produced by `fix_data_frame()` rather than treating it as a standalone output. As of broom 1.0+ the function lives in the internal namespace, so direct user code reaches it via `broom:::confint_tidy()`.

## Syntax

**confint_tidy() has three named arguments and no hidden behavior.** The first is the fitted model, the second sets the confidence level, and the third lets you swap in a non-default interval method.

```r title="Load broom and fit a small linear model"
library(broom)
library(dplyr)
library(tibble)

fit <- lm(mpg ~ wt + cyl, data = mtcars)
class(fit)
#> [1] "lm"
```

The three arguments are:

- `x`: a fitted model object that has a working `confint()` method (required)
- `conf.level`: the confidence level for the interval; defaults to `0.95`
- `func`: the function used to compute the interval; defaults to `stats::confint`. Pass `MASS::confint.glm` or any function with the same signature to switch from Wald to profile likelihood intervals.

The return value is always a tibble with exactly two columns, `conf.low` and `conf.high`, and one row per model coefficient in the same order as the model's coefficient vector.

[NOTE]
**confint_tidy() became internal in broom 1.0.0 (2020).** Before that it was an exported helper used in worked examples. Today the function still ships with broom and is called by dozens of internal `tidy.*` methods, but user code must use the triple-colon operator or call `tidy(fit, conf.int = TRUE)` and let broom run the helper for you.

## Common patterns

### 1. Get conf.low and conf.high for a linear model

```r title="Call confint_tidy on a fitted lm and inspect the columns"
broom:::confint_tidy(fit)
#> # A tibble: 3 x 2
#>   conf.low conf.high
#>      <dbl>     <dbl>
#> 1   36.2       43.2
#> 2   -4.74      -1.63
#> 3   -2.36      -0.659
```

The output has three rows because the model has three coefficients: `(Intercept)`, `wt`, and `cyl`. Row order matches the order returned by `coef(fit)`, so a positional bind against a tibble of estimates is safe as long as you do not reshuffle either side. The column names are the broom canonical pair, which is the whole reason the helper exists rather than relying on raw `confint()` output.

This is the entire job of `confint_tidy()`. It does not include a `term` column because it is meant to be column-bound onto a `fix_data_frame()` result that already carries the term names. Using `confint_tidy()` alone produces a tibble that is hard to interpret in isolation, which is why `tidy(fit, conf.int = TRUE)` is the user-facing API.

### 2. Change the confidence level

```r title="Pass conf.level to widen or tighten the interval"
broom:::confint_tidy(fit, conf.level = 0.90)
#> # A tibble: 3 x 2
#>   conf.low conf.high
#>      <dbl>     <dbl>
#> 1   36.8       42.5
#> 2   -4.49      -1.88
#> 3   -2.21      -0.812

broom:::confint_tidy(fit, conf.level = 0.99)
#> # A tibble: 3 x 2
#>   conf.low conf.high
#>      <dbl>     <dbl>
#> 1   34.9       44.5
#> 2   -5.26      -1.11
#> 3   -2.65      -0.367
```

Lower confidence levels produce narrower intervals, higher levels produce wider ones. The column names stay as `conf.low` and `conf.high` regardless, which is the practical benefit over raw `confint()`: you can vary the level inside a loop or `purrr::map()` without rewriting downstream binding code that would otherwise break when the percentage headers shift.

### 3. Use the public wrapper tidy(conf.int = TRUE)

```r title="Get a full tidy table with conf.int columns attached"
tidy(fit, conf.int = TRUE)
#> # A tibble: 3 x 7
#>   term        estimate std.error statistic  p.value conf.low conf.high
#>   <chr>          <dbl>     <dbl>     <dbl>    <dbl>    <dbl>     <dbl>
#> 1 (Intercept)   39.7      1.71      23.1   3.04e-20    36.2     43.2
#> 2 wt            -3.19     0.757     -4.22  2.22e- 4    -4.74    -1.63
#> 3 cyl           -1.51     0.415     -3.64  1.06e- 3    -2.36    -0.659
```

This is the call most user code wants. Internally, `tidy.lm()` builds the first five columns via `fix_data_frame()`, then calls `confint_tidy()` and binds the two interval columns on the right. The end result is one tibble per model that ggplot2, dplyr, and gt all consume without further reshaping. Reach for the internal helper directly only when you are writing a new `tidy.*` method or debugging an existing one.

### 4. Swap the interval function for profile likelihood

```r title="Use confint.glm for a logistic regression"
gfit <- glm(am ~ wt + hp, data = mtcars, family = binomial)
broom:::confint_tidy(gfit, func = MASS::confint.glm)
#> Waiting for profiling to be done...
#> # A tibble: 3 x 2
#>   conf.low conf.high
#>      <dbl>     <dbl>
#> 1   1.79      31.4
#> 2  -12.4      -1.45
#> 3   0.0226    0.232
```

The `func` argument is a clean extension point. The default `stats::confint` does the right thing for `lm` (Wald intervals from t critical values) and for `glm` (profile likelihood intervals via `MASS`). When you need to force profile likelihood explicitly, pass `MASS::confint.glm`. When you want Wald intervals on a `glm` because profile fitting is slow, pass `stats::confint.default`. Any function with the signature `function(x, level, ...)` works.

## confint_tidy() vs the modern alternatives

**Three rivals cover the same ground; pick by what you actually want back.** The choice is between a public API, a matrix shape, and a different interval method.

| Goal                                  | Use                                | Returns                          |
|---------------------------------------|------------------------------------|----------------------------------|
| Tidy tibble with `term` + intervals   | `tidy(fit, conf.int = TRUE)`       | tibble, public, broom canonical  |
| Just the two interval columns         | `broom:::confint_tidy(fit)`        | tibble, internal, two columns    |
| Base R matrix with level-named cols   | `stats::confint(fit)`              | matrix, public, names vary       |
| Matrix to tibble with `term`          | `as_tibble(confint(fit), rownames = "term")` | tibble, public, two columns plus term |
| Profile likelihood interval for glm   | `MASS::confint.glm(fit)`           | matrix, public, slower           |

```r title="Equivalent one-liners with public APIs"
tidy(fit, conf.int = TRUE) |> dplyr::select(term, conf.low, conf.high)
as_tibble(confint(fit), rownames = "term")
```

For new code, prefer `tidy(fit, conf.int = TRUE)`. It is exported, documented, and produces the term column for free. Use `broom:::confint_tidy()` only when writing a `tidy.*` method or maintaining package code that already calls it. For the rare case where you need just the two columns without the rest of the tidy table, `as_tibble(confint(fit), rownames = "term") |> dplyr::select(-term)` is the public way.

## Common pitfalls

[WARNING]
**Calling `broom::confint_tidy()` without the triple colon fails on broom 1.0+.** The function is no longer exported, so the public form errors with `'confint_tidy' is not an exported object from 'namespace:broom'`. Either use `broom:::confint_tidy()` for direct access, or switch to `tidy(fit, conf.int = TRUE)` which calls the helper internally.

A second trap: `confint_tidy()` returns no `term` column. The output is a two-column tibble, so binding next to a coefficient tibble needs positional alignment. Always check `coef(fit)` and the tibble row order before `dplyr::bind_cols()`; a silently misaligned bind produces intervals that point at the wrong predictor.

The third trap is models without a `confint()` method. Calling the helper on a `kmeans` or `prcomp` fit aborts with `no applicable method for 'confint'`. Check `methods("confint")` for the classes that work: linear models, generalized linear models, and survival models that ship a Wald or profile likelihood method.

## Try it yourself

**Try it:** Fit `lm(mpg ~ hp + wt, data = mtcars)`, call `confint_tidy()` at the 99% level, and bind the result onto a tibble of coefficients so each row carries `term`, `estimate`, `conf.low`, and `conf.high`.

```r title="Your turn: tidy intervals at 99%"
# Try it: bind term + estimate + 99% interval
ex_fit <- lm(mpg ~ hp + wt, data = mtcars)
ex_coef <- # your code here: a tibble with term and estimate
ex_ci   <- # your code here: 99% conf.low/conf.high
ex_out  <- # your code here: bind them column-wise

ex_out
#> Expected: 3 rows with term, estimate, conf.low, conf.high
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_fit  <- lm(mpg ~ hp + wt, data = mtcars)
ex_coef <- tibble::enframe(coef(ex_fit), name = "term", value = "estimate")
ex_ci   <- broom:::confint_tidy(ex_fit, conf.level = 0.99)
ex_out  <- dplyr::bind_cols(ex_coef, ex_ci)
ex_out
#> # A tibble: 3 x 4
#>   term        estimate conf.low conf.high
#>   <chr>          <dbl>    <dbl>     <dbl>
#> 1 (Intercept)  37.2     32.8      41.6
#> 2 hp           -0.0318  -0.0563   -0.00736
#> 3 wt           -3.88    -5.61     -2.15
```

**Explanation:** `enframe()` lifts the named coefficient vector into a tibble. `confint_tidy(conf.level = 0.99)` returns matched-order interval rows. `bind_cols()` joins them positionally because both tibbles share the same row order from `coef(fit)`.

</details>

## Related broom functions

For day-to-day model output, the higher-level wrappers do more in one call:

- [tidy()](broom-tidy-survival-in-R.html): one row per term with `estimate`, `std.error`, `statistic`, `p.value`, and optional `conf.low`, `conf.high`
- `glance()`: one-row model summary with R-squared, AIC, BIC, residual df
- `augment()`: per-observation fitted values, residuals, influence diagnostics
- [fix_data_frame()](broom-fix_data_frame-in-R.html): the sister helper that lifts coefficient rownames into a `term` column
- [tidy_bootstrap()](broom-bootstrap-in-R.html): bootstrap intervals instead of Wald or profile likelihood

## FAQ

**Why was confint_tidy() unexported in broom 1.0?**

Broom 1.0 reorganized the package around three user-facing generics: `tidy()`, `glance()`, and `augment()`. The maintainers moved internal helpers like `confint_tidy()` and `fix_data_frame()` into the private namespace to keep the public API small and the documentation focused. The function still ships with broom and is called by every `tidy.*` method that supports `conf.int = TRUE`; only direct user calls need the `:::` operator.

**How is confint_tidy() different from base R confint()?**

`stats::confint()` returns a numeric matrix whose column names encode the confidence level, like `"2.5 %"` and `"97.5 %"`. Those headers change every time you change `conf.level`. `confint_tidy()` calls `confint()` internally, then renames the columns to the stable pair `conf.low` and `conf.high` and wraps the result in a tibble. Downstream binding code stays the same regardless of the level.

**Does confint_tidy() work for generalized linear models?**

Yes. `glm` objects ship a `confint()` method that uses profile likelihood via `MASS`, so `broom:::confint_tidy(glm_fit)` returns the profile interval as `conf.low` and `conf.high`. Pass `func = stats::confint.default` to force the faster Wald interval, or `func = MASS::confint.glm` to be explicit about profile fitting. Either way the column names are stable.

**Why doesn't confint_tidy() include the term column?**

By design. `confint_tidy()` is a positional helper meant to be column-bound onto a coefficient tibble built by `fix_data_frame()`, which already supplies the term column. Returning only the interval columns lets broom's internal methods compose the final tibble with one `bind_cols()` rather than juggling duplicate term columns. For a complete tibble in one call, use `tidy(fit, conf.int = TRUE)` from the public API.

**Can I use confint_tidy() with a Bayesian model?**

Not directly. `confint_tidy()` requires a frequentist `confint()` method, which Bayesian fits from `rstanarm` or `brms` do not provide. For Bayesian intervals, install [broom.mixed](https://cran.r-project.org/package=broom.mixed) and call `broom.mixed::tidy(fit, conf.int = TRUE)`. That implementation reads posterior samples and reports credible intervals instead.
