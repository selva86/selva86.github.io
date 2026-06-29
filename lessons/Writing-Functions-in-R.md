---
title: "R Foundations Lesson 3: Writing Functions in R"
catalog_blurb: "Wrap repeated work into a named function you can reuse anywhere."
description: "Write your own functions in R: declare arguments, write the body, return a value, and reuse one function across your whole script instead of copy-pasting code."
keywords: "writing functions in R, R function, function arguments R, return value R, return() R, define a function R, sapply, R for beginners, scope R"
post_type: "LESSON"
curriculum_id: "1.3.3"
webr: true
mathjax: true
lesson_access: "free"
track: "foundations"
course_id: "nr-programming"
course_title: "R Foundations: Programming"
course_lesson: "3"
course_total: "5"
course_landing: "R-Foundations-Programming-Course.html"
course_next: "Arguments-Defaults-and-the-Pipe.html"
course_prev: "Control-Flow-in-R.html"
---

=== step === cover
::eyebrow Lesson 3 of 5
## Writing Functions in R

You are still helping that weekend R study group. The same five friends, Mara, Dev, Ada, Theo and Iris, sat a quiz out of 100 and scored 58, 91, 73, 49 and 84. In Lesson 2 you wrote the grading logic, an `if` / `else if` / `else` that turns a score into a grade, loose in your script. It worked. But the moment you wanted to grade a second student, you copied and pasted the whole block. Now the rule lives in five different places, and if you ever change the pass mark you have to remember to fix every copy.

A **function** ends that. You write the rule once, give it a name, and from then on you just call it by name with whatever score you like. The widget below is the whole idea in miniature: define a function once, then call it again and again to get a value back each time.

By the end of this lesson you will be able to:

- Define a function with `function`: name it, declare its arguments, and write its body
- Say what a function returns (the last line, automatically) and use `return()` to leave early
- Call your function, pass it inputs, reuse the value it hands back, and run it across a whole vector at once

**Prerequisites:** you can [run R and assign with `<-`](R-Syntax-and-First-Objects.html), [build and name a vector](Atomic-Vectors-and-Data-Types.html), and use [`if` / `else if` / `else`](Control-Flow-in-R.html) with comparison operators like `>=`.

::widget process-flow {"steps":[{"title":"Define it once","sub":"write the rule down, name it, store it as a function"},{"title":"Call it by name","sub":"hand the function an input whenever you need it"},{"title":"Get a value back","sub":"it runs its body and returns one answer each time"}]}

=== step === concept
::eyebrow The anatomy
## The four parts of a function

Here is the grading rule from Lesson 2, wrapped into a function. Each lesson runs in a fresh R session, so we build the scores right here too (run this):

```r
# the weekend study group's quiz scores, out of 100
scores <- c(Mara = 58, Dev = 91, Ada = 73, Theo = 49, Iris = 84)

grade <- function(score) {
  if (score >= 80) {
    "A"
  } else if (score >= 60) {
    "B"
  } else {
    "needs help"
  }
}

grade(73)
#> [1] "B"
```

Read that definition slowly, because every function you ever write has these same four parts:

- **A name** (`grade`), the label you store it under with `<-`, so you can call it later.
- **The `function` keyword**, which says "what follows is a function, not a value."
- **Arguments** (`score`), the inputs, listed in the round brackets. Inside the body, `score` is a name that stands for whatever value you pass in.
- **The body** (everything in the curly braces), the work that runs each time you call it.

In maths, a function is a rule that turns an input into an output, written \(f\colon x \mapsto f(x)\): you give it the input \(x\) and it hands back the output \(f(x)\). An R function is exactly that idea made runnable. Here \(f\) is `grade`, the input \(x\) is a score, and the output \(f(x)\) is the grade. The widget traces that path:

::widget process-flow {"steps":[{"title":"Argument in","sub":"you pass one score, e.g. 73"},{"title":"Body runs","sub":"compare it to the cut-offs with if / else if"},{"title":"Value out","sub":"the matching grade comes back, e.g. B"}]}

=== step === tryit
::eyebrow Your turn
## Write your first function

Your turn to build one from scratch. Complete the function `is_pass` so that it takes a `score` and returns `TRUE` when the score is 60 or more, and `FALSE` otherwise. (A comparison like `score >= 60` already evaluates to `TRUE` or `FALSE`, so it is all the body needs.) Fill in the body, then check. `is_pass(73)` should give `TRUE`.

```r
is_pass <- function(score) {
  ____
}
is_pass(73)
```
::check {"regex":"score\\s*>=\\s*60","gate":true,"difficulty":"beginner","ok":"Exactly. The body's last (and only) line is score >= 60, which is TRUE for 73, and that TRUE is what the function hands back.","no":"The body just needs the comparison that is TRUE for a passing score: score >= 60."}
::solution
```r
is_pass <- function(score) {
  score >= 60
}
is_pass(73)
#> [1] TRUE
```

=== step === concept
::eyebrow Calling it
## Inputs go in, one value comes out

When you write `grade(91)`, R does two things. First it **binds** the argument: inside the body, `score` becomes `91`. Then it runs the body and hands back a value. That returned value is a normal R value, so you can store it, print it, or drop it straight into other code:

```r
result <- grade(91)        # Dev's score; result is now "A"
result
#> [1] "A"

paste0("Dev got an ", grade(91))
#> [1] "Dev got an A"
```

**What exactly comes back?** By default, a function returns the value of the **last expression** in its body. You do not write the word "return" for the normal case, the final line's value is handed back automatically. That is why `is_pass` could return `score >= 60` with no extra ceremony.

Sometimes you want to leave **early**, before reaching the last line. That is what `return()` is for: it stops the function immediately and hands back whatever you give it. A common use is guarding against bad input. The `||` below means "or", so the guard triggers when the score is below 0 **or** above 100:

```r
grade <- function(score) {
  if (score < 0 || score > 100) {
    return("invalid score")    # leave now; the rest of the body never runs
  }
  if (score >= 80) "A" else if (score >= 60) "B" else "needs help"
}

grade(150)
#> [1] "invalid score"
grade(73)
#> [1] "B"
```

[KEY INSIGHT]
A function gives back the value of its **last expression** automatically. Use `return()` only when you need to exit **early**, partway through the body. Both hand back exactly **one** value.

=== step === quiz
::eyebrow Check yourself
## Printing is not returning

A beginner trap hides here. `cat()` writes text to the console, but its own value is an invisible `NULL`. So a function whose body is only a `cat()` prints something, yet returns `NULL`. Run this and watch:

```r
announce <- function(score) {
  cat("Scored", score, "out of 100\n")   # cat PRINTS, but its value is NULL
}

returned <- announce(73)
#> Scored 73 out of 100
returned
#> NULL
```

After that code runs, what is the value of `returned`?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The string `"Scored 73 out of 100"` ::no That text was *printed* to the console as a side effect, but printing is not returning. `cat()` hands back `NULL`, so that is what the function returns.
- `NULL`, because the body's only expression is `cat()`, which returns `NULL` invisibly ::ok Right. `cat()` prints as a side effect but its value is `NULL`, and a function returns its last expression, so `returned` is `NULL`. To return the text instead, make the last line the string (or use `paste0`).
- `73`, the value that was passed in ::no A function does not return its input by default. It returns its last expression, here the `cat()` call, whose value is `NULL`.

=== step === concept
::eyebrow The payoff
## One function, the whole class

Here is why the wrapping was worth it. Because `grade` is one named rule, you can run it across **every** student at once instead of copying the block five times. `sapply()` takes a vector and a function, applies the function to each element, and collects the results:

```r
scores <- c(Mara = 58, Dev = 91, Ada = 73, Theo = 49, Iris = 84)

sapply(scores, grade)
#>         Mara          Dev          Ada         Theo         Iris
#> "needs help"          "A"          "B" "needs help"          "A"
```

One line grades the whole group, and the names ride along. Better still, the cut-offs now live in exactly **one place**: the body of `grade`. Change `60` to `65` there and every student is re-graded correctly, no copy to hunt down. That is the real prize of a function, one definition, one place to change, used everywhere.

=== step === quiz
::eyebrow Check yourself
## Why not just grade the whole vector?

It is tempting to skip `sapply()` and call `grade(scores)` directly on the whole five-element vector. But `grade` decides with `if`, and you saw in Lesson 2 that `if` wants a **single** `TRUE` or `FALSE`. What happens when you call `grade(scores)`?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- It errors: the `if` inside gets a length-5 condition and stops with "the condition has length > 1" ::ok Right. `grade` was written for one score, so its `if` receives five TRUE/FALSE values and halts. Apply it one element at a time with `sapply(scores, grade)`.
- It returns five grades, one per student, just like `sapply()` ::no That is what you *want*, but `grade` is not vectorized: its `if` cannot take five conditions at once, so the call errors instead of looping.
- It grades only the first student and silently ignores the rest ::no R does not silently use just the first element here; the length-5 condition raises an error and the call stops.

=== step === concept
::eyebrow When it breaks
## What a function can and cannot see

A function has its own private workspace. Any name you create **inside** the body lives only while the function runs, then disappears. It never leaks out into your script:

```r
inside_only <- function() {
  local_note <- "I live only while the function runs"
  local_note
}

inside_only()
#> [1] "I live only while the function runs"

exists("local_note")     # is local_note visible out here?
#> [1] FALSE
```

The reverse is looser, and this is the part that bites people. A function **can** see names from the surrounding script, so this works even though `cutoff` is never passed in:

```r
cutoff <- 60
is_pass <- function(score) {
  score >= cutoff          # cutoff is found out in the global workspace
}
is_pass(58)
#> [1] FALSE
```

[WARNING]
Leaning on an outside name like that is fragile: the function now silently depends on a `cutoff` that lives somewhere else, and it breaks (or worse, quietly gives wrong answers) if that name changes or is missing. The fix is simple, **pass in everything the function needs as an argument**:

```r
is_pass <- function(score, cutoff) {
  score >= cutoff          # cutoff is now an explicit input: self-contained
}
is_pass(58, 60)
#> [1] FALSE
is_pass(58, 50)
#> [1] TRUE
```

A function can take as many arguments as you like, separated by commas. (How those arguments resolve, the surrounding environments, is the subject of Lesson 5; how to give an argument a **default** so you can leave it out is Lesson 4.)

=== step === tryit
::eyebrow Put it together
## A two-argument function

Write a function `pass_fail` that takes a `score` and a `cutoff` and returns `"pass"` when the score reaches the cut-off, and `"fail"` otherwise. Use the `if (...) ... else ...` form you met earlier. Fill in the body, then check. `pass_fail(73, 60)` should give `"pass"`; `pass_fail(40, 60)` should give `"fail"`.

```r
pass_fail <- function(score, cutoff) {
  ____
}
pass_fail(73, 60)
pass_fail(40, 60)
```
::check {"regex":"score\\s*>=\\s*cutoff","gate":true,"difficulty":"intermediate","ok":"That is it. The body compares the two arguments with score >= cutoff and returns pass or fail, and because cutoff is an argument the function carries everything it needs.","no":"Compare the two arguments: if (score >= cutoff) \"pass\" else \"fail\"."}
::solution
```r
pass_fail <- function(score, cutoff) {
  if (score >= cutoff) "pass" else "fail"
}
pass_fail(73, 60)
#> [1] "pass"
pass_fail(40, 60)
#> [1] "fail"
```

=== step === concept
::eyebrow Go deeper
## References

A few authoritative, free places to take functions further:

- [R for Data Science (2e), Functions](https://r4ds.hadley.nz/functions.html) - a hands-on chapter on when and how to pull repeated code into a function.
- [Advanced R (2e), Functions](https://adv-r.hadley.nz/functions.html) - the rigorous treatment: a function's three parts (arguments, body, environment) and how calling really works.
- [An Introduction to R: Writing your own functions](https://cran.r-project.org/doc/manuals/r-release/R-intro.html#Writing-your-own-functions) - the official manual's section on defining functions.
- [Hands-On Programming with R: Writing Your Own Functions](https://rstudio-education.github.io/hopr/basics.html) - a gentle, beginner-first build of a function from the ground up.

=== step === complete
## Lesson 3 complete

You can now write your own functions. You wrapped a repeated rule into `grade()` and saw the four parts of every function (a name, the `function` keyword, arguments, and a body); you learned that a function hands back its last expression automatically, with `return()` reserved for leaving early; you called functions, reused the value they return, and ran one across a whole vector with `sapply()`; and you saw that names made inside a function stay inside, so the safe habit is to pass in everything it needs as an argument.

Next, Lesson 4: Arguments, Defaults and the Pipe. You will give arguments **default values** so callers can leave them out, name arguments to pass them in any order, meet the `...` that lets a function accept extra arguments, and chain several functions together with the `|>` pipe.
