---
title: "dplyr group_by Exercises in R: 25 Practice Problems"
slug: "dplyr-Group-By-Exercises-in-R"
description: "Master dplyr group_by with 25 practice problems: per-group summarise, mutate, filter, slice, by= argument. Hidden solutions."
keywords: "dplyr group_by exercises, group_by R practice, R group operations exercises, dplyr summarise practice"
mathjax: false
webr: true
date: "2026-05-11"
post_type: "EX"
sidebar_title: "dplyr group_by Exercises"
sidebar_order: 131
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "dplyr group_by exercises|group_by R practice|R group operations exercises"
auto_link_case_sensitive: false
target_keyword: "dplyr group_by exercises"
sibling_block_enabled: false
difficulty: "Intermediate"
---

# dplyr group_by Exercises in R: 25 Practice Problems

<p class="lead">Twenty-five practice problems on dplyr group_by: summarise, mutate, filter, slice, ungroup discipline, .by argument. Hidden solutions.</p>

```r title="Run this once before any exercise"
library(dplyr)
library(tibble)
```

### Exercise 1: Mean per group

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
mtcars |> group_by(cyl) |> summarise(mean_mpg = mean(mpg))
```

</details>

### Exercise 2: Multiple stats

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
mtcars |> group_by(cyl) |>
  summarise(n = n(), mean = mean(mpg), sd = sd(mpg))
```

</details>

### Exercise 3: Two-level grouping

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
mtcars |> group_by(cyl, gear) |>
  summarise(mean_mpg = mean(mpg), .groups = "drop")
```

</details>

### Exercise 4: .groups argument

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
mtcars |> group_by(cyl, gear) |>
  summarise(n = n(), .groups = "drop_last")
```

</details>

### Exercise 5: ungroup explicitly

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
mtcars |> group_by(cyl) |> mutate(z = scale(mpg)[,1]) |> ungroup()
```

</details>

### Exercise 6: filter inside group_by

**Difficulty:** Intermediate. Per-group threshold.

<details><summary>Show solution</summary>

```r
mtcars |> group_by(cyl) |> filter(mpg > median(mpg)) |> ungroup()
```

</details>

### Exercise 7: HAVING-style filter

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
mtcars |> group_by(cyl) |> filter(n() >= 10) |>
  summarise(mean_mpg = mean(mpg))
```

</details>

### Exercise 8: mutate per group

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
mtcars |> group_by(cyl) |> mutate(rank_mpg = min_rank(desc(mpg))) |> ungroup()
```

</details>

### Exercise 9: slice per group

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
mtcars |> group_by(cyl) |> slice(1:2) |> ungroup()
```

</details>

### Exercise 10: slice_max with by

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
mtcars |> tibble::rownames_to_column("car") |>
  slice_max(mpg, n = 2, by = cyl)
```

</details>

### Exercise 11: .by argument

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
mtcars |> summarise(mean_mpg = mean(mpg), .by = cyl)
```

</details>

### Exercise 12: Group-relative proportion

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
ggplot2::diamonds |>
  count(cut, clarity) |>
  group_by(cut) |> mutate(share = n / sum(n)) |> ungroup()
```

</details>

### Exercise 13: cur_group_id

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
mtcars |> group_by(cyl) |>
  mutate(grp_id = cur_group_id()) |>
  ungroup() |>
  count(cyl, grp_id)
```

</details>

### Exercise 14: cur_group()

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
mtcars |> group_by(cyl) |>
  summarise(label = paste0("cyl=", cur_group()$cyl), n = n())
```

</details>

### Exercise 15: Group filter + summarise

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
mtcars |> group_by(cyl) |>
  filter(mpg > 20) |>
  summarise(n = n(), mean_mpg = mean(mpg), .groups = "drop")
```

</details>

### Exercise 16: First/last per group

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
df <- tibble(g = c("a","a","b","b"), v = c(1,2,3,4))
df |> group_by(g) |> summarise(first_v = first(v), last_v = last(v))
```

</details>

### Exercise 17: arrange within group_by

**Difficulty:** Intermediate. arrange respects groups when .by_group=TRUE.

<details><summary>Show solution</summary>

```r
mtcars |> group_by(cyl) |> arrange(desc(mpg), .by_group = TRUE)
```

</details>

### Exercise 18: Avoid grouped output

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
mtcars |> group_by(cyl) |>
  summarise(mean_mpg = mean(mpg), .groups = "drop")
```

</details>

### Exercise 19: rolling sum within group

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
tibble(g = c("a","a","a","b","b"), v = c(2, 4, 6, 3, 5)) |>
  group_by(g) |> mutate(cs = cumsum(v)) |> ungroup()
```

</details>

### Exercise 20: across in summarise per group

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
iris |> group_by(Species) |>
  summarise(across(where(is.numeric), mean))
```

</details>

### Exercise 21: across with multiple functions

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
iris |> group_by(Species) |>
  summarise(across(where(is.numeric),
                   list(mean = mean, sd = sd),
                   .names = "{.col}_{.fn}"))
```

</details>

### Exercise 22: reframe (multiple rows)

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
mtcars |> group_by(cyl) |>
  reframe(q = c("p25","p50","p75"),
          mpg = quantile(mpg, c(0.25, 0.5, 0.75)))
```

</details>

### Exercise 23: with_groups()

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
mtcars |> with_groups(cyl, mutate, mean_cyl = mean(mpg))
```

</details>

### Exercise 24: group_modify

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
iris |> group_by(Species) |>
  group_modify(~ tibble(mean_sl = mean(.x$Sepal.Length)))
```

</details>

### Exercise 25: group_split

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
iris |> group_by(Species) |> group_split() |> length()
```

</details>

## What to do next

- **dplyr-Exercises** (shipped) — broader practice.
- **dplyr-Joins-Exercises**, **dplyr-Window-Functions-Exercises** (shipped) — focused drills.
