---
title: "dplyr mutate() and rename(): Create & Modify Columns (8 Examples)"
slug: "dplyr-mutate-rename"
description: "Create new columns with dplyr mutate(), modify existing ones, rename with rename(). 8 practical examples with across(), case_when(), and rename_with()."
keywords: "dplyr mutate, dplyr rename, create columns R, modify columns R, mutate across, case_when, transmute R, rename_with"
mathjax: false
webr: true
date: "2026-03-30"
curriculum_id: "1.2.4"
post_type: "C"
sidebar_text: "dplyr mutate & rename"
curriculum_path: "/data-wrangling/dplyr/"
auto_link_terms: "dplyr mutate|mutate()|rename()|create columns|modify columns"
auto_link_case_sensitive: false
---

# dplyr mutate() and rename(): Create & Modify Columns (8 Examples)

<p class="lead"><code>mutate()</code> adds new columns or modifies existing ones while keeping all other columns. <code>rename()</code> changes column names without touching data. Combined with <code>across()</code> and <code>case_when()</code>, they handle every column transformation.</p>

`filter()` and `select()` reduce your data — fewer rows, fewer columns. `mutate()` expands it — new columns computed from existing ones. It's the verb you reach for whenever you need a derived variable.

## mutate(): Add New Columns

The new column is computed row by row. All existing columns are preserved.

```r
library(dplyr)

mtcars |>
  mutate(
    kpl = round(mpg * 0.425, 2),          # kilometers per liter
    hp_per_ton = round(hp / wt, 1)        # power-to-weight ratio
  ) |>
  select(mpg, kpl, hp, wt, hp_per_ton) |>
  head(6)
```

### Modify Existing Columns

If you mutate a column that already exists, it overwrites in place.

```r
library(dplyr)

iris |>
  mutate(
    Sepal.Length = round(Sepal.Length * 10),    # convert cm to mm
    Species = toupper(as.character(Species))     # uppercase
  ) |>
  head(4)
```

### Reference Columns You Just Created

Columns are created left to right — later columns can reference earlier ones from the same mutate call.

```r
library(dplyr)

mtcars |>
  mutate(
    wt_kg = wt * 453.6,                   # convert 1000 lbs to kg
    hp_per_kg = round(hp / wt_kg, 3)      # uses wt_kg just created
  ) |>
  select(wt, wt_kg, hp, hp_per_kg) |>
  head(5)
```

## case_when(): Conditional Columns

Replace nested `ifelse()` chains with clean, readable `case_when()`. Conditions are evaluated top to bottom — the first TRUE match wins.

```r
library(dplyr)

mtcars |>
  mutate(efficiency = case_when(
    mpg >= 25 ~ "High",
    mpg >= 18 ~ "Medium",
    TRUE       ~ "Low"
  )) |>
  select(mpg, efficiency) |>
  head(8)
```

```r
library(dplyr)

# Multiple columns in conditions
mtcars |>
  mutate(category = case_when(
    mpg > 25 & hp < 100 ~ "Efficient & Light",
    mpg > 25            ~ "Efficient & Powerful",
    hp > 200            ~ "Muscle Car",
    TRUE                ~ "Standard"
  )) |>
  count(category, sort = TRUE)
```

## across(): Apply to Multiple Columns

Stop writing `mutate(col1 = round(col1), col2 = round(col2))`. Use `across()` instead.

```r
library(dplyr)

# Round all numeric columns to 1 decimal
iris |>
  mutate(across(where(is.numeric), ~ round(.x, 1))) |>
  head(4)
```

```r
library(dplyr)

# Z-score standardize specific columns, saving as new columns
mtcars |>
  mutate(across(
    c(mpg, hp, wt),
    ~ round((.x - mean(.x)) / sd(.x), 2),
    .names = "{.col}_z"
  )) |>
  select(mpg, mpg_z, hp, hp_z, wt, wt_z) |>
  head(5)
```

> `.names = "{.col}_z"` controls the output column name. `{.col}` is the original name, `{.fn}` is the function name (when using a named list of functions).

## rename(): Change Column Names

```r
library(dplyr)

# Rename specific columns: new_name = old_name
iris |>
  rename(sepal_length = Sepal.Length, sepal_width = Sepal.Width) |>
  head(3)
```

### rename_with(): Rename by Function

```r
library(dplyr)

# Convert all column names to snake_case
iris |>
  rename_with(~ tolower(gsub("\\.", "_", .x))) |>
  head(3)
```

```r
library(dplyr)

# Rename only numeric columns: add "val_" prefix
iris |>
  rename_with(~ paste0("val_", .x), where(is.numeric)) |>
  head(3)
```

## transmute(): Keep Only New Columns

`mutate()` keeps everything. `transmute()` keeps only the columns you create.

```r
library(dplyr)

mtcars |>
  transmute(
    car = rownames(mtcars),
    kpl = round(mpg * 0.425, 2),
    power_ratio = round(hp / wt, 1)
  ) |>
  head(5)
```

## Practice Exercises

### Exercise 1: BMI Calculator

Add BMI and BMI category columns to this dataset.

```r
library(dplyr)

people <- data.frame(
  name      = c("Alice", "Bob", "Carol", "David"),
  height_cm = c(165, 180, 170, 175),
  weight_kg = c(60, 85, 68, 90)
)

# BMI = weight / (height_m)^2
# Category: <18.5 Underweight, <25 Normal, <30 Overweight, else Obese

```

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)

people <- data.frame(
  name      = c("Alice", "Bob", "Carol", "David"),
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

**Explanation:** `mutate` creates `height_m` first, then uses it to compute `bmi`, then uses `bmi` in `case_when`. All in a single mutate call because columns are built left to right.

</details>

### Exercise 2: Clean Column Names

Convert all iris column names to lowercase snake_case (e.g., Sepal.Length → sepal_length).

```r
library(dplyr)

# Use rename_with with a custom function

```

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)

iris |>
  rename_with(~ tolower(gsub("\\.", "_", .x))) |>
  head(4)
```

**Explanation:** `gsub("\\.", "_", .x)` replaces dots with underscores. `tolower()` lowercases. Applied to every column by rename_with.

</details>

### Exercise 3: across with Multiple Functions

For each numeric column in iris, compute both the mean and standard deviation per Species.

```r
library(dplyr)

# Use group_by + summarise + across with a named list of functions

```

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)

iris |>
  group_by(Species) |>
  summarise(
    across(where(is.numeric),
      list(mean = ~ round(mean(.x), 2), sd = ~ round(sd(.x), 2)),
      .names = "{.col}_{.fn}"
    ),
    .groups = "drop"
  )
```

**Explanation:** A named list of functions (`list(mean = ..., sd = ...)`) creates multiple output columns per input. `.names = "{.col}_{.fn}"` produces names like `Sepal.Length_mean`, `Sepal.Length_sd`.

</details>

## Summary

| Function | Purpose | Example |
|----------|---------|---------|
| `mutate(new = expr)` | Add/modify column | `mutate(bmi = wt / ht^2)` |
| `transmute(new = expr)` | Create + drop others | `transmute(bmi = wt / ht^2)` |
| `case_when(cond ~ val)` | Conditional values | `case_when(x > 0 ~ "pos")` |
| `across(cols, fn)` | Apply to many columns | `across(where(is.numeric), round)` |
| `rename(new = old)` | Rename by name | `rename(weight = wt)` |
| `rename_with(fn)` | Rename by function | `rename_with(tolower)` |

## FAQ

### What's the difference between mutate() and transmute()?

`mutate()` keeps all existing columns plus new ones. `transmute()` keeps only the columns you explicitly create. Use `mutate()` 95% of the time.

### Can mutate() reference columns created in the same call?

Yes. Columns are created left to right: `mutate(x = a + b, y = x * 2)` works because `x` exists by the time `y` is evaluated.

### How do I mutate conditionally — different logic per group?

Use `group_by()` before `mutate()`: `df |> group_by(region) |> mutate(pct = sales / sum(sales))`. Each group's `sum(sales)` is computed independently.

### What replaced mutate_at, mutate_if, mutate_all?

`across()` replaced all three in dplyr 1.0. `mutate_if(is.numeric, round)` becomes `mutate(across(where(is.numeric), round))`. `mutate_at(vars(x, y), log)` becomes `mutate(across(c(x, y), log))`.

## What's Next?

- [dplyr group_by & summarise](/dplyr-group-by-summarise.html) — aggregate grouped data
- [dplyr filter & select](/dplyr-filter-select.html) — subset before transforming
- [dplyr case_when](/dplyr-case-when.html) — deep dive on conditional logic
