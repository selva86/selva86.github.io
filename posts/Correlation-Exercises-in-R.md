---
title: "Correlation Exercises in R: 20 Practice Problems"
slug: "Correlation-Exercises-in-R"
description: "Master correlation in R with 20 practice problems: Pearson, Spearman, Kendall, correlation matrix, cor.test, partial correlation."
keywords: "correlation R exercises, cor R practice, Pearson correlation R, Spearman correlation R, cor.test exercises"
mathjax: true
webr: true
date: "2026-05-11"
post_type: "EX"
sidebar_title: "Correlation Exercises"
sidebar_order: 136
fr_parent: "Correlation.html"
auto_link_terms: "correlation R exercises|cor R practice|Pearson correlation R|Spearman correlation R"
auto_link_case_sensitive: false
target_keyword: "correlation R exercises"
sibling_block_enabled: false
difficulty: "Intermediate"
---

# Correlation Exercises in R: 20 Practice Problems

<p class="lead">Twenty practice problems on correlation in R: Pearson, Spearman, Kendall, test, partial, visualize. Hidden solutions.</p>

```r title="Run this once before any exercise"
library(dplyr)
library(ggplot2)
```

### Exercise 1: Pearson correlation

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
cor(mtcars$wt, mtcars$mpg)
```

</details>

### Exercise 2: Correlation matrix

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
cor(mtcars)
```

</details>

### Exercise 3: Cor matrix selected columns

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
cor(mtcars[, c("mpg","wt","hp","disp")])
```

</details>

### Exercise 4: cor.test (Pearson)

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
cor.test(mtcars$wt, mtcars$mpg)
```

</details>

### Exercise 5: Spearman correlation

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
cor(mtcars$wt, mtcars$mpg, method = "spearman")
```

</details>

### Exercise 6: Kendall correlation

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
cor(mtcars$wt, mtcars$mpg, method = "kendall")
```

</details>

### Exercise 7: Handle NAs with use=

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
cor(airquality$Ozone, airquality$Temp, use = "complete.obs")
```

</details>

### Exercise 8: Pairwise NA handling

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
cor(airquality, use = "pairwise.complete.obs")
```

</details>

### Exercise 9: Extract p-value from cor.test

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
cor.test(mtcars$wt, mtcars$mpg)$p.value
```

</details>

### Exercise 10: 99% CI

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
cor.test(mtcars$wt, mtcars$mpg, conf.level = 0.99)$conf.int
```

</details>

### Exercise 11: Correlation heatmap

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
m <- cor(mtcars)
m_long <- as.data.frame(m) |>
  tibble::rownames_to_column("v1") |>
  tidyr::pivot_longer(-v1, names_to = "v2", values_to = "cor")
ggplot(m_long, aes(v1, v2, fill = cor)) + geom_tile() +
  scale_fill_gradient2(low = "blue", mid = "white", high = "red")
```

</details>

### Exercise 12: Cor with significance flags

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
# Use psych::corr.test or Hmisc::rcorr
psych::corr.test(mtcars[, 1:4])
```

</details>

### Exercise 13: Detect top correlated pairs

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
m <- cor(mtcars)
m[lower.tri(m, diag = TRUE)] <- NA
which(abs(m) > 0.8, arr.ind = TRUE)
```

</details>

### Exercise 14: Partial correlation

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
ppcor::pcor.test(mtcars$mpg, mtcars$wt, mtcars$hp)
```

</details>

### Exercise 15: Per-group correlation

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
iris |> group_by(Species) |>
  summarise(r = cor(Sepal.Length, Petal.Length))
```

</details>

### Exercise 16: Correlation with significance asterisks

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
m <- Hmisc::rcorr(as.matrix(mtcars))
m$r   # estimates
m$P   # p-values
```

</details>

### Exercise 17: Visualize with pairs()

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
pairs(mtcars[, c("mpg","wt","hp","disp")])
```

</details>

### Exercise 18: ggcorrplot

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggcorrplot::ggcorrplot(cor(mtcars))
```

</details>

### Exercise 19: Rank correlation when nonlinear

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
# Spearman captures monotonic non-linear better than Pearson
x <- 1:50; y <- x^2
list(pearson = cor(x, y), spearman = cor(x, y, method = "spearman"))
```

</details>

### Exercise 20: Bootstrap CI for correlation

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
set.seed(1)
r_boot <- replicate(1000, {
  i <- sample(seq_len(nrow(mtcars)), replace = TRUE)
  cor(mtcars$wt[i], mtcars$mpg[i])
})
quantile(r_boot, c(0.025, 0.975))
```

</details>

## What to do next

- **Hypothesis-Testing-Exercises** (shipped) — broader inference drills.
- **Linear-Regression-Exercises** (shipped) — modeling on correlated predictors.
