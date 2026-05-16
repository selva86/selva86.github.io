---
title: "arrow read_feather() in R: Read Feather Files Fast"
slug: arrow-read_feather-in-R
description: "Learn arrow read_feather() in R to load Feather and Arrow IPC files fast. Covers syntax, col_select, type preservation, Feather vs Parquet, and pitfalls."
keywords: "arrow read_feather, read_feather function R, arrow read_feather examples, read feather file R, R read feather, feather vs parquet R"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: readr--readxl--haven
fr_parent: Importing-Data-in-R.html
auto_link_terms: "read_feather()|arrow read_feather|arrow::read_feather()|read feather file in R|read_feather in R"
auto_link_case_sensitive: true
target_keyword: "arrow read_feather"
sibling_block_enabled: true
difficulty: Beginner
---

# arrow read_feather() in R: Read Feather Files Fast

<p class="lead">The arrow read_feather() function loads a Feather file into an R data frame in one call. Feather is the Arrow IPC format, a binary layout tuned for raw read speed, so read_feather() imports are among the fastest ways to move a table on or off disk.</p>

[QUICK ANSWER]
read_feather("data.feather")                                 # read a whole file
read_feather("data.feather", col_select = c(mpg, hp))         # read only some columns
read_feather("data.arrow")                                    # .arrow extension works too
read_feather("data.feather", as_data_frame = FALSE)           # return an Arrow Table
read_feather("data.feather", col_select = starts_with("S"))   # tidyselect columns
nrow(read_feather("data.feather"))                            # check row count

[DECISION TREE: Is read_feather() the right tool?]
- read one Feather or Arrow IPC file fast: read_feather("data.feather")
- read a compressed columnar file: read_parquet("data.parquet")
- read many files as one dataset: open_dataset("folder/")
- read a plain CSV or text table: read_csv("data.csv")
- restore an R-only saved object: read_rds("obj.rds")
- write a data frame to Feather: write_feather(df, "data.feather")

## What read_feather() does

**read_feather() reads one Feather file into R.** A Feather file stores a table in the Arrow IPC format, a binary layout that R, Python, and Julia all read with no conversion. You hand read_feather() a path and it returns a tibble with column types already set, so nothing is guessed the way a CSV reader has to guess.

The function comes from the `arrow` package, which bundles the Apache Arrow C++ engine. Feather was designed for one job: move a data frame between processes and languages as fast as the disk allows. Because the on-disk layout mirrors Arrow's in-memory layout, read_feather() does almost no decoding work, which is what makes it quick.

## Syntax and key arguments

**The signature is short, and `col_select` does most of the tuning.** You usually pass just `file`, and reach for `col_select` when the file is wide and you only need a few columns.

```r title="The read_feather signature"
read_feather(
  file,                  # path, URL, or connection to a .feather file
  col_select = NULL,     # tidyselect columns to read; NULL reads all
  as_data_frame = TRUE,  # TRUE returns a tibble; FALSE returns an Arrow Table
  mmap = TRUE            # memory-map the file for faster local reads
)
```

The `col_select` argument accepts the same tidyselect helpers as `dplyr::select()`, such as `starts_with()` and `c()`. Setting `as_data_frame = FALSE` returns a lazy Arrow Table instead of pulling everything into an R data frame. The `mmap` argument memory-maps the file and rarely needs changing.

[NOTE]
**Coming from Python pandas?** read_feather() is the direct counterpart of `pandas.read_feather()`. A Feather file written by pandas or Julia reads into R untouched, because all three share the Arrow IPC format on disk.

## read_feather() examples

**Start with a round trip.** Write a built-in dataset to a Feather file with `write_feather()`, then read it back so every example has a real file to work with.

```r title="Write and read a Feather file"
library(arrow)

write_feather(mtcars, "cars.feather")
cars <- read_feather("cars.feather")
dim(cars)
#> [1] 32 11
```

The data returns as a 32-row, 11-column tibble. No delimiter was parsed and no column type was inferred, because the Feather file stored the schema alongside the data.

**Read only the columns you need.** Pass `col_select` and read_feather() decodes just those columns, leaving the rest on disk. Feather is columnar, so naming columns up front is far faster than reading everything and dropping columns later.

```r title="Read only selected columns"
small <- read_feather("cars.feather", col_select = c(mpg, cyl, hp))
names(small)
#> [1] "mpg" "cyl" "hp"
nrow(small)
#> [1] 32
```

Only three columns came back. The other eight were never read off disk.

[KEY INSIGHT]
**Feather mirrors Arrow's memory layout on disk.** That single fact explains the speed: read_feather() does not parse or transcode anything, it maps the file's bytes almost straight into an R column. There is no format gap to cross.

**Feather preserves column types.** A CSV round trip flattens factors and dates into text, so you rebuild those types on every reload. A Feather round trip keeps them, because the file carries a typed schema.

```r title="Feather keeps factor and date types"
df <- data.frame(
  grp = factor(c("a", "b", "a")),
  day = as.Date("2026-01-01") + 0:2
)
write_feather(df, "typed.feather")
restored <- read_feather("typed.feather")
sapply(restored, class)
#>      grp      day
#> "factor"   "Date"
```

The factor returns with its levels intact and the date column returns as a `Date`. This type fidelity makes Feather a reliable cache for cleaned data between sessions.

**Return an Arrow Table instead of a data frame.** Set `as_data_frame = FALSE` when a file is too wide to pull fully into memory. The Table is a lazy handle you can filter before collecting.

```r title="Read as an Arrow Table"
tbl <- read_feather("cars.feather", as_data_frame = FALSE)
class(tbl)[1]
#> [1] "Table"
tbl$num_rows
#> [1] 32
```

The Table reports 32 rows without materializing them as an R data frame. You can run dplyr verbs on it and call `collect()` only when you need the result in memory.

## read_feather() vs read_parquet() and alternatives

**read_feather() is the fast IPC reader; read_parquet() is the compact archival reader.** Both return a tibble, so the choice comes down to whether you are optimizing for read speed or for file size.

| Function | Reads | Format | Optimized for | Best for |
|----------|-------|--------|---------------|----------|
| `read_feather()` | one file | Arrow IPC binary | raw speed | caching, cross-language handoff |
| `read_parquet()` | one file | columnar binary | small file size | long-term analytic storage |
| `open_dataset()` | many files | partitioned files | lazy queries | data larger than memory |
| `read_csv()` | one file | text | portability | sharing with any tool |

Use `read_feather()` for short-lived data: a cache between R sessions, or a handoff to a Python or Julia process. Use `read_parquet()` when the file is archived for months and disk size matters. Reach for `read_csv()` only when a person or tool that cannot read Arrow needs the data.

[TIP]
**Set col_select on wide files.** Reading a 200-column file when you need 5 columns wastes the columnar layout that makes Feather fast. Naming the columns up front is the single biggest read_feather() speedup.

## Common pitfalls

**Confusing Feather V1 and V2.** Modern `write_feather()` produces Feather V2, which is the Arrow IPC format. Files written years ago by the old `feather` package are V1. read_feather() reads both, but only V2 supports compression and the full Arrow type set. Always write V2, which is the default.

**Pointing read_feather() at a folder.** read_feather() reads exactly one file. A directory of Feather files will not load with a single call. Use `open_dataset("folder/", format = "feather")` instead, which treats the whole folder as one queryable dataset.

**Treating Feather as a long-term archive.** Feather trades file size for speed, so a Feather file is usually larger than the same data as Parquet. For data you keep for months, write Parquet. Keep Feather for caches and process-to-process transfer where speed matters more than bytes.

[WARNING]
**A minimal arrow build cannot read every Feather file.** Compressed Feather V2 files need codecs that ship only with the full arrow binary. If a read fails with a codec error, run `arrow::arrow_info()` to check capabilities, then reinstall arrow with `install.packages("arrow")` to pull a complete build.

## Try it yourself

**Try it:** Write the `iris` data frame to `iris.feather`, then read back only the `Species` and `Sepal.Length` columns into `ex_iris`. Save the column names to `ex_names`.

```r title="Your turn: read selected columns"
# Try it: write iris, then read two columns back
write_feather(iris, "iris.feather")
ex_iris <- # your code here

ex_names <- # your code here
ex_names
#> Expected: "Species" "Sepal.Length"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
write_feather(iris, "iris.feather")
ex_iris <- read_feather("iris.feather", col_select = c(Species, Sepal.Length))
ex_names <- names(ex_iris)
ex_names
#> [1] "Species"      "Sepal.Length"
```

**Explanation:** col_select takes bare column names through tidyselect, so read_feather() decodes only those two columns from the file and leaves the other three on disk.

</details>

## Related arrow functions

**read_feather() sits among arrow's import and export helpers.** Pick the one that matches the file you have.

- `write_feather()`: write a data frame to a `.feather` file, the inverse of this function.
- `read_parquet()`: read a compressed Parquet file, better for long-term storage.
- `read_ipc_stream()`: read the streaming Arrow IPC format rather than the file format.
- `open_dataset()`: query a folder of Feather or Parquet files as one dataset.
- `read_rds()`: restore a single R object from an R-only `.rds` file.

For the full argument list, see the [arrow read_feather reference](https://arrow.apache.org/docs/r/reference/read_feather.html) on arrow.apache.org.

## FAQ

**What is a Feather file in R?**

A Feather file is a binary table stored in the Apache Arrow IPC format. In R it is read with `read_feather()` from the arrow package. Because the file layout mirrors Arrow's in-memory layout, reading it involves almost no parsing, which makes Feather one of the fastest formats for moving a data frame on or off disk.

**What is the difference between Feather and Parquet in R?**

Both are columnar binary formats read by the arrow package, but they optimize for different goals. Feather, read with `read_feather()`, is tuned for raw speed and cross-language handoff. Parquet, read with `read_parquet()`, is more heavily compressed and tuned for small file size and long-term storage. Use Feather for caches, Parquet for archives.

**Is Feather faster than Parquet in R?**

Usually yes for reading, because Feather does little decoding while Parquet must decompress and decode columns. The gap is widest on local disks. Parquet, however, produces smaller files, so it can win when input and output are bound by network or disk size rather than CPU. For repeated reads of cached data, Feather is the faster choice.

**Can read_feather() read a folder of Feather files?**

No. read_feather() reads exactly one file. To treat a directory of Feather files as a single table, use `open_dataset("folder/", format = "feather")`. It scans the folder, combines the files, and lets you filter with dplyr verbs before pulling any rows into memory.

**How do I read only some columns from a Feather file?**

Pass the `col_select` argument: `read_feather("data.feather", col_select = c(a, b))`. It accepts bare column names and tidyselect helpers like `starts_with()`. Because Feather is columnar, unselected columns are never read off disk, so this is much faster than reading everything and dropping columns afterward.
