---
title: "Joining and Reshaping Data in R: Quiz"
description: "A short, graded check on the Joining and Reshaping Data in R section."
keywords: "R quiz, data analyst, da-joins, practice"
post_type: "LESSON"
curriculum_id: "2.2.5"
webr: true
lesson_access: "free"
course_id: "da-joins"
course_title: "Joining and Reshaping Data in R"
course_lesson: "5"
course_total: "5"
course_landing: "Join-Reshape-Course.html"
lesson_kind: "quiz"
course_prev: "Nest-Unnest-and-Rectangling.html"
course_next: ""
catalog_blurb: "Check what stuck before you move on."
---

=== step === cover
::eyebrow Check your understanding
## Quiz
You have finished the join-and-reshape section: every join type, pivoting long and wide, splitting and uniting columns, and fuzzy matching. This quiz checks what stuck. The last two steps are live R.

=== step === quiz
::eyebrow Question 1 of 8
## A left join with no match
You run `left_join(customers, orders, by = "id")`. A customer who has placed no orders will:
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Be dropped from the result. ::no A left join keeps every row of the left table.
- Appear once, with NA in the order columns. ::ok Correct: the left table is kept in full, with NA where the right side has no match.
- Cause an error. ::no Unmatched rows are allowed; they simply get NA.
- Be duplicated across every other customer. ::no A join matches on the key, it is not a cross product.

=== step === quiz
::eyebrow Question 2 of 8
## When keys repeat
The join key appears three times in the right table. A matching row from the left table becomes:
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- One row, the first match only. ::no Every match produces a row.
- Three rows, one per match. ::ok Right: a one-to-many join multiplies the left row across its matches.
- An error. ::no Repeated keys are allowed.
- Zero rows. ::no It does match, three times.

=== step === quiz
::eyebrow Question 3 of 8
## Long from wide
A table has columns `q1`, `q2`, `q3`, `q4` holding quarterly sales. To get a `quarter` column and a `sales` column, you use:
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- `pivot_wider`, to spread them out. ::no Wider goes the other way, from long to wide.
- `pivot_longer`, to stack those columns into rows. ::ok Yes: longer gathers the quarter columns into name and value pairs.
- `separate`, to split a column. ::no `separate` splits one column on a delimiter.
- A join. ::no No second table is involved.

=== step === quiz
::eyebrow Question 4 of 8
## When to widen
`pivot_wider` is the right move when you want to:
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Make a tidy table even tidier. ::no Wider usually makes data wider for presentation, not tidier.
- Turn one row per (id, metric) into one column per metric. ::ok Correct: wider spreads a name column into several columns.
- Combine two tables on a key. ::no That is a join.
- Drop rows with missing values. ::no Unrelated to reshaping.

=== step === quiz
::eyebrow Question 5 of 8
## Split a column
A `period` column holds values like `2024-03`. To break it into `year` and `month` columns, you use:
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- `unite`, to combine them. ::no `unite` joins columns; here you want to split one.
- `separate`, on the `-` delimiter. ::ok Right: `separate` splits one column into several on a delimiter.
- `pivot_longer`. ::no That reshapes columns into rows.
- A join. ::no No second table is needed.

=== step === quiz
::eyebrow Question 6 of 8
## Keys that nearly match
Two tables hold company names like `Acme Inc` and `Acme, Inc.`. A plain join on the name will:
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Match them, because they are similar. ::no Exact joins need identical keys.
- Miss them, because the keys differ; clean or fuzzy-match first. ::ok Correct: standardize the names or use a fuzzy match.
- Throw an error. ::no It just produces no match for those rows.
- Duplicate them. ::no No match means no duplication.

=== step === concept
::eyebrow Run it: a left join
## Joining two tables
Run this left join. `Cy` has placed no order, so watch the order columns fill with NA.

```r
library(dplyr)

customers <- tibble(id = 1:3, name = c("Ana", "Ben", "Cy"))
orders <- tibble(id = c(1, 1, 2), item = c("pen", "ink", "mug"))

left_join(customers, orders, by = "id")
```

Every customer is kept; Cy gets NA because there is no matching order.

=== step === concept
::eyebrow Run it: pivot longer
## Reshaping wide to long
Run this to stack the quarter columns into tidy rows, then add a `q3` column and run again.

```r
library(dplyr)
library(tidyr)

sales <- tibble(store = c("A", "B"), q1 = c(10, 20), q2 = c(15, 25))

pivot_longer(sales, q1:q2, names_to = "quarter", values_to = "sales")
```

Each store now has one row per quarter: the long, tidy shape most analysis wants.

=== step === complete
## Section complete
Nice work. You can join tables of any cardinality, reshape between long and wide, split and unite columns, and handle keys that do not line up exactly. Next: exploratory data analysis.
