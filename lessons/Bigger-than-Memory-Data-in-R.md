---
title: "data.table Lesson 3: Bigger-Than-Memory Data"
description: "Your data is bigger than your laptop memory. Stream it in chunks and query it on disk with DuckDB and dplyr from R, without ever loading the whole file."
keywords: "bigger than memory data R, out of core R, duckdb in R, duckplyr, data.table fread, streaming chunks R, large data R, query parquet R"
post_type: "LESSON"
curriculum_id: "2.6.3"
webr: true
mathjax: true
lesson_access: "free"
course_id: "da-datatable"
course_title: "Fast Data Wrangling with data.table"
course_lesson: "3"
course_total: "3"
course_landing: "data-table-Course.html"
course_next: ""
course_prev: "dplyr-vs-data-table.html"
---

=== step === cover
::eyebrow Lesson 3 of 3
## When the data is bigger than the laptop

Maya's bakery chain has been logging every sale for five years. That till log is now a single CSV of about **38 million rows, roughly 12 GB on disk**. Her laptop has **8 GB of memory**. When she runs the import she has used since Lesson 1, R thinks for a minute and then quits:

```r-static
read.csv("till_log_2021_2025.csv")
#> Error: cannot allocate vector of size 6.7 Gb
```

The file is bigger than the memory. In Lessons 1 and 2 you learned the `DT[i, j, by]` bracket and watched data.table beat dplyr on speed and memory, but every one of those tricks still assumed the table fit in RAM. This lesson is about the moment it does not.

By the end you will be able to:

- Explain why a file larger than memory cannot simply be loaded into R
- Stream a too-big file in chunks, keeping only a small running answer
- Query data **on disk** with DuckDB, in SQL and in dplyr, never loading the whole thing

**Prerequisites:** you can run R; you know the data.table bracket from [Lesson 1](data-table-Syntax-and-Keys.html) and the [dplyr verbs and the pipe](The-dplyr-Verbs.html). No databases or SQL assumed; we build the SQL up from scratch.

::widget process-flow {"steps":[{"title":"1. Do not load it all","sub":"a 12 GB file cannot fit in 8 GB of RAM, so never read the whole thing into R"},{"title":"2. Send the query to the data","sub":"let an engine scan the file where it sits on disk and compute the answer there"},{"title":"3. Pull back only the answer","sub":"a few summary rows come into R, not the millions of rows behind them"}]}

=== step === concept
::eyebrow Why it breaks
## R works in memory

Here is the thing to understand first, because everything else follows from it. **R holds every object in RAM** (random-access memory, the fast working space your computer can read instantly). When you call `read.csv`, R builds the entire data frame in RAM before you can touch a single row. **Disk** (the hard drive or SSD where the file lives) is far larger but far slower, and R does not work from it directly. So the file has to pass *through* memory, and a 12 GB file simply will not fit in 8 GB.

And memory grows in lock-step with the rows. A table with \(n\) rows costs about \(O(n)\) memory, meaning double the rows and you double the RAM. Watch it happen: the same four-column table at ten thousand, a hundred thousand, and a million rows.

```r
set.seed(1)
# megabytes used by a 4-column numeric table, as the rows grow 10x each step
mb <- sapply(c(1e4, 1e5, 1e6), function(r) {
  tbl <- data.frame(a = runif(r), b = runif(r), c = runif(r), d = runif(r))
  as.numeric(object.size(tbl)) / 1e6
})
round(mb, 1)
#> [1]  0.3  3.2 32.0
```

Ten times the rows, ten times the memory. There is no clever option that makes 38 million rows weigh nothing; the chart below is the wall Maya hit.

::widget chart-plotter {"data":[{"x":"10K rows","y":0.3},{"x":"100K rows","y":3.2},{"x":"1M rows","y":32}],"geoms":["bar"],"x":"rows","y":"MB","code":{"bar":"ggplot(mem, aes(rows, mb)) +\n  geom_col()"}}

[NOTE]
Tidier types help a little: store a category as a `factor` or an integer instead of text, drop columns you do not need, and a table can shrink two or three times over. But that is a constant factor. It buys you a bigger laptop, not an unlimited one. Past some row count you still need a different idea.

=== step === concept
::eyebrow Escape route 1
## Stream it in chunks

Here is the first real idea, and it is one you can picture. Maya does not actually need all 38 million rows in memory at once. She needs **total revenue per shop**, which is just a handful of numbers. So read the file a slice at a time, add each slice into a small running total, then throw the slice away before reading the next.

The whole table never lives in memory at once. Only one chunk plus a tiny running total does, so the memory you need is \(O(g)\) where \(g\) is the number of groups (here, the number of shops), not \(O(n)\). The number of passes is about \(n / c\) rounded up (the \(\lceil\;\rceil\) ceiling brackets just mean "round up to the next whole pass") for a chunk size \(c\). The flow below is the loop.

::widget process-flow {"steps":[{"title":"Read a chunk","sub":"pull the next million rows off disk into memory"},{"title":"Update the totals","sub":"add this chunk into a small running per-shop total"},{"title":"Discard the chunk","sub":"free those rows, so the full table is never in memory all at once"},{"title":"Repeat to the end","sub":"after about n / chunk passes the running totals are complete"}]}

Here is the pattern in miniature. We build a 30,000-row stand-in for the real file, then process it in three 10,000-row chunks, keeping only a per-shop total:

```r
set.seed(1)
# stand-in for the giant file: pretend we can only see 10,000 rows at a time
big <- data.frame(
  shop    = sample(c("Austin", "Denver", "Seattle"), 3e4, replace = TRUE),
  revenue = round(runif(3e4, 1, 200), 2)
)

totals <- c(Austin = 0, Denver = 0, Seattle = 0)   # the small running answer
for (start in seq(1, 3e4, by = 1e4)) {
  chunk <- big[start:(start + 1e4 - 1), ]           # one chunk = one disk read
  s     <- tapply(chunk$revenue, chunk$shop, sum)   # this chunk's per-shop sums
  totals[names(s)] <- totals[names(s)] + s          # fold into the running total
}
round(totals)
#>  Austin  Denver Seattle
#> 1006020 1002774 1003664
```

A close cousin of chunking is to **read only the columns you need**. Maya's file has 14 columns; for revenue per shop she needs two. `fread` can skip the rest, so much less ever reaches memory:

```r
write.csv(big, "till.csv", row.names = FALSE)   # write a small example file to this session

library(data.table)
setDTthreads(1)                                  # the in-browser R runs on one core
cols_needed <- fread("till.csv", select = c("shop", "revenue"))
head(cols_needed, 3)
#>      shop revenue
#> 1: Austin   53.18
#> 2: Denver  176.41
#> 3: Austin   118.6
```

=== step === quiz
::eyebrow Check yourself
## Pick the right move

Maya has a **50 GB** sales file and a laptop with **16 GB** of RAM. She just needs total revenue per shop. What is the soundest first move?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- Open it with `read.csv()` and wait; R will page it in from disk as needed ::no R does not page a data frame in and out of disk. `read.csv` tries to build the whole 50 GB object in RAM at once and fails with "cannot allocate vector". Reading it all is exactly what you cannot do here.
- Read it in chunks, or hand it to an out-of-core engine, computing the per-shop totals without ever holding all 50 GB at once ::ok Right. The total is just a small running per-shop sum, so stream the file (or let an engine scan it on disk). Memory stays tiny no matter how big the file grows.
- Randomly sample 10% so it fits, then multiply the totals by 10 ::no A sample answers a different, noisier question and can miss whole shops or rare days entirely. You can get the exact total without sampling, by streaming or by querying on disk.

=== step === concept
::eyebrow Escape route 2
## Send the query to the data

Chunking works, but you had to write the loop yourself, and it only handles sums that fold together neatly. The better idea is to stop moving the data to your code and instead **move your question to the data**.

That is what an **out-of-core** engine does ("out-of-core" just means "works on data too big for RAM, straight from disk"). The friendliest one for R is **DuckDB**: an analytical database that runs **in-process** (no server to start, it is just a `library()` call) and reads CSV or Parquet files **where they sit on disk**. You hand it a question; it scans the file, and two things keep it light:

- **Column pruning:** it reads only the columns your query names, skipping the other twelve.
- **Predicate pushdown:** it reads only the rows that pass your filter, skipping the rest.

So a query over 38 million rows touches only the bytes it truly needs and returns a small answer. The millions of rows stay on disk; a few summary rows come back to R.

::widget table-transform {"code":"SELECT year, SUM(revenue) FROM sales GROUP BY year","caption":"DuckDB scans all 38 million rows where they sit on disk, but only this 3-row summary is sent back to R. The query does the shrinking, so your laptop never holds the full table.","before":{"cols":["year","shop","units","revenue"],"rows":[[2021,"Austin",18,1240],[2021,"Denver",22,1510],[2022,"Austin",27,1880],[2022,"Seattle",15,990],[2023,"Denver",30,2100],[2023,"Austin",24,1660]]},"after":{"cols":["year","revenue"],"rows":[[2021,116230],[2022,133400],[2023,152130]]}}

=== step === widget
::eyebrow The payoff
## Query it, live

Let us actually do it. We connect to DuckDB, hand it a small `sales` table (picture it as the 38-million-row file), and ask a question in **SQL**, the language databases speak. Read the query as a sentence: **SELECT** the columns you want, **FROM** the table, **GROUP BY** the column that defines each group. Only the small grouped result returns to R.

```r
library(duckdb)
library(DBI)

con <- dbConnect(duckdb())          # start an in-process database, no server needed

# Maya's sales (small here; imagine 38 million rows behind it)
sales <- data.frame(
  year    = c(2021, 2021, 2021, 2022, 2022, 2022, 2023, 2023, 2023),
  shop    = c("Austin", "Denver", "Seattle", "Austin", "Denver", "Seattle", "Austin", "Denver", "Seattle"),
  revenue = c(48210, 39880, 28140, 53120, 44230, 36050, 61040, 49870, 41220)
)
dbWriteTable(con, "sales", sales)   # hand the table to DuckDB

# ask DuckDB the question; only the small answer comes back to R
dbGetQuery(con, "SELECT year, SUM(revenue) AS revenue FROM sales GROUP BY year ORDER BY year")
#>   year revenue
#> 1 2021  116230
#> 2 2022  133400
#> 3 2023  152130
```

Three rows came back, not 38 million. That is the whole point: the heavy lifting happened inside DuckDB, and R only ever saw the summary, which is exactly why this scales to files far bigger than memory.

::widget chart-plotter {"data":[{"x":"2021","y":116230},{"x":"2022","y":133400},{"x":"2023","y":152130}],"geoms":["bar"],"x":"year","y":"revenue","code":{"bar":"ggplot(by_year, aes(year, revenue)) +\n  geom_col()"}}

=== step === tryit
::eyebrow Your turn
## Group it your way

The connection `con` and the `sales` table from the last step are still live. Now answer a different question: **total revenue per shop, biggest first**. The `SELECT`, `FROM` and `ORDER BY` are written for you; fill in the grouping column so the sum is computed once per shop.

```r
dbGetQuery(con, "SELECT shop, SUM(revenue) AS revenue
                 FROM sales
                 GROUP BY ____
                 ORDER BY revenue DESC")
```
::check {"regex":"GROUP\\s+BY\\s+shop","gate":true,"difficulty":"intermediate","ok":"That is it: GROUP BY shop tells DuckDB to total revenue once per shop. The scan happens on disk and only three small rows return to R.","no":"Group by the shop column: replace the blank with shop, so the line reads GROUP BY shop."}
::solution
```r
dbGetQuery(con, "SELECT shop, SUM(revenue) AS revenue
                 FROM sales
                 GROUP BY shop
                 ORDER BY revenue DESC")
#>      shop revenue
#> 1  Austin  162370
#> 2  Denver  133980
#> 3 Seattle  105410
```

=== step === concept
::eyebrow Keep your dplyr
## Point it at the files, write dplyr

You do not have to write SQL. DuckDB can stand behind ordinary **dplyr**: you point a table at the files on disk, write the same `group_by` and `summarise` you already know, and DuckDB runs it out-of-core. The catch, and the feature, is that it is **lazy**: nothing runs while you build the pipeline. It only runs when you call **`collect()`**, and only the small final result is pulled into R.

```r-static
library(duckdb)
library(dplyr)

con <- dbConnect(duckdb())

# point a lazy table at five years of Parquet files - nothing is read yet
sales <- tbl(con, "read_parquet('till_logs/*.parquet')")

revenue_by_year <- sales |>
  group_by(year) |>
  summarise(revenue = sum(revenue)) |>
  arrange(year) |>
  collect()          # only NOW does DuckDB scan the files; only this small result enters R
```

::widget process-flow {"steps":[{"title":"Describe the query","sub":"write group_by plus summarise on a table pointed at the files; nothing runs yet"},{"title":"DuckDB runs it on disk","sub":"the engine scans the Parquet files out of core, never loading them into R"},{"title":"collect() the result","sub":"only now does the work happen, and only the small summary enters R"}]}

[NOTE]
The **duckplyr** package makes this even smoother: load it and your normal dplyr on a plain data frame is quietly executed by DuckDB, with no connection to manage. The **arrow** package does the same trick for folders of Parquet files. Different front doors, same idea: write dplyr, let an out-of-core engine do the scanning. **Parquet** is worth knowing here too: a columnar file format that, unlike CSV, lets the engine grab one column without reading the rest, which is what makes column pruning so cheap.

=== step === quiz
::eyebrow Check yourself
## What does collect() do?

You build a lazy DuckDB table over Maya's Parquet files, pipe it through `group_by`, `summarise` and `arrange`, and assign the result to `q`, all without calling `collect()` yet. What is in `q`, and when does the work actually happen?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The full result table, already computed and sitting in R memory ::no Nothing has run yet. `q` holds only the recipe; no file has been scanned and no memory has been filled. That laziness is exactly what keeps it out-of-core.
- A query plan; DuckDB runs it only when you call `collect()`, and only the small final result enters R ::ok Exactly. A lazy table records what you asked for; `collect()` (or printing it) triggers the scan on disk, and just the summarised rows come back to R.
- An error, because you must call `collect()` after every verb ::no You can chain as many verbs as you like onto a lazy table; they stack onto the plan. A single `collect()` at the end runs the whole thing once.

=== step === concept
::eyebrow Choosing
## Which tool, when

You now have three moves for big data: use less memory, stream in chunks, or push the query to the data. Pick by how the data compares to your RAM.

| Your situation | Reach for |
|---|---|
| Fits comfortably in RAM | dplyr or data.table, as in Lessons 1 and 2 |
| Close to your RAM limit | data.table with `fread`, reading only the columns you need |
| Bigger than RAM, or many files | **DuckDB** (SQL or dplyr), or **arrow** for Parquet folders |
| A one-off pass for a single total | a chunked read loop |

[WARNING]
DuckDB is built for **analytical** scans, aggregations and joins over large files, not for many tiny single-row writes (that is a transactional database like Postgres). Two more honest limits: store big data as **Parquet**, not CSV, or you lose most of the column-pruning speed; and `collect()` still pulls its result into RAM, so if you `collect()` a query that returns millions of rows you are right back to the memory wall. Summarise first, collect small.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [DuckDB R API documentation](https://duckdb.org/docs/current/clients/r.html) - the official guide to `dbConnect(duckdb())`, querying files, and the dplyr interface used here.
- [duckplyr (tidyverse)](https://duckplyr.tidyverse.org/) - run ordinary dplyr on a data frame and have DuckDB execute it out-of-core, no SQL.
- [Arrow for R](https://arrow.apache.org/docs/r/) - query and stream folders of Parquet/CSV files that are larger than memory, with a dplyr backend.
- [Introduction to data.table (CRAN vignette)](https://cran.r-project.org/web/packages/data.table/vignettes/datatable-intro.html) - `fread`, `select=` and the memory-frugal reading from this lesson.
- [Efficient R Programming, Input/Output chapter (free)](https://csgillespie.github.io/efficientR/input-output.html) - a clear, practical tour of reading large data and keeping memory in check.

=== step === complete
## Course complete

You can now work with data that does not fit in memory. The trick is never to fight the memory wall head-on: **load less** (fewer columns, leaner types), **stream** the file in chunks while keeping a small running answer, or best of all **send the query to the data** and let DuckDB scan it on disk, in SQL or in dplyr, returning only the summary you asked for.

That closes the **Fast Data Wrangling with data.table** course. Across three lessons you went from the `DT[i, j, by]` bracket and keys, to data.table versus dplyr head to head, to querying data far bigger than your laptop. This course is part of the Data Analyst track: pass the track assessment and it counts toward your verified certificate.
