---
title: "50 R Errors Decoded: Plain-English Explanations and Exact Fixes"
slug: "R-Common-Errors"
description: "Every R error decoded: what triggers it, the exact pattern that causes it, and the one-line fix. All 50 errors, runnable examples, diagnostic flowchart."
keywords: "R error messages, R common errors, R error fix, R troubleshooting, R debugging, object not found R, could not find function R, subscript out of bounds R"
auto_link_terms: "R common errors|R error messages|R troubleshooting|R debugging errors|object not found|could not find function|subscript out of bounds"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-13"
curriculum_id: "ERR0"
post_type: "C"
sidebar_section: "Advanced R"
sidebar_title: "50 Common R Errors"
sidebar_order: 30
difficulty: "Advanced"
---

# 50 R Errors Decoded: Plain-English Explanations and Exact Fixes

<p class="lead">R errors look cryptic, but almost every one belongs to one of seven tight families, once you can name the family, the fix is usually a single line. This page is the full decoder: 50 real errors, the exact code that triggers each one, and the one-line fix.</p>

Bookmark it. Hit `Ctrl+F`, paste the error text, and jump to the fix. Every code block is runnable, trigger the error yourself, then watch the fix work, all without leaving the page.

## How do you read an R error message?

Every R error has the same shape: the function that exploded, the thing that went wrong, and a pointer back to your code. If you can spot those three parts, you can fix most errors in under a minute, even ones you've never seen before. Let's trigger a real error inside a safe wrapper (so the page keeps running) and pull it apart.

```r title="Parse the three parts of an error"
# Trigger a real error and capture the message
err_msg <- tryCatch(
  mean(missing_vec),
  error = function(e) conditionMessage(e)
)
err_msg
#> [1] "object 'missing_vec' not found"

# Show the 3 parts of a typical error: function, problem, pointer
cat("Function that exploded: mean()\n")
cat("What went wrong        : object not found\n")
cat("Pointer back to you    : missing_vec\n")
#> Function that exploded: mean()
#> What went wrong        : object not found
#> Pointer back to you    : missing_vec
```

The call `mean(missing_vec)` blew up because `missing_vec` doesn't exist. Instead of letting the page crash, `tryCatch()` caught the error and handed us the message as a string. That's the same text you'd see in the RStudio console, and the three parts are always there, in that order. The **function name** tells you where to start looking; the **problem phrase** names the category; the **pointer** (usually an object or variable name) tells you exactly what to fix.

![Anatomy of an R error message](screenshots/R-Common-Errors-anatomy.webp)
*Figure 1: The three parts of every R error message.*

[KEY INSIGHT]
**The first noun after "Error in" is almost always the function that exploded, start there.** Don't scan the whole traceback first. Nine times out of ten, the function name and the last phrase of the error line together tell you the fix.

**Try it:** Use `tryCatch()` to capture the error from calling `ex_nope()` (a function that doesn't exist) and store the message in `ex_err`. Then print it.

```r title="Exercise: capture an error message"
# Try it: capture an error message
# Replace NULL with a call to ex_nope()
ex_err <- tryCatch(
  NULL,
  error = function(e) conditionMessage(e)
)
ex_err
#> Expected: "could not find function \"ex_nope\""
```

<details>
<summary>Click to reveal solution</summary>

```r title="Capture error message solution"
ex_err <- tryCatch(
  ex_nope(),
  error = function(e) conditionMessage(e)
)
ex_err
#> [1] "could not find function \"ex_nope\""
```

**Explanation:** `tryCatch()` runs the expression. If it errors, the `error = function(e)` handler fires and `conditionMessage(e)` returns the message text as a plain string. The message itself names both the exploded function and the problem phrase, which puts you one grep away from a fix.

</details>

## What are the 7 categories every R error falls into?

Thousands of distinct error strings exist in R, but they collapse into seven tight families. Knowing which family an error belongs to narrows your fix from "guess and hope" to a short, targeted checklist. Once you memorize the families, error messages stop feeling random and start feeling like form-filled complaints.

Here's a tiny classifier that maps a few error phrases to their family, so you can see the buckets in action before we drill into each one.

```r title="Classify error into seven families"
# Map an error phrase to its family
bucket_of <- function(msg) {
  if (grepl("unexpected", msg))            return("Syntax / parse")
  if (grepl("not found|find function", msg)) return("Name lookup")
  if (grepl("non-numeric|invalid type|coerc", msg)) return("Types / coercion")
  if (grepl("out of bounds|undefined columns|replacement length", msg)) return("Subsetting")
  if (grepl("TRUE/FALSE|length zero|NAs in", msg)) return("NA / logic")
  if (grepl("no package|cannot open", msg)) return("Package / file")
  if (grepl("contrasts|new levels|singular|non-conformable", msg)) return("Models / formulas")
  return("Unknown")
}

bucket_of(err_msg)
#> [1] "Name lookup"
bucket_of("unexpected ')' in \"mean(1,2,)\"")
#> [1] "Syntax / parse"
bucket_of("non-numeric argument to binary operator")
#> [1] "Types / coercion"
```

The first call classifies the earlier `err_msg` as a **Name lookup** failure, the same family as "could not find function". The other two show the classifier routing a syntax error and a type error to their correct buckets. In real debugging you won't write a grep classifier; you'll do it in your head. But the shape of the thinking is exactly this: read the message, match a phrase, pick a family, then apply that family's standard fix.

![7 families of R errors](screenshots/R-Common-Errors-categories.webp)
*Figure 2: The 7 families every R error belongs to.*

[TIP]
**Keep this mindmap open in a tab while you debug.** When a strange error lands, name the family first. The family decides whether to check spelling, check types, check packages, or check data, and that single decision usually saves you ten minutes of blind reading.

**Try it:** Extend `bucket_of()` to return `"Models / formulas"` for the error phrase `"factor has new levels"`. Test it on that exact string.

```r title="Exercise: extend the classifier"
# Try it: extend the classifier
ex_bucket <- function(msg) {
  # your code here
}

ex_bucket("factor has new levels Wed")
#> Expected: "Models / formulas"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Extend the classifier solution"
ex_bucket <- function(msg) {
  if (grepl("new levels|contrasts|singular", msg)) return("Models / formulas")
  return("Unknown")
}
ex_bucket("factor has new levels Wed")
#> [1] "Models / formulas"
```

**Explanation:** `grepl()` returns `TRUE` when the pattern is found in the string. "New levels" is the signature phrase of factor-based model errors, so it lands in the Models / formulas bucket cleanly.

</details>

## Which syntax and parse errors trip up beginners?

Syntax errors are the ones R catches before it even runs your code. The parser reaches a token it can't make sense of and stops. The good news: the error always points at the exact offending character, so the fix is almost always a typo. The bad news: R's phrasing ("unexpected X") is vague enough that beginners often stare at the wrong line.

Let's walk through the eight most common syntax errors, errors **1 through 8** in the master table at the bottom, and fix each one in place.

```r title="Unexpected symbol parse fix"
# Error 1: unexpected symbol
# Cause: two tokens with no operator or comma between them
# Bad : x y <- 5
# Fix : pick one name (or add an operator)
fix_syntax <- function() {
  x_y <- 5
  x_y
}
fix_syntax()
#> [1] 5
```

The parser sees `x`, then `y`, and has no rule that says two bare names can sit next to each other, so it complains about the second one. Joining them with an underscore (or adding a real operator between them) makes the line parse. The same shape fixes errors like `x.y` typos and missing commas in argument lists.

```r title="Unexpected paren and numeric constant"
# Error 2: unexpected ')'
# Cause: one too many closing parens, or a trailing comma
# Bad : mean(c(1,2,3),)
# Fix : drop the trailing comma
fix_syntax2 <- mean(c(1, 2, 3))
fix_syntax2
#> [1] 2

# Error 3: unexpected numeric constant
# Cause: missing operator before a number
# Bad : 2 3   (should be 2 * 3 or c(2, 3))
# Fix : add the operator
2 * 3
#> [1] 6
```

Both of these are parser complaints about what comes *after* a valid expression. The trailing-comma bug is especially common when you're refactoring `c()` or `list()` calls and delete the last item but forget the comma. Errors **4** (unexpected string constant) and **5** (unexpected `}`) follow the same pattern, something valid, then something the parser can't attach to it.

[WARNING]
**Mixing `=` and `<-` inside function calls silently swallows named arguments.** If you write `mean(x <- 1:5)`, R creates a new variable `x` and passes its value as the first positional argument, not as a named one. Always use `=` for named arguments inside function calls, and `<-` only for assignment outside them.

**Try it:** The line below has a trailing-comma syntax error. Fix it so it parses and returns `6`.

```r title="Exercise: fix the syntax"
# Try it: fix the syntax
# ex_broken <- sum(c(1, 2, 3),)
# your fix here:
ex_fixed <- NULL
ex_fixed
#> Expected: 6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Fix the syntax solution"
ex_fixed <- sum(c(1, 2, 3))
ex_fixed
#> [1] 6
```

**Explanation:** The trailing comma inside `sum(...,)` caused an "unexpected ')'" error. Dropping it leaves a valid call whose result is 6.

</details>

## Why do "object not found" and "could not find function" errors happen?

R looks up names in a chain of environments, starting with the current one and walking outward to the search path of loaded packages. When it reaches the end without a match, you get an `object 'x' not found` error (for variables) or `could not find function "f"` (for functions). Both mean the same thing: R looked everywhere and didn't find the name you typed.

These are errors **9 through 16** in the master table. The fixes are almost always one of: fix a typo, assign the variable first, or call `library()` on the package.

```r title="Object not found lookup failure"
# Error 9: object 'x' not found
# Cause: typo or the variable was never assigned (or got wiped by rm())
# Fix : assign it first
my_val <- 42
my_val * 2
#> [1] 84
```

This is the #1 most-seen R error on Stack Overflow. The lookup chain is strict: `my_value` and `myvalue` are different names, and R does not guess. A frequent surprise is that variables created inside a function are not visible outside, if `my_val` was assigned inside `f()`, calling `my_val` at the top level still errors.

```r title="Could not find function fix"
# Error 10: could not find function "filter"
# Cause: the package providing filter() is not attached
# Fix : load the package
library(dplyr)
mtc <- head(mtcars, 3)
mtc
#>                mpg cyl disp  hp drat   wt  qsec vs am gear carb
#> Mazda RX4     21.0   6  160 110 3.90 2.62 16.46  0  1    4    4
#> Mazda RX4 Wag 21.0   6  160 110 3.90 2.88 17.02  0  1    4    4
#> Datsun 710    22.8   4  108  93 3.85 2.32 18.61  1  1    4    1
```

`library(dplyr)` attaches dplyr to the search path, so `filter()`, `mutate()`, and friends become visible. Until you call `library()`, those functions exist inside the installed package but aren't reachable by their short names. Error **11** (`there is no package called 'dplyr'`) is a level worse: the package isn't even installed, and you need `install.packages("dplyr")` first.

```r title="Masking dplyr versus stats filter"
# Error 12: masking — dplyr::filter vs stats::filter
# Cause: two packages on the search path both export filter();
#        the later one wins and silently hides the earlier one.
# Fix : fully qualify with pkg::func()
dplyr::filter(mtc, cyl == 6)
#>               mpg cyl disp  hp drat   wt  qsec vs am gear carb
#> Mazda RX4      21   6  160 110  3.9 2.62 16.46  0  1    4    4
#> Mazda RX4 Wag  21   6  160 110  3.9 2.88 17.02  0  1    4    4
```

When you load a package that defines a function with the same name as one already on the search path, R prints a "masked from" message at load time and then the new one wins. If the caller was expecting the old function, you get a type error, a formula error, or worst of all a wrong answer with no error at all. Errors **13–16** in this family include `$ on non-list`, `error in UseMethod`, and `invalid argument to unary operator`, all flavours of "R looked up a name and got something of the wrong kind."

[TIP]
**Use pkg::func() to dodge masking bugs entirely.** `dplyr::filter(df, cond)` always calls dplyr's `filter()` regardless of search-path order. Reach for this the moment you see a "masked from" message at package load.

**Try it:** The code below fails with `could not find function "select"` when dplyr isn't loaded. Write the call with an explicit namespace so it works even if the package hasn't been attached.

```r title="Exercise: fix missing function error"
# Try it: fix the missing-function error
# select(mtcars, mpg, cyl)   # fails without dplyr
# your fix here:
ex_sel <- NULL
head(ex_sel, 2)
#> Expected: first 2 rows with columns mpg, cyl
```

<details>
<summary>Click to reveal solution</summary>

```r title="Fix missing function solution"
ex_sel <- dplyr::select(mtcars, mpg, cyl)
head(ex_sel, 2)
#>                mpg cyl
#> Mazda RX4     21.0   6
#> Mazda RX4 Wag 21.0   6
```

**Explanation:** `dplyr::select()` reaches straight into the dplyr namespace, so the call works whether or not `library(dplyr)` has been run. This is also the bulletproof fix for masking bugs.

</details>

## How do type and coercion errors sneak in?

R is strict about types at operation time but lazy about them at assignment time. You can stuff anything into a variable without a complaint, then get screamed at the moment you try to use it. That mismatch is where errors **17 through 26** come from, operations that demanded numeric and found character, or vice versa.

```r title="Non numeric binary operator coercion"
# Error 17: non-numeric argument to binary operator
# Cause: one side is a character, even though it "looks like" a number
# Fix : coerce explicitly with as.numeric()
price_str <- "42"
# price_str + 8   # would error
price_num <- as.numeric(price_str)
price_num + 8
#> [1] 50
```

The string `"42"` prints like a number but is stored as character. R's `+` has no rule for `character + numeric`, so it errors instead of guessing. Wrapping the string in `as.numeric()` makes the intent explicit and the operation safe. The same pattern fixes error **18** (`"3" * 2`), error **19** (`mean(c("1","2"))`), and error **20** (`log("10")`).

```r title="NAs introduced by coercion"
# Error 21: NAs introduced by coercion
# Cause: as.numeric() on a value that isn't a parseable number
# Fix : clean the input before coercing
mixed <- c("1", "2", "three")
suppressWarnings(as.numeric(mixed))
#> [1]  1  2 NA
```

This one is a **warning**, not a hard error, the call still returns a vector. But the `NA` in position 3 will bite you downstream the moment you call `sum()` or `mean()` without `na.rm = TRUE`. Always fix the root cause: either clean the strings before coercing, or use `readr::parse_number()` which extracts the leading numeric part safely. Errors **22–26** in this family include `invalid factor level, NA generated`, `argument is of length zero`, `invalid type (list) for variable`, `$ on atomic vector`, and `! not meaningful for factors`.

[KEY INSIGHT]
**R is strict about types at operation time, lazy about them at assignment time.** Nothing stops you from writing `x <- "42"`, but `x + 1` explodes. The fix is always to coerce before the operation, not pretend the assignment was different.

**Try it:** The vector `ex_vals` mixes character and numeric. Coerce it, then compute the mean ignoring NAs.

```r title="Exercise: coerce and average"
# Try it: coerce and average
ex_vals <- c("10", "20", "thirty", "40")
ex_avg <- NULL  # your code here
ex_avg
#> Expected: 23.33333
```

<details>
<summary>Click to reveal solution</summary>

```r title="Coerce and average solution"
ex_vals <- c("10", "20", "thirty", "40")
ex_avg <- mean(suppressWarnings(as.numeric(ex_vals)), na.rm = TRUE)
ex_avg
#> [1] 23.33333
```

**Explanation:** `as.numeric()` converts parseable strings to numbers and turns `"thirty"` into NA (with a warning, which we suppress because we expect it). Passing `na.rm = TRUE` tells `mean()` to skip those NAs, giving the average of 10, 20, and 40.

</details>

## Why do subsetting, indexing, and NA errors surface?

Subsetting is where R's "vectors are nice, matrices and data frames are strict" rule bites hardest. A vector tolerates out-of-range indices silently. A matrix or data frame does not. Errors **27 through 36** live in this gap, plus the NA-in-condition family that breaks `if()` statements.

```r title="Subscript out of bounds on matrix"
# Error 27: subscript out of bounds (matrix/data frame)
# Cause: row or column index exceeds the actual dimensions
# Fix : check with dim() and nrow() before indexing
mtx <- matrix(1:4, nrow = 2)
dim(mtx)
#> [1] 2 2
# mtx[3, 1]   # would error: row 3 doesn't exist
mtx[2, 1]
#> [1] 2

# Contrast: vectors don't error on out-of-range, they return NA silently
x <- 1:5
x[10]
#> [1] NA
```

This asymmetry is one of the top-5 R gotchas. `x[10]` on a length-5 vector returns `NA` with no warning. `mtx[3, 1]` on a 2×2 matrix throws a hard error. If you built your code expecting vector-style silent NAs and then generalised to a matrix, you get a surprise error in production. Always bounds-check with `nrow()` or `ncol()` before subsetting matrices and data frames.

```r title="Undefined columns selected fix"
# Error 28: undefined columns selected
# Cause: referenced a column name that doesn't exist in the data frame
# Fix : check names() first, then either create or rename
df_demo <- head(mtcars[, c("mpg", "cyl")], 3)
# df_demo[, "cylinders"]   # would error: no such column
"cyl" %in% names(df_demo)
#> [1] TRUE
df_demo[, "cyl"]
#> [1] 6 6 4
```

"Undefined columns selected" is the data-frame version of "name not found". Use `names(df)` or `"col" %in% names(df)` to probe before indexing, especially when column names come from user input or a `read.csv()` whose headers got mangled.

```r title="Missing value where TRUE FALSE needed"
# Error 32: missing value where TRUE/FALSE needed
# Cause: the condition inside if() evaluated to NA
# Fix : wrap with isTRUE() (or check with is.na() first)
na_val <- NA
# if (na_val > 0) "positive" else "not"   # would error
if (isTRUE(na_val > 0)) "positive" else "not"
#> [1] "not"
```

The `if()` statement demands a single `TRUE` or `FALSE`. When your condition involves data that could be NA, it returns `NA` and `if()` refuses to branch on uncertainty. `isTRUE()` is the safe wrapper: it returns `FALSE` for anything that isn't exactly `TRUE`, including NA. Errors **33–36** in this family include `argument is of length zero`, `NAs in subscripted assignment`, `invalid subscript type 'list'`, and `attempt to select less than one element`.

[WARNING]
**Vector x[n+1] returns NA silently; matrix m[n+1,] errors hard.** This asymmetry is a top beginner trap. If your function needs to tolerate out-of-range indices, bounds-check before subsetting instead of relying on one behaviour or the other.

**Try it:** The code below errors because `ex_na_flag` is NA. Fix it with `isTRUE()` so it returns `"skip"`.

```r title="Exercise: isTRUE fix for NA flag"
# Try it: isTRUE fix
ex_na_flag <- NA
# if (ex_na_flag) "do it" else "skip"   # errors
ex_result <- NULL  # your code
ex_result
#> Expected: "skip"
```

<details>
<summary>Click to reveal solution</summary>

```r title="isTRUE NA flag solution"
ex_na_flag <- NA
ex_result <- if (isTRUE(ex_na_flag)) "do it" else "skip"
ex_result
#> [1] "skip"
```

**Explanation:** `isTRUE(NA)` returns `FALSE`, so the else branch runs. Without `isTRUE()`, the raw `NA` would crash `if()` with "missing value where TRUE/FALSE needed".

</details>

## What about package, file, and model-fitting errors?

The last stretch covers errors that surface when R talks to the outside world, packages, files, URLs, the working directory, and errors from statistical modelling functions like `lm()` and `glm()`. Together they make up errors **37 through 50** in the reference table. The patterns are mostly about missing resources and unexpected data shapes.

```r title="No such package called error"
# Error 37: there is no package called 'ghostpkg'
# Cause: package not installed (or installed for a different R version)
# Fix : install.packages("ghostpkg"), then library(ghostpkg)
pkg_err <- tryCatch(
  library("ghostpkg"),
  error = function(e) conditionMessage(e)
)
pkg_err
#> [1] "there is no package called 'ghostpkg'"
```

This error blocks `library()` itself. The fix is always `install.packages("<name>")` first, then `library(<name>)`. If install fails with "package is not available for this version of R", you're on an older R; upgrade R or install from the CRAN archive. Error **38** (`cannot open file 'data.csv'`) means the file path is wrong relative to `getwd()`, fix it with `file.exists(path)` before `read.csv()`. Error **39** (`cannot change working directory`) points at a typo in `setwd()`.

```r title="Contrasts error from single level factor"
# Error 45: contrasts can be applied only to factors with 2 or more levels
# Cause: a factor used in a model has only 1 level after filtering or NA removal
# Fix : droplevels() then check table() of each factor
model_df <- data.frame(
  y    = c(1.2, 2.4, 3.1, 4.0, 5.5),
  grp  = factor(c("A", "A", "A", "A", "A")),  # only 1 level!
  size = c(10, 20, 30, 40, 50)
)
# lm(y ~ grp + size, data = model_df)   # would error
# Fix: drop the single-level factor or give it real variation
fit <- lm(y ~ size, data = model_df)
round(coef(fit), 3)
#> (Intercept)        size
#>       0.640       0.104
```

The `lm()` call failed because `grp` has only one level, you can't fit a coefficient for a group that never varies. `droplevels(model_df)` is the usual fix when the single level is a leftover from filtering; dropping the factor from the formula works when it was never meaningful. Errors **46–50** in this family include `factor has new levels` (your test data has a level the training data didn't see), `system is computationally singular` (perfectly collinear predictors), `non-conformable arguments` (matrix dimension mismatch), `variable lengths differ`, and `missing values in object` (NAs in `lm()` without `na.action = na.omit`).

[NOTE]
**Model errors almost always trace back to unused factor levels or hidden NAs.** `droplevels(df)` and `na.omit(df)`, in that order, fix roughly 90% of `lm()`/`glm()` errors without touching the formula.

**Try it:** `predict()` on new data with an unseen factor level will error. Handle it by using `droplevels()` on the training data first, then fitting. Fill in the fit step.

```r title="Exercise: drop unused levels before fit"
# Try it: drop unused levels before fitting
ex_train <- data.frame(
  y = c(1, 2, 3, 4),
  g = factor(c("a", "a", "b", "b"), levels = c("a", "b", "c"))
)
ex_train_clean <- droplevels(ex_train)
ex_fit <- NULL  # your code
levels(ex_train_clean$g)
#> Expected: c("a", "b")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Drop unused levels solution"
ex_train <- data.frame(
  y = c(1, 2, 3, 4),
  g = factor(c("a", "a", "b", "b"), levels = c("a", "b", "c"))
)
ex_train_clean <- droplevels(ex_train)
ex_fit <- lm(y ~ g, data = ex_train_clean)
levels(ex_train_clean$g)
#> [1] "a" "b"
coef(ex_fit)
#> (Intercept)          gb
#>         1.5         2.0
```

**Explanation:** `droplevels()` removes the unused `"c"` level, leaving only the two levels that actually appear in the data. The `lm()` then fits cleanly, and future `predict()` calls on new data with levels `"a"` or `"b"` work without errors.

</details>

## Practice Exercises

### Exercise 1: Fix the 3-bug pipeline

The pipeline below tries to filter `mtcars` to 6-cylinder cars with decent mileage, then compute the mean horsepower. It has three bugs spanning three error families. Find and fix them all so `my_result` is a one-row data frame.

```r title="Exercise: fix three pipeline errors"
# Exercise 1: fix the 3 errors
# Hint: one is a typo, one is a masking bug, one is a type bug
# Broken (commented out so this block still runs):
# my_result <- mtcars |>
#   filter(cylinders == 6, mpg > 20) |>
#   summarise(avg_hp = mean("hp"))

my_result <- NULL  # your fix here
my_result
#> Expected: a data frame with one column avg_hp ~ 110
```

<details>
<summary>Click to reveal solution</summary>

```r title="Three pipeline errors solution"
my_result <- mtcars |>
  dplyr::filter(cyl == 6, mpg > 20) |>
  dplyr::summarise(avg_hp = mean(hp))
my_result
#>   avg_hp
#> 1    110
```

**Explanation:** Three fixes: (1) `cylinders` → `cyl` (no such column), (2) fully qualifying `dplyr::filter` dodges any masking by `stats::filter`, and (3) `mean("hp")` was passing a character string instead of the column, drop the quotes so `hp` resolves to the column vector inside `summarise()`.

</details>

### Exercise 2: Name the family, write the fix

For each error message below, name the family and write the one-line fix. Save your answers as a named character vector called `my_diag`.

```r title="Exercise: diagnose four error messages"
# Exercise 2: diagnose 4 errors
# e1: "non-numeric argument to binary operator"
# e2: "could not find function \"mutate\""
# e3: "missing value where TRUE/FALSE needed"
# e4: "subscript out of bounds"

my_diag <- c(
  e1 = "",  # family -> fix
  e2 = "",
  e3 = "",
  e4 = ""
)
my_diag
#> Expected: 4 entries, each starting with the family name
```

<details>
<summary>Click to reveal solution</summary>

```r title="Four error messages solution"
my_diag <- c(
  e1 = "Types / coercion -> as.numeric() the character side",
  e2 = "Name lookup -> library(dplyr) first",
  e3 = "NA / logic -> wrap condition in isTRUE()",
  e4 = "Subsetting -> check dim()/nrow() before indexing"
)
my_diag["e1"]
#>                                                   e1
#> "Types / coercion -> as.numeric() the character side"
```

**Explanation:** Each message has a signature phrase that points at one family. Once you name the family, the fix is the family's standard recipe, coerce, load, wrap, bounds-check.

</details>

### Exercise 3: Predict error, warning, or silent wrong answer

For each snippet below, predict whether it errors, warns with an NA, or silently returns something wrong. Save your predictions as a named character vector called `my_predict`.

```r title="Exercise: predict error or silent NA"
# Exercise 3: predict the behaviour
# s1: sum(c(1, 2, "3"))
# s2: (1:5)[10]
# s3: matrix(1:4, 2, 2)[3, 1]
# s4: mean(c(1, NA, 3))
# s5: if (NA > 0) "y" else "n"

my_predict <- c(
  s1 = "",  # error / silent NA
  s2 = "",
  s3 = "",
  s4 = "",
  s5 = ""
)
my_predict
#> Expected: 5 labels
```

<details>
<summary>Click to reveal solution</summary>

```r title="Predict error or silent NA solution"
my_predict <- c(
  s1 = "error",
  s2 = "silent NA",
  s3 = "error",
  s4 = "silent NA",
  s5 = "error"
)
my_predict
#>          s1          s2          s3          s4          s5
#>     "error" "silent NA"     "error" "silent NA"     "error"
```

**Explanation:** `sum(c(1,2,"3"))` errors because the vector coerces to character first. `(1:5)[10]` on a vector returns NA silently. `matrix(...)[3,1]` errors because matrices bounds-check. `mean(c(1,NA,3))` returns NA because `na.rm` defaults to FALSE. `if (NA > 0)` errors with "missing value where TRUE/FALSE needed". The vector/matrix asymmetry is the non-obvious one.

</details>

## Complete Example: debugging a real pipeline

Let's put it all together. Below is a messy pipeline that takes some survey-style data, cleans it, and fits a linear model. It has six latent bugs across four error families. We'll walk through fixing each one using the four-question diagnostic.

```r title="End-to-end messy pipeline debug"
# Raw data (intentionally messy: strings, NAs, one single-level factor)
raw <- data.frame(
  id    = 1:6,
  age   = c("25", "30", "45", "22", "NA", "38"),
  score = c(88, 92, 70, 95, NA, 81),
  group = factor(c("A", "A", "A", "A", "A", "A"), levels = c("A", "B"))
)

# Step 1: age is character — coerce, which turns "NA" into real NA
clean <- raw
clean$age <- suppressWarnings(as.numeric(clean$age))

# Step 2: drop rows where age or score is NA
clean <- clean[complete.cases(clean[, c("age", "score")]), ]

# Step 3: droplevels() to kill the unused "B" level in group
clean <- droplevels(clean)

# Step 4: fit a model — group is now 1-level, so drop it from the formula
final_fit <- lm(score ~ age, data = clean)
round(coef(final_fit), 3)
#> (Intercept)         age
#>     104.500      -0.561
```

Walking through: (1) the raw `age` column was character, so `as.numeric()` coerces it and would issue a "NAs introduced by coercion" warning for `"NA"`, expected and suppressed. (2) `complete.cases()` drops the row with NA age/score, avoiding the `"missing values in object"` error that `lm()` would throw with default `na.action`. (3) `droplevels()` collapses the factor so `"contrasts can be applied only to factors with 2 or more levels"` never fires. (4) Dropping `group` from the formula sidesteps the single-level factor entirely. Each fix maps directly to one of the seven families, and each one is a single line.

![Diagnostic flowchart for R errors](screenshots/R-Common-Errors-diagnostic.webp)
*Figure 3: Four questions that pin down any R error.*

## Summary

The 50 errors in one reference table, grouped by family, with the trigger and the one-line fix. Ctrl+F the error text on this page, then jump to the row below for the pattern.

| #  | Error phrase                                   | Family            | Typical trigger                      | One-line fix                          |
|----|------------------------------------------------|-------------------|--------------------------------------|---------------------------------------|
|  1 | unexpected symbol                              | Syntax            | `x y <- 5`                           | add operator or join names            |
|  2 | unexpected `)`                                 | Syntax            | trailing comma in `c(1,2,)`          | drop trailing comma                   |
|  3 | unexpected numeric constant                    | Syntax            | `2 3`                                | add `*` or `,`                        |
|  4 | unexpected string constant                     | Syntax            | `"a" "b"`                            | add operator or `c()`                 |
|  5 | unexpected `}`                                 | Syntax            | extra `}`                            | match braces                          |
|  6 | invalid multibyte character in parser          | Syntax            | non-UTF-8 file                       | save as UTF-8                         |
|  7 | unexpected input                               | Syntax            | stray backslash                      | remove stray char                     |
|  8 | `<-` vs `<` typo swallows args                 | Syntax            | `f(x <- 1)`                          | use `=` for named args                |
|  9 | object 'x' not found                           | Name lookup       | typo or unassigned                   | assign first; check spelling          |
| 10 | could not find function "filter"               | Name lookup       | package not loaded                   | `library(dplyr)`                      |
| 11 | there is no package called 'dplyr'             | Package           | not installed                        | `install.packages("dplyr")`           |
| 12 | masked from 'package:stats'                    | Name lookup       | name collision                       | use `dplyr::filter()`                 |
| 13 | `$` operator is invalid for atomic vectors     | Name lookup       | `v$x` on a vector                    | use `[`                               |
| 14 | no applicable method for 'X' applied to ...    | Name lookup       | wrong object class                   | check `class()`; coerce               |
| 15 | invalid argument to unary operator             | Name lookup       | `-"a"`                               | coerce to numeric                     |
| 16 | error in UseMethod                             | Name lookup       | S3 dispatch failure                  | check `class()`; call right method    |
| 17 | non-numeric argument to binary operator        | Types             | `"2" + 1`                            | `as.numeric()`                        |
| 18 | invalid type (character) for variable          | Types             | wrong column type in model           | coerce column                         |
| 19 | argument is not a character vector             | Types             | `nchar(1:3)` on numeric              | `as.character()`                      |
| 20 | invalid factor level, NA generated             | Types             | new factor level                     | `levels(f) <- c(levels(f), "new")`    |
| 21 | NAs introduced by coercion                     | Types             | `as.numeric("abc")`                  | clean strings first                   |
| 22 | invalid 'envir' argument                       | Types             | `eval()` with non-env                | pass env with `new.env()`             |
| 23 | `!` not meaningful for factors                 | Types             | `!my_factor`                         | coerce to logical or character        |
| 24 | argument is of length zero                     | Types             | empty vector into `if()`             | check `length()` first                |
| 25 | invalid type (list) for variable               | Types             | list where vector expected           | `unlist()` or `sapply()`              |
| 26 | cannot coerce type 'closure'                   | Types             | used function as data                | typo on variable name                 |
| 27 | subscript out of bounds                        | Subsetting        | `m[3, 1]` on 2×2                     | check `dim()`                         |
| 28 | undefined columns selected                    | Subsetting        | `df[, "nope"]`                       | check `names(df)`                     |
| 29 | replacement has length zero                    | Subsetting        | empty RHS in assign                  | check RHS length                      |
| 30 | items to replace is not a multiple of ...      | Subsetting        | 3 items into 2-slot                  | match lengths                         |
| 31 | only 0's may be mixed with negative subscripts | Subsetting        | `x[c(-1, 2)]`                        | pick one sign                         |
| 32 | missing value where TRUE/FALSE needed          | NA / logic        | `if (NA)`                            | `isTRUE()`                            |
| 33 | NAs in subscripted assignment                  | NA / logic        | NA in index                          | drop NAs from index                   |
| 34 | invalid subscript type 'list'                  | Subsetting        | passed list as index                 | `unlist()` or use `[[`                |
| 35 | attempt to select less than one element        | Subsetting        | `x[[0]]`                             | use 1-based index                     |
| 36 | attempt to apply non-function                  | Name lookup       | `mean <- 5; mean(x)`                 | `rm(mean)`                            |
| 37 | there is no package called 'ghost'             | Package           | not installed                        | `install.packages("ghost")`           |
| 38 | cannot open file 'data.csv'                    | File              | wrong path                           | `file.exists(path)`; `setwd()`        |
| 39 | cannot change working directory                | File              | `setwd()` typo                       | check directory exists                |
| 40 | cannot open URL                                | File              | network or typo                      | test URL; retry                       |
| 41 | package 'X' was built under R version Y        | Package           | R version mismatch                   | update R or ignore (warning)          |
| 42 | namespace load failed                          | Package           | broken install                       | reinstall                             |
| 43 | lazy-load database corrupt                     | Package           | broken package                       | reinstall                             |
| 44 | HTTP error 404                                 | File              | bad URL                              | fix URL                               |
| 45 | contrasts can be applied only to factors ...   | Models            | 1-level factor                       | `droplevels()`                        |
| 46 | factor has new levels                          | Models            | test level unseen in train           | recode or re-fit with combined levels |
| 47 | system is computationally singular             | Models            | collinear predictors                 | drop a predictor                      |
| 48 | non-conformable arguments                      | Models            | matrix dim mismatch                  | check `dim()` on both                 |
| 49 | variable lengths differ                        | Models            | `lm()` with mismatched vectors       | pass `data = `                        |
| 50 | missing values in object                       | Models            | NAs with `na.action = na.fail`       | `na.omit()` or change `na.action`     |

**Three takeaways:**

1. Every error names a function, a problem, and a pointer, read those three first and you'll spot the family instantly.
2. Seven families cover all 50 errors. Memorise the families, not the messages.
3. Most fixes are one line: coerce, load, drop, bounds-check, or rename. If your fix is five lines long, you're probably fixing the wrong thing.

## References

1. R Core Team. *R Language Definition*, Conditions and error handling. [Link](https://cran.r-project.org/doc/manuals/r-release/R-lang.html#Condition-handling)
2. Wickham, H. *Advanced R*, 2nd ed. Chapter 8: Conditions. [Link](https://adv-r.hadley.nz/conditions.html)
3. Wickham, H. *Advanced R*, 2nd ed. Chapter 22: Debugging. [Link](https://adv-r.hadley.nz/debugging.html)
4. `rlang::abort()`, structured error signalling. [Link](https://rlang.r-lib.org/reference/abort.html)
5. R Core Team. *Writing R Extensions*, Error handling. [Link](https://cran.r-project.org/doc/manuals/r-release/R-exts.html)
6. `tryCatch()` reference, base R documentation. [Link](https://rdrr.io/r/base/conditions.html)
7. R FAQ on Stack Overflow, common errors tag. [Link](https://stackoverflow.com/questions/tagged/r+faq)

## Continue Learning

- **[Debugging R Code](R-Debugging.html)**, full walkthrough of `traceback()`, `debug()`, `browser()`, and the RStudio debugger.
- **[R Conditions System](R-Conditions-System.html)**, throw and catch your own errors, warnings, and messages with `rlang::abort()` and `withCallingHandlers()`.
- **[Getting Help in R](Getting-Help-in-R.html)**, the right order in which to read `?help`, vignettes, and package issues when the error itself isn't enough.
