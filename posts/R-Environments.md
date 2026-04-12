---
title: "R Environments: The Missing Piece That Makes Scoping, Closures & NSE Click"
slug: "R-Environments"
description: "R environments are named bags with parent pointers — they power scoping and closures. Learn globalenv, baseenv, execution frames, and inspect them with rlang."
keywords: "R environments, globalenv, baseenv, emptyenv, parent environment, execution environment, R closures, R scoping chain, new.env()"
auto_link_terms: "R environments|environment in R|globalenv()|baseenv()|emptyenv()|parent.env()|execution environment|new.env()"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-13"
curriculum_id: "4.1.4"
post_type: "C"
sidebar_section: "Advanced R"
sidebar_title: "R Environments"
sidebar_order: 22
---

# R Environments: The Missing Piece That Makes Scoping, Closures & NSE Click

<p class="lead">An R environment is a named bag of variables plus a pointer to a parent environment. That tiny structure is how R finds every variable you use, how closures remember state, and how packages keep their functions from colliding — master it and R stops feeling magical.</p>

Most R users never think about environments. You type `x <- 5`, and `x` just exists. You call a function from a package, and it just works. But every one of those lookups walks a chain of environments behind the scenes. Once you can see that chain, scoping, closures, and namespaces all click into the same picture.

## What is an R environment?

Think of an environment like a named list with one extra field — a parent. When R looks up a variable, it peeks at the current environment's bindings first, then follows the parent pointer, then the parent's parent, and so on. The fastest way to see that structure is to build one with `rlang` and print it.

```r
library(rlang)

# Create an environment and bind three variables into it
my_env <- new_environment(list(x = 10, y = 20, greeting = "hi"))

# Peek inside
env_print(my_env)
#> <environment: 0x55c3f8a2b1d0>
#> Parent: <environment: empty>
#> Bindings:
#> • greeting: <chr>
#> • x: <dbl>
#> • y: <dbl>

env_names(my_env)
#> [1] "greeting" "x"        "y"
```

`env_print()` shows the two things that define every environment — the bindings (name → value pairs) and the parent pointer. Here the parent is `emptyenv()` because we created the environment from scratch. `env_names()` returns only the names, not the values, because an environment is a set, not a sequence.

[NOTE]
**Why rlang instead of base.** Base R has `new.env()`, `ls()`, `get()`, and `assign()` — all fine. The rlang package wraps them with a consistent `env_*` API and a friendlier printer. We'll use both styles in this tutorial.

**Try it:** Build an environment called `ex_env` holding `a = 1`, `b = 2`, `c = 3`, and print its names.

```r
# Try it
ex_env <- new_environment(list(
  # your code here
))

env_names(ex_env)
#> Expected: "a" "b" "c"
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_env <- new_environment(list(a = 1, b = 2, c = 3))
env_names(ex_env)
#> [1] "a" "b" "c"
```

**Explanation:** `new_environment()` takes a named list and turns each element into a binding inside the new environment.

</details>

## How does R find a variable?

When a function references a name it didn't define itself, R doesn't give up — it walks the chain of parent environments until it either finds the name or runs out of parents. That walk is called **lexical scoping**, and every R expression depends on it.

```r
# Define x in the interactive workspace
x <- 100

# A function that uses x without defining it locally
show_x <- function() {
  print(x)   # R looks up x in the parent chain
}
show_x()
#> [1] 100

# The parent of the global environment is whatever was attached most recently
parent.env(globalenv())
#> <environment: package:rlang>

# search() lists every environment R will walk, top to bottom
head(search(), 5)
#> [1] ".GlobalEnv"       "package:rlang"    "package:stats"
#> [4] "package:graphics" "package:utils"
```

When `show_x()` runs, R can't find `x` in the function's own (empty) execution environment, so it follows the parent pointer to `globalenv()`, finds `x = 100`, and prints it. `search()` shows the whole ladder of parents — your global workspace first, then each attached package, ending in `base`. Figure 1 traces that walk from your line of code all the way down.

![How R resolves a variable by walking the parent chain](screenshots/R-Environments-scoping-chain.webp)
*Figure 1: How R walks the parent chain to resolve a variable name.*

[KEY INSIGHT]
**Scoping is lookup with a fixed search order.** "Scope" isn't a property of the variable — it's a property of where R looks. If the name is in the current environment, you get it; otherwise R keeps climbing until it hits `emptyenv()` and throws `object 'x' not found`.

**Try it:** Call `search()` and count how many environments R would walk through before hitting `package:base`.

```r
# Try it
length(search())
#> Expected: a number around 10 (depends on attached packages)
```

<details>
<summary>Click to reveal solution</summary>

```r
length(search())
#> [1] 10
tail(search(), 1)
#> [1] "package:base"
```

**Explanation:** `search()` always ends in `"package:base"`. The count depends on how many packages you've loaded — WebR typically starts with a handful.

</details>

## What are the four special environments?

R keeps four environments that every session has by name. You'll meet them in error messages, stack traces, and namespace warnings — worth knowing them on sight.

```r
# The interactive workspace — where you type
globalenv()
#> <environment: R_GlobalEnv>

# The environment of base R — always the bottom of the search path
baseenv()
#> <environment: base>

# The ultimate ancestor — the only environment with NO parent
emptyenv()
#> <environment: R_EmptyEnv>

# Asking emptyenv() for its parent is an error
tryCatch(parent.env(emptyenv()),
         error = function(e) conditionMessage(e))
#> [1] "the empty environment has no parent"
```

`globalenv()` is where your assignments land when you type at the console. `baseenv()` holds the base R functions — `sum()`, `c()`, `function()` itself. `emptyenv()` is the "null" of environments: every parent chain eventually reaches it, and it alone has no parent of its own. Package environments sit between `globalenv()` and `baseenv()`, one per attached package.

[WARNING]
**The emptyenv has no parent.** Calling `parent.env(emptyenv())` throws. This matters when you write code that walks parent chains: your stopping condition must be `identical(e, emptyenv())`, not "until parent.env() fails".

**Try it:** Print the parent of `baseenv()` and confirm it is `emptyenv()`.

```r
# Try it
identical(parent.env(baseenv()), emptyenv())
#> Expected: TRUE
```

<details>
<summary>Click to reveal solution</summary>

```r
parent.env(baseenv())
#> <environment: R_EmptyEnv>

identical(parent.env(baseenv()), emptyenv())
#> [1] TRUE
```

**Explanation:** `baseenv()`'s parent is always `emptyenv()`. That's the invariant that anchors the whole search path.

</details>

## What happens inside a function call?

Every time you call a function, R creates a brand-new environment to hold its arguments and locals, runs the function body against it, and throws it away when the function returns. That temporary home is called the **execution environment**, and it's why local variables never leak between calls.

```r
f <- function() {
  a <- 1
  b <- 2
  current <- environment()       # the execution env of this call
  cat("locals: "); print(ls(current))
  cat("parent: "); print(parent.env(current))
}

f()
#> locals: [1] "a" "b" "current"
#> parent: <environment: R_GlobalEnv>
```

Inside `f()`, `environment()` returns the execution environment that R just built to run this call. Its parent is `globalenv()` — the environment where `f` was *defined*, not wherever `f` was *called from*. That distinction is the heart of lexical scoping: a function sees the variables that surrounded its definition, not its caller. Figure 2 shows the lifecycle.

![Execution environment created on call, destroyed on return](screenshots/R-Environments-function-call.webp)
*Figure 2: A function call creates a new execution environment whose parent is the enclosing env.*

[TIP]
**Locals never leak because execution environments are garbage.** When `f()` returns, its execution environment has no references left, so R collects it. That's why you can call the same function a million times without leaking memory.

**Try it:** Write a function `ex_show_locals()` that defines two variables and prints `ls(environment())`.

```r
# Try it
ex_show_locals <- function() {
  # your code here
}

ex_show_locals()
#> Expected: [1] "first" "second"
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_show_locals <- function() {
  first <- "hello"
  second <- "world"
  ls(environment())
}

ex_show_locals()
#> [1] "first"  "second"
```

**Explanation:** `environment()` inside a function returns that call's execution env. `ls()` on it lists the locals in alphabetical order.

</details>

## How do environments enable closures?

A **closure** is a function that remembers the environment where it was defined. Because R ties a function's parent pointer to its birth environment, a function can carry private state with it — even after the factory that created it has finished running. This is how stateful helpers like counters, caches, and progress bars work.

```r
make_counter <- function() {
  count <- 0
  function() {
    count <<- count + 1    # super-assign walks up to the enclosing env
    count
  }
}

tally <- make_counter()
tally()
#> [1] 1
tally()
#> [1] 2
tally()
#> [1] 3

# Peek inside the closure's captured environment
env_print(fn_env(tally))
#> <environment: 0x55c3fa1234b8>
#> Parent: <environment: global>
#> Bindings:
#> • count: <dbl>
```

`make_counter()` creates a local `count` and returns an inner function. That inner function's enclosing environment is the execution environment of `make_counter()` — and because the inner function is still holding a reference to it, R doesn't garbage-collect it when `make_counter()` returns. Each call to `tally()` finds `count` in that captured environment and bumps it with `<<-`, the super-assignment operator that climbs the parent chain until it finds an existing binding.

[KEY INSIGHT]
**Super-assign walks, it does not jump to global.** `<<-` climbs the parent chain until it finds an existing binding with that name, and modifies it. It only lands in `globalenv()` if no parent has the name — which is why closures can hold local mutable state without polluting the workspace.

**Try it:** Write `ex_make_adder(n)` that returns a function adding `n` to its input. Call it with `ex_make_adder(5)(10)`.

```r
# Try it
ex_make_adder <- function(n) {
  # your code here
}

add_five <- ex_make_adder(5)
add_five(10)
#> Expected: 15
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_make_adder <- function(n) {
  function(x) x + n
}

add_five <- ex_make_adder(5)
add_five(10)
#> [1] 15
```

**Explanation:** The inner function captures `n` from `ex_make_adder`'s execution environment. When `add_five(10)` runs, R looks up `n` in that captured environment and finds 5.

</details>

## How do you inspect and manipulate environments in practice?

Environments are the only R data structure with **reference semantics** — assigning one environment to another name does not copy the contents. That makes them perfect for shared mutable state (caches, counters, registries) but also a common source of bugs for readers expecting copy-on-modify.

```r
# Create an empty environment and use it like a mutable store
cache <- new.env()
cache$pi_approx <- 3.14159
cache$e_approx <- 2.71828

ls(cache)
#> [1] "e_approx"  "pi_approx"

env_get(cache, "pi_approx")
#> [1] 3.14159

# Reference semantics: cache2 is the SAME environment, not a copy
cache2 <- cache
cache2$new_key <- "hello"

ls(cache)          # cache now has new_key too
#> [1] "e_approx"  "new_key"   "pi_approx"

# To get a real copy, ask rlang explicitly
cache_copy <- env_clone(cache)
cache_copy$only_here <- "isolated"
env_has(cache, "only_here")
#> only_here
#>     FALSE
```

Writing to `cache2$new_key` mutates the one shared environment, so `cache` sees it too — there's only one bag, and `cache` and `cache2` are two labels on it. `env_clone()` is the escape hatch when you actually want a fresh copy with the same bindings at the moment of cloning.

[WARNING]
**Copying an environment name does not copy the environment.** Unlike lists and data frames, environments skip R's usual copy-on-modify rule. If you hand an environment to another function that mutates it, your original will see the change. Use `env_clone()` to defend against that.

**Try it:** Add a new binding `capital <- "London"` to `cache` and verify it shows up in `cache2`.

```r
# Try it
cache$capital <- "London"
# your verification here
#> Expected: TRUE
```

<details>
<summary>Click to reveal solution</summary>

```r
cache$capital <- "London"
env_has(cache2, "capital")
#> capital
#>    TRUE
```

**Explanation:** Because `cache2` points to the same environment as `cache`, any binding added through one name is visible through the other.

</details>

## Practice Exercises

### Exercise 1: Walk the parent chain

Write `ex_env_chain(e)` that prints each environment from `e` up to `emptyenv()`. Test it on `globalenv()`.

```r
# Exercise 1: climb the parent ladder
# Hint: use a repeat loop and identical(e, emptyenv())

ex_env_chain <- function(e) {
  # your code here
}

ex_env_chain(globalenv())
#> Expected: a sequence of envs ending in <environment: R_EmptyEnv>
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_env_chain <- function(e) {
  repeat {
    print(e)
    if (identical(e, emptyenv())) break
    e <- parent.env(e)
  }
}

ex_env_chain(globalenv())
#> <environment: R_GlobalEnv>
#> <environment: package:rlang>
#> ...
#> <environment: base>
#> <environment: R_EmptyEnv>
```

**Explanation:** The `repeat`/`break` pattern handles the special case cleanly. `identical()` — not `==` — is the correct way to compare environments, because `==` isn't defined for them.

</details>

### Exercise 2: Build a bank account with closures

Write `ex_make_bank(initial)` that returns a list of three closures — `deposit(n)`, `withdraw(n)`, and `balance()` — all sharing a single private balance variable.

```r
# Exercise 2: three closures, one shared env
# Hint: define `bal <- initial`, return a list of inner functions

ex_make_bank <- function(initial) {
  # your code here
}

acct <- ex_make_bank(100)
acct$deposit(50)
acct$withdraw(30)
acct$balance()
#> Expected: 120
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_make_bank <- function(initial) {
  bal <- initial
  list(
    deposit  = function(n) { bal <<- bal + n; invisible(bal) },
    withdraw = function(n) { bal <<- bal - n; invisible(bal) },
    balance  = function()  bal
  )
}

acct <- ex_make_bank(100)
acct$deposit(50)
acct$withdraw(30)
acct$balance()
#> [1] 120
```

**Explanation:** All three inner functions share the same execution environment of `ex_make_bank`, so they all see the same `bal`. `<<-` updates the shared binding in place.

</details>

### Exercise 3: Memoise a slow function with an environment

Write `ex_memoise(f)` that returns a wrapper which caches results in a private environment keyed by the input. Test it on a squaring function.

```r
# Exercise 3: memoisation via environment-as-cache
# Hint: store each result as cache[[as.character(x)]]

ex_memoise <- function(f) {
  # your code here
}

fast_square <- ex_memoise(function(x) x * x)
fast_square(7)
fast_square(7)   # second call is an instant cache hit
#> Expected: 49 both times
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_memoise <- function(f) {
  cache <- new.env()
  function(x) {
    key <- as.character(x)
    if (is.null(cache[[key]])) {
      cache[[key]] <- f(x)
    }
    cache[[key]]
  }
}

fast_square <- ex_memoise(function(x) x * x)
fast_square(7)
#> [1] 49
fast_square(7)   # cache hit
#> [1] 49
```

**Explanation:** The wrapper closes over `cache`, an environment the outside world can't see. Because environments have reference semantics, the wrapper mutates a single shared cache across all its calls — no global state needed.

</details>

## Complete Example

Let's tie the whole chapter together by building a tiny logger factory. Each logger holds its own private environment containing a character vector of lines and a count, and exposes closures to append, count, and flush the log as a data frame.

```r
make_logger <- function(name) {
  state <- new.env()
  state$lines <- character()
  state$count <- 0L

  append <- function(msg) {
    state$lines <- c(state$lines, msg)
    state$count <- state$count + 1L
    invisible(state$count)
  }

  size <- function() state$count

  flush <- function() {
    out <- data.frame(
      logger = name,
      id     = seq_len(state$count),
      line   = state$lines,
      stringsAsFactors = FALSE
    )
    state$lines <- character()
    state$count <- 0L
    out
  }

  list(append = append, size = size, flush = flush)
}

lg <- make_logger("app")
lg$append("started")
lg$append("loaded config")
lg$append("ready")
lg$size()
#> [1] 3

lg$flush()
#>   logger id          line
#> 1    app  1       started
#> 2    app  2 loaded config
#> 3    app  3         ready

lg$size()   # flush reset the counter
#> [1] 0
```

`state` is an environment private to this logger — no other code can see it. All three closures share it by reference, so `append()` and `flush()` mutate the same state. Because environments skip copy-on-modify, `append()` can grow the line vector in place without R copying it on every call. That's the whole pattern behind most stateful helpers in R — caches, progress bars, and even R6 classes are built on this idea.

## Summary

![R environments at a glance: structure, kinds, and roles](screenshots/R-Environments-overview-mindmap.webp)
*Figure 3: R environments at a glance — structure, kinds, and the roles they play.*

| Concept | What to remember |
|---|---|
| Structure | Frame (name → value) + parent pointer. Not ordered. |
| Reference semantics | Copying an environment name does not copy the bag. |
| Four special envs | `globalenv()`, `baseenv()`, `emptyenv()`, package envs |
| Lexical scoping | R walks the parent chain; stops at `emptyenv()` |
| Execution env | Fresh environment per call; parent is where the function was *defined* |
| Closures | Inner functions keep a live reference to their enclosing execution env |
| Inspect & mutate | `env_print()`, `env_names()`, `env_get()`, `new.env()`, `assign()`, `<<-` |

Once you hold the "bag with a parent pointer" picture in your head, everything else in R's semantics — `<<-`, closures, namespaces, even non-standard evaluation — becomes a variation on the same theme.

## References

1. Wickham, H. — *Advanced R*, 2nd Edition. Chapter 7: Environments. [Link](https://adv-r.hadley.nz/environments.html)
2. R Core Team — *base::environment* reference. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/environment.html)
3. rlang package reference — the `env_*` family. [Link](https://rlang.r-lib.org/reference/env.html)
4. Grolemund, G. — *Hands-On Programming with R*, Chapter 8: Environments. [Link](https://rstudio-education.github.io/hopr/environments.html)
5. R Core Team — *R Language Definition*, Environment objects. [Link](https://cran.r-project.org/doc/manuals/r-release/R-lang.html#Environment-objects)
6. Wickham, H. — *Advanced R Solutions*, Chapter 6: Environments. [Link](https://advanced-r-solutions.rbind.io/environments)

## Continue Learning

- **R Lexical Scoping** — the rules that govern which parent chain R actually walks, with side-by-side examples of lexical vs dynamic scoping.
- **R Closures** — deeper patterns for using captured environments: partial application, function factories, and gotchas around loops.
- **R Names and Values** — the reference-semantics story end-to-end, including why data frames copy but environments don't.
