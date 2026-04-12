---
title: "R Error: 'object not found' — 7 Different Causes, 7 Different Fixes"
slug: "R-Error-Object-Not-Found"
description: "R can't find a variable you referenced. Learn 7 distinct causes — typos, unloaded packages, wrong scope, cleared environment — and the exact fix for each."
keywords: "R object not found, R error object not found, object 'x' not found R, R variable not found, R debugging, R scope error, R package not loaded, R session restart"
auto_link_terms: "object not found|object 'x' not found|not found error"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-13"
curriculum_id: "ERR1"
post_type: "FR"
fr_parent: "R-Common-Errors.html"
---

# R Error: 'object not found' — 7 Different Causes, 7 Different Fixes

<p class="lead"><code>Error: object 'x' not found</code> means R searched every loaded package and the current environment but no variable, function, or dataset with that name exists. Either the object was never created, the name is misspelled, it lives in a different scope, or it was wiped when the session restarted.</p>

## What triggers R's "object not found" error?

Every time you type a bare name like `my_df`, R walks a short lookup chain — the current environment first, then any parents it can see, then every attached package. If no match turns up anywhere on that chain, R stops and reports the exact name in quotes. That name in quotes is your single most useful clue: it is *exactly* what R tried to look up, down to the last character.

```r
# Reproduce the error against a variable you never created
my_df
#> Error: object 'my_df' not found

# Diagnose: is it anywhere R can see?
exists("my_df")
#> [1] FALSE

# What names DO exist in the current environment?
ls()
#> character(0)
```

The first line gives you the error message. The next two lines — `exists()` and `ls()` — tell you whether R truly has no such object (as here) or whether a similarly-named object exists that you typoed. Always run these two checks before guessing at the cause.

[KEY INSIGHT]
**The quoted name in the error is exactly what R looked up.** If the message says `object 'Sales_Data' not found`, then R searched for the name `Sales_Data` — not `sales_data`, not `sales.data`. Your fix begins by matching the lookup name character-for-character.

**Try it:** Reproduce the error for a variable called `ex_missing` and confirm with `exists()`.

```r
# Try it: reproduce + diagnose
# Reference a name you never created, then call exists() on it.
# your code here

```

<details>
<summary>Click to reveal solution</summary>

```r
ex_missing
#> Error: object 'ex_missing' not found

exists("ex_missing")
#> [1] FALSE
```

**Explanation:** Referencing a name that was never assigned triggers the error; `exists()` returns `FALSE` and confirms R genuinely has nothing under that name.

</details>

## Cause 1 — Typo or case mismatch: why can't R find the name you typed?

R is case-sensitive and treats `sales_data`, `sales_Data`, and `Sales_Data` as three completely different identifiers. A single wrong character is enough to break the lookup. This is the most common source of the error — often hiding as a capitalised first letter, an underscore swapped for a dot, or a plural tacked on.

```r
# Object defined correctly
sales_data <- data.frame(region = c("N", "S"), revenue = c(120, 95))

# Reference has the wrong case on the second word
sales_Data
#> Error: object 'sales_Data' not found

# Fix: match the name exactly
sales_data
#>   region revenue
#> 1      N     120
#> 2      S      95
```

The fix costs nothing once you spot the mismatch — the real win is catching typos before running the line. Use Tab completion inside RStudio or VS Code to let the IDE fill the name for you, and you will never mistype a variable that already exists in the environment.

[TIP]
**Let Tab completion type your variable names.** Start typing the first 2-3 letters of a variable, press Tab, and RStudio will complete the name or show a dropdown of matches. This eliminates case-mismatch typos entirely.

**Try it:** The snippet below triggers the error. Find the typo and fix it so the last line prints 42.

```r
# Try it: fix the typo
ex_price <- 42
Ex_price
#> Expected: 42

```

<details>
<summary>Click to reveal solution</summary>

```r
ex_price <- 42
ex_price
#> [1] 42
```

**Explanation:** `Ex_price` with a capital `E` is a different identifier from `ex_price`. Matching the case character-for-character fixes the lookup.

</details>

## Cause 2 — Forgot to assign with `<-`: where did my data go?

Any R expression with no assignment prints its result and throws it away. This catches readers of every experience level because the output *looks* like the data was stored — but nothing was captured in the environment. The tell is always the same: you "see" the data, then try to use it by name on the next line, and R reports it missing.

```r
# Wrong: the expression runs, prints, and discards
data.frame(id = 1:3, score = c(88, 92, 77))
#>   id score
#> 1  1    88
#> 2  2    92
#> 3  3    77

# No name was bound, so exists() is FALSE
exists("df_wrong")
#> [1] FALSE

# Fix: capture with <-
df_wrong <- data.frame(id = 1:3, score = c(88, 92, 77))
df_wrong
#>   id score
#> 1  1    88
#> 2  2    92
#> 3  3    77
```

The output in the first block looks identical to the fixed version, which is exactly why this bug is so easy to miss. Always check that the line you wrote *starts* with `name <-` when you want the data to live past that statement.

[WARNING]
**`read.csv("file.csv")` without assignment is a silent loss.** R prints the first few rows of the CSV, you assume it worked, and you then fail the next line with "object not found". Always write `my_data <- read.csv("file.csv")`, never just `read.csv("file.csv")`.

**Try it:** Fix the missing assignment so the second line prints the mean of the scores.

```r
# Try it: add the assignment
c(71, 88, 93, 65)
mean(ex_scores)
#> Expected: 79.25

```

<details>
<summary>Click to reveal solution</summary>

```r
ex_scores <- c(71, 88, 93, 65)
mean(ex_scores)
#> [1] 79.25
```

**Explanation:** Without `ex_scores <-`, the vector is printed and discarded. The assignment binds the vector to the name so `mean()` can find it on the next line.

</details>

## Cause 3 — Package not loaded: how do I know where a function or dataset lives?

Datasets and functions shipped inside a package are invisible until you either attach the package with `library()` or reach in with the qualified `pkg::name` syntax. This cause often looks identical to Cause 1 because you have never seen the name in your script — you just remember that "someone used `starwars` in a tutorial" and typed it.

```r
# starwars lives in dplyr, which isn't attached by default.
# A bare reference would fail: Error: object 'starwars' not found

# Fix A: qualified access with ::
head(dplyr::starwars, 2)
#> # A tibble: 2 × 14
#>   name           height  mass hair_color skin_color eye_color ...
#>   <chr>           <int> <dbl> <chr>      <chr>      <chr>
#> 1 Luke Skywalker    172    77 blond      fair       blue
#> 2 C-3PO             167    75 <NA>       gold       yellow

# Fix B: attach the package once, then use the bare name
library(dplyr)
head(starwars, 2)
#> # A tibble: 2 × 14
#>   name           height  mass hair_color skin_color eye_color ...
#> 1 Luke Skywalker    172    77 blond      fair       blue
#> 2 C-3PO             167    75 <NA>       gold       yellow
```

Fix A is safer for one-off references and makes the origin explicit in your code. Fix B is cleaner when you need many names from the same package. Either way, once `library(dplyr)` has run in the session, `starwars` becomes a bare name anywhere below it in the script.

[NOTE]
**Three checks tell you what state a package is in.** `requireNamespace("dplyr", quietly = TRUE)` returns TRUE if installed. `"dplyr" %in% loadedNamespaces()` returns TRUE if loaded. `"package:dplyr" %in% search()` returns TRUE if attached. Only *attached* packages expose bare names to your scripts.

**Try it:** Access R's built-in `mtcars` dataset through the `datasets` package with qualified syntax (no `library()` call).

```r
# Try it: qualified access
# Hint: datasets is a base package that ships with R.
# your code here

```

<details>
<summary>Click to reveal solution</summary>

```r
head(datasets::mtcars, 2)
#>               mpg cyl disp  hp drat    wt  qsec vs am gear carb
#> Mazda RX4      21   6  160 110 3.90 2.620 16.46  0  1    4    4
#> Mazda RX4 Wag  21   6  160 110 3.90 2.875 17.02  0  1    4    4
```

**Explanation:** `datasets::mtcars` reaches into the `datasets` package directly, no attachment required. It works for any installed package.

</details>

## Cause 4 — Running code out of order: why does a line that worked yesterday fail today?

RStudio's Run button, Ctrl+Enter, and "Run Selection" all encourage piecemeal execution. The result is a notebook that works when run top-to-bottom but breaks the moment you jump around. You run line 18 — which depends on line 3 — without first running line 3. R has no memory of what you *meant* to run; it only knows what you actually executed.

```r
# These two lines must run top-to-bottom in this order:
raw_input <- c(3, 5, 7, 11, 13)
my_result <- summary(raw_input)

# Running the second line alone (before the first) would error:
# Error: object 'raw_input' not found
my_result
#>    Min. 1st Qu.  Median    Mean 3rd Qu.    Max.
#>     3.0     5.0     7.0     7.8    11.0    13.0
```

The fix is structural: run scripts from the top whenever you come back to them. Better still, organise work into a script you can rerun with `source("analysis.R")` or a Quarto / R Markdown document you can re-knit — both force a clean top-to-bottom execution every time.

[TIP]
**Ctrl+Alt+B in RStudio runs from the top of the script to the current line.** When you come back to a half-finished script and want to rebuild the environment up to where you left off, this shortcut does it in one keystroke.

**Try it:** The three lines below are in the wrong order. Reorder them so the last line prints the summary.

```r
# Try it: reorder so this runs without error
ex_summary <- summary(ex_values)
ex_summary
ex_values <- c(2, 4, 6, 8)
#> Expected: summary of 2,4,6,8

```

<details>
<summary>Click to reveal solution</summary>

```r
ex_values <- c(2, 4, 6, 8)
ex_summary <- summary(ex_values)
ex_summary
#>    Min. 1st Qu.  Median    Mean 3rd Qu.    Max.
#>       2       4       5       5       6       8
```

**Explanation:** Each line depends on the one above it, so `ex_values` must be defined first, then summarised, then printed.

</details>

## Cause 5 — Different scope: why can't I see a variable defined inside a function?

Variables created inside a function body live in that function's local environment and vanish as soon as the function returns. From the caller's perspective, they never existed. This trips up readers who assume R behaves like a notebook where every name is global.

```r
# Define locals inside a function
compute_stats <- function(x) {
  local_mean <- mean(x)
  local_sd <- sd(x)
  invisible(NULL)
}

compute_stats(1:10)

# Try to use the local from outside — fails
# local_mean
# Error: object 'local_mean' not found

# Fix: return the values as a list
compute_stats <- function(x) {
  list(mean = mean(x), sd = sd(x))
}
stats <- compute_stats(1:10)
stats$mean
#> [1] 5.5
stats$sd
#> [1] 3.02765
```

The fix is always to *return* what the caller needs. R functions return the value of their last expression — or whatever you pass to `return()` — and that value lives in the caller's environment once you assign it. Avoid the temptation to use `<<-` to push variables to the global environment; it makes code hard to reason about.

[KEY INSIGHT]
**Functions see the environment where they were defined, not where they're called.** This is called lexical scoping. A variable you assign inside a function body is local to that call and disappears on return. If the caller needs it, the function must hand it back explicitly.

**Try it:** Rewrite `ex_rescale` so it returns the scaled vector instead of just assigning it internally.

```r
# Try it: make ex_rescale return its result
ex_rescale <- function(v) {
  scaled <- (v - min(v)) / (max(v) - min(v))
  # return statement missing
}

# Test:
ex_rescale(c(10, 20, 30))
#> Expected: 0.0 0.5 1.0

```

<details>
<summary>Click to reveal solution</summary>

```r
ex_rescale <- function(v) {
  scaled <- (v - min(v)) / (max(v) - min(v))
  scaled
}
ex_rescale(c(10, 20, 30))
#> [1] 0.0 0.5 1.0
```

**Explanation:** The last expression in a function body becomes its return value. Naming `scaled` on its own line (or using `return(scaled)`) hands the vector back to the caller.

</details>

## Cause 6 — Column name doesn't exist inside dplyr verbs: why is it an "object" error and not a column error?

Inside `dplyr::filter()`, `mutate()`, `arrange()`, and friends, bare column names are resolved by a mechanism called non-standard evaluation (NSE). dplyr first looks for the name in the data frame, and if it can't find it there, it falls back to looking in the calling environment. When neither lookup succeeds, you see the familiar "object not found" error — even though the real problem is a missing column.

```r
library(dplyr)

# Wrong: "MPG" with uppercase doesn't exist in mtcars
# mtcars |> filter(MPG > 20)
# Error in `filter()`:
# ! Problem while computing `..1 = MPG > 20`.
# Caused by error:
# ! object 'MPG' not found

# Fix: mtcars uses lowercase column names
mtcars |> filter(mpg > 20) |> head(3)
#>                 mpg cyl  disp hp drat    wt  qsec vs am gear carb
#> Datsun 710     22.8   4 108.0 93 3.85 2.320 18.61  1  1    4    1
#> Merc 240D      24.4   4 146.7 62 3.69 2.950 20.00  0  1    4    2
#> Merc 230       22.8   4 140.8 95 3.92 2.840 22.90  1  1    4    2
```

Always check your column names with `names(df)` or `colnames(df)` before using them inside a dplyr verb. The error's wording is confusing the first time you see it — the phrase "object not found" makes you hunt for a missing variable when the real culprit is a typo in a column name.

[WARNING]
**Inside dplyr verbs, unknown columns surface as "object not found", not "column not found".** If you see this error inside a `filter()`, `mutate()`, or `arrange()` call, your first guess should be a column-name typo — not a missing variable.

**Try it:** Fix the `mutate()` call below so it adds a new column `hp_per_cyl` equal to `hp / cyl`.

```r
# Try it: fix the column reference
mtcars |>
  mutate(hp_per_cyl = HP / CYL) |>
  head(2)
#> Expected: first 2 rows with hp_per_cyl column

```

<details>
<summary>Click to reveal solution</summary>

```r
mtcars |>
  mutate(hp_per_cyl = hp / cyl) |>
  head(2)
#>               mpg cyl disp  hp drat   wt  qsec vs am gear carb hp_per_cyl
#> Mazda RX4      21   6  160 110 3.90 2.62 16.46  0  1    4    4   18.33333
#> Mazda RX4 Wag  21   6  160 110 3.90 2.88 17.02  0  1    4    4   18.33333
```

**Explanation:** mtcars uses all-lowercase column names (`hp`, `cyl`), so `HP` and `CYL` fail NSE lookup and produce "object not found". Matching the case fixes it.

</details>

## Cause 7 — Environment cleared or session restarted: where did all my variables go?

Running `rm(list = ls())` wipes everything in the global environment. So does clicking the broom icon in RStudio's Environment pane, or choosing Session → Restart R. After any of these, every name you previously created is gone and referencing it gives "object not found". The only cure is to re-run the script that created those names.

```r
# Build a data frame
df_work <- data.frame(id = 1:3, value = c(10, 20, 30))

# Simulate clearing just that object
rm(list = "df_work")

# It's gone from the environment
exists("df_work")
#> [1] FALSE

# df_work
# Error: object 'df_work' not found

# Fix: re-run the assignment (in real life, source() your script)
df_work <- data.frame(id = 1:3, value = c(10, 20, 30))
df_work
#>   id value
#> 1  1    10
#> 2  2    20
#> 3  3    30
```

This is why reproducible scripts matter. If your analysis lives as a set of hand-run commands in the console, restarting your R session means hours of rebuilding state. If it lives in a `.R` file, the rebuild is a single `source("analysis.R")` call.

[TIP]
**Put every assignment in a script you can source.** Running `source("analysis.R")` rebuilds your entire environment in one command. A Quarto or R Markdown document does the same thing with `quarto render` or `rmarkdown::render()`. Either option makes a cleared session a 2-second inconvenience instead of a 2-hour rebuild.

**Try it:** After `rm("ex_counter")`, restore `ex_counter` to the value 5 and print it.

```r
# Try it: restore after rm()
ex_counter <- 99
rm("ex_counter")

# Write code to set ex_counter to 5 and print it:
# your code here

```

<details>
<summary>Click to reveal solution</summary>

```r
ex_counter <- 5
ex_counter
#> [1] 5
```

**Explanation:** `rm()` removed the binding; you rebuild it with another `<-` assignment. There's no "restore" — you just re-create.

</details>

## Practice Exercises

### Exercise 1: Diagnose the broken script

The 5-line script below throws `Error: object 'revenue_df' not found` on the last line. Identify which of the 7 causes is responsible and fix the script in one edit.

```r
# Exercise: identify and fix the cause
my_path <- "sales.csv"
data.frame(q1 = c(100, 200), q2 = c(150, 180))
revenue_df |> colSums()

# Your fix:

```

<details>
<summary>Click to reveal solution</summary>

```r
# Cause 2: the data.frame() call was missing an assignment
revenue_df <- data.frame(q1 = c(100, 200), q2 = c(150, 180))
revenue_df |> colSums()
#>  q1  q2
#> 300 330
```

**Explanation:** The second line creates a data frame but never captures it with `<-`, so `revenue_df` never existed when the third line referenced it. Adding the assignment is the one-edit fix.

</details>

### Exercise 2: Write a diagnosis helper

Write a function `diagnose_missing(name)` that takes an object name as a string and prints the most likely cause by checking three conditions: whether the name exists, whether a similarly-cased name is in `ls()`, and whether the name lives in a loaded package.

```r
# Exercise: build diagnose_missing()
# Hint: use exists(name), ls(), and loadedNamespaces()

# Your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
diagnose_missing <- function(name) {
  if (exists(name)) {
    cat(name, "exists — no error expected.\n")
    return(invisible(NULL))
  }
  all_names <- ls(envir = globalenv())
  similar <- all_names[tolower(all_names) == tolower(name)]
  if (length(similar) > 0) {
    cat("Likely Cause 1 (typo/case). Did you mean:", similar, "\n")
    return(invisible(NULL))
  }
  for (pkg in loadedNamespaces()) {
    if (name %in% ls(getNamespace(pkg))) {
      cat("Found in package", pkg, "- use", paste0(pkg, "::", name), "or attach it.\n")
      return(invisible(NULL))
    }
  }
  cat("Cause 2, 4, or 7: object was never created, ran out of order, or session was cleared.\n")
}

# Test it:
example_var <- 1
diagnose_missing("Example_var")
#> Likely Cause 1 (typo/case). Did you mean: example_var
```

**Explanation:** The helper walks the three most common diagnoses in order — existence check, case-insensitive match in `ls()`, and package namespace scan — then falls through to the remaining causes.

</details>

### Exercise 3: Catch the error and extract the missing name

Write `run_safely(expr)` that evaluates an expression and, if it fails with "object not found", returns the missing object's name as a string. If the expression succeeds, return its value. Use `tryCatch()`.

```r
# Exercise: build run_safely()
# Hint: capture the error with tryCatch() and regex the name from conditionMessage()

# Your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
run_safely <- function(expr) {
  tryCatch(
    expr,
    error = function(e) {
      msg <- conditionMessage(e)
      match <- regmatches(msg, regexpr("object '([^']+)' not found", msg))
      if (length(match) > 0) {
        sub("object '([^']+)' not found", "\\1", match)
      } else {
        stop(e)
      }
    }
  )
}

# Test on a missing object:
run_safely(ghost_var)
#> [1] "ghost_var"

# Test on a working expression:
run_safely(mean(1:10))
#> [1] 5.5
```

**Explanation:** `tryCatch()` intercepts the error condition. The regex pulls the quoted name out of the standard "object 'x' not found" message; any other error is re-thrown with `stop(e)`.

</details>

## Complete Example

Here's the full diagnosis loop you'd run the next time this error hits a real pipeline. The goal is to rule out each cause in order, from cheapest to most expensive, until you find the culprit.

```r
# Step 1: the broken pipeline (commented so the block runs cleanly)
# mtcars |> filter(MPG > 20) |> summarise(avg_hp = mean(hp))
# Error in `filter()`: object 'MPG' not found

# Step 2: inspect the name R complained about
missing_name <- "MPG"
exists(missing_name)
#> [1] FALSE

# Step 3: any case-insensitive match in the global environment?
ls()[tolower(ls()) == tolower(missing_name)]
#> character(0)

# Step 4: is it a column in the data frame we're operating on?
missing_name %in% names(mtcars)
#> [1] FALSE
tolower(missing_name) %in% names(mtcars)
#> [1] TRUE

# Step 5: found it — Cause 6 (dplyr NSE column typo). Fix with lowercase.
pipeline_result <- mtcars |>
  filter(mpg > 20) |>
  summarise(avg_hp = mean(hp))
pipeline_result
#>     avg_hp
#> 1 85.57143
```

Walking through the checks in this order — existence, case-insensitive match in `ls()`, column-name match — pins down the cause in under a minute for almost every real-world occurrence. The lowercase `mpg` fix is obvious once Step 4 reveals the mismatch.

## Summary

![Diagnostic flowchart for R's 'object not found' error](screenshots/R-Error-Object-Not-Found-diagnostic-flow.webp)
*Figure 1: How to diagnose which of the 7 causes is triggering your "object not found" error.*

The seven causes of `Error: object 'x' not found`, with the quickest fix for each:

| # | Cause | Symptom | Fix |
|---|---|---|---|
| 1 | Typo or case mismatch | `ls()` shows a similarly-named object | Match the name exactly (use Tab completion) |
| 2 | Forgot to assign with `<-` | Output prints but `exists()` is FALSE | Add `name <-` to the front of the expression |
| 3 | Package not loaded | Name lives in a package you haven't attached | `library(pkg)` or `pkg::name` |
| 4 | Ran code out of order | Line depends on an earlier line you skipped | Run the script top-to-bottom (Ctrl+Alt+B) |
| 5 | Different scope (function local) | Variable defined inside a function body | Return it as the function's value |
| 6 | dplyr column doesn't exist | Error inside `filter()` / `mutate()`, name is a column | Check `names(df)` and match case |
| 7 | Environment cleared / session restart | `ls()` is empty or sparse | Re-run the script or `source("analysis.R")` |

Keep `exists("name")`, `ls()`, and `names(df)` in your head as the three-step diagnosis — they rule out five of the seven causes in about ten seconds.

## References

1. R Core Team — *An Introduction to R*, Section 2.1: Lexical scope and environments. [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html)
2. Wickham, H. — *Advanced R*, 2nd Edition. Chapter 7: Environments. [Link](https://adv-r.hadley.nz/environments.html)
3. Wickham, H. — *Advanced R*, 2nd Edition. Chapter 6: Functions and lexical scoping. [Link](https://adv-r.hadley.nz/functions.html)
4. dplyr documentation — Programming with dplyr (non-standard evaluation). [Link](https://dplyr.tidyverse.org/articles/programming.html)
5. R FAQ — *Why doesn't R find my object?* [Link](https://cran.r-project.org/doc/FAQ/R-FAQ.html)
6. tidyverse style guide — assignment and naming conventions. [Link](https://style.tidyverse.org/syntax.html)
7. Posit (RStudio) — debugging with traceback() and debug(). [Link](https://support.posit.co/hc/en-us/articles/205612627-Debugging-with-the-RStudio-IDE)

## Continue Learning

- [50 R Errors Decoded: Plain-English Explanations and Exact Fixes](R-Common-Errors.html) — the parent reference covering all 50 most-common R error messages.
- [R Error: could not find function 'X' — Namespace & Package Conflicts](R-Error-Function-Not-Found.html) — the sibling error for *functions* not found, with namespace and masking details.
- [R Environments and Scoping](R-Environments.html) — the deeper explanation of how R's lookup chain actually works, which makes Causes 5 and 7 click.
