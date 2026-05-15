---
title: "readr read_table() in R: Read Whitespace-Separated Files"
slug: readr-read_table-in-R
description: "Learn readr read_table() in R to read whitespace-separated text files into a tibble. Covers ragged spacing, column types, missing values, and read_fwf."
keywords: "readr read_table, read_table function R, readr read_table examples, R read_table whitespace, read whitespace-separated file R, read_table vs read_delim, read_table2"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: readr--readxl--haven
fr_parent: Importing-Data-in-R.html
auto_link_terms: "read_table()|readr read_table|readr::read_table()|read whitespace-separated file in R|read_table2()"
auto_link_case_sensitive: true
target_keyword: "readr read_table"
sibling_block_enabled: true
difficulty: Beginner
---

# readr read_table() in R: Read Whitespace-Separated Files

<p class="lead">The readr read_table() function reads a whitespace-separated text file into a tibble. It treats any run of spaces or tabs as a single separator, so neatly aligned columns and ragged spacing both parse with one call.</p>

[QUICK ANSWER]
read_table("data.txt")                          # whitespace-separated file
read_table(I("x y\n1 2"))                        # read whitespace text directly
read_table("data.txt", col_names = FALSE)        # file has no header row
read_table("data.txt", col_names = c("a", "b"))  # supply column names
read_table("data.txt", skip = 2)                 # skip junk lines before header
read_table("data.txt", na = c("NA", "."))        # set the NA strings
read_table("data.txt", n_max = 100)              # read only the first 100 rows

[DECISION TREE: Is read_table() the right tool?]
- read a whitespace-separated file: read_table("data.txt")
- columns separated by one fixed character: read_delim("data.txt", delim = "|")
- file is comma-separated: read_csv("data.csv")
- file is tab-separated: read_tsv("data.tsv")
- columns are fixed-width with no gaps: read_fwf("data.txt")
- file is an Excel workbook: read_excel("data.xlsx")

## What read_table() does

**read_table() reads a file whose columns are separated by whitespace.** You give it a file path, a URL, or literal text. The function splits each line on every run of spaces or tabs, guesses each column type from the first rows, and returns a tidy tibble.

The defining feature is how it handles the separator. A comma file has exactly one comma between fields, but a whitespace file often uses padding to line columns up visually. read_table() collapses one space and ten spaces to the same thing, so console dumps, `.dat` files, and space-aligned scientific output all read cleanly.

## Syntax and key arguments

**Most reads need only `file`; the rest of the arguments tune parsing.** The signature mirrors the other readr readers, which makes switching between them easy.

```r title="The read_table signature"
read_table(
  file,                # path, URL, or I() literal text
  col_names = TRUE,    # TRUE, FALSE, or a character vector
  col_types = NULL,    # NULL guesses; cols() or a compact string sets
  na = "NA",           # strings to treat as missing
  skip = 0,            # number of lines to skip before the header
  n_max = Inf,         # maximum number of data rows to read
  comment = ""         # lines starting with this string are dropped
)
```

There is no `delim` argument because the delimiter is fixed: whitespace. If your file uses a single specific character such as a pipe or semicolon, reach for `read_delim()` instead and pass that character.

[NOTE]
**Coming from Python pandas?** The equivalent of `read_table("data.txt")` is `pandas.read_csv("data.txt", sep=r"\s+")`. The pandas regex separator `\s+` matches the same runs of whitespace that readr's `read_table()` collapses automatically.

## read_table() examples

**Start with the simplest case: clean, single-spaced columns.** Wrapping literal text in `I()` lets every example run without a file on disk.

```r title="Read a basic whitespace file"
library(readr)

read_table(I("x y z
1 2 3
4 5 6"))
#> # A tibble: 2 x 3
#>       x     y     z
#>   <dbl> <dbl> <dbl>
#> 1     1     2     3
#> 2     4     5     6
```

The first line became the header and both data rows parsed as `dbl` (double). No delimiter argument was needed.

**Ragged spacing is where read_table() earns its place.** Columns padded to different widths still parse, because every run of spaces counts as one separator.

```r title="Read columns with ragged spacing"
read_table(I("name    age   city
Alice    30   Boston
Bob       7   Denver"))
#> # A tibble: 2 x 3
#>   name    age city
#>   <chr> <dbl> <chr>
#> 1 Alice    30 Boston
#> 2 Bob       7 Denver
```

The uneven gaps between `name`, `age`, and `city` made no difference. `read_delim()` would have produced empty columns from those extra spaces.

**Read a real file from disk.** Write a numeric data frame with base `write.table()`, turning off row names and quotes so the output is plain whitespace.

```r title="Write and read a whitespace file"
df <- data.frame(id = 1:3, score = c(88, 92, 75))
write.table(df, "scores.txt", row.names = FALSE, quote = FALSE)

read_table("scores.txt")
#> # A tibble: 3 x 2
#>      id score
#>   <dbl> <dbl>
#> 1     1    88
#> 2     2    92
#> 3     3    75
```

**Supply your own column names when the file has no header.** Pass a character vector to `col_names`, and read_table() treats the first line as data.

```r title="Read a headerless file with custom names"
read_table(I("10 20 30
40 50 60"), col_names = c("a", "b", "c"))
#> # A tibble: 2 x 3
#>       a     b     c
#>   <dbl> <dbl> <dbl>
#> 1    10    20    30
#> 2    40    50    60
```

**Declare your own missing-value markers.** Real exports use codes like `.` or `n/a`. List them in `na` so they parse as `NA` instead of forcing the column to text.

```r title="Handle custom missing values"
read_table(I("id value
1 100
2 .
3 NA"), na = c("NA", "."))
#> # A tibble: 3 x 2
#>      id value
#>   <dbl> <dbl>
#> 1     1   100
#> 2     2    NA
#> 3     3    NA
```

[TIP]
**Set col_types once you know the schema.** Passing `col_types` skips the guessing scan, silences the column-spec message, and locks types across files. Use `cols(id = col_integer(), .default = col_double())` to fix one column and default the rest.

## read_table() vs read_delim() and read_fwf()

**The three readers differ only in how they find column boundaries.** Picking the right one is a question about your file's separator.

| Function | Separator | When to use |
|----------|-----------|-------------|
| `read_table()` | any run of whitespace | space-aligned columns, ragged padding |
| `read_delim()` | one fixed character | pipe, semicolon, or custom single-char files |
| `read_csv()` | comma, fixed | standard comma-separated files |
| `read_tsv()` | tab, fixed | tab-separated files |
| `read_fwf()` | fixed column positions | no separator; fields defined by character width |

Use `read_table()` when fields are separated by gaps of varying width. Use `read_delim()` when exactly one character sits between fields. Use `read_fwf()` when there is no separator at all and columns are defined purely by position.

[KEY INSIGHT]
**The delimiter is the gap, not a character.** read_table() does not look for a specific symbol. It looks for the transition from non-space to space, which is why padded and single-spaced files parse the same way. Once that clicks, choosing between read_table() and read_delim() is obvious.

## Common pitfalls

**Text fields that contain spaces break the column count.** Because every run of whitespace is a separator, a value like `New York` splits into two fields and shifts the rest of the row.

```r title="Pitfall: internal spaces split a column"
# read_table(I("city pop\nNew York 8\n"))   # 'New' and 'York' become two columns
read_table(I("city pop
Boston 700
Denver 715"))
#> # A tibble: 2 x 2
#>   city     pop
#>   <chr>  <dbl>
#> 1 Boston   700
#> 2 Denver   715
```

[WARNING]
**read_table() cannot keep spaces inside a field.** If a column holds multi-word text such as full names or city names, whitespace splitting will corrupt every following column. For those files the data is genuinely fixed-width, so use `read_fwf()` with explicit column positions.

**Passing literal text without `I()`.** A bare string is treated as a file path. Wrap inline data in `I()` so read_table() parses it as content.

```r title="Pitfall: literal text needs I()"
# read_table("x y\n1 2")    # error: file does not exist
read_table(I("x y\n1 2"))   # correct: I() marks it as data
#> # A tibble: 1 x 2
#>       x     y
#>   <dbl> <dbl>
#> 1     1     2
```

**Trusting guessed types on messy columns.** read_table() infers each type from the leading rows. A numeric column with stray text far down reads as character. Set `col_types` explicitly when a column matters.

## Try it yourself

**Try it:** Write the data frame below to a whitespace file, read it back with read_table(), then sum the `sales` column. Save the total to `ex_total`.

```r title="Your turn: read a whitespace file"
# Try it: write a whitespace file, read it, sum a column
df <- data.frame(week = 1:4, sales = c(120, 95, 140, 110))
write.table(df, "sales.txt", row.names = FALSE, quote = FALSE)
ex_data <- # your code here

ex_total <- # your code here
ex_total
#> Expected: 465
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
df <- data.frame(week = 1:4, sales = c(120, 95, 140, 110))
write.table(df, "sales.txt", row.names = FALSE, quote = FALSE)
ex_data <- read_table("sales.txt")
ex_total <- sum(ex_data$sales)
ex_total
#> [1] 465
```

**Explanation:** `write.table()` with `row.names = FALSE` and `quote = FALSE` produces plain whitespace-separated text. read_table() reads it back into a tibble, and `sum()` over the `sales` column adds the four weekly figures.

</details>

## Related readr functions

**read_table() is one reader in the readr import family.** Reach for the sibling that matches your file's separator.

- `read_delim()`: read files with one fixed single-character delimiter.
- `read_csv()`: read comma-separated files.
- `read_tsv()`: read tab-separated files.
- `read_fwf()`: read fixed-width files where columns are defined by position.
- `read_lines()`: read a file as a raw character vector when no parsing is wanted.

For the full argument reference, see the [readr read_table documentation](https://readr.tidyverse.org/reference/read_table.html) on tidyverse.org.

## FAQ

**What is the difference between read_table() and read_delim() in R?**

`read_table()` separates columns on any run of whitespace, so single spaces and aligned padding both work. `read_delim()` separates on exactly one character that you set with the `delim` argument. Use `read_table()` for space-aligned text and console output. Use `read_delim()` when a single specific character such as a pipe or semicolon sits between fields.

**How do I read a space-separated file in R?**

Call `read_table("data.txt")`. The function splits each line on whitespace, guesses column types from the first rows, and returns a tibble. If the file has no header, add `col_names = FALSE` or pass a character vector of names. To read inline text instead of a file, wrap the string in `I()`.

**What happened to read_table2() in readr?**

`read_table2()` was the lenient whitespace reader in older readr versions. Since readr 2.0, its behavior was merged into `read_table()`, and `read_table2()` is deprecated. Modern code should call `read_table()` directly. If you see `read_table2()` in an old script, replace it with `read_table()` and the result is the same.

**Why does read_table() split my text column into two?**

read_table() treats every run of whitespace as a separator, so a value containing an internal space, such as `New York`, becomes two fields. That shifts every column after it. If your data has multi-word text fields, the file is really fixed-width. Use `read_fwf()` with explicit column positions so the spaces inside fields are preserved.

**Can read_table() read a file from a URL?**

Yes. Pass an `http://` or `https://` URL as the `file` argument and read_table() downloads and parses it in one step. For a file you will reuse, download it once with `download.file()` and read the local copy to avoid repeated network requests.
</content>
</invoke>
