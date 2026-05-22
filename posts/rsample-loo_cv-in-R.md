---
title: "rsample loo_cv() in R: Leave-One-Out Cross-Validation"
slug: rsample-loo_cv-in-R
description: "Build leave-one-out cross-validation splits in R with rsample loo_cv(). Covers n-fold structure, analysis()/assessment(), and when to prefer vfold_cv()."
keywords: "rsample loo_cv, loo_cv function R, rsample loo_cv examples, R leave one out cross validation, leave-one-out cross-validation rsample, tidymodels loo_cv, R loo_cv resampling"
mathjax: false
webr: true
date: 2026-05-22
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "loo_cv()|rsample loo_cv|rsample::loo_cv()|leave-one-out cross-validation|LOO cross-validation"
auto_link_case_sensitive: true
target_keyword: "rsample loo_cv"
sibling_block_enabled: true
difficulty: Beginner
---

# rsample loo_cv() in R: Leave-One-Out Cross-Validation

<p class="lead">The rsample loo_cv() function in R builds leave-one-out cross-validation splits, where each fold holds out exactly one observation and trains on the remaining n-1 rows. It returns one split per row, so it is the right tool for small datasets where you need an almost unbiased estimate of model performance.</p>

[QUICK ANSWER]
loo_cv(df)                              # one split per row of df
loo_cv(df) |> nrow()                    # equals nrow(df)
analysis(folds$splits[[1]])             # n-1 training rows for fold 1
assessment(folds$splits[[1]])           # the 1 held-out row for fold 1
fit_resamples(wf, resamples = loo_cv(df))  # tidymodels workflow on LOO
loo_cv(df) |> dim()                     # n folds, 2 columns (splits, id)

[DECISION TREE: Is loo_cv() the right tool?]
- small data (n under 100), unbiased estimate: loo_cv(df)
- larger data, want fewer fits: vfold_cv(df, v = 10)
- variance-reduced k-fold estimate: vfold_cv(df, repeats = 5)
- time series with order constraint: rolling_origin(df)
- bootstrap resampling for standard errors: bootstraps(df, times = 1000)
- one held-out test set only: initial_split(df)

## What loo_cv() does

**loo_cv() generates one resample per observation.** For a data frame with n rows, it returns an rset with n splits. Each split's analysis set holds n-1 rows and its assessment set holds exactly 1 row. This is the limiting case of k-fold cross-validation where k equals n.

Leave-one-out cross-validation is theoretically the lowest-bias estimator of out-of-sample model error because every fit uses almost the full dataset. The trade-off is computational cost: you fit the model n times instead of 5 or 10. For most practical problems with hundreds of rows or more, 10-fold cross-validation gives a similar estimate at a fraction of the cost.

[KEY INSIGHT]
**LOO is k-fold with k equal to n.** Every choice that applies to vfold_cv (stratification, repeats, grouping) does not apply here, because each fold has only one held-out row and no group structure to vary.

## Syntax and arguments

**loo_cv() takes a data frame and returns an rset.** The signature is short because there is no v argument, no repeats argument, no strata argument. The number of folds is fixed at nrow(data).

```r title="Function signature and minimal call"
library(rsample)

# Use a tiny subset of mtcars so the example stays fast
cars_small <- mtcars[1:8, c("mpg", "wt", "hp")]

# loo_cv has only one required argument: the data
loo_cv(cars_small)
#> # Leave-one-out cross-validation
#> # A tibble: 8 x 2
#>   splits        id        
#>   <list>        <chr>     
#> 1 <split [7/1]> Resample1 
#> 2 <split [7/1]> Resample2 
#> ...
```

The output is a tibble with two columns. `splits` is a list-column where each element is an `rsplit` object pointing at indices into the original data. `id` is a character label, useful for joining per-fold metrics back to the resample table.

## loo_cv() examples

**Inspect a single split to see the n-1 / 1 partition.** Use `analysis()` for the training rows and `assessment()` for the held-out row.

```r title="Extract analysis and assessment from one fold"
folds <- loo_cv(cars_small)

# First split's training rows (7 of 8)
analysis(folds$splits[[1]])
#>                mpg    wt  hp
#> Mazda RX4 Wag 21.0 2.875 110
#> Datsun 710    22.8 2.320  93
#> Hornet 4 Drive 21.4 3.215 110
#> ...

# First split's held-out row (1 of 8)
assessment(folds$splits[[1]])
#>           mpg   wt  hp
#> Mazda RX4  21 2.62 110
```

For a model evaluation loop, iterate over the splits, fit the model on the analysis set, then predict the single row in the assessment set.

```r title="Compute LOO prediction error for linear regression"
preds <- sapply(folds$splits, function(s) {
  fit <- lm(mpg ~ wt + hp, data = analysis(s))
  predict(fit, newdata = assessment(s))
})

actual <- cars_small$mpg

# Mean absolute error across all 8 held-out predictions
mean(abs(preds - actual))
#> [1] 1.847
```

With tidymodels, `fit_resamples()` accepts an `rset` directly, so you can plug `loo_cv(df)` in wherever `vfold_cv(df)` would go.

```r title="Plug loo_cv into a tidymodels workflow"
library(parsnip)
library(workflows)
library(tune)

spec <- linear_reg() |> set_engine("lm")

wf <- workflow() |>
  add_model(spec) |>
  add_formula(mpg ~ wt + hp)

res <- fit_resamples(wf, resamples = loo_cv(cars_small))
collect_metrics(res)
#> # A tibble: 2 x 6
#>   .metric .estimator  mean     n std_err .config             
#>   <chr>   <chr>      <dbl> <int>   <dbl> <chr>               
#> 1 rmse    standard    2.13     8   0.521 Preprocessor1_Model1
#> 2 rsq     standard    0.731    8   0.157 Preprocessor1_Model1
```

[NOTE]
**Each fold's assessment set holds one row.** Per-fold metrics like R-squared are unstable on a single point, so tidymodels averages across all n folds. Read the aggregated `mean` column, not the per-fold values.

## loo_cv() vs vfold_cv() and other resampling

**Pick the resampler that matches your data size and bias-variance trade-off.** Most analysts default to 10-fold CV. Leave-one-out becomes attractive only at small n.

| Function | When to use | Folds | Cost |
|---|---|---|---|
| `loo_cv(df)` | n under 100, unbiased estimate needed | n | High (n fits) |
| `vfold_cv(df, v = 10)` | General purpose, 100 to 10,000 rows | 10 | Low |
| `vfold_cv(df, v = 5, repeats = 5)` | Variance-reduced estimate | 25 | Medium |
| `bootstraps(df)` | Standard errors, confidence intervals | 25 by default | Medium |
| `mc_cv(df)` | Tune the train/test ratio per fold | configurable | Low to Medium |

[TIP]
**Stop at vfold_cv unless you can justify LOO.** Empirical evidence from Shao (1993) and later work shows that 10-fold CV often beats LOO on variance, despite LOO's lower bias. Reach for loo_cv when n is small enough that a single held-out row materially changes the fit.

## Common pitfalls

**Three mistakes show up regularly.** Each has a small fix.

1. **Running loo_cv() on a large dataset.** With n = 5,000 rows and a model that takes 1 second to fit, you wait 83 minutes per evaluation. Switch to `vfold_cv(df, v = 10)` unless you have a specific reason to pay the full LOO cost.

2. **Mistaking the rset for a list of data frames.** `loo_cv()` returns a tibble of `rsplit` objects, not actual sub-data. You must call `analysis(split)` or `assessment(split)` to materialize the rows for that fold.

3. **Trying to stratify.** `loo_cv()` has no `strata` argument because each held-out fold is one row, so stratification is meaningless. If you wanted stratified small-sample CV, use `vfold_cv(df, v = nrow(df), strata = y)` to get the same fold count with the stratification machinery.

[WARNING]
**Set the seed before fitting if downstream code uses randomness.** loo_cv itself is deterministic given the input order, but model fits inside the loop (random forests, boosting) are not. Call `set.seed()` before `fit_resamples()` to keep the run reproducible.

## Try it yourself

**Try it:** Run leave-one-out cross-validation on the first 10 rows of mtcars with the formula `mpg ~ wt`, then compute the LOO root-mean-squared error. Save the result to `ex_loo_rmse`.

```r title="Your turn: LOO RMSE on mtcars"
# Try it: LOO RMSE for mpg ~ wt
ex_data <- mtcars[1:10, c("mpg", "wt")]
ex_folds <- # your code here

ex_loo_rmse <- # your code here
ex_loo_rmse
#> Expected: about 2.4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_data <- mtcars[1:10, c("mpg", "wt")]
ex_folds <- loo_cv(ex_data)

ex_preds <- sapply(ex_folds$splits, function(s) {
  fit <- lm(mpg ~ wt, data = analysis(s))
  predict(fit, newdata = assessment(s))
})

ex_loo_rmse <- sqrt(mean((ex_preds - ex_data$mpg)^2))
round(ex_loo_rmse, 2)
#> [1] 2.42
```

**Explanation:** Each fold fits a one-variable linear regression on 9 rows and predicts the 10th. Squaring the held-out residuals and averaging gives the LOO mean squared error; the square root is the RMSE you report.

</details>

## Related rsample functions

**These rsample functions cover related resampling needs.** Reach for them when LOO does not fit.

- `vfold_cv()`: k-fold cross-validation, the default choice for medium datasets
- `initial_split()`: a single train/test split for a held-out test set
- `bootstraps()`: bootstrap resamples for standard errors and confidence intervals
- `mc_cv()`: Monte Carlo cross-validation with a configurable train ratio
- `rolling_origin()`: time-series-aware resampling that respects observation order

Full argument reference at [rsample.tidymodels.org](https://rsample.tidymodels.org/reference/loo_cv.html).

## FAQ

**When should I use loo_cv() instead of vfold_cv()?**

Use loo_cv when your dataset has fewer than about 100 rows and you need the least-biased estimate of out-of-sample error. With 50 rows, 10-fold cross-validation removes 5 rows per fold; for some models that 10 percent loss noticeably changes the fit. Leave-one-out removes one row at a time, so each training fold is almost the full data. The cost is that you fit the model n times instead of 10, which is fine at small n and prohibitive at large n.

**Why does loo_cv() not have a v argument like vfold_cv()?**

The v argument controls the number of folds. Leave-one-out is the special case where v equals the number of rows, so the argument is redundant. If you want a configurable number of folds, call vfold_cv with `v = nrow(df)` for equivalent behavior, or with `v = 10` for the standard choice. Calling `vfold_cv(df, v = nrow(df))` lets you add `strata` if you need stratification at the LOO fold count.

**Is leave-one-out cross-validation the same as jackknife resampling?**

Yes, in the way the splits are built. The jackknife also drops one observation at a time. The naming differs by application: statisticians call it the jackknife when used for bias and variance estimation of a statistic, and leave-one-out cross-validation when used for predictive model evaluation. loo_cv() builds the splits; what you compute on them decides the label.

**Does loo_cv() work with grouped data?**

No, loo_cv has no group argument. For grouped cross-validation, use `group_vfold_cv()` with the column that identifies the grouping. That gives you grouped k-fold; there is no direct grouped-LOO helper in rsample because grouping plus leaving one row out collapses to standard LOO whenever the group size is 1.

**How long will loo_cv() take to run on my dataset?**

Multiply your single-model fit time by the number of rows. A linear regression that takes 0.01 seconds on 200 rows finishes in 2 seconds. A random forest that takes 5 seconds on 1,000 rows takes 83 minutes for the full LOO sweep. Estimate the budget before launching the full run; switch to 10-fold cross-validation if the answer exceeds your patience.
