---
title: "eapply() in R: Apply Functions to Environment Variables"
slug: "base-eapply-in-R"
description: "Use base R eapply() to apply a function to every variable in an environment. Covers FUN, all.names, USE.NAMES, real examples, and apply-family comparison."
keywords: "eapply in R, base R eapply, R apply environment, eapply environment R, eapply examples, eapply vs lapply, R eapply function"
mathjax: false
webr: true
date: "2026-05-23"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "base-r-essentials"
fr_parent: "R-Environments.html"
auto_link_terms: "eapply()|base eapply|eapply function|apply to environment|environment apply"
auto_link_case_sensitive: true
target_keyword: "eapply in R"
sibling_block_enabled: true
difficulty: "Beginner"
---

# eapply() in R: Apply Functions to Environment Variables

<p class="lead">The <code>eapply()</code> function in base R applies a function to every variable bound in an environment and returns a named list of results. It is the apply-family member built specifically for environments, where <code>lapply()</code> would need an explicit <code>as.list()</code> conversion first.</p>

[QUICK ANSWER]
eapply(env, FUN)                                    # apply FUN to every binding
eapply(env, FUN, all.names = TRUE)                  # include hidden (.dotted) names
eapply(env, FUN, USE.NAMES = FALSE)                 # drop the binding names
eapply(globalenv(), object.size)                    # size of every global object
eapply(env, function(x) class(x)[1])                # class of each binding
eapply(env, summary)                                # summary of every variable
eapply(asNamespace("stats"), is.function)           # scan a package namespace

[DECISION TREE: Is eapply() the right tool?]
- apply a function to each binding in an environment: eapply(env, FUN)
- apply a function to each element of a list: lapply(lst, FUN)
- apply a function with auto-simplification: sapply(x, FUN)
- apply a function with a strict type contract: vapply(x, FUN, FUN.VALUE)
- recurse into nested lists and apply at leaves: rapply(lst, FUN)
- apply over rows or columns of a matrix: apply(mat, MARGIN, FUN)
- list names in an environment without applying any function: ls(env)
- copy an environment to a regular list first: as.list(env)

## What eapply() does in one sentence

**`eapply(env, FUN, ..., all.names, USE.NAMES)` iterates over every name bound in `env`, applies `FUN` to each value, and returns a named list.** It is the only apply-family function that takes an environment directly; the others need `as.list(env)` first.

An environment in R is a set of name-to-value bindings, like a hash map. `eapply()` walks them, evaluates each (forcing promises and active bindings), and returns the results named by binding, unless `USE.NAMES = FALSE`.

## Syntax and arguments

**`eapply(env, FUN, ..., all.names = FALSE, USE.NAMES = TRUE)` takes one required environment, one required function, and three optional controls.** Extra arguments after `FUN` flow into `FUN` via `...`, exactly like in `lapply()`.

```r title="Basic apply over an environment"
e <- new.env()
e$x <- 1:5
e$y <- letters[1:3]
e$z <- c(TRUE, FALSE, TRUE)

eapply(e, length)
#> $x
#> [1] 5
#>
#> $y
#> [1] 3
#>
#> $z
#> [1] 3
```

The environment `e` has three bindings. `eapply()` visits each, calls `length()` on the value, and returns a list with the original names. Output order is not guaranteed (see Pitfall 1).

| Argument | Purpose | Common values |
|---|---|---|
| `env` | Environment to iterate over | `new.env()`, `globalenv()`, `asNamespace("pkg")`, a function's `environment()` |
| `FUN` | Function applied to each binding's value | `length`, `class`, `object.size`, `summary`, custom lambda |
| `...` | Extra arguments passed to `FUN` | `na.rm = TRUE`, `digits = 2`, any FUN-specific arg |
| `all.names` | Whether to visit hidden bindings (names starting with `.`) | `FALSE` (default), `TRUE` |
| `USE.NAMES` | Whether to label the result with binding names | `TRUE` (default), `FALSE` |

[TIP]
**Reach for eapply when your data lives in an environment, not a list.** Common cases: scanning the global workspace, walking a package namespace, or using an environment as a mutable hash map. For everything else, prefer lapply on an explicit list; it is faster and has predictable iteration order.

## Five common patterns

### 1. Audit every object in the global workspace

```r title="Find the largest globals by memory"
ga <- new.env()
ga$small_vec  <- 1:100
ga$big_matrix <- matrix(rnorm(10000), 100, 100)
ga$df         <- data.frame(a = 1:50, b = runif(50))

sizes <- eapply(ga, object.size)
sort(unlist(sizes), decreasing = TRUE)
#> big_matrix         df  small_vec 
#>      80216       1144        680
```

Pairing `eapply()` with `object.size()` is the standard recipe for finding memory hogs. Replace `ga` with `globalenv()` in a real session; `unlist()` collapses the named list into a sortable vector.

### 2. Get the class of every variable

```r title="Type-audit an environment"
e <- new.env()
e$nums  <- 1:10
e$chars <- c("a", "b")
e$fit   <- lm(mpg ~ wt, data = mtcars)
e$flag  <- TRUE

eapply(e, function(x) class(x)[1])
#> $chars
#> [1] "character"
#>
#> $fit
#> [1] "lm"
#>
#> $flag
#> [1] "logical"
#>
#> $nums
#> [1] "integer"
```

`class(x)[1]` keeps only the primary class for objects with multiple classes. Useful for a flat one-row-per-binding inventory.

### 3. Reveal hidden bindings with all.names

```r title="Include dotted names"
e <- new.env()
e$visible    <- 1
e$.hidden    <- "secret"
e$..deep     <- TRUE

eapply(e, class)          # default: skips .hidden and ..deep
#> $visible
#> [1] "integer"

eapply(e, class, all.names = TRUE)
#> $..deep
#> [1] "logical"
#>
#> $.hidden
#> [1] "character"
#>
#> $visible
#> [1] "integer"
```

Dotted names (`.x`, `..y`) are conventionally hidden in R, mirroring `ls()`. Pass `all.names = TRUE` when debugging internal package code or environments built by `local()` and other meta-programming helpers.

### 4. Scan a package namespace

```r title="Find every function exported by stats"
ns <- asNamespace("stats")
is_fn <- eapply(ns, is.function)
fns <- names(is_fn)[unlist(is_fn)]
length(fns)
#> [1] 444
head(fns, 5)
#> [1] ".__C__anova"       ".__C__anova.glm"   ".__C__anova.glm.null"
#> [4] ".__C__aov"         ".__C__aovlist"
```

`asNamespace()` returns the environment backing a package's namespace. Combined with `eapply()`, this builds catalogs of functions or datasets without `ls()` + `get()` loops. Dotted names appear because namespace internals are visited; order is hash-driven.

### 5. Use an environment as a mutable counter store

```r title="eapply on a hash-map-style environment"
counts <- new.env(hash = TRUE)
counts$alpha <- 0L
counts$beta  <- 0L
counts$gamma <- 0L

for (event in c("alpha", "beta", "alpha", "gamma", "alpha")) {
  counts[[event]] <- counts[[event]] + 1L
}

eapply(counts, identity)
#> $alpha
#> [1] 3
#>
#> $beta
#> [1] 1
#>
#> $gamma
#> [1] 1
```

Environments are R's built-in mutable hash maps. After mutating bindings in a loop, `eapply(env, identity)` is the canonical way to materialize the final state as a list.

[KEY INSIGHT]
**eapply is lapply for environments, but with one extra job: it forces every binding.** Visiting a binding triggers any promise (lazy default) or active binding (function-backed slot), so the returned list contains realized values. This is exactly what you want for an audit, but it can be slow or have side effects in environments that hold expensive promises.

## eapply() vs lapply, ls, and as.list

**Each function answers a different "iterate over an environment" question.** The table below sorts the alternatives by what they return and how they treat names.

| Function | Input | Output | Use when |
|---|---|---|---|
| `eapply()` | Environment | Named list of FUN(value) | You want to apply a function to every binding's value |
| `lapply(as.list(env), FUN)` | Environment (via conversion) | Named list of FUN(value) | You need deterministic order or want to chain with other list tools |
| `ls(env)` | Environment | Sorted character vector of names | You only need names, not values |
| `as.list(env)` | Environment | Named list of values (no FUN) | You want the raw values to inspect or save |
| `mget(ls(env), env)` | Environment | Named list of values, in `ls()` order | You want values back in a controlled order |

The mental model: pick `eapply()` when you have an environment AND want to map a function over its values. For names only, use `ls()`. For raw values, use `as.list()`. When iteration order matters, convert to a list first.

[WARNING]
**eapply() iteration order is NOT alphabetical.** Environments are backed by hash tables, so the result list's name order reflects internal hash positions, not the order bindings were created or the order `ls()` returns. If your downstream code depends on a specific order, wrap the result: `eapply(env, FUN)[ls(env)]` reorders it alphabetically.

## Common pitfalls

**Three quirks of eapply trip up most users.** Each has a fix that takes one extra line.

### Pitfall 1: Output order is unpredictable

**Two calls to `eapply()` on the same environment may produce results in different name orders.** This surprises users who assume insertion or alphabetical order.

```r title="Reorder the result by ls()"
e <- new.env()
e$c <- 3; e$a <- 1; e$b <- 2

raw <- eapply(e, function(x) x * 10)
ordered <- raw[ls(e)]
ordered
#> $a
#> [1] 10
#>
#> $b
#> [1] 20
#>
#> $c
#> [1] 30
```

Reorder explicitly with `result[ls(env)]` whenever the consumer expects a fixed name order. Tests, snapshots, and reports especially need this guard.

### Pitfall 2: Hidden names are skipped by default

**Bindings whose name starts with a dot are invisible to `eapply()` unless you set `all.names = TRUE`.** This matches `ls()`'s behavior but bites debuggers who forgot the flag.

```r title="Forgotten all.names hides cache bindings"
e <- new.env()
e$user_data <- 1:5
e$.cache    <- "internal"

length(eapply(e, identity))                 # only counts visible
#> [1] 1

length(eapply(e, identity, all.names = TRUE))
#> [1] 2
```

Always pass `all.names = TRUE` when auditing environments built by package code, `local()`, or anything that uses dotted names for internal state.

### Pitfall 3: Active bindings get evaluated

**`eapply()` forces every binding, so active bindings (those created with `makeActiveBinding()`) run their function each time.** This can be slow or have side effects.

```r title="Active binding fires on every visit"
e <- new.env()
counter <- 0L
makeActiveBinding("now", function() {
  counter <<- counter + 1L
  counter
}, env = e)
e$other <- 99

eapply(e, identity)
counter
#> [1] 1
```

Each `eapply()` call increments `counter` because visiting `now` invokes its underlying function. To skip active bindings, filter with `Filter(Negate(bindingIsActive), ls(e))` before calling.

## Try it yourself

**Try it:** Build an environment `ex_env` with three numeric vectors of different lengths, then use `eapply()` to get the mean of each. Save the result, reordered alphabetically by name, to `ex_means`.

```r title="Your turn: mean of every binding"
# Try it: mean of each numeric binding
ex_env <- new.env()
ex_env$a <- 1:10
ex_env$b <- c(2.5, 3.5, 4.5)
ex_env$c <- rnorm(100)

ex_means <- # your code here

ex_means
#> Expected: named list with names a, b, c (alphabetical) and three means
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_means <- eapply(ex_env, mean)[ls(ex_env)]
ex_means
#> $a
#> [1] 5.5
#>
#> $b
#> [1] 3.5
#>
#> $c
#> [1] 0.02  (varies, depends on rnorm seed)
```

**Explanation:** `eapply(ex_env, mean)` returns a named list of three means in hash order. Subsetting with `[ls(ex_env)]` reorders the list by `ls()`'s alphabetical default, giving a stable, predictable name order. The `c` element value will vary because `rnorm(100)` is random; only the names and structure are deterministic.

</details>

## Related apply functions in R

- [base lapply](base-lapply-in-R.html): single-level apply for lists and vectors, returns a list.
- [base sapply](base-sapply-in-R.html): single-level apply with auto-simplification.
- [base vapply](base-vapply-in-R.html): single-level apply with a strict type and length contract.
- [base mapply](base-mapply-in-R.html): apply a function across multiple parallel vectors.
- [base rapply](base-rapply-in-R.html): recursive apply over nested lists.
- [R Environments](R-Environments.html): the broader hub on environments, scoping, and lookup.

External reference: the [R Language Definition on eapply](https://stat.ethz.ch/R-manual/R-devel/library/base/html/eapply.html) is the canonical source for argument semantics and the underlying iteration algorithm.

## FAQ

**What does eapply do in R?**

`eapply()` applies a function to every binding in an environment and returns a named list. The signature is `eapply(env, FUN, ..., all.names = FALSE, USE.NAMES = TRUE)`. Use it to audit the global workspace, scan a package namespace, or post-process an environment used as a mutable hash map. It is built into base R; no package needed.

**What is the difference between eapply and lapply?**

`lapply()` iterates over elements of a list or atomic vector. `eapply()` iterates over bindings of an environment. Environments are unordered hash maps; lists are ordered sequences. `lapply(as.list(env), FUN)` mimics `eapply(env, FUN)` but with deterministic order. Use `eapply()` for the cleanest syntax when the input is already an environment.

**Does eapply preserve order in R?**

No. `eapply()` walks bindings in hash-table order, not insertion or alphabetical. Two runs on the same environment can return results in different orders. Reorder explicitly with `eapply(env, FUN)[ls(env)]` for an alphabetical result. For deterministic iteration, convert first with `as.list(env)` then call `lapply()`.

**Can eapply access hidden variables in R?**

Yes, with `all.names = TRUE`. By default, bindings whose names start with a dot (`.cache`, `.private`) are skipped, matching `ls()`'s default behavior. Pass `all.names = TRUE` to include them. This matters when inspecting environments built by package internals or `local()` blocks that use dotted names for private state.

**How do I apply a function to all objects in the global environment?**

Pass `globalenv()` (or `.GlobalEnv`) as the first argument: `eapply(globalenv(), object.size)` returns the memory footprint of every global object. Pair with `sort(unlist(...))` to rank by size. Add `all.names = TRUE` to include hidden globals. Standard recipe for finding memory leaks during an interactive session.
