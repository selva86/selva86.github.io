---
title: "R Foundations Lesson 2: Control Flow in R"
catalog_blurb: "Make your code decide between paths and repeat work without copy-pasting."
description: "Make your R code decide and repeat: if and else for branching, for and while loops, and next and break to skip or stop, watched one step at a time."
keywords: "control flow in R, if else R, for loop R, while loop R, next break R, R conditionals, R loops, ifelse, R for beginners"
post_type: "LESSON"
curriculum_id: "1.3.2"
webr: true
lesson_access: "free"
track: "foundations"
course_id: "nr-programming"
course_title: "R Foundations: Programming"
course_lesson: "2"
course_total: "5"
course_landing: "R-Foundations-Programming-Course.html"
course_next: "Writing-Functions-in-R.html"
course_prev: "Subsetting-and-Replacement.html"
---

=== step === cover
::eyebrow Lesson 2 of 5
## Control Flow in R

You are still tutoring that weekend R study group. The same five friends, Mara, Dev, Ada, Theo and Iris, sat a quiz out of 100 and scored 58, 91, 73, 49 and 84. In Lesson 1 you learned to *read* and *write* those scores by subsetting. Now you want your code to **act** on them: decide who passed, send a different message to each student, keep boosting scores until the class average is high enough, stop the moment you have lined up enough follow-ups.

Those are the three things control flow gives you: **branch** (do different work depending on a condition), **loop** (repeat work many times), and **skip or stop** partway through. The widget below is the whole idea in miniature, a loop that makes a yes/no decision each time around. Step through it.

By the end of this lesson you will be able to:

- Branch with `if`, `else if` and `else`, and know when to reach for `ifelse()` instead
- Repeat work with a `for` loop (a known set) and a `while` loop (until a condition is met)
- Skip one pass with `next` and stop a loop early with `break`

**Prerequisites:** you can build a [vector](Atomic-Vectors-and-Data-Types.html), you know R's [comparison operators](Operators-Recycling-and-Coercion.html) like `>=` and `==` return TRUE/FALSE, and you can [subset by name or condition](Subsetting-and-Replacement.html).

::widget control-flow {}

=== step === concept
::eyebrow One decision
## if and else: a fork in the road

The most basic decision is a fork: if something is true, do this; otherwise, do that. In R you write it with `if` and `else`. The part in round brackets, the **condition**, must boil down to a single `TRUE` or `FALSE`, and the part in curly braces is the work to run.

First, build the scores once. Each lesson runs in a fresh R session, so we create the data right here (run this):

```r
# our weekend study group's quiz scores, out of 100
scores <- c(Mara = 58, Dev = 91, Ada = 73, Theo = 49, Iris = 84)

mara <- scores["Mara"]      # Mara's score, 58
if (mara >= 60) {
  cat("Mara passed\n")
} else {
  cat("Mara needs a follow-up session\n")
}
#> Mara needs a follow-up session
```

Here `cat()` simply prints its message to the console, and the `\n` at the end is a "newline" so the next message starts on a fresh line. R checked `mara >= 60`. That is `FALSE` (58 is below 60), so it skipped the `if` block and ran the `else` block. Change the score and the other branch runs.

When there are more than two outcomes, chain decisions with `else if`. R tries each condition top to bottom and runs the **first** block whose condition is `TRUE`, then stops checking:

```r
score <- 73                 # Ada
if (score >= 80) {
  grade <- "A"
} else if (score >= 60) {
  grade <- "B"
} else {
  grade <- "needs help"
}
grade
#> [1] "B"
```

[KEY INSIGHT]
`if` runs a block only when its condition is `TRUE`. `else` is the catch-all when it was `FALSE`. An `else if` chain checks conditions in order and takes the first match, so put the most specific condition first.

=== step === concept
::eyebrow One TRUE/FALSE, not many
## When you have a whole vector: ifelse()

There is a trap waiting here. `if` wants **one** `TRUE` or `FALSE`. But `scores >= 60` is a *vector* of five logicals, one per student. Hand that to `if` and R does not guess, it stops with an error:

[WARNING]
`if (scores >= 60)` raises **"the condition has length > 1"** and halts. `if` is for a single decision, not a column of them. This is the single most common control-flow mistake beginners make.

To make the same decision for **every** element at once, use `ifelse()`. You give it the test, the value to use where the test is `TRUE`, and the value to use where it is `FALSE`, and it returns a whole vector of results:

```r
ifelse(scores >= 60, "pass", "fail")
#>   Mara    Dev    Ada   Theo   Iris
#> "fail" "pass" "pass" "fail" "pass"
```

One label per student, in one line, no loop needed. Read the rule of thumb as: **`if` decides once; `ifelse()` decides element by element across a vector.**

=== step === quiz
::eyebrow Check yourself
## Label every student at once

You have the whole `scores` vector and want a `"pass"` or `"fail"` label for **every** student in one go. Which line does that correctly?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- `ifelse(scores >= 60, "pass", "fail")` ::ok Right. `ifelse()` is vectorized: it applies the test to each element and returns one label per student.
- `if (scores >= 60) "pass" else "fail"` ::no `if` needs a single TRUE/FALSE. On a length-5 vector R errors with "the condition has length > 1" and stops. Use `ifelse()` for the whole vector.
- A `for` loop is the only way to label a vector ::no A loop would work, but it is the long way round. For an element-by-element label, `ifelse()` is the direct, built-in tool.

=== step === widget
::eyebrow Repeat work
## The for loop, one iteration at a time

A `for` loop runs the same block of code once for each item in a sequence. You write `for (variable in sequence)`, and on each pass R sets `variable` to the next item and runs the body. Step through the widget below: watch the counter `i` change, see which branch the `if` takes, and the console build up line by line. That is exactly what a loop does, just sped up when you press Run.

::widget control-flow {}

Now point a loop at our study group. `names(scores)` gives the five names; the loop binds `name` to each one in turn and runs the body five times:

```r
for (name in names(scores)) {
  if (scores[name] >= 60) {
    cat(name, "passed\n")
  } else {
    cat(name, "needs help\n")
  }
}
#> Mara needs help
#> Dev passed
#> Ada passed
#> Theo needs help
#> Iris passed
```

The sequence can be anything you can iterate: the values themselves (`for (s in scores)`), the names (above), or a count like `1:n` when you just need to repeat something a fixed number of times:

```r
for (i in 1:3) {
  cat("study session", i, "\n")
}
#> study session 1
#> study session 2
#> study session 3
```

[NOTE]
Looping is for *doing something each time* (printing, sending a message, accumulating a total). When you only want a value computed across a whole vector, a vectorized function like `ifelse()`, `sum()` or `mean()` is shorter and faster, you will see much more of that in the iteration lesson later in this course.

=== step === tryit
::eyebrow Your turn
## Count how many passed

Complete the loop so it adds 1 to `passed` for each student who scored 60 or more. Fill in the condition, then check. (You should get 3: Dev, Ada and Iris.)

```r
scores <- c(Mara = 58, Dev = 91, Ada = 73, Theo = 49, Iris = 84)
passed <- 0
for (s in scores) {
  if (____) {
    passed <- passed + 1
  }
}
passed
```
::check {"regex":"s\\s*>=\\s*60","gate":true,"difficulty":"beginner","ok":"Exactly. Each pass binds s to one score; when s >= 60 is TRUE you bump the counter, so passed ends at 3.","no":"Test the loop variable against the pass mark: s >= 60."}
::solution
```r
passed <- 0
for (s in scores) {
  if (s >= 60) {
    passed <- passed + 1
  }
}
passed
#> [1] 3
```

=== step === concept
::eyebrow Repeat until a condition
## The while loop

A `for` loop runs a *known* number of times, once per item. But sometimes you do not know the count in advance, you just want to keep going **until** something becomes true. That is a `while` loop: it checks a condition, and as long as it is `TRUE`, it runs the body and checks again.

Say the group unlocks a reward when the class average reaches 75. Right now the average is 71. Each study session lifts everyone by 3 points. How many sessions until they get there? A `while` loop finds out by repeating until the average is high enough:

```r
boosted <- scores         # work on a copy, leave the originals alone
avg <- mean(boosted)      # the class average, 71 right now
sessions <- 0
while (avg < 75) {
  boosted <- boosted + 3  # everyone gains 3 points this session
  avg <- mean(boosted)    # recompute, then the loop checks avg < 75 again
  sessions <- sessions + 1
}
sessions
#> [1] 2
round(avg)
#> [1] 77
```

The flow is always the same four beats: check the condition, run the body, update something the condition depends on, and loop back. The widget shows that cycle:

::widget process-flow {"steps":[{"title":"Check the condition","sub":"is the class average still below 75?"},{"title":"Run the body","sub":"everyone gains 3 points this session"},{"title":"Update","sub":"recompute the average so the next check can change"},{"title":"Repeat or stop","sub":"true: loop again. false: leave the loop"}]}

[WARNING]
A `while` loop only ends when its condition becomes `FALSE`. If the body never changes what the condition depends on (here, `avg`), the loop runs forever, an **infinite loop**. Always make sure each pass moves you toward the exit.

=== step === quiz
::eyebrow Check yourself
## Which loop fits?

You want to keep simulating study sessions until the class average reaches 75, but you have no idea how many sessions that will take. Which loop is the right tool?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- A `while` loop, because it repeats *until* a condition is met ::ok Right. When the number of repeats is unknown and depends on a condition, `while` is exactly the tool.
- A `for` loop over `1:75`, one iteration per target point ::no A `for` loop is for a *known* count, and `1:75` has nothing to do with the number of sessions. You do not know how many passes you need, which is the signal to use `while`.
- Neither; a loop can never count something unknown ::no Loops handle exactly this: `while` keeps going until the condition flips, however many passes that takes.

=== step === concept
::eyebrow Skip or stop
## next and break

Two small keywords give you fine control *inside* a loop. `next` skips the rest of the current pass and jumps straight to the next item. `break` stops the loop entirely. Both are almost always guarded by an `if`.

Suppose you are lining up follow-up sessions, but you can only fit two this week. Go through the students in order: skip anyone already passing (`next`), and once you have found two who need help, stop looking (`break`):

```r
need_help <- 0
for (name in names(scores)) {
  if (scores[name] >= 60) {
    next                      # already passing: skip to the next student
  }
  cat(name, "needs a follow-up\n")
  need_help <- need_help + 1
  if (need_help == 2) {
    break                     # only room for two this week: stop looking
  }
}
#> Mara needs a follow-up
#> Theo needs a follow-up
```

Trace it: Mara (58) fails, so she is logged. Dev and Ada pass, so `next` skips them. Theo (49) fails and is logged, which makes `need_help` reach 2, so `break` ends the loop before it ever reaches Iris.

[KEY INSIGHT]
`next` = "skip the rest of *this* pass." `break` = "leave the loop now." Reach for them when a condition mid-loop means there is no point finishing the current item, or no point continuing at all.

=== step === tryit
::eyebrow Put it together
## Stop at the first struggler

Write a loop that walks the students in order, prints the **first** one who scored below 60, and then stops immediately (no point checking the rest). Fill in the keyword that leaves the loop, then check. (It should report Mara.)

```r
scores <- c(Mara = 58, Dev = 91, Ada = 73, Theo = 49, Iris = 84)
for (name in names(scores)) {
  if (scores[name] < 60) {
    cat("First struggling student:", name, "\n")
    ____          # found one: no need to check the rest
  }
}
```
::check {"regex":"\\bbreak\\b","gate":true,"difficulty":"intermediate","ok":"That is it. The moment the if finds a sub-60 score it prints, then break ends the loop, so only Mara is reported.","no":"Use break to leave the loop as soon as you find the first match."}
::solution
```r
for (name in names(scores)) {
  if (scores[name] < 60) {
    cat("First struggling student:", name, "\n")
    break
  }
}
#> First struggling student: Mara
```

=== step === concept
::eyebrow Go deeper
## References

A few authoritative, free places to take control flow further:

- [Advanced R (2e): Control flow](https://adv-r.hadley.nz/control-flow.html) - the definitive treatment of `if`, `ifelse()`, `for`, `while`, `next` and `break`, including the length-1 condition rule.
- [An Introduction to R: Loops and conditional execution](https://cran.r-project.org/doc/manuals/r-release/R-intro.html#Loops-and-conditional-execution) - the official manual on `if` and the loop constructs.
- [The R Language Definition: Control structures](https://cran.r-project.org/doc/manuals/r-release/R-lang.html#Control-structures) - the precise, formal rules for every conditional and loop keyword.
- [Hands-On Programming with R: Loops](https://rstudio-education.github.io/hopr/loops.html) - a gentle, beginner-first walk through `for` and `while`.

=== step === complete
## Lesson 2 complete

Your code can now make decisions and repeat work. You branched with `if`, `else if` and `else` on a single TRUE/FALSE, and switched to `ifelse()` to label a whole vector at once; you repeated work with a `for` loop over a known set and a `while` loop that runs until a condition is met (watching out for infinite loops); and you steered loops from the inside with `next` to skip a pass and `break` to stop early.

Next, Lesson 3: Writing Functions in R. So far this logic lives loose in your script. A function lets you wrap a piece of it, give it a name, hand it inputs, and reuse it anywhere, the natural next step once your code starts branching and looping.
