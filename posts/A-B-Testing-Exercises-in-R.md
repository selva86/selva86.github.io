---
title: "A/B Testing Exercises in R: 20 Practice Problems"
slug: "A-B-Testing-Exercises-in-R"
description: "Master A/B testing in R with 20 practice problems: prop tests, t-tests, power, sample size, lift, sequential. Hidden solutions."
keywords: "A/B testing R exercises, AB test R practice, R hypothesis test exercises, R experiment design, sample size R"
mathjax: true
webr: true
date: "2026-05-11"
post_type: "EX"
sidebar_title: "A/B Testing Exercises"
sidebar_order: 149
fr_parent: "R-Tutorial.html"
auto_link_terms: "A/B testing R exercises|AB test R practice|R experiment design|sample size R"
auto_link_case_sensitive: false
target_keyword: "A/B testing R exercises"
sibling_block_enabled: false
difficulty: "Intermediate"
---

# A/B Testing Exercises in R: 20 Practice Problems

<p class="lead">Twenty practice problems on A/B testing in R: proportion tests, t-tests, power, sample-size, lift, sequential testing, multiple comparisons. Hidden solutions.</p>

```r title="Run this once before any exercise"
library(dplyr)
```

### Exercise 1: Two-proportion z-test

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
prop.test(c(120, 100), c(2000, 2000))
```

</details>

### Exercise 2: Two-sample t-test on revenue

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
set.seed(1)
ctrl <- rnorm(100, 25, 10); var <- rnorm(100, 27, 10)
t.test(ctrl, var)
```

</details>

### Exercise 3: Compute observed lift

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
ctrl_cr <- 0.05; var_cr <- 0.06
(var_cr - ctrl_cr) / ctrl_cr
```

</details>

### Exercise 4: Required sample size for proportion test

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
pwr::pwr.2p.test(h = pwr::ES.h(0.10, 0.12), power = 0.8, sig.level = 0.05)$n
```

</details>

### Exercise 5: Required sample size for t-test

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
pwr::pwr.t.test(d = 0.2, power = 0.8, sig.level = 0.05)$n
```

</details>

### Exercise 6: Power at given n

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
pwr::pwr.2p.test(h = pwr::ES.h(0.10, 0.12), n = 2000, sig.level = 0.05)$power
```

</details>

### Exercise 7: 95% CI for difference in proportions

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
prop.test(c(120, 100), c(2000, 2000))$conf.int
```

</details>

### Exercise 8: Bonferroni for 3 variants

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
p <- c(0.01, 0.04, 0.20)
p.adjust(p, method = "bonferroni")
```

</details>

### Exercise 9: Chi-square test on 2x3 table

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
tab <- matrix(c(100, 110, 90,
                900, 890, 910), nrow = 2, byrow = TRUE)
chisq.test(tab)
```

</details>

### Exercise 10: Pre/post (paired) check

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
pre <- c(120, 130, 125, 140)
post <- c(125, 132, 128, 145)
t.test(pre, post, paired = TRUE)
```

</details>

### Exercise 11: Simulate to estimate type-I error

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
set.seed(1)
ps <- replicate(2000, {
  a <- rnorm(100); b <- rnorm(100)
  t.test(a, b)$p.value
})
mean(ps < 0.05)
```

</details>

### Exercise 12: Sequential testing (concept)

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
# group_sequential needs gsDesign package; demo conceptual:
# library(gsDesign); gsDesign(k = 4, test.type = 2, alpha = 0.025)
```

</details>

### Exercise 13: Bootstrap CI for lift

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
set.seed(1)
ctrl <- rbinom(2000, 1, 0.05); var <- rbinom(2000, 1, 0.06)
b <- replicate(1000,
  mean(sample(var, replace = TRUE)) / mean(sample(ctrl, replace = TRUE)) - 1)
quantile(b, c(0.025, 0.975))
```

</details>

### Exercise 14: Treatment effect with regression

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
df <- tibble(group = c(rep("ctrl", 100), rep("var", 100)),
             y = c(rnorm(100, 10), rnorm(100, 11)))
lm(y ~ group, data = df) |> broom::tidy()
```

</details>

### Exercise 15: Stratified test by segment

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
df <- tibble(seg = sample(c("new","ret"), 400, replace = TRUE),
             group = sample(c("a","b"), 400, replace = TRUE),
             converted = rbinom(400, 1, 0.1))
df |> group_by(seg) |>
  summarise(tidy = list(broom::tidy(prop.test(table(group, converted))))) |>
  tidyr::unnest(tidy)
```

</details>

### Exercise 16: Detect peeking bias (concept)

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
# Repeated tests inflate type-I rate; correct via alpha spending (Pocock or O'Brien-Fleming bounds).
```

</details>

### Exercise 17: Convert prop test to z-stat

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
p1 <- 0.10; p2 <- 0.12; n1 <- 2000; n2 <- 2000
p_pool <- (p1*n1 + p2*n2) / (n1 + n2)
z <- (p2 - p1) / sqrt(p_pool*(1-p_pool)*(1/n1 + 1/n2))
list(z = z, p = 2*(1 - pnorm(abs(z))))
```

</details>

### Exercise 18: Variance reduction via CUPED (concept)

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
# CUPED: y_adj = y - theta * (x - mean(x)), theta = cov(x, y) / var(x)
# Reduces variance of treatment effect estimate by leveraging a pre-experiment covariate
```

</details>

### Exercise 19: Permutation test for two means

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
set.seed(1)
ctrl <- rnorm(50, 10); var <- rnorm(50, 11)
obs <- mean(var) - mean(ctrl)
perms <- replicate(2000, {
  pool <- sample(c(ctrl, var))
  mean(pool[51:100]) - mean(pool[1:50])
})
mean(abs(perms) >= abs(obs))
```

</details>

### Exercise 20: Plot conversion by group

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
df <- tibble(group = c("ctrl","var"), n = c(2000, 2000), conv = c(100, 120))
df |> mutate(rate = conv / n) |>
  ggplot2::ggplot(ggplot2::aes(group, rate)) + ggplot2::geom_col()
```

</details>

## What to do next

- **Hypothesis-Testing-Exercises** (shipped) — broader inference.
- **R-for-Marketing-Analytics-Exercises** (shipped) — applied marketing.
