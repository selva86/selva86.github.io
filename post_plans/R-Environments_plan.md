# Plan: R Environments: The Missing Piece That Makes Scoping, Closures & NSE Click

## A. Frontmatter

| Field | Value |
|---|---|
| title | `R Environments: The Missing Piece That Makes Scoping, Closures & NSE Click` |
| slug | `R-Environments` |
| description | `R environments are named bags with parent pointers — they power scoping and closures. Learn globalenv, baseenv, execution frames, and inspect them with rlang.` (159 chars) |
| keywords | `R environments, globalenv, baseenv, emptyenv, parent environment, execution environment, R closures, R scoping chain, new.env()` |
| auto_link_terms | `R environments\|environment in R\|globalenv()\|baseenv()\|emptyenv()\|parent.env()\|execution environment\|new.env()` |
| auto_link_case_sensitive | `false` |
| mathjax | `false` |
| webr | `true` |
| date | `2026-04-13` |
| curriculum_id | `4.1.4` |
| post_type | `C` |
| sidebar_section | `Advanced R` |
| sidebar_title | `R Environments` |
| sidebar_order | `22` |

Breadcrumb (auto by build.py): `Home > Learn R > Advanced R > R Environments`.

## B. Lead paragraph (featured snippet)

An R environment is a named bag of variables plus a pointer to a parent environment. That tiny structure is how R finds every variable you use, how closures remember state, and how packages keep their functions from colliding — master it and R stops feeling magical.

## C. First H2 opening prose (≤80 words)

Think of an environment the way you think of a named list, but with one extra field: a parent. When R looks up a variable, it peeks at the current environment's bindings first, then follows the parent pointer, then the parent's parent, all the way up. The fastest way to see that structure is to build one with `rlang` and print it.

## D. Core content sections

### H2 1 — What is an R environment?
- Theory: two parts — frame (name→value bindings) + parent pointer. Not ordered. Reference semantics.
- **Block 1 (payoff):** `library(rlang)`, `new_environment(list(x=10, y=20, greeting="hi"))`, `env_print()`, `env_names()`. Shows the two-part structure live.
- **Callout (NOTE):** Why rlang — consistent API, printing is friendlier than base.
- **Inline exercise:** Create `ex_env` with `a=1, b=2, c=3`, print its names.
- Figure: none above the code block.

### H2 2 — How does R find a variable?
- Theory: lexical scoping; walk the parent chain.
- **Block 2:** define `x <- 100`; a function that uses `x` without defining it; then `env_parents(global_env())` to show the chain; `search()` to list package envs.
- **Figure 1: scoping chain diagram** placed AFTER the code, visualising the walk.
- **Callout (KEY INSIGHT):** Lookup is *where* R searches, scoping is *which* environments it searches.
- **Inline exercise:** Predict what `search()` returns after `library(stats)` (already loaded).

### H2 3 — What are the four special environments?
- Theory: `globalenv()`, `baseenv()`, `emptyenv()`, package environments.
- **Block 3:** call each; show `emptyenv()` has no parent via `tryCatch(parent.env(emptyenv()))`.
- **Callout (WARNING):** `emptyenv()` is the only environment without a parent — asking for it throws.
- **Inline exercise:** Print the parent of `baseenv()` — reveal that it's `emptyenv()`.

### H2 4 — What happens inside a function call?
- Theory: execution environments — ephemeral per call, parent is the enclosing env (not the caller), hence lexical scoping.
- **Block 4:** `f <- function() { a <- 1; print(environment()); print(parent.env(environment())) }`; call `f()`; show a fresh address each call.
- **Figure 2: function call lifetime** diagram.
- **Callout (TIP):** Each call creates a new execution environment — that's why locals never leak between calls.
- **Inline exercise:** Inside a function, print the two objects it created locally via `ls(environment())`.

### H2 5 — How do environments enable closures?
- Theory: a function captures the env where it was *defined*. That env can hold private state.
- **Block 5:** `make_counter()` that returns a function using `count <<- count + 1`; call `tally()` three times; `env_print(fn_env(tally))` to peek at the captured state.
- **Callout (KEY INSIGHT):** `<<-` walks up the parent chain until it finds an existing binding (or lands in globalenv).
- **Inline exercise:** Write `ex_make_adder(n)` that returns a function adding `n`.

### H2 6 — How do you inspect and manipulate environments in practice?
- Theory: environments as mutable stores (no copy on modify).
- **Block 6:** `cache <- new.env()`, `cache$pi_approx <- 3.14159`, `env_get()`, `ls()`, `env_has()`; then `cache2 <- cache; cache2$extra <- "ref semantics"; ls(cache)` shows the shared state.
- **Callout (WARNING):** Reference semantics — copying an environment name does NOT copy its contents. Use `rlang::env_clone()` for an actual copy.
- **Inline exercise:** Add a new binding to `cache` and verify it shows up in `cache2`.

## E. Tail sections

### ## Practice Exercises
- **Ex 1 (medium):** Build an `ex_env_chain(env)` that prints each environment up to `emptyenv()`.
- **Ex 2 (medium-hard):** Write `ex_make_bank(initial)` returning a list of `deposit`, `withdraw`, `balance` closures sharing one env.
- **Ex 3 (hard):** Use an env as a memoisation cache for a slow recursive `fib_slow()`.

### ## Complete Example
End-to-end: build a `make_logger(name)` factory where each logger writes to its own private environment (log lines + count), with a `logger$flush()` that returns a data.frame of entries. Demonstrates closures, reference semantics, and environment inspection.

### ## Summary
Table of concepts: structure | special envs | execution env | closure | inspection.
**Figure 3: overview mindmap** placed in this section.

### ## References
1. Wickham H. — *Advanced R*, Ch.7 Environments. https://adv-r.hadley.nz/environments.html
2. R Core — Environment Access. https://stat.ethz.ch/R-manual/R-devel/library/base/html/environment.html
3. rlang package reference — env family. https://rlang.r-lib.org/reference/env.html
4. Grolemund G. — *Hands-On Programming with R*, Ch.8. https://rstudio-education.github.io/hopr/environments.html
5. R Language Definition — Environment objects. https://cran.r-project.org/doc/manuals/r-release/R-lang.html#Environment-objects
6. Wickham H. — *Advanced R Solutions*, Ch.6. https://advanced-r-solutions.rbind.io/environments

### ## Continue Learning
- `R-Lexical-Scoping.html` — the scoping rules that walk the chain
- `R-Closures.html` — captured-env patterns for stateful helpers
- `R-Names-and-Values.html` — the reference-semantics story

## F. Diagram list

| # | Filename | Figure N | Caption | Placed in H2 |
|---|---|---|---|---|
| 1 | `R-Environments-scoping-chain.webp` | Figure 1 | How R walks the parent chain to resolve a variable name. | How does R find a variable? |
| 2 | `R-Environments-function-call.webp` | Figure 2 | A function call creates a new execution environment whose parent is the enclosing env. | What happens inside a function call? |
| 3 | `R-Environments-overview-mindmap.webp` | Figure 3 | R environments at a glance: structure, kinds, and the roles they play. | Summary |

## G. Code block master list

| Block # | Demonstrates | Libs | Vars introduced | Vars used |
|---|---|---|---|---|
| 1 | Build an env and inspect it | rlang | `my_env` | — |
| 2 | Lexical lookup + search path | — | `x`, `show_x` | `my_env` (not required) |
| 3 | The four special environments | — | — | — |
| 4 | Execution env birth/death | — | `f` | — |
| 5 | Closure captures enclosing env | — | `make_counter`, `tally` | — |
| 6 | Env as mutable store; reference semantics | — | `cache`, `cache2` | — |
| Complete example | make_logger factory | — | `make_logger`, `lg` | — |

Rule check: `library(rlang)` only in block 1. Every "Vars used" references a variable introduced earlier. Closure/env examples use distinct names (`make_counter`, `tally`, `cache`, `lg`). Exercise vars prefixed `ex_`.

## H. Estimated length

~2,600 words, 6 core H2 + 5 tail, 6 teaching code blocks + 6 inline exercise blocks + 3 capstone exercise blocks + 1 complete example = 16 R code blocks. 3 diagrams. ~6 callouts (1 per ~500 words).
