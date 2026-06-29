---
title: "R Foundations Lesson 3: The Modern R Toolchain (2026)"
catalog_blurb: "The newer tools that handle bigger data, web APIs and AI from R."
description: "A tour of the 2026 R toolchain: the Positron editor, pulling web data with httr2, querying data too big to load with duckdb, and calling a language model from R with ellmer."
keywords: "modern R toolchain, Positron, httr2, duckdb in R, arrow R, ellmer, R API requests, JSON in R, SQL in R, LLM from R, reproducible workflow"
post_type: "LESSON"
curriculum_id: "1.8.3"
webr: true
lesson_access: "free"
track: "foundations"
course_id: "nr-workflow"
course_title: "R Foundations: Reproducible Workflow"
course_lesson: "3"
course_total: "4"
course_landing: "R-Foundations-Workflow-Course.html"
course_next: "Capstone-A-Reproducible-Analysis.html"
course_prev: "Reproducibility-with-renv-and-git.html"
---

=== step === cover
::eyebrow Lesson 3 of 4
## The Modern R Toolchain (2026)

In Lessons 1 and 2, Maria made her `sales-analysis` project portable and reproducible: the paths work on any machine, and the package versions are pinned so it computes the same answer next year. The project is solid. But the work itself just got harder.

Her company grew. Last year `sales.csv` had a few hundred rows. This year the orders sit in files with millions of rows, too big to open the old way. The finance team wants revenue reported in euros, which means pulling live exchange rates off the web. And there are thousands of free-text product names nobody has time to categorize by hand.

None of that is what R was famous for ten years ago. All of it is comfortable today, because a handful of newer tools have grown up around R. This lesson is a guided tour of that 2026 toolchain, organized around the four jobs every modern analysis needs to do.

By the end of this lesson you will be able to:

- Name the four jobs of a modern R workflow and the tool that does each one
- Pull data from a web API into R by parsing its JSON response
- Query data too big to load into memory by running SQL through duckdb
- Call a language model from R with ellmer, and judge when its answer can be trusted

**Prerequisites:** you have a [reproducible project from Lessons 1 and 2](Reproducibility-with-renv-and-git.html), you can [run R and call a function](R-Syntax-and-First-Objects.html), and you can [install and load a package](Install-and-Load-Packages.html). The four jobs below are the whole tour.

::widget process-flow {"steps":[{"title":"Where you work","sub":"Positron, a modern editor for R and Python"},{"title":"Get the data in","sub":"httr2 for web APIs, arrow for huge files"},{"title":"Query it fast","sub":"duckdb runs SQL over data too big to load"},{"title":"AI on tap","sub":"ellmer sends prompts to a language model"}]}

=== step === concept
::eyebrow Job 1: where you work
## The editor: Positron

Every analysis starts in an editor, the program you actually type and run R in. For years that was **RStudio**, and RStudio is still excellent. But in 2026 the same company (Posit) ships a newer editor called **Positron**, built for the way data work is done now.

Think of Positron as the RStudio idea rebuilt on the engine behind VS Code, the most widely used code editor in the world. Concretely, that buys Maria three things:

- **One editor for R and Python.** Her teammate writes Python; Maria writes R. Positron runs both in the same window, so a project that mixes the two languages does not need two tools.
- **A Data Explorer.** Click a data frame and a spreadsheet-like view opens, where she can sort, filter and scan her `orders` data without writing a line of code to peek at it.
- **The VS Code extension ecosystem.** Themes, Git tools, AI helpers and more, the same add-ons millions of developers already use, work inside Positron.

[NOTE]
You do not have to switch. RStudio is fully supported and many people happily stay. The point of the tour is that Positron is the modern default, especially for projects that mix R and Python or lean on the wider developer toolset. Everything else in this lesson runs identically in either editor.

=== step === concept
::eyebrow Job 2: get the data in
## Pulling data from the web with httr2

Maria needs today's USD-to-EUR exchange rate, and it lives on the web behind an **API** (an Application Programming Interface). An API is just a web address you can send a request to and get structured data back, instead of a human-readable page. You ask a specific **endpoint** (one address for one kind of data, here "give me the latest rates"), and it answers.

What it answers with is almost always **JSON** (JavaScript Object Notation): plain text that writes data as nested `name: value` pairs, like a labeled box of boxes. The **httr2** package is the modern R tool for building and sending that web request. A real call needs a network connection, so here is the shape of it rather than a live run:

```r-static
# httr2 builds a request, sends it over the network, and hands back the response.
resp <- httr2::request("https://api.example.com/rates") |>
  httr2::req_url_query(base = "USD") |>
  httr2::req_perform()

body <- httr2::resp_body_json(resp)   # parse the JSON body into an R list
body$rates$EUR
#> [1] 0.92
```

The response comes back as JSON text. To use it in R you **parse** it: turn the text into a real R list you can index. The **jsonlite** package does exactly that, and we can run it for real on a response pasted in as text (no network needed):

```r
library(jsonlite)

# This is the kind of text a currency API returns. Here it is inline, so it runs offline:
response_text <- '{"base":"USD","date":"2026-06-29","rates":{"EUR":0.92,"GBP":0.79,"INR":83.4}}'

rates <- fromJSON(response_text)   # turn the JSON text into a real R list
rates$base
#> [1] "USD"
rates$rates$EUR                    # reach into the parsed list for the USD to EUR rate
#> [1] 0.92
```

Now `0.92` is an ordinary R number Maria can multiply her revenue by.

[WARNING]
Talking to the web has costs the rest of R does not: you need a connection, the server can be slow or down, and most APIs limit how often you may call them (a **rate limit**). For anything beyond a quick fetch, cache the result so you are not hammering the API every time you re-run the script.

=== step === quiz
::eyebrow Check yourself
## What does parsing give you?

Maria calls the currency endpoint and gets back the text `{"base":"USD","rates":{"EUR":0.92}}`. She runs `rates <- fromJSON(response_text)`. Why is that parsing step necessary, instead of just using the text directly?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- It is not necessary; R can do arithmetic on the JSON text as-is ::no R sees the response as one long character string. `"...0.92..." * 3900` is an error, not multiplication. You have to parse it into real values first.
- Parsing turns the text into an R list, so `rates$rates$EUR` is a number you can compute with ::ok Right. `fromJSON()` converts the JSON text into a nested R list, so `rates$rates$EUR` is the actual number `0.92`, ready to multiply, store, or chart.
- Parsing downloads the data from the internet ::no The download already happened (that is httr2's job). Parsing only converts the text you already received into structured R values; no network is involved.

=== step === concept
::eyebrow Job 3: query it fast
## Querying big data with duckdb

Maria's orders no longer fit comfortably in memory. The old habit, "read the whole file into a data frame, then summarize," falls over when the file has tens of millions of rows. Two tools fix this, and they work together.

First the file format. A plain CSV stores data row by row, as text, so to total one column you still have to read every row of every column. **Parquet** stores data **columnar** (each column together) and compressed, so a tool can read just the columns a question needs. The **arrow** package reads and writes Parquet, and crucially `open_dataset()` does not load the file, it opens a handle to data still sitting on disk:

```r-static
# Parquet is a compact, columnar file format. arrow reads and writes it.
arrow::write_parquet(orders, "orders.parquet")
big <- arrow::open_dataset("orders.parquet")   # a handle to data still on disk, not loaded
nrow(big)                                       # counts the rows without loading them; the same call scales to millions
#> [1] 12
```

Second the engine. **duckdb** is an analytics database that runs **in-process**: there is no separate server to install or start, it lives inside your R session. You hand it data (a data frame, or a Parquet file it reads straight off disk) and ask questions in **SQL**, the standard language for querying tables. Here is the whole loop on Maria's `orders`. First we build the data inline so this page is self-contained:

```r
orders <- data.frame(
  order_id = 1:12,
  region   = c("North","South","East","West","North","South","East","West","North","South","East","West"),
  product  = c("Keyboard","Mouse","Monitor","Laptop","Mouse","Monitor","Keyboard","Laptop","Monitor","Keyboard","Mouse","Laptop"),
  units    = c(3,5,1,1,4,2,2,1,1,6,3,1),
  revenue  = c(180,75,420,1300,60,840,120,1300,420,360,45,1300)
)
head(orders, 3)
#>   order_id region  product units revenue
#> 1        1  North Keyboard     3     180
#> 2        2  South    Mouse     5      75
#> 3        3   East  Monitor     1     420
```

Now point duckdb at it and ask, in SQL, for total revenue per region. `SELECT` chooses the columns, `GROUP BY` collapses the rows into one per region, and `SUM(revenue)` totals each group:

```r
library(DBI)
library(duckdb)

con <- dbConnect(duckdb())            # an in-process analytics database: no server to run
dbWriteTable(con, "orders", orders)   # hand duckdb the data frame as a SQL table named orders

dbGetQuery(con, "
  SELECT region, SUM(revenue) AS total_revenue
  FROM orders
  GROUP BY region
  ORDER BY total_revenue DESC
")
#>   region total_revenue
#> 1   West          3900
#> 2  South          1275
#> 3  North           660
#> 4   East           585
```

The win is that duckdb did the grouping itself, reading only what it needed. On a real Parquet file with millions of rows the exact same SQL returns in a blink, without ever loading the file into R.

::widget process-flow {"steps":[{"title":"Data on disk","sub":"millions of rows in a Parquet file, too big to open"},{"title":"Point duckdb at it","sub":"no server, nothing loaded into memory"},{"title":"Ask in SQL","sub":"it reads only the rows and columns the query needs"},{"title":"Answer back in R","sub":"a small, tidy result, ready to use"}]}

[NOTE]
duckdb is built for **analytics**: scanning and aggregating columns of data you read a lot and write rarely. It is not the right tool for an app that updates single rows constantly (that is a transactional database such as Postgres). For "summarize a giant table," it is hard to beat.

=== step === tryit
::eyebrow Your turn
## Group by a different column

Maria's next question is about products, not regions: how many units of each product did the company sell in total? The connection `con` and the `orders` table are still live from the query above. Fill in the `GROUP BY` so the totals come out one row per product.

```r
dbGetQuery(con, "
  SELECT product, SUM(units) AS total_units
  FROM orders
  GROUP BY ____
  ORDER BY total_units DESC
")
```
::check {"regex":"GROUP\\s+BY\\s+product","gate":true,"difficulty":"beginner","ok":"That is the pattern: GROUP BY product collapses every order into one row per product, and SUM(units) totals each group.","no":"You want one row per product, so group by the product column: GROUP BY product."}
::solution
```r
dbGetQuery(con, "
  SELECT product, SUM(units) AS total_units
  FROM orders
  GROUP BY product
  ORDER BY total_units DESC
")
#>    product total_units
#> 1    Mouse          12
#> 2 Keyboard          11
#> 3  Monitor           4
#> 4   Laptop           3

dbDisconnect(con, shutdown = TRUE)   # close the database when you are done
```

=== step === concept
::eyebrow Job 4: AI on tap
## Talking to a language model with ellmer

Maria's last problem is the thousands of free-text product names she needs to sort into categories like Hardware or Accessory. A **large language model** (the kind of AI behind chat assistants) is good at exactly this sort of fuzzy, language-shaped labeling. The **ellmer** package lets her send a **prompt** (the instruction and text she wants handled) to a model and get its **response** back, all from inside R. A real call needs an API key and a network connection, so here is the shape:

```r-static
# ellmer sends a prompt to a large language model from R (needs an API key + network).
chat <- ellmer::chat_anthropic()

chat$chat("In one word, classify this product as Hardware or Accessory: Wireless Mouse")
#> [1] "Accessory"
```

Run that across her product list and she has a draft category for every row, in minutes. ellmer can also ask for structured output (a table of fields rather than free text), which is how you would label thousands of rows reliably.

[WARNING]
A language model can be **confidently wrong**: it will hand back a clean, plausible answer even when it is mistaken, and it does not tell you which answers to doubt. Treat its labels as a fast first draft, not the truth. Spot-check a real sample by hand, and never feed private data to an outside model without checking your organization's rules. Cost and rate limits apply here too, since every call goes over the network.

=== step === quiz
::eyebrow Check yourself
## How should Maria use the labels?

ellmer returns a Hardware-or-Accessory label for all 4,000 product names in a few minutes. What is the responsible way to use those labels in her analysis?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Treat them as a fast first draft: check a sample by hand, fix the errors, then use them ::ok Exactly. The model is a productive starting point, not an oracle. Verifying a sample tells you the error rate and catches the confident-but-wrong cases before they reach a report.
- Trust them completely; a modern model does not make mistakes on a task this simple ::no Even on easy tasks a language model can be confidently wrong, and it will not flag which answers to doubt. Unchecked labels can quietly corrupt every downstream number.
- Do not use the model at all; only hand-labeling can ever be trusted ::no That throws away a real time-saver. The model does the bulk of the work; you verify a sample. Combining the two beats either one alone.

=== step === concept
::eyebrow Putting it together
## One project, four modern tools

Step back and look at what Maria built. The reproducible project from Lessons 1 and 2 is the foundation; on top of it, each job of the new, harder workload has a sharp 2026 tool:

1. **Positron** is where she writes and runs the project, R and Python in one editor.
2. **httr2** (with jsonlite) pulls live data off the web, and **arrow** reads files far too big to open.
3. **duckdb** answers questions over millions of rows in plain SQL, without loading them.
4. **ellmer** hands the language-shaped work to a model, which she then verifies.

::widget process-flow {"steps":[{"title":"Positron","sub":"write and run the project in one editor"},{"title":"httr2 + arrow","sub":"bring in web data and big files"},{"title":"duckdb","sub":"query millions of rows with plain SQL"},{"title":"ellmer","sub":"ask a model to label or summarize, then verify"}]}

[KEY INSIGHT]
None of this replaces the tidyverse you already know; it extends it to a bigger, more connected world. You still tidy and chart with dplyr and ggplot2. The toolchain just adds the pieces for data that is too big, lives on the web, or needs a model, while your project stays as portable and reproducible as Lesson 2 left it.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative, free places to take each tool further:

- [Positron documentation (Posit)](https://positron.posit.co/) - the official guide to installing and using the Positron editor.
- [httr2 package site](https://httr2.r-lib.org/) - the official reference for building and sending web requests from R.
- [duckdb R client documentation](https://r.duckdb.org/) - how to connect, write tables, and run SQL from R, with examples.
- [Arrow for R](https://arrow.apache.org/docs/r/) - reading and writing Parquet and querying datasets larger than memory.
- [ellmer package site (tidyverse)](https://ellmer.tidyverse.org/) - the official guide to calling language models from R, including structured output.

=== step === complete
## Lesson 3 complete

You toured the modern R toolchain and, more importantly, the four jobs it is organized around. **Positron** is the editor that runs R and Python side by side. **httr2** and **jsonlite** bring data in from web APIs; **arrow** reads files too big to open. **duckdb** queries millions of rows with plain SQL without loading them. And **ellmer** brings a language model into R for the fuzzy, language-shaped work, as a draft you verify, never as gospel. All of it sits on the portable, reproducible project you built in Lessons 1 and 2.

Next, Lesson 4: **The Capstone, a reproducible analysis.** You will tie the whole course together in one project that imports, tidies, analyzes and reports, reproducibly from start to finish, using exactly the workflow you have built up lesson by lesson.
