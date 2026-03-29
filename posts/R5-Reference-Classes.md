---
title: "R5 Reference Classes in R: setRefClass() — Legacy OOP"
slug: "R5-Reference-Classes"
description: "Introduction to R5 Reference Classes in R with setRefClass(). Learn the basics, why R6 is preferred, and when you might encounter R5 in legacy code."
keywords: "R5 reference classes, setRefClass R, R reference classes, R5 vs R6, legacy OOP R, mutable objects R"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "FR-oop-1"
post_type: "FR"
auto_link_terms: "R5 reference classes|setRefClass|reference classes R"
auto_link_case_sensitive: false
fr_parent: "OOP-in-R.html"
---

# R5 Reference Classes in R: setRefClass() -- Legacy OOP

<p class="lead"><strong>R5 Reference Classes</strong> (also called "R5" or just "Reference Classes") were R's first built-in system for mutable, reference-semantics objects. They use <code>setRefClass()</code> and are part of base R. However, the <strong>R6</strong> package has largely replaced them for new code due to better performance and simpler syntax.</p>

You'll encounter R5 in older packages and Bioconductor code. This tutorial covers the essentials so you can read and maintain R5 code, while explaining why R6 is the better choice for new projects.

## Why R6 Is Preferred Over R5

| Feature | R5 (Reference Classes) | R6 |
|---------|------------------------|-----|
| Speed | Slower (S4 machinery underneath) | Faster |
| Syntax | More verbose | Cleaner |
| Dependencies | Base R | R6 package (zero deps) |
| Active bindings | No | Yes |
| Private fields | Via locking (awkward) | Native support |
| Deep clone | Manual | Built-in |
| Community | Declining | Growing |

The main reason to learn R5 is to read legacy code. For new projects, use R6.

## Basic R5 Class Definition

```r
# Define a Reference Class
Person <- setRefClass("Person",
  fields = list(
    name = "character",
    age = "numeric"
  ),
  methods = list(
    initialize = function(name, age) {
      name <<- name  # <<- assigns to the field, not a local variable
      age <<- age
    },

    greet = function() {
      cat("Hi, I'm", name, "and I'm", age, "years old.\n")
    },

    have_birthday = function() {
      age <<- age + 1  # Modifies in place (reference semantics)
      cat(name, "is now", age, "\n")
    }
  )
)

# Create an instance
alice <- Person$new("Alice", 30)
alice$greet()
alice$have_birthday()
alice$greet()
```

Note the `<<-` operator inside methods. In R5, methods run in their own environment, so you must use `<<-` to modify the object's fields (not `<-`, which would create a local variable).

## Reference Semantics (Same as R6)

Like R6, R5 objects use reference semantics. Assignment does not copy.

```r
Counter <- setRefClass("Counter",
  fields = list(
    count = "numeric"
  ),
  methods = list(
    initialize = function() {
      count <<- 0
    },
    increment = function() {
      count <<- count + 1
    }
  )
)

c1 <- Counter$new()
c2 <- c1  # NOT a copy!

c1$increment()
c1$increment()
cat("c1:", c1$count, "\n")  # 2
cat("c2:", c2$count, "\n")  # Also 2! Same object.

# Use $copy() for an independent copy
c3 <- c1$copy()
c1$increment()
cat("c1:", c1$count, "\n")  # 3
cat("c3:", c3$count, "\n")  # Still 2
```

## Inheritance

```r
Animal <- setRefClass("Animal",
  fields = list(
    name = "character",
    sound = "character"
  ),
  methods = list(
    initialize = function(name, sound) {
      name <<- name
      sound <<- sound
    },
    speak = function() {
      cat(name, "says:", sound, "\n")
    }
  )
)

Dog <- setRefClass("Dog",
  contains = "Animal",
  fields = list(
    breed = "character"
  ),
  methods = list(
    initialize = function(name, breed) {
      callSuper(name = name, sound = "Woof")  # Call parent constructor
      breed <<- breed
    },
    describe = function() {
      cat(name, "is a", breed, "\n")
      speak()  # Can call inherited methods directly
    }
  )
)

rex <- Dog$new("Rex", "Labrador")
rex$describe()
rex$speak()
```

## Field Access and the show() Method

```r
Config <- setRefClass("Config",
  fields = list(
    verbose = "logical",
    max_iter = "numeric",
    label = "character"
  ),
  methods = list(
    initialize = function(label = "default", verbose = FALSE, max_iter = 100) {
      label <<- label
      verbose <<- verbose
      max_iter <<- max_iter
    },

    show = function() {
      cat("Config:", label, "\n")
      cat("  verbose:", verbose, "\n")
      cat("  max_iter:", max_iter, "\n")
    }
  )
)

cfg <- Config$new("experiment-1", verbose = TRUE, max_iter = 500)
cfg$show()

# Fields can be accessed and modified directly
cfg$max_iter <- 1000
cat("Updated max_iter:", cfg$max_iter, "\n")
```

## When You Might Encounter R5

R5 appears in several well-known packages:

- **Bioconductor** packages that predate R6
- **shiny** internals (though newer parts use R6)
- **RStudio** addins and older IDE tools
- **igraph** and some network analysis packages

When working with these, you'll recognize R5 by `setRefClass()` calls, `<<-` inside methods, and `$copy()` instead of `$clone()`.

## Converting R5 to R6

If you're modernizing code, conversion is straightforward:

```r
# R5 version
# MyClass <- setRefClass("MyClass",
#   fields = list(x = "numeric"),
#   methods = list(
#     initialize = function(x) { x <<- x },
#     double_x = function() { x <<- x * 2 }
#   )
# )

# R6 equivalent
library(R6)

MyClass <- R6Class("MyClass",
  public = list(
    x = NULL,
    initialize = function(x) { self$x <- x },
    double_x = function() { self$x <- self$x * 2 }
  )
)

obj <- MyClass$new(5)
obj$double_x()
cat("x:", obj$x, "\n")
```

Key changes when converting:
- `setRefClass()` becomes `R6Class()`
- `fields` becomes part of `public` (or `private`)
- `<<-` becomes `self$`
- `callSuper()` becomes `super$initialize()`
- `$copy()` becomes `$clone()`

## Summary Table

| R5 Feature | Syntax | R6 Equivalent |
|-----------|--------|---------------|
| Define class | `setRefClass("Name", fields=..., methods=...)` | `R6Class("Name", public=...)` |
| Field assignment | `field <<- value` | `self$field <- value` |
| Create instance | `ClassName$new(...)` | Same |
| Copy | `obj$copy()` | `obj$clone()` |
| Inheritance | `contains = "Parent"` | `inherit = Parent` |
| Call parent | `callSuper(...)` | `super$method(...)` |
| Show/print | `show = function() ...` | `print = function(...) ...` |

## Practice Exercises

**Exercise 1:** Create an R5 `Stack` class with `push(val)`, `pop()`, and `size()` methods.

<details><summary>Click to reveal solution</summary>

```r
Stack <- setRefClass("Stack",
  fields = list(
    elements = "list"
  ),
  methods = list(
    initialize = function() {
      elements <<- list()
    },
    push = function(val) {
      elements[[length(elements) + 1]] <<- val
    },
    pop = function() {
      if (length(elements) == 0) stop("Stack empty")
      val <- elements[[length(elements)]]
      elements[[length(elements)]] <<- NULL
      val
    },
    size = function() {
      length(elements)
    }
  )
)

s <- Stack$new()
s$push(10)
s$push(20)
cat("Size:", s$size(), "\n")
cat("Pop:", s$pop(), "\n")
cat("Size:", s$size(), "\n")
```

</details>

**Exercise 2:** Convert the Stack class above to R6.

<details><summary>Click to reveal solution</summary>

```r
library(R6)

Stack <- R6Class("Stack",
  public = list(
    initialize = function() {
      private$elements <- list()
    },
    push = function(val) {
      private$elements[[length(private$elements) + 1]] <- val
      invisible(self)
    },
    pop = function() {
      n <- length(private$elements)
      if (n == 0) stop("Stack empty")
      val <- private$elements[[n]]
      private$elements[[n]] <- NULL
      val
    },
    size = function() length(private$elements)
  ),
  private = list(
    elements = NULL
  )
)

s <- Stack$new()
s$push(10)$push(20)
cat("Size:", s$size(), "\n")
cat("Pop:", s$pop(), "\n")
```

</details>

## FAQ

**Q: Is R5 deprecated?**
No. R5 is part of base R and will continue to work. It's just not the recommended choice for new code. R6 is faster, simpler, and has a more active community.

**Q: Can R5 and R6 objects interact?**
Yes. They're just R objects. You can pass an R5 object as an argument to an R6 method and vice versa. They don't interoperate at the class level (no cross-system inheritance), but they coexist fine.

**Q: Why does R5 use <<- instead of self$?**
R5 methods run in a special environment where fields are in the parent environment. `<<-` assigns to the parent environment (the object's fields). This is confusing, which is one reason R6 switched to explicit `self$`.

## What's Next

- [R6 Classes in R](R6-Classes-in-R.html) -- The modern replacement for R5
- [OOP in R Overview](OOP-in-R.html) -- Compare S3, S4, R5, and R6 side by side
- [sloop Package in R](sloop-Package-in-R.html) -- Inspect any object's OOP system
