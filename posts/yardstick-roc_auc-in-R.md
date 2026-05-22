---
title: "yardstick roc_auc() in R: Score Classifier Ranking Quality"
slug: yardstick-roc_auc-in-R
description: "Score classifier ranking with yardstick roc_auc() in R. See syntax, binary and multiclass examples, hand_till averaging, sklearn mapping, and pitfalls."
keywords: "yardstick roc_auc, roc_auc function R, yardstick roc_auc examples, R AUC tidymodels, ROC AUC R yardstick, binary classifier AUC R, roc_auc tidymodels"
mathjax: false
webr: true
date: 2026-05-22
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: yardstick roc_auc|yardstick::roc_auc()|ROC AUC in R|AUC metric|roc_auc yardstick
auto_link_case_sensitive: true
target_keyword: yardstick roc_auc
sibling_block_enabled: true
difficulty: Beginner
---

# yardstick roc_auc() in R: Score Classifier Ranking Quality

<p class="lead">The yardstick roc_auc() function in R scores how well a classifier ranks positive cases above negative ones, accepting a tibble of truth labels and predicted probabilities and returning a tidy one-row summary you can group, average across classes, or combine with other metrics in a metric set.</p>

[QUICK ANSWER]
roc_auc(df, truth, .pred_class1)                            # basic two-class call
roc_auc(df, truth = obs, .pred_class1)                      # named truth column
roc_auc(df, class, .pred_yes, event_level = "second")       # flip positive class
df |> group_by(fold) |> roc_auc(class, .pred_yes)           # by resample
roc_auc(df, class, .pred_a, .pred_b, .pred_c)               # multiclass, all prob cols
roc_auc(df, class, .pred_a:.pred_c, estimator = "hand_till") # hand_till averaging
roc_auc_vec(truth_vec, prob_vec)                            # vector interface

[DECISION TREE: Is roc_auc() the right tool?]
- score threshold-free ranking on probabilities: roc_auc(df, truth, .pred_class1)
- score precision-recall ranking on imbalance: pr_auc(df, truth, .pred_class1)
- score class labels, not probabilities: accuracy(df, truth, estimate)
- score calibrated probabilities: brier_class(df, truth, .pred_class1)
- plot the ROC curve points: roc_curve(df, truth, .pred_class1)
- score the share of true positives caught: recall(df, truth, estimate)

## What roc_auc() measures

**roc_auc() answers one question: how well does the model rank positives above negatives across every threshold?** You pass a data frame with the truth column and one or more predicted-probability columns, and the function returns a one-row tibble with `.metric`, `.estimator`, and `.estimate`. The estimate equals the probability that a random positive scores higher than a random negative.

A score of 1.0 means perfect ranking, 0.5 means random guessing, and below 0.5 means the model is inverted. Because AUC sweeps every threshold, it sidesteps the cutoff debate, which is why leaderboards on imbalanced data lean on it even though it ignores calibration.

[KEY INSIGHT]
**AUC measures ranking, not probability quality.** A model that predicts 0.999 for every positive and 0.998 for every negative scores AUC 1.0 yet outputs nearly identical numbers. Pair `roc_auc()` with `brier_class()` if calibration matters.

## roc_auc() syntax and arguments

**The signature follows the yardstick probability-metric family.** Argument shape changes slightly between two-class and multiclass because multiclass needs one column per level.

```r title="roc_auc generic signature"
roc_auc(data, truth, ..., estimator = NULL, na_rm = TRUE,
        event_level = "first", case_weights = NULL, options = list())
```

| Argument | Description |
|----------|-------------|
| `data` | A data frame with truth and probability columns. |
| `truth` | Unquoted column name of the observed class labels (a factor). |
| `...` | Unquoted column names of the predicted probabilities. One column for binary; one per class for multiclass. |
| `estimator` | Averaging mode for multiclass: `"hand_till"` (default), `"macro"`, or `"macro_weighted"`. Ignored for binary. |
| `na_rm` | If `TRUE`, drop rows where any column is missing before scoring. |
| `event_level` | `"first"` or `"second"`; for binary, names the positive class. |
| `case_weights` | Optional unquoted column for weighted scoring. |

For binary problems, pass the probability column for the positive class as the third argument. For multiclass, pass every class probability column with `tidyselect` syntax. The truth column must be a factor whose levels match the probability column names after `.pred_`.

## Score classifiers: four worked examples

**The examples below build a two-class tibble so you can run roc_auc() end to end.** Start with a small frame that mimics a churn-prediction problem.

```r title="Two-class predictions with probabilities"
library(yardstick)
library(dplyr)

set.seed(404)
churn <- tibble(
  truth = factor(sample(c("churn", "stay"), 200, replace = TRUE,
                        prob = c(0.30, 0.70)),
                 levels = c("churn", "stay")),
  .pred_churn = runif(200, 0, 1)
) |>
  mutate(.pred_churn = ifelse(truth == "churn",
                              pmin(1, .pred_churn + 0.25),
                              .pred_churn))
head(churn, 4)
#> # A tibble: 4 x 2
#>   truth .pred_churn
#>   <fct>       <dbl>
#> 1 stay        0.770
#> 2 stay        0.882
#> 3 stay        0.249
#> 4 churn       0.952
```

**Example 1 calls roc_auc() with the positive-class probability column.** Because `"churn"` is the first factor level, yardstick treats it as the positive class.

```r title="Two-class AUC score"
roc_auc(churn, truth, .pred_churn)
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 roc_auc binary         0.682
```

A 0.682 AUC means a random churner scores higher than a random non-churner 68 percent of the time, the headline number for ranking-based decision systems.

**Example 2 flips the positive class with `event_level`.** Setting `event_level = "second"` makes `"stay"` the positive class, so yardstick uses `1 - .pred_churn` internally.

```r title="Flip the positive class"
roc_auc(churn, truth, .pred_churn, event_level = "second")
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 roc_auc binary         0.318
```

The flipped estimate is the mirror score on the other class. Always state which class is positive in any AUC report; ambiguity here is the most common review comment.

**Example 3 scores per resample fold.** Cross-validated predictions pair with `group_by()` to give one AUC per fold without a loop.

```r title="Per-fold AUC"
folded <- churn |>
  mutate(fold = rep(paste0("fold", 1:5), each = 40))

folded |>
  group_by(fold) |>
  roc_auc(truth, .pred_churn)
#> # A tibble: 5 x 4
#>   fold  .metric .estimator .estimate
#>   <chr> <chr>   <chr>          <dbl>
#> 1 fold1 roc_auc binary         0.665
#> 2 fold2 roc_auc binary         0.716
#> 3 fold3 roc_auc binary         0.654
#> 4 fold4 roc_auc binary         0.704
#> 5 fold5 roc_auc binary         0.671
```

**Example 4 uses the vector interface for ad-hoc checks.** `roc_auc_vec()` accepts a truth factor and a probability vector and returns a plain numeric scalar.

```r title="Vector interface for quick checks"
roc_auc_vec(churn$truth, churn$.pred_churn)
#> [1] 0.6824
```

[TIP]
**Bundle roc_auc with mn_log_loss and brier_class.** `metric_set(roc_auc, mn_log_loss, brier_class)` builds a reusable function to score ranking and calibration together, the minimum honest report for probabilistic classifiers.

## Multiclass averaging: hand_till, macro, and weighted

**roc_auc() handles multiclass data, but the default averaging differs from `recall()`.** Yardstick defaults to `hand_till`, the Hand-and-Till extension that averages AUC over every ordered class pair.

```r title="Multiclass predictions tibble"
set.seed(303)
n <- 180
multi <- tibble(
  truth = factor(sample(c("a", "b", "c"), n, replace = TRUE,
                        prob = c(0.5, 0.3, 0.2)),
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

roc_auc(multi, truth, .pred_a, .pred_b, .pred_c)
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 roc_auc hand_till      0.514
```

Scoring under each averaging mode highlights the choice:

```r title="Compare averaging modes"
modes <- c("hand_till", "macro", "macro_weighted")
lapply(modes, \(m)
  roc_auc(multi, truth, .pred_a, .pred_b, .pred_c, estimator = m)) |>
  bind_rows()
#> # A tibble: 3 x 3
#>   .metric .estimator     .estimate
#>   <chr>   <chr>              <dbl>
#> 1 roc_auc hand_till          0.514
#> 2 roc_auc macro              0.509
#> 3 roc_auc macro_weighted     0.511
```

| Estimator | What it does | When to use |
|-----------|-------------|-------------|
| `hand_till` | Average AUC over every ordered class pair | Default; insensitive to class prevalence |
| `macro` | One-vs-rest AUC per class, unweighted mean | Treat every class as equally important |
| `macro_weighted` | One-vs-rest AUC per class, weighted by prevalence | Reflect production traffic mix |

`hand_till` is the academic default because it does not depend on class frequencies. Production teams often prefer `macro_weighted` so the score tracks real traffic mix.

## roc_auc vs pr_auc vs accuracy

**Three metrics show up around the AUC column.** The table sorts out the overlap.

| Function | What it scores | When to prefer it |
|----------|----------------|-------------------|
| `roc_auc()` | Probability that positive outranks negative | Balanced data, ranking systems, threshold-free reports |
| `pr_auc()` | Area under the precision-recall curve | Severe class imbalance; positives are rare |
| `accuracy()` | Share of labels correct at one threshold | Reporting a deployed cutoff, sanity checks |
| `mn_log_loss()` | Mean negative log-likelihood | Calibration penalty for confident wrong predictions |
| `brier_class()` | Mean squared error between probability and truth | Calibration metric, lower is better |

`roc_auc()` reads optimistic on imbalanced data because the negative class dominates the false-positive denominator. On a 1:99 fraud problem, AUC can hit 0.95 while precision at the chosen cutoff stays below 0.20. Pair it with `pr_auc()` whenever positives are scarce.

[NOTE]
**Coming from scikit-learn?** `yardstick::roc_auc()` is the equivalent of `sklearn.metrics.roc_auc_score()`. The `estimator` argument maps onto scikit-learn's `multi_class` and `average` parameters; `hand_till` aligns with `multi_class="ovo"`, `macro` with `multi_class="ovr", average="macro"`, and `macro_weighted` with `multi_class="ovr", average="weighted"`.

## Common pitfalls

**Three small mistakes account for most roc_auc() errors.**

The first is feeding class labels instead of probabilities. `roc_auc()` needs the probability of the positive class, not the predicted label. A common slip is passing `.pred_class` from `parsnip::augment()` when you meant `.pred_yes`.

The second is forgetting that `event_level` and column order interact. The probability column name does not pin the positive class; the factor level order in `truth` does. If `levels(df$truth)` reads `c("no", "yes")`, then `"no"` is positive by default and you should pass `.pred_no`, not `.pred_yes`.

```r title="Fix: pin levels and pass the matching probability column"
preds <- tibble(
  truth   = factor(c("yes","yes","no","no","yes"), levels = c("yes","no")),
  .pred_yes = c(0.85, 0.40, 0.10, 0.30, 0.70)
)
levels(preds$truth)
#> [1] "yes" "no"
roc_auc(preds, truth, .pred_yes)
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 roc_auc binary         0.833
```

The third pitfall is reporting AUC at face value on severely imbalanced data. A high AUC can hide a useless operating point because the false-positive denominator is dominated by negatives. Switch to `pr_auc()` whenever the minority class is under 10 percent.

[WARNING]
**roc_auc() does not validate that probability columns sum to 1.** Multiclass probabilities are normalized only if your model produces calibrated output; if you stack three uncalibrated columns the AUC still computes but the comparison loses its probabilistic meaning. Always normalize before scoring multiclass.

## Try it yourself

**Try it:** Use the built-in `two_class_example` data from yardstick. The truth column is `truth`, and the probability column for the positive class (`Class1`) is `Class1`. Compute the ROC AUC, then compute it again with the positive class flipped via `event_level = "second"`. Save the second result to `ex_auc_alt`.

```r title="Your turn: flip the positive class"
library(yardstick)
data("two_class_example")

# Try it: roc_auc with flipped event level
ex_auc_alt <- # your code here

ex_auc_alt
#> Expected: one row, .estimator binary, .estimate near 0.061
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
library(dplyr)
ex_auc_alt <- two_class_example |>
  roc_auc(truth = truth, Class1, event_level = "second")
ex_auc_alt
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 roc_auc binary        0.0611
```

**Explanation:** `event_level = "second"` flips `Class2` to be the positive class while still scoring against the `Class1` probability column. The result equals `1 - default_AUC`, the mirror score; the default direction is the one you usually want.

</details>

## Related yardstick metrics

**roc_auc() is one entry in the yardstick probability-metric family.** Reach for these when AUC alone is not enough:

- `pr_auc()` for area under the precision-recall curve, better on rare positives
- `mn_log_loss()` for log-likelihood penalty on confident wrong predictions
- `brier_class()` for calibration error of binary probabilities
- `roc_curve()` to extract threshold points for plotting
- `accuracy()`, `recall()`, and `precision()` for one-threshold label scoring

For the full set, see the [yardstick reference index](https://yardstick.tidymodels.org/reference/index.html).

## FAQ

**Does roc_auc() need probabilities or class labels?**

It needs probabilities. The function scores how well your model ranks positives above negatives across every threshold, which requires a continuous score, not a label. Pass the column holding the predicted probability of the positive class, usually `.pred_<positive_class>` from `parsnip::augment()`. Feeding `.pred_class` runs but produces a meaningless number.

**What is a good ROC AUC score in R?**

AUC ranges from 0 to 1, with 0.5 meaning random guessing. Rough conventions: 0.70 to 0.80 is acceptable for social-science classifiers, 0.80 to 0.90 is good for marketing and medical work, and above 0.90 is excellent but worth checking for leakage. Below 0.50 means the model is inverted; usually flip `event_level` rather than retrain.

**Why does yardstick default to hand_till for multiclass AUC?**

The Hand-and-Till estimator averages AUC over every ordered class pair, making the score independent of class prevalence. Macro and macro-weighted alternatives are available via `estimator` when you want one-vs-rest readings or want to reflect production traffic mix.

**How is roc_auc different from accuracy?**

`accuracy()` scores correct labels at one chosen threshold. `roc_auc()` integrates performance across every threshold and never needs a cutoff. A model that always predicts the majority class hits high accuracy but scores 0.5 AUC because it cannot rank anything. Report both when the positive class is rare.
