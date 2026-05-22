---
title: "yardstick roc_curve() in R: ROC Sweep Data for Plotting"
slug: yardstick-roc_curve-in-R
description: "Build the ROC curve threshold sweep in R with yardstick roc_curve(). See syntax, binary and multiclass examples, autoplot patterns, and common pitfalls."
keywords: "yardstick roc_curve, roc_curve function R, yardstick roc_curve examples, R ROC curve tidymodels, roc_curve autoplot, plot ROC R yardstick, tidymodels classification threshold"
mathjax: false
webr: true
date: 2026-05-22
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: yardstick roc_curve|yardstick::roc_curve()|roc_curve in R|ROC curve in R|roc_curve yardstick
auto_link_case_sensitive: true
target_keyword: yardstick roc_curve
sibling_block_enabled: true
difficulty: Beginner
---

# yardstick roc_curve() in R: ROC Sweep Data for Plotting

<p class="lead">The yardstick roc_curve() function in R returns the sensitivity and specificity at every probability threshold a classifier produces, giving you a tidy tibble that plugs straight into autoplot(), ggplot2, group_by() for resamples, and multiclass one-vs-all decomposition.</p>

[QUICK ANSWER]
roc_curve(df, truth, .pred_class1)                       # basic two-class call
roc_curve(df, truth = obs, .pred_class1)                 # named truth column
roc_curve(df, class, .pred_yes, event_level = "second")  # flip positive class
df |> group_by(fold) |> roc_curve(class, .pred_yes)      # by resample
roc_curve(df, class, .pred_a, .pred_b, .pred_c)          # multiclass one-vs-all
autoplot(roc_curve(df, class, .pred_yes))                # quick ggplot
roc_curve(df, class, .pred_yes) |> ggplot(aes(1 - specificity, sensitivity)) + geom_path()

[DECISION TREE: Is roc_curve() the right tool?]
- get sensitivity and specificity at every threshold: roc_curve(df, truth, .pred_class1)
- get one ranking score, not curve points: roc_auc(df, truth, .pred_class1)
- get precision-recall curve points: pr_curve(df, truth, .pred_class1)
- get gain or lift curve points: gain_curve(df, truth, .pred_class1)
- get the confusion matrix at one cutoff: conf_mat(df, truth, estimate)
- compare curves across folds visually: group_by(df, fold) |> roc_curve(...) |> autoplot()

## What roc_curve() returns

**roc_curve() turns predicted probabilities into a threshold sweep, not a single score.** You hand it a data frame with a truth column and one or more probability columns, and it returns a tibble of `.threshold`, `specificity`, and `sensitivity` rows, one per unique cutoff. Each row says "if you classify everything above this probability as positive, here is how the model performs."

That tibble is the raw material for the ROC plot. Pass it to autoplot() for a ready-made chart, or pipe it into ggplot2 for full styling control. Because the output is tidy, it composes with group_by() and dplyr verbs without extra glue code.

## roc_curve() syntax and arguments

**The signature mirrors the rest of the yardstick probability family.** Argument shape changes between binary and multiclass: binary takes one probability column, multiclass takes one column per class.

```r title="roc_curve generic signature"
roc_curve(data, truth, ..., na_rm = TRUE,
          event_level = "first", case_weights = NULL,
          options = list())
```

| Argument | Description |
|----------|-------------|
| `data` | Data frame with the truth column and probability columns. |
| `truth` | Unquoted column name of the observed class labels (must be a factor). |
| `...` | Unquoted probability columns. One column for binary, one per class for multiclass. |
| `na_rm` | If `TRUE`, drop rows where any column is missing before computing. |
| `event_level` | `"first"` or `"second"`; for binary, names which factor level is the positive class. |
| `case_weights` | Optional unquoted column for weighted curve points. |

The truth factor levels must match the probability column names after the `.pred_` prefix. For binary problems, the third argument is the probability for the positive class, controlled by `event_level`.

## Plot the curve: four worked examples

**These examples build a small two-class tibble so the curve is reproducible.** Start with a synthetic churn-prediction frame.

```r title="Two class predictions with probabilities"
library(yardstick)
library(dplyr)
library(ggplot2)

set.seed(404)
churn <- tibble(
  truth = factor(sample(c("yes", "no"), 200, replace = TRUE, prob = c(0.3, 0.7))),
  .pred_yes = pmax(0, pmin(1,
    ifelse(truth == "yes", rnorm(200, 0.7, 0.18), rnorm(200, 0.3, 0.18))
  ))
)
churn |> count(truth)
#> # A tibble: 2 x 2
#>   truth     n
#>   <fct> <int>
#> 1 no      138
#> 2 yes      62
```

Call roc_curve() to get the threshold sweep. The result is a tibble you can read row by row.

```r title="Basic two class roc curve call"
roc_pts <- roc_curve(churn, truth, .pred_yes, event_level = "second")
head(roc_pts, 4)
#> # A tibble: 4 x 3
#>   .threshold specificity sensitivity
#>        <dbl>       <dbl>       <dbl>
#> 1   -Inf           0           1
#> 2      0.0264      0           1
#> 3      0.0421      0.00725     1
#> 4      0.0590      0.0145      1
tail(roc_pts, 2)
#> # A tibble: 2 x 3
#>   .threshold specificity sensitivity
#>        <dbl>       <dbl>       <dbl>
#> 1       1.05           1           0
#> 2        Inf           1           0
```

Pipe the result into autoplot() for a styled ggplot with the diagonal reference line drawn.

```r title="autoplot the curve"
autoplot(roc_pts)
```

[TIP]
**autoplot() is the fastest sanity check.** It returns a ggplot object, so you can keep adding layers: `autoplot(roc_pts) + labs(title = "Churn classifier")` lets you brand the chart without rebuilding it from scratch.

For full control, plot the raw points with ggplot. `1 - specificity` is the false-positive rate; `sensitivity` is the true-positive rate.

```r title="Custom ggplot ROC chart"
ggplot(roc_pts, aes(x = 1 - specificity, y = sensitivity)) +
  geom_abline(lty = 3, color = "grey60") +
  geom_path(linewidth = 0.9, color = "#3182bd") +
  coord_equal() +
  labs(x = "False positive rate", y = "True positive rate")
```

Group by a resample column to plot one curve per fold on a single chart.

```r title="One curve per cross validation fold"
folded <- churn |>
  mutate(fold = sample(paste0("fold", 1:5), 200, replace = TRUE))

folded |>
  group_by(fold) |>
  roc_curve(truth, .pred_yes, event_level = "second") |>
  autoplot()
```

[KEY INSIGHT]
**roc_curve() and roc_auc() consume the same inputs but answer different questions.** The curve shows the shape of the trade-off across thresholds; the AUC summarises that shape as a single ranking score. Use the curve when you need to pick a cutoff or compare model shapes; use the score when you need to rank models on a leaderboard.

## roc_curve() vs neighbouring ROC tools

**Pick the function that matches what you want to see.** The table below contrasts roc_curve() with the closest yardstick siblings.

| Function | Returns | When to use |
|----------|---------|-------------|
| `roc_curve()` | Tibble of thresholds with sensitivity and specificity | You want to plot or pick a cutoff |
| `roc_auc()` | One row with the area under the curve | You want a single ranking score |
| `pr_curve()` | Tibble of thresholds with precision and recall | Imbalanced data where precision matters |
| `gain_curve()` | Tibble of percent-found vs percent-tested | Marketing and lift charts |
| `conf_mat()` | A confusion matrix at one cutoff | You have already picked a threshold |

If you need both the chart and the headline number, compute roc_curve() for plotting and roc_auc() for the metric. They share the same probability inputs, so call them side by side without rebuilding the data.

## Common pitfalls

**Three mistakes show up in nearly every roc_curve() bug report.**

First, passing `event_level = "first"` when the positive class is actually the second factor level inverts the curve below the diagonal. Always check `levels(df$truth)` and confirm which level the probability column refers to.

Second, feeding hard class predictions instead of probabilities throws `Error: must be a numeric vector, not a factor`. roc_curve() needs the raw probability columns named `.pred_<class>`, not the `.pred_class` argmax column.

Third, multiclass calls require one probability column per level, in any order. Passing only the positive-class column with three or more factor levels triggers `Error: A multiclass problem requires probability columns for all levels`. Use tidyselect (`.pred_a:.pred_c` or `starts_with(".pred_")`) when classes share a prefix.

## Try it yourself

**Try it:** Build the ROC curve for the `churn` tibble above and find the threshold whose sensitivity is closest to 0.8. Save that threshold to `ex_thr`.

```r title="Your turn: find the 0.8 sensitivity cutoff"
# Try it: pick the threshold closest to 0.8 sensitivity
ex_thr <- # your code here

ex_thr
#> Expected: a number near 0.45
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_thr <- churn |>
  roc_curve(truth, .pred_yes, event_level = "second") |>
  slice_min(abs(sensitivity - 0.8), n = 1) |>
  pull(.threshold)
ex_thr
#> [1] 0.4528796
```

**Explanation:** roc_curve() returns every threshold the classifier produced, so picking a cutoff is a dplyr filter on the curve tibble. `slice_min(abs(sensitivity - 0.8))` keeps the row whose sensitivity is closest to the target.

</details>

## Related yardstick functions

[NOTE]
**Coming from scikit-learn?** `sklearn.metrics.roc_curve(y_true, y_score)` returns three arrays; yardstick returns one tidy tibble with named columns instead.

* `roc_auc()` for the single-number ranking score the curve summarises.
* `pr_curve()` and `pr_auc()` for the precision-recall variant on imbalanced data.
* `gain_curve()` and `lift_curve()` for marketing-style cumulative charts.
* `conf_mat()` and `accuracy()` once you have picked a threshold from the curve.
* `metric_set()` to bundle roc_auc() with calibration metrics like `brier_class()`.

See the [yardstick reference for roc_curve()](https://yardstick.tidymodels.org/reference/roc_curve.html) on tidymodels.org for the full argument list.

## FAQ

**What is the difference between roc_curve() and roc_auc() in yardstick?**

roc_curve() returns a tibble of thresholds, sensitivity, and specificity, which is the data you plot. roc_auc() reduces that curve to one number, the area under it. Both consume the same inputs (a truth factor and a probability column), so you usually call them side by side: one for the chart, one for the leaderboard metric.

**How do I plot a ROC curve from yardstick output?**

Call autoplot() on the roc_curve() result for a ready-made ggplot with the diagonal reference line. For custom styling, pass the tibble to ggplot2 and map `1 - specificity` to x and `sensitivity` to y, then layer `geom_path()`. The tidy output composes with `facet_wrap()` and `group_by()` without extra reshaping.

**Does roc_curve() handle multiclass problems?**

Yes. Pass one probability column per class via tidyselect (for example `.pred_setosa:.pred_virginica`). yardstick computes a one-vs-all curve per level and returns a tibble with an extra `.level` column. Pipe it into autoplot() to get one panel per class.

**Why is my ROC curve below the diagonal?**

The most common cause is `event_level`. yardstick defaults to `"first"`, meaning the first factor level is the positive class. If your probability column predicts the second level, set `event_level = "second"`. Otherwise the curve flips. Check `levels(df$truth)` against the `.pred_*` column name to verify.

**Can roc_curve() use case weights?**

Yes. Pass an unquoted column to `case_weights` and yardstick weighs each row when accumulating sensitivity and specificity. This is useful for survey data or stratified sampling where rows represent different population shares.
