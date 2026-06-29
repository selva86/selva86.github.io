---
title: "Subsetting, Control Flow and Functions: Quiz"
description: "A short, graded check on R programming: subsetting and replacement, if and loops, writing functions, default arguments, the pipe, and lexical scope."
keywords: "R quiz, subsetting, negative index, logical subsetting, for loop, R functions, default arguments, pipe, scope, R practice"
post_type: "LESSON"
curriculum_id: "1.3.6"
webr: true
lesson_access: "free"
track: "foundations"
course_id: "nr-programming"
course_title: "R Foundations: Programming"
course_lesson: "6"
course_total: "6"
course_landing: "R-Foundations-Programming-Course.html"
lesson_kind: "quiz"
course_prev: "Environments-and-Scope.html"
course_next: ""
catalog_blurb: "Check what stuck before you move on."
---

=== step === cover
::eyebrow Check your understanding
## Quiz
You have finished the programming section: subsetting and replacement, `if` and loops, writing your own functions, default and named arguments, the pipe, and how R resolves names. This short quiz checks what stuck. Pick an answer to continue; you can retry until it clicks. The last two steps are live R, run them and tinker.

=== step === quiz
::eyebrow Question 1 of 8
## What a negative index does
For `v <- c(10, 20, 30, 40)`, what does `v[-2]` return?
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The second element, `20`. ::no A negative sign does not select that position; it removes it.
- Everything except the second element: `10 30 40`. ::ok Correct. In R a negative index means "drop this position and keep the rest".
- An error, because indices cannot be negative. ::no Negative indices are valid and very common.
- The last two elements. ::no That would be `v[3:4]`; `-2` drops only position two.

=== step === quiz
::eyebrow Question 2 of 8
## Keeping the rows that match
For a numeric vector `v`, what does `v[v > 25]` return?
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Only the elements greater than 25. ::ok Right. `v > 25` makes a TRUE/FALSE vector, and indexing by it keeps the TRUE positions.
- The number of elements greater than 25. ::no That would be `sum(v > 25)`; here you keep the values themselves.
- The positions (indices) of those elements. ::no That is `which(v > 25)`; bracket-indexing by a logical keeps values, not positions.
- A single TRUE or FALSE. ::no The comparison gives one logical per element, and indexing returns the matching values.

=== step === quiz
::eyebrow Question 3 of 8
## What a function hands back
A function has no `return()` statement. What value does calling it produce?
::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- `NULL`, because nothing was returned. ::no R always returns something; it does not need an explicit `return()`.
- An error, because `return()` is required. ::no `return()` is optional in R.
- The value of the last expression evaluated in the body. ::ok Correct. R returns the final expression automatically; `return()` is for stopping early.
- The first argument, unchanged. ::no The return value is whatever the body computes last, not an argument by default.

=== step === quiz
::eyebrow Question 4 of 8
## Default arguments
A function is defined as `greet <- function(name, punct = "!")`. You call `greet("Sam")`. What is `punct` inside the call?
::quiz {"correct": 1, "gate": true, "difficulty": "beginner"}
- `"!"`, the default, because you did not supply it. ::ok Right. A default fills in when the caller omits that argument, so the function still runs.
- Missing, causing an error. ::no The default prevents the error; that is its purpose.
- `"Sam"`, taking the first argument. ::no `name` gets `"Sam"`; `punct` keeps its default.
- `NULL`. ::no The default is `"!"`, not `NULL`.

=== step === quiz
::eyebrow Question 5 of 8
## What the pipe does
You write `c(4, 9, 16) |> sqrt()`. What does the pipe do here?
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- It runs `sqrt()` first, then the vector. ::no The pipe passes left to right; the vector goes into `sqrt()`.
- It feeds the left-hand vector in as the first argument to `sqrt()`, giving `sqrt(c(4, 9, 16))`. ::ok Correct. `x |> f()` is just `f(x)`, written so a chain reads in order.
- It compares the two sides. ::no The pipe is not a comparison; it passes a value along.
- It only works inside the tidyverse. ::no The base pipe `|>` works in plain R.

=== step === quiz
::eyebrow Question 6 of 8
## What scope protects
Inside a function you write `x <- 99`, where `x` is also a global variable equal to `1`. After the function runs, what is the global `x`?
::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- `99`, because the function changed it. ::no A plain assignment inside a function stays local; it does not reach out.
- `NULL`, because the local one replaced it. ::no The global is untouched and still defined.
- Still `1`; the function worked on its own local copy. ::ok Right. Assignments inside a function are local, which is what keeps functions from quietly corrupting your workspace.
- An error, because the names clash. ::no Same-named variables in different scopes coexist without error.

=== step === concept
::eyebrow Run it: a for loop
## Loops in live R
Loop over a vector and print a line per item. Run it, then change the message or the vector and run again.

```r
books <- c("Dune", "Solaris", "Foundation")
for (b in books) {
  cat("Reading:", b, "\n")
}
```

A `for` loop walks through each element in turn, binding it to `b` and running the body once per item.

=== step === concept
::eyebrow Run it: write a function
## Functions in live R
Define a small function with a default argument, then call it both ways. Run it, then add a check at the top with `if`.

```r
late_fee <- function(days, rate = 0.25) {
  days * rate
}

late_fee(4)            # uses the default rate
late_fee(4, rate = 0.5)  # overrides it
```

The default `rate = 0.25` fills in when you omit it, and a named argument lets you override just the one you mean.

=== step === complete
## Section complete
Strong work. You can subset with negative and logical indices, predict what a function returns, rely on default and named arguments, read a `|>` chain in order, and trust that a function's local assignments leave your globals alone. Next section: importing and exporting real data.
