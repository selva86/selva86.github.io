---
title: "R Foundations Lesson 3: Inspecting Data Structure"
catalog_blurb: "Read the type, size and structure of any object R hands you."
description: "Walk up to any R object and read its shape with str, class, typeof, length, dim, names and attributes. The one-line inspection toolkit, taught from scratch."
keywords: "str in R, class vs typeof, attributes in R, dim nrow ncol, names function, inspect R object, R data structure, R for beginners"
post_type: "LESSON"
curriculum_id: "1.2.3"
webr: true
lesson_access: "free"
track: "foundations"
course_id: "nr-structures"
course_title: "R Foundations: Data Structures"
course_lesson: "3"
course_total: "5"
course_landing: "R-Foundations-Structures-Course.html"
course_next: "Matrices-and-Arrays.html"
course_prev: "Data-Frames-and-Tibbles.html"
---

=== step === cover
::eyebrow Lesson 3 of 5
## Inspecting Data Structure
In [Lesson 2](Data-Frames-and-Tibbles.html) you *built* the trail-club roster yourself, so you knew its shape by heart. But most of the time an object just lands in your lap: you read a CSV, or you call a function and it hands something back, and you have no idea what you are holding. Is it a vector or a table? How big is it? What is inside?

This lesson is the **inspector's toolkit**: six small functions that answer the six questions you ask of *any* R object, no matter how strange. Type one of them and the object tells you exactly what it is.

By the end of this lesson you will be able to:

- Read any object's shape at a glance with `str()`
- Tell `class()` (the kind R treats it as) from `typeof()` (the storage underneath)
- Measure size correctly with `length()`, `dim()`, `nrow()` and `ncol()`, and list its parts with `names()` and `attributes()`

**Prerequisites:** you can run a line of R and assign with `<-`, and you know that a [vector holds one type](Atomic-Vectors-and-Data-Types.html), a [list holds mixed named slots](Lists-and-Nested-Data.html), and a [data frame is a list of equal-length columns](Data-Frames-and-Tibbles.html). The club roster below is the object you are about to x-ray.

::widget dataframe-builder {"columns":[{"name":"name","type":"character","values":["Maya","Theo","Ada","Ben"]},{"name":"age","type":"integer","values":[31,27,35,42]},{"name":"visits","type":"integer","values":[12,5,9,20]},{"name":"member","type":"logical","values":["TRUE","FALSE","TRUE","TRUE"]}]}

=== step === concept
::eyebrow The one tool to reach for first
## str() shows you the whole shape in one glance

When an unfamiliar object lands in front of you, the first thing to type is `str()`, short for *structure*. It prints a compact map: the kind of object, how big it is, and the type and first few values of every part, all in a handful of lines, without flooding your screen.

Let us build this club roster for real and look at it. Each lesson runs in a fresh R session, so we make the data right here (run it once, then the later steps can inspect it). Notice we slip in one new column, `level`, an ordered *factor* of skill grades, so you can see how `str()` reports a trickier type too.

```r
club <- data.frame(
  name   = c("Maya", "Theo", "Ada", "Ben"),
  age    = c(31L, 27L, 35L, 42L),
  visits = c(12L, 5L, 9L, 20L),
  level  = factor(c("intermediate", "beginner", "advanced", "advanced"),
                  levels = c("beginner", "intermediate", "advanced"),
                  ordered = TRUE),
  member = c(TRUE, FALSE, TRUE, TRUE)
)
str(club)
#> 'data.frame':	4 obs. of  5 variables:
#>  $ name  : chr  "Maya" "Theo" "Ada" "Ben"
#>  $ age   : int  31 27 35 42
#>  $ visits: int  12 5 9 20
#>  $ level : Ord.factor w/ 3 levels "beginner"<"intermediate"<..: 2 1 3 3
#>  $ member: logi  TRUE FALSE TRUE TRUE
```

Read that top line as a headline: it is a `data.frame` with **4 obs.** (4 observations, the rows) **of 5 variables** (the columns). Then one line per column: `name` is `chr` (character), `age` and `visits` are `int` (integer), `level` is an ordered factor with 3 levels, and `member` is `logi` (logical). In six lines you know the whole object.

The real point of `str()` is that it does not care what you give it. The same call maps a bare vector, a list, anything:

```r
str(club$visits)   # a plain integer vector: type, length, first values
#>  int [1:4] 12 5 9 20

str(list(name = "Maya", age = 31, hobbies = c("hiking", "cello")))
#> List of 3
#>  $ name   : chr "Maya"
#>  $ age    : num 31
#>  $ hobbies: chr [1:2] "hiking" "cello"
```

[TIP]
`str()` is the single most useful thing to type when you meet an object you do not recognise. Reach for it before anything else; the rest of this lesson zooms in on the individual questions it answers.

=== step === quiz
::eyebrow Check yourself
## Read the headline

You run `str(club)` and the top line reads `'data.frame': 4 obs. of 5 variables`. Without running anything else, how many rows and columns does `club` have?

::quiz {"correct":1,"gate":true,"difficulty":"beginner"}
- 4 rows and 5 columns: "obs." (observations) are the rows, "variables" are the columns ::ok Right. `str()` reports rows as observations and columns as variables, so 4 obs. of 5 variables means 4 rows and 5 columns. You read the whole shape off one line.
- 5 rows and 4 columns ::no You have them swapped. "obs." (observations) count the rows and "variables" count the columns, so it is 4 rows and 5 columns.
- You cannot tell from `str()`; you must run `nrow()` and `ncol()` ::no `str()` already tells you: the headline "4 obs. of 5 variables" is exactly the row and column count. The dedicated functions just return those same numbers on their own.

=== step === concept
::eyebrow Two different questions
## class() is the kind; typeof() is the storage

There are two ways to ask "what type is this?", and they answer different questions. `class()` tells you the **kind of thing R treats the object as**, the label that decides how functions behave toward it. `typeof()` tells you the **raw storage type underneath**, what the object is really made of.

For most simple vectors they agree, but for the interesting objects they split apart, and that gap explains a lot of R:

```r
class(club)     # the KIND: how R treats it
#> [1] "data.frame"
typeof(club)    # the STORAGE: a data frame is really a list of columns
#> [1] "list"
```

A data frame *is* a list underneath (exactly as you saw in Lesson 2), but it carries the `class` "data.frame" so that printing, `[ , ]` indexing and `nrow()` all behave table-like. The `level` factor is the same story, even more striking:

```r
class(club$level)   # the KIND: an ordered factor
#> [1] "ordered" "factor"
typeof(club$level)  # the STORAGE: plain integers pointing at the labels
#> [1] "integer"
```

A factor looks like words on screen, but it is stored as integer codes (`2 1 3 3`) plus a list of labels. Its `class` is what makes it print and behave as categories. So `class()` answers "how does R treat this?" and `typeof()` answers "what is it built from?"

[KEY INSIGHT]
`class()` can even return several values (here `"ordered" "factor"`): R tries each class in turn to find a matching behaviour. `typeof()` always returns exactly one base storage type. When code behaves oddly, check `class()`; when you care how data is actually held, check `typeof()`.

=== step === quiz
::eyebrow Check yourself
## Same answer, or different?

`class(club)` returns `"data.frame"`. What does `typeof(club)` return, and why?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- `"data.frame"` as well, because `class()` and `typeof()` are two names for the same check ::no They ask different questions. `typeof()` reports the base storage, which for a data frame is `"list"`. They only agree on simple vectors.
- `"list"`, because a data frame is stored as a list of equal-length columns underneath ::ok Exactly. The `class` is `"data.frame"` (how R treats it), but the storage is a list of columns, so `typeof(club)` is `"list"`. That split is why `$` reaches a column just like a list slot.
- `"double"`, because the numeric columns dominate the object's storage type ::no No single column wins. The object itself is stored as a list of columns, so `typeof(club)` is `"list"`, whatever the columns happen to hold.

=== step === concept
::eyebrow How big is it?
## length() for one dimension, dim() for two

Size has two flavours, and picking the wrong tool is a classic beginner trap. A one-dimensional thing (a vector) has a `length()`, the count of its elements. A two-dimensional thing (a data frame or matrix) has a `dim()`, its rows and columns.

The catch: a data frame is a list of columns, so `length()` of a data frame counts its **columns**, not its rows. That surprises everyone once.

```r
length(club$visits)   # a 1-D vector: how many elements
#> [1] 4

length(club)          # a data frame is a LIST of columns -> counts COLUMNS
#> [1] 5
```

For a table you almost always want `dim()`, or the two named shortcuts `nrow()` and `ncol()`, which are never ambiguous:

```r
dim(club)             # rows, then columns
#> [1] 4 5
nrow(club)            # rows only
#> [1] 4
ncol(club)            # columns only
#> [1] 5
```

And the flip side: a plain vector has no second dimension, so asking for its `dim()` gives you `NULL`, R's way of saying "there is nothing here". That `NULL` is a useful signal that you are holding a 1-D object, not a table.

```r
dim(club$visits)      # a 1-D vector has no dimensions
#> NULL
```

[WARNING]
`length()` of a data frame is its column count, not its row count. To count rows (the usual question, "how many records do I have?"), use `nrow()`. Reaching for `length()` on a table is one of the most common quiet mistakes in beginner R.

=== step === tryit
::eyebrow Your turn
## Count the people, not the columns

`club` has 5 columns and 4 people, so `length(club)` returns the misleading `5`. You want the number of **rows**, one per club member. Replace the blank with the function that counts rows.

```r
# length(club) is 5 (columns). Return the number of ROWS instead:
____(club)
```
::check {"regex":"nrow\\s*[(]\\s*club","gate":true,"difficulty":"beginner","ok":"Exactly. nrow(club) returns 4, one per club member. nrow() always means rows, with no list-versus-table ambiguity.","no":"Use nrow(): nrow(club) returns the row count (4). length(club) would give the column count instead."}
::solution
```r
nrow(club)
#> [1] 4
```

=== step === concept
::eyebrow The labels and the hidden metadata
## names() lists the parts; attributes() reveals everything

Two questions remain: what are the parts *called*, and what extra information is R quietly stashing on the object? `names()` answers the first, returning the labels, the column names of a data frame or the slot names of a list:

```r
names(club)           # the column labels
#> [1] "name"   "age"    "visits" "level"  "member"
```

`attributes()` answers the second, and it is the deepest look of all. Every R object is really **its data plus a set of attributes**, little tags of metadata hanging off it. `attributes()` shows them all at once:

```r
attributes(club)      # all the metadata R keeps about the object
#> $names
#> [1] "name"   "age"    "visits" "level"  "member"
#>
#> $class
#> [1] "data.frame"
#>
#> $row.names
#> [1] 1 2 3 4
```

Look closely: the column names you got from `names()`, and the `class` you got from `class()`, are **both just attributes**. So is a data frame's `row.names`, and so are a factor's levels:

```r
attributes(club$level)   # a factor is integers + two attributes
#> $levels
#> [1] "beginner"     "intermediate" "advanced"
#>
#> $class
#> [1] "ordered" "factor"
```

[KEY INSIGHT]
This is the idea that unifies the whole toolkit: an object is **data + attributes**. `class()`, `dim()`, `names()` and a factor's `levels` are not separate magic, they are all attributes, and `attributes()` is the one call that lays them all bare. `str()` is really just a friendly summary of the data and these attributes together.

=== step === widget
::eyebrow Feel it
## Watch the shape change as you edit the columns

Here is the roster again, but now you can take it apart. Toggle a column off and the object is genuinely different: a new `dim`, a shorter `names`, one fewer type in the list, the same equal-length rows. That is exactly what your toolkit reports. Toggle the buttons, watch the dimension and the per-column types update, then press **Run** to inspect that exact data frame with `str()`.

::widget dataframe-builder {"columns":[{"name":"name","type":"character","values":["Maya","Theo","Ada","Ben"]},{"name":"age","type":"integer","values":[31,27,35,42]},{"name":"visits","type":"integer","values":[12,5,9,20]},{"name":"member","type":"logical","values":["TRUE","FALSE","TRUE","TRUE"]}]}

Drop a column and you lose a *variable* (the `names` shrink, `ncol` falls by one); every remaining column still has the same number of rows. The shape you read with `dim()`, `names()` and `str()` is just this picture in words.

=== step === tryit
::eyebrow Your turn
## X-ray an object you did not build

Now the payoff: the toolkit reads *anything*, even an object you never made by hand. Fit a simple model and inspect it. First, run this to see what a fitted model actually is:

```r
fit <- lm(mpg ~ wt, data = mtcars)   # a fitted model from a built-in dataset
class(fit)    # the KIND
#> [1] "lm"
typeof(fit)   # the STORAGE
#> [1] "list"
```

A fitted model is just a **list** under the hood, with the class `"lm"`. So you reach inside it exactly like Maya's list in Lesson 1: list its parts with `names()`, then pull one out with `$`. Replace the blank to grab the estimated coefficients.

```r
names(fit)        # what parts does the model hold?
fit$____          # pull out the estimated coefficients (the slope and intercept)
```
::check {"regex":"fit\\s*\\$\\s*coef","gate":true,"difficulty":"intermediate","ok":"Exactly. names(fit) lists the parts, and fit$coefficients pulls out the intercept and slope. A model is a list, so the same $ from Lesson 1 opens it up.","no":"The piece is called coefficients: write fit$coefficients (names(fit) shows it in the list of parts)."}
::solution
```r
names(fit)
#> [1] "coefficients"  "residuals"     "effects"       "rank"
#> [5] "fitted.values" "assign"        "qr"            "df.residual"
#> [9] "xlevels"       "call"          "terms"         "model"
fit$coefficients
#> (Intercept)          wt
#>   37.285126   -5.344472
```

=== step === concept
::eyebrow Go deeper
## References

A few trustworthy places to take this further, all free:

- [The R Language Definition: Objects](https://cran.r-project.org/doc/manuals/r-release/R-lang.html#Objects) - the definitive account of R's types, modes and attributes, straight from the R project.
- [An Introduction to R: Objects, their modes and attributes](https://cran.r-project.org/doc/manuals/r-release/R-intro.html#Objects) - the canonical first treatment of `class`, `typeof` and attributes.
- [Advanced R (2e): Vectors](https://adv-r.hadley.nz/vectors-chap.html) - how attributes, the S3 `class`, and the data-frame-as-list view all fit together.
- [R for Data Science (2e): Base R](https://r4ds.hadley.nz/base-r) - inspecting and reaching into objects in everyday analysis.

=== step === complete
## Lesson 3 complete

You now have the inspector's toolkit for *any* R object. `str()` gives the one-glance map; `class()` and `typeof()` separate the kind from the storage; `length()`, `dim()`, `nrow()` and `ncol()` measure size (remembering that `length()` of a data frame counts columns); and `names()` plus `attributes()` reveal the labels and the hidden metadata, the realisation that every object is just **data + attributes**. You even x-rayed a fitted model and found it was a list all along.

Next, Lesson 4: Matrices and Arrays. You will meet R's other rectangle, the all-one-type grid: how to build it, index it by row and column, and reduce it with `apply()`.
