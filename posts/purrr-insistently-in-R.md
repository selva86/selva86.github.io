---
title: "purrr insistently() in R: Retry a Call Until It Succeeds"
slug: purrr-insistently-in-R
description: "Use purrr insistently() in R to retry a flaky function until it succeeds. Examples with rate_backoff, rate_delay, the quiet argument, map(), and pitfalls."
keywords: "purrr insistently, insistently function R, purrr insistently examples, R retry function, rate_backoff R, purrr retry on error, insistently rate_delay"
mathjax: false
webr: true
date: "2026-05-15"
post_type: PSEO
category_id: function-deep
subcategory_id: purrr-functions
fr_parent: Functional-Programming-in-R.html
auto_link_terms: "insistently()|purrr insistently|purrr::insistently()|insistently() function|purrr insistently function|insistently adverb"
auto_link_case_sensitive: true
target_keyword: "purrr insistently"
sibling_block_enabled: true
difficulty: Beginner
---

# purrr insistently() in R: Retry a Call Until It Succeeds

<p class="lead">purrr insistently() wraps a function so it retries automatically after an error instead of failing. The wrapped function waits a short pause, calls the original code again, and keeps trying until it succeeds or the retry budget runs out.</p>

[QUICK ANSWER]
insistently(f)                                # retry with default backoff
insistently(f, rate_backoff(max_times = 5))   # allow up to 5 attempts
insistently(f, rate_delay(pause = 2))         # fixed 2s gap between tries
insistently(f, quiet = FALSE)                 # print each error and retry
insistently(f)()                              # build the wrapper, then call it
rate_backoff(pause_base = 1, pause_cap = 60)  # tune exponential backoff
map(urls, insistently(fetch))                 # retry inside a map

[DECISION TREE: Is insistently() the right tool?]
- retry a call that fails sometimes: insistently(f)
- pace calls without retrying: slowly(f, rate_delay(1))
- return a fallback value on error: possibly(f, otherwise = NA)
- capture errors for inspection: safely(f)
- silence warnings and messages: quietly(f)
- retry across a whole list: map(x, insistently(f))

## What purrr insistently() does

**insistently() turns a fragile function into a stubborn one.** It is a purrr adverb: you hand it a function and it returns a new function that does the same job, except it retries whenever the original raises an error. Each retry waits a short pause first. The loop ends when a call finally succeeds, or when the retry budget is exhausted and the last error is raised.

This is built for transient failures. A network request times out, an API returns a rate-limit error, a file is briefly locked. None of these are real bugs, and a second attempt a moment later usually works. `insistently()` automates that "just try again" reflex.

The catch is that `insistently()` never judges *why* a call failed. It retries on any error, transient or permanent. That makes it a precise fit for unreliable infrastructure and a poor fit for logic bugs.

## Syntax and arguments

**insistently() takes a function, a rate, and a quiet flag.** Only the first argument is required.

```r title="The insistently function signature"
library(purrr)

# insistently(f, rate = rate_backoff(), quiet = TRUE)
args(insistently)
#> function (f, rate = rate_backoff(), quiet = TRUE)
#> NULL
```

| Argument | Default | What it controls |
|---|---|---|
| `f` | (required) | The function to make retry-capable. |
| `rate` | `rate_backoff()` | A rate object setting pause length and max attempts. |
| `quiet` | `TRUE` | When `FALSE`, prints each error and the next pause. |

The `rate` argument is where the real tuning happens. Two helpers build it. `rate_backoff()` uses exponential back-off, so attempt `i` waits roughly `pause_base * 2^i` seconds, capped at `pause_cap`. `rate_delay()` uses a constant pause between every attempt. Both accept `max_times`, the hard ceiling on attempts.

`rate_backoff()` also accepts `jitter`, on by default, which adds randomness to every pause. Jitter matters when many processes retry at once: without it they all wake together and hammer the recovering service in lockstep.

[KEY INSIGHT]
**insistently() returns a function, not a result.** Like every purrr adverb, it modifies a verb. You call `insistently(f)` once to build the retrying wrapper, then call that wrapper to actually run the work.

## Retry a flaky function

**Start with a function that fails before it succeeds.** The example below fails its first two calls, then works, which mimics a connection that needs a couple of tries. The global `attempt` counter lets the function behave differently on each call, so the retry logic has something real to react to.

```r title="Build a function that fails twice"
attempt <- 0
flaky_connect <- function() {
  attempt <<- attempt + 1
  if (attempt < 3) stop("connection timed out")
  paste("connected on attempt", attempt)
}
```

Wrapping it with `insistently()` produces a function that absorbs those early failures. Here `rate_backoff()` allows up to five attempts with tiny pauses so the example runs quickly.

```r title="Wrap the function with insistently"
robust_connect <- insistently(
  flaky_connect,
  rate = rate_backoff(pause_base = 0.05, pause_cap = 0.2, max_times = 5)
)

robust_connect()
#> [1] "connected on attempt 3"
```

The first two errors never surface to the caller. With exponential back-off each wait is roughly double the last, giving a struggling service more room to recover than a fixed gap would.

To retry on a fixed interval instead of growing pauses, swap in `rate_delay()`. This suits polling, where you check a job every few seconds until it is ready. A constant interval is the right choice when the remote system defines the cadence, such as an API that asks you to poll a status endpoint at a steady rate.

```r title="Retry on a fixed delay"
attempt <- 0
poll_job <- insistently(
  flaky_connect,
  rate = rate_delay(pause = 0.05, max_times = 4)
)

poll_job()
#> [1] "connected on attempt 3"
```

By default `quiet = TRUE` hides the failures, which keeps production logs clean since a call that eventually succeeds is not a problem. Set `quiet = FALSE` while developing to watch each retry and pause as it happens.

```r title="See each error with quiet = FALSE"
attempt <- 0
loud_connect <- insistently(
  flaky_connect,
  rate = rate_backoff(pause_base = 0.05, max_times = 5),
  quiet = FALSE
)

loud_connect()
#> Error: connection timed out
#> Retrying in 0.1 seconds.
#> Error: connection timed out
#> Retrying in 0.2 seconds.
#> [1] "connected on attempt 3"
```

[TIP]
**Always set max_times explicitly.** The default `rate_backoff()` stops after three attempts. For a genuinely flaky service, raise `max_times` so a brief outage does not exhaust the budget before recovery.

## Use insistently() inside map()

**insistently() composes cleanly with the map family.** Because it returns a plain function, you can drop it straight into `map()` and every element gets its own retry loop.

```r title="Retry inside a map call"
attempt <- 0
counter <- function() {
  attempt <<- attempt + 1
  if (attempt %% 3 != 0) stop("not ready")
  attempt
}
robust_counter <- insistently(
  counter,
  rate = rate_backoff(pause_base = 0.02, max_times = 5)
)

map_dbl(1:3, ~ robust_counter())
#> [1] 3 6 9
```

Each of the three iterations retries until the counter lands on a multiple of three. One slow or flaky element no longer aborts the whole iteration. This is the everyday pattern for batch work against a network: wrap the fetch with `insistently()` and each ID retries on its own.

## insistently() vs the other purrr adverbs

**insistently() is one of five purrr adverbs for handling failure.** Pick the one that matches your intent: retry, capture, fall back, or pace.

| Adverb | On error | Returns | Use when |
|---|---|---|---|
| `insistently()` | retries `f` | result of `f`, or final error | failures are transient |
| `safely()` | captures error | list of `result` and `error` | you want to inspect every failure |
| `possibly()` | swallows error | a default `otherwise` value | a failure should not stop a pipeline |
| `slowly()` | does not handle errors | result of `f` | you must pace calls, not retry them |

The decision rule is simple. Use `insistently()` when a second attempt is likely to work. Use `possibly()` or `safely()` when an error is final and you only need to handle it gracefully. Reach for `slowly()` when the goal is rate limiting rather than recovery.

## Common pitfalls

**Three mistakes account for most insistently() trouble.** All are easy to avoid once you know them.

First, calling `insistently(f)` and expecting a value. It returns a function, so you must call the result. `insistently(f)()` runs once; assigning the wrapper to a name is clearer.

Second, retrying side effects. If `f` writes a row or sends an email, every retry repeats that action. The code below appends to a log on each failed attempt, so a function that succeeds on attempt three writes three lines.

```r title="Side effects repeat on every retry"
log_lines <- character(0)
risky_write <- function() {
  log_lines <<- c(log_lines, "wrote a line")
  if (length(log_lines) < 3) stop("disk busy")
  "saved"
}
insistently(risky_write, rate = rate_backoff(pause_base = 0.02, max_times = 5))()
length(log_lines)
#> [1] 3
```

Third, expecting `insistently()` to tell a transient error from a real bug. It cannot. It retries on *any* error, so a typo in `f` will simply be retried until the budget runs out.

[WARNING]
**Wrap only idempotent operations.** Retrying a payment, an insert, or any non-idempotent call can duplicate the effect. Make the action safe to repeat before you make it insistent.

## Try it yourself

**Try it:** Build a function `ex_unstable` that fails its first two calls and then returns "ok". Wrap it with `insistently()` allowing up to four attempts, call the wrapper, and save the result to `ex_result`.

```r title="Your turn: retry until success"
# Try it: make ex_unstable, wrap it, call it
ex_result <- # your code here

ex_result
#> Expected: "ok"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_tries <- 0
ex_unstable <- function() {
  ex_tries <<- ex_tries + 1
  if (ex_tries < 3) stop("still warming up")
  "ok"
}
ex_robust <- insistently(ex_unstable, rate = rate_backoff(pause_base = 0.02, max_times = 4))
ex_result <- ex_robust()
ex_result
#> [1] "ok"
```

**Explanation:** `insistently()` builds `ex_robust` from `ex_unstable`. The first two calls error, the third returns "ok", and the wrapper hands back that success because four attempts were allowed.

</details>

## Related purrr functions

These adverbs and helpers pair naturally with `insistently()`:

- `safely()` captures each error as a value instead of retrying.
- `possibly()` returns a fixed fallback when a call fails.
- `quietly()` captures warnings and messages alongside the result.
- `rate_backoff()` and `rate_delay()` build the `rate` object that controls pacing.
- `map()` applies a retrying function across a list or vector.

See the official [purrr insistently() reference](https://purrr.tidyverse.org/reference/insistently.html) for the full rate-helper documentation.

## FAQ

**What does insistently() do in R?**

`insistently()` takes a function and returns a modified version that retries after an error. The new function calls the original code, and if it fails, waits a short pause and tries again. Retrying continues until a call succeeds or the maximum attempts are used up. It is purrr's tool for handling transient failures such as network timeouts without writing manual retry loops.

**How many times does insistently() retry?**

The retry count comes from the `rate` object, not from `insistently()` itself. The default `rate_backoff()` allows three attempts. Pass `rate_backoff(max_times = 5)` or `rate_delay(max_times = 10)` to change the ceiling. Once the limit is reached, `insistently()` stops retrying and raises the most recent error so the failure is not hidden.

**What is the difference between insistently() and slowly()?**

Both adverbs add pauses, but for different reasons. `insistently()` retries a function after it errors, so the pause happens between failed attempts. `slowly()` does not handle errors at all; it simply inserts a delay before each call so you do not exceed a rate limit. Use `insistently()` for recovery and `slowly()` for pacing.

**Does insistently() work with map()?**

Yes. Because `insistently()` returns an ordinary function, you can pass it straight to `map()`, `map_dbl()`, or any iteration helper. Each element then gets its own independent retry loop, so a single flaky input no longer aborts the whole iteration. This is the standard pattern for retrying a request across a list of URLs or IDs.

**Can insistently() retry forever?**

You can set `rate_delay(max_times = Inf)` to retry indefinitely, but that risks an infinite loop if the function never succeeds. A finite ceiling is safer: it guarantees the call eventually returns control and surfaces the underlying error rather than hanging.
