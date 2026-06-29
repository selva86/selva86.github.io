---
title: "Strings & Dates Lesson 1: Strings with stringr"
catalog_blurb: "Clean and standardize messy text so it's ready to analyze."
description: "Tidy and reshape messy text in R with stringr: measure, trim and case-fix, detect, replace, extract and join, all on a real workshop sign-up sheet."
keywords: "stringr in R, string manipulation in R, str_detect, str_replace, str_sub, str_c, str_to_title, str_squish, clean text in R, tidyverse strings"
post_type: "LESSON"
curriculum_id: "1.5.1"
webr: true
lesson_access: "free"
track: "foundations"
course_id: "nr-strings"
course_title: "Strings, Dates and Factors in R"
course_lesson: "1"
course_total: "4"
course_landing: "R-Foundations-Strings-Course.html"
course_next: "Regular-Expressions-in-R.html"
course_prev: ""
---

=== step === cover
::eyebrow Lesson 1 of 4
## Strings with stringr
You ran a small R workshop and asked people to sign up on a shared sheet. Six did, and they typed their **name** and **city** by hand, the way people actually type: stray spaces, random capitals, one person who SHOUTED, and a city that goes by two names. Before you can email them, count them, or sort them, you have to clean that up.

That is what **stringr** is for: a small, consistent toolkit for working with text. By the end of this lesson you will be able to:

- Measure and tidy messy text: its length, its spacing, its capitalization
- Detect which entries contain something, and keep or count the matches
- Replace, extract and join text to turn the raw sheet into something you can use

**Prerequisites:** you can run a line of R and store a result with `<-` ([Your First R Session](R-Syntax-and-First-Objects.html)), and you know what a vector and the **character** type are ([Atomic Vectors and Data Types](Atomic-Vectors-and-Data-Types.html)). No regular expressions needed yet, that is Lesson 2. Press Run on the box below to see the whole cleanup happen at once; the rest of the lesson takes it apart, one verb at a time.

::widget table-transform {"caption":"One pass tidies the spacing and the capitalisation, ready to use.","code":"library(stringr)\ndf %>%\n  mutate(clean_signup = str_to_title(str_squish(raw_signup)))","before":{"cols":["raw_signup"],"rows":[["  Aarti Nair"],["RAVI kumar "],["Meera  S"],["  john  doe"],["Priya Raman"],["DEV"]]},"after":{"cols":["raw_signup","clean_signup"],"rows":[["  Aarti Nair","Aarti Nair"],["RAVI kumar ","Ravi Kumar"],["Meera  S","Meera S"],["  john  doe","John Doe"],["Priya Raman","Priya Raman"],["DEV","Dev"]]}}

=== step === concept
::eyebrow The toolkit
## Meet stringr: one shape, every verb

A **string** is just a piece of text, the character type you met when you learned vectors: each value sits in quotes, like `"Aarti Nair"`. Real data is full of them: names, cities, emails, product codes. The trouble is that hand-typed text is messy, and base R's text tools are a scattered, hard-to-remember bunch.

stringr fixes that with one rule you can lean on: **every verb is named `str_something()`, and every one takes the text as its first argument and works on the whole vector at once**, returning a result the same length. Learn the shape once and every verb feels familiar. Here is our sign-up sheet, and the gentlest verb, `str_length()`, which reports how many characters are in each entry:

```r
library(stringr)

# the raw sign-up sheet: six people, typed by hand
name <- c("  Aarti Nair", "RAVI kumar ", "Meera  S", "  john  doe", "Priya Raman", "DEV")
city <- c("Bengaluru", "bengaluru", "Mumbai ", "  Delhi", "Bangalore", "mumbai")

str_length(name)   # characters in each entry, spaces included
#> [1] 12 11  8 11 11  3
```

One call, six answers: `str_length` ran down the whole vector. The `3` at the end is `"DEV"`, suspiciously short for a full name, the kind of thing this measuring catches early. Everything stringr does falls into four jobs, and this lesson walks through them in order:

::widget process-flow {"steps":[{"title":"Detect","sub":"does an entry contain a piece of text?"},{"title":"Extract","sub":"pull a part out of each string"},{"title":"Replace","sub":"swap text for new text"},{"title":"Join","sub":"stitch strings together into one"}]}

=== step === concept
::eyebrow Job zero
## Tidy: fix the spacing and the case

Before any of the four jobs, almost every text column needs the same two-step tidy. First the **spacing**. Look at `"  Aarti Nair"` and `"Meera  S"`: leading spaces, trailing spaces, and a double space in the middle. Two verbs handle this:

- `str_trim()` removes spaces at the **start and end** only.
- `str_squish()` does that **and** collapses any run of inner spaces down to one. It is the one you want for hand-typed text.

```r
str_squish(name)   # trims the ends AND collapses inner runs of spaces
#> [1] "Aarti Nair"  "RAVI kumar"  "Meera S"     "john doe"    "Priya Raman" "DEV"
```

Next the **case**. People type `"RAVI kumar"`, `"john doe"`, `"DEV"`, every capitalization under the sun, and inconsistent case quietly breaks sorting and matching later. The `str_to_*` family standardizes it: `str_to_lower()`, `str_to_upper()`, and `str_to_title()` (a capital on the first letter of each word, the rest lowercased, so `"RAVI"` becomes `"Ravi"`). Chain the squish and the title-case and the names are clean. We tidy the cities the same way:

```r
clean_name <- str_to_title(str_squish(name))
clean_city <- str_to_title(str_trim(city))
clean_name
#> [1] "Aarti Nair"  "Ravi Kumar"  "Meera S"     "John Doe"    "Priya Raman" "Dev"
clean_city
#> [1] "Bengaluru" "Bengaluru" "Mumbai"    "Delhi"     "Bangalore" "Mumbai"
```

[KEY INSIGHT]
Tidy text in two moves: `str_squish()` to normalize the spacing, then a `str_to_*` verb to normalize the case. Do this first and every later step, matching, sorting, joining, gets easier.

=== step === quiz
::eyebrow Check yourself
## Trim or squish?

A name arrived as `"john   doe"`, with three spaces between the two words and none at the ends. You run `str_trim()` on it. What comes back?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- `"john   doe"`, unchanged, because `str_trim()` only touches the start and end, never the spaces between words ::ok Right. `str_trim()` strips leading and trailing spaces only. The inner run is untouched, so you get back exactly `"john   doe"`. To collapse those inner spaces too, you need `str_squish()`.
- `"john doe"`, because `str_trim()` collapses the run of inner spaces to one ::no That is what `str_squish()` does. `str_trim()` works on the ends only and leaves inner spaces alone.
- `"johndoe"`, because `str_trim()` removes every space ::no `str_trim()` never removes inner spaces at all. It only strips the ends; the gap between the words stays.

=== step === concept
::eyebrow Job 1
## Detect: which entries contain what?

The first real job is asking, of every entry, "does this contain the text I care about?" `str_detect()` answers it: give it the vector and a piece of text to look for, and it returns a **logical vector**, one `TRUE` or `FALSE` per entry. Say you want to know which sign-ups are from Bengaluru:

```r
str_detect(clean_city, "Bengaluru")   # TRUE where the entry contains it
#> [1]  TRUE  TRUE FALSE FALSE FALSE FALSE
```

Two close cousins build on that same idea. `str_subset()` keeps only the entries that match (handy for filtering), and `str_count()` counts how many times the text appears in each entry:

```r
str_subset(clean_city, "Mumbai")   # keep only the matching entries
#> [1] "Mumbai" "Mumbai"
str_count("banana split", "a")     # how many times does "a" appear?
#> [1] 3
```

[NOTE]
That second argument is not just literal text, it is a **pattern**. A plain word like `"Mumbai"` is the simplest possible pattern (it matches itself), which is all we need today. In Lesson 2 you will learn **regular expressions**, which turn that argument into something far more powerful: match any digit, any email, any date. Until then, give these verbs plain text and they behave exactly as they read.

=== step === tryit
::eyebrow Your turn
## Flag the Mumbai sign-ups

Your `clean_city` vector is already tidied. Replace the blank with a call that returns a `TRUE`/`FALSE` vector marking which entries are from Mumbai. The answer you are after is `c(FALSE, FALSE, TRUE, FALSE, FALSE, TRUE)`.

```r
clean_city <- str_to_title(str_trim(city))   # already tidied
____   # TRUE where the city contains "Mumbai", FALSE otherwise
```
::check {"regex":"str_detect\\s*[(]\\s*clean_city","gate":true,"difficulty":"beginner","ok":"Exactly. str_detect(clean_city, \"Mumbai\") runs down the whole vector and returns one TRUE/FALSE per entry.","no":"Call str_detect on the vector with the text to look for: str_detect(clean_city, \"Mumbai\")."}
::solution
```r
str_detect(clean_city, "Mumbai")
#> [1] FALSE FALSE  TRUE FALSE FALSE  TRUE
```

=== step === concept
::eyebrow Job 2
## Replace: swap text for new text

Notice the cities still disagree: some people wrote `"Bengaluru"` and one wrote `"Bangalore"`, the city's older name. To anyone counting cities, those look like two different places. **Replacing** text fixes it. There are two verbs, and the difference between them trips people up:

- `str_replace()` swaps only the **first** match in each entry.
- `str_replace_all()` swaps **every** match.

For whole-value standardizing you want `str_replace_all()`. `str_remove()` and `str_remove_all()` are the same idea with the replacement set to nothing. Press Run to standardize the old city name:

::widget table-transform {"caption":"str_replace_all() rewrites every Bangalore to Bengaluru; the rest pass through unchanged.","code":"library(stringr)\ndf %>%\n  mutate(fixed = str_replace_all(city, \"Bangalore\", \"Bengaluru\"))","before":{"cols":["city"],"rows":[["Bengaluru"],["Bengaluru"],["Mumbai"],["Delhi"],["Bangalore"],["Mumbai"]]},"after":{"cols":["city","fixed"],"rows":[["Bengaluru","Bengaluru"],["Bengaluru","Bengaluru"],["Mumbai","Mumbai"],["Delhi","Delhi"],["Bangalore","Bengaluru"],["Mumbai","Mumbai"]]}}

We keep the standardized result to use later, and `str_remove()` shows the same machinery with an empty replacement:

```r
city_fixed <- str_replace_all(clean_city, "Bangalore", "Bengaluru")
city_fixed
#> [1] "Bengaluru" "Bengaluru" "Mumbai"    "Delhi"     "Bengaluru" "Mumbai"
str_remove(c("Dr Aarti", "Dr Ravi"), "Dr ")   # drop a prefix
#> [1] "Aarti" "Ravi"
```

=== step === concept
::eyebrow Job 3
## Extract: pull out a piece

Often you do not want the whole string, just a part of it: a first name, an initial, an area code. `str_sub()` pulls out characters **by position**: `str_sub(x, 1, 1)` takes the first character, and negative numbers count from the end, so `str_sub(x, -3, -1)` takes the last three.

```r
str_sub(clean_name, 1, 1)   # first character of each name (an initial)
#> [1] "A" "R" "M" "J" "P" "D"
```

When the piece you want is a whole **word**, `word()` is easier than counting characters: `word(x, 1)` grabs the first space-separated word, perfect for splitting "Aarti Nair" into a first name.

```r
first <- word(clean_name, 1)   # the first word of each name
first
#> [1] "Aarti" "Ravi"  "Meera" "John"  "Priya" "Dev"
```

[NOTE]
There is also `str_extract()`, which pulls out the first part that matches a **pattern**, for example the digits out of `"Order #4021 shipped"`. Run it and you will see `"4021"`:

```r
str_extract("Order #4021 shipped", "[0-9]+")   # the first run of digits
#> [1] "4021"
```

That `"[0-9]+"` is a regular expression, the topic of Lesson 2. For now, just know `str_extract()` is waiting for you once you can write patterns.

=== step === concept
::eyebrow Job 4
## Join: build new text from pieces

The last job is the reverse of extracting: gluing strings together into new text. `str_c()` (think "string concatenate") joins pieces end to end. Give it a `sep` to put between every pair, and `collapse` to fold a whole vector into a single string:

```r
str_c(first, " from ", city_fixed)   # one label per person
#> [1] "Aarti from Bengaluru" "Ravi from Bengaluru"  "Meera from Mumbai"
#> [4] "John from Delhi"      "Priya from Bengaluru" "Dev from Mumbai"
str_c(first, collapse = ", ")         # fold the whole vector into one string
#> [1] "Aarti, Ravi, Meera, John, Priya, Dev"
```

When the text is a sentence with values dropped into it, `str_glue()` reads better than a pile of commas: write the sentence once and wrap each value in `{ }`.

```r
str_glue("Hi {first}, welcome to the workshop!")
#> Hi Aarti, welcome to the workshop!
#> Hi Ravi, welcome to the workshop!
#> ... one line per person
```

=== step === tryit
::eyebrow Put it together
## Build a welcome line

Time to use all four jobs at once. You have `first` (each person's first name) and `city_fixed` (their standardized city). Replace the blank to build one label per person in the form `"Aarti from Bengaluru"`. Reach for `str_c()` with `" from "` in the middle.

```r
first <- word(clean_name, 1)                               # first names
city_fixed <- str_replace_all(clean_city, "Bangalore", "Bengaluru")  # standardized cities
____   # build "First from City" for each person
```
::check {"regex":"str_c\\s*[(]\\s*first","gate":true,"difficulty":"intermediate","ok":"That is the whole pipeline in one line: extract the first name, standardize the city, and join them with str_c().","no":"Join the three pieces with str_c: str_c(first, \" from \", city_fixed)."}
::solution
```r
first <- word(clean_name, 1)
city_fixed <- str_replace_all(clean_city, "Bangalore", "Bengaluru")
str_c(first, " from ", city_fixed)
#> [1] "Aarti from Bengaluru" "Ravi from Bengaluru"  "Meera from Mumbai"
#> [4] "John from Delhi"      "Priya from Bengaluru" "Dev from Mumbai"
```

=== step === concept
::eyebrow Go deeper
## References

Four trustworthy places to take this further, all free:

- [stringr (tidyverse) - official site](https://stringr.tidyverse.org/) - the home page and full reference for every `str_*` verb you used here.
- [R for Data Science (2e): Strings](https://r4ds.hadley.nz/strings) - the canonical, example-led chapter that teaches these verbs from scratch.
- [Posit stringr cheatsheet](https://rstudio.github.io/cheatsheets/html/strings.html) - a one-page visual map of the whole toolkit, worth keeping open.
- [Introduction to stringr (vignette)](https://stringr.tidyverse.org/articles/stringr.html) - the package authors' own tour, including how patterns work.

=== step === complete
## Lesson 1 complete

You took a sheet of hand-typed names and cities and made it usable. You measured text with `str_length()`, tidied it with `str_squish()` and the `str_to_*` case verbs, then ran the four jobs: **detect** (`str_detect`, `str_subset`, `str_count`), **replace** (`str_replace_all`, `str_remove`), **extract** (`str_sub`, `word`), and **join** (`str_c`, `str_glue`). The shape never changed: every verb took the text first and worked on the whole vector at once.

One thing kept coming up: that second argument is a **pattern**, and so far we only used plain words. Next, Lesson 2: Regular Expressions. You will learn to write patterns that match any digit, any email, any date, and watch them light up the exact characters they catch, the trick that makes `str_detect`, `str_replace` and `str_extract` genuinely powerful.
