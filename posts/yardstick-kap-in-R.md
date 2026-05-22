---
title: "yardstick kap() in R: Cohen's Kappa for Classification"
slug: yardstick-kap-in-R
description: "Use yardstick kap() in R to score Cohen's Kappa for binary and multiclass classifiers in tidymodels. See syntax, grouped scoring, examples, and pitfalls."
keywords: "yardstick kap, kap function R, yardstick kap examples, Cohen Kappa R, R classification kappa, kap tidymodels, kappa metric R"
mathjax: false
webr: true
date: 2026-05-22
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: kap()|yardstick kap|yardstick::kap()|Cohen's Kappa|kappa metric
auto_link_case_sensitive: true
target_keyword: yardstick kap
sibling_block_enabled: true
difficulty: Beginner
---

# yardstick kap() in R: Cohen's Kappa for Classification

<p class="lead">The yardstick kap() function in R computes Cohen's Kappa between observed and predicted class labels, returning a chance-corrected score in [-1, 1] and acting as the default companion to accuracy() in tidymodels.</p>

[QUICK ANSWER]
kap(df, truth, estimate)                       # basic two-class call
kap(df, truth = obs, estimate = pred)          # named arguments
kap(df, class, .pred_class)                    # default parsnip output
df |> group_by(fold) |> kap(class, .pred_class)   # by resample
kap(df, class, .pred_class, na_rm = TRUE)      # drop missing rows
kap_vec(truth_vec, pred_vec)                   # vector interface
kap(df, class, .pred_class, case_weights = w)  # weighted scoring

[DECISION TREE: Is kap() the right tool?]
- chance-corrected agreement, balanced or skewed: kap(df, truth, estimate)
- balanced classes, equal error costs: accuracy(df, truth, estimate)
- robust score on imbalanced data: mcc(df, truth, estimate)
- precision-recall blend with one knob: f_meas(df, truth, estimate)
- probability scores, not hard classes: roc_auc(df, truth, .pred_class_1)
- ordinal ratings with weighted disagreement: vcd::Kappa(table(truth, est))

## What kap() measures

**kap() reports agreement between predictions and truth after subtracting the agreement expected by chance.** The formula is `(po - pe) / (1 - pe)`, where `po` is the observed share of matching labels and `pe` is the share expected under independence given the marginal class frequencies.

The function takes a data frame with two factor columns and returns a one-row tibble (`.metric`, `.estimator`, `.estimate`). A Kappa of 1 means perfect agreement; 0 means chance; negative values mean worse than guessing the marginals.

Reach for kap when you want one chance-corrected number that works for two classes or many. It is `tune::tune_grid()`'s default classification metric alongside `accuracy()`, so most tidymodels users see it without naming it.

[KEY INSIGHT]
**Kappa penalises easy wins.** Accuracy rewards always-predict-the-majority models on imbalanced data; Kappa cancels that gain by raising the chance baseline `pe`. Two models with the same accuracy can land at very different Kappa values depending on how aligned their predictions are with the class prior.

## kap() syntax and arguments

**The signature mirrors every other yardstick class metric.** The same call shape works whether you score a logistic regression, a random forest, or an xgboost classifier.

```r title="kap generic signature"
kap(data, truth, estimate, na_rm = TRUE, case_weights = NULL, ...)
```

| Argument | Description |
|----------|-------------|
| `data` | A data frame with the truth and estimate columns. |
| `truth` | Unquoted column name of the observed class labels (a factor). |
| `estimate` | Unquoted column name of the predicted class labels (a factor with matching levels). |
| `na_rm` | If `TRUE`, drop rows where either column is missing before scoring. |
| `case_weights` | Optional column of row weights, useful for survey or class-rebalanced data. |
| `...` | Currently unused; reserved for future extensions. |

Both `truth` and `estimate` must be factors with identical levels in the same order. yardstick picks the binary or multiclass formula from the level count, so there is no `estimator` argument to set.

## Examples: Kappa for binary and multiclass

**The examples below score a binary problem first, then a multiclass one.** Start with a deliberately imbalanced two-class data set where one label dominates.

```r title="Build an imbalanced binary prediction tibble"
library(yardstick)
library(dplyr)

set.seed(42)
imb <- tibble(
  obs = factor(sample(c("yes", "no"), 200, replace = TRUE, prob = c(0.10, 0.90)),
               levels = c("yes", "no")),
  pred = factor(sample(c("yes", "no"), 200, replace = TRUE, prob = c(0.05, 0.95)),
                levels = c("yes", "no"))
)
head(imb, 4)
#> # A tibble: 4 x 2
#>   obs   pred
#>   <fct> <fct>
#> 1 no    no
#> 2 no    no
#> 3 no    yes
#> 4 no    no
```

**Example 1 contrasts accuracy with Kappa on the same imbalanced data.** Accuracy looks healthy because the model agrees with the dominant class most of the time. Kappa removes that free agreement.

```r title="Compare accuracy and Kappa on imbalanced data"
accuracy(imb, obs, pred)
#> # A tibble: 1 x 3
#>   .metric  .estimator .estimate
#>   <chr>    <chr>          <dbl>
#> 1 accuracy binary         0.825

kap(imb, obs, pred)
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 kap     binary        0.0309
```

Accuracy is 0.825 but Kappa is barely above zero. The 82 percent figure is inflated by correct rejections of the majority class; Kappa cancels that free agreement and exposes how little the predictor adds.

**Example 2 scores a multiclass setup.** For three or more classes, yardstick computes Kappa from the full K by K confusion matrix.

```r title="Multiclass Kappa"
set.seed(7)
multi <- tibble(
  obs = factor(sample(c("a", "b", "c"), 150, replace = TRUE, prob = c(0.6, 0.3, 0.1)),
               levels = c("a", "b", "c")),
  pred = factor(sample(c("a", "b", "c"), 150, replace = TRUE, prob = c(0.6, 0.3, 0.1)),
                levels = c("a", "b", "c"))
)

kap(multi, truth = obs, estimate = pred)
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 kap     multiclass    -0.0244
```

The `.estimator` column reports `multiclass`. There is no macro vs micro switch; yardstick reduces the K by K matrix to one scalar via the Cohen formula generalised to K classes.

**Example 3 groups scoring by resample fold.** With CV predictions in one tibble, `group_by()` plus kap returns one score per fold.

```r title="Per-fold Kappa"
folded <- imb |>
  mutate(fold = rep(paste0("fold", 1:4), each = 50))

folded |>
  group_by(fold) |>
  kap(truth = obs, estimate = pred)
#> # A tibble: 4 x 4
#>   fold  .metric .estimator .estimate
#>   <chr> <chr>   <chr>          <dbl>
#> 1 fold1 kap     binary        0.000
#> 2 fold2 kap     binary        0.058
#> 3 fold3 kap     binary        0.040
#> 4 fold4 kap     binary        0.027
```

**Example 4 uses the vector interface for ad-hoc checks.** `kap_vec()` takes two factors directly and returns a numeric scalar instead of a tibble.

```r title="Vector interface for quick checks"
kap_vec(imb$obs, imb$pred)
#> [1] 0.0309
```

Use the vector form inside `map()` calls, custom tuning code, or unit tests where a tibble is overhead.

[TIP]
**Build a default classification metric_set with both anchors.** `class_metrics <- metric_set(accuracy, kap)` gives the exact pair `tune::tune_grid()` uses, so `class_metrics(df, truth, estimate)` returns a two-row tibble you can `pivot_wider()` to compare runs.

## kap() compared with related metrics

**Kappa sits in the chance-corrected family with mcc(), but they answer different questions.** The table below summarises when to swap one for another.

| Metric | Best use case | Limitation |
|--------|---------------|-----------|
| `kap()` | Chance-corrected agreement, default with `tune()` | Sensitive to marginal class frequencies |
| `accuracy()` | Balanced classes, equal error costs | Misleading on skewed data |
| `mcc()` | Single robust score on heavily imbalanced data | Harder to explain than Kappa |
| `bal_accuracy()` | Imbalanced classes, equal cost per class | Hides class-specific failure modes |
| `f_meas()` | Precision-recall blend, harmonic mean | Equal precision and recall weighting is a choice |
| `j_index()` | Two-class screening, Youden's J | Binary only |

A practical rule: report Kappa next to accuracy whenever any class drops below 30 percent, and add `mcc()` if marginals are unstable across resamples.

[NOTE]
**yardstick kap() does not support weighted Kappa.** Linear or quadratic weights for ordinal disagreement (often used in medical and survey scoring) require `vcd::Kappa()` or `irr::kappa2()`. The yardstick variant assumes all misclassifications are equally bad.

## Common pitfalls

**Three small mistakes account for most kap() errors.** Each one has a clear fix.

The first is passing character vectors instead of factors. yardstick needs factors to confirm both columns share the same levels in the same order. The fix is one `factor()` call:

```r title="Fix: convert character columns to factors"
bad <- tibble(obs = c("yes", "no", "yes", "no"), pred = c("yes", "yes", "no", "no"))
# kap(bad, obs, pred)  # would error
bad <- bad |>
  mutate(across(c(obs, pred), \(x) factor(x, levels = c("yes", "no"))))
kap(bad, obs, pred)
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 kap     binary             0
```

The second pitfall is reading Kappa on the accuracy scale. Landis and Koch labelled values above 0.61 as substantial and above 0.81 as almost perfect; a Kappa of 0.4 is fair, not failing. Annotate plots with this scale so accuracy-trained stakeholders do not misread it.

The third pitfall is comparing Kappa across data sets with very different class balance. The chance baseline `pe` depends on marginal frequencies, so a Kappa of 0.5 on a balanced split is not the same evidence as 0.5 on a 95/5 split. Always report class proportions alongside.

[WARNING]
**A zero Kappa does not always mean random predictions.** If the model predicts a single class for every row, observed agreement collapses to the marginal frequency, exactly the expected agreement under independence, and Kappa returns zero. Pair kap with `conf_mat()` to tell "random" apart from "single-class collapse".

## Try it yourself

**Try it:** Use the built-in `hpc_cv` data from yardstick, which contains predictions across ten resamples for a multiclass problem. Compute Kappa per resample, then sort the result. Save the per-resample tibble to `ex_kap_by_fold`.

```r title="Your turn: per-resample Kappa"
library(yardstick)
data("hpc_cv")

# Try it: per-resample Kappa
ex_kap_by_fold <- # your code here

ex_kap_by_fold
#> Expected: 10 rows, one per Resample value
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
library(dplyr)
ex_kap_by_fold <- hpc_cv |>
  group_by(Resample) |>
  kap(truth = obs, estimate = pred)

ex_kap_by_fold |>
  arrange(desc(.estimate)) |>
  head(3)
#> # A tibble: 3 x 4
#>   Resample .metric .estimator .estimate
#>   <chr>    <chr>   <chr>          <dbl>
#> 1 Fold06   kap     multiclass     0.508
#> 2 Fold02   kap     multiclass     0.502
#> 3 Fold10   kap     multiclass     0.495
```

**Explanation:** Grouping by Resample before calling kap returns one multiclass Kappa per fold. Sorting by `.estimate` surfaces the strongest fold, which you would then inspect with `conf_mat()` for class-specific patterns.

</details>

## Related yardstick metrics

**kap() is one entry in the yardstick class-metric family.** Reach for these neighbors when Kappa alone is not enough:

- `accuracy()` for the raw agreement baseline you compare against
- `mcc()` for a chi-square based score that holds up under extreme skew
- `bal_accuracy()` for the macro-recall view of the same problem
- `f_meas()` for a precision-recall blend
- `j_index()` for the binary Youden's J
- `roc_auc()` and `pr_auc()` for probability-based ranking metrics

For the full set, see the [yardstick reference index](https://yardstick.tidymodels.org/reference/index.html).

## FAQ

**How is Cohen's Kappa calculated for two classes?**

For binary classification, Kappa reads the confusion matrix to compute observed agreement `po` (rows where prediction matches truth) and expected agreement `pe` (agreement from sampling each column independently by its marginal frequency). The score is `(po - pe) / (1 - pe)`: the numerator measures chance-corrected gain, the denominator scales it to a max of 1.

**When should I prefer kap() over accuracy()?**

Use Kappa whenever any class is rare or the model could clear a high accuracy bar by predicting the majority class. Accuracy can sit at 95 percent while Kappa lands near zero, exposing the imbalance instantly. Tidymodels reports both by default in `tune_grid()` for that reason.

**Does kap() support weighted Kappa?**

No. yardstick treats every misclassification equally, which is fine for nominal labels but loses information for ordinal ratings where misclassifying "high" as "low" is worse than as "medium". For weighted Kappa use `vcd::Kappa()` or `irr::kappa2(..., weight = "squared")` instead.

**Can I compute Kappa from a parsnip workflow?**

Yes. Pipe `augment()` output into kap. With `augment(fit, new_data = test)` the result already contains the truth column and `.pred_class`, so the call becomes `augment(fit, test) |> kap(class, .pred_class)`. Replace `class` with the actual outcome column name in your data.

**What does a negative Kappa mean?**

A negative Kappa means the model agrees with truth less often than chance would predict from the marginals. That is rare and usually signals a flipped factor level, a wrong target column, or a model that memorised the inverse pattern. Inspect `conf_mat()` and recheck factor levels before blaming the predictor.

## Summary

**kap() is the chance-corrected partner to accuracy() and the default classification metric in tidymodels.** Read it next to accuracy whenever class balance could inflate the raw agreement, and reach for `mcc()` when you need a score less sensitive to marginal frequencies. With `group_by()` it scales to any resampling scheme; `metric_set(accuracy, kap)` is the exact pair `tune_grid()` already uses.
