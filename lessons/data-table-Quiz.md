---
title: "Fast Data Wrangling with data.table: Quiz"
description: "A short, graded check on the Fast Data Wrangling with data.table section."
keywords: "R quiz, data analyst, da-datatable, practice"
post_type: "LESSON"
curriculum_id: "2.6.5"
webr: true
lesson_access: "free"
course_id: "da-datatable"
course_title: "Fast Data Wrangling with data.table"
course_lesson: "5"
course_total: "5"
course_landing: "data-table-Course.html"
lesson_kind: "quiz"
course_prev: "Bridge-with-dtplyr.html"
course_next: ""
catalog_blurb: "Check what stuck before you move on."
---

=== step === cover
::eyebrow Check your understanding
## Quiz
You have finished the data.table section: its syntax and keys, how it compares with dplyr, bigger-than-memory data, and dtplyr. This quiz checks what stuck. The last two steps are live R.

=== step === quiz
::eyebrow Question 1 of 8
## The data.table template
In the `DT[i, j, by]` template, the `j` slot is for:
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The rows to keep. ::no That is `i`, the first slot.
- The columns or expressions to compute or select. ::ok Correct: j says what to do with the columns.
- The grouping variable. ::no That is `by`, the third slot.
- The file to read. ::no data.table syntax has no file slot.

=== step === quiz
::eyebrow Question 2 of 8
## What a key buys you
Calling `setkey(DT, id)` does what?
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Sorts the table by id and enables fast lookups and joins on it. ::ok Correct: a key sorts once for repeated fast access.
- Deletes duplicate ids. ::no It sorts, it does not deduplicate.
- Renames the column to "key". ::no The column name is unchanged.
- Encrypts the table. ::no Keys are about speed, not security.

=== step === quiz
::eyebrow Question 3 of 8
## When data.table earns its keep
data.table is the strongest choice when:
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- You have a few dozen rows. ::no Any tool is fine at that size.
- The data is large and speed or memory matters. ::ok Correct: that is where its efficiency pays off.
- You only ever read data, never transform it. ::no Its strength is fast transformation.
- You need interactive web charts. ::no That is a visualization concern, unrelated.

=== step === quiz
::eyebrow Question 4 of 8
## Grouped compute
`DT[, mean(hp), by = cyl]` returns:
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- The mean of hp for each value of cyl. ::ok Correct: by computes j per group.
- The mean of every column. ::no Only hp is computed here.
- One row for the whole table. ::no Grouping splits it per cyl.
- An error. ::no This is standard data.table syntax.

=== step === quiz
::eyebrow Question 5 of 8
## Beyond memory
For a dataset larger than your computer’s RAM, the right approach is:
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Load it all with read.csv and hope. ::no It will not fit in memory.
- Use an out-of-memory engine such as duckdb or arrow. ::ok Correct: they query data on disk without loading it all.
- Delete most of the columns first by hand. ::no Not feasible or general; use an engine built for it.
- Switch to a slower language. ::no The tool, not the language, is the fix.

=== step === quiz
::eyebrow Question 6 of 8
## What dtplyr gives you
dtplyr lets you:
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Write familiar dplyr code that runs on data.table underneath. ::ok Correct: dplyr syntax, data.table speed.
- Convert data.table code to SQL. ::no That is dbplyr, and a different goal.
- Make ggplot2 faster. ::no It is about wrangling, not plotting.
- Replace data.table entirely. ::no It bridges the two; it does not replace either.

=== step === concept
::eyebrow Run it: data.table syntax
## Filter, compute, group in one step
Run this. It keeps high-mileage cars, then averages horsepower per cylinder count, all in one bracket.

```r
library(data.table)

dt <- as.data.table(mtcars)
dt[mpg > 20, .(mean_hp = mean(hp)), by = cyl]
```

i filters, j computes mean_hp, by groups: the whole DT[i, j, by] template in action.

=== step === concept
::eyebrow Run it: the dplyr equivalent
## The same answer, dplyr style
Run the dplyr version of the same query and compare the result with the data.table one above.

```r
library(dplyr)

mtcars %>%
  filter(mpg > 20) %>%
  group_by(cyl) %>%
  summarise(mean_hp = mean(hp))
```

Same answer, different style: pick data.table for speed at scale, dplyr for readability.

=== step === complete
## Section complete
Strong work. You can wrangle large tables fast with data.table, choose between it and dplyr, and reach for an out-of-memory engine when needed. Next: report-ready tables.
