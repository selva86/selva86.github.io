---
title: "readxl cell_cols() in R: Read Specific Excel Columns"
slug: readxl-cell_cols-in-R
description: "Use readxl cell_cols() in R to read a chosen range of columns from an Excel sheet. Covers the syntax, four worked examples, common pitfalls, and an FAQ."
keywords: "readxl cell_cols, cell_cols function R, readxl cell_cols examples, read specific columns Excel R, read_excel range columns, import Excel columns R, readxl select columns"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: readr--readxl--haven
fr_parent: Importing-Data-in-R.html
auto_link_terms: "cell_cols()|readxl cell_cols|readxl::cell_cols()|read specific columns from Excel|read a range of columns"
auto_link_case_sensitive: true
target_keyword: "readxl cell_cols"
sibling_block_enabled: true
difficulty: Beginner
---

# readxl cell_cols() in R: Read Specific Excel Columns

<p class="lead">The readxl cell_cols() function limits read_excel() to a chosen range of columns in an Excel sheet, so you import only the columns you need and leave the rest of the sheet behind.</p>

[QUICK ANSWER]
cell_cols(2:4)                                   # columns 2 through 4
cell_cols(c(2, 4))                               # same band, two-element form
cell_cols(c("B", "D"))                           # by Excel column letters
cell_cols(c(NA, 4))                              # from column 1 down to 4
cell_cols(c(3, NA))                              # from column 3 to the last
read_excel(path, range = cell_cols(c(2, 4)))     # use it inside read_excel
read_excel(path, range = cell_cols(2:4), col_names = FALSE)  # no header row

[DECISION TREE: Is cell_cols() the right tool?]
- limit reading to a column band: cell_cols(c(2, 4))
- limit to a row band instead: cell_rows(c(5, 15))
- limit both rows and columns: cell_limits(c(2, 1), c(10, 4))
- drop a few columns after import: select(df, -bad_col)
- read a fixed-size block from a cell: anchored("B3", dim = c(10, 4))
- use a literal Excel address: read_excel(path, range = "A1:D20")

## What cell_cols() does

**cell_cols() is a column-range selector for Excel imports.** You pass it a vector of column numbers or letters, and it builds a range object that tells `read_excel()` to read those columns and leave every row unbounded. It comes from the cellranger package and is re-exported by readxl, so loading readxl is enough to use it.

The function reads the smallest and largest value in the vector and treats them as the first and last column of a contiguous band. It never selects scattered columns. Its job is to draw a vertical slice through the sheet so that unrelated columns to the left or right never reach your tibble.

[KEY INSIGHT]
**cell_cols() bounds columns and nothing else.** Every row of the sheet is still read, top to bottom. If you need to cut rows as well, that is a job for `cell_rows()` or `cell_limits()`, not cell_cols().

## Syntax and arguments

**cell_cols() takes one argument and returns a range object, not data.** You hand the result to the `range` argument of `read_excel()`, which then performs the actual import.

```r title="The cell_cols signature"
cell_cols(x)
# x: a vector naming the column(s) to read.
#    cell_cols uses only min(x) and max(x).
#    Numeric form:  cell_cols(2:4)
#    Letter form:   cell_cols(c("B", "D"))
#    Open-ended:    cell_cols(c(NA, 4)) or cell_cols(c(3, NA))

read_excel(path, sheet = NULL, range = cell_cols(...), col_names = TRUE)
```

The useful shapes of `x` are a two-element numeric vector like `c(2, 4)`, an integer sequence like `2:4`, a pair of column letters like `c("B", "D")`, and a half-open form like `c(NA, 4)` or `c(3, NA)`. The first row of the sheet still becomes the column header unless you set `col_names = FALSE`.

[NOTE]
**cell_cols() pairs with its siblings.** Use `cell_rows()` to bound rows, `cell_limits()` to bound rows and columns together, and `anchored()` to read a fixed-size block from a starting cell. All four produce the same kind of range object.

## cell_cols() examples

**Every example below uses a workbook that ships with readxl.** So you can run them without your own file. `readxl_example()` returns the path to a bundled sheet, and the `iris` sheet inside `datasets.xlsx` has five clean columns starting at cell A1.

### Example 1: Read the first few columns

**The simplest use is keeping the leftmost columns and dropping the rest.** The iris sheet has five columns; `cell_cols(1:3)` reads the first three and ignores Petal.Width and Species.

```r title="Read the first three columns"
library(readxl)

datasets <- readxl_example("datasets.xlsx")
read_excel(datasets, sheet = "iris", range = cell_cols(1:3))
#> # A tibble: 150 x 3
#>    Sepal.Length Sepal.Width Petal.Length
#>           <dbl>       <dbl>        <dbl>
#>  1          5.1         3.5          1.4
#>  2          4.9         3            1.4
#>  3          4.7         3.2          1.3
#>  # ... 147 more rows
```

All 150 rows are kept, but the tibble is now three columns wide instead of five.

### Example 2: Select columns by Excel letter

**You can name columns the way Excel labels them, with letters.** Pass the letters as a two-element character vector and cell_cols() converts them to numbers for you.

```r title="Select columns by Excel letter"
read_excel(datasets, sheet = "iris", range = cell_cols(c("B", "D")))
#> # A tibble: 150 x 3
#>    Sepal.Width Petal.Length Petal.Width
#>          <dbl>        <dbl>       <dbl>
#>  1         3.5          1.4         0.2
#>  2         3            1.4         0.2
#>  3         3.2          1.3         0.2
#>  # ... 147 more rows
```

Column B is the second column and column D is the fourth, so the band spans columns 2, 3, and 4.

### Example 3: Read an open-ended column range

**Use NA on one side to leave that edge of the band open.** `cell_cols(c(3, NA))` starts at column 3 and reads every column to the right, however many there are.

```r title="Read from a column to the last"
read_excel(datasets, sheet = "iris", range = cell_cols(c(3, NA)))
#> # A tibble: 150 x 3
#>    Petal.Length Petal.Width Species
#>           <dbl>       <dbl> <chr>
#>  1          1.4         0.2 setosa
#>  2          1.4         0.2 setosa
#>  3          1.3         0.2 setosa
#>  # ... 147 more rows
```

The band runs from column 3 to the last populated column, which here is Species.

### Example 4: The sequence form equals the pair form

**`cell_cols(2:4)` and `cell_cols(c(2, 4))` build the same range** because only the minimum and maximum of the vector matter. The row count never changes, because cell_cols() leaves rows untouched.

```r title="Sequence and pair are equal"
narrow <- read_excel(datasets, sheet = "iris", range = cell_cols(c(2, 4)))
dim(narrow)
#> [1] 150   3

identical(cell_cols(2:4), cell_cols(c(2, 4)))
#> [1] TRUE
```

Use whichever form reads more clearly; the resulting range object is identical.

## cell_cols() vs cell_rows, select and string ranges

**cell_cols() is one of several ways to control which columns reach your tibble.** Each option fits a different situation, summarized below.

| Approach | What it selects | Use when |
|---|---|---|
| `range = cell_cols(c(2, 4))` | a column band, all rows | columns sit in a known, contiguous range |
| `range = cell_rows(c(5, 15))` | a row band, all columns | the messy part is rows, not columns |
| `read_excel(path)` then `select()` | any columns, after import | columns are scattered or chosen by name |
| `range = "B1:D87"` | exact rows and columns | you know the full Excel address |

**The decision rule is straightforward.** Reach for `cell_cols()` when the columns you want sit side by side and you know their positions. Use `cell_rows()` when only rows need trimming, `dplyr::select()` when you want columns by name or in a custom order, and a string range when junk surrounds the data on every side.

[NOTE]
**Coming from Python pandas?** The cell_cols() equivalent is the `usecols` argument: `pd.read_excel(path, usecols="B:D")` reads the same column band. pandas accepts the colon string directly, but readxl does not, as the next section explains.

## Common pitfalls

**cell_cols() does not accept a colon range string.** Writing `cell_cols("B:D")` looks natural but fails, because cell_cols() reads a single column letter per element, not an Excel range. Pass the endpoints as a two-element vector instead: `cell_cols(c("B", "D"))` or the numeric `cell_cols(2:4)`.

**cell_cols() leaves rows unbounded, so junk above the data is still read.** If a sheet has title rows on top, `cell_cols()` happily reads them because it never touches the row axis. When a sheet has both messy rows and unwanted columns, reach for `cell_limits()`, which bounds both axes at once.

[WARNING]
**range overrides skip and n_max without a warning.** When you pass `range`, readxl ignores `skip` and `n_max` entirely. Pairing `cell_cols()` with `skip` looks reasonable but the `skip` silently does nothing, so trim rows through `cell_limits()` instead.

**cell_cols() cannot pick scattered columns.** A vector like `c(1, 3, 8)` does not read three columns; it reads the whole band from 1 to 8. cell_cols() is a slice, not a picker. To keep specific non-adjacent columns, import the band and then choose columns with `dplyr::select()`.

## Try it yourself

**Try it:** Read columns 1 through 4 of the `iris` sheet in `datasets.xlsx`. You should get a tibble that is four columns wide and still 150 rows tall. Save the result to `ex_iris`.

```r title="Your turn: read a column band"
# Try it: read columns 1 to 4 of the iris sheet
library(readxl)
datasets <- readxl_example("datasets.xlsx")

ex_iris <- # your code here

ncol(ex_iris)
#> Expected: 4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
library(readxl)
datasets <- readxl_example("datasets.xlsx")
ex_iris <- read_excel(datasets, sheet = "iris", range = cell_cols(1:4))
ncol(ex_iris)
#> [1] 4
```

**Explanation:** The band 1:4 spans the four numeric columns and drops Species, the fifth column. Because cell_cols() never bounds rows, all 150 rows survive.

</details>

## Related readxl functions

**cell_cols() is one member of a small family of range helpers.** These functions all build range objects for the `range` argument of `read_excel()`.

- `cell_rows()`: bounds the row range and leaves columns open.
- `cell_limits()`: bounds rows and columns at once for a rectangular block.
- `anchored()`: reads a fixed-size block starting from one anchor cell.
- `read_excel()`: the import function that consumes the range object.
- `excel_sheets()`: lists sheet names so you know which sheet to target.

## FAQ

**Can cell_cols() read non-consecutive columns?**

No. cell_cols() looks only at the smallest and largest value you give it and reads every column in between. Passing `c(1, 3, 8)` reads columns 1 through 8, not just those three. To keep scattered columns, import the full band first, then subset the resulting tibble with `dplyr::select()` or by name.

**Does cell_cols() accept Excel column letters?**

Yes, but as separate elements, not a colon range. Use `cell_cols(c("B", "D"))` to read columns B through D. The single string `cell_cols("B:D")` fails because cell_cols() expects one column letter per vector element. Numeric positions like `cell_cols(2:4)` work the same way and avoid letter parsing entirely.

**Does cell_cols() also limit which rows are read?**

No. cell_cols() bounds only the column axis; every row of the sheet is still read. To bound rows as well, use `cell_rows()` for a row band or `cell_limits()` to set both the row and column edges in a single rectangular range.

**Can I use cell_cols() with read_xlsx() and read_xls()?**

Yes. `read_xlsx()` and `read_xls()` accept the same `range` argument as `read_excel()`, so `cell_cols()` works with all three. `read_excel()` simply detects the file type for you, so most code can call it and pass the cell_cols() range directly.

For broader coverage of spreadsheet and file import, see the [official readxl reference](https://readxl.tidyverse.org/reference/cell-specification.html).
