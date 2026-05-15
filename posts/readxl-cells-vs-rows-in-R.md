---
title: "readxl Cells vs Rows in R: Slice Excel Imports"
slug: readxl-cells-vs-rows-in-R
description: "Compare cell-based and row-based Excel reading in readxl: when to use cell_rows(), skip and n_max versus cell_limits(), cell_cols() and range strings."
keywords: "readxl cells vs rows, readxl read range, read_excel range argument, cell_rows readxl, cell_cols readxl, cell_limits readxl, read specific cells Excel R"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: readr--readxl--haven
fr_parent: Importing-Data-in-R.html
auto_link_terms: "readxl cells vs rows|cells vs rows in readxl|cell_rows vs cell_limits|read a cell range vs rows|slice an Excel sheet by cells"
auto_link_case_sensitive: true
target_keyword: "readxl cells vs rows"
sibling_block_enabled: true
difficulty: Beginner
---

# readxl Cells vs Rows in R: Slice Excel Imports

<p class="lead">In readxl, cells vs rows is the choice between bounding a rectangle of cells and bounding a band of rows. Row tools leave columns open; cell tools fence in all four sides of your data.</p>

[QUICK ANSWER]
read_excel(path, range = cell_rows(c(5, 15)))     # rows: a horizontal band
read_excel(path, skip = 4, n_max = 10)            # rows: drop top, cap count
read_excel(path, range = "A5:F15")                # cells: an exact rectangle
read_excel(path, range = cell_limits(c(5,1), c(15,6)))  # cells: rectangle
read_excel(path, range = cell_cols("A:C"))        # cells: a vertical band
read_excel(path, range = anchored("A5", c(11,6))) # cells: a sized block

[DECISION TREE: Should I slice by rows or cells?]
- junk only above and below the data: cell_rows(c(5, 15))
- junk above only, end unknown: read_excel(path, skip = 4)
- junk on all four sides: read_excel(path, range = "A5:F15")
- you know the exact corners: cell_limits(c(5,1), c(15,6))
- you need a column band, all rows: cell_cols("A:C")
- a fixed-size block from one corner: anchored("A5", c(11, 6))

## What cells vs rows means in readxl

**readxl gives you two mental models for limiting an Excel import.** The row model picks a start and end row and reads every column in between. The cell model picks a rectangle and fences in rows and columns at once.

The row tools are `cell_rows()`, `skip`, and `n_max`. The cell tools are literal range strings like `"A5:F15"`, plus `cell_limits()`, `cell_cols()`, and `anchored()`. Both models feed the same `read_excel()` call, so the only real question is how much of the sheet you need to fence off.

[KEY INSIGHT]
**Rows bound one axis, cells bound two.** A row tool always reads full-width records and trims only the top and bottom. A cell tool also trims the left and right, which is the difference that decides everything below.

## Reading by rows: cell_rows, skip, and n_max

**Row reading suits sheets where junk sits only above or below the data.** Titles, notes, and totals usually stack vertically, so a row band is often all you need.

`cell_rows()` takes a start and end row and builds a range object for the `range` argument. The first row in the band becomes the column header.

```r title="Read a row band with cell_rows"
library(readxl)

deaths <- readxl_example("deaths.xlsx")
read_excel(deaths, range = cell_rows(c(5, 15)))
#> # A tibble: 10 x 6
#>    Name          Profession   Age `Has kids` `Date of birth`     `Date of death`
#>    <chr>         <chr>      <dbl> <lgl>      <dttm>              <dttm>
#>  1 David Bowie   musician      69 TRUE       1947-01-08 00:00:00 2016-01-10 ...
#>  2 Carrie Fisher actor         60 TRUE       1956-10-21 00:00:00 2016-12-27 ...
#>  # ... 8 more rows
```

The `deaths.xlsx` workbook keeps four title rows on top and a footer note at the bottom. The band 5 to 15 grabs the header plus ten data rows and nothing else.

When you do not know where the data ends, reach for `skip` and `n_max` instead. `skip` drops a fixed number of rows from the top, and `n_max` caps how many data rows are read.

```r title="Drop the top with skip and n_max"
read_excel(deaths, skip = 4, n_max = 3)
#> # A tibble: 3 x 6
#>   Name          Profession   Age `Has kids` `Date of birth`     `Date of death`
#>   <chr>         <chr>      <dbl> <lgl>      <dttm>              <dttm>
#> 1 David Bowie   musician      69 TRUE       1947-01-08 00:00:00 2016-01-10 ...
#> 2 Carrie Fisher actor         60 TRUE       1956-10-21 00:00:00 2016-12-27 ...
#> 3 Chuck Berry   musician      90 TRUE       1926-10-18 00:00:00 2017-03-18 ...
```

Skipping four rows lands the header on row 5, and `n_max = 3` reads only the first three deaths. This is the quickest way to preview a long sheet.

## Reading by cells: range strings, cell_limits, and cell_cols

**Cell reading suits sheets where junk also sits to the left or right.** Side notes, an index column, or a second table on the same sheet all need a rectangle, not a band.

A literal range string is the most direct cell tool. It reads exactly the Excel address you pass and ignores everything outside it.

```r title="Read an exact rectangle"
read_excel(deaths, range = "A5:F15")
#> # A tibble: 10 x 6
#>    Name          Profession   Age `Has kids` `Date of birth`     `Date of death`
#>    <chr>         <chr>      <dbl> <lgl>      <dttm>              <dttm>
#>  1 David Bowie   musician      69 TRUE       1947-01-08 00:00:00 2016-01-10 ...
#>  2 Carrie Fisher actor         60 TRUE       1956-10-21 00:00:00 2016-12-27 ...
#>  # ... 8 more rows

identical(
  read_excel(deaths, range = "A5:F15"),
  read_excel(deaths, range = cell_limits(c(5, 1), c(15, 6)))
)
#> [1] TRUE
```

`cell_limits()` builds the same rectangle from numeric corners: an upper-left `c(row, col)` and a lower-right `c(row, col)`. Use the string when you know the Excel address and `cell_limits()` when row and column numbers are easier to compute.

`cell_cols()` is the column-only cell tool. It bounds the columns and leaves the rows open, which is the mirror image of `cell_rows()`.

```r title="Read a column band with cell_cols"
datasets <- readxl_example("datasets.xlsx")
read_excel(datasets, sheet = "iris", range = cell_cols("A:C"))
#> # A tibble: 150 x 3
#>    Sepal.Length Sepal.Width Petal.Length
#>           <dbl>       <dbl>        <dbl>
#>  1          5.1         3.5          1.4
#>  2          4.9         3            1.4
#>  # ... 148 more rows

anchored("A5", dim = c(11, 6))
#> <cell_limits (5, 1) x (15, 6)>
```

`anchored()` is a convenience cell tool: give it one corner and a `dim = c(rows, cols)` size, and it computes the matching rectangle for you.

## Cells vs rows compared

**Both models reach the same `read_excel()` call, so pick by how the junk is shaped.** The table below maps each tool to the situation it solves.

| Tool | Model | Bounds | Best when |
|---|---|---|---|
| `cell_rows(c(5, 15))` | rows | top and bottom | data sits in known rows, full width |
| `skip` + `n_max` | rows | top, then a count | the end of the data is unknown |
| `range = "A5:F15"` | cells | all four sides | junk surrounds the data |
| `cell_limits(c(5,1), c(15,6))` | cells | all four sides | corners are easier as numbers |
| `cell_cols("A:C")` | cells | left and right | you need a column band, all rows |
| `anchored("A5", c(11,6))` | cells | a sized block | you know one corner and the size |

**The decision rule is short.** If every column in your rows is wanted, slice by rows. If unwanted columns sit beside the data, slice by cells. When in doubt, a literal range string is the safest cell tool because it commits to an exact, readable address.

[TIP]
**Inspect the sheet before you slice it.** Run `read_excel(path)` once with no `range` to see where the real header and data start, then write the exact band or rectangle. Guessing row and column numbers is the main source of off-by-one bugs.

## Common pitfalls

**`cell_cols()` does not escape header junk.** Because it leaves rows open, `cell_cols("A:C")` on a sheet with four title rows still reads those rows. Pair it with `cell_limits()` or a range string when both axes need fencing.

[WARNING]
**`range` silently overrides `skip` and `n_max`.** When you pass a `range` argument, whether a string or a `cell_*()` object, readxl ignores `skip` and `n_max` with no warning. Set the window in exactly one place so the import does what the code reads like.

**The first row of any window becomes the header.** This is true for both models. If `cell_rows(c(6, 15))` or `range = "A6:F15"` starts on a data row, that record turns into column names and you lose it. Include the real header row, or set `col_names = FALSE`.

[NOTE]
**Coming from Python pandas?** Row reading maps to `pd.read_excel(path, skiprows=4, nrows=10)`, and cell reading maps to the `usecols` argument plus `skiprows` for the rectangle.

## Try it yourself

**Try it:** Read the rectangle `A5:C15` from the first sheet of `deaths.xlsx`. Row 5 is the header and you keep only the first three columns. Save the result to `ex_block`.

```r title="Your turn: read a cell rectangle"
# Try it: read A5:C15 from deaths.xlsx
library(readxl)
deaths <- readxl_example("deaths.xlsx")

ex_block <- # your code here

dim(ex_block)
#> Expected: 10 3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
library(readxl)
deaths <- readxl_example("deaths.xlsx")
ex_block <- read_excel(deaths, range = "A5:C15")
dim(ex_block)
#> [1] 10  3
```

**Explanation:** The range `A5:C15` fences both axes. Rows 5 to 15 give the header plus ten data rows, and columns A to C keep Name, Profession, and Age.

</details>

## Related readxl functions

**The cells vs rows tools are a small, connected family.** Each builds or accepts a range for `read_excel()`.

- `cell_rows()`: bounds a row band and leaves columns open.
- `cell_cols()`: bounds a column band and leaves rows open.
- `cell_limits()`: bounds rows and columns for a full rectangle.
- `anchored()`: builds a rectangle from one corner and a size.
- `read_excel()`: the import function every range tool feeds.

## FAQ

**What is the difference between cells and rows in readxl?**

Reading by rows means bounding only the top and bottom of the data with `cell_rows()`, `skip`, or `n_max`, while every column is read in full. Reading by cells means bounding a rectangle with a range string, `cell_limits()`, `cell_cols()`, or `anchored()`, so columns are trimmed too. Use rows when all columns are wanted and cells when junk sits beside the data.

**Should I use cell_rows() or cell_limits()?**

Use `cell_rows()` when every column in the chosen rows belongs in your tibble and only the row band needs trimming. Use `cell_limits()` when unwanted columns sit to the left or right, since it fences both axes. `cell_limits()` is the more general tool: `cell_rows()` and `cell_cols()` are just `cell_limits()` with one axis left open.

**Does a range argument override skip in read_excel()?**

Yes. When you pass `range`, readxl ignores both `skip` and `n_max` without raising a warning. The `range` argument fully describes the window, so the row-count arguments become dead code. Choose one approach per call and delete the other so the import is unambiguous.

**Can I read scattered rows or columns with these tools?**

No. Every cells vs rows tool reads one contiguous block. `cell_rows(c(1, 5, 100))` reads rows 1 through 100, not three rows, because only the minimum and maximum matter. To keep non-adjacent rows or columns, import the block first, then subset the tibble with `dplyr::slice()` or column selection.

For the full range specification, see the [official readxl reference](https://readxl.tidyverse.org/reference/cell-specification.html).
</content>
</invoke>
