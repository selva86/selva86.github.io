---
title: "yardstick sens() in R: Score Diagnostic Sensitivity"
slug: yardstick-sens-in-R
description: "Use yardstick sens() in R to score the sensitivity of a classifier. See syntax, multiclass averaging, recall equivalence, event_level flips, and pitfalls."
keywords: "yardstick sens, sens function R, yardstick sens example, sensitivity yardstick, tidymodels sensitivity, true positive rate R, sens recall yardstick"
mathjax: false
webr: true
date: 2026-05-22
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: yardstick sens|yardstick::sens()|sens metric|sensitivity yardstick|sens recall
auto_link_case_sensitive: true
target_keyword: yardstick sens
sibling_block_enabled: true
difficulty: Beginner
---

# yardstick sens() in R: Score Diagnostic Sensitivity

<p class="lead">The yardstick sens() function in R scores sensitivity, the share of real positives a classifier flags, by accepting a tibble of observed and predicted labels and returning a tidy one-row summary you can group, flip across event levels, or combine with specificity in a metric set.</p>

[QUICK ANSWER]
sens(df, truth, estimate)                              # basic two-class call
sens(df, truth = obs, estimate = pred)                 # named arguments
sens(df, class, .pred_class)                           # default parsnip output
df |> group_by(site) |> sens(class, .pred_class)       # by clinic or batch
sens(df, class, .pred_class, estimator = "macro")      # multiclass macro average
sens(df, class, .pred_class, event_level = "second")   # flip positive class
sens_vec(truth_vec, pred_vec)                          # vector interface

[DECISION TREE: Is sens() the right tool?]
- score actual-positive coverage in a diagnostic test: sens(df, truth, estimate)
- score actual-negative coverage instead: spec(df, truth, estimate)
- pair sens with spec in one summary: metric_set(sens, spec)(df, truth, estimate)
- weigh sens equally with spec on imbalanced data: bal_accuracy(df, truth, estimate)
- prefer the ML naming convention: recall(df, truth, estimate)
- need a threshold-free ranking score: roc_auc(df, truth, .pred_class_1)

## What sens() measures

**sens() answers one clinical question: of every truly positive case, what fraction did the test flag?** You pass a tibble of observed and predicted labels, and yardstick returns a one-row summary with `.metric`, `.estimator`, and `.estimate`. The estimate is true positives over true positives plus false negatives, a number between 0 and 1.

Sensitivity is the headline metric for screening and triage, where missing a positive costs more than a false alarm. A diabetes screen that misses a high-glucose patient causes more damage than one that flags a healthy patient for confirmation. Accuracy hides that asymmetry; sens() exposes it.

[KEY INSIGHT]
**A test that flags every case as positive scores 1.0 sensitivity.** sens() ignores false positives by construction, so it is trivially gameable on its own. Always pair it with `spec()` or `bal_accuracy()` before reporting.

## sens() syntax and arguments

**The signature matches the rest of the yardstick class-metric family.** The same call shape works for any classifier whose predictions land in a tibble.

```r title="sens generic signature"
sens(data, truth, estimate, estimator = NULL, na_rm = TRUE,
     case_weights = NULL, event_level = "first", ...)
```

| Argument | Description |
|----------|-------------|
| `data` | A data frame with truth and estimate columns. |
| `truth` | Unquoted column name of the observed class labels (a factor). |
| `estimate` | Unquoted column name of the predicted class labels (a factor with matching levels). |
| `estimator` | Averaging mode for multiclass: `"binary"`, `"macro"`, `"macro_weighted"`, or `"micro"`. Defaults to `"binary"` for two-class data and `"macro"` for multiclass. |
| `na_rm` | If `TRUE`, drop rows where either column is missing before scoring. |
| `event_level` | `"first"` or `"second"`; controls which factor level counts as the positive case. |

Both `truth` and `estimate` must be factors with identical levels. The most common slip is passing a class-probability column; sens() needs class labels, so feed `.pred_class` from `parsnip::augment()`, not `.pred_<level>`.

## Score classifiers: four worked examples

**The examples below build a two-class diabetes-screening frame and a multiclass triage frame so you can run sens() against both shapes.** Start with a small two-class tibble that simulates a kit producing labels against a confirmatory lab result.

```r title="Two-class diagnostic tibble"
library(yardstick)
library(dplyr)

set.seed(715)
diabetes <- tibble(
  lab_result = factor(sample(c("positive", "negative"), 240, replace = TRUE,
                             prob = c(0.18, 0.82)),
                      levels = c("positive", "negative")),
  kit_call   = factor(sample(c("positive", "negative"), 240, replace = TRUE,
                             prob = c(0.28, 0.72)),
                      levels = c("positive", "negative"))
)
head(diabetes, 4)
#> # A tibble: 4 x 2
#>   lab_result kit_call
#>   <fct>      <fct>   
#> 1 negative   negative
#> 2 negative   positive
#> 3 positive   negative
#> 4 negative   negative
```

**Example 1 calls sens() with positional arguments.** Because `"positive"` is the first factor level, yardstick treats it as the positive class.

```r title="Two-class sensitivity score"
sens(diabetes, lab_result, kit_call)
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 sens    binary         0.302
```

A 0.302 sensitivity means the kit caught 30 percent of confirmed positives, the first number any reviewer will challenge before approving it for triage.

**Example 2 flips the positive class with `event_level`.** Setting `event_level = "second"` reframes the metric around the negative class.

```r title="Flip the positive class"
sens(diabetes, lab_result, kit_call, event_level = "second")
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 sens    binary         0.736
```

That higher number is not better, just a different question. State which class is positive whenever you report the score.

**Example 3 groups scoring by clinic site.** One call returns one sensitivity per site, useful when the same kit runs at multiple labs.

```r title="Per-site sensitivity"
sites <- diabetes |>
  mutate(site = rep(c("clinic_a", "clinic_b", "clinic_c"), each = 80))

sites |>
  group_by(site) |>
  sens(truth = lab_result, estimate = kit_call)
#> # A tibble: 3 x 4
#>   site     .metric .estimator .estimate
#>   <chr>    <chr>   <chr>          <dbl>
#> 1 clinic_a sens    binary         0.353
#> 2 clinic_b sens    binary         0.250
#> 3 clinic_c sens    binary         0.308
```

**Example 4 uses the vector interface.** `sens_vec()` takes two factors and returns a numeric scalar, handy inside `summarise()` or a quick QA script.

```r title="Vector interface for quick checks"
sens_vec(diabetes$lab_result, diabetes$kit_call)
#> [1] 0.3023256
```

[TIP]
**Bundle sens with spec in a single metric set.** `metric_set(sens, spec)(diabetes, lab_result, kit_call)` returns both numbers in one tibble, which is the minimum honest report for a diagnostic test.

## Multiclass averaging: macro, weighted, and micro

**sens() handles multiclass data, but the answer depends on the averaging rule.** A triage system routing patients to one of three pathways needs one sensitivity score across all classes.

```r title="Multiclass triage tibble"
set.seed(401)
triage <- tibble(
  truth     = factor(sample(c("urgent", "routine", "discharge"), 210,
                            replace = TRUE, prob = c(0.20, 0.55, 0.25)),
                    levels = c("urgent", "routine", "discharge")),
  predicted = factor(sample(c("urgent", "routine", "discharge"), 210,
                            replace = TRUE, prob = c(0.18, 0.60, 0.22)),
                    levels = c("urgent", "routine", "discharge"))
)

sens(triage, truth, predicted, estimator = "macro")
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 sens    macro          0.351
```

Comparing every averaging mode side by side surfaces the trade-off:

```r title="Compare averaging modes"
modes <- c("macro", "macro_weighted", "micro")
lapply(modes, \(m) sens(triage, truth, predicted, estimator = m)) |>
  bind_rows()
#> # A tibble: 3 x 3
#>   .metric .estimator     .estimate
#>   <chr>   <chr>              <dbl>
#> 1 sens    macro              0.351
#> 2 sens    macro_weighted     0.376
#> 3 sens    micro              0.376
```

| Estimator | What it does | When to use |
|-----------|-------------|-------------|
| `macro` | Unweighted mean of per-class sensitivity | Treat each pathway as equally important regardless of frequency |
| `macro_weighted` | Mean weighted by class prevalence in truth | Reflect the true case mix arriving at triage |
| `micro` | Pool all predictions, then compute one ratio | Match the global hit rate; equals accuracy under symmetric labels |
| `binary` | Score one positive class only | Two-class diagnostic problems, set by default |

Clinical papers report `macro` so the rare urgent class counts as much as the common routine class. Operational dashboards favor `macro_weighted` to track real arrival mix.

## sens vs recall vs spec

**Three function names cluster around the sens column in yardstick, and two of them return the same number.** The table below sorts the overlap so reports stay consistent across audiences.

| Function | What it scores | Same as |
|----------|----------------|---------|
| `sens()` | True positives over actual positives | recall (yardstick aliases them) |
| `recall()` | True positives over actual positives | sensitivity, true positive rate |
| `spec()` | True negatives over actual negatives | specificity, true negative rate |
| `precision()` | True positives over predicted positives | positive predictive value |
| `bal_accuracy()` | Mean of sens and spec | balanced accuracy |
| `j_index()` | sens + spec, 1 | Youden's J statistic |

`sens()` and `recall()` return identical numbers and accept identical arguments. Use `sens` in clinical reports and `recall` in ML reports so readers do not translate.

[NOTE]
**Coming from scikit-learn?** `yardstick::sens()` corresponds to `sklearn.metrics.recall_score()` with the positive class set explicitly. The `estimator` argument maps to scikit-learn's `average` parameter: `"macro"`, `"micro"`, and `"macro_weighted"` line up with `average="macro"`, `"micro"`, and `"weighted"`.

## Common pitfalls

**Three mistakes cause most sens() errors in real reports.**

The first is reporting high sensitivity without checking specificity. A kit that returns positive on every patient scores 1.0 sens and 0.0 spec, perfect on paper, useless in practice. Pair sens with spec in one metric set before reporting.

The second is forgetting to pin factor levels. The order of `levels()` decides which class is positive; a flipped order silently inverts the metric. Set the positive class explicitly when you build the factor.

```r title="Fix: pin levels so the positive class is unambiguous"
preds <- tibble(
  truth    = factor(c("sick", "sick", "well", "well", "sick"),
                    levels = c("sick", "well")),
  estimate = factor(c("sick", "well", "well", "well", "sick"),
                    levels = c("sick", "well"))
)
levels(preds$truth)
#> [1] "sick" "well"
sens(preds, truth, estimate)
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 sens    binary         0.667
```

The third pitfall is divide-by-zero on multiclass macro averaging. A class with zero positives in the test set contributes `NaN`, and the macro average drops to `NaN`. Switch to `estimator = "macro_weighted"` so empty classes drop out by weight, or stratify the resample.

[WARNING]
**Sensitivity trades off against specificity, not against precision.** Pushing the decision threshold down catches more positives (sens up) but admits more false alarms (spec down). Tune the threshold against the cost ratio of missing a positive versus alarming a negative, not against a single score.

## Try it yourself

**Try it:** Use the built-in `two_class_example` data from yardstick. Compute the sensitivity with the default positive class, then compute it again with the positive class flipped via `event_level = "second"`. Save the second result to `ex_sens_alt`.

```r title="Your turn: flip the positive class"
library(yardstick)
data("two_class_example")

# Try it: sens with flipped event level
ex_sens_alt <- # your code here

ex_sens_alt
#> Expected: one row, .estimator binary, .estimate near 0.79
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
library(dplyr)
ex_sens_alt <- two_class_example |>
  sens(truth = truth, estimate = predicted, event_level = "second")
ex_sens_alt
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 sens    binary         0.793
```

**Explanation:** `event_level = "second"` treats `Class2` as the positive class, so sens now measures how many actual `Class2` cases the model caught. The default `"first"` would have scored `Class1` recovery instead.

</details>

## Related yardstick metrics

**sens() is one entry in the yardstick class-metric family.** Reach for these neighbors when sensitivity alone is not enough:

- `spec()` for the negative-class catch rate
- `bal_accuracy()` averages sens and spec, robust to imbalance
- `j_index()` for Youden's J, the screening-summary statistic
- `recall()` for the ML alias of sensitivity
- `precision()` for predicted-positive correctness
- `f_meas()` for the harmonic mean of precision and sens
- `conf_mat()` to inspect the full confusion matrix

For the full set, see the [yardstick reference index](https://yardstick.tidymodels.org/reference/index.html).

## FAQ

**Is sens() the same as recall in yardstick?**

Yes, both functions return identical numbers. `sens()` and `recall()` both divide true positives by actual positives and share the same `event_level` and `estimator` arguments. The two names persist because medical literature settled on "sensitivity" while ML literature settled on "recall." Use whichever your audience expects.

**Why does sens() return a tibble instead of a number?**

The tidy return shape is the defining yardstick convention. Every metric returns the same three columns: `.metric`, `.estimator`, and `.estimate`. That uniformity lets you `bind_rows()` multiple metric calls or pipe `group_by() |> metric()` without reshape code. For a scalar, call `sens_vec()`.

**How is sens() different from accuracy?**

`accuracy()` asks how many predictions were correct overall. `sens()` asks how many actual positives the test caught, ignoring the negative class. On imbalanced data they diverge: a kit that always predicts negative can score 95 percent accuracy with near-zero sensitivity on the rare class.

**Why does sens() return NaN on my multiclass data?**

A `NaN` sensitivity means the test set has zero positives for at least one class, so per-class sens divides by zero. Switch to `estimator = "macro_weighted"` to drop empty classes by weight, or stratify the resample so every class is represented.
