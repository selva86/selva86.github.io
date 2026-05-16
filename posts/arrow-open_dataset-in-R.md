---
title: "arrow open_dataset() in R: Query Multi-File Datasets"
slug: arrow-open_dataset-in-R
description: "Learn arrow open_dataset() in R to query large multi-file Parquet and CSV datasets lazily. Covers syntax, partitioning, dplyr queries, collect(), and pitfalls."
keywords: "arrow open_dataset, open_dataset function R, arrow open_dataset examples, R open_dataset, arrow multi-file dataset, open_dataset partitioning"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: readr--readxl--haven
fr_parent: Importing-Data-in-R.html
auto_link_terms: "open_dataset()|arrow open_dataset|arrow::open_dataset()|open a dataset in R|open_dataset in R"
auto_link_case_sensitive: true
target_keyword: "arrow open_dataset"
sibling_block_enabled: true
difficulty: Beginner
---

# arrow open_dataset() in R: Query Multi-File Datasets

<p class="lead">The arrow open_dataset() function points R at a folder of Parquet or CSV files and treats them as one queryable table. It does not load the data, so you can filter and summarise datasets far larger than your computer's memory.</p>

[QUICK ANSWER]
open_dataset("data/")                                # open a Parquet folder
open_dataset("data/", format = "csv")                # open a CSV folder
open_dataset("data/", partitioning = "year")         # Hive-partitioned folder
open_dataset(c("a.parquet", "b.parquet"))            # open an explicit file list
open_dataset("data/") |> filter(x > 0) |> collect()  # query then pull to R
open_dataset("data/") |> nrow()                      # count rows, no load

[DECISION TREE: Is open_dataset() the right tool?]
- query many files larger than memory: open_dataset("folder/")
- read one Parquet file into memory: read_parquet("file.parquet")
- read one Feather or IPC file: read_feather("file.feather")
- read a single CSV into memory: read_csv("file.csv")
- save one data frame to Parquet: write_parquet(df, "file.parquet")
- write a partitioned dataset folder: write_dataset(df, "folder/")

## What open_dataset() does

**open_dataset() builds a lazy view over many files at once.** You give it a directory, and it scans the file layout, reads each file's metadata, and returns a `Dataset` object. No rows are pulled into R. The object simply knows where the data lives and what columns it has.

That laziness is the whole point. A `Dataset` can span hundreds of Parquet files and hundreds of gigabytes, yet `open_dataset()` returns in a fraction of a second. You then attach `dplyr` verbs, and the Apache Arrow engine pushes that work down to the files, reading only the columns and row groups your query touches.

[KEY INSIGHT]
**A Dataset is a query plan, not data.** `open_dataset()` gives you a promise to read files later. Nothing is materialised until you call `collect()`, so the expensive work happens once, on exactly the rows you asked for.

## Syntax and key arguments

**The first argument is a path, and `format` tells Arrow how to parse it.** Everything else has a sensible default, so most calls are one or two arguments long.

```r title="The open_dataset signature"
open_dataset(
  sources,                  # a directory, a vector of file paths, or a URI
  schema = NULL,            # column types; NULL means infer from the files
  partitioning = hive_partition(),  # how folder names map to columns
  unify_schemas = NULL,     # TRUE reconciles columns that differ across files
  format = c("parquet", "arrow", "csv", "tsv", "text"),
  ...
)
```

The `format` argument defaults to `"parquet"`, so reading a CSV folder needs `format = "csv"` explicitly. The `partitioning` argument reads Hive-style folder names such as `year=2024/` and turns them back into a column. Set `unify_schemas = TRUE` when files were written at different times and their columns no longer line up.

## open_dataset() examples

**These examples build a real dataset folder, then query it.** Each block runs in order and shares state, so variables created early stay available.

First, write a partitioned dataset so there is something multi-file to open.

```r title="Create a multi-file dataset"
library(arrow)
library(dplyr)

ds_path <- file.path(tempdir(), "cars")
write_dataset(mtcars, ds_path, partitioning = "cyl")

list.files(ds_path, recursive = TRUE)
#> [1] "cyl=4/part-0.parquet" "cyl=6/part-0.parquet" "cyl=8/part-0.parquet"
```

Now open that folder. The printed summary confirms the file count and schema without reading a single row.

```r title="Open the dataset lazily"
cars <- open_dataset(ds_path)
cars
#> FileSystemDataset with 3 Parquet files
#> 11 columns
#> mpg: double
#> disp: double
#> hp: double
#> ... and cyl recovered from the folder names
```

Attach `dplyr` verbs and finish with `collect()` to pull the result into a tibble. Arrow runs the filter and column selection across all three files for you.

```r title="Query the dataset with dplyr"
result <- cars |>
  filter(cyl == 4) |>
  select(mpg, hp, wt) |>
  arrange(desc(mpg)) |>
  collect()

nrow(result)
#> [1] 11
head(result, 3)
#> # A tibble: 3 x 3
#>     mpg    hp    wt
#>   <dbl> <dbl> <dbl>
#> 1  33.9    66  1.84
#> 2  32.4    66  2.20
#> 3  30.4    52  1.62
```

For a folder of CSV files, pass `format = "csv"`. The query interface is identical once the dataset is open.

```r title="Open a folder of CSV files"
csv_ds <- open_dataset("sales/", format = "csv")

csv_ds |>
  filter(region == "West") |>
  summarise(total = sum(amount)) |>
  collect()
#> # A tibble: 1 x 1
#>      total
#>      <dbl>
#> 1  482910
```

[TIP]
**Count and inspect before you collect.** `nrow(cars)` and `schema(cars)` answer structural questions instantly because they read metadata, not data. Use them to size a query before you commit to pulling rows.

## open_dataset() vs read_parquet() and alternatives

**Reach for `open_dataset()` when the data spans many files or exceeds memory.** For a single file that fits in RAM, the simpler readers are a better fit.

| Function | Reads | Loads into memory | Best for |
|---|---|---|---|
| `open_dataset()` | A folder of many files | No, lazy until `collect()` | Larger-than-memory, partitioned data |
| `read_parquet()` | One Parquet file | Yes, immediately | A single file that fits in RAM |
| `read_csv()` | One CSV file | Yes, immediately | Small to medium text files |
| `arrow_table()` | An in-memory object | Already in memory | Wrapping data you already have |

The decision rule is simple. If you can name one file and it fits in memory, use [read_parquet()](arrow-read_parquet-in-R.html). If you have a directory, partitioned data, or a dataset bigger than RAM, use `open_dataset()` and let Arrow stream it.

## Common pitfalls

**Three mistakes account for most open_dataset() confusion.** Each has a one-line fix.

Forgetting `collect()` is the most common. A pipeline without it returns an unevaluated query, not a data frame.

```r title="Forgetting to collect the result"
cars |> filter(cyl == 4)
#> FileSystemDataset (query)
#> mpg: double ...
#> Call collect() on the result to materialise it.
```

Opening a CSV folder without `format = "csv"` makes Arrow try to parse text as Parquet and fail. Always set `format` for anything that is not Parquet.

[WARNING]
**Schema drift breaks a multi-file dataset silently.** If one file has a column the others lack, `open_dataset()` may error or drop rows on collect. Pass `unify_schemas = TRUE` so Arrow reconciles the columns instead of assuming every file matches the first.

## Try it yourself

**Try it:** Open the `cars` dataset from the examples, keep only 6-cylinder cars, and compute their mean `mpg`. Save the number to `ex_mpg`.

```r title="Your turn: query the dataset"
# Try it: filter and summarise a Dataset
ex_mpg <- # your code here

ex_mpg
#> Expected: about 19.74
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_mpg <- cars |>
  filter(cyl == 6) |>
  summarise(m = mean(mpg)) |>
  collect() |>
  pull(m)

ex_mpg
#> [1] 19.74286
```

**Explanation:** The filter and summarise run inside the Arrow engine, and `collect()` brings back the single summary row. `pull()` then extracts the number from the one-row tibble.

</details>

## Related arrow functions

**These functions pair with open_dataset() in a typical Parquet workflow.**

- [read_parquet()](arrow-read_parquet-in-R.html) reads a single Parquet file straight into a data frame.
- [write_parquet()](arrow-write_parquet-in-R.html) saves one data frame to a single Parquet file.
- [read_feather()](arrow-read_feather-in-R.html) reads an Arrow Feather or IPC file.
- `write_dataset()` writes a data frame back out as a partitioned folder.
- `collect()` materialises a lazy Dataset query into an R tibble.

For a fuller tour of the package, see the [Apache Arrow in R](Apache-Arrow-in-R.html) guide and the official [arrow package documentation](https://arrow.apache.org/docs/r/).

## FAQ

**Does open_dataset() load the whole dataset into memory?**

No. `open_dataset()` only reads file metadata and returns a lazy `Dataset` object. Data is read when you call `collect()`, and even then Arrow reads only the columns and rows your query needs. This is what lets a single laptop query datasets that are far larger than its RAM, because the full table never has to exist in memory at once.

**What file formats does open_dataset() support?**

It supports Parquet, Arrow IPC and Feather, and delimited text formats including CSV and TSV. Parquet is the default, so other formats need an explicit `format` argument, such as `format = "csv"`. Parquet is usually the best choice because its columnar layout lets Arrow skip unneeded columns and row groups during a query.

**How is open_dataset() different from read_parquet()?**

`read_parquet()` reads exactly one file and loads it fully into memory right away. `open_dataset()` points at a directory of many files and stays lazy until `collect()`. Use `read_parquet()` for a single file that fits in RAM, and `open_dataset()` for a folder, a partitioned layout, or any dataset too big to load at once.

**Can open_dataset() read partitioned folders?**

Yes. When folders are named in Hive style, such as `year=2024/month=01/`, `open_dataset()` reads those names and turns them back into columns you can filter on. The default `partitioning = hive_partition()` handles this automatically. Filtering on a partition column lets Arrow skip whole folders, which is the single biggest speedup on large datasets.
</content>
</invoke>
