---
title: "Memoize R Functions: Cache Results and Call Expensive Code Only Once"
slug: Memoization-in-R
description: "Memoize R functions with memoise(). Cache expensive calls, speed up APIs, web scraping, and Shiny apps. Learn cache_mem, cache_disk, forget, and pitfalls."
keywords: "memoise R package, memoization in R, cache function results R, R memoise tutorial, cachem R, R function cache, memoize expensive R function, R performance optimization"
auto_link_terms: "memoization in R|memoise package|memoise()|cache_mem()|cache_disk()|forget()|cached function results|memoize R function"
auto_link_case_sensitive: true
mathjax: false
webr: true
date: 2026-04-14
curriculum_id: "4.2.7"
post_type: C
sidebar_section: "Advanced R"
sidebar_title: "Memoization in R"
sidebar_order: 7
difficulty: "Advanced"
---

# Memoize R Functions: Cache Results and Call Expensive Code Only Once

<p class="lead">Memoization makes a slow R function fast the second time you call it with the same arguments. The memoise package wraps any function in a one-liner so repeat calls return cached results in microseconds instead of recomputing.</p>

## Why is my R function slow on the second call?

Some R functions are slow for a reason. They hit an API, scrape a page, fit a model, or recurse on themselves. If you call them twice with the same input, the second call repeats all that work for no benefit. Memoization fixes that in one line. Watch what happens when we wrap a deliberately slow Fibonacci function and time two calls.

```r
library(memoise)

slow_fib <- function(n) {
  Sys.sleep(0.02)
  if (n < 2) return(n)
  slow_fib(n - 1) + slow_fib(n - 2)
}

fib_m <- memoise(slow_fib)

t1 <- system.time(fib_m(15))
t2 <- system.time(fib_m(15))
round(c(first_call = t1[["elapsed"]], second_call = t2[["elapsed"]]), 3)
#>  first_call second_call
#>      19.880       0.001
```

The first call walks the full recursion tree and sleeps on every node, taking about twenty seconds. The second call with the same argument finds the result in the cache and returns it in a millisecond. You did not change one line of `slow_fib()`. The wrapper handles the storage, lookup, and retrieval for you.

[KEY INSIGHT]
**Memoization trades memory for time.** You pay the full cost once per unique input, and every repeat call becomes a dictionary lookup. If your function is slow and often called with the same arguments, that is a free speedup.

**Try it:** Memoise a function `slow_square(x)` that sleeps a tenth of a second and returns `x^2`. Time two calls of `ex_slow_square_m(5)` and confirm the second is much faster.

```r
# Try it: memoise slow_square
slow_square <- function(x) {
  Sys.sleep(0.1)
  x^2
}

ex_slow_square_m <- NULL  # your code here

# Test (uncomment after filling the blank):
# system.time(ex_slow_square_m(5))[["elapsed"]]
# system.time(ex_slow_square_m(5))[["elapsed"]]
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_slow_square_m <- memoise(slow_square)
system.time(ex_slow_square_m(5))[["elapsed"]]
#> [1] 0.101
system.time(ex_slow_square_m(5))[["elapsed"]]
#> [1] 0.001
```

**Explanation:** `memoise()` wraps the slow function. The first call runs and caches the result; the second call returns the cached value without sleeping.

</details>

## How does memoise() cache function results?

Under the hood, `memoise()` takes your function, hashes the arguments plus the function body into a key, and looks that key up in a cache. On a miss it runs the function and stores the output. On a hit it skips the computation entirely.

![How memoise() turns a function call into a cache lookup.](screenshots/Memoization-in-R-cache-hit-miss-flow.webp)
*Figure 1: How memoise() turns a function call into a cache lookup.*

A small demonstration makes this concrete. We wrap a function that returns a single draw from `rnorm()`. Memoising it is usually a bad idea (more on that in the next section), but it is perfect for seeing the cache behaviour because the uncached output would change every call.

```r
slow_draw <- function(seed) {
  set.seed(seed)
  rnorm(1)
}

draw_m <- memoise(slow_draw)

a <- draw_m(1)
b <- draw_m(1)
c(a = a, b = b, identical = as.numeric(identical(a, b)))
#>          a          b  identical
#> -0.6264538 -0.6264538  1.0000000
```

Both calls returned the same number, because the second one never touched `rnorm()`. The cache key was built from the integer `1`, so memoise recognised it had already seen that input.

Keys are built from values, not variable names. That means passing the same value through a different variable still hits the same cache entry.

```r
n_val <- 1
identical(draw_m(n_val), draw_m(1))
#> [1] TRUE

is.memoised(draw_m)
#> [1] TRUE
is.memoised(slow_draw)
#> [1] FALSE
```

`is.memoised()` tells you whether a function has been wrapped. The plain `slow_draw` is still the original, so it returns `FALSE`. Only the wrapped copy, `draw_m`, carries a cache.

[NOTE]
**Keys are hashed with rlang::hash().** Two arguments that are `identical()` produce the same key, so `1L` and `1` count as different calls because one is integer and the other is double. If your function accepts numeric-or-integer versions of the same value, coerce before passing in.

**Try it:** Write a one-line check that returns `TRUE` when a function has been memoised and `FALSE` when it has not. Test it on both `draw_m` and `slow_draw`.

```r
# Try it: check memoisation status
ex_is_memo <- function(f) {
  # your code here
}

# Test:
# c(ex_is_memo(draw_m), ex_is_memo(slow_draw))
#> Expected: TRUE FALSE
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_is_memo <- function(f) is.memoised(f)
c(ex_is_memo(draw_m), ex_is_memo(slow_draw))
#> [1]  TRUE FALSE
```

**Explanation:** `is.memoised()` is the built-in predicate. Wrapping it in your own function adds nothing except a clearer name at the call site.

</details>

## When should you memoize and when should you avoid it?

Memoization only works when the function's output depends entirely on its arguments. That is called *referential transparency*: the same inputs must always give the same output.

Good candidates for memoization:

1. **External API calls** that return the same result for the same query
2. **Web scraping** — hitting the same URL twice is wasted bandwidth
3. **Expensive model fits in Shiny**, where users often revisit the same parameter combinations
4. **Recursive math** like Fibonacci or dynamic programming
5. **Parameter sweeps** that revisit earlier grid points
6. **SQL or BigQuery lookups** that are slow and deterministic

Bad candidates:

1. **Functions with side effects** like writing to a file or sending an email — you want those to run every time
2. **Functions that return the current time, date, or random numbers** — caching freezes the output at the first call
3. **Functions that read mutable state** like a database row that might change between calls
4. **Already-fast functions** — the hashing overhead can outweigh the saving

Here is what goes wrong when you violate referential transparency. We memoise `Sys.time()`, which should return the current time.

```r
now <- function() Sys.time()
now_m <- memoise(now)

t_first <- now_m()
Sys.sleep(1)
t_second <- now_m()
as.numeric(t_second - t_first)
#> [1] 0
```

The second call returned the same timestamp as the first. From the cache's point of view, both calls had zero arguments, so they shared a key. Memoization froze time.

[WARNING]
**Do not memoise functions with side effects or non-deterministic output.** If `f(x)` can return a different value the second time, memoise will silently return a stale answer. Audit your function with one question: "given the same inputs, is the output always the same?"

**Try it:** Predict what happens if you memoise `sample(1:10, 1)` and call it three times. Will you get three different integers or one integer repeated?

```r
# Try it: memoised sample
ex_sample_m <- memoise(function() sample(1:10, 1))

# Run it three times:
# c(ex_sample_m(), ex_sample_m(), ex_sample_m())
#> Expected: three identical integers (cached first draw)
```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(99)
ex_sample_m2 <- memoise(function() sample(1:10, 1))
c(ex_sample_m2(), ex_sample_m2(), ex_sample_m2())
#> [1] 3 3 3
```

**Explanation:** The wrapped function takes no arguments, so every call shares the same cache key. The first draw is stored; the next two calls return it unchanged. This is the exact trap the warning above describes.

</details>

## How do you persist the cache across R sessions?

By default, `memoise()` stores results in a `cache_mem()` backend. That is a fast in-memory cache capped at 512 MB that disappears when your R session ends. For long-running work that you want to survive a restart, switch to `cache_disk()`, which writes each cache entry to a folder as an RDS file.

![Picking between in-memory and on-disk caches.](screenshots/Memoization-in-R-cache-backends.webp)
*Figure 2: Picking between in-memory and on-disk caches.*

Here is a disk-backed cache in action. We point it at a temporary folder so the example is self-contained, and wrap a deliberately expensive function.

```r
library(cachem)

disk_dir <- tempfile("memo_")
expensive <- function(x) {
  Sys.sleep(0.5)
  x * 10
}

exp_m <- memoise(expensive, cache = cache_disk(dir = disk_dir))

r1 <- system.time(exp_m(7))[["elapsed"]]
r2 <- system.time(exp_m(7))[["elapsed"]]
length(list.files(disk_dir))
#> [1] 1
c(first = r1, second = r2)
#>  first second
#>  0.503  0.002
```

The first call ran the half-second sleep and dropped one file into the cache folder. The second call skipped the computation and returned the cached result. If you restart R and point a new `cache_disk()` at the same folder, the entry is still there.

You can also set a time-to-live on the cache so stale entries clear automatically. That is useful for API responses you trust for a few minutes but not forever.

```r
short_m <- memoise(
  function() Sys.time(),
  cache = cache_mem(max_age = 5)
)

v1 <- short_m()
Sys.sleep(6)
v2 <- short_m()
as.numeric(v2 - v1)
#> [1] 6.006
```

The first call cached a timestamp with a five-second shelf life. After sleeping six seconds, the key was considered stale, so the second call ran afresh and returned a new time. Without `max_age`, both calls would have returned the same timestamp, as you saw in the previous section.

[TIP]
**Share one cache between multiple memoised functions.** Create one `cache_disk()` object and pass it as the `cache =` argument to several `memoise()` calls. Keys include the function body, so collisions are impossible, and you get one place to clear everything.

**Try it:** Change the `max_age` in the snippet above from `5` to `2` seconds. What value should `Sys.sleep()` be set to so the second call is still a cache hit?

```r
# Try it: tune TTL
ex_ttl_m <- memoise(
  function() Sys.time(),
  cache = cache_mem(max_age = 2)
)

# Fill in a sleep shorter than 2 seconds, then confirm two calls return same time.
# v_a <- ex_ttl_m(); Sys.sleep(?); v_b <- ex_ttl_m()
# as.numeric(v_b - v_a)
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_ttl_m <- memoise(
  function() Sys.time(),
  cache = cache_mem(max_age = 2)
)
v_a <- ex_ttl_m()
Sys.sleep(1)
v_b <- ex_ttl_m()
as.numeric(v_b - v_a)
#> [1] 0
```

**Explanation:** A sleep of one second keeps us inside the two-second TTL window, so the second call returns the cached timestamp. Sleeping three seconds would expire the entry and force a fresh call.

</details>

## How do you invalidate or inspect a memoised function?

Sometimes you need to clear the cache deliberately. Maybe a remote API changed its data, or you want to force a recompute after tweaking a downstream formula. The memoise package gives you three tools: `forget()` to clear everything, `drop_cache()` to drop one key, and `has_cache()` to ask whether a key is already stored.

```r
life_m <- memoise(function(k) {
  Sys.sleep(0.1)
  k * 2
})

life_m(1); life_m(2); life_m(3)
has_cache(life_m)(2)
#> [1] TRUE

drop_cache(life_m)(2)
has_cache(life_m)(2)
#> [1] FALSE

forget(life_m)
has_cache(life_m)(1)
#> [1] FALSE
```

Notice the double-parenthesis pattern: `has_cache(life_m)(2)` returns a function and then calls it with the key you are asking about. The same goes for `drop_cache()`. After the first three calls we have three keys; `has_cache()(2)` confirms key `2` is present; `drop_cache()(2)` removes only that one; `forget()` wipes the whole cache.

[TIP]
**Use omit_args to ignore flags that should not affect the cache key.** If your function takes a `verbose = TRUE` argument for logging only, pass `omit_args = "verbose"` to `memoise()` so calls with `verbose = TRUE` and `verbose = FALSE` share the same cache entry.

**Try it:** Build a memoised `ex_double_m()` that returns `x * 2`, cache three values, then drop only the entry for `x = 5`. Confirm with `has_cache()` that keys `1` and `5` differ.

```r
# Try it: selective invalidation
ex_double <- function(x) x * 2
ex_double_m <- NULL  # your code here

# Test plan:
# ex_double_m(1); ex_double_m(5); ex_double_m(7)
# drop_cache(ex_double_m)(5)
# c(has_cache(ex_double_m)(1), has_cache(ex_double_m)(5))
#> Expected: TRUE FALSE
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_double_m <- memoise(ex_double)
ex_double_m(1); ex_double_m(5); ex_double_m(7)
drop_cache(ex_double_m)(5)
c(has_cache(ex_double_m)(1), has_cache(ex_double_m)(5))
#> [1]  TRUE FALSE
```

**Explanation:** `drop_cache(mf)(k)` removes only key `k`. Everything else in the cache is untouched, so key `1` is still present while key `5` is gone.

</details>

## Practice Exercises

### Exercise 1: Memoize a slow mean function

Write a function `my_slow_mean(n)` that generates a random vector of length `n` with a fixed seed and sleeps for 0.3 seconds before returning its mean. Memoise it as `my_mean_m`, run a first call to warm the cache, then time a second call and save its elapsed time as `my_result`.

```r
# Exercise 1: memoise a slow mean
# Hint: use set.seed() inside for determinism, then memoise(my_slow_mean).

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_slow_mean <- function(n) {
  set.seed(2026)
  Sys.sleep(0.3)
  mean(rnorm(n))
}
my_mean_m <- memoise(my_slow_mean)

invisible(my_mean_m(1000))
my_result <- system.time(my_mean_m(1000))[["elapsed"]]
my_result
#> [1] 0.001
```

**Explanation:** The first call pays the 0.3-second sleep and stores the mean under the key for `n = 1000`. The second call returns the stored value without sleeping, so `my_result` is effectively zero.

</details>

### Exercise 2: Disk cache with a TTL

Build a fake API function `my_api(id)` that sleeps half a second and returns `id * 100`. Wrap it with `memoise()` using `cache_disk()` and a `max_age` of 2 seconds. Call `my_api_m(1)`, sleep for three seconds, call it again, and confirm the second call was a cache miss (run time near half a second).

```r
# Exercise 2: disk cache with TTL
# Hint: cache_disk() takes max_age just like cache_mem().

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_api <- function(id) {
  Sys.sleep(0.5)
  id * 100
}

my_api_m <- memoise(
  my_api,
  cache = cache_disk(dir = tempfile("api_"), max_age = 2)
)

t_hit <- system.time(my_api_m(1))[["elapsed"]]
Sys.sleep(3)
t_miss <- system.time(my_api_m(1))[["elapsed"]]
c(first = t_hit, after_ttl = t_miss)
#>     first after_ttl
#>     0.503     0.503
```

**Explanation:** The first call pays the half-second sleep. Waiting three seconds exceeds the two-second TTL, so the cache entry expires. The second call runs from scratch and matches the first call's timing — proof the cache miss is real.

</details>

## Complete Example

Let us put everything together with a small weather-lookup workflow. Imagine `fetch_weather(city)` hits a slow API (we fake it with `Sys.sleep()`). You call it for three cities, then repeat the same query to warm the cache.

```r
fetch_weather <- function(city) {
  Sys.sleep(0.4)
  data.frame(city = city, temp_c = round(runif(1, 10, 30), 1))
}

fetch_m <- memoise(
  fetch_weather,
  cache = cache_disk(dir = tempfile("weather_"))
)

cities <- c("Chennai", "Berlin", "Tokyo")

first_pass <- system.time(lapply(cities, fetch_m))[["elapsed"]]
second_pass <- system.time(lapply(cities, fetch_m))[["elapsed"]]
round(c(first = first_pass, second = second_pass), 3)
#>  first second
#>  1.210  0.005
```

The first pass pays three API calls (three sleeps of 0.4 seconds each). The second pass reads all three results from disk in milliseconds. If you restart R and point a fresh `cache_disk()` at the same folder, the second pass is still free. That is the whole point of memoization in one example: cheap the second time, cheap after a restart, and you did not rewrite `fetch_weather()` at all.

## Summary

![Memoization in R at a glance.](screenshots/Memoization-in-R-overview-mindmap.webp)
*Figure 3: Memoization in R at a glance.*

| Concept | Takeaway | Function |
|---|---|---|
| Wrap a function | One-line speedup for repeat calls | `memoise(f)` |
| Default cache | 512 MB RAM, gone at session end | `cache_mem()` |
| Persistent cache | Files on disk, survives restarts | `cache_disk(dir = ...)` |
| Expire entries | TTL for fresh-but-not-realtime data | `max_age = N` |
| Clear everything | Nuke the cache | `forget(mf)` |
| Clear one key | Drop a single entry | `drop_cache(mf)(key)` |
| Check a key | Ask if a key is cached | `has_cache(mf)(key)` |
| Ignore an argument | Skip logging flags in the key | `omit_args = "verbose"` |
| Safety rule | Only memoise pure functions | — |

## References

1. memoise package site. [memoise.r-lib.org](https://memoise.r-lib.org/)
2. r-lib/memoise GitHub repository. [github.com/r-lib/memoise](https://github.com/r-lib/memoise)
3. memoise CRAN manual (v2.0.1). [cran.r-project.org/package=memoise](https://cran.r-project.org/web/packages/memoise/memoise.pdf)
4. cachem package site. [cachem.r-lib.org](https://cachem.r-lib.org/)
5. Wickham, H. *Advanced R*, 2nd edition. Function Factories chapter. [adv-r.hadley.nz/function-factories.html](https://adv-r.hadley.nz/function-factories.html)
6. cachem on CRAN. [cran.r-project.org/package=cachem](https://cran.r-project.org/package=cachem)
7. R-bloggers. *Optimize your R Code using Memoization*. [r-bloggers.com](https://www.r-bloggers.com/2018/10/optimize-your-r-code-using-memoization/)

## Continue Learning

- [Writing R Functions](R-Functions.html) — before you memoise a function, write one that is worth memoising.
- [R Function Factories](R-Function-Factories.html) — `memoise()` is itself a function factory; this post shows the pattern behind it.
- [Strategies to Speed Up R Code](Strategies-To-Improve-And-Speedup-R-Code.html) — memoization is one of many techniques for making slow R code fast.
