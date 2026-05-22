---
title: "yardstick pr_curve() in R: Precision-Recall Curve Points"
slug: yardstick-pr_curve-in-R
description: "Compute precision-recall curves in R with yardstick pr_curve(). See syntax, binary and multiclass examples, autoplot, and pitfalls for imbalanced data."
keywords: "yardstick pr_curve, pr_curve function R, yardstick pr_curve examples, R precision recall curve, tidymodels pr_curve, pr_curve autoplot, plot precision recall R"
mathjax: false
webr: true
date: 2026-05-22
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: yardstick pr_curve|yardstick::pr_curve()|pr_curve in R|precision recall curve in R|pr_curve yardstick
auto_link_case_sensitive: true
target_keyword: yardstick pr_curve
sibling_block_enabled: true
difficulty: Beginner
---

# yardstick pr_curve() in R: Precision-Recall Curve Points

<p class="lead">The yardstick pr_curve() function in R sweeps every probability cutoff your classifier produced and returns a tidy tibble of precision and recall pairs, which is the chart Google calls a PR curve and the diagnostic of choice when the positive class is rare.</p>

[QUICK ANSWER]
pr_curve(df, truth, .pred_class1)                       # basic two-class call
pr_curve(df, truth = obs, .pred_class1)                 # named truth column
pr_curve(df, class, .pred_yes, event_level = "second")  # flip positive class
df |> group_by(fold) |> pr_curve(class, .pred_yes)      # by resample
pr_curve(df, class, .pred_a, .pred_b, .pred_c)          # multiclass one-vs-all
autoplot(pr_curve(df, class, .pred_yes))                # quick ggplot
pr_curve(df, class, .pred_yes) |> ggplot(aes(recall, precision)) + geom_path()

[DECISION TREE: Is pr_curve() the right tool?]
- get precision and recall across all thresholds: pr_curve(df, truth, .pred_class1)
- get one ranking score for the PR curve: pr_auc(df, truth, .pred_class1)
- get sensitivity and specificity instead: roc_curve(df, truth, .pred_class1)
- get gain or lift curve points: gain_curve(df, truth, .pred_class1)
- get the confusion matrix at one cutoff: conf_mat(df, truth, estimate)
- compare PR shapes across resamples: group_by(df, fold) |> pr_curve(...) |> autoplot()

## What pr_curve() returns

**pr_curve() converts probabilities into a precision-recall trade-off, not a single score.** You give it a data frame with a factor truth column and one or more probability columns, and you get back a tibble with `.threshold`, `recall`, and `precision`, one row per unique cutoff. Each row reads as "if you label every observation above this probability as positive, here is the precision you keep and the recall you reach."

That tibble is the raw material for any PR chart. Pipe it into autoplot() when you want a ready-made plot, or hand it to ggplot2 when you want full styling. Because the output is tidy, it slots into `group_by()`, `facet_wrap()`, and dplyr verbs without reshaping.

## pr_curve() syntax and arguments

**The signature is identical to roc_curve(), with the same binary versus multiclass split.** Binary problems take one probability column, multiclass problems take one column per class level.

```r title="pr_curve generic signature"
pr_curve(data, truth, ..., na_rm = TRUE,
         event_level = "first", case_weights = NULL,
         options = list())
```

| Argument | Description |
|----------|-------------|
| `data` | Data frame with the truth column and probability columns. |
| `truth` | Unquoted column name of the observed labels (must be a factor). |
| `...` | Unquoted probability columns. One for binary, one per class for multiclass. |
| `na_rm` | If `TRUE`, drop rows where any column is missing before computing. |
| `event_level` | `"first"` or `"second"`; names which factor level counts as positive. |
| `case_weights` | Optional unquoted column for weighted curve points. |

The truth factor levels must align with the probability column names after the `.pred_` prefix. For binary cases, the third argument is the probability column for the positive class, controlled by `event_level`.

## Four worked examples on rare-event data

**These examples use an imbalanced fraud frame so the PR curve actually has work to do.** When the positive rate is below 10 percent, accuracy and ROC AUC look optimistic; the PR curve is the chart that shows you the truth.

```r title="Imbalanced fraud predictions"
library(yardstick)
library(dplyr)
library(ggplot2)

set.seed(2026)
n <- 500
fraud <- tibble(
  truth = factor(sample(c("fraud", "ok"), n, replace = TRUE, prob = c(0.08, 0.92))),
  .pred_fraud = pmax(0, pmin(1,
    ifelse(truth == "fraud", rbeta(n, 6, 3), rbeta(n, 2, 6))
  ))
)
fraud |> count(truth)
#> # A tibble: 2 x 2
#>   truth     n
#>   <fct> <int>
#> 1 fraud    35
#> 2 ok      465
```

Call pr_curve() to get the threshold sweep. Each row gives you the precision the model keeps at that cutoff and the recall it has reached so far.

```r title="Basic two class pr_curve call"
pr_pts <- pr_curve(fraud, truth, .pred_fraud)
head(pr_pts, 4)
#> # A tibble: 4 x 3
#>   .threshold  recall precision
#>        <dbl>   <dbl>     <dbl>
#> 1 -Inf       1          0.0700
#> 2    0.0345  1          0.0701
#> 3    0.0445  1          0.0702
#> 4    0.0517  1          0.0703
tail(pr_pts, 2)
#> # A tibble: 2 x 3
#>   .threshold recall precision
#>        <dbl>  <dbl>     <dbl>
#> 1      0.967 0.0286         1
#> 2      0.984 0           NaN
```

The first row sits at the lowest cutoff: recall is 1 and precision matches the 7 percent base rate. The last row sits at the top, where only the most confident prediction stays positive.

Pipe the result into autoplot() for a styled ggplot.

```r title="autoplot the precision recall curve"
autoplot(pr_pts)
```

[TIP]
**autoplot() returns a ggplot object you can keep editing.** Add `+ labs(title = "Fraud classifier")` or `+ scale_x_continuous(labels = scales::percent)` to brand the chart without rebuilding it from the curve tibble.

For full styling control, plot the raw points with ggplot. The PR curve uses recall on x and precision on y, the opposite axis convention from the ROC curve.

```r title="Custom ggplot PR chart"
ggplot(pr_pts, aes(x = recall, y = precision)) +
  geom_hline(yintercept = 0.07, lty = 3, color = "grey60") +
  geom_path(linewidth = 0.9, color = "#c0392b") +
  coord_equal(xlim = c(0, 1), ylim = c(0, 1)) +
  labs(x = "Recall", y = "Precision")
```

The dashed line at 0.07 marks the base rate, the precision a random classifier reaches. A curve that hugs that line is no better than guessing.

Group by a resample column to overlay one curve per fold.

```r title="One curve per cross validation fold"
folded <- fraud |>
  mutate(fold = sample(paste0("fold", 1:5), n, replace = TRUE))

folded |>
  group_by(fold) |>
  pr_curve(truth, .pred_fraud) |>
  autoplot()
```

[KEY INSIGHT]
**PR curves are sensitive to class balance, ROC curves are not.** ROC AUC barely moves when you flip the positive rate from 50 percent to 5 percent, because both axes rescale. PR AUC drops, because the baseline drops with the positive rate. On imbalanced problems, PR is the harder, more honest test.

## pr_curve() vs neighbouring metrics

**Pick the function that matches the question you are asking.** The table below contrasts pr_curve() with the closest yardstick siblings.

| Function | Returns | When to use |
|----------|---------|-------------|
| `pr_curve()` | Tibble of thresholds with precision and recall | Plot or pick a cutoff on imbalanced data |
| `pr_auc()` | One row with average precision | Single ranking score for rare-event models |
| `roc_curve()` | Tibble of sensitivity and specificity points | Plot or pick a cutoff on balanced data |
| `f_meas()` | Single F1 score at one cutoff | You already chose a threshold |
| `precision()` and `recall()` | One row each at one cutoff | Report headline numbers after picking a threshold |

If the positive class is below 20 percent of your data, prefer pr_curve() and pr_auc() over the ROC pair. The ROC chart still works, but it tends to look better than the model performs.

## Common pitfalls

**Three issues show up in nearly every pr_curve() bug report.**

First, passing `event_level = "first"` when the rare class is the second factor level produces a curve at the baseline. Always check `levels(df$truth)` and match it against the probability column name. yardstick treats the level the column refers to as the positive class, not whichever class is rarer.

Second, the last row often shows `precision = NaN` and recall just above zero. That is the highest threshold, where no observation is labelled positive; precision is `0 / 0`. autoplot() handles it gracefully, but a custom ggplot that uses `geom_smooth()` or fits a curve will throw warnings. Drop the row with `slice(-n())` or filter out `is.nan(precision)` before custom plotting.

Third, multiclass calls require one probability column per level. Passing only the positive-class column on a three-level factor triggers `Error: A multiclass problem requires probability columns for all levels`. Use tidyselect, for example `.pred_a:.pred_c` or `starts_with(".pred_")`, when classes share a prefix.

## Try it yourself

**Try it:** Build the PR curve for the `fraud` tibble above and find the threshold that keeps precision at or above 0.5 with the highest possible recall. Save that threshold to `ex_thr`.

```r title="Your turn: find the 0.5 precision cutoff"
# Try it: pick the threshold where precision >= 0.5 with max recall
ex_thr <- # your code here

ex_thr
#> Expected: a number near 0.5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_thr <- fraud |>
  pr_curve(truth, .pred_fraud) |>
  filter(precision >= 0.5) |>
  slice_max(recall, n = 1) |>
  pull(.threshold)
ex_thr
#> [1] 0.5193
```

**Explanation:** pr_curve() lists every threshold the classifier produced, so picking a cutoff is a dplyr operation. `filter(precision >= 0.5)` keeps only rows where the precision floor is met, then `slice_max(recall)` picks the row that still recovers the most positives.

</details>

## Related yardstick functions

[NOTE]
**Coming from scikit-learn?** `sklearn.metrics.precision_recall_curve(y_true, y_score)` returns three arrays plus the threshold array; yardstick returns one tidy tibble with named columns instead, which removes the off-by-one length quirk you may have hit in Python.

* `pr_auc()` for the single-number average precision the curve summarises.
* `roc_curve()` and `roc_auc()` for the sensitivity-specificity variant on balanced data.
* `gain_curve()` and `lift_curve()` for marketing-style cumulative charts.
* `f_meas()`, `precision()`, and `recall()` once you have committed to a threshold.
* `metric_set()` to bundle pr_auc() with calibration metrics like `brier_class()` in a `last_fit()` workflow.

See the [yardstick reference for pr_curve()](https://yardstick.tidymodels.org/reference/pr_curve.html) on tidymodels.org for the full argument list.

## FAQ

**What is the difference between pr_curve() and pr_auc() in yardstick?**

pr_curve() returns a tibble of thresholds, precision, and recall, which is the data you plot. pr_auc() reduces that curve to a single average precision number. Both consume the same inputs, a truth factor and a probability column, so you typically call them side by side: one for the chart, one for the leaderboard score on imbalanced problems.

**When should I use pr_curve() instead of roc_curve()?**

Use pr_curve() when the positive class is rare, typically below 20 percent of the data. ROC curves rescale both axes by class size, so they stay optimistic on imbalanced data. PR curves anchor precision against the base rate, so a curve that hugs the bottom is honest about a weak model. For balanced binary problems, either chart works.

**How do I plot a precision-recall curve from yardstick output?**

Call autoplot() on the pr_curve() result for a ready-made ggplot. For custom styling, map `recall` to x and `precision` to y in ggplot2, then add `geom_path()`. Add a dashed horizontal reference line at the positive class rate so readers see the random-guess baseline; a useful chart compares the curve to that line, not to the top of the plot.

**Does pr_curve() handle multiclass problems?**

Yes. Pass one probability column per class using tidyselect, for example `.pred_setosa:.pred_virginica`. yardstick computes a one-vs-all PR curve per level and returns a tibble with a `.level` column. Pipe it to autoplot() for one panel per class, or filter the `.level` column to focus on a single class.

**Why does my PR curve sit close to the bottom of the chart?**

Either the model has no signal beyond the base rate, or `event_level` points to the wrong factor level. Check `levels(df$truth)` and confirm the `.pred_*` column refers to the rare class. A curve that sits at the positive class rate horizontally is a coin flip; a curve that climbs toward 1 on the precision axis at low recall is a model worth tuning.
