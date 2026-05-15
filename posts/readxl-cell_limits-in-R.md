---
title: "readxl cell_limits() in R: Read a Precise Cell Range"
slug: readxl-cell_limits-in-R
description: "readxl cell_limits() in R defines a rectangular cell range by upper-left and lower-right corners, so read_excel() reads only the block of cells you need."
keywords: "readxl cell_limits, cell_limits function R, readxl cell_limits examples, R read excel cell range, readxl read range of cells, cell_limits readxl range"
mathjax: false
webr: true
date: "2026-05-16"
post_type: PSEO
category_id: function-deep
subcategory_id: readr--readxl--haven
fr_parent: Importing-Data-in-R.html
auto_link_terms: "cell_limits()|readxl cell_limits|readxl::cell_limits()|cell_limits object|read a cell range"
auto_link_case_sensitive: true
target_keyword: "readxl cell_limits"
sibling_block_enabled: true
difficulty: Beginner
---

# readxl cell_limits() in R: Read a Precise Cell Range

<p class="lead">readxl cell_limits() builds a rectangular cell range from two corner coordinates, an upper-left cell and a lower-right cell, so read_excel() imports exactly the block of cells you want and skips the metadata around it.</p>

[QUICK ANSWER]
cell_limits(c(5,1), c(15,6))                 # rows 5-15, cols 1-6
cell_limits(c(5,1), c(15,NA))                # rows 5-15, all columns
cell_limits(c(NA,2), c(NA,4))                # all rows, cols 2-4
cell_limits(c(5,1), c(15,6), sheet = "arts") # pin range to a sheet
read_excel(path, range = cell_limits(c(5,1), c(15,6)))  # use it
cell_limits()                                # whole sheet (all NA)

[DECISION TREE: Is cell_limits() the right tool?]
- read a row-and-column rectangle: cell_limits(c(5,1), c(15,6))
- limit rows only, all columns: cell_rows(5:15)
- limit columns only, all rows: cell_cols(2:6)
- use Excel A1 notation: read_excel(path, range = "arts!B5:F15")
- skip only the top N rows: read_excel(path, skip = 4)
- read an entire named sheet: read_excel(path, sheet = "arts")

## What cell_limits() does

**cell_limits() describes a rectangle, not data.** It returns a small `cell_limits` object that stores two corners: the upper-left cell and the lower-right cell, each written as a `c(row, column)` pair. You hand that object to the `range` argument of `read_excel()`, and readxl reads only the cells inside the rectangle. This is the precise way to skip title rows, sidebars, or footer notes that surround a real table in a spreadsheet.

The function ships with readxl, re-exported from the cellranger package, so loading readxl is enough. Every coordinate is one-indexed, and both corners are inclusive. The range `cell_limits(c(5, 1), c(15, 6))` reads rows 5 through 15 and columns 1 through 6, sixty-six cells in total.

[KEY INSIGHT]
**A cell_limits object is a plan, not a result.** Creating it reads nothing from disk. Only when you pass it to read_excel() through `range` does readxl open the file and pull the rectangle. That separation lets you build, name, and reuse a range definition across several reads.

## cell_limits() syntax and arguments

**cell_limits() takes three arguments, all optional.** The signature is `cell_limits(ul, lr, sheet)`, and each argument controls one part of the rectangle.

| Argument | Default | Description |
|---|---|---|
| `ul` | `c(NA, NA)` | Upper-left corner as `c(row, column)`. NA means unbounded. |
| `lr` | `c(NA, NA)` | Lower-right corner as `c(row, column)`. NA means unbounded. |
| `sheet` | `NA` | Optional worksheet name to attach the range to. |

An NA in any position means "no limit in that direction". The range `cell_limits(c(5, 1), c(NA, 6))` starts at row 5 and reads every row below it while holding columns fixed at 1 through 6. Calling `cell_limits()` with no arguments produces an all-NA object, which is equivalent to reading the whole sheet.

```r title="Build and print a cell_limits object"
library(readxl)

# Define a rectangle and inspect it
my_range <- cell_limits(ul = c(5, 1), lr = c(15, 6))
my_range
#> <cell_limits (5, 1) x (15, 6)>
```

## Read a cell range: four examples

**Every example below reads `deaths.xlsx`, a sample file bundled with readxl.** Each sheet carries four metadata rows on top, a header on row 5, ten data rows, and footer notes below, a realistic layout for testing ranges.

### Read a fixed rectangle

**Pass both corners to grab an exact block.** Here the header sits on row 5 and the data ends on row 15, so the range starts at `c(5, 1)` and stops at `c(15, 6)`.

```r title="Read a fixed cell rectangle"
deaths <- readxl_example("deaths.xlsx")

read_excel(deaths, range = cell_limits(c(5, 1), c(15, 6)))
#> # A tibble: 10 x 6
#>   Name          Profession   Age `Has kids` `Date of birth`     `Date of death`
#>   <chr>         <chr>      <dbl> <lgl>      <dttm>              <dttm>
#> 1 David Bowie   musician      69 TRUE       1947-01-08 00:00:00 2016-01-10 00:00:00
#> 2 Carrie Fisher actor         60 TRUE       1956-10-21 00:00:00 2016-12-27 00:00:00
#> 3 Chyna         wrestler      45 FALSE      1969-12-27 00:00:00 2016-04-20 00:00:00
#> # i 7 more rows
```

The four metadata rows above the header and the footer notes below row 15 are never touched, so the column types are clean.

### Leave columns unbounded

**Use NA when you know the rows but not the column count.** Setting the lower-right column to NA tells readxl to read every column that has data.

```r title="Read with unbounded columns"
read_excel(deaths, range = cell_limits(c(5, 1), c(15, NA)))
#> # A tibble: 10 x 6
#>   Name          Profession   Age `Has kids` `Date of birth`     `Date of death`
#>   <chr>         <chr>      <dbl> <lgl>      <dttm>              <dttm>
#> 1 David Bowie   musician      69 TRUE       1947-01-08 00:00:00 2016-01-10 00:00:00
#> # i 9 more rows
```

[WARNING]
**An NA row bound keeps reading into footer junk.** `cell_limits(c(5, 1), c(NA, 6))` reads past row 15 and pulls the footer notes into your table as stray rows. When a sheet has content below the data, set an explicit lower-right row instead of NA.

### Pin the range to a sheet

**The sheet argument removes any ambiguity about which worksheet to read.** Without it, readxl uses the first sheet; with it, the same range targets a named sheet.

```r title="Pin the range to a worksheet"
read_excel(deaths, range = cell_limits(c(5, 1), c(15, 6), sheet = "other"))
#> # A tibble: 10 x 6
#>   Name       Profession  Age `Has kids` `Date of birth`     `Date of death`
#>   <chr>      <chr>     <dbl> <lgl>      <dttm>              <dttm>
#> 1 Vera Rubin scientist    88 TRUE       1928-07-23 00:00:00 2016-12-25 00:00:00
#> # i 9 more rows
```

### Reuse a stored range

**Store the object once and pass it to several reads.** Because a `cell_limits` object is independent of any file, the same definition works across multiple spreadsheets with the same layout.

```r title="Reuse a stored cell range"
table_range <- cell_limits(c(5, 1), c(15, 6))

arts  <- read_excel(deaths, range = table_range)
nrow(arts)
#> [1] 10
```

## cell_limits() vs cell_rows() vs cell_cols()

**Three helpers cover three shapes of selection.** `cell_limits()` constrains both dimensions at once, while `cell_rows()` and `cell_cols()` each trim a single dimension and leave the other unbounded.

| Helper | Limits | Best for |
|---|---|---|
| `cell_limits()` | Rows and columns together | A precise rectangle with both corners known |
| `cell_rows()` | Rows only, all columns | Keeping every column but trimming top and bottom rows |
| `cell_cols()` | Columns only, all rows | Keeping every row but selecting a column span |
| A1 string | Rows and columns | Quick ranges in Excel notation, such as `"arts!B5:F15"` |

Use `cell_limits()` when both the row span and the column span matter. Drop to `cell_rows()` or `cell_cols()` when only one dimension needs trimming. Reach for an A1 string when you already know the range in Excel terms and want the shortest possible code.

[NOTE]
**Coming from Python pandas?** There is no single `cell_limits` equivalent. You combine arguments instead: `pd.read_excel(path, header=4, usecols="A:F", nrows=10)` reproduces `cell_limits(c(5, 1), c(15, 6))` by pairing a header offset, a column span, and a row count.

## Common pitfalls

**Most cell_limits() mistakes come from coordinate order or argument type.** Three problems account for nearly every failed range.

- **Corner vectors are `c(row, column)`, not `c(column, row)`.** Swapping the order silently reads the wrong block, or errors if a row index exceeds the sheet size.
- **An NA in the lower-right row reads to the bottom of the sheet.** That includes any footer notes. Bound the row explicitly when content sits below your table.
- **The range argument needs a cell_limits object or an A1 string.** A bare numeric vector is rejected.

```r title="Fix the bare vector error"
# A plain vector is not a valid range
read_excel(deaths, range = c(5, 1))
#> Error: `range` must be a string, a `cell_limits` object, or NA

# Fix: wrap the corners in cell_limits()
read_excel(deaths, range = cell_limits(c(5, 1), c(15, 6)))
```

## Try it yourself

**Try it:** Read only rows 5 through 15 and columns 1 through 6 of the `deaths.xlsx` example file. Save the result to `ex_deaths`.

```r title="Your turn: read a cell range"
# Try it: read rows 5-15, columns 1-6
ex_deaths <- # your code here

dim(ex_deaths)
#> Expected: 10 6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_deaths <- read_excel(readxl_example("deaths.xlsx"),
                        range = cell_limits(c(5, 1), c(15, 6)))
dim(ex_deaths)
#> [1] 10  6
```

**Explanation:** The upper-left corner `c(5, 1)` starts at the header on row 5, and the lower-right corner `c(15, 6)` stops at the last data row and the sixth column. Both corners are inclusive, so the result has exactly 10 rows and 6 columns.

</details>

## Related readxl functions

These functions pair naturally with `cell_limits()` when importing spreadsheet data:

- [read_excel()](readxl-read_excel-in-R.html) reads xls and xlsx files; `cell_limits()` feeds its `range` argument.
- [cell_rows()](readxl-cell_rows-in-R.html) limits a read by row numbers only, keeping every column.
- [cell_cols()](readxl-cell_cols-in-R.html) limits a read by column numbers or letters only, keeping every row.
- [excel_sheets()](readxl-excel_sheets-in-R.html) lists sheet names so you can choose a sheet before setting a range.
- `anchored()` defines a range from an upper-left anchor plus a width and height.

See the official [readxl cell-specification reference](https://readxl.tidyverse.org/reference/cell-specification.html) for the full family of range helpers.

## FAQ

**What does cell_limits() do in readxl?**

`cell_limits()` creates a `cell_limits` object that describes a rectangular block of cells by its upper-left and lower-right corners. Each corner is a `c(row, column)` pair. The object stores nothing from the file itself; it is a specification. You pass it to the `range` argument of `read_excel()`, and readxl then reads only the cells inside that rectangle, ignoring the rows and columns around it.

**What is the difference between cell_limits(), cell_rows(), and cell_cols()?**

All three set a reading range, but they constrain different dimensions. `cell_limits()` fixes both rows and columns at once using two corner coordinates. `cell_rows()` limits only the rows and reads every column. `cell_cols()` limits only the columns and reads every row. Use `cell_limits()` when you need a precise rectangle, and the single-dimension helpers when only the rows or only the columns need trimming.

**How do I read an open-ended range with cell_limits()?**

Put `NA` in the position you want to leave unbounded. For example, `cell_limits(c(5, 1), c(15, NA))` fixes rows 5 to 15 but reads every column with data. Be careful with an unbounded lower-right row: `cell_limits(c(5, 1), c(NA, 6))` reads to the bottom of the sheet and can pull footer notes into the table. Set an explicit row bound when content sits below your data.

**Why does range = c(5, 1) throw an error?**

The `range` argument of `read_excel()` accepts a `cell_limits` object, an A1-notation string such as `"B5:F15"`, or `NA`. A bare numeric vector like `c(5, 1)` is none of those, so readxl rejects it. Wrap your corner coordinates in `cell_limits()`: write `range = cell_limits(c(5, 1), c(15, 6))` instead of passing the vector directly.
</content>
</invoke>
