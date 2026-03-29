---
title: "dplyr filter() & select() Exercises: 12 Practice Problems"
slug: "dplyr-filter-select-Exercises"
description: "12 dplyr filter and select exercises: row subsetting with conditions, column selection with helpers, and combined pipelines. Interactive solutions."
keywords: "dplyr filter exercises, dplyr select exercises, filter practice R, tidyverse exercises"
mathjax: false
webr: true
date: "2026-03-30"
curriculum_id: "E2.2"
post_type: "EX"
sidebar_text: "filter & select (12 problems)"
auto_link_terms: "filter select exercises|filter exercises|select exercises"
auto_link_case_sensitive: false
fr_parent: "dplyr-filter-select.html"
---

# dplyr filter() & select() Exercises: 12 Practice Problems

<p class="lead">12 exercises focused on <code>filter()</code> conditions and <code>select()</code> helpers. Practice compound conditions, %in%, string matching, and column selection patterns.</p>

## Easy (1-4)

### Exercise 1: Basic Filter

Get all iris flowers where Sepal.Length > 6 and Species is "virginica".

```r
library(dplyr)

```

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)
iris |> filter(Sepal.Length > 6, Species == "virginica") |> head(8)
```

</details>

### Exercise 2: Select Helpers

Select all columns from iris that contain "Petal".

```r
library(dplyr)

```

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)
iris |> select(contains("Petal")) |> head(5)
```

</details>

### Exercise 3: Exclude Columns

Select everything from mtcars EXCEPT vs, am, gear, and carb.

```r
library(dplyr)

```

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)
mtcars |> select(-c(vs, am, gear, carb)) |> head(5)
```

</details>

### Exercise 4: %in% Filter

Filter mtcars to only 4 and 6 cylinder cars.

```r
library(dplyr)

```

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)
mtcars |> filter(cyl %in% c(4, 6)) |> select(mpg, cyl, hp) |> head(8)
```

</details>

## Medium (5-8)

### Exercise 5: OR Conditions

Find cars with mpg > 30 OR hp > 200.

```r
library(dplyr)

```

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)
mtcars |> filter(mpg > 30 | hp > 200) |> select(mpg, hp, cyl)
```

</details>

### Exercise 6: Numeric Columns Only

Select only numeric columns from iris and compute column means.

```r
library(dplyr)

```

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)
iris |> select(where(is.numeric)) |> summarise(across(everything(), ~ round(mean(.x), 2)))
```

</details>

### Exercise 7: Between Filter

Find cars where wt is between 2.5 and 3.5 (inclusive).

```r
library(dplyr)

```

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)
mtcars |> filter(between(wt, 2.5, 3.5)) |> select(mpg, wt, hp) |> arrange(wt)
```

</details>

### Exercise 8: String Pattern Filter

Using the storms dataset, find all storms whose name starts with "A" in 2010 or later.

```r
library(dplyr)

```

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)
storms |>
  filter(grepl("^A", name), year >= 2010) |>
  distinct(name, year) |>
  head(10)
```

</details>

## Hard (9-12)

### Exercise 9: Dynamic Column Selection

Select Species plus all columns where the mean value exceeds 3.

```r
library(dplyr)

```

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)
iris |>
  select(Species, where(~ is.numeric(.x) && mean(.x) > 3)) |>
  head(5)
```

</details>

### Exercise 10: Negated Filter with NA

From this dataset, keep rows where score is NOT NA and grade is NOT "F".

```r
library(dplyr)

df <- data.frame(name=c("A","B","C","D","E"), score=c(88,NA,72,NA,95), grade=c("B","C","C","F","A"))

```

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)
df <- data.frame(name=c("A","B","C","D","E"), score=c(88,NA,72,NA,95), grade=c("B","C","C","F","A"))
df |> filter(!is.na(score), grade != "F")
```

</details>

### Exercise 11: Rename While Selecting

Select and rename mpg→fuel_efficiency, hp→horsepower, wt→weight from mtcars.

```r
library(dplyr)

```

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)
mtcars |> select(fuel_efficiency = mpg, horsepower = hp, weight = wt) |> head(5)
```

</details>

### Exercise 12: Combined Pipeline

Filter iris to setosa only, select Petal columns, add a ratio column, and sort by it.

```r
library(dplyr)

```

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)
iris |>
  filter(Species == "setosa") |>
  select(starts_with("Petal")) |>
  mutate(ratio = round(Petal.Length / Petal.Width, 2)) |>
  arrange(desc(ratio)) |>
  head(8)
```

</details>

## What's Next?

- [dplyr filter & select](/dplyr-filter-select.html) — review the concepts
- [dplyr Exercises](/dplyr-Exercises.html) — broader dplyr practice
- [dplyr mutate & rename](/dplyr-mutate-rename.html) — next verb to master
