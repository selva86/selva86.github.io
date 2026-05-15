---
title: "readr read_tsv() in R: Read Tab-Separated Files Fast"
slug: readr-read_tsv-in-R
description: "Learn readr read_tsv() in R to read tab-separated files into tibbles. Covers syntax, column types, NA strings, column selection, and read.delim differences."
keywords: "readr read_tsv, read_tsv function R, readr read_tsv examples, R read tsv file, import tsv R, read tab delimited file R, read_tsv tibble"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: readr--readxl--haven
fr_parent: Importing-Data-in-R.html
auto_link_terms: "read_tsv()|readr read_tsv|readr::read_tsv()|read TSV file|read tab-separated file"
auto_link_case_sensitive: true
target_keyword: "readr read_tsv"
sibling_block_enabled: true
difficulty: Beginner
---

# readr read_tsv() in R: Read Tab-Separated Files Fast

<p class="lead">The readr read_tsv() function reads a tab-separated file into a tibble, guessing each column type automatically. It parses tab-delimited exports faster than base R's read.delim() and keeps text columns as character.</p>

[QUICK ANSWER]
read_tsv("data.tsv")                        # read a local file
read_tsv(I("a\tb\n1\t2"))                   # read TSV text directly
read_tsv("data.tsv", col_select = c(a, b))  # keep only some columns
read_tsv("data.tsv", n_max = 100)           # read the first 100 rows
read_tsv("data.tsv", skip = 2)              # skip junk header rows
read_tsv("data.tsv", na = c("", "NA", "-")) # set the NA strings
read_tsv("https://site.com/data.tsv")       # read straight from a URL

[DECISION TREE: Is read_tsv() the right tool?]
- read a tab-separated file: read_tsv("data.tsv")
- file is comma-separated: read_csv("data.csv")
- columns split by spaces: read_table("data.txt")
- any other single delimiter: read_delim("data.txt", delim = "|")
- file is an Excel workbook: read_excel("data.xlsx")
- fixed-width columns, no delimiter: read_fwf("data.txt")

## What read_tsv() does

**read_tsv() turns a tab-separated file into a tibble.** You give it a file path, a URL, or literal text, and it returns a tidy data frame with one column per field. It scans the first rows to guess whether each column holds numbers, dates, logicals, or text, then parses the whole file in fast C++ code. Tab-separated files are common in scientific exports, database dumps, and the "Tab delimited text" save option in spreadsheet software.

## Syntax and key arguments

**The signature mirrors read_csv(); only the delimiter changes.** Most calls need just the `file` argument, and the rest tune how parsing happens.

```r title="The read_tsv signature"
read_tsv(
  file,                  # path, URL, or I() literal text
  col_names = TRUE,      # TRUE, FALSE, or a character vector
  col_types = NULL,      # NULL guesses; cols() or a compact string sets
  col_select = NULL,     # columns to keep, tidyselect style
  na = c("", "NA"),      # strings to treat as missing
  skip = 0,              # lines to skip before the header
  n_max = Inf,           # maximum number of data rows to read
  show_col_types = TRUE  # print the guessed column spec
)
```

The arguments you reach for most are `col_types` (stop the type guessing), `col_select` (read fewer columns), `na` (declare your missing-value markers), and `skip` (jump past export junk above the header).

[NOTE]
**Coming from Python pandas?** The equivalent of `read_tsv("data.tsv")` is `pandas.read_csv("data.tsv", sep="\t")`. pandas has no dedicated TSV reader, so you set the separator yourself; readr ships `read_tsv()` as a ready-made wrapper.

## read_tsv() examples

**Start with a round trip.** Write a built-in dataset to a tab-separated file, then read it back so every example below has a real file to work with.

```r title="Write and read a TSV file"
library(readr)

write_tsv(mtcars, "cars.tsv")
cars <- read_tsv("cars.tsv")
cars
#> Rows: 32 Columns: 11
#> -- Column specification ---------------------
#> Delimiter: "\t"
#> dbl (11): mpg, cyl, disp, hp, drat, wt, qsec, vs, am, gear, carb
#> # A tibble: 32 x 11
#>     mpg   cyl  disp    hp  drat    wt
#>   <dbl> <dbl> <dbl> <dbl> <dbl> <dbl>
#> 1  21       6   160   110  3.9   2.62
#> 2  21       6   160   110  3.9   2.88
#> 3  22.8     4   108    93  3.85  2.32
#> # i 29 more rows, and 5 more columns
```

The column specification message confirms the delimiter was a tab and that all 11 columns parsed as `dbl` (double).

**Tabs let fields contain commas safely.** This is the main reason data exports favor TSV: a product name with a comma stays in one column instead of splitting into two.

```r title="Read tab-separated text directly"
read_tsv(I("product\tunits\nLaptop, 15-inch\t12\nMouse, wireless\t40"))
#> # A tibble: 2 x 2
#>   product         units
#>   <chr>           <dbl>
#> 1 Laptop, 15-inch    12
#> 2 Mouse, wireless    40
```

Wrapping the literal string in `I()` tells read_tsv() the value is data, not a file path.

**Read only the columns and rows you need.** `col_select` accepts unquoted names and `n_max` caps the row count, which keeps large files cheap to explore.

```r title="Read a subset of columns and rows"
read_tsv("cars.tsv", col_select = c(mpg, hp, gear), n_max = 5)
#> # A tibble: 5 x 3
#>     mpg    hp  gear
#>   <dbl> <dbl> <dbl>
#> 1  21     110     4
#> 2  21     110     4
#> 3  22.8    93     4
#> 4  21.4   110     3
#> 5  18.7   175     3
```

**Declare your own missing-value markers.** Real exports use codes like `missing` or `-99`. Pass them to `na` so they parse as `NA` instead of polluting a numeric column.

```r title="Handle custom missing values"
read_tsv(I("id\tscore
1\t100
2\tNA
3\tmissing"), na = c("NA", "missing"))
#> # A tibble: 3 x 2
#>      id score
#>   <dbl> <dbl>
#> 1     1   100
#> 2     2    NA
#> 3     3    NA
```

[TIP]
**Set col_types once you know the schema.** Passing `col_types` skips the guessing scan, silences the spec message, and guarantees stable types across files. Use `cols(cyl = col_integer(), .default = col_double())` to set one column and default the rest.

## read_tsv() vs read.delim() and alternatives

**read_tsv() is the tidyverse tab reader; read.delim() is base R.** Both default to tab delimiters, but they differ in output type and speed.

| Function | Returns | Delimiter | Speed | Best for |
|----------|---------|-----------|-------|----------|
| `read_tsv()` | tibble | tab only | fast (C++) | tidyverse TSV work |
| `read.delim()` | data.frame | tab by default | slow | base-only scripts |
| `read_delim()` | tibble | any, you set `delim` | fast | non-tab delimiters |
| `read_table()` | tibble | runs of whitespace | fast | space-aligned columns |

Use `read_tsv()` for everyday tidyverse pipelines. Switch to `read_delim()` when the file uses a different single delimiter, and to `read_table()` when columns are aligned with runs of spaces rather than single tabs.

[WARNING]
**read_tsv() and read_table() are not interchangeable.** read_tsv() splits only on tab characters, while read_table() splits on any run of whitespace. Feeding a space-aligned file to read_tsv() returns one wide character column instead of a parsed table.

## Common pitfalls

**Passing literal text as if it were a path.** A bare tab-separated string makes read_tsv() look for a file with that name and fail.

```r title="Pitfall: literal text without I()"
# read_tsv("a\tb\n1\t2")        # error: file does not exist
read_tsv(I("a\tb\n1\t2"))       # correct: I() marks it as data
#> # A tibble: 1 x 2
#>       a     b
#>   <dbl> <dbl>
#> 1     1     2
```

**Reading a CSV with read_tsv().** A comma-separated file has no tabs, so read_tsv() returns every row as a single column. Use `read_csv()` for comma files and `read_delim()` to set a custom delimiter.

**Trusting guessed types on messy columns.** read_tsv() guesses types from the first 1,000 rows. If a clean numeric column has stray text far down, it may be read as character. Set `col_types` explicitly when a column matters.

## Try it yourself

**Try it:** Read `cars.tsv` keeping only the `mpg` and `gear` columns, then count how many rows have `gear` equal to 4. Save the row count to `ex_count`.

```r title="Your turn: read and count"
# Try it: read cars.tsv, keep two columns, count gear == 4
ex_data <- # your code here

ex_count <- # your code here
ex_count
#> Expected: 12
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_data <- read_tsv("cars.tsv", col_select = c(mpg, gear))
ex_count <- sum(ex_data$gear == 4)
ex_count
#> [1] 12
```

**Explanation:** `col_select` keeps just the two columns, which makes the read cheaper. `sum()` over a logical vector counts the `TRUE` values, giving the number of 4-gear cars.

</details>

## Related readr functions

**read_tsv() has a family of delimiter-specific siblings.** Reach for the one that matches your file format.

- `read_csv()`: read comma-separated files into tibbles.
- `read_delim()`: read any single-character delimiter you specify.
- `read_table()`: read columns aligned by runs of whitespace.
- `write_tsv()`: write a data frame back out as a tab-separated file.
- `read_excel()`: read `.xlsx` and `.xls` workbooks.

For the full import picture, see the [readr reference](https://readr.tidyverse.org/reference/read_delim.html) on tidyverse.org.

## FAQ

**What is the difference between read_tsv() and read.delim() in R?**

`read_tsv()` from readr returns a tibble, parses types in fast C++ code, and prints a column specification. `read.delim()` from base R returns a data.frame and runs slower. Both default to tab delimiters, but `read_tsv()` wins on speed, consistent parsing, and clearer output. Since R 4.0 both keep strings as character rather than converting them to factors.

**How do I read a tab-delimited file in R?**

Call `read_tsv("file.tsv")` after loading the readr package with `library(readr)`. The function reads the tab-separated file into a tibble and guesses each column type. The extension does not matter: a `.txt` file with tab separators reads the same way. Pass `col_select` to keep fewer columns and `n_max` to limit rows.

**Why does read_tsv() show a column specification message?**

The message reports the type read_tsv() guessed for each column, so you can confirm the parse was correct. It is informational, not an error. Suppress it by passing `show_col_types = FALSE`, or by supplying explicit `col_types`, which also skips the guessing scan entirely.

**Can read_tsv() read a .txt file?**

Yes. read_tsv() reads any file whose fields are separated by tab characters, regardless of extension. Many tab-delimited exports use a `.txt` or `.tab` extension instead of `.tsv`. If the file uses a different delimiter, use `read_delim()` with the `delim` argument set to the correct character.

**What is the difference between read_tsv() and read_table()?**

`read_tsv()` splits each line only on tab characters. `read_table()` splits on any run of whitespace, including multiple spaces. Use `read_tsv()` for true tab-separated files and `read_table()` for output where columns are aligned with spaces, such as fixed-format console dumps.
