---
title: "Import Any Data Format Into R: CSV, Excel, JSON, and 12 Others"
slug: "Importing-Data-in-R"
description: "Import CSV with read_csv(), Excel with readxl, JSON with jsonlite, and 12 other formats. Learn the arguments that handle encoding, missing values, column types, and malformed files."
keywords: "import data R, read_csv R, read.csv, readxl, read_excel, jsonlite, R import JSON, fread, data.table, R file formats"
auto_link_terms: "importing data in R|read_csv()|read_excel()|read.csv()|readxl|jsonlite|fread()"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: 2026-04-11
curriculum_id: "1.2.1"
post_type: C
sidebar_section: "Data Wrangling"
sidebar_title: "Importing Data"
sidebar_order: 1
---

# Import Any Data Format Into R: CSV, Excel, JSON, and 12 Others

<p class="lead">Almost every real R project starts with "read this file and give me a data frame." This guide shows you the one function to reach for by format — CSV, Excel, JSON, TSV, fixed-width, SPSS, Stata, SAS, Parquet, RDS, and more — plus the arguments that rescue broken imports.</p>

## How do you import a CSV file into R?

CSV is the workhorse format — flat, text-based, universal. R gives you three main choices: base `read.csv()`, tidyverse `readr::read_csv()`, and `data.table::fread()`. All three return a data frame; they differ in speed, defaults, and output class.

```r
library(readr)
sales <- read_csv("sales.csv")
sales
#> # A tibble: 6 x 4
#>   date       product   units price
#>   <date>     <chr>     <dbl> <dbl>
#> 1 2026-01-05 widget       12  9.99
#> 2 2026-01-06 gizmo         4 24.50
#> 3 2026-01-07 widget        8  9.99
#> 4 2026-01-08 sprocket     15  4.25
#> 5 2026-01-09 gizmo         2 24.50
#> 6 2026-01-10 widget       10  9.99
```

`read_csv()` auto-detects column types, parses dates, returns a tibble, and is about 10× faster than base `read.csv()`. It also prints a column-spec summary so you can catch type surprises early.

> [KEY INSIGHT]
> Use `read_csv()` for most work, `fread()` when speed matters on huge files (100 MB+), and base `read.csv()` only when you can't install packages. The differences are in defaults, not capability.

**Try it:** Load a CSV with the `readr` package and check its column types with `spec()`.

```r
# tiny inline example
library(readr)
ex_text <- "id,name,score\n1,Alice,92\n2,Bob,87"
ex_df <- read_csv(ex_text)
spec(ex_df)

```

<details>
<summary>Click to reveal solution</summary>

```r
library(readr)
ex_text <- "id,name,score\n1,Alice,92\n2,Bob,87"
ex_df <- read_csv(ex_text)
spec(ex_df)
#> cols(
#>   id = col_double(),
#>   name = col_character(),
#>   score = col_double()
#> )
```

`read_csv()` accepts a literal string as input when it contains a newline, so you can test parsing without writing a file. `spec()` returns the column specification `read_csv()` inferred — use it to verify types before pointing at a large file.
</details>

## What arguments fix broken CSV imports?

Real-world CSVs are rarely clean. These five arguments solve 90% of import headaches.

```r
# Handle European-style decimal commas and semicolons
library(readr)
read_delim("a;b\n1,5;2,3\n3,1;4,7",
           delim = ";",
           locale = locale(decimal_mark = ","))
#> # A tibble: 1 x 2
#>       a     b
#>   <dbl> <dbl>
#> 1   1.5   2.3
```

```r
# Skip junk header rows, force column types
read_csv("junk\njunk\na,b\n1,x\n2,y",
         skip = 2,
         col_types = "ic")
#> # A tibble: 2 x 2
#>       a b    
#>   <int> <chr>
#> 1     1 x    
#> 2     2 y
```

```r
# Treat custom strings as NA
read_csv("a,b\n1,good\n-999,missing\n3,N/A",
         na = c("-999", "N/A"))
#> # A tibble: 3 x 2
#>       a b      
#>   <dbl> <chr>  
#> 1     1 good   
#> 2    NA missing
#> 3     3 <NA>
```

The core arguments: `delim`, `locale`, `skip`, `col_types`, `na`. Memorize these and you'll handle 99% of real CSVs without resorting to text editors.

> [TIP]
> `col_types` uses a compact string syntax: `"icldDTc"` means integer, character, logical, double, Date, POSIXct, character. Or pass `cols(x = col_double(), y = col_character())` for named columns.

**Try it:** Parse a CSV where missing values are encoded as "NA", "NULL", and "-".

```r
read_csv("id,score\n1,85\n2,NA\n3,NULL\n4,-", na = c("NA", "NULL", "-"))

```

<details>
<summary>Click to reveal solution</summary>

```r
library(readr)
read_csv("id,score\n1,85\n2,NA\n3,NULL\n4,-",
         na = c("NA", "NULL", "-"))
#> # A tibble: 4 x 2
#>      id score
#>   <dbl> <dbl>
#> 1     1    85
#> 2     2    NA
#> 3     3    NA
#> 4     4    NA
```

Passing a character vector to `na` tells `read_csv()` to treat every one of those tokens as a missing value. Because all three sentinels resolve to `NA`, the `score` column ends up as a clean numeric — without the `na` argument the column would have been read as character.
</details>

## How do you read Excel files?

Excel files (.xlsx, .xls) need the `readxl` package — installed with tidyverse, but you call it directly. It handles multi-sheet workbooks and preserves cell types better than any CSV export would.

```r
library(readxl)
# read the first sheet
df <- read_excel("data.xlsx")

# read a specific sheet by name
products <- read_excel("data.xlsx", sheet = "Products")

# list all sheets first
excel_sheets("data.xlsx")
#> [1] "Products" "Orders" "Customers"

# read a specific range
q1 <- read_excel("data.xlsx", sheet = "Orders", range = "A1:E100")
```

No external dependencies (no Java, no libreoffice) — `readxl` is pure C++ under the hood, so it works the same on Mac, Linux, and Windows.

> [WARNING]
> Excel's date columns come through as numeric days-since-1900 if the cell format is wrong. `read_excel()` catches this for properly-formatted cells, but if dates arrive as numbers like 44562, convert with `as.Date(44562, origin = "1899-12-30")`.

**Try it:** List the sheets in a hypothetical workbook with `excel_sheets()`.

```r
# excel_sheets("myfile.xlsx")
# returns a character vector of sheet names

```

<details>
<summary>Click to reveal solution</summary>

```r
library(readxl)
# Write a two-sheet workbook to a temp file so we can read it back
tmp <- tempfile(fileext = ".xlsx")
writexl::write_xlsx(list(Products = head(iris, 2),
                         Orders   = head(mtcars, 2)), tmp)
excel_sheets(tmp)
#> [1] "Products" "Orders"
```

`excel_sheets()` opens the workbook and returns a character vector of sheet names in their stored order — call this before `read_excel()` whenever you don't control the file, so you can pass the right `sheet =` argument instead of guessing.
</details>

## How do you import JSON into R?

The `jsonlite` package parses JSON into a data frame when the shape is tabular, or a nested list when it isn't. It's fast and handles both local files and API responses.

```r
library(jsonlite)
json_text <- '[
  {"id": 1, "name": "Ann", "active": true},
  {"id": 2, "name": "Bo",  "active": false},
  {"id": 3, "name": "Cal", "active": true}
]'
fromJSON(json_text)
#>   id name active
#> 1  1  Ann   TRUE
#> 2  2   Bo  FALSE
#> 3  3  Cal   TRUE
```

When the JSON is nested, `fromJSON()` returns a list of lists/data frames that you navigate with `$`. Pass `flatten = TRUE` to unnest embedded objects into columns automatically.

```r
nested <- '[
  {"id": 1, "profile": {"age": 30, "city": "NYC"}},
  {"id": 2, "profile": {"age": 25, "city": "LA"}}
]'
fromJSON(nested, flatten = TRUE)
#>   id profile.age profile.city
#> 1  1          30          NYC
#> 2  2          25           LA
```

**Try it:** Parse a tiny JSON array of three objects and check the class of the result.

```r
library(jsonlite)
ex_json <- '[{"a":1},{"a":2},{"a":3}]'
class(fromJSON(ex_json))

```

<details>
<summary>Click to reveal solution</summary>

```r
library(jsonlite)
ex_json <- '[{"a":1},{"a":2},{"a":3}]'
result <- fromJSON(ex_json)
class(result)
#> [1] "data.frame"
result
#>   a
#> 1 1
#> 2 2
#> 3 3
```

`fromJSON()` auto-simplifies a JSON array of flat objects into a `data.frame` because every element shares the same keys. If any object had a different shape or a nested value, the result would fall back to a list — which is why you should always `class()` the result before piping it downstream.
</details>

## How do you read data from other statistical software (SPSS, Stata, SAS)?

Migrants from other stats software can keep their existing files. The `haven` package reads (and writes) SPSS `.sav`, Stata `.dta`, and SAS `.sas7bdat` files directly.

```r
library(haven)
# SPSS
spss_df <- read_sav("survey.sav")

# Stata
stata_df <- read_dta("panel.dta")

# SAS
sas_df <- read_sas("registry.sas7bdat")
```

`haven` preserves value labels, variable labels, and missing-value markers, which is critical when you're collaborating with SPSS or Stata users. Use `labelled::to_factor()` to convert labelled columns to regular R factors when you need them.

> [NOTE]
> For old Excel `.xls`, fixed-width, and Matlab `.mat` files, use `readxl::read_xls()`, `readr::read_fwf()`, and `R.matlab::readMat()` respectively. Each format has a dedicated package; the tidyverse ecosystem keeps them consistent.

**Try it:** Check what class `read_sav()` returns (conceptually — it's a tibble with `haven_labelled` columns).

```r
# class(read_sav("myfile.sav"))
# typically: c("tbl_df", "tbl", "data.frame")

```

<details>
<summary>Click to reveal solution</summary>

```r
library(haven)
# Write an SPSS file from a built-in dataset, then read it back
tmp <- tempfile(fileext = ".sav")
write_sav(head(iris), tmp)
class(read_sav(tmp))
#> [1] "tbl_df"     "tbl"        "data.frame"
```

`read_sav()` returns a tibble (`tbl_df`) so `dplyr` verbs work directly on it. Individual columns that carried SPSS value labels gain an extra `haven_labelled` class — check them with `class(df$col)` and convert with `haven::as_factor()` when you need plain R factors.
</details>

## How do you handle big files with data.table::fread()?

When your file is hundreds of megabytes or you're iterating many times, `fread()` from the `data.table` package is the fastest tool in R. It auto-detects delimiters, types, and headers with a single call.

```r
library(data.table)
big <- fread("large.csv")
class(big)
#> [1] "data.table" "data.frame"
```

`fread()` returns a `data.table` (a high-performance subclass of data frame). If you want a plain data frame or tibble, wrap the call: `as.data.frame(fread(...))` or `tibble::as_tibble(fread(...))`.

```r
# Read only specific columns — memory saver on wide files
fread("large.csv", select = c("date", "value"))

# Read first 1000 rows for a peek
fread("large.csv", nrows = 1000)

# Handle a custom delimiter
fread("large.txt", sep = "|")
```

For files over 1 GB, `fread()` will often be 5-10× faster than `read_csv()` and use less memory.

**Try it:** Use `fread()` on inline text with `text = ...`.

```r
library(data.table)
fread(text = "x,y\n1,10\n2,20\n3,30")

```

<details>
<summary>Click to reveal solution</summary>

```r
library(data.table)
fread(text = "x,y\n1,10\n2,20\n3,30")
#>    x  y
#> 1: 1 10
#> 2: 2 20
#> 3: 3 30
```

The `text =` argument lets `fread()` parse a literal string just like it would a file path, which is the fastest way to prototype a call without touching disk. The result is a `data.table` — the leading `1:`, `2:`, `3:` on each row are the data.table row index, not a real column.
</details>

## How do you save and load R-native formats (RDS, RData)?

When the source of data is another R session, use R-native formats. `saveRDS()`/`readRDS()` save *one object* and let the caller name it on load. `save()`/`load()` save *multiple named objects* and restore them under their original names.

```r
# Save a single object
saveRDS(mtcars, "mtcars.rds")
cars2 <- readRDS("mtcars.rds")
identical(mtcars, cars2)
#> [1] TRUE

# Save multiple objects
x <- 1:10
y <- letters[1:5]
save(x, y, file = "workspace.RData")
rm(x, y)
load("workspace.RData")
x
#> [1] 1 2 3 4 5 6 7 8 9 10
```

`readRDS()` is the safer pattern — you control what variable the object gets bound to, so there's no risk of silently overwriting something in your workspace. Prefer it for any single-object serialization.

> [TIP]
> For very large data frames, `arrow::write_parquet()` and `arrow::read_parquet()` are worth learning. Parquet is columnar, compressed, and readable from Python, Spark, and most data tools — making it the best "exchange format" for modern data work.

**Try it:** Save a small vector to an RDS file and read it back.

```r
saveRDS(c(1, 2, 3), tempfile(fileext = ".rds"))
# readRDS(path) returns c(1, 2, 3)

```

<details>
<summary>Click to reveal solution</summary>

```r
path <- tempfile(fileext = ".rds")
saveRDS(c(1, 2, 3), path)
readRDS(path)
#> [1] 1 2 3
```

Capturing the `tempfile()` path in a variable is the key move — otherwise you write the RDS to one random path and try to read from a different one. `saveRDS()` serializes exactly one object and `readRDS()` returns it so the caller can bind it to any variable name they like.
</details>

## Practice Exercises

### Exercise 1: Multi-sheet Excel

Given a workbook with sheets "Q1", "Q2", "Q3", "Q4", read all four sheets and combine into one data frame with a `quarter` column.

<details>
<summary>Show solution</summary>

```r
library(readxl)
library(dplyr)
sheets <- c("Q1", "Q2", "Q3", "Q4")
all_data <- lapply(sheets, function(s) {
  df <- read_excel("data.xlsx", sheet = s)
  df$quarter <- s
  df
})
combined <- bind_rows(all_data)
```
</details>

### Exercise 2: Dirty CSV rescue

A CSV has 3 junk rows, semicolon delimiters, comma decimals, and "NULL" as missing. Read it correctly.

<details>
<summary>Show solution</summary>

```r
library(readr)
read_delim("messy.csv",
           delim = ";",
           skip = 3,
           locale = locale(decimal_mark = ","),
           na = "NULL")
```
</details>

### Exercise 3: JSON to data frame

Parse this JSON into a data frame with columns `id`, `name`, `tags` (a list-column).

```r
json <- '[
  {"id": 1, "name": "Ann", "tags": ["r", "stats"]},
  {"id": 2, "name": "Bo",  "tags": ["sql"]}
]'
```

<details>
<summary>Show solution</summary>

```r
library(jsonlite)
df <- fromJSON(json, simplifyDataFrame = TRUE)
df
#>   id name      tags
#> 1  1  Ann r, stats
#> 2  2   Bo       sql
str(df$tags)
#> List of 2
#>  $ : chr [1:2] "r" "stats"
#>  $ : chr "sql"
```
</details>

## Putting It All Together

A realistic import pipeline: detect the file extension, route to the right reader, and return a tibble.

```r
library(readr)
library(readxl)
library(jsonlite)
library(tools)

import_any <- function(path) {
  ext <- tolower(file_ext(path))
  switch(ext,
    csv  = read_csv(path, show_col_types = FALSE),
    tsv  = read_tsv(path, show_col_types = FALSE),
    xlsx = read_excel(path),
    xls  = read_excel(path),
    json = as_tibble(fromJSON(path)),
    rds  = as_tibble(readRDS(path)),
    stop("Unsupported extension: ", ext)
  )
}

# Simulated usage
tmp <- tempfile(fileext = ".csv")
write_csv(head(mtcars), tmp)
import_any(tmp)
#> # A tibble: 6 x 11
#>     mpg   cyl  disp    hp  drat    wt  qsec    vs    am  gear  carb
#>   <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl>
#> 1  21       6  160    110  3.9   2.62  16.5     0     1     4     4
#> 2  21       6  160    110  3.9   2.88  17.0     0     1     4     4
#> 3  22.8     4  108     93  3.85  2.32  18.6     1     1     4     1
#> 4  21.4     6  258    110  3.08  3.22  19.4     0     0     3     1
#> 5  18.7     8  360    175  3.15  3.44  17.0     0     0     3     2
#> 6  18.1     6  225    105  2.76  3.46  20.2     1     0     3     1
```

One function, six formats, zero manual branching at the call site. This is the kind of small utility that pays for itself the first week.

## Summary

| Format | Function | Package |
|--------|----------|---------|
| CSV | `read_csv()` | readr |
| TSV | `read_tsv()` | readr |
| Custom delimiter | `read_delim()` | readr |
| Excel (.xlsx, .xls) | `read_excel()` | readxl |
| JSON | `fromJSON()` | jsonlite |
| SPSS | `read_sav()` | haven |
| Stata | `read_dta()` | haven |
| SAS | `read_sas()` | haven |
| Fixed-width | `read_fwf()` | readr |
| Big CSV (fast) | `fread()` | data.table |
| R single object | `readRDS()` | base |
| R multi-object | `load()` | base |
| Parquet | `read_parquet()` | arrow |

## References

1. [readr package documentation](https://readr.tidyverse.org/) — modern CSV/TSV/fwf reader
2. [readxl package documentation](https://readxl.tidyverse.org/) — Excel without Java
3. [jsonlite documentation](https://jeroen.r-universe.dev/jsonlite) — JSON parsing
4. [haven package documentation](https://haven.tidyverse.org/) — SPSS/Stata/SAS
5. [data.table::fread](https://rdatatable.gitlab.io/data.table/reference/fread.html) — fastest CSV reader

## Continue Learning

- [R Data Frames: Every Operation You'll Need](R-Data-Frames.html) — what to do with the data after importing.
- [dplyr filter() and select()](dplyr-filter-select.html) — subset your imported data.
- [R Data Types: Which Type Is Your Variable?](R-Data-Types.html) — understand the column types readers produce.
