---
title: "Defensive Code and Debugging: Quiz"
description: "A short, graded check on robust R: stop, warning and message, recovering with tryCatch, validating with stopifnot, finally, and the debugging tools traceback and browser."
keywords: "R quiz, stop warning message, tryCatch, stopifnot, finally, traceback, browser, debugging R, R practice"
post_type: "LESSON"
curriculum_id: "1.7.4"
webr: true
lesson_access: "free"
track: "foundations"
course_id: "nr-debugging"
course_title: "R Foundations: Debugging"
course_lesson: "4"
course_total: "4"
course_landing: "R-Foundations-Debugging-Course.html"
lesson_kind: "quiz"
course_prev: "Debugging-Tools-in-R.html"
course_next: ""
catalog_blurb: "Check what stuck before you move on."
---

=== step === cover
::eyebrow Check your understanding
## Quiz
You have finished the defensive-code section: signalling with stop, warning and message, recovering with tryCatch, validating inputs with stopifnot, and finding bugs with traceback and browser. This short quiz checks what stuck. Pick an answer to continue; you can retry until it clicks. The last two steps are live R, run them and tinker.

=== step === quiz
::eyebrow Question 1 of 8
## Three voices, three severities
Your function meets input it cannot use at all. Which signal abandons the rest of the work?
::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- `message()`, the loudest of the three. ::no `message()` is the gentlest; it prints a note and the code keeps running.
- `stop()`, which raises an error and halts. ::ok Right. `stop()` is for "I cannot continue"; `warning()` flags a concern but carries on, and `message()` is just a note.
- `warning()`, which always halts. ::no A warning is recorded but the code continues past it.
- `print()`. ::no `print()` shows a value; it does not signal a problem.

=== step === quiz
::eyebrow Question 2 of 8
## What tryCatch recovers
You wrap a risky call as `tryCatch(risky(), error = function(e) 0)`. The call raises an error. What does the whole expression return?
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- `0`, the value from the error handler. ::ok Right. When the expression errors, the matching handler runs instead and its return value becomes the value of `tryCatch`.
- An error that still stops the program. ::no That is exactly what the handler prevents; the error is caught.
- `NULL`, because nothing succeeded. ::no The handler supplies a real value, here `0`.
- The error message as text. ::no Unless your handler returns the message, you get whatever the handler returns, here `0`.

=== step === quiz
::eyebrow Question 3 of 8
## Prevent versus recover
You want a function to refuse plainly invalid input immediately, before doing any work, with a clear message. Which tool fits?
::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- `tryCatch()` around the body. ::no `tryCatch()` recovers after an error is raised; here you want to prevent the bad work from running.
- `warning()`, then continue. ::no A warning lets the function press on with input it already knows is invalid.
- `stopifnot()` at the top of the function, with named conditions. ::ok Right. `stopifnot()` checks the inputs first and raises a clear, named error the moment a rule breaks.
- `message()`, to note the problem. ::no A message does not stop the bad input from being used.

=== step === quiz
::eyebrow Question 4 of 8
## When finally runs
A `tryCatch()` has a `finally = ` block. When does that block run?
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Only when the expression succeeds. ::no It runs regardless of success.
- Always, whether the expression succeeded or raised an error. ::ok Right. `finally` is for cleanup you cannot skip, like closing a file, so it runs on both paths.
- Only when an error is raised. ::no It runs on the happy path too.
- Never; it is optional decoration. ::no It runs every time the `tryCatch` completes.

=== step === quiz
::eyebrow Question 5 of 8
## After an error, where did it come from
An error fired deep inside nested function calls. Which tool shows you the chain of calls that led to it?
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- `traceback()`, which prints the call stack leading to the error. ::ok Right. `traceback()` shows the path of calls, so you can see which function actually raised the error.
- `stopifnot()`. ::no `stopifnot()` validates inputs; it does not report a past error's path.
- `message()`. ::no A message prints a note; it does not reconstruct the call stack.
- `library()`. ::no Loading a package has nothing to do with tracing an error.

=== step === quiz
::eyebrow Question 6 of 8
## Freezing a function to look inside
You want to pause a running function partway through and inspect its variables interactively. Which tool does that?
::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- `traceback()`. ::no `traceback()` reports after the fact; it does not pause a running function.
- `warning()`. ::no A warning notes a concern but does not open an interactive pause.
- `browser()`, dropped into the function body. ::ok Right. `browser()` halts execution at that line and lets you look at the local variables and step through.
- `print()` on every line. ::no Printing helps a little, but `browser()` is the tool built for interactive inspection.

=== step === concept
::eyebrow Run it: recover with tryCatch
## tryCatch in live R
Make a square-root helper that returns `NA` instead of crashing on bad input. Run it on a good value and a bad one.

```r
safe_sqrt <- function(x) {
  tryCatch(sqrt(x), error = function(e) NA_real_)
}

safe_sqrt(16)       # works, returns 4
safe_sqrt("oops")   # caught, returns NA instead of stopping
```

The bad call raised an error, but `tryCatch` caught it and handed back `NA`, so the program kept going.

=== step === concept
::eyebrow Run it: validate with stopifnot
## stopifnot in live R
Guard a function's input up front, then call it on a value that passes. Run it, then change `25` to a negative number to see the named error.

```r
fee <- function(days) {
  stopifnot("days must be 0 or more" = days >= 0)
  days * 0.25
}

fee(25)   # passes the check, returns the fee
```

When the check passes, `stopifnot()` is silent and the function continues; the instant a condition is false, it stops with your named message.

=== step === complete
## Section complete
Well done. You can pick the right signal among stop, warning and message, recover from an error with `tryCatch`, validate inputs up front with `stopifnot`, rely on `finally` for cleanup, trace an error's origin with `traceback()`, and freeze a function with `browser()`. Next section: a reproducible workflow and the modern R toolchain.
