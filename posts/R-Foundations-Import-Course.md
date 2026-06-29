---
title: "R Foundations: Importing Data, A Hands-On Interactive Course"
slug: "R-Foundations-Import-Course"
description: "Get real data into R from the ground up in five interactive lessons: read CSV and delimited files, Excel and stats formats, JSON and web data, databases, and exporting."
keywords: "import data in R, read csv in R, readr, read excel in R, readxl, haven, jsonlite, rvest, DBI, dbplyr, arrow parquet, write_csv, saveRDS, interactive R course"
mathjax: false
webr: false
date: "2026-06-29"
curriculum_id: "1.4.0"
post_type: "C"
sidebar_section: "Learn R"
sidebar_title: "R Foundations: Importing Data (Course)"
sidebar_order: "13"
---

# R Foundations: Importing Data, A Hands-On Interactive Course

<p class="lead">Every analysis starts the same way: get the data into R, with every column the right type. This five-lesson interactive course teaches how to read data of any kind, from a plain CSV to an Excel workbook, a web API, or a database, with live code you run as you learn.</p>

Reading a file sounds trivial until a date arrives as text, a number arrives with a dollar sign, or the file is too big to open. This course builds the skill in the order you actually meet these problems, starting with the everyday CSV and ending with databases and large files. Every lesson grounds one format in a single running example, so nothing stays abstract.

Each lesson is a guided, interactive experience: you run R right in the page, answer checkpoints, and write code as you go. No setup, no installs.

## The five lessons

### Lesson 1: Reading CSV and Delimited Files

Read a CSV in a single line with readr, then take control of the column **types** R assigns, override a wrong guess, diagnose and fix parsing problems and missing-value codes, and read files that use semicolons, tabs, or any other delimiter.

[Start Lesson 1: Reading CSV and Delimited Files](Reading-CSV-and-Delimited-Files.html)

### Lesson 2: Reading Excel and Other Formats

Read Excel workbooks with readxl, choosing the sheet and cell range you want, and open the formats other tools save in: SPSS, Stata and SAS files with haven, keeping their labels intact.

[Start Lesson 2: Reading Excel and Other Formats](Reading-Excel-and-Other-Formats.html)

### Lesson 3: JSON and Web Data

Pull JSON straight from an API with jsonlite and turn its nested structure into a flat data frame, then scrape a table off an HTML page with rvest when no download exists.

[Start Lesson 3: JSON and Web Data](JSON-and-Web-Data.html)

### Lesson 4: Databases and Big Files

Query a database from R with DBI and dbplyr so the database does the heavy lifting, read fast columnar Parquet files with arrow, and handle text encodings and files that are larger than memory.

[Start Lesson 4: Databases and Big Files](Databases-and-Big-Files.html)

### Lesson 5: Saving and Exporting Data

Write your results back out with write_csv, saveRDS and writexl, and learn which format to choose so the next person, or the next you, can pick the work straight back up.

[Start Lesson 5: Saving and Exporting Data](Saving-and-Exporting-Data.html)

## Who this is for

You can open R and load a package with `library()`, and that is enough. You do not need any prior experience wrangling data files. By the end you will be able to bring almost any dataset into R cleanly and hand your results back out in the right shape.

## What you will be able to do

- Read CSV and delimited files with readr, and set or fix the type of every column
- Diagnose and repair parsing problems and missing-value codes instead of guessing
- Open Excel, SPSS, Stata and SAS files, and pull data from JSON APIs and web pages
- Query databases and read large columnar files without running out of memory
- Export your results to the right format and choose it deliberately

This course is part of the free New to R foundations track.

Ready? [Begin with Lesson 1: Reading CSV and Delimited Files](Reading-CSV-and-Delimited-Files.html).
