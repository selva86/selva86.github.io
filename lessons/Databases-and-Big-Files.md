---
title: "Importing Data Lesson 4: Databases and Big Files"
catalog_blurb: "Query data in a database, and read files too big to load."
description: "Work with data beyond a single CSV: query a database from R with DBI and dbplyr, read only the columns you need from huge files, and fix Parquet and text encodings."
keywords: "R database, DBI, duckdb, dbplyr, SQL in R, dbGetQuery, collect, read Parquet in R, arrow, big data in R, col_select, file encoding in R, locale, readr"
post_type: "LESSON"
curriculum_id: "1.4.4"
webr: true
lesson_access: "free"
course_id: "nr-import"
course_title: "Importing Data into R"
course_lesson: "4"
course_total: "5"
course_landing: "R-Foundations-Import-Course.html"
course_next: "Saving-and-Exporting-Data.html"
course_prev: "JSON-and-Web-Data.html"
---

=== step === cover
::eyebrow Lesson 4 of 5
## Databases and Big Files

In lessons 1 to 3 you opened files: a `.csv`, an Excel workbook, an SPSS file, even JSON straight off a web API. Every one of them shared a quiet assumption: the whole thing fits in R's memory, so you read it all in and work on it.

Maria's corner bakery has grown into a small chain of shops. Two years of every till receipt no longer fit in one emailed spreadsheet: they live in a **database**. Her analytics provider drops a monthly **Parquet** file. And an old flour supplier still sends a giant text export whose accented names arrive scrambled. None of these wants to be read whole.

This lesson teaches the one idea that handles all of them: **bring your question to the data, instead of dragging all the data into R.** By the end you will be able to:

- Connect to a **database** from R and load a table into it
- Send a question in **SQL** and get back only the small answer
- Query a database with the **dplyr** verbs you already know, and pull the result with `collect()`
- Read only the columns you need from a file too big to open, and fix a garbled **encoding**

**Prerequisites:** lessons 1 to 3 (you know a **tibble**, that columns have a **type**, `read_csv()`, and `library()`). No SQL is assumed; every term is defined as it appears. The map below is the whole lesson in one picture.

::widget process-flow {"steps":[{"title":"Point at the source","sub":"a database, or a file too big to load"},{"title":"Ask only what you need","sub":"a query, or just the columns that matter"},{"title":"The engine does the work","sub":"it filters and totals where the data lives"},{"title":"Pull only the answer","sub":"a small tibble comes back into R"}]}

=== step === concept
::eyebrow Where big data lives
## A database holds the data; you send it questions

A **database** is a program built to store tables and answer questions about them, even when those tables hold millions of rows. Think of it as the bakery's stockroom: you do not carry the whole stockroom to the front counter, you send back a note asking for "two trays of croissants" and only those come out.

To talk to one from R you open a **connection**: a live link to the database that you send questions down and get answers back through. R uses one consistent toolkit for this called **DBI** (the DataBase Interface), so the same handful of functions work whether the database is SQLite, Postgres, or, here, **duckdb**, a fast database that needs no separate server and runs right inside your R session. That makes it perfect for learning, and genuinely useful for big local files.

We will stand up a tiny sales table so every step is real. In a true project this table would already hold years of data; the few rows here behave exactly the same way.

```r
library(DBI)
library(duckdb)

sales <- data.frame(
  shop  = c("Old Town","Old Town","Old Town","Riverside","Riverside","Riverside"),
  item  = c("croissant","muffin","baguette","croissant","muffin","baguette"),
  qty   = c(14, 11, 6, 9, 13, 8),
  price = c(2.50, 3.25, 4.00, 2.50, 3.25, 4.00),
  stringsAsFactors = FALSE
)

con <- dbConnect(duckdb())        # open a connection to an in-memory database
dbWriteTable(con, "sales", sales) # store the data frame as a table called "sales"
dbListTables(con)                 # what tables does the database now hold?
#> [1] "sales"
```

[NOTE]
`dbConnect()` opens the link and `dbDisconnect(con, shutdown = TRUE)` closes it when you are done. Everything between is the same no matter which database sits on the other end: that is the whole point of DBI.

=== step === concept
::eyebrow Asking a question
## Ask in SQL, get back only the answer

The language databases speak is **SQL** (Structured Query Language). A **query** is one SQL sentence describing the answer you want; `dbGetQuery()` sends it down the connection and hands back the result as an ordinary data frame.

Read this query like a sentence: `SELECT` the columns I want, `FROM` the table, `GROUP BY` item so each item is summed on its own, `ORDER BY` revenue from high to low. `SUM(qty)` adds the quantities and `AS units` names that new column.

```r
dbGetQuery(con, "
  SELECT item, SUM(qty) AS units, ROUND(SUM(qty * price), 2) AS revenue
  FROM sales
  GROUP BY item
  ORDER BY revenue DESC
")
#>        item units revenue
#> 1    muffin    24    78.0
#> 2 croissant    23    57.5
#> 3  baguette    14    56.0
```

The sales table had six rows; the answer has three. That gap is the entire lesson in miniature.

[KEY INSIGHT]
The database did the adding-up, and only the small summary crossed back into R. Had the table held ten million rows, the totalling would still happen inside the database and you would still receive just these three rows. You bring the question to the data, not the data to the question.

=== step === quiz
::eyebrow Check yourself
## Where does the work happen?

Maria's real `sales` table has two million rows. She runs `dbGetQuery(con, "SELECT item, SUM(qty) AS units FROM sales GROUP BY item")`. Where does the adding-up happen, and what comes back to R?

::quiz {"correct":1,"gate":true,"difficulty":"beginner"}
- The database computes the totals and sends back only the small per-item result, a handful of rows ::ok Right. The GROUP BY runs inside the database, where the data lives, and only the summary crosses into R. That is why this scales to millions of rows.
- R first downloads all two million rows, then sums them itself ::no That is exactly what querying avoids. The database does the SUM and GROUP BY; pulling every row into R would defeat the purpose and may not even fit in memory.
- Nothing comes back; dbGetQuery only writes to the database's log ::no dbGetQuery returns the result as a data frame you can assign and use, just like read_csv hands you a tibble.

=== step === concept
::eyebrow The verbs you already know
## Query with dplyr, not just SQL

You do not have to write SQL by hand. The **dbplyr** package lets you query a database using the **dplyr** verbs from earlier in your R journey: `filter()`, `group_by()`, `summarise()`, `arrange()`. You point `tbl()` at a table to get a **lazy** reference (a stand-in that has run nothing yet), pipe your verbs onto it, and dbplyr quietly translates the whole chain into SQL.

`show_query()` lets you see that translation:

```r
library(dplyr)
library(dbplyr)

q <- tbl(con, "sales") |>          # a lazy reference to the table, no data pulled yet
  group_by(item) |>
  summarise(units = sum(qty), revenue = sum(qty * price)) |>
  arrange(desc(revenue))

show_query(q)                      # the SQL dbplyr wrote for you
#> <SQL>
#> SELECT item, SUM(qty) AS units, SUM(qty * price) AS revenue
#> FROM sales
#> GROUP BY item
#> ORDER BY revenue DESC
```

That is the very query you wrote by hand a moment ago, generated from dplyr. Nothing has actually run yet, though: `q` is still just a plan. To execute it in the database and pull the result into R as a real tibble, you call `collect()`.

```r
collect(q)
#> # A tibble: 3 x 3
#>   item      units revenue
#>   <chr>     <dbl>   <dbl>
#> 1 muffin       24      78
#> 2 croissant    23    57.5
#> 3 baguette     14      56
```

[KEY INSIGHT]
The chain stays **lazy** until `collect()`. You can stack as many verbs as you like, see the SQL, and refine it, all without moving a single row. `collect()` is the moment the question finally goes to the data and the answer comes back.

=== step === tryit
::eyebrow Your turn
## Pull the answer into R

The connection `con` and its `sales` table are still open from the steps above. This pipeline counts croissants sold across all shops, but it stops at a lazy plan: it never runs. Add the one verb that executes it in the database and pulls the result back, then check it.

```r
library(dplyr)
library(dbplyr)

croissants <- tbl(con, "sales") |>
  filter(item == "croissant") |>
  summarise(units = sum(qty)) |>
  ____
croissants
```
::check {"regex":"collect\\s*[(]","gate":true,"difficulty":"intermediate","ok":"Exactly. collect() runs the query inside the database and returns the small result as a tibble: 23 croissants.","no":"The pipeline is still a lazy plan. Finish it with collect() to run it and fetch the answer."}
::solution
```r
library(dplyr)
library(dbplyr)

croissants <- tbl(con, "sales") |>
  filter(item == "croissant") |>
  summarise(units = sum(qty)) |>
  collect()
croissants
#> # A tibble: 1 x 1
#>   units
#>   <dbl>
#> 1    23
```

=== step === concept
::eyebrow Files too big to open
## Read only what you need

Not all big data lives in a database. Sometimes it is just an enormous flat file, more rows or columns than you want to pull into memory. The same principle rescues you: read only the part you need.

`read_csv()` takes a `col_select` argument that reads a chosen set of columns and skips the rest entirely. Maria's export has seven columns, but to total sales she needs only two. The widget shows the move: a wide table narrowed to just `item` and `qty`.

::widget table-transform {"code":"read_csv(\"big_sales.csv\", col_select = c(item, qty))","caption":"A wide export has many columns. Name just the two you need and readr reads only those, skipping the rest of the file.","before":{"cols":["date","shop","item","qty","price","cashier","note"],"rows":[["2026-03-09","Old Town","croissant",14,2.50,"A",""],["2026-03-09","Old Town","muffin",11,3.25,"B",""],["2026-03-10","Riverside","baguette",6,4.00,"A","promo"]]},"after":{"cols":["item","qty"],"rows":[["croissant",14],["muffin",11],["baguette",6]]}}

Here it is for real. We write a small file, then read back only the two columns that matter:

```r
library(readr)

rows <- c(
  "date,shop,item,qty,price,cashier,note",
  "2026-03-09,Old Town,croissant,14,2.50,A,",
  "2026-03-09,Old Town,muffin,11,3.25,B,",
  "2026-03-10,Riverside,baguette,6,4.00,A,promo"
)
writeLines(rows, "big_sales.csv")

read_csv("big_sales.csv", col_select = c(item, qty))
#> # A tibble: 3 x 2
#>   item        qty
#>   <chr>     <dbl>
#> 1 croissant    14
#> 2 muffin       11
#> 3 baguette      6
```

When you just want to see a file's shape before committing to it, `n_max` reads only the first few rows:

```r
read_csv("big_sales.csv", n_max = 1)   # peek at the first row to learn the columns
#> # A tibble: 1 x 7
#>   date       shop     item        qty price cashier note
#>   <date>     <chr>    <chr>     <dbl> <dbl> <chr>   <lgl>
#> 1 2026-03-09 Old Town croissant    14   2.5 A       NA
```

For data that is genuinely huge, there is a file format built for exactly this: **Parquet**. A CSV stores data row by row, so reading two columns still means scanning every row. Parquet is **columnar**: each column is stored separately and compressed, so reading 2 columns out of 40 touches only those 2. The **arrow** package reads it, and can even query a folder of Parquet files on disk without loading it whole. (Parquet needs the arrow library, which runs on your own machine rather than here, so this block is for reference.)

```r-static
library(arrow)
library(dplyr)

# Read only the columns you need from a columnar Parquet file:
trimmed <- read_parquet("sales.parquet", col_select = c("item", "qty"))

# Bigger than memory? Point at a folder of Parquet files and query it on disk,
# pulling only the small summary back into R:
open_dataset("sales/") |>
  group_by(shop) |>
  summarise(revenue = sum(qty * price)) |>
  collect()
```

=== step === concept
::eyebrow When the text looks wrong
## Fix a garbled encoding

One last way a file fights back: the text comes out scrambled. A computer stores text as **bytes**, and an **encoding** is the codebook that says which byte means which character. Modern files use **UTF-8**; older systems often used **Latin-1**, where each accented character is a single byte. Read a Latin-1 file as if it were UTF-8 and the accented bytes turn to nonsense.

Maria's old supplier is named "Müller". Watch what happens when its Latin-1 bytes are read with the wrong codebook, then the right one:

```r
library(readr)

# The name "Müller" saved as Latin-1 bytes (one byte per character), not UTF-8:
writeBin(as.raw(c(0x4d, 0xfc, 0x6c, 0x6c, 0x65, 0x72)), "supplier.txt")

read_file("supplier.txt")                # read as UTF-8 (the default): garbled
#> [1] "M\xfcller"
```

The `\xfc` is R showing you a raw byte it could not make sense of: `0xfc` is "u with an umlaut" in Latin-1, but it is not valid UTF-8, so the character is lost. Tell readr the file's real encoding with `locale()` and it decodes correctly:

```r
read_file("supplier.txt", locale = locale(encoding = "latin1"))
#> [1] "Müller"
```

[WARNING]
A wrong encoding rarely throws an error, it just quietly corrupts your text, and you may not notice until a name or a currency symbol looks strange in a report. When characters come back wrong, suspect the encoding and set `locale(encoding = ...)` to match the file.

=== step === concept
::eyebrow Putting it together
## Bring your question to the data

Every part of this lesson is the same instinct: do not haul everything into R, send your question to where the data already is and take back only the answer. Which tool you reach for depends on where the data lives and what is in your way.

| Your situation | The move | Why it works |
|---|---|---|
| Data already lives in a database | Query it with DBI or dbplyr, `collect()` only the result | The engine does the heavy work; little crosses into R |
| One huge flat file, you need a few columns | `read_csv(col_select = ...)`, or a columnar Parquet file | You read only the bytes you actually need |
| File is bigger than memory | Load it into duckdb, or `open_dataset()` the Parquet, and query on disk | The whole thing is never held in R at once |
| Text comes back garbled | Set `locale(encoding = ...)` to the file's real encoding | The bytes decode into the right characters |

The dataset changed from a friendly CSV to a database, a Parquet file, and a stubborn encoding, but the skill did not: read what you need, where it lives, in the right shape.

=== step === quiz
::eyebrow Check yourself
## Pick the right plan

A colleague sends a 50-million-row sales file. You need total revenue per shop. The file also has 40 columns you do not need, and the shop names contain accented characters that arrived garbled. What is the soundest plan?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Load it into a database (or read only the columns you need), let the engine total revenue per shop, and set the encoding so the names decode correctly ::ok Right. You push the work to where the data is, read only what matters, and fix the encoding once with locale(). That scales to any size.
- Read all 50 million rows and all 40 columns into R with read_csv, summarise in R, and fix the names by hand afterwards ::no Pulling everything into memory is the one thing to avoid here, and it may not even fit. Hand-fixing accents does not scale; set locale(encoding = ...) once.
- Open the file in a spreadsheet, delete the columns and rows you do not want, then read what is left ::no A 50-million-row file will not open in a spreadsheet, and the whole point is to never load the entire thing. Query it in place instead.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [R for Data Science (2e), Databases](https://r4ds.hadley.nz/databases) - the canonical free walkthrough of `DBI` and `dbplyr`, with `tbl()`, `collect()` and SQL translation.
- [DBI package home (r-dbi)](https://dbi.r-dbi.org/) - the universal database interface used here: `dbConnect`, `dbGetQuery`, `dbWriteTable` and friends.
- [dbplyr (tidyverse)](https://dbplyr.tidyverse.org/) - how dplyr verbs become SQL, what is lazy, and when to `collect()`.
- [Arrow for R](https://arrow.apache.org/docs/r/) - reading Parquet and querying bigger-than-memory datasets on disk with `read_parquet` and `open_dataset`.
- [readr: locales and encodings](https://readr.tidyverse.org/articles/locales.html) - how to set a file's encoding (and date, time and number formats) when the defaults are wrong.

=== step === complete
## Lesson 4 complete

You can now reach data that will not fit in a single `read_csv()`. You connected to a database with `DBI` and duckdb, asked questions in SQL with `dbGetQuery()`, and queried it with the same dplyr verbs you already knew, pulling results back with `collect()`. You read only the columns you needed from a wide file, met Parquet as the columnar format built for big data, and fixed a garbled name by setting its encoding.

The thread through all of it: bring your question to the data, and take back only the answer.

Next, Lesson 5: Saving and Exporting Data. Once you have the result you wanted, you need to write it back out, as a CSV, an R data file, or an Excel workbook, and choose the right format for who reads it next. That closes the loop on getting data in and out of R.
