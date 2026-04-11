---
title: "S4 Multiple Dispatch: Methods That Choose Based on Two Arguments"
slug: "S4-Methods-in-R"
description: "S4's killer feature is multiple dispatch — a method chosen based on the classes of several arguments at once. Learn how, when to use it, and why S3 cannot match it."
keywords: "S4 multiple dispatch R, R multimethods, setMethod signature, R multi argument dispatch, S4 methods"
mathjax: false
webr: true
date: "2026-04-12"
curriculum_id: "4.3.5"
post_type: "C"
auto_link_terms: "S4 multiple dispatch|multi-dispatch R|setMethod signature"
auto_link_case_sensitive: false
sidebar_section: "Learn R"
sidebar_title: "S4 Multiple Dispatch"
sidebar_order: 45
---

# S4 Multiple Dispatch: Methods That Choose Based on Two Arguments

<p class="lead">S4's most powerful feature is <strong>multiple dispatch</strong> — a method chosen based on the classes of <em>several</em> arguments simultaneously. You get to define <code>combine(x, y)</code> differently for every <code>(class of x, class of y)</code> pair, and R picks the right one automatically.</p>

Most object systems — Java, Python, JavaScript, and R's own S3 — dispatch on a single object: `obj.method(args)` looks at `obj`'s class. But real problems often involve *two* types interacting. Combining a `Polygon` with a `Point`? Adding a `SparseMatrix` to a `DenseMatrix`? With single dispatch, you have to pick one argument to dispatch on and branch inside the method. With S4 multiple dispatch, you just register every combination.

## What Is Multiple Dispatch and When Do You Need It?

Multiple dispatch means "choose the method based on the classes of *all* arguments, not just the first". In S4 you express this with a multi-class `signature`.

```r
setGeneric("combine", function(a, b) standardGeneric("combine"))
#> [1] "combine"

# Method for (numeric, numeric) → addition
setMethod("combine", signature("numeric", "numeric"),
  function(a, b) a + b)

# Method for (character, character) → concatenation
setMethod("combine", signature("character", "character"),
  function(a, b) paste0(a, b))

# Method for (character, numeric) → repetition
setMethod("combine", signature("character", "numeric"),
  function(a, b) paste(rep(a, b), collapse = ""))

combine(2, 3)
#> [1] 5
combine("ha", "ha")
#> [1] "haha"
combine("ha", 3)
#> [1] "hahaha"
```

Three registered methods, one generic. The dispatcher picks the right one based on the class pair. Try writing the same thing in S3: you would need to dispatch on `a`, then manually check `class(b)` inside, and the check would live inside every method. S4's signature handles it automatically.

[KEY INSIGHT]
**Multiple dispatch eliminates the "who owns this method?" question.** When `combine(character, numeric)` doesn't naturally belong to `character` *or* `numeric`, single-dispatch languages force you to pick one arbitrarily. Multi-dispatch lets the operation live independently, with its behaviour registered per type pair.

## How Does S4 Choose Among Multiple Matches?

When several registered methods could match — because of inheritance — S4 picks the **most specific** one. Specificity is determined by class hierarchy: a subclass is more specific than its parent.

```r
setClass("Animal", representation(name = "character"))
setClass("Dog", contains = "Animal")
setClass("Cat", contains = "Animal")

setGeneric("interact", function(a, b) standardGeneric("interact"))

# General case
setMethod("interact", signature("Animal", "Animal"),
  function(a, b) cat(a@name, "and", b@name, "meet.\n"))

# Specific case
setMethod("interact", signature("Dog", "Cat"),
  function(a, b) cat(a@name, "chases", b@name, "!\n"))

rex  <- new("Dog", name = "Rex")
whis <- new("Cat", name = "Whiskers")

interact(rex, whis)
#> Rex chases Whiskers !

# No Dog-Dog method → falls back to (Animal, Animal)
rex2 <- new("Dog", name = "Buddy")
interact(rex, rex2)
#> Rex and Buddy meet.
```

The dispatcher found `(Dog, Cat)` for the first call — the most specific match. For the second call, no `(Dog, Dog)` method exists, so it walked up the inheritance tree and used `(Animal, Animal)`. S4 handles the walk automatically using a "best-match" algorithm over the hierarchy.

## How Do You Inspect Which Method Will Be Called?

Use `selectMethod()` to ask S4 "if I called this generic with these classes, which method would fire?". It returns the method function without calling it.

```r
selectMethod("interact", signature("Dog", "Cat"))
#> Method Definition:
#> 
#> function (a, b) 
#> cat(a@name, "chases", b@name, "!\n")
#> 
#> Signatures:
#>         a     b    
#> target  "Dog" "Cat"
#> defined "Dog" "Cat"
```

Useful for debugging mysterious dispatches. `showMethods("interact")` lists every registered method for the generic, which is a sanity check when you are wondering "did my registration actually land?".

**Try it:** Add a `(Cat, Dog)` method that prints the reverse message and test it on `interact(whiskers, rex)`.

```r
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
setClass("Animal", representation(name = "character"))
setClass("Dog", contains = "Animal")
setClass("Cat", contains = "Animal")

setGeneric("interact", function(a, b) standardGeneric("interact"))

setMethod("interact", signature("Cat", "Dog"),
  function(a, b) cat(a@name, "hisses at", b@name, "!\n"))

whis <- new("Cat", name = "Whiskers")
rex  <- new("Dog", name = "Rex")

interact(whis, rex)
#> Whiskers hisses at Rex !
```

**Explanation:** The `(Cat, Dog)` signature is distinct from `(Dog, Cat)` — argument order matters. S4 dispatches on the tuple exactly.

</details>

## When Should You Avoid Multiple Dispatch?

Multiple dispatch is powerful, but the combinatorial explosion is real. If you have 10 classes and need every pair to interact, that is 100 methods — a lot to write, test, and maintain. Two strategies keep it manageable:

1. **Use an `"ANY"` catch-all.** The special class `"ANY"` matches anything. Register a fallback `signature("MyClass", "ANY")` method that handles unknown second arguments. S4 only walks to it when no specific match exists.

2. **Lean on inheritance.** Register methods at the highest common ancestor. `signature("Animal", "Animal")` covers every `Dog`/`Cat`/`Hamster` pair in one method; you only add specific overrides where the behaviour differs.

```r
# Catch-all for "interact Animal with anything"
setMethod("interact", signature("Animal", "ANY"),
  function(a, b) cat(a@name, "ignores", as.character(class(b)), "\n"))

interact(new("Dog", name = "Rex"), 42)
#> Rex ignores numeric
```

The `"ANY"` class is S4's "default" equivalent — anything that does not match a more specific signature lands here. For more patterns, see [S4 Classes in R](S4-Classes-in-R.html).

[TIP]
**Start with single-argument dispatch.** Most S4 code you will write needs only `signature("MyClass")`, which is identical in spirit to S3. Reach for multi-argument signatures only when the problem genuinely spans two types.

## How Does `callNextMethod()` Work?

Inside an S4 method, `callNextMethod()` continues the dispatch walk to the next-most-specific method — the S4 analogue of S3's `NextMethod()`. Useful for layering behaviour across inheritance levels.

```r
setClass("Animal", representation(name = "character"))
setClass("Dog", contains = "Animal")

setGeneric("describe", function(x) standardGeneric("describe"))

setMethod("describe", "Animal", function(x) {
  cat("Animal named", x@name, "\n")
})

setMethod("describe", "Dog", function(x) {
  callNextMethod()                     # run the Animal method first
  cat("  (it's a dog)\n")
})

describe(new("Dog", name = "Rex"))
#> Animal named Rex 
#>   (it's a dog)
```

`callNextMethod()` inside `describe, Dog` ran `describe, Animal` first, then the `Dog`-specific line. No arguments needed — S4 remembers the dispatch context.

## Practice Exercises

### Exercise 1: Shape Intersection

Define S4 classes `Circle` and `Rectangle` (just numeric slots for size). Write a generic `intersects(a, b)` with three methods: `(Circle, Circle)`, `(Rectangle, Rectangle)`, and `(Circle, Rectangle)`. Each can print a made-up result — the point is registering the methods.

```r
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
setClass("Circle",    representation(radius = "numeric"))
setClass("Rectangle", representation(width = "numeric", height = "numeric"))

setGeneric("intersects", function(a, b) standardGeneric("intersects"))

setMethod("intersects", signature("Circle", "Circle"),
  function(a, b) cat("Circle-Circle\n"))

setMethod("intersects", signature("Rectangle", "Rectangle"),
  function(a, b) cat("Rect-Rect\n"))

setMethod("intersects", signature("Circle", "Rectangle"),
  function(a, b) cat("Circle-Rect\n"))

intersects(new("Circle", radius = 1), new("Rectangle", width = 2, height = 3))
#> Circle-Rect
```

**Explanation:** Three signatures, three methods. S4 picks the right one based on the tuple of argument classes.

</details>

### Exercise 2: Layered `summary` With `callNextMethod`

Build an `Animal` class with a `summary` method that prints the name. Subclass it as `Dog` with an extra `breed` slot and a `summary` method that uses `callNextMethod()` to reuse the parent logic and then prints the breed.

```r
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
setClass("Animal", representation(name = "character"))
setClass("Dog", contains = "Animal", representation(breed = "character"))

setMethod("summary", "Animal", function(object, ...) {
  cat("Name:", object@name, "\n")
})

setMethod("summary", "Dog", function(object, ...) {
  callNextMethod()
  cat("Breed:", object@breed, "\n")
})

summary(new("Dog", name = "Rex", breed = "Lab"))
#> Name: Rex 
#> Breed: Lab
```

**Explanation:** `callNextMethod()` continues the dispatch walk to `summary, Animal`, which runs first; then the `Dog` method's extra `cat` runs.

</details>

## Summary

| Concept            | Tool                                              |
|--------------------|---------------------------------------------------|
| Declare generic    | `setGeneric("f", ...)`                            |
| Single dispatch    | `setMethod("f", "ClassA", ...)`                   |
| Multi dispatch     | `setMethod("f", signature("A", "B"), ...)`        |
| Catch-all          | `"ANY"` class in signature                        |
| Continue dispatch  | `callNextMethod()`                                |
| Inspect match      | `selectMethod("f", signature(...))`               |
| List methods       | `showMethods("f")`                                |

## References

1. Wickham, H. — *Advanced R*, 2nd Edition, Chapter 15: S4. [Link](https://adv-r.hadley.nz/s4.html)
2. Chambers, J. M. — *Software for Data Analysis*, multi-dispatch chapter.
3. Sperber, M. et al. — *Generic Functions for Common Lisp*. (The classic multi-dispatch reference.)
4. R Core Team — `methods` package documentation.
5. Bioconductor — S4 design patterns. [Link](https://bioconductor.org/developers/how-to/commonMethodsAndClasses/)

## Continue Learning

- [S4 Classes in R](S4-Classes-in-R.html) — class definition, slots, validation.
- [OOP in R](OOP-in-R.html) — where S4 fits in the bigger picture.
- [S3 Method Dispatch in R](S3-Method-Dispatch-in-R.html) — the single-dispatch equivalent.
