---
title: "Recall() in R: Recursion Without the Function Name"
slug: "base-Recall-in-R"
description: "Use base R Recall() to make a function call itself without naming it. Covers anonymous recursion, rename-safe factorials, pitfalls, and Recall vs sys.function."
keywords: "Recall in R, base Recall, R recursion, R recursive function, Recall vs Recurse R, R anonymous recursion, sys.function R"
mathjax: false
webr: true
date: "2026-05-23"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "base-r-essentials"
fr_parent: "Functional-Programming-in-R.html"
auto_link_terms: "Recall()|base Recall|R Recall function|anonymous recursion R|recursive self call"
auto_link_case_sensitive: true
target_keyword: "Recall in R"
sibling_block_enabled: true
difficulty: "Beginner"
---

# Recall() in R: Recursion Without the Function Name

<p class="lead">The <code>Recall()</code> function in base R lets a function call itself without referring to its own name. It survives renaming, works inside anonymous functions, and is the canonical way to write rename-safe recursion in R.</p>

[QUICK ANSWER]
Recall(n - 1)                              # call enclosing fn with n - 1
fact = function(n) if (n == 0) 1 else n * Recall(n - 1)   # rename-safe factorial
(function(n) if (n == 0) 1 else n * Recall(n - 1))(5)     # recursion in an anonymous fn
Recall()                                   # error: only valid inside a function
sys.function()                             # alternative: get the current fn object
sys.call()                                 # alternative: get the call, then re-eval

[DECISION TREE: Is Recall() the right tool?]
- recursive call that survives renaming: Recall(args)
- recursion in an anonymous function: Recall(args)
- ordinary top-level recursion: just call the function by name
- iterate over a sequence (no recursion needed): for, while, or lapply()
- fold a binary fn over a list: Reduce(f, x)
- get the current function object: sys.function()
- get the active call object: sys.call() or match.call()

## What Recall() does in one sentence

**`Recall()` re-invokes the function it is called from, with whatever arguments you pass to it.** Inside `f`, `Recall(x)` is equivalent to `f(x)`, except that it looks up the function via the call stack rather than by name, so it keeps working even after you rename or reassign `f`.

`Recall` is part of base R's [functional programming](Functional-Programming-in-R.html) family. It is the only base primitive that gives a function a stable handle to itself, which matters when the function might be aliased, passed around, or wrapped in a closure.

## Syntax

**`Recall(...)`. The dots are the arguments to forward to the enclosing function; they replace the arguments of the current invocation in the next recursive call.**

```r title="Minimal recursive factorial with Recall"
fact <- function(n) {
  if (n < 2) return(1)
  n * Recall(n - 1)
}

fact(5)
#> [1] 120
```

`Recall(n - 1)` looks up the currently executing function (`fact`) and re-invokes it with `n - 1`. The lookup happens at runtime via the R call stack, not via the symbol `fact`.

[TIP]
**Always pass explicit arguments to Recall.** `Recall()` with no arguments calls the enclosing function with NO arguments, not with the current ones. There is no implicit "same args as me" behavior. Write `Recall(n - 1, acc)` in full.

## Five common patterns

### 1. Rename-safe recursion

```r title="Recursion survives a rename"
fact <- function(n) if (n < 2) 1 else n * Recall(n - 1)

old_fact <- fact          # take an alias
fact <- function(n) "I am no longer the factorial"

old_fact(5)
#> [1] 120
```

A name-based recursive call (`n * fact(n - 1)`) would now invoke the new, broken `fact`. `Recall` looks the function up via the call stack, so `old_fact(5)` still computes the factorial correctly. Use this any time a function might be reassigned, exported under a new name, or replaced in a namespace.

### 2. Anonymous recursion

```r title="Recursion inside an anonymous function"
(function(n) {
  if (n < 2) return(1)
  n * Recall(n - 1)
})(6)
#> [1] 720
```

An anonymous function has no name to call. `Recall` is the standard way to write a one-shot recursive function inline, useful in `sapply`, `Map`, or a pipeline where you do not want to commit to a top-level binding. Without `Recall`, anonymous recursion requires a Y-combinator or a named local helper.

### 3. Recursion through a higher-order wrapper

```r title="Function passed to Reduce keeps recursing via Recall"
collatz <- function(n) {
  if (n == 1) return(1L)
  next_n <- if (n %% 2 == 0) n %/% 2 else 3 * n + 1
  1L + Recall(next_n)
}

collatz(27)
#> [1] 112
```

The function counts Collatz steps to reach 1. Because `Recall` finds the enclosing function from the stack, the recursion survives even when `collatz` is later renamed, exported, or wrapped by a decorator that adds logging.

### 4. Mutual recursion stays explicit

```r title="Mutual recursion: name the OTHER function"
is_even <- function(n) if (n == 0) TRUE  else is_odd(n - 1)
is_odd  <- function(n) if (n == 0) FALSE else Recall(n - 1)

is_even(10)
#> [1] TRUE
is_odd(7)
#> [1] TRUE
```

Inside `is_odd`, `Recall(n - 1)` calls `is_odd` again, not `is_even`. `Recall` always means "the function I am currently in"; mutual recursion still needs the OTHER function by name.

### 5. Tail-shaped accumulator pattern

```r title="Accumulator-style recursion"
sum_to <- function(n, acc = 0) {
  if (n == 0) return(acc)
  Recall(n - 1, acc + n)
}

sum_to(100)
#> [1] 5050
```

R does not perform tail-call optimization, so deep recursion still grows the stack. The accumulator pattern is a stylistic choice for clarity, not a performance optimization. For large `n`, use `sum(1:n)` or a loop.

[KEY INSIGHT]
**Recall makes a function "self-aware" through the call stack, not through its name.** Name-based recursion (`f(x - 1)`) resolves at runtime via lexical scoping, which means it always finds the CURRENT binding of `f`. `Recall` resolves via the active call frame, which means it always finds the function that is actually running. That distinction is what makes Recall rename-safe.

## Recall vs sys.function vs name-based recursion

**Three ways to refer to the current function, with different trade-offs.** Name-based recursion is the most readable; `Recall` is the rename-safe one; `sys.function` returns the function object itself.

| Construct | What it returns | Survives rename? | Works in anonymous fn? |
|---|---|---|---|
| `f(x - 1)` inside `f` | Calls `f` by name | NO | NO |
| `Recall(x - 1)` | Calls the enclosing fn | YES | YES |
| `sys.function()(x - 1)` | Returns then calls the fn object | YES | YES |
| `match.call()` then `eval` | Replays the current call | YES | YES |

When to use which:

- Use the **function name** for ordinary top-level recursion. It is the most readable and the most familiar.
- Use **`Recall`** when the function might be renamed, when it is anonymous, or when it is part of an exported API where users might rebind it.
- Use **`sys.function`** when you need the function object itself, not just to call it (for introspection, currying, or memoization).
- Use **`match.call` plus `eval`** only when you need to replay the call with modified arguments and full call semantics; it is heavier than `Recall`.

[NOTE]
**`Recall` is older than closures-as-first-class-values in many languages.** It comes from S, where recursive anonymous functions were otherwise impossible. In modern R you could write a Y-combinator, but `Recall` is the idiomatic shortcut. Use it; the regulars know what it means.

## Common pitfalls

**Pitfall 1: calling Recall outside a function.** `Recall()` at the top level signals an error: "Recall called from outside a closure". It only works while a function is executing. The same error appears if you try to use `Recall` inside a `local()` block that is not itself wrapped in a function.

**Pitfall 2: forgetting to pass arguments.** `Recall()` with empty parentheses re-invokes the enclosing function with no arguments. If the function expects `n`, you get "argument 'n' is missing" on the next step, often deep in a recursive trace. The fix is to always spell out the recursive call's arguments, even when they look obvious.

**Pitfall 3: assuming Recall reads the current call's arguments.** It does not. The next call gets exactly what you put in the parentheses. There is no automatic forwarding; write each recursive call's args explicitly. If you want to forward every argument unchanged but modify one, capture them with `match.call()` first, edit the resulting call object, and `eval` it; `Recall` does not provide a shortcut for that.


[WARNING]
**`Recall` does not do tail-call optimization.** Every recursive step pushes a new R stack frame. Deep recursion (more than a few thousand levels) hits `options(expressions = ...)` limits and errors out with "evaluation nested too deeply". For deep recursion, rewrite as a loop or a vectorized operation.

## Try it yourself

**Try it:** Use `Recall` inside a function `fib` that returns the nth Fibonacci number (with `fib(0) = 0`, `fib(1) = 1`). Save `fib(10)` to `ex_fib10`.

```r title="Your turn: Fibonacci with Recall"
# Try it: Fibonacci with Recall
fib <- function(n) {
  # your code here
}

ex_fib10 <- fib(10)
ex_fib10
#> Expected: 55
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fib <- function(n) {
  if (n < 2) return(n)
  Recall(n - 1) + Recall(n - 2)
}

ex_fib10 <- fib(10)
ex_fib10
#> [1] 55
```

**Explanation:** Each call adds two recursive calls, both via `Recall`. This is the naive exponential Fibonacci; for large `n`, use memoization or the closed-form Binet formula. `Recall` keeps the function rename-safe, so wrapping it in a memoizer would still work.

</details>

## Related base R functions

After mastering `Recall`, look at:

- `sys.function()`: returns the function object currently executing
- `sys.call()` and `match.call()`: capture the current call as an expression
- `Reduce()`: iterative left-fold, often replaces shallow recursion
- `do.call()`: call a function with arguments held in a list
- `local()` and `function()`: build anonymous functions where `Recall` shines

For deep recursion that hits the stack limit, the practical fix is iteration (`for`, `while`) or a vectorized base function. See the [official Recall documentation](https://stat.ethz.ch/R-manual/R-devel/library/base/html/Recall.html) for the canonical reference.

## FAQ

**What is Recall() in R used for?**

`Recall()` lets a function call itself by referring to the call stack instead of its own name. It is used for rename-safe recursion (functions that keep working after being reassigned), recursion inside anonymous functions, and any case where you want a function to be "self-aware" without hard-coding its identifier.

**What is the difference between Recall and calling a function by name?**

A name-based recursive call like `fact(n - 1)` looks up the symbol `fact` at runtime; if `fact` has been reassigned, the call jumps to the new binding. `Recall(n - 1)` looks up the function that is actually running via the call stack, so the recursion stays inside the original function regardless of what `fact` now points to.

**Does Recall work in an anonymous function?**

Yes. That is one of its main uses. Inside `(function(n) if (n < 2) 1 else n * Recall(n - 1))(5)`, the anonymous function has no name, so name-based recursion is impossible. `Recall` finds the function via the active call frame and re-invokes it.

**Does R optimize tail calls when I use Recall?**

No. R does not perform tail-call optimization in any form, including with `Recall`. Each recursive step pushes a fresh stack frame. For deep recursion (thousands of levels), convert to a loop or use a vectorized base function. `Recall` is about identity, not performance.

**Why does Recall() give an error at the top level?**

`Recall` looks up the function in the current call frame. At the top level there is no enclosing function, so the lookup fails and R signals "Recall called from outside a closure". `Recall` is only valid inside a function body that is being executed.
