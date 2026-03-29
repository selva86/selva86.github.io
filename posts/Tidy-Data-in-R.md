---
title: "Tidy Data in R: What It Is & Why Every Analysis Depends on Getting It Right"
slug: "Tidy-Data-in-R"
description: "Understand tidy data principles: one variable per column, one observation per row. Reshape messy data with pivot_longer and pivot_wider in R."
keywords: "tidy data R, tidy data principles, pivot_longer, pivot_wider, wide to long R, tidyr, reshape data R, gather spread"
mathjax: false
webr: true
date: "2026-03-30"
curriculum_id: "1.2.12"
post_type: "C"
sidebar_text: "Tidy Data"
curriculum_path: "/data-wrangling/tidyr/"
auto_link_terms: "tidy data|tidy data principles|wide to long|long to wide"
auto_link_case_sensitive: false
---

# Tidy Data in R: What It Is & Why Every Analysis Depends on Getting It Right

<p class="lead"><strong>Tidy data</strong> has one variable per column, one observation per row, and one value per cell. Most R tools — ggplot2, dplyr, statistical models — assume tidy data. Getting the shape right is often 80% of the work.</p>

Look at a spreadsheet where months are spread across columns: Jan, Feb, Mar, each holding sales numbers. That's convenient for humans to read but painful for R to analyze. Tidy data would have a single "month" column and a single "sales" column — more rows, but every R function works instantly.

## The Three Rules

Here's a tidy dataset. Each variable (country, year, population) lives in its own column. Each row is one observation (one country in one year).

```r
tidy <- data.frame(
  country = c("France", "France", "Germany", "Germany"),
  year    = c(2024, 2025, 2024, 2025),
  pop_m   = c(67.0, 67.4, 83.0, 83.2)
)
print(tidy)
```

Now here's the same information stored in a messy (wide) layout. The years have become column names — a variable's values are spread across the header row.

```r
messy <- data.frame(
  country  = c("France", "Germany"),
  pop_2024 = c(67.0, 83.0),
  pop_2025 = c(67.4, 83.2)
)
cat("Messy (wide):\n")
print(messy)
cat("\nWhy is this messy? 'year' is a variable, but its values (2024, 2025)")
cat("\nare trapped inside column names instead of living in their own column.\n")
```

| Rule | Meaning | Common violation |
|------|---------|-----------------|
| Each variable is a column | One concept per column | Year values used as column names |
| Each observation is a row | One measured unit per row | Multiple measurements crammed into one row |
| Each value is a cell | One data point per cell | "120/80" storing two blood-pressure numbers |

## Why Tidy Data Matters

With tidy data, dplyr and ggplot2 just work — no gymnastics needed.

```r
library(dplyr)

tidy <- data.frame(
  country = c("France", "France", "Germany", "Germany", "Spain", "Spain"),
  year    = c(2024, 2025, 2024, 2025, 2024, 2025),
  pop_m   = c(67.0, 67.4, 83.0, 83.2, 47.0, 47.3)
)

# Filtering, grouping, and summarising are one-liners
tidy |>
  filter(year == 2025) |>
  summarise(total_pop = sum(pop_m))
```

```r
library(dplyr)

tidy <- data.frame(
  country = c("France", "France", "Germany", "Germany", "Spain", "Spain"),
  year    = c(2024, 2025, 2024, 2025, 2024, 2025),
  pop_m   = c(67.0, 67.4, 83.0, 83.2, 47.0, 47.3)
)

# Group operations are trivial
tidy |>
  group_by(year) |>
  summarise(avg_pop = round(mean(pop_m), 1), .groups = "drop")
```

Try doing either of those with the wide version — you'd need manual column selection, custom functions, or reshaping first. Tidy data removes that friction.

## pivot_longer(): Wide to Long

When variable values are spread across column names, stack them into rows with `pivot_longer()`.

```r
library(tidyr)

# Quarterly sales in wide format
sales <- data.frame(
  product = c("Laptop", "Mouse", "Keyboard"),
  Q1 = c(120, 450, 200),
  Q2 = c(150, 500, 180),
  Q3 = c(130, 480, 220),
  Q4 = c(180, 520, 250)
)
cat("Wide (messy):\n"); print(sales)

# Tidy it: quarter names → "quarter" column, values → "units" column
long <- pivot_longer(sales,
  cols      = Q1:Q4,
  names_to  = "quarter",
  values_to = "units"
)
cat("\nLong (tidy):\n"); print(long)
```

`cols = Q1:Q4` tells pivot_longer which columns to stack. Everything not selected (product) stays as an identifier column.

```r
library(tidyr)

# Remove a prefix from column names during pivot
scores <- data.frame(
  student    = c("Alice", "Bob"),
  score_2023 = c(78, 82),
  score_2024 = c(85, 88),
  score_2025 = c(91, 93)
)

pivot_longer(scores,
  cols         = starts_with("score_"),
  names_to     = "year",
  values_to    = "score",
  names_prefix = "score_",
  names_transform = list(year = as.integer)
)
```

> `names_prefix` strips the leading text. `names_transform` converts the extracted name to the right type. This avoids a separate mutate step after pivoting.

## pivot_wider(): Long to Wide

Sometimes you need the reverse — spread rows into columns for a summary table or a specific visualization.

```r
library(tidyr)

grades <- data.frame(
  student = c("Alice","Alice","Alice","Bob","Bob","Bob"),
  subject = c("Math","English","Science","Math","English","Science"),
  score   = c(92, 88, 95, 76, 82, 79)
)
cat("Long:\n"); print(grades)

wide <- pivot_wider(grades,
  names_from  = subject,
  values_from = score
)
cat("\nWide:\n"); print(wide)
```

## Five Common Messy Patterns (and How to Fix Each)

### Pattern 1: Column Names Contain Values

```r
library(tidyr)

# Messy: gender is in the column names
df <- data.frame(
  age_group = c("18-25", "26-35"),
  male      = c(120, 150),
  female    = c(130, 140)
)
cat("Messy:\n"); print(df)

pivot_longer(df, cols = c(male, female),
             names_to = "gender", values_to = "count")
```

### Pattern 2: Multiple Variables in One Column

```r
library(tidyr)

# Messy: blood pressure stores two variables in one cell
bp <- data.frame(
  patient = c("A", "B", "C"),
  bp      = c("120/80", "130/85", "118/76")
)
cat("Messy:\n"); print(bp)

separate(bp, bp, into = c("systolic", "diastolic"),
         sep = "/", convert = TRUE)
```

### Pattern 3: Variables Stored as Rows

```r
library(tidyr)

# Messy: "metric" column holds variable names
metrics <- data.frame(
  country = c("France","France","Germany","Germany"),
  metric  = c("population","gdp","population","gdp"),
  value   = c(67, 2.6, 83, 3.8)
)
cat("Messy:\n"); print(metrics)

pivot_wider(metrics, names_from = metric, values_from = value)
```

### Pattern 4: Multiple Observational Units in One Table

```r
# Messy: student info + test scores mixed together
# Fix: split into two tables linked by student_id
students <- data.frame(id = 1:3, name = c("Alice","Bob","Carol"), age = c(20,22,21))
scores   <- data.frame(student_id = c(1,1,2,2,3,3), test = c("midterm","final","midterm","final","midterm","final"), score = c(88,92,76,81,95,97))

cat("Students table:\n"); print(students)
cat("\nScores table:\n"); print(scores)
cat("\nJoin when you need both:\n")
merge(students, scores, by.x = "id", by.y = "student_id")
```

### Pattern 5: Implicit Missing Values

```r
library(tidyr)

# Messy: Product B has no February row — it's implicitly missing
sales <- data.frame(
  product = c("A","A","A","B","B"),
  month   = c("Jan","Feb","Mar","Jan","Mar"),
  revenue = c(100, 120, 110, 200, 180)
)
cat("Implicit NA (B-Feb missing):\n"); print(sales)

# Make it explicit
complete(sales, product, month, fill = list(revenue = 0))
```

## Round-Trip: Wide → Long → Wide

A good test of understanding: pivot to long, then back to wide, and verify the data is unchanged.

```r
library(tidyr)

original <- data.frame(
  city = c("NYC", "LA", "Chicago"),
  jan  = c(33, 58, 26),
  feb  = c(35, 60, 29),
  mar  = c(44, 62, 39)
)

long <- pivot_longer(original, cols = -city,
                     names_to = "month", values_to = "temp")
back_to_wide <- pivot_wider(long, names_from = month, values_from = temp)

cat("Original:\n"); print(original)
cat("\nRound-tripped:\n"); print(back_to_wide)
cat("\nIdentical:", all.equal(original, as.data.frame(back_to_wide)), "\n")
```

## Practice Exercises

### Exercise 1: Reshape Weather Data

Convert this wide weather table to tidy (long) format with columns: city, month, temperature.

```r
library(tidyr)

weather <- data.frame(
  city     = c("NYC", "LA", "Chicago"),
  jan_temp = c(33, 58, 26),
  feb_temp = c(35, 60, 29),
  mar_temp = c(44, 62, 39)
)

# Reshape to long format
# Hint: use names_prefix to strip "_temp"

```

<details>
<summary>Click to reveal solution</summary>

```r
library(tidyr)

weather <- data.frame(
  city     = c("NYC", "LA", "Chicago"),
  jan_temp = c(33, 58, 26),
  feb_temp = c(35, 60, 29),
  mar_temp = c(44, 62, 39)
)

pivot_longer(weather, cols = -city,
             names_to = "month", values_to = "temperature",
             names_prefix = "_temp") |>
  print()

# Alternative: clean names after
pivot_longer(weather, cols = -city,
             names_to = "month", values_to = "temperature") |>
  dplyr::mutate(month = gsub("_temp$", "", month))
```

**Explanation:** `cols = -city` pivots all columns except city. `names_prefix` strips the suffix from column names so you get clean month labels.

</details>

### Exercise 2: Wide Summary Table

Create a wide crosstab from this tidy exam data.

```r
library(tidyr)

exams <- data.frame(
  student = rep(c("Alice", "Bob", "Carol"), each = 3),
  exam    = rep(c("Midterm", "Final", "Project"), 3),
  score   = c(88, 92, 85, 76, 81, 79, 95, 93, 97)
)

# Pivot to wide: one row per student, exams as columns

```

<details>
<summary>Click to reveal solution</summary>

```r
library(tidyr)

exams <- data.frame(
  student = rep(c("Alice", "Bob", "Carol"), each = 3),
  exam    = rep(c("Midterm", "Final", "Project"), 3),
  score   = c(88, 92, 85, 76, 81, 79, 95, 93, 97)
)

pivot_wider(exams, names_from = exam, values_from = score)
```

**Explanation:** `names_from` tells R which column's values become new column names. `values_from` tells it where the cell values come from.

</details>

### Exercise 3: Fix Mixed-Variable Column

Separate this messy "stat" column into proper tidy format.

```r
library(tidyr)

messy <- data.frame(
  country = c("France","France","Germany","Germany"),
  stat    = c("pop_millions","area_km2","pop_millions","area_km2"),
  value   = c(67, 551695, 83, 357022)
)

# Convert so "pop_millions" and "area_km2" are separate columns

```

<details>
<summary>Click to reveal solution</summary>

```r
library(tidyr)

messy <- data.frame(
  country = c("France","France","Germany","Germany"),
  stat    = c("pop_millions","area_km2","pop_millions","area_km2"),
  value   = c(67, 551695, 83, 357022)
)

pivot_wider(messy, names_from = stat, values_from = value)
```

**Explanation:** When variables are stored as rows (stat column holds "pop_millions" and "area_km2"), `pivot_wider` turns each unique value into its own column.

</details>

## Summary

| Concept | Function | Direction |
|---------|----------|-----------|
| Wide → Long | `pivot_longer(cols, names_to, values_to)` | Column names become values in a new column |
| Long → Wide | `pivot_wider(names_from, values_from)` | Row values become new column names |
| Split one column | `separate(col, into, sep)` | "120/80" → systolic + diastolic |
| Combine columns | `unite(col, ..., sep)` | year + month → "2026-03" |
| Fill implicit NAs | `complete(vars, fill)` | Add missing combinations |

## FAQ

### How do I know if my data is tidy?

Ask three questions: (1) Is each variable in its own column? (2) Is each observation in its own row? (3) Is each value in its own cell? If any answer is "no," you need reshaping.

### When is wide format actually better?

Wide format is fine for display tables, correlation matrices, and some time series operations. Use tidy (long) format for analysis and plotting. Convert to wide only for final presentation.

### What replaced gather() and spread()?

`pivot_longer()` replaced `gather()` and `pivot_wider()` replaced `spread()` in tidyr 1.0 (2019). The new functions have a clearer API and handle more edge cases. Use them for all new code.

### Does pivot_longer always increase the number of rows?

Yes. It trades columns for rows. If you pivot 4 quarter columns, each original row becomes 4 rows. The total data is the same — just reshaped.

## What's Next?

- [Importing Data in R](/Importing-Data-in-R.html) — load data before tidying it
- [dplyr filter & select](/dplyr-filter-select.html) — manipulate your tidy data
- [Handling NA in R](/Handling-NA-in-R.html) — clean missing values after reshaping
