---
title: "Data Cleaning Exercises in R: 50 Real Practice Problems"
slug: "Data-Cleaning-Exercises-in-R"
description: "Master data cleaning with 50 practice problems in R: missing values, duplicates, types, outliers, validation. Hidden solutions, runnable code."
keywords: "data cleaning exercises in R, data cleaning practice R, R data cleaning problems, data cleaning in R exercises, dirty data R practice"
mathjax: false
webr: true
date: "2026-05-11"
post_type: "EX"
sidebar_title: "Data Cleaning Exercises"
sidebar_order: 116
fr_parent: "R-Tutorial.html"
auto_link_terms: "data cleaning exercises|data cleaning practice|data cleaning in R exercises|dirty data R"
auto_link_case_sensitive: false
target_keyword: "data cleaning exercises in R"
sibling_block_enabled: false
difficulty: "Intermediate"
---

# Data Cleaning Exercises in R: 50 Real Practice Problems

<p class="lead">Fifty practice problems on data cleaning in R: handling missing values, duplicates, type coercion, outliers, validation, and end-to-end cleanup pipelines.</p>

```r title="Run this once before any exercise"
library(dplyr)
library(tidyr)
library(stringr)
library(lubridate)
library(tibble)
```

## Section 1. Missing values (8 problems)

### Exercise 1.1: Total NAs

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
sum(is.na(airquality))
```

</details>

### Exercise 1.2: NAs per column

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
airquality |>
  summarise(across(everything(), ~ sum(is.na(.x))))
```

</details>

### Exercise 1.3: Drop rows with any NA

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
drop_na(airquality)
```

</details>

### Exercise 1.4: Drop rows with NA in target

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
drop_na(airquality, Ozone)
```

</details>

### Exercise 1.5: Replace NA with 0

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
airquality |> mutate(Ozone = replace_na(Ozone, 0))
```

</details>

### Exercise 1.6: Mean impute

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
airquality |>
  mutate(Ozone = if_else(is.na(Ozone), mean(Ozone, na.rm = TRUE), Ozone))
```

</details>

### Exercise 1.7: Median impute per group

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
airquality |>
  group_by(Month) |>
  mutate(Ozone = if_else(is.na(Ozone), median(Ozone, na.rm = TRUE), Ozone)) |>
  ungroup()
```

</details>

### Exercise 1.8: Forward fill

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
tibble(x = c(1, NA, NA, 4, NA, 6)) |> fill(x)
```

</details>

## Section 2. Duplicates (6 problems)

### Exercise 2.1: Count duplicate rows

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
sum(duplicated(diamonds))
```

</details>

### Exercise 2.2: Drop full duplicates

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
diamonds |> distinct()
```

</details>

### Exercise 2.3: Drop dupes by key

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
df <- tibble(email = c("a@x","b@x","a@x"), name = c("A","B","A2"))
df |> distinct(email, .keep_all = TRUE)
```

</details>

### Exercise 2.4: Detect duplicate keys

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
df <- tibble(email = c("a@x","b@x","a@x","c@x"), n = 1:4)
df |> group_by(email) |> filter(n() > 1)
```

</details>

### Exercise 2.5: Dedupe with priority rule

**Difficulty:** Advanced. Keep most recent per email.

<details><summary>Show solution</summary>

```r
df <- tibble(email = c("a@x","b@x","a@x"),
             date = as.Date(c("2024-01-01","2024-02-01","2024-03-01")))
df |> arrange(desc(date)) |> distinct(email, .keep_all = TRUE)
```

</details>

### Exercise 2.6: Fuzzy duplicates by normalized key

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
df <- tibble(name = c(" Alice ","alice","BOB","bob "))
df |> mutate(key = str_to_lower(str_trim(name))) |> distinct(key, .keep_all = TRUE)
```

</details>

## Section 3. Type coercion (8 problems)

### Exercise 3.1: Character to numeric

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
as.numeric(c("1.5","2.7","3"))
```

</details>

### Exercise 3.2: Strip currency before parsing

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
readr::parse_number("$1,234.50")
```

</details>

### Exercise 3.3: Logical from yes/no

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
v <- c("yes","no","y","n")
v %in% c("yes","y")
```

</details>

### Exercise 3.4: Date from string

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
as.Date(c("2024-01-15","2024-02-20"))
```

</details>

### Exercise 3.5: Mixed-format dates

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
parse_date_time(c("2024-01-15","01/15/2024"), orders = c("ymd","mdy"))
```

</details>

### Exercise 3.6: Factor from character

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
factor(c("low","high","med"), levels = c("low","med","high"))
```

</details>

### Exercise 3.7: Cleanup a column with mixed garbage

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
v <- c("1","2.5","abc","NA","")
suppressWarnings(as.numeric(v))   # NAs for non-numeric
```

</details>

### Exercise 3.8: Coerce all numeric-like in a tibble

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
df <- tibble(a = c("1","2","3"), b = c("x","y","z"), c = c("1.5","2.5","NA"))
df |> mutate(across(c(a, c), ~ suppressWarnings(as.numeric(.x))))
```

</details>

## Section 4. Strings cleanup (8 problems)

### Exercise 4.1: Trim whitespace

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
str_trim(c(" Alice ","Bob "))
```

</details>

### Exercise 4.2: Squish multiple spaces

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
str_squish("  hello   world  ")
```

</details>

### Exercise 4.3: Standardize case

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
str_to_lower(c("ALICE","Bob","carol"))
```

</details>

### Exercise 4.4: Remove punctuation

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
str_replace_all("Hello, world!", "[[:punct:]]", "")
```

</details>

### Exercise 4.5: Standardize categorical

**Difficulty:** Intermediate. Map "USA","us","United States" -> "US".

<details><summary>Show solution</summary>

```r
v <- c("USA","us","United States","Canada")
case_when(v %in% c("USA","us","United States","U.S.A.") ~ "US",
          TRUE ~ v)
```

</details>

### Exercise 4.6: Remove stopwords (basic)

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
stop <- c("the","a","is","to","and")
clean <- function(s) {
  words <- str_split(s, " ", simplify = TRUE)
  paste(words[!words %in% stop], collapse = " ")
}
clean("the cat is on the mat")
```

</details>

### Exercise 4.7: Detect non-ASCII

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
str_detect("café", "[^[:ascii:]]")
```

</details>

### Exercise 4.8: Normalize encoding

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
iconv("café", from = "UTF-8", to = "ASCII//TRANSLIT")
```

</details>

## Section 5. Outliers (6 problems)

### Exercise 5.1: IQR rule

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
mtcars |>
  mutate(out = {
    q <- quantile(mpg, c(0.25, 0.75))
    mpg < q[1] - 1.5*IQR(mpg) | mpg > q[2] + 1.5*IQR(mpg)
  })
```

</details>

### Exercise 5.2: Z-score rule

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
mtcars |> mutate(z = scale(mpg)[,1], out = abs(z) > 3)
```

</details>

### Exercise 5.3: Per-group outliers

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
mtcars |>
  group_by(cyl) |>
  mutate(z = scale(mpg)[,1], out = abs(z) > 2) |>
  ungroup()
```

</details>

### Exercise 5.4: Winsorize 5/95

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
q <- quantile(mtcars$mpg, c(0.05, 0.95))
mtcars |> mutate(mpg = pmin(pmax(mpg, q[1]), q[2]))
```

</details>

### Exercise 5.5: Cap at 99th percentile

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
cap <- quantile(diamonds$price, 0.99)
diamonds |> mutate(price = pmin(price, cap))
```

</details>

### Exercise 5.6: Drop outliers in target column

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
mtcars |> filter({
  q <- quantile(mpg, c(0.25, 0.75))
  mpg >= q[1] - 1.5*IQR(mpg) & mpg <= q[2] + 1.5*IQR(mpg)
})
```

</details>

## Section 6. Validation (6 problems)

### Exercise 6.1: Range check

**Difficulty:** Beginner. Age 0-120.

<details><summary>Show solution</summary>

```r
df <- tibble(age = c(25, -5, 130, 40))
df |> mutate(valid_age = age >= 0 & age <= 120)
```

</details>

### Exercise 6.2: Email contains "@"

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
df <- tibble(email = c("a@x.com","not_an_email","b@y.com"))
df |> mutate(valid = str_detect(email, "@"))
```

</details>

### Exercise 6.3: Multi-rule validation

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
df <- tibble(age = c(25, -5, 30), email = c("a@x","b","c@y"))
df |>
  mutate(valid = age >= 0 & age <= 120 & str_detect(email, "@"))
```

</details>

### Exercise 6.4: Required-non-NA check

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
df <- tibble(id = c(1, 2, NA), name = c("A","B","C"))
df |> mutate(valid = !is.na(id))
```

</details>

### Exercise 6.5: Cross-column rule

**Difficulty:** Advanced. start <= end.

<details><summary>Show solution</summary>

```r
df <- tibble(start = as.Date(c("2024-01-01","2024-03-01")),
             end   = as.Date(c("2024-02-01","2024-02-15")))
df |> mutate(valid = start <= end)
```

</details>

### Exercise 6.6: Schema-style validation report

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
df <- tibble(age = c(25, -5, 130), email = c("a@x","b","c@y"))
report <- df |>
  mutate(invalid_age = age < 0 | age > 120,
         invalid_email = !str_detect(email, "@")) |>
  filter(invalid_age | invalid_email)
report
```

</details>

## Section 7. End-to-end cleaning (8 problems)

### Exercise 7.1: Clean phone numbers

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
phones <- c("(415) 555-1234","415.555.1234","415 555 1234")
str_replace_all(phones, "\\D", "")
```

</details>

### Exercise 7.2: Standardize country names

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
v <- c("USA","us","United States","UK","United Kingdom")
case_when(v %in% c("USA","us","United States") ~ "US",
          v %in% c("UK","United Kingdom") ~ "GB",
          TRUE ~ v)
```

</details>

### Exercise 7.3: Parse currency strings

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
readr::parse_number(c("$1,234.50","€999.99","£12.34"))
```

</details>

### Exercise 7.4: Pivot then clean

**Difficulty:** Advanced. Wide -> long -> drop NAs.

<details><summary>Show solution</summary>

```r
wide <- tibble(id = 1:2, a = c(1, NA), b = c(2, 3))
wide |> pivot_longer(-id, values_drop_na = TRUE)
```

</details>

### Exercise 7.5: Trim and lowercase a key column

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
df <- tibble(name = c(" Alice ","BOB","carol"))
df |> mutate(name = str_to_lower(str_trim(name)))
```

</details>

### Exercise 7.6: Multi-step pipeline

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
raw <- tibble(name = c(" Alice ","BOB","alice"),
              date = c("01/15/2024","02/20/2024","03/05/2024"),
              amount = c("$50","$80","$30"))

raw |>
  mutate(name   = str_to_lower(str_trim(name)),
         date   = mdy(date),
         amount = readr::parse_number(amount)) |>
  distinct(name, .keep_all = TRUE)
```

</details>

### Exercise 7.7: Validate then split valid/invalid

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
df <- tibble(age = c(25, -5, 30, 200), email = c("a@x","b","c@y","d@z"))
df <- df |> mutate(valid = age >= 0 & age <= 120 & str_detect(email, "@"))
list(valid = filter(df, valid), invalid = filter(df, !valid))
```

</details>

### Exercise 7.8: Reusable cleaning function

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
clean_text <- function(x) {
  x |> str_trim() |> str_squish() |> str_to_lower()
}
clean_text(c(" Alice  ","BOB ","   carol  "))
```

</details>

## What to do next

- **Data-Wrangling-Exercises** (shipped) — broader wrangling lifecycle.
- **EDA-Exercises** (shipped) — explore the now-clean data.
