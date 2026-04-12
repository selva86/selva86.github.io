---
title: "R's Condition System: Handle Errors, Warnings & Messages Like a Pro"
slug: R-Conditions-System
description: "Master R's condition system: signal with stop(), warning(), message(); handle via tryCatch() and withCallingHandlers(); design custom condition classes."
keywords: "R condition system, tryCatch in R, withCallingHandlers, R error handling, R custom conditions, stop() R, warning() R, message() R"
auto_link_terms: "R condition system|tryCatch()|withCallingHandlers()|custom conditions|R error handling|errorCondition()|invokeRestart()"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: 2026-04-13
curriculum_id: "4.1.7"
post_type: C
sidebar_section: "Learn R"
sidebar_title: "R's Condition System"
sidebar_order: 33
---

# R's Condition System: Handle Errors, Warnings & Messages Like a Pro

<p class="lead">R's condition system is the mechanism R uses to signal and handle errors, warnings, and messages while code is running. Unlike a simple <code>try/catch</code> in other languages, it lets you decide — per signal, per line — whether a problem should stop you, warn you, or just be noted.</p>

## Why do you need R's condition system at all?

Imagine a loop that processes a thousand rows and hits a bad one at row 43. Without a handler, the whole loop crashes and you lose the other 957 results. With one, you keep going and record the bad row. R's condition system is how you make that choice. Let's see it on a tiny example: a function that divides two numbers and a loop that should survive bad inputs.

```r
# A "strict" divider that refuses zero denominators
safe_divide <- function(x, y) {
  if (y == 0) stop("denominator is zero")
  x / y
}

divisors <- c(2, 4, 0, 5, 0, 8)
results <- numeric(length(divisors))

for (i in seq_along(divisors)) {
  results[i] <- tryCatch(
    safe_divide(100, divisors[i]),
    error = function(e) NA_real_
  )
}

results
#> [1] 50.0 25.0   NA 20.0   NA 12.5
```

The loop completes. Row 3 and row 5 would have crashed a naive version, but `tryCatch()` intercepted each `stop()`, returned `NA`, and let the loop move on. The *signaler* (`safe_divide`) doesn't know or care what the caller wants to do — it just raises the flag. The *handler* makes the policy decision.

[KEY INSIGHT]
**Conditions decouple signaling from policy.** The function that detects a problem doesn't need to know whether the caller wants to crash, log, retry, or substitute a default. That decision lives with the caller, exactly where it belongs.

**Try it:** Write `ex_safe_log(x)` that returns `log(x)` when `x` is positive, and use `tryCatch()` so a non-positive input produces `NA_real_` instead of a crash.

```r
ex_safe_log <- function(x) {
  if (x <= 0) stop("x must be positive")
  log(x)
}

# Use tryCatch below so each call returns NA_real_ instead of crashing:
ex_safe_call <- function(v) {
  # your code here
}

sapply(c(10, -1, 0, 2.5), ex_safe_call)
#> Expected: 2.302585 NA NA 0.916291
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_safe_call <- function(v) {
  tryCatch(ex_safe_log(v), error = function(e) NA_real_)
}
sapply(c(10, -1, 0, 2.5), ex_safe_call)
#> [1] 2.3025851        NA        NA 0.9162907
```

**Explanation:** `ex_safe_log()` signals an error for non-positive inputs. The wrapping `tryCatch()` catches those errors and substitutes `NA_real_` so the whole vector still gets processed.

</details>

## How do message(), warning(), and stop() differ?

R gives you three built-in ways to signal something unusual. They sit on a ladder of severity: `message()` is a gentle note, `warning()` flags a real problem that didn't stop progress, and `stop()` hard-aborts. Picking the right one is a communication decision — are you informing, cautioning, or refusing?

![Severity ladder from message to stop](screenshots/R-Conditions-System-signal-severity.webp)
*Figure 1: message(), warning(), and stop() form a ladder of increasing severity. All three can be handled.*

Start with `message()`, the softest signal. It prints to the message stream (not `stdout`) and the function keeps running:

```r
greet <- function(name) {
  message("greeting ", name)
  paste0("Hello, ", name, "!")
}

greet("Selva")
#> greeting Selva
#> [1] "Hello, Selva!"
```

The message appears, then the returned string appears — execution never paused. Messages are the right tool for progress updates, "I'm using the default" notices, or debug tracing.

Next, `warning()`. A warning says "I did the thing you asked, but you should probably know about this":

```r
coerce_numeric <- function(x) {
  out <- as.numeric(x)
  if (any(is.na(out) & !is.na(x))) warning("some values could not be converted")
  out
}

coerce_numeric(c("1", "2", "oops", "4"))
#> Warning message:
#> In coerce_numeric(c("1", "2", "oops", "4")) :
#>   some values could not be converted
#> [1]  1  2 NA  4
```

The function still returns a vector. The caller gets the result *and* a heads-up that something was imperfect. That's the difference between a warning and an error.

Finally, `stop()` refuses to proceed:

```r
require_positive <- function(x) {
  if (x < 0) stop("x must be non-negative, got ", x)
  sqrt(x)
}

require_positive(16)
#> [1] 4
# require_positive(-4) would abort with:
#> Error in require_positive(-4): x must be non-negative, got -4
```

`stop()` unwinds the call stack until something handles it. If nothing does, the whole top-level expression fails — that's what you see at the console when your script crashes.

[NOTE]
**message() writes to stderr, not stdout.** If you try to capture the greeting with `capture.output()`, you get the return value but not the message text. Use `capture.output(..., type = "message")` to capture the message stream instead.

**Try it:** Write `ex_check_age(age)` that sends a `message()` if `age < 18`, a `warning()` if `age > 120`, and `stop()` if `age < 0`. Otherwise return the age unchanged.

```r
ex_check_age <- function(age) {
  # your code here
}

ex_check_age(10)   # expect a message and return 10
ex_check_age(130)  # expect a warning and return 130
ex_check_age(30)   # expect no signal, return 30
#> Expected: message for 10, warning for 130, 30 silent
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_check_age <- function(age) {
  if (age < 0) stop("age cannot be negative")
  if (age < 18) message("minor: ", age)
  if (age > 120) warning("suspiciously high age: ", age)
  age
}

ex_check_age(10)
#> minor: 10
#> [1] 10
ex_check_age(130)
#> Warning message:
#> In ex_check_age(130) : suspiciously high age: 130
#> [1] 130
ex_check_age(30)
#> [1] 30
```

**Explanation:** Severity is chosen to match intent. A minor is information, not a problem. A suspiciously high age is real but not a deal-breaker. A negative age is nonsense, so the function refuses.

</details>

## How does tryCatch() catch errors and warnings?

`tryCatch()` is the workhorse handler. You wrap an expression in it and pass named arguments — `error`, `warning`, `message`, `finally` — that say what to do when each kind of condition fires. The handler is a function that takes the condition object and returns a value that *replaces* the original expression's value.

Let's start with the error branch. A common pattern is "try to parse this, and give me a default if it fails":

```r
parse_positive <- function(txt) {
  n <- as.numeric(txt)
  if (is.na(n) || n <= 0) stop("not a positive number: ", txt)
  n
}

tryCatch(parse_positive("42"),   error = function(e) -1)
#> [1] 42
tryCatch(parse_positive("oops"), error = function(e) -1)
#> [1] -1
```

The first call succeeds, so `tryCatch()` returns the parsed number. The second call triggers `stop()`; the `error` handler runs, returns `-1`, and that value replaces the whole expression. The condition object `e` (of class `simpleError`) carries a `message` field if you want to log the details.

You can catch warnings the same way. The handler replaces the result, which is useful when you want to treat "warn" as "fail":

```r
strict_parse <- function(txt) {
  tryCatch(
    coerce_numeric(txt),
    warning = function(w) {
      message("treating warning as failure: ", conditionMessage(w))
      NA_real_
    }
  )
}

strict_parse(c("1", "2", "oops"))
#> treating warning as failure: some values could not be converted
#> [1] NA
```

The function `coerce_numeric()` (from earlier) raises a warning; `strict_parse()` catches it, logs the reason, and returns `NA_real_`. Notice we're using the condition's own message via `conditionMessage()` — the standard way to read what a signaler said.

[TIP]
**List handlers from specific to general.** `tryCatch()` dispatches on the first matching handler. Put narrow classes (like a custom `validation_error`) *before* the generic `error` handler, or your custom class will never be seen — the generic one will swallow it first.

The `finally` argument runs no matter what — success, error, or warning. That makes it the right place for cleanup code:

```r
with_temp_file <- function() {
  path <- tempfile()
  writeLines("some data", path)
  tryCatch(
    {
      # pretend the work fails
      stop("something went wrong")
    },
    error = function(e) {
      message("handled: ", conditionMessage(e))
      NULL
    },
    finally = {
      if (file.exists(path)) file.remove(path)
      message("cleaned up temp file")
    }
  )
}

with_temp_file()
#> handled: something went wrong
#> cleaned up temp file
#> NULL
```

The temp file gets deleted whether the body succeeds or fails. `finally` is how you guarantee resource cleanup in R.

**Try it:** Wrap `parse_positive("bad")` in a `tryCatch()` that returns `0` on error. The handler should also log a short note via `message()` so you can see it fired.

```r
# Reuse parse_positive from earlier
ex_result <- tryCatch(
  parse_positive("bad"),
  # your code here
)
ex_result
#> Expected: 0
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_result <- tryCatch(
  parse_positive("bad"),
  error = function(e) { message("handled: ", conditionMessage(e)); 0 }
)
ex_result
#> handled: not a positive number: bad
#> [1] 0
```

**Explanation:** `parse_positive("bad")` raises an error. The `error` handler logs the reason via `message()` and returns `0`, which becomes the value of the whole expression.

</details>

## When should you use withCallingHandlers() instead?

`tryCatch()` and `withCallingHandlers()` look similar but behave very differently. A `tryCatch()` handler is an *exiting* handler: when it runs, the protected expression is abandoned and the handler's return value replaces it. A `withCallingHandlers()` handler is a *calling* handler: it runs, the handler returns, and the original expression keeps running from where it left off.

![tryCatch unwinds; withCallingHandlers resumes](screenshots/R-Conditions-System-handler-flow.webp)
*Figure 2: tryCatch() unwinds the stack and returns the handler's value. withCallingHandlers() runs the handler and resumes the original code.*

Think of a car alarm. `tryCatch()` is the kind that kills the ignition when something's wrong — the car stops moving. `withCallingHandlers()` is the kind that beeps: you hear the warning, but the car keeps driving. For *logging*, auditing, or counting, you almost always want the beeping version.

```r
noisy_sum <- function(x) {
  if (any(is.na(x))) warning("NAs present, they will be dropped")
  sum(x, na.rm = TRUE)
}

warn_log <- character()
total <- withCallingHandlers(
  noisy_sum(c(1, NA, 3, NA, 5)),
  warning = function(w) {
    warn_log <<- c(warn_log, conditionMessage(w))
  }
)

total
#> [1] 9
warn_log
#> [1] "NAs present, they will be dropped"
```

`noisy_sum()` raises a warning. The calling handler appends the message to `warn_log`, returns, and then the original `sum()` expression resumes and produces `9`. Both things happen: the log has the warning *and* the computation finishes.

There's a subtle catch, though. By default, a warning signaled via `withCallingHandlers()` still prints to the console after the handler runs — R considers the handler and the default print as independent steps. To silence the original warning after handling it, use `invokeRestart("muffleWarning")`:

```r
warn_log <- character()
total <- withCallingHandlers(
  noisy_sum(c(1, NA, 3, NA, 5)),
  warning = function(w) {
    warn_log <<- c(warn_log, conditionMessage(w))
    invokeRestart("muffleWarning")  # silence the default print
  }
)

total
#> [1] 9
warn_log
#> [1] "NAs present, they will be dropped"
```

Same result, but the warning is now captured in `warn_log` only — nothing extra prints. For messages, use `invokeRestart("muffleMessage")`. These "muffle" restarts are built into R's warning and message signaling; custom conditions won't have them unless you wire them up yourself.

[WARNING]
**Calling handlers cannot fix an error.** If the signal is an error, the stack has to unwind somewhere — the only question is where. `withCallingHandlers()` on an `error` will run your handler, then R still unwinds to the nearest `tryCatch()` (or the top level). Pair the two when you need "log *and* recover": outer `tryCatch()` for the recovery, inner `withCallingHandlers()` for the logging.

**Try it:** Use `withCallingHandlers()` to count how many warnings `noisy_sum()` raises while still getting the sum.

```r
ex_warn_count <- 0
ex_total <- withCallingHandlers(
  noisy_sum(c(NA, NA, 1)),
  # your code here
)
list(total = ex_total, count = ex_warn_count)
#> Expected: total=1, count=1
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_warn_count <- 0
ex_total <- withCallingHandlers(
  noisy_sum(c(NA, NA, 1)),
  warning = function(w) {
    ex_warn_count <<- ex_warn_count + 1
    invokeRestart("muffleWarning")
  }
)
list(total = ex_total, count = ex_warn_count)
#> $total
#> [1] 1
#>
#> $count
#> [1] 1
```

**Explanation:** The handler increments the counter on every warning and muffles the default print. `noisy_sum()` still runs to completion and returns `1`, the sum after dropping the NAs.

</details>

## How do you build custom condition classes?

So far every condition has been a generic `simpleError`, `simpleWarning`, or `simpleMessage`. That works, but it forces handlers to match on the error *message string* — which is brittle, locale-dependent, and breaks the moment you reword a sentence. The cleaner approach is to give each kind of condition its own class and match on the class.

R's conditions are just lists with a `class` attribute. The helpers `errorCondition()` and `warningCondition()` let you attach both a human message and structured fields that handlers can read programmatically.

```r
bad_input_error <- function(field, value) {
  errorCondition(
    message = paste0("invalid value for ", field, ": ", value),
    class   = "bad_input_error",
    field   = field,
    value   = value
  )
}

validate <- function(age) {
  if (!is.numeric(age) || age < 0) {
    stop(bad_input_error("age", age))
  }
  age
}

tryCatch(
  validate("forty"),
  error = function(e) paste("caught:", conditionMessage(e))
)
#> [1] "caught: invalid value for age: forty"
```

`bad_input_error()` builds an error object with class `bad_input_error` (chained with `error` and `condition` by `errorCondition()`). `validate()` signals it via `stop()`. The handler sees an `error` and catches it like any other — but now the condition object carries `field` and `value` attributes the handler can inspect without parsing text.

The real win comes when you dispatch on the class. `tryCatch()` walks its named handlers and matches *by S3 class*, so you can handle `bad_input_error` differently from a plain `error`:

```r
handle_one <- function(expr) {
  tryCatch(
    expr,
    bad_input_error = function(e) {
      cat("bad input in field '", e$field, "' (got: ", format(e$value), ")\n", sep = "")
      NA_real_
    },
    error = function(e) {
      cat("unexpected error: ", conditionMessage(e), "\n", sep = "")
      NA_real_
    }
  )
}

handle_one(validate("forty"))
#> bad input in field 'age' (got: forty)
#> [1] NA
handle_one(stop("something else broke"))
#> unexpected error: something else broke
#> [1] NA
```

Both errors end up at `NA_real_`, but the *handling* is different. The custom class lets you pretty-print, log structured fields, or retry selectively — all without ever reading the message text.

[KEY INSIGHT]
**Classing conditions turns error handling from string-matching into type-matching.** You stop asking "what does the message say?" and start asking "what kind of problem is this?" That's the exact same shift that exception types give you in Java or Python, available in base R without any extra package.

**Try it:** Build a `ex_timeout_error(elapsed)` constructor that creates a condition of class `timeout_error` carrying an `elapsed` field. Signal it and catch it by class.

```r
ex_timeout_error <- function(elapsed) {
  # your code here — return an errorCondition with class "timeout_error"
}

ex_result <- tryCatch(
  stop(ex_timeout_error(12.3)),
  timeout_error = function(e) paste("timed out after", e$elapsed, "seconds")
)
ex_result
#> Expected: "timed out after 12.3 seconds"
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_timeout_error <- function(elapsed) {
  errorCondition(
    message = paste0("operation timed out after ", elapsed, " seconds"),
    class   = "timeout_error",
    elapsed = elapsed
  )
}
ex_result <- tryCatch(
  stop(ex_timeout_error(12.3)),
  timeout_error = function(e) paste("timed out after", e$elapsed, "seconds")
)
ex_result
#> [1] "timed out after 12.3 seconds"
```

**Explanation:** `errorCondition()` builds the classed condition in one line. The handler dispatches on the `timeout_error` class and reads the `elapsed` field directly from the condition object.

</details>

## Practice Exercises

These combine ideas from earlier sections. Try them before looking at the solutions.

### Exercise 1: robust_mean with logging

Write `robust_mean(x)` that returns the mean of a numeric vector. It must:

- return `NA_real_` if `x` is empty, non-numeric, or if the body itself fails (use `tryCatch()`)
- log any warning it encounters into a caller-provided `my_warn_log` vector (use `withCallingHandlers()` *inside* the `tryCatch()`)
- still return the computed mean when the input is valid

```r
# Exercise: combine tryCatch + withCallingHandlers
# Hint: the outer layer is tryCatch (for recovery),
# the inner layer is withCallingHandlers (for logging).

my_warn_log <- character()

robust_mean <- function(x) {
  # your code here
}

robust_mean(c(1, 2, NA, 4))
my_warn_log
#> Expected: 2.333333 and one logged warning
```

<details>
<summary>Click to reveal solution</summary>

```r
my_warn_log <- character()

robust_mean <- function(x) {
  tryCatch(
    withCallingHandlers(
      {
        if (!is.numeric(x) || length(x) == 0) stop("x must be a non-empty numeric vector")
        if (any(is.na(x))) warning("NAs present, dropping them")
        mean(x, na.rm = TRUE)
      },
      warning = function(w) {
        my_warn_log <<- c(my_warn_log, conditionMessage(w))
        invokeRestart("muffleWarning")
      }
    ),
    error = function(e) NA_real_
  )
}

robust_mean(c(1, 2, NA, 4))
#> [1] 2.333333
my_warn_log
#> [1] "NAs present, dropping them"

robust_mean("not numeric")
#> [1] NA
```

**Explanation:** The outer `tryCatch()` converts any unrecoverable error into `NA_real_`. The inner `withCallingHandlers()` captures warnings into the log and lets the body resume so the mean still gets computed. `invokeRestart("muffleWarning")` keeps the console clean.

</details>

### Exercise 2: validate_user with custom classes

Write `validate_user(name, age)` that signals a custom `validation_error` (classed) when an input is invalid. The condition must carry `field` (which input was bad) and `reason` (why). Write a caller that uses `tryCatch()` with class-based dispatch to pretty-print the error as `"invalid <field>: <reason>"`.

```r
# Exercise: custom condition class + class dispatch

validation_error <- function(field, reason) {
  # your code here — return an errorCondition with class "validation_error"
}

validate_user <- function(name, age) {
  # your code here — signal validation_error for bad inputs
}

pretty_validate <- function(name, age) {
  tryCatch(
    validate_user(name, age),
    validation_error = function(e) paste0("invalid ", e$field, ": ", e$reason)
  )
}

pretty_validate("", 30)
pretty_validate("Selva", -5)
#> Expected: "invalid name: empty" and "invalid age: negative"
```

<details>
<summary>Click to reveal solution</summary>

```r
validation_error <- function(field, reason) {
  errorCondition(
    message = paste0("invalid ", field, ": ", reason),
    class   = "validation_error",
    field   = field,
    reason  = reason
  )
}

validate_user <- function(name, age) {
  if (!nzchar(name))    stop(validation_error("name", "empty"))
  if (!is.numeric(age)) stop(validation_error("age",  "not numeric"))
  if (age < 0)          stop(validation_error("age",  "negative"))
  list(name = name, age = age)
}

pretty_validate <- function(name, age) {
  tryCatch(
    validate_user(name, age),
    validation_error = function(e) paste0("invalid ", e$field, ": ", e$reason)
  )
}

pretty_validate("", 30)
#> [1] "invalid name: empty"
pretty_validate("Selva", -5)
#> [1] "invalid age: negative"
pretty_validate("Selva", 30)
#> $name
#> [1] "Selva"
#>
#> $age
#> [1] 30
```

**Explanation:** Each failure mode raises the same class but carries different `field`/`reason` fields. The caller dispatches once on `validation_error` and reads the structured fields — no string parsing, no fragility if the message text changes.

</details>

## Complete Example: a robust record loader

Let's put it all together. We'll build `safe_loader(records)` that walks a list of hand-built records (simulating parsed CSV rows), skips the bad ones, logs every warning, and returns both the good data and a list of per-row errors — the kind of function you'd actually ship in a data pipeline.

```r
# A custom class so we can tell parse errors apart from programmer bugs
row_parse_error <- function(row, reason) {
  errorCondition(
    message = paste0("row ", row, ": ", reason),
    class   = "row_parse_error",
    row     = row,
    reason  = reason
  )
}

# Per-row parser. Signals warnings for minor issues, errors for fatal ones.
parse_record <- function(row, rec) {
  if (is.null(rec$name) || !nzchar(rec$name))
    stop(row_parse_error(row, "missing name"))
  if (is.null(rec$age) || !is.numeric(rec$age))
    stop(row_parse_error(row, "age not numeric"))
  if (rec$age < 0)
    stop(row_parse_error(row, "negative age"))
  if (rec$age > 120)
    warning("row ", row, ": suspiciously high age (", rec$age, ")")
  list(name = rec$name, age = rec$age)
}

safe_loader <- function(records) {
  good     <- list()
  errors   <- list()
  warn_log <- character()

  for (i in seq_along(records)) {
    parsed <- tryCatch(
      withCallingHandlers(
        parse_record(i, records[[i]]),
        warning = function(w) {
          warn_log <<- c(warn_log, conditionMessage(w))
          invokeRestart("muffleWarning")
        }
      ),
      row_parse_error = function(e) {
        errors[[length(errors) + 1L]] <<- list(row = e$row, reason = e$reason)
        NULL
      }
    )
    if (!is.null(parsed)) good[[length(good) + 1L]] <- parsed
  }

  list(data = good, errors = errors, warnings = warn_log)
}

records <- list(
  list(name = "Alice", age = 30),
  list(name = "",      age = 25),      # will fail: missing name
  list(name = "Bob",   age = "old"),   # will fail: age not numeric
  list(name = "Carol", age = 150),     # will warn: suspiciously high
  list(name = "Dan",   age = -3),      # will fail: negative age
  list(name = "Eve",   age = 42)
)

loader_result <- safe_loader(records)

length(loader_result$data)
#> [1] 3
length(loader_result$errors)
#> [1] 3
loader_result$warnings
#> [1] "row 4: suspiciously high age (150)"
loader_result$errors[[1]]
#> $row
#> [1] 2
#>
#> $reason
#> [1] "missing name"
```

Three records survive, three are captured as structured errors, one warning is logged, and nothing crashed. The loader uses every piece of the condition system: a custom class (`row_parse_error`) for selective dispatch, `withCallingHandlers()` with `invokeRestart("muffleWarning")` for clean warning capture, and an outer `tryCatch()` that turns a bad row into a logged error instead of a crash. That's the shape of a production-quality R function that handles dirty data gracefully.

## Summary

![R condition system overview](screenshots/R-Conditions-System-overview-mindmap.webp)
*Figure 3: The full condition system at a glance: signal functions, handlers, and custom classes.*

| Function | Purpose | Stops execution? | Typical use |
|---|---|---|---|
| `message()` | Informational note | No | Progress updates, default-value notices |
| `warning()` | Problem, kept going | No | Silent bugs you want surfaced |
| `stop()` | Error, refuses to continue | Yes | Unrecoverable problems |
| `tryCatch()` | Exiting handler | Unwinds the stack | Replace the value, recover, run cleanup |
| `withCallingHandlers()` | Calling handler | Resumes | Log, count, audit — without disturbing the result |
| `errorCondition()` | Build a classed condition | — | Structured, typed errors with fields |
| `invokeRestart("muffleWarning")` | Silence the default print | — | Inside a calling handler, after you've logged |

The key mental model: *signaling* is one thing (the function that finds the problem) and *handling* is a separate decision (what the caller wants to do about it). Picking the right signal — message, warning, stop — is a communication choice. Picking the right handler — `tryCatch()` vs `withCallingHandlers()` — is a control-flow choice. Custom condition classes make both ends less brittle.

## References

1. Wickham, H. — *Advanced R*, 2nd Edition. Chapter 8: Conditions. [Link](https://adv-r.hadley.nz/conditions.html)
2. R Core Team — `conditions` help page. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/conditions.html)
3. rlang documentation — `abort()`, `warn()`, `inform()`. [Link](https://rlang.r-lib.org/reference/abort.html)
4. Peng, R. D. — *Mastering Software Development in R*, §2.5 Error Handling and Generation. [Link](https://bookdown.org/rdpeng/RProgDA/error-handling-and-generation.html)
5. Advanced R Solutions — Chapter 8 exercises. [Link](https://advanced-r-solutions.rbind.io/conditions)
6. tryCatchLog vignette — structured logging around tryCatch. [Link](https://cran.r-project.org/web/packages/tryCatchLog/vignettes/tryCatchLog-intro.html)
7. Seibel, P. — *Beyond Exception Handling: Conditions and Restarts* (ported to R by Wickham). [Link](http://adv-r.had.co.nz/beyond-exception-handling.html)

## Continue Learning

- [Writing R Functions](R-Functions.html) — the anatomy of the functions where conditions get signaled.
- [R Control Flow](R-Control-Flow.html) — how `if`, `for`, and `while` interact with `stop()` and `break`.
- [R Special Values](R-Special-Values.html) — `NA`, `NULL`, `NaN`, `Inf`, and when to return each from a handler.
