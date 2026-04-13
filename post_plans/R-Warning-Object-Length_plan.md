# Plan: R Vector Recycling Warning

## Frontmatter

| Field | Value |
|---|---|
| title | R Vector Recycling Warning: When R Silently Gives You the Wrong Answer |
| slug | R-Warning-Object-Length |
| description | R warns "longer object length is not a multiple of shorter object length" when recycling hits uneven lengths. Learn when it is safe and how to fix it. |
| keywords | R vector recycling, longer object length warning, R warning object length, R recycling rule, R vector length mismatch, R vectorized operations |
| auto_link_terms | longer object length\|not a multiple of shorter\|vector recycling\|R recycling rule\|recycling warning |
| auto_link_case_sensitive | false |
| mathjax | false |
| webr | true |
| date | 2026-04-13 |
| curriculum_id | ERR14 |
| post_type | FR |
| fr_parent | R-Common-Errors.html |

Breadcrumb: Home > Learn R > R Errors > R Vector Recycling Warning

## Lead sentence

> The R warning `longer object length is not a multiple of shorter object length` fires when a vectorized operation pairs two vectors and the shorter one cannot divide evenly into the longer one. R still runs the operation by **recycling** the shorter vector — repeating its values from the top — but the result is almost always wrong.

## First H2 opening plan (≤80 words)

Heading: **What does "longer object length is not a multiple of shorter object length" mean?**

Opening prose (~60 words):
> You see this warning whenever R tries to line up two vectors of unequal length for a pairwise operation — `+`, `*`, `==`, `ifelse()`, and so on — and the shorter vector's length is not a clean divisor of the longer one's. R does **not** stop. It finishes the calculation, hands you a result, and hopes you noticed the warning.

Payoff code block: reproduce the warning with `c(1, 2, 3, 4, 5) + c(10, 20)` and show the silent "wrong" output (11, 22, 13, 24, 15).

## Core content outline

### H2 1: What does "longer object length is not a multiple of shorter object length" mean?
- Payoff code: `x + y` with length 5 + length 2, show recycled pattern and warning.
- Interpretation: map each result to the recycle step.
- Inline try-it: change y to length 3 and predict the result.
- Callout: NOTE (optional): warning message text is identical across base R, tidyverse ops that delegate to vctrs, and some Rcpp wrappers.

### H2 2: Why does R recycle shorter vectors at all?
- Prose: recycling is a design feature, inherited from S. It lets you write `prices * 1.1` or `matrix - col_means` without `rep()`.
- Code: three clean examples — scalar recycle (no warning), length-6 + length-3 (no warning), length-5 + length-2 (warning).
- Callout: KEY INSIGHT — recycling is fine when the short vector's length divides evenly into the long one. The warning only fires at the "jagged edge."
- Inline try-it: build a vector of 8 prices and a 4-element tax vector; confirm no warning.

### H2 3: When does recycling silently corrupt your results?
- Setup: the 12-months-and-4-quarters trap. Length 12 is a multiple of 4, so R issues **zero** warnings — and silently repeats Q1 across the entire year.
- Code: `months <- month.name; revenue <- c(100, 120, 115, 130); data.frame(month = months, revenue = revenue)` shows repeated Q1 in Q2-Q4.
- Callout: WARNING — the dangerous case is not the warning; it is the clean multiple that produces garbage without any warning at all.
- Inline try-it: spot the bug in a short snippet pairing a 10-row tibble with a 5-element vector.

### H2 4: How do you fix the warning without breaking your pipeline?
- Four fix patterns, each with a code example:
  1. **Length check first** — `stopifnot(length(x) == length(y))` to fail fast.
  2. **Pad with NA** — `c(NA, diff(values))` when a function returns a shorter vector.
  3. **Trim the longer side** — `values[-1]` to align diff output.
  4. **Use `rep()` deliberately** — when you genuinely want to repeat a short vector.
- Callout: TIP — prefer `stopifnot()` at the top of any function that does vectorized math on two inputs.
- Inline try-it: given two vectors, add an explicit length check before combining.

### H2 5: How can you catch recycling bugs before production?
- Strict alternatives:
  - `vctrs::vec_recycle_common(x, y)` — errors unless one side is length 1 or both sides match.
  - dplyr 1.1+ `mutate()` — already uses vctrs rules and errors on jagged recycling.
  - `tibble()` — also errors instead of warning.
- Code: show `vec_recycle_common()` erroring on length 5 + length 2, and accepting length 5 + length 1.
- Callout: TIP — migrate `data.frame()` to `tibble()` in new code to turn silent recycling into a hard error.
- Inline try-it: wrap a base R calculation in `vec_recycle_common()` to convert the warning into an error.

## Practice Exercises (capstone, 2)

### Exercise 1: Audit a function for silent recycling
Given a function that takes two numeric vectors and computes their element-wise difference, add a length guard that errors on mismatch and recycles only length-1 inputs. Use `vctrs::vec_recycle_common()`.

### Exercise 2: Fix a broken quarterly pipeline
Given `months <- month.name` and `q1_rev <- c(100, 120, 115, 130)`, write code that builds a 12-row tibble with NA for months with no data — **without** triggering the silent recycle bug. Expected: 12 rows, 8 NAs.

## Complete Example plan
A realistic "salary bonus" pipeline:
- `employees` vector of 10 names.
- `bonuses` vector of 4 values (only four employees earned one).
- Naive code: `data.frame(employees, bonus = bonuses)` — base `data.frame` errors; but `employees * 1 + bonuses` silently recycles.
- Fix: align lengths with `NA`, then `tibble()` to surface any remaining mistake.

## Summary table

| Situation | What R does | Fix |
|---|---|---|
| Scalar recycles (length 1) | Silent, intentional | None — this is R's design |
| Length cleanly divides | Silent, often unintentional | `stopifnot()` or `tibble()` |
| Length does not divide | Warning, runs anyway | Align lengths before the op |
| `diff()`, `lag()` return shorter vector | Warning on combine | Pad with NA or trim |
| `data.frame()` with mismatch | Errors | Match lengths with NA |

## References plan
1. R Language Definition — "Recycling rule" section (cran.r-project.org).
2. Advanced R by Hadley Wickham — Chapter 3: Vectors.
3. vctrs package — `vec_recycle_common()` reference.
4. R for Data Science (2e) — Vectors chapter.
5. tibble package — why it errors instead of warning.

## Continue Learning plan
- R Common Errors — the full error reference (parent).
- R Vectors — the foundation chapter.
- R Error: argument is of length zero — related conditional bug.

## Diagrams

None. FR post; no visual adds more than prose for this topic.

## Code block master list

| # | Demonstrates | Libs | Vars introduced | Vars used |
|---|---|---|---|---|
| 1 | Trigger the warning and show the silent wrong result | — | x, y, result | — |
| 2 | Scalar recycle + even-divide recycle (no warning) | — | prices, taxed, a, b | — |
| 3 | Inline try-it (H2 1): predict length 5 + length 3 | — | ex_a, ex_b | — |
| 4 | Even divide works because 6/3 = 2 | — | sales, tax_rates | — |
| 5 | Inline try-it (H2 2): 8 prices + 4 taxes | — | ex_prices, ex_tax | — |
| 6 | Silent wrong result: 12 months + 4 quarters | — | months, q_rev, bad_df | — |
| 7 | Inline try-it (H2 3): spot the bug | — | ex_ids, ex_flags | — |
| 8 | Fix patterns: stopifnot, pad NA, trim, rep | — | values, changes, changes_padded | — |
| 9 | Inline try-it (H2 4): add length guard | — | ex_x, ex_y | — |
| 10 | `vec_recycle_common()` strict mode | vctrs | v1, v2 | — |
| 11 | Inline try-it (H2 5): strict wrapper | vctrs | ex_v1, ex_v2 | — |
| 12 | Capstone Exercise 1 starter + reveal | vctrs | my_x, my_y | — |
| 13 | Capstone Exercise 2 starter + reveal | — | my_months, my_q1, my_full | — |
| 14 | Complete Example: salary bonus pipeline | — | employees, bonuses, bonuses_full, payroll | — |

No library() needed except vctrs for strict mode. vctrs is WebR-safe (dplyr dep).
