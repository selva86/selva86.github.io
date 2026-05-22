---
title: "yardstick recall() in R: Score True Positive Rate"
slug: yardstick-recall-in-R
description: "Use yardstick recall() in R to score the true positive rate of classifiers. See syntax, multiclass averaging, grouped scoring, sens() equivalence, and pitfalls."
keywords: "yardstick recall, recall function R, yardstick recall examples, true positive rate R, tidymodels recall, recall metric R, sensitivity yardstick"
mathjax: false
webr: true
date: 2026-05-22
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: yardstick recall|yardstick::recall()|true positive rate|recall metric|recall yardstick
auto_link_case_sensitive: true
target_keyword: yardstick recall
sibling_block_enabled: true
difficulty: Beginner
---

# yardstick recall() in R: Score True Positive Rate

<p class="lead">The yardstick recall() function in R returns the share of actual positives the classifier caught, accepting a tibble of truth and prediction columns and returning a tidy one-row summary you can group, average across classes, or combine with precision in a metric set.</p>

[QUICK ANSWER]
recall(df, truth, estimate)                              # basic two-class call
recall(df, truth = obs, estimate = pred)                 # named arguments
recall(df, class, .pred_class)                           # default parsnip output
df |> group_by(fold) |> recall(class, .pred_class)       # by resample
recall(df, class, .pred_class, estimator = "macro")      # multiclass macro average
recall(df, class, .pred_class, event_level = "second")   # flip positive class
recall_vec(truth_vec, pred_vec)                          # vector interface

[DECISION TREE: Is recall() the right tool?]
- score actual-positive coverage: recall(df, truth, estimate)
- score predicted-positive correctness: precision(df, truth, estimate)
- combine recall and precision: f_meas(df, truth, estimate)
- score the negative class instead: spec(df, truth, estimate)
- threshold-free ranking metric: roc_auc(df, truth, .pred_class_1)
- average per-class recall for imbalance: bal_accuracy(df, truth, estimate)

## What recall() measures

**recall() answers a single question: of every real positive case, how many did the model catch?** You pass a data frame with observed and predicted labels, and the function returns a one-row tibble with `.metric`, `.estimator`, and `.estimate`. The estimate is true positives over the sum of true positives and false negatives, a number between 0 and 1.

Recall is the headline metric whenever missing a positive is expensive. Cancer screening, fraud detection on rare events, and churn warnings all share the shape where a missed positive costs more than a noisy alert. Accuracy hides that asymmetry; recall exposes it directly.

[KEY INSIGHT]
**A model that flags everything as positive scores 1.0 recall.** Recall ignores false positives entirely, so it is trivially gameable. Always pair it with `precision()` or `f_meas()`.

## recall() syntax and arguments

**The signature follows the rest of the yardstick class-metric family.** The same call shape works for any classifier whose predictions land in a tibble.

```r title="recall generic signature"
recall(data, truth, estimate, estimator = NULL, na_rm = TRUE,
       case_weights = NULL, event_level = "first", ...)
```

| Argument | Description |
|----------|-------------|
| `data` | A data frame with truth and estimate columns. |
| `truth` | Unquoted column name of the observed class labels (a factor). |
| `estimate` | Unquoted column name of the predicted class labels (a factor with matching levels). |
| `estimator` | Averaging mode for multiclass: `"binary"`, `"macro"`, `"macro_weighted"`, or `"micro"`. Defaults to `"binary"` for two-class data and `"macro"` for multiclass. |
| `na_rm` | If `TRUE`, drop rows where either column is missing before scoring. |
| `event_level` | `"first"` or `"second"`; controls which factor level counts as the positive class. |

Both `truth` and `estimate` must be factors with identical levels. The most common slip is passing class probabilities; recall needs class labels, so feed `.pred_class` from `parsnip::augment()`, not a `.pred_<level>` column.

## Score classifiers: four worked examples

**The examples below build a two-class frame and a multiclass frame so you can run recall() against both shapes.** Start with a small two-class tibble that mimics a cancer screening dataset.

```r title="Two-class predictions tibble"
library(yardstick)
library(dplyr)

set.seed(404)
screening <- tibble(
  truth = factor(sample(c("disease", "healthy"), 200, replace = TRUE,
                        prob = c(0.20, 0.80)),
                 levels = c("disease", "healthy")),
  predicted = factor(sample(c("disease", "healthy"), 200, replace = TRUE,
                            prob = c(0.30, 0.70)),
                     levels = c("disease", "healthy"))
)
head(screening, 4)
#> # A tibble: 4 x 2
#>   truth   predicted
#>   <fct>   <fct>    
#> 1 healthy healthy  
#> 2 healthy disease  
#> 3 healthy healthy  
#> 4 disease disease  
```

**Example 1 calls recall() with positional arguments.** Because `"disease"` is the first factor level, yardstick treats it as the positive class.

```r title="Two-class recall score"
recall(screening, truth, predicted)
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 recall  binary         0.317
```

A 0.317 recall means the model caught 32 percent of real disease cases. That miss rate is the first number a clinician will challenge.

**Example 2 flips the positive class with `event_level`.** Setting `event_level = "second"` makes `"healthy"` the positive class.

```r title="Flip the positive class"
recall(screening, truth, predicted, event_level = "second")
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 recall  binary         0.713
```

Recall on the `healthy` class is higher because the model predicts `healthy` more often. Always state which class is positive when you report the number.

**Example 3 groups scoring by resample fold.** Cross-validated predictions in a single tibble pair with `group_by()` to give one recall per fold without writing a loop.

```r title="Per-fold recall"
folded <- screening |>
  mutate(fold = rep(paste0("fold", 1:5), each = 40))

folded |>
  group_by(fold) |>
  recall(truth = truth, estimate = predicted)
#> # A tibble: 5 x 4
#>   fold  .metric .estimator .estimate
#>   <chr> <chr>   <chr>          <dbl>
#> 1 fold1 recall  binary         0.286
#> 2 fold2 recall  binary         0.375
#> 3 fold3 recall  binary         0.300
#> 4 fold4 recall  binary         0.333
#> 5 fold5 recall  binary         0.300
```

**Example 4 uses the vector interface for ad-hoc checks.** `recall_vec()` accepts two factors and returns a plain numeric scalar, convenient inside `summarise()` or a quick diagnostic.

```r title="Vector interface for quick checks"
recall_vec(screening$truth, screening$predicted)
#> [1] 0.3170732
```

[TIP]
**Bundle recall with precision and f_meas in one tibble.** `metric_set(recall, precision, f_meas)` builds a reusable function you pipe predictions into to get all three scores, the minimum honest report for an imbalanced classifier.

## Multiclass averaging: macro, weighted, and micro

**recall() handles multiclass data, but the answer depends on the averaging rule.**

```r title="Multiclass prediction tibble"
set.seed(303)
multi <- tibble(
  truth = factor(sample(c("a", "b", "c"), 180, replace = TRUE,
                        prob = c(0.5, 0.3, 0.2)),
                 levels = c("a", "b", "c")),
  predicted = factor(sample(c("a", "b", "c"), 180, replace = TRUE,
                            prob = c(0.45, 0.35, 0.20)),
                     levels = c("a", "b", "c"))
)

recall(multi, truth, predicted, estimator = "macro")
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 recall  macro          0.348
```

Scoring under each averaging mode gives a useful comparison:

```r title="Compare averaging modes"
modes <- c("macro", "macro_weighted", "micro")
lapply(modes, \(m) recall(multi, truth, predicted, estimator = m)) |>
  bind_rows()
#> # A tibble: 3 x 3
#>   .metric .estimator     .estimate
#>   <chr>   <chr>              <dbl>
#> 1 recall  macro              0.348
#> 2 recall  macro_weighted     0.367
#> 3 recall  micro              0.367
```

| Estimator | What it does | When to use |
|-----------|-------------|-------------|
| `macro` | Unweighted mean of per-class recall | Treat every class as equally important, regardless of size |
| `macro_weighted` | Mean weighted by class prevalence in truth | Reflect the class mix in the real population |
| `micro` | Pool all predictions, then compute one ratio | Match the global hit rate; equals accuracy for symmetric metrics |
| `binary` | Score one positive class only | Two-class problems, set by default |

Class-imbalanced papers report `macro` recall because the rare class counts as much as the common one. Production dashboards prefer `macro_weighted` to track real traffic prevalence.

## recall vs precision vs sensitivity

**Three names show up around the recall column, and two of them are the same number.** The table below sorts out the overlap.

| Function | What it scores | Same as |
|----------|----------------|---------|
| `recall()` | True positives over actual positives | Sensitivity, true positive rate |
| `sens()` | True positives over actual positives | recall (yardstick aliases them) |
| `precision()` | True positives over predicted positives | Positive predictive value |
| `spec()` | True negatives over actual negatives | Specificity, true negative rate |
| `f_meas()` | Harmonic mean of precision and recall | F1 score |
| `bal_accuracy()` | Mean of recall and specificity | Balanced accuracy |

`recall()` and `sens()` return identical numbers. Both honor the same `event_level` argument and both ship with vector cousins (`recall_vec()`, `sens_vec()`). Use `recall` in ML reports, `sens` in clinical reports, and your readers will not have to translate.

[NOTE]
**Coming from scikit-learn?** `yardstick::recall()` is the equivalent of `sklearn.metrics.recall_score()`. The `estimator` argument maps directly to scikit-learn's `average` parameter: `"macro"`, `"micro"`, and `"macro_weighted"` line up with `average="macro"`, `"micro"`, and `"weighted"`.

## Common pitfalls

**Three small mistakes account for most recall() errors.**

The first is reporting high recall without checking the prediction mix. A model that labels every row positive scores 1.0 recall and zero precision; the score looks great but means the classifier is useless. Always pair recall with precision before claiming progress.

The second is forgetting to set `event_level` when the rare class is the second factor level. The order of `levels()` decides which class is positive, and a flipped order can quietly invert the metric. Confirm with `levels(screening$truth)` before scoring.

```r title="Fix: pin levels so positive class is unambiguous"
preds <- tibble(
  truth     = factor(c("yes", "yes", "no", "no", "yes"), levels = c("yes", "no")),
  predicted = factor(c("yes", "no",  "no", "no", "yes"), levels = c("yes", "no"))
)
levels(preds$truth)
#> [1] "yes" "no"
recall(preds, truth, predicted)
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 recall  binary         0.667
```

The third pitfall is divide-by-zero on multiclass macro averaging. If a class has zero positives in the test set, that class contributes `NaN` and the macro average drops to `NaN`. Switch to `estimator = "macro_weighted"` so empty classes drop out by weight, or stratify the resample.

[WARNING]
**Recall trades off against precision; you cannot maximize both for free.** Pushing the classification threshold down catches more positives (recall up) but adds false alarms (precision down). Tune the threshold against the cost ratio of your domain, not against a single score.

## Try it yourself

**Try it:** Use the built-in `two_class_example` data from yardstick. Compute the recall score with the default positive class, then compute it again with the positive class flipped via `event_level = "second"`. Save the second result to `ex_recall_alt`.

```r title="Your turn: flip the positive class"
library(yardstick)
data("two_class_example")

# Try it: recall with flipped event level
ex_recall_alt <- # your code here

ex_recall_alt
#> Expected: one row, .estimator binary, .estimate near 0.79
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
library(dplyr)
ex_recall_alt <- two_class_example |>
  recall(truth = truth, estimate = predicted, event_level = "second")
ex_recall_alt
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 recall  binary         0.793
```

**Explanation:** `event_level = "second"` treats `Class2` as the positive class, so recall now measures how many actual `Class2` cases the model caught. The default `"first"` would have scored `Class1` recovery instead.

</details>

## Related yardstick metrics

**recall() is one entry in the yardstick class-metric family.** Reach for these when recall alone is not enough:

- `precision()` for predicted-positive correctness
- `f_meas()` for the harmonic mean of precision and recall
- `sens()` for the clinical alias of recall
- `spec()` for the negative-class catch rate
- `bal_accuracy()` averages recall and specificity, robust to imbalance
- `roc_auc()` for threshold-free probability rankings
- `conf_mat()` to see the full confusion matrix

For the full set, see the [yardstick reference index](https://yardstick.tidymodels.org/reference/index.html).

## FAQ

**Is recall() the same as sensitivity in yardstick?**

Yes, the two functions return identical numbers. `yardstick::recall()` and `yardstick::sens()` both compute true positives over actual positives, expose the same `event_level` and `estimator` arguments, and ship with vector cousins (`recall_vec()` and `sens_vec()`). The two names exist because the machine-learning literature settled on "recall" while the medical literature settled on "sensitivity." Pick whichever your audience knows.

**Why does recall() return a tibble instead of a number?**

The tidy return shape is the defining yardstick convention. Every metric returns the same three columns: `.metric`, `.estimator`, and `.estimate`. That uniformity lets you `bind_rows()` multiple metric calls or chain `group_by() |> metric()` without reshape code. For the scalar, call `recall_vec()` instead.

**How is recall different from accuracy?**

`accuracy()` asks how many of all predictions were correct. `recall()` asks how many of the actual positives were caught, ignoring the negative class entirely. On imbalanced data they diverge: a model that always predicts the majority class can hit 95 percent accuracy while scoring near-zero recall on the rare class. Report both whenever missing positives is costly.

**Why does recall return NaN on my multiclass data?**

A `NaN` recall means the test set contains zero true cases of at least one class, so the per-class recall divides by zero. Switch to `estimator = "macro_weighted"` to drop empty classes by weight, or stratify your resample so every class is represented before re-running the metric.
