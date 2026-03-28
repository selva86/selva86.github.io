# Functional Programming in R: The Mindset That Makes Your Code 10x Cleaner

In R, functions can be stored, passed, and returned just like data. This tutorial introduces functional programming concepts -- map, filter, reduce -- and why they beat loops.

## What Is Functional Programming?

Functional programming (FP) is a style where you build programs by applying and composing functions. Instead of writing step-by-step instructions that modify data in place (imperative style), you pass data through a chain of functions that each produce new results.

R is built for this. Unlike Python or Java, where FP is possible but awkward, R treats functions as first-class objects. That means functions are data. You can store them in variables, pass them to other functions, put them in lists, and return them from other functions.

This tutorial teaches you the FP mindset and the practical tools to use it.

## Functions Are First-Class Objects

In R, a function is just another value. You can assign it to a variable, just like a number or a string:

```r
# Store a function in a variable
my_square <- function(x) x^2

# Use it
my_square(5)
my_square(1:10)
```

```r
# Functions are objects -- you can inspect them
my_add <- function(a, b) a + b

# Check its type
class(my_add)
typeof(my_add)

# See its arguments
formals(my_add)

# See its body
body(my_add)
```

This is what "first-class" means: functions have no special status. They're values, just like numbers.

## Passing Functions as Arguments

This is where FP gets powerful. You can hand a function to another function as an argument:

```r
# apply a function to every element
nums <- c(1, 4, 9, 16, 25)
sapply(nums, sqrt)
```

```r
# Pass any function you want
values <- c(-3, 5, -1, 8, -4, 2)

sapply(values, abs)
sapply(values, function(x) x^2)
sapply(values, function(x) ifelse(x > 0, "pos", "neg"))
```

`sapply()` takes two arguments: data and a function. It applies that function to each element. You don't write a loop -- you describe what transformation to apply.

### Custom Higher-Order Functions

A "higher-order function" is any function that takes another function as an argument or returns one. You can write your own:

```r
# A function that applies any operation twice
apply_twice <- function(f, x) {
  f(f(x))
}

apply_twice(sqrt, 256)   # sqrt(sqrt(256)) = sqrt(16) = 4
apply_twice(function(x) x + 1, 5)  # (5+1)+1 = 7
apply_twice(function(x) x * 2, 3)  # (3*2)*2 = 12
```

```r
# A function that filters data using any test
keep_if <- function(data, test_fn) {
  data[sapply(data, test_fn)]
}

numbers <- list(3, -1, 4, -1, 5, -9, 2, 6)
keep_if(numbers, function(x) x > 0)
keep_if(numbers, function(x) x %% 2 == 0)
```

## Anonymous Functions

You've already seen these -- functions without names. They're throwaway functions for one-time use:

```r
# Named function
double <- function(x) x * 2
sapply(1:5, double)

# Anonymous function -- same result, no name needed
sapply(1:5, function(x) x * 2)
```

R 4.1 introduced a shorthand syntax using `\()`:

```r
# Traditional anonymous function
sapply(1:5, function(x) x^2 + 1)

# R 4.1+ shorthand (backslash replaces "function")
sapply(1:5, \(x) x^2 + 1)

# They're identical
```

Use anonymous functions when the logic is simple and you won't reuse it. Name it if you'll use it more than once.

## Returning Functions from Functions

Functions can create and return other functions. This is called a "function factory":

```r
# A function that creates multiplier functions
make_multiplier <- function(factor) {
  function(x) x * factor
}

double <- make_multiplier(2)
triple <- make_multiplier(3)

double(10)
triple(10)
```

```r
# A function factory for power functions
make_power <- function(n) {
  function(x) x^n
}

square <- make_power(2)
cube <- make_power(3)

cat("5 squared:", square(5), "\n")
cat("5 cubed:", cube(5), "\n")
cat("2 to the 10th:", make_power(10)(2), "\n")
```

This works because of **closures** -- the inner function "remembers" the environment where it was created, including the value of `factor` or `n`.

## Storing Functions in Lists

Since functions are values, you can put them in lists:

```r
# A toolkit of summary functions
stats_toolkit <- list(
  average = mean,
  middle = median,
  spread = sd,
  smallest = min,
  biggest = max
)

data <- c(4, 8, 15, 16, 23, 42)

# Apply each function
sapply(stats_toolkit, function(f) f(data))
```

```r
# A list of transformation functions
transforms <- list(
  identity = function(x) x,
  log = log,
  sqrt = sqrt,
  square = function(x) x^2
)

x <- 16
sapply(transforms, function(f) f(x))
```

This pattern is extremely useful for applying multiple analyses to the same data.

## Map, Filter, Reduce: The FP Triad

Three operations form the backbone of functional programming everywhere:

### Map: Transform Every Element

`Map()` applies a function to each element and returns the results:

```r
# Map with one input
numbers <- list(1, 4, 9, 16)
lapply(numbers, sqrt)
```

```r
# Map with two inputs
names <- c("Alice", "Bob", "Carol")
scores <- c(92, 85, 97)

mapply(function(n, s) paste(n, "scored", s), names, scores)
```

```r
# Map is just sapply/lapply
# sapply simplifies to a vector when possible
sapply(1:10, function(x) x^2)

# lapply always returns a list
lapply(1:5, function(x) x^2)
```

### Filter: Keep What Matches

`Filter()` keeps only elements that pass a test:

```r
numbers <- list(3, -1, 4, -1, 5, -9, 2, 6)

# Keep positive numbers
Filter(function(x) x > 0, numbers)
```

```r
# Filter a list of strings
words <- list("apple", "bat", "cherry", "date", "elderberry")

# Keep words longer than 4 characters
Filter(function(w) nchar(w) > 4, words)

# Keep words starting with a vowel
Filter(function(w) grepl("^[aeiou]", w), words)
```

### Reduce: Combine Into One Value

`Reduce()` applies a function cumulatively, collapsing a list down to a single value:

```r
# Sum using Reduce
Reduce(`+`, 1:10)

# Same as: ((((1+2)+3)+4)+5)+6)+7)+8)+9)+10

# Product
Reduce(`*`, 1:5)  # 5! = 120
```

```r
# Reduce with a custom function
# Find the running maximum
Reduce(max, c(3, 1, 4, 1, 5, 9, 2, 6), accumulate = TRUE)
```

```r
# Practical example: merge multiple data frames
df1 <- data.frame(id = 1:3, x = c(10, 20, 30))
df2 <- data.frame(id = 2:4, y = c(40, 50, 60))
df3 <- data.frame(id = 1:4, z = c(70, 80, 90, 100))

# Merge all at once
Reduce(function(a, b) merge(a, b, by = "id", all = TRUE),
       list(df1, df2, df3))
```

## Why FP Beats Loops

Here's the same task done two ways:

```r
# LOOP APPROACH: square each number, keep even results, sum them
numbers <- 1:10
squared <- c()
for (i in numbers) {
  squared <- c(squared, i^2)
}
even_squares <- c()
for (s in squared) {
  if (s %% 2 == 0) even_squares <- c(even_squares, s)
}
total <- 0
for (e in even_squares) {
  total <- total + e
}
cat("Loop result:", total, "\n")

# FP APPROACH: same thing, three lines
squared <- sapply(1:10, function(x) x^2)
even_squares <- Filter(function(x) x %% 2 == 0, squared)
cat("FP result:", Reduce(`+`, even_squares), "\n")
```

The FP version is shorter, clearer, and less error-prone. Here's why:

| Aspect | Loops | Functional |
|--------|-------|------------|
| Lines of code | More | Fewer |
| Bug surface area | Growing accumulators, off-by-one | Minimal |
| Readability | "How it's done" | "What is done" |
| Parallelization | Hard | Easy (each element is independent) |
| Side effects | Common | Avoided by design |

## The apply Family

R's built-in `apply` family covers most FP needs:

```r
# sapply: apply to vector/list, return simplified result
sapply(1:5, function(x) x^2)
```

```r
# lapply: like sapply but always returns a list
lapply(1:5, function(x) c(x, x^2, x^3))
```

```r
# vapply: like sapply but you specify the return type (safer)
vapply(1:5, function(x) x^2, numeric(1))
```

```r
# tapply: apply by group
scores <- c(85, 92, 78, 95, 88, 76, 91, 84)
groups <- c("A", "A", "B", "A", "B", "B", "A", "B")

tapply(scores, groups, mean)
```

```r
# apply: apply over rows (1) or columns (2) of a matrix
mat <- matrix(1:12, nrow = 3)
cat("Matrix:\n")
print(mat)
cat("\nRow sums:", apply(mat, 1, sum), "\n")
cat("Col means:", apply(mat, 2, mean), "\n")
```

## A Taste of purrr

The `purrr` package from the tidyverse provides a more consistent and powerful set of FP tools. Here's a quick preview:

```r
# purrr is not available in WebR by default,
# but here's what the syntax looks like:

# Base R:
sapply(1:5, function(x) x^2)

# purrr equivalent:
# map_dbl(1:5, ~ .x^2)

# The ~ formula syntax is purrr's shorthand for anonymous functions
# .x refers to the current element

# More purrr examples (syntax only):
# map(list, function)        -- always returns a list
# map_dbl(list, function)    -- returns a numeric vector
# map_chr(list, function)    -- returns a character vector
# map2(list1, list2, function) -- maps over two lists
# pmap(list_of_lists, function) -- maps over many lists

cat("purrr provides type-safe mapping functions.\n")
cat("Install with: install.packages('purrr')\n")
```

## Composition: Chaining Functions

Function composition means feeding the output of one function into the input of another:

```r
# Step by step
data <- c(1, 4, 9, 16, 25)
step1 <- sqrt(data)
step2 <- round(step1, 2)
step3 <- paste(step2, collapse = ", ")
cat(step3, "\n")

# Using the pipe (R 4.1+)
c(1, 4, 9, 16, 25) |> sqrt() |> round(2) |> paste(collapse = ", ") |> cat("\n")
```

```r
# Build your own compose function
compose <- function(f, g) {
  function(...) f(g(...))
}

# Create a new function from two existing ones
sqrt_then_round <- compose(round, sqrt)
sqrt_then_round(c(2, 3, 5, 7, 11))
```

## Practice Exercises

**Exercise 1:** Use `sapply()` to compute the factorial of numbers 1 through 8. (Hint: R has a built-in `factorial()` function.)

```r
# Your code here
```

<details><summary>Solution</summary>

```r
sapply(1:8, factorial)
```

</details>

**Exercise 2:** Create a function factory `make_greeter(greeting)` that returns a function. The returned function should take a name and print a personalized message.

```r
# Your code here
```

<details><summary>Solution</summary>

```r
make_greeter <- function(greeting) {
  function(name) cat(greeting, name, "\n")
}

hello <- make_greeter("Hello,")
howdy <- make_greeter("Howdy,")

hello("Alice")
howdy("Bob")
```

</details>

**Exercise 3:** Use `Filter()` to keep only the even numbers from the list `list(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)`.

```r
# Your code here
```

<details><summary>Solution</summary>

```r
Filter(function(x) x %% 2 == 0, list(1, 2, 3, 4, 5, 6, 7, 8, 9, 10))
```

</details>

**Exercise 4:** Use `Reduce()` to find the intersection of three vectors: `c(1,2,3,4)`, `c(2,3,4,5)`, and `c(3,4,5,6)`.

```r
# Your code here
```

<details><summary>Solution</summary>

```r
Reduce(intersect, list(c(1,2,3,4), c(2,3,4,5), c(3,4,5,6)))
```

</details>

**Exercise 5:** Store three functions (`mean`, `median`, `sd`) in a list. Apply all three to the vector `c(4, 8, 15, 16, 23, 42)` using `sapply()`.

```r
# Your code here
```

<details><summary>Solution</summary>

```r
fns <- list(mean = mean, median = median, sd = sd)
sapply(fns, function(f) f(c(4, 8, 15, 16, 23, 42)))
```

</details>

## FAQ

**Q: Is R a functional programming language?**
A: R is multi-paradigm -- it supports functional, object-oriented, and imperative styles. But its design is deeply functional. Vectors, the apply family, and the pipe operator all reflect FP principles.

**Q: When should I use loops instead of FP?**
A: Use loops when each iteration depends on the previous one (like simulations or convergence algorithms). For independent transformations of each element, FP is almost always better.

**Q: What's the difference between sapply() and lapply()?**
A: `lapply()` always returns a list. `sapply()` tries to simplify the result into a vector or matrix. Use `vapply()` in production code -- it's the safest because you specify the expected return type.

**Q: Do I need purrr if I know base R's apply functions?**
A: You don't need it, but it's worth learning. `purrr` has consistent naming, type-safe variants (`map_dbl`, `map_chr`), and better error messages. It's part of the tidyverse, so you'll encounter it in modern R code.

**Q: What is a closure?**
A: A closure is a function plus its enclosing environment. When a function factory creates an inner function, that inner function "closes over" the variables in the factory, remembering their values even after the factory finishes executing.

## Conclusion

Functional programming in R is not an advanced technique -- it's how R was designed to be used. Functions are values you can store, pass, and return. The `apply` family replaces most loops. `Map`, `Filter`, and `Reduce` express common data transformations clearly and concisely. Once you start thinking in functions instead of loops, your R code becomes shorter, easier to read, and harder to break.
