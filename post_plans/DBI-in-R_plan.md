# Plan: DBI in R

## A. Frontmatter

```yaml
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
```

## B. Breadcrumb

Home > Data Wrangling > Connecting R to Databases > Connect R to Any Database: DBI + RSQLite, RPostgres, and RMySQL

## C. Full Section Outline

### Lead sentence
DBI is R's universal database interface — it lets you connect to SQLite, PostgreSQL, MySQL, and dozens of other databases using the same set of functions: dbConnect(), dbGetQuery(), dbWriteTable(), and dbDisconnect().

### Introduction
- Hook: Every real-world data project eventually outgrows CSV files. Databases store millions of rows that you can query without loading everything into memory.
- What: DBI (Database Interface) is the R package that provides a consistent API for talking to any SQL database. Driver packages (RSQLite, RPostgres, RMySQL) handle the database-specific details.
- Why it matters: One set of functions works across all databases — learn it once, use it everywhere.
- What you'll learn: connecting, querying, writing tables, parameterised queries for safety, and dplyr-style syntax via dbplyr.
- Inline note: All interactive code uses RSQLite (in-memory databases). PostgreSQL and MySQL examples are shown in prose with a [NOTE] callout.
- Place Figure 1 (architecture diagram) here.

### Core Sections (6 H2s)

#### H2: How does DBI connect R to a database?
- Theory: DBI is an abstraction layer. You call dbConnect() with a driver object. The driver handles the protocol.
- Code block 1: library(DBI) + library(RSQLite) + create in-memory SQLite connection
- Code block 2: Show dbListTables() on empty database
- Callout [KEY INSIGHT]: DBI separates the "what" from the "how" — your code stays the same even if you switch databases.
- Place Figure 1 (DBI architecture) reference.
- Mention RPostgres and RMySQL connection syntax in prose with [NOTE] callout about needing local R installation.

#### H2: How do you query data with dbGetQuery()?
- Theory: dbGetQuery() sends SQL to the database and returns a data frame. One function, two steps (send + fetch) combined.
- Code block 3: Create a sample table with dbWriteTable(mtcars), then dbGetQuery() with SELECT
- Code block 4: More complex query with WHERE and ORDER BY
- Callout [TIP]: Use dbGetQuery() for SELECT statements that return data. Use dbExecute() for INSERT/UPDATE/DELETE that modify data.
- Place Figure 2 (query workflow) here.

#### H2: How do you write data to a database with dbWriteTable()?
- Theory: dbWriteTable() creates a new table from an R data frame. Options: overwrite, append.
- Code block 5: Write iris to the database, verify with dbListTables() and dbListFields()
- Code block 6: Append rows to existing table, read back with dbGetQuery()
- Callout [WARNING]: dbWriteTable() with overwrite=TRUE silently deletes the existing table. Always check first with dbExistsTable().

#### H2: Why should you use parameterised queries instead of paste()?
- Theory: String-pasting user input into SQL creates SQL injection vulnerabilities. Parameterised queries escape input safely.
- Code block 7: Dangerous paste() example (show the vulnerability)
- Code block 8: Safe parameterised query with params argument
- Place Figure 3 (safe vs unsafe) here.
- Callout [WARNING]: Never use paste() or sprintf() to build SQL with user input. Use params= in dbGetQuery() instead.

#### H2: How do you use dplyr syntax on a database with dbplyr?
- Theory: dbplyr translates dplyr verbs into SQL behind the scenes. You work with tbl() references, and data stays in the database until you call collect().
- Code block 9: library(dplyr) + library(dbplyr) + tbl() reference to mtcars table
- Code block 10: filter(), select(), group_by(), summarise() on the database table + show_query()
- Code block 11: collect() to bring results into R
- Callout [KEY INSIGHT]: dbplyr keeps data in the database until collect(). This means you can filter millions of rows without loading them all into R.

#### H2: How do you manage connections and clean up properly?
- Theory: Always disconnect when done. Leaving connections open wastes resources and can lock databases.
- Code block 12: dbDisconnect() + pattern with on.exit() for safety
- Callout [TIP]: Wrap database work in a function and use on.exit(dbDisconnect(con)) on the first line. This guarantees cleanup even if your code errors.

### Common Mistakes (3-5)
1. Forgetting dbDisconnect() — leaks connections, eventually crashes
2. Using paste() for SQL with user input — SQL injection
3. Using dbWriteTable() without checking if table exists — silent overwrite
4. Calling collect() too early on large tables — loads millions of rows into RAM
5. Forgetting that dbGetQuery() returns a data frame, not a tibble

### Practice Exercises (5)
1. Easy: Connect to SQLite, write mtcars, query cars with mpg > 25
2. Easy: Use dbListTables() and dbListFields() to explore
3. Medium: Write and read back a custom data frame, verify round-trip
4. Medium: Use parameterised query to filter by a variable
5. Challenging: Use dbplyr to compute grouped summaries without collect(), then collect

### Complete Example
End-to-end workflow: connect, write data, query with params, use dbplyr for grouped summary, disconnect.

### Summary
Table of key DBI functions with descriptions.

### FAQ (5)
1. What is the difference between dbGetQuery() and dbSendQuery()?
2. Can I use DBI with Microsoft SQL Server?
3. Does dbplyr support all dplyr verbs?
4. How do I store database credentials safely?
5. What is the difference between RSQLite and DBI?

### References (7)
1. DBI official documentation — https://dbi.r-dbi.org/
2. RSQLite CRAN vignette — https://cran.r-project.org/web/packages/RSQLite/vignettes/RSQLite.html
3. CRAN DBI Advanced Usage — https://cran.r-project.org/web/packages/DBI/vignettes/DBI-advanced.html
4. dbplyr introduction — https://dbplyr.tidyverse.org/articles/dbplyr.html
5. Wickham, H. — R for Data Science, 2nd Ed. Ch. 22: Databases — https://r4ds.hadley.nz/databases.html
6. RPostgres documentation — https://rpostgres.r-dbi.org/
7. OWASP SQL Injection Prevention — https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html

### What's Next
1. R Joins — how joins work in dplyr (r-statistics.co/R-Joins.html)
2. Importing Data in R — read CSV, Excel, and more (r-statistics.co/Importing-Data-in-R.html)
3. dplyr filter & select — core data wrangling verbs (r-statistics.co/dplyr-filter-select.html)

## D. Diagram List

| # | Filename | Figure N | Caption | Placed in H2 section |
|---|---|---|---|---|
| 1 | DBI-in-R-architecture.webp | Figure 1 | DBI sits between your R code and database-specific drivers. | Introduction / How does DBI connect R to a database? |
| 2 | DBI-in-R-query-workflow.webp | Figure 2 | The core DBI workflow: connect, query or write, then disconnect. | How do you query data with dbGetQuery()? |
| 3 | DBI-in-R-parameterised-vs-paste.webp | Figure 3 | Parameterised queries prevent SQL injection; paste() does not. | Why should you use parameterised queries instead of paste()? |

## E. Code Block Master List

| Block # | Demonstrates | Libs | Vars introduced | Vars used (from prior) |
|---|---|---|---|---|
| 1 | Load DBI + RSQLite, create connection | DBI, RSQLite | con | — |
| 2 | dbListTables on empty DB | — | — | con |
| 3 | dbWriteTable mtcars, dbGetQuery SELECT | — | — | con |
| 4 | Complex query with WHERE + ORDER BY | — | fast_cars | con |
| 5 | Write iris, dbListTables, dbListFields | — | — | con |
| 6 | Append rows, read back | — | extra_rows | con |
| 7 | Dangerous paste() query | — | user_input | con |
| 8 | Safe parameterised query | — | safe_result | con |
| 9 | library(dplyr,dbplyr), tbl() | dplyr, dbplyr | mtcars_db | con |
| 10 | filter/group_by/summarise + show_query | — | summary_query | mtcars_db |
| 11 | collect() | — | local_result | summary_query |
| 12 | dbDisconnect + on.exit pattern | — | — | con |

Estimated word count: ~3,500-4,000 words
Interactive code blocks: 12
H2 sections: 13 (1 intro + 6 core + 6 tail)
Diagrams: 3
