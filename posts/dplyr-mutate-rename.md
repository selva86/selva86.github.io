---
title: "dplyr mutate() and rename(): Create & Modify Columns (8 Examples)"
slug: "dplyr-mutate-rename"
description: "Create new columns with dplyr mutate(), modify existing ones, and rename columns with rename(). 8 practical examples with across() and case_when()."
keywords: "dplyr mutate, dplyr rename, create columns R, modify columns R, mutate across, transmute R"
mathjax: false
webr: true
date: "2026-03-30"
curriculum_id: "1.2.4"
post_type: "C"
sidebar_text: "dplyr mutate & rename"
curriculum_path: "/data-wrangling/dplyr/"
auto_link_terms: "dplyr mutate|mutate()|rename()|create columns"
auto_link_case_sensitive: false
---

# dplyr mutate() and rename(): Create & Modify Columns (8 Examples)

<p class="lead"><code>mutate()</code> adds new columns or modifies existing ones. <code>rename()</code> changes column names. Together with <code>across()</code>, they handle every column transformation you'll need.</p>

## mutate(): Create New Columns

```r
library(dplyr)

mtcars |>
  mutate(kpl = round(mpg * 0.425, 2),
         hp_per_ton = round(hp / wt, 1)) |>
  select(mpg, kpl, hp, wt, hp_per_ton) |>
  head(6)
```

### Modify Existing Columns

```r
library(dplyr)

iris |>
  mutate(Sepal.Length = round(Sepal.Length * 10),
         Species = toupper(Species)) |>
  head(4)
```

### Conditional Columns with case_when

```r
library(dplyr)

mtcars |>
  mutate(efficiency = case_when(
    mpg >= 25 ~ "High",
    mpg >= 18 ~ "Medium",
    TRUE ~ "Low"
  )) |>
  select(mpg, efficiency) |>
  head(8)
```

### mutate with across()

```r
library(dplyr)

# Round all numeric columns to 1 decimal
iris |>
  mutate(across(where(is.numeric), ~ round(.x, 1))) |>
  head(4)
```

```r
library(dplyr)

# Standardize (z-score) multiple columns
mtcars |>
  mutate(across(c(mpg, hp, wt), ~ round((.x - mean(.x)) / sd(.x), 2),
                .names = "{.col}_z")) |>
  select(mpg, mpg_z, hp, hp_z, wt, wt_z) |>
  head(5)
```

## rename() and rename_with()

```r
library(dplyr)

# Rename specific columns
iris |>
  rename(sepal_len = Sepal.Length, sepal_wid = Sepal.Width) |>
  head(3)
```

```r
library(dplyr)

# Rename all columns with a function
iris |>
  rename_with(tolower) |>
  rename_with(~ gsub("\\.", "_", .x)) |>
  head(3)
```

## transmute(): Keep Only New Columns

```r
library(dplyr)

# transmute = mutate + select only new columns
mtcars |>
  transmute(
    car = rownames(mtcars),
    kpl = round(mpg * 0.425, 2),
    power_to_weight = round(hp / wt, 1)
  ) |>
  head(5)
```

## Practice Exercises

### Exercise 1: BMI Calculator

Add a BMI column to this dataset.

```r
library(dplyr)

people <- data.frame(
  name = c("Alice", "Bob", "Carol", "David"),
  height_cm = c(165, 180, 170, 175),
  weight_kg = c(60, 85, 68, 90)
)

# Add bmi = weight_kg / (height_m)^2
# Add category: <18.5 Underweight, <25 Normal, <30 Overweight, else Obese

```

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)

people <- data.frame(
  name = c("Alice", "Bob", "Carol", "David"),
  height_cm = c(165, 180, 170, 175),
  weight_kg = c(60, 85, 68, 90)
)

people |>
  mutate(
    height_m = height_cm / 100,
    bmi = round(weight_kg / height_m^2, 1),
    category = case_when(
      bmi < 18.5 ~ "Underweight",
      bmi < 25   ~ "Normal",
      bmi < 30   ~ "Overweight",
      TRUE       ~ "Obese"
    )
  )
```

</details>

### Exercise 2: Clean Column Names

Convert all iris column names to snake_case.

```r
library(dplyr)

# Convert Sepal.Length -> sepal_length, etc.

```

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)

iris |>
  rename_with(~ tolower(gsub("\\.", "_", .x))) |>
  head(3)
```

**Explanation:** `gsub("\\.", "_", .x)` replaces dots with underscores, `tolower()` lowercases.

</details>

## Summary

| Function | Purpose | Example |
|----------|---------|---------|
| `mutate()` | Add/modify columns | `mutate(bmi = wt/ht^2)` |
| `transmute()` | Create + keep only new | `transmute(bmi = wt/ht^2)` |
| `rename()` | Rename by name | `rename(new = old)` |
| `rename_with()` | Rename by function | `rename_with(tolower)` |
| `across()` | Apply to multiple cols | `mutate(across(where(is.numeric), round))` |
| `case_when()` | Conditional values | `case_when(x > 0 ~ "pos", TRUE ~ "neg")` |

## FAQ

### What's the difference between mutate() and transmute()?

`mutate()` keeps all existing columns plus new ones. `transmute()` keeps only the columns you create. Use `mutate()` 95% of the time.

### Can mutate() reference columns it just created?

Yes. Columns are created left to right: `mutate(x = a + b, y = x * 2)` works because `x` exists by the time `y` is computed.

### How do I apply the same transformation to many columns?

Use `across()`: `mutate(across(c(col1, col2), ~ .x * 100))` or `mutate(across(where(is.numeric), round))`.

## What's Next?

- [dplyr group_by & summarise](/dplyr-group-by-summarise.html) — aggregate data by group
- [dplyr filter & select](/dplyr-filter-select.html) — subset rows and columns
- [dplyr case_when](/dplyr-case-when.html) — deep dive on conditional logic
