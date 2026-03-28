# purrr map() Variants: map, map2, imap, pmap — The Complete Tutorial

> purrr's map family replaces for loops with clean, composable code. Learn map(), map2(), imap(), and pmap() with the type-suffix system that guarantees the output you expect.

## Why purrr Exists

R's base `lapply()` works fine — but it always returns a list. You never know exactly what shape your output will be. The purrr package solves this with a **type-suffix system**: `map_chr()` always returns a character vector, `map_dbl()` always returns a numeric vector, and so on. If the output doesn't match, purrr throws an error instead of silently giving you something weird.

This tutorial teaches you every variant of `map()` with interactive code you can run and modify in your browser.

## The Mental Model: Input → Function → Output

Every `map()` call follows the same pattern:

1. **Input**: a list or vector
2. **Function**: applied to each element
3. **Output**: determined by the suffix

Think of it like an assembly line. Each item goes through the same machine, and the suffix tells you the shape of the box it comes out in.

## map() — The Foundation

`map()` takes a list (or vector) and applies a function to every element. It always returns a **list**.

```r
library(purrr)

# Square each number
numbers <- list(1, 4, 9, 16)
map(numbers, sqrt)
```

The result is a list of length 4, with each element being the square root. But what if you want a plain numeric vector instead of a list?

## The Type-Suffix System

This is the key idea in purrr. Add a suffix to `map()` and you guarantee the output type:

| Function | Returns | Fails if... |
|----------|---------|-------------|
| `map()` | list | (never fails on type) |
| `map_chr()` | character vector | any element isn't character |
| `map_dbl()` | numeric vector | any element isn't numeric |
| `map_int()` | integer vector | any element isn't integer |
| `map_lgl()` | logical vector | any element isn't logical |
| `map_df()` | data frame (row-bind) | any element isn't a data frame row |

```r
# map_dbl() returns a numeric vector, not a list
numbers <- list(1, 4, 9, 16)
map_dbl(numbers, sqrt)
```

```r
# map_chr() returns a character vector
fruits <- list("apple", "banana", "cherry")
map_chr(fruits, toupper)
```

```r
# map_lgl() returns a logical vector
values <- list(3, -1, 5, -2, 0)
map_lgl(values, \(x) x > 0)
```

## Using Anonymous Functions

You can pass any function to `map()`. For quick one-off operations, use an anonymous function with the `\(x)` syntax:

```r
# Named function
map_dbl(list(1, 4, 9), sqrt)

# Anonymous function with \(x)
map_dbl(list(1, 4, 9), \(x) x^2 + 1)

# Multi-line anonymous function
map_chr(list(1, 4, 9), \(x) {
  result <- sqrt(x)
  paste("sqrt =", result)
})
```

## Working With Named Lists

When you map over a named list, the names carry through to the output:

```r
ages <- list(alice = 30, bob = 25, carol = 35)
map_dbl(ages, \(x) x + 5)
```

## map() With Data Frames

`map()` treats a data frame as a list of columns. This lets you apply a function to every column:

```r
df <- data.frame(a = c(1, 2, 3), b = c(10, 20, 30), c = c(100, 200, 300))
map_dbl(df, mean)
```

## map_df() — Returning Data Frames

`map_df()` applies a function that returns a data frame (or named list) per element, then row-binds everything together:

```r
people <- list(
  list(name = "Alice", score = 92),
  list(name = "Bob", score = 85),
  list(name = "Carol", score = 97)
)

map_df(people, \(p) {
  data.frame(name = p$name, grade = ifelse(p$score >= 90, "A", "B"))
})
```

## Replacing For Loops

Here's the pattern. Any time you write this:

```
results <- c()
for (i in seq_along(x)) {
  results[i] <- some_function(x[i])
}
```

Replace it with:

```r
results <- map_dbl(x, some_function)
```

Let's see a real example:

```r
# For loop version
files <- c("data1", "data2", "data3")
lengths_loop <- c()
for (i in seq_along(files)) {
  lengths_loop[i] <- nchar(files[i])
}
cat("Loop result:", lengths_loop, "\n")

# purrr version — one line
lengths_purrr <- map_int(files, nchar)
cat("purrr result:", lengths_purrr, "\n")
```

## map2() — Two Inputs in Parallel

`map2()` iterates over two inputs at the same time, passing one element from each:

```r
names <- c("Alice", "Bob", "Carol")
scores <- c(92, 85, 97)

map2_chr(names, scores, \(n, s) {
  paste(n, "scored", s)
})
```

The type-suffix system works the same: `map2_dbl()`, `map2_chr()`, `map2_lgl()`, etc.

```r
# Weighted average: two vectors, element by element
values <- c(80, 90, 70)
weights <- c(0.3, 0.5, 0.2)

map2_dbl(values, weights, \(v, w) v * w)
```

## imap() — Iterate With Index or Name

`imap()` passes each element AND its index (or name) to your function:

```r
fruits <- c(apple = 1.20, banana = 0.50, cherry = 3.00)

imap_chr(fruits, \(price, name) {
  paste(name, "costs $", price)
})
```

For unnamed vectors, the second argument is the numeric index:

```r
colors <- c("red", "green", "blue")

imap_chr(colors, \(color, idx) {
  paste(idx, ":", color)
})
```

## pmap() — Any Number of Inputs

`pmap()` takes a list of inputs (often a data frame) and iterates over all of them in parallel:

```r
params <- list(
  n = c(5, 10, 15),
  mean = c(0, 100, 50),
  sd = c(1, 10, 5)
)

# Generate 3 sets of random numbers with different parameters
set.seed(42)
pmap(params, \(n, mean, sd) round(rnorm(n, mean, sd), 1))
```

Using a data frame as input:

```r
students <- data.frame(
  name = c("Alice", "Bob", "Carol"),
  math = c(92, 85, 97),
  english = c(88, 91, 84)
)

pmap_dbl(students[, c("math", "english")], \(math, english) {
  round((math + english) / 2, 1)
})
```

## walk() — Map Without Output

`walk()` works like `map()` but is used for **side effects** — printing, writing files, making plots — where you don't need the return value:

```r
messages <- c("Step 1: Load data", "Step 2: Clean data", "Step 3: Analyze")
walk(messages, \(m) cat(m, "\n"))
```

There's also `walk2()` and `pwalk()` for multi-input side effects.

## Error Handling: possibly() and safely()

Real data is messy. `possibly()` wraps a function so it returns a default value instead of crashing:

```r
safe_log <- possibly(log, otherwise = NA)

values <- list(10, -5, 100, "text", 0.5)
map_dbl(values, safe_log)
```

`safely()` returns both the result and the error for each element:

```r
safe_log <- safely(log)
results <- map(list(10, -5, "text"), safe_log)

# Check what worked and what didn't
map(results, "result")
map(results, "error")
```

## Working With Lists of Data Frames

A common real-world pattern: split a data frame, process each piece, then combine:

```r
# Create sample data
sales <- data.frame(
  region = rep(c("North", "South", "East"), each = 3),
  amount = c(100, 150, 200, 80, 120, 90, 300, 250, 280)
)

# Split by region, summarize each, combine
sales |>
  split(sales$region) |>
  map_df(\(df) {
    data.frame(
      region = df$region[1],
      total = sum(df$amount),
      avg = round(mean(df$amount), 1)
    )
  })
```

## Practice Exercises

### Exercise 1: Type Suffixes
Use `map_dbl()` to compute the standard deviation of each column in `mtcars[, 1:4]`.

### Exercise 2: map2
Given `first <- c("Ada", "Grace", "Margaret")` and `last <- c("Lovelace", "Hopper", "Hamilton")`, use `map2_chr()` to create full names like "Ada Lovelace".

### Exercise 3: imap
Given `scores <- c(math = 95, science = 88, english = 76)`, use `imap_chr()` to produce strings like "math: 95 points".

### Exercise 4: Error Handling
Use `possibly()` to safely convert `c("10", "abc", "25", "xyz", "42")` to numbers, returning NA for failures.

## FAQ

### When should I use map() vs lapply()?
Use `map()` when you want type safety (the suffix system), cleaner syntax with `\(x)`, and consistency with the tidyverse. Use `lapply()` when you want zero dependencies.

### What does the ~ formula syntax do?
In older purrr code, you'll see `map(x, ~.x + 1)` instead of `map(x, \(x) x + 1)`. The tilde formula was purrr's original shorthand. The `\(x)` syntax (R 4.1+) is now preferred because it's standard R, not purrr-specific.

### Can map() replace all for loops?
Most, but not all. Loops where each iteration depends on the previous one (like cumulative sums or state machines) are better as for loops. Map is for **independent** operations on each element.

### What's the difference between map_df() and map() |> list_rbind()?
`map_df()` is deprecated in newer purrr versions. Use `map(x, f) |> list_rbind()` instead. It does the same thing: applies `f` to each element and row-binds the results.

### Does purrr work with base R pipe |>?
Yes. `x |> map_dbl(sqrt)` works perfectly. The purrr functions are designed to be pipe-friendly.

## Conclusion

The purrr map family gives you a clean, predictable way to apply functions to collections. The type-suffix system is the key insight: it tells you exactly what shape your output will be, and it fails loudly if reality doesn't match. Start with `map()` and `map_dbl()`, then reach for `map2()` when you have two inputs and `pmap()` when you have many. Use `walk()` for side effects and `possibly()` for error handling. That covers 95% of real-world use cases.
