---
title: "Importing Data Lesson 1: Reading CSV and Delimited Files"
catalog_blurb: "Get real data files into R with every column the right type."
description: "Read CSV and delimited files in R with readr: load a file, set and fix column types, handle parsing problems and missing values, and read other delimiters."
keywords: "read csv in R, readr, read_csv, col_types, delimited files, read_delim, read_csv2, parsing problems, column types, missing values, import data in R, tibble"
post_type: "LESSON"
curriculum_id: "1.4.1"
webr: true
lesson_access: "free"
course_id: "nr-import"
course_title: "Importing Data into R"
course_lesson: "1"
course_total: "5"
course_landing: "R-Foundations-Import-Course.html"
course_next: "Reading-Excel-and-Other-Formats.html"
course_prev: ""
---

=== step === cover
::eyebrow Lesson 1 of 5
## Reading CSV and Delimited Files

Maria runs a small corner bakery. Every Sunday her till exports the week's sales as a file called `sales.csv`, and she emails it to herself to add up the totals. Before R can total anything, it has to read that file, and reading it well is the whole skill.

Here is the catch that makes it a skill: a CSV stores **everything as plain text**, even the numbers and the dates. Maria's revenue column arrives as text like `$1,250`. Reading the file well means turning that text into the real numbers and dates you can actually compute with. The panel below shows one piece of that. Press the buttons.

By the end of this lesson you will be able to:

- Say what a CSV / delimited file is, and read one into R in a single line
- Read and control the column **types** R assigns, and override a wrong guess
- Diagnose and fix **parsing problems** and missing-value codes
- Read files that use **other delimiters**: semicolons, tabs, or any character at all

**Prerequisites:** you can run R and load a package with `library()`, and you have seen a table of rows and columns before. Every new term is defined as it appears.

::widget table-transform {"code":"df %>%\n  mutate(revenue = as.numeric(gsub(\"[$,]\", \"\", revenue_text)))","caption":"A CSV stores money as text like $1,250. Strip the symbols and make it a number, and you can finally add the column up.","before":{"cols":["item","units","revenue_text"],"rows":[["croissant",14,"$1,250"],["sourdough",8,"$960"],["muffin",11,"$845"]]},"after":{"cols":["item","units","revenue_text","revenue"],"rows":[["croissant",14,"$1,250",1250],["sourdough",8,"$960",960],["muffin",11,"$845",845]]}}

=== step === concept
::eyebrow What you are reading
## A CSV is just text

Open `sales.csv` in a plain text editor and there is no grid, no spreadsheet, just lines of text. CSV stands for **comma-separated values**, and the format is exactly that literal:

- Each **line** is one **row** of data.
- Within a line, the values are split by a **delimiter**, a single character that marks where one field ends and the next begins. For a CSV that character is the comma.
- The very first line is usually a **header**: it names the columns rather than holding data.

Let us create Maria's file right here so we have something real to read, then print it back exactly as it sits on disk. Run this once.

```r
lines <- c(
  "date,item,qty,price",
  "2026-03-09,croissant,14,2.50",
  "2026-03-09,sourdough,8,5.00",
  "2026-03-10,muffin,11,3.25",
  "2026-03-10,baguette,6,4.00",
  "2026-03-11,croissant,9,2.50",
  "2026-03-11,sourdough,7,5.00"
)
writeLines(lines, "sales.csv")
cat(readLines("sales.csv"), sep = "\n")
#> date,item,qty,price
#> 2026-03-09,croissant,14,2.50
#> 2026-03-09,sourdough,8,5.00
#> 2026-03-10,muffin,11,3.25
#> 2026-03-10,baguette,6,4.00
#> 2026-03-11,croissant,9,2.50
#> 2026-03-11,sourdough,7,5.00
```

That header line, `date,item,qty,price`, is the promise the file makes: four columns, in that order. Your job is to turn those seven lines of text into a proper table.

=== step === concept
::eyebrow The one-liner
## Read it in one line

The **readr** package (part of the tidyverse) reads a CSV with a single function, `read_csv()`. Give it the file name and it hands back a **tibble**, which is just a tidy data frame: a table of equal-length columns.

```r
library(readr)
sales <- read_csv("sales.csv")
sales
#> # A tibble: 6 x 4
#>   date       item        qty price
#>   <date>     <chr>     <dbl> <dbl>
#> 1 2026-03-09 croissant    14  2.5
#> 2 2026-03-09 sourdough     8  5
#> 3 2026-03-10 muffin       11  3.25
#> 4 2026-03-10 baguette      6  4
#> 5 2026-03-11 croissant     9  2.5
#> 6 2026-03-11 sourdough     7  5
```

Look at the small grey line under the column names: `<date>`, `<chr>`, `<dbl>`, `<dbl>`. That is the **type** readr assigned to each column, and it is the single most important thing on the screen.

- `<chr>` is text (a character column), here the item names.
- `<dbl>` is a number that can carry decimals (a "double"), here both `qty` and `price`. readr reads every plain number as a double, even a whole count like `14`.
- `<date>` is a real calendar date, not text, so R can sort it and do date arithmetic.

readr never guesses the whole-number type (`<int>`) on its own; it always reads a bare number as a double. If you want a column kept as true integers you ask for it by hand, which is the next step.

[KEY INSIGHT]
You never typed those types. `read_csv()` **inspected the values** and guessed a type for every column. Because `price` is now a number and not the text `"2.50"`, `sum(sales$price)` works. That guess is what reading well is really about.

=== step === quiz
::eyebrow Check yourself
## Where did the types come from?

You ran `sales <- read_csv("sales.csv")` and the printout shows `qty <dbl>` and `date <date>` under the column names. Where did those types come from?

::quiz {"correct":1,"gate":true,"difficulty":"beginner"}
- read_csv inspected the actual values in each column and guessed a type for you ::ok Right. readr samples the values, sees that qty is whole numbers and date looks like a calendar date, and assigns each column a type automatically. You only step in when the guess is wrong.
- you must declare every column's type or read_csv refuses to read the file ::no The opposite: readr guesses all of them so the common case is zero work. You declare types only to override a wrong guess, which is the next step.
- the second line of the file (the first data row) defines the column types ::no The first line is the header (column names); the data rows hold values, not type declarations. Types are inferred from the values across the column, not set by any single row.

=== step === concept
::eyebrow When the guess is wrong
## Take control with col_types

readr's guess is right most of the time, but not always, and a wrong type can quietly corrupt your data. Two classics:

1. A **date in a non-standard format**, like `03/09/2026`, is not the year-month-day shape readr expects, so it gives up and leaves the column as plain text. The widget below shows that exact column rescued.
2. A **code with leading zeros**, like the product code `00123`, looks numeric, so readr reads it as the number `123` and silently throws the zeros away.

::widget table-transform {"code":"df %>%\n  mutate(delivered = as.Date(delivered_text, format = \"%m/%d/%Y\"))","caption":"03/09/2026 is not the format readr expects, so the column stays as text. Hand readr the format and it becomes a real date you can sort and subtract.","before":{"cols":["delivered_text","supplier"],"rows":[["03/09/2026","Mill Co"],["03/10/2026","Mill Co"],["03/12/2026","Bakers Depot"]]},"after":{"cols":["delivered_text","supplier","delivered"],"rows":[["03/09/2026","Mill Co","2026-03-09"],["03/10/2026","Mill Co","2026-03-10"],["03/12/2026","Bakers Depot","2026-03-12"]]}}

The fix for both is the `col_types` argument: you name the type you want and readr obeys instead of guessing. There are two ways to write it. The long, readable form uses `cols()` with one `col_*()` per column; the short form is a string with a single letter per column (`D` date, `c` character, `i` integer, `d` double).

```r
library(readr)
# Spell each column's type out in full
sales <- read_csv("sales.csv", col_types = cols(
  date  = col_date(),
  item  = col_character(),
  qty   = col_integer(),
  price = col_double()
))

# The exact same spec, written as one compact string (date, chr, int, dbl)
read_csv("sales.csv", col_types = "Dcid")
```

For the non-standard date, you tell readr the layout with `col_date(format = ...)`, using `%m` for month, `%d` for day and `%Y` for a four-digit year:

```r
read_csv(
  I("delivered,supplier\n03/09/2026,Mill Co\n03/10/2026,Mill Co"),
  col_types = cols(delivered = col_date(format = "%m/%d/%Y"))
)
#> # A tibble: 2 x 2
#>   delivered  supplier
#>   <date>     <chr>
#> 1 2026-03-09 Mill Co
#> 2 2026-03-10 Mill Co
```

[NOTE]
A column of ID codes like `00123` is the same trap in reverse: readr reads it as the number `123` and drops the leading zeros for good. Force it to stay text with `col_character()` (or `c` in the compact string) so every digit survives.

=== step === tryit
::eyebrow Your turn
## Lock in the column types

Maria's `sales.csv` is already on disk from earlier. Pin down all four column types by hand so nothing is left to a guess. The date, item and quantity are filled in. Complete the spec so `price` is read as a decimal number, then check it.

```r
library(readr)
sales <- read_csv("sales.csv", col_types = cols(
  date  = col_date(),
  item  = col_character(),
  qty   = col_integer(),
  price = ____
))
sales
```
::check {"regex":"price\\s*=\\s*col_double","gate":true,"difficulty":"beginner","ok":"Exactly. col_double() reads price as a number with decimals, so 2.50 is the value 2.5 and not the text \"2.50\".","no":"price has decimals, so it is a double. Set price = col_double()."}
::solution
```r
sales <- read_csv("sales.csv", col_types = cols(
  date  = col_date(),
  item  = col_character(),
  qty   = col_integer(),
  price = col_double()
))
```

=== step === concept
::eyebrow When a value will not fit
## Parsing problems and missing values

Real exports are messy. Suppose one quantity was never recorded and the till wrote `n/a` instead. Watch what readr does with the `qty` column.

```r
library(readr)
rows <- c(
  "date,item,qty",
  "2026-03-09,croissant,14",
  "2026-03-10,muffin,n/a",
  "2026-03-11,baguette,6"
)
writeLines(rows, "messy.csv")
read_csv("messy.csv")
#> # A tibble: 3 x 3
#>   date       item       qty
#>   <date>     <chr>      <chr>
#> 1 2026-03-09 croissant  14
#> 2 2026-03-10 muffin     n/a
#> 3 2026-03-11 baguette   6
```

`qty` came back as `<chr>`, text, not a number. readr only treats a few strings as missing by default (an empty cell and `NA`). It has never heard of `n/a`, so to readr the column contains the words `14`, `n/a` and `6`, and a column with a word in it cannot be numeric. The cure is to tell readr which strings mean "missing" with the `na` argument:

```r
read_csv("messy.csv", na = c("", "NA", "n/a"))
#> # A tibble: 3 x 3
#>   date       item        qty
#>   <date>     <chr>     <dbl>
#> 1 2026-03-09 croissant    14
#> 2 2026-03-10 muffin       NA
#> 3 2026-03-11 baguette      6
```

Now `n/a` becomes a true `NA` (R's marker for a missing value), the rest of the column is all numbers, and `qty` reads as `<dbl>`. When you instead force a type that a value cannot fit, readr does not crash: it inserts `NA` and records the trouble in a report you can read with `problems()`.

```r
bad <- read_csv("messy.csv", col_types = cols(qty = col_integer()))
problems(bad)
#> # A tibble: 1 x 5
#>     row   col expected               actual file
#>   <int> <int> <chr>                  <chr>  <chr>
#> 1     3     3 an integer             n/a    messy.csv
```

[WARNING]
A wrong type rarely announces itself, you only notice when a later `sum()` or sort gives nonsense. Glance at the type row after every read, and run `problems()` whenever a numeric column comes back as text.

=== step === quiz
::eyebrow Check yourself
## The n/a column

A file has `n/a` in its `qty` column. You run `read_csv("file.csv")` and `qty` comes back as text (`<chr>`) instead of a number. Why, and what is the cleanest fix?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- readr does not recognize n/a as missing, so the column is not all-numeric; tell it with na = c("", "NA", "n/a") ::ok Right. Once readr knows n/a means missing, that cell becomes NA, the rest is numbers, and the column reads as a number.
- read_csv is broken for missing data, so you should switch to base read.csv instead ::no read_csv is working as designed, and base read.csv has the very same behavior. The fix is telling readr which strings mean missing, not changing the reader.
- force qty with col_integer(), which converts every n/a into 0 ::no Forcing the type turns n/a into NA (a missing value), not 0, and logs a parsing problem. It does not magically make the word n/a into a number, and treating it as 0 would corrupt every total.

=== step === concept
::eyebrow Beyond commas
## Other delimiters

The "C" in CSV is only a convention. The delimiter can be any character, and two come up constantly. In much of Europe the comma is the decimal point (one euro twenty is written `1,20`), so spreadsheets there separate fields with a **semicolon** instead. `read_csv2()` is the same reader tuned for that: semicolons split the fields and a comma is read as a decimal point.

```r
library(readr)
euro <- c("item;price", "croissant;2,50", "sourdough;5,00")
writeLines(euro, "euro.csv")
read_csv2("euro.csv")
#> # A tibble: 2 x 2
#>   item      price
#>   <chr>     <dbl>
#> 1 croissant   2.5
#> 2 sourdough   5
```

For any other delimiter, name it yourself with `read_delim()` and its `delim` argument. A tab-separated file is so common it has its own shortcut, `read_tsv()`, which is just `read_delim(delim = "\t")`.

```r
# A pipe-delimited export: state the delimiter explicitly
piped <- c("item|price", "croissant|2.50", "sourdough|5.00")
writeLines(piped, "piped.txt")
read_delim("piped.txt", delim = "|")
#> # A tibble: 2 x 2
#>   item      price
#>   <chr>     <dbl>
#> 1 croissant   2.5
#> 2 sourdough   5
```

Everything you learned about types, `col_types` and missing values works identically with all of these readers, only the delimiter changes.

=== step === tryit
::eyebrow Put it together
## Pick the right reader

Maria's flour supplier in Munich sends `supplier.csv` with **semicolons** between the fields and a **comma for the decimal point** (`1,20` means one euro twenty). Fill in the one reader that handles both at once, then check it.

```r
library(readr)
supplier <- c("item;price", "flour;1,20", "butter;3,50")
writeLines(supplier, "supplier.csv")
____("supplier.csv")
```
::check {"regex":"read_csv2","gate":true,"difficulty":"intermediate","ok":"That is the one. read_csv2() splits on semicolons and reads the comma as a decimal point, so flour comes back as the number 1.2.","no":"You need the European reader: read_csv2(), which uses ; as the delimiter and , as the decimal point."}
::solution
```r
supplier <- c("item;price", "flour;1,20", "butter;3,50")
writeLines(supplier, "supplier.csv")
read_csv2("supplier.csv")
```

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [R for Data Science (2e), Data import](https://r4ds.hadley.nz/data-import) - the canonical, free walkthrough of reading data with readr, by the people who wrote it.
- [readr package home (tidyverse)](https://readr.tidyverse.org/) - the function reference and the one-page data-import cheatsheet.
- [readr column-type reference: cols() and col_*()](https://readr.tidyverse.org/reference/cols.html) - every type specifier, including dates, factors and skipping columns.
- [RFC 4180: the CSV format](https://www.rfc-editor.org/rfc/rfc4180) - the short formal definition of what a comma-separated file actually is, quoting and edge cases included.

=== step === complete
## Lesson 1 complete

You can now turn a file of plain text into a proper R table: read it with `read_csv()`, read and control the column types with `col_types`, rescue messy values with `na` and `problems()`, and switch readers when the delimiter changes.

That covers the format most data arrives in. But plenty of it does not: spreadsheets, statistical software files, and more.

Next, Lesson 2: Reading Excel and other formats. You will open real `.xlsx` workbooks (picking the sheet and range you want) and read SPSS, Stata and SAS files, reusing every idea about column types you just learned.
