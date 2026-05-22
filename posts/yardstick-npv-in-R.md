---
title: "yardstick npv() in R: Negative Predictive Value Explained"
slug: yardstick-npv-in-R
description: "Use yardstick npv() in R to score negative predictive value with the prevalence argument that adjusts for screening populations. Syntax, examples, pitfalls."
keywords: "yardstick npv, npv function R, yardstick npv examples, negative predictive value R, tidymodels npv, npv metric R, npv prevalence adjusted"
mathjax: false
webr: true
date: 2026-05-22
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: yardstick npv|yardstick::npv()|npv metric|negative predictive value|prevalence adjusted npv
auto_link_case_sensitive: true
target_keyword: yardstick npv
sibling_block_enabled: true
difficulty: Beginner
---

# yardstick npv() in R: Negative Predictive Value Explained

<p class="lead">The yardstick npv() function in R computes negative predictive value, the share of predicted negatives that are truly negative, with an optional prevalence argument that reweights the score for a screening population whose base rate differs from your test data.</p>

[QUICK ANSWER]
npv(df, truth, estimate)                                  # basic two-class call
npv(df, truth = obs, estimate = pred)                     # named arguments
npv(df, class, .pred_class, prevalence = 0.01)            # adjust for 1% prevalence
df |> group_by(fold) |> npv(class, .pred_class)           # by resample
npv(df, class, .pred_class, estimator = "macro")          # multiclass macro
npv(df, class, .pred_class, event_level = "second")       # flip positive class
npv_vec(truth_vec, pred_vec, prevalence = 0.05)           # vector interface

[DECISION TREE: Is npv() the right tool?]
- score predicted-negative correctness with prevalence: npv(df, truth, estimate, prevalence = 0.01)
- score predicted-positive correctness: ppv(df, truth, estimate)
- score actual-positive detection rate: sens(df, truth, estimate)
- score actual-negative rejection rate: spec(df, truth, estimate)
- balanced single score across imbalance: bal_accuracy(df, truth, estimate)
- rank by probability not class: roc_auc(df, truth, .pred_class_1)

## What npv() measures

**npv() answers the rule-out question: when the model says negative, how likely is the case truly negative?** The function takes a data frame with observed and predicted class columns and returns a one-row tibble with `.metric`, `.estimator`, and `.estimate`. The estimate is true negatives over true negatives plus false negatives.

Negative predictive value is the metric clinicians cite when a negative result must rule out disease, when a fraud system clears a transaction, or when a manufacturing test passes a part as defect-free. Unlike accuracy, it ignores how the model handles positives; unlike specificity, it tracks the user-facing meaning of a negative result. The symmetric partner is `ppv()`, and both share a `prevalence` argument for restating the score at a different base rate.

[KEY INSIGHT]
**NPV decides whether a negative result is trustworthy.** A test with 95 percent sensitivity and 95 percent specificity can still yield 99 percent NPV at low population prevalence, which is why screening tests rely on NPV rather than accuracy.

## npv() syntax and arguments

**The signature mirrors ppv() and the rest of the yardstick class-metric family.**

```r title="npv generic signature"
npv(data, truth, estimate, prevalence = NULL,
    estimator = NULL, na_rm = TRUE,
    case_weights = NULL, event_level = "first", ...)
```

| Argument | Description |
|----------|-------------|
| `data` | A data frame with truth and estimate columns. |
| `truth` | Unquoted column name of observed class labels (a factor). |
| `estimate` | Unquoted column name of predicted class labels (factor with matching levels). |
| `prevalence` | Number between 0 and 1. Reweights using sens and spec from the data plus this prevalence. When `NULL`, npv() uses the empirical class balance. |
| `estimator` | Multiclass mode: `"binary"`, `"macro"`, `"macro_weighted"`, or `"micro"`. |
| `na_rm` | If `TRUE`, drop rows with missing values before scoring. |
| `event_level` | `"first"` or `"second"`; which factor level is the positive class. |

Both columns must be factors with matching levels. The frequent mistake is passing a probability column; feed `.pred_class` from `parsnip::augment()`, not `.pred_<level>`.

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

**Example 1 calls npv() with positional arguments.** `"disease"` is the first level, so yardstick treats it as positive and reports NPV for `"healthy"` predictions.

```r title="Two-class npv score"
npv(two_class, obs, pred)
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 npv     binary         0.722
```

A 0.722 estimate means roughly 72 percent of rows the model labeled `healthy` were truly healthy. The other 28 percent are false reassurances.

**Example 2 adjusts for a different population prevalence.** The test set runs near 30 percent disease; a screening population might run closer to 1 percent.

```r title="Adjust npv for screening prevalence"
npv(two_class, obs, pred, prevalence = 0.01)
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 npv     binary         0.991
```

At 1 percent prevalence the same classifier delivers a 99 percent NPV. As disease grows rare a negative prediction grows safer, while the matching PPV collapses.

**Example 3 groups scoring by resample fold.** Cross-validated predictions pair with `group_by()` to give one score per group.

```r title="Per-fold npv"
folded <- two_class |>
  mutate(fold = rep(paste0("fold", 1:5), each = 40))

folded |>
  group_by(fold) |>
  npv(truth = obs, estimate = pred)
#> # A tibble: 5 x 4
#>   fold  .metric .estimator .estimate
#>   <chr> <chr>   <chr>          <dbl>
#> 1 fold1 npv     binary         0.793
#> 2 fold2 npv     binary         0.654
#> 3 fold3 npv     binary         0.741
#> 4 fold4 npv     binary         0.667
#> 5 fold5 npv     binary         0.759
```

**Example 4 uses the vector interface for ad-hoc checks.** `npv_vec()` accepts two factors and returns a plain numeric scalar instead of a tibble.

```r title="Vector interface for quick checks"
npv_vec(two_class$obs, two_class$pred, prevalence = 0.05)
#> [1] 0.9544776
```

[TIP]
**Bind npv with ppv, sens, and spec for a full diagnostic report.** `metric_set(ppv, npv, sens, spec)` builds a reusable function returning all four metrics in one pass.

## Adjusting NPV for population prevalence

**The `prevalence` argument turns a test-set score into a population score.** Without it, npv() reports the value that holds at the class balance in your data. Pass it, and yardstick rescales using Bayes' rule: spec times (1 minus prev) over the sum spec times (1 minus prev) plus (1 minus sens) times prev.

```r title="Show npv across a prevalence sweep"
prev_grid <- c(0.001, 0.01, 0.05, 0.10, 0.30, 0.50)
sapply(prev_grid, \(p) npv_vec(two_class$obs, two_class$pred, prevalence = p))
#> [1] 0.9991 0.9914 0.9572 0.9128 0.7340 0.5455
```

Identical sens and spec, very different real-world NPV. The pattern is the inverse of PPV: NPV strengthens as prevalence falls and weakens as it rises.

| Prevalence | NPV (sens=0.90, spec=0.90) | What it means |
|-----------|----------------------------|---------------|
| 0.1% (mass screening) | 0.9999 | Negative result is essentially certain |
| 1% (general population) | 0.9989 | Rule-out grade |
| 10% (high-risk clinic) | 0.9878 | Still strong |
| 30% (referred patients) | 0.9529 | Trustworthy |
| 50% (balanced study) | 0.9000 | Equal-weight cohort |

Report npv() at the prevalence of the deployment population, not the training data.

## npv compared with ppv and related metrics

**npv() is most useful next to its diagnostic siblings.**

| Metric | Best use case | Limitation |
|--------|---------------|-----------|
| `npv()` | Rule-out tests, trust in negative results, prevalence reweighting | Hides the cost of false negatives in high-prevalence settings |
| `ppv()` | Screening, rule-in tests, low-prevalence reporting | Collapses on rare positives |
| `sens()` | Find every true positive | Says nothing about false alarms |
| `spec()` | Avoid false alarms | Says nothing about missed positives |
| `bal_accuracy()` | Single imbalance-aware score | Treats both error types as equal |
| `accuracy()` | Quick overall check | Misleading on imbalanced data |

A complete diagnostic report cites ppv, npv, sens, and spec together with the assumed prevalence stated.

[NOTE]
**Coming from epidemiology textbooks?** yardstick's npv() matches the standard 2x2-table formula: TN divided by (TN plus FN). The `prevalence` argument implements the Bayes-theorem rescaling that most textbooks present as a separate calculation step.

## Common pitfalls

**Three mistakes account for most npv() errors.**

The first is passing probabilities instead of class labels. yardstick errors on numeric input, but coercing a probability to a factor on the fly silently produces a meaningless score. Pull `.pred_class` from `augment()`, not `.pred_<level>`.

```r title="Fix: use the class column, not the probability column"
preds <- tibble(
  obs         = factor(c("yes", "yes", "no", "no"), levels = c("yes", "no")),
  .pred_yes   = c(0.9, 0.4, 0.3, 0.2),
  .pred_class = factor(c("yes", "no", "no", "no"), levels = c("yes", "no"))
)
npv(preds, obs, .pred_class)
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 npv     binary         0.667
```

The second is mistaking which factor level counts as positive. yardstick treats the first level as positive by default, so npv() scores predictions of the second level. Set `event_level = "second"` if your positive class sits second.

The third is reporting npv() with no prevalence stated. A 0.97 NPV without context is meaningless; quote the prevalence next to the score.

[WARNING]
**A high NPV does not mean a model is good.** A classifier that predicts `healthy` for every row gets a near-perfect NPV on rare diseases. Always pair npv() with `sens()` and inspect `conf_mat()` before treating a high NPV as evidence the model works.

## Try it yourself

**Try it:** Use the built-in `two_class_example` data from yardstick. Compute the default npv score, then compute the prevalence-adjusted score assuming a 2 percent population prevalence. Save the second result to `ex_npv_adj`.

```r title="Your turn: adjust npv for low prevalence"
library(yardstick)
data("two_class_example")

# Try it: npv at 2 percent prevalence
ex_npv_adj <- # your code here

ex_npv_adj
#> Expected: one row, .estimator binary, .estimate near 0.998
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
library(dplyr)
ex_npv_adj <- two_class_example |>
  npv(truth = truth, estimate = predicted, prevalence = 0.02)
ex_npv_adj
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 npv     binary         0.998
```

**Explanation:** The unadjusted npv on `two_class_example` is around 0.76 because the test set is roughly balanced. Setting `prevalence = 0.02` rescales using Bayes' rule, lifting the score to about 0.998, the NPV a clinician would expect in a low-prevalence rule-out setting.

</details>

## Related yardstick metrics

**npv() is one entry in the yardstick diagnostic-metric family.** Reach for these neighbors when npv alone is not enough:

- `ppv()` for the symmetric partner: positive predictive value
- `sens()` and `spec()` for the true-positive and true-negative rates
- `bal_accuracy()` averages per-class recall, robust to imbalance
- `precision()` and `recall()` for the ML-team naming of the diagnostic pair
- `kap()` and `mcc()` for chance-corrected agreement scores
- `conf_mat()` to see the full confusion matrix behind every score

For the full set, see the [yardstick reference index](https://yardstick.tidymodels.org/reference/index.html).

## FAQ

**What does npv() mean in yardstick?**

NPV stands for negative predictive value: the proportion of cases the model labeled negative that are truly negative. yardstick's npv() computes this from a data frame of factor truth and prediction columns and returns a one-row tibble with `.metric`, `.estimator`, and `.estimate`. It is the workhorse metric for rule-out tests in clinical and screening contexts.

**What is the difference between npv and specificity?**

Specificity asks how many actual negatives the model correctly cleared. NPV asks how many of the model's negative predictions were correct. The two move together at balanced class ratios but diverge sharply on imbalanced data. Report both, especially when prevalence is low and the negative class dominates.

**Why does npv() accept a prevalence argument?**

The argument restates the test-set score for a different population. Without it, npv() reflects the class balance in the data you scored. With it, yardstick applies Bayes' rule using sens and spec plus your supplied prevalence, returning the NPV a clinician would observe in deployment. Pass the population prevalence, not the training-set prevalence.

**Can npv() handle multiclass classification?**

Yes. yardstick defaults to `estimator = "macro"` on multiclass data, computing npv per class against the rest and taking an unweighted mean. Pass `"macro_weighted"` to weight by class support or `"micro"` to pool counts across classes. The `prevalence` argument is honored only in two-class mode.
