---
title: "dplyr across(): Apply the Same Function to Multiple Columns at Once"
slug: "dplyr-across"
description: "Master dplyr across() to apply transformations to multiple columns in mutate() and summarise(). Use where(), starts_with(), and custom functions."
keywords: "dplyr across, across mutate, across summarise, multiple columns R, where is.numeric, tidyselect"
mathjax: false
webr: true
date: "2026-03-30"
curriculum_id: "FR-dply-1"
post_type: "C"
auto_link_terms: "dplyr across|across()|across mutate|across summarise"
auto_link_case_sensitive: false
fr_parent: "dplyr-filter-select.html"
sidebar_section: "Data Wrangling"
sidebar_title: "dplyr across()"
---

# dplyr across(): Apply the Same Function to Multiple Columns at Once

<p class="lead"><code>across()</code> applies the same function to multiple columns inside <code>mutate()</code> or <code>summarise()</code>. It replaced <code>mutate_if</code>, <code>mutate_at</code>, and <code>mutate_all</code> with one unified verb.</p>

Before across, you wrote `mutate(col1 = round(col1), col2 = round(col2), col3 = round(col3))`. Now: `mutate(across(c(col1, col2, col3), round))`.

## Basic: One Function, Multiple Columns

```r
library(dplyr)

# Round all numeric columns
iris |>
  mutate(across(where(is.numeric), ~ round(.x, 1))) |>
  head(4)
```

```r
library(dplyr)

# Mean of specific columns per group
mtcars |>
  group_by(cyl) |>
  summarise(across(c(mpg, hp, wt), ~ round(mean(.x), 1)), .groups = "drop")
```

## Column Selection Inside across()

```r
library(dplyr)

# By name
mtcars |> summarise(across(c(mpg, hp, wt), mean)) |> round(1)

# By pattern
iris |> summarise(across(starts_with("Sepal"), ~ round(mean(.x), 2)))

# By type
iris |> summarise(across(where(is.numeric), ~ round(median(.x), 2)))

# By exclusion
mtcars |> summarise(across(-c(cyl, vs, am, gear, carb), mean)) |> round(1)
```

## Multiple Functions per Column

Use a named list to apply several functions, creating multiple output columns.

```r
library(dplyr)

mtcars |>
  group_by(cyl) |>
  summarise(
    across(c(mpg, hp),
      list(mean = ~ round(mean(.x), 1), sd = ~ round(sd(.x), 1)),
      .names = "{.col}_{.fn}"
    ),
    .groups = "drop"
  )
```

## .names: Control Output Column Names

```r
library(dplyr)

# Default: "{.col}_{.fn}" → mpg_mean, mpg_sd
# Custom: "{.fn}_{.col}" → mean_mpg, sd_mpg
mtcars |>
  summarise(across(c(mpg, hp),
    list(avg = mean, min = min, max = max),
    .names = "{.fn}_{.col}"
  )) |> round(1)
```

## across in mutate: Transform Columns

```r
library(dplyr)

# Z-score standardize, saving as new columns
mtcars |>
  mutate(across(c(mpg, hp, wt),
    ~ round((.x - mean(.x)) / sd(.x), 2),
    .names = "{.col}_z"
  )) |>
  select(mpg, mpg_z, hp, hp_z, wt, wt_z) |>
  head(5)
```

## if_any() and if_all(): across for filter

```r
library(dplyr)

# Keep rows where ANY numeric column > 6 (in iris)
iris |>
  filter(if_any(where(is.numeric), ~ .x > 6)) |>
  head(5)

# Keep rows where ALL Sepal columns > 5
iris |>
  filter(if_all(starts_with("Sepal"), ~ .x > 5)) |>
  head(5)
```

## Practice Exercises

### Exercise 1: Standardize All Numeric Columns

Z-score standardize every numeric column in iris.

```r
library(dplyr)

```

<details><summary>Click to reveal solution</summary>

```r
library(dplyr)

iris |>
  mutate(across(where(is.numeric), ~ round((.x - mean(.x)) / sd(.x), 2))) |>
  head(5)
```
</details>

## Summary

| Pattern | Code |
|---------|------|
| All numeric | `across(where(is.numeric), fn)` |
| By name | `across(c(col1, col2), fn)` |
| By pattern | `across(starts_with("x"), fn)` |
| Multiple fns | `across(cols, list(mean = mean, sd = sd))` |
| Custom names | `.names = "{.fn}_{.col}"` |
| Filter any | `filter(if_any(cols, ~ .x > 5))` |
| Filter all | `filter(if_all(cols, ~ .x > 5))` |

## FAQ

### What replaced mutate_at, mutate_if, mutate_all?

`across()` replaced all three in dplyr 1.0. `mutate_if(is.numeric, fn)` → `mutate(across(where(is.numeric), fn))`. `mutate_at(vars(x,y), fn)` → `mutate(across(c(x,y), fn))`.

### Can I use across() in filter()?

Not directly. Use `if_any()` or `if_all()` instead: `filter(if_any(cols, ~ .x > threshold))`.

## What's Next?

- [dplyr filter & select](/dplyr-filter-select.html) — the parent tutorial
- [dplyr mutate & rename](/dplyr-mutate-rename.html) — where across() is used most
- [dplyr group_by & summarise](/dplyr-group-by-summarise.html) — across in grouped summaries
