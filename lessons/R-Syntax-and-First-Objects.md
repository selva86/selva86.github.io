---
title: "R Foundations Lesson 1: Your First R Session"
catalog_blurb: "Get comfortable running code, storing results in objects, and reading errors."
description: "Your first hands-on R session: run code like a calculator, store values in objects with the assignment arrow, call functions, and read your first error."
keywords: "R for beginners, first R session, assignment operator in R, R objects, calling functions in R, R error messages, getting help in R, learn R syntax"
post_type: "LESSON"
curriculum_id: "1.1.1"
webr: true
lesson_access: "free"
track: "foundations"
course_id: "nr-basics"
course_title: "R Foundations: The Basics"
course_lesson: "1"
course_total: "4"
course_landing: "R-Foundations-Basics-Course.html"
course_next: "Atomic-Vectors-and-Data-Types.html"
course_prev: ""
---

=== step === cover
::eyebrow Lesson 1 of 4
## Your First R Session
Tonight you split a $87.60 dinner three ways with your friends Dev and Mara, and you want to add an 18% tip. That one ordinary task, work out the tip, total it up, divide by three, round to the cent, is enough to meet everything a first R session is made of.

By the end of this lesson you will be able to:

- Run code in R and read the result it prints back
- Store a value in an object with the `<-` arrow, then reuse it
- Call a function, read your first error message, and ask R for help

**Prerequisites:** none at all. This is the very first lesson. You only need R in front of you, either in RStudio or the editable boxes on this page, where you press Run to execute a line.

::widget process-flow {"steps":[{"title":"Run code","sub":"type an expression and R prints the answer"},{"title":"Store it","sub":"give a value a name with the assignment arrow"},{"title":"Call a function","sub":"hand a value to a named tool to do the work"}]}

=== step === concept
::eyebrow Run code
## R is a calculator that talks back

The simplest thing you can do in R is type a sum and press Enter. R works it out and prints the answer straight back:

```r
2 + 2
#> [1] 4
```

Two things to notice. The line `#> [1] 4` is R replying; on this page that reply appears under the code after you press Run. The `[1]` is just R numbering the answer, and with a single value it always reads `[1]`, so you can ignore it for now. The real result is the `4`.

Now the actual job. Your dinner tip is 18% of the $87.60 bill, which is the bill times `0.18`. The `*` means multiply, and anything after a `#` is a note to yourself that R ignores:

```r
87.60 * 0.18   # the tip: 18 percent of the bill
#> [1] 15.768
```

So the tip is about $15.77. R understands the everyday operators: `+` add, `-` subtract, `*` multiply, `/` divide, and `^` for powers, with the usual order of operations (and round brackets `( )` to force the order you want). That is genuinely all "running code" means: you hand R an expression, it evaluates it, and it shows you the value.

=== step === concept
::eyebrow Store it
## Give a value a name with `<-`

Retyping `87.60` every time you need the bill would get old fast. Instead, store it once under a name. In R you do that with the **assignment arrow**, `<-`, which you read as "gets":

```r
bill <- 87.60   # store 87.60 under the name "bill"
bill            # type the name on its own to see what it holds
#> [1] 87.6
```

`bill <- 87.60` points the value on the **right** into the name on the **left**. A name with a value attached is called an **object**. Notice two things: assigning is **silent** (R printed nothing on the first line), so you type the name on its own line to see inside it; and R shows `87.6`, dropping the harmless trailing zero.

Now give the other facts names too, and let R combine them. An object can be built from other objects:

```r
people   <- 3      # the three of us splitting the bill
tip_rate <- 0.18   # an 18 percent tip
total    <- bill + bill * tip_rate   # bill plus tip
total
#> [1] 103.368
```

[KEY INSIGHT]
The right-hand side is worked out first, then the result is stored in the name on the left. So `total` holds 103.368 from this point on, and you can use `total` anywhere you would have written that number.

Two habits to start with now. R is **case-sensitive**: `bill`, `Bill`, and `BILL` are three different names. And assigning a new value to an existing name simply **overwrites** it, with no warning. (You may see `=` used for assignment too; it works, but `<-` is the convention this course follows.)

=== step === quiz
::eyebrow Check yourself
## Which line stores a value?

You want to put the number 3 into an object called `people`. Which line does that?

::quiz {"correct":1,"gate":true,"difficulty":"beginner"}
- `people <- 3` ::ok Right. The arrow points the value on the right into the name on the left, so `people` now holds 3.
- `3 <- people` ::no The arrow always points right-to-left into a name. `3 <- people` tries to store something into the number 3, which is not a name, so R errors.
- `people == 3` ::no Double equals asks a question, "is people equal to 3?", and never stores anything. You will meet it in a later lesson on comparisons.

=== step === concept
::eyebrow Call a function
## Hand a value to a function

You and your friends do not split $34.456 evenly; you split dollars and cents. To tidy a number, you call a **function**. A function is a named tool: you give it one or more **arguments** (its inputs) inside round brackets, and it hands back a value.

First, each person's raw share is the total divided by the number of people:

```r
per_person <- total / people   # each person's exact share
per_person
#> [1] 34.456
```

Now round it to 2 decimal places with the `round()` function. Its first argument is the number, and its second, `digits`, is how many decimals to keep:

```r
round(per_person, 2)   # keep 2 decimals, so dollars and cents
#> [1] 34.46
```

You passed two arguments separated by a comma, **by position**: the number first, the digits second. You can also pass them **by name**, which reads more clearly and frees you from remembering the order:

```r
round(per_person, digits = 2)
#> [1] 34.46
```

Many arguments have a **default**, a value used when you do not supply one. For `round()`, `digits` defaults to `0`, so leaving it off rounds to a whole number:

```r
round(per_person)              # digits defaults to 0: nearest whole dollar
#> [1] 34
round(per_person, digits = 1)  # one decimal place
#> [1] 34.5
```

That is the whole pattern of using R: store values in objects, then call functions on them. Everything else is more objects and more functions.

=== step === tryit
::eyebrow Your turn
## Round the share yourself

Each person owes `per_person` dollars, which is `34.456`. Call `round()` so it shows their share to the nearest cent (2 decimal places). Replace the blank with the full function call, then check it.

```r
per_person <- total / people   # 34.456
____                           # show the share rounded to 2 decimals (expect 34.46)
```
::check {"regex":"round\\s*[(]\\s*per_person\\s*,\\s*(digits\\s*=\\s*)?2\\s*[)]","gate":true,"difficulty":"beginner","ok":"Exactly. round(per_person, 2) keeps two decimals, giving each friend a tidy 34.46 to pay.","no":"Call round with two arguments, the number then the digits: round(per_person, 2)."}
::solution
```r
round(per_person, 2)
```

=== step === concept
::eyebrow When it goes wrong
## Reading your first error

Sooner or later R will print a line starting with `Error`, and that is completely normal. An error is not a wall; it is R telling you, quite precisely, what it could not do. The trick is simply to read it.

Here is the single most common beginner error. You stored the total as `total` (lowercase), but you ask for it with a capital `T`:

```r-static
Total
#> Error: object 'Total' not found
```

Read it literally: there is no object named `Total`. R quotes the exact name it looked for and could not find. "object not found" almost always means one of two things: a **typo or wrong capital** (you meant `total`), or you **never created it** in the first place. The fix is to correct the name, or to assign it before you use it.

A second one you will hit early is an unfinished line. In the R console (in RStudio or your own session), forget the closing bracket and R shows a `+` prompt instead of an answer:

```r-static
round(per_person, 2
+ 
```

That `+` means "I am waiting for the rest of your line." Either type the missing `)` and press Enter, or press Esc to cancel and start again. When something looks stuck, an unbalanced bracket is the usual cause.

::widget process-flow {"steps":[{"title":"Read the message","sub":"an error is information; read the whole line, do not panic"},{"title":"Find the name","sub":"R quotes the exact thing it could not find"},{"title":"Fix and re-run","sub":"correct the spelling or capitals, or create it first"}]}

=== step === quiz
::eyebrow Check yourself
## What is R telling you?

You run a line and see `Error: object 'Total' not found`. What does it mean?

::quiz {"correct":1,"gate":true,"difficulty":"beginner"}
- You asked R for a name it does not know; check the spelling and capitals (you stored it as `total`), or create it first. ::ok Right. R looked for an object called exactly `Total`, found none, and said so. Fix the case to `total` and it works.
- R or your installation is broken and needs restarting. ::no Nothing is broken. "object not found" is a routine, specific message: R simply has no object by that exact name.
- The value stored inside `Total` is wrong. ::no There is no object `Total` yet, so there is no value to be right or wrong. R never found one by that name at all.

=== step === concept
::eyebrow Ask R
## Getting help

How did we know `round()` even had a `digits` argument? We asked R. The quickest peek is `args()`, which lists just a function's arguments and their defaults:

```r
args(round)   # what arguments does round() take?
#> function (x, digits = 0) 
#> NULL
```

There it is in black and white: `round()` takes `x` (the number) and `digits`, and `digits = 0` is the default we relied on earlier. For the full explanation, with examples, open a function's help page. These are console commands you run in RStudio or your own R session:

```r-static
?round                   # open round()'s help page
help(round)              # exactly the same as ?round
example(round)           # run the examples from the help page
??"standard deviation"   # search the help when you do not know the function name
```

`?name` opens the help page in RStudio's Help pane (or your browser); `args(name)` is the fast reminder of just the arguments; and `??"some text"` searches across the help when you cannot remember a function's name. Getting comfortable with `?` early is one of the highest-value habits in R.

=== step === tryit
::eyebrow Put it together
## From bill to each person's share

Dev offers to leave a more generous **20% tip**. Update the tip rate, recompute the total, and show each person's new share rounded to the cent. The first two lines are done; replace the blank with the final calculation. (Each person should owe `35.04`.)

```r
tip_rate <- 0.20                  # Dev bumps the tip to 20 percent
total    <- bill + bill * tip_rate  # recompute the bill with the new tip
____                              # show each person's new share, rounded to cents
```
::check {"regex":"round\\s*[(]\\s*total\\s*/\\s*people\\s*,\\s*(digits\\s*=\\s*)?2","gate":true,"difficulty":"intermediate","ok":"That is the whole lesson in one line: divide the new total by people, round to 2 decimals, and read the result, 35.04.","no":"Divide the new total by people, then round to 2 decimals: round(total / people, 2)."}
::solution
```r
tip_rate <- 0.20
total    <- bill + bill * tip_rate
round(total / people, 2)
#> [1] 35.04
```

=== step === concept
::eyebrow Go deeper
## References

A few trustworthy places to keep going, all free:

- [An Introduction to R (official manual)](https://cran.r-project.org/doc/manuals/r-release/R-intro.html) - the canonical first walk through R's basics, straight from the R project.
- [R for Data Science (2e): Workflow basics](https://r4ds.hadley.nz/workflow-basics) - a friendly take on objects, names, and calling functions.
- [Hands-On Programming with R](https://rstudio-education.github.io/hopr/) - a gentle, beginner-first book that starts exactly where this lesson does.
- [Getting Help with R](https://www.r-project.org/help.html) - the official rundown of `?`, `??`, and where to ask when you are stuck.

=== step === complete
## Lesson 1 complete

You just ran a real R session. You used R as a calculator, stored values in objects with the `<-` arrow and reused them, called `round()` with positional, named, and default arguments, read an "object not found" error and fixed it, and asked R for help with `args()` and `?`. Those few moves, run code, store it, call a function, are the spine of everything that follows.

Next, Lesson 2: Atomic Vectors and Data Types. So far each object has held a single value. You will see how R packs many values into one vector, meet its core types (numbers, text, and TRUE/FALSE), and learn how to tell what type any object is.
