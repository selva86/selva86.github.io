# Plan: R's Condition System: Handle Errors, Warnings & Messages Like a Pro

## A. Frontmatter

| Field | Value |
|---|---|
| title | R's Condition System: Handle Errors, Warnings & Messages Like a Pro |
| slug | R-Conditions-System |
| description | Master R's condition system: signal with stop(), warning(), message(); handle via tryCatch() and withCallingHandlers(); design custom condition classes. |
| keywords | R condition system, tryCatch in R, withCallingHandlers, R error handling, R custom conditions, stop() R, warning() R, message() R |
| auto_link_terms | R condition system\|tryCatch()\|withCallingHandlers()\|custom conditions\|R error handling\|errorCondition()\|invokeRestart() |
| auto_link_case_sensitive | false |
| mathjax | false |
| webr | true |
| date | 2026-04-13 |
| curriculum_id | 4.1.7 |
| post_type | C |
| sidebar_section | Learn R |
| sidebar_title | R's Condition System |
| sidebar_order | 33 |
| fr_parent | (none) |

## B. Breadcrumb
Home > Learn R > How R Works Under the Hood > R's Condition System

## C. Section Outline

### Lead (featured snippet)
R's condition system is the mechanism R uses to signal and handle errors, warnings, and messages during program execution. Unlike simple `try/catch` in other languages, it lets you choose between aborting, resuming, or inspecting code at the exact moment something unusual happens.

### H2.1 — "Why do you need R's condition system at all?" (first core; motivation + payoff)
**Opening prose (≤80 words):** Imagine a loop that processes a thousand rows and crashes on row 43. Without a condition handler, you lose the other 957 results. With one, you keep working and log the bad row. R's condition system is how you decide—per signal, per line—whether a problem should stop you, warn you, or just be noted. Let's see the difference on a tiny budget calculator.

**Code block 1 (payoff):** `safe_divide()` that signals `stop()` on zero denominator, wrapped in a `tryCatch()` that returns `NA` and keeps a loop running. Output shows the loop completing with NAs for bad inputs—immediate "aha".

**Inline exercise 1:** Reader writes `ex_safe_log()` that returns `NA` for zero or negative inputs via `tryCatch()`.

**Callout:** `[KEY INSIGHT]` — Conditions decouple *signaling* a problem from *deciding what to do* about it.

---

### H2.2 — "How do message(), warning(), and stop() differ?"
Covers the three signal functions, severity levels, where they print, and what they return.

- Block 2: `message()` — prints informational text; function continues.
- Block 3: `warning()` — prints "Warning message:"; function continues but flags that something is off.
- Block 4: `stop()` — aborts execution, caller decides whether to handle.

Diagram: `R-Conditions-System-signal-severity.webp` (Figure 1) — severity ladder.
**Inline exercise 2:** Reader writes `ex_check_age(age)` that uses `message()` for under-18, `warning()` for 80+, `stop()` for negative.

**Callout:** `[NOTE]` — `message()` writes to stderr, not stdout; it won't land in a captured value.

---

### H2.3 — "How does tryCatch() catch errors and warnings?"
Introduces `tryCatch()` as the go-to exiting handler. Covers:
- Block 5: catch error, return default.
- Block 6: catch warning separately from error.
- Block 7: `finally` for always-run cleanup.

Explain that handlers exit the protected expression—code after the signal inside the block never runs.

**Inline exercise 3:** Reader writes a `tryCatch()` that returns 0 on error and logs a message on warning.

**Callout:** `[TIP]` — Order matters: list `error` handler after `warning` so a warning doesn't get caught as the generic "condition".

---

### H2.4 — "When should you use withCallingHandlers() instead?"
The pivotal section. Explain calling vs exiting handlers with an everyday analogy (car alarm that beeps vs alarm that kills the engine).

- Block 8: `withCallingHandlers()` logs every warning but lets the function finish naturally.
- Block 9: `invokeRestart("muffleWarning")` to log *and* silence.

Diagram: `R-Conditions-System-handler-flow.webp` (Figure 2) — exit vs resume.

**Inline exercise 4:** Reader uses `withCallingHandlers()` to count how many warnings a function raises while it still returns its result.

**Callout:** `[WARNING]` — A calling handler can't "fix" an error and resume; errors still unwind unless you also pair it with `tryCatch()` at an outer layer.

---

### H2.5 — "How do you build custom condition classes?"
Why plain strings aren't enough (you can't match on them reliably). Introduce S3 classes for conditions.

- Block 10: `errorCondition()` to construct a classed error with structured fields (a `bad_input_error` class carrying `field`, `value`).
- Block 11: `tryCatch()` dispatching on the custom class so only that specific error is handled.

**Inline exercise 5:** Reader writes `my_timeout_error()` that constructs a condition of class `timeout_error` with an `elapsed` field.

**Callout:** `[KEY INSIGHT]` — Classing conditions turns error handling from string-matching into type-matching.

---

## Tail sections

### Practice Exercises (capstone, 2 exercises)
1. **Exercise 1 (medium):** Write `robust_mean(x)` that returns the mean of a numeric vector, but uses `tryCatch()` to return `NA_real_` if `x` is empty or non-numeric, and uses `withCallingHandlers()` to log any warning (e.g., from `mean()` on NAs).
2. **Exercise 2 (hard):** Build `validate_user(name, age)` that raises a custom `validation_error` (classed) with fields `field` and `reason` when inputs are invalid. Show a caller that uses `tryCatch()` with class-based dispatch to pretty-print the error.

### Complete Example — "A robust CSV-like loader"
Build `safe_loader(records)` that:
- Iterates a list of "records" (named lists simulating CSV rows)
- Uses `withCallingHandlers()` to log every warning
- Uses `tryCatch()` with a custom `row_parse_error` to skip bad rows, keeping a running list of errors
- Returns `list(data = ..., errors = ...)`

Runs over a hand-built sample, prints the summary.

### Summary
Table of:
| Function | Purpose | Stops execution? | Use for |
| --- | --- | --- | --- |
| `message()` | Informational | No | Progress notices |
| `warning()` | Problem, recoverable | No | Silent bugs you want to surface |
| `stop()` | Error | Yes | Unrecoverable problems |
| `tryCatch()` | Exiting handler | Unwinds stack | Replace / recover |
| `withCallingHandlers()` | Calling handler | Resumes | Log / count / audit |
| `errorCondition()` | Build a classed condition | — | Structured, typed errors |

Diagram: `R-Conditions-System-overview-mindmap.webp` (Figure 3) — full system at a glance.

### References
1. Wickham, *Advanced R* 2e, Chapter 8: Conditions — https://adv-r.hadley.nz/conditions.html
2. R base `conditions` help — https://stat.ethz.ch/R-manual/R-devel/library/base/html/conditions.html
3. rlang `abort()` reference — https://rlang.r-lib.org/reference/abort.html
4. Peng, *Mastering Software Development in R*, §2.5 — https://bookdown.org/rdpeng/RProgDA/error-handling-and-generation.html
5. CRAN vignette — tryCatchLog — https://cran.r-project.org/web/packages/tryCatchLog/vignettes/tryCatchLog-intro.html
6. Advanced R Solutions, Ch. 8 — https://advanced-r-solutions.rbind.io/conditions
7. Beyond Exception Handling: Conditions and Restarts (Peter Seibel, ported to R) — http://adv-r.had.co.nz/beyond-exception-handling.html

### Continue Learning
- *R Functions* — anatomy of functions where conditions get signaled
- *Debugging in R* — traceback, browser, recover
- *S3 Classes in R* — the class system custom conditions build on

## D. Diagram list

| # | Filename | Figure N | Caption | Placed in H2 section |
|---|---|---|---|---|
| 1 | R-Conditions-System-signal-severity.webp | Figure 1 | message(), warning(), and stop() form a ladder of increasing severity; all three can be handled. | How do message(), warning(), and stop() differ? |
| 2 | R-Conditions-System-handler-flow.webp | Figure 2 | tryCatch() unwinds the stack and returns; withCallingHandlers() runs the handler and resumes. | When should you use withCallingHandlers() instead? |
| 3 | R-Conditions-System-overview-mindmap.webp | Figure 3 | The full condition system at a glance: signals, handlers, and custom classes. | Summary |

## E. Code block master list

| # | Demonstrates | Libs | Vars introduced | Vars used (from prior) |
|---|---|---|---|---|
| 1 | Payoff: safe_divide signals + tryCatch + loop survives | — | safe_divide, divisors, results | — |
| 2 | message() is informational | — | — | — |
| 3 | warning() flags a problem, execution continues | — | — | — |
| 4 | stop() aborts | — | — | — |
| 5 | tryCatch error branch returns default | — | parse_positive | — |
| 6 | tryCatch warning branch separately | — | — | parse_positive |
| 7 | tryCatch finally cleanup | — | — | — |
| 8 | withCallingHandlers logs warnings and resumes | — | noisy_sum, warn_log | — |
| 9 | invokeRestart muffleWarning to silence + log | — | — | — |
| 10 | errorCondition with custom class bad_input_error | — | bad_input_error | — |
| 11 | tryCatch dispatch on custom class | — | — | bad_input_error |
| 12 | Capstone Exercise 1 solution: robust_mean | — | (ex_) | — |
| 13 | Capstone Exercise 2 solution: validate_user | — | (ex_) | — |
| 14 | Complete Example: safe_loader end-to-end | — | safe_loader, records, loader_result | — |

Rules validated: no `library()` needed (all base R). Every "Vars used" carries from prior block.
