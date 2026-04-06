---
title: "Data Quality Checking in R: 10 Things to Verify Before You Analyze"
slug: "Data-Quality-Checking-in-R"
description: "Before any analysis, check dimensions, types, duplicates, missing values, ranges, and consistency. Here are 10 data quality checks in R with reusable code."
keywords: "data quality checking in R, data validation R, check data before analysis, data quality checklist R, missing values check R, duplicates in R, data types R, data range validation, data consistency R, validate package R"
auto_link_terms: "data quality checking in R|data quality checks|data validation in R|validate your data|check data quality|data quality checklist"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-06"
curriculum_id: "2.10.5"
post_type: "C"
sidebar_section: "Data Wrangling"
sidebar_title: "Data Quality Checking"
sidebar_order: 17
---


# Data Quality Checking in R: 10 Things to Verify Before You Analyze

<p class="lead">Data quality checking is the process of verifying your dataset's structure, types, values, and relationships before analysis — catching problems that would silently corrupt every downstream result.</p>

Every data analysis rests on one assumption: the data is trustworthy. Skip the quality check and you discover the broken column at 2 AM, after two days of modeling. A single mistyped column, a batch of duplicate rows, or a few impossible values can turn your regression coefficients into fiction.

## Introduction

Real datasets arrive messy. CSV exports have columns that look numeric but contain hidden text. Database dumps carry duplicate rows from a bad join. Survey data has ages of -1 and dates from the year 1900. These problems do not announce themselves. They sit quietly inside your data frame until they ruin a result you trusted.

This tutorial gives you a reusable 10-step checklist for data quality checking in R. Each check comes with runnable code you can paste into any project. We use base R and dplyr, both of which run directly in your browser here. Click Run on the first block, then work top to bottom.

![10-step data quality checklist flowing from structure checks through content validation.](screenshots/Data-Quality-Checking-in-R-checklist-flow.webp)
*Figure 1: The 10-step data quality checklist flows left to right, from structure checks through content validation.*

The ten checks fall into three groups. First, you verify structure: dimensions, column names, and data types. Second, you verify content: duplicates, missing values, numeric ranges, and categorical levels. Third, you verify relationships: cross-column consistency and derived-column accuracy. By the end, you will have a clear process that catches the vast majority of data problems before they reach your analysis.

## What should you check first — dimensions and structure?

Before looking at individual values, confirm that the data frame has the right shape. If you expected 10,000 rows and got 200, something went wrong during import. If you expected 15 columns and got 16, there is an extra column hiding a problem.

The three functions you need are `dim()`, `str()`, and `glimpse()` from dplyr. Each shows a different angle of the same structure.

Let's create a messy dataset that contains several quality problems. We will use it throughout the tutorial.

```r
library(dplyr)

# Create a messy dataset with deliberate quality issues
messy_df <- data.frame(
  id = c(1, 2, 3, 4, 5, 5, 6, 7, 8, 9),
  name = c("Alice", "Bob", "Charlie", "Diana", "Eve",
           "Eve", "Frank", "Grace", NA, "Ivy"),
  age = c(28, "thirty", 45, -3, 52, 52, 38, NA, 29, 150),
  salary = c(55000, 62000, NA, 48000, 71000,
             71000, -999, 58000, 65000, 43000),
  department = c("Sales", "Engineering", "sales", "HR",
                 "Engineering", "Engineering", "Marketing",
                 "HR", "sales", "Mktg"),
  start_date = c("2020-01-15", "2019-06-01", "2018-03-22",
                 "2023-11-01", "2017-08-14", "2017-08-14",
                 "2021-05-30", "2022-09-10", "2024-02-28",
                 "2016-07-19"),
  end_date = c(NA, NA, "2017-01-01", NA, NA,
               NA, NA, NA, NA, NA),
  stringsAsFactors = FALSE
)

dim(messy_df)
#> [1] 10  7

str(messy_df)
#> 'data.frame':	10 obs. of  7 variables:
#>  $ id        : num  1 2 3 4 5 5 6 7 8 9
#>  $ name      : chr  "Alice" "Bob" "Charlie" "Diana" ...
#>  $ age       : chr  "28" "thirty" "45" "-3" ...
#>  $ salary    : num  55000 62000 NA 48000 71000 ...
#>  $ department: chr  "Sales" "Engineering" "sales" "HR" ...
#>  $ start_date: chr  "2020-01-15" "2019-06-01" ...
#>  $ end_date  : chr  NA NA "2017-01-01" NA ...

glimpse(messy_df)
#> Rows: 10
#> Columns: 7
#> $ id         <dbl> 1, 2, 3, 4, 5, 5, 6, 7, 8, 9
#> $ name       <chr> "Alice", "Bob", "Charlie", ...
#> $ age        <chr> "28", "thirty", "45", "-3", ...
#> $ salary     <dbl> 55000, 62000, NA, 48000, 71000, ...
#> $ department <chr> "Sales", "Engineering", "sales", ...
#> $ start_date <chr> "2020-01-15", "2019-06-01", ...
#> $ end_date   <chr> NA, NA, "2017-01-01", NA, ...
```

Notice that `age` is character, not numeric. That single detail tells you something went wrong — there is a non-numeric value hiding in that column. Also notice `dim()` returns 10 rows and 7 columns. If your source promised 10 employees and 7 fields, you are on track. If not, investigate before going further.

[TIP]
**Use glimpse() instead of str() for wide data frames.** When your data has 50+ columns, `str()` floods the console. `glimpse()` from dplyr shows one column per line in a compact format that fits on screen.

**Try it:** Use `dim()` and `glimpse()` on the built-in `mtcars` dataset. How many rows and columns does it have? How many columns are numeric?

```r
# Try it: inspect mtcars structure
ex_dims <- dim(mtcars)
# your code here: use glimpse(mtcars) and count numeric columns

#> Expected: 32 rows, 11 columns, all 11 numeric
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_dims <- dim(mtcars)
print(ex_dims)
#> [1] 32 11

glimpse(mtcars)
#> Rows: 32
#> Columns: 11
#> $ mpg  <dbl> 21.0, 21.0, 22.8, ...
#> $ cyl  <dbl> 6, 6, 4, ...

# Count numeric columns
sum(sapply(mtcars, is.numeric))
#> [1] 11
```

**Explanation:** `dim()` returns a two-element vector of rows and columns. `sapply(df, is.numeric)` tests each column and `sum()` counts the TRUEs.

</details>

## Are your column types what you expect?

A column that looks numeric might be stored as character because one row contains text. R silently coerces the entire column to character when building the data frame. The `age` column in our messy dataset is a perfect example.

Use `sapply(df, class)` to get a quick overview of all column types. Then compare against what each column should be.

```r
sapply(messy_df, class)
#>         id       name        age     salary department start_date   end_date
#>  "numeric""character""character"  "numeric""character""character""character"

# age should be numeric — find the problem value
messy_df$age[!grepl("^-?[0-9.]+$", messy_df$age)]
#> [1] "thirty"

# Fix: convert age to numeric (non-numeric values become NA)
messy_df$age <- as.numeric(messy_df$age)
#> Warning: NAs introduced by coercion

# Convert date columns
messy_df$start_date <- as.Date(messy_df$start_date)
messy_df$end_date <- as.Date(messy_df$end_date)

sapply(messy_df, class)
#>         id       name        age     salary department start_date   end_date
#>  "numeric""character"  "numeric"  "numeric""character"     "Date"     "Date"
```

After conversion, `age` is numeric and both date columns are proper Date objects. The value "thirty" became NA, which is correct — we will deal with that missing value in a later check. The important thing is that the column is now the right type for calculations.

[WARNING]
**as.numeric() on a factor converts internal codes, not labels.** If you have a factor with levels "10", "20", "30", calling `as.numeric()` returns 1, 2, 3 (the internal codes). Always convert factor to character first: `as.numeric(as.character(my_factor))`.

**Try it:** Create a character vector `ex_ages <- c("25", "NA", "40", "unknown")` and convert it to numeric. How many NAs does the result have?

```r
# Try it: convert character to numeric
ex_ages <- c("25", "NA", "40", "unknown")
# your code here: convert to numeric and count NAs

#> Expected: 2 NAs (from "NA" and "unknown")
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_ages <- c("25", "NA", "40", "unknown")
ex_ages_num <- as.numeric(ex_ages)
#> Warning: NAs introduced by coercion
print(ex_ages_num)
#> [1] 25 NA 40 NA

sum(is.na(ex_ages_num))
#> [1] 2
```

**Explanation:** `as.numeric()` converts valid number strings to numbers and everything else to NA. The string "NA" is text, not the R constant `NA`, so it also becomes `NA` after conversion.

</details>

## How do you find and remove duplicate rows?

Duplicate rows inflate counts, bias averages, and break unique-key assumptions. The `duplicated()` function returns TRUE for every row that matches an earlier row. Use `sum()` to count them and `distinct()` to remove them.

In our dataset, employee 5 (Eve) appears twice — a classic sign of a faulty join or double-loaded data.

```r
# Count duplicates
sum(duplicated(messy_df))
#> [1] 1

# See which rows are duplicated
messy_df[duplicated(messy_df) | duplicated(messy_df, fromLast = TRUE), ]
#>   id name age salary  department start_date end_date
#> 5  5  Eve  52  71000 Engineering 2017-08-14     <NA>
#> 6  5  Eve  52  71000 Engineering 2017-08-14     <NA>

# Remove exact duplicates
clean_df <- distinct(messy_df)
nrow(clean_df)
#> [1] 9
```

We went from 10 rows to 9. The duplicate Eve row is gone. Note that `duplicated()` by default checks all columns for an exact match. If you want to check only certain key columns (like `id`), use `distinct(df, id, .keep_all = TRUE)`.

[KEY INSIGHT]
**Duplicates often signal a join gone wrong, not just data entry errors.** Before removing duplicates, ask why they exist. If a left join produced them, the fix is correcting the join, not deleting rows. Blindly removing duplicates can hide a bigger structural problem.

**Try it:** Create a data frame with 5 rows where 2 rows are identical. Use `sum(duplicated())` to count the duplicates.

```r
# Try it: detect duplicates
ex_df <- data.frame(
  x = c(1, 2, 3, 1, 2),
  y = c("a", "b", "c", "a", "b")
)
# your code here: count duplicates

#> Expected: 2
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_df <- data.frame(
  x = c(1, 2, 3, 1, 2),
  y = c("a", "b", "c", "a", "b")
)
sum(duplicated(ex_df))
#> [1] 2
```

**Explanation:** Rows 4 and 5 are exact copies of rows 1 and 2. `duplicated()` flags the second occurrence onward, so it returns TRUE for rows 4 and 5.

</details>

## How many missing values does each column have?

Missing values are the most common data quality issue. A column with 5% missing is manageable. A column with 80% missing is probably useless. The key is knowing the exact count and percentage before deciding what to do.

Use `colSums(is.na())` for a quick per-column count. Then compute percentages and identify columns that cross your threshold.

```r
# Count NAs per column
na_counts <- colSums(is.na(clean_df))
na_counts
#>         id       name        age     salary department start_date   end_date
#>          0          1          2          1          0          0          7

# Percent missing per column
na_pct <- round(100 * na_counts / nrow(clean_df), 1)
na_pct
#>         id       name        age     salary department start_date   end_date
#>        0.0       11.1       22.2       11.1        0.0        0.0       77.8

# Columns with more than 50% missing
names(na_pct[na_pct > 50])
#> [1] "end_date"
```

The `end_date` column is 77.8% missing. That makes sense if most employees are still active (no end date). But for analysis purposes, this column is mostly empty and may need to be dropped or handled specially. The `age` column has 22.2% missing — two values, one from the original NA and one from the "thirty" coercion.

![When a quality issue is found, the fix depends on the type of problem.](screenshots/Data-Quality-Checking-in-R-issue-decision.webp)
*Figure 2: When a quality issue is found, the fix depends on the type of problem.*

[NOTE]
**Columns above 50% missing are usually dropped, not imputed.** Imputing a column where most values are fabricated adds noise, not signal. Set a threshold (e.g., 50%) and drop columns that exceed it, unless domain knowledge justifies keeping them.

**Try it:** Write code to find which columns in `clean_df` have more than 10% missing values.

```r
# Try it: find columns with >10% missing
ex_na_pct <- round(100 * colSums(is.na(clean_df)) / nrow(clean_df), 1)
# your code here: filter for columns above 10%

#> Expected: "name", "age", "salary", "end_date"
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_na_pct <- round(100 * colSums(is.na(clean_df)) / nrow(clean_df), 1)
names(ex_na_pct[ex_na_pct > 10])
#> [1] "name"     "age"      "salary"   "end_date"
```

**Explanation:** We subset the named vector using a logical condition (`> 10`) and extract the names. Three columns plus `end_date` cross the 10% threshold.

</details>

## Are numeric values within expected ranges?

Even if a column is the right type and has no NAs, it can contain impossible values. An age of -3 is not a real age. A salary of -999 is almost certainly a sentinel value (a placeholder for missing data). Use `summary()` to quickly spot minimum and maximum values that fall outside expected ranges.

```r
# Quick range check for numeric columns
summary(clean_df[, c("age", "salary")])
#>       age            salary
#>  Min.   : -3.0   Min.   : -999
#>  1st Qu.: 28.5   1st Qu.: 48000
#>  Median : 38.0   Median : 58000
#>  Mean   : 48.4   Mean   : 47000
#>  3rd Qu.: 50.2   3rd Qu.: 65000
#>  Max.   :150.0   Max.   : 71000
#>  NA's   :2       NA's   :1

# Flag out-of-range values
range_issues <- clean_df |>
  filter(
    (age < 0 | age > 120) |
    (salary < 0)
  )
range_issues
#>   id   name age salary department start_date end_date
#> 1  4  Diana  -3  48000         HR 2023-11-01     <NA>
#> 2  6  Frank  NA   -999  Marketing 2021-05-30     <NA>
#> 3  9    Ivy 150  43000       Mktg 2016-07-19     <NA>
```

Three rows have range problems. Diana has age -3, Frank has salary -999 (a sentinel value), and Ivy has age 150. Each needs a different fix: Diana's age might be a typo, Frank's salary is clearly a coded missing value that should become NA, and Ivy's age of 150 is impossible.

Let's fix these issues.

```r
# Replace sentinel value -999 with NA
clean_df$salary[clean_df$salary == -999] <- NA

# Replace impossible ages with NA
clean_df$age[!is.na(clean_df$age) & (clean_df$age < 0 | clean_df$age > 120)] <- NA

summary(clean_df[, c("age", "salary")])
#>       age           salary
#>  Min.   :28.0   Min.   :43000
#>  1st Qu.:29.0   1st Qu.:48000
#>  Median :40.0   Median :56500
#>  Mean   :38.4   Mean   :56143
#>  3rd Qu.:48.5   3rd Qu.:63500
#>  Max.   :52.0   Max.   :71000
#>  NA's   :4      NA's   :2
```

Now all ages fall between 28 and 52, and all salaries are positive. We traded impossible values for NAs, which is the right move. An NA is honest — it says "we don't know." A value of -999 pretending to be a salary is a lie.

[WARNING]
**Negative ages and future dates are silent model killers.** A linear model will happily use age = -3 in its calculations. It will not warn you. Always check min/max of numeric columns against domain-reasonable bounds before fitting any model.

**Try it:** Use `summary()` on the `salary` column of `clean_df` and confirm the minimum is now above zero.

```r
# Try it: verify salary range is clean
# your code here: run summary on clean_df$salary

#> Expected: Min = 43000 (no negatives)
```

<details>
<summary>Click to reveal solution</summary>

```r
summary(clean_df$salary)
#>    Min. 1st Qu.  Median    Mean 3rd Qu.    Max.    NA's
#>   43000   48000   56500   56143   63500   71000       2
```

**Explanation:** After replacing -999 with NA, the minimum salary is 43000. The summary confirms no negative values remain.

</details>

## Do categorical columns contain only valid levels?

Categorical columns hide quality problems behind text. "Sales" and "sales" look identical to a human but are different values to R. "Marketing" and "Mktg" mean the same thing but create two separate groups. Use `unique()` and `table()` to see every distinct value.

```r
# Check unique values in department
sort(unique(clean_df$department))
#> [1] "Engineering" "HR"          "Marketing"   "Mktg"        "sales"
#> [6] "Sales"

# Frequency table reveals the problem
table(clean_df$department)
#> Engineering          HR   Marketing        Mktg       sales       Sales
#>           2           2           1           1           2           1
```

We have six categories where there should be four. "sales" and "Sales" need to be merged. "Mktg" is an abbreviation for "Marketing." Let's fix both.

```r
# Standardize department names
clean_df <- clean_df |>
  mutate(department = case_when(
    tolower(department) == "sales"     ~ "Sales",
    department == "Mktg"               ~ "Marketing",
    TRUE                               ~ department
  ))

table(clean_df$department)
#> Engineering          HR   Marketing       Sales
#>           2           2           2           3
```

Now four clean categories, no duplicates, no case mismatches. The `case_when()` approach is readable and extensible — you can add more rules as you discover more variations.

[TIP]
**Sort unique values alphabetically to spot near-duplicates.** When a column has 50 categories, `sort(unique(x))` places "Marketing" and "Mktg" near each other in the list, making them easy to catch visually.

**Try it:** Create a vector `ex_colors <- c("Red", "red", "RED", "Blue", "blue")` and count how many unique values exist. Then standardize them all to title case.

```r
# Try it: standardize categories
ex_colors <- c("Red", "red", "RED", "Blue", "blue")
# your code here: count unique values, then make all title case

#> Expected: 5 unique before, 2 unique after
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_colors <- c("Red", "red", "RED", "Blue", "blue")
length(unique(ex_colors))
#> [1] 5

ex_colors_clean <- tools::toTitleCase(tolower(ex_colors))
length(unique(ex_colors_clean))
#> [1] 2
```

**Explanation:** Converting to lowercase first with `tolower()` then to title case with `tools::toTitleCase()` merges all case variants into a single canonical form.

</details>

## Are cross-column relationships consistent?

Single-column checks catch most problems, but some errors only appear when you compare two columns. A start date after an end date makes no sense. A "Junior" title with a salary of 200,000 is suspicious. A derived column that does not match its formula is broken.

Our dataset has `start_date` and `end_date`. For employees who have left, the end date should be after the start date.

```r
# Check: end_date should be >= start_date (where both exist)
cross_check <- clean_df |>
  filter(!is.na(end_date)) |>
  mutate(date_ok = end_date >= start_date)

cross_check[, c("name", "start_date", "end_date", "date_ok")]
#>      name start_date   end_date date_ok
#> 1 Charlie 2018-03-22 2017-01-01   FALSE
```

Charlie's end date (2017-01-01) is before his start date (2018-03-22). Either the dates are swapped or one of them is wrong. This is the kind of error that single-column range checks would never catch — both dates are individually valid, but together they are impossible.

![The full pipeline from raw data to analysis-ready data.](screenshots/Data-Quality-Checking-in-R-dirty-to-clean.webp)
*Figure 3: The full pipeline from raw data to analysis-ready data.*

[KEY INSIGHT]
**Cross-column checks catch errors that single-column checks miss entirely.** Two columns can each pass every range and type check individually, yet be logically incompatible together. Always check date ordering, parent-child consistency, and derived-column formulas.

**Try it:** Write a check that filters rows from `clean_df` where `salary` is below 50000 but `department` is "Engineering". This kind of cross-check can flag data entry errors.

```r
# Try it: cross-column check
# your code here: find engineering employees with salary < 50000

#> Expected: filter returns rows matching both conditions
```

<details>
<summary>Click to reveal solution</summary>

```r
clean_df |>
  filter(department == "Engineering" & salary < 50000)
#> (result depends on current state of clean_df)
```

**Explanation:** Combining column conditions in `filter()` checks cross-column business rules. Flagged rows deserve manual review, not automatic removal.

</details>

## Common Mistakes and How to Fix Them

### Mistake 1: Using == to check for NA

❌ **Wrong:**
```r
x <- c(1, NA, 3)
x[x == NA]
#> [1] NA NA NA
```

**Why it is wrong:** `NA == NA` returns `NA`, not `TRUE`. The comparison spreads NA to every element, so the subset returns all NAs instead of finding the missing values.

✅ **Correct:**
```r
x <- c(1, NA, 3)
x[is.na(x)]
#> [1] NA
```

### Mistake 2: Ignoring sentinel values like -999 or "N/A"

❌ **Wrong:**
```r
salaries <- c(55000, -999, 62000, -999, 48000)
mean(salaries)
#> [1] 33000.4
```

**Why it is wrong:** The -999 values are not real salaries. They are placeholders for missing data. Including them drags the mean down to 33,000 when the real average is about 55,000.

✅ **Correct:**
```r
salaries <- c(55000, -999, 62000, -999, 48000)
salaries[salaries == -999] <- NA
mean(salaries, na.rm = TRUE)
#> [1] 55000
```

### Mistake 3: Converting types before checking for sentinel values

❌ **Wrong:**
```r
ages <- c("25", "-999", "40", "35")
ages_num <- as.numeric(ages)
mean(ages_num)
#> [1] -224.75
```

**Why it is wrong:** The sentinel value "-999" converts to -999 without warning. You lose the chance to catch it as a data quality issue.

✅ **Correct:**
```r
ages <- c("25", "-999", "40", "35")
# Check for sentinel values BEFORE converting
ages[ages == "-999"] <- NA
ages_num <- as.numeric(ages)
mean(ages_num, na.rm = TRUE)
#> [1] 33.33333
```

### Mistake 4: Removing duplicates without understanding the cause

❌ **Wrong:**
```r
# Just remove them and move on
df_clean <- distinct(raw_df)
```

**Why it is wrong:** If duplicates came from a bad left join, removing them hides the real problem. The join itself needs fixing, or you will get new duplicates next time.

✅ **Correct:**
```r
# First investigate: how many duplicates, which keys?
cat("Total duplicates:", sum(duplicated(raw_df)), "\n")
# Check if key column has duplicates
cat("Key duplicates:", sum(duplicated(raw_df$id)), "\n")
# Then decide: fix the source, or remove
```

### Mistake 5: Skipping cross-column checks

❌ **Wrong:** Checking each column individually and declaring the data clean.

**Why it is wrong:** Two columns can each be valid alone but inconsistent together. Start dates after end dates, negative profit margins with positive revenue and costs, zip codes that do not match states.

✅ **Correct:** After single-column checks, add cross-column rules specific to your domain. Date ordering, key matching, formula verification, and business rule validation catch the errors that column-level checks miss.

## Practice Exercises

### Exercise 1: Run a complete quality report

Given the built-in `airquality` dataset, produce a quality summary that shows: (a) dimensions, (b) column types, (c) NA count per column, (d) percent missing per column, and (e) min/max of each numeric column.

```r
# Exercise 1: Quality report for airquality
# Hint: combine dim(), sapply(), colSums(is.na()), and summary()

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
aq <- airquality

# (a) Dimensions
cat("Dimensions:", dim(aq), "\n")
#> Dimensions: 153 6

# (b) Column types
sapply(aq, class)
#>     Ozone   Solar.R      Wind      Temp     Month       Day
#> "integer" "integer" "numeric" "integer" "integer" "integer"

# (c) NA count per column
na_count <- colSums(is.na(aq))
na_count
#>   Ozone Solar.R    Wind    Temp   Month     Day
#>      37       7       0       0       0       0

# (d) Percent missing
round(100 * na_count / nrow(aq), 1)
#>   Ozone Solar.R    Wind    Temp   Month     Day
#>    24.2     4.6     0.0     0.0     0.0     0.0

# (e) Min/max of numeric columns
summary(aq)
#>      Ozone           Solar.R           Wind             Temp
#>  Min.   :  1.00   Min.   :  7.0   Min.   : 1.700   Min.   :56.00
#>  1st Qu.: 18.00   1st Qu.:115.8   1st Qu.: 7.400   1st Qu.:72.00
#>  Median : 31.50   Median :205.0   Median : 9.700   Median :79.00
#>  Mean   : 42.13   Mean   :185.9   Mean   : 9.958   Mean   :77.88
#>  3rd Qu.: 63.25   3rd Qu.:258.8   3rd Qu.:11.500   3rd Qu.:85.00
#>  Max.   :168.00   Max.   :334.0   Max.   :20.700   Max.   :97.00
```

**Explanation:** This exercise combines all the structure and content checks from the tutorial into a single quality report. Ozone has 24% missing values, which is substantial.

</details>

### Exercise 2: Write a reusable check_quality() function

Write a function `check_quality(df)` that takes any data frame and prints: dimensions, type mismatches (character columns that could be numeric), duplicate count, NA summary, and columns with any NAs.

```r
# Exercise 2: Reusable quality check function
# Hint: use dim(), sapply(), duplicated(), colSums(is.na())
# Test it on both messy_df and mtcars

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
check_quality <- function(df) {
  cat("=== Data Quality Report ===\n")
  cat("Dimensions:", nrow(df), "rows x", ncol(df), "cols\n\n")

  cat("Column types:\n")
  types <- sapply(df, class)
  print(types)
  cat("\n")

  cat("Duplicates:", sum(duplicated(df)), "\n\n")

  na_info <- colSums(is.na(df))
  na_pct <- round(100 * na_info / nrow(df), 1)
  cat("Missing values:\n")
  if (any(na_info > 0)) {
    for (col in names(na_info[na_info > 0])) {
      cat("  ", col, ":", na_info[col], "(", na_pct[col], "%)\n")
    }
  } else {
    cat("  None\n")
  }
  cat("\nNumeric ranges:\n")
  num_cols <- names(df)[sapply(df, is.numeric)]
  for (col in num_cols) {
    r <- range(df[[col]], na.rm = TRUE)
    cat("  ", col, ": [", r[1], ",", r[2], "]\n")
  }
}

check_quality(mtcars)
#> === Data Quality Report ===
#> Dimensions: 32 rows x 11 cols
#> ...
```

**Explanation:** The function loops through columns to build a human-readable report. It handles both numeric and non-numeric columns, reports percentages, and shows ranges for every numeric column.

</details>

### Exercise 3: Clean a messy dataset end-to-end

Starting from this raw dataset, apply all quality fixes: convert types, remove duplicates, replace sentinel values, standardize categories, and validate ranges. The final clean data frame should have no duplicates, no sentinel values, correct types, and consistent categories.

```r
# Exercise 3: End-to-end cleaning
raw <- data.frame(
  id = c(1, 2, 3, 3, 4, 5),
  score = c("85", "92", "-999", "-999", "78", "110"),
  grade = c("A", "a", "B", "B", "C", "A"),
  stringsAsFactors = FALSE
)
# Hint: fix sentinel values before converting types
# Remove duplicates, standardize grade to uppercase
# Flag scores outside 0-100

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
raw <- data.frame(
  id = c(1, 2, 3, 3, 4, 5),
  score = c("85", "92", "-999", "-999", "78", "110"),
  grade = c("A", "a", "B", "B", "C", "A"),
  stringsAsFactors = FALSE
)

# Step 1: Replace sentinel values while still character
raw$score[raw$score == "-999"] <- NA

# Step 2: Convert types
raw$score <- as.numeric(raw$score)

# Step 3: Remove duplicates
raw <- distinct(raw)

# Step 4: Standardize categories
raw$grade <- toupper(raw$grade)

# Step 5: Flag out-of-range scores
raw$score[!is.na(raw$score) & (raw$score < 0 | raw$score > 100)] <- NA

print(raw)
#>   id score grade
#> 1  1    85     A
#> 2  2    92     A
#> 3  3    NA     B
#> 4  4    78     C
#> 5  5    NA     A
```

**Explanation:** The order matters. Replace sentinels before type conversion so "-999" does not slip through as a valid number. Remove duplicates after type fixing so the comparison is accurate. Standardize categories and validate ranges last.

</details>

## Putting It All Together

Here is a complete end-to-end example that runs all 10 checks on a fresh dataset, fixes each issue, and produces a clean result. This is the template you can adapt for your own projects.

```r
# Complete data quality checking pipeline
raw_data <- data.frame(
  emp_id = c(101, 102, 103, 104, 104, 105, 106),
  name = c("Liam", "Olivia", "Noah", "Emma", "Emma",
           "Ava", NA),
  hire_date = c("2021-03-15", "2020-07-01", "bad_date",
                "2022-01-10", "2022-01-10", "2019-11-22",
                "2023-06-01"),
  dept = c("Finance", "finance", "IT", "HR", "HR",
           "IT", "Mktg"),
  rating = c(4.2, 3.8, -1, 4.5, 4.5, NA, 3.9),
  stringsAsFactors = FALSE
)

cat("=== CHECK 1: Dimensions ===\n")
cat("Rows:", nrow(raw_data), " Cols:", ncol(raw_data), "\n\n")

cat("=== CHECK 2: Column Types ===\n")
print(sapply(raw_data, class))

cat("\n=== CHECK 3: Duplicates ===\n")
cat("Duplicate rows:", sum(duplicated(raw_data)), "\n")
raw_data <- distinct(raw_data)

cat("\n=== CHECK 4: Missing Values ===\n")
print(colSums(is.na(raw_data)))

cat("\n=== CHECK 5: Type Fixes ===\n")
raw_data$hire_date <- as.Date(raw_data$hire_date)
#> Warning: NAs introduced by coercion (bad_date)

cat("\n=== CHECK 6: Range Validation ===\n")
cat("Rating range:", range(raw_data$rating, na.rm = TRUE), "\n")
raw_data$rating[!is.na(raw_data$rating) & raw_data$rating < 0] <- NA

cat("\n=== CHECK 7: Categorical Levels ===\n")
raw_data$dept <- tools::toTitleCase(tolower(raw_data$dept))
raw_data$dept[raw_data$dept == "Mktg"] <- "Marketing"
print(table(raw_data$dept))

cat("\n=== CLEAN DATA ===\n")
print(raw_data)
#>   emp_id   name  hire_date      dept rating
#> 1    101   Liam 2021-03-15   Finance    4.2
#> 2    102 Olivia 2020-07-01   Finance    3.8
#> 3    103   Noah       <NA>        It     NA
#> 4    104   Emma 2022-01-10        Hr    4.5
#> 5    105    Ava 2019-11-22        It     NA
#> 6    106   <NA> 2023-06-01 Marketing    3.9
```

This pipeline processes 7 rows through all the checks and fixes. Each step is independent enough to reorder or skip, but the sequence matters for two reasons: type conversion must happen before range checks, and sentinel values must be replaced before type conversion.

## Summary

Here is the complete 10-step checklist in one table. Bookmark this for every new dataset.

| # | Check | Key Function | When to Worry |
|---|---|---|---|
| 1 | Dimensions | `dim()`, `nrow()`, `ncol()` | Row/col count does not match source |
| 2 | Column names | `names()`, `colnames()` | Unexpected or garbled names |
| 3 | Data types | `sapply(df, class)`, `str()` | Numeric columns stored as character |
| 4 | Duplicates | `duplicated()`, `distinct()` | Any duplicate count > 0 |
| 5 | Missing values | `colSums(is.na())` | Any column > 50% missing |
| 6 | Sentinel values | Manual check for -999, "N/A", "" | Coded missingness hiding as real data |
| 7 | Numeric ranges | `summary()`, `range()` | Min or max outside domain bounds |
| 8 | Categorical levels | `unique()`, `table()` | More levels than expected |
| 9 | Cross-column rules | `filter()` with multi-column conditions | Logically impossible combinations |
| 10 | Date consistency | Date arithmetic | End before start, future dates |

Run these 10 checks before every analysis. They take five minutes and save five hours.

## FAQ

**How often should I run data quality checks?**

Every time you receive a new dataset or a new batch of existing data. Data quality is not a one-time task. Sources change, schemas evolve, and upstream systems introduce new bugs. Automate the checks into a script and run it at the start of every analysis.

**What is the difference between data validation and data cleaning?**

Validation identifies problems. Cleaning fixes them. This tutorial covers both: the checks are validation, and the fixes (replacing sentinels, converting types, removing duplicates) are cleaning. In practice, you iterate between the two.

**Should I automate data quality checks?**

Yes, especially for recurring data pipelines. Wrap the checks in a function (like the `check_quality()` function from Exercise 2) and call it at the top of every analysis script. For production pipelines, the `validate` package lets you define formal rules and flag violations automatically.

**What R packages specialize in data validation?**

The `validate` package is the most mature, letting you define rules like "age must be between 0 and 120" and check them against any data frame. The `dlookr` package generates full data quality reports. The `skimr` package provides fast summary statistics. The `janitor` package helps with name cleaning and duplicate detection.

**How do I handle data quality issues I cannot fix?**

Document them. Create a log that records which values were flagged, what the issue was, and what decision you made (keep, remove, impute, or flag for review). This documentation makes your analysis reproducible and auditable.

## References

1. R Core Team — `is.na()`, `duplicated()`, `summary()` documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/NA.html)
2. Wickham, H. & Grolemund, G. — *R for Data Science*, 2nd Edition. Chapter 18: Missing Values. [Link](https://r4ds.hadley.nz/missing-values)
3. dplyr documentation — `distinct()`, `filter()`, `case_when()`. [Link](https://dplyr.tidyverse.org/reference/distinct.html)
4. van der Loo, M. & de Jonge, E. — *Data Validation Infrastructure for R*. arXiv:1912.09759 (2019). [Link](https://arxiv.org/abs/1912.09759)
5. validate package — The Data Validation Cookbook. [Link](https://data-cleaning.github.io/validate/)
6. Peng, R.D. — *Exploratory Data Analysis with R*, Chapter 4: EDA Checklist. [Link](https://bookdown.org/rdpeng/exdata/exploratory-data-analysis-checklist.html)
7. dlookr package — Data Quality Diagnosis. [Link](https://cran.r-project.org/web/packages/dlookr/vignettes/diagonosis.html)

## What's Next?

Now that you can check and clean your data, explore these related tutorials on r-statistics.co:

- **[Missing Values in R](Missing-Values-in-R-Detect-Count-Remove-Impute-NA.html)** — deep dive into NA detection, counting, removal, and imputation strategies including mice and median replacement.
- **[Tidy Data in R](Tidy-Data-in-R.html)** — reshape messy data into analysis-ready format using pivot_longer and pivot_wider.
- **[Importing Data in R](Importing-Data-in-R.html)** — get data into R from CSV, Excel, databases, and the web, with common import pitfalls solved.
