---
title: "readr write_delim() in R: Write Data to Delimited Files"
slug: readr-write_delim-in-R
description: "Learn readr write_delim() in R to save data frames to space, pipe, or any custom-delimited text file. Syntax, examples, append mode, and a write_csv comparison."
keywords: "readr write_delim, write_delim function R, readr write_delim examples, write delimited file R, write_delim vs write_csv, save data frame to file R, write tab-delimited file R"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: readr--readxl--haven
fr_parent: Importing-Data-in-R.html
auto_link_terms: "write_delim()|readr write_delim|readr::write_delim()|write delimited file|write_delim function"
auto_link_case_sensitive: true
target_keyword: "readr write_delim"
sibling_block_enabled: true
difficulty: Beginner
---

# readr write_delim() in R: Write Data to Delimited Files

<p class="lead">The readr write_delim() function saves a data frame to a plain-text file using any field separator you choose. Pass a data frame, a file path, and a <code>delim</code> string to write space, pipe, semicolon, or tab-delimited output.</p>

[QUICK ANSWER]
write_delim(df, "out.txt")                # space-delimited (default)
write_delim(df, "out.psv", delim = "|")   # pipe-delimited
write_delim(df, "out.tsv", delim = "\t")  # tab-delimited
write_delim(df, "out.txt", na = "")       # blank string for missing values
write_delim(df, "out.txt", append = TRUE) # add rows, skip the header
write_delim(df, "out.txt", col_names = FALSE) # write data only, no header
write_delim(df, "out.txt.gz")             # gzip-compressed output (auto-detected)

[DECISION TREE: Is write_delim() the right tool?]
- write with a custom delimiter: write_delim(df, f, delim = "|")
- write a standard comma file: write_csv(df, "f.csv")
- write a tab-separated file: write_tsv(df, "f.tsv")
- write plain text lines: write_lines(x, "f.txt")
- save an R object exactly: write_rds(df, "f.rds")
- read a delimited file back in: read_delim("f.txt")

## What write_delim() does

**write_delim() is readr's general-purpose text writer.** It takes a data frame and serializes each row to a line of text, joining the column values with a delimiter of your choosing. It is the function behind `write_csv()` and `write_tsv()`, which are just thin wrappers that fix the delimiter for you.

## write_delim() syntax

**The signature exposes one required pair and several formatting controls.** You must supply `x` (the data frame) and `file` (the destination path). Everything else has a default, so the simplest call is two arguments long.

```r title="Inspect the write_delim signature"
library(readr)
args(write_delim)
#> function (x, file, delim = " ", na = "NA", append = FALSE, 
#>     col_names = !append, quote = c("needed", "all", "none"), 
#>     escape = c("double", "backslash", "none"), eol = "\n", 
#>     num_threads = readr_threads(), progress = show_progress()) 
#> NULL
```

The arguments you will reach for most often:

- **`delim`**: the field separator. Defaults to a single space. Set it to `"|"`, `";"`, or `"\t"` for other formats.
- **`na`**: the string written for `NA` values. Defaults to `"NA"`; use `""` for a blank cell.
- **`append`**: when `TRUE`, rows are added to an existing file instead of overwriting it.
- **`col_names`**: whether to write the header row. Defaults to `!append`, so headers appear on a fresh write and are skipped when appending.
- **`quote`**: when to wrap fields in quotes. `"needed"` (default) quotes only values that contain the delimiter or a newline.

[NOTE]
**A gzip extension triggers compression.** If `file` ends in `.gz`, `.bz2`, `.xz`, or `.zst`, `write_delim()` compresses the output automatically. No extra argument is needed.

## Writing data with a custom delimiter

**The default delimiter is a space, which produces a clean, readable text file.** Point `write_delim()` at any data frame and a path, then read the file back to confirm what landed on disk.

```r title="Write a space-delimited file"
write_delim(mtcars[1:3, 1:4], "cars.txt")

cat(read_file("cars.txt"))
#> mpg cyl disp hp
#> 21 6 160 110
#> 21 6 160 110
#> 22.8 4 108 93
```

**Switch the delimiter with a single argument.** Pipe-delimited files are common in data exports because the pipe character rarely appears inside real values, so it avoids the quoting that commas force.

```r title="Write a pipe-delimited file"
write_delim(mtcars[1:3, 1:4], "cars.psv", delim = "|")

cat(read_file("cars.psv"))
#> mpg|cyl|disp|hp
#> 21|6|160|110
#> 21|6|160|110
#> 22.8|4|108|93
```

**The `na` argument controls how missing values appear.** By default `write_delim()` writes the literal text `NA`. Many downstream tools expect a blank or a custom token instead.

```r title="Control delimiter and NA string"
df <- data.frame(id = 1:3, score = c(90, NA, 75))

write_delim(df, "scores.txt", delim = ";", na = "missing")

cat(read_file("scores.txt"))
#> id;score
#> 1;90
#> 2;missing
#> 3;75
```

**Set `append = TRUE` to grow a file row by row.** When appending, `col_names` defaults to `FALSE`, so the header is written once and new rows slot in cleanly underneath.

```r title="Append rows without a repeated header"
new_rows <- data.frame(id = 4:5, score = c(60, 88))

write_delim(new_rows, "scores.txt", delim = ";", append = TRUE)

cat(read_file("scores.txt"))
#> id;score
#> 1;90
#> 2;missing
#> 3;75
#> 4;60
#> 5;88
```

[TIP]
**Keep the delimiter consistent across appends.** A file written with `delim = ";"` must be appended with `delim = ";"`. Mixing separators within one file produces rows that no reader can parse correctly.

## write_delim() vs write_csv() and write_tsv()

**Pick the wrapper when the format is standard, and write_delim() when it is not.** `write_csv()` and `write_tsv()` exist purely for convenience: they call `write_delim()` with a fixed delimiter and, for CSV, a slightly different default quoting rule.

| Function | Delimiter | Use it when |
|----------|-----------|-------------|
| `write_csv()` | comma | You need a standard `.csv` for spreadsheets or sharing |
| `write_tsv()` | tab | A tab-separated file is required, often for genomics or logs |
| `write_delim()` | any (space by default) | The separator is a pipe, semicolon, or anything non-standard |

```r title="write_delim with a comma matches write_csv"
write_delim(mtcars[1:2, 1:3], "via_delim.csv", delim = ",")

cat(read_file("via_delim.csv"))
#> mpg,cyl,disp
#> 21,6,160
#> 21,6,160
```

[KEY INSIGHT]
**There is only one writer.** `write_csv()` is `write_delim()` with `delim = ","`, and `write_tsv()` is `write_delim()` with `delim = "\t"`. Learn `write_delim()` once and you understand the whole family.

## Common pitfalls

**Three mistakes account for most malformed output files.**

- **Expecting row names.** `write_delim()` never writes data frame row names. The `mtcars` car names are dropped silently. Move them into a real column with `tibble::rownames_to_column()` first if you need them.
- **Overwriting instead of appending.** A plain `write_delim()` call truncates the file. Forgetting `append = TRUE` replaces your accumulated data with the latest batch.
- **Unquoted delimiters in text.** If a character column contains your delimiter, `write_delim()` quotes that field. Choosing a separator that cannot appear in the data (a pipe, a tab) avoids surprise quotes entirely.

## Try it yourself

**Try it:** Write the first 4 rows and first 2 columns of `iris` to a semicolon-delimited file named `flowers.txt`, then read the file content back. Save the read-back text to `ex_text`.

```r title="Your turn: write a semicolon file"
# Try it: write iris with a semicolon delimiter
ex_text <- # your code here

cat(ex_text)
#> Expected: a header line "Sepal.Length;Sepal.Width" plus 4 data rows
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
write_delim(iris[1:4, 1:2], "flowers.txt", delim = ";")
ex_text <- read_file("flowers.txt")
cat(ex_text)
#> Sepal.Length;Sepal.Width
#> 5.1;3.5
#> 4.9;3
#> 4.7;3.2
#> 4.6;3.1
```

**Explanation:** `delim = ";"` sets the separator, and `read_file()` returns the whole file as one string so `cat()` can print it with line breaks intact.

</details>

## Related readr functions

**These functions cover the rest of the readr write-and-read cycle.**

- [readr write_csv()](readr-write_csv-in-R.html) writes a standard comma-separated file.
- [readr write_tsv()](readr-write_tsv-in-R.html) writes a tab-separated file.
- [readr read_delim()](readr-read_delim-in-R.html) reads a delimited file back into a data frame.
- `write_lines()` writes a character vector as plain text lines.
- `write_rds()` saves an R object in binary form, preserving every attribute.

## FAQ

**What is the difference between write_delim() and write_csv() in R?**

`write_csv()` is a convenience wrapper that calls `write_delim()` with `delim = ","`. Use `write_csv()` whenever you want a standard comma-separated file, since the name documents your intent. Reach for `write_delim()` only when you need a non-standard separator such as a pipe, a semicolon, or a space. Both functions write tibbles and plain data frames identically and share the same `na`, `append`, and `col_names` arguments.

**How do I write a pipe-delimited file in R?**

Call `write_delim(df, "file.psv", delim = "|")`. The `delim` argument accepts any single string, so a pipe character produces a pipe-separated file. Pipe delimiters are popular because the character almost never appears inside real data values, which means `write_delim()` rarely has to add quotes. Read the file back with `read_delim("file.psv", delim = "|")`.

**Does write_delim() write row names?**

No. `write_delim()` writes only the columns of the data frame, never the row names. When you write `mtcars`, the car names disappear from the output. If you need them, promote the row names to a real column first with `tibble::rownames_to_column("car")`, then write the result.

**How do I append data to an existing file with write_delim()?**

Pass `append = TRUE`. The new rows are added below the existing content, and because `col_names` defaults to `!append`, the header is skipped automatically. Make sure the `delim` value matches the delimiter the original file already uses, or the appended rows will not align with the header.

For the official argument reference, see the [readr write_delim documentation](https://readr.tidyverse.org/reference/write_delim.html).
