---
title: "Mixed Effects Models Exercises in R: 15 Practice Problems"
slug: "Mixed-Effects-Models-Exercises-in-R"
description: "Master mixed-effects models in R with 15 practice problems: lme4, random intercepts, slopes, nested, REML. Hidden solutions."
keywords: "mixed effects models R exercises, lme4 R practice, random effects R, lmer exercises, mixed models R"
mathjax: true
webr: true
date: "2026-05-11"
post_type: "EX"
sidebar_title: "Mixed Effects Exercises"
sidebar_order: 162
fr_parent: "R-Tutorial.html"
auto_link_terms: "mixed effects models R exercises|lme4 R practice|random effects R|lmer exercises"
auto_link_case_sensitive: false
target_keyword: "mixed effects models R exercises"
sibling_block_enabled: false
difficulty: "Advanced"
---

# Mixed Effects Models Exercises in R: 15 Practice Problems

<p class="lead">Fifteen practice problems on mixed-effects models in R: lme4, random intercepts and slopes, nested groups, REML, model comparison. Hidden solutions.</p>

```r title="Run this once before any exercise"
library(lme4)
library(lmerTest)
library(dplyr)
```

### Exercise 1: Random intercept

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
data(sleepstudy)
lmer(Reaction ~ Days + (1 | Subject), data = sleepstudy)
```

</details>

### Exercise 2: Random slope

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
data(sleepstudy)
lmer(Reaction ~ Days + (Days | Subject), data = sleepstudy)
```

</details>

### Exercise 3: Uncorrelated random slope

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
data(sleepstudy)
lmer(Reaction ~ Days + (Days || Subject), data = sleepstudy)
```

</details>

### Exercise 4: Summary with p-values

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
data(sleepstudy)
fit <- lmer(Reaction ~ Days + (Days | Subject), data = sleepstudy)
summary(fit)
```

</details>

### Exercise 5: Random effects estimates

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
data(sleepstudy)
fit <- lmer(Reaction ~ Days + (Days | Subject), data = sleepstudy)
ranef(fit)
```

</details>

### Exercise 6: Fixed effects

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
data(sleepstudy)
fit <- lmer(Reaction ~ Days + (Days | Subject), data = sleepstudy)
fixef(fit)
```

</details>

### Exercise 7: Confidence intervals via profile

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
data(sleepstudy)
fit <- lmer(Reaction ~ Days + (1 | Subject), data = sleepstudy)
confint(fit)
```

</details>

### Exercise 8: ICC (intraclass correlation)

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
data(sleepstudy)
fit <- lmer(Reaction ~ 1 + (1 | Subject), data = sleepstudy)
performance::icc(fit)
```

</details>

### Exercise 9: Nested random effect

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
df <- tibble(school = rep(1:3, each = 20), student = rep(1:10, 6),
             score = rnorm(60))
lmer(score ~ 1 + (1 | school/student), data = df)
```

</details>

### Exercise 10: Crossed random effects

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
df <- tibble(rater = sample(1:5, 100, replace = TRUE),
             subject = sample(1:20, 100, replace = TRUE),
             y = rnorm(100))
lmer(y ~ 1 + (1 | rater) + (1 | subject), data = df)
```

</details>

### Exercise 11: Compare nested models

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
data(sleepstudy)
f1 <- lmer(Reaction ~ Days + (1 | Subject), data = sleepstudy, REML = FALSE)
f2 <- lmer(Reaction ~ Days + (Days | Subject), data = sleepstudy, REML = FALSE)
anova(f1, f2)
```

</details>

### Exercise 12: glmer (logistic mixed)

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
df <- tibble(group = rep(1:5, each = 20),
             x = rnorm(100),
             y = rbinom(100, 1, 0.3))
glmer(y ~ x + (1 | group), data = df, family = binomial)
```

</details>

### Exercise 13: Predict random effects

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
data(sleepstudy)
fit <- lmer(Reaction ~ Days + (Days | Subject), data = sleepstudy)
predict(fit, newdata = sleepstudy[1:5, ])
```

</details>

### Exercise 14: Marginal vs conditional predictions

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
data(sleepstudy)
fit <- lmer(Reaction ~ Days + (Days | Subject), data = sleepstudy)
# Marginal (population): re.form = NA
predict(fit, newdata = sleepstudy[1:3, ], re.form = NA)
```

</details>

### Exercise 15: Diagnostic plot

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
data(sleepstudy)
fit <- lmer(Reaction ~ Days + (Days | Subject), data = sleepstudy)
plot(fit)
```

</details>

## What to do next

- **Linear-Regression-Exercises** (shipped) — fixed-effects baseline.
- **Bayesian-Statistics-Exercises** (shipped) — Bayesian alternative.
