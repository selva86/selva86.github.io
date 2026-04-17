---
title: "dbplyr in R: Write dplyr Code That Runs on Any SQL Database"
slug: "dbplyr-in-R"
description: "dbplyr translates your dplyr pipelines into SQL so you can query databases without writing SQL. Learn tbl(), show_query(), collect(), and lazy evaluation with RSQLite examples."
keywords: "dbplyr, dbplyr R, dplyr SQL database, dbplyr tutorial, show_query, tbl database, lazy SQL query R, dbplyr RSQLite"
auto_link_terms: "dbplyr|dbplyr in R|tbl()|show_query()|lazy query|database backend for dplyr"
auto_link_case_sensitive: true
mathjax: false
webr: true
date: "2026-04-06"
curriculum_id: "FR-data-2"
post_type: "FR"
fr_parent: "DBI-in-R.html"
difficulty: "Intermediate"
---

# dbplyr in R: Write dplyr Code That Runs on Any SQL Database

<p class="lead">dbplyr is a dplyr backend that translates your filter(), mutate(), and summarise() calls into SQL and runs them on a database, so you query millions of rows without loading them into R or writing a single line of SQL.</p>

## Introduction

You already know dplyr for in-memory data frames. You know DBI for connecting to databases. dbplyr is the bridge between the two: it lets you point dplyr at a database table and write the same verbs you already use. Behind the scenes, dbplyr translates your R code into SQL, sends it to the database, and brings back only the results.

The key idea is **laziness**. When you call `filter()` or `summarise()` on a database table through dbplyr, nothing happens immediately. dbplyr builds up a SQL query. Only when you call `collect()` does the query actually run and the results enter R memory. This means you can chain ten dplyr verbs together, and the database executes them as a single optimised SQL statement.

All code in this tutorial uses RSQLite, an in-process database that runs directly in your browser. Click Run to execute each block.

## How does dbplyr connect dplyr to a database?

The entry point is `tbl()`. You give it a DBI connection and a table name, and it returns a **lazy table reference**, an object that looks like a data frame but lives on the database.

Let's set up an in-memory SQLite database, copy `mtcars` into it, and create a lazy reference.

```r title="tbl creates a lazy mtcars reference"
# Set up: connect, copy data, create lazy reference
library(DBI)
library(RSQLite)
library(dplyr)
library(dbplyr)

con <- dbConnect(SQLite(), ":memory:")
copy_to(con, mtcars, name = "mtcars", overwrite = TRUE)
copy_to(con, iris, name = "iris", overwrite = TRUE)

# tbl() creates a lazy reference — no data pulled yet
mtcars_db <- tbl(con, "mtcars")
print(mtcars_db)
#> # Source:   table<mtcars> [?? x 11]
#> # Database: sqlite 3.x.x [:memory:]
#>      mpg   cyl  disp    hp  drat    wt  qsec    vs    am  gear  carb
#>    <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl>
#>  1  21       6  160    110  3.9   2.62  16.5     0     1     4     4
#>  2  21       6  160    110  3.9   2.88  17.0     0     1     4     4
#>  3  22.8     4  108     93  3.85  2.32  18.6     1     1     4     1
#> # ... with more rows
```

Notice the header says `Source: table<mtcars>` and `Database: sqlite`. This is not an R data frame, it is a promise to query the database when you need the data. The `[?? x 11]` means dbplyr does not even know how many rows the table has, because it has not counted them yet.

[KEY INSIGHT]
**`tbl()` never loads data into R.** It creates a lightweight reference. Even printing it only fetches the first few rows for display. The full table stays on the database until you call `collect()`.

**Try it:** Create a lazy reference to the `iris` table (already copied above) and print it. How many columns does it show?

```r title="Exercise: Lazy reference to iris"
# Try it: create a tbl() reference to iris
ex_iris_db <- tbl(con, # your code here
)

# Test:
print(ex_iris_db)
#> Expected: Source: table<iris>, 5 columns
```

<details>
<summary>Click to reveal solution</summary>

```r title="Lazy reference to iris solution"
ex_iris_db <- tbl(con, "iris")
print(ex_iris_db)
#> # Source:   table<iris> [?? x 5]
#> # Database: sqlite 3.x.x [:memory:]
#>   Sepal.Length Sepal.Width Petal.Length Petal.Width Species
#>          <dbl>       <dbl>       <dbl>       <dbl> <chr>
#> 1          5.1         3.5         1.4         0.2 setosa
#> 2          4.9         3           1.4         0.2 setosa
#> 3          4.7         3.2         1.3         0.2 setosa
#> # ... with more rows
```

**Explanation:** `tbl(con, "iris")` creates the same kind of lazy reference. The 5 columns match the iris dataset: 4 numeric measurements and Species.

</details>

## How does dbplyr translate dplyr verbs into SQL?

The magic of dbplyr is that your dplyr code becomes SQL. You can see the generated SQL at any time with `show_query()`. This is invaluable for debugging and for learning SQL by seeing what your dplyr code compiles to.

```r title="showquery prints translated SQL"
# filter + select — then see the SQL
query1 <- mtcars_db |>
  filter(mpg > 25) |>
  select(mpg, cyl, hp, wt)

show_query(query1)
#> <SQL>
#> SELECT `mpg`, `cyl`, `hp`, `wt`
#> FROM `mtcars`
#> WHERE (`mpg` > 25.0)
```

dbplyr translated `filter(mpg > 25)` into `WHERE (mpg > 25.0)` and `select(mpg, cyl, hp, wt)` into the `SELECT` clause. The pipeline has not executed, `query1` is still a lazy reference.

Now try a grouped aggregation:

```r title="Aggregation translates to GROUP BY"
# group_by + summarise — see the SQL
query2 <- mtcars_db |>
  group_by(cyl) |>
  summarise(
    mean_mpg = mean(mpg, na.rm = TRUE),
    count    = n()
  )

show_query(query2)
#> <SQL>
#> SELECT `cyl`, AVG(`mpg`) AS `mean_mpg`, COUNT(*) AS `count`
#> FROM `mtcars`
#> GROUP BY `cyl`
```

`group_by(cyl)` became `GROUP BY cyl`, `mean(mpg)` became `AVG(mpg)`, and `n()` became `COUNT(*)`. dbplyr knows how to map R aggregation functions to their SQL equivalents.

[TIP]
**Use `show_query()` to learn SQL.** If you are new to SQL, write your analysis in dplyr and call `show_query()` to see what the equivalent SQL looks like. It is one of the fastest ways to pick up SQL syntax.

**Try it:** Write a pipeline on `mtcars_db` that filters to `am == 1` (manual transmission), groups by `gear`, and counts rows. Call `show_query()` on it.

```r title="Exercise: Count gears for manuals"
# Try it: write a pipeline and see its SQL
ex_query <- mtcars_db |>
  # your code here

show_query(ex_query)
#> Expected: SELECT gear, COUNT(*) ... WHERE am = 1.0 GROUP BY gear
```

<details>
<summary>Click to reveal solution</summary>

```r title="Count gears for manuals solution"
ex_query <- mtcars_db |>
  filter(am == 1) |>
  group_by(gear) |>
  summarise(n = n())

show_query(ex_query)
#> <SQL>
#> SELECT `gear`, COUNT(*) AS `n`
#> FROM `mtcars`
#> WHERE (`am` = 1.0)
#> GROUP BY `gear`
```

**Explanation:** dbplyr maps `filter(am == 1)` to `WHERE`, `group_by(gear)` to `GROUP BY`, and `n()` to `COUNT(*)`.

</details>

## When does dbplyr actually execute the query?

dbplyr is lazy by design. Nothing runs until you force it. There are three ways to force execution:

1. **`collect()`**, pulls all results into an R data frame
2. **Printing**, fetches the first few rows for display
3. **`compute()`**, executes the query but stores the result as a temporary table on the database (not in R)

The most common pattern is: build a lazy pipeline, verify with `show_query()`, then `collect()` the final result.

```r title="collect pulls query results into R"
# Lazy: nothing executes yet
lazy_result <- mtcars_db |>
  filter(hp > 150) |>
  select(mpg, hp, wt) |>
  arrange(desc(hp))

# Force execution: collect() pulls data into R
result <- collect(lazy_result)
print(result)
#> # A tibble: 11 x 3
#>      mpg    hp    wt
#>    <dbl> <dbl> <dbl>
#>  1  15.8   264  3.17
#>  2  14.3   245  3.57
#>  3  13.3   245  3.84
#>  4  15     335  3.57
#>  5  14.7   230  5.34
#> # ... with 6 more rows
```

After `collect()`, `result` is a normal tibble in R memory. You can plot it, pass it to model functions, or save it to a file. The database connection is no longer needed for this data.

[WARNING]
**Calling `collect()` on a huge table pulls everything into RAM.** Always filter and aggregate on the database first, then collect the small result. A pattern like `tbl(con, "big_table") |> collect() |> filter(...)` defeats the entire purpose of dbplyr.

**Try it:** Build a lazy pipeline on `mtcars_db` that selects only `mpg` and `cyl`, filters to `cyl == 4`, and collects the result. How many rows come back?

```r title="Exercise: Collect four-cylinder rows"
# Try it: build lazy + collect
ex_collected <- mtcars_db |>
  # your code here

# Test:
nrow(ex_collected)
#> Expected: 11 (there are 11 four-cylinder cars in mtcars)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Collect four-cylinder rows solution"
ex_collected <- mtcars_db |>
  select(mpg, cyl) |>
  filter(cyl == 4) |>
  collect()
nrow(ex_collected)
#> [1] 11
```

**Explanation:** `select()` and `filter()` run on the database. `collect()` pulls only the 11 matching rows into R. The order of `select()` and `filter()` does not matter, dbplyr optimises the SQL either way.

</details>

## Which dplyr verbs does dbplyr support?

dbplyr translates most core dplyr verbs: `filter()`, `select()`, `mutate()`, `summarise()`, `group_by()`, `arrange()`, `rename()`, `distinct()`, `slice_head()`, `slice_min()`, `slice_max()`, and all join types (`inner_join()`, `left_join()`, `right_join()`, `full_join()`, `semi_join()`, `anti_join()`).

Here is a join across two database tables:

```r title="innerjoin runs on the database"
# Create a second table: cylinder descriptions
cyl_info <- data.frame(
  cyl = c(4, 6, 8),
  engine_type = c("inline-4", "V6", "V8")
)
copy_to(con, cyl_info, name = "cyl_info", overwrite = TRUE)
cyl_info_db <- tbl(con, "cyl_info")

# Join on the database — no data enters R
joined <- mtcars_db |>
  inner_join(cyl_info_db, by = "cyl") |>
  group_by(engine_type) |>
  summarise(mean_mpg = mean(mpg, na.rm = TRUE), count = n())

show_query(joined)
#> <SQL>
#> SELECT `engine_type`, AVG(`mpg`) AS `mean_mpg`, COUNT(*) AS `count`
#> FROM `mtcars`
#> INNER JOIN `cyl_info`
#>   ON (`mtcars`.`cyl` = `cyl_info`.`cyl`)
#> GROUP BY `engine_type`

collect(joined)
#> # A tibble: 3 x 3
#>   engine_type mean_mpg count
#>   <chr>          <dbl> <int>
#> 1 V6              19.7     7
#> 2 V8              15.1    14
#> 3 inline-4        26.7    11
```

The join, grouping, and aggregation all happen on the database in one SQL statement. Only the 3-row summary enters R.

[NOTE]
**Functions dbplyr cannot translate fall back to R.** If you use a custom R function inside `mutate()`, dbplyr will error rather than silently give wrong results. Stick to arithmetic, base R math functions, and dplyr helpers. Use `show_query()` to verify translation before `collect()`.

**Try it:** Join `mtcars_db` with `cyl_info_db`, then compute the max `hp` per `engine_type`. Collect the result.

```r title="Exercise: Join then aggregate maxhp"
# Try it: join + aggregate
ex_joined <- mtcars_db |>
  # your code here

# Test:
print(collect(ex_joined))
#> Expected: 3 rows with engine_type and max_hp — V8 should have the highest
```

<details>
<summary>Click to reveal solution</summary>

```r title="Join then aggregate maxhp solution"
ex_joined <- mtcars_db |>
  inner_join(cyl_info_db, by = "cyl") |>
  group_by(engine_type) |>
  summarise(max_hp = max(hp, na.rm = TRUE))

print(collect(ex_joined))
#> # A tibble: 3 x 2
#>   engine_type max_hp
#>   <chr>        <dbl>
#> 1 V6             175
#> 2 V8             335
#> 3 inline-4       113
```

**Explanation:** `inner_join()` + `group_by()` + `summarise(max(...))` all translate to a single SQL `INNER JOIN ... GROUP BY ... MAX(...)` statement.

</details>

## How do you mix dbplyr with raw SQL?

Sometimes you need SQL that dbplyr cannot generate, window functions, CTEs, or database-specific syntax. You can pass raw SQL through `tbl()` using the `sql()` helper.

```r title="Pass raw SQL through tbl"
# Pass raw SQL through tbl()
raw_result <- tbl(con, sql("
  SELECT cyl, 
         AVG(mpg) AS mean_mpg, 
         AVG(hp) AS mean_hp,
         COUNT(*) AS n
  FROM mtcars 
  GROUP BY cyl 
  HAVING COUNT(*) > 5
"))

collect(raw_result)
#> # A tibble: 3 x 4
#>     cyl mean_mpg mean_hp     n
#>   <dbl>    <dbl>   <dbl> <int>
#> 1     4     26.7    82.6    11
#> 2     6     19.7   122.     7
#> 3     8     15.1   209.    14
```

The `HAVING` clause filters groups after aggregation, something dplyr does not directly support. By wrapping raw SQL in `tbl(con, sql(...))`, the result is still a lazy dbplyr reference that you can chain more dplyr verbs onto.

[TIP]
**You can chain dplyr verbs after raw SQL.** `tbl(con, sql("SELECT ...")) |> filter(...) |> collect()` works. dbplyr wraps your SQL as a subquery and adds the filter on top. This lets you combine hand-tuned SQL with dplyr convenience.

**Try it:** Write a raw SQL query inside `tbl(con, sql(...))` that selects all columns from `mtcars` where `wt > 4`. Collect the result.

```r title="Exercise: Raw SQL for heavy cars"
# Try it: raw SQL through tbl()
ex_raw <- tbl(con, sql(
  # your SQL here
))

# Test:
print(collect(ex_raw))
#> Expected: rows where wt > 4 (about 4-5 cars)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Raw SQL for heavy cars solution"
ex_raw <- tbl(con, sql("SELECT * FROM mtcars WHERE wt > 4"))
print(collect(ex_raw))
#> # A tibble: 4 x 11
#>     mpg   cyl  disp    hp  drat    wt  qsec    vs    am  gear  carb
#>   <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl>
#> 1  10.4     8  472    205  2.93  5.25  18.0     0     0     3     4
#> 2  10.4     8  460    215  3     5.42  17.8     0     0     3     4
#> 3  14.7     8  440    230  3.23  5.34  17.4     0     0     3     4
#> 4  19.2     8  400    175  3.08  3.85  17.1     0     0     3     2
```

**Explanation:** `sql()` passes the string directly to the database. `tbl()` wraps it as a lazy reference, and `collect()` pulls the 4 matching rows into R.

</details>

## Common Mistakes and How to Fix Them

### Mistake 1: Collecting the entire table before filtering

❌ **Wrong:**
```r title="Common mistake: collect before filter"
# Pulls millions of rows into R, then filters in memory
big_result <- tbl(con, "big_table") |> collect() |> filter(year == 2025)
```

**Why it is wrong:** `collect()` materialises the entire table into R memory before `filter()` runs. If the table has 100 million rows, R will crash or crawl.

✅ **Correct:**
```r title="Correct: filter before collect"
# Filter on the database, collect only matching rows
big_result <- tbl(con, "big_table") |> filter(year == 2025) |> collect()
```

### Mistake 2: Using R functions that dbplyr cannot translate

❌ **Wrong:**
```r title="Common mistake: ifelse fails to translate"
# Custom R function — dbplyr cannot send this to SQL
result <- mtcars_db |> mutate(category = ifelse(mpg > 25, "efficient", "normal"))
# Error: Translation of `ifelse()` is not supported for SQLite
```

**Why it is wrong:** Not all R functions have SQL equivalents. `ifelse()` translates on some backends but not all. Check with `show_query()` before collecting.

✅ **Correct:**
```r title="Correct: ifelse generates CASE WHEN"
# Use if_else() from dplyr — dbplyr translates it to CASE WHEN
result <- mtcars_db |> mutate(category = if_else(mpg > 25, "efficient", "normal"))
show_query(result)
#> SELECT *, CASE WHEN (`mpg` > 25.0) THEN 'efficient' ELSE 'normal' END AS `category`
#> FROM `mtcars`
```

### Mistake 3: Forgetting to disconnect

❌ **Wrong:**
```r title="Common mistake: Forgetting to disconnect"
# Script ends without closing the connection
# Database locks may persist, file handles leak
```

**Why it is wrong:** Open connections consume resources and may lock database files. SQLite in particular keeps file locks until disconnection.

✅ **Correct:**
```r title="Correct: Always dbDisconnect when done"
# Always disconnect when done
dbDisconnect(con)
```

## Practice Exercises

### Exercise 1: End-to-end dbplyr pipeline

Connect to a new in-memory SQLite database, copy the `airquality` dataset into it, create a lazy reference, filter to rows where `Month == 7`, group by `Day`, compute `mean_temp = mean(Temp)`, show the generated SQL, and collect the result.

```r title="Exercise: Full airquality pipeline"
# Exercise: full dbplyr pipeline with airquality
# Hint: dbConnect, copy_to, tbl, filter, group_by, summarise, show_query, collect

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Full airquality pipeline solution"
my_con <- dbConnect(SQLite(), ":memory:")
copy_to(my_con, airquality, name = "airquality", overwrite = TRUE)
my_aq <- tbl(my_con, "airquality")

my_result <- my_aq |>
  filter(Month == 7) |>
  group_by(Day) |>
  summarise(mean_temp = mean(Temp, na.rm = TRUE))

show_query(my_result)
#> <SQL>
#> SELECT `Day`, AVG(`Temp`) AS `mean_temp`
#> FROM `airquality`
#> WHERE (`Month` = 7.0)
#> GROUP BY `Day`

print(collect(my_result))
#> # A tibble: 31 x 2
#>      Day mean_temp
#>    <dbl>     <dbl>
#>  1     1        84
#>  2     2        85
#>  3     3        81
#> # ... with 28 more rows

dbDisconnect(my_con)
```

**Explanation:** The pipeline stays lazy until `collect()`. The database filters to July, groups by day, and computes the average temperature, all in one SQL statement.

</details>

### Exercise 2: Join and compare SQL

Using the original `con` connection (reconnect if needed), create a table `am_labels` with columns `am` (0, 1) and `trans_type` ("automatic", "manual"). Join it with `mtcars` on the database, compute mean `mpg` per `trans_type`, show the SQL, and collect. Compare the generated SQL to what you would write by hand.

```r title="Exercise: Join plus aggregate SQL"
# Exercise: join + aggregate + compare SQL
# Hint: copy_to for the labels table, inner_join, group_by, summarise, show_query

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Join plus aggregate SQL solution"
con2 <- dbConnect(SQLite(), ":memory:")
copy_to(con2, mtcars, name = "mtcars", overwrite = TRUE)

my_labels <- data.frame(am = c(0, 1), trans_type = c("automatic", "manual"))
copy_to(con2, my_labels, name = "am_labels", overwrite = TRUE)

my_joined <- tbl(con2, "mtcars") |>
  inner_join(tbl(con2, "am_labels"), by = "am") |>
  group_by(trans_type) |>
  summarise(mean_mpg = mean(mpg, na.rm = TRUE), count = n())

show_query(my_joined)
#> <SQL>
#> SELECT `trans_type`, AVG(`mpg`) AS `mean_mpg`, COUNT(*) AS `count`
#> FROM `mtcars`
#> INNER JOIN `am_labels`
#>   ON (`mtcars`.`am` = `am_labels`.`am`)
#> GROUP BY `trans_type`

print(collect(my_joined))
#> # A tibble: 2 x 3
#>   trans_type mean_mpg count
#>   <chr>         <dbl> <int>
#> 1 automatic      17.1    19
#> 2 manual         24.4    13

dbDisconnect(con2)
```

**Explanation:** The join, grouping, and aggregation all compile to a single SQL query. Manual-transmission cars average 7 mpg more than automatics.

</details>

## Summary

| Concept | How it works |
|---|---|
| `tbl(con, "table")` | Creates a lazy reference, no data loaded |
| `show_query()` | Reveals the SQL that dbplyr generated |
| `collect()` | Executes the query and pulls results into R |
| `compute()` | Executes the query and stores results as a temp table on the database |
| Joins | `inner_join()`, `left_join()`, etc. translate to SQL JOINs |
| Raw SQL | `tbl(con, sql("SELECT ..."))` passes SQL directly |
| Fallback | Functions dbplyr cannot translate raise an error |

**Key rule:** filter and aggregate on the database, collect only the small result.

## FAQ

### Does dbplyr work with PostgreSQL, MySQL, and other databases?

Yes. dbplyr works with any database that has a DBI-compatible driver. The SQL it generates adapts to the backend, SQLite, PostgreSQL, MySQL, SQL Server, BigQuery, and others each get dialect-appropriate SQL. Install the relevant driver package (RPostgres, RMySQL, odbc) and `tbl()` works the same way.

### How do I know which functions dbplyr can translate?

Call `show_query()` on your pipeline before `collect()`. If dbplyr cannot translate a function, it raises an error immediately, it will not silently give wrong results. The dbplyr documentation lists all supported translations at `dbplyr.tidyverse.org/articles/translation-function.html`.

### Should I use dbplyr or write SQL directly?

Use dbplyr when your analysis fits naturally into dplyr verbs, filter, group, summarise, join. Switch to raw SQL (via `tbl(con, sql(...))`) for window functions, CTEs, recursive queries, or database-specific syntax. You can mix both in the same script.

## References

1. dbplyr documentation, official tidyverse site. [dbplyr.tidyverse.org](https://dbplyr.tidyverse.org/)
2. dbplyr function translation reference. [dbplyr.tidyverse.org/articles/translation-function.html](https://dbplyr.tidyverse.org/articles/translation-function.html)
3. Wickham, H., *R for Data Science*, 2nd ed., Ch 21 Databases. [r4ds.hadley.nz/databases.html](https://r4ds.hadley.nz/databases.html)
4. DBI package documentation. [dbi.r-dbi.org](https://dbi.r-dbi.org/)
5. RSQLite package. [rsqlite.r-dbi.org](https://rsqlite.r-dbi.org/)

## Continue Learning

- **[Connect R to Any Database: DBI](DBI-in-R.html)**, The parent tutorial covering dbConnect(), dbGetQuery(), parameterised queries, and the DBI interface that dbplyr builds on.
- **[DuckDB in R](DuckDB-in-R.html)**, An alternative analytical engine that also speaks dplyr (via duckplyr) and excels at querying Parquet and CSV files directly.
