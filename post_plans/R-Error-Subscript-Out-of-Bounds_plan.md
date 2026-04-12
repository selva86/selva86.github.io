# Plan: R Error: 'subscript out of bounds' — Find Which Index Is Wrong Instantly

## Frontmatter

| Field | Value |
|---|---|
| title | R Error: 'subscript out of bounds' — Find Which Index Is Wrong Instantly |
| slug | R-Error-Subscript-Out-of-Bounds |
| description | Fix R's 'subscript out of bounds' error fast. Learn to identify which index is wrong, add bounds checks, and use seq_along() to prevent off-by-one bugs. |
| keywords | R subscript out of bounds, R out of bounds error, R index error, R off by one error, seq_along R, R bounds checking, R indexing errors |
| auto_link_terms | subscript out of bounds\|R subscript error\|out of bounds error\|R index out of bounds\|subscript out of range |
| auto_link_case_sensitive | false |
| mathjax | false |
| webr | true |
| date | 2026-04-13 |
| curriculum_id | ERR2 |
| post_type | FR |
| fr_parent | R-Common-Errors.html |

Breadcrumb (auto-generated): Home > Learn R > R Errors & Debugging > R Error: 'subscript out of bounds' — Find Which Index Is Wrong Instantly

## Lead

`Error in x[[i]] : subscript out of bounds` means R tried to reach an element at a position that does not exist — the index is larger than the object's length, or the row/column is past a matrix's dimensions. This post shows how to find the bad index in ten seconds and how to prevent it from happening again.

## First H2 opening (payoff code appears here)

H2: "What does 'subscript out of bounds' actually mean?"

Opening prose (≤80 words): The error fires when `[[` or a matrix subscript asks for an index that isn't there. R raises it instead of silently returning `NA`, so you know something is wrong — but the message does not tell you *which* index is the culprit. The fastest way to learn the pattern is to trigger it on purpose and read the size of the object that rejected you.

Payoff block: Create a length-3 vector, ask for element 5 via `[[`, and catch the error with `tryCatch()`. Output shows the exact error message readers recognise.

## Core H2 sections

### H2 1: What does 'subscript out of bounds' actually mean?
- Tell-then-explain the error. Trigger it with `tryCatch` on `x[[5]]`.
- Code block 1 (payoff): Create `scores <- c(88, 92, 75)`, trigger error, print the message.
- Interpretation: explain that `[[` extracts exactly one element, so it cannot return `NA`. The error is R saying "that slot is empty."
- Callout: [KEY INSIGHT] — `[` is forgiving, `[[` is strict.
- Inline Try it: ask reader to trigger the error on a length-4 vector by requesting index 10.

### H2 2: Which operators and objects trigger this error?
- Show the three trigger modes: `[[` on vector/list, matrix `[row, col]`, data.frame `[row, col]`.
- Code block 2: Run the three triggers in a single block, each wrapped in `tryCatch`, printing each error.
- Interpretation: point out that `x[10]` (single bracket) returns NA silently — a common source of confusion.
- Callout: [WARNING] — bracket vs double-bracket difference is a top source of silent bugs.
- Inline Try it: reader builds a 2x2 matrix and triggers the error on row 3.

### H2 3: How do you find which subscript is wrong instantly?
- Present the diagnostic recipe: check `length()` or `dim()`, compare to your index, found it.
- Embed the diagram here: `![Diagnostic flowchart](screenshots/R-Error-Subscript-Out-of-Bounds-debug-flow.webp)` + caption.
- Code block 3: Write a `diagnose_subscript(x, i)` helper that prints length/dim and the offending index.
- Interpretation: readers learn to always print `length(x)` or `dim(x)` right before the failing line when debugging.
- Callout: [TIP] — `str(x)` is the one-line Swiss army knife.
- Inline Try it: reader writes a one-liner that prints `length(x)` and their attempted index side by side.

### H2 4: Why does `1:length(x)` cause off-by-one bugs?
- Show the classic empty-vector trap: `1:length(x)` becomes `1:0 = c(1, 0)` when `x` is empty.
- Code block 4: compare `1:length(empty)` vs `seq_along(empty)`; show a bad loop; show the `seq_along` fix.
- Interpretation: the empty case is the nastiest — unit-tested code passes until production hands you an empty vector.
- Callout: [TIP] — use `seq_along(x)` or `seq_len(length(x) - 1)` instead of `1:length(x)`.
- Inline Try it: reader rewrites a `1:length(x)` loop using `seq_along`.

### H2 5: How do you add bounds checks to prevent it?
- Show three prevention patterns: `if (i <= length(x))`, a `safe_get()` helper, and `purrr::pluck()` fallback.
- Code block 5: Write `safe_get(x, i, default)` that returns the default when `i` is out of range or `NA`.
- Interpretation: wrap risky indexing at the edges of your function — crash fast at known points rather than surprise failures deep inside.
- Callout: [NOTE] — `purrr::pluck()` is the tidyverse-native equivalent, safe for nested list indexing.
- Inline Try it: reader extends `safe_get` to also handle `NA` indices.

## Practice Exercises (capstone)

### Exercise 1: Fix a crashing pair-finder function
- medium; combines off-by-one loop and bounds check
- function `find_pairs(x, target)` uses `1:length(x)` nested loop; crashes on length-1 and empty vectors
- reader fixes with `seq_along` + length guard

### Exercise 2: Build a diagnostic wrapper
- hard; combines tryCatch + length/dim reporting
- wrap any R expression in `explain_bounds()` that catches the error and prints the object's shape + the failing index extracted from the call
- reader uses `sys.call()` / `match.call()` + a simple parser

## Complete Example: Safe row extraction from a data.frame

End-to-end function that extracts a row from a data.frame, returning a row of NAs if the index is out of bounds. Combines length check, NA handling, and `[[` safety.

## Summary

Table of causes → fixes (vector, list, matrix, off-by-one, NA index).

## References

1. R source — Subscript (bsubset.c) documentation
2. Wickham, H. — Advanced R, Subsetting chapter
3. R Core Team — Introduction to R, Indexing section
4. dplyr / tidyverse purrr::pluck() reference
5. Base R help: `?"[["`
6. Stack Overflow canonical: "What does 'subscript out of bounds' mean?"

## Continue Learning

1. R Common Errors (parent)
2. R Error: undefined columns selected
3. R Error: replacement has length zero

## Diagrams

| # | Filename | Figure N | Caption | Placed in H2 section |
|---|---|---|---|---|
| 1 | R-Error-Subscript-Out-of-Bounds-debug-flow.webp | Figure 1 | Three quick checks that reveal the bad subscript. | How do you find which subscript is wrong instantly? |

## Code block master list

| Block # | Demonstrates | Libs | Vars introduced | Vars used (from prior) |
|---|---|---|---|---|
| 1 | Trigger error with `[[` on short vector | — | `scores` | — |
| 2 | Three trigger modes: vector, matrix, data.frame | — | `nums`, `mat`, `df` | — |
| 3 | `diagnose_subscript(x, i)` helper | — | `diagnose_subscript` | `scores`, `mat` |
| 4 | `1:length(x)` vs `seq_along(x)` empty-vector trap | — | `empty`, `safe_loop` | — |
| 5 | `safe_get(x, i, default)` helper | — | `safe_get` | `scores` |
| 6 | Inline try-it scaffolds (5 blocks) | — | `ex_*` vars | various |
| 7 | Capstone Ex1: fixed `find_pairs` | — | `my_pairs` | — |
| 8 | Capstone Ex2: `explain_bounds` wrapper | — | `explain_bounds` | — |
| 9 | Complete example: `safe_row(df, i)` | — | `safe_row` | — |
