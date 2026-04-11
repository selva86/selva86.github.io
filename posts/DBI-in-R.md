---
title: "Connect R to Any Database: DBI + RSQLite, RPostgres, and RMySQL"
slug: "DBI-in-R"
description: "DBI gives R a consistent interface to any SQL database. Learn dbConnect(), dbGetQuery(), dbWriteTable(), parameterised queries, and dbplyr for SQL-free queries."
keywords: "DBI R, dbConnect, dbGetQuery, RSQLite, RPostgres, dbplyr, R database connection"
auto_link_terms: "DBI|dbConnect()|dbGetQuery()|dbplyr|R database connection"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-11"
curriculum_id: "DB1"
post_type: "C"
sidebar_section: "Data Wrangling"
sidebar_title: "DBI (Databases)"
sidebar_order: 13
---

# Connect R to Any Database: DBI + RSQLite, RPostgres, and RMySQL

<p class="lead">DBI is the standard R interface to relational databases. You write the same R code — <code>dbConnect()</code>, <code>dbGetQuery()</code>, <code>dbWriteTable()</code> — and swap the driver package to target SQLite, PostgreSQL, MySQL, SQL Server, or anything else that speaks SQL.</p>

## Why use DBI instead of loading CSVs?

CSVs work until they don't. Once your data is too big to load into RAM, changes frequently, or lives on a server shared with other users, a database is the right tool. DBI lets you query only what you need, when you need it — without ever materialising the full table in memory. The payoff: you can run arbitrary SQL and get a data frame back in one function call.

```r
library(DBI)
library(RSQLite)

# Create an in-memory SQLite database (no setup needed)
con <- dbConnect(SQLite(), ":memory:")

# Write a small table so we have something to query
dbWriteTable(con, "sales", data.frame(
  store = c("North","South","East","West"),
  revenue = c(12000, 8500, 15000, 9200),
  quarter = c("Q1","Q1","Q1","Q1")
))

# Run SQL and get a data frame
dbGetQuery(con, "SELECT store, revenue FROM sales WHERE revenue > 10000")
#>   store revenue
#> 1 North   12000
#> 2  East   15000

dbDisconnect(con)
```

Four functions and you have a working database workflow. The same code pattern works with a real PostgreSQL database — you only change the first line. That portability is the single biggest reason DBI exists.

![DBI architecture: R code talks to DBI which dispatches to drivers](screenshots/DBI-in-R-architecture.webp)
*Figure 1: DBI sits between your R code and the database-specific drivers. You write DBI calls; the driver package translates them to wire protocol.*

> **[KEY INSIGHT]** DBI is an interface, not a driver. You always need **both** DBI and a driver package like `RSQLite`, `RPostgres`, or `RMariaDB`. The driver is what knows how to speak your database's protocol.

**Try it:** Run this snippet in your console to create an in-memory SQLite database, write the `mtcars` dataset to it, and query for cars with `mpg > 25`.

```r
library(DBI); library(RSQLite)
con <- dbConnect(SQLite(), ":memory:")
dbWriteTable(con, "mtcars", mtcars)
# dbGetQuery(con, "SELECT * FROM mtcars WHERE mpg > 25")
```

<details>
<summary>Click to reveal solution</summary>

```r
library(DBI); library(RSQLite)
con <- dbConnect(SQLite(), ":memory:")
dbWriteTable(con, "mtcars", mtcars)

dbGetQuery(con, "SELECT * FROM mtcars WHERE mpg > 25")
#>                 mpg cyl  disp hp drat    wt  qsec vs am gear carb
#> Fiat 128       32.4   4  78.7 66 4.08 2.200 19.47  1  1    4    1
#> Honda Civic    30.4   4  75.7 52 4.93 1.615 18.52  1  1    4    2
#> Toyota Corolla 33.9   4  71.1 65 4.22 1.835 19.90  1  1    4    1
#> Fiat X1-9      27.3   4  79.0 66 4.08 1.935 18.90  1  1    4    1
#> Porsche 914-2  26.0   4 120.3 91 4.43 2.140 16.70  0  1    5    2
#> Lotus Europa   30.4   4  95.1113 3.77 1.513 16.90  1  1    5    2

dbDisconnect(con)
```

`dbGetQuery()` runs the SQL string and returns a data frame in one call. Always pair `dbConnect()` with `dbDisconnect()` to release the handle when you are done.

</details>

## How do you connect to SQLite, PostgreSQL, and MySQL with DBI?

The only thing that changes between databases is the driver package and the `dbConnect()` arguments. Everything after connection is identical.

```r
# SQLite: file on disk
library(DBI); library(RSQLite)
con_sqlite <- dbConnect(SQLite(), "my_database.sqlite")

# SQLite: in-memory (great for testing)
con_memory <- dbConnect(SQLite(), ":memory:")

# PostgreSQL
# library(RPostgres)
# con_pg <- dbConnect(
#   Postgres(),
#   dbname   = "mydb",
#   host     = "localhost",
#   port     = 5432,
#   user     = "myuser",
#   password = Sys.getenv("PG_PASSWORD")
# )

# MySQL / MariaDB
# library(RMariaDB)
# con_mysql <- dbConnect(
#   MariaDB(),
#   dbname   = "mydb",
#   host     = "localhost",
#   user     = "myuser",
#   password = Sys.getenv("MYSQL_PASSWORD")
# )
```

Three databases, three connection calls, one pattern. SQLite needs only a file path because everything lives in that one file. PostgreSQL and MySQL need credentials because they run as server processes.

> **[WARNING]** Never hard-code passwords in scripts. Use `Sys.getenv("PG_PASSWORD")` and set the environment variable in `.Renviron` or your shell profile. Committing a password to Git is one of the fastest ways to leak credentials.

Once connected, you can inspect what is in the database:

```r
con <- dbConnect(SQLite(), ":memory:")
dbWriteTable(con, "sales", data.frame(id = 1:3, amount = c(10, 20, 30)))
dbWriteTable(con, "users", data.frame(id = 1:3, name = c("Asha","Bilal","Cleo")))

dbListTables(con)
#> [1] "sales" "users"

dbListFields(con, "sales")
#> [1] "id"     "amount"
```

These two functions are your "ls" and "head" for a database connection. They work identically against every backend.

**Try it:** After connecting to a SQLite database, list all tables and the fields of the first table.

```r
library(DBI); library(RSQLite)
con <- dbConnect(SQLite(), ":memory:")
dbWriteTable(con, "t1", data.frame(a = 1:3, b = 4:6))
# dbListTables(con); dbListFields(con, "t1")
```

<details>
<summary>Click to reveal solution</summary>

```r
dbListTables(con)
#> [1] "t1"

dbListFields(con, "t1")
#> [1] "a" "b"
```

`dbListTables()` is the database equivalent of `ls()`, and `dbListFields()` returns the column names for a single table — both work identically across every DBI backend.

</details>

## How do you run queries and read results into R?

Three functions cover 95% of reading: `dbGetQuery()` for results into a data frame, `dbReadTable()` for a full table dump, and `dbSendQuery()` + `dbFetch()` for streaming large results in chunks.

```r
library(DBI); library(RSQLite)

con <- dbConnect(SQLite(), ":memory:")
dbWriteTable(con, "orders", data.frame(
  id = 1:6,
  customer = c("Asha","Bilal","Cleo","Asha","Bilal","Cleo"),
  amount = c(45, 120, 80, 60, 200, 95)
))

# Full table
dbReadTable(con, "orders")

# SQL query returning a data frame
dbGetQuery(con, "SELECT customer, SUM(amount) AS total FROM orders GROUP BY customer")
#>   customer total
#> 1     Asha   105
#> 2    Bilal   320
#> 3     Cleo   175
```

`dbGetQuery()` is the workhorse. Feed it a SQL string, get a data frame. `dbReadTable()` is slightly faster when you actually want the whole table and do not need to filter.

![Query workflow: send → execute → fetch → clear](screenshots/DBI-in-R-query-workflow.webp)
*Figure 2: Under the hood, every query goes through a send / fetch / clear cycle. dbGetQuery wraps all three into one call.*

For huge result sets, stream them with `dbSendQuery` + `dbFetch` in a loop so you never load the full result into memory:

```r
rs <- dbSendQuery(con, "SELECT * FROM orders")
while (!dbHasCompleted(rs)) {
  chunk <- dbFetch(rs, n = 1000)
  # process chunk here
}
dbClearResult(rs)
```

This pattern is essential for multi-gigabyte tables. You get 1,000 rows at a time, process them, and free the memory before the next batch. Always call `dbClearResult()` to close the statement handle — leaks here cause resource exhaustion on long jobs.

> **[TIP]** If your query has no result (INSERT, UPDATE, DELETE, CREATE), use `dbExecute()` instead of `dbGetQuery()`. It returns the number of affected rows and is the right function for side-effect SQL.

**Try it:** Run an aggregate query that counts orders per customer.

```r
library(DBI); library(RSQLite)
con <- dbConnect(SQLite(), ":memory:")
dbWriteTable(con, "orders", data.frame(customer = c("A","B","A","C","B","A"), amount = c(10,20,30,40,50,60)))
# dbGetQuery(con, "SELECT customer, COUNT(*) AS n FROM orders GROUP BY customer")
```

<details>
<summary>Click to reveal solution</summary>

```r
dbGetQuery(con, "SELECT customer, COUNT(*) AS n FROM orders GROUP BY customer")
#>   customer n
#> 1        A 3
#> 2        B 2
#> 3        C 1
```

`COUNT(*)` counts rows in each group defined by `GROUP BY`. The result comes back as a regular R data frame ready for further processing.

</details>

## How do you write data from R back into the database?

`dbWriteTable()` writes a data frame to a new table. `dbAppendTable()` adds rows to an existing one. `dbExecute()` runs arbitrary DDL like `CREATE TABLE` or `ALTER TABLE`.

```r
library(DBI); library(RSQLite)
con <- dbConnect(SQLite(), ":memory:")

# Create a new table from a data frame
dbWriteTable(con, "customers", data.frame(
  id = 1:3,
  name = c("Asha","Bilal","Cleo"),
  city = c("Pune","Berlin","Lima")
))

# Append more rows
dbAppendTable(con, "customers", data.frame(
  id = 4:5,
  name = c("Daan","Edu"),
  city = c("Amsterdam","Madrid")
))

dbReadTable(con, "customers")
#>   id  name      city
#> 1  1  Asha      Pune
#> 2  2 Bilal    Berlin
#> 3  3  Cleo      Lima
#> 4  4  Daan Amsterdam
#> 5  5   Edu    Madrid
```

`dbWriteTable(..., overwrite = TRUE)` replaces an existing table; `dbWriteTable(..., append = TRUE)` adds to it — equivalent to `dbAppendTable()`. The explicit append function is clearer.

For schema changes, drop down to raw SQL with `dbExecute()`:

```r
dbExecute(con, "CREATE INDEX idx_city ON customers(city)")
#> [1] 0
dbExecute(con, "ALTER TABLE customers ADD COLUMN signup_date TEXT")
#> [1] 0
```

The `[1] 0` is the affected-row count; DDL statements return 0 because no data rows are changed.

> **[NOTE]** `dbWriteTable()` does type inference from your R data frame — integers become INT, doubles become REAL, character becomes TEXT. For precise control, create the table yourself with `dbExecute(CREATE TABLE ...)` and then use `dbAppendTable()` to populate it.

**Try it:** Write a small data frame to SQLite, then append two more rows.

```r
library(DBI); library(RSQLite)
con <- dbConnect(SQLite(), ":memory:")
df <- data.frame(x = 1:3, y = letters[1:3])
# dbWriteTable(con, "t", df); dbAppendTable(con, "t", data.frame(x = 4:5, y = c("d","e")))
```

<details>
<summary>Click to reveal solution</summary>

```r
dbWriteTable(con, "t", df)
dbAppendTable(con, "t", data.frame(x = 4:5, y = c("d","e")))

dbReadTable(con, "t")
#>   x y
#> 1 1 a
#> 2 2 b
#> 3 3 c
#> 4 4 d
#> 5 5 e
```

`dbWriteTable()` creates the table from the first data frame; `dbAppendTable()` adds more rows to the existing table without changing its schema.

</details>

## How do you use parameterised queries to prevent SQL injection?

Never, ever, build SQL with `paste0()` or `sprintf()` from user input. If the input contains a quote or semicolon, your query breaks — or worse, does something you never intended. Parameterised queries separate the SQL template from the values, and the driver quotes the values correctly.

![Parameterised query vs paste: the safety difference](screenshots/DBI-in-R-parameterised-vs-paste.webp)
*Figure 3: Paste-based queries let user input become part of the SQL statement. Parameterised queries treat input as data. Always use the right side.*

```r
library(DBI); library(RSQLite)
con <- dbConnect(SQLite(), ":memory:")
dbWriteTable(con, "users", data.frame(name = c("Asha","Bilal","Cleo"), age = c(30, 25, 35)))

# UNSAFE — never do this
user_input <- "Asha"
query_bad <- paste0("SELECT * FROM users WHERE name = '", user_input, "'")

# SAFE — use ? placeholders with params
dbGetQuery(con, "SELECT * FROM users WHERE name = ?", params = list("Asha"))
#>   name age
#> 1 Asha  30

# SAFE with multiple parameters
dbGetQuery(
  con,
  "SELECT * FROM users WHERE name = ? AND age > ?",
  params = list("Asha", 25)
)
#>   name age
#> 1 Asha  30
```

`?` is the SQLite placeholder. PostgreSQL uses `$1`, `$2`; the driver handles the dialect automatically when you pass `params = list(...)`. Either way, the values are transported separately from the SQL text and cannot be misinterpreted as code.

The classic injection example:

```r
# Imagine a user submits: O'Neil
bad_name <- "O'Neil"

# Paste approach: breaks the query with an extra quote
# paste0("... WHERE name = '", bad_name, "'")

# Parameterised: just works
dbGetQuery(con, "SELECT * FROM users WHERE name = ?", params = list(bad_name))
#> [1] name age
#> <0 rows>
```

No match, no error, no injection. The quote inside the name is treated as part of the data.

> **[WARNING]** If you ever build SQL from a user-facing web form and use `paste0()` for the WHERE clause, you have an injection vulnerability. Parameterised queries are the only correct fix.

**Try it:** Use a parameterised query to find users older than a given age.

```r
library(DBI); library(RSQLite)
con <- dbConnect(SQLite(), ":memory:")
dbWriteTable(con, "users", data.frame(name = c("A","B","C"), age = c(20, 30, 40)))
# dbGetQuery(con, "SELECT * FROM users WHERE age > ?", params = list(25))
```

<details>
<summary>Click to reveal solution</summary>

```r
dbGetQuery(con, "SELECT * FROM users WHERE age > ?", params = list(25))
#>   name age
#> 1    B  30
#> 2    C  40
```

The `?` placeholder is filled in by the value in `params`. Because the value travels separately from the SQL text, the driver quotes it correctly and SQL injection is impossible.

</details>

## How does dbplyr let you use dplyr syntax on SQL tables?

`dbplyr` translates dplyr verbs into SQL and sends them to the database. You write familiar R code; the database runs the actual computation. This is the best of both worlds — dplyr's ergonomics plus the database's query planner.

```r
library(DBI); library(RSQLite); library(dplyr); library(dbplyr)

con <- dbConnect(SQLite(), ":memory:")
dbWriteTable(con, "flights_mini", data.frame(
  origin = c("LAX","JFK","LAX","JFK","SFO","LAX"),
  dest   = c("JFK","LAX","ORD","SFO","JFK","ATL"),
  delay  = c(15, 0, 30, 5, 45, 10)
))

# Get a lazy reference to the table
flights <- tbl(con, "flights_mini")

# Write dplyr — no SQL
result <- flights |>
  filter(origin == "LAX") |>
  group_by(dest) |>
  summarise(avg_delay = mean(delay, na.rm = TRUE)) |>
  arrange(desc(avg_delay))

# Inspect the generated SQL
result |> show_query()
#> <SQL>
#> SELECT dest, AVG(delay) AS avg_delay
#> FROM flights_mini
#> WHERE origin = 'LAX'
#> GROUP BY dest
#> ORDER BY avg_delay DESC

# Actually execute and bring results into R
result |> collect()
```

Two key ideas. First, `tbl(con, "name")` returns a **lazy** reference. No data is fetched until you call `collect()`. Second, `show_query()` lets you see exactly what SQL dbplyr generated — useful for debugging and for learning SQL itself.

Lazy evaluation means you can chain a dozen dplyr steps and the database optimizes the whole thing as a single query. You never pull the raw table into R until the final summary, which is often small.

> **[TIP]** Use `collect()` only at the **end** of your pipeline, after filtering and aggregation have shrunk the data. Calling `collect()` early defeats the whole purpose — you load the entire table into RAM.

**Try it:** Use dbplyr to compute the average `delay` per origin airport, then collect the result.

```r
library(DBI); library(RSQLite); library(dplyr); library(dbplyr)
con <- dbConnect(SQLite(), ":memory:")
dbWriteTable(con, "f", data.frame(origin = c("A","B","A","B"), delay = c(5, 10, 15, 20)))
# tbl(con, "f") |> group_by(origin) |> summarise(avg = mean(delay)) |> collect()
```

<details>
<summary>Click to reveal solution</summary>

```r
tbl(con, "f") |>
  group_by(origin) |>
  summarise(avg = mean(delay, na.rm = TRUE)) |>
  collect()
#> # A tibble: 2 x 2
#>   origin   avg
#>   <chr>  <dbl>
#> 1 A         10
#> 2 B         15
```

`tbl()` returns a lazy reference; the dplyr verbs translate to SQL and only execute when `collect()` pulls the result back into R as a tibble.

</details>

## How do you manage connections and transactions safely?

Connections are a finite resource. Forgetting to close one slowly leaks memory and eventually breaks the database server. The defensive pattern is `on.exit(dbDisconnect(con))` immediately after opening.

```r
safe_query <- function(sql) {
  con <- dbConnect(SQLite(), ":memory:")
  on.exit(dbDisconnect(con))

  dbWriteTable(con, "t", data.frame(x = 1:5))
  dbGetQuery(con, sql)
}

safe_query("SELECT AVG(x) FROM t")
#>   AVG(x)
#> 1      3
```

Even if `dbGetQuery()` throws an error, `on.exit()` ensures the connection is closed. This is the R equivalent of Python's `with` / try-finally.

For multi-statement operations, use a transaction so partial failures do not leave the database in a half-updated state:

```r
con <- dbConnect(SQLite(), ":memory:")
dbWriteTable(con, "accounts", data.frame(id = 1:2, balance = c(100, 50)))

dbWithTransaction(con, {
  dbExecute(con, "UPDATE accounts SET balance = balance - 25 WHERE id = 1")
  dbExecute(con, "UPDATE accounts SET balance = balance + 25 WHERE id = 2")
})

dbReadTable(con, "accounts")
#>   id balance
#> 1  1      75
#> 2  2      75

dbDisconnect(con)
```

`dbWithTransaction()` runs the block inside `BEGIN` / `COMMIT`. If any statement throws, everything is rolled back automatically. This is exactly what you want for "debit this account, credit that one" — either both happen, or neither does.

> **[NOTE]** SQLite supports transactions too, even for an in-memory database. The API is the same everywhere — another reason DBI makes switching backends painless.

**Try it:** Wrap two inserts in a transaction so that either both succeed or neither does.

```r
library(DBI); library(RSQLite)
con <- dbConnect(SQLite(), ":memory:")
dbExecute(con, "CREATE TABLE log (msg TEXT)")
# dbWithTransaction(con, { dbExecute(con, "INSERT INTO log VALUES ('a')"); dbExecute(con, "INSERT INTO log VALUES ('b')") })
```

<details>
<summary>Click to reveal solution</summary>

```r
dbWithTransaction(con, {
  dbExecute(con, "INSERT INTO log VALUES ('a')")
  dbExecute(con, "INSERT INTO log VALUES ('b')")
})

dbReadTable(con, "log")
#>   msg
#> 1   a
#> 2   b
```

`dbWithTransaction()` wraps the block in `BEGIN`/`COMMIT`. If either insert throws an error, both are rolled back, leaving the table in its original state.

</details>

## Practice Exercises

### Exercise 1: Filter and aggregate

Using an in-memory SQLite database with the `mtcars` dataset, return the average mpg per number of cylinders.

<details><summary>Solution</summary>

```r
library(DBI); library(RSQLite)
con <- dbConnect(SQLite(), ":memory:")
dbWriteTable(con, "mt", mtcars)
dbGetQuery(con, "SELECT cyl, AVG(mpg) AS avg_mpg FROM mt GROUP BY cyl")
dbDisconnect(con)
```

</details>

### Exercise 2: Parameterised search

Write a function that takes a minimum mpg and returns matching cars safely.

<details><summary>Solution</summary>

```r
library(DBI); library(RSQLite)
find_cars <- function(min_mpg) {
  con <- dbConnect(SQLite(), ":memory:")
  on.exit(dbDisconnect(con))
  dbWriteTable(con, "mt", mtcars)
  dbGetQuery(con, "SELECT * FROM mt WHERE mpg >= ?", params = list(min_mpg))
}
find_cars(25)
```

</details>

### Exercise 3: dbplyr pipeline

Translate this SQL to dbplyr: `SELECT cyl, MAX(hp) FROM mtcars WHERE am = 1 GROUP BY cyl`.

<details><summary>Solution</summary>

```r
library(DBI); library(RSQLite); library(dplyr); library(dbplyr)
con <- dbConnect(SQLite(), ":memory:")
dbWriteTable(con, "mt", mtcars)

tbl(con, "mt") |>
  filter(am == 1) |>
  group_by(cyl) |>
  summarise(max_hp = max(hp, na.rm = TRUE)) |>
  collect()
```

</details>

## Complete Example

An end-to-end workflow: create a database, load data, query with dbplyr, write the summary back.

```r
library(DBI); library(RSQLite); library(dplyr); library(dbplyr); library(tibble)

# Step 1: connect to SQLite
con <- dbConnect(SQLite(), ":memory:")
on.exit(dbDisconnect(con))

# Step 2: load sample data
sales <- tibble(
  order_id = 1:10,
  customer = c("Asha","Bilal","Cleo","Asha","Bilal","Cleo","Asha","Daan","Edu","Bilal"),
  region   = c("W","E","W","W","E","N","W","N","S","E"),
  amount   = c(120, 85, 200, 60, 175, 95, 40, 300, 50, 220),
  order_date = as.character(seq.Date(as.Date("2026-01-01"), by = "day", length.out = 10))
)
dbWriteTable(con, "sales", sales)

# Step 3: query with dbplyr
top_customers <- tbl(con, "sales") |>
  group_by(customer) |>
  summarise(
    n_orders = n(),
    revenue  = sum(amount, na.rm = TRUE)
  ) |>
  arrange(desc(revenue)) |>
  collect()

top_customers
#> # A tibble: 5 x 3
#>   customer n_orders revenue
#>   <chr>       <int>   <dbl>
#> 1 Bilal           3     480
#> 2 Daan            1     300
#> 3 Cleo            2     295
#> 4 Asha            3     220
#> 5 Edu             1      50

# Step 4: write the summary back as a new table
dbWriteTable(con, "top_customers", top_customers, overwrite = TRUE)

dbListTables(con)
#> [1] "sales"        "top_customers"
```

Five DBI calls (`dbConnect`, `dbWriteTable` twice, `dbListTables`, and the implicit `dbSendQuery` behind `collect()`), plus a dplyr pipeline — zero raw SQL. The whole workflow is portable: point the driver at PostgreSQL and it runs unchanged.

## Summary

| Task | Function |
|---|---|
| Open connection | `dbConnect(driver, ...)` |
| Close connection | `dbDisconnect(con)` |
| List tables | `dbListTables(con)` |
| List columns | `dbListFields(con, "name")` |
| Run SELECT | `dbGetQuery(con, sql)` |
| Run INSERT/UPDATE/DDL | `dbExecute(con, sql)` |
| Read whole table | `dbReadTable(con, "name")` |
| Write new table | `dbWriteTable(con, "name", df)` |
| Append rows | `dbAppendTable(con, "name", df)` |
| Parameterised query | `dbGetQuery(con, sql, params = list(...))` |
| Transaction | `dbWithTransaction(con, { ... })` |
| dplyr reference | `tbl(con, "name")` |
| Fetch from lazy | `collect()` |
| Inspect generated SQL | `show_query()` |

Four rules:

1. **DBI + a driver.** Always install both (`RSQLite`, `RPostgres`, `RMariaDB`).
2. **Always parameterise.** Never paste user input into SQL strings.
3. **Always disconnect.** Use `on.exit(dbDisconnect(con))` in every function.
4. **dbplyr is the easy mode.** Write dplyr, let it generate the SQL.

## References

- [DBI package reference](https://dbi.r-dbi.org/)
- [RSQLite reference](https://rsqlite.r-dbi.org/)
- [RPostgres reference](https://rpostgres.r-dbi.org/)
- [dbplyr package site](https://dbplyr.tidyverse.org/)
- [R for Data Science, 2e — Databases chapter](https://r4ds.hadley.nz/databases.html)

## Continue Learning

- [dplyr filter() and select()](dplyr-filter-select.html) — the local dplyr knowledge you already have translates to dbplyr.
- [dplyr group_by() and summarise()](dplyr-group-by-summarise.html) — both verbs work unchanged on database tables.
- [Importing Data in R](Importing-Data-in-R.html) — when the source is a flat file, not a database.
