---
title: "Importing and Exporting Data: Quiz"
description: "A short, graded check on getting data in and out of R: readr versus base, column types, Excel, saving with write_csv and saveRDS, databases, and encodings."
keywords: "R quiz, read_csv, readr, readxl, write_csv, saveRDS, DBI, dbplyr, encoding, import data R, R practice"
post_type: "LESSON"
curriculum_id: "1.4.6"
webr: true
lesson_access: "free"
track: "foundations"
course_id: "nr-import"
course_title: "Importing Data into R"
course_lesson: "6"
course_total: "6"
course_landing: "R-Foundations-Import-Course.html"
lesson_kind: "quiz"
course_prev: "Saving-and-Exporting-Data.html"
course_next: ""
catalog_blurb: "Check what stuck before you move on."
---

=== step === cover
::eyebrow Check your understanding
## Quiz
You have finished the import section: reading CSV and delimited files, Excel and other formats, JSON and web data, databases and big files, and saving your results back out. This short quiz checks what stuck. Pick an answer to continue; you can retry until it clicks. The last two steps are live R, run them and tinker.

=== step === quiz
::eyebrow Question 1 of 8
## What read_csv gives you
You read a file with `readr::read_csv()`. What kind of object comes back?
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- A plain character vector of lines. ::no `read_csv()` parses the file into columns, not raw lines.
- A tibble, with column types reported as it reads. ::ok Right. `read_csv()` returns a tibble and tells you the type it guessed for each column.
- A matrix, because the data is rectangular. ::no Columns can differ in type, so it is a tibble, not a single-type matrix.
- Nothing; it only prints to the console. ::no It returns the data so you can assign and use it.

=== step === quiz
::eyebrow Question 2 of 8
## A number that arrived as text
A `price` column you expected to be numeric imports as text. What is the most likely cause?
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- The column contains a non-numeric character, such as a currency sign or a thousands separator. ::ok Yes. One stray `$` or `,` is enough for the reader to treat the whole column as text.
- CSV files can only store text, so numbers are impossible. ::no The reader infers numeric and date types as it loads; clean numbers arrive as numbers.
- The file has too many rows. ::no The row count has no effect on the detected type.
- Numeric columns always import as text by default. ::no A clean numeric column imports as a number.

=== step === quiz
::eyebrow Question 3 of 8
## Reading an Excel workbook
You need to read a `.xlsx` workbook into R. Which package is the standard choice?
::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- `readr`, the same one used for CSV. ::no `readr` handles delimited text, not the Excel format.
- `jsonlite`, since spreadsheets are structured. ::no `jsonlite` is for JSON, not Excel files.
- `readxl`, with `read_excel()`. ::ok Correct. `readxl::read_excel()` reads both `.xls` and `.xlsx` workbooks.
- No package; base R reads Excel directly. ::no Base R has no Excel reader; you need a package.

=== step === quiz
::eyebrow Question 4 of 8
## Two ways to save
You want to save a data frame and read it back later with its exact column types intact, including factors and dates. Which fits best?
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- `write_csv()`, because CSV is universal. ::no CSV is portable but stores plain text, so types are re-guessed on the way back in.
- `saveRDS()`, which stores the R object exactly as it is. ::ok Right. `saveRDS()` round-trips the object faithfully; reach for CSV when you need a file other tools can read.
- `print()`, copied from the console. ::no Printing does not save anything to disk.
- Neither; data frames cannot be saved. ::no They can, in several formats.

=== step === quiz
::eyebrow Question 5 of 8
## Who does the work in a database query
You query a large database table with `dbplyr`. Where does the filtering and summarising actually happen?
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- In the database; `dbplyr` translates your dplyr code to SQL, and only `collect()` pulls the result into R. ::ok Correct. That is the whole point: the database does the heavy lifting and R receives only the small answer.
- In R, after loading the entire table into memory first. ::no That would defeat the purpose; the work is pushed to the database.
- Nowhere until you print it. ::no Printing shows a preview, but the computation is defined and run on the database side.
- Half in R and half in Excel. ::no Excel is not involved; the query runs in the database.

=== step === quiz
::eyebrow Question 6 of 8
## Garbled accented characters
A column of names with accents imports as garbled symbols. What is the usual culprit?
::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- The names are simply too long. ::no Length does not garble characters.
- A missing package. ::no No extra package fixes mojibake; the bytes were read with the wrong key.
- An encoding mismatch: the file was read with the wrong character encoding. ::ok Right. Tell the reader the file's encoding, often UTF-8, so the accented bytes are decoded correctly.
- The numbers in another column. ::no Other columns do not affect how text is decoded.

=== step === concept
::eyebrow Run it: write then read a CSV
## A CSV round-trip in live R
Save a small data frame to a temporary CSV, then read it straight back. Run it, then add a column to `shop` and run again.

```r
shop <- data.frame(item = c("pen", "mug", "book"), price = c(2.5, 8.0, 14.0))
path <- tempfile(fileext = ".csv")
write.csv(shop, path, row.names = FALSE)
read.csv(path)
```

You wrote the frame out as text and read it back as a data frame, the core of every import: out to a file, then back into R.

=== step === concept
::eyebrow Run it: save with types intact
## saveRDS preserves the object
Save a data frame with a factor column, read it back, and confirm the types survived. Run it and read the `str()` output.

```r
orig <- data.frame(grade = factor(c("A", "B", "A")), n = c(3L, 5L, 2L))
path <- tempfile(fileext = ".rds")
saveRDS(orig, path)
back <- readRDS(path)
str(back)
```

`str(back)` shows the `Factor` and integer types came back exactly as they went out, which CSV could not have guaranteed.

=== step === complete
## Section complete
Well done. You can read CSV with `read_csv` and know why a column might arrive as text, pick `readxl` for Excel, choose between `write_csv` and `saveRDS` for saving, reason about where a database query runs, and spot an encoding problem. Next section: strings, dates and regular expressions.
