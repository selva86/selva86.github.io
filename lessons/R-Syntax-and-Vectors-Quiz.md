---
title: "Syntax, Types and Vectors: Quiz"
description: "A short, graded check on R basics: assignment, the core data types, vectors, recycling and coercion, special values like NA, and loading packages."
keywords: "R quiz, R data types, vectors, coercion, recycling, NA, typeof, install.packages, library, R practice"
post_type: "LESSON"
curriculum_id: "1.1.6"
webr: true
lesson_access: "free"
track: "foundations"
course_id: "nr-basics"
course_title: "R Foundations: The Basics"
course_lesson: "6"
course_total: "6"
course_landing: "R-Foundations-Basics-Course.html"
lesson_kind: "quiz"
course_prev: "Install-and-Load-Packages.html"
course_next: ""
catalog_blurb: "Check what stuck before you move on."
---

=== step === cover
::eyebrow Check your understanding
## Quiz
You have finished the first section: running code and assigning with `<-`, R's core data types, building and combining vectors, recycling and coercion, the special values, and loading packages. This short quiz checks what stuck. Pick an answer to continue; you can retry until it clicks. The last two steps are live R, run them and tinker.

=== step === quiz
::eyebrow Question 1 of 8
## What assignment does
You run `score <- 90` in the console. What happens?
::quiz {"correct": 1, "gate": true, "difficulty": "beginner"}
- The value `90` is stored in a variable named `score`, which you can use later. ::ok Right. `<-` takes the value on the right and binds it to the name on the left.
- R checks whether `score` already equals `90`. ::no That is a comparison, written `score == 90`. A single arrow assigns; a double equals tests.
- `90` is printed once and then forgotten. ::no Assignment stores the value; nothing is printed unless you ask for it.
- A new function called `score` is created. ::no `90` is a value, not a function body.

=== step === quiz
::eyebrow Question 2 of 8
## One vector, one type
You build `c(1, "two", TRUE)`. Because a vector holds a single type, what type does R store?
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- numeric, because there are two numbers in there. ::no Once any text is present, the numbers cannot stay numeric; the whole vector is pulled up to text.
- character, because text is the most general type, so everything becomes text. ::ok Correct. Coercion follows logical to integer to double to character, and the highest type present wins.
- logical, because `TRUE` came last. ::no Position does not decide the type; the most general type present does.
- It stays mixed, with each element keeping its own type. ::no An atomic vector cannot be mixed; that is what lists are for.

=== step === quiz
::eyebrow Question 3 of 8
## Integer or double
You type `x <- 5` at the console. What does `typeof(x)` report?
::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- `"integer"`, because 5 is a whole number. ::no A plain number is stored as a double even when it looks whole.
- `"numeric"`, the name of the type. ::no `"numeric"` is a class, not what `typeof()` returns here; the stored type is `"double"`.
- `"double"`; a bare number is a double unless you write `5L`. ::ok Right. Add the `L` suffix, `5L`, to get a genuine integer.
- `"character"`, because it was typed in. ::no Typing a number gives a number, not text.

=== step === quiz
::eyebrow Question 4 of 8
## Recycling the short vector
What does `c(1, 2, 3, 4) * c(10, 1)` return?
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- `10 2 30 4`, because the short vector is recycled to `10 1 10 1`. ::ok Correct. R repeats `c(10, 1)` to match the longer length, then multiplies element by element.
- `10 20 30 40`, multiplying every element by 10. ::no That would need `* 10`, a single value, not a length-2 vector.
- An error, because the lengths differ. ::no Unequal lengths only warn when the longer is not a clean multiple of the shorter; here 4 is a multiple of 2, so it is silent.
- `11 3`, adding the vectors instead. ::no The operator is multiplication, and the result keeps the longer length.

=== step === quiz
::eyebrow Question 5 of 8
## NA is contagious
What does `sum(c(2, NA, 4))` return?
::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- `6`, because R skips the `NA`. ::no R does not skip it by default; an unknown value makes the whole total unknown.
- `NA`, because one unknown value makes the whole sum unknown. ::ok Right. Add `na.rm = TRUE` to tell `sum()` to drop the `NA` and return `6`.
- `0`, treating `NA` as zero. ::no `NA` means "unknown", not zero.
- An error, because `NA` is not a number. ::no It is a valid value; it just propagates through the arithmetic.

=== step === quiz
::eyebrow Question 6 of 8
## Install once, load every time
You want to use the `dplyr` package in a fresh session. Which is true?
::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- Run `install.packages("dplyr")` at the start of every session. ::no You install a package once; reinstalling every session is slow and unnecessary.
- Run `library(dplyr)` once, ever, and it is available in all future sessions. ::no `library()` only lasts the current session; you call it again next time.
- Install it once with `install.packages()`, then call `library(dplyr)` in each session you use it. ::ok Correct. Installation is one-time; loading with `library()` is per session.
- Packages load automatically, so you never need either. ::no Base R loads automatically, but add-on packages must be installed and loaded.

=== step === concept
::eyebrow Run it: build a vector
## Vectors and their type in live R
Make a numeric vector, then ask R two things about it: what type it holds and how many elements it has. Run it, then change one number to text like `"hi"` and run again to watch `typeof` change.

```r
days <- c(3, 8, 1, 12, 5)
typeof(days)
length(days)
mean(days)
```

`typeof()` tells you what a vector is made of, `length()` how big it is, and functions like `mean()` work on the whole vector at once.

=== step === concept
::eyebrow Run it: watch coercion
## Coercion in live R
A vector can hold only one type, so mixing types forces R to convert. Run this and read the result, then add `TRUE` to the `c(...)` and run again to see it become a number first.

```r
mixed <- c(1, 2, "three")
mixed
typeof(mixed)
```

The lone piece of text pulled the numbers up to character, so `1` is now `"1"`. That is coercion: the most general type present wins.

=== step === complete
## Section complete
Nice work. You can assign values with `<-`, name R's core types and tell an integer from a double, build vectors and predict how recycling and coercion behave, reason about how `NA` spreads, and install and load a package. Next section: lists, data frames and tibbles, the structures that hold real datasets.
