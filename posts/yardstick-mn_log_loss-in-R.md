---
title: "yardstick mn_log_loss() in R: Cross-Entropy Loss Metric"
slug: yardstick-mn_log_loss-in-R
description: "Score class probabilities with yardstick mn_log_loss() in R. See syntax, binary and multiclass examples, sum vs mean, sklearn parity, and common pitfalls."
keywords: "yardstick mn_log_loss, mn_log_loss function R, yardstick log loss, R cross entropy loss, yardstick mn_log_loss examples, multinomial log loss R, log loss tidymodels"
mathjax: false
webr: true
date: 2026-05-22
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: yardstick mn_log_loss|yardstick::mn_log_loss()|mn_log_loss yardstick|log loss in R|cross-entropy in R
auto_link_case_sensitive: true
target_keyword: yardstick mn_log_loss
sibling_block_enabled: true
difficulty: Beginner
---

# yardstick mn_log_loss() in R: Cross-Entropy Loss Metric

<p class="lead">The yardstick mn_log_loss() function in R scores how well a classifier's predicted probabilities match the observed classes, returning a tidy one-row summary of the mean negative log-likelihood (cross-entropy) for binary or multiclass problems.</p>

[QUICK ANSWER]
mn_log_loss(df, truth, .pred_class1)                       # binary call
mn_log_loss(df, truth = obs, .pred_class1)                 # named truth column
mn_log_loss(df, class, .pred_yes, event_level = "second")  # flip positive class
df |> group_by(fold) |> mn_log_loss(class, .pred_yes)      # per resample
mn_log_loss(df, class, .pred_a, .pred_b, .pred_c)          # multiclass
mn_log_loss(df, class, .pred_a:.pred_c, sum = TRUE)        # sum, not mean
mn_log_loss_vec(truth_vec, prob_vec)                       # vector interface

[DECISION TREE: Is mn_log_loss() the right tool?]
- penalize overconfident wrong predictions: mn_log_loss(df, truth, .pred_class1)
- measure calibration error directly: brier_class(df, truth, .pred_class1)
- score ranking on balanced data: roc_auc(df, truth, .pred_class1)
- score ranking on rare positives: pr_auc(df, truth, .pred_class1)
- score class labels at one cutoff: accuracy(df, truth, estimate)
- score cost-weighted mistakes: classification_cost(df, truth, .pred_class1)

## What mn_log_loss() measures

**mn_log_loss() answers how confident and correct a probabilistic classifier is.** Pass a tibble with the truth column and one or more probability columns; the function returns a one-row tibble with `.metric`, `.estimator`, and `.estimate`. The estimate is the mean negative log-likelihood of the observed classes under the predicted probabilities.

A perfect model scores 0. A model that always predicts the marginal class prevalence scores the entropy of the truth distribution. Lower is better, and the metric is unbounded above: a confident wrong prediction drives the loss toward infinity.

[KEY INSIGHT]
**Log loss punishes overconfidence the hardest.** A model that predicts 0.99 for the wrong class pays a much steeper penalty than one that predicts 0.55 for the wrong class. That makes mn_log_loss() the metric to watch when miscalibrated probabilities are dangerous, like medical triage or fraud scoring.

## mn_log_loss() syntax and arguments

**The signature follows the yardstick probability-metric family.** Argument shape changes between binary and multiclass.

```r title="mn_log_loss generic signature"
mn_log_loss(data, truth, ..., na_rm = TRUE, sum = FALSE,
            event_level = "first", case_weights = NULL)
```

| Argument | Description |
|----------|-------------|
| `data` | A data frame with truth and probability columns. |
| `truth` | Unquoted column name of the observed class labels (a factor). |
| `...` | Unquoted column names of the predicted probabilities. One column for binary; one per class for multiclass. |
| `na_rm` | If `TRUE`, drop rows where any column is missing before scoring. |
| `sum` | If `TRUE`, return the summed log loss instead of the mean. |
| `event_level` | `"first"` or `"second"`; for binary, names the positive class. |
| `case_weights` | Optional unquoted column for weighting rows. |

For binary, pass the positive-class probability column. For multiclass, pass every class probability column with `tidyselect` syntax in the same order as `levels(truth)`. Truth must be a factor whose levels match the probability column names after the `.pred_` prefix. Yardstick clips probabilities to `[1e-15, 1 - 1e-15]` so a 0 or 1 never produces `-Inf`.

## Score classifiers: four worked examples

**The examples build a two-class tibble you can run end to end.** It mimics a churn-prediction problem with moderate signal.

```r title="Two-class predictions tibble"
library(yardstick)
library(dplyr)

set.seed(202)
churn <- tibble(
  truth = factor(sample(c("yes", "no"), 400, replace = TRUE,
                        prob = c(0.30, 0.70)),
                 levels = c("yes", "no")),
  .pred_yes = runif(400, 0, 1)
) |>
  mutate(.pred_yes = ifelse(truth == "yes",
                            pmin(0.99, .pred_yes + 0.25),
                            pmax(0.01, .pred_yes - 0.10)),
         .pred_no = 1 - .pred_yes)
table(churn$truth)
#>
#> yes  no
#> 121 279
```

**Example 1 calls mn_log_loss() with the positive-class probability column.** `"yes"` is the first factor level, so yardstick treats it as positive.

```r title="Two-class log loss"
mn_log_loss(churn, truth, .pred_yes)
#> # A tibble: 1 x 3
#>   .metric     .estimator .estimate
#>   <chr>       <chr>          <dbl>
#> 1 mn_log_loss binary         0.503
```

A 0.503 mean log loss beats the entropy floor of a 30/70 split (around 0.611), so the predictions carry real information.

**Example 2 flips the positive class with `event_level`.** Setting `"second"` makes `"no"` positive without touching the probability column.

```r title="Flip the positive class"
mn_log_loss(churn, truth, .pred_yes, event_level = "second")
#> # A tibble: 1 x 3
#>   .metric     .estimator .estimate
#>   <chr>       <chr>          <dbl>
#> 1 mn_log_loss binary         0.503
```

Unlike `roc_auc()` or `pr_auc()`, the score is identical. Log loss is symmetric: scoring `.pred_yes` against `"yes"` and scoring `1 - .pred_yes` against `"no"` give the same number. The argument exists for family consistency, not because it changes the math.

**Example 3 scores per resample fold.** Pair `group_by()` with `mn_log_loss()` to get one score per fold without a loop.

```r title="Per-fold log loss"
folded <- churn |>
  mutate(fold = rep(paste0("fold", 1:5), each = 80))

folded |>
  group_by(fold) |>
  mn_log_loss(truth, .pred_yes)
#> # A tibble: 5 x 4
#>   fold  .metric     .estimator .estimate
#>   <chr> <chr>       <chr>          <dbl>
#> 1 fold1 mn_log_loss binary         0.495
#> 2 fold2 mn_log_loss binary         0.521
#> 3 fold3 mn_log_loss binary         0.488
#> 4 fold4 mn_log_loss binary         0.514
#> 5 fold5 mn_log_loss binary         0.499
```

**Example 4 uses the vector interface for ad-hoc checks.** `mn_log_loss_vec()` accepts a truth factor and a probability vector and returns a plain numeric scalar.

```r title="Vector interface for quick checks"
mn_log_loss_vec(churn$truth, churn$.pred_yes)
#> [1] 0.5033
```

[TIP]
**Bundle mn_log_loss with roc_auc and brier_class.** `metric_set(mn_log_loss, roc_auc, brier_class)` returns a reusable function that scores calibration, ranking, and likelihood in a single call, the minimum honest report for any probabilistic classifier.

## Multiclass log loss

**mn_log_loss() generalizes to K classes without an averaging argument.** Yardstick uses the categorical cross-entropy formula directly, so the multiclass estimator label is simply `"multiclass"`.

```r title="Multiclass predictions tibble"
set.seed(101)
n <- 240
multi <- tibble(
  truth = factor(sample(c("a", "b", "c"), n, replace = TRUE,
                        prob = c(0.50, 0.30, 0.20)),
                 levels = c("a", "b", "c")),
  .pred_a = runif(n, 0.1, 1),
  .pred_b = runif(n, 0.1, 1),
  .pred_c = runif(n, 0.1, 1)
) |>
  mutate(s = .pred_a + .pred_b + .pred_c,
         .pred_a = .pred_a / s,
         .pred_b = .pred_b / s,
         .pred_c = .pred_c / s) |>
  select(-s)

mn_log_loss(multi, truth, .pred_a, .pred_b, .pred_c)
#> # A tibble: 1 x 3
#>   .metric     .estimator .estimate
#>   <chr>       <chr>          <dbl>
#> 1 mn_log_loss multiclass     1.144
```

The score 1.144 sits just above the uniform-prediction reference of `log(3) = 1.099`, so these random probabilities are slightly worse than always predicting `1/3` per class. Switching to `sum = TRUE` returns the unscaled sum:

```r title="Sum versus mean"
mn_log_loss(multi, truth, .pred_a, .pred_b, .pred_c, sum = TRUE)
#> # A tibble: 1 x 3
#>   .metric     .estimator .estimate
#>   <chr>       <chr>          <dbl>
#> 1 mn_log_loss multiclass     274.6
```

| Argument | What it returns | When to use |
|----------|-----------------|-------------|
| `sum = FALSE` (default) | Mean log loss across rows | Comparable across datasets, fold sizes |
| `sum = TRUE` | Summed log loss across rows | Aggregating across batches of equal weight |

Default to the mean for headline scores; use `sum = TRUE` only when you plan to divide by a custom denominator.

## mn_log_loss vs roc_auc vs brier_class

**Four metrics share the probability-input contract.** The table sorts out the overlap.

| Function | What it scores | When to prefer it |
|----------|----------------|-------------------|
| `mn_log_loss()` | Mean negative log-likelihood | Penalize overconfident wrong predictions |
| `roc_auc()` | Probability positive outranks negative | Threshold-free ranking on balanced data |
| `pr_auc()` | Area under the PR curve | Rare-positive ranking on imbalanced data |
| `brier_class()` | Mean squared error of probabilities | Calibration of binary probabilities |
| `accuracy()` | Share of correct labels at one cutoff | Reporting a deployed threshold |

`mn_log_loss()` is the right call whenever probability quality matters more than ranking or a single threshold. Boosting and neural net objectives are typically log loss, so reporting it keeps train-time and test-time metrics aligned.

[NOTE]
**Coming from scikit-learn?** `yardstick::mn_log_loss()` matches `sklearn.metrics.log_loss()` exactly. Both clip probabilities to avoid `-Inf` and both default to the mean over rows. Pass `sum = TRUE` in yardstick to match `normalize = False` in sklearn.

## Common pitfalls

**Three small mistakes account for most mn_log_loss() errors.**

The first is feeding class labels instead of probabilities. `mn_log_loss()` needs the positive-class probability for binary or one column per class for multiclass. Passing `.pred_class` from `parsnip::augment()` raises an error because hard labels are not numeric in [0, 1].

The second is column-order drift on multiclass. The `...` arguments are matched against `levels(truth)` by position. If `levels(truth)` is `c("a", "b", "c")` but you pass `.pred_b, .pred_a, .pred_c`, yardstick assigns the wrong probability to each class.

```r title="Fix: align column order with factor levels"
preds <- tibble(
  truth = factor(c("a", "b", "c", "a"), levels = c("a", "b", "c")),
  .pred_a = c(0.70, 0.10, 0.10, 0.60),
  .pred_b = c(0.20, 0.80, 0.10, 0.30),
  .pred_c = c(0.10, 0.10, 0.80, 0.10)
)
mn_log_loss(preds, truth, .pred_a, .pred_b, .pred_c)
#> # A tibble: 1 x 3
#>   .metric     .estimator .estimate
#>   <chr>       <chr>          <dbl>
#> 1 mn_log_loss multiclass     0.354
```

The third pitfall is unnormalized probabilities. Yardstick does not check that the K columns sum to 1 for multiclass. If they sum to 1.10 or 0.85 from a softmax bug, the score is still a number, just a wrong one. Verify `rowSums()` equals 1 before scoring.

[WARNING]
**Probabilities of 0 or 1 do not crash but they distort.** Yardstick clips inputs to `[1e-15, 1 - 1e-15]`, so a hard 0 on the true class produces a loss near 34.5 per row, not `Inf`. One such row can dominate the mean. Cap engine outputs to `[0.001, 0.999]` before scoring.

## Try it yourself

**Try it:** Use the built-in `two_class_example` data from yardstick. The truth column is `truth` and the probability column for the positive class (`Class1`) is `Class1`. Compute the mean log loss, then compute the summed log loss with `sum = TRUE`. Save the second result to `ex_mll_sum`.

```r title="Your turn: sum vs mean log loss"
library(yardstick)
data("two_class_example")

# Try it: mn_log_loss with sum = TRUE
ex_mll_sum <- # your code here

ex_mll_sum
#> Expected: one row, .estimator binary, .estimate around 188.7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
library(dplyr)
ex_mll_sum <- two_class_example |>
  mn_log_loss(truth = truth, Class1, sum = TRUE)
ex_mll_sum
#> # A tibble: 1 x 3
#>   .metric     .estimator .estimate
#>   <chr>       <chr>          <dbl>
#> 1 mn_log_loss binary         188.7
```

**Explanation:** Setting `sum = TRUE` returns the summed log loss across all 500 rows. Dividing by 500 recovers the default mean estimate of about 0.377; the two numbers are the same metric at different scales.

</details>

## Related yardstick metrics

**mn_log_loss() is one entry in the yardstick probability-metric family.** Reach for these when log loss alone is not enough:

- `roc_auc()` for threshold-free ranking quality
- `pr_auc()` for ranking on imbalanced data
- `brier_class()` for calibration error of binary probabilities
- `classification_cost()` for cost-weighted misclassification
- `accuracy()`, `recall()`, `precision()` for one-threshold scoring

For the full set, see the [yardstick reference index](https://yardstick.tidymodels.org/reference/index.html).

## FAQ

**What is a good mn_log_loss score in R?**

Mean log loss is unbounded above and bounded below by 0, so "good" depends on the class prior. The no-information baseline is the entropy `-sum(p * log(p))`. On a balanced two-class problem that floor is `log(2) = 0.693`; any model below adds value. Strong calibrated classifiers on real data typically land between 0.10 and 0.40.

**Does mn_log_loss() need probabilities or class labels?**

It needs probabilities. The function evaluates the negative log-likelihood of the observed classes under the predicted distribution, which requires numbers in [0, 1] per class. Pass probability columns from `parsnip::augment()`, usually named `.pred_<class>`. Feeding `.pred_class` (the hard label) raises a type error because the column is a factor.

**When should I use mn_log_loss instead of accuracy?**

Use `mn_log_loss()` whenever the downstream decision depends on a probability rather than a hard label. Calibration drives expected value in fraud, churn, advertising, and medical screening; accuracy throws that information away. Report log loss as the primary metric and accuracy as a sanity check on the deployed threshold.

**Why does yardstick clip probabilities before computing log loss?**

A predicted probability of exactly 0 for the true class would push `log(p)` to `-Inf` and the mean would be undefined. Yardstick clips inputs to `[1e-15, 1 - 1e-15]`, matching scikit-learn. The clip means a hard wrong call costs roughly 34.5 per row, severe but finite.

**How is mn_log_loss different from cross-entropy in deep learning?**

They are the same quantity. Categorical cross-entropy in Keras or PyTorch is exactly the multiclass mean negative log-likelihood that `mn_log_loss()` computes. The only difference is input shape: frameworks expect a softmax tensor while yardstick expects one probability column per class.
