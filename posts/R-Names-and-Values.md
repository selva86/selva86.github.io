---
title: "How R Stores Variables: The Copy-on-Modify Rule Every R User Should Know"
slug: "R-Names-and-Values"
description: "R doesn't copy data on assignment — it waits until modification. Learn R's copy-on-modify rule, when copies happen, and how to inspect memory with lobstr."
keywords: "R copy-on-modify, R names and values, R memory management, lobstr package, R reference semantics, tracemem, obj_addr, modify in place R, R variables memory"
mathjax: false
webr: true
date: "2026-04-13"
curriculum_id: "4.1.1"
post_type: "C"
sidebar_section: "Learn R"
sidebar_title: "R Names & Values"
sidebar_order: 28
auto_link_terms: "copy-on-modify|copy on modify|R names and values|reference semantics in R|modify in place|lobstr package"
auto_link_case_sensitive: false
---

# How R Stores Variables: The Copy-on-Modify Rule Every R User Should Know

<p class="lead">In R, names point to values — not the other way round. When you write <code>y &lt;- x</code>, R does <em>not</em> copy the data. It only makes a new copy when you actually modify one of them. That rule — called <strong>copy-on-modify</strong> — is why R feels both safe and, sometimes, unexpectedly slow.</p>

## What does it mean for names to point to values in R?

Most languages draw a variable like a box with a value inside. R flips that picture. The name `x` is a sticky label attached to a value sitting somewhere in memory, and two names can share the same label target. The `lobstr` package lets you look at those memory addresses directly, so you can see exactly when two names are pointing at the same thing.

```r
library(lobstr)

x <- c(1, 2, 3)
y <- x

obj_addr(x)
#> [1] "0x55d4a8c1b3d0"
obj_addr(y)
#> [1] "0x55d4a8c1b3d0"
```

Both calls print the same address. Assigning `y <- x` did not allocate a new vector or copy any numbers — it just stuck a second label on the value that already existed. The three numbers `1, 2, 3` live exactly once in memory, with two names pointing at them.

[KEY INSIGHT]
**The value doesn't have a name — the name has a value.** This is the single mental model that explains everything else on this page: assignment creates a binding from a name to an object, and several names can bind to the same object at once.

**Try it:** Create two vectors `ex_a` and `ex_b` where `ex_b` is assigned from `ex_a`. Use `obj_addr()` to confirm they share the same memory address.

```r
# Your turn — bind two names to the same value
ex_a <- 1:5
ex_b <- # your code here

obj_addr(ex_a)
obj_addr(ex_b)
#> Expected: two identical addresses
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_a <- 1:5
ex_b <- ex_a

obj_addr(ex_a)
#> [1] "0x55d4a8d02f18"
obj_addr(ex_b)
#> [1] "0x55d4a8d02f18"
```

**Explanation:** Assigning `ex_b <- ex_a` does not clone the vector. R binds the name `ex_b` to the same underlying object, and `obj_addr()` returns one address for both names.

</details>

## When does R actually copy your data?

So far, no copies. The interesting moment is when you change one of the names. The rule is simple: as soon as you modify a bound object, R makes a fresh copy for you and reroutes the affected name to the new copy. The *other* names keep pointing at the original, untouched. You can watch this happen live with `tracemem()`, which prints a line every time R copies a traced object.

![How copy-on-modify works: y <- x shares the address, modifying y allocates a new one.](screenshots/R-Names-and-Values-copy-on-modify-flow.webp)
*Figure 1: When you reassign one element of `y`, R allocates a new value and re-binds `y` to it. `x` stays put.*

```r
tracemem(y)
#> [1] "<0x55d4a8c1b3d0>"

y[1] <- 99
#> tracemem[0x55d4a8c1b3d0 -> 0x55d4a8e47a60]:

obj_addr(x)
#> [1] "0x55d4a8c1b3d0"
obj_addr(y)
#> [1] "0x55d4a8e47a60"

untracemem(y)
```

The `tracemem[OLD -> NEW]` line is R telling you "I just copied this object." `x` still lives at the original address. `y` has moved — the old label has been peeled off and stuck to a brand-new vector that happens to look like the old one, but with `99` in position one. This is copy-on-modify in one screen.

[NOTE]
**Reassignment and modification both create new objects.** Writing `y <- c(99, 2, 3)` replaces what `y` points to; writing `y[1] <- 99` also replaces it under the hood. In both cases, `x` is unaffected because `x` never owned the vector — it only pointed at it.

**Try it:** Use `tracemem()` on a new vector `ex_v`, then modify an element. Count how many `tracemem` lines print. Why that number?

```r
ex_v <- c(10, 20, 30)
# your code here — trace ex_v and change element 2

#> Expected: one tracemem line, then obj_addr shows a new address
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_v <- c(10, 20, 30)
tracemem(ex_v)
ex_v[2] <- 200
#> tracemem[0x...a -> 0x...b]:
untracemem(ex_v)
```

**Explanation:** One `tracemem` line prints because R copied the vector exactly once — on the first modification. The old value is now unreferenced and will be cleaned up by the garbage collector.

</details>

## How are lists and data frames actually copied?

Lists change the picture in one important way. A list isn't a single blob of data — it is a *container* of pointers to other objects. When you copy a list, R copies the container (the pointers) but not the things the pointers point to. This is a **shallow copy**, and the `ref()` function from `lobstr` makes it visible.

```r
lst <- list(a = 1:3, b = 4:6, c = 7:9)
ref(lst)
#> o [1:0x55d4aa001000] <list>
#> +-a = [2:0x55d4aa0013a0] <int>
#> +-b = [3:0x55d4aa001500] <int>
#> \-c = [4:0x55d4aa001660] <int>
```

Each element has its own memory address. Now clone the list and change one element — you will see that only the touched element gets a fresh address, while the others are still shared with the original.

![Modifying one element of a copied list only allocates a new address for that element.](screenshots/R-Names-and-Values-shallow-copy.webp)
*Figure 2: Changing `lst2$a` allocates a new vector for `a`. The elements `b` and `c` keep the same addresses as `lst`.*

```r
lst2 <- lst
lst2$a <- c(99, 99, 99)

ref(lst, lst2)
#> o [1:0x55d4aa001000] <list>
#> +-a = [2:0x55d4aa0013a0] <int>
#> +-b = [3:0x55d4aa001500] <int>
#> \-c = [4:0x55d4aa001660] <int>
#>
#> o [5:0x55d4aa007220] <list>
#> +-a = [6:0x55d4aa0077e0] <int>   # new address
#> +-b = [3:0x55d4aa001500] <int>   # shared with lst
#> \-c = [4:0x55d4aa001660] <int>   # shared with lst
```

Only `a` got a new address. Elements `b` and `c` still live at the same memory as in `lst` — R is re-using them between the two lists. That is the whole point of shallow copying: changing one column of a 50-column data frame should not force R to re-allocate all 50 columns.

[TIP]
**Data frames are lists of column vectors.** Every data frame is stored as a list where each element is one column. So when you run df$x <- df$x * 2, R only copies the x column — not the entire data frame. That is why column-wise work stays fast while row-wise work blows up.

**Try it:** Copy `mtcars` to `ex_mt`, change the `mpg` column to all zeros, and use `ref()` on both to confirm that only `mpg` has a new address.

```r
ex_mt <- mtcars
# your code here

ref(mtcars, ex_mt)
#> Expected: every column except mpg has the same address in both
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_mt <- mtcars
ex_mt$mpg <- rep(0, nrow(ex_mt))
ref(mtcars, ex_mt)
#> mpg has a new address; cyl, disp, hp, ... all still shared
```

**Explanation:** Only the `mpg` column was reassigned, so R allocated a fresh vector for it. The other ten columns are still the same physical objects shared by both data frames.

</details>

## When does R modify in place instead?

The copy-on-modify rule has two real exceptions, and knowing them is what separates R users from R *tuners*. The first is the single-reference optimisation: if R can prove that exactly one name points at an object, it is free to skip the copy and change the bytes in place. The second is environments, which are always reference objects and never copy at all.

```r
v <- c(10, 20, 30)

tracemem(v)
v[1] <- 99
#> (no tracemem line in most cases — modified in place)

untracemem(v)
obj_addr(v)
#> [1] "0x55d4aa009440"
```

Whether the in-place optimisation actually kicks in depends on R's internal reference counter — modern R (4.0+) tracks this more precisely than older versions, so you may see a copy in some older sessions. The takeaway: if a value has a single binding and you have not passed it through other functions, R will often skip the copy entirely.

Environments are the other exception. Every environment is a **reference object**. Assigning `e2 <- e1` does not copy the environment; it makes `e2` *another handle on the same environment*. Mutating through either handle mutates the single underlying environment. That is the only way in base R to get true pass-by-reference.

```r
e <- new.env()
e$val <- 1

bump <- function(env) {
  env$val <- env$val + 1
}

bump(e)
bump(e)
e$val
#> [1] 3
```

Calling `bump(e)` did not receive a copy of `e`. It received the same environment the caller knows about, and mutating it inside the function was visible outside. This is why environments (and packages built on them, like `R6`) are the canonical way to build mutable state in R.

[WARNING]
**Vectors and lists are pass-by-value; environments are pass-by-reference.** A function that changes a vector argument changes only its local copy. A function that changes an environment argument changes the caller's environment too. Mixing these up is a classic source of quiet bugs.

**Try it:** Write a function `ex_set_flag(env)` that sets `env$flag <- TRUE`. Call it on a fresh environment, then print `flag` from outside the function.

```r
ex_env <- new.env()
ex_set_flag <- function(env) {
  # your code here
}

ex_set_flag(ex_env)
ex_env$flag
#> Expected: [1] TRUE
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_env <- new.env()
ex_set_flag <- function(env) {
  env$flag <- TRUE
}
ex_set_flag(ex_env)
ex_env$flag
#> [1] TRUE
```

**Explanation:** Because `env` inside the function is the *same* environment as `ex_env` outside, the assignment persists. Had `ex_env` been a list instead, the caller's list would be unchanged.

</details>

## How does this affect your code's speed and memory?

Every rule you just learned has a dollar-and-cents consequence: copies cost time. A loop that modifies a data frame one cell at a time will, in the worst case, trigger one full column copy per iteration. A vectorised assignment does the same work in one copy. The difference between "slow" and "fast" R code is usually "how many hidden copies am I making?" — and `tracemem()` is how you answer that question.

```r
grow_in_loop <- function(n) {
  df <- data.frame(x = 1:n)
  df$y <- NA_integer_
  for (i in seq_len(n)) {
    df$y[i] <- df$x[i] * 2L
  }
  df
}

vectorised <- function(n) {
  df <- data.frame(x = 1:n)
  df$y <- df$x * 2L
  df
}

identical(grow_in_loop(1000), vectorised(1000))
#> [1] TRUE

obj_size(vectorised(1000))
#> 8.86 kB
```

Both functions return the same data frame. The loop version, however, rewrites `df$y` a thousand times, and each rewrite copies the `y` column. The vectorised version does it in one stroke. On a laptop the loop is roughly 10–50× slower for a thousand rows and gets dramatically worse as `n` grows. Vectorisation is not just cleaner to read — it is copy-on-modify mathematics.

The other side of the coin is that shared values are *free*. Packing the same vector into a list three times does not triple your memory — the list just holds three pointers at the same address.

```r
big <- 1:1e5
lst3 <- list(big, big, big)

obj_size(big)
#> 680 B
obj_size(lst3)
#> 680.22 kB
```

The list stores three pointers plus a tiny container, not three copies of the vector. As soon as you modify one element, that element gets copied (copy-on-modify), and the other two still share the original. This is the trick that makes tidyverse-style pipelines — where you chain transformations and re-use intermediate objects — cheap in memory.

[KEY INSIGHT]
**Every in-loop modification of a data frame triggers a fresh copy. One vectorised assignment replaces thousands of copies.** If your R code is slow, open tracemem() on the slow variable and count the lines — each one is a free speed-up you have not taken yet.

**Try it:** Rewrite the loop below as a single vectorised assignment and confirm they return the same result.

```r
ex_slow <- function() {
  out <- numeric(100)
  for (i in seq_len(100)) out[i] <- i^2
  out
}

ex_fast <- function() {
  # your code here — one line
}

identical(ex_slow(), ex_fast())
#> Expected: [1] TRUE
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_fast <- function() {
  (seq_len(100))^2
}
identical(ex_slow(), ex_fast())
#> [1] TRUE
```

**Explanation:** `seq_len(100)` gives the integers 1…100 in one go, and `^2` squares the whole vector at once. No loop, no per-element copy, one final allocation.

</details>

## Practice Exercises

These capstones combine several concepts from above. Use distinct variable names (`my_*`) so your exercise work does not clash with the tutorial objects still living in your WebR session.

### Exercise 1: Predict the addresses

Read the code below. **Before running it**, predict which of `my_a`, `my_b`, `my_c` share a memory address after all three lines execute. Then run it and verify with `obj_addr()`.

```r
my_a <- c(5, 10, 15)
my_b <- my_a
my_c <- my_a
my_c[2] <- 999

# Verify:
obj_addr(my_a)
obj_addr(my_b)
obj_addr(my_c)
# Which two share? Why?
```

<details>
<summary>Click to reveal solution</summary>

```r
my_a <- c(5, 10, 15)
my_b <- my_a
my_c <- my_a
my_c[2] <- 999

obj_addr(my_a)  #> "0x...X"
obj_addr(my_b)  #> "0x...X"
obj_addr(my_c)  #> "0x...Y"
```

**Explanation:** `my_a` and `my_b` still share the original vector because neither was modified. `my_c` triggered copy-on-modify when `my_c[2] <- 999` ran, so it now points at a fresh vector while the original is still shared by `my_a` and `my_b`.

</details>

### Exercise 2: Kill the copies in a slow function

The function below is slow because the body grows `result$col` one row at a time, and each assignment copies the column. Rewrite it so it runs in a single vectorised step. Confirm with `tracemem()` that the new version triggers far fewer copies.

```r
my_slow <- function(n) {
  result <- data.frame(id = seq_len(n))
  result$col <- 0
  for (i in seq_len(n)) {
    result$col[i] <- result$id[i] * 3 + 1
  }
  result
}

my_fast <- function(n) {
  # your code — one vectorised assignment, no loop
}

identical(my_slow(50), my_fast(50))
#> Expected: [1] TRUE
```

<details>
<summary>Click to reveal solution</summary>

```r
my_fast <- function(n) {
  result <- data.frame(id = seq_len(n))
  result$col <- result$id * 3 + 1
  result
}

identical(my_slow(50), my_fast(50))
#> [1] TRUE

# Compare tracemem output
df <- data.frame(id = seq_len(10))
tracemem(df)
df$col <- df$id * 3 + 1
untracemem(df)
```

**Explanation:** The slow version copies the `col` column once per iteration (roughly `n` copies total). The fast version does it in a single vectorised assignment, so `tracemem()` prints one line regardless of `n`.

</details>

### Exercise 3: Explain what `ref()` shows

Run the code below and use `ref(my_lst1, my_lst2)` to inspect the result. In plain English, explain which elements are shared between the two lists and why.

```r
my_lst1 <- list(p = 1:4, q = letters[1:3], r = c(TRUE, FALSE))
my_lst2 <- my_lst1
my_lst2$q <- letters[10:12]

ref(my_lst1, my_lst2)
# Write one sentence explaining what you see.
```

<details>
<summary>Click to reveal solution</summary>

```r
ref(my_lst1, my_lst2)
#> my_lst1: p[A]  q[B]  r[C]
#> my_lst2: p[A]  q[D]  r[C]
```

**Explanation:** Only `q` got a new address because only `q` was reassigned. Elements `p` and `r` still point at the original vectors that `my_lst1` created. This is a shallow copy: the list containers differ, but R is re-using every element the modification did not touch.

</details>

## Complete Example

Here is the whole story in one session. Start with a vector, clone it, modify it, and watch each address. Then do the same with a list and an environment so all four behaviours show up side by side.

```r
library(lobstr)

# 1. Vectors: shared until modified
demo_vec <- c(10, 20, 30)
demo_vec2 <- demo_vec

obj_addr(demo_vec)
#> [1] "0x...aaa"
obj_addr(demo_vec2)
#> [1] "0x...aaa"

tracemem(demo_vec2)
demo_vec2[1] <- 999
#> tracemem[0x...aaa -> 0x...bbb]:
untracemem(demo_vec2)

obj_addr(demo_vec)
#> [1] "0x...aaa"
obj_addr(demo_vec2)
#> [1] "0x...bbb"

# 2. Lists: shallow copies share elements
demo_lst <- list(v = demo_vec, w = 100:102)
demo_lst2 <- demo_lst
demo_lst2$v <- c(1, 2, 3)
ref(demo_lst, demo_lst2)
#> $v differs; $w still shared

# 3. Environments: reference semantics all the way
demo_env <- new.env()
demo_env$count <- 0
increment <- function(env) env$count <- env$count + 1
increment(demo_env)
increment(demo_env)
demo_env$count
#> [1] 2
```

Three lessons in one block: vectors copy on modify, lists copy only the touched element, environments never copy at all. If you remember nothing else from this tutorial, remember those three behaviours in that order. Every memory surprise R throws at you will fit one of them.

## Summary

![The four pillars of R's names-and-values model.](screenshots/R-Names-and-Values-overview-mindmap.webp)
*Figure 3: A one-screen recap of how R stores variables, when it copies, and when it doesn't.*

| Concept | What it means | How to check |
|---------|---------------|--------------|
| Binding | A name is a label pointing to a value | `lobstr::obj_addr()` |
| Copy-on-modify | Copies happen on change, not on assignment | `base::tracemem()` |
| Shallow copy | List/data frame copies share untouched elements | `lobstr::ref()` |
| Modify-in-place | Single-ref objects skip the copy | Compare `obj_addr` before/after |
| Reference semantics | Environments (and R6) always mutate in place | Pass to a function and re-check |

[TIP]
**Reach for lobstr::ref() whenever you are surprised.** It is the single most effective debugging tool for "why is my function slow?" and "did that really not share memory?" — more informative than `object.size()` and friendlier than `.Internal(inspect)`.

## References

1. Wickham, H. — *Advanced R*, 2nd Edition, Chapter 2: Names and Values. [Link](https://adv-r.hadley.nz/names-values.html)
2. lobstr package documentation — `obj_addr()`, `ref()`, `obj_size()`. [Link](https://lobstr.r-lib.org/)
3. R Documentation — `tracemem()` reference. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/tracemem.html)
4. Brodie Gaslam — *The Secret Lives of R Objects*: NAMED, REFCNT, and ALTREP. [Link](https://www.brodieg.com/2019/02/18/an-unofficial-reference-for-internal-inspect/)
5. R Core Team — *R Internals* manual. [Link](https://cran.r-project.org/doc/manuals/r-release/R-ints.html)
6. data.table — *Reference semantics* vignette. [Link](https://cran.r-project.org/web/packages/data.table/vignettes/datatable-reference-semantics.html)

## Continue Learning

1. **[R Data Types](R-Data-Types.html)** — Once you know where values live, the next question is what *kind* of value R thinks you have.
2. **[R Lists](R-Lists.html)** — Lists are the workhorse of the shallow-copy story; this tutorial goes deep on how they are built and indexed.
3. **[Writing R Functions](R-Functions.html)** — How function arguments use copy-on-modify, and why environments are the escape hatch when you need mutable state.
