# Plan: R Assignment Deep Dive

## A. Frontmatter

| Field | Value |
|---|---|
| title | `<- vs = vs <<- in R: The Definitive Guide to Assignment Operators` |
| slug | `R-Assignment-Deep-Dive` |
| description | `R has five assignment operators with distinct behavior. Learn when <- and = are interchangeable, what <<- does to parent environments, and why -> exists.` (153 chars) |
| keywords | `R assignment operators, <- vs = in R, <<- operator R, right assignment R, assign function R, R scoping rules, R variable assignment, R style guide` |
| auto_link_terms | `R assignment operators\|<- vs =\|<<- operator\|R variable assignment\|R scoping rules` |
| auto_link_case_sensitive | `false` |
| mathjax | `false` |
| webr | `true` |
| date | `2026-04-13` |
| curriculum_id | `4.1.2` |
| post_type | `C` |
| sidebar_section | `Advanced R` |
| sidebar_title | `R Assignment Deep Dive` |
| sidebar_order | (preserve existing position under "How R Works" divider) |

## B. Breadcrumb (auto-generated, do NOT write into markdown)

Home > Advanced R > How R Works > R Assignment Deep Dive

## C. Full outline

### Lead paragraph (featured snippet)

> R has five assignment operators — `<-`, `=`, `<<-`, `->`, `->>` — plus the `assign()` function. They look similar but differ in where they write, when they're allowed, and how they handle scope. This guide shows exactly what each one does and which to reach for.

### First H2 opening plan (~75 words, no preamble)

**H2:** What does `<-` actually do?

Opening prose (≤ 80 words): `<-` is R's standard assignment operator. It takes whatever is on the right, evaluates it, and binds the result to the name on the left — in the current environment. That's it. But "current environment" hides most of the interesting behavior, so we'll start by running `<-` in three places — the console, a function body, and a `for` loop — and confirming where the binding lives.

(Lead + this opening ≈ 140 words — within the 150-word budget.)

### Core H2 sections (6 total)

#### 1. What does `<-` actually do?
- **Theory:** `<-` evaluates the RHS and binds to LHS in the current environment. Works everywhere.
- **Code block 1 (payoff):** Load no packages. Assign `x <- 42`, `msg <- "hello"`, use them, then show assignment works identically inside a function body and inside a `for` loop. Output via `#>`.
- **Callout KEY INSIGHT:** "Every `<-` writes to the environment it runs in" — mental model.
- **Inline exercise:** Write `ex_area <- <whatever>` to compute the area of a rectangle and print it.

#### 2. When is `=` a valid replacement for `<-`?
- **Theory:** `=` also assigns — at the top level or within `{}`. The real difference is that `=` inside a function call binds a named argument; `<-` inside a function call creates a side-effect variable.
- **Code block 2:** `a = 1; b <- 2; a + b` → shows they're interchangeable at top level.
- **Code block 3:** THE side-effect bug. `lm(mpg ~ wt, data <- mtcars)` creates a global `data` variable. Compare with `lm(mpg ~ wt, data = mtcars)`. Use `exists("data")` before and after.
- **Callout WARNING:** `<-` inside a function argument silently creates a global binding. Classic top-5 R bug.
- **Inline exercise:** Given a buggy one-liner, identify which `=` is an argument and which should be `<-`.

#### 3. What does `<<-` do in the parent environment?
- **Theory:** `<<-` (superassign) searches enclosing environments for an existing binding with that name. If it finds one, it updates it. If not, it creates one in the global environment.
- **Code block 4:** Counter function using `<<-` — the canonical "stateful closure" pattern. Show it increments the outer count.
- **Diagram:** `R-Assignment-Deep-Dive-parent-env-lookup.webp` — how `<<-` walks parent environments.
- **Code block 5:** Nested functions — `<<-` stops at the first match, not the global. Demonstrate with `make_counter()` factory.
- **Callout TIP:** Prefer closures/R6 over `<<-` for mutable state in production code — `<<-` is fine for quick scripts but hard to trace.
- **Inline exercise:** Modify a counter to start from 10 and increment by 5.

#### 4. Why does R even have `->` and `->>`?
- **Theory:** `->` is just `<-` backwards — same semantics, reversed direction. Useful at the end of a pipe. `->>` is `<<-` reversed.
- **Code block 6:** `mtcars |> head(3) -> top_cars; top_cars` — a legit pipe-friendly use.
- **Code block 7:** `->>` demo (rare in practice).
- **Callout NOTE:** `->` is uncommon but valid. Most style guides don't ban it; tidyverse accepts it at the end of pipes.
- **Inline exercise:** Rewrite `result <- sqrt(mean(c(4, 9, 16)))` using `->` instead.

#### 5. When should you use `assign()` instead?
- **Theory:** `assign(name, value, envir)` takes the variable name as a string. Essential when the name is computed at runtime (e.g., generating many variables in a loop — though a list is usually better).
- **Code block 8:** Generate variables `var_1`, `var_2`, `var_3` with `assign()` in a loop.
- **Callout KEY INSIGHT:** If you're reaching for `assign()`, ask: "Should this be a list or a named vector instead?" Usually yes.
- **Inline exercise:** Use `assign()` to create `ex_x` with value 7 in the current environment.

#### 6. Which operator should you use day-to-day?
- **Theory:** Decision summary table + the canonical style advice.
- **Table:** When to use `<-`, `=`, `<<-`, `->`, `assign()` (one row each).
- **Diagram:** `R-Assignment-Deep-Dive-decision-tree.webp` — decision tree for picking the right operator.
- **Code block 9:** Precedence / chaining — `a <- b <- c <- 1`. Show right-to-left grouping.
- **Callout TIP:** Stick to `<-` for assignment, `=` for named arguments. That single rule handles 95% of R code.
- **Inline exercise:** Chain-assign three variables to the value 10 in one line.

### Tail sections

#### Practice Exercises (2 capstone)

1. **Stateful scorekeeper:** Build `make_scorer()` that returns two functions (`add_points`, `get_total`). Use `<<-` to mutate a shared counter. Starter code provided.
2. **Operator refactor:** Given a small buggy script using `lm(data <- df, ...)` and `result = transform(df)`, rewrite to idiomatic style. Expected: no global side effects, clear argument vs assignment.

#### Complete Example: Building a simple transaction log

A 20-line runnable script that uses `<-` for all bindings, `=` for named args, `<<-` for a logger closure that appends to a shared log vector, `->` once at the end of a pipe. Demonstrates every operator in realistic context.

#### Summary
Bullet list of 5 takeaways — one per operator.

#### References
1. R-devel Assignment Operators — stat.ethz.ch
2. Wickham, *Advanced R* — Environments chapter
3. Wickham, *Advanced R* — Functions: lexical scoping
4. tidyverse style guide — assignment
5. Google R style guide — assignment
6. R-bloggers: Global vs local `<<-` vs `<-`
7. renkun.me: Difference between assignment operators in R

#### Continue Learning
- R Environments — deep dive into what `<<-` is walking
- R Closures — the idiomatic alternative to `<<-` for state
- R Lexical Scoping — why `<-` and `<<-` diverge

## D. Diagrams

| # | Filename | Figure N | Caption | Placed in H2 section |
|---|---|---|---|---|
| 1 | `R-Assignment-Deep-Dive-parent-env-lookup.webp` | Figure 1 | How `<<-` walks up parent environments looking for an existing binding. | What does `<<-` do in the parent environment? |
| 2 | `R-Assignment-Deep-Dive-decision-tree.webp` | Figure 2 | Decision tree for choosing the right assignment operator. | Which operator should you use day-to-day? |

## E. Code block master list

| # | Demonstrates | Libs | Vars introduced | Vars used (prior) |
|---|---|---|---|---|
| 1 | `<-` in three contexts (payoff) | — | `x`, `msg`, `counter` | — |
| 2 | `=` at top level, interchangeable | — | `a`, `b` | — |
| 3 | Side-effect bug with `data <- mtcars` | — | `bad_fit`, `good_fit` | — |
| 4 | Basic `<<-` counter | — | `count`, `tick` | — |
| 5 | `<<-` in factory (make_counter) | — | `make_counter`, `c1` | — |
| 6 | `->` at end of a pipe | — | `top_cars` | — |
| 7 | `->>` demo | — | `tally` | — |
| 8 | `assign()` with dynamic names | — | `var_1`, `var_2`, `var_3` | — |
| 9 | Chaining `a <- b <- c <- 1` | — | `chain_a`, `chain_b`, `chain_c` | — |
| 10 | Exercise starters + solutions | — | `ex_*`, `my_*` | — |
| 11 | Complete example: transaction log | — | `log_txn`, `txn_log` | — |

No libraries needed — base R only. WebR-safe throughout.
