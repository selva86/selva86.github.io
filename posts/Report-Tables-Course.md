---
title: "Report-Ready Tables in R: Interactive Course"
slug: "Report-Tables-Course"
description: "Learn report-ready tables in R: turn a data frame into a polished table with gt, flextable and kableExtra, then build summary tables and format numbers cleanly."
keywords: "report tables in R, gt package, flextable, kableExtra, gtsummary, format numbers in R, summary tables, presentation tables, gt course, interactive R course"
mathjax: false
webr: false
date: "2026-06-27"
curriculum_id: "2.7.0"
post_type: "C"
sidebar_section: "Data Wrangling"
sidebar_title: "Report-Ready Tables (Course)"
sidebar_order: "9"
---

# Report-Ready Tables in R: A Hands-On Interactive Course

<p class="lead">A correct data frame and a table you can hand to a client are two different things. This interactive course teaches you to turn raw R output into presentation-ready tables: titled, labelled, with currency, percentages and clean number formatting, using gt, flextable, kableExtra and gtsummary.</p>

The numbers in your analysis are only as useful as the table that carries them. A monospaced printout with `0.62` where you mean 62% and column names like `margin` reads like a debugging session, not a report. This course closes that gap. You will build report tables from data frames step by step, format every kind of number a reader expects, and pick the right tool for where the table will finally live: a web page, a Word document, or a knitted report.

Each lesson is a guided, interactive experience: you run live R in the browser, answer checkpoints as you go, and see each idea on real data before you write it yourself.

## The two lessons

### Lesson 1: From data frame to report table

Turn a raw data frame into a presentation-ready table with **gt**: a title, human column labels, and a source note. Format the numbers that matter, currency, percentages and thousands separators, shape the data first so the table tells a story, and learn when to reach for **flextable** (Word and PowerPoint) or **kableExtra** (HTML reports) instead.

[Start Lesson 1: From data frame to report table](Report-Tables-with-gt-and-flextable.html)

### Lesson 2: Summary tables and number formatting

Build one-line summary tables and regression tables with **gtsummary**, and master the formatting details that make a table read cleanly: numbers, percentages and units, rounding that is consistent across a column, and alignment that lets a reader scan down a figure.

Lesson 2 is coming soon.

## Who this is for

You can already load a package with `library()` and wrangle a data frame with dplyr (`filter`, `mutate`, `arrange`). You do not need any prior experience with gt or table packages. By the end you will turn any analysis into a table a reader can act on, and know which package fits the document you are building.

## What you will be able to do

- Build a report-ready table from a data frame with gt: title, human labels, and a source note
- Format currency, percentages and thousands separators so numbers read the way a reader expects
- Shape the data first, sorting and adding share columns, so the table tells a story
- Choose between gt, flextable and kableExtra for web, Word and knitted reports
- Build summary and regression tables with gtsummary

Ready? [Begin with Lesson 1](Report-Tables-with-gt-and-flextable.html).
