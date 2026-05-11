---
title: "GAM Exercises in R: 15 Practice Problems"
slug: "GAM-Exercises-in-R"
description: "Master Generalized Additive Models in R with 15 practice problems: mgcv, splines, smooths, interactions, predict. Hidden solutions."
keywords: "GAM R exercises, mgcv R practice, generalized additive models R, splines R exercises"
mathjax: true
webr: true
date: "2026-05-11"
post_type: "EX"
sidebar_title: "GAM Exercises"
sidebar_order: 164
fr_parent: "R-Tutorial.html"
auto_link_terms: "GAM R exercises|mgcv R practice|generalized additive models R|splines R exercises"
auto_link_case_sensitive: false
target_keyword: "GAM R exercises"
sibling_block_enabled: false
difficulty: "Advanced"
---

# GAM Exercises in R: 15 Practice Problems

<p class="lead">Fifteen practice problems on Generalized Additive Models in R: mgcv, smooth terms, splines, interaction smooths, predict. Hidden solutions.</p>

```r title="Run this once before any exercise"
library(mgcv)
library(dplyr)
```

### Exercise 1: Simple GAM

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
gam(mpg ~ s(wt), data = mtcars)
```

</details>

### Exercise 2: Two smooth terms

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
gam(mpg ~ s(wt) + s(hp), data = mtcars)
```

</details>

### Exercise 3: Linear + smooth

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
gam(mpg ~ wt + s(hp), data = mtcars)
```

</details>

### Exercise 4: Set basis dimension

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
gam(mpg ~ s(wt, k = 5), data = mtcars)
```

</details>

### Exercise 5: Tensor product (interaction smooth)

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
gam(mpg ~ te(wt, hp), data = mtcars)
```

</details>

### Exercise 6: GAM with categorical

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
gam(mpg ~ s(wt) + factor(cyl), data = mtcars)
```

</details>

### Exercise 7: Different smooth basis (cr)

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
gam(mpg ~ s(wt, bs = "cr"), data = mtcars)
```

</details>

### Exercise 8: Smooth by group

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
gam(mpg ~ s(wt, by = factor(cyl)) + factor(cyl), data = mtcars)
```

</details>

### Exercise 9: Plot a smooth

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
fit <- gam(mpg ~ s(wt), data = mtcars)
plot(fit)
```

</details>

### Exercise 10: Summary

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
fit <- gam(mpg ~ s(wt) + s(hp), data = mtcars)
summary(fit)
```

</details>

### Exercise 11: Predict new

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
fit <- gam(mpg ~ s(wt), data = mtcars)
predict(fit, newdata = data.frame(wt = c(2.5, 4)))
```

</details>

### Exercise 12: Edf (effective df)

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
fit <- gam(mpg ~ s(wt), data = mtcars)
summary(fit)$edf
```

</details>

### Exercise 13: Concurvity (GAM collinearity)

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
fit <- gam(mpg ~ s(wt) + s(hp), data = mtcars)
concurvity(fit)
```

</details>

### Exercise 14: GAM for binary outcome

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
gam(am ~ s(mpg) + s(hp), data = mtcars, family = binomial)
```

</details>

### Exercise 15: Check residuals

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
fit <- gam(mpg ~ s(wt), data = mtcars)
gam.check(fit)
```

</details>

## What to do next

- **Linear-Regression-Exercises** (shipped) — linear baseline.
- **Mixed-Effects-Models-Exercises** (shipped) — hierarchical alternative.
