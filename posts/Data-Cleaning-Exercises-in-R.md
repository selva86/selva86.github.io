---
title: "Data Cleaning Exercises in R: 28 Real Practice Problems"
slug: "Data-Cleaning-Exercises-in-R"
description: "Practice 28 data cleaning problems in R: missing values, duplicates, type coercion, string fixes, outliers, validation. Solutions hidden, code runnable."
keywords: "data cleaning exercises in R, data cleaning practice R, R data cleaning problems, data cleaning in R exercises, dirty data R practice"
mathjax: false
webr: true
date: "2026-05-12"
post_type: "EX"
sidebar_title: "Data Cleaning Exercises"
sidebar_order: 116
fr_parent: "R-Tutorial.html"
auto_link_terms: "data cleaning exercises|data cleaning practice|data cleaning in R exercises|dirty data R"
auto_link_case_sensitive: false
target_keyword: "data cleaning in R exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Data Cleaning Exercises in R: 28 Real Practice Problems

<p class="lead">Twenty-eight practice problems that mirror the data-cleaning work analysts do every day: handling missing values, deduplicating records, coercing messy types, standardizing strings, flagging outliers, and validating end-to-end pipelines. Solutions are hidden so you can attempt each problem first.</p>

```r title="Run this once before any exercise"
library(dplyr)
library(tidyr)
library(stringr)
library(lubridate)
library(tibble)
library(purrr)
```

## Section 1. Missing values (5 problems)

### Exercise 1.1: Count total missing values across a data frame

**Task:** A data analyst auditing the built-in `airquality` dataset wants a single number describing how dirty the input is. Use `is.na()` together with `sum()` to count every NA across all columns and rows, then save the count to `ex_1_1`.

**Expected result:**

```
#> [1] 44
#> (out of 153 rows * 6 cols = 918 cells)
```

**Difficulty:** Beginner

[HINTS]
A missing-value test produces a TRUE/FALSE for every single cell; you just need their grand total.
Run `is.na()` across the whole data frame and feed the result to `sum()`, which counts each TRUE as 1.

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- sum(is.na(airquality))
ex_1_1
#> [1] 44
```

**Explanation:** `is.na()` returns a logical matrix of the same shape as `airquality`, with `TRUE` where a cell is missing. `sum()` coerces `TRUE` to `1` and `FALSE` to `0`, so the result is the total NA count. This one-liner is your first sanity check on any new dataset; pair it with `nrow(airquality) * ncol(airquality)` to convert to a percentage. Avoid `complete.cases()` here because it returns a per-row logical, not a global count.

</details>

### Exercise 1.2: Build a per-column missingness report

**Task:** The same analyst now needs a row in a dashboard showing the NA count for every column of `airquality`, sorted descending so the worst offenders surface first. Produce a tibble with columns `column` and `n_missing` and save it to `ex_1_2`.

**Expected result:**

```
#> # A tibble: 6 x 2
#>   column  n_missing
#>   <chr>       <int>
#> 1 Ozone          37
#> 2 Solar.R         7
#> 3 Wind            0
#> 4 Temp            0
#> 5 Month           0
#> 6 Day             0
```

**Difficulty:** Intermediate

[HINTS]
First collapse each column to its own count of gaps, then turn that single wide row into one row per column.
Pair `across(everything(), ...)` for the per-column count with `pivot_longer()` and `arrange(desc())`.

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- airquality |>
  summarise(across(everything(), ~ sum(is.na(.x)))) |>
  pivot_longer(everything(), names_to = "column", values_to = "n_missing") |>
  arrange(desc(n_missing))
ex_1_2
#> # A tibble: 6 x 2
#>   column  n_missing
#>   <chr>       <int>
#> 1 Ozone          37
#> 2 Solar.R         7
#> 3 Wind            0
#> 4 Temp            0
#> 5 Month           0
#> 6 Day             0
```

**Explanation:** `across(everything(), ...)` applies the lambda column-wise, returning a one-row wide summary. `pivot_longer()` flips that wide row into the long, dashboard-friendly shape. The alternative `colSums(is.na(airquality))` is shorter but returns a named vector, which is awkward to feed into further dplyr pipelines or to ggplot for a missingness bar chart.

</details>

### Exercise 1.3: Drop rows missing the response but keep predictor gaps

**Task:** A modeller plans to predict `Ozone` from weather variables in `airquality` and must drop only the rows where `Ozone` itself is NA, while keeping rows that have `Solar.R` missing (those can be imputed later). Save the filtered tibble to `ex_1_3`.

**Expected result:**

```
#> # A tibble: 116 x 6
#>    Ozone Solar.R  Wind  Temp Month   Day
#>    <int>   <int> <dbl> <int> <int> <int>
#> 1     41     190   7.4    67     5     1
#> 2     36     118   8.0    72     5     2
#> ...
#> # 114 more rows hidden
#> sum(is.na(ex_1_3$Solar.R))
#> [1] 5
```

**Difficulty:** Intermediate

[HINTS]
Drop a row only when the column you cannot model around is empty, and leave the other gaps alone.
Call `drop_na()` but name the `Ozone` column explicitly so `Solar.R` gaps survive.

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- airquality |> drop_na(Ozone)
nrow(ex_1_3)
#> [1] 116
sum(is.na(ex_1_3$Solar.R))
#> [1] 5
```

**Explanation:** `drop_na(Ozone)` is the targeted version of `drop_na()`; passing no argument would strip every row with any NA and waste 35 valid Solar.R rows. The principle generalizes: drop only on the columns whose missingness you cannot model around, and impute the rest. The base R equivalent is `airquality[!is.na(airquality$Ozone), ]`, which is more verbose but works without tidyr.

</details>

### Exercise 1.4: Impute two columns with two different strategies

**Task:** Continuing the modelling prep, replace `Ozone` NAs with the column median and `Solar.R` NAs with the column mean on the full `airquality` table. The choice differs because Ozone is right-skewed (median is more robust) while Solar.R is roughly symmetric. Save the imputed tibble to `ex_1_4`.

**Expected result:**

```
#> # A tibble: 153 x 6
#>    Ozone Solar.R  Wind  Temp Month   Day
#>    <dbl>   <dbl> <dbl> <int> <int> <int>
#> 1   41      190    7.4    67     5     1
#> 2   36      118    8      72     5     2
#> ...
#> sum(is.na(ex_1_4))
#> [1] 0
```

**Difficulty:** Intermediate

[HINTS]
Fill each column's gaps with a single representative number, picking the statistic that suits that column's skew.
Inside `mutate()`, use `ifelse(is.na(...))` with `median()` for Ozone and `mean()` for Solar.R, each with `na.rm = TRUE`.

```r title="Your turn"
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_4 <- airquality |>
  mutate(
    Ozone   = ifelse(is.na(Ozone),   median(Ozone,   na.rm = TRUE), Ozone),
    Solar.R = ifelse(is.na(Solar.R), mean(Solar.R, na.rm = TRUE),   Solar.R)
  )
sum(is.na(ex_1_4))
#> [1] 0
```

**Explanation:** `na.rm = TRUE` is critical: forgetting it makes `median()` and `mean()` return `NA`, so the imputation becomes a no-op. Single-value imputation shrinks variance and biases regression standard errors, so report this in your write-up. For production work consider `mice::mice()` or `recipes::step_impute_*()`, which honour the multivariate structure of the data instead of treating each column independently.

</details>

### Exercise 1.5: Forward-fill missing readings within each month

**Task:** A field scientist treats `airquality` as a daily time series and assumes that on calm days a missing Ozone reading is best replaced by the most recent prior reading within the same month (not bleeding across months). Use `tidyr::fill()` after `group_by(Month)` to forward-fill `Ozone`. Save the result to `ex_1_5`.

**Expected result:**

```
#> # A tibble: 153 x 6
#> # Groups:   Month [5]
#>    Ozone Solar.R  Wind  Temp Month   Day
#>    <int>   <int> <dbl> <int> <int> <int>
#> 1    41     190   7.4    67     5     1
#> 2    36     118   8      72     5     2
#> ...
#> sum(is.na(ex_1_5$Ozone))
#> [1] 4
```

**Difficulty:** Advanced

[HINTS]
Carry the most recent reading forward, but never let a value bleed across a month boundary.
After `group_by(Month)`, apply `fill()` to `Ozone` with `.direction = "down"`.

```r title="Your turn"
ex_1_5 <- # your code here
ex_1_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_5 <- airquality |>
  arrange(Month, Day) |>
  group_by(Month) |>
  fill(Ozone, .direction = "down")
sum(is.na(ex_1_5$Ozone))
#> [1] 4
```

**Explanation:** `fill()` respects grouping, so values do not leak from May into June. Four NAs survive because they sit at the start of their month with no prior observation to copy. Set `.direction = "downup"` to also back-fill leading NAs, which is acceptable when the time order is not meaningful. Forward-fill is a strong default for sensor data where short gaps reflect transmission failures rather than true zeros.

</details>

## Section 2. Duplicates and uniqueness (4 problems)

### Exercise 2.1: Flag exact duplicate rows

**Task:** A junior analyst inherits an inline tibble of customer orders and suspects the upstream extract double-wrote some rows. Detect every row that is an exact duplicate of another row (keep both copies in the flagged set) and save the duplicate rows to `ex_2_1`.

```r
orders <- tibble(
  order_id = c(101, 102, 103, 101, 104, 102),
  customer = c("A", "B", "C", "A", "D", "B"),
  amount   = c(10, 20, 30, 10, 40, 20)
)
```

**Expected result:**

```
#> # A tibble: 4 x 3
#>   order_id customer amount
#>      <dbl> <chr>     <dbl>
#> 1      101 A            10
#> 2      102 B            20
#> 3      101 A            10
#> 4      102 B            20
```

**Difficulty:** Beginner

[HINTS]
Compare rows on the whole set of their values and keep every row whose combination is not unique.
`group_by()` all three columns, then `filter(n() > 1)`.

```r title="Your turn"
orders <- tibble(
  order_id = c(101, 102, 103, 101, 104, 102),
  customer = c("A", "B", "C", "A", "D", "B"),
  amount   = c(10, 20, 30, 10, 40, 20)
)
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- orders |>
  group_by(order_id, customer, amount) |>
  filter(n() > 1) |>
  ungroup()
ex_2_1
#> # A tibble: 4 x 3
#>   order_id customer amount
#>      <dbl> <chr>     <dbl>
#> 1      101 A            10
#> 2      102 B            20
#> 3      101 A            10
#> 4      102 B            20
```

**Explanation:** Grouping by every column and filtering `n() > 1` returns all members of any duplicated combination, not just the second copy onward. Base R's `duplicated()` returns only the second-and-later flags, which is fine for deduplication but misleading when you want to audit the offending pairs. Always confirm a "duplicate" is a true repeat versus a legitimate repeat purchase before deleting.

</details>

### Exercise 2.2: Deduplicate keeping the most recent record

**Task:** A retailer's nightly customer feed often contains the same `customer_id` multiple times because addresses are updated mid-day; only the latest record per customer should survive. Using the inline tibble, deduplicate on `customer_id`, keeping the row with the maximum `updated_at`. Save the cleaned tibble to `ex_2_2`.

```r
feed <- tibble(
  customer_id = c(1, 1, 2, 3, 3, 3),
  address     = c("old A", "new A", "B", "old C1", "new C", "old C2"),
  updated_at  = as.Date(c("2026-01-01", "2026-02-01",
                          "2026-01-15",
                          "2026-01-01", "2026-03-01", "2026-02-15"))
)
```

**Expected result:**

```
#> # A tibble: 3 x 3
#>   customer_id address updated_at
#>         <dbl> <chr>   <date>
#> 1           1 new A   2026-02-01
#> 2           2 B       2026-01-15
#> 3           3 new C   2026-03-01
```

**Difficulty:** Intermediate

[HINTS]
Order the rows so the freshest record per customer is on top, then keep just the first of each key.
`arrange()` by `customer_id` and `desc(updated_at)`, then `distinct(customer_id, .keep_all = TRUE)`.

```r title="Your turn"
feed <- tibble(
  customer_id = c(1, 1, 2, 3, 3, 3),
  address     = c("old A", "new A", "B", "old C1", "new C", "old C2"),
  updated_at  = as.Date(c("2026-01-01", "2026-02-01",
                          "2026-01-15",
                          "2026-01-01", "2026-03-01", "2026-02-15"))
)
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- feed |>
  arrange(customer_id, desc(updated_at)) |>
  distinct(customer_id, .keep_all = TRUE)
ex_2_2
#> # A tibble: 3 x 3
#>   customer_id address updated_at
#>         <dbl> <chr>   <date>
#> 1           1 new A   2026-02-01
#> 2           2 B       2026-01-15
#> 3           3 new C   2026-03-01
```

**Explanation:** `distinct(..., .keep_all = TRUE)` retains the first row encountered per key, so pre-sorting by `desc(updated_at)` is what selects the latest record. The equivalent `group_by(customer_id) |> slice_max(updated_at, n = 1)` is more explicit and survives unsorted data without the arrange step, at a small performance cost on millions of rows.

</details>

### Exercise 2.3: Detect case-insensitive duplicate emails

**Task:** A marketing analyst is loading email leads and notices that `Alice@Example.com` and `alice@example.com` are the same person from the mail server's perspective. Find every email that appears more than once after lowercasing and trimming whitespace. Save the duplicated normalized emails (one row per duplicated value, with count) to `ex_2_3`.

```r
leads <- tibble(
  raw_email = c(" Alice@Example.com", "bob@x.io",
                "alice@example.com",  "BOB@x.io ",
                "carol@y.com",        "dave@z.io")
)
```

**Expected result:**

```
#> # A tibble: 2 x 2
#>   email                  n
#>   <chr>              <int>
#> 1 alice@example.com      2
#> 2 bob@x.io               2
```

**Difficulty:** Intermediate

[HINTS]
Reduce each email to one canonical form before you compare, then tally how often each form appears.
Lowercase and trim with `str_to_lower()` and `str_trim()`, then `count()` the email and `filter(n > 1)`.

```r title="Your turn"
leads <- tibble(
  raw_email = c(" Alice@Example.com", "bob@x.io",
                "alice@example.com",  "BOB@x.io ",
                "carol@y.com",        "dave@z.io")
)
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- leads |>
  mutate(email = str_to_lower(str_trim(raw_email))) |>
  count(email) |>
  filter(n > 1) |>
  arrange(desc(n), email)
ex_2_3
#> # A tibble: 2 x 2
#>   email                  n
#>   <chr>              <int>
#> 1 alice@example.com      2
#> 2 bob@x.io               2
```

**Explanation:** Trimming first prevents `"bob@x.io"` and `"BOB@x.io "` from being treated as different keys because of a trailing space. Lower-casing matches the email RFC, which says the local part is case-sensitive in theory but is treated as case-insensitive by virtually every mail provider. For a production de-dupe, also strip dot-folding (`a.lice` vs `alice` at Gmail) and plus-tagging (`alice+promos`).

</details>

### Exercise 2.4: Resolve duplicates on a composite business key

**Task:** A hospital's daily lab feed considers a record unique only by the composite key `(patient_id, test_code, sample_date)`; multiple result rows for the same key indicate a reprocessed run, and only the row with the latest `processed_at` is authoritative. Deduplicate the inline tibble on that composite key, keeping the latest `processed_at`. Save the cleaned tibble to `ex_2_4`.

```r
labs <- tibble(
  patient_id   = c("P1", "P1", "P1", "P2", "P2"),
  test_code    = c("CBC", "CBC", "CMP", "CBC", "CBC"),
  sample_date  = as.Date(c("2026-01-10", "2026-01-10", "2026-01-10",
                           "2026-01-11", "2026-01-11")),
  result       = c(4.2, 4.5, 130, 5.1, 5.0),
  processed_at = as.POSIXct(c("2026-01-10 09:00", "2026-01-10 14:00",
                              "2026-01-10 09:30",
                              "2026-01-11 10:00", "2026-01-11 16:00"),
                            tz = "UTC")
)
```

**Expected result:**

```
#> # A tibble: 3 x 5
#>   patient_id test_code sample_date result processed_at
#>   <chr>      <chr>     <date>       <dbl> <dttm>
#> 1 P1         CBC       2026-01-10     4.5 2026-01-10 14:00:00
#> 2 P1         CMP       2026-01-10   130   2026-01-10 09:30:00
#> 3 P2         CBC       2026-01-11     5.0 2026-01-11 16:00:00
```

**Difficulty:** Advanced

[HINTS]
Uniqueness here is defined by three columns together; keep the freshest row within each such group.
`group_by()` the three key columns and use `slice_max()` on `processed_at` with `with_ties = FALSE`.

```r title="Your turn"
labs <- tibble(
  patient_id   = c("P1", "P1", "P1", "P2", "P2"),
  test_code    = c("CBC", "CBC", "CMP", "CBC", "CBC"),
  sample_date  = as.Date(c("2026-01-10", "2026-01-10", "2026-01-10",
                           "2026-01-11", "2026-01-11")),
  result       = c(4.2, 4.5, 130, 5.1, 5.0),
  processed_at = as.POSIXct(c("2026-01-10 09:00", "2026-01-10 14:00",
                              "2026-01-10 09:30",
                              "2026-01-11 10:00", "2026-01-11 16:00"),
                            tz = "UTC")
)
ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_4 <- labs |>
  group_by(patient_id, test_code, sample_date) |>
  slice_max(processed_at, n = 1, with_ties = FALSE) |>
  ungroup()
ex_2_4
#> # A tibble: 3 x 5
#>   patient_id test_code sample_date result processed_at
#>   <chr>      <chr>     <date>       <dbl> <dttm>
#> 1 P1         CBC       2026-01-10     4.5 2026-01-10 14:00:00
#> 2 P1         CMP       2026-01-10   130   2026-01-10 09:30:00
#> 3 P2         CBC       2026-01-11     5.0 2026-01-11 16:00:00
```

**Explanation:** `slice_max(processed_at, n = 1)` is the idiomatic "latest per group" pattern; `with_ties = FALSE` guards against the rare case where two rows share the same processed timestamp, which would otherwise both survive and break the uniqueness contract. In SQL this is `ROW_NUMBER() OVER (PARTITION BY ... ORDER BY processed_at DESC) = 1`. Document the tie-breaking rule alongside the key in your data dictionary.

</details>

## Section 3. Type coercion and parsing (5 problems)

### Exercise 3.1: Coerce a character vector of numbers to numeric

**Task:** A take-home interviewer hands you a character vector that should be numeric but came back as strings because the source CSV had a header row mixed in. Coerce `c("1.5", "2.0", "3.7", "4.1")` to a numeric vector and save the result to `ex_3_1`.

**Expected result:**

```
#> [1] 1.5 2.0 3.7 4.1
```

**Difficulty:** Beginner

[HINTS]
Turn each text element into the number it represents.
Apply `as.numeric()` to the character vector.

```r title="Your turn"
raw <- c("1.5", "2.0", "3.7", "4.1")
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
raw <- c("1.5", "2.0", "3.7", "4.1")
ex_3_1 <- as.numeric(raw)
ex_3_1
#> [1] 1.5 2.0 3.7 4.1
```

**Explanation:** `as.numeric()` parses each element with R's standard numeric rules and emits `NA` with a warning for anything unparseable. For locale-aware parsing (commas as decimal separators, currency symbols) reach for `readr::parse_number()` instead; it tolerates noise like `"$1.5"` or `"1,234.5"` and skips the warning churn that `as.numeric()` produces on mixed input.

</details>

### Exercise 3.2: Parse a column with mixed date formats

**Task:** A consultant receives a survey export where the `date_taken` column has been entered three different ways: ISO (`"2026-01-15"`), US slash (`"01/20/2026"`), and abbreviated month (`"Feb 5, 2026"`). Parse them all into a single `Date` vector using `lubridate::parse_date_time()`. Save the parsed dates to `ex_3_2`.

**Expected result:**

```
#> [1] "2026-01-15" "2026-01-20" "2026-02-05"
```

**Difficulty:** Intermediate

[HINTS]
Hand the parser an ordered list of candidate layouts so it can match each string to whichever one fits.
Use `parse_date_time()` with an `orders` argument such as `c("ymd", "mdy", "B d, Y")`, then wrap in `as.Date()`.

```r title="Your turn"
raw_dates <- c("2026-01-15", "01/20/2026", "Feb 5, 2026")
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
raw_dates <- c("2026-01-15", "01/20/2026", "Feb 5, 2026")
ex_3_2 <- as.Date(parse_date_time(raw_dates,
                                  orders = c("ymd", "mdy", "B d, Y")))
ex_3_2
#> [1] "2026-01-15" "2026-01-20" "2026-02-05"
```

**Explanation:** `parse_date_time()` walks the `orders` vector in order and picks the first format that parses each element, which is exactly what you want for heterogeneous columns. It returns a POSIXct, so wrap with `as.Date()` when time-of-day is meaningless. Watch out for the `mdy` versus `dmy` ambiguity: `"01/02/2026"` is January 2nd in the US but February 1st in most of Europe, so confirm the source locale before trusting the parse.

</details>

### Exercise 3.3: Convert a factor to numeric without scrambling the values

**Task:** A reviewer flags that a colleague's regression code applied `as.numeric()` directly to a numeric-looking factor and silently produced the factor levels' integer codes instead of the original numbers. Convert `factor(c("10", "20", "30", "10"))` back to the original numeric values using the safe two-step idiom and save to `ex_3_3`.

**Expected result:**

```
#> [1] 10 20 30 10
```

**Difficulty:** Intermediate

[HINTS]
A factor's hidden integer codes are not its labels, so route the conversion through the label text.
Convert with `as.character()` first and then `as.numeric()`.

```r title="Your turn"
f <- factor(c("10", "20", "30", "10"))
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
f <- factor(c("10", "20", "30", "10"))
ex_3_3 <- as.numeric(as.character(f))
ex_3_3
#> [1] 10 20 30 10
```

**Explanation:** A factor stores integer codes internally, so `as.numeric(f)` returns those codes (1, 2, 3, 1 here) not the labels. The fix is to coerce to character first, then to numeric. The newer `forcats::fct_inseq()` reorders levels by their numeric interpretation; `as.numeric(as.character(...))` is still the safest one-line conversion. This bug surfaces a lot in survey data where Likert scales are stored as factors.

</details>

### Exercise 3.4: Parse currency strings into numbers

**Task:** A finance team's expense report exports amounts as currency strings like `"$1,234.56"`, `"$0.99"`, `"$10,000.00"`, and the auditing pipeline needs them as numeric for summing. Use `readr::parse_number()` to strip the dollar signs and thousands separators in one call. Save the parsed numeric vector to `ex_3_4`.

**Expected result:**

```
#> [1]  1234.56     0.99 10000.00
```

**Difficulty:** Intermediate

[HINTS]
Extract the numeric content of each string while discarding currency symbols and thousands separators.
Use readr's `parse_number()` on the vector.

```r title="Your turn"
amounts <- c("$1,234.56", "$0.99", "$10,000.00")
ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
library(readr)
amounts <- c("$1,234.56", "$0.99", "$10,000.00")
ex_3_4 <- parse_number(amounts)
ex_3_4
#> [1]  1234.56     0.99 10000.00
```

**Explanation:** `parse_number()` pulls the first contiguous number out of each string and ignores leading/trailing non-numeric noise plus thousands separators that match the active locale. For European data set `locale = locale(decimal_mark = ",", grouping_mark = ".")`. The base R alternative is two `gsub()` calls followed by `as.numeric()`, which is more typing and easier to break with edge cases like negative parentheses (`"($50)"`).

</details>

### Exercise 3.5: Auto-detect and coerce a messy character data frame

**Task:** An ML engineer ingests a CSV where every column was read as character because of stray cells. They want to apply `readr::parse_guess()` to each column independently so dates, integers, and doubles get their natural type while truly textual columns stay character. Use `mutate(across(everything(), parse_guess))` on the inline tibble and save the typed tibble to `ex_3_5`.

```r
messy <- tibble(
  id   = c("1", "2", "3"),
  date = c("2026-01-01", "2026-02-15", "2026-03-30"),
  amt  = c("100.5", "200.0", "300.25"),
  note = c("ok", "ok", "review")
)
```

**Expected result:**

```
#> # A tibble: 3 x 4
#>      id date         amt note
#>   <dbl> <date>     <dbl> <chr>
#> 1     1 2026-01-01  100. ok
#> 2     2 2026-02-15  200  ok
#> 3     3 2026-03-30  300. review
```

**Difficulty:** Advanced

[HINTS]
Let a type-guessing routine inspect each column and give it the most specific type that parses cleanly.
Apply `parse_guess` column-wise with `across(everything(), ...)` inside `mutate()`.

```r title="Your turn"
messy <- tibble(
  id   = c("1", "2", "3"),
  date = c("2026-01-01", "2026-02-15", "2026-03-30"),
  amt  = c("100.5", "200.0", "300.25"),
  note = c("ok", "ok", "review")
)
ex_3_5 <- # your code here
ex_3_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
library(readr)
messy <- tibble(
  id   = c("1", "2", "3"),
  date = c("2026-01-01", "2026-02-15", "2026-03-30"),
  amt  = c("100.5", "200.0", "300.25"),
  note = c("ok", "ok", "review")
)
ex_3_5 <- messy |>
  mutate(across(everything(), parse_guess))
ex_3_5
#> # A tibble: 3 x 4
#>      id date         amt note
#>   <dbl> <date>     <dbl> <chr>
#> 1     1 2026-01-01  100. ok
#> 2     2 2026-02-15  200  ok
#> 3     3 2026-03-30  300. review
```

**Explanation:** `parse_guess()` runs `readr`'s heuristic over a sample of values and returns the most specific type that parses everything (date > integer > double > character). Wrap it inside `across()` to apply the per-column logic in one pass. The downside is that columns with a stray non-numeric value will fall back to character; tighten the guess by calling `parse_double(..., na = c("", "NA", "n/a"))` explicitly on columns you trust to be numeric.

</details>

## Section 4. String cleaning and normalization (4 problems)

### Exercise 4.1: Trim whitespace and force lowercase

**Task:** A new hire is loading a category column from a vendor feed and the same logical value appears as `" Active"`, `"ACTIVE "`, and `"active"` due to inconsistent data entry. Normalize a character vector by stripping leading/trailing whitespace with `str_trim()` and lowercasing with `str_to_lower()`, then save the result to `ex_4_1`.

**Expected result:**

```
#> [1] "active"   "active"   "active"   "inactive"
```

**Difficulty:** Beginner

[HINTS]
Remove the surrounding whitespace first, then fold the case so equal values actually compare as equal.
Nest `str_trim()` inside `str_to_lower()`.

```r title="Your turn"
status <- c(" Active", "ACTIVE ", "active", "Inactive")
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
status <- c(" Active", "ACTIVE ", "active", "Inactive")
ex_4_1 <- str_to_lower(str_trim(status))
ex_4_1
#> [1] "active"   "active"   "active"   "inactive"
```

**Explanation:** Always trim before lowercasing because `tolower(" Active")` would still leave the leading space and quietly fail any downstream `==` comparison against `"active"`. The base R pair is `trimws()` plus `tolower()`. For more aggressive cleanup, `str_squish()` collapses runs of internal whitespace into single spaces, which is useful when free-text fields have copy-paste artefacts.

</details>

### Exercise 4.2: Reduce phone numbers to digits only

**Task:** A CRM admin needs phone numbers in a single canonical 10-digit form so two records typed as `"(415) 555-1234"` and `"415.555.1234"` match. Strip every non-digit from the input character vector using `str_remove_all()` with a regex, and save the digits-only vector to `ex_4_2`.

**Expected result:**

```
#> [1] "4155551234" "4155551234" "4155551234" "4155551234"
```

**Difficulty:** Intermediate

[HINTS]
Strip out every character that is not a digit from each string.
Use `str_remove_all()` with the `\\D` class, optionally keeping the last 10 with `str_sub(start = -10)`.

```r title="Your turn"
phones <- c("(415) 555-1234", "415.555.1234", "415-555-1234", "+1 415 555 1234")
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
phones <- c("(415) 555-1234", "415.555.1234", "415-555-1234", "+1 415 555 1234")
ex_4_2 <- str_remove_all(phones, "\\D")
# Drop a leading country code if you only want the trailing 10 digits
ex_4_2 <- str_sub(ex_4_2, start = -10)
ex_4_2
#> [1] "4155551234" "4155551234" "4155551234" "4155551234"
```

**Explanation:** The character class `\\D` matches any non-digit, so `str_remove_all()` collapses the string to bare numbers. The trailing `str_sub(..., start = -10)` defends against numbers that include a country code: keeping the last 10 characters normalizes to the North American local form. For international canonicalization use the `phonenumber` package, which understands country-specific length rules.

</details>

### Exercise 4.3: Extract zip codes from messy address strings

**Task:** A real-estate analyst has free-text address strings and needs the five-digit zip code at the end of each. Use `str_extract()` with a regex anchored to the trailing five digits, then save the extracted zips (as character to preserve leading zeros) to `ex_4_3`.

**Expected result:**

```
#> [1] "94110" "10001" "02115"
```

**Difficulty:** Intermediate

[HINTS]
Match exactly five digits, locked to the very end of each string.
Use `str_extract()` with the pattern `\\d{5}$`.

```r title="Your turn"
addresses <- c("100 Main St, San Francisco, CA 94110",
               "55 5th Ave, New York, NY 10001",
               "1 Long Wood Ave, Boston, MA 02115")
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
addresses <- c("100 Main St, San Francisco, CA 94110",
               "55 5th Ave, New York, NY 10001",
               "1 Long Wood Ave, Boston, MA 02115")
ex_4_3 <- str_extract(addresses, "\\d{5}$")
ex_4_3
#> [1] "94110" "10001" "02115"
```

**Explanation:** `\\d{5}$` matches exactly five digits at the end of the string. Anchoring with `$` is what prevents `"100"` (street number) from being captured; without it, the regex would greedily lock onto the first run of five digits found. Storing zips as character is non-negotiable: coercing `"02115"` to numeric produces `2115` and breaks downstream joins against reference data.

</details>

### Exercise 4.4: Standardize country names against a lookup table

**Task:** A growth team appends a country column from multiple vendors and sees `"USA"`, `"U.S.A."`, `"United States"`, `"Britain"`, and `"UK"` all in the same field. Build a small named lookup vector that maps each variant to a canonical ISO-3166 short name, then use `recode()` to standardize the inline `raw_country` column. Save the cleaned tibble to `ex_4_4`.

```r
contacts <- tibble(
  id          = 1:6,
  raw_country = c("USA", "U.S.A.", "United States",
                  "Britain", "UK", "Canada")
)
```

**Expected result:**

```
#> # A tibble: 6 x 3
#>      id raw_country   country
#>   <int> <chr>         <chr>
#> 1     1 USA           United States
#> 2     2 U.S.A.        United States
#> 3     3 United States United States
#> 4     4 Britain       United Kingdom
#> 5     5 UK            United Kingdom
#> 6     6 Canada        Canada
```

**Difficulty:** Advanced

[HINTS]
Build a mapping from every raw spelling to one canonical name, then apply it across the column.
Define a named lookup vector and splice it into `recode()` with `!!!` inside `mutate()`.

```r title="Your turn"
contacts <- tibble(
  id          = 1:6,
  raw_country = c("USA", "U.S.A.", "United States",
                  "Britain", "UK", "Canada")
)
ex_4_4 <- # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
lookup <- c(
  "USA"            = "United States",
  "U.S.A."         = "United States",
  "United States"  = "United States",
  "Britain"        = "United Kingdom",
  "UK"             = "United Kingdom",
  "Canada"         = "Canada"
)
ex_4_4 <- contacts |>
  mutate(country = recode(raw_country, !!!lookup))
ex_4_4
#> # A tibble: 6 x 3
#>      id raw_country   country
#>   <int> <chr>         <chr>
#> 1     1 USA           United States
#> 2     2 U.S.A.        United States
#> 3     3 United States United States
#> 4     4 Britain       United Kingdom
#> 5     5 UK            United Kingdom
#> 6     6 Canada        Canada
```

**Explanation:** Splatting the lookup vector with `!!!` injects every name-value pair as a separate argument to `recode()`. Keeping the mapping outside the call documents the rules and makes them testable; an unmatched value would silently pass through, so audit with `setdiff(unique(contacts$raw_country), names(lookup))` after each vendor add. For richer matching consider the `countrycode` package, which understands hundreds of name variants out of the box.

</details>

## Section 5. Outliers and validation (5 problems)

### Exercise 5.1: Flag values outside a domain range

**Task:** A teacher uploads test scores expecting integers in `[0, 100]` and wants every out-of-range entry replaced with `NA` so downstream summaries do not show negative means. Replace any `score` outside the closed range `[0, 100]` with `NA` in the inline tibble and save the result to `ex_5_1`.

```r
scores <- tibble(
  student = c("A", "B", "C", "D", "E"),
  score   = c(85, -3, 102, 70, 95)
)
```

**Expected result:**

```
#> # A tibble: 5 x 2
#>   student score
#>   <chr>   <dbl>
#> 1 A          85
#> 2 B          NA
#> 3 C          NA
#> 4 D          70
#> 5 E          95
```

**Difficulty:** Beginner

[HINTS]
Swap any score that falls outside the allowed bounds for a missing marker, keeping the rest of the row.
In `mutate()`, use `ifelse()` to test `score < 0 | score > 100` and return `NA`.

```r title="Your turn"
scores <- tibble(
  student = c("A", "B", "C", "D", "E"),
  score   = c(85, -3, 102, 70, 95)
)
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
scores <- tibble(
  student = c("A", "B", "C", "D", "E"),
  score   = c(85, -3, 102, 70, 95)
)
ex_5_1 <- scores |>
  mutate(score = ifelse(score < 0 | score > 100, NA, score))
ex_5_1
#> # A tibble: 5 x 2
#>   student score
#>   <chr>   <dbl>
#> 1 A          85
#> 2 B          NA
#> 3 C          NA
#> 4 D          70
#> 5 E          95
```

**Explanation:** Setting domain violations to `NA` is preferable to dropping the row, because the row's other columns may still hold useful information (the student ID, attempt number, etc.). Avoid silently clipping to `[0, 100]`; a `-3` is more likely a data-entry error than a true zero, and pretending it is a zero hides the upstream bug. Log the count of replacements so QA can chase the source.

</details>

### Exercise 5.2: Flag IQR outliers in a numeric column

**Task:** A statistician auditing the `airquality` dataset wants to flag wind-speed observations that fall outside the standard Tukey fence: more than 1.5 IQR below Q1 or above Q3. Add a logical `is_outlier` column to `airquality` based on `Wind`, then save to `ex_5_2`. Compute Q1/Q3/IQR ignoring NAs.

**Expected result:**

```
#> # A tibble: 153 x 7
#>    Ozone Solar.R  Wind  Temp Month   Day is_outlier
#>    <int>   <int> <dbl> <int> <int> <int> <lgl>
#> 1     41     190   7.4    67     5     1 FALSE
#> 2     36     118   8      72     5     2 FALSE
#> ...
#> sum(ex_5_2$is_outlier)
#> [1] 3
```

**Difficulty:** Intermediate

[HINTS]
Build the fence from the two quartiles and the gap between them, then test each value against it.
Get `quantile()` at 0.25 and 0.75 with `na.rm = TRUE`, form the 1.5 * IQR bounds, and flag inside `mutate()`.

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
q1  <- quantile(airquality$Wind, 0.25, na.rm = TRUE)
q3  <- quantile(airquality$Wind, 0.75, na.rm = TRUE)
iqr <- q3 - q1
ex_5_2 <- airquality |>
  mutate(is_outlier = Wind < (q1 - 1.5 * iqr) | Wind > (q3 + 1.5 * iqr))
sum(ex_5_2$is_outlier, na.rm = TRUE)
#> [1] 3
```

**Explanation:** The Tukey rule is robust because both Q1 and Q3 are insensitive to extreme values, unlike the mean-and-sd alternative. Three observations exceed the fence on Wind. Flagging rather than deleting preserves the audit trail; once you confirm the values are sensor errors you can drop them, but quietly removing them at the cleaning stage hides distributional information from later modelling steps.

</details>

### Exercise 5.3: Z-score outliers computed within groups

**Task:** A safety analyst wants Ozone readings that are unusual relative to their own month, not the year as a whole, because Ozone climbs in summer and a "high" August reading may be a typical September reading. Compute a per-month z-score for `Ozone` in `airquality` and flag absolute z greater than 2. Save the augmented tibble to `ex_5_3`.

**Expected result:**

```
#> # A tibble: 153 x 8
#> # Groups:   Month [5]
#>    Ozone Solar.R  Wind  Temp Month   Day      z is_outlier
#>    <int>   <int> <dbl> <int> <int> <int>  <dbl> <lgl>
#> 1     41     190   7.4    67     5     1 0.624  FALSE
#> 2     36     118   8      72     5     2 0.358  FALSE
#> ...
#> sum(ex_5_3$is_outlier, na.rm = TRUE)
#> [1] 6
```

**Difficulty:** Intermediate

[HINTS]
Judge each value against its own group's centre and spread, not the whole column's.
After `group_by(Month)`, `mutate()` a z-score from `mean()` and `sd()` (`na.rm = TRUE`) and flag `abs(z) > 2`.

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_3 <- airquality |>
  group_by(Month) |>
  mutate(
    z          = (Ozone - mean(Ozone, na.rm = TRUE)) / sd(Ozone, na.rm = TRUE),
    is_outlier = abs(z) > 2
  )
sum(ex_5_3$is_outlier, na.rm = TRUE)
#> [1] 6
```

**Explanation:** Group-relative z-scoring controls for the predictable monthly drift in air quality so the outlier flag tracks anomalies, not seasonality. The choice of threshold 2 is conventional but data-dependent; for small per-group samples the t-distribution fence (`qt(0.975, df)`) is more honest. The base-R shortcut `scale()` returns a matrix, so dplyr's manual formula is cleaner inside `mutate()`.

</details>

### Exercise 5.4: Cross-column validation: start before end

**Task:** A logistics coordinator imports shipment events and any row where `ship_date` is later than `delivery_date` is a logical impossibility that must be flagged for manual review. Build an `invalid_dates` column on the inline tibble that is `TRUE` whenever `ship_date > delivery_date` (treat NA as valid until proven otherwise), and save the augmented tibble to `ex_5_4`.

```r
shipments <- tibble(
  shipment_id   = 1:5,
  ship_date     = as.Date(c("2026-01-10", "2026-01-12", "2026-02-01",
                            NA,           "2026-03-05")),
  delivery_date = as.Date(c("2026-01-12", "2026-01-11", "2026-02-05",
                            "2026-03-01", "2026-03-04"))
)
```

**Expected result:**

```
#> # A tibble: 5 x 4
#>   shipment_id ship_date  delivery_date invalid_dates
#>         <int> <date>     <date>        <lgl>
#> 1           1 2026-01-10 2026-01-12    FALSE
#> 2           2 2026-01-12 2026-01-11    TRUE
#> 3           3 2026-02-01 2026-02-05    FALSE
#> 4           4 NA         2026-03-01    FALSE
#> 5           5 2026-03-05 2026-03-04    TRUE
```

**Difficulty:** Advanced

[HINTS]
A row is invalid when one date comes after the other, but a missing date must not count as invalid.
In `mutate()`, combine `!is.na()` guards on both date columns with the `ship_date > delivery_date` comparison.

```r title="Your turn"
shipments <- tibble(
  shipment_id   = 1:5,
  ship_date     = as.Date(c("2026-01-10", "2026-01-12", "2026-02-01",
                            NA,           "2026-03-05")),
  delivery_date = as.Date(c("2026-01-12", "2026-01-11", "2026-02-05",
                            "2026-03-01", "2026-03-04"))
)
ex_5_4 <- # your code here
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_4 <- shipments |>
  mutate(invalid_dates = !is.na(ship_date) &
                         !is.na(delivery_date) &
                         ship_date > delivery_date)
ex_5_4
#> # A tibble: 5 x 4
#>   shipment_id ship_date  delivery_date invalid_dates
#>         <int> <date>     <date>        <lgl>
#> 1           1 2026-01-10 2026-01-12    FALSE
#> 2           2 2026-01-12 2026-01-11    TRUE
#> 3           3 2026-02-01 2026-02-05    FALSE
#> 4           4 NA         2026-03-01    FALSE
#> 5           5 2026-03-05 2026-03-04    TRUE
```

**Explanation:** The NA guards in front of the comparison are crucial: in R, any comparison with `NA` returns `NA`, which would cascade into the `invalid_dates` column and pollute the validation summary. By short-circuiting through `!is.na()` first, you keep the flag strictly logical. For richer cross-column rules consider the `validate` package, which lets you declare constraints once and apply them to any data frame.

</details>

### Exercise 5.5: Winsorize extreme values at 1st and 99th percentiles

**Task:** A risk team prefers to cap rather than drop extreme values because dropping shrinks the sample and skews downstream variance. Winsorize the `Ozone` column of `airquality` at the 1st and 99th percentiles: every value below P1 becomes P1, every value above P99 becomes P99. Save the resulting tibble to `ex_5_5`.

**Expected result:**

```
#> # A tibble: 153 x 6
#>    Ozone Solar.R  Wind  Temp Month   Day
#>    <dbl>   <int> <dbl> <int> <int> <int>
#> 1   41      190   7.4    67     5     1
#> 2   36      118   8      72     5     2
#> ...
#> range(ex_5_5$Ozone, na.rm = TRUE)
#> [1]  1.00 152.84
```

**Difficulty:** Advanced

[HINTS]
Pull each value into the band between two percentile thresholds instead of dropping the extremes.
Compute `quantile()` at `c(0.01, 0.99)` and apply `pmin()` and `pmax()` inside `mutate()`.

```r title="Your turn"
ex_5_5 <- # your code here
ex_5_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
caps <- quantile(airquality$Ozone, c(0.01, 0.99), na.rm = TRUE)
ex_5_5 <- airquality |>
  mutate(Ozone = pmin(pmax(Ozone, caps[1]), caps[2]))
range(ex_5_5$Ozone, na.rm = TRUE)
#> [1]  1.00 152.84
```

**Explanation:** `pmax(x, lo)` lifts every element below `lo` up to `lo`; `pmin(..., hi)` brings the high tail down. Composing the two is the winsorize-in-one-step idiom. Always document the cap thresholds so reviewers can reproduce the transformation; the alternative `DescTools::Winsorize()` does the same arithmetic with a friendlier API. Use winsorizing on heavy-tailed inputs to linear models where a few extreme rows dominate the coefficient estimates.

</details>

## Section 6. End-to-end cleaning pipelines (5 problems)

### Exercise 6.1: Standardize messy column names

**Task:** A reporting analyst inherits a CSV with column headers like `"First Name "`, `"Email-Address"`, `"Phone #"`. Build a cleaned tibble where every name is lowercase snake_case with no leading/trailing whitespace and no punctuation. Use `rename_with()` plus a `gsub()` chain. Save the renamed tibble to `ex_6_1`.

```r
raw_df <- tibble(
  `First Name `   = c("Ada", "Bob"),
  `Email-Address` = c("a@x.io", "b@y.io"),
  `Phone #`       = c("415-1", "415-2")
)
```

**Expected result:**

```
#> # A tibble: 2 x 3
#>   first_name email_address phone
#>   <chr>      <chr>         <chr>
#> 1 Ada        a@x.io        415-1
#> 2 Bob        b@y.io        415-2
```

**Difficulty:** Intermediate

[HINTS]
Rewrite every header into one consistent lowercase, underscore-separated, punctuation-free shape.
Use `rename_with()` with a function that chains `str_trim()`, `str_to_lower()`, and `str_replace_all()` on punctuation.

```r title="Your turn"
raw_df <- tibble(
  `First Name `   = c("Ada", "Bob"),
  `Email-Address` = c("a@x.io", "b@y.io"),
  `Phone #`       = c("415-1", "415-2")
)
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_1 <- raw_df |>
  rename_with(~ .x |>
                str_trim() |>
                str_to_lower() |>
                str_replace_all("[^a-z0-9]+", "_") |>
                str_replace_all("^_|_$", "") |>
                str_replace("address$", "address") |>
                str_replace("phone_+$", "phone"))
ex_6_1
#> # A tibble: 2 x 3
#>   first_name email_address phone
#>   <chr>      <chr>         <chr>
#> 1 Ada        a@x.io        415-1
#> 2 Bob        b@y.io        415-2
```

**Explanation:** The trim + lower + collapse-punctuation chain reproduces the core of `janitor::clean_names()` without an extra dependency. The trailing replacements strip stray underscores left at the beginning or end after the punctuation pass. For team work standardize on `janitor::clean_names()` so naming rules survive package upgrades and onboarding handoffs.

</details>

### Exercise 6.2: Tidy a wide messy survey export

**Task:** A market researcher exports a survey where each row is a respondent and each scored item (`q1`, `q2`, `q3`) is its own column, but downstream modelling wants long format with one row per respondent-item pair. Pivot the inline tibble to long format with columns `respondent`, `question`, `score`. Save the long tibble to `ex_6_2`.

```r
survey <- tibble(
  respondent = c("R1", "R2", "R3"),
  q1         = c(5, 4, 3),
  q2         = c(2, 5, 4),
  q3         = c(4, NA, 5)
)
```

**Expected result:**

```
#> # A tibble: 9 x 3
#>   respondent question score
#>   <chr>      <chr>    <dbl>
#> 1 R1         q1           5
#> 2 R1         q2           2
#> 3 R1         q3           4
#> 4 R2         q1           4
#> 5 R2         q2           5
#> 6 R2         q3          NA
#> 7 R3         q1           3
#> 8 R3         q2           4
#> 9 R3         q3           5
```

**Difficulty:** Intermediate

[HINTS]
Reshape so each scored item becomes its own row rather than its own column.
Use `pivot_longer()` on the q-columns with `names_to = "question"` and `values_to = "score"`.

```r title="Your turn"
survey <- tibble(
  respondent = c("R1", "R2", "R3"),
  q1         = c(5, 4, 3),
  q2         = c(2, 5, 4),
  q3         = c(4, NA, 5)
)
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_2 <- survey |>
  pivot_longer(cols = starts_with("q"),
               names_to  = "question",
               values_to = "score")
ex_6_2
#> # A tibble: 9 x 3
#>   respondent question score
#>   <chr>      <chr>    <dbl>
#> 1 R1         q1           5
#> 2 R1         q2           2
#> ...
```

**Explanation:** `pivot_longer()` is the canonical tidy reshape; `starts_with("q")` is a tidy-select helper that ignores the respondent column without needing to negate it explicitly. Long format is what most modelling and plotting functions expect because each variable now lives in its own column. To drop NA scores instead of carrying them through, add `values_drop_na = TRUE`.

</details>

### Exercise 6.3: Build a one-shot data quality summary report

**Task:** An ops engineer must produce a single-tibble quality summary for `airquality` showing, per column, the number of rows, the count and percent of NAs, and the data type. Build that summary using `purrr::map_dfr()` over `names(airquality)` and save the result to `ex_6_3`. Order columns so the worst-missing one appears on top.

**Expected result:**

```
#> # A tibble: 6 x 5
#>   column      n n_missing pct_missing type
#>   <chr>   <int>     <int>       <dbl> <chr>
#> 1 Ozone     153        37      24.2   integer
#> 2 Solar.R   153         7       4.58  integer
#> 3 Wind      153         0       0     numeric
#> 4 Temp      153         0       0     integer
#> 5 Month     153         0       0     integer
#> 6 Day       153         0       0     integer
```

**Difficulty:** Advanced

[HINTS]
Walk over each column name, emit a one-row summary for it, and stack those rows together.
Use `map_dfr()` over `names(airquality)` returning a `tibble()` per column, with `typeof()` for the type, then `arrange(desc())`.

```r title="Your turn"
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_3 <- map_dfr(names(airquality), function(col) {
  v <- airquality[[col]]
  tibble(
    column      = col,
    n           = length(v),
    n_missing   = sum(is.na(v)),
    pct_missing = round(100 * mean(is.na(v)), 2),
    type        = typeof(v)
  )
}) |> arrange(desc(n_missing))
ex_6_3
#> # A tibble: 6 x 5
#>   column      n n_missing pct_missing type
#>   <chr>   <int>     <int>       <dbl> <chr>
#> 1 Ozone     153        37       24.2  integer
#> 2 Solar.R   153         7        4.58 integer
#> 3 Wind      153         0        0    double
#> 4 Temp      153         0        0    integer
#> 5 Month     153         0        0    integer
#> 6 Day       153         0        0    integer
```

**Explanation:** Walking `names(df)` and returning a one-row tibble per column is the most portable pattern; it works on any data frame without preassuming dplyr verbs. `mean(is.na(v))` is a tight idiom for missingness fraction because `TRUE`/`FALSE` average directly. Wire this function into a daily report so any spike in `pct_missing` triggers an alert before the change reaches dashboards.

</details>

### Exercise 6.4: Clean and validate a small transaction log

**Task:** A fraud analyst has a daily transactions tibble that arrives with messy strings, mixed types, and rows that violate business rules (negative amounts, transactions before account creation, duplicates). Build a pipeline that (1) standardizes `customer_id` to uppercase, (2) parses `amount` from `"$1,234.50"` style strings, (3) drops rows where `amount < 0`, (4) deduplicates on `(customer_id, txn_time)` keeping the latest amount. Save the cleaned tibble to `ex_6_4`.

```r
library(readr)
txns <- tibble(
  customer_id = c("a1", "A1", "b2", "B2", "c3"),
  amount      = c("$100.00", "$120.00", "-$50.00", "$200.00", "$0.99"),
  txn_time    = as.POSIXct(c("2026-04-01 09:00", "2026-04-01 09:00",
                             "2026-04-01 10:00", "2026-04-01 11:00",
                             "2026-04-01 12:00"), tz = "UTC")
)
```

**Expected result:**

```
#> # A tibble: 3 x 3
#>   customer_id amount txn_time
#>   <chr>        <dbl> <dttm>
#> 1 A1             120 2026-04-01 09:00:00
#> 2 B2             200 2026-04-01 11:00:00
#> 3 C3               0.99 2026-04-01 12:00:00
```

**Difficulty:** Intermediate

[HINTS]
Standardize the key's case and parse the amounts before any filter or dedup step relies on them.
Key functions: `str_to_upper()` and `parse_number()` in `mutate()`, `filter()` on the amount, and `distinct()` with `.keep_all = TRUE`.

```r title="Your turn"
library(readr)
txns <- tibble(
  customer_id = c("a1", "A1", "b2", "B2", "c3"),
  amount      = c("$100.00", "$120.00", "-$50.00", "$200.00", "$0.99"),
  txn_time    = as.POSIXct(c("2026-04-01 09:00", "2026-04-01 09:00",
                             "2026-04-01 10:00", "2026-04-01 11:00",
                             "2026-04-01 12:00"), tz = "UTC")
)
ex_6_4 <- # your code here
ex_6_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_4 <- txns |>
  mutate(
    customer_id = str_to_upper(customer_id),
    amount      = parse_number(amount)
  ) |>
  filter(amount >= 0) |>
  arrange(customer_id, txn_time, desc(amount)) |>
  distinct(customer_id, txn_time, .keep_all = TRUE)
ex_6_4
#> # A tibble: 3 x 3
#>   customer_id amount txn_time
#>   <chr>        <dbl> <dttm>
#> 1 A1          120    2026-04-01 09:00:00
#> 2 B2          200    2026-04-01 11:00:00
#> 3 C3            0.99 2026-04-01 12:00:00
```

**Explanation:** The order of the verbs matters: parse amounts before filtering on them (otherwise the comparison happens on character data and is silently wrong); standardize the case of the dedup key before `distinct()` (so `"a1"` and `"A1"` collapse correctly); arrange before `distinct()` to control which row wins. A common production mistake is to swap the filter and parse steps, leaving `"-$50.00"` in place and turning a negative into a positive when later parsed.

</details>

### Exercise 6.5: End-to-end pipeline with explicit step-level checks

**Task:** An MLOps engineer wants the cleaning pipeline to fail loudly when assumptions break, so each cleaning step is wrapped in a `stopifnot()` check that the data still satisfies the contract afterward. Take the inline raw tibble and build a pipeline that (a) trims whitespace on `name`, (b) parses `age` to integer, (c) drops rows missing either field, (d) asserts the cleaned `age` is in `[0, 120]`, (e) asserts no duplicate names. Save the validated tibble to `ex_6_5`.

```r
raw <- tibble(
  name = c(" Ada", "Bob ", "Cleo", "Dan", "Bob "),
  age  = c("30", "45", "x", "27", "45")
)
```

**Expected result:**

```
#> # A tibble: 3 x 2
#>   name    age
#>   <chr> <int>
#> 1 Ada      30
#> 2 Bob      45
#> 3 Dan      27
```

**Difficulty:** Advanced

[HINTS]
After each cleaning step, assert the data still meets its contract so a violation fails loudly.
Clean with `str_trim()`, `as.integer()`, and `drop_na()`, then guard with `stopifnot()` on the age range and `!anyDuplicated()`.

```r title="Your turn"
raw <- tibble(
  name = c(" Ada", "Bob ", "Cleo", "Dan", "Bob "),
  age  = c("30", "45", "x", "27", "45")
)
ex_6_5 <- # your code here
ex_6_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
clean <- raw |>
  mutate(
    name = str_trim(name),
    age  = suppressWarnings(as.integer(age))
  ) |>
  drop_na(name, age)

stopifnot(all(clean$age >= 0 & clean$age <= 120))

ex_6_5 <- clean |>
  distinct(name, .keep_all = TRUE)

stopifnot(!anyDuplicated(ex_6_5$name))

ex_6_5
#> # A tibble: 3 x 2
#>   name    age
#>   <chr> <int>
#> 1 Ada      30
#> 2 Bob      45
#> 3 Dan      27
```

**Explanation:** Inline assertions turn silent data drift into loud failures: the next time `age` arrives with `"-5"` or `"300"`, the script crashes at the source rather than the model finding it three steps downstream. `suppressWarnings()` is appropriate here because the failed parse on `"x"` produces an NA that `drop_na()` removes by design; without the suppression the log fills with noise. For larger pipelines promote these checks into a `validate::confront()` ruleset, which produces a structured QA report.

</details>

## What to do next

You have practised the full data-cleaning loop: detecting missingness, deduplicating, coercing types, normalizing strings, flagging outliers, and validating end-to-end pipelines. Take the next step with these companion resources on r-statistics.co:

- [dplyr Exercises in R](dplyr-Exercises-in-R.html): drill the verbs (`mutate`, `filter`, `summarise`, `group_by`) that powered most of the solutions above.
- [tidyr Exercises in R](tidyr-Exercises-in-R.html): focused practice on `pivot_longer`, `pivot_wider`, `separate_wider_*`, and `fill`.
- [Strings Exercises in R](Strings-Exercises-in-R.html): deeper drills on `stringr` regex patterns for cleaning text fields.
- [Dates and Times Exercises in R](Dates-and-Times-Exercises-in-R.html): sharpen the lubridate parsing skills used in Section 3.
