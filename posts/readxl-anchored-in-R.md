---
title: "readxl anchored() in R: Read a Cell Block by Corner"
slug: readxl-anchored-in-R
description: "readxl anchored() in R builds a cell range from one corner plus a width and height, so read_excel() imports an exact block of cells with no corner math."
keywords: "readxl anchored, anchored function R, readxl anchored examples, R read excel cell range, anchored cell_limits, readxl range argument, read excel block in R"
mathjax: false
webr: true
date: "2026-05-16"
post_type: PSEO
category_id: function-deep
subcategory_id: readr--readxl--haven
fr_parent: Importing-Data-in-R.html
auto_link_terms: "anchored()|readxl anchored|readxl::anchored()|anchored cell range|anchored function"
auto_link_case_sensitive: true
target_keyword: "readxl anchored"
sibling_block_enabled: true
difficulty: Beginner
---

# readxl anchored() in R: Read a Cell Block by Corner

<p class="lead">readxl anchored() builds a rectangular cell range from a single upper-left corner and a c(rows, columns) size, then hands that range to read_excel() so it imports an exact block of cells without you ever computing the far corner.</p>

[QUICK ANSWER]
anchored("B5", dim = c(10, 6))             # 10 rows x 6 cols, corner at B5
anchored(c(5, 2), dim = c(10, 6))          # same block, R-style c(row, column) anchor
anchored("A1")                             # single cell A1 (dim defaults to c(1, 1))
anchored("A1", dim = c(20, 4))             # rows 1-20, columns 1-4
read_excel(path, range = anchored("B5", dim = c(10, 6)))  # feed it to read_excel()

[DECISION TREE: Is anchored() the right tool?]
- read a block from one corner and a size: anchored("B5", dim = c(10, 6))
- read a rectangle from two known corners: cell_limits(c(5,1), c(15,6))
- limit rows only, keep every column: cell_rows(5:15)
- limit columns only, keep every row: cell_cols(2:6)
- use plain Excel A1 notation: read_excel(path, range = "B5:F15")
- skip only the top N rows: read_excel(path, skip = 4)

## What anchored() does

**anchored() describes a block by its corner and its size.** You give it one upper-left cell and a `dim` pair that says how many rows tall and how many columns wide the block is. It returns a small `cell_limits` object, which you pass to the `range` argument of `read_excel()`. readxl then reads only the cells inside that block and ignores everything around it.

The function ships with readxl, re-exported from the cellranger package, so loading readxl is enough. It is the right helper when you know where a table starts and how big it is, but you would rather not do the arithmetic to find its bottom-right corner.

[KEY INSIGHT]
**anchored() is corner-plus-size; cell_limits() is corner-plus-corner.** Both build the same kind of `cell_limits` object, but they ask for different inputs. Reach for anchored() when a block's dimensions are natural to state ("11 rows, 6 columns") and reach for cell_limits() when both corners are already known.

## anchored() syntax and arguments

**anchored() takes one required idea and a few optional controls.** The signature is `anchored(anchor, dim, input)`, and each argument shapes a different part of the block.

| Argument | Default | Description |
|---|---|---|
| `anchor` | `"A1"` | Upper-left cell. An A1 string such as `"B5"`, or a `c(row, column)` pair. |
| `dim` | `c(1, 1)` | Block size as `c(rows, columns)`. Both values must be positive. |
| `input` | `"R"` | How a numeric anchor is read. `"R"` means `c(row, column)`. Ignored for A1 strings. |

The anchor counts as the first cell of the range, so a `dim` of `c(11, 6)` reaches from the anchor down 11 rows and across 6 columns, both inclusive. Printing the result shows the two corners it resolved to.

```r title="Build and print an anchored range"
library(readxl)

# A block 10 rows tall and 6 columns wide, starting at B5
my_block <- anchored(anchor = "B5", dim = c(10, 6))
my_block
#> <cell_limits (5, 2) x (14, 7)>
```

The corner `B5` becomes row 5, column 2, and the `c(10, 6)` size extends it to row 14, column 7.

## Read a block by its corner: four examples

**Every example reads `deaths.xlsx`, a sample file bundled with readxl.** Each sheet has four metadata rows on top, a header on row 5, ten data rows, and footer notes below, a realistic layout for testing ranges.

### Read a fixed block

**Anchor on the header row and size the block to cover the table.** The header sits on row 5 and the data ends on row 15, so the block is 11 rows tall and 6 columns wide.

```r title="Read a fixed block from its corner"
deaths <- readxl_example("deaths.xlsx")

read_excel(deaths, range = anchored("A5", dim = c(11, 6)))
#> # A tibble: 10 x 6
#>   Name          Profession   Age `Has kids` `Date of birth`     `Date of death`
#>   <chr>         <chr>      <dbl> <lgl>      <dttm>              <dttm>
#> 1 David Bowie   musician      69 TRUE       1947-01-08 00:00:00 2016-01-10 00:00:00
#> 2 Carrie Fisher actor         60 TRUE       1956-10-21 00:00:00 2016-12-27 00:00:00
#> 3 Chyna         wrestler      45 FALSE      1969-12-27 00:00:00 2016-04-20 00:00:00
#> # i 7 more rows
```

The first row of the range becomes the column header, so 11 anchored rows yield 10 data rows.

### Anchor with R-style coordinates

**A numeric `c(row, column)` anchor works the same as an A1 string.** This is handy when the corner comes from a calculation rather than a literal cell reference.

```r title="Anchor a block with numeric coordinates"
read_excel(deaths, range = anchored(c(5, 1), dim = c(11, 6)))
#> # A tibble: 10 x 6
#>   Name          Profession   Age `Has kids` `Date of birth`     `Date of death`
#>   <chr>         <chr>      <dbl> <lgl>      <dttm>              <dttm>
#> 1 David Bowie   musician      69 TRUE       1947-01-08 00:00:00 2016-01-10 00:00:00
#> # i 9 more rows
```

The anchor `c(5, 1)` is read as row 5, column 1 because `input` defaults to `"R"`.

### Read a smaller block

**Shrink `dim` to pull just a slice of the table.** A `dim` of `c(4, 6)` covers the header plus three data rows.

```r title="Read a smaller anchored block"
read_excel(deaths, range = anchored("A5", dim = c(4, 6)))
#> # A tibble: 3 x 6
#>   Name          Profession   Age `Has kids` `Date of birth`     `Date of death`
#>   <chr>         <chr>      <dbl> <lgl>      <dttm>              <dttm>
#> 1 David Bowie   musician      69 TRUE       1947-01-08 00:00:00 2016-01-10 00:00:00
#> 2 Carrie Fisher actor         60 TRUE       1956-10-21 00:00:00 2016-12-27 00:00:00
#> 3 Chyna         wrestler      45 FALSE      1969-12-27 00:00:00 2016-04-20 00:00:00
```

### Reuse a stored anchored range

**Store the range once and apply it to every file with the same layout.** Because a `cell_limits` object is independent of any file, one definition serves many reads.

```r title="Reuse a stored anchored range"
table_block <- anchored("A5", dim = c(11, 6))

arts <- read_excel(deaths, range = table_block)
nrow(arts)
#> [1] 10
```

[WARNING]
**anchored() has no sheet argument.** The block it builds always targets the first worksheet. To read the same block from a named sheet, use `cell_limits(c(5, 1), c(15, 6), sheet = "other")` or an A1 string such as `"other!A5:F15"`, both of which carry the sheet inside the range.

## anchored() vs cell_limits() vs A1 ranges

**Three ways to name a range trade off arithmetic against clarity.** They all reach the same block of cells; they differ in what you have to know up front.

| Approach | You supply | Best for |
|---|---|---|
| `anchored()` | One corner plus a `c(rows, columns)` size | A block whose dimensions are natural to state |
| `cell_limits()` | Two corners as `c(row, column)` pairs | A rectangle when both corners are already known |
| A1 string | An Excel range like `"B5:F15"` | Quick ranges you can read straight off the sheet |

Use `anchored()` when the block's height and width are obvious but the bottom-right corner would need a calculation. Use `cell_limits()` when both corners are known. Reach for an A1 string when you want the shortest possible code and the range fits Excel notation cleanly.

[NOTE]
**Coming from Python pandas?** There is no direct `anchored()` equivalent. You combine arguments instead: `pd.read_excel(path, header=4, usecols="A:F", nrows=10)` reproduces `anchored("A5", dim = c(11, 6))` by pairing a header offset, a column span, and a row count.

## Common pitfalls

**Most anchored() mistakes come from misreading `dim`.** Three problems account for nearly every wrong block.

- **`dim` is a size, not a corner.** It is a `c(rows, columns)` height-and-width pair, never the lower-right cell. Passing a far corner as `dim` reaches well past the data.
- **`dim` is `c(rows, columns)`, not `c(columns, rows)`.** Swapping the order silently reads a block of the wrong shape.
- **The anchor counts as the first row.** A block anchored on the header row needs one extra row in `dim` to cover every data row.

```r title="dim is c(rows, columns), not c(columns, rows)"
# Wrong: this asks for 6 rows by 11 columns
anchored("A5", dim = c(6, 11))
#> <cell_limits (5, 1) x (10, 11)>

# Right: 11 rows by 6 columns
anchored("A5", dim = c(11, 6))
#> <cell_limits (5, 1) x (15, 6)>
```

## Try it yourself

**Try it:** Read a 5-row by 6-column block starting at cell A5 of the `deaths.xlsx` example file. Save the result to `ex_block`.

```r title="Your turn: anchor a block"
# Try it: anchor a 5-row, 6-column block at A5
ex_block <- # your code here

dim(ex_block)
#> Expected: 4 6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_block <- read_excel(readxl_example("deaths.xlsx"),
                       range = anchored("A5", dim = c(5, 6)))
dim(ex_block)
#> [1] 4 6
```

**Explanation:** A `dim` of `c(5, 6)` spans 5 rows from the anchor. Row 5 is the header, which leaves 4 data rows and all 6 columns.

</details>

## Related readxl functions

These functions pair naturally with `anchored()` when importing spreadsheet data:

- [read_excel()](readxl-read_excel-in-R.html) reads xls and xlsx files; `anchored()` feeds its `range` argument.
- [cell_limits()](readxl-cell_limits-in-R.html) defines a range from two corner coordinates instead of a corner and a size.
- [cell_rows()](readxl-cell_rows-in-R.html) limits a read by row numbers only, keeping every column.
- [cell_cols()](readxl-cell_cols-in-R.html) limits a read by column numbers or letters only, keeping every row.
- [excel_sheets()](readxl-excel_sheets-in-R.html) lists sheet names so you can choose a sheet before setting a range.

See the official [readxl cell-specification reference](https://readxl.tidyverse.org/reference/cell-specification.html) for the full family of range helpers.

## FAQ

**What does anchored() do in readxl?**

`anchored()` creates a `cell_limits` object that describes a rectangular block of cells. You give it one upper-left corner and a `dim` pair stating how many rows and columns the block covers. The object stores nothing from the file; it is a specification. You pass it to the `range` argument of `read_excel()`, and readxl reads only the cells inside that block, skipping the rows and columns around it.

**What is the difference between anchored() and cell_limits()?**

Both build a `cell_limits` object, but they take different inputs. `anchored()` wants one corner plus a `c(rows, columns)` size, so you describe the block by where it starts and how big it is. `cell_limits()` wants two corners, an upper-left and a lower-right `c(row, column)` pair. Use `anchored()` when the dimensions are easy to state, and `cell_limits()` when both corners are already known.

**How is the dim argument ordered in anchored()?**

`dim` is a `c(rows, columns)` pair: rows first, columns second. It is a size, a height and a width, not the lower-right corner of the block. A `dim` of `c(11, 6)` reaches 11 rows down and 6 columns across from the anchor, with the anchor counting as the first cell. Reversing the order to `c(6, 11)` reads a block of the wrong shape without raising an error.

**Can anchored() read from a specific worksheet?**

No. `anchored()` has no `sheet` argument, so the block it builds always targets the first sheet. To read a block from a named sheet, attach the sheet to the range some other way. Use `cell_limits(c(5, 1), c(15, 6), sheet = "other")`, which accepts a `sheet` argument, or pass an A1 string like `"other!A5:F15"` to the `range` argument of `read_excel()`.
</content>
</invoke>
