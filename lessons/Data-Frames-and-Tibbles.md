---
title: "R Foundations Lesson 2: Data Frames and Tibbles"
catalog_blurb: "Store data as a table of typed columns, and what a tibble adds."
description: "A data frame stores your data as a table of equal-length, typed columns. Build one in R, index its rows and columns, and see what a tibble adds on top."
keywords: "data frame in R, tibble, data.frame, as_tibble, R columns and rows, data frame indexing, str dim nrow, R for beginners, tidyverse tibble"
post_type: "LESSON"
curriculum_id: "1.2.2"
webr: true
lesson_access: "free"
track: "foundations"
course_id: "nr-structures"
course_title: "R Foundations: Data Structures"
course_lesson: "2"
course_total: "5"
course_landing: "R-Foundations-Structures-Course.html"
course_next: "Inspecting-Data-Structure.html"
course_prev: "Lists-and-Nested-Data.html"
---

=== step === cover
::eyebrow Lesson 2 of 5
## Data Frames and Tibbles
In [Lesson 1](Lists-and-Nested-Data.html) you kept one person's whole record, Maya's name, age and hobbies, inside a single list. But Maya is not hiking alone. Her trail club has four people, and every one of them has the *same* fields: a name, an age, a count of hikes attended, and whether they have paid their dues.

Stack those four records so the fields line up into neat columns, and you get a rectangle: a `name` column, an `age` column, and so on, with one person per row. That rectangle is the **data frame**, the single most important object in all of R, and the shape almost every dataset you will ever load arrives in.

By the end of this lesson you will be able to:

- Build a data frame from equal-length, typed columns and read its shape
- Pull out rows and columns with `$`, `[[ ]]` and two-number `[row, column]` indexing
- Turn it into a **tibble** and say exactly what a tibble changes

**Prerequisites:** you can run a line of R and assign with `<-`, and you know that a [vector holds one type](Atomic-Vectors-and-Data-Types.html) and a [list holds mixed, named slots](Lists-and-Nested-Data.html). The club roster below is the data frame you are about to build, one column at a time.

::widget dataframe-builder {"columns":[{"name":"name","type":"character","values":["Maya","Theo","Ada","Ben"]},{"name":"age","type":"integer","values":[31,27,35,42]},{"name":"visits","type":"integer","values":[12,5,9,20]},{"name":"member","type":"logical","values":["TRUE","FALSE","TRUE","TRUE"]}]}

=== step === concept
::eyebrow The idea
## A data frame is columns of equal length

Here is the precise definition, and it leans on exactly what you learned in Lesson 1. A **data frame is a list of columns**. Each column is a vector, so each column holds a single type: `name` is text, `age` is a whole number, `member` is `TRUE`/`FALSE`. Different columns can be different types, just like the slots of a list.

The one extra rule that turns a list into a table is this: **every column must be the same length.** Four names, four ages, four visit-counts, four membership flags. Because all the columns are the same length, position 1 of every column belongs together (that is Maya's row), position 2 is Theo's row, and so on. Equal-length columns are what make rows exist.

You build one with `data.frame()`, naming each column as you go, exactly like naming list slots:

```r
club <- data.frame(
  name   = c("Maya", "Theo", "Ada", "Ben"),
  age    = c(31L, 27L, 35L, 42L),
  visits = c(12L, 5L, 9L, 20L),
  member = c(TRUE, FALSE, TRUE, TRUE)
)
club
#>   name age visits member
#> 1 Maya  31     12   TRUE
#> 2 Theo  27      5  FALSE
#> 3  Ada  35      9   TRUE
#> 4  Ben  42     20   TRUE
```

The fastest way to see what is inside any data frame is `str()` (for *structure*), the same tool you used on lists. It names each column, its type, and its first values, all in a few lines:

```r
str(club)
#> 'data.frame':	4 obs. of  4 variables:
#>  $ name  : chr  "Maya" "Theo" "Ada" "Ben"
#>  $ age   : int  31 27 35 42
#>  $ visits: int  12 5 9 20
#>  $ member: logi  TRUE FALSE TRUE TRUE
```

Read it as "4 observations (rows) of 4 variables (columns)", then one line per column: name is `chr` (character), age and visits are `int` (integer), member is `logi` (logical). The `$` in front of each name is the same `$` from lists, because a data frame really is a list underneath.

[WARNING]
The equal-length rule is strict. `data.frame(x = 1:3, y = 1:2)` fails with `arguments imply differing number of rows: 3, 2`. R will silently recycle a shorter column only when the longer length is an exact multiple of it (so length 2 into length 4 works, but 2 into 3 errors). When a build fails, mismatched column lengths are the usual culprit.

=== step === widget
::eyebrow Feel it
## Toggle a column, watch the shape

The roster has four columns. Turn one off and the data frame is genuinely different: fewer columns, a new `dim`, and the same equal-length rows. The point to feel is that a data frame is just typed columns clicked together, and you can add or drop a column without disturbing the others. Toggle the buttons below, watch the dimension and the per-column types update, then press **Run** to build that exact data frame in R.

::widget dataframe-builder {"columns":[{"name":"name","type":"character","values":["Maya","Theo","Ada","Ben"]},{"name":"age","type":"integer","values":[31,27,35,42]},{"name":"visits","type":"integer","values":[12,5,9,20]},{"name":"member","type":"logical","values":["TRUE","FALSE","TRUE","TRUE"]}]}

Notice that no matter which columns you keep, every column still has four entries. That is the invariant: drop a column and you lose a *variable*; you never lose a *row* unless you remove an entry from every column at once.

=== step === quiz
::eyebrow Check yourself
## What is a column, really?

Suppose you try to mix a number and a word inside one column, for example a column built from `c(31, "Maya")`. A column is a vector, and you met what vectors do with mixed types in Lesson 1. What actually happens?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- The column keeps them side by side, a number and a word, both in their original types ::no A column is a single vector, and a vector holds exactly one type. It cannot keep a number and a word as-is. To mix types you would use separate columns, or a list-column.
- Both values are coerced to text, `"31"` and `"Maya"`, because a column is one vector of one type ::ok Right. Each column is an atomic vector, so it holds one type only. `c(31, "Maya")` coerces the number up to text. Different types belong in different columns, which is exactly what a data frame is for.
- R refuses to build it and throws an error about mixed types ::no No error: R quietly coerces to a common type (here, character). That silent coercion is precisely why it matters that a column is one-typed.

=== step === concept
::eyebrow Reaching in
## Indexing the grid: rows and columns

A list was one-dimensional: you reached one slot at a time. A data frame has two axes, rows and columns, so it takes two coordinates. The friendly column accessors carry straight over from lists, and then square brackets gain a second slot, written `df[rows, columns]`.

```r
club$visits            # one column by name, returned as a plain vector
#> [1] 12  5  9 20

club[["name"]]         # a column by name with [[ ]], the value inside the slot
#> [1] "Maya" "Theo" "Ada"  "Ben"

club[1, ]              # row 1, all columns: a one-row data frame
#>   name age visits member
#> 1 Maya  31     12   TRUE

club[ , "age"]         # every row, just the age column: a vector
#> [1] 31 27 35 42
```

Leaving a slot empty means "all of it": `club[1, ]` keeps every column of row 1, and `club[ , "age"]` keeps every row of the `age` column. The real power comes from putting a *condition* in the row slot, a logical test that picks rows where it is `TRUE`:

```r
club[club$visits > 8, c("name", "visits")]   # busy members, two columns
#>   name visits
#> 1 Maya     12
#> 3  Ada      9
#> 4  Ben     20
```

Read that inside-out: `club$visits > 8` is a vector of four `TRUE`/`FALSE` values, and the row slot keeps only the rows marked `TRUE`. This row-filter-plus-column-pick is the everyday motion of working with data in R.

[KEY INSIGHT]
`df[rows, columns]` is the whole grammar of a data frame. Either coordinate can be empty (meaning "all"), a name, a number, or a logical test. `df$col` and `df[["col"]]` are just the quick path to a single column.

=== step === tryit
::eyebrow Your turn
## Find the regulars

`club` has a `visits` column counting hikes attended: Maya 12, Theo 5, Ada 9, Ben 20. Use a logical test in the **row** slot to return the names of everyone who came on more than 10 hikes (Maya and Ben). Fill in the blank.

```r
club[____, "name"]   # names of members with more than 10 visits
```
::check {"regex":"club\\s*\\$\\s*visits\\s*>\\s*10","gate":true,"difficulty":"intermediate","ok":"Exactly. club$visits > 10 is a TRUE/FALSE vector; the row slot keeps the TRUE rows, and \"name\" picks the column. You get Maya and Ben.","no":"Put a logical test in the row slot: club[club$visits > 10, \"name\"]."}
::solution
```r
club[club$visits > 10, "name"]
#> [1] "Maya" "Ben"
```

=== step === concept
::eyebrow The upgrade
## What a tibble adds

A `data.frame` works, but it carries a few rough edges from R's early days. The **tibble** is a modern data frame from the tidyverse: same rectangle of typed columns, with safer, friendlier defaults. You make one with `tibble()` directly, or convert an existing data frame with `as_tibble()`:

```r
library(tibble)
club_tbl <- as_tibble(club)
club_tbl
#> # A tibble: 4 x 4
#>   name    age visits member
#>   <chr> <int>  <int> <lgl>
#> 1 Maya     31     12 TRUE
#> 2 Theo     27      5 FALSE
#> 3 Ada      35      9 TRUE
#> 4 Ben      42     20 TRUE
```

Look at what the printout tells you for free: the dimensions (`4 x 4`) up top, and each column's type right under its name (`<chr>`, `<int>`, `<lgl>`). A plain data frame prints none of that, and a big one floods your screen with every row. A tibble shows only what fits and reports the rest.

The second difference bites people in real code. Ask a base data frame for a single column with single brackets and it quietly drops the table, handing back a bare vector. A tibble keeps the table:

```r
class(club[ , "name"])        # base data.frame: dropped to a vector
#> [1] "character"
class(club_tbl[ , "name"])    # tibble: still a table
#> [1] "tbl_df"     "tbl"        "data.frame"
```

That "helpful" drop in base R is a classic source of bugs, code that expected a one-column table and got a vector instead. A tibble never surprises you that way, and it never silently turns your text columns into factors either.

=== step === quiz
::eyebrow Check yourself
## Is a tibble a different kind of thing?

A colleague says: "I cannot pass a tibble to base functions like `nrow()` or `lm()`, a tibble is a separate object." Are they right?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Yes, a tibble is its own object type, so base functions reject it until you convert it back ::no They do not reject it. A tibble inherits from `data.frame`, so anything that accepts a data frame accepts a tibble unchanged.
- No, a tibble IS a data frame (it inherits from one); it only changes the printing and a few subsetting defaults ::ok Exactly. `is.data.frame(club_tbl)` is `TRUE`. A tibble is a data frame with safer defaults, so `nrow()`, `lm()` and the rest work on it directly.
- Only the tidyverse functions like `filter()` accept tibbles; base R cannot read them at all ::no Base R reads tibbles fine, because a tibble still is a data frame. The tidyverse verbs simply prefer to return tibbles.

=== step === concept
::eyebrow Which to use
## Both are data frames, so which?

Because a tibble *is* a data frame, you rarely have to choose carefully, and you can move between them at will.

- **Base `data.frame()`** ships with R, needs no packages, and is everywhere in older code and base examples.
- **`tibble()`** comes with the tidyverse and adds the guardrails you just saw: typed compact printing, no surprise coercion, and single-bracket subsetting that keeps the table.
- You will meet both constantly. Reading a CSV with the tidyverse hands you a tibble; many built-in datasets and base functions hand you a plain data frame. `as_tibble()` and `as.data.frame()` convert either way in one step.

[KEY INSIGHT]
The one real gotcha is the single-bracket drop: old code that relies on `df[ , 1]` returning a vector behaves differently on a tibble, which returns a one-column tibble. When you want one column as a vector and want to be sure, ask for it explicitly with `df[["col"]]` or `df$col`, which behave the same on both.

=== step === concept
::eyebrow Go deeper
## References

A few trustworthy places to take this further, all free:

- [tibble: the tibble vignette](https://tibble.tidyverse.org/articles/tibble.html) - what a tibble changes versus `data.frame`, straight from the package authors.
- [Advanced R (2e): Data frames and tibbles](https://adv-r.hadley.nz/vectors-chap.html) - the precise structure (a named list of equal-length vectors) and the differences a tibble introduces.
- [An Introduction to R: Data frames](https://cran.r-project.org/doc/manuals/r-release/R-intro.html#Data-frames) - the canonical base-R treatment from the R project itself.
- [R for Data Science (2e): Data transformation](https://r4ds.hadley.nz/data-transform) - working with data frames and tibbles in everyday analysis.

=== step === complete
## Lesson 2 complete

You met R's workhorse object, the data frame: a list of equal-length, typed columns that line up into rows. You built the club roster with `data.frame()`, read its shape with `str()`, and indexed it on two axes with `$`, `[[ ]]` and `df[rows, columns]`, including a logical row filter. Then you upgraded it to a **tibble** and named what it adds: typed compact printing, single-bracket subsetting that keeps the table, and no silent coercion, all while still being a data frame.

Next, Lesson 3: Inspecting Data Structure. Now that you can build these objects, you will learn to walk up to *any* object R hands you, a vector, a list, a data frame, a model result, and read its shape at a glance with `str()`, `class()`, `length()`, `dim()`, `names()` and `attributes()`.
