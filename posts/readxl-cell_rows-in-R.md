---
title: "readxl cell_rows() in R: Read Specific Rows From Excel"
slug: readxl-cell_rows-in-R
description: "Use readxl cell_rows() in R to read a specific range of rows from an Excel sheet. Covers the syntax, four worked examples, common pitfalls, and an FAQ."
keywords: "readxl cell_rows, cell_rows function R, readxl cell_rows examples, read specific rows Excel R, read_excel range rows, import Excel rows R, readxl read row range"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: readr--readxl--haven
fr_parent: Importing-Data-in-R.html
auto_link_terms: "cell_rows()|readxl cell_rows|readxl::cell_rows()|read specific rows from Excel|read a range of rows"
auto_link_case_sensitive: true
target_keyword: "readxl cell_rows"
sibling_block_enabled: true
difficulty: Beginner
---

# readxl cell_rows() in R: Read Specific Rows From Excel

<p class="lead">The readxl cell_rows() function limits read_excel() to a chosen band of rows in an Excel sheet, so you import only the rows you need and skip metadata or footer junk.</p>

[QUICK ANSWER]
cell_rows(c(1, 10))                              # rows 1 through 10
cell_rows(1:10)                                  # same band, integer sequence
cell_rows(c(NA, 10))                             # from the top down to row 10
cell_rows(c(5, NA))                              # from row 5 to the last row
read_excel(path, range = cell_rows(c(5, 15)))    # use it inside read_excel
read_excel(path, range = cell_rows(c(5, 15)), col_names = FALSE)  # no header row

[DECISION TREE: Is cell_rows() the right tool?]
- limit reading to a row band: cell_rows(c(5, 15))
- limit to a column band instead: cell_cols(c(1, 4))
- limit both rows and columns: cell_limits(c(2, 1), c(10, 4))
- skip junk rows above the header: read_excel(path, skip = 4)
- read only the first N data rows: read_excel(path, n_max = 100)
- use a literal Excel address: read_excel(path, range = "A5:F15")

## What cell_rows() does

**cell_rows() is a row-range selector for Excel imports.** You pass it a vector of row numbers, and it builds a range object that tells `read_excel()` to read those rows and leave every column unbounded. It comes from the cellranger package and is re-exported by readxl, so loading readxl is enough to use it.

The function reads the smallest and largest number in the vector and treats them as the first and last row of a contiguous band. It never selects individual scattered rows. Its job is to draw a horizontal slice through the sheet so that surrounding text, titles, or totals never reach your tibble.

## Syntax and arguments

**cell_rows() takes one argument and returns a range object, not data.** You hand the result to the `range` argument of `read_excel()`, which then does the actual import.

```r title="The cell_rows signature"
cell_rows(x)
# x: a numeric vector of row numbers.
#    cell_rows uses only min(x) and max(x).
#    Use NA on either side to leave that edge open.

read_excel(path, sheet = NULL, range = cell_rows(...), col_names = TRUE)
```

The three useful shapes of `x` are a two-element vector like `c(5, 15)`, an integer sequence like `5:15`, and a half-open form like `c(NA, 10)` or `c(5, NA)`. The first row inside the band becomes the column header unless you set `col_names = FALSE`.

[NOTE]
**cell_rows() pairs with its siblings.** Use `cell_cols()` to bound columns, `cell_limits()` to bound rows and columns together, and `anchored()` to read a fixed-size block from a starting cell. All four produce the same kind of range object.

## cell_rows() examples

**Every example below uses workbooks that ship with readxl.** So you can run them without your own file. `readxl_example()` returns the path to a bundled sheet.

### Example 1: Read a known row band

**The classic use case is a sheet with junk above and below the data.** The `deaths.xlsx` workbook keeps four title rows on top, a header in row 5, ten data rows, and a footer note at the bottom. `cell_rows(5:15)` grabs the header plus the ten rows and nothing else.

```r title="Read a clean row band"
library(readxl)

deaths <- readxl_example("deaths.xlsx")
read_excel(deaths, range = cell_rows(5:15))
#> # A tibble: 10 x 6
#>    Name          Profession   Age `Has kids` `Date of birth`     `Date of death`
#>    <chr>         <chr>      <dbl> <lgl>      <dttm>              <dttm>
#>  1 David Bowie   musician      69 TRUE       1947-01-08 00:00:00 2016-01-10 ...
#>  2 Carrie Fisher actor         60 TRUE       1956-10-21 00:00:00 2016-12-27 ...
#>  # ... 8 more rows
```

The footer note never appears because row 15 is the lower edge of the band.

### Example 2: Read rows from a named sheet

**cell_rows() works alongside the `sheet` argument, not instead of it.** A literal range string like `"iris!A1:E11"` carries the sheet name with it, but `cell_rows()` does not, so pass `sheet` separately when you do not want the first sheet.

```r title="Combine cell_rows with a sheet"
datasets <- readxl_example("datasets.xlsx")
read_excel(datasets, sheet = "iris", range = cell_rows(1:11))
#> # A tibble: 10 x 5
#>    Sepal.Length Sepal.Width Petal.Length Petal.Width Species
#>           <dbl>       <dbl>        <dbl>       <dbl> <chr>
#>  1          5.1         3.5          1.4         0.2 setosa
#>  2          4.9         3            1.4         0.2 setosa
#>  # ... 8 more rows
```

Rows 1 through 11 give the header plus the first ten iris measurements.

### Example 3: Drop the header with col_names = FALSE

**When your band starts below the real header, tell read_excel() not to treat row one as names.** Otherwise the first data row is consumed as column labels and you lose a record.

```r title="Read a band without a header"
read_excel(datasets, sheet = "iris", range = cell_rows(c(2, 6)),
           col_names = FALSE)
#> # A tibble: 5 x 5
#>    ...1  ...2  ...3  ...4 ...5
#>   <dbl> <dbl> <dbl> <dbl> <chr>
#> 1   5.1   3.5   1.4   0.2 setosa
#> 2   4.9   3     1.4   0.2 setosa
#> # ... 3 more rows
```

All five rows survive as data, and readxl assigns placeholder names `...1` to `...5`.

### Example 4: Sequence form and two-element form

**`cell_rows(5:15)` and `cell_rows(c(5, 15))` are identical because only the minimum and maximum matter.** The function never honors gaps inside the vector.

```r title="Sequence and pair are equal"
identical(cell_rows(5:15), cell_rows(c(5, 15)))
#> [1] TRUE

# c(3, 7, 40) still reads rows 3 through 40
cell_rows(c(3, 7, 40))
#> <cell_limits (3, 1) x (40, NA)>
```

Use whichever form reads more clearly; the result is the same range object.

## cell_rows() vs skip, n_max and string ranges

**cell_rows() is one of four ways to limit which rows reach your tibble.** Each fits a different situation, summarized below.

| Approach | What it selects | Header behavior | Use when |
|---|---|---|---|
| `range = cell_rows(c(5, 15))` | a row band, all columns | first row of band = names | data sits in known rows |
| `skip = 4` | drops 4 rows, reads the rest | next row = names | junk sits only above the data |
| `n_max = 100` | first 100 data rows | header read normally | you want a quick sample |
| `range = "A5:F15"` | exact rows and columns | first row of range = names | you know the Excel address |

**The decision rule is simple.** Reach for `cell_rows()` when both the start and end of the data are fixed and known. Use `skip` when only the top is messy, `n_max` when you just want a preview, and a string range when junk surrounds the data on the sides as well.

## Common pitfalls

**The first row of the band becomes the header by default.** If you write `cell_rows(c(6, 15))` for the `deaths.xlsx` sheet, row 6 (the first death) turns into column names and you silently lose one record. Either include the real header row in the band or set `col_names = FALSE`.

[WARNING]
**range overrides skip and n_max without a warning.** When you pass `range`, readxl ignores `skip` and `n_max` entirely. Combining them looks reasonable but quietly does nothing, so set the row window in exactly one place.

**cell_rows() cannot pick scattered rows.** A vector like `c(1, 5, 100)` does not read three rows; it reads the whole band from 1 to 100. cell_rows() is a slice, not a picker. To keep specific non-adjacent rows, import the band and then filter with `dplyr::slice()` or a logical condition.

[NOTE]
**Coming from Python pandas?** The cell_rows() equivalent is the `skiprows` and `nrows` pair: `pd.read_excel(path, skiprows=4, nrows=11)` reads a band starting after four rows.

## Try it yourself

**Try it:** Read rows 5 through 10 of the first sheet of `deaths.xlsx`. Row 5 is the header, so you should get five data rows. Save the result to `ex_deaths`.

```r title="Your turn: read a row band"
# Try it: read rows 5 to 10 of deaths.xlsx
library(readxl)
deaths <- readxl_example("deaths.xlsx")

ex_deaths <- # your code here

nrow(ex_deaths)
#> Expected: 5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
library(readxl)
deaths <- readxl_example("deaths.xlsx")
ex_deaths <- read_excel(deaths, range = cell_rows(5:10))
nrow(ex_deaths)
#> [1] 5
```

**Explanation:** The band 5:10 spans six rows. Row 5 becomes the header, leaving five data rows in the tibble.

</details>

## Related readxl functions

**cell_rows() is one member of a small family of range helpers.** These functions all build range objects for the `range` argument of `read_excel()`.

- `cell_cols()`: bounds the column range and leaves rows open.
- `cell_limits()`: bounds rows and columns at once for a rectangular block.
- `anchored()`: reads a fixed-size block starting from one anchor cell.
- `read_excel()`: the import function that consumes the range object.
- `excel_sheets()`: lists sheet names so you know which sheet to target.

[TIP]
**Inspect the sheet before you slice it.** Run `read_excel(path)` once with no range to see where the header and data really start, then write the exact `cell_rows()` band. This avoids guessing row numbers.

## FAQ

**Can cell_rows() read non-consecutive rows?**

No. cell_rows() looks only at the smallest and largest value you give it and reads every row in between. Passing `c(1, 5, 100)` reads rows 1 through 100, not just those three. To keep scattered rows, import the full band first, then subset the resulting tibble with `dplyr::slice()` or a logical filter on a column.

**What is the difference between cell_rows() and skip in readxl?**

`skip` drops a fixed number of rows from the top and reads everything below. cell_rows() defines both a start and an end, so it also cuts off footer rows. Use `skip` when the mess is only above the data, and cell_rows() when both edges of the data block are known and fixed.

**Does cell_rows() keep the header row?**

The first row of the band is treated as the column header by default. If your band starts on the real header row, the names are correct. If it starts on a data row, set `col_names = FALSE` so read_excel() generates placeholder names and keeps every row as data.

**Can I use cell_rows() with read_xlsx() and read_xls()?**

Yes. `read_xlsx()` and `read_xls()` accept the same `range` argument as `read_excel()`, so `cell_rows()` works with all three. `read_excel()` simply detects the file type for you, so most code can call it and pass the cell_rows() range directly.

**How do I read a row band from a specific sheet?**

cell_rows() does not carry a sheet name, so pass `sheet` as a separate argument: `read_excel(path, sheet = "iris", range = cell_rows(1:11))`. The `sheet` argument accepts a name or a position number, and the cell_rows() band then applies inside that chosen sheet.

For broader coverage of spreadsheet and file import, see the [official readxl reference](https://readxl.tidyverse.org/reference/cell-specification.html).
