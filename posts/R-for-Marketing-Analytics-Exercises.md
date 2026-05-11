---
title: "R for Marketing Analytics Exercises: 20 Practice Problems"
slug: "R-for-Marketing-Analytics-Exercises"
description: "Master R for marketing analytics with 20 practice problems: RFM, churn, attribution, lift, conversion, AB tests. Hidden solutions."
keywords: "marketing analytics R, R for marketing exercises, RFM R practice, attribution R, R churn analysis"
mathjax: false
webr: true
date: "2026-05-11"
post_type: "EX"
sidebar_title: "R for Marketing Analytics"
sidebar_order: 145
fr_parent: "R-Tutorial.html"
auto_link_terms: "marketing analytics R|R for marketing exercises|RFM R practice|attribution R"
auto_link_case_sensitive: false
target_keyword: "R for marketing analytics exercises"
sibling_block_enabled: false
difficulty: "Intermediate"
---

# R for Marketing Analytics Exercises: 20 Practice Problems

<p class="lead">Twenty practice problems for marketing analytics in R: RFM, customer segmentation, churn, attribution, lift, conversion analysis. Hidden solutions.</p>

```r title="Run this once before any exercise"
library(dplyr)
library(tibble)
library(tidyr)
```

### Exercise 1: Compute RFM

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
txns <- tibble(user = c("a","a","b","b","c"),
               date = as.Date(c("2024-01-05","2024-03-10","2024-02-20","2024-04-15","2024-01-15")),
               amount = c(50, 80, 100, 90, 30))
ref <- as.Date("2024-05-01")
txns |>
  group_by(user) |>
  summarise(R = as.integer(ref - max(date)), F = n(), M = sum(amount), .groups = "drop")
```

</details>

### Exercise 2: RFM score (terciles)

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
df <- tibble(user = letters[1:6],
             R = c(10, 30, 5, 50, 20, 80),
             F = c(5, 3, 8, 1, 4, 2),
             M = c(200, 150, 300, 100, 180, 90))
df |>
  mutate(R_s = ntile(-R, 3), F_s = ntile(F, 3), M_s = ntile(M, 3),
         RFM = paste0(R_s, F_s, M_s))
```

</details>

### Exercise 3: Conversion rate

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
visitors <- 1000; conversions <- 35
conversions / visitors
```

</details>

### Exercise 4: Average order value

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
orders <- c(50, 80, 30, 120, 65)
mean(orders)
```

</details>

### Exercise 5: Customer lifetime value (simple)

**Difficulty:** Intermediate. AOV * orders/year * years.

<details><summary>Show solution</summary>

```r
aov <- 80; freq <- 4; lifespan <- 3
aov * freq * lifespan
```

</details>

### Exercise 6: Churn rate

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
churned <- 50; active_start <- 500
churned / active_start
```

</details>

### Exercise 7: Cohort retention table

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
events <- tibble(user = c(1,1,2,2,3,3),
                 month = c(1,2,1,3,1,2))
first <- events |> group_by(user) |> summarise(cohort = min(month), .groups = "drop")
events |> inner_join(first, by = "user") |>
  count(cohort, month) |>
  pivot_wider(names_from = month, values_from = n, values_fill = 0)
```

</details>

### Exercise 8: A/B test conversion (prop.test)

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
prop.test(c(120, 100), c(2000, 2000))
```

</details>

### Exercise 9: Lift calculation

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ctr_a <- 0.06; ctr_b <- 0.05
(ctr_a - ctr_b) / ctr_b
```

</details>

### Exercise 10: First-touch attribution

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
touches <- tibble(user = c(1,1,1,2,2,3),
                  channel = c("ad","email","direct","ad","direct","email"),
                  rank = c(1,2,3,1,2,1))
touches |> filter(rank == 1) |> count(channel, name = "first_touch")
```

</details>

### Exercise 11: Last-touch attribution

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
touches <- tibble(user = c(1,1,1,2,2,3),
                  channel = c("ad","email","direct","ad","direct","email"))
touches |> group_by(user) |> slice_tail(n = 1) |> ungroup() |> count(channel)
```

</details>

### Exercise 12: Customer segmentation with k-means

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
set.seed(1)
df <- tibble(spend = runif(100, 10, 500), freq = sample(1:20, 100, replace = TRUE))
km <- kmeans(scale(df), 3)
df$segment <- km$cluster
head(df)
```

</details>

### Exercise 13: Daily active users

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
events <- tibble(user = c(1,2,3,1,2),
                 date = as.Date(c("2024-01-01","2024-01-01","2024-01-01","2024-01-02","2024-01-03")))
events |> group_by(date) |> summarise(dau = n_distinct(user))
```

</details>

### Exercise 14: Weekly active users

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
events <- tibble(user = c(1,2,1,3,2),
                 date = as.Date(c("2024-01-01","2024-01-02","2024-01-08","2024-01-10","2024-01-15")))
events |>
  mutate(week = lubridate::floor_date(date, "week")) |>
  group_by(week) |>
  summarise(wau = n_distinct(user))
```

</details>

### Exercise 15: Funnel conversion

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
funnel <- tibble(stage = c("view","click","add_to_cart","purchase"),
                 users = c(10000, 3000, 1200, 450))
funnel |> mutate(conv = users / lag(users))
```

</details>

### Exercise 16: Compare two campaigns by t-test

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
camp_a <- c(120, 110, 130, 105, 95)
camp_b <- c(90, 85, 100, 92, 88)
t.test(camp_a, camp_b)
```

</details>

### Exercise 17: Forecast monthly sales

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
sales <- ts(c(100, 110, 115, 120, 125, 130, 140, 135, 145, 150), frequency = 12)
forecast::auto.arima(sales) |> forecast::forecast(h = 6)
```

</details>

### Exercise 18: Geo aggregation

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
sales <- tibble(region = c("US","EU","ASIA","US","EU"),
                revenue = c(100, 80, 60, 110, 90))
sales |> group_by(region) |> summarise(rev = sum(revenue)) |> arrange(desc(rev))
```

</details>

### Exercise 19: Email open rate

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
sent <- 10000; opened <- 2200
opened / sent
```

</details>

### Exercise 20: ROI per channel

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
channels <- tibble(channel = c("ad","email","social"),
                   spend = c(5000, 1000, 2000),
                   rev   = c(15000, 4000, 5000))
channels |> mutate(roi = (rev - spend) / spend)
```

</details>

## What to do next

- **A-B-Testing-Exercises** (coming) — experiment design drills.
- **EDA-Exercises** (shipped) — pre-modeling exploration.
