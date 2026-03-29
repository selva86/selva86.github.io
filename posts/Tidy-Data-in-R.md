---
title: "Tidy Data in R: What It Is & Why Every Analysis Depends on Getting It Right"
slug: "Tidy-Data-in-R"
description: "Understand tidy data principles: one variable per column, one observation per row. Learn to reshape messy data with pivot_longer and pivot_wider."
keywords: "tidy data R, tidy data principles, pivot_longer, pivot_wider, wide to long R, tidyr, reshape data R"
mathjax: false
webr: true
date: "2026-03-30"
curriculum_id: "1.2.12"
post_type: "C"
sidebar_text: "Tidy Data"
curriculum_path: "/data-wrangling/tidyr/"
auto_link_terms: "tidy data|tidy data principles|wide to long"
auto_link_case_sensitive: false
---

# Tidy Data in R: What It Is & Why Every Analysis Depends on Getting It Right

<p class="lead"><strong>Tidy data</strong> means each variable is a column, each observation is a row, and each value is a cell. Most R functions — ggplot2, dplyr, statistical models — expect tidy data. Getting your data into this shape is often 80% of the work.</p>

You'll hear "tidy your data" constantly in R. It's not about cleaning typos or fixing NAs — it's about the structure. Data in the wrong shape forces you into painful workarounds. Data in the right shape makes everything downstream simple.

## The Three Rules of Tidy Data

```r
# TIDY: each variable is a column, each observation is a row
tidy <- data.frame(
  country = c("France", "France", "Germany", "Germany"),
  year = c(2020, 2021, 2020, 2021),
  population = c(67, 67.4, 83, 83.2)
)
print(tidy)
```

```r
# NOT TIDY (wide): years are spread across columns
messy_wide <- data.frame(
  country = c("France", "Germany"),
  pop_2020 = c(67, 83),
  pop_2021 = c(67.4, 83.2)
)
cat("Messy (wide):\n")
print(messy_wide)

# NOT TIDY (long with mixed variables): multiple variables in one column
messy_long <- data.frame(
  country = c("France", "France", "Germany", "Germany"),
  variable = c("population", "gdp", "population", "gdp"),
  value = c(67, 2.6, 83, 3.8)
)
cat("\nMessy (mixed variables):\n")
print(messy_long)
```

| Rule | Meaning | Violation Example |
|------|---------|------------------|
| Each variable is a column | One concept per column | Year values spread as column names |
| Each observation is a row | One unit per row | Multiple measurements in one row |
| Each value is a cell | One data point per cell | "120/80" blood pressure in one cell |

## Why Tidy Data Matters

```r
# With tidy data, ggplot2 and dplyr just work
tidy <- data.frame(
  country = c("France", "France", "Germany", "Germany", "Spain", "Spain"),
  year = c(2020, 2021, 2020, 2021, 2020, 2021),
  population = c(67, 67.4, 83, 83.2, 47, 47.3)
)

# Easy filtering
library(dplyr)
tidy |> filter(year == 2021)
```

```r
tidy <- data.frame(
  country = c("France", "France", "Germany", "Germany", "Spain", "Spain"),
  year = c(2020, 2021, 2020, 2021, 2020, 2021),
  population = c(67, 67.4, 83, 83.2, 47, 47.3)
)

# Easy grouping
library(dplyr)
tidy |> group_by(year) |> summarise(total = sum(population))
```

## pivot_longer(): Wide to Long

When values are spread across columns, use `pivot_longer()` to stack them into rows.

```r
library(tidyr)

# Wide data: each quarter is a column
sales <- data.frame(
  product = c("Laptop", "Mouse", "Keyboard"),
  Q1 = c(120, 450, 200),
  Q2 = c(150, 500, 180),
  Q3 = c(130, 480, 220),
  Q4 = c(180, 520, 250)
)
cat("Wide:\n"); print(sales)

# Pivot to long: quarter names become values in a new column
long <- pivot_longer(sales, cols = Q1:Q4, names_to = "quarter", values_to = "units")
cat("\nLong (tidy):\n"); print(long)
```

```r
library(tidyr)

# Real example with mtcars
wide <- mtcars[1:4, c("mpg", "hp", "wt")]
wide$car <- rownames(mtcars)[1:4]
cat("Wide:\n"); print(wide)

long <- pivot_longer(wide, cols = c(mpg, hp, wt),
                     names_to = "metric", values_to = "value")
cat("\nLong:\n"); print(long)
```

## pivot_wider(): Long to Wide

Sometimes you need to spread rows back into columns — for example, for a summary table or a specific visualization.

```r
library(tidyr)

# Long data
scores <- data.frame(
  student = c("Alice", "Alice", "Bob", "Bob", "Carol", "Carol"),
  subject = c("Math", "English", "Math", "English", "Math", "English"),
  score = c(92, 88, 76, 82, 95, 91)
)
cat("Long:\n"); print(scores)

# Pivot to wide: one row per student, subjects as columns
wide <- pivot_wider(scores, names_from = subject, values_from = score)
cat("\nWide:\n"); print(wide)
```

## Spotting Untidy Data

```r
# Common untidy pattern 1: column names contain values
cat("Pattern 1: Column names ARE data\n")
cat("  male_count, female_count → should be gender + count columns\n\n")

# Common untidy pattern 2: multiple variables in one column
cat("Pattern 2: Two variables in one column\n")
messy <- data.frame(
  patient = c("A", "B"),
  bp = c("120/80", "130/85")
)
print(messy)

library(tidyr)
tidy <- separate(messy, bp, into = c("systolic", "diastolic"), sep = "/", convert = TRUE)
cat("\nFixed:\n")
print(tidy)
```

```r
# Common untidy pattern 3: variables stored in rows
cat("Pattern 3: Variables as rows\n")
messy <- data.frame(
  country = c("France", "France", "Germany", "Germany"),
  metric = c("pop_millions", "gdp_trillions", "pop_millions", "gdp_trillions"),
  value = c(67, 2.6, 83, 3.8)
)
print(messy)

library(tidyr)
tidy <- pivot_wider(messy, names_from = metric, values_from = value)
cat("\nFixed:\n")
print(tidy)
```

## Practice Exercises

### Exercise 1: Reshape Weather Data

Convert this wide weather dataset to tidy (long) format.

```r
library(tidyr)

weather <- data.frame(
  city = c("NYC", "LA", "Chicago"),
  jan_temp = c(33, 58, 26),
  feb_temp = c(35, 60, 29),
  mar_temp = c(44, 62, 39)
)
print(weather)

# Make it tidy: city, month, temperature

```

<details>
<summary>Click to reveal solution</summary>

```r
library(tidyr)

weather <- data.frame(
  city = c("NYC", "LA", "Chicago"),
  jan_temp = c(33, 58, 26),
  feb_temp = c(35, 60, 29),
  mar_temp = c(44, 62, 39)
)

tidy_weather <- pivot_longer(weather, cols = -city,
                              names_to = "month", values_to = "temp_f")
# Clean month names
tidy_weather$month <- gsub("_temp", "", tidy_weather$month)
print(tidy_weather)
```

**Explanation:** `cols = -city` pivots all columns except city. The column names (jan_temp, etc.) become values in the "month" column.

</details>

### Exercise 2: Wide Summary Table

Convert this tidy dataset to a wide table showing scores per student per subject.

```r
library(tidyr)

grades <- data.frame(
  student = rep(c("Alice", "Bob", "Carol"), each = 3),
  exam = rep(c("Midterm", "Final", "Project"), 3),
  score = c(88, 92, 85, 76, 81, 79, 95, 93, 97)
)
print(grades)

# Make it wide: one row per student, exams as columns

```

<details>
<summary>Click to reveal solution</summary>

```r
library(tidyr)

grades <- data.frame(
  student = rep(c("Alice", "Bob", "Carol"), each = 3),
  exam = rep(c("Midterm", "Final", "Project"), 3),
  score = c(88, 92, 85, 76, 81, 79, 95, 93, 97)
)

wide <- pivot_wider(grades, names_from = exam, values_from = score)
print(wide)
```

**Explanation:** `pivot_wider()` takes values from one column (`score`) and spreads them across new columns named by another column (`exam`).

</details>

## Summary

| Concept | Function | Direction |
|---------|----------|-----------|
| Wide → Long | `pivot_longer()` | Column names become values |
| Long → Wide | `pivot_wider()` | Values become column names |
| Split column | `separate()` | "120/80" → systolic + diastolic |
| Combine columns | `unite()` | year + month → "2026-03" |

## FAQ

### How do I know if my data is tidy?

Ask three questions: (1) Is each variable in its own column? (2) Is each observation in its own row? (3) Is each value in its own cell? If any answer is "no," your data needs reshaping.

### When is wide format actually better?

Wide format is fine for display tables, correlation matrices, and some time series operations. Tidy (long) format is better for analysis and plotting. Convert to wide for presentation, stay long for computation.

### What's the difference between pivot_longer and gather?

`pivot_longer()` replaced `gather()` in tidyr 1.0. They do the same thing, but `pivot_longer()` has a clearer API. Use `pivot_longer()` for new code.

## What's Next?

- [pivot_longer & pivot_wider](/pivot-longer-wider.html) — deep dive with advanced examples
- [dplyr filter & select](/dplyr-filter-select.html) — manipulate your tidy data
- [Handling NA in R](/Handling-NA-in-R.html) — clean missing values in tidy data
