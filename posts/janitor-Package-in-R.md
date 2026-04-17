---
title: "janitor Package in R: Clean Messy Data with 5 Lines of Code"
slug: "janitor-Package-in-R"
description: "janitor's clean_names(), tabyl(), and remove_empty() fix the messiest spreadsheet exports in 5 lines. Learn the full toolkit with before-and-after examples."
keywords: "janitor R, clean_names R, tabyl, remove_empty R, janitor package, data cleaning R, clean column names R, get_dupes, adorn_totals, row_to_names"
mathjax: false
webr: true
date: "2026-04-06"
curriculum_id: "FR-clea-1"
post_type: "C"
auto_link_terms: "janitor package|janitor|clean_names()|tabyl()|remove_empty()|get_dupes()|row_to_names()"
auto_link_case_sensitive: true
fr_parent: "Data-Quality-Checking-in-R.html"
sidebar_section: "Data Wrangling"
sidebar_title: "janitor Package"
difficulty: "Intermediate"
---

# janitor Package in R: Clean Messy Data with 5 Lines of Code

<p class="lead">The <code>janitor</code> package provides simple functions like <code>clean_names()</code>, <code>tabyl()</code>, and <code>remove_empty()</code> that fix the messiest spreadsheet exports in just a few lines of R code.</p>

## Introduction

Spreadsheet exports are messy. Column names arrive with spaces, special characters, and inconsistent capitalization. Rows that looked fine in Excel turn out to be blank padding. Duplicate records hide in plain sight. If you have ever spent 30 minutes wrestling a CSV into shape before the real analysis begins, janitor is for you.

The janitor package is a lightweight CRAN package built specifically for the dirty work of data cleaning. It gives you a small toolkit of focused functions, each solving one common headache. Instead of writing five lines of base R regex to fix column names, you call `clean_names()`. Instead of manually scanning for duplicates, you call `get_dupes()`.

In this tutorial, you will learn how to use the five most important janitor functions: `clean_names()`, `remove_empty()`, `get_dupes()`, `tabyl()`, and `row_to_names()`. Every code block runs directly in your browser, so you can experiment as you read. By the end, you will clean a messy dataset from scratch in five lines.

## How Does clean_names() Fix Column Names?

Messy column names are the single most common data quality issue. Spreadsheet authors use spaces, mix upper and lower case, and sprinkle in special characters. R can handle these names, but only if you wrap every reference in backticks. That slows you down and invites typos.

`clean_names()` converts all column names to a consistent format. The default is snake_case: all lowercase, words separated by underscores, special characters removed.

Let's create a data frame with intentionally ugly column names and clean them.

```r title="cleannames fixes messy headers"
library(janitor)
library(dplyr)

# Messy column names from a spreadsheet export
messy_df <- data.frame(
  `First Name` = c("Alice", "Bob", "Carol"),
  `Last  Name` = c("Smith", "Jones", "Lee"),
  `Annual Income ($)` = c(72000, 85000, 64000),
  `% Raise` = c(3.5, 2.8, 4.1),
  check.names = FALSE
)

cat("Before:\n")
names(messy_df)
#> [1] "First Name"         "Last  Name"         "Annual Income ($)"  "% Raise"

clean_df <- clean_names(messy_df)
cat("\nAfter:\n")
names(clean_df)
#> [1] "first_name"         "last_name"          "annual_income"      "percent_raise"
```

Every space became an underscore. The dollar sign and percent symbol were converted to readable words. Double spaces collapsed into single separators. Now you can type `clean_df$first_name` instead of `` messy_df$`First Name` ``.

The `case` argument controls the naming convention. Here are the most useful options.

```r title="Case style options for cleannames"
# Different case styles
names(clean_names(messy_df, case = "lower_camel"))
#> [1] "firstName"      "lastName"       "annualIncome"   "percentRaise"

names(clean_names(messy_df, case = "upper_camel"))
#> [1] "FirstName"      "LastName"       "AnnualIncome"   "PercentRaise"

names(clean_names(messy_df, case = "screaming_snake"))
#> [1] "FIRST_NAME"      "LAST_NAME"       "ANNUAL_INCOME"   "PERCENT_RAISE"
```

Most R users stick with the default `snake_case`, which matches tidyverse conventions. Use `lower_camel` if your project follows JavaScript-style naming.

[TIP]
**Call clean_names() immediately after reading any file.** Add it to your import pipeline as a habit: `df <- read_csv("data.csv") |> clean_names()`. This prevents column-name bugs before they start.

**Try it:** Create a data frame with three columns named `"Employee ID"`, `"Start Date!"`, and `"Salary (USD)"`. Clean the names and print them.

```r title="Exercise: Clean three column names"
# Try it: clean these column names
ex_messy <- data.frame(
  `Employee ID` = 1:3,
  `Start Date!` = c("2024-01-15", "2024-03-01", "2024-06-10"),
  `Salary (USD)` = c(55000, 62000, 71000),
  check.names = FALSE
)

# your code here

#> Expected: "employee_id" "start_date" "salary_usd"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Clean column names solution"
ex_messy <- data.frame(
  `Employee ID` = 1:3,
  `Start Date!` = c("2024-01-15", "2024-03-01", "2024-06-10"),
  `Salary (USD)` = c(55000, 62000, 71000),
  check.names = FALSE
)

ex_clean <- clean_names(ex_messy)
names(ex_clean)
#> [1] "employee_id" "start_date"  "salary_usd"
```

**Explanation:** `clean_names()` strips the exclamation mark, converts parentheses and spaces to underscores, and lowercases everything.

</details>

## How Do You Remove Empty Rows and Columns?

Spreadsheet users love blank rows for visual spacing and blank columns for alignment. When you import that file into R, those blanks become rows and columns full of `NA` values. They add noise to every summary statistic and break many functions.

`remove_empty()` strips rows and columns that are entirely `NA`. You control which dimension to clean with the `which` argument.

```r title="removeempty drops blank rows and columns"
# Data with empty rows and columns
sparse_df <- data.frame(
  name   = c("Alice", NA, "Carol", NA),
  score  = c(88, NA, 91, NA),
  empty1 = c(NA, NA, NA, NA),
  grade  = c("A", NA, "A-", NA),
  empty2 = c(NA, NA, NA, NA)
)

cat("Before:", nrow(sparse_df), "rows,", ncol(sparse_df), "cols\n")
#> Before: 4 rows, 5 cols

cleaned_sparse <- sparse_df |>
  remove_empty(which = c("rows", "cols"))

cat("After:", nrow(cleaned_sparse), "rows,", ncol(cleaned_sparse), "cols\n")
#> After: 2 rows, 3 cols

cleaned_sparse
#>    name score grade
#> 1 Alice    88     A
#> 3 Carol    91    A-
```

Two all-NA rows and two all-NA columns disappeared. The data that matters stayed intact.

A related function, `remove_constant()`, drops columns where every value is the same. These columns carry zero information.

```r title="removeconstant drops constant columns"
# Add a constant column
sparse_df$region <- "North"

# remove_constant drops it
sparse_df |>
  remove_empty(which = c("rows", "cols")) |>
  remove_constant() |>
  names()
#> [1] "name"  "score" "grade"
```

The `region` column had "North" in every row, so `remove_constant()` dropped it.

[WARNING]
**Empty strings are not the same as NA.** A column filled with `""` is not considered empty by `remove_empty()`. Convert empty strings to `NA` first with `dplyr::na_if(x, "")` or `mutate(across(where(is.character), ~na_if(.x, "")))`.

**Try it:** Create a 4-row data frame where rows 2 and 4 are all `NA` and one column is entirely `NA`. Remove the empty rows and columns.

```r title="Exercise: Remove empty rows and columns"
# Try it: remove empty rows and columns
ex_sparse <- data.frame(
  id    = c(1, NA, 3, NA),
  value = c(10, NA, 30, NA),
  blank = c(NA, NA, NA, NA)
)

# your code here

#> Expected: 2 rows, 2 cols (id and value only)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Remove empty solution"
ex_sparse <- data.frame(
  id    = c(1, NA, 3, NA),
  value = c(10, NA, 30, NA),
  blank = c(NA, NA, NA, NA)
)

ex_result <- remove_empty(ex_sparse, which = c("rows", "cols"))
cat("Rows:", nrow(ex_result), "Cols:", ncol(ex_result), "\n")
#> Rows: 2 Cols: 2
ex_result
#>   id value
#> 1  1    10
#> 3  3    30
```

**Explanation:** `remove_empty()` with `which = c("rows", "cols")` strips both dimensions in one call.

</details>

## How Does get_dupes() Find Duplicate Records?

Duplicate records corrupt aggregations, inflate counts, and break joins. Base R's `duplicated()` returns a logical vector, which is useful but limited. You still need extra steps to see the actual duplicate rows and understand why they matched.

`get_dupes()` returns a data frame of the duplicate rows along with a `dupe_count` column showing how many times each combination appears. You specify which columns to check.

```r title="getdupes surfaces duplicate rows"
# Customer data with duplicates
customers <- data.frame(
  name  = c("Alice", "Bob", "Alice", "Carol", "Bob", "Bob"),
  email = c("a@co.com", "b@co.com", "a@co.com", "c@co.com", "b@co.com", "b2@co.com"),
  city  = c("NYC", "LA", "NYC", "NYC", "LA", "LA")
)

# Find duplicates by name
dupes <- get_dupes(customers, name)
dupes
#>    name dupe_count    email city
#> 1 Alice          2 a@co.com  NYC
#> 2 Alice          2 a@co.com  NYC
#> 3   Bob          3 b@co.com   LA
#> 4   Bob          3 b@co.com   LA
#> 5   Bob          3 b2@co.com  LA
```

Alice appears twice and Bob appears three times. The `dupe_count` column tells you the frequency instantly. Notice that Bob's third record has a different email, so checking by `name` and `email` together would separate it.

```r title="Duplicate check across name and email"
# Narrow the duplicate check to name + email
get_dupes(customers, name, email)
#>    name    email dupe_count city
#> 1 Alice a@co.com          2  NYC
#> 2 Alice a@co.com          2  NYC
#> 3   Bob b@co.com          2   LA
#> 4   Bob b@co.com          2   LA
```

Now Bob's `b2@co.com` record is excluded because the name-email combination is unique.

[KEY INSIGHT]
**get_dupes() shows you the duplicates, not just flags them.** Base R's `duplicated()` returns TRUE/FALSE, so you need extra filtering to inspect the actual rows. `get_dupes()` does the filtering and counting in one step, making it faster to diagnose the problem.

**Try it:** Create a data frame of 5 orders where order_id 101 appears twice and order_id 103 appears twice. Use `get_dupes()` to find them.

```r title="Exercise: Find duplicate orders"
# Try it: find duplicate orders
ex_orders <- data.frame(
  order_id = c(101, 102, 101, 103, 103),
  product  = c("Widget", "Gadget", "Widget", "Gizmo", "Gizmo"),
  amount   = c(25, 50, 25, 30, 30)
)

# your code here

#> Expected: 4 rows with dupe_count = 2 for both order_ids
```

<details>
<summary>Click to reveal solution</summary>

```r title="Duplicate orders solution"
ex_orders <- data.frame(
  order_id = c(101, 102, 101, 103, 103),
  product  = c("Widget", "Gadget", "Widget", "Gizmo", "Gizmo"),
  amount   = c(25, 50, 25, 30, 30)
)

get_dupes(ex_orders, order_id)
#>   order_id dupe_count product amount
#> 1      101          2  Widget     25
#> 2      101          2  Widget     25
#> 3      103          2   Gizmo     30
#> 4      103          2   Gizmo     30
```

**Explanation:** Passing `order_id` to `get_dupes()` groups by that column and returns only rows where the count exceeds 1.

</details>

## How Does tabyl() Replace table() for Frequency Tables?

Base R's `table()` returns an array object that is awkward to manipulate. You cannot easily pipe it into dplyr, add percentage columns, or export it to a report. The result looks cluttered in the console and lacks percentage breakdowns.

`tabyl()` returns a proper data frame with counts, percentages, and valid percentages (excluding NAs). It plugs directly into tidyverse pipelines and pairs with a suite of `adorn_*` functions for formatting.

Let's compare the two approaches on the `mtcars` dataset.

```r title="tabyl versus base table output"
# Base R table() -- returns an array
table(mtcars$cyl)
#>  4  6  8
#> 11  7 14

# janitor tabyl() -- returns a data frame with percentages
tabyl(mtcars, cyl)
#>  cyl  n   percent
#>    4 11 0.3437500
#>    6  7 0.2187500
#>    8 14 0.4375000
```

The `tabyl()` output is already a data frame. You get counts and percentages without any extra work.

For two-way cross-tabulations, `tabyl()` accepts two variables. The `adorn_*` functions then layer on totals, percentage formatting, and combined count-percent displays.

```r title="Two-way tabyl with adorn chain"
# Two-way cross-tabulation with full adornment
cross_tab <- mtcars |>
  tabyl(cyl, am) |>
  adorn_totals("row") |>
  adorn_percentages("row") |>
  adorn_pct_formatting(digits = 1) |>
  adorn_ns() |>
  adorn_title("combined")

cross_tab
#>        cyl/am        0         1
#>             4 27.3% (3) 72.7% (8)
#>             6 57.1% (4) 42.9% (3)
#>             8 85.7% (12) 14.3% (2)
#>         Total 59.4% (19) 40.6% (13)
```

In five lines, you built a publication-ready cross-tabulation with row percentages, raw counts in parentheses, a total row, and a combined header. Try replicating that with base R's `table()` and `prop.table()`.

[TIP]
**Chain adorn_* functions to build formatted tables in one pipeline.** The order matters: call `adorn_totals()` before `adorn_percentages()`, because totals should be computed on raw counts. Then format percentages, append counts with `adorn_ns()`, and finish with `adorn_title()`.

**Try it:** Create a one-way frequency table of `mtcars$gear`, then add a total row and format percentages to one decimal place.

```r title="Exercise: Gear frequency table"
# Try it: frequency table of gear with totals and formatted %
# Hint: tabyl() |> adorn_totals() |> adorn_pct_formatting()

# your code here

#> Expected: 4 rows (3 gear values + Total), formatted percentages
```

<details>
<summary>Click to reveal solution</summary>

```r title="Gear frequency solution"
ex_tab <- mtcars |>
  tabyl(gear) |>
  adorn_totals("row") |>
  adorn_pct_formatting(digits = 1)

ex_tab
#>   gear  n percent valid_percent
#>      3 15   46.9%         46.9%
#>      4 12   37.5%         37.5%
#>      5  5   15.6%         15.6%
#>  Total 32  100.0%        100.0%
```

**Explanation:** `adorn_totals("row")` adds a sum row, and `adorn_pct_formatting()` converts decimal proportions to readable percentages.

</details>

## How Does row_to_names() Fix Header-Less Spreadsheets?

Some Excel exports bury the real column headers in row 2, 3, or even deeper. The first rows contain merged title cells or metadata that R reads as data. You end up with column names like `X1`, `X2`, `X3` and actual headers sitting inside the data frame.

`row_to_names()` promotes any row to become the column names, then optionally removes the rows above it.

```r title="rowtonames promotes a header row"
# Simulating a messy Excel import where row 2 has real headers
raw_excel <- data.frame(
  X1 = c("Report: Q4 Sales", "Region", "North", "South", "East"),
  X2 = c("Generated: 2024-01-15", "Revenue", "120000", "95000", "88000"),
  X3 = c(NA, "Units", "450", "380", "320"),
  stringsAsFactors = FALSE
)

cat("Before:\n")
raw_excel
#>                    X1                    X2    X3
#> 1 Report: Q4 Sales    Generated: 2024-01-15  <NA>
#> 2            Region                 Revenue Units
#> 3             North                  120000   450
#> 4             South                   95000   380
#> 5              East                   88000   320

# Promote row 2 to column names
fixed_excel <- raw_excel |>
  row_to_names(row_number = 2)

cat("\nAfter:\n")
fixed_excel
#>   Region Revenue Units
#> 3  North  120000   450
#> 4  South   95000   380
#> 5   East   88000   320
```

Row 1 (the report metadata) and row 2 (now the header) were both removed. The data starts clean from row 3 onward.

Another common spreadsheet headache is Excel date serial numbers. When a date column reads as `45292` instead of `2024-01-15`, `excel_numeric_to_date()` converts it back.

```r title="Convert Excel date serial numbers"
# Excel stores dates as days since 1899-12-30
serial_dates <- c(45292, 45323, 45354)

excel_numeric_to_date(serial_dates)
#> [1] "2024-01-15" "2024-02-15" "2024-03-16"
```

The serial number 45292 corresponds to January 15, 2024. This function handles the quirky Excel date origin automatically.

[NOTE]
**row_to_names() deletes everything above the header row by default.** If you need to keep those rows for logging or metadata, set `remove_rows_above = FALSE`. The promoted row itself is always removed from the data.

**Try it:** Create a data frame where row 3 contains the real headers (`"City"`, `"Population"`, `"Area"`). Use `row_to_names()` to fix it.

```r title="Exercise: Promote row three to names"
# Try it: promote row 3 to column names
ex_raw <- data.frame(
  X1 = c("Country Report", "Date: 2024", "City", "London", "Paris"),
  X2 = c(NA, NA, "Population", "8900000", "2100000"),
  X3 = c(NA, NA, "Area", "1572", "105"),
  stringsAsFactors = FALSE
)

# your code here

#> Expected: 2 data rows with columns City, Population, Area
```

<details>
<summary>Click to reveal solution</summary>

```r title="Promote row three solution"
ex_raw <- data.frame(
  X1 = c("Country Report", "Date: 2024", "City", "London", "Paris"),
  X2 = c(NA, NA, "Population", "8900000", "2100000"),
  X3 = c(NA, NA, "Area", "1572", "105"),
  stringsAsFactors = FALSE
)

ex_fixed <- row_to_names(ex_raw, row_number = 3)
ex_fixed
#>     City Population Area
#> 4 London    8900000 1572
#> 5  Paris    2100000  105
```

**Explanation:** `row_to_names(row_number = 3)` promotes the third row to column names and removes everything above it.

</details>

## Common Mistakes and How to Fix Them

### Mistake 1: Forgetting to reassign after clean_names()

❌ **Wrong:**
```r title="Mistake: cleannames result not captured"
bad_df <- data.frame(`First Name` = "Alice", check.names = FALSE)
clean_names(bad_df)
names(bad_df)
#> [1] "First Name"
```

**Why it is wrong:** `clean_names()` returns a new data frame. It does not modify the original in place. If you forget to capture the result, `bad_df` still has the messy names.

✅ **Correct:**
```r title="Correct: Capture cleannames output"
bad_df <- data.frame(`First Name` = "Alice", check.names = FALSE)
bad_df <- clean_names(bad_df)
names(bad_df)
#> [1] "first_name"
```

### Mistake 2: Using remove_empty() on columns with empty strings

❌ **Wrong:**
```r title="Mistake: Empty strings not dropped"
char_df <- data.frame(
  a = c("x", "y"),
  b = c("", "")
)
result <- remove_empty(char_df, which = "cols")
ncol(result)
#> [1] 2
```

**Why it is wrong:** Column `b` contains empty strings `""`, not `NA`. `remove_empty()` only removes columns that are entirely `NA`. The column stays.

✅ **Correct:**
```r title="Correct: Convert empty strings to NA"
char_df <- data.frame(
  a = c("x", "y"),
  b = c("", "")
)
result <- char_df |>
  mutate(across(where(is.character), ~na_if(.x, ""))) |>
  remove_empty(which = "cols")
ncol(result)
#> [1] 1
```

### Mistake 3: Expecting get_dupes() to deduplicate

❌ **Wrong:**
```r title="Mistake: getdupes does not remove"
df <- data.frame(id = c(1, 1, 2, 3), value = c("a", "a", "b", "c"))
clean <- get_dupes(df, id)
# Expecting clean to contain deduplicated data
```

**Why it is wrong:** `get_dupes()` reports duplicates -- it does not remove them. Use `dplyr::distinct()` to actually deduplicate.

✅ **Correct:**
```r title="Correct: Use distinct to deduplicate"
df <- data.frame(id = c(1, 1, 2, 3), value = c("a", "a", "b", "c"))

# Step 1: inspect duplicates
get_dupes(df, id)
#>   id dupe_count value
#> 1  1          2     a
#> 2  1          2     a

# Step 2: remove them
clean <- distinct(df)
nrow(clean)
#> [1] 3
```

### Mistake 4: Wrong row_number in row_to_names()

❌ **Wrong:**
```r title="Mistake: Off-by-one header row"
df <- data.frame(X1 = c("Meta", "Name", "Alice"), X2 = c(NA, "Age", "30"))
# Wanting "Name" and "Age" as headers but using row 1
fixed <- row_to_names(df, row_number = 1)
names(fixed)
#> [1] "Meta" NA
```

**Why it is wrong:** Row 1 contains metadata, not the real headers. The off-by-one error gives you wrong column names and an `NA` column.

✅ **Correct:**
```r title="Correct: Promote the right header"
df <- data.frame(X1 = c("Meta", "Name", "Alice"), X2 = c(NA, "Age", "30"))
fixed <- row_to_names(df, row_number = 2)
names(fixed)
#> [1] "Name" "Age"
```

## Practice Exercises

### Exercise 1: Clean a messy customer dataset

You receive a data frame with ugly column names, two empty rows, one empty column, and duplicate records. Clean it up using a janitor pipeline: fix the names, remove empty rows/columns, and identify duplicates.

```r title="Exercise: Full cleaning pipeline"
# Exercise: full cleaning pipeline
my_messy <- data.frame(
  `Customer ID` = c(101, 102, NA, 103, 101, NA),
  `Full Name` = c("Alice", "Bob", NA, "Carol", "Alice", NA),
  `Total Spend ($)` = c(500, 300, NA, 700, 500, NA),
  empty_col = c(NA, NA, NA, NA, NA, NA),
  check.names = FALSE
)

# Step 1: clean_names()
# Step 2: remove_empty()
# Step 3: get_dupes()
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Full cleaning pipeline solution"
my_messy <- data.frame(
  `Customer ID` = c(101, 102, NA, 103, 101, NA),
  `Full Name` = c("Alice", "Bob", NA, "Carol", "Alice", NA),
  `Total Spend ($)` = c(500, 300, NA, 700, 500, NA),
  empty_col = c(NA, NA, NA, NA, NA, NA),
  check.names = FALSE
)

my_clean <- my_messy |>
  clean_names() |>
  remove_empty(which = c("rows", "cols"))

cat("Clean data:\n")
my_clean
#>   customer_id full_name total_spend
#> 1         101     Alice         500
#> 2         102       Bob         300
#> 4         103     Carol         700
#> 5         101     Alice         500

cat("\nDuplicates:\n")
get_dupes(my_clean, customer_id)
#>   customer_id dupe_count full_name total_spend
#> 1         101          2     Alice         500
#> 2         101          2     Alice         500
```

**Explanation:** The pipeline chains `clean_names()` to fix headers, `remove_empty()` to drop NA rows/columns, and `get_dupes()` to surface the duplicate customer 101.

</details>

### Exercise 2: Build a formatted frequency report

Create a two-way cross-tabulation of `mtcars` by `cyl` (rows) and `gear` (columns). Add column totals, display column percentages formatted to one decimal place, append raw counts, and add a combined title.

```r title="Exercise: Publication-ready cross tab"
# Exercise: publication-ready cross-tab
# Hint: tabyl(cyl, gear) |> adorn_totals() |> adorn_percentages("col") |> ...
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Publication cross tab solution"
my_report <- mtcars |>
  tabyl(cyl, gear) |>
  adorn_totals("row") |>
  adorn_percentages("col") |>
  adorn_pct_formatting(digits = 1) |>
  adorn_ns() |>
  adorn_title("combined")

my_report
#>  cyl/gear          3          4         5
#>         4  6.7%  (1) 66.7% (8) 40.0% (2)
#>         6 13.3%  (2) 33.3% (4) 20.0% (1)
#>         8 80.0% (12)  0.0% (0) 40.0% (2)
#>     Total 100.0% (15) 100.0% (12) 100.0% (5)
```

**Explanation:** `adorn_percentages("col")` computes column-wise percentages. The chain builds a formatted report showing that 80% of 3-gear cars have 8 cylinders.

</details>

### Exercise 3: Fix a broken spreadsheet export

You have a spreadsheet export where row 3 contains the real headers, the first two rows are metadata, there are empty columns, and a date column contains Excel serial numbers. Fix everything.

```r title="Exercise: Complete spreadsheet repair"
# Exercise: complete spreadsheet repair
my_excel <- data.frame(
  X1 = c("Report Title", "Date: 2024-Q1", "Employee", "Jane Doe", "John Smith", NA),
  X2 = c(NA, NA, "Hire Date", "44927", "45108", NA),
  X3 = c(NA, NA, "Department", "Sales", "Engineering", NA),
  X4 = c(NA, NA, NA, NA, NA, NA),
  stringsAsFactors = FALSE
)

# Step 1: row_to_names() to fix headers
# Step 2: remove_empty() for blank rows/cols
# Step 3: clean_names() for consistent names
# Step 4: convert Hire Date from Excel serial to real date
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Spreadsheet repair solution"
my_excel <- data.frame(
  X1 = c("Report Title", "Date: 2024-Q1", "Employee", "Jane Doe", "John Smith", NA),
  X2 = c(NA, NA, "Hire Date", "44927", "45108", NA),
  X3 = c(NA, NA, "Department", "Sales", "Engineering", NA),
  X4 = c(NA, NA, NA, NA, NA, NA),
  stringsAsFactors = FALSE
)

my_fixed <- my_excel |>
  row_to_names(row_number = 3) |>
  remove_empty(which = c("rows", "cols")) |>
  clean_names() |>
  mutate(hire_date = excel_numeric_to_date(as.numeric(hire_date)))

my_fixed
#>     employee  hire_date  department
#> 4   Jane Doe 2023-01-01       Sales
#> 5 John Smith 2023-07-01 Engineering
```

**Explanation:** The pipeline promotes row 3 to headers, strips the blank row and column, cleans the names, and converts Excel serial dates to real dates.

</details>

## Putting It All Together

Here is the complete "5 lines of code" promise. You start with a realistic messy dataset and clean it end to end.

```r title="End-to-end messy spreadsheet cleanup"
# Simulating a messy spreadsheet export
raw_data <- data.frame(
  X1 = c("Sales Report 2024", "Rep Name", "Alice", "Bob", "Alice", NA, "Carol"),
  X2 = c(NA, "Deal Value ($)", "12000", "8500", "12000", NA, "9200"),
  X3 = c(NA, "Close Date", "45292", "45323", "45292", NA, "45354"),
  X4 = c(NA, NA, NA, NA, NA, NA, NA),
  stringsAsFactors = FALSE
)

cat("=== Raw import (7 rows, 4 cols) ===\n")
raw_data

# The 5-line cleanup
final_data <- raw_data |>                                   # line 1: start
  row_to_names(row_number = 2) |>                           # line 2: fix headers
  remove_empty(which = c("rows", "cols")) |>                # line 3: drop blanks
  clean_names() |>                                          # line 4: snake_case
  mutate(                                                   # line 5: fix types
    deal_value = as.numeric(deal_value),
    close_date = excel_numeric_to_date(as.numeric(close_date))
  )

cat("\n=== Clean result (4 rows, 3 cols) ===\n")
final_data
#>   rep_name deal_value close_date
#> 1    Alice      12000 2024-01-15
#> 2      Bob       8500 2024-02-15
#> 3    Alice      12000 2024-01-15
#> 4    Carol       9200 2024-03-16

# Bonus: check for duplicates
cat("\n=== Duplicates ===\n")
get_dupes(final_data, rep_name, deal_value)
#>   rep_name deal_value dupe_count close_date
#> 1    Alice      12000          2 2024-01-15
#> 2    Alice      12000          2 2024-01-15
```

From a 7-row, 4-column mess to a clean, typed, duplicate-flagged dataset in five lines. Every janitor function did exactly one job and did it well.

## Summary

| Function | What It Does | When to Use It |
|----------|-------------|----------------|
| `clean_names()` | Converts column names to snake_case | After every file import |
| `remove_empty()` | Drops all-NA rows and/or columns | Spreadsheet imports with blank padding |
| `remove_constant()` | Drops columns with a single repeated value | After remove_empty, before analysis |
| `get_dupes()` | Returns duplicate rows with counts | Data quality audits |
| `tabyl()` | Tidy frequency tables with percentages | Replacing base R `table()` |
| `adorn_*()` | Formats tabyl output (totals, %, counts) | Building report-ready tables |
| `row_to_names()` | Promotes a data row to column names | Excel files with buried headers |
| `excel_numeric_to_date()` | Converts Excel serial dates to R dates | Imported date columns showing numbers |

The janitor package does not try to do everything. It solves the eight most common data cleaning problems with simple, composable functions. Pair it with dplyr for transformations and you can handle almost any messy dataset.

## FAQ

### Is janitor compatible with the tidyverse pipe?

Yes. Every janitor function takes a data frame as its first argument and returns a data frame. This makes it fully compatible with both the native pipe `|>` and magrittr's `%>%`. You can chain `read_csv() |> clean_names() |> remove_empty()` seamlessly.

### Can clean_names() handle non-English characters?

Yes. `clean_names()` transliterates accented characters to ASCII equivalents. For example, `"Resume"` with an accent becomes `"resume"`, and `"StraBe"` (German sharp S) becomes `"strasse"`. This uses the `snakecase` package internally.

### Does tabyl() work with more than three variables?

No. `tabyl()` supports one-way, two-way, and three-way tables (1, 2, or 3 variables). For higher-dimensional frequency tables, use `dplyr::count()` which handles any number of grouping variables.

### How is get_dupes() different from dplyr::distinct()?

They serve opposite purposes. `get_dupes()` shows you which rows are duplicated and how many times. `distinct()` removes duplicates and keeps only unique rows. Use `get_dupes()` to investigate, then `distinct()` to clean.

### Can I use janitor with data.table?

`clean_names()` works on data.tables directly. However, `tabyl()` and the `adorn_*` functions expect data frames or tibbles. Convert with `as.data.frame()` first, or use data.table's native `.[, .N, by = ...]` for frequency counts.

## References

1. Firke, S., janitor: Simple Tools for Examining and Cleaning Dirty Data. CRAN vignette. [Link](https://cran.r-project.org/web/packages/janitor/vignettes/janitor.html)
2. Firke, S., janitor GitHub repository. [Link](https://github.com/sfirke/janitor)
3. CRAN, janitor package reference manual (v2.2.1). [Link](https://cran.r-project.org/web/packages/janitor/janitor.pdf)
4. Wickham, H. & Grolemund, G., *R for Data Science*, 2nd Edition. O'Reilly (2023). Chapter 6: Data Tidying. [Link](https://r4ds.hadley.nz/data-tidy)
5. Rapp, A., Easy data cleaning with the janitor package. [Link](https://albert-rapp.de/posts/07_janitor_showcase/07_janitor_showcase)
6. rdrr.io, clean_names() function reference. [Link](https://rdrr.io/cran/janitor/man/clean_names.html)
7. R-bloggers, Easy data cleaning with the janitor package (2024). [Link](https://www.r-bloggers.com/2024/05/easy-data-cleaning-with-the-janitor-package/)

## Continue Learning

- **[Data Quality Checking in R](Data-Quality-Checking-in-R.html)**, The parent guide covering the full data quality workflow, from missing values to outlier detection.
- **[Missing Values in R](Missing-Values-in-R-Detect-Count-Remove-Impute-NA.html)**, How to detect, count, remove, and impute NA values in your datasets.
- **[dplyr Tutorial](dplyr-tutorial.html)**, Master the core data transformation verbs that pair perfectly with janitor's cleaning functions.
