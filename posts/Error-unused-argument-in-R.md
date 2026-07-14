---
title: "Fix 'unused argument' in R"
slug: "Error-unused-argument-in-R"
description: "R's unused argument error means the function cannot accept an argument you passed. See the 4 causes, from typos to package masking, with runnable fixes."
keywords: "unused argument, unused argument R, fix unused argument, unused argument error meaning, R error unused argument, select unused argument, dplyr unused arguments"
mathjax: false
webr: true
date: "2026-07-14"
post_type: "PSEO"
category_id: "error-message"
subcategory_id: "base-r-errors"
fr_parent: "R-Common-Errors.html"
auto_link_terms: "unused argument|unused arguments|unused argument error|unused-argument error|error: unused argument"
auto_link_case_sensitive: false
target_keyword: "unused argument"
sibling_block_enabled: true
difficulty: "Beginner"
---

# Fix 'unused argument' in R

<p class="lead">The error <code>unused argument</code> means you passed an argument the function does not accept: R matched your call against the function's parameter names and one argument was left with nowhere to go. The usual culprit is a misspelled argument name or a call that reached the wrong function, often one masked by another package.</p>

[QUICK ANSWER]
args(matrix)                           # list the real argument names
matrix(1:6, nrow = 2)                  # nrow, not nrows
grepl("red", x, ignore.case = TRUE)    # dots in names count too
dplyr::select(df, mpg)                 # bypass a masked select()
find("select")                         # who else defines this name?
rm(select)                             # drop your own shadow copy

## What this error means

**R could not find a home for one of your arguments.** When you call a function, R binds each argument you supply to a parameter the function declares: exact names first, then unambiguous abbreviations, then leftover values by position. An argument that survives all three rounds has nowhere to go. If the function has no `...` parameter to absorb extras, R stops and names the leftover.

The shortest way to trigger it is one misspelled name:

```r title="Reproduce the error in one line"
matrix(1:6, nrows = 2)
#> Error in matrix(1:6, nrows = 2) : unused argument (nrows = 2)
```

The parentheses quote exactly what R rejected, name and value. Read that first, because the answer is usually one `args()` call away:

```r title="Check the real names with args"
args(matrix)
#> function (data = NA, nrow = 1, ncol = 1, byrow = FALSE, dimnames = NULL) 
#> NULL

matrix(1:6, nrow = 2)
#>      [,1] [,2] [,3]
#> [1,]    1    3    5
#> [2,]    2    4    6
```

`matrix()` declares `nrow`, singular. `nrows` matches nothing, and there is no `...` to catch it.

[KEY INSIGHT]
**The fix is always one of two moves.** Either rename the argument to one the function declares, or realize the call reached a different function than you intended. Every cause below is a variation of those two.

## The four causes and their fixes

**Four situations produce nearly every unused argument error.** Check them in order. The first two cover most cases, and each takes under a minute to confirm.

### 1. A misspelled argument name

**The name you typed matches no declared parameter.** `rnorm()` declares `n`, `mean`, and `sd`, so one stray vowel breaks the call:

```r title="A typo R cannot place"
set.seed(42)
rnorm(3, meen = 100)
#> Error in rnorm(3, meen = 100) : unused argument (meen = 100)

rnorm(3, mean = 100)
#> [1] 101.3710  99.4353 100.3631
```

R does accept unambiguous abbreviations: `rnorm(3, m = 100)` runs because only `mean` starts with `m`. Partial matching only saves you when your spelling is a prefix of the real name. `meen` is a prefix of nothing, so it fails.

Watch for dots inside names too. Base R uses them everywhere, and dropping one produces the same error:

```r title="Dots in names count too"
grepl("red", c("Red", "blue", "DARK RED"), ignorecase = TRUE)
#> Error in grepl("red", c("Red", "blue", "DARK RED"), ignorecase = TRUE) : 
#>   unused argument (ignorecase = TRUE)

grepl("red", c("Red", "blue", "DARK RED"), ignore.case = TRUE)
#> [1]  TRUE FALSE  TRUE
```

### 2. Another package masked the function

**Your call reached a same-named function from a different package.** When two loaded packages export the same name, the one attached last wins. The classic collision is `select()`: dplyr's version takes a data frame and column names, while MASS's version takes a single fitted model object.

```r title="MASS masks dplyr select"
library(dplyr)
library(MASS)

select(mtcars, mpg)
#> Error in select(mtcars, mpg) : unused argument (mpg)
```

The call is valid dplyr code. It just never reached dplyr, because `library(MASS)` ran later and its `select()` sits in front. A column name means nothing to MASS's version, so `mpg` comes back as unused. The fix that always works is the double colon:

```r title="Call the version you meant"
dplyr::select(mtcars, mpg) |> head(3)
#>                mpg
#> Mazda RX4     21.0
#> Mazda RX4 Wag 21.0
#> Datsun 710    22.8
```

[TIP]
**Make masking loud instead of confusing.** The conflicted package turns every ambiguous call into an immediate error that names both packages and asks you to choose. Add `library(conflicted)` to scripts that load many packages and this whole cause disappears.

### 3. You redefined the name yourself

**A function you wrote earlier in the session shadows the package version.** Objects in your workspace sit in front of every package on R's search path. Name a helper `filter`, `select`, or `summary` and you quietly hijack every later call:

```r title="Your own name shadows dplyr"
filter <- function(x) x * 2

filter(mtcars, mpg > 30)
#> Error in filter(mtcars, mpg > 30) : unused argument (mpg > 30)
```

Your two-line helper declares one parameter, `x`, so the condition `mpg > 30` has no slot to land in. Delete your copy and the package version becomes reachable again:

```r title="Remove the shadowing copy"
rm(filter)

nrow(filter(mtcars, mpg > 30))
#> [1] 4
```

### 4. Your own function never declared the parameter

**The error is honest here: you are passing an option your function does not have.** This bites when you wrap other functions and forget to pass their options along:

```r title="A wrapper missing a parameter"
normalize <- function(x) (x - min(x)) / (max(x) - min(x))

normalize(c(2, 4, NA, 8), na.rm = TRUE)
#> Error in normalize(c(2, 4, NA, 8), na.rm = TRUE) : 
#>   unused argument (na.rm = TRUE)
```

Declare the parameter, or accept `...` and forward it to the functions inside:

```r title="Declare the parameter you need"
normalize <- function(x, na.rm = FALSE) {
  if (na.rm) x <- x[!is.na(x)]
  (x - min(x)) / (max(x) - min(x))
}

normalize(c(2, 4, NA, 8), na.rm = TRUE)
#> [1] 0.0000000 0.3333333 1.0000000
```

[NOTE]
**Coming from Python?** This is R's version of pandas' `TypeError: got an unexpected keyword argument`. The diagnosis is the same in both languages: the name in your call does not exist in the signature of the function you reached.

## When no error fires: the silent version

**A function with a `...` parameter swallows the typo instead of rejecting it.** That is the dangerous cousin of this error. `sum()` adds everything in its dots, so a misspelled `na.rm` becomes data:

```r title="Dots absorb a misspelled na.rm"
sum(1:3, narm = TRUE)
#> [1] 7
```

There is no error and no warning. `narm = TRUE` rides into `...`, `TRUE` counts as 1, and the total silently gains one. Two more classics:

```r title="Two more silent failures"
mean(c(1, 2, 3, 4, 100), trm = 0.2)
#> [1] 22

data.frame(x = 1:2, stringsAsFactor = FALSE)
#>   x stringsAsFactor
#> 1 1           FALSE
#> 2 2           FALSE
```

The misspelled `trm` is ignored, so no trimming happens and the outlier stays in; the correct `trim = 0.2` returns 3. And `data.frame()` turns the misspelled `stringsAsFactor` into a new column, because the real parameter ends in s: `stringsAsFactors`.

[WARNING]
**An unused argument error is the good outcome.** Functions without `...` catch the typo at the door. Functions with `...` let it walk in and quietly change your numbers. When a result looks wrong and no error fired, re-check the spelling of every named argument first.

## Diagnose it in 30 seconds

**Three commands identify the cause every time.** `args()` shows what the function declares, `find()` lists every package or environment that defines the name, and `environment()` reveals which definition a bare call reaches:

```r title="Trace which function answers"
find("select")
#> [1] "package:MASS"  "package:dplyr"

environmentName(environment(select))
#> [1] "MASS"
```

`find()` reports definitions in search order, and the first entry wins. If `".GlobalEnv"` tops the list, the shadow is your own. Two packages listed means masking.

| Clue | Likely cause | Fix |
|------|--------------|-----|
| The name is close to a real parameter | Typo | Spell it as `args()` shows |
| `find()` lists two packages | Masking | Call `pkg::fun()` directly |
| `find()` starts with ".GlobalEnv" | Your own redefinition | `rm()` your copy or rename it |
| The function is one you wrote | Missing parameter | Declare it or add `...` |

## How to avoid it next time

**Three habits eliminate nearly every repeat.**

- Namespace collision-prone verbs. In scripts that load several packages, write `dplyr::select()` and `dplyr::filter()` so load order stops mattering.
- Read the signature instead of guessing. `args(fun)` is instant, and `?fun` documents what each parameter expects.
- Never name your own helpers after popular functions. `filter`, `select`, `summary`, and `c` are each one careless assignment away from shadowing something you need.

## Try it yourself

**Try it:** The call below should build a 2 x 3 matrix from the numbers 1 to 6, but both argument names are wrong. Check `args(matrix)`, fix the call, and save the result to `ex_m`.

```r title="Your turn: fix both names"
# Try it: repair the matrix call
ex_m <- # your code here, starting from: matrix(1:6, nrows = 2, ncols = 3)

ex_m
#> Expected: a 2 x 3 matrix filled column by column
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_m <- matrix(1:6, nrow = 2, ncol = 3)
ex_m
#>      [,1] [,2] [,3]
#> [1,]    1    3    5
#> [2,]    2    4    6
```

**Explanation:** `matrix()` declares `nrow` and `ncol`, both singular. R rejects the plural spellings together in one message: `unused arguments (nrows = 2, ncols = 3)`.

</details>

## FAQ

<!-- faq: 4 real PAA (SerpAPI 2026-07-14) -->

**What does the unused argument error mean in R?**

It means the function cannot accept one of the arguments in your call. R matches supplied arguments to declared parameters by exact name, then by unambiguous abbreviation, then by position. Whatever remains unmatched triggers the error, and the message quotes the rejected argument in parentheses. It does not mean your value is wrong; it means the argument's name has no match in the function you actually called.

**Why does R say "could not find function %>%" instead?**

That is a different failure at an earlier stage. "Could not find function" means the name resolves to nothing at all, usually because the package providing it is not loaded. Unused argument means the name resolved fine but the function rejected what you passed. For the pipe specifically, load dplyr or magrittr first, or switch to the base pipe `|>`, which needs no package. See [could not find function](Error-could-not-find-function-X-in-R.html) for that error's own causes.

**How do I get rid of "unused variable" warnings in R?**

Those come from a different tool. Linters such as lintr, and check pipelines like `R CMD check`, warn about variables you created but never used. That is a style diagnostic, not a runtime error, and the R interpreter itself never raises it. Fix it by deleting the dead assignment or actually using the variable. The unused argument error on this page is unrelated: it is R refusing to run a call.

**Why does R keep saying "object not found"?**

That error concerns a variable, not a parameter. `object 'x' not found` means a name you referenced holds no value anywhere on the search path: a typo'd variable, a column used outside functions that do data masking, or code run out of order. Unused argument fires when the value arrived but its name matched no parameter. See [object not found](R-Error-Object-Not-Found.html) for the common triggers and fixes.

## Related R errors

Start with the parent guide, [common R errors and how to read them](R-Common-Errors.html). The R Language Definition's [argument matching section](https://cran.r-project.org/doc/manuals/r-release/R-lang.html#Argument-matching) specifies the exact matching order R follows. For neighbors of this error, see [could not find function](Error-could-not-find-function-X-in-R.html) for names that resolve to nothing, [object not found](R-Error-Object-Not-Found.html) for missing variables rather than rejected parameters, [object of type closure is not subsettable](Error-object-of-type-closure-is-not-subsettable-in-R.html) for another symptom of name collisions, and [functions in R](R-Functions.html) for declaring parameters, defaults, and `...` in your own code.
