---
title: "The Data Cleaning Gauntlet: 25 Messy Data Problems in R"
slug: "Data-Cleaning-Gauntlet"
description: "Data cleaning in R, drilled: 25 messy problems covering missing values, bad strings, mixed dates, type traps, duplicates, outliers, units. Solutions hidden."
keywords: "data cleaning in R, messy data in R, data cleaning exercises R, dirty data cleaning R, data cleaning problems R"
mathjax: false
webr: true
date: "2026-07-15"
post_type: "EX"
sidebar_title: "Data Cleaning Gauntlet"
sidebar_order: 140
fr_parent: "R-Tutorial.html"
auto_link_terms: "data cleaning in R|messy data in R|cleaning data in R|dirty data R|data cleaning problems"
auto_link_case_sensitive: false
target_keyword: "data cleaning in R"
sibling_block_enabled: false
difficulty: "Mixed"
---

# The Data Cleaning Gauntlet: 25 Messy Data Problems in R

<p class="lead">Messy data is the job. This gauntlet strings together twenty-five problems that mirror the cleanup analysts and data scientists face every day: detecting and strategizing missing values, taming inconsistent strings, parsing dates from clashing formats, escaping type-coercion traps, killing duplicates, flagging outliers, reconciling units, and finally fixing a table broken every way at once. Solutions stay hidden so you can fight each one first.</p>

Run the setup block once to load the packages and the messy datasets, then work top to bottom or jump straight to the technique you want to drill. Every problem names the dataset it uses.

```r title="Run this once before any exercise"
library(dplyr)
library(tidyr)
library(stringr)
library(lubridate)

# --- Missing values ---
patients <- tibble(
  id = 1:6,
  age = c(34, NA, 41, 29, NA, 52),
  bp = c(120, 130, NA, 110, 140, 135),
  glucose = c(88, 95, 90, NA, NA, 101)
)
survey <- tibble(
  respondent = 1:5,
  income = c(50, NA, 62, NA, 71),
  savings = c(NA, NA, NA, 12, NA),
  age = c(25, 34, NA, 41, 29)
)

# --- Inconsistent strings ---
cities_raw   <- c("  Mumbai", "Delhi  ", "  Chennai  ", "Kolkata")
gender_raw   <- c("M", "male", "Male ", "FEMALE", "f", " Female")
products_raw <- c("Red   Widget", " Blue  Gadget ", "Green Gizmo")
resp <- tibble(country = c("usa", "U.S.A.", "USA ", "india", "India", " INDIA", "uk"))

# --- Mixed date formats ---
date_str    <- c("2024-01-05", "2024-02-14", "2024-03-30")
mixed_dates <- c("2024-01-05", "14/02/2024", "March 30, 2024")
raw_dates   <- c("2024-01-05", "2024-06-18", "not a date", "2024-12-25")

# --- Type coercion traps ---
nums_txt   <- c("12", "34", "56", "78")
prices_txt <- c("$1,200", "$980", "$1,050", "$3,499")
scores_f   <- factor(c("10", "20", "30", "20", "10"))
readings <- tibble(
  sensor = c("s1", "s2", "s3", "s4", "s5"),
  value  = c("23.5", "N/A", "19.8", "unknown", "31.2")
)

# --- Duplicates ---
orders <- tibble(
  order_id = c(1, 2, 2, 3, 3, 3),
  item     = c("pen", "book", "book", "mug", "mug", "mug")
)
records <- tibble(
  customer_id = c(1, 1, 2, 2, 3),
  updated = as.Date(c("2024-01-10", "2024-03-05", "2024-02-01", "2024-02-20", "2024-01-15")),
  status  = c("trial", "active", "active", "churned", "trial")
)
contacts <- tibble(
  name  = c("John Smith", "john smith ", " JOHN SMITH", "Jane Doe", "Jane  Doe"),
  email = c("j@x.com", "j@x.com", "j@x.com", "jane@x.com", "jane@x.com")
)

# --- Outliers and units ---
heights <- tibble(
  person = c("a", "b", "c", "d", "e"),
  height_cm = c(170, 165, 999, 158, 182)
)
vals   <- c(10, 12, 11, 13, 12, 100, 11, 9, 12, 10)
income <- c(30, 42, 38, 51, 45, 40, 250, 47, 39, 44)
weights <- tibble(
  item  = c("x", "y", "z", "w"),
  value = c(1.2, 1500, 0.8, 2300),
  unit  = c("kg", "g", "kg", "g")
)

# --- The final gauntlet ---
sales <- tibble(
  product = c(" Widget", "Gadget ", "widget", NA),
  price   = c("$12.50", "$8.00", "$12.50", "$5.00"),
  qty     = c("3", "2", "3", "1")
)
tx <- tibble(
  product = c("Pen ", "pen", "BOOK", "book "),
  amount  = c("10", "10", "45", "45")
)
customers <- tibble(
  id     = c(1, 2, 2, 3, 4),
  name   = c(" Alice", "bob", "bob", "CAROL ", "dave"),
  signup = c("2024-01-05", "2024/02/10", "2024/02/10", "not recorded", "2024-03-15"),
  spend  = c("$100", "$250", "$250", "$0", "$75")
)
```

## Section 1. Detecting and strategizing missing values (4 problems)

### Exercise 1.1: Count missing values in every column

**Task:** Before choosing any strategy you first need to see where the gaps are. Using the `patients` tibble from the setup block, count how many `NA` values sit in each column and save the named result to `ex_1_1`.

**Expected result:**

```
#>      id     age      bp glucose
#>       0       2       1       2
```

**Difficulty:** Beginner

[HINTS]
A data frame is a list of columns, and you want one missingness tally per column, not per row.
Combine `is.na()` with `colSums()` to add up the TRUE values down each column.

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- colSums(is.na(patients))
ex_1_1
#>      id     age      bp glucose
#>       0       2       1       2
```

**Explanation:** `colSums(is.na(patients))` works because `is.na()` returns a TRUE/FALSE matrix and `colSums()` treats each TRUE as 1, adding them down every column. This one-liner is your first diagnostic on any new dataset. `sapply(patients, function(x) sum(is.na(x)))` gives the same answer if you prefer an explicit apply.

</details>

### Exercise 1.2: Keep only the fully complete rows

**Task:** A clinical data manager wants a strictly complete cohort for a quick summary. From the `patients` tibble, keep only the rows that have no missing value in any column, and save the filtered tibble to `ex_1_2`.

**Expected result:**

```
#> # A tibble: 2 x 4
#>      id   age    bp glucose
#>   <int> <dbl> <dbl>   <dbl>
#> 1     1    34   120      88
#> 2     6    52   135     101
```

**Difficulty:** Intermediate

[HINTS]
You want to keep only rows where nothing at all is missing across the columns.
`drop_na(patients)` removes any row containing an NA in any column.

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- drop_na(patients)
ex_1_2
#> # A tibble: 2 x 4
#>      id   age    bp glucose
#>   <int> <dbl> <dbl>   <dbl>
#> 1     1    34   120      88
#> 2     6    52   135     101
```

**Explanation:** `drop_na()` from tidyr keeps only rows complete across every column, which is the safe default when missingness is rare. Beware on wide data: dropping any-NA rows can silently delete most of your sample. To restrict the rule to specific columns, pass them, as in `drop_na(patients, age)`. Base R's `na.omit()` behaves similarly.

</details>

### Exercise 1.3: Median-impute age and flag the imputed rows

**Task:** Dropping rows loses data, so the team prefers imputation for `age`. In the `patients` tibble, replace each missing `age` with the column median and add a logical `age_imputed` column marking which rows were filled, then save the result to `ex_1_3`.

**Expected result:**

```
#> # A tibble: 6 x 5
#>      id   age    bp glucose age_imputed
#>   <int> <dbl> <dbl>   <dbl> <lgl>
#> 1     1  34     120      88 FALSE
#> 2     2  37.5   130      95 TRUE
#> 3     3  41      NA      90 FALSE
#> 4     4  29     110      NA FALSE
#> 5     5  37.5   140      NA TRUE
#> 6     6  52     135     101 FALSE
```

**Difficulty:** Intermediate

[HINTS]
Capture where the gaps were before you fill them, otherwise that information is lost forever.
Build the flag with `is.na(age)`, then replace with `ifelse()` and `median(age, na.rm = TRUE)` inside `mutate()`.

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- patients |>
  mutate(age_imputed = is.na(age),
         age = ifelse(is.na(age), median(age, na.rm = TRUE), age))
ex_1_3
#> # A tibble: 6 x 5
#>      id   age    bp glucose age_imputed
#>   <int> <dbl> <dbl>   <dbl> <lgl>
#> 1     1  34     120      88 FALSE
#> 2     2  37.5   130      95 TRUE
#> 3     3  41      NA      90 FALSE
#> 4     4  29     110      NA FALSE
#> 5     5  37.5   140      NA TRUE
#> 6     6  52     135     101 FALSE
```

**Explanation:** Recording `age_imputed` before overwriting `age` preserves the fact that the value was invented, which every honest analysis needs so imputed points can be excluded or modeled separately later. `ifelse()` is vectorized, filling only the NA positions. Using the median rather than the mean keeps the fill robust to the extreme values common in dirty data.

</details>

### Exercise 1.4: Drop mostly-empty columns then impute the rest

**Task:** A survey came back patchy. Using the `survey` tibble, drop any column that is more than 40 percent missing, then median-impute the remaining numeric gaps so downstream code never sees an `NA`, and save the cleaned tibble to `ex_1_4`.

**Expected result:**

```
#> # A tibble: 5 x 3
#>   respondent income   age
#>        <int>  <dbl> <dbl>
#> 1          1     50  25
#> 2          2     62  34
#> 3          3     62  31.5
#> 4          4     62  41
#> 5          5     71  29
```

**Difficulty:** Advanced

[HINTS]
First decide which columns are too empty to trust, then treat the survivors.
Use `select(where(...))` on the share of NAs, then `across(where(is.numeric), ...)` with `median()`.

```r title="Your turn"
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_4 <- survey |>
  select(where(~ mean(is.na(.x)) <= 0.4)) |>
  mutate(across(where(is.numeric), ~ ifelse(is.na(.x), median(.x, na.rm = TRUE), .x)))
ex_1_4
#> # A tibble: 5 x 3
#>   respondent income   age
#>        <int>  <dbl> <dbl>
#> 1          1     50  25
#> 2          2     62  34
#> 3          3     62  31.5
#> 4          4     62  41
#> 5          5     71  29
```

**Explanation:** `select(where(~ mean(is.na(.x)) <= 0.4))` keeps columns whose missing share is at most 40 percent, dropping `savings` at 80 percent, because imputing a mostly empty column invents more data than it cleans. `across(where(is.numeric), ...)` then median-imputes the survivors in one sweep. Deciding drop-versus-impute per column is the core judgement of missing-data work.

</details>

## Section 2. Inconsistent strings: whitespace and case (4 problems)

### Exercise 2.1: Trim leading and trailing whitespace from city names

**Task:** Stray spaces silently break joins and grouping. Take the `cities_raw` vector of city names padded with leading and trailing spaces, strip that whitespace so each name is clean, and save the trimmed character vector to `ex_2_1`.

**Expected result:**

```
#> [1] "Mumbai"  "Delhi"   "Chennai" "Kolkata"
```

**Difficulty:** Beginner

[HINTS]
You only need to remove characters at the two ends of each string, not inside.
`str_trim(cities_raw)` strips leading and trailing whitespace.

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- str_trim(cities_raw)
ex_2_1
#> [1] "Mumbai"  "Delhi"   "Chennai" "Kolkata"
```

**Explanation:** `str_trim()` removes only leading and trailing whitespace, which is exactly what breaks joins and `group_by()` when ' Delhi' and 'Delhi' are treated as different keys. It does not touch spaces inside the string. Base R's `trimws()` is an equivalent drop-in. Always trim text keys before you join or group on them.

</details>

### Exercise 2.2: Standardize messy gender labels into two categories

**Task:** A form let people type their gender freely, so the `gender_raw` vector mixes case, spacing, and abbreviations. Normalize every entry to either `Male` or `Female`, treating m and male as Male, and save the cleaned character vector to `ex_2_2`.

**Expected result:**

```
#> [1] "Male"   "Male"   "Male"   "Female" "Female" "Female"
```

**Difficulty:** Intermediate

[HINTS]
Get everything into a single comparable form first, then map that form to your two labels.
Lowercase with `tolower()` after `str_trim()`, then branch with `case_when()`.

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
g <- tolower(str_trim(gender_raw))
ex_2_2 <- case_when(
  g %in% c("m", "male")   ~ "Male",
  g %in% c("f", "female") ~ "Female",
  TRUE ~ NA_character_
)
ex_2_2
#> [1] "Male"   "Male"   "Male"   "Female" "Female" "Female"
```

**Explanation:** Normalizing to one form with `tolower()` and `str_trim()` before mapping means you write two branches instead of a dozen. `case_when()` evaluates top to bottom and returns on the first match, and the explicit `NA_character_` default surfaces any value you did not anticipate rather than hiding it. Standardize first, then map, is the reusable pattern.

</details>

### Exercise 2.3: Collapse repeated internal spaces with str_squish

**Task:** Copy-paste left ragged spacing inside product names. Using the `products_raw` vector, collapse every run of internal whitespace to a single space and trim the ends so labels group correctly, saving the cleaned character vector to `ex_2_3`.

**Expected result:**

```
#> [1] "Red Widget"  "Blue Gadget" "Green Gizmo"
```

**Difficulty:** Intermediate

[HINTS]
The problem is repeated spaces inside the text as well as at the edges.
`str_squish()` collapses internal runs of whitespace and trims the ends in one call.

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- str_squish(products_raw)
ex_2_3
#> [1] "Red Widget"  "Blue Gadget" "Green Gizmo"
```

**Explanation:** `str_squish()` does two jobs at once: it collapses every internal run of whitespace to a single space and trims the ends, so 'Red   Widget' and 'Red Widget' finally match. `str_trim()` alone would leave the double space inside. Ragged internal spacing is a classic reason categories fail to group as expected.

</details>

### Exercise 2.4: Clean and count inconsistent country strings

**Task:** A marketing analyst needs counts by country, but the `resp` tibble spells countries with mixed case and stray punctuation like U.S.A. Standardize the `country` column to a canonical uppercase form, then count rows per country and save the summary to `ex_2_4`.

**Expected result:**

```
#> # A tibble: 3 x 2
#>   country     n
#>   <chr>   <int>
#> 1 INDIA       3
#> 2 USA         3
#> 3 UK          1
```

**Difficulty:** Advanced

[HINTS]
Different spellings must resolve to the same token before any counting can work.
Strip non-letters with `str_replace_all(country, "[^A-Za-z]", "")`, uppercase, then `count(sort = TRUE)`.

```r title="Your turn"
ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_4 <- resp |>
  mutate(country = str_to_upper(str_replace_all(country, "[^A-Za-z]", ""))) |>
  count(country, sort = TRUE)
ex_2_4
#> # A tibble: 3 x 2
#>   country     n
#>   <chr>   <int>
#> 1 INDIA       3
#> 2 USA         3
#> 3 UK          1
```

**Explanation:** Stripping every non-letter with `str_replace_all(country, "[^A-Za-z]", "")` turns U.S.A., USA, and usa into one token before `str_to_upper()`, so `count()` sees three of the same country rather than three near-misses. Cleaning the grouping key before aggregation is the single most common fix in messy categorical data, and `sort = TRUE` orders the counts descending.

</details>

## Section 3. Parsing dates from mixed formats (3 problems)

### Exercise 3.1: Parse ISO date strings into Date objects

**Task:** The `date_str` vector holds three dates written in clean ISO year-month-day text but still stored as character. Convert them into real `Date` objects so you can do arithmetic and sorting on them, and save the result to `ex_3_1`.

**Expected result:**

```
#> [1] "2024-01-05" "2024-02-14" "2024-03-30"
```

**Difficulty:** Beginner

[HINTS]
The strings are already in the standard ordering, they just need to become a real date type.
`ymd(date_str)` reads year-month-day text into `Date` values.

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- ymd(date_str)
ex_3_1
#> [1] "2024-01-05" "2024-02-14" "2024-03-30"
```

**Explanation:** `ymd()` from lubridate reads year-month-day text and returns real `Date` objects, unlocking sorting, differences, and component extraction that character strings cannot do. It is stricter and clearer than `as.Date()` because the function name states the expected order. The related `dmy()` and `mdy()` handle the other two common layouts.

</details>

### Exercise 3.2: Parse three different date formats in one vector

**Task:** Three systems exported dates three different ways into the `mixed_dates` vector: ISO, day/month/year, and a written month. Parse all of them into one consistent `Date` vector regardless of the incoming format, and save the parsed result to `ex_3_2`.

**Expected result:**

```
#> [1] "2024-01-05" "2024-02-14" "2024-03-30"
```

**Difficulty:** Intermediate

[HINTS]
You need a parser that will try several date layouts and pick whichever fits each string.
`parse_date_time(mixed_dates, orders = c("ymd","dmy","mdy"))`, then wrap it in `as_date()`.

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- as_date(parse_date_time(mixed_dates, orders = c("ymd", "dmy", "mdy")))
ex_3_2
#> [1] "2024-01-05" "2024-02-14" "2024-03-30"
```

**Explanation:** `parse_date_time()` tries each format in `orders` until one succeeds per element, so a single call absorbs ISO, day/month/year, and written-month strings together. Wrapping the result in `as_date()` drops the time and timezone for a clean `Date`. When several systems feed one column, format-guessing beats writing a separate parser for each source.

</details>

### Exercise 3.3: Parse dates and flag the unparseable ones

**Task:** Real feeds contain junk. Using the `raw_dates` vector, build a tibble that parses each string to a `Date`, extracts the `year`, and adds a `valid` flag that is FALSE where parsing failed, then save the tibble to `ex_3_3`.

**Expected result:**

```
#> # A tibble: 4 x 4
#>   raw        parsed      year valid
#>   <chr>      <date>     <dbl> <lgl>
#> 1 2024-01-05 2024-01-05  2024 TRUE
#> 2 2024-06-18 2024-06-18  2024 TRUE
#> 3 not a date NA            NA FALSE
#> 4 2024-12-25 2024-12-25  2024 TRUE
```

**Difficulty:** Advanced

[HINTS]
Parsing can fail, so plan to detect failures rather than let them crash the pipeline.
Use `ymd(raw, quiet = TRUE)`, then `year()` and `is.na()` to build the columns inside `mutate()`.

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- tibble(raw = raw_dates) |>
  mutate(parsed = ymd(raw, quiet = TRUE),
         year   = year(parsed),
         valid  = !is.na(parsed))
ex_3_3
#> # A tibble: 4 x 4
#>   raw        parsed      year valid
#>   <chr>      <date>     <dbl> <lgl>
#> 1 2024-01-05 2024-01-05  2024 TRUE
#> 2 2024-06-18 2024-06-18  2024 TRUE
#> 3 not a date NA            NA FALSE
#> 4 2024-12-25 2024-12-25  2024 TRUE
```

**Explanation:** Passing `quiet = TRUE` stops `ymd()` from spraying warnings while it returns `NA` for the unparseable 'not a date', and the `valid` flag records exactly which rows failed so you can quarantine them. Never assume a date column parses cleanly; measure the failure rate first. `year()` still returns `NA` where the parse failed, which is the honest result.

</details>

## Section 4. Type coercion traps (4 problems)

### Exercise 4.1: Convert number-like text to numeric and sum

**Task:** A CSV loaded a numeric field as text, giving you the `nums_txt` character vector. Convert those strings to numbers and return their total so you can confirm the coercion worked, saving the single sum value to `ex_4_1`.

**Expected result:**

```
#> [1] 180
```

**Difficulty:** Beginner

[HINTS]
The values look like numbers but are stored as text, so arithmetic will not work yet.
`as.numeric(nums_txt)` converts the strings, then `sum()` totals them.

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- sum(as.numeric(nums_txt))
ex_4_1
#> [1] 180
```

**Explanation:** The strings look numeric but live as character, so `sum()` would error until `as.numeric()` converts them. This tiny round-trip is the daily reality of CSVs where one stray value forced a whole column to text. If any element were non-numeric, `as.numeric()` would return `NA` with a warning, which is your signal to clean further before summing.

</details>

### Exercise 4.2: Strip currency symbols and commas before coercion

**Task:** A finance export wrote prices as strings like $1,200 in the `prices_txt` vector. Remove the dollar signs and thousands commas, convert the cleaned strings to numeric, and save the resulting numeric vector to `ex_4_2` for later math.

**Expected result:**

```
#> [1] 1200  980 1050 3499
```

**Difficulty:** Intermediate

[HINTS]
Numbers cannot be parsed while dollar signs and commas are still attached.
Remove them with `str_remove_all(prices_txt, "[$,]")` before calling `as.numeric()`.

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- as.numeric(str_remove_all(prices_txt, "[$,]"))
ex_4_2
#> [1] 1200  980 1050 3499
```

**Explanation:** Currency formatting defeats direct coercion, so `str_remove_all(prices_txt, "[$,]")` strips the dollar signs and thousands commas first, leaving clean digits for `as.numeric()`. The character class `[$,]` matches either symbol. Forgetting the comma is the usual bug: '1,200' becomes `NA` because R reads the comma as a non-numeric character. Clean, then coerce.

</details>

### Exercise 4.3: Recover true numbers from a factor column

**Task:** A column arrived as a factor, so the `scores_f` factor holds numbers as levels. Recover the true underlying numeric values rather than the integer level codes so calculations are correct, and save the numeric vector to `ex_4_3`.

**Expected result:**

```
#> [1] 10 20 30 20 10
```

**Difficulty:** Intermediate

[HINTS]
Converting a factor directly gives you its hidden integer codes, not the labels you see.
Go through text first: `as.numeric(as.character(scores_f))`.

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- as.numeric(as.character(scores_f))
ex_4_3
#> [1] 10 20 30 20 10
```

**Explanation:** A factor stores labels as integer codes, so `as.numeric(scores_f)` returns 1, 2, 3 (the codes) instead of 10, 20, 30. Routing through `as.character()` first recovers the printed labels, which `as.numeric()` then reads correctly. This factor trap silently corrupts results and is one of the most common R mistakes. When numbers arrive as factors, always go via character.

</details>

### Exercise 4.4: Coerce a mixed column to numeric, junk to NA

**Task:** A sensor dump in the `readings` tibble mixed real numbers with the strings N/A and unknown, forcing the whole `value` column to character. Coerce it to numeric, turning any non-numeric junk into `NA` without warnings, and save the tibble to `ex_4_4`.

**Expected result:**

```
#> # A tibble: 5 x 2
#>   sensor value
#>   <chr>  <dbl>
#> 1 s1      23.5
#> 2 s2      NA
#> 3 s3      19.8
#> 4 s4      NA
#> 5 s5      31.2
```

**Difficulty:** Advanced

[HINTS]
Replace the known junk tokens with a real missing value before any numeric conversion.
Inside `mutate()`, use `if_else(value %in% c("N/A","unknown"), NA_character_, value)` then `as.numeric()`.

```r title="Your turn"
ex_4_4 <- # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_4 <- readings |>
  mutate(value = as.numeric(if_else(value %in% c("N/A", "unknown"),
                                    NA_character_, value)))
ex_4_4
#> # A tibble: 5 x 2
#>   sensor value
#>   <chr>  <dbl>
#> 1 s1      23.5
#> 2 s2      NA
#> 3 s3      19.8
#> 4 s4      NA
#> 5 s5      31.2
```

**Explanation:** Replacing the known junk tokens with `NA_character_` before `as.numeric()` avoids the noisy 'NAs introduced by coercion' warning and makes intent explicit: these specific strings are missing, not accidental parse failures. `if_else()` is type-stable, requiring the `NA_character_` form. The result is a clean numeric column where only genuine values survive and everything else is honestly `NA`.

</details>

## Section 5. Duplicates and near-duplicates (3 problems)

### Exercise 5.1: Remove exact duplicate rows with distinct

**Task:** An append job ran twice and left repeats in the `orders` tibble. Remove every exact duplicate row so each order appears once, keeping the first occurrence, and save the de-duplicated tibble to `ex_5_1` for the reconciliation report.

**Expected result:**

```
#> # A tibble: 3 x 2
#>   order_id item
#>      <dbl> <chr>
#> 1        1 pen
#> 2        2 book
#> 3        3 mug
```

**Difficulty:** Intermediate

[HINTS]
You want to keep one copy of each fully identical row and discard the repeats.
`distinct(orders)` returns the unique rows.

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- distinct(orders)
ex_5_1
#> # A tibble: 3 x 2
#>   order_id item
#>      <dbl> <chr>
#> 1        1 pen
#> 2        2 book
#> 3        3 mug
```

**Explanation:** `distinct()` compares whole rows and keeps the first occurrence of each unique combination, which is the right tool when an append or join accidentally duplicated records. It is far safer than eyeballing the data. To dedupe on a subset of columns instead of the entire row, name them: `distinct(orders, order_id, .keep_all = TRUE)`.

</details>

### Exercise 5.2: Keep the most recent record per customer

**Task:** A CRM export in the `records` tibble has several rows per customer, one per update. Keep only the most recent record for each `customer_id`, based on the `updated` date, and save the one-row-per-customer result to `ex_5_2`.

**Expected result:**

```
#> # A tibble: 3 x 3
#>   customer_id updated    status
#>         <dbl> <date>     <chr>
#> 1           1 2024-03-05 active
#> 2           2 2024-02-20 churned
#> 3           3 2024-01-15 trial
```

**Difficulty:** Intermediate

[HINTS]
When duplicates carry a timestamp, sort so the record you want to keep comes first.
`arrange(customer_id, desc(updated))` then `distinct(customer_id, .keep_all = TRUE)`.

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_2 <- records |>
  arrange(customer_id, desc(updated)) |>
  distinct(customer_id, .keep_all = TRUE)
ex_5_2
#> # A tibble: 3 x 3
#>   customer_id updated    status
#>         <dbl> <date>     <chr>
#> 1           1 2024-03-05 active
#> 2           2 2024-02-20 churned
#> 3           3 2024-01-15 trial
```

**Explanation:** Sorting with `arrange(customer_id, desc(updated))` puts each customer's newest row first, so `distinct(customer_id, .keep_all = TRUE)` keeps exactly that record and drops the older ones. `.keep_all = TRUE` retains every column, not just the key. This sort-then-distinct idiom is the standard way to take the latest row per group without a window function.

</details>

### Exercise 5.3: Collapse near-duplicate names that differ by case

**Task:** The `contacts` tibble holds the same people typed inconsistently, like John Smith and JOHN SMITH. Build a normalized name key, group by it, count how many raw rows collapse into each person, and save that summary to `ex_5_3`.

**Expected result:**

```
#> # A tibble: 2 x 3
#>   name_key   n_raw email
#>   <chr>      <int> <chr>
#> 1 jane doe       2 jane@x.com
#> 2 john smith     3 j@x.com
```

**Difficulty:** Advanced

[HINTS]
Rows are not identical, so normalize the text into a shared key before grouping.
Build the key with `str_squish(str_to_lower(name))`, then `group_by()` and `summarise(n())`.

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_3 <- contacts |>
  mutate(name_key = str_squish(str_to_lower(name))) |>
  group_by(name_key) |>
  summarise(n_raw = n(), email = first(email), .groups = "drop")
ex_5_3
#> # A tibble: 2 x 3
#>   name_key   n_raw email
#>   <chr>      <int> <chr>
#> 1 jane doe       2 jane@x.com
#> 2 john smith     3 j@x.com
```

**Explanation:** The rows are not byte-identical, so `distinct()` alone would miss them; building `str_squish(str_to_lower(name))` creates a canonical key that unifies 'John Smith', 'john smith ', and ' JOHN SMITH'. Grouping on that key and counting shows how many raw rows collapse into each real person. Near-duplicate detection almost always starts with a normalized key like this.

</details>

## Section 6. Outliers and unit mismatches (4 problems)

### Exercise 6.1: Flag physically impossible height values

**Task:** A data-entry slip produced an impossible height in the `heights` tibble. Add an `is_outlier` column that is TRUE whenever `height_cm` falls outside the plausible human range of 50 to 250 centimeters, and save the flagged tibble to `ex_6_1`.

**Expected result:**

```
#> # A tibble: 5 x 3
#>   person height_cm is_outlier
#>   <chr>      <dbl> <lgl>
#> 1 a            170 FALSE
#> 2 b            165 FALSE
#> 3 c            999 TRUE
#> 4 d            158 FALSE
#> 5 e            182 FALSE
```

**Difficulty:** Beginner

[HINTS]
An outlier here is simply any value outside a range you know is physically possible.
Create the flag with `height_cm < 50 | height_cm > 250` inside `mutate()`.

```r title="Your turn"
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_1 <- heights |>
  mutate(is_outlier = height_cm < 50 | height_cm > 250)
ex_6_1
#> # A tibble: 5 x 3
#>   person height_cm is_outlier
#>   <chr>      <dbl> <lgl>
#> 1 a            170 FALSE
#> 2 b            165 FALSE
#> 3 c            999 TRUE
#> 4 d            158 FALSE
#> 5 e            182 FALSE
```

**Explanation:** A range check is the simplest outlier rule and the right one when you know the physical limits, here 50 to 250 centimeters, so the 999 entry is flagged without touching valid rows. Flagging with a logical column rather than deleting keeps the suspect visible for review. Domain-informed bounds beat purely statistical rules whenever such bounds exist.

</details>

### Exercise 6.2: Detect outliers with the 1.5 times IQR rule

**Task:** Fixed thresholds do not always fit the data, so use the distribution itself. From the `vals` numeric vector, return only the values that fall beyond 1.5 times the interquartile range from the quartiles, and save those outliers to `ex_6_2`.

**Expected result:**

```
#> [1] 100
```

**Difficulty:** Intermediate

[HINTS]
Let the middle half of the data define what counts as far away.
Compute `quantile()` at 0.25 and 0.75, then keep values beyond 1.5 times their difference.

```r title="Your turn"
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
q <- quantile(vals, c(0.25, 0.75))
iqr <- q[2] - q[1]
ex_6_2 <- vals[vals < q[1] - 1.5 * iqr | vals > q[2] + 1.5 * iqr]
ex_6_2
#> [1] 100
```

**Explanation:** The 1.5-times-IQR rule lets the middle half of the data define normal: anything beyond Q1 minus 1.5 IQR or Q3 plus 1.5 IQR is an outlier, catching the 100 here. Unlike a fixed threshold, it adapts to each column's spread, which is why boxplots use it. `quantile()` returns Q1 and Q3, and their difference is the IQR.

</details>

### Exercise 6.3: Cap extreme incomes at the 90th percentile

**Task:** The analytics team prefers capping over deleting so counts stay stable. Using the `income` vector, cap every value at the 90th percentile so extreme figures are pulled down to that ceiling, and save the winsorized vector to `ex_6_3`.

**Expected result:**

```
#>  [1] 30.0 42.0 38.0 51.0 45.0 40.0 70.9 47.0 39.0 44.0
```

**Difficulty:** Intermediate

[HINTS]
Capping means no value is allowed above a chosen ceiling, but nothing is deleted.
Find the ceiling with `quantile(income, 0.90)` and apply it with `pmin()`.

```r title="Your turn"
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
cap <- quantile(income, 0.90)
ex_6_3 <- pmin(income, cap)
ex_6_3
#>  [1] 30.0 42.0 38.0 51.0 45.0 40.0 70.9 47.0 39.0 44.0
```

**Explanation:** Winsorizing with `pmin(income, cap)` pulls every value above the 90th percentile down to that ceiling instead of deleting it, so row counts and downstream sums stay stable while the extreme 250 stops distorting the mean. `pmin()` is elementwise, comparing each value to the cap. Capping is preferred over dropping when you cannot afford to lose observations.

</details>

### Exercise 6.4: Convert mixed weight units to a common scale

**Task:** Weights in the `weights` tibble were logged in two units, kilograms and grams, marked by the `unit` column. Convert every measurement to kilograms in a new `kg` column so the values are finally comparable, and save the tibble to `ex_6_4`.

**Expected result:**

```
#> # A tibble: 4 x 4
#>   item   value unit     kg
#>   <chr>  <dbl> <chr> <dbl>
#> 1 x        1.2 kg      1.2
#> 2 y     1500   g       1.5
#> 3 z        0.8 kg      0.8
#> 4 w     2300   g       2.3
```

**Difficulty:** Intermediate

[HINTS]
Values are only comparable once they share the same unit, so convert the odd one out.
Use `if_else(unit == "g", value / 1000, value)` inside `mutate()`.

```r title="Your turn"
ex_6_4 <- # your code here
ex_6_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_4 <- weights |>
  mutate(kg = if_else(unit == "g", value / 1000, value))
ex_6_4
#> # A tibble: 4 x 4
#>   item   value unit     kg
#>   <chr>  <dbl> <chr> <dbl>
#> 1 x        1.2 kg      1.2
#> 2 y     1500   g       1.5
#> 3 z        0.8 kg      0.8
#> 4 w     2300   g       2.3
```

**Explanation:** Measurements are only comparable in a shared unit, so `if_else(unit == "g", value / 1000, value)` converts the grams rows to kilograms and leaves the kilograms rows untouched. Storing the result in a new `kg` column preserves the raw `value` for auditing. Unit mismatches are a quiet source of order-of-magnitude errors, so always normalize before you compare or aggregate.

</details>

## Section 7. The final gauntlet: multi-issue cleanup (3 problems)

### Exercise 7.1: Clean a messy sales table in one pipeline

**Task:** The `sales` tibble is dirty on three axes at once: padded product names, price strings with symbols, and text quantities. In one pipeline, clean the strings, coerce the types, drop rows with a missing product, and save the result to `ex_7_1`.

**Expected result:**

```
#> # A tibble: 3 x 3
#>   product price   qty
#>   <chr>   <dbl> <dbl>
#> 1 Widget   12.5     3
#> 2 Gadget    8       2
#> 3 Widget   12.5     3
```

**Difficulty:** Intermediate

[HINTS]
Handle each kind of mess as its own step, then filter what is left.
Chain `str_squish()` with `str_to_title()`, `as.numeric(str_remove_all(...))`, and `drop_na(product)`.

```r title="Your turn"
ex_7_1 <- # your code here
ex_7_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_7_1 <- sales |>
  mutate(product = str_to_title(str_squish(product)),
         price = as.numeric(str_remove_all(price, "[$,]")),
         qty = as.numeric(qty)) |>
  drop_na(product)
ex_7_1
#> # A tibble: 3 x 3
#>   product price   qty
#>   <chr>   <dbl> <dbl>
#> 1 Widget   12.5     3
#> 2 Gadget    8       2
#> 3 Widget   12.5     3
```

**Explanation:** Chaining the fixes in one pipeline keeps the transformation readable: `str_squish()` and `str_to_title()` standardize the names, `as.numeric(str_remove_all(...))` repairs the price and quantity types, and `drop_na(product)` removes the unusable row last. Order matters, since filtering before coercion can hide type problems. This is what a real cleaning step looks like end to end.

</details>

### Exercise 7.2: Standardize labels then total revenue per product

**Task:** A reporting analyst needs revenue by product, but the `tx` tibble spells the same product several ways and stores amounts as text. Standardize the product labels, coerce amounts to numeric, then total revenue and row count per product, saving the summary to `ex_7_2`.

**Expected result:**

```
#> # A tibble: 2 x 3
#>   product total     n
#>   <chr>   <dbl> <int>
#> 1 Book       90     2
#> 2 Pen        20     2
```

**Difficulty:** Intermediate

[HINTS]
Clean the grouping key first, or the same product will split across several groups.
Normalize with `str_to_title(str_squish(product))`, then `group_by()` and `summarise(sum())`.

```r title="Your turn"
ex_7_2 <- # your code here
ex_7_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_7_2 <- tx |>
  mutate(product = str_to_title(str_squish(product)),
         amount = as.numeric(amount)) |>
  group_by(product) |>
  summarise(total = sum(amount), n = n(), .groups = "drop")
ex_7_2
#> # A tibble: 2 x 3
#>   product total     n
#>   <chr>   <dbl> <int>
#> 1 Book       90     2
#> 2 Pen        20     2
```

**Explanation:** Cleaning the `product` key before grouping is essential: without `str_to_title(str_squish(product))`, 'Pen ' and 'pen' would form separate groups and split the revenue. Once the key is canonical, `group_by()` and `summarise()` total the numeric amount and count the rows per product. Standardize the grouping variable first is the rule that saves most botched aggregations.

</details>

### Exercise 7.3: Run the full gauntlet on one filthy table

**Task:** This is the final gauntlet: the `customers` tibble has a duplicate row, padded mixed-case names, dates in two formats plus a junk value, and dollar-string spend. Produce one analysis-ready tibble that fixes every issue, and save the clean result to `ex_7_3`.

**Expected result:**

```
#> # A tibble: 4 x 4
#>      id name  signup     spend
#>   <dbl> <chr> <date>     <dbl>
#> 1     1 Alice 2024-01-05   100
#> 2     2 Bob   2024-02-10   250
#> 3     3 Carol NA             0
#> 4     4 Dave  2024-03-15    75
```

**Difficulty:** Advanced

[HINTS]
Order matters: remove duplicates first, then fix types and formats on the survivors.
Combine `distinct()`, `str_to_title(str_squish())`, `ymd()` after swapping slashes, and `as.numeric()`.

```r title="Your turn"
ex_7_3 <- # your code here
ex_7_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_7_3 <- customers |>
  distinct() |>
  mutate(
    name   = str_to_title(str_squish(name)),
    signup = ymd(str_replace_all(signup, "/", "-"), quiet = TRUE),
    spend  = as.numeric(str_remove_all(spend, "[$,]"))
  )
ex_7_3
#> # A tibble: 4 x 4
#>      id name  signup     spend
#>   <dbl> <chr> <date>     <dbl>
#> 1     1 Alice 2024-01-05   100
#> 2     2 Bob   2024-02-10   250
#> 3     3 Carol NA             0
#> 4     4 Dave  2024-03-15    75
```

**Explanation:** Running `distinct()` first removes the duplicate row so it cannot inflate later sums, then the `mutate()` repairs names, dates, and money together. Swapping slashes for dashes lets `ymd()` read '2024/02/10', while `quiet = TRUE` returns `NA` for 'not recorded' without warnings. Sequencing dedupe before type fixes is deliberate: you clean the rows you are keeping, not the ones you will discard.

</details>

## What to do next

You just cleared twenty-five of the messiest problems in day-to-day analytics. Keep the momentum with these related drills:

- [Data Cleaning Exercises in R](Data-Cleaning-Exercises-in-R.html) for a second pass at missing values, validation, and end-to-end pipelines.
- [stringr Exercises in R](stringr-Exercises-in-R.html) to go deeper on regex, case, and whitespace fixes.
- [lubridate Exercises in R](lubridate-Exercises-in-R.html) for heavier date and time parsing practice.
- [dplyr Exercises in R](dplyr-Exercises-in-R.html) to sharpen the group, summarise, and mutate verbs behind every cleanup.
