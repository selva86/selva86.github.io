---
title: "dplyr group_by() + summarise(): Aggregate Data by Group (10 Examples)"
slug: "dplyr-group-by-summarise"
description: "Master dplyr group_by() and summarise() to compute grouped statistics: mean, count, sd, min/max. 10 real examples with across() and .groups control."
keywords: "dplyr group_by, dplyr summarise, aggregate R, grouped summary R, n(), across summarise, count R"
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

<p class="lead"><code>group_by()</code> splits data into groups. <code>summarise()</code> collapses each group to a single summary row. Together they replace complex <code>tapply()</code> and <code>aggregate()</code> calls with readable, chainable code.</p>

"What's the average mpg per cylinder count?" is a grouped summary. Without dplyr you'd write `tapply(mtcars$mpg, mtcars$cyl, mean)`. With dplyr: `mtcars |> group_by(cyl) |> summarise(avg = mean(mpg))`. Same answer, clearer intent.

## Example 1: Basic Grouped Summary

```r
library(dplyr)

mtcars |>
  group_by(cyl) |>
  summarise(
    count   = n(),
    avg_mpg = round(mean(mpg), 1),
    avg_hp  = round(mean(hp), 0),
    .groups = "drop"
  )
```

## Example 2: Multiple Grouping Variables

```r
library(dplyr)

mtcars |>
  group_by(cyl, am) |>
  summarise(
    n       = n(),
    avg_mpg = round(mean(mpg), 1),
    .groups = "drop"
  )
```

## Example 3: Many Summary Functions

```r
library(dplyr)

mtcars |>
  group_by(cyl) |>
  summarise(
    n       = n(),
    mean    = round(mean(mpg), 1),
    sd      = round(sd(mpg), 1),
    min     = min(mpg),
    max     = max(mpg),
    median  = median(mpg),
    .groups = "drop"
  )
```

## Example 4: across() for Multiple Columns

Apply the same summary to several columns at once.

```r
library(dplyr)

mtcars |>
  group_by(cyl) |>
  summarise(
    across(c(mpg, hp, wt), ~ round(mean(.x), 1)),
    .groups = "drop"
  )
```

## Example 5: Multiple Functions per Column

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

## Example 6: count() and Proportions

`count()` is a shortcut for `group_by() + summarise(n = n())`.

```r
library(dplyr)

mtcars |>
  count(cyl, am, sort = TRUE) |>
  mutate(pct = round(n / sum(n) * 100, 1))
```

## Example 7: Grouped mutate (Window Functions)

`group_by() + mutate()` keeps all rows but computes values within each group.

```r
library(dplyr)

mtcars |>
  group_by(cyl) |>
  mutate(
    mpg_rank     = rank(-mpg),
    pct_of_avg   = round(mpg / mean(mpg) * 100, 1)
  ) |>
  select(mpg, cyl, mpg_rank, pct_of_avg) |>
  filter(mpg_rank <= 3) |>
  arrange(cyl, mpg_rank) |>
  ungroup()
```

## Example 8: Handling NAs

```r
library(dplyr)

df <- data.frame(
  group = c("A","A","A","B","B","B"),
  value = c(10, NA, 12, 20, 30, NA)
)

df |>
  group_by(group) |>
  summarise(
    mean_val = mean(value, na.rm = TRUE),
    n_total  = n(),
    n_valid  = sum(!is.na(value)),
    .groups  = "drop"
  )
```

## Example 9: .groups Argument

```r
library(dplyr)

# .groups controls grouping state after summarise
# "drop" = fully ungrouped (safest, most common)
# "drop_last" = drops the last grouping level (default)
# "keep" = keeps all groups

result <- mtcars |>
  group_by(cyl, am) |>
  summarise(avg = mean(mpg), .groups = "drop")

cat("Is grouped after .groups='drop'?", is.grouped_df(result), "\n")
print(result)
```

## Example 10: Cumulative and Rolling Within Groups

```r
library(dplyr)

mtcars |>
  arrange(cyl, mpg) |>
  group_by(cyl) |>
  mutate(
    cumul_hp    = cumsum(hp),
    running_avg = round(cummean(mpg), 1)
  ) |>
  select(cyl, mpg, hp, cumul_hp, running_avg) |>
  slice_head(n = 3) |>
  ungroup()
```

## summarise vs mutate After group_by

| | `summarise()` | `mutate()` |
|-|--------------|-----------|
| Output rows | 1 per group | Same as input |
| Use case | Aggregate stats | Window functions |
| Example | `mean(x)` → one number per group | `rank(x)` → rank within group |

## Practice Exercises

### Exercise 1: Sales Report

Summarise this data by region: total revenue, average quarterly revenue, and best quarter.

```r
library(dplyr)

sales <- data.frame(
  region  = rep(c("East", "West", "South"), each = 4),
  quarter = rep(c("Q1","Q2","Q3","Q4"), 3),
  revenue = c(100,120,110,150, 200,180,220,250, 80,90,85,100)
)

```

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)

sales <- data.frame(
  region  = rep(c("East", "West", "South"), each = 4),
  quarter = rep(c("Q1","Q2","Q3","Q4"), 3),
  revenue = c(100,120,110,150, 200,180,220,250, 80,90,85,100)
)

sales |>
  group_by(region) |>
  summarise(
    total    = sum(revenue),
    avg_qtr  = round(mean(revenue), 1),
    best_qtr = quarter[which.max(revenue)],
    best_rev = max(revenue),
    .groups  = "drop"
  ) |>
  arrange(desc(total))
```

</details>

### Exercise 2: Percentage Within Group

Show each car's mpg as a percentage of its cylinder group's average.

```r
library(dplyr)

# Add pct_of_avg column, show top 5 most efficient relative to group

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

**Explanation:** `group_by() + mutate()` computes `mean(mpg)` per group but keeps all rows. Each car gets its group's mean used in the percentage calculation.

</details>

### Exercise 3: Per-Species Summary

For each iris Species, compute count, mean Sepal.Length, and the coefficient of variation (sd/mean * 100).

```r
library(dplyr)

```

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)

iris |>
  group_by(Species) |>
  summarise(
    n      = n(),
    mean   = round(mean(Sepal.Length), 2),
    cv_pct = round(sd(Sepal.Length) / mean(Sepal.Length) * 100, 1),
    .groups = "drop"
  )
```

**Explanation:** Coefficient of variation (CV) = sd/mean × 100. It measures relative variability, making it comparable across groups with different means.

</details>

## Summary

| Function | Purpose |
|----------|---------|
| `group_by(col)` | Split data into groups |
| `summarise(stat = fn(col))` | One row per group |
| `n()` | Count rows in group |
| `across(cols, fn)` | Apply to multiple columns |
| `count(col)` | Shortcut: group + count |
| `ungroup()` | Remove grouping |
| `.groups = "drop"` | Ungroup after summarise |

## FAQ

### What's the difference between summarise and summarize?

Nothing — they're aliases. Use whichever spelling you prefer.

### Why do I get a ".groups" warning?

dplyr warns when you don't specify `.groups` after multi-column `group_by()`. Add `.groups = "drop"` for ungrouped output (most common) or `"keep"` to retain grouping.

### Can I use custom functions in summarise?

Yes. Any function that takes a vector and returns a single value works: `summarise(result = my_function(column))`.

### How do I summarise all numeric columns at once?

`summarise(across(where(is.numeric), mean))` applies `mean` to every numeric column.

## Continue Learning

- [dplyr arrange & slice](/dplyr-arrange-slice.html) — sort and sample summaries
- [R Joins](/R-Joins.html) — combine grouped summaries with other data
- [dplyr filter & select](/dplyr-filter-select.html) — filter before grouping
