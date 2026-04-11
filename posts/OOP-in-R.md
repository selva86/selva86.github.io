---
title: "OOP in R: S3, S4, R5, R6 Compared — Pick the Right System in 3 Questions"
slug: "OOP-in-R"
description: "R has four object-oriented systems — S3, S4, R5 (Reference), and R6. This guide compares them on syntax, dispatch, mutability, and use case, and gives a 3-question decision tree."
keywords: "OOP in R, R S3 vs S4, R R6, R object oriented programming, R classes comparison"
mathjax: false
webr: true
date: "2026-04-12"
curriculum_id: "4.3.1"
post_type: "C"
auto_link_terms: "OOP in R|R object systems|S3 vs S4|R OOP comparison"
auto_link_case_sensitive: false
sidebar_section: "Learn R"
sidebar_title: "OOP in R (Overview)"
sidebar_order: 41
---

# OOP in R: S3, S4, R5, R6 Compared — Pick the Right System in 3 Questions

<p class="lead">R has four object-oriented systems: <strong>S3</strong> (informal, the default for most of base R and ggplot2), <strong>S4</strong> (formal, used in Bioconductor), <strong>R5/Reference Classes</strong> (deprecated in favour of R6), and <strong>R6</strong> (mutable, encapsulated, the one you want for stateful objects). This guide lets you pick the right one in three questions.</p>

Most tutorials teach S3 as if it is OOP and leave S4/R6 for "advanced topics". That is backwards. S3 is a **convention**, not a class system — and for most everyday R code the convention is all you need. S4 and R6 are full systems; you reach for them when specific problems demand the formality. This post explains the trade-offs so you can decide, not the syntax of each one — each has its own tutorial.

## How Is OOP in R Different From Python or Java?

In Python, every object has a class, and methods live *on* the class (`obj.method()`). In R, S3 methods live on **generic functions** — you call `print(obj)`, and R looks at `obj`'s class to decide which `print.*` method to run. This is called **generic-function OOP**, and it is the dominant style in statistical languages (R, Julia, Common Lisp).

```r
x <- c(1, 2, 3)
class(x)
#> [1] "numeric"

# `print` is a generic — it dispatches on x's class
print(x)
#> [1] 1 2 3

m <- lm(mpg ~ wt, mtcars)
class(m)
#> [1] "lm"

# Same generic, different class, different method
print(m)
#> 
#> Call:
#> lm(formula = mpg ~ wt, data = mtcars)
#> 
#> Coefficients:
#> (Intercept)           wt  
#>      37.285       -5.344
```

Same function name (`print`), two completely different outputs. That is generic-function dispatch. You never wrote `x.print()`; you wrote `print(x)` and R found the right method by looking at `x`'s class.

[KEY INSIGHT]
**R's OOP is built around verbs, not nouns.** `summary(model)`, `plot(data)`, `predict(fit)` — the verb is the generic, the noun is the object. This fits statistics because the same operation (predict, summarise, plot) makes sense on wildly different objects. In Java/Python you would write `model.summary()`; in R you write `summary(model)`, and the language figures out which `summary` method to run.

## What Are the Four Systems?

Here is the 30-second tour of each. Detailed posts cover the syntax of each.

```r
# S3: informal, just set the class attribute
dog <- list(name = "Rex", breed = "Lab")
class(dog) <- "dog"
print.dog <- function(x, ...) cat("Dog:", x$name, "(", x$breed, ")\n")
print(dog)
#> Dog: Rex ( Lab )

# S4: formal, with slots and validation
setClass("Dog", representation(name = "character", breed = "character"))
rex4 <- new("Dog", name = "Rex", breed = "Lab")
rex4@name
#> [1] "Rex"

# R6: encapsulated, mutable, familiar to Python programmers
library(R6)
Dog6 <- R6Class("Dog6",
  public = list(
    name  = NULL,
    breed = NULL,
    initialize = function(name, breed) {
      self$name  <- name
      self$breed <- breed
    },
    bark = function() cat(self$name, "says woof!\n")
  )
)
rex6 <- Dog6$new("Rex", "Lab")
rex6$bark()
#> Rex says woof!
```

Three "Dog" classes, three very different styles. S3 is a five-line convention; S4 is a formal definition with slot types; R6 is an encapsulated class with methods attached to instances. None is "best" — each fits a different problem.

## How Do They Compare?

Here is the trade-off table. It is the most important thing to internalise before picking a system.

| Feature              | S3              | S4                  | R5 (Reference)       | R6                    |
|----------------------|-----------------|---------------------|----------------------|-----------------------|
| **Formality**        | Informal        | Formal              | Formal               | Formal                |
| **Dispatch**         | Single (class)  | Multi (class sig)   | Single               | Single                |
| **Mutable?**         | No (copy-on-modify) | No              | Yes (by reference)   | Yes (by reference)    |
| **Encapsulation**    | None            | Slots with `@`      | Fields + methods     | Public/private/active |
| **Method syntax**    | `verb(object)`  | `verb(object)`      | `object$method()`    | `object$method()`     |
| **Typical use**      | Everyday R      | Bioconductor, strict typing | (Legacy; use R6) | Stateful OO systems, Shiny modules |
| **Inheritance**      | Yes (cheap)     | Yes (multiple allowed) | Yes               | Yes                   |

The four axes that matter most: **mutability** (S3/S4 copy on change; R5/R6 mutate in place), **formality** (S3 is a convention, the rest are systems), **dispatch** (only S4 dispatches on multiple arguments), and **syntax** (S3/S4 use `generic(object)`, R5/R6 use `object$method()`).

## How Do You Pick? Three Questions

Answer these in order; the first "yes" ends the search.

**Question 1: Do you need the object to mutate in place?**
State that changes and needs to be shared — a database connection, a UI component, a growing log — cannot be modelled cleanly with S3 or S4 because R's copy-on-modify semantics give every "change" a new copy. Pick **R6**.

**Question 2: Do you need formal slot typing or multiple dispatch?**
Strict type checking, controlled inheritance, or methods that dispatch on more than one argument (e.g., `add(x, y)` where the behaviour depends on both classes) are S4's domain. Most Bioconductor packages use S4 for this reason. Pick **S4**.

**Question 3: Do none of the above apply?**
Pick **S3**. It is what 95% of R code uses, it is what `ggplot2`, `dplyr`, `lm`, `glm`, `data.frame`, and all of base R use. The default is S3 for a reason: low ceremony, high interop, zero learning curve.

```
Need mutation?  ─── yes ──▶ R6
       │
       no
       ▼
Need typing / multi-dispatch?  ─── yes ──▶ S4
       │
       no
       ▼
                           ─────────▶ S3  (the default)
```

[TIP]
**Start with S3. Graduate to R6 when you need state, or S4 when you need typing.** Do not pre-pick a formal system because "it seems more serious" — the informality of S3 is a feature, not a bug. You can always add structure later; you cannot take it away.

**Try it:** Write a one-line S3 classifier: make a list `p <- list(name = "Ann", age = 30)`, set its class to `"person"`, write `print.person`, and call `print(p)`.

```r
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
p <- list(name = "Ann", age = 30)
class(p) <- "person"
print.person <- function(x, ...) cat("Person:", x$name, "(", x$age, "yrs)\n")
print(p)
#> Person: Ann ( 30 yrs)
```

**Explanation:** Setting `class(p) <- "person"` tags the list. `print(p)` is the generic; R looks up `print.person` and runs it.

</details>

## Why Is R5 Deprecated in Favour of R6?

Reference Classes (R5) shipped with R 2.12 in 2010 as R's first attempt at mutable OO. R6 arrived in 2014 as a cleaner, faster alternative — same core ideas (mutable objects, methods attached to instances), but simpler internals, better performance, and no dependency on S4.

All new stateful-object code should use R6. The only reason to touch R5 is to maintain legacy code or to understand older Shiny internals.

## What About Newer Systems Like S7?

The R Consortium's Object-Oriented Programming Working Group (OOP-WG) has released **S7**, a new formal system designed to combine the best of S3 and S4. It is not yet widely adopted, and base R does not ship it, but it is worth knowing about. When S7 stabilises, it may become the recommended formal system for future code.

## Practice Exercises

### Exercise 1: Pick the System

For each scenario, pick S3, S4, or R6 and justify in one sentence.

- (a) A `data.frame`-like object with custom `print` and `summary` methods.
- (b) A Shiny UI component that tracks its own open/closed state.
- (c) A Bioconductor class with 12 typed slots and strict validation.

<details>
<summary>Click to reveal solution</summary>

- (a) **S3** — you are adding custom print/summary to a list-like structure; no mutation, no typing.
- (b) **R6** — stateful, mutable, needs encapsulation.
- (c) **S4** — typed slots and validation are S4's core offering.

</details>

### Exercise 2: Add an S3 `summary` Method

Given `p <- structure(list(name = "Ann", scores = c(85, 92, 78)), class = "student")`, write `summary.student` that prints the name and the mean score.

```r
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
p <- structure(list(name = "Ann", scores = c(85, 92, 78)), class = "student")

summary.student <- function(object, ...) {
  cat("Student:", object$name, "\n")
  cat("Average score:", mean(object$scores), "\n")
}

summary(p)
#> Student: Ann
#> Average score: 85
```

**Explanation:** `summary` is a generic. Defining `summary.student` teaches R what to do when `summary` is called on an object of class `"student"`.

</details>

## Summary

| System | Best for                                  |
|--------|-------------------------------------------|
| **S3** | Everyday R, custom print/summary/plot, fast prototyping |
| **S4** | Bioconductor, strict typing, multi-dispatch |
| **R5** | Legacy — use R6 instead                  |
| **R6** | Mutable state, Shiny components, OO systems |

## References

1. Wickham, H. — *Advanced R*, 2nd Edition, Part III: Object-Oriented Programming. [Link](https://adv-r.hadley.nz/oo.html)
2. Chambers, J. M. — *Software for Data Analysis: Programming with R*. Springer (2008).
3. `R6` package documentation. [Link](https://r6.r-lib.org/)
4. Bioconductor — S4 class guidelines. [Link](https://bioconductor.org/developers/how-to/commonMethodsAndClasses/)
5. R Consortium OOP-WG — S7 proposal. [Link](https://github.com/RConsortium/S7)

## Continue Learning

- [S3 Classes in R](S3-Classes-in-R.html) — the dominant informal system.
- [S4 Classes in R](S4-Classes-in-R.html) — formal typing and slots.
- [R6 Classes in R](R6-Classes-in-R.html) — mutable, encapsulated objects.
