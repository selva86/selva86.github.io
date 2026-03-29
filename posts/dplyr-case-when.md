---
title: "dplyr case_when(): Replace Nested if_else with Clean Conditional Logic"
slug: "dplyr-case-when"
description: "Use dplyr case_when() for clean multi-condition column creation. Replace nested ifelse() chains with readable, vectorized conditional logic in R."
keywords: "dplyr case_when, case_when R, conditional mutate, ifelse vs case_when, dplyr conditional column"
mathjax: false
webr: true
date: "2026-03-30"
curriculum_id: "FR-dply-2"
post_type: "FR"
auto_link_terms: "case_when|case_when()|conditional mutate"
auto_link_case_sensitive: false
fr_parent: "dplyr-mutate-rename.html"
---

# dplyr case_when(): Replace Nested if_else with Clean Conditional Logic

<p class="lead"><code>case_when()</code> evaluates conditions top to bottom and returns the value for the first TRUE match. It replaces nested <code>ifelse()</code> chains with clean, readable code.</p>

## The Problem: Nested ifelse()

```r
# Ugly nested ifelse — hard to read, easy to break
x <- c(95, 82, 67, 55, 73)
ifelse(x >= 90, "A", ifelse(x >= 80, "B", ifelse(x >= 70, "C", ifelse(x >= 60, "D", "F"))))
```

## case_when(): The Clean Solution

```r
library(dplyr)

scores <- data.frame(name = c("Alice","Bob","Carol","David","Eve"), score = c(95,82,67,55,73))

scores |>
  mutate(grade = case_when(
    score >= 90 ~ "A",
    score >= 80 ~ "B",
    score >= 70 ~ "C",
    score >= 60 ~ "D",
    TRUE         ~ "F"
  ))
```

## Multiple Columns in Conditions

```r
library(dplyr)

mtcars |>
  mutate(category = case_when(
    mpg > 25 & hp < 100 ~ "Efficient & Light",
    mpg > 25             ~ "Efficient & Powerful",
    hp > 200             ~ "Muscle Car",
    TRUE                 ~ "Standard"
  )) |>
  select(mpg, hp, category) |>
  head(8)
```

## Handling NA

```r
library(dplyr)

df <- data.frame(x = c(1, NA, 3, NA, 5))

# case_when treats NA conditions as FALSE (no match)
df |> mutate(label = case_when(
  is.na(x)  ~ "Missing",
  x > 3     ~ "High",
  TRUE       ~ "Low"
))
```

## case_when vs ifelse vs if_else

| Feature | `ifelse()` | `if_else()` | `case_when()` |
|---------|-----------|------------|--------------|
| Conditions | 1 | 1 | Many |
| Type safety | No | Yes | Yes |
| Readability | Poor when nested | OK | Best |
| NA handling | Returns NA type | Strict | Explicit |

## Practice Exercises

### Exercise 1: Categorize Cars

Create an "era" column based on mpg ranges.

```r
library(dplyr)

# mpg > 30: "Modern", 20-30: "Transitional", < 20: "Classic"

```

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)

mtcars |>
  mutate(era = case_when(
    mpg > 30 ~ "Modern",
    mpg > 20 ~ "Transitional",
    TRUE     ~ "Classic"
  )) |>
  count(era)
```

</details>

## FAQ

### What does TRUE ~ "default" mean?

`TRUE` is the catch-all condition — it matches any row not caught by earlier conditions. It's like the `else` in if/else. Always put it last.

### What happens if no condition matches and there's no TRUE?

The result is `NA` for that row. This is actually useful when you only want to label specific cases and leave the rest as missing.

## What's Next?

- [dplyr mutate & rename](/dplyr-mutate-rename.html) — the parent tutorial
- [dplyr across](/dplyr-across.html) — apply case_when across multiple columns
- [dplyr filter & select](/dplyr-filter-select.html) — filter before transforming
