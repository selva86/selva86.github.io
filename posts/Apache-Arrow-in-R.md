---
title: "Apache Arrow in R: Read Parquet Files & Run Fast In-Memory Analytics"
slug: "Apache-Arrow-in-R"
description: "Use the arrow package in R to read Parquet files, query datasets larger than RAM, and speed up data pipelines with zero-copy operations."
keywords: "arrow R, parquet R, read_parquet, open_dataset, feather R, Apache Arrow R, large data R"
mathjax: false
webr: true
date: "2026-03-30"
curriculum_id: "FR-impo-2"
post_type: "FR"
auto_link_terms: "Apache Arrow|parquet|read_parquet|arrow package"
auto_link_case_sensitive: false
fr_parent: "Importing-Data-in-R.html"
---

# Apache Arrow in R: Read Parquet Files & Run Fast In-Memory Analytics

<p class="lead">The <code>arrow</code> package lets you read Parquet files, query datasets larger than memory, and transfer data between R and Python with zero copying. It's the fastest way to work with large tabular data in R.</p>

CSV files are slow to read and waste disk space. Parquet files are compressed, columnar, and support schema metadata. The arrow package makes them a first-class citizen in R.

## Why Parquet Over CSV?

| Feature | CSV | Parquet |
|---------|-----|---------|
| File size (1M rows) | ~100 MB | ~15 MB |
| Read speed | Slow (parse text) | Fast (binary, columnar) |
| Column types | Guessed on read | Stored in metadata |
| Column selection | Read entire file | Read only needed columns |
| Compression | None (unless gzipped) | Built-in (snappy, zstd) |
| Missing values | "NA" string | Native null |

## Reading and Writing Parquet

```r
library(arrow)

# Write mtcars to Parquet
tf <- tempfile(fileext = ".parquet")
write_parquet(mtcars, tf)

# Read it back
df <- read_parquet(tf)
cat("Rows:", nrow(df), "Cols:", ncol(df), "\n")
head(df, 3)
```

```r
library(arrow)

# Read only specific columns (much faster for wide datasets)
tf <- tempfile(fileext = ".parquet")
write_parquet(mtcars, tf)

df <- read_parquet(tf, col_select = c("mpg", "hp", "wt"))
print(df)
```

## Querying Without Loading Into Memory

```r
library(arrow)
library(dplyr)

# Create a Parquet file
tf <- tempfile(fileext = ".parquet")
write_parquet(mtcars, tf)

# Open as an Arrow dataset — nothing loaded yet
ds <- open_dataset(tf)

# Query with dplyr syntax — executed lazily by Arrow
result <- ds |>
  filter(mpg > 20) |>
  select(mpg, hp, wt) |>
  collect()  # collect() triggers execution

cat("Filtered", nrow(result), "rows from dataset\n")
print(result)
```

## Feather Format

Feather is Arrow's native file format — even faster than Parquet for R-to-R workflows (no compression overhead).

```r
library(arrow)

tf <- tempfile(fileext = ".feather")
write_feather(mtcars, tf)
df <- read_feather(tf)
cat("Feather round-trip: ", nrow(df), "rows\n")
head(df, 3)
```

## When to Use Arrow

| Scenario | Use Arrow? |
|----------|-----------|
| Files over 100 MB | Yes — Parquet is faster than CSV |
| Need to read only a few columns from a wide file | Yes — columnar format reads only needed columns |
| Sharing data between R and Python | Yes — zero-copy transfer |
| Small CSV files under 10 MB | No — read_csv is fine |
| Need human-readable format | No — Parquet is binary |

## Summary

| Function | Purpose |
|----------|---------|
| `write_parquet(df, path)` | Save data frame as Parquet |
| `read_parquet(path)` | Read Parquet into R |
| `open_dataset(path)` | Lazy query without loading |
| `write_feather(df, path)` | Save as Feather (faster, no compression) |
| `read_feather(path)` | Read Feather into R |

## FAQ

### Do I need to install anything besides the R package?

No. `install.packages("arrow")` includes the C++ Arrow library. It's a large install (~100 MB) but fully self-contained.

### Can I read Parquet files created by Python/Spark?

Yes. Parquet is a cross-language standard. Files created by PySpark, pandas, or any other Arrow-compatible tool are fully readable in R.

## What's Next?

- [Importing Data in R](/Importing-Data-in-R.html) — the parent tutorial covering all formats
- [readr vs read.csv vs fread](/readr-vs-read-csv-vs-fread.html) — CSV reader comparison
- [dplyr filter & select](/dplyr-filter-select.html) — manipulate your Arrow-loaded data
