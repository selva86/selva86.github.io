---
title: "R Data Import Exercises: 10 read_csv(), read_excel() Practice Problems"
slug: "R-Data-Import-Exercises"
description: "10 hands-on R data import exercises covering read_csv, read_delim, column types, missing values, and combining multiple files. Interactive solutions."
keywords: "R data import exercises, read_csv exercises, readr practice, R import practice problems"
mathjax: false
webr: true
date: "2026-03-30"
curriculum_id: "FR-impo-3"
post_type: "EX"
sidebar_text: "Data Import (10 problems)"
auto_link_terms: "data import exercises|read_csv exercises|import exercises"
auto_link_case_sensitive: false
fr_parent: "Importing-Data-in-R.html"
---

# R Data Import Exercises: 10 read_csv(), read_excel() Practice Problems

<p class="lead">Practice importing data in R with 10 exercises: <code>read_csv()</code>, <code>read_delim()</code>, column types, missing values, skipping rows, and combining files. Each has an interactive solution.</p>

## Easy (1-4)

### Exercise 1: Read a Simple CSV

```r
library(readr)
csv <- "product,price,qty,in_stock\nLaptop,999.99,50,TRUE\nMouse,24.99,200,TRUE\nKeyboard,74.50,0,FALSE"
# Read and print column types

```

<details><summary>Click to reveal solution</summary>

```r
library(readr)
csv <- "product,price,qty,in_stock\nLaptop,999.99,50,TRUE\nMouse,24.99,200,TRUE\nKeyboard,74.50,0,FALSE"
df <- read_csv(csv, show_col_types = FALSE)
print(df)
cat("\nTypes:", sapply(df, class), "\n")
```
</details>

### Exercise 2: Pipe-Delimited File

```r
library(readr)
data <- "name|dept|salary\nAlice|Engineering|95000\nBob|Marketing|82000\nCarol|Sales|68000"
# Read this pipe-delimited data

```

<details><summary>Click to reveal solution</summary>

```r
library(readr)
data <- "name|dept|salary\nAlice|Engineering|95000\nBob|Marketing|82000\nCarol|Sales|68000"
read_delim(data, delim = "|", show_col_types = FALSE)
```
</details>

### Exercise 3: Custom NA Strings

```r
library(readr)
csv <- "id,score,grade\n1,88,A\n2,N/A,B\n3,,-\n4,-999,C\n5,76,"
# Read with all missing representations: "", "N/A", "-", "-999"

```

<details><summary>Click to reveal solution</summary>

```r
library(readr)
csv <- "id,score,grade\n1,88,A\n2,N/A,B\n3,,-\n4,-999,C\n5,76,"
df <- read_csv(csv, na = c("", "NA", "N/A", "-", "-999"), show_col_types = FALSE)
print(df)
cat("Total NAs:", sum(is.na(df)), "\n")
```
</details>

### Exercise 4: Preserve Leading Zeros

```r
library(readr)
csv <- "name,zipcode,phone\nAlice,01234,5551234567\nBob,00501,5559876543"
# Read so zipcodes keep leading zeros

```

<details><summary>Click to reveal solution</summary>

```r
library(readr)
csv <- "name,zipcode,phone\nAlice,01234,5551234567\nBob,00501,5559876543"
df <- read_csv(csv, col_types = cols(zipcode = col_character(), phone = col_character()))
print(df)
```
</details>

## Medium (5-7)

### Exercise 5: Skip Header Rows

```r
library(readr)
messy <- "Report: Quarterly Sales\nGenerated: 2026-03-30\n---\nproduct,q1,q2\nLaptop,120,150\nMouse,450,500"
# Skip metadata, read only the data

```

<details><summary>Click to reveal solution</summary>

```r
library(readr)
messy <- "Report: Quarterly Sales\nGenerated: 2026-03-30\n---\nproduct,q1,q2\nLaptop,120,150\nMouse,450,500"
read_csv(messy, skip = 3, show_col_types = FALSE)
```
</details>

### Exercise 6: Combine Two CSVs

```r
library(readr)
library(dplyr)
jan <- "date,sales\n2026-01-01,100\n2026-01-02,120"
feb <- "date,sales\n2026-02-01,150\n2026-02-02,130"
# Read both and combine, adding a "month" column

```

<details><summary>Click to reveal solution</summary>

```r
library(readr); library(dplyr)
jan <- "date,sales\n2026-01-01,100\n2026-01-02,120"
feb <- "date,sales\n2026-02-01,150\n2026-02-02,130"
df_jan <- read_csv(jan, show_col_types = FALSE) |> mutate(month = "Jan")
df_feb <- read_csv(feb, show_col_types = FALSE) |> mutate(month = "Feb")
bind_rows(df_jan, df_feb)
```
</details>

### Exercise 7: Select Columns on Read

```r
library(readr)
csv <- paste(capture.output(write.csv(mtcars[1:5,], row.names = FALSE)), collapse = "\n")
# Read only mpg, hp, wt columns

```

<details><summary>Click to reveal solution</summary>

```r
library(readr)
csv <- paste(capture.output(write.csv(mtcars[1:5,], row.names = FALSE)), collapse = "\n")
read_csv(csv, col_select = c(mpg, hp, wt), show_col_types = FALSE)
```
</details>

## Hard (8-10)

### Exercise 8: Parse Dates

```r
library(readr)
csv <- "event,date\nMeeting,03/30/2026\nLunch,03/31/2026\nReview,04/01/2026"
# Read with proper date parsing

```

<details><summary>Click to reveal solution</summary>

```r
library(readr)
csv <- "event,date\nMeeting,03/30/2026\nLunch,03/31/2026\nReview,04/01/2026"
df <- read_csv(csv, col_types = cols(date = col_date(format = "%m/%d/%Y")))
print(df)
cat("Date class:", class(df$date), "\n")
```
</details>

### Exercise 9: Read First N Rows

```r
library(readr)
csv <- paste(c("x,y", paste(1:1000, round(runif(1000),3), sep=",")), collapse="\n")
# Read only the first 5 rows for a quick peek

```

<details><summary>Click to reveal solution</summary>

```r
library(readr)
csv <- paste(c("x,y", paste(1:1000, round(runif(1000),3), sep=",")), collapse="\n")
read_csv(csv, n_max = 5, show_col_types = FALSE)
```
</details>

### Exercise 10: Combine CSVs with Different Columns

```r
library(readr); library(dplyr)
csv_a <- "id,name,score\n1,Alice,88\n2,Bob,76"
csv_b <- "id,name,grade\n3,Carol,A\n4,David,B"
# Combine into one data frame (missing columns → NA)

```

<details><summary>Click to reveal solution</summary>

```r
library(readr); library(dplyr)
csv_a <- "id,name,score\n1,Alice,88\n2,Bob,76"
csv_b <- "id,name,grade\n3,Carol,A\n4,David,B"
df_a <- read_csv(csv_a, show_col_types = FALSE)
df_b <- read_csv(csv_b, show_col_types = FALSE)
bind_rows(df_a, df_b)
```
</details>

## What's Next?

- [Importing Data in R](/Importing-Data-in-R.html) — the parent tutorial
- [Pipe Operator](/R-Pipe-Operator.html) — chain import with transformation
- [Tidy Data](/Tidy-Data-in-R.html) — reshape imported data
