---
title: "Survival Analysis Exercises in R: 15 Practice Problems"
slug: "Survival-Analysis-Exercises-in-R"
description: "Master survival analysis in R with 15 practice problems: Kaplan-Meier, Cox PH, hazard ratios, log-rank, survminer. Hidden solutions."
keywords: "survival analysis R exercises, Kaplan-Meier R, Cox PH R exercises, survminer R, hazard ratio R"
mathjax: true
webr: true
date: "2026-05-11"
post_type: "EX"
sidebar_title: "Survival Analysis Exercises"
sidebar_order: 163
fr_parent: "R-Tutorial.html"
auto_link_terms: "survival analysis R exercises|Kaplan-Meier R|Cox PH R exercises|survminer R"
auto_link_case_sensitive: false
target_keyword: "survival analysis R exercises"
sibling_block_enabled: false
difficulty: "Advanced"
---

# Survival Analysis Exercises in R: 15 Practice Problems

<p class="lead">Fifteen practice problems on survival analysis in R: Kaplan-Meier, Cox PH, hazard ratios, log-rank test, residuals, time-dependent covariates. Hidden solutions.</p>

```r title="Run this once before any exercise"
library(survival)
library(dplyr)
```

### Exercise 1: Build Surv object

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
data(lung)
head(Surv(lung$time, lung$status))
```

</details>

### Exercise 2: Kaplan-Meier curve

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
data(lung)
fit <- survfit(Surv(time, status) ~ 1, data = lung)
plot(fit)
```

</details>

### Exercise 3: KM by group

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
data(lung)
fit <- survfit(Surv(time, status) ~ sex, data = lung)
plot(fit, col = c("blue","red"))
```

</details>

### Exercise 4: Log-rank test

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
data(lung)
survdiff(Surv(time, status) ~ sex, data = lung)
```

</details>

### Exercise 5: Cox PH model

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
data(lung)
coxph(Surv(time, status) ~ age + sex, data = lung)
```

</details>

### Exercise 6: Hazard ratio

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
data(lung)
fit <- coxph(Surv(time, status) ~ age + sex, data = lung)
exp(coef(fit))
```

</details>

### Exercise 7: Test PH assumption

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
data(lung)
fit <- coxph(Surv(time, status) ~ age + sex, data = lung)
cox.zph(fit)
```

</details>

### Exercise 8: Stratified Cox

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
data(lung)
coxph(Surv(time, status) ~ age + strata(sex), data = lung)
```

</details>

### Exercise 9: Median survival

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
data(lung)
fit <- survfit(Surv(time, status) ~ sex, data = lung)
summary(fit)$table[, "median"]
```

</details>

### Exercise 10: 6-month survival prob

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
data(lung)
fit <- survfit(Surv(time, status) ~ sex, data = lung)
summary(fit, times = 180)$surv
```

</details>

### Exercise 11: survminer plot

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
data(lung)
fit <- survfit(Surv(time, status) ~ sex, data = lung)
# survminer::ggsurvplot(fit, data = lung, pval = TRUE)
```

</details>

### Exercise 12: Parametric survival (Weibull)

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
data(lung)
survreg(Surv(time, status) ~ age + sex, data = lung, dist = "weibull")
```

</details>

### Exercise 13: Cumulative hazard

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
data(lung)
fit <- survfit(Surv(time, status) ~ 1, data = lung)
plot(fit, fun = "cumhaz")
```

</details>

### Exercise 14: Schoenfeld residuals plot

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
data(lung)
fit <- coxph(Surv(time, status) ~ age + sex, data = lung)
plot(cox.zph(fit))
```

</details>

### Exercise 15: Concordance index

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
data(lung)
fit <- coxph(Surv(time, status) ~ age + sex, data = lung)
summary(fit)$concordance
```

</details>

## What to do next

- **R-for-Healthcare-Exercises** (shipped) — clinical metrics.
- **R-for-Biostatistics-Exercises** (shipped) — broader inference.
