---
title: "R Foundations Lesson 3: Debugging Tools in R"
catalog_blurb: "Find where your code broke, inspect the real values, and fix it."
description: "When R crashes with a cryptic message, locate the broken call with traceback, freeze it and read the real values with browser, and drive the RStudio debugger."
keywords: "debugging in R, traceback, browser in R, debug function, debugonce, RStudio debugger, breakpoints, recover, step through R code, R errors"
post_type: "LESSON"
curriculum_id: "1.7.3"
webr: true
lesson_access: "free"
track: "foundations"
course_id: "nr-debugging"
course_title: "R Foundations: Debugging"
course_lesson: "3"
course_total: "3"
course_landing: "R-Foundations-Debugging-Course.html"
course_next: ""
course_prev: "tryCatch-and-Input-Validation.html"
---

=== step === cover
::eyebrow Lesson 3 of 3
## Debugging Tools in R

In Lesson 2, Priya's lending library learned to *catch* failures it expected: a bad record became an `NA` instead of a crash, and `stopifnot()` turned away impossible input at the door. But tonight a different kind of trouble arrives. She runs her new nightly report and R stops dead with a message she has never seen, pointing at a line that looks perfectly fine. Nothing she validated against. She does not know *where* it broke, or *why*.

That is what debugging tools are for: not handling failures you predicted, but hunting down the ones you did not. The job is always the same four moves, shown below.

By the end of this lesson you will be able to:

- Read a `traceback()` to find the exact call where an error occurred
- Freeze a running function with `browser()` and inspect its real values
- Arm the debugger without editing the source (`debug()`), and drive the RStudio / Positron debugger
- Pick the right tool for a crash versus a silent wrong answer

**Prerequisites:** you can [write a function](Writing-Functions-in-R.html) and use [`if` and `for`](Control-Flow-in-R.html), you met [`stop()`, `warning()` and `message()`](Errors-Warnings-and-Messages.html) in Lesson 1 and [`tryCatch()` and `stopifnot()`](tryCatch-and-Input-Validation.html) in Lesson 2, and you know a vector can be [numeric or character](Atomic-Vectors-and-Data-Types.html).

::widget process-flow {"steps":[{"title":"Reproduce","sub":"make the bug happen on demand, as small as you can"},{"title":"Locate","sub":"traceback shows which call actually broke"},{"title":"Inspect","sub":"browser pauses there so you see the real values"},{"title":"Fix","sub":"change the code and rerun to confirm it is gone"}]}

=== step === concept
::eyebrow The problem
## A crash that does not name the culprit

Priya's report is three small functions stacked on top of each other. `night_report()` walks the borrowers; for each one `borrower_balance()` adds up the fees; and the old friend `late_fee()` prices a single overdue book. Defined and run on a clean night, they work exactly as you would expect:

```r
late_fee <- function(days_late, rate = 0.25) {
  days_late * rate                          # cents per overdue day
}
borrower_balance <- function(days_vec) {     # total one borrower owes tonight
  total <- 0
  for (d in days_vec) total <- total + late_fee(d)
  total
}
night_report <- function(returns) {          # one balance per borrower
  out <- numeric(length(returns))
  for (i in seq_along(returns)) out[i] <- borrower_balance(returns[[i]])
  names(out) <- names(returns)
  out
}

clean <- list(amir = c(5, 12), beth = c(0, 3, 7))   # a tidy night: all numbers
night_report(clean)
#>  amir  beth
#>  4.25  2.50
```

Now the real night. One borrower's day counts came in from a spreadsheet column that imported as *text* rather than numbers. Watch what happens:

```r-static
# beth's days arrived as the strings "0", "3", "7", not the numbers 0, 3, 7
tonight <- list(amir = c(5, 12), beth = c("0", "3", "7"))
night_report(tonight)
#> Error in days_late * rate : non-numeric argument to binary operator
```

The message is technically true but practically useless: it names an operation, not a *borrower*, and not which of the dozens of calls to `late_fee()` blew up. With one borrower you might guess. With four hundred you cannot. You need to find the exact call that broke.

=== step === concept
::eyebrow Locate
## traceback(): which call actually broke

The instant an error halts your code, R quietly records the chain of calls that led to it. Type `traceback()` immediately afterward and it prints that chain back to you:

```r-static
traceback()
#> 3: late_fee(d) at #4
#> 2: borrower_balance(returns[[i]]) at #3
#> 1: night_report(tonight)
```

Read it like a stack of plates. Each line is a function call, and each call *sits inside* the one below it: you called `night_report()` (line 1), which called `borrower_balance()` (line 2), which called `late_fee()` (line 3). The crash happened in the call printed at the **top**, the deepest one: `late_fee(d)`. That is your crime scene. The diagram below is the same chain, in the order the calls actually happened.

::widget process-flow {"steps":[{"title":"night_report(tonight)","sub":"the call you made at the console"},{"title":"borrower_balance for beth","sub":"loops over her books, calling late_fee on each"},{"title":"late_fee(d)","sub":"multiplies the day count by the rate, and crashes on text"}]}

[KEY INSIGHT]
`traceback()` answers the single hardest question first: *where*. Base R lists the most recent call at the top, so the top line is the scene of the crash. (The RStudio Traceback pane shows the same calls; just check which end is flagged as the error, since the order can be drawn either way.)

=== step === quiz
::eyebrow Check yourself
## Read the traceback

A colleague's script crashes and they send you only this `traceback()`:

```
3: parse_date(x)
2: clean_row(row)
1: load_file("sales.csv")
```

Which function should you open first to find the bug?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- `load_file()`, because it is line 1 and ran first ::no Line 1 is the call you *started* from, the outermost one. The error fired deep inside it, not in `load_file()` itself. Read to the top.
- `parse_date()`, the call at the top, where the error actually occurred ::ok Right. Base R prints the most recent call at the top, so line 3, `parse_date()`, is the deepest call and the place the error was thrown. Start there.
- `clean_row()`, because it sits in the middle ::no The middle call is just a link in the chain. It passed the work down to `parse_date()`, which is where things actually broke.

=== step === concept
::eyebrow Inspect
## browser(): freeze the code and look around

`traceback()` told Priya the crash is *inside* `late_fee()`. Now she needs to know *why*: what value did `late_fee()` actually receive? The most powerful tool for that is `browser()`. Drop it into a function and R pauses there mid-run and hands you an interactive prompt, sitting inside that exact call, with every local variable alive and inspectable.

```r-static
late_fee <- function(days_late, rate = 0.25) {
  if (!is.numeric(days_late)) browser()   # pause only when the day count is not a number
  days_late * rate
}
night_report(tonight)
#> Called from: late_fee(d)
#> Browse[1]>               # R stops and hands you a prompt INSIDE late_fee
```

At that `Browse[1]>` prompt you are standing inside the paused function. Type a variable name to see its value, and the mystery solves itself:

```r-static
Browse[1]> days_late
#> [1] "0"
Browse[1]> class(days_late)     # the smoking gun: it is text, not a number
#> [1] "character"
```

There it is. `days_late` is the string `"0"`, and `"0" * 0.25` is meaningless, hence "non-numeric argument to binary operator". From the prompt you also *drive* execution one piece at a time:

| At the `Browse[1]>` prompt | What it does |
|---|---|
| `n` | run the **n**ext line, then pause again |
| `s` | **s**tep *into* the function called on this line |
| `c` | **c**ontinue running until the next pause or the end |
| `where` | print the call stack you are currently sitting in |
| `Q` | **Q**uit the debugger and stop the call entirely |

[KEY INSIGHT]
`traceback()` is a photograph taken after the crash; `browser()` is standing in the room while it happens. One tells you *where*, the other lets you ask *what is every value right now*. Together they turn "it broke somewhere" into "it broke here, on this value."

=== step === tryit
::eyebrow Your turn
## Fix the bug you found

`browser()` revealed the cause: the import handed `late_fee()` text like `"7"` instead of the number `7`. The smallest honest fix is to coerce the day count to a number before doing arithmetic on it.

Replace the `____` with the function that turns text into a number, then check your answer. If it is right, the whole report totals cleanly with no crash.

```r
# the import handed late_fee TEXT like "7"; turn it into a number first
late_fee <- function(days_late, rate = 0.25) {
  days_late <- ____(days_late)
  days_late * rate
}
tonight <- list(amir = c(5, 12), beth = c("0", "3", "7"))
night_report(tonight)        # should now total cleanly, no crash
```
::check {"regex":"as\\.numeric","gate":true,"difficulty":"beginner","ok":"That is the fix: as.numeric() coerces \"7\" to 7 before the multiplication, so every book prices correctly and beth totals 2.50. In real code you would also guard the input up front with the stopifnot() from Lesson 2.","no":"Use as.numeric() to convert the text to a number, e.g. days_late <- as.numeric(days_late)."}
::solution
```r
late_fee <- function(days_late, rate = 0.25) {
  days_late <- as.numeric(days_late)        # coerce the imported text to a number
  days_late * rate
}
borrower_balance <- function(days_vec) {
  total <- 0
  for (d in days_vec) total <- total + late_fee(d)
  total
}
night_report <- function(returns) {
  out <- numeric(length(returns))
  for (i in seq_along(returns)) out[i] <- borrower_balance(returns[[i]])
  names(out) <- names(returns)
  out
}

tonight <- list(amir = c(5, 12), beth = c("0", "3", "7"))
night_report(tonight)
#>  amir  beth
#>  4.25  2.50
```

=== step === concept
::eyebrow Inspect, without editing
## debug() and the IDE debugger

Editing a function to insert `browser()` is fine for your own code, but you often want to inspect a function you should not (or cannot) edit, like one from a package. `debug()` solves that: it arms a function so the *next* call drops you into the browser, with no change to the source. `debugonce()` does the same for a single call and then disarms itself.

```r-static
debug(late_fee)        # arm it: every call now opens the browser
night_report(tonight)  # pauses inside late_fee, exactly like an inserted browser()
undebug(late_fee)      # disarm it again when you are done

debugonce(late_fee)    # same, but auto-clears after one call

options(error = recover)   # after ANY error, offer to step into any frame
options(error = NULL)      # restore the default when finished
```

Every one of these is what the RStudio and Positron debuggers wrap in buttons. You set a breakpoint by clicking the margin instead of typing `browser()`, and a toolbar replaces the one-letter commands:

| In the console | In RStudio / Positron |
|---|---|
| a `browser()` line or `debug(f)` | click the gutter to set a breakpoint (Shift+F9) |
| the `Browse[1]>` prompt | the debug toolbar appears over your source |
| `n` (next) / `s` (step into) / `c` (continue) | the Next / Step Into / Continue buttons |
| `Q` (quit) | the Stop button |
| typing a name / `ls()` | the Environment pane lists every live variable |
| `traceback()` | the Traceback pane, click a call to jump to it |

[NOTE]
After a crash, "Rerun with Debug" in the IDE reruns the failing call with the debugger already armed, so you land at the error with the whole call stack and every variable in front of you, without re-typing anything.

=== step === quiz
::eyebrow Check yourself
## No error, but a wrong answer

The report runs to the end with no error at all, but one borrower's balance comes back as `40.00` when it should be about `4.00`. Nothing crashed, so `traceback()` shows nothing useful. What is the right move?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Set `browser()` (or `debug()`) inside the function and inspect the values as it computes ::ok Right. A wrong-but-not-crashing result is a *logic* bug, not a thrown error, so there is no traceback to read. You have to watch the real values flow through, which is exactly what browser and debug let you do.
- Call `traceback()` to see where the wrong number came from ::no `traceback()` only reports the call stack of the *last error*. Nothing errored here, so it has nothing to show. Traceback is for crashes, not for wrong answers.
- Add a `tryCatch()` around the call to recover from it ::no `tryCatch()` recovers from errors, but there is no error to catch. The code is running happily and producing the wrong number; you need to *inspect* it, not catch it.

=== step === concept
::eyebrow Know the limits
## When these tools do not help

`browser()`, `debug()` and `recover()` all do one thing: pause and wait for *you* to type. That makes them powerful at the console and useless anywhere that cannot answer a prompt.

- **Interactive only.** In a script run with `Rscript`, a scheduled job, a knitted report, or this in-browser session, there is no one to type `n` or `c`. A pause there just hangs.
- **Never ship a stray `browser()`.** Left in code that runs unattended, it silently freezes the whole job. Always remove it once the bug is found.
- **`traceback()` is error-only.** It reports the last crash and nothing else, so it cannot help with a wrong-but-silent result.
- **Reproduce first.** Half of debugging is shrinking the input to the smallest case that still fails. A two-row example beats a million-row one every time.

For the non-interactive cases, fall back to tools that leave a record instead of pausing: a few `print()` or `message()` lines to log values, `options(error = ...)` to dump diagnostics on failure, and unit tests (the `testthat` package) so a bug you fixed cannot quietly return.

[WARNING]
A `browser()` accidentally left in a function will hang any automated run, a CI build, a nightly cron job, a report render, because it sits forever waiting for input that never comes.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative, free places to take this further:

- [Advanced R (2e): Debugging](https://adv-r.hadley.nz/debugging.html) - Hadley Wickham on the overall debugging workflow and how `traceback()`, `browser()` and the IDE tools fit together.
- [Debugging with the RStudio IDE (Posit)](https://support.posit.co/hc/en-us/articles/205612627-Debugging-with-the-RStudio-IDE) - the canonical guide to breakpoints, the debug toolbar, the Environment pane and "Rerun with Debug".
- [Base R help: traceback](https://stat.ethz.ch/R-manual/R-devel/library/base/html/traceback.html) - the official reference for the call-stack tool you used to locate the crash.
- [Base R help: browser](https://stat.ethz.ch/R-manual/R-devel/library/base/html/browser.html) - the official reference for the pause-and-inspect prompt, including the one-letter step commands.

=== step === complete
## Lesson 3 complete

You can now chase down a bug you did not see coming. `traceback()` reads the call stack after a crash and points you at the exact call that broke, with the deepest call printed at the top. `browser()` freezes a running function so you can read its real variables and step through it line by line; `debug()` and `debugonce()` do the same without editing the source, and the RStudio / Positron debugger wraps all of it in breakpoints, a toolbar and an Environment pane. And you know the edges: these are interactive tools, never to be left in unattended code, and useless for a wrong answer that never raises an error, where logging and tests take over.

That completes R Foundations: Debugging. You can now make your code speak clearly (Lesson 1), survive bad input (Lesson 2), and surrender its secrets when something still goes wrong (Lesson 3). The next section moves from fixing code to keeping a whole project reproducible, with projects, `renv` and the modern R toolchain.
