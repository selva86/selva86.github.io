---
title: "R Environments Explained: Global, Local, Package, Execution & Empty"
slug: "R-Environments"
description: "Learn R environments: globalenv, baseenv, emptyenv, parent environments, and how to create and inspect environments with ls(), get(), and exists()."
keywords: "R environments, globalenv, baseenv, emptyenv, R parent environment, R execution environment, R environment hierarchy"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "4.1.4"
post_type: "C"
auto_link_terms: "R environments|globalenv|baseenv|emptyenv|parent environment"
auto_link_case_sensitive: false
---

# R Environments Explained: Global, Local, Package, Execution & Empty

<p class="lead">An environment in R is a bag of names. Every name points to a value, and every environment has a parent. Understanding environments unlocks scoping, closures, namespaces, and debugging — the machinery behind how R finds your variables.</p>

Most R users never think about environments. You type `x <- 5` and `x` exists. You call a function from a package and it just works. But behind every variable lookup, R is walking a chain of environments. Once you see that chain, R's behavior stops being magical and starts being predictable.

## Introduction

An **environment** is a data structure with two parts:

1. **A frame** — a set of name-value bindings (like a named list)
2. **A parent** — a reference to another environment (except `emptyenv()`)

Every time you create a variable, it goes into an environment. Every time R looks up a variable, it searches environments in order. This tutorial covers:

- The four special environments: global, base, empty, package
- How to create environments and add bindings
- The parent chain and search path
- Inspecting environments with `ls()`, `get()`, `exists()`
- Execution environments (created every time a function runs)

## The Global Environment

The **global environment** is your interactive workspace — where variables you create at the console live:

```r
# Your workspace IS the global environment
x <- 42
y <- "hello"

# globalenv() returns it
cat("Global env:", environmentName(globalenv()), "\n")

# .GlobalEnv is an alias
cat("Same thing:", identical(globalenv(), .GlobalEnv), "\n")

# List what's in it
cat("Objects in global env:", paste(ls(globalenv()), collapse = ", "), "\n")
```

When you type `x` at the console, R first looks in the global environment. If it finds `x` there, it returns the value. If not, it looks in the parent of the global environment, and so on.

## The Environment Hierarchy

R environments form a chain through their parents. The search path goes:

**Global env -> Package envs (in order of library() calls) -> Base env -> Empty env**

```r
# Walk the parent chain from the global environment
env <- globalenv()
chain <- character()

while (!identical(env, emptyenv())) {
  chain <- c(chain, environmentName(env))
  env <- parent.env(env)
}
chain <- c(chain, "emptyenv")

cat("Search path:\n")
for (i in seq_along(chain)) {
  cat(sprintf("  %d. %s\n", i, chain[i]))
}
```

The **empty environment** (`emptyenv()`) is the ancestor of all environments. It has no parent and no bindings. It's the end of the search chain.

The **base environment** (`baseenv()`) contains base R functions like `c()`, `mean()`, `print()`. Its parent is the empty environment.

```r
# The three fundamental environments
cat("Global:", environmentName(globalenv()), "\n")
cat("Base:", environmentName(baseenv()), "\n")
cat("Empty:", environmentName(emptyenv()), "\n")

# Base env's parent is the empty env
cat("Base parent is empty:", identical(parent.env(baseenv()), emptyenv()), "\n")

# search() shows the full path as a character vector
cat("\nsearch() path:\n")
print(search())
```

## Creating Environments

You can create new environments with `new.env()`:

```r
# Create a new environment
e <- new.env(parent = emptyenv())

# Add bindings
e$name <- "Alice"
e$age <- 30
e$scores <- c(95, 88, 92)

# List bindings
cat("Bindings in e:", paste(ls(e), collapse = ", "), "\n")
cat("Name:", e$name, "\n")
cat("Age:", e$age, "\n")
cat("Scores:", e$scores, "\n")
```

Environments have **reference semantics** — unlike lists, modifying an environment in a function changes the original:

```r
# Reference semantics: no copy-on-modify
e1 <- new.env(parent = emptyenv())
e1$value <- 10

modify_env <- function(env) {
  env$value <- 999
}

cat("Before:", e1$value, "\n")
modify_env(e1)
cat("After:", e1$value, "\n")  # Changed!

# Compare with a list (copy-on-modify)
lst <- list(value = 10)

modify_list <- function(l) {
  l$value <- 999
  l  # must return it!
}

modify_list(lst)
cat("List after:", lst$value, "\n")  # Unchanged!
```

This is why environments are useful for mutable state — they behave like references, not values.

## Inspecting Environments: ls(), get(), exists()

Three functions let you inspect what's inside an environment:

```r
# Create a populated environment
env <- new.env(parent = emptyenv())
env$x <- 1:10
env$name <- "test"
env$flag <- TRUE

# ls() — list all names
cat("Names:", paste(ls(env), collapse = ", "), "\n")

# ls.str() — list names with structure
ls.str(env)
```

```r
# get() — retrieve a value by name
env <- new.env(parent = emptyenv())
env$pi_approx <- 3.14159

val <- get("pi_approx", envir = env)
cat("Got:", val, "\n")

# exists() — check if a name is bound
cat("pi_approx exists:", exists("pi_approx", envir = env), "\n")
cat("missing exists:", exists("missing", envir = env), "\n")

# inherits = FALSE means "only look in THIS env, not parents"
cat("mean exists here:", exists("mean", envir = env, inherits = FALSE), "\n")
cat("mean exists in chain:", exists("mean", envir = env, inherits = TRUE), "\n")
```

The `inherits` argument is key. By default, `get()` and `exists()` search up the parent chain — just like R's normal variable lookup. Set `inherits = FALSE` to look only in the specified environment.

## Execution Environments

Every time you call a function, R creates a fresh **execution environment** for that call. Local variables live there:

```r
# Each function call gets its own environment
show_env <- function() {
  local_var <- "I'm local"
  cat("Execution env:", format(environment()), "\n")
  cat("Parent:", environmentName(parent.env(environment())), "\n")
  cat("local_var:", local_var, "\n")
}

# Two calls = two different environments
show_env()
show_env()

# local_var doesn't exist outside
cat("local_var exists globally:", exists("local_var", envir = globalenv()), "\n")
```

The execution environment's parent is the **enclosing environment** — the environment where the function was *defined*, not where it was *called*. This is the basis of lexical scoping.

```r
# Function arguments also live in the execution environment
inspect <- function(a, b) {
  cat("Arguments in this env:\n")
  cat("  a =", a, "\n")
  cat("  b =", b, "\n")
  cat("  all names:", paste(ls(), collapse = ", "), "\n")
}

inspect(10, 20)
```

## Environments as Data Structures

Because environments have reference semantics and O(1) name lookup (they use hash tables), they're sometimes used as data structures:

```r
# Environment as a hash map / dictionary
cache <- new.env(parent = emptyenv())

# Store key-value pairs
cache[["user_1"]] <- list(name = "Alice", score = 95)
cache[["user_2"]] <- list(name = "Bob", score = 88)

# Fast lookup
user <- cache[["user_1"]]
cat("User 1:", user$name, "scored", user$score, "\n")

# Check membership
cat("user_3 exists:", exists("user_3", envir = cache, inherits = FALSE), "\n")

# Count entries
cat("Cache size:", length(ls(cache)), "\n")
```

## Practice Exercises

### Exercise 1: Walk the Parent Chain

```r
# Exercise: Write a function parent_chain(env) that returns
# a character vector of all environment names from env
# up to emptyenv().
# Test it with: parent_chain(globalenv())

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
parent_chain <- function(env) {
  chain <- character()
  while (!identical(env, emptyenv())) {
    nm <- environmentName(env)
    if (nm == "") nm <- format(env)
    chain <- c(chain, nm)
    env <- parent.env(env)
  }
  chain <- c(chain, "emptyenv")
  chain
}

result <- parent_chain(globalenv())
cat("Parent chain:\n")
for (i in seq_along(result)) {
  cat(sprintf("  %d. %s\n", i, result[i]))
}
```

**Explanation:** We walk up the chain using `parent.env()` until we hit `emptyenv()`. `environmentName()` returns "" for anonymous environments, so we fall back to `format()` which shows the memory address.

</details>

### Exercise 2: Environment as Counter

```r
# Exercise: Create a counter using an environment.
# make_counter() should return a list with:
#   $increment() — adds 1 to the count
#   $get() — returns current count
#   $reset() — sets count back to 0
# The count should persist between calls.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
make_counter <- function() {
  env <- new.env(parent = emptyenv())
  env$count <- 0

  list(
    increment = function() {
      env$count <- env$count + 1
      invisible(env$count)
    },
    get = function() env$count,
    reset = function() {
      env$count <- 0
      invisible(0)
    }
  )
}

counter <- make_counter()
counter$increment()
counter$increment()
counter$increment()
cat("Count:", counter$get(), "\n")

counter$reset()
cat("After reset:", counter$get(), "\n")
```

**Explanation:** The environment `env` is shared by all three functions because they were defined in the same scope. Each function can read and modify `env$count`, and the changes persist because environments have reference semantics.

</details>

## Summary

| Concept | Function | Description |
|---------|----------|-------------|
| Global env | `globalenv()`, `.GlobalEnv` | Your interactive workspace |
| Base env | `baseenv()` | Contains base R functions |
| Empty env | `emptyenv()` | Top of the chain, no parent |
| Create env | `new.env(parent = ...)` | Make a new environment |
| Parent | `parent.env(env)` | Get the parent environment |
| List names | `ls(env)` | Show all bindings in an environment |
| Get value | `get("x", envir = env)` | Retrieve a value by name |
| Check existence | `exists("x", envir = env)` | Test if a name is bound |
| Search path | `search()` | Show the full environment chain |
| Env name | `environmentName(env)` | Get the name of an environment |

**Key takeaways:**
1. Environments form a chain through their parents
2. Variable lookup walks this chain from current to `emptyenv()`
3. Environments have reference semantics (no copy-on-modify)
4. Every function call creates a new execution environment

## FAQ

### How is an environment different from a list?

Two key differences: (1) Environments have **reference semantics** — modifying an environment in a function changes the original. Lists use copy-on-modify. (2) Environments have a **parent** — failed lookups continue to the parent. Lists don't chain.

### What happens if R reaches emptyenv() without finding a variable?

R throws the error `object 'x' not found`. The empty environment has no bindings and no parent, so the search stops there.

### Can I change the parent of an environment?

Yes, with `parent.env(env) <- new_parent`. But this is rarely needed and can cause confusing behavior. It's mainly used internally by R's package system.

## Continue Learning

Environments are the foundation for understanding how R finds variables. Continue with:

1. **Lexical Scoping in R** — how R uses the environment chain to look up variable names
2. **R Closures** — functions that capture and remember their defining environment
3. **R Namespaces** — how packages use environments to export functions and prevent conflicts
