---
title: "purrr Exercises: 10 Functional Programming Practice Problems"
slug: "purrr-Exercises"
description: "10 purrr exercises: map, map2, imap, pmap, safely, possibly, reduce, and list manipulation. Interactive solutions for functional data wrangling."
keywords: "purrr exercises, map exercises R, functional programming practice, purrr practice problems"
mathjax: false
webr: true
date: "2026-03-30"
curriculum_id: "E2.8"
post_type: "EX"
sidebar_text: "purrr (10 problems)"
auto_link_terms: "purrr exercises|map exercises"
auto_link_case_sensitive: false
fr_parent: "purrr-map-Functions.html"
---

# purrr Exercises: 10 Functional Programming Practice Problems

<p class="lead">10 exercises on purrr: <code>map()</code>, <code>map2()</code>, <code>imap()</code>, <code>pmap()</code>, <code>safely()</code>, <code>reduce()</code>, and list manipulation. Interactive solutions.</p>

### Exercise 1: map_dbl Basics
Extract the mean of each list element.

```r
library(purrr)
data <- list(a = c(1,2,3), b = c(10,20), c = c(100,200,300,400))

```

<details><summary>Click to reveal solution</summary>

```r
library(purrr)
data <- list(a = c(1,2,3), b = c(10,20), c = c(100,200,300,400))
map_dbl(data, mean)
```
</details>

### Exercise 2: map_chr Extraction
Extract the "name" field from each list element.

```r
library(purrr)
people <- list(list(name="Alice",age=30), list(name="Bob",age=25), list(name="Carol",age=35))

```

<details><summary>Click to reveal solution</summary>

```r
library(purrr)
people <- list(list(name="Alice",age=30), list(name="Bob",age=25), list(name="Carol",age=35))
map_chr(people, "name")
```
</details>

### Exercise 3: map2 Pairing
Combine first and last names.

```r
library(purrr)
first <- c("Alice","Bob","Carol")
last <- c("Smith","Jones","Lee")

```

<details><summary>Click to reveal solution</summary>

```r
library(purrr)
first <- c("Alice","Bob","Carol")
last <- c("Smith","Jones","Lee")
map2_chr(first, last, ~ paste(.x, .y))
```
</details>

### Exercise 4: imap with Names
Create labeled output like "a: 2" from a named vector.

```r
library(purrr)
scores <- c(math = 92, english = 88, science = 95)

```

<details><summary>Click to reveal solution</summary>

```r
library(purrr)
scores <- c(math = 92, english = 88, science = 95)
imap_chr(scores, ~ paste0(.y, ": ", .x))
```
</details>

### Exercise 5: safely for Error Handling
Parse a list of strings to numbers, capturing errors.

```r
library(purrr)
inputs <- list("42", "abc", "3.14", "xyz", "100")

```

<details><summary>Click to reveal solution</summary>

```r
library(purrr)
inputs <- list("42", "abc", "3.14", "xyz", "100")
safe_parse <- safely(~ as.numeric(.x))
results <- map(inputs, safe_parse)
successes <- map_dbl(keep(results, ~ is.null(.x$error)), "result")
cat("Parsed:", successes, "\n")
```
</details>

### Exercise 6: possibly with Default
Convert strings to numbers with NA for failures.

```r
library(purrr)
vals <- c("1", "two", "3", "four", "5")

```

<details><summary>Click to reveal solution</summary>

```r
library(purrr)
vals <- c("1", "two", "3", "four", "5")
maybe_num <- possibly(as.numeric, otherwise = NA)
map_dbl(vals, maybe_num)
```
</details>

### Exercise 7: reduce to Merge
Merge 3 data frames by id using reduce.

```r
library(purrr)
df1 <- data.frame(id=1:3, x=c(10,20,30))
df2 <- data.frame(id=2:4, y=c("a","b","c"))
df3 <- data.frame(id=1:3, z=c(TRUE,FALSE,TRUE))

```

<details><summary>Click to reveal solution</summary>

```r
library(purrr)
df1 <- data.frame(id=1:3, x=c(10,20,30))
df2 <- data.frame(id=2:4, y=c("a","b","c"))
df3 <- data.frame(id=1:3, z=c(TRUE,FALSE,TRUE))
reduce(list(df1, df2, df3), merge, by = "id", all = TRUE)
```
</details>

### Exercise 8: pmap with Data Frame
Generate random samples from each row's parameters.

```r
library(purrr)
params <- data.frame(n=c(3,3,3), mean=c(0,10,100), sd=c(1,5,20))

```

<details><summary>Click to reveal solution</summary>

```r
library(purrr)
params <- data.frame(n=c(3,3,3), mean=c(0,10,100), sd=c(1,5,20))
set.seed(42)
pmap(params, function(n, mean, sd) round(rnorm(n, mean, sd), 1))
```
</details>

### Exercise 9: keep and discard
From a list of numbers, keep positives and discard NAs.

```r
library(purrr)
data <- list(5, -3, NA, 8, -1, NA, 12, 0)

```

<details><summary>Click to reveal solution</summary>

```r
library(purrr)
data <- list(5, -3, NA, 8, -1, NA, 12, 0)
data |> discard(is.na) |> keep(~ .x > 0)
```
</details>

### Exercise 10: walk for Side Effects
Print a formatted report for each list element.

```r
library(purrr)
results <- list(model_a = 0.85, model_b = 0.91, model_c = 0.78)

```

<details><summary>Click to reveal solution</summary>

```r
library(purrr)
results <- list(model_a = 0.85, model_b = 0.91, model_c = 0.78)
iwalk(results, ~ cat(sprintf("%-10s R² = %.2f %s\n", .y, .x, if(.x > 0.8) "✓" else "✗")))
```
</details>

## What's Next?

- [purrr map for Data Wrangling](/purrr-map-Functions.html) — applied purrr examples
- [purrr map Variants](/purrr-map-Variants.html) — complete reference
