---
title: "Lists, Data Frames and Tibbles: Quiz"
description: "A short, graded check on R's data structures: lists and the difference between [ and [[, data frames, tibbles, str, matrices, and deliberate type conversion."
keywords: "R quiz, R lists, data frame, tibble, str, matrix, as.numeric, single vs double bracket, R practice"
post_type: "LESSON"
curriculum_id: "1.2.6"
webr: true
lesson_access: "free"
track: "foundations"
course_id: "nr-structures"
course_title: "R Foundations: Data Structures"
course_lesson: "6"
course_total: "6"
course_landing: "R-Foundations-Structures-Course.html"
lesson_kind: "quiz"
course_prev: "Type-Conversion-in-Practice.html"
course_next: ""
catalog_blurb: "Check what stuck before you move on."
---

=== step === cover
::eyebrow Check your understanding
## Quiz
You have finished the structures section: lists and nested data, data frames and tibbles, inspecting an object with `str()`, matrices and arrays, and converting a column's type on purpose. This short quiz checks what stuck. Pick an answer to continue; you can retry until it clicks. The last two steps are live R, run them and tinker.

=== step === quiz
::eyebrow Question 1 of 8
## Single bracket, double bracket
You have a list `x`. What is the difference between `x[1]` and `x[[1]]`?
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- They are identical for lists. ::no They return different things; this is the classic list trap.
- `x[1]` returns a length-one list still wrapping the element; `x[[1]]` returns the element itself. ::ok Right. Single bracket keeps the list box; double bracket reaches inside and hands you the contents.
- `x[1]` returns the element; `x[[1]]` returns a list. ::no It is the other way round.
- `x[[1]]` only works on numbers. ::no `[[ ]]` works on any list element, of any type.

=== step === quiz
::eyebrow Question 2 of 8
## What a data frame is
Which statement best describes a data frame?
::quiz {"correct": 1, "gate": true, "difficulty": "beginner"}
- A list of equal-length columns, where each column has its own type. ::ok Correct. That is why one column can be numbers and another text, while every column shares the same number of rows.
- A grid where every cell must be the same type. ::no That describes a matrix, not a data frame.
- A single vector displayed in rows. ::no A data frame has multiple named columns, not one vector.
- A type that can only hold numbers. ::no Columns can be any type, including text and factors.

=== step === quiz
::eyebrow Question 3 of 8
## A tibble is a data frame, plus
A tibble differs from a base `data.frame` in which way?
::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- A tibble can hold types a data frame cannot. ::no Both hold the same column types; the difference is behaviour, not capability.
- A tibble drops the column names. ::no Tibbles keep names; they print them clearly.
- A tibble prints a tidy preview with column types and never silently changes strings to factors. ::ok Right. Tibbles also keep subsetting predictable, returning a tibble rather than dropping to a vector.
- A tibble cannot be used with `dplyr`. ::no Tibbles are the native data frame of the tidyverse.

=== step === quiz
::eyebrow Question 4 of 8
## What str() is for
You are handed an unfamiliar object. What does `str(object)` show you?
::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- Only the number of rows. ::no It shows far more than a row count.
- A compact summary of its structure: its type, its dimensions, and a short preview of each part. ::ok Correct. `str()` is the fastest way to see what something actually is before you work with it.
- The full contents, every value printed. ::no It previews; it does not dump everything.
- A plot of the data. ::no `str()` prints text, not a chart.

=== step === quiz
::eyebrow Question 5 of 8
## Matrix versus data frame
You need a structure where every cell is the same type, laid out in rows and columns. Which fits?
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- A matrix, which is a single-type rectangular structure. ::ok Right. A matrix is one type throughout; reach for it when the whole grid is numbers, say.
- A data frame, because it has rows and columns. ::no A data frame allows a different type per column, so it is not single-type.
- A list, because it can hold anything. ::no A list is not rectangular and mixes types freely.
- A vector, reshaped by eye. ::no A plain vector has no row-and-column layout.

=== step === quiz
::eyebrow Question 6 of 8
## Converting text to numbers
You run `as.numeric(c("12", "3.5", "abc"))`. What comes back?
::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- An error that stops everything, because `"abc"` is not a number. ::no It does not error; it converts what it can and flags the rest.
- `12 3.5 0`, turning the bad value into zero. ::no R does not guess zero; an unconvertible value becomes `NA`.
- `12.0 3.5 NA`, with a warning that one value could not be converted. ::ok Correct. The convertible strings become numbers; `"abc"` becomes `NA` and you get a warning.
- `"12" "3.5" "abc"` unchanged, because conversion is not allowed. ::no Conversion happens; only the genuinely non-numeric value fails.

=== step === concept
::eyebrow Run it: reach into a list
## Lists in live R
Build a small list with named parts, then pull pieces out two ways. Run it, then try `person["name"]` (single bracket) and compare what it returns to `person[["name"]]`.

```r
person <- list(name = "Mara", scores = c(88, 91, 79), active = TRUE)
person[["name"]]        # the element itself
person$scores           # $ also reaches inside, by name
mean(person$scores)
```

`[[ ]]` and `$` both reach inside the list and hand you the actual element, here a string and a numeric vector you can take the mean of.

=== step === concept
::eyebrow Run it: inspect a data frame
## str() in live R
Build a tiny data frame with two types of column, then inspect its structure. Run it, then add a third column of your own and run `str()` again.

```r
shop <- data.frame(item = c("pen", "mug", "book"), price = c(2.5, 8.0, 14.0))
str(shop)
nrow(shop)
```

`str()` shows you the columns, their types (`chr` and `num` here), and a preview, all at a glance, which is how you orient yourself in unfamiliar data.

=== step === complete
## Section complete
Well done. You can reach into a list with `[[ ]]` and `$`, describe a data frame as equal-length typed columns, say what a tibble adds, read an object's shape with `str()`, choose a matrix when everything is one type, and convert types on purpose while knowing what produces an `NA`. Next section: subsetting, control flow and writing your own functions.
