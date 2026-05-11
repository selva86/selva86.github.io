---
title: "Probability Distributions Exercises in R: 25 Practice Problems"
slug: "Probability-Distributions-Exercises-in-R"
description: "Master probability distributions in R with 25 practice problems: normal, binomial, Poisson, t, chi-square, F, sampling. Hidden solutions."
keywords: "probability distributions R, dnorm exercises, rbinom R practice, dpois R exercises, R probability distributions exercises"
mathjax: true
webr: true
date: "2026-05-11"
post_type: "EX"
sidebar_title: "Probability Distributions"
sidebar_order: 137
fr_parent: "Probability.html"
auto_link_terms: "probability distributions R|dnorm exercises|rbinom R practice|dpois R exercises"
auto_link_case_sensitive: false
target_keyword: "probability distributions R exercises"
sibling_block_enabled: false
difficulty: "Intermediate"
---

# Probability Distributions Exercises in R: 25 Practice Problems

<p class="lead">Twenty-five practice problems on probability distributions in R: normal, binomial, Poisson, t, chi-square, F, with d/p/q/r prefixes. Hidden solutions.</p>

```r title="Run this once before any exercise"
library(ggplot2)
```

### Exercise 1: Normal density at x=0

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
dnorm(0)
```

</details>

### Exercise 2: Normal CDF P(X<=1.96)

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
pnorm(1.96)
```

</details>

### Exercise 3: Normal quantile for 0.975

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
qnorm(0.975)
```

</details>

### Exercise 4: Sample from normal(10,2)

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
set.seed(1); rnorm(10, mean = 10, sd = 2)
```

</details>

### Exercise 5: P(80<X<120) where X ~ N(100,15)

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
pnorm(120, 100, 15) - pnorm(80, 100, 15)
```

</details>

### Exercise 6: Binomial P(X=5) for n=10, p=0.5

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
dbinom(5, size = 10, prob = 0.5)
```

</details>

### Exercise 7: Binomial P(X<=3) for n=10, p=0.3

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
pbinom(3, size = 10, prob = 0.3)
```

</details>

### Exercise 8: Simulate 1000 coin flips

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
set.seed(1); rbinom(1000, size = 1, prob = 0.5) |> mean()
```

</details>

### Exercise 9: Poisson P(X=4) lambda=3

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
dpois(4, lambda = 3)
```

</details>

### Exercise 10: Poisson CDF

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ppois(5, lambda = 3)
```

</details>

### Exercise 11: t distribution critical value (df=20, two-sided 5%)

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
qt(0.975, df = 20)
```

</details>

### Exercise 12: t-distribution density

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
dt(0, df = 20)
```

</details>

### Exercise 13: Chi-square critical (df=10, 95%)

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
qchisq(0.95, df = 10)
```

</details>

### Exercise 14: F critical (df1=3, df2=20)

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
qf(0.95, df1 = 3, df2 = 20)
```

</details>

### Exercise 15: Uniform random

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
set.seed(1); runif(5, 0, 1)
```

</details>

### Exercise 16: Exponential mean = 2

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
set.seed(1); rexp(10, rate = 1/2)
```

</details>

### Exercise 17: Plot normal density

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggplot(data.frame(x = seq(-4, 4, length = 200)), aes(x)) +
  stat_function(fun = dnorm)
```

</details>

### Exercise 18: Two normal densities overlaid

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ggplot(data.frame(x = seq(-4, 8, length = 200)), aes(x)) +
  stat_function(fun = dnorm, color = "blue") +
  stat_function(fun = function(x) dnorm(x, mean = 3), color = "red")
```

</details>

### Exercise 19: Sample mean distribution (CLT demo)

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
set.seed(1)
means <- replicate(5000, mean(rexp(50, rate = 1)))
hist(means, breaks = 40)
```

</details>

### Exercise 20: Simulate dice rolls

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
set.seed(1); sample(1:6, 100, replace = TRUE)
```

</details>

### Exercise 21: Sample without replacement

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
set.seed(1); sample(1:10, 5, replace = FALSE)
```

</details>

### Exercise 22: Probability X > 1.96 in N(0,1)

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
1 - pnorm(1.96)
```

</details>

### Exercise 23: Confidence-interval critical (df=29, 95%)

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
qt(0.975, df = 29)
```

</details>

### Exercise 24: Compare empirical to theoretical

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
set.seed(1); s <- rnorm(10000)
list(empirical = mean(s < 1.96), theoretical = pnorm(1.96))
```

</details>

### Exercise 25: Lognormal sample and inverse

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
set.seed(1); s <- rlnorm(1000)
log(s) |> hist()
```

</details>

## What to do next

- **Hypothesis-Testing-Exercises** (shipped) — apply these distributions.
- **Sampling-Methods-Exercises** (coming) — bootstrap and resampling.
