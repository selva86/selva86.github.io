---
title: "R Foundations Lesson 2: Atomic Vectors and Data Types"
catalog_blurb: "How R stores many values in one vector, and the types they can be."
description: "Meet R's atomic vector and its four core types - logical, integer, double, character. Build one with c(), read its type with typeof(), and see mixing coerce it."
keywords: "atomic vector in R, R data types, typeof in R, logical integer double character, vector coercion, length in R, c function in R, R for beginners"
post_type: "LESSON"
curriculum_id: "1.1.2"
webr: true
lesson_access: "free"
track: "foundations"
course_id: "nr-basics"
course_title: "R Foundations: The Basics"
course_lesson: "2"
course_total: "4"
course_landing: "R-Foundations-Basics-Course.html"
course_next: "Operators-Recycling-and-Coercion.html"
course_prev: "R-Syntax-and-First-Objects.html"
---

=== step === cover
::eyebrow Lesson 2 of 4
## Atomic Vectors and Data Types
Last lesson, every name you made held a single value: one bill, one tip rate. But real data arrives in runs, not singles. This week you kept a weather diary and jotted down each day's high temperature: **31.5, 33.2, 29.8, 30.1, 34.0, 28.6, 27.9** degrees. Seven numbers in a row. In R, that whole row is one object, called a **vector**, and this lesson is about it: how to build one, the handful of types the values inside can be, and the one rule that catches every beginner.

By the end of this lesson you will be able to:

- Build a vector with `c()` and find how many values it holds with `length()`
- Name R's four core types (logical, integer, double, character) and read any value's type with `typeof()`
- Predict what happens when you mix types in one vector, the rule called coercion

**Prerequisites:** just [Lesson 1](R-Syntax-and-First-Objects.html), running a line of R, storing a value with `<-`, calling a function. Nothing else. The box below already holds your week of temperatures; press its Run button any time to see real R run.

::widget vector-coercion {"start":[{"lit":"31.5","type":"double"},{"lit":"33.2","type":"double"},{"lit":"29.8","type":"double"}]}

=== step === concept
::eyebrow The container
## A vector is many values in a row

A single temperature is easy to store: `monday <- 31.5`. But you do not want seven separate names for one week. Instead you collect the values into a single vector with the function `c()`, short for **combine**. You list the values inside the brackets, separated by commas, and R hands you back one object holding them all in order:

```r
temps <- c(31.5, 33.2, 29.8, 30.1, 34.0, 28.6, 27.9)
temps
#> [1] 31.5 33.2 29.8 30.1 34.0 28.6 27.9
```

That `temps` is an **atomic vector**: an ordered run of values, kept in the sequence you gave them. The `[1]` at the start is just R labelling the first value's position, the same position-counter you met in Lesson 1. To ask how many values it holds, call `length()`:

```r
length(temps)
#> [1] 7
```

The same `c()` builds a vector of anything, not just numbers. Here are the matching day-names and a yes/no record of whether it rained, which we will reuse for the rest of the lesson:

```r
days   <- c("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")
rained <- c(FALSE, TRUE, FALSE, FALSE, TRUE, TRUE, FALSE)
length(days)
#> [1] 7
```

Each value sits at a numbered position, 1 through 7. That ordered, indexed run of values is exactly what "vector" means:

::widget process-flow {"steps":[{"title":"31.5","sub":"position 1, Mon"},{"title":"33.2","sub":"position 2, Tue"},{"title":"29.8","sub":"position 3, Wed"},{"title":"30.1","sub":"position 4, Thu"},{"title":"34.0","sub":"position 5, Fri"}]}

=== step === quiz
::eyebrow Check yourself
## How long is the new vector?

Your `temps` vector holds the 7 highs so far. Today's high turned out to be 26.4, so you tack it on with `c(temps, 26.4)`. How many values does the result have?

::quiz {"correct":1,"gate":true,"difficulty":"beginner"}
- 8: `c()` glues the new value onto the end, so 7 plus 1 makes 8 ::ok Right. `c()` flattens everything it is given into one flat vector, so `c(temps, 26.4)` is the 7 old highs followed by the new one: 8 values.
- 2: one vector plus one number makes a pair ::no `c()` does not nest a vector inside a vector. It flattens, so the result is one flat run of all 8 values, not a vector of length 2.
- 1: adding a value overwrites `temps` with just 26.4 ::no Nothing is overwritten here; `c(temps, 26.4)` builds a new, longer vector. It keeps all 7 originals and appends the new value.

=== step === concept
::eyebrow The four types
## Every value has a type

A vector of temperatures, a vector of day-names, and a vector of TRUE/FALSE are clearly different *kinds* of thing. R calls that kind the **type**, and it tracks one for every value. You read it with `typeof()`:

```r
typeof(temps)    # numbers with a decimal part
#> [1] "double"
typeof(days)     # text, always written in quotes
#> [1] "character"
typeof(rained)   # the logical values TRUE and FALSE
#> [1] "logical"
```

There are four core types, and almost every value you meet early on is one of them: **logical** (`TRUE`/`FALSE`), **integer** (whole numbers), **double** (numbers with decimals), and **character** (text in quotes). "Double" is just R's name for an ordinary number; it can hold decimals or whole values alike.

One surprise trips up everyone. Type a plain `7` and R stores it as a **double**, not an integer, because it leaves room for decimals by default. To get a real integer you either add the letter `L`, or let R hand you one: counting things returns integers, so the number of rainy days (a count) comes back as an integer.

```r
typeof(7)             # a bare number is a DOUBLE, even when it looks whole
#> [1] "double"
typeof(7L)            # the L suffix forces a true integer
#> [1] "integer"
typeof(sum(rained))   # sum() counts the TRUEs, and a count is an integer
#> [1] "integer"
```

These four types sit in a fixed order, lowest to highest, which becomes the whole story in two steps' time:

::widget process-flow {"steps":[{"title":"logical","sub":"TRUE or FALSE"},{"title":"integer","sub":"whole numbers, e.g. 7L"},{"title":"double","sub":"numbers with decimals"},{"title":"character","sub":"text in quotes"}]}

=== step === tryit
::eyebrow Your turn
## Read a type for yourself

Here is the `days` vector again. Replace the blank with a call that prints its type. You are expecting `"character"`, because every value is text in quotes.

```r
days <- c("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")
____   # show the type of days (expect "character")
```
::check {"regex":"typeof\\s*[(]\\s*days\\s*[)]","gate":true,"difficulty":"beginner","ok":"Exactly. typeof(days) reports \"character\", because every value in the vector is text in quotes.","no":"Call typeof on the vector: typeof(days)."}
::solution
```r
typeof(days)
#> [1] "character"
```

=== step === concept
::eyebrow The one rule
## A vector holds only one type

Here is the catch hiding in the word *atomic*: an atomic vector can hold exactly **one** type at a time. Every value in it must be the same type. So what happens when you try to mix them? R does not error and it does not keep two types side by side. Instead it quietly **coerces** every value up to a single common type, the lowest one that can represent them all.

Slip a single word in among your temperatures and watch all seven numbers turn into text:

```r
c(31.5, "warm")
#> [1] "31.5" "warm"
```

The `31.5` came back wrapped in quotes: it is now the *characters* `"31.5"`, no longer a number you can do arithmetic on. That is coercion. It climbs a fixed ladder, **logical < integer < double < character**, and the whole vector lands on the highest rung any value reaches. A logical can become a number; a number can become text; text never steps back down.

::widget vector-coercion {}

[KEY INSIGHT]
Mixing types never gives you a mixed vector. R picks the single highest type on the ladder logical < integer < double < character and converts everything to it. Add a piece of text and the entire vector becomes text.

Work it up one rung at a time and you can predict the result every time:

```r
typeof(c(TRUE, 5L))            # logical + integer  -> integer
#> [1] "integer"
typeof(c(TRUE, 5L, 3.5))       # add a double       -> double
#> [1] "double"
typeof(c(TRUE, 5L, 3.5, "x"))  # add text           -> character
#> [1] "character"
```

=== step === quiz
::eyebrow Check yourself
## What type does it become?

You build `c(FALSE, 10L, "north")`, a logical, an integer, and a piece of text in one vector. What single type does the whole vector end up as?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- logical, because `FALSE` comes first and the first value decides ::no Position does not decide the type; the ladder does. `FALSE` (logical) is the *lowest* rung, so it gets coerced up, not the other way around.
- integer, because `10L` is the only proper number ::no The text `"north"` cannot become a number, so the vector cannot be integer. Coercion always goes up to the highest type present, never down to a number.
- character, because text is highest on the ladder so everything becomes text ::ok Right. `"north"` is on the top rung (character), so `FALSE` and `10L` are both coerced to text and the whole vector is `"character"`.

=== step === concept
::eyebrow When it bites
## Coercion is silent, so watch for it

Coercion is useful, but it happens with **no warning**, and that is exactly why it bites. One stray text value, often a stray label or a number that arrived from a spreadsheet, can quietly turn a column of numbers into text. Then your arithmetic breaks, and the error shows up far from the real cause.

The tell is the quotes. A number in quotes is not a number; it is text that merely looks numeric:

```r
typeof("5")          # quotes make it text, even though it reads like a number
#> [1] "character"
```

Try to do maths on it and R refuses, because you cannot add to a piece of text. This is the error you will see (run it in your own R session to confirm):

```r-static
"5" + 1
#> Error in "5" + 1 : non-numeric argument to binary operator
```

[WARNING]
If numbers you expected to add suddenly will not add, suspect coercion. Somewhere a text value sneaked in and pulled the whole vector up to character. Check with `is.numeric()`, and fix it by converting back with `as.numeric()`.

```r
is.numeric(temps)        # are these real numbers?
#> [1] TRUE
is.numeric("5")          # text that only looks numeric is not
#> [1] FALSE
as.numeric("5") + 1      # convert to a number first, then arithmetic works
#> [1] 6
```

=== step === tryit
::eyebrow Put it together
## Rescue numbers stuck as text

A teammate exported the highs from a spreadsheet and they arrived as **text**: `c("31.5", "33.2", "29.8")`. As characters you cannot average them. Replace the blank with a call that converts the vector to real numbers, so its type becomes `"double"`.

```r
text_temps <- c("31.5", "33.2", "29.8")   # readings that arrived as text
typeof(text_temps)                        # "character" - cannot average them yet
____                                      # convert to real numbers (aim: type "double")
```
::check {"regex":"as\\.(numeric|double)\\s*[(]\\s*text_temps\\s*[)]","gate":true,"difficulty":"intermediate","ok":"Exactly. as.numeric(text_temps) rebuilds them as doubles, so mean() and the rest of your maths work again.","no":"Wrap the text vector in as.numeric(): as.numeric(text_temps)."}
::solution
```r
text_temps <- c("31.5", "33.2", "29.8")
as.numeric(text_temps)
#> [1] 31.5 33.2 29.8
```

=== step === concept
::eyebrow Go deeper
## References

A few trustworthy places to take this further, all free:

- [Advanced R (2e): Vectors](https://adv-r.hadley.nz/vectors-chap.html) - the definitive walk through atomic vectors, the four core types, and the coercion rules.
- [An Introduction to R: numbers and vectors](https://cran.r-project.org/doc/manuals/r-release/R-intro.html) - the canonical first treatment of vectors, straight from the R project.
- [R for Data Science (2e): Logical vectors](https://r4ds.hadley.nz/logicals) - a friendly, example-led take on logical values and how they behave.
- [Hands-On Programming with R: R Objects](https://rstudio-education.github.io/hopr/r-objects.html) - a gentle, beginner-first chapter on atomic vectors and types.

=== step === complete
## Lesson 2 complete

You met the workhorse of R, the atomic vector. You built one with `c()`, measured it with `length()`, and read any value's type with `typeof()`: logical, integer, double, and character. Most importantly, you learned the rule that catches everyone: a vector holds only one type, so mixing types coerces the whole vector up the ladder logical < integer < double < character, silently, which is why a stray piece of text can turn your numbers into characters.

Next, Lesson 3: Operators, Recycling, and Coercion. Now that you can build vectors and know their types, you will do real work with them, adding and comparing whole vectors at once, watching R recycle a shorter vector to fit a longer one, and seeing coercion show up again the moment you mix types in a calculation.
