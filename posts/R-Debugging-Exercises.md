---
title: "R Debugging Exercises: 12 Practice Problems"
slug: "R-Debugging-Exercises"
description: "Master R debugging with 12 practice problems: traceback, debug, browser, debugonce, tryCatch, conditions."
keywords: "R debugging exercises, traceback R, browser R, debugonce R, tryCatch R"
mathjax: false
webr: true
date: "2026-05-11"
post_type: "EX"
sidebar_title: "R Debugging Exercises"
sidebar_order: 170
fr_parent: "R-Tutorial.html"
auto_link_terms: "R debugging exercises|traceback R|browser R|debugonce R|tryCatch R"
auto_link_case_sensitive: false
target_keyword: "R debugging exercises"
sibling_block_enabled: false
difficulty: "Intermediate"
---

# R Debugging Exercises: 12 Practice Problems

<p class="lead">Twelve practice problems on R debugging: traceback, browser, debug, tryCatch, withCallingHandlers, conditions.</p>

```r
# All exercises are concept-level; run them in an interactive session.
```

### Exercise 1: traceback

<details><summary>Show solution</summary>

```r
# After an error: traceback()
# Shows the call stack at the moment of error.
```

</details>

### Exercise 2: debug a function

<details><summary>Show solution</summary>

```r
f <- function(x) { y <- x + 1; y * 2 }
# debug(f); f(5)   # steps line by line
```

</details>

### Exercise 3: debugonce

<details><summary>Show solution</summary>

```r
# debugonce(f); f(5)   # debugs only the next call
```

</details>

### Exercise 4: Insert browser()

<details><summary>Show solution</summary>

```r
f <- function(x) {
  browser()
  x + 1
}
# f(5)
```

</details>

### Exercise 5: options error = recover

<details><summary>Show solution</summary>

```r
# options(error = recover)
# Subsequent errors give you a stack picker
# Reset: options(error = NULL)
```

</details>

### Exercise 6: tryCatch error

<details><summary>Show solution</summary>

```r
out <- tryCatch(stop("boom"), error = function(e) "handled")
out
```

</details>

### Exercise 7: tryCatch warning

<details><summary>Show solution</summary>

```r
tryCatch(as.numeric("a"), warning = function(w) NA)
```

</details>

### Exercise 8: withCallingHandlers

<details><summary>Show solution</summary>

```r
withCallingHandlers(
  warning("careful"),
  warning = function(w) message("got: ", conditionMessage(w))
)
```

</details>

### Exercise 9: rlang::abort with class

<details><summary>Show solution</summary>

```r
# rlang::abort("nope", class = "my_error")
```

</details>

### Exercise 10: stop with structured info

<details><summary>Show solution</summary>

```r
stop(simpleError("custom error"))
```

</details>

### Exercise 11: trace function for profiling-style insertion

<details><summary>Show solution</summary>

```r
# trace(mean, exit = quote(print("called")))
# mean(1:5)
# untrace(mean)
```

</details>

### Exercise 12: setBreakpoint

<details><summary>Show solution</summary>

```r
# Set: setBreakpoint("myfile.R", line = 10)
# Clear: setBreakpoint("myfile.R", line = 10, clear = TRUE)
```

</details>

## What to do next

- **testthat-Exercises** (shipped) — catch bugs before they reach prod.
