# Plan: DBI in R

## Frontmatter
- title: Connect R to Any Database: DBI + RSQLite, RPostgres, and RMySQL
- slug: DBI-in-R
- description: DBI gives R a consistent interface to any SQL database. Learn dbConnect(), dbGetQuery(), dbWriteTable(), parameterised queries, and dbplyr for SQL-free queries.
- keywords: DBI R, dbConnect, dbGetQuery, RSQLite, RPostgres, dbplyr, R database connection
- auto_link_terms: DBI|dbConnect()|dbGetQuery()|dbplyr|R database connection
- post_type: C
- sidebar_section: Data Wrangling
- sidebar_title: DBI (Databases)
- sidebar_order: 13

## Core sections (question form)
1. Why use DBI instead of loading CSVs? (payoff: dbGetQuery on SQLite)
2. How do you connect to SQLite, PostgreSQL, and MySQL with DBI?
3. How do you run queries and read results into R?
4. How do you write data from R back into the database?
5. How do you use parameterised queries to prevent SQL injection?
6. How does dbplyr let you use dplyr syntax on SQL tables?
7. How do you manage connections and transactions safely?

## Diagrams (reuse)
1. DBI-in-R-architecture.webp
2. DBI-in-R-query-workflow.webp
3. DBI-in-R-parameterised-vs-paste.webp

## Tail
- Practice Exercises, Complete Example, Summary, References, Continue Learning
