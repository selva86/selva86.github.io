# Stuck in R? 6 Ways to Get Unstuck Without Wasting Hours

Master R's built-in help system: ?, help(), example(), vignette(), and apropos(). Plus a Stack Overflow strategy that gets useful answers within minutes.

## Why You Need a Help Strategy

Every R programmer gets stuck. The difference between beginners and experts isn't that experts know everything -- it's that experts know how to find answers fast. R has one of the best built-in help systems of any programming language. You just need to know how to use it.

This tutorial teaches you six methods, from quickest to most thorough. By the end, you'll solve most problems in under two minutes.

## Method 1: The ? Shortcut

The fastest way to get help in R. Type `?` followed by a function name:

```r
# Get help for the mean function
?mean
```

This opens the help page for `mean()`. In a WebR environment, it prints the help text. In RStudio, it opens in the Help pane.

Every help page has the same sections:

| Section | What It Tells You |
|---------|-------------------|
| Description | What the function does |
| Usage | The function signature with default arguments |
| Arguments | What each argument means |
| Value | What the function returns |
| Examples | Working code you can copy |

```r
# The same thing, written differently
help(mean)

# Both ? and help() do exactly the same thing
```

### Reading a Help Page

Let's look at what `?paste` tells us:

```r
# Get help for paste
?paste
```

The most useful section is often **Examples** at the bottom. Scroll down to see working code you can run immediately.

## Method 2: example() -- See It in Action

Don't want to read documentation? Run the examples directly:

```r
# Run the built-in examples for paste()
example(paste)
```

```r
# See examples for seq()
example(seq)
```

This runs every code example from the help page. It's the fastest way to understand what a function does -- you see inputs and outputs side by side.

## Method 3: help.search() -- Find Functions You Don't Know

What if you don't know the function name? Use `help.search()` or its shortcut `??`:

```r
# Search for functions related to "correlation"
help.search("correlation")
```

```r
# Shortcut: double question mark
??"linear model"
```

This searches across all installed packages. The results show function names, packages, and brief descriptions.

### apropos() -- Search by Name Pattern

`apropos()` finds functions whose names match a pattern:

```r
# Find all functions with "mean" in the name
apropos("mean")
```

```r
# Find all functions starting with "str"
apropos("^str")
```

```r
# Find all functions with "test" in the name
apropos("test")
```

This is great when you vaguely remember a function name but can't recall it exactly.

## Method 4: vignette() -- In-Depth Tutorials

Help pages explain individual functions. Vignettes explain entire packages with real-world examples and explanations. They're like mini-tutorials.

```r
# List all available vignettes
vignette()
```

```r
# See vignettes for a specific package
vignette(package = "stats")
```

Vignettes are the most underused resource in R. They're written by the package authors and often contain the best explanations of when and why to use each feature.

## Method 5: str() and args() -- Quick Inspection

Sometimes you don't need the full help page. You just need to see what arguments a function takes:

```r
# Show the arguments of lm()
args(lm)
```

```r
# Show the arguments of t.test()
args(t.test)
```

`str()` shows the internal structure of any R object:

```r
# Inspect a data frame
str(mtcars)
```

```r
# Inspect a model object
model <- lm(mpg ~ wt, data = mtcars)
str(model, max.level = 1)
```

```r
# Inspect a list
my_list <- list(name = "Alice", scores = c(90, 85, 92), passed = TRUE)
str(my_list)
```

`str()` is your X-ray for R objects. When something unexpected happens, run `str()` on the result to see what you're actually working with.

## Method 6: Stack Overflow Strategy

When R's built-in help isn't enough, Stack Overflow is your best external resource. But there's a right way and a wrong way to use it.

### Searching Effectively

Add `[r]` to your search query to filter for R-specific answers:

- Good: `[r] replace NA with mean`
- Bad: `replace NA with mean` (gets results for Python, SQL, etc.)

### Creating a Reproducible Example (reprex)

If you need to ask a question, include a minimal example that others can run. This is the single most important thing for getting fast answers.

```r
# A good reprex includes:
# 1. A small dataset (not your real data)
# 2. The code that fails
# 3. What you expected vs what happened

# Example reprex:
df <- data.frame(
  x = c(1, 2, NA, 4),
  y = c(10, NA, 30, 40)
)

# I expected this to remove rows with NA
result <- df[!is.na(df), ]
# But it gives an error. How do I fix this?

# Correct approach:
result <- df[complete.cases(df), ]
print(result)
```

### Reading Error Messages

Before searching online, read the error message carefully. R's error messages are often more helpful than they look:

```r
# Common error: object not found
tryCatch(
  print(my_undefined_variable),
  error = function(e) cat("Error:", e$message, "\n")
)
```

```r
# Common error: wrong argument type
tryCatch(
  mean("hello"),
  warning = function(w) cat("Warning:", w$message, "\n")
)
```

```r
# Common error: unexpected symbol
# This happens with missing commas, brackets, or operators
tryCatch(
  eval(parse(text = "c(1 2 3)")),
  error = function(e) cat("Error:", e$message, "\n")
)
```

## A Debugging Strategy That Works

When your code breaks, follow this checklist in order:

1. **Read the error message** -- it usually tells you exactly what's wrong
2. **Check your data** -- use `str()`, `head()`, `class()`, and `dim()`
3. **Isolate the problem** -- run your code line by line to find which line fails
4. **Check the help page** -- `?function_name` to verify you're using it correctly
5. **Search online** -- paste the error message into Google with `[r]`
6. **Ask for help** -- create a reprex and post on Stack Overflow or RStudio Community

```r
# Debugging toolkit in action
data <- mtcars[1:5, 1:3]

# Step 1: What does the data look like?
head(data)

# Step 2: What types are we working with?
str(data)

# Step 3: What are the dimensions?
dim(data)

# Step 4: Any NAs?
sum(is.na(data))

# Step 5: Summary statistics
summary(data)
```

## Other Helpful Functions

Here are a few more tools for exploring R:

```r
# List all functions in a package
ls("package:stats") |> head(20)
```

```r
# See the source code of a function
body(mean.default)
```

```r
# Check what methods exist for a generic function
methods(print) |> head(15)
```

```r
# Find which package a function comes from
find("ggplot")
find("lm")
```

## Quick Reference Table

| Task | Command | Example |
|------|---------|---------|
| Help for a function | `?` or `help()` | `?mean` |
| Run examples | `example()` | `example(paste)` |
| Search all help | `??` or `help.search()` | `??"linear model"` |
| Find functions by name | `apropos()` | `apropos("mean")` |
| Package tutorials | `vignette()` | `vignette("dplyr")` |
| Function arguments | `args()` | `args(lm)` |
| Object structure | `str()` | `str(mtcars)` |
| Function source code | `body()` | `body(mean.default)` |

## Practice Exercises

**Exercise 1:** Use `apropos()` to find all functions that contain the word "plot". How many are there?

```r
# Your code here
```

<details><summary>Solution</summary>

```r
plot_fns <- apropos("plot")
cat("Number of plot functions:", length(plot_fns), "\n")
print(plot_fns)
```

</details>

**Exercise 2:** Use `args()` to find what arguments the `sample()` function takes. Then use `example()` to see it in action.

```r
# Your code here
```

<details><summary>Solution</summary>

```r
args(sample)
example(sample)
```

</details>

**Exercise 3:** Use `str()` to explore the built-in `iris` dataset. How many rows and columns does it have? What are the column types?

```r
# Your code here
```

<details><summary>Solution</summary>

```r
str(iris)
cat("\nRows:", nrow(iris), "\n")
cat("Columns:", ncol(iris), "\n")
```

</details>

**Exercise 4:** The function `which.max()` returns the position of the maximum value. Use `?which.max` to learn about it, then find the position of the heaviest car in `mtcars$wt`.

```r
# Your code here
```

<details><summary>Solution</summary>

```r
?which.max
pos <- which.max(mtcars$wt)
cat("Position:", pos, "\n")
cat("Car:", rownames(mtcars)[pos], "\n")
cat("Weight:", mtcars$wt[pos], "\n")
```

</details>

## FAQ

**Q: What's the difference between ? and ??**
A: `?function_name` looks up exact matches. `??search_term` searches across all installed packages for related topics. Use `?` when you know the function name, `??` when you don't.

**Q: Why does ?if not work?**
A: Reserved words need backticks or quotes: `` ?`if` `` or `help("if")`. Same goes for `?`+`` -- use `help("+")`.

**Q: How do I get help for a function in a specific package?**
A: Use `help(function, package = "pkgname")` or `?package::function`. For example: `?dplyr::filter`.

**Q: Are vignettes available offline?**
A: Yes. Vignettes are installed with the package. Run `vignette(package = "pkgname")` to see available ones, even without internet.

**Q: Where can I ask R questions online?**
A: The top three places are Stack Overflow (tag `[r]`), RStudio Community (community.rstudio.com), and the R mailing list (r-help). Stack Overflow has the largest archive of answered questions.

## Conclusion

You now have six tools for getting unstuck in R: `?` for quick lookups, `example()` for seeing code in action, `help.search()` and `apropos()` for finding functions you don't know, `vignette()` for in-depth package guides, and `str()` for inspecting any object. Master these and you'll spend less time searching and more time coding.
