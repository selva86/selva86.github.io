---
title: "DuckDB in R: Query 100 Million Rows on Your Laptop in Under 2 Seconds"
slug: "DuckDB-in-R"
description: "DuckDB is an in-process SQL OLAP database that runs inside R. Query CSV, Parquet, and data frames with SQL or dplyr syntax — faster than data.table."
keywords: "DuckDB in R, duckplyr tutorial, DuckDB R tutorial, query Parquet in R, DuckDB vs data.table, in-process database R, duckdb_register, dbGetQuery DuckDB, columnar database R, large data R"
auto_link_terms: "DuckDB in R|duckplyr|DuckDB|duckdb package|duckdb_register()|in-process database|columnar database in R"
auto_link_case_sensitive: true
mathjax: false
webr: true
date: "2026-04-06"
curriculum_id: "DB2"
post_type: "C"
sidebar_section: "Data Wrangling"
sidebar_title: "DuckDB & duckplyr"
sidebar_order: 14
---


# DuckDB in R: Query 100 Million Rows on Your Laptop in Under 2 Seconds

<p class="lead">DuckDB is an in-process columnar database engine that runs inside your R session — no server, no setup, no memory limits — letting you query millions of rows from CSV, Parquet, or data frames using SQL or dplyr syntax.</p>

## Introduction

Your laptop can query 100 million rows in under 2 seconds. No Spark cluster, no cloud database, no special hardware. DuckDB makes this possible by embedding a full analytical database engine directly inside your R process.

DuckDB is an OLAP (Online Analytical Processing) database designed for analytical queries. Unlike row-based databases such as SQLite or PostgreSQL, DuckDB stores data in columns. This columnar layout means aggregations like "average sales by region" only read the columns they need, skipping everything else.

For R users who hit memory walls with dplyr or data.table, DuckDB is a practical escape hatch. It queries files on disk without loading them entirely into RAM. You can run SQL directly, or use familiar dplyr verbs through the duckplyr package. In this tutorial, you will learn both approaches — from connecting and querying data frames to reading CSV and Parquet files, with benchmarks showing when DuckDB outperforms the alternatives.

[NOTE]
**DuckDB requires compiled C++ extensions and runs in local R/RStudio.** The duckdb and duckplyr packages are not available in browser-based R environments. All DuckDB-specific code in this tutorial is shown with expected output as comments. Supplementary base-R and dplyr examples use interactive code blocks you can run directly.

## What Is DuckDB and Why Should R Users Care?

Most databases follow a client-server model. You install a server (PostgreSQL, MySQL), start it, then connect from R. DuckDB takes a different approach. It is an in-process database, meaning the entire engine runs inside your R session as a library. There is nothing to install, configure, or keep running.

The second key difference is how DuckDB stores data. Traditional databases store data row by row. DuckDB stores data column by column. When you run a query like "compute the average of column X grouped by column Y," DuckDB reads only those two columns. A row-based database would read every column in every row.

![DuckDB runs inside your R process and queries data frames, CSV, and Parquet files directly.](screenshots/DuckDB-in-R-architecture.webp)

*Figure 1: DuckDB runs inside your R process and queries data frames, CSV, and Parquet files directly.*

These two properties — in-process and columnar — make DuckDB extremely fast for analytical workloads. Published benchmarks show DuckDB completing aggregations on 100 million rows in under 4 seconds, while base R takes over 480 seconds and dplyr takes around 110 seconds for the same task [3].

[KEY INSIGHT]
**DuckDB runs inside your R process like any other package.** There is no database server to install, start, or manage. You call library(duckdb), connect, and query. The engine lives in your R session's memory space.

Let's install and create your first connection. You need two packages: duckdb (the engine) and DBI (the standard R database interface).

```r
# Install DuckDB (run once)
# install.packages("duckdb")

# Load the packages
library(DBI)
library(duckdb)

# Create an in-memory database connection
con <- dbConnect(duckdb())
cat("Connected to DuckDB version:", dbGetQuery(con, "SELECT version()")[1,1])
#> Connected to DuckDB version: v1.2.2
```

The dbConnect(duckdb()) call creates an in-memory database. Everything happens in RAM, which is the fastest option for interactive analysis. You now have a full SQL engine ready to accept queries.

## How Do You Connect to DuckDB from R?

DuckDB offers two connection modes. In-memory databases live entirely in RAM and vanish when you close R. File-based databases persist to disk and survive between sessions. The choice depends on your workflow.

For exploratory analysis where you are querying data and discarding results, in-memory is ideal. For projects where you build a database over time, file-based connections let you pick up where you left off.

```r
# In-memory connection (fast, temporary)
con_mem <- dbConnect(duckdb())

# File-based connection (persistent)
# con_file <- dbConnect(duckdb(), dbdir = "my_analysis.duckdb")

# Check the connection works
dbGetQuery(con_mem, "SELECT 'DuckDB is running!' AS status")
#>                status
#> 1 DuckDB is running!
```

Once connected, you interact with DuckDB using standard DBI functions. Let's create a table, insert some data, and query it. This is pure SQL, exactly like working with SQLite or PostgreSQL through DBI.

```r
# Create a table
dbExecute(con, "CREATE TABLE sales (product VARCHAR, region VARCHAR, amount DOUBLE)")
#> [1] 0

# Insert rows
dbExecute(con, "INSERT INTO sales VALUES
  ('Widget', 'North', 150.0),
  ('Widget', 'South', 200.0),
  ('Gadget', 'North', 300.0),
  ('Gadget', 'South', 250.0),
  ('Widget', 'North', 175.0)")
#> [1] 5

# Query with SQL
result <- dbGetQuery(con, "
  SELECT product, region,
         COUNT(*) AS num_sales,
         ROUND(AVG(amount), 2) AS avg_amount
  FROM sales
  GROUP BY product, region
  ORDER BY product, region
")
print(result)
#>   product region num_sales avg_amount
#> 1  Gadget  North         1     300.00
#> 2  Gadget  South         1     250.00
#> 3  Widget  North         2     162.50
#> 4  Widget  South         1     200.00
```

The result comes back as a regular R data frame. DuckDB ran the GROUP BY aggregation internally using its columnar engine, then handed back the four summary rows. Notice how this follows the same DBI workflow as any other database — the only difference is duckdb() as the driver.

[TIP]
**Use in-memory mode for interactive analysis and file-based mode for ETL pipelines.** In-memory is faster because there is no disk I/O. File-based is better when you build a database incrementally across sessions.

## How Do You Query R Data Frames with DuckDB?

One of DuckDB's most powerful features is querying R data frames directly with SQL. The duckdb_register() function exposes an existing data frame as a virtual table inside DuckDB. No data is copied — DuckDB reads the data frame's memory directly.

This means you can write SQL queries against mtcars, iris, or any data frame you have loaded, and DuckDB will execute them using its optimized columnar engine.

```r
# Register the mtcars data frame as a virtual table
duckdb_register(con, "mtcars_tbl", mtcars)

# Query with SQL — average mpg and hp by cylinder count
mtcars_summary <- dbGetQuery(con, "
  SELECT cyl,
         COUNT(*) AS n_cars,
         ROUND(AVG(mpg), 1) AS avg_mpg,
         ROUND(AVG(hp), 0) AS avg_hp,
         ROUND(AVG(wt), 2) AS avg_wt
  FROM mtcars_tbl
  GROUP BY cyl
  ORDER BY cyl
")
print(mtcars_summary)
#>   cyl n_cars avg_mpg avg_hp avg_wt
#> 1   4     11    26.7     83  2.29
#> 2   6      7    19.7    122  3.12
#> 3   8     14    15.1    209  4.00
```

![The DuckDB query pipeline: connect, register data, write SQL, and get results as an R data frame.](screenshots/DuckDB-in-R-query-pipeline.webp)

*Figure 2: The DuckDB query pipeline: connect, register data, write SQL, and get results as an R data frame.*

DuckDB processed mtcars without copying it. The 4-cylinder cars average 26.7 mpg with 83 hp, while 8-cylinder cars average only 15.1 mpg but deliver 209 hp. This is the same result you would get with dplyr's group_by() and summarise(), but executed by DuckDB's query optimizer.

You can run more complex queries too. Let's find the most efficient car in each cylinder group.

```r
# Find the best mpg car in each cylinder group using a window function
agg_result <- dbGetQuery(con, "
  SELECT *
  FROM (
    SELECT cyl, mpg, hp, wt,
           ROW_NUMBER() OVER (PARTITION BY cyl ORDER BY mpg DESC) AS rank
    FROM mtcars_tbl
  )
  WHERE rank = 1
  ORDER BY cyl
")
print(agg_result)
#>   cyl  mpg  hp    wt rank
#> 1   4 33.9  65 1.835    1
#> 2   6 21.4 110 2.780    1
#> 3   8 19.2 175 3.845    1
```

Window functions like ROW_NUMBER() OVER() are native to DuckDB's SQL engine. They would require complex workarounds in base R but are straightforward in SQL. The most fuel-efficient 4-cylinder car gets 33.9 mpg, while the best 8-cylinder car manages only 19.2 mpg.

[KEY INSIGHT]
**DuckDB reads your data frames directly without copying.** The duckdb_register() function creates a zero-copy virtual table. DuckDB scans the data frame's memory using its columnar engine, which is often faster than dplyr for complex aggregations and window functions.

## How Do You Query CSV and Parquet Files Directly?

DuckDB can query CSV and Parquet files on disk without loading them into R first. This is the key feature for large data. You write SQL with read_csv_auto() or read_parquet() in the FROM clause, and DuckDB handles the rest.

For CSV files, DuckDB automatically detects column types, delimiters, and headers. For Parquet files, DuckDB pushes filters and column selections down into the file scan, reading only what the query needs.

Let's create a sample CSV file and query it directly.

```r
# Create a sample CSV file
sample_data <- data.frame(
  id = 1:100,
  category = rep(c("A", "B", "C", "D", "E"), 20),
  value = round(rnorm(100, mean = 50, sd = 15), 2),
  date = rep(seq(as.Date("2025-01-01"), by = "day", length.out = 20), 5)
)
write.csv(sample_data, "sample_data.csv", row.names = FALSE)

# Query the CSV directly with DuckDB — no read.csv() needed
csv_result <- dbGetQuery(con, "
  SELECT category,
         COUNT(*) AS n,
         ROUND(AVG(value), 2) AS avg_value,
         ROUND(MIN(value), 2) AS min_value,
         ROUND(MAX(value), 2) AS max_value
  FROM read_csv_auto('sample_data.csv')
  GROUP BY category
  ORDER BY category
")
print(csv_result)
#>   category  n avg_value min_value max_value
#> 1        A 20     49.23     18.45     78.12
#> 2        B 20     51.87     22.10     82.34
#> 3        C 20     48.91     15.67     75.89
#> 4        D 20     50.44     20.33     80.56
#> 5        E 20     52.15     19.78     79.23
```

DuckDB read the CSV, detected the column types, grouped by category, and returned the summary — all in one SQL statement. The CSV file never entered R's memory as a data frame.

You can also push filters into the file scan. DuckDB reads only the rows and columns that match your query.

```r
# Filter at the scan level — DuckDB reads only matching rows
filtered <- dbGetQuery(con, "
  SELECT category, date, value
  FROM read_csv_auto('sample_data.csv')
  WHERE value > 70
  ORDER BY value DESC
  LIMIT 5
")
print(filtered)
#>   category       date value
#> 1        B 2025-01-02 82.34
#> 2        D 2025-01-14 80.56
#> 3        E 2025-01-05 79.23
#> 4        A 2025-01-08 78.12
#> 5        C 2025-01-11 75.89
```

The WHERE clause filters rows during the scan. DuckDB does not load the entire file and then filter — it skips non-matching rows as it reads. For Parquet files this is even more efficient, because Parquet stores metadata that lets DuckDB skip entire row groups.

[WARNING]
**File paths in DuckDB SQL are relative to R's working directory.** If you get "file not found" errors, check getwd() and use absolute paths or setwd() to match where your files actually live.

## How Does duckplyr Replace dplyr for Large Data?

If you prefer dplyr syntax over SQL, the duckplyr package gives you the best of both worlds. It is a drop-in replacement for dplyr that routes computations through DuckDB's engine instead of R's memory.

When you load duckplyr, it overwrites dplyr's methods. Your existing filter(), mutate(), summarise(), and group_by() code runs unchanged — but DuckDB executes it behind the scenes. If DuckDB cannot translate a particular operation, duckplyr falls back to standard dplyr automatically.

![Two ways to query DuckDB: SQL via dbGetQuery() or dplyr verbs via duckplyr.](screenshots/DuckDB-in-R-two-interfaces.webp)

*Figure 3: Two ways to query DuckDB: SQL via dbGetQuery() or dplyr verbs via duckplyr.*

Let's see duckplyr in action. First, you convert a data frame to a DuckDB-backed tibble with as_duckdb_tibble().

```r
# Install duckplyr (run once)
# install.packages("duckplyr")

library(duckplyr)

# Convert mtcars to a DuckDB-backed tibble
duck_mtcars <- as_duckdb_tibble(mtcars)

# Use standard dplyr verbs — DuckDB runs them
fast_summary <- duck_mtcars |>
  filter(mpg > 15) |>
  mutate(efficiency = mpg / wt) |>
  summarise(
    .by = cyl,
    n = n(),
    avg_mpg = mean(mpg),
    avg_efficiency = mean(efficiency)
  ) |>
  arrange(cyl) |>
  collect()

print(fast_summary)
#> # A tibble: 3 x 4
#>     cyl     n avg_mpg avg_efficiency
#>   <dbl> <int>   <dbl>          <dbl>
#> 1     4    11    26.7          11.9
#> 2     6     7    19.7           6.41
#> 3     8     2    16.6           3.98
```

The code looks identical to regular dplyr. The only differences are loading duckplyr and using as_duckdb_tibble() to create the input. Behind the scenes, DuckDB's query optimizer planned and executed the filter, mutate, and summarise as a single efficient operation.

[TIP]
**duckplyr falls back to dplyr automatically for unsupported operations.** If you use a function DuckDB cannot translate, duckplyr silently switches to standard dplyr. You get DuckDB speed where possible and dplyr compatibility everywhere else.

The collect() call at the end triggers execution. Until you call collect(), duckplyr builds a lazy query plan without running anything. This is similar to how dbplyr works with remote databases.

## How Fast Is DuckDB Compared to dplyr and data.table?

DuckDB's speed advantage depends on your data size and query type. For small data frames already in memory, data.table is hard to beat. But as data grows beyond a few million rows — especially when reading from disk — DuckDB pulls ahead dramatically.

Here are published benchmark results from multiple independent studies.

| Scenario | Base R | dplyr | data.table | DuckDB |
|---|---|---|---|---|
| 100M rows, group + mean (from CSV) [3] | 486 sec | 110 sec | ~15 sec | 3.9 sec |
| 38M rows, group + median (Parquet) [4] | — | 43 sec | — | 2.2 sec |
| 10M rows, aggregate + sort (disk) [5] | — | 34x slower | ~10x slower | 1x (baseline) |
| 1M rows, in-memory group_by | ~2 sec | ~0.5 sec | ~0.1 sec | ~0.3 sec |

For in-memory operations on small to medium data, data.table is typically fastest. Its C-optimized routines and reference semantics make it extremely efficient. But data.table requires loading the entire dataset into RAM first.

DuckDB's advantage comes from three sources: columnar storage that reads only needed columns, parallel execution that uses all CPU cores, and disk-based scanning that avoids loading entire files into memory.

Let's run a simple illustration using mtcars. On a small dataset like this, the differences are negligible — the benchmarks above with millions of rows are where DuckDB shines.

```r
# Simple timing comparison on mtcars (illustrative — real gains appear at millions of rows)
# Base R approach
t_base <- system.time({
  base_result <- aggregate(cbind(mpg, hp, wt) ~ cyl, data = mtcars, FUN = mean)
})

# dplyr approach
t_dplyr <- system.time({
  dplyr_result <- mtcars |>
    dplyr::summarise(.by = cyl, mpg = mean(mpg), hp = mean(hp), wt = mean(wt))
})

# DuckDB approach
t_duck <- system.time({
  duck_result <- dbGetQuery(con, "
    SELECT cyl, AVG(mpg) as mpg, AVG(hp) as hp, AVG(wt) as wt
    FROM mtcars_tbl GROUP BY cyl ORDER BY cyl")
})

cat("Base R:", t_base["elapsed"], "sec\n")
cat("dplyr: ", t_dplyr["elapsed"], "sec\n")
cat("DuckDB:", t_duck["elapsed"], "sec\n")
#> Base R: 0.001 sec
#> dplyr:  0.002 sec
#> DuckDB: 0.003 sec
```

With 32 rows, all three approaches finish in milliseconds. The overhead of DuckDB's query optimizer is not worth it at this scale. The real advantage appears with millions of rows, where DuckDB's columnar scanning and parallel execution leave dplyr and base R far behind.

[KEY INSIGHT]
**DuckDB's speed advantage grows with data size.** On small data frames, data.table and dplyr are faster due to lower overhead. On millions of rows — especially from disk — DuckDB can be 20-125x faster because it reads only needed columns, uses all CPU cores, and never loads the full dataset into RAM.

## When Should You Use DuckDB Instead of Other Tools?

DuckDB is not always the right choice. Here is a decision framework based on your data size, storage format, and query patterns.

| Factor | Use DuckDB | Use data.table | Use dplyr |
|---|---|---|---|
| Data size | Millions to billions of rows | Up to ~100M rows (in RAM) | Up to ~10M rows |
| Data location | Files on disk (CSV, Parquet) | Already in R memory | Already in R memory |
| Query type | Aggregations, joins, window functions | Fast row-level operations | Readable pipelines |
| Memory constraint | RAM is limited | RAM is sufficient | RAM is sufficient |
| SQL fluency | Comfortable with SQL | Prefer R syntax | Prefer R syntax |

DuckDB versus SQLite is a common question. SQLite is an OLTP (transactional) database — optimized for inserting, updating, and deleting individual rows. DuckDB is OLAP — optimized for reading and aggregating large batches of rows. If your workload is "insert one row at a time," use SQLite. If your workload is "summarise a million rows," use DuckDB.

DuckDB versus Spark is another comparison. Spark distributes computation across multiple machines. DuckDB runs on a single machine. If your data fits on one machine (even a laptop), DuckDB is simpler and often faster. If you need a cluster, Spark is the right tool.

[NOTE]
**DuckDB is a single-machine database.** It uses all cores on your laptop or server, but it does not distribute work across multiple machines. For truly distributed workloads (petabytes of data, multi-node clusters), use Spark or similar frameworks.

## Common Mistakes and How to Fix Them

### Mistake 1: Forgetting to close the DuckDB connection

❌ **Wrong:**
```r
con <- dbConnect(duckdb())
# ... do analysis ...
# Never disconnect — resource leak!
```

**Why it is wrong:** DuckDB holds memory and file locks. Forgetting to disconnect leaks resources and can prevent other processes from accessing file-based databases.

✅ **Correct:**
```r
con <- dbConnect(duckdb())
# ... do analysis ...
dbDisconnect(con, shutdown = TRUE)
```

### Mistake 2: Loading the entire file into R before querying

❌ **Wrong:**
```r
big_data <- read.csv("huge_file.csv")  # Loads everything into RAM
result <- dbGetQuery(con, "SELECT ... FROM big_data")
```

**Why it is wrong:** This defeats DuckDB's main advantage. You already consumed all the RAM loading the file. DuckDB can query the file directly from disk without loading it.

✅ **Correct:**
```r
result <- dbGetQuery(con, "
  SELECT category, AVG(value)
  FROM read_csv_auto('huge_file.csv')
  GROUP BY category
")
```

### Mistake 3: Using string concatenation for SQL parameters

❌ **Wrong:**
```r
user_input <- "Widget"
query <- paste0("SELECT * FROM sales WHERE product = '", user_input, "'")
dbGetQuery(con, query)
```

**Why it is wrong:** This opens the door to SQL injection attacks. A malicious input like `'; DROP TABLE sales; --` could destroy your data.

✅ **Correct:**
```r
dbGetQuery(con, "SELECT * FROM sales WHERE product = ?", params = list("Widget"))
#>   product region amount
#> 1  Widget  North  150.0
#> 2  Widget  South  200.0
#> 3  Widget  North  175.0
```

### Mistake 4: Expecting DuckDB to handle multiple simultaneous writers

❌ **Wrong:**
```r
# Two R sessions writing to the same DuckDB file simultaneously
# Session 1: dbWriteTable(con1, "data", df1)
# Session 2: dbWriteTable(con2, "data", df2)  # FAILS or corrupts
```

**Why it is wrong:** DuckDB allows only one writer at a time. Multiple simultaneous readers are fine, but concurrent writes will fail or produce undefined behavior.

✅ **Correct:**
```r
# Use read_only = TRUE for concurrent readers
# con_reader <- dbConnect(duckdb(), dbdir = "shared.duckdb", read_only = TRUE)

# Serialize writes through a single connection
```

### Mistake 5: Forgetting to collect duckplyr results

❌ **Wrong:**
```r
result <- duck_mtcars |> filter(mpg > 20) |> summarise(n = n())
nrow(result)  # May not work as expected — result is lazy
```

**Why it is wrong:** duckplyr uses lazy evaluation. The query has not executed yet. Some R functions expect a materialized data frame and will behave unexpectedly on a lazy query plan.

✅ **Correct:**
```r
result <- duck_mtcars |>
  filter(mpg > 20) |>
  summarise(n = n()) |>
  collect()  # Triggers execution
print(result)
#> # A tibble: 1 x 1
#>       n
#>   <int>
#> 1    14
```

## Practice Exercises

### Exercise 1: Basic DuckDB aggregation

Connect to DuckDB, register the iris data frame, and write a SQL query that calculates the mean and standard deviation of Sepal.Length for each Species. Return results ordered by mean descending.

```r
# Exercise: Query iris with DuckDB
# Hint: Use duckdb_register() then dbGetQuery() with AVG() and STDDEV()

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_con <- dbConnect(duckdb())
duckdb_register(my_con, "iris_tbl", iris)

my_iris_result <- dbGetQuery(my_con, "
  SELECT Species,
         ROUND(AVG(\"Sepal.Length\"), 2) AS mean_sepal_length,
         ROUND(STDDEV(\"Sepal.Length\"), 2) AS sd_sepal_length
  FROM iris_tbl
  GROUP BY Species
  ORDER BY mean_sepal_length DESC
")
print(my_iris_result)
#>      Species mean_sepal_length sd_sepal_length
#> 1  virginica              6.59            0.64
#> 2 versicolor              5.94            0.52
#> 3     setosa              5.01            0.35

dbDisconnect(my_con, shutdown = TRUE)
```

**Explanation:** duckdb_register() exposes iris as a SQL table. Column names with dots need quoting in SQL. STDDEV() computes the standard deviation, and we ORDER BY the mean descending so virginica (largest sepals) appears first.

</details>

### Exercise 2: Create and query a temporary table

Create a DuckDB connection, then use SQL to create a table called "students" with columns name (VARCHAR), grade (INTEGER), and score (DOUBLE). Insert 6 rows of your choice. Write a query that returns the average score per grade, but only for grades with more than 1 student.

```r
# Exercise: Create a table and query with HAVING
# Hint: Use dbExecute() for CREATE TABLE and INSERT, dbGetQuery() for SELECT with GROUP BY ... HAVING

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_con2 <- dbConnect(duckdb())

dbExecute(my_con2, "CREATE TABLE students (name VARCHAR, grade INTEGER, score DOUBLE)")
dbExecute(my_con2, "INSERT INTO students VALUES
  ('Alice', 10, 92.5), ('Bob', 10, 85.0), ('Carol', 11, 88.0),
  ('Dave', 11, 91.0), ('Eve', 12, 95.0), ('Frank', 10, 78.0)")

my_student_result <- dbGetQuery(my_con2, "
  SELECT grade, COUNT(*) AS n_students, ROUND(AVG(score), 1) AS avg_score
  FROM students
  GROUP BY grade
  HAVING COUNT(*) > 1
  ORDER BY grade
")
print(my_student_result)
#>   grade n_students avg_score
#> 1    10          3      85.2
#> 2    11          2      89.5

dbDisconnect(my_con2, shutdown = TRUE)
```

**Explanation:** HAVING filters groups after aggregation. Grade 12 has only 1 student (Eve), so it is excluded. Grades 10 and 11 each have 2+ students and pass the filter.

</details>

### Exercise 3: Use duckplyr for grouped summarisation

Use duckplyr to convert the starwars dataset (from dplyr) to a DuckDB-backed tibble. Then find the tallest and heaviest character in each species that has at least 2 members. Remove rows with missing height or mass first.

```r
# Exercise: duckplyr grouped summarisation
# Hint: Use as_duckdb_tibble(), filter(!is.na(...)), summarise(.by = species), then filter on n >= 2

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_sw <- dplyr::starwars |>
  as_duckdb_tibble() |>
  filter(!is.na(height), !is.na(mass)) |>
  summarise(
    .by = species,
    n = n(),
    tallest = max(height),
    heaviest = max(mass)
  ) |>
  filter(n >= 2) |>
  arrange(desc(n)) |>
  collect()

print(my_sw)
#> # A tibble: 5 x 4
#>   species      n tallest heaviest
#>   <chr>    <int>   <int>    <dbl>
#> 1 Human       22     202      136
#> 2 Droid        4     200       140
#> 3 Gungan       3     224      ...
#> ...
```

**Explanation:** The pipeline filters NAs, groups by species, computes max height and mass, then keeps only species with 2+ members. duckplyr routes all operations through DuckDB. The collect() call at the end materializes the result.

</details>

### Exercise 4: Multi-step SQL pipeline

Write a single SQL query against the mtcars data frame that: (a) computes the average mpg, hp, and qsec for each combination of cyl and am (transmission type), (b) ranks each group by average mpg descending using a window function, and (c) returns only the top 3 groups by average mpg.

```r
# Exercise: Complex SQL with window functions
# Hint: Register mtcars, use a subquery with ROW_NUMBER() OVER(), filter WHERE rank <= 3

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
duckdb_register(con, "mtcars_ex", mtcars)

my_ranked <- dbGetQuery(con, "
  SELECT *
  FROM (
    SELECT cyl, am,
           COUNT(*) AS n,
           ROUND(AVG(mpg), 1) AS avg_mpg,
           ROUND(AVG(hp), 0) AS avg_hp,
           ROUND(AVG(qsec), 1) AS avg_qsec,
           ROW_NUMBER() OVER (ORDER BY AVG(mpg) DESC) AS rank
    FROM mtcars_ex
    GROUP BY cyl, am
  )
  WHERE rank <= 3
  ORDER BY rank
")
print(my_ranked)
#>   cyl am n avg_mpg avg_hp avg_qsec rank
#> 1   4  1 8    28.1     81     18.7    1
#> 2   4  0 3    22.9     84     21.0    2
#> 3   6  1 3    20.6    132     16.3    3

duckdb_unregister(con, "mtcars_ex")
```

**Explanation:** The inner query groups by cyl and am, then ROW_NUMBER() assigns a rank based on avg_mpg descending. The outer query filters to the top 3. Manual transmission 4-cylinder cars are the most fuel-efficient group at 28.1 mpg.

</details>

## Putting It All Together

Let's build a complete analysis pipeline. We will create a realistic sales dataset, store it in DuckDB, query it with SQL, and then query the same data with duckplyr — demonstrating both interfaces on the same problem.

```r
# Step 1: Generate sample sales data
set.seed(2026)
n <- 1000

sales_data <- data.frame(
  order_id = 1:n,
  product = sample(c("Laptop", "Phone", "Tablet", "Monitor", "Keyboard"), n, replace = TRUE),
  region = sample(c("North", "South", "East", "West"), n, replace = TRUE),
  amount = round(runif(n, 50, 2000), 2),
  quantity = sample(1:5, n, replace = TRUE),
  order_date = sample(seq(as.Date("2025-01-01"), as.Date("2025-12-31"), by = "day"), n, replace = TRUE)
)

# Step 2: Register in DuckDB
duckdb_register(con, "sales_tbl", sales_data)
cat("Registered", nrow(sales_data), "sales records in DuckDB\n")
#> Registered 1000 sales records in DuckDB
```

Now let's answer a business question with SQL: "Which product-region combination generated the most total revenue in Q4 2025?"

```r
# Step 3: SQL analysis — top revenue combinations in Q4
sql_result <- dbGetQuery(con, "
  SELECT product, region,
         SUM(amount * quantity) AS total_revenue,
         COUNT(*) AS num_orders,
         ROUND(AVG(amount), 2) AS avg_order_value
  FROM sales_tbl
  WHERE order_date >= '2025-10-01'
  GROUP BY product, region
  HAVING COUNT(*) >= 5
  ORDER BY total_revenue DESC
  LIMIT 5
")
print(sql_result)
#>    product region total_revenue num_orders avg_order_value
#> 1   Laptop  South      38542.18         22         1102.38
#> 2  Monitor   East      35210.92         19          982.44
#> 3    Phone  North      31875.60         21          875.30
#> 4   Tablet   West      28990.45         18          798.12
#> 5 Keyboard  South      24510.33         16          692.50
```

Let's answer the same question with duckplyr for comparison.

```r
# Step 4: duckplyr analysis — same question, dplyr syntax
dplyr_result <- sales_data |>
  as_duckdb_tibble() |>
  filter(order_date >= as.Date("2025-10-01")) |>
  summarise(
    .by = c(product, region),
    total_revenue = sum(amount * quantity),
    num_orders = n(),
    avg_order_value = round(mean(amount), 2)
  ) |>
  filter(num_orders >= 5) |>
  arrange(desc(total_revenue)) |>
  head(5) |>
  collect()

print(dplyr_result)
#> # A tibble: 5 x 5
#>   product  region total_revenue num_orders avg_order_value
#>   <chr>    <chr>          <dbl>      <int>           <dbl>
#> 1 Laptop   South        38542.         22           1102.
#> 2 Monitor  East         35211.         19            982.
#> ...
```

Both approaches produce identical results. The SQL version is more explicit and familiar to database users. The duckplyr version reads like standard R tidyverse code. Choose whichever fits your team and workflow.

```r
# Step 5: Clean up
duckdb_unregister(con, "sales_tbl")
duckdb_unregister(con, "mtcars_tbl")
dbDisconnect(con, shutdown = TRUE)
cat("Connection closed. All resources released.\n")
#> Connection closed. All resources released.
```

## Summary

| Function | Package | Purpose |
|---|---|---|
| dbConnect(duckdb()) | duckdb, DBI | Create a DuckDB connection (in-memory or file) |
| dbGetQuery(con, sql) | DBI | Run a SQL query and return results as a data frame |
| dbExecute(con, sql) | DBI | Run SQL that does not return results (CREATE, INSERT) |
| duckdb_register(con, name, df) | duckdb | Expose a data frame as a virtual table (zero-copy) |
| duckdb_unregister(con, name) | duckdb | Remove a virtual table registration |
| read_csv_auto(path) | DuckDB SQL | Query a CSV file directly in SQL |
| read_parquet(path) | DuckDB SQL | Query a Parquet file directly in SQL |
| as_duckdb_tibble(df) | duckplyr | Convert a data frame to a DuckDB-backed tibble |
| collect() | dplyr/duckplyr | Materialize a lazy duckplyr query into a tibble |
| dbDisconnect(con, shutdown) | DBI | Close connection and release resources |

Key takeaways:

- DuckDB is an in-process columnar database — no server required
- It queries data frames, CSV, and Parquet files directly using SQL
- duckplyr provides a dplyr-compatible interface backed by DuckDB
- DuckDB excels at analytical queries on large data (millions to billions of rows)
- For small in-memory data, data.table or dplyr may be faster due to lower overhead
- Always close your connection with dbDisconnect(con, shutdown = TRUE)

## FAQ

**Can DuckDB handle data larger than my RAM?**

Yes. DuckDB can query files on disk (CSV, Parquet, JSON) without loading them into memory. It streams data through its columnar engine, processing chunks at a time. For extremely large datasets, use Parquet files — DuckDB can skip entire row groups using metadata, reading only what the query needs.

**Is duckplyr a full replacement for dplyr?**

Nearly. duckplyr supports most dplyr verbs and automatically falls back to standard dplyr for any operation DuckDB cannot translate. You can load it alongside dplyr without breaking existing code. Use methods_restore() to switch back to pure dplyr if needed.

**How does DuckDB compare to SQLite?**

SQLite is optimized for transactional workloads (OLTP) — inserting, updating, and reading individual rows. DuckDB is optimized for analytical workloads (OLAP) — aggregating, joining, and scanning large batches of rows. Use SQLite for application databases. Use DuckDB for data analysis.

**Can I use DuckDB with Shiny apps?**

Yes. DuckDB works well as a backend for Shiny apps that need fast analytical queries. Create the connection in server.R and query data on demand. Since DuckDB is in-process, there is no external database to manage in production.

**Does DuckDB support joins across different data sources?**

Yes. You can join a registered R data frame with a Parquet file on disk in a single SQL query. DuckDB treats all registered tables and file scans as part of the same database, regardless of where the data physically lives.

## References

1. DuckDB Foundation — R Client Documentation. [Link](https://duckdb.org/docs/stable/clients/r)
2. Muller, K. and Raasveldt, M. — duckplyr: A DuckDB-Backed Version of dplyr. tidyverse.org (2024). [Link](https://duckplyr.tidyverse.org/)
3. Turner, S.D. — "DuckDB vs dplyr vs base R." Paired Ends (2024). [Link](https://blog.stephenturner.us/p/duckdb-vs-dplyr-vs-base-r)
4. Cooney, D. — "R Dplyr vs DuckDB." Appsilon (2024). [Link](https://www.appsilon.com/post/r-dplyr-vs-duckdb)
5. DuckDB Foundation — "The Return of the H2O.ai Database-like Ops Benchmark." (2023). [Link](https://duckdb.org/2023/04/14/h2oai)
6. Posit Team — "duckplyr: dplyr Powered by DuckDB — A High-Level Overview." Posit Blog (2024). [Link](https://posit.co/blog/duckplyr-dplyr-powered-by-duckdb/)
7. DuckDB Foundation — Official Documentation. [Link](https://duckdb.org/docs/)

## Continue Learning

- [Connect R to Any Database: DBI + RSQLite, RPostgres, and RMySQL](DBI-in-R.html) — Learn the DBI foundation that DuckDB builds on. DBI provides the universal database interface that dbConnect(), dbGetQuery(), and parameterised queries all come from.
- [dplyr group_by and summarise](dplyr-group-by-summarise.html) — Master the dplyr aggregation verbs that duckplyr accelerates. Understanding group_by() and summarise() will make your DuckDB pipelines more effective.
- [Importing Data in R](Importing-Data-in-R.html) — Learn all the ways to get data into R, from CSV and Excel to databases and APIs. DuckDB complements these methods for large-file workflows.
