---
title: "Missing Data in R Exercises: 10 NA Detection & Imputation Problems — Solved Step-by-Step"
slug: "Missing-Data-in-R-Exercises"
description: "Practise missing data handling in R with 10 NA detection and imputation problems and worked solutions. Build real R skills through hands-on exercises, beginner to advanced."
keywords: "missing data exercises R, NA exercises R, is.na exercises, complete.cases practice, na.omit exercises, imputation exercises R, missing value practice problems, NA detection R"
mathjax: false
webr: true
date: "2026-04-06"
curriculum_id: "E2.6"
post_type: "EX"
sidebar_title: "Missing Data (10 problems)"
auto_link_terms: "missing data exercises|NA exercises|is.na exercises|missing value practice|NA detection exercises"
auto_link_case_sensitive: false
fr_parent: "Missing-Values-in-R-Detect-Count-Remove-Impute-NA.html"
---


# Missing Data in R Exercises: 10 NA Detection & Imputation Problems

<p class="lead">Ten hands-on exercises drill NA detection, removal, and imputation in R — from basic <code>is.na()</code> checks to grouped median imputation — run every solution in your browser.</p>

## Introduction

Reading about NA handling is one thing. Applying it under pressure with unfamiliar column names and messy patterns is another. These ten problems close that gap. Each one targets a specific missing-data skill that trips up real analysts.

You will start by counting NAs, then move to filtering incomplete rows, and finish by imputing missing values with column-level and group-level strategies using base R and dplyr. By Exercise 10 you will chain detection, reporting, imputation, and verification into one pipeline.

If `is.na()`, `complete.cases()`, and `na.omit()` are new to you, read the parent [Missing Values in R tutorial](Missing-Values-in-R-Detect-Count-Remove-Impute-NA.html) first. Otherwise, run the setup block and begin. All code runs in one shared R session. Use distinct variable names like `ans1`, `ans2` in your own attempts so you do not overwrite the tutorial datasets.

## Setup: The Datasets We Will Use

Before the exercises, we build three small tables with deliberate NA patterns. They are tiny on purpose so you can eyeball every row and verify your answers by hand. Run this block once. Every exercise after this assumes these objects exist.

The `sales` table has missing values in `revenue` and `units`. The `survey` table has NAs scattered across `age`, `score`, and `group`. The `weather_data` table has missing `temp` and `rainfall` readings.

```r
# Setup: load libraries and create three datasets with NAs
library(dplyr)
library(tidyr)

sales <- tibble(
  store   = c("East", "West", "North", "South", "East", "West"),
  month   = c("Jan", "Jan", "Jan", "Feb", "Feb", "Feb"),
  revenue = c(500, NA, 320, 410, NA, 600),
  units   = c(50, 30, NA, 41, 28, NA)
)

survey <- tibble(
  id    = 1:8,
  group = c("A", "A", "B", "B", "A", "B", "A", "B"),
  age   = c(25, NA, 34, 29, NA, 41, 22, NA),
  score = c(88, 76, NA, 91, 65, NA, 80, 73)
)

weather_data <- tibble(
  city     = c("Oslo", "Lima", "Oslo", "Lima", "Oslo"),
  month    = c("Jan", "Jan", "Feb", "Feb", "Mar"),
  temp     = c(-4, 22, NA, 24, 2),
  rainfall = c(49, NA, 35, 5, NA)
)

sales
#> # A tibble: 6 x 4
#>   store month revenue units
#>   <chr> <chr>   <dbl> <dbl>
#> 1 East  Jan       500    50
#> 2 West  Jan        NA    30
#> 3 North Jan       320    NA
#> 4 South Feb       410    41
#> 5 East  Feb        NA    28
#> 6 West  Feb       600    NA

survey
#> # A tibble: 8 x 4
#>      id group   age score
#>   <int> <chr> <dbl> <dbl>
#> 1     1 A        25    88
#> 2     2 A        NA    76
#> 3     3 B        34    NA
#> 4     4 B        29    91
#> 5     5 A        NA    65
#> 6     6 B        41    NA
#> 7     7 A        22    80
#> 8     8 B        NA    73

weather_data
#> # A tibble: 5 x 4
#>   city  month  temp rainfall
#>   <chr> <chr> <dbl>    <dbl>
#> 1 Oslo  Jan      -4       49
#> 2 Lima  Jan      22       NA
#> 3 Oslo  Feb      NA       35
#> 4 Lima  Feb      24        5
#> 5 Oslo  Mar       2       NA
```

Look at the NA positions carefully. `sales` has two NAs in `revenue` and two in `units`, but in different rows. `survey` has three NAs in `age` and two in `score`, never in the same row. `weather_data` has one NA in `temp` and two in `rainfall`.

[TIP]
**Run the setup block first, once.** Every exercise reuses `sales`, `survey`, and `weather_data`. If you reset the R session, run Setup again before continuing.

## Warm-Up: NA Detection (Exercises 1-3)

These three exercises focus on finding and counting NAs. If you get them right, you understand the detection fundamentals. Expected output values are given so you can verify.

### Exercise 1: Count the total number of NAs in a data frame

Use `is.na()` and `sum()` to count the total number of NA values in the entire `sales` table. Save the result to `ans1`. Expected: **4**.

```r
# Exercise 1: count total NAs in sales
# Hint: is.na() returns TRUE/FALSE, sum() counts TRUEs

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
ans1 <- sum(is.na(sales))
ans1
#> [1] 4
```

**Explanation:** `is.na(sales)` returns a logical matrix the same size as the data frame, with `TRUE` wherever a value is `NA`. `sum()` treats `TRUE` as 1 and `FALSE` as 0, so it counts the total NAs. The `sales` table has 4 missing values: two in `revenue` (rows 2 and 5) and two in `units` (rows 3 and 6).

</details>

### Exercise 2: Count NAs per column

Use `colSums()` with `is.na()` to count the number of NA values in each column of `survey`. Save the result to `ans2`. Expected: `id = 0, group = 0, age = 3, score = 2`.

```r
# Exercise 2: count NAs per column in survey
# Hint: colSums(is.na(...))

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
ans2 <- colSums(is.na(survey))
ans2
#> id group   age score
#>  0     0     3     2
```

**Explanation:** `is.na(survey)` produces a logical matrix. `colSums()` sums each column, giving the count of `TRUE` values per column. The `age` column has 3 NAs (rows 2, 5, 8) and `score` has 2 NAs (rows 3, 6). The `id` and `group` columns are complete.

</details>

### Exercise 3: Identify rows with any missing value

Use `complete.cases()` to find which rows in `weather_data` have no NAs. Save the complete rows to `ans3`. Expected: **2 rows** (Oslo-Jan and Lima-Feb).

```r
# Exercise 3: keep only complete rows in weather_data
# Hint: complete.cases() returns TRUE for rows with no NAs

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
ans3 <- weather_data[complete.cases(weather_data), ]
ans3
#> # A tibble: 2 x 4
#>   city  month  temp rainfall
#>   <chr> <chr> <dbl>    <dbl>
#> 1 Oslo  Jan      -4       49
#> 2 Lima  Feb      24        5
```

**Explanation:** `complete.cases(weather_data)` returns a logical vector: `TRUE` for rows with no NA in any column, `FALSE` otherwise. Subsetting with `[..., ]` keeps only the complete rows. Oslo-Jan and Lima-Feb are the only rows where both `temp` and `rainfall` are present. The other three rows each have at least one NA.

</details>

[KEY INSIGHT]
**Detection before action.** Always count and locate NAs before deciding to remove or impute. A column with 2% missing is different from one with 60% missing. Detection tells you which strategy fits.

## Core Challenges: Removal (Exercises 4-6)

Detection done. These three exercises remove rows based on different criteria. Pay attention to the difference between dropping all incomplete rows and targeting specific columns.

### Exercise 4: Remove all rows with any NA

Use `na.omit()` to remove every row that contains at least one NA from `sales`. Save to `ans4`. Expected: **2 rows**.

```r
# Exercise 4: remove all rows with NA from sales
# Hint: na.omit() drops any row with at least one NA

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
ans4 <- na.omit(sales)
ans4
#> # A tibble: 2 x 4
#>   store month revenue units
#>   <chr> <chr>   <dbl> <dbl>
#> 1 East  Jan       500    50
#> 2 South Feb       410    41
```

**Explanation:** `na.omit()` is aggressive. It drops every row with at least one NA in any column. In `sales`, rows 2 and 5 have NA in `revenue`, and rows 3 and 6 have NA in `units`. That leaves only East-Jan and South-Feb, cutting the table from 6 rows to 2. This is why targeted removal (next exercise) is often better.

</details>

### Exercise 5: Remove rows where a specific column is NA

Use `filter()` with `!is.na()` to keep only the rows of `survey` where `score` is not missing. Save to `ans5`. Expected: **6 rows**.

```r
# Exercise 5: keep rows where score is not NA
# Hint: filter(survey, !is.na(column_name))

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
ans5 <- survey |> filter(!is.na(score))
ans5
#> # A tibble: 6 x 4
#>      id group   age score
#>   <int> <chr> <dbl> <dbl>
#> 1     1 A        25    88
#> 2     2 A        NA    76
#> 3     4 B        29    91
#> 4     5 A        NA    65
#> 5     7 A        22    80
#> 6     8 B        NA    73
```

**Explanation:** `!is.na(score)` keeps rows where `score` has a value, regardless of whether other columns have NAs. Rows 3 and 6 (where `score` is NA) are dropped. Notice that rows 2, 5, and 8 stay even though their `age` is NA. This targeted approach preserves more data than `na.omit()`, which would have dropped those rows too.

</details>

### Exercise 6: Keep rows complete in selected columns only

Use `complete.cases()` on just the `temp` and `rainfall` columns of `weather_data` to keep rows where both measurements exist. Save to `ans6`. Expected: **2 rows**.

```r
# Exercise 6: complete cases for specific columns only
# Hint: complete.cases() accepts a subset of columns

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
ans6 <- weather_data |>
  filter(complete.cases(pick(temp, rainfall)))
ans6
#> # A tibble: 2 x 4
#>   city  month  temp rainfall
#>   <chr> <chr> <dbl>    <dbl>
#> 1 Oslo  Jan      -4       49
#> 2 Lima  Feb      24        5
```

**Explanation:** `pick(temp, rainfall)` selects just those two columns inside `filter()`. `complete.cases()` then checks only those columns for NAs. Rows where either `temp` or `rainfall` is NA are dropped. This gives the same result as Exercise 3 here because `city` and `month` have no NAs, but the technique matters when your data frame has dozens of columns and you only need completeness in a few.

</details>

[WARNING]
**na.omit() is a blunt instrument.** It drops rows with NA in ANY column. If you only need complete values in one or two columns for your analysis, use targeted filtering with `filter(!is.na(col))` or `complete.cases()` on selected columns. Otherwise you lose data unnecessarily.

## Advanced: Imputation (Exercises 7-10)

Removing rows wastes data. These four exercises replace NAs with computed values. You will impute with column means, column medians, group-level means, and finally build a full cleaning pipeline.

### Exercise 7: Impute NA with column mean (base R)

Replace the NA values in `sales$revenue` with the mean of the non-missing revenue values. Use base R (no dplyr). Save the modified data frame to `ans7`. Expected: the two NA revenues become **457.5**.

```r
# Exercise 7: mean imputation on sales$revenue using base R
# Hint: use is.na() to index, mean(..., na.rm = TRUE) to compute

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
ans7 <- sales
ans7$revenue[is.na(ans7$revenue)] <- mean(ans7$revenue, na.rm = TRUE)
ans7
#> # A tibble: 6 x 4
#>   store month revenue units
#>   <chr> <chr>   <dbl> <dbl>
#> 1 East  Jan     500      50
#> 2 West  Jan     457.5    30
#> 3 North Jan     320      NA
#> 4 South Feb     410      41
#> 5 East  Feb     457.5    28
#> 6 West  Feb     600      NA
```

**Explanation:** `mean(ans7$revenue, na.rm = TRUE)` computes the average of the four non-missing values: (500 + 320 + 410 + 600) / 4 = 457.5. The `is.na()` index targets only the two NA positions (rows 2 and 5) and replaces them. The `units` column is untouched. This is the simplest imputation strategy and works well when the data is roughly symmetric with few outliers.

</details>

### Exercise 8: Impute NA with column median using dplyr

Use `mutate()` with `replace()` to replace NA values in `survey$age` with the median age. Save to `ans8`. Expected: the three NA ages become **29** (the median of 22, 25, 29, 34, 41).

```r
# Exercise 8: median imputation on survey$age using dplyr
# Hint: mutate(age = replace(age, is.na(age), median(age, na.rm = TRUE)))

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
ans8 <- survey |>
  mutate(age = replace(age, is.na(age), median(age, na.rm = TRUE)))
ans8
#> # A tibble: 8 x 4
#>      id group   age score
#>   <int> <chr> <dbl> <dbl>
#> 1     1 A        25    88
#> 2     2 A        29    76
#> 3     3 B        34    NA
#> 4     4 B        29    91
#> 5     5 A        29    65
#> 6     6 B        41    NA
#> 7     7 A        22    80
#> 8     8 B        29    73
```

**Explanation:** `replace(age, is.na(age), value)` swaps every NA position with the supplied value. The median of 22, 25, 29, 34, 41 is 29 (the middle of five sorted values). The three NAs in rows 2, 5, and 8 all become 29. Median imputation is more robust than mean imputation when outliers are present because the median is not pulled by extreme values.

</details>

[TIP]
**Prefer median over mean for skewed data.** If a column has outliers (like income or house prices), mean imputation shifts every filled value toward the outlier. Median stays anchored to the centre of the distribution.

### Exercise 9: Impute NA with group-wise mean

Use `group_by()` and `mutate()` to replace NA values in `survey$score` with the mean score of each respondent's `group`. Save to `ans9`. Expected: group A mean score is 77.25 and group B mean score is 82.

```r
# Exercise 9: group-wise mean imputation on survey$score
# Hint: group_by(group) then mutate with replace and mean

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
ans9 <- survey |>
  group_by(group) |>
  mutate(score = replace(score, is.na(score), mean(score, na.rm = TRUE))) |>
  ungroup()
ans9
#> # A tibble: 8 x 4
#>      id group   age score
#>   <int> <chr> <dbl> <dbl>
#> 1     1 A        25  88.0
#> 2     2 A        NA  76.0
#> 3     3 B        34  82.0
#> 4     4 B        29  91.0
#> 5     5 A        NA  65.0
#> 6     6 B        41  82.0
#> 7     7 A        22  80.0
#> 8     8 B        NA  73.0
```

**Explanation:** Group A has scores 88, 76, 65, 80. The group A mean is (88 + 76 + 65 + 80) / 4 = 77.25. Group B has non-missing scores 91 and 73, mean = 82. Row 3 (group B, score NA) gets 82. Row 6 (group B, score NA) also gets 82. No group A score was missing, so no imputation happens there. Group-wise imputation is better than overall imputation because it respects the structure of your data. Group A respondents get filled with group A averages, not the overall mean.

</details>

### Exercise 10: Full cleaning pipeline

Build a complete cleaning pipeline for `sales`. In one dplyr chain: (1) add a column `na_count` that counts NAs per row, (2) impute `revenue` NAs with the column mean, (3) impute `units` NAs with the column median, (4) verify zero NAs remain. Save the final cleaned table to `ans10`. Expected: **6 rows, 5 columns, 0 NAs** in revenue and units.

```r
# Exercise 10: full pipeline — count, impute, verify
# Hint: rowwise na_count, then mutate with replace for each column

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
ans10 <- sales |>
  mutate(
    na_count = rowSums(is.na(pick(revenue, units))),
    revenue  = replace(revenue, is.na(revenue), mean(revenue, na.rm = TRUE)),
    units    = replace(units, is.na(units), median(units, na.rm = TRUE))
  )
ans10
#> # A tibble: 6 x 5
#>   store month revenue units na_count
#>   <chr> <chr>   <dbl> <dbl>    <dbl>
#> 1 East  Jan     500    50        0
#> 2 West  Jan     457.5  30        1
#> 3 North Jan     320    35.5      1
#> 4 South Feb     410    41        0
#> 5 East  Feb     457.5  28        1
#> 6 West  Feb     600    35.5      1

# Verify: zero NAs remaining in revenue and units
sum(is.na(ans10$revenue))
#> [1] 0
sum(is.na(ans10$units))
#> [1] 0
```

**Explanation:** The pipeline does three things in one `mutate()` call. First, `rowSums(is.na(pick(revenue, units)))` counts how many NAs each row has across the two numeric columns — this is computed before imputation so it captures the original pattern. Second, `revenue` NAs are filled with the column mean: (500 + 320 + 410 + 600) / 4 = 457.5. Third, `units` NAs are filled with the column median. The four non-missing units values sorted are 28, 30, 41, 50. The median is (30 + 41) / 2 = 35.5. The `na_count` column is a diagnostic that tells you which rows were imputed and how many values were filled.

</details>

[KEY INSIGHT]
**Always verify after imputation.** Run `sum(is.na(your_column))` after every imputation step. Silent failures happen when the replacement value is itself NA (for example, if every value in a group is missing, the group mean is NaN).

## Common Mistakes and How to Fix Them

### Mistake 1: Using == NA instead of is.na()

Bad:
```r
x <- c(1, NA, 3)
x == NA
#> [1] NA NA NA
```

Good:
```r
x <- c(1, NA, 3)
is.na(x)
#> [1] FALSE  TRUE FALSE
```

**Why it is wrong:** `NA == NA` returns `NA`, not `TRUE`. The `==` operator propagates NA because R treats NA as "unknown." Two unknowns might or might not be equal, so the comparison is also unknown. Always use `is.na()` to test for missingness.

### Mistake 2: Forgetting na.rm = TRUE in aggregation

Bad:
```r
values <- c(10, NA, 30)
mean(values)
#> [1] NA
```

Good:
```r
values <- c(10, NA, 30)
mean(values, na.rm = TRUE)
#> [1] 20
```

**Why it is wrong:** Without `na.rm = TRUE`, functions like `mean()`, `sum()`, `sd()`, and `median()` return NA if any input is NA. The default is strict on purpose so you notice the missingness. Add `na.rm = TRUE` when you have already decided that dropping NAs is appropriate for your analysis.

### Mistake 3: Imputing before understanding the missingness pattern

Bad:
```r
# Blindly fill every NA with the column mean
df <- df |> mutate(across(where(is.numeric), ~replace(.x, is.na(.x), mean(.x, na.rm = TRUE))))
```

**Why it is wrong:** If 80% of a column is NA, the mean is computed from only 20% of the data and is unreliable. If the data is not missing at random (for example, high-income respondents skip the income question), mean imputation introduces bias. Always check the proportion and pattern of missingness first with `colSums(is.na(df)) / nrow(df)`. Columns above 40-50% missing are often better dropped entirely.

## Summary

Here is a quick reference for the skill each exercise tests.

| Exercise | Skill | Key function |
|---|---|---|
| 1 | Count total NAs | `sum(is.na())` |
| 2 | Count NAs per column | `colSums(is.na())` |
| 3 | Find complete rows | `complete.cases()` |
| 4 | Remove all incomplete rows | `na.omit()` |
| 5 | Remove rows missing a specific column | `filter(!is.na())` |
| 6 | Complete cases on selected columns | `complete.cases(pick())` |
| 7 | Mean imputation (base R) | `is.na()` indexing + `mean()` |
| 8 | Median imputation (dplyr) | `mutate(replace())` |
| 9 | Group-wise mean imputation | `group_by()` + `mutate(replace())` |
| 10 | Full pipeline: detect + impute + verify | All of the above |

## FAQ

### When should I remove rows versus impute missing values?

Remove rows when the proportion of NAs is small (under 5%) and the missing values are random. Impute when you have a moderate amount of missingness (5-30%) and removal would shrink your dataset too much. If a column has more than 40-50% NAs, consider dropping the column entirely rather than imputing unreliable values.

### Does na.rm = TRUE change the original data?

No. The `na.rm` parameter only affects the current calculation. It tells `mean()`, `sum()`, or `median()` to ignore NAs while computing the result. The original vector or column is unchanged. To actually modify the data, you need assignment (`<-`) or `mutate()`.

### How do I check if imputation worked correctly?

Run `sum(is.na(column))` after imputation to confirm zero NAs remain. Also compare the mean and standard deviation before and after imputation. If the standard deviation dropped noticeably, your imputation method may be collapsing the variance (a known issue with mean imputation).

### What if an entire group has all NAs?

Group-wise imputation returns `NaN` (Not a Number) because `mean(c(NA, NA), na.rm = TRUE)` is `NaN`. Your column then has `NaN` instead of `NA`, which can cause different errors downstream. Guard against this by checking group sizes before imputing or by falling back to the overall column mean when a group mean is `NaN`.

## References

1. R Core Team — `is.na()` documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/NA.html)
2. R Core Team — `complete.cases()` documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/complete.cases.html)
3. Wickham, H. & Grolemund, G. — *R for Data Science*, 2nd Edition. Chapter 18: Missing Values. [Link](https://r4ds.hadley.nz/missing-values.html)
4. UC Business Analytics R Programming Guide — Dealing with Missing Values. [Link](https://uc-r.github.io/missing_values)
5. dplyr documentation — mutate() reference. [Link](https://dplyr.tidyverse.org/reference/mutate.html)
6. The Epidemiologist R Handbook — Missing Data chapter. [Link](https://www.epirhandbook.com/en/new_pages/missing_data.html)
7. Tierney, N. — naniar: Data Structures, Summaries, and Visualisations for Missing Data. [Link](https://naniar.njtierney.com/)

## What's Next?

Now that you can detect, remove, and impute missing values, explore these related tutorials:

- [Missing Values in R: Detect, Count, Remove & Impute NA](Missing-Values-in-R-Detect-Count-Remove-Impute-NA.html) — review the parent tutorial if any exercise stumped you
- [dplyr Exercises (15 problems)](dplyr-Exercises.html) — practise filtering, grouping, and joining on clean data
- [tidyr Reshaping Exercises (10 problems)](tidyr-Reshaping-Exercises.html) — reshape data after cleaning it
