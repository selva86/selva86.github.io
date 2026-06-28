---
title: "Data Wrangling with dplyr: Section Quiz"
description: "A short, graded check on the dplyr section: tidy data, the core verbs, grouped summaries, case_when, and missing values."
keywords: "dplyr quiz, tidy data, filter, mutate, group_by, summarise, case_when, missing values, R practice"
post_type: "LESSON"
curriculum_id: "2.1.5"
webr: true
lesson_access: "free"
course_id: "da-dplyr"
course_title: "Data Wrangling with dplyr"
course_lesson: "5"
course_total: "5"
course_landing: "Data-Wrangling-dplyr-Course.html"
lesson_kind: "quiz"
course_prev: "Missing-Value-Treatment.html"
course_next: ""
catalog_blurb: "Check what stuck before you move on."
---

=== step === cover
::eyebrow Section quiz
## Section Quiz
You have finished the dplyr section: reading and tidying data, the core verbs, grouped summaries, and missing values. This short quiz checks what stuck. Answer each question to continue; you can retry until you get it. Two of the questions ask you to write a line of R and run it.

=== step === quiz
::eyebrow Question 1 of 8
## Spotting untidy data
A sales table has one column per month, `Jan`, `Feb`, and `Mar`, each holding that month's revenue. By the rules of tidy data, what is the issue?
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Nothing, one column per month is already tidy. ::no Month is a variable here, so its values belong in a single column rather than split across headers.
- "Month" is a variable, but it is spread across column headers instead of living in one column. ::ok Right. You would reshape those three columns into a `month` column and a `revenue` column.
- The table simply has too many columns to be tidy. ::no Tidiness is about structure, not how many columns there are.
- Revenue should be split into one column per region. ::no That would make the table less tidy, not more.

=== step === quiz
::eyebrow Question 2 of 8
## A number that imports as text
You read a CSV and a `price` column arrives as text instead of a number. What is the most likely cause?
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- The column contains non-numeric characters, such as a currency sign or thousands separators. ::ok Yes. A single stray symbol in the column is enough for the reader to treat the whole column as text.
- CSV files can only ever store text. ::no A CSV is text on disk, but the reader infers types like numbers and dates as it loads.
- The column has too many rows. ::no The number of rows has no effect on the detected type.
- Numeric columns always import as text by default. ::no A clean numeric column imports as a number.

=== step === quiz
::eyebrow Question 3 of 8
## The right verb for the job
You want to keep only the rows for the North region, with every column intact. Which verb does that?
::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- `select`, because you are choosing the data you want. ::no `select` chooses columns, not rows.
- `arrange`, to bring the North rows to the top. ::no `arrange` only reorders rows; it does not drop the others.
- `filter`, with a condition on the region column. ::ok Correct. `filter` keeps the rows that meet a condition and leaves the columns untouched.
- `summarise`, to reduce the table to North. ::no `summarise` collapses rows into a summary, it does not subset them.

=== step === quiz
::eyebrow Question 4 of 8
## mutate or transmute
What is the difference between `mutate()` and `transmute()`?
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- They are identical. ::no They differ in what they keep.
- `mutate` adds new columns while keeping the existing ones; `transmute` returns only the new columns. ::ok Exactly. Reach for `transmute` when you want just the derived columns and nothing else.
- `mutate` deletes columns; `transmute` adds them. ::no `mutate` adds or overwrites; it does not drop columns.
- `mutate` works only on numeric columns. ::no It works on columns of any type.

=== step === quiz
::eyebrow Question 5 of 8
## What a grouped summary returns
You run `group_by(region, quarter)` and then `summarise(total = sum(sales))`. What does each row of the result represent?
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- One row for each region-and-quarter combination present in the data. ::ok Right. Grouping by two variables summarises every observed combination of them.
- One row per region, ignoring quarter. ::no Both grouping variables are kept, so each region is split by quarter.
- A single row for the whole dataset. ::no That is what you get from `summarise` with no grouping.
- One row for each original row of `sales`. ::no `summarise` collapses each group down to one row.

=== step === quiz
::eyebrow Question 6 of 8
## How case_when resolves ties
Inside `case_when()`, a row satisfies two of your conditions at once. Which result does that row get?
::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- A random choice between the two. ::no The outcome is deterministic, not random.
- Both results, producing two rows. ::no `case_when` returns exactly one value per row.
- The result of the first matching condition, read top to bottom. ::ok Correct. Order matters, so put your most specific conditions first.
- An error, because the conditions overlap. ::no Overlap is allowed; the first match simply wins.

=== step === tryit
::eyebrow Question 7 of 8
## Write it: filter rows
Using the built-in `mtcars`, keep only the cars with `mpg` of at least 25. Fill in the blank and run it.
```r
library(dplyr)
mtcars %>%
  filter(___)
```
::check {"regex": "filter.*mpg.*>=?\\s*2[45]", "gate": true, "difficulty": "intermediate", "ok": "Nicely done. filter keeps the rows that meet your condition.", "no": "Filter on mpg, for example filter(mpg >= 25)."}
::solution
```r
library(dplyr)
mtcars %>%
  filter(mpg >= 25)
```

=== step === tryit
::eyebrow Question 8 of 8
## Write it: summarise by group
Still using `mtcars`, find the average `mpg` for each value of `cyl`. The grouping is done for you; add the summary.
```r
library(dplyr)
mtcars %>%
  group_by(cyl) %>%
  ___
```
::check {"regex": "summari[sz]e", "gate": true, "difficulty": "intermediate", "ok": "That is the group-then-summarise pattern at work.", "no": "After group_by(cyl), use summarise() to compute mean(mpg)."}
::solution
```r
library(dplyr)
mtcars %>%
  group_by(cyl) %>%
  summarise(avg_mpg = mean(mpg))
```

=== step === complete
## Section complete
Strong work. You can read a file in and tidy it, reshape a table with the core verbs, summarise it by group, derive columns with `case_when`, and handle missing values with care. Next up: joining and reshaping data of any shape.
