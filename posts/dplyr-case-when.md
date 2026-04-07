---
title: "dplyr case_when(): Replace Nested if_else with Clean Conditional Logic"
slug: "dplyr-case-when"
description: "Use dplyr case_when() for clean multi-condition column creation. Replace nested ifelse() chains with readable, vectorized conditional logic in R."
keywords: "dplyr case_when, case_when R, conditional mutate, ifelse vs case_when, dplyr conditional column, multiple conditions"
mathjax: false
webr: true
date: "2026-03-30"
curriculum_id: "FR-dply-2"
post_type: "C"
auto_link_terms: "case_when|case_when()|conditional mutate|ifelse vs case_when"
auto_link_case_sensitive: false
fr_parent: "dplyr-mutate-rename.html"
sidebar_section: "Data Wrangling"
sidebar_title: "dplyr case_when()"
---

# dplyr case_when(): Replace Nested if_else with Clean Conditional Logic

<p class="lead"><code>case_when()</code> evaluates conditions top to bottom and returns the value for the first TRUE match — like SQL's CASE WHEN. It replaces ugly nested <code>ifelse()</code> chains with clean, readable code.</p>

## The Problem: Nested ifelse()

```r
# Hard to read, easy to break
scores <- c(95, 82, 67, 55, 73)
grades <- ifelse(scores >= 90, "A",
           ifelse(scores >= 80, "B",
            ifelse(scores >= 70, "C",
             ifelse(scores >= 60, "D", "F"))))
cat("Nested ifelse:", grades, "\n")
```

## case_when: The Clean Way

```r
library(dplyr)

df <- data.frame(name = c("Alice","Bob","Carol","David","Eve"),
                 score = c(95, 82, 67, 55, 73))

df |>
  mutate(grade = case_when(
    score >= 90 ~ "A",
    score >= 80 ~ "B",
    score >= 70 ~ "C",
    score >= 60 ~ "D",
    TRUE         ~ "F"
  ))
```

> Conditions are evaluated **top to bottom**. The first TRUE match wins. `TRUE` at the end is the catch-all default — like `else` in if/else.

## Multiple Columns in Conditions

```r
library(dplyr)

mtcars |>
  mutate(type = case_when(
    mpg > 25 & hp < 100  ~ "Efficient & Light",
    mpg > 25             ~ "Efficient & Powerful",
    hp > 200             ~ "Muscle Car",
    TRUE                 ~ "Standard"
  )) |>
  count(type, sort = TRUE)
```

## Handling NA

```r
library(dplyr)

df <- data.frame(x = c(1, NA, 3, NA, 5))

# case_when treats NA comparisons as FALSE (no match)
# Put is.na() check FIRST to handle NAs explicitly
df |>
  mutate(label = case_when(
    is.na(x) ~ "Missing",
    x > 3    ~ "High",
    TRUE     ~ "Low"
  ))
```

## case_when vs ifelse vs if_else

| Feature | `ifelse()` | `dplyr::if_else()` | `case_when()` |
|---------|-----------|-------------------|--------------|
| Conditions | 1 | 1 | Many |
| Type safety | No | Yes (strict) | Yes |
| Readability (nested) | Poor | OK | Excellent |
| NA handling | Returns NA type | Strict | Explicit |
| Best for | Simple binary | Type-safe binary | Multi-level |

## Practical Examples

```r
library(dplyr)

# Categorize by multiple thresholds
mtcars |>
  mutate(
    mpg_class = case_when(
      mpg > 30 ~ "Excellent",
      mpg > 25 ~ "Good",
      mpg > 20 ~ "Average",
      mpg > 15 ~ "Below Average",
      TRUE     ~ "Poor"
    ),
    size = case_when(
      wt > 4   ~ "Heavy",
      wt > 3   ~ "Medium",
      TRUE     ~ "Light"
    )
  ) |>
  count(mpg_class, size) |>
  head(10)
```

## Practice Exercises

### Exercise 1: Categorize Cars

Create a "decade" column based on mpg: >30 "Future", 20-30 "Modern", 15-20 "Standard", <15 "Vintage".

```r
library(dplyr)

```

<details><summary>Click to reveal solution</summary>

```r
library(dplyr)

mtcars |>
  mutate(decade = case_when(
    mpg > 30 ~ "Future",
    mpg > 20 ~ "Modern",
    mpg > 15 ~ "Standard",
    TRUE     ~ "Vintage"
  )) |>
  count(decade, sort = TRUE)
```
</details>

## FAQ

### What does TRUE ~ "default" mean?

`TRUE` is the catch-all — it matches any row not caught by earlier conditions. Like `else` in if/else. Always put it last. If you omit it, unmatched rows get NA.

### Can I return different types in different conditions?

No. All right-hand-side values must be the same type. `case_when(x > 0 ~ "yes", TRUE ~ 0)` fails because "yes" (character) and 0 (numeric) conflict. Use `case_when(x > 0 ~ 1, TRUE ~ 0)` or convert.

### Is case_when vectorized?

Yes. It operates on entire vectors at once — no row-by-row loop. This makes it fast, even on millions of rows.

## What's Next?

- [dplyr mutate & rename](/dplyr-mutate-rename.html) — the parent tutorial
- [dplyr across](/dplyr-across.html) — apply case_when logic across columns
- [dplyr filter & select](/dplyr-filter-select.html) — filter before transforming
