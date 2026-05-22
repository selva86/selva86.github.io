---
title: "yardstick f_meas() in R: Score the F-Measure of Classifiers"
slug: yardstick-f_meas-in-R
description: "Use yardstick f_meas() in R to score the F-measure of classifiers: harmonic mean of precision and recall. Syntax, beta tuning, multiclass averaging, pitfalls."
keywords: "yardstick f_meas, f_meas function R, yardstick f_meas examples, F1 score R, tidymodels f_meas, F-measure R, f_meas yardstick tidymodels"
mathjax: false
webr: true
date: 2026-05-22
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: yardstick f_meas|yardstick::f_meas()|F-measure|F1 score|f_meas metric
auto_link_case_sensitive: true
target_keyword: yardstick f_meas
sibling_block_enabled: true
difficulty: Beginner
---

# yardstick f_meas() in R: Score the F-Measure of Classifiers

<p class="lead">The yardstick f_meas() function in R computes the F-measure of a classifier, a single score that combines precision and recall through their harmonic mean. It accepts a tibble of truth and prediction columns, supports beta tuning for asymmetric costs, and returns a tidy one-row summary you can group, average across classes, or feed into a metric set.</p>

[QUICK ANSWER]
f_meas(df, truth, estimate)                             # basic F1 score
f_meas(df, truth, estimate, beta = 2)                   # F2, weights recall
f_meas(df, truth, estimate, beta = 0.5)                 # F0.5, weights precision
f_meas(df, class, .pred_class)                          # default parsnip output
df |> group_by(fold) |> f_meas(class, .pred_class)      # by resample
f_meas(df, class, .pred_class, estimator = "macro")     # multiclass macro F1
f_meas(df, class, .pred_class, event_level = "second")  # flip positive class
f_meas_vec(truth_vec, pred_vec)                         # vector interface

[DECISION TREE: Is f_meas() the right tool?]
- combine precision and recall in one score: f_meas(df, truth, estimate)
- score predicted-positive correctness only: precision(df, truth, estimate)
- score actual-positive coverage only: recall(df, truth, estimate)
- score overall correctness: accuracy(df, truth, estimate)
- rank by probability not class: pr_auc(df, truth, .pred_class_1)
- chance-corrected agreement instead: kap(df, truth, estimate)
- regression problem, not classification: rmse(df, truth, estimate)

## What f_meas() measures

**f_meas() answers one question: how well does the model balance catching positives and avoiding false alarms?** You pass a data frame with observed labels and predicted labels, and the function returns a one-row tibble with `.metric`, `.estimator`, and `.estimate`. The estimate is the harmonic mean of precision and recall, a number between 0 and 1.

The harmonic mean punishes extremes. A model with 1.0 precision and 0.01 recall scores 0.02, not 0.5. That property makes the F-measure useful whenever a high score requires the model to be good at both jobs at once.

F1 is the default and weights precision and recall equally. The `beta` argument tunes that weighting: values above 1 favor recall, values below 1 favor precision. Pick beta by which kind of error costs more.

[KEY INSIGHT]
**The F-measure is a compromise.** Two models with the same F1 may be precision-dominant or recall-dominant. Always report precision and recall alongside f_meas() so the trade-off is visible.

## f_meas() syntax and arguments

**The signature matches the rest of the yardstick class-metric family.** The same call works for logistic regression, random forest, xgboost, or any classifier whose predictions land in a tibble.

```r title="f_meas generic signature"
f_meas(data, truth, estimate, beta = 1, estimator = NULL,
       na_rm = TRUE, case_weights = NULL, event_level = "first", ...)
```

| Argument | Description |
|----------|-------------|
| `data` | Data frame with truth and estimate columns. |
| `truth` | Unquoted column of observed class labels (factor). |
| `estimate` | Unquoted column of predicted class labels (factor, same levels). |
| `beta` | Recall weight relative to precision. `1` = F1; `>1` favors recall; `<1` favors precision. |
| `estimator` | Multiclass averaging: `"binary"`, `"macro"`, `"macro_weighted"`, `"micro"`. Defaults to `"binary"` for two-class data, `"macro"` for multiclass. |
| `na_rm` | If `TRUE`, drop rows where either column is missing. |
| `event_level` | `"first"` or `"second"`; picks which factor level is positive. |

Both columns must be factors with identical levels. The most common mistake is passing class probabilities to `estimate`; f_meas() needs class labels, so feed `.pred_class` from `parsnip::augment()`.

## Score classifiers: five worked examples

**The examples use yardstick's built-in two_class_example data, then a multiclass tibble.** Load yardstick and inspect the bundled predictions first.

```r title="Load yardstick and inspect predictions"
library(yardstick)
library(dplyr)

data("two_class_example")
head(two_class_example, 4)
#> # A tibble: 4 x 4
#>   truth   Class1   Class2 predicted
#>   <fct>    <dbl>    <dbl> <fct>
#> 1 Class2 0.00359 0.996    Class2
#> 2 Class1 0.679   0.321    Class1
#> 3 Class2 0.111   0.889    Class2
#> 4 Class1 0.735   0.265    Class1
```

**Example 1 calls f_meas() with positional arguments.** `"Class1"` is the first factor level, so yardstick treats it as the positive class by default.

```r title="Two-class F1 score"
f_meas(two_class_example, truth, predicted)
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 f_meas  binary         0.849
```

An F1 of 0.849 sits between this classifier's precision (0.819) and recall (0.880), as the harmonic mean always will.

**Example 2 tunes the recall-precision balance with `beta`.** Switching from F1 to F2 raises the weight on recall.

```r title="F2 score: recall costs twice as much"
f_meas(two_class_example, truth, predicted, beta = 2)
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 f_meas  binary         0.867
```

A higher beta pulls the score toward recall (0.880). Use F2 for cancer screening, fraud, or any setting where missing a positive is costly.

**Example 3 flips the positive class with `event_level`.** Setting `event_level = "second"` makes `"Class2"` the positive class.

```r title="Flip the positive class"
f_meas(two_class_example, truth, predicted, event_level = "second")
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 f_meas  binary         0.843
```

The score barely moves because the classes are roughly balanced; on imbalanced data the swing is dramatic.

**Example 4 groups scoring by resample fold.** Cross-validated predictions in one tibble pair with `group_by()` to give one F1 per group.

```r title="Per-fold F1"
folded <- two_class_example |>
  mutate(fold = rep(paste0("fold", 1:5), each = 100))

folded |>
  group_by(fold) |>
  f_meas(truth = truth, estimate = predicted)
#> # A tibble: 5 x 4
#>   fold  .metric .estimator .estimate
#>   <chr> <chr>   <chr>          <dbl>
#> 1 fold1 f_meas  binary         0.857
#> 2 fold2 f_meas  binary         0.835
#> 3 fold3 f_meas  binary         0.864
#> 4 fold4 f_meas  binary         0.851
#> 5 fold5 f_meas  binary         0.836
```

**Example 5 uses the vector interface.** `f_meas_vec()` accepts two factors and returns a numeric scalar instead of a tibble.

```r title="Vector interface for quick checks"
f_meas_vec(two_class_example$truth, two_class_example$predicted)
#> [1] 0.8488889
```

[TIP]
**Bind precision, recall, and f_meas in one tibble.** `metric_set(precision, recall, f_meas)` builds a reusable function you pipe predictions into to get all three scores at once, so you never have to read F1 in isolation.

## Multiclass averaging: macro, weighted, and micro

**f_meas() handles multiclass data, but the answer depends on the averaging rule.**

```r title="Load multiclass predictions"
data("hpc_cv")
head(hpc_cv, 4)
#> # A tibble: 4 x 7
#>   obs   pred     VF      F       M       L Resample
#>   <fct> <fct> <dbl>  <dbl>   <dbl>   <dbl> <chr>
#> 1 VF    VF    0.914 0.0779 0.00848 0.000000 Fold01
#> 2 VF    VF    0.938 0.0571 0.00482 0.000000 Fold01
#> 3 VF    VF    0.947 0.0495 0.00316 0.000000 Fold01
#> 4 VF    VF    0.929 0.0653 0.00582 0.000000 Fold01
```

hpc_cv has four imbalanced classes (VF, F, M, L). Score it under each averaging mode.

```r title="Compare averaging modes"
modes <- c("macro", "macro_weighted", "micro")
lapply(modes, \(m) f_meas(hpc_cv, obs, pred, estimator = m)) |>
  bind_rows()
#> # A tibble: 3 x 3
#>   .metric .estimator     .estimate
#>   <chr>   <chr>              <dbl>
#> 1 f_meas  macro              0.534
#> 2 f_meas  macro_weighted     0.708
#> 3 f_meas  micro              0.709
```

| Estimator | What it does | When to use |
|-----------|-------------|-------------|
| `macro` | Unweighted mean of per-class F1 | Every class equally important regardless of size |
| `macro_weighted` | Mean weighted by class prevalence | Reflect the real population class mix |
| `micro` | Pool all predictions, compute one ratio | Track the global hit rate |
| `binary` | Score one positive class only | Two-class problems (default) |

The 0.18 gap between macro and macro_weighted is the imbalance signature: small classes (L, M) score lower than the large class (VF), so the unweighted mean drags the headline down. Choose macro when small classes matter to your stakeholders.

## f_meas compared with related metrics

**The F-measure is one slot in the classification scorecard.** Reach for each yardstick metric where it fits.

| Metric | Best use case | Limitation |
|--------|---------------|-----------|
| `f_meas()` | One imbalance-aware score for precision + recall | Hides the trade-off |
| `precision()` | Costly false positives (spam, fraud flags) | Ignores missed positives |
| `recall()` | Costly false negatives (cancer screening) | Ignores wasted positives |
| `accuracy()` | Balanced classes, equal error costs | Misleading on imbalanced data |
| `bal_accuracy()` | Mean per-class recall, robust to imbalance | Ignores precision |
| `pr_auc()` | Threshold-free ranking under heavy imbalance | Needs probabilities, not class labels |

A practical workflow reports precision, recall, and f_meas() together. Add `pr_auc()` whenever the threshold is still tunable; F-measure assumes it is fixed.

[NOTE]
**Coming from scikit-learn?** `yardstick::f_meas()` equals `sklearn.metrics.f1_score()` at `beta = 1` and `fbeta_score()` for other betas. The `estimator` argument maps to scikit-learn's `average`: `"macro"`, `"micro"`, `"macro_weighted"` line up with `"macro"`, `"micro"`, `"weighted"`.

## Common pitfalls

**Three small mistakes account for most f_meas() errors.**

The first is feeding probabilities instead of class labels. A probability cast to a factor produces a meaningless score. Always pull `.pred_class` from `augment()`, not `.pred_<level>`.

```r title="Fix: use the class column, not the probability column"
preds <- tibble(
  obs         = factor(c("yes", "yes", "no", "no"), levels = c("yes", "no")),
  .pred_yes   = c(0.9, 0.4, 0.3, 0.2),                       # probability
  .pred_class = factor(c("yes", "no", "no", "no"), levels = c("yes", "no"))
)
f_meas(preds, obs, .pred_class)
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 f_meas  binary         0.667
```

The second pitfall is forgetting that `beta` is asymmetric. `beta = 2` does not double the recall component; it raises the weight on recall by a factor of `beta^2` = 4. Read the F-beta definition before tuning.

The third pitfall is reporting macro F1 without checking for empty classes. If the model never predicts a class, the macro average drops to `NaN`. Switch to `estimator = "macro_weighted"` so empty classes drop by weight, or inspect `conf_mat()` to see what is missing.

[WARNING]
**A high F1 needs strong precision AND recall.** The harmonic mean is dominated by the smaller input, so F1 above 0.95 needs both above 0.91; if either is below 0.5, F1 cannot reach 0.67. Use this to sanity-check reported scores.

## Try it yourself

**Try it:** Use the built-in `two_class_example` data from yardstick. Compute F1 (the default), then compute F2 to put more weight on recall. Save the F2 result to `ex_f2`.

```r title="Your turn: F1 versus F2"
library(yardstick)
data("two_class_example")

# Try it: compute F2 score (beta = 2)
ex_f2 <- # your code here

ex_f2
#> Expected: one row, .estimator binary, .estimate near 0.87
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
library(dplyr)
ex_f2 <- two_class_example |>
  f_meas(truth = truth, estimate = predicted, beta = 2)
ex_f2
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 f_meas  binary         0.867
```

**Explanation:** `beta = 2` weights recall four times as heavily as precision (`beta^2` sets the ratio). Because this classifier already recalls more positives than it precisely predicts, F2 rises above F1.

</details>

## Related yardstick metrics

**f_meas() is one entry in the yardstick class-metric family.** Reach for these neighbors when F-measure alone is not enough:

- `precision()` and `recall()` for the two components
- `accuracy()` and `bal_accuracy()` for overall hit rate
- `kap()` and `mcc()` for chance-corrected agreement
- `pr_auc()` and `roc_auc()` for threshold-free probability rankings
- `conf_mat()` to see the full confusion matrix

See the [yardstick reference index](https://yardstick.tidymodels.org/reference/index.html) for the full set.

## FAQ

**What is the difference between f_meas() and the F1 score?**

`f_meas()` is the general F-beta function; F1 is the specific case where `beta = 1`. yardstick uses the more general name because the same function computes F1, F2, F0.5, and any other beta. When people say "F1" they mean the default call; when they say "F-measure" they may mean any beta. Set `beta` explicitly so reviewers know the weighting.

**Does f_meas() handle multiclass classification?**

Yes, with one extra decision: how to average per-class scores. yardstick defaults to `estimator = "macro"` for multiclass data, which computes F1 for each class against the rest and takes an unweighted mean. Pass `estimator = "macro_weighted"` to weight by class prevalence, or `"micro"` to pool predictions globally.

**When should I use F2 instead of F1?**

Use F2 when missing a positive costs more than a false alarm: medical screening, fraud detection, equipment failure prediction. Use F0.5 in the opposite case, where false positives are the expensive error.

**Why does f_meas return NaN on my multiclass data?**

A `NaN` F-measure means at least one class has precision or recall undefined: the model never predicted it, or the truth never contained it. Switch to `estimator = "macro_weighted"` so empty classes drop by weight, or inspect `conf_mat()` to confirm which class is missing.
