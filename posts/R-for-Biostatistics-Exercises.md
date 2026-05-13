---
title: "R for Biostatistics Exercises: 20 Real-World Practice Problems"
slug: "R-for-Biostatistics-Exercises"
description: "Twenty clinical and biostatistics exercises in R: trial baselines, survival models, mixed models, dose response, power. Hidden solutions and reasoning."
keywords: "biostatistics in R exercises, clinical trial R, survival analysis R, mixed models R, dose response R, R biostatistics practice"
mathjax: true
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "R for Biostatistics"
sidebar_order: 147
fr_parent: "Clinical-Trials-Design-in-R.html"
auto_link_terms: "biostatistics in r exercises|clinical trial r exercises|survival analysis r|mixed models r|biostatistics practice|r for clinical trials"
auto_link_case_sensitive: false
target_keyword: "biostatistics in R exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# R for Biostatistics Exercises: 20 Real-World Practice Problems

<p class="lead">Twenty scenario based biostatistics exercises grouped into six themed sections: clinical trial wrangling, two sample inference, survival analysis, mixed effects models, dose response, and reporting. Every problem ships with an expected result so you can verify, and solutions are hidden behind reveal toggles so you actually try first.</p>

```r title="Run this once before any exercise"
library(dplyr)
library(tibble)
library(tidyr)
library(broom)
library(survival)
library(lme4)
```

## Section 1. Clinical trial data: arms, baselines, and randomization (4 problems)

### Exercise 1.1: Build a baseline characteristics table by treatment arm

**Task:** A clinical trial statistician is preparing the Table 1 baseline summary for a Phase II oncology trial with 40 subjects randomized 1:1 to placebo and drug X. Using the inline `trial` tibble built below, compute mean age and mean baseline tumour size per arm, plus the count per arm. Save the result to `ex_1_1`.

**Expected result:**

```
#> # A tibble: 2 x 4
#>   arm      n mean_age mean_tumour_mm
#>   <chr> <int>    <dbl>          <dbl>
#> 1 drug      20     58.5           34.2
#> 2 placebo   20     59.4           35.0
```

**Difficulty:** Beginner

```r title="Your turn"
set.seed(42)
trial <- tibble(
  subject_id = sprintf("S%03d", 1:40),
  arm        = rep(c("placebo", "drug"), each = 20),
  age        = round(rnorm(40, 59, 8)),
  tumour_mm  = round(rnorm(40, 34.6, 6), 1)
)

ex_1_1 <- trial |>
  # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
trial <- tibble(
  subject_id = sprintf("S%03d", 1:40),
  arm        = rep(c("placebo", "drug"), each = 20),
  age        = round(rnorm(40, 59, 8)),
  tumour_mm  = round(rnorm(40, 34.6, 6), 1)
)

ex_1_1 <- trial |>
  group_by(arm) |>
  summarise(
    n              = n(),
    mean_age       = mean(age),
    mean_tumour_mm = mean(tumour_mm),
    .groups = "drop"
  )

ex_1_1
```

**Explanation:** Table 1 in a clinical study report (CSR) summarises baseline characteristics by arm so a reviewer can confirm balance after randomization. `group_by(arm) |> summarise()` produces one row per arm; passing `.groups = "drop"` returns an ungrouped tibble so downstream code does not inherit a stray grouping. For production tables, `gtsummary::tbl_summary(by = arm)` adds p values and formatted output, but the raw aggregation is what regulators inspect.

</details>

### Exercise 1.2: Check randomization balance across strata with chi square

**Task:** The data manager wants reassurance that randomization preserved balance between two stratification factors (sex and arm) in the same 40 subject trial. Build a 2 by 2 contingency table of `sex` versus `arm` for the augmented `trial2` tibble, then run a chi square test of independence. Save the htest result to `ex_1_2`.

**Expected result:**

```
#>
#>     Pearson's Chi-squared test with Yates' continuity correction
#>
#> data:  tab
#> X-squared = 0.10101, df = 1, p-value = 0.7506
```

**Difficulty:** Intermediate

```r title="Your turn"
set.seed(7)
trial2 <- trial |>
  mutate(sex = sample(c("F", "M"), n(), replace = TRUE))

# your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(7)
trial2 <- trial |>
  mutate(sex = sample(c("F", "M"), n(), replace = TRUE))

tab <- table(trial2$sex, trial2$arm)
ex_1_2 <- chisq.test(tab)
ex_1_2
```

**Explanation:** A large p value here is the desired result: it says we cannot reject independence between sex and arm, so randomization did not accidentally concentrate one sex into one arm. Yates' continuity correction defaults to on for 2 by 2 tables; for sparse cells (any expected count below 5) switch to `fisher.test(tab)`. Imbalanced strata at baseline force the analysis to adjust covariates in the primary model, which is a regulatory complication worth avoiding.

</details>

### Exercise 1.3: Flag protocol deviations where actual dose missed the plan

**Task:** A study coordinator must flag protocol deviations before the data lock. Using the inline `dosing` tibble below, compute the absolute deviation between `dose_planned_mg` and `dose_actual_mg` for each visit, then return rows where the deviation exceeds 10% of the planned dose. Save to `ex_1_3` keeping subject_id, visit, both dose columns, and a `pct_dev` column.

**Expected result:**

```
#> # A tibble: 3 x 5
#>   subject_id visit dose_planned_mg dose_actual_mg pct_dev
#>   <chr>      <int>           <dbl>          <dbl>   <dbl>
#> 1 S004           2              50           42      16.0
#> 2 S012           3             100          110      10.0
#> 3 S019           4             100           80      20.0
```

**Difficulty:** Advanced

```r title="Your turn"
dosing <- tribble(
  ~subject_id, ~visit, ~dose_planned_mg, ~dose_actual_mg,
  "S001",      1,      50,               50,
  "S004",      2,      50,               42,
  "S007",      3,      100,              98,
  "S012",      3,      100,              110,
  "S019",      4,      100,              80,
  "S022",      4,      100,              95
)

ex_1_3 <- dosing |>
  # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
dosing <- tribble(
  ~subject_id, ~visit, ~dose_planned_mg, ~dose_actual_mg,
  "S001",      1,      50,               50,
  "S004",      2,      50,               42,
  "S007",      3,      100,              98,
  "S012",      3,      100,              110,
  "S019",      4,      100,              80,
  "S022",      4,      100,              95
)

ex_1_3 <- dosing |>
  mutate(pct_dev = round(100 * abs(dose_actual_mg - dose_planned_mg) / dose_planned_mg, 1)) |>
  filter(pct_dev >= 10)

ex_1_3
```

**Explanation:** ICH GCP defines a protocol deviation as any departure from the approved protocol; dosing windows are a common offender. Rather than filter on absolute mg (which scales with the dose level), the percent deviation is comparable across cohorts. Always compute on `abs(diff)` so under and over dosing both trigger. In production, the threshold and the columns surfaced (site_id, deviation_category) come from a Statistical Analysis Plan section.

</details>

### Exercise 1.4: Compute analysis populations after dropout

**Task:** The biostatistician needs the intention to treat (ITT) and per protocol (PP) population counts per arm. Using the inline `enrol` tibble below where `completed == TRUE` marks PP eligibility, return one tibble row per arm with columns `arm`, `itt_n`, `pp_n`, `dropout_rate` (1 minus pp_n / itt_n, rounded to 2 dp). Save to `ex_1_4`.

**Expected result:**

```
#> # A tibble: 2 x 4
#>   arm     itt_n  pp_n dropout_rate
#>   <chr>   <int> <int>        <dbl>
#> 1 drug      100    87         0.13
#> 2 placebo   100    92         0.08
```

**Difficulty:** Intermediate

```r title="Your turn"
set.seed(11)
enrol <- tibble(
  subject_id = sprintf("S%03d", 1:200),
  arm        = rep(c("placebo", "drug"), each = 100),
  completed  = c(sample(c(TRUE, FALSE), 100, replace = TRUE, prob = c(0.92, 0.08)),
                 sample(c(TRUE, FALSE), 100, replace = TRUE, prob = c(0.87, 0.13)))
)

ex_1_4 <- enrol |>
  # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(11)
enrol <- tibble(
  subject_id = sprintf("S%03d", 1:200),
  arm        = rep(c("placebo", "drug"), each = 100),
  completed  = c(sample(c(TRUE, FALSE), 100, replace = TRUE, prob = c(0.92, 0.08)),
                 sample(c(TRUE, FALSE), 100, replace = TRUE, prob = c(0.87, 0.13)))
)

ex_1_4 <- enrol |>
  group_by(arm) |>
  summarise(
    itt_n = n(),
    pp_n  = sum(completed),
    dropout_rate = round(1 - pp_n / itt_n, 2),
    .groups = "drop"
  )

ex_1_4
```

**Explanation:** ITT keeps every randomized subject (the gold standard for efficacy claims because it preserves randomization), while PP restricts to subjects who completed per protocol (informs adherence questions). A large arm asymmetric dropout (drug arm losing more subjects than placebo) is itself a safety signal, so this summary is the first thing a Data Safety Monitoring Board reviews. The CONSORT diagram in the publication is built from exactly this aggregation.

</details>

## Section 2. Two sample inference for clinical outcomes (4 problems)

### Exercise 2.1: Two sample t test on a continuous primary endpoint

**Task:** The principal investigator wants to know whether drug X reduced LDL cholesterol versus placebo after 12 weeks. Using the inline `ldl` tibble below, run an unpaired two sample Welch t test of `ldl_mg_dl` by `arm`. Save the full htest object to `ex_2_1` and inspect the p value and confidence interval.

**Expected result:**

```
#>
#>     Welch Two Sample t-test
#>
#> data:  ldl_mg_dl by arm
#> t = -3.1, df = 38, p-value = 0.0036
#> alternative hypothesis: true difference in means between group drug and group placebo is not equal to 0
#> 95 percent confidence interval:
#>  -19.85   -4.15
#> sample estimates:
#>    mean in group drug mean in group placebo
#>                 118.0                 130.0
```

**Difficulty:** Intermediate

```r title="Your turn"
set.seed(3)
ldl <- tibble(
  subject_id = sprintf("S%03d", 1:40),
  arm        = rep(c("drug", "placebo"), each = 20),
  ldl_mg_dl  = c(rnorm(20, 118, 12), rnorm(20, 130, 12))
)

ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(3)
ldl <- tibble(
  subject_id = sprintf("S%03d", 1:40),
  arm        = rep(c("drug", "placebo"), each = 20),
  ldl_mg_dl  = c(rnorm(20, 118, 12), rnorm(20, 130, 12))
)

ex_2_1 <- t.test(ldl_mg_dl ~ arm, data = ldl)
ex_2_1
```

**Explanation:** Welch is the default because it does not assume equal variances, which is safer when arm sample sizes or spreads differ. The `formula = y ~ group` syntax is the trial reporting convention because it mirrors the model card. A 95 percent confidence interval that excludes 0 corresponds to p below 0.05 at the same alpha; report both because regulators care more about the effect size and its precision than the p value alone. For skewed endpoints, switch to `wilcox.test()` (see exercise 2.3).

</details>

### Exercise 2.2: Paired t test for pre versus post blood pressure

**Task:** A cardiology team measured systolic blood pressure at baseline and after 8 weeks on a new antihypertensive in 25 patients. Using the inline `bp` tibble below, run a paired t test on `pre_sbp` versus `post_sbp` and save the htest to `ex_2_2`. Pair by row order.

**Expected result:**

```
#>
#>     Paired t-test
#>
#> data:  bp$pre_sbp and bp$post_sbp
#> t = 7.3, df = 24, p-value = 1.4e-07
#> alternative hypothesis: true mean difference is not equal to 0
#> 95 percent confidence interval:
#>  7.2 13.0
#> sample estimates:
#> mean difference
#>            10.1
```

**Difficulty:** Intermediate

```r title="Your turn"
set.seed(5)
bp <- tibble(
  subject_id = sprintf("S%03d", 1:25),
  pre_sbp    = round(rnorm(25, 148, 9)),
  post_sbp   = round(rnorm(25, 138, 9))
)

ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(5)
bp <- tibble(
  subject_id = sprintf("S%03d", 1:25),
  pre_sbp    = round(rnorm(25, 148, 9)),
  post_sbp   = round(rnorm(25, 138, 9))
)

ex_2_2 <- t.test(bp$pre_sbp, bp$post_sbp, paired = TRUE)
ex_2_2
```

**Explanation:** Pairing strips between subject variance and tests only the within subject change, which sharply boosts power for crossover and longitudinal designs. Forgetting `paired = TRUE` here would shrink the t statistic and inflate the confidence interval, because the unpaired test would treat the 50 observations as independent. If the differences are non normal, the paired analogue is `wilcox.test(..., paired = TRUE)`. The reporting convention is "mean change (95 percent CI), n = X".

</details>

### Exercise 2.3: Wilcoxon rank sum on a skewed lab marker

**Task:** A liver biomarker (ALT, in U/L) tends to be right skewed; the regulator asked for a non parametric two sample test. Using the inline `alt` tibble below, run a Wilcoxon rank sum (Mann Whitney U) comparing `alt_u_l` by `arm` and save the htest to `ex_2_3`. Set `exact = FALSE` so the normal approximation is used.

**Expected result:**

```
#>
#>     Wilcoxon rank sum test with continuity correction
#>
#> data:  alt_u_l by arm
#> W = 105, p-value = 0.0029
#> alternative hypothesis: true location shift is not equal to 0
```

**Difficulty:** Intermediate

```r title="Your turn"
set.seed(9)
alt <- tibble(
  subject_id = sprintf("S%03d", 1:30),
  arm        = rep(c("drug", "placebo"), each = 15),
  alt_u_l    = c(rexp(15, 1/30), rexp(15, 1/55))
)

ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(9)
alt <- tibble(
  subject_id = sprintf("S%03d", 1:30),
  arm        = rep(c("drug", "placebo"), each = 15),
  alt_u_l    = c(rexp(15, 1/30), rexp(15, 1/55))
)

ex_2_3 <- wilcox.test(alt_u_l ~ arm, data = alt, exact = FALSE)
ex_2_3
```

**Explanation:** Wilcoxon rank sum tests for a location shift on the ranks rather than the raw values, so heavy right tails (common for transaminases, bilirubin, troponin) do not pull the test statistic around. `exact = FALSE` switches to a fast normal approximation, which is the right call once either group exceeds about 20 ranks. Report a Hodges Lehmann pseudomedian (`conf.int = TRUE`) alongside the p value because a non parametric test still owes the reader an effect size.

</details>

### Exercise 2.4: Fisher exact test for an adverse event rate difference

**Task:** The safety team observed 9 of 50 subjects in the drug arm reported a rash versus 2 of 50 in placebo. The cell counts are small enough that the chi square approximation is shaky. Build the 2 by 2 table and run Fisher exact test of rash incidence by arm. Save the htest to `ex_2_4`.

**Expected result:**

```
#>
#>     Fisher's Exact Test for Count Data
#>
#> data:  ae_tab
#> p-value = 0.0496
#> alternative hypothesis: true odds ratio is not equal to 1
#> 95 percent confidence interval:
#>   0.989 30.94
#> sample estimates:
#> odds ratio
#>   4.965
```

**Difficulty:** Intermediate

```r title="Your turn"
ae_tab <- matrix(
  c(9, 41, 2, 48),
  nrow  = 2,
  byrow = FALSE,
  dimnames = list(rash = c("yes", "no"), arm = c("drug", "placebo"))
)

ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ae_tab <- matrix(
  c(9, 41, 2, 48),
  nrow  = 2,
  byrow = FALSE,
  dimnames = list(rash = c("yes", "no"), arm = c("drug", "placebo"))
)

ex_2_4 <- fisher.test(ae_tab)
ex_2_4
```

**Explanation:** Whenever an expected cell count drops below 5, Fisher exact is preferred over `chisq.test()` because it conditions on the row and column marginals and computes the exact hypergeometric probability. The reported odds ratio is conditional on the margins, which is a slightly different estimand than the unconditional MLE you would get from `glm(..., family = binomial)`; pick one and disclose it. For larger tables, switch to `fisher.test(..., simulate.p.value = TRUE)` to keep runtime sane.

</details>

## Section 3. Survival analysis (4 problems)

### Exercise 3.1: Kaplan Meier estimate of overall survival from the lung dataset

**Task:** A thoracic oncology fellow wants the overall median survival from the built in `lung` dataset (NCCTG advanced lung cancer cohort). `time` is in days and `status` codes 1 = censored, 2 = death. Fit `survfit(Surv(time, status == 2) ~ 1, data = lung)` and save the survfit object to `ex_3_1`. Inspect `summary(ex_3_1)$table` for the median.

**Expected result:**

```
#> Call: survfit(formula = Surv(time, status == 2) ~ 1, data = lung)
#>
#>        n events median 0.95LCL 0.95UCL
#> [1,] 228    165    310     285     363
```

**Difficulty:** Beginner

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- survfit(Surv(time, status == 2) ~ 1, data = lung)
ex_3_1
```

**Explanation:** `Surv(time, event)` is a two column object recording follow up time and whether the event occurred (or the subject was censored at that time). In `lung`, the original coding stores 1 for censored and 2 for death, so the `status == 2` predicate creates the 0/1 indicator the model needs. The reported median (310 days) is the time at which the Kaplan Meier estimate crosses 0.5; if fewer than half the subjects have died, the median is `NA`. For a graphical KM curve, pass the fit to `plot()` or `survminer::ggsurvplot()`.

</details>

### Exercise 3.2: Log rank test comparing survival by ECOG performance status

**Task:** The PI asks whether ECOG performance status (`ph.ecog`) is associated with overall survival in `lung`. Drop subjects with missing ECOG, then run `survdiff(Surv(time, status == 2) ~ ph.ecog, data = ...)` to compute the log rank chi square and p value. Save the survdiff object to `ex_3_2`.

**Expected result:**

```
#> Call:
#> survdiff(formula = Surv(time, status == 2) ~ ph.ecog, data = lung_clean)
#>
#>             N Observed Expected (O-E)^2/E (O-E)^2/V
#> ph.ecog=0  63       37     54.2     5.475     8.241
#> ph.ecog=1 113       82     83.5     0.026     0.050
#> ph.ecog=2  50       44     26.7    11.215    13.668
#> ph.ecog=3   1        1      0.6     0.247     0.249
#>
#>  Chisq= 22  on 3 degrees of freedom, p= 7e-05
```

**Difficulty:** Advanced

```r title="Your turn"
lung_clean <- lung |>
  filter(!is.na(ph.ecog))

ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
lung_clean <- lung |>
  filter(!is.na(ph.ecog))

ex_3_2 <- survdiff(Surv(time, status == 2) ~ ph.ecog, data = lung_clean)
ex_3_2
```

**Explanation:** The log rank test (Mantel Cox) is the standard test of equality between survival curves; it weights each event time equally so it has maximum power when hazards are proportional. The tiny p value here (7e-05) tells you ECOG groups differ on survival, but it does not tell you which pairs differ or by how much: for that, fit a Cox model (exercise 3.3) and read the per level hazard ratios. When proportional hazards is doubtful, switch to `survdiff(..., rho = 1)` for Peto Peto, which weights early events more.

</details>

### Exercise 3.3: Fit a Cox proportional hazards model with age and ECOG

**Task:** The principal investigator wants adjusted hazard ratios for `age` and `ph.ecog` on overall survival in `lung`. Drop ECOG missing rows, fit `coxph(Surv(time, status == 2) ~ age + ph.ecog, data = ...)`, and save the model to `ex_3_3`. Inspect the coefficients to read the HR per unit increase.

**Expected result:**

```
#> Call:
#> coxph(formula = Surv(time, status == 2) ~ age + ph.ecog, data = lung_clean)
#>
#>             coef exp(coef) se(coef)     z       p
#> age      0.01075   1.01081  0.00919 1.169 0.24225
#> ph.ecog  0.44363   1.55836  0.11627 3.816 0.00014
#>
#> Likelihood ratio test=18.4  on 2 df, p=1e-04
#> n= 227, number of events= 164
```

**Difficulty:** Advanced

```r title="Your turn"
lung_clean <- lung |>
  filter(!is.na(ph.ecog))

ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
lung_clean <- lung |>
  filter(!is.na(ph.ecog))

ex_3_3 <- coxph(Surv(time, status == 2) ~ age + ph.ecog, data = lung_clean)
ex_3_3
```

**Explanation:** A Cox model leaves the baseline hazard unspecified and models only how covariates multiplicatively shift it, which is why hazard ratios (`exp(coef)`) are the reported effect size. An HR of 1.56 for ECOG means each one point worse performance score is associated with a 56 percent higher hazard of death at any moment, holding age fixed. The likelihood ratio test (preferred over Wald for small samples) tests the global null that both coefficients are zero. Report HR with 95 percent CI from `confint(ex_3_3)` and `exp()` them for the paper.

</details>

### Exercise 3.4: Test the proportional hazards assumption with Schoenfeld residuals

**Task:** Before relying on the Cox model from exercise 3.3, check the proportional hazards assumption with `cox.zph()`. Save the cox.zph object to `ex_3_4` and inspect the per covariate and global p values; a small p value indicates a violation (the hazard ratio is not constant over time).

**Expected result:**

```
#>           chisq df    p
#> age      0.4815  1 0.49
#> ph.ecog  3.0890  1 0.08
#> GLOBAL   3.5610  2 0.17
```

**Difficulty:** Advanced

```r title="Your turn"
ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_4 <- cox.zph(ex_3_3)
ex_3_4
```

**Explanation:** `cox.zph()` regresses scaled Schoenfeld residuals on a function of time (default: KM transform) and tests the slope against zero. Per covariate p values flag whether that covariate's HR drifts; the GLOBAL row pools them. Here the global p value of 0.17 does not reject PH, so the Cox model is defensible. If PH fails, the regulator expects either a stratified Cox model (`strata(ph.ecog)`), a time varying coefficient (`tt()`), or a switch to an accelerated failure time model. A graphical companion is `plot(ex_3_4)`.

</details>

## Section 4. Mixed effects models for longitudinal data (3 problems)

### Exercise 4.1: Random intercept model for reaction time on sleepstudy

**Task:** Sleep researchers tracked reaction time across 10 days of sleep restriction in the built in `sleepstudy` dataset (lme4 package, 18 subjects). Fit a linear mixed model with a fixed effect of `Days` and a random intercept by `Subject`: `lmer(Reaction ~ Days + (1 | Subject), data = sleepstudy)`. Save the fitted model to `ex_4_1` and inspect fixed effects with `summary()`.

**Expected result:**

```
#> Linear mixed model fit by REML ['lmerMod']
#> Formula: Reaction ~ Days + (1 | Subject)
#>    Data: sleepstudy
#> REML criterion at convergence: 1786.5
#> Random effects:
#>  Groups   Name        Std.Dev.
#>  Subject  (Intercept) 37.12
#>  Residual             30.99
#> Number of obs: 180, groups:  Subject, 18
#> Fixed Effects:
#> (Intercept)         Days
#>      251.41        10.47
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- lmer(Reaction ~ Days + (1 | Subject), data = sleepstudy)
ex_4_1
```

**Explanation:** The random intercept (1 | Subject) gives each subject their own baseline reaction time, soaking up the obvious between subject variation (some people are just slower). The fixed slope of 10.47 ms per day of sleep restriction is the population average effect, which is the parameter a journal would report. The two variance components (Subject 37.12, Residual 30.99) say roughly half the noise is between subject and half within, which is a useful sanity check for any cluster randomized or longitudinal design.

</details>

### Exercise 4.2: Compare random intercept versus random slope models via likelihood ratio

**Task:** Does sleep deprivation hit some subjects harder than others? Fit a richer model with a random slope on Days plus a random intercept: `lmer(Reaction ~ Days + (Days | Subject), data = sleepstudy, REML = FALSE)` and compare it against the random intercept only baseline (also refit with `REML = FALSE`) using `anova()`. Save the anova result to `ex_4_2`.

**Expected result:**

```
#> Data: sleepstudy
#> Models:
#> m_ri: Reaction ~ Days + (1 | Subject)
#> m_rs: Reaction ~ Days + (Days | Subject)
#>      npar    AIC    BIC  logLik deviance  Chisq Df Pr(>Chisq)
#> m_ri    4 1802.1 1814.8 -897.0   1794.1
#> m_rs    6 1763.9 1783.1 -876.0   1751.9  42.14  2  7.07e-10
```

**Difficulty:** Advanced

```r title="Your turn"
m_ri <- lmer(Reaction ~ Days + (1 | Subject),     data = sleepstudy, REML = FALSE)
m_rs <- lmer(Reaction ~ Days + (Days | Subject),  data = sleepstudy, REML = FALSE)

ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
m_ri <- lmer(Reaction ~ Days + (1 | Subject),     data = sleepstudy, REML = FALSE)
m_rs <- lmer(Reaction ~ Days + (Days | Subject),  data = sleepstudy, REML = FALSE)

ex_4_2 <- anova(m_ri, m_rs)
ex_4_2
```

**Explanation:** When comparing nested models that differ in random effect structure, refit with maximum likelihood (`REML = FALSE`) because REML log likelihoods are only comparable for models with identical fixed effects. The chi square of 42 on 2 df (the variance of the random slope and its covariance with the intercept) gives an absurdly small p value, telling you sleep deprivation rates vary meaningfully across people. Failure to include the random slope when it is warranted yields anti conservative standard errors on the fixed effect, the classic Type I error inflation Barr et al. flagged.

</details>

### Exercise 4.3: Extract subject specific intercepts (BLUPs) and rank them

**Task:** A trial coordinator wants to identify which sleepstudy subjects start sharpest. From `ex_4_1` (the random intercept model), extract the conditional modes (`ranef()`) for each Subject, add them to the model's grand mean intercept, and return a tibble sorted ascending by `predicted_baseline_ms` with columns `Subject` and `predicted_baseline_ms`. Save to `ex_4_3`.

**Expected result:**

```
#> # A tibble: 18 x 2
#>    Subject predicted_baseline_ms
#>    <fct>                   <dbl>
#>  1 309                      210.
#>  2 335                      221.
#>  3 310                      222.
#>  4 371                      237.
#>  5 351                      245.
#> # 13 more rows hidden
```

**Difficulty:** Advanced

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
gm <- fixef(ex_4_1)["(Intercept)"]
re <- ranef(ex_4_1)$Subject

ex_4_3 <- tibble(
  Subject = rownames(re),
  predicted_baseline_ms = gm + re[, "(Intercept)"]
) |>
  mutate(Subject = factor(Subject)) |>
  arrange(predicted_baseline_ms)

ex_4_3
```

**Explanation:** `ranef()` returns each subject's BLUP (best linear unbiased predictor), which is the shrunken deviation from the population intercept. Adding it back to `fixef()["(Intercept)"]` reconstructs the per subject expected reaction time at Day 0. Shrinkage pulls subjects with few observations toward the population mean (a Bayesian style regularization), which is exactly why mixed models outperform per subject regressions when data is sparse. For uncertainty intervals on the BLUPs, use `arm::sim()` or `merTools::predictInterval()`.

</details>

## Section 5. Dose response and regression (3 problems)

### Exercise 5.1: One way ANOVA on tooth growth across delivery methods

**Task:** A pharmacology team is screening vitamin C delivery methods on guinea pig odontoblast length using the built in `ToothGrowth` dataset (60 pigs, two methods, three doses). Fit a one way ANOVA of `len` by `supp` (delivery method) and save the aov object to `ex_5_1`. Inspect with `summary()`.

**Expected result:**

```
#>             Df Sum Sq Mean Sq F value Pr(>F)
#> supp         1   205.4   205.35   3.668 0.0604
#> Residuals   58  3246.9    55.98
```

**Difficulty:** Beginner

```r title="Your turn"
ex_5_1 <- # your code here
summary(ex_5_1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- aov(len ~ supp, data = ToothGrowth)
summary(ex_5_1)
```

**Explanation:** With a single two level factor, one way ANOVA returns an F statistic that is exactly the square of the equal variance two sample t statistic; the p value here (0.06) sits at the conventional decision boundary. The borderline result is misleading because the design crosses `supp` with `dose`, and `dose` carries most of the variance. The honest model is a two way ANOVA that includes both factors plus their interaction (exercise 5.2), which is also the analysis pre specified in any well designed factorial experiment.

</details>

### Exercise 5.2: Two way ANOVA with supplement by dose interaction

**Task:** Continuing on `ToothGrowth`, fit a two way ANOVA of `len` against `supp`, `dose` (treated as a factor), and the interaction `supp:dose`. Save the aov to `ex_5_2` and inspect `summary()` to read each term's F statistic and p value.

**Expected result:**

```
#>                Df Sum Sq Mean Sq F value   Pr(>F)
#> supp            1  205.4   205.4   15.57 0.000231
#> factor(dose)    2 2426.4  1213.2   92.00 < 2e-16
#> supp:factor(dose)  2  108.3    54.2    4.11 0.021860
#> Residuals      54  712.1    13.2
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_2 <- # your code here
summary(ex_5_2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_2 <- aov(len ~ supp * factor(dose), data = ToothGrowth)
summary(ex_5_2)
```

**Explanation:** Wrapping `dose` in `factor()` lets the model estimate a separate mean per dose rather than enforcing a linear trend; with three levels this matters because the dose effect is not perfectly linear. The `supp * factor(dose)` shorthand expands to main effects plus the two way interaction. The significant interaction (p = 0.022) says the supplement effect depends on dose: at 0.5 and 1.0 mg/day VC outperforms OJ; at 2.0 mg/day they converge. Always interpret interactions before main effects when both are significant.

</details>

### Exercise 5.3: Logistic regression for binary endpoint with two covariates

**Task:** A vaccine immunology team has a binary responder endpoint (seroconverted yes or no) and wants to model it on `age` and `dose_mg`. Using the inline `vax` tibble below, fit `glm(responder ~ age + dose_mg, data = vax, family = binomial)`. Save the glm object to `ex_5_3` and inspect coefficients with `summary()`.

**Expected result:**

```
#> Call:
#> glm(formula = responder ~ age + dose_mg, family = binomial, data = vax)
#>
#> Coefficients:
#>              Estimate Std. Error z value Pr(>|z|)
#> (Intercept) -2.41183    1.05712  -2.282  0.02250
#> age         -0.04318    0.01816  -2.378  0.01740
#> dose_mg      0.05902    0.01806   3.268  0.00108
#>
#> Null deviance: 124.37  on 99  degrees of freedom
#> Residual deviance: 105.21  on 97  degrees of freedom
```

**Difficulty:** Advanced

```r title="Your turn"
set.seed(13)
vax <- tibble(
  subject_id = sprintf("S%03d", 1:100),
  age        = round(rnorm(100, 45, 12)),
  dose_mg    = sample(c(10, 25, 50, 100), 100, replace = TRUE),
  lp         = -2.4 - 0.04 * round(rnorm(100, 45, 12)) + 0.06 * sample(c(10, 25, 50, 100), 100, replace = TRUE)
) |>
  mutate(responder = rbinom(100, 1, plogis(lp)))

ex_5_3 <- # your code here
summary(ex_5_3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(13)
vax <- tibble(
  subject_id = sprintf("S%03d", 1:100),
  age        = round(rnorm(100, 45, 12)),
  dose_mg    = sample(c(10, 25, 50, 100), 100, replace = TRUE),
  lp         = -2.4 - 0.04 * round(rnorm(100, 45, 12)) + 0.06 * sample(c(10, 25, 50, 100), 100, replace = TRUE)
) |>
  mutate(responder = rbinom(100, 1, plogis(lp)))

ex_5_3 <- glm(responder ~ age + dose_mg, data = vax, family = binomial)
summary(ex_5_3)
```

**Explanation:** Logistic regression models the log odds of a binary outcome; `exp(coef)` converts a coefficient to an odds ratio per unit increase in the covariate. Here each additional milligram of dose multiplies the odds of seroconversion by `exp(0.059) = 1.06`, holding age fixed; each additional year of age divides them by `exp(0.043) = 1.04`. Always report odds ratios with 95 percent CI (`exp(confint(ex_5_3))`) and the deviance drop versus a null model as a global fit summary. For prediction calibration, use `pROC::roc()`.

</details>

## Section 6. Power, reproducibility, and reporting (2 problems)

### Exercise 6.1: Compute required sample size per arm for a two sample t test

**Task:** A protocol writer is sizing a Phase II trial to detect a mean difference of 8 mg/dL in LDL between drug and placebo, given a within group SD of 12, alpha 0.05 two sided, and power 0.80. Use `power.t.test(delta = 8, sd = 12, sig.level = 0.05, power = 0.80)` and save the htest like object to `ex_6_1`. Read `ex_6_1$n` for the per arm required size.

**Expected result:**

```
#>      Two-sample t test power calculation
#>
#>               n = 36.31
#>           delta = 8
#>              sd = 12
#>       sig.level = 0.05
#>           power = 0.8
#>     alternative = two.sided
#>
#> NOTE: n is number in *each* group
```

**Difficulty:** Beginner

```r title="Your turn"
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_1 <- power.t.test(delta = 8, sd = 12, sig.level = 0.05, power = 0.80)
ex_6_1
```

**Explanation:** Sample size is driven by the standardised effect size `delta / sd = 0.67`, the alpha, and the target power. The function returns 36.3 per arm, so the protocol rounds up to 37 per arm and adds a dropout inflation factor (e.g. divide by 1 minus expected dropout rate). For unequal arms, switch to `power.t.test` with `n = NULL` and solve over a grid, or use the `pwr` package which exposes `pwr.t2n.test()` for unbalanced designs. Always run a sensitivity sweep across plausible deltas before locking the protocol.

</details>

### Exercise 6.2: Apply Benjamini Hochberg FDR correction to a vector of p values

**Task:** A genomics team ran 12 contrasts and produced raw p values. Because the family wise error rate would be brutal at this scale, the analysis plan calls for Benjamini Hochberg FDR control at q = 0.05. Apply `p.adjust(method = "BH")` to the inline `p_raw` vector below and return a tibble sorted ascending by `q_value` with columns `contrast`, `p_value`, `q_value`. Save to `ex_6_2`.

**Expected result:**

```
#> # A tibble: 12 x 3
#>    contrast p_value q_value
#>    <chr>      <dbl>   <dbl>
#>  1 C03      0.0001  0.00120
#>  2 C09      0.0008  0.00480
#>  3 C07      0.0030  0.0120
#>  4 C01      0.0090  0.0270
#>  5 C11      0.0150  0.0360
#> # 7 more rows hidden
```

**Difficulty:** Intermediate

```r title="Your turn"
p_raw <- c(C01 = 0.009, C02 = 0.31, C03 = 0.0001, C04 = 0.55, C05 = 0.072,
           C06 = 0.42,  C07 = 0.003, C08 = 0.18,   C09 = 0.0008, C10 = 0.04,
           C11 = 0.015, C12 = 0.61)

ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
p_raw <- c(C01 = 0.009, C02 = 0.31, C03 = 0.0001, C04 = 0.55, C05 = 0.072,
           C06 = 0.42,  C07 = 0.003, C08 = 0.18,   C09 = 0.0008, C10 = 0.04,
           C11 = 0.015, C12 = 0.61)

ex_6_2 <- tibble(
  contrast = names(p_raw),
  p_value  = unname(p_raw),
  q_value  = p.adjust(p_raw, method = "BH")
) |>
  arrange(q_value)

ex_6_2
```

**Explanation:** Benjamini Hochberg controls the expected proportion of false discoveries among rejected hypotheses (FDR), which is a much friendlier criterion than family wise error rate when you are screening many contrasts and can tolerate a few false positives. For each rank `i`, BH compares `p[i]` against `i / m * q`; the largest `i` that satisfies the inequality defines the cut, and everything at or below it is declared significant. Bonferroni (`method = "bonferroni"`) is strict but loses power; BH is the default for omics, GWAS, and most modern multiplicity adjustments.

</details>

## What to do next

- [Linear Regression Exercises in R](Linear-Regression-Exercises-in-R.html): drill into regression diagnostics, transformations, and effect sizes.
- [Statistical Tests Exercises in R](Statistical-Tests-Exercises-in-R.html): broaden the hypothesis testing toolkit with one and two sample classics.
- [EDA Exercises in R](EDA-Exercises-in-R.html): the cleaning and visual triage that should run before every model fit.
- [R for Data Science Exercises](R-for-Data-Science-Exercises.html): tidyverse pipelines that scale these clinical workflows.
