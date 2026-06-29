---
title: "Strings & Dates Lesson 2: Regular Expressions in R"
catalog_blurb: "Match the exact pieces of text you want, then extract or fix them."
description: "Learn regular expressions in R from scratch: build patterns with character classes, quantifiers and anchors, then detect, extract and replace messy text."
keywords: "regular expressions in R, regex in R, character classes, quantifiers, anchors, grepl, gsub, regmatches, str_detect, str_extract, str_replace, pattern matching in R"
post_type: "LESSON"
curriculum_id: "1.5.2"
webr: true
lesson_access: "free"
track: "foundations"
course_id: "nr-strings"
course_title: "Strings, Dates and Factors in R"
course_lesson: "2"
course_total: "4"
course_landing: "R-Foundations-Strings-Course.html"
course_next: "Dates-and-Times-in-R.html"
course_prev: "Strings-with-stringr.html"
---

=== step === cover
::eyebrow Lesson 2 of 4
## Regular Expressions in R

Back to our workshop. Five of the people who signed up in Lesson 1 also pasted a one-line confirmation when they registered, and each line is a jumble: a name, an email, the amount they paid, the date, and a ticket code, all crammed into a single string like `"Aarti Nair  aarti.nair@site.org  paid 1500 on 2026-03-08  ticket A12"`.

In Lesson 1 you handed the stringr verbs a plain word like `"Mumbai"` and it matched that exact text. That only finds things you can spell out in advance. To pull the email, the date, or the ticket out of a line like the one above, you need to describe their *shape*, not their exact text. That description is a **regular expression**.

By the end of this lesson you will be able to:

- Build a pattern from the ground up with character classes, quantifiers and anchors
- See exactly which characters a pattern matches, live
- Find, extract and replace text with that pattern, in base R and with stringr

**Prerequisites:** you can run R and store a result with `<-` ([Atomic Vectors and Data Types](Atomic-Vectors-and-Data-Types.html)), and you have met the stringr verbs `str_detect`, `str_extract` and `str_replace` ([Strings with stringr](Strings-with-stringr.html)). This lesson turns their "pattern" argument into a real tool.

The widget below is the payoff. Tap each pattern and watch it light up the exact characters it catches. By the end you will write every one of these yourself.

::widget regex-highlight {"text":"Aarti Nair  aarti.nair@site.org  paid 1500 on 2026-03-08  ticket A12","patterns":[{"src":"[0-9]+","label":"Digits"},{"src":"[0-9]{4}-[0-9]{2}-[0-9]{2}","label":"Date"},{"src":"[a-z._]+@[a-z.]+","label":"Email"},{"src":"[A-Z][0-9]+","label":"Ticket"}]}

=== step === concept
::eyebrow The core idea
## A pattern matches a shape, not exact text

A plain word like `"Mumbai"` is the simplest possible pattern: it matches itself, those six letters in that order. A **regular expression** (regex) goes further. It is a tiny language for describing a *shape* of text, so one pattern can match many different strings that share a form: any digit, any email, any date.

The first building block is the **character class**, written in square brackets: `[...]` means "match any **one** character from this set." The dash inside makes a **range**.

A few characters are not taken literally inside a regex; they are **metacharacters** with a special job. The square brackets are the first you have met. Here is our sign-up data, and a class that finds a digit:

```r
library(stringr)

# Five workshop confirmations. Each is ONE string: a name, an email, an amount,
# a date and a ticket code, typed into one free-text box.
signup <- c(
  "Aarti Nair  aarti.nair@site.org  paid 1500 on 2026-03-08  ticket A12",
  "Ravi Kumar  ravi_k@mail.co.in  paid 1800 on 2026-03-09  ticket B7",
  "Meera S  meera@work.io  paid 1500 on 2026-03-11  ticket C24",
  "John Doe  john.doe@site.org  paid 2000 on 2026-03-12  ticket A3",
  "Priya Raman  priya@site.org  paid 1500 on 2026-03-15  ticket B19"
)

# [0-9] is a character class: "any ONE of the digits 0 through 9".
# str_extract pulls the first match from each string (one result per element).
str_extract(signup, "[0-9]")
#> [1] "1" "1" "1" "2" "1"
```

It found a single digit in each line: the first `1` of `1500`, and the `2` of `2000`. Ranges and negation give you the rest:

```r
str_extract(signup, "[A-Z]")    # a range: any capital letter A through Z (the first one)
#> [1] "A" "R" "M" "J" "P"
str_detect(signup, "[^0-9]")    # [^...] NEGATES the set: any character that is NOT a digit
#> [1] TRUE TRUE TRUE TRUE TRUE
```

[NOTE]
Three classes are so common they get shorthands: `\d` is any digit (the same as `[0-9]`), `\w` is a "word" character (letter, digit or underscore), and `\s` is any whitespace. One catch: **in R you must double the backslash**, writing `"\\d"`, not `"\d"`, because R strings treat a lone backslash specially. We will return to that in the gotchas at the end; for now, `[0-9]` and `\\d` mean the same thing.

=== step === quiz
::eyebrow Check yourself
## What does `[0-9]` match?

You write the pattern `[0-9]` (no quantifier after it). Run against the text `"room 1500"`, what does a single match find?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- The literal text `0-9` ::no That would be the pattern `0-9` with no brackets. Inside `[...]`, the dash makes a RANGE, so `[0-9]` is not literal text.
- Any one digit: here, the `1` of `1500` ::ok Right. A character class `[...]` matches exactly ONE character from the set, and `0-9` is the range of all ten digits. It stops after the first one.
- The whole number `1500`, all four digits at once ::no Not yet. A bare class matches a SINGLE character. To grab a run of digits you add a quantifier, `[0-9]+`, which is the next step.

=== step === concept
::eyebrow How many?
## Quantifiers: how many to match

A class matches one character. A **quantifier** sits right after an item and says **how many** of it to match:

- `+` one or more
- `*` zero or more
- `?` optional (zero or one)
- `{n}` exactly n
- `{n,m}` between n and m

```r
str_extract(signup, "[0-9]+")    # one or more digits: grabs the whole run
#> [1] "1500" "1800" "1500" "2000" "1500"
str_extract(signup, "[0-9]{2}")  # exactly two digits
#> [1] "15" "18" "15" "20" "15"
```

`[0-9]+` is greedy: it takes as many digits as it can, so it returns the whole amount `1500`, not just the first `1`. The `?` quantifier is handy for optional letters, so one pattern can absorb two spellings:

```r
str_extract(c("color", "colour", "colossal"), "colou?r")  # the u is optional
#> [1] "color"  "colour" NA
```

`"colou?r"` matched `color` (no u) and `colour` (with u), and returned `NA` for `colossal`, which has no match at all. Tap the patterns below and watch the same string yield fewer, longer matches as you tighten the quantifier.

::widget regex-highlight {"text":"paid 1500 on 2026-03-08","patterns":[{"src":"[0-9]","label":"One digit"},{"src":"[0-9]+","label":"One or more"},{"src":"[0-9]{4}","label":"Exactly four"}]}

=== step === tryit
::eyebrow Your turn
## Grab the whole amount

Each line has an amount like `1500` right after the word `paid`. The blank below should pull the **whole run of digits**, not just the first one, so you get `"1500"`, `"1800"`, and so on. Reach for a digit class plus the right quantifier.

```r
str_extract(signup, "____")   # the whole run of digits (the amount) from each line
```
::check {"regex":"0-9.*\\+|\\\\d\\+","gate":true,"difficulty":"beginner","ok":"Yes. `[0-9]+` (or `\\d+`) means one or more digits, so it grabs the whole run like 1500, not just the first digit.","no":"Add a quantifier after the digit class: `[0-9]+` matches one or more digits in a row, the whole amount."}
::solution
```r
str_extract(signup, "[0-9]+")
#> [1] "1500" "1800" "1500" "2000" "1500"
```

=== step === concept
::eyebrow Where, and putting it together
## Anchors, and building a real pattern

Classes and quantifiers say *what* and *how many*. **Anchors** say *where*, and they match a position rather than a character:

- `^` the start of the string
- `$` the end of the string
- `\b` a word boundary (the edge between a word character and a non-word character)

```r
str_extract(signup, "^[A-Za-z]+")        # a run of letters anchored to the START
#> [1] "Aarti" "Ravi"  "Meera" "John"  "Priya"
grepl("ticket [A-Z][0-9]+$", signup)     # does the line END with a ticket code?
#> [1] TRUE TRUE TRUE TRUE TRUE
str_detect(c("paid on time", "salons open"), "\\bon\\b")  # the WORD "on", not "on" inside "salons"
#> [1]  TRUE FALSE
```

Now combine all three ideas into the patterns from the cover. Each is just classes, quantifiers and (where useful) anchors stacked together:

```r
email  <- "[a-z._]+@[a-z.]+"            # letters/dots/underscore, an @, then a domain
date   <- "[0-9]{4}-[0-9]{2}-[0-9]{2}"  # four digits - two digits - two digits
ticket <- "[A-Z][0-9]+"                 # one capital letter, then one or more digits

str_extract(signup, email)
#> [1] "aarti.nair@site.org" "ravi_k@mail.co.in"   "meera@work.io"       "john.doe@site.org"   "priya@site.org"
str_extract(signup, date)
#> [1] "2026-03-08" "2026-03-09" "2026-03-11" "2026-03-12" "2026-03-15"
```

[KEY INSIGHT]
Every "complicated" regex is just three simple ideas stacked: a **class** for which characters, a **quantifier** for how many, and an **anchor** for where. Read any pattern by spotting those pieces, and write one by choosing them in turn.

::widget regex-highlight {"text":"Ravi Kumar  ravi_k@mail.co.in  paid 1800 on 2026-03-09  ticket B7","patterns":[{"src":"[a-z._]+@[a-z.]+","label":"Email"},{"src":"[0-9]{4}-[0-9]{2}-[0-9]{2}","label":"Date"},{"src":"[A-Z][0-9]+","label":"Ticket"},{"src":"[0-9]+","label":"Any number"}]}

=== step === concept
::eyebrow Three jobs
## Find, extract and replace in R

A pattern is only useful once you DO something with it. The three jobs are the same ones from Lesson 1, except the second argument is now a real pattern. Each has a base R verb and a stringr verb that do the same thing:

::widget process-flow {"steps":[{"title":"Detect","sub":"is the pattern there? grepl or str_detect, returns TRUE/FALSE"},{"title":"Extract","sub":"pull the matches out: regmatches or str_extract"},{"title":"Replace","sub":"swap matches for new text: gsub or str_replace_all"}]}

```r
# DETECT: which lines contain an email?
str_detect(signup, email)
#> [1] TRUE TRUE TRUE TRUE TRUE

# EXTRACT every match, not just the first, with str_extract_all:
str_extract_all("call 98765 or 43210", "[0-9]+")
#> [[1]]
#> [1] "98765" "43210"

# REPLACE: redact every email by swapping it for [hidden]
str_replace_all(signup, email, "[hidden]")
#> [1] "Aarti Nair  [hidden]  paid 1500 on 2026-03-08  ticket A12" ...
```

The base R verbs need no package at all and read almost the same:

```r
grepl(date, signup)                        # detect: one TRUE/FALSE per line
regmatches(signup, regexpr(date, signup))  # extract: the first match in each line
#> [1] "2026-03-08" "2026-03-09" "2026-03-11" "2026-03-12" "2026-03-15"
gsub(email, "[hidden]", signup)            # replace: every match, like str_replace_all
```

=== step === quiz
::eyebrow Check yourself
## First match, or every match?

You run `str_extract(x, "[0-9]+")` on the single line `"room 12, seat 9"`. What comes back?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Just `"12"`, the first run of digits ::ok Right. `str_extract` (like base `regexpr`) returns only the FIRST match in each string. For every match you need `str_extract_all` (or `gregexpr`).
- Both `"12"` and `"9"` ::no That is what `str_extract_all` returns: a list of all matches. Plain `str_extract` stops at the first one.
- `TRUE`, because the line contains a digit ::no That is `str_detect`, which answers "is it there?". `str_extract` returns the matched text itself, here the first match.

=== step === tryit
::eyebrow Put it together
## Redact every email

Privacy pass: replace every email in `signup` with the word `[hidden]`, leaving the rest of each line untouched. Fill in a pattern that matches an email: some letters, dots or an underscore, then an `@`, then a domain.

```r
str_replace_all(signup, "____", "[hidden]")
```
::check {"regex":"@","gate":true,"difficulty":"intermediate","ok":"Right. An email pattern is built like any other: a class for the name part, an `@`, then a class for the domain, for example `[a-z._]+@[a-z.]+`.","no":"Your pattern needs an `@`, the one character every email has. Try `[a-z._]+@[a-z.]+`."}
::solution
```r
str_replace_all(signup, "[a-z._]+@[a-z.]+", "[hidden]")
#> [1] "Aarti Nair  [hidden]  paid 1500 on 2026-03-08  ticket A12" ...
```

=== step === concept
::eyebrow Know the edges
## Three traps, and where regex stops

Regex is powerful, but a few things bite everyone at least once. Here they are, with fixes:

```r
# TRAP 1 - greedy matching. + and * grab as MUCH as possible by default.
str_extract("<b>hi</b>", "<.+>")    # greedy: swallows up to the LAST >
#> [1] "<b>hi</b>"
str_extract("<b>hi</b>", "<.+?>")   # lazy (+?): stops at the FIRST >
#> [1] "<b>"
```

```r
# TRAP 2 - the doubled backslash. In R, a regex backslash must be written twice.
grepl("\\d", "room 7")              # "\\d" in R source is the single regex token \d
#> [1] TRUE

# TRAP 3 - case. Matching is case-sensitive unless you say otherwise.
grepl("aarti", signup, ignore.case = TRUE)  # match regardless of capitalisation
#> [1]  TRUE FALSE FALSE FALSE FALSE
```

[WARNING]
Regex matches flat patterns, not nested structure. Do not try to parse real HTML, JSON, or deeply nested brackets with a regular expression: every clever pattern eventually breaks on a case it cannot see. For those, use a real parser (`xml2`, `jsonlite`, `rvest`). Regex is for shapes inside flat text; that is where it shines.

Keep these in mind:

- `.` means "any character"; to match a literal dot, escape it as `\\.`.
- `+` and `*` are greedy; add `?` after them (`+?`, `*?`) to make them lazy.
- Always double the backslash in R strings: `\\d`, `\\.`, `\\b`.

=== step === concept
::eyebrow Go deeper
## References

Four trustworthy places to take this further, all free:

- [R for Data Science (2e): Regular expressions](https://r4ds.hadley.nz/regexps) - the canonical, example-led chapter that builds regex from scratch.
- [stringr: Regular expressions (vignette)](https://stringr.tidyverse.org/articles/regular-expressions.html) - the exact syntax the stringr verbs understand, with a clear cheat-table.
- [Base R regular expression reference (?regex)](https://stat.ethz.ch/R-manual/R-devel/library/base/html/regex.html) - the authoritative help page behind `grepl`, `gsub`, `regmatches` and friends.
- [Posit strings cheatsheet](https://rstudio.github.io/cheatsheets/html/strings.html) - a one-page visual map of regex and stringr, worth keeping open while you work.

=== step === complete
## Lesson 2 complete

You can now describe a shape of text instead of spelling it out. You built patterns from **character classes** (`[0-9]`, `[A-Z]`, `[^...]`), **quantifiers** (`+`, `?`, `{n}`), and **anchors** (`^`, `$`, `\b`), assembled them into real email, date and ticket patterns, and used them to **detect** (`grepl`, `str_detect`), **extract** (`regmatches`, `str_extract_all`), and **replace** (`gsub`, `str_replace_all`). You also met the traps: greedy matching, the doubled backslash, and case.

One of those patterns you wrote was a date: `[0-9]{4}-[0-9]{2}-[0-9]{2}`. That matches the *text* of a date, but it does not understand it: it cannot tell you the weekday, add seven days, or know that one line is earlier than another. Next, Lesson 3: Dates and Times in R. You will turn date text into real dates you can do arithmetic on, and handle the time zones that trip everyone up.
