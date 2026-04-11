---
title: "S3 Method Dispatch: Exactly How R Finds the Right Function for Your Object"
slug: "S3-Method-Dispatch-in-R"
description: "Walk through the exact algorithm R uses to match an S3 object to the right method, step by step. Learn UseMethod(), NextMethod(), and how the class vector drives everything."
keywords: "S3 method dispatch R, UseMethod R, NextMethod R, S3 class vector, R method resolution"
mathjax: false
webr: true
date: "2026-04-12"
curriculum_id: "4.3.3"
post_type: "C"
auto_link_terms: "S3 method dispatch|UseMethod|NextMethod|method dispatch R"
auto_link_case_sensitive: false
sidebar_section: "Learn R"
sidebar_title: "S3 Method Dispatch"
sidebar_order: 43
---

# S3 Method Dispatch: Exactly How R Finds the Right Function for Your Object

<p class="lead">When you call <code>print(x)</code>, R does not look at <code>print</code> — it looks at <code>x</code>. It reads <code>class(x)</code>, walks the class vector from left to right, and calls the first function it finds named <code>print.&lt;class&gt;</code>. That walk is <strong>S3 method dispatch</strong>, and this post traces it step by step.</p>

Most R programmers use S3 every day without knowing how dispatch works. That is fine until you hit a bug — a method that refuses to fire, or worse, the wrong method firing. Understanding the dispatch algorithm turns those mysteries into five-second fixes. By the end of this post you will be able to predict exactly which method R will call for any object.

## What Happens When You Call a Generic?

A **generic** is a function whose body contains a single call to `UseMethod()`. When you invoke it, `UseMethod()` takes over and runs the dispatch algorithm.

```r
# `print` is a generic
print
#> function (x, ...) 
#> UseMethod("print")
#> <bytecode: 0x...>
#> <environment: namespace:base>

x <- 1:3
class(x)
#> [1] "integer"

print(x)
#> [1] 1 2 3
```

When you called `print(x)`:
1. R entered the `print` function body.
2. It hit `UseMethod("print")`.
3. It read `class(x)`, which was `"integer"`.
4. It searched for `print.integer` — not found.
5. It searched for `print.default` — found.
6. It called `print.default(x)`.

Every S3 generic follows this same pattern. The generic itself is a five-character function whose only job is to delegate.

[KEY INSIGHT]
**`UseMethod` reads the class of the *first argument* and searches top-down through the class vector.** The rest of the search is a straightforward linear scan. There is no class hierarchy lookup, no method resolution order — just one vector, read in order.

## How Does the Class Vector Drive Dispatch?

An S3 object's `class` attribute can be a **vector**, not just a string. When the vector has multiple elements, dispatch tries each in order.

```r
x <- structure(list(name = "Ada"), class = c("scientist", "person"))

print.scientist <- function(x, ...) cat("Scientist:", x$name, "\n")
print.person    <- function(x, ...) cat("Person:",    x$name, "\n")

print(x)
#> Scientist: Ada
```

Dispatch walked the class vector `c("scientist", "person")`:
1. Searched for `print.scientist` — **found, called, done.**
2. `print.person` was never considered.

If you delete `print.scientist`, dispatch continues to the next class:

```r
rm(print.scientist)
print(x)
#> Person: Ada
```

Now the walk skips the missing `print.scientist` and lands on `print.person`. This left-to-right search is S3's entire inheritance mechanism. The leftmost class is the most specific; the rightmost is the most general.

## How Does `NextMethod()` Continue the Chain?

A subclass method can explicitly delegate to the parent class with `NextMethod()`. This resumes the dispatch walk *starting from the next class in the vector*.

```r
x <- structure(list(name = "Ada"), class = c("scientist", "person"))

print.scientist <- function(x, ...) {
  cat("[SCI] ")
  NextMethod()                    # resume at print.person
}
print.person <- function(x, ...) {
  cat("Person:", x$name, "\n")
}

print(x)
#> [SCI] Person: Ada
```

Without `NextMethod()`, `print.scientist` alone would run and `print.person` would be skipped. With it, both run — subclass first, superclass second. This is the S3 equivalent of Java's `super.method()`.

[WARNING]
**`NextMethod()` can only be called from inside a dispatched method.** Calling it elsewhere raises an error or returns unexpected results. And it must be called inside the method body — not inside a helper function the method delegates to.

## How Do You Inspect Which Method Will Be Called?

Use `sloop::s3_dispatch()` to print the full dispatch walk — every method R *would* try, with a check mark beside the one it actually calls.

```r
library(sloop)
x <- structure(list(name = "Ada"), class = c("scientist", "person"))

print.scientist <- function(x, ...) { cat("SCI\n"); NextMethod() }
print.person    <- function(x, ...) cat("Person:", x$name, "\n")

s3_dispatch(print(x))
#> => print.scientist
#>  * print.person
#>    print.default
```

The `=>` marks the first method found and called. The `*` marks methods later in the chain that `NextMethod()` will delegate to. Methods with no marker (like `print.default`) are in the chain but never reached. Running this on any mysterious dispatch is the fastest way to debug "why did it call that?".

**Try it:** Create `obj <- structure(1, class = c("a", "b", "c"))` and write three methods `print.a`, `print.b`, `print.c`. Call `s3_dispatch(print(obj))` and observe the output.

```r
library(sloop)
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
library(sloop)
obj <- structure(1, class = c("a", "b", "c"))

print.a <- function(x, ...) { cat("A\n"); NextMethod() }
print.b <- function(x, ...) { cat("B\n"); NextMethod() }
print.c <- function(x, ...) { cat("C\n") }

s3_dispatch(print(obj))
#> => print.a
#>  * print.b
#>  * print.c
#>    print.default
print(obj)
#> A
#> B
#> C
```

**Explanation:** `print.a` is dispatched first; each method calls `NextMethod()` to resume the walk, so all three fire in order.

</details>

## When Does Dispatch Fall Back to `.default`?

If no method matches any class in the vector, R tries `<generic>.default`. If that does not exist either, R raises an error.

```r
x <- structure(list(), class = "mystery")

# No print.mystery, but print.default exists → fallback
print(x)
#> list()
#> attr(,"class")
#> [1] "mystery"

# No method at all → error
greet <- function(x, ...) UseMethod("greet")
greet(x)
#> Error in UseMethod("greet") : 
#>   no applicable method for 'greet' applied to an object of class "mystery"
```

The `print.default` method is R's safety net — it knows how to print any object by inspecting its structure. When you write your own generics, provide a `.default` method whenever it makes sense to handle unknown inputs gracefully.

## What Is the Exact Algorithm?

Here is the full S3 dispatch algorithm, step by step. Memorising this answers every "why did that happen?" question.

```
Given: generic G, first argument x
1. Let classes ← class(x)
2. For each class C in classes (left to right):
     If G.C exists → call it with x; stop
3. If G.default exists → call it with x; stop
4. Otherwise → error "no applicable method"
```

`NextMethod()` inside step 2 resumes at the *next* class in the loop. That is the entire system. Notice what is *not* in the algorithm: no class hierarchy lookup, no method inheritance tree, no "find the most specific method" calculation. Just a linear scan through the class vector.

## Practice Exercises

### Exercise 1: Predict the Output

Without running the code, predict what `print(x)` prints:

```r
x <- structure(list(n = 1), class = c("child", "parent"))
print.parent <- function(x, ...) cat("PARENT", x$n, "\n")
print.child  <- function(x, ...) { cat("CHILD "); NextMethod() }
```

<details>
<summary>Click to reveal solution</summary>

```
CHILD PARENT 1 
```

**Explanation:** Dispatch finds `print.child` first. It prints `"CHILD "`, then calls `NextMethod()` which resumes at `print.parent`. That prints `"PARENT 1"`.

</details>

### Exercise 2: Add a `default` Fallback

Write a generic `describe(x)` with methods `describe.numeric`, `describe.character`, and `describe.default`. Test on `42`, `"hi"`, and `TRUE` (which triggers default).

```r
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
describe <- function(x, ...) UseMethod("describe")

describe.numeric   <- function(x, ...) cat("Number:", x, "\n")
describe.character <- function(x, ...) cat("String:", x, "\n")
describe.default   <- function(x, ...) cat("Unknown type:", class(x), "\n")

describe(42)
#> Number: 42
describe("hi")
#> String: hi
describe(TRUE)
#> Unknown type: logical
```

**Explanation:** `TRUE` has class `"logical"`, which has no specific method — dispatch falls back to `describe.default`.

</details>

## Summary

| Step                   | What happens                                         |
|------------------------|------------------------------------------------------|
| `UseMethod("f")`       | Reads `class(x)` and starts the walk                |
| Walk class vector      | Looks for `f.<class>` in order, left to right       |
| Method found           | Calls it, ignores remaining classes                  |
| `NextMethod()` inside  | Resumes at the next class in the vector             |
| Exhausted vector       | Tries `f.default`                                    |
| No `f.default`         | Raises "no applicable method"                        |

## References

1. Wickham, H. — *Advanced R*, 2nd Edition, Chapter 13: S3. [Link](https://adv-r.hadley.nz/s3.html)
2. R Core Team — *R Language Definition*, Methods section. [Link](https://cran.r-project.org/doc/manuals/r-release/R-lang.html#Object_002doriented-programming)
3. `sloop::s3_dispatch`. [Link](https://sloop.r-lib.org/reference/s3_dispatch.html)
4. Chambers, J. M. — *Software for Data Analysis*, OOP chapter.
5. `base::UseMethod` help page. [Link](https://rdrr.io/r/base/UseMethod.html)

## Continue Learning

- [S3 Classes in R](S3-Classes-in-R.html) — build classes; this post shows how R finds their methods.
- [OOP in R](OOP-in-R.html) — where S3 dispatch fits in the bigger picture.
- [S4 Classes in R](S4-Classes-in-R.html) — the formal system with multi-argument dispatch.
