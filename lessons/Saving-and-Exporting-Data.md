---
title: "Importing Data Lesson 5: Saving and Exporting Data"
catalog_blurb: "Write your results back out, and choose the right format for each reader."
description: "Close the loop on data in R: write results to CSV with readr, keep the exact object with saveRDS, build an Excel workbook with writexl, and pick the right format for who reads it next."
keywords: "save data in R, export data R, write_csv, saveRDS, readRDS, writexl, write Excel from R, RDS file, CSV export, R data format, write_xlsx, save tibble"
post_type: "LESSON"
curriculum_id: "1.4.5"
webr: true
lesson_access: "free"
course_id: "nr-import"
course_title: "Importing Data into R"
course_lesson: "5"
course_total: "5"
course_landing: "R-Foundations-Import-Course.html"
course_next: ""
course_prev: "Databases-and-Big-Files.html"
---

=== step === cover
::eyebrow Lesson 5 of 5
## Saving and Exporting Data

Lessons 1 to 4 were all about getting data *in*: a CSV, an Excel workbook, JSON off a web API, a query against a database. Maria, who runs a small bakery chain, has done exactly that. She queried last quarter's till receipts and now holds a tidy little result in R: revenue per item, three rows, sitting in a tibble.

A result that lives only inside one R session helps nobody else. Her accountant wants it in Excel. A future Maria wants to reload it next month without rerunning the query. A colleague on a different team wants a plain file they can open anywhere. Each of those readers needs a different file, and **the reader is what decides the format.** This lesson teaches the three you will reach for, and exactly when to pick each.

By the end you will be able to:

- Write a tibble to a **CSV** with `write_csv`, and know what a CSV quietly throws away
- Save and reload the **exact** R object with `saveRDS` and `readRDS`
- Build a multi-sheet **Excel** workbook for someone who does not use R, with `write_xlsx`
- Choose the right format for whoever opens the file next

**Prerequisites:** lessons 1 to 4 (you can `read_csv()`, you know a **tibble**, that a column has a **type**, what a **factor** is, and `library()`). Nothing new is assumed. The map below is the whole decision in one picture.

::widget process-flow {"steps":[{"title":"You have a result in R","sub":"a tibble you computed, living in this session only"},{"title":"Ask who reads it next","sub":"future-you in R, a person, or another tool"},{"title":"Pick the matching format","sub":"an RDS file, a CSV, or an Excel workbook"},{"title":"Write it out","sub":"one line of code and it is a file on disk"}]}

=== step === concept
::eyebrow The everyday format
## A CSV is the file everyone can open

Start with the format that travels furthest. A **CSV** (comma-separated values) is a plain-text file: one row of data per line, columns separated by commas. Excel opens it, Google Sheets opens it, Python opens it, a person can read it in a text editor. When you do not know what the other side runs, a CSV is the safe answer.

The **readr** package writes one with `write_csv(data, "file.csv")`: the first argument is the table, the second is the filename. Here is Maria's result going to disk. We then read the raw file straight back with `readLines()` to see that a CSV really is just text, nothing more:

```r
library(readr)
library(tibble)

# The result Maria produced last lesson: revenue per item, now back in R.
summary <- tibble(
  item    = factor(c("muffin", "croissant", "baguette")),  # a fixed set of categories
  units   = c(24L, 23L, 14L),
  revenue = c(78.0, 57.5, 56.0)
)

write_csv(summary, "summary.csv")   # one line: the tibble is now a file on disk
readLines("summary.csv")            # look at the bytes that were actually written
#> [1] "item,units,revenue" "muffin,24,78"       "croissant,23,57.5"  "baguette,14,56"
```

[NOTE]
Use `write_csv()` from readr, not base R's `write.csv()`. The readr version does not add a column of row numbers, does not wrap text in quotes it does not need, and writes dates and numbers in a clean, predictable way. Less to clean up on the other end.

=== step === concept
::eyebrow The catch
## A CSV cannot remember what your columns were

That plain-text simplicity has a price. A CSV stores only characters, so it cannot record that `item` was a **factor** or that `units` was a whole-number **integer**. When you read the file back, R does not know those facts either, so it **guesses** a type for every column from scratch. The values survive; the type labels do not.

Watch the round-trip. The widget shows what went out versus what comes back, and the code proves it: the `item` column left as a factor and returns as plain character text.

::widget table-transform {"code":"back <- read_csv(\"summary.csv\")","caption":"Saved to a CSV and read back: every value survives, but the column TYPES do not. item left as a factor and returns as text; units left as an integer and returns as a plain number. A CSV stores characters, so read_csv re-guesses each column on the way in.","before":{"cols":["item (factor)","units (integer)","revenue (double)"],"rows":[["muffin",24,78],["croissant",23,57.5],["baguette",14,56]]},"after":{"cols":["item (text)","units (double)","revenue (double)"],"rows":[["muffin",24,78],["croissant",23,57.5],["baguette",14,56]]}}

```r
back <- read_csv("summary.csv")   # read the CSV we just wrote, back into R

class(summary$item)   # how it lived in R before saving
#> [1] "factor"
class(back$item)      # how it came back from the CSV
#> [1] "character"
```

[KEY INSIGHT]
A CSV is for sharing values, not for preserving an R object. If the next reader is a person or another program, that loss is fine, they never cared that `item` was a factor. But if the next reader is *R itself*, and you need the object back exactly as it was, a CSV is the wrong tool. That is the case the next format solves.

=== step === quiz
::eyebrow Check yourself
## Pick the format for a colleague

Maria needs to send the per-item revenue table to a colleague on the finance team. That colleague does not use R; she will open the file in Google Sheets and add a column of notes. Which format should Maria send?

::quiz {"correct":1,"gate":true,"difficulty":"beginner"}
- A CSV with `write_csv()` ::ok Right. A CSV opens in Google Sheets, Excel, or any tool, and the finance colleague never needed R's type information. When the reader is a person or another program, CSV is the safe, universal choice.
- An RDS file with `saveRDS()` ::no An RDS file can only be opened by R, so a colleague working in Google Sheets could not read it at all. RDS is for when R itself is the next reader.
- It does not matter, every format opens everywhere ::no Formats are not interchangeable. An RDS file is R-only; an Excel workbook needs a spreadsheet app. A CSV is the one that genuinely opens anywhere, which is exactly why it fits here.

=== step === concept
::eyebrow The R-to-R format
## saveRDS keeps the object exactly

When the next reader is a future R session, you do not want a re-guessed approximation, you want the *same object back*. R has a native format for this: an **RDS** file, written with `saveRDS(object, "file.rds")` and read with `readRDS("file.rds")`. It stores the object in R's own binary form, so types, factor levels, and every attribute come back untouched.

Same `summary` table, saved and reloaded as RDS this time:

```r
saveRDS(summary, "summary.rds")   # R's own binary format: the whole object, exactly
back2 <- readRDS("summary.rds")   # read it back into a new name

class(back2$item)          # the factor is still a factor, not text
#> [1] "factor"
identical(summary, back2)  # is it the very same object we saved?
#> [1] TRUE
```

`identical()` returning `TRUE` is the whole point: byte for byte, `back2` is the object you saved. The CSV round-trip could never say that. Notice too that `readRDS()` takes no column-type arguments, there is nothing to specify, because nothing was lost.

[KEY INSIGHT]
RDS preserves everything; a CSV preserves only values. The trade is reach: an RDS file is **R-only** and holds **one object** per file. Save your cleaned data or a fitted model as RDS to reload instantly later; hand a CSV to anyone outside R.

=== step === tryit
::eyebrow Your turn
## Save the exact result for next month

`summary` is still Maria's revenue-per-item result from the steps above. She wants to reload it next month, unchanged, without rerunning the database query, so she needs the format that preserves the object exactly. Fill in the one function that does it, then check.

```r
# summary is the revenue-per-item tibble from earlier in this lesson.
# Save the exact object so next month's R session reloads it unchanged:
____(summary, "month_end.rds")
file.exists("month_end.rds")
```
::check {"regex":"saveRDS\\s*[(]","gate":true,"difficulty":"intermediate","ok":"Exactly. saveRDS() writes the object in R's binary format, so readRDS(\"month_end.rds\") next month returns it with the factor and every type intact, no query rerun needed.","no":"You want the R-native format that preserves the exact object: saveRDS(summary, \"month_end.rds\")."}
::solution
```r
saveRDS(summary, "month_end.rds")   # preserves summary exactly for a future session
file.exists("month_end.rds")        # confirm the file is now on disk
#> [1] TRUE
```

=== step === concept
::eyebrow The format for people
## write_xlsx builds a workbook for non-R readers

Sometimes the reader is a person who lives in Excel: an accountant, a manager, a board. They want a real `.xlsx` workbook, ideally with related tables on separate, labelled sheets. The **writexl** package does this with `write_xlsx()`, and it has one neat trick: pass a **named list** of tables and each one becomes its own sheet, named by the list element.

Maria hands over two tables in a single workbook, one sheet per view:

```r
library(writexl)

by_shop <- tibble(
  shop    = c("Old Town", "Riverside"),
  revenue = c(95.5, 96.0)
)

# A named list -> one workbook, one sheet per name:
write_xlsx(list("By item" = summary, "By shop" = by_shop), "report.xlsx")
file.exists("report.xlsx")   # the workbook is written to disk
#> [1] TRUE
```

The workbook now has a "By item" sheet and a "By shop" sheet, ready to email. (We confirm it was written rather than read it back with `read_excel()` from lesson 2, since here the writing is the part that matters.)

[NOTE]
An Excel workbook is for delivery to people, not for your own pipeline. For passing data between your own R scripts, prefer RDS (exact and fast) or CSV (simple and portable); reach for `write_xlsx()` when a human on the other end expects a spreadsheet.

=== step === quiz
::eyebrow Check yourself
## One file, two tables, a stakeholder

Maria's regional manager wants both the per-item revenue table and the per-shop revenue table, in a **single file** he can open in Excel and skim on his phone. He does not use R. What should Maria produce?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- One `saveRDS()` file containing both tables in a list ::no An RDS file opens only in R, and the manager does not use R. RDS is perfect for a future R session, not for a stakeholder with a spreadsheet.
- One `write_xlsx()` workbook with the two tables as two named sheets ::ok Right. A named list passed to write_xlsx() becomes one .xlsx with one sheet per table, a single file the manager opens in Excel, exactly what he asked for.
- Two separate CSV files, one per table ::no Two CSVs are two files, not the single file he asked for, and they carry no sheet structure. One Excel workbook with two sheets is the clean fit.

=== step === concept
::eyebrow Putting it together
## Choose the format by who reads it next

Every choice in this lesson comes down to one question: **who, or what, opens this file next?** Answer that and the format is decided.

| Who reads it next | Format | Write it with | Why |
|---|---|---|---|
| A person, or another tool/language | CSV | `write_csv()` | Opens anywhere; plain text. Loses R types, which those readers never needed. |
| A future R session (you) | RDS | `saveRDS()` | Restores the exact object: types, factors, attributes. R-only, one object per file. |
| A person who expects a spreadsheet | Excel (.xlsx) | `write_xlsx()` | A real workbook; a named list gives one sheet per table. |

Two more you will meet as your data grows, same logic: a **web API or app** that wants structured text takes **JSON** (`jsonlite::write_json()`), and **very large** results that another analyst will query are best written as columnar **Parquet** with the **arrow** package (run on your own machine), the write-side partner to the Parquet reading you saw in lesson 4.

The dataset stayed the same three rows throughout; what changed was the reader, and with it the file you write. Match the format to the reader and your results land cleanly wherever they need to go.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [readr: writing files (`write_csv` and friends)](https://readr.tidyverse.org/reference/write_delim.html) - the reference page for the CSV writer you used, including delimiter and quoting options.
- [R for Data Science (2e), Data import](https://r4ds.hadley.nz/data-import) - the canonical free chapter on reading and writing rectangular data in the tidyverse.
- [`readRDS` / `saveRDS` (R manual)](https://stat.ethz.ch/R-manual/R-devel/library/base/html/readRDS.html) - the official docs for R's native single-object serialization format.
- [writexl package documentation](https://docs.ropensci.org/writexl/) - how `write_xlsx()` writes real `.xlsx` workbooks, including the named-list-to-sheets behavior.

=== step === complete
## Lesson 5 complete

You can now write a result back out in the right shape for whoever reads it next. You wrote a tibble to a portable **CSV** with `write_csv()` and saw what a CSV cannot keep; you saved and reloaded the **exact** object with `saveRDS()` and `readRDS()`, confirmed by `identical()`; and you built a multi-sheet **Excel** workbook for a non-R reader with `write_xlsx()`. The deciding question was always the same: who opens this file next?

That also closes the **Importing Data into R** course. You started by reading a single CSV, moved through Excel, JSON and the web, queried databases and files too big to load, and now you can get clean results back out again, the full round trip of data into and out of R. Next up, the course track moves on to reshaping and transforming the data you can now confidently import and export.
