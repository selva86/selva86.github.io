---
title: "dplyr arrange(), slice() & top_n(): Sort, Sample & Filter by Rank"
slug: "dplyr-arrange-slice"
description: "Sort data with dplyr arrange(), pick rows by position with slice(), and get top/bottom N with slice_max/slice_min. Grouped slicing examples."
keywords: "dplyr arrange, dplyr slice, top_n R, slice_max, slice_min, sort data R, dplyr sort, slice_sample"
mathjax: false
webr: true
date: "2026-03-30"
curriculum_id: "1.2.6"
post_type: "C"
sidebar_text: "dplyr arrange & slice"
curriculum_path: "/data-wrangling/dplyr/"
auto_link_terms: "dplyr arrange|arrange()|slice()|slice_max|slice_min|top_n|slice_sample"
auto_link_case_sensitive: false
---

# dplyr arrange(), slice() & top_n(): Sort, Sample & Filter by Rank

<p class="lead"><code>arrange()</code> sorts rows by column values. <code>slice()</code> picks rows by position. <code>slice_max()</code> and <code>slice_min()</code> get the top or bottom N rows by a value — with optional grouping for "top N per group."</p>

## arrange(): Sort Rows

```r
library(dplyr)

# Ascending (default)
mtcars |> arrange(mpg) |> select(mpg, hp, wt) |> head(5)
```

```r
library(dplyr)

# Descending
mtcars |> arrange(desc(mpg)) |> select(mpg, hp, wt) |> head(5)
```

```r
library(dplyr)

# Multiple columns: cyl ascending, then mpg descending within each cyl
mtcars |>
  arrange(cyl, desc(mpg)) |>
  select(cyl, mpg, hp) |>
  head(10)
```

## slice(): Pick Rows by Position

```r
library(dplyr)

mtcars |> slice(1:3) |> select(mpg, hp)          # First 3
mtcars |> slice(c(1, 10, 20)) |> select(mpg, hp) # Specific rows
```

### slice_head() and slice_tail()

```r
library(dplyr)

cat("First 3:\n")
mtcars |> slice_head(n = 3) |> select(mpg, hp)

cat("\nLast 3:\n")
mtcars |> slice_tail(n = 3) |> select(mpg, hp)
```

### slice_max() and slice_min(): Top/Bottom by Value

```r
library(dplyr)

# Top 5 most fuel-efficient
mtcars |>
  mutate(car = rownames(mtcars)) |>
  slice_max(mpg, n = 5) |>
  select(car, mpg, hp)
```

```r
library(dplyr)

# Bottom 3 by horsepower (least powerful)
mtcars |>
  mutate(car = rownames(mtcars)) |>
  slice_min(hp, n = 3) |>
  select(car, hp, mpg, cyl)
```

### slice_sample(): Random Rows

```r
library(dplyr)

set.seed(42)
# Random 5 rows
mtcars |>
  mutate(car = rownames(mtcars)) |>
  slice_sample(n = 5) |>
  select(car, mpg, hp)
```

```r
library(dplyr)

set.seed(42)
# 20% random sample
mtcars |> slice_sample(prop = 0.2) |> select(mpg, hp) |> nrow()
```

## Grouped Slicing: Top N Per Group

The real power: combine `group_by()` with slice functions to get the top/bottom N within each group.

```r
library(dplyr)

# Top 2 most efficient cars PER cylinder group
mtcars |>
  mutate(car = rownames(mtcars)) |>
  group_by(cyl) |>
  slice_max(mpg, n = 2) |>
  select(car, cyl, mpg) |>
  ungroup()
```

```r
library(dplyr)

# Heaviest car per cylinder group
mtcars |>
  mutate(car = rownames(mtcars)) |>
  group_by(cyl) |>
  slice_max(wt, n = 1) |>
  select(car, cyl, wt, mpg) |>
  ungroup()
```

### Stratified Random Sample

```r
library(dplyr)

set.seed(123)
# 2 random cars per cylinder group
mtcars |>
  mutate(car = rownames(mtcars)) |>
  group_by(cyl) |>
  slice_sample(n = 2) |>
  select(car, cyl, mpg) |>
  ungroup()
```

## Handling Ties

By default, `slice_max/slice_min` include ties — you might get more than N rows. Use `with_ties = FALSE` for exactly N.

```r
library(dplyr)

# With ties (default) — may return more than 3
mtcars |> slice_min(cyl, n = 3) |> nrow()

# Without ties — exactly 3
mtcars |> slice_min(cyl, n = 3, with_ties = FALSE) |> nrow()
```

## Practice Exercises

### Exercise 1: Top Performers by Group

Find the 2 most powerful cars (highest hp) in each cylinder group.

```r
library(dplyr)

```

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)

mtcars |>
  mutate(car = rownames(mtcars)) |>
  group_by(cyl) |>
  slice_max(hp, n = 2) |>
  select(car, cyl, hp, mpg) |>
  ungroup()
```

</details>

### Exercise 2: Stratified Sample for Training Data

Take 60% of each iris Species as a training set.

```r
library(dplyr)

set.seed(42)

```

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)

set.seed(42)
train <- iris |>
  group_by(Species) |>
  slice_sample(prop = 0.6) |>
  ungroup()

cat("Training set:", nrow(train), "rows\n")
train |> count(Species)
```

**Explanation:** `slice_sample(prop = 0.6)` inside `group_by(Species)` takes 60% from each group — a stratified sample that preserves class proportions.

</details>

## Summary

| Function | Purpose | Example |
|----------|---------|---------|
| `arrange(col)` | Sort ascending | `arrange(mpg)` |
| `arrange(desc(col))` | Sort descending | `arrange(desc(mpg))` |
| `slice(rows)` | Pick by position | `slice(1:5)` |
| `slice_head(n=)` | First N | `slice_head(n = 3)` |
| `slice_tail(n=)` | Last N | `slice_tail(n = 3)` |
| `slice_max(col, n=)` | Top N by value | `slice_max(mpg, n = 5)` |
| `slice_min(col, n=)` | Bottom N by value | `slice_min(hp, n = 3)` |
| `slice_sample(n=)` | Random N | `slice_sample(n = 10)` |
| `slice_sample(prop=)` | Random % | `slice_sample(prop = 0.2)` |

## FAQ

### Is arrange() stable (preserves original order for ties)?

Yes. dplyr's arrange is a stable sort — rows with identical sort values keep their original relative order.

### What replaced top_n()?

`slice_max()` and `slice_min()` replaced `top_n()` in dplyr 1.0. They have a clearer API: `slice_max(col, n = 5)` vs the old `top_n(5, col)` where argument order was confusing.

### Can I sort by a computed expression?

Yes: `arrange(desc(hp / wt))` sorts by power-to-weight ratio without creating a new column first.

## Continue Learning

- [R Joins](/R-Joins.html) — combine sorted data with other tables
- [dplyr filter & select](/dplyr-filter-select.html) — filter before sorting
- [dplyr group_by & summarise](/dplyr-group-by-summarise.html) — summarise before sorting
