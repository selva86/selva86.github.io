---
title: "readr vs read.csv vs fread: Which Data Import Function Is Fastest?"
slug: "readr-vs-read-csv-vs-fread"
description: "Benchmark read.csv(), readr::read_csv(), and data.table::fread() for speed, features, and output type. Choose the right CSV reader for your R project."
keywords: "readr vs read.csv, fread vs read_csv, R CSV import benchmark, fastest CSV reader R, data.table fread"
mathjax: false
webr: true
date: "2026-03-30"
curriculum_id: "FR-impo-1"
post_type: "FR"
auto_link_terms: "readr vs read.csv|fread vs read_csv|CSV reader benchmark"
auto_link_case_sensitive: false
fr_parent: "Importing-Data-in-R.html"
---

# readr vs read.csv vs fread: Which Data Import Function Is Fastest?

<p class="lead">R has three popular CSV readers: base R's <code>read.csv()</code>, readr's <code>read_csv()</code>, and data.table's <code>fread()</code>. This comparison benchmarks speed, compares features, and tells you when to use each.</p>

For small files (under 10 MB), it doesn't matter — all three finish instantly. For large files (100 MB+), the difference is dramatic: `fread()` can be 10x faster than `read.csv()`.

## Feature Comparison

| Feature | `read.csv()` | `read_csv()` | `fread()` |
|---------|-------------|-------------|----------|
| Package | base R | readr | data.table |
| Speed (1GB file) | ~60 sec | ~15 sec | ~5 sec |
| Output type | data.frame | tibble | data.table |
| String → factor | Yes (default) | No | No |
| Progress bar | No | Yes | Yes |
| Column type guessing | Basic | Smart | Smart |
| Custom NA strings | `na.strings` | `na` | `na.strings` |
| Select columns | No | `col_select` | `select` |
| Auto-detect delimiter | No | No | Yes |
| Dependencies | None | readr | data.table |

## Speed Benchmark

```r
# Benchmark with mtcars repeated to simulate a larger dataset
library(readr)

# Create a moderately sized CSV string (~3000 rows)
big <- do.call(rbind, replicate(100, mtcars, simplify = FALSE))
csv_text <- paste(capture.output(write.csv(big, row.names = FALSE)), collapse = "\n")
cat("Test data:", nrow(big), "rows x", ncol(big), "columns\n\n")

t1 <- system.time(for(i in 1:10) read.csv(text = csv_text))
t2 <- system.time(for(i in 1:10) read_csv(csv_text, show_col_types = FALSE))

cat("read.csv  (10 reads):", round(t1["elapsed"], 3), "sec\n")
cat("read_csv  (10 reads):", round(t2["elapsed"], 3), "sec\n")
cat("Speedup:", round(t1["elapsed"] / t2["elapsed"], 1), "x\n")
```

## Syntax Comparison

```r
library(readr)

csv <- "name,age,score\nAlice,25,88\nBob,30,76\nCarol,28,92"

# Base R
df1 <- read.csv(text = csv, stringsAsFactors = FALSE)
cat("read.csv class:", class(df1), "\n")

# readr
df2 <- read_csv(csv, show_col_types = FALSE)
cat("read_csv class:", class(df2)[1], "\n")

# All produce the same data
cat("\nResults identical:", all.equal(as.data.frame(df2), df1), "\n")
```

## When to Use Each

| Scenario | Best choice | Why |
|----------|------------|-----|
| Zero dependencies needed | `read.csv()` | Base R, always available |
| Tidyverse workflow | `read_csv()` | Returns tibble, integrates with dplyr |
| Very large files (1GB+) | `fread()` | Fastest, auto-detects everything |
| Teaching beginners | `read_csv()` | Cleaner API, helpful messages |
| CRAN packages | `read.csv()` | No external dependency |
| Quick exploration | `fread()` | Auto-detects delimiter, encoding, types |

## Practice Exercises

### Exercise 1: Compare Outputs

Read the same CSV with all three functions and compare the output types.

```r
library(readr)

csv <- "id,name,score\n1,Alice,88.5\n2,Bob,76.0\n3,Carol,92.3"

# Read with read.csv and read_csv
# Compare: class, column types, and string handling

```

<details>
<summary>Click to reveal solution</summary>

```r
library(readr)

csv <- "id,name,score\n1,Alice,88.5\n2,Bob,76.0\n3,Carol,92.3"

df_base <- read.csv(text = csv)
df_readr <- read_csv(csv, show_col_types = FALSE)

cat("read.csv types:\n")
str(df_base)
cat("\nread_csv types:\n")
str(df_readr)

cat("\nKey difference: read.csv may convert strings to factors (older R)")
```

</details>

## Summary

Use **`read_csv()`** as your default. Switch to **`fread()`** for files over 100 MB. Use **`read.csv()`** only when you need zero dependencies.

## FAQ

### Does fread() work with tidyverse?

Yes. `fread()` returns a data.table which is also a data.frame. You can pipe it into dplyr functions directly, or convert with `as_tibble()`.

### Why is fread so much faster?

`fread()` uses parallel processing, memory-mapped file reading, and optimized C code. It also auto-detects delimiters, column types, and the number of rows to read.

## What's Next?

- [Importing Data in R](/Importing-Data-in-R.html) — the parent tutorial
- [Apache Arrow in R](/Apache-Arrow-in-R.html) — read Parquet files for even faster I/O
- [dplyr filter & select](/dplyr-filter-select.html) — start working with your imported data
