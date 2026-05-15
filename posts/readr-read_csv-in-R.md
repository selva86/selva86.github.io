---
title: "readr read_csv() in R: Read CSV Files Into Tibbles"
slug: readr-read_csv-in-R
description: "Learn readr read_csv() in R to import CSV files into tibbles. Covers syntax, column types, selecting columns, missing values, and read.csv differences."
keywords: "readr read_csv, read_csv function R, readr read_csv examples, R read_csv data, read csv in R, import csv R, read_csv tibble"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: readr--readxl--haven
fr_parent: Importing-Data-in-R.html
auto_link_terms: "read_csv()|readr read_csv|readr::read_csv()|read CSV in R|import CSV in R"
auto_link_case_sensitive: true
target_keyword: "readr read_csv"
sibling_block_enabled: true
difficulty: Beginner
---

# readr read_csv() in R: Read CSV Files Into Tibbles

<p class="lead">The readr read_csv() function reads a comma-separated file into a tibble, guessing each column type automatically. It is faster than base R's read.csv() and never silently converts text to factors.</p>

[QUICK ANSWER]
read_csv("data.csv")                        # read a local file
read_csv(I("a,b\n1,2"))                     # read CSV text directly
read_csv("data.csv", col_select = c(a, b))  # keep only some columns
read_csv("data.csv", n_max = 100)           # read the first 100 rows
read_csv("data.csv", skip = 2)              # skip junk header rows
read_csv("data.csv", na = c("", "NA", "-")) # set the NA strings
read_csv("https://site.com/data.csv")       # read straight from a URL

[DECISION TREE: Is read_csv() the right tool?]
- read a comma-separated file: read_csv("data.csv")
- file uses semicolons (EU format): read_csv2("data.csv")
- file is tab-separated: read_tsv("data.csv")
- any other single delimiter: read_delim("data.csv", delim = "|")
- file is an Excel workbook: read_excel("data.xlsx")
- columns are fixed-width, no delimiter: read_fwf("data.txt")

## What read_csv() does

**read_csv() turns a CSV file into a tibble.** You give it a file path, a URL, or literal CSV text, and it returns a tidy data frame with one column per field. It scans the first rows to guess whether each column is a number, a date, a logical, or text, then parses the whole file in fast C++ code.

## Syntax and key arguments

**The signature is small but the arguments do a lot of work.** Most calls only need the `file` argument; the rest tune parsing.

```r title="The read_csv signature"
read_csv(
  file,                  # path, URL, or I() literal text
  col_names = TRUE,      # TRUE, FALSE, or a character vector
  col_types = NULL,      # NULL guesses; cols() or a compact string sets
  col_select = NULL,     # columns to keep, tidyselect style
  na = c("", "NA"),      # strings to treat as missing
  skip = 0,              # number of lines to skip before the header
  n_max = Inf,           # maximum number of data rows to read
  show_col_types = TRUE  # print the guessed column spec
)
```

The arguments you reach for most are `col_types` (stop the guessing), `col_select` (read fewer columns), `na` (declare your missing-value markers), and `skip` (jump past export junk above the header).

[NOTE]
**Coming from Python pandas?** The equivalent of `read_csv("data.csv")` is `pandas.read_csv("data.csv")`. The argument names differ: pandas uses `usecols` where readr uses `col_select`, and `nrows` where readr uses `n_max`.

## read_csv() examples

**Start with a round trip.** Write a built-in dataset to disk, then read it back so every example below has a real file to work with.

```r title="Write and read a CSV file"
library(readr)

write_csv(mtcars, "cars.csv")
cars <- read_csv("cars.csv")
cars
#> Rows: 32 Columns: 11
#> -- Column specification ---------------------
#> Delimiter: ","
#> dbl (11): mpg, cyl, disp, hp, drat, wt, qsec, vs, am, gear, carb
#> # A tibble: 32 x 11
#>     mpg   cyl  disp    hp  drat    wt
#>   <dbl> <dbl> <dbl> <dbl> <dbl> <dbl>
#> 1  21       6   160   110  3.9   2.62
#> 2  21       6   160   110  3.9   2.88
#> 3  22.8     4   108    93  3.85  2.32
#> # i 29 more rows, and 5 more columns
```

The column specification message confirms how each field was parsed. Here all 11 columns came back as `dbl` (double).

**You can read CSV text directly without a file.** Wrap the literal string in `I()` so read_csv() knows it is data, not a path.

```r title="Read CSV text directly"
read_csv(I("name,age,city
Alice,30,Boston
Bob,25,Denver"))
#> # A tibble: 2 x 3
#>   name    age city
#>   <chr> <dbl> <chr>
#> 1 Alice    30 Boston
#> 2 Bob      25 Denver
```

**Read only the columns and rows you need.** `col_select` accepts unquoted names, and `n_max` caps the row count, which keeps large files cheap to explore.

```r title="Read a subset of columns and rows"
read_csv("cars.csv", col_select = c(mpg, hp, gear), n_max = 5)
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
read_csv(I("id,score
1,100
2,NA
3,missing"), na = c("NA", "missing"))
#> # A tibble: 3 x 2
#>      id score
#>   <dbl> <dbl>
#> 1     1   100
#> 2     2    NA
#> 3     3    NA
```

[TIP]
**Set col_types once you know the schema.** Passing `col_types` skips the guessing scan, silences the spec message, and guarantees stable types across files. Use `cols(cyl = col_integer(), .default = col_double())` to set one column and default the rest.

## read_csv() vs read.csv() and alternatives

**read_csv() is the tidyverse reader; read.csv() is base R.** They look similar but behave differently in ways that matter on real data.

| Function | Returns | Type guessing | Speed | Best for |
|----------|---------|---------------|-------|----------|
| `read_csv()` | tibble | yes, never factors | fast (C++) | most tidyverse work |
| `read.csv()` | data.frame | strings stay character (R 4.0+) | slow | base-only scripts |
| `read_csv2()` | tibble | yes | fast | EU files: `;` sep, `,` decimal |
| `data.table::fread()` | data.table | yes | fastest | very large files |

Use `read_csv()` for everyday tidyverse pipelines. Switch to `fread()` when files run to hundreds of megabytes, and to `read_csv2()` when a European export uses semicolons as the separator.

## Common pitfalls

**Passing literal text as if it were a path.** A bare CSV string makes read_csv() look for a file with that name and fail.

```r title="Pitfall: literal text without I()"
# read_csv("a,b\n1,2")          # error: file does not exist
read_csv(I("a,b\n1,2"))         # correct: I() marks it as data
#> # A tibble: 1 x 2
#>       a     b
#>   <dbl> <dbl>
#> 1     1     2
```

**Reading a semicolon file with read_csv().** A European export comes back as a single text column. Use `read_csv2()`, which expects `;` separators and `,` decimals.

**Trusting guessed types on messy columns.** read_csv() guesses types from the first 1,000 rows. If a clean numeric column has text far down, it may be read as character. Set `col_types` explicitly when a column matters.

## Try it yourself

**Try it:** Read `cars.csv` keeping only the `mpg` and `cyl` columns, then count how many rows have `cyl` equal to 4. Save the row count to `ex_count`.

```r title="Your turn: read and count"
# Try it: read cars.csv, keep two columns, count cyl == 4
ex_data <- # your code here

ex_count <- # your code here
ex_count
#> Expected: 11
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_data <- read_csv("cars.csv", col_select = c(mpg, cyl))
ex_count <- sum(ex_data$cyl == 4)
ex_count
#> [1] 11
```

**Explanation:** `col_select` keeps just the two columns, which makes the read cheaper. `sum()` over a logical vector counts the `TRUE` values, giving the number of 4-cylinder cars.

</details>

## Related readr functions

**read_csv() has a family of delimiter-specific siblings.** Reach for the one that matches your file format.

- `read_tsv()`: read tab-separated files.
- `read_delim()`: read any single-character delimiter.
- `read_csv2()`: read semicolon-separated European CSV files.
- `write_csv()`: write a data frame back out to CSV.
- `read_excel()`: read `.xlsx` and `.xls` workbooks.

For the full import picture, see the [readr reference](https://readr.tidyverse.org/reference/read_delim.html) on tidyverse.org.

## FAQ

**What is the difference between read_csv() and read.csv() in R?**

`read_csv()` from readr returns a tibble, parses types in fast C++ code, and prints a column specification. `read.csv()` from base R returns a data.frame and is slower. Since R 4.0 both keep strings as character by default, but `read_csv()` still wins on speed, consistent parsing, and clearer output.

**How do I read a CSV file without converting strings to factors?**

Use `read_csv()`. It never converts text columns to factors, so character data stays character. With base `read.csv()` on R versions before 4.0 you needed `stringsAsFactors = FALSE`; readr removes that worry entirely.

**Why does read_csv() show a column specification message?**

The message reports the type read_csv() guessed for each column, so you can confirm the parse was correct. It is informational, not an error. Suppress it by passing `show_col_types = FALSE` or by supplying explicit `col_types`.

**How do I read a large CSV file faster in R?**

read_csv() is already fast, but you can speed it up further. Use `col_select` to read fewer columns, set `col_types` to skip the guessing scan, and cap rows with `n_max` while exploring. For files in the hundreds of megabytes, `data.table::fread()` is faster still.

**Can read_csv() read a CSV from a URL?**

Yes. Pass an `http://` or `https://` URL as the `file` argument and read_csv() downloads and parses it in one step. For files you will reuse, download once with `download.file()` and read the local copy to avoid repeated network calls.
