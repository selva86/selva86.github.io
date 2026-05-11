---
title: "Poisson Regression Exercises in R: 12 Practice Problems"
slug: "Poisson-Regression-Exercises-in-R"
description: "Master Poisson regression in R with 12 practice problems: glm, count data, rate models, offset, overdispersion."
keywords: "Poisson regression R exercises, count regression R, R glm Poisson, overdispersion R"
mathjax: true
webr: true
date: "2026-05-11"
post_type: "EX"
sidebar_title: "Poisson Regression"
sidebar_order: 173
fr_parent: "R-Tutorial.html"
auto_link_terms: "Poisson regression R exercises|count regression R|R glm Poisson|overdispersion R"
auto_link_case_sensitive: false
target_keyword: "Poisson regression R exercises"
sibling_block_enabled: false
difficulty: "Advanced"
---

# Poisson Regression Exercises in R: 12 Practice Problems

<p class="lead">Twelve practice problems on Poisson regression in R: fit, interpret, offset, rate models, overdispersion checks.</p>

```r
library(dplyr)
```

### Exercise 1: Fit Poisson GLM

<details><summary>Show solution</summary>

```r
df <- tibble(x = 1:50, count = rpois(50, lambda = exp(0.5 + 0.05 * 1:50)))
glm(count ~ x, data = df, family = poisson)
```

</details>

### Exercise 2: Coefficient interpretation

<details><summary>Show solution</summary>

```r
df <- tibble(x = 1:50, count = rpois(50, lambda = exp(0.5 + 0.05*1:50)))
fit <- glm(count ~ x, data = df, family = poisson)
exp(coef(fit)["x"])   # multiplicative effect per unit
```

</details>

### Exercise 3: Predict counts

<details><summary>Show solution</summary>

```r
df <- tibble(x = 1:50, count = rpois(50, lambda = exp(0.5 + 0.05*1:50)))
fit <- glm(count ~ x, data = df, family = poisson)
predict(fit, newdata = data.frame(x = c(10, 30)), type = "response")
```

</details>

### Exercise 4: With offset (rate model)

<details><summary>Show solution</summary>

```r
df <- tibble(events = rpois(50, 5), exposure = sample(50:200, 50, replace = TRUE), group = sample(c("a","b"), 50, replace = TRUE))
glm(events ~ group + offset(log(exposure)), data = df, family = poisson)
```

</details>

### Exercise 5: Test overdispersion

<details><summary>Show solution</summary>

```r
df <- tibble(x = 1:50, count = rpois(50, 5))
fit <- glm(count ~ x, data = df, family = poisson)
sum(residuals(fit, type = "pearson")^2) / fit$df.residual   # >1 suggests overdispersion
```

</details>

### Exercise 6: Negative binomial alternative

<details><summary>Show solution</summary>

```r
df <- tibble(x = 1:50, count = rnbinom(50, size = 2, mu = 5))
MASS::glm.nb(count ~ x, data = df)
```

</details>

### Exercise 7: Quasi-Poisson for overdispersion

<details><summary>Show solution</summary>

```r
df <- tibble(x = 1:50, count = rnbinom(50, size = 1, mu = 5))
glm(count ~ x, data = df, family = quasipoisson)
```

</details>

### Exercise 8: Zero-inflated Poisson

<details><summary>Show solution</summary>

```r
# library(pscl); zeroinfl(count ~ x, data = df)
```

</details>

### Exercise 9: AIC

<details><summary>Show solution</summary>

```r
df <- tibble(x = 1:50, count = rpois(50, 5))
fit <- glm(count ~ x, data = df, family = poisson)
AIC(fit)
```

</details>

### Exercise 10: Residual diagnostics

<details><summary>Show solution</summary>

```r
df <- tibble(x = 1:50, count = rpois(50, 5))
fit <- glm(count ~ x, data = df, family = poisson)
par(mfrow = c(2,2)); plot(fit); par(mfrow = c(1,1))
```

</details>

### Exercise 11: Multiple predictors

<details><summary>Show solution</summary>

```r
df <- tibble(x1 = 1:50, x2 = rnorm(50), count = rpois(50, 5))
glm(count ~ x1 + x2, data = df, family = poisson)
```

</details>

### Exercise 12: Interaction

<details><summary>Show solution</summary>

```r
df <- tibble(x = 1:50, group = sample(c("a","b"), 50, replace = TRUE),
             count = rpois(50, 5))
glm(count ~ x * group, data = df, family = poisson)
```

</details>

## What to do next

- **Logistic-Regression-Exercises** (shipped) — binary GLM.
- **Linear-Regression-Exercises** (shipped) — continuous outcome.
