# Plan: R-Functions

## Frontmatter

| Field | Value |
|---|---|
| title | Write Better R Functions: Arguments, Defaults, Scope & When to Vectorise |
| slug | R-Functions |
| description | Stop copy-pasting code. Learn to write clean R functions with default arguments, explicit return values, proper scoping rules, and built-in error checking. |
| keywords | R functions, writing functions in R, R function arguments, default arguments R, lexical scoping R, return values R, vectorization R, R function syntax |
| auto_link_terms | writing R functions\|R function arguments\|R function scope\|lexical scoping\|default arguments in R\|return value in R |
| auto_link_case_sensitive | false |
| mathjax | false |
| webr | true |
| date | 2026-03-29 |
| curriculum_id | 1.1.10 |
| post_type | C |
| sidebar_section | Learn R |
| sidebar_title | Writing R Functions |
| sidebar_order | 10 |
| fr_parent | null |

## Breadcrumb

`Home > Learn R > Fundamentals > Writing R Functions`

## Lead

An R function is a reusable block of code you call by name with arguments. Writing your own functions lets you turn repeated steps into a single command, reduce bugs, and make your scripts readable.

## Introduction

Hook: copy-pasting the same five lines into a script three times means you now have three places to fix the same bug. Explain what a function is, why wrapping logic in a function saves time and prevents errors, and what the reader will learn: syntax anatomy, arguments and defaults, return values, lexical scope, variadic `...`, and input validation. Mention that every code block runs live in the browser — no setup needed.

## Core Sections

### H2 1: What is a function in R? (anatomy)
- Theory: name, arguments (formals), body, return value
- Diagram 1: anatomy
- Code block 1: simplest function `square()`, call it, assign result
- Callout TIP: function names should be verbs
- Code block 2: multi-line body with intermediate variables

### H2 2: How do you set default arguments in R functions?
- Theory: required vs optional args, positional vs named calls, defaults
- Diagram 3: arg matching flow
- Code block 3: `greet(name, greeting = "Hello")` — call positional, named, partial
- Callout WARNING: partial matching is fragile
- Code block 4: defaults that reference other args (lazy evaluation peek)

### H2 3: How does an R function return values?
- Theory: implicit return (last expression), explicit `return()` for early exit, returning multiple values via list
- Code block 5: implicit return
- Code block 6: early return guard clause
- Code block 7: returning a named list (multiple outputs)
- Callout KEY INSIGHT: R functions always return exactly one object

### H2 4: What is lexical scoping in R?
- Theory: local vs global, scope chain, closures intro
- Diagram 2: scope chain flowchart
- Code block 8: local variables vanish after function returns
- Code block 9: function reads from enclosing env
- Callout WARNING: modifying globals with `<<-` is usually a mistake

### H2 5: How do you pass extra arguments with `...`?
- Theory: variadic args, forwarding to other functions
- Code block 10: wrapper function that forwards `...` to `mean()` or `sum()`
- Callout TIP: use `...` to pass plot/format args through your function

### H2 6: How should your R functions validate inputs?
- Theory: fail fast, clear error messages
- Code block 11: `stopifnot()` for type checks
- Code block 12: custom `stop()` with informative message
- Callout KEY INSIGHT: validate at the boundary, trust internals

## Tail Sections

### Common Mistakes (4)
1. Forgetting to assign the function — `square(3)` fails if you just typed the definition without `<-`
2. Using `=` for assignment inside the body and breaking named-argument calls
3. Relying on a global variable that disappears or changes
4. Writing an "if TRUE return X else return Y" instead of early return

### Practice Exercises (4)
1. Easy: write `celsius_to_f(c)` using the formula
2. Medium: write `summary_stats(x)` returning list with mean/median/sd
3. Medium: write `clip(x, lo, hi)` with default `lo = 0, hi = 1`
4. Hard: write `safe_log(x)` that errors for negatives with a helpful message

### Complete Example
End-to-end: a `describe_numeric(df)` function that takes a data frame, validates the input, iterates numeric columns, returns a tibble of stats. Uses defaults, `...` for extra columns to ignore, input validation, explicit return.

### Summary
Table: concept → rule of thumb (arguments, defaults, return, scope, dots, validation).

### FAQ (4)
1. Should I use `=` or `<-` for assignment? (narrow — assignment operator choice)
2. Can I return more than one value from an R function? (narrow — return mechanics for multiple values)
3. What's the difference between `stop()` and `warning()`? (narrow — error vs warning)
4. When should I NOT write a function? (narrow — anti-pattern guidance)

### References (6)
1. Wickham — Advanced R, Ch 6 Functions
2. Wickham — R for Data Science, Ch 25 Functions
3. R Intro Manual — Writing your own functions
4. R documentation — `match.arg()`, `stopifnot()`
5. tidyverse style guide — Functions
6. Dataquest — Writing Functions in R

### What's Next (2)
- R Control Flow (previous in curriculum)
- R Special Values (next in curriculum)

## Diagrams

| # | Filename | Figure N | Caption | Placed in H2 section |
|---|---|---|---|---|
| 1 | R-Functions-anatomy.webp | Figure 1 | The four parts of every R function: name, arguments, body, and return value. | What is a function in R? (anatomy) |
| 2 | R-Functions-scope-chain.webp | Figure 2 | How R searches environments to resolve a variable name inside a function. | What is lexical scoping in R? |
| 3 | R-Functions-arg-matching.webp | Figure 3 | R matches arguments in four steps: exact name, partial name, position, then defaults. | How do you set default arguments in R functions? |

## Code Block Master List

| # | Demonstrates | Libs | Vars introduced | Vars used |
|---|---|---|---|---|
| 1 | Define + call `square()` | — | square, result | — |
| 2 | Multi-line body with locals | — | bmi_calc, bmi | — |
| 3 | Positional vs named args | — | greet | — |
| 4 | Default referencing other arg | — | price_with_tax | — |
| 5 | Implicit return | — | area | — |
| 6 | Early return guard | — | safe_div | — |
| 7 | Return a named list | — | describe_vec, stats_out | — |
| 8 | Local vars vanish | — | local_demo | — |
| 9 | Reads enclosing env | — | threshold, is_tall | — |
| 10 | Variadic `...` | — | apply_fn | — |
| 11 | `stopifnot()` | — | safe_sqrt | — |
| 12 | Custom `stop()` | — | divide | — |
| 13-16 | Exercise solutions (distinct vars: my_result) | — | my_result | — |
| 17 | Complete example | — | describe_numeric, report | — |
