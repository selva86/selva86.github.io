---
title: "Stuck in R? 6 Ways to Get Unstuck Without Wasting Hours"
slug: "Getting-Help-in-R"
description: "Master R's built-in help system: ?, help(), example(), vignette(), apropos(), and reprex. Plus a Stack Overflow strategy that gets answers in minutes."
keywords: "R help, getting help in R, help() R, vignette R, reprex R, R Stack Overflow, apropos R, R example() function"
auto_link_terms: "getting help in R|help() in R|vignette() in R|reprex in R|apropos() in R"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-11"
curriculum_id: "1.1.12"
post_type: "C"
sidebar_section: "Learn R"
sidebar_title: "Getting Help in R"
sidebar_order: 12
difficulty: "Beginner"
---

# Stuck in R? 6 Ways to Get Unstuck Without Wasting Hours

<p class="lead">When you're stuck in R, you don't need Google, you need `?function_name`. R ships with a help system that covers every function, and between `help()`, `example()`, `vignette()`, `apropos()`, and a clean **reprex**, most problems are 60 seconds away from being solved without ever leaving your R session.</p>

## What's the fastest way to look up a function you already know?

A single question mark in front of a function name opens its help page instantly. That's the one shortcut every R user types hundreds of times a week, and it almost always contains the answer you were about to Google.

```r
?mean
# opens the help page for mean() — arguments, return value, examples
```

The help page follows a consistent structure: **Description** (one-line summary), **Usage** (the signature with defaults), **Arguments** (what each parameter does), **Details** (gotchas and edge cases), **Value** (what gets returned), **Examples** (runnable code). Learn to jump straight to Arguments and Examples, that's 90% of what you need.

![Flowchart showing where to look for R help, help(), apropos(), vignette(), reprex](screenshots/Getting-Help-in-R-help-sources.webp)

*Figure 1: R's help system handles most questions before you ever open a browser. Use `?` first, `vignette()` for tutorials, reprex only when asking humans.*

`?mean` is shorthand for `help("mean")`. They're identical, use whichever feels faster. For operators and reserved words you need quotes: `` ?`+` `` or `help("if")`.

```r
?`+`
help("if")
help("[")    # help for the subsetting operator
```

[TIP]
If you've loaded multiple packages and two export the same function name, use `help("filter", package = "dplyr")` to target the one you want. This is the cure for "why is filter() giving me a signal-processing function?"

**Try it:** Look up `?round`. How many arguments does it take, and what does `digits` default to?

```r
?round
# read the Usage and Arguments sections
```

<details>
<summary>Click to reveal solution</summary>

```r
?round
#> Usage: round(x, digits = 0)
#> Arguments:
#>   x      — a numeric vector
#>   digits — integer indicating number of decimal places (default 0)
args(round)
#> function (x, digits = 0)
```

`round()` takes two arguments and `digits` defaults to `0`, which is why `round(3.7)` returns `4`, no decimals kept. You can read this straight off the **Usage** line of the help page, which is always the fastest way to answer "what arguments does this take and what do they default to?"
</details>

## How do you find a function when you only remember what it does?

This is the harder case, you want to reshape a data frame but can't remember if it's `pivot_longer`, `melt`, `reshape`, or something else. Two tools cover it: `apropos()` for partial name matching and `help.search()` (shortcut `??`) for full-text search across help pages.

```r
apropos("mean")
#> [1] ".colMeans"     ".rowMeans"     "colMeans"      "kmeans"        
#> [5] "mean"          "mean.Date"     "mean.default"  "mean.difftime" 
#> [9] "mean.POSIXct"  "rowMeans"      "weightedMean"
```

`apropos()` lists every loaded object whose name contains the pattern. It's great when you know the target function's name starts with or contains a specific word.

```r
??"linear model"
# opens a search results page across all installed packages
```

`??` (help.search) scans help-page text, so it finds functions by *description* not just name. Searching for `"linear model"` surfaces `lm`, `glm`, `lm.fit`, and regression diagnostics, even if none of those names contain the word "linear."

[KEY INSIGHT]
`apropos()` searches **names**. `??` searches **descriptions**. When you know roughly what the function is called, use `apropos()`. When you know what it *does*, use `??`.

```r
apropos("^cor")      # functions whose name starts with "cor"
#> [1] "cor"        "cor.test"   "corrcoeff"  "corrplot"   "correlation"
```

The `^` anchor is a regex, `apropos()` accepts regular expressions, so you can narrow results when a common prefix produces too many hits.

**Try it:** Use `apropos()` to find everything in base R with "lm" in its name. Then use `??"logistic regression"` to find functions for logistic regression.

```r
# Your code here — use apropos() and ?? to hunt for names and topics
```

<details>
<summary>Click to reveal solution</summary>

```r
apropos("lm")
#>  [1] "colMeans" "dlmultinom" "glm" "glm.control" "glm.fit"
#>  [6] "KalmanForecast" "KalmanLike" "KalmanRun" "KalmanSmooth" "lm"
#> [11] "lm.fit" "lm.influence" "lm.wfit" "model.frame.lm" "predict.glm"
#> [16] "predict.lm" "residuals.glm" "residuals.lm" "summary.glm" "summary.lm"

??"logistic regression"
# opens the help search page — top hits include stats::glm (with family = binomial),
# stats::predict.glm, and MASS::polr for ordered logistic regression
```

`apropos("lm")` matches any loaded object whose name contains "lm" as a substring, so you get `lm` itself plus its helpers (`lm.fit`, `summary.lm`, `predict.lm`) and also unrelated hits like `colMeans`. The `??` search is description-based: it finds `glm` because its help page *describes* logistic regression, even though the word "logistic" doesn't appear in the name.
</details>

## Why is example() the most underused help command?

Every help page has an **Examples** section at the bottom. Instead of copy-pasting them, you can run them all with one call: `example(function_name)`. R pipes each example into the console, one at a time, so you can watch the output interactively.

```r
example(mean)
#> mean> x <- c(0:10, 50)
#> mean> xm <- mean(x)
#> mean> c(xm, mean(x, trim = 0.10))
#> [1] 8.75 5.50
```

That's the entire `?mean` examples section running live, including the `trim` argument demonstration that most beginners never notice. It's the fastest way to go from "I read the help page" to "I actually understand how this behaves on real data."

```r
example(lm)
# runs every lm() example from the help page, plots included
```

For functions with plotting examples (like `lm`, `ggplot`, `hist`), `example()` draws every plot, you get a visual tour of the function's capabilities in one call.

**Try it:** Run `example(plot)` and watch what comes up. Then try `example(strsplit)` to see string-splitting in action.

```r
# Your code here — run example() on plot and strsplit
```

<details>
<summary>Click to reveal solution</summary>

```r
example(plot)
# draws a sequence of scatter plots from the ?plot help page,
# showing different type= options and factor behavior

example(strsplit)
#> strsplit> noquote(strsplit("A text I want to display with spaces", NULL)[[1]])
#>  [1] A     t e x t     I     w a n t     t o     d i s p l a y     w i t h     s p a c e s
#> strsplit> x <- c(as = "asfef", qu = "qwerty", "yuiop[", "b", "stuff.blah.yech")
#> strsplit> strsplit(x, "e")
```

`example(plot)` runs every snippet from the `?plot` help page live, including the plotting ones, so you get a free visual tour of what `type = "l"`, `"b"`, `"s"` and friends look like without copy-pasting anything. `example(strsplit)` is great for text functions: it shows the `split = NULL` trick for splitting into individual characters, which is rarely mentioned in tutorials but documented right there in the examples.
</details>

## When should you read a vignette instead of a help page?

Help pages document individual functions. **Vignettes** are the long-form tutorials that package authors write to explain how pieces fit together. If `?dplyr::filter` tells you *what* filter does, `vignette("dplyr")` tells you *how* to use filter with select, mutate, and group_by in a real workflow.

```r
vignette()                    # list all vignettes on your system
vignette(package = "dplyr")   # vignettes in one specific package
vignette("dplyr")             # open the main dplyr vignette
```

Vignettes are the difference between understanding a package as a pile of functions versus understanding it as a coherent tool. Any time you're learning a new package, check its vignettes before searching online, the author wrote them specifically to save you that search.

[NOTE]
Not every package ships vignettes, and which ones are available depends on how you installed the package. `install.packages("pkg")` by default includes vignettes; Bioconductor-style installs do too.

**Try it:** List the vignettes available in your `stats` package with `vignette(package = "stats")`. (Base packages often have few or none, which is why you go to tutorials for the core language.)

```r
# Your code here — list vignettes in the stats package
```

<details>
<summary>Click to reveal solution</summary>

```r
vignette(package = "stats")
#> no vignettes found

# Compare with a package that ships vignettes:
vignette(package = "dplyr")
#> Vignettes in package 'dplyr':
#>   base          Base R and dplyr
#>   colwise       Column-wise operations
#>   dplyr         Introduction to dplyr
#>   grouping      Grouped data
#>   programming   Programming with dplyr
#>   rowwise       Row-wise operations
#>   two-table     Two-table verbs
#>   window-functions  Window functions
```

The `stats` package, home to `lm()`, `glm()`, `t.test()` and the rest of base R's statistics, ships with zero vignettes because base R packages predate the vignette system. That's why R's core statistical functions are documented function-by-function via `?lm` etc., and why books like *Modern Applied Statistics with S* fill the tutorial gap. Contrast with `dplyr`, where the package authors wrote eight long-form tutorials specifically to stop users from having to Google.
</details>

## How do you read an R error message without panicking?

An R error is not a wall of nonsense, it's a structured report with three layers you should read in reverse. The **last** line is usually the useful one; the rest is the call stack that led there.

```r
mean("hello")
#> Warning message:
#> In mean.default("hello") :
#>   argument is not numeric or logical: returning NA
```

R is telling you the exact problem: `"hello"` isn't numeric, so `mean.default` (the method it dispatched to) can't compute a mean. The fix is obvious once you read it, pass a number. But the first instinct of most beginners is to panic at the word "default" and paste the whole message into Google.

```r
# A more complex one
lm(y ~ x, data = data.frame(x = 1:5))
#> Error in eval(predvars, data, env) : object 'y' not found
```

Two pieces of info: the error happened inside `eval(predvars, data, env)` (internals of `lm`), and the root cause is `object 'y' not found`, you referenced a column `y` that doesn't exist in the data frame. Ignore the internals, focus on the last clause.

[TIP]
When an error mentions a function you don't recognize, ignore it, it's almost always internal machinery, not the function you called. Focus on the quoted name, missing object, or type mismatch in the last sentence.

Use `traceback()` right after an error to see the full call chain if the error happened deep in someone else's code. It shows which of your lines led to which internal call.

```r
# After an error:
# traceback()
```

## How do you ask a good Stack Overflow question (and get an answer in minutes)?

Some problems genuinely need human help, a weird edge case, a bug in a package, a design question. When you get there, the single biggest factor in getting a fast answer is the **reprex**: a minimal, self-contained example that someone else can copy-paste and run.

![Debug loop: read error, isolate, check types, build reprex if needed](screenshots/Getting-Help-in-R-debug-loop.webp)

*Figure 2: Most R problems resolve in the first three steps. The reprex step is for when you need someone else's eyes.*

A good reprex has four qualities: **minimal** (smallest code that shows the bug), **complete** (anyone can run it as-is, with `library()` calls and data), **reproducible** (it actually triggers the problem), and **readable** (formatted code block, error output included).

The `reprex` package automates the formatting:

```r
# install.packages("reprex")
library(reprex)

# Copy your code to the clipboard, then:
reprex()
# generates a ready-to-paste Markdown block with code + output
```

Here's a bad reprex and a good one, side by side.

```r
# BAD — no data, no library, vague
"my filter isn't working, I get no rows"
df |> filter(col == "x")
```

```r
# GOOD — complete and runnable
library(dplyr)

df <- data.frame(
  id = 1:3,
  col = c("x", "X", "x")
)

df |> filter(col == "x")
#>   id col
#> 1  1   x
#> 3  3   x
# Expected 3 rows, got 2 — case-sensitive match is surprising me
```

The good version is 10 lines, runs standalone, shows the expected vs actual, and gives an answerer everything they need. You'll usually have your answer within the time it takes to post.

[KEY INSIGHT]
Half the time you spend building a good reprex, you solve the problem yourself. Boiling code down to the minimal case strips away distractions and reveals the bug. Even if nobody answers, the exercise pays for itself.

**Try it:** The next time you hit a bug, spend 5 minutes writing the reprex *before* searching. You'll often find the bug during the reduction.

## Practice Exercises

### Exercise 1: Find a function by description

Use R's help system to find a function that computes the **correlation between two variables**, without knowing its name. Then verify your answer by opening its help page.

<details>
<summary>Show solution</summary>

```r
# Search by description
??"correlation"
# or
help.search("correlation")

# That surfaces cor() as the primary answer
?cor
# Arguments: x, y, use, method
# method supports "pearson", "kendall", "spearman"
```
</details>

### Exercise 2: Read the help page for a complex function

Open `?lm` and answer these three questions just from the help page:
1. What does the `subset` argument do?
2. What does the function return, a vector, a list, or a custom object?
3. What does `na.action` default to?

<details>
<summary>Show solution</summary>

```r
?lm

# 1. subset: An optional vector specifying a subset of observations
#    to be used in the fitting process.
# 2. Returns an object of class "lm" (a list with components like
#    coefficients, residuals, fitted.values).
# 3. na.action defaults to the value of options("na.action"),
#    which is usually na.omit — drops rows with NAs.
```

The "Value" section of every help page tells you what you get back. Reading it once saves hours of downstream debugging.
</details>

### Exercise 3: Build a minimal reprex

You're seeing this error when trying to plot grouped data:

```
Error in FUN(X[[i]], ...) : only defined on a data frame with all numeric-alike variables
```

Build a 6-line reprex that reproduces it using built-in data. Start with `library()` and a small data frame.

<details>
<summary>Show solution</summary>

```r
# Reprex:
library(stats)

df <- data.frame(
  name = c("a", "b", "c"),
  value = c(1, 2, 3)
)

colMeans(df)
#> Error in colMeans(df) : 
#>   'x' must be numeric
```

`colMeans` needs all numeric columns; the `name` character column triggers the error. Six lines, completely self-contained, uses built-ins, anyone can run it.
</details>

## Complete Example: Diagnosing a Mystery Function

Suppose you find `stats::mahalanobis` in someone's code and have no idea what it does. Here's the full "get unstuck" workflow using nothing but R itself.

```r
# Step 1: Open the help page
?mahalanobis

# Step 2: Run the examples live
example(mahalanobis)
#> mahalanobis> ma <- cbind(1:6, 1:3)
#> mahalanobis> (S <-  var(ma))
#>      [,1] [,2]
#> [1,]  3.5    0
#> [2,]  0.0    1
#> 
#> mahalanobis> mahalanobis(c(0, 0), 1:2, S)
#> [1] 5.285714

# Step 3: If you need deeper context, check vignettes
vignette(package = "stats")    # returns any available

# Step 4: Look up related functions
apropos("^mah")
#> [1] "mahalanobis"
```

You now know: `mahalanobis()` computes the Mahalanobis distance between points and a distribution, it takes a vector, a center, and a covariance matrix, and there's exactly one related function in base R. Total time: under a minute, zero browser tabs.

If at any point you're still confused, *then* you build a reprex and ask. But 9 times out of 10, the in-session tools are enough.

## Summary

| You need to... | Use |
|---|---|
| Look up a function you know | `?name` or `help("name")` |
| Find a function by partial name | `apropos("pattern")` |
| Find a function by description | `??"phrase"` or `help.search()` |
| Run a help page's examples | `example(name)` |
| Read a long-form tutorial | `vignette("pkg")` |
| Trace an error's call chain | `traceback()` |
| Ask another human for help | `reprex::reprex()` |

Three habits that separate fast R users from stuck ones:

1. **Type `?function` before Googling.** The answer is almost always on the help page; Google just adds latency.
2. **Read errors in reverse.** The last line is the actionable one. Ignore the internal call stack until you've read the root cause.
3. **Write reprexes even when you're debugging alone.** Minimising the code reveals the bug about half the time before you even post anywhere.

## References

1. R Core Team. *An Introduction to R*, Getting help with functions and features. <https://cran.r-project.org/doc/manuals/r-release/R-intro.html#Getting-help>
2. `reprex` package documentation. <https://reprex.tidyverse.org/>
3. Wickham, H. *Advanced R*, 2nd ed., Debugging chapter. <https://adv-r.hadley.nz/debugging.html>
4. Stack Overflow, How to make a great R reproducible example. <https://stackoverflow.com/q/5963269>
5. R Documentation: `?help`, `?apropos`, `?example`, `?vignette`, `?traceback`. Run in any R session.

## Continue Learning

- [Write Better R Functions](R-Functions.html), once you've mastered help(), you'll want to write functions others can `?` into.
- [R's Four Special Values](R-Special-Values.html), the most common source of mystery errors: NA poisoning a computation.
- [Control Flow in R](Control-Flow-in-R.html), understanding `if` and `for` makes tracebacks much easier to read.
