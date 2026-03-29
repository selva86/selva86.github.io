---
title: "readr vs read.csv vs fread: Which Data Import Function Is Fastest?"
slug: "readr-vs-read-csv-vs-fread"
description: "Benchmark read.csv(), readr::read_csv(), and data.table::fread() for speed, features, and output type. Choose the right CSV reader for your R project."
keywords: "readr vs read.csv, fread vs read_csv, R CSV import benchmark, fastest CSV reader R, data.table fread, read_csv speed"
mathjax: false
webr: true
date: "2026-03-30"
curriculum_id: "FR-impo-1"
post_type: "FR"
auto_link_terms: "readr vs read.csv|fread vs read_csv|CSV reader benchmark|fread"
auto_link_case_sensitive: false
fr_parent: "Importing-Data-in-R.html"
---

# readr vs read.csv vs fread: Which Data Import Function Is Fastest?

<p class="lead">R has three popular CSV readers: base R's <code>read.csv()</code>, readr's <code>read_csv()</code>, and data.table's <code>fread()</code>. For files under 1 MB, it doesn't matter. For 100 MB+, <code>fread()</code> can be 10–40x faster than <code>read.csv()</code>.</p>

The benchmarks are clear: `fread()` wins on raw speed, `read_csv()` wins on tidyverse integration, and `read.csv()` wins on zero dependencies. This guide gives you the numbers and tells you which to pick.

## Feature Comparison

| Feature | `read.csv()` | `read_csv()` | `fread()` |
|---------|-------------|-------------|----------|
| Package | base R | readr | data.table |
| Speed (1 GB file) | ~60 sec | ~10 sec | ~3 sec |
| Output type | data.frame | tibble | data.table |
| Strings → factor | Yes (old R default) | No | No |
| Auto-detect delimiter | No | No | Yes |
| Auto-detect encoding | No | No | Yes |
| Column type guessing | Basic | Smart | Smart |
| Progress bar | No | Yes | Yes |
| Select columns on read | No | `col_select=` | `select=` |
| Skip/limit rows | `skip=`, `nrows=` | `skip=`, `n_max=` | `skip=`, `nrows=` |
| Custom NA strings | `na.strings=` | `na=` | `na.strings=` |
| Parallel reading | No | No | Yes |
| Memory efficiency | Low | Medium | High |
| Dependencies | None | readr | data.table |

## Speed Benchmark

```r
library(readr)

# Create a test dataset: 3,200 rows × 11 columns
big <- do.call(rbind, replicate(100, mtcars, simplify = FALSE))
csv_text <- paste(capture.output(write.csv(big, row.names = FALSE)), collapse = "\n")
cat("Test data:", nrow(big), "rows ×", ncol(big), "columns\n\n")

# Benchmark: 10 reads each
t_base <- system.time(for(i in 1:10) read.csv(text = csv_text))
t_readr <- system.time(for(i in 1:10) read_csv(csv_text, show_col_types = FALSE))

cat("read.csv  (10 reads):", round(t_base["elapsed"], 3), "sec\n")
cat("read_csv  (10 reads):", round(t_readr["elapsed"], 3), "sec\n")
cat("\nSpeedup (read_csv over read.csv):", round(t_base["elapsed"] / t_readr["elapsed"], 1), "x\n")
```

> On large files (100 MB – 4 GB), benchmarks consistently show `fread()` at 5–40x faster than `read.csv()` and 2–8x faster than `read_csv()`. The gap grows with file size because `fread()` uses parallel parsing and memory-mapped I/O.

## Syntax Side by Side

```r
library(readr)

csv <- "name,age,score\nAlice,25,88.5\nBob,30,76.0\nCarol,28,92.3"

# Base R
df1 <- read.csv(text = csv, stringsAsFactors = FALSE)

# readr
df2 <- read_csv(csv, show_col_types = FALSE)

cat("read.csv output class:", class(df1), "\n")
cat("read_csv output class:", paste(class(df2), collapse = ", "), "\n")
cat("\nBoth produce the same data:\n")
print(df1)
```

```r
library(data.table)

csv <- "name,age,score\nAlice,25,88.5\nBob,30,76.0\nCarol,28,92.3"

# data.table
df3 <- fread(csv)
cat("fread output class:", paste(class(df3), collapse = ", "), "\n")
print(df3)
```

## When to Use Each

| Scenario | Best choice | Why |
|----------|------------|-----|
| Zero dependencies needed | `read.csv()` | Always available, no install |
| Tidyverse workflow | `read_csv()` | Returns tibble, clean messages, pipe-friendly |
| Large files (100 MB+) | `fread()` | Fastest, parallel parsing, memory efficient |
| Unknown delimiter | `fread()` | Auto-detects delimiter (comma, tab, pipe, etc.) |
| CRAN package development | `read.csv()` | No external dependency |
| Teaching beginners | `read_csv()` | Helpful messages, consistent API |
| Quick data exploration | `fread()` | Auto-detects everything, minimal arguments |

## Writing: write_csv vs write.csv vs fwrite

Speed differences apply to writing too.

```r
library(readr)

big <- do.call(rbind, replicate(100, mtcars, simplify = FALSE))

tf1 <- tempfile(); tf2 <- tempfile()

t_base <- system.time(write.csv(big, tf1, row.names = FALSE))
t_readr <- system.time(write_csv(big, tf2))

cat("write.csv:", round(t_base["elapsed"], 3), "sec\n")
cat("write_csv:", round(t_readr["elapsed"], 3), "sec\n")
```

## Practice Exercises

### Exercise 1: Compare Outputs

Read the same CSV with `read.csv` and `read_csv`. Compare the class and column types.

```r
library(readr)

csv <- "id,zipcode,active\n1,01234,TRUE\n2,90210,FALSE\n3,00501,TRUE"

# Read with both functions
# Compare: does zipcode keep leading zeros? Is active logical or character?

```

<details>
<summary>Click to reveal solution</summary>

```r
library(readr)

csv <- "id,zipcode,active\n1,01234,TRUE\n2,90210,FALSE\n3,00501,TRUE"

df_base <- read.csv(text = csv)
df_readr <- read_csv(csv, show_col_types = FALSE)

cat("read.csv types:\n"); str(df_base)
cat("\nread_csv types:\n"); str(df_readr)
cat("\nread.csv zipcode:", df_base$zipcode, "(leading zeros lost!)\n")
cat("read_csv zipcode:", df_readr$zipcode, "(also lost — need col_types)\n")

# Fix: force character
df_fixed <- read_csv(csv, col_types = cols(zipcode = col_character()))
cat("\nFixed zipcode:", df_fixed$zipcode, "\n")
```

**Explanation:** Both functions parse zipcode as integer by default, losing leading zeros. Use `col_types` in read_csv or `colClasses` in read.csv to force character type.

</details>

## Summary

| Function | Speed | Best for |
|----------|-------|----------|
| `read.csv()` | Slowest | Zero-dependency scripts |
| `read_csv()` | 3–5x faster | Tidyverse workflows |
| `fread()` | 5–40x faster | Large files, speed-critical code |

Use **`read_csv()`** as your everyday default. Switch to **`fread()`** for files over 100 MB. Use **`read.csv()`** only when you can't install any packages.

## FAQ

### Can I use fread() output with dplyr?

Yes. `fread()` returns a data.table which inherits from data.frame, so dplyr verbs work directly. For full tidyverse compatibility, convert with `as_tibble()`. Or use the `dtplyr` package for dplyr syntax with data.table speed.

### Why is fread() so much faster?

Three reasons: (1) parallel C-level parsing across multiple threads, (2) memory-mapped file reading that avoids copying data, and (3) intelligent sampling to determine column types without scanning the entire file.

### Does read_csv handle compressed files?

Yes. `read_csv("data.csv.gz")` automatically decompresses gzip, bzip2, and xz files. Same for `fread()`. Base `read.csv()` needs `gzfile("data.csv.gz")` wrapper.

## What's Next?

- [Importing Data in R](/Importing-Data-in-R.html) — the parent tutorial covering all formats
- [Apache Arrow in R](/Apache-Arrow-in-R.html) — for even faster I/O with Parquet files
- [Pipe Operator](/R-Pipe-Operator.html) — chain data import with transformation
