---
title: "Strings, Dates and Regular Expressions: Quiz"
description: "A short, graded check on text and time in R: stringr verbs, regular expressions and the doubled backslash, parsing dates with lubridate, and factors."
keywords: "R quiz, stringr, str_detect, str_replace, regular expressions, regex R, lubridate, ymd, factors, R practice"
post_type: "LESSON"
curriculum_id: "1.5.5"
webr: true
lesson_access: "free"
track: "foundations"
course_id: "nr-strings"
course_title: "Strings, Dates and Factors in R"
course_lesson: "5"
course_total: "5"
course_landing: "R-Foundations-Strings-Course.html"
lesson_kind: "quiz"
course_prev: "Factors-with-forcats.html"
course_next: ""
catalog_blurb: "Check what stuck before you move on."
---

=== step === cover
::eyebrow Check your understanding
## Quiz
You have finished the text-and-time section: manipulating strings with stringr, writing regular expressions, parsing dates with lubridate, and ordered categories with forcats. This short quiz checks what stuck. Pick an answer to continue; you can retry until it clicks. The last two steps are live R, run them and tinker.

=== step === quiz
::eyebrow Question 1 of 8
## What str_detect returns
You run `str_detect(c("apple", "pear", "grape"), "ap")`. What comes back?
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The matching strings, `"apple"` and `"grape"`. ::no That is what `str_subset()` returns; `str_detect()` answers yes or no per element.
- A logical vector, `TRUE FALSE TRUE`, one per element. ::ok Right. `str_detect()` reports whether each string contains the pattern, so you can use it to filter.
- The count of matches, `2`. ::no That is closer to `sum(str_detect(...))`; the function itself returns logicals.
- The positions where the match starts. ::no That is `str_locate()`; `str_detect()` gives TRUE or FALSE.

=== step === quiz
::eyebrow Question 2 of 8
## A digit in a regex
In an R string, how do you write the regular expression that matches a single digit?
::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- `"d"`, the letter d. ::no A plain `d` matches the literal letter d, not a digit.
- `"\d"`, a single backslash. ::no R reads `\d` in a string as an invalid escape; you must double the backslash.
- `"\\d"`, a doubled backslash before d. ::ok Correct. R sees `\\` as one backslash, so the regex engine receives `\d`, the digit class.
- `"[digit]"`. ::no That matches the literal letters d, i, g, i, t; the digit class is `\\d` or `[0-9]`.

=== step === quiz
::eyebrow Question 3 of 8
## First match or all of them
`str_replace()` and `str_replace_all()` differ how?
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- `str_replace()` replaces only the first match in each string; `str_replace_all()` replaces every match. ::ok Right. Reach for the `_all` variant when a pattern can appear more than once.
- They are identical. ::no They differ in how many matches they touch.
- `str_replace()` works on numbers; `str_replace_all()` on text. ::no Both work on text; the difference is first match versus all matches.
- `str_replace_all()` only replaces the last match. ::no It replaces all matches, not just the last.

=== step === quiz
::eyebrow Question 4 of 8
## Parsing a date
You have the text `"2026-03-08"` and want a real date you can do arithmetic on. With lubridate, which call parses it?
::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- `mdy("2026-03-08")`. ::no `mdy` expects month, day, year order; this text is year, month, day.
- `ymd("2026-03-08")`, matching the year-month-day order. ::ok Correct. lubridate's parser is named for the order of the parts, so `ymd` fits this text.
- `dmy("2026-03-08")`. ::no `dmy` expects day first, which does not match.
- `as.character("2026-03-08")`. ::no That keeps it as text; you want a Date object.

=== step === quiz
::eyebrow Question 5 of 8
## What a factor's levels are
You make `factor(c("low", "high", "low"))`. What are its levels?
::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Just `"low"`, the most common value. ::no Levels are the set of allowed categories, not the mode.
- The row numbers. ::no Levels are categories, not positions.
- The distinct categories, `"high"` and `"low"`, the allowed set of values. ::ok Right. A factor stores the full set of permitted categories, which is what lets you order and count them cleanly.
- Nothing; factors have no levels. ::no Levels are the defining feature of a factor.

=== step === quiz
::eyebrow Question 6 of 8
## Anchoring a pattern
In a regular expression, what does the `^` at the start of a pattern mean?
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Anchor the match to the start of the string. ::ok Right. `^abc` matches only when the string begins with `abc`; pair it with `$` to anchor the end.
- Match any character. ::no That is `.`; `^` is an anchor, not a wildcard.
- Negate the whole pattern. ::no `^` negates only inside a character class like `[^a]`; at the front it anchors the start.
- Repeat the previous character. ::no Repetition is `*` or `+`; `^` anchors position.

=== step === concept
::eyebrow Run it: pull out a pattern
## stringr in live R
Extract the first run of digits from each string. Run it, then change the pattern to `"[a-z]+"` to grab letters instead.

```r
library(stringr)

orders <- c("order 238 shipped", "ref 7 pending", "no number here")
str_extract(orders, "[0-9]+")
```

`str_extract()` returns the first match of the pattern in each string, or `NA` when there is none, as in the last entry.

=== step === concept
::eyebrow Run it: do date arithmetic
## lubridate in live R
Parse two dates and subtract them to get the gap in days. Run it, then change one date and run again.

```r
library(lubridate)

borrowed <- ymd("2026-03-01")
returned <- ymd("2026-03-15")
returned - borrowed
```

Once text becomes a real date with `ymd()`, ordinary subtraction gives you a meaningful number of days.

=== step === complete
## Section complete
Nice work. You can detect and replace text with stringr, write a digit class with the doubled backslash, tell `str_replace` from `str_replace_all`, parse dates with the right lubridate function, describe a factor's levels, and anchor a pattern with `^`. Next section: iteration with the apply family and purrr.
