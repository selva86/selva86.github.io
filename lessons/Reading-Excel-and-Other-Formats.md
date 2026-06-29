---
title: "Importing Data Lesson 2: Reading Excel and Other Formats"
catalog_blurb: "How to read Excel workbooks and SPSS, Stata and SAS files into R."
description: "Read Excel workbooks into R with readxl, pick the sheet and cell range you need, then load SPSS, Stata and SAS files with haven, labelled columns and all."
keywords: "read excel in R, readxl, read_excel, excel_sheets, sheet and range, haven, read_sav, read_dta, SPSS Stata SAS in R, labelled data, as_factor, import data in R"
post_type: "LESSON"
curriculum_id: "1.4.2"
webr: true
lesson_access: "free"
course_id: "nr-import"
course_title: "Importing Data into R"
course_lesson: "2"
course_total: "5"
course_landing: "R-Foundations-Import-Course.html"
course_next: "JSON-and-Web-Data.html"
course_prev: "Reading-CSV-and-Delimited-Files.html"
---

=== step === cover
::eyebrow Lesson 2 of 5
## Reading Excel and Other Formats

In lesson 1 you read Maria's bakery sales out of a plain-text `.csv` file. But not everything arrives as text. Her accountant now emails the week's books as an **Excel workbook**, `accounts.xlsx`, and a market-research firm sends a customer survey as an **SPSS** file, `survey.sav`. Open either one in a text editor and you get gibberish: these are not text files, so `read_csv()` cannot help.

The good news is that each format has its own one-line reader, and they all hand you back the same tidy tibble you already know how to work with. By the end of this lesson you will be able to:

- Read an `.xlsx` workbook into R in a single line, and say why a spreadsheet needs a special reader
- Pull out exactly the **sheet** and the **cell range** you want from a multi-sheet workbook
- Read **SPSS, Stata and SAS** files, and turn their coded columns into readable labels
- Pick the right reader for any file you are handed

**Prerequisites:** lesson 1 (you know what a tibble is and that columns have a **type**), and you can load a package with `library()`. Every new term is defined as it appears. The map below is the whole lesson in one picture: which reader goes with which file.

::widget tree-diagram {"root":"a spreadsheet file?","l":"an .xlsx file?","r":"SPSS or Stata?","leaves":["read_excel","read_csv","read_sav","read_dta"]}

=== step === concept
::eyebrow Why a special reader
## A spreadsheet is not a text file

A `.csv` is plain text: every value, comma and line is a character you could read by eye. An Excel `.xlsx` is a different animal. Behind the friendly grid, the file is actually a small **zip archive of XML documents** describing cells, formats, formulas and multiple sheets. None of that is plain text, so handing it to `read_csv()` produces nonsense.

So Excel gets its own reader, the **readxl** package:

- `readxl` is part of the tidyverse and reads both modern `.xlsx` and the older `.xls`.
- Its main function, `read_excel()`, takes a file path and returns a **tibble**, exactly like `read_csv()`.
- It needs no Excel installation and no extra software. It reads the file directly.

[NOTE]
This same idea, "a binary format needs its own reader," is the whole lesson. Excel uses `readxl`; the statistics packages SPSS, Stata and SAS use a package called `haven`. Once you know which reader matches which file, the rest is the tibble skills you already have.

=== step === concept
::eyebrow The one-liner
## Read a workbook in one line

Let us make a real workbook to open. Each lesson runs in a fresh R session, so we will **write** an `.xlsx` file in-session with `write_xlsx()`, then read it straight back. That gives us a genuine spreadsheet to practise on, the kind Maria's accountant would send. Run this once.

```r
library(writexl)
library(readxl)

# Build Maria's weekly sales, then save it AS an Excel file
sales <- data.frame(
  date  = c("2026-03-09", "2026-03-10", "2026-03-11"),
  item  = c("croissant", "muffin", "baguette"),
  qty   = c(14, 11, 6),
  price = c(2.50, 3.25, 4.00)
)
path <- tempfile(fileext = ".xlsx")   # a temporary .xlsx path
write_xlsx(sales, path)               # now an actual workbook lives there

accounts <- read_excel(path)          # read it back: one line, just like read_csv
accounts
#> # A tibble: 3 x 4
#>   date       item        qty price
#>   <chr>      <chr>     <dbl> <dbl>
#> 1 2026-03-09 croissant    14  2.5
#> 2 2026-03-10 muffin       11  3.25
#> 3 2026-03-11 baguette      6  4
```

Look at the grey type row under the names: `<chr>`, `<chr>`, `<dbl>`, `<dbl>`. Just like `read_csv()`, `read_excel()` **inspected the values and guessed a type** for every column. `qty` and `price` came in as numbers (`<dbl>`, a double, a number that allows decimals), so `sum(accounts$price)` works right away. The `date` column was stored as text here, so it arrives as `<chr>`; you would fix that with the same column-type tools from lesson 1.

[KEY INSIGHT]
You did not configure anything. `read_excel(path)` opened a binary spreadsheet and handed back a tidy, typed tibble in one line. Everything you already know about tibbles and column types carries straight over.

=== step === quiz
::eyebrow Check yourself
## Why one line, and where did the types come from?

Maria forwards you `accounts.xlsx` and you run `read_csv("accounts.xlsx")` out of habit. It fails or returns garbage. What is going on, and what should you do?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- The file is corrupted; ask Maria to export it again ::no Nothing is wrong with the file. `read_csv` is a text reader, and an `.xlsx` is a binary workbook, so the right move is a different reader, not a re-export.
- An .xlsx is a binary workbook, not text, so you need read_excel() from readxl ::ok Right. `read_csv` only understands plain text. `read_excel()` knows the Excel format and returns the same kind of tibble, with column types guessed for you.
- read_excel cannot guess types, so you must declare every column before reading ::no The opposite. `read_excel()` inspects the values and guesses each column type automatically, just like `read_csv()`. You only step in to override a wrong guess.

=== step === concept
::eyebrow Sheets and ranges
## Target one sheet, or one range

A real `accounts.xlsx` is rarely a single table. A workbook is a **book of sheets** (the tabs along the bottom of Excel), and the numbers you want may sit in the middle of one of them, under a title banner. `readxl` gives you two controls for this: pick the **sheet**, and pick the **range** of cells.

First, build a two-sheet workbook (a `Sales` sheet and a `Costs` sheet) and ask what sheets are inside it:

```r
library(writexl)
library(readxl)

book <- list(
  Sales = data.frame(item = c("croissant", "muffin", "baguette"), qty = c(14, 11, 6)),
  Costs = data.frame(supply = c("flour", "butter"), spent = c(1.20, 3.50))
)
book_path <- tempfile(fileext = ".xlsx")
write_xlsx(book, book_path)     # a list of data frames becomes one workbook, one sheet each

excel_sheets(book_path)         # what tabs are in here?
#> [1] "Sales" "Costs"
```

By default `read_excel()` opens the **first** sheet. Name the one you want with `sheet =`:

```r
read_excel(book_path, sheet = "Costs")   # open the Costs tab by name
#> # A tibble: 2 x 2
#>   supply spent
#>   <chr>  <dbl>
#> 1 flour    1.2
#> 2 butter   3.5
```

And when the data does not fill the whole sheet, hand `read_excel()` a spreadsheet-style **range** of cells (the same `A1:B3` notation you type in Excel) to grab exactly that rectangle, header included:

```r
read_excel(book_path, sheet = "Sales", range = "A1:B3")   # just the top-left block
#> # A tibble: 2 x 2
#>   item        qty
#>   <chr>     <dbl>
#> 1 croissant    14
#> 2 muffin       11
```

[NOTE]
A close cousin of `range` is `skip = n`, which ignores the first `n` rows. Use it when a sheet opens with a title banner or a blank row or two above the real header, a very common Excel habit.

=== step === tryit
::eyebrow Your turn
## Pull the Costs sheet

The two-sheet `book_path` workbook from the last step is still loaded. Maria only wants this week's **costs**, which live on the `Costs` sheet. Fill in the argument that selects it by name, then check it.

```r
library(readxl)
read_excel(book_path, ____)
```
::check {"regex":"sheet\\s*=\\s*[\"']Costs[\"']","gate":true,"difficulty":"beginner","ok":"Exactly. sheet = \"Costs\" jumps straight to that tab and returns its two rows as a tibble.","no":"Name the tab you want with the sheet argument: sheet = \"Costs\" (the name must match what excel_sheets() reported)."}
::solution
```r
read_excel(book_path, sheet = "Costs")
```

=== step === concept
::eyebrow Statistics software files
## Beyond spreadsheets: SPSS, Stata and SAS

Survey and research data often arrives not as a spreadsheet but as a file from a **statistics package**: SPSS (`.sav`), Stata (`.dta`) or SAS (`.sas7bdat` / the `.xpt` transport format). These are binary too, and they share one reader, the **haven** package (also tidyverse). The pattern is identical to `readxl`, just a different function per format.

Here is Maria's customer survey, written as an SPSS file and read straight back:

```r
library(haven)

survey <- data.frame(
  respondent = c(1, 2, 3, 4),
  spend      = c(12.5, 7.0, 22.0, 4.5),
  region     = c(1, 2, 1, 3)
)
write_sav(survey, "survey.sav")   # save AS an SPSS file
read_sav("survey.sav")            # ...and read it back into a tibble
#> # A tibble: 4 x 3
#>   respondent spend region
#>        <dbl> <dbl>  <dbl>
#> 1          1  12.5      1
#> 2          2   7        2
#> 3          3  22        1
#> 4          4   4.5      3
```

Stata and SAS work the same way, with their own functions:

```r
write_dta(survey, "survey.dta")   # Stata
read_dta("survey.dta")
#> # A tibble: 4 x 3
#>   respondent spend region
#>        <dbl> <dbl>  <dbl>
#> 1          1  12.5      1
#> 2          2   7        2
#> 3          3  22        1
#> 4          4   4.5      3

write_xpt(survey, "survey.xpt")   # SAS transport format
read_xpt("survey.xpt")            # returns the same four rows
```

So `read_sav()`, `read_dta()` and `read_xpt()` are to statistics files what `read_excel()` is to spreadsheets: pick the function that matches the extension, get back a tibble.

=== step === concept
::eyebrow Codes that carry meaning
## Labelled columns: codes that stand for words

Statistics files add one twist worth knowing. In SPSS, a categorical answer like **region** is usually stored as a number, `1`, `2`, `3`, with a stored dictionary saying `1 = North`, `2 = South`, `3 = East`. `haven` keeps both: it reads such a column as a special **labelled** type that shows the code and its label together. Watch.

```r
library(haven)

# labelled() pairs each code with the word it stands for, the way SPSS stores it
survey2 <- data.frame(
  respondent = c(1, 2, 3, 4),
  region = labelled(c(1, 2, 1, 3), c(North = 1, South = 2, East = 3))
)
write_sav(survey2, "survey2.sav")
s <- read_sav("survey2.sav")
s
#> # A tibble: 4 x 2
#>   respondent region
#>        <dbl> <dbl+lbl>
#> 1          1 1 [North]
#> 2          2 2 [South]
#> 3          3 1 [North]
#> 4          4 3 [East]
```

That `<dbl+lbl>` type is a number with labels attached. For plotting, grouping or a clean table you usually want the plain words, so `haven` gives you `as_factor()` to swap the codes for their labels:

```r
as_factor(s)   # codes become the readable labels
#> # A tibble: 4 x 2
#>   respondent region
#>        <dbl> <fct>
#> 1          1 North
#> 2          2 South
#> 3          3 North
#> 4          4 East
```

The widget below shows that same move on Maria's survey: the `region` code column becomes a readable label column. That is exactly what `as_factor()` does for you, reading the labels straight from the file.

::widget table-transform {"code":"df %>%\n  mutate(region_name = factor(region,\n    levels = c(1, 2, 3),\n    labels = c(\"North\", \"South\", \"East\")))","caption":"SPSS stores region as the codes 1, 2 and 3, each carrying a label. Turning the codes into readable words is what as_factor does for you.","before":{"cols":["respondent","region"],"rows":[[1,1],[2,2],[3,1],[4,3]]},"after":{"cols":["respondent","region","region_name"],"rows":[[1,1,"North"],[2,2,"South"],[3,1,"North"],[4,3,"East"]]}}

=== step === quiz
::eyebrow Check yourself
## What is a labelled column?

You read an SPSS file with `read_sav()` and one column prints as `1 [North]`, `2 [South]`, with type `<dbl+lbl>`. What is this, and how do you get the plain words?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- It is a number column carrying a stored set of labels; as_factor() turns the codes into the readable labels ::ok Right. A labelled column keeps both the code and the word SPSS stored for it. `as_factor()` converts each code to its label, giving an ordinary factor of words.
- It is broken text that read_sav failed to parse; you should read the file again ::no Nothing failed. `<dbl+lbl>` is haven working as designed, preserving both the numeric code and its meaning. `as_factor()` reveals the words.
- The labels are only for display and are thrown away as soon as you compute on the column ::no The labels are real, stored data, not just decoration. They survive until you choose to convert them, which is exactly what `as_factor()` is for.

=== step === tryit
::eyebrow Put it together
## Choose the reader

You have now met three readers for three kinds of file. The flow below is the decision in four steps: spot the format, pick the package, call the reader, check the types. Maria forwards the research firm's customer survey, a file named `survey.sav`. Fill in the one reader that opens it, then check.

::widget process-flow {"steps":[{"title":"Spot the format","sub":"look at the extension: .xlsx, .csv, .sav, .dta, .xpt"},{"title":"Pick the package","sub":"readr for text, readxl for Excel, haven for stats files"},{"title":"Call the reader","sub":"read_csv, read_excel, read_sav, read_dta, read_xpt"},{"title":"Check the types","sub":"glance at the tibble type row, fix any labelled columns"}]}

```r
library(haven)
____("survey.sav")
```
::check {"regex":"read_sav","gate":true,"difficulty":"intermediate","ok":"That is the one. A .sav file is SPSS, so read_sav() opens it into a tibble, labelled columns and all.","no":"A .sav extension means SPSS, and the haven reader for SPSS is read_sav()."}
::solution
```r
read_sav("survey.sav")
```

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [readxl package home (tidyverse)](https://readxl.tidyverse.org/) - the full reference for `read_excel`, sheets, ranges and column types.
- [haven package home (tidyverse)](https://haven.tidyverse.org/) - reading and writing SPSS, Stata and SAS, with the function for each.
- [R for Data Science (2e): Spreadsheets](https://r4ds.hadley.nz/spreadsheets) - the canonical, free walkthrough of reading Excel and Google Sheets.
- [haven vignette: conversion semantics](https://haven.tidyverse.org/articles/semantics.html) - what labelled columns are and how `as_factor()` converts them.
- [writexl on CRAN](https://cran.r-project.org/package=writexl) - the lightweight writer used here to create the example workbooks.

=== step === complete
## Lesson 2 complete

You can now open the formats that do not arrive as text: read an Excel workbook with `read_excel()`, target the exact `sheet` and `range` you need, and read SPSS, Stata and SAS files with `haven`, converting labelled columns to readable factors with `as_factor()`. The trick that ties it together is simple: match the reader to the format, and you always get back the same tidy tibble.

Next, Lesson 3: JSON and web data. You will pull data straight from a web API as JSON and turn a page's HTML table into a tibble, no file to download at all.
