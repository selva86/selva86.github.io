---
title: "R Promise Objects: Lazy Evaluation & Force() Explained"
slug: "R-Promise-Objects"
description: "R wraps function arguments in promise objects and evaluates them lazily. Learn promises, force(), substitute(), the closure loop trap, and default-arg scoping."
keywords: "R promise objects, R lazy evaluation, R force function, R force(), R substitute, R delayed evaluation, closure loop trap R, R default arguments, delayedAssign R"
auto_link_terms: "R promise objects|R lazy evaluation|lazy evaluation|force()|promise objects|R promises|delayedAssign()"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-13"
curriculum_id: "FR-inte-4"
post_type: "FR"
fr_parent: "R-Lexical-Scoping.html"
---

# R Promise Objects: Lazy Evaluation & Force() Explained

<p class="lead">An <strong>R promise object</strong> is a recipe R creates for every function argument: an unevaluated expression, an environment to evaluate it in, and an empty value slot that fills on first use. This mechanism — <strong>lazy evaluation</strong> — lets R skip work it doesn't need, but it also hides a few traps that cost R programmers real hours.</p>

## What is a promise object in R?

The quickest way to see a promise in action is to pass a side-effecting expression as an argument and watch *when* R decides to run it. Below, `show_when()` takes two arguments but only uses the first. Notice how the second argument — a `cat()` call that would normally print immediately — stays silent because R never needed to look at it.

The function prints a marker, uses argument `a`, then exits without ever touching `b`. If R evaluated arguments *eagerly* (like Python or JavaScript), the `cat()` inside `b` would fire as soon as we called the function. It doesn't.

```r
# Arguments are wrapped in promises; unused ones never run
show_when <- function(a, b) {
  cat("[function body starts]\n")
  cat("a =", a, "\n")
  cat("[function body ends; b was never touched]\n")
}

show_when(
  a = 10,
  b = { cat("  >> b was evaluated!\n"); 999 }
)
#> [function body starts]
#> a = 10 
#> [function body ends; b was never touched]
```

The `">> b was evaluated!"` line never appears. When R called `show_when()`, it packaged the expression `{ cat(...); 999 }` and the calling environment into a **promise** and bound that promise to the formal argument `b`. The promise sat there, unused, until `show_when()` returned. No evaluation, no side effect, no cost.

Every promise has three slots:

1. **Expression** — the unevaluated code you wrote (`{ cat(...); 999 }`)
2. **Environment** — where that expression should be evaluated (here, the global environment)
3. **Value** — empty at first, filled when the promise is *forced* (first access)

[KEY INSIGHT]
**A promise is R's IOU for a value.** Every function argument starts as an unevaluated expression paired with an environment; R only cashes the IOU when the function body actually reads the argument.

**Try it:** Write a function `ex_lazy(x, y)` that returns `x * 2` and never uses `y`. Pass a noisy `cat()` expression as `y` and confirm it stays silent.

```r
# Try it: write ex_lazy()
ex_lazy <- function(x, y) {
  # your code here
}

# Test:
ex_lazy(5, { cat("y ran!\n"); 999 })
#> Expected: 10  (and no "y ran!" message)
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_lazy <- function(x, y) {
  x * 2
}
ex_lazy(5, { cat("y ran!\n"); 999 })
#> [1] 10
```

**Explanation:** Because `y` is never referenced in the body, its promise is never forced. The `cat()` call lives inside the promise's expression slot and is discarded when the function returns.

</details>

## How does lazy evaluation actually work step by step?

Now that you've seen a promise stay unforced, let's trace the full lifecycle. When R encounters `f(x + 1)`, it does four things in order:

1. **Wrap** — build a promise holding the expression `x + 1` plus a pointer to the caller's environment.
2. **Bind** — attach that promise to `f`'s formal parameter name.
3. **Force** — the *first* time `f`'s body reads the parameter, evaluate the expression in its captured environment.
4. **Cache** — store the result in the value slot. Every subsequent read returns the cached value directly.

That caching step matters. A promise is forced *at most once*, so referencing an argument five times does not recompute it five times. Here's the proof:

```r
# Each call to noisy() bumps a counter — so we can count evaluations
counter <- 0
noisy <- function() {
  counter <<- counter + 1
  42
}

use_twice <- function(x) {
  r1 <- x + 1   # first read — forces the promise, caches 42
  r2 <- x + 1   # second read — reads the cached value, no recompute
  r1 + r2
}

counter <- 0
use_twice(noisy())
#> [1] 86
cat("noisy() ran", counter, "time(s)\n")
#> noisy() ran 1 time(s)
```

Despite `x` being read twice, `noisy()` executed exactly once. On the first read, R saw an unforced promise, ran `noisy()` in the global environment, got `42`, and stored it. On the second read, the promise's value slot was already populated, so R skipped straight to the cached number.

[TIP]
**"Evaluate once, cache forever" is why lazy evaluation costs nothing at runtime.** You can reference an argument ten times in a function body without worrying about re-running expensive expressions — R memoises the first forcing automatically.

**Try it:** Add a third read of `x` inside `use_twice()` and predict what `counter` will be after one call. Run it to check.

```r
# Try it: modify to read x three times
ex_cached_fn <- function(x) {
  r1 <- x + 1
  r2 <- x + 1
  # add a third read of x here
}

counter <- 0
ex_cached_fn(noisy())
cat("noisy() ran", counter, "time(s)\n")
#> Expected: noisy() ran 1 time(s)
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_cached_fn <- function(x) {
  r1 <- x + 1
  r2 <- x + 1
  r3 <- x * 2
  r1 + r2 + r3
}
counter <- 0
ex_cached_fn(noisy())
#> [1] 170
cat("noisy() ran", counter, "time(s)\n")
#> noisy() ran 1 time(s)
```

**Explanation:** No matter how many times `x` appears, only the first access forces the promise. The value slot is filled with `42` and every subsequent read is a plain lookup.

</details>

## Why do default arguments see other function arguments?

You've probably written (or seen) a function like `function(x, n = length(x))` — a default that refers to another argument. It works because of one rule: **default arguments are evaluated in the function's own environment, not the caller's**. By the time R needs `n`, `x` is already bound in the function frame, so `length(x)` has something to look up.

Here's the friendly version:

```r
smart_default <- function(x, n = length(x)) {
  cat("n =", n, "\n")
  head(x, n)
}

smart_default(1:10)
#> n = 10 
#>  [1]  1  2  3  4  5  6  7  8  9 10

smart_default(1:10, 3)
#> n = 3 
#> [1] 1 2 3
```

When you omit `n`, R wraps the default expression `length(x)` in a promise whose *environment* is the call frame of `smart_default`. The moment the body reads `n`, that promise forces, finds `x` in the same frame, and returns `10`. When you pass `n = 3`, the default is never consulted — your supplied promise takes its place.

Now the unfriendly version. The same rule means a default can reference *anything* in the function's local scope, including variables created *after* the formal parameters. Hadley's classic `h05()` example shows how strange that gets:

```r
h05 <- function(x = ls()) {
  a <- 1
  x  # first read of x — forces the default promise NOW
}

# No argument — default runs inside h05, after `a` was created
h05()
#> [1] "a" "x"

# Caller supplies ls() — different evaluation context
h05(ls())
#> [1] "h05"      "noisy"    "counter"  ...
```

Same expression — `ls()` — two completely different results. The default version runs in `h05`'s frame, where the locals are `a` and `x`, so `ls()` returns `c("a", "x")`. The supplied version runs in the *caller's* frame (the global environment), where `ls()` returns whatever globals happen to exist.

[KEY INSIGHT]
**Default arg = lazy + function's environment. Caller-supplied arg = lazy + caller's environment.** Two different worlds. Useful for `function(x, n = length(x))` patterns, dangerous when a default references a local whose meaning the caller can't see.

**Try it:** Write `ex_append(x, suffix = paste0("-", length(x)))` that returns `paste0(x, suffix)`. Call it with and without `suffix`.

```r
# Try it
ex_append <- function(x, suffix = paste0("-", length(x))) {
  # your code here
}

ex_append(c("a", "b", "c"))
#> Expected: "a-3" "b-3" "c-3"
ex_append(c("a", "b", "c"), "!")
#> Expected: "a!" "b!" "c!"
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_append <- function(x, suffix = paste0("-", length(x))) {
  paste0(x, suffix)
}
ex_append(c("a", "b", "c"))
#> [1] "a-3" "b-3" "c-3"
ex_append(c("a", "b", "c"), "!")
#> [1] "a!" "b!" "c!"
```

**Explanation:** The default `paste0("-", length(x))` is wrapped in a promise whose environment is the call frame. When forced, it sees `x` already bound and computes the suffix on the fly.

</details>

## What is the closure-loop trap and how does force() fix it?

This is the bug that lazy evaluation is infamous for. Build closures inside a `for` loop that captures the loop variable, and every closure will end up pointing at the *same* final value. Watch:

```r
# The buggy factory — no force()
make_adder <- function(n) {
  function(x) x + n
}

# Build three adders in a loop
adders <- list()
for (i in 1:3) {
  adders[[i]] <- make_adder(i)
}

# We expect 11, 12, 13. We get...
adders[[1]](10)
#> [1] 13
adders[[2]](10)
#> [1] 13
adders[[3]](10)
#> [1] 13
```

All three adders return 13. Why? Each call `make_adder(i)` created a promise for `n` whose *expression* was the symbol `i` and whose *environment* was the global frame. That promise stayed unforced because the inner function `function(x) x + n` doesn't touch `n` until you call it. By the time you call the first adder, the loop has already finished and `i` equals 3. Every promise forces to the same number.

The fix is to **force the promise eagerly** inside the factory, before the inner function is returned. `force(n)` is the idiomatic way to say "evaluate this promise now, capture its value":

```r
# The safe factory — force() burns in the value
make_adder_safe <- function(n) {
  force(n)           # evaluate n NOW, cache in the promise's value slot
  function(x) x + n  # inner function reads the cached value later
}

adders_safe <- list()
for (i in 1:3) {
  adders_safe[[i]] <- make_adder_safe(i)
}

adders_safe[[1]](10)
#> [1] 11
adders_safe[[2]](10)
#> [1] 12
adders_safe[[3]](10)
#> [1] 13
```

Correct. On iteration 1, `force(n)` ran inside `make_adder_safe`'s frame, evaluated `i` (which was 1), and cached 1 in the value slot. The inner closure's reference to `n` now resolves to that frozen 1, regardless of what `i` does later. Iterations 2 and 3 froze their own promises the same way.

[WARNING]
**Function factories used inside loops must `force()` their captured argument.** It's a silent, frustrating bug — the code looks right, it doesn't error, it just returns the wrong numbers. If you're building closures that capture anything from an enclosing environment, add `force()` as a reflex.

Technically, `force(x)` is nothing more than `identity(x)` — it does not exist to do work, only to make the intent unmistakable. Writing `n` on its own line would also force the promise; `force(n)` just tells the next reader why.

**Try it:** The factory below builds personalised greeters but has the same bug. Add `force()` to fix it.

```r
# Try it: fix the greeter factory
ex_make_greeter <- function(name) {
  # add one line here
  function() paste0("Hi, ", name, "!")
}

greeters <- list()
for (who in c("Ada", "Bram", "Cai")) {
  greeters[[who]] <- ex_make_greeter(who)
}

greeters$Ada()
#> Expected: "Hi, Ada!"
greeters$Bram()
#> Expected: "Hi, Bram!"
greeters$Cai()
#> Expected: "Hi, Cai!"
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_make_greeter <- function(name) {
  force(name)
  function() paste0("Hi, ", name, "!")
}
greeters <- list()
for (who in c("Ada", "Bram", "Cai")) {
  greeters[[who]] <- ex_make_greeter(who)
}
greeters$Ada()
#> [1] "Hi, Ada!"
greeters$Bram()
#> [1] "Hi, Bram!"
greeters$Cai()
#> [1] "Hi, Cai!"
```

**Explanation:** Without `force(name)`, every closure captures the same unforced promise for `name`, which later resolves to `"Cai"` — the loop's final value. Forcing inside the factory freezes each closure's copy.

</details>

## How does substitute() let you inspect a promise?

So far we've talked about forcing a promise — getting its value. `substitute()` does the opposite: it reads the **expression** slot *without* triggering evaluation. It gives you the raw code the caller typed.

```r
show_expression <- function(x) {
  expr <- substitute(x)
  cat("Expression:", deparse(expr), "\n")
  cat("Value     :", x, "\n")
}

show_expression(1 + 2 + 3)
#> Expression: 1 + 2 + 3 
#> Value     : 6 

show_expression(sqrt(144))
#> Expression: sqrt(144) 
#> Value     : 12 

a <- 5
show_expression(a + 10)
#> Expression: a + 10 
#> Value     : 15 
```

`substitute(x)` peered inside the promise and handed back the expression slot — the exact code the caller wrote. Then `x` on the next line forced the promise normally to get the value. Both slots, one promise.

This is the engine behind a lot of "magic" R functions. `plot(x, y)` labels its axes "x" and "y" because it calls `substitute()` on its arguments. `curve(sin(1/x^2), 0, 1)` captures `sin(1/x^2)` as an expression, never evaluates it in the caller, and re-evaluates it across a grid of `x` values. dplyr's `filter(cyl == 4)` works because `filter()` uses substitute-like tools to capture `cyl == 4` and evaluate it inside the data frame instead of the caller.

[NOTE]
**`substitute()` only captures the promise at *its own* argument position.** If function `outer(x)` passes `x` down to `inner(x)`, and `inner()` calls `substitute(x)`, it sees the symbol `x` — not the original expression from the outermost caller. Metaprogramming across function boundaries needs `rlang::enquo()` or manual expression passing.

**Try it:** Write `ex_describe(x)` that returns a named list with `expression` (a character string via `deparse`) and `value`.

```r
# Try it
ex_describe <- function(x) {
  # your code here
}

ex_describe(10 * (3 + 2))
#> Expected:
#> $expression
#> [1] "10 * (3 + 2)"
#> $value
#> [1] 50
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_describe <- function(x) {
  list(
    expression = deparse(substitute(x)),
    value      = x
  )
}
ex_describe(10 * (3 + 2))
#> $expression
#> [1] "10 * (3 + 2)"
#> 
#> $value
#> [1] 50
```

**Explanation:** `substitute(x)` returns an R language object; `deparse()` converts it to a string. Reading `x` on the next line forces the promise and gives the value.

</details>

## Can I create promises manually with delayedAssign()?

Function arguments are the usual source of promises, but you can create one at the top level too. `delayedAssign(name, expr)` binds `name` to a promise that holds `expr` unevaluated — the expression runs the first time you reference `name`, and never again.

```r
# Bind a promise to the name `big_calc` without running the body
delayedAssign("big_calc", {
  cat("(computing big_calc...)\n")
  sum(as.numeric(1:1e6))
})

cat("Nothing has been computed yet.\n")
#> Nothing has been computed yet.

# First access — the promise forces, the message prints, the value caches
big_calc
#> (computing big_calc...)
#> [1] 500000500000

# Second access — cached, no recomputation, no message
big_calc
#> [1] 500000500000
```

Two things to notice. First, the `cat()` message printed exactly once — exactly on the first read of `big_calc`. That's the familiar "force and cache" rule, now applied to a top-level binding instead of a function argument. Second, after the first access, `big_calc` looks like an ordinary variable holding `500000500000` — the promise has done its job.

This is how many R packages expose large reference datasets: `delayedAssign` on package load, and the dataset stays compressed on disk until a user actually reads it.

[TIP]
**For values that should recompute on *every* access, reach for `makeActiveBinding()` instead.** `delayedAssign()` fires once and caches; `makeActiveBinding()` fires every time. Different tools for lazy-once vs lazy-always.

**Try it:** Use `delayedAssign()` to create `ex_config` whose expression reads the current time via `Sys.time()`. Confirm that the *same* time shows up on repeated reads.

```r
# Try it
delayedAssign("ex_config", Sys.time())

# First access — records the time
first  <- ex_config
Sys.sleep(1)
second <- ex_config

identical(first, second)
#> Expected: TRUE   (promise cached on first read)
```

<details>
<summary>Click to reveal solution</summary>

```r
delayedAssign("ex_config", Sys.time())

first  <- ex_config
Sys.sleep(1)
second <- ex_config

identical(first, second)
#> [1] TRUE
```

**Explanation:** `Sys.time()` runs once, during the first access to `ex_config`. The returned time is cached in the promise's value slot, so the second read returns the same cached timestamp — not a fresh one.

</details>

## Practice Exercises

These pull together several ideas from the tutorial. Use distinct variable names (prefixed `my_`) so exercise code doesn't clobber the teaching examples above.

### Exercise 1: A safe multiplier factory

Write `make_multiplier(n)` that returns a function of `x` computing `x * n`. Build five multipliers in a `for` loop (for `n = 2` through `6`) and store them in a list called `my_mults`. Verify that each multiplier returns the correct result — `my_mults[[1]](10)` should give `20`, `my_mults[[5]](10)` should give `60`.

```r
# Exercise 1: use force() to avoid the closure-loop trap

make_multiplier <- function(n) {
  # your code here
}

my_mults <- list()
for (k in 2:6) {
  # fill my_mults here
}

# Test
sapply(my_mults, function(f) f(10))
#> Expected: 20 30 40 50 60
```

<details>
<summary>Click to reveal solution</summary>

```r
make_multiplier <- function(n) {
  force(n)
  function(x) x * n
}

my_mults <- list()
for (k in 2:6) {
  my_mults[[k - 1]] <- make_multiplier(k)
}

sapply(my_mults, function(f) f(10))
#> [1] 20 30 40 50 60
```

**Explanation:** Without `force(n)`, all five closures would capture the same unforced promise for `k` and return `60` (the loop's final value times 10). `force(n)` evaluates and caches on each call, freezing `n` at 2, 3, 4, 5, 6 respectively.

</details>

### Exercise 2: Build your own `once()`

Write `once(fn)` that takes a zero-argument function `fn` and returns a new function that runs `fn()` the first time it's called and returns the cached result on every subsequent call. Do this using a local environment (not `delayedAssign`). Test on a random-number generator and confirm two calls give the *same* number.

```r
# Exercise 2: cache-on-first-call helper

once <- function(fn) {
  # your code here
}

set.seed(1)
my_once_fn <- once(function() runif(1))

my_once_fn()
my_once_fn()
#> Expected: both calls return the same number
```

<details>
<summary>Click to reveal solution</summary>

```r
once <- function(fn) {
  force(fn)
  cache <- new.env(parent = emptyenv())
  cache$done <- FALSE

  function() {
    if (!cache$done) {
      cache$value <- fn()
      cache$done  <- TRUE
    }
    cache$value
  }
}

set.seed(1)
my_once_fn <- once(function() runif(1))

my_once_fn()
#> [1] 0.2655087
my_once_fn()
#> [1] 0.2655087
```

**Explanation:** A small environment (`cache`) persists across calls because the returned closure holds a reference to it. The first call evaluates `fn()` and stores the result; later calls short-circuit to the cached value. Notice the `force(fn)` at the top — if you built multiple `once()` wrappers in a loop, you'd hit the closure-loop trap without it.

</details>

### Exercise 3: A default that survives the h05 trap

Write `safe_default(x, n = length(x))` that returns `head(x, n)`, but *guards* against the trap shown earlier: if the caller passes their own `n`, use it; if they omit `n`, fall back to `length(x)` computed inside the function. Use `missing()` to tell the two cases apart.

```r
# Exercise 3: missing() + default arg

safe_default <- function(x, n = length(x)) {
  # use missing() to branch on whether n was supplied
}

my_safe <- safe_default(1:10)
my_safe
#> Expected: 1 2 3 4 5 6 7 8 9 10

my_safe <- safe_default(1:10, 3)
my_safe
#> Expected: 1 2 3
```

<details>
<summary>Click to reveal solution</summary>

```r
safe_default <- function(x, n = length(x)) {
  if (missing(n)) {
    n <- length(x)  # computed in this frame, promises forced here
  }
  head(x, n)
}

safe_default(1:10)
#>  [1]  1  2  3  4  5  6  7  8  9 10
safe_default(1:10, 3)
#> [1] 1 2 3
```

**Explanation:** `missing(n)` returns `TRUE` if the caller didn't supply `n` — it checks whether `n`'s promise still holds the default expression. Branching on `missing()` makes defaults explicit and prevents surprises when a default references other locals in the function body.

</details>

## Putting It All Together: a lazy config loader

Here's a small real-world scenario that ties promises, `force()`, and `delayedAssign()` together. Imagine a configuration object where each value is computed on demand — reading a file, contacting a database, running an expensive calculation — and you only pay for the keys you actually touch.

`lazy_config()` accepts a list of name → expression pairs (passed via `quote()` so the expressions don't evaluate at call time). It stores each expression as a promise inside a dedicated environment and returns that environment. Reading a key forces the corresponding promise exactly once.

```r
lazy_config <- function(entries) {
  env <- new.env(parent = emptyenv())
  for (key in names(entries)) {
    local({
      k <- key                 # freeze key for this iteration
      expr <- entries[[k]]
      force(k); force(expr)    # capture both by value
      delayedAssign(k, eval(expr), assign.env = env)
    })
  }
  env
}

# Define three config entries — note that none run yet
cfg <- lazy_config(list(
  db_host    = quote({ cat("  resolving db_host\n");    "db.internal:5432" }),
  api_key    = quote({ cat("  resolving api_key\n");    paste0("key-", sample(1000, 1)) }),
  heavy_calc = quote({ cat("  resolving heavy_calc\n"); sum(1:1e5) })
))

cat("Config built. Nothing computed yet.\n")
#> Config built. Nothing computed yet.

cat("First access to db_host:\n")
cfg$db_host
#>   resolving db_host
#> [1] "db.internal:5432"

cat("Second access to db_host:\n")
cfg$db_host
#> [1] "db.internal:5432"

cat("heavy_calc is never read — never computed.\n")
#> heavy_calc is never read — never computed.
```

Three things to observe. First, building `cfg` printed nothing — no expression was evaluated yet; each became a promise. Second, the first read of `cfg$db_host` printed the "resolving" message and returned the value; the second read printed nothing, because the promise was already forced and cached. Third, `cfg$heavy_calc` never ran at all — its expression still sits in an unforced promise inside `cfg` and will never fire unless someone reads it.

The `force(k)` and `force(expr)` inside `local()` are the same closure-loop defence from Exercise 1 — without them, every `delayedAssign()` would capture the final loop values of `key` and `entries[[key]]`, and all three keys would resolve to the same expression.

## Summary

| Concept | What it is | When you notice it |
| --- | --- | --- |
| Promise | Expression + environment + value slot | Every function call |
| Lazy evaluation | Delay compute until first access | Unused arguments never run |
| `force(x)` | Evaluate a promise now, cache the result | Function factories inside loops |
| `substitute(x)` | Read the expression slot without forcing | Metaprogramming, NSE, `plot()` axis labels |
| Default arg scoping | Defaults evaluate in the *function's* environment | `function(x, n = length(x))` works |
| `h05()` trap | Same expression, different meaning as default vs supplied | Defaults that reference locals |
| Closure-loop trap | Closures share one unforced promise | `for` + function factory |
| `delayedAssign()` | Create a top-level promise by hand | Package datasets, lazy config |

## References

1. Wickham, H. *Advanced R* (2nd ed.), §6.5 Lazy evaluation. CRC Press, 2019. [Link](https://adv-r.hadley.nz/functions.html)
2. R Core Team — `force()` documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/force.html)
3. R Core Team — `delayedAssign()` documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/delayedAssign.html)
4. Gągolewski, M. *Deep R Programming*, Chapter 17: Lazy evaluation. [Link](https://deepr.gagolewski.com/chapter/340-lazy.html)
5. Fay, C. — *About lazy evaluation* (2018). [Link](https://colinfay.me/lazyeval/)
6. Mailund, T. — *Promises, their environments, and how we evaluate them*. [Link](https://mailund.dk/posts/promises-and-lazy-evaluation/)
7. R Core Team — *R Internals*, §1.3 Promise objects. [Link](https://cran.r-project.org/doc/manuals/r-release/R-ints.html)

## Continue Learning

1. **R Lexical Scoping** — the rule that tells R *where* to look up a promise's expression. Lazy evaluation decides *when*; scoping decides *where*.
2. **R Closures** — how functions remember the environment they were born in, which is exactly what makes the closure-loop trap bite (and what makes it fixable).
3. **R Environments** — the containers that promises live inside, and the thing `eval.env` in `delayedAssign()` actually points to.
