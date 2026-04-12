# Plan: Debugging R: The Complete Toolkit — From traceback() to RStudio Breakpoints

## A. Frontmatter

| Field | Value |
|---|---|
| title | Debugging R: The Complete Toolkit — From traceback() to RStudio Breakpoints |
| slug | R-Debugging |
| description | Debug R code systematically: use traceback() to locate errors, browser() to pause mid-function, debug() to step through, and RStudio breakpoints visually. |
| keywords | R debugging, traceback in R, browser in R, debug() R, debugonce, options error recover, RStudio breakpoints, R debugger, step through R code |
| auto_link_terms | R debugging\|debug R code\|traceback()\|browser()\|debug()\|debugonce()\|options(error=recover)\|RStudio breakpoints |
| auto_link_case_sensitive | false |
| mathjax | false |
| webr | true |
| date | 2026-04-13 |
| curriculum_id | 4.1.8 |
| post_type | C |
| sidebar_section | Advanced R |
| sidebar_title | Debugging R Code |
| sidebar_order | 27 |
| fr_parent | (none) |

## B. Breadcrumb
Home > Learn R > How R Works Under the Hood > Debugging R Code

## C. Section Outline

### Lead (featured snippet)
Debugging R is the process of locating, inspecting, and fixing code that produces errors or wrong results. R gives you four core tools — `traceback()` to find where a failure happened, `browser()` to pause and inspect state, `debug()` to step through a function line by line, and RStudio's visual debugger for a point-and-click workflow — and this article teaches you when to reach for each.

### H2.1 — "What's the 3-step debugging workflow in R?" (first core; motivation + payoff)

**Opening prose (≤80 words):** Every debugging session answers three questions in order: *where* did the code fail, *what* was the state at that moment, and *why* was that state wrong? Flailing means tweaking code before you know where it broke. The R toolkit — `traceback()`, `browser()`, `debug()`, RStudio breakpoints — exists to answer those three questions systematically. Here's the whole loop on a one-line bug.

**Code block 1 (payoff):** `weighted_mean(values, weights)` returns `NA` because one input has an `NA`. The block shows the broken call, the observed result, a one-line diagnosis, and the fix (`na.rm`-aware version) producing the correct 23.33333. Immediate "aha": the reader sees the whole workflow in 15 lines.

**Inline exercise 1:** Reader fixes `ex_is_adult(age)` that compares a character input against `18` and silently returns `FALSE` for a digit string.

**Diagram:** `R-Debugging-workflow.webp` (Figure 1) placed at the END of this section — locate → inspect → fix loop. Must come after the first code block per the "no figures above the first code block" rule.

**Callout:** `[KEY INSIGHT]` — Fixing code before you've located the failure wastes time on guesses; the toolkit forces order.

---

### H2.2 — "How does traceback() show where an error happened?"

Explain the call stack with a concrete three-function chain (`run` → `process` → `validate`). Read traceback output bottom-up: the bottom is where *you* started, the top is where R *stopped*. Cover the `at #N` line-number annotation, and the subtlety that `traceback()` shows the most recent error — so run it *immediately* after the failure.

- **Block 2:** `validate(x)`, `process(x)`, `run(x)`. Trigger the error via `tryCatch()`, capturing `sys.calls()` so the block is runnable in WebR, then show what an interactive `traceback()` call would print alongside.
- **Block 3:** Same chain, but the bug is deeper — a bad index `x[[k]]`. Reader sees how `traceback()` points at `validate()`, not `run()`, and learns to read the stack as a map.

**Diagram:** `R-Debugging-call-stack.webp` (Figure 2) — nested boxes showing the call stack at the moment of error, matched to the `traceback()` output.

**Inline exercise 2:** Reader is given a 4-line traceback output and asked to name the bottom-most user function they should inspect first.

**Callout:** `[TIP]` — In non-interactive contexts (scripts, WebR, Rmd knit), use `tryCatch(..., error = function(e) sys.calls())` to capture the same information.

---

### H2.3 — "How does browser() let you pause and inspect?"

Introduce `browser()` as a "checkpoint" you drop into code. When R hits it, the prompt changes to `Browse[1]>` and you can run any R expression in that local environment. Cover the five single-letter commands (`n`, `s`, `f`, `c`, `Q`) and `where` / `ls()`.

- **Block 4:** A function `summarize_budget(df)` with `browser()` commented near a suspicious line. Walk through what each command does with a simulated `Browse[1]>` transcript shown in comments. Since `browser()` needs an interactive session, the block itself runs the function without the pause and compares results.
- **Block 5:** Conditional `browser()` — only pause if `is.na(total)` — to stop on the *interesting* iteration in a loop without drowning in noise.

**Inline exercise 3:** Reader is given `ex_compute_bmi()` with a wrong formula and must insert a conditional `browser()` in the correct spot (they don't execute it; they produce the line).

**Callout:** `[WARNING]` — Never commit `browser()` calls. They're silent in `Rscript` but freeze an interactive session for your teammates.

**Callout:** `[NOTE]` — `browser()` is interactive-only. Inside WebR or batch runs, use `print()`/`cat()` checkpoints or capture state with `sys.frame()` inside an error handler.

---

### H2.4 — "How do debug() and debugonce() step through a function?"

`debug(fn)` marks `fn` so every subsequent call pauses at line 1. `debugonce(fn)` does it exactly once. `undebug(fn)` unmarks. Use `debugonce()` 95% of the time — it's self-cleaning.

- **Block 6:** `discount_price(price, pct)`. Call `debugonce(discount_price)`, then call the function. Show the simulated transcript of `Browse[2]> n` stepping line-by-line. The block itself runs the function to show the buggy output so the reader has something concrete to compare against.
- **Block 7:** `isdebugged(fn)` to check a mark, `undebug()` to clear it, and the danger of `debug()` without `undebug()` (every future call pauses — easy to forget).

**Inline exercise 4:** Reader predicts which of three function calls will pause after `debugonce(my_fn)` is run.

**Callout:** `[TIP]` — `debugonce()` is safer than `debug()` because you can't forget to `undebug()`.

---

### H2.5 — "How does options(error = recover) catch errors automatically?"

`options(error = recover)` installs a global error handler. When *any* error occurs, R prints the call stack and asks "which frame do you want to inspect?" — letting you walk into any function on the stack post-mortem.

- **Block 8:** Set `options(error = recover)`, trigger an error in the `run → process → validate` chain, show the simulated recover prompt with frame list, and the `Browse[1]> ls()` inside frame 2. Reset with `options(error = NULL)`.
- **Block 9:** Post-mortem via `dump.frames()` + `debugger()` — the non-interactive variant that saves the crash state to a file for later inspection, useful for long-running batch scripts. Runnable in WebR.

**Inline exercise 5:** Reader writes the single `options()` line that would auto-dump frames to a file named `last.dump` on every error.

**Callout:** `[KEY INSIGHT]` — `recover` turns "my code crashed — now what?" into "let me poke around the moment it crashed."

---

### H2.6 — "How do you use RStudio's visual debugger and breakpoints?"

RStudio wraps the same primitives in a GUI. Click in the editor margin (or press Shift+F9) to set a breakpoint — it acts like `browser()` but lives outside your source, so no accidental commits. When execution pauses, the Environment pane shows all local variables and the Traceback pane shows the call stack; the toolbar gives Next / Step Into / Finish / Continue / Stop. After an error, the "Rerun with Debug" button replays the call with `debug()` auto-set.

- **Block 10:** A function the reader can imagine setting a breakpoint inside. Table the toolbar buttons against their keyboard shortcuts and `browser()` equivalents.

**Inline exercise 6:** Given a symptom ("function returns NA unexpectedly"), reader picks which RStudio button they'd click after hitting the breakpoint to inspect the bad value.

**Callout:** `[TIP]` — Breakpoints survive across sessions (RStudio stores them per file). `browser()` calls don't — they vanish when you close the file.

---

### H2.7 — "How do you debug inside lapply(), purrr::map(), and loops?"

The painful case: a pipeline over 10 000 rows crashes on element 7 423. Stepping through isn't practical. Two patterns save you.

- **Block 11:** Wrap the mapper in `tryCatch()` to return `NULL` on failure and tag the element. Scan the output for `NULL`s or a `errors` list. Runnable.
- **Block 12:** `purrr::safely()` — the idiomatic version: returns a list of `result` / `error` components per element. Runnable (purrr is WebR-safe).
- **Block 13:** Conditional `browser()` inside the mapper so it only pauses on the problematic element, not every one.

**Inline exercise 7:** Reader wraps `ex_parser(lines)` with `purrr::safely()` so a malformed line doesn't kill the batch.

**Callout:** `[WARNING]` — Plain `browser()` inside `lapply()` pauses for *every* element. Conditional is mandatory or use `safely()`.

---

## Tail sections

### Practice Exercises (capstone, 3 exercises)

1. **Exercise 1 (medium) — Locate and fix:** Given a three-function chain with a real bug (`merge_reports(new, old)` where `new[[field]]` should be `new[[i, field]]`), use `traceback()` / `sys.calls()` pattern to identify the failing frame and ship a corrected version. Expected output: merged data frame.
2. **Exercise 2 (medium-hard) — Conditional pause:** Write `find_bad_row(df, predicate)` that iterates `df`'s rows and uses a conditional-browser pattern (simulated via an error-handler trick in WebR) to flag the first row matching `predicate`. Return the row index.
3. **Exercise 3 (hard) — Resilient map:** Build `robust_apply(xs, fn)` that runs `fn` on every element of `xs`, collecting successes and errors into `list(results = ..., errors = ...)` with the original indices preserved. Must work even when 90% of elements fail.

### Complete Example — "Tracking a silent bug through a data pipeline"

Build `grade_students(records)` that computes pass/fail per student from a list of records. Seed it with a realistic bug: one record has `score = "A"` (string) while others are numeric. The pipeline returns all-`FALSE` with no warning. Walk through:
1. Notice the symptom (everyone failing).
2. Add `tryCatch(sys.calls())` to capture the stack — confirms `validate_score()` is the failing frame.
3. Insert a conditional pause (`if (!is.numeric(score)) browser()` pattern, simulated via capture).
4. Inspect: `score = "A"`, which coerces to `NA` → `NA >= 60` is `NA` → `ifelse()` returns `"Fail"`.
5. Ship the fix: strict input validation at the boundary.

Runs the fixed version end-to-end and prints the pass/fail summary.

### Summary

Table of debugging tools with "symptom → tool" decision guidance.

| Symptom | Reach for | Works in WebR? |
|---|---|---|
| "Where did it blow up?" | `traceback()` / `sys.calls()` | ✓ (via tryCatch) |
| "What's in x right now?" | `browser()` / RStudio breakpoint | ✗ (interactive only) |
| "Step through this one function" | `debugonce(fn)` | ✗ |
| "I want the state on *any* error" | `options(error = recover)` | ✗ |
| "Save the crash for later" | `dump.frames()` + `debugger()` | ✓ |
| "One element in lapply() blows up" | `tryCatch()` per element or `purrr::safely()` | ✓ |
| "Visual, click-driven workflow" | RStudio breakpoints + Environment pane | n/a |

**Diagram:** `R-Debugging-tool-decision.webp` (Figure 3) — decision tree mapping symptoms to tools. Placed in Summary.

**Takeaways (bullet list, 4-5 items):** locate first, then inspect, then fix; prefer `debugonce()` over `debug()`; use `tryCatch()`/`safely()` for loops; set `options(error = recover)` before long batches; breakpoints beat scattered `browser()` calls.

### References

1. Wickham, H. — *Advanced R*, 2nd Edition. Chapter 22: Debugging. https://adv-r.hadley.nz/debugging.html
2. Posit / RStudio — "Debugging with the RStudio IDE". https://support.posit.co/hc/en-us/articles/205612627-Debugging-with-the-RStudio-IDE
3. Posit — RStudio User Guide, Debugging. https://docs.posit.co/ide/user/ide/guide/code/debugging.html
4. Grolemund, G. — *Hands-On Programming with R*, Appendix E: Debugging R Code. https://rstudio-education.github.io/hopr/debug.html
5. Bryan, J. & Hester, J. — *What They Forgot to Teach You About R*, Ch 12: Debugging R code. https://rstats.wtf/debugging-r
6. R base documentation — `browser`, `debug`, `traceback`, `recover`. https://stat.ethz.ch/R-manual/R-devel/library/base/html/browser.html
7. `purrr::safely()` reference. https://purrr.tidyverse.org/reference/safely.html

### Continue Learning

- *R's Condition System* (4.1.7) — signal and handle errors before they become bugs.
- *50 Common R Errors* — the catalogue of R error messages you'll see in `traceback()` output.
- *R Execution Stack* — deeper dive into `sys.call()`, `parent.frame()` and how the call stack you traceback through is actually built.

## D. Diagram list

| # | Filename | Figure N | Caption | Placed in H2 section |
|---|---|---|---|---|
| 1 | R-Debugging-workflow.webp | Figure 1 | The 3-step debugging loop: locate the failure, inspect the state, fix and verify. | What's the 3-step debugging workflow in R? |
| 2 | R-Debugging-call-stack.webp | Figure 2 | traceback() reads the call stack bottom-up: where you started at the bottom, where R stopped at the top. | How does traceback() show where an error happened? |
| 3 | R-Debugging-tool-decision.webp | Figure 3 | Pick the right debugging tool based on the symptom you're seeing. | Summary |

## E. Code block master list

| # | Demonstrates | Libs | Vars introduced | Vars used (from prior) |
|---|---|---|---|---|
| 1 | Payoff: weighted_mean bug + fix | — | weighted_mean, values, weights, weighted_mean_safe | — |
| 2 | Inline ex 1 starter: ex_is_adult scaffold | — | ex_is_adult (scaffold) | — |
| 3 | Inline ex 1 solution | — | ex_is_adult (final) | — |
| 4 | traceback chain via sys.calls + simulated output | — | validate, process, run | — |
| 5 | Bad-index bug + traceback re-read | — | inner_validate | — |
| 6 | Inline ex 2 starter (read-a-traceback) | — | — | — |
| 7 | Inline ex 2 solution | — | — | — |
| 8 | browser() checkpoint in summarize_budget + Browse transcript | — | summarize_budget, budget | — |
| 9 | Conditional browser() inside a loop | — | scan_values | — |
| 10 | Inline ex 3 starter: ex_compute_bmi scaffold | — | ex_compute_bmi | — |
| 11 | Inline ex 3 solution | — | ex_compute_bmi (fixed) | — |
| 12 | debugonce() transcript for discount_price | — | discount_price | — |
| 13 | isdebugged / undebug pitfall | — | — | discount_price |
| 14 | Inline ex 4 starter (predict pause) | — | — | — |
| 15 | Inline ex 4 solution | — | — | — |
| 16 | options(error=recover) simulated session | — | — | run, process, validate |
| 17 | dump.frames + debugger post-mortem (runnable) | — | — | — |
| 18 | Inline ex 5 starter (write the options line) | — | — | — |
| 19 | Inline ex 5 solution | — | — | — |
| 20 | RStudio breakpoint walkthrough + toolbar table | — | deduct_tax | — |
| 21 | Inline ex 6 starter (pick the button) | — | — | — |
| 22 | Inline ex 6 solution | — | — | — |
| 23 | tryCatch per element pattern in lapply | — | risky, results_try | — |
| 24 | purrr::safely() pattern | `purrr` | safe_risky, results_safe | risky |
| 25 | Conditional browser() inside a mapper | — | — | risky |
| 26 | Inline ex 7 starter: ex_parser + safely | — | ex_parser (scaffold) | — |
| 27 | Inline ex 7 solution | — | ex_parser (final) | — |
| 28 | Capstone Exercise 1 starter | — | merge_reports | — |
| 29 | Capstone Exercise 1 solution | — | — | merge_reports |
| 30 | Capstone Exercise 2 starter | — | find_bad_row | — |
| 31 | Capstone Exercise 2 solution | — | — | find_bad_row |
| 32 | Capstone Exercise 3 starter | — | robust_apply | — |
| 33 | Capstone Exercise 3 solution | `purrr` | — | robust_apply |
| 34 | Complete Example: grade_students end-to-end | — | grade_students, records, grade_result | — |

Rules validated: `library(purrr)` introduced at block 24 (first use). Every "Vars used" references an earlier "Vars introduced". The only cross-section reuse is the `run/process/validate` chain from H2.2 reappearing in H2.5 block 16, which is intentional — it's the same concrete example used to show two different tools.
