---
title: "dplyr filter() and select(): Subset Rows & Columns with Precision"
slug: "dplyr-filter-select"
description: "Master dplyr filter() to subset rows by condition and select() to pick columns. Includes helpers like starts_with(), where(), and across()."
keywords: "dplyr filter, dplyr select, subset rows R, select columns R, filter conditions R, tidyverse filter"
mathjax: false
webr: true
date: "2026-03-30"
curriculum_id: "1.2.3"
post_type: "C"
sidebar_text: "dplyr filter & select"
curriculum_path: "/data-wrangling/dplyr/"
auto_link_terms: "dplyr filter|dplyr select|filter and select|filter()|select()"
auto_link_case_sensitive: false
---

# dplyr filter() and select(): Subset Rows & Columns with Precision

<p class="lead"><code>filter()</code> keeps rows that match a condition. <code>select()</code> picks columns by name, position, or pattern. Together they're the most-used dplyr verbs — you'll call them in almost every analysis.</p>

Base R subsetting with `[` works but gets verbose fast. dplyr's `filter()` and `select()` are clearer, chainable with the pipe, and support powerful helper functions.

## filter(): Keep Rows by Condition

```r
library(dplyr)

# Keep cars with mpg > 25
mtcars |>
  filter(mpg > 25) |>
  select(mpg, hp, wt)
```

### Multiple Conditions

```r
library(dplyr)

# AND: comma or &
mtcars |>
  filter(mpg > 20, cyl == 4) |>
  select(mpg, cyl, hp)
```

```r
library(dplyr)

# OR: use |
mtcars |>
  filter(cyl == 4 | cyl == 6) |>
  select(mpg, cyl, hp) |>
  head(8)
```

```r
library(dplyr)

# %in% for matching multiple values
mtcars |>
  filter(cyl %in% c(4, 6), gear >= 4) |>
  select(mpg, cyl, gear)
```

### Filtering with NA

```r
library(dplyr)

df <- data.frame(
  name = c("Alice", "Bob", "Carol", "David", "Eve"),
  score = c(88, NA, 92, NA, 76)
)

# filter automatically drops NAs in the condition
df |> filter(score > 80)

# To keep NAs explicitly
df |> filter(score > 80 | is.na(score))
```

### String Filtering

```r
library(dplyr)

storms_sample <- storms[1:100, ]

# Filter by string pattern
storms_sample |>
  filter(grepl("^A", name)) |>
  select(name, year, status) |>
  distinct(name, .keep_all = TRUE)
```

## select(): Pick Columns

```r
library(dplyr)

# By name
mtcars |> select(mpg, hp, wt) |> head(4)
```

```r
library(dplyr)

# By range
mtcars |> select(mpg:drat) |> head(4)
```

```r
library(dplyr)

# Exclude columns with -
mtcars |> select(-c(vs, am, gear, carb)) |> head(4)
```

### Select Helpers

```r
library(dplyr)

# starts_with, ends_with, contains, matches
iris |>
  select(starts_with("Sepal")) |>
  head(4)
```

```r
library(dplyr)

# where() selects by column type
iris |>
  select(where(is.numeric)) |>
  head(4)
```

```r
library(dplyr)

# Rename while selecting
mtcars |>
  select(fuel_efficiency = mpg, horsepower = hp, weight = wt) |>
  head(4)
```

### Reorder Columns

```r
library(dplyr)

# Move specific columns to the front
iris |>
  select(Species, everything()) |>
  head(4)
```

## Combining filter and select

```r
library(dplyr)

# Full pipeline: filter rows, select columns, arrange
mtcars |>
  filter(mpg > 20, hp > 90) |>
  select(mpg, hp, wt, gear) |>
  arrange(desc(mpg))
```

## filter vs subset vs base R

| Method | Syntax | Handles NA |
|--------|--------|-----------|
| `filter()` | `filter(df, mpg > 20)` | Drops NA rows |
| `subset()` | `subset(df, mpg > 20)` | Drops NA rows |
| `[` | `df[df$mpg > 20, ]` | Keeps NA rows |

## Practice Exercises

### Exercise 1: Complex Filter

Find all 4-cylinder cars with above-average mpg and manual transmission.

```r
library(dplyr)

# am == 1 means manual transmission
# Find 4-cyl cars with mpg above the overall mean

```

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)

avg_mpg <- mean(mtcars$mpg)
cat("Average mpg:", round(avg_mpg, 1), "\n\n")

mtcars |>
  filter(cyl == 4, mpg > avg_mpg, am == 1) |>
  select(mpg, cyl, hp, wt, am)
```

</details>

### Exercise 2: Select by Pattern

From the iris dataset, select Species plus all columns that contain "Width".

```r
library(dplyr)

# Select Species and all Width columns

```

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)

iris |>
  select(Species, contains("Width")) |>
  head(6)
```

**Explanation:** `contains("Width")` matches any column name containing that substring. Combine with explicit column names freely.

</details>

## Summary

| Function | Purpose | Example |
|----------|---------|---------|
| `filter(condition)` | Keep rows | `filter(mpg > 20)` |
| `select(cols)` | Pick columns | `select(mpg, hp)` |
| `starts_with("x")` | Columns starting with | `select(starts_with("Sepal"))` |
| `ends_with("x")` | Columns ending with | `select(ends_with("Width"))` |
| `contains("x")` | Columns containing | `select(contains("ar"))` |
| `where(fn)` | Columns by type | `select(where(is.numeric))` |
| `everything()` | All remaining columns | `select(id, everything())` |

## FAQ

### What's the difference between filter() and subset()?

Functionally almost identical for basic use. `filter()` is faster, works with grouped data, supports tidy evaluation, and integrates with the pipe. Use `filter()` in tidyverse workflows.

### Can filter() handle regular expressions?

Not directly. Use `grepl()` or `stringr::str_detect()` inside filter: `filter(str_detect(name, "^A"))`.

### How do I select columns by position number?

Use `select(1, 3, 5)` or `select(1:5)`. But selecting by name is safer since column positions can change.

## What's Next?

- [dplyr mutate & rename](/dplyr-mutate-rename.html) — create and modify columns
- [dplyr group_by & summarise](/dplyr-group-by-summarise.html) — aggregate data by group
- [R Joins](/R-Joins.html) — combine multiple data frames
