---
title: "arrow read_parquet() in R: Read Parquet Files Fast"
slug: arrow-read_parquet-in-R
description: "Learn arrow read_parquet() in R to load Parquet files fast. Covers syntax, col_select for column pruning, type preservation, read_csv differences, and pitfalls."
keywords: "arrow read_parquet, read_parquet function R, arrow read_parquet examples, read parquet file R, R read parquet, arrow open_dataset"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: readr--readxl--haven
fr_parent: Importing-Data-in-R.html
auto_link_terms: "read_parquet()|arrow read_parquet|arrow::read_parquet()|read Parquet file in R|read_parquet in R"
auto_link_case_sensitive: true
target_keyword: "arrow read_parquet"
sibling_block_enabled: true
difficulty: Beginner
---

# arrow read_parquet() in R: Read Parquet Files Fast

<p class="lead">The arrow read_parquet() function loads a Parquet file into an R data frame in one call. Parquet is a compressed, columnar binary format, so a read_parquet() import is far faster and smaller than the same data stored as CSV.</p>

[QUICK ANSWER]
read_parquet("data.parquet")                          # read a whole file
read_parquet("data.parquet", col_select = c(mpg, hp)) # read only some columns
read_parquet("https://site.com/data.parquet")         # read straight from a URL
read_parquet("data.parquet", as_data_frame = FALSE)   # return an Arrow Table
read_parquet("data.parquet", col_select = starts_with("d")) # tidyselect columns
nrow(read_parquet("data.parquet"))                    # check row count

[DECISION TREE: Is read_parquet() the right tool?]
- read one Parquet file into memory: read_parquet("data.parquet")
- read many Parquet files as one dataset: open_dataset("folder/")
- read an Arrow Feather or IPC file: read_feather("data.feather")
- read a plain CSV or text table: read_csv("data.csv")
- restore an R-only saved object: read_rds("obj.rds")
- write a data frame to Parquet: write_parquet(df, "data.parquet")

## What read_parquet() does

**read_parquet() reads one Parquet file into R.** A Parquet file stores a table in a compressed, columnar layout that databases and tools like Spark and pandas all understand. You give read_parquet() a path, and it returns a tibble with the column types already set, so nothing is guessed the way a CSV reader has to guess.

The function comes from the `arrow` package, which bundles the Apache Arrow C++ engine. Because Parquet stores each column separately, read_parquet() can skip columns you do not ask for and decode only the data you need. That selective reading is the main reason Parquet imports beat CSV imports on large data.

## Syntax and key arguments

**The signature is short, and one argument does most of the work.** You almost always pass just `file`, and reach for `col_select` whenever the file is wide and you only need a few columns.

```r title="The read_parquet signature"
read_parquet(
  file,                  # path, URL, or connection to a .parquet file
  col_select = NULL,     # tidyselect columns to read; NULL reads all
  as_data_frame = TRUE,  # TRUE returns a tibble; FALSE returns an Arrow Table
  props = ParquetArrowReaderProperties$create(),
  mmap = TRUE            # memory-map the file for faster local reads
)
```

The `col_select` argument accepts the same tidyselect helpers as `dplyr::select()`, such as `starts_with()` and `c()`. Setting `as_data_frame = FALSE` returns a lazy Arrow Table instead of pulling everything into an R data frame, which is useful for very wide files. The `props` and `mmap` arguments rarely need changing.

[NOTE]
**Coming from Python pandas?** read_parquet() is the direct counterpart of `pandas.read_parquet()`. A Parquet file written by pandas, Spark, or DuckDB reads into R with no conversion step, because all of them share the same on-disk format.

## read_parquet() examples

**Start with a round trip.** Write a built-in dataset to a Parquet file with `write_parquet()`, then read it back so every example has a real file to work with.

```r title="Write and read a Parquet file"
library(arrow)

write_parquet(mtcars, "cars.parquet")
cars <- read_parquet("cars.parquet")
dim(cars)
#> [1] 32 11
```

The data returns as a 32-row, 11-column tibble. No delimiter was parsed and no column type was inferred, because the Parquet file already stored the schema alongside the data.

**Read only the columns you need.** Pass `col_select` and read_parquet() decodes just those columns from disk, leaving the rest untouched. On a wide file this is dramatically faster than reading everything and dropping columns afterward.

```r title="Read only selected columns"
small <- read_parquet("cars.parquet", col_select = c(mpg, cyl, hp))
names(small)
#> [1] "mpg" "cyl" "hp"
nrow(small)
#> [1] 32
```

Only three columns came back. Because Parquet is columnar, the other eight columns were never read off disk at all.

[KEY INSIGHT]
**Parquet stores columns, not rows.** That single fact explains why col_select is nearly free: skipping a column means skipping a contiguous block of the file, not filtering it out after a full read.

**Parquet preserves column types.** A CSV round trip flattens factors and dates into text, so you rebuild those types on every reload. A Parquet round trip keeps them, because the file carries a typed schema.

```r title="Parquet keeps factor and date types"
df <- data.frame(
  grp = factor(c("a", "b", "a")),
  day = as.Date("2026-01-01") + 0:2
)
write_parquet(df, "typed.parquet")
restored <- read_parquet("typed.parquet")
sapply(restored, class)
#>      grp      day
#> "factor"   "Date"
```

The factor returns with its levels intact and the date column returns as a `Date`. This type fidelity makes Parquet a solid choice for caching cleaned data between sessions.

**Return an Arrow Table instead of a data frame.** Set `as_data_frame = FALSE` when a file is too wide to pull fully into memory. The Table is a lazy handle you can filter before collecting.

```r title="Read as an Arrow Table"
tbl <- read_parquet("cars.parquet", as_data_frame = FALSE)
class(tbl)[1]
#> [1] "Table"
tbl$num_rows
#> [1] 32
```

The Table reports 32 rows without materializing them as an R data frame. You can run dplyr verbs on it and call `collect()` only when you need the result in memory.

## read_parquet() vs read_csv() and alternatives

**read_parquet() is the fast columnar reader; read_csv() is the portable text reader.** They both return a tibble, so the choice depends on the file format you have and how the data will be shared.

| Function | Reads | Format | Speed | Best for |
|----------|-------|--------|-------|----------|
| `read_parquet()` | one file | columnar binary | fast | large analytic data, column pruning |
| `read_feather()` | one file | Arrow IPC binary | fastest | short-lived data shared with Arrow tools |
| `open_dataset()` | many files | partitioned Parquet | lazy | datasets larger than memory |
| `read_csv()` | one file | text | slow | data shared across any tool |

Use `read_parquet()` for analytic data that lives on disk between jobs. Use `open_dataset()` when the data is split across many Parquet files in a folder. Reach for `read_csv()` only when a person or a tool that cannot read Parquet needs the data.

[TIP]
**Always set col_select on wide files.** Reading a 200-column file when you need 5 columns wastes the columnar layout that makes Parquet fast. Naming the columns up front is the single biggest read_parquet() speedup.

## Common pitfalls

**Pointing read_parquet() at a folder.** read_parquet() reads exactly one file. A directory of Parquet files, such as the output of a partitioned write, will not load with a single read_parquet() call. Use `open_dataset("folder/")` instead, which treats the whole folder as one queryable dataset.

**Reading a huge file fully into memory.** With `as_data_frame = TRUE`, read_parquet() pulls every selected row into an R data frame. A file larger than your available RAM will fail or thrash. Switch to `open_dataset()` or `as_data_frame = FALSE` so rows are filtered before they are collected.

**Expecting Parquet to be human readable.** A `.parquet` file is compressed binary. You cannot open it in a text editor or diff it like a CSV. Inspect it from R with `read_parquet()` or print the schema with `schema(read_parquet("file.parquet", as_data_frame = FALSE))`.

[WARNING]
**A minimal arrow build cannot read every Parquet file.** Some compression codecs need the full arrow binary. If a read fails with a codec error, run `arrow::arrow_info()` to check capabilities, then reinstall arrow with `install.packages("arrow")` to pull a complete build.

## Try it yourself

**Try it:** Write the `iris` data frame to `iris.parquet`, then read back only the `Species` and `Sepal.Length` columns into `ex_iris`. Save the column names to `ex_names`.

```r title="Your turn: read selected columns"
# Try it: write iris, then read two columns back
write_parquet(iris, "iris.parquet")
ex_iris <- # your code here

ex_names <- # your code here
ex_names
#> Expected: "Species" "Sepal.Length"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
write_parquet(iris, "iris.parquet")
ex_iris <- read_parquet("iris.parquet", col_select = c(Species, Sepal.Length))
ex_names <- names(ex_iris)
ex_names
#> [1] "Species"      "Sepal.Length"
```

**Explanation:** col_select takes bare column names through tidyselect, so read_parquet() decodes only those two columns from the file and leaves the other three on disk.

</details>

## Related arrow functions

**read_parquet() sits among arrow's import and export helpers.** Pick the one that matches the file you have.

- `write_parquet()`: write a data frame to a `.parquet` file, the inverse of this function.
- `open_dataset()`: query a folder of Parquet files as one dataset, even if it exceeds memory.
- `read_feather()`: read an Arrow Feather or IPC file, an even faster short-term format.
- `read_csv_arrow()`: read a CSV with the Arrow engine when you want Arrow types.
- `read_rds()`: restore a single R object from an R-only `.rds` file.

For the full argument list, see the [arrow read_parquet reference](https://arrow.apache.org/docs/r/reference/read_parquet.html) on arrow.apache.org.

## FAQ

**What is a Parquet file in R?**

A Parquet file is a compressed, columnar table format used widely in data engineering. In R it is read with `read_parquet()` from the arrow package. Because each column is stored and compressed separately, a Parquet file is smaller than the same data as CSV and far faster to read, especially when you only need some of the columns.

**How do I read a Parquet file in R without the arrow package?**

The `nanoparquet` package reads Parquet with no system dependencies through `nanoparquet::read_parquet()`. It is lighter than arrow and good for simple imports. For partitioned datasets, lazy evaluation, or writing Parquet, the arrow package is still the fuller tool.

**How do I read only some columns from a Parquet file?**

Pass the `col_select` argument: `read_parquet("data.parquet", col_select = c(a, b))`. It accepts bare column names and tidyselect helpers like `starts_with()`. Because Parquet is columnar, unselected columns are never read off disk, so this is much faster than reading everything and dropping columns later.

**Can read_parquet() read a folder of Parquet files?**

No. read_parquet() reads exactly one file. To treat a directory of Parquet files as a single table, use `open_dataset("folder/")`. It scans the folder, combines the files, and lets you filter with dplyr verbs before pulling any rows into memory.

**Is Parquet faster than CSV in R?**

Yes, usually by a wide margin. A Parquet file is compressed and columnar, so read_parquet() reads less data off disk and skips type inference entirely. A CSV reader must decompress nothing but parse every character and guess column types. On large files Parquet imports are commonly several times faster.
