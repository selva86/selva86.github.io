---
title: "readr write_csv() in R: Export Data Frames to CSV"
slug: readr-write_csv-in-R
description: "Learn readr write_csv() in R to export data frames to CSV files. Covers syntax, appending rows, NA handling, write_excel_csv, and write.csv differences."
keywords: "readr write_csv, write_csv function R, readr write_csv examples, R write_csv data frame, export data frame to csv R, write_csv vs write.csv, save dataframe csv R"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: readr--readxl--haven
fr_parent: Importing-Data-in-R.html
auto_link_terms: "write_csv()|readr write_csv|readr::write_csv()|export to CSV in R|save data frame as CSV"
auto_link_case_sensitive: true
target_keyword: "readr write_csv"
sibling_block_enabled: true
difficulty: Beginner
---

# readr write_csv() in R: Export Data Frames to CSV

<p class="lead">The readr write_csv() function writes a data frame to a comma-separated file. It is faster than base R's write.csv(), never adds a row-names column, and always writes clean UTF-8 text.</p>

[QUICK ANSWER]
write_csv(df, "out.csv")                    # write a data frame to disk
write_csv(df, "out.csv", na = "")           # blanks instead of NA
write_csv(df, "out.csv", append = TRUE)     # add rows to an existing file
write_csv2(df, "out.csv")                   # EU format: ; and decimal comma
write_excel_csv(df, "out.csv")              # add a BOM so Excel reads UTF-8
write_csv(df, "out.csv", quote = "all")     # quote every value
write_csv(df, stdout())                     # print the CSV to the console

[DECISION TREE: Is write_csv() the right tool?]
- write a comma-separated file: write_csv(df, "out.csv")
- file should use semicolons (EU): write_csv2(df, "out.csv")
- file should be tab-separated: write_tsv(df, "out.txt")
- any other single delimiter: write_delim(df, "out.txt", delim = "|")
- preserve column types exactly: write_rds(df, "out.rds")
- send to a real Excel workbook: writexl::write_xlsx(df, "out.xlsx")

## What write_csv() does

**write_csv() turns a data frame into a CSV file.** You give it a data frame and a path, and it writes one comma-separated line per row plus a header row of column names. It uses fast C++ code, encodes everything as UTF-8, and returns the input data frame invisibly so it slots into a pipe without breaking the chain.

## Syntax and key arguments

**The signature is short, and most calls only need the first two arguments.** The rest control missing values, quoting, and whether you overwrite or extend an existing file.

```r title="The write_csv signature"
write_csv(
  x,                   # the data frame or tibble to write
  file,                # output path, or a connection like stdout()
  na = "NA",           # string used for missing values
  append = FALSE,      # TRUE adds rows to an existing file
  col_names = !append, # write the header row
  quote = "needed",    # "needed", "all", or "none"
  eol = "\n"           # line ending
)
```

The arguments you reach for most are `na` (declare how missing values look on disk), `append` (extend a file instead of replacing it), and `quote` (force or suppress quoting around values).

[NOTE]
**Coming from Python pandas?** The equivalent of `write_csv(df, "out.csv")` is `df.to_csv("out.csv", index=False)`. pandas writes the row index by default, so you must pass `index=False`; readr never writes row names, so there is nothing to switch off.

## write_csv() examples

**Start with the simplest call.** Build a small data frame, write it, and read it back to confirm the round trip works.

```r title="Write a data frame to CSV"
library(readr)

df <- data.frame(name = c("Alice", "Bob"), age = c(30, 25))
write_csv(df, "people.csv")
read_csv("people.csv", show_col_types = FALSE)
#> # A tibble: 2 x 2
#>   name    age
#>   <chr> <dbl>
#> 1 Alice    30
#> 2 Bob      25
```

**Write to `stdout()` to see the exact file contents.** Passing a connection instead of a path prints the CSV to the console, which is the quickest way to inspect quoting and separators.

```r title="See the exact CSV output"
write_csv(df, stdout())
#> name,age
#> Alice,30
#> Bob,25
```

**Use `append = TRUE` to add rows without rewriting the file.** readr skips the header row when appending, so you do not get a duplicate header in the middle of the data.

```r title="Append rows to an existing file"
new_rows <- data.frame(name = "Carol", age = 41)
write_csv(new_rows, "people.csv", append = TRUE)
read_csv("people.csv", show_col_types = FALSE)
#> # A tibble: 3 x 2
#>   name    age
#>   <chr> <dbl>
#> 1 Alice    30
#> 2 Bob      25
#> 3 Carol    41
```

**Control how missing values are written with `na`.** By default `NA` is written as the literal text `NA`. Set `na = ""` to leave empty cells, which many other tools expect.

```r title="Control how missing values are written"
df_na <- data.frame(name = c("Alice", NA), age = c(30, NA))
write_csv(df_na, stdout(), na = "")
#> name,age
#> Alice,30
#> ,
```

## write_csv() vs write.csv() and alternatives

**write_csv() and base R's write.csv() produce different files from the same data.** The biggest difference is row names: `write.csv()` adds an unnamed first column of row labels, while `write_csv()` never does. That single behavior causes most migration surprises.

| Feature | write_csv() (readr) | write.csv() (base R) | fwrite() (data.table) |
|---|---|---|---|
| Row names | Never written | Written by default | Never written |
| Speed | Fast (C++) | Slow | Fastest |
| Quoting | Only when needed | Quotes every text value | Only when needed |
| Encoding | Always UTF-8 | Locale-dependent | UTF-8 |
| Return value | The input, invisibly | NULL | NULL |

Use `write_csv()` for tidyverse workflows and pipe chains. Use `data.table::fwrite()` when the file has millions of rows and write speed dominates. Reach for `write.csv()` only when a downstream tool genuinely expects the row-names column.

[TIP]
**Use write_excel_csv() when the file is for Excel.** It writes a UTF-8 byte-order mark so Excel reads accented characters and non-Latin text correctly instead of showing garbled symbols. The data is otherwise identical to write_csv() output.

## Common pitfalls

**Three mistakes cause most write_csv() bugs.** Each one is silent, so the file looks fine until something downstream breaks.

**Row names disappear.** `write_csv()` drops row names without warning. Writing `mtcars` loses the car model labels because they live in the row names, not a column.

```r title="Keep row names by promoting them first"
library(tibble)
mtcars |>
  rownames_to_column("model") |>
  write_csv("cars.csv")
```

**Appending blindly can corrupt a file.** With `append = TRUE`, readr writes rows by column position and does not check that the names or order match the existing file. Always confirm the new data has the same columns in the same order.

**Column types are not preserved.** CSV is plain text, so factors, dates, and exact numeric types are lost on a round trip. Reading the file back re-guesses every column. When you need an exact round trip, use `write_rds()` instead.

## Try it yourself

**Try it:** Write the built-in `airquality` data frame to a file called `aq.csv`, then read it back into `ex_aq`. Confirm it has 153 rows.

```r title="Your turn: write and read airquality"
# Try it: write airquality, then read it back
write_csv(airquality, "aq.csv")
ex_aq <- # your code here

nrow(ex_aq)
#> Expected: 153
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
write_csv(airquality, "aq.csv")
ex_aq <- read_csv("aq.csv", show_col_types = FALSE)
nrow(ex_aq)
#> [1] 153
```

**Explanation:** write_csv() saves the data frame to disk, and read_csv() reads it back into a tibble. The row count is unchanged because writing and reading a CSV never adds or drops rows.

</details>

## Related readr functions

These functions pair naturally with `write_csv()` for import and export work:

- **read_csv()** reads a CSV file back into a tibble, the exact inverse of write_csv().
- **write_tsv()** writes a tab-separated file for tools that expect tabs.
- **write_delim()** writes any single-delimiter file, such as pipe-separated output.
- **write_rds()** saves an R object to disk with all column types preserved.
- **write_lines()** writes a character vector to a file, one string per line.

For the full argument reference, see the [readr write_csv() documentation](https://readr.tidyverse.org/reference/write_delim.html).

## FAQ

**What is the difference between write_csv() and write.csv()?**
The core difference is row names. Base R's `write.csv()` adds an unnamed first column holding row labels, while readr's `write_csv()` never writes row names. `write_csv()` is also faster, always encodes UTF-8, and quotes values only when needed instead of quoting every text field. For tidyverse pipelines, `write_csv()` is the cleaner default.

**Does write_csv() add row names to the file?**
No. `write_csv()` writes only the columns of the data frame, never the row names. If your data has meaningful row names, such as the model labels in `mtcars`, promote them to a real column first with `tibble::rownames_to_column()` before writing, or they will be lost.

**How do I append rows to a CSV file with write_csv()?**
Pass `append = TRUE`. readr then skips the header row and writes the new rows after the existing data. Make sure the new data has the same columns in the same order as the file, because `append = TRUE` writes by position and does not verify that the headers match.

**How do I open a write_csv() file in Excel without encoding errors?**
Use `write_excel_csv()` instead. It writes the same data but prepends a UTF-8 byte-order mark, which tells Excel to read the file as UTF-8. Without it, Excel may display accented or non-Latin characters as garbled symbols.

**Can write_csv() write a compressed file?**
Yes. If the file path ends in `.gz`, `.bz2`, `.xz`, or `.zip`, readr compresses the output automatically. For example, `write_csv(df, "out.csv.gz")` writes a gzip-compressed CSV, and `read_csv()` decompresses it transparently when you read it back.
