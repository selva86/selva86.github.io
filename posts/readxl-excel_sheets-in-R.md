---
title: "readxl excel_sheets() in R: List Excel Sheet Names"
slug: readxl-excel_sheets-in-R
description: "Use readxl excel_sheets() in R to list every sheet name in an Excel workbook before you read it. Syntax, examples, looping over sheets, and common pitfalls."
keywords: "readxl excel_sheets, excel_sheets function R, readxl excel_sheets examples, R list Excel sheet names, get sheet names from Excel R, read Excel sheet names R"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: readr--readxl--haven
fr_parent: Importing-Data-in-R.html
auto_link_terms: "excel_sheets()|readxl excel_sheets|readxl::excel_sheets()|list Excel sheet names|get Excel sheet names"
auto_link_case_sensitive: true
target_keyword: "readxl excel_sheets"
sibling_block_enabled: true
difficulty: Beginner
---

# readxl excel_sheets() in R: List Excel Sheet Names

<p class="lead">The readxl excel_sheets() function lists every worksheet name inside an Excel file, returning them as a character vector so you can inspect a workbook before reading any data.</p>

[QUICK ANSWER]
excel_sheets("data.xlsx")                     # list all sheet names
excel_sheets(readxl_example("datasets.xlsx")) # a bundled example file
length(excel_sheets(path))                    # count the sheets
"iris" %in% excel_sheets(path)                # does a sheet exist?
excel_sheets(path)[1]                         # first sheet by position
read_excel(path, sheet = excel_sheets(path)[2])  # read the 2nd sheet
lapply(excel_sheets(path), read_excel, path = path)  # read every sheet

[DECISION TREE: Is excel_sheets() the right tool?]
- list sheet names in a workbook: excel_sheets(path)
- read one sheet into a data frame: read_excel(path, sheet = "name")
- read a cell range only: read_excel(path, range = "B2:D10")
- write data to an Excel file: writexl::write_xlsx(df, path)
- read an old .xls file: read_xls(path)
- read a plain CSV instead: readr::read_csv(path)

## What excel_sheets() does

**The excel_sheets function is a workbook scanner.** You hand it the path to an Excel file and it returns the names of every worksheet, in tab order, as a plain character vector. It never opens or parses the cell data, which keeps it fast even on workbooks with hundreds of thousands of rows. It accepts both the modern xlsx format and the older binary xls format, and detects which one you gave it automatically.

This function matters because real Excel files rarely hold just one sheet. A monthly report may carry a summary tab, twelve tabs of detail, and a hidden tab of lookup values. The reader function in readxl, read_excel, pulls only one sheet per call, so before you can read anything you need to know what the workbook contains.

That is the job excel_sheets does: it tells you which sheets exist and what they are called. With that list of names you can pick a sheet by name, select one by numeric position, or loop over the whole set. Driving your code from these names also makes a script robust, because a renamed tab no longer breaks a hard-coded sheet argument.

[KEY INSIGHT]
**Discovery comes before reading.** Think of excel_sheets as the table of contents and read_excel as the chapter. You scan the contents once, then read only the chapters you need.

## Syntax and arguments

**The signature is the simplest in the readxl package.** The function accepts exactly one argument:

```r title="The excel_sheets signature"
excel_sheets(path)
```

The path argument is a string pointing to an Excel file on disk. It can be an xls file, the legacy binary format from Excel 97 through 2003, or an xlsx file, the modern zipped-XML format. You never pass a flag to say which it is: readxl inspects the file, recognises the format, and dispatches to the right parser.

The return value is always a character vector, even when the workbook holds a single sheet. That consistency helps in practice, because loops and the apply family behave identically whether the file has one tab or fifty. Each element is the literal text of a worksheet tab, with spaces and punctuation preserved exactly as the author typed them.

## excel_sheets() examples

**Begin with a bare call to see what a workbook contains.** The examples below use a sample file bundled inside readxl, so you can run every block without uploading anything. That workbook holds four classic R datasets, one per sheet.

```r title="List every sheet in a workbook"
library(readxl)

# readxl ships example files; ask for a real path
path <- readxl_example("datasets.xlsx")

excel_sheets(path)
#> [1] "iris"     "mtcars"   "chickwts" "quakes"
```

The result lists the four sheets in tab order, reading left to right. Store that vector in a variable so you scan the file only once and reuse the names freely.

```r title="Count sheets and check membership"
sheets <- excel_sheets(path)

length(sheets)
#> [1] 4

"mtcars" %in% sheets
#> [1] TRUE

"sales" %in% sheets
#> [1] FALSE
```

The membership test is the defensive pattern you want in any production script. Checking that an expected sheet is present lets you stop early with a clear message instead of failing deep inside a pipeline.

A common task is reading every sheet at once. Pair excel_sheets with the apply family to build a named list of data frames, one entry per worksheet.

```r title="Read every sheet into a list"
all_data <- lapply(sheets, function(s) read_excel(path, sheet = s))
names(all_data) <- sheets

sapply(all_data, nrow)
#>     iris   mtcars chickwts   quakes
#>      150       32       71     1000
```

Because the returned vector preserves workbook order, you can also pick a sheet by numeric position. That helps when sheet names change between monthly files but the layout stays fixed.

```r title="Read a sheet by position"
# index 2 is the second tab in the workbook
second <- read_excel(path, sheet = excel_sheets(path)[2])
dim(second)
#> [1] 32 11
```

## excel_sheets() vs the alternatives

**The excel_sheets function is the readxl-native way to discover sheets, but not the only one.** The table below compares the approaches you are most likely to meet.

| Approach | Returns | Use when |
|---|---|---|
| `excel_sheets(path)` | Character vector of names | You need names before reading |
| `read_excel(path, sheet = N)` | Data frame of one sheet | You already know the sheet |
| `openxlsx::getSheetNames(path)` | Character vector of names | You already depend on openxlsx |
| `readxl_example(name)` | Path to a bundled file | Practising without your own file |

The decision rule is short. If you only need the data and you already know the sheet, go straight to read_excel with the sheet argument. If the workbook is unfamiliar, or you must process several sheets in one pass, call excel_sheets first and let the rest of your code flow from its output.

[NOTE]
**Coming from Python pandas?** The equivalent of excel_sheets is the sheet_names attribute of an ExcelFile object, which also returns worksheet names without loading any data.

## Common pitfalls

**Most errors come from passing the wrong thing as the path.** The argument is a file path on disk. It is not a data frame, not a bare sheet name, and not a dataset loaded in your R session. Passing the name of an in-memory object gives a "path does not exist" error.

```r title="A path is required, not data"
# Wrong: passing a name where a file path belongs
excel_sheets("mtcars")
#> Error: `path` does not exist: 'mtcars'

# Right: pass the workbook file path
excel_sheets(readxl_example("datasets.xlsx"))
#> [1] "iris"     "mtcars"   "chickwts" "quakes"
```

Two further traps catch beginners. The first is the working directory: a relative path is resolved against wherever R currently sits, so a bare file name fails when the session points elsewhere. Use an absolute path or a project-relative helper. The second is whitespace, since worksheet tabs sometimes carry invisible leading or trailing spaces that survive into the vector and break an exact-match comparison. Trim the names before you compare them.

[WARNING]
**Hidden sheets still show up.** The excel_sheets function returns every worksheet, including ones marked hidden or very hidden in Excel. readxl exposes no visibility flag, so filter the vector yourself if your workflow should ignore hidden tabs.

## Try it yourself

**Try it:** Use excel_sheets() to scan the bundled "datasets.xlsx" workbook, then save the number of sheets to ex_count.

```r title="Your turn: count workbook sheets"
# Try it: count the sheets
ex_path <- readxl_example("datasets.xlsx")
ex_count <- # your code here

ex_count
#> Expected: 4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_path <- readxl_example("datasets.xlsx")
ex_count <- length(excel_sheets(ex_path))
ex_count
#> [1] 4
```

**Explanation:** The excel_sheets function returns a character vector of sheet names. Wrapping that vector in the length function turns it into a count of how many worksheets the workbook holds.

</details>

## Related readxl functions

**The excel_sheets function is the entry point to the wider readxl toolkit.** These functions handle the steps before and after sheet discovery:

- read_excel reads a chosen sheet into a tibble and is the everyday workhorse of readxl.
- read_xlsx and read_xls are format-specific readers for when you want to be explicit about the file type.
- readxl_example returns paths to bundled sample workbooks, ideal for practice and reproducible examples.
- cell_limits and anchored restrict a read to a precise rectangular block of cells.

For the official argument reference, see the [readxl documentation](https://readxl.tidyverse.org/reference/excel_sheets.html).

## FAQ

**What does excel_sheets() return?**

It returns a character vector containing the name of every worksheet in the workbook, listed in tab order from left to right. The vector holds one element per sheet, so a four-sheet file produces a length-four vector. It never returns cell contents, formatting, or visibility flags. For the actual data you call read_excel afterwards, supplying one of the names excel_sheets gave you.

**Does excel_sheets() read the data too?**

No, and that is deliberate. The function inspects only the workbook structure and reports the sheet names. Scanning names stays fast even for very large files, while reading the data can be slow. The intended workflow is to call excel_sheets once, decide which sheets you need, and then call read_excel separately for each one.

**Can excel_sheets() list hidden sheets?**

Yes. The function returns every worksheet regardless of visibility, so sheets marked hidden or very hidden appear alongside visible ones. readxl gives you no visibility attribute to test, so if your workflow must skip hidden tabs you need to filter the returned vector against names you already trust.

**How do I read all sheets in an Excel file at once?**

Combine excel_sheets with the apply family. Pass the vector of sheet names to lapply and call read_excel inside, supplying the same path each time. Assign the names back onto the result so you finish with a named list of data frames, one entry per worksheet, ready for analysis or for binding into a single table.
