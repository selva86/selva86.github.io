---
title: "Take-Home Assignment Simulator: One Dataset, 15 Graded Steps"
slug: "Take-Home-Assignment-Simulator"
description: "A data science take-home assignment practiced in R: clean one messy orders dataset across 15 graded steps, from type fixes to a regression and headline metrics."
keywords: "data science take home assignment practice R, take home assignment R, data cleaning in R, dplyr end to end, exploratory data analysis R, lm interpretation R"
mathjax: false
webr: true
date: "2026-07-15"
post_type: "EX"
sidebar_title: "Take-Home Simulator"
sidebar_order: 146
fr_parent: "Exploratory-Data-Analysis-in-R.html"
auto_link_terms: "take-home assignment|data cleaning|group_by|left join|linear regression"
auto_link_case_sensitive: false
target_keyword: "data science take home assignment practice R"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Take-Home Assignment Simulator: One Dataset, 15 Graded Steps

<p class="lead">This is one realistic data science take-home assignment worked end to end in R. You start from a single messy orders export and move through 15 graded steps: fixing types, handling missing values, deriving revenue, joining a cost lookup, answering stakeholder questions, and fitting a regression. Every step rebuilds its own data, so you can start anywhere, and every solution stays hidden until you try.</p>

A take-home assignment is not a syntax quiz. It hands you a flawed dataset and a vague brief, then judges how you clean, reason, and communicate. This simulator recreates that arc on one small orders table. The steps build on each other, but each starter reconstructs the data deterministically from a seed, so you can jump to any step and run it cold. Work top to bottom the first time, then use individual steps as drills. Attempt each in the console before revealing the solution.

```r title="Run this once before any exercise"
library(dplyr)

# The raw orders export the client sent. Every exercise below rebuilds this
# same seeded block so you can start at any step cold.
set.seed(2024)
n <- 30
orders <- data.frame(
  order_id   = sprintf("ORD-%03d", 1:n),
  order_date = as.character(as.Date("2023-01-06") + sample(0:170, n, replace = TRUE)),
  region     = sample(c("North","South","East","West"), n, replace = TRUE),
  category   = sample(c("Widgets","Gadgets","Gizmos"), n, replace = TRUE),
  units      = as.character(sample(1:40, n, replace = TRUE)),
  unit_price = round(runif(n, 5, 55), 2),
  stringsAsFactors = FALSE
)
orders$units[c(7, 19)] <- NA                       # two orders lost their unit count
orders$unit_price[23]  <- -orders$unit_price[23]   # one price was keyed as negative
```

## Section 1. Load and inspect the raw export (3 problems)

### Exercise 1.1: Confirm the shape of the raw export

**Task:** The client hands you the orders export as a single data frame. Before analysing anything, a reviewer expects you to confirm how much data actually arrived. Report the number of rows and columns in the raw `orders` frame as a named vector and save it to `ex_1_1`.

**Expected result:**

```
#> rows cols 
#>   30    6 
```

**Difficulty:** Beginner

[HINTS]
Every analysis opens by checking how much data you received; two base functions report the row and the column counts.
Combine `nrow(orders)` and `ncol(orders)` into `c(rows = ..., cols = ...)`.

```r title="Your turn"
set.seed(2024)
n <- 30
orders <- data.frame(
  order_id   = sprintf("ORD-%03d", 1:n),
  order_date = as.character(as.Date("2023-01-06") + sample(0:170, n, replace = TRUE)),
  region     = sample(c("North","South","East","West"), n, replace = TRUE),
  category   = sample(c("Widgets","Gadgets","Gizmos"), n, replace = TRUE),
  units      = as.character(sample(1:40, n, replace = TRUE)),
  unit_price = round(runif(n, 5, 55), 2),
  stringsAsFactors = FALSE
)
orders$units[c(7, 19)] <- NA
orders$unit_price[23]  <- -orders$unit_price[23]

ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(2024)
n <- 30
orders <- data.frame(
  order_id   = sprintf("ORD-%03d", 1:n),
  order_date = as.character(as.Date("2023-01-06") + sample(0:170, n, replace = TRUE)),
  region     = sample(c("North","South","East","West"), n, replace = TRUE),
  category   = sample(c("Widgets","Gadgets","Gizmos"), n, replace = TRUE),
  units      = as.character(sample(1:40, n, replace = TRUE)),
  unit_price = round(runif(n, 5, 55), 2),
  stringsAsFactors = FALSE
)
orders$units[c(7, 19)] <- NA
orders$unit_price[23]  <- -orders$unit_price[23]

ex_1_1 <- c(rows = nrow(orders), cols = ncol(orders))
ex_1_1
#> rows cols 
#>   30    6 
```

**Explanation:** Confirming dimensions first catches a truncated download or an extra header row before either poisons your analysis. `nrow()` and `ncol()` read the frame's shape directly, and wrapping them in a named vector documents what each number means. Reviewers notice when you state the size of what you were given rather than assuming it, because a wrong row count is the quietest way an analysis goes wrong.

</details>

### Exercise 1.2: Report every column's type to spot bad imports

**Task:** A take-home reviewer wants proof that you check data types before trusting a file. Report the class of every column in the raw `orders` frame so you can spot fields that were imported as the wrong type, and save the per-column classes to `ex_1_2`.

**Expected result:**

```
#>    order_id  order_date      region    category       units  unit_price 
#> "character" "character" "character" "character" "character"   "numeric" 
```

**Difficulty:** Beginner

[HINTS]
A raw import often stores dates and counts as plain text; you want one call that reports the type of every column at once.
Apply `class` across all columns with `sapply(orders, class)`.

```r title="Your turn"
set.seed(2024)
n <- 30
orders <- data.frame(
  order_id   = sprintf("ORD-%03d", 1:n),
  order_date = as.character(as.Date("2023-01-06") + sample(0:170, n, replace = TRUE)),
  region     = sample(c("North","South","East","West"), n, replace = TRUE),
  category   = sample(c("Widgets","Gadgets","Gizmos"), n, replace = TRUE),
  units      = as.character(sample(1:40, n, replace = TRUE)),
  unit_price = round(runif(n, 5, 55), 2),
  stringsAsFactors = FALSE
)
orders$units[c(7, 19)] <- NA
orders$unit_price[23]  <- -orders$unit_price[23]

ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(2024)
n <- 30
orders <- data.frame(
  order_id   = sprintf("ORD-%03d", 1:n),
  order_date = as.character(as.Date("2023-01-06") + sample(0:170, n, replace = TRUE)),
  region     = sample(c("North","South","East","West"), n, replace = TRUE),
  category   = sample(c("Widgets","Gadgets","Gizmos"), n, replace = TRUE),
  units      = as.character(sample(1:40, n, replace = TRUE)),
  unit_price = round(runif(n, 5, 55), 2),
  stringsAsFactors = FALSE
)
orders$units[c(7, 19)] <- NA
orders$unit_price[23]  <- -orders$unit_price[23]

ex_1_2 <- sapply(orders, class)
ex_1_2
#>    order_id  order_date      region    category       units  unit_price 
#> "character" "character" "character" "character" "character"   "numeric" 
```

**Explanation:** `sapply()` walks each column and returns its class in a named vector, which is the fastest way to audit an import. Here `order_date` and `units` arrived as `"character"`, so date arithmetic and any multiplication would fail or silently coerce. This is the single most common take-home data issue, and flagging it early tells the reviewer you will not blindly trust `read.csv()` output.

</details>

### Exercise 1.3: Count missing values in every column

**Task:** Before cleaning, quantify the damage so you know where to focus. Count how many missing values sit in each column of the raw `orders` frame, returning one count per column, and save the per-column missing totals to `ex_1_3`.

**Expected result:**

```
#>   order_id order_date     region   category      units unit_price 
#>          0          0          0          0          2          0 
```

**Difficulty:** Intermediate

[HINTS]
You want one number per column: how many entries are unavailable. Think of testing each value for missingness and summing the results.
Use `sapply(orders, function(x) sum(is.na(x)))`.

```r title="Your turn"
set.seed(2024)
n <- 30
orders <- data.frame(
  order_id   = sprintf("ORD-%03d", 1:n),
  order_date = as.character(as.Date("2023-01-06") + sample(0:170, n, replace = TRUE)),
  region     = sample(c("North","South","East","West"), n, replace = TRUE),
  category   = sample(c("Widgets","Gadgets","Gizmos"), n, replace = TRUE),
  units      = as.character(sample(1:40, n, replace = TRUE)),
  unit_price = round(runif(n, 5, 55), 2),
  stringsAsFactors = FALSE
)
orders$units[c(7, 19)] <- NA
orders$unit_price[23]  <- -orders$unit_price[23]

ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(2024)
n <- 30
orders <- data.frame(
  order_id   = sprintf("ORD-%03d", 1:n),
  order_date = as.character(as.Date("2023-01-06") + sample(0:170, n, replace = TRUE)),
  region     = sample(c("North","South","East","West"), n, replace = TRUE),
  category   = sample(c("Widgets","Gadgets","Gizmos"), n, replace = TRUE),
  units      = as.character(sample(1:40, n, replace = TRUE)),
  unit_price = round(runif(n, 5, 55), 2),
  stringsAsFactors = FALSE
)
orders$units[c(7, 19)] <- NA
orders$unit_price[23]  <- -orders$unit_price[23]

ex_1_3 <- sapply(orders, function(x) sum(is.na(x)))
ex_1_3
#>   order_id order_date     region   category      units unit_price 
#>          0          0          0          0          2          0 
```

**Explanation:** `is.na()` returns a logical vector, and `sum()` counts the `TRUE` values because logicals coerce to 1 and 0, so `sum(is.na(x))` is the idiomatic missing-count. Only `units` is affected, with two gaps. Knowing the count before you act prevents overreacting: two missing rows out of thirty is an imputation decision, whereas twenty would be a data-quality escalation to the client.

</details>

## Section 2. Fix types and data-quality issues (3 problems)

### Exercise 2.1: Convert the date and unit columns to proper types

**Task:** The reviewer cannot compute revenue or plot a trend while dates and counts are stored as text. Convert `order_date` to a Date and `units` to an integer in the raw `orders` frame, then report the class of every column to confirm the fix, and save the resulting classes to `ex_2_1`.

**Expected result:**

```
#>    order_id  order_date      region    category       units  unit_price 
#> "character"      "Date" "character" "character"   "integer"   "numeric" 
```

**Difficulty:** Intermediate

[HINTS]
Two columns need coercing: one to a calendar type and one to a whole-number type, and base R has a dedicated conversion function for each.
Assign `as.Date(orders$order_date)` and `as.integer(orders$units)` back onto their columns, then call `sapply(orders, class)`.

```r title="Your turn"
set.seed(2024)
n <- 30
orders <- data.frame(
  order_id   = sprintf("ORD-%03d", 1:n),
  order_date = as.character(as.Date("2023-01-06") + sample(0:170, n, replace = TRUE)),
  region     = sample(c("North","South","East","West"), n, replace = TRUE),
  category   = sample(c("Widgets","Gadgets","Gizmos"), n, replace = TRUE),
  units      = as.character(sample(1:40, n, replace = TRUE)),
  unit_price = round(runif(n, 5, 55), 2),
  stringsAsFactors = FALSE
)
orders$units[c(7, 19)] <- NA
orders$unit_price[23]  <- -orders$unit_price[23]

ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(2024)
n <- 30
orders <- data.frame(
  order_id   = sprintf("ORD-%03d", 1:n),
  order_date = as.character(as.Date("2023-01-06") + sample(0:170, n, replace = TRUE)),
  region     = sample(c("North","South","East","West"), n, replace = TRUE),
  category   = sample(c("Widgets","Gadgets","Gizmos"), n, replace = TRUE),
  units      = as.character(sample(1:40, n, replace = TRUE)),
  unit_price = round(runif(n, 5, 55), 2),
  stringsAsFactors = FALSE
)
orders$units[c(7, 19)] <- NA
orders$unit_price[23]  <- -orders$unit_price[23]

orders$order_date <- as.Date(orders$order_date)
orders$units      <- as.integer(orders$units)
ex_2_1 <- sapply(orders, class)
ex_2_1
#>    order_id  order_date      region    category       units  unit_price 
#> "character"      "Date" "character" "character"   "integer"   "numeric" 
```

**Explanation:** `as.Date()` parses the ISO `YYYY-MM-DD` strings into a real Date so you can subtract dates and extract months, while `as.integer()` turns `"19"` into `19` and quietly leaves the missing values as `NA`. Type-fixing before analysis is non-negotiable: a date left as text sorts alphabetically and a count left as text cannot be multiplied, so both would derail the revenue work that follows.

</details>

### Exercise 2.2: Find the impossible negative price

**Task:** Scanning the numbers, you suspect a data-entry error. Find every row of the raw `orders` frame whose `unit_price` is negative, keeping only the order id and price so you can flag it back to the client, and save the offending rows to `ex_2_2`.

**Expected result:**

```
#>    order_id unit_price
#> 23  ORD-023     -20.06
```

**Difficulty:** Intermediate

[HINTS]
A price below zero cannot be real, so filter the rows on that condition and keep only the identifying columns.
Subset with `orders[orders$unit_price < 0, c("order_id", "unit_price")]`.

```r title="Your turn"
set.seed(2024)
n <- 30
orders <- data.frame(
  order_id   = sprintf("ORD-%03d", 1:n),
  order_date = as.character(as.Date("2023-01-06") + sample(0:170, n, replace = TRUE)),
  region     = sample(c("North","South","East","West"), n, replace = TRUE),
  category   = sample(c("Widgets","Gadgets","Gizmos"), n, replace = TRUE),
  units      = as.character(sample(1:40, n, replace = TRUE)),
  unit_price = round(runif(n, 5, 55), 2),
  stringsAsFactors = FALSE
)
orders$units[c(7, 19)] <- NA
orders$unit_price[23]  <- -orders$unit_price[23]

ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(2024)
n <- 30
orders <- data.frame(
  order_id   = sprintf("ORD-%03d", 1:n),
  order_date = as.character(as.Date("2023-01-06") + sample(0:170, n, replace = TRUE)),
  region     = sample(c("North","South","East","West"), n, replace = TRUE),
  category   = sample(c("Widgets","Gadgets","Gizmos"), n, replace = TRUE),
  units      = as.character(sample(1:40, n, replace = TRUE)),
  unit_price = round(runif(n, 5, 55), 2),
  stringsAsFactors = FALSE
)
orders$units[c(7, 19)] <- NA
orders$unit_price[23]  <- -orders$unit_price[23]

ex_2_2 <- orders[orders$unit_price < 0, c("order_id", "unit_price")]
ex_2_2
#>    order_id unit_price
#> 23  ORD-023     -20.06
```

**Explanation:** Logical row-subsetting keeps only the rows where the condition is `TRUE`, and naming the columns trims the output to what the client needs to correct. One order, `ORD-023`, carries a negative price, which is a sign-entry error rather than a real value. The judgment reviewers reward is that you surface and document the anomaly instead of silently deleting it, since the client owns the fix.

</details>

### Exercise 2.3: Apply the full cleaning pass and verify it

**Task:** Now assemble the whole cleaning pass: convert the types, take the absolute value of the sign-error price, and impute the two missing `units` with the median. Verify the cleaned `orders` has no missing units and no negative prices, and save the two-count check to `ex_2_3`.

**Expected result:**

```
#>   missing_units negative_prices 
#>               0               0 
```

**Difficulty:** Intermediate

[HINTS]
Chain the fixes you already identified, then prove the data is clean by counting the two problems you set out to remove.
After converting types, use `abs()` on the price and `median(..., na.rm = TRUE)` for the imputation, then count `is.na` and negatives.

```r title="Your turn"
set.seed(2024)
n <- 30
orders <- data.frame(
  order_id   = sprintf("ORD-%03d", 1:n),
  order_date = as.character(as.Date("2023-01-06") + sample(0:170, n, replace = TRUE)),
  region     = sample(c("North","South","East","West"), n, replace = TRUE),
  category   = sample(c("Widgets","Gadgets","Gizmos"), n, replace = TRUE),
  units      = as.character(sample(1:40, n, replace = TRUE)),
  unit_price = round(runif(n, 5, 55), 2),
  stringsAsFactors = FALSE
)
orders$units[c(7, 19)] <- NA
orders$unit_price[23]  <- -orders$unit_price[23]

ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(2024)
n <- 30
orders <- data.frame(
  order_id   = sprintf("ORD-%03d", 1:n),
  order_date = as.character(as.Date("2023-01-06") + sample(0:170, n, replace = TRUE)),
  region     = sample(c("North","South","East","West"), n, replace = TRUE),
  category   = sample(c("Widgets","Gadgets","Gizmos"), n, replace = TRUE),
  units      = as.character(sample(1:40, n, replace = TRUE)),
  unit_price = round(runif(n, 5, 55), 2),
  stringsAsFactors = FALSE
)
orders$units[c(7, 19)] <- NA
orders$unit_price[23]  <- -orders$unit_price[23]

orders$order_date <- as.Date(orders$order_date)
orders$units      <- as.integer(orders$units)
orders$unit_price <- abs(orders$unit_price)
orders$units[is.na(orders$units)] <- as.integer(median(orders$units, na.rm = TRUE))

ex_2_3 <- c(missing_units   = sum(is.na(orders$units)),
            negative_prices = sum(orders$unit_price < 0))
ex_2_3
#>   missing_units negative_prices 
#>               0               0 
```

**Explanation:** Taking the absolute value assumes the price magnitude was right and only its sign was mistyped, a defensible fix you would still note to the client. Median imputation fills the two gaps with a robust center that is unmoved by extreme orders, and wrapping it in `as.integer()` keeps the column a whole-number count. Ending with a verification that both problem counts are zero documents that the cleaning worked, which is exactly the rigor a reviewer looks for.

</details>

## Section 3. Derive the analytical columns (2 problems)

### Exercise 3.1: Derive revenue and report the totals

**Task:** With clean data in hand, derive the core business metric the brief cares about. Add a `revenue` column equal to `units` times `unit_price` on the cleaned `orders`, then report the total revenue and the mean revenue per order rounded to two decimals, and save the two figures to `ex_3_1`.

**Expected result:**

```
#> total_revenue    mean_order 
#>      19279.21        642.64 
```

**Difficulty:** Intermediate

[HINTS]
Revenue per order is a simple product of two columns; the summaries you need are a sum and a mean of that new column.
Create `orders$revenue <- orders$units * orders$unit_price`, then combine `sum()` and `mean()` in a named vector with `round(..., 2)`.

```r title="Your turn"
set.seed(2024)
n <- 30
orders <- data.frame(
  order_id   = sprintf("ORD-%03d", 1:n),
  order_date = as.character(as.Date("2023-01-06") + sample(0:170, n, replace = TRUE)),
  region     = sample(c("North","South","East","West"), n, replace = TRUE),
  category   = sample(c("Widgets","Gadgets","Gizmos"), n, replace = TRUE),
  units      = as.character(sample(1:40, n, replace = TRUE)),
  unit_price = round(runif(n, 5, 55), 2),
  stringsAsFactors = FALSE
)
orders$units[c(7, 19)] <- NA
orders$unit_price[23]  <- -orders$unit_price[23]
orders$order_date <- as.Date(orders$order_date)
orders$units      <- as.integer(orders$units)
orders$unit_price <- abs(orders$unit_price)
orders$units[is.na(orders$units)] <- as.integer(median(orders$units, na.rm = TRUE))

ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(2024)
n <- 30
orders <- data.frame(
  order_id   = sprintf("ORD-%03d", 1:n),
  order_date = as.character(as.Date("2023-01-06") + sample(0:170, n, replace = TRUE)),
  region     = sample(c("North","South","East","West"), n, replace = TRUE),
  category   = sample(c("Widgets","Gadgets","Gizmos"), n, replace = TRUE),
  units      = as.character(sample(1:40, n, replace = TRUE)),
  unit_price = round(runif(n, 5, 55), 2),
  stringsAsFactors = FALSE
)
orders$units[c(7, 19)] <- NA
orders$unit_price[23]  <- -orders$unit_price[23]
orders$order_date <- as.Date(orders$order_date)
orders$units      <- as.integer(orders$units)
orders$unit_price <- abs(orders$unit_price)
orders$units[is.na(orders$units)] <- as.integer(median(orders$units, na.rm = TRUE))

orders$revenue <- orders$units * orders$unit_price
ex_3_1 <- round(c(total_revenue = sum(orders$revenue),
                  mean_order    = mean(orders$revenue)), 2)
ex_3_1
#> total_revenue    mean_order 
#>      19279.21        642.64 
```

**Explanation:** Multiplying two columns is vectorised, so `units * unit_price` produces the per-order revenue in one pass without a loop. The total near 19,279 and the mean near 643 are the first headline numbers a reviewer sanity-checks, and computing them on the cleaned data is what makes them trustworthy. Had you skipped the imputation, the two missing units would have made those orders `NA` and quietly understated the total.

</details>

### Exercise 3.2: Summarize revenue by month

**Task:** The stakeholder wants a monthly revenue trend for the deck. Using the cleaned `orders` with revenue, derive a `month` label from `order_date` and total the revenue within each month, returning a tibble ordered by month, and save it to `ex_3_2`.

**Expected result:**

```
#> # A tibble: 6 × 2
#>   month   revenue
#>   <chr>     <dbl>
#> 1 2023-01   2669.
#> 2 2023-02   4775.
#> 3 2023-03   4902.
#> 4 2023-04    960.
#> 5 2023-05   4143.
#> 6 2023-06   1831.
```

**Difficulty:** Intermediate

[HINTS]
Collapse each date to its year-and-month, then aggregate revenue within those groups.
Build the label with `format(order_date, "%Y-%m")`, then `group_by(month)` and `summarise(revenue = sum(revenue))`.

```r title="Your turn"
set.seed(2024)
n <- 30
orders <- data.frame(
  order_id   = sprintf("ORD-%03d", 1:n),
  order_date = as.character(as.Date("2023-01-06") + sample(0:170, n, replace = TRUE)),
  region     = sample(c("North","South","East","West"), n, replace = TRUE),
  category   = sample(c("Widgets","Gadgets","Gizmos"), n, replace = TRUE),
  units      = as.character(sample(1:40, n, replace = TRUE)),
  unit_price = round(runif(n, 5, 55), 2),
  stringsAsFactors = FALSE
)
orders$units[c(7, 19)] <- NA
orders$unit_price[23]  <- -orders$unit_price[23]
orders$order_date <- as.Date(orders$order_date)
orders$units      <- as.integer(orders$units)
orders$unit_price <- abs(orders$unit_price)
orders$units[is.na(orders$units)] <- as.integer(median(orders$units, na.rm = TRUE))
orders$revenue <- orders$units * orders$unit_price

ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(2024)
n <- 30
orders <- data.frame(
  order_id   = sprintf("ORD-%03d", 1:n),
  order_date = as.character(as.Date("2023-01-06") + sample(0:170, n, replace = TRUE)),
  region     = sample(c("North","South","East","West"), n, replace = TRUE),
  category   = sample(c("Widgets","Gadgets","Gizmos"), n, replace = TRUE),
  units      = as.character(sample(1:40, n, replace = TRUE)),
  unit_price = round(runif(n, 5, 55), 2),
  stringsAsFactors = FALSE
)
orders$units[c(7, 19)] <- NA
orders$unit_price[23]  <- -orders$unit_price[23]
orders$order_date <- as.Date(orders$order_date)
orders$units      <- as.integer(orders$units)
orders$unit_price <- abs(orders$unit_price)
orders$units[is.na(orders$units)] <- as.integer(median(orders$units, na.rm = TRUE))
orders$revenue <- orders$units * orders$unit_price

orders$month <- format(orders$order_date, "%Y-%m")
ex_3_2 <- orders |>
  group_by(month) |>
  summarise(revenue = sum(revenue), .groups = "drop")
ex_3_2
#> # A tibble: 6 × 2
#>   month   revenue
#>   <chr>     <dbl>
#> 1 2023-01   2669.
#> 2 2023-02   4775.
#> 3 2023-03   4902.
#> 4 2023-04    960.
#> 5 2023-05   4143.
#> 6 2023-06   1831.
```

**Explanation:** `format(date, "%Y-%m")` reduces each date to a sortable month key, and `group_by()` plus `summarise()` totals revenue inside each key. April stands out as a sharp dip, the kind of pattern a stakeholder will ask about. Note that the tibble prints large values abbreviated, so `2669.` is `2669.34` shown to four significant figures; the underlying number is exact and only the display is shortened.

</details>

## Section 4. Filter, aggregate, and join a lookup (3 problems)

### Exercise 4.1: Filter to one region and total it

**Task:** The North regional manager asks only about their own numbers. From the cleaned `orders` with revenue, filter to the North region and report how many orders it had and its total revenue in a one-row summary, and save it to `ex_4_1`.

**Expected result:**

```
#>   orders revenue
#> 1     12 4738.63
```

**Difficulty:** Intermediate

[HINTS]
Keep only the rows for one region, then reduce them to a count and a revenue total.
Pipe `filter(region == "North")` into `summarise(orders = n(), revenue = sum(revenue))`.

```r title="Your turn"
set.seed(2024)
n <- 30
orders <- data.frame(
  order_id   = sprintf("ORD-%03d", 1:n),
  order_date = as.character(as.Date("2023-01-06") + sample(0:170, n, replace = TRUE)),
  region     = sample(c("North","South","East","West"), n, replace = TRUE),
  category   = sample(c("Widgets","Gadgets","Gizmos"), n, replace = TRUE),
  units      = as.character(sample(1:40, n, replace = TRUE)),
  unit_price = round(runif(n, 5, 55), 2),
  stringsAsFactors = FALSE
)
orders$units[c(7, 19)] <- NA
orders$unit_price[23]  <- -orders$unit_price[23]
orders$order_date <- as.Date(orders$order_date)
orders$units      <- as.integer(orders$units)
orders$unit_price <- abs(orders$unit_price)
orders$units[is.na(orders$units)] <- as.integer(median(orders$units, na.rm = TRUE))
orders$revenue <- orders$units * orders$unit_price

ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(2024)
n <- 30
orders <- data.frame(
  order_id   = sprintf("ORD-%03d", 1:n),
  order_date = as.character(as.Date("2023-01-06") + sample(0:170, n, replace = TRUE)),
  region     = sample(c("North","South","East","West"), n, replace = TRUE),
  category   = sample(c("Widgets","Gadgets","Gizmos"), n, replace = TRUE),
  units      = as.character(sample(1:40, n, replace = TRUE)),
  unit_price = round(runif(n, 5, 55), 2),
  stringsAsFactors = FALSE
)
orders$units[c(7, 19)] <- NA
orders$unit_price[23]  <- -orders$unit_price[23]
orders$order_date <- as.Date(orders$order_date)
orders$units      <- as.integer(orders$units)
orders$unit_price <- abs(orders$unit_price)
orders$units[is.na(orders$units)] <- as.integer(median(orders$units, na.rm = TRUE))
orders$revenue <- orders$units * orders$unit_price

ex_4_1 <- orders |>
  filter(region == "North") |>
  summarise(orders = n(), revenue = sum(revenue))
ex_4_1
#>   orders revenue
#> 1     12 4738.63
```

**Explanation:** `filter()` keeps only the North rows, and `summarise()` collapses them to a single row where `n()` counts orders and `sum()` totals revenue. Because the input is a plain data frame with no groups, the result prints in base style rather than as a tibble, which is a harmless display difference. Scoping a report to one segment on request is a routine stakeholder task, and doing it in two clear verbs keeps the logic auditable.

</details>

### Exercise 4.2: Join a cost lookup and rank categories by profit

**Task:** Finance hands you a small table of per-unit costs by category. Left-join it to the cleaned `orders`, compute each order's profit as revenue minus units times unit cost, then total profit within each category and rank the categories from most profitable, saving the result to `ex_4_2`.

**Expected result:**

```
#> # A tibble: 3 × 2
#>   category profit
#>   <chr>     <dbl>
#> 1 Gizmos    5731.
#> 2 Widgets   5065.
#> 3 Gadgets   4258.
```

**Difficulty:** Advanced

[HINTS]
Attach the cost for each order's category with a lookup join, then profit is revenue minus the total cost of the units sold.
Use `left_join(costs, by = "category")`, `mutate(profit = revenue - units * unit_cost)`, then group and `arrange(desc(profit))`.

```r title="Your turn"
set.seed(2024)
n <- 30
orders <- data.frame(
  order_id   = sprintf("ORD-%03d", 1:n),
  order_date = as.character(as.Date("2023-01-06") + sample(0:170, n, replace = TRUE)),
  region     = sample(c("North","South","East","West"), n, replace = TRUE),
  category   = sample(c("Widgets","Gadgets","Gizmos"), n, replace = TRUE),
  units      = as.character(sample(1:40, n, replace = TRUE)),
  unit_price = round(runif(n, 5, 55), 2),
  stringsAsFactors = FALSE
)
orders$units[c(7, 19)] <- NA
orders$unit_price[23]  <- -orders$unit_price[23]
orders$order_date <- as.Date(orders$order_date)
orders$units      <- as.integer(orders$units)
orders$unit_price <- abs(orders$unit_price)
orders$units[is.na(orders$units)] <- as.integer(median(orders$units, na.rm = TRUE))
orders$revenue <- orders$units * orders$unit_price

costs <- data.frame(
  category  = c("Widgets", "Gadgets", "Gizmos"),
  unit_cost = c(6.50, 11.00, 4.25)
)

ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(2024)
n <- 30
orders <- data.frame(
  order_id   = sprintf("ORD-%03d", 1:n),
  order_date = as.character(as.Date("2023-01-06") + sample(0:170, n, replace = TRUE)),
  region     = sample(c("North","South","East","West"), n, replace = TRUE),
  category   = sample(c("Widgets","Gadgets","Gizmos"), n, replace = TRUE),
  units      = as.character(sample(1:40, n, replace = TRUE)),
  unit_price = round(runif(n, 5, 55), 2),
  stringsAsFactors = FALSE
)
orders$units[c(7, 19)] <- NA
orders$unit_price[23]  <- -orders$unit_price[23]
orders$order_date <- as.Date(orders$order_date)
orders$units      <- as.integer(orders$units)
orders$unit_price <- abs(orders$unit_price)
orders$units[is.na(orders$units)] <- as.integer(median(orders$units, na.rm = TRUE))
orders$revenue <- orders$units * orders$unit_price

costs <- data.frame(
  category  = c("Widgets", "Gadgets", "Gizmos"),
  unit_cost = c(6.50, 11.00, 4.25)
)

ex_4_2 <- orders |>
  left_join(costs, by = "category") |>
  mutate(profit = revenue - units * unit_cost) |>
  group_by(category) |>
  summarise(profit = sum(profit), .groups = "drop") |>
  arrange(desc(profit))
ex_4_2
#> # A tibble: 3 × 2
#>   category profit
#>   <chr>     <dbl>
#> 1 Gizmos    5731.
#> 2 Widgets   5065.
#> 3 Gadgets   4258.
```

**Explanation:** `left_join()` attaches the matching `unit_cost` to every order by category and keeps all order rows, so nothing is dropped even if a category were absent from the cost table. Profit subtracts the cost of goods from revenue, and grouping then ranking surfaces that Gizmos lead despite Widgets being the most common category, because their low unit cost widens the margin. A left join is the safe default here precisely because it never silently discards unmatched sales.

</details>

### Exercise 4.3: Rank the regions by revenue

**Task:** For the leadership deck, rank the regions by total revenue. Using the cleaned `orders` with revenue, group by region, sum the revenue within each, and arrange the regions from highest to lowest, saving the ranked tibble to `ex_4_3`.

**Expected result:**

```
#> # A tibble: 4 × 2
#>   region revenue
#>   <chr>    <dbl>
#> 1 East     5329.
#> 2 West     5101.
#> 3 North    4739.
#> 4 South    4111.
```

**Difficulty:** Intermediate

[HINTS]
Aggregate revenue within each region, then sort the grouped result so the top region is first.
Chain `group_by(region)`, `summarise(revenue = sum(revenue))`, and `arrange(desc(revenue))`.

```r title="Your turn"
set.seed(2024)
n <- 30
orders <- data.frame(
  order_id   = sprintf("ORD-%03d", 1:n),
  order_date = as.character(as.Date("2023-01-06") + sample(0:170, n, replace = TRUE)),
  region     = sample(c("North","South","East","West"), n, replace = TRUE),
  category   = sample(c("Widgets","Gadgets","Gizmos"), n, replace = TRUE),
  units      = as.character(sample(1:40, n, replace = TRUE)),
  unit_price = round(runif(n, 5, 55), 2),
  stringsAsFactors = FALSE
)
orders$units[c(7, 19)] <- NA
orders$unit_price[23]  <- -orders$unit_price[23]
orders$order_date <- as.Date(orders$order_date)
orders$units      <- as.integer(orders$units)
orders$unit_price <- abs(orders$unit_price)
orders$units[is.na(orders$units)] <- as.integer(median(orders$units, na.rm = TRUE))
orders$revenue <- orders$units * orders$unit_price

ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(2024)
n <- 30
orders <- data.frame(
  order_id   = sprintf("ORD-%03d", 1:n),
  order_date = as.character(as.Date("2023-01-06") + sample(0:170, n, replace = TRUE)),
  region     = sample(c("North","South","East","West"), n, replace = TRUE),
  category   = sample(c("Widgets","Gadgets","Gizmos"), n, replace = TRUE),
  units      = as.character(sample(1:40, n, replace = TRUE)),
  unit_price = round(runif(n, 5, 55), 2),
  stringsAsFactors = FALSE
)
orders$units[c(7, 19)] <- NA
orders$unit_price[23]  <- -orders$unit_price[23]
orders$order_date <- as.Date(orders$order_date)
orders$units      <- as.integer(orders$units)
orders$unit_price <- abs(orders$unit_price)
orders$units[is.na(orders$units)] <- as.integer(median(orders$units, na.rm = TRUE))
orders$revenue <- orders$units * orders$unit_price

ex_4_3 <- orders |>
  group_by(region) |>
  summarise(revenue = sum(revenue), .groups = "drop") |>
  arrange(desc(revenue))
ex_4_3
#> # A tibble: 4 × 2
#>   region revenue
#>   <chr>    <dbl>
#> 1 East     5329.
#> 2 West     5101.
#> 3 North    4739.
#> 4 South    4111.
```

**Explanation:** Grouping by region and summing gives one revenue total per region, and `arrange(desc())` puts the leader on top so the deck reads at a glance. East edges out West by a slim margin, a gap small enough that you would caution the stakeholder against over-reading it on only thirty orders. Grouped-summarise-then-arrange is the workhorse pattern behind almost every ranked report you will produce.

</details>

## Section 5. Answer the stakeholder questions (2 problems)

### Exercise 5.1: Pull the top three orders by revenue

**Task:** A sales lead asks which individual orders were the biggest wins. From the cleaned `orders` with revenue, return the three highest-revenue orders showing their id, region, category, and revenue, ordered from largest, and save the top three to `ex_5_1`.

**Expected result:**

```
#>   order_id region category revenue
#> 1  ORD-014   East  Gadgets 1600.20
#> 2  ORD-027   West   Gizmos 1451.80
#> 3  ORD-016  South  Widgets 1437.15
```

**Difficulty:** Intermediate

[HINTS]
Sort the orders by revenue in descending order and keep only the first few rows.
Chain `arrange(desc(revenue))`, `select(order_id, region, category, revenue)`, and `head(3)`.

```r title="Your turn"
set.seed(2024)
n <- 30
orders <- data.frame(
  order_id   = sprintf("ORD-%03d", 1:n),
  order_date = as.character(as.Date("2023-01-06") + sample(0:170, n, replace = TRUE)),
  region     = sample(c("North","South","East","West"), n, replace = TRUE),
  category   = sample(c("Widgets","Gadgets","Gizmos"), n, replace = TRUE),
  units      = as.character(sample(1:40, n, replace = TRUE)),
  unit_price = round(runif(n, 5, 55), 2),
  stringsAsFactors = FALSE
)
orders$units[c(7, 19)] <- NA
orders$unit_price[23]  <- -orders$unit_price[23]
orders$order_date <- as.Date(orders$order_date)
orders$units      <- as.integer(orders$units)
orders$unit_price <- abs(orders$unit_price)
orders$units[is.na(orders$units)] <- as.integer(median(orders$units, na.rm = TRUE))
orders$revenue <- orders$units * orders$unit_price

ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(2024)
n <- 30
orders <- data.frame(
  order_id   = sprintf("ORD-%03d", 1:n),
  order_date = as.character(as.Date("2023-01-06") + sample(0:170, n, replace = TRUE)),
  region     = sample(c("North","South","East","West"), n, replace = TRUE),
  category   = sample(c("Widgets","Gadgets","Gizmos"), n, replace = TRUE),
  units      = as.character(sample(1:40, n, replace = TRUE)),
  unit_price = round(runif(n, 5, 55), 2),
  stringsAsFactors = FALSE
)
orders$units[c(7, 19)] <- NA
orders$unit_price[23]  <- -orders$unit_price[23]
orders$order_date <- as.Date(orders$order_date)
orders$units      <- as.integer(orders$units)
orders$unit_price <- abs(orders$unit_price)
orders$units[is.na(orders$units)] <- as.integer(median(orders$units, na.rm = TRUE))
orders$revenue <- orders$units * orders$unit_price

ex_5_1 <- orders |>
  arrange(desc(revenue)) |>
  select(order_id, region, category, revenue) |>
  head(3)
ex_5_1
#>   order_id region category revenue
#> 1  ORD-014   East  Gadgets 1600.20
#> 2  ORD-027   West   Gizmos 1451.80
#> 3  ORD-016  South  Widgets 1437.15
```

**Explanation:** Sorting descending and taking the first three rows is the standard top-N idiom, and `select()` trims the columns to what the sales lead cares about. The biggest order, `ORD-014`, cleared 1,600 in revenue. On a small sample these leaders can be noisy, so a careful analyst reports them as the largest observed orders rather than as a durable pattern, and would revisit the ranking as more data arrives.

</details>

### Exercise 5.2: Compare first-half and second-half revenue

**Task:** The stakeholder asks whether business slowed after the spring. Split the cleaned `orders` into the earlier months (January to March) and the later months (April to June), total revenue in each half, and report both totals plus the percent change, saving them to `ex_5_2`.

**Expected result:**

```
#>         H1         H2 pct_change 
#>   12344.80    6934.41     -43.83 
```

**Difficulty:** Advanced

[HINTS]
Partition the orders by whether their month falls in the earlier or later half, then compare the two revenue totals as a percentage swing.
Build the month label, sum revenue where `month <= "2023-03"` versus above it, then compute `100 * (H2 - H1) / H1`.

```r title="Your turn"
set.seed(2024)
n <- 30
orders <- data.frame(
  order_id   = sprintf("ORD-%03d", 1:n),
  order_date = as.character(as.Date("2023-01-06") + sample(0:170, n, replace = TRUE)),
  region     = sample(c("North","South","East","West"), n, replace = TRUE),
  category   = sample(c("Widgets","Gadgets","Gizmos"), n, replace = TRUE),
  units      = as.character(sample(1:40, n, replace = TRUE)),
  unit_price = round(runif(n, 5, 55), 2),
  stringsAsFactors = FALSE
)
orders$units[c(7, 19)] <- NA
orders$unit_price[23]  <- -orders$unit_price[23]
orders$order_date <- as.Date(orders$order_date)
orders$units      <- as.integer(orders$units)
orders$unit_price <- abs(orders$unit_price)
orders$units[is.na(orders$units)] <- as.integer(median(orders$units, na.rm = TRUE))
orders$revenue <- orders$units * orders$unit_price

ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(2024)
n <- 30
orders <- data.frame(
  order_id   = sprintf("ORD-%03d", 1:n),
  order_date = as.character(as.Date("2023-01-06") + sample(0:170, n, replace = TRUE)),
  region     = sample(c("North","South","East","West"), n, replace = TRUE),
  category   = sample(c("Widgets","Gadgets","Gizmos"), n, replace = TRUE),
  units      = as.character(sample(1:40, n, replace = TRUE)),
  unit_price = round(runif(n, 5, 55), 2),
  stringsAsFactors = FALSE
)
orders$units[c(7, 19)] <- NA
orders$unit_price[23]  <- -orders$unit_price[23]
orders$order_date <- as.Date(orders$order_date)
orders$units      <- as.integer(orders$units)
orders$unit_price <- abs(orders$unit_price)
orders$units[is.na(orders$units)] <- as.integer(median(orders$units, na.rm = TRUE))
orders$revenue <- orders$units * orders$unit_price

orders$month <- format(orders$order_date, "%Y-%m")
h1 <- sum(orders$revenue[orders$month <= "2023-03"])
h2 <- sum(orders$revenue[orders$month >  "2023-03"])
ex_5_2 <- round(c(H1 = h1, H2 = h2, pct_change = 100 * (h2 - h1) / h1), 2)
ex_5_2
#>         H1         H2 pct_change 
#>   12344.80    6934.41     -43.83 
```

**Explanation:** Because the `"%Y-%m"` labels sort the same way as real dates, a plain string comparison against `"2023-03"` cleanly splits the year into halves without any date arithmetic. Revenue fell about 44 percent from the first half to the second, which is the kind of period delta a stakeholder acts on immediately. Reporting the direction and the size of the change together, rather than two raw totals, is what turns a number into a decision.

</details>

## Section 6. Model and headline numbers (2 problems)

### Exercise 6.1: Fit and read a revenue-on-units regression

**Task:** To quantify how order size drives revenue, fit a linear model of `revenue` on `units` using the cleaned `orders`, then extract the coefficient table rounded to four decimals so you can interpret the slope and its significance, and save the table to `ex_6_1`.

**Expected result:**

```
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept) -30.8857   109.6739 -0.2816   0.7803
#> units        33.6763     4.7651  7.0672   0.0000
```

**Difficulty:** Advanced

[HINTS]
Regress revenue on units, then the summary's coefficient table gives the estimate, its standard error, a t statistic, and a p-value.
Fit with `lm(revenue ~ units, data = orders)` and pull `coef(summary(model))`.

```r title="Your turn"
set.seed(2024)
n <- 30
orders <- data.frame(
  order_id   = sprintf("ORD-%03d", 1:n),
  order_date = as.character(as.Date("2023-01-06") + sample(0:170, n, replace = TRUE)),
  region     = sample(c("North","South","East","West"), n, replace = TRUE),
  category   = sample(c("Widgets","Gadgets","Gizmos"), n, replace = TRUE),
  units      = as.character(sample(1:40, n, replace = TRUE)),
  unit_price = round(runif(n, 5, 55), 2),
  stringsAsFactors = FALSE
)
orders$units[c(7, 19)] <- NA
orders$unit_price[23]  <- -orders$unit_price[23]
orders$order_date <- as.Date(orders$order_date)
orders$units      <- as.integer(orders$units)
orders$unit_price <- abs(orders$unit_price)
orders$units[is.na(orders$units)] <- as.integer(median(orders$units, na.rm = TRUE))
orders$revenue <- orders$units * orders$unit_price

ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(2024)
n <- 30
orders <- data.frame(
  order_id   = sprintf("ORD-%03d", 1:n),
  order_date = as.character(as.Date("2023-01-06") + sample(0:170, n, replace = TRUE)),
  region     = sample(c("North","South","East","West"), n, replace = TRUE),
  category   = sample(c("Widgets","Gadgets","Gizmos"), n, replace = TRUE),
  units      = as.character(sample(1:40, n, replace = TRUE)),
  unit_price = round(runif(n, 5, 55), 2),
  stringsAsFactors = FALSE
)
orders$units[c(7, 19)] <- NA
orders$unit_price[23]  <- -orders$unit_price[23]
orders$order_date <- as.Date(orders$order_date)
orders$units      <- as.integer(orders$units)
orders$unit_price <- abs(orders$unit_price)
orders$units[is.na(orders$units)] <- as.integer(median(orders$units, na.rm = TRUE))
orders$revenue <- orders$units * orders$unit_price

ex_6_1 <- round(coef(summary(lm(revenue ~ units, data = orders))), 4)
ex_6_1
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept) -30.8857   109.6739 -0.2816   0.7803
#> units        33.6763     4.7651  7.0672   0.0000
```

**Explanation:** The slope of about 33.7 means each additional unit sold adds roughly 33.7 in revenue on average, which is close to the mean unit price and therefore a sensible sanity check. Its tiny p-value confirms units strongly predict revenue, while the intercept is not significant and has no real meaning at zero units. Reading a coefficient table, not just fitting the model, is what a take-home reviewer actually grades.

</details>

### Exercise 6.2: Assemble the headline numbers a reviewer checks

**Task:** Finish the take-home with the summary a hiring reviewer scans first. From the cleaned `orders`, assemble a one-row table of the number of clean orders, total revenue, total profit using the same cost lookup, and the top region by revenue, and save it to `ex_6_2`.

**Expected result:**

```
#> # A tibble: 1 × 4
#>   clean_orders total_revenue total_profit top_region
#>          <int>         <dbl>        <dbl> <chr>     
#> 1           30        19279.       15053. East      
```

**Difficulty:** Intermediate

[HINTS]
Roll the whole analysis into a single headline row: a count, two money totals, and the leading region.
Combine `nrow`, `sum(revenue)`, the joined `sum(profit)`, and the top region from an arranged summary into one `tibble()`.

```r title="Your turn"
set.seed(2024)
n <- 30
orders <- data.frame(
  order_id   = sprintf("ORD-%03d", 1:n),
  order_date = as.character(as.Date("2023-01-06") + sample(0:170, n, replace = TRUE)),
  region     = sample(c("North","South","East","West"), n, replace = TRUE),
  category   = sample(c("Widgets","Gadgets","Gizmos"), n, replace = TRUE),
  units      = as.character(sample(1:40, n, replace = TRUE)),
  unit_price = round(runif(n, 5, 55), 2),
  stringsAsFactors = FALSE
)
orders$units[c(7, 19)] <- NA
orders$unit_price[23]  <- -orders$unit_price[23]
orders$order_date <- as.Date(orders$order_date)
orders$units      <- as.integer(orders$units)
orders$unit_price <- abs(orders$unit_price)
orders$units[is.na(orders$units)] <- as.integer(median(orders$units, na.rm = TRUE))
orders$revenue <- orders$units * orders$unit_price

costs <- data.frame(
  category  = c("Widgets", "Gadgets", "Gizmos"),
  unit_cost = c(6.50, 11.00, 4.25)
)

ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(2024)
n <- 30
orders <- data.frame(
  order_id   = sprintf("ORD-%03d", 1:n),
  order_date = as.character(as.Date("2023-01-06") + sample(0:170, n, replace = TRUE)),
  region     = sample(c("North","South","East","West"), n, replace = TRUE),
  category   = sample(c("Widgets","Gadgets","Gizmos"), n, replace = TRUE),
  units      = as.character(sample(1:40, n, replace = TRUE)),
  unit_price = round(runif(n, 5, 55), 2),
  stringsAsFactors = FALSE
)
orders$units[c(7, 19)] <- NA
orders$unit_price[23]  <- -orders$unit_price[23]
orders$order_date <- as.Date(orders$order_date)
orders$units      <- as.integer(orders$units)
orders$unit_price <- abs(orders$unit_price)
orders$units[is.na(orders$units)] <- as.integer(median(orders$units, na.rm = TRUE))
orders$revenue <- orders$units * orders$unit_price

costs <- data.frame(
  category  = c("Widgets", "Gadgets", "Gizmos"),
  unit_cost = c(6.50, 11.00, 4.25)
)

prof <- orders |>
  left_join(costs, by = "category") |>
  mutate(profit = revenue - units * unit_cost)
top_region <- orders |>
  group_by(region) |>
  summarise(revenue = sum(revenue), .groups = "drop") |>
  arrange(desc(revenue)) |>
  slice(1) |>
  pull(region)
ex_6_2 <- tibble(
  clean_orders  = nrow(orders),
  total_revenue = round(sum(orders$revenue), 2),
  total_profit  = round(sum(prof$profit), 2),
  top_region    = top_region
)
ex_6_2
#> # A tibble: 1 × 4
#>   clean_orders total_revenue total_profit top_region
#>          <int>         <dbl>        <dbl> <chr>     
#> 1           30        19279.       15053. East      
```

**Explanation:** A single headline row communicates the result faster than any chart: thirty clean orders, about 19,279 in revenue, roughly 15,053 in profit, and East as the leading region. Each figure traces back to an earlier step, so assembling them is really a check that your pipeline is internally consistent. Ending a take-home with a crisp, self-consistent summary is what separates a strong submission from a raw dump of intermediate tables.

</details>

## What to do next

You just ran a full take-home from raw export to headline numbers. Keep sharpening the individual skills each step drilled:

- [Data Cleaning Exercises in R](Data-Cleaning-Exercises-in-R.html) to get faster at type fixes, missing values, and impossible-value checks.
- [dplyr Exercises in R](dplyr-Exercises-in-R.html) for deeper practice with filter, mutate, and joins.
- [dplyr Group By Exercises in R](dplyr-Group-By-Exercises-in-R.html) to master the group-summarise-arrange reporting pattern.
- [Linear Regression Exercises in R](Linear-Regression-Exercises-in-R.html) to practice fitting models and reading coefficient tables.
