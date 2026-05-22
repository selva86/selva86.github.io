---
title: "yardstick spec() in R: Score True Negative Rate"
slug: yardstick-spec-in-R
description: "Use yardstick spec() in R to score the true negative rate of classifiers. See syntax, multiclass averaging, grouped scoring, sens() pairing, and pitfalls."
keywords: "yardstick spec, spec function R, yardstick specificity, true negative rate R, tidymodels specificity, specificity metric R, yardstick spec examples"
mathjax: false
webr: true
date: 2026-05-22
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: yardstick spec|yardstick::spec()|specificity metric|true negative rate|spec yardstick
auto_link_case_sensitive: true
target_keyword: yardstick spec
sibling_block_enabled: true
difficulty: Beginner
---

# yardstick spec() in R: Score True Negative Rate

<p class="lead">The yardstick spec() function in R returns the share of actual negatives the classifier correctly rejected, accepting a tibble of truth and prediction columns and returning a tidy one-row summary you can group, average across classes, or pair with sens() in a metric set.</p>

[QUICK ANSWER]
spec(df, truth, estimate)                              # basic two-class call
spec(df, truth = obs, estimate = pred)                 # named arguments
spec(df, class, .pred_class)                           # default parsnip output
df |> group_by(fold) |> spec(class, .pred_class)       # by resample
spec(df, class, .pred_class, estimator = "macro")      # multiclass macro average
spec(df, class, .pred_class, event_level = "second")   # flip positive class
spec_vec(truth_vec, pred_vec)                          # vector interface

[DECISION TREE: Is spec() the right tool?]
- score actual-negative rejection: spec(df, truth, estimate)
- score actual-positive coverage: sens(df, truth, estimate)
- score predicted-negative correctness: npv(df, truth, estimate)
- average sens and spec for imbalance: bal_accuracy(df, truth, estimate)
- harmonic mean with precision: f_meas(df, truth, estimate)
- threshold-free ranking metric: roc_auc(df, truth, .pred_class_1)
- regression model, not classification: rmse(df, truth, estimate)

## What spec() measures

**spec() answers a single question: of every real negative case, how many did the model correctly reject?** You pass a data frame with observed and predicted labels, and the function returns a one-row tibble with `.metric`, `.estimator`, and `.estimate`. The estimate is true negatives over the sum of true negatives and false positives, a number between 0 and 1.

Specificity is the headline metric whenever a false positive is expensive. Spam filters, fraud alerts, and confirmatory drug tests all share the shape where wrongly flagging a clean case costs trust or a needless follow-up. Accuracy hides that asymmetry; spec() exposes it directly.

[KEY INSIGHT]
**A model that flags nothing as positive scores 1.0 specificity.** spec() ignores false negatives entirely, so it is trivially gamed by predicting the majority class. Always pair it with `sens()`.

## spec() syntax and arguments

**The signature mirrors the rest of the yardstick class-metric family.** The same shape works for any classifier whose predictions land in a tibble.

```r title="spec generic signature"
spec(data, truth, estimate, estimator = NULL, na_rm = TRUE,
     case_weights = NULL, event_level = "first", ...)
```

| Argument | Description |
|----------|-------------|
| `data` | A data frame with truth and estimate columns. |
| `truth` | Unquoted column name of the observed class labels (a factor). |
| `estimate` | Unquoted column name of the predicted class labels (a factor with matching levels). |
| `estimator` | Averaging mode for multiclass: `"binary"`, `"macro"`, `"macro_weighted"`, or `"micro"`. Defaults to `"binary"` for two-class data and `"macro"` for multiclass. |
| `na_rm` | If `TRUE`, drop rows where either column is missing before scoring. |
| `event_level` | `"first"` or `"second"`; controls which factor level counts as the positive class. The negative class is then whichever level is not positive. |

Both `truth` and `estimate` must be factors with identical levels. The common slip is passing class probabilities; spec() needs labels, so feed `.pred_class` from `parsnip::augment()`, not a `.pred_<level>` column.

## Score classifiers: four worked examples

**The examples below build a two-class frame and a multiclass frame so you can run spec() against both shapes.** Start with a small spam-filter tibble where flagging a real email as spam is the costly mistake.

```r title="Two-class predictions tibble"
library(yardstick)
library(dplyr)

set.seed(404)
inbox <- tibble(
  truth = factor(sample(c("spam", "ham"), 200, replace = TRUE,
                        prob = c(0.20, 0.80)),
                 levels = c("spam", "ham")),
  predicted = factor(sample(c("spam", "ham"), 200, replace = TRUE,
                            prob = c(0.30, 0.70)),
                     levels = c("spam", "ham"))
)
head(inbox, 4)
#> # A tibble: 4 x 2
#>   truth predicted
#>   <fct> <fct>    
#> 1 ham   ham      
#> 2 ham   spam     
#> 3 ham   ham      
#> 4 spam  spam     
```

**Example 1 calls spec() with positional arguments.** Because `"spam"` is the first factor level, yardstick treats it as positive, so spec() reports the fraction of real `ham` kept out of the spam folder.

```r title="Two-class specificity score"
spec(inbox, truth, predicted)
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 spec    binary         0.713
```

A 0.713 specificity means the filter correctly accepted 71 percent of real emails. The other 29 percent landed in spam by mistake, a false-positive rate users notice fast.

**Example 2 flips the positive class with `event_level`.** Setting `event_level = "second"` makes `"ham"` positive, so spec() now scores how well the model rejects real spam.

```r title="Flip the positive class"
spec(inbox, truth, predicted, event_level = "second")
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 spec    binary         0.317
```

Specificity drops to 0.317 because the model predicts `spam` for many real ham messages. Always state which class is positive when you report the number.

**Example 3 groups scoring by resample fold.** Cross-validated predictions pair with `group_by()` to give one specificity per fold without writing a loop.

```r title="Per-fold specificity"
folded <- inbox |>
  mutate(fold = rep(paste0("fold", 1:5), each = 40))

folded |>
  group_by(fold) |>
  spec(truth = truth, estimate = predicted)
#> # A tibble: 5 x 4
#>   fold  .metric .estimator .estimate
#>   <chr> <chr>   <chr>          <dbl>
#> 1 fold1 spec    binary         0.703
#> 2 fold2 spec    binary         0.750
#> 3 fold3 spec    binary         0.700
#> 4 fold4 spec    binary         0.688
#> 5 fold5 spec    binary         0.727
```

**Example 4 uses the vector interface for ad-hoc checks.** `spec_vec()` accepts two factors and returns a scalar, handy inside `summarise()` or a diagnostic.

```r title="Vector interface for quick checks"
spec_vec(inbox$truth, inbox$predicted)
#> [1] 0.7125
```

[TIP]
**Bundle spec with sens and bal_accuracy.** `metric_set(sens, spec, bal_accuracy)` returns a reusable function that scores all three at once, the minimum honest report for an imbalanced classifier.

## Multiclass averaging: macro, weighted, and micro

**spec() handles multiclass data, but the answer depends on the averaging rule.** yardstick computes specificity per class (treating each in turn as positive) and combines the values.

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

spec(multi, truth, predicted, estimator = "macro")
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 spec    macro          0.674
```

Scoring under each averaging mode gives a useful comparison:

```r title="Compare averaging modes"
modes <- c("macro", "macro_weighted", "micro")
lapply(modes, \(m) spec(multi, truth, predicted, estimator = m)) |>
  bind_rows()
#> # A tibble: 3 x 3
#>   .metric .estimator     .estimate
#>   <chr>   <chr>              <dbl>
#> 1 spec    macro              0.674
#> 2 spec    macro_weighted     0.683
#> 3 spec    micro              0.683
```

| Estimator | What it does | When to use |
|-----------|-------------|-------------|
| `macro` | Unweighted mean of per-class specificity | Treat every class as equally important, regardless of size |
| `macro_weighted` | Mean weighted by class prevalence in truth | Reflect the class mix in the real population |
| `micro` | Pool all predictions, then compute one ratio | Match the global true-negative rate across pooled outcomes |
| `binary` | Score one positive class only | Two-class problems, set by default |

Imbalanced studies often report `macro` specificity so a rare class counts equally. Production dashboards prefer `macro_weighted` to track real traffic prevalence.

## spec vs sens vs precision

**Three confusion-matrix metrics sit around specificity; the right comparison depends on which side of the matrix matters.** The table sorts the overlap.

| Function | What it scores | Same as |
|----------|----------------|---------|
| `spec()` | True negatives over actual negatives | Specificity, true negative rate |
| `sens()` | True positives over actual positives | Sensitivity, recall, true positive rate |
| `precision()` | True positives over predicted positives | Positive predictive value (PPV) |
| `npv()` | True negatives over predicted negatives | Negative predictive value |
| `bal_accuracy()` | Mean of sens and spec | Balanced accuracy |
| `roc_auc()` | Ranking over (1 - specificity, sensitivity) | Area under the ROC curve |

`spec()` and `sens()` are the natural pair: spec scores the negative class, sens scores the positive class, and ROC curves trace their trade-off. Do not confuse spec() with npv(): spec conditions on truth, npv conditions on the prediction.

[NOTE]
**Coming from scikit-learn?** scikit-learn has no direct `specificity_score`. The equivalent is `recall_score(y_true, y_pred, pos_label=<negative class>)`, or compute it from `confusion_matrix()`. The `estimator` argument maps to scikit-learn's `average`: `"macro"`, `"micro"`, and `"macro_weighted"` align with `"macro"`, `"micro"`, and `"weighted"`.

## Common pitfalls

**Three small mistakes account for most spec() errors.**

The first is reporting high specificity without checking sensitivity. A model that calls nothing positive scores 1.0 specificity and zero sensitivity, looks great, and never raises an alarm. Always pair specificity with `sens()` before claiming progress.

The second is forgetting to set `event_level` when the rare class is the second factor level. The order of `levels()` decides which class is positive, and a flipped order silently inverts the negative class. Confirm with `levels(inbox$truth)` before scoring.

```r title="Fix: pin levels so positive class is unambiguous"
preds <- tibble(
  truth     = factor(c("yes", "yes", "no", "no", "yes"), levels = c("yes", "no")),
  predicted = factor(c("yes", "no",  "no", "no", "yes"), levels = c("yes", "no"))
)
levels(preds$truth)
#> [1] "yes" "no"
spec(preds, truth, predicted)
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 spec    binary         1.000
```

The third pitfall is treating spec() as the inverse of recall on the same class. Specificity conditions on negative truth; recall on positive truth. They share a denominator only when you flip the positive class.

[WARNING]
**Specificity trades off against sensitivity; you cannot maximize both for free.** Raising the threshold rejects more negatives (spec up) but rejects more positives too (sens down). Tune against the cost ratio of your domain, not a single score.

## Try it yourself

**Try it:** Use the built-in `two_class_example` data from yardstick. Compute the specificity score with the default positive class, then compute it again with the positive class flipped via `event_level = "second"`. Save the second result to `ex_spec_alt`.

```r title="Your turn: flip the positive class"
library(yardstick)
data("two_class_example")

# Try it: spec with flipped event level
ex_spec_alt <- # your code here

ex_spec_alt
#> Expected: one row, .estimator binary, .estimate near 0.88
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
library(dplyr)
ex_spec_alt <- two_class_example |>
  spec(truth = truth, estimate = predicted, event_level = "second")
ex_spec_alt
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 spec    binary         0.875
```

**Explanation:** `event_level = "second"` treats `Class2` as positive, so specificity now scores the rejection rate of real `Class1` cases. The default `"first"` would have scored real-`Class2` rejection instead.

</details>

## Related yardstick metrics

**spec() is one entry in the yardstick class-metric family.** Reach for these when specificity alone is not enough:

- `sens()` for the positive-class catch rate, the natural counterpart to spec
- `bal_accuracy()` averages sens and spec, robust to imbalance
- `npv()` for predicted-negative correctness
- `roc_auc()` for threshold-free rankings across the sens, spec trade-off
- `conf_mat()` to see the full confusion matrix

For the full set, see the [yardstick reference index](https://yardstick.tidymodels.org/reference/index.html).

## FAQ

**Is spec() the same as specificity in yardstick?**

Yes, `spec()` and `specificity()` are aliases that return identical numbers. Both compute true negatives over actual negatives, expose the same `event_level` and `estimator` arguments, and ship with vector cousins (`spec_vec()`, `specificity_vec()`). The short alias mirrors `sens()`; the long form reads better in clinical reports.

**Why does spec() return a tibble instead of a number?**

The tidy return shape is the defining yardstick convention. Every metric returns the same three columns: `.metric`, `.estimator`, and `.estimate`. That uniformity lets you `bind_rows()` multiple metric calls or chain `group_by() |> metric()` without reshape code. For the scalar, call `spec_vec()` instead.

**How is spec() different from precision?**

`precision()` asks how many predicted positives were correct (TP / predicted positives). `spec()` asks how many actual negatives were correctly rejected (TN / actual negatives). They condition on different quantities: precision conditions on the prediction, specificity on the truth. Report both whenever false positives are costly.

**Why does spec() return NaN on my multiclass data?**

A `NaN` specificity means at least one class has zero true negatives, so the per-class spec divides by zero. It usually shows up when a class has very small support. Switch to `estimator = "macro_weighted"` to drop empty classes by weight, or stratify your resample.
