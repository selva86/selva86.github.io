---
title: "arrow write_parquet() in R: Save Data Frames to Parquet"
slug: arrow-write_parquet-in-R
description: "Learn arrow write_parquet() in R to save data frames as Parquet files. Covers syntax, compression codecs, type preservation, and write_csv differences."
keywords: "arrow write_parquet, write_parquet function R, arrow write_parquet examples, R write parquet file, write parquet in R, save data frame as parquet R, arrow write_dataset"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: readr--readxl--haven
fr_parent: Importing-Data-in-R.html
auto_link_terms: "write_parquet()|arrow write_parquet|arrow::write_parquet()|write Parquet file in R|write_parquet in R"
auto_link_case_sensitive: true
target_keyword: "arrow write_parquet"
sibling_block_enabled: true
difficulty: Beginner
---

# arrow write_parquet() in R: Save Data Frames to Parquet

<p class="lead">The arrow write_parquet() function saves an R data frame as a Parquet file. Parquet is a compressed, columnar binary format, so a write_parquet() export is smaller on disk and faster to reload than the same data written as CSV.</p>

[QUICK ANSWER]
write_parquet(df, "data.parquet")                        # write a data frame
write_parquet(df, "data.parquet", compression = "zstd")  # smaller file
write_parquet(df, "data.parquet", compression = "gzip")  # portable codec
write_parquet(df, "data.parquet", compression = "uncompressed") # no compression
write_parquet(df, "data.parquet", compression_level = 9) # tune compression effort
write_parquet(df, "data.parquet", chunk_size = 10000)    # rows per row group

[DECISION TREE: Is write_parquet() the right tool?]
- write one data frame to a Parquet file: write_parquet(df, "data.parquet")
- write a partitioned multi-file dataset: write_dataset(df, "folder/")
- write an Arrow Feather or IPC file: write_feather(df, "data.feather")
- write a portable text file: write_csv(df, "data.csv")
- save an R-only object exactly: write_rds(df, "obj.rds")
- read a Parquet file back into R: read_parquet("data.parquet")

## What write_parquet() does

**write_parquet() turns a data frame into a Parquet file.** You give it a data frame and an output path, and it writes the data in Apache Parquet's compressed, columnar layout. The file carries a typed schema, so column types are stored alongside the values rather than guessed on reload.

The function comes from the `arrow` package, which bundles the Apache Arrow C++ engine. Because Parquet writes each column as its own compressed block, the resulting file is usually a fraction of the size of an equivalent CSV. That same on-disk format is read natively by Spark, pandas, DuckDB, and many other tools, which makes Parquet a strong choice for sharing analytic data.

## Syntax and key arguments

**The signature is short, and most calls only need the first two arguments.** The rest tune compression and the internal row-group layout.

```r title="The write_parquet signature"
write_parquet(
  x,                       # data frame, tibble, or Arrow Table to write
  sink,                    # output path, or a connection
  compression = "snappy",  # snappy, gzip, zstd, brotli, lz4, or uncompressed
  compression_level = NULL,# higher means a smaller file and a slower write
  chunk_size = NULL,       # rows per row group; NULL lets arrow choose
  version = "2.4",         # Parquet format version
  use_dictionary = TRUE    # dictionary-encode repeated values
)
```

The argument you change most often is `compression`. The default `"snappy"` codec is fast and writes a moderately small file. Switch to `"zstd"` when disk space matters more than write speed, or `"gzip"` when another tool expects that codec. The `chunk_size` and `version` arguments rarely need changing.

[NOTE]
**Coming from Python pandas?** write_parquet() is the direct counterpart of `df.to_parquet("data.parquet")`. A file written by R reads straight into pandas, Spark, or DuckDB, because all of them share the same Parquet on-disk format.

## write_parquet() examples

**Start with a round trip.** Write a built-in dataset to a Parquet file, then read it back with `read_parquet()` to confirm the export worked.

```r title="Write a data frame to Parquet"
library(arrow)

write_parquet(mtcars, "cars.parquet")
file.exists("cars.parquet")
#> [1] TRUE
cars <- read_parquet("cars.parquet")
dim(cars)
#> [1] 32 11
```

The file appears on disk and reads back as a 32-row, 11-column tibble. No delimiter was written and no column type was flattened to text, because Parquet stores the schema inside the file.

**Choose a compression codec with the `compression` argument.** Each codec trades write speed against file size. The data is identical whichever codec you pick, so a file written with one codec reads back the same as any other.

```r title="Choose a compression codec"
write_parquet(mtcars, "zstd.parquet", compression = "zstd")
write_parquet(mtcars, "gzip.parquet", compression = "gzip")

nrow(read_parquet("zstd.parquet"))
#> [1] 32
nrow(read_parquet("gzip.parquet"))
#> [1] 32
```

Both files round-trip to the same 32 rows. Use `"zstd"` for the smallest file, the default `"snappy"` for the fastest write, and `"gzip"` when a downstream tool only understands gzip.

[KEY INSIGHT]
**The schema travels with the file.** write_parquet() records each column's type in the Parquet metadata, so the reader never has to infer types. That is why a Parquet round trip is both faster and more reliable than a CSV round trip.

**Parquet preserves column types.** A CSV export flattens factors and dates into plain text, so those types are rebuilt on every reload. A Parquet export keeps them, because the file stores a typed schema.

```r title="Parquet keeps factor and date types"
df <- data.frame(
  grp = factor(c("x", "y", "x")),
  day = as.Date("2026-01-01") + 0:2
)
write_parquet(df, "typed.parquet")
sapply(read_parquet("typed.parquet"), class)
#>      grp      day
#> "factor"   "Date"
```

The factor returns with its levels intact and the date column returns as a `Date`. This type fidelity makes Parquet a solid format for caching cleaned data between sessions.

**write_parquet() returns its input invisibly, so it fits inside a pipe.** You can filter or transform a data frame and write the result in one chain without breaking the flow.

```r title="write_parquet inside a dplyr pipe"
library(dplyr)

mtcars |>
  filter(mpg > 20) |>
  write_parquet("efficient.parquet")
nrow(read_parquet("efficient.parquet"))
#> [1] 14
```

The pipe filters `mtcars` to the 14 fuel-efficient cars and writes them straight to Parquet. Because write_parquet() passes its input through invisibly, the chain stays readable.

## write_parquet() vs write_csv() and alternatives

**write_parquet() is the compact columnar writer; write_csv() is the portable text writer.** The right choice depends on file size, on whether column types must survive, and on what tool reads the file next.

| Function | Writes | Format | Best for |
|----------|--------|--------|----------|
| `write_parquet()` | one file | columnar binary | analytic data, long-term storage |
| `write_feather()` | one file | Arrow IPC binary | fast short-lived exchange with Arrow tools |
| `write_dataset()` | many files | partitioned Parquet | data split by key, larger than memory |
| `write_csv()` | one file | text | sharing with tools that cannot read Parquet |

Use `write_parquet()` for analytic data that lives on disk between jobs. Use `write_dataset()` when the output should be split into many files by a partition key. Reach for `write_csv()` only when a person or a tool that cannot read Parquet needs the data.

[TIP]
**Switch to zstd for archival files.** The default snappy codec optimizes for write speed, but `compression = "zstd"` produces a noticeably smaller file for a small extra cost. For data you write once and read many times, that trade is almost always worth it.

## Common pitfalls

**write_parquet() overwrites an existing file without warning.** Calling it on a path that already holds a file replaces that file silently, with no prompt and no backup. Guard important paths with `file.exists()` before writing.

```r title="Guard against overwriting a file"
path <- "new_cars.parquet"
if (!file.exists(path)) {
  write_parquet(mtcars, path)
}
file.exists(path)
#> [1] TRUE
```

**write_parquet() writes exactly one file.** It cannot produce a partitioned, multi-file output. When you need data split into many files by a grouping key, use `write_dataset(df, "folder/", partitioning = "grp")` instead, which writes one folder of Parquet files.

**You cannot append rows to a Parquet file.** Parquet has no append mode, so write_parquet() always writes a complete file. To grow a dataset over time, write each batch as a separate file into one folder and read them together with `open_dataset()`.

[WARNING]
**A minimal arrow build cannot write every codec.** Codecs like `zstd` and `brotli` need the full arrow binary. If a write fails with a codec error, run `arrow::arrow_info()` to check capabilities, then reinstall arrow with `install.packages("arrow")` to pull a complete build.

## Try it yourself

**Try it:** Write the built-in `iris` data frame to `iris.parquet` using zstd compression, then read it back into `ex_iris`. Confirm it has 150 rows.

```r title="Your turn: write iris to Parquet"
# Try it: write iris with zstd compression, then read it back
write_parquet(iris, "iris.parquet", compression = "zstd")
ex_iris <- # your code here

nrow(ex_iris)
#> Expected: 150
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
write_parquet(iris, "iris.parquet", compression = "zstd")
ex_iris <- read_parquet("iris.parquet")
nrow(ex_iris)
#> [1] 150
```

**Explanation:** write_parquet() saves the data frame with the zstd codec, and read_parquet() reads it back into a tibble. The compression codec changes the file size, not the data, so the row count stays at 150.

</details>

## Related arrow functions

**write_parquet() sits among arrow's export and import helpers.** Pick the one that matches the output you need.

- `read_parquet()`: read a single Parquet file back into R, the inverse of this function.
- `write_dataset()`: write a partitioned, multi-file Parquet dataset to a folder.
- `write_feather()`: write an Arrow Feather or IPC file, a faster short-term format.
- `open_dataset()`: query a folder of Parquet files as one dataset, even if it exceeds memory.
- `write_rds()`: save a single R object to an R-only `.rds` file.

For the full argument list, see the [arrow write_parquet reference](https://arrow.apache.org/docs/r/reference/write_parquet.html) on arrow.apache.org.

## FAQ

**How do I write a data frame to a Parquet file in R?**

Load the arrow package and call `write_parquet(df, "data.parquet")`. The first argument is the data frame or tibble, and the second is the output path. The function writes the data in Parquet's compressed columnar format, stores the column types in the file, and returns the input data frame invisibly so it works inside a pipe.

**What compression should I use with write_parquet()?**

The default `"snappy"` codec writes quickly and is a safe general choice. Use `compression = "zstd"` when you want the smallest file and can spend a little more time writing, which suits archival data. Use `"gzip"` only when a downstream tool specifically expects gzip. All codecs produce a file that reads back to identical data.

**Can I append data to a Parquet file in R?**

No. Parquet has no append mode, so write_parquet() always writes a complete file and overwrites any file already at that path. To grow a dataset, write each new batch as a separate Parquet file inside one folder, then read the whole folder together with `open_dataset()`, which treats the files as a single table.

**Is a Parquet file smaller than a CSV file?**

Usually, yes, often by a wide margin. write_parquet() compresses each column separately and stores numbers in a compact binary form instead of as text. A CSV writer stores every value as characters with no compression by default. For large analytic tables, a Parquet file is commonly several times smaller than the same data as CSV.

**How do I write multiple Parquet files at once?**

Use `write_dataset()` rather than write_parquet(). Calling `write_dataset(df, "folder/", partitioning = "grp")` splits the data by the `grp` column and writes one Parquet file per partition into the folder. This is the standard way to create a dataset that `open_dataset()` can later query without loading everything into memory.
