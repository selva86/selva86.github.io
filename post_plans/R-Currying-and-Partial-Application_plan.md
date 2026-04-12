# Plan: R Currying & Partial Application: purrr::partial() & rlang

## A. Frontmatter Fields

| Field | Value |
|---|---|
| title | R Currying & Partial Application: purrr::partial() & rlang |
| slug | R-Currying-and-Partial-Application |
| description | Partial application pre-fills function arguments so you never repeat them. Learn purrr::partial() with lazy and eager evaluation, the ... trick, and real currying in R. |
| keywords | R partial application, purrr partial, R currying, partial function R, purrr::partial(), rlang quasiquotation partial, R function operators, curry R, functional programming R, partial application vs currying |
| auto_link_terms | partial application\|purrr::partial()\|currying in R\|partial()\|R currying\|curry package\|partial function application |
| auto_link_case_sensitive | false |
| mathjax | false |
| webr | true |
| date | 2026-04-12 |
| curriculum_id | FR-func-2 |
| post_type | FR |
| sidebar_section | (none — FR post) |
| sidebar_title | (none — FR post) |
| sidebar_order | (none — FR post) |
| fr_parent | R-Function-Operators.html |

## B. Breadcrumb

Home > Learn R > Functional Programming > R Currying & Partial Application: purrr::partial() & rlang

## C. Full Section Outline

### Lead paragraph

**Partial application** creates a new function from an existing one by locking in some arguments upfront — so you call the simpler version everywhere else. In R, `purrr::partial()` is the standard tool for this, and with rlang's quasiquotation you control exactly when each argument is evaluated.

### H2 1: What Is Partial Application and Why Does It Matter?

**Theory/intuition:** Explain partial application as "pre-filling" arguments. Analogy: a coffee machine with a "large latte" preset — you pressed the customization buttons once, now you just press one button. Contrast with writing wrapper functions manually. Show a real problem: repeatedly passing the same argument (e.g., `na.rm = TRUE`) across dozens of calls.

**Code blocks:**
1. **(Payoff block)** Show the problem (repeating `na.rm = TRUE`) and the `partial()` solution side by side. Load `purrr`. Demonstrate `my_mean <- partial(mean, na.rm = TRUE)` and call it on a vector with NAs. Show output.
2. Show how the equivalent manual wrapper looks and why `partial()` is cleaner.

**Callout:** [KEY INSIGHT] Partial application isn't about saving keystrokes — it's about naming a concept. `mean_no_na()` says *what* it does; `function(x) mean(x, na.rm = TRUE)` says *how*.

**Inline exercise:** Create a partially applied `round2 <- partial(round, digits = 2)` and test it on `pi`.

### H2 2: How Does purrr::partial() Work Under the Hood?

**Theory/intuition:** Explain that `partial()` returns a new function with a `...` signature. The pre-filled arguments are stored in the function's environment. Walk through what happens when you call the returned function.

**Code blocks:**
1. Create a partial function, then inspect it with `partial_fn`, print it, show its `formals()` and `environment()`.
2. Demonstrate that the returned function's `...` signature means it accepts any remaining arguments.

**Callout:** [NOTE] Unlike the curry package's operators, `purrr::partial()` returns a function with a `...` signature. This means no autocomplete for remaining arguments, but it handles non-standard evaluation well.

**Inline exercise:** Create `partial(paste, sep = "-")` named `dash_paste`, call it with three words, and verify the separator.

### H2 3: When Should You Use Lazy vs Eager Evaluation?

**Theory/intuition:** By default, `partial()` evaluates pre-filled arguments lazily — each time you call the function. Use `!!` (bang-bang from rlang) to evaluate eagerly at creation time. Analogy: lazy = "check the weather each morning", eager = "set the thermostat once when you install it".

**Code blocks:**
1. Show lazy evaluation: `f <- partial(runif, n = rpois(1, 5))` — call it multiple times, show `n` varies.
2. Show eager evaluation: `f <- partial(runif, n = !!rpois(1, 5))` — call it multiple times, show `n` is fixed.
3. Practical example: partially apply `Sys.time()` lazily to stamp log messages vs eagerly to fix a session start time.

**Callout:** [WARNING] Lazy evaluation can surprise you. If you `partial(rnorm, mean = some_variable)` and later change `some_variable`, the partial function uses the *new* value. Use `!!` to lock in the current value.

**Inline exercise:** Create a partial function that generates 10 random normals with a fixed mean of 100 using eager evaluation. Verify the mean doesn't change across calls.

### H2 4: How Do You Control Where New Arguments Go With ...?

**Theory/intuition:** By default, pre-filled arguments come first and the caller's arguments come after. The `... = ` syntax lets you insert the caller's arguments at a specific position — useful when the argument you want to pre-fill isn't the first one.

**Code blocks:**
1. Show default behaviour: `partial(paste, "prefix")` — caller args go after.
2. Show `... = ` positioning: `partial(list, 1, ... = , 2)` — caller args inserted between 1 and 2.
3. Practical example: partially apply `grepl()` with `ignore.case = TRUE` and `perl = TRUE`, positioning the pattern and text correctly.

**Callout:** [TIP] The `... = ` trick is especially useful with base R functions where the argument you want to fix isn't the first parameter.

**Inline exercise:** Create a case-insensitive grep shortcut using `partial(grepl, ... = , ignore.case = TRUE)`, test it by searching for "hello" in a character vector.

### H2 5: What Is Currying and How Does It Differ From Partial Application?

**Theory/intuition:** Currying transforms a function of N arguments into a chain of N single-argument functions. Partial application fixes some arguments and returns a function with fewer arguments. They're related but distinct. In Haskell, all functions are automatically curried. In R, currying is a deliberate choice.

**Code blocks:**
1. Implement manual currying: `curry_add <- function(a) function(b) a + b; curry_add(3)(5)`.
2. Show the `functional::Curry()` function (historical context).
3. Demonstrate building a simple curry helper with R closures.

**Callout:** [KEY INSIGHT] R doesn't curry automatically like Haskell. Most of the time, `partial()` gives you what you actually want — fixing a few arguments without restructuring the whole function.

**Inline exercise:** Write a manually curried `ex_multiply` that takes one arg and returns a function taking the second. Test `ex_multiply(3)(7)`.

### H2 6: Where Does Partial Application Shine in Real R Workflows?

**Theory/intuition:** Show 3-4 practical patterns where partial application makes code cleaner.

**Code blocks:**
1. **Pattern: map() pipelines** — `map(data_list, partial(str_replace, pattern = "old", replacement = "new"))` instead of anonymous functions.
2. **Pattern: ggplot2 theme shortcuts** — `my_theme <- partial(theme, text = element_text(family = "Helvetica"))`.
3. **Pattern: safely/quietly wrappers** — `safe_log <- partial(safely, .f = log)` for consistent error handling.
4. **Pattern: grouped summarise helpers** — create `mean_na` and `sd_na` with `partial()`, use them inside `summarise(across(...))`.

**Callout:** [TIP] Partial application pairs beautifully with `purrr::map()`. Instead of `map(x, \(item) fn(item, arg1 = val))`, write `map(x, partial(fn, arg1 = val))` — shorter and more declarative.

**Inline exercise:** Use `partial()` to create a `log10_safe` function using `partial(log, base = 10)` and map it over a list of numbers.

## Practice Exercises (capstone)

### Exercise 1: Build a Logging Function Factory (medium)
Combine `partial()` with `paste()` to create a `log_info()` and `log_error()` that prepend "[INFO]" or "[ERROR]" and the current timestamp. Apply them to a vector of messages using `map()`.

### Exercise 2: Compose a Data Cleaning Pipeline (hard)
Use `partial()` to create specialised versions of `str_replace_all()`, `str_trim()`, and `tolower()`, then compose them with `purrr::compose()` to build a single `clean_text()` function. Apply it to a messy character vector.

### Exercise 3: Curried Power Function (hard)
Write a `curry_power()` function that returns a single-argument function for any exponent. Use it to create `square`, `cube`, and `fourth_power`. Demonstrate that `map_dbl(1:5, square)` works.

## Complete Example

End-to-end scenario: building a data-analysis helper toolkit using partial application.
- Create `mean_na`, `sd_na`, `median_na` with `partial()`
- Create a custom `round2` with `partial(round, digits = 2)`
- Compose a pipeline: `airquality |> summarise(across(where(is.numeric), list(mean = mean_na, sd = sd_na))) |> mutate(across(everything(), round2))`
- Show clean output vs the verbose alternative

## Summary

Table format:
| Concept | What It Does | R Tool |
|---|---|---|
| Partial application | Pre-fills some arguments | `purrr::partial()` |
| Lazy evaluation | Args re-evaluated each call | Default behaviour |
| Eager evaluation | Args fixed at creation | `!!` (bang-bang) |
| `... = ` positioning | Controls where new args go | `partial(f, a, ... = , b)` |
| Currying | Transforms to chain of 1-arg fns | Manual closures / `functional::Curry()` |
| Best use case | map() pipelines, repeated args | `map(x, partial(fn, arg = val))` |

## References

1. Wickham, H. — *Advanced R*, 2nd Edition. Chapter 11: Function Operators. [Link](https://adv-r.hadley.nz/function-operators.html)
2. purrr documentation — partial() reference. [Link](https://purrr.tidyverse.org/reference/partial.html)
3. Pedersen, T.L. — curry package: Operator-based currying and partial application. [Link](https://github.com/thomasp85/curry)
4. Piccolo, A. — "Delicious R Curry" (2015). [Link](https://piccolboni.info/2015/07/delicious-r-curry.html)
5. R Core Team — *R Language Definition*, Section on Closures. [Link](https://cran.r-project.org/doc/manuals/r-release/R-lang.html)
6. Henry, L. & Wickham, H. — rlang: quasiquotation. [Link](https://rlang.r-lib.org/reference/quasiquotation.html)
7. purrr vignette — Functional programming in other languages. [Link](https://purrr.tidyverse.org/articles/other-langs.html)

## Continue Learning

1. [R Function Operators](R-Function-Operators.html) — The parent tutorial covering compose(), negate(), and more function operators including partial().
2. [purrr map() Variants](purrr-map-Variants.html) — Master map(), map2(), imap(), and pmap() — partial application's best friend.
3. [R Function Factories](R-Function-Factories.html) — Learn how functions that return functions (closures) relate to currying.

## D. Diagram List

(None — FR post, diagrams optional. Topic better served by code examples.)

## E. Code Block Master List

| Block # | Section | Demonstrates | Libs | Vars introduced | Vars used |
|---|---|---|---|---|---|
| 1 | H2-1 | Payoff: partial(mean, na.rm=TRUE) | purrr | my_mean, x | — |
| 2 | H2-1 | Manual wrapper comparison | — | mean_no_na | x |
| 3 | H2-1 Try-it | round2 exercise | — | ex_round2 | — |
| 4 | H2-2 | Inspect partial function | — | add5 | — |
| 5 | H2-2 | ... signature demo | — | — | add5 |
| 6 | H2-2 Try-it | dash_paste exercise | — | ex_dash_paste | — |
| 7 | H2-3 | Lazy eval demo | — | f_lazy | — |
| 8 | H2-3 | Eager eval demo | — | f_eager | — |
| 9 | H2-3 | Practical lazy vs eager | — | stamp_lazy, stamp_eager | — |
| 10 | H2-3 Try-it | Fixed mean exercise | — | ex_rnorm | — |
| 11 | H2-4 | Default arg positioning | — | prefix_paste | — |
| 12 | H2-4 | ... = positioning | — | between | — |
| 13 | H2-4 | grepl shortcut | — | igrepl | — |
| 14 | H2-4 Try-it | grep exercise | — | ex_igrep | — |
| 15 | H2-5 | Manual currying | — | curry_add | — |
| 16 | H2-5 | Generic curry helper | — | curry | — |
| 17 | H2-5 Try-it | ex_multiply currying | — | ex_multiply | — |
| 18 | H2-6 | map + partial | stringr | — | — |
| 19 | H2-6 | summarise helpers | dplyr | mean_na, sd_na | — |
| 20 | H2-6 Try-it | log10_safe exercise | — | ex_log10 | — |
| 21 | Exercises | Capstone 1 starter | — | — | — |
| 22 | Exercises | Capstone 1 solution | — | log_info, log_error | — |
| 23 | Exercises | Capstone 2 starter | — | — | — |
| 24 | Exercises | Capstone 2 solution | — | clean_text | — |
| 25 | Exercises | Capstone 3 starter | — | — | — |
| 26 | Exercises | Capstone 3 solution | — | curry_power, square, cube | — |
| 27 | Complete | Full pipeline | — | mean_na, sd_na, median_na, round2 | — |
