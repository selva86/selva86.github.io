---
title: "readr Exercises in R: 30 Real Practice Problems"
slug: "readr-Exercises-in-R"
description: "Master readr with 30 practice problems in R: read_csv, parse, write, locale handling, type guessing. Hidden solutions, runnable code."
keywords: "readr exercises, readr practice, read_csv R exercises, R data import practice, readr exercises in R"
mathjax: false
webr: true
date: "2026-05-11"
post_type: "EX"
sidebar_title: "readr Exercises"
sidebar_order: 115
fr_parent: "R-Tutorial.html"
auto_link_terms: "readr exercises|read_csv R exercises|R data import practice|readr practice"
auto_link_case_sensitive: false
target_keyword: "readr exercises"
sibling_block_enabled: false
difficulty: "Intermediate"
---

# readr Exercises in R: 30 Real Practice Problems

<p class="lead">Thirty practice problems on readr: reading and writing CSVs, custom NAs, column types, locales, parsing helpers. Hidden solutions, runnable code.</p>

```r title="Run this once before any exercise"
library(readr)
library(dplyr)
library(tibble)
```

## Section 1. Reading basics (8 problems)

### Exercise 1.1: read_csv

**Difficulty:** Beginner. Write and re-read a small CSV.

<details><summary>Show solution</summary>

```r
write_csv(mtcars, "demo.csv")
df <- read_csv("demo.csv")
head(df)
```

</details>

### Exercise 1.2: read_tsv

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
write_tsv(mtcars, "demo.tsv")
read_tsv("demo.tsv")
```

</details>

### Exercise 1.3: Read with custom NA strings

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
read_csv("demo.csv", na = c("","NA","N/A","missing"))
```

</details>

### Exercise 1.4: Skip lines

**Difficulty:** Intermediate. Skip first 2 rows.

<details><summary>Show solution</summary>

```r
read_csv("demo.csv", skip = 2)
```

</details>

### Exercise 1.5: First N rows only

**Difficulty:** Beginner. Read 5 rows.

<details><summary>Show solution</summary>

```r
read_csv("demo.csv", n_max = 5)
```

</details>

### Exercise 1.6: From a string

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
read_csv("a,b\n1,2\n3,4")
```

</details>

### Exercise 1.7: Read without column names

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
read_csv("demo.csv", col_names = FALSE)
```

</details>

### Exercise 1.8: Custom column names

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
read_csv("demo.csv", col_names = c("v1","v2","v3"), skip = 1)
```

</details>

## Section 2. Column types (6 problems)

### Exercise 2.1: Force a column to character

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
read_csv("demo.csv", col_types = cols(mpg = col_character()))
```

</details>

### Exercise 2.2: Compact spec string

**Difficulty:** Intermediate. cidD = char/int/double.

<details><summary>Show solution</summary>

```r
read_csv("a,b,c\nx,1,2.5", col_types = "cid")
```

</details>

### Exercise 2.3: Skip a column

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
read_csv("demo.csv", col_types = cols(disp = col_skip()))
```

</details>

### Exercise 2.4: Date column

**Difficulty:** Intermediate. Parse a date column.

<details><summary>Show solution</summary>

```r
csv <- "id,date\n1,2024-01-15"
read_csv(csv, col_types = cols(date = col_date()))
```

</details>

### Exercise 2.5: Custom date format

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
csv <- "id,date\n1,15/01/2024"
read_csv(csv, col_types = cols(date = col_date(format = "%d/%m/%Y")))
```

</details>

### Exercise 2.6: Spec problems

**Difficulty:** Advanced. Inspect parsing problems.

<details><summary>Show solution</summary>

```r
df <- read_csv("a\nfoo\n3", col_types = cols(a = col_integer()))
problems(df)
```

</details>

## Section 3. Parsers (8 problems)

### Exercise 3.1: parse_number from currency

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
parse_number("$1,234.50")
```

</details>

### Exercise 3.2: parse_double

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
parse_double(c("1.5","2.7","NA"))
```

</details>

### Exercise 3.3: parse_logical

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
parse_logical(c("TRUE","FALSE","T","F","NA"))
```

</details>

### Exercise 3.4: parse_date

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
parse_date("01/15/2024", format = "%m/%d/%Y")
```

</details>

### Exercise 3.5: parse_datetime

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
parse_datetime("2024-01-15T14:30:00")
```

</details>

### Exercise 3.6: parse_number with custom locale

**Difficulty:** Advanced. Parse "1.234,50" (European).

<details><summary>Show solution</summary>

```r
parse_number("1.234,50",
             locale = locale(decimal_mark = ",", grouping_mark = "."))
```

</details>

### Exercise 3.7: parse_factor

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
parse_factor(c("low","high","med"), levels = c("low","med","high"))
```

</details>

### Exercise 3.8: parse_guess

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
parse_guess(c("1.5","2","TRUE","2024-01-15"))
```

</details>

## Section 4. Writing (4 problems)

### Exercise 4.1: write_csv

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
write_csv(mtcars, "out.csv")
```

</details>

### Exercise 4.2: write_excel_csv

**Difficulty:** Intermediate. Excel-friendly UTF-8 BOM.

<details><summary>Show solution</summary>

```r
write_excel_csv(mtcars, "out_excel.csv")
```

</details>

### Exercise 4.3: write_rds for round-trip

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
write_rds(mtcars, "out.rds")
read_rds("out.rds")
```

</details>

### Exercise 4.4: Append rows

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
write_csv(mtcars[1:5,], "incr.csv")
write_csv(mtcars[6:10,], "incr.csv", append = TRUE)
```

</details>

## Section 5. Real-world workflows (4 problems)

### Exercise 5.1: Read a messy file

**Difficulty:** Advanced. Skip lines, custom NA, custom delimiter.

<details><summary>Show solution</summary>

```r
read_delim("comment_line\na;b\n1;2\n3;NA",
           skip = 1, delim = ";", na = "NA")
```

</details>

### Exercise 5.2: Read multiple files

**Difficulty:** Advanced. Use map_dfr.

<details><summary>Show solution</summary>

```r
files <- c("demo.csv","demo.csv")  # demo
df <- purrr::map_dfr(files, read_csv, .id = "source")
df
```

</details>

### Exercise 5.3: Read large file in chunks

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
read_csv_chunked("demo.csv",
                 callback = DataFrameCallback$new(function(x, pos) head(x, 2)),
                 chunk_size = 5)
```

</details>

### Exercise 5.4: Read with progress

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
read_csv("demo.csv", progress = TRUE)
```

</details>

## What to do next

- **Data-Wrangling-Exercises** (shipped) — clean data after import.
- **EDA-Exercises** (shipped) — explore the imported data.
