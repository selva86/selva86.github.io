---
title: "R Foundations: Strings, Dates & Factors, A Hands-On Interactive Course"
slug: "R-Foundations-Strings-Course"
description: "Work with text, dates and categories in R across four interactive lessons: clean strings with stringr, match patterns with regex, handle dates with lubridate, and order factors with forcats."
keywords: "stringr, regular expressions in R, regex, lubridate, dates and times in R, forcats, factors in R, str_detect, str_replace, parse dates, time zones, interactive R course"
mathjax: false
webr: false
date: "2026-06-29"
curriculum_id: "1.5.0"
post_type: "C"
sidebar_section: "Learn R"
sidebar_title: "R Foundations: Strings, Dates & Factors (Course)"
sidebar_order: "14"
---

# R Foundations: Strings, Dates & Factors, A Hands-On Interactive Course

<p class="lead">Real datasets are full of text that was typed by hand, dates that arrive as plain strings, and categories that refuse to sort the way you want. This four-lesson interactive course teaches the three tidyverse toolkits that tame them, stringr, regular expressions, lubridate and forcats, with live code you run as you learn.</p>

Numbers are the easy part of a dataset. The hard part is everything around them: a name with stray spaces and random capitals, a date stored as `"2026-06-29"` that R thinks is text, a survey answer that sorts alphabetically when you meant Low, Medium, High. This course builds the skills to fix each of those, in the order you actually meet them, every idea grounded in a single running example so nothing stays abstract.

Each lesson is a guided, interactive experience: you run R right in the page, answer checkpoints, and write code as you go. No setup, no installs.

## The four lessons

### Lesson 1: Strings with stringr

Measure, trim and case-fix messy text, then detect, replace, extract and join it with the consistent **stringr** verbs. You take a hand-typed workshop sign-up sheet, stray spaces and shouting and all, and turn it into clean, usable data one verb at a time.

[Start Lesson 1: Strings with stringr](Strings-with-stringr.html)

### Lesson 2: Regular Expressions

Build a pattern from scratch and see exactly what it matches, then use it to find, extract and replace the parts of text that vary. Regular expressions are the engine underneath every serious text task, and this lesson makes them readable instead of cryptic.

[Start Lesson 2: Regular Expressions](Regular-Expressions-in-R.html)

### Lesson 3: Dates and Times

Parse dates and times with **lubridate**, do arithmetic on them safely, and work correctly across time zones so day boundaries and daylight saving never quietly corrupt a result. Dates look simple and bite hard; this lesson covers where they go wrong.

[Start Lesson 3: Dates and Times](Dates-and-Times-in-R.html)

### Lesson 4: Factors with forcats

Turn text categories into ordered **factors** and create, reorder and relabel them with **forcats**, so your summaries and charts come out in the order you mean rather than in alphabetical order R picks by default.

[Start Lesson 4: Factors with forcats](Factors-with-forcats.html)

## Who this is for

You can open R and load a package with `library()`, and you have met vectors and the character type. You do not need any prior experience with text, dates or factors. By the end you will be able to clean and reshape messy text, match patterns with regular expressions, compute with dates across time zones, and put categories in the order you want.

## What you will be able to do

- Measure, clean and reshape text with the stringr verbs: detect, replace, extract and join
- Write regular expressions to find and pull out the parts of text that vary
- Parse dates and times with lubridate and do arithmetic across time zones safely
- Create, reorder and relabel factors with forcats so categories sort the way you mean
- Choose the right tool for each kind of messy, real-world column

This course is part of the free New to R foundations track.

Ready? [Begin with Lesson 1: Strings with stringr](Strings-with-stringr.html).
