---
title: "R Conditions System: message(), warning(), stop() & Custom Conditions"
slug: "R-Conditions-System"
description: "Master R's conditions system: signal errors with stop(), warnings with warning(), handle them with tryCatch and withCallingHandlers, and create custom conditions."
keywords: "R tryCatch, R withCallingHandlers, R stop, R warning, R message, R custom conditions, R error handling, R conditions system"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "4.1.7"
post_type: "C"
auto_link_terms: "R conditions system|tryCatch|withCallingHandlers|R error handling|stop()|warning()"
auto_link_case_sensitive: false
---

# R Conditions System: message(), warning(), stop() & Custom Conditions

<p class="lead">R's conditions system is how functions communicate problems. <code>stop()</code> signals errors, <code>warning()</code> signals warnings, and <code>message()</code> signals informational messages. <code>tryCatch()</code> and <code>withCallingHandlers()</code> let you intercept and handle them.</p>

Error handling separates robust code from fragile code. Instead of letting your script crash when something goes wrong, you can catch the problem, log it, try an alternative, or fail gracefully with a clear message. R's conditions system is powerful, flexible, and underused.

## Introduction

R has a three-level system for communicating problems:

| Level | Function | Severity | Default behavior |
|-------|----------|----------|-----------------|
| Error | `stop()` | Fatal | Stops execution |
| Warning | `warning()` | Non-fatal | Prints warning, continues |
| Message | `message()` | Informational | Prints message, continues |

These are called **conditions**. You **signal** conditions with `stop()`, `warning()`, `message()`, and you **handle** them with `tryCatch()` and `withCallingHandlers()`.

## Signaling Conditions

### stop() — Errors

Use `stop()` when something is unrecoverable:

```r
divide <- function(x, y) {
  if (y == 0) stop("Division by zero")
  x / y
}

cat("10 / 2 =", divide(10, 2), "\n")

# This would stop execution:
result <- tryCatch(
  divide(10, 0),
  error = function(e) {
    cat("Caught error:", conditionMessage(e), "\n")
    NA
  }
)
cat("Result:", result, "\n")
```

### warning() — Warnings

Use `warning()` when something is suspicious but not fatal:

```r
safe_log <- function(x) {
  if (any(x <= 0)) {
    warning("Non-positive values found; returning NA for those")
    x[x <= 0] <- NA
  }
  log(x)
}

result <- safe_log(c(10, -5, 100, 0, 50))
cat("Result:", round(result, 2), "\n")
```

### message() — Informational

Use `message()` for progress updates and status info. Unlike `cat()`, messages can be suppressed:

```r
process_data <- function(x) {
  message("Starting processing...")
  result <- x * 2
  message("Processing complete. ", length(x), " items processed.")
  result
}

# Normal use — messages appear
output <- process_data(1:5)
cat("Output:", output, "\n")

# Suppress messages
output2 <- suppressMessages(process_data(1:5))
cat("Output2:", output2, "\n")
```

## tryCatch(): Handling Conditions

`tryCatch()` intercepts conditions and runs handler functions:

```r
# Basic tryCatch pattern
safe_divide <- function(x, y) {
  tryCatch(
    x / y,
    warning = function(w) {
      cat("Warning caught:", conditionMessage(w), "\n")
      NA
    },
    error = function(e) {
      cat("Error caught:", conditionMessage(e), "\n")
      NA
    }
  )
}

cat("10 / 2 =", safe_divide(10, 2), "\n")
cat("10 / 0 =", safe_divide(10, 0), "\n")
cat("'a' / 2 =", safe_divide("a", 2), "\n")
```

### tryCatch with finally

The `finally` block always runs, whether or not an error occurred:

```r
read_data <- function(source) {
  tryCatch({
    message("Opening connection to: ", source)
    # Simulate reading data
    if (source == "bad") stop("Connection failed")
    data <- data.frame(x = 1:5, y = rnorm(5))
    data
  },
  error = function(e) {
    cat("Error:", conditionMessage(e), "\n")
    NULL
  },
  finally = {
    message("Cleanup: closing connection")
  })
}

result1 <- read_data("good")
cat("\nGood result:\n")
print(result1)

cat("\n")
result2 <- read_data("bad")
cat("Bad result:", is.null(result2), "\n")
```

### Catching Specific Conditions

```r
# tryCatch returns the handler's return value
safe_parse <- function(text) {
  tryCatch(
    eval(parse(text = text)),
    error = function(e) {
      cat("Parse/eval error:", conditionMessage(e), "\n")
      NULL
    },
    warning = function(w) {
      cat("Warning:", conditionMessage(w), "\n")
      suppressWarnings(eval(parse(text = text)))
    }
  )
}

cat("1 + 2 =", safe_parse("1 + 2"), "\n")
cat("bad code =", safe_parse("1 +"), "\n")
```

## withCallingHandlers(): Non-Local Handlers

The key difference: `tryCatch()` unwinds the call stack (exits the expression), while `withCallingHandlers()` runs the handler *without* unwinding, then continues:

```r
# withCallingHandlers lets execution continue
result <- withCallingHandlers(
  {
    message("Step 1: starting")
    warning("Minor issue detected")
    message("Step 2: continuing after warning")
    42  # return value
  },
  warning = function(w) {
    cat("Handler saw warning:", conditionMessage(w), "\n")
    invokeRestart("muffleWarning")  # suppress the warning
  },
  message = function(m) {
    cat("Handler saw message:", conditionMessage(m))
    invokeRestart("muffleMessage")
  }
)
cat("Final result:", result, "\n")
```

### When to Use Which

```r
# tryCatch: for RECOVERY — replace failed result with fallback
recover_example <- function() {
  tryCatch(
    log("not a number"),  # This errors
    error = function(e) {
      cat("Recovering from:", conditionMessage(e), "\n")
      NA  # Fallback value
    }
  )
}
cat("Recovered:", recover_example(), "\n")

# withCallingHandlers: for LOGGING — observe but don't change flow
log_example <- function() {
  warnings_seen <- character()

  result <- withCallingHandlers(
    {
      x <- as.numeric(c("1", "two", "3"))
      sum(x, na.rm = TRUE)
    },
    warning = function(w) {
      warnings_seen <<- c(warnings_seen, conditionMessage(w))
      invokeRestart("muffleWarning")
    }
  )

  list(result = result, warnings = warnings_seen)
}

output <- log_example()
cat("Result:", output$result, "\n")
cat("Warnings logged:", output$warnings, "\n")
```

## Custom Condition Classes

You can create your own condition types for more precise handling:

```r
# Create a custom condition constructor
validation_error <- function(message, field, value) {
  structure(
    class = c("validation_error", "error", "condition"),
    list(message = message, field = field, value = value)
  )
}

# Signal the custom condition
validate_age <- function(age) {
  if (!is.numeric(age)) {
    stop(validation_error("Age must be numeric", "age", age))
  }
  if (age < 0 || age > 150) {
    stop(validation_error("Age out of range", "age", age))
  }
  cat("Valid age:", age, "\n")
}

# Handle only validation errors
tryCatch(
  validate_age("abc"),
  validation_error = function(e) {
    cat("Validation failed!\n")
    cat("  Field:", e$field, "\n")
    cat("  Value:", e$value, "\n")
    cat("  Message:", e$message, "\n")
  }
)
```

## Practical Pattern: Retry on Error

```r
retry <- function(expr, n = 3, delay = 0.1) {
  for (i in 1:n) {
    result <- tryCatch(
      {
        val <- expr
        return(val)
      },
      error = function(e) {
        if (i < n) {
          cat(sprintf("Attempt %d failed: %s. Retrying...\n", i, conditionMessage(e)))
        } else {
          cat(sprintf("Attempt %d failed: %s. Giving up.\n", i, conditionMessage(e)))
        }
        NULL
      }
    )
  }
  NULL
}

# Simulate a flaky operation
attempt <- 0
flaky <- function() {
  attempt <<- attempt + 1
  if (attempt < 3) stop("Random failure")
  cat("Success on attempt", attempt, "\n")
  42
}

attempt <- 0
result <- retry(flaky(), n = 5)
cat("Result:", result, "\n")
```

## Practice Exercises

### Exercise 1: Safe Function Wrapper

```r
# Exercise: Write safely(fn) that returns a new function.
# The new function calls fn(...) but catches any error
# and returns list(result = NULL, error = "error message")
# On success, returns list(result = value, error = NULL)
#
# Usage:
#   safe_log <- safely(log)
#   safe_log(10)      # list(result = 2.302585, error = NULL)
#   safe_log("text")  # list(result = NULL, error = "non-numeric...")

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
safely <- function(fn) {
  function(...) {
    tryCatch(
      list(result = fn(...), error = NULL),
      error = function(e) {
        list(result = NULL, error = conditionMessage(e))
      }
    )
  }
}

safe_log <- safely(log)

good <- safe_log(10)
cat("Good result:", good$result, "\n")
cat("Good error:", good$error, "\n")

bad <- safe_log("text")
cat("\nBad result:", bad$result, "\n")
cat("Bad error:", bad$error, "\n")

# Apply to a list with mixed inputs
inputs <- list(10, -1, "abc", 100)
results <- lapply(inputs, safe_log)
for (i in seq_along(results)) {
  r <- results[[i]]
  if (is.null(r$error)) {
    cat(sprintf("Input %s -> %.3f\n", inputs[[i]], r$result))
  } else {
    cat(sprintf("Input %s -> ERROR: %s\n", inputs[[i]], r$error))
  }
}
```

**Explanation:** `safely()` is a function factory that wraps any function with `tryCatch`. This pattern (inspired by `purrr::safely`) is extremely useful for applying operations to lists where some elements might fail.

</details>

## Summary

| Tool | Purpose | Behavior |
|------|---------|----------|
| `stop(msg)` | Signal an error | Stops execution |
| `warning(msg)` | Signal a warning | Prints warning, continues |
| `message(msg)` | Signal info message | Prints message, continues |
| `tryCatch(expr, ...)` | Catch and recover | Unwinds stack, returns handler value |
| `withCallingHandlers(expr, ...)` | Observe conditions | Handler runs, then continues |
| `conditionMessage(c)` | Extract message text | Works on all condition objects |
| `suppressWarnings(expr)` | Silence warnings | Runs expr quietly |
| `suppressMessages(expr)` | Silence messages | Runs expr quietly |

## FAQ

### When should I use stop() vs warning()?

Use `stop()` when the function cannot produce a valid result. Use `warning()` when the function can produce a result but something is suspicious. Example: `sqrt(-1)` returns `NaN` with a warning — the computation proceeds, but the user should know something was off.

### What's the difference between tryCatch and try?

`try()` is a simplified version of `tryCatch()` — it catches errors and returns an object of class `"try-error"` instead of stopping. `tryCatch()` is more flexible: you can handle errors, warnings, and messages separately, and your handlers can return fallback values.

### Can I nest tryCatch calls?

Yes. Inner `tryCatch` catches conditions first. If a condition isn't caught by the inner handler, it propagates to the outer one. This is useful for handling different error types at different levels of your code.

## What's Next?

Now that you can handle errors, learn to find and fix the bugs that cause them:

1. **R Debugging** — browser(), debug(), traceback() and RStudio breakpoints
2. **R Common Errors** — the 50 most frequent R error messages and how to fix them
3. **R Closures** — use closures as stateful condition handlers
