---
title: "S4 Methods & Multiple Dispatch in R: setMethod() Explained"
slug: "S4-Methods-in-R"
description: "Learn S4 methods in R with setMethod(), setGeneric(), multiple dispatch, method signatures, callNextMethod(), and showMethods(). Full tutorial."
keywords: "S4 methods R, setMethod R, multiple dispatch R, setGeneric, callNextMethod, S4 method signatures"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "4.3.5"
post_type: "C"
auto_link_terms: "S4 methods|setMethod|multiple dispatch|callNextMethod"
auto_link_case_sensitive: false
---

# S4 Methods & Multiple Dispatch in R: setMethod() Explained

<p class="lead">S4 methods use <strong>formal generic functions</strong> and support <strong>multiple dispatch</strong> -- choosing a method based on the classes of <em>multiple</em> arguments, not just the first one. This is S4's most powerful feature and what sets it apart from S3.</p>

In S3, dispatch looks only at the class of the first argument. S4 can look at the classes of two, three, or more arguments simultaneously. This lets you write methods like "when a Matrix meets a SparseMatrix, do this; when two dense Matrices meet, do that."

## Creating Generics with setGeneric()

Before defining methods, you need a generic function. `setGeneric()` declares the interface.

```r
# Define an S4 generic
setGeneric("area", function(shape) {
  standardGeneric("area")
})

# Define the class
setClass("Circle", slots = list(radius = "numeric"))
setClass("Rectangle", slots = list(width = "numeric", height = "numeric"))

# Define methods for each class
setMethod("area", "Circle", function(shape) {
  pi * shape@radius^2
})

setMethod("area", "Rectangle", function(shape) {
  shape@width * shape@height
})

# Test
c1 <- new("Circle", radius = 5)
r1 <- new("Rectangle", width = 4, height = 6)

cat("Circle area:", area(c1), "\n")
cat("Rectangle area:", area(r1), "\n")
```

## Method Signatures

The `signature` argument in `setMethod()` specifies which argument classes the method handles. For single dispatch, you pass just the class name. For multiple dispatch, you specify classes for multiple arguments.

```r
# A generic with two arguments
setGeneric("combine", function(a, b) {
  standardGeneric("combine")
})

setClass("TextData", slots = list(text = "character"))
setClass("NumData", slots = list(values = "numeric"))

# Method for TextData + TextData
setMethod("combine", signature("TextData", "TextData"), function(a, b) {
  new("TextData", text = paste(a@text, b@text))
})

# Method for NumData + NumData
setMethod("combine", signature("NumData", "NumData"), function(a, b) {
  new("NumData", values = c(a@values, b@values))
})

# Method for TextData + NumData (mixed!)
setMethod("combine", signature("TextData", "NumData"), function(a, b) {
  new("TextData", text = paste(a@text, paste(b@values, collapse = ",")))
})

# Test different combinations
t1 <- new("TextData", text = "hello")
t2 <- new("TextData", text = "world")
n1 <- new("NumData", values = c(1, 2, 3))
n2 <- new("NumData", values = c(4, 5))

cat("Text + Text:", combine(t1, t2)@text, "\n")
cat("Num + Num:", combine(n1, n2)@values, "\n")
cat("Text + Num:", combine(t1, n1)@text, "\n")
```

## Multiple Dispatch in Action

Multiple dispatch shines when behavior depends on the combination of argument types. Here is a practical example with a formatting system.

```r
# Define format classes
setClass("HTML", slots = list(content = "character"))
setClass("Markdown", slots = list(content = "character"))
setClass("PlainText", slots = list(content = "character"))

setGeneric("convert", function(from, to) {
  standardGeneric("convert")
})

# Different conversions based on BOTH from and to types
setMethod("convert", signature("Markdown", "HTML"), function(from, to) {
  # Simple markdown-to-HTML simulation
  html <- gsub("\\*\\*(.+?)\\*\\*", "<b>\\1</b>", from@content)
  html <- gsub("\\*(.+?)\\*", "<i>\\1</i>", html)
  new("HTML", content = html)
})

setMethod("convert", signature("HTML", "PlainText"), function(from, to) {
  plain <- gsub("<[^>]+>", "", from@content)
  new("PlainText", content = plain)
})

setMethod("convert", signature("Markdown", "PlainText"), function(from, to) {
  plain <- gsub("\\*+", "", from@content)
  new("PlainText", content = plain)
})

# Test
md <- new("Markdown", content = "This is **bold** and *italic*")
html_out <- convert(md, new("HTML"))
plain_out <- convert(md, new("PlainText"))

cat("Markdown:", md@content, "\n")
cat("HTML:", html_out@content, "\n")
cat("Plain:", plain_out@content, "\n")
```

## callNextMethod(): Inheritance in S4 Methods

`callNextMethod()` is S4's equivalent of S3's `NextMethod()`. It calls the method for the parent class.

```r
setClass("Animal", slots = list(name = "character", sound = "character"))
setClass("Pet", contains = "Animal", slots = list(owner = "character"))
setClass("Dog", contains = "Pet", slots = list(breed = "character"))

setGeneric("describe", function(animal) standardGeneric("describe"))

setMethod("describe", "Animal", function(animal) {
  cat("Animal:", animal@name, "- says", animal@sound, "\n")
})

setMethod("describe", "Pet", function(animal) {
  cat("Pet owned by:", animal@owner, "\n")
  callNextMethod()  # Calls describe for Animal
})

setMethod("describe", "Dog", function(animal) {
  cat("Dog breed:", animal@breed, "\n")
  callNextMethod()  # Calls describe for Pet
})

buddy <- new("Dog", name = "Buddy", sound = "Woof",
             owner = "Alice", breed = "Golden Retriever")
describe(buddy)
```

## Overriding Existing Generics (show, print, +)

You can define S4 methods for existing generics, including `show` (S4's equivalent of `print`), arithmetic operators, and comparison operators.

```r
setClass("Money",
  slots = list(amount = "numeric", currency = "character"),
  prototype = list(currency = "USD")
)

# Override show (the S4 print method)
setMethod("show", "Money", function(object) {
  symbol <- switch(object@currency, USD = "$", EUR = "\u20AC", GBP = "\u00A3", "")
  cat(symbol, formatC(object@amount, format = "f", digits = 2), object@currency, "\n")
})

# Override + for Money
setMethod("+", signature("Money", "Money"), function(e1, e2) {
  if (e1@currency != e2@currency) stop("Cannot add different currencies")
  new("Money", amount = e1@amount + e2@amount, currency = e1@currency)
})

# Override comparison
setMethod("==", signature("Money", "Money"), function(e1, e2) {
  e1@currency == e2@currency && e1@amount == e2@amount
})

# Test
a <- new("Money", amount = 100, currency = "USD")
b <- new("Money", amount = 50, currency = "USD")

show(a)
show(b)
result <- a + b
show(result)
cat("a == b:", a == b, "\n")
```

## Inspecting Methods

```r
# List all methods for a generic
cat("Methods for 'area':\n")
print(showMethods("area", printTo = FALSE))

# Check if a method exists for specific classes
cat("\nHas method for Circle?", hasMethod("area", "Circle"), "\n")

# Find which method would be selected
cat("\nMethod for Circle:\n")
print(getMethod("area", "Circle"))

# List all generics that have methods for a class
# showMethods(classes = "Circle")  # lists all methods for Circle
```

## Summary Table

| Feature | Function | Description |
|---------|----------|-------------|
| Define generic | `setGeneric("name", function(...) standardGeneric("name"))` | Declare the generic interface |
| Define method | `setMethod("generic", "Class", function(...) ...)` | Implement for a class |
| Multiple dispatch | `setMethod("g", signature("A", "B"), ...)` | Dispatch on multiple args |
| Call parent method | `callNextMethod()` | Invoke inherited method |
| Show/print | `setMethod("show", "Class", ...)` | Custom display |
| Operator methods | `setMethod("+", signature("A", "A"), ...)` | Custom operators |
| List methods | `showMethods("generic")` | See all defined methods |
| Check method | `hasMethod("generic", "Class")` | Does method exist? |
| Get method | `getMethod("generic", "Class")` | Retrieve method function |

## Practice Exercises

**Exercise 1:** Create classes `Vector2D` and `Vector3D`. Define an `add` generic that works for all four combinations: 2D+2D, 3D+3D, 2D+3D (extend 2D to 3D with z=0), 3D+2D.

<details><summary>Click to reveal solution</summary>

```r
setClass("Vector2D", slots = list(x = "numeric", y = "numeric"))
setClass("Vector3D", slots = list(x = "numeric", y = "numeric", z = "numeric"))

setGeneric("add", function(a, b) standardGeneric("add"))

setMethod("add", signature("Vector2D", "Vector2D"), function(a, b) {
  new("Vector2D", x = a@x + b@x, y = a@y + b@y)
})

setMethod("add", signature("Vector3D", "Vector3D"), function(a, b) {
  new("Vector3D", x = a@x + b@x, y = a@y + b@y, z = a@z + b@z)
})

setMethod("add", signature("Vector2D", "Vector3D"), function(a, b) {
  new("Vector3D", x = a@x + b@x, y = a@y + b@y, z = b@z)
})

setMethod("add", signature("Vector3D", "Vector2D"), function(a, b) {
  new("Vector3D", x = a@x + b@x, y = a@y + b@y, z = a@z)
})

v2 <- new("Vector2D", x = 1, y = 2)
v3 <- new("Vector3D", x = 10, y = 20, z = 30)
r <- add(v2, v3)
cat("Result:", r@x, r@y, r@z, "\n")
```

</details>

**Exercise 2:** Define a `show` method for `Vector2D` that prints `<1, 2>` format, and a `callNextMethod()` chain with a parent class `MathObject` that prints `"[MathObject]"` after the vector representation.

<details><summary>Click to reveal solution</summary>

```r
setClass("MathObject", slots = list(label = "character"),
  prototype = list(label = "unnamed"))
setClass("Vec2", contains = "MathObject",
  slots = list(x = "numeric", y = "numeric"))

setMethod("show", "MathObject", function(object) {
  cat("[MathObject:", object@label, "]\n")
})

setMethod("show", "Vec2", function(object) {
  cat("<", object@x, ",", object@y, ">")
  callNextMethod()
})

v <- new("Vec2", x = 3, y = 7, label = "position")
show(v)
```

</details>

## FAQ

**Q: What is the difference between single and multiple dispatch?**
Single dispatch (S3) picks a method based on one argument's class. Multiple dispatch (S4) picks a method based on the classes of two or more arguments simultaneously. This is essential when the correct behavior depends on the combination of types.

**Q: Can I mix S3 and S4 methods?**
Yes, but carefully. You can call `setGeneric()` on an existing S3 generic, and S4 methods will be found alongside S3 methods. Use `setOldClass()` to register S3 classes for use in S4 signatures.

**Q: When would I use callNextMethod() vs writing separate methods?**
Use `callNextMethod()` when child classes should extend (not replace) parent behavior. If the child method does something completely different, write a standalone method without calling the parent.

## What's Next

- [R6 Classes in R](R6-Classes-in-R.html) -- Reference semantics and mutable state with the R6 package
- [S3 Method Dispatch](S3-Method-Dispatch-in-R.html) -- How UseMethod() and NextMethod() work under the hood
- [Operator Overloading in R](Operator-Overloading-in-R.html) -- Custom `+`, `-`, `==`, `[` methods for your classes
