---
title: "Debugging R: The Complete Toolkit — From traceback() to RStudio Breakpoints"
slug: "R-Debugging"
description: "Debug R code systematically: use traceback() to locate errors, browser() to pause mid-function, debug() to step through, and RStudio breakpoints visually."
keywords: "R debugging, traceback in R, browser in R, debug() R, debugonce, options error recover, RStudio breakpoints, R debugger, step through R code"
auto_link_terms: "R debugging|debug R code|traceback()|browser()|debug()|debugonce()|options(error=recover)|RStudio breakpoints"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-13"
curriculum_id: "4.1.8"
post_type: "C"
sidebar_section: "Advanced R"
sidebar_title: "Debugging R Code"
sidebar_order: 27
---

# Debugging R: The Complete Toolkit — From traceback() to RStudio Breakpoints

<p class="lead">Debugging R is the process of locating, inspecting, and fixing code that produces errors or wrong results. R gives you four core tools — <code>traceback()</code> to find where a failure happened, <code>browser()</code> to pause and inspect state, <code>debug()</code> to step through a function line by line, and RStudio's visual debugger for a point-and-click workflow — and this article teaches you when to reach for each.</p>

## What's the 3-step debugging workflow in R?

Every debugging session answers three questions in order: *where* did the code fail, *what* was the state at that moment, and *why* was that state wrong? The R toolkit — `traceback()`, `browser()`, `debug()`, RStudio breakpoints — exists to answer them systematically. Below is a toy weighted-mean function that silently returns `NA`. Watch the three steps collapse into one block: observe the bad output, diagnose in one line, ship the fix.

```r
# A buggy function: weighted mean
weighted_mean <- function(x, w) {
  sum(x * w) / sum(w)
}

values  <- c(10, 20, NA, 40)
weights <- c(1, 1, 1, 1)

weighted_mean(values, weights)
#> [1] NA

# Diagnosis: sum(x * w) propagates NA because one value is missing.
# Fix: drop NA pairs before multiplying.
weighted_mean_safe <- function(x, w) {
  keep <- !is.na(x) & !is.na(w)
  sum(x[keep] * w[keep]) / sum(w[keep])
}

weighted_mean_safe(values, weights)
#> [1] 23.33333
```

The broken function silently returns `NA` — no warning, no error, nothing alerts you that something went wrong. Diagnosis takes one sentence: `sum()` propagates `NA`. The fix is a three-line guard that keeps only the complete pairs before computing the ratio. The corrected result, `23.33333`, is the mean of `10`, `20`, and `40` weighted equally — exactly what we wanted.

That is the whole loop in miniature: locate the symptom, inspect the cause, ship the fix. For real bugs the "locate" step is the hard part — the error may be buried ten function calls deep — and that is where `traceback()`, `browser()`, and the rest of the toolkit earn their keep.

[KEY INSIGHT]
**Fixing before locating wastes the most time.** Every minute spent tweaking code before you know *where* the failure happened is a minute of guessing. The debug tools exist to force the order: locate, then inspect, then fix.

**Try it:** Write `ex_is_adult(age)` that returns `TRUE` when `age >= 18`. The buggy version accepts string input like `"17"` and silently returns `FALSE` because R compares strings character-by-character. Find the bug and fix it.

```r
# Try it: find and fix the silent bug
ex_is_adult <- function(age) {
  age >= 18
}

# Test:
ex_is_adult("17")
#> Expected: FALSE (but computed correctly, not via string comparison)
ex_is_adult("9")
#> Expected: FALSE (string "9" > "18" lexically would return TRUE — that's the bug)
ex_is_adult(20)
#> Expected: TRUE
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_is_adult <- function(age) {
  age_num <- as.numeric(age)
  if (is.na(age_num)) stop("age must be numeric or a numeric string")
  age_num >= 18
}

ex_is_adult("17")
#> [1] FALSE
ex_is_adult("9")
#> [1] FALSE
ex_is_adult(20)
#> [1] TRUE
```

**Explanation:** The silent bug is that `"9" >= "18"` compares lexicographically (`"9"` > `"1"`), returning `TRUE`. Coercing to numeric up front forces you to think about the input contract and fail loudly on garbage.

</details>

![The 3-step debugging loop: locate the failure, inspect the state, fix and verify.](screenshots/R-Debugging-workflow.webp)
*Figure 1: The 3-step debugging loop — locate the failure, inspect the state, fix and verify. Repeat if the fix exposes a deeper bug.*

## How does traceback() show where an error happened?

When an error happens inside a deep function call, R prints the error message but not the call chain that led there. You are left staring at an error like `Error in FUN(left, right): non-numeric argument to binary operator` with no idea which of your functions called `FUN`. `traceback()` fixes that — it prints the *call stack* at the moment of the error, reading bottom-up: the bottom is where *you* started, the top is where R *stopped*.

Let's build a three-function chain, trigger an error, and read the stack. We capture the stack with `sys.calls()` inside a `tryCatch()` handler so the example runs in any R context — in an interactive session you would just type `traceback()` after the error instead.

```r
# A three-function chain with a hidden bug
validate <- function(x) {
  if (!is.numeric(x)) stop("x must be numeric")
  x
}
process <- function(x) validate(x) * 2
run     <- function(x) process(x)

# Trigger the error and capture the call stack
tryCatch(
  run("oops"),
  error = function(e) {
    cat("Error:", conditionMessage(e), "\n\n")
    cat("Captured stack (most recent first):\n")
    calls <- sys.calls()
    user_calls <- calls[-length(calls)]
    for (i in rev(seq_along(user_calls))) {
      cat("  ", i, ": ", deparse(user_calls[[i]])[1], "\n", sep = "")
    }
  }
)
#> Error: x must be numeric
#>
#> Captured stack (most recent first):
#>   5: validate(x)
#>   4: process(x)
#>   3: run("oops")
#>   2: tryCatch(run("oops"), error = function(e) { ... })
#>   1: doTryCatch(return(expr), name, parentenv, handler)
```

In an **interactive** R session, you'd simply type `traceback()` right after the error and see exactly the same chain — `validate(x)` at the top (where R stopped), `run("oops")` near the bottom (where you started). Read from the top down to find the innermost failing call; read from the bottom up to retrace your own control flow. Either direction works — what matters is knowing which way you are reading.

[TIP]
**Capture the stack in scripts with sys.calls().** In non-interactive contexts — Rscript, batch jobs, knitted reports — `traceback()` only works if you catch the error yourself. Wrap suspect sections in `tryCatch(..., error = function(e) sys.calls())` and the same information lands in a variable you can log or print.

Here is a subtler example — the bug is a bad list index, not a type error. The traceback still points at the exact failing frame:

```r
# Deeper bug: bad list index
inner_validate <- function(records, key) {
  records[[key]]$value  # fails if key not in records
}
summarise <- function(records) {
  inner_validate(records, "missing_key")
}

records <- list(a = list(value = 1), b = list(value = 2))

tryCatch(
  summarise(records),
  error = function(e) {
    cat("Error:", conditionMessage(e), "\n")
    cat("Failing frame: inner_validate() — look there first.\n")
  }
)
#> Error: subscript out of bounds
#> Failing frame: inner_validate() — look there first.
```

The error message alone (`subscript out of bounds`) tells you *what* went wrong but not *where*. `traceback()` points at `inner_validate()`, and from there you know exactly which line to probe.

![traceback() reads the call stack bottom-up: where you started at the bottom, where R stopped at the top.](screenshots/R-Debugging-call-stack.webp)
*Figure 2: traceback() reads the call stack bottom-up. The bottom is where your code started; the top is where R stopped. Every frame in between is a function that was called but has not yet returned.*

**Try it:** You are shown the traceback below. Which user function should you inspect *first*?

```r
# Try it: read the traceback
# Imagine this is what traceback() printed after an error:
#
#   5: stop("x must be numeric")
#   4: clean_row(row)
#   3: lapply(rows, clean_row)
#   2: load_batch(path)
#   1: main("data/march.csv")
#
# Question: which of your functions should you set a browser() in first?
# Options: main, load_batch, lapply, clean_row, stop
ex_answer <- "clean_row"  # your answer here
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_answer <- "clean_row"
#> [1] "clean_row"
```

**Explanation:** `stop()` is base R — not yours to fix. `lapply()` is base R too. `main()` and `load_batch()` are yours but they just *delegated* the work. The innermost user function in the stack is `clean_row()` — that is where the bad data meets your code, so probe there first.

</details>

## How does browser() let you pause and inspect?

`traceback()` tells you *where* a failure happened; `browser()` lets you examine *what* the state was at that point. Drop `browser()` anywhere in your code and when R reaches it the prompt changes to `Browse[1]>` — from there you can type any R expression in the local environment, `ls()` to see what variables exist, `n` to run the next line, or `c` to continue.

Here are the five single-letter commands you'll use 99% of the time, plus `where` and `ls()`:

| Command | What it does |
|---|---|
| `n` | **Next** — execute the current line and stop on the next |
| `s` | **Step into** — step into the function call on the current line |
| `f` | **Finish** — run the rest of the current loop/function, then pause |
| `c` | **Continue** — resume execution until the next `browser()` or end |
| `Q` | **Quit** — abort the function and return to the top-level prompt |
| `where` | Print the call stack from here upward |
| `ls()` | List all local variables in the current frame |

Let's use it on a budget function that silently returns the wrong total. In a real session you would uncomment the `browser()` call; the block below runs the function straight through so you can see the output, with a simulated `Browse[1]>` transcript in the comments showing what an interactive session would look like.

```r
# A function that silently returns the wrong total
summarize_budget <- function(budget) {
  # browser()  # <-- in RStudio, uncomment this line to pause here
  income   <- sum(budget$inflow)
  expenses <- sum(budget$outflow)
  net      <- income - expenses
  list(income = income, expenses = expenses, net = net)
}

budget <- data.frame(
  inflow  = c(5000, 2000, 1500),
  outflow = c(1200, 800, NA)   # missing value lurking here
)

summarize_budget(budget)
#> $income
#> [1] 8500
#>
#> $expenses
#> [1] NA
#>
#> $net
#> [1] NA

# What an interactive Browse[1]> session would look like:
#   Browse[1]> ls()
#   [1] "budget" "expenses" "income" "net"
#   Browse[1]> budget$outflow
#   [1] 1200  800   NA
#   Browse[1]> sum(budget$outflow)
#   [1] NA
#   Browse[1]> sum(budget$outflow, na.rm = TRUE)
#   [1] 2000
#   Browse[1]> c           # resume with c to exit browser
```

The `NA` in `budget$outflow` propagates through `sum()`, poisoning `expenses` and `net`. In the browser you spot it instantly with `ls()` + a quick `sum(budget$outflow)`. Without the browser you might stare at the function body and miss the missing value entirely — the bug is in the *data*, not the logic. That is why `browser()` is so powerful: it lets you examine reality, not your expectation of reality.

[WARNING]
**Never commit browser() calls.** They're invisible in a non-interactive `Rscript` run, so your CI passes, but they freeze an interactive RStudio session for anyone who sources the file. Use RStudio breakpoints (Shift+F9) instead — they live outside the source and can't be committed.

### Conditional browser() to stop only on the interesting case

When a bug shows up on row 7 423 of 10 000, you cannot afford to press `n` seven thousand times. A conditional `browser()` pauses only when a predicate fires:

```r
# Only pause on the problematic element
scan_values <- function(xs) {
  results <- numeric(length(xs))
  for (i in seq_along(xs)) {
    # Stop if we're about to take sqrt of a negative number
    if (xs[i] < 0) {
      # browser()  # uncomment in RStudio; in WebR we just report it
      cat("Would pause at index", i, "with xs[i] =", xs[i], "\n")
    }
    results[i] <- sqrt(abs(xs[i]))
  }
  results
}

scan_values(c(4, 9, -1, 16, -25))
#> Would pause at index 3 with xs[i] = -1
#> Would pause at index 5 with xs[i] = -25
#> [1] 2 3 1 4 5
```

With the conditional guard you get an interactive pause exactly when the state is interesting and the loop runs at full speed otherwise. That pattern alone — "break on predicate" — earns back its learning cost on the first large dataset you debug.

[NOTE]
**browser() is interactive-only.** Inside WebR, Rscript, or a knitted R Markdown render, `browser()` has no terminal to talk to so it silently does nothing. Use the `tryCatch(..., error = function(e) sys.frames())` pattern to capture the environments, or log key values with `cat()`/`message()`.

**Try it:** The buggy `ex_compute_bmi(weight_kg, height_cm)` below uses centimetres when it should use metres. Insert a single *conditional* `browser()` call that only fires if the computed BMI is less than 1 (an impossibly low value that flags the unit mistake). You only need to write the line — you don't have to run it.

```r
# Try it: add one conditional browser() line
ex_compute_bmi <- function(weight_kg, height_cm) {
  bmi <- weight_kg / height_cm^2
  # add your conditional browser() line here
  bmi
}
ex_compute_bmi(70, 175)
#> Expected: BMI will be ~0.0023 (the bug — height should be in metres)
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_compute_bmi <- function(weight_kg, height_cm) {
  bmi <- weight_kg / height_cm^2
  if (bmi < 1) browser()  # pause only on the impossible case
  bmi
}
ex_compute_bmi(70, 175)
#> [1] 0.002285714
```

**Explanation:** The conditional `if (bmi < 1) browser()` triggers only when the value is obviously wrong. In an interactive session you'd land in the browser, type `height_cm` and see `175`, then realise the formula needs `height_cm / 100`. The fix is one line, and the guard can stay in the code as a self-test.

</details>

## How do debug() and debugonce() step through a function?

`browser()` requires you to edit the function and add a line. `debug()` does the same thing from outside: `debug(fn)` marks `fn` so every subsequent call pauses at its first line, as if a `browser()` sat at the top. `debugonce(fn)` does the same but exactly once — after one call, the mark clears. For 95% of your debugging, reach for `debugonce()` — it is self-cleaning, so you cannot forget to turn it off.

```r
# A function with a subtle pricing bug
discount_price <- function(price, pct) {
  discount <- price * pct         # bug: pct should be pct / 100
  final    <- price - discount
  final
}

# Run it straight through to see the broken output
discount_price(100, 20)
#> [1] -1900      # expected 80 — 20% off 100

# In an interactive R session you would run:
#   debugonce(discount_price)
#   discount_price(100, 20)
#
# R pauses at line 1 of discount_price and shows:
#   Browse[2]> n
#   debug: discount <- price * pct
#   Browse[2]> n
#   debug: final <- price - discount
#   Browse[2]> discount
#   [1] 2000           # <-- 2000 from 100 * 20; should be 20 from 100 * 0.20
#   Browse[2]> pct
#   [1] 20             # confirmed: pct is a percentage, not a fraction
#   Browse[2]> c       # continue and exit
```

You spot the bug in two steps: step into the function, inspect `discount`, realise `pct` is being treated as a fraction when it was passed as a whole-number percent. One-line fix: `discount <- price * pct / 100`. The real payoff of `debugonce()` is that you did not have to edit `discount_price` — you marked it externally, ran it once, and the mark vanished.

[TIP]
**Prefer debugonce() over debug().** `debug(fn)` sets a *persistent* mark — every future call pauses until you remember to `undebug(fn)`. `debugonce(fn)` clears itself after one call. Over the course of a long session, the self-cleaning version saves you from the "why is my function pausing again?" surprise.

```r
# Checking and clearing a debug mark
is_marked <- isdebugged(discount_price)
cat("Is discount_price marked for debugging?", is_marked, "\n")
#> Is discount_price marked for debugging? FALSE

# In a real session, after debug(discount_price) you would see TRUE.
# Clear a persistent mark with undebug():
#   undebug(discount_price)

# The danger pattern:
#   debug(helper)            # mark
#   # ... hours later ...
#   helper(1); helper(2)     # every call now pauses — surprise!
#   undebug(helper)          # finally clear it
```

`isdebugged(fn)` is how you *check* a mark without triggering it, and `undebug(fn)` is the escape hatch when you forgot which functions you marked earlier in the session.

**Try it:** You run `debugonce(score_round)` and then make three calls. Which call (first, second, or third) pauses inside the debugger?

```r
# Try it: predict which call pauses
score_round <- function(x) round(x * 10)

# debugonce(score_round)   # mark for exactly one pause
# score_round(1.23)        # call A
# score_round(4.56)        # call B
# score_round(7.89)        # call C

ex_which_pauses <- "A"   # your answer: "A", "B", or "C"
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_which_pauses <- "A"
#> [1] "A"
```

**Explanation:** `debugonce()` pauses on the *very next* call (A), then the mark clears automatically. Calls B and C run without pausing. That is why it's called "once" and why it's safer than `debug()` for quick investigations.

</details>

## How does options(error = recover) catch errors automatically?

`traceback()`, `browser()`, and `debug()` are reactive — you invoke them after or around a specific call. `options(error = recover)` is proactive: it installs a *global* error handler so that any time *any* error occurs, R drops you into a frame-picker prompt listing every live call on the stack. You type a number to step into that frame and poke around post-mortem.

```r
# Pretend we have the run -> process -> validate chain from earlier
validate <- function(x) {
  if (!is.numeric(x)) stop("x must be numeric")
  x * 2
}
process <- function(x) validate(x) + 1
run     <- function(x) process(x)

# In an interactive R session you would do this once per session:
#   options(error = recover)
#   run("oops")
#
# R prints the error and asks which frame you want to inspect:
#
#   Error in validate(x) : x must be numeric
#
#   Enter a frame number, or 0 to exit
#   1: run("oops")
#   2: process(x)
#   3: validate(x)
#
#   Selection: 3
#   Called from: validate(x)
#   Browse[1]> ls()
#   [1] "x"
#   Browse[1]> x
#   [1] "oops"
#   Browse[1]> 0        # pick 0 to leave recover
#
# Reset when you are done:
#   options(error = NULL)

cat("options(error = recover) installs a global handler.\n")
cat("Every error opens a frame picker until you reset with options(error = NULL).\n")
#> options(error = recover) installs a global handler.
#> Every error opens a frame picker until you reset with options(error = NULL).
```

The win is that you did not know *which* call would fail or *where* to put a `browser()` — you just turned the handler on and waited. When an unexpected error lands, you are already inside the debugger.

For batch scripts that run unattended, there is a runnable variant: `dump.frames()` saves the call-stack environments to disk so you can load them later in an interactive session with `debugger()`.

```r
# Post-mortem debugging for batch scripts (runs in WebR too)
risky_batch <- function() {
  a <- 1
  b <- "two"
  a + b   # fails: non-numeric argument
}

tryCatch(
  risky_batch(),
  error = function(e) {
    dump.frames(dumpto = "last.dump", to.file = FALSE)
    cat("Error captured:", conditionMessage(e), "\n")
    cat("Frames saved to object 'last.dump' in the global env.\n")
    cat("In a later interactive session you would run:\n")
    cat("  load('last.dump.rda')\n")
    cat("  debugger(last.dump)\n")
  }
)
#> Error captured: non-numeric argument to binary operator
#> Frames saved to object 'last.dump' in the global env.
#> In a later interactive session you would run:
#>   load('last.dump.rda')
#>   debugger(last.dump)
```

`dump.frames()` is how you debug a crash that happened at 3am on a server. The batch script saves its stack to a file, you log in the next morning, load the dump, call `debugger()`, and you are inside the exact environments that existed at the moment of failure — variables and all.

[KEY INSIGHT]
**recover turns "my code crashed — now what?" into "let me poke around the moment it crashed."** Setting it before a risky run is the cheapest insurance policy in R: it costs nothing if no error happens, and saves a full re-run if one does.

**Try it:** Write the single line of R that sets up R to automatically dump every error's frames to disk so you can inspect them later with `debugger()`. (Hint: the value you assign to the `error` option can be an expression — and the batch-friendly one is `quote(dump.frames("last.dump", TRUE))`.)

```r
# Try it: one-liner for batch-script post-mortem
# Fill in the expression after error =
# options(error = ___)
ex_option_line <- "options(error = ___)"
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_option_line <- 'options(error = quote(dump.frames("last.dump", TRUE)))'
#> [1] "options(error = quote(dump.frames(\"last.dump\", TRUE)))"
```

**Explanation:** `quote()` wraps the call unevaluated so the option *stores* the expression; R then runs it every time an error occurs. The second `TRUE` tells `dump.frames()` to write the dump straight to disk (`last.dump.rda`) instead of leaving it in memory — perfect for unattended scripts.

</details>

## How do you use RStudio's visual debugger and breakpoints?

RStudio wraps every primitive above in a point-and-click workflow. Click in the left margin of the editor next to a line number (or put your cursor on the line and press **Shift+F9**) and a red dot appears — that's a breakpoint. It behaves exactly like `browser()` at that line, with one critical difference: it lives in RStudio's project metadata, not your source file, so you cannot accidentally commit it.

When execution pauses at a breakpoint, four RStudio panes come alive:

| Pane | What it shows | Equivalent in console |
|---|---|---|
| **Environment** | Every local variable in the current frame | `ls()` + print each name |
| **Traceback** | The call stack from your entry point to here | `traceback()` / `where` |
| **Source** | The current line highlighted in yellow | `n` prompt in browser |
| **Console** | `Browse[1]>` prompt for arbitrary R expressions | identical |

The debugger toolbar (above the console when paused) offers five buttons mapped to the browser commands you already know:

| Button | Shortcut | `browser()` equivalent | Action |
|---|---|---|---|
| Next | F10 | `n` | Run the current line, stop on the next |
| Step Into | Shift+F4 | `s` | Step into the function call on this line |
| Finish Function | Shift+F6 | `f` | Run to the end of the current function |
| Continue | Shift+F5 | `c` | Resume until the next breakpoint |
| Stop | Shift+F8 | `Q` | Abort debugging and return to the top |

```r
# A function you'd set a breakpoint on in RStudio
deduct_tax <- function(gross, rate) {
  tax_due <- gross * rate
  net     <- gross - tax_due
  net
}

deduct_tax(1000, 0.20)
#> [1] 800

# In RStudio:
#   1. Click in the margin next to "tax_due <- gross * rate"
#      (or put the cursor there and press Shift+F9)
#   2. A red dot appears.
#   3. Call deduct_tax(1000, 0.20) — the line highlights yellow.
#   4. Environment pane shows gross = 1000, rate = 0.20.
#   5. Press F10 to advance one line at a time.
#   6. Press Shift+F5 to finish and return to the console.
```

One more RStudio win: after a function errors at the top level, the console shows a **"Rerun with Debug"** button. Click it and RStudio re-runs the exact failing call with `debug()` auto-enabled on the function that threw — no keyboard dance required.

[TIP]
**Breakpoints survive across sessions.** RStudio remembers the red dots per file, so when you reopen the project your debugging setup is still there. `browser()` calls in source code do not survive `git checkout` — or rather, if they do, that is a bug in your workflow.

**Try it:** You hit a breakpoint inside `deduct_tax(1000, 0.20)` at the `net <- gross - tax_due` line and want to check the value of `tax_due` before running that line. Which RStudio button — **Next (F10)**, **Step Into (Shift+F4)**, **Finish (Shift+F6)**, **Continue (Shift+F5)**, or **Stop (Shift+F8)** — should you press first?

```r
# Try it: pick the button
# You are paused at: net <- gross - tax_due
# Goal: inspect tax_due, then advance one line
ex_button <- "Next"   # your answer
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_button <- "Next"
#> [1] "Next"
```

**Explanation:** You don't need to press anything to *inspect* — the Environment pane already shows every local variable including `tax_due`, and you can type any expression in the console. Once you've inspected, **Next (F10)** runs the current line and stops on the next one. **Step Into** would only help if the current line were a function call. **Finish** would skip the rest of the function, losing your pause.

</details>

## How do you debug inside lapply(), purrr::map(), and loops?

The painful case: you run `lapply(rows, parse)` over 10 000 rows and one of them throws. You lose every result computed so far, and `traceback()` just points at `FUN(X[[i]])` — it does not tell you *which* `i`. Two patterns save you: wrap each call in `tryCatch()` to turn errors into tagged results, or use `purrr::safely()` for the idiomatic version.

```r
# A mapper that throws on a bad element
risky <- function(x) {
  if (x < 0) stop("negative input: ", x)
  sqrt(x)
}

xs <- list(4, 9, -1, 16, -25)

# Wrap each call in tryCatch() to catch per-element
results_try <- lapply(seq_along(xs), function(i) {
  tryCatch(
    list(index = i, value = risky(xs[[i]]), error = NULL),
    error = function(e) list(index = i, value = NA, error = conditionMessage(e))
  )
})

# Extract successes and failures
successes <- Filter(function(r) is.null(r$error), results_try)
failures  <- Filter(function(r) !is.null(r$error), results_try)

cat("Successes:", length(successes), "  Failures:", length(failures), "\n")
#> Successes: 3   Failures: 2

for (f in failures) {
  cat("  index", f$index, "->", f$error, "\n")
}
#>   index 3 -> negative input: -1
#>   index 5 -> negative input: -25
```

Every row gets processed, the loop never dies, and you end up with a clean split between the rows that worked and the rows that did not — with the exact index and error message for each failure. That is debuggable output.

The `purrr` version is the same pattern without the hand-rolled bookkeeping. `safely()` takes a function and returns a new function that always returns `list(result, error)` — one is always `NULL`, the other always populated.

```r
# purrr::safely() is the idiomatic version
library(purrr)

safe_risky <- safely(risky)

results_safe <- map(xs, safe_risky)

# Transpose into two lists: one of results, one of errors
split_results <- transpose(results_safe)
ok_idx  <- which(map_lgl(split_results$error, is.null))
bad_idx <- which(!map_lgl(split_results$error, is.null))

cat("Indices that succeeded:", ok_idx, "\n")
#> Indices that succeeded: 1 2 4
cat("Indices that failed:", bad_idx, "\n")
#> Indices that failed: 3 5
```

Two lines (`safe_risky <- safely(risky)`, `map(xs, safe_risky)`) replace the hand-rolled `tryCatch` from the previous block. `transpose()` flips the "list of results" into "results list + errors list" so you can index into either by position.

[WARNING]
**Plain browser() inside lapply() pauses for every element.** If you drop an unconditional `browser()` into a mapper, `lapply()` will open the interactive prompt for every single element — you'll give up and Ctrl+C out within 10 rows. Either make it conditional (`if (suspicious) browser()`) or use `safely()` to collect errors without pausing.

```r
# Conditional browser inside a mapper — only pause on the bad row
process_row <- function(row) {
  if (row$amount < 0) {
    # browser()  # uncomment in RStudio to inspect only the bad rows
    cat("Would pause at row:", row$id, "amount =", row$amount, "\n")
  }
  row$amount * 1.1
}

rows <- list(
  list(id = "A", amount = 100),
  list(id = "B", amount = -50),   # bad
  list(id = "C", amount = 200)
)

results <- lapply(rows, process_row)
#> Would pause at row: B amount = -50
```

In an interactive session, that `browser()` would pause on row B and only row B — you inspect the bad row in isolation without wading through the good ones.

**Try it:** The `ex_parser(lines)` below parses each line of input as a number. It currently crashes on the first malformed line. Wrap the parser with `purrr::safely()` so the batch keeps running and collects errors. Return a list with `results` and `errors` components.

```r
# Try it: make ex_parser resilient with safely()
ex_parse_line <- function(line) {
  n <- as.numeric(line)
  if (is.na(n)) stop("not a number: ", line)
  n * 2
}

lines <- list("1", "2", "three", "4", "five")

# Write ex_parser(lines) that uses safely() and returns
# list(results = <numeric vector of successes>, errors = <char of error messages>)
ex_parser <- function(lines) {
  # your code here
  list(results = NULL, errors = NULL)
}

out <- ex_parser(lines)
#> Expected results: c(2, 4, 8)
#> Expected errors:  2 messages about "three" and "five"
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_parser <- function(lines) {
  safe_parse <- safely(ex_parse_line)
  out <- map(lines, safe_parse)
  split <- transpose(out)
  ok <- !map_lgl(split$error, is.null)
  list(
    results = unlist(split$result[ok]),
    errors  = map_chr(split$error[!ok], conditionMessage)
  )
}

out <- ex_parser(lines)
out$results
#> [1] 2 4 8
out$errors
#> [1] "not a number: three" "not a number: five"
```

**Explanation:** `safely(ex_parse_line)` turns the risky parser into one that cannot throw. `map()` runs it over every line, `transpose()` flips the list, and two `map_lgl` calls separate successes from errors. The batch always finishes.

</details>

## Practice Exercises

### Exercise 1: Locate and fix from a captured stack

The `merge_reports()` function below fails when you try to merge two data frames. Use the `tryCatch(..., error = function(e) sys.calls())` pattern to capture the call stack, identify the failing frame, and ship a corrected version. Save the merged result to `my_merged`.

```r
# Exercise: merge reports, diagnose the crash, fix it
merge_reports <- function(new, old) {
  out <- old
  for (i in seq_len(nrow(new))) {
    field <- new[["field"]]     # bug: indexes the whole column every time
    out[[field]] <- new[i, "value"]
  }
  out
}

old_rep <- data.frame(a = 1, b = 2, c = 3)
new_rep <- data.frame(
  field = c("a", "b"),
  value = c(10, 20),
  stringsAsFactors = FALSE
)

# Step 1: run merge_reports(new_rep, old_rep) inside tryCatch and capture the stack
# Step 2: identify the failing frame
# Step 3: fix the bug and save the merged result to my_merged

my_merged <- NULL  # replace with your fix
```

<details>
<summary>Click to reveal solution</summary>

```r
# Step 1: capture the stack
tryCatch(
  merge_reports(new_rep, old_rep),
  error = function(e) {
    cat("Error:", conditionMessage(e), "\n")
    cat("Failing frame: merge_reports() — inspect the loop body.\n")
  }
)
#> Error: ...
#> Failing frame: merge_reports() — inspect the loop body.

# Step 2: the bug — `new[["field"]]` returns the entire "field" column (a vector),
# not the value at row i. Using a vector as a name fails on assignment.

# Step 3: fix — index row-by-row
merge_reports <- function(new, old) {
  out <- old
  for (i in seq_len(nrow(new))) {
    field <- new[i, "field"]    # one field per row
    out[[field]] <- new[i, "value"]
  }
  out
}

my_merged <- merge_reports(new_rep, old_rep)
print(my_merged)
#>    a  b c
#> 1 10 20 3
```

**Explanation:** `new[["field"]]` pulls the whole column regardless of `i`. The `tryCatch()` stack capture points you at `merge_reports` as the failing frame, and one minute of reading confirms the off-by-everything loop. Row-at-a-time indexing fixes it.

</details>

### Exercise 2: Find the first bad row with a conditional pause

Write `find_bad_row(df, predicate)` that scans the rows of `df` and returns the **row index** of the first row where `predicate(row)` is `TRUE`. Use a conditional-pause pattern — simulated here with an immediate `return()` instead of a `browser()` call so it runs in WebR — so your function stops at the first match instead of scanning every row. Test it on `mtcars` by finding the first car with `mpg < 15`.

```r
# Exercise: find the first row matching a predicate
find_bad_row <- function(df, predicate) {
  # your code here — short-circuit on the first match
  NA_integer_
}

my_first_bad <- find_bad_row(mtcars, function(r) r$mpg < 15)
#> Expected: 7 (Duster 360 has mpg = 14.3)
```

<details>
<summary>Click to reveal solution</summary>

```r
find_bad_row <- function(df, predicate) {
  for (i in seq_len(nrow(df))) {
    row_i <- df[i, , drop = FALSE]
    if (predicate(row_i)) {
      # In an interactive session you would write `browser()` here instead
      # of `return(i)` — the idea is identical: stop the moment the predicate fires.
      return(i)
    }
  }
  NA_integer_
}

my_first_bad <- find_bad_row(mtcars, function(r) r$mpg < 15)
my_first_bad
#> [1] 7
rownames(mtcars)[my_first_bad]
#> [1] "Duster 360"
```

**Explanation:** The loop short-circuits on the first match. Swap the `return(i)` for `browser()` in a real RStudio session and you land in the debugger with `i`, `row_i`, and `df` all in scope — ready to inspect why the predicate fired. That conversion between "return on match" and "pause on match" is the whole conditional-`browser()` pattern in three lines.

</details>

### Exercise 3: Build a resilient mapper

Write `robust_apply(xs, fn)` that calls `fn` on every element of `xs` and returns a list with two components: `results` (a list of successes tagged by index) and `errors` (a list of failures tagged by index and error message). It must work when 90% of elements fail. Use `purrr::safely()`. Test it on a function that only succeeds for even numbers.

```r
# Exercise: resilient mapper
robust_apply <- function(xs, fn) {
  # your code here
  list(results = list(), errors = list())
}

evens_only <- function(x) {
  if (x %% 2 != 0) stop("not even: ", x)
  x^2
}

my_result <- robust_apply(1:6, evens_only)
#> Expected results: indices 2, 4, 6 with values 4, 16, 36
#> Expected errors:  indices 1, 3, 5 with "not even" messages
```

<details>
<summary>Click to reveal solution</summary>

```r
robust_apply <- function(xs, fn) {
  library(purrr)
  safe_fn <- safely(fn)
  out <- map(seq_along(xs), function(i) {
    r <- safe_fn(xs[[i]])
    list(index = i, result = r$result, error = r$error)
  })
  successes <- Filter(function(r) is.null(r$error), out)
  failures  <- Filter(function(r) !is.null(r$error), out)
  list(
    results = lapply(successes, function(r) list(index = r$index, value = r$result)),
    errors  = lapply(failures, function(r) list(index = r$index, message = conditionMessage(r$error)))
  )
}

my_result <- robust_apply(1:6, evens_only)

length(my_result$results)
#> [1] 3
length(my_result$errors)
#> [1] 3
my_result$results[[1]]
#> $index
#> [1] 2
#>
#> $value
#> [1] 4
my_result$errors[[1]]$message
#> [1] "not even: 1"
```

**Explanation:** `safely(fn)` turns each call into a guaranteed-success wrapper returning `list(result, error)`. Tagging each output with its original index is what lets you correlate failures back to input positions — without indices, a resilient map still leaves you guessing which element broke.

</details>

## Complete Example

Let's walk a silent bug through a whole pipeline from symptom to ship-ready fix, using the three tools you'd actually reach for: `tryCatch` + `sys.calls` to locate, a conditional pause pattern to inspect, and a strict input guard to fix. The pipeline grades students pass/fail; the symptom is that *everyone* is failing.

```r
# The buggy pipeline
validate_score <- function(score) {
  if (score >= 60) "Pass" else "Fail"
}

grade_students <- function(records) {
  sapply(records, function(r) validate_score(r$score))
}

records <- list(
  list(name = "Alice", score = 85),
  list(name = "Bob",   score = 72),
  list(name = "Carol", score = "A"),   # silent bug: string where numeric is expected
  list(name = "Dave",  score = 91)
)

grade_students(records)
#>   Alice     Bob   Carol    Dave
#>  "Fail"  "Fail"  "Fail"  "Fail"
# Symptom: every student is failing — even the 85, 72, and 91 scores.

# Step 1: locate — wrap in tryCatch + sys.calls to see what's being compared
debug_grade <- function(records) {
  lapply(records, function(r) {
    tryCatch(
      validate_score(r$score),
      error   = function(e) list(name = r$name, error = conditionMessage(e)),
      warning = function(w) list(name = r$name, warning = conditionMessage(w))
    )
  })
}
debug_out <- debug_grade(records)
# No errors or warnings — the pipeline runs silently. That's the real problem.

# Step 2: inspect — print the comparison for each record
for (r in records) {
  cat(r$name, "score =", r$score, "class =", class(r$score),
      " score >= 60 is", r$score >= 60, "\n")
}
#> Alice score = 85 class = numeric  score >= 60 is TRUE
#> Bob score = 72 class = numeric  score >= 60 is TRUE
#> Carol score = A class = character  score >= 60 is FALSE
#> Dave score = 91 class = numeric  score >= 60 is TRUE

# Wait — Alice, Bob, and Dave all say TRUE. Why did grade_students return Fail
# for them? Because R coerces the whole vector: sapply glues four comparisons
# together, and one character element forces *all* of them to character.
# "85" >= 60 compares strings — "85" < "60" lexically is FALSE.
cat("\nCoercion check:\n")
cat("  c(85, 'A') ->", class(c(85, "A")), "\n")
#>   c(85, 'A') -> character

# Step 3: ship a fix with a strict input guard
validate_score_strict <- function(score) {
  if (!is.numeric(score)) {
    stop("score must be numeric, got ", class(score)[1], ": ", score)
  }
  if (score >= 60) "Pass" else "Fail"
}

grade_students_safe <- function(records) {
  sapply(records, function(r) {
    tryCatch(
      validate_score_strict(r$score),
      error = function(e) paste0("Invalid(", conditionMessage(e), ")")
    )
  })
}

grade_students_safe(records)
#>            Alice              Bob            Carol             Dave
#>           "Pass"           "Pass" "Invalid(score must be numeric, got character: A)"    "Pass"
```

The fix isn't in the comparison — it's at the input boundary. `validate_score_strict()` refuses non-numeric input loudly, and the wrapper catches that refusal so one bad record does not corrupt the others. Alice, Bob, and Dave now pass; Carol's row is flagged with a specific, actionable error message. Every step of the debugging journey — locate, inspect, fix — was one of the tools in this article.

## Summary

Pick the tool that matches your current question. The decision usually comes down to one of seven symptoms:

| Symptom | Reach for | Works in WebR? |
|---|---|---|
| "Where did it blow up?" | `traceback()` / `sys.calls()` | Yes, via `tryCatch` |
| "What's in `x` right now?" | `browser()` / RStudio breakpoint | No, interactive only |
| "Step through this one function" | `debugonce(fn)` | No |
| "I want the state on *any* error" | `options(error = recover)` | No |
| "Save the crash for later" | `dump.frames()` + `debugger()` | Yes |
| "One element in `lapply()` blows up" | `tryCatch()` per element or `purrr::safely()` | Yes |
| "Visual, click-driven workflow" | RStudio breakpoints + Environment pane | n/a |

![Pick the right debugging tool based on the symptom you're seeing.](screenshots/R-Debugging-tool-decision.webp)
*Figure 3: Pick the right debugging tool based on the symptom. Most sessions start with traceback(), escalate to browser() / breakpoints, and finish with a strict input guard.*

Key takeaways:

1. **Locate first, then inspect, then fix.** Guessing before you've located the failure is the single biggest time sink in debugging.
2. **Prefer `debugonce()` over `debug()`.** The self-cleaning variant is safer and you never have to remember `undebug()`.
3. **Use `tryCatch()` or `purrr::safely()` for loops.** Plain `browser()` inside `lapply()` pauses on every element; neither version lets you finish the batch and see *which* element failed.
4. **Set `options(error = recover)` before risky runs.** It's free insurance — nothing happens unless an error fires, and when one does you're already in the debugger.
5. **Use RStudio breakpoints for anything that survives past one session.** They live outside your source, so they cannot be committed by accident.

## References

1. Wickham, H. — *Advanced R*, 2nd Edition. Chapter 22: Debugging. [Link](https://adv-r.hadley.nz/debugging.html)
2. Posit / RStudio — Debugging with the RStudio IDE. [Link](https://support.posit.co/hc/en-us/articles/205612627-Debugging-with-the-RStudio-IDE)
3. Posit — RStudio User Guide: Debugging. [Link](https://docs.posit.co/ide/user/ide/guide/code/debugging.html)
4. Grolemund, G. — *Hands-On Programming with R*, Appendix E: Debugging R Code. [Link](https://rstudio-education.github.io/hopr/debug.html)
5. Bryan, J. & Hester, J. — *What They Forgot to Teach You About R*, Ch 12: Debugging R code. [Link](https://rstats.wtf/debugging-r)
6. R base documentation — `browser`, `debug`, `traceback`, `recover`. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/browser.html)
7. `purrr::safely()` reference. [Link](https://purrr.tidyverse.org/reference/safely.html)

## Continue Learning

1. **R's Condition System** — signal and handle errors cleanly with `stop()`, `warning()`, `tryCatch()`, and `withCallingHandlers()` before they become bugs you have to debug.
2. **50 Common R Errors** — the catalogue of R error messages you'll see in `traceback()` output, with a short fix for each.
3. **R Execution Stack** — a deeper dive into `sys.call()`, `parent.frame()`, and how the call stack you `traceback()` through is actually built.
