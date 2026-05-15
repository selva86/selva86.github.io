---
title: "readxl read_xls() in R: Read Legacy .xls Excel Files"
slug: readxl-read_xls-in-R
description: "Learn readxl read_xls() in R to import legacy binary .xls Excel files into tibbles. Covers syntax, sheets, cell ranges, column types, and common errors."
keywords: "readxl read_xls, read_xls function R, readxl read_xls examples, read xls file R, import xls file in R, read legacy Excel R, read_xls vs read_excel"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: readr--readxl--haven
fr_parent: Importing-Data-in-R.html
auto_link_terms: "read_xls()|readxl read_xls|readxl::read_xls()|read xls file in R|legacy Excel file"
auto_link_case_sensitive: true
target_keyword: "readxl read_xls"
sibling_block_enabled: true
difficulty: Beginner
---

# readxl read_xls() in R: Read Legacy .xls Excel Files

<p class="lead">The readxl read_xls() function reads a legacy binary .xls Excel file into a tibble. It targets the old pre-2007 format only, so it fails fast on a modern .xlsx workbook instead of guessing.</p>

[QUICK ANSWER]
read_xls("data.xls")                       # read the first sheet
read_xls("data.xls", sheet = "Sales")      # read a sheet by name
read_xls("data.xls", sheet = 2)            # read a sheet by position
read_xls("data.xls", range = "A1:D20")     # read a fixed cell range
read_xls("data.xls", skip = 4)             # skip junk rows above header
read_xls("data.xls", col_names = FALSE)    # treat row 1 as data
read_xls("data.xls", col_types = "text")   # force every column to text
read_xls("data.xls", n_max = 100)          # read only the first 100 rows

[DECISION TREE: Is read_xls() the right tool?]
- file is a legacy binary .xls workbook: read_xls("old.xls")
- file is a modern .xlsx workbook: read_xlsx("new.xlsx")
- unsure which Excel format the file is: read_excel("data.xls")
- list sheet names before reading: excel_sheets("old.xls")
- file is a plain CSV: read_csv("data.csv")
- file is SPSS, SAS or Stata: read_sav("data.sav")

## What read_xls() does

**The readxl read_xls() function imports one sheet of a legacy .xls workbook as a tibble.** You give it a file path and, optionally, which sheet and which cells to read. It returns a tidy data frame with one column per field and detected column types.

The `.xls` format is the binary file Excel used before 2007. `read_xls()` parses it through the bundled libxls C library, so it needs no Java, no Perl, and no Excel install.

[KEY INSIGHT]
**read_xls() is the format-specific engine; read_excel() is the dispatcher.** `read_excel()` peeks at the file, then calls `read_xls()` or `read_xlsx()` for you. Call `read_xls()` directly when you know the file is the old format and want a clear error if it is not.

## Syntax and key arguments

**Most calls need only the `path` argument; the rest control which cells to read and how to parse them.** A workbook can hold many sheets, so the arguments below tell `read_xls()` exactly what to pull.

```r title="The read_xls signature"
read_xls(
  path,                  # path to the .xls file
  sheet = NULL,          # sheet name or position; NULL reads the first
  range = NULL,          # cell range like "B2:D10"; overrides sheet and skip
  col_names = TRUE,      # TRUE, FALSE, or a character vector of names
  col_types = NULL,      # NULL guesses; or "text", "numeric", "date", ...
  na = "",               # strings to treat as missing
  trim_ws = TRUE,        # strip leading and trailing whitespace
  skip = 0,              # rows to skip before the header
  n_max = Inf,           # maximum number of data rows to read
  guess_max = 1000       # rows scanned when guessing column types
)
```

The arguments you reach for most are `sheet` (pick the tab you want), `range` (read a precise block of cells), `skip` (jump past export junk), and `col_types` (stop the type guessing when you know the schema).

[NOTE]
**Coming from Python pandas?** The equivalent of `read_xls("data.xls")` is `pandas.read_excel("data.xls")`. The argument names differ: pandas uses `sheet_name` where readxl uses `sheet`, and `nrows` where readxl uses `n_max`.

## read_xls() examples

**readxl ships example .xls workbooks, so every example below runs without a file of your own.** The helper `readxl_example()` returns the path to a bundled file.

```r title="Read the first sheet of an xls workbook"
library(readxl)

path <- readxl_example("datasets.xls")
read_xls(path)
#> # A tibble: 150 x 5
#>   Sepal.Length Sepal.Width Petal.Length Petal.Width Species
#>          <dbl>       <dbl>        <dbl>       <dbl> <chr>
#> 1          5.1         3.5          1.4         0.2 setosa
#> 2          4.9         3            1.4         0.2 setosa
#> 3          4.7         3.2          1.3         0.2 setosa
#> # i 147 more rows
```

With no `sheet` argument, `read_xls()` returns the first tab, which holds the iris data here.

**A workbook usually has more than one sheet.** List them with `excel_sheets()`, then pass a name or a position to `sheet`.

```r title="List sheets and read one by name"
excel_sheets(path)
#> [1] "iris"     "mtcars"   "chickwts" "quakes"

read_xls(path, sheet = "mtcars")
#> # A tibble: 32 x 11
#>     mpg   cyl  disp    hp  drat    wt  qsec    vs    am  gear  carb
#>   <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl>
#> 1    21     6   160   110  3.9   2.62  16.5     0     1     4     4
#> 2    21     6   160   110  3.9   2.88  17.0     0     1     4     4
#> # i 30 more rows
```

**Real .xls exports often have title text above the table.** Use `range` to read an exact block, or `skip` to jump past the junk rows so row one becomes the header.

```r title="Skip junk rows with a cell range"
deaths <- readxl_example("deaths.xls")
read_xls(deaths, range = "A5:F15")
#> # A tibble: 10 x 6
#>   Name             Profession   Age `Has kids` `Date of birth`     `Date of death`
#>   <chr>            <chr>      <dbl> <lgl>      <dttm>              <dttm>
#> 1 David Bowie      musician      69 TRUE       1947-01-08 00:00:00 2016-01-10 00:00:00
#> 2 Carrie Fisher    actor         60 TRUE       1956-10-21 00:00:00 2016-12-27 00:00:00
#> 3 Chuck Berry      musician      90 TRUE       1926-10-18 00:00:00 2017-03-18 00:00:00
#> # i 7 more rows
```

[TIP]
**Use `readxl_example()` to prototype before the real file arrives.** The bundled `datasets.xls`, `deaths.xls`, and `type-detection.xls` files let you test sheet, range, and column-type code without a workbook of your own.

**Stop the type guessing when you know the schema.** Pass a vector to `col_types` so every column is read exactly as you intend.

```r title="Force column types on import"
read_xls(path, sheet = "mtcars",
         col_types = c("numeric", "text", rep("numeric", 9)))
#> # A tibble: 32 x 11
#>     mpg cyl    disp    hp  drat    wt  qsec    vs    am  gear  carb
#>   <dbl> <chr> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl>
#> 1    21 6       160   110  3.9   2.62  16.5     0     1     4     4
#> 2    21 6       160   110  3.9   2.88  17.0     0     1     4     4
#> # i 30 more rows
```

Here the `cyl` column is forced to text. A single value, such as `"text"`, applies that type to every column.

## read_xls() vs read_excel() vs read_xlsx()

**All three functions return the same tibble; they differ in which file format they accept.** Pick the specific reader when you know the format, and the dispatcher when you do not.

| Function | Reads | Behavior on the wrong format |
|----------|-------|------------------------------|
| `read_xls()` | Legacy binary `.xls` only | Errors on a `.xlsx` file |
| `read_xlsx()` | Modern `.xlsx` only | Errors on a `.xls` file |
| `read_excel()` | Both `.xls` and `.xlsx` | Detects the format, then dispatches |

Use `read_excel()` in scripts that accept either format from users. Use `read_xls()` in a pipeline where every file should be the old format, so a stray `.xlsx` fails loudly instead of slipping through.

## Common pitfalls

**Passing a .xlsx file to read_xls() throws an error.** The libxls engine cannot parse the newer zipped XML format, so `read_xls("modern.xlsx")` stops with a "file is not a valid binary" error. Switch to `read_xlsx()` or the format-agnostic `read_excel()`.

[WARNING]
**A file named .xls is not always a real .xls.** Legacy systems often export an HTML table or a tab-separated file but save it with an `.xls` extension. `read_xls()` will reject it. Open the file in a text editor to check, then use `read_html()` or `read_tsv()` instead.

**Date columns can arrive as numbers.** Excel stores dates as serial numbers, and if a date column also contains text, `read_xls()` may guess `numeric`. Set `col_types = "date"` for that column to force correct parsing.

## Try it yourself

**Try it:** Read only the `mtcars` sheet from the bundled `datasets.xls`, keeping just the first 5 rows. Save the result to `ex_cars`.

```r title="Your turn: read an xls sheet"
# Try it: read the mtcars sheet, first 5 rows
ex_cars <- # your code here

ex_cars
#> Expected: 5 rows, 11 columns
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
library(readxl)
ex_cars <- read_xls(readxl_example("datasets.xls"), sheet = "mtcars", n_max = 5)
dim(ex_cars)
#> [1]  5 11
```

**Explanation:** `sheet = "mtcars"` selects the tab by name, and `n_max = 5` caps the read at five data rows. The header row does not count toward `n_max`.

</details>

## Related readxl and readr functions

**read_xls() is one reader in a family of import functions.** These cover the formats you meet alongside legacy Excel files:

- `read_xlsx()` reads modern `.xlsx` workbooks.
- `read_excel()` auto-detects `.xls` or `.xlsx` and dispatches.
- `excel_sheets()` lists sheet names before you read.
- `read_csv()` reads comma-separated text files.
- `read_sav()` from haven reads SPSS data files.

See the official [readxl reference](https://readxl.tidyverse.org/reference/read_excel.html) for the full argument list.

## FAQ

**What is the difference between read_xls() and read_excel()?**

`read_xls()` reads only the legacy binary `.xls` format and errors on anything else. `read_excel()` inspects the file first, then calls `read_xls()` or `read_xlsx()` for you. Use `read_excel()` when a script must accept either format, and `read_xls()` when every file should be the old format so a wrong one fails loudly.

**Can read_xls() read .xlsx files?**

No. `read_xls()` uses the libxls engine, which only understands the pre-2007 binary format. Calling it on a `.xlsx` file raises a "not a valid binary" error. Use `read_xlsx()` for modern workbooks, or `read_excel()` if you want automatic detection of either format.

**How do I read a specific sheet with read_xls()?**

Pass the `sheet` argument either a name or a position. `read_xls("data.xls", sheet = "Sales")` reads the tab called Sales, and `read_xls("data.xls", sheet = 2)` reads the second tab. Call `excel_sheets("data.xls")` first to see every sheet name in the workbook.

**Why does read_xls() return dates as numbers?**

Excel stores dates as serial numbers counted from 1899 or 1904. When a column mixes dates with text, the type guesser may settle on `numeric` and leave the serials raw. Fix it by setting `col_types = "date"` for that column so `read_xls()` converts the serials to proper date-times.
</content>
</invoke>
