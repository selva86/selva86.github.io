---
title: "fst read_fst() in R: Read .fst Data Files Fast"
slug: fst-read_fst-in-R
description: "read_fst() in R loads .fst binary files into a data frame at high speed, with column selection and row ranges. See syntax, examples, and common pitfalls."
keywords: "fst read_fst, read_fst function R, fst read_fst examples, read .fst file R, read_fst R, fst package read"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: readr--readxl--haven
fr_parent: Importing-Data-in-R.html
auto_link_terms: "read_fst()|fst read_fst|fst::read_fst()|read .fst file|read_fst"
auto_link_case_sensitive: true
target_keyword: "fst read_fst"
sibling_block_enabled: true
difficulty: Beginner
---

# fst read_fst() in R: Read .fst Data Files Fast

<p class="lead">read_fst() in the fst package reads a .fst binary file into an R data frame fast, with optional column selection and row ranges so you load only the data you need.</p>

[QUICK ANSWER]
read_fst("data.fst")                          # read the whole file
read_fst("data.fst", columns = c("a", "b"))   # selected columns only
read_fst("data.fst", from = 1, to = 1000)     # first 1000 rows
read_fst("data.fst", as.data.table = TRUE)    # return a data.table
metadata_fst("data.fst")                      # inspect without loading
write_fst(df, "data.fst", compress = 50)      # create a .fst file

[DECISION TREE: Is read_fst() the right tool?]
- read a .fst binary file: read_fst("data.fst")
- read a CSV text file: read_csv("data.csv")
- read a Parquet file: read_parquet("data.parquet")
- read an R serialized object: readRDS("data.rds")
- read an Excel workbook: read_excel("data.xlsx")
- inspect a .fst file without loading it: metadata_fst("data.fst")

## What read_fst() does

**read_fst() loads a .fst binary file into an R data frame.** The fst package stores data frames in a compressed, columnar format on disk. Because the layout is columnar and indexed, read_fst() can pull back a few columns or a slice of rows without scanning the whole file. That makes it the fastest practical way to reload a large data frame between R sessions.

A .fst file is produced by `write_fst()`. Once written, the file is self-describing: it records column names, column types, the row count, and the compression level. read_fst() reads that header first, then decompresses only the blocks you ask for.

[KEY INSIGHT]
**Columnar storage is why read_fst() is fast.** A CSV is parsed line by line and every value is converted from text. A .fst file stores each column as a typed, compressed binary block, so a read is mostly a memory copy plus decompression.

## read_fst() syntax and arguments

**read_fst() takes a file path plus four optional arguments.** The basic call is `read_fst(path, columns, from, to, as.data.table)`. Only `path` is required; the rest default to reading the entire file as a plain data frame.

| Argument | Default | What it does |
|---|---|---|
| `path` | (required) | Path to the .fst file to read |
| `columns` | `NULL` | Character vector of columns to read; `NULL` reads all |
| `from` | `1` | First row to read, 1-indexed and inclusive |
| `to` | `NULL` | Last row to read; `NULL` reads to the final row |
| `as.data.table` | `FALSE` | If `TRUE`, return a `data.table` instead of a `data.frame` |

The `columns`, `from`, and `to` arguments are the reason to choose .fst over `.rds`. They let you read a subset of a large file straight from disk, instead of loading everything into memory and then subsetting.

## Reading .fst files: four common cases

**Start by writing a sample .fst file so the reads have something to load.** The block below builds a 10,000-row data frame and saves it with `write_fst()`. Every later example reads this file back.

```r title="Create a sample fst file"
library(fst)

sales <- data.frame(
  region = rep(c("North", "South", "East", "West"), 2500),
  units  = sample(1:100, 10000, replace = TRUE),
  price  = round(runif(10000, 5, 50), 2)
)

write_fst(sales, "sales.fst", compress = 50)
nrow(sales)
#> [1] 10000
```

**Case 1: read the entire file.** Pass only the path to load every row and column back into a data frame.

```r title="Read an entire fst file"
sales_all <- read_fst("sales.fst")

dim(sales_all)
#> [1] 10000     3
head(sales_all, 3)
#>   region units price
#> 1  North    43 31.07
#> 2  North    12  8.55
#> 3  North    77 44.92
```

**Case 2: read selected columns.** Pass a character vector to `columns`. fst decompresses only those columns, which is faster and uses less memory than loading the full frame.

```r title="Read selected columns only"
prices <- read_fst("sales.fst", columns = c("region", "price"))

names(prices)
#> [1] "region" "price"
ncol(prices)
#> [1] 2
```

[TIP]
**Selecting columns is the biggest single speed win.** When a file has dozens of columns and you need three, `columns = c(...)` skips decompression of everything else, so the read scales with what you ask for, not with the file size.

**Case 3: read a range of rows.** Use `from` and `to` to pull a window of rows. Both bounds are inclusive, so `from = 1, to = 500` returns exactly 500 rows.

```r title="Read a range of rows"
chunk <- read_fst("sales.fst", from = 1, to = 500)

nrow(chunk)
#> [1] 500
```

**Case 4: inspect metadata, or return a data.table.** `metadata_fst()` reads the header only, with no data load, so you can check the shape of a file before committing memory to it. Set `as.data.table = TRUE` when you want a `data.table` back.

```r title="Inspect metadata and return a data.table"
metadata_fst("sales.fst")
#> <fst file>
#> 10000 rows, 3 columns (sales.fst)
#> * 'region': character
#> * 'units' : integer
#> * 'price' : double

dt <- read_fst("sales.fst", columns = "units", as.data.table = TRUE)
class(dt)
#> [1] "data.table" "data.frame"
```

## read_fst() vs other ways to load data

**read_fst() wins when you reload large data frames repeatedly.** It is faster than `readRDS()` and far faster than `read_csv()`, and unlike either it supports partial reads. The trade-off is that .fst is an R-focused binary format, so it is a session cache, not an interchange format.

| Function | File format | Read speed | Partial read |
|---|---|---|---|
| `read_fst()` | `.fst` binary | Fastest | Yes, columns and rows |
| `readRDS()` | `.rds` binary | Fast | No, loads the whole object |
| `read_csv()` | `.csv` text | Slow | No |
| `read_parquet()` | `.parquet` binary | Fast | Yes, columns |

Use `read_fst()` for an R-only workflow that re-reads big tables often. Use `read_parquet()` when the same data must move between R, Python, and other tools.

[NOTE]
**Coming from Python pandas?** There is no direct `.fst` reader in mainstream pandas. The cross-language equivalent of a fast binary table is Parquet or Feather, both read in R with `arrow::read_parquet()` and in Python with `pandas.read_parquet()`.

## Common pitfalls

**Column names passed to read_fst() are case-sensitive.** A typo or wrong case raises an error instead of silently returning nothing. Match the names exactly as `metadata_fst()` reports them.

```r title="Pitfall: wrong column name case"
read_fst("sales.fst", columns = "Price")
#> Error: Selected column not found: 'Price'

# fix: use the exact lowercase name
read_fst("sales.fst", columns = "price")
```

**The `from` and `to` bounds are inclusive.** Reading `from = 101, to = 200` returns 100 rows, not 99. Treat the window like `101:200`, not like a zero-based slice.

[WARNING]
**The .fst format is a cache, not an archive.** The on-disk format can change between major versions of the fst package, and a file written by a newer version may not open in an older one. For long-term storage or sharing, keep a CSV or Parquet copy and treat .fst as a fast session cache.

## Try it yourself

**Try it:** Read only the `units` column from `sales.fst` for rows 1 through 100. Save the result to ex_units.

```r title="Your turn: read a column slice"
# Try it: read the units column, rows 1-100
ex_units <- # your code here

nrow(ex_units)
#> Expected: 100
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_units <- read_fst("sales.fst", columns = "units", from = 1, to = 100)
nrow(ex_units)
#> [1] 100
```

**Explanation:** Passing `columns`, `from`, and `to` together reads one column across a 100-row window. fst touches only that slice of the file, so the read stays fast even on a large dataset.

</details>

## Related fst and data import functions

**read_fst() is one of a small, focused family in the fst package.** These functions cover writing, inspecting, and tuning .fst input and output.

- `write_fst()`: create a `.fst` file from a data frame, with an adjustable compression level.
- `metadata_fst()`: read a file's column names, types, and row count without loading data.
- `threads_fst()`: set how many threads fst uses for compression and decompression.
- `readRDS()`: read a single R object from an `.rds` file.
- `arrow::read_parquet()`: read a Parquet file when data must cross languages.

See the official [fst package reference](https://www.fstpackage.org/reference/index.html) for the full argument list and benchmarks.

## FAQ

**What is a .fst file in R?**

A .fst file is a compressed, columnar binary file that stores an R data frame on disk. It is created by `write_fst()` from the fst package. The format records column names, types, and row count in a header, and stores each column as a separately compressed block. That layout lets `read_fst()` load specific columns or row ranges without reading the whole file, which makes it well suited to caching large tables between R sessions.

**Is read_fst() faster than read.csv()?**

Yes, by a wide margin on large data. `read.csv()` parses text line by line and converts every value from a string, which is CPU-bound. `read_fst()` reads typed binary blocks, so the work is mostly decompression and a memory copy. For multi-million-row tables the difference is often more than ten-fold, and `read_fst()` can also read just the columns you need, which `read.csv()` cannot.

**Can read_fst() read part of a file?**

Yes. Pass `columns` to read a subset of columns and `from` plus `to` to read a range of rows. Both bounds are 1-indexed and inclusive. Because .fst is columnar and indexed, these partial reads pull only the requested blocks off disk rather than loading the full file and subsetting in memory.

**Does read_fst() return a data.table or a data.frame?**

By default `read_fst()` returns a plain `data.frame`. Set `as.data.table = TRUE` to get a `data.table` instead, which is useful when the rest of your pipeline uses data.table syntax. The underlying data is identical either way; only the class and the available methods change.
