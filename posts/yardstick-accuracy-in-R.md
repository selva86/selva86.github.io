---
title: "yardstick accuracy() in R: Score Classification Models"
slug: yardstick-accuracy-in-R
description: "Use yardstick accuracy() in R to score classification models with a tidy interface. See syntax, grouped scoring, multiclass averaging, and common pitfalls."
keywords: "yardstick accuracy, accuracy function R, yardstick accuracy examples, classification accuracy R, tidymodels accuracy, accuracy metric R, accuracy yardstick tidymodels"
mathjax: false
webr: true
date: 2026-05-22
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: accuracy()|yardstick accuracy|yardstick::accuracy()|classification accuracy|accuracy metric
auto_link_case_sensitive: true
target_keyword: yardstick accuracy
sibling_block_enabled: true
difficulty: Beginner
---

# yardstick accuracy() in R: Score Classification Models

<p class="lead">The yardstick accuracy() function in R returns the proportion of correctly classified rows for a fitted classification model, accepting a tibble of truth and prediction columns and returning a tidy one-row summary you can group, average, or chart.</p>

[QUICK ANSWER]
accuracy(df, truth, estimate)                    # basic two-class call
accuracy(df, truth = obs, estimate = pred)       # named arguments
accuracy(df, class, .pred_class)                 # default parsnip output
df |> group_by(fold) |> accuracy(class, .pred_class)   # by resample
accuracy(df, class, .pred_class, na_rm = TRUE)   # drop missing rows
accuracy_vec(truth_vec, pred_vec)                # vector interface
accuracy(df, class, .pred_class, event_level = "second")  # flip positive class

[DECISION TREE: Is accuracy() the right tool?]
- overall classification correctness: accuracy(df, truth, estimate)
- score is misleading on imbalanced data: bal_accuracy(df, truth, estimate)
- need probabilities not classes: roc_auc(df, truth, .pred_class_1)
- multi-metric report in one call: metrics(df, truth, estimate)
- per-class precision or recall: precision(df, truth, estimate)
- regression model, not classification: rmse(df, truth, estimate)

## What accuracy() measures

**accuracy() counts how many predictions match the truth and divides by the total rows.** You pass a data frame containing both the observed labels and the predicted labels, and the function returns a one-row tibble with three columns: `.metric`, `.estimator`, and `.estimate`. The estimate is a number between 0 and 1 where 1 means every row was classified correctly.

The function works for two-class and multiclass problems out of the box. For multiclass cases it ignores per-class weighting, since accuracy is, by definition, a global score. If you need class-balanced reporting, reach for `bal_accuracy()` or use `precision()` and `recall()` per class.

Accuracy is the right headline metric when classes are roughly balanced and every error costs the same. It becomes misleading the moment one class dominates the data, because a model that always predicts the majority can still score high.

[KEY INSIGHT]
**Accuracy treats every error as equal.** Use it as a quick sanity check, then pair it with class-aware metrics when costs differ between false positives and false negatives.

## accuracy() syntax and arguments

**The signature mirrors every other yardstick class metric.** That means the same call shape works whether you score logistic regression, a random forest, or a neural net.

```r title="accuracy generic signature"
accuracy(data, truth, estimate, na_rm = TRUE, case_weights = NULL, event_level = "first", ...)
```

| Argument | Description |
|----------|-------------|
| `data` | A data frame with the truth and estimate columns. |
| `truth` | Unquoted column name of the observed class labels (a factor). |
| `estimate` | Unquoted column name of the predicted class labels (a factor with matching levels). |
| `na_rm` | If `TRUE`, drop rows where either column is missing before scoring. |
| `case_weights` | Optional column of row weights, useful for survey or class-rebalanced data. |
| `event_level` | `"first"` or `"second"`; controls which factor level counts as the positive class for two-class problems. |

Truth and estimate must both be factors with identical levels. The most common error you will hit is passing a character vector or a factor with mismatched levels, both covered in the pitfalls section.

## Score classification models: four examples

**The examples below build a small two-class data set, then a multiclass one, so you can run accuracy() against both shapes.** First, load yardstick and create a simple two-class prediction frame.

```r title="Two-class predictions tibble"
library(yardstick)
library(dplyr)

set.seed(42)
two_class <- tibble(
  obs = factor(sample(c("yes", "no"), 80, replace = TRUE, prob = c(0.55, 0.45))),
  pred = factor(sample(c("yes", "no"), 80, replace = TRUE, prob = c(0.50, 0.50)),
                levels = c("yes", "no"))
)
two_class$obs <- factor(two_class$obs, levels = c("yes", "no"))
head(two_class, 4)
#> # A tibble: 4 x 2
#>   obs   pred
#>   <fct> <fct>
#> 1 no    yes
#> 2 yes   no
#> 3 yes   yes
#> 4 yes   yes
```

**Example 1 calls accuracy() with positional arguments.** The function picks up the truth and estimate columns by position and returns the tidy summary.

```r title="Two-class accuracy score"
accuracy(two_class, obs, pred)
#> # A tibble: 1 x 3
#>   .metric  .estimator .estimate
#>   <chr>    <chr>          <dbl>
#> 1 accuracy binary         0.525
```

The `.estimator` column reports `binary` because yardstick detected exactly two factor levels. For multiclass data it will switch to `multiclass`.

**Example 2 scores a multiclass setup with named arguments.** Named arguments are clearer when the truth and estimate columns sit next to other features.

```r title="Multiclass accuracy score"
set.seed(7)
multi <- tibble(
  obs = factor(sample(c("a", "b", "c"), 120, replace = TRUE)),
  pred = factor(sample(c("a", "b", "c"), 120, replace = TRUE),
                levels = c("a", "b", "c"))
)
multi$obs <- factor(multi$obs, levels = c("a", "b", "c"))

accuracy(multi, truth = obs, estimate = pred)
#> # A tibble: 1 x 3
#>   .metric  .estimator .estimate
#>   <chr>    <chr>          <dbl>
#> 1 accuracy multiclass     0.358
```

**Example 3 groups scoring by resample fold.** When you store predictions from cross-validation in a single tibble, `group_by()` plus accuracy returns one score per group, which makes per-fold comparisons trivial.

```r title="Per-fold accuracy"
folded <- two_class |>
  mutate(fold = rep(paste0("fold", 1:4), each = 20))

folded |>
  group_by(fold) |>
  accuracy(truth = obs, estimate = pred)
#> # A tibble: 4 x 4
#>   fold  .metric  .estimator .estimate
#>   <chr> <chr>    <chr>          <dbl>
#> 1 fold1 accuracy binary          0.55
#> 2 fold2 accuracy binary          0.40
#> 3 fold3 accuracy binary          0.60
#> 4 fold4 accuracy binary          0.55
```

**Example 4 uses the vector interface for ad-hoc checks.** When you do not have a tibble handy, `accuracy_vec()` takes two factors directly and returns a numeric scalar instead of a one-row tibble.

```r title="Vector interface for quick checks"
accuracy_vec(two_class$obs, two_class$pred)
#> [1] 0.525
```

The vector form is the right choice inside `map()` calls or unit tests where you want a plain number, not a tibble.

[TIP]
**Pipe accuracy results into ggplot directly.** Because the return shape is always a tidy tibble, you can chain `group_by() |> accuracy() |> ggplot()` to plot per-fold or per-model scores with no reshaping.

## accuracy() compared with related metrics

**Accuracy is the most intuitive metric, but rarely the best one in isolation.** The table below summarizes when to pick another yardstick metric.

| Metric | Best use case | Limitation |
|--------|---------------|-----------|
| `accuracy()` | Balanced classes, equal error costs | Misleading on imbalanced data |
| `bal_accuracy()` | Imbalanced classes, equal error costs | Hides which class drives errors |
| `precision()`, `recall()` | Asymmetric costs, fraud, medical screening | Two numbers to track, not one |
| `f_meas()` | Need a single imbalance-aware score | Equal weighting of precision and recall is a choice, not a default |
| `roc_auc()` | Compare probability rankings across thresholds | Requires probability predictions, not class labels |

A practical workflow is to report accuracy as the headline number, then add at least one threshold-aware metric like `roc_auc()` or a class-aware metric like `bal_accuracy()` whenever the class distribution is skewed.

## Common pitfalls

**Three small mistakes account for most accuracy() errors.** Each one has a clear fix.

The first is passing character vectors instead of factors. yardstick requires factors so it can validate that both columns share the same levels. The fix is one `factor()` call:

```r title="Fix: convert character columns to factors"
bad <- tibble(obs = c("yes", "no", "yes"), pred = c("yes", "yes", "no"))
# accuracy(bad, obs, pred)  # would error
bad <- bad |>
  mutate(across(c(obs, pred), \(x) factor(x, levels = c("yes", "no"))))
accuracy(bad, obs, pred)
#> # A tibble: 1 x 3
#>   .metric  .estimator .estimate
#>   <chr>    <chr>          <dbl>
#> 1 accuracy binary         0.333
```

The second pitfall is mismatched factor levels. If `truth` has levels `c("yes", "no")` but `estimate` has levels `c("no", "yes")`, two-class accuracy still works, but the positive class flips, which changes downstream precision and recall scores. Always set both factors with the same `levels` argument.

The third pitfall is calling accuracy on regression output. The function rejects numeric inputs, but a silent failure mode is when class probabilities (numeric) get accidentally passed as the estimate. The fix is to use `predict(model, type = "class")` or pull `.pred_class` from `parsnip::augment()` output, not the probability columns.

[WARNING]
**Imbalanced data inflates accuracy.** A 95 percent accuracy on a problem with 95 percent majority class means your model added nothing. Always pair accuracy with `bal_accuracy()` or a confusion matrix when classes are skewed.

## Try it yourself

**Try it:** Use the built-in `two_class_example` data from yardstick. Compute the overall accuracy, then group by the `truth` column and report accuracy per truth value. Save the per-group result to `ex_acc_by_class`.

```r title="Your turn: per-class accuracy"
library(yardstick)
data("two_class_example")

# Try it: per-class accuracy
ex_acc_by_class <- # your code here

ex_acc_by_class
#> Expected: 2 rows, one per truth class
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
library(dplyr)
ex_acc_by_class <- two_class_example |>
  group_by(truth) |>
  accuracy(truth = truth, estimate = predicted)
ex_acc_by_class
#> # A tibble: 2 x 4
#>   truth .metric  .estimator .estimate
#>   <fct> <chr>    <chr>          <dbl>
#> 1 Class1 accuracy binary          0.836
#> 2 Class2 accuracy binary          0.819
```

**Explanation:** Grouping by truth before calling accuracy() is the same as computing recall for each class. yardstick still returns a tidy tibble, so you can pipe it into `ggplot()` or `arrange()` without reshaping.

</details>

## Related yardstick metrics

**accuracy() is one entry in the yardstick class-metric family.** Reach for these neighbors when accuracy alone is not enough:

- `bal_accuracy()` averages per-class recall, robust to imbalance
- `precision()` and `recall()` for asymmetric error costs
- `f_meas()` for a single number combining precision and recall
- `kap()` for chance-corrected agreement
- `mcc()` for the Matthews correlation coefficient
- `roc_auc()` and `pr_auc()` for probability-based ranking metrics

For the full set, see the [yardstick reference index](https://yardstick.tidymodels.org/reference/index.html).

## FAQ

**Why does accuracy() return a tibble instead of a number?**

The tidy-data return shape is the defining yardstick convention. Every metric, from `accuracy()` to `roc_auc()`, returns the same three columns: `.metric`, `.estimator`, and `.estimate`. That uniformity lets you `bind_rows()` multiple metric calls or chain `group_by() |> metric()` without writing reshape code. When you just want the scalar, call `accuracy_vec()` instead.

**Does accuracy() work for multiclass classification?**

Yes. yardstick detects the number of factor levels in the truth column and switches the `.estimator` value between `binary` and `multiclass` automatically. The arithmetic is identical: total correct divided by total rows. For multiclass problems you often want `bal_accuracy()` or per-class `precision()` and `recall()` alongside accuracy, since a single multiclass accuracy hides which class the model is failing on.

**How do I compute accuracy from a parsnip workflow?**

Pipe `predict()` or `augment()` output into accuracy. With `augment(fit, new_data = test)`, the output already contains `truth` and `.pred_class` columns, so the call becomes `augment(fit, test) |> accuracy(class, .pred_class)`. Replace `class` with the name of your outcome column.

**What is the difference between accuracy() and bal_accuracy()?**

`accuracy()` is a global count of correct predictions. `bal_accuracy()` is the average of per-class recall (also known as macro recall). On balanced data they return similar numbers; on imbalanced data they can diverge sharply. If 95 percent of rows belong to one class, a model that predicts only that class gets 95 percent accuracy and 50 percent balanced accuracy. Always report both when classes are skewed.

**Can I weight rows when computing accuracy?**

Yes. Pass a `case_weights` column when you call accuracy. Common uses are survey weights, class-rebalancing weights from `themis`, or sample weights from `parsnip::fit()`. The result is a weighted proportion correct, still bounded between 0 and 1.

## Summary

**accuracy() is the simplest yardstick classification metric and the easiest to misuse.** Use it as a fast sanity check, switch to `bal_accuracy()` or per-class metrics when classes are imbalanced, and lean on the vector interface only when you do not need the tidy tibble shape. Combined with `group_by()` it scales to any resampling scheme without reshaping.
