---
title: "yardstick bal_accuracy() in R: Score Imbalanced Classifiers"
slug: yardstick-bal_accuracy-in-R
description: "Use yardstick bal_accuracy() in R to score classification models on imbalanced data. See syntax, multiclass averaging, grouped scoring, and common pitfalls."
keywords: "yardstick bal_accuracy, bal_accuracy function R, yardstick bal_accuracy examples, balanced accuracy R, tidymodels balanced accuracy, bal_accuracy metric R, balanced accuracy yardstick"
mathjax: false
webr: true
date: 2026-05-22
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: bal_accuracy()|yardstick bal_accuracy|yardstick::bal_accuracy()|balanced accuracy|balanced accuracy metric
auto_link_case_sensitive: true
target_keyword: yardstick bal_accuracy
sibling_block_enabled: true
difficulty: Beginner
---

# yardstick bal_accuracy() in R: Score Imbalanced Classifiers

<p class="lead">The yardstick bal_accuracy() function in R returns the macro-average of per-class recall for a classification model, accepting a tibble of truth and prediction columns and producing a tidy one-row summary that stays honest when one class dominates the data.</p>

[QUICK ANSWER]
bal_accuracy(df, truth, estimate)                       # basic two-class call
bal_accuracy(df, truth = obs, estimate = pred)          # named arguments
bal_accuracy(df, class, .pred_class)                    # default parsnip output
df |> group_by(fold) |> bal_accuracy(class, .pred_class)   # by resample
bal_accuracy(df, class, .pred_class, na_rm = TRUE)      # drop missing rows
bal_accuracy_vec(truth_vec, pred_vec)                   # vector interface
bal_accuracy(df, class, .pred_class, estimator = "macro_weighted")  # weighted macro

[DECISION TREE: Is bal_accuracy() the right tool?]
- imbalanced classes, want one robust number: bal_accuracy(df, truth, estimate)
- classes are roughly balanced: accuracy(df, truth, estimate)
- need precision-recall tradeoff: f_meas(df, truth, estimate)
- ranking by probability, not classes: roc_auc(df, truth, .pred_class_1)
- per-class diagnostics, not an average: precision(df, truth, estimate)
- regression model, not classification: rmse(df, truth, estimate)

## What bal_accuracy() measures

**bal_accuracy() averages how well a model recalls each class.** For a two-class problem it equals the mean of sensitivity and specificity. For multiclass it equals the macro average of per-class recall. The result is a number between 0 and 1; 0.5 is chance for a binary classifier.

The function accepts a data frame with two factor columns and returns a tibble with `.metric`, `.estimator`, and `.estimate`. It ignores class proportions: a model that always predicts the majority class scores zero on the minority class, dragging the average down.

Reach for balanced accuracy when one class is rare, costs are roughly symmetric, and you want a single headline number. Pair it with `accuracy()` so you can see how much the imbalance is hiding.

[KEY INSIGHT]
**Balanced accuracy ignores class proportions.** It treats every class as equally important, which is exactly what you want when the rare class is the one you care about and a high overall accuracy would otherwise hide a model that ignores it.

## bal_accuracy() syntax and arguments

**The signature is identical to every other yardstick class metric.** The same call shape works whether you score logistic regression, a random forest, or a neural net.

```r title="bal_accuracy generic signature"
bal_accuracy(data, truth, estimate, estimator = NULL, na_rm = TRUE, case_weights = NULL, event_level = "first", ...)
```

| Argument | Description |
|----------|-------------|
| `data` | A data frame with the truth and estimate columns. |
| `truth` | Unquoted column name of the observed class labels (a factor). |
| `estimate` | Unquoted column name of the predicted class labels (a factor with matching levels). |
| `estimator` | `"binary"`, `"macro"`, or `"macro_weighted"`; yardstick picks one based on the number of factor levels if you leave it `NULL`. |
| `na_rm` | If `TRUE`, drop rows where either column is missing before scoring. |
| `case_weights` | Optional column of row weights, useful for survey or class-rebalanced data. |
| `event_level` | `"first"` or `"second"`; controls which factor level counts as the positive class for two-class problems. |

Both `truth` and `estimate` must be factors with identical levels. The `estimator` argument only matters for multiclass: `"macro"` is the default; `"macro_weighted"` weights each class by prevalence, which partly defeats the point of using balanced accuracy.

## Examples: balanced accuracy for binary and multiclass

**The examples below build a deliberately imbalanced two-class data set, then a multiclass one.** First, create a binary frame where 90 percent of rows belong to one class.

```r title="Imbalanced two-class predictions tibble"
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

**Example 1 contrasts accuracy with bal_accuracy on the same imbalanced data.** Accuracy looks healthy because the model agrees with the dominant class most of the time. Balanced accuracy tells the real story.

```r title="Accuracy vs balanced accuracy on imbalanced data"
accuracy(imb, obs, pred)
#> # A tibble: 1 x 3
#>   .metric  .estimator .estimate
#>   <chr>    <chr>          <dbl>
#> 1 accuracy binary         0.825

bal_accuracy(imb, obs, pred)
#> # A tibble: 1 x 3
#>   .metric      .estimator .estimate
#>   <chr>        <chr>          <dbl>
#> 1 bal_accuracy binary         0.516
```

Accuracy is 0.825 but balanced accuracy is barely above chance. The 82 percent figure is inflated by correct rejections of the majority class, not useful predictions on the rare class.

**Example 2 scores a multiclass setup.** For three or more classes, bal_accuracy defaults to the macro estimator: average the per-class recall, no weighting.

```r title="Multiclass balanced accuracy"
set.seed(7)
multi <- tibble(
  obs = factor(sample(c("a", "b", "c"), 150, replace = TRUE, prob = c(0.6, 0.3, 0.1)),
               levels = c("a", "b", "c")),
  pred = factor(sample(c("a", "b", "c"), 150, replace = TRUE, prob = c(0.6, 0.3, 0.1)),
                levels = c("a", "b", "c"))
)

bal_accuracy(multi, truth = obs, estimate = pred)
#> # A tibble: 1 x 3
#>   .metric      .estimator .estimate
#>   <chr>        <chr>          <dbl>
#> 1 bal_accuracy macro          0.351
```

The `.estimator` column reports `macro`. Switch to `estimator = "macro_weighted"` to count each class proportional to its frequency.

**Example 3 groups scoring by resample fold.** With cross-validation predictions in one tibble, `group_by()` plus bal_accuracy returns one score per fold.

```r title="Per-fold balanced accuracy"
folded <- imb |>
  mutate(fold = rep(paste0("fold", 1:4), each = 50))

folded |>
  group_by(fold) |>
  bal_accuracy(truth = obs, estimate = pred)
#> # A tibble: 4 x 4
#>   fold  .metric      .estimator .estimate
#>   <chr> <chr>        <chr>          <dbl>
#> 1 fold1 bal_accuracy binary         0.500
#> 2 fold2 bal_accuracy binary         0.527
#> 3 fold3 bal_accuracy binary         0.522
#> 4 fold4 bal_accuracy binary         0.518
```

**Example 4 uses the vector interface for ad-hoc checks.** `bal_accuracy_vec()` takes two factors directly and returns a numeric scalar instead of a tibble.

```r title="Vector interface for quick checks"
bal_accuracy_vec(imb$obs, imb$pred)
#> [1] 0.5156
```

The vector form is the right choice inside `map()` calls or unit tests.

[TIP]
**Compute accuracy and bal_accuracy together with metric_set().** Wrap both into one callable so you score them in a single pass: `class_metrics <- metric_set(accuracy, bal_accuracy)`, then `class_metrics(df, truth, estimate)` returns a two-row tibble ready for `bind_rows()` or plotting.

## bal_accuracy() compared with related metrics

**Balanced accuracy lands between plain accuracy and the full precision-recall family.** The table below summarizes when to reach for another yardstick metric.

| Metric | Best use case | Limitation |
|--------|---------------|-----------|
| `bal_accuracy()` | Imbalanced classes, equal cost per class | Hides which class drives errors |
| `accuracy()` | Balanced classes, equal error costs | Misleading on skewed data |
| `j_index()` | Two-class screening, Youden's J | Only defined for binary problems |
| `f_meas()` | Single score combining precision and recall | Equal weighting is a choice, not a default |
| `mcc()` | Single score robust to imbalance and chance | Harder to explain to stakeholders |
| `roc_auc()` | Probability-threshold comparison | Requires predicted probabilities, not classes |

A practical rule: report balanced accuracy as the headline whenever any class is below 30 percent of the data, and add `roc_auc()` if you have probability predictions.

[NOTE]
**bal_accuracy is sometimes called macro recall.** For multiclass problems the two are identical by construction. The "balanced" name emphasizes the connection to the binary case, where it equals the average of sensitivity and specificity.

## Common pitfalls

**Three small mistakes account for most bal_accuracy() errors.** Each one has a clear fix.

The first is passing character vectors instead of factors. yardstick requires factors so it can validate that both columns share the same levels. The fix is one `factor()` call:

```r title="Fix: convert character columns to factors"
bad <- tibble(obs = c("yes", "no", "yes", "no"), pred = c("yes", "yes", "no", "no"))
# bal_accuracy(bad, obs, pred)  # would error
bad <- bad |>
  mutate(across(c(obs, pred), \(x) factor(x, levels = c("yes", "no"))))
bal_accuracy(bad, obs, pred)
#> # A tibble: 1 x 3
#>   .metric      .estimator .estimate
#>   <chr>        <chr>          <dbl>
#> 1 bal_accuracy binary         0.500
```

The second pitfall is forgetting the difference between `"macro"` and `"macro_weighted"`. The default macro estimator weights every class equally, which is exactly what you want for imbalance. Switching to `"macro_weighted"` weights each class by its prevalence and re-introduces the very bias you were trying to escape.

The third pitfall is using `event_level = "second"` without noticing it flips the positive class. Sensitivity and specificity swap, the average stays numerically the same, but downstream `precision()` and `recall()` calls report a different class as positive. Set `event_level` once at the top of the workflow.

[WARNING]
**Balanced accuracy is undefined when a class has zero rows in truth.** yardstick will return `NaN` for that class's recall and the macro average inherits it. Filter empty classes out or use `case_weights` to keep the math defined.

## Try it yourself

**Try it:** Use the built-in `hpc_cv` data from yardstick, which contains predictions across four resamples for a multiclass problem. Compute balanced accuracy per resample, then report the best resample. Save the per-resample tibble to `ex_bal_by_fold`.

```r title="Your turn: per-resample balanced accuracy"
library(yardstick)
data("hpc_cv")

# Try it: per-resample balanced accuracy
ex_bal_by_fold <- # your code here

ex_bal_by_fold
#> Expected: 10 rows, one per Resample value
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
library(dplyr)
ex_bal_by_fold <- hpc_cv |>
  group_by(Resample) |>
  bal_accuracy(truth = obs, estimate = pred)

ex_bal_by_fold |>
  arrange(desc(.estimate)) |>
  head(3)
#> # A tibble: 3 x 4
#>   Resample .metric      .estimator .estimate
#>   <chr>    <chr>        <chr>          <dbl>
#> 1 Fold06   bal_accuracy macro          0.661
#> 2 Fold02   bal_accuracy macro          0.654
#> 3 Fold10   bal_accuracy macro          0.651
```

**Explanation:** Grouping by Resample before calling bal_accuracy gives one macro-recall score per fold. Sorting by `.estimate` highlights the strongest fold, which you would then inspect for class confusion patterns.

</details>

## Related yardstick metrics

**bal_accuracy() is one entry in the yardstick class-metric family.** Reach for these neighbors when balanced accuracy alone is not enough:

- `accuracy()` for the unbalanced baseline you compare against
- `sens()` and `spec()` for the two components of the binary case
- `j_index()` for Youden's J, the binary special case
- `f_meas()` for a precision-recall blend
- `mcc()` for the Matthews correlation coefficient
- `roc_auc()` and `pr_auc()` for probability-based ranking metrics

For the full set, see the [yardstick reference index](https://yardstick.tidymodels.org/reference/index.html).

## FAQ

**How is balanced accuracy calculated for two classes?**

For binary classification, bal_accuracy is the arithmetic mean of sensitivity and specificity. yardstick reads them from the confusion matrix and averages. The score is 1 when both rates are 1, 0.5 for a majority-only classifier, and 0 when the model is wrong on both classes.

**When should I use bal_accuracy() instead of accuracy()?**

Use balanced accuracy whenever class proportions are skewed and you care about the rare class. A 95 percent accuracy on a 95 / 5 split says little about the minority class, while balanced accuracy drops sharply if the model ignores it.

**Does bal_accuracy() work for multiclass classification?**

Yes. yardstick switches the `.estimator` from `binary` to `macro` based on the number of factor levels. The macro estimator averages per-class recall without weighting. Set `estimator = "macro_weighted"` if you want a prevalence-weighted average, though that partly undoes the rebalancing.

**Can I compute balanced accuracy from a parsnip workflow?**

Pipe `augment()` output into bal_accuracy. With `augment(fit, new_data = test)`, the result already contains `truth` and `.pred_class` columns, so the call becomes `augment(fit, test) |> bal_accuracy(class, .pred_class)`. Replace `class` with your outcome column name.

**How does bal_accuracy compare with Cohen's kappa?**

Balanced accuracy averages per-class recall; `kap()` compares observed agreement to chance agreement from marginal frequencies. Kappa can go negative when the model is worse than chance, while balanced accuracy is bounded at 0. Use kap for a chance-corrected agreement score.

## Summary

**bal_accuracy() is the right yardstick metric the moment one class dominates.** Read it next to plain `accuracy()` so the gap quantifies the imbalance, and reach for `roc_auc()` or `f_meas()` when symmetric class treatment stops being the right framing. With `group_by()` it scales to any resampling scheme without reshaping.
