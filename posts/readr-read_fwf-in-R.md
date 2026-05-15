---
title: "readr read_fwf() in R: Read Fixed-Width Files"
slug: readr-read_fwf-in-R
description: "Learn readr read_fwf() in R to read fixed-width files into a tibble. Covers fwf_widths, fwf_positions, fwf_empty, fwf_cols, column types, and pitfalls."
keywords: "readr read_fwf, read_fwf function R, readr read_fwf examples, read fixed width file R, R fixed width data, fwf_widths fwf_positions, read_fwf vs read_table"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: readr--readxl--haven
fr_parent: Importing-Data-in-R.html
auto_link_terms: "read_fwf()|readr read_fwf|readr::read_fwf()|read fixed-width file in R|fixed-width file"
auto_link_case_sensitive: true
target_keyword: "readr read_fwf"
sibling_block_enabled: true
difficulty: Beginner
---

# readr read_fwf() in R: Read Fixed-Width Files

<p class="lead">The readr read_fwf() function reads a fixed-width file into a tibble, where each column is fixed by character position instead of a delimiter. You describe the layout once with a helper like fwf_widths() and read_fwf() parses every row to match.</p>

[QUICK ANSWER]
read_fwf("data.txt", fwf_empty("data.txt"))                  # guess column edges
read_fwf("data.txt", fwf_widths(c(3, 5, 8)))                 # set field widths
read_fwf("data.txt", fwf_widths(c(3, 5), c("id", "name")))   # widths plus names
read_fwf("data.txt", fwf_positions(c(1, 4), c(3, 11)))       # start and end columns
read_fwf("data.txt", fwf_cols(id = 3, name = 8))             # named widths
read_fwf("data.txt", fwf_cols(id = c(1, 3), name = c(4, 11)))# named ranges
read_fwf("data.txt", fwf_widths(c(3, 5)), skip = 2)          # skip junk header lines

[DECISION TREE: Is read_fwf() the right tool?]
- columns aligned by character position: read_fwf("d.txt", fwf_empty("d.txt"))
- file has a comma separator: read_csv("data.csv")
- file uses a custom delimiter: read_delim("data.txt", delim = "|")
- whitespace-separated, ragged columns: read_table("data.txt")
- file is an Excel workbook: read_excel("data.xlsx")
- file is a SAS or SPSS export: read_sas() or read_sav()

## What read_fwf() does

**read_fwf() reads a fixed-width file into a tibble.** A fixed-width file has no separator between fields. Each column always starts and ends at the same character position on every line, so the layout itself defines the structure. You give read_fwf() a file path, a URL, or literal text, plus a column specification that names those positions.

The column specification comes from one of four helper functions: `fwf_empty()`, `fwf_widths()`, `fwf_positions()`, and `fwf_cols()`. They differ only in how you describe the layout. Once read_fwf() knows where each field sits, it slices every row, guesses each column type, and returns a tidy data frame.

## Syntax and key arguments

**The call always pairs a file with a column specification.** The `col_positions` argument is what makes read_fwf() different from the delimited readers; it carries the layout.

```r title="The read_fwf signature"
read_fwf(
  file,                  # path, URL, or I() literal text
  col_positions,         # a fwf_* helper describing the layout
  col_types = NULL,      # NULL guesses; cols() sets types explicitly
  col_select = NULL,     # columns to keep, tidyselect style
  na = c("", "NA"),      # strings to treat as missing
  skip = 0,              # number of lines to skip before the data
  n_max = Inf            # maximum number of data rows to read
)
```

The `skip`, `na`, and `col_types` arguments behave exactly as they do in `read_csv()`. The only new idea is `col_positions`, and the four `fwf_*` helpers below all produce a valid value for it.

[NOTE]
**Coming from Python pandas?** The equivalent of `read_fwf("data.txt", fwf_widths(c(3, 5)))` is `pandas.read_fwf("data.txt", widths=[3, 5])`. The pandas `colspecs` argument maps to readr's `fwf_positions()`.

## read_fwf() examples

**Start with a layout you know.** This file has three fields: a 7-character name, a 2-character age, and a 9-character city, with no separators. `fwf_widths()` takes those widths and the column names.

```r title="Read a fixed-width file with column widths"
library(readr)

fwf <- "Alice  30Boston   
Bob    25Denver   
Carla  41Portland "

read_fwf(I(fwf), fwf_widths(c(7, 2, 9), c("name", "age", "city")))
#> Rows: 3 Columns: 3
#> -- Column specification ------------------------
#> chr (2): name, city
#> dbl (1): age
#> # A tibble: 3 x 3
#>   name    age city
#>   <chr> <dbl> <chr>
#> 1 Alice    30 Boston
#> 2 Bob      25 Denver
#> 3 Carla    41 Portland
```

Wrapping the string in `I()` tells read_fwf() the value is data, not a file path. The widths `c(7, 2, 9)` cover columns 1 to 7, 8 to 9, and 10 to 18.

**Describe the same file with start and end positions.** `fwf_positions()` takes a vector of start columns and a vector of end columns. Both are 1-based and inclusive.

```r title="Read with explicit start and end positions"
read_fwf(I(fwf), fwf_positions(c(1, 8, 10), c(7, 9, 18),
                               c("name", "age", "city")))
#> # A tibble: 3 x 3
#>   name    age city
#>   <chr> <dbl> <chr>
#> 1 Alice    30 Boston
#> 2 Bob      25 Denver
#> 3 Carla    41 Portland
```

This is the natural choice when a data dictionary lists each field by its byte range, which is common in legacy mainframe and government extracts.

**Name the columns inline with fwf_cols().** Pass each column as `name = width`, and read_fwf() builds the positions for you. It is the most readable helper when widths and names belong together.

```r title="Name columns with fwf_cols()"
read_fwf(I(fwf), fwf_cols(name = 7, age = 2, city = 9))
#> # A tibble: 3 x 3
#>   name    age city
#>   <chr> <dbl> <chr>
#> 1 Alice    30 Boston
#> 2 Bob      25 Denver
#> 3 Carla    41 Portland
```

**Let readr guess the edges with fwf_empty().** When every column is separated by at least one all-space character, `fwf_empty()` finds the boundaries automatically. You only supply the column names.

```r title="Guess column edges automatically"
report <- "001  Alice    88
002  Bob      72
003  Carla    95"

read_fwf(I(report), fwf_empty(I(report), col_names = c("id", "name", "score")))
#> # A tibble: 3 x 3
#>      id name  score
#>   <dbl> <chr> <dbl>
#> 1     1 Alice    88
#> 2     2 Bob      72
#> 3     3 Carla    95
```

Notice the `id` column came back as `1, 2, 3`: the `"001"` text parsed as a number and dropped the leading zeros. The pitfalls section below shows how to keep them.

[TIP]
**Reach for fwf_cols() first.** It keeps names and widths in one place, so the spec is self-documenting and easy to edit. Fall back to `fwf_positions()` only when a data dictionary already lists byte ranges.

## Defining columns: the four fwf_ helpers

**Every read_fwf() call needs a column specification, and the helper you pick depends on what you know.** All four return the same kind of object, so they are interchangeable once built.

| Helper | You provide | Best when |
|--------|-------------|-----------|
| `fwf_empty()` | the file, plus column names | columns are separated by whitespace |
| `fwf_widths()` | a width for each field | you know how wide each column is |
| `fwf_positions()` | start and end of each field | a data dictionary lists byte ranges |
| `fwf_cols()` | named widths or named ranges | you want names and positions together |

Use `fwf_empty()` for a quick first look at a clean file. Switch to `fwf_widths()` or `fwf_cols()` once you have the real layout, because an explicit spec never guesses wrong and documents the format for the next reader.

[KEY INSIGHT]
**The layout is the schema.** A delimited file carries its own structure in the separator character. A fixed-width file does not, so the column specification you pass to read_fwf() is the only thing that defines the columns. Get the positions right and everything else follows.

## Common pitfalls

**Leading zeros disappear.** Identifier columns like `"001"` look numeric, so readr parses them as doubles and drops the zeros. Force the column to text with `col_types`.

```r title="Keep leading zeros as text"
ids <- "001 North
002 South"

read_fwf(I(ids), fwf_widths(c(3, 6), c("id", "region")),
         col_types = cols(id = col_character()))
#> # A tibble: 2 x 2
#>   id    region
#>   <chr> <chr>
#> 1 001   North
#> 2 002   South
```

**fwf_empty() merges touching columns.** `fwf_empty()` only finds a boundary where every row has a space. If two fields ever touch, such as a name running straight into an age, the guess merges them. Use `fwf_widths()` or `fwf_positions()` for files with no gaps.

**Off-by-one positions.** `fwf_positions()` uses inclusive 1-based columns. A field spanning the first seven characters is `start = 1, end = 7`, not `end = 8`. A single-column slip shifts every field after it, so the data still reads without an error but lands in the wrong column.

## Try it yourself

**Try it:** Use `fwf_widths()` to read the fixed-width string below into `ex_data`, with a 6-character `name` column and a 3-character `age` column. Then save the mean age to `ex_mean`.

```r title="Your turn: read a fixed-width string"
people <- "Mara   34
Devon  29
Priya  47"

ex_data <- # your code here

ex_mean <- # your code here
ex_mean
#> Expected: 36.66667
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
people <- "Mara   34
Devon  29
Priya  47"

ex_data <- read_fwf(I(people), fwf_widths(c(6, 3), c("name", "age")))
ex_mean <- mean(ex_data$age)
ex_mean
#> [1] 36.66667
```

**Explanation:** `fwf_widths(c(6, 3), ...)` slices columns 1 to 6 as `name` and 7 to 9 as `age`. read_fwf() guesses `age` as a double, so `mean()` works directly on `ex_data$age`.

</details>

## Related readr functions

**read_fwf() handles the one format with no separator; reach for a sibling when the file has one.**

- `read_table()`: read whitespace-separated files where columns are ragged.
- `read_delim()`: read files with any single-character delimiter.
- `read_csv()`: read standard comma-separated files.
- `fwf_cols()`: build a named column specification inline.
- `read_lines()`: read raw lines when no fixed layout fits.

For the full argument reference, see the [readr read_fwf documentation](https://readr.tidyverse.org/reference/read_fwf.html) on tidyverse.org.

## FAQ

**What is a fixed-width file?**

A fixed-width file is a plain text file where every field occupies the same character positions on every line, with no delimiter between fields. A name might always sit in columns 1 to 20 and an age in columns 21 to 23. The layout itself, not a separator, defines the columns, so you need a column specification to read it correctly.

**How do I read a fixed-width file in R?**

Call `read_fwf()` with the file and a column specification. If the columns are separated by whitespace, `read_fwf("data.txt", fwf_empty("data.txt"))` guesses the edges. When you know the widths, `read_fwf("data.txt", fwf_widths(c(10, 3), c("name", "age")))` is exact and self-documenting.

**What is the difference between read_fwf() and read_table()?**

`read_fwf()` reads files where columns sit at fixed character positions, even when fields touch with no gap. `read_table()` reads files where columns are separated by one or more spaces and may be ragged. Use `read_fwf()` when the layout is positional, and `read_table()` when whitespace reliably separates every field.

**How do I keep leading zeros when reading a fixed-width file?**

Pass `col_types` so the column reads as text. For example, `read_fwf(file, spec, col_types = cols(id = col_character()))` keeps an identifier like `"007"` intact. Without it, readr guesses the column is numeric and stores `7`, dropping the zeros.

**Can read_fwf() guess column positions automatically?**

Yes, through `fwf_empty()`, which scans the file for columns of all-space characters and treats them as boundaries. It works well on clean files with clear gaps. It fails when two fields touch, because there is no space to mark the edge, so an explicit `fwf_widths()` spec is safer for production code.
