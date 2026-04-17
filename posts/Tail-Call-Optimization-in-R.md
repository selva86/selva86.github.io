---
title: "Tail Call Optimization in R: Recursive Functions Without Stack Overflow"
slug: "Tail-Call-Optimization-in-R"
description: "Learn how tail call optimization works in R using Tailcall(), trampolines, and accumulators. Write deep recursive functions that never hit stack overflow."
keywords: "tail call optimization R, tail recursion R, R recursive function stack overflow, Tailcall R, R trampoline recursion, tail recursive R, accumulator pattern R, R stack limit"
auto_link_terms: "tail call optimization|tail recursion|Tailcall()|trampoline pattern|tail-recursive|stack overflow in R|accumulator pattern"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-12"
curriculum_id: "FR-func-3"
post_type: "FR"
fr_parent: "Functional-Programming-in-R.html"
difficulty: "Intermediate"
---

# Tail Call Optimization in R: Recursive Functions Without Stack Overflow

<p class="lead">Tail call optimization (TCO) lets a recursive function reuse its current stack frame instead of adding a new one for each call, so your recursion runs in constant memory and never hits R's stack limit. R 4.4+ supports this natively with <code>Tailcall()</code>, and older versions can achieve the same effect with trampolines or accumulator rewrites.</p>

## Why does recursion hit a stack limit in R?

Every recursive call in R adds a frame to the call stack. Call yourself enough times and R crashes with "C stack usage is too close to the limit." Let's see this happen with a simple countdown function.

```r title="Countdown stack overflow demo"
# A recursive countdown — works fine for small n
countdown <- function(n) {
  if (n <= 0) return("done!")
  countdown(n - 1)
}

# Small n works
countdown(10)
#> [1] "done!"

# Large n crashes (uncomment to test locally):
# countdown(10000)
# Error: C stack usage 15926352 is too close to the limit
```

R printed `"done!"` for `countdown(10)`, just 10 stack frames, no problem. But at `n = 10000`, each call stacks on top of the last until R's memory limit is hit. The exact limit varies by system (typically 1,000 to 10,000 frames), but the crash is always the same.

To see the stack growing, let's peek inside a smaller recursion with `sys.nframe()`, which returns the current depth of the call stack.

```r title="Watch stack depth grow"
# Watch the stack grow with each call
show_depth <- function(n) {
  cat("n =", n, "| stack depth =", sys.nframe(), "\n")
  if (n <= 1) return(invisible(NULL))
  show_depth(n - 1)
}

show_depth(5)
#> n = 5 | stack depth = 1
#> n = 4 | stack depth = 2
#> n = 3 | stack depth = 3
#> n = 2 | stack depth = 4
#> n = 1 | stack depth = 5
```

Each call pushes one more frame onto the stack. Five calls, five frames. Ten thousand calls, ten thousand frames, and the stack runs out of space.

[KEY INSIGHT]
**The stack limit exists to protect your system.** Without it, a runaway recursion would consume all available memory and freeze your machine. The limit is a safety net, not a bug.

**Try it:** Write a recursive function `ex_sum_to(n)` that returns the sum of integers from 1 to n (e.g., `ex_sum_to(5)` returns 15). Test it with n = 5.

```r title="Exercise: Recursive sum to n"
# Try it: write ex_sum_to()
ex_sum_to <- function(n) {
  # your code here
}

# Test:
ex_sum_to(5)
#> Expected: 15
```

<details>
<summary>Click to reveal solution</summary>

```r title="Recursive sum solution"
ex_sum_to <- function(n) {
  if (n <= 1) return(n)
  n + ex_sum_to(n - 1)
}
ex_sum_to(5)
#> [1] 15
```

**Explanation:** Each call adds `n` to the result of `ex_sum_to(n - 1)` until the base case returns 1. This works for small n but would crash for large values because `n + ex_sum_to(n - 1)` means the addition happens *after* the recursive call returns, R must keep every frame alive.

</details>

## What makes a function tail-recursive?

A function is tail-recursive when the recursive call is the very last thing it does, nothing happens after the call returns. This distinction matters because only tail-recursive functions can be optimized to reuse their stack frame.

Let's compare two versions of factorial. First, the standard (non-tail-recursive) version.

```r title="Non-tail-recursive factorial"
# NOT tail-recursive: multiplication happens AFTER the recursive call
factorial_bad <- function(n) {
  if (n <= 1) return(1)
  n * factorial_bad(n - 1)   # must wait for result, then multiply
}

factorial_bad(10)
#> [1] 3628800
```

The line `n * factorial_bad(n - 1)` means R can't discard the current frame, it needs to stick around so it can multiply `n` by whatever the recursive call returns. Every frame waits for the one below it.

Now here's the tail-recursive version. The trick is to move the multiplication *into* a parameter called an accumulator.

```r title="Tail-recursive factorial with accumulator"
# Tail-recursive: the recursive call IS the last operation
factorial_acc <- function(n, acc = 1) {
  if (n <= 1) return(acc)
  factorial_acc(n - 1, acc * n)  # nothing happens after this call
}

factorial_acc(10)
#> [1] 3628800
```

Both produce 3628800, but the second version carries the running product forward in `acc`. When `factorial_acc(n - 1, acc * n)` returns, there's nothing left to do, the current frame is truly finished. That's what makes it eligible for tail call optimization.

[TIP]
**The accumulator trick works for any "build up a result" recursion.** Move the pending computation into an extra parameter with a sensible default (usually 0 for sums, 1 for products, or an empty vector for collections).

**Try it:** The function `ex_power(base, exp)` below is NOT tail-recursive. Rewrite it with an accumulator parameter so the recursive call is the last operation.

```r title="Exercise: Power with accumulator"
# Original (not tail-recursive):
# ex_power <- function(base, exp) {
#   if (exp == 0) return(1)
#   base * ex_power(base, exp - 1)
# }

# Rewrite with accumulator:
ex_power <- function(base, exp, acc = 1) {
  # your code here
}

# Test:
ex_power(2, 10)
#> Expected: 1024
```

<details>
<summary>Click to reveal solution</summary>

```r title="Power accumulator solution"
ex_power <- function(base, exp, acc = 1) {
  if (exp <= 0) return(acc)
  ex_power(base, exp - 1, acc * base)
}
ex_power(2, 10)
#> [1] 1024
```

**Explanation:** Instead of multiplying *after* the recursive call returns, we multiply into `acc` *before* making the call. The result travels forward, not backward.

</details>

## How does Tailcall() work in base R?

R 4.4.0 introduced `Tailcall()`, a base R function that tells the interpreter: "replace my current stack frame with this new call." No packages needed, just wrap your recursive call in `Tailcall()` and R handles the rest.

```r title="Factorial with base Tailcall"
# Factorial with Tailcall() — handles huge n without stack overflow
factorial_tc <- function(n, acc = 1) {
  if (n <= 1) return(acc)
  Tailcall(factorial_tc, n - 1, acc * n)
}

factorial_tc(10)
#> [1] 3628800

# This would crash with regular recursion, but Tailcall() handles it:
# factorial_tc(100000)  # runs fine on R 4.4+ (returns Inf due to numeric overflow)
```

`Tailcall(factorial_tc, n - 1, acc * n)` does the same thing as `factorial_tc(n - 1, acc * n)`, but instead of pushing a new frame, it *replaces* the current one. The stack stays at depth 1 no matter how deep the recursion goes.

Let's also fix our crashing countdown from the first section.

```r title="Countdown with Tailcall"
# Countdown with Tailcall() — no stack overflow
countdown_tc <- function(n) {
  if (n <= 0) return("done!")
  Tailcall(countdown_tc, n - 1)
}

countdown_tc(100)
#> [1] "done!"

# countdown_tc(1000000)  # works on R 4.4+ — try locally
```

The function is identical in structure to our original `countdown`, but wrapping the recursive call in `Tailcall()` keeps the stack flat.

[WARNING]
**Tailcall() is experimental in R 4.4.** It works reliably, but stack traces from `traceback()` won't show replaced frames. This makes debugging harder, if something goes wrong inside deep recursion, you'll only see the last call, not the chain that led to it.

[NOTE]
**Tailcall() requires R >= 4.4.0.** Check your version with `R.version.string`. If you're on an older version, the trampoline pattern (next section) gives you the same stack safety on any R version.

**Try it:** Write a function `ex_count_digits(n, acc = 0)` that counts how many digits are in a positive integer using `Tailcall()`. Hint: repeatedly divide by 10 until n reaches 0.

```r title="Exercise: Count digits with Tailcall"
# Try it: count digits with Tailcall()
ex_count_digits <- function(n, acc = 0) {
  # your code here
}

# Test:
ex_count_digits(123456)
#> Expected: 6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Digit count solution"
ex_count_digits <- function(n, acc = 0) {
  if (n == 0) return(acc)
  Tailcall(ex_count_digits, n %/% 10, acc + 1)
}
ex_count_digits(123456)
#> [1] 6
```

**Explanation:** Each call strips the last digit via integer division (`%/% 10`) and increments the counter. `Tailcall()` ensures no stack growth even for numbers with millions of digits.

</details>

## What is the trampoline pattern and when should you use it?

A trampoline wraps recursion in a while loop. Instead of calling itself directly, the function returns a description of the next call (a "thunk"). The loop keeps evaluating thunks until a final value appears. This works on any R version with no special functions, just 8 lines of setup.

Here's a minimal trampoline implementation based on Jim Hester's elegant pattern.

```r title="Build a trampoline helper"
# The trampoline: a loop that evaluates deferred recursive calls
trampoline <- function(f, ...) {
  function(...) {
    ret <- f(...)
    while (inherits(ret, "recursion")) {
      ret <- eval(as.call(c(f, unclass(ret))))
    }
    ret
  }
}

# recur() marks a call as "not done yet — call me again with these args"
recur <- function(...) {
  structure(list(...), class = "recursion")
}
```

`trampoline()` wraps a function so that instead of recursing directly, it checks: "did the function return a `recur()` object?" If yes, call again with those arguments. If no, we're done. The while loop replaces the call stack.

Now let's use it for factorial.

```r title="Factorial via trampoline"
# Factorial with the trampoline — works for any depth
factorial_tramp <- trampoline(function(n, acc = 1) {
  if (n <= 1) acc
  else recur(n - 1, acc * n)
})

factorial_tramp(10)
#> [1] 3628800

factorial_tramp(5000)
#> [1] Inf
```

`factorial_tramp(5000)` returns `Inf` (the number is too large for R's double-precision floating point), but it doesn't crash, the stack stays flat because the while loop does all the iteration.

The trampoline really shines with mutual recursion, where two functions call each other. Here's a classic: checking whether a number is even or odd using only subtraction by 1.

```r title="Mutual recursion trampoline"
# Mutual recursion with trampolines
trampoline2 <- function(f, ...) {
  function(...) {
    ret <- f(...)
    while (is.function(ret)) ret <- ret()
    ret
  }
}

is_even_t <- trampoline2(function(n) {
  if (n == 0) TRUE
  else function() is_odd_t(n - 1)
})

is_odd_t <- trampoline2(function(n) {
  if (n == 0) FALSE
  else function() is_even_t(n - 1)
})

is_even_t(4)
#> [1] TRUE

is_odd_t(7)
#> [1] TRUE
```

Each function returns a zero-argument function (a thunk) instead of calling the other directly. The trampoline loop evaluates thunks until it gets a non-function value. No stack growth, no matter how large the number.

[KEY INSIGHT]
**A trampoline converts recursion into iteration without you having to rewrite the algorithm as a loop.** The recursive structure stays readable, you just swap direct calls for `recur()` or thunk returns.

**Try it:** Use the `trampoline` and `recur` functions defined above to write a `ex_collatz(n, steps = 0)` function that counts how many steps it takes to reach 1 in the Collatz sequence (if even, divide by 2; if odd, multiply by 3 and add 1).

```r title="Exercise: Collatz step counter"
# Try it: Collatz step counter with trampoline
ex_collatz <- trampoline(function(n, steps = 0) {
  # your code here
})

# Test:
ex_collatz(27)
#> Expected: 111
```

<details>
<summary>Click to reveal solution</summary>

```r title="Collatz solution"
ex_collatz <- trampoline(function(n, steps = 0) {
  if (n == 1) steps
  else if (n %% 2 == 0) recur(n / 2, steps + 1)
  else recur(3 * n + 1, steps + 1)
})
ex_collatz(27)
#> [1] 111
```

**Explanation:** The Collatz sequence starting at 27 takes 111 steps to reach 1. Without the trampoline, this would require 111 stack frames, manageable here, but some starting values need thousands of steps.

</details>

## How do you choose between Tailcall(), trampolines, and loops?

Each approach has trade-offs. Let's compare them on the same problem: summing integers from 1 to n.

```r title="Compare three tail-call approaches"
# Approach 1: Tailcall() (R 4.4+ only)
sum_tc <- function(n, acc = 0) {
  if (n <= 0) return(acc)
  Tailcall(sum_tc, n - 1, acc + n)
}

# Approach 2: Trampoline (any R version)
sum_tramp <- trampoline(function(n, acc = 0) {
  if (n <= 0) acc
  else recur(n - 1, acc + n)
})

# Approach 3: Plain loop (any R version)
sum_loop <- function(n) {
  acc <- 0
  for (i in seq_len(n)) acc <- acc + i
  acc
}

# All three produce the same result
sum_tc(100)
#> [1] 5050

sum_tramp(100)
#> [1] 5050

sum_loop(100)
#> [1] 5050
```

All three return 5050. The difference is in performance and portability. Here's a decision matrix to help you choose.

| Approach | R Version | Stack Usage | Speed | Readability | Mutual Recursion |
|---|---|---|---|---|---|
| Regular recursion | Any | O(n), crashes | Fast | High | Yes |
| Accumulator only | Any | Still O(n) without TCO | Fast | Medium | No |
| `Tailcall()` | 4.4+ | O(1) | Fast | High | Limited |
| Trampoline | Any | O(1) | Slower (overhead) | Medium | Yes |
| Plain loop | Any | O(1) | Fastest | Lower | No |

[TIP]
**For production code on R < 4.4, use the trampoline.** For R 4.4+, prefer `Tailcall()` for simplicity. For performance-critical hot paths where readability matters less, write a plain loop. And remember: R's vectorized operations like `sum(1:n)` are almost always faster than any of these.

**Try it:** You're writing a tree-traversal function on R 4.2 where two functions call each other (process a node, then process its children). Which approach would you use: `Tailcall()`, a trampoline, or a plain loop? Write your answer as a comment.

```r title="Exercise: Choose approach on R 4.2"
# Try it: which approach for mutual recursion on R 4.2?
# Write your reasoning as a comment:
# Answer:
```

<details>
<summary>Click to reveal solution</summary>

```r title="Approach choice solution"
# Answer: Trampoline
# Reasoning:
# - Tailcall() requires R 4.4+ — not available on R 4.2
# - Plain loops can't naturally express mutual recursion
# - Trampolines handle mutual recursion elegantly (as shown
#   with is_even_t / is_odd_t) and work on any R version
```

**Explanation:** Trampolines are the only approach that supports mutual recursion on R < 4.4. The thunk-returning pattern lets two functions bounce between each other without growing the stack.

</details>

## Practice Exercises

### Exercise 1: Greatest Common Divisor with Tailcall()

Euclid's algorithm finds the greatest common divisor (GCD) of two numbers: if `b` is 0, the GCD is `a`; otherwise, the GCD of `a` and `b` is the GCD of `b` and `a %% b`. Implement this using `Tailcall()`.

```r title="Exercise: GCD with Tailcall"
# Exercise: implement gcd() with Tailcall()
# Hint: the recursive case is gcd(b, a %% b)
my_gcd <- function(a, b) {
  # your code here
}

# Test:
# my_gcd(270, 192) should return 6
# my_gcd(48, 18) should return 6
```

<details>
<summary>Click to reveal solution</summary>

```r title="GCD solution"
my_gcd <- function(a, b) {
  if (b == 0) return(a)
  Tailcall(my_gcd, b, a %% b)
}
my_gcd(270, 192)
#> [1] 6
my_gcd(48, 18)
#> [1] 6
```

**Explanation:** Euclid's algorithm is naturally tail-recursive, the recursive call `gcd(b, a %% b)` is already the last operation. Wrapping in `Tailcall()` lets it handle arbitrarily large inputs without stack overflow.

</details>

### Exercise 2: Flatten a Nested List

Write a function that flattens an arbitrarily nested list into a single vector. Since list flattening branches into sublists, a manual stack-based approach (inspired by the trampoline idea of converting recursion to iteration) works best.

```r title="Exercise: Flatten nested list"
# Exercise: flatten a nested list
# Hint: use a stack (list) to track elements to process
my_flatten <- function(lst) {
  # your code here
}

# Test:
# my_flatten(list(1, list(2, list(3, 4)), 5))
# should return: c(1, 2, 3, 4, 5)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Flatten solution"
my_flatten <- function(lst) {
  result <- c()
  stack <- list(lst)
  while (length(stack) > 0) {
    current <- stack[[1]]
    stack <- stack[-1]
    if (is.list(current)) {
      stack <- c(rev(current), stack)
    } else {
      result <- c(result, current)
    }
  }
  result
}

my_flatten(list(1, list(2, list(3, 4)), 5))
#> [1] 1 2 3 4 5

my_flatten(list(list(list(1)), 2, list(3, list(4, list(5)))))
#> [1] 1 2 3 4 5
```

**Explanation:** List flattening isn't purely tail-recursive (you branch into sublists), so a manual stack-based loop works best. We push list elements onto a stack and pop them off one at a time, collecting non-list values into the result.

</details>

### Exercise 3: Binary Search with Tailcall()

Implement a binary search on a sorted vector using `Tailcall()`. The function should return the index of the target value, or `NA` if not found.

```r title="Exercise: Binary search with Tailcall"
# Exercise: binary search with Tailcall()
# Hint: track low and high indices as parameters
my_bsearch <- function(vec, target, low = 1, high = length(vec)) {
  # your code here
}

# Test:
# my_bsearch(1:100, 73) should return 73
# my_bsearch(c(2, 5, 8, 12, 16, 23, 38, 56, 72, 91), 23) should return 6
# my_bsearch(1:100, 101) should return NA
```

<details>
<summary>Click to reveal solution</summary>

```r title="Binary search solution"
my_bsearch <- function(vec, target, low = 1, high = length(vec)) {
  if (low > high) return(NA)
  mid <- (low + high) %/% 2
  if (vec[mid] == target) return(mid)
  if (vec[mid] < target) {
    Tailcall(my_bsearch, vec, target, mid + 1, high)
  } else {
    Tailcall(my_bsearch, vec, target, low, mid - 1)
  }
}

my_bsearch(1:100, 73)
#> [1] 73

my_bsearch(c(2, 5, 8, 12, 16, 23, 38, 56, 72, 91), 23)
#> [1] 6

my_bsearch(1:100, 101)
#> [1] NA
```

**Explanation:** Binary search is naturally tail-recursive, each call narrows the search window without needing to do anything after the recursive call returns. `Tailcall()` ensures the stack stays flat even when searching through millions of elements.

</details>

## Putting It All Together

Let's build something practical: a recursive string repeater that concatenates a string `n` times. We'll start with naive recursion, see it fail, convert to tail-recursive form, and then protect it with `Tailcall()`.

```r title="Naive recursive string repeater"
# Step 1: Naive recursion — crashes for large n
repeat_str <- function(s, n) {
  if (n <= 0) return("")
  paste0(s, repeat_str(s, n - 1))  # NOT tail-recursive: paste0 wraps the call
}

repeat_str("ab", 5)
#> [1] "ababababab"

# repeat_str("ab", 10000)  # would crash — stack overflow
```

The `paste0()` call wraps the recursion, so each frame must wait. Let's add an accumulator.

```r title="Accumulator string repeater"
# Step 2: Accumulator makes it tail-recursive
repeat_str_acc <- function(s, n, acc = "") {
  if (n <= 0) return(acc)
  repeat_str_acc(s, n - 1, paste0(acc, s))  # tail position now
}

repeat_str_acc("ab", 5)
#> [1] "ababababab"

# Still crashes for large n — R doesn't optimize automatically
# repeat_str_acc("ab", 10000)  # stack overflow
```

The structure is right, but plain R doesn't optimize it. Let's add `Tailcall()`.

```r title="Tailcall stack-safe repeater"
# Step 3: Tailcall() makes it stack-safe
repeat_str_tc <- function(s, n, acc = "") {
  if (n <= 0) return(acc)
  Tailcall(repeat_str_tc, s, n - 1, paste0(acc, s))
}

repeat_str_tc("ab", 5)
#> [1] "ababababab"

# Now handles huge n (on R 4.4+):
# nchar(repeat_str_tc("ab", 100000))  # returns 200000
```

Three versions, same result for small inputs. But only the `Tailcall()` version survives at scale. The pattern is always the same: identify the pending work, move it into an accumulator, then wrap the recursive call in `Tailcall()`.

## Summary

![Regular recursion grows the stack with each call (left), while tail call optimization reuses a single frame (right).](screenshots/Tail-Call-Optimization-in-R-stack-comparison.webp)
*Figure 1: Regular recursion grows the stack with each call (left), while tail call optimization reuses a single frame (right).*

| Approach | R Version | Stack | Best For |
|---|---|---|---|
| Regular recursion | Any | O(n), crashes at depth limit | Prototyping, small inputs only |
| Accumulator rewrite | Any | Still O(n) without TCO | Preparing code for `Tailcall()` |
| `Tailcall()` | 4.4+ | O(1) | Production tail-recursive code |
| Trampoline | Any | O(1) | Pre-4.4 R, mutual recursion |
| Plain loop | Any | O(1) | Performance-critical hot paths |

Key takeaways:

- **Recursion crashes** when the call stack exceeds R's limit (typically 1,000 to 10,000 frames)
- **Tail-recursive** means the recursive call is the *last* operation, no pending work after it returns
- **The accumulator pattern** converts non-tail-recursive functions to tail-recursive by carrying results forward
- **Tailcall()** (R 4.4+) replaces the current stack frame, giving O(1) stack usage
- **Trampolines** achieve the same effect on any R version by converting recursion into a while loop
- For most R work, **vectorized operations** like `sum()`, `cumsum()`, and `Reduce()` are faster than any recursive approach

## References

1. R Core Team, `Tailcall` and `Exec` documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/Tailcall.html)
2. Wickham, H., *Advanced R*, 2nd Edition. Chapter 6: Functions. [Link](https://adv-r.hadley.nz/functions.html)
3. Jumping Rivers, What's New in R 4.4.0. [Link](https://www.jumpingrivers.com/blog/whats-new-r44/)
4. Hester, J., Tail Recursion in R with Trampolines. [Link](https://tailrecursion.com/wondr/posts/tail-recursion-in-r.html)
5. Dinnager, R., trampoline: Make Functions that Can Recurse Infinitely. [Link](https://rdinnager.github.io/trampoline/)
6. Mailund, T., tailr: Automatic Tail Recursion Optimisation. [Link](https://mailund.github.io/tailr/)
7. Wikipedia, Tail call. [Link](https://en.wikipedia.org/wiki/Tail_call)

## Continue Learning

1. [Functional Programming in R](Functional-Programming-in-R.html), The parent guide covering closures, higher-order functions, and the functional mindset that makes tail recursion natural.
2. [Memoization in R](Memoization-in-R.html), Another technique for making recursive functions efficient, cache results so you never compute the same subproblem twice.
3. [Reduce, Filter, Map in R](Reduce-Filter-Map-in-R.html), Base R's functional triad that often replaces explicit recursion entirely with cleaner, vectorized alternatives.
