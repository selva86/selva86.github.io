---
title: "readxl read_excel() in R: Import Excel Files to Tibbles"
slug: readxl-read_excel-in-R
description: "Learn readxl read_excel() in R to import Excel files into tibbles. Covers syntax, reading sheets, cell ranges, column types, skipping rows, and errors."
keywords: "readxl read_excel, read_excel function R, readxl read_excel examples, R read Excel file, import Excel into R, read xlsx in R, read excel sheet R"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: readr--readxl--haven
fr_parent: Importing-Data-in-R.html
auto_link_terms: "read_excel()|readxl read_excel|readxl::read_excel()|read Excel files in R|import Excel into R"
auto_link_case_sensitive: true
target_keyword: "readxl read_excel"
sibling_block_enabled: true
difficulty: Beginner
---

# readxl read_excel() in R: Import Excel Files to Tibbles

<p class="lead">The readxl read_excel() function reads an Excel file into a tibble, detecting whether the workbook is .xls or .xlsx automatically. It needs no Java, no Perl, and no external dependency.</p>

[QUICK ANSWER]
read_excel("data.xlsx")                       # read the first sheet
read_excel("data.xlsx", sheet = "Sales")      # read a sheet by name
read_excel("data.xlsx", sheet = 2)            # read a sheet by position
read_excel("data.xlsx", range = "A1:D20")     # read a fixed cell range
read_excel("data.xlsx", skip = 3)             # skip junk rows above header
read_excel("data.xlsx", col_names = FALSE)    # treat row 1 as data
read_excel("data.xlsx", n_max = 100)          # read only the first 100 rows
read_excel("data.xlsx", na = c("", "NA"))     # set the missing-value strings

[DECISION TREE: Is read_excel() the right tool?]
- read an .xlsx or .xls workbook: read_excel("data.xlsx")
- list sheet names before reading: excel_sheets("data.xlsx")
- file is a plain CSV: read_csv("data.csv")
- file is tab-separated text: read_tsv("data.tsv")
- file is SPSS, SAS or Stata: read_sav("data.sav")
- file is a Parquet dataset: read_parquet("data.parquet")

## What read_excel() does

**read_excel() turns one sheet of an Excel workbook into a tibble.** You give it a file path and, optionally, which sheet and which cells to read. It returns a tidy data frame with one column per field. The function inspects the file extension and picks the right engine, so `.xls` and `.xlsx` both work through the same call.

Unlike older Excel readers, readxl has no Java or Perl dependency. It ships compiled C and C++ code, which makes it fast and easy to install on any machine.

## Syntax and key arguments

**Most calls need only the `path` argument; the rest control which cells to read and how to parse them.** A workbook can hold many sheets, so the arguments below tell read_excel() exactly what to pull.

```r title="The read_excel signature"
read_excel(
  path,                  # path to the .xls or .xlsx file
  sheet = NULL,          # sheet name or position; NULL reads the first
  range = NULL,          # cell range like "B2:D10"; overrides sheet/skip
  col_names = TRUE,      # TRUE, FALSE, or a character vector of names
  col_types = NULL,      # NULL guesses; or "text", "numeric", "date", ...
  na = "",               # strings to treat as missing
  skip = 0,              # rows to skip before the header
  n_max = Inf,           # maximum number of data rows to read
  guess_max = 1000       # rows scanned when guessing column types
)
```

The arguments you reach for most are `sheet` (pick the tab you want), `range` (read a precise block of cells), `skip` (jump past export junk), and `col_types` (stop the type guessing when you know the schema).

[NOTE]
**Coming from Python pandas?** The equivalent of `read_excel("data.xlsx")` is `pandas.read_excel("data.xlsx")`. The argument names differ: pandas uses `sheet_name` where readxl uses `sheet`, and `nrows` where readxl uses `n_max`.

## read_excel() examples

**readxl ships example workbooks, so every example below runs without a file of your own.** The helper `readxl_example()` returns the path to a bundled file.

```r title="Read the first sheet of a workbook"
library(readxl)

path <- readxl_example("datasets.xlsx")
read_excel(path)
#> # A tibble: 150 x 5
#>   Sepal.Length Sepal.Width Petal.Length Petal.Width Species
#>          <dbl>       <dbl>        <dbl>       <dbl> <chr>
#> 1          5.1         3.5          1.4         0.2 setosa
#> 2          4.9         3            1.4         0.2 setosa
#> 3          4.7         3.2          1.3         0.2 setosa
#> # i 147 more rows
```

With no `sheet` argument, read_excel() returns the first tab. This workbook's first sheet is the iris data.

**A workbook usually has more than one sheet.** List them with `excel_sheets()`, then pass a name or a position to `sheet`.

```r title="List sheets and read one by name"
excel_sheets(path)
#> [1] "iris"     "mtcars"   "chickwts" "quakes"

read_excel(path, sheet = "mtcars")
#> # A tibble: 32 x 11
#>     mpg   cyl  disp    hp  drat    wt  qsec    vs    am  gear  carb
#>   <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl>
#> 1    21     6   160   110  3.9   2.62  16.5     0     1     4     4
#> 2    21     6   160   110  3.9   2.88  17.0     0     1     4     4
#> # i 30 more rows
```

**Read a precise block of cells with `range`.** This is the cleanest fix for messy workbooks where the real table does not start at cell A1.

```r title="Read a fixed cell range"
read_excel(path, range = "C1:E5")
#> # A tibble: 4 x 3
#>   Petal.Length Petal.Width Species
#>          <dbl>       <dbl> <chr>
#> 1          1.4         0.2 setosa
#> 2          1.4         0.2 setosa
#> 3          1.3         0.2 setosa
#> 4          1.5         0.2 setosa
```

The range `"C1:E5"` keeps columns C through E and rows 1 through 5, treating row 1 as the header.

**Skip junk rows and cap the row count.** Reports often carry a title or blank rows above the real header. `skip` jumps past them and `n_max` limits how much you read.

```r title="Skip rows and limit the read"
read_excel(path, sheet = "chickwts", skip = 0, n_max = 3)
#> # A tibble: 3 x 2
#>   weight feed
#>    <dbl> <chr>
#> 1    179 horsebean
#> 2    160 horsebean
#> 3    136 horsebean
```

[TIP]
**Set col_types when a column matters.** Passing `col_types = c("text", "numeric")` skips the guessing scan and guarantees stable types. Use `"skip"` for any column you want to drop entirely while reading.

## read_excel() vs read_xlsx(), read_xls() and alternatives

**read_excel() is the general-purpose reader; read_xlsx() and read_xls() force one format.** They share arguments but differ in how they detect the file type.

| Function | Reads | Format detection | Best for |
|----------|-------|------------------|----------|
| `read_excel()` | `.xls` and `.xlsx` | automatic from the file | most Excel work |
| `read_xlsx()` | `.xlsx` only | none, assumes xlsx | files with a wrong extension |
| `read_xls()` | `.xls` only | none, assumes xls | legacy xls with a wrong extension |
| `read_csv()` | `.csv` text | not applicable | comma-separated exports |

Use `read_excel()` by default. Drop to `read_xlsx()` or `read_xls()` only when a file has the wrong extension and automatic detection picks the wrong engine.

## Common pitfalls

**Reading the wrong sheet without noticing.** When you omit `sheet`, read_excel() silently returns the first tab. If your data lives on a later sheet, the result looks valid but holds the wrong table. Always confirm with `excel_sheets()` first.

**Passing a sheet position that does not exist.** A workbook with four sheets has no sheet 5, and the call errors.

```r title="Pitfall: sheet index out of range"
# read_excel(path, sheet = 9)   # error: sheet not found
read_excel(path, sheet = 4)     # correct: 'quakes' is the fourth sheet
#> # A tibble: 1,000 x 5
#>     lat  long depth   mag stations
#>   <dbl> <dbl> <dbl> <dbl>    <dbl>
#> 1 -20.4  182.   562   4.8       41
#> # i 999 more rows
```

**Numbers stored as text in Excel.** If a cell is formatted as text, read_excel() reads it as a character column. Fix it after reading with `as.numeric()`, or force the type with `col_types = "numeric"`.

[WARNING]
**Excel dates can drift by a day.** Workbooks made on classic Mac Excel use the 1904 date system. readxl detects this from the file, but a hand-edited or converted file can carry a wrong flag. Always spot-check the first and last dates after reading.

## Try it yourself

**Try it:** Read the `mtcars` sheet from the bundled `datasets.xlsx` workbook, then count how many rows have `cyl` equal to 4. Save the count to `ex_count`.

```r title="Your turn: read a sheet and count"
# Try it: read the mtcars sheet, count cyl == 4
ex_data <- # your code here

ex_count <- # your code here
ex_count
#> Expected: 11
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_data <- read_excel(readxl_example("datasets.xlsx"), sheet = "mtcars")
ex_count <- sum(ex_data$cyl == 4)
ex_count
#> [1] 11
```

**Explanation:** `sheet = "mtcars"` selects the tab by name. Summing a logical vector counts the `TRUE` values, which gives the number of 4-cylinder cars.

</details>

## Related readxl functions

**read_excel() works alongside a small set of readxl helpers.** Reach for the one that matches your task.

- `read_xlsx()`: force the modern `.xlsx` engine regardless of extension.
- `read_xls()`: force the legacy `.xls` engine for old workbooks.
- `excel_sheets()`: list every sheet name before you read.
- `readxl_example()`: get paths to the example workbooks bundled with the package.
- `cell_rows()` and `cell_cols()`: build a `range` from row or column numbers.

For the full argument reference, see the [readxl documentation](https://readxl.tidyverse.org/reference/read_excel.html) on tidyverse.org.

## FAQ

**How do I read a specific sheet from an Excel file in R?**

Pass the `sheet` argument to `read_excel()`. It accepts a sheet name as a string, such as `read_excel("data.xlsx", sheet = "Sales")`, or a position as a number, such as `sheet = 2`. Run `excel_sheets("data.xlsx")` first to see every available sheet name so you select the correct one.

**What is the difference between read_excel() and read.xlsx()?**

`read_excel()` comes from the readxl package and has no Java dependency, so it installs cleanly everywhere and returns a tibble. `read.xlsx()` from the xlsx package needs Java and rJava, which often fails to configure. Use `read_excel()` for new code; it is faster and far easier to install.

**How do I read an .xls file in R?**

`read_excel()` reads `.xls` files directly. It detects the legacy format from the file itself and uses the right engine, so the same call works for both `.xls` and `.xlsx`. If a file has the wrong extension, call `read_xls()` to force the legacy engine.

**Can read_excel() read an Excel file from a URL?**

Not directly. `read_excel()` needs a local file path. Download the workbook first with `download.file(url, "data.xlsx", mode = "wb")`, then pass that path to `read_excel()`. The `mode = "wb"` argument matters, because Excel files are binary and a text-mode download corrupts them.

**Why are my Excel numbers showing as text in R?**

The cells are formatted as text in Excel, so read_excel() reads them as a character column. Force the type with `col_types = "numeric"` for that column, or convert after reading with `as.numeric()`. Watch for stray spaces or thousands separators, which also push a column to text.
