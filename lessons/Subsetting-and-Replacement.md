---
title: "R Foundations Lesson 1: Subsetting and Replacement"
catalog_blurb: "Pull out and overwrite exactly the values you want from any object."
description: "Reach into any R object and change it: positive, negative, logical and named indices, single vs double brackets and the dollar sign, and replacing values in place."
keywords: "subsetting in R, R indexing, logical indexing, negative indexing, single vs double bracket, dollar sign R, replacement assignment, subset data frame, R for beginners"
post_type: "LESSON"
curriculum_id: "1.3.1"
webr: true
lesson_access: "free"
track: "foundations"
course_id: "nr-programming"
course_title: "R Foundations: Programming"
course_lesson: "1"
course_total: "5"
course_landing: "R-Foundations-Programming-Course.html"
course_next: "Control-Flow-in-R.html"
course_prev: ""
---

=== step === cover
::eyebrow Lesson 1 of 5
## Subsetting and Replacement

You are tutoring a small weekend R study group. Five friends, Mara, Dev, Ada, Theo and Iris, just took a quiz graded out of 100, and you have their scores: 58, 91, 73, 49 and 84. Almost everything you will ever do with data comes down to two moves. First, reaching in to pull out the pieces you want: the top scorers, the ones who need help, one person's result. Second, writing new values back in: fixing a mis-marked answer, applying a grade floor. Those two moves are **subsetting** (reading a part) and **replacement** (writing a part), and this lesson is about doing both cleanly.

By the end of this lesson you will be able to:

- Pull elements out of a vector with `[` using positions, a "drop these" minus sign, a TRUE/FALSE condition, and names
- Tell `[` (keeps the container) apart from `[[` and `$` (hand you the one thing inside)
- Subset a data frame by rows and columns, and overwrite exactly the values you choose

**Prerequisites:** you can build a [vector](Atomic-Vectors-and-Data-Types.html), a [list](Lists-and-Nested-Data.html) and a [data frame](Data-Frames-and-Tibbles.html), and you have met R's [comparison operators](Operators-Recycling-and-Coercion.html) like `>=` and `==`.

::widget table-transform {"code":"gradebook[gradebook$score >= 60, ]","caption":"The payoff: one condition inside the brackets keeps only the rows you want, here the students who passed.","before":{"cols":["name","score"],"rows":[["Mara",58],["Dev",91],["Ada",73],["Theo",49],["Iris",84]]},"after":{"cols":["name","score"],"rows":[["Dev",91],["Ada",73],["Iris",84]]}}

=== step === concept
::eyebrow Pull by position
## The square bracket picks elements out

The single square bracket, `[ ]`, is how you reach into a vector and pull elements out. You write the vector, then in the brackets you say which elements you want. The simplest "which" is a position number.

First, build the scores once. Each lesson runs in a fresh R session, so we create the data right here (run this):

```r
scores <- c(Mara = 58, Dev = 91, Ada = 73, Theo = 49, Iris = 84)
scores
#> Mara  Dev  Ada Theo Iris 
#>   58   91   73   49   84
```

These scores have **names** (the friends), printed above each value. Now pull Dev out. Dev is the 2nd element, so ask for position 2:

```r
scores[2]
#> Dev 
#>  91
```

To pull out several at once, put a vector of positions inside the brackets. `c(1, 3)` gives the 1st and 3rd; the colon `2:4` is shorthand for "2, 3, 4":

```r
scores[c(1, 3)]   # Mara and Ada
#> Mara  Ada 
#>   58   73
scores[2:4]       # Dev, Ada, Theo
#>  Dev  Ada Theo 
#>   91   73   49
```

[KEY INSIGHT]
`scores[i]` returns a **vector**, the same kind of thing you started with, just shorter. It can hold zero, one, or many elements depending on what you ask for. That "keeps the container" idea matters later when we meet the double bracket.

=== step === concept
::eyebrow Drop, test, and name
## Three more ways to say "which"

A position number says "give me this one." Three other kinds of index are far more useful in practice.

**A minus sign drops positions.** `scores[-4]` means "everything except the 4th." The minus is not a value to look up; it removes that position. This is how you say "all the others":

```r
scores[-4]        # everyone except Theo (position 4)
#> Mara  Dev  Ada Iris 
#>   58   91   73   84
scores[-c(4, 5)]  # drop the last two
#> Mara  Dev  Ada 
#>   58   91   73
```

**A TRUE/FALSE vector keeps the TRUEs.** This is the workhorse. A comparison like `scores >= 60` produces one TRUE or FALSE per element. Put that vector in the brackets and R keeps only the elements lined up with a TRUE:

```r
scores >= 60            # the test result: one logical per student
#> Mara   Dev   Ada  Theo  Iris 
#> FALSE  TRUE  TRUE FALSE  TRUE
scores[scores >= 60]    # keep only the TRUE ones: the students who passed
#>  Dev  Ada Iris 
#>   91   73   84
```

**A name selects by name.** Because the scores are named, you can ask for `"Dev"` directly instead of counting to position 2:

```r
scores["Dev"]
#> Dev 
#>  91
scores[c("Mara", "Iris")]
#> Mara Iris 
#>   58   84
```

[WARNING]
A logical index should be the **same length** as the vector. If it is shorter, R silently **recycles** it, reusing it from the start, which quietly returns the wrong elements. Build the condition from the vector itself (`scores >= 60`) and it always lines up.

=== step === quiz
::eyebrow Check yourself
## Which line returns the passing scores?

You want the **scores themselves** of everyone who passed (60 or more), not just a column of TRUE/FALSE. Which line does that?

::quiz {"correct":1,"gate":true,"difficulty":"beginner"}
- `scores[scores >= 60]` ::ok Right. The condition goes inside the brackets, so R keeps the elements where it is TRUE and hands you those scores.
- `scores >= 60` ::no That on its own returns the TRUE/FALSE test result, not the scores. You still have to put it inside `scores[ ... ]` to pull the elements out.
- `scores[>= 60]` ::no R cannot read a bare condition in the brackets. It needs a full logical vector, which you get by writing `scores >= 60` first.

=== step === tryit
::eyebrow Your turn
## Find the students who need help

The friends who scored **below 60** need a follow-up session. Replace the blank so the line returns just their scores from `scores`. (You should get back Mara and Theo.)

```r
scores <- c(Mara = 58, Dev = 91, Ada = 73, Theo = 49, Iris = 84)
____   # the scores below 60
```
::check {"regex":"scores\\s*[[]\\s*scores\\s*<\\s*60\\s*\\]","gate":true,"difficulty":"beginner","ok":"Exactly. scores < 60 builds the TRUE/FALSE test, and putting it inside scores[ ... ] keeps just the failing scores, Mara and Theo.","no":"Build the condition, then index with it: scores[scores < 60]."}
::solution
```r
scores[scores < 60]
#> Mara Theo 
#>   58   49
```

=== step === concept
::eyebrow One thing, or the box around it
## Single bracket vs double bracket

So far `[ ]` always handed back a vector. But sometimes you want the one element *inside*, not a smaller container holding it. That is the difference between the single bracket `[ ]` and the double bracket `[[ ]]`.

Think of a spice rack. `rack[1]` gives you the rack with only the first jar in it, still a rack. `rack[[1]]` reaches in and hands you the jar itself. Lists make the difference visible. Build one student's record, which mixes a name, a vector of three quiz attempts, and a TRUE/FALSE:

```r
student <- list(name = "Dev", scores = c(91, 88, 95), passed = TRUE)
student[["name"]]    # reach in: the value itself
#> [1] "Dev"
student["name"]      # keep the container: a one-item list
#> $name
#> [1] "Dev"
```

They look similar but are different types. Ask R what each one *is*:

```r
class(student[["name"]])   # the thing inside
#> [1] "character"
class(student["name"])     # a list holding the thing
#> [1] "list"
```

The dollar sign `$` is a friendly shorthand for `[[` by name. These two lines are identical, and you can keep drilling, here taking the 2nd quiz attempt:

```r
student$scores       # same as student[["scores"]]
#> [1] 91 88 95
student$scores[2]    # drill into scores, then index position 2
#> [1] 88
```

[WARNING]
`$` only works with a name you type literally. If the name is stored in a variable, `$` will not use it, so reach for `[[`: with `col <- "scores"`, use `student[[col]]`, not `student$col`. Also, `$` on a name that does not exist returns `NULL` with no error, an easy bug to miss.

=== step === concept
::eyebrow Rows and columns
## Subsetting a data frame

A data frame is the table you will spend most of your time in. It is subset with **two** indices inside one bracket pair: `df[rows, cols]`, rows first, columns second. Build the gradebook, then take a slice:

```r
gradebook <- data.frame(
  name     = c("Mara", "Dev", "Ada", "Theo", "Iris"),
  score    = c(58, 91, 73, 49, 84),
  attended = c(8, 10, 9, 5, 10),
  stringsAsFactors = FALSE
)
gradebook[c(2, 5), c("name", "score")]   # rows 2 and 5, two columns
#>   name score
#> 2  Dev    91
#> 5 Iris    84
```

Leave a slot **blank** to mean "all of them." `gradebook[1, ]` is the whole first row; `gradebook[, "score"]` is the whole score column. A single column comes back as a plain vector, while `$` and `[[` do the same:

```r
gradebook[1, ]            # all columns of row 1
#>   name score attended
#> 1 Mara    58        8
gradebook$score           # the column, as a vector (same as gradebook[["score"]])
#> [1] 58 91 73 49 84
```

The logical-index trick scales straight up to rows: a condition in the **row** slot filters the table. That is the line from the cover:

```r
gradebook[gradebook$score >= 60, ]   # keep the rows where score passed
#>   name score attended
#> 2  Dev    91       10
#> 3  Ada    73        9
#> 5 Iris    84       10
```

::widget table-transform {"code":"gradebook[c(2, 5), c(\"name\", \"score\")]","caption":"Two indices in one bracket pair: pick rows 2 and 5, and keep only the name and score columns.","before":{"cols":["name","score","attended"],"rows":[["Mara",58,8],["Dev",91,10],["Ada",73,9],["Theo",49,5],["Iris",84,10]]},"after":{"cols":["name","score"],"rows":[["Dev",91],["Iris",84]]}}

[WARNING]
Pulling a single column with `gradebook[, "score"]` **drops** it to a vector. If you need it to stay a one-column data frame, say `gradebook[, "score", drop = FALSE]`. The single bracket `gradebook["score"]` (no comma) also keeps it a data frame.

=== step === quiz
::eyebrow Check yourself
## Plain vector, or one-column table?

From the `gradebook` data frame, which expression gives you the score column as a **plain numeric vector**, not a one-column data frame?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- `gradebook[["score"]]` ::ok Right. The double bracket (like `gradebook$score`) reaches in and hands back the column itself, a numeric vector.
- `gradebook["score"]` ::no The single bracket keeps the container, so you get a one-column data frame back, not the bare vector. Same spice-rack rule as lists.
- `gradebook[, "score", drop = FALSE]` ::no `drop = FALSE` deliberately KEEPS it a one-column data frame, the opposite of what you want here.

=== step === concept
::eyebrow Write it back
## Replacement: a subset on the left of the arrow

Here is the move that ties everything together. **Any subset you can read, you can also write to** by putting it on the left of the assignment arrow `<-`. R writes the right-hand values into exactly the positions the subset picked out.

Start with a department rule: nobody scores below 60. Select the failing scores with the same logical index as before, but this time assign to them. The single value 60 on the right is **recycled** to fill every matched position:

```r
scores[scores < 60] <- 60   # bump every failing score up to the floor
scores
#> Mara  Dev  Ada Theo Iris 
#>   60   91   73   60   84
```

Mara (58) and Theo (49) were both pulled up to 60; everyone else was untouched. You can also write to a single element by name, say Theo's quiz was re-marked to 67:

```r
scores["Theo"] <- 67
scores
#> Mara  Dev  Ada Theo Iris 
#>   60   91   73   67   84
```

The same idea adds a **new column**: assign to a column name that does not exist yet and R creates it. Here `ifelse()` returns "pass" or "fail" per row:

```r
gradebook$grade <- ifelse(gradebook$score >= 60, "pass", "fail")
gradebook
#>   name score attended grade
#> 1 Mara    58        8  fail
#> 2  Dev    91       10  pass
#> 3  Ada    73        9  pass
#> 4 Theo    49        5  fail
#> 5 Iris    84       10  pass
```

::widget table-transform {"code":"gradebook$grade <- ifelse(gradebook$score >= 60, \"pass\", \"fail\")","caption":"Assigning to a column name that does not exist yet creates it: a new grade column appears, filled row by row.","before":{"cols":["name","score"],"rows":[["Mara",58],["Dev",91],["Ada",73],["Theo",49],["Iris",84]]},"after":{"cols":["name","score","grade"],"rows":[["Mara",58,"fail"],["Dev",91,"pass"],["Ada",73,"pass"],["Theo",49,"fail"],["Iris",84,"pass"]]}}

=== step === tryit
::eyebrow Put it together
## Apply a grade floor to the table

The same 60-point floor now has to be applied to the **gradebook's `score` column**, not the standalone `scores` vector. Select the failing scores inside the column and assign 60 to them. Replace the blank, then check. (Mara and Theo should land on 60.)

```r
gradebook <- data.frame(name = c("Mara", "Dev", "Ada", "Theo", "Iris"),
                        score = c(58, 91, 73, 49, 84),
                        attended = c(8, 10, 9, 5, 10),
                        stringsAsFactors = FALSE)
____   # bump every score below 60 up to 60, in the score column
gradebook$score
```
::check {"regex":"gradebook\\$score\\s*[[]\\s*gradebook\\$score\\s*<\\s*60\\s*\\]\\s*<-\\s*60","gate":true,"difficulty":"intermediate","ok":"That is the whole lesson in one line: reach into gradebook$score, pick the failing values with a logical index, and write 60 into exactly those positions.","no":"Index the column with a condition, then assign: gradebook$score[gradebook$score < 60] <- 60."}
::solution
```r
gradebook$score[gradebook$score < 60] <- 60
gradebook$score
#> [1] 60 91 73 60 84
```

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take subsetting further, all free:

- [Advanced R (2e): Subsetting](https://adv-r.hadley.nz/subsetting.html) - the definitive treatment of `[`, `[[` and `$`, including the spice-rack distinction.
- [An Introduction to R: Index vectors](https://cran.r-project.org/doc/manuals/r-release/R-intro.html#Index-vectors) - the official manual on the four ways to select a subset.
- [The R Language Definition: Indexing](https://cran.r-project.org/doc/manuals/r-release/R-lang.html#Indexing) - the precise, formal rules for every index type and for replacement.
- [Hands-On Programming with R: Modifying values](https://rstudio-education.github.io/hopr/modify.html) - a gentle, beginner-first walk through `x[i] <- value`.

=== step === complete
## Lesson 1 complete

You can now reach into any R object and change it. You pulled elements from a vector by position, with a "drop these" minus sign, with a TRUE/FALSE condition, and by name; you separated `[` (which keeps the container) from `[[` and `$` (which hand you the one thing inside); you sliced a data frame by rows and columns; and you put any subset on the left of `<-` to overwrite exactly the values you chose, including a whole column at once.

Next, Lesson 2: Control Flow in R. Subsetting let you pick the right rows; control flow lets your code make decisions and repeat work, with `if`/`else` to branch and `for`/`while` loops to run a step many times, watched one iteration at a time.
