---
title: "R Data Import Exercises: 10 read_csv(), read_excel() Practice Problems"
slug: "R-Data-Import-Exercises"
description: "10 hands-on R data import exercises covering read_csv, read_delim, column types, missing values, and multiple file reading. Interactive solutions."
keywords: "R data import exercises, read_csv exercises, readr practice, R import practice problems"
mathjax: false
webr: true
date: "2026-03-30"
curriculum_id: "FR-impo-3"
post_type: "EX"
sidebar_text: "Data Import (10 problems)"
auto_link_terms: "data import exercises|read_csv exercises"
auto_link_case_sensitive: false
fr_parent: "Importing-Data-in-R.html"
---

# R Data Import Exercises: 10 read_csv(), read_excel() Practice Problems

<p class="lead">Practice importing data in R with 10 exercises covering <code>read_csv()</code>, <code>read_delim()</code>, column type specifications, missing value handling, and combining multiple files. Interactive solutions included.</p>

These exercises test your ability to load messy real-world data into R. Each problem presents a tricky import scenario you'll encounter in practice.

## Easy (1-4): Basic Import

### Exercise 1: Read a Simple CSV

Parse this CSV string and verify the column types are correct.

```r
library(readr)

csv <- "product,price,quantity,in_stock
Laptop,999.99,50,TRUE
Mouse,24.99,200,TRUE
Keyboard,74.50,0,FALSE
Monitor,449.00,30,TRUE"

# Read this CSV and print the column types

```

<details>
<summary>Click to reveal solution</summary>

```r
library(readr)

csv <- "product,price,quantity,in_stock
Laptop,999.99,50,TRUE
Mouse,24.99,200,TRUE
Keyboard,74.50,0,FALSE
Monitor,449.00,30,TRUE"

df <- read_csv(csv, show_col_types = FALSE)
print(df)
cat("\nColumn types:\n")
sapply(df, class)
```

**Explanation:** `read_csv()` auto-detects: character for product, double for price, integer for quantity, logical for in_stock.

</details>

### Exercise 2: Custom Delimiter

Read a pipe-delimited file.

```r
library(readr)

data <- "name|department|salary
Alice|Engineering|95000
Bob|Marketing|82000
Carol|Engineering|91000
David|Sales|68000"

# Read this pipe-delimited data

```

<details>
<summary>Click to reveal solution</summary>

```r
library(readr)

data <- "name|department|salary
Alice|Engineering|95000
Bob|Marketing|82000
Carol|Engineering|91000
David|Sales|68000"

df <- read_delim(data, delim = "|", show_col_types = FALSE)
print(df)
```

**Explanation:** `read_delim()` accepts any delimiter character. Use `delim = "|"` for pipe, `delim = "\t"` for tab, or `delim = ";"` for semicolons.

</details>

### Exercise 3: Handle NA Strings

This CSV uses multiple representations for missing values. Read them all as NA.

```r
library(readr)

csv <- "id,score,grade,notes
1,88,A,passed
2,N/A,B,needs review
3,92,,excellent
4,-999,C,missing data
5,76,N/A,"

# Read with all missing value representations handled
# Hint: -999 is also a missing value code here

```

<details>
<summary>Click to reveal solution</summary>

```r
library(readr)

csv <- "id,score,grade,notes
1,88,A,passed
2,N/A,B,needs review
3,92,,excellent
4,-999,C,missing data
5,76,N/A,"

df <- read_csv(csv, na = c("", "NA", "N/A", "-999"), show_col_types = FALSE)
print(df)
cat("\nNA count:", sum(is.na(df)), "\n")
```

**Explanation:** The `na` parameter accepts a character vector of strings to interpret as missing. Add domain-specific codes like "-999".

</details>

### Exercise 4: Force Column Types

Read a CSV where zip codes lose leading zeros if read as numbers.

```r
library(readr)

csv <- "name,zipcode,state
Alice,01234,MA
Bob,90210,CA
Carol,00501,NY"

# Read so that zipcodes keep their leading zeros

```

<details>
<summary>Click to reveal solution</summary>

```r
library(readr)

csv <- "name,zipcode,state
Alice,01234,MA
Bob,90210,CA
Carol,00501,NY"

df <- read_csv(csv, col_types = cols(zipcode = col_character()))
print(df)
cat("Zipcodes preserved:", df$zipcode, "\n")
```

**Explanation:** `col_types = cols(zipcode = col_character())` overrides auto-detection for specific columns. Essential for IDs, zip codes, and phone numbers.

</details>

## Medium (5-7): Multi-File and Complex Parsing

### Exercise 5: Skip Header Rows

Read a CSV that has metadata rows before the actual data.

```r
library(readr)

messy <- "Report: Quarterly Sales
Generated: 2026-03-30
Department: All
---
product,q1,q2,q3,q4
Laptop,120,150,130,180
Mouse,450,500,480,520"

# Skip the metadata and read only the data portion

```

<details>
<summary>Click to reveal solution</summary>

```r
library(readr)

messy <- "Report: Quarterly Sales
Generated: 2026-03-30
Department: All
---
product,q1,q2,q3,q4
Laptop,120,150,130,180
Mouse,450,500,480,520"

df <- read_csv(messy, skip = 4, show_col_types = FALSE)
print(df)
```

**Explanation:** `skip = 4` skips the first 4 lines (metadata + separator). The 5th line becomes the header row.

</details>

### Exercise 6: Read and Combine Multiple CSVs

Combine two CSV datasets with the same structure.

```r
library(readr)
library(dplyr)

jan <- "date,sales\n2026-01-01,100\n2026-01-02,120\n2026-01-03,95"
feb <- "date,sales\n2026-02-01,110\n2026-02-02,130\n2026-02-03,105"

# Read both and combine into one data frame
# Add a "month" column to identify the source

```

<details>
<summary>Click to reveal solution</summary>

```r
library(readr)
library(dplyr)

jan <- "date,sales\n2026-01-01,100\n2026-01-02,120\n2026-01-03,95"
feb <- "date,sales\n2026-02-01,110\n2026-02-02,130\n2026-02-03,105"

df_jan <- read_csv(jan, show_col_types = FALSE) |> mutate(month = "Jan")
df_feb <- read_csv(feb, show_col_types = FALSE) |> mutate(month = "Feb")

combined <- bind_rows(df_jan, df_feb)
print(combined)
```

**Explanation:** Read each file separately, add an identifier column, then `bind_rows()` to stack them. In practice, use `lapply()` over `list.files()` for many files.

</details>

### Exercise 7: Select Specific Columns

Read a wide CSV but only import 3 columns.

```r
library(readr)

# mtcars has 11 columns — read only mpg, hp, and wt
csv <- paste(capture.output(write.csv(mtcars[1:5,], row.names = FALSE)), collapse = "\n")

# Read only mpg, hp, wt columns (ignore the rest)

```

<details>
<summary>Click to reveal solution</summary>

```r
library(readr)

csv <- paste(capture.output(write.csv(mtcars[1:5,], row.names = FALSE)), collapse = "\n")

df <- read_csv(csv, col_select = c(mpg, hp, wt), show_col_types = FALSE)
print(df)
```

**Explanation:** `col_select` uses tidy-select syntax — same as `dplyr::select()`. This is faster for wide files because unselected columns aren't parsed.

</details>

## Hard (8-10): Real-World Scenarios

### Exercise 8: Messy Encoding

Parse a CSV with special characters.

```r
library(readr)

csv <- "city,country,population
Paris,France,2161000
München,Germany,1472000
São Paulo,Brazil,12330000
Zürich,Switzerland,402000"

# Read and verify special characters are preserved

```

<details>
<summary>Click to reveal solution</summary>

```r
library(readr)

csv <- "city,country,population
Paris,France,2161000
München,Germany,1472000
São Paulo,Brazil,12330000
Zürich,Switzerland,402000"

df <- read_csv(csv, locale = locale(encoding = "UTF-8"), show_col_types = FALSE)
print(df)
cat("\nCities:", df$city, "\n")
```

**Explanation:** `read_csv()` defaults to UTF-8. For files with different encodings, specify `locale(encoding = "latin1")` or `locale(encoding = "Windows-1252")`.

</details>

### Exercise 9: Parse Dates and Times

Read a CSV with various date formats.

```r
library(readr)

csv <- "event,date,time
Meeting,03/30/2026,09:30
Lunch,03/30/2026,12:00
Review,03/31/2026,14:30"

# Read with proper date and time parsing

```

<details>
<summary>Click to reveal solution</summary>

```r
library(readr)

csv <- "event,date,time
Meeting,03/30/2026,09:30
Lunch,03/30/2026,12:00
Review,03/31/2026,14:30"

df <- read_csv(csv, col_types = cols(
  date = col_date(format = "%m/%d/%Y"),
  time = col_time(format = "%H:%M")
))
print(df)
cat("\nDate class:", class(df$date), "\n")
cat("Time class:", class(df$time), "\n")
```

**Explanation:** Use `col_date(format = ...)` with strptime format codes. `%m` = month, `%d` = day, `%Y` = 4-digit year, `%H` = hour, `%M` = minute.

</details>

### Exercise 10: Read with Row Limit

Read only the first N rows of a large dataset for quick exploration.

```r
library(readr)

# Simulate a large CSV
csv <- paste(c("x,y", paste(1:1000, runif(1000), sep = ",")), collapse = "\n")

# Read only the first 5 rows for a quick peek
# Then count total rows without reading the whole file

```

<details>
<summary>Click to reveal solution</summary>

```r
library(readr)

csv <- paste(c("x,y", paste(1:1000, round(runif(1000), 3), sep = ",")), collapse = "\n")

# Peek at first 5 rows
peek <- read_csv(csv, n_max = 5, show_col_types = FALSE)
cat("First 5 rows:\n")
print(peek)

# Count total rows (read only the first column for speed)
full <- read_csv(csv, col_select = 1, show_col_types = FALSE)
cat("\nTotal rows:", nrow(full), "\n")
```

**Explanation:** `n_max` limits how many rows are read. For quick exploration of huge files, combine with `col_select` to minimize memory usage.

</details>

## Summary

| Skill | Key Function/Argument |
|-------|-----------------------|
| Read CSV | `read_csv()` |
| Custom delimiter | `read_delim(delim = ";")` |
| Handle NAs | `na = c("", "NA", "N/A", "-999")` |
| Force column types | `col_types = cols(x = col_character())` |
| Skip rows | `skip = N` |
| Limit rows | `n_max = N` |
| Select columns | `col_select = c(col1, col2)` |
| Parse dates | `col_date(format = "%Y-%m-%d")` |

## What's Next?

- [Importing Data in R](/Importing-Data-in-R.html) — the parent tutorial
- [Pipe Operator](/R-Pipe-Operator.html) — chain import with transformation
- [dplyr filter & select](/dplyr-filter-select.html) — work with your imported data
