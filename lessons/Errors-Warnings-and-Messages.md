---
title: "R Foundations Lesson 1: Errors, Warnings and Messages"
catalog_blurb: "Signal problems clearly so users know exactly what to fix."
description: "How stop, warning and message signal problems in R, when to reach for each, and how to write clear error messages that your users can actually act on."
keywords: "R error handling, stop in R, warning in R, message in R, actionable error messages, condition system in R, signalling conditions, base R debugging"
post_type: "LESSON"
curriculum_id: "1.7.1"
webr: true
lesson_access: "free"
track: "foundations"
course_id: "nr-debugging"
course_title: "R Foundations: Debugging"
course_lesson: "1"
course_total: "3"
course_landing: "R-Foundations-Debugging-Course.html"
course_next: "tryCatch-and-Input-Validation.html"
course_prev: ""
---

=== step === cover
::eyebrow Lesson 1 of 3
## Errors, Warnings and Messages

Priya runs a small lending library. She is writing one R function, `late_fee()`, that takes how many days a book is overdue and returns what the borrower owes at 25 cents a day. Five days late is a tidy `5 * 0.25 = $1.25`.

But the real world is messier than that. Sometimes the scanner hands her *3.5* days. Sometimes a typo sends in *-3* days, a book returned before it was even due. Her function needs a way to *speak up*: to say "just so you know", to say "this looks off", and to say "I cannot continue". R gives her exactly three voices for that, and they differ by one thing: how loudly they interrupt.

This lesson is about those three voices, `message()`, `warning()` and `stop()`, the escalation ladder in the diagram below. Get them right and the people using your code (often future-you) know precisely what happened and what to do next.

By the end of this lesson you will be able to:

- Pick the right signal, `message()`, `warning()` or `stop()`, for a given situation
- Use `message()` to report progress without changing the result or halting
- Use `warning()` to flag a recoverable problem, and know warnings are easy to miss
- Use `stop()` to halt cleanly on an unrecoverable problem
- Write an error message a stranger can actually act on

**Prerequisites:** you can [run R and call a function](R-Syntax-and-First-Objects.html), you can [write your own function](Writing-Functions-in-R.html) with arguments and a return value, and you know [`if` and `else`](Control-Flow-in-R.html).

::widget process-flow {"steps":[{"title":"message()","sub":"just so you know; the code keeps running"},{"title":"warning()","sub":"this looks off; the code keeps running, but it is flagged"},{"title":"stop()","sub":"cannot continue; the code halts right here"}]}

=== step === concept
::eyebrow The mental model
## Three ways your code can speak up

When R hits one of these three calls, it raises a **condition**: a small signal that says "something happened here." A condition does not have to be a disaster. The three you will use every day differ by *severity*, which decides whether your code keeps running.

| You call | Severity | Does the function keep running? | Shown as | Use it when... |
|---|---|---|---|---|
| `message()` | info | yes | a plain note | you want to report progress or a choice you made |
| `warning()` | caution | yes (the warning is held until the end) | `Warning message:` | something is odd but you can sensibly continue |
| `stop()` | error | **no, it halts** | `Error:` | you cannot produce a correct result, so you must not try |

[KEY INSIGHT]
The single question that picks the signal for you is: **can the function still do its job correctly?** Yes, no problem at all: a `message()`. Yes, but the caller should know: a `warning()`. No: a `stop()`. Severity is not about how you feel; it is about whether the work can honestly continue.

For Priya's `late_fee()`: announcing the charge is a message, silently rounding a fractional day is a warning, and refusing a negative day is a stop. We will build each one now.

=== step === concept
::eyebrow The quiet voice
## message(): a note off to the side

A `message()` is a sticky note. It tells whoever is watching what your code is doing, the result is unaffected and the function rolls right on. Here is Priya's first version, which announces each calculation:

```r
# Priya's late-fee helper, with a progress note
late_fee <- function(days_late, rate = 0.25) {
  message("Calculating fee for ", days_late, " days at $", rate, "/day.")
  days_late * rate
}

fee <- late_fee(5)
#> Calculating fee for 5 days at $0.25/day.
fee
#> [1] 1.25
```

Notice the note appeared, and then `fee` is still exactly `1.25`. That is the whole point: the message is information *about* the work, not part of the result.

Two details that matter. First, `message()` glues its pieces together with no spaces between them, so you write the spaces you want inside the quotes (`"... for "`, `" days at $"`). Second, a message is printed to a separate channel called *standard error*, not mixed into your real output, and `message()` itself returns nothing. So a message never pollutes a value you are saving or piping onward.

When you do not want the chatter, silence it at the call site with `suppressMessages()`. The work still happens; only the note is hidden:

```r
quiet_fee <- suppressMessages(late_fee(5))
quiet_fee
#> [1] 1.25
```

[NOTE]
Reach for `message()`, not `print()` or `cat()`, for status updates. Because messages go to the side channel, a user can switch them off with `suppressMessages()` and they never contaminate the data your function returns. `print()` and `cat()` cannot be silenced that cleanly.

=== step === quiz
::eyebrow Check yourself
## What does a message do to your function?

Inside a function you call `message("halfway done")` and then keep computing. What happens to the function *after* that `message()` line runs?

::quiz {"correct":1,"gate":true,"difficulty":"beginner"}
- It keeps running and returns its result as usual ::ok Right. A message is purely informational: it prints a note to the side channel and execution continues, so the function still returns its normal value.
- It stops immediately, the way an error does ::no That describes `stop()`, not `message()`. A message never halts execution; the function carries on to its return value.
- It pauses and waits for the user to type a response ::no `message()` does not prompt or pause for input. It prints its note and the code moves straight on to the next line.

=== step === concept
::eyebrow The caution voice
## warning(): something looks off, but carry on

A `warning()` is the yellow caution light. Your code can still finish, but it wants the caller to know it made a judgement call. Priya sometimes gets a fractional day like `3.5` from the scanner. She decides that is recoverable: round to whole days, but flag it so nobody is surprised by the rounding.

```r
late_fee <- function(days_late, rate = 0.25) {
  if (days_late != round(days_late)) {
    warning("days_late was ", days_late, "; rounding to ", round(days_late), " whole days.")
    days_late <- round(days_late)
  }
  message("Calculating fee for ", days_late, " days at $", rate, "/day.")
  days_late * rate
}

fee <- late_fee(3.5)
fee
#> [1] 1
```

Run that and watch the *order* of what prints. The `warning()` line runs first in the code, yet its "Warning message:" appears **after** the "Calculating fee for 4 days" note. That is because, by default, R holds warnings until the function finishes and then reports them together. A warning is a deferred caution, not an interruption: the function ran to completion and returned `1` (four days at 25 cents).

Because warnings are held to the end and printed in a muted style, they are genuinely easy to miss in a long run. When you want them gone on purpose, wrap the call in `suppressWarnings()`:

```r
fee <- suppressWarnings(late_fee(3.5))
fee
#> [1] 1
```

[NOTE]
If a warning really should be treated as fatal, you can promote every warning to an error for a session with `options(warn = 2)`. That is a debugging trick for hunting down a warning's source, not something to leave on in normal code.

=== step === concept
::eyebrow The hard stop
## stop(): refuse to continue

A `stop()` is a road barrier. When your function cannot produce a correct answer, the honest move is to halt rather than return nonsense. A book returned *before* it was due, `-3` days late, is meaningless input: there is no sensible fee. So Priya guards against it.

When `stop()` runs, R raises an **error** condition, immediately abandons the rest of the function, and unwinds back to the top. Nothing after the `stop()` line executes. Because that halt cannot happen inside this in-browser session without ending the run, here is what it looks like in your own R console:

```r-static
late_fee(-3)
#> Error in late_fee(-3) : days_late must be 0 or more; you gave -3.
# execution stops here. the lines below never run.
```

Now the runnable version. Defining the function is always safe, the guard only fires when someone actually passes bad input, so this block defines `late_fee()` with two guards and then calls it with a *valid* number:

```r
late_fee <- function(days_late, rate = 0.25) {
  if (!is.numeric(days_late)) {
    stop("days_late must be a number; you gave ", class(days_late), ".")
  }
  if (days_late < 0) {
    stop("days_late must be 0 or more; you gave ", days_late, ".")
  }
  days_late * rate
}

late_fee(5)     # a valid call sails straight through the guards
#> [1] 1.25
```

The two guards sit at the very top, a habit worth keeping: check the inputs first, fail fast and loudly, and only then do the real work on data you trust.

[KEY INSIGHT]
`message()`, `warning()` and `stop()` are all **conditions**, the same underlying mechanism at three severities. That shared nature is the hinge of the next lesson: because an error is just a condition R signals, you can *catch* it with `tryCatch()` and recover instead of crashing.

=== step === concept
::eyebrow The craft
## Write an error message someone can act on

`stop()` halts your code; a *good* `stop()` message tells the reader how to get going again. The difference between a message that wastes ten minutes and one that fixes the problem instantly is whether it answers three questions: **what went wrong, what was expected versus what arrived, and what to do about it (including the offending value).**

| Vague, unhelpful | Actionable | Why the second wins |
|---|---|---|
| `stop("invalid input")` | `stop("days_late must be 0 or more; you gave ", days_late, ".")` | names the argument, the rule, and the actual bad value |
| `stop("bad data")` | `stop("scores must be numeric; column grade is character. Convert it with as.numeric().")` | says which column, what type it is, and the exact fix |

[KEY INSIGHT]
A reader hits your error with zero context. Give them the noun (which argument or column), the rule it broke (expected versus actual), and the value that broke it. Paste the real value into the message with extra arguments to `stop()`, exactly like `message()` and `warning()` do, so the reader sees `-3`, not a generic complaint.

A small kindness with outsized payoff: the person reading "you gave -3" is very often you, six months from now, with no memory of how this function works.

=== step === tryit
::eyebrow Your turn
## Write the actionable message

Here is Priya's finished helper, with all three voices working together: a guard that **stops** on impossible input, a **warning** that rounds a fractional day, and a **message** that reports the charge. One piece is missing, the error message itself.

Replace the `____` so the message is *actionable*: name the argument `days_late`, state the rule, and paste in the bad value (follow the pattern from the table). Then check your answer.

```r
late_fee <- function(days_late, rate = 0.25) {
  if (!is.numeric(days_late) || days_late < 0) {
    stop("____")                       # make this actionable
  }
  if (days_late != round(days_late)) {
    warning("days_late was ", days_late, "; rounding to ", round(days_late), ".")
    days_late <- round(days_late)
  }
  message("Charging for ", days_late, " days at $", rate, "/day.")
  days_late * rate
}
late_fee(7)
```
::check {"regex":"stop.*days_late","gate":true,"difficulty":"intermediate","ok":"Good. Naming days_late inside the stop() message tells the reader exactly which argument was wrong; pasting the value in with an extra argument makes it even clearer.","no":"Mention the argument by name inside stop(): start the message with days_late, for example name the argument, state the rule, then paste the value with a second argument."}
::solution
```r
late_fee <- function(days_late, rate = 0.25) {
  if (!is.numeric(days_late) || days_late < 0) {
    stop("days_late must be a non-negative number; you gave ", days_late, ".")
  }
  if (days_late != round(days_late)) {
    warning("days_late was ", days_late, "; rounding to ", round(days_late), ".")
    days_late <- round(days_late)
  }
  message("Charging for ", days_late, " days at $", rate, "/day.")
  days_late * rate
}
late_fee(7)
#> Charging for 7 days at $0.25/day.
#> [1] 1.75
```

=== step === quiz
::eyebrow Check yourself
## Which voice fits?

Your function reads a configuration file that lists which reports to build. On this run the file is missing entirely, so the function has nothing at all to work with. Which signal should it use?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- `message()`, because the file being missing is just useful information ::no A message would let the function press on with no configuration and silently build the wrong thing. This situation is fatal, not informational.
- `warning()`, so the run continues and you notice the warning later ::no A warning lets broken code keep running on data it does not have. Warnings are also easy to miss, exactly the wrong outcome when the work cannot succeed.
- `stop()`, because without the file there is no correct result to return ::ok Right. The function genuinely cannot do its job, so halting now with a clear message is the honest choice, far better than returning a wrong or empty answer.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative, free places to take this further:

- [Advanced R (2e): Conditions](https://adv-r.hadley.nz/conditions.html) - Hadley Wickham on R's condition system: how `message`, `warning` and `stop` signal conditions, and how handlers catch them.
- [Tidyverse style guide: Error messages](https://style.tidyverse.org/error-messages.html) - a practical checklist for writing error messages people can act on; the source of the "state the problem, then what to do" habit.
- [R Language Definition: Condition handling](https://cran.r-project.org/doc/manuals/r-release/R-lang.html#Condition-handling) - the official specification of how errors, warnings and conditions behave.
- [Base R help: stop, warning and message](https://stat.ethz.ch/R-manual/R-devel/library/base/html/stop.html) - the canonical reference pages for the three functions you used here.

=== step === complete
## Lesson 1 complete

You now have all three of R's voices. You can drop a `message()` to report progress without touching the result, raise a `warning()` to flag a recoverable oddity (knowing it is deferred to the end and easy to miss), and `stop()` cleanly when the work cannot honestly continue, with an error message that names the argument, the rule and the offending value. The thread tying them together: all three are *conditions* R signals at different severities.

Next, Lesson 2: tryCatch and Input Validation. So far you have learned to *raise* signals; now you will learn to *catch* them, recovering from an error instead of crashing, and to guard a function's inputs up front with `stopifnot()` so the guards you hand-wrote today become a single tidy line.
