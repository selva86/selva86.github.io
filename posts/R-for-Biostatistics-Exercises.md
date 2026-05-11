---
title: "R for Biostatistics Exercises: 20 Practice Problems"
slug: "R-for-Biostatistics-Exercises"
description: "Master biostatistics in R with 20 practice problems: clinical trials, hazard ratios, paired tests, dose-response, mixed models. Hidden solutions."
keywords: "biostatistics R exercises, clinical trial R, R biostatistics practice, hazard ratio R, mixed models R"
mathjax: true
webr: true
date: "2026-05-11"
post_type: "EX"
sidebar_title: "R for Biostatistics"
sidebar_order: 147
fr_parent: "R-Tutorial.html"
auto_link_terms: "biostatistics R exercises|clinical trial R|R biostatistics practice|hazard ratio R"
auto_link_case_sensitive: false
target_keyword: "biostatistics R exercises"
sibling_block_enabled: false
difficulty: "Advanced"
---

# R for Biostatistics Exercises: 20 Practice Problems

<p class="lead">Twenty practice problems for biostatistics in R: clinical trials, hazard ratios, paired tests, dose-response, mixed-effects models. Hidden solutions.</p>

```r title="Run this once before any exercise"
library(dplyr)
library(survival)
library(broom)
```

### Exercise 1: 2x2 table odds ratio CI

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
m <- matrix(c(40, 60, 20, 80), 2, 2)
fisher.test(m)$conf.int
```

</details>

### Exercise 2: Paired comparison

**Difficulty:** Intermediate. Pre vs post.

<details><summary>Show solution</summary>

```r
pre <- c(120, 130, 125, 140, 135)
post <- c(115, 125, 120, 132, 128)
t.test(pre, post, paired = TRUE)
```

</details>

### Exercise 3: Wilcoxon signed-rank

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
pre <- c(120, 130, 125, 140, 135)
post <- c(115, 125, 120, 132, 128)
wilcox.test(pre, post, paired = TRUE)
```

</details>

### Exercise 4: One-way ANOVA for dose groups

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
df <- tibble(dose = factor(rep(c("low","mid","high"), each = 8)),
             outcome = c(rnorm(8, 10), rnorm(8, 12), rnorm(8, 14)))
summary(aov(outcome ~ dose, data = df))
```

</details>

### Exercise 5: Tukey post hoc

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
df <- tibble(dose = factor(rep(c("low","mid","high"), each = 8)),
             outcome = c(rnorm(8, 10), rnorm(8, 12), rnorm(8, 14)))
TukeyHSD(aov(outcome ~ dose, data = df))
```

</details>

### Exercise 6: Mixed-effects model (lme4)

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
df <- tibble(id = rep(1:10, each = 3),
             time = rep(1:3, 10),
             y = rnorm(30) + rep(rnorm(10), each = 3))
lme4::lmer(y ~ time + (1 | id), data = df)
```

</details>

### Exercise 7: Cox PH

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
coxph(Surv(time, status) ~ age + sex, data = lung)
```

</details>

### Exercise 8: Plot survival curves

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
fit <- survfit(Surv(time, status) ~ sex, data = lung)
plot(fit, col = c("blue","red"))
```

</details>

### Exercise 9: Stratified Cox

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
coxph(Surv(time, status) ~ age + strata(sex), data = lung)
```

</details>

### Exercise 10: Schoenfeld residuals (PH assumption)

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
fit <- coxph(Surv(time, status) ~ age + sex, data = lung)
cox.zph(fit)
```

</details>

### Exercise 11: Logistic regression

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
df <- tibble(age = sample(40:80, 200, replace = TRUE),
             disease = rbinom(200, 1, 0.3))
glm(disease ~ age, data = df, family = binomial)
```

</details>

### Exercise 12: Odds ratio CI from glm

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
df <- tibble(age = sample(40:80, 200, replace = TRUE),
             disease = rbinom(200, 1, 0.3))
fit <- glm(disease ~ age, data = df, family = binomial)
exp(confint(fit))
```

</details>

### Exercise 13: Confounder adjustment

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
df <- tibble(exposure = rbinom(200, 1, 0.5),
             age = sample(40:80, 200, replace = TRUE),
             outcome = rbinom(200, 1, 0.3))
glm(outcome ~ exposure + age, data = df, family = binomial)
```

</details>

### Exercise 14: ROC curve

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
df <- tibble(score = rnorm(200), outcome = rbinom(200, 1, 0.4))
pROC::roc(df$outcome, df$score) |> pROC::auc()
```

</details>

### Exercise 15: Sample size for two proportions

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
pwr::pwr.2p.test(h = pwr::ES.h(0.5, 0.4), power = 0.8, sig.level = 0.05)$n
```

</details>

### Exercise 16: Power for t-test

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
pwr::pwr.t.test(d = 0.5, n = 30, sig.level = 0.05)$power
```

</details>

### Exercise 17: Adjust p-values (BH)

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
p <- c(0.01, 0.04, 0.03, 0.20, 0.001)
p.adjust(p, method = "BH")
```

</details>

### Exercise 18: Bootstrap median CI

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
set.seed(1)
x <- rnorm(50, 100, 15)
b <- replicate(2000, median(sample(x, replace = TRUE)))
quantile(b, c(0.025, 0.975))
```

</details>

### Exercise 19: Number needed to treat

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
risk_control <- 0.30; risk_treat <- 0.20
1 / (risk_control - risk_treat)
```

</details>

### Exercise 20: Standardize dose

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
dose <- c(5, 10, 20, 40)
scale(dose)[,1]
```

</details>

## What to do next

- **R-for-Healthcare-Exercises** (shipped) — clinical analysis.
- **Hypothesis-Testing-Exercises** (shipped) — broader inference.
