---
title: "sloop Package in R: otype(), ftype() — Inspect Any Object's OOP System"
slug: "sloop-Package-in-R"
description: "Use the sloop package to inspect R objects: otype() identifies the OOP system, ftype() classifies functions, and s3_dispatch() traces method resolution."
keywords: "sloop package R, otype R, ftype R, s3_dispatch, R OOP inspection, R object type, sloop tutorial"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "FR-oop-2"
post_type: "FR"
auto_link_terms: "sloop package|otype()|ftype()|s3_dispatch"
auto_link_case_sensitive: false
fr_parent: "OOP-in-R.html"
---

# sloop Package in R: otype(), ftype() -- Inspect Any Object's OOP System

<p class="lead">R has four OOP systems (S3, S4, R5, R6), and it's not always obvious which one an object uses. The <strong>sloop</strong> package gives you tools to answer "what kind of object is this?" and "how does method dispatch work for this call?" in one line of code.</p>

When you encounter an unfamiliar object from a package, sloop helps you understand what you're dealing with before you start writing code.

## Installing and Loading sloop

```r
# Install if needed
# install.packages("sloop")
library(sloop)
```

Note: sloop may not be available in WebR. The examples below show what the output looks like, and we also demonstrate manual alternatives that work everywhere.

## otype(): Identify the OOP System

`otype()` tells you whether an object is base, S3, S4, or R5/R6.

```r
# Base R types (no OOP)
cat("integer:", otype(1L), "\n")
cat("character:", otype("hello"), "\n")
cat("function:", otype(mean), "\n")

# S3 objects
cat("data.frame:", otype(mtcars), "\n")
cat("factor:", otype(factor(c("a", "b"))), "\n")
cat("lm:", otype(lm(mpg ~ wt, data = mtcars)), "\n")

# S4 example (if available)
# cat("S4 object:", otype(new("ClassName")), "\n")
```

### Manual Alternative (no sloop needed)

```r
# Determine OOP system manually
identify_oop <- function(x) {
  if (isS4(x)) return("S4")
  if (is.environment(x) && !is.null(x$clone)) return("R6")
  if (is(x, "envRefClass")) return("R5")
  if (!is.null(attr(x, "class"))) return("S3")
  return("base")
}

cat("mtcars:", identify_oop(mtcars), "\n")
cat("1:10:", identify_oop(1:10), "\n")
cat("factor:", identify_oop(factor("a")), "\n")

fit <- lm(mpg ~ wt, data = mtcars)
cat("lm object:", identify_oop(fit), "\n")
```

## ftype(): Classify Functions

`ftype()` tells you whether a function is a generic, a method, or a regular function, and which OOP system it belongs to.

```r
# What kind of function is this?
cat("mean:", ftype(mean), "\n")           # S3 generic
cat("print:", ftype(print), "\n")         # S3 generic
cat("t.test:", ftype(t.test), "\n")       # S3 generic
cat("sum:", ftype(sum), "\n")             # S3 generic (group)
cat("str:", ftype(str), "\n")             # S3 generic
```

### Manual Alternative

```r
# Check if a function is an S3 generic
is_s3_generic <- function(fn_name) {
  fn <- get(fn_name)
  if (!is.function(fn)) return("not a function")
  body_text <- paste(deparse(body(fn)), collapse = " ")
  if (grepl("UseMethod", body_text)) return("S3 generic")
  if (grepl("standardGeneric", body_text)) return("S4 generic")
  # Check if it's an S3 method (name contains a dot and matches generic.class pattern)
  if (grepl("\\.", fn_name)) {
    parts <- strsplit(fn_name, "\\.")[[1]]
    for (i in 1:(length(parts)-1)) {
      generic <- paste(parts[1:i], collapse = ".")
      if (exists(generic) && is.function(get(generic))) {
        g_body <- paste(deparse(body(get(generic))), collapse = " ")
        if (grepl("UseMethod", g_body)) return(paste("S3 method for", generic))
      }
    }
  }
  return("regular function")
}

cat("mean:", is_s3_generic("mean"), "\n")
cat("print:", is_s3_generic("print"), "\n")
cat("print.data.frame:", is_s3_generic("print.data.frame"), "\n")
cat("sqrt:", is_s3_generic("sqrt"), "\n")
```

## s3_dispatch(): Trace Method Resolution

`s3_dispatch()` shows which methods R considers when dispatching an S3 call, and which one wins.

```r
# See dispatch for print on a data.frame
s3_dispatch(print(mtcars))
# Shows:
# => print.data.frame
#  * print.default

# Dispatch for a glm object (multiple classes)
fit <- glm(am ~ wt, data = mtcars, family = binomial)
s3_dispatch(print(fit))
```

### Manual Dispatch Tracing

```r
# Manually trace S3 dispatch
trace_dispatch <- function(generic_name, obj) {
  classes <- class(obj)
  cat("Object classes:", paste(classes, collapse = " -> "), "\n")
  cat("Dispatch order for", generic_name, ":\n")

  found <- FALSE
  for (cls in classes) {
    method_name <- paste0(generic_name, ".", cls)
    exists_flag <- exists(method_name, mode = "function")
    marker <- if (!found && exists_flag) { found <- TRUE; "=> " } else if (exists_flag) "   " else "   "
    status <- if (exists_flag) "EXISTS" else "not found"
    cat(marker, method_name, "-", status, "\n")
  }

  default_name <- paste0(generic_name, ".default")
  if (exists(default_name, mode = "function")) {
    marker <- if (!found) "=> " else "   "
    cat(marker, default_name, "- EXISTS (fallback)\n")
  }
}

# Test with different objects
trace_dispatch("print", mtcars)
cat("\n")
trace_dispatch("summary", lm(mpg ~ wt, data = mtcars))
```

## Practical Examples: Investigating Unknown Objects

When you get an object from a package and don't know what it is, here's a systematic approach.

```r
# A mystery object from a model fit
fit <- lm(mpg ~ wt + hp, data = mtcars)

# Step 1: What class(es)?
cat("Class:", class(fit), "\n")

# Step 2: What OOP system?
cat("Is S4:", isS4(fit), "\n")
cat("Has class attr:", !is.null(attr(fit, "class")), "\n")

# Step 3: What methods are available?
cat("\nMethods for 'lm' objects:\n")
print(methods(class = "lm"))

# Step 4: What does it contain?
cat("\nNames in lm object:\n")
cat(names(fit), sep = ", ")
cat("\n")

# Step 5: What generic works on it?
cat("\nSummary dispatch:\n")
cat("summary.lm exists:", exists("summary.lm", mode = "function"), "\n")
cat("plot.lm exists:", exists("plot.lm", mode = "function"), "\n")
cat("coef.lm exists:", exists("coef.lm", mode = "function"), "\n")
```

### Investigating S4 Objects

```r
# Create an S4 class for demonstration
setClass("Experiment",
  slots = list(
    name = "character",
    data = "data.frame",
    date = "character"
  )
)

exp1 <- new("Experiment",
  name = "Trial-1",
  data = head(iris, 5),
  date = "2026-03-29"
)

# Inspect the S4 object
cat("Is S4:", isS4(exp1), "\n")
cat("Class:", class(exp1), "\n")
cat("Slot names:", slotNames(exp1), "\n")

# Show slot types
for (s in slotNames(exp1)) {
  cat("  @", s, ":", class(slot(exp1, s)), "\n")
}

# Check class hierarchy
cat("Superclasses:", paste(is(exp1), collapse = ", "), "\n")
```

## Finding All Methods for a Generic

```r
# What classes have a print method?
print_methods <- methods("print")
cat("Number of print methods:", length(print_methods), "\n")
cat("First 20:\n")
print(head(print_methods, 20))

# What methods exist for a specific class?
cat("\nMethods for class 'factor':\n")
print(methods(class = "factor"))
```

## Summary Table

| sloop Function | Purpose | Manual Alternative |
|---------------|---------|-------------------|
| `otype(x)` | OOP system of object | `isS4()`, `is.environment()`, check class attr |
| `ftype(f)` | Type of function (generic/method/regular) | Check for `UseMethod`/`standardGeneric` in body |
| `s3_dispatch(call)` | Show method resolution chain | `methods()` + manual class iteration |
| `s3_get_method(f.class)` | Retrieve the actual method function | `getAnywhere("f.class")` |
| `s3_methods_generic(g)` | All methods for a generic | `methods("generic")` |
| `s3_methods_class(c)` | All methods for a class | `methods(class = "class")` |

## Practice Exercises

**Exercise 1:** Given `fit <- lm(mpg ~ wt, data = mtcars)`, determine its class, OOP system, and list 5 methods that work on it.

<details><summary>Click to reveal solution</summary>

```r
fit <- lm(mpg ~ wt, data = mtcars)
cat("Class:", class(fit), "\n")
cat("Is S4:", isS4(fit), "\n")
cat("OOP system: S3 (has class attribute, not S4)\n\n")

lm_methods <- methods(class = "lm")
cat("First 5 methods for lm:\n")
print(head(lm_methods, 5))
```

</details>

**Exercise 2:** Write a function `inspect_object(x)` that prints the class, OOP system, and available methods for any R object.

<details><summary>Click to reveal solution</summary>

```r
inspect_object <- function(x) {
  cat("=== Object Inspection ===\n")
  cat("Class:", paste(class(x), collapse = " > "), "\n")

  oop <- if (isS4(x)) "S4"
    else if (is.environment(x)) "R6/R5"
    else if (!is.null(attr(x, "class"))) "S3"
    else "base"
  cat("OOP System:", oop, "\n")

  if (oop %in% c("S3", "S4")) {
    meths <- methods(class = class(x)[1])
    cat("Methods (first 10):\n")
    print(head(meths, 10))
  }
}

inspect_object(mtcars)
cat("\n")
inspect_object(factor(c("a", "b")))
```

</details>

## FAQ

**Q: Do I need sloop for everyday R programming?**
No. sloop is a debugging and learning tool. You use it when investigating unfamiliar objects or understanding dispatch. It's not needed in production code.

**Q: Can sloop inspect R6 objects?**
`otype()` returns "R6" for R6 objects. However, R6 doesn't use S3/S4 dispatch, so `s3_dispatch()` isn't relevant for R6 methods.

**Q: What is the difference between otype() and class()?**
`class()` tells you the class name(s). `otype()` tells you which OOP system the object belongs to. A data.frame has class "data.frame" and otype "S3".

## What's Next

- [OOP in R Overview](OOP-in-R.html) -- Compare all four OOP systems
- [S3 Method Dispatch](S3-Method-Dispatch-in-R.html) -- Deep dive into how UseMethod() works
- [OOP Design Patterns in R](OOP-Design-Patterns-in-R.html) -- Factory, strategy, and observer patterns
