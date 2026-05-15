---
title: "readr read_delim() in R: Read Any Delimited Text File"
slug: readr-read_delim-in-R
description: "Learn readr read_delim() in R to read text files with any delimiter into a tibble. Covers the delim argument, column types, missing values, and read_csv."
keywords: "readr read_delim, read_delim function R, readr read_delim examples, R read_delim file, read delimited file R, read_delim vs read_csv, custom delimiter R"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: readr--readxl--haven
fr_parent: Importing-Data-in-R.html
auto_link_terms: "read_delim()|readr read_delim|readr::read_delim()|read delimited file in R|import delimited file in R"
auto_link_case_sensitive: true
target_keyword: "readr read_delim"
sibling_block_enabled: true
difficulty: Beginner
---

# readr read_delim() in R: Read Any Delimited Text File

<p class="lead">The readr read_delim() function reads a text file with any single-character delimiter into a tibble. You set the separator with the delim argument, so pipe, semicolon, and tab files all parse with one function.</p>

[QUICK ANSWER]
read_delim("data.txt", delim = "|")                       # pipe-delimited file
read_delim("data.txt", delim = ";")                       # semicolon-delimited file
read_delim("data.txt", delim = "\t")                      # tab-delimited file
read_delim(I("a;b\n1;2"), delim = ";")                    # read delimited text directly
read_delim("data.txt", delim = "|", col_select = c(a, b)) # keep only some columns
read_delim("data.txt", delim = "|", skip = 2)             # skip junk header rows
read_delim("data.txt", delim = "|", na = c("", "NA", "-"))# set the NA strings

[DECISION TREE: Is read_delim() the right tool?]
- read a file with a custom delimiter: read_delim("data.txt", delim = "|")
- file is comma-separated: read_csv("data.csv")
- file is tab-separated: read_tsv("data.tsv")
- columns are fixed-width, no separator: read_fwf("data.txt")
- whitespace-separated with ragged spacing: read_table("data.txt")
- file is an Excel workbook: read_excel("data.xlsx")

## What read_delim() does

**read_delim() reads a delimited text file into a tibble.** You give it a file path, a URL, or literal text, plus the `delim` character that separates fields. It scans the first rows to guess each column type, then parses the whole file in fast C++ code and returns a tidy data frame.

It is the general-purpose reader in the readr family. `read_csv()` and `read_tsv()` are just `read_delim()` with the delimiter fixed to a comma or a tab. When your file uses any other separator, reach for `read_delim()` and set `delim` yourself.

## Syntax and key arguments

**The signature is compact, and `delim` is the argument that defines the call.** Most reads only need `file` and `delim`; the rest tune parsing.

```r title="The read_delim signature"
read_delim(
  file,                  # path, URL, or I() literal text
  delim = NULL,          # the field separator: "|", ";", "\t", etc.
  col_names = TRUE,      # TRUE, FALSE, or a character vector
  col_types = NULL,      # NULL guesses; cols() or a compact string sets
  col_select = NULL,     # columns to keep, tidyselect style
  na = c("", "NA"),      # strings to treat as missing
  skip = 0,              # number of lines to skip before the header
  n_max = Inf            # maximum number of data rows to read
)
```

When `delim` is `NULL`, read_delim() tries to guess the separator. The guess is usually right for clean files, but passing `delim` explicitly is safer and documents the format for the next reader.

[NOTE]
**Coming from Python pandas?** The equivalent of `read_delim("data.txt", delim = "|")` is `pandas.read_csv("data.txt", sep="|")`. The pandas `sep` argument maps to readr's `delim`, and `usecols` maps to `col_select`.

## read_delim() examples

**Start with a round trip.** Write a built-in dataset to a pipe-delimited file, then read it back so every example has a real file to use.

```r title="Write and read a pipe-delimited file"
library(readr)

write_delim(mtcars, "cars.txt", delim = "|")
cars <- read_delim("cars.txt", delim = "|")
cars
#> Rows: 32 Columns: 11
#> -- Column specification ---------------------
#> Delimiter: "|"
#> dbl (11): mpg, cyl, disp, hp, drat, wt, qsec, vs, am, gear, carb
#> # A tibble: 32 x 11
#>     mpg   cyl  disp    hp  drat    wt
#>   <dbl> <dbl> <dbl> <dbl> <dbl> <dbl>
#> 1  21       6   160   110  3.9   2.62
#> 2  21       6   160   110  3.9   2.88
#> 3  22.8     4   108    93  3.85  2.32
#> # i 29 more rows, and 5 more columns
```

The column specification message confirms the delimiter and how each field parsed. All 11 columns came back as `dbl` (double).

**You can read delimited text directly without a file.** Wrap the literal string in `I()` so read_delim() treats it as data, not a path.

```r title="Read delimited text directly"
read_delim(I("name;age;city
Alice;30;Boston
Bob;25;Denver"), delim = ";")
#> # A tibble: 2 x 3
#>   name    age city
#>   <chr> <dbl> <chr>
#> 1 Alice    30 Boston
#> 2 Bob      25 Denver
```

**Read only the columns and rows you need.** `col_select` accepts unquoted names and `n_max` caps the row count, which keeps large files cheap to explore.

```r title="Read a subset of columns and rows"
read_delim("cars.txt", delim = "|", col_select = c(mpg, hp, gear), n_max = 5)
#> # A tibble: 5 x 3
#>     mpg    hp  gear
#>   <dbl> <dbl> <dbl>
#> 1  21     110     4
#> 2  21     110     4
#> 3  22.8    93     4
#> 4  21.4   110     3
#> 5  18.7   175     3
```

**Declare your own missing-value markers.** Real exports use codes like `n/a` or `-`. Pass them to `na` so they parse as `NA` instead of forcing a column to text.

```r title="Handle custom missing values"
read_delim(I("id|score
1|100
2|n/a
3|-"), delim = "|", na = c("n/a", "-"))
#> # A tibble: 3 x 2
#>      id score
#>   <dbl> <dbl>
#> 1     1   100
#> 2     2    NA
#> 3     3    NA
```

[TIP]
**Set col_types once you know the schema.** Passing `col_types` skips the guessing scan, silences the spec message, and guarantees stable types across files. Use `cols(cyl = col_integer(), .default = col_double())` to set one column and default the rest.

## read_delim() vs read_csv() and read_tsv()

**read_delim() is the general reader; read_csv() and read_tsv() are shortcuts.** They share the same engine, so the choice is about how much you spell out.

| Function | Delimiter | When to use |
|----------|-----------|-------------|
| `read_delim()` | any, set via `delim` | pipe, semicolon, or any custom separator |
| `read_csv()` | comma, fixed | standard comma-separated files |
| `read_tsv()` | tab, fixed | tab-separated files |
| `read_csv2()` | semicolon, fixed | EU files: `;` separator, `,` decimal |
| `read_table()` | whitespace | space-aligned columns with ragged spacing |

Use `read_csv()` or `read_tsv()` when the format is standard; the name documents the file. Use `read_delim()` for everything else, and for EU semicolon files prefer `read_csv2()` because it also handles the comma decimal mark.

[KEY INSIGHT]
**One function covers every single-character delimiter.** Instead of memorizing a reader per format, learn `read_delim()` and change one argument. The `delim` value is the only thing that varies between a pipe file, a semicolon file, and a tab file.

## Common pitfalls

**Relying on delimiter guessing.** When you omit `delim`, read_delim() guesses the separator from the first lines. A file with commas inside quoted text can fool the guess. Always pass `delim` explicitly.

```r title="Pitfall: passing literal text without I()"
# read_delim("a|b\n1|2", delim = "|")   # error: file does not exist
read_delim(I("a|b\n1|2"), delim = "|")  # correct: I() marks it as data
#> # A tibble: 1 x 2
#>       a     b
#>   <dbl> <dbl>
#> 1     1     2
```

**Passing a multi-character delimiter.** The `delim` argument takes exactly one character. A string like `"||"` or `", "` raises an error. For fixed-width files with no separator, use `read_fwf()` instead.

**Trusting guessed types on messy columns.** read_delim() guesses types from the first 1,000 rows. If a clean numeric column has stray text far down, the column reads as character. Set `col_types` explicitly when a column matters.

## Try it yourself

**Try it:** Write `mtcars` to a semicolon-delimited file, read it back keeping only `mpg` and `cyl`, then count the rows where `cyl` equals 4. Save the count to `ex_count`.

```r title="Your turn: read a semicolon file"
# Try it: write a ; file, read two columns, count cyl == 4
write_delim(mtcars, "cars2.txt", delim = ";")
ex_data <- # your code here

ex_count <- # your code here
ex_count
#> Expected: 11
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
write_delim(mtcars, "cars2.txt", delim = ";")
ex_data <- read_delim("cars2.txt", delim = ";", col_select = c(mpg, cyl))
ex_count <- sum(ex_data$cyl == 4)
ex_count
#> [1] 11
```

**Explanation:** `delim = ";"` matches the separator used by `write_delim()`. `col_select` keeps just the two columns, and `sum()` over a logical vector counts the `TRUE` values, giving the number of 4-cylinder cars.

</details>

## Related readr functions

**read_delim() sits at the center of the readr import family.** Reach for the sibling that matches your file format.

- `read_csv()`: read comma-separated files.
- `read_tsv()`: read tab-separated files.
- `read_csv2()`: read semicolon-separated European CSV files.
- `read_fwf()`: read fixed-width files that have no delimiter.
- `write_delim()`: write a data frame back out with any delimiter.

For the full argument reference, see the [readr read_delim documentation](https://readr.tidyverse.org/reference/read_delim.html) on tidyverse.org.

## FAQ

**What is the difference between read_delim() and read_csv() in R?**

`read_delim()` reads a file with any single-character delimiter, which you set through the `delim` argument. `read_csv()` is a shortcut with the delimiter fixed to a comma. Both use the same fast parser and return a tibble. Use `read_csv()` when the file is standard CSV, and `read_delim()` when the separator is a pipe, semicolon, or anything else.

**How do I read a pipe-delimited file in R?**

Call `read_delim("data.txt", delim = "|")`. The `delim` argument tells readr that the vertical bar separates fields, and the function returns a tibble with one column per field. The same pattern works for any single character, so a tilde file uses `delim = "~"`.

**How do I read a tab-delimited file with read_delim()?**

Pass the tab escape sequence as the delimiter: `read_delim("data.txt", delim = "\t")`. This is exactly what `read_tsv()` does internally, so `read_tsv("data.txt")` is the shorter equivalent. Use whichever reads more clearly in your script.

**Why does read_delim() guess the wrong column types?**

read_delim() guesses each type from the first 1,000 rows. If a column looks numeric early but contains text further down, the guess can be wrong. Fix it by passing `col_types`, for example `col_types = cols(score = col_character())`, which overrides the guess for that column.

**Can read_delim() read a file from a URL?**

Yes. Pass an `http://` or `https://` URL as the `file` argument and read_delim() downloads and parses it in one step. For a file you will reuse, download it once with `download.file()` and read the local copy to avoid repeated network calls.
</content>
</invoke>
