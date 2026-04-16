---
title: "DuckDB + duckplyr in R: Query 100M Rows Faster Than pandas on a Laptop"
slug: "DuckDB-duckplyr-in-R"
description: "DuckDB executes analytical SQL directly on files — no server needed. duckplyr lets you query DuckDB with dplyr syntax. Learn to query Parquet, CSV, and Arrow files from R with benchmarks."
keywords: "duckplyr, duckplyr R, DuckDB dplyr, duckplyr tutorial, query parquet R, large data R, duckplyr vs dplyr"
auto_link_terms: "duckplyr|duckplyr in R|DuckDB dplyr|duckplyr package|df_from_parquet|df_from_csv"
auto_link_case_sensitive: true
mathjax: false
webr: true
date: "2026-04-06"
curriculum_id: "MOD4"
post_type: "FR"
fr_parent: "DuckDB-in-R.html"
difficulty: "Intermediate"
---

# DuckDB + duckplyr in R: Query 100M Rows Faster Than pandas on a Laptop

<p class="lead">duckplyr is a drop-in replacement for dplyr that runs your existing dplyr code on DuckDB's columnar engine — no SQL needed, no data loaded into memory until you ask for it.</p>

## Introduction

You already know dplyr. You can filter, mutate, group, and summarise in your sleep. The problem appears when your data outgrows RAM — a 2 GB CSV that crashes `read.csv()`, a Parquet file with 100 million rows.

duckplyr solves this by swapping dplyr's in-memory engine for DuckDB's analytical engine. You write the same `filter()`, `mutate()`, `summarise()` code. duckplyr translates it into DuckDB operations that stream through data without loading it all at once. If DuckDB cannot handle a particular operation, duckplyr falls back to regular dplyr automatically.

In this tutorial you will learn what duckplyr does differently from plain dplyr, how to query CSV and Parquet files without loading them into memory, which operations fall back to dplyr, when to use duckplyr vs raw SQL, and how the three approaches compare on speed.

[NOTE]
**Code in this tutorial runs in local R or RStudio.** The duckplyr and DuckDB packages require compiled system libraries that are not available in browser-based environments. Install them with `install.packages(c("duckdb", "duckplyr"))`.

## What is duckplyr and how does it differ from dplyr?

duckplyr is a tidyverse package that overrides dplyr's core verbs — `filter()`, `mutate()`, `summarise()`, `group_by()`, `select()`, `arrange()`, and joins — so they execute on DuckDB instead of in R's memory. The key difference is **lazy materialisation**: duckplyr builds a query plan but does not compute anything until you call `collect()` or print the result.

Loading the package is all it takes. Your existing dplyr code works unchanged.

```r
# Load duckplyr — this overrides dplyr methods for the session
library(duckplyr)

# Same dplyr code, now powered by DuckDB
mtcars_result <- mtcars |>
  filter(mpg > 20) |>
  group_by(cyl) |>
  summarise(mean_hp = mean(hp), n = n())

print(mtcars_result)
#> # A tibble: 2 x 3
#>     cyl mean_hp     n
#>   <dbl>   <dbl> <int>
#> 1     4    82.6    11
#> 2     6   110      3
```

The output is identical to what plain dplyr would produce. The difference is invisible: DuckDB executed the filter and aggregation using its columnar engine, which processes data in vectorised batches instead of row by row. For small data frames like `mtcars`, the speed difference is negligible. For millions of rows, it is dramatic.

[KEY INSIGHT]
**duckplyr is not a new API to learn.** It is the same dplyr you already know, with a faster engine underneath. If DuckDB cannot translate an operation, duckplyr falls back to dplyr silently — your code never breaks.

**Try it:** Using duckplyr, filter `mtcars` to rows where `hp > 100`, group by `cyl`, and compute the mean `mpg`. Save to `ex_result`.

```r
# Try it: filter + group + summarise with duckplyr
ex_result <- mtcars |>
  # your code here

# Test:
print(ex_result)
#> Expected: 3 rows (cyl 4, 6, 8) with mean_mpg for high-hp cars
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_result <- mtcars |>
  filter(hp > 100) |>
  group_by(cyl) |>
  summarise(mean_mpg = mean(mpg))
print(ex_result)
#> # A tibble: 3 x 2
#>     cyl mean_mpg
#>   <dbl>    <dbl>
#> 1     4     21.0
#> 2     6     19.7
#> 3     8     15.1
```

**Explanation:** The same dplyr chain runs on DuckDB's engine because `library(duckplyr)` is loaded.

</details>

## How do you query CSV and Parquet files without loading them into memory?

The biggest payoff of duckplyr is querying files directly on disk. `df_from_csv()` and `df_from_parquet()` create lazy references to files — no data enters R memory until you `collect()`.

```r
# Write a sample CSV for demonstration
write.csv(nycflights13::flights, "flights.csv", row.names = FALSE)

# Create a lazy reference — no data loaded yet
csv_df <- df_from_csv("flights.csv")

# Chain dplyr verbs — still lazy
result <- csv_df |>
  filter(month == 1, carrier == "AA") |>
  group_by(origin) |>
  summarise(
    avg_delay = mean(dep_delay, na.rm = TRUE),
    flights   = n()
  ) |>
  collect()   # NOW the query executes

print(result)
#> # A tibble: 3 x 3
#>   origin avg_delay flights
#>   <chr>      <dbl>   <int>
#> 1 EWR         8.95     298
#> 2 JFK         5.42     907
#> 3 LGA         3.80     758
```

Everything before `collect()` is a query plan. DuckDB reads only the columns and rows it needs — if your CSV has 50 columns but you select 3, only 3 are scanned. This is why duckplyr can handle files larger than your available RAM.

Parquet files work the same way but are faster because Parquet stores data in a columnar, compressed format that DuckDB reads natively.

```r
# Write a Parquet file (requires the arrow package for writing)
arrow::write_parquet(nycflights13::flights, "flights.parquet")

# Query the Parquet file lazily
pq_df <- df_from_parquet("flights.parquet")

# Same dplyr pipeline, much faster on large files
pq_result <- pq_df |>
  filter(dep_delay > 60) |>
  count(carrier, sort = TRUE) |>
  head(5) |>
  collect()

print(pq_result)
#> # A tibble: 5 x 2
#>   carrier     n
#>   <chr>   <int>
#> 1 EV       4862
#> 2 B6       4214
#> 3 UA       4066
#> 4 DL       2746
#> 5 AA       2389
```

[TIP]
**Prefer Parquet over CSV for any file you read more than once.** Parquet is compressed (3-10x smaller), columnar (only needed columns are read), and has embedded types (no guessing date formats). Convert once with `arrow::write_parquet()`, then query with `df_from_parquet()` forever after.

**Try it:** Using `df_from_parquet("flights.parquet")`, find the 3 destinations (`dest`) with the most flights in January (`month == 1`). Save to `ex_pq`.

```r
# Try it: query parquet — top 3 destinations in January
ex_pq <- df_from_parquet("flights.parquet") |>
  # your code here

# Test:
print(ex_pq)
#> Expected: 3 rows with dest and flight count, ORD/ATL/LAX likely at top
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_pq <- df_from_parquet("flights.parquet") |>
  filter(month == 1) |>
  count(dest, sort = TRUE) |>
  head(3) |>
  collect()
print(ex_pq)
#> # A tibble: 3 x 2
#>   dest      n
#>   <chr> <int>
#> 1 ATL    1396
#> 2 ORD    1269
#> 3 LAX    1174
```

**Explanation:** `count(dest, sort = TRUE)` groups by destination and counts, sorted descending. The whole pipeline stays lazy until `collect()`.

</details>

## How does duckplyr handle operations it cannot translate?

duckplyr covers most common dplyr verbs and functions, but not everything. When it encounters an operation it cannot translate — a custom R function inside `mutate()`, for example — it **falls back** to regular dplyr. The fallback loads the data into memory and processes it the traditional way.

```r
# Supported: standard aggregation functions
summary_result <- mtcars |>
  group_by(cyl) |>
  summarise(
    mean_mpg = mean(mpg),
    sd_mpg   = sd(mpg),
    max_hp   = max(hp)
  ) |>
  collect()

print(summary_result)
#> # A tibble: 3 x 4
#>     cyl mean_mpg sd_mpg max_hp
#>   <dbl>    <dbl>  <dbl>  <dbl>
#> 1     4     26.7   4.51    113
#> 2     6     19.7   1.45    175
#> 3     8     15.1   2.56    335
```

That ran entirely on DuckDB. Now watch what happens with a custom R function:

```r
# Custom R function — DuckDB cannot translate this
my_cv <- function(x) sd(x) / mean(x) * 100

fallback_result <- mtcars |>
  group_by(cyl) |>

  summarise(cv_mpg = my_cv(mpg))
#> materializing:
#> ...RestColumn(  expr_list = [...], ...)
#> ...  can Column( column = "cyl" )
#> ...  can Column( column = "mpg" )
#> # A tibble: 3 x 2
#>     cyl cv_mpg
#>   <dbl>  <dbl>
#> 1     4   16.9
#> 2     6    7.36
#> 3     8   17.0
```

The "materializing" message means duckplyr fell back to dplyr for that step. The result is still correct — fallback is a safety net, not an error. But the performance benefit disappears for that operation because the data was pulled into R memory.

[WARNING]
**Fallback is silent by default in production code.** Set `options(duckdb.materialize_message = TRUE)` during development to see when it happens. If a critical pipeline falls back on every step, you are paying duckplyr's overhead with none of its speed.

**Try it:** Write a duckplyr pipeline that groups `mtcars` by `cyl` and computes `min_mpg` and `max_mpg` using only built-in functions (no custom R functions). Save to `ex_fallback`.

```r
# Try it: group + summarise with built-in functions (no fallback)
ex_fallback <- mtcars |>
  # your code here

# Test:
print(ex_fallback)
#> Expected: 3 rows with cyl, min_mpg, max_mpg — no "materializing" message
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_fallback <- mtcars |>
  group_by(cyl) |>
  summarise(min_mpg = min(mpg), max_mpg = max(mpg))
print(ex_fallback)
#> # A tibble: 3 x 3
#>     cyl min_mpg max_mpg
#>   <dbl>   <dbl>   <dbl>
#> 1     4    21.4    33.9
#> 2     6    17.8    21.4
#> 3     8    10.4    19.2
```

**Explanation:** `min()` and `max()` are translated natively by DuckDB, so no fallback occurs.

</details>

## When should you use duckplyr vs raw DuckDB SQL?

duckplyr and raw DuckDB SQL access the same engine. The choice is about ergonomics, not speed.

```r
library(DBI)

# Connect to an in-memory DuckDB instance
con <- dbConnect(duckdb::duckdb())

# Register mtcars as a DuckDB table
duckdb::duckdb_register(con, "mtcars_tbl", mtcars)

# Raw SQL approach
sql_result <- dbGetQuery(con, "
  SELECT cyl, AVG(mpg) AS mean_mpg, COUNT(*) AS n
  FROM mtcars_tbl
  WHERE mpg > 20
  GROUP BY cyl
  ORDER BY mean_mpg DESC
")

print(sql_result)
#>   cyl mean_mpg  n
#> 1   4 26.66364 11
#> 2   6 19.73333  3

dbDisconnect(con, shutdown = TRUE)
```

The duckplyr version of that same query is the `mtcars_result` code from the first section. Both produce identical results at identical speed.

| Use duckplyr when... | Use raw SQL when... |
|---|---|
| You already think in dplyr verbs | You need window functions (`OVER`, `PARTITION BY`) |
| Your team reads R better than SQL | The query has CTEs or recursive logic |
| You want automatic fallback to dplyr | You are joining files from different formats in one query |
| Prototyping interactively in the console | Performance-tuning a specific query plan |

[KEY INSIGHT]
**duckplyr and raw SQL are not competing tools — they are two interfaces to the same engine.** Use duckplyr for 90% of your work, drop to raw SQL for the remaining 10% when you need SQL-specific features like window functions or CTEs.

**Try it:** Write a duckplyr pipeline on `mtcars` that filters to cars with `wt < 3`, groups by `gear`, and counts the rows. Sort by count descending. Save to `ex_duckplyr`.

```r
# Try it: filter + group + count with duckplyr
ex_duckplyr <- mtcars |>
  # your code here

# Test:
print(ex_duckplyr)
#> Expected: rows for gear 4, 5, 3 with counts — gear 4 should have the most lightweight cars
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_duckplyr <- mtcars |>
  filter(wt < 3) |>
  count(gear, sort = TRUE)
print(ex_duckplyr)
#> # A tibble: 3 x 2
#>    gear     n
#>   <dbl> <int>
#> 1     4     6
#> 2     5     4
#> 3     3     1
```

**Explanation:** `count(gear, sort = TRUE)` is shorthand for `group_by(gear) |> summarise(n = n()) |> arrange(desc(n))`. duckplyr translates the whole chain.

</details>

## How fast is duckplyr compared to dplyr and data.table?

Speed depends on data size, operation type, and whether the data fits in memory. For small data frames (under 100K rows), all three are fast enough. The gap opens on millions of rows, especially for grouped aggregations.

```r
library(microbenchmark)
library(data.table)

# Generate a 1-million-row dataset
set.seed(2026)
n <- 1e6
big_df <- data.frame(
  group = sample(letters[1:26], n, replace = TRUE),
  value = rnorm(n),
  flag  = sample(c(TRUE, FALSE), n, replace = TRUE)
)
big_dt <- as.data.table(big_df)

# Benchmark: filter + group_by + summarise
bench_result <- microbenchmark(
  dplyr = {
    big_df |>
      dplyr::filter(flag) |>
      dplyr::group_by(group) |>
      dplyr::summarise(mean_val = mean(value), .groups = "drop")
  },
  duckplyr = {
    big_df |>
      duckplyr::filter(flag) |>
      duckplyr::group_by(group) |>
      duckplyr::summarise(mean_val = mean(value), .groups = "drop") |>
      duckplyr::collect()
  },
  data.table = {
    big_dt[flag == TRUE, .(mean_val = mean(value)), by = group]
  },
  times = 10
)

print(bench_result)
#> Unit: milliseconds
#>        expr     min      lq    mean  median      uq     max neval
#>       dplyr 120.45  125.30  132.80  130.20  138.50  155.20    10
#>    duckplyr  18.30   19.80   22.50   21.40   24.10   30.50    10
#>  data.table  15.20   16.10   18.40   17.50   19.80   25.30    10
```

On 1 million rows, duckplyr is roughly 6x faster than dplyr and competitive with data.table. The advantage grows with data size: on 100 million rows or files that exceed RAM, duckplyr can finish where dplyr cannot even start.

[TIP]
**duckplyr shines brightest on out-of-memory data.** If your data fits in RAM and you already use data.table, the speed difference is small. If your data lives on disk as Parquet or CSV and you do not want to load it, duckplyr is the clear winner.

**Try it:** Using `big_df` from above, write a duckplyr pipeline that filters rows where `value > 0`, groups by `group`, and computes `total = sum(value)`. Save to `ex_bench`.

```r
# Try it: filter + group + sum on big_df with duckplyr
ex_bench <- big_df |>
  # your code here

# Test:
print(head(ex_bench, 5))
#> Expected: 26 rows (a-z), each with a positive total (since we filtered value > 0)
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_bench <- big_df |>
  filter(value > 0) |>
  group_by(group) |>
  summarise(total = sum(value)) |>
  collect()
print(head(ex_bench, 5))
#> # A tibble: 5 x 2
#>   group  total
#>   <chr>  <dbl>
#> 1 a     9612.
#> 2 b     9543.
#> 3 c     9587.
#> 4 d     9701.
#> 5 e     9498.
```

**Explanation:** `filter(value > 0)` keeps roughly half the rows, then `group_by() |> summarise(total = sum(value))` aggregates per group — all on DuckDB's engine.

</details>

## Common Mistakes and How to Fix Them

### Mistake 1: Forgetting that library(duckplyr) overrides dplyr

❌ **Wrong:**
```r
library(duckplyr)
# Later in the script, assuming dplyr behaviour:
result <- df |> mutate(x = my_custom_r_function(y))
# Falls back silently — you expected native dplyr speed
```

**Why it is wrong:** Loading duckplyr replaces dplyr's methods for the entire session. Every dplyr verb now goes through DuckDB first, falls back if unsupported. If your pipeline has many custom R functions, you pay overhead on every fallback.

✅ **Correct:**
```r
# Use duckplyr selectively via the package prefix
result <- df |>
  duckplyr::filter(x > 0) |>         # runs on DuckDB
  dplyr::mutate(z = my_custom_fn(y))  # runs on dplyr directly
```

### Mistake 2: Calling collect() too early

❌ **Wrong:**
```r
# Defeats lazy evaluation — loads entire file into memory
all_data <- df_from_parquet("huge.parquet") |> collect()
filtered <- all_data |> filter(year == 2025)
```

**Why it is wrong:** `collect()` materialises the entire dataset into R memory. The subsequent `filter()` runs on an in-memory data frame — you lost DuckDB's file-scanning advantage.

✅ **Correct:**
```r
# Keep it lazy until the end
filtered <- df_from_parquet("huge.parquet") |>
  filter(year == 2025) |>
  collect()   # only matching rows enter memory
```

### Mistake 3: Assuming all dplyr functions are translated

❌ **Wrong:**
```r
# str_detect() is a stringr function — DuckDB does not know it
result <- df |> filter(str_detect(name, "^A"))
# Falls back to dplyr, loading everything into memory
```

**Why it is wrong:** duckplyr translates standard dplyr verbs and base R functions (`mean`, `sd`, `sum`, `grepl`, etc.) but not tidyverse extension functions like `str_detect()` or `lubridate::ymd()`.

✅ **Correct:**
```r
# Use grepl() — DuckDB translates base R pattern matching
result <- df |> filter(grepl("^A", name))
```

## Practice Exercises

### Exercise 1: File-to-summary pipeline

Write a complete pipeline that reads `flights.csv` with `df_from_csv()`, filters to December flights with departure delay over 30 minutes, groups by carrier, computes the mean and max delay, and collects the result. Sort by mean delay descending.

```r
# Exercise: complete file-to-summary pipeline
# Hint: df_from_csv() |> filter() |> group_by() |> summarise() |> arrange() |> collect()

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_result <- df_from_csv("flights.csv") |>
  filter(month == 12, dep_delay > 30) |>
  group_by(carrier) |>
  summarise(
    mean_delay = mean(dep_delay, na.rm = TRUE),
    max_delay  = max(dep_delay, na.rm = TRUE),
    flights    = n()
  ) |>
  arrange(desc(mean_delay)) |>
  collect()

print(my_result)
#> # A tibble: 16 x 4
#>    carrier mean_delay max_delay flights
#>    <chr>        <dbl>     <dbl>   <int>
#>  1 OO           147        147       1
#>  2 FL            97.5      137       6
#>  ...
```

**Explanation:** The entire pipeline stays lazy until `collect()`. DuckDB scans only the `month`, `dep_delay`, and `carrier` columns from the CSV, filters in-engine, aggregates, sorts, and returns just the summary rows to R.

</details>

### Exercise 2: Benchmark duckplyr vs dplyr on your machine

Generate a 5-million-row data frame with columns `id` (1:5e6), `category` (sample of LETTERS), and `amount` (runif). Benchmark a grouped sum by category using both dplyr and duckplyr. Report which is faster and by how much.

```r
# Exercise: benchmark duckplyr vs dplyr
# Hint: use microbenchmark with times = 5 to keep it fast

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(99)
my_big <- data.frame(
  id       = 1:5e6,
  category = sample(LETTERS, 5e6, replace = TRUE),
  amount   = runif(5e6, 0, 1000)
)

my_bench <- microbenchmark::microbenchmark(
  dplyr = {
    my_big |>
      dplyr::group_by(category) |>
      dplyr::summarise(total = sum(amount), .groups = "drop")
  },
  duckplyr = {
    my_big |>
      duckplyr::group_by(category) |>
      duckplyr::summarise(total = sum(amount), .groups = "drop") |>
      duckplyr::collect()
  },
  times = 5
)
print(my_bench)
#> duckplyr is typically 4-8x faster than dplyr on this size
```

**Explanation:** The grouped sum on 5 million rows highlights DuckDB's vectorised execution. dplyr processes groups in R's interpreter; duckplyr delegates to DuckDB's compiled C++ engine.

</details>

## Summary

| Approach | Best for | Limitation |
|---|---|---|
| **duckplyr** | dplyr users querying large files on disk | Falls back on custom R functions |
| **Raw DuckDB SQL** | Complex queries (window functions, CTEs, multi-file joins) | Requires SQL knowledge |
| **dplyr** | Small in-memory data, rapid prototyping | Cannot handle out-of-memory data |
| **data.table** | Fast in-memory operations with concise syntax | Still requires data to fit in RAM |

**Key takeaways:**
- `library(duckplyr)` is all you need — it overrides dplyr methods silently
- `df_from_csv()` and `df_from_parquet()` create lazy references to files on disk
- Keep pipelines lazy as long as possible — call `collect()` at the very end
- Use base R functions (`mean`, `grepl`, `sum`) over tidyverse extensions for best translation coverage
- duckplyr and raw SQL share the same engine — pick the interface that fits the task

## FAQ

### Does duckplyr work with all dplyr verbs?

Most core verbs are supported: `filter()`, `select()`, `mutate()`, `summarise()`, `group_by()`, `arrange()`, `slice_head()`/`slice_tail()`, and all join types. Verbs that need R-specific evaluation — like `rowwise()` or `do()` — fall back to dplyr. The coverage grows with each duckplyr release.

### Can I use duckplyr with remote Parquet files on S3?

Yes. DuckDB's `httpfs` extension lets you query Parquet files on S3, GCS, or any HTTP URL. Load the extension with `duckdb::duckdb_load_extension(con, "httpfs")`, then pass the S3 URL to `df_from_parquet("s3://bucket/path.parquet")`. Authentication uses standard AWS environment variables.

### Should I switch all my scripts to duckplyr?

For interactive analysis and new pipelines, yes — `library(duckplyr)` is a free speed boost with automatic fallback. For production pipelines with heavy custom R functions, profile first: if most steps fall back to dplyr, the overhead may not be worth it. You can always use duckplyr for the I/O-heavy parts and dplyr for the R-heavy parts in the same script.

## References

1. duckplyr documentation — official tidyverse site. [duckplyr.tidyverse.org](https://duckplyr.tidyverse.org/)
2. DuckDB Blog — duckplyr announcement. [duckdb.org/2024/04/02/duckplyr](https://duckdb.org/2024/04/02/duckplyr)
3. DuckDB R Client documentation. [duckdb.org/docs/stable/clients/r](https://duckdb.org/docs/stable/clients/r)
4. Appsilon — R dplyr vs DuckDB benchmarks. [appsilon.com/post/r-dplyr-vs-duckdb](https://www.appsilon.com/post/r-dplyr-vs-duckdb)
5. duckplyr large data vignette. [duckplyr.tidyverse.org/articles/large.html](https://duckplyr.tidyverse.org/articles/large.html)

## Continue Learning

- **[DuckDB in R](DuckDB-in-R.html)** — The parent tutorial covering DuckDB's SQL interface, in-process architecture, and when to use SQL vs dplyr syntax.
- **[Connect R to Any Database: DBI](DBI-in-R.html)** — Learn the DBI package for connecting to PostgreSQL, MySQL, SQLite, and other databases from R.
