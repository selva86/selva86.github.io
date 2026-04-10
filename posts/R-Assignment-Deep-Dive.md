---
title: "R Assignment Deep Dive: <- vs = vs <<- vs -> — Know the Difference"
slug: "R-Assignment-Deep-Dive"
description: "Master all R assignment operators: <-, =, <<-, ->, ->>, and assign(). Learn scoping rules, when to use each, and common pitfalls to avoid."
keywords: "R assignment operators, <- vs = R, <<- R, -> R, R scoping, assign function R, R variable assignment"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "4.1.2"
post_type: "C"
auto_link_terms: "R assignment operators|<- vs =|<<- operator|R scoping rules"
auto_link_case_sensitive: false
---

# R Assignment Deep Dive: <- vs = vs <<- vs -> -- Know the Difference

<p class="lead">R has five assignment operators: <code>&lt;-</code>, <code>=</code>, <code>&lt;&lt;-</code>, <code>-&gt;</code>, and <code>-&gt;&gt;</code>, plus the <code>assign()</code> function. Each has different scoping behavior and appropriate use cases. This tutorial explains exactly when to use each one and why <code>&lt;-</code> is the standard.</p>

Assignment is something you do hundreds of times in every R script. Understanding the subtle differences between these operators prevents hard-to-find bugs, especially with nested functions and closures.

## The Standard: <- (Left Assignment)

`<-` is R's standard assignment operator. The R community, Google's R style guide, and the tidyverse style guide all recommend it.

```r
# Standard assignment
x <- 42
name <- "Alice"
data <- mtcars[1:5, 1:3]

cat("x:", x, "\n")
cat("name:", name, "\n")
cat("data rows:", nrow(data), "\n")

# Works anywhere: top level, inside functions, inside loops
my_func <- function() {
  local_var <- "I exist only inside this function"
  cat(local_var, "\n")
}
my_func()
```

### Why <- and not =?

Historical reason: `<-` has been R's assignment operator since the 1970s (inherited from S). But there's also a practical reason:

```r
# <- is unambiguous
x <- 3   # Always assignment

# = can be ambiguous in function calls
# Is this assignment or a named argument?
mean(x = 1:10)  # Named argument, NOT assignment
cat("x still:", x, "\n")  # x is still 3!

# With <-, it's always assignment
mean(x <- 1:10)  # Assigns 1:10 to x AND passes it to mean
cat("Now x is:", x[1], "...", x[10], "\n")

# This is why style guides prefer <- for assignment
```

## The Equals Sign: =

`=` works as assignment at the **top level** and inside `{ }` blocks, but it does NOT work for assignment inside function call arguments.

```r
# These are equivalent at the top level
a <- 10
b = 20
cat("a:", a, "\n")
cat("b:", b, "\n")

# Inside a function body, both work
my_func <- function() {
  local1 <- 100
  local2 = 200
  cat("local1:", local1, "\n")
  cat("local2:", local2, "\n")
}
my_func()
```

### Where = does NOT assign

```r
# Inside a function call, = is for naming arguments, not assignment
result <- data.frame(x = 1:3, y = 4:6)
cat("Does 'x' exist in global scope?", exists("x"), "\n")
# x = 1:3 created a column, not a global variable

# Contrast with <-
result2 <- data.frame(a <- 1:3, b <- 4:6)
cat("Does 'a' exist in global scope?", exists("a"), "\n")
cat("a:", a, "\n")  # a was created as a side effect!
# This is usually a bug, not intentional
```

**Rule of thumb:** Use `<-` for assignment, `=` for function arguments. This removes all ambiguity.

## The Superassignment: <<-

`<<-` assigns to the **parent environment**, not the current one. It's used to modify variables in enclosing scopes (closures).

```r
# <<- modifies a variable in the parent/global environment
counter <- 0

increment <- function() {
  counter <<- counter + 1  # Modifies the global 'counter'
}

cat("Before:", counter, "\n")
increment()
increment()
increment()
cat("After 3 increments:", counter, "\n")
```

### How <<- searches for the variable

`<<-` walks up the chain of parent environments looking for the variable. If it doesn't find it anywhere, it creates it in the global environment.

```r
# <<- searches parent environments
outer <- function() {
  x <- 10
  cat("outer: x =", x, "\n")

  inner <- function() {
    cat("inner before: x =", x, "\n")
    x <<- 99  # Finds x in outer's environment
    cat("inner after: x =", x, "\n")
  }

  inner()
  cat("outer after inner(): x =", x, "\n")  # Changed!
}

outer()
```

### Creating a closure with <<-

```r
# Classic use case: a counter closure
make_counter <- function(start = 0) {
  count <- start

  list(
    increment = function() {
      count <<- count + 1  # Modifies count in make_counter's env
      count
    },
    get = function() count,
    reset = function() {
      count <<- start
    }
  )
}

ctr <- make_counter()
cat("Count:", ctr$get(), "\n")
cat("After increment:", ctr$increment(), "\n")
cat("After increment:", ctr$increment(), "\n")
cat("After increment:", ctr$increment(), "\n")
ctr$reset()
cat("After reset:", ctr$get(), "\n")
```

### Warning: <<- is dangerous

```r
# <<- can accidentally modify global variables
x <- "important data"
cat("Before:", x, "\n")

oops <- function() {
  # Typo or careless use of <<-
  x <<- "overwritten!"
}
oops()
cat("After:", x, "\n")  # Surprise!

# Restore
x <- "important data"
```

Use `<<-` only in closures where you intentionally need to modify a variable in an enclosing scope. Never use it as a general assignment operator.

## Right Assignment: -> and ->>

`->` and `->>` are the mirror images of `<-` and `<<-`. They assign left-to-right.

```r
# Right assignment: value -> name
42 -> answer
"hello" -> greeting
cat("answer:", answer, "\n")
cat("greeting:", greeting, "\n")

# Useful at the end of a pipe chain
mtcars |>
  subset(cyl == 4) |>
  nrow() -> four_cyl_count
cat("4-cylinder cars:", four_cyl_count, "\n")
```

`->>` is right superassignment (modifies parent scope), but it's extremely rare in practice.

```r
# ->> is right superassignment (rare)
outer_val <- 0
f <- function() {
  100 ->> outer_val
}
f()
cat("outer_val:", outer_val, "\n")
```

**Style note:** Most R programmers avoid `->` entirely. The tidyverse pipe style prefers `result <- data |> transform()` over `data |> transform() -> result`.

## The assign() Function

`assign()` is the functional form of assignment. It's useful when the variable name is stored in a string.

```r
# assign() when the variable name is dynamic
var_name <- "my_variable"
assign(var_name, 42)
cat("my_variable:", my_variable, "\n")

# Create multiple variables in a loop
for (i in 1:3) {
  assign(paste0("var_", i), i * 10)
}
cat("var_1:", var_1, "\n")
cat("var_2:", var_2, "\n")
cat("var_3:", var_3, "\n")

# assign() can target specific environments
my_env <- new.env(parent = emptyenv())
assign("secret", 99, envir = my_env)
cat("In my_env:", get("secret", envir = my_env), "\n")
```

### get() is the complement of assign()

```r
# get() retrieves a variable by name
x <- 100
var_name <- "x"
cat("Using get():", get(var_name), "\n")

# Useful for dynamic variable access
cols <- c("mpg", "cyl", "wt")
for (col in cols) {
  vals <- mtcars[[col]]
  cat(col, "mean:", round(mean(vals), 2), "\n")
}
```

**Warning:** Using `assign()` in loops to create `var_1`, `var_2`, etc. is generally bad practice. Use a list instead: `results <- list()` and `results[[i]] <- value`.

## Scoping Rules Summary

```r
# Demonstrate scoping with all operators
global_var <- "global"

test_scope <- function() {
  local_var <- "local"         # <- creates in current environment
  global_var <<- "modified"    # <<- modifies parent environment

  cat("Inside function:\n")
  cat("  local_var:", local_var, "\n")
  cat("  global_var:", global_var, "\n")
}

test_scope()
cat("\nOutside function:\n")
cat("  global_var:", global_var, "\n")
cat("  local_var exists?", exists("local_var"), "\n")

# Restore
global_var <- "global"
```

## Summary Table

| Operator | Direction | Scope | Use Case |
|----------|-----------|-------|----------|
| `<-` | Left | Current environment | Standard assignment (use this!) |
| `=` | Left | Current env (not in function args) | Function arguments only |
| `<<-` | Left | Parent environment | Closures, modifying enclosing scope |
| `->` | Right | Current environment | End of pipe chains (rare) |
| `->>` | Right | Parent environment | Almost never used |
| `assign()` | Function | Specified environment | Dynamic variable names |

## Practice Exercises

**Exercise 1:** What does this print? `f <- function() { x <- 1; g <- function() { x <<- 2 }; g(); cat(x) }; f()`

<details><summary>Click to reveal solution</summary>

It prints **2**. Inside `g()`, `x <<- 2` searches the parent environment (which is `f()`'s environment), finds `x` there, and modifies it to 2. When `f()` then prints `x`, it sees the modified value.

```r
f <- function() {
  x <- 1
  g <- function() {
    x <<- 2  # Modifies x in f()'s environment
  }
  g()
  cat("x:", x, "\n")
}
f()
```

</details>

**Exercise 2:** Create a `make_accumulator(start)` function that returns a function. Each call to the returned function should add its argument to the running total and return the new total. Use `<<-`.

<details><summary>Click to reveal solution</summary>

```r
make_accumulator <- function(start = 0) {
  total <- start
  function(x) {
    total <<- total + x
    total
  }
}

acc <- make_accumulator(100)
cat(acc(10), "\n")   # 110
cat(acc(20), "\n")   # 130
cat(acc(-5), "\n")   # 125
```

</details>

**Exercise 3:** Why does `data.frame(x = 1:3)` not create a variable `x` in your global environment, but `data.frame(x <- 1:3)` does?

<details><summary>Click to reveal solution</summary>

Inside a function call:
- `x = 1:3` is interpreted as a **named argument** -- it names the column "x" but does not assign to the variable `x` in the calling environment.
- `x <- 1:3` is interpreted as an **assignment expression** that evaluates to `1:3`. The assignment creates `x` in the global environment as a side effect, and the resulting value `1:3` is passed to `data.frame()` (but without the name "x").

```r
rm(list = "x", envir = globalenv())  # Clean up

df1 <- data.frame(x = 1:3)
cat("After x = 1:3, 'x' exists?", exists("x"), "\n")  # FALSE

df2 <- data.frame(x <- 1:3)
cat("After x <- 1:3, 'x' exists?", exists("x"), "\n")  # TRUE
cat("x:", x, "\n")

# Notice the column names differ too
cat("df1 colnames:", names(df1), "\n")  # "x"
cat("df2 colnames:", names(df2), "\n")  # Something like "x....1.3."
```

</details>

## FAQ

**Q: Should I ever use = for assignment instead of <-?**
In top-level scripts, `=` works identically to `<-`. Some programmers from other languages prefer it. However, the overwhelming R convention is `<-`. Mixing both in a codebase creates inconsistency. Stick with `<-`.

**Q: Is <<- ever okay to use?**
Yes, in closures (factory functions that return functions). The `make_counter()` and `make_accumulator()` patterns are legitimate uses. Avoid it everywhere else.

**Q: Does the space around <- matter?**
Yes! `x<-3` is ambiguous -- is it `x <- 3` or `x < -3`? Always add spaces: `x <- 3`. R parses `x<-3` as assignment, but `x< -3` is a comparison. Don't risk it.

## Continue Learning
- [R Names and Values](R-Names-and-Values.html) -- Deeper dive into copy-on-modify semantics
- [Understanding R Memory with lobstr](R-Memory-lobstr.html) -- Measure object sizes and references
- [R Environments and Scoping](R-Environments.html) -- How R looks up variables
