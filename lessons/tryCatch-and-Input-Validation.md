---
title: "R Foundations Lesson 2: tryCatch and Input Validation"
catalog_blurb: "Recover from errors instead of crashing, and catch bad inputs early."
description: "How to use tryCatch in R to recover from errors instead of crashing, and stopifnot to validate a function's inputs up front so failures are clear and early."
keywords: "tryCatch in R, error handling in R, input validation, stopifnot, R conditions, recover from errors, finally in R, defensive programming R"
post_type: "LESSON"
curriculum_id: "1.7.2"
webr: true
lesson_access: "free"
track: "foundations"
course_id: "nr-debugging"
course_title: "R Foundations: Debugging"
course_lesson: "2"
course_total: "3"
course_landing: "R-Foundations-Debugging-Course.html"
course_next: "Debugging-Tools-in-R.html"
course_prev: "Errors-Warnings-and-Messages.html"
---

=== step === cover
::eyebrow Lesson 2 of 3
## tryCatch and Input Validation

In Lesson 1, Priya's lending library taught its `late_fee()` function three voices: `message()`, `warning()` and `stop()`. She can now *raise* a clear signal when something is wrong. But raising a signal is only half the job.

Tonight she runs the nightly batch: 200 book returns, one after another, each priced by `late_fee()`. Buried in that list is a single corrupt record, a book scanned as `-3` days late. With what she knows so far, that one bad row throws an error and the *entire* run stops dead, leaving the other 199 books unpriced. She needs two new skills: a way to **catch** that error and keep going, and a way to **check** each input up front so the failure is clean and obvious instead of a crash three steps later.

By the end of this lesson you will be able to:

- Use `tryCatch()` to catch an error and return a fallback instead of crashing
- Explain exactly what `tryCatch()` returns, and when the `finally` block runs
- Wrap a batch so one bad record is skipped and the rest still process
- Guard a function's inputs with `stopifnot()` so bad input fails fast with a clear message

**Prerequisites:** you can [write a function](Writing-Functions-in-R.html) with arguments and a return value, you know [`if` and `else`](Control-Flow-in-R.html), and you have met [`stop()`, `warning()` and `message()`](Errors-Warnings-and-Messages.html) from Lesson 1.

::widget process-flow {"steps":[{"title":"Run the risky line","sub":"the call that might fail on a bad record"},{"title":"It fails","sub":"an error is raised, which would normally halt everything"},{"title":"Catch it","sub":"your handler runs instead of the program stopping"},{"title":"Carry on","sub":"return a fallback value and move to the next record"}]}

=== step === concept
::eyebrow The problem
## One bad record halts the whole run

Here is Priya's helper from Lesson 1. It refuses impossible input by calling `stop()`, which raises an **error**: a condition severe enough that R abandons the rest of the work. Defining the function and calling it on a sensible value is perfectly safe:

```r
# Priya's helper from Lesson 1: it stops on impossible input
late_fee <- function(days_late, rate = 0.25) {
  if (!is.numeric(days_late)) stop("days_late must be a number; you gave ", class(days_late), ".")
  if (days_late < 0) stop("days_late must be 0 or more; you gave ", days_late, ".")
  days_late * rate
}

late_fee(5)    # a normal return: 5 days at 25 cents
#> [1] 1.25
```

Now the nightly batch. The third book was scanned as `-3` days late. Watch what that one record does to the loop:

```r-static
returns <- c(5, 12, -3, 7)        # the -3 book came back before it was due
for (d in returns) print(late_fee(d))
#> [1] 1.25
#> [1] 3
#> Error in late_fee(-3) : days_late must be 0 or more; you gave -3.
# the loop dies on -3, so the 7-day book is never priced
```

The error did its job, it stopped bad work, but it stopped *all* the work. Two books priced, the bad one rejected, and the last book silently lost. Priya does not want the run to die; she wants it to skip the one bad record and finish the other 199. For that she needs to **catch** the error.

=== step === concept
::eyebrow The core tool
## tryCatch(): run this, and if it fails, do that

`tryCatch()` runs an expression for you and stands ready with a **handler** in case that expression raises a condition. If the expression finishes normally, you get its value. If it raises an error, R does not crash; instead it runs your `error = ` handler and gives you *that* value back. You decide what "recovered" looks like.

A handler is just a function of one argument, the condition object. Inside it, `conditionMessage()` pulls out the human-readable message that `stop()` attached, so you can log exactly what went wrong:

```r
# tryCatch runs the first expression; if it raises an error, the
# error = ... handler runs INSTEAD and supplies the value
result <- tryCatch(
  late_fee(-3),                    # this raises an error
  error = function(e) {
    message("Skipped one record: ", conditionMessage(e))
    NA_real_                        # the fallback value to use instead
  }
)
result
#> [1] NA
```

The error from `late_fee(-3)` never reached the top level, so nothing crashed. The handler ran, printed a note, and handed back `NA`. That `NA` is now sitting in `result`, ready to be filtered out later.

`tryCatch()` can listen for more than errors. You name one handler per condition type, plus an optional `finally`:

| Argument | Fires when the expression raises... | Typical use |
|---|---|---|
| `error = function(e)` | an error (from `stop()`) | recover, log, return a fallback |
| `warning = function(w)` | a warning (from `warning()`) | treat a warning as fatal, or note it |
| `message = function(m)` | a message (from `message()`) | capture or silence a status note |
| `finally = ` | always (error or not) | cleanup that must happen either way |

[NOTE]
A handler is matched by the *type* of condition. An `error = ` handler ignores warnings and messages; it only catches errors. If you want to catch a warning, add a `warning = ` handler too.

=== step === concept
::eyebrow How it runs
## What runs, and in what order

The single thing learners get wrong about `tryCatch()` is the order of events, so let us pin it down. R evaluates the first expression. The moment a *matching* condition is raised, it abandons the rest of that expression, jumps to the handler, and the handler's return value becomes the value of the whole `tryCatch()` call. Whether or not anything failed, the `finally` block runs last.

::widget process-flow {"steps":[{"title":"Evaluate the expression","sub":"tryCatch runs its first argument"},{"title":"On a matching condition, jump","sub":"abandon the rest, run that handler instead"},{"title":"The handler supplies the value","sub":"its return becomes the value of tryCatch"},{"title":"finally always runs","sub":"cleanup happens whether or not there was a failure"}]}

`finally` is for cleanup you cannot afford to skip: closing a file, logging that a record was processed, releasing a connection. It runs on the happy path and the error path alike. Here is the same call on a good record and a bad one:

```r
process_one <- function(x) {
  tryCatch(
    late_fee(x),
    error = function(e) NA_real_,
    finally = message("Processed one return record.")
  )
}

process_one(7)     # valid: returns the fee, and finally still runs
#> Processed one return record.
#> [1] 1.75

process_one(-3)    # invalid: error caught, returns NA, finally STILL runs
#> Processed one return record.
#> [1] NA
```

Notice the `finally` note prints in *both* calls, the successful one and the failed one. That is the guarantee: `finally` is the code that always happens.

=== step === quiz
::eyebrow Check yourself
## When nothing goes wrong

You write `tryCatch(late_fee(5), error = function(e) NA_real_)`. The call `late_fee(5)` succeeds, no error at all. What value does the `tryCatch()` return?

::quiz {"correct":1,"gate":true,"difficulty":"beginner"}
- `1.25`, the value of the expression; the error handler is skipped entirely ::ok Right. The handler only runs when a matching condition is raised. With no error, `tryCatch()` simply hands back the expression's own value, here `5 * 0.25`.
- `NA`, because the error handler always provides the return value ::no The error handler runs *only* when an error is raised. On a clean call it never fires, so you get the expression's real value, not the fallback.
- `NULL`, because no handler was triggered ::no `tryCatch()` is not empty-handed on success. It returns the value of the expression it ran; the handler is simply bypassed.

=== step === concept
::eyebrow The payoff
## Catch per record, keep the batch alive

Now the move Priya actually needs. Instead of wrapping the whole loop in one `tryCatch()` (which would still stop at the first bad row), she wraps *each record* individually. One corrupt row becomes a single `NA`, and every other row sails through:

```r
returns <- c(5, 12, -3, 7, -1)        # two impossible values mixed in
fees <- sapply(returns, function(d) {
  tryCatch(late_fee(d), error = function(e) NA_real_)
})
fees
#> [1] 1.25 3.00   NA 1.75   NA

sum(fees, na.rm = TRUE)                 # the good rows still total up cleanly
#> [1] 6
```

Five records in, five results out, no crash. The two impossible days became `NA`, the three valid books were priced, and `na.rm = TRUE` quietly drops the gaps when Priya totals the night's fees. This pattern, *wrap the risky step per item and return a sentinel on failure*, is how you make a long batch resilient instead of brittle.

[KEY INSIGHT]
Where you put the `tryCatch()` decides what survives a failure. Around the whole loop, one bad row sinks the batch. Around each item, one bad row sinks only itself. Catch as close to the risky operation as you can.

=== step === concept
::eyebrow The other half
## Guard the inputs up front with stopifnot()

Catching errors handles the records you cannot fix. But many failures are avoidable, and the kindest thing a function can do is refuse bad input *immediately*, before it computes anything, with a message that says exactly which rule broke. In Lesson 1 Priya wrote that guard by hand with `if` and `stop()`. `stopifnot()` collapses a whole stack of those guards into one line.

You give `stopifnot()` a series of conditions that must all be `TRUE`. If every one holds, it returns nothing and your function carries on. The instant one is `FALSE`, it raises an error and stops. Name each condition and that name becomes the error message:

```r
late_fee <- function(days_late, rate = 0.25) {
  stopifnot(
    "days_late must be numeric"             = is.numeric(days_late),
    "days_late must be 0 or more"           = days_late >= 0,
    "rate must be a single positive number" = length(rate) == 1 && rate > 0
  )
  days_late * rate
}

late_fee(5)     # every check passes, so the function sails straight through
#> [1] 1.25
```

All three checks held, so `stopifnot()` was silent and you got the fee. Now feed it the impossible record and the matching name comes back as a clean, specific error:

```r-static
late_fee(-3)
#> Error in late_fee(-3) : days_late must be 0 or more
```

[NOTE]
Always *name* your conditions. The unnamed form, `stopifnot(days_late >= 0)`, still works but reports the raw expression: `Error: days_late >= 0 is not TRUE`. The named form lets you write a sentence a human can act on. Put these guards at the very top of the function, before any real work, so bad input fails fast and the rest of the body can trust its arguments.

=== step === quiz
::eyebrow Check yourself
## Prevent, or recover?

A function is handed a value that is plainly wrong, a piece of text where it needs a number. You want it to refuse immediately, with a clear message, rather than compute nonsense or limp along. Which tool fits?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Wrap the function body in `tryCatch()` so the bad input is caught ::no `tryCatch()` *recovers* from an error after it has been raised. Here you want to *prevent* the bad work from ever running, which is validation's job, not recovery's.
- Guard the top of the function with `stopifnot()`, so it fails fast with a clear message ::ok Right. `stopifnot()` checks the inputs before any real work and raises a clear, named error the moment a rule is broken, so the function never computes on input it already knows is wrong.
- Issue a `warning()` and keep going, fixing the value later ::no A warning lets the function press on with input it already knows is invalid, and warnings are easy to miss. When the input cannot be right, stop, do not warn.

=== step === tryit
::eyebrow Your turn
## Make late_fee robust

Put both halves together. Below, `late_fee()` should **validate** its input up front, and the nightly job should **recover** from any record that still slips through. The validation line is missing.

Replace the `____` with the function that checks a list of conditions and stops on the first failure (use the named-condition form already written for you). Then check your answer.

```r
late_fee <- function(days_late, rate = 0.25) {
  ____(
    "days_late must be 0 or more" = days_late >= 0
  )
  days_late * rate
}

# the nightly job validates each record but never crashes on a bad one
safe_total <- sum(sapply(c(5, -3, 7), function(d) {
  tryCatch(late_fee(d), error = function(e) NA_real_)
}), na.rm = TRUE)
safe_total
```
::check {"regex":"stopifnot","gate":true,"difficulty":"intermediate","ok":"That is the pairing to remember: stopifnot guards the input so bad data fails fast, and tryCatch around the batch turns that failure into a skipped record instead of a crash. The -3 book becomes NA, and 5 plus 7 days totals to 3.","no":"Use stopifnot here. It takes the named conditions and raises a clear error the moment one is FALSE, exactly the up-front guard the function needs."}
::solution
```r
late_fee <- function(days_late, rate = 0.25) {
  stopifnot("days_late must be 0 or more" = days_late >= 0)
  days_late * rate
}

safe_total <- sum(sapply(c(5, -3, 7), function(d) {
  tryCatch(late_fee(d), error = function(e) NA_real_)
}), na.rm = TRUE)
safe_total
#> [1] 3
```

=== step === concept
::eyebrow Go deeper
## References

A few authoritative, free places to take this further:

- [Advanced R (2e): Conditions](https://adv-r.hadley.nz/conditions.html) - Hadley Wickham on R's condition system, including how `tryCatch()` matches and handles errors, warnings and messages.
- [Base R help: conditions and tryCatch](https://stat.ethz.ch/R-manual/R-devel/library/base/html/conditions.html) - the canonical reference page for `tryCatch`, `withCallingHandlers`, `conditionMessage` and friends.
- [Base R help: stopifnot](https://stat.ethz.ch/R-manual/R-devel/library/base/html/stopifnot.html) - the official page for the validation function you used, including the named-message form.
- [Tidyverse style guide: Error messages](https://style.tidyverse.org/error-messages.html) - a practical checklist for writing the kind of clear, actionable messages your `stopifnot()` names should contain.

=== step === complete
## Lesson 2 complete

You can now make a function survive the real world. `tryCatch()` lets you catch an error and return a fallback instead of crashing, you know its handler runs only on a matching condition and that `finally` always runs, and wrapping each record in its own `tryCatch()` keeps a long batch alive past any single bad row. On the other side, `stopifnot()` guards a function's inputs up front with named, human-readable messages, so avoidable failures fail fast and clearly. Validate what you can; recover from what you cannot.

Next, Lesson 3: Debugging Tools in R. When something still goes wrong and you do not yet know why, you will trace an error back to its source with `traceback()`, freeze a running function and look around with `browser()`, and drive the IDE's debugger, turning a mysterious failure into a fixable one.
