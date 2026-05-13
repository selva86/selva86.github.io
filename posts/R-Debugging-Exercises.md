---
title: "R Debugging Exercises: 18 Real-World Practice Problems"
slug: "R-Debugging-Exercises"
description: "Practice R debugging with 18 scenario-based exercises: traceback, browser, debug, tryCatch, withCallingHandlers, custom conditions, restarts, recover."
keywords: "R debugging exercises, debugging in R, traceback R, browser R, tryCatch R, withCallingHandlers R, custom conditions R, restarts R"
mathjax: false
webr: false
date: "2026-05-13"
post_type: "EX"
sidebar_title: "R Debugging Exercises"
sidebar_order: 170
fr_parent: "R-Debugging.html"
auto_link_terms: "r debugging exercises|debugging in r|traceback|trycatch|withcallinghandlers|browser r"
auto_link_case_sensitive: false
target_keyword: "R debugging exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# R Debugging Exercises: 18 Real-World Practice Problems

<p class="lead">Eighteen scenario-based debugging exercises grouped into six themed sections covering traceback, browser stepping, debug instrumentation, tryCatch, withCallingHandlers, custom conditions, restarts, and post-mortem inspection. Every problem ships with an expected result so you can verify your fix, and solutions are hidden behind reveal toggles so you actually try first.</p>

```r title="Run this once before any exercise"
# All exercises run in vanilla base R. No external packages are required.
# The utils package (auto-loaded) provides capture.output(), traceback(), debug(), trace().
library(utils)
```

## Section 1. Locating the bug with traceback and sys.calls (3 problems)

### Exercise 1.1: Use traceback to find which sapply iteration broke

**Task:** A junior analyst's pipeline calls `add_one()` over a list of items, but one element is the string `"three"` instead of a number, so `sapply(items, add_one)` crashes inside the helper. Reproduce the failure, mentally walk the `traceback()` output to confirm `add_one` is the failing frame, then rewrite the helper to coerce non-numeric values to `NA` and save the resulting length-4 vector to `ex_1_1`.

**Expected result:**

```
#> [1]  2  3 NA  5
```

**Difficulty:** Beginner

```r title="Your turn"
items <- list(1, 2, "three", 4)
add_one <- function(x) x + 1
# trigger the error, then fix add_one()
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
items <- list(1, 2, "three", 4)

add_one <- function(x) {
  x_num <- suppressWarnings(as.numeric(x))
  if (is.na(x_num)) NA_real_ else x_num + 1
}

ex_1_1 <- sapply(items, add_one)
ex_1_1
#> [1]  2  3 NA  5
```

**Explanation:** Without coercion, `"three" + 1` raises "non-numeric argument to binary operator" and `traceback()` shows the call chain `sapply > FUN > add_one > +`. The fix is to coerce inside the helper and short-circuit on `NA`. `suppressWarnings()` silences the expected "NAs introduced by coercion" message because it is now the documented contract of the function.

</details>

### Exercise 1.2: Pinpoint the failing helper in a 3-level call chain

**Task:** A reporting function `report()` calls `summarise_weighted()` which calls `wmean()`, and the bottom helper divides by `sum(w)` where `w` happens to be all zeros, producing `NaN` rather than a real number. Reproduce the bug, identify the lowest non-namespace frame in the call chain, fix `wmean()` so that a zero-sum-of-weights returns `NA_real_` with a warning, then save the corrected weighted mean for `x = 1:5, w = c(0,0,0,0,0)` to `ex_1_2`.

**Expected result:**

```
#> # weighted mean with zero-sum weights:
#> [1] NA
```

**Difficulty:** Intermediate

```r title="Your turn"
wmean <- function(x, w) sum(x * w) / sum(w)
summarise_weighted <- function(x, w) wmean(x, w)
report <- function(x, w) summarise_weighted(x, w)
# fix wmean(), then call report()
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
wmean <- function(x, w) {
  s <- sum(w)
  if (s == 0) {
    warning("sum of weights is zero; returning NA")
    return(NA_real_)
  }
  sum(x * w) / s
}

summarise_weighted <- function(x, w) wmean(x, w)
report <- function(x, w) summarise_weighted(x, w)

ex_1_2 <- suppressWarnings(report(1:5, c(0, 0, 0, 0, 0)))
ex_1_2
#> [1] NA
```

**Explanation:** When the wrapped error reaches the top, `traceback()` shows `report > summarise_weighted > wmean > /` so the bug is in `wmean`. Defensive guards belong in the lowest helper where the math actually happens, not in the outer report function. Returning `NA_real_` with a warning keeps downstream code typed and observable rather than silently producing `NaN`.

</details>

### Exercise 1.3: Capture the call stack inside a tryCatch handler

**Task:** Sometimes you cannot rerun a failing job interactively, so you want the function itself to log the call stack when it crashes. Wrap the buggy call `log(c(1, -2, 3))` (which warns but does not error) inside an explicit `tryCatch` that on a deliberate `stop()` inside the body captures `sys.calls()` as a character vector. Trigger an error via `stop("synthetic error")` after the `log()` call, capture the calls in the error handler, and save the deparsed call vector to `ex_1_3`.

**Expected result:**

```
#> [1] "tryCatch(...)"          "doTryCatch(...)"        "stop(\"synthetic error\")"
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_3 <- tryCatch({
  log(c(1, -2, 3))
  stop("synthetic error")
}, error = function(e) {
  # capture the call stack here and return a character vector
})
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- tryCatch({
  log(c(1, -2, 3))
  stop("synthetic error")
}, error = function(e) {
  calls <- sys.calls()
  tail(vapply(calls, function(cl) paste(deparse(cl), collapse = " "), ""), 3)
})
ex_1_3
#> [1] "tryCatch(...)"          "doTryCatch(...)"        "stop(\"synthetic error\")"
```

**Explanation:** `sys.calls()` returns the active call stack at the moment it runs (inside the handler, after `stop()` triggers it). `deparse()` turns each call into source text, and `tail()` keeps only the three deepest frames so the log is concise. This is the programmatic equivalent of `traceback()` for crash reporting in non-interactive jobs.

</details>

## Section 2. Interactive stepping with browser and breakpoints (3 problems)

### Exercise 2.1: Place browser to verify a running total

**Task:** A trainee wrote a `running_sum()` function that should return the cumulative total of a numeric vector, but the result is always the last element because the accumulator is reset inside the loop. Decide where to insert `browser()` to see the wrong reset (between the assignment and the addition), then rewrite the loop so the accumulator persists across iterations and save the cumulative vector for `1:5` to `ex_2_1`.

**Expected result:**

```
#> [1]  1  3  6 10 15
```

**Difficulty:** Beginner

```r title="Your turn"
running_sum_bad <- function(x) {
  out <- numeric(length(x))
  for (i in seq_along(x)) {
    acc <- 0                  # the bug: resets every iteration
    acc <- acc + x[i]
    out[i] <- acc
  }
  out
}
# fix the loop, then compute
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
running_sum <- function(x) {
  out <- numeric(length(x))
  acc <- 0
  for (i in seq_along(x)) {
    acc <- acc + x[i]
    out[i] <- acc
  }
  out
}

ex_2_1 <- running_sum(1:5)
ex_2_1
#> [1]  1  3  6 10 15
```

**Explanation:** Inserting `browser()` right after `acc <- 0` would show `acc` is always 0 at that point, which is the smoking gun. The fix is to lift the accumulator out of the loop body so it survives across iterations. `cumsum()` is the idiomatic one-liner in production, but writing the loop forces you to internalise the scoping issue.

</details>

### Exercise 2.2: Use browser to find a name conflict in argument forwarding

**Task:** A plotting wrapper `quick_hist()` forwards `...` to `hist()` but the wrapper also defines its own local variable named `breaks`, so a caller passing `breaks = 10` sees the wrapper's value win instead of theirs. Mentally place `browser()` at the top of the wrapper to inspect `list(...)` versus the local `breaks`, then refactor so the user's `breaks` wins. Verify by counting how many bins the histogram of `mtcars$mpg` produces with `breaks = 10` and save that bin count to `ex_2_2`.

**Expected result:**

```
#> # bin count after user-supplied breaks wins:
#> [1] 10
```

**Difficulty:** Intermediate

```r title="Your turn"
quick_hist_bad <- function(x, ...) {
  breaks <- 5                       # bug: shadows any user-supplied breaks
  hist(x, breaks = breaks, plot = FALSE, ...)
}
# refactor and verify
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
quick_hist <- function(x, breaks = 5, ...) {
  hist(x, breaks = breaks, plot = FALSE, ...)
}

h <- quick_hist(mtcars$mpg, breaks = 10)
ex_2_2 <- length(h$counts)
ex_2_2
#> [1] 10
```

**Explanation:** The conflict is that `breaks` is set inside the function body AND passed through `...`, so `hist()` receives the argument twice and errors, or worse, silently picks one. Promoting `breaks` to a formal argument with a default lets the user override it cleanly. `browser()` at the top would have revealed `list(...)$breaks` was 10 while the local `breaks` was 5 - the visual mismatch is the diagnostic signal.

</details>

### Exercise 2.3: Use trace at a specific expression to inspect intermediates

**Task:** A rolling-mean function `rmean()` is producing slightly wrong values for a 3-element window and you suspect the off-by-one is in the index range. Without modifying the source, use `trace(rmean, quote(print(idx)), at = 3)` to print the index vector at the third top-level expression of the body. Run `rmean(c(2,4,6,8,10), k = 3)`, capture the printed indices with `capture.output()`, untrace, and save the captured character vector (length 3, one per iteration) to `ex_2_3`.

**Expected result:**

```
#> [1] "[1] 1 2 3" "[1] 2 3 4" "[1] 3 4 5"
```

**Difficulty:** Advanced

```r title="Your turn"
rmean <- function(x, k) {
  n   <- length(x)
  out <- numeric(n - k + 1)
  for (i in seq_len(n - k + 1)) {
    idx    <- i:(i + k - 1)
    out[i] <- mean(x[idx])
  }
  out
}
# trace at expression 3 (the for-loop body) and capture printed indices
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
rmean <- function(x, k) {
  n   <- length(x)
  out <- numeric(n - k + 1)
  for (i in seq_len(n - k + 1)) {
    idx    <- i:(i + k - 1)
    out[i] <- mean(x[idx])
  }
  out
}

suppressMessages(trace(rmean, quote(print(idx)), at = list(c(3, 4))))
captured <- capture.output(invisible(rmean(c(2, 4, 6, 8, 10), k = 3)))
suppressMessages(untrace(rmean))

ex_2_3 <- captured
ex_2_3
#> [1] "[1] 1 2 3" "[1] 2 3 4" "[1] 3 4 5"
```

**Explanation:** `at = list(c(3, 4))` reaches into the third top-level statement (the `for` loop) and inserts the tracer immediately before the fourth nested statement (the `mean()` assignment), so `idx` is visible. `capture.output()` redirects printing to a character vector for verification, and `untrace()` removes the instrumentation so subsequent calls run unmodified.

</details>

## Section 3. debug, debugonce, and trace instrumentation (3 problems)

### Exercise 3.1: Fix a closure that captured the wrong free variable

**Task:** A code reviewer notices that `make_adder()` always adds the LAST value of `n` in a `for` loop because the closure captures by reference, not by value. After conceptually running `debugonce(adders[[1]])` to confirm `n` resolves to 3 inside both closures, rewrite `make_adder()` to force the captured value at definition time, build a list of adders for `n = 1:3`, apply each to 10, and save the resulting vector to `ex_3_1`.

**Expected result:**

```
#> [1] 11 12 13
```

**Difficulty:** Beginner

```r title="Your turn"
make_adder_bad <- function() {
  out <- list()
  for (n in 1:3) {
    out[[n]] <- function(x) x + n      # bug: n is captured by reference
  }
  out
}
# fix make_adder, apply each closure to 10, save the vector
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
make_adder <- function() {
  out <- list()
  for (n in 1:3) {
    local({
      nn <- n                       # bind a private copy
      out[[nn]] <<- function(x) x + nn
    })
  }
  out
}

adders <- make_adder()
ex_3_1 <- sapply(adders, function(f) f(10))
ex_3_1
#> [1] 11 12 13
```

**Explanation:** Stepping with `debugonce()` inside `adders[[1]]` shows the body is `x + n` and `n` evaluates to 3 because it was the loop's final value when the closure was eventually called. Wrapping the assignment in `local()` (or using `Map(function(n) function(x) x + n, 1:3)`) forces R to bind `nn` per iteration, so each closure remembers its own number.

</details>

### Exercise 3.2: Insert a tracer that records the value at a chosen expression

**Task:** A statistician wants to confirm that `winsorize()` is clipping at the correct quantile thresholds without editing the source. Use `trace(winsorize, quote(message("lo=", lo, " hi=", hi)), at = 3)` to inject a message at the third statement (the assignment of `out`), call `winsorize(c(1, 2, 5, 10, 100), p = 0.2)`, capture the message via `capture.output(type = "message")`, untrace, and save the captured character string to `ex_3_2`.

**Expected result:**

```
#> [1] "lo=1.8 hi=82"
```

**Difficulty:** Advanced

```r title="Your turn"
winsorize <- function(x, p = 0.05) {
  lo  <- quantile(x, p,     names = FALSE)
  hi  <- quantile(x, 1 - p, names = FALSE)
  out <- pmin(pmax(x, lo), hi)
  out
}
# trace at expression 3, capture stderr message, save the line
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
winsorize <- function(x, p = 0.05) {
  lo  <- quantile(x, p,     names = FALSE)
  hi  <- quantile(x, 1 - p, names = FALSE)
  out <- pmin(pmax(x, lo), hi)
  out
}

suppressMessages(trace(winsorize, quote(message("lo=", lo, " hi=", hi)), at = 3))
msg <- capture.output(
  invisible(winsorize(c(1, 2, 5, 10, 100), p = 0.2)),
  type = "message"
)
suppressMessages(untrace(winsorize))

ex_3_2 <- msg[grepl("^lo=", msg)]
ex_3_2
#> [1] "lo=1.8 hi=82"
```

**Explanation:** `at = 3` places the tracer just before the third top-level expression, so by the time it fires both `lo` and `hi` are already bound. `message()` writes to `stderr`, which is why `capture.output(type = "message")` is the right capture mode. Filtering with `grepl()` drops the trace banner so only the data line survives.

</details>

### Exercise 3.3: Manage the trace/untrace lifecycle cleanly

**Task:** Instrumentation that you forget to remove will leak into every subsequent call, so a disciplined workflow always pairs `trace()` with `untrace()`. Trace `nchar` so that each call also messages its argument, call `nchar("hello")`, untrace, then verify the trace is gone by inspecting `body(nchar)` for the injected `message(` call (it should not appear after untrace). Save the boolean confirming that the body is clean to `ex_3_3`.

**Expected result:**

```
#> [1] TRUE
```

**Difficulty:** Advanced

```r title="Your turn"
suppressMessages(trace(nchar, quote(message("arg=", type)), at = 1))
# call nchar, then untrace
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
suppressMessages(trace(nchar, quote(message("arg=", type)), at = 1))
invisible(capture.output(nchar("hello"), type = "message"))
suppressMessages(untrace(nchar))

body_text <- paste(deparse(body(nchar)), collapse = " ")
ex_3_3 <- !grepl("arg=", body_text, fixed = TRUE)
ex_3_3
#> [1] TRUE
```

**Explanation:** When `trace()` is active, `body(nchar)` shows the injected expression inline; `untrace()` restores the original body. Checking `grepl("arg=", body_text)` after untrace gives a deterministic boolean signal you can assert in tests, so a test suite catches accidentally-left-on instrumentation before it ships.

</details>

## Section 4. Catching errors with tryCatch (3 problems)

### Exercise 4.1: Make a parser resilient via tryCatch around each element

**Task:** An ingestion job receives a character vector of supposedly-numeric strings, but one row contains `"bad"`. Without tryCatch the whole `sapply(as.numeric, ...)` succeeds with a warning but loses the bad row's identity, and a stricter helper that uses `stop()` halts the batch. Wrap the conversion in `tryCatch` per element so a bad value returns `NA_real_`, run it over `c("1.5", "2.7", "bad", "4.0")`, and save the length-4 numeric vector to `ex_4_1`.

**Expected result:**

```
#> [1] 1.5 2.7  NA 4.0
```

**Difficulty:** Intermediate

```r title="Your turn"
strict_parse <- function(s) {
  out <- as.numeric(s)
  if (is.na(out)) stop("not numeric: ", s)
  out
}
inputs <- c("1.5", "2.7", "bad", "4.0")
# wrap strict_parse in tryCatch per element
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
strict_parse <- function(s) {
  out <- as.numeric(s)
  if (is.na(out)) stop("not numeric: ", s)
  out
}
inputs <- c("1.5", "2.7", "bad", "4.0")

ex_4_1 <- suppressWarnings(
  vapply(inputs,
         function(s) tryCatch(strict_parse(s), error = function(e) NA_real_),
         numeric(1),
         USE.NAMES = FALSE)
)
ex_4_1
#> [1] 1.5 2.7  NA 4.0
```

**Explanation:** Per-element `tryCatch` isolates each failure so one bad row cannot kill the batch. `vapply()` with `numeric(1)` enforces a numeric scalar per call, so the result is type-stable even if every row errors. The pattern generalises to any partial-success workflow: ingestion, scraping, API calls, model refits.

</details>

### Exercise 4.2: Branch on error versus warning in tryCatch

**Task:** Some code paths produce warnings (e.g. `as.numeric("x")` returns NA with a warning) while others produce errors (e.g. `stop("boom")`). Build a `classify()` helper that wraps an expression in `tryCatch` with both `error =` and `warning =` arms, returning a named two-element list `list(kind, message)` distinguishing the two cases. Apply it to `stop("boom")` and save the resulting list to `ex_4_2`.

**Expected result:**

```
#> $kind
#> [1] "error"
#>
#> $message
#> [1] "boom"
```

**Difficulty:** Intermediate

```r title="Your turn"
classify <- function(expr) {
  # tryCatch with separate error= and warning= arms
}
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
classify <- function(expr) {
  tryCatch(
    { force(expr); list(kind = "ok", message = NA_character_) },
    warning = function(w) list(kind = "warning", message = conditionMessage(w)),
    error   = function(e) list(kind = "error",   message = conditionMessage(e))
  )
}

ex_4_2 <- classify(stop("boom"))
ex_4_2
#> $kind
#> [1] "error"
#>
#> $message
#> [1] "boom"
```

**Explanation:** `tryCatch` evaluates each handler in the order written, so listing `warning =` before `error =` is fine because R picks the one matching the actual condition class. `conditionMessage()` extracts the human-readable text. Note that `tryCatch` HALTS execution on a warning if you attach a handler to it; if you want the expression to continue after warnings, use `withCallingHandlers` (see Section 5).

</details>

### Exercise 4.3: Use finally to guarantee cleanup

**Task:** A function opens a temporary file connection, writes a row, and must always close the connection even if a subsequent calculation throws. Use `tryCatch` with a `finally =` arm that closes the connection regardless of outcome. After a deliberate `stop("simulated failure")` inside the body, verify that the connection is no longer open by checking `isOpen(con)` was reset before propagating, and save the boolean confirming cleanup happened to `ex_4_3`.

**Expected result:**

```
#> [1] TRUE
```

**Difficulty:** Intermediate

```r title="Your turn"
tmp <- tempfile()
con <- file(tmp, open = "w")
closed_ok <- FALSE
# tryCatch body should writeLines, then stop; finally should close(con) and set closed_ok <- TRUE
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
tmp <- tempfile()
con <- file(tmp, open = "w")
closed_ok <- FALSE

result <- tryCatch({
  writeLines("row 1", con)
  stop("simulated failure")
}, error = function(e) "caught",
   finally = {
     close(con)
     closed_ok <<- TRUE
   })

ex_4_3 <- closed_ok && !isOpen(con, rw = "")
ex_4_3
#> [1] TRUE
```

**Explanation:** The `finally =` arm runs whether the body succeeded, threw, or was caught, which makes it the right hook for resource cleanup like closing connections, removing temp files, or releasing locks. Using `<<-` lets the finally block flip the outer-scope `closed_ok` flag. `isOpen(con, rw = "")` then confirms the underlying file descriptor really is closed.

</details>

## Section 5. withCallingHandlers, conditions, and restarts (3 problems)

### Exercise 5.1: Collect every warning without halting the computation

**Task:** A model-fitting loop produces several `glm` warnings that you want to log without aborting. Wrap a call to `sapply(c(1, -2, 3, -4), log)` in `withCallingHandlers` whose `warning =` handler appends `conditionMessage(w)` to a growing list and then invokes the `muffleWarning` restart so the body keeps running. After the call, save the captured warning messages (a character vector of length 2, one per negative input) to `ex_5_1`.

**Expected result:**

```
#> [1] "NaNs produced" "NaNs produced"
```

**Difficulty:** Advanced

```r title="Your turn"
warnings_log <- character()
# withCallingHandlers around sapply(log) with invokeRestart("muffleWarning")
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
warnings_log <- character()

withCallingHandlers(
  sapply(c(1, -2, 3, -4), log),
  warning = function(w) {
    warnings_log[length(warnings_log) + 1] <<- conditionMessage(w)
    invokeRestart("muffleWarning")
  }
)

ex_5_1 <- warnings_log
ex_5_1
#> [1] "NaNs produced" "NaNs produced"
```

**Explanation:** Unlike `tryCatch`, `withCallingHandlers` returns control to the signalling code after the handler runs, which is exactly what you want for warnings. Calling `invokeRestart("muffleWarning")` consumes the warning so it is not also printed to the console. The `<<-` operator updates the closure-scope log so the collected messages survive after the call returns.

</details>

### Exercise 5.2: Define and catch a domain-specific custom condition

**Task:** A data-quality job wants to distinguish ordinary errors from a specific failure mode "row contains a negative price", which downstream code should retry rather than halt the batch on. Define a custom condition class `data_quality_error` (extending `error` and `condition`), raise it via `stop()` with a structured payload, and catch ONLY that class in `tryCatch`, returning the message. Save the captured message string to `ex_5_2`.

**Expected result:**

```
#> [1] "negative price detected: -5"
```

**Difficulty:** Advanced

```r title="Your turn"
make_dq_error <- function(msg, price) {
  # build a condition with classes c("data_quality_error", "error", "condition")
}
check_price <- function(p) {
  if (p < 0) stop(make_dq_error(paste("negative price detected:", p), p))
  p
}
# catch ONLY data_quality_error, not generic error
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
make_dq_error <- function(msg, price) {
  structure(
    class   = c("data_quality_error", "error", "condition"),
    list(message = msg, call = sys.call(-1), price = price)
  )
}

check_price <- function(p) {
  if (p < 0) stop(make_dq_error(paste("negative price detected:", p), p))
  p
}

ex_5_2 <- tryCatch(
  check_price(-5),
  data_quality_error = function(e) conditionMessage(e)
)
ex_5_2
#> [1] "negative price detected: -5"
```

**Explanation:** Custom classes let `tryCatch` dispatch on the SPECIFIC condition, leaving genuine bugs (like a typo) to propagate as unhandled errors. The class vector order matters: `data_quality_error` must come before `error` so handlers can target it. Storing `price` on the condition object lets a retry handler decide what to do without re-parsing the message.

</details>

### Exercise 5.3: Install a restart and invoke it from a handler

**Task:** A helper `safe_log()` signals a `negative_input` condition when given a non-positive number, and the calling code installs a `use_default` restart that returns `0` instead. Wire `withRestarts()` inside `safe_log()` to expose the restart, signal the condition with `withCallingHandlers` outside, have the handler call `invokeRestart("use_default")`, and save the returned value for `safe_log(-1)` to `ex_5_3`.

**Expected result:**

```
#> # default returned via the use_default restart:
#> [1] 0
```

**Difficulty:** Advanced

```r title="Your turn"
safe_log <- function(x) {
  withRestarts({
    if (x <= 0) {
      cond <- structure(class = c("negative_input", "condition"),
                        list(message = "x <= 0", call = sys.call()))
      signalCondition(cond)
      stop("unhandled negative_input")
    }
    log(x)
  },
  use_default = function() 0)
}
# call safe_log(-1) under a withCallingHandlers that invokes use_default
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
safe_log <- function(x) {
  withRestarts({
    if (x <= 0) {
      cond <- structure(class = c("negative_input", "condition"),
                        list(message = "x <= 0", call = sys.call()))
      signalCondition(cond)
      stop("unhandled negative_input")
    }
    log(x)
  },
  use_default = function() 0)
}

ex_5_3 <- withCallingHandlers(
  safe_log(-1),
  negative_input = function(c) invokeRestart("use_default")
)
ex_5_3
#> [1] 0
```

**Explanation:** Restarts decouple WHO knows how to recover from WHO knows the policy. `safe_log()` exposes "I can return a default" without choosing it; the caller decides at the handler. If no handler invokes the restart, the body's `stop()` fires and the user sees a real error. This is the same machinery `readline()` uses for "abort" versus "retry" at the R prompt.

</details>

## Section 6. Defensive coding and post-mortem inspection (3 problems)

### Exercise 6.1: Validate inputs with stopifnot and capture the message

**Task:** A finance helper computes the log return of two prices but blows up cryptically when given a negative or zero denominator. Add `stopifnot(is.numeric(p1), is.numeric(p0), p0 > 0)` at the top so bad input fails fast with a readable message, then wrap a call to `log_return(100, -5)` in `tryCatch` to capture the error message as a character string and save it to `ex_6_1`.

**Expected result:**

```
#> [1] "p0 > 0 is not TRUE"
```

**Difficulty:** Intermediate

```r title="Your turn"
log_return <- function(p1, p0) {
  # add stopifnot guards
  log(p1 / p0)
}
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
log_return <- function(p1, p0) {
  stopifnot(is.numeric(p1), is.numeric(p0), p0 > 0)
  log(p1 / p0)
}

ex_6_1 <- tryCatch(
  log_return(100, -5),
  error = function(e) conditionMessage(e)
)
ex_6_1
#> [1] "p0 > 0 is not TRUE"
```

**Explanation:** `stopifnot()` is the lightest defensive-programming idiom in base R: it evaluates each expression and stops with the literal text of the first one that returns `FALSE`. The auto-generated message ("p0 > 0 is not TRUE") is informative enough for most internal helpers. For user-facing APIs, prefer `stop("p0 must be positive, got ", p0)` with a hand-crafted message.

</details>

### Exercise 6.2: Replicate recover-style post-mortem with sys.frames

**Task:** Interactive `options(error = recover)` is great at the console but useless in scheduled jobs, so you want a programmatic equivalent that captures the deepest frame's local variables on failure. Inside a `tryCatch` error handler around a function that allocates a local `n <- 42` then errors, walk `sys.frames()` to find the deepest frame and extract `n` from it via `get0()`. Save the captured value of `n` to `ex_6_2`.

**Expected result:**

```
#> # value of local 'n' captured from the deepest frame:
#> [1] 42
```

**Difficulty:** Intermediate

```r title="Your turn"
deep_call <- function() {
  n <- 42
  stop("inner failure")
}
# capture n from the deepest frame inside an error handler
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
deep_call <- function() {
  n <- 42
  stop("inner failure")
}

captured_n <- NA_real_
withCallingHandlers(
  tryCatch(deep_call(), error = function(e) NULL),
  error = function(e) {
    frames <- sys.frames()
    for (fr in rev(frames)) {
      v <- get0("n", envir = fr, inherits = FALSE)
      if (!is.null(v)) {
        captured_n <<- v
        break
      }
    }
  }
)

ex_6_2 <- captured_n
ex_6_2
#> [1] 42
```

**Explanation:** Walking frames from deepest outward (`rev(sys.frames())`) and asking each one for `n` via `get0(..., inherits = FALSE)` mimics what `recover()` does interactively: peek at the locals at the moment of failure. Doing the inspection inside a `withCallingHandlers` handler (instead of `tryCatch`) is critical because the frames still exist; once `tryCatch` unwinds, the frames are gone.

</details>

### Exercise 6.3: Build a chained error with parent context

**Task:** A pipeline catches a low-level error from a parser and wants to rethrow it with added high-level context ("failed during row 7") while preserving the original cause, similar to the `rlang::abort(parent = )` pattern but in pure base R. Build a chained condition with a `parent` slot, walk the chain to assemble the full message vector (outer first, then inner), and save the two-element character vector to `ex_6_3`.

**Expected result:**

```
#> [1] "failed during row 7"        "not numeric: bad"
```

**Difficulty:** Advanced

```r title="Your turn"
parse_value <- function(s) {
  v <- suppressWarnings(as.numeric(s))
  if (is.na(v)) stop("not numeric: ", s)
  v
}
process_row <- function(s, row_id) {
  tryCatch(parse_value(s),
           error = function(e) {
             # rethrow with parent context attached
           })
}
walk_chain <- function(cond) {
  # walk parent slots to produce a character vector of messages
}
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
parse_value <- function(s) {
  v <- suppressWarnings(as.numeric(s))
  if (is.na(v)) stop("not numeric: ", s)
  v
}

process_row <- function(s, row_id) {
  tryCatch(
    parse_value(s),
    error = function(e) {
      outer <- structure(
        class = c("chained_error", "error", "condition"),
        list(
          message = sprintf("failed during row %d", row_id),
          parent  = e,
          call    = sys.call(-1)
        )
      )
      stop(outer)
    }
  )
}

walk_chain <- function(cond) {
  msgs <- character()
  while (!is.null(cond)) {
    msgs <- c(msgs, conditionMessage(cond))
    cond <- cond$parent
  }
  msgs
}

caught <- tryCatch(process_row("bad", 7),
                   chained_error = function(e) e)
ex_6_3 <- walk_chain(caught)
ex_6_3
#> [1] "failed during row 7"        "not numeric: bad"
```

**Explanation:** Storing the inner condition in a `parent` slot of a new condition object preserves the full causal chain, which is invaluable when an error surfaces three layers above where it actually happened. `walk_chain()` then unfolds the linked list into a flat character vector for logging. Modern packages like `rlang` and `cli` formalise this pattern, but the base-R machinery has been here all along: a condition is just a list, so you can attach anything you need to it.

</details>

## What to do next

- Read [R Debugging](R-Debugging.html) for the conceptual tour of traceback, browser, debug, and trace before tackling these exercises.
- Practice the broader error-handling toolkit with [R Errors and Warnings Exercises](R-Errors-Exercises.html) (when published) to cement tryCatch, withCallingHandlers, and conditions.
- Sharpen pipeline reliability with [Functional Programming Exercises in R](Functional-Programming-Exercises-in-R.html) so you write helpers that fail predictably and recover gracefully.
- Move on to [R Performance Exercises](R-Performance-Exercises.html) (when published) to profile and fix the next class of "silent" bugs: slow code.
