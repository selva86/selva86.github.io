---
title: "R Attributes: The Hidden Metadata That Makes R Objects Behave Differently"
slug: "R-Attributes"
description: "R attributes are hidden metadata on objects: names, dim, class, and custom tags. Learn how they control behavior and when subsetting strips them."
keywords: "R attributes, names() in R, dim() in R, class() attribute, attr(), attributes(), R metadata"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "FR-fund-5"
post_type: "FR"
auto_link_terms: "R attributes|names() in R|dim() in R|class() attribute"
auto_link_case_sensitive: false
fr_parent: "R-Data-Types.html"
---

# R Attributes: The Hidden Metadata That Makes R Objects Behave Differently

<p class="lead">Every R object can carry hidden metadata called attributes — names, dimensions, class labels, and custom tags. Attributes are what make a matrix different from a vector, a factor different from an integer, and a data frame different from a list.</p>

You already use attributes every day without knowing it. When you name a vector with `names()`, add dimensions with `dim()`, or check `class()`, you're reading and writing attributes. Understanding them explains many of R's otherwise mysterious behaviors.

## What Are Attributes?

An **attribute** is a piece of metadata attached to an R object. The object's data stays the same — the attribute adds context about how to interpret that data.

```r
# A plain numeric vector
x <- 1:12
cat("x:", x, "\n")
cat("Attributes:", attributes(x), "\n")  # NULL — no attributes

# Add a names attribute
names(x) <- month.abb
cat("\nNamed x:", x, "\n")
cat("Attributes:\n")
str(attributes(x))

# Add a dim attribute — same data, now a matrix!
y <- 1:12
dim(y) <- c(3, 4)
cat("\nWith dim(3,4):\n")
print(y)
cat("Class:", class(y), "\n")
```

The data `1:12` didn't change. Adding `dim` told R to display it as a 3×4 grid and treat it as a matrix. That's the power of attributes — they change behavior without changing data.

## The Three Special Attributes

Three attributes have special status in R — they're preserved across most operations and have dedicated accessor functions:

### 1. names — Label Your Elements

```r
# names on a vector
scores <- c(88, 92, 75)
names(scores) <- c("Math", "Science", "English")
cat("Named vector:", scores, "\n")
cat("Access by name:", scores["Math"], "\n")

# names on a list
info <- list(1, "hello", TRUE)
names(info) <- c("number", "greeting", "flag")
cat("\nNamed list:\n")
str(info)

# names on a data frame (column names)
df <- data.frame(a = 1:3, b = 4:6)
cat("\nColumn names:", names(df), "\n")
names(df) <- c("x", "y")  # Rename columns
cat("After rename:", names(df), "\n")
```

### 2. dim — Turn Vectors into Matrices and Arrays

```r
# A vector becomes a matrix with dim
x <- 1:12
dim(x) <- c(3, 4)  # 3 rows, 4 columns
cat("Matrix:\n"); print(x)
cat("Class:", class(x), "\n")

# A vector becomes a 3D array
y <- 1:24
dim(y) <- c(2, 3, 4)  # 2 rows, 3 cols, 4 layers
cat("\n3D Array (layer 1):\n")
print(y[,,1])
cat("Dimensions:", dim(y), "\n")
```

`dim` is what makes a matrix a matrix. A matrix is literally just a vector with a `dim` attribute.

### 3. class — Determine Object Behavior

```r
# class controls how functions treat an object
x <- 1:10
cat("Default class:", class(x), "\n")

# Same data, different class = different behavior
date_num <- 20089  # Number of days since 1970-01-01
cat("As number:", date_num, "\n")

class(date_num) <- "Date"
cat("As Date:", format(date_num), "\n")
cat("Class:", class(date_num), "\n")

# Factors are integers with a class and levels attribute
f <- factor(c("low", "medium", "high", "low"))
cat("\nFactor:", f, "\n")
cat("Underlying integers:", unclass(f), "\n")
cat("Class:", class(f), "\n")
cat("Levels:", levels(f), "\n")
```

`class` is the most important attribute — it determines which methods R calls when you use `print()`, `summary()`, `plot()`, and nearly every other generic function.

## Reading and Writing Attributes

### attributes() — See All Attributes

```r
# A matrix has dim and dimnames attributes
m <- matrix(1:6, nrow = 2, dimnames = list(c("r1", "r2"), c("a", "b", "c")))
cat("Matrix:\n"); print(m)
cat("\nAll attributes:\n")
str(attributes(m))
```

### attr() — Get or Set a Single Attribute

```r
x <- 1:5

# Set a custom attribute
attr(x, "source") <- "experiment_42"
attr(x, "units") <- "meters"

cat("Values:", x, "\n")
cat("Source:", attr(x, "source"), "\n")
cat("Units:", attr(x, "units"), "\n")
cat("\nAll attributes:\n")
str(attributes(x))
```

Custom attributes let you attach metadata to any object — data source, measurement units, creation timestamp, author notes. They travel with the object.

### structure() — Create an Object with Attributes

```r
# Create a named, annotated vector in one call
x <- structure(
  c(72, 68, 75, 80, 77),
  names = c("Mon", "Tue", "Wed", "Thu", "Fri"),
  units = "Fahrenheit",
  source = "weather_station_3"
)

cat("Values:", x, "\n")
cat("Units:", attr(x, "units"), "\n")
cat("Source:", attr(x, "source"), "\n")
```

## When Attributes Are Stripped

Most operations **strip custom attributes**. This is the source of many confusing behaviors:

```r
x <- structure(1:5, names = letters[1:5], custom = "important!")
cat("Original attributes:\n")
str(attributes(x))

# Subsetting preserves names but strips custom attributes
y <- x[1:3]
cat("\nAfter subsetting [1:3]:\n")
str(attributes(y))
cat("Custom survived?", !is.null(attr(y, "custom")), "\n")

# Math strips names AND custom attributes
z <- x + 10
cat("\nAfter x + 10:\n")
str(attributes(z))
```

The rules:

| Operation | names | dim | class | Custom attrs |
|-----------|-------|-----|-------|-------------|
| Subsetting `[` | Preserved | Preserved* | Preserved | **Stripped** |
| Math `+`, `*`, etc. | Sometimes | Preserved | Sometimes | **Stripped** |
| `c()` combine | Preserved | **Stripped** | **Stripped** | **Stripped** |
| `unname()` | **Stripped** | Preserved | Preserved | Preserved |

*dim is dropped when the result has only one row or column (the "drop" behavior).

```r
# c() strips dim — matrix becomes vector
m <- matrix(1:6, nrow = 2)
cat("Matrix:\n"); print(m)
cat("Class:", class(m), "\n")

v <- c(m)
cat("\nAfter c():", v, "\n")
cat("Class:", class(v), "\n")  # Just "integer" now
```

## How class Controls Behavior (S3 Dispatch)

The `class` attribute determines which version of a function gets called. This is R's object-oriented system:

```r
# print() behaves differently based on class
x <- 1:5
cat("print(integer):\n"); print(x)

m <- matrix(1:6, nrow = 2)
cat("\nprint(matrix):\n"); print(m)

d <- Sys.Date()
cat("\nprint(Date):\n"); print(d)

# Behind the scenes: R looks for print.integer, print.matrix, print.Date
cat("\nMethods for print:\n")
cat("print.Date exists:", exists("print.Date"), "\n")
cat("print.data.frame exists:", exists("print.data.frame"), "\n")
```

When you call `print(x)`, R checks `class(x)`, finds it's "Date", and calls `print.Date(x)`. This is called **S3 method dispatch**, and it's how R functions "know" how to handle different types.

```r
# You can see which methods exist for a generic function
methods(summary)[1:10]  # First 10 summary methods
```

## Real-World Examples

### Data frames are lists with attributes

```r
# A data frame is a list + class + row.names attributes
df <- data.frame(x = 1:3, y = c("a", "b", "c"))

cat("Is it a list?", is.list(df), "\n")
cat("\nAttributes:\n")
str(attributes(df))

# Strip the class — it becomes a plain list
plain <- unclass(df)
cat("\nUnclassed:\n")
str(plain)
```

### Factors are integers with levels

```r
# A factor is an integer vector with class and levels attributes
f <- factor(c("low", "medium", "high", "low", "high"))
cat("Factor:", f, "\n")
cat("Storage:", typeof(f), "\n")  # integer!
cat("\nAttributes:\n")
str(attributes(f))

# Remove the class — reveals the underlying integers
cat("\nUnderlying data:", unclass(f), "\n")
cat("Level mapping:", levels(f), "\n")
```

### Dates are numbers with a class

```r
# A Date is a numeric value (days since 1970-01-01) with class = "Date"
today <- Sys.Date()
cat("As Date:", format(today), "\n")
cat("As number:", unclass(today), "\n")
cat("Class:", class(today), "\n")

# Create a date manually
my_date <- structure(20000, class = "Date")
cat("\nDay 20000:", format(my_date), "\n")
```

## Practice Exercises

### Exercise 1: Explore Attributes

```r
# Exercise: Create each of these objects and examine their attributes:
# 1. A named numeric vector
# 2. A 3x3 matrix
# 3. A factor with 3 levels
# 4. A data frame with 2 columns
# For each: print attributes() and identify what makes it "special"

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
# Solution

# 1. Named vector: has "names" attribute
v <- c(a = 1, b = 2, c = 3)
cat("1. Named vector attributes:\n")
str(attributes(v))

# 2. Matrix: has "dim" (and optionally "dimnames")
m <- matrix(1:9, nrow = 3, dimnames = list(c("r1","r2","r3"), c("c1","c2","c3")))
cat("\n2. Matrix attributes:\n")
str(attributes(m))

# 3. Factor: has "levels" and "class"
f <- factor(c("red", "blue", "green", "red"))
cat("\n3. Factor attributes:\n")
str(attributes(f))

# 4. Data frame: has "names", "class", and "row.names"
df <- data.frame(x = 1:3, y = letters[1:3])
cat("\n4. Data frame attributes:\n")
str(attributes(df))
```

**Explanation:** A vector becomes "named" by adding a names attribute. A vector becomes a "matrix" by adding a dim attribute. A vector becomes a "factor" by adding class and levels. A list becomes a "data frame" by adding class, names, and row.names.

</details>

### Exercise 2: Custom Metadata

```r
# Exercise: Create a "measurement" object — a numeric vector with
# custom attributes: units, instrument, date_recorded, operator
# Then write a function that prints it nicely, including the metadata

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
# Solution
measurement <- structure(
  c(23.4, 23.8, 22.9, 24.1, 23.5),
  units = "Celsius",
  instrument = "Thermocouple-7",
  date_recorded = "2026-03-29",
  operator = "Dr. Smith"
)

# Print function using attributes
print_measurement <- function(m) {
  cat("=== Measurement Report ===\n")
  cat("Instrument:", attr(m, "instrument"), "\n")
  cat("Operator:", attr(m, "operator"), "\n")
  cat("Date:", attr(m, "date_recorded"), "\n")
  cat("Units:", attr(m, "units"), "\n")
  cat("Values:", m, "\n")
  cat("Mean:", round(mean(m), 2), attr(m, "units"), "\n")
  cat("SD:", round(sd(m), 2), attr(m, "units"), "\n")
}

print_measurement(measurement)
```

**Explanation:** Custom attributes attach metadata directly to the data object. The metadata travels with the data — no separate "metadata file" needed. The downside: custom attributes are stripped by most operations, so you'd need to re-attach them after transformations.

</details>

### Exercise 3: Attribute Survival

```r
# Exercise: Given a named vector with a custom attribute,
# test which operations preserve vs strip the attribute.
# Try: subsetting, math, c(), sort(), rev()

x <- structure(c(a=10, b=20, c=30), source="test_data")

# Test each operation and report: did "source" survive?
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
# Solution
x <- structure(c(a=10, b=20, c=30), source="test_data")

check <- function(label, obj) {
  survived <- !is.null(attr(obj, "source"))
  names_ok <- !is.null(names(obj))
  cat(sprintf("%-15s source: %-5s  names: %-5s\n",
    label, survived, names_ok))
}

cat("Operation       source  names\n")
cat("----------      ------  -----\n")
check("original", x)
check("x[1:2]", x[1:2])
check("x + 1", x + 1)
check("c(x, d=40)", c(x, d = 40))
check("sort(x)", sort(x))
check("rev(x)", rev(x))
check("x * 2", x * 2)
check("sum(x)", structure(sum(x), source = attr(x, "source")))
```

**Explanation:** `names` survives most operations but gets stripped by some. The custom `source` attribute is stripped by nearly everything. This is why R's built-in "special" attributes (names, dim, class) are treated differently from custom ones — they get special preservation logic.

</details>

## Summary

| Attribute | Accessor | What it does |
|-----------|---------|-------------|
| `names` | `names()` | Labels elements for named access |
| `dim` | `dim()` | Turns vector into matrix/array |
| `dimnames` | `dimnames()` | Row/column names for matrices |
| `class` | `class()` | Controls method dispatch (print, summary, etc.) |
| `levels` | `levels()` | Defines categories for factors |
| `row.names` | `row.names()` | Row labels for data frames |
| Custom | `attr(x, "name")` | Any metadata you want to attach |

**Key insights:**
- A matrix is a vector + `dim` attribute
- A factor is an integer + `class` + `levels` attributes
- A data frame is a list + `class` + `names` + `row.names` attributes
- Custom attributes are stripped by most operations
- `class` determines which functions get called on your object

## FAQ

### Why do custom attributes get stripped?

Safety. R assumes that transforming data invalidates metadata. If you add 1 to every temperature, the "instrument" attribute is still valid — but R can't know that in general. So it strips custom attributes conservatively. If you need persistent metadata, use a list with a "metadata" element instead.

### How are attributes different from comments?

Comments exist only in source code. Attributes exist on the R object itself — they travel with the data in memory and can be saved to disk with `saveRDS()`. Attributes are programmatically accessible; comments are not.

### Can I create my own class with custom attributes?

Yes! This is the basis of S3 classes. Set `class(x) <- "my_class"`, then define methods like `print.my_class <- function(x, ...) { ... }`. This is how R's type system works under the hood.

### Do attributes affect memory usage?

Minimally. Attributes are stored as a named list attached to the object. A few character strings and numbers add negligible memory compared to the data itself.

## Continue Learning

Attributes unlock understanding of R's type system. Related topics:

1. **R Factors** — the most attribute-dependent data type
2. **R Type Coercion** — how coercion interacts with attributes
3. **R OOP Systems** — S3/S4/R5/R6 classes built on the class attribute
