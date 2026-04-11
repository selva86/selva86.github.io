---
post: R-Subsetting
curriculum_id: FR-fund-3
type: FR
parent: R-Vectors (1.1.6)
---

# Plan: R Subsetting — One Definitive Rule for [], [[]], $, and @

## Frontmatter

| Field | Value |
|---|---|
| title | R Subsetting: One Definitive Rule for [], [[]], $, and @ — No More Guessing |
| slug | R-Subsetting |
| description | R's four subsetting operators confuse almost everyone. Learn when to use [, [[, $, and @ with memory aids, common mistakes, and the one unifying rule. |
| keywords | R subsetting, R brackets, double bracket R, dollar sign R, S4 slot R, R extract element, list subsetting R, data frame subsetting R |
| auto_link_terms | R subsetting\|double bracket\|single bracket\|[[...]]\|@ slot operator |
| auto_link_case_sensitive | false |
| mathjax | false |
| webr | true |
| date | 2026-04-11 |
| curriculum_id | FR-fund-3 |
| post_type | FR |
| fr_parent | R-Vectors.html |

## Competitor analysis

| # | Article | Strengths | Gaps |
|---|---|---|---|
| 1 | Advanced R (Hadley) | Authoritative, deep on [ vs [[, train-car analogy | Dense; @ split off in OO chapter; no runnable code; no "one rule" framing |
| 2 | r-coder.com | Simple examples, subset() coverage | Treats `subset()` as primary; skips @ entirely; no list[[]] depth |
| 3 | GeeksforGeeks | Broad surface | No memory aid, no decision tree, no S4 |

**Unique angle:** Unify all four operators under one sentence — *"`[` keeps the container; `[[`, `$`, `@` extract the contents."* — then show it holds for vectors, lists, data frames, and S4 objects. Add a decision flowchart and the train-car analogy in one coherent story.

## Lead (featured snippet)

R has four subsetting operators — `[`, `[[`, `$`, and `@` — and each one returns something different. The single rule that unifies them: **`[` keeps the container; `[[`, `$`, and `@` extract the contents inside it.**

## First H2 opening plan (≤80 words)

"Why four operators?" — R distinguishes between *taking a slice of a container* and *reaching inside to pull out one item*. That one distinction is the reason `mtcars[1]` returns a one-column data frame while `mtcars[[1]]` returns a numeric vector. Before the rules and gotchas, let's see all four in action on one object so the difference is concrete, not abstract.

## Core sections

1. **Why does R have four subsetting operators?** — show all four on a data frame + S4 object in one code block. Introduce the unifying rule.
2. **How does `[` differ from `[[` in R?** — The container-vs-content rule. Train-car analogy. Vectors, lists, data frames.
3. **When should you use `$` instead of `[[` in R?** — `$` is `[[` with shortcuts and one big risk (partial matching, no computed names).
4. **What does `@` do in S4 objects?** — Show with `lubridate::period()` or a tiny setClass example. Explain why S4 uses `@` (strict slot access).
5. **What's the one rule that makes all four click?** — Restate and apply to atomic vectors, lists, data frames, S4, environments. Include the decision flowchart.
6. **What are the most common R subsetting mistakes?** — 5 classic bugs + fixes.

## Tail sections

7. Practice Exercises (2 capstone)
8. Complete Example (clean extraction workflow on airquality)
9. Summary (cheat-sheet table)
10. References
11. Continue Learning

## Diagrams

| # | File | Figure | Caption | H2 |
|---|---|---|---|---|
| 1 | R-Subsetting-decision-flowchart.webp | Figure 1 | Decision flowchart: picking `[`, `[[`, `$`, or `@` in three questions. | What's the one rule that makes all four click? |
| 2 | R-Subsetting-container-vs-content.webp | Figure 2 | `[` returns a smaller train; `[[` returns what's inside a car. | How does `[` differ from `[[` in R? |

## Code block master list

| # | Demonstrates | Libs | Vars introduced | Vars used |
|---|---|---|---|---|
| 1 | Payoff: four operators on mtcars + S4 object, different outputs | (base) | car_df, col_slice, col_vec, slot_val | — |
| 2 | `[` on atomic vector (positions, names, negatives, logicals) | — | grades | — |
| 3 | `[` vs `[[` on a list | — | cfg | — |
| 4 | `[` vs `[[` on a data frame (column selection) | — | iris_slice, sepal_len | — |
| 5 | `$` with partial matching gotcha | — | settings | — |
| 6 | `@` with S4 (`setClass` + simple object) | methods | p1 | — |
| 7 | Decision rule applied across types | — | — | grades, cfg, p1 |
| 8 | 5 common mistakes with fixes | — | df_x, lst_x | — |
| 9 | Complete example: extract a tidy summary from airquality | — | aq_may, aq_mean_temp | — |

Rules: only `methods` loaded in block 6 (if needed — base works). All variables introduced before reuse.

## Practice exercises (2 capstone)

1. **Extract the third row of mtcars as a data frame, then as a vector.** Show both outputs.
2. **Build a nested list** `my_inv <- list(fruit = list(count = 12, unit = "kg"))` and extract the numeric 12 using `[[` only — no `$`.

## Callouts planned

- [KEY INSIGHT] — after Section 2: container vs content rule
- [WARNING] — after Section 3: partial matching bug with `$`
- [TIP] — after Section 4: when to prefer `slot()` over `@`
- [WARNING] — after Section 6 (common mistakes): `x[1, 2]` vs `x[1][2]`
- [KEY INSIGHT] — in Summary: one sentence rule

## References (planned)

1. Wickham, *Advanced R* (2nd ed.), Chapter 4 — Subsetting. https://adv-r.hadley.nz/subsetting.html
2. R Core Team, *An Introduction to R* §6 — Lists and data frames.
3. Chambers, *Software for Data Analysis* (Springer) — S4 classes.
4. R documentation — `?Extract`, `?"[["`, `?slot`.
5. Wickham, *Advanced R* §15 — S4.
6. Peng, *R Programming for Data Science* §9 — Subsetting R Objects.
7. R Language Definition §3.4 — Indexing.

## Continue Learning

- R Vectors (parent post)
- R Lists
- R Data Frames
