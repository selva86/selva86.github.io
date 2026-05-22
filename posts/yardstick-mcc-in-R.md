---
title: "yardstick mcc() in R: Matthews Correlation Coefficient"
slug: yardstick-mcc-in-R
description: "Use yardstick mcc() in R to compute Matthews correlation coefficient for binary and multiclass models. See syntax, grouped scoring, examples, and pitfalls."
keywords: "yardstick mcc, mcc function R, yardstick mcc examples, Matthews correlation coefficient R, MCC classification metric R, mcc yardstick, binary classifier MCC R"
mathjax: false
webr: true
date: 2026-05-22
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: mcc()|yardstick mcc|yardstick::mcc()|Matthews correlation coefficient|MCC metric
auto_link_case_sensitive: true
target_keyword: yardstick mcc
sibling_block_enabled: true
difficulty: Beginner
---

# yardstick mcc() in R: Matthews Correlation Coefficient

<p class="lead">The yardstick mcc() function in R computes the Matthews correlation coefficient between observed and predicted class labels, returning a single number between -1 and 1 that stays meaningful even when the classes are heavily imbalanced.</p>

[QUICK ANSWER]
mcc(df, truth, estimate)                       # basic two-class call
mcc(df, truth = obs, estimate = pred)          # named arguments
mcc(df, class, .pred_class)                    # default parsnip output
df |> group_by(fold) |> mcc(class, .pred_class)   # by resample
mcc(df, class, .pred_class, na_rm = TRUE)      # drop missing rows
mcc_vec(truth_vec, pred_vec)                   # vector interface
mcc(df, class, .pred_class, case_weights = w)  # weighted scoring

[DECISION TREE: Is mcc() the right tool?]
- single robust score on imbalanced data: mcc(df, truth, estimate)
- balanced classes, want a transparent number: accuracy(df, truth, estimate)
- precision-recall blend with one knob: f_meas(df, truth, estimate)
- need per-class diagnostics, not an average: precision(df, truth, estimate)
- probability scores, not hard classes: roc_auc(df, truth, .pred_class_1)
- regression model, not classification: rmse(df, truth, estimate)

## What mcc() measures

**mcc() is a correlation coefficient between predicted and observed classes.** For two classes it equals the phi coefficient, computed from all four cells of the confusion matrix. The score is 1 for perfect agreement, 0 for chance, and -1 for perfectly inverted predictions.

The function takes a data frame with two factor columns and returns a one-row tibble with `.metric`, `.estimator`, and `.estimate`. Because every confusion-matrix cell enters the formula, the score collapses whenever the model leans on one class at the expense of another.

Reach for MCC when you want a single headline number that resists class imbalance. It is the default in bioinformatics and fraud-detection benchmarks for that reason.

[KEY INSIGHT]
**MCC is the chi-square statistic in disguise.** For a two-by-two confusion table the squared MCC equals chi-square divided by the sample size. That equivalence is why values near zero really do mean independence between truth and prediction.

## mcc() syntax and arguments

**The signature mirrors every other yardstick class metric.** The same call shape works whether you score a logistic regression, a random forest, or a neural net.

```r title="mcc generic signature"
mcc(data, truth, estimate, na_rm = TRUE, case_weights = NULL, ...)
```

| Argument | Description |
|----------|-------------|
| `data` | A data frame with the truth and estimate columns. |
| `truth` | Unquoted column name of the observed class labels (a factor). |
| `estimate` | Unquoted column name of the predicted class labels (a factor with matching levels). |
| `na_rm` | If `TRUE`, drop rows where either column is missing before scoring. |
| `case_weights` | Optional column of row weights, useful for survey or class-rebalanced data. |
| `...` | Currently unused; reserved for future extensions. |

Both `truth` and `estimate` must be factors with identical levels in the same order. There is no `estimator` argument here, because yardstick chooses the binary or multiclass formula automatically from the number of factor levels.

## Examples: MCC for binary and multiclass

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

**Example 1 contrasts accuracy with MCC on the same imbalanced data.** Accuracy looks healthy because the model agrees with the dominant class most of the time. MCC tells the real story.

```r title="Compare accuracy and MCC on imbalanced data"
accuracy(imb, obs, pred)
#> # A tibble: 1 x 3
#>   .metric  .estimator .estimate
#>   <chr>    <chr>          <dbl>
#> 1 accuracy binary         0.825

mcc(imb, obs, pred)
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 mcc     binary        0.0322
```

Accuracy is 0.825 but MCC sits barely above zero. The 82 percent figure is inflated by correct rejections of the majority class; MCC sees that the model adds almost nothing on top of always predicting "no".

**Example 2 scores a multiclass setup.** For three or more classes, yardstick uses the multiclass MCC due to Gorodkin (2004): the result is a scalar that generalizes the binary phi coefficient to a K by K confusion table.

```r title="Multiclass MCC"
set.seed(7)
multi <- tibble(
  obs = factor(sample(c("a", "b", "c"), 150, replace = TRUE, prob = c(0.6, 0.3, 0.1)),
               levels = c("a", "b", "c")),
  pred = factor(sample(c("a", "b", "c"), 150, replace = TRUE, prob = c(0.6, 0.3, 0.1)),
                levels = c("a", "b", "c"))
)

mcc(multi, truth = obs, estimate = pred)
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 mcc     multiclass    -0.0246
```

The `.estimator` column reports `multiclass`. There is no macro vs micro choice to make; yardstick computes the single scalar directly from the full confusion matrix.

**Example 3 groups scoring by resample fold.** With cross-validation predictions in one tibble, `group_by()` plus mcc returns one score per fold.

```r title="Per-fold MCC"
folded <- imb |>
  mutate(fold = rep(paste0("fold", 1:4), each = 50))

folded |>
  group_by(fold) |>
  mcc(truth = obs, estimate = pred)
#> # A tibble: 4 x 4
#>   fold  .metric .estimator .estimate
#>   <chr> <chr>   <chr>          <dbl>
#> 1 fold1 mcc     binary        0.0000
#> 2 fold2 mcc     binary        0.0612
#> 3 fold3 mcc     binary        0.0428
#> 4 fold4 mcc     binary        0.0287
```

**Example 4 uses the vector interface for ad-hoc checks.** `mcc_vec()` takes two factors directly and returns a numeric scalar instead of a tibble.

```r title="Vector interface for quick checks"
mcc_vec(imb$obs, imb$pred)
#> [1] 0.03224
```

The vector form is the right choice inside `map()` calls, custom tuning code, or unit tests where a tibble would be overhead.

[TIP]
**Combine MCC with accuracy in a metric_set().** Wrap both into a single callable so you score them in one pass: `class_metrics <- metric_set(accuracy, mcc)` then `class_metrics(df, truth, estimate)` returns a two-row tibble you can `pivot_wider()` or plot directly.

## mcc() compared with related metrics

**MCC sits in the same family as f_meas() and bal_accuracy(), but reads them differently.** The table below summarizes when to swap one for another.

| Metric | Best use case | Limitation |
|--------|---------------|-----------|
| `mcc()` | Single robust score on imbalanced or balanced data | Harder to explain than accuracy or F1 |
| `accuracy()` | Balanced classes, equal error costs | Misleading on skewed data |
| `bal_accuracy()` | Imbalanced classes, equal cost per class | Hides class-specific failure modes |
| `f_meas()` | Precision-recall blend, harmonic mean | Equal precision and recall weighting is a choice |
| `j_index()` | Two-class screening, Youden's J | Binary only |
| `kap()` | Chance-corrected agreement | Sensitive to marginal frequencies |

A practical rule: report MCC as the headline whenever any class is below 30 percent of the data, and add `roc_auc()` if you have probabilities.

[NOTE]
**MCC and Cohen's kappa are different chance-corrected scores.** Kappa subtracts agreement expected from marginal class distributions; MCC normalizes chi-square. They usually agree on rankings but diverge on extreme skew.

## Common pitfalls

**Three small mistakes account for most mcc() errors.** Each one has a clear fix.

The first is passing character vectors instead of factors. yardstick needs factors to confirm that both columns share the same levels in the same order. The fix is one `factor()` call:

```r title="Fix: convert character columns to factors"
bad <- tibble(obs = c("yes", "no", "yes", "no"), pred = c("yes", "yes", "no", "no"))
# mcc(bad, obs, pred)  # would error
bad <- bad |>
  mutate(across(c(obs, pred), \(x) factor(x, levels = c("yes", "no"))))
mcc(bad, obs, pred)
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 mcc     binary             0
```

The second pitfall is reading MCC on the same scale as accuracy. MCC ranges from -1 to 1, not 0 to 1. A score of 0.3 is solid; 0.7 is excellent. Label the scale on plots so stakeholders used to accuracy do not misread it.

The third pitfall is a degenerate confusion matrix. When the model predicts only one class, one denominator in the formula goes to zero and yardstick returns 0 by convention. Inspect `conf_mat()` before trusting a near-zero score.

[WARNING]
**A zero MCC does not always mean random predictions.** It also returns zero when the model predicts a single class for every row, regardless of how often that class appears in truth. Always pair mcc with `conf_mat()` so you can tell the two cases apart.

## Try it yourself

**Try it:** Use the built-in `hpc_cv` data from yardstick, which contains predictions across ten resamples for a multiclass problem. Compute MCC per resample, then sort the result. Save the per-resample tibble to `ex_mcc_by_fold`.

```r title="Your turn: per-resample MCC"
library(yardstick)
data("hpc_cv")

# Try it: per-resample MCC
ex_mcc_by_fold <- # your code here

ex_mcc_by_fold
#> Expected: 10 rows, one per Resample value
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
library(dplyr)
ex_mcc_by_fold <- hpc_cv |>
  group_by(Resample) |>
  mcc(truth = obs, estimate = pred)

ex_mcc_by_fold |>
  arrange(desc(.estimate)) |>
  head(3)
#> # A tibble: 3 x 4
#>   Resample .metric .estimator .estimate
#>   <chr>    <chr>   <chr>          <dbl>
#> 1 Fold06   mcc     multiclass     0.515
#> 2 Fold02   mcc     multiclass     0.508
#> 3 Fold10   mcc     multiclass     0.502
```

**Explanation:** Grouping by Resample before calling mcc gives one multiclass MCC per fold. Sorting by `.estimate` highlights the strongest fold, which you would then inspect with `conf_mat()` for class-specific patterns.

</details>

## Related yardstick metrics

**mcc() is one entry in the yardstick class-metric family.** Reach for these neighbors when MCC alone is not enough:

- `accuracy()` for the unbalanced baseline you compare against
- `bal_accuracy()` for the macro-recall view of the same problem
- `f_meas()` for a precision-recall blend
- `kap()` for chance-corrected agreement
- `j_index()` for the binary Youden's J
- `roc_auc()` and `pr_auc()` for probability-based ranking metrics

For the full set, see the [yardstick reference index](https://yardstick.tidymodels.org/reference/index.html).

## FAQ

**How is MCC calculated for two classes?**

For binary classification, MCC reads the four cells (TP, TN, FP, FN) and returns TP times TN minus FP times FN, divided by the square root of the four marginal totals multiplied. The result is the phi coefficient, identical to a Pearson correlation between two binary vectors.

**When should I prefer mcc() over accuracy()?**

Use MCC whenever any class is rare or the costs of false positives and false negatives are not symmetric. Accuracy can sit at 95 percent while a model ignores the minority class entirely; MCC drops to near zero in that case and exposes the failure with a single number.

**Does mcc() work for multiclass classification?**

Yes. yardstick switches `.estimator` from `binary` to `multiclass` based on the number of factor levels. The multiclass formula is the Gorodkin generalization of the phi coefficient and returns a single scalar in [-1, 1] from the full K by K confusion matrix.

**Can I compute MCC from a parsnip workflow?**

Pipe `augment()` output into mcc. With `augment(fit, new_data = test)` the result already contains the truth column and `.pred_class`, so the call becomes `augment(fit, test) |> mcc(class, .pred_class)`. Replace `class` with the actual outcome column name.

**What does an MCC of zero really mean?**

Zero indicates no correlation between predicted and observed classes, which usually means the model predicts at random. yardstick also returns zero when the model predicts a single class for every row, even if that class dominates truth. Inspect `conf_mat()` to distinguish "random" from "degenerate" before reporting.

## Summary

**mcc() is the right yardstick metric the moment class balance becomes a worry.** Read it next to `accuracy()` so the gap quantifies how much imbalance is hiding, and reach for `roc_auc()` or `f_meas()` when you need probability rankings or a precision-recall blend. With `group_by()` it scales to any resampling scheme without reshaping.
