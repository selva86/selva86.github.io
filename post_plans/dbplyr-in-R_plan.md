# Plan: dbplyr-in-R

## Frontmatter

| Field | Value |
|---|---|
| title | dbplyr in R: Write dplyr Code That Runs on Any SQL Database |
| slug | dbplyr-in-R |
| description | dbplyr translates your dplyr pipelines into SQL so you can query databases without writing SQL. Learn tbl(), show_query(), collect(), and lazy evaluation with RSQLite examples. |
| keywords | dbplyr, dbplyr R, dplyr SQL database, dbplyr tutorial, show_query, tbl database, lazy SQL query R, dbplyr RSQLite |
| auto_link_terms | dbplyr\|dbplyr in R\|tbl()\|show_query()\|lazy query\|database backend for dplyr |
| auto_link_case_sensitive | true |
| mathjax | false |
| webr | true |
| date | 2026-04-06 |
| curriculum_id | FR-data-2 |
| post_type | FR |
| fr_parent | DBI-in-R.html |

## Lead

dbplyr is a dplyr backend that translates your filter(), mutate(), and summarise() calls into SQL and runs them on a database — so you query millions of rows without loading them into R or writing a single line of SQL.

## Introduction

Hook: you know dplyr, you know DBI. dbplyr is the bridge — write dplyr verbs, get SQL queries executed on the database. Explain tbl() creates a lazy reference, show_query() reveals the SQL, collect() pulls results into R. All examples use RSQLite (runs in browser).

## Core Sections (5 H2s)

### H2 1: How does dbplyr connect dplyr to a database?
- tbl() creates a lazy reference to a database table
- Code: connect to RSQLite, copy mtcars, tbl() to reference
- Inline exercise: create a tbl() reference to a different table

### H2 2: How does dbplyr translate dplyr verbs into SQL?
- show_query() reveals the generated SQL
- Code: filter + select + show_query()
- Code: group_by + summarise + show_query()
- Inline exercise: write a pipeline and predict the SQL

### H2 3: When does dbplyr actually execute the query?
- Lazy evaluation: nothing runs until collect() or print
- Code: chain without collect (lazy), then collect()
- Inline exercise: add collect() to a lazy chain

### H2 4: Which dplyr verbs does dbplyr support?
- Supported: filter, select, mutate, summarise, group_by, arrange, joins, slice_head
- Not supported: custom R functions, rowwise, some tidyr verbs
- Code: join two database tables
- Inline exercise: join + summarise on database tables

### H2 5: How do you mix dbplyr with raw SQL?
- tbl(con, sql("SELECT ...")) for custom SQL
- Code: pass raw SQL through tbl()
- Inline exercise: write a tbl(con, sql(...)) query

## Tail Sections

### Common Mistakes (3)
1. Calling collect() too early (loads entire table)
2. Using R functions dbplyr can't translate
3. Forgetting to disconnect

### Practice Exercises (Capstone, 2)
1. Medium: end-to-end pipeline — connect, copy data, filter+group+summarise, show_query, collect
2. Hard: join two tables on database, compute aggregates, compare dbplyr SQL to hand-written SQL

### Summary, FAQ (3), References (5), What's Next (2)

## Diagrams
None (FR post)

## Code Block Master List

| # | Demonstrates | Libs | Vars introduced |
|---|---|---|---|
| 1 | Connect + copy_to + tbl() | DBI, RSQLite, dplyr, dbplyr | con, mtcars_db |
| 2 | filter + select + show_query() | — | query1 |
| 3 | group_by + summarise + show_query() | — | query2 |
| 4 | Lazy chain + collect() | — | result |
| 5 | Join two tables | — | joined |
| 6 | tbl(con, sql(...)) | — | raw_result |
