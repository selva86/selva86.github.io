---
title: "Report-Ready Tables in R: Quiz"
description: "A short, graded check on the Report-Ready Tables in R section."
keywords: "R quiz, data analyst, da-tables, practice"
post_type: "LESSON"
curriculum_id: "2.7.3"
webr: true
lesson_access: "free"
course_id: "da-tables"
course_title: "Report-Ready Tables in R"
course_lesson: "3"
course_total: "3"
course_landing: "Report-Tables-Course.html"
lesson_kind: "quiz"
course_prev: "Summary-Tables-and-Number-Formatting.html"
course_next: ""
catalog_blurb: "Check what stuck before you move on."
---

=== step === cover
::eyebrow Check your understanding
## Quiz
You have finished the tables section: presentation-ready tables and well-formatted summaries. This quiz checks what stuck. The last two steps are live R.

=== step === quiz
::eyebrow Question 1 of 8
## Table or chart
A table is a better choice than a chart when:
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Exact values matter and there are only a handful of numbers. ::ok Correct: tables are for precise lookup of a few values.
- You want to show a trend over time. ::no A line chart reads a trend far better.
- You have thousands of rows to show at once. ::no A chart or summary serves large data better.
- Never; charts are always better. ::no Tables win whenever exact numbers matter.

=== step === quiz
::eyebrow Question 2 of 8
## What gtsummary is for
`gtsummary` is especially handy for:
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Drawing interactive maps. ::no That is leaflet, not gtsummary.
- Building summary and regression tables straight from data or a model. ::ok Correct: it automates the common reporting tables.
- Reshaping data long to wide. ::no That is tidyr.
- Reading Excel files. ::no That is readxl.

=== step === quiz
::eyebrow Question 3 of 8
## Why format numbers
Formatting numbers (1,234 or 12%) before publishing matters because:
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- It makes them quick and unambiguous for the reader. ::ok Correct: formatting is about readability for the audience.
- It changes the underlying values. ::no Formatting changes display, not the data.
- It makes the table run faster. ::no Formatting has no effect on speed.
- It is required by R. ::no R is happy with raw numbers; formatting is for people.

=== step === quiz
::eyebrow Question 4 of 8
## Aligning a number column
Numbers in a table column read best when they are:
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Left-aligned, like text. ::no Numbers are hard to compare left-aligned.
- Right- or decimal-aligned, so place values line up. ::ok Correct: aligned decimals make magnitudes easy to scan.
- Centred. ::no Centring scatters the decimal points.
- In a random order. ::no Order and alignment both matter for tables.

=== step === quiz
::eyebrow Question 5 of 8
## Choosing precision
Reporting `3.14159` as `3.14` is good practice because:
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- You should round to a precision that is meaningful to the reader. ::ok Correct: excess digits imply false precision.
- More decimals are always better. ::no Too many digits clutter and mislead.
- R cannot display long decimals. ::no R can; the choice is editorial.
- Rounding makes it more accurate. ::no Rounding trades detail for clarity, not accuracy.

=== step === quiz
::eyebrow Question 6 of 8
## What gt and flextable produce
`gt` and `flextable` are used to make:
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Presentation-ready tables for HTML, Word, or PDF reports. ::ok Correct: they are the polished-table packages.
- Interactive dashboards. ::no That is shiny or Quarto dashboards.
- Statistical models. ::no They display results, they do not fit models.
- Database connections. ::no That is DBI.

=== step === concept
::eyebrow Run it: the data behind a table
## Build a summary to tabulate
Run this to compute the counts and average mileage per cylinder count, the rows a report table would show.

```r
library(dplyr)

mtcars %>%
  group_by(cyl) %>%
  summarise(n = n(), mean_mpg = round(mean(mpg), 1))
```

This tidy summary is exactly what you would hand to gt or flextable to format for a report.

=== step === concept
::eyebrow Run it: format numbers
## Making numbers readable
Run this to format a large number with thousands separators and round another to two decimals.

```r
format(1234567.89, big.mark = ",", nsmall = 2)

round(3.14159, 2)
```

Formatting is the last mile: same values, far easier for a reader to take in.

=== step === complete
## Section complete
Strong work. You can turn an analysis into clean, well-formatted tables ready for a report. Next: interactive output and dashboards.
