---
title: "R Subsetting Exercises: 10 [] vs [[]] vs $ Practice Problems, Solved Step-by-Step"
slug: R-Subsetting-Exercises
description: "Practice R subsetting with 10 solved exercises on [], [[]], and $. Work through vectors, lists, and data frames with interactive code you can run in your browser."
keywords: "R subsetting exercises, R bracket exercises, [] vs [[]] vs $ R, R indexing practice problems, R subsetting practice, subset R exercises, R extract elements, R list subsetting exercises, double bracket R"
auto_link_terms: "R subsetting exercises|subsetting exercises|[] vs [[]] vs $|bracket exercises in R|R indexing practice"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: 2026-04-12
curriculum_id: E1.10
post_type: EX
sidebar_title: "R Subsetting Exercises"
fr_parent: R-Vectors.html
difficulty: "Intermediate"
---

<p class="lead">Subsetting, pulling specific pieces out of vectors, lists, and data frames with <code>[]</code>, <code>[[]]</code>, and <code>$</code>, is one of the most-used skills in R, and one of the trickiest to master. These 10 exercises take you from basic vector indexing to nested list extraction, each with starter code and a full worked solution.</p>

Run every block, predict the output before you peek at the answer, and you'll have the three operators locked in by the end.

## How does [] work on vectors?

R gives you three subsetting operators, and each returns something different. The fastest way to build intuition is to run code and check your predictions. Let's start with vectors, the simplest structure, and `[]`, the operator you'll use most.

### Problem 1: Extract by position and by name

Given a named vector of exam scores, extract the 2nd and 4th elements by **position**, then extract the same two elements by **name**.

```r
# Setup
scores <- c(math = 88, science = 92, english = 79, history = 95, art = 84)
scores
#> math science english history     art
#>   88      92      79      95      84
```

<details>
<summary>Click to reveal solution</summary>

```r
# Part A: Extract 2nd and 4th by position
scores[c(2, 4)]
#> science history
#>      92      95

# Part B: Extract the same by name
scores[c("science", "history")]
#> science history
#>      92      95
```

**Explanation:** Both approaches return the same named numeric vector. Position-based indexing (`c(2, 4)`) is concise when you know the order, but name-based indexing (`c("science", "history")`) is safer because it still works even if someone reorders the vector later.

</details>

### Problem 2: Logical and negative indexing

From the same `scores` vector, extract all scores above 85 using a **logical condition**. Then exclude the 3rd element using **negative indexing**.

```r
# scores is still available from Problem 1
# Part A: Which scores are above 85?
# Part B: Drop the 3rd element

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
# Part A: Logical subsetting — scores above 85
scores[scores > 85]
#>    math science history
#>      88      92      95

# Part B: Negative indexing — drop the 3rd element
scores[-3]
#>    math science history     art
#>      88      92      95      84
```

**Explanation:** Logical subsetting is powerful because you don't need to know *where* the elements are, just *what* they look like. R evaluates `scores > 85` into a logical vector (`TRUE, TRUE, FALSE, TRUE, FALSE`) and keeps only the `TRUE` positions. Negative indexing is the flip side: instead of "give me these", you say "give me everything *except* these."

</details>

[KEY INSIGHT]
**[] always returns the same type as the input.** Subset a numeric vector with [], you get a numeric vector. Subset a character vector, you get a character vector. This "structure-preserving" behavior is what makes [] different from [[]] and $.

**Try it:** Create a vector of 5 city names and extract the first and last elements using positive indexing and `length()`.

```r
# Try it: extract first and last city
ex_cities <- c("Tokyo", "London", "Nairobi", "Lima", "Sydney")

# your code here

#> Expected: "Tokyo"  "Sydney"
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_cities <- c("Tokyo", "London", "Nairobi", "Lima", "Sydney")
ex_cities[c(1, length(ex_cities))]
#> [1] "Tokyo"  "Sydney"
```

**Explanation:** `length(ex_cities)` returns 5, so `ex_cities[c(1, 5)]` grabs the first and last elements. This pattern works regardless of vector length.

</details>

## How does [] behave differently on lists?

Here's where most R learners hit their first wall. When you use `[]` on a list, you don't get the *contents*, you get a **smaller list** containing those elements.

Think of a list as a train with numbered cars. `[]` gives you a train car (still a train), while `[[]]` opens the car door and hands you what's inside.

### Problem 3: [] on a list returns a sub-list

Create a list and use `[]` to extract the first two elements. What does `class()` return?

```r
# Setup
student <- list(name = "Ava", grades = c(90, 85, 92), graduated = FALSE)

# Use [] to extract elements 1 and 2
# Then check class() of the result

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
student <- list(name = "Ava", grades = c(90, 85, 92), graduated = FALSE)

sub <- student[1:2]
sub
#> $name
#> [1] "Ava"
#>
#> $grades
#> [1] 90 85 92

class(sub)
#> [1] "list"
```

**Explanation:** Even though you only asked for two elements, the result is still a list. That's the key rule: `[]` on a list always returns a list. This is *preserving* subsetting, the output structure matches the input structure.

</details>

### Problem 4: [] vs [[]], what's the actual difference?

Compare `student[2]` and `student[[2]]`. What type does each return? Why does `mean(student[2])` fail while `mean(student[[2]])` works?

```r
# student is still available from Problem 3
# Compare student[2] vs student[[2]]
# Check class() of each
# Try mean() on each

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
# Single bracket: returns a list containing the grades element
student[2]
#> $grades
#> [1] 90 85 92

class(student[2])
#> [1] "list"

# Double bracket: extracts the grades vector itself
student[[2]]
#> [1] 90 85 92

class(student[[2]])
#> [1] "numeric"

# mean() on single bracket fails
# mean(student[2])  # Error: argument is not numeric

# mean() on double bracket works
mean(student[[2]])
#> [1] 89
```

**Explanation:** `student[2]` gives you a list with one element (a train car still on the track). `student[[2]]` gives you the numeric vector inside (the cargo pulled out of the car). You can't take the mean of a list, so `mean(student[2])` throws an error. But `mean(student[[2]])` works because it receives a plain numeric vector.

</details>

[WARNING]
**student["grades"] returns a list, not the vector.** This catches everyone. Passing a single-bracket result to `mean()`, `sum()`, or `max()` will fail with "argument is not numeric." Use `[[` or `$` when you need the value for computation.

**Try it:** Create a list with 3 named elements and use `[]` to extract a sub-list of elements 1 and 3. Verify the result is a list with `is.list()`.

```r
# Try it: sub-list extraction
ex_info <- list(city = "Berlin", pop = 3700000, country = "Germany")

# your code here

#> Expected: TRUE
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_info <- list(city = "Berlin", pop = 3700000, country = "Germany")
ex_sub <- ex_info[c(1, 3)]
is.list(ex_sub)
#> [1] TRUE
```

**Explanation:** `ex_info[c(1, 3)]` returns a list with elements `city` and `country`. The `is.list()` check confirms the structure is preserved.

</details>

## When should you use [[]] to extract elements?

Use `[[]]` whenever you need the *value itself* for computation, not a container holding the value. `[[]]` works by name or by position, but it can only extract **one element at a time**. Its superpower over `$` is programmatic access: you can store a name in a variable and pass it to `[[]]`.

### Problem 5: Extract and compute with [[]]

Given a configuration list, extract the `port` value using `[[]]`, by name and by position. Add 1 to prove it's a plain number, not a list.

```r
# Setup
config <- list(host = "localhost", port = 8080, debug = TRUE)

# Extract port by name, then by position
# Add 1 to the result to prove it's numeric

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
config <- list(host = "localhost", port = 8080, debug = TRUE)

# By name
config[["port"]]
#> [1] 8080

# By position
config[[2]]
#> [1] 8080

# Prove it's numeric — add 1
port_val <- config[["port"]]
port_val + 1
#> [1] 8081
```

**Explanation:** Both approaches return the naked number `8080`, not a list containing `8080`. That's why `port_val + 1` works. If you had used `config["port"]` (single bracket), adding 1 would throw an error because you'd be trying to add 1 to a list.

</details>

### Problem 6: [[]] on a data frame column

Using `mtcars`, extract the `mpg` column with `[[]]` by name and by position. Compute the mean.

```r
# Extract mpg from mtcars using [[]]
# Then compute mean()

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
# By name
mpg_vec <- mtcars[["mpg"]]
head(mpg_vec)
#> [1] 21.0 21.0 22.8 21.4 18.7 18.1

# By position (mpg is column 1)
head(mtcars[[1]])
#> [1] 21.0 21.0 22.8 21.4 18.7 18.1

# Compute the mean
mean(mpg_vec)
#> [1] 20.09062
```

**Explanation:** A data frame is just a list of equal-length vectors. So `mtcars[["mpg"]]` extracts the `mpg` vector the same way `student[["grades"]]` extracted the grades vector from a list earlier. `mtcars[[1]]` gives you the first column as a vector, same idea, just by position.

</details>

[TIP]
**Use [[]] when you need the value for computation. Use [] when you need a subset that preserves structure.** If you're passing the result to `mean()`, `sum()`, or `max()`, you almost certainly want `[[]]` or `$`. If you're building a smaller data frame, use `[]`.

**Try it:** Given `col_name <- "hp"`, extract that column from `mtcars` using `[[col_name]]` (programmatic access) and compute its median.

```r
# Try it: programmatic column access
ex_col <- "hp"

# your code here

#> Expected: 123
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_col <- "hp"
median(mtcars[[ex_col]])
#> [1] 123
```

**Explanation:** `[[col_name]]` evaluates the variable `col_name` to get the string `"hp"`, then extracts that column. This is why `[[]]` is preferred in functions and loops, `$` can't accept variables.

</details>

## How does $ simplify named access?

The `$` operator is shorthand for `[["name"]]`. It's the most readable option for interactive use, `mtcars$mpg` is quicker to type and easier to scan than `mtcars[["mpg"]]`.

But it has two limitations: it only works with **literal names** (not variables), and it does **partial matching** (which can silently return the wrong element).

### Problem 7: $ on a data frame

Use `$` to extract the `cyl` column from `mtcars` and count how many cars have each cylinder count using `table()`.

```r
# Extract cyl with $ and pass to table()

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
table(mtcars$cyl)
#>
#>  4  6  8
#> 11  7 14
```

**Explanation:** `mtcars$cyl` extracts the `cyl` vector, and `table()` counts how many times each value appears. 14 cars have 8 cylinders, 11 have 4, and 7 have 6. For interactive exploration, `$` is the fastest way to grab a column.

</details>

### Problem 8: The partial matching trap

Create a list and observe how `$` partial-matches names. What does `person$f` return? What about `person$a`? Why is this dangerous?

```r
# Setup
person <- list(first_name = "Raj", last_name = "Patel", age = 30)

# Try: person$first_name (full match)
# Try: person$f (partial match)
# Try: person$a (partial match)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
person <- list(first_name = "Raj", last_name = "Patel", age = 30)

# Full name — works perfectly
person$first_name
#> [1] "Raj"

# Partial match — still works!
person$f
#> [1] "Raj"

# Another partial match
person$a
#> [1] 30
```

**Explanation:** `person$f` matches `first_name` because `f` is an unambiguous prefix, only one element starts with "f". Similarly, `person$a` matches `age`. The real danger is that partial matching happens **silently**, no warning, no error. If someone later adds a `favorite_color` element, `person$f` becomes ambiguous and returns `NULL` instead. Your code breaks without any obvious reason.

</details>

[WARNING]
**$ silently partial-matches names.** `person$f` returns `first_name` without any warning. In scripts and functions, prefer `[[]]` for safety. For interactive work, add `options(warnPartialMatchDollar = TRUE)` to your `.Rprofile` to catch these.

**Try it:** Use `$` to extract the `Species` column from `iris` and count how many unique species there are.

```r
# Try it: unique species count
# your code here

#> Expected: 3
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_species <- iris$Species
length(unique(ex_species))
#> [1] 3
```

**Explanation:** `iris$Species` extracts the Species factor, `unique()` returns the three distinct levels, and `length()` counts them.

</details>

## How do you combine [], [[]], and $ on data frames?

Data frames respond to all three operators, but the return types differ. Understanding this is the final piece of the puzzle, and it's where most bugs hide.

Here's the rule of thumb:

- `df["col"]` → a **1-column data frame** (structure preserved)
- `df[["col"]]` or `df$col` → a **vector** (element extracted)
- `df[rows, cols]` → a **sub-data-frame** (2D subsetting)

### Problem 9: Three ways to slice mtcars

From `mtcars`, perform three operations:

**(a)** Extract a data frame containing just `mpg` and `hp` using `[]`.

**(b)** Extract the `mpg` column as a vector using `[[]]`.

**(c)** Extract rows where `cyl == 6` and columns `mpg`, `hp`, `wt` using `[rows, cols]`.

```r
# (a) Use [] to get a 2-column data frame
# (b) Use [[]] to get mpg as a vector
# (c) Use [rows, cols] to filter and select

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
# (a) [] with column names — returns a data frame
subset_df <- mtcars[c("mpg", "hp")]
head(subset_df, 3)
#>                mpg  hp
#> Mazda RX4     21.0 110
#> Mazda RX4 Wag 21.0 110
#> Datsun 710    22.8  93

class(subset_df)
#> [1] "data.frame"

# (b) [[]] — returns a vector
mpg_vector <- mtcars[["mpg"]]
head(mpg_vector, 3)
#> [1] 21.0 21.0 22.8

class(mpg_vector)
#> [1] "numeric"

# (c) [rows, cols] — 2D subsetting
cyl6 <- mtcars[mtcars$cyl == 6, c("mpg", "hp", "wt")]
cyl6
#>                 mpg  hp    wt
#> Mazda RX4      21.0 110 2.620
#> Mazda RX4 Wag  21.0 110 2.875
#> Hornet 4 Drive 21.4 110 3.215
#> Valiant        18.1 105 3.460
#> Merc 280       19.2 123 3.440
#> Merc 280C      17.8 123 3.440
#> Ferrari Dino   19.7 175 2.770
```

**Explanation:** Part (a) returns a data frame because `[]` preserves structure. Part (b) returns a numeric vector because `[[]]` extracts the element. Part (c) combines row filtering with column selection, `mtcars$cyl == 6` creates a logical vector for rows, and `c("mpg", "hp", "wt")` selects columns. This `[rows, cols]` syntax is the workhorse of data frame subsetting.

</details>

### Problem 10: Nested list extraction

Given a nested list of team data, extract team_b's second score in a **single expression**. Then do it again using `$` notation.

```r
# Setup
records <- list(
  team_a = list(scores = c(10, 20, 30), captain = "Lee"),
  team_b = list(scores = c(15, 25, 35), captain = "Kim")
)

# Extract team_b's second score using [[]]
# Then do it with $

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
records <- list(
  team_a = list(scores = c(10, 20, 30), captain = "Lee"),
  team_b = list(scores = c(15, 25, 35), captain = "Kim")
)

# Using [[]]
records[["team_b"]][["scores"]][2]
#> [1] 25

# Using $
records$team_b$scores[2]
#> [1] 25
```

**Explanation:** Read left to right: `records[["team_b"]]` extracts the team_b list, `[["scores"]]` extracts the scores vector from that list, and `[2]` grabs the second element. The `$` version reads more naturally. Notice the switch from `$` (named access into lists) to `[]` (position access into a vector) at the final step, that's because `scores` is a vector, not a list.

</details>

[KEY INSIGHT]
**A data frame is just a named list of equal-length vectors.** That's why [[]] and $ work on data frames exactly like they work on lists, because a data frame *is* a list under the hood. Once you internalize this, subsetting rules stop feeling arbitrary.

**Try it:** Extract the value in the 3rd row and 2nd column of `mtcars` as a single number using `[row, col]` notation.

```r
# Try it: single value extraction
# your code here

#> Expected: 4
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_val <- mtcars[3, 2]
ex_val
#> [1] 4
```

**Explanation:** Row 3 is the Datsun 710, column 2 is `cyl`. The result is `4` (a 4-cylinder car). When you provide both a row and column index, `[]` returns a single value.

</details>

## Practice Exercises

These capstone exercises combine multiple subsetting operators. Each one requires chaining techniques from earlier problems. Try to solve each before revealing the answer.

### Exercise 1: Filter-and-extract pipeline

Given a survey data frame, build a multi-step pipeline: (a) extract the `score` column as a vector with `[[]]`, (b) create a logical vector for scores above 80, (c) use that logical vector to subset the data frame rows with `[]`, (d) extract the `id` column from the filtered result with `$`.

```r
# Setup
survey <- data.frame(
  id = 1:5,
  score = c(72, 88, 91, 65, 80),
  passed = c(FALSE, TRUE, TRUE, FALSE, TRUE)
)

# Build the pipeline step by step
# Hint: each step feeds into the next

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
survey <- data.frame(
  id = 1:5,
  score = c(72, 88, 91, 65, 80),
  passed = c(FALSE, TRUE, TRUE, FALSE, TRUE)
)

# Step a: extract score as a vector
my_scores <- survey[["score"]]

# Step b: logical vector — which scores > 80?
my_above80 <- my_scores > 80

# Step c: subset rows where score > 80
my_passed <- survey[my_above80, ]
my_passed
#>   id score passed
#> 2  2    88   TRUE
#> 3  3    91   TRUE

# Step d: extract their ids
my_ids <- my_passed$id
my_ids
#> [1] 2 3
```

**Explanation:** This pipeline uses all three operators: `[[]]` to extract a vector for computation, `[]` for 2D row subsetting with a logical condition, and `$` for quick column access. In practice, you'd often write this more compactly as `survey[survey$score > 80, ]$id`, but breaking it into steps makes the logic visible.

</details>

### Exercise 2: Navigate a nested list

Given a nested department list, write two expressions: (a) extract the 2nd and 3rd staff members of the `eng` department using `[[]]` and `[]`, (b) build a named character vector of all department heads using `sapply()`.

```r
# Setup
dept <- list(
  hr = list(head = "Sara", staff = c("Mo", "Li")),
  eng = list(head = "Dev", staff = c("Jo", "Al", "Bo"))
)

# (a) 2nd and 3rd eng staff
# Hint: drill into eng -> staff with [[]], then use [] for positions

# (b) Named vector of all department heads
# Hint: sapply(dept, function(x) ...)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
dept <- list(
  hr = list(head = "Sara", staff = c("Mo", "Li")),
  eng = list(head = "Dev", staff = c("Jo", "Al", "Bo"))
)

# (a) 2nd and 3rd eng staff
dept[["eng"]][["staff"]][2:3]
#> [1] "Al" "Bo"

# (b) Named vector of department heads
my_heads <- sapply(dept, function(x) x[["head"]])
my_heads
#>    hr   eng
#> "Sara" "Dev"
```

**Explanation:** Part (a) chains `[[]]` to drill into the nested structure, then switches to `[]` for multi-element selection from the character vector. Part (b) uses `sapply()` to iterate over each department and extract the `"head"` element, `sapply()` simplifies the result into a named character vector because each extraction returns a single string.

</details>

## Complete Example

Let's put everything together in a realistic scenario. You have a data frame of cars and want to answer: **which high-mileage cars (mpg > 25) have 4 cylinders, and what's their average horsepower?**

```r
# Start with mtcars
cars_df <- mtcars

# Step 1: Quick look at what we're working with using $
head(cars_df$mpg, 10)
#>  [1] 21.0 21.0 22.8 21.4 18.7 18.1 14.3 24.4 22.8 19.2

# Step 2: Filter rows with [rows, cols] — high mpg AND 4 cylinders
high_mpg_4cyl <- cars_df[cars_df$mpg > 25 & cars_df$cyl == 4, ]

# Step 3: View the result — select key columns with []
high_mpg_4cyl[c("mpg", "cyl", "hp")]
#>                 mpg cyl  hp
#> Fiat 128       32.4   4  66
#> Honda Civic    30.4   4  52
#> Toyota Corolla 33.9   4  65
#> Fiat X1-9      27.3   4  66
#> Porsche 914-2  26.0   4  91
#> Lotus Europa   30.4   4 113

# Step 4: Extract hp as a vector with [[]] and compute mean
hp_vec <- high_mpg_4cyl[["hp"]]
mean(hp_vec)
#> [1] 75.5

# Step 5: How many cars matched?
nrow(high_mpg_4cyl)
#> [1] 6

# Step 6: Which cars? Row names tell us
rownames(high_mpg_4cyl)
#> [1] "Fiat 128"       "Honda Civic"    "Toyota Corolla"
#> [4] "Fiat X1-9"      "Porsche 914-2"  "Lotus Europa"
```

This example used all three operators naturally: `$` for quick column checks in the filter condition, `[]` with a logical condition for row filtering and column selection, and `[[]]` to extract a vector for computing the mean. Six 4-cylinder cars exceed 25 mpg, with an average horsepower of about 76, confirming that fuel-efficient 4-cylinder cars tend to have modest power.

## Summary

Here's a side-by-side comparison of the three subsetting operators:

| Feature | `[]` | `[[]]` | `$` |
|---|---|---|---|
| Works on | Vectors, lists, data frames | Lists, data frames | Lists, data frames |
| Returns | Same structure as input | The element itself | The element itself |
| Multiple elements? | Yes | No (one at a time) | No (one at a time) |
| Programmatic names? | Yes (`x[var]`) | Yes (`x[[var]]`) | No (literal only) |
| Partial matching? | No | No (exact by default) | Yes (silently!) |
| Best use case | Subsetting, filtering | Extracting for computation | Interactive access |

**Key takeaways:**

1. `[]` preserves structure, subset a list, get a list; subset a data frame, get a data frame
2. `[[]]` extracts the raw value, essential when you need to compute with the result
3. `$` is convenient shorthand for `[["name"]]` but watch out for partial matching
4. A data frame is a list of vectors, so `[[]]` and `$` work on data frames the same way they work on lists
5. For 2D subsetting, `df[rows, cols]` is the workhorse, combine logical row filters with column name vectors

## References

1. Wickham, H., *Advanced R*, 2nd Edition. CRC Press (2019). Chapter 4: Subsetting. [Link](https://adv-r.hadley.nz/subsetting.html)
2. R Core Team, *An Introduction to R*. Section 2.7: Index vectors. [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html#Index-vectors)
3. R Documentation, Extract or Replace Parts of an Object. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/Extract.html)
4. Wickham, H. & Grolemund, G., *R for Data Science*, 2nd Edition. Chapter 27: A field guide to base R. [Link](https://r4ds.hadley.nz/base-r)
5. Burns, P., *The R Inferno*. Circle 8: Believing it does as intended. [Link](https://www.burns-stat.com/pages/Tutor/R_inferno.pdf)
6. McMaster University, Indexing in R: why you should use [[ more and [, $ less. [Link](https://ms.mcmaster.ca/~bolker/misc/brackets.html)

## Continue Learning

1. [R Vectors: The Foundation of Everything in R](/R-Vectors.html), deep dive on creating, naming, and operating on the data structure these exercises are built on
2. [R Lists Exercises](/R-Lists-Exercises.html), 10 more practice problems focused on list creation, nested access, and lapply/sapply
3. [R Data Types](/R-Data-Types.html), understand the type system that determines how subsetting behaves on different objects
