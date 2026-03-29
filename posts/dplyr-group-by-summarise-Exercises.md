---
title: "dplyr group_by() & summarise() Exercises: 10 Aggregation Problems"
slug: "dplyr-group-by-summarise-Exercises"
description: "10 dplyr group_by and summarise exercises: grouped means, counts, percentages, window functions, and multi-level aggregation. Interactive solutions."
keywords: "dplyr group_by exercises, summarise exercises, aggregation practice R, grouped summary exercises"
mathjax: false
webr: true
date: "2026-03-30"
curriculum_id: "E2.3"
post_type: "EX"
sidebar_text: "group_by & summarise (10 problems)"
auto_link_terms: "group_by exercises|summarise exercises|aggregation exercises"
auto_link_case_sensitive: false
fr_parent: "dplyr-group-by-summarise.html"
---

# dplyr group_by() & summarise() Exercises: 10 Aggregation Problems

<p class="lead">10 exercises on grouped aggregation: means, counts, proportions, window functions, and multi-level summaries using <code>group_by()</code> and <code>summarise()</code>.</p>

### Exercise 1: Basic Grouped Mean

Calculate average mpg per cylinder group.

```r
library(dplyr)

```

<details><summary>Click to reveal solution</summary>

```r
library(dplyr)
mtcars |> group_by(cyl) |> summarise(avg_mpg = round(mean(mpg), 1), .groups = "drop")
```

</details>

### Exercise 2: Multiple Summaries

Per Species in iris: count, mean Sepal.Length, max Petal.Length.

```r
library(dplyr)

```

<details><summary>Click to reveal solution</summary>

```r
library(dplyr)
iris |> group_by(Species) |> summarise(n = n(), avg_sl = round(mean(Sepal.Length),2), max_pl = max(Petal.Length), .groups = "drop")
```

</details>

### Exercise 3: Grouped Count with Proportion

Count cars per (cyl, am) combination and add a percentage column.

```r
library(dplyr)

```

<details><summary>Click to reveal solution</summary>

```r
library(dplyr)
mtcars |> count(cyl, am) |> mutate(pct = round(n / sum(n) * 100, 1))
```

</details>

### Exercise 4: across() in Summarise

Calculate mean of mpg, hp, and wt per cyl group using across().

```r
library(dplyr)

```

<details><summary>Click to reveal solution</summary>

```r
library(dplyr)
mtcars |> group_by(cyl) |> summarise(across(c(mpg, hp, wt), ~ round(mean(.x), 1)), .groups = "drop")
```

</details>

### Exercise 5: Grouped Mutate (Percent of Group)

Add a column showing each car's mpg as percentage of its cyl group's mean.

```r
library(dplyr)

```

<details><summary>Click to reveal solution</summary>

```r
library(dplyr)
mtcars |> group_by(cyl) |> mutate(pct_of_avg = round(mpg / mean(mpg) * 100, 1)) |> select(mpg, cyl, pct_of_avg) |> ungroup() |> head(8)
```

</details>

### Exercise 6: Grouped Ranking

Rank iris flowers by Sepal.Length within each Species (highest = 1).

```r
library(dplyr)

```

<details><summary>Click to reveal solution</summary>

```r
library(dplyr)
iris |> group_by(Species) |> mutate(rank = rank(-Sepal.Length)) |> filter(rank <= 3) |> select(Species, Sepal.Length, rank) |> arrange(Species, rank) |> ungroup()
```

</details>

### Exercise 7: Multi-Level Grouping

Group mtcars by cyl and gear, get mean mpg, then find the best gear per cyl.

```r
library(dplyr)

```

<details><summary>Click to reveal solution</summary>

```r
library(dplyr)
mtcars |> group_by(cyl, gear) |> summarise(avg_mpg = round(mean(mpg),1), n = n(), .groups = "drop") |> group_by(cyl) |> slice_max(avg_mpg, n = 1) |> ungroup()
```

</details>

### Exercise 8: Summarise with NA Handling

```r
library(dplyr)
df <- data.frame(group = c("A","A","B","B","B"), value = c(10, NA, 20, 30, NA))
# Get mean, n_total, n_valid per group

```

<details><summary>Click to reveal solution</summary>

```r
library(dplyr)
df <- data.frame(group = c("A","A","B","B","B"), value = c(10, NA, 20, 30, NA))
df |> group_by(group) |> summarise(mean_val = mean(value, na.rm=TRUE), n_total = n(), n_valid = sum(!is.na(value)), .groups = "drop")
```

</details>

### Exercise 9: Cumulative Sum Within Groups

Add a running total of hp within each cyl group (sorted by mpg).

```r
library(dplyr)

```

<details><summary>Click to reveal solution</summary>

```r
library(dplyr)
mtcars |> arrange(cyl, mpg) |> group_by(cyl) |> mutate(cumul_hp = cumsum(hp)) |> select(cyl, mpg, hp, cumul_hp) |> ungroup() |> head(10)
```

</details>

### Exercise 10: Summarise Multiple Functions with across

Per cyl: mean and sd of mpg and hp.

```r
library(dplyr)

```

<details><summary>Click to reveal solution</summary>

```r
library(dplyr)
mtcars |> group_by(cyl) |> summarise(across(c(mpg, hp), list(mean = ~ round(mean(.x),1), sd = ~ round(sd(.x),1)), .names = "{.col}_{.fn}"), .groups = "drop")
```

</details>

## What's Next?

- [dplyr group_by & summarise](/dplyr-group-by-summarise.html) — review concepts
- [dplyr Exercises](/dplyr-Exercises.html) — broader practice
