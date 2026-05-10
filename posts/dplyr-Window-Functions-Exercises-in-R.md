---
title: "dplyr Window Functions Exercises in R: 30 Practice Problems"
slug: "dplyr-Window-Functions-Exercises-in-R"
description: "Master dplyr window functions with 30 practice problems: lead, lag, cumsum, rank, ntile, group windows. Hidden solutions, runnable code."
keywords: "dplyr window functions exercises, lead lag R exercises, cumsum R practice, rank in R exercises, dplyr window practice"
mathjax: false
webr: true
date: "2026-05-11"
post_type: "EX"
sidebar_title: "dplyr Window Functions Exercises"
sidebar_order: 122
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "dplyr window functions exercises|lead lag R exercises|cumsum R practice|rank in R exercises"
auto_link_case_sensitive: false
target_keyword: "dplyr window functions exercises"
sibling_block_enabled: false
difficulty: "Intermediate"
---

# dplyr Window Functions Exercises in R: 30 Practice Problems

<p class="lead">Thirty practice problems on dplyr window functions: lead, lag, cumulative ops, ranks, ntile, first/last/nth, cumall/cumany, with-groups patterns. Hidden solutions.</p>

```r title="Run this once before any exercise"
library(dplyr)
library(tibble)
```

## Section 1. lead and lag (8 problems)

### Exercise 1.1: lag

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
tibble(x = 1:5) |> mutate(prev = lag(x))
```

</details>

### Exercise 1.2: lead

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
tibble(x = 1:5) |> mutate(nxt = lead(x))
```

</details>

### Exercise 1.3: lag with default

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
tibble(x = 1:5) |> mutate(prev = lag(x, default = 0))
```

</details>

### Exercise 1.4: lag(n=2)

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
tibble(x = 1:5) |> mutate(prev2 = lag(x, n = 2))
```

</details>

### Exercise 1.5: Day-over-day pct change

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
tibble(price = c(100, 102, 99, 105)) |>
  mutate(pct = (price - lag(price)) / lag(price) * 100)
```

</details>

### Exercise 1.6: lag per group

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
tibble(g = c("a","a","b","b"), v = c(1,2,3,4)) |>
  group_by(g) |> mutate(prev = lag(v)) |> ungroup()
```

</details>

### Exercise 1.7: Detect change-points

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
tibble(s = c("A","A","B","B","A")) |>
  mutate(change = s != lag(s, default = first(s)))
```

</details>

### Exercise 1.8: Days between events

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
tibble(d = as.Date(c("2024-01-01","2024-01-05","2024-01-15"))) |>
  mutate(gap = as.integer(d - lag(d)))
```

</details>

## Section 2. Cumulative (6 problems)

### Exercise 2.1: cumsum

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
tibble(x = 1:5) |> mutate(cs = cumsum(x))
```

</details>

### Exercise 2.2: cumprod

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
tibble(x = 1:5) |> mutate(cp = cumprod(x))
```

</details>

### Exercise 2.3: cummax / cummin

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
tibble(x = c(3,1,5,4,8,2)) |> mutate(cmax = cummax(x), cmin = cummin(x))
```

</details>

### Exercise 2.4: cummean

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
tibble(x = c(2,4,6,8)) |> mutate(cm = cummean(x))
```

</details>

### Exercise 2.5: cumall

**Difficulty:** Advanced. Keep until first failure.

<details><summary>Show solution</summary>

```r
tibble(x = c(1,2,3,4,5,6)) |> filter(cumall(x < 5))
```

</details>

### Exercise 2.6: cumany

**Difficulty:** Advanced. Keep AFTER first match.

<details><summary>Show solution</summary>

```r
tibble(x = c(1,2,3,4,5)) |> filter(cumany(x >= 3))
```

</details>

## Section 3. Ranks (6 problems)

### Exercise 3.1: row_number

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
tibble(x = c(50, 30, 70)) |> mutate(r = row_number(desc(x)))
```

</details>

### Exercise 3.2: min_rank

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
tibble(x = c(50, 50, 70, 30)) |> mutate(r = min_rank(desc(x)))
```

</details>

### Exercise 3.3: dense_rank

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
tibble(x = c(50, 50, 70, 30)) |> mutate(r = dense_rank(desc(x)))
```

</details>

### Exercise 3.4: percent_rank

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
tibble(x = 1:10) |> mutate(pr = percent_rank(x))
```

</details>

### Exercise 3.5: cume_dist

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
tibble(x = 1:5) |> mutate(cd = cume_dist(x))
```

</details>

### Exercise 3.6: ntile

**Difficulty:** Intermediate. Quartiles of mpg.

<details><summary>Show solution</summary>

```r
mtcars |> mutate(quartile = ntile(mpg, 4)) |> count(quartile)
```

</details>

## Section 4. first / last / nth (5 problems)

### Exercise 4.1: first per group

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
tibble(g = c("a","a","b","b"), v = c(1,2,3,4)) |>
  group_by(g) |> mutate(first_v = first(v)) |> ungroup()
```

</details>

### Exercise 4.2: last per group

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
tibble(g = c("a","a","b","b"), v = c(1,2,3,4)) |>
  group_by(g) |> mutate(last_v = last(v)) |> ungroup()
```

</details>

### Exercise 4.3: nth value

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
nth(c(10,20,30,40), n = 2)
```

</details>

### Exercise 4.4: First non-NA

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
tibble(g = c("a","a","a"), v = c(NA, 5, 10)) |>
  group_by(g) |> summarise(first_nonna = first(na.omit(v)))
```

</details>

### Exercise 4.5: Days from first event

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
tibble(g = c("a","a","b","b"),
       d = as.Date(c("2024-01-01","2024-02-15","2024-03-01","2024-03-10"))) |>
  group_by(g) |>
  mutate(days = as.integer(d - first(d))) |> ungroup()
```

</details>

## Section 5. Group window patterns (5 problems)

### Exercise 5.1: Top-N per group via row_number

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
mtcars |> tibble::rownames_to_column("car") |>
  group_by(cyl) |> mutate(rk = row_number(desc(mpg))) |>
  filter(rk <= 2) |> ungroup()
```

</details>

### Exercise 5.2: Cumulative spend per user

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
tibble(u = c("a","a","b","b"), amt = c(50,80,30,70)) |>
  group_by(u) |> mutate(cs = cumsum(amt)) |> ungroup()
```

</details>

### Exercise 5.3: Running mean per group

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
tibble(u = c("a","a","a","b","b"), v = c(2,4,6,3,5)) |>
  group_by(u) |> mutate(rm = cummean(v)) |> ungroup()
```

</details>

### Exercise 5.4: Identify peaks

**Difficulty:** Advanced. Local max where x > lag(x) AND x > lead(x).

<details><summary>Show solution</summary>

```r
tibble(x = c(1, 5, 3, 8, 4, 9, 2)) |>
  mutate(peak = x > lag(x, default = -Inf) & x > lead(x, default = -Inf))
```

</details>

### Exercise 5.5: 3-period rolling mean via lags

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
tibble(x = c(10, 20, 30, 40, 50)) |>
  mutate(ma3 = (x + lag(x) + lag(x, 2)) / 3)
```

</details>

## What to do next

- **dplyr-Exercises** (shipped) — broader practice.
- **dplyr-Joins-Exercises** (shipped) — joins-only drills.
