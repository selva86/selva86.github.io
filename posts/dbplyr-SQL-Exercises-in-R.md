---
title: "dbplyr / SQL Exercises in R: 15 Practice Problems"
slug: "dbplyr-SQL-Exercises-in-R"
description: "Master dbplyr in R with 15 practice problems: SQL translation, connections, lazy evaluation, joins, collect. Hidden solutions."
keywords: "dbplyr R exercises, R SQL exercises, dbplyr practice, R database access exercises, dbplyr to SQL"
mathjax: false
webr: false
date: "2026-05-11"
post_type: "EX"
sidebar_title: "dbplyr / SQL Exercises"
sidebar_order: 160
fr_parent: "R-Tutorial.html"
auto_link_terms: "dbplyr R exercises|R SQL exercises|dbplyr practice|R database access exercises"
auto_link_case_sensitive: false
target_keyword: "dbplyr R exercises"
sibling_block_enabled: false
difficulty: "Intermediate"
---

# dbplyr / SQL Exercises in R: 15 Practice Problems

<p class="lead">Fifteen practice problems on dbplyr: connect, translate dplyr to SQL, lazy ops, joins, collect. Hidden solutions.</p>

```r title="Run this once before any exercise"
library(dplyr)
library(dbplyr)
library(DBI)
library(RSQLite)
```

### Exercise 1: Connect to SQLite (in-memory)

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
con <- dbConnect(SQLite(), ":memory:")
dbWriteTable(con, "mtcars", mtcars)
dbListTables(con)
```

</details>

### Exercise 2: tbl reference

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
con <- dbConnect(SQLite(), ":memory:")
dbWriteTable(con, "mtcars", mtcars)
mt <- tbl(con, "mtcars")
mt
```

</details>

### Exercise 3: filter

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
con <- dbConnect(SQLite(), ":memory:"); dbWriteTable(con, "mtcars", mtcars)
tbl(con, "mtcars") |> filter(mpg > 25)
```

</details>

### Exercise 4: Show SQL

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
con <- dbConnect(SQLite(), ":memory:"); dbWriteTable(con, "mtcars", mtcars)
tbl(con, "mtcars") |> filter(mpg > 25) |> show_query()
```

</details>

### Exercise 5: select

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
con <- dbConnect(SQLite(), ":memory:"); dbWriteTable(con, "mtcars", mtcars)
tbl(con, "mtcars") |> select(mpg, cyl)
```

</details>

### Exercise 6: group_by + summarise

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
con <- dbConnect(SQLite(), ":memory:"); dbWriteTable(con, "mtcars", mtcars)
tbl(con, "mtcars") |> group_by(cyl) |> summarise(m = mean(mpg))
```

</details>

### Exercise 7: arrange

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
con <- dbConnect(SQLite(), ":memory:"); dbWriteTable(con, "mtcars", mtcars)
tbl(con, "mtcars") |> arrange(desc(mpg))
```

</details>

### Exercise 8: collect to local

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
con <- dbConnect(SQLite(), ":memory:"); dbWriteTable(con, "mtcars", mtcars)
local_df <- tbl(con, "mtcars") |> filter(mpg > 25) |> collect()
nrow(local_df)
```

</details>

### Exercise 9: Inner join

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
con <- dbConnect(SQLite(), ":memory:")
dbWriteTable(con, "a", data.frame(id = 1:3, x = 10:12))
dbWriteTable(con, "b", data.frame(id = 2:4, y = 20:22))
inner_join(tbl(con, "a"), tbl(con, "b"), by = "id")
```

</details>

### Exercise 10: Send raw SQL

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
con <- dbConnect(SQLite(), ":memory:"); dbWriteTable(con, "mtcars", mtcars)
dbGetQuery(con, "SELECT cyl, AVG(mpg) AS m FROM mtcars GROUP BY cyl")
```

</details>

### Exercise 11: List tables

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
con <- dbConnect(SQLite(), ":memory:"); dbWriteTable(con, "mtcars", mtcars)
dbListTables(con)
```

</details>

### Exercise 12: Disconnect

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
con <- dbConnect(SQLite(), ":memory:")
dbDisconnect(con)
```

</details>

### Exercise 13: window function via SQL

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
con <- dbConnect(SQLite(), ":memory:"); dbWriteTable(con, "mtcars", mtcars)
tbl(con, "mtcars") |> group_by(cyl) |>
  mutate(rk = row_number(desc(mpg))) |>
  show_query()
```

</details>

### Exercise 14: SQL escape protected string

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
con <- dbConnect(SQLite(), ":memory:")
dbQuoteIdentifier(con, "my table")
```

</details>

### Exercise 15: Write large data

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
con <- dbConnect(SQLite(), "demo.sqlite")
dbWriteTable(con, "mtcars", mtcars, overwrite = TRUE)
dbDisconnect(con)
```

</details>

## What to do next

- **dplyr-Exercises** (shipped) — local dplyr practice.
- **Data-Wrangling-Exercises** (shipped) — broader wrangling.
