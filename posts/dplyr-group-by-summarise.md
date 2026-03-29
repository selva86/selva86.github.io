---
title: "dplyr group_by() + summarise(): Aggregate Data by Group (10 Examples)"
slug: "dplyr-group-by-summarise"
description: "Master dplyr group_by() and summarise() to compute grouped statistics: mean, count, sd, min/max. 10 real examples with across() and .groups control."
keywords: "dplyr group_by, dplyr summarise, aggregate R, grouped summary R, n(), across summarise"
mathjax: false
webr: true
date: "2026-03-30"
curriculum_id: "1.2.5"
post_type: "C"
sidebar_text: "dplyr group_by & summarise"
curriculum_path: "/data-wrangling/dplyr/"
auto_link_terms: "group_by|summarise|summarize|grouped summary|aggregate by group"
auto_link_case_sensitive: false
---

# dplyr group_by() + summarise(): Aggregate Data by Group (10 Examples)

<p class="lead"><code>group_by()</code> splits data into groups. <code>summarise()</code> computes one summary row per group. Together they replace complex <code>tapply()</code>/<code>aggregate()</code> calls with readable, chainable code.</p>

## Basic Grouped Summary

```r
library(dplyr)

mtcars |>
  group_by(cyl) |>
  summarise(
    count = n(),
    avg_mpg = round(mean(mpg), 1),
    avg_hp = round(mean(hp), 0)
  )
```

## Multiple Grouping Variables

```r
library(dplyr)

mtcars |>
  group_by(cyl, am) |>
  summarise(
    count = n(),
    avg_mpg = round(mean(mpg), 1),
    .groups = "drop"
  )
```

## Common Summary Functions

```r
library(dplyr)

mtcars |>
  group_by(cyl) |>
  summarise(
    n = n(),
    mean_mpg = round(mean(mpg), 1),
    sd_mpg = round(sd(mpg), 1),
    min_mpg = min(mpg),
    max_mpg = max(mpg),
    median_hp = median(hp),
    .groups = "drop"
  )
```

## summarise with across()

```r
library(dplyr)

# Apply the same function to multiple columns
mtcars |>
  group_by(cyl) |>
  summarise(across(c(mpg, hp, wt), ~ round(mean(.x), 1)), .groups = "drop")
```

```r
library(dplyr)

# Multiple summary functions per column
mtcars |>
  group_by(cyl) |>
  summarise(across(c(mpg, hp),
    list(mean = ~ round(mean(.x), 1), sd = ~ round(sd(.x), 1)),
    .names = "{.col}_{.fn}"),
    .groups = "drop")
```

## count() and tally() Shortcuts

```r
library(dplyr)

# count() = group_by() + summarise(n = n())
mtcars |> count(cyl, am, sort = TRUE)
```

```r
library(dplyr)

# Add proportions
mtcars |>
  count(cyl) |>
  mutate(pct = round(n / sum(n) * 100, 1))
```

## Grouped mutate (Window Functions)

```r
library(dplyr)

# mutate within groups (keeps all rows)
mtcars |>
  group_by(cyl) |>
  mutate(
    mpg_rank = rank(-mpg),
    pct_of_group_avg = round(mpg / mean(mpg) * 100, 1)
  ) |>
  select(mpg, cyl, mpg_rank, pct_of_group_avg) |>
  slice_head(n = 3) |>
  ungroup()
```

## Handling NAs in Summaries

```r
library(dplyr)

df <- data.frame(
  group = c("A", "A", "B", "B", "B"),
  value = c(10, NA, 20, 30, NA)
)

df |>
  group_by(group) |>
  summarise(
    mean_val = mean(value, na.rm = TRUE),
    n_total = n(),
    n_valid = sum(!is.na(value)),
    .groups = "drop"
  )
```

## .groups Argument

```r
library(dplyr)

# .groups controls what happens after summarise
# "drop" = fully ungrouped result (safest)
# "drop_last" = drops the last grouping level (default)
# "keep" = keeps all groups

mtcars |>
  group_by(cyl, am) |>
  summarise(avg = mean(mpg), .groups = "drop") |>
  is.grouped_df()  # FALSE because we used "drop"
```

## Practice Exercises

### Exercise 1: Sales Report

Create a grouped summary of this sales data.

```r
library(dplyr)

sales <- data.frame(
  region = rep(c("East", "West", "South"), each = 4),
  quarter = rep(c("Q1", "Q2", "Q3", "Q4"), 3),
  revenue = c(100, 120, 110, 150, 200, 180, 220, 250, 80, 90, 85, 100)
)

# Per region: total revenue, avg quarterly revenue, best quarter

```

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)

sales <- data.frame(
  region = rep(c("East", "West", "South"), each = 4),
  quarter = rep(c("Q1", "Q2", "Q3", "Q4"), 3),
  revenue = c(100, 120, 110, 150, 200, 180, 220, 250, 80, 90, 85, 100)
)

sales |>
  group_by(region) |>
  summarise(
    total = sum(revenue),
    avg = round(mean(revenue), 1),
    best_q = quarter[which.max(revenue)],
    best_rev = max(revenue),
    .groups = "drop"
  ) |>
  arrange(desc(total))
```

</details>

### Exercise 2: Percentage Within Groups

Calculate each car's mpg as a percentage of its cylinder group's average.

```r
library(dplyr)

# Add a column: pct_of_avg = (mpg / group_mean_mpg) * 100
# Show only mpg, cyl, pct_of_avg for the top 5 most efficient relative to their group

```

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)

mtcars |>
  group_by(cyl) |>
  mutate(pct_of_avg = round(mpg / mean(mpg) * 100, 1)) |>
  ungroup() |>
  select(mpg, cyl, pct_of_avg) |>
  arrange(desc(pct_of_avg)) |>
  head(5)
```

**Explanation:** `group_by() + mutate()` computes the group mean for each row's group. `ungroup()` removes grouping before sorting.

</details>

## Summary

| Function | Purpose |
|----------|---------|
| `group_by(col)` | Split data into groups |
| `summarise(stat = fn(col))` | One row per group |
| `n()` | Count rows in group |
| `across(cols, fn)` | Apply fn to multiple columns |
| `count(col)` | Shortcut for group + count |
| `ungroup()` | Remove grouping |
| `.groups = "drop"` | Ungroup after summarise |

## FAQ

### What's the difference between summarise and summarize?

Nothing. They're aliases. Use whichever spelling you prefer.

### Why do I get a warning about ".groups"?

dplyr warns when you don't specify `.groups` in `summarise()` after multi-column `group_by()`. Add `.groups = "drop"` to suppress the warning and get ungrouped output.

### Can I summarise with custom functions?

Yes. Any function that takes a vector and returns a single value works: `summarise(result = my_function(column))`.

## What's Next?

- [dplyr arrange & slice](/dplyr-arrange-slice.html) — sort and sample your summaries
- [R Joins](/R-Joins.html) — combine grouped summaries with other data
- [dplyr filter & select](/dplyr-filter-select.html) — filter before grouping
