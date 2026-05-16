---
title: "data.table fwrite() in R: Fast CSV Writing"
slug: "datatable-fwrite-in-R"
description: "Use data.table fwrite() in R to write CSV files fast. Covers syntax, delimiters, append mode, gzip compression, and fwrite vs write.csv with examples."
keywords: "data.table fwrite, fwrite function R, data.table fwrite examples, R fwrite csv, write csv fast R, fwrite vs write.csv, fwrite append"
mathjax: false
webr: true
date: "2026-05-16"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "datatable-functions"
fr_parent: "data-table-vs-dplyr.html"
auto_link_terms: "fwrite()|data.table fwrite|data.table::fwrite()|fwrite|fwrite function|fwrite CSV"
auto_link_case_sensitive: true
target_keyword: "data.table fwrite"
sibling_block_enabled: true
difficulty: "Beginner"
---

# data.table fwrite() in R: Fast CSV Writing

<p class="lead">data.table fwrite() in R writes a data frame or data.table to a CSV file far faster than any base R alternative, using a parallel, multi-threaded engine.</p>

[QUICK ANSWER]
fwrite(dt, "out.csv")                 # write a data.table or data.frame
fwrite(dt, "out.csv", sep = ";")      # custom delimiter
fwrite(dt, "out.tsv", sep = "\t")     # tab-separated file
fwrite(dt, "out.csv", append = TRUE)  # append rows to an existing file
fwrite(dt, "out.csv.gz")              # gzip-compressed output
fwrite(dt, "", quote = TRUE)          # print to console, force quotes
fwrite(dt, "out.csv", nThread = 4)    # control parallel write threads

[DECISION TREE: Is fwrite() the right tool?]
- write a data frame to CSV fast: fwrite(dt, "out.csv")
- read a CSV back into R: fread("out.csv")
- write an Excel .xlsx file: writexl::write_xlsx(dt, "out.xlsx")
- save R objects, not text: saveRDS(dt, "out.rds")
- write JSON output: jsonlite::write_json(dt, "out.json")
- append to a growing log file: fwrite(dt, "log.csv", append = TRUE)

## What fwrite() does in one sentence

**fwrite() turns an R table into a delimited text file at high speed.** It accepts a `data.table`, `data.frame`, `list`, or `matrix` and writes it to disk as CSV, TSV, or any custom-delimited format. The function is the writing counterpart of `fread()`, and on large tables it runs 10 to 50 times faster than `write.csv()` because it splits the work across CPU cores.

The example below loads `data.table`, builds a small table from `mtcars`, and writes it to a file in the browser session. Reading the raw lines back confirms the file content.

```r title="Write a data.table to CSV"
library(data.table)
dt <- as.data.table(mtcars)[1:5, .(mpg, cyl, hp)]
fwrite(dt, "cars.csv")
cat(readLines("cars.csv"), sep = "\n")
#> mpg,cyl,hp
#> 21,6,110
#> 21,6,110
#> 22.8,4,93
#> 21.4,6,110
#> 18.7,8,175
```

Notice there is no row-name column. Unlike `write.csv()`, fwrite never adds row indices, so the file is ready to share or re-import without cleanup.

## Syntax

**The fwrite() call needs only two arguments to be useful: the object and a file path.** Every other argument tunes the output format. The signature, with the arguments you will use most often, is:

```r title="fwrite signature with common arguments"
fwrite(
  x,                  # data.table, data.frame, list, or matrix
  file = "",          # output path; "" prints to the console
  sep = ",",          # field delimiter
  quote = "auto",     # quote strings only when needed
  na = "",            # text written for NA values
  col.names = TRUE,   # write a header row
  append = FALSE,     # add to an existing file instead of overwriting
  compress = "auto",  # gzip when the path ends in .gz
  nThread = getDTthreads()  # number of parallel write threads
)
```

| Argument | Purpose | Default |
|---|---|---|
| `file` | Output path; `""` writes to the console | `""` |
| `sep` | Field delimiter | `,` |
| `quote` | When to wrap fields in quotes | `"auto"` |
| `na` | String used for missing values | `""` |
| `append` | Append rows rather than overwrite | `FALSE` |
| `compress` | Compression mode (`"auto"`, `"gzip"`, `"none"`) | `"auto"` |

[TIP]
**Let fwrite use every core.** It already reads `getDTthreads()` by default, but on a shared server you can cap it with `nThread` or globally with `setDTthreads()`. More threads cut write time on million-row tables without changing the output.

## Writing data: five common patterns

**Most real fwrite() calls fall into a handful of recurring shapes.** The patterns below cover delimiters, appending, compression, and quoting.

A custom delimiter is one argument away. Passing `""` as the file path sends output straight to the console, which is handy for inspecting the result:

```r title="Custom delimiter and console output"
fwrite(dt, "", sep = ";")
#> mpg;cyl;hp
#> 21;6;110
#> 21;6;110
#> 22.8;4;93
#> 21.4;6;110
#> 18.7;8;175
```

Append mode adds rows to a file that already exists. fwrite writes no header when `append = TRUE`, so the file keeps a single header from the first write:

```r title="Append rows to an existing file"
fwrite(dt[1:2], "log.csv")
fwrite(dt[3:4], "log.csv", append = TRUE)
cat(readLines("log.csv"), sep = "\n")
#> mpg,cyl,hp
#> 21,6,110
#> 21,6,110
#> 22.8,4,93
#> 21.4,6,110
```

Compression happens automatically when the path ends in `.gz`. The file is smaller on disk and `fread()` reads it back transparently:

```r title="Write a compressed CSV"
fwrite(dt, "cars.csv.gz")
fread("cars.csv.gz")
#>     mpg cyl  hp
#>   <num> <num> <num>
#> 1: 21.0   6 110
#> 2: 21.0   6 110
#> 3: 22.8   4  93
#> 4: 21.4   6 110
#> 5: 18.7   8 175
```

Quoting and NA handling control how text and missing values appear. Use `quote = TRUE` to wrap every field and `na` to set the missing-value string:

```r title="Control quoting and NA strings"
dt2 <- data.table(name = c("Ann", "Bob"), score = c(NA, 9))
fwrite(dt2, "", na = "NA", quote = TRUE)
#> "name","score"
#> "Ann",NA
#> "Bob",9
```

## fwrite() vs write.csv() and write_csv()

**fwrite() wins on speed and produces a cleaner file by default.** Base R's `write.csv()` is single-threaded and adds a row-name column unless you disable it. The `readr::write_csv()` function is faster than base R but still trails fwrite on large data.

| Feature | `fwrite()` | `write.csv()` | `readr::write_csv()` |
|---|---|---|---|
| Multi-threaded | Yes | No | No |
| Adds row-name column | Never | Yes, unless disabled | Never |
| gzip via `.gz` path | Yes | No | Yes |
| Append mode | Yes | Manual | Yes |
| Relative speed (1M rows) | Fastest | Slowest | Middle |

Use fwrite for any table larger than a few thousand rows, for repeated writes inside a loop, or whenever write time shows up in a profile. Reach for `write.csv()` only when you cannot add a package dependency.

[NOTE]
**Coming from Python pandas?** The equivalent of `fwrite(dt, "out.csv")` is `df.to_csv("out.csv", index=False)`. fwrite drops the index by default, so you do not need the `index=False` argument.

## Common pitfalls

**Three mistakes account for most broken fwrite() output.** Knowing them up front saves a debugging session.

- **append = TRUE does not check columns.** fwrite appends rows blindly without verifying that column order or count matches the existing file. If you append a table whose columns are reordered, the file is silently corrupted. Always append tables with identical column structure.
- **fwrite does not create directories.** Calling `fwrite(dt, "reports/out.csv")` errors if the `reports` folder does not exist. Run `dir.create("reports", showWarnings = FALSE)` before writing into a new path.
- **List-columns are flattened with sep2.** A column that holds a list (common after a grouped `.()` operation) is written using the `sep2` separator, not `sep`. Inspect such columns or unnest them before writing if you need a flat CSV.

[WARNING]
**Overwriting is silent.** fwrite replaces an existing file without a prompt or warning. When a script runs on a schedule, guard important files with `file.exists()` or write to a timestamped path so a rerun cannot destroy yesterday's output.

## Try it yourself

**Try it:** Write the first 8 rows of `iris` (columns `Species` and `Sepal.Length` only) to a semicolon-separated file called `ex_iris.csv`. Save nothing else; just create the file.

```r title="Your turn: write a semicolon CSV"
# Try it: write iris columns to a semicolon file
ex_dt <- as.data.table(iris)[1:8, .(Species, Sepal.Length)]
# your code here

cat(readLines("ex_iris.csv"), sep = "\n")
#> Expected: header line is Species;Sepal.Length
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_dt <- as.data.table(iris)[1:8, .(Species, Sepal.Length)]
fwrite(ex_dt, "ex_iris.csv", sep = ";")
cat(readLines("ex_iris.csv"), sep = "\n")
#> Species;Sepal.Length
#> setosa;5.1
#> setosa;4.9
#> setosa;4.7
#> setosa;4.6
#> setosa;5
#> setosa;5.4
#> setosa;4.6
#> setosa;5
```

**Explanation:** The `sep = ";"` argument swaps the comma for a semicolon. fwrite writes the header automatically, and no row-name column appears.

</details>

## Related data.table functions

**fwrite() pairs with several other data.table tools** for a full read-write workflow:

- `fread()` reads CSV and delimited files back into R at matching speed.
- `as.data.table()` converts a data frame so fwrite can use the fast path.
- `rbindlist()` stacks many tables into one before a single fwrite call.
- `setDT()` converts an object to a data.table in place, by reference.
- `melt()` and `dcast()` reshape a table before you write it out.

## FAQ

**Is fwrite faster than write.csv?**
Yes, by a wide margin. fwrite is multi-threaded and uses a specialized number-to-text algorithm, so on a one-million-row table it typically finishes 10 to 50 times faster than `write.csv()`. The gap grows with table size and core count. For small tables under a few thousand rows the difference is not noticeable, but fwrite is never slower.

**How do I write a tab-separated file with fwrite?**
Set the `sep` argument to a tab character: `fwrite(dt, "out.tsv", sep = "\t")`. fwrite does not infer the delimiter from the file extension, so the `.tsv` name is just a convention. Any single character works as a delimiter, including `;` or `|`.

**Can fwrite append to an existing CSV?**
Yes. Pass `append = TRUE` and fwrite adds rows without writing a new header. The columns must match the existing file in order and count, because fwrite does not check alignment. Appending a reordered table silently corrupts the output.

**Does fwrite write row names?**
No. fwrite never adds a row-name or index column, which is the main behavioral difference from `write.csv()`. If you need row identifiers in the file, add them as an explicit column before writing, for example with `dt[, id := .I]`.

**How do I write a compressed CSV with fwrite?**
End the file path with `.gz` and fwrite gzips the output automatically: `fwrite(dt, "out.csv.gz")`. You can also force it with `compress = "gzip"`. The matching `fread()` call reads the compressed file back without any extra argument.
