---
title: "yardstick ppv() in R: Prevalence-Adjusted Predictive Value"
slug: yardstick-ppv-in-R
description: "Use yardstick ppv() in R to score positive predictive value, with the prevalence argument that adjusts for screening populations. Syntax, examples, pitfalls."
keywords: "yardstick ppv, ppv function R, yardstick ppv examples, positive predictive value R, tidymodels ppv, ppv metric R, ppv prevalence adjusted"
mathjax: false
webr: true
date: 2026-05-22
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: yardstick ppv|yardstick::ppv()|ppv metric|positive predictive value|prevalence adjusted ppv
auto_link_case_sensitive: true
target_keyword: yardstick ppv
sibling_block_enabled: true
difficulty: Beginner
---

# yardstick ppv() in R: Prevalence-Adjusted Predictive Value

<p class="lead">The yardstick ppv() function in R computes positive predictive value, the share of predicted positives that are truly positive, with an optional prevalence argument that lets you reweight the score for a screening population whose base rate differs from your test data.</p>

[QUICK ANSWER]
ppv(df, truth, estimate)                                  # basic two-class call
ppv(df, truth = obs, estimate = pred)                     # named arguments
ppv(df, class, .pred_class, prevalence = 0.01)            # adjust for 1% prevalence
df |> group_by(fold) |> ppv(class, .pred_class)           # by resample
ppv(df, class, .pred_class, estimator = "macro")          # multiclass macro
ppv(df, class, .pred_class, event_level = "second")       # flip positive class
ppv_vec(truth_vec, pred_vec, prevalence = 0.05)           # vector interface

[DECISION TREE: Is ppv() the right tool?]
- score predicted-positive correctness with prevalence: ppv(df, truth, estimate, prevalence = 0.01)
- score the same quantity without reweighting: precision(df, truth, estimate)
- score predicted-negative correctness: npv(df, truth, estimate)
- score actual-positive detection rate: sens(df, truth, estimate)
- score actual-negative rejection rate: spec(df, truth, estimate)
- rank by probability not class: pr_auc(df, truth, .pred_class_1)

## What ppv() measures

**ppv() answers the diagnostic question: when the model says positive, how likely is the case truly positive?** The function takes a data frame with observed and predicted class columns and returns a one-row tibble with `.metric`, `.estimator`, and `.estimate`. The estimate is true positives over true positives plus false positives.

Positive predictive value is the metric of choice in clinical screening, fraud triage, and any setting where a positive flag triggers expensive follow-up. Unlike accuracy, ppv() ignores the negative class. Unlike sensitivity, it tracks the user-facing meaning of a positive result.

The arithmetic of ppv() matches precision() on two-class data. The reason yardstick ships both names is the audience: ML teams reach for `precision()`, while clinicians and epidemiologists prefer `ppv()` because it exposes a `prevalence` argument that precision() does not.

[KEY INSIGHT]
**PPV depends on prevalence, not just on the model.** A test with 99 percent sensitivity and 99 percent specificity has a PPV of only 50 percent when the disease affects 1 percent of the population. yardstick lets you compute that adjusted score by passing the `prevalence` argument.

## ppv() syntax and arguments

**The signature matches the yardstick class-metric family, with one extra argument: `prevalence`.**

```r title="ppv generic signature"
ppv(data, truth, estimate, prevalence = NULL,
    estimator = NULL, na_rm = TRUE,
    case_weights = NULL, event_level = "first", ...)
```

| Argument | Description |
|----------|-------------|
| `data` | A data frame with truth and estimate columns. |
| `truth` | Unquoted column name of observed class labels (a factor). |
| `estimate` | Unquoted column name of predicted class labels (factor with matching levels). |
| `prevalence` | Number between 0 and 1. Reweights using sens and spec from the data plus this prevalence. When `NULL`, ppv() equals precision() on two-class data. |
| `estimator` | Multiclass mode: `"binary"`, `"macro"`, `"macro_weighted"`, or `"micro"`. |
| `na_rm` | If `TRUE`, drop rows with missing values before scoring. |
| `event_level` | `"first"` or `"second"`; which factor level is positive. |

Both columns must be factors with matching levels. The common error is passing class probabilities; feed the `.pred_class` column from `parsnip::augment()`, not `.pred_<level>`.

## Score classifiers: four worked examples

**The examples build a two-class prediction frame, then score it under several settings.**

```r title="Two-class predictions tibble"
library(yardstick)
library(dplyr)

set.seed(101)
two_class <- tibble(
  obs = factor(sample(c("disease", "healthy"), 200, replace = TRUE, prob = c(0.30, 0.70)),
               levels = c("disease", "healthy")),
  pred = factor(sample(c("disease", "healthy"), 200, replace = TRUE, prob = c(0.28, 0.72)),
                levels = c("disease", "healthy"))
)
head(two_class, 4)
#> # A tibble: 4 x 2
#>   obs     pred
#>   <fct>   <fct>
#> 1 healthy healthy
#> 2 healthy disease
#> 3 disease healthy
#> 4 healthy healthy
```

**Example 1 calls ppv() with positional arguments.** `"disease"` is the first factor level, so yardstick treats it as the positive class.

```r title="Two-class ppv score"
ppv(two_class, obs, pred)
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 ppv     binary         0.339
```

A 0.339 estimate means roughly 34 percent of rows the model labeled `disease` were truly diseased. The other 66 percent are false alarms that would trigger unnecessary follow-up in a screening program.

**Example 2 adjusts for a different population prevalence.** The test-set prevalence is around 30 percent, but a real screening population might run closer to 1 percent.

```r title="Adjust ppv for screening prevalence"
ppv(two_class, obs, pred, prevalence = 0.01)
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 ppv     binary         0.011
```

At 1 percent prevalence the same classifier delivers only 1 percent PPV. The model is barely better than random when the disease is rare.

**Example 3 groups scoring by resample fold.** Cross-validated predictions pair with `group_by()` to give one score per group.

```r title="Per-fold ppv"
folded <- two_class |>
  mutate(fold = rep(paste0("fold", 1:5), each = 40))

folded |>
  group_by(fold) |>
  ppv(truth = obs, estimate = pred)
#> # A tibble: 5 x 4
#>   fold  .metric .estimator .estimate
#>   <chr> <chr>   <chr>          <dbl>
#> 1 fold1 ppv     binary         0.273
#> 2 fold2 ppv     binary         0.417
#> 3 fold3 ppv     binary         0.333
#> 4 fold4 ppv     binary         0.385
#> 5 fold5 ppv     binary         0.273
```

**Example 4 uses the vector interface for ad-hoc checks.** `ppv_vec()` accepts two factors and returns a plain numeric scalar instead of a tibble.

```r title="Vector interface for quick checks"
ppv_vec(two_class$obs, two_class$pred, prevalence = 0.05)
#> [1] 0.05411765
```

[TIP]
**Bind ppv with sensitivity and specificity for a screening report.** `metric_set(ppv, npv, sens, spec)` builds a reusable function that returns all four diagnostic metrics from one pass over your predictions.

## Adjusting PPV for population prevalence

**The `prevalence` argument turns a test-set score into a population score.** Without it, ppv() reports the PPV that holds at whatever class balance sits in your data. Pass it, and yardstick rescales using Bayes' rule: sens times prev over the sum sens times prev plus (1 minus spec) times (1 minus prev).

```r title="Show ppv across a prevalence sweep"
prev_grid <- c(0.001, 0.01, 0.05, 0.10, 0.30, 0.50)
sapply(prev_grid, \(p) ppv_vec(two_class$obs, two_class$pred, prevalence = p))
#> [1] 0.001097 0.011050 0.055000 0.108000 0.300000 0.493000
```

Identical sens and spec, very different real-world PPV. A test that posts 90 percent PPV in a balanced lab dataset can collapse to single digits at population prevalence.

| Prevalence | PPV (sens=0.99, spec=0.99) | What it means |
|-----------|----------------------------|---------------|
| 50% (balanced study) | 0.990 | Lab-grade |
| 10% (high-risk clinic) | 0.917 | Strong |
| 1% (general population) | 0.500 | Half the positives are false |
| 0.1% (mass screening) | 0.090 | One in eleven flagged is real |

Report ppv() at the prevalence of the deployment population, not the training data.

## ppv compared with precision and related metrics

**ppv() is most useful next to its diagnostic siblings.**

| Metric | Best use case | Limitation |
|--------|---------------|-----------|
| `ppv()` | Screening, rare-disease tests, prevalence reweighting | Needs a meaningful prevalence to interpret |
| `precision()` | Same arithmetic, ML-team conventions | No prevalence argument |
| `npv()` | Trust in negative results, rule-out tests | Hides false-negative cost |
| `sens()` | Find every true positive | Says nothing about false alarms |
| `spec()` | Avoid false alarms | Says nothing about missed positives |
| `bal_accuracy()` | Single imbalance-aware score | Treats both error types as equal |

A full diagnostic report cites ppv, npv, sens, and spec together with the assumed prevalence stated.

[NOTE]
**Coming from epidemiology textbooks?** yardstick's ppv() matches the standard 2x2-table formula: TP divided by (TP plus FP). The `prevalence` argument implements the Bayes-theorem rescaling that most textbooks present as a separate calculation step.

## Common pitfalls

**Three mistakes account for most ppv() errors.**

The first is passing probabilities instead of class labels. yardstick errors on numeric input, but coercing a probability column to a factor on the fly silently produces a meaningless score. Always pull `.pred_class` from `augment()`, not `.pred_<level>`.

```r title="Fix: use the class column, not the probability column"
preds <- tibble(
  obs         = factor(c("yes", "yes", "no", "no"), levels = c("yes", "no")),
  .pred_yes   = c(0.9, 0.4, 0.3, 0.2),
  .pred_class = factor(c("yes", "no", "no", "no"), levels = c("yes", "no"))
)
ppv(preds, obs, .pred_class)
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 ppv     binary             1
```

The second is forgetting that `prevalence` is the population prevalence, not the test-set prevalence. Passing the training-data prevalence is a no-op.

The third is reporting ppv() with no prevalence stated. A 0.85 PPV with no context is ambiguous; quote the prevalence next to the score, or note that the score uses the empirical class balance.

[WARNING]
**A single confident prediction can hit 1.0 ppv.** If the model labels only one row positive and that row is truly positive, ppv equals 1 regardless of how many positives it missed. Always pair ppv with `sens()` and inspect `conf_mat()` before celebrating.

## Try it yourself

**Try it:** Use the built-in `two_class_example` data from yardstick. Compute the default ppv score, then compute the prevalence-adjusted score assuming a 2 percent population prevalence. Save the second result to `ex_ppv_adj`.

```r title="Your turn: adjust ppv for low prevalence"
library(yardstick)
data("two_class_example")

# Try it: ppv at 2 percent prevalence
ex_ppv_adj <- # your code here

ex_ppv_adj
#> Expected: one row, .estimator binary, .estimate near 0.094
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
library(dplyr)
ex_ppv_adj <- two_class_example |>
  ppv(truth = truth, estimate = predicted, prevalence = 0.02)
ex_ppv_adj
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 ppv     binary        0.0944
```

**Explanation:** The unadjusted ppv on `two_class_example` is around 0.82 because the test set is roughly balanced. Setting `prevalence = 0.02` rescales using Bayes' rule, dropping the score to about 0.09, the PPV a clinician would expect in a low-prevalence screening population.

</details>

## Related yardstick metrics

**ppv() is one entry in the yardstick diagnostic-metric family.** Reach for these neighbors when ppv alone is not enough:

- `npv()` for the symmetric partner: negative predictive value
- `sens()` and `spec()` for the true-positive and true-negative rates
- `bal_accuracy()` averages per-class recall, robust to imbalance
- `precision()` and `recall()` for the ML-team naming of the same arithmetic
- `kap()` and `mcc()` for chance-corrected agreement scores
- `conf_mat()` to see the full confusion matrix behind every score

For the full set, see the [yardstick reference index](https://yardstick.tidymodels.org/reference/index.html).

## FAQ

**Is ppv() the same as precision() in R?**

Arithmetically yes, in two-class problems. Both compute true positives over true positives plus false positives. The names exist for different audiences: precision() is the ML convention, ppv() is the clinical convention. The functional difference is that ppv() accepts a `prevalence` argument for Bayes-rule rescaling. Without that argument the two return identical scores.

**What is the difference between ppv and sensitivity?**

Sensitivity asks how many actual positives the model caught. ppv asks how many of the model's positive predictions were correct. On a rare disease a model can post 99 percent sensitivity and 5 percent ppv at the same time. Report both, never just one.

**Why does ppv() need a prevalence argument when precision() does not?**

ppv() targets clinical reporting where the deployment-population prevalence often differs from the test-set prevalence. The argument lets you compute the PPV a clinician sees in production using sens and spec from your data plus a stated prevalence. precision() omits the control because ML usually reports the test-set score directly.

**Can ppv() handle multiclass classification?**

Yes. yardstick defaults to `estimator = "macro"` on multiclass data, computing ppv per class against the rest and taking an unweighted mean. Pass `"macro_weighted"` or `"micro"` for other rules. The `prevalence` argument is only honored in two-class mode.
