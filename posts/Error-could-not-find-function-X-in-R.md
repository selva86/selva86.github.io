---
title: "Fix 'could not find function' in R"
slug: "Error-could-not-find-function-X-in-R"
description: "R's could not find function error means no loaded package defines that name. See the 4 causes, from a missing library() call to typos, each with a fix."
keywords: "could not find function, could not find function R, fix could not find function, R error could not find function, could not find function %>%, could not find function error meaning, library not loaded R"
mathjax: false
webr: true
date: "2026-07-14"
post_type: "PSEO"
category_id: "error-message"
subcategory_id: "base-r-errors"
fr_parent: "R-Common-Errors.html"
auto_link_terms: "could not find function|Error: could not find function|function not found error|could not find function %>%|cannot find a function"
auto_link_case_sensitive: false
target_keyword: "could not find function"
sibling_block_enabled: true
difficulty: "Beginner"
---

# Fix 'could not find function' in R

<p class="lead">The error <code>could not find function "X"</code> means R searched your workspace and every loaded package and found no function with that name. The usual cause is that the package owning the function was never loaded with <code>library()</code>, followed by plain typos.</p>

[QUICK ANSWER]
library(dplyr)                  # the usual fix: load the owning package
install.packages("dplyr")       # one-time install if loading fails
exists("select")                # FALSE means R cannot see the name
find("mean")                    # which package owns a visible function
dplyr::select(mtcars, mpg)      # call one function without attaching
sessionInfo()                   # list the packages currently loaded

## What this error means

**R resolves every function name at the moment you call it.** When you type `select(mtcars, mpg)`, R walks its search path: first your workspace, then each attached package in order, then base R. If no environment on that path defines `select`, the call stops with this error. The quoted name in the message is exactly what R looked for, spelling and capitalization included.

The shortest way to trigger it is to call a package function in a fresh session:

```r title="Reproduce the error"
select(mtcars, mpg)
#> Error in select(mtcars, mpg) : could not find function "select"
```

`select()` lives in the dplyr package. A fresh R session attaches only the base packages, so the name does not exist yet, no matter how many times you installed dplyr in the past.

[KEY INSIGHT]
**Installed and loaded are different states.** `install.packages()` copies files to disk once per machine. `library()` puts those functions on the search path, once per session. This error is almost always about loading, not installation.

## Diagnose it in 30 seconds

**Two base functions locate the problem.** `exists()` says whether R can see the name at all, and `find()` reports which attached package owns it:

```r title="Check what R can see"
exists("select")   # can R see the name right now?
#> [1] FALSE

exists("mean")     # a base function, for comparison
#> [1] TRUE

find("mean")       # which package owns it
#> [1] "package:base"
```

Match what you observe against this table:

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `exists("fn")` is FALSE and you never ran `library()` | Package not loaded this session | `library(pkg)` at the top of the script |
| `library(pkg)` itself fails with "there is no package" | Package not installed | `install.packages("pkg")` once |
| The quoted name looks almost right | Typo or wrong capitalization | Match the documented spelling exactly |
| Works in your console, fails on knit or `Rscript` | The fresh session never loads the package | Put `library()` calls inside the document |
| The message names `%>%` | Pipe package not attached | `library(magrittr)` or switch to the native pipe |

[TIP]
**When you do not know the owning package, ask R.** `??select` searches the documentation of every installed package, and `getAnywhere("select")` inspects loaded namespaces even when they are not attached.

## The four causes and their fixes

### 1. The package is not loaded

**This is the cause in most real sessions.** The function exists on disk, but the current session never attached its package. Load it, and the same call works:

```r title="Load the package then call"
library(dplyr)

head(select(mtcars, mpg), 3)
#>                mpg
#> Mazda RX4     21.0
#> Mazda RX4 Wag 21.0
#> Datsun 710    22.8
```

Every script should load its packages at the top, one `library()` call per line. The packages chapter of the official [An Introduction to R](https://cran.r-project.org/doc/manuals/r-release/R-intro.html#Packages) manual explains the attach mechanism in depth.

### 2. The package is not installed

**Loading fails when there is nothing to load.** If `library(dplyr)` answers with "there is no package called 'dplyr'", the package never made it onto this machine. Install it once, then load it every session:

```r title="Install once then load"
# install.packages("dplyr")   # run once per machine
library(dplyr)                # run in every session
```

This split trips people moving to a new computer or a fresh R upgrade: scripts full of `library()` calls fail until the packages are reinstalled.

### 3. A typo or wrong capitalization

**R is case-sensitive, so `Mean` and `mean` are different names.** The error message quotes the exact string R searched for, which makes typos easy to spot once you know to look:

```r title="Fix the capitalization"
Mean(c(2, 4, 9))
#> Error in Mean(c(2, 4, 9)) : could not find function "Mean"

mean(c(2, 4, 9))
#> [1] 5
```

Read the quoted name character by character. `lenght()`, `summarise()` versus `summarize()`, and stray autocomplete artifacts account for a surprising share of these errors.

### 4. The function is newer than your package version

**A current tutorial plus an old installation produces a missing function.** Packages gain functions over time; dplyr's `reframe()`, for example, only exists from version 1.1.0 onward. Check what you have:

```r title="Check the installed version"
packageVersion("dplyr")
#> [1] '1.2.1'
```

If your version predates the function you need, `update.packages()` or a fresh `install.packages("dplyr")` brings it in. The same applies to base R itself: code using the native pipe fails on R older than 4.1.0.

[WARNING]
**Knitting runs in a fresh session.** R Markdown and Quarto render documents in a new R process, so packages loaded in your console do not carry over. Code that works interactively still fails at render time unless the document itself calls `library()` in an early chunk.

## The %>% pipe case

**The pipe is a function too, and it lives in a package.** `%>%` comes from magrittr and is re-exported by dplyr and the rest of the tidyverse. Pasting piped code into a session with no packages loaded fails immediately:

```r title="The pipe needs its package"
# In a fresh session, mtcars %>% nrow() stops with:
# Error in mtcars %>% nrow() : could not find function "%>%"

library(magrittr)   # or library(dplyr), which re-exports the pipe
mtcars %>% nrow()
#> [1] 32
```

Since R 4.1.0 there is also the native pipe `|>`, which is part of base R and needs no package at all. If you keep hitting this error in short scripts, the native pipe removes the dependency.

## How to avoid it next time

**A few habits make this error rare.**

- Start every script with its `library()` calls, grouped in one block, so a fresh session can run it top to bottom.
- Use `pkg::fun()` for one-off calls, such as `dplyr::select()`. The `::` form works without attaching and documents where the function comes from.
- Restart R regularly and rerun from the top. A long-lived session hides missing `library()` lines until the worst moment.
- After following a tutorial, check versions with `packageVersion()` before assuming your code is wrong.

[NOTE]
**Coming from Python?** This is R's equivalent of `NameError: name 'x' is not defined` after a missing `import`. The fix is the same idea: load the module, or qualify the call with its package name.

## Try it yourself

**Try it:** The broken line below throws the missing-function error because of capitalization. Write the working call so `ex_total` holds the sum of 12, 6, and 9.

```r title="Your turn: fix the missing function"
# Sum(c(12, 6, 9)) fails: could not find function "Sum"
ex_total <- # your code here

ex_total
#> Expected: [1] 27
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_total <- sum(c(12, 6, 9))
ex_total
#> [1] 27
```

**Explanation:** R is case-sensitive, so `Sum` does not match the base function `sum`. Lowercasing the name lets R find it on the search path.

</details>

## FAQ

**Why is R saying "could not find function %>%"?**

Because the magrittr pipe was never attached in the current session. `%>%` is an operator function from the magrittr package, re-exported by dplyr and tidyverse. Run `library(dplyr)` or `library(magrittr)` before the piped code. On R 4.1.0 or newer you can also replace `%>%` with the native pipe `|>`, which belongs to base R and never triggers this error.

**Why is my object not being found in R?**

That is the sibling message, `object 'x' not found`, and it fires when a name is used as a value rather than called as a function. The line that creates the object never ran, ran with an error, or spelled the name differently. Rerun the creating line, then check with `exists("x")`. The [object not found error](R-Error-Object-Not-Found.html) guide walks through each case.

**Is there a find function in R?**

Yes. `find("mean")` returns which attached package defines a name, and `exists("mean")` answers whether the name is visible at all. For functions in installed but unattached packages, `getAnywhere("fn")` searches loaded namespaces, and `??fn` searches the help index of everything installed. Together they answer both halves of this error: does the function exist, and where does it live.

**What is the missing function in R?**

In this error, the missing function is whatever name appears in quotes: R searched the workspace and all attached packages and found no function with that name. Separately, base R has a function called `missing()`, which tests inside a function whether a caller supplied an argument. The two are unrelated; `missing()` is about arguments, while this error is about name lookup.

## Related R errors

Start with the parent guide to [common R errors and how to read them](R-Common-Errors.html). This error has a mirror: parentheses on a data object report a missing function, while brackets on a function report [object of type closure is not subsettable](Error-object-of-type-closure-is-not-subsettable-in-R.html). For the mechanics behind the fixes, see [installing and loading packages](Install-and-Load-Packages.html), [the pipe operator in R](R-Pipe-Operator.html), and [R environments](R-Environments.html) for how the search path resolves names.
