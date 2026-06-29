---
title: "R Foundations Lesson 1: Lists and Nested Data"
catalog_blurb: "Hold mixed, nested data in one object, and reach any piece of it."
description: "Meet the R list: one object that holds mixed types and even other lists. Build one, reach inside with the dollar sign, double and single brackets, and walk nested data."
keywords: "lists in R, R list, nested list, list indexing in R, double bracket vs single bracket, dollar sign accessor, str function, R for beginners"
post_type: "LESSON"
curriculum_id: "1.2.1"
webr: true
lesson_access: "free"
track: "foundations"
course_id: "nr-structures"
course_title: "R Foundations: Data Structures"
course_lesson: "1"
course_total: "5"
course_landing: "R-Foundations-Structures-Course.html"
course_next: "Data-Frames-and-Tibbles.html"
course_prev: ""
---

=== step === cover
::eyebrow Lesson 1 of 5
## Lists and Nested Data
A [vector](Atomic-Vectors-and-Data-Types.html) is strict: every value in it must be the same type, so the moment you mix a word in with your numbers, R quietly turns them all into text. But real records are not all one type. Think of Maya: her name is text, her age is a number, her hobbies are several words, and her address is a little record of its own. To keep all of that in one place, R gives you the **list**: a container with named slots that can hold anything, even other lists.

By the end of this lesson you will be able to:

- Build a list that holds text, numbers and other lists side by side
- Pull any piece back out with `$`, `[[ ]]` and `[ ]`, and know why `[ ]` behaves differently
- Reach into a nested list, and see why a data frame is secretly a list too

**Prerequisites:** you can run a line of R, store a value with `<-`, and call a function. It helps to know that a [vector holds one type](Atomic-Vectors-and-Data-Types.html). By the end, Maya's whole profile, name, age, hobbies and even her address, will live inside one object you can take apart at will, like the tree below.

::widget tree-diagram {"root":"maya (list)","l":"hobbies","r":"address","leaves":["hiking","cello","Pune","411001"]}

=== step === concept
::eyebrow The container
## A list holds different kinds of things at once

Maya's details are different *types*: a word, a number, a few words, soon an address. A vector cannot keep them apart, it would coerce them all to text. A **list** can: you build one with `list()`, naming each slot as you go, and every value keeps its own type.

```r
maya <- list(
  name    = "Maya",
  age     = 31,
  hobbies = c("hiking", "cello", "baking")
)
maya
#> $name
#> [1] "Maya"
#>
#> $age
#> [1] 31
#>
#> $hobbies
#> [1] "hiking" "cello"  "baking"
```

Notice the printout: each slot is labelled with `$name`, `$age`, `$hobbies`, and the values underneath are untouched. The text is still text, the number is still a number, and `hobbies` is a whole vector tucked into one slot. A list is happy to hold a single value in one slot and a vector in the next.

To see a list's shape at a glance, three tools help. `length()` counts the slots, `names()` lists their labels, and `str()` (for *structure*) prints a compact map of the whole thing:

```r
length(maya)   # how many slots
#> [1] 3
names(maya)    # the slot labels
#> [1] "name"    "age"     "hobbies"
str(maya)      # a compact map: each slot, its type, its contents
#> List of 3
#>  $ name   : chr "Maya"
#>  $ age    : num 31
#>  $ hobbies: chr [1:3] "hiking" "cello" "baking"
```

`str()` is the single most useful thing to type when you meet an unfamiliar object: it tells you what is inside without dumping the whole contents on your screen.

=== step === quiz
::eyebrow Check yourself
## Vector or list?

You write two things that look similar: `c("Maya", 31, TRUE)` and `list("Maya", 31, TRUE)`. One coerces, one does not. What is the real difference?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- Both keep the three values with their own types; `list()` is just the slower way to write it ::no A plain vector cannot mix types. `c("Maya", 31, TRUE)` coerces all three up to one type (character: `"Maya" "31" "TRUE"`). Only `list()` keeps each value as its own type.
- `c()` coerces all three to one type (character); `list()` keeps each value as its own type ::ok Right. `c()` builds an atomic vector, which holds a single type, so it coerces everything to text. `list()` is the container that lets a string, a number and a logical sit side by side, each unchanged.
- They are identical; `c()` and `list()` are two names for the same function ::no They differ: `c()` returns an atomic vector (one type, so it coerces) while `list()` returns a list (mixed types preserved). Check with `typeof()` on each.

=== step === concept
::eyebrow Reaching in
## Pull a slot out by name with $

A list is no use if you cannot get things back out of it. The everyday way is the dollar sign: write the list, a `$`, then the slot's name, and R hands you back what is in that slot.

```r
maya$name
#> [1] "Maya"
maya$age
#> [1] 31
maya$hobbies
#> [1] "hiking" "cello"  "baking"
```

Each `$` returns the value *inside* the slot, ready to use: `maya$age` is the number `31`, so you can do arithmetic with it, and `maya$hobbies` is the character vector, so you can index it further with `[`:

```r
maya$age + 1           # it really is a number
#> [1] 32
maya$hobbies[2]        # the 2nd hobby, indexing the vector inside the slot
#> [1] "cello"
```

[TIP]
`$` only works with a name you type out, and it does not complain if you get the name wrong. `maya$adress` (a typo) returns `NULL` silently, not an error, so a mysterious `NULL` often means a misspelled slot name.

=== step === concept
::eyebrow The one rule everyone trips on
## Double brackets open the slot; single brackets keep the wrapper

There are two bracket styles, and the difference catches every beginner. Picture the list as a row of labelled boxes. `[[ ]]` reaches into one box and hands you **what is inside**. A single `[ ]` hands you back a **smaller row of boxes**, that is, a shorter list with the wrapper still on.

```r
maya[["name"]]      # open the slot: the value itself
#> [1] "Maya"

maya["name"]        # keep the wrapper: a list of length 1
#> $name
#> [1] "Maya"
```

They look almost the same, but they are not. Ask each one what type it is and the difference is plain: `[[ ]]` gives you the character value, while `[ ]` gives you back a list:

```r
class(maya[["name"]])   # the value inside the slot
#> [1] "character"
class(maya["name"])     # still a list, just a shorter one
#> [1] "list"
```

`[[ ]]` also takes a position, so `maya[[2]]` is the second slot's value, the number `31`. And `maya$name` is simply a friendly shorthand for `maya[["name"]]`. Here are the three ways in, side by side:

::widget process-flow {"steps":[{"title":"name with $","sub":"maya$name returns the value in that slot"},{"title":"name or position with [[ ]]","sub":"maya[[2]] also returns the value inside"},{"title":"index with single [ ]","sub":"maya[2] keeps the wrapper, returns a shorter list"}]}

[KEY INSIGHT]
`[[ ]]` and `$` **extract**: they unwrap one slot and give you the value inside. Single `[ ]` **preserves**: it gives you back a list (a shorter one). When your next step breaks because it got a list where it expected a value, you almost always meant `[[ ]]`.

=== step === quiz
::eyebrow Check yourself
## What does single-bracket give you?

Maya's list has an `age` slot holding the number `31`. You run `maya["age"]` (single brackets). What comes back?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- A list of length 1 whose only slot is `age`: single `[ ]` keeps the list wrapper on ::ok Right. Single `[ ]` always returns the same kind of container you indexed, so indexing a list gives back a (shorter) list. To get the bare number `31`, use `maya[["age"]]` or `maya$age`.
- The number `31` itself, ready for arithmetic ::no That is what `maya[["age"]]` or `maya$age` give you. Single `[ ]` keeps the wrapper, so `maya["age"]` is a one-slot LIST, not the number. Run `class(maya["age"])` and you will see `"list"`.
- An error, because a name only works inside `[[ ]]` ::no No error: single `[ ]` accepts names too. The difference is the wrapper, `[ ]` returns a list while `[[ ]]` returns the value inside.

=== step === concept
::eyebrow Lists inside lists
## A slot can hold another list

Here is what makes lists so powerful: a slot can itself be a list. Maya's address is really several fields, a city and a postal code, so it is natural to store it as its own little list inside `maya`. Let us add it:

```r
maya$address <- list(city = "Pune", pin = 411001)
str(maya)
#> List of 4
#>  $ name   : chr "Maya"
#>  $ age    : num 31
#>  $ hobbies: chr [1:3] "hiking" "cello" "baking"
#>  $ address:List of 2
#>   ..$ city: chr "Pune"
#>   ..$ pin : num 411001
```

See how `str()` indents `address` and shows its two inner slots: that nesting is the whole idea. To reach a value two levels down, you just chain the accessors, reading left to right, "in `maya`, go to `address`, then to `city`":

```r
maya$address$city            # dig two levels with $
#> [1] "Pune"
maya[["address"]][["pin"]]   # the same dig, written with [[ ]]
#> [1] 411001
```

That is the same structure as the tree on the cover, now built for real. Each `$` (or `[[ ]]`) steps you one level deeper into the nest.

::widget tree-diagram {"root":"maya (list)","l":"hobbies","r":"address","leaves":["hiking","cello","Pune","411001"]}

=== step === tryit
::eyebrow Your turn
## Dig two levels down

`maya` now holds a nested `address` list with a `city` slot set to `"Pune"`. Replace the blank with an expression that digs down and returns Maya's city. Use `$` to step through `address`, then `city`.

```r
# maya already has a nested address list (city = "Pune", pin = 411001)
____   # return Maya's city (expect "Pune")
```
::check {"regex":"maya\\s*\\$\\s*address\\s*\\$\\s*city","gate":true,"difficulty":"intermediate","ok":"Exactly. maya$address$city steps into the address slot, then into city, returning \"Pune\".","no":"Chain two dollar signs: maya$address$city (into address, then into city)."}
::solution
```r
maya$address$city
#> [1] "Pune"
```

=== step === concept
::eyebrow Why this matters
## Lists are everywhere in R

This is not a niche feature. The most common object in all of R, the **data frame**, is a list underneath: a list of equal-length columns. That is why the very same `$` reaches a column:

```r
is.list(mtcars)        # a data frame is a list of columns
#> [1] TRUE
mtcars$mpg[1:5]        # so $ pulls a column, exactly like a list slot
#> [1] 21.0 21.0 22.8 21.4 18.7
```

The same goes for the results of most functions. Fit a model and what you get back is a list, so you pull pieces out of it by name, just like Maya's profile:

```r
fit <- lm(mpg ~ wt, data = mtcars)
is.list(fit)           # a fitted model is a list too
#> [1] TRUE
fit$coefficients       # reach the estimates by name
#> (Intercept)          wt
#>   37.285126   -5.344472
```

Once you can build a list and reach inside it, you can take apart almost any object R hands you. That is why this small skill opens up so much of the language.

=== step === concept
::eyebrow Go deeper
## References

A few trustworthy places to take this further, all free:

- [Advanced R (2e): Subsetting](https://adv-r.hadley.nz/subsetting.html) - the definitive treatment of `[`, `[[` and `$`, and the preserve-vs-extract rule you just learned.
- [Advanced R (2e): Vectors](https://adv-r.hadley.nz/vectors-chap.html) - lists as generic vectors, and how they differ from atomic vectors.
- [An Introduction to R: Lists and data frames](https://cran.r-project.org/doc/manuals/r-release/R-intro.html#Lists-and-data-frames) - the canonical first treatment, straight from the R project.
- [R for Data Science (2e): Base R](https://r4ds.hadley.nz/base-r) - a friendly, example-led tour of `[[` and `$` for everyday data work.

=== step === complete
## Lesson 1 complete

You met R's most flexible container, the list. You built one with `list()`, looked at its shape with `length()`, `names()` and `str()`, and reached inside it three ways: `$` and `[[ ]]` to **extract** the value in a slot, single `[ ]` to **preserve** a shorter list. You saw a list hold another list, chained accessors to dig two levels deep, and learned that data frames and fitted models are lists too, so these same tools open them up.

Next, Lesson 2: Data Frames and Tibbles. Now that you know a data frame is really a list of equal-length columns, you will meet it head on, build one, see what makes its columns line up into rows, and learn what a tibble adds on top.
