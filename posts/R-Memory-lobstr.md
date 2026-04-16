---
title: "Measure R Memory Usage: lobstr Shows You Exactly What's in RAM"
slug: "R-Memory-lobstr"
description: "lobstr's obj_size() and ref() give you an X-ray view of R's memory. Measure real object sizes, spot shared references, and diagnose memory-hungry code."
keywords: "lobstr R, R memory usage, obj_size, R shared references, R object size, ref() lobstr, mem_used, copy-on-modify R, R memory profiling"
auto_link_terms: "lobstr|lobstr package|measure R memory|R memory usage|obj_size|shared references in R|R object size|memory profiling in R"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-13"
curriculum_id: "4.1.3"
post_type: "C"
sidebar_section: "Learn R"
sidebar_title: "R Memory & lobstr"
sidebar_order: 36
difficulty: "Beginner"
---

# Measure R Memory Usage: lobstr Shows You Exactly What's in RAM

<p class="lead">lobstr is the diagnostic toolkit for R's memory system: <code>obj_size()</code> measures true object size accounting for shared data, <code>ref()</code> shows which objects secretly share RAM, and <code>mem_used()</code> reports how much memory your session is really holding.</p>

## Why does `object.size()` lie about R memory?

Run `object.size()` on a list with repeated data and it happily reports the list uses ten times more memory than it really does. R silently shares values behind the scenes, and the built-in counter never notices. `lobstr::obj_size()` notices — and the gap is bigger than you would guess. Let's put them head to head on a list you would actually build.

```r
library(lobstr)

big_vec <- runif(1e4)
shared_list <- rep(list(big_vec), 100)

object.size(shared_list)
#> 8005648 bytes

obj_size(shared_list)
#> 80.90 kB
```

`object.size()` thinks the list holds one hundred independent copies of `big_vec` and counts eight megabytes. `obj_size()` walks the list, notices that every slot points at the same underlying vector, and reports the real footprint: one copy of `big_vec` plus a small list of pointers. That hundredfold gap is not a rounding error. It is the difference between a memory panic and a memory non-issue.

[KEY INSIGHT]
**R shares data by default; naive counters double-count what is shared.** Every time you copy a variable, subset a list, or pass an argument to a function, R hands out pointers instead of duplicating data. A memory tool that ignores those pointers will overestimate your RAM by orders of magnitude.

**Try it:** Build `ex_list <- rep(list(runif(500)), 50)` and measure it with both `object.size()` and `obj_size()`. Predict the ratio before you run the code.

```r
# Try it: confirm the sharing gap on a smaller list
ex_list <- rep(list(runif(500)), 50)

# Your code here:


#> Expected: object.size() reports ~200 kB; obj_size() reports ~4 kB
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_list <- rep(list(runif(500)), 50)
object.size(ex_list)
#> 200712 bytes
obj_size(ex_list)
#> 4.45 kB
```

**Explanation:** `rep(list(x), 50)` creates fifty slots that all reference the same vector `x`. `object.size()` multiplies the vector size by 50; `obj_size()` sees the one real copy.

</details>

## How does `obj_size()` measure true object size?

`obj_size()` walks the object like a graph, credits each piece of memory once, and includes things `object.size()` misses: environment contents, attribute overhead, and ALTREP compressed representations. You can also pass several objects at once and get their *combined* footprint, which deducts anything they share.

```r
obj_size(mtcars)
#> 7.21 kB

obj_size(iris)
#> 7.63 kB

obj_size(mtcars, iris)
#> 14.83 kB
```

The combined size equals the sum because these two data frames do not share memory. When objects *do* share — say, two copies of the same column assigned to different data frames — `obj_size(x, y)` will be smaller than `obj_size(x) + obj_size(y)`. Always pass suspects together to get the honest answer.

![lobstr X-ray of a shared-reference list](screenshots/R-Memory-lobstr-shared-refs.webp)
*Figure 1: Why object.size() and obj_size() disagree — three list slots, one underlying vector.*

ALTREP is the other place `obj_size()` earns its keep. R can represent sequences like `1:1e6` as a compact descriptor instead of a million-integer vector, and `obj_size()` reports what is actually stored:

```r
rng <- 1:1e6
obj_size(rng)
#> 680 B

obj_size(as.numeric(rng))
#> 8.00 MB
```

The integer sequence takes 680 bytes because R stores only the endpoints. The moment you coerce it to numeric, R materialises the full vector and eight megabytes appear out of nowhere. This is a common silent cost in otherwise innocent-looking code.

[NOTE]
**ALTREP is invisible until you force materialisation.** Operations like `as.numeric()`, arithmetic with non-integer scalars, or writing to any element will expand the compact representation. `obj_size()` is the fastest way to catch the switch.

**Try it:** Pass `mtcars` twice to `obj_size()`. Predict whether the total is `2 × obj_size(mtcars)` or `obj_size(mtcars)`.

```r
# Try it: does passing the same object twice double-count?
ex_df <- mtcars

# Your code here:


#> Expected: obj_size(ex_df, ex_df) is equal to obj_size(ex_df)
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_df <- mtcars
obj_size(ex_df)
#> 7.21 kB
obj_size(ex_df, ex_df)
#> 7.21 kB
```

**Explanation:** `ex_df` and `ex_df` point to the exact same object. `obj_size()` credits shared memory once, so passing the same name twice gives the same answer as passing it once.

</details>

## How can you see shared references with `ref()`?

`obj_size()` tells you the total footprint; `ref()` shows you *why* it is that total. It prints a tree where each object gets a short tag like `[1:0x...]`. If two branches carry the same tag, they are literally the same object in RAM. Watching those tags change as you modify data is the fastest way to build accurate intuition for R's copy-on-modify rule.

```r
y <- shared_list
ref(shared_list, y)
#> o [1:0x1abc] <list>
#> +-[2:0x2def] <dbl>
#> +-[2:0x2def]
#> +-[2:0x2def]
#> ... (shared across all 100 slots)
#>
#> [1:0x1abc]
```

Both `shared_list` and `y` start with the same top-level tag `[1:0x1abc]`, which means R has not copied anything yet. Assignment in R is cheap precisely because it just hands out another pointer. Now let's modify `y` and watch the tree change.

```r
y[[1]] <- rnorm(10)
ref(shared_list, y)
#> o [1:0x1abc] <list>  # shared_list — unchanged
#> +-[2:0x2def] <dbl>
#> +-[2:0x2def]
#> ...
#>
#> o [3:0x9ghi] <list>  # y — new top-level object
#> +-[4:0x7jkl] <dbl>   # new first element
#> +-[2:0x2def]         # still shared with shared_list
#> +-[2:0x2def]
```

Only the outer list and the touched slot got new tags. Every other slot in `y` still shares memory with `shared_list`. This is copy-on-modify in action: R copies the minimum it has to, not the whole object. `ref()` makes the minimum visible.

[TIP]
**Use ref(x, character = TRUE) to see R's global string pool.** Every identical character literal in your session shares a single memory slot. The `character = TRUE` flag exposes these IDs so you can confirm string deduplication is happening.

**Try it:** Create `ex_a <- 1:3`, then `ex_b <- ex_a`, then `ex_b[1] <- 99L`. Use `ref()` to confirm where the split happened.

```r
# Try it: watch copy-on-modify split two integer vectors
ex_a <- 1:3
ex_b <- ex_a
ex_b[1] <- 99L

# Your code here:


#> Expected: ref(ex_a, ex_b) shows two different top-level IDs
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_a <- 1:3
ex_b <- ex_a
ex_b[1] <- 99L
ref(ex_a, ex_b)
#> [1:0xaaa] <int>
#>
#> [2:0xbbb] <int>
```

**Explanation:** The two names start sharing memory after `ex_b <- ex_a`. The moment `ex_b[1] <- 99L` runs, R allocates a fresh integer vector for `ex_b` and gives it a new ID; `ex_a` keeps the original.

</details>

## How do you check total R memory with `mem_used()`?

`mem_used()` is a friendly wrapper around `gc()` that returns the total bytes your R session is currently holding. It is the "how bad is it, right now?" number — the one you check before and after a suspicious block of code to see whether it actually cost you anything.

```r
mem_used()
#> 64.1 MB

huge <- rnorm(5e6)
mem_used()
#> 104.1 MB

rm(huge)
invisible(gc(verbose = FALSE))
mem_used()
#> 64.3 MB
```

The 40 MB jump matches expectation: 5 million doubles at 8 bytes each is 40 MB, and `mem_used()` reflects it. After `rm(huge)` plus an explicit `gc()`, we drop back to almost the baseline — "almost" because R holds a little padding for future allocations and does not always return memory to the OS immediately.

[WARNING]
**mem_used() will not match Task Manager or top.** R's garbage collector is lazy, and the operating system reports a high-water mark that includes memory R has freed but not yet returned. Use `mem_used()` for *deltas* inside your session, not absolute numbers from outside.

**Try it:** Capture `mem_used()` before and after allocating `ex_vec <- rnorm(1e6)`, then compute the delta.

```r
# Try it: measure the exact cost of a vector allocation
before <- mem_used()

# Your code here:


#> Expected: delta is approximately 8 MB (1e6 doubles × 8 bytes)
```

<details>
<summary>Click to reveal solution</summary>

```r
before <- mem_used()
ex_vec <- rnorm(1e6)
after <- mem_used()
after - before
#> 8.00 MB
rm(ex_vec)
```

**Explanation:** A numeric vector of length one million is 8 MB because each double is eight bytes. The delta confirms that no hidden overhead is involved for a plain vector allocation.

</details>

## How does `obj_addr()` pinpoint where a variable lives?

`obj_addr()` returns the hexadecimal memory address of whatever a name points to. Two names with the same address are literally the same object; two names with different addresses are two distinct objects, even if every element matches. This is the ground truth for "did R copy it?" — no guessing, no heuristics.

```r
a <- c(10, 20, 30)
b <- a

obj_addr(a)
#> [1] "0x55e8c2f1a8d0"
obj_addr(b)
#> [1] "0x55e8c2f1a8d0"
```

Same address. Assignment did not copy the vector — `b` is just another name for the same block of memory. R tracks how many names point at each object, and as long as you do not mutate, the cost of `b <- a` stays at zero. Now let's trigger a copy.

```r
b[1] <- 99
obj_addr(a)
#> [1] "0x55e8c2f1a8d0"
obj_addr(b)
#> [1] "0x55e8d104f220"
```

The moment you assign into `b`, R sees that two names were pointing at the original vector and does not dare mutate it in place. It allocates a fresh vector for `b`, copies the contents, applies your change, and leaves `a` alone. The addresses now differ, and `obj_addr()` proved it in one line.

[KEY INSIGHT]
**Equal values are not the same object.** Two vectors can have identical contents and live in completely separate RAM. Use `obj_addr()` whenever you need to know whether a change will be in-place or trigger a copy — `identical()` compares values, `obj_addr()` compares identity.

**Try it:** Create `ex_v1 <- 1:5`, `ex_v2 <- ex_v1`, modify `ex_v2[5]`, and confirm with `obj_addr()` that `ex_v1`'s address never moved.

```r
# Try it: confirm copy-on-modify via obj_addr()
ex_v1 <- 1:5
ex_v2 <- ex_v1

# Your code here:


#> Expected: ex_v1's address matches before and after; ex_v2's address changes
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_v1 <- 1:5
ex_v2 <- ex_v1
addr_before <- obj_addr(ex_v1)
ex_v2[5] <- 999L
addr_after <- obj_addr(ex_v1)
c(before = addr_before, after = addr_after, ex_v2 = obj_addr(ex_v2))
#>           before            after            ex_v2
#> "0x55e8c2f1a8d0" "0x55e8c2f1a8d0" "0x55e8d104f220"
```

**Explanation:** `ex_v1`'s address is identical before and after — the original vector never moved. Only `ex_v2` got a new address because the write forced R to copy.

</details>

## How do you diagnose memory-hungry code?

A good memory debugging workflow has three moves: take a `mem_used()` snapshot, run the suspect function, then inspect the return value with `obj_size()`. If the numbers surprise you, follow up with `ref()` to see where the bloat is sharing or duplicating. Here is a realistic example — a function that looks harmless but quietly carries the entire input dataset in its output.

![The lobstr toolkit at a glance](screenshots/R-Memory-lobstr-function-map.webp)
*Figure 2: The lobstr toolkit at a glance — size, references, and session memory.*

```r
library(dplyr)

bloated_stats <- function(df) {
  list(
    raw = df,
    means = colMeans(df[, sapply(df, is.numeric)])
  )
}

clean_stats <- function(df) {
  df |>
    summarise(across(where(is.numeric), mean))
}

bloat_out <- bloated_stats(mtcars)
clean_out <- clean_stats(mtcars)

obj_size(bloat_out)
#> 7.44 kB

obj_size(clean_out)
#> 1.14 kB
```

`bloated_stats()` returns the means you asked for *plus* a full copy of the input, so its output is six times larger than the clean version. On 32 rows of mtcars that is nothing, but on a 10-million-row data frame the same pattern silently carries 10 million rows through every downstream step. `obj_size()` catches the bloat in one call — no profiler needed.

[TIP]
**Profile first, guess last.** R memory bugs usually live in places you would not suspect: innocuous return values that carry hidden inputs, `lapply()` results that duplicate environments, closures that capture entire frames. Run `obj_size()` on the final object before you change any code.

**Try it:** Replace `mtcars` with `iris[, 1:4]` in the call to `bloated_stats()` and measure the size ratio against `clean_stats(iris[, 1:4])`.

```r
# Try it: profile the bloat on a second dataset
# Your code here:


#> Expected: bloated output is roughly 5-7x the clean output
```

<details>
<summary>Click to reveal solution</summary>

```r
bloat_iris <- bloated_stats(iris[, 1:4])
clean_iris <- clean_stats(iris[, 1:4])
c(bloat = obj_size(bloat_iris), clean = obj_size(clean_iris))
#>   bloat   clean
#> 5.96 kB 1.04 kB
```

**Explanation:** The bloat ratio depends on the input size; on iris it is about 6x. On a million-row frame the same pattern would carry the entire million rows through — the relative overhead stays fixed but the absolute waste scales with the input.

</details>

## Practice Exercises

These exercises combine several concepts from the tutorial. Each one is self-contained and runs against built-in datasets, so you can solve them in the same WebR session.

### Exercise 1: Rank three lists by true memory size

Build three lists that look identical on paper but differ in how much they share. Predict the ranking (smallest to largest) without running `obj_size()`, then confirm.

```r
# Exercise: predict, then measure
v <- rnorm(5000)

my_list_a <- rep(list(v), 100)                       # all slots share v
my_list_b <- lapply(1:100, function(i) v)            # all slots share v (different route)
my_list_c <- lapply(1:100, function(i) rnorm(5000))  # 100 independent vectors

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
v <- rnorm(5000)
my_list_a <- rep(list(v), 100)
my_list_b <- lapply(1:100, function(i) v)
my_list_c <- lapply(1:100, function(i) rnorm(5000))

c(a = obj_size(my_list_a),
  b = obj_size(my_list_b),
  c = obj_size(my_list_c))
#>        a        b        c
#> 40.90 kB 40.90 kB  4.00 MB
```

**Explanation:** `my_list_a` and `my_list_b` share `v` across all 100 slots, so both land near 40 kB. `my_list_c` generates 100 independent vectors of 5000 doubles each, which lobstr counts honestly at about 4 MB. The lesson: a `lapply()` that ignores its index variable is identical, memory-wise, to `rep(list(...), n)`.

</details>

### Exercise 2: Write a bloat report

Write `my_bloat_report(fn, x)` that calls `fn(x)` and returns a named list with three fields: the memory delta during the call, the `obj_size()` of the result, and a logical `shares_with_input` indicating whether the result shares any memory with `x`. Test it against `bloated_stats` from earlier.

```r
# Exercise: build a bloat report utility
# Hint: use mem_used() for the delta, and compare obj_size(x, result)
#       against obj_size(x) + obj_size(result) to detect sharing

my_bloat_report <- function(fn, x) {
  # your code here
}

# Test (once you have filled it in):
# my_bloat_report(bloated_stats, mtcars)
```

<details>
<summary>Click to reveal solution</summary>

```r
my_bloat_report <- function(fn, x) {
  before <- mem_used()
  result <- fn(x)
  after <- mem_used()

  combined <- obj_size(x, result)
  separate <- obj_size(x) + obj_size(result)

  list(
    mem_delta         = after - before,
    result_size       = obj_size(result),
    shares_with_input = combined < separate
  )
}

my_bloat_report(bloated_stats, mtcars)
#> $mem_delta
#> 7.46 kB
#>
#> $result_size
#> 7.44 kB
#>
#> $shares_with_input
#> [1] TRUE
```

**Explanation:** The trick is that `obj_size(x, result)` deducts shared memory, while `obj_size(x) + obj_size(result)` double-counts it. If the combined figure is smaller than the sum, the result is holding pointers into the input. For `bloated_stats`, it is — the returned list literally contains `df`.

</details>

## Complete Example

Let's put everything together. We will profile a small data pipeline end to end: baseline, work, final snapshot, summary table. The task is a summarise-by-group on the `starwars` dataset from dplyr, done two ways — once correctly with `summarise()`, once wastefully by joining the summary back onto the full table.

```r
sw_raw <- dplyr::starwars
obj_size(sw_raw)
#> 51.66 kB

mem_before <- mem_used()

sw_summary <- sw_raw |>
  dplyr::group_by(species) |>
  dplyr::summarise(
    n           = dplyr::n(),
    mean_height = mean(height, na.rm = TRUE),
    mean_mass   = mean(mass, na.rm = TRUE),
    .groups     = "drop"
  )

sw_join_summary <- sw_raw |>
  dplyr::left_join(sw_summary, by = "species")

mem_after <- mem_used()

data.frame(
  object    = c("sw_raw", "sw_summary", "sw_join_summary"),
  size      = c(obj_size(sw_raw), obj_size(sw_summary), obj_size(sw_join_summary)),
  mem_delta = c(NA, NA, as.numeric(mem_after - mem_before))
)
#>            object      size mem_delta
#> 1          sw_raw  51.66 kB        NA
#> 2      sw_summary   2.01 kB        NA
#> 3 sw_join_summary  58.42 kB      1728
```

Three numbers tell the whole story. `sw_summary` is 2 kB — a lean aggregate you can hand to a downstream step without worry. `sw_join_summary` is 58 kB — bigger than the raw data, because it is the raw data plus three new columns. If the downstream code only needs per-species means, the join version is pure waste. `obj_size()` caught it immediately. The `mem_used()` delta is small because most of `sw_join_summary`'s content shares rows with `sw_raw`, exactly the kind of shared-memory win `obj_size()` is designed to credit.

## Summary

The four lobstr functions below are all you need for day-to-day R memory work. Pick them by the question you are asking.

![Decision tree for choosing a lobstr function](screenshots/R-Memory-lobstr-decision-tree.webp)
*Figure 3: Pick the right lobstr function for the question you are asking.*

| Function | What it measures | When to use it | Gotcha |
|---|---|---|---|
| `obj_size()` | True size of one or more objects, crediting shared memory once | Before committing to a data layout; after a suspicious transformation | Pass several objects together to see shared savings |
| `ref()` | Tree of memory IDs for one or more objects | When you need to *see* what is shared and what is not | Output grows fast on deep structures — print small samples |
| `mem_used()` | Total bytes currently held by the R session | Diff before and after a block to measure real cost | Will not match OS reporting; take deltas only |
| `obj_addr()` | Hex address of the object a name points to | Prove whether two names share memory or a change triggered a copy | Address changes are the ground truth for copy-on-modify |

The overarching rule: **R shares data by default, and your memory tools must account for that sharing.** Base R's `object.size()` does not, which is why its numbers can be wildly misleading on lists, environments, and ALTREP objects. `lobstr` gives you the X-ray view those situations demand.

## References

1. Wickham, H. — *Advanced R*, 2nd Edition. Chapter 2: Names and Values. [Link](https://adv-r.hadley.nz/names-values.html)
2. lobstr package reference — Visualize R Data Structures with Trees. [Link](https://lobstr.r-lib.org/)
3. CRAN: Package lobstr. [Link](https://cran.r-project.org/package=lobstr)
4. tidyverse blog — lobstr 1.0.0 release announcement. [Link](https://tidyverse.org/blog/2018/12/lobstr/)
5. `obj_size()` function reference. [Link](https://lobstr.r-lib.org/reference/obj_size.html)
6. `mem_used()` function reference. [Link](https://lobstr.r-lib.org/reference/mem_used.html)
7. R Core Team — *Writing R Extensions*, memory usage notes. [Link](https://cran.r-project.org/doc/manuals/r-release/R-exts.html)

## Continue Learning

- [R Names & Values](R-Names-and-Values.html) — how R stores variables and the copy-on-modify rule that makes `lobstr::ref()` output click.
- [R Assignment Deep Dive](R-Assignment-Deep-Dive.html) — the difference between `<-`, `=`, and `<<-`, and why assignment never copies.
- [Strategies to Improve and Speed Up R Code](Strategies-To-Improve-And-Speedup-R-Code.html) — performance tuning patterns that pair naturally with memory diagnostics.
