---
title: "broom Exercises in R: 15 Practice Problems"
slug: "broom-Exercises-in-R"
description: "Master broom in R with 15 practice problems: tidy, glance, augment for lm, glm, t.test, k-means. Hidden solutions."
keywords: "broom R exercises, broom tidy R, R model tidy practice, broom::glance examples"
mathjax: false
webr: true
date: "2026-05-11"
post_type: "EX"
sidebar_title: "broom Exercises"
sidebar_order: 159
fr_parent: "R-Tutorial.html"
auto_link_terms: "broom R exercises|broom tidy R|R model tidy practice|broom::glance examples"
auto_link_case_sensitive: false
target_keyword: "broom R exercises"
sibling_block_enabled: false
difficulty: "Intermediate"
---

# broom Exercises in R: 15 Practice Problems

<p class="lead">Fifteen practice problems on broom: tidy, glance, augment for common R models. Hidden solutions.</p>

```r title="Run this once before any exercise"
library(broom)
library(dplyr)
```

### Exercise 1: tidy lm

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
fit <- lm(mpg ~ wt, data = mtcars)
tidy(fit)
```

</details>

### Exercise 2: tidy with CI

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
fit <- lm(mpg ~ wt, data = mtcars)
tidy(fit, conf.int = TRUE)
```

</details>

### Exercise 3: glance lm

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
fit <- lm(mpg ~ wt, data = mtcars)
glance(fit)
```

</details>

### Exercise 4: augment lm

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
fit <- lm(mpg ~ wt, data = mtcars)
augment(fit) |> head()
```

</details>

### Exercise 5: tidy glm with exponentiate

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
fit <- glm(am ~ mpg, data = mtcars, family = binomial)
tidy(fit, exponentiate = TRUE, conf.int = TRUE)
```

</details>

### Exercise 6: tidy t.test

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
tidy(t.test(mpg ~ am, data = mtcars))
```

</details>

### Exercise 7: tidy cor.test

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
tidy(cor.test(mtcars$wt, mtcars$mpg))
```

</details>

### Exercise 8: tidy chisq.test

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
tidy(chisq.test(table(mtcars$cyl, mtcars$am)))
```

</details>

### Exercise 9: tidy aov

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
tidy(aov(Sepal.Length ~ Species, data = iris))
```

</details>

### Exercise 10: tidy survival fit

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
library(survival)
tidy(coxph(Surv(time, status) ~ age, data = lung))
```

</details>

### Exercise 11: Many models with broom

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
iris |>
  group_by(Species) |>
  tidyr::nest() |>
  mutate(model = purrr::map(data, ~ lm(Sepal.Length ~ Petal.Length, .x)),
         tidy = purrr::map(model, tidy)) |>
  tidyr::unnest(tidy)
```

</details>

### Exercise 12: glance per group

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
iris |>
  group_by(Species) |>
  tidyr::nest() |>
  mutate(model = purrr::map(data, ~ lm(Sepal.Length ~ Petal.Length, .x)),
         glance = purrr::map(model, glance)) |>
  tidyr::unnest(glance) |>
  select(Species, r.squared)
```

</details>

### Exercise 13: augment + residual plot

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
fit <- lm(mpg ~ wt, data = mtcars)
aug <- augment(fit)
plot(aug$.fitted, aug$.resid)
abline(h = 0)
```

</details>

### Exercise 14: tidy kmeans

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
set.seed(1)
km <- kmeans(iris[, 1:4], 3)
tidy(km)
```

</details>

### Exercise 15: glance kmeans

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
set.seed(1)
km <- kmeans(iris[, 1:4], 3)
glance(km)
```

</details>

## What to do next

- **Linear-Regression-Exercises** (shipped) — broom + lm in detail.
- **Machine-Learning-Exercises** (shipped) — broom + tidymodels.
