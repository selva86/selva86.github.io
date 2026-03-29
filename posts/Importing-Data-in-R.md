---
title: "Importing Data into R: read_csv(), read_excel(), read_json() — Complete Guide"
slug: "Importing-Data-in-R"
description: "Learn to import CSV, Excel, JSON, SPSS, and SAS files into R with readr, readxl, jsonlite, and haven. Interactive examples with file paths and encoding."
keywords: "import data in R, read_csv R, read_excel R, read_json R, readr, readxl, jsonlite, haven, fread R, file paths R"
mathjax: false
webr: true
date: "2026-03-30"
curriculum_id: "1.2.1"
post_type: "C"
sidebar_text: "Importing Data"
curriculum_path: "/data-wrangling/import/"
auto_link_terms: "importing data in R|read_csv|read_excel|readr|readxl"
auto_link_case_sensitive: false
---

# Importing Data into R: read_csv(), read_excel(), read_json() — Complete Guide

<p class="lead">Importing data is the first step in every R analysis. R can read CSV, Excel, JSON, SPSS, SAS, Stata, Parquet, and database files — but each format has a different function and set of gotchas. This guide covers them all with interactive, runnable examples.</p>

Most tutorials show you `read.csv()` and stop there. Real-world data arrives in dozens of formats, with encoding issues, missing headers, and messy delimiters. This guide covers the full landscape — from the fast, modern `readr` package to specialized tools for Excel, JSON, and statistical software files.

## Why readr Over Base R?

Base R ships with `read.csv()` and `read.table()`, but the `readr` package (part of the tidyverse) is faster, more consistent, and produces tibbles instead of data frames. Here's the key difference:

```r
# Base R: read.csv() converts strings to factors (historically)
# and uses row names by default
base_result <- read.csv(text = "name,age,city
Alice,30,London
Bob,25,Paris
Carol,35,Tokyo")

str(base_result)
#> 'data.frame':	3 obs. of  3 variables

# readr: read_csv() is faster, gives a tibble, and shows column types
library(readr)
readr_result <- read_csv("name,age,city
Alice,30,London
Bob,25,Paris
Carol,35,Tokyo")

readr_result
```

The `readr` functions are prefixed with `read_` (underscore), while base R uses `read.` (dot). This naming convention tells you which ecosystem you're in.

## Reading CSV Files with read_csv()

CSV (Comma-Separated Values) is the most common data format. The `read_csv()` function handles it cleanly:

```r
library(readr)

# Read from inline CSV text (great for examples and tests)
sales <- read_csv("product,units,price
Widget A,150,29.99
Widget B,85,49.99
Widget C,200,14.99
Widget D,60,99.99")

sales
```

```r
# Common arguments you'll use regularly
# col_types: explicitly control column types
data <- read_csv("id,value,flag
1,3.14,true
2,2.72,false
3,1.41,true",
  col_types = cols(
    id = col_integer(),
    value = col_double(),
    flag = col_logical()
  )
)

str(data)
```

```r
# skip: skip header rows (common in exported reports)
# n_max: read only first N rows (great for previewing huge files)
# na: define what counts as missing
messy <- read_csv("Report generated 2026-03-15
Source: Sales DB
name,score,grade
Alice,95,A
Bob,,B
Carol,87,N/A",
  skip = 2,
  na = c("", "NA", "N/A")
)

messy
```

### Delimited Files: read_tsv() and read_delim()

Not all files use commas. Tab-separated and pipe-separated files are common:

```r
library(readr)

# Tab-separated
tsv_data <- read_tsv("name\tscore\tpass
Alice\t95\tTRUE
Bob\t78\tTRUE
Carol\t45\tFALSE")

tsv_data

# Pipe-separated (or any delimiter)
pipe_data <- read_delim("name|score|pass
Alice|95|TRUE
Bob|78|TRUE", delim = "|")

pipe_data
```

## Reading Excel Files with readxl

Excel files (`.xlsx` and `.xls`) require the `readxl` package. Unlike CSV readers, you often need to specify sheets and ranges:

```r
# readxl is not available in WebR, but here's the syntax:
# library(readxl)

# Basic read
# df <- read_excel("data.xlsx")

# Specify sheet by name or number
# df <- read_excel("data.xlsx", sheet = "Q1 Sales")
# df <- read_excel("data.xlsx", sheet = 2)

# Read a specific cell range
# df <- read_excel("data.xlsx", range = "B3:F20")

# Skip rows and set column types
# df <- read_excel("data.xlsx",
#   skip = 3,
#   col_types = c("text", "numeric", "date", "numeric")
# )

# List all sheets in a workbook
# excel_sheets("data.xlsx")

# Let's simulate what read_excel returns
excel_sim <- data.frame(
  date = as.Date(c("2026-01-15", "2026-02-15", "2026-03-15")),
  region = c("North", "South", "East"),
  revenue = c(45000, 38000, 52000),
  units = c(120, 95, 145)
)

excel_sim
```

### Pro Tips for Excel Files

| Challenge | Solution |
|-----------|----------|
| Multiple sheets | Loop with `lapply(excel_sheets("file.xlsx"), read_excel, path = "file.xlsx")` |
| Merged cells | `readxl` fills merged cells down — check for unexpected NAs |
| Dates as numbers | Use `col_types = c("date")` or convert with `janitor::excel_numeric_to_date()` |
| Named ranges | Use `range = "MyNamedRange"` in `read_excel()` |
| Header in row 3 | Use `skip = 2` to skip the first two rows |

## Reading JSON Data with jsonlite

JSON is the standard format for web APIs and NoSQL databases. The `jsonlite` package handles both files and API responses:

```r
library(jsonlite)

# Parse a JSON string into an R data frame
json_text <- '[
  {"name": "Alice", "age": 30, "scores": [95, 87, 92]},
  {"name": "Bob", "age": 25, "scores": [78, 82, 88]},
  {"name": "Carol", "age": 35, "scores": [90, 95, 97]}
]'

people <- fromJSON(json_text)
people
```

```r
library(jsonlite)

# Nested JSON requires flattening
nested_json <- '{
  "company": "Acme Corp",
  "employees": [
    {"name": "Alice", "department": {"name": "Engineering", "floor": 3}},
    {"name": "Bob", "department": {"name": "Marketing", "floor": 2}}
  ]
}'

result <- fromJSON(nested_json)
# Access nested data
result$employees
```

```r
library(jsonlite)

# Convert R objects back to JSON
df <- data.frame(
  x = c(1, 2, 3),
  y = c("a", "b", "c")
)

toJSON(df, pretty = TRUE)
```

## Reading SPSS, SAS, and Stata Files with haven

The `haven` package (tidyverse) reads files from major statistical software:

```r
# haven syntax (not available in WebR, showing patterns)
# library(haven)

# SPSS (.sav)
# df <- read_sav("survey.sav")

# SAS (.sas7bdat)
# df <- read_sas("analysis.sas7bdat")

# Stata (.dta)
# df <- read_dta("panel.dta")

# Haven preserves value labels as attributes
# Use as_factor() to convert labelled columns to factors
# df$gender <- as_factor(df$gender)

# Simulating haven output with labelled values
cat("haven reads statistical files and preserves:\n")
cat("- Variable labels (column descriptions)\n")
cat("- Value labels (1='Male', 2='Female')\n")
cat("- Missing value codes (system and user-defined)\n")
cat("- Date/time formats\n")
```

## File Paths and Working Directories

Getting file paths right causes more beginner frustration than any other topic:

```r
# Check your current working directory
getwd()

# Best practice: use relative paths from your project root
# df <- read_csv("data/sales.csv")         # relative path
# df <- read_csv("~/projects/data.csv")    # home directory shortcut

# On Windows, use forward slashes or double backslashes
# df <- read_csv("C:/Users/name/data.csv")       # forward slashes (recommended)
# df <- read_csv("C:\\Users\\name\\data.csv")     # escaped backslashes

# Use here::here() for robust, project-relative paths
# library(here)
# df <- read_csv(here("data", "sales.csv"))

# List files in a directory
# list.files("data/", pattern = "\\.csv$")

cat("File path tips:\n")
cat("1. Always use forward slashes, even on Windows\n")
cat("2. Use here::here() in projects for portable paths\n")
cat("3. Use list.files() to verify a file exists before reading\n")
```

## Handling Encoding Issues

Character encoding problems produce garbled text (mojibake). Here's how to fix them:

```r
library(readr)

# Specify encoding explicitly
# df <- read_csv("french_data.csv", locale = locale(encoding = "Latin1"))
# df <- read_csv("chinese_data.csv", locale = locale(encoding = "UTF-8"))

# Detect encoding (returns a guess)
# guess_encoding("mystery_file.csv")

# Common encodings to try:
encoding_guide <- data.frame(
  Source = c("Most modern files", "Western European legacy",
             "Japanese", "Chinese (Simplified)", "Excel exports (Windows)"),
  Encoding = c("UTF-8", "Latin1 / ISO-8859-1",
                "Shift-JIS", "GB2312 / GBK", "Windows-1252")
)

encoding_guide
```

## Summary: Which Function for Which Format?

| Format | Package | Function | Speed |
|--------|---------|----------|-------|
| CSV | readr | `read_csv()` | Fast |
| CSV | base R | `read.csv()` | Moderate |
| CSV | data.table | `fread()` | Fastest |
| TSV | readr | `read_tsv()` | Fast |
| Any delimited | readr | `read_delim()` | Fast |
| Excel (.xlsx) | readxl | `read_excel()` | Moderate |
| JSON | jsonlite | `fromJSON()` | Fast |
| SPSS (.sav) | haven | `read_sav()` | Moderate |
| SAS (.sas7bdat) | haven | `read_sas()` | Moderate |
| Stata (.dta) | haven | `read_dta()` | Moderate |
| Parquet | arrow | `read_parquet()` | Very Fast |
| R native | base R | `readRDS()` / `load()` | Very Fast |

## Practice Exercises

**Exercise 1:** Read this inline CSV into a tibble. Make sure `id` is an integer and `rating` is a double. How many rows have missing values?

```r
csv_text <- "id,name,rating,category
1,Alpha,4.5,A
2,Beta,,B
3,Gamma,3.8,A
4,Delta,4.2,
5,Epsilon,3.1,B"

# Your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
library(readr)

df <- read_csv("id,name,rating,category
1,Alpha,4.5,A
2,Beta,,B
3,Gamma,3.8,A
4,Delta,4.2,
5,Epsilon,3.1,B",
  col_types = cols(
    id = col_integer(),
    name = col_character(),
    rating = col_double(),
    category = col_character()
  )
)

df

# Count rows with any missing value
sum(!complete.cases(df))
#> [1] 2  (rows 2 and 4)
```

</details>

**Exercise 2:** Parse this JSON string into a data frame and calculate the average score per department.

```r
json_str <- '[
  {"name":"Alice","dept":"Engineering","score":92},
  {"name":"Bob","dept":"Marketing","score":85},
  {"name":"Carol","dept":"Engineering","score":88},
  {"name":"Dave","dept":"Marketing","score":91}
]'

# Your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
library(jsonlite)

df <- fromJSON('[
  {"name":"Alice","dept":"Engineering","score":92},
  {"name":"Bob","dept":"Marketing","score":85},
  {"name":"Carol","dept":"Engineering","score":88},
  {"name":"Dave","dept":"Marketing","score":91}
]')

aggregate(score ~ dept, data = df, FUN = mean)
#>          dept score
#> 1 Engineering  90.0
#> 2   Marketing  88.0
```

</details>

**Exercise 3:** This CSV has two junk header rows and uses "N/A" for missing values. Read it correctly.

```r
messy_csv <- "Sales Report Q1 2026
Generated: 2026-04-01
product,revenue,units
Widget,15000,120
Gadget,N/A,85
Doohickey,22000,N/A"

# Your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
library(readr)

df <- read_csv("Sales Report Q1 2026
Generated: 2026-04-01
product,revenue,units
Widget,15000,120
Gadget,N/A,85
Doohickey,22000,N/A",
  skip = 2,
  na = c("", "NA", "N/A")
)

df
#> # A tibble: 3 x 3
#>   product   revenue units
#>   <chr>       <dbl> <dbl>
#> 1 Widget      15000   120
#> 2 Gadget         NA    85
#> 3 Doohickey   22000    NA
```

</details>

## FAQ

**Q: Should I use `read.csv()` or `read_csv()`?**
Use `read_csv()` from the readr package. It's faster, produces tibbles, handles encoding better, and has consistent naming. The only reason to use `read.csv()` is when you can't install packages (rare in practice).

**Q: How do I read a file from a URL?**
All readr functions accept URLs directly: `read_csv("https://example.com/data.csv")`. For APIs that return JSON, use `jsonlite::fromJSON("https://api.example.com/data")`.

**Q: My CSV has semicolons instead of commas. What do I do?**
Use `read_csv2()` (which expects semicolons and commas as decimal marks, common in European data) or `read_delim(file, delim = ";")` for explicit control.

## What's Next?

Now that you can import data into R, the next step is learning to **chain operations** together with the pipe operator. See the [Pipe Operator in R](#) tutorial to learn `%>%` and `|>`, which you'll use in every data wrangling workflow.
