---
title: "Survey Analysis in R Exercises: 15 Practice Problems"
slug: "Survey-Analysis-in-R-Exercises"
description: "Master survey analysis in R with 15 practice problems: survey package, weights, stratification, design effects. Hidden solutions."
keywords: "survey analysis R exercises, survey package R, weighted analysis R, stratified survey R"
mathjax: true
webr: true
date: "2026-05-11"
post_type: "EX"
sidebar_title: "Survey Analysis Exercises"
sidebar_order: 157
fr_parent: "R-Tutorial.html"
auto_link_terms: "survey analysis R exercises|survey package R|weighted analysis R|stratified survey R"
auto_link_case_sensitive: false
target_keyword: "survey analysis R exercises"
sibling_block_enabled: false
difficulty: "Advanced"
---

# Survey Analysis in R Exercises: 15 Practice Problems

<p class="lead">Fifteen practice problems on survey data analysis in R: design objects, weights, strata, replicate weights, regression. Hidden solutions.</p>

```r title="Run this once before any exercise"
library(survey)
library(dplyr)
```

### Exercise 1: Build svydesign

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
data(api, package = "survey")
des <- svydesign(id = ~1, weights = ~pw, data = apistrat, strata = ~stype)
des
```

</details>

### Exercise 2: Weighted mean

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
data(api, package = "survey")
des <- svydesign(id = ~1, weights = ~pw, data = apistrat, strata = ~stype)
svymean(~api00, des)
```

</details>

### Exercise 3: Weighted total

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
data(api, package = "survey")
des <- svydesign(id = ~1, weights = ~pw, data = apistrat, strata = ~stype)
svytotal(~enroll, des)
```

</details>

### Exercise 4: Stratum-specific means

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
data(api, package = "survey")
des <- svydesign(id = ~1, weights = ~pw, data = apistrat, strata = ~stype)
svyby(~api00, ~stype, des, svymean)
```

</details>

### Exercise 5: Weighted proportion

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
data(api, package = "survey")
des <- svydesign(id = ~1, weights = ~pw, data = apistrat, strata = ~stype)
svymean(~factor(awards), des)
```

</details>

### Exercise 6: Confidence intervals

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
data(api, package = "survey")
des <- svydesign(id = ~1, weights = ~pw, data = apistrat, strata = ~stype)
confint(svymean(~api00, des))
```

</details>

### Exercise 7: Weighted regression

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
data(api, package = "survey")
des <- svydesign(id = ~1, weights = ~pw, data = apistrat, strata = ~stype)
svyglm(api00 ~ meals, des) |> summary()
```

</details>

### Exercise 8: Weighted chi-square

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
data(api, package = "survey")
des <- svydesign(id = ~1, weights = ~pw, data = apistrat, strata = ~stype)
svychisq(~awards + stype, des)
```

</details>

### Exercise 9: Two-stage cluster

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
data(api, package = "survey")
des <- svydesign(id = ~dnum + snum, weights = ~pw, data = apiclus2)
svymean(~api00, des)
```

</details>

### Exercise 10: Replicate weights

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
data(api, package = "survey")
des <- svydesign(id = ~1, weights = ~pw, data = apistrat, strata = ~stype)
rep_des <- as.svrepdesign(des, type = "bootstrap", replicates = 100)
svymean(~api00, rep_des)
```

</details>

### Exercise 11: Quantiles

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
data(api, package = "survey")
des <- svydesign(id = ~1, weights = ~pw, data = apistrat, strata = ~stype)
svyquantile(~api00, des, c(0.25, 0.5, 0.75))
```

</details>

### Exercise 12: Cross-tab with row %

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
data(api, package = "survey")
des <- svydesign(id = ~1, weights = ~pw, data = apistrat, strata = ~stype)
svytable(~stype + awards, des, Ntotal = 100) |> prop.table(1)
```

</details>

### Exercise 13: Subset of design

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
data(api, package = "survey")
des <- svydesign(id = ~1, weights = ~pw, data = apistrat, strata = ~stype)
es <- subset(des, stype == "E")
svymean(~api00, es)
```

</details>

### Exercise 14: Effective sample size

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
data(api, package = "survey")
des <- svydesign(id = ~1, weights = ~pw, data = apistrat, strata = ~stype)
# Design effect = var(svymean)/var(srs)
# Effective n = n / deff
```

</details>

### Exercise 15: Post-stratification

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
data(api, package = "survey")
des <- svydesign(id = ~1, weights = ~pw, data = apistrat, strata = ~stype)
pop <- data.frame(stype = c("E","H","M"), Freq = c(4421, 755, 1018))
post_des <- postStratify(des, ~stype, pop)
svymean(~api00, post_des)
```

</details>

## What to do next

- **Hypothesis-Testing-Exercises** (shipped) — broader inference.
- **R-for-Biostatistics-Exercises** (shipped) — applied stats.
