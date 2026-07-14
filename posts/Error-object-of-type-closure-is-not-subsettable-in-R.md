---
title: "Fix 'object of type closure is not subsettable' in R"
slug: "Error-object-of-type-closure-is-not-subsettable-in-R"
description: "R's object of type closure is not subsettable error means you subset a function like data. See the 4 causes, from df name clashes to Shiny, with fixes."
keywords: "object of type closure is not subsettable, object of type closure is not subsettable R, fix object of type closure is not subsettable, R error closure not subsettable, closure is not subsettable meaning, df closure error R, Shiny closure not subsettable"
mathjax: false
webr: true
date: "2026-07-14"
post_type: "PSEO"
category_id: "error-message"
subcategory_id: "base-r-errors"
fr_parent: "R-Common-Errors.html"
auto_link_terms: "object of type closure is not subsettable|object of type 'closure' is not subsettable|closure is not subsettable|closure not subsettable|not subsettable error"
auto_link_case_sensitive: false
target_keyword: "object of type closure is not subsettable"
sibling_block_enabled: true
difficulty: "Beginner"
---

# Fix 'object of type closure is not subsettable' in R

<p class="lead">The error <code>object of type 'closure' is not subsettable</code> means you used subsetting syntax (<code>[ ]</code>, <code>[[ ]]</code>, or <code>$</code>) on a function instead of a data object. It usually appears because a data frame was never created, so its name resolved to a built-in function such as <code>df</code> or <code>data</code>.</p>

[QUICK ANSWER]
mean(x)                      # call a function with ( ), never [ ]
read.csv("sales.csv")        # assign this to df, then df$col works
class(df)                    # "function" means df was never created
rm(df)                       # drop a variable that masks a function
my_data()[1:5, ]             # Shiny: call the reactive, then subset
find("df")                   # show which environment owns the name

## What this error means

**R found a function where you expected data.** "Closure" is R's internal name for a function, and "not subsettable" says that `[ ]`, `[[ ]]`, and `$` do not work on functions. Translated, the message reads: you tried to slice a function.

The shortest way to trigger it is to put square brackets on any built-in function:

```r title="Reproduce the error in one line"
mean[2]
#> Error in mean[2] : object of type 'closure' is not subsettable
```

`mean` is a function, and `[2]` asks for its second element. Functions do not have elements, so R stops with this error. Every real-world case is a disguised version of this one line.

You can confirm what R means by "closure" with `typeof()`:

```r title="A closure is just a function"
typeof(mean)
#> [1] "closure"

class(mean)
#> [1] "function"

typeof(function(x) x + 1)
#> [1] "closure"
```

[KEY INSIGHT]
**The error names the exact problem: subsetting a function.** The [R Language Definition](https://cran.r-project.org/doc/manuals/r-release/R-lang.html#Function-objects) defines a closure as a function bundled with the environment it was created in. So the fix is never about your `[ ]` syntax; it is about why that name pointed at a function in the first place.

## The four causes and their fixes

**Nearly every occurrence traces back to one of four situations.** Check them in order; the first two cover most scripts, and the fourth covers most Shiny apps.

### 1. You subset a function you meant to call

Parentheses call a function; square brackets extract elements from data. Swapping them produces the error immediately:

```r title="Brackets vs parentheses"
x <- c(4, 8, 15, 16, 23, 42)

mean[x]   # wrong: [ ] treats mean like a container
#> Error in mean[x] : object of type 'closure' is not subsettable

mean(x)   # right: ( ) calls the function on x
#> [1] 18
```

The fix is mechanical: replace `[ ]` with `( )` on the function name shown in the error.

The dollar-sign and double-bracket forms fail the same way, so `mean$x` and `mean[["x"]]` raise the identical message.

### 2. The object was never created, and a built-in owns its name

This is the classic `df$price` failure. You intend `df` to be your data frame, but the line that creates it never ran or failed silently. R then searches its packages, finds a function called `df`, and hands that to `$`:

```r title="df is a function until you create your own"
df$price
#> Error in df$price : object of type 'closure' is not subsettable

class(df)
#> [1] "function"
```

This bites hardest in interactive work: you restart R, rerun only the bottom half of a script, and a line that worked yesterday fails because the workspace is empty. Check the Environment pane in RStudio, or run `ls()`, to confirm the object exists before trusting its name.

The fix is to actually create the object before subsetting it. Once your own `df` exists in the workspace, it masks the built-in and everything works:

```r title="Create the object, then subset it"
df <- data.frame(price = c(10, 20, 30))
df$price
#> [1] 10 20 30
```

[WARNING]
**`df` and `data` are both built-in functions.** `df()` is the F-distribution density from the stats package, and `data()` loads datasets. Scripts that use them as data frame names look fine, then throw the closure error whenever the assignment line is skipped, misspelled, or errors out earlier.

### 3. You wrote the closure yourself

Functions that return functions are a standard R pattern. The returned value is a closure, and it is tempting to treat it like the data it will eventually produce:

```r title="Closures returned by other functions"
make_counter <- function() {
  count <- 0
  function() {
    count <<- count + 1
    count
  }
}
counter <- make_counter()

counter[1]   # wrong: counter is a function
#> Error in counter[1] : object of type 'closure' is not subsettable

counter()    # right: call it first
#> [1] 1
```

Whenever a function factory, `local()`, or `Vectorize()` hands you a result, call it with `( )` before applying any subsetting to what it returns. The same rule covers functions stored in lists: `handlers$log` retrieves the function, and only `handlers$log(x)` runs it.

### 4. Shiny reactives without parentheses

`reactive()` returns a function, not a data frame. Inside a Shiny server, `my_data` is the reactive object itself; `my_data()` is the current value. Subsetting the former is the single most common source of this error in app code:

```r title="Call the reactive before subsetting"
server <- function(input, output) {
  my_data <- reactive(mtcars[mtcars$cyl == input$cyl, ])
  output$tbl <- renderTable(my_data()[1:5, ])
}
```

The wrong version, `renderTable(my_data[1:5, ])`, only fails when the app runs, which makes it harder to spot. Any time an error points into your server function, search it for reactives used without `( )`. The same rule covers `reactiveVal()` and `eventReactive()`, which also return functions.

## The mirror error: calling data like a function

**Swap the mistake and R complains differently.** Putting `( )` on a data object makes R hunt for a function with that name specifically, skipping your vector, so the message reports a missing function:

```r title="Calling data like a function"
prices <- c(10, 20, 30)

prices(2)   # wrong: ( ) treats prices like a function
#> Error in prices(2) : could not find function "prices"

prices[2]   # right: [ ] extracts the second element
#> [1] 20
```

The two messages are opposite ends of one confusion: square brackets belong to data, parentheses belong to functions.

## Diagnose it in 30 seconds

**Three calls tell you which case you have.** Take the name from your error message and inspect what R actually sees:

```r title="Three diagnostic calls"
class(data)      # what did R actually find?
#> [1] "function"

find("data")     # which environment owns the name?
#> [1] "package:utils"

exists("sales")  # was my object ever created?
#> [1] FALSE
```

The second call matters because R searches your workspace first, then each attached package in order, taking the first match. Your objects mask package functions when both exist, which is why creating `df` makes the error vanish; when `find()` reports only a package, your version simply is not there.

Match the results against this table:

| Symptom | Cause | Fix |
|---------|-------|-----|
| Code looks like `mean[2]` | Subsetting instead of calling | Use `( )`: `mean(x)` |
| `class(obj)` returns `"function"` | Object never created; a built-in owns the name | Run the creating line, or rename |
| `find("obj")` shows only a package | Name lives in a package, not your workspace | Rename to `sales_df`, `prices_tbl` |
| Error appears when a Shiny app runs | Reactive used without `( )` | `my_data()[rows, cols]` |

[TIP]
**Run `class()` on the name from the error first.** One call splits the problem in two: `"function"` means the name never pointed at your data, so fix the creation or the name; anything else means the subsetting call itself is wrong.

## How to avoid it next time

**A few habits make this error rare.**

- Give data objects distinctive names. Prefer `sales_df` or `prices_tbl` over `df`, `data`, `t`, or `c`, all of which already belong to functions.
- Rerun scripts from the top after a restart, or restart R deliberately and often, so stale workspaces never hide a missing object.
- Read the failing call in the error message before touching code; it names the exact object that resolved wrongly.
- Print or `str()` an object right after creating it, so a read that silently failed surfaces immediately.
- In Shiny, treat every reactive as a function until called, and add the `( )` at creation time.

## Try it yourself

**Try it:** The broken line below throws the closure error. Write the working call so `ex_avg` holds the average of `ex_prices`.

```r title="Your turn: fix the closure error"
ex_prices <- c(120, 95, 143)
# mean[ex_prices] throws the closure error; write the working call
ex_avg <- # your code here

ex_avg
#> Expected: [1] 119.3333
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_prices <- c(120, 95, 143)
ex_avg <- mean(ex_prices)
ex_avg
#> [1] 119.3333
```

**Explanation:** `mean[ex_prices]` subsets the `mean` function itself, which is not subsettable. Calling it with parentheses, `mean(ex_prices)`, passes the vector as an argument and returns the average.

</details>

## FAQ

**What is an object of type 'closure' in R?**

A closure is R's internal type name for a function, covering the function's code plus the environment it was defined in. `typeof(mean)` returns `"closure"` even though `class(mean)` returns `"function"`. Every function you create with `function()` is a closure. When the word appears in an error message, read it simply as "a function": R is telling you that the object you tried to subset is a function.

**What does subsettable mean in R?**

Subsettable means an object supports the extraction operators `[ ]`, `[[ ]]`, and `$`. Vectors, lists, matrices, and data frames are subsettable because they contain elements you can pull out by position or name. Functions contain code to execute, not elements to extract, so R marks them as not subsettable.

**Why does R say my data frame is a closure?**

Because the name never pointed at your data frame in the current session. The line that creates it did not run, failed with an earlier error, or the name is misspelled. R then falls back to a function with the same name, such as the built-in `df()` or `data()`, and reports a closure. Confirm with `class(your_name)`: if it returns `"function"`, recreate the object or pick a more distinctive name.

**Can I look inside a function if `[ ]` does not work?**

Yes, through accessor functions rather than subsetting operators. `body(mean)` returns the code, `formals(mean)` returns the argument list, and `environment(mean)` returns the environment the closure captured. These are the legitimate tools for inspecting a function's parts. If you reached for `[ ]` expecting data, though, the fix is still the name, not dissecting the function.

**How do I fix 'object of type closure is not subsettable' in Shiny?**

Call every reactive with parentheses before subsetting its result: `my_data()[1:5, ]`, never `my_data[1:5, ]`. The same applies to `reactiveVal()` objects and anything returned by `reactive()`. Because reactives only execute while the app is running, the error surfaces at runtime rather than when you source the file, so search your server code for reactive names followed directly by `[` or `$`.

## Related R errors

Start with the parent guide, [common R errors and how to read them](R-Common-Errors.html). For the mechanics, see [closures in R](R-Closures.html) for how functions capture environments, [functions in R](R-Functions.html) for calling conventions, [subsetting in R](R-Subsetting.html) for what the extraction operators apply to, and [data frames in R](R-Data-Frames.html) if your object exists but subsetting still fails.
