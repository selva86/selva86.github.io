---
title: "R Lists Exercises: 10 Practice Problems with Full Solutions"
slug: "R-Lists-Exercises"
description: "10 R list exercises: create, access with $ and [[]], modify, nest, iterate with lapply/sapply, and extract model results. Interactive solutions."
keywords: "R list exercises, R list practice problems, R list access, R lapply exercises, R nested list"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "E1.4"
post_type: "EX"
auto_link_terms: "R list exercises|R list practice problems"
auto_link_case_sensitive: false
fr_parent: "R-Lists.html"
---

# R Lists Exercises: 10 Practice Problems with Full Solutions

<p class="lead">Practice R lists with 10 exercises covering creation, access (<code>$</code> vs <code>[[]]</code> vs <code>[]</code>), modification, nested lists, <code>lapply</code>/<code>sapply</code>, and extracting model results. Each problem has interactive code and a solution.</p>

Lists are R's most flexible structure. These exercises test your understanding of how they differ from vectors and data frames, how to navigate nested structures, and how to iterate over list elements.

## Easy (1-4): Create and Access

### Exercise 1: Build a Student Record

Create a list representing a student: name, age, courses (a character vector of 3 courses), grades (a named numeric vector), and graduated (logical). Print the student's name and their Math grade.

```r
# Exercise 1: Student record as a list

```

<details>
<summary>Click to reveal solution</summary>

```r
student <- list(
  name = "Alice Chen",
  age = 21,
  courses = c("Math", "Statistics", "Computer Science"),
  grades = c(Math = 92, Statistics = 88, CS = 95),
  graduated = FALSE
)

cat("Name:", student$name, "\n")
cat("Math grade:", student$grades["Math"], "\n")
cat("Courses:", student$courses, "\n")
str(student)
```

</details>

### Exercise 2: [] vs [[]] vs $

Given a list, extract the `scores` element three ways and show what type each returns. Then demonstrate why `[]` fails with `mean()` but `[[]]` works.

```r
# Exercise 2: Show the difference between [], [[]], and $
data <- list(scores = c(88, 92, 75, 95), name = "Test Results")

# Extract scores using all three methods
# Show the type of each result
# Demonstrate: mean works with [[]] but not []

```

<details>
<summary>Click to reveal solution</summary>

```r
data <- list(scores = c(88, 92, 75, 95), name = "Test Results")

# Three extraction methods
with_single <- data["scores"]     # Returns a LIST
with_double <- data[["scores"]]   # Returns the VECTOR
with_dollar <- data$scores         # Returns the VECTOR

cat("data['scores'] type:", class(with_single), "\n")
cat("data[['scores']] type:", class(with_double), "\n")
cat("data$scores type:", class(with_dollar), "\n\n")

# mean works with [[ ]] and $ but not [ ]
cat("mean(data[['scores']]):", mean(with_double), "\n")
cat("mean(data$scores):", mean(with_dollar), "\n")

# This would fail:
tryCatch(
  mean(data["scores"]),
  warning = function(w) cat("mean(data['scores']) WARNING:", w$message, "\n")
)
```

**Key concept:** `[]` returns a sub-list. `[[]]` and `$` return the element itself. You can't compute `mean()` on a list — you need the vector inside.

</details>

### Exercise 3: Add and Remove Elements

Start with `config <- list(host = "localhost", port = 8080)`. Add a `database` element, change `port` to 5432, and remove `host`. Show the list after each step.

```r
# Exercise 3: Modify a list step by step
config <- list(host = "localhost", port = 8080)

```

<details>
<summary>Click to reveal solution</summary>

```r
config <- list(host = "localhost", port = 8080)
cat("Start:", str(config))

# Add database
config$database <- "production"
cat("\nAfter adding database:\n"); str(config)

# Change port
config$port <- 5432
cat("After changing port:\n"); str(config)

# Remove host
config$host <- NULL
cat("After removing host:\n"); str(config)
```

**Key concept:** `$name <- value` adds or modifies. `$name <- NULL` removes. Lists grow and shrink dynamically.

</details>

### Exercise 4: Nested List Access

Navigate this nested list to extract specific values.

```r
# Exercise 4: Navigate nested lists
company <- list(
  name = "TechCorp",
  departments = list(
    engineering = list(head = "Alice", size = 50, budget = 2000000),
    marketing = list(head = "Bob", size = 20, budget = 500000),
    sales = list(head = "Carol", size = 30, budget = 800000)
  ),
  founded = 2015
)

# Extract:
# 1. The engineering department head
# 2. The marketing budget
# 3. The total headcount (sum of all department sizes)
# 4. All department heads as a vector

```

<details>
<summary>Click to reveal solution</summary>

```r
company <- list(
  name = "TechCorp",
  departments = list(
    engineering = list(head = "Alice", size = 50, budget = 2000000),
    marketing = list(head = "Bob", size = 20, budget = 500000),
    sales = list(head = "Carol", size = 30, budget = 800000)
  ),
  founded = 2015
)

# 1. Engineering head
cat("Eng head:", company$departments$engineering$head, "\n")

# 2. Marketing budget
cat("Marketing budget:", company$departments$marketing$budget, "\n")

# 3. Total headcount
total <- sapply(company$departments, function(d) d$size)
cat("Department sizes:", total, "\n")
cat("Total headcount:", sum(total), "\n")

# 4. All department heads
heads <- sapply(company$departments, function(d) d$head)
cat("Department heads:", heads, "\n")
```

**Key concept:** Chain `$` to drill into nested lists. `sapply()` iterates over list elements and simplifies the result to a vector.

</details>

## Medium (5-7): Iteration

### Exercise 5: lapply vs sapply

Given a list of numeric vectors (different lengths), compute the mean of each using lapply and sapply. Show how the results differ.

```r
# Exercise 5: lapply vs sapply
datasets <- list(
  exam1 = c(88, 72, 95, 61, 83),
  exam2 = c(90, 85, 78, 92),
  exam3 = c(67, 73, 81, 77, 88, 92, 65)
)

# Compute means using both lapply and sapply
# Show the type and structure of each result

```

<details>
<summary>Click to reveal solution</summary>

```r
datasets <- list(
  exam1 = c(88, 72, 95, 61, 83),
  exam2 = c(90, 85, 78, 92),
  exam3 = c(67, 73, 81, 77, 88, 92, 65)
)

# lapply returns a LIST
means_list <- lapply(datasets, mean)
cat("lapply result type:", class(means_list), "\n")
str(means_list)

# sapply returns a VECTOR (when possible)
means_vec <- sapply(datasets, mean)
cat("\nsapply result type:", class(means_vec), "\n")
cat("Values:", means_vec, "\n")

# sapply with a function that returns multiple values → matrix
stats <- sapply(datasets, function(x) c(mean = mean(x), sd = round(sd(x), 1), n = length(x)))
cat("\nMultiple values → matrix:\n")
print(stats)
```

**Key concept:** `lapply()` always returns a list (predictable). `sapply()` simplifies: single values → vector, multiple values → matrix. Use `lapply()` in functions for safety.

</details>

### Exercise 6: Build a List in a Loop

Run 5 simulations, each generating 100 random numbers with a different mean (10, 20, 30, 40, 50). Store each result in a named list, then summarize.

```r
# Exercise 6: Simulation results in a list
# 5 simulations, different means, store in a list

```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(42)
results <- list()

for (i in 1:5) {
  sim_mean <- i * 10
  data <- rnorm(100, mean = sim_mean, sd = 5)
  results[[paste0("sim_", i)]] <- list(
    target_mean = sim_mean,
    actual_mean = round(mean(data), 2),
    sd = round(sd(data), 2),
    data = data
  )
}

# Summarize
cat("Simulation results:\n")
for (name in names(results)) {
  r <- results[[name]]
  cat(sprintf("  %s: target=%d, actual=%.2f, sd=%.2f\n",
    name, r$target_mean, r$actual_mean, r$sd))
}

# Compare target vs actual means
targets <- sapply(results, function(r) r$target_mean)
actuals <- sapply(results, function(r) r$actual_mean)
cat("\nMax deviation:", round(max(abs(targets - actuals)), 2), "\n")
```

**Key concept:** Use `results[[name]] <- value` to add named elements in a loop. Each element can be a complex sub-list.

</details>

### Exercise 7: Transform a List of Data Frames

Given a list of data frames (one per city), add a `city` column to each and combine them into one data frame.

```r
# Exercise 7: Combine list of data frames
city_data <- list(
  NYC = data.frame(month = 1:3, temp = c(32, 35, 45), rain = c(3.5, 3.0, 4.2)),
  LA = data.frame(month = 1:3, temp = c(58, 60, 63), rain = c(3.1, 3.5, 2.4)),
  Chicago = data.frame(month = 1:3, temp = c(25, 29, 40), rain = c(1.8, 1.5, 2.7))
)

# 1. Add a 'city' column to each data frame
# 2. Combine into one data frame
# 3. Find the coldest city in month 1

```

<details>
<summary>Click to reveal solution</summary>

```r
city_data <- list(
  NYC = data.frame(month = 1:3, temp = c(32, 35, 45), rain = c(3.5, 3.0, 4.2)),
  LA = data.frame(month = 1:3, temp = c(58, 60, 63), rain = c(3.1, 3.5, 2.4)),
  Chicago = data.frame(month = 1:3, temp = c(25, 29, 40), rain = c(1.8, 1.5, 2.7))
)

# 1. Add city column using lapply
city_data <- lapply(names(city_data), function(city) {
  df <- city_data[[city]]
  df$city <- city
  df
})

# 2. Combine into one data frame
combined <- do.call(rbind, city_data)
cat("Combined data:\n")
print(combined)

# 3. Coldest city in month 1
month1 <- combined[combined$month == 1, ]
coldest <- month1[which.min(month1$temp), ]
cat("\nColdest in month 1:", coldest$city, "at", coldest$temp, "°F\n")
```

**Key concept:** `lapply()` over `names()` lets you modify each data frame while keeping track of its name. `do.call(rbind, list_of_dfs)` stacks them into one data frame.

</details>

## Hard (8-10): Real-World Patterns

### Exercise 8: Extract Model Results

Fit linear models for each cylinder group in mtcars and extract key results.

```r
# Exercise 8: Model results from a list
# Split mtcars by cyl, fit lm(mpg ~ wt) for each group
# Extract R-squared and wt coefficient from each model

```

<details>
<summary>Click to reveal solution</summary>

```r
# Split data by cylinders
groups <- split(mtcars, mtcars$cyl)
cat("Groups:", names(groups), "\n\n")

# Fit a model for each group
models <- lapply(groups, function(df) lm(mpg ~ wt, data = df))

# Extract results
results <- sapply(names(models), function(name) {
  s <- summary(models[[name]])
  c(n = nrow(groups[[name]]),
    r_squared = round(s$r.squared, 3),
    wt_coef = round(coef(models[[name]])["wt"], 2),
    p_value = round(s$coefficients["wt", "Pr(>|t|)"], 4))
})

cat("Model results by cylinder group:\n")
print(results)
```

**Key concept:** `split()` creates a list of data frames by group. `lapply()` fits a model to each. `sapply()` extracts results into a matrix. This split-apply-combine pattern is fundamental to data analysis.

</details>

### Exercise 9: JSON-like Nested Structure

Parse and analyze a nested list representing API response data.

```r
# Exercise 9: Work with API-style nested data
api_response <- list(
  status = "success",
  data = list(
    users = list(
      list(id = 1, name = "Alice", scores = c(88, 92, 75)),
      list(id = 2, name = "Bob", scores = c(95, 80, 85)),
      list(id = 3, name = "Carol", scores = c(72, 68, 90))
    ),
    total = 3
  )
)

# 1. Extract all user names into a vector
# 2. Calculate each user's average score
# 3. Find the user with the highest average

```

<details>
<summary>Click to reveal solution</summary>

```r
api_response <- list(
  status = "success",
  data = list(
    users = list(
      list(id = 1, name = "Alice", scores = c(88, 92, 75)),
      list(id = 2, name = "Bob", scores = c(95, 80, 85)),
      list(id = 3, name = "Carol", scores = c(72, 68, 90))
    ),
    total = 3
  )
)

users <- api_response$data$users

# 1. All names
names_vec <- sapply(users, function(u) u$name)
cat("Users:", names_vec, "\n")

# 2. Average scores
avg_scores <- sapply(users, function(u) round(mean(u$scores), 1))
names(avg_scores) <- names_vec
cat("Averages:", avg_scores, "\n")

# 3. Highest average
best <- names_vec[which.max(avg_scores)]
cat("Top performer:", best, "with", max(avg_scores), "\n")
```

**Key concept:** API responses and JSON data are naturally represented as nested lists in R. `sapply()` with anonymous functions extracts values from each nested element.

</details>

### Exercise 10: Configuration Manager

Write a function that merges two configuration lists, where the second list overrides values from the first (like merging default + user config).

```r
# Exercise 10: Merge configuration lists
defaults <- list(
  host = "localhost",
  port = 8080,
  debug = FALSE,
  timeout = 30,
  database = list(name = "mydb", pool_size = 5)
)

user_config <- list(
  port = 5432,
  debug = TRUE,
  database = list(name = "production")
)

# Write merge_config(defaults, overrides) that:
# - Keeps all defaults
# - Overrides with user_config values where they exist
# - Result should have: host=localhost, port=5432, debug=TRUE, timeout=30,
#   database=list(name="production", pool_size=5)

```

<details>
<summary>Click to reveal solution</summary>

```r
merge_config <- function(defaults, overrides) {
  result <- defaults
  for (key in names(overrides)) {
    if (is.list(defaults[[key]]) && is.list(overrides[[key]])) {
      # Recursively merge nested lists
      result[[key]] <- merge_config(defaults[[key]], overrides[[key]])
    } else {
      result[[key]] <- overrides[[key]]
    }
  }
  return(result)
}

defaults <- list(
  host = "localhost", port = 8080, debug = FALSE,
  timeout = 30, database = list(name = "mydb", pool_size = 5)
)
user_config <- list(
  port = 5432, debug = TRUE,
  database = list(name = "production")
)

final <- merge_config(defaults, user_config)
cat("Final config:\n")
str(final)

# Verify: database should have BOTH name (overridden) and pool_size (from default)
cat("\nDB name:", final$database$name, "(overridden)\n")
cat("DB pool:", final$database$pool_size, "(from default)\n")
```

**Key concept:** Recursive functions can process nested lists. The function checks if both the default and override values are lists — if so, it merges recursively. Otherwise, the override replaces the default.

</details>

## Summary: Skills Practiced

| Exercises | List Skills |
|-----------|------------|
| 1-4 (Easy) | Create, `$`/`[[]]`/`[]` access, modify, nested access |
| 5-7 (Medium) | `lapply`/`sapply`, loops with lists, `do.call(rbind)` |
| 8-10 (Hard) | Model results, API-like data, recursive merge |

## Continue Learning

More exercise sets:

1. **R Control Flow Exercises** — if/else and loop practice
2. **R Functions Exercises** — write, debug, and optimize
3. **R apply Family Exercises** — master `apply`, `lapply`, `sapply`, `tapply`

Or continue learning: **R Control Flow** tutorial.
