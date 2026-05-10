---
title: "tidyr Pivot Exercises in R: 25 Practice Problems"
slug: "tidyr-Pivot-Exercises-in-R"
description: "Master tidyr pivots with 25 practice problems: pivot_longer, pivot_wider, names_pattern, multi-value, type conversion. Hidden solutions."
keywords: "pivot_longer pivot_wider exercises, tidyr pivot practice, R reshape exercises"
mathjax: false
webr: true
date: "2026-05-11"
post_type: "EX"
sidebar_title: "tidyr Pivot Exercises"
sidebar_order: 129
fr_parent: "Data-Wrangling-With-tidyr.html"
auto_link_terms: "pivot_longer exercises|pivot_wider exercises|tidyr pivot practice|R reshape exercises"
auto_link_case_sensitive: false
target_keyword: "tidyr pivot exercises"
sibling_block_enabled: false
difficulty: "Intermediate"
---

# tidyr Pivot Exercises in R: 25 Practice Problems

<p class="lead">Twenty-five practice problems on tidyr pivots: pivot_longer, pivot_wider, names_pattern, multi-value, type conversion. Hidden solutions.</p>

```r title="Run this once before any exercise"
library(tidyr)
library(dplyr)
library(tibble)
```

### Exercise 1: pivot_longer simple

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
tibble(region = c("US","EU"), Q1 = c(100,80), Q2 = c(120,90)) |>
  pivot_longer(Q1:Q2, names_to = "quarter", values_to = "sales")
```

</details>

### Exercise 2: pivot_wider simple

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
tibble(r = c("US","US","EU","EU"), q = c("Q1","Q2","Q1","Q2"), s = c(100,120,80,90)) |>
  pivot_wider(names_from = q, values_from = s)
```

</details>

### Exercise 3: pivot_longer with -id

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
tibble(id = 1:3, a = c(1,2,3), b = c(4,5,6)) |>
  pivot_longer(-id)
```

</details>

### Exercise 4: starts_with

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
tibble(id = 1:2, q1 = c(10,20), q2 = c(15,25), other = c(99,99)) |>
  pivot_longer(starts_with("q"))
```

</details>

### Exercise 5: names_prefix

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
tibble(id = 1:2, year_2023 = c(10,20), year_2024 = c(15,25)) |>
  pivot_longer(-id, names_to = "year", names_prefix = "year_")
```

</details>

### Exercise 6: names_pattern with groups

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
tibble(id = 1, revenue_2023 = 100, revenue_2024 = 110) |>
  pivot_longer(-id, names_to = c("metric","year"),
               names_pattern = "(\\w+)_(\\d+)", values_to = "value")
```

</details>

### Exercise 7: names_sep

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
tibble(id = 1, q1_2023 = 100, q2_2023 = 120) |>
  pivot_longer(-id, names_to = c("quarter","year"), names_sep = "_")
```

</details>

### Exercise 8: names_transform

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
tibble(id = 1, year_2023 = 100, year_2024 = 110) |>
  pivot_longer(-id, names_to = "year", names_prefix = "year_",
               names_transform = list(year = as.integer))
```

</details>

### Exercise 9: values_drop_na

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
tibble(id = 1:2, a = c(1,NA), b = c(2,3)) |>
  pivot_longer(-id, values_drop_na = TRUE)
```

</details>

### Exercise 10: pivot_wider with values_fn

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
tibble(id = c(1,1,2), key = c("x","x","y"), value = c(10,20,30)) |>
  pivot_wider(names_from = key, values_from = value, values_fn = sum)
```

</details>

### Exercise 11: pivot_wider with values_fill

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
tibble(id = c(1,2), key = c("a","b"), value = c(10, 20)) |>
  pivot_wider(names_from = key, values_from = value, values_fill = 0)
```

</details>

### Exercise 12: Multiple values_from

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
tibble(id = c(1,1,2,2), metric = c("a","b","a","b"),
       mean = c(10,20,30,40), sd = c(1,2,3,4)) |>
  pivot_wider(names_from = metric, values_from = c(mean, sd))
```

</details>

### Exercise 13: Multiple names_from

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
tibble(id = 1:2, a_1 = c(1,2), a_2 = c(3,4), b_1 = c(5,6), b_2 = c(7,8)) |>
  pivot_longer(-id, names_to = c("letter","num"), names_sep = "_") |>
  pivot_wider(names_from = c(letter, num), values_from = value)
```

</details>

### Exercise 14: Roundtrip wide-long-wide

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
wide <- tibble(region = c("US","EU"), Q1 = c(100,80), Q2 = c(120,90))
out <- wide |>
  pivot_longer(Q1:Q2, names_to = "quarter", values_to = "sales") |>
  pivot_wider(names_from = quarter, values_from = sales)
identical(wide, out)
```

</details>

### Exercise 15: pivot_wider with multi-key id

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
tibble(year = c(2023,2023,2024,2024), region = c("US","EU","US","EU"),
       sales = c(100, 80, 110, 85)) |>
  pivot_wider(names_from = region, values_from = sales)
```

</details>

### Exercise 16: Wide where some cells are missing

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
tibble(region = c("US","EU","US"), q = c("Q1","Q1","Q2"), s = c(100, 80, 120)) |>
  pivot_wider(names_from = q, values_from = s)
```

</details>

### Exercise 17: Long with names_to in vector form

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
tibble(id = 1, q1_a = 10, q1_b = 20, q2_a = 15, q2_b = 25) |>
  pivot_longer(-id, names_to = c("quarter","metric"), names_sep = "_",
               values_to = "value")
```

</details>

### Exercise 18: Pivot then aggregate

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
tibble(region = c("US","EU"), Q1 = c(100,80), Q2 = c(120,90)) |>
  pivot_longer(Q1:Q2, names_to = "quarter", values_to = "sales") |>
  group_by(region) |> summarise(annual = sum(sales))
```

</details>

### Exercise 19: pivot_longer with cols_vary

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
tibble(id = 1:2, a1 = 1:2, a2 = 3:4, b1 = 5:6, b2 = 7:8) |>
  pivot_longer(-id, names_to = c(".value","num"),
               names_pattern = "([a-z])(\\d)")
```

</details>

### Exercise 20: pivot_longer with .value

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
tibble(id = 1, mean_a = 10, sd_a = 1, mean_b = 20, sd_b = 2) |>
  pivot_longer(-id, names_to = c(".value","var"), names_sep = "_")
```

</details>

### Exercise 21: Pivot factor levels

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
tibble(id = 1:2,
       low = c(10,20), high = c(30,40)) |>
  pivot_longer(-id, names_to = "level", values_to = "v",
               names_transform = list(level = ~ factor(.x, levels = c("low","high"))))
```

</details>

### Exercise 22: Wide form summary report

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
mtcars |>
  group_by(cyl, gear) |>
  summarise(mean_mpg = mean(mpg), .groups = "drop") |>
  pivot_wider(names_from = gear, values_from = mean_mpg, names_prefix = "gear_")
```

</details>

### Exercise 23: Skip rows that already are wide

**Difficulty:** Advanced. Pivot only when needed.

<details><summary>Show solution</summary>

```r
df <- tibble(id = 1:2, type = c("long","long"), v = c(10, 20))
if ("type" %in% names(df) && all(df$type == "long")) {
  df |> pivot_wider(names_from = type, values_from = v)
} else df
```

</details>

### Exercise 24: Long to wide with id_cols

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
tibble(id = c(1,1,2,2), batch = c("A","B","A","B"),
       group = c("x","y","x","y"), v = 1:4) |>
  pivot_wider(id_cols = id, names_from = group, values_from = v, values_fn = list)
```

</details>

### Exercise 25: Pivot to enable a join

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
sales_wide <- tibble(region = c("US","EU"), Q1 = c(100,80), Q2 = c(120,90))
info <- tibble(region = c("US","EU"), continent = c("NA","EU"))
sales_wide |>
  pivot_longer(Q1:Q2, names_to = "quarter", values_to = "sales") |>
  left_join(info, by = "region")
```

</details>

## What to do next

- **tidyr-Exercises** (shipped) — broader tidyr practice.
- **tidyr-Nest-Unnest-Exercises** (coming) — list-column drills.
