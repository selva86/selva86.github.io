---
title: "purrr map() for Data Wrangling: Read Files, Transform Lists & Fit Models"
slug: "purrr-map-Data-Wrangling"
description: "Apply purrr map functions to real data wrangling: read multiple files, transform list columns, fit grouped models, and safely process messy data."
keywords: "purrr data wrangling, map multiple files R, list columns purrr, purrr practical examples, split map combine"
mathjax: false
webr: true
date: "2026-03-30"
curriculum_id: "FR-dply-4"
post_type: "FR"
auto_link_terms: "purrr data wrangling|map multiple files|list columns purrr|split map combine"
auto_link_case_sensitive: false
fr_parent: "dplyr-group-by-summarise.html"
---

# purrr map() for Data Wrangling: Read Files, Transform Lists & Fit Models

<p class="lead">purrr's <code>map()</code> family shines in data wrangling: reading multiple CSV files at once, extracting stats from nested data, fitting models per group, and safely handling messy inputs. These are the patterns you'll use daily.</p>

## Pattern 1: Read and Combine Multiple Files

```r
library(purrr)
library(readr)

# Simulate 3 monthly CSV files
csv_jan <- "date,sales\n2026-01-01,100\n2026-01-02,120"
csv_feb <- "date,sales\n2026-02-01,150\n2026-02-02,130"
csv_mar <- "date,sales\n2026-03-01,170\n2026-03-02,160"

csvs <- list(jan = csv_jan, feb = csv_feb, mar = csv_mar)

# Read all, add source name, combine
combined <- imap(csvs, \(csv, name) {
  df <- read_csv(csv, show_col_types = FALSE)
  df$month <- name
  df
}) |> list_rbind()

print(combined)
```

## Pattern 2: Extract from List Columns

```r
library(purrr)
library(dplyr)

# Nested data: each row has a vector of scores
students <- tibble(
  name   = c("Alice", "Bob", "Carol"),
  scores = list(c(88, 92, 79), c(76, 81, 85), c(92, 95, 88))
)

students |>
  mutate(
    avg   = map_dbl(scores, mean),
    best  = map_dbl(scores, max),
    n     = map_int(scores, length)
  )
```

## Pattern 3: Split → Map → Combine (Model Fitting)

```r
library(purrr)
library(dplyr)

# Fit a model per cylinder group
models <- mtcars |>
  split(mtcars$cyl) |>
  map(\(df) lm(mpg ~ wt + hp, data = df))

# Extract R-squared per group
r_sq <- map_dbl(models, \(m) summary(m)$r.squared)
cat("R² per cyl group:\n")
print(round(r_sq, 3))
```

## Pattern 4: Safely Process Messy Data

```r
library(purrr)

# Some conversions will fail — safely catches errors
raw <- list("42", "3.14", "abc", "100", "xyz")

safe_num <- possibly(as.numeric, otherwise = NA)
results <- map_dbl(raw, safe_num)
cat("Parsed:", results, "\n")
cat("Success:", sum(!is.na(results)), "/", length(results), "\n")
```

## Pattern 5: Named Iteration with imap

```r
library(purrr)

quarterly <- list(Q1 = c(150,200,180), Q2 = c(250,300,275), Q3 = c(180,190,210), Q4 = c(350,400,380))

imap_chr(quarterly, \(sales, qtr) {
  sprintf("%s: total=$%d, avg=$%.0f", qtr, sum(sales), mean(sales))
}) |> walk(~ cat(.x, "\n"))
```

## Practice Exercises

### Exercise 1: Per-Species Summary

Split iris by Species, compute summary stats per group, and combine into one data frame.

```r
library(purrr)
library(dplyr)

# Use split + imap_dfr to create a summary table

```

<details><summary>Click to reveal solution</summary>

```r
library(purrr)
library(dplyr)

iris |>
  split(iris$Species) |>
  imap_dfr(\(df, species) {
    tibble(
      species  = species,
      n        = nrow(df),
      mean_sl  = round(mean(df$Sepal.Length), 2),
      sd_sl    = round(sd(df$Sepal.Length), 2)
    )
  })
```
</details>

## Summary

| Pattern | Code |
|---------|------|
| Read multiple files | `map(files, read_csv) \|> list_rbind()` |
| Extract from list col | `mutate(stat = map_dbl(col, fn))` |
| Model per group | `split(df, group) \|> map(lm_fn)` |
| Safe processing | `map(x, possibly(fn, NA))` |
| Named iteration | `imap(list, \(val, name) ...)` |

## FAQ

### When should I use map() vs a for loop?

Use `map()` when each iteration is independent and returns a value. Use a for loop when iterations depend on previous results or need break/next control flow.

### How does map() compare to lapply()?

They do the same thing. `map()` adds typed variants (`map_dbl`, `map_chr`), formula shorthand (`~ .x + 1`), and element extraction by name (`map(list, "field")`). Use `lapply()` for zero dependencies, `map()` for everything else.

## Continue Learning

- [dplyr group_by & summarise](/dplyr-group-by-summarise.html) — the parent tutorial
- [purrr map Variants](/purrr-map-Variants.html) — complete map() reference
- [R Joins](/R-Joins.html) — combine results from mapped operations
