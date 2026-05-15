---
title: "readxl read_xlsx() in R: Read Modern .xlsx Files"
slug: readxl-read_xlsx-in-R
description: "Learn readxl read_xlsx() in R to import modern .xlsx Excel files into tibbles. Covers syntax, sheet selection, cell ranges, column types, and common errors."
keywords: "readxl read_xlsx, read_xlsx function R, readxl read_xlsx examples, read xlsx file R, import Excel file in R, read_xlsx vs read_excel, read xlsx into R"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: readr--readxl--haven
fr_parent: Importing-Data-in-R.html
auto_link_terms: "read_xlsx()|readxl read_xlsx|readxl::read_xlsx()|read xlsx file in R|read Excel files in R"
auto_link_case_sensitive: true
target_keyword: "readxl read_xlsx"
sibling_block_enabled: true
difficulty: Beginner
---

# readxl read_xlsx() in R: Read Modern .xlsx Files

<p class="lead">The readxl read_xlsx() function reads a modern .xlsx Excel workbook into a tibble. It targets the post-2007 XML format only, so it fails fast on a legacy binary .xls file instead of guessing.</p>

[QUICK ANSWER]
read_xlsx("data.xlsx")                      # read the first sheet
read_xlsx("data.xlsx", sheet = "Q1")        # read a sheet by name
read_xlsx("data.xlsx", sheet = 3)           # read a sheet by position
read_xlsx("data.xlsx", range = "B2:F50")    # read an exact cell range
read_xlsx("data.xlsx", skip = 3)            # skip title rows above header
read_xlsx("data.xlsx", na = c("", "NA"))    # map blanks and NA to missing
read_xlsx("data.xlsx", col_types = "text")  # force all columns to text

[DECISION TREE: Is read_xlsx() the right tool?]
- file is a modern .xlsx workbook: read_xlsx("data.xlsx")
- file is a legacy binary .xls file: read_xls("old.xls")
- unsure which Excel format you have: read_excel("data.xlsx")
- list sheet names before reading: excel_sheets("data.xlsx")
- file is plain comma-separated text: read_csv("data.csv")
- file is SPSS, SAS or Stata: read_sav("data.sav")

## What read_xlsx() does

**read_xlsx() imports one sheet of a modern .xlsx workbook as a tibble.** You pass a file path and, optionally, which sheet and which cells to read. It returns a tidy data frame with one column per field and a guessed type for each column.

The `.xlsx` format is the zipped XML package Excel has used since 2007. `read_xlsx()` unpacks it with a bundled C++ parser, so it needs no Java, no Perl, and no Excel install on the machine that runs your code.

[KEY INSIGHT]
**read_xlsx() is the format-specific engine; read_excel() is the dispatcher.** `read_excel()` inspects the file, then hands off to `read_xlsx()` or `read_xls()` for you. Call `read_xlsx()` directly when you know the file is the modern format and want a hard error if it is not.

## Syntax and key arguments

**Most calls need only the `path` argument; the rest control which cells to read and how to parse them.** A workbook can hold dozens of sheets, so the arguments below tell `read_xlsx()` exactly what to extract.

```r title="The read_xlsx signature"
read_xlsx(
  path,                  # path to the .xlsx file
  sheet = NULL,          # sheet name or position; NULL reads the first
  range = NULL,          # cell range like "B2:F50"; overrides sheet and skip
  col_names = TRUE,      # TRUE, FALSE, or a character vector of names
  col_types = NULL,      # NULL guesses; or "text", "numeric", "date", ...
  na = "",               # strings to treat as missing
  trim_ws = TRUE,        # strip leading and trailing whitespace
  skip = 0,              # rows to skip before the header
  n_max = Inf,           # maximum number of data rows to read
  guess_max = 1000       # rows scanned when guessing column types
)
```

The arguments you reach for most are `sheet` (pick the tab you want), `range` (read a precise block of cells), `skip` (jump past export junk), and `col_types` (stop the type guessing when you already know the schema). The full list is in the [readxl reference](https://readxl.tidyverse.org/reference/read_excel.html).

[NOTE]
**Coming from Python pandas?** The equivalent of `read_xlsx("data.xlsx")` is `pandas.read_excel("data.xlsx")`. The argument names differ: pandas uses `sheet_name` where readxl uses `sheet`, and `nrows` where readxl uses `n_max`.

## read_xlsx() examples

**readxl ships an example .xlsx workbook, so every example below runs without a file of your own.** The helper `readxl_example()` returns the path to a bundled file.

```r title="Read the first sheet of an xlsx file"
library(readxl)

path <- readxl_example("datasets.xlsx")
read_xlsx(path)
#> # A tibble: 150 x 5
#>   Sepal.Length Sepal.Width Petal.Length Petal.Width Species
#>          <dbl>       <dbl>        <dbl>       <dbl> <chr>
#> 1          5.1         3.5          1.4         0.2 setosa
#> 2          4.9         3            1.4         0.2 setosa
#> 3          4.7         3.2          1.3         0.2 setosa
#> # i 147 more rows
```

When a workbook has more than one tab, list the sheet names first, then read the one you want by name.

```r title="List sheets then read one by name"
excel_sheets(path)
#> [1] "iris"     "mtcars"   "chickwts" "quakes"

read_xlsx(path, sheet = "mtcars")
#> # A tibble: 32 x 11
#>     mpg   cyl  disp    hp  drat    wt  qsec    vs    am  gear  carb
#>   <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl>
#> 1  21       6   160   110  3.9   2.62  16.5     0     1     4     4
#> 2  21       6   160   110  3.9   2.88  17.0     0     1     4     4
#> 3  22.8     4   108    93  3.85  2.32  18.6     1     1     4     1
#> # i 29 more rows
```

The `range` argument reads an exact block of cells in A1 notation. It overrides both `sheet` position logic and `skip`, so use it when an export buries the table inside a larger layout.

```r title="Read an exact block of cells"
read_xlsx(path, sheet = "mtcars", range = "A1:D6")
#> # A tibble: 5 x 4
#>     mpg   cyl  disp    hp
#>   <dbl> <dbl> <dbl> <dbl>
#> 1  21       6   160   110
#> 2  21       6   160   110
#> 3  22.8     4   108    93
#> 4  21.4     6   258   110
#> 5  18.7     8   360   175
```

[TIP]
**Copy the range straight from Excel.** Highlight a block in the spreadsheet, read the address shown in the Name Box, and paste it into `range`. A sheet-qualified range like `"mtcars!A1:D6"` is also valid and makes the call self-documenting.

Pass `col_types` a character vector to lock each column to a type. This stops readxl guessing from a sample and silences surprises when later rows hold unexpected values.

```r title="Force column types when reading"
read_xlsx(path, sheet = "chickwts", col_types = c("numeric", "text"))
#> # A tibble: 71 x 2
#>   weight feed
#>    <dbl> <chr>
#> 1    179 horsebean
#> 2    160 horsebean
#> 3    136 horsebean
#> # i 68 more rows
```

## read_xlsx() vs read_excel() and read_xls()

**Pick read_xlsx() when the file is definitely .xlsx; pick read_excel() when the format is uncertain.** All three return the same kind of tibble, so the choice is only about how strict you want the format check to be.

| Function | Reads | When to use |
|---|---|---|
| `read_xlsx()` | .xlsx only | You know the file is modern Excel |
| `read_xls()` | .xls only | You know the file is the legacy binary format |
| `read_excel()` | .xls and .xlsx | Format is unknown or varies across files |
| `read_csv()` | .csv text | File is plain comma-delimited text |

The decision rule is simple. In a script that always receives the same modern export, name the format explicitly with `read_xlsx()` so a wrong-format file fails loudly. In an interactive session where files arrive in mixed formats, `read_excel()` saves you from checking extensions by hand.

## Common pitfalls

**read_xlsx() will not open a legacy .xls file.** The binary `.xls` format is not zipped XML, so the parser rejects it rather than misreading it.

```r title="read_xlsx only opens xlsx files"
read_xlsx(readxl_example("datasets.xls"))
#> Error: Can't establish that the input is either xls or xlsx.
```

The fix is to call `read_xls()` for that file, or `read_excel()` if you do not know the format ahead of time.

[WARNING]
**A col_types vector must have one entry per column.** If its length does not match the sheet width, readxl aborts. The `mtcars` sheet has 11 columns, so `read_xlsx(path, sheet = "mtcars", col_types = c("numeric", "text"))` raises `Error: Sheet 1 has 11 columns, but col_types has length 2`. Supply all 11 types, or pass a single value like `"numeric"` to apply it to every column.

A third trap is blank header cells. When the first row has empty cells, or you set `col_names = FALSE`, readxl auto-names columns `...1`, `...2`, and so on. Pass an explicit character vector to `col_names` to give the columns meaningful names instead.

## Try it yourself

**Try it:** Read the `quakes` sheet from the bundled `datasets.xlsx` workbook, keeping only the first 10 rows. Save the result to `ex_quakes`.

```r title="Your turn: read the quakes sheet"
# Try it: read 10 rows of the quakes sheet
library(readxl)
path <- readxl_example("datasets.xlsx")
ex_quakes <- # your code here

ex_quakes
#> Expected: 10 rows
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_quakes <- read_xlsx(path, sheet = "quakes", n_max = 10)
nrow(ex_quakes)
#> [1] 10
```

**Explanation:** The `sheet` argument picks the tab by name and `n_max` caps how many data rows readxl reads. Capping rows is handy for previewing the shape of a large workbook before loading all of it.

</details>

## Related readxl functions

- `read_excel()` reads either Excel format and auto-detects which one a file uses.
- `read_xls()` reads the legacy binary `.xls` format from pre-2007 Excel.
- `excel_sheets()` lists every sheet name in a workbook before you read.
- `readxl_example()` returns file paths to the practice workbooks bundled with readxl.
- `read_csv()` from readr reads plain delimited text when the data is not an Excel file.

## FAQ

**What is the difference between read_xlsx() and read_excel() in R?**

`read_xlsx()` reads only the modern `.xlsx` format and errors on anything else. `read_excel()` is a wrapper that inspects the file, then calls `read_xlsx()` or `read_xls()` for you. Use `read_xlsx()` in a pipeline where the input format is fixed and a wrong file should fail loudly. Use `read_excel()` in interactive work where files arrive in both old and new Excel formats.

**How do I read a specific sheet with read_xlsx()?**

Pass the `sheet` argument either a sheet name as a string, like `sheet = "Q1"`, or a position number, like `sheet = 2`. Run `excel_sheets(path)` first to see the exact names. With no `sheet` argument, `read_xlsx()` reads the first sheet in the workbook.

**Why does read_xlsx() fail on my .xls file?**

The `.xls` format is a binary file, while `.xlsx` is zipped XML. `read_xlsx()` only understands the zipped XML structure, so it rejects a legacy file rather than misreading it. Call `read_xls()` for that file, or use `read_excel()`, which detects the format and dispatches to the correct reader automatically.

**How do I read only some rows or columns with read_xlsx()?**

Use `range` to read an exact cell block in A1 notation, such as `range = "A1:D50"`. Use `n_max` to cap the number of data rows and `skip` to drop rows above the header. The `range` argument is the most precise option because it pins both the rows and the columns at once.

**Does read_xlsx() need Excel or Java installed?**

No. `read_xlsx()` parses the workbook with a C++ library bundled inside the readxl package. It needs no copy of Microsoft Excel, no Java runtime, and no Perl. That makes it safe to run on servers and in continuous integration jobs where no office software is installed.
