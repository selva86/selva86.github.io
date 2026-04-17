---
title: "Why R Copies Your Data (And How Copy-on-Modify Actually Saves Memory)"
slug: "R-Copy-on-Modify"
description: "R uses copy-on-modify: variables share memory until one changes. Use lobstr to see exactly when R makes real copies and when it doesn't."
keywords: "copy on modify R, R memory model, lobstr R, obj_addr R, R variable sharing, R pass by value, tracemem R"
auto_link_terms: "copy-on-modify in R|copy on modify|lobstr package|obj_addr()|tracemem()"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-11"
curriculum_id: "FR-fund-1"
post_type: "FR"
fr_parent: "R-Data-Frames.html"
difficulty: "Intermediate"
---

# Why R Copies Your Data (And How Copy-on-Modify Actually Saves Memory)

<p class="lead">R uses **copy-on-modify** semantics: when you write `y <- x`, R doesn't duplicate the data. Both names point to the same memory. R only makes an actual copy the moment one of them is modified, and sometimes not even then. This is why R can handle large objects without doubling memory on every assignment.</p>

## What actually happens when you write y <- x?

Nothing. R binds the name `y` to the same memory that `x` already points to, no data is copied. You can prove it with `lobstr::obj_addr()`, which returns the memory address an R object lives at.

```r
# install.packages("lobstr")
library(lobstr)

x <- c(10, 20, 30, 40, 50)
y <- x

obj_addr(x)
obj_addr(y)
#> [1] "0x5626b8f4c5c8"
#> [1] "0x5626b8f4c5c8"
```

Same address. `x` and `y` are two names pointing to one vector. Assigning `y <- x` was free, it didn't allocate, didn't copy, didn't touch your RAM. That's why even a 1GB data frame costs nothing to "pass around" in R as long as you're not modifying it.

![Diagram showing x and y sharing memory until y is modified, then a copy is made](screenshots/R-Copy-on-Modify-shared-binding.webp)

*Figure 1: Assignment in R is a pointer operation. A copy only happens at the exact moment one binding tries to change the shared value.*

## When does R actually make a copy?

The moment you modify one of the shared bindings. At that instant, R says "these two names can't share memory anymore" and duplicates the data so each has its own. You can watch it happen with `tracemem()`.

```r
x <- c(10, 20, 30, 40, 50)
y <- x

tracemem(x)
#> [1] "<0x5626b8f4c5c8>"

y[1] <- 99      # modifying y triggers the copy
#> tracemem[0x5626b8f4c5c8 -> 0x5626b9103e40]: 

obj_addr(x)
obj_addr(y)
untracemem(x)
#> [1] "0x5626b8f4c5c8"
#> [1] "0x5626b9103e40"
```

Two different addresses now. `x` is untouched (still at the original address); `y` got its own fresh copy with the modified value. This is "copy-on-modify" in action, R defers the expensive work until there's no choice.

[KEY INSIGHT]
The copy is lazy. If you never modify either binding, no copy ever happens. You can have ten variables pointing at one huge data frame and pay the memory cost of exactly one data frame.

## Why doesn't R copy function arguments?

Same reason, copy-on-modify. When you call `f(big_df)`, R doesn't duplicate `big_df`. The argument `big_df` inside the function is just another name bound to the same memory. Only if the function **modifies** its argument does R make a copy.

```r
library(lobstr)

big <- 1:1e6

inspect_no_modify <- function(x) {
  obj_addr(x)
}

obj_addr(big)
inspect_no_modify(big)
#> [1] "0x5626c0a1f820"
#> [1] "0x5626c0a1f820"
```

The function received `big` as its argument `x`, both names pointing at the same million-element vector. No copy, `obj_addr(x)` inside the function returns the same address as `obj_addr(big)` outside it.

```r
modify_inside <- function(x) {
  x[1] <- 99
  obj_addr(x)
}

obj_addr(big)
modify_inside(big)
obj_addr(big)        # unchanged
#> [1] "0x5626c0a1f820"
#> [1] "0x5626c1a3b500"
#> [1] "0x5626c0a1f820"
```

The moment `x[1] <- 99` runs, R makes `x` its own copy *inside the function*. The outer `big` is untouched, modifying a function argument never leaks back to the caller. This is R's version of "pass by value" without the cost of actually passing by value.

## When does R copy unnecessarily (and how do you avoid it)?

R's copy detection isn't perfect. In older R versions, certain operations would trigger copies even when nothing was really shared. Modern R (4.0+) is much smarter, but a few patterns still cost more than they should.

```r
# Growing a vector in a loop — classic pitfall
result <- c()
for (i in 1:1000) {
  result <- c(result, i^2)    # appends and potentially copies each time
}
```

Every `c(result, i^2)` creates a new longer vector. Even if R is clever about some of these, the pattern fights copy-on-modify's assumptions. Pre-allocating fixes it completely:

```r
# Pre-allocate — one allocation, in-place writes
result <- numeric(1000)
for (i in 1:1000) {
  result[i] <- i^2
}
```

Same outcome, dramatically less memory churn. The rule: if you know the final size, allocate it up front.

[TIP]
Use `lobstr::obj_size()` and `lobstr::mem_used()` to measure actual memory consumption. They account for sharing, `obj_size(x, y)` on two shared vectors is the size of *one*, not two.

```r
library(lobstr)

x <- 1:1e6
y <- x

obj_size(x)
obj_size(y)
obj_size(x, y)       # combined — but shared, so same as one
#> 680 B
#> 680 B
#> 680 B
```

Three calls, three identical numbers. `x` and `y` share memory, so their combined footprint is the footprint of one vector. That's the payoff of the whole copy-on-modify model.

## Does this apply to lists and data frames too?

Yes, and it gets more interesting. Lists and data frames are containers, they hold references to their elements. When you modify one element, R has to decide whether to copy *just that element* or the whole container.

```r
library(lobstr)

df1 <- data.frame(a = 1:3, b = 4:6)
df2 <- df1

# The data frame and its columns start shared
ref(df1, df2)
```

`lobstr::ref()` prints a tree showing which objects share memory. When you run the above on recent R versions, you'll see both data frames sharing the same underlying column vectors. Now modify a column in `df2`:

```r
df2$a[1] <- 99

ref(df1, df2)
# df1's column a is untouched; df2's column a is a new vector
# df1 and df2's column b still share memory
```

Only the changed column is duplicated. The unchanged column `b` still shares memory between `df1` and `df2`. This is why a 10-column data frame where you modify one column costs roughly 10% more memory, not 100%.

[NOTE]
In R versions before 4.0, modifying a data frame column could copy the *entire* data frame. Modern R tracks sharing per-column, which is why `dplyr::mutate()` and similar operations are so much cheaper than they used to be.

## Practice Exercises

### Exercise 1: Watch a copy happen

Use `lobstr::obj_addr()` and `tracemem()` to observe when R actually copies a vector.

```r
library(lobstr)

a <- c(1, 2, 3, 4, 5)
b <- a

# 1. Print obj_addr for both — same or different?
# 2. Modify b[2] and print addresses again
# 3. Explain what happened
```

<details>
<summary>Show solution</summary>

```r
library(lobstr)

a <- c(1, 2, 3, 4, 5)
b <- a

obj_addr(a)
obj_addr(b)
# Same address — they share memory

b[2] <- 99

obj_addr(a)
obj_addr(b)
# Different addresses — b was copied the moment it was modified
```
</details>

### Exercise 2: No copy, no cost

Write a function `peek(x)` that prints the length of `x` and returns `x` unchanged. Prove with `obj_addr()` that no copy happens when you pass a large vector to `peek`.

<details>
<summary>Show solution</summary>

```r
library(lobstr)

peek <- function(x) {
  cat("length:", length(x), "\n")
  x
}

big <- 1:1e6
obj_addr(big)
result <- peek(big)
obj_addr(result)
# Same address — no copy, because peek never modified x
```
</details>

## Summary

| Action | Causes a copy? |
|---|---|
| `y <- x` | No, both names share memory |
| `f(x)` (function call) | No, argument shares memory |
| `y[1] <- 99` | Yes, y gets its own copy |
| Modify a column in shared data frame | Only that column is copied |
| Pre-allocate then fill | No per-iteration copy |
| Grow a vector with `c()` in a loop | Repeated copies, slow |

Three things to remember:

1. **Assignment is free.** `y <- x` is a pointer operation, not a data duplication.
2. **Copies happen at the point of modification,** not before. Functions that only read data pay no copy cost.
3. **Measure, don't guess.** `lobstr::obj_addr()`, `tracemem()`, and `obj_size()` show you exactly what R is doing, no need to theorise.

## References

1. Wickham, H. *Advanced R*, 2nd ed., Chapter 2: Names and values. <https://adv-r.hadley.nz/names-values.html>
2. `lobstr` package, inspecting R's internals. <https://lobstr.r-lib.org/>
3. R Documentation: `?tracemem`, `?obj_addr`. Run in any R session.
4. R Internals manual, Memory allocation. <https://cran.r-project.org/doc/manuals/r-release/R-ints.html>

## Continue Learning

- [R Data Frames](R-Data-Frames.html), the main data structure where copy-on-modify matters most in practice.
- [Write Better R Functions](R-Functions.html), understand why you can pass big objects to functions without memory penalty.
- [R Vectors](R-Vectors.html), the building blocks that copy-on-modify operates on.
