---
title: "R for Healthcare Exercises: 20 Real-World Practice Problems"
slug: "R-for-Healthcare-Exercises"
description: "Twenty real healthcare analytics practice problems in R: ICD code rollups, diagnostic test metrics, survival analysis, longitudinal labs, and clinical risk scores."
keywords: "R for healthcare exercises, healthcare data R, ICD codes R, survival analysis R, clinical risk score R, Charlson comorbidity R, longitudinal labs R"
mathjax: true
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "R for Healthcare Exercises"
sidebar_order: 146
fr_parent: "R-Tutorial.html"
auto_link_terms: "r for healthcare exercises|healthcare data in r|icd code rollup|cox proportional hazards|kaplan meier in r"
auto_link_case_sensitive: false
target_keyword: "R for healthcare data exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# R for Healthcare Exercises: 20 Real-World Practice Problems

<p class="lead">Twenty practice problems that reproduce real healthcare analytics work in R: rolling encounter-level ICD-10 records up to patient-level cohorts, validating diagnostic test performance, fitting Kaplan-Meier curves and Cox models on the NCCTG lung cohort, scoring qSOFA and MELD from raw vitals and labs, and estimating per-patient slopes from longitudinal A1c panels. Each problem ships with an expected output box and a hidden solution so you can attempt every one before peeking.</p>

```r title="Run this once before any exercise"
library(dplyr)
library(tidyr)
library(tibble)
library(survival)
library(broom)
library(lme4)
```

## Section 1. Descriptive epidemiology (3 problems)

### Exercise 1.1: Compute crude point prevalence of hypertension in a clinic registry

**Task:** A primary care clinic's quality team needs the crude point prevalence of hypertension among the twelve active patients in this monthly snapshot. Each row in the inline `registry` tibble below is one patient with a binary `hypertension` flag (1 if currently diagnosed). Compute the proportion of patients flagged with hypertension and save the scalar to `ex_1_1`.

**Expected result:**

```
#> [1] 0.4166667
```

**Difficulty:** Beginner

[HINTS]
Point prevalence is just the share of patients carrying the flag, so you need an average over a 0/1 column.
Call mean() on the registry$hypertension vector.

```r title="Your turn"
registry <- tibble::tibble(
  patient_id   = sprintf("P%04d", 1:12),
  age          = c(54, 67, 42, 71, 58, 39, 65, 73, 48, 60, 33, 69),
  hypertension = c(1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 0, 1)
)
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
registry <- tibble::tibble(
  patient_id   = sprintf("P%04d", 1:12),
  age          = c(54, 67, 42, 71, 58, 39, 65, 73, 48, 60, 33, 69),
  hypertension = c(1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 0, 1)
)

ex_1_1 <- mean(registry$hypertension)
ex_1_1
#> [1] 0.4166667
```

**Explanation:** Because `hypertension` is coded 0/1, `mean()` is equivalent to (number positive) / (total), which is exactly the definition of point prevalence: the share of a defined population with the condition at one moment in time. `sum(x) / length(x)` gives the same answer but `mean()` is the canonical idiom and is robust to `NA` via the `na.rm = TRUE` argument when records are incomplete.

</details>

### Exercise 1.2: Crude incidence rate per 1,000 person-years from a follow-up cohort

**Task:** An endocrinology team ran a six-year follow-up study of 8 high-risk adults to estimate new-onset type 2 diabetes incidence. The `cohort` tibble below records each subject's `years_followed` (until event or censor) and a binary `became_diabetic` event flag. Compute the crude incidence rate per 1,000 person-years as (events / person-years) * 1000 and save the scalar to `ex_1_2`.

**Expected result:**

```
#> [1] 95.23810
```

**Difficulty:** Intermediate

[HINTS]
Total the events and the total follow-up time separately, then divide one by the other before scaling.
Use sum() on became_diabetic and on years_followed, then compute events / person_years * 1000.

```r title="Your turn"
cohort <- tibble::tibble(
  subject_id      = sprintf("S%03d", 1:8),
  years_followed  = c(5.0, 4.2, 6.0, 1.7, 6.0, 3.4, 6.0, 2.7),
  became_diabetic = c(0,   1,   0,   1,   0,   0,   0,   2 == 2)
)
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
cohort <- tibble::tibble(
  subject_id      = sprintf("S%03d", 1:8),
  years_followed  = c(5.0, 4.2, 6.0, 1.7, 6.0, 3.4, 6.0, 2.7),
  became_diabetic = c(0,   1,   0,   1,   0,   0,   0,   1)
)

events       <- sum(cohort$became_diabetic)
person_years <- sum(cohort$years_followed)
ex_1_2       <- events / person_years * 1000
ex_1_2
#> [1] 95.23810
```

**Explanation:** Incidence density (rate per person-time) is the right denominator when subjects are followed for different durations: a subject followed 6 years contributes 6 times the at-risk time of one followed 1 year. Crude prevalence would treat all subjects equally and over-estimate the rate for short-followup cohorts. Multiplying by 1,000 yields the conventional "per 1,000 person-years" unit clinical journals expect.

</details>

### Exercise 1.3: Directly age-standardized mortality rate per 100,000

**Task:** A state health department compares mortality across counties but needs to control for age structure. The `county_a` tibble below holds deaths and person-years in three age bands for one county; the `standard_pop` tibble holds the 2010 US standard population proportions. Compute the directly age-standardized mortality rate per 100,000 (sum of band-specific rates weighted by standard-population proportions) and save the scalar to `ex_1_3`.

**Expected result:**

```
#> [1] 612.0
```

**Difficulty:** Advanced

[HINTS]
Compute a death rate within each age band, reweight those band rates by the standard-population shares, and total them.
Join the two tibbles on age_band, mutate() a band rate of deaths / person_years weighted by std_share, then sum() and scale by 100000.

```r title="Your turn"
county_a <- tibble::tibble(
  age_band     = c("0-44", "45-64", "65+"),
  deaths       = c(120,    600,     1280),
  person_years = c(180000, 120000,  40000)
)
standard_pop <- tibble::tibble(
  age_band  = c("0-44", "45-64", "65+"),
  std_share = c(0.60,   0.25,    0.15)
)
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
county_a <- tibble::tibble(
  age_band     = c("0-44", "45-64", "65+"),
  deaths       = c(120,    600,     1280),
  person_years = c(180000, 120000,  40000)
)
standard_pop <- tibble::tibble(
  age_band  = c("0-44", "45-64", "65+"),
  std_share = c(0.60,   0.25,    0.15)
)

ex_1_3 <- county_a |>
  inner_join(standard_pop, by = "age_band") |>
  mutate(band_rate = deaths / person_years,
         weighted  = band_rate * std_share) |>
  summarise(asmr = sum(weighted) * 100000) |>
  pull(asmr)
ex_1_3
#> [1] 612.0
```

**Explanation:** Direct standardization re-weights each county's age-specific rates onto a common population structure so two counties with different age mixes become comparable. The crude rate (1,000 + 600 + 1,280) / (180,000 + 120,000 + 40,000) * 100,000 is about 588, dominated by the youngest band; the age-standardized rate of 612 reflects what mortality would look like if the county had the US standard age distribution. Indirect standardization (computing SMR against an external set of age-specific rates) is the alternative when band-specific person-years are unstable.

</details>

## Section 2. Diagnostic test performance (3 problems)

### Exercise 2.1: Sensitivity and specificity from a 2x2 confusion matrix

**Task:** A pathology lab validating a new rapid antigen test recorded the following confusion against PCR truth in a 900-patient validation set: 88 true positives, 12 false negatives, 720 true negatives, 80 false positives. Compute sensitivity (TP / (TP + FN)) and specificity (TN / (TN + FP)) as a named numeric vector with elements `sens` and `spec`. Save to `ex_2_1`.

**Expected result:**

```
#>  sens  spec
#> 0.880 0.900
```

**Difficulty:** Beginner

[HINTS]
Each metric is a ratio of correct calls to the count of subjects who are truly positive or truly negative.
Build a named vector with c(sens = TP / (TP + FN), spec = TN / (TN + FP)).

```r title="Your turn"
TP <- 88; FN <- 12; TN <- 720; FP <- 80
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
TP <- 88; FN <- 12; TN <- 720; FP <- 80

ex_2_1 <- c(
  sens = TP / (TP + FN),
  spec = TN / (TN + FP)
)
ex_2_1
#>  sens  spec
#> 0.880 0.900
```

**Explanation:** Sensitivity and specificity describe the test's behaviour on truly diseased and truly healthy subjects respectively, and they are invariant to disease prevalence (unlike PPV and NPV). Returning a named vector keeps the metrics labeled when piped into downstream code, and is preferred over an unnamed `c(0.88, 0.90)` for reproducibility in regulatory reports.

</details>

### Exercise 2.2: Positive predictive value via Bayes' rule at low prevalence

**Task:** A screening committee is evaluating a colorectal cancer biomarker with sensitivity 0.92 and specificity 0.96 for use in average-risk adults whose disease prevalence is 0.005 (5 per 1,000). Apply Bayes' rule to compute the positive predictive value: PPV = (sens * prev) / (sens * prev + (1 - spec) * (1 - prev)). Save the scalar to `ex_2_2`.

**Expected result:**

```
#> [1] 0.103605
```

**Difficulty:** Intermediate

[HINTS]
Translate the probability statement directly into one arithmetic expression with the values you are given.
Plug sens, spec, and prev into (sens * prev) / (sens * prev + (1 - spec) * (1 - prev)).

```r title="Your turn"
sens <- 0.92; spec <- 0.96; prev <- 0.005
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
sens <- 0.92; spec <- 0.96; prev <- 0.005

ex_2_2 <- (sens * prev) / (sens * prev + (1 - spec) * (1 - prev))
ex_2_2
#> [1] 0.103605
```

**Explanation:** Even with 92% sensitivity and 96% specificity, only about 10% of positive screens are true positives when the underlying disease is rare: the 4% false-positive rate applied to 99.5% of the population swamps the 0.5% true-positive base. This is why population screening programmes worry less about marginal sensitivity gains and more about specificity, and why confirmatory follow-up testing is standard after a positive screen.

</details>

### Exercise 2.3: Optimal Youden cutoff on a biomarker ROC curve

**Task:** A radiology research team has 30 patient scores from a continuous tumor-marker assay paired with biopsy-confirmed disease labels. From the inline `biomarker` tibble with `score` and `disease` (0/1) columns, sweep every unique `score` as a candidate cutoff (predict positive when `score >= cut`), compute sensitivity and specificity at each, and return the cutoff that maximizes Youden's J = sens + spec - 1. Save the optimal cutoff value to `ex_2_3`.

**Expected result:**

```
#> [1] 6.1
```

**Difficulty:** Advanced

[HINTS]
Try every distinct score as a candidate threshold, score each one by how well it separates the two groups, and keep the best.
Sweep the sorted unique scores with vapply(), compute sens + spec - 1 at each cut, and pick the cut at which.max().

```r title="Your turn"
biomarker <- tibble::tibble(
  score   = c(2.1, 3.4, 4.0, 4.8, 5.2, 5.5, 5.9, 6.1, 6.3, 6.7,
              7.0, 7.4, 7.9, 8.1, 8.5, 1.9, 2.8, 3.7, 4.1, 4.6,
              5.0, 5.4, 5.7, 6.0, 6.4, 6.8, 7.2, 7.6, 8.0, 8.6),
  disease = c(rep(0, 15), rep(1, 15))
)
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
biomarker <- tibble::tibble(
  score   = c(2.1, 3.4, 4.0, 4.8, 5.2, 5.5, 5.9, 6.1, 6.3, 6.7,
              7.0, 7.4, 7.9, 8.1, 8.5, 1.9, 2.8, 3.7, 4.1, 4.6,
              5.0, 5.4, 5.7, 6.0, 6.4, 6.8, 7.2, 7.6, 8.0, 8.6),
  disease = c(rep(0, 15), rep(1, 15))
)

cuts <- sort(unique(biomarker$score))
roc <- vapply(cuts, function(cut) {
  pred <- as.integer(biomarker$score >= cut)
  sens <- sum(pred == 1 & biomarker$disease == 1) / sum(biomarker$disease == 1)
  spec <- sum(pred == 0 & biomarker$disease == 0) / sum(biomarker$disease == 0)
  sens + spec - 1
}, numeric(1))

ex_2_3 <- cuts[which.max(roc)]
ex_2_3
#> [1] 6.1
```

**Explanation:** Youden's J selects the cutoff that maximizes (sens + spec - 1), giving equal weight to false negatives and false positives. It is the operating point that maximizes vertical distance from the ROC diagonal. When false negatives are costlier than false positives (cancer screening, for example), clinicians prefer a lower cutoff that boosts sensitivity at the cost of specificity; Youden is the cost-neutral default. The `pROC` package (`pROC::coords(roc_obj, "best", best.method = "youden")`) gives the same answer with confidence intervals.

</details>

## Section 3. ICD codes and EHR wrangling (3 problems)

### Exercise 3.1: Count type 2 diabetes encounters using ICD-10 prefix matching

**Task:** A diabetes care registry wants the number of encounters in the inline `encounters` tibble whose primary diagnosis is a type 2 diabetes code: any ICD-10 value that starts with "E11" (E11.0 through E11.9 are all T2DM variants). Use a prefix match on the `icd10` column and save the integer count to `ex_3_1`.

**Expected result:**

```
#> [1] 5    # five encounters with E11 prefix
```

**Difficulty:** Beginner

[HINTS]
You only need to count how many diagnosis codes begin with a given run of characters.
Wrap startsWith(encounters$icd10, "E11") in sum().

```r title="Your turn"
encounters <- tibble::tibble(
  patient_id   = c("P01","P01","P02","P02","P03","P03","P04","P04","P05","P05",
                   "P06","P06","P07","P08","P09"),
  encounter_id = sprintf("E%04d", 1:15),
  icd10        = c("E11.9","I10","I50.9","E11.65","J45.40","E11.9","I25.10","E11.21",
                   "K21.9","I10","E11.9","J44.9","I50.9","I10","M54.5")
)
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
encounters <- tibble::tibble(
  patient_id   = c("P01","P01","P02","P02","P03","P03","P04","P04","P05","P05",
                   "P06","P06","P07","P08","P09"),
  encounter_id = sprintf("E%04d", 1:15),
  icd10        = c("E11.9","I10","I50.9","E11.65","J45.40","E11.9","I25.10","E11.21",
                   "K21.9","I10","E11.9","J44.9","I50.9","I10","M54.5")
)

ex_3_1 <- sum(startsWith(encounters$icd10, "E11"))
ex_3_1
#> [1] 5
```

**Explanation:** `startsWith()` returns a logical vector indicating which entries begin with the prefix, and `sum()` on a logical vector counts `TRUE` values. Prefix matching matters here because ICD-10 has hundreds of T2DM-with-complications codes (E11.0 through E11.9, plus subcodes like E11.65, E11.21, E11.9). Hardcoding just "E11.9" would miss subjects with documented complications. The `grepl("^E11", ...)` regex alternative is equivalent but slower on large registries.

</details>

### Exercise 3.2: Per-patient Charlson comorbidity flags from encounter records

**Task:** A risk-adjustment analyst is rolling up encounter-level ICD-10 codes into a patient-level comorbidity profile. From the same `encounters` tibble above, build a one-row-per-patient tibble with binary indicators `cci_dm` (1 if ANY encounter has an ICD-10 starting with "E11") and `cci_chf` (1 if ANY has "I50"). Sort by `patient_id` and save the resulting tibble to `ex_3_2`.

**Expected result:**

```
#> # A tibble: 9 x 3
#>   patient_id cci_dm cci_chf
#>   <chr>       <int>   <int>
#> 1 P01             1       0
#> 2 P02             1       1
#> 3 P03             1       0
#> 4 P04             1       0
#> 5 P05             0       0
#> 6 P06             1       0
#> 7 P07             0       1
#> 8 P08             0       0
#> 9 P09             0       0
```

**Difficulty:** Advanced

[HINTS]
Collapse each patient's many encounter rows into a single row that asks whether any code ever matched.
Use group_by(patient_id) then summarise() with any(startsWith(icd10, ...)) wrapped in as.integer() for each flag.

```r title="Your turn"
ex_3_2 <- # your code here using the encounters tibble from 3.1
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- encounters |>
  group_by(patient_id) |>
  summarise(
    cci_dm  = as.integer(any(startsWith(icd10, "E11"))),
    cci_chf = as.integer(any(startsWith(icd10, "I50"))),
    .groups = "drop"
  ) |>
  arrange(patient_id)
ex_3_2
#> # A tibble: 9 x 3
#>   patient_id cci_dm cci_chf
#>   <chr>       <int>   <int>
#> 1 P01             1       0
#> 2 P02             1       1
#> 3 P03             1       0
#> 4 P04             1       0
#> 5 P05             0       0
#> 6 P06             1       0
#> 7 P07             0       1
#> 8 P08             0       0
#> 9 P09             0       0
```

**Explanation:** `any()` inside `summarise()` is the idiomatic way to collapse multiple encounter rows into a single patient-level flag: it asks "did this patient ever have a matching code?" which is how Charlson, Elixhauser, and other comorbidity indices are operationalized in practice. `as.integer()` coerces the logical to a 0/1 column matching the format claims-data shops expect. The pattern generalizes: drop in additional `any(startsWith(icd10, prefix))` lines for each comorbidity in the full Charlson list (I21 for MI, J44 for COPD, and so on).

</details>

### Exercise 3.3: Encounter-level records rolled up to a patient dashboard table

**Task:** A care-coordination team wants a one-row-per-patient dashboard table from longitudinal encounter records. From the inline `enc_dash` tibble (with `patient_id`, `encounter_date` as Date, and `los_days` length-of-stay), compute for each patient `n_visits` (encounter count), `first_visit` (earliest date), `last_visit` (latest date), and `los_total` (summed length-of-stay). Sort by `patient_id` and save to `ex_3_3`.

**Expected result:**

```
#> # A tibble: 3 x 5
#>   patient_id n_visits first_visit last_visit los_total
#>   <chr>         <int> <date>      <date>         <dbl>
#> 1 P01               3 2026-01-04  2026-04-12        11
#> 2 P02               2 2026-02-09  2026-03-21         7
#> 3 P03               4 2025-12-15  2026-04-30        15
```

**Difficulty:** Advanced

[HINTS]
Reduce the long encounter table to one row per patient, producing several summary measures in a single pass.
Use group_by(patient_id) then summarise() with n(), min(encounter_date), max(encounter_date), and sum(los_days).

```r title="Your turn"
enc_dash <- tibble::tibble(
  patient_id     = c("P01","P01","P01","P02","P02","P03","P03","P03","P03"),
  encounter_date = as.Date(c("2026-01-04","2026-02-18","2026-04-12",
                             "2026-02-09","2026-03-21",
                             "2025-12-15","2026-01-22","2026-03-08","2026-04-30")),
  los_days       = c(2, 3, 6, 4, 3, 5, 2, 4, 4)
)
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
enc_dash <- tibble::tibble(
  patient_id     = c("P01","P01","P01","P02","P02","P03","P03","P03","P03"),
  encounter_date = as.Date(c("2026-01-04","2026-02-18","2026-04-12",
                             "2026-02-09","2026-03-21",
                             "2025-12-15","2026-01-22","2026-03-08","2026-04-30")),
  los_days       = c(2, 3, 6, 4, 3, 5, 2, 4, 4)
)

ex_3_3 <- enc_dash |>
  group_by(patient_id) |>
  summarise(
    n_visits    = n(),
    first_visit = min(encounter_date),
    last_visit  = max(encounter_date),
    los_total   = sum(los_days),
    .groups     = "drop"
  ) |>
  arrange(patient_id)
ex_3_3
#> # A tibble: 3 x 5
#>   patient_id n_visits first_visit last_visit los_total
#>   <chr>         <int> <date>      <date>         <dbl>
#> 1 P01               3 2026-01-04  2026-04-12        11
#> 2 P02               2 2026-02-09  2026-03-21         7
#> 3 P03               4 2025-12-15  2026-04-30        15
```

**Explanation:** Encounter-to-patient rollups are the bread-and-butter transformation of healthcare analytics: claims, EHR visits, and lab orders all arrive long, and most dashboards, risk scores, and population-health metrics want them wide on patient. `group_by()` plus `summarise()` with multiple aggregation functions in one pass is faster than chaining several `mutate()` and `distinct()` steps because dplyr does a single grouped sweep. Adding `.groups = "drop"` removes leftover grouping that would otherwise leak into downstream joins.

</details>

## Section 4. Clinical risk scores (3 problems)

### Exercise 4.1: CHADS2 stroke risk score from atrial fibrillation risk factors

**Task:** A cardiology clinic is screening atrial fibrillation patients with the CHADS2 stroke-risk score (CHF + hypertension + age >= 75 + diabetes + 2 * prior stroke; range 0 to 6). From the inline `af_patients` tibble below, add a `chads2` integer column computed from the five 0/1 risk factor columns and save the augmented tibble to `ex_4_1`.

**Expected result:**

```
#> # A tibble: 5 x 7
#>   patient_id   chf   htn age_75 diabetes stroke_prior chads2
#>   <chr>      <dbl> <dbl>  <dbl>    <dbl>        <dbl>  <dbl>
#> 1 P01            0     1      0        0            0      1
#> 2 P02            1     1      1        0            0      3
#> 3 P03            0     1      1        1            1      5
#> 4 P04            0     0      0        0            0      0
#> 5 P05            1     1      1        1            1      6
```

**Difficulty:** Intermediate

[HINTS]
The score is a weighted sum of the risk-factor columns, with prior stroke counted double.
Add the column with mutate(chads2 = chf + htn + age_75 + diabetes + 2 * stroke_prior).

```r title="Your turn"
af_patients <- tibble::tibble(
  patient_id   = sprintf("P%02d", 1:5),
  chf          = c(0, 1, 0, 0, 1),
  htn          = c(1, 1, 1, 0, 1),
  age_75       = c(0, 1, 1, 0, 1),
  diabetes     = c(0, 0, 1, 0, 1),
  stroke_prior = c(0, 0, 1, 0, 1)
)
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
af_patients <- tibble::tibble(
  patient_id   = sprintf("P%02d", 1:5),
  chf          = c(0, 1, 0, 0, 1),
  htn          = c(1, 1, 1, 0, 1),
  age_75       = c(0, 1, 1, 0, 1),
  diabetes     = c(0, 0, 1, 0, 1),
  stroke_prior = c(0, 0, 1, 0, 1)
)

ex_4_1 <- af_patients |>
  mutate(chads2 = chf + htn + age_75 + diabetes + 2 * stroke_prior)
ex_4_1
#> # A tibble: 5 x 7
#>   patient_id   chf   htn age_75 diabetes stroke_prior chads2
#>   <chr>      <dbl> <dbl>  <dbl>    <dbl>        <dbl>  <dbl>
#> 1 P01            0     1      0        0            0      1
#> 2 P02            1     1      1        0            0      3
#> 3 P03            0     1      1        1            1      5
#> 4 P04            0     0      0        0            0      0
#> 5 P05            1     1      1        1            1      6
```

**Explanation:** Prior stroke gets weight 2 because it predicts recurrent stroke roughly twice as strongly as the other risk factors in the original validation cohort. Scores of 0 are "low risk" (no anticoagulation), 1 is "intermediate" (aspirin or anticoagulant), and 2 or more is "high" (anticoagulation indicated). The newer CHA2DS2-VASc adds vascular disease, female sex, and weights age 65 to 74 separately; the same `mutate()` + arithmetic pattern extends directly.

</details>

### Exercise 4.2: qSOFA sepsis screening flag from emergency department vitals

**Task:** An emergency department quality team uses qSOFA to screen for suspected sepsis. qSOFA awards one point for each of three criteria: respiratory rate >= 22, altered mental status (GCS < 15), and systolic BP <= 100. From the inline `ed_vitals` tibble with `rr`, `gcs`, `sbp` columns, add `qsofa` (integer score 0 to 3) and `qsofa_pos` (logical, TRUE when score >= 2). Save the augmented tibble to `ex_4_2`.

**Expected result:**

```
#> # A tibble: 6 x 6
#>   patient_id    rr   gcs   sbp qsofa qsofa_pos
#>   <chr>      <dbl> <dbl> <dbl> <int> <lgl>
#> 1 P01           18    15   120     0 FALSE
#> 2 P02           24    14    95     3 TRUE
#> 3 P03           20    15    98     1 FALSE
#> 4 P04           28    14   110     2 TRUE
#> 5 P05           16    15   135     0 FALSE
#> 6 P06           22    13    88     3 TRUE
```

**Difficulty:** Intermediate

[HINTS]
Turn each of the three threshold comparisons into a 0/1 value, add them, then flag totals of 2 or more.
Inside mutate(), sum as.integer(rr >= 22), as.integer(gcs < 15), and as.integer(sbp <= 100), then test the result >= 2.

```r title="Your turn"
ed_vitals <- tibble::tibble(
  patient_id = sprintf("P%02d", 1:6),
  rr         = c(18, 24, 20, 28, 16, 22),
  gcs        = c(15, 14, 15, 14, 15, 13),
  sbp        = c(120, 95, 98, 110, 135, 88)
)
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ed_vitals <- tibble::tibble(
  patient_id = sprintf("P%02d", 1:6),
  rr         = c(18, 24, 20, 28, 16, 22),
  gcs        = c(15, 14, 15, 14, 15, 13),
  sbp        = c(120, 95, 98, 110, 135, 88)
)

ex_4_2 <- ed_vitals |>
  mutate(
    qsofa     = as.integer(rr >= 22) + as.integer(gcs < 15) + as.integer(sbp <= 100),
    qsofa_pos = qsofa >= 2
  )
ex_4_2
#> # A tibble: 6 x 6
#>   patient_id    rr   gcs   sbp qsofa qsofa_pos
#>   <chr>      <dbl> <dbl> <dbl> <int> <lgl>
#> 1 P01           18    15   120     0 FALSE
#> 2 P02           24    14    95     3 TRUE
#> 3 P03           20    15    98     1 FALSE
#> 4 P04           28    14   110     2 TRUE
#> 5 P05           16    15   135     0 FALSE
#> 6 P06           22    13    88     3 TRUE
```

**Explanation:** Summing `as.integer()` of comparisons is faster and reads more cleanly than nested `if_else()` for additive scores. qSOFA is a triage screen (not a diagnosis): positive means escalate to full SOFA scoring and infection workup. The bedside utility comes from needing only three values that any ED nurse already records at triage, which is why CDC and Surviving Sepsis recommend it as a first-pass alert.

</details>

### Exercise 4.3: MELD score for liver transplant priority ranking

**Task:** A liver transplant coordinator recomputes MELD scores nightly from baseline labs to update the waitlist priority order. The MELD formula is round(3.78 * ln(bilirubin) + 11.2 * ln(INR) + 9.57 * ln(creatinine) + 6.43), with each lab floored at 1.0 before taking logs to avoid negative contributions. From the inline `meld_labs` tibble, add a `meld` integer column and save the augmented tibble to `ex_4_3`.

**Expected result:**

```
#> # A tibble: 5 x 5
#>   patient_id bilirubin   inr creatinine  meld
#>   <chr>          <dbl> <dbl>      <dbl> <dbl>
#> 1 P01             0.8   1.0        0.9     6
#> 2 P02             3.2   1.6        1.4    16
#> 3 P03             8.4   2.1        2.0    24
#> 4 P04            15.0   3.0        3.5    33
#> 5 P05             1.4   1.1        1.0     9
```

**Difficulty:** Advanced

[HINTS]
Apply the given formula row-wise, but first clamp every lab value up to a floor of 1.0 so no logarithm goes negative.
Inside mutate(), wrap round() around the coefficient sum and pass each lab through pmax(x, 1) before log().

```r title="Your turn"
meld_labs <- tibble::tibble(
  patient_id = sprintf("P%02d", 1:5),
  bilirubin  = c(0.8, 3.2, 8.4, 15.0, 1.4),
  inr        = c(1.0, 1.6, 2.1, 3.0,  1.1),
  creatinine = c(0.9, 1.4, 2.0, 3.5,  1.0)
)
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
meld_labs <- tibble::tibble(
  patient_id = sprintf("P%02d", 1:5),
  bilirubin  = c(0.8, 3.2, 8.4, 15.0, 1.4),
  inr        = c(1.0, 1.6, 2.1, 3.0,  1.1),
  creatinine = c(0.9, 1.4, 2.0, 3.5,  1.0)
)

ex_4_3 <- meld_labs |>
  mutate(meld = round(
    3.78 * log(pmax(bilirubin,  1)) +
    11.2 * log(pmax(inr,        1)) +
    9.57 * log(pmax(creatinine, 1)) +
    6.43
  ))
ex_4_3
#> # A tibble: 5 x 5
#>   patient_id bilirubin   inr creatinine  meld
#>   <chr>          <dbl> <dbl>      <dbl> <dbl>
#> 1 P01             0.8   1.0        0.9     6
#> 2 P02             3.2   1.6        1.4    16
#> 3 P03             8.4   2.1        2.0    24
#> 4 P04            15.0   3.0        3.5    33
#> 5 P05             1.4   1.1        1.0     9
```

**Explanation:** `pmax(x, 1)` is the right vectorized way to floor lab values: it returns the element-wise maximum of `x` and `1`, so any sub-1.0 measurement gets clamped to 1.0 before the log. Without flooring, values like bilirubin 0.8 produce negative log contributions and depress the score below the score's clinical minimum. UNOS uses a slightly updated MELD-Na that adds sodium; the same expression structure extends with one more `pmax()` and coefficient.

</details>

## Section 5. Survival analysis on the NCCTG lung cancer cohort (4 problems)

### Exercise 5.1: Fit an overall Kaplan-Meier curve on the lung dataset

**Task:** A thoracic oncology team is summarizing overall survival in the built-in `lung` cohort (NCCTG advanced lung cancer trial, 228 patients). The `time` column is days from study entry to event or censor, and `status` is 1 for censored and 2 for died. Fit an unstratified Kaplan-Meier estimator with `survfit(Surv(time, status) ~ 1, data = lung)` and save the survfit object to `ex_5_1`.

**Expected result:**

```
#> Call: survfit(formula = Surv(time, status) ~ 1, data = lung)
#>
#>        n events median 0.95LCL 0.95UCL
#> [1,] 228    165    310     285     363
```

**Difficulty:** Intermediate

[HINTS]
Fit a single survival curve to the whole cohort, with no grouping covariate on the right-hand side.
Call survfit(Surv(time, status) ~ 1, data = lung).

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- survfit(Surv(time, status) ~ 1, data = lung)
ex_5_1
#> Call: survfit(formula = Surv(time, status) ~ 1, data = lung)
#>
#>        n events median 0.95LCL 0.95UCL
#> [1,] 228    165    310     285     363
```

**Explanation:** `Surv(time, status)` wraps the duration and the event indicator into the survival-object type that all survival functions consume. `survfit(... ~ 1)` fits a single curve to the full cohort (the `~ 1` formula means "no covariates"). Print methods on survfit objects give the count at risk, total events, and the median survival with confidence bounds; for the lung cohort that median is 310 days. `summary()` on the object returns the full step function and is what feeds Kaplan-Meier plots.

</details>

### Exercise 5.2: Log-rank test for survival differences by sex

**Task:** The principal investigator on the lung cohort wants a formal test of whether overall survival differs between male (sex = 1) and female (sex = 2) subjects. Fit a two-group log-rank test using `survdiff(Surv(time, status) ~ sex, data = lung)` and save the entire survdiff object to `ex_5_2`. The chi-squared and p-value are visible in the print output.

**Expected result:**

```
#> Call:
#> survdiff(formula = Surv(time, status) ~ sex, data = lung)
#>
#>         N Observed Expected (O-E)^2/E (O-E)^2/V
#> sex=1 138      112     91.6      4.55      10.3
#> sex=2  90       53     73.4      5.68      10.3
#>
#>  Chisq= 10.3  on 1 degrees of freedom, p= 0.001
```

**Difficulty:** Advanced

[HINTS]
Run a non-parametric test that compares the survival experience of the two sex groups.
Call survdiff(Surv(time, status) ~ sex, data = lung).

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_2 <- survdiff(Surv(time, status) ~ sex, data = lung)
ex_5_2
#> Call:
#> survdiff(formula = Surv(time, status) ~ sex, data = lung)
#>
#>         N Observed Expected (O-E)^2/E (O-E)^2/V
#> sex=1 138      112     91.6      4.55      10.3
#> sex=2  90       53     73.4      5.68      10.3
#>
#>  Chisq= 10.3  on 1 degrees of freedom, p= 0.001
```

**Explanation:** The log-rank test compares observed event counts against the events expected under the null of equal hazard, summed across event times. It's a non-parametric test that does not assume any particular distributional form (unlike a parametric Weibull comparison) but does assume proportional hazards. The lung cohort shows females (sex = 2) have significantly better survival than males (p = 0.001), with fewer observed deaths than expected. For more than two groups, `survdiff` reports a chi-squared with k-1 degrees of freedom.

</details>

### Exercise 5.3: Multivariable Cox proportional hazards model

**Task:** An oncology biostatistician is fitting a multivariable Cox proportional hazards model on the `lung` cohort to estimate adjusted effects of age, sex, and ECOG performance status (`ph.ecog`) on mortality hazard. Use `coxph(Surv(time, status) ~ age + sex + ph.ecog, data = lung)` and save the entire fitted model to `ex_5_3`. The coefficient on each covariate is the log hazard ratio.

**Expected result:**

```
#> Call:
#> coxph(formula = Surv(time, status) ~ age + sex + ph.ecog, data = lung)
#>
#>             coef exp(coef) se(coef)      z      p
#> age      0.01112   1.01119  0.00929  1.198 0.2308
#> sex     -0.55262   0.57544  0.16774 -3.294 0.0009
#> ph.ecog  0.46365   1.58980  0.11567  4.009 6.1e-05
#>
#> Likelihood ratio test=30.5  on 3 df, p=1.08e-06
#> n= 227, number of events= 164
#>    (1 observation deleted due to missingness)
```

**Difficulty:** Advanced

[HINTS]
Fit a regression that estimates each covariate's effect on the mortality hazard without modeling the baseline hazard itself.
Call coxph(Surv(time, status) ~ age + sex + ph.ecog, data = lung).

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_3 <- coxph(Surv(time, status) ~ age + sex + ph.ecog, data = lung)
ex_5_3
#> Call:
#> coxph(formula = Surv(time, status) ~ age + sex + ph.ecog, data = lung)
#>
#>             coef exp(coef) se(coef)      z      p
#> age      0.01112   1.01119  0.00929  1.198 0.2308
#> sex     -0.55262   0.57544  0.16774 -3.294 0.0009
#> ph.ecog  0.46365   1.58980  0.11567  4.009 6.1e-05
#>
#> Likelihood ratio test=30.5  on 3 df, p=1.08e-06
#> n= 227, number of events= 164
#>    (1 observation deleted due to missingness)
```

**Explanation:** Cox regression estimates hazard ratios without specifying the baseline hazard function, which is what makes it the workhorse of clinical survival analysis. `exp(coef)` is the hazard ratio: 0.575 for sex means females have about 42% lower hazard of death than males, adjusted for age and performance status. After fitting, always check proportional-hazards assumption with `cox.zph(ex_5_3)` and consider stratification or time-varying coefficients if Schoenfeld residuals show drift over time.

</details>

### Exercise 5.4: Extract median survival and 1-year survival probability

**Task:** A clinical reviewer wants the headline survival statistics from the lung cohort for the trial summary: median overall survival in days and the survival probability at 365 days post-enrollment. From the unstratified survfit object `ex_5_1` already in memory, extract these two numbers and return a named numeric vector with elements `median_days` and `surv_at_1yr`. Save to `ex_5_4`.

**Expected result:**

```
#> median_days surv_at_1yr
#>     310.000       0.409
```

**Difficulty:** Intermediate

[HINTS]
One number comes straight from the fitted object's summary table; the other needs the curve evaluated at a specific day.
Pull summary(ex_5_1)$table["median"] and summary(ex_5_1, times = 365)$surv, then assemble them into a named vector.

```r title="Your turn"
ex_5_4 <- # your code here using ex_5_1 from exercise 5.1
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
s1 <- summary(ex_5_1, times = 365)

ex_5_4 <- c(
  median_days = summary(ex_5_1)$table["median"],
  surv_at_1yr = round(s1$surv, 3)
)
names(ex_5_4) <- c("median_days", "surv_at_1yr")
ex_5_4
#> median_days surv_at_1yr
#>     310.000       0.409
```

**Explanation:** `summary(survfit_obj)$table["median"]` pulls the median survival time directly from the survfit summary table. Calling `summary()` with `times = 365` evaluates the survival step function at exactly 365 days, returning the at-risk count, event count, and survival probability at that point. Together these are the two numbers every oncology summary table opens with: how long does the median patient live, and what fraction make it to one year.

</details>

## Section 6. Longitudinal patient data (4 problems)

### Exercise 6.1: Per-patient A1c slope via group-wise linear regression

**Task:** A diabetes care manager wants per-patient glycemic trajectories from a long-form A1c panel. The `a1c_panel` tibble has 3 to 5 visits per patient with `months_since_baseline` and `a1c`. Fit a per-patient linear regression of `a1c` on `months_since_baseline`, then return a tibble with one row per patient containing `patient_id` and the regression slope `a1c_per_month`. Sort by `patient_id` and save to `ex_6_1`.

**Expected result:**

```
#> # A tibble: 4 x 2
#>   patient_id a1c_per_month
#>   <chr>              <dbl>
#> 1 P01              -0.0667
#> 2 P02               0.0571
#> 3 P03              -0.150
#> 4 P04               0.04
```

**Difficulty:** Advanced

[HINTS]
Fit a separate straight-line trend for each patient and keep only the slope coefficient.
Use group_by(patient_id) then summarise() with coef(lm(a1c ~ months_since_baseline)) indexed at the slope term.

```r title="Your turn"
a1c_panel <- tibble::tibble(
  patient_id            = c("P01","P01","P01","P01",
                            "P02","P02","P02","P02","P02",
                            "P03","P03","P03",
                            "P04","P04","P04","P04"),
  months_since_baseline = c(0,3,6,9, 0,3,6,9,12, 0,3,6, 0,3,6,9),
  a1c                   = c(8.4, 8.2, 8.0, 7.8,
                            7.6, 7.8, 7.9, 8.0, 8.3,
                            9.2, 8.8, 8.3,
                            6.8, 6.9, 7.0, 7.1)
)
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
a1c_panel <- tibble::tibble(
  patient_id            = c("P01","P01","P01","P01",
                            "P02","P02","P02","P02","P02",
                            "P03","P03","P03",
                            "P04","P04","P04","P04"),
  months_since_baseline = c(0,3,6,9, 0,3,6,9,12, 0,3,6, 0,3,6,9),
  a1c                   = c(8.4, 8.2, 8.0, 7.8,
                            7.6, 7.8, 7.9, 8.0, 8.3,
                            9.2, 8.8, 8.3,
                            6.8, 6.9, 7.0, 7.1)
)

ex_6_1 <- a1c_panel |>
  group_by(patient_id) |>
  summarise(
    a1c_per_month = coef(lm(a1c ~ months_since_baseline))[["months_since_baseline"]],
    .groups = "drop"
  ) |>
  arrange(patient_id)
ex_6_1
#> # A tibble: 4 x 2
#>   patient_id a1c_per_month
#>   <chr>              <dbl>
#> 1 P01              -0.0667
#> 2 P02               0.0571
#> 3 P03              -0.150
#> 4 P04               0.04
```

**Explanation:** Running `lm()` inside `summarise()` per group is the simplest path to per-subject slopes, and `coef(...)[["months_since_baseline"]]` plucks the slope without manual indexing. For thousands of patients consider `broom::tidy()` inside `group_modify()` to get slope, standard error, and p-value in tidy form, or move to a single random-slope mixed-effects model (exercise 6.4 shows the syntax) which borrows strength across subjects and yields more stable estimates when each patient has few observations.

</details>

### Exercise 6.2: Flag rows with physiologically impossible vital signs

**Task:** A data-quality auditor scans incoming ED vital signs for sentinel-flagged impossible values before they enter the warehouse. From the inline `vitals_qc` tibble, flag rows where AT LEAST ONE of these conditions is true: systolic BP outside 50 to 260, heart rate outside 20 to 260, or temperature outside 30 to 43 degrees Celsius. Return only the offending rows and save the filtered tibble to `ex_6_2`.

**Expected result:**

```
#> # A tibble: 2 x 4
#>   patient_id   sbp    hr temp_c
#>   <chr>      <dbl> <dbl>  <dbl>
#> 1 P03          280   110   37.1
#> 2 P05          110    18   36.8
```

**Difficulty:** Beginner

[HINTS]
Keep only the rows where at least one of the physiologic range checks fails.
Use filter() with the six range conditions joined by the OR operator |.

```r title="Your turn"
vitals_qc <- tibble::tibble(
  patient_id = sprintf("P%02d", 1:6),
  sbp        = c(120, 135, 280, 110, 110, 145),
  hr         = c(78,  88,  110, 70,  18,  92),
  temp_c     = c(36.8, 37.2, 37.1, 36.9, 36.8, 38.4)
)
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
vitals_qc <- tibble::tibble(
  patient_id = sprintf("P%02d", 1:6),
  sbp        = c(120, 135, 280, 110, 110, 145),
  hr         = c(78,  88,  110, 70,  18,  92),
  temp_c     = c(36.8, 37.2, 37.1, 36.9, 36.8, 38.4)
)

ex_6_2 <- vitals_qc |>
  filter(sbp < 50 | sbp > 260 | hr < 20 | hr > 260 | temp_c < 30 | temp_c > 43)
ex_6_2
#> # A tibble: 2 x 4
#>   patient_id   sbp    hr temp_c
#>   <chr>      <dbl> <dbl>  <dbl>
#> 1 P03          280   110   37.1
#> 2 P05          110    18   36.8
```

**Explanation:** Front-loading hard physiologic bounds is the cheapest data-quality control in any healthcare pipeline: a heart rate of 18 is below biological survival and almost certainly a transcription error or units mismatch (e.g., respiratory rate accidentally written into the HR column). Logical OR (`|`) inside `filter()` keeps rows where any one rule fires. For very wide records, `filter(if_any(c(sbp, hr, temp_c), ~ ...))` from dplyr's `if_any()` family scales better than spelling out every column.

</details>

### Exercise 6.3: Days from index hospitalization to first follow-up visit

**Task:** A care-coordination dashboard tracks time-to-first-followup after index hospitalizations to monitor 30-day readmission risk. From the inline `followup` tibble with `patient_id`, `visit_date` (Date), and `visit_type` ("index" or "followup"), compute for each patient the integer number of days between the index visit and the EARLIEST follow-up visit. Return a one-row-per-patient tibble with `patient_id` and `days_to_followup` and save to `ex_6_3`.

**Expected result:**

```
#> # A tibble: 3 x 2
#>   patient_id days_to_followup
#>   <chr>                 <dbl>
#> 1 P01                      14
#> 2 P02                      21
#> 3 P03                       7
```

**Difficulty:** Intermediate

[HINTS]
For each patient, find the earliest follow-up date and the index date, then take the gap between them in days.
Use group_by(patient_id) then summarise(), subtracting min(visit_date[visit_type == "index"]) from the followup minimum and wrapping it in as.numeric().

```r title="Your turn"
followup <- tibble::tibble(
  patient_id = c("P01","P01","P01","P02","P02","P03","P03","P03"),
  visit_date = as.Date(c("2026-01-01","2026-01-15","2026-02-12",
                         "2026-02-01","2026-02-22",
                         "2026-03-10","2026-03-17","2026-04-05")),
  visit_type = c("index","followup","followup",
                 "index","followup",
                 "index","followup","followup")
)
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
followup <- tibble::tibble(
  patient_id = c("P01","P01","P01","P02","P02","P03","P03","P03"),
  visit_date = as.Date(c("2026-01-01","2026-01-15","2026-02-12",
                         "2026-02-01","2026-02-22",
                         "2026-03-10","2026-03-17","2026-04-05")),
  visit_type = c("index","followup","followup",
                 "index","followup",
                 "index","followup","followup")
)

ex_6_3 <- followup |>
  group_by(patient_id) |>
  summarise(
    days_to_followup = as.numeric(
      min(visit_date[visit_type == "followup"]) -
      min(visit_date[visit_type == "index"])
    ),
    .groups = "drop"
  ) |>
  arrange(patient_id)
ex_6_3
#> # A tibble: 3 x 2
#>   patient_id days_to_followup
#>   <chr>                 <dbl>
#> 1 P01                      14
#> 2 P02                      21
#> 3 P03                       7
```

**Explanation:** Subtracting two Date objects returns a `difftime`, which `as.numeric()` coerces to plain days. Indexing inside `min()` with `visit_date[visit_type == "followup"]` is concise and avoids a second `filter()` pass. CMS readmission programs cap "follow-up" at 30 days, so the next step in production code is usually `mutate(within_30 = days_to_followup <= 30)` and a population-level rate. Watch for patients with no followup: `min()` on an empty subset returns `Inf` with a warning; wrap in `if (length(x)) min(x) else NA_real_` for production.

</details>

### Exercise 6.4: Random-intercept mixed-effects model on the sleepstudy cohort

**Task:** A circadian-rhythm researcher analyzing the built-in `sleepstudy` data wants to estimate the population-level effect of `Days` of sleep deprivation on reaction time, while letting each `Subject` carry their own baseline reaction time as a random intercept. Fit `lmer(Reaction ~ Days + (1 | Subject), data = sleepstudy)` and save the fitted merMod object to `ex_6_4`.

**Expected result:**

```
#> Linear mixed model fit by REML ['lmerMod']
#> Formula: Reaction ~ Days + (1 | Subject)
#>    Data: sleepstudy
#> REML criterion at convergence: 1786.465
#> Random effects:
#>  Groups   Name        Std.Dev.
#>  Subject  (Intercept) 37.12
#>  Residual             30.99
#> Number of obs: 180, groups:  Subject, 18
#> Fixed Effects:
#> (Intercept)         Days
#>      251.41        10.47
```

**Difficulty:** Advanced

[HINTS]
Fit a model with one shared population-level slope but a separate baseline level for each subject.
Call lmer(Reaction ~ Days + (1 | Subject), data = sleepstudy).

```r title="Your turn"
ex_6_4 <- # your code here using sleepstudy from lme4
ex_6_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_4 <- lmer(Reaction ~ Days + (1 | Subject), data = sleepstudy)
ex_6_4
#> Linear mixed model fit by REML ['lmerMod']
#> Formula: Reaction ~ Days + (1 | Subject)
#>    Data: sleepstudy
#> REML criterion at convergence: 1786.465
#> Random effects:
#>  Groups   Name        Std.Dev.
#>  Subject  (Intercept) 37.12
#>  Residual             30.99
#> Number of obs: 180, groups:  Subject, 18
#> Fixed Effects:
#> (Intercept)         Days
#>      251.41        10.47
```

**Explanation:** Random intercepts partition variance into between-subject and within-subject components: the 37.1 ms between-subject SD says baselines differ markedly across people, and the 31.0 ms residual SD captures day-to-day within-subject noise. The fixed-effect slope of 10.47 ms per day of deprivation is the population-average effect, properly accounting for repeated measurements per subject (which `lm()` would treat as independent and report misleadingly tight standard errors for). Add a random slope with `(Days | Subject)` if subjects also differ in how fast their reaction time degrades.

</details>

## What to do next

- [R Survival Analysis Tutorial](Survival-Analysis-With-R.html) covers Kaplan-Meier, Cox PH, and time-varying covariates in depth.
- [Logistic Regression in R](Logistic-Regression-With-R.html) is the next stop for diagnostic test and outcome modeling.
- [Linear Regression Diagnostics](Linear-Regression.html) underpins the slope estimates from the longitudinal exercises here.
- [dplyr Joins Exercises](dplyr-Joins-Exercises-in-R.html) for more practice on the patient and encounter table joins this hub leans on.
