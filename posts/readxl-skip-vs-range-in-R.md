---
title: "readxl skip vs range in R: Which One to Use"
slug: readxl-skip-vs-range-in-R
description: "Compare the skip and range arguments of readxl read_excel() in R. Learn when to drop header rows with skip and when to read an exact cell block of data."
keywords: "readxl skip vs range, read_excel skip argument, read_excel range argument, skip rows in read_excel, readxl range vs skip, read Excel range R, readxl skip rows"
mathjax: false
webr: true
date: "2026-05-16"
post_type: PSEO
category_id: function-deep
subcategory_id: readr--readxl--haven
fr_parent: Importing-Data-in-R.html
auto_link_terms: "read_excel()|readxl skip|readxl range|skip argument|range argument"
auto_link_case_sensitive: true
target_keyword: "readxl skip vs range"
sibling_block_enabled: true
difficulty: Beginner
---

# readxl skip vs range in R: Which One to Use

<p class="lead">In readxl, <code>skip</code> drops a fixed number of rows from the top of a sheet before reading, while <code>range</code> reads an exact rectangular block of cells. Use <code>skip</code> for stray title rows, and use <code>range</code> when you need precise control over both rows and columns.</p>

[QUICK ANSWER]
read_excel("f.xlsx", skip = 3)                       # drop the first 3 rows
read_excel("f.xlsx", skip = 3, n_max = 100)          # skip, then cap rows
read_excel("f.xlsx", range = "B3:D90")               # exact A1 cell block
read_excel("f.xlsx", range = "Data!B3:D90")          # range with a sheet name
read_excel("f.xlsx", range = cell_rows(3:90))        # rows only, all columns
read_excel("f.xlsx", range = cell_cols("B:D"))       # columns only, all rows
read_excel("f.xlsx", range = anchored("B4", c(10,3)))# anchored 10x3 block

[DECISION TREE: Which read_excel control do I need?]
- drop N junk rows at the top: read_excel(f, skip = N)
- read an exact A1 cell block: read_excel(f, range = "B3:D90")
- limit only the row count: read_excel(f, n_max = 100)
- choose a sheet by name: read_excel(f, sheet = "Data")
- list sheet names first: excel_sheets(f)
- read rows only, any width: read_excel(f, range = cell_rows(3:90))

## skip and range in one sentence

**`skip` and `range` both control which part of a sheet `read_excel()` imports, but they work at different scales.** The `skip` argument counts rows from the top and discards them. The `range` argument names an absolute rectangle of cells, so it controls rows *and* columns at once.

To see the difference, build a messy spreadsheet with two title rows above the real data. The `writexl` package writes the file so you can read it straight back.

```r title="Create a sample Excel file"
library(readxl)
library(writexl)

# A messy sheet: 2 title rows, a header row, then 3 data rows
messy <- data.frame(
  product = c("Quarterly Sales Report", "Generated Q1 2024", "product",
              "Apples", "Pears", "Plums"),
  units   = c("", "", "units", "120", "90", "75"),
  revenue = c("", "", "revenue", "480", "270", "300")
)
write_xlsx(messy, "sales.xlsx", col_names = FALSE)
```

Read the file with no arguments and the two title rows leak in as data, while the first title becomes a column name.

```r title="Reading without skip or range"
read_excel("sales.xlsx")
#> # A tibble: 5 x 3
#>   `Quarterly Sales Report` ...2  ...3   
#>   <chr>                    <chr> <chr>  
#> 1 Generated Q1 2024        NA    NA     
#> 2 product                  units revenue
#> 3 Apples                   120   480    
#> 4 Pears                    90    270    
#> 5 Plums                    75    300    
```

## Using skip to drop rows from the top

**The `skip` argument removes a set number of rows before readxl looks for a header.** Pass `skip = 2` to discard both title rows. The next row (`product`, `units`, `revenue`) is then treated as the header, and the three fruit rows become the data.

```r title="Using the skip argument"
read_excel("sales.xlsx", skip = 2)
#> # A tibble: 3 x 3
#>   product units revenue
#>   <chr>   <chr> <chr>  
#> 1 Apples  120   480    
#> 2 Pears   90    270    
#> 3 Plums   75    300    
```

`skip` only affects rows. It keeps every column in the sheet, so it is the right tool when your data starts a few rows down but spans the full width. Combine it with `n_max` to also cap how many data rows you read.

```r title="Combining skip with n_max"
read_excel("sales.xlsx", skip = 2, n_max = 2)
#> # A tibble: 2 x 3
#>   product units revenue
#>   <chr>   <chr> <chr>  
#> 1 Apples  120   480    
#> 2 Pears   90    270    
```

[KEY INSIGHT]
**`skip` is a relative count, `range` is an absolute address.** Think of `skip` as "ignore the first N rows" and `range` as "go to this exact corner of the sheet." That mental model tells you which one to reach for.

## Using range to read an exact cell block

**The `range` argument names a rectangle of cells in A1 notation, so it controls rows and columns together.** Reading `range = "A3:C6"` starts at row 3 (the header), ends at row 6, and keeps columns A through C. The result matches the clean `skip` read above.

```r title="Reading an A1 cell range"
read_excel("sales.xlsx", range = "A3:C6")
#> # A tibble: 3 x 3
#>   product units revenue
#>   <chr>   <chr> <chr>  
#> 1 Apples  120   480    
#> 2 Pears   90    270    
#> 3 Plums   75    300    
```

Because `range` also picks columns, you can drop unwanted ones. Reading `range = "B3:C6"` keeps only `units` and `revenue` and ignores the `product` column entirely.

```r title="Selecting columns with range"
read_excel("sales.xlsx", range = "B3:C6")
#> # A tibble: 3 x 2
#>   units revenue
#>   <chr> <chr>  
#> 1 120   480    
#> 2 90    270    
#> 3 75    300    
```

When you want a row range but every column, the `cell_rows()` helper avoids hard-coding a final column letter. It is the closest `range` equivalent to a pure `skip`.

```r title="Row range with cell_rows"
read_excel("sales.xlsx", range = cell_rows(3:6))
#> # A tibble: 3 x 3
#>   product units revenue
#>   <chr>   <chr> <chr>  
#> 1 Apples  120   480    
#> 2 Pears   90    270    
#> 3 Plums   75    300    
```

## skip vs range: which should you use

**Reach for `skip` when only the row offset matters, and `range` when you need to box in a region.** The table below sums up the trade-offs.

| Aspect | `skip` | `range` |
|---|---|---|
| Controls rows | Yes | Yes |
| Controls columns | No, keeps all | Yes, exact block |
| Has an end point | No, reads to the last row | Yes, fixed rectangle |
| Notation | Integer count | A1 string or `cell_*()` helper |
| Best for | Stray title rows above full-width data | Pulling one table out of a busy sheet |

A simple rule: if your only problem is junk rows at the top, use `skip`. If the sheet holds several tables, notes, or extra columns and you want just one block, use `range`.

[WARNING]
**`range` overrides `skip`.** If you pass both, readxl ignores `skip` and `n_max` and honors `range` only. Setting both produces no error and no warning, so the silent override is easy to miss.

```r title="range silently overrides skip"
# skip = 5 is ignored because range is set
read_excel("sales.xlsx", skip = 5, range = "A3:C6")
#> # A tibble: 3 x 3
#>   product units revenue
#>   <chr>   <chr> <chr>  
#> 1 Apples  120   480    
#> 2 Pears   90    270    
#> 3 Plums   75    300    
```

## Common pitfalls

**Off-by-one errors are the most frequent `skip` mistake.** To reach a header on Excel row 3, you skip the 2 rows above it, so `skip = 2`. The `skip` value is the count of rows discarded, not the row number where data begins.

**Passing a numeric vector to `range` fails.** The `range` argument expects an A1 string such as `"A3:C6"` or a `cell_*()` helper. A bare `range = 3:6` raises an error. Use `range = cell_rows(3:6)` for a row-only selection.

**Skipping rows does not fix column types.** Cells stored as text in Excel still read as character vectors. After a clean `skip` or `range` read, apply `readr::type_convert()` or set `col_types` to get numeric columns.

```r title="Converting types after a clean read"
clean <- read_excel("sales.xlsx", range = "A3:C6")
clean$units <- as.numeric(clean$units)
clean$units
#> [1] 120  90  75
```

## Try it yourself

**Try it:** From `sales.xlsx`, read only the `revenue` column for all three products. Skip the title and header rows so the result has no column name from the file. Save it to `ex_revenue`.

```r title="Your turn: read one column with range"
# Try it: read just the revenue values
ex_revenue <- # your code here

ex_revenue
#> Expected: a 3-row tibble with one column
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_revenue <- read_excel("sales.xlsx", range = "C4:C6", col_names = "revenue")
ex_revenue
#> # A tibble: 3 x 1
#>   revenue
#>   <chr>  
#> 1 480    
#> 2 270    
#> 3 300    
```

**Explanation:** `range = "C4:C6"` boxes in column C, rows 4 to 6, so only the three revenue values load. Setting `col_names = "revenue"` supplies a name because the range skips the header row.

</details>

## Related readxl functions

**These helpers extend the row and column control that `skip` and `range` give you.**

- [read_excel()](readxl-read_excel-in-R.html): the main reader that accepts both `skip` and `range`.
- [cell_rows()](readxl-cell_rows-in-R.html): build a `range` from row numbers only.
- [cell_cols()](readxl-cell_cols-in-R.html): build a `range` from column letters only.
- [anchored()](readxl-anchored-in-R.html): define a `range` by a corner cell plus a width and height.
- [excel_sheets()](readxl-excel_sheets-in-R.html): list sheet names before deciding what to read.

See the official [readxl read_excel reference](https://readxl.tidyverse.org/reference/read_excel.html) for the full argument list.

## FAQ

**Does range override skip in read_excel()?**

Yes. When you supply `range`, readxl ignores both `skip` and `n_max`. The override is silent, with no error or warning, so passing both arguments is a common source of confusion. If you need a row offset, either use `skip` alone or express the offset inside the `range`, for example `cell_rows(3:90)`.

**How do I skip rows but keep the header in readxl?**

Set `skip` to the number of rows above the header. With two title rows, `skip = 2` discards them, and readxl then treats the next row as the header automatically. You do not need a separate header argument. If there is no header row at all, add `col_names = FALSE` or pass your own names.

**Can range select specific columns only?**

Yes, and this is the main reason to prefer `range` over `skip`. A range like `"B3:D90"` keeps only columns B through D. The `skip` argument cannot drop columns; it always reads the full width of the sheet. Use `cell_cols("B:D")` if you want those columns for every row.

**What is the difference between skip and n_max?**

`skip` removes rows from the top before reading, while `n_max` caps how many data rows are read after the header. They work together: `skip = 2, n_max = 100` ignores two title rows and then reads at most 100 data rows. Both are ignored when `range` is set.
