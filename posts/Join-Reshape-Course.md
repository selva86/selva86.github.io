---
title: "Join and Reshape Data in R: A Hands-On Interactive Course"
slug: "Join-Reshape-Course"
description: "Combine and reshape any dataset in four interactive lessons: every join type, pivoting long and wide, splitting and fuzzy-matching messy columns, and rectangling nested data."
keywords: "R joins, dplyr joins, pivot_longer, pivot_wider, tidyr, nest unnest, fuzzy join, reshape data in R, interactive R course"
mathjax: false
webr: false
date: "2026-06-28"
curriculum_id: "2.2.0"
post_type: "C"
sidebar_section: "Data Wrangling"
sidebar_title: "Join & Reshape (Course)"
sidebar_order: "3"
---

# Join and Reshape Data in R: A Hands-On Interactive Course

<p class="lead">Real analysis almost never starts with one tidy table. This four-lesson interactive course teaches you to combine and reshape data of any shape: join keyed tables, pivot between long and wide, clean and match messy columns, and rectangle nested data into tidy rows.</p>

This course picks up where [Data Wrangling with dplyr](Data-Wrangling-dplyr-Course.html) leaves off. You can already filter, select and summarise one table; here you learn the moves that turn many awkward tables into the single, tidy frame that every chart and model wants.

Each lesson is a guided, interactive experience: you build the result step by step in the browser, answer checkpoints, and write R as you go.

## The four lessons

### Lesson 1: Joining tables

Combine two keyed tables and understand exactly what happens to the rows: the **mutating joins** (inner, left, right, full) and unmatched rows, the **filtering joins** (semi, anti), and when you need **non-equi and rolling joins** with `join_by()`.

[Start Lesson 1: Joining tables](Joining-Tables-in-R.html)

### Lesson 2: Pivoting long and wide

Reshape with **`pivot_longer()`** and **`pivot_wider()`**, and learn why long, tidy shape is what ggplot and models expect, and when wide is the right format for a report.

[Start Lesson 2: Pivoting long and wide](Pivoting-Long-and-Wide-in-R.html)

### Lesson 3: Splitting, uniting and fuzzy joins

Clean columns by splitting and uniting them (**`separate()`** / **`unite()`**), and join keys that do not match exactly with **fuzzy matching**, the everyday reality of real-world data.

[Start Lesson 3: Splitting, uniting and fuzzy joins](Splitting-Uniting-and-Fuzzy-Joins.html)

### Lesson 4: Nest, unnest and rectangling

Treat a column as a column of tables: **`nest()`** to pack each group into a list-column, map a summary or model over each, then **`unnest()`** back, and rectangle awkward nested or JSON-like data into tidy rows.

[Start Lesson 4: Nest, unnest and rectangling](Nest-Unnest-and-Rectangling.html)

## Who this is for

You can already build a dplyr pipeline on a single table (filter, select, mutate, summarise). You do not need any prior experience with joins, pivoting or nested data. By the end you will be able to take a pile of related, messy tables and turn them into one clean, analysis-ready frame.

## What you will be able to do

- Combine tables with every join type, and predict exactly which rows survive
- Reshape between long and wide on purpose, and know which shape each task needs
- Split, unite and fuzzy-match messy columns and keys
- Rectangle nested and list-column data into tidy rows

Ready? [Begin with Lesson 1](Joining-Tables-in-R.html).
