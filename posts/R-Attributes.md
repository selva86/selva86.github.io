---
title: "R Attributes: The Hidden Metadata That Makes R Objects Behave Differently"
slug: R-Attributes
description: "Attributes like names, dim, and class change how R prints, subsets, and dispatches methods. Learn what they are, how to set them, and why they explain strange R output."
keywords: "R attributes, attr R, attributes function R, names R, dim R, class R, structure R, R metadata, R S3 class"
auto_link_terms: "R attributes|attr()|structure()|names attribute|dim attribute|class attribute"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: 2026-04-11
curriculum_id: FR-fund-5
post_type: FR
fr_parent: R-Data-Types.html
difficulty: "Intermediate"
---

# R Attributes: The Hidden Metadata That Makes R Objects Behave Differently

<p class="lead">Every R object carries a dictionary of <strong>attributes</strong>, invisible name/value pairs like <code>names</code>, <code>dim</code>, and <code>class</code>. They're why the same numeric vector can print as a matrix, a data frame, or a fitted model. Learn to set, read, and strip them, and half of R's "mysterious" behaviour becomes obvious.</p>

This post explains what attributes actually are, how the special ones (`names`, `dim`, `class`) transform the same underlying data, how to set attributes with `attr()`, `structure()`, and `setNames()`, and the surprising gotcha where arithmetic silently drops them.

## Why does the same R vector print in completely different ways?

Let's start with a puzzle: the exact same twelve numbers, printed three different ways, depending on one attribute. `1:12` is a plain integer vector. Attach a `dim` attribute and R prints it as a matrix. Attach a `class` of `"Date"` and it prints as dates. The underlying memory is identical, only the metadata changes.

This is the single idea the post rests on: **an R object is its values *plus* its attributes**, and attributes are the lever you pull to change how any function (print, subset, `mean`, `summary`) treats that object.

```r title="One vector, three faces via dim"
# One vector, three faces — only the attributes differ
x <- 1:12
print(x)
#>  [1]  1  2  3  4  5  6  7  8  9 10 11 12

# Attach a dim attribute -> it's now a matrix
dim(x) <- c(3, 4)
print(x)
#>      [,1] [,2] [,3] [,4]
#> [1,]    1    4    7   10
#> [2,]    2    5    8   11
#> [3,]    3    6    9   12
class(x)
#> [1] "matrix" "array"

# Strip dim -> back to a plain vector
dim(x) <- NULL
class(x)
#> [1] "integer"
```

The values `1:12` never moved. Adding `dim(x) <- c(3, 4)` attached a 2-element integer vector as a single attribute, and the `print` method for matrices kicked in. Setting the same attribute to `NULL` removed it, and the plain integer printer returned. This is exactly how matrices and arrays are implemented in base R, they're just vectors with a `dim` attribute.

**Try it:** Given `y <- 1:24`, turn `y` into a 2x3x4 three-dimensional array in one line, then check its class.

```r title="Exercise: reshape via dim attribute"
# Try it: reshape via the dim attribute
y <- 1:24
# your code here

class(y)
#> Expected: "array"
dim(y)
#> Expected: [1] 2 3 4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Dim-reshape solution"
y <- 1:24
dim(y) <- c(2, 3, 4)
class(y)
#> [1] "array"
dim(y)
#> [1] 2 3 4
```

**Explanation:** Any length-24 vector can become a 2×3×4 array because `2 * 3 * 4 == 24`. The `dim<-` assignment is just shorthand for `attr(y, "dim") <- c(2, 3, 4)`.

</details>

## How do you read, set, and strip attributes in R?

There are four functions you'll use every day: `attr()` for one specific attribute, `attributes()` for the full list, `structure()` for setting several at once, and the specialised wrappers `names()`, `dim()`, `class()`, `dimnames()` for the attributes R gives extra-special treatment.

![Anatomy of an R object: values plus attributes](screenshots/R-Attributes-anatomy.webp)

*Figure 1: Every R object has a values payload plus an attribute dictionary. The three most common attributes (`names`, `dim`, `class`) are what most print/subset methods key off.*

```r title="attr, attributes, and structure"
# Four ways to work with attributes
v <- c(a = 1, b = 2, c = 3)            # names set at creation time

# 1. Read one attribute
attr(v, "names")
#> [1] "a" "b" "c"
names(v)                               # shortcut for the above
#> [1] "a" "b" "c"

# 2. Read them all
attributes(v)
#> $names
#> [1] "a" "b" "c"

# 3. Set a single attribute
attr(v, "units") <- "cm"
attributes(v)
#> $names
#> [1] "a" "b" "c"
#>
#> $units
#> [1] "cm"

# 4. Strip everything with attributes(x) <- NULL
attributes(v) <- NULL
v
#> [1] 1 2 3
```

The cleanest way to build an object with several attributes at once is `structure()`, which wraps value-plus-attributes into one call, the idiom you'll see in most package source code.

```r title="structure() for one-shot creation"
# structure() = create a value and attach attributes in one call
m <- structure(1:6,
               dim = c(2, 3),
               dimnames = list(c("r1", "r2"), c("c1", "c2", "c3")))
m
#>    c1 c2 c3
#> r1  1  3  5
#> r2  2  4  6
attributes(m)
#> $dim
#> [1] 2 3
#>
#> $dimnames
#> $dimnames[[1]]
#> [1] "r1" "r2"
#> $dimnames[[2]]
#> [1] "c1" "c2" "c3"
```

`structure()` builds an object, attaches a `dim` attribute (so it prints as a matrix) and a `dimnames` attribute (so rows and columns are labelled), all in a single expression. Any function that accepts `.Data` and `...` attribute pairs is a clean way to document what an object "is" at the point where it's created.

[KEY INSIGHT]
**An R object is data + attributes, nothing more.** Matrices, arrays, factors, data frames, Dates, and S3 objects of every kind are all ordinary atomic vectors or lists with the right attributes attached. Once you see through the wrapper you can build any of them by hand, and debug them when they break.

**Try it:** Create a 2x3 matrix `ex_m` whose values are `1:6` and which has row names `"row1", "row2"` and column names `"A", "B", "C"`, all via a single `structure()` call.

```r title="Exercise: labelled matrix with structure"
# Try it: one-shot matrix with dimnames
ex_m <- NULL  # your code here

ex_m
#> Expected:
#>      A B C
#> row1 1 3 5
#> row2 2 4 6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Labelled-matrix solution"
ex_m <- structure(1:6,
                  dim = c(2, 3),
                  dimnames = list(c("row1", "row2"), c("A", "B", "C")))
ex_m
#>      A B C
#> row1 1 3 5
#> row2 2 4 6
```

**Explanation:** `structure()` creates the integer vector, attaches both attributes, and R's matrix printer takes it from there. Using the two-step `m <- 1:6; dim(m) <- c(2,3); ...` approach is equally valid but noisier.

</details>

## What makes names, dim, and class so special?

Any attribute can carry any R value, `attr(x, "author") <- "Selva"` is perfectly legal. But R treats a small set of attributes as **special**: they come with dedicated accessor functions, they're preserved or rebuilt by many operations, and setting them triggers downstream behaviour (like switching which `print` method runs). The big three are `names`, `dim`, and `class`.

| Attribute | Accessor | What it does |
|---|---|---|
| `names` | `names(x)`, `setNames()` | Labels each element; enables name-based subsetting (`x["alice"]`) |
| `dim` | `dim(x)` | Reshapes a vector into a matrix or higher-dimensional array |
| `dimnames` | `dimnames(x)`, `rownames()`, `colnames()` | Row/column labels for matrices and arrays |
| `class` | `class(x)`, `class(x) <- ...` | Drives S3 method dispatch (which `print`, `summary`, `[` runs) |
| `levels` | `levels(x)` | The string lookup for factors |
| `row.names` | `row.names(x)` | Row identifiers for data frames (legacy name) |

![dim turning a vector into a matrix then an array](screenshots/R-Attributes-dim-transform.webp)

*Figure 2: A length-12 vector becomes a 3x4 matrix, then a 2x2x3 array, purely by changing the `dim` attribute. Nothing in memory moves.*

```r title="Flip class to change behavior"
# Flipping class to trigger different behaviour
d <- 19000                  # ordinary number
class(d) <- "Date"          # set the class attribute
d
#> [1] "2022-01-08"         # now the Date print method runs
unclass(d)                  # peek at the underlying value
#> [1] 19000
typeof(d)
#> [1] "double"

# Factor = integer vector + class + levels
f <- structure(c(1L, 2L, 1L, 3L),
               levels = c("red", "green", "blue"),
               class  = "factor")
f
#> [1] red   green red   blue
#> Levels: red green blue
typeof(f)
#> [1] "integer"
```

The `Date` example is the classic revelation: a `Date` is just a double counting days since 1970-01-01, plus a `class` attribute that tells `print`, `format`, and friends to interpret it as a calendar date. The factor example is similar: an integer vector plus `levels` (the lookup) plus `class = "factor"`. Once you see this, S3 stops feeling magical.

[WARNING]
**Setting class to a bogus value breaks method dispatch.** `class(x) <- "banana"` is syntactically legal but now every generic (`print`, `summary`, `[`) will fail to find a method and fall back to the default. If you're inventing a class, implement at least `print.banana()` first, or use `oldClass(x) <- NULL` to reset.

**Try it:** Build a three-element factor `ex_f` with values `"S", "M", "L"` in that order, but do it by hand with `structure()`, not with `factor()`.

```r title="Exercise: build factor from scratch"
# Try it: build a factor from scratch
ex_f <- NULL  # your code here — use structure()

ex_f
#> Expected:
#> [1] S M L
#> Levels: S M L
class(ex_f)
#> Expected: "factor"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Scratch-factor solution"
ex_f <- structure(c(1L, 2L, 3L),
                  levels = c("S", "M", "L"),
                  class  = "factor")
ex_f
#> [1] S M L
#> Levels: S M L
class(ex_f)
#> [1] "factor"
```

**Explanation:** An integer vector whose values are positions into `levels`, with `class = "factor"` to trigger the factor print method. This is exactly what `factor(c("S","M","L"))` produces internally.

</details>

## Why do attributes silently disappear after arithmetic?

Here is the foot-gun that catches almost everyone: most arithmetic and coercion operations **drop** attributes. If you attach a `units` attribute to a numeric vector and then multiply it by 2, the attribute is gone. R's rule is that only "structural" attributes (the special ones: `names`, `dim`, `dimnames`) are preserved, everything else is discarded unless an operation has been written to carry it through.

```r title="Arithmetic drops custom attributes"
# Custom attributes get dropped by arithmetic
v <- c(10, 20, 30)
attr(v, "units")  <- "kg"
attr(v, "source") <- "scale-A"
attributes(v)
#> $units
#> [1] "kg"
#> $source
#> [1] "scale-A"

v2 <- v * 2
attributes(v2)
#> NULL
v2
#> [1] 20 40 60

# But names (a special attribute) survive
w <- c(a = 1, b = 2, c = 3)
w * 10
#>  a  b  c
#> 10 20 30
```

`v` loses both `units` and `source` the moment it's multiplied. `w`, whose only attribute is `names`, keeps them because `names` is on the "special" list that R deliberately preserves through vectorised arithmetic. This is why rolling your own attribute-carrying types usually means wrapping them in an S3 class and writing arithmetic methods yourself, or living with manual re-attachment.

[TIP]
**If you need attributes to survive arithmetic, wrap them in an S3 class.** Add a `class` attribute (e.g. `"measurement"`) and define `Ops.measurement` (the S3 group generic for arithmetic). That's exactly what packages like `units`, `hms`, and `Matrix` do.

**Try it:** Create `ex_w <- c(x = 1, y = 2, z = 3)` with an extra `attr(ex_w, "source") <- "test"`. After running `ex_w + 1`, check which attributes survived.

```r title="Exercise: which attributes survive"
# Try it: which attributes survive + 1?
ex_w <- c(x = 1, y = 2, z = 3)
attr(ex_w, "source") <- "test"

ex_after <- ex_w + 1
attributes(ex_after)
#> Expected: only the names attribute survives
```

<details>
<summary>Click to reveal solution</summary>

```r title="Surviving-attributes solution"
ex_w <- c(x = 1, y = 2, z = 3)
attr(ex_w, "source") <- "test"
ex_after <- ex_w + 1
attributes(ex_after)
#> $names
#> [1] "x" "y" "z"
```

**Explanation:** `names` is a structural attribute and is preserved by arithmetic. `source` is a custom attribute and is silently dropped. The value vector `c(2, 3, 4)` is unchanged, only the metadata differs.

</details>

## What are the most common R attribute pitfalls?

Five patterns cause most of the "why is my object behaving like that?" moments. Each has a one-line fix once you know the shape of the problem.

```r title="Five common attribute pitfalls"
# Pitfall 1: using attr() for names/dim/class instead of the accessor
x <- 1:5
attr(x, "names") <- c("a","b","c","d","e")    # works, but discouraged
names(x) <- c("a","b","c","d","e")            # preferred — validates input

# Pitfall 2: dim length doesn't match object length
y <- 1:10
# dim(y) <- c(3, 4)          # would error: dims [3,4] != length 10

# Pitfall 3: forgetting that as.vector() strips attributes
m <- matrix(1:6, 2, 3)
as.vector(m)                 # drops dim
#> [1] 1 2 3 4 5 6
dim(m)
#> [1] 2 3

# Pitfall 4: unname() strips names but keeps dim
m2 <- structure(1:6, dim = c(2,3), dimnames = list(c("a","b"), c("x","y","z")))
unname(m2)                   # dim stays, dimnames go
#>      [,1] [,2] [,3]
#> [1,]    1    3    5
#> [2,]    2    4    6

# Pitfall 5: setattr-style updates that look identical but aren't
a <- 1:5
b <- a                       # copy-on-modify: b is a reference
attr(b, "label") <- "cloned" # modifying b doesn't touch a
attributes(a)
#> NULL
attributes(b)
#> $label
#> [1] "cloned"
```

Pitfalls 1 and 2 are about using the right accessor and validating length. Pitfalls 3 and 4 are about knowing which attribute each stripping helper removes (`as.vector` removes everything; `unname` removes only names/dimnames). Pitfall 5 is a reminder that R's copy-on-modify semantics mean attaching an attribute to one variable never affects another, a feature when you understand it, a puzzle when you don't.

[NOTE]
**`as.vector()` removes all attributes except `names`.** If you want to really flatten an object including names, call `unname(as.vector(x))`. Conversely, `unlist()` preserves names by prefixing them with the parent list name, useful for flattening nested lists into labelled vectors.

**Try it:** You have `m <- matrix(1:6, 2, 3, dimnames = list(c("r1","r2"), c("a","b","c")))`. Strip the `dimnames` but keep the `dim`, so it still prints as a 2x3 matrix but without row/column labels.

```r title="Exercise: drop dimnames, keep dim"
# Try it: drop dimnames, keep dim
m <- matrix(1:6, 2, 3, dimnames = list(c("r1","r2"), c("a","b","c")))
ex_plain <- NULL  # your code here

ex_plain
#> Expected:
#>      [,1] [,2] [,3]
#> [1,]    1    3    5
#> [2,]    2    4    6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Drop-dimnames solution"
m <- matrix(1:6, 2, 3, dimnames = list(c("r1","r2"), c("a","b","c")))
ex_plain <- m
dimnames(ex_plain) <- NULL
ex_plain
#>      [,1] [,2] [,3]
#> [1,]    1    3    5
#> [2,]    2    4    6
dim(ex_plain)
#> [1] 2 3
```

**Explanation:** Setting `dimnames(x) <- NULL` removes that one attribute and nothing else. `dim` is untouched, so R still prints the object as a matrix.

</details>

## Practice Exercises

Two capstone exercises that combine attribute handling with real vector work.

### Exercise 1: Build a labelled 3x3 matrix from scratch

Starting from `1:9`, build `my_mat`, a 3x3 matrix whose rows are labelled `"r1","r2","r3"`, whose columns are labelled `"c1","c2","c3"`, and which has an extra custom attribute `experiment = "batch-01"`. All of it in a single `structure()` call.

```r title="Exercise: labelled matrix with metadata"
# Exercise 1: labelled matrix + custom attribute
my_mat <- NULL

my_mat
attributes(my_mat)
#> Expected:
#>   $dim [1] 3 3
#>   $dimnames (...)
#>   $experiment [1] "batch-01"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Labelled-with-metadata solution"
my_mat <- structure(
  1:9,
  dim = c(3, 3),
  dimnames = list(c("r1","r2","r3"), c("c1","c2","c3")),
  experiment = "batch-01"
)

my_mat
#>    c1 c2 c3
#> r1  1  4  7
#> r2  2  5  8
#> r3  3  6  9
attributes(my_mat)
#> $dim
#> [1] 3 3
#>
#> $dimnames
#> $dimnames[[1]]
#> [1] "r1" "r2" "r3"
#> $dimnames[[2]]
#> [1] "c1" "c2" "c3"
#>
#> $experiment
#> [1] "batch-01"
```

**Explanation:** `structure()` takes any number of `attribute = value` pairs. `dim` and `dimnames` are specials and change how the object prints; `experiment` is a custom attribute that will be dropped by arithmetic but is visible to `attributes()`.

</details>

### Exercise 2: Peek inside a Date

R Dates are secretly doubles. Without converting with `as.numeric()`, use attribute manipulation to show that `as.Date("2026-04-11")` is just the number of days since 1970-01-01 wearing a `class` hat. Save the raw number to `my_days` and confirm with `class()`.

```r title="Exercise: unmask a Date value"
# Exercise 2: unmask a Date
d <- as.Date("2026-04-11")

my_days <- NULL  # your code here — use class()<- or unclass()

my_days
#> Expected: [1] 20555
class(my_days)
#> Expected: "numeric"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Unmask-Date solution"
d <- as.Date("2026-04-11")
my_days <- unclass(d)
my_days
#> [1] 20555
class(my_days)
#> [1] "numeric"
```

**Explanation:** `unclass()` removes the `class` attribute but touches nothing else. What's left is the underlying double, the number of days since 1970-01-01. Setting `class(d) <- NULL` would also work and is equivalent.

</details>

## Complete Example

A small end-to-end flow that uses attributes to turn a numeric summary into a self-describing labelled object, the kind of pattern real R packages use to return results.

```r title="Self-describing lab summary object"
# Complete example: a self-describing summary object
obs <- c(52.1, 49.7, 55.3, 48.8, 51.5, 50.0)

# Build a bare summary vector
stats <- c(mean(obs), sd(obs), min(obs), max(obs))

# Attach names + a custom class + metadata via structure()
summary_obj <- structure(
  stats,
  names       = c("mean", "sd", "min", "max"),
  class       = c("lab_summary", "numeric"),
  unit        = "g",
  n           = length(obs),
  generated   = Sys.Date()
)

# With names attached, the object prints nicely
summary_obj
#>      mean        sd       min       max
#> attr(...)  omitted
#> 51.2333333  2.3266215 48.8000000 55.3000000

# Full attribute list documents what this is
attributes(summary_obj)
#> $names
#> [1] "mean" "sd"   "min"  "max"
#> $class
#> [1] "lab_summary" "numeric"
#> $unit
#> [1] "g"
#> $n
#> [1] 6
#> $generated
#> [1] "2026-04-11"

# Reach in to use the metadata
paste0("n=", attr(summary_obj, "n"), " (", attr(summary_obj, "unit"), ")")
#> [1] "n=6 (g)"

# Arithmetic strips custom attributes but keeps names
(summary_obj + 1)[c("mean","sd")]
#>      mean        sd
#> 52.2333333  3.3266215
```

The `summary_obj` carries four pieces of metadata, unit, sample size, generation date, and a custom class, right next to its values. That's enough to make downstream code robust: `if (!inherits(x, "lab_summary")) stop(...)`, `attr(x, "unit")`, `attr(x, "n")`. And because arithmetic still works (R ignores the class for `+`), you can treat it as a plain numeric vector when convenient.

## Summary

| Concept | One-line takeaway |
|---|---|
| **Anatomy** | An R object = values + attribute dictionary |
| **Special attributes** | `names`, `dim`, `dimnames`, `class`, `levels` get dedicated accessors and preserve behaviour |
| **Access** | `attr(x, "name")`, `attributes(x)`, `names()`, `dim()`, `class()` |
| **Create with metadata** | `structure(value, name1 = v1, name2 = v2)` in one call |
| **Arithmetic drops** | Custom attributes vanish on `x * 2`; `names`/`dim` survive |
| **Strip** | `attributes(x) <- NULL` removes everything; `unname()` only names; `as.vector()` everything except names |

[KEY INSIGHT]
**Seeing through to attributes demystifies half of R.** Matrices, arrays, factors, dates, data frames, and every S3 object are vectors or lists with the right attributes. Once you can read `attributes(x)` and interpret it, the "how does this work?" moment for any unfamiliar object is usually one function call away.

## References

1. Wickham, H. *Advanced R* (2nd ed.), Chapter 3: Vectors, §3.3 Attributes. [adv-r.hadley.nz/vectors-chap.html#attributes](https://adv-r.hadley.nz/vectors-chap.html#attributes)
2. R Core Team. *R Language Definition*, §2.1 Basic types and attributes. [cran.r-project.org/doc/manuals/r-release/R-lang.html](https://cran.r-project.org/doc/manuals/r-release/R-lang.html)
3. R documentation: `?attr`, `?attributes`, `?structure`, `?setNames`, `?class`, `?oldClass`.
4. StatisticsGlobe. *attr, attributes & structure Functions in R.* [statisticsglobe.com/attr-attributes-structure](https://statisticsglobe.com/attr-attributes-structure)
5. R Manual. *3 Objects, their modes and attributes.* [rstudio.github.io/r-manuals/r-intro/Objects.html](https://rstudio.github.io/r-manuals/r-intro/Objects.html)
6. ETH Zurich R mirror. *Object Attribute Lists (base::attributes).* [stat.ethz.ch/R-manual/R-devel/library/base/html/attributes.html](https://stat.ethz.ch/R-manual/R-devel/library/base/html/attributes.html)

## Continue Learning

- **[R Data Types: Which Type Is Your Variable?](R-Data-Types.html)**, The parent post explaining R's four base atomic types, which attributes then decorate.
- **[R Vectors: The Foundation of Everything in R](R-Vectors.html)**, Vectors are the chassis that attributes attach to.
- **[R Lists Explained](R-Lists.html)**, Lists carry attributes too, and are the internal representation of every data frame.
