---
title: "dplyr cumany() in R: Cumulative Any-True Across a Vector"
slug: "dplyr-cumany-in-R"
description: "Use dplyr cumany() to mark every position from the first TRUE onward in a logical vector. Covers cumany vs cumall, filter idiom, NA, and 5 worked examples."
keywords: "dplyr cumany, R cumulative any, cumany vs cumall, dplyr cumulative TRUE, R running any, cumany filter, dplyr trigger window"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "cumany()|dplyr cumany|cumulative any|running any TRUE|cumany vs cumall"
auto_link_case_sensitive: true
target_keyword: "dplyr cumany"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# dplyr cumany() in R: Cumulative Any-True Across a Vector

<p class="lead">The <code>cumany()</code> function in dplyr returns FALSE until the first TRUE in a logical vector, then TRUE for every position thereafter. It is the cumulative version of <code>any()</code> and the mirror of <code>cumall()</code>.</p>

[QUICK ANSWER]
cumany(c(FALSE, FALSE, TRUE, FALSE))   # F F T T
cumany(x > 100)                         # mark from first big value onward
df |> filter(cumany(triggered))         # rows from first trigger
df |> arrange(time) |> filter(cumany(start_event))
cumall(c(TRUE, FALSE))                  # mirror: T F (until first FALSE)
which(cumany(x))[1]                     # find first TRUE position

[DECISION TREE: Is cumany() the right tool?]
- "from the first TRUE onward": cumany()
- "until the first FALSE": cumall() (mirror)
- find position of first TRUE: which.max(condition)
- count consecutive TRUEs: rle() on the input
- per-group running any: group_by + cumany
- final check (any TRUE in the whole vector): any()

## What cumany() does in one sentence

**`cumany(x)` returns FALSE for each position UNTIL the first TRUE is seen; from there onward, every position is TRUE.** It is the cumulative version of `any()`.

The opposite of `cumall()`. Together they cover "before / from first match" and "until / before first failure" idioms.

## Syntax

**`cumany(x)`. x is a logical vector. Returns a logical vector of the same length.**

```r title="Mark from first TRUE onward"
library(dplyr)

cumany(c(FALSE, FALSE, TRUE, FALSE, TRUE))
#> [1] FALSE FALSE  TRUE  TRUE  TRUE
```

[TIP]
**`filter(cumany(condition))` keeps rows from the FIRST row where condition is TRUE through the END.** It is "drop everything before the first match" rather than "keep everything where match is TRUE".

## Five common patterns

### 1. From first big value onward

```r title="Mark events after the threshold is first crossed"
x <- c(50, 60, 120, 80, 130, 70)
cumany(x > 100)
#> [1] FALSE FALSE  TRUE  TRUE  TRUE  TRUE
```

### 2. Filter from first triggered event

```r title="Drop everything before first trigger"
df <- data.frame(
  time      = 1:6,
  triggered = c(FALSE, FALSE, TRUE, FALSE, TRUE, FALSE)
)

df |>
  filter(cumany(triggered))
#>   time triggered
#> 1    3      TRUE
#> 2    4     FALSE
#> 3    5      TRUE
#> 4    6     FALSE
```

Once the trigger fires (row 3), every later row is kept regardless of subsequent trigger state.

### 3. Per-group cumany

```r title="Reset window per group"
df <- data.frame(
  user = c("a","a","a","b","b"),
  hit  = c(FALSE, TRUE, FALSE, FALSE, TRUE)
)

df |>
  group_by(user) |>
  filter(cumany(hit))
#> # A tibble: 3 x 2
#>   user  hit
#>   a     TRUE
#>   a     FALSE
#>   b     TRUE
```

### 4. Time-series "after first error" filter

```r title="Keep readings from first failure"
readings <- data.frame(
  ts    = 1:6,
  fail  = c(FALSE, FALSE, FALSE, TRUE, FALSE, TRUE)
)

readings |>
  arrange(ts) |>
  filter(cumany(fail))
```

Useful for post-incident analysis: ignore everything before the first failure.

### 5. Find position of first TRUE

```r title="Use which.max for index"
x <- c(FALSE, FALSE, TRUE, FALSE)
which.max(x)
#> [1] 3
which.max(cumany(x))
#> [1] 3
```

`which.max` on a logical vector returns the position of the first TRUE. Slightly different result from `cumany` but related semantically.

[KEY INSIGHT]
**`cumany()` is "have we seen at least one TRUE so far?".** Once the answer becomes yes, it stays yes for every subsequent position. This makes it perfect for "mark everything from event X onward" filters.

## cumany() vs cumall() vs any() vs which.max()

**Four functions for handling "first TRUE" semantics in R.**

| Function | Returns | Best for |
|---|---|---|
| `cumany(x)` | Vector: FALSE -> TRUE at first TRUE | "From first match onward" |
| `cumall(x)` | Vector: TRUE -> FALSE at first FALSE | "Until first failure" |
| `any(x)` | Single boolean | "Is there at least one TRUE?" |
| `which.max(x)` | Single integer | Position of first TRUE |
| `min(which(x))` | Single integer | Same; explicit |

When to use which:

- `cumany` to keep rows from a marker onward.
- `cumall` to drop rows after a marker.
- `any` for one-shot test.
- `which.max` to find the position only.

## A practical workflow

**The "post-event window" pattern is the cumany sweet spot.**

```r title="From first event onward"
df |>
  arrange(timestamp) |>
  filter(cumany(event_occurred))
```

Returns chronologically all rows from the first event onward. Common in:

- Customer journey analysis: from first purchase onward
- Anomaly detection: from first outlier onward
- Cohort analysis: from first signup onward

The opposite-direction filter uses cumall:

```r title="Mirror: until first failure"
df |> arrange(timestamp) |> filter(cumall(no_failure))
```

Returns rows up until the first failure.

## Common pitfalls

**Pitfall 1: order matters.** cumany reads left-to-right. Always `arrange()` first if order is meaningful.

**Pitfall 2: NA propagation.** `cumany(c(FALSE, NA, TRUE))` returns `c(FALSE, NA, TRUE)`. The NA is preserved in place. Pre-filter NAs if you want strict TRUE/FALSE results.

[WARNING]
**`filter(cumany(cond))` is NOT the same as `filter(cond)`.** filter keeps EVERY row where cond is TRUE; cumany filter keeps every row from the first TRUE onward (including subsequent FALSE rows). Different semantics.

## Try it yourself

**Try it:** From a sequence of daily login records, keep only rows from the first day the user logged in onward (drop pre-signup zeros). Save to `ex_active`.

```r title="Your turn: from first login onward"
logins <- data.frame(
  day      = 1:6,
  logged_in = c(0, 0, 1, 0, 1, 0)
)

ex_active <- logins |>
  # your code here

ex_active
#> Expected: 4 rows (day 3 onward)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_active <- logins |>
  filter(cumany(logged_in == 1))
ex_active
#>   day logged_in
#> 1   3         1
#> 2   4         0
#> 3   5         1
#> 4   6         0
```

**Explanation:** `cumany(logged_in == 1)` becomes TRUE at day 3 (first login) and stays TRUE for days 4-6 even though the user didn't log in every day.

</details>

## Related dplyr functions

After mastering cumany, look at:

- `cumall()`: mirror; "until first FALSE"
- `cummean()`: running mean
- `cumsum()`, `cumprod()`, `cummin()`, `cummax()`: base R cumulatives
- `lead()` / `lag()`: shift values for transition detection
- `rle()`: run-length encoding
- `slider` package: rolling-window operations

For window-based cumulative computations (e.g., last N days), the `slider` package is more flexible than the cumulative family.

## FAQ

**What does cumany do in dplyr?**

`cumany(x)` returns FALSE until the first TRUE in x, then TRUE for every later position. It is the running version of `any()`.

**What is the difference between cumany and cumall?**

`cumany` is "any TRUE so far": once any TRUE appears, the running result is TRUE. `cumall` is "all TRUE so far": once any FALSE appears, the running result is FALSE. Mirrors of each other.

**How do I keep rows from the first match onward?**

`df |> filter(cumany(condition))`. Sort first if order matters. The filter keeps rows from the first TRUE position onward.

**Does cumany handle NA?**

NAs propagate per position: `cumany(c(FALSE, NA, TRUE))` returns `c(FALSE, NA, TRUE)`. The NA stays in place. Pre-filter NAs for strict TRUE/FALSE behaviour.

**What is the difference between cumany and any?**

`any(x)` returns ONE boolean: TRUE if any element of x is TRUE. `cumany(x)` returns a vector of the same length: FALSE until the first TRUE, then TRUE thereafter.
