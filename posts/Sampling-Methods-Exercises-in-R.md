---
title: "Sampling Methods Exercises in R: 20 Practice Problems"
slug: "Sampling-Methods-Exercises-in-R"
description: "Master sampling methods in R with 20 practice problems: simple random, stratified, cluster, bootstrap, jackknife, permutation. Hidden solutions."
keywords: "sampling methods R, bootstrap R exercises, stratified sampling R, permutation test R, R resampling practice"
mathjax: false
webr: true
date: "2026-05-11"
post_type: "EX"
sidebar_title: "Sampling Methods Exercises"
sidebar_order: 138
fr_parent: "Hypothesis-Testing-in-R.html"
auto_link_terms: "sampling methods R|bootstrap R exercises|stratified sampling R|permutation test R"
auto_link_case_sensitive: false
target_keyword: "sampling methods R exercises"
sibling_block_enabled: false
difficulty: "Intermediate"
---

# Sampling Methods Exercises in R: 20 Practice Problems

<p class="lead">Twenty practice problems on sampling in R: simple random, stratified, cluster, bootstrap, jackknife, permutation. Solutions hidden.</p>

```r title="Run this once before any exercise"
library(dplyr)
```

### Exercise 1: SRS without replacement

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
set.seed(1); sample(1:100, 10, replace = FALSE)
```

</details>

### Exercise 2: SRS with replacement

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
set.seed(1); sample(1:100, 10, replace = TRUE)
```

</details>

### Exercise 3: Sample rows of a data frame

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
set.seed(1); mtcars |> slice_sample(n = 5)
```

</details>

### Exercise 4: Sample proportion

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
set.seed(1); mtcars |> slice_sample(prop = 0.2)
```

</details>

### Exercise 5: Stratified sample per group

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
set.seed(1); iris |> slice_sample(n = 5, by = Species)
```

</details>

### Exercise 6: Stratified prop sample

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
set.seed(1); iris |> slice_sample(prop = 0.2, by = Species)
```

</details>

### Exercise 7: Weighted sample

**Difficulty:** Advanced. Weight by hp.

<details><summary>Show solution</summary>

```r
set.seed(1); mtcars |> slice_sample(n = 10, weight_by = hp)
```

</details>

### Exercise 8: createDataPartition (caret)

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
set.seed(1)
idx <- caret::createDataPartition(iris$Species, p = 0.7, list = FALSE)
length(idx)
```

</details>

### Exercise 9: Bootstrap CI for the mean

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
set.seed(1)
m <- replicate(2000, mean(sample(mtcars$mpg, replace = TRUE)))
quantile(m, c(0.025, 0.975))
```

</details>

### Exercise 10: Bootstrap CI for the median

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
set.seed(1)
m <- replicate(2000, median(sample(mtcars$mpg, replace = TRUE)))
quantile(m, c(0.025, 0.975))
```

</details>

### Exercise 11: Bootstrap with boot package

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
library(boot)
set.seed(1)
b <- boot(mtcars$mpg, function(d, i) mean(d[i]), R = 1000)
boot.ci(b, type = "bca")
```

</details>

### Exercise 12: Jackknife

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
n <- nrow(mtcars)
jack <- sapply(1:n, function(i) mean(mtcars$mpg[-i]))
mean(jack)   # jackknife estimate
```

</details>

### Exercise 13: Permutation test for two means

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
set.seed(1)
obs <- diff(by(mtcars$mpg, mtcars$am, mean))
perms <- replicate(2000, {
  am <- sample(mtcars$am)
  diff(by(mtcars$mpg, am, mean))
})
mean(abs(perms) >= abs(obs))
```

</details>

### Exercise 14: Resampling for SE

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
set.seed(1)
m <- replicate(1000, mean(sample(mtcars$mpg, replace = TRUE)))
sd(m)
```

</details>

### Exercise 15: Cluster sampling demo

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
set.seed(1)
clusters <- unique(mtcars$cyl)
chosen <- sample(clusters, 2)
mtcars |> filter(cyl %in% chosen)
```

</details>

### Exercise 16: K-fold split indices

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
set.seed(1)
folds <- sample(rep(1:5, length.out = nrow(mtcars)))
table(folds)
```

</details>

### Exercise 17: Train-test 70/30

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
set.seed(1)
idx <- sample(seq_len(nrow(mtcars)), 0.7 * nrow(mtcars))
list(train = nrow(mtcars[idx,]), test = nrow(mtcars[-idx,]))
```

</details>

### Exercise 18: Repeated bootstrap

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
set.seed(1)
results <- sapply(1:5, function(seed) {
  set.seed(seed)
  mean(replicate(500, mean(sample(mtcars$mpg, replace = TRUE))))
})
results
```

</details>

### Exercise 19: Systematic sample

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
step <- floor(nrow(mtcars) / 5)
mtcars[seq(1, nrow(mtcars), by = step), ]
```

</details>

### Exercise 20: Reservoir sampling concept

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
set.seed(1)
# Simple equivalent: random sample of fixed size from stream
reservoir <- sample(1:100, 5)
reservoir
```

</details>

## What to do next

- **Cross-Validation-Exercises** (coming) — CV builds on sampling.
- **Hypothesis-Testing-Exercises** (shipped) — permutation/bootstrap tests.
