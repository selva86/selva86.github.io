---
title: "Data Wrangling Exercises in R: 50 Real Practice Problems"
slug: "Data-Wrangling-Exercises-in-R"
description: "Sharpen data wrangling skills with 50 real-world practice problems in R: import, clean, reshape, combine, aggregate. Hidden solutions, runnable code."
keywords: "data wrangling exercises, data wrangling in R exercises, data wrangling practice R, R data manipulation exercises, R data cleaning practice, data wrangling problems R"
mathjax: false
webr: true
date: "2026-05-11"
post_type: "EX"
sidebar_title: "Data Wrangling Exercises"
sidebar_order: 104
fr_parent: "R-Tutorial.html"
auto_link_terms: "data wrangling exercises|data wrangling practice|data wrangling in R exercises|data wrangling problems R|data manipulation exercises R"
auto_link_case_sensitive: false
target_keyword: "data wrangling exercises"
sibling_block_enabled: false
difficulty: "Intermediate"
---

# Data Wrangling Exercises in R: 50 Real Practice Problems

<p class="lead">Fifty practice problems covering the data wrangling lifecycle in R: import, inspect, clean, reshape, combine, aggregate, and ETL pipelines. Real-world scenarios with hidden solutions.</p>

```r title="Run this once before any exercise"
library(dplyr)
library(tidyr)
library(stringr)
library(readr)
library(tibble)
library(lubridate)
```

## Section 1. Import and inspection (8 problems)

### Exercise 1.1: Quick structural inspection

**Scenario:** A new dataset lands. First-thing checks: dimensions, column types, sample rows. Run all three on `airquality`.

**Difficulty:** Beginner

```r title="Your turn"
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
dim(airquality)         # rows, cols
str(airquality)         # types per column
head(airquality, 3)     # first rows
glimpse(airquality)     # tidyverse alternative
summary(airquality)     # numeric summary + NA count
```

**Explanation:** Always start with these. dim/str catches type surprises; summary reveals NAs and outliers. glimpse(tibble) is the tidyverse default; vertically rotates so wide tables remain readable.

</details>

### Exercise 1.2: Read a CSV with custom NAs

**Scenario:** A CSV uses "N/A", "missing", and "" all as missing markers. Read it, treating all three as NA.

**Difficulty:** Intermediate

```r title="Your turn"
# Simulate
write.csv(data.frame(a = c("1","2","missing","4"),
                     b = c("x","","N/A","y")), "demo.csv", row.names = FALSE)

ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- read_csv("demo.csv", na = c("", "NA", "N/A", "missing"))
ex_1_2
```

**Explanation:** read_csv's `na =` argument accepts a character vector of strings to treat as missing. Inspect after with summary() to confirm NAs were caught.

</details>

### Exercise 1.3: Read with column type override

**Scenario:** A CSV has IDs that are zero-padded ("00042"). read_csv guesses integer, dropping the zeros. Force the column to be character.

**Difficulty:** Intermediate

```r title="Your turn"
write.csv(data.frame(id = c("00042","00100"), val = c(1.5, 2.7)),
          "demo.csv", row.names = FALSE)

ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- read_csv("demo.csv", col_types = cols(id = col_character()))
ex_1_3
```

**Explanation:** col_types takes a cols() spec. Only override the columns you need; the rest are guessed. Shorthand: `col_types = "ci"` (c = character, i = integer, d = double, l = logical).

</details>

### Exercise 1.4: Detect column types

**Scenario:** Confirm what types read_csv inferred for each column.

**Difficulty:** Beginner

```r title="Your turn"
df <- tibble(a = 1:3, b = c("x","y","z"), c = c(TRUE, FALSE, TRUE))

ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_4 <- sapply(df, class)
ex_1_4
```

**Explanation:** sapply(df, class) returns a named vector of types. For tibbles, str(df) or glimpse(df) does the same visually.

</details>

### Exercise 1.5: Count NA per column

**Scenario:** Find which columns of airquality have the most NAs, sorted descending.

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_5 <- # your code here
ex_1_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_5 <- airquality |>
  summarise(across(everything(), ~ sum(is.na(.x)))) |>
  pivot_longer(everything(), names_to = "column", values_to = "na_count") |>
  arrange(desc(na_count))

ex_1_5
```

**Explanation:** across applies the NA counter to every column; pivot_longer reshapes to a tidy report. Foundation for completeness audits.

</details>

### Exercise 1.6: Fast random sample for exploration

**Scenario:** A 1M-row dataset is too slow to explore interactively. Take a random sample of 5,000 rows with a seed.

**Difficulty:** Beginner

```r title="Your turn"
big <- tibble(id = 1:100000, val = rnorm(100000))

set.seed(1)
ex_1_6 <- # your code here
nrow(ex_1_6)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
ex_1_6 <- big |> slice_sample(n = 5000)
nrow(ex_1_6)
```

**Explanation:** slice_sample(n = ...) for fixed count, prop = ... for proportion. For per-group: `by =`. Always set seed for reproducibility.

</details>

### Exercise 1.7: Distinct value counts

**Scenario:** Quickly understand the cardinality of each diamonds column.

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_7 <- # your code here
ex_1_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_7 <- diamonds |>
  summarise(across(everything(), n_distinct)) |>
  pivot_longer(everything(), names_to = "column", values_to = "n_distinct")

ex_1_7
```

**Explanation:** n_distinct counts unique values. For factors and characters, this informs decisions about grouping or one-hot encoding. Combine with `summarise(across(...))` for a one-liner audit.

</details>

### Exercise 1.8: Build a column profile

**Scenario:** For each numeric column of mtcars, return min, mean, max, NA count.

**Difficulty:** Advanced

```r title="Your turn"
ex_1_8 <- # your code here
ex_1_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_8 <- mtcars |>
  summarise(across(where(is.numeric),
                   list(min = ~ min(.x, na.rm = TRUE),
                        mean = ~ mean(.x, na.rm = TRUE),
                        max = ~ max(.x, na.rm = TRUE),
                        n_na = ~ sum(is.na(.x))),
                   .names = "{.col}_{.fn}")) |>
  pivot_longer(everything(),
               names_to  = c("column","stat"),
               names_pattern = "(.*)_(min|mean|max|n_na)") |>
  pivot_wider(names_from = stat, values_from = value)

ex_1_8
```

**Explanation:** Multi-stat across with `.names`, then pivot to a tidy column-by-column profile. skimr::skim() is the production version.

</details>

## Section 2. Cleaning (10 problems)

### Exercise 2.1: Drop rows with NA in target column

**Scenario:** Drop rows where Ozone is NA from airquality.

**Difficulty:** Beginner

```r title="Your turn"
ex_2_1 <- airquality |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- airquality |>
  drop_na(Ozone)

nrow(ex_2_1)
```

**Explanation:** drop_na with no args drops any-NA rows; with named columns, only those are checked.

</details>

### Exercise 2.2: Replace NAs with column mean

**Scenario:** Impute NA values in Ozone with the column mean.

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_2 <- airquality |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- airquality |>
  mutate(Ozone = if_else(is.na(Ozone), mean(Ozone, na.rm = TRUE), Ozone))

sum(is.na(ex_2_2$Ozone))
```

**Explanation:** Compute mean with na.rm, swap in via if_else. Be aware mean imputation distorts variance; use only for quick analyses.

</details>

### Exercise 2.3: Coerce string to numeric, handling errors

**Scenario:** A column has mostly numbers but some entries like "n/a", "x". Convert to numeric; non-numeric become NA.

**Difficulty:** Intermediate

```r title="Your turn"
df <- tibble(x = c("1.5","2.7","n/a","4.2","x"))

ex_2_3 <- df |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- df |>
  mutate(x = suppressWarnings(as.numeric(x)))

ex_2_3
```

**Explanation:** as.numeric returns NA for non-numeric with a warning. Wrap in suppressWarnings if you've already accepted the conversion. readr::parse_number is more flexible (extracts numbers from "$1,234.50").

</details>

### Exercise 2.4: Trim whitespace and standardize case

**Scenario:** A name column has trailing spaces and mixed case. Standardize to title case, trimmed.

**Difficulty:** Intermediate

```r title="Your turn"
df <- tibble(name = c(" alice "," BOB","Carol  ","DAN"))

ex_2_4 <- df |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_4 <- df |>
  mutate(name = str_to_title(str_trim(name)))

ex_2_4
```

**Explanation:** str_trim removes leading/trailing whitespace; str_to_title capitalizes first letters. Always normalize text columns before grouping or joining.

</details>

### Exercise 2.5: Deduplicate by key

**Scenario:** A customer table has duplicate emails. Keep the first row per email.

**Difficulty:** Beginner

```r title="Your turn"
df <- tibble(email = c("a@x","b@x","a@x","c@x"),
             name  = c("Alice","Bob","Alice2","Carol"))

ex_2_5 <- df |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_5 <- df |>
  distinct(email, .keep_all = TRUE)

ex_2_5
```

**Explanation:** distinct(col, .keep_all = TRUE) keeps the first occurrence of each unique value, preserving all columns. Without .keep_all, only the deduping column is returned.

</details>

### Exercise 2.6: Standardize categorical labels

**Scenario:** A region column has variants: "USA", "us", "United States", "U.S.A.". Map all to "US".

**Difficulty:** Intermediate

```r title="Your turn"
df <- tibble(region = c("USA","us","United States","U.S.A.","Canada","Mexico"))

ex_2_6 <- df |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_6 <- df |>
  mutate(region = case_when(
    region %in% c("USA","us","United States","U.S.A.") ~ "US",
    TRUE ~ region
  ))

ex_2_6
```

**Explanation:** case_when handles multi-value mappings cleanly. For more complex matching, build a lookup tibble and join.

</details>

### Exercise 2.7: Detect and flag outliers

**Scenario:** Add an `is_outlier` flag to mtcars: TRUE if mpg is outside [Q1 - 1.5*IQR, Q3 + 1.5*IQR].

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_7 <- mtcars |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_7 <- mtcars |>
  mutate(is_outlier = {
    q   <- quantile(mpg, c(0.25, 0.75))
    iqr <- diff(q)
    mpg < q[1] - 1.5*iqr | mpg > q[2] + 1.5*iqr
  })

sum(ex_2_7$is_outlier)
```

**Explanation:** Tukey's fences. Block expression in mutate computes intermediate values and returns the final one. For per-group, wrap in group_by.

</details>

### Exercise 2.8: Drop rows with too many NAs

**Scenario:** Drop rows where MORE THAN half the columns are NA.

**Difficulty:** Advanced

```r title="Your turn"
df <- tibble(a = c(1, NA, 3, NA, 5),
             b = c(NA, NA, 3, NA, 5),
             c = c(1, 2, NA, NA, 5),
             d = c(1, 2, 3, NA, NA))

ex_2_8 <- df |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
threshold <- ncol(df) / 2

ex_2_8 <- df |>
  filter(rowSums(is.na(across(everything()))) <= threshold)

ex_2_8
```

**Explanation:** is.na on a tibble returns a logical tibble; rowSums counts TRUEs per row; filter keeps rows where the count is within threshold. Standard sparsity filter.

</details>

### Exercise 2.9: Cap extreme values (winsorize)

**Scenario:** Replace mpg values above the 95th percentile with the 95th percentile value.

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_9 <- mtcars |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
cap <- quantile(mtcars$mpg, 0.95)

ex_2_9 <- mtcars |>
  mutate(mpg = pmin(mpg, cap))

max(ex_2_9$mpg)
```

**Explanation:** Winsorizing caps extremes without removing rows. pmin(x, cap) takes elementwise minimum. For both tails: combine with pmax.

</details>

### Exercise 2.10: Validate against a schema

**Scenario:** Verify that age is between 0 and 120, that email contains "@", and amount is non-negative. Return rows failing any check.

**Difficulty:** Advanced

```r title="Your turn"
df <- tibble(age = c(25, -5, 130, 40),
             email = c("a@x","b","c@y","d@z"),
             amount = c(50, 80, -30, 100))

ex_2_10 <- df |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_10 <- df |>
  mutate(invalid_age = age < 0 | age > 120,
         invalid_email = !str_detect(email, "@"),
         invalid_amount = amount < 0) |>
  filter(invalid_age | invalid_email | invalid_amount)

ex_2_10
```

**Explanation:** Compute per-rule flags, then filter rows failing ANY rule. For production, the validate or pointblank packages structure this with named rules and reports.

</details>

## Section 3. Reshape (8 problems)

### Exercise 3.1: Wide to long

**Scenario:** Pivot a wide quarterly table to long format.

**Difficulty:** Beginner

```r title="Your turn"
wide <- tibble(region = c("US","EU"), Q1 = c(100,80), Q2 = c(120,90), Q3 = c(115,95), Q4 = c(130,100))

ex_3_1 <- wide |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- wide |>
  pivot_longer(Q1:Q4, names_to = "quarter", values_to = "sales")

ex_3_1
```

**Explanation:** pivot_longer collapses many columns into name/value pairs. cols accepts tidyselect.

</details>

### Exercise 3.2: Long to wide

**Scenario:** Pivot a long sales table to wide format.

**Difficulty:** Beginner

```r title="Your turn"
long <- tibble(region = rep(c("US","EU"), each = 4),
               quarter = rep(c("Q1","Q2","Q3","Q4"), 2),
               sales = c(100, 120, 115, 130, 80, 90, 95, 100))

ex_3_2 <- long |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- long |>
  pivot_wider(names_from = quarter, values_from = sales)

ex_3_2
```

**Explanation:** pivot_wider expands each names_from value into a column with values_from values placed.

</details>

### Exercise 3.3: Pivot longer with names_pattern

**Scenario:** Columns are named `revenue_2023`, `revenue_2024`. Pivot to long with separate `metric` and `year` columns.

**Difficulty:** Intermediate

```r title="Your turn"
df <- tibble(id = 1:3, revenue_2023 = c(100,200,300), revenue_2024 = c(110,220,330))

ex_3_3 <- df |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- df |>
  pivot_longer(-id,
               names_to = c("metric","year"),
               names_pattern = "(\\w+)_(\\d+)",
               values_to = "value")

ex_3_3
```

**Explanation:** names_pattern with capture groups splits column names into multiple new columns. Useful when wide column names encode multiple variables.

</details>

### Exercise 3.4: Separate a single column

**Scenario:** A column "address" contains "123 Main St, Boston, MA". Split into number, street, city, state.

**Difficulty:** Intermediate

```r title="Your turn"
df <- tibble(address = c("123 Main St, Boston, MA","42 Oak Rd, Austin, TX"))

ex_3_4 <- df |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_4 <- df |>
  separate_wider_regex(address,
                       patterns = c(number = "\\d+", " ",
                                    street = "[^,]+", ", ",
                                    city = "[^,]+", ", ",
                                    state = "[A-Z]{2}"))

ex_3_4
```

**Explanation:** separate_wider_regex specifies a regex per output column, with separators in between. tidyr 1.3+. Cleaner than chained separate calls.

</details>

### Exercise 3.5: Unite columns

**Scenario:** Combine year, month, day columns into a single ISO date string.

**Difficulty:** Beginner

```r title="Your turn"
df <- tibble(year = c(2024, 2024), month = c("01","02"), day = c("15","20"))

ex_3_5 <- df |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_5 <- df |>
  unite("date", year, month, day, sep = "-")

ex_3_5
```

**Explanation:** unite is the inverse of separate. sep is the joining character. By default removes the source columns; use remove = FALSE to keep.

</details>

### Exercise 3.6: Pivot wider with multiple value columns

**Scenario:** A long table has columns `id`, `metric`, `mean`, `sd`. Pivot wide so each metric becomes two columns: `<metric>_mean`, `<metric>_sd`.

**Difficulty:** Advanced

```r title="Your turn"
long <- tibble(id = c(1,1,2,2),
               metric = c("a","b","a","b"),
               mean = c(10,20,30,40),
               sd = c(1,2,3,4))

ex_3_6 <- long |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_6 <- long |>
  pivot_wider(names_from = metric, values_from = c(mean, sd))

ex_3_6
```

**Explanation:** Pass a vector to values_from for multi-value pivots. Resulting column names combine: `mean_a`, `mean_b`, `sd_a`, `sd_b`.

</details>

### Exercise 3.7: Complete missing combinations

**Scenario:** Fill in missing month entries per region with sales = 0.

**Difficulty:** Intermediate

```r title="Your turn"
df <- tibble(region = c("US","US","EU","ASIA","ASIA"),
             month  = c(1, 2, 1, 1, 2),
             sales  = c(100,120, 80, 60, 70))

ex_3_7 <- df |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_7 <- df |>
  complete(region, month = 1:3, fill = list(sales = 0))

ex_3_7
```

**Explanation:** complete generates the full grid of region x month, filling missing with the supplied default. Crucial for time-series and panel data integrity.

</details>

### Exercise 3.8: Nest and unnest

**Scenario:** Group iris by Species and nest the data, then unnest back.

**Difficulty:** Intermediate

```r title="Your turn"
nested <- iris |> group_by(Species) |> nest()

ex_3_8 <- nested |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_8 <- nested |>
  unnest(data)

nrow(ex_3_8)
```

**Explanation:** nest creates a list-column per group; unnest expands it back. Round-trip is lossless. Foundation of "many models" workflows.

</details>

## Section 4. Combine — joins, bind (8 problems)

### Exercise 4.1: Left join

**Scenario:** Customers and orders. Left join orders to customers.

**Difficulty:** Beginner

```r title="Your turn"
customers <- tibble(id = 1:3, name = c("A","B","C"))
orders    <- tibble(customer_id = c(1,1,2), amount = c(50,80,30))

ex_4_1 <- customers |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- customers |>
  left_join(orders, by = c("id" = "customer_id"))

ex_4_1
```

**Explanation:** left_join keeps all left rows. The named-vector `by` handles different key names.

</details>

### Exercise 4.2: Anti-join for orphans

**Scenario:** Find orders with no matching customer.

**Difficulty:** Intermediate

```r title="Your turn"
customers <- tibble(id = 1:3, name = c("A","B","C"))
orders    <- tibble(customer_id = c(1,2,7), amount = c(50,80,30))

ex_4_2 <- orders |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- orders |>
  anti_join(customers, by = c("customer_id" = "id"))

ex_4_2
```

**Explanation:** anti_join returns rows of x with NO match in y. Standard data-quality check.

</details>

### Exercise 4.3: Multi-key join

**Scenario:** Match sales to prices on (region, product).

**Difficulty:** Intermediate

```r title="Your turn"
sales <- tibble(region = c("US","EU"), product = c("X","X"), qty = c(100,50))
prices <- tibble(region = c("US","EU"), product = c("X","X"), price = c(10,12))

ex_4_3 <- sales |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- sales |>
  left_join(prices, by = c("region","product")) |>
  mutate(revenue = qty * price)

ex_4_3
```

**Explanation:** Vector `by` does multi-column matching.

</details>

### Exercise 4.4: Bind rows of multiple tibbles

**Scenario:** Three monthly reports with the same columns. Combine into one.

**Difficulty:** Beginner

```r title="Your turn"
jan <- tibble(date = "2024-01-01", sales = 100)
feb <- tibble(date = "2024-02-01", sales = 120)
mar <- tibble(date = "2024-03-01", sales = 110)

ex_4_4 <- # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_4 <- bind_rows(jan, feb, mar)
ex_4_4

# Or: bind_rows(list(jan, feb, mar), .id = "source")
```

**Explanation:** bind_rows concatenates row-wise. With .id, adds a column tagging which input each row came from.

</details>

### Exercise 4.5: Bind columns side by side

**Scenario:** Two tibbles with the same number of rows. Side-by-side combine.

**Difficulty:** Beginner

```r title="Your turn"
a <- tibble(x = 1:3, y = c("a","b","c"))
b <- tibble(z = c(10,20,30))

ex_4_5 <- # your code here
ex_4_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_5 <- bind_cols(a, b)
ex_4_5
```

**Explanation:** bind_cols requires matching row counts. Be cautious: it does NOT align by key, just by row position.

</details>

### Exercise 4.6: Full join with coalesce

**Scenario:** Two snapshots of customer scores. Take all customers, prefer current scores when present, else previous.

**Difficulty:** Advanced

```r title="Your turn"
prev <- tibble(id = c(1,2,3), score = c(10,20,30))
curr <- tibble(id = c(2,3,4), score = c(25,NA,40))

ex_4_6 <- # your code here
ex_4_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_6 <- prev |>
  full_join(curr, by = "id", suffix = c("_prev","_curr")) |>
  mutate(score = coalesce(score_curr, score_prev)) |>
  select(id, score) |>
  arrange(id)

ex_4_6
```

**Explanation:** full_join gives every id; coalesce prefers the first non-NA argument. Standard "upsert" pattern.

</details>

### Exercise 4.7: Inequality (rolling) join

**Scenario:** Map each transaction amount to the highest tier whose threshold is below or equal to it.

**Difficulty:** Advanced

```r title="Your turn"
txns <- tibble(id = 1:4, amount = c(50, 200, 1500, 9000))
tiers <- tibble(min_amount = c(0, 100, 1000, 5000),
                tier       = c("micro","small","medium","large"))

ex_4_7 <- txns |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_7 <- txns |>
  left_join(tiers, by = join_by(closest(amount >= min_amount)))

ex_4_7
```

**Explanation:** dplyr 1.1+ join_by with closest supports inequality joins. Same pattern works for time-window matches.

</details>

### Exercise 4.8: Find common and divergent rows

**Scenario:** Compare two snapshots of a customer table. Report which IDs are added (in curr only), removed (in prev only), and unchanged.

**Difficulty:** Advanced

```r title="Your turn"
prev <- tibble(id = 1:5, val = c(10,20,30,40,50))
curr <- tibble(id = c(1,2,4,5,6), val = c(10,20,40,55,60))

added   <- # your code here
removed <- # your code here
changed <- # your code here

list(added = added, removed = removed, changed = changed)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
added   <- curr |> anti_join(prev, by = "id")
removed <- prev |> anti_join(curr, by = "id")
changed <- prev |>
  inner_join(curr, by = "id", suffix = c("_prev","_curr")) |>
  filter(val_prev != val_curr)

list(added = added, removed = removed, changed = changed)
```

**Explanation:** Three operations: added/removed via anti_join in both directions; changed via inner_join + filter on inequality. Standard reconciliation pattern.

</details>

## Section 5. Aggregate and summarise (8 problems)

### Exercise 5.1: Mean per group

**Scenario:** Mean mpg per cyl in mtcars.

**Difficulty:** Beginner

```r title="Your turn"
ex_5_1 <- mtcars |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- mtcars |>
  group_by(cyl) |>
  summarise(mean_mpg = mean(mpg))

ex_5_1
```

**Explanation:** Standard group + summarise. summarise collapses each group to one row.

</details>

### Exercise 5.2: Multiple stats per group

**Scenario:** Per cyl: count, mean, SD, min, max of mpg.

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_2 <- mtcars |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_2 <- mtcars |>
  group_by(cyl) |>
  summarise(n = n(), mean = mean(mpg), sd = sd(mpg),
            min = min(mpg), max = max(mpg))

ex_5_2
```

**Explanation:** Multiple aggregations in one summarise.

</details>

### Exercise 5.3: Top N per group

**Scenario:** Top 2 highest-mpg cars per cyl.

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_3 <- mtcars |>
  tibble::rownames_to_column("car") |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_3 <- mtcars |>
  tibble::rownames_to_column("car") |>
  slice_max(mpg, n = 2, by = cyl)

ex_5_3
```

**Explanation:** slice_max with `by =` is dplyr 1.1+ shortcut.

</details>

### Exercise 5.4: Count and percentage

**Scenario:** Count diamonds per cut, with percentage column.

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_4 <- diamonds |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_4 <- diamonds |>
  count(cut) |>
  mutate(pct = round(n / sum(n) * 100, 1))

ex_5_4
```

**Explanation:** count gives n; mutate adds pct from total. For per-group percentages, group_by before mutate.

</details>

### Exercise 5.5: Group filter (HAVING-style)

**Scenario:** Keep only cyl groups with at least 10 cars; report mean mpg.

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_5 <- mtcars |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_5 <- mtcars |>
  group_by(cyl) |>
  filter(n() >= 10) |>
  summarise(mean_mpg = mean(mpg), n = n())

ex_5_5
```

**Explanation:** filter inside group_by uses n() for size. Equivalent to SQL HAVING.

</details>

### Exercise 5.6: Within-group proportion

**Scenario:** For each cut, the proportion of each clarity (cells sum to 1 within cut).

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_6 <- diamonds |>
  count(cut, clarity) |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_6 <- diamonds |>
  count(cut, clarity) |>
  group_by(cut) |>
  mutate(share = n / sum(n)) |>
  ungroup()

head(ex_5_6)
```

**Explanation:** Group then mutate gives per-group denominators.

</details>

### Exercise 5.7: Weighted mean

**Scenario:** Weighted mean price by carat per cut.

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_7 <- diamonds |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_7 <- diamonds |>
  group_by(cut) |>
  summarise(weighted_price = weighted.mean(price, w = carat))

ex_5_7
```

**Explanation:** weighted.mean(x, w) gives sum(x*w)/sum(w).

</details>

### Exercise 5.8: Multi-level grouping

**Scenario:** Mean price per (cut, color) on diamonds.

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_8 <- diamonds |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_8 <- diamonds |>
  group_by(cut, color) |>
  summarise(mean_price = mean(price), .groups = "drop")

head(ex_5_8)
```

**Explanation:** Multiple group columns; .groups = "drop" releases grouping after summarise.

</details>

## Section 6. End-to-end ETL (8 problems)

### Exercise 6.1: Read, clean, aggregate

**Scenario:** Raw data has a string price like "$1,234.50". Clean and compute the mean.

**Difficulty:** Intermediate

```r title="Your turn"
df <- tibble(item = c("a","b","c","d"),
             price_raw = c("$1,234.50","$2,500.00","$890.25","$1,100.00"))

ex_6_1 <- df |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_1 <- df |>
  mutate(price = parse_number(price_raw)) |>
  summarise(mean_price = mean(price))

ex_6_1
```

**Explanation:** readr::parse_number extracts numeric content from a string, ignoring currency symbols and thousands separators.

</details>

### Exercise 6.2: Detect and remove duplicates with priority

**Scenario:** A customer table has dupes. Keep the one with the most recent updated_at per email.

**Difficulty:** Intermediate

```r title="Your turn"
df <- tibble(email = c("a@x","b@x","a@x","c@x"),
             updated_at = as.Date(c("2024-01-01","2024-02-01","2024-03-01","2024-01-15")))

ex_6_2 <- df |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_2 <- df |>
  arrange(desc(updated_at)) |>
  distinct(email, .keep_all = TRUE)

ex_6_2
```

**Explanation:** Sort by priority then distinct keeps the first per group.

</details>

### Exercise 6.3: Parse dates from mixed formats

**Scenario:** Date column has mixed "01/15/2024" and "2024-02-20" formats. Parse all to Date.

**Difficulty:** Advanced

```r title="Your turn"
df <- tibble(date_raw = c("01/15/2024","2024-02-20","03/05/2024","2024-04-10"))

ex_6_3 <- df |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_3 <- df |>
  mutate(date = as.Date(parse_date_time(date_raw, orders = c("mdy","ymd"))))

ex_6_3
```

**Explanation:** parse_date_time tries each format. Wrap with as.Date if you don't need the time component.

</details>

### Exercise 6.4: Wide to long with name parsing

**Scenario:** A wide table has columns `q1_2023`, `q2_2023`, etc. Pivot to long format with separate `quarter` and `year` columns.

**Difficulty:** Advanced

```r title="Your turn"
df <- tibble(region = c("US","EU"),
             q1_2023 = c(100, 80), q2_2023 = c(120, 90),
             q1_2024 = c(110, 85), q2_2024 = c(130, 95))

ex_6_4 <- df |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_4 <- df |>
  pivot_longer(-region,
               names_to = c("quarter","year"),
               names_pattern = "q(\\d)_(\\d{4})",
               values_to = "sales") |>
  mutate(year = as.integer(year), quarter = as.integer(quarter))

ex_6_4
```

**Explanation:** names_pattern with capture groups extracts both pieces of metadata in one pivot. Saves a separate step.

</details>

### Exercise 6.5: Join + aggregate + sort

**Scenario:** Customers + orders + products. Compute total revenue per product category, sorted descending.

**Difficulty:** Advanced

```r title="Your turn"
customers <- tibble(id = 1:3, name = c("A","B","C"))
orders    <- tibble(customer_id = c(1,1,2,3), product_id = c(101,102,101,103),
                    qty = c(2,1,3,1))
products  <- tibble(product_id = c(101,102,103), name = c("X","Y","Z"),
                    category = c("hardware","tool","tool"), price = c(10,20,30))

ex_6_5 <- # your code here
ex_6_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_5 <- orders |>
  left_join(products, by = "product_id") |>
  mutate(revenue = qty * price) |>
  group_by(category) |>
  summarise(total_revenue = sum(revenue), .groups = "drop") |>
  arrange(desc(total_revenue))

ex_6_5
```

**Explanation:** Standard ETL: join product info, derive revenue, aggregate, sort.

</details>

### Exercise 6.6: Reshape and join

**Scenario:** Wide quarterly sales table needs to be joined to a region info table. Pivot first.

**Difficulty:** Advanced

```r title="Your turn"
wide <- tibble(region = c("US","EU"), Q1 = c(100,80), Q2 = c(120,90))
info <- tibble(region = c("US","EU"), continent = c("NA","EU"))

ex_6_6 <- wide |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_6 <- wide |>
  pivot_longer(Q1:Q2, names_to = "quarter", values_to = "sales") |>
  left_join(info, by = "region")

ex_6_6
```

**Explanation:** Pivot first (long is the join-friendly shape), then join.

</details>

### Exercise 6.7: Profile a CSV programmatically

**Scenario:** Write a function that takes a tibble and returns: row count, col count, NA count, dup count, numeric col count.

**Difficulty:** Advanced

```r title="Your turn"
profile <- function(df) {
  # your code here
}

profile(airquality)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
profile <- function(df) {
  tibble(
    n_rows    = nrow(df),
    n_cols    = ncol(df),
    n_na      = sum(is.na(df)),
    n_dup     = sum(duplicated(df)),
    n_numeric = sum(sapply(df, is.numeric))
  )
}

profile(airquality)
```

**Explanation:** Reusable profiler in 5 lines. Foundation of audit reports.

</details>

### Exercise 6.8: Full ETL slice

**Scenario:** Read messy raw data, clean, derive, join with lookup, aggregate. End-to-end.

**Difficulty:** Advanced

```r title="Your turn"
raw <- tibble(
  customer = c(" Alice ","BOB","carol","alice","DAN"),
  date     = c("01/15/2024","02/20/2024","03/05/2024","01/30/2024","02/15/2024"),
  amount   = c("$50.00","$80.00","$30.00","$120.00","$45.00")
)
lookup <- tibble(customer_norm = c("alice","bob","carol","dan"),
                 segment       = c("VIP","Reg","VIP","Reg"))

ex_6_8 <- raw |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_8 <- raw |>
  mutate(customer_norm = str_to_lower(str_trim(customer)),
         date          = mdy(date),
         amount        = parse_number(amount)) |>
  left_join(lookup, by = "customer_norm") |>
  group_by(segment) |>
  summarise(total = sum(amount), n = n(), .groups = "drop") |>
  arrange(desc(total))

ex_6_8
```

**Explanation:** Five-package pipeline: stringr (clean strings), lubridate (mdy), readr (parse_number), dplyr (join + summarise + arrange), tibble. Recurs across every real ETL job.

</details>

## What to do next

After 50 problems, the wrangling lifecycle should feel automatic. Natural follow-ups:

- **Single-package hubs**: dplyr-Exercises, ggplot2-Exercises, tidyverse-Exercises (shipped) for deeper drilling.
- **Data-Cleaning-Exercises** (coming): focused on dirty-data patterns.
- **EDA-Exercises** (coming): wrangling plus the analysis layer that follows it.
