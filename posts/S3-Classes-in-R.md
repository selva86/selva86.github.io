---
title: "S3 Classes in R: Build a Custom Object System in Under 20 Lines"
slug: "S3-Classes-in-R"
description: "S3 is R's informal class system — just an attribute on an object plus method functions named class.method. Learn to build one in 20 lines, with constructors, print methods, and inheritance."
keywords: "S3 classes in R, R S3 methods, R class attribute, S3 inheritance R, R OOP S3"
mathjax: false
webr: true
date: "2026-04-12"
curriculum_id: "4.3.2"
post_type: "C"
auto_link_terms: "S3 classes|S3 class|S3 method|S3 inheritance"
auto_link_case_sensitive: false
sidebar_section: "Learn R"
sidebar_title: "S3 Classes in R"
sidebar_order: 42
---

# S3 Classes in R: Build a Custom Object System in Under 20 Lines

<p class="lead">An S3 class is just an attribute on an R object plus a set of functions named <code>generic.class</code>. That is the entire system. You set <code>class(x) &lt;- "foo"</code>, write <code>print.foo</code>, and R automatically calls it when you <code>print(x)</code>. No setup, no boilerplate.</p>

S3 powers 95% of R — every `lm`, `glm`, `data.frame`, `ggplot`, `table`, and `factor` is an S3 object. Learning S3 is learning how base R actually works under the hood. This tutorial walks you from the empty canvas to a fully working class with a constructor, validator, `print` method, and a subclass — all in plain base R.

## How Do You Create an S3 Class?

An S3 object is any R object with a `class` attribute. Setting that attribute *is* creating the class. The simplest possible S3 object is a list with a class tag.

```r
# Minimal S3 object
person <- list(name = "Ada Lovelace", birth = 1815)
class(person) <- "person"

class(person)
#> [1] "person"

print(person)
#> $name
#> [1] "Ada Lovelace"
#> 
#> $birth
#> [1] 1815
#> 
#> attr(,"class")
#> [1] "person"
```

The `class(person) <- "person"` line is the *entire* act of creating the class. The default `print` method does not know what a `person` is, so it falls back to printing the underlying list. The next step — writing `print.person` — is where S3 starts to feel like OOP.

[KEY INSIGHT]
**S3 is an informal convention, not a system.** There is no class registry. There is no constructor keyword. The runtime just looks at the `class` attribute and dispatches. That is what makes it flexible (and what makes it occasionally fragile — see the validator section below).

## How Does Method Dispatch Work?

When you call a generic function like `print(x)`, R inspects `class(x)` and looks for a method named `print.<class>`. If it finds one, it calls it; if not, it tries the next class in the vector, and finally falls back to `print.default`.

```r
print.person <- function(x, ...) {
  cat("Person:", x$name, "\n")
  cat("Born:  ", x$birth, "\n")
  invisible(x)
}

person <- list(name = "Ada Lovelace", birth = 1815)
class(person) <- "person"
print(person)
#> Person: Ada Lovelace 
#> Born:   1815
```

Calling `print(person)` did not go through our method directly — it went through the generic `print`, which used **UseMethod** to find `print.person`. That is the entire dispatch mechanism: the generic asks "what class is this?" and calls the matching function. For the step-by-step mechanics, see the dedicated post on [S3 Method Dispatch](S3-Method-Dispatch-in-R.html).

Why must you `return(invisible(x))` from a `print` method? Because `print` is expected not to print the returned value a second time. Returning invisibly keeps the REPL quiet.

## How Do You Write a Proper Constructor?

A constructor is just a function that builds the object and sets its class. Convention: name it the same as the class, prefixed with `new_`. It should do no validation — its only job is to wrap the inputs.

```r
new_person <- function(name, birth) {
  stopifnot(is.character(name), length(name) == 1)
  stopifnot(is.numeric(birth),  length(birth) == 1)
  structure(
    list(name = name, birth = birth),
    class = "person"
  )
}

ada <- new_person("Ada Lovelace", 1815)
print(ada)
#> Person: Ada Lovelace 
#> Born:   1815
```

`structure()` is the idiomatic way to create an object and attach attributes in one call. The `stopifnot` calls check argument types — this is type validation, not business validation. Hadley Wickham recommends a three-function pattern: **constructor** (`new_person`), **validator** (`validate_person`), and **helper** (`person`). For small classes you can collapse them into one.

**Try it:** Write `new_point(x, y)` that builds an S3 object of class `"point"` from two numeric coordinates. Test on `new_point(3, 4)`.

```r
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
new_point <- function(x, y) {
  stopifnot(is.numeric(x), is.numeric(y))
  structure(list(x = x, y = y), class = "point")
}

p <- new_point(3, 4)
class(p)
#> [1] "point"
p$x
#> [1] 3
```

**Explanation:** `structure()` wraps the list and tags it with `class = "point"` in one step. The `stopifnot` lines guard against non-numeric inputs.

</details>

## How Do You Add More Methods?

Write one function per generic you want to support. The naming rule is the same: `generic.class`.

```r
# A summary method
summary.person <- function(object, ...) {
  age <- as.numeric(format(Sys.Date(), "%Y")) - object$birth
  cat("Summary of person:\n")
  cat("  Name:", object$name, "\n")
  cat("  Age: ", age, "years\n")
  invisible(object)
}

# A format method — useful inside other output
format.person <- function(x, ...) {
  paste0(x$name, " (b. ", x$birth, ")")
}

ada <- new_person("Ada Lovelace", 1815)
summary(ada)
#> Summary of person:
#>   Name: Ada Lovelace 
#>   Age:  211 years
format(ada)
#> [1] "Ada Lovelace (b. 1815)"
```

You can also invent your own generics — see `UseMethod` below. The library of common generics you will most often extend is: `print`, `format`, `summary`, `plot`, `as.character`, `as.data.frame`, `length`, `[`, `[[`, `$`, `c`.

## How Do You Implement Inheritance?

S3 inheritance is a *vector* of class names. R tries each class in order. Put the most specific class first, the most general last.

```r
new_scientist <- function(name, birth, field) {
  obj <- new_person(name, birth)
  obj$field <- field
  class(obj) <- c("scientist", class(obj))  # scientist first, then person
  obj
}

print.scientist <- function(x, ...) {
  NextMethod()                               # calls print.person first
  cat("Field: ", x$field, "\n")
}

ada <- new_scientist("Ada Lovelace", 1815, "Computing")
print(ada)
#> Person: Ada Lovelace 
#> Born:   1815 
#> Field:  Computing
```

`NextMethod()` is the key — it tells R to continue the dispatch chain, calling `print.person` after `print.scientist` has done its part. The class vector `c("scientist", "person")` defines the order. This mimics classical single inheritance: a scientist **is-a** person.

[TIP]
**Put the most specific class first.** `c("scientist", "person")` means "try scientist methods, fall back to person, fall back to default". Reversing the order breaks dispatch — R would find `print.person` first and never look for `print.scientist`.

## How Do You Write Your Own Generic?

A generic is a function containing exactly one call — `UseMethod("generic_name")`. R does the dispatch for you.

```r
# Define the generic
greet <- function(x, ...) UseMethod("greet")

# Default method — called when no class-specific method exists
greet.default <- function(x, ...) cat("Hello, stranger!\n")

# Method for person
greet.person <- function(x, ...) cat("Hello,", x$name, "!\n")

greet("world")
#> Hello, stranger!

ada <- new_person("Ada Lovelace", 1815)
greet(ada)
#> Hello, Ada Lovelace !
```

`UseMethod("greet")` tells R "look at the first argument's class, find `greet.<class>`, call it". Defining `greet.default` is good manners — it handles unknown classes gracefully.

## Practice Exercises

### Exercise 1: Build a `money` Class

Write `new_money(amount, currency)` that creates an S3 object. Add a `print.money` method that formats as `"$1234.50 USD"`. Test on `new_money(1234.5, "USD")`.

```r
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
new_money <- function(amount, currency) {
  stopifnot(is.numeric(amount), is.character(currency))
  structure(list(amount = amount, currency = currency), class = "money")
}

print.money <- function(x, ...) {
  cat(formatC(x$amount, format = "f", digits = 2, big.mark = ","),
      x$currency, "\n")
  invisible(x)
}

m <- new_money(1234.5, "USD")
print(m)
#> 1,234.50 USD
```

**Explanation:** The constructor builds the object; the method uses `formatC` to produce fixed-decimal output with a thousands separator.

</details>

### Exercise 2: Inheritance With `NextMethod`

Extend the `money` class with a `taxable_money` subclass that adds a `tax_rate` field. Write `print.taxable_money` that calls `NextMethod()` and then prints the tax amount.

```r
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
new_taxable_money <- function(amount, currency, tax_rate) {
  m <- new_money(amount, currency)
  m$tax_rate <- tax_rate
  class(m) <- c("taxable_money", class(m))
  m
}

print.taxable_money <- function(x, ...) {
  NextMethod()
  cat("  Tax @", x$tax_rate * 100, "%: ",
      formatC(x$amount * x$tax_rate, format = "f", digits = 2), "\n")
  invisible(x)
}

tm <- new_taxable_money(1000, "USD", 0.07)
print(tm)
#> 1,000.00 USD 
#>   Tax @ 7 %:  70.00
```

**Explanation:** `NextMethod()` runs `print.money` first, then the subclass method adds the tax line. The class vector `c("taxable_money", "money")` puts the subclass first.

</details>

## Summary

| Ingredient            | What it does                          |
|-----------------------|----------------------------------------|
| `class(x) <- "foo"`   | Tags an object with a class            |
| `generic.class`       | The method function name convention   |
| `UseMethod("generic")`| The single line that defines a generic |
| `NextMethod()`        | Continue dispatch up the class vector |
| `structure(x, class = "foo")` | Idiomatic one-line constructor  |

## References

1. Wickham, H. — *Advanced R*, 2nd Edition, Chapter 13: S3. [Link](https://adv-r.hadley.nz/s3.html)
2. Chambers, J. M. — *Extending R*. CRC Press (2016).
3. R Core Team — *R Language Definition*, OOP section. [Link](https://cran.r-project.org/doc/manuals/r-release/R-lang.html)
4. `sloop` package — tools for inspecting S3 objects. [Link](https://sloop.r-lib.org/)
5. Hadley Wickham — *S3 style guide*. [Link](https://adv-r.hadley.nz/s3.html#s3-style)

## Continue Learning

- [OOP in R](OOP-in-R.html) — where S3 fits among R's four class systems.
- [S3 Method Dispatch in R](S3-Method-Dispatch-in-R.html) — exactly how `UseMethod` finds the right function.
- [S4 Classes in R](S4-Classes-in-R.html) — the formal sibling for when S3 is not enough.
