---
title: "Plan: R Error: could not find function"
slug: "R-Error-Function-Not-Found"
curriculum_id: "ERR10"
post_type: "FR"
---

# Plan — R Error: 'could not find function'

## A. Frontmatter

| Field | Value |
|---|---|
| title | R Error: 'could not find function' — Package Not Loaded or Name Conflict? |
| slug | R-Error-Function-Not-Found |
| description | Fix R's 'could not find function' error: check if the package is loaded, detect masked functions, and use package::function() to resolve namespace conflicts. |
| keywords | R could not find function, R function not found, R package not loaded, R namespace conflict, R masked function, R search path, R library error |
| auto_link_terms | could not find function\|function not found\|could not find function error\|masked function in R\|function masking\|R namespace conflict |
| auto_link_case_sensitive | false |
| mathjax | false |
| webr | true |
| date | 2026-04-13 |
| curriculum_id | ERR10 |
| post_type | FR |
| fr_parent | R-Common-Errors.html |

## B. Breadcrumb (auto-generated)

Home > Learn R > Common Errors > R Error: 'could not find function'

## C. Outline

**Lead sentence:** Explains that the error means R searched every loaded package and the global environment without finding a function by that name, and names the three common fixes (load the package, use `::`, or correct a masked/mistyped name).

**First H2 opening plan (~60 words):** Frame the error as a search-path failure. Tell the reader we'll first *reproduce* the error on purpose, catch it with `tryCatch()`, and then inspect R's actual search path with `search()` so the message stops feeling mysterious. No history, no preamble.

### Core H2 sections (5, all question-form)

**H2-1: What does "could not find function" actually mean?**
- Theory: R looks up names by walking the search path — global env, then each loaded package in load order, then base. If nothing along that path defines the name, you get this error.
- Code block 1 (PAYOFF): reproduce the error with `tryCatch()` on a made-up function name, print the condition message, then show `search()` so the reader sees the actual chain R walked.
- Inline exercise: use `search()` to count how many packages are currently on the path (`ex_n_pkgs`).
- Callout: [KEY INSIGHT] about the search path being a chain, not a bag.

**H2-2: How do I find which package a function belongs to?**
- Theory: `find()`, `getAnywhere()`, `apropos()` for partial matches.
- Code block 2: `find("mean")`, `find("lm")`, `getAnywhere("lowess")` to show package attribution.
- Inline exercise: call `find()` on `"sd"` and save the result to `ex_sd_pkg`.
- Callout: [TIP] use `??name` or `help.search("name")` when you don't even know the function name.

**H2-3: Why does loading one package break a function from another?**
- Theory: masking — when two packages export the same name, the later-loaded one wins. Existing code that relied on the earlier one suddenly fails or changes behavior.
- Code block 3: simulate masking in base R by defining a local `mean <- function(x) "oops"`, call `mean(1:5)`, then recover with `base::mean(1:5)` and `rm(mean)`.
- Inline exercise: shadow `sum()` with a local broken version and recover with `base::sum()` (`ex_total`).
- Callout: [WARNING] about silent masking — R prints masked notices only when the package loads, and they scroll off screen.

**H2-4: When should I use package::function() instead of library()?**
- Theory: double-colon accesses exported functions without loading the package; triple-colon `:::` reaches internal functions (discouraged).
- Code block 4: call `stats::median(c(3, 1, 4, 1, 5, 9))`, `utils::head(mtcars, 3)`, and show the error form when the package is not installed (`tryCatch` around a namespace that doesn't exist).
- Inline exercise: write `ex_mt_rows <- base::nrow(mtcars)`.
- Callout: [NOTE] about `::` making scripts self-documenting and robust to load order.

**H2-5: What's a fast debug checklist when the error hits?**
- Theory: a 5-step triage — spelling, installed, loaded, masked, renamed in newer version.
- Code block 5: utility helpers — `exists("mean", mode = "function")`, `"stats" %in% loadedNamespaces()`, `"stats" %in% rownames(installed.packages())`, `apropos("^read\\.")`.
- Inline exercise: check if `tibble` is in `loadedNamespaces()` and save to `ex_has_tibble`.
- Callout: [TIP] keep `::` in scripts you share — it removes ambiguity for the next reader.

### Tail sections

**## Practice Exercises** (2 capstones, medium + hard)

1. *Exercise 1 (medium) — Write a diagnose function.* Build `dx_missing(name)` that takes a function name (string) and returns a character vector: the first element is a verdict (`"ok"`, `"misspelled?"`, `"not installed"`, or `"installed but not loaded"`), and the remaining elements are up to 5 near-miss candidates from `apropos()`. Test on `"Read.csv"`, `"mean"`, `"zzz_nope"`.
2. *Exercise 2 (hard) — Masking detector.* Write a function `mask_check(fn_name)` that returns every package currently on `search()` that exports a function with that name, using `getAnywhere()`. Test it on `"filter"` after defining a local `filter <- function(x) head(x, 3)`. Expected: a character vector including `".GlobalEnv"` and `"package:stats"`.

Variable names prefixed with `my_` (not `ex_`) to stay distinct from inline `ex_` names.

**## Complete Example: Debugging a broken script end-to-end**
- Walk through a reader's script that hits the error: fails on `filter(mtcars, mpg > 25)`, they run `find("filter")` (sees `package:stats`), discover they meant dplyr's version, fix with `stats::filter(mtcars, mpg > 25)` — wait, that's the wrong one — and finally settle on `dplyr::filter(mtcars, mpg > 25)`. The vignette shows the full reasoning chain including the wrong fix.
- Code blocks: 2 small blocks — the diagnosis and the final fix.

**## Summary** — 5-row table: Cause | How to detect | Fix.

**## References** (6 items):
1. R Language Definition — chapter 5 "Environments" (cran.r-project.org)
2. Wickham, H. *Advanced R*, 2e — Environments (adv-r.hadley.nz/environments.html)
3. R documentation: `?find`, `?apropos`, `?search`, `?conflicts` (rdrr.io)
4. Writing R Extensions — section 1.6 "Package namespaces" (cran.r-project.org)
5. tidyverse blog — "Loading packages and masking" (tidyverse.org)
6. Stack Overflow canonical Q: "Error: could not find function" (stackoverflow.com/q/7027288)

**## Continue Learning** (3 items):
1. R Common Errors — full error reference (parent)
2. R Error: object 'x' not found — the other "not found" error
3. R Functions — how R defines and resolves functions

## D. Diagrams

FR post — no diagrams planned.

## E. Code block master list

| Block # | Demonstrates | Libs | Vars introduced | Vars used (prior) |
|---|---|---|---|---|
| 1 | Reproduce error + show search path | — | — | — |
| 1b (inline try-it reveal) | Count path length | — | ex_n_pkgs | — |
| 2 | find() / getAnywhere() attribution | — | — | — |
| 2b (inline try-it reveal) | find("sd") | — | ex_sd_pkg | — |
| 3 | Masking demo via local shadow | — | — | — |
| 3b (inline try-it reveal) | Shadow + recover sum | — | ex_total | — |
| 4 | :: namespace access + missing pkg | — | — | — |
| 4b (inline try-it reveal) | ex_mt_rows | — | ex_mt_rows | — |
| 5 | Debug utility helpers | — | — | — |
| 5b (inline try-it reveal) | loadedNamespaces check | — | ex_has_tibble | — |
| 6 | Capstone 1: dx_missing() | — | dx_missing, my_dx | — |
| 7 | Capstone 2: mask_check() | — | mask_check, my_mask | — |
| 8 | Complete example: diagnose | — | my_bad | — |
| 9 | Complete example: fix | — | my_fixed | my_bad |

All blocks use base R only — no `library()` calls needed, no WebR compatibility risk.
