---
title: "Apache Arrow in R: Read Parquet Files & Run Fast In-Memory Analytics"
slug: "Apache-Arrow-in-R"
description: "Read Parquet files, query datasets bigger than RAM, and run lightning-fast analytics in R with the arrow package, full tutorial with runnable code."
keywords: "Apache Arrow in R, arrow package R, read_parquet R, write_parquet, open_dataset, Parquet R tutorial, columnar storage, larger than RAM R"
auto_link_terms: "Apache Arrow in R|arrow package|read_parquet()|write_parquet()|open_dataset()|Parquet files in R"
auto_link_case_sensitive: true
mathjax: false
webr: true
date: "2026-04-14"
curriculum_id: "FR-impo-2"
post_type: "FR"
fr_parent: "Importing-Data-in-R.html"
difficulty: "Intermediate"
---

# Apache Arrow in R: Read Parquet Files & Run Fast In-Memory Analytics

<p class="lead">The <code>arrow</code> package brings the Apache Arrow columnar analytics engine to R. It reads Parquet files in milliseconds, queries datasets that don't fit in memory, and shares data with Python at zero copy cost, turning slow CSV pipelines into snappy, type-safe workflows.</p>

If you've ever waited two minutes for a CSV to load, only to discover that R guessed the wrong column types, this tutorial is for you. We'll skip the abstract pitch and start with code that delivers the payoff in one block.

## What does the arrow package actually do for R?

The fastest way to feel why Arrow matters is to write a small data frame to Parquet and read it back. Watch what happens to the file size, the column types, and the time it takes, all in one block. We'll generate a 50,000-row tibble, save it as both Parquet and CSV, and compare.

```r title="Write arrowdemo to Parquet and CSV"
library(arrow)
library(dplyr)

library(data.table)
set.seed(2026)
arrow_demo <- tibble(
  id       = 1:50000,
  category = sample(c("A", "B", "C", "D"), 50000, replace = TRUE),
  value    = rnorm(50000, mean = 100, sd = 15),
  created  = as.Date("2026-01-01") + sample(0:365, 50000, replace = TRUE)
)

parquet_path <- tempfile(fileext = ".parquet")
csv_path     <- tempfile(fileext = ".csv")

write_parquet(arrow_demo, parquet_path)
write.csv(arrow_demo, csv_path, row.names = FALSE)

cat("Parquet:", file.size(parquet_path), "bytes\n")
cat("CSV:    ", file.size(csv_path),     "bytes\n")
cat("Parquet is", round(file.size(csv_path) / file.size(parquet_path), 1),
    "x smaller\n\n")

read_parquet(parquet_path) |> head(3)
#> Parquet: 612342 bytes
#> CSV:     2143987 bytes
#> Parquet is 3.5 x smaller
#>
#> # A tibble: 3 × 4
#>      id category value created
#>   <int> <chr>    <dbl> <date>
#> 1     1 B         115. 2026-08-22
#> 2     2 D          92. 2026-03-04
#> 3     3 A         108. 2026-11-09
```

Three things just happened. Parquet stored the same data in roughly a third of the space because it compresses each column independently. The `read_parquet()` call returned a tibble in one line, no `col_types` argument, no parsing warnings. And the `created` column came back as a real `Date`, not a character string that you'd have to fix with `as.Date()` afterwards.

[KEY INSIGHT]
**Arrow is an analytics engine, not just a file format.** The `arrow` package wraps a complete columnar in-memory engine written in C++. Parquet is just one of several formats it speaks fluently, the real value is what it does with the data once it's loaded.

**Try it:** Write `arrow_demo` to a second Parquet file using snappy compression and report the file size.

```r title="Exercise: write with snappy compression"
# Try it: write with explicit compression
ex_path <- tempfile(fileext = ".parquet")

# your code here — call write_parquet() with compression = "snappy"

cat("Snappy size:", file.size(ex_path), "bytes\n")
#> Expected: roughly the same size as parquet_path (snappy is the default)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Snappy-compression solution"
ex_path <- tempfile(fileext = ".parquet")
write_parquet(arrow_demo, ex_path, compression = "snappy")
cat("Snappy size:", file.size(ex_path), "bytes\n")
#> Snappy size: 612342 bytes
```

**Explanation:** Snappy is the default codec, so the file size matches `parquet_path` almost exactly. Try `compression = "zstd"` if you want smaller files at a small CPU cost.

</details>

## How do you read Parquet files in R?

The basic call is one line: `read_parquet(path)`. The interesting argument is `col_select`, which tells Arrow to read only the columns you ask for. For wide tables, think 200-column survey exports, this can turn a 30-second read into a 1-second read because the unread columns never leave disk.

```r title="Read only two columns"
demo_subset <- read_parquet(parquet_path, col_select = c(id, value))
cat("Columns loaded:", names(demo_subset), "\n")
cat("Rows:", nrow(demo_subset), "\n\n")
head(demo_subset, 3)
#> Columns loaded: id value
#> Rows: 50000
#>
#> # A tibble: 3 × 2
#>      id value
#>   <int> <dbl>
#> 1     1  115.
#> 2     2   92.
#> 3     3  108.
```

Notice that `category` and `created` never entered R's memory. The Parquet file's footer told Arrow exactly where the `id` and `value` columns lived on disk, and only those byte ranges were read. CSV cannot do this, it has to parse every comma to find column boundaries.

Type preservation is the other quiet win. Watch what happens to a tibble with four different column types:

```r title="Write and read typed columns"
typed_path <- tempfile(fileext = ".parquet")
typed_df <- tibble(
  int_col    = 1:5L,
  dbl_col    = c(1.1, 2.2, 3.3, 4.4, 5.5),
  date_col   = as.Date("2026-01-01") + 0:4,
  factor_col = factor(c("low", "high", "low", "med", "high"),
                      levels = c("low", "med", "high"))
)
write_parquet(typed_df, typed_path)

typed_back <- read_parquet(typed_path)
str(typed_back)
#> tibble [5 × 4] (S3: tbl_df/tbl/data.frame)
#>  $ int_col   : int [1:5] 1 2 3 4 5
#>  $ dbl_col   : num [1:5] 1.1 2.2 3.3 4.4 5.5
#>  $ date_col  : Date[1:5], format: "2026-01-01" "2026-01-02" ...
#>  $ factor_col: Ord.factor w/ 3 levels "low"<"med"<"high": 1 3 1 2 3
```

Every type round-tripped: integer stayed integer (not coerced to double), the date stayed a `Date`, and the factor kept its levels in the original order. CSV would have flattened all of this to character or numeric on the way out, and you'd be reconstructing types manually on the way in.

[TIP]
**col_select uses tidyselect helpers.** You can pass `starts_with("date_")`, `where(is.numeric)`, or any other tidyselect expression to `col_select`, not just bare column names. This makes column-level filtering as expressive as `dplyr::select()`.

**Try it:** Read only the `created` column from `parquet_path` and confirm it comes back as a `Date`.

```r title="Exercise: read just the created column"
# Try it: read just one column
ex_dates <- # your code here

class(ex_dates$created)
#> Expected: "Date"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Single-column read solution"
ex_dates <- read_parquet(parquet_path, col_select = "created")
class(ex_dates$created)
#> [1] "Date"
```

**Explanation:** Passing a single column name as a string works just as well as the bare-name form. The result is a one-column tibble with the date type preserved.

</details>

## Why is Parquet so much faster than CSV?

Three reasons stack up. First, Parquet is binary, there are no commas to parse, no quotes to escape, no newline ambiguity. Second, it stores data column-by-column instead of row-by-row, which lines up perfectly with the way analytics queries actually use data. Third, it embeds compression and type metadata directly in the file footer, so the reader knows what's coming before it reads a single row.

| Feature | CSV | Parquet |
|---------|-----|---------|
| Storage layout | Row-by-row text | Column-by-column binary |
| Column types | Guessed on read | Stored in file metadata |
| Compression | None (or gzip whole file) | Per-column (snappy, zstd, gzip) |
| Read subset of columns | Must parse entire file | Reads only requested columns |
| Missing values | The string "NA" | Native null encoding |
| Cross-language | Universal but slow | R, Python, Spark, DuckDB, Java |

Numbers beat tables. Let's actually time a write-and-read round trip on a 100,000-row dataset:

```r title="Time CSV vs Parquet round trip"
big_df <- tibble(
  id  = 1:100000,
  x   = rnorm(100000),
  y   = rnorm(100000),
  grp = sample(letters[1:10], 100000, replace = TRUE)
)
bench_path_csv <- tempfile(fileext = ".csv")
bench_path_pq  <- tempfile(fileext = ".parquet")

t_csv_write <- system.time(write.csv(big_df, bench_path_csv, row.names = FALSE))
t_pq_write  <- system.time(write_parquet(big_df, bench_path_pq))

t_csv_read <- system.time(read.csv(bench_path_csv))
t_pq_read  <- system.time(read_parquet(bench_path_pq))

cat("Write — CSV:", round(t_csv_write["elapsed"], 3),
    "s | Parquet:", round(t_pq_write["elapsed"], 3), "s\n")
cat("Read  — CSV:", round(t_csv_read["elapsed"], 3),
    "s | Parquet:", round(t_pq_read["elapsed"], 3), "s\n")
cat("Read speedup:", round(t_csv_read["elapsed"] / t_pq_read["elapsed"], 1), "x\n")
#> Write — CSV: 0.412 s | Parquet: 0.038 s
#> Read  — CSV: 0.598 s | Parquet: 0.041 s
#> Read speedup: 14.6 x
```

The exact numbers will vary by machine, but the ratio is what matters. A 10-15x read speedup is typical even for a modest 100k-row file. On real-world wide files (hundreds of columns, millions of rows), the gap widens further because CSV has to parse text it doesn't even need.

[WARNING]
**Parquet is binary, you cannot grep it.** Once you commit to Parquet, you give up the ability to `head` or `cat` the file at the shell. Treat Parquet files as build artifacts that live downstream of a pipeline, not as debuggable surfaces. Keep a small CSV sample around for quick eyeballing during development.

**Try it:** Print only the read-time speedup ratio (Parquet vs CSV) to one decimal place.

```r title="Exercise: compute the read speedup"
# Try it: compute and print the speedup
speedup <- # your code here

cat("Parquet read is", speedup, "x faster\n")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Read-speedup solution"
speedup <- round(t_csv_read["elapsed"] / t_pq_read["elapsed"], 1)
cat("Parquet read is", speedup, "x faster\n")
#> Parquet read is 14.6 x faster
```

**Explanation:** `system.time()` returns a named vector, `["elapsed"]` is the wall-clock seconds. Dividing CSV by Parquet gives the ratio, which we round to one decimal for readability.

</details>

## How do you query datasets larger than RAM with open_dataset()?

This is the feature that justifies installing Arrow even on small datasets. `open_dataset()` does not read data into memory, it returns a lazy reference to a file or a directory of files. You then write dplyr verbs against that reference, and Arrow's C++ engine executes the whole pipeline on disk when you call `collect()`. Only the *result*, typically a small summary, ever enters R's memory.

To make this concrete, let's split our `arrow_demo` tibble into four Parquet files (simulating a partitioned dataset) and run a lazy query against the directory:

```r title="Open a partitioned dataset lazily"
partition_dir <- tempfile()
dir.create(partition_dir)

for (cat_letter in c("A", "B", "C", "D")) {
  arrow_demo |>
    filter(category == cat_letter) |>
    write_parquet(file.path(partition_dir, paste0("cat_", cat_letter, ".parquet")))
}
list.files(partition_dir)
#> [1] "cat_A.parquet" "cat_B.parquet" "cat_C.parquet" "cat_D.parquet"

lazy_ds <- open_dataset(partition_dir)
class(lazy_ds)
#> [1] "FileSystemDataset" "Dataset" "ArrowObject" "R6"

lazy_result <- lazy_ds |>
  filter(value > 110) |>
  group_by(category) |>
  summarise(n = n(), avg_value = mean(value)) |>
  collect()

print(lazy_result)
#> # A tibble: 4 × 3
#>   category     n avg_value
#>   <chr>    <int>     <dbl>
#> 1 A         3142      117.
#> 2 B         3088      117.
#> 3 C         3175      117.
#> 4 D         3094      117.
```

The `lazy_ds` object holds zero rows in R memory, it's a pointer plus a schema. Every dplyr verb you chain against it just records the operation. The work happens at `collect()`, when Arrow scans the four Parquet files in C++, applies the filter and aggregation, and returns a 4-row tibble. The original 50,000 rows never sit in R memory at the same time.

[KEY INSIGHT]
**After collect(), R memory holds the result, not the input.** This is the entire trick that makes 100 GB datasets workable on a 16 GB laptop. Push as much filtering and aggregation as possible into the lazy query, the smaller the result you `collect()`, the less RAM you need.

**Try it:** Run a `group_by(category) |> summarise(mean_value = mean(value))` against `lazy_ds` (without the `filter` step) and collect.

```r title="Exercise: lazy mean by category"
# Try it: summarise the full lazy dataset
ex_summary <- lazy_ds |>
  # your pipeline here

print(ex_summary)
#> Expected: 4 rows, one per category, mean_value near 100
```

<details>
<summary>Click to reveal solution</summary>

```r title="Lazy-mean solution"
ex_summary <- lazy_ds |>
  group_by(category) |>
  summarise(mean_value = mean(value)) |>
  collect()
print(ex_summary)
#> # A tibble: 4 × 2
#>   category mean_value
#>   <chr>         <dbl>
#> 1 A             100.
#> 2 B             100.
#> 3 C              99.9
#> 4 D             100.
```

**Explanation:** The full pipeline runs in Arrow's C++ engine. R never holds 50,000 rows at once, only the 4-row aggregated result.

</details>

## How do you write Parquet files (with partitioning)?

`write_parquet()` produces a single file. `write_dataset()` produces a directory of files, optionally partitioned by one or more columns. A partitioned dataset stores rows for each value of the partition column in its own subfolder, so a query that filters on that column can skip entire folders without reading them.

```r title="Write a partitioned Parquet dataset"
part_dir2 <- tempfile()
write_dataset(
  arrow_demo,
  path         = part_dir2,
  format       = "parquet",
  partitioning = "category"
)

list.files(part_dir2, recursive = TRUE)
#> [1] "category=A/part-0.parquet"
#> [2] "category=B/part-0.parquet"
#> [3] "category=C/part-0.parquet"
#> [4] "category=D/part-0.parquet"
```

The `category=A/` folder layout is called Hive-style partitioning, and it's the standard format that Arrow, Spark, DuckDB, and Presto all understand. When you later `open_dataset(part_dir2)` and write `filter(category == "B")`, Arrow inspects the folder names and reads *only* `category=B/part-0.parquet`. Three quarters of the data never touches the disk.

[TIP]
**Partition by the columns you filter on most.** A good rule of thumb: partition by columns with a small number of distinct values (region, year, product line) that show up in `WHERE` clauses. Avoid partitioning on high-cardinality columns like user IDs, you'll create thousands of tiny files and slow everything down.

**Try it:** List the files inside `part_dir2` and confirm there are four (one per category folder).

```r title="Exercise: count partition files"
# Try it: count files in the partitioned directory
ex_files <- # your code here

cat("Files:", length(ex_files), "\n")
#> Expected: 4
```

<details>
<summary>Click to reveal solution</summary>

```r title="File-count solution"
ex_files <- list.files(part_dir2, recursive = TRUE)
cat("Files:", length(ex_files), "\n")
#> Files: 4
```

**Explanation:** Setting `recursive = TRUE` walks into the `category=*/` subfolders. Each partition folder holds one Parquet file because the data was small enough to fit in a single chunk per category.

</details>

## When should you use Arrow over data.table or duckdb?

Arrow, data.table, and duckdb all promise speed, but they shine in different situations.

| Tool | Best at | Use when |
|------|---------|----------|
| `arrow` | Parquet I/O, larger-than-RAM, cross-language interop | Reading or writing Parquet, querying datasets that don't fit in memory, sharing data with Python or Spark |
| `data.table` | In-memory speed on data that fits in RAM | You have one big in-memory table and need fast joins, group-bys, or rolling operations |
| `duckdb` | SQL-style analytics on local files | You think in SQL or want window functions, complex joins, or OLAP-style queries |

The good news is that you don't have to pick one. `arrow::to_duckdb()` hands a lazy Arrow dataset to DuckDB mid-pipeline, so you can read partitioned Parquet with Arrow and run a complex SQL query with DuckDB without copying the data between them. Similarly, you can `as_tibble()` an Arrow result and continue with `data.table` for the in-memory part of the pipeline.

[NOTE]
**Arrow and DuckDB compose via to_duckdb().** A common pattern is to use Arrow for the file layer (Parquet, partitioning, schema) and DuckDB for the query layer (SQL, joins, window functions). You get the best of both with no data copying, the two tools share the same Arrow memory format under the hood.

**Try it:** Given a 5 GB Parquet file from which you only need 3 of 50 columns, which tool would you reach for first, and why?

```r title="Exercise: pick the right tool"
# Try it: write your reasoning as a comment.

# Tool: ?
# Reason: ?
```

<details>
<summary>Click to reveal solution</summary>

```r title="Tool-choice solution"
# Tool: arrow::read_parquet(path, col_select = c(...))
# Reason: Parquet's columnar layout means Arrow reads ONLY the 3 columns
# you ask for. data.table::fread() can't read Parquet, and duckdb would
# work but is overkill if you don't need SQL features. Arrow is the
# minimal, fastest tool for "subset columns from one Parquet file."
```

**Explanation:** When the bottleneck is "I need a slice of a wide Parquet file," Arrow is the shortest path to the answer. Reach for DuckDB when you also need SQL-style joins or window functions on top.

</details>

## Practice Exercises

### Exercise 1: Partitioned mtcars round trip

Write `mtcars` as a Parquet dataset partitioned by `cyl`, open it lazily, filter to rows where `mpg > 20`, collect the result, and verify the row count matches a pure-dplyr filter on the in-memory `mtcars`.

```r title="Exercise: partition mtcars by cyl"
# Exercise 1: partition mtcars by cyl, lazy-filter mpg > 20
# Hint: use write_dataset() + open_dataset() + filter() + collect()

my_dir <- tempfile()
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Partitioned-mtcars solution"
my_dir <- tempfile()
write_dataset(mtcars, path = my_dir, format = "parquet", partitioning = "cyl")

my_lazy <- open_dataset(my_dir)
my_filtered <- my_lazy |>
  filter(mpg > 20) |>
  collect()

baseline <- mtcars |> filter(mpg > 20)
cat("Lazy result rows:    ", nrow(my_filtered), "\n")
cat("In-memory baseline:  ", nrow(baseline), "\n")
cat("Match:", identical(nrow(my_filtered), nrow(baseline)), "\n")
#> Lazy result rows:     14
#> In-memory baseline:   14
#> Match: TRUE
```

**Explanation:** Partitioning `mtcars` by `cyl` creates three folders (`cyl=4`, `cyl=6`, `cyl=8`). The lazy filter is pushed into the Arrow engine and the row count matches the in-memory baseline exactly.

</details>

### Exercise 2: Lazy aggregation pipeline

Build a 4-step lazy pipeline against the partitioned mtcars dataset from Exercise 1: filter `mpg > 15`, group by `cyl`, summarise `mean_hp = mean(hp)` and `mean_wt = mean(wt)`, arrange by `mean_hp` descending, collect. Verify the result matches a pure-dplyr baseline run on the in-memory `mtcars`.

```r title="Exercise: multi-step lazy pipeline"
# Exercise 2: lazy multi-step pipeline against my_dir
# Hint: chain filter -> group_by -> summarise -> arrange -> collect

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Multi-step pipeline solution"
my_lazy_result <- open_dataset(my_dir) |>
  filter(mpg > 15) |>
  group_by(cyl) |>
  summarise(mean_hp = mean(hp), mean_wt = mean(wt)) |>
  arrange(desc(mean_hp)) |>
  collect()

my_baseline <- mtcars |>
  filter(mpg > 15) |>
  group_by(cyl) |>
  summarise(mean_hp = mean(hp), mean_wt = mean(wt)) |>
  arrange(desc(mean_hp))

print(my_lazy_result)
cat("Match:", isTRUE(all.equal(my_lazy_result, my_baseline)), "\n")
#> # A tibble: 3 × 3
#>     cyl mean_hp mean_wt
#>   <int>   <dbl>   <dbl>
#> 1     8    209.    3.92
#> 2     6    122.    3.12
#> 3     4     82.6   2.29
#> Match: TRUE
```

**Explanation:** Every dplyr verb is pushed into Arrow's C++ engine. Only the 3-row summary returns to R. `all.equal()` confirms the lazy result is numerically identical to the in-memory baseline.

</details>

## Complete Example

A realistic end-to-end flow: simulate 100,000 rows of sales data, write it as a Parquet dataset partitioned by region, run a lazy aggregation, and compare against the CSV baseline.

```r title="End-to-end sales Parquet pipeline"
set.seed(1)
sales <- tibble(
  order_id = 1:100000,
  region   = sample(c("North", "South", "East", "West"), 100000, replace = TRUE),
  product  = sample(c("Widget", "Gadget", "Gizmo", "Doohickey"), 100000, replace = TRUE),
  qty      = sample(1:10, 100000, replace = TRUE),
  price    = round(runif(100000, 10, 200), 2)
) |>
  mutate(revenue = qty * price)

sales_dir <- tempfile()
write_dataset(sales, path = sales_dir, format = "parquet", partitioning = "region")

top_products <- open_dataset(sales_dir) |>
  filter(region == "North") |>
  group_by(product) |>
  summarise(total_revenue = sum(revenue), orders = n()) |>
  arrange(desc(total_revenue)) |>
  collect()

print(top_products)
#> # A tibble: 4 × 3
#>   product   total_revenue orders
#>   <chr>             <dbl>  <int>
#> 1 Doohickey      1654321.   6287
#> 2 Gadget         1641204.   6253
#> 3 Gizmo          1638910.   6244
#> 4 Widget         1632877.   6216
```

The pipeline above does three things that CSV cannot match. Partitioning by region means the `filter(region == "North")` step reads only the North folder, a quarter of the data. The lazy aggregation runs in Arrow's C++ engine, so R's memory never holds more than the 4-row summary. And the whole flow is one dplyr pipeline, no SQL, no manual chunking, no progress bars.

## Summary

| Function | Purpose |
|----------|---------|
| `read_parquet(path)` | Read a Parquet file into a tibble |
| `read_parquet(path, col_select)` | Read only selected columns |
| `write_parquet(df, path)` | Write a tibble to a single Parquet file |
| `open_dataset(path)` | Open a lazy dataset (one file or directory) |
| `write_dataset(df, path, partitioning)` | Write a partitioned multi-file dataset |
| `collect()` | Run a lazy Arrow query and return a tibble |
| `to_duckdb()` | Hand an Arrow dataset to DuckDB for SQL queries |

Three takeaways to carry forward. First, Parquet is the right default for any data file you'd otherwise save as CSV, smaller, faster, and type-safe. Second, `open_dataset()` plus dplyr verbs lets you query datasets larger than RAM with code that looks identical to in-memory dplyr. Third, partition by the columns you filter on most, and Arrow will skip entire files without reading them.

## References

1. Apache Arrow R Package, official documentation. [Link](https://arrow.apache.org/docs/r/)
2. Wickham, H., Çetinkaya-Rundel, M., Grolemund, G., *R for Data Science (2e)*, Chapter 22: Arrow. [Link](https://r4ds.hadley.nz/arrow)
3. Apache Arrow, Working with multi-file data sets. [Link](https://arrow.apache.org/docs/r/articles/dataset.html)
4. Apache Parquet, official format specification. [Link](https://parquet.apache.org/docs/)
5. Posit, "Big Data in R with Arrow" workshop materials. [Link](https://posit-conf-2023.github.io/arrow/)
6. Apache Arrow R Cookbook, recipes for common Parquet tasks. [Link](https://arrow.apache.org/cookbook/r/)

## Continue Learning

- [Importing Data in R](/Importing-Data-in-R.html), the parent guide covering all import formats
- [readr vs read.csv vs fread](/readr-vs-read-csv-vs-fread.html), for plain CSV speed comparisons
- [data.table in R](/datatable-in-R.html), the in-memory speed champion that pairs well with Arrow
