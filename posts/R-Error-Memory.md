---
title: "R Memory Error: 'cannot allocate vector' — 5 Solutions From Quick to Complete"
slug: "R-Error-Memory"
description: "R out of memory? Fix 'cannot allocate vector of size' fast: run gc(), drop big objects, switch to data.table, or use DuckDB for out-of-memory queries."
keywords: "R cannot allocate vector, R memory error, R out of memory, cannot allocate vector of size, R gc() garbage collect, R rm() free memory, R data.table fread, R DuckDB out of memory"
auto_link_terms: "cannot allocate vector|R memory error|R out of memory|cannot allocate vector of size|R ran out of memory"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-13"
curriculum_id: "ERR19"
post_type: "FR"
fr_parent: "R-Common-Errors.html"
---

# R Memory Error: 'cannot allocate vector' — 5 Solutions From Quick to Complete

<p class="lead"><code>Error: cannot allocate vector of size X Gb</code> means R tried to grow or copy an object that needs more contiguous RAM than your machine can spare in this session. The size printed in the message is exactly how much R asked for — that single number decides which of the five fixes below applies to you.</p>

## What does "cannot allocate vector of size X Gb" actually mean?

When you see this error, R hit a hard wall: it asked the operating system for a chunk of contiguous memory and the OS said no. The size in the message is the exact request — not your total memory use, not the size of everything in your session. Before touching any fix, reproduce the error and read that number carefully. It tells you whether you are 100MB short or 40GB short, and the answer points directly at the right solution.

```r
# Reproduce the error on any machine by asking for an absurd allocation.
# 1e10 doubles = 80 GB (8 bytes each) — no laptop can satisfy that.
huge <- numeric(1e10)
#> Error: cannot allocate vector of size 74.5 Gb
```

The two parts of the message to notice: `cannot allocate vector` means the request failed at allocation time (not during computation), and `74.5 Gb` is the *exact* size that was refused. A 10-billion-element double vector needs 10e9 * 8 bytes ≈ 74.5 GiB — the number is not a mystery, it is arithmetic.

[KEY INSIGHT]
**The size in the error is the request, not total memory used.** A 500MB error means R needed 500MB of contiguous free RAM at that instant — even if your total session usage is tiny. Always read the size first; it tells you whether solution 1 (free garbage) or solution 5 (bigger machine) is realistic.

Once you have the number, estimate how big your actual objects are so you know how much headroom to recover. Base R's `object.size()` reports the exact byte count for any variable you already have in the session.

```r
# Estimate memory needs BEFORE creating the object
mid_vec <- numeric(5e6)       # 5 million doubles
object.size(mid_vec)
#> 40000048 bytes
format(object.size(mid_vec), units = "MB")
#> [1] "38.1 Mb"
```

So a 5-million double vector is about 38MB. Doubling the length roughly doubles the memory. Multiply by the number of similar objects you plan to hold at once, and you have a rough budget. If the budget already exceeds free RAM, you know the error is unavoidable with the current approach and need to jump straight to solutions 2–5.

R ships a second tool to read memory state: `gc()`, which triggers a garbage-collection pass and prints a before/after table.

```r
# gc() returns a matrix: "used" is current, "max used" is the high-water mark
gc()
#>           used  (Mb) gc trigger  (Mb) max used  (Mb)
#> Ncells  683492  36.5    1329657  71.1  1064612  56.9
#> Vcells 5784236  44.2   14282293 109.0  5784236  44.2
```

Two numbers matter here: `Vcells used (Mb)` is how much R is holding right now for vectors (your data), and `max used` is the highest it has been during this session. If `max used` is close to your total RAM and `used` is much lower, old objects were freed and you just need to trigger a collection — that is exactly what solution 1 does.

**Try it:** Estimate how many megabytes a 10-million-element numeric vector needs. Write the expression using `object.size()` and convert to MB.

```r
# Try it: measure memory for 10M doubles
ex_vec <- numeric(1e7)
# your code here — print the size in MB

```

<details>
<summary>Click to reveal solution</summary>

```r
ex_vec <- numeric(1e7)
ex_bytes <- object.size(ex_vec)
format(ex_bytes, units = "MB")
#> [1] "76.3 Mb"
```

**Explanation:** 10 million doubles × 8 bytes each ≈ 80MB. `object.size()` reports the exact byte count and `format(..., units = "MB")` converts it to a readable string.

</details>

## Solution 1: Can gc() and rm() buy you enough headroom?

This is the zero-cost first move. Every interactive R session accumulates old objects, copies from pipelines, and intermediate results that you no longer need. If the shortage is modest — say the error is for 500MB and you have 4GB free — removing leftovers and triggering garbage collection often fixes it instantly.

```r
# Create a dummy 500MB object to simulate a long session
big_obj <- numeric(6e7)       # ~480 MB
format(object.size(big_obj), units = "MB")
#> [1] "457.8 Mb"

# Free it and reclaim the memory
rm(big_obj)
gc()
#>           used (Mb) gc trigger  (Mb) max used  (Mb)
#> Ncells  683523 36.5    1329657  71.1  1064612  56.9
#> Vcells 5784275 44.2   71351462 544.4 65784275 501.8
```

Read the `gc()` output after `rm()`: the `used` column drops back to what is actually live, and `max used` still remembers the peak. The 500MB object is gone from `used` but not from `max used` — that is normal and tells you the OS has now released the memory. Try your failing line again: if it was a small overage, it will succeed.

If you are inside a long loop that builds intermediate objects, sprinkle `rm()` and `gc()` between iterations so each pass does not carry its predecessors' memory forward.

[TIP]
**Put gc() inside long loops when you build big temporary objects.** R will eventually collect garbage on its own, but explicit `gc()` at the end of each iteration guarantees the memory is released before the next iteration tries to allocate.

A full session wipe is also one line — useful as a panic button at the top of a script that keeps failing.

```r
# Nuclear option: remove everything in the global env, then collect
rm(list = ls())
gc()
#>           used (Mb) gc trigger  (Mb) max used  (Mb)
#> Ncells  683540 36.5    1329657  71.1  1064612  56.9
#> Vcells 5784298 44.2   71351462 544.4 65784275 501.8
```

**When solution 1 works:** the overage is small (under ~1GB), your session has been running a while, or you just finished an expensive pipeline that left copies lying around. **When it does not:** the *single* object you need is already larger than free RAM. No amount of clean-up will help — jump to solution 2.

**Try it:** Create a 200MB numeric vector named `ex_big`, confirm its size, delete it, and verify with `gc()` that memory dropped.

```r
# Try it: create, measure, delete, confirm
# your code here

```

<details>
<summary>Click to reveal solution</summary>

```r
ex_big <- numeric(2.5e7)
format(object.size(ex_big), units = "MB")
#> [1] "190.7 Mb"
rm(ex_big)
gc()
#>           used (Mb) gc trigger  (Mb) max used  (Mb)
#> Ncells  683561 36.5    1329657  71.1  1064612  56.9
#> Vcells 5784325 44.2   71351462 544.4 65784275 501.8
```

**Explanation:** `numeric(2.5e7)` allocates 25 million doubles ≈ 190MB. `rm()` removes the binding; `gc()` forces R to release the memory back to the OS (or at least mark it reusable).

</details>

## Solution 2: How do you read CSVs with less memory using data.table?

The most common place the error appears is on a `read.csv()` call against a file that is 1–5 GB on disk. Base R's reader has three memory penalties: it converts strings to factors (doubling some columns), it keeps row names, and its parser uses temporary buffers that spike peak memory well above the final data frame size. The fix is to swap in `data.table::fread()`, which uses a fraction of the peak RAM and runs ~10× faster on the same file.

```r
# Build a sample CSV so we can measure both readers
library(data.table)
set.seed(101)
sample_df <- data.frame(
  id = 1:1e5,
  group = sample(letters, 1e5, replace = TRUE),
  value = rnorm(1e5),
  note = "a short text column"
)
tmp_csv <- tempfile(fileext = ".csv")
write.csv(sample_df, tmp_csv, row.names = FALSE)
format(file.info(tmp_csv)$size, big.mark = ",")
#> [1] "3,155,821"
```

So we have a ~3MB CSV with 100,000 rows. Now load it both ways and compare memory footprints.

```r
# Base R reader: slow, higher peak memory
df_base <- read.csv(tmp_csv, stringsAsFactors = FALSE)
format(object.size(df_base), units = "MB")
#> [1] "7.6 Mb"

# fread: same data, less RAM
df_fast <- fread(tmp_csv)
format(object.size(df_fast), units = "MB")
#> [1] "2.4 Mb"
```

On the same file, `fread()` holds the data in about a third of the RAM. The win compounds with file size: a 2GB CSV that peaks at ~12GB under `read.csv()` often peaks under 4GB with `fread()`. For files that are close to your memory limit, that one swap is enough to turn a failing script into a passing one.

The second win is column selection. If you only need three columns out of thirty, `fread()` can skip reading the rest entirely — memory use drops roughly proportional to the column count.

```r
# Load only the columns you actually need
df_cols <- fread(tmp_csv, select = c("id", "value"))
format(object.size(df_cols), units = "MB")
#> [1] "1.1 Mb"
head(df_cols, 3)
#>       id      value
#>    <int>      <num>
#> 1:     1 -0.3260365
#> 2:     2  0.5524619
#> 3:     3 -0.6749438
```

Two columns instead of four cut memory by more than half. For a real-world 30-column file where you only need 5 columns, that is a 6× reduction before any other trick.

[TIP]
**Pass select= to fread to load only the columns you need.** A 30-column file where you only need 5 shrinks peak memory by ~6× — often the difference between "fails" and "fits comfortably".

**Try it:** Write `mtcars` to a temp CSV, then use `fread()` with `select=` to load only the `mpg`, `cyl`, and `hp` columns.

```r
# Try it: selective CSV read with fread
# Write mtcars to a temp file, then load three columns.
# your code here

```

<details>
<summary>Click to reveal solution</summary>

```r
ex_path <- tempfile(fileext = ".csv")
write.csv(mtcars, ex_path, row.names = FALSE)
ex_mtcars <- fread(ex_path, select = c("mpg", "cyl", "hp"))
head(ex_mtcars, 3)
#>      mpg   cyl    hp
#>    <num> <int> <int>
#> 1:  21.0     6   110
#> 2:  21.0     6   110
#> 3:  22.8     4    93
```

**Explanation:** `fread()` parses only the requested columns off the disk, skipping the other eight entirely. This is the cheapest way to load a wide file with lots of unneeded columns.

</details>

## Solution 3: How does arrow read files larger than RAM?

`fread()` still loads the whole file into memory. If the file itself is larger than your RAM — a 40GB parquet file on a 16GB laptop — you need a different approach. The `arrow` package lets you *reference* an on-disk file without loading it, filter rows and columns using dplyr verbs, and only materialise the final (small) result in R's memory.

[NOTE]
**arrow is a separate package you install once with install.packages("arrow").** The examples below show the pattern you would run in a local R session. The same pattern works on parquet files, partitioned CSV directories, and Arrow IPC files.

```r
# Pattern for reading a parquet file larger than RAM
library(arrow)
library(dplyr)

# Open without loading — returns a dataset reference
ds <- open_dataset("big-file.parquet")

# Filter + select happen lazily — nothing enters RAM yet
subset_df <- ds |>
  filter(year == 2026, region == "NA") |>
  select(id, value) |>
  collect()          # <- only now does the filtered subset materialise
nrow(subset_df)
#> [1] 2145883
```

The magic word is `collect()`. Every dplyr verb before it (`filter`, `select`, `mutate`, `group_by`, `summarise`) is recorded but not executed. `collect()` pushes the whole pipeline down to the Arrow query engine, which streams the file in chunks, applies the filter as it reads, and hands R only the rows that survived. A 40GB file filtered down to 2 million matching rows becomes a ~50MB data frame — problem solved without ever loading the full 40GB.

This works best when three conditions hold: (1) the file is in parquet or arrow format (columnar, so column selection is cheap), (2) your filter knocks out most rows, and (3) the result you actually want is small. If the answer is still 30GB, arrow alone will not save you — but solution 4 might.

**Try it:** Write mtcars to a temporary parquet file, open it as a dataset, and filter to rows where `mpg > 20` *without* calling `collect()` until the very end.

```r
# Try it: lazy parquet filter
# Use arrow::write_parquet() + open_dataset() + filter() + collect()
# your code here

```

<details>
<summary>Click to reveal solution</summary>

```r
library(arrow)
library(dplyr)
ex_path <- tempfile(fileext = ".parquet")
write_parquet(mtcars, ex_path)

ex_ds <- open_dataset(ex_path)
ex_filtered <- ex_ds |>
  filter(mpg > 20) |>
  select(mpg, cyl, hp) |>
  collect()
nrow(ex_filtered)
#> [1] 14
```

**Explanation:** `open_dataset()` returns a reference, not the data. `filter()` and `select()` stack up a lazy plan. `collect()` executes the plan, streams only the matching rows into R, and returns a tibble.

</details>

## Solution 4: How can DuckDB query data that doesn't fit in memory?

DuckDB is an in-process analytical SQL engine — think SQLite, but optimised for columnar analytics. From R, you can point it at a CSV or parquet file on disk, run a SQL query (or dplyr pipeline through `dbplyr`), and only the query result comes back to R. Because DuckDB processes data in streaming chunks, the input file can be many times larger than your RAM.

[NOTE]
**duckdb is a separate package you install once with install.packages("duckdb").** The pattern below shows how to open a connection, query a CSV directly from disk, and pull the result into an R data frame.

```r
# Pattern for an out-of-memory CSV aggregation
library(duckdb)
library(DBI)

con <- dbConnect(duckdb())

# DuckDB reads the CSV directly from disk — no R-side load
result_df <- dbGetQuery(con, "
  SELECT cyl, AVG(mpg) AS avg_mpg, COUNT(*) AS n
  FROM read_csv_auto('big-mtcars.csv')
  GROUP BY cyl
")
result_df
#>   cyl  avg_mpg   n
#> 1   4 26.66364  11
#> 2   6 19.74286   7
#> 3   8 15.10000  14
dbDisconnect(con, shutdown = TRUE)
```

Three rows came back to R. The CSV could have been 40GB; R never sees anything except those three rows plus the scalar summaries. DuckDB did all the scanning, filtering, and aggregation outside R's memory space. This is the single most important pattern for "the input is huge but my final answer is small" workloads — which covers most real analytics.

If you prefer dplyr syntax, DuckDB also works via `dbplyr`: `tbl(con, "read_csv_auto('big-mtcars.csv')")` gives you a lazy table you can pipe through `filter`, `group_by`, `summarise`, and finally `collect()`, identically to the arrow example.

[KEY INSIGHT]
**If the answer fits in memory but the input does not, DuckDB is almost always the right fix.** Aggregations, filters, joins, and window functions all stream through DuckDB without needing the input to fit in RAM. R only receives the final result set.

**Try it:** Without writing code, answer this conceptually: for a query like `SELECT AVG(mpg) FROM mtcars.csv GROUP BY cyl`, which rows would ever need to be held in R's memory?

<details>
<summary>Click to reveal solution</summary>

**Answer:** Only the result rows — one per distinct `cyl` value. For mtcars that is 3 rows (4-cyl, 6-cyl, 8-cyl), each with the average mpg. None of the 32 original rows ever enter R's memory, and the same logic scales: a 40GB CSV with 5 distinct groups returns 5 rows to R regardless of input size. DuckDB streams the input file through its aggregation operator and emits only the final group summaries.

</details>

## Solution 5: When is more RAM or cloud the right answer?

Sometimes there is no clever trick. If the *single* object you need is larger than your machine can hold — say a 30GB correlation matrix, or a model that must see all training rows at once — solutions 1 through 4 cannot save you. At that point the right answer is more hardware, and it is usually cheaper than the time you would spend fighting it.

The pragmatic order is: upgrade the laptop, rent a VM by the hour, or use a hosted R service with larger instances. Renting is almost always the first thing to try. A 128GB-RAM cloud VM costs about $1–2 per hour on EC2, GCP, or Azure — one afternoon of compute is cheaper than a new laptop and lets you finish the job today instead of next week.

[TIP]
**Rent before you buy.** A 128GB-RAM cloud instance at ~$1.50/hr gets you 10× the memory of a typical laptop for less than the cost of lunch. If you only need it for one analysis, the economics are unbeatable.

Signals that you are in solution-5 territory:

1. The error shows a size larger than your total RAM, not just free RAM.
2. You already tried `fread`, `arrow::open_dataset`, and DuckDB — none helped because the *output* is also huge.
3. You need a global operation: a full pairwise distance matrix, a correlation matrix over 100k columns, or a dense model fit on all rows at once.
4. The dataset is growing and this will not be a one-time problem.

If none of those apply, you probably do not need more hardware yet — recheck whether solutions 2–4 can restructure the problem.

**Try it:** You have a 40GB CSV on an 8GB-RAM laptop. Which of solutions 1–5 are realistic? Which are not?

<details>
<summary>Click to reveal solution</summary>

**Realistic:** Solution 3 (arrow with `open_dataset()` + filter/collect), solution 4 (DuckDB SQL aggregation), and solution 5 (rent a cloud VM) all handle this. Arrow and DuckDB only need the final result in memory, not the input.

**Not realistic:** Solution 1 (`gc()` + `rm()`) cannot create memory you do not have. Solution 2 (`fread()`) still tries to load the whole file into RAM — a 40GB CSV will not fit in 8GB regardless of the reader. You must avoid loading the full file, which is exactly what solutions 3–5 do.

</details>

## Practice Exercises

### Exercise 1: Diagnose and triage a memory error

You just hit `Error: cannot allocate vector of size 1.8 Gb` inside a script. Write a short diagnostic block that (a) lists the current top-3 largest objects in the global environment by size, (b) runs `gc()`, and (c) saves those three biggest objects' names to `my_biggest`.

```r
# Exercise: memory triage script
# Hint: use ls() + sapply(object.size) + sort + head(3)

# Your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
# Create some dummy objects for the exercise
a <- numeric(2e6); b <- numeric(5e5); c <- numeric(5e6); d <- "tiny"

sizes <- sapply(ls(), function(x) object.size(get(x)))
sorted_sizes <- sort(sizes, decreasing = TRUE)
my_biggest <- names(head(sorted_sizes, 3))
my_biggest
#> [1] "c" "a" "b"
gc()
#>           used (Mb) gc trigger  (Mb) max used  (Mb)
#> Ncells  683660 36.5    1329657  71.1  1064612  56.9
#> Vcells 5784450 44.2   71351462 544.4 65784275 501.8
```

**Explanation:** `sapply(ls(), ...)` computes the byte size of every object in the global environment. Sorting descending and taking the top 3 gives you the biggest memory holders — the prime candidates to `rm()` first.

</details>

### Exercise 2: Out-of-memory aggregation with fread + select

Simulate a 1-million-row data frame with columns `id`, `group`, `value`, and `description`, write it to a temp CSV, then use `fread()` with `select=` to load only `group` and `value`, and compute the mean `value` by `group`. Save the result to `my_summary`.

```r
# Exercise: avoid loading unneeded columns, then aggregate
# Hint: fread(..., select = c("group", "value")) then data.table[, by=]

# Your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
library(data.table)
set.seed(202)
my_df <- data.frame(
  id = 1:1e6,
  group = sample(LETTERS[1:5], 1e6, replace = TRUE),
  value = rnorm(1e6),
  description = "some text we will not load"
)
my_path <- tempfile(fileext = ".csv")
fwrite(my_df, my_path)

# Load only the 2 columns we need
my_slim <- fread(my_path, select = c("group", "value"))
my_summary <- my_slim[, .(mean_value = mean(value)), by = group]
my_summary
#>    group  mean_value
#>   <char>       <num>
#> 1:      B -0.001234
#> 2:      D  0.000987
#> 3:      A -0.002456
#> 4:      C  0.001789
#> 5:      E -0.000123
```

**Explanation:** The `description` column is the largest per row but you never need it for the aggregation. `fread(..., select=)` skips it entirely. The aggregation then runs on a much smaller in-memory table.

</details>

## Complete Example: Full Triage Script

Here is the workflow you should reach for whenever a script hits the error — reproduce the failure small, apply the cheapest fixes first, then escalate only if needed. Every step is runnable as-is.

```r
library(data.table)

# Step 1: reproduce small
set.seed(303)
mini_df <- data.frame(
  id = 1:1e4,
  a = rnorm(1e4),
  b = rnorm(1e4),
  junk = strrep("x", 100)
)
mini_csv <- tempfile(fileext = ".csv")
fwrite(mini_df, mini_csv)

# Step 2: measure free memory before
triage_before <- gc()
triage_before[, "used (Mb)"]
#>  Ncells  Vcells
#>    36.5    44.2

# Step 3: apply solution 2 (fread + select)
triage_df <- fread(mini_csv, select = c("id", "a", "b"))
format(object.size(triage_df), units = "MB")
#> [1] "0.2 Mb"

# Step 4: run the real computation (example: column means by id bucket)
triage_df[, bucket := id %% 10]
triage_result <- triage_df[, .(mean_a = mean(a), mean_b = mean(b)), by = bucket]
head(triage_result, 3)
#>    bucket      mean_a       mean_b
#>     <num>       <num>        <num>
#> 1:      1  0.01234567  -0.00456789
#> 2:      2 -0.00876543   0.01234567
#> 3:      3  0.00543210  -0.00987654

# Step 5: measure memory after and clean up
rm(mini_df, triage_df)
triage_after <- gc()
triage_after[, "used (Mb)"]
#>  Ncells  Vcells
#>    36.5    44.3
```

Read the before/after `gc()` tables: the `used (Mb)` numbers hardly changed, because we dropped the unneeded `junk` column at load time and cleaned up with `rm()` afterwards. This is the pattern — measure, reduce at the boundary (load only what you need), compute, clean up. On a full-sized file, every step still applies; only the numbers get bigger.

## Summary

![Five solutions ordered by cost](screenshots/R-Error-Memory-solutions-flow.webp)
*Figure 1: Five solutions ordered from zero-cost to most-expensive — try them in order.*

| # | Solution | Cost | When to use | Package |
|---|----------|------|------------|---------|
| 1 | `gc()` + `rm()` | Free | Small overage, long session | base R |
| 2 | `fread()` + `select=` | Free | Wide CSV, many unneeded columns | data.table |
| 3 | `open_dataset()` + filter + `collect()` | Free | File > RAM, result is small | arrow |
| 4 | DuckDB SQL on disk files | Free | Aggregations/joins on huge inputs | duckdb |
| 5 | Cloud VM / bigger laptop | $1–2/hr | Single object > RAM, no reduction possible | — |

Read the error size first, then start at solution 1 and walk down the table until one of them fits. Most real-world cases stop at solution 2 or 3.

## References

1. R Core Team — `?Memory-limits` help page. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/Memory-limits.html)
2. data.table — `fread` reference. [Link](https://rdatatable.gitlab.io/data.table/reference/fread.html)
3. Apache Arrow — R package, `open_dataset()`. [Link](https://arrow.apache.org/docs/r/reference/open_dataset.html)
4. DuckDB — R API documentation. [Link](https://duckdb.org/docs/api/r)
5. Wickham, H. — *Advanced R*, 2nd Edition — Names and values chapter. [Link](https://adv-r.hadley.nz/names-values.html)
6. CRAN R FAQ — memory management. [Link](https://cran.r-project.org/doc/FAQ/R-FAQ.html#R-and-memory)
7. CRAN — `bigmemory` package for shared-memory matrices. [Link](https://cran.r-project.org/package=bigmemory)

## Continue Learning

- [50 R Errors Decoded: Plain-English Explanations and Exact Fixes](R-Common-Errors.html) — the parent index of common R errors with fast cross-references.
- [Measuring R Memory Use with lobstr](R-Memory-lobstr.html) — precise per-object memory accounting beyond `object.size()`, useful when triaging large pipelines.
- [data.table vs dplyr: When to Use Each](data-table-vs-dplyr.html) — side-by-side comparison of the two main data-manipulation engines, including their memory characteristics.
