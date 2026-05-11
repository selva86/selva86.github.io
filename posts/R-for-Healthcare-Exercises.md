---
title: "R for Healthcare Exercises: 20 Practice Problems"
slug: "R-for-Healthcare-Exercises"
description: "Master R for healthcare with 20 practice problems: survival, odds ratios, ICD codes, longitudinal data, risk scores. Hidden solutions."
keywords: "R for healthcare exercises, healthcare data R, survival analysis R, R clinical data practice, odds ratios R"
mathjax: true
webr: true
date: "2026-05-11"
post_type: "EX"
sidebar_title: "R for Healthcare Exercises"
sidebar_order: 146
fr_parent: "R-Tutorial.html"
auto_link_terms: "R for healthcare exercises|healthcare data R|survival analysis R|R clinical data practice"
auto_link_case_sensitive: false
target_keyword: "R for healthcare exercises"
sibling_block_enabled: false
difficulty: "Advanced"
---

# R for Healthcare Exercises: 20 Practice Problems

<p class="lead">Twenty practice problems for healthcare data analysis in R: survival, odds ratios, longitudinal data, risk scores, prevalence. Hidden solutions.</p>

```r title="Run this once before any exercise"
library(dplyr)
library(survival)
library(broom)
```

### Exercise 1: Prevalence

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
cases <- 250; population <- 10000
cases / population
```

</details>

### Exercise 2: Incidence rate

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
new_cases <- 30; person_years <- 5000
new_cases / person_years
```

</details>

### Exercise 3: Sensitivity and specificity

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
TP <- 80; FN <- 20; TN <- 850; FP <- 50
list(sens = TP/(TP+FN), spec = TN/(TN+FP))
```

</details>

### Exercise 4: Positive predictive value

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
TP <- 80; FP <- 50
TP / (TP + FP)
```

</details>

### Exercise 5: Relative risk

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
# 2x2: exposed/disease
m <- matrix(c(40, 60, 20, 80), 2, 2)
risk_exp <- m[1,1] / sum(m[1,])
risk_un  <- m[2,1] / sum(m[2,])
risk_exp / risk_un
```

</details>

### Exercise 6: Odds ratio

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
m <- matrix(c(40, 60, 20, 80), 2, 2)
(m[1,1] * m[2,2]) / (m[1,2] * m[2,1])
```

</details>

### Exercise 7: Kaplan-Meier survival

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
fit <- survfit(Surv(time, status) ~ 1, data = lung)
plot(fit)
```

</details>

### Exercise 8: KM by group

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
fit <- survfit(Surv(time, status) ~ sex, data = lung)
plot(fit, col = 1:2)
```

</details>

### Exercise 9: Log-rank test

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
survdiff(Surv(time, status) ~ sex, data = lung)
```

</details>

### Exercise 10: Cox PH model

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
fit <- coxph(Surv(time, status) ~ age + sex, data = lung)
summary(fit)
```

</details>

### Exercise 11: Hazard ratio from Cox

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
fit <- coxph(Surv(time, status) ~ age + sex, data = lung)
exp(coef(fit))
```

</details>

### Exercise 12: Median survival time

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
fit <- survfit(Surv(time, status) ~ 1, data = lung)
summary(fit)$table["median"]
```

</details>

### Exercise 13: 5-year survival rate

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
fit <- survfit(Surv(time, status) ~ 1, data = lung)
summary(fit, times = 365*5)$surv
```

</details>

### Exercise 14: Logistic regression for disease

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
df <- tibble(age = sample(20:80, 200, replace = TRUE),
             smoke = sample(0:1, 200, replace = TRUE),
             disease = rbinom(200, 1, 0.2))
fit <- glm(disease ~ age + smoke, data = df, family = binomial)
summary(fit)
```

</details>

### Exercise 15: BMI calculation

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
weight_kg <- 70; height_m <- 1.75
weight_kg / height_m^2
```

</details>

### Exercise 16: BMI category

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
bmi <- c(17, 22, 28, 32)
cut(bmi, breaks = c(-Inf, 18.5, 25, 30, Inf),
    labels = c("under","normal","over","obese"))
```

</details>

### Exercise 17: Repeated measures (longitudinal mean)

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
df <- tibble(id = rep(1:5, 3), time = rep(1:3, each = 5),
             bp = c(120,130,125,140,135, 118,128,122,138,132, 116,126,120,136,130))
df |> group_by(id) |> summarise(mean_bp = mean(bp))
```

</details>

### Exercise 18: Standardize lab values to z-scores

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
lab <- c(120, 135, 110, 140, 125)
(lab - mean(lab)) / sd(lab)
```

</details>

### Exercise 19: Detect outlier vital signs

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
hr <- c(70, 72, 75, 68, 130, 71, 30)
hr[hr < 50 | hr > 120]
```

</details>

### Exercise 20: Compute days between visits

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
visits <- as.Date(c("2024-01-15","2024-02-20","2024-04-05"))
diff(visits)
```

</details>

## What to do next

- **R-for-Biostatistics-Exercises** (coming) — statistical methods deep.
- **Linear-Regression-Exercises** (shipped) — risk modeling.
