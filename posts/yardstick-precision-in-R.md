---
title: "yardstick precision() in R: Score Positive Predictive Value"
slug: yardstick-precision-in-R
description: "Use yardstick precision() in R to score the positive predictive value of classifiers. See syntax, multiclass averaging, grouped scoring, and common pitfalls."
keywords: "yardstick precision, precision function R, yardstick precision examples, positive predictive value R, tidymodels precision, precision metric R, precision yardstick tidymodels"
mathjax: false
webr: true
date: 2026-05-22
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: yardstick precision|yardstick::precision()|positive predictive value|precision metric|precision yardstick
auto_link_case_sensitive: true
target_keyword: yardstick precision
sibling_block_enabled: true
difficulty: Beginner
---

# yardstick precision() in R: Score Positive Predictive Value

<p class="lead">The yardstick precision() function in R returns the share of predicted positives that were correct, accepting a tibble of truth and prediction columns and returning a tidy one-row summary you can group, average across classes, or feed into a metric set.</p>

[QUICK ANSWER]
precision(df, truth, estimate)                              # basic two-class call
precision(df, truth = obs, estimate = pred)                 # named arguments
precision(df, class, .pred_class)                           # default parsnip output
df |> group_by(fold) |> precision(class, .pred_class)       # by resample
precision(df, class, .pred_class, estimator = "macro")      # multiclass macro average
precision(df, class, .pred_class, event_level = "second")   # flip positive class
precision_vec(truth_vec, pred_vec)                          # vector interface

[DECISION TREE: Is precision() the right tool?]
- score predicted-positive correctness: precision(df, truth, estimate)
- score actual-positive coverage: recall(df, truth, estimate)
- combine precision and recall: f_meas(df, truth, estimate)
- score overall correctness: accuracy(df, truth, estimate)
- rank by probability not class: pr_auc(df, truth, .pred_class_1)
- regression model, not classification: rmse(df, truth, estimate)

## What precision() measures

**precision() answers a single question: when the model predicts positive, how often is it right?** You pass a data frame with observed labels and predicted labels, and the function returns a one-row tibble with `.metric`, `.estimator`, and `.estimate`. The estimate is true positives over the sum of true positives and false positives, a number between 0 and 1.

Precision is the headline metric whenever false positives are expensive. Spam filters, fraud flags, and medical screening referrals all share the shape where a noisy positive wastes time, money, or trust. Accuracy hides that asymmetry; precision exposes it.

Precision is not symmetric with recall. A model that predicts positive once can score 1.0 while missing every other positive case. Always pair it with `recall()` or `f_meas()`.

[KEY INSIGHT]
**Precision is per-class by definition.** For multiclass problems yardstick computes precision against one positive class and averages across the rest. The averaging mode you pick (`binary`, `macro`, `macro_weighted`, or `micro`) changes the number, so always state it.

## precision() syntax and arguments

**The signature matches the rest of the yardstick class-metric family.** The same call shape works for logistic regression, random forest, xgboost, or any classifier whose predictions land in a tibble.

```r title="precision generic signature"
precision(data, truth, estimate, estimator = NULL, na_rm = TRUE,
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

Both `truth` and `estimate` must be factors with identical levels. The most common mistake is passing class probabilities to `estimate`; precision needs class labels, so feed the `.pred_class` column from `parsnip::augment()`.

## Score classifiers: four worked examples

**The examples below build a two-class frame, then a multiclass frame, so you can run precision() against both shapes.** First, load yardstick and create a small two-class prediction tibble.

```r title="Two-class predictions tibble"
library(yardstick)
library(dplyr)

set.seed(101)
two_class <- tibble(
  obs = factor(sample(c("spam", "ham"), 100, replace = TRUE, prob = c(0.30, 0.70)),
               levels = c("spam", "ham")),
  pred = factor(sample(c("spam", "ham"), 100, replace = TRUE, prob = c(0.25, 0.75)),
                levels = c("spam", "ham"))
)
head(two_class, 4)
#> # A tibble: 4 x 2
#>   obs   pred
#>   <fct> <fct>
#> 1 ham   ham
#> 2 ham   ham
#> 3 spam  ham
#> 4 ham   ham
```

**Example 1 calls precision() with positional arguments.** Because `"spam"` is the first factor level, yardstick treats it as the positive class.

```r title="Two-class precision score"
precision(two_class, obs, pred)
#> # A tibble: 1 x 3
#>   .metric   .estimator .estimate
#>   <chr>     <chr>          <dbl>
#> 1 precision binary         0.286
```

A 0.286 estimate means about 29 percent of rows the model labeled `spam` were actually `spam`; the rest were false alarms, exactly what a spam filter needs to push down.

**Example 2 flips the positive class with `event_level`.** Setting `event_level = "second"` makes `"ham"` the positive class, useful when the rare event is the second factor level.

```r title="Flip the positive class"
precision(two_class, obs, pred, event_level = "second")
#> # A tibble: 1 x 3
#>   .metric   .estimator .estimate
#>   <chr>     <chr>          <dbl>
#> 1 precision binary         0.760
```

Precision shifts dramatically between the two classes. Report both, or pick the one that matches the cost you care about.

**Example 3 groups scoring by resample fold.** Cross-validated predictions in a single tibble pair with `group_by()` to give one score per group.

```r title="Per-fold precision"
folded <- two_class |>
  mutate(fold = rep(paste0("fold", 1:5), each = 20))

folded |>
  group_by(fold) |>
  precision(truth = obs, estimate = pred)
#> # A tibble: 5 x 4
#>   fold  .metric   .estimator .estimate
#>   <chr> <chr>     <chr>          <dbl>
#> 1 fold1 precision binary         0.333
#> 2 fold2 precision binary         0.250
#> 3 fold3 precision binary         0.200
#> 4 fold4 precision binary         0.400
#> 5 fold5 precision binary         0.250
```

**Example 4 uses the vector interface for ad-hoc checks.** `precision_vec()` accepts two factors and returns a plain numeric scalar instead of a tibble.

```r title="Vector interface for quick checks"
precision_vec(two_class$obs, two_class$pred)
#> [1] 0.2857143
```

[TIP]
**Bind precision with other metrics in one tibble.** `metric_set(precision, recall, f_meas)` builds a reusable function you pipe predictions into to get all three scores at once.

## Multiclass averaging: macro, weighted, and micro

**precision() handles multiclass data, but the answer depends on the averaging rule.** Different rules suit different reporting goals.

```r title="Multiclass prediction tibble"
set.seed(202)
multi <- tibble(
  obs = factor(sample(c("a", "b", "c"), 150, replace = TRUE,
                      prob = c(0.5, 0.3, 0.2)),
               levels = c("a", "b", "c")),
  pred = factor(sample(c("a", "b", "c"), 150, replace = TRUE,
                       prob = c(0.4, 0.4, 0.2)),
                levels = c("a", "b", "c"))
)

precision(multi, obs, pred, estimator = "macro")
#> # A tibble: 1 x 3
#>   .metric   .estimator .estimate
#>   <chr>     <chr>          <dbl>
#> 1 precision macro          0.412
```

The same tibble scored under each averaging mode gives a useful comparison:

```r title="Compare averaging modes"
modes <- c("macro", "macro_weighted", "micro")
lapply(modes, \(m) precision(multi, obs, pred, estimator = m)) |>
  bind_rows()
#> # A tibble: 3 x 3
#>   .metric   .estimator     .estimate
#>   <chr>     <chr>              <dbl>
#> 1 precision macro              0.412
#> 2 precision macro_weighted     0.439
#> 3 precision micro              0.440
```

| Estimator | What it does | When to use |
|-----------|-------------|-------------|
| `macro` | Unweighted mean of per-class precision | Treat every class as equally important, regardless of size |
| `macro_weighted` | Mean weighted by class prevalence in truth | Reflect the class mix in the real population |
| `micro` | Pool all predictions, then compute one ratio | Match the global hit rate; equals accuracy for symmetric metrics |
| `binary` | Score one positive class only | Two-class problems, set by default |

Multiclass papers usually report `macro` precision because small classes count as much as large ones. Production dashboards prefer `macro_weighted` because it tracks real traffic prevalence.

## precision compared with related metrics

**Precision is one of three numbers you usually need to see together.** The table below summarizes when to reach for each yardstick metric.

| Metric | Best use case | Limitation |
|--------|---------------|-----------|
| `precision()` | Costly false positives, e.g. spam, fraud flags | Says nothing about missed positives |
| `recall()` | Costly false negatives, e.g. cancer screening | Says nothing about wasted positives |
| `f_meas()` | Need a single imbalance-aware score | Equal precision-recall weighting may not match your costs |
| `accuracy()` | Balanced classes, equal error costs | Misleading on imbalanced data |
| `pr_auc()` | Threshold-free ranking under heavy imbalance | Requires probability predictions, not class labels |

A practical workflow reports precision, recall, and either `f_meas()` or `pr_auc()` together. Precision alone is easy to game.

[NOTE]
**Coming from scikit-learn?** `yardstick::precision()` is the equivalent of `sklearn.metrics.precision_score()`. The `estimator` argument maps directly to scikit-learn's `average` parameter: `"macro"`, `"micro"`, and `"macro_weighted"` line up with `average="macro"`, `"micro"`, and `"weighted"`.

## Common pitfalls

**Three small mistakes account for most precision() errors.**

The first is feeding probabilities instead of class labels. yardstick errors on numeric input, but a probability column cast to a factor on the fly produces a meaningless score. Always pull `.pred_class` from `augment()`, not `.pred_<level>`.

```r title="Fix: use the class column, not the probability column"
preds <- tibble(
  obs        = factor(c("yes", "yes", "no", "no"), levels = c("yes", "no")),
  .pred_yes  = c(0.9, 0.4, 0.3, 0.2),                        # probability
  .pred_class = factor(c("yes", "no", "no", "no"), levels = c("yes", "no"))
)
precision(preds, obs, .pred_class)
#> # A tibble: 1 x 3
#>   .metric   .estimator .estimate
#>   <chr>     <chr>          <dbl>
#> 1 precision binary             1
```

The second pitfall is forgetting to set `event_level` when the rare class is the second factor level. Precision swings massively when you flip the positive class; never compare scores without confirming both runs used the same level.

The third pitfall is divide-by-zero on multiclass macro averaging. If the model never predicts a class, that class contributes `NaN` and the macro average drops to `NaN`. Switch to `estimator = "macro_weighted"` so empty classes drop out by weight.

[WARNING]
**A single confident prediction can hit 1.0 precision.** If your model is barely making positive predictions, precision is meaningless on its own. Always pair it with `recall()` or check `sum(estimate == positive_class)` before celebrating a high score.

## Try it yourself

**Try it:** Use the built-in `two_class_example` data from yardstick. Compute the precision score, then compute it again with the positive class flipped via `event_level = "second"`. Save the second result to `ex_precision_alt`.

```r title="Your turn: flip the positive class"
library(yardstick)
data("two_class_example")

# Try it: precision with flipped event level
ex_precision_alt <- # your code here

ex_precision_alt
#> Expected: one row, .estimator binary, .estimate near 0.84
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
library(dplyr)
ex_precision_alt <- two_class_example |>
  precision(truth = truth, estimate = predicted, event_level = "second")
ex_precision_alt
#> # A tibble: 1 x 3
#>   .metric   .estimator .estimate
#>   <chr>     <chr>          <dbl>
#> 1 precision binary         0.838
```

**Explanation:** `event_level = "second"` treats `Class2` as the positive class, so precision now measures how many of the model's `Class2` predictions were correct. The default `"first"` would have scored `Class1` predictions instead.

</details>

## Related yardstick metrics

**precision() is one entry in the yardstick class-metric family.** Reach for these neighbors when precision alone is not enough:

- `recall()` for the symmetric partner: actual-positive coverage
- `f_meas()` for a single harmonic mean of precision and recall
- `bal_accuracy()` averages per-class recall, robust to imbalance
- `kap()` and `mcc()` for chance-corrected agreement scores
- `pr_auc()` and `roc_auc()` for threshold-free probability rankings
- `conf_mat()` to see the full confusion matrix behind every number

For the full set, see the [yardstick reference index](https://yardstick.tidymodels.org/reference/index.html).

## FAQ

**Why does precision() return a tibble instead of a number?**

The tidy-data return shape is the defining yardstick convention. Every metric, from `precision()` to `roc_auc()`, returns the same three columns: `.metric`, `.estimator`, and `.estimate`. That uniformity lets you `bind_rows()` multiple metric calls or chain `group_by() |> metric()` without writing reshape code. When you want the scalar, call `precision_vec()` instead, which returns a plain number.

**Does precision() handle multiclass classification?**

Yes, with one extra decision: how to average the per-class scores. yardstick defaults to `estimator = "macro"` for multiclass data, which computes precision for each class against the rest and takes an unweighted mean. Pass `estimator = "macro_weighted"` to weight by class prevalence, or `"micro"` to pool predictions globally before scoring. Each mode is documented in the syntax table above.

**What is the difference between precision() and accuracy()?**

`accuracy()` asks how many of all predictions were correct. `precision()` asks how many of the predicted-positive predictions were correct, ignoring the negative class entirely. On imbalanced data the two diverge sharply: a model that always predicts the majority can hit high accuracy while scoring near-zero precision on the minority class. Report both whenever class costs are asymmetric.

**Why does precision return NaN on my multiclass data?**

A `NaN` precision means your model never predicted at least one of the classes, so the per-class precision divides by zero. Switch to `estimator = "macro_weighted"` to drop empty classes by weight, or inspect `conf_mat()` to confirm which class the model is ignoring.
