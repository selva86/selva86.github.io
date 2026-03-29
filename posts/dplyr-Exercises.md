---
title: "dplyr Exercises: 15 Data Manipulation Practice Problems (With Solutions)"
slug: "dplyr-Exercises"
description: "15 dplyr exercises covering filter, select, mutate, group_by, summarise, arrange, and joins. Interactive solutions with mtcars, iris, and storms."
keywords: "dplyr exercises, dplyr practice, data manipulation exercises R, tidyverse exercises"
mathjax: false
webr: true
date: "2026-03-30"
curriculum_id: "E2.1"
post_type: "EX"
sidebar_text: "dplyr (15 problems)"
auto_link_terms: "dplyr exercises|dplyr practice problems"
auto_link_case_sensitive: false
fr_parent: "dplyr-filter-select.html"
---

# dplyr Exercises: 15 Data Manipulation Practice Problems

<p class="lead">Practice all core dplyr verbs with 15 exercises: filter, select, mutate, group_by, summarise, arrange, joins, and across. Each problem has an interactive solution.</p>

## Easy (1-5)

### Exercise 1: Filter and Select

Find all 4-cylinder cars with mpg above 25. Show only mpg, cyl, hp, and wt.

```r
library(dplyr)
# Your code here

```

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)
mtcars |> filter(cyl == 4, mpg > 25) |> select(mpg, cyl, hp, wt)
```

</details>

### Exercise 2: Mutate and Arrange

Add a power-to-weight ratio column (hp/wt) and sort by it descending.

```r
library(dplyr)
# Your code here

```

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)
mtcars |>
  mutate(pwr = round(hp / wt, 1)) |>
  arrange(desc(pwr)) |>
  select(mpg, hp, wt, pwr) |>
  head(8)
```

</details>

### Exercise 3: Group and Summarise

Calculate mean mpg, mean hp, and count per cylinder group.

```r
library(dplyr)
# Your code here

```

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)
mtcars |>
  group_by(cyl) |>
  summarise(n = n(), avg_mpg = round(mean(mpg),1), avg_hp = round(mean(hp),0), .groups = "drop")
```

</details>

### Exercise 4: Count and Proportion

Count iris flowers per Species and add a percentage column.

```r
library(dplyr)
# Your code here

```

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)
iris |>
  count(Species) |>
  mutate(pct = round(n / sum(n) * 100, 1))
```

</details>

### Exercise 5: Rename and Reorder

Rename iris columns to snake_case and move Species to the first column.

```r
library(dplyr)
# Your code here

```

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)
iris |>
  rename_with(~ tolower(gsub("\\.", "_", .x))) |>
  select(species, everything()) |>
  head(5)
```

</details>

## Medium (6-10)

### Exercise 6: Complex Filter

Find cars with above-average mpg AND below-average weight.

```r
library(dplyr)
# Your code here

```

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)
mtcars |>
  filter(mpg > mean(mpg), wt < mean(wt)) |>
  select(mpg, hp, wt, cyl) |>
  arrange(desc(mpg))
```

</details>

### Exercise 7: Grouped Ranking

Rank cars by mpg within each cylinder group (best = rank 1).

```r
library(dplyr)
# Your code here

```

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)
mtcars |>
  mutate(car = rownames(mtcars)) |>
  group_by(cyl) |>
  mutate(mpg_rank = rank(-mpg)) |>
  filter(mpg_rank <= 3) |>
  select(car, cyl, mpg, mpg_rank) |>
  arrange(cyl, mpg_rank) |>
  ungroup()
```

</details>

### Exercise 8: across() Summarise

For each Species in iris, calculate the mean and sd of all numeric columns.

```r
library(dplyr)
# Your code here

```

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)
iris |>
  group_by(Species) |>
  summarise(across(where(is.numeric),
    list(mean = ~ round(mean(.x), 2), sd = ~ round(sd(.x), 2)),
    .names = "{.col}_{.fn}"), .groups = "drop")
```

</details>

### Exercise 9: case_when Categories

Categorize mtcars into "Economy" (mpg>25), "Standard" (15-25), "Gas Guzzler" (<15).

```r
library(dplyr)
# Your code here

```

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)
mtcars |>
  mutate(type = case_when(
    mpg > 25 ~ "Economy",
    mpg >= 15 ~ "Standard",
    TRUE ~ "Gas Guzzler"
  )) |>
  count(type) |>
  arrange(desc(n))
```

</details>

### Exercise 10: Join Two Tables

Join these employees with departments and find unassigned employees.

```r
library(dplyr)

employees <- data.frame(name=c("Alice","Bob","Carol","David"), dept=c("Eng","Mkt","Eng","HR"))
departments <- data.frame(dept=c("Eng","Mkt","Sales"), budget=c(500,300,200))

# 1. Left join to see all employees with budgets
# 2. Find employees in departments not in the departments table

```

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)

employees <- data.frame(name=c("Alice","Bob","Carol","David"), dept=c("Eng","Mkt","Eng","HR"))
departments <- data.frame(dept=c("Eng","Mkt","Sales"), budget=c(500,300,200))

cat("All employees with budgets:\n")
left_join(employees, departments, by = "dept")

cat("\nEmployees in unlisted depts:\n")
anti_join(employees, departments, by = "dept")
```

</details>

## Hard (11-15)

### Exercise 11: Top N Per Group

Find the 2 heaviest cars per cylinder group.

```r
library(dplyr)
# Your code here

```

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)
mtcars |>
  mutate(car = rownames(mtcars)) |>
  group_by(cyl) |>
  slice_max(wt, n = 2) |>
  select(car, cyl, wt, mpg) |>
  ungroup()
```

</details>

### Exercise 12: Percentage of Group Total

Calculate each car's hp as a percentage of its cylinder group's total hp.

```r
library(dplyr)
# Your code here

```

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)
mtcars |>
  mutate(car = rownames(mtcars)) |>
  group_by(cyl) |>
  mutate(hp_pct = round(hp / sum(hp) * 100, 1)) |>
  select(car, cyl, hp, hp_pct) |>
  arrange(cyl, desc(hp_pct)) |>
  ungroup() |>
  head(10)
```

</details>

### Exercise 13: Multi-Step Pipeline

Starting from mtcars: filter to manual transmission, add kpl column, group by cyl, get mean kpl, sort descending.

```r
library(dplyr)
# Your code here

```

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)
mtcars |>
  filter(am == 1) |>
  mutate(kpl = round(mpg * 0.425, 2)) |>
  group_by(cyl) |>
  summarise(n = n(), avg_kpl = round(mean(kpl), 2), .groups = "drop") |>
  arrange(desc(avg_kpl))
```

</details>

### Exercise 14: Conditional Summarise

For each iris Species, count flowers and flag if mean Sepal.Length > 6.

```r
library(dplyr)
# Your code here

```

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)
iris |>
  group_by(Species) |>
  summarise(
    n = n(),
    avg_sl = round(mean(Sepal.Length), 2),
    long_sepals = mean(Sepal.Length) > 6,
    .groups = "drop"
  )
```

</details>

### Exercise 15: Stratified Sample

Take a random 30% sample from each Species in iris, then count per group.

```r
library(dplyr)
set.seed(42)
# Your code here

```

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)
set.seed(42)
iris |>
  group_by(Species) |>
  slice_sample(prop = 0.3) |>
  ungroup() |>
  count(Species)
```

</details>

## What's Next?

- [dplyr filter & select](/dplyr-filter-select.html) — review the fundamentals
- [dplyr group_by & summarise](/dplyr-group-by-summarise.html) — grouped operations
- [R Joins](/R-Joins.html) — combining data frames
