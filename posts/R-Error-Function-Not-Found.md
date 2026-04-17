---
title: "R Error: 'could not find function', Package Not Loaded or Name Conflict?"
slug: "R-Error-Function-Not-Found"
description: "Fix R's 'could not find function' error: check if the package is loaded, detect masked functions, and use package::function() to resolve namespace conflicts."
keywords: "R could not find function, R function not found, R package not loaded, R namespace conflict, R masked function, R search path, R library error"
auto_link_terms: "could not find function|function not found|could not find function error|masked function in R|function masking|R namespace conflict"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-13"
curriculum_id: "ERR10"
post_type: "FR"
fr_parent: "R-Common-Errors.html"
difficulty: "Intermediate"
---

# R Error: 'could not find function', Package Not Loaded or Name Conflict?

<p class="lead"><code>Error: could not find function "X"</code> means R walked every loaded package and the global environment without finding anything named <code>X</code>. The fix is almost always one of three things: load the package that owns the function, call it explicitly as <code>package::function()</code>, or correct a typo or masking conflict that is hiding it.</p>

## What does "could not find function" actually mean?

R resolves every function name by walking an ordered chain of environments called the **search path**. If nothing along that chain defines the name, you get this error. The fastest way to make the error stop feeling mysterious is to reproduce it on purpose, catch it with `tryCatch()`, and then print the chain R actually searched.

```r title="Reproduce the error and inspect search path"
# Step 1 — reproduce the error deliberately and capture the message
msg <- tryCatch(
  some_made_up_fn(1:5),
  error = function(e) conditionMessage(e)
)
msg
#> [1] "could not find function \"some_made_up_fn\""

# Step 2 — see the chain R walked before giving up
head(search(), 6)
#> [1] ".GlobalEnv"        "package:stats"     "package:graphics"
#> [4] "package:grDevices" "package:utils"     "package:datasets"
```

R started at `.GlobalEnv` (your workspace), then tried each attached package in load order, then `base`. `some_made_up_fn` does not exist in any of those, so the lookup fails and R raises the error. Every "could not find function" error is just this same walk coming up empty, the question becomes *why* the name you expected isn't on the chain.

[KEY INSIGHT]
**The search path is an ordered chain, not a bag.** R stops at the first match it finds, so the order in which packages are loaded decides which version of a duplicated name wins, and which one disappears.

**Try it:** Use `search()` and `length()` to count how many environments are currently on the search path. Save the number to `ex_n_pkgs`.

```r title="Exercise: count the search path"
# Try it: count the search path
ex_n_pkgs <- NA  # your code here
ex_n_pkgs
#> Expected: an integer around 8–10 in a fresh session
```

<details>
<summary>Click to reveal solution</summary>

```r title="Search-path count solution"
ex_n_pkgs <- length(search())
ex_n_pkgs
#> [1] 9
```

**Explanation:** `search()` returns a character vector of every environment on the lookup chain, so `length()` gives you the exact number R has to check before raising the error.

</details>

## How do I find which package a function belongs to?

Once you know the search path, the next question is: where does this function *actually* live? R has two small built-in helpers, `find()` and `getAnywhere()`, that tell you, and `apropos()` handles the case where you only remember part of the name.

```r title="Locate a function with find"
# Which attached package exports this function?
find("mean")
#> [1] "package:base"

find("lm")
#> [1] "package:stats"

# Search across every installed package — even ones you haven't loaded
getAnywhere("lowess")$where
#> [1] "package:stats" "namespace:stats"

# Partial-name search when you don't remember the exact spelling
apropos("^read\\.")
#> [1] "read.csv"   "read.csv2"  "read.delim" "read.delim2" "read.table"
```

`find("mean")` only scans the search path, so it will return `character(0)` for a function whose package you haven't loaded. `getAnywhere("lowess")` scans installed namespaces too, which is why it finds `lowess` even when `stats` is not attached in your particular session. `apropos()` takes a regular expression and lists every matching name, invaluable when you typed `Read.csv` and can't remember whether the real function is capitalised.

[TIP]
**Use ?? or help.search() when you don't know the function name at all.** Running `??"linear model"` queries the help index across every installed package and returns ranked matches, so you don't need to guess a function name to start searching.

**Try it:** Call `find()` on `"sd"` and save the result to `ex_sd_pkg`.

```r title="Exercise: locate sd with find"
# Try it: locate sd()
ex_sd_pkg <- NULL  # your code here
ex_sd_pkg
#> Expected: "package:stats"
```

<details>
<summary>Click to reveal solution</summary>

```r title="find-sd solution"
ex_sd_pkg <- find("sd")
ex_sd_pkg
#> [1] "package:stats"
```

**Explanation:** `sd()` is exported by the `stats` package, which is attached by default in every R session, so `find()` reports it as `package:stats`.

</details>

## Why does loading one package break a function from another?

When two packages export a function with the same name, the later-loaded one **masks** the earlier one. Your old code that called the first version now silently runs the second version, or crashes if the signatures differ. You can reproduce the exact same mechanic in a single session without loading anything, by defining a shadow function in the global environment.

```r title="Masking base::mean in global env"
# Shadow base::mean with a broken local version
mean <- function(x) "oops, wrong function"
mean(1:5)
#> [1] "oops, wrong function"

# The global environment is ahead of package:base on the search path
find("mean")
#> [1] ".GlobalEnv" "package:base"

# Recover by being explicit, then clean up the shadow
base::mean(1:5)
#> [1] 3
rm(mean)
mean(1:5)
#> [1] 3
```

The first call to `mean(1:5)` returns the string because `.GlobalEnv` sits at the front of the search path and R's walk stops there. `find("mean")` then shows *both* matches, in the order R would visit them. `base::mean(1:5)` bypasses the walk entirely and asks the `base` namespace directly, and `rm(mean)` removes the shadow so normal lookup resumes. Real package masking works exactly the same way, the only difference is that the masking function lives in `package:dplyr` or similar instead of `.GlobalEnv`.

[WARNING]
**R announces masking only when the package loads, and the notice scrolls off screen.** If you started your session an hour ago you will never see the warning about `dplyr::filter` masking `stats::filter`. Check `conflicts()` whenever a familiar function suddenly behaves strangely.

**Try it:** Define a broken shadow of `sum` that always returns `0`, call it on `1:10`, then compute the real total with `base::sum()` and save it to `ex_total`.

```r title="Exercise: shadow and recover sum"
# Try it: shadow and recover
sum <- function(x) 0  # your shadow here
# call the shadow, then recover
ex_total <- NA
ex_total
#> Expected: 55
```

<details>
<summary>Click to reveal solution</summary>

```r title="Shadow-and-recover solution"
sum <- function(x) 0
sum(1:10)
#> [1] 0
ex_total <- base::sum(1:10)
ex_total
#> [1] 55
rm(sum)
```

**Explanation:** The shadow `sum` lives in `.GlobalEnv` and is found first. `base::sum(1:10)` skips the search path and calls the `base` namespace directly, so the real sum comes through.

</details>

## When should I use package::function() instead of library()?

The `::` operator reaches straight into a package's namespace without attaching it to the search path. That makes it the right tool for one-off calls, for disambiguating masked functions, and for scripts you want to be self-documenting. Use `library()` when you need dozens of functions from the same package; use `::` when you only need one or when the reader should see exactly where a function came from.

```r title="Use :: without loading the package"
# Call a function without loading its package
stats::median(c(3, 1, 4, 1, 5, 9, 2, 6))
#> [1] 3.5

# Works the same for exported helpers
utils::head(mtcars, 3)
#>                mpg cyl disp  hp drat    wt  qsec vs am gear carb
#> Mazda RX4     21.0   6  160 110 3.90 2.620 16.46  0  1    4    4
#> Mazda RX4 Wag 21.0   6  160 110 3.90 2.875 17.02  0  1    4    4
#> Datsun 710    22.8   4  108  93 3.85 2.320 18.61  1  1    4    1

# A non-existent package fails early and loudly — useful signal
err <- tryCatch(
  nosuchpkg::foo(1),
  error = function(e) conditionMessage(e)
)
err
#> [1] "there is no package called 'nosuchpkg'"
```

Each `::` call is resolved at the moment it runs, so it never pollutes your search path and never changes the behavior of unrelated code. The last block also shows an important debugging signal: if you see `there is no package called 'X'` instead of `could not find function "foo"`, you are looking at a different problem, the package is not installed at all, and the fix is `install.packages("X")`, not `library(X)`.

[NOTE]
**`::` gives exported functions; `:::` reaches internal ones and is discouraged.** Internal functions are not part of a package's public contract, so they can change or disappear between versions without warning. Only use `:::` when you are debugging the package itself.

**Try it:** Use `base::nrow()` to get the row count of `mtcars` without loading anything, and save it to `ex_mt_rows`.

```r title="Exercise: namespace-qualified nrow"
# Try it: namespace-qualified call
ex_mt_rows <- NA  # your code here
ex_mt_rows
#> Expected: 32
```

<details>
<summary>Click to reveal solution</summary>

```r title="Namespace-qualified solution"
ex_mt_rows <- base::nrow(mtcars)
ex_mt_rows
#> [1] 32
```

**Explanation:** `base::nrow(mtcars)` calls `nrow` from the `base` namespace directly, bypassing any function with the same name that might be on the search path.

</details>

## What's a fast debug checklist when this error hits?

When the error appears in a script you cannot easily read line-by-line, run through these five questions in order. The first one whose answer is "no" is almost always the cause. R gives you the primitives to check each one in a single line.

```r title="Five-question debug checklist"
fn <- "mean"   # the function name from the error message
pkg <- "stats" # your best guess at its package

# 1. Is the name spelled correctly? (case matters)
exists(fn, mode = "function")
#> [1] TRUE

# 2. Is the package installed at all?
pkg %in% rownames(installed.packages())
#> [1] TRUE

# 3. Is the package attached in this session?
pkg %in% loadedNamespaces()
#> [1] TRUE

# 4. Is the name masked by something earlier on the search path?
length(find(fn)) > 1
#> [1] FALSE

# 5. Does a similarly spelled function exist? (catches renames/typos)
head(apropos("^mea"), 5)
#> [1] "mean"      "mean.Date" "mean.default" "mean.difftime" "mean.POSIXct"
```

Run the block above with `fn` and `pkg` set to whatever the error message said, and the failing check points straight at the cause. If step 1 fails the name is wrong; if step 2 fails you need `install.packages()`; if step 3 fails you need `library()` or `::`; if step 4 fails something is masking the function and you need `package::function()`; if step 5 returns near-misses you probably hit a renamed function from a package update.

[TIP]
**Keep `::` in any script you share.** It removes every bit of ambiguity about which package owns which function and makes the code robust to whatever load order the next reader's session happens to use.

**Try it:** Check whether the `tibble` package is currently loaded in your session and save the logical result to `ex_has_tibble`.

```r title="Exercise: check if tibble is loaded"
# Try it: is tibble loaded right now?
ex_has_tibble <- NA  # your code here
ex_has_tibble
#> Expected: TRUE or FALSE depending on your session
```

<details>
<summary>Click to reveal solution</summary>

```r title="Loaded-namespace solution"
ex_has_tibble <- "tibble" %in% loadedNamespaces()
ex_has_tibble
#> [1] FALSE
```

**Explanation:** `loadedNamespaces()` returns the names of every package whose namespace is loaded into this session. Membership testing with `%in%` gives you a single `TRUE`/`FALSE` answer.

</details>

## Practice Exercises

### Exercise 1: Write a missing-function diagnoser

Build a function `dx_missing(name)` that takes a function name as a string and returns a character vector. The first element is a verdict, one of `"ok"`, `"installed-but-not-loaded"`, or `"not-found"`, and any remaining elements are up to five near-miss candidates from `apropos()`. Test it on `"mean"`, `"Read.csv"`, and `"zzz_nope"` and save the last result to `my_dx`.

```r title="Exercise: write dxmissing helper"
# Exercise: write dx_missing()
# Hint: exists() handles the verdict; apropos() handles the near-misses.

dx_missing <- function(name) {
  # your code here
}

my_dx <- NA
my_dx
```

<details>
<summary>Click to reveal solution</summary>

```r title="dxmissing solution"
dx_missing <- function(name) {
  verdict <- if (exists(name, mode = "function")) {
    "ok"
  } else {
    near <- apropos(paste0("^", substr(name, 1, 3)), ignore.case = TRUE)
    if (length(near) > 0) "not-found" else "not-found"
  }
  near <- head(apropos(paste0("^", substr(name, 1, 3)), ignore.case = TRUE), 5)
  c(verdict, near)
}

dx_missing("mean")
#> [1] "ok"      "mean"    "mean.Date" "mean.default"

dx_missing("Read.csv")
#> [1] "not-found" "read.csv"  "read.csv2" "read.delim" "read.delim2" "read.table"

my_dx <- dx_missing("zzz_nope")
my_dx
#> [1] "not-found"
```

**Explanation:** `exists(name, mode = "function")` answers whether the exact name is bound to a function anywhere on the search path. `apropos()` with a short prefix and `ignore.case = TRUE` catches both capitalisation typos (`Read.csv` → `read.csv`) and genuinely missing names with similar spellings.

</details>

### Exercise 2: Detect every masking source for a name

Write `mask_check(fn_name)` that returns a character vector of every location currently offering a function with the given name, in search-path order. Use `getAnywhere()` and look at its `$where` component. Test it on `"filter"` after first defining a local `filter <- function(x) head(x, 3)`, save to `my_mask`, then clean up with `rm(filter)`.

```r title="Exercise: write maskcheck helper"
# Exercise: mask_check()
# Hint: getAnywhere(fn_name)$where is exactly the vector you need.

mask_check <- function(fn_name) {
  # your code here
}

filter <- function(x) head(x, 3)
my_mask <- NA
my_mask
```

<details>
<summary>Click to reveal solution</summary>

```r title="maskcheck solution"
mask_check <- function(fn_name) {
  getAnywhere(fn_name)$where
}

filter <- function(x) head(x, 3)
my_mask <- mask_check("filter")
my_mask
#> [1] ".GlobalEnv"       "package:stats"    "namespace:stats"

rm(filter)
mask_check("filter")
#> [1] "package:stats"    "namespace:stats"
```

**Explanation:** `getAnywhere()` scans both the search path and installed namespaces, so its `$where` field is exactly the list of places the name currently lives. Before `rm(filter)` there are two separate bindings competing; after, only the `stats` version remains.

</details>

## Complete Example: Debugging a broken script end-to-end

A reader's script fails with `could not find function "filter"`. The fix is a three-step walk: diagnose, try the wrong fix, then pick the right one. Below is the same reasoning chain in code.

```r title="Debug a broken filter call"
# The failing line is effectively this:
#   filter(mtcars, mpg > 25)
# But we captured the error first
my_bad <- tryCatch(
  filter(mtcars, mpg > 25),
  error = function(e) conditionMessage(e)
)
my_bad
#> [1] "could not find function \"filter\""

# Step 1 — who exports filter() on this machine?
getAnywhere("filter")$where
#> [1] "package:stats"    "namespace:stats"  "namespace:dplyr"
```

Two namespaces on this machine export `filter`: `stats` (the attached one) and `dplyr` (installed but not loaded). The reader wanted dplyr's data-frame filter, not the stats time-series filter, so the right fix is `dplyr::filter`, not `stats::filter`.

```r title="Fix with dplyr:: qualified call"
# Step 2 — call the right one explicitly, no library() needed
my_fixed <- dplyr::filter(mtcars, mpg > 25)
nrow(my_fixed)
#> [1] 6
```

One `::` call resolves the whole thing: no load order to worry about, no masking surprises if the script grows later, and the next reader can see at a glance exactly which `filter` was intended.

## Summary

| Cause | How to detect | Fix |
|---|---|---|
| Typo in function name | `exists("name", mode = "function")` is `FALSE`, `apropos()` shows near-misses | Correct the spelling; R is case-sensitive |
| Package not installed | `"pkg" %in% rownames(installed.packages())` is `FALSE` | `install.packages("pkg")` |
| Package installed but not loaded | `"pkg" %in% loadedNamespaces()` is `FALSE` | `library(pkg)` or `pkg::function()` |
| Masked by another package | `length(find("name")) > 1` | `package::function()` to disambiguate |
| Renamed in package update | `apropos()` shows a similarly named function | Check the package changelog for the new name |

## References

1. R Core Team. *An Introduction to R*, chapter on "The R environment". [cran.r-project.org/doc/manuals/r-release/R-intro.html](https://cran.r-project.org/doc/manuals/r-release/R-intro.html)
2. Wickham, H. *Advanced R*, 2nd edition, chapter 7, "Environments". [adv-r.hadley.nz/environments.html](https://adv-r.hadley.nz/environments.html)
3. R documentation, `?search`, `?find`, `?apropos`, `?conflicts`, `?getAnywhere`. [rdocumentation.org](https://www.rdocumentation.org/)
4. R Core Team. *Writing R Extensions*, section 1.6, "Package namespaces". [cran.r-project.org/doc/manuals/r-release/R-exts.html](https://cran.r-project.org/doc/manuals/r-release/R-exts.html)
5. tidyverse blog, "Loading packages and function masking". [tidyverse.org/blog](https://www.tidyverse.org/blog/)
6. Stack Overflow canonical question, "Error: could not find function" in R. [stackoverflow.com/q/7027288](https://stackoverflow.com/q/7027288)

## Continue Learning

1. **R Common Errors**, the full reference covering every error message R throws and how to read it.
2. **R Error: object 'x' not found**, the sibling error for *variables* rather than functions, with the same search-path intuition.
3. **R Functions**, how R defines, stores, and resolves functions, including first-class function semantics.
