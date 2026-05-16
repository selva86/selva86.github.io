---
title: "data.table fifelse() in R: Fast Vectorized If-Else"
slug: datatable-fifelse-in-R
description: "Learn data.table fifelse() in R for fast, type-safe vectorized if-else logic. Covers syntax, the na argument, fifelse vs ifelse, dates, and common pitfalls."
keywords: "data.table fifelse, fifelse function R, data.table fifelse examples, R vectorized if else, fifelse vs ifelse, fifelse na argument, data.table conditional column"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: datatable-functions
fr_parent: data-table-vs-dplyr.html
auto_link_terms: "fifelse()|data.table fifelse|data.table::fifelse()|fifelse|vectorized if else"
auto_link_case_sensitive: true
target_keyword: "data.table fifelse"
sibling_block_enabled: true
difficulty: Beginner
---

# data.table fifelse() in R: Fast Vectorized If-Else

<p class="lead">The data.table fifelse() function in R returns one of two values for each element of a logical test, in a single fast, type-safe pass. It is a stricter, quicker drop-in for base ifelse().</p>

[QUICK ANSWER]
fifelse(x > 0, "pos", "neg")             # binary label
fifelse(x > 0, x, 0L)                    # keep value or zero
fifelse(test, "y", "n", na = "unknown")  # control NA rows
fifelse(d > cut, d, as.Date(NA))         # Date class preserved
DT[, flag := fifelse(am == 1, 1L, 0L)]   # add a column by reference
fifelse(v > 20, v, 0)                    # length-1 'no' recycled

[DECISION TREE: Is fifelse() the right tool?]
- one binary condition: fifelse(test, yes, no)
- three or more cases: fcase(c1, v1, c2, v2)
- fill NA with a fallback value: fcoalesce(x, backup)
- choose a row by exact key match: DT[lookup, on = "id"]
- rank values into buckets: frank(x)

## What fifelse() does

**fifelse() makes a binary choice across a whole vector at once.** You give it a logical `test`, a `yes` value, and a `no` value. For every element where `test` is `TRUE` it returns the matching `yes` value, and everywhere `test` is `FALSE` it returns `no`.

It is data.table's answer to base R's `ifelse()`, rewritten for speed and type safety. The base function silently coerces types and drops attributes such as the `Date` or `factor` class. `fifelse()` refuses to mix types and keeps attributes intact, so the output is exactly the type you expect.

[KEY INSIGHT]
**fifelse() is one vectorized operation, not a per-row branch.** The test is evaluated across the entire vector, then `yes` and `no` are selected in a single C-level pass. That is why it stays fast on columns with millions of rows.

## fifelse() syntax

**The call takes one test and two values, plus an optional na.** The signature is `fifelse(test, yes, no, na = NA)`. Here `test` is a logical vector, `yes` and `no` are the values to return, and `na` sets what to return where `test` itself is `NA`.

```r title="The fifelse call shape"
library(data.table)

temp <- c(-4, 12, 30)
fifelse(temp < 0, "freezing", "above zero")
#> [1] "freezing"   "above zero" "above zero"
```

Three rules govern every call. `yes` and `no` must be the same type, since the result is one typed vector. Each must have length 1 or the same length as `test`, and length-1 values are recycled. Where `test` is `NA`, the result is `na`, which defaults to a typed `NA`. See the official [data.table fifelse reference](https://rdatatable.gitlab.io/data.table/reference/fifelse.html) for the full argument list.

## fifelse() examples

**These examples use the built-in `mtcars` dataset loaded as a data.table.** Each one shows a different real task: labelling rows, keeping or replacing values, controlling NA, and preserving a date class.

The first example adds a labelled column inside a `data.table`. The `am` column is `1` for manual cars and `0` for automatic ones.

```r title="Label rows with a binary condition"
DT <- as.data.table(mtcars, keep.rownames = "model")
DT[, transmission := fifelse(am == 1, "manual", "automatic")]
DT[, .N, by = transmission]
#>    transmission  N
#> 1:       manual 13
#> 2:    automatic 19
```

The `yes` value does not have to be a constant. Pass the vector itself to keep an element where the test holds and substitute something else where it does not.

```r title="Keep a value or substitute zero"
v <- c(10, 25, 40, 5)
fifelse(v > 20, v, 0)
#> [1]  0 25 40  0
```

When the test vector contains `NA`, the `na` argument decides what those positions return. Without it they would silently become `NA` in the output.

```r title="Handle NA in the test vector"
score <- c(88, NA, 45)
fifelse(score >= 60, "pass", "fail", na = "no score")
#> [1] "pass"     "no score" "fail"
```

Because `fifelse()` keeps attributes, a `Date` input produces a `Date` output. Base `ifelse()` would strip the class and return raw day counts here.

```r title="Dates keep their class"
dates  <- as.Date(c("2024-01-10", "2024-08-20"))
cutoff <- as.Date("2024-06-01")
fifelse(dates > cutoff, dates, as.Date(NA))
#> [1] NA           "2024-08-20"
```

[NOTE]
**Coming from Python pandas?** The closest equivalent of `fifelse()` is `numpy.where(cond, yes, no)`, which also returns one of two values element-wise across an array.

## fifelse vs ifelse

**Pick fifelse() when type safety and speed matter, ifelse() only for quick base-R scripts.** They share the same three-argument shape, but they behave differently when types disagree or attributes are involved.

| Function | Package | Type handling | NA control |
|---|---|---|---|
| `fifelse()` | data.table | strict, errors on mismatch | `na =` argument |
| `ifelse()` | base R | silent coercion, drops attributes | inherits test NA |
| `if_else()` | dplyr | strict, errors on mismatch | `missing =` argument |
| `fcase()` | data.table | strict, for 3 or more cases | `default =` |

The decision rule is short. If you already work in data.table, `fifelse()` is the natural binary choice: it is faster, refuses unsafe coercions, and preserves the `Date` or `factor` class. Base `ifelse()` is fine for throwaway scripts but will quietly convert a date to a number. For three or more branches, reach for [data.table fcase in R](datatable-fcase-in-R.html) instead of nesting `fifelse()` calls.

## Common pitfalls

**Most fifelse() bugs trace back to mismatched types, wrong lengths, or unhandled NA.** All three surface quickly once you know the symptom.

Mixing the types of `yes` and `no` throws an error, because the result must be one typed vector. This is deliberate: base `ifelse()` would coerce silently and hide the bug.

```r title="yes and no must share a type"
x <- c(-2, 5, -7)
fifelse(x > 0, "positive", 0)
#> Error in fifelse(x > 0, "positive", 0) :
#>   'yes' is of type character but 'no' is of type double. Please make sure both arguments have the same type.
```

[WARNING]
**Type mismatches fail loudly, but a forgotten na fails silently.** The error above is easy to fix by making both values the same type. The quieter trap is leaving `na` unset, which lets `NA` in the test leak straight into the output.

Each value must be length 1 or the same length as `test`. A vector of any other length is rejected.

```r title="yes and no must be length 1 or length(test)"
fifelse(c(TRUE, FALSE, TRUE), c("a", "b"), "x")
#> Error in fifelse(c(TRUE, FALSE, TRUE), c("a", "b"), "x") :
#>   Length of 'yes' is 2 but must be 1 or length of 'test' (3).
```

Finally, an `NA` in the test propagates into the result unless you supply `na`. The output below has a gap exactly where the test was missing.

```r title="NA in the test leaks into the output"
flag <- c(TRUE, NA, FALSE)
fifelse(flag, "on", "off")
#> [1] "on" NA   "off"
```

## Try it yourself

**Try it:** Use fifelse() to add a column mpg_flag to a data.table of mtcars: "efficient" when mpg is at least 25, otherwise "thirsty". Save the result to ex_dt.

```r title="Your turn: flag fuel efficiency"
# Try it: flag mpg with fifelse()
ex_dt <- as.data.table(mtcars)
ex_dt[, mpg_flag := # your code here]

ex_dt[, .N, by = mpg_flag]
#> Expected: 6 efficient, 26 thirsty
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_dt <- as.data.table(mtcars)
ex_dt[, mpg_flag := fifelse(mpg >= 25, "efficient", "thirsty")]
ex_dt[, .N, by = mpg_flag]
#>     mpg_flag  N
#> 1:   thirsty 26
#> 2: efficient  6
```

**Explanation:** `fifelse()` evaluates `mpg >= 25` across all 32 rows, returns `"efficient"` where it holds, and `"thirsty"` everywhere else. The `:=` operator writes the result back as a new column with no copy.

</details>

## Related data.table functions

**fifelse() sits in data.table's family of fast, vectorized helpers.** These functions pair well with it for conditional logic and cleanup:

- `fcase()`: the multi-case version, for three or more conditions. See [data.table fcase in R](datatable-fcase-in-R.html).
- `fcoalesce()`: returns the first non-`NA` value across vectors. See [data.table fcoalesce in R](datatable-fcoalesce-in-R.html).
- `shift()`: lag or lead a column before a comparison. See [data.table shift in R](datatable-shift-in-R.html).
- `setDT()`: convert a data.frame to a data.table in place. See [data.table setDT in R](datatable-setDT-in-R.html).
- `uniqueN()`: count distinct values in a result. See [data.table uniqueN in R](datatable-uniqueN-in-R.html).

## FAQ

**What is the difference between fifelse() and base ifelse()?**

Both pick between `yes` and `no` based on a logical test, but `fifelse()` is stricter and faster. Base `ifelse()` silently coerces `yes` and `no` to a common type and drops attributes, so a `Date` input comes back as a raw number. `fifelse()` errors when the types disagree and preserves the `Date` or `factor` class. It also runs in optimized C code, which is noticeably faster on large vectors.

**What does the na argument in fifelse() do?**

The `na` argument sets the value returned wherever the `test` vector is `NA`. By default it is a typed `NA`, so missing values in the test become missing values in the output. Passing `na = "unknown"` (or any value of the same type as `yes` and `no`) replaces those positions with an explicit fallback. This makes `fifelse()` safer than base `ifelse()` when your condition might itself contain `NA`.

**Is fifelse() faster than ifelse()?**

Yes, usually by a wide margin on large vectors. `fifelse()` runs as a single optimized C operation, while base `ifelse()` does more work in R and allocates extra intermediate objects. On a few hundred elements the difference is invisible, but on columns with millions of rows `fifelse()` is clearly faster. It is the recommended choice inside any data.table pipeline that already loads the package.

**Does fifelse() preserve dates and factors?**

Yes. Because `fifelse()` does not coerce types, a `Date` input returns a `Date` and a `factor` input returns a `factor` with its levels intact. Base `ifelse()` strips these attributes and hands back a plain integer or numeric vector instead. If you build conditional logic on date or factor columns, `fifelse()` saves you from re-applying `as.Date()` or `factor()` after every call.
