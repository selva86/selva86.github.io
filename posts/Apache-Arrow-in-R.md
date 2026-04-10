---
title: "Apache Arrow in R: Read Parquet Files & Run Fast In-Memory Analytics"
slug: "Apache-Arrow-in-R"
description: "Use the arrow package in R to read Parquet files, query datasets larger than RAM, and speed up data pipelines with columnar storage and zero-copy."
keywords: "arrow R, parquet R, read_parquet, open_dataset, feather R, Apache Arrow R, large data R, columnar storage"
mathjax: false
webr: true
date: "2026-03-30"
curriculum_id: "FR-impo-2"
post_type: "FR"
auto_link_terms: "Apache Arrow|parquet|read_parquet|arrow package|Parquet files"
auto_link_case_sensitive: false
fr_parent: "Importing-Data-in-R.html"
---

# Apache Arrow in R: Read Parquet Files & Run Fast In-Memory Analytics

<p class="lead">The <code>arrow</code> package reads Parquet files (compressed, columnar, typed) in a fraction of the time CSV takes. It also queries datasets larger than RAM without loading them fully, and transfers data to Python with zero copying.</p>

CSV files are text — slow to parse, untyped, and bloated. A 1 GB CSV typically shrinks to 100–200 MB as Parquet, reads 10x faster, and preserves column types. If you work with large data, Parquet + arrow is the upgrade path from CSV.

## Why Parquet Over CSV?

| Feature | CSV | Parquet |
|---------|-----|---------|
| File size (1M rows) | ~100 MB | ~15 MB |
| Read speed | Slow (parse text) | Fast (binary, columnar) |
| Column types | Guessed on read | Stored in file metadata |
| Read subset of columns | Must read entire file | Reads only selected columns |
| Compression | None (or gzip entire file) | Per-column (snappy, zstd, gzip) |
| Missing values | "NA" text string | Native null representation |
| Cross-language | Universal but slow | R, Python, Spark, Rust, Java |

## Reading and Writing Parquet

```r
library(arrow)

# Write mtcars as Parquet
tf <- tempfile(fileext = ".parquet")
write_parquet(mtcars, tf)

# File is much smaller than CSV equivalent
csv_size <- nchar(paste(capture.output(write.csv(mtcars)), collapse = "\n"))
parquet_size <- file.size(tf)
cat("CSV equivalent:", csv_size, "bytes\n")
cat("Parquet:", parquet_size, "bytes\n")
cat("Compression ratio:", round(csv_size / parquet_size, 1), "x\n")
```

```r
library(arrow)

# Read Parquet back — column types preserved automatically
tf <- tempfile(fileext = ".parquet")
write_parquet(mtcars, tf)

df <- read_parquet(tf)
cat("Rows:", nrow(df), "  Cols:", ncol(df), "\n\n")
head(df, 4)
```

### Read Only Specific Columns

For wide datasets, this is a major speed win — unneeded columns are never loaded.

```r
library(arrow)

tf <- tempfile(fileext = ".parquet")
write_parquet(mtcars, tf)

# Read only 3 of 11 columns
subset <- read_parquet(tf, col_select = c(mpg, hp, wt))
print(subset[1:5, ])
```

## Lazy Queries with open_dataset()

`open_dataset()` opens a Parquet file (or directory of files) without loading data into memory. You write dplyr-style queries that Arrow's C++ engine executes at `collect()` time.

```r
library(arrow)
library(dplyr)

tf <- tempfile(fileext = ".parquet")
write_parquet(mtcars, tf)

# Open lazily — no data in memory yet
ds <- open_dataset(tf)
cat("Dataset opened (0 bytes in R memory)\n")

# Build a query (still lazy)
query <- ds |>
  filter(mpg > 20, cyl == 4) |>
  select(mpg, hp, wt) |>
  arrange(desc(mpg))

# Execute and bring results into R
result <- collect(query)
cat("Collected", nrow(result), "rows:\n")
print(result)
```

> For datasets that don't fit in RAM, `open_dataset()` + dplyr verbs + `collect()` lets you filter and aggregate on disk. Only the final result enters R memory.

## Feather Format

Feather is Arrow's uncompressed native format — faster than Parquet for R-to-R transfers (no decompression overhead) but larger files.

```r
library(arrow)

tf_feather <- tempfile(fileext = ".feather")
tf_parquet <- tempfile(fileext = ".parquet")

write_feather(mtcars, tf_feather)
write_parquet(mtcars, tf_parquet)

cat("Feather size:", file.size(tf_feather), "bytes\n")
cat("Parquet size:", file.size(tf_parquet), "bytes\n")
cat("Feather is larger but reads faster (no decompression)\n")

df <- read_feather(tf_feather)
head(df, 3)
```

## When to Use Arrow

| Scenario | Use Arrow? | Why |
|----------|-----------|-----|
| Files > 100 MB | Yes | Parquet is faster than CSV |
| Only need a few columns from a wide file | Yes | Columnar reads only needed columns |
| Data shared between R and Python | Yes | Zero-copy via Arrow memory format |
| Datasets larger than RAM | Yes | open_dataset() queries on disk |
| Small files < 10 MB | Optional | read_csv is fine for small files |
| Need human-readable format | No | Parquet is binary |

## Practice Exercises

### Exercise 1: Round-Trip Parquet

Write iris to Parquet, read back only Petal columns + Species, and verify types are preserved.

```r
library(arrow)

# Write iris to Parquet
# Read back only Petal.Length, Petal.Width, Species
# Verify Species is still a factor

```

<details>
<summary>Click to reveal solution</summary>

```r
library(arrow)

tf <- tempfile(fileext = ".parquet")
write_parquet(iris, tf)

subset <- read_parquet(tf, col_select = c(Petal.Length, Petal.Width, Species))
cat("Columns:", names(subset), "\n")
cat("Species class:", class(subset$Species), "\n")
head(subset, 5)
```

**Explanation:** Parquet preserves factor levels, dates, and other R types in metadata. When you read the file back, column types are restored automatically — no `col_types` specification needed.

</details>

## Summary

| Function | Purpose |
|----------|---------|
| `write_parquet(df, path)` | Save as compressed Parquet |
| `read_parquet(path)` | Read Parquet into R |
| `read_parquet(path, col_select=)` | Read specific columns only |
| `open_dataset(path)` | Open lazily for dplyr queries |
| `collect()` | Execute lazy query, bring into R |
| `write_feather(df, path)` | Save as uncompressed Feather |
| `read_feather(path)` | Read Feather into R |

## FAQ

### Do I need to install anything besides the R package?

No. `install.packages("arrow")` bundles the C++ Arrow library. It's a large initial install (~100 MB) but fully self-contained — no system dependencies.

### Can I read Parquet files created by Python or Spark?

Yes. Parquet is a cross-language standard. Files created by PySpark, pandas, DuckDB, or any Arrow-compatible tool are fully readable in R and vice versa.

### How does Arrow compare to DuckDB for large data?

Arrow excels at file I/O and cross-language interop. DuckDB excels at SQL-style analytics. They integrate well — `duckdb::tbl()` can query Arrow datasets directly. Use Arrow for reading/writing and DuckDB for complex queries.

## Continue Learning

- [Importing Data in R](/Importing-Data-in-R.html) — the parent tutorial covering all formats
- [readr vs read.csv vs fread](/readr-vs-read-csv-vs-fread.html) — CSV reader comparison
- [Pipe Operator](/R-Pipe-Operator.html) — chain Arrow reads with dplyr
