---
title: "fst write_fst() in R: Fast Save Data Frames to Disk"
slug: fst-write_fst-in-R
description: "Learn how to use write_fst() in R to save data frames to fast, compressed .fst files. Covers the compress argument, syntax, pitfalls, and format comparisons."
keywords: "fst write_fst, write_fst function R, fst write_fst examples, R save data frame fst, write_fst compress, fst package write file, fast write data frame R"
mathjax: false
webr: true
date: "2026-05-16"
post_type: PSEO
category_id: function-deep
subcategory_id: readr--readxl--haven
fr_parent: Importing-Data-in-R.html
auto_link_terms: "write_fst()|fst write_fst|fst::write_fst()|write fst file|write_fst in R"
auto_link_case_sensitive: true
target_keyword: "fst write_fst"
sibling_block_enabled: true
difficulty: Beginner
---

# fst write_fst() in R: Fast Save Data Frames to Disk

<p class="lead">The fst <code>write_fst()</code> function saves a data frame to a fast, compressed binary <code>.fst</code> file that reloads at multiple gigabytes per second, far quicker than CSV or RDS.</p>

[QUICK ANSWER]
write_fst(df, "data.fst")                 # default, compress = 50
write_fst(df, "data.fst", compress = 0)   # fastest write, largest file
write_fst(df, "data.fst", compress = 100) # smallest file, slowest write
write_fst(df, path)                       # overwrites path silently
write_fst(df, "data.fst")                 # returns df invisibly, pipe-safe
metadata_fst("data.fst")                  # inspect a file you wrote
read_fst("data.fst")                      # round-trip: load it back
fst::write_fst(df, "data.fst")            # call without attaching fst

[DECISION TREE: Is write_fst() the right tool?]
- save a data frame for fast reload: write_fst(df, "d.fst")
- save any R object (model, list): saveRDS(obj, "d.rds")
- share with non-R users (Excel): readr::write_csv(df, "d.csv")
- cross-language columnar storage: arrow::write_parquet(df, "d.parquet")
- append rows to an existing file: not supported, rewrite the file
- read a column subset back fast: read_fst("d.fst", columns = "x")

## What write_fst() does

**write_fst() saves a data frame to a fast, compressed binary file.** It is the writer half of the `fst` package, a serialization format built for speed. You hand it a data frame and a file path, and it stores every column to disk in a `.fst` file that `read_fst()` can later load at multiple gigabytes per second.

The format compresses each column with a type-specific compressor, so `.fst` files are usually smaller than CSV or `.rds` while loading much faster. The file also supports random access, meaning a later read can pull specific columns or row ranges without loading the whole dataset.

This makes `write_fst()` a natural fit for caching intermediate results in a data pipeline. Writing a stage's cleaned output to a `.fst` file lets the next stage, or a teammate, reload it far faster than a CSV. The format is R-specific, so it suits internal storage rather than sharing data across languages.

## write_fst() syntax and arguments

**The function takes a data frame and a path, plus an optional compression level.** The full signature is short:

```r title="The write_fst signature"
write_fst(x, path, compress = 50, uncompress_finished = NULL)
```

Only the first two arguments are required. The table below lists every argument.

| Argument | Default | Description |
|---|---|---|
| `x` | required | The data frame or data.table to write |
| `path` | required | File path for the output `.fst` file |
| `compress` | `50` | Compression level, from `0` (none) to `100` (maximum) |
| `uncompress_finished` | `NULL` | Advanced callback, rarely needed |

The `x` argument must be a data frame or `data.table`; lists and model objects are not accepted. The `path` argument is an ordinary file path, and the `.fst` extension is a convention rather than a requirement. The `compress` argument is the only knob most users ever touch.

`write_fst()` writes the file as a side effect and returns the input data frame `x` invisibly. Because the return value is the data itself, the call can sit inside a pipe without breaking the flow, letting you save a checkpoint mid-pipeline.

## Saving data frames: four common cases

**Most write_fst() calls are a single line.** Start by creating a sample sales data frame and writing it to disk with the defaults.

```r title="Save a data frame with write_fst"
library(fst)

sales <- data.frame(
  region  = sample(c("North", "South", "East", "West"), 50000, replace = TRUE),
  product = sample(c("A", "B", "C"), 50000, replace = TRUE),
  units   = sample(1:100, 50000, replace = TRUE),
  price   = round(runif(50000, 5, 50), 2)
)

write_fst(sales, "sales.fst")
file.exists("sales.fst")
#> [1] TRUE
```

That single line creates `sales.fst` on disk. The file holds all 50,000 rows and four columns, each compressed independently. No further configuration is needed for a typical save.

The second case is tuning the file size. The default `compress = 50` is a balanced middle ground, but you can move the dial. A lower level writes faster and produces a larger file; a higher level spends more CPU time to squeeze the file smaller. Set `compress` explicitly and compare the results with `file.size()` to see the trade in bytes.

```r title="Tune the compress argument"
write_fst(sales, "sales_fast.fst", compress = 0)
write_fst(sales, "sales_small.fst", compress = 100)

file.size("sales_fast.fst")
#> [1] 631208
file.size("sales_small.fst")
#> [1] 410336
```

[TIP]
**Leave compress near the default for most work.** `compress = 50` already shrinks files substantially while staying fast. Push toward `100` only for archival data you write once and read many times.

Here `compress = 100` produced a file roughly a third smaller than `compress = 0`. The ratio depends on how repetitive your data is.

The third case is overwriting. `write_fst()` has no append mode, so each call replaces the file at `path` silently and completely. There is no warning and no merge; the old contents are simply gone. To add rows to an existing dataset, read it back, bind the new rows in memory, and rewrite the whole file. The fourth case uses the invisible return value: because `write_fst()` returns `x`, you can save a snapshot inside a pipe and keep working with the same data frame in the next step.

```r title="write_fst returns the data invisibly"
saved <- write_fst(sales, "sales.fst")
nrow(saved)
#> [1] 50000
identical(saved, sales)
#> [1] TRUE
```

## write_fst() vs saveRDS(), write_csv(), and other formats

**write_fst() wins when you reload tabular data often and want column-level random access.** The comparison below shows where each writer fits.

| Format | Writer | Write speed | Cross-language | Random access |
|---|---|---|---|---|
| fst | `write_fst()` | Fastest | No, R only | Yes, columns and rows |
| RDS | `saveRDS()` | Moderate | No, R only | No |
| CSV | `write_csv()` | Slow | Yes | No |
| Parquet | `arrow::write_parquet()` | Fast | Yes | Yes |

The decision rule is simple. Use `write_fst()` for data frames you reload frequently inside R, especially large ones where load time matters. Use `saveRDS()` when you must store a non-tabular object such as a fitted model, a nested list, or anything that is not a flat table. Use `write_csv()` or Parquet when other tools or languages need to read the file, since `.fst` is an R-only format. Parquet is the better choice when you want both speed and cross-language portability.

A round-trip back through `read_fst()` confirms the data survives the save intact. The column types, values, and order all come back exactly as written.

```r title="Read the file back with read_fst"
back <- read_fst("sales.fst")
head(back, 3)
#>   region product units price
#> 1   West       B    47 23.10
#> 2  North       A    12 41.55
#> 3   East       C    88  9.07
```

## Common pitfalls

**A .fst file stores columns only, so anything outside the column grid is lost.** Three mistakes trip up new users.

First, row names are dropped. `write_fst()` keeps no row-name vector, so reading the file back gives default integer row names.

```r title="Row names are not preserved"
write_fst(mtcars, "mt.fst")
rownames(read_fst("mt.fst"))[1:3]
#> [1] "1" "2" "3"
```

The car names that `mtcars` stores as row names are gone. The fix is to move identifiers into a real column before writing, for example with `tibble::rownames_to_column()`.

[WARNING]
**write_fst() rejects non-atomic columns.** List-columns and nested data-frame columns cause an error because `.fst` stores only flat, atomic vectors. Unnest those columns first, or fall back to `saveRDS()` for objects that are not purely tabular.

Second, custom attributes and grouping disappear. A grouped tibble comes back as a plain data frame with its groups dropped, and any attributes you attached with `attr()` are not restored. If grouping or metadata matters, record it in the data itself or re-apply it after reading. Third, `write_fst()` overwrites without warning, so a typo in `path` can silently replace a file you meant to keep. Build paths with `file.path()` and check them before writing to a shared directory.

## Try it yourself

**Try it:** Save the built-in `iris` data frame to a file called `iris.fst` using a compression level of 80, then confirm the file was created.

```r title="Your turn: write iris to fst"
# Try it: write iris.fst with compress = 80
ex_path <- # your code here

file.exists("iris.fst")
#> Expected: TRUE
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
write_fst(iris, "iris.fst", compress = 80)
file.exists("iris.fst")
#> [1] TRUE
```

**Explanation:** The first argument is the data frame, the second is the destination path, and `compress = 80` requests strong compression. `write_fst()` writes the file as a side effect, so `file.exists()` returns `TRUE` afterward.

</details>

## Related fst and data import functions

These functions pair naturally with `write_fst()` for reading and inspecting `.fst` files:

- `read_fst()` reads a `.fst` file back, optionally selecting columns or row ranges.
- `metadata_fst()` inspects a `.fst` file's column names, types, and size without loading data.
- `threads_fst()` sets the number of threads `fst` uses for reading and writing.
- `write_rds()` and `saveRDS()` serialize non-tabular R objects.
- `write_csv()` exports a data frame to a portable, cross-language text file.

The official [fst write_fst() reference](https://www.fstpackage.org/reference/write_fst.html) documents every argument in full detail.

## FAQ

**Is write_fst() faster than saveRDS()?**

Yes, in most cases by a wide margin. `write_fst()` uses multi-threading and type-specific column compressors, so writing a large data frame is typically several times faster than `saveRDS()`. Reading the file back is faster still. The gap widens as the data frame grows, which is why `fst` is a common choice for caching intermediate results in data pipelines.

**What compression level should I use with write_fst()?**

The default `compress = 50` suits almost all work. It produces a small file without slowing the write noticeably. Use `compress = 0` when write speed matters more than disk space, such as temporary scratch files. Use `compress = 100` for archival data written once and read many times, where the smaller file pays off over repeated reads.

**Can write_fst() append rows to an existing .fst file?**

No. `write_fst()` has no append mode and every call overwrites the file completely. To add rows, read the existing file with `read_fst()`, combine it with the new rows using `bind_rows()`, then write the full data frame back. For frequent appends, a database or Parquet dataset is a better fit.

**Does write_fst() work with data.table?**

Yes. `write_fst()` accepts both `data.frame` and `data.table` objects. When you read the file back with `read_fst()`, you can pass `as.data.table = TRUE` to return a `data.table` directly. The `fst` package is designed to integrate cleanly with `data.table` workflows.

**What is the difference between write_fst() and write.fst()?**

They are the same function. `write.fst()` is a deprecated alias kept for backward compatibility with early versions of the package. Use `write_fst()` with an underscore in all new code, since it matches the current `fst` naming convention and the underscore form is the one the documentation maintains.
