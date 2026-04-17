---
title: "R Error: 'replacement has length zero', The Hidden NA That Breaks Assignment"
slug: "R-Error-Replacement-Length"
description: "R error 'replacement has length zero' means the right side of your assignment returned nothing. Diagnose empty filters, missing lookups, and NA indexes fast."
keywords: "replacement has length zero, R assignment error, R zero length, R empty filter, R missing lookup, R integer zero, R which NA, R grep no match"
auto_link_terms: "replacement has length zero|zero length replacement|R zero length assignment|length zero subscript|replacement length zero error"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-13"
curriculum_id: "ERR4"
post_type: "FR"
fr_parent: "R-Common-Errors.html"
difficulty: "Intermediate"
---

# R Error: 'replacement has length zero', The Hidden NA That Breaks Assignment

<p class="lead"><code>Error in x[i] &lt;- value : replacement has length zero</code> means the right side of your assignment evaluated to <em>nothing</em>, a <code>NULL</code>, an empty vector, or a missing index, so R has no value to place into <code>x[i]</code>. It almost always traces back to a filter, lookup, or subscript that silently returned zero rows.</p>

## What does "replacement has length zero" actually mean?

The error fires when R tries to execute `x[i] <- value` and finds that `value` has length zero. The assignment slot still expects one concrete element, so R refuses and throws. The tricky part is that the right-hand side rarely *looks* empty, it came from a filter, a `grep()`, a `which()`, or a lookup whose key was not in the table. Reproducing the failure in a familiar `for` loop makes the mechanism obvious.

Reproduce it with a short `for` loop that pulls ages from a lookup table, two of the three keys match, one does not:

```r title="Reproduce the zero-length assignment error"
people     <- c("Alice", "Bob", "Charlie")
ages_table <- data.frame(
  name = c("Alice", "Charlie"),
  age  = c(30, 25)
)

ages <- numeric(length(people))
for (i in seq_along(people)) {
  ages[i] <- ages_table$age[ages_table$name == people[i]]
}
#> Error in ages[i] <- ages_table$age[ages_table$name == people[i]] :
#>   replacement has length zero
```

The loop runs fine for Alice (`i = 1`) because `ages_table$age[ages_table$name == "Alice"]` returns `30`, a length-1 vector that fits neatly into `ages[1]`. On Bob (`i = 2`) the same expression returns `numeric(0)` because no row matches. `ages[2] <- numeric(0)` asks R to put zero values into one slot, which is impossible, and the loop dies with the exact error message above. The fix is never to "catch" the error, it is to prevent the RHS from being empty in the first place.

[KEY INSIGHT]
**The error is always a cardinality mismatch on assignment.** The slot on the left wants exactly one value, the expression on the right produced zero, and R will never guess what to put there.

**Try it:** Rewrite the loop so it fills `ex_ages[i]` with `NA_real_` when a name is not in `ages_table`. Use a `length(...) > 0` guard so the loop never crashes.

```r title="Exercise: guard the lookup loop"
# Try it: guard the loop so missing names become NA
ex_ages <- numeric(length(people))
for (i in seq_along(people)) {
  hit <- ages_table$age[ages_table$name == people[i]]
  # your code here
}

ex_ages
#> Expected: 30  NA  25
```

<details>
<summary>Click to reveal solution</summary>

```r title="Guarded lookup solution"
ex_ages <- numeric(length(people))
for (i in seq_along(people)) {
  hit <- ages_table$age[ages_table$name == people[i]]
  ex_ages[i] <- if (length(hit) > 0) hit else NA_real_
}
ex_ages
#> [1] 30 NA 25
```

**Explanation:** The guard collapses the `hit` vector to a single value before touching `ex_ages[i]`. If the lookup missed, `length(hit)` is `0` and the `else` branch supplies `NA_real_`. The slot now always receives exactly one number, so the assignment is legal.

</details>

## Which RHS patterns silently produce a zero-length result?

Four common R idioms return a zero-length vector whenever they fail to find anything, and all four are happy to feed that emptiness into your next assignment. Knowing them by name turns "mysterious crash" into "ah, it's pattern number three".

```r title="Four idioms that return empty"
# 1. grep() with no match — returns integer(0)
sentences <- c("red apple", "green pear", "blue plum")
grep_hits <- grep("orange", sentences)
length(grep_hits)
#> [1] 0

# 2. which() on an always-false logical — returns integer(0)
obs <- c(12, 7, 19, 4)
which_hits <- which(obs > 100)
length(which_hits)
#> [1] 0

# 3. Positional filter with nothing above threshold
tall <- obs[obs > 100]
length(tall)
#> [1] 0

# 4. Data frame row filter with no matching key
df <- data.frame(name = c("Alice", "Bob"), age = c(30, 25))
young <- df$age[df$name == "Zoe"]
length(young)
#> [1] 0
```

Every call above returns a zero-length vector of the appropriate type: `integer(0)`, `integer(0)`, `numeric(0)`, `numeric(0)`. None of them raise a warning, and none print anything unusual, they look like normal return values right up until you try to place them into a single slot. Patterns 1 and 2 return `integer(0)` because both `grep()` and `which()` are indexing functions. Patterns 3 and 4 preserve the storage mode of the source vector, so the emptiness "looks" like the numeric type you expected.

[TIP]
**The diagnosis is always `length(rhs)`.** When you see "replacement has length zero", isolate the exact expression on the right side of the failing `<-`, wrap it in `length()`, and print it. If the answer is `0`, you have found the cause, no further digging required.

**Try it:** Fill `ex_hits[i]` with the number of `grep()` matches for each query. The second query (`"melon"`) matches nothing, make sure the loop does not crash on it.

```r title="Exercise: safe grep match count"
# Try it: guarded grep assignment
queries <- c("apple", "melon", "plum")
ex_hits <- integer(length(queries))
for (i in seq_along(queries)) {
  found <- grep(queries[i], sentences)
  # your code here: assign the match count into ex_hits[i] safely
}

ex_hits
#> Expected: 1 0 1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Grep match count solution"
queries <- c("apple", "melon", "plum")
ex_hits <- integer(length(queries))
for (i in seq_along(queries)) {
  found <- grep(queries[i], sentences)
  ex_hits[i] <- length(found)
}
ex_hits
#> [1] 1 0 1
```

**Explanation:** Writing `length(found)` into the slot always produces a single integer, so the assignment is never empty. A common broken version is `ex_hits[i] <- found`, when `found` is `integer(0)`, that form triggers "replacement has length zero" on the "melon" iteration, which is exactly the error this post is about.

</details>

## How do you diagnose a zero-length assignment before R does?

Reactive debugging, waiting for the crash and then reading the traceback, is painful because the error message never names the key that was missing. Proactive diagnostics fail *loud* at the exact line where the RHS goes empty, and they name the culprit.

The workhorse is a hand-rolled `stop()` that names the culprit. Wrap your lookup in a tiny function that asserts exactly one row came back, and you get an error message that points at the data, not the assignment.

```r title="Fail loud with safelookup"
safe_lookup <- function(table, key) {
  hit <- table$age[table$name == key]
  if (length(hit) == 0) stop("no row for key: ", key, call. = FALSE)
  if (length(hit) > 1)  stop("multiple rows for key: ", key, call. = FALSE)
  hit
}

safe_lookup(ages_table, "Alice")
#> [1] 30

tryCatch(
  safe_lookup(ages_table, "Bob"),
  error = function(e) cat("Caught:", conditionMessage(e), "\n")
)
#> Caught: no row for key: Bob
```

Compare that to the vague "replacement has length zero" message you started with. The new failure reads as `no row for key: Bob`, tells you exactly which key broke the contract, and suppresses the function-call prefix with `call. = FALSE` so the message stays clean. For loops that process thousands of keys, this turns a ten-minute hunt into a one-line fix, you know *which* key is missing because the loop dies on it before the assignment even runs.

[WARNING]
**Debuggers do not always reach inside `sapply()` and `vapply()`.** When a zero-length error blows up inside an apply family call, the traceback points at the outer call, not the iteration that failed. Isolate the failing key with a plain `for` loop first, fix the RHS, then vectorise.

**Try it:** Finish the function so it asserts its lookup returned exactly one value and produces a readable message on failure.

```r title="Exercise: raise a readable error"
# Try it: raise a readable error with stop()
ex_lookup <- function(table, key) {
  hit <- table$age[table$name == key]
  # your code here
  hit
}

tryCatch(
  ex_lookup(ages_table, "Zoe"),
  error = function(e) conditionMessage(e)
)
#> Expected: "no row for key: Zoe"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Readable error solution"
ex_lookup <- function(table, key) {
  hit <- table$age[table$name == key]
  if (length(hit) != 1) {
    stop("no row for key: ", key, call. = FALSE)
  }
  hit
}

tryCatch(
  ex_lookup(ages_table, "Zoe"),
  error = function(e) conditionMessage(e)
)
#> [1] "no row for key: Zoe"
```

**Explanation:** A hand-rolled `stop()` gives you the freedom to interpolate the failing key into the error message. `call. = FALSE` suppresses the function-call prefix so the message is clean. Now any downstream caller sees *exactly* which key is missing instead of chasing a generic replacement-length error.

</details>

## Which defensive patterns prevent the error in production code?

Diagnostics are for debugging. Defensive patterns are for code you want to stop worrying about. Three patterns cover the vast majority of production cases, and all three are one line each.

The first is `%||%`, a null-coalesce operator that returns its left operand unless it is `NULL` or zero-length, in which case it returns the right operand as a fallback. This is the same `||` you use in JavaScript, except R needs a custom helper.

```r title="Define a null-coalesce operator"
`%||%` <- function(a, b) {
  if (is.null(a) || length(a) == 0) b else a
}

# Normal case — returns the value
best_match <- grep("apple", sentences)[1] %||% NA_integer_
best_match
#> [1] 1

# Missing case — returns the fallback instead of crashing
best_match <- grep("orange", sentences)[1] %||% NA_integer_
best_match
#> [1] NA
```

Every call to `%||%` collapses an uncertain RHS into a guaranteed length-1 result, so the downstream assignment can never error. Notice how the same expression behaves in both the matched and unmatched case, that uniformity is what makes this pattern production-ready.

[NOTE]
**`rlang::%||%` ships in the tidyverse.** If your project already depends on rlang, dplyr, or ggplot2, you do not need to redefine the operator. Just write `library(rlang)` at the top of your script and use `%||%` directly.

The second pattern replaces the entire `for` loop with a vectorised `match()`. This is almost always the right answer, R's indexing is built for it.

```r title="Vectorised lookup with match"
# Vectorised lookup — never crashes, returns NA for missing keys
idx <- match(people, ages_table$name)
all_ages <- ages_table$age[idx]
all_ages
#> [1] 30 NA 25
```

`match()` returns `NA_integer_` for every key that is not in the table. When you use that `NA` as an index, R quietly returns `NA` from the lookup vector, no zero-length intermediate, no crash, no `stopifnot()` needed. A three-line vectorised pipeline replaces a ten-line guarded loop and runs faster on real data sizes.

[KEY INSIGHT]
**Vectorised `match()` is almost always the right answer.** `for` loops with scalar lookups are where zero-length errors breed. Vectorised indexing never returns `integer(0)`, it returns `NA` in the right positions, which is a legal assignment.

**Try it:** Build a `safe_first()` helper that returns the first element of a vector, or `NA_real_` if the vector is empty or `NULL`.

```r title="Exercise: write safefirst helper"
# Try it: safe_first() never crashes
ex_safe_first <- function(x) {
  # your code here
}

ex_safe_first(c(10, 20, 30))
#> Expected: 10
ex_safe_first(numeric(0))
#> Expected: NA
ex_safe_first(NULL)
#> Expected: NA
```

<details>
<summary>Click to reveal solution</summary>

```r title="safefirst helper solution"
ex_safe_first <- function(x) {
  if (is.null(x) || length(x) == 0) return(NA_real_)
  x[[1]]
}

ex_safe_first(c(10, 20, 30))
#> [1] 10
ex_safe_first(numeric(0))
#> [1] NA
ex_safe_first(NULL)
#> [1] NA
```

**Explanation:** The early return collapses both the `NULL` and zero-length cases into a single `NA_real_` result. The happy path uses `[[1]]` (double bracket) to unwrap the first element cleanly, `x[1]` would keep vector names, which is usually not what you want in a scalar helper.

</details>

## Practice Exercises

### Exercise 1: Safe user age lookup

You have a vector of user ids and a data frame of known users. Build an `ages` vector that contains the user's age for every matched id and `NA_real_` for every unmatched id. The solution must be vectorised, no `for` loop, and must never raise "replacement has length zero".

```r title="Exercise: vectorised ages lookup"
cap_users <- c("u1", "u2", "u3", "u99", "u4")
cap_users_df <- data.frame(
  id  = c("u1", "u3", "u4"),
  age = c(42, 31, 28)
)

# Write your code below — result should go into cap_ages:
# cap_ages <- ...

# Expected:
#> cap_ages
#> [1] 42 NA 31 NA 28
```

<details>
<summary>Click to reveal solution</summary>

```r title="Vectorised ages lookup solution"
cap_users <- c("u1", "u2", "u3", "u99", "u4")
cap_users_df <- data.frame(
  id  = c("u1", "u3", "u4"),
  age = c(42, 31, 28)
)

cap_ages <- cap_users_df$age[match(cap_users, cap_users_df$id)]
cap_ages
#> [1] 42 NA 31 NA 28
```

**Explanation:** `match()` walks `cap_users` once and produces a length-5 integer vector of row positions, using `NA_integer_` for the two unmatched ids. Indexing `cap_users_df$age` by that vector preserves the length, zero-length slices cannot appear because every `NA` index resolves to `NA` in the result.

</details>

### Exercise 2: Audit wrapper with missing-key logging

A log-processing function is supposed to enrich each event with a human-readable category pulled from a lookup table. When a category is missing, the function currently crashes. Refactor it so that it (a) never errors, (b) returns a character vector of categories with `NA` for misses, and (c) carries an attribute `"missing_keys"` listing every unresolved key for auditing.

```r title="Exercise: rewrite capprocess safely"
# Existing (broken) version for reference:
# cap_process <- function(events, lookup) {
#   out <- character(length(events))
#   for (i in seq_along(events)) {
#     out[i] <- lookup$category[lookup$code == events[i]]
#   }
#   out
# }

# Rewrite cap_process below so it never crashes and audits misses:
cap_process <- function(events, lookup) {
  # your code here
}

cap_result <- cap_process(
  events = c("A1", "B2", "X9", "A1", "Z7"),
  lookup = data.frame(
    code     = c("A1", "B2"),
    category = c("alpha", "beta")
  )
)

# Expected:
#> cap_result
#> [1] "alpha" "beta"  NA      "alpha" NA
#> attr(cap_result, "missing_keys")
#> [1] "X9" "Z7"
```

<details>
<summary>Click to reveal solution</summary>

```r title="capprocess rewrite solution"
cap_process <- function(events, lookup) {
  idx <- match(events, lookup$code)
  out <- lookup$category[idx]
  missing_keys <- unique(events[is.na(idx)])
  attr(out, "missing_keys") <- missing_keys
  out
}

cap_result <- cap_process(
  events = c("A1", "B2", "X9", "A1", "Z7"),
  lookup = data.frame(
    code     = c("A1", "B2"),
    category = c("alpha", "beta")
  )
)
cap_result
#> [1] "alpha" "beta"  NA      "alpha" NA
#> attr(,"missing_keys")
#> [1] "X9" "Z7"

attr(cap_result, "missing_keys")
#> [1] "X9" "Z7"
```

**Explanation:** `match()` produces `NA` for every unknown code, so indexing `lookup$category` returns `NA` in those positions instead of crashing. `events[is.na(idx)]` picks out the raw keys that failed, and `unique()` collapses duplicates so the audit trail is clean. Storing the result as an attribute keeps the function's return type a plain character vector while still giving auditors the visibility they need.

</details>

## Complete Example

A realistic "order enrichment" pipeline: every order references a customer id, and you want to attach the customer's city to each order. Some orders reference customers that were deleted. The naive approach crashes; the vectorised approach never does and also tells you which customers are missing.

```r title="Order enrichment with match"
orders <- data.frame(
  order_id    = 1001:1005,
  customer_id = c("c1", "c7", "c3", "c9", "c1"),
  amount      = c(49.5, 12.0, 88.7, 5.25, 19.0)
)

customers <- data.frame(
  customer_id = c("c1", "c3", "c5"),
  city        = c("Bengaluru", "Chennai", "Mumbai")
)

# Vectorised enrichment — never errors, NA for deleted customers
idx <- match(orders$customer_id, customers$customer_id)
enriched <- orders
enriched$city <- customers$city[idx]

# Audit: which customers were referenced but no longer exist?
missing_cust <- unique(orders$customer_id[is.na(idx)])

enriched
#>   order_id customer_id amount      city
#> 1     1001          c1  49.50 Bengaluru
#> 2     1002          c7  12.00      <NA>
#> 3     1003          c3  88.70   Chennai
#> 4     1004          c9   5.25      <NA>
#> 5     1005          c1  19.00 Bengaluru

missing_cust
#> [1] "c7" "c9"
```

The whole pipeline is four lines of real work plus an audit line. No `for` loop. No `tryCatch`. No "replacement has length zero". The two deleted customers surface as `NA` in the `city` column, which downstream code can handle with `is.na()` checks, and the `missing_cust` vector gives the operations team a list of data-quality issues to fix upstream. This is the shape almost every real enrichment job should take.

## Summary

| Cause | How it shows up | Fix |
|---|---|---|
| Filter with no matches | `df$col[df$key == x]` returns length-0 | `match(x, df$key)` + index |
| `grep()` no match | `grep("...", v)` returns `integer(0)` | `length(hits) > 0` guard or `[1] %\|\|% NA` |
| `which()` on always-false logical | `which(cond)` returns `integer(0)` | Same guard pattern |
| Function with no `else` branch | Silent `NULL` return | Always write the `else` clause |
| NA index from `match()` | Slices propagate `NA`, not length-0 | Assign through the `NA`, no fix needed |
| Loop scalar lookup | Any of the above, one iteration at a time | Replace loop with vectorised `match()` |

## References

1. R Core Team, *The R Language Definition*, section on "Indexing" and "Subset assignment". [Link](https://cran.r-project.org/doc/manuals/r-release/R-lang.html#Indexing)
2. Wickham, H., *Advanced R*, 2nd Edition, Chapter 4: Subsetting. [Link](https://adv-r.hadley.nz/subsetting.html)
3. R documentation, `?base::match` (returns `NA` for unmatched, never length-0). [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/match.html)
4. R documentation, `?base::which` (returns `integer(0)` when no element is TRUE). [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/which.html)
5. rlang reference, `%||%` null-default operator. [Link](https://rlang.r-lib.org/reference/op-null-default.html)
6. dplyr reference, `coalesce()` for replacing missing values in vectors. [Link](https://dplyr.tidyverse.org/reference/coalesce.html)

## Continue Learning

1. **R Common Errors**, the full reference for the 50 most common R error messages, including this one and its close cousins.
2. **R Error: object 'x' not found**, the paired companion error that shows up when the *left* side of an assignment points at something that does not exist.
3. **R Error: subscript out of bounds**, the closest conceptual cousin, fired when an index exceeds the length of the vector instead of collapsing to zero.
