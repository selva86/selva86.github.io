---
title: "purrr map() for Data Wrangling: Practical map, map2, imap, pmap Examples"
slug: "purrr-map-Functions"
description: "Apply purrr map functions to real data wrangling tasks: read multiple files, transform list columns, iterate model fits, and clean nested data."
keywords: "purrr map data wrangling, map multiple files R, purrr practical examples, list columns purrr"
mathjax: false
webr: true
date: "2026-03-30"
curriculum_id: "FR-dply-4"
post_type: "FR"
auto_link_terms: "purrr data wrangling|map multiple files|list columns purrr"
auto_link_case_sensitive: false
fr_parent: "dplyr-group-by-summarise.html"
---

# purrr map() for Data Wrangling: Practical map, map2, imap, pmap Examples

<p class="lead">This tutorial applies purrr's <code>map()</code> family to real data wrangling tasks: reading multiple files, transforming list columns, fitting grouped models, and cleaning nested data.</p>

## Read and Combine Multiple Datasets

```r
library(purrr)
library(readr)

# Simulate reading multiple CSV files
csv_jan <- "date,sales\n2026-01-01,100\n2026-01-02,120"
csv_feb <- "date,sales\n2026-02-01,150\n2026-02-02,130"
csv_mar <- "date,sales\n2026-03-01,170\n2026-03-02,160"

csvs <- list(jan = csv_jan, feb = csv_feb, mar = csv_mar)

# Read all at once, add source name
dfs <- imap(csvs, \(csv, name) {
  df <- read_csv(csv, show_col_types = FALSE)
  df$month <- name
  df
})

combined <- list_rbind(dfs)
print(combined)
```

## Transform List Columns

```r
library(purrr)
library(dplyr)

# Nested data: each row has a vector of scores
students <- tibble(
  name = c("Alice", "Bob", "Carol"),
  scores = list(c(88, 92, 79), c(76, 81, 85), c(92, 95, 88))
)

# Extract stats from each score vector
students |>
  mutate(
    avg = map_dbl(scores, mean),
    best = map_dbl(scores, max),
    n_tests = map_int(scores, length)
  )
```

## Fit Models Per Group

```r
library(purrr)
library(dplyr)

# Fit a linear model per cylinder group
models <- mtcars |>
  split(mtcars$cyl) |>
  map(\(df) lm(mpg ~ wt + hp, data = df))

# Extract R-squared from each model
r_sq <- map_dbl(models, \(m) summary(m)$r.squared)
cat("R-squared per cyl group:\n")
print(round(r_sq, 3))
```

## Safely Process Messy Data

```r
library(purrr)

# Some conversions will fail
raw <- list("42", "3.14", "abc", "100", "xyz")

safe_num <- possibly(as.numeric, otherwise = NA)
results <- map_dbl(raw, safe_num)
cat("Parsed:", results, "\n")
cat("Success rate:", sum(!is.na(results)), "/", length(results), "\n")
```

## map2: Two Inputs in Parallel

```r
library(purrr)

names <- c("report_jan.csv", "report_feb.csv", "report_mar.csv")
months <- c("January", "February", "March")

# Create formatted strings from paired inputs
headers <- map2_chr(names, months, \(file, month) {
  paste0("File: ", file, " | Period: ", month)
})
walk(headers, \(h) cat(h, "\n"))
```

## Practice Exercises

### Exercise 1: Summarize Nested Data

Extract summary statistics from each group's data.

```r
library(purrr)
library(dplyr)

# Split iris by Species, get summary per group
nested <- split(iris, iris$Species)

# Use map to get: n, mean Sepal.Length, sd Sepal.Length per species

```

<details>
<summary>Click to reveal solution</summary>

```r
library(purrr)
library(dplyr)

nested <- split(iris, iris$Species)

summaries <- imap_dfr(nested, \(df, species) {
  tibble(
    species = species,
    n = nrow(df),
    mean_sl = round(mean(df$Sepal.Length), 2),
    sd_sl = round(sd(df$Sepal.Length), 2)
  )
})
print(summaries)
```

</details>

## Summary

| Pattern | purrr Code |
|---------|-----------|
| Read multiple files | `map(files, read_csv) \|> list_rbind()` |
| Extract from list column | `mutate(stat = map_dbl(col, fn))` |
| Fit models per group | `split(df, group) \|> map(model_fn)` |
| Safe processing | `map(x, possibly(fn, NA))` |
| Paired iteration | `map2(x, y, fn)` |

## FAQ

### When should I use map() vs a for loop?

Use `map()` when each iteration is independent and returns a value. Use a for loop when iterations depend on each other (sequential state) or when you need to break/skip mid-iteration.

### How does map() handle errors in one element?

By default, one error stops everything. Wrap with `safely()` to capture errors, or `possibly()` to substitute a default value.

## What's Next?

- [dplyr group_by & summarise](/dplyr-group-by-summarise.html) — the parent tutorial
- [purrr map Variants](/purrr-map-Variants.html) — complete reference for all map functions
- [R Joins](/R-Joins.html) — combine data from multiple sources
