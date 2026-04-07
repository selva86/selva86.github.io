---
title: "R Programming Interview Questions: 50 Questions & Answers for All Levels"
slug: "R-Interview-Questions"
description: "50 R programming interview questions with detailed answers for junior, mid, and senior roles. Covers data types, dplyr, ggplot2, statistics, and system design."
keywords: "R interview questions, R programming interview, R data science interview, R technical interview, R job interview, R coding questions"
mathjax: false
webr: false
date: "2026-03-29"
curriculum_id: "CAR1"
post_type: "C"
auto_link_terms: "R interview questions|R programming interview|R coding interview"
auto_link_case_sensitive: false
fr_parent: "Is-R-Worth-Learning-in-2026.html"
sidebar_section: "Learn R"
sidebar_title: "R Interview Questions"
---

# R Programming Interview Questions: 50 Questions & Answers for All Levels

<p class="lead">Preparing for an R programming interview? This guide covers 50 questions organized by difficulty -- from basic syntax for entry-level roles to system design for senior positions. Each answer includes the reasoning interviewers are looking for and code examples to practice.</p>

These questions come from real interviews at pharmaceutical companies, biotech firms, research institutions, and tech companies. R interviews focus more on statistical thinking and data manipulation than algorithm puzzles.

## Junior Level (Questions 1-20)

### Q1: What are the basic data types in R?

R has six atomic types: **numeric** (double), **integer**, **character**, **logical**, **complex**, and **raw**.

```r
x <- 3.14       # numeric (double)
n <- 42L         # integer (note the L suffix)
s <- "hello"     # character
b <- TRUE        # logical
z <- 2 + 3i     # complex
r <- charToRaw("A")  # raw
```

**Follow-up interviewers like:** "What happens if you combine different types in a vector?" Answer: R coerces to the most general type. `c(1, "two", TRUE)` becomes all character.

### Q2: What is the difference between a list and a vector?

**Vectors** hold elements of the same type. **Lists** hold elements of any type, including other lists. Data frames are a special type of list where each element is a vector of the same length.

```r
vec <- c(1, 2, 3)          # Numeric vector
lst <- list(1, "two", TRUE) # List with mixed types
df <- data.frame(x = 1:3, y = c("a", "b", "c"))  # List of equal-length vectors
```

### Q3: Explain the difference between `<-` and `=` for assignment.

Both work for top-level assignment. The convention is `<-` for assignment and `=` for function arguments. Inside function calls, `=` sets named arguments while `<-` performs assignment in the calling environment (which can cause bugs).

### Q4: How do you handle missing values (NA)?

```r
x <- c(1, NA, 3, NA, 5)
is.na(x)                 # Check: FALSE TRUE FALSE TRUE FALSE
mean(x, na.rm = TRUE)    # Exclude NAs in calculations: 3
x[!is.na(x)]            # Filter out NAs: 1 3 5
tidyr::replace_na(x, 0) # Replace NAs: 1 0 3 0 5
```

### Q5: What is a factor? When would you use one?

A factor is R's representation of categorical data with a defined set of levels. Use factors for categorical variables in statistical models (R automatically creates dummy variables), ordered categories, and controlled value sets.

```r
sizes <- factor(c("S", "M", "L", "M"), levels = c("S", "M", "L"), ordered = TRUE)
levels(sizes)  # "S" "M" "L"
```

### Q6: How do you read data from a CSV file?

```r
# Base R (adequate)
df <- read.csv("file.csv")

# readr (faster, better defaults, returns tibble)
df <- readr::read_csv("file.csv")

# data.table (fastest for large files)
dt <- data.table::fread("file.csv")
```

### Q7: What does the pipe operator do?

The pipe (`|>` in base R 4.1+, `%>%` from magrittr) passes the left-hand result as the first argument to the right-hand function. It makes code readable by eliminating nested function calls.

```r
# Without pipe (read inside-out):
round(mean(subset(mtcars, cyl == 6)$mpg), 2)

# With pipe (read left-to-right):
mtcars |> subset(cyl == 6) |> (\(d) mean(d$mpg))() |> round(2)
```

### Q8-Q15: Core Data Manipulation

**Q8: How do you filter rows in dplyr?** `filter(df, condition)` -- e.g., `filter(mtcars, mpg > 25, cyl == 4)`.

**Q9: How do you create new columns?** `mutate(df, new_col = expression)` -- e.g., `mutate(mtcars, kpl = mpg * 0.425)`.

**Q10: How do you summarize data by groups?**
```r
mtcars |>
  group_by(cyl) |>
  summarise(avg_mpg = mean(mpg), n = n())
```

**Q11: What is the difference between `select()` and `filter()`?** `select()` chooses columns; `filter()` chooses rows.

**Q12: How do you join two data frames?** `left_join(df1, df2, by = "key")`. Also: `inner_join`, `right_join`, `full_join`, `anti_join`, `semi_join`.

**Q13: How do you reshape data between wide and long?** `tidyr::pivot_longer()` (wide to long) and `tidyr::pivot_wider()` (long to wide).

**Q14: What does `str()` do?** Displays the internal structure of an R object: types, dimensions, and sample values. Essential for debugging.

**Q15: What is the difference between `==` and `identical()`?** `==` is vectorized (element-wise comparison, returns a logical vector). `identical()` tests whether two objects are exactly the same (returns a single TRUE/FALSE).

### Q16-Q20: Basic Statistics

**Q16: How do you run a t-test?**
```r
t.test(mpg ~ am, data = mtcars)  # Independent samples
t.test(before, after, paired = TRUE)  # Paired samples
```

**Q17: How do you fit a linear regression?**
```r
model <- lm(mpg ~ wt + hp + cyl, data = mtcars)
summary(model)  # Coefficients, R-squared, p-values, F-statistic
```

**Q18: What assumptions does linear regression make?** Linearity, independence of errors, homoscedasticity, normality of residuals, no perfect multicollinearity. Check with `plot(model)` and `car::vif(model)`.

**Q19: How do you split data into train and test sets?**
```r
set.seed(42)
idx <- sample(nrow(mtcars), 0.8 * nrow(mtcars))
train <- mtcars[idx, ]
test <- mtcars[-idx, ]
```

**Q20: What is the difference between `lm()` and `glm()`?** `lm()` fits linear models (continuous outcome). `glm()` fits generalized linear models by specifying a `family`: `binomial` for logistic regression, `poisson` for count data, etc.

## Mid Level (Questions 21-35)

### Q21: Explain the apply family. When would you use each?

| Function | Input | Output | Use Case |
|----------|-------|--------|----------|
| `sapply()` | List/vector | Vector/matrix | Quick simplification |
| `lapply()` | List/vector | List | When you need a list back |
| `vapply()` | List/vector | Specified type | Safe programming (type-stable) |
| `apply()` | Matrix/array | Vector/matrix | Row/column operations |
| `tapply()` | Vector + groups | Array | Group-wise summaries |

**Modern alternative:** `purrr::map()` and variants (`map_dbl`, `map_chr`, `map_dfr`) provide consistent types and better error messages.

### Q22: What is copy-on-modify?

When you assign an object to a new name, R doesn't copy the data -- it creates a new reference to the same memory. A copy is only made when you modify one of the references.

```r
x <- 1:1e6
y <- x        # No copy -- y points to same data
y[1] <- 0L    # NOW R copies the data for y
```

This is why modifying large objects in loops can be slow -- each modification triggers a copy.

### Q23: How does non-standard evaluation (NSE) work in dplyr?

dplyr uses **tidy evaluation** (from the rlang package). Functions like `filter()` and `mutate()` capture column names as unevaluated expressions, then evaluate them in the context of the data frame.

To write functions that use dplyr, you need the embrace operator `{{ }}`:

```r
# Wrong: this won't work
# my_summary <- function(data, col) {
#   data |> summarise(mean = mean(col))
# }

# Right: use {{ }} to embrace the argument
my_summary <- function(data, col) {
  data |> summarise(mean = mean({{ col }}))
}
my_summary(mtcars, mpg)
```

### Q24: How do you handle errors gracefully in R?

```r
# tryCatch for structured error handling
result <- tryCatch({
  log(-1)  # produces NaN with warning
  log("text")  # produces error
}, warning = function(w) {
  message("Warning: ", w$message)
  NA
}, error = function(e) {
  message("Error: ", e$message)
  NA
})

# purrr::safely for functional error handling
safe_log <- purrr::safely(log)
safe_log("text")  # Returns list(result = NULL, error = <error>)
```

### Q25-Q30: Applied Skills

**Q25: How do you create a ggplot2 visualization?**
```r
ggplot(mtcars, aes(x = wt, y = mpg, color = factor(cyl))) +
  geom_point() +
  geom_smooth(method = "lm") +
  theme_minimal()
```
Explain: `aes()` maps data to aesthetics, `geom_*()` adds layers, `+` composes them.

**Q26: What is tidy data?** Each variable is a column, each observation is a row, each observational unit is a table (Wickham, 2014). Most tidyverse functions expect tidy data.

**Q27: How do you handle dates in R?** Use `lubridate`: `ymd("2026-03-29")` parses dates; `year()`, `month()`, `day()` extract components; dates support arithmetic.

**Q28: What is the difference between `data.frame` and `tibble`?** Tibbles never convert strings to factors, print concisely, don't partial-match column names, and always return a tibble when subset with `[`.

**Q29: How do you connect R to a database?** Use the DBI package with a driver (`RPostgres`, `RSQLite`, `odbc`). `dbplyr` lets you write dplyr code that generates SQL automatically.

**Q30: What is cross-validation?**
```r
library(rsample)
folds <- vfold_cv(mtcars, v = 10)
# Then use tidymodels::fit_resamples() to evaluate models across folds
```

### Q31-Q35: Advanced Applied

**Q31: Explain the difference between `sapply()` and `vapply()`.** `sapply` guesses the output type (dangerous in functions -- can return unexpected types). `vapply` requires you to specify the output type, making it safe for programming.

**Q32: How do you profile R code?** Use `system.time()` for quick timing, `bench::mark()` for accurate benchmarks, and `profvis::profvis()` to find bottlenecks visually.

**Q33: When would you use `data.table` instead of dplyr?** When performance matters: data.table is 2-10x faster than dplyr for large datasets. Also useful for memory-constrained environments (data.table modifies in place).

**Q34: How do you write a function with default arguments?**
```r
greet <- function(name, greeting = "Hello") {
  paste(greeting, name)
}
greet("Alice")            # "Hello Alice"
greet("Alice", "Hi")      # "Hi Alice"
```

**Q35: What is an environment in R?** A collection of name-value bindings with a parent environment. They form a chain (the search path) that R traverses to find variables. Understanding environments is key to understanding scoping, closures, and package namespaces.

## Senior Level (Questions 36-50)

### Q36: How do you design a reproducible analysis project?

Structure: `data-raw/` (immutable raw data), `R/` (functions), `analysis/` (numbered scripts), `output/` (results), `renv.lock` (package versions). Use `renv` for package management, Git for version control, and `targets` or `drake` for pipeline management.

### Q37-Q42: Architecture and Design

**Q37: How do you create an R package?** `usethis::create_package()`, add functions in `R/`, document with roxygen2 (`@param`, `@return`, `@export`), test with testthat, check with `devtools::check()`.

**Q38: What is metaprogramming in R?** Treating R code as data. Includes quoting (`rlang::expr()`), unquoting (`!!`), and modifying expressions programmatically. It's how tidyverse NSE works.

**Q39: Explain R's OOP systems.** S3 (informal, duck-typing), S4 (formal, with validation and multiple dispatch), R6 (reference semantics, mutable objects). Most packages use S3 for simplicity.

**Q40: How do you deploy R code to production?** Options: `plumber` (REST APIs), `vetiver` (model versioning), Shiny (interactive apps), Docker (containerized R), or scheduled R scripts with cron/GitHub Actions.

**Q41: How do you handle datasets that don't fit in memory?** `arrow` (Parquet files, lazy queries), `duckdb` (SQL on files), `dbplyr` (databases), `data.table` (memory-efficient), `sparklyr` (Spark clusters).

**Q42: What is lazy evaluation?** R function arguments are not evaluated until used. This enables NSE but can cause bugs when closures capture unevaluated promises. Use `force()` to evaluate eagerly when needed.

### Q43-Q50: Expert-Level

**Q43: Explain R's copy-on-modify optimization and reference counting.** R uses reference counting (refcnt) to track how many names point to an object. When refcnt > 1 and you modify, R copies. When refcnt == 1, R can modify in place (an optimization added in R 3.1+).

**Q44: How would you optimize a slow R function?** Profile first (`profvis`). Then: vectorize, avoid growing objects, use data.table for data manipulation, use Rcpp for loop-heavy code, parallelize with `future`/`furrr`.

**Q45: Design a clinical trial reporting pipeline in R.** Data ingestion (`haven` for SAS), validation (`pointblank`), ADaM creation (`admiral`), analysis (`survival`, `lme4`), tables (`rtables`), figures (`ggplot2`), reports (`Quarto`), reproducibility (`renv`, Docker).

**Q46: How does R's garbage collector work?** R uses a generational garbage collector with 3 generations. Young objects are collected frequently (cheap), old objects less often. `gc()` forces collection. Memory issues usually stem from unnecessary copies, not GC performance.

**Q47: Explain the search path and how R resolves function names.** R searches environments in order: global -> package namespaces (in reverse attachment order) -> base. `search()` shows the path. `::` (e.g., `dplyr::filter`) bypasses the search path for explicit resolution.

**Q48: How would you build a Shiny app for 100+ concurrent users?** Use `golem` for production structure, cache expensive computations, use `promises`/`future` for async, deploy on Posit Connect with load balancing, or containerize with Docker/Kubernetes.

**Q49: What is the difference between `Reduce()` and `purrr::reduce()`?** Functionally similar (both fold a list with a binary function). `purrr::reduce()` has a cleaner API, supports `.init`, and provides `.dir` for right folds.

**Q50: How do you ensure R package quality for a CRAN submission?** `R CMD check` with zero errors/warnings/notes, thorough testthat tests (>80% coverage), complete roxygen2 documentation, a vignette, and adherence to CRAN policies (no internet access in tests, no writing outside tempdir).

## Interview Preparation Summary

| Area | What to Review |
|------|---------------|
| Data manipulation | dplyr verbs, joins, reshaping, data.table basics |
| Visualization | ggplot2 grammar, aesthetics, geoms, faceting, themes |
| Statistics | Regression, hypothesis tests, assumptions, diagnostics |
| Programming | Functions, environments, error handling, apply/map |
| Reproducibility | renv, R Markdown, Git, project structure |
| Communication | Explain your analysis clearly; interviewers value this |

## FAQ

**Q: Are R interviews more about statistics or coding?**
A: Both, but R interviews lean more toward statistics than Python interviews do. Expect questions about regression assumptions, choosing the right test, and interpreting output -- not LeetCode-style algorithm problems.

**Q: Should I use base R or tidyverse in interview code?**
A: Use whichever you're faster and more confident with. If the company uses tidyverse (most modern R teams do), prefer that. Always be prepared to explain your choices.

**Q: How important is it to know both R and Python?**
A: Depends on the role. Pharma biostatistician roles may only need R. Data scientist roles at tech companies often expect both. Ask the recruiter about the team's primary language.

## What's Next

- [R Data Scientist Career](/R-Data-Scientist-Career.html) -- Career paths, salaries, and required skills
- [R Resume Skills](/R-Resume-Skills.html) -- What to list and how to prove your R expertise
- [How to Learn R](/How-to-Learn-R.html) -- 12-month structured roadmap
