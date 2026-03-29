---
title: "dplyr arrange(), slice() & top_n(): Sort, Sample & Filter by Rank"
slug: "dplyr-arrange-slice"
description: "Sort data with dplyr arrange(), pick rows by position with slice(), and get top/bottom N with slice_max/slice_min. Interactive examples."
keywords: "dplyr arrange, dplyr slice, top_n R, slice_max, slice_min, sort data R, dplyr sort"
mathjax: false
webr: true
date: "2026-03-30"
curriculum_id: "1.2.6"
post_type: "C"
sidebar_text: "dplyr arrange & slice"
curriculum_path: "/data-wrangling/dplyr/"
auto_link_terms: "dplyr arrange|arrange()|slice()|slice_max|slice_min|top_n"
auto_link_case_sensitive: false
---

# dplyr arrange(), slice() & top_n(): Sort, Sample & Filter by Rank

<p class="lead"><code>arrange()</code> sorts rows. <code>slice()</code> picks rows by position. <code>slice_max()</code> and <code>slice_min()</code> get the top or bottom N rows by a column's value. Fast, readable alternatives to <code>order()</code> and <code>head()</code>.</p>

## arrange(): Sort Rows

```r
library(dplyr)

# Sort by mpg ascending (default)
mtcars |> arrange(mpg) |> select(mpg, hp, wt) |> head(5)
```

```r
library(dplyr)

# Sort descending
mtcars |> arrange(desc(mpg)) |> select(mpg, hp, wt) |> head(5)
```

```r
library(dplyr)

# Sort by multiple columns: cyl ascending, then mpg descending within each
mtcars |>
  arrange(cyl, desc(mpg)) |>
  select(cyl, mpg, hp) |>
  head(10)
```

## slice(): Pick Rows by Position

```r
library(dplyr)

# First 3 rows
mtcars |> slice(1:3) |> select(mpg, hp)
```

```r
library(dplyr)

# Specific rows
mtcars |> slice(c(1, 5, 10, 20)) |> select(mpg, hp, wt)
```

### slice_head() and slice_tail()

```r
library(dplyr)

# First and last N rows
cat("First 3:\n")
mtcars |> slice_head(n = 3) |> select(mpg, hp)

cat("\nLast 3:\n")
mtcars |> slice_tail(n = 3) |> select(mpg, hp)
```

### slice_max() and slice_min()

```r
library(dplyr)

# Top 5 most fuel-efficient cars
mtcars |>
  slice_max(mpg, n = 5) |>
  select(mpg, hp, wt)
```

```r
library(dplyr)

# Bottom 3 by hp (least powerful)
mtcars |>
  slice_min(hp, n = 3) |>
  select(mpg, hp, cyl)
```

### slice_sample(): Random Rows

```r
library(dplyr)

set.seed(42)
# Random sample of 5 rows
mtcars |>
  slice_sample(n = 5) |>
  select(mpg, hp, wt)
```

```r
library(dplyr)

set.seed(42)
# 20% random sample
mtcars |>
  slice_sample(prop = 0.2) |>
  select(mpg, hp, wt)
```

## Grouped Slicing

```r
library(dplyr)

# Top 2 most efficient cars PER cylinder group
mtcars |>
  group_by(cyl) |>
  slice_max(mpg, n = 2) |>
  select(cyl, mpg, hp) |>
  ungroup()
```

## Practice Exercises

### Exercise 1: Top Performers by Group

Find the heaviest car in each cylinder group.

```r
library(dplyr)

# Find the heaviest car (max wt) per cyl group

```

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)

mtcars |>
  mutate(car = rownames(mtcars)) |>
  group_by(cyl) |>
  slice_max(wt, n = 1) |>
  select(car, cyl, wt, mpg) |>
  ungroup()
```

</details>

### Exercise 2: Stratified Sample

Take a random sample of 2 cars from each cylinder group.

```r
library(dplyr)

set.seed(123)
# Sample 2 cars per cyl group

```

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)

set.seed(123)
mtcars |>
  mutate(car = rownames(mtcars)) |>
  group_by(cyl) |>
  slice_sample(n = 2) |>
  select(car, cyl, mpg) |>
  ungroup()
```

**Explanation:** `slice_sample()` inside `group_by()` samples N rows per group — a stratified sample.

</details>

## Summary

| Function | Purpose | Example |
|----------|---------|---------|
| `arrange(col)` | Sort ascending | `arrange(mpg)` |
| `arrange(desc(col))` | Sort descending | `arrange(desc(mpg))` |
| `slice(rows)` | Pick by position | `slice(1:5)` |
| `slice_head(n=)` | First N rows | `slice_head(n = 3)` |
| `slice_tail(n=)` | Last N rows | `slice_tail(n = 3)` |
| `slice_max(col, n=)` | Top N by value | `slice_max(mpg, n = 5)` |
| `slice_min(col, n=)` | Bottom N by value | `slice_min(hp, n = 3)` |
| `slice_sample(n=)` | Random N rows | `slice_sample(n = 10)` |

## FAQ

### How do I break ties in slice_max/slice_min?

By default, ties are included (you may get more than N rows). Use `with_ties = FALSE` to get exactly N rows.

### Is arrange() stable (preserves original order for ties)?

Yes. dplyr's arrange is a stable sort — rows with equal values keep their original relative order.

## What's Next?

- [R Joins](/R-Joins.html) — combine sorted data with other tables
- [dplyr filter & select](/dplyr-filter-select.html) — filter before sorting
- [dplyr group_by & summarise](/dplyr-group-by-summarise.html) — summarise after grouping
