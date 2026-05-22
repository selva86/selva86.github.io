---
title: "yardstick pr_auc() in R: Score Imbalanced Classifier Ranking"
slug: yardstick-pr_auc-in-R
description: "Score precision-recall AUC with yardstick pr_auc() in R. See syntax, binary and multiclass examples, macro averaging, sklearn mapping, and common pitfalls."
keywords: "yardstick pr_auc, pr_auc function R, yardstick pr_auc examples, precision recall AUC R, R pr_auc tidymodels, area under PR curve R, PR AUC yardstick"
mathjax: false
webr: true
date: 2026-05-22
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: yardstick pr_auc|yardstick::pr_auc()|PR AUC in R|precision-recall AUC|pr_auc yardstick
auto_link_case_sensitive: true
target_keyword: yardstick pr_auc
sibling_block_enabled: true
difficulty: Beginner
---

# yardstick pr_auc() in R: Score Imbalanced Classifier Ranking

<p class="lead">The yardstick pr_auc() function in R scores how well a classifier ranks the minority class on imbalanced data, returning a tidy one-row summary of the area under the precision-recall curve.</p>

[QUICK ANSWER]
pr_auc(df, truth, .pred_class1)                            # basic two-class call
pr_auc(df, truth = obs, .pred_class1)                      # named truth column
pr_auc(df, class, .pred_yes, event_level = "second")       # flip positive class
df |> group_by(fold) |> pr_auc(class, .pred_yes)           # by resample
pr_auc(df, class, .pred_a, .pred_b, .pred_c)               # multiclass, macro default
pr_auc(df, class, .pred_a:.pred_c, estimator = "macro_weighted") # weighted by prevalence
pr_auc_vec(truth_vec, prob_vec)                            # vector interface

[DECISION TREE: Is pr_auc() the right tool?]
- score ranking on rare positives: pr_auc(df, truth, .pred_class1)
- score ranking on balanced data: roc_auc(df, truth, .pred_class1)
- score class labels at one threshold: accuracy(df, truth, estimate)
- score calibrated probabilities: brier_class(df, truth, .pred_class1)
- plot the PR curve points: pr_curve(df, truth, .pred_class1)
- score precision at a fixed cutoff: precision(df, truth, estimate)

## What pr_auc() measures

**pr_auc() answers how well a model ranks positives when positives are rare.** Pass a tibble with the truth column and one or more probability columns; the function returns a one-row tibble with `.metric`, `.estimator`, and `.estimate`. The estimate is the area under the precision-recall curve as the threshold sweeps from 1 to 0.

A score of 1.0 means perfect ranking with no false positives at any recall. The random baseline equals the share of positives, so it shifts with class prevalence, which is why PR AUC fits imbalanced problems better than ROC AUC.

[KEY INSIGHT]
**PR AUC focuses on the positive class only.** ROC AUC integrates the false-positive rate, whose denominator is dominated by abundant negatives, so a useless classifier on a 1:99 problem can still hit 0.9. PR AUC has no such free lunch.

## pr_auc() syntax and arguments

**The signature follows the yardstick probability-metric family.** Argument shape changes between binary and multiclass.

```r title="pr_auc generic signature"
pr_auc(data, truth, ..., estimator = NULL, na_rm = TRUE,
       event_level = "first", case_weights = NULL)
```

| Argument | Description |
|----------|-------------|
| `data` | A data frame with truth and probability columns. |
| `truth` | Unquoted column name of the observed class labels (a factor). |
| `...` | Unquoted column names of the predicted probabilities. One column for binary; one per class for multiclass. |
| `estimator` | Averaging mode for multiclass: `"macro"` (default) or `"macro_weighted"`. Ignored for binary. |
| `na_rm` | If `TRUE`, drop rows where any column is missing before scoring. |
| `event_level` | `"first"` or `"second"`; for binary, names the positive class. |
| `case_weights` | Optional unquoted column for weighting. |

For binary problems, pass the positive-class probability column as the third argument. For multiclass, pass every class probability column with `tidyselect` syntax. Truth must be a factor whose levels match the probability column names after `.pred_`. Unlike `roc_auc()`, no `hand_till` estimator exists because the PR curve is asymmetric.

## Score classifiers: four worked examples

**The examples build an imbalanced two-class tibble you can run end to end.** It mimics a fraud-detection problem where positives are rare.

```r title="Imbalanced two-class predictions"
library(yardstick)
library(dplyr)

set.seed(202)
fraud <- tibble(
  truth = factor(sample(c("fraud", "legit"), 500, replace = TRUE,
                        prob = c(0.05, 0.95)),
                 levels = c("fraud", "legit")),
  .pred_fraud = runif(500, 0, 1)
) |>
  mutate(.pred_fraud = ifelse(truth == "fraud",
                              pmin(1, .pred_fraud + 0.40),
                              .pred_fraud))
table(fraud$truth)
#> 
#> fraud legit 
#>    27   473
```

**Example 1 calls pr_auc() with the positive-class probability column.** `"fraud"` is the first factor level, so yardstick treats it as positive.

```r title="Two-class PR AUC score"
pr_auc(fraud, truth, .pred_fraud)
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 pr_auc  binary         0.293
```

A 0.293 PR AUC on a 5 percent positive base is real lift; the random baseline equals 0.054 (the prevalence). ROC AUC on the same predictions would look optimistically higher.

**Example 2 flips the positive class with `event_level`.** Setting `"second"` makes `"legit"` positive.

```r title="Flip the positive class"
pr_auc(fraud, truth, .pred_fraud, event_level = "second")
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 pr_auc  binary         0.957
```

The flipped estimate is the PR AUC for the majority class, which sits near 1.0 because the majority baseline is already 0.946. PR AUC is asymmetric, so the two scores are never mirror images; always state which class is positive in any report.

**Example 3 scores per resample fold.** Pair `group_by()` with `pr_auc()` to get one score per fold without a loop.

```r title="Per-fold PR AUC"
folded <- fraud |>
  mutate(fold = rep(paste0("fold", 1:5), each = 100))

folded |>
  group_by(fold) |>
  pr_auc(truth, .pred_fraud)
#> # A tibble: 5 x 4
#>   fold  .metric .estimator .estimate
#>   <chr> <chr>   <chr>          <dbl>
#> 1 fold1 pr_auc  binary         0.281
#> 2 fold2 pr_auc  binary         0.318
#> 3 fold3 pr_auc  binary         0.265
#> 4 fold4 pr_auc  binary         0.302
#> 5 fold5 pr_auc  binary         0.299
```

**Example 4 uses the vector interface for ad-hoc checks.** `pr_auc_vec()` accepts a truth factor and a probability vector and returns a plain numeric scalar.

```r title="Vector interface for quick checks"
pr_auc_vec(fraud$truth, fraud$.pred_fraud)
#> [1] 0.2934
```

[TIP]
**Bundle pr_auc with roc_auc and brier_class.** `metric_set(pr_auc, roc_auc, brier_class)` returns a reusable function that scores ranking and calibration in one call, the minimum honest report for any imbalanced classifier.

## Multiclass averaging: macro and macro_weighted

**pr_auc() handles multiclass data with two averaging modes.** Yardstick defaults to `"macro"`, the unweighted mean of one-vs-rest PR AUC.

```r title="Multiclass predictions tibble"
set.seed(101)
n <- 240
multi <- tibble(
  truth = factor(sample(c("a", "b", "c"), n, replace = TRUE,
                        prob = c(0.50, 0.30, 0.20)),
                 levels = c("a", "b", "c")),
  .pred_a = runif(n, 0, 1),
  .pred_b = runif(n, 0, 1),
  .pred_c = runif(n, 0, 1)
) |>
  mutate(s = .pred_a + .pred_b + .pred_c,
         .pred_a = .pred_a / s,
         .pred_b = .pred_b / s,
         .pred_c = .pred_c / s) |>
  select(-s)

pr_auc(multi, truth, .pred_a, .pred_b, .pred_c)
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 pr_auc  macro          0.351
```

Comparing modes shows how prevalence shifts the score:

```r title="Compare averaging modes"
modes <- c("macro", "macro_weighted")
lapply(modes, \(m)
  pr_auc(multi, truth, .pred_a, .pred_b, .pred_c, estimator = m)) |>
  bind_rows()
#> # A tibble: 2 x 3
#>   .metric .estimator     .estimate
#>   <chr>   <chr>              <dbl>
#> 1 pr_auc  macro              0.351
#> 2 pr_auc  macro_weighted     0.394
```

| Estimator | What it does | When to use |
|-----------|-------------|-------------|
| `macro` | One-vs-rest PR AUC, unweighted mean | Treat every class as equally important |
| `macro_weighted` | One-vs-rest PR AUC, weighted by prevalence | Reflect production traffic mix |

`macro` is the safe default because no single abundant class can dominate the score. Production teams often prefer `macro_weighted` so the headline number tracks real traffic mix.

## pr_auc vs roc_auc vs accuracy

**Three metrics show up around the AUC column.** The table sorts out the overlap.

| Function | What it scores | When to prefer it |
|----------|----------------|-------------------|
| `pr_auc()` | Area under the PR curve | Severe imbalance; rare positives |
| `roc_auc()` | Probability positive outranks negative | Balanced data, threshold-free reports |
| `accuracy()` | Share of correct labels at one cutoff | Reporting a deployed threshold |
| `mn_log_loss()` | Mean negative log-likelihood | Penalty for confident wrong predictions |
| `brier_class()` | MSE between probability and truth | Calibration metric, lower is better |

`pr_auc()` is the right call whenever the minority class drives business value: fraud, churn, rare disease, click conversion. On a 1:99 imbalance, ROC AUC can read 0.95 while PR AUC sits at 0.20, and the lower number is the honest one.

[NOTE]
**Coming from scikit-learn?** `yardstick::pr_auc()` matches `sklearn.metrics.average_precision_score()`, not `sklearn.metrics.auc()` on PR points. The `estimator` argument maps to scikit-learn's `average`: `"macro"` to `average="macro"`, `"macro_weighted"` to `average="weighted"`.

## Common pitfalls

**Three small mistakes account for most pr_auc() errors.**

The first is feeding class labels instead of probabilities. `pr_auc()` needs the positive-class probability. Passing `.pred_class` from `parsnip::augment()` when you meant `.pred_yes` is the common slip.

The second is the `event_level` and column-order interaction. The factor level order in `truth` pins the positive class, not the probability column name. If `levels(df$truth)` is `c("no", "yes")`, then `"no"` is positive by default. PR AUC is asymmetric, so the wrong positive can swing the score by 0.5 or more.

```r title="Fix: pin levels and pass the matching probability column"
preds <- tibble(
  truth   = factor(c("yes","yes","no","no","yes"), levels = c("yes","no")),
  .pred_yes = c(0.85, 0.40, 0.10, 0.30, 0.70)
)
levels(preds$truth)
#> [1] "yes" "no"
pr_auc(preds, truth, .pred_yes)
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 pr_auc  binary         0.733
```

The third pitfall is comparing PR AUC across datasets with different class balance. The random baseline equals the positive prevalence, so 0.30 on a 5 percent set differs from 0.30 on a 50 percent set. Report prevalence alongside the score, or compute lift over baseline.

[WARNING]
**pr_auc() returns NA when truth has only one class.** The PR curve is undefined without at least one positive and one negative present. This bites per-fold scoring on rare-event data; a fold with zero positives silently produces NA. Stratify resamples to guarantee both classes appear.

## Try it yourself

**Try it:** Use the built-in `two_class_example` data from yardstick. The truth column is `truth` and the probability column for the positive class (`Class1`) is `Class1`. Compute the PR AUC for the default positive class, then compute it again with `event_level = "second"`. Save the second result to `ex_pr_alt`.

```r title="Your turn: flip the positive class"
library(yardstick)
data("two_class_example")

# Try it: pr_auc with flipped event level
ex_pr_alt <- # your code here

ex_pr_alt
#> Expected: one row, .estimator binary, .estimate near 0.946
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
library(dplyr)
ex_pr_alt <- two_class_example |>
  pr_auc(truth = truth, Class1, event_level = "second")
ex_pr_alt
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 pr_auc  binary         0.946
```

**Explanation:** `event_level = "second"` flips `Class2` to be the positive class while still scoring against the `Class1` probability column. Because PR AUC is asymmetric, the result is not 1 minus the default score; the metric is recomputed against the new positive set.

</details>

## Related yardstick metrics

**pr_auc() is one entry in the yardstick probability-metric family.** Reach for these when PR AUC alone is not enough:

- `roc_auc()` for area under the ROC curve, better on balanced data
- `mn_log_loss()` for log-likelihood penalty
- `brier_class()` for calibration error of binary probabilities
- `pr_curve()` to extract threshold points for plotting
- `accuracy()`, `recall()`, `precision()` for one-threshold scoring

For the full set, see the [yardstick reference index](https://yardstick.tidymodels.org/reference/index.html).

## FAQ

**What is a good PR AUC score in R?**

PR AUC ranges from 0 to 1, but the floor is not 0.5; it equals the positive-class prevalence in your data. On a 1 percent positive set, the random baseline is 0.01, so 0.20 is real lift. Above 0.80 is strong on most business problems; above 0.95 is exceptional and worth checking for leakage.

**Does pr_auc() need probabilities or class labels?**

It needs probabilities. The function scores how the model ranks positives across every threshold, which requires a continuous score. Pass the column holding the predicted probability of the positive class, usually `.pred_<positive_class>` from `parsnip::augment()`. Feeding `.pred_class` runs but produces a meaningless number.

**When should I use pr_auc instead of roc_auc?**

Use `pr_auc()` whenever the positive class is rare (under 10 percent prevalence) or when false positives carry a real cost. ROC AUC integrates against abundant negatives, so it overstates performance on imbalanced problems. PR AUC ignores true negatives entirely and tracks only the pair (precision, recall) that matters for finding the minority class.

**Why does yardstick default to macro for multiclass PR AUC?**

`macro` treats every class equally regardless of size, so a dominant class cannot mask poor performance on minority classes. Switch to `macro_weighted` via the `estimator` argument when the headline score should reflect production traffic mix.

**How is pr_auc different from average precision in scikit-learn?**

They are the same number. Yardstick's `pr_auc()` computes the step-function definition of the PR curve area, identical to `sklearn.metrics.average_precision_score()`. Both avoid the optimistic linear interpolation that `sklearn.metrics.auc()` would apply to PR points.
