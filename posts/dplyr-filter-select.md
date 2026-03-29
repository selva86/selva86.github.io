---
title: "dplyr filter() and select(): Subset Rows & Columns with Precision"
slug: "dplyr-filter-select"
description: "Master dplyr filter() to subset rows by condition and select() to pick columns by name, pattern, or type. Includes helpers like starts_with() and where()."
keywords: "dplyr filter, dplyr select, subset rows R, select columns R, filter conditions R, tidyverse filter, starts_with, where"
mathjax: false
webr: true
date: "2026-03-30"
curriculum_id: "1.2.3"
post_type: "C"
sidebar_text: "dplyr filter & select"
curriculum_path: "/data-wrangling/dplyr/"
auto_link_terms: "dplyr filter|dplyr select|filter()|select()|filter and select"
auto_link_case_sensitive: false
---

# dplyr filter() and select(): Subset Rows & Columns with Precision

<p class="lead"><code>filter()</code> keeps rows that match a condition. <code>select()</code> picks columns by name, position, or pattern. Together they're the most-used dplyr verbs — you'll call them in almost every analysis.</p>

Base R subsetting with `df[df$col > 5, c("a", "b")]` works but gets ugly fast, especially with multiple conditions. dplyr's filter and select are readable, pipe-friendly, and come with powerful helper functions that save typing.

## filter(): Keep Rows by Condition

Start with a simple comparison. `filter()` takes a data frame and one or more logical conditions. It returns only the rows where every condition is TRUE.

```r
library(dplyr)

# Cars with more than 25 miles per gallon
mtcars |>
  filter(mpg > 25) |>
  select(mpg, hp, wt, cyl)
```

### Multiple Conditions (AND)

Separate conditions with commas — they're combined with AND (all must be true).

```r
library(dplyr)

# 4-cylinder AND manual transmission (am == 1)
mtcars |>
  filter(cyl == 4, am == 1) |>
  select(mpg, cyl, am, hp)
```

### OR Conditions

Use `|` for OR — rows matching either condition are kept.

```r
library(dplyr)

# 4-cylinder OR 6-cylinder
mtcars |>
  filter(cyl == 4 | cyl == 6) |>
  select(mpg, cyl, hp) |>
  head(8)
```

### %in% for Multiple Values

When checking against several values, `%in%` is cleaner than chaining `|`.

```r
library(dplyr)

# Same as above but cleaner
mtcars |>
  filter(cyl %in% c(4, 6), gear >= 4) |>
  select(mpg, cyl, gear, hp)
```

### Negation with !

```r
library(dplyr)

# Everything EXCEPT 8-cylinder cars
mtcars |>
  filter(!(cyl == 8)) |>
  select(mpg, cyl) |>
  head(6)
```

### between() for Ranges

```r
library(dplyr)

# Weight between 2.5 and 3.5 tons (inclusive)
mtcars |>
  filter(between(wt, 2.5, 3.5)) |>
  select(mpg, wt, hp) |>
  arrange(wt)
```

### Filtering with NA

`filter()` automatically drops rows where the condition evaluates to NA. If you want to keep NAs, be explicit.

```r
library(dplyr)

df <- data.frame(
  name  = c("Alice", "Bob", "Carol", "David", "Eve"),
  score = c(88, NA, 92, NA, 76)
)

# This drops NAs automatically
cat("score > 80 (NAs dropped):\n")
df |> filter(score > 80)

# Keep NAs explicitly
cat("\nscore > 80 OR is NA:\n")
df |> filter(score > 80 | is.na(score))
```

### String Filtering with grepl / str_detect

```r
library(dplyr)

# Filter by string pattern
mtcars |>
  mutate(car = rownames(mtcars)) |>
  filter(grepl("^M", car)) |>
  select(car, mpg, cyl)
```

## select(): Pick Columns

### By Name

```r
library(dplyr)

mtcars |> select(mpg, hp, wt) |> head(4)
```

### By Range

```r
library(dplyr)

# All columns from mpg to drat
mtcars |> select(mpg:drat) |> head(4)
```

### Exclude Columns with -

```r
library(dplyr)

mtcars |> select(-c(vs, am, gear, carb)) |> head(4)
```

### Select Helpers

These functions match columns by name patterns — no need to type every column.

```r
library(dplyr)

# starts_with()
cat("starts_with('Sepal'):\n")
iris |> select(starts_with("Sepal")) |> head(3)

# ends_with()
cat("\nends_with('Width'):\n")
iris |> select(ends_with("Width")) |> head(3)

# contains()
cat("\ncontains('pal'):\n")
iris |> select(contains("pal")) |> head(3)
```

### Select by Type with where()

```r
library(dplyr)

# Only numeric columns
iris |> select(where(is.numeric)) |> head(4)
```

```r
library(dplyr)

# Only character/factor columns
iris |> select(where(~ !is.numeric(.x))) |> head(4)
```

### Rename While Selecting

```r
library(dplyr)

mtcars |>
  select(fuel_efficiency = mpg, horsepower = hp, weight = wt) |>
  head(4)
```

### Reorder: Move Columns to Front

```r
library(dplyr)

# Move Species to the first column
iris |> select(Species, everything()) |> head(4)
```

## Combining filter and select

The real power comes from chaining filter and select in a pipeline.

```r
library(dplyr)

# Full pipeline: filter → select → arrange
mtcars |>
  filter(mpg > 20, hp > 90) |>
  select(mpg, hp, wt, gear) |>
  arrange(desc(mpg))
```

```r
library(dplyr)

# Iris: setosa species, petal measurements only, sorted
iris |>
  filter(Species == "setosa") |>
  select(starts_with("Petal")) |>
  arrange(desc(Petal.Length)) |>
  head(6)
```

## filter() vs subset() vs base R [

| Method | Syntax | Drops NA? | Pipe-friendly? |
|--------|--------|-----------|---------------|
| `filter()` | `filter(df, x > 5)` | Yes | Yes |
| `subset()` | `subset(df, x > 5)` | Yes | Awkward |
| `[` | `df[df$x > 5, ]` | No (keeps NA rows) | No |

> Use `filter()` in tidyverse workflows. Use `[` only when you need to preserve NA rows or avoid dependencies.

## Practice Exercises

### Exercise 1: Complex Filter

Find all 4-cylinder cars with above-average mpg and manual transmission (am == 1).

```r
library(dplyr)

# Hint: mean(mtcars$mpg) gives the average

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

**Explanation:** Three comma-separated conditions combine with AND. `avg_mpg` is computed outside the pipeline and used inside filter.

</details>

### Exercise 2: Select by Pattern and Type

From iris, select Species plus all columns containing "Width". Then select only numeric columns and compute their means.

```r
library(dplyr)

# Part 1: Species + Width columns
# Part 2: numeric columns → means

```

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)

cat("Species + Width columns:\n")
iris |> select(Species, contains("Width")) |> head(4)

cat("\nNumeric column means:\n")
iris |>
  select(where(is.numeric)) |>
  summarise(across(everything(), ~ round(mean(.x), 2)))
```

**Explanation:** `contains("Width")` matches any column with "Width" in its name. `where(is.numeric)` selects by column type. Both are tidy-select helpers.

</details>

### Exercise 3: Negated Filter with NA

From this dataset, keep rows where score is NOT NA and grade is NOT "F".

```r
library(dplyr)

df <- data.frame(
  name  = c("Alice", "Bob", "Carol", "David", "Eve"),
  score = c(88, NA, 72, NA, 95),
  grade = c("B", "C", "C", "F", "A"),
  stringsAsFactors = FALSE
)

```

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)

df <- data.frame(
  name  = c("Alice", "Bob", "Carol", "David", "Eve"),
  score = c(88, NA, 72, NA, 95),
  grade = c("B", "C", "C", "F", "A"),
  stringsAsFactors = FALSE
)

df |> filter(!is.na(score), grade != "F")
```

**Explanation:** `!is.na(score)` keeps non-missing scores. `grade != "F"` excludes failing grades. Both conditions are ANDed.

</details>

## Summary

| Function | Purpose | Example |
|----------|---------|---------|
| `filter(condition)` | Keep matching rows | `filter(mpg > 20)` |
| `filter(c1, c2)` | AND conditions | `filter(cyl == 4, am == 1)` |
| `filter(c1 \| c2)` | OR conditions | `filter(cyl == 4 \| cyl == 6)` |
| `filter(x %in% vals)` | Match set | `filter(cyl %in% c(4, 6))` |
| `select(cols)` | Pick columns | `select(mpg, hp)` |
| `select(-cols)` | Drop columns | `select(-c(vs, am))` |
| `starts_with("x")` | Name prefix | `select(starts_with("Sepal"))` |
| `ends_with("x")` | Name suffix | `select(ends_with("Width"))` |
| `contains("x")` | Name contains | `select(contains("ar"))` |
| `where(fn)` | By column type | `select(where(is.numeric))` |
| `everything()` | All remaining | `select(id, everything())` |

## FAQ

### What's the difference between filter() and subset()?

Functionally similar for basic use. `filter()` is faster, works with grouped data frames, supports tidy evaluation, and integrates with the pipe. Always prefer `filter()` in tidyverse code.

### Can filter() use regular expressions?

Not directly. Use `grepl("pattern", col)` or `stringr::str_detect(col, "pattern")` inside filter: `filter(str_detect(name, "^A"))`.

### How do I select columns by position number?

`select(1, 3, 5)` or `select(1:5)`. But name-based selection is safer — column positions can change if the data source is updated.

### Does filter() modify the original data frame?

No. Like all dplyr verbs, `filter()` returns a new data frame. The original is unchanged. Assign the result to save it: `result <- df |> filter(...)`.

## What's Next?

- [dplyr mutate & rename](/dplyr-mutate-rename.html) — create and modify columns
- [dplyr group_by & summarise](/dplyr-group-by-summarise.html) — aggregate data by group
- [R Joins](/R-Joins.html) — combine multiple data frames
