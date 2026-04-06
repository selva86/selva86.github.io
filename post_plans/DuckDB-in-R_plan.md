# Post Plan: DuckDB in R

## A. Frontmatter

| Field | Value |
|---|---|
| title | DuckDB in R: Query 100 Million Rows on Your Laptop in Under 2 Seconds |
| slug | DuckDB-in-R |
| description | DuckDB is an in-process SQL OLAP database for R. Learn to query CSV, Parquet, and data frames with SQL or dplyr syntax — faster than data.table. |
| keywords | DuckDB in R, duckplyr tutorial, DuckDB R tutorial, query Parquet in R, DuckDB vs data.table, in-process database R, duckdb_register, dbGetQuery DuckDB, columnar database R, large data R |
| auto_link_terms | DuckDB in R\|duckplyr\|DuckDB\|duckdb package\|duckdb_register()\|in-process database\|columnar database in R |
| auto_link_case_sensitive | true |
| mathjax | false |
| webr | true |
| date | 2026-04-06 |
| curriculum_id | DB2 |
| post_type | C |
| sidebar_section | Data Wrangling |
| sidebar_title | DuckDB & duckplyr |
| sidebar_order | 14 |
| fr_parent | (none) |

## B. Breadcrumb

Home > Data Wrangling > Connecting R to Databases > DuckDB in R

## C. Full Section Outline

### Lead Sentence
DuckDB is an in-process columnar database engine that runs inside your R session — no server, no setup, no memory limits — letting you query millions of rows from CSV, Parquet, or data frames using SQL or dplyr syntax.

### Introduction (2-3 paragraphs)
- Hook: Your laptop can query 100 million rows in under 2 seconds — no Spark cluster, no cloud database, no special hardware. DuckDB makes this possible.
- What: DuckDB is an in-process OLAP database that embeds directly in R. It stores data in columns (not rows) which makes analytical queries blazing fast.
- Why it matters: For data analysts who hit memory walls with data.table or dplyr, DuckDB is the escape hatch. It queries files on disk without loading them into RAM.
- What you'll learn: Connect, query data frames, CSV, Parquet with both SQL and dplyr. Benchmarks vs alternatives.
- NOTE callout: duckdb requires C++ compilation and is NOT available in browser-based R environments. All code runs in local R/RStudio. Supplementary base-R/dplyr examples use interactive blocks.

### Core Content Sections (7 H2s)

#### H2: What Is DuckDB and Why Should R Users Care?
- Theory: In-process vs client-server databases. Columnar vs row storage. OLAP vs OLTP.
- Diagram: Figure 1 (architecture)
- Code block 1: Install and connect to DuckDB (in-memory)
- KEY INSIGHT callout: DuckDB runs inside your R process — no server to start

#### H2: How Do You Connect to DuckDB from R?
- dbConnect() with duckdb() driver
- In-memory vs file-based databases
- Code block 2: Create in-memory connection, create file-based connection
- Code block 3: Create table, insert data, query
- TIP callout: Use in-memory for speed, file-based for persistence

#### H2: How Do You Query R Data Frames with DuckDB?
- duckdb_register() to expose data frames as virtual tables
- Zero-copy querying
- Code block 4: Register mtcars, run SQL GROUP BY
- Code block 5: More complex aggregation on registered frame
- Diagram: Figure 2 (query pipeline)

#### H2: How Do You Query CSV and Parquet Files Directly?
- read_csv_auto() and read_parquet() in SQL
- No need to load into memory first
- Code block 6: Create a CSV, query it directly with DuckDB SQL
- Code block 7: Query with filters pushed down
- WARNING callout: File paths must be accessible from R's working directory

#### H2: How Does duckplyr Replace dplyr for Large Data?
- duckplyr as drop-in dplyr replacement
- Lazy evaluation, automatic fallback
- Code block 8: Install/load duckplyr, use dplyr verbs on large data
- Code block 9: as_duckdb_tibble() workflow
- Diagram: Figure 3 (two interfaces)
- TIP callout: duckplyr falls back to dplyr automatically for unsupported operations

#### H2: How Fast Is DuckDB Compared to dplyr and data.table?
- Benchmark results from published studies
- When DuckDB wins (disk-based, large aggregations, file queries)
- When data.table wins (in-memory, small data, complex row operations)
- Code block 10: Simple benchmark comparing approaches on mtcars (illustrative)
- Table: benchmark comparison summary
- KEY INSIGHT callout: DuckDB's advantage grows with data size

#### H2: When Should You Use DuckDB Instead of Other Tools?
- Decision framework: data size, query type, memory constraints
- DuckDB vs SQLite (OLAP vs OLTP)
- DuckDB vs data.table (disk vs memory)
- DuckDB vs Spark (single machine vs cluster)
- Table: decision matrix
- NOTE callout: DuckDB is single-machine — use Spark for true distributed workloads

### Common Mistakes Plan (5 mistakes)
1. Forgetting to disconnect (resource leak)
2. Using row-based thinking with DuckDB (not leveraging columnar scans)
3. Loading entire file into R then querying (defeats the purpose)
4. Not using parameterised queries (SQL injection risk)
5. Expecting DuckDB to handle concurrent writes (single writer only)

### Practice Exercises Plan (4 exercises)
1. Easy: Connect to DuckDB, register iris, find mean Sepal.Length by Species
2. Medium: Create a temporary table, insert data, query with GROUP BY and HAVING
3. Medium: Use duckplyr to filter and summarise starwars dataset
4. Challenging: Write a multi-step pipeline combining SQL and dplyr approaches

### Complete Example Plan
End-to-end: Create sample sales data -> write to DuckDB -> query with SQL -> query same data with duckplyr -> compare results

### Summary Plan
Table with key functions and when to use them: dbConnect, dbGetQuery, duckdb_register, duckplyr verbs, read_csv_auto, read_parquet

### FAQ Plan (5 questions)
1. Can DuckDB handle data larger than my RAM?
2. Is duckplyr a full replacement for dplyr?
3. How does DuckDB compare to SQLite?
4. Can I use DuckDB with Shiny apps?
5. Does DuckDB support joins across different data sources?

### References Plan (7 sources)
1. DuckDB official R client docs
2. duckplyr tidyverse.org
3. DuckDB duckplyr announcement blog post
4. Appsilon DuckDB vs dplyr benchmark
5. H2O.ai database-like ops benchmark
6. Posit blog: duckplyr overview
7. DuckDB official documentation

### What's Next Plan
1. DBI-in-R.html — Learn the foundation: DBI gives R a universal database interface
2. dplyr-group-by-summarise.html — Master dplyr aggregations that duckplyr accelerates
3. Importing-Data-in-R.html — Learn all the ways to get data into R

## D. Diagram List

| # | Filename | Figure N | Caption | Placed in H2 section |
|---|---|---|---|---|
| 1 | DuckDB-in-R-architecture.webp | Figure 1 | DuckDB runs inside your R process and queries data frames, CSV, and Parquet files directly. | What Is DuckDB and Why Should R Users Care? |
| 2 | DuckDB-in-R-query-pipeline.webp | Figure 2 | The DuckDB query pipeline: connect, register data, write SQL, and get results as an R data frame. | How Do You Query R Data Frames with DuckDB? |
| 3 | DuckDB-in-R-two-interfaces.webp | Figure 3 | Two ways to query DuckDB: SQL via dbGetQuery() or dplyr verbs via duckplyr. | How Does duckplyr Replace dplyr for Large Data? |

## E. Code Block Master List

| Block # | Demonstrates | Libs | Vars introduced | Vars used (from prior) |
|---|---|---|---|---|
| 1 | Install/connect DuckDB | `duckdb`, `DBI` | `con` | — |
| 2 | In-memory vs file connections | — | `con_mem`, `con_file` | — |
| 3 | Create table, insert, query | — | `result` | `con` |
| 4 | Register mtcars, SQL GROUP BY | — | `mtcars_summary` | `con` |
| 5 | Complex aggregation on registered frame | — | `agg_result` | `con` |
| 6 | Create CSV, query with read_csv_auto | `readr` | `csv_result` | `con` |
| 7 | Filtered query on CSV | — | `filtered` | `con` |
| 8 | duckplyr basic verbs | `duckplyr` | `flight_summary` | — |
| 9 | as_duckdb_tibble() workflow | — | `duck_mtcars`, `fast_summary` | — |
| 10 | Simple benchmark illustration | — | `t_base`, `t_dplyr`, `t_duck` | `con` |
| 11 | Complete example: sales pipeline | — | `sales`, `sql_result`, `dplyr_result` | `con` |
| Ex1-4 | Practice exercises | — | `my_*` variables | — |
