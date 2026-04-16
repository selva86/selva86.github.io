---
title: "R Internal Functions: .Internal(), .Call(), .External() — Low Level"
slug: "R-Internal-Functions"
description: "Brief guide to R's low-level interfaces: .Primitive(), .Internal(), .Call(), .External(), and how R functions call compiled C code underneath."
keywords: "R .Internal, R .Call, R .Primitive, R .External, R C interface, R compiled code, R low level functions"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "FR-inte-3"
post_type: "FR"
auto_link_terms: "R internal functions|.Internal()|.Call()|.Primitive()"
auto_link_case_sensitive: false
fr_parent: "R-Environments.html"
difficulty: "Intermediate"
---

# R Internal Functions: .Internal(), .Call(), .External() — Low Level

<p class="lead">Many R functions are thin wrappers around compiled C code. <code>.Primitive()</code> and <code>.Internal()</code> call built-in C routines inside R itself, while <code>.Call()</code> and <code>.External()</code> call C code in add-on packages. Understanding this layer explains why some functions are fast and why you can't always see their source code.</p>

## .Primitive() — The Fastest R Functions

Primitive functions are implemented directly in C with no R-level wrapper. They're the fastest operations in R:

```r
# These are all primitive functions
cat("typeof(sum):", typeof(sum), "\n")
cat("typeof(`+`):", typeof(`+`), "\n")
cat("typeof(`[`):", typeof(`[`), "\n")
cat("typeof(c):", typeof(c), "\n")

# Printing a primitive shows its C entry point
print(sum)
print(`+`)
```

```r
# You can identify primitives by their type
base_fns <- ls("package:base")
primitives <- Filter(function(fn) is.primitive(get(fn, "package:base")), base_fns)
cat("Total base functions:", length(base_fns), "\n")
cat("Primitive functions:", length(primitives), "\n")
cat("\nSample primitives:", paste(head(primitives, 10), collapse = ", "), "\n")
```

## .Internal() — Built-in R Functions

`.Internal()` calls C code that's compiled into R itself, but through a regular R function wrapper:

```r
# Many base functions use .Internal internally
# For example, paste() is an R function that calls .Internal(paste(...))

# You can see this by looking at the source
cat("body of grep:\n")
print(body(grep))
```

```r
# The difference: .Primitive skips R overhead, .Internal goes through R dispatch
cat("\nsum is primitive (no R wrapper):\n")
print(sum)

cat("\ngamma is a regular function using .Internal:\n")
# We can see the structure of functions that call .Internal
is_internal <- function(fn_name) {
  fn <- get(fn_name, "package:base")
  if (is.primitive(fn)) return("primitive")
  b <- body(fn)
  if (is.null(b)) return("primitive")
  if (any(grepl("\\.Internal", deparse(b)))) return(".Internal")
  "R-level"
}

samples <- c("sum", "paste", "grep", "mean", "which", "length")
for (fn in samples) {
  cat(sprintf("  %s: %s\n", fn, is_internal(fn)))
}
```

## .Call() and .External() — Package C Code

`.Call()` is the modern interface for R packages to call their own compiled C/C++ code:

```r
# Many CRAN packages use .Call for performance-critical code
# For example, stringr/stringi use C++ for string operations

# You can see .Call in package source code:
# function(x) {
#   .Call("C_my_fast_function", x, PACKAGE = "mypackage")
# }

# Demonstrate: some base R functions also use .Call
cat("Functions in base that use compiled code are common.\n")
cat("The pattern is: R function validates input, then calls C for speed.\n\n")

# Example: nchar uses C internally for speed
x <- rep("hello world", 100000)
t <- system.time(result <- nchar(x))
cat("nchar on 100k strings:", t["elapsed"], "sec\n")
cat("Result sample:", result[1], "characters\n")
```

## Summary of Interfaces

| Interface | Where the C code lives | Who uses it | Speed |
|-----------|----------------------|-------------|-------|
| `.Primitive()` | R core (no R wrapper) | Base R only | Fastest |
| `.Internal()` | R core (R wrapper) | Base R only | Very fast |
| `.Call()` | Package shared library | Any package | Fast |
| `.External()` | Package shared library | Older packages | Fast |
| `.C()` | Package shared library | Legacy interface | Fast (limited types) |

```r
# Quick way to see if a function hits C code
check_function <- function(fn_name, pkg = "base") {
  fn <- get(fn_name, paste0("package:", pkg))
  if (is.primitive(fn)) {
    cat(fn_name, "is primitive (direct C)\n")
  } else {
    src <- deparse(body(fn))
    if (any(grepl("\\.Internal", src))) cat(fn_name, "uses .Internal\n")
    else if (any(grepl("\\.Call", src))) cat(fn_name, "uses .Call\n")
    else cat(fn_name, "is pure R\n")
  }
}

check_function("sum")
check_function("paste")
check_function("mean")
check_function("which")
```

## FAQ

### Can I call .Internal() myself?

No. `.Internal()` can only be called from base R functions. If you try `eval(.Internal(paste(...)))` from user code, R blocks it for security and stability. Only `.Call()` is available for package authors.

### Why does print(sum) show ".Primitive" instead of source code?

Primitive functions have no R source code — they're implemented entirely in C. The R interpreter recognizes the function name and jumps directly to compiled code without creating an execution environment.

## Continue Learning

1. **R Promise Objects** — lazy evaluation and the force() function
2. **R Namespaces** — how packages organize their exported and internal functions
3. **R Environments** — the environment system that all function calls rely on
