---
title: "dplyr across(): Apply the Same Function to Multiple Columns at Once"
slug: "dplyr-across"
description: "Master dplyr across() to apply transformations to multiple columns in mutate() and summarise(). Use where(), starts_with(), and custom functions."
keywords: "dplyr across, across mutate, across summarise, multiple columns R, where is.numeric, tidyselect"
mathjax: false
webr: true
date: "2026-03-30"
curriculum_id: "FR-dply-1"
post_type: "FR"
auto_link_terms: "dplyr across|across()|across mutate|across summarise"
auto_link_case_sensitive: false
fr_parent: "dplyr-filter-select.html"
---

# dplyr across(): Apply the Same Function to Multiple Columns at Once

<p class="lead"><code>across()</code> lets you apply the same transformation to multiple columns inside <code>mutate()</code> or <code>summarise()</code> — without repeating yourself for each column.</p>

Before `across()`, you had to write `mutate(col1 = round(col1), col2 = round(col2), col3 = round(col3))`. Now you write `mutate(across(c(col1, col2, col3), round))`.

## Basic Usage

```r
library(dplyr)

# Round all numeric columns
iris |>
  mutate(across(where(is.numeric), ~ round(.x, 1))) |>
  head(4)
```

```r
library(dplyr)

# Summarise multiple columns
mtcars |>
  group_by(cyl) |>
  summarise(across(c(mpg, hp, wt), mean), .groups = "drop") |>
  mutate(across(where(is.numeric), ~ round(.x, 1)))
```

## Column Selection Methods

```r
library(dplyr)

# By name
mtcars |> summarise(across(c(mpg, hp, wt), mean)) |> round(1)

# By position
mtcars |> summarise(across(1:3, mean)) |> round(1)

# By pattern
iris |> summarise(across(starts_with("Sepal"), mean)) |> round(2)

# By type
iris |> summarise(across(where(is.numeric), median)) |> round(2)
```

## Multiple Functions

```r
library(dplyr)

mtcars |>
  summarise(across(c(mpg, hp),
    list(mean = mean, sd = sd),
    .names = "{.col}_{.fn}"
  )) |>
  round(1)
```

## Naming Output Columns

```r
library(dplyr)

# .names controls output column names
# {.col} = original column name, {.fn} = function name
mtcars |>
  summarise(across(c(mpg, hp, wt),
    list(avg = mean, min = min, max = max),
    .names = "{.fn}_{.col}"
  )) |> round(1)
```

## Practice Exercises

### Exercise 1: Standardize All Numeric Columns

Z-score standardize all numeric columns in iris.

```r
library(dplyr)

# z-score: (x - mean) / sd
# Use across() with where(is.numeric)

```

<details>
<summary>Click to reveal solution</summary>

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
| Custom names | `.names = "{.col}_{.fn}"` |

## FAQ

### Can I use across() in filter()?

No. `across()` works in `mutate()` and `summarise()` only. For filtering across multiple columns, use `if_any()` or `if_all()`.

### What replaced mutate_at, mutate_if, mutate_all?

`across()` replaced all three. `mutate_at(vars(x,y), fn)` → `mutate(across(c(x,y), fn))`. `mutate_if(is.numeric, fn)` → `mutate(across(where(is.numeric), fn))`.

## What's Next?

- [dplyr filter & select](/dplyr-filter-select.html) — the parent tutorial
- [dplyr mutate & rename](/dplyr-mutate-rename.html) — where across() is used most
- [dplyr case_when](/dplyr-case-when.html) — conditional logic inside mutate
