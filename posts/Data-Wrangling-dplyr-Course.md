---
title: "Data Wrangling with dplyr: A Hands-On Interactive Course"
slug: "Data-Wrangling-dplyr-Course"
description: "Learn data wrangling in R from the ground up in three interactive lessons: import and tidy data, the core dplyr verbs, and grouped summaries with honest missing-value handling."
keywords: "dplyr course, data wrangling R, tidy data, read_csv, dplyr verbs, group_by summarise, tidyverse, interactive"
mathjax: false
webr: false
date: "2026-06-25"
curriculum_id: "2.1.0"
post_type: "C"
sidebar_section: "Data Wrangling"
sidebar_title: "Data Wrangling with dplyr (Course)"
sidebar_order: "5"
---

# Data Wrangling with dplyr: A Hands-On Interactive Course

<p class="lead">Most of real analysis is wrangling: getting messy data in and bending it into a shape you can actually work with. This three-lesson interactive course teaches data wrangling in R from scratch, with the tidyverse, one small real-feeling dataset carried the whole way through.</p>

Tutorials usually start at "call this function." This course starts one level deeper, with what a CSV actually is and what makes a table tidy, and builds up until you can filter, derive, group and summarise data with confidence and know exactly why each step is there.

Each lesson is a guided, interactive experience: you transform live tables in the browser, answer checkpoints, and write R as you go.

## The three lessons

### Lesson 1: Import a CSV and make it tidy

Read a real CSV into R with `read_csv()`, check the column types it picked, and fix the single most common import snag: a number column read as text. Then the three rules of tidy data and a live demo of one messy table becoming tidy.

[Start Lesson 1: Importing and tidy data](Importing-and-Tidy-Data-in-R.html)

### Lesson 2: The core dplyr verbs

The verbs that do the everyday work, on one running data frame: `filter()` to keep rows, `select()` to keep columns, `mutate()` to derive new ones, and `arrange()`, `distinct()` and `count()` to order, dedupe and tally. The pipe chains them into a sentence you can read aloud.

[Start Lesson 2: The dplyr verbs](The-dplyr-Verbs.html)

### Lesson 3: Group, summarise and clean

Split-apply-combine with `group_by()` and `summarise()`, deriving categories with `case_when()`, and handling missing values honestly, knowing when to drop and when to impute. Ends with the path to your Data Analyst certificate.

[Start Lesson 3: Group, summarise and clean](Group-Summarise-and-Clean-in-dplyr.html)

## Who this is for

You can run R and load a package with `library()`. You do not need any prior data-wrangling or tidyverse experience. By the end you will be able to take a raw file and turn it into a clean, tidy, summarised table ready for plotting or modelling.

## What you will be able to do

- Read a CSV into R, check its column types, and fix a number column read as text
- State the three rules of tidy data and reshape a messy table to obey them
- Filter rows, select and derive columns, and chain steps with the pipe
- Group a table and compute summaries, derive categories, and handle missing values honestly

Ready? [Begin with Lesson 1](Importing-and-Tidy-Data-in-R.html).
