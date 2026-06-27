---
title: "Fast Data Wrangling with data.table: Interactive Course"
slug: "data-table-Course"
description: "Learn data.table in R in three interactive lessons: the DT[i, j, by] syntax and keys, data.table versus dplyr head to head, and wrangling bigger-than-memory data."
keywords: "data.table, data.table in R, DT i j by, setkey, data.table keys, data.table vs dplyr, dtplyr, duckdb, bigger than memory data, data.table course, interactive"
mathjax: false
webr: false
date: "2026-06-27"
curriculum_id: "2.6.0"
post_type: "C"
sidebar_section: "Data Wrangling"
sidebar_title: "data.table (Course)"
sidebar_order: "8"
---

# Fast Data Wrangling with data.table: A Hands-On Interactive Course

<p class="lead">When a tidy dplyr pipeline that felt instant on a small dataset starts to crawl on millions of rows, data.table is R's answer. This three-lesson interactive course teaches its compact one-bracket grammar from scratch, shows you exactly when it beats dplyr, and takes you all the way to data that does not fit in memory.</p>

data.table does the same filtering, computing and grouping you already know, written in a single `DT[i, j, by]` bracket and engineered to fly. This course builds that fluency step by step: first the grammar and the keys that make lookups and joins near-instant, then a head-to-head against dplyr so you know which tool to reach for, and finally the techniques for wrangling data far larger than your machine's RAM.

Each lesson is a guided, interactive experience: you run live R in the browser, answer checkpoints as you go, and see each idea on real data before you write it yourself.

## The three lessons

### Lesson 1: The DT[i, j, by] syntax and keys

Read the `DT[i, j, by]` grammar and name what each slot does: filter rows in `i`, compute and select columns in `j`, and aggregate per group with `by`. Then set a **key** with `setkey()` to turn slow scans into near-instant lookups and joins, and learn how data.table modifies in place to save time and memory.

[Start Lesson 1: The DT[i, j, by] syntax and keys](data-table-Syntax-and-Keys.html)

### Lesson 2: data.table vs dplyr, head to head

The same task written both ways, side by side, so the trade-offs are concrete: the speed and memory differences on large data, when each style reads more clearly, and how to bridge the two with **dtplyr** so you can keep dplyr syntax and get data.table speed underneath.

Lesson 2 is coming soon.

### Lesson 3: Bigger-than-memory data

What to do when the data does not fit in RAM at all: wrangle millions of rows efficiently, and query on-disk datasets with **duckdb** and **duckplyr** without loading everything into memory first.

Lesson 3 is coming soon.

## Who this is for

You can already filter, mutate and summarise a data frame (in base R or dplyr) and you have hit, or expect to hit, a dataset big enough that speed and memory start to matter. You do not need any prior data.table experience. By the end you will reach for the right tool with confidence, whether the data is a thousand rows or a hundred million.

## What you will be able to do

- Read and write the `DT[i, j, by]` grammar to filter, compute and group in one compact bracket
- Set keys to make lookups and joins near-instant, and update columns by reference without copying
- Choose between data.table and dplyr for a given task, and bridge them with dtplyr
- Wrangle data that is bigger than memory using duckdb and duckplyr

Ready? [Begin with Lesson 1](data-table-Syntax-and-Keys.html).
