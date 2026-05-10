---
title: "dplyr cumall() in R: Cumulative All-True Across a Vector"
slug: "dplyr-cumall-in-R"
description: "Use dplyr cumall() to track whether a logical condition has been TRUE since the start of a vector in R. Covers cumall vs cumany, filter window, 5 examples."
keywords: "dplyr cumall, R cumulative all, cumall vs cumany, dplyr cumulative TRUE, R streak detection, cumall filter window, dplyr running condition"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "cumall()|dplyr cumall|cumulative all|running TRUE|cumall vs cumany"
auto_link_case_sensitive: true
target_keyword: "dplyr cumall"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# dplyr cumall() in R: Cumulative All-True Across a Vector

<p class="lead">The <code>cumall()</code> function in dplyr returns TRUE for each position as long as ALL preceding logical values were TRUE. Once a FALSE appears, every later position is FALSE. It is the cumulative version of <code>all()</code>.</p>

[QUICK ANSWER]
cumall(c(TRUE, TRUE, FALSE, TRUE))   # T T F F
cumall(x > 0)                         # streak of positives from start
cumall(!is.na(x))                     # take rows until first NA
df |> filter(cumall(value > threshold))
df |> arrange(date) |> filter(cumall(complete))
cumany(c(FALSE, FALSE, TRUE, FALSE)) # opposite: F F T T

[DECISION TREE: Is cumall() the right tool?]
- "consecutive TRUE from the start": cumall()
- "any TRUE so far": cumany()
- streak counting (number of consecutive TRUEs): rle() + custom
- filter rows until a stopping condition: filter(cumall(condition))
- check at end: all(condition)
- per-group running TRUE: group_by + cumall

## What cumall() does in one sentence

**`cumall(x)` returns a logical vector where position `i` is TRUE if and only if `x[1] & x[2] & ... & x[i]` are all TRUE.** As soon as ONE FALSE appears, every later position is FALSE.

This is the cumulative version of `all()`. It answers: "up to this point, has every value been TRUE?" The opposite is `cumany()`.

## Syntax

**`cumall(x)`. x is a logical vector. Returns a logical vector of the same length.**

```r title="Streak of TRUEs from the start"
library(dplyr)

cumall(c(TRUE, TRUE, FALSE, TRUE, TRUE))
#> [1]  TRUE  TRUE FALSE FALSE FALSE
```

[TIP]
**`filter(cumall(condition))` keeps rows from the start of a (sorted) data frame UNTIL the first row where `condition` is FALSE.** Powerful idiom for "take rows until X happens".

## Five common patterns

### 1. Streak of positives from start

```r title="How long does the streak last?"
x <- c(5, 3, 7, -1, 4, 2)
cumall(x > 0)
#> [1]  TRUE  TRUE  TRUE FALSE FALSE FALSE
```

The streak ends at position 4 where the first negative appears.

### 2. Take rows until first NA

```r title="filter until first missing"
df <- data.frame(value = c(10, 20, NA, 30, 40))

df |>
  filter(cumall(!is.na(value)))
#>   value
#> 1    10
#> 2    20
```

Stops at the first NA. Subsequent rows are dropped even if non-NA.

### 3. Take rows below a threshold

```r title="rows where running 'in spec' holds"
df <- data.frame(measurement = c(0.1, 0.2, 0.4, 0.7, 0.3))

df |>
  filter(cumall(measurement < 0.5))
#>   measurement
#> 1         0.1
#> 2         0.2
#> 3         0.4
```

Once a value exceeds 0.5 (row 4), all subsequent rows are excluded.

### 4. Per-group cumall

```r title="Reset streak per group"
df <- data.frame(
  user = c("a","a","a","b","b"),
  ok   = c(TRUE, TRUE, FALSE, TRUE, TRUE)
)

df |>
  group_by(user) |>
  filter(cumall(ok))
#> # A tibble: 4 x 2
#>   user  ok
#>   a     TRUE
#>   a     TRUE
#>   b     TRUE
#>   b     TRUE
```

Within each user, take rows until the first FALSE.

### 5. Sorted timeline

```r title="Visits until first failure (chronological)"
events <- data.frame(
  time     = 1:6,
  success  = c(TRUE, TRUE, TRUE, FALSE, TRUE, TRUE)
)

events |>
  arrange(time) |>
  filter(cumall(success))
#>   time success
#> 1    1    TRUE
#> 2    2    TRUE
#> 3    3    TRUE
```

[KEY INSIGHT]
**`cumall()` and `cumany()` are mirrors.** `cumall(x)` is "every value up to here is TRUE"; `cumany(x)` is "at least one value up to here is TRUE". Together they let you express "until X happens" and "since X happened" idioms cleanly.

## cumall() vs cumany() vs all() vs cumsum()

**Four cumulative / aggregate logical functions in R.**

| Function | Output | Returns | Best for |
|---|---|---|---|
| `cumall(x)` | Same-length logical | Streak of TRUE from start | "Take until first FALSE" |
| `cumany(x)` | Same-length logical | TRUE once any TRUE seen | "Mark from first TRUE on" |
| `all(x)` | Single boolean | TRUE if every value TRUE | Final check |
| `any(x)` | Single boolean | TRUE if any value TRUE | Final check |
| `cumsum(x)` | Same-length numeric | Running sum | Count or accumulate |

When to use which:

- `cumall(cond)` to keep rows up to the first failing condition.
- `cumany(cond)` to keep rows from the first matching condition onward.
- `all` / `any` for end-of-vector summaries.

## A practical workflow

**The "take until / drop after" pattern is the killer use case for cumall + filter.**

```r title="Take rows until first failure"
df |>
  arrange(date) |>
  filter(cumall(in_compliance))
```

Returns rows from the start until the first non-compliant event, in chronological order. Common in audit / SLA workflows.

The mirror pattern uses cumany:

```r title="Take rows from first trigger"
df |>
  arrange(date) |>
  filter(cumany(triggered))
```

Returns rows from the first triggered event onward.

## Common pitfalls

**Pitfall 1: order matters.** cumall reads left-to-right, so the data must be in the desired order. Sort with `arrange(...)` first.

**Pitfall 2: NA handling.** `cumall(c(TRUE, NA, TRUE))` returns `c(TRUE, NA, NA)`. Once NA appears, the streak ends. Filter NAs before cumall if you don't want this.

[WARNING]
**`filter(cumall(cond))` keeps rows TILL the first FALSE; `filter(cond)` keeps ALL rows where cond is TRUE.** Subtle but completely different semantics. Make sure cumall is what you want.

## Try it yourself

**Try it:** From a sequence of integer scores, keep only the rows up to (and including) the first time the score drops below 50. Save to `ex_streak`.

```r title="Your turn: streak above threshold"
df <- data.frame(score = c(80, 75, 90, 45, 60, 70))

ex_streak <- df |>
  # your code here

ex_streak
#> Expected: 3 rows (80, 75, 90)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_streak <- df |>
  filter(cumall(score >= 50))
ex_streak
#>   score
#> 1    80
#> 2    75
#> 3    90
```

**Explanation:** `cumall(score >= 50)` is TRUE for rows 1-3, FALSE from row 4 onward (because score=45 fails). Filter keeps the TRUE rows.

</details>

## Related dplyr functions

After mastering cumall, look at:

- `cumany()`: mirror; cumulative any-TRUE
- `cummean()`: running mean
- `cumsum()`, `cumprod()`, `cummin()`, `cummax()`: base R cumulatives
- `lead()` / `lag()`: shift values for transition detection
- `rle()`: run-length encoding for streak counting
- `slider` package: rolling-window operations

For more flexible cumulative operations (rolling window, custom function), the `slider` package generalizes cumulative patterns.

## FAQ

**What does cumall do in dplyr?**

`cumall(x)` returns a logical vector where each position is TRUE if EVERY preceding value was TRUE. As soon as one FALSE appears, every later position is FALSE.

**What is the difference between cumall and all in R?**

`all(x)` returns ONE logical value: TRUE if every element of x is TRUE. `cumall(x)` returns a vector the same length as x: TRUE up to the first FALSE, then all FALSE.

**What is the difference between cumall and cumany?**

`cumall` is the running version of `all` (every value so far is TRUE). `cumany` is the running version of `any` (at least one value so far is TRUE). They are mirrors.

**How do I take rows until a condition fails?**

`df |> filter(cumall(condition))`. Sort the data first if order matters. The filter keeps rows until the first FALSE.

**Does cumall handle NA?**

Once NA appears in the input, all subsequent positions become NA in the output (because `TRUE & NA` is NA). Filter NAs first if this is unwanted.
