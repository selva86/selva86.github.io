---
title: "R Subsetting Exercises: 10 [] vs [[]] vs $ Practice Problems — Solved"
slug: "R-Subsetting-Exercises"
description: "10 R subsetting exercises covering [], [[]], and $ operators on vectors, lists, and data frames. Interactive solutions with step-by-step explanations."
keywords: "R subsetting exercises, R bracket exercises, R [[ vs [ practice, R dollar sign operator, R list subsetting"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "E1.10"
post_type: "EX"
auto_link_terms: "R subsetting exercises|subsetting exercises|bracket exercises"
auto_link_case_sensitive: false
fr_parent: "R-Vectors.html"
---

# R Subsetting Exercises: 10 [] vs [[]] vs $ Practice Problems

<p class="lead">Practice R's three subsetting operators — single bracket <code>[]</code>, double bracket <code>[[]]</code>, and dollar sign <code>$</code> — across vectors, lists, and data frames. Each exercise has an interactive solution you can run in your browser.</p>

R's subsetting operators look similar but behave very differently. These 10 exercises force you to think carefully about which operator returns what — and why. Work through them in order: they build from simple vector indexing to tricky list and data frame scenarios.

## Quick Reference

| Operator | Works on | Returns | Analogy |
|----------|----------|---------|---------|
| `x[i]` | Vectors, lists, data frames | Same type as input (subset) | Pulling pages from a book — you get a smaller book |
| `x[[i]]` | Lists, data frames | The element itself (extracted) | Opening a box and taking the item out |
| `x$name` | Lists, data frames | The element itself (like `[[`) | Shorthand for `x[["name"]]` |

## Easy (1-4): Vector and List Basics

### Exercise 1: Vector Indexing Six Ways

Given a named vector of city temperatures, extract subsets using positive indices, negative indices, logical vectors, and names.

```r
# Exercise 1: Six ways to subset a vector
temps <- c(London = 15, Paris = 18, Berlin = 14, Rome = 22, Madrid = 25, Oslo = 8)

# 1. Extract the 2nd and 4th elements by position
# 2. Exclude the 1st and 6th elements
# 3. Extract cities warmer than 17 degrees
# 4. Extract London and Madrid by name
# 5. Get the first 3 elements
# 6. Reverse the vector order

```

<details>
<summary>Click to reveal solution</summary>

```r
temps <- c(London = 15, Paris = 18, Berlin = 14, Rome = 22, Madrid = 25, Oslo = 8)

# 1. Positive integers select by position
cat("2nd and 4th:", temps[c(2, 4)], "\n")

# 2. Negative integers exclude
cat("Exclude 1st and 6th:", temps[c(-1, -6)], "\n")

# 3. Logical vector keeps TRUE positions
cat("Warmer than 17:", temps[temps > 17], "\n")

# 4. Character vector selects by name
cat("By name:", temps[c("London", "Madrid")], "\n")

# 5. Sequence for ranges
cat("First 3:", temps[1:3], "\n")

# 6. rev() or descending index
cat("Reversed:", temps[length(temps):1], "\n")
```

**Key concept:** `[` with a vector always returns a vector of the same type. Positive integers select, negative integers exclude, logicals filter, and characters match names.

</details>

### Exercise 2: Single Bracket vs Double Bracket on a List

A named list contains three different data types. Use `[` and `[[` to extract elements and observe the difference.

```r
# Exercise 2: [ vs [[ on a list
student <- list(
  name = "Alice",
  scores = c(88, 92, 79, 95),
  passed = TRUE
)

# 1. Use [ to extract the "scores" element. What type is the result?
# 2. Use [[ to extract the "scores" element. What type is the result?
# 3. Get the 3rd score (79) in a single expression using [[
# 4. What does student[2:3] return? What about student[[2:3]]?

```

<details>
<summary>Click to reveal solution</summary>

```r
student <- list(
  name = "Alice",
  scores = c(88, 92, 79, 95),
  passed = TRUE
)

# 1. Single bracket returns a LIST containing the element
result1 <- student["scores"]
cat("student['scores'] class:", class(result1), "\n")
str(result1)

# 2. Double bracket extracts the ELEMENT itself
result2 <- student[["scores"]]
cat("\nstudent[['scores']] class:", class(result2), "\n")
print(result2)

# 3. Chain [[ with [ to reach inside
cat("\n3rd score:", student[["scores"]][3], "\n")

# 4. [ can take a range; [[ cannot
cat("\nstudent[2:3]:\n")
str(student[2:3])

# student[[2:3]] would throw an error in most cases —
# [[ is for extracting a SINGLE element only
```

**Key concept:** `[` always returns a list (a sub-list). `[[` extracts the actual element inside. Think of `[` as selecting a train car (you get a smaller train) and `[[` as opening the car door and pulling out the contents.

</details>

### Exercise 3: The $ Operator

Use `$` to access list elements and understand when it works and when it doesn't.

```r
# Exercise 3: Using $ on lists
config <- list(
  host = "localhost",
  port = 8080,
  debug = FALSE,
  tags = c("api", "v2", "production")
)

# 1. Extract the host using $
# 2. Extract tags using $
# 3. Can you use $ with a variable? Try: key <- "port"; config$key
# 4. What does config$por return? (note: partial match)
# 5. Add a new element "timeout" with value 30 using $

```

<details>
<summary>Click to reveal solution</summary>

```r
config <- list(
  host = "localhost",
  port = 8080,
  debug = FALSE,
  tags = c("api", "v2", "production")
)

# 1. $ accesses by name directly
cat("Host:", config$host, "\n")

# 2. Works with any element type
cat("Tags:", config$tags, "\n")

# 3. $ does NOT evaluate variables — it uses the literal name
key <- "port"
cat("\nconfig$key:", config$key, "\n")        # NULL — no element named "key"
cat("config[[key]]:", config[[key]], "\n")    # 8080 — [[ evaluates the variable

# 4. $ does partial matching (dangerous!)
cat("\nconfig$por:", config$por, "\n")        # Returns 8080 — matched "port"
# Use [[ for exact matching in production code

# 5. Assign with $ to add/modify elements
config$timeout <- 30
cat("\nUpdated config:\n")
str(config)
```

**Key concept:** `$` is convenient but has two traps: it doesn't work with variables (use `[[` instead), and it does partial name matching, which can silently return the wrong element.

</details>

### Exercise 4: Data Frame Subsetting Basics

Subset a data frame using `[`, `[[`, and `$` to extract rows, columns, and individual values.

```r
# Exercise 4: Data frame subsetting
df <- data.frame(
  name = c("Alice", "Bob", "Carol", "David", "Eve"),
  age = c(25, 30, 28, 35, 22),
  score = c(88, 76, 92, 81, 95),
  stringsAsFactors = FALSE
)

# 1. Extract the "score" column as a vector (3 different ways)
# 2. Extract rows 2 through 4 (all columns)
# 3. Extract the score for Carol only
# 4. Extract rows where score > 85

```

<details>
<summary>Click to reveal solution</summary>

```r
df <- data.frame(
  name = c("Alice", "Bob", "Carol", "David", "Eve"),
  age = c(25, 30, 28, 35, 22),
  score = c(88, 76, 92, 81, 95),
  stringsAsFactors = FALSE
)

# 1. Three ways to extract a column as a vector
cat("Using $:", df$score, "\n")
cat("Using [[:", df[["score"]], "\n")
cat("Using [,]:", df[, "score"], "\n")

# Note: df["score"] returns a data frame, not a vector!
cat("\ndf['score'] class:", class(df["score"]), "\n")

# 2. Row subsetting — [rows, columns]
cat("\nRows 2-4:\n")
print(df[2:4, ])

# 3. Combine row and column conditions
cat("\nCarol's score:", df[df$name == "Carol", "score"], "\n")

# 4. Logical condition on rows
cat("\nScores above 85:\n")
print(df[df$score > 85, ])
```

**Key concept:** Data frames are lists of columns. `$` and `[[` extract a column vector. `[` with two arguments (`[rows, cols]`) subsets both dimensions. Leave one blank to keep all rows or all columns.

</details>

## Medium (5-7): Combining Operators

### Exercise 5: Nested List Extraction

Navigate a deeply nested list to extract specific values.

```r
# Exercise 5: Nested list subsetting
company <- list(
  name = "TechCorp",
  departments = list(
    engineering = list(
      head = "Alice",
      team_size = 15,
      projects = c("API", "Frontend", "ML Pipeline")
    ),
    marketing = list(
      head = "Bob",
      team_size = 8,
      projects = c("Campaign Q1", "Brand Refresh")
    )
  ),
  founded = 2019
)

# 1. Extract the engineering department head's name
# 2. Get the 3rd project in engineering ("ML Pipeline")
# 3. Extract both department heads as a character vector
# 4. How many total projects across all departments?

```

<details>
<summary>Click to reveal solution</summary>

```r
company <- list(
  name = "TechCorp",
  departments = list(
    engineering = list(
      head = "Alice",
      team_size = 15,
      projects = c("API", "Frontend", "ML Pipeline")
    ),
    marketing = list(
      head = "Bob",
      team_size = 8,
      projects = c("Campaign Q1", "Brand Refresh")
    )
  ),
  founded = 2019
)

# 1. Chain $ or [[ to navigate levels
cat("Eng head:", company$departments$engineering$head, "\n")
# Equivalent with [[:
cat("Eng head:", company[["departments"]][["engineering"]][["head"]], "\n")

# 2. Add vector indexing at the end
cat("3rd project:", company$departments$engineering$projects[3], "\n")

# 3. Use sapply to extract across list elements
heads <- sapply(company$departments, function(d) d$head)
cat("Heads:", heads, "\n")

# 4. Count total projects
total <- sum(sapply(company$departments, function(d) length(d$projects)))
cat("Total projects:", total, "\n")
```

**Key concept:** Chain `$` or `[[` to drill into nested lists — each level peels off one layer. Use `sapply()` to extract the same field from every element in a list.

</details>

### Exercise 6: Logical Subsetting with Multiple Conditions

Filter data frame rows using compound logical conditions and handle edge cases.

```r
# Exercise 6: Logical subsetting
sales <- data.frame(
  product = c("Laptop", "Mouse", "Keyboard", "Monitor", "Webcam",
              "Headset", "Tablet", "Speaker"),
  price = c(999, 25, 75, 450, 60, 120, 599, 85),
  category = c("Computer", "Accessory", "Accessory", "Computer",
               "Accessory", "Audio", "Computer", "Audio"),
  in_stock = c(TRUE, TRUE, FALSE, TRUE, TRUE, FALSE, TRUE, TRUE),
  stringsAsFactors = FALSE
)

# 1. Products that cost between 50 and 200 (inclusive)
# 2. Accessories that are in stock
# 3. Products that are NOT in the "Computer" category
# 4. In-stock items under $100 OR any computer (regardless of price/stock)
# 5. Which row numbers match category == "Audio"?

```

<details>
<summary>Click to reveal solution</summary>

```r
sales <- data.frame(
  product = c("Laptop", "Mouse", "Keyboard", "Monitor", "Webcam",
              "Headset", "Tablet", "Speaker"),
  price = c(999, 25, 75, 450, 60, 120, 599, 85),
  category = c("Computer", "Accessory", "Accessory", "Computer",
               "Accessory", "Audio", "Computer", "Audio"),
  in_stock = c(TRUE, TRUE, FALSE, TRUE, TRUE, FALSE, TRUE, TRUE),
  stringsAsFactors = FALSE
)

# 1. Combine conditions with &
cat("$50-$200:\n")
print(sales[sales$price >= 50 & sales$price <= 200, ])

# 2. Two conditions: category AND stock
cat("\nIn-stock accessories:\n")
print(sales[sales$category == "Accessory" & sales$in_stock, ])

# 3. Negate with != or !
cat("\nNon-computers:\n")
print(sales[sales$category != "Computer", ])

# 4. OR condition with |
cat("\nCheap in-stock OR any computer:\n")
print(sales[(sales$in_stock & sales$price < 100) | sales$category == "Computer", ])

# 5. which() returns row numbers instead of a logical vector
cat("\nAudio row numbers:", which(sales$category == "Audio"), "\n")
```

**Key concept:** Use `&` (and) and `|` (or) to combine conditions. Wrap compound conditions in parentheses for clarity. `which()` converts a logical vector to integer positions.

</details>

### Exercise 7: Replacing Values via Subsetting

Use subsetting on the left side of assignment to modify specific elements.

```r
# Exercise 7: Subsetting for assignment
grades <- c(A = 95, B = 82, C = 67, D = 58, F = 41)

# 1. Boost every grade below 60 by 5 points
# 2. Cap all grades at 100 (in case any exceed it)
# 3. Replace the "F" grade with NA

inventory <- data.frame(
  item = c("Apples", "Bread", "Milk", "Eggs", "Butter"),
  qty = c(50, 0, 12, 0, 8),
  price = c(1.20, 2.50, 1.80, 3.00, 2.20),
  stringsAsFactors = FALSE
)

# 4. Set qty to 20 for all items currently at 0
# 5. Increase price by 10% for items with qty < 15

```

<details>
<summary>Click to reveal solution</summary>

```r
grades <- c(A = 95, B = 82, C = 67, D = 58, F = 41)
cat("Original grades:", grades, "\n")

# 1. Subset on LEFT side of <- modifies those elements
grades[grades < 60] <- grades[grades < 60] + 5
cat("After boost:", grades, "\n")

# 2. pmin() caps at a maximum, or use conditional assignment
grades[grades > 100] <- 100
cat("After cap:", grades, "\n")

# 3. Assign NA by name
grades["F"] <- NA
cat("After NA:", grades, "\n")

# Data frame version
inventory <- data.frame(
  item = c("Apples", "Bread", "Milk", "Eggs", "Butter"),
  qty = c(50, 0, 12, 0, 8),
  price = c(1.20, 2.50, 1.80, 3.00, 2.20),
  stringsAsFactors = FALSE
)

# 4. Conditional row subsetting on left side
inventory$qty[inventory$qty == 0] <- 20
cat("\nAfter restock:\n")
print(inventory)

# 5. Modify a column conditionally
low_stock <- inventory$qty < 15
inventory$price[low_stock] <- round(inventory$price[low_stock] * 1.10, 2)
cat("\nAfter price increase:\n")
print(inventory)
```

**Key concept:** Subsetting works on both sides of `<-`. The pattern `x[condition] <- new_value` is R's idiomatic way to update specific elements without a loop.

</details>

## Hard (8-10): Advanced Scenarios

### Exercise 8: Matrix Subsetting

Subset matrices using row/column indices, names, and logical conditions.

```r
# Exercise 8: Matrix subsetting
set.seed(99)
mat <- matrix(sample(1:50, 20), nrow = 4,
  dimnames = list(
    c("Q1", "Q2", "Q3", "Q4"),
    c("North", "South", "East", "West", "Central")))
print(mat)

# 1. Extract the value in row "Q2", column "East"
# 2. Extract the entire "South" column as a vector
# 3. Extract rows Q1 and Q3 for columns North and West
# 4. Find all values greater than 30 (return the values, not a logical matrix)
# 5. Which quarter had the highest Central region value?

```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(99)
mat <- matrix(sample(1:50, 20), nrow = 4,
  dimnames = list(
    c("Q1", "Q2", "Q3", "Q4"),
    c("North", "South", "East", "West", "Central")))
cat("Matrix:\n"); print(mat)

# 1. [row, col] by name
cat("\nQ2 East:", mat["Q2", "East"], "\n")

# 2. Leave row blank → all rows; drop=TRUE (default) returns vector
cat("South column:", mat[, "South"], "\n")

# 3. Use vectors in both dimensions
cat("\nQ1 & Q3, North & West:\n")
print(mat[c("Q1", "Q3"), c("North", "West")])

# 4. Logical matrix subsetting returns a vector of matching values
cat("\nValues > 30:", mat[mat > 30], "\n")

# 5. which.max on a column, then get the row name
cat("Best quarter (Central):", rownames(mat)[which.max(mat[, "Central"])], "\n")
```

**Key concept:** Matrices use `[row, col]` subsetting. A logical matrix applied to `[` returns a flat vector of matching values. Use `which.max()` or `which.min()` to find positions of extremes.

</details>

### Exercise 9: Subsetting with NA Gotchas

Handle `NA` values that break logical subsetting — a common source of bugs.

```r
# Exercise 9: NA in subsetting
readings <- c(23.1, NA, 19.8, NA, 25.6, 21.0, NA, 22.4)

# 1. What happens when you run: readings[readings > 20]? Why?
# 2. Extract only non-NA values above 20
# 3. Replace all NA values with the mean of non-NA values

df <- data.frame(
  city = c("A", "B", "C", "D", "E"),
  temp = c(30, NA, 25, NA, 28),
  rain = c(NA, 12, 8, NA, 5),
  stringsAsFactors = FALSE
)

# 4. Extract rows where temp is NOT NA
# 5. Extract rows where BOTH temp and rain are non-NA

```

<details>
<summary>Click to reveal solution</summary>

```r
readings <- c(23.1, NA, 19.8, NA, 25.6, 21.0, NA, 22.4)

# 1. NA comparisons produce NA, which [ treats as a missing row
cat("readings[readings > 20]:", readings[readings > 20], "\n")
# Returns: 23.1 NA NA 25.6 21.0 NA 22.4
# The NAs propagate because NA > 20 is NA (not TRUE or FALSE)

# 2. Use which() to drop NAs, or combine conditions with !is.na()
cat("\nSafe filter (which):", readings[which(readings > 20)], "\n")
cat("Safe filter (& !is.na):", readings[!is.na(readings) & readings > 20], "\n")

# 3. Replace NAs
readings[is.na(readings)] <- mean(readings, na.rm = TRUE)
cat("After fill:", round(readings, 1), "\n")

# Data frame version
df <- data.frame(
  city = c("A", "B", "C", "D", "E"),
  temp = c(30, NA, 25, NA, 28),
  rain = c(NA, 12, 8, NA, 5),
  stringsAsFactors = FALSE
)

# 4. Filter non-NA rows for one column
cat("\nRows with temp:\n")
print(df[!is.na(df$temp), ])

# 5. complete.cases() checks ALL columns, or combine manually
cat("\nRows with both temp and rain:\n")
print(df[!is.na(df$temp) & !is.na(df$rain), ])
# Or equivalently:
# df[complete.cases(df[, c("temp", "rain")]), ]
```

**Key concept:** `NA` propagates through comparisons — `NA > 20` is `NA`, not `FALSE`. Use `which()` or add `!is.na()` to your conditions when subsetting data that might contain missing values.

</details>

### Exercise 10: Putting It All Together

A real-world scenario that requires combining multiple subsetting techniques.

```r
# Exercise 10: Real-world challenge
# A survey stores results as a nested list. Extract, clean, and summarize.

survey <- list(
  metadata = list(title = "R User Survey", year = 2026, n = 8),
  responses = list(
    list(id = 1, name = "Alice", years_r = 5, rating = 9, tools = c("ggplot2", "dplyr", "shiny")),
    list(id = 2, name = "Bob", years_r = 2, rating = 7, tools = c("ggplot2", "tidyr")),
    list(id = 3, name = "Carol", years_r = NA, rating = 8, tools = c("data.table", "ggplot2")),
    list(id = 4, name = "David", years_r = 10, rating = NA, tools = c("base", "lattice")),
    list(id = 5, name = "Eve", years_r = 3, rating = 9, tools = c("dplyr", "purrr", "ggplot2", "shiny")),
    list(id = 6, name = "Frank", years_r = 1, rating = 6, tools = c("ggplot2")),
    list(id = 7, name = "Grace", years_r = 7, rating = 10, tools = c("ggplot2", "data.table", "shiny")),
    list(id = 8, name = "Hank", years_r = 4, rating = 8, tools = c("dplyr", "stringr"))
  )
)

# 1. Extract all respondent names as a character vector
# 2. Build a data frame with columns: name, years_r, rating
# 3. Find the average rating (ignoring NAs)
# 4. Which respondent uses the most tools?
# 5. How many respondents use "ggplot2"?
# 6. Extract names of respondents with 5+ years experience AND rating >= 9

```

<details>
<summary>Click to reveal solution</summary>

```r
survey <- list(
  metadata = list(title = "R User Survey", year = 2026, n = 8),
  responses = list(
    list(id = 1, name = "Alice", years_r = 5, rating = 9, tools = c("ggplot2", "dplyr", "shiny")),
    list(id = 2, name = "Bob", years_r = 2, rating = 7, tools = c("ggplot2", "tidyr")),
    list(id = 3, name = "Carol", years_r = NA, rating = 8, tools = c("data.table", "ggplot2")),
    list(id = 4, name = "David", years_r = 10, rating = NA, tools = c("base", "lattice")),
    list(id = 5, name = "Eve", years_r = 3, rating = 9, tools = c("dplyr", "purrr", "ggplot2", "shiny")),
    list(id = 6, name = "Frank", years_r = 1, rating = 6, tools = c("ggplot2")),
    list(id = 7, name = "Grace", years_r = 7, rating = 10, tools = c("ggplot2", "data.table", "shiny")),
    list(id = 8, name = "Hank", years_r = 4, rating = 8, tools = c("dplyr", "stringr"))
  )
)

resp <- survey$responses

# 1. sapply extracts one field from each list element
names_vec <- sapply(resp, function(r) r$name)
cat("Names:", names_vec, "\n")

# 2. Build data frame from list
df <- data.frame(
  name = sapply(resp, `[[`, "name"),
  years_r = sapply(resp, `[[`, "years_r"),
  rating = sapply(resp, `[[`, "rating"),
  stringsAsFactors = FALSE
)
cat("\nSurvey data frame:\n"); print(df)

# 3. Mean rating, handling NAs
cat("\nAvg rating:", round(mean(df$rating, na.rm = TRUE), 1), "\n")

# 4. Most tools — get lengths, then find the max
tool_counts <- sapply(resp, function(r) length(r$tools))
most_tools_idx <- which.max(tool_counts)
cat("Most tools:", resp[[most_tools_idx]]$name,
    "(", tool_counts[most_tools_idx], "tools )\n")

# 5. Count ggplot2 users
uses_ggplot <- sapply(resp, function(r) "ggplot2" %in% r$tools)
cat("ggplot2 users:", sum(uses_ggplot), "\n")

# 6. Combine conditions on the data frame (watch for NAs!)
experienced <- which(!is.na(df$years_r) & df$years_r >= 5 &
                     !is.na(df$rating) & df$rating >= 9)
cat("5+ yrs & rating >= 9:", df$name[experienced], "\n")
```

**Key concept:** Real data often lives in nested lists. The pattern `sapply(list, function(x) x$field)` extracts a field from every element. Always guard against `NA` when combining conditions.

</details>

## Summary

| Concept | What to Remember |
|---------|-----------------|
| `x[i]` | Returns same type as input. Use for subsetting vectors, lists, data frames |
| `x[[i]]` | Extracts a single element. Works on lists and data frames only |
| `x$name` | Shorthand for `x[["name"]]`. Partial matches — be careful |
| Logical subsetting | `x[condition]` filters elements where condition is TRUE |
| NA propagation | `NA > 5` is `NA`. Use `which()` or `!is.na()` for safe filtering |
| Assignment subsetting | `x[condition] <- value` modifies elements in place |
| Nested extraction | Chain `[[` or `$` to drill into nested lists |
| Matrix subsetting | `mat[rows, cols]` — leave blank for "all" |

## FAQ

### What is the difference between `[` and `[[` in R?

`[` returns a subset of the same type — subsetting a list with `[` gives you a smaller list. `[[` extracts a single element from its container — using `[[` on a list gives you the actual object stored inside, not a list wrapping it.

### When should I use `$` vs `[[`?

Use `$` for interactive work when you know the exact name. Use `[[` in functions and scripts because it works with variables (`key <- "col"; df[[key]]`) and does exact matching. The `$` operator does partial matching, which can cause subtle bugs.

### Why does logical subsetting return NA values?

When a logical index contains `NA`, R doesn't know whether to include or exclude that position, so it returns `NA`. This happens because comparisons with `NA` produce `NA`, not `FALSE`. Wrap your condition in `which()` or add `!is.na()` to avoid this.

### Can I use negative indices with character subsetting?

No. Negative indexing only works with numeric indices (`x[-1]` removes the first element). To exclude by name, use `x[!names(x) %in% c("a", "b")]` or the `setdiff()` function.

### How do I subset a data frame by both rows and columns?

Use `df[rows, cols]` where `rows` and `cols` can be integers, names, or logical vectors. For example, `df[df$age > 30, c("name", "score")]` gets the name and score of people over 30.

## What's Next?

- [R Vectors](/R-Vectors.html) — the parent tutorial covering everything about vectors and subsetting
- [R Lists and Data Frames](/R-Lists-and-Data-Frames.html) — deep dive into list and data frame structures
- [R Control Flow](/R-Control-Flow.html) — if/else, for loops, and when to use vectorized subsetting instead
