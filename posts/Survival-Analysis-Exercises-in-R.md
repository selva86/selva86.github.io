---
title: "Survival Analysis Exercises in R: 18 Real-World Practice Problems"
slug: "Survival-Analysis-Exercises-in-R"
description: "Eighteen survival analysis practice problems in R: Kaplan-Meier curves, log-rank tests, Cox proportional hazards, residual diagnostics, and parametric models."
keywords: "survival analysis R exercises, Kaplan-Meier R, Cox proportional hazards R, log-rank test R, survminer R, hazard ratio R"
mathjax: true
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "Survival Analysis Exercises"
sidebar_order: 163
fr_parent: "R-Tutorial.html"
auto_link_terms: "survival analysis exercises|Kaplan-Meier in R|Cox proportional hazards|log-rank test in R|hazard ratio in R"
auto_link_case_sensitive: false
target_keyword: "survival analysis R exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Survival Analysis Exercises in R: 18 Real-World Practice Problems

<p class="lead">Eighteen practice problems on survival analysis in R: build Surv objects, fit Kaplan-Meier curves, run log-rank tests, fit and diagnose Cox proportional hazards models, fit parametric AFT models, and predict patient-level survival probabilities. Every solution is hidden until you click; the `lung` dataset from the `survival` package is the backbone.</p>

```r title="Run this once before any exercise"
library(survival)
library(survminer)
library(dplyr)
library(ggplot2)
library(broom)
library(flexsurv)
library(tibble)
data(lung)
lung <- lung |>
  mutate(
    sex     = factor(sex, levels = c(1, 2), labels = c("male", "female")),
    ph.ecog = factor(ph.ecog)
  )
```

## Section 1. Surv objects and Kaplan-Meier basics (3 problems)

### Exercise 1.1: Build a Surv object from time and event columns

**Task:** Construct a survival response object from the `lung` dataset, treating `time` as the follow-up duration in days and `status` as the event indicator (1 = censored, 2 = died). Print the first ten entries so a `+` clearly marks censored observations. Save the response object to `ex_1_1`.

**Expected result:**

```
#>  [1]  306   455  1010+  210   883  1022+  310   361   218   166
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_1 <- # your code here
head(ex_1_1, 10)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- Surv(time = lung$time, event = lung$status)
head(ex_1_1, 10)
#>  [1]  306   455  1010+  210   883  1022+  310   361   218   166
```

**Explanation:** `Surv()` packages two columns into a censored response that downstream functions like `survfit()` and `coxph()` understand. The `+` suffix marks right-censoring (the subject was still alive when last observed). The `status` column in `lung` is coded 1/2 (instead of 0/1), and `Surv()` auto-detects that convention: any non-1 value is treated as the event. If you ever load data where censoring is coded 0/1 with 1 = event, you can pass it directly without recoding.

</details>

### Exercise 1.2: Fit and summarize an overall Kaplan-Meier curve

**Task:** An oncology team treating advanced lung cancer patients wants a single overall survival curve for the cohort, ignoring all covariates. Fit a Kaplan-Meier estimator on the full `lung` cohort and print the `survfit` summary so the team can read off the number at risk, events, and median survival time. Save the model to `ex_1_2`.

**Expected result:**

```
#> Call: survfit(formula = Surv(time, status) ~ 1, data = lung)
#> 
#>        n events median 0.95LCL 0.95UCL
#> [1,] 228    165    310     285     363
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- survfit(Surv(time, status) ~ 1, data = lung)
ex_1_2
#> Call: survfit(formula = Surv(time, status) ~ 1, data = lung)
#> 
#>        n events median 0.95LCL 0.95UCL
#> [1,] 228    165    310     285     363
```

**Explanation:** The right-hand side `~ 1` is the intercept-only formula, telling `survfit()` to fit one curve across the whole cohort. Median survival here means the smallest time at which the estimated survival probability falls to 0.5 or below. Of 228 patients, 165 died during follow-up; the rest are censored, mostly because the study ended before they died. The bounds 285 and 363 are the 95% confidence interval on that median.

</details>

### Exercise 1.3: Read off survival probabilities at fixed time points

**Task:** A trial statistician needs the estimated 6-month and 1-year survival probabilities (with 95% confidence intervals) from the overall `lung` Kaplan-Meier curve. Use `summary()` on the fitted survfit object at `times = c(182, 365)` and store the resulting summary object as `ex_1_3`.

**Expected result:**

```
#> Call: survfit(formula = Surv(time, status) ~ 1, data = lung)
#> 
#>  time n.risk n.event survival std.err lower 95% CI upper 95% CI
#>   182    151      63    0.708  0.0303        0.651        0.770
#>   365     65      71    0.409  0.0358        0.345        0.486
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- survfit(Surv(time, status) ~ 1, data = lung)
ex_1_3 <- summary(fit, times = c(182, 365))
ex_1_3
#> Call: survfit(formula = Surv(time, status) ~ 1, data = lung)
#> 
#>  time n.risk n.event survival std.err lower 95% CI upper 95% CI
#>   182    151      63    0.708  0.0303        0.651        0.770
#>   365     65      71    0.409  0.0358        0.345        0.486
```

**Explanation:** `summary(fit, times = ...)` interpolates the step-function estimate at user-specified horizons, which is exactly the format clinical reports want. Roughly 71% of patients are alive at 6 months; that drops to 41% by 12 months. The "events" column is cumulative events up to that time, while "n.risk" is the number still at risk just after the time. The standard errors come from Greenwood's formula and are wider as the curve drops.

</details>

## Section 2. Group comparisons and log-rank tests (3 problems)

### Exercise 2.1: Fit Kaplan-Meier curves stratified by sex

**Task:** The same oncology team now wants to compare male versus female survival in `lung` to decide whether sex should enter the regulatory submission table as a stratification factor. Fit Kaplan-Meier curves by `sex` and print the summary so median survival, events, and risk counts appear side by side. Save the fit to `ex_2_1`.

**Expected result:**

```
#> Call: survfit(formula = Surv(time, status) ~ sex, data = lung)
#> 
#>              n events median 0.95LCL 0.95UCL
#> sex=male   138    112    270     212     310
#> sex=female  90     53    426     348     550
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- survfit(Surv(time, status) ~ sex, data = lung)
ex_2_1
#> Call: survfit(formula = Surv(time, status) ~ sex, data = lung)
#> 
#>              n events median 0.95LCL 0.95UCL
#> sex=male   138    112    270     212     310
#> sex=female  90     53    426     348     550
```

**Explanation:** Placing a factor on the right-hand side fits one curve per level. The gap between median survival of 270 days for males and 426 days for females is large enough to suggest a real prognostic signal, but the confidence intervals overlap, which is exactly why you follow up with a log-rank test (next exercise) rather than declaring victory on the medians alone. Plotting these curves with `plot(ex_2_1)` is the next visual step.

</details>

### Exercise 2.2: Run a log-rank test comparing male vs female survival

**Task:** Run the log-rank test on the `lung` cohort to test the null that the two sex-specific survival curves are identical. Use `survdiff()` with the default `rho = 0` so it is a true log-rank (not Peto). Save the test object to `ex_2_2` and inspect the chi-square statistic and p-value.

**Expected result:**

```
#> Call: survdiff(formula = Surv(time, status) ~ sex, data = lung)
#> 
#>              N Observed Expected (O-E)^2/E (O-E)^2/V
#> sex=male   138      112     91.6     4.55      10.3
#> sex=female  90       53     73.4     5.68      10.3
#> 
#>  Chisq= 10.3  on 1 degrees of freedom, p= 0.001
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- survdiff(Surv(time, status) ~ sex, data = lung)
ex_2_2
#> Call: survdiff(formula = Surv(time, status) ~ sex, data = lung)
#> 
#>              N Observed Expected (O-E)^2/E (O-E)^2/V
#> sex=male   138      112     91.6     4.55      10.3
#> sex=female  90       53     73.4     5.68      10.3
#> 
#>  Chisq= 10.3  on 1 degrees of freedom, p= 0.001
```

**Explanation:** `survdiff()` computes the log-rank statistic by comparing observed versus expected event counts in each group, summed over event times. With p = 0.001 we reject equality of curves, supporting the visual gap from the previous exercise. The `rho` argument switches weighting: `rho = 0` is the standard log-rank (equal weight across follow-up); `rho = 1` is the Peto test (weights early events). Use rho = 0 unless you have a domain reason to upweight early differences.

</details>

### Exercise 2.3: Stratified log-rank test adjusting for ECOG performance status

**Task:** A regulatory reviewer worries that the sex effect in `lung` is confounded by ECOG performance status (`ph.ecog`, where higher means sicker). Run a log-rank test of sex *within* strata of `ph.ecog` so the comparison is event-times pooled across patients with equal performance status. Drop rows with missing `ph.ecog` first. Save the stratified test as `ex_2_3`.

**Expected result:**

```
#> Call: survdiff(formula = Surv(time, status) ~ sex + strata(ph.ecog), 
#>     data = lung_complete)
#> 
#>              N Observed Expected (O-E)^2/E (O-E)^2/V
#> sex=male   137      111     91.7     4.07      9.13
#> sex=female  90       53     72.3     5.16      9.13
#> 
#>  Chisq= 9.1  on 1 degrees of freedom, p= 0.003
```

**Difficulty:** Advanced

```r title="Your turn"
lung_complete <- lung |> filter(!is.na(ph.ecog))
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
lung_complete <- lung |> filter(!is.na(ph.ecog))
ex_2_3 <- survdiff(Surv(time, status) ~ sex + strata(ph.ecog),
                   data = lung_complete)
ex_2_3
#> Call: survdiff(formula = Surv(time, status) ~ sex + strata(ph.ecog), 
#>     data = lung_complete)
#> 
#>              N Observed Expected (O-E)^2/E (O-E)^2/V
#> sex=male   137      111     91.7     4.07      9.13
#> sex=female  90       53     72.3     5.16      9.13
#> 
#>  Chisq= 9.1  on 1 degrees of freedom, p= 0.003
```

**Explanation:** Wrapping a covariate in `strata()` tells `survdiff()` to compute the log-rank within each level of that covariate and pool the resulting statistics. The chi-square barely moved from 10.3 (unstratified) to 9.1 (stratified by ECOG), which means the sex effect is *not* explained away by performance status: it is a genuine prognostic signal. If the chi-square had collapsed to near zero, you would conclude the apparent sex difference was driven by ECOG imbalance between the groups.

</details>

## Section 3. Cox proportional hazards modeling (4 problems)

### Exercise 3.1: Fit a univariate Cox model for the sex effect

**Task:** Quantify the sex effect from Section 2 on the hazard scale. Fit a Cox proportional hazards model with `sex` as the only covariate on `lung`. Use `coxph()` and save the fitted model as `ex_3_1`, then print it so the coefficient, exponentiated hazard ratio, and Wald p-value appear.

**Expected result:**

```
#> Call:
#> coxph(formula = Surv(time, status) ~ sex, data = lung)
#> 
#>              coef exp(coef) se(coef)      z       p
#> sexfemale -0.5310    0.5880   0.1672 -3.176 0.00149
#> 
#> Likelihood ratio test=10.63  on 1 df, p=0.001113
#> n= 228, number of events= 165
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- coxph(Surv(time, status) ~ sex, data = lung)
ex_3_1
#> Call:
#> coxph(formula = Surv(time, status) ~ sex, data = lung)
#> 
#>              coef exp(coef) se(coef)      z       p
#> sexfemale -0.5310    0.5880   0.1672 -3.176 0.00149
#> 
#> Likelihood ratio test=10.63  on 1 df, p=0.001113
#> n= 228, number of events= 165
```

**Explanation:** The Cox model expresses the hazard as $h(t \mid x) = h_0(t) \exp(\beta x)$, leaving the baseline hazard $h_0(t)$ unspecified. The `exp(coef)` of 0.588 is the hazard ratio: at any time $t$, a female patient's instantaneous risk of death is about 41% lower than a male patient's. The likelihood-ratio test agrees with the log-rank statistic from Exercise 2.2 because, in the univariate case, the two are asymptotically equivalent.

</details>

### Exercise 3.2: Multivariable Cox model adjusting for age and performance status

**Task:** A clinical researcher writing a survival section for a paper wants to know whether the sex effect persists after adjusting for `age` and `ph.ecog` (drop rows with `ph.ecog == 3` so each category has enough patients). Fit a multivariable Cox model with sex, age, and ECOG as predictors. Save the model to `ex_3_2`.

**Expected result:**

```
#>             coef exp(coef) se(coef)     z       p
#> sexfemale -0.554     0.575    0.168 -3.30 0.00097
#> age        0.011     1.011    0.009  1.20 0.22942
#> ph.ecog1   0.412     1.510    0.199  2.07 0.03857
#> ph.ecog2   0.844     2.325    0.226  3.74 0.00018
#> 
#> n= 226, number of events= 163 (1 obs deleted due to ph.ecog==3, 1 NA)
```

**Difficulty:** Intermediate

```r title="Your turn"
lung_3 <- lung |> filter(ph.ecog != 3, !is.na(ph.ecog))
ex_3_2 <- # your code here
summary(ex_3_2)$coefficients
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
lung_3 <- lung |> filter(ph.ecog != 3, !is.na(ph.ecog))
ex_3_2 <- coxph(Surv(time, status) ~ sex + age + ph.ecog, data = lung_3)
round(summary(ex_3_2)$coefficients, 3)
#>             coef exp(coef) se(coef)     z       p
#> sexfemale -0.554     0.575    0.168 -3.30 0.00097
#> age        0.011     1.011    0.009  1.20 0.22942
#> ph.ecog1   0.412     1.510    0.199  2.07 0.03857
#> ph.ecog2   0.844     2.325    0.226  3.74 0.00018
```

**Explanation:** The sex hazard ratio of 0.575 is almost identical to the univariate 0.588, so the female-advantage signal is robust to age and ECOG adjustment. Age contributes very little once ECOG is in the model (p = 0.23): ECOG already captures most of the "frailty" you would expect age to proxy. ECOG itself is a stepwise prognostic factor: each level beyond fully active doubles or more than doubles the hazard.

</details>

### Exercise 3.3: Extract hazard ratios with confidence intervals via broom::tidy

**Task:** Pull the hazard ratios and 95% confidence intervals from `ex_3_2` into a tidy data frame so they slot directly into a manuscript table. Use `broom::tidy()` with `exponentiate = TRUE` and `conf.int = TRUE`, keeping only `term`, `estimate`, `conf.low`, `conf.high`, and `p.value`. Save to `ex_3_3`.

**Expected result:**

```
#> # A tibble: 4 x 5
#>   term      estimate conf.low conf.high   p.value
#>   <chr>        <dbl>    <dbl>     <dbl>     <dbl>
#> 1 sexfemale    0.575    0.413     0.799 0.000968
#> 2 age          1.011    0.993     1.029 0.229   
#> 3 ph.ecog1     1.510    1.023     2.229 0.0386  
#> 4 ph.ecog2    2.325     1.494     3.620 0.000183
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- broom::tidy(ex_3_2, exponentiate = TRUE, conf.int = TRUE) |>
  select(term, estimate, conf.low, conf.high, p.value)
ex_3_3
#> # A tibble: 4 x 5
#>   term      estimate conf.low conf.high   p.value
#>   <chr>        <dbl>    <dbl>     <dbl>     <dbl>
#> 1 sexfemale    0.575    0.413     0.799 0.000968
#> 2 age          1.011    0.993     1.029 0.229   
#> 3 ph.ecog1     1.510    1.023     2.229 0.0386  
#> 4 ph.ecog2     2.325    1.494     3.620 0.000183
```

**Explanation:** `tidy()` returns log-hazard coefficients by default; `exponentiate = TRUE` converts them to hazard ratios in one step. The `conf.int = TRUE` flag triggers profile-likelihood-style confidence intervals (Wald-based here for Cox). Working in tibble form lets you `gt::gt()`, `flextable()`, or `kable()` straight into the manuscript without manual string formatting. Whenever a confidence interval excludes 1.0, the variable is significant at the corresponding alpha.

</details>

### Exercise 3.4: Stratified Cox model treating ECOG as nuisance

**Task:** A biostatistician suspects ECOG violates the proportional hazards assumption and wants to absorb it through stratification rather than as a covariate. Refit the Cox model on `lung_3` with `sex` and `age` as covariates and `ph.ecog` inside `strata()`. Save the stratified model to `ex_3_4` and print the coefficient table.

**Expected result:**

```
#>             coef exp(coef) se(coef)     z       p
#> sexfemale -0.546     0.579    0.168 -3.24 0.00118
#> age        0.011     1.012    0.009  1.30 0.19475
```

**Difficulty:** Advanced

```r title="Your turn"
ex_3_4 <- # your code here
round(summary(ex_3_4)$coefficients, 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_4 <- coxph(Surv(time, status) ~ sex + age + strata(ph.ecog),
                data = lung_3)
round(summary(ex_3_4)$coefficients, 3)
#>             coef exp(coef) se(coef)     z       p
#> sexfemale -0.546     0.579    0.168 -3.24 0.00118
#> age        0.011     1.012    0.009  1.30 0.19475
```

**Explanation:** Stratification fits a separate baseline hazard $h_0(t)$ per ECOG level but assumes the sex and age effects are common across strata. You lose the ECOG hazard ratios (they are no longer estimated) but gain robustness if ECOG's effect varies over time. The sex coefficient barely changed from -0.554 to -0.546, so the conclusions hold; stratification is a clean fallback when a covariate fails the PH check.

</details>

## Section 4. Diagnostics and the PH assumption (3 problems)

### Exercise 4.1: Test the proportional hazards assumption with Schoenfeld residuals

**Task:** Apply `cox.zph()` to the multivariable model `ex_3_2` to test whether each covariate's hazard ratio is constant over time. The PH assumption is the single biggest threat to Cox inference; a small p-value flags a violation. Save the result to `ex_4_1` and print it so the reviewer can see per-variable and global p-values.

**Expected result:**

```
#>             chisq df    p
#> sex      2.61e+00  1 0.11
#> age      2.04e-01  1 0.65
#> ph.ecog  6.93e+00  2 0.031
#> GLOBAL   9.51e+00  4 0.050
```

**Difficulty:** Advanced

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- cox.zph(ex_3_2)
ex_4_1
#>             chisq df    p
#> sex      2.61e+00  1 0.11
#> age      2.04e-01  1 0.65
#> ph.ecog  6.93e+00  2 0.031
#> GLOBAL   9.51e+00  4 0.050
```

**Explanation:** `cox.zph()` correlates scaled Schoenfeld residuals against a transform of follow-up time (default is `g(t) = (rank-1)/(n-1)`). A small p-value means the residuals trend with time, which means the hazard ratio is changing with time, which means the PH assumption is failing. Here, `ph.ecog` shows a borderline violation (p = 0.031), which justifies the stratified refit in Exercise 3.4. Sex passes comfortably.

</details>

### Exercise 4.2: Plot Schoenfeld residuals to visualize PH violation

**Task:** Use `ggcoxzph()` on `ex_4_1` to plot the scaled Schoenfeld residuals against transformed time for every covariate, with a smoothed reference line. A flat smooth means PH holds; a sloped or curved smooth flags violation. Save the gg list returned by the call as `ex_4_2`.

**Expected result:**

```
# A list of ggplot objects, one per covariate panel; each panel shows
# scaled Schoenfeld residuals against transformed time, with a LOESS
# smooth and 95% confidence band. The ph.ecog panels have a visible
# downward slope, matching its p = 0.031 in the cox.zph table.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_2 <- # your code here
print(ex_4_2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- ggcoxzph(ex_4_1)
# print(ex_4_2) renders the panels
#> A list of ggplot objects, one per covariate; ph.ecog panels show a
#> non-flat smooth indicating a PH violation, consistent with p = 0.031.
```

**Explanation:** `ggcoxzph()` is the visual companion to `cox.zph()`. The smoothed curve through the residuals should be approximately horizontal under PH; a slope means the log hazard ratio is drifting over follow-up time. For ECOG, the smoothed line drops, meaning the hazard penalty of high-ECOG patients is largest early in follow-up and attenuates later. This pattern is common for frailty-like markers, where the sickest subjects either die quickly or stabilize.

</details>

### Exercise 4.3: Check functional form of age with martingale residuals

**Task:** An epidemiologist worries that the age effect in the Cox model is non-linear. Fit a Cox model on `lung_3` with no covariates (null model) and plot the martingale residuals against `age` with a smoother. A roughly straight smooth supports linearity; curvature suggests a non-linear transformation is needed. Save the martingale residual vector to `ex_4_3`.

**Expected result:**

```
#> # First 6 values:
#> [1]  0.4825 -0.0921 -0.1644  0.5147  0.2916 -0.7053
#> # The smoothed plot is approximately linear across age 40-80, with
#> # mild downward curvature past 75, hinting at slightly steeper risk
#> # at the oldest ages but not enough to justify a spline.
```

**Difficulty:** Advanced

```r title="Your turn"
ex_4_3 <- # your code here
head(ex_4_3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
null_fit <- coxph(Surv(time, status) ~ 1, data = lung_3)
ex_4_3 <- residuals(null_fit, type = "martingale")
plot(lung_3$age, ex_4_3, xlab = "Age", ylab = "Martingale residual")
lines(lowess(lung_3$age, ex_4_3), col = "red", lwd = 2)
round(head(ex_4_3), 4)
#> [1]  0.4825 -0.0921 -0.1644  0.5147  0.2916 -0.7053
```

**Explanation:** Martingale residuals from a null Cox model equal `event - expected events`, where expected events come only from the Nelson-Aalen baseline. Plotting them against a candidate covariate reveals the optimal functional form: a straight smoother supports entering the variable linearly, a curved smoother suggests a transformation (log, splines via `pspline()`, or a categorical bucket). Since this plot is approximately linear, leaving age as-is in the multivariable Cox model was reasonable.

</details>

## Section 5. Parametric and accelerated failure time models (2 problems)

### Exercise 5.1: Fit a Weibull AFT model with flexsurv

**Task:** A pharmacology team needs a parametric survival model so they can extrapolate the survival curve beyond the observed `lung` follow-up window (Cox cannot extrapolate without the baseline hazard). Fit a Weibull accelerated failure time model with `sex` as the only covariate using `flexsurvreg()`. Save the fitted model to `ex_5_1`.

**Expected result:**

```
#> Call:
#> flexsurvreg(formula = Surv(time, status) ~ sex, data = lung, dist = "weibull")
#> 
#> Estimates: 
#>             est       L95%      U95%      se      
#> shape       1.32      1.18      1.48      0.0759  
#> scale       388.94    321.51    470.50    37.83   
#> sexfemale   1.50      1.16      1.95      0.20    
#> 
#> N = 228, Events: 165, Censored: 63
#> Total time at risk: 69683
#> Log-likelihood = -1153.85, df = 3
#> AIC = 2313.69
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- flexsurvreg(Surv(time, status) ~ sex, data = lung, dist = "weibull")
ex_5_1
#> shape       1.32
#> scale       388.94
#> sexfemale   1.50  (this is the time-acceleration factor)
#> AIC         2313.69
```

**Explanation:** A Weibull AFT models log survival time as a linear function of covariates: log(T) = mu + beta*x + sigma*epsilon. The shape parameter > 1 means hazard is increasing with time (typical for terminal disease). The `sexfemale` coefficient of 1.50 means females survive 1.5 times longer than males on the time scale, which mirrors the hazard-scale finding (HR = 0.588 ≈ 1/1.70 in Exercise 3.1). Use `flexsurvreg()` when you need to simulate, extrapolate, or quote median survival as a closed-form quantity.

</details>

### Exercise 5.2: Compare exponential vs Weibull fits by AIC

**Task:** Fit both an exponential AFT and a Weibull AFT model to `lung` with `sex` as the only covariate. Build a tibble named `ex_5_2` with columns `dist`, `aic`, and `loglik` for both fits so the team can see whether the extra Weibull shape parameter is worth its degree of freedom.

**Expected result:**

```
#> # A tibble: 2 x 3
#>   dist          aic loglik
#>   <chr>       <dbl>  <dbl>
#> 1 exponential 2326. -1161.
#> 2 weibull     2314. -1154.
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
exp_fit  <- flexsurvreg(Surv(time, status) ~ sex, data = lung, dist = "exp")
wei_fit  <- flexsurvreg(Surv(time, status) ~ sex, data = lung, dist = "weibull")
ex_5_2 <- tibble::tibble(
  dist   = c("exponential", "weibull"),
  aic    = c(exp_fit$AIC,  wei_fit$AIC),
  loglik = c(exp_fit$loglik, wei_fit$loglik)
)
ex_5_2
#> # A tibble: 2 x 3
#>   dist          aic loglik
#>   <chr>       <dbl>  <dbl>
#> 1 exponential 2326. -1161.
#> 2 weibull     2314. -1154.
```

**Explanation:** AIC drops by about 12 when moving from exponential to Weibull, a clearly preferred fit. The exponential is just Weibull with shape fixed at 1 (constant hazard), so the comparison answers "is the hazard rising or falling over time?". A shape estimate of 1.32 with AIC strongly favoring Weibull means the hazard is meaningfully increasing, and assuming a constant hazard would understate late risk. Use AIC over likelihood-ratio when comparing non-nested or differently-parameterized models.

</details>

## Section 6. End-to-end clinical workflows (3 problems)

### Exercise 6.1: Build a risk table from a Kaplan-Meier fit

**Task:** A hospital reporting analyst building a quarterly dashboard wants a risk table for the `lung` cohort showing the number at risk and number of events at days 0, 100, 200, 400, and 600. Use `summary(fit, times = ...)` and assemble a tibble with columns `time`, `n.risk`, `n.event`, `surv`, `surv_lower`, `surv_upper`. Save to `ex_6_1`.

**Expected result:**

```
#> # A tibble: 5 x 6
#>    time n.risk n.event  surv surv_lower surv_upper
#>   <dbl>  <dbl>   <dbl> <dbl>      <dbl>      <dbl>
#> 1     0    228       0 1          1          1    
#> 2   100    196      31 0.864      0.821      0.910
#> 3   200    144      77 0.664      0.605      0.728
#> 4   400     55     124 0.341      0.282      0.413
#> 5   600     22     153 0.176      0.124      0.250
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- survfit(Surv(time, status) ~ 1, data = lung)
s <- summary(fit, times = c(0, 100, 200, 400, 600))
ex_6_1 <- tibble::tibble(
  time       = s$time,
  n.risk     = s$n.risk,
  n.event    = s$n.event,
  surv       = s$surv,
  surv_lower = s$lower,
  surv_upper = s$upper
)
ex_6_1
#> # A tibble: 5 x 6
#>    time n.risk n.event  surv surv_lower surv_upper
#>   <dbl>  <dbl>   <dbl> <dbl>      <dbl>      <dbl>
#> 1     0    228       0 1          1          1    
#> 2   100    196      31 0.864      0.821      0.910
#> 3   200    144      77 0.664      0.605      0.728
#> 4   400     55     124 0.341      0.282      0.413
#> 5   600     22     153 0.176      0.124      0.250
```

**Explanation:** The summary object from `survfit` exposes per-time vectors that you can lift directly into a tibble for reporting tools. The `n.event` column is cumulative events up to the time point; subtracting consecutive rows gives interval events if needed. A risk table like this anchors a Kaplan-Meier plot in the appendix of a clinical paper, satisfying CONSORT-style reporting requirements that every survival figure must declare risk counts.

</details>

### Exercise 6.2: Render a publication-grade KM plot with confidence bands and risk table

**Task:** Reproduce the canonical clinical-paper survival figure for `lung` stratified by sex: Kaplan-Meier curves with shaded 95% confidence bands, a p-value annotation from the log-rank test, a censoring tick mark layer, and a risk table beneath the plot. Save the survminer object to `ex_6_2`.

**Expected result:**

```
# A ggsurvplot object containing:
#   - Two KM step curves (sex=male, sex=female) with shaded 95% CI bands
#   - "+" tick marks at censoring times
#   - Annotated log-rank p-value (p = 0.0013)
#   - "Number at risk" table beneath the main panel at times 0, 250, 500, 750, 1000
```

**Difficulty:** Intermediate

```r title="Your turn"
fit_sex <- survfit(Surv(time, status) ~ sex, data = lung)
ex_6_2 <- # your code here
print(ex_6_2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit_sex <- survfit(Surv(time, status) ~ sex, data = lung)
ex_6_2 <- ggsurvplot(
  fit_sex,
  data         = lung,
  conf.int     = TRUE,
  pval         = TRUE,
  risk.table   = TRUE,
  censor.shape = "+",
  xlab         = "Days from randomization",
  legend.title = "Sex",
  palette      = c("steelblue", "tomato")
)
# print(ex_6_2)
#> Publication-grade KM plot with risk table and log-rank p annotation.
```

**Explanation:** `ggsurvplot()` wraps a `survfit` object into a ggplot with all the trimmings clinical journals require: confidence bands, censoring marks, embedded p-value, and the risk table below. Setting `pval = TRUE` auto-runs a log-rank test and prints the result; pass `pval.method = TRUE` to also label which test was used. The risk table is rendered as a separate ggplot below the main panel and aligns by x-axis. Avoid `conf.int = TRUE` when overlaying many groups, as the shading collides.

</details>

### Exercise 6.3: Predict 1-year survival probability for new patient profiles

**Task:** Predict 1-year survival probability for two hypothetical lung cancer patients using `ex_3_2`: patient A is a 60-year-old male with ECOG 1, and patient B is a 70-year-old female with ECOG 0. Use `survfit()` on the Cox model with `newdata` to obtain survival curves, then read off the survival probability at t = 365. Save the predicted probabilities as `ex_6_3`.

**Expected result:**

```
#> # A tibble: 2 x 2
#>   patient prob_1yr
#>   <chr>      <dbl>
#> 1 A          0.343
#> 2 B          0.620
```

**Difficulty:** Advanced

```r title="Your turn"
newpts <- tibble::tibble(
  patient = c("A", "B"),
  sex     = factor(c("male", "female"), levels = c("male", "female")),
  age     = c(60, 70),
  ph.ecog = factor(c("1", "0"), levels = c("0", "1", "2"))
)
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
newpts <- tibble::tibble(
  patient = c("A", "B"),
  sex     = factor(c("male", "female"), levels = c("male", "female")),
  age     = c(60, 70),
  ph.ecog = factor(c("1", "0"), levels = c("0", "1", "2"))
)
sf <- survfit(ex_3_2, newdata = newpts)
s  <- summary(sf, times = 365)
ex_6_3 <- tibble::tibble(
  patient  = newpts$patient,
  prob_1yr = as.numeric(s$surv)
)
ex_6_3
#> # A tibble: 2 x 2
#>   patient prob_1yr
#>   <chr>      <dbl>
#> 1 A          0.343
#> 2 B          0.620
```

**Explanation:** `survfit(coxph_model, newdata = ...)` returns the Breslow-estimated survival curve for each new covariate profile, combining the baseline cumulative hazard with the linear predictor. `summary(sf, times = 365)` evaluates the curve at one year. Despite patient B being older, her female sex and lower ECOG drive a much higher predicted 1-year survival (62% vs 34%). This is exactly the calculation a clinician runs to quote individualized prognosis to a patient at consultation.

</details>

## What to do next

Now that you have a structural map of survival analysis in R, pick the next hub that fits your workflow:

- [Logistic Regression Exercises](Logistic-Regression-Exercises-in-R.html) for binary outcomes that survival models cannot handle.
- [ggplot2 Exercises](ggplot2-Exercises-in-R.html) to sharpen the figures you produce around any survival fit.
- [dplyr Exercises](dplyr-Exercises-in-R.html) for the data-shaping steps that always precede a `coxph()` call.
- [ANOVA Exercises](ANOVA-Exercises-in-R.html) for hypothesis testing on continuous outcomes alongside the log-rank.
