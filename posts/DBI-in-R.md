---
title: "Connect R to Any Database: DBI + RSQLite, RPostgres, and RMySQL"
slug: "DBI-in-R"
description: "DBI gives R a consistent interface to any SQL database. Learn dbConnect(), dbGetQuery(), dbWriteTable(), parameterised queries, and dplyr syntax via dbplyr."
keywords: "DBI in R, dbConnect R, R database connection, RSQLite tutorial, dbGetQuery R, dbWriteTable R, parameterised queries R, dbplyr tutorial, R SQL database, R PostgreSQL MySQL SQLite"
auto_link_terms: "DBI in R|DBI package|dbConnect()|dbGetQuery()|dbWriteTable()|RSQLite|database connection in R|R database interface"
auto_link_case_sensitive: true
mathjax: false
webr: true
date: "2026-04-06"
curriculum_id: "DB1"
post_type: "C"
sidebar_section: "Data Wrangling"
sidebar_title: "DBI & Databases"
sidebar_order: 13
---

<nav class="breadcrumb-nav">Home > Data Wrangling > Connecting R to Databases > Connect R to Any Database</nav>

# Connect R to Any Database: DBI + RSQLite, RPostgres, and RMySQL

<p class="lead">DBI is R's universal database interface — it lets you connect to SQLite, PostgreSQL, MySQL, and dozens of other databases using the same set of functions: dbConnect(), dbGetQuery(), dbWriteTable(), and dbDisconnect().</p>

## Introduction

Every real-world data project eventually outgrows CSV files. Databases store millions of rows that you can query selectively, without loading everything into memory at once. If you work with data in R, knowing how to talk to a database is a fundamental skill.

DBI (Database Interface) is the R package that provides a consistent API for talking to any SQL database. You write the same R code regardless of whether the database is SQLite, PostgreSQL, MySQL, or one of dozens of others. Driver packages like RSQLite, RPostgres, and RMySQL handle the database-specific details behind the scenes.

In this tutorial, you will learn how to connect to a database, run SQL queries, write R data frames to tables, prevent SQL injection with parameterised queries, and use familiar dplyr syntax on database tables via the dbplyr package. All interactive code blocks use RSQLite with in-memory databases, so you can run every example directly in your browser.

[NOTE]
**RPostgres and RMySQL require a local R installation.** The interactive code blocks in this tutorial use RSQLite, which runs entirely in the browser. To connect to PostgreSQL or MySQL, install those packages locally in RStudio and follow the connection patterns shown in prose.

![DBI sits between your R code and database-specific drivers](screenshots/DBI-in-R-architecture.webp)

*Figure 1: DBI sits between your R code and database-specific drivers.*

## How does DBI connect R to a database?

DBI is an abstraction layer. You call `dbConnect()` with a driver object, and DBI handles communication with the database. The driver translates your requests into the protocol that specific database understands.

Let's create an in-memory SQLite database. This is the simplest way to get started because SQLite requires no server, no username, and no password.

```r
# Load DBI and RSQLite
library(DBI)
library(RSQLite)

# Create an in-memory SQLite database
con <- dbConnect(RSQLite::SQLite(), ":memory:")
con
#> <SQLiteConnection>
#>   Path: :memory:
#>   Extensions: TRUE
```

The `con` object is your connection handle. Every DBI function takes this handle as its first argument. The string `":memory:"` tells SQLite to create a temporary database in RAM rather than on disk.

Let's verify the connection works by listing the tables. A fresh database has none.

```r
# List all tables in the database
dbListTables(con)
#> character(0)
```

The empty result confirms the connection is active and the database is empty. You will fill it with data in the next section.

[KEY INSIGHT]
**DBI separates the "what" from the "how".** Your R code calls the same functions — dbConnect(), dbGetQuery(), dbWriteTable() — regardless of the database. Only the driver argument changes. Learn the DBI API once, and you can work with any SQL database.

For PostgreSQL, the connection call looks like this (runs in local RStudio only):

```
# PostgreSQL (local R only — not interactive here)
# con <- dbConnect(RPostgres::Postgres(),
#   dbname = "mydb", host = "localhost",
#   user = "myuser", password = "mypass")
```

For MySQL, the pattern is identical:

```
# MySQL (local R only — not interactive here)
# con <- dbConnect(RMySQL::MySQL(),
#   dbname = "mydb", host = "localhost",
#   user = "myuser", password = "mypass")
```

## How do you query data with dbGetQuery()?

`dbGetQuery()` sends a SQL statement to the database and returns the result as an R data frame. It combines two steps — sending the query and fetching the result — into one convenient function.

First, let's load some data into our database so we have something to query. Then we will run a SELECT statement.

```r
# Write the mtcars dataset to the database as a table
dbWriteTable(con, "mtcars", mtcars)

# Query all rows where mpg > 30
dbGetQuery(con, "SELECT * FROM mtcars WHERE mpg > 30")
#>    mpg cyl disp  hp drat    wt  qsec vs am gear carb
#> 1 32.4   4 78.7  66 4.08 2.200 19.47  1  1    4    1
#> 2 30.4   4 75.7  52 4.93 1.615 18.52  1  1    4    2
#> 3 33.9   4 71.1  65 4.22 1.835 19.90  1  1    4    1
#> 4 30.4   4 95.1 113 3.77 1.513 16.90  1  1    5    2
```

The query returned only the 4 rows where `mpg` exceeds 30. The data stayed in the database until the query filtered it — R only received the matching rows.

Now let's write a more targeted query with ORDER BY to sort the results.

```r
# Get the top 5 most fuel-efficient cars
fast_cars <- dbGetQuery(con, "
  SELECT rownames AS car, mpg, hp, wt
  FROM mtcars
  ORDER BY mpg DESC
  LIMIT 5
")
fast_cars
#>              car  mpg  hp    wt
#> 1  Toyota Corolla 33.9  65 1.835
#> 2    Fiat 128     32.4  66 2.200
#> 3  Honda Civic    30.4  52 1.615
#> 4  Lotus Europa   30.4 113 1.513
#> 5 Fiat X1-9      27.3  66 1.935
```

Notice how the SQL does the sorting and limiting. Only 5 rows travel from the database to R. With large databases, this is far more efficient than loading everything and filtering in R.

[TIP]
**Use dbGetQuery() for SELECT statements that return data.** For INSERT, UPDATE, or DELETE statements that modify data but return no rows, use `dbExecute()` instead. It returns the number of affected rows.

![The core DBI workflow: connect, query or write, then disconnect](screenshots/DBI-in-R-query-workflow.webp)

*Figure 2: The core DBI workflow: connect, query or write, then disconnect.*

## How do you write data to a database with dbWriteTable()?

`dbWriteTable()` creates a new database table from an R data frame. It handles column types automatically, mapping R types to SQL types.

Let's write the `iris` dataset to our database and verify the result.

```r
# Write iris to the database
dbWriteTable(con, "iris", iris)

# Verify: list all tables
dbListTables(con)
#> [1] "iris"   "mtcars"

# Check column names in the iris table
dbListFields(con, "iris")
#> [1] "Sepal.Length" "Sepal.Width"  "Petal.Length" "Petal.Width"  "Species"
```

The database now has two tables: mtcars (from earlier) and iris. The column names match the R data frame exactly.

You can also append rows to an existing table. Let's add some extra observations to the iris table.

```r
# Create extra rows to append
extra_rows <- data.frame(
  Sepal.Length = c(5.0, 6.1),
  Sepal.Width = c(3.5, 2.8),
  Petal.Length = c(1.4, 4.7),
  Petal.Width = c(0.2, 1.2),
  Species = c("setosa", "versicolor")
)

# Append to existing table
dbWriteTable(con, "iris", extra_rows, append = TRUE)

# Verify: count total rows
dbGetQuery(con, "SELECT COUNT(*) AS n FROM iris")
#>     n
#> 1 152
```

The original iris dataset has 150 rows. After appending 2 more, the count is 152. The `append = TRUE` argument tells DBI to add rows rather than replace the table.

[WARNING]
**dbWriteTable() with overwrite=TRUE silently deletes the existing table.** If you accidentally set `overwrite = TRUE`, all existing data in that table is gone with no confirmation prompt. Always check with `dbExistsTable(con, "tablename")` before writing.

## Why should you use parameterised queries instead of paste()?

When you build SQL by pasting user input directly into a query string, you create a SQL injection vulnerability. An attacker (or a careless typo) can insert malicious SQL that drops tables or leaks data.

Here is a dangerous example. Imagine a Shiny app where users type a species name.

```r
# DANGEROUS: Never do this in production
user_input <- "setosa"
unsafe_query <- paste0("SELECT * FROM iris WHERE Species = '", user_input, "'")
unsafe_query
#> [1] "SELECT * FROM iris WHERE Species = 'setosa'"
```

This looks harmless with "setosa", but an attacker could type `setosa'; DROP TABLE iris; --` and destroy your data. The paste() approach blindly trusts the input.

The safe approach uses parameterised queries. DBI escapes the input for you.

```r
# SAFE: Use parameterised queries
safe_result <- dbGetQuery(con,
  "SELECT * FROM iris WHERE Species = ? LIMIT 3",
  params = list("setosa")
)
safe_result
#>   Sepal.Length Sepal.Width Petal.Length Petal.Width Species
#> 1         5.1         3.5         1.4         0.2  setosa
#> 2         4.9         3.0         1.4         0.2  setosa
#> 3         4.7         3.2         1.3         0.2  setosa
```

The `?` placeholder tells DBI "a value goes here." The `params` argument provides the actual value. DBI escapes special characters automatically, so SQL injection is impossible.

![Parameterised queries prevent SQL injection; paste() does not](screenshots/DBI-in-R-parameterised-vs-paste.webp)

*Figure 3: Parameterised queries prevent SQL injection; paste() does not.*

[WARNING]
**Never use paste() or sprintf() to build SQL with user input.** Always use the `params` argument in dbGetQuery() or dbExecute(). This is especially critical in Shiny apps and APIs where input comes from untrusted users.

## How do you use dplyr syntax on a database with dbplyr?

If you already know dplyr, you can query databases without writing SQL at all. The dbplyr package translates dplyr verbs — `filter()`, `select()`, `group_by()`, `summarise()` — into SQL behind the scenes.

First, create a reference to a database table using `tbl()`. This does not load any data into R.

```r
# Load dplyr and dbplyr
library(dplyr)
library(dbplyr)

# Create a lazy reference to the mtcars table
mtcars_db <- tbl(con, "mtcars")
mtcars_db
#> # Source:   table<mtcars> [?? x 11]
#> # Database: sqlite 3.46.1 [:memory:]
#>     mpg   cyl  disp    hp  drat    wt  qsec    vs    am  gear  carb
#>   <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl>
#> 1  21       6  160    110  3.9   2.62  16.5     0     1     4     4
#> 2  21       6  160    110  3.9   2.88  17.0     0     1     4     4
#> 3  22.8     4  108     93  3.85  2.32  18.6     1     1     4     1
#> # i 29 more rows
```

The `[?? x 11]` tells you dbplyr does not know the row count yet. It has not fetched the data. Now let's build a query using familiar dplyr verbs.

```r
# Build a query with dplyr verbs
summary_query <- mtcars_db |>
  filter(hp > 100) |>
  group_by(cyl) |>
  summarise(
    avg_mpg = mean(mpg, na.rm = TRUE),
    count = n()
  )

# See the generated SQL
show_query(summary_query)
#> <SQL>
#> SELECT `cyl`, AVG(`mpg`) AS `avg_mpg`, COUNT(*) AS `count`
#> FROM `mtcars`
#> WHERE (`hp` > 100.0)
#> GROUP BY `cyl`
```

Look at the output: dbplyr translated your dplyr pipeline into valid SQL. The data is still in the database. No rows have been transferred to R yet.

When you are ready for the results, call `collect()` to execute the query and bring the data into R.

```r
# Execute the query and bring results into R
local_result <- collect(summary_query)
local_result
#> # A tibble: 3 x 3
#>     cyl avg_mpg count
#>   <dbl>   <dbl> <int>
#> 1     4    26       2
#> 2     6    19.7     4
#> 3     8    15.1    14
```

Now you have a regular tibble in R. The database did the filtering, grouping, and averaging. R only received 3 rows.

[KEY INSIGHT]
**dbplyr keeps data in the database until you call collect().** This means you can chain filter(), mutate(), group_by(), and summarise() on a table with millions of rows. Only the final result travels to R, saving memory and time.

## How do you manage connections and clean up properly?

Every `dbConnect()` call opens a connection that consumes resources. Forgetting to close it can lock database files (SQLite) or exhaust connection pools (PostgreSQL, MySQL).

Always call `dbDisconnect()` when you are done. The best practice is to use `on.exit()` inside a function, which guarantees cleanup even if your code throws an error.

```r
# Best practice: wrap in a function with on.exit()
query_database <- function(sql) {
  con2 <- dbConnect(RSQLite::SQLite(), ":memory:")
  on.exit(dbDisconnect(con2))

  dbWriteTable(con2, "test", data.frame(x = 1:5, y = letters[1:5]))
  dbGetQuery(con2, sql)
}

# Connection opens, runs query, closes automatically
result <- query_database("SELECT * FROM test WHERE x > 3")
result
#>   x y
#> 1 4 d
#> 2 5 e
```

The `on.exit(dbDisconnect(con2))` line runs when the function exits — whether it returns normally or throws an error. This prevents connection leaks.

[TIP]
**Always place on.exit(dbDisconnect(con)) right after dbConnect().** This is the most reliable cleanup pattern. For scripts (not functions), wrap your database work in a tryCatch() block with a finally clause that disconnects.

Let's disconnect our main connection too. We are done with it.

```r
# Clean up the main connection
dbDisconnect(con)
```

## Common Mistakes and How to Fix Them

### Mistake 1: Forgetting to disconnect

Leaving connections open causes SQLite file locks and PostgreSQL "too many connections" errors.

❌ **Wrong:**
```r
con <- dbConnect(RSQLite::SQLite(), "mydata.db")
result <- dbGetQuery(con, "SELECT * FROM sales")
# ... script ends without dbDisconnect()
```

**Why it is wrong:** The connection stays open. If you run this script repeatedly, you accumulate stale connections. SQLite may refuse to let other processes access the file.

✅ **Correct:**
```r
con <- dbConnect(RSQLite::SQLite(), "mydata.db")
on.exit(dbDisconnect(con))
result <- dbGetQuery(con, "SELECT * FROM sales")
```

### Mistake 2: Pasting user input into SQL

This creates SQL injection vulnerabilities that can destroy data.

❌ **Wrong:**
```r
name <- "Robert'; DROP TABLE students;--"
dbGetQuery(con, paste0("SELECT * FROM students WHERE name = '", name, "'"))
```

**Why it is wrong:** The pasted string becomes valid SQL that drops your table.

✅ **Correct:**
```r
dbGetQuery(con, "SELECT * FROM students WHERE name = ?", params = list(name))
```

### Mistake 3: Using overwrite=TRUE without checking

Silent data loss when you overwrite a table you meant to append to.

❌ **Wrong:**
```r
dbWriteTable(con, "sales", new_data, overwrite = TRUE)
# All previous sales data is gone
```

**Why it is wrong:** The overwrite argument deletes the entire table before writing. If you intended to add rows, you just lost all historical data.

✅ **Correct:**
```r
dbWriteTable(con, "sales", new_data, append = TRUE)
```

### Mistake 4: Calling collect() too early on a large table

Loading millions of rows into R defeats the purpose of using a database.

❌ **Wrong:**
```r
# Downloads ALL rows before filtering
all_data <- collect(tbl(con, "big_table"))
result <- all_data |> filter(year == 2025)
```

**Why it is wrong:** `collect()` transfers every row to R. If the table has 50 million rows, R tries to allocate memory for all of them.

✅ **Correct:**
```r
# Filter in the database, collect only matching rows
result <- tbl(con, "big_table") |>
  filter(year == 2025) |>
  collect()
```

## Practice Exercises

### Exercise 1: Connect and query

Create an in-memory SQLite database, write the `airquality` dataset to it, and query all rows where Temp is greater than 90.

```r
# Exercise 1: Connect, write, and query
# Hint: use dbConnect(), dbWriteTable(), dbGetQuery()

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_con <- dbConnect(RSQLite::SQLite(), ":memory:")
dbWriteTable(my_con, "airquality", airquality)
my_hot_days <- dbGetQuery(my_con, "SELECT * FROM airquality WHERE Temp > 90")
my_hot_days
#>   Ozone Solar.R Wind Temp Month Day
#> 1    89     229 10.3   90     8   8
#> 2    97     267  6.3   92     7   8
#> 3   168     238  3.4   81     8  25
#> ...
dbDisconnect(my_con)
```

**Explanation:** `dbConnect()` opens the connection, `dbWriteTable()` loads the data, and `dbGetQuery()` filters server-side. Always disconnect when done.

</details>

### Exercise 2: Explore table structure

Using a connection to an in-memory database with `mtcars` loaded, find out how many tables exist and list the column names of each table.

```r
# Exercise 2: Explore tables and fields
# Hint: use dbListTables() and dbListFields()

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_con2 <- dbConnect(RSQLite::SQLite(), ":memory:")
dbWriteTable(my_con2, "mtcars", mtcars)
dbWriteTable(my_con2, "iris", iris)

my_tables <- dbListTables(my_con2)
my_tables
#> [1] "iris"   "mtcars"

for (tbl_name in my_tables) {
  cat(tbl_name, ":", paste(dbListFields(my_con2, tbl_name), collapse = ", "), "\n")
}
#> iris : Sepal.Length, Sepal.Width, Petal.Length, Petal.Width, Species
#> mtcars : mpg, cyl, disp, hp, drat, wt, qsec, vs, am, gear, carb
dbDisconnect(my_con2)
```

**Explanation:** `dbListTables()` returns all table names. `dbListFields()` returns column names for a specific table. Together they let you explore an unfamiliar database.

</details>

### Exercise 3: Round-trip write and read

Create a custom data frame with 3 columns (name, score, passed), write it to a database, read it back, and verify the result matches the original.

```r
# Exercise 3: Write and read back a data frame
# Hint: use dbWriteTable() then dbReadTable()

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_con3 <- dbConnect(RSQLite::SQLite(), ":memory:")
my_students <- data.frame(
  name = c("Alice", "Bob", "Carol"),
  score = c(92, 78, 88),
  passed = c(TRUE, TRUE, TRUE)
)
dbWriteTable(my_con3, "students", my_students)
my_readback <- dbReadTable(my_con3, "students")
my_readback
#>    name score passed
#> 1 Alice    92      1
#> 2   Bob    78      1
#> 3 Carol    88      1
identical(my_students$name, my_readback$name)
#> [1] TRUE
dbDisconnect(my_con3)
```

**Explanation:** `dbReadTable()` reads the full table back. Notice that SQLite stores TRUE/FALSE as 1/0 integers, so the `passed` column changes type on the round-trip.

</details>

### Exercise 4: Parameterised query

Using the airquality table, write a parameterised query that takes a month number as input and returns all rows for that month.

```r
# Exercise 4: Parameterised query by month
# Hint: use ? placeholder and params = list()

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_con4 <- dbConnect(RSQLite::SQLite(), ":memory:")
dbWriteTable(my_con4, "airquality", airquality)
my_month <- 7
my_july <- dbGetQuery(my_con4,
  "SELECT * FROM airquality WHERE Month = ?",
  params = list(my_month)
)
nrow(my_july)
#> [1] 31
head(my_july, 3)
#>   Ozone Solar.R Wind Temp Month Day
#> 1   135     269  4.1   84     7   1
#> 2    49     248  9.2   85     7   2
#> 3    32     236  9.2   81     7   3
dbDisconnect(my_con4)
```

**Explanation:** The `?` placeholder is replaced by the value in `params`. DBI escapes the input, preventing SQL injection even if `my_month` came from user input.

</details>

### Exercise 5: dbplyr grouped summary

Using dbplyr, compute the average Temp and total Ozone for each Month in the airquality table. Do not call `collect()` until the very end.

```r
# Exercise 5: dbplyr grouped summary
# Hint: use tbl(), group_by(), summarise(), then collect()

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_con5 <- dbConnect(RSQLite::SQLite(), ":memory:")
dbWriteTable(my_con5, "airquality", airquality)

my_summary <- tbl(my_con5, "airquality") |>
  group_by(Month) |>
  summarise(
    avg_temp = mean(Temp, na.rm = TRUE),
    total_ozone = sum(Ozone, na.rm = TRUE)
  ) |>
  collect()

my_summary
#> # A tibble: 5 x 3
#>   Month avg_temp total_ozone
#>   <int>    <dbl>       <int>
#> 1     5     65.5         614
#> 2     6     79.1         265
#> 3     7     83.9         1537
#> 4     8     84.0         1559
#> 5     9     76.9         912
dbDisconnect(my_con5)
```

**Explanation:** The `tbl()` reference and dplyr verbs stay lazy. Only `collect()` triggers the SQL execution. The database computed the averages and sums, and R received just 5 rows.

</details>

## Putting It All Together

Here is a complete end-to-end workflow. You will connect to a database, load data, run a parameterised query, build a dbplyr summary, and clean up.

```r
# === Complete DBI Example ===

# 1. Connect
con_demo <- dbConnect(RSQLite::SQLite(), ":memory:")

# 2. Load data
dbWriteTable(con_demo, "cars", mtcars)
dbWriteTable(con_demo, "flowers", iris)

cat("Tables:", paste(dbListTables(con_demo), collapse = ", "), "\n")
#> Tables: cars, flowers

# 3. Parameterised query
target_cyl <- 6
six_cyl <- dbGetQuery(con_demo,
  "SELECT rownames AS car, mpg, hp FROM cars WHERE cyl = ?",
  params = list(target_cyl)
)
cat("6-cylinder cars:", nrow(six_cyl), "\n")
#> 6-cylinder cars: 7

# 4. dbplyr summary
flower_summary <- tbl(con_demo, "flowers") |>
  group_by(Species) |>
  summarise(
    avg_petal_length = mean(Petal.Length, na.rm = TRUE),
    count = n()
  ) |>
  collect()

print(flower_summary)
#> # A tibble: 3 x 3
#>   Species    avg_petal_length count
#>   <chr>                 <dbl> <int>
#> 1 setosa                 1.46    50
#> 2 versicolor             4.26    50
#> 3 virginica              5.55    50

# 5. Clean up
dbDisconnect(con_demo)
cat("Connection closed.\n")
#> Connection closed.
```

This workflow shows the full DBI cycle: connect, write, query with parameters, analyze with dbplyr, and disconnect. Every function you need for daily database work in R is here.

## Summary

| Function | Purpose | Returns |
|---|---|---|
| `dbConnect()` | Open a database connection | Connection object |
| `dbDisconnect()` | Close a connection | TRUE (invisible) |
| `dbListTables()` | List all tables in the database | Character vector |
| `dbListFields()` | List column names of a table | Character vector |
| `dbGetQuery()` | Run a SELECT query | Data frame |
| `dbExecute()` | Run INSERT/UPDATE/DELETE | Rows affected (integer) |
| `dbWriteTable()` | Write a data frame to a table | TRUE (invisible) |
| `dbReadTable()` | Read an entire table | Data frame |
| `dbExistsTable()` | Check if a table exists | TRUE/FALSE |
| `tbl()` | Create a lazy dbplyr reference | tbl_dbi object |
| `collect()` | Execute dbplyr query, return tibble | Tibble |
| `show_query()` | Show the SQL dbplyr generates | SQL string |

Key takeaways:

- DBI provides one API for all SQL databases. Only the driver changes.
- Use `dbGetQuery()` for data retrieval and `dbExecute()` for data modification.
- Always use parameterised queries (`params = list(...)`) to prevent SQL injection.
- dbplyr lets you use dplyr syntax on database tables. Data stays in the database until `collect()`.
- Always disconnect with `dbDisconnect()`. Use `on.exit()` for automatic cleanup.

## FAQ

**What is the difference between dbGetQuery() and dbSendQuery()?**

`dbGetQuery()` sends a query and fetches all results in one step. `dbSendQuery()` only sends the query and returns a result set object. You then call `dbFetch()` to retrieve rows in chunks. Use `dbGetQuery()` for most tasks. Use `dbSendQuery()` + `dbFetch()` when results are too large to load at once.

**Can I use DBI with Microsoft SQL Server?**

Yes. Install the `odbc` package and use `dbConnect(odbc::odbc(), ...)` with an ODBC driver for SQL Server. The DBI functions work identically. You can also use the `RSQLServer` package for a native connection.

**Does dbplyr support all dplyr verbs?**

dbplyr supports most dplyr verbs including `filter()`, `select()`, `mutate()`, `group_by()`, `summarise()`, `arrange()`, `left_join()`, and `distinct()`. It focuses on SELECT statements. Verbs that modify data (like `rows_insert()`) have limited database support. Check `show_query()` to verify the SQL looks correct.

**How do I store database credentials safely?**

Never hard-code passwords in your scripts. Use environment variables: store credentials in an `.Renviron` file (`DB_PASSWORD=secret`) and access them with `Sys.getenv("DB_PASSWORD")`. For enterprise settings, use the `keyring` package or RStudio's connection pane, which stores credentials securely.

**What is the difference between RSQLite and DBI?**

DBI is the interface specification — it defines the functions. RSQLite is a driver that implements those functions for SQLite databases. You always load both: DBI provides `dbConnect()`, `dbGetQuery()`, etc., and RSQLite provides the `SQLite()` driver that knows how to talk to SQLite files. The same relationship applies to RPostgres (for PostgreSQL) and RMySQL (for MySQL).

## References

1. R Consortium — *DBI: R Database Interface*, official package documentation. [Link](https://dbi.r-dbi.org/)
2. RSQLite CRAN vignette — getting started with SQLite in R. [Link](https://cran.r-project.org/web/packages/RSQLite/vignettes/RSQLite.html)
3. CRAN — *Advanced DBI Usage*, parameterised queries and transactions. [Link](https://cran.r-project.org/web/packages/DBI/vignettes/DBI-advanced.html)
4. Wickham, H. & Grolemund, G. — *R for Data Science*, 2nd Ed. Chapter 22: Databases. [Link](https://r4ds.hadley.nz/databases.html)
5. dbplyr tidyverse documentation — Introduction to dbplyr. [Link](https://dbplyr.tidyverse.org/articles/dbplyr.html)
6. RPostgres — PostgreSQL driver for R. [Link](https://rpostgres.r-dbi.org/)
7. OWASP — SQL Injection Prevention Cheat Sheet. [Link](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)

## What's Next?

- **[R Joins](R-Joins.html)** — Learn how inner_join(), left_join(), and other join types work in dplyr to combine data from multiple tables.
- **[Importing Data in R](Importing-Data-in-R.html)** — Read CSV, Excel, JSON, and other file formats into R data frames.
- **[dplyr filter & select](dplyr-filter-select.html)** — Master the two most-used dplyr verbs for subsetting rows and columns.
