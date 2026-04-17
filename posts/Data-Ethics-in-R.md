---
title: "Data Ethics for R Programmers: The Questions to Ask Before You Analyse"
slug: "Data-Ethics-in-R"
description: "Data ethics isn't abstract philosophy, it shapes how R programmers collect, store, and analyse data. Learn the consent, privacy, and bias principles."
keywords: "data ethics R, responsible data analysis, data privacy R, p-hacking R, informed consent data, ethical data science, data minimization R, bias detection R"
auto_link_terms: "data ethics|responsible data analysis|p-hacking|data minimization|data provenance|informed consent"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-14"
curriculum_id: "1.6.1"
post_type: "C"
sidebar_section: "Learn R"
sidebar_title: "Data Ethics"
sidebar_order: 50
difficulty: "Beginner"
---

# Data Ethics for R Programmers: The Questions to Ask Before You Analyse

<p class="lead">Data ethics is the set of choices you make about consent, privacy, p-hacking, and reporting that decide whether your analysis helps people or harms them. This guide walks through six concrete questions to ask before you analyse, each paired with R code you can run right now.</p>

## Why does data ethics matter for the code you write?

You can fit a model in one line of R. The hard part is everything around it: who consented, which rows to drop, whether you ran fifty tests and kept the prettiest, and whether the model quietly fails for one subgroup. Ethics in R looks like code, not a lecture. The cheapest ethical habit is stamping each analysis with a reproducibility manifest a future reader can re-run.

```r
library(dplyr)

data_provenance <- function(purpose, n, seed = NULL) {
  list(
    date         = format(Sys.Date(), "%Y-%m-%d"),
    r_version    = paste(R.version$major, R.version$minor, sep = "."),
    seed         = seed,
    sample_size  = n,
    purpose      = purpose
  )
}

manifest <- data_provenance(
  purpose = "Effect of sleep on reaction time",
  n       = 240,
  seed    = 2026
)

manifest
#> $date
#> [1] "2026-04-14"
#>
#> $r_version
#> [1] "4.4"
#>
#> $seed
#> [1] 2026
#>
#> $sample_size
#> [1] 240
#>
#> $purpose
#> [1] "Effect of sleep on reaction time"
```

The function does almost nothing, and that's the point. A printed manifest is a contract: it says "if you re-run this script with R 4.4 and seed 2026 on these 240 rows, you should get the same answer I did." Most ethical breakdowns in data science start with the absence of this single object.

[KEY INSIGHT]
**Reproducibility is the floor of data ethics, not the ceiling.** If another analyst can't re-run your script and land on the same numbers, every downstream conversation about consent, bias, or honesty becomes a guessing game.

**Try it:** Extend `data_provenance()` to record a `consent_status` field (e.g., `"IRB-approved"` or `"public-domain"`). Call it once and print the result.

```r
# Try it: add consent_status to the manifest
ex_provenance <- function(purpose, n, seed = NULL, consent_status) {
  # your code here
}

ex_manifest <- ex_provenance(
  purpose        = "Test extension",
  n              = 100,
  seed           = 1,
  consent_status = "IRB-approved"
)
ex_manifest$consent_status
#> Expected: "IRB-approved"
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_provenance <- function(purpose, n, seed = NULL, consent_status) {
  list(
    date           = format(Sys.Date(), "%Y-%m-%d"),
    sample_size    = n,
    seed           = seed,
    purpose        = purpose,
    consent_status = consent_status
  )
}
ex_manifest <- ex_provenance("Test", 100, 1, "IRB-approved")
ex_manifest$consent_status
#> [1] "IRB-approved"
```

**Explanation:** Adding a single named field to the list captures the consent status alongside the rest of the manifest. Future readers can grep for it.

</details>

## What does informed consent mean when you only see a CSV?

Most R users never collect data themselves. A colleague hands you a CSV, or you pull a table from a warehouse, and consent feels like someone else's problem. It isn't. Consent becomes a documentation problem: can you trace each row back to a person who agreed to be in your study? If not, that row should not enter your analysis frame.

The simplest enforcement is a `consent_form_id` column and a hard refusal to use rows that lack one. We'll simulate a small medical dataset and show the filter.

```r
raw_data <- tibble(
  participant     = c("P001", "P002", "P003", "P004", "P005"),
  consent_form_id = c("CF-2024", "CF-2031", NA, "CF-2042", ""),
  age             = c(34, 41, 29, 52, 38),
  outcome_score   = c(82, 76, 91, 68, 84)
)

consented <- raw_data |>
  filter(!is.na(consent_form_id), consent_form_id != "")

nrow(raw_data)
#> [1] 5
nrow(consented)
#> [1] 3
consented
#> # A tibble: 3 × 4
#>   participant consent_form_id   age outcome_score
#>   <chr>       <chr>           <dbl>         <dbl>
#> 1 P001        CF-2024            34            82
#> 2 P002        CF-2031            41            76
#> 3 P004        CF-2042            52            68
```

Two rows out of five are gone, P003 had no form, P005 had a blank string. Your analysis runs on three rows now, not five. That feels like a loss, but the alternative is publishing results that include people who never agreed to participate. The filter has to be the very first line of your pipeline, before any joins, imputations, or models.

[WARNING]
**A missing consent ID is not a missing value to impute.** It is a row you must not analyse. Never let `tidyr::replace_na()` or model-based imputation paper over a consent gap, the data point doesn't exist for you.

**Try it:** Tighten the filter to also require that `consent_form_id` matches the regex `^CF-\d{4}$`. Save the result to `ex_consented`.

```r
# Try it: regex-validate consent IDs
ex_consented <- raw_data |>
  filter(
    # your code here
  )

nrow(ex_consented)
#> Expected: 3
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_consented <- raw_data |>
  filter(grepl("^CF-\\d{4}$", consent_form_id))
nrow(ex_consented)
#> [1] 3
```

**Explanation:** `grepl()` returns `TRUE` only when the ID matches the exact pattern `CF-` followed by four digits. Blank strings and NAs both fail the regex, so the filter handles them in one expression.

</details>

## How much of this data should you actually keep?

Data minimization is the principle that you should collect and retain only what your analysis truly needs. Direct identifiers, name, email, social security number, almost never belong in an analysis frame. Indirect identifiers like exact date of birth or full ZIP code often need to be binned or generalised. The rule of thumb: if you can answer your question without a column, drop it.

We'll take the consented dataset, drop the direct-PII columns, and bin `age` into a coarser group so the data carries less re-identification risk.

```r
analysis_data <- consented |>
  mutate(
    pid       = paste0("anon_", match(participant, unique(participant))),
    age_group = cut(
      age,
      breaks = c(0, 30, 45, 60, Inf),
      labels = c("<30", "30-44", "45-59", "60+")
    )
  ) |>
  select(pid, age_group, outcome_score)

ncol(consented)
#> [1] 4
ncol(analysis_data)
#> [1] 3
analysis_data
#> # A tibble: 3 × 3
#>   pid    age_group outcome_score
#>   <chr>  <fct>             <dbl>
#> 1 anon_1 30-44                82
#> 2 anon_2 30-44                76
#> 3 anon_3 45-59                68
```

The `participant` and `consent_form_id` columns are gone. `age` has been replaced by a 4-level factor, and the original `participant` codes are now opaque `anon_*` IDs. The dataset still answers the question "does outcome score differ by age group?", but it can no longer be linked back to a real person without the source-of-truth file.

![Decide what to keep on a per-column basis](screenshots/Data-Ethics-in-R-column-decision.webp)
*Figure 1: Decide what to keep on a per-column basis.*

[TIP]
**When in doubt, drop the column.** You can always rejoin from the source-of-truth file if you need it later, and a column you don't keep can't leak. Storage is cheap, but a re-identification incident is not.

**Try it:** Bin a numeric `income` vector into 5 quintiles using `cut()` + `quantile()`. Save the result to `ex_income_bin`.

```r
# Try it: quintile-bin income
set.seed(1)
income <- round(runif(20, 20000, 120000))

ex_income_bin <- cut(
  # your code here
)

table(ex_income_bin)
#> Expected: a 5-level factor with ~4 obs per level
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_income_bin <- cut(
  income,
  breaks = quantile(income, probs = seq(0, 1, 0.2)),
  include.lowest = TRUE,
  labels = c("Q1", "Q2", "Q3", "Q4", "Q5")
)
table(ex_income_bin)
#> ex_income_bin
#> Q1 Q2 Q3 Q4 Q5
#>  4  4  4  4  4
```

**Explanation:** `quantile()` with `probs = seq(0, 1, 0.2)` returns the cut points for five equal-sized buckets, and `cut()` assigns each value to its bucket. Binning protects identity while preserving rank-order information.

</details>

## How do you know if you're p-hacking by accident?

P-hacking means running many statistical tests and reporting only the ones that crossed `p < 0.05`. R makes this dangerously easy, `cor.test()` and `t.test()` are one line each, and a researcher can chew through fifty comparisons in an afternoon without noticing. The maths guarantees that 5% of those tests will be "significant" by pure chance, even when nothing real is going on.

To make the problem concrete, we'll generate 20 completely random columns, run 19 correlation tests against the first column, and count how many cross the threshold.

```r
set.seed(2026)

random_data <- as.data.frame(matrix(rnorm(100 * 20), ncol = 20))
names(random_data) <- paste0("var", 1:20)

p_values <- sapply(2:20, function(i) {
  cor.test(random_data$var1, random_data[[i]])$p.value
})

length(p_values)
#> [1] 19
sum(p_values < 0.05)
#> [1] 1
round(min(p_values), 4)
#> [1] 0.0188
```

One of the nineteen tests came back with `p = 0.019`, a finding that would look impressive in a paper. But the numbers are pure noise; we drew them from `rnorm()` ourselves. If you ran the experiment, looked at the 19 p-values, and quietly published only the "significant" one, you would be p-hacking. The temptation is enormous because the cherry-picked test really does look real.

![How p-hacking inflates false positives](screenshots/Data-Ethics-in-R-phacking-flow.webp)
*Figure 2: Each independent test contributes a small false-positive risk that compounds.*

The fix isn't to run fewer tests, exploration is legitimate. The fix is to correct the p-values for the number of tests you ran. R has `p.adjust()` built into base stats with several methods; Benjamini-Hochberg (`"BH"`) is the modern default for exploratory work.

```r
p_adj <- p.adjust(p_values, method = "BH")

sum(p_values < 0.05)
#> [1] 1
sum(p_adj < 0.05)
#> [1] 0
round(min(p_adj), 4)
#> [1] 0.358
```

After the BH correction, zero tests survive. The single "significant" hit was inflated by the cost of looking 19 times. This is what an honest report of the experiment looks like: "we tested 19 correlations and none were significant after multiple-comparison correction."

[WARNING]
**The fix isn't to run fewer tests, it's to correct for the ones you ran.** Pre-register your primary hypothesis, then label everything else as exploratory and apply `p.adjust()` to the whole exploration batch.

**Try it:** Apply Bonferroni correction (`method = "bonferroni"`) to `p_values` and count survivors.

```r
# Try it: Bonferroni instead of BH
ex_bonf <- p.adjust(
  # your code here
)

sum(ex_bonf < 0.05)
#> Expected: 0
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_bonf <- p.adjust(p_values, method = "bonferroni")
sum(ex_bonf < 0.05)
#> [1] 0
```

**Explanation:** Bonferroni multiplies each p-value by the number of tests, which is the most conservative correction. BH is more powerful for exploratory work; Bonferroni is appropriate when even one false positive is unacceptable.

</details>

## How do you report results without misleading anyone?

A bare p-value is the most misleading number you can report. It answers "would I see something this extreme by chance?" but says nothing about how big the effect is or whether it matters. The honest minimum is four numbers together: the effect size, a confidence interval, the sample size, and the p-value.

We'll simulate a small A/B test on conversion times, run a t-test, and pack everything we need into a single tibble row. The shape matters: one row, five columns, no hidden cherry-picking.

```r
set.seed(7)

group_a <- rnorm(40, mean = 12.0, sd = 2.5)
group_b <- rnorm(40, mean = 13.1, sd = 2.5)

tt <- t.test(group_b, group_a)

pooled_sd <- sqrt((sd(group_a)^2 + sd(group_b)^2) / 2)
cohens_d  <- (mean(group_b) - mean(group_a)) / pooled_sd

ab_result <- tibble(
  mean_diff = round(mean(group_b) - mean(group_a), 2),
  ci_low    = round(tt$conf.int[1], 2),
  ci_high   = round(tt$conf.int[2], 2),
  cohens_d  = round(cohens_d, 2),
  n         = length(group_a) + length(group_b),
  p_value   = round(tt$p.value, 3)
)

ab_result
#> # A tibble: 1 × 6
#>   mean_diff ci_low ci_high cohens_d     n p_value
#>       <dbl>  <dbl>   <dbl>    <dbl> <int>   <dbl>
#> 1      0.97   0.06    1.88     0.42    80   0.037
```

The mean difference is about 1 second, the 95% confidence interval runs from 0.06 to 1.88, and Cohen's d is 0.42, a small-to-medium effect. The p-value is 0.037, which would headline as "significant," but the wide CI tells a more honest story: the real effect could be almost zero or it could be nearly two seconds. Reporting all five numbers lets a reader judge for themselves.

[KEY INSIGHT]
**A p-value answers "how surprising?" An effect size answers "how much?"** Reports without both are half-honest. A reader who sees only the p-value cannot tell whether you found a tiny effect in a huge sample or a real effect in a small one.

**Try it:** Add a `practical_significance` column to `ab_result` that is `TRUE` when `abs(cohens_d) > 0.2`.

```r
# Try it: flag practical significance
ex_flag <- ab_result |>
  mutate(
    # your code here
  )

ex_flag$practical_significance
#> Expected: TRUE
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_flag <- ab_result |>
  mutate(practical_significance = abs(cohens_d) > 0.2)
ex_flag$practical_significance
#> [1] TRUE
```

**Explanation:** Cohen's conventions call 0.2 a "small" effect, 0.5 "medium," and 0.8 "large." Anchoring the flag to a published threshold makes the cutoff defensible.

</details>

## How do you check your model for harmful bias?

A model can be 90% accurate overall and still fail catastrophically for one subgroup. Aggregate accuracy is the metric most likely to hide harm because it averages over the people the model works for and the people it doesn't. The check is straightforward: compute the same metric per group and look at the gap.

We'll simulate a binary-classification scenario with two demographic groups, then disaggregate accuracy and false-negative rate.

```r
set.seed(99)

n_per_group <- 200
model_eval <- tibble(
  group      = rep(c("group_a", "group_b"), each = n_per_group),
  truth      = rbinom(2 * n_per_group, 1, 0.5),
  prediction = c(
    rbinom(n_per_group, 1, 0.92),
    rbinom(n_per_group, 1, 0.74)
  )
)

group_metrics <- model_eval |>
  group_by(group) |>
  summarise(
    accuracy = mean(prediction == truth),
    fnr      = sum(truth == 1 & prediction == 0) / sum(truth == 1)
  )

group_metrics
#> # A tibble: 2 × 3
#>   group   accuracy   fnr
#>   <chr>      <dbl> <dbl>
#> 1 group_a    0.495 0.467
#> 2 group_b    0.5   0.515
```

The two accuracy numbers look close in this synthetic example, but the false-negative rate gap (0.47 vs 0.52) means group_b is missed more often. In a medical-screening context that gap is the difference between catching a disease and sending a patient home. Reporting only the average of 49.7% would erase the disparity entirely. The fix isn't fancier maths; it's the habit of always disaggregating before you ship.

[WARNING]
**Aggregate accuracy hides subgroup harm.** Always disaggregate metrics by sensitive attribute before shipping a model, and report the gap explicitly, not just the headline number.

**Try it:** Add a `fpr` (false-positive rate) column to `group_metrics`.

```r
# Try it: false-positive rate per group
ex_fpr <- model_eval |>
  group_by(group) |>
  summarise(
    # your code here
  )

ex_fpr
#> Expected: tibble with group and fpr columns
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_fpr <- model_eval |>
  group_by(group) |>
  summarise(
    fpr = sum(truth == 0 & prediction == 1) / sum(truth == 0)
  )
ex_fpr
#> # A tibble: 2 × 2
#>   group     fpr
#>   <chr>   <dbl>
#> 1 group_a 0.529
#> 2 group_b 0.485
```

**Explanation:** False-positive rate divides predicted-positive cases that were actually negative by all true negatives. Together with FNR it gives a complete picture of where the model is wrong, by group.

</details>

## Practice Exercises

These three exercises combine multiple concepts from the tutorial into harder challenges. Each uses `pe*` variable names so it won't clobber the tutorial state above.

### Exercise 1: Build a consent-and-minimize pipeline

Given a six-column raw dataframe, return a three-column analysis frame that keeps only consented rows and pseudonymizes the participant column.

```r
# Exercise 1: filter consented + minimize columns
pe1_raw <- tibble(
  name            = c("Alice", "Bob", "Carol", "Dan"),
  email           = c("a@x", "b@x", "c@x", "d@x"),
  consent_form_id = c("CF-1", NA, "CF-3", "CF-4"),
  age             = c(28, 33, 41, 55),
  region          = c("N", "S", "N", "E"),
  score           = c(72, 88, 65, 90)
)

# Hint: filter consent, then mutate a pid, then select 3 columns
pe1_result <- pe1_raw |>
  # your code here

pe1_result
```

<details>
<summary>Click to reveal solution</summary>

```r
pe1_result <- pe1_raw |>
  filter(!is.na(consent_form_id)) |>
  mutate(pid = paste0("anon_", row_number())) |>
  select(pid, age, score)

pe1_result
#> # A tibble: 3 × 3
#>   pid      age score
#>   <chr>  <dbl> <dbl>
#> 1 anon_1    28    72
#> 2 anon_2    41    65
#> 3 anon_3    55    90
```

**Explanation:** The pipeline applies the two ethical rules in order: drop rows without consent first, then strip every column you can without losing your analysis. `row_number()` after the filter guarantees the pseudonyms are sequential and unlinked to anything in the source.

</details>

### Exercise 2: P-hacking auditor function

Write a function `pe2_audit(p_values)` that returns a one-row tibble with the count of p-values that survive at `p < 0.05` under three regimes: no correction, Bonferroni, and BH.

```r
# Exercise 2: audit a vector of p-values
set.seed(42)
pe2_inputs <- runif(30, 0, 1)  # 30 random p-values

pe2_audit <- function(p_values) {
  # your code here
}

pe2_audit(pe2_inputs)
```

<details>
<summary>Click to reveal solution</summary>

```r
pe2_audit <- function(p_values) {
  tibble(
    none       = sum(p_values < 0.05),
    bonferroni = sum(p.adjust(p_values, "bonferroni") < 0.05),
    bh         = sum(p.adjust(p_values, "BH") < 0.05)
  )
}

pe2_audit(pe2_inputs)
#> # A tibble: 1 × 3
#>    none bonferroni    bh
#>   <int>      <int> <int>
#> 1     2          0     0
```

**Explanation:** Wrapping `p.adjust()` in a named tibble lets you compare correction methods at a glance. The "none" column shows how many false positives you'd get without correction; the other columns show how each method protects you.

</details>

### Exercise 3: Subgroup bias gap calculator

Write a function `pe3_gap(predictions, truth, group)` that returns the absolute accuracy gap between two groups and a `flag` field that is `TRUE` when the gap exceeds 0.05.

```r
# Exercise 3: bias gap calculator
set.seed(11)
pe3_pred  <- c(rbinom(100, 1, 0.9), rbinom(100, 1, 0.7))
pe3_truth <- c(rbinom(100, 1, 0.5), rbinom(100, 1, 0.5))
pe3_group <- rep(c("A", "B"), each = 100)

pe3_gap <- function(predictions, truth, group) {
  # your code here
}

pe3_gap(pe3_pred, pe3_truth, pe3_group)
```

<details>
<summary>Click to reveal solution</summary>

```r
pe3_gap <- function(predictions, truth, group) {
  acc <- tapply(predictions == truth, group, mean)
  gap <- abs(diff(acc))
  list(
    accuracies = acc,
    gap        = round(unname(gap), 3),
    flag       = unname(gap) > 0.05
  )
}

pe3_gap(pe3_pred, pe3_truth, pe3_group)
#> $accuracies
#>     A     B
#> 0.450 0.500
#>
#> $gap
#> [1] 0.05
#>
#> $flag
#> [1] FALSE
```

**Explanation:** `tapply()` computes a per-group mean of the boolean accuracy vector. `diff()` gives the difference between the two groups, and `abs()` makes it order-independent. The 0.05 threshold is arbitrary, pick one your stakeholders understand.

</details>

## Putting It All Together: An Ethical Analysis Workflow

This final example chains every habit from the tutorial into a single readable pipeline. It starts with raw data that contains PII and missing consent, runs it through filtering, minimization, analysis, and a subgroup audit, then prints a final report.

```r
set.seed(2026)

raw_pipeline <- tibble(
  name            = paste0("user_", 1:60),
  consent_form_id = c(rep("CF-OK", 55), rep(NA, 5)),
  age             = sample(20:70, 60, replace = TRUE),
  group           = rep(c("A", "B"), each = 30),
  outcome         = c(rnorm(30, 10, 2), rnorm(30, 11, 2)),
  predicted_pos   = rbinom(60, 1, 0.7)
)

clean <- raw_pipeline |>
  filter(!is.na(consent_form_id)) |>
  mutate(pid = paste0("anon_", row_number())) |>
  select(pid, age, group, outcome, predicted_pos)

t_out <- t.test(outcome ~ group, data = clean)
gap <- clean |>
  group_by(group) |>
  summarise(pos_rate = mean(predicted_pos)) |>
  pull(pos_rate) |>
  diff() |>
  abs() |>
  round(3)

final_report <- list(
  manifest        = data_provenance("Workflow demo", nrow(clean), seed = 2026),
  rows_dropped    = nrow(raw_pipeline) - nrow(clean),
  mean_difference = round(unname(diff(t_out$estimate)), 2),
  ci              = round(t_out$conf.int, 2),
  p_value         = round(t_out$p.value, 3),
  subgroup_gap    = gap
)

final_report
#> $manifest
#> $manifest$date
#> [1] "2026-04-14"
#> ...
#>
#> $rows_dropped
#> [1] 5
#>
#> $mean_difference
#> [1] 1.34
#>
#> $ci
#> [1] 0.42 2.26
#>
#> $p_value
#> [1] 0.005
#>
#> $subgroup_gap
#> [1] 0.067
```

The report contains everything an external reviewer would ask for: the provenance manifest, how many rows were dropped for missing consent, the effect size with confidence interval, the p-value, and the subgroup gap. None of those numbers required a new package, every step uses base R or dplyr. Ethical analysis isn't a separate workflow; it's a normal workflow with a few habits added.

## Summary

Six questions cover the full lifecycle, from raw CSV to shipped model. Each maps to one or two R idioms you already know.

| Question | R tool | Why it matters |
|---|---|---|
| Was this collected with consent? | `filter()` on consent ID | No consent → no analysis |
| Is every column needed? | `select()`, `cut()`, `match()` | PII you don't keep can't leak |
| Did you correct for multiple tests? | `p.adjust()` | Stops false positives compounding |
| Did you report effect size + CI? | `t.test()`, `tibble()` | A p-value alone misleads |
| Does the model work for everyone? | `group_by() \|> summarise()` | Aggregate metrics hide harm |
| Can someone reproduce this? | `set.seed()`, provenance log | Reproducibility is the ethical floor |

![Data ethics for R: six questions overview](screenshots/Data-Ethics-in-R-overview.webp)
*Figure 3: The six questions every R analysis should answer before it ships.*

## References

1. Baumer, B. S., Garcia, R. L., Kim, A. Y., Kinnaird, K. M., & Ott, M. Q., *Modern Data Science with R*, 3rd ed., Chapter 8: "Data science ethics." [Link](https://mdsr-book.github.io/mdsr3e/08-ethics.html)
2. Royal Statistical Society, *A Guide for Ethical Data Science* (2019). [Link](https://rss.org.uk/RSS/media/News-and-publications/Publications/Reports%20and%20guides/A-Guide-for-Ethical-Data-Science-Final-Oct-2019.pdf)
3. Wickham, H. & Grolemund, G., *R for Data Science*, 2nd ed. [Link](https://r4ds.hadley.nz/)
4. Benjamin, D. J., et al., "Redefine statistical significance." *Nature Human Behaviour* (2018). [Link](https://www.nature.com/articles/s41562-017-0189-z)
5. Floridi, L. & Taddeo, M., "What is data ethics?" *Phil. Trans. R. Soc. A* (2016). [Link](https://royalsocietypublishing.org/doi/10.1098/rsta.2016.0360)
6. R documentation, `p.adjust()` reference. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/p.adjust.html)
7. Wickham, H., *Advanced R*, 2nd ed. [Link](https://adv-r.hadley.nz/)

## Continue Learning

- [Bias in Data and Models](Bias-in-Data-and-Models.html), How to detect and reduce bias in your analyses, with worked examples.
- [Reproducibility Crisis](Reproducibility-Crisis.html), What went wrong in modern science and how R tools help fix it.
- [Data Privacy in R](Data-Privacy-in-R.html), Anonymization, differential privacy, and GDPR compliance for R users.
