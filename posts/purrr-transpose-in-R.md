---
title: "purrr transpose() in R: Restructure Nested Lists by Index"
slug: purrr-transpose-in-R
description: "Learn purrr transpose() in R to flip a list of records into a list of fields. Examples, list_transpose() comparison, pitfalls, and FAQ with runnable code."
keywords: "purrr transpose, transpose function R, purrr transpose examples, R transpose list, transpose nested list R, purrr transpose list of lists"
mathjax: false
webr: true
date: 2026-05-15
post_type: PSEO
category_id: function-deep
subcategory_id: purrr-functions
fr_parent: Functional-Programming-in-R.html
auto_link_terms: "transpose()|purrr transpose|purrr::transpose()|transpose a list|transpose nested list"
auto_link_case_sensitive: true
target_keyword: "purrr transpose"
sibling_block_enabled: true
difficulty: Beginner
---

# purrr transpose() in R: Restructure Nested Lists by Index

<p class="lead">purrr transpose() in R flips a list of lists inside-out, turning a list of records into a list of fields indexed by name or position.</p>

[QUICK ANSWER]
transpose(records)                      # flip list inside-out
transpose(records)$score                # pull one field across records
transpose(records, .names = c("a","b")) # set output names explicitly
transpose(records)$score |> unlist()    # collapse a field to a vector
transpose(safely_results)               # split result/error pairs
list_transpose(records)                 # modern purrr 1.0 replacement

[DECISION TREE: Is transpose() the right tool?]
- reshape records to fields: transpose(records)
- modern version that simplifies: list_transpose(records)
- split safely() output: transpose(map(x, safely(f)))
- transpose a matrix or data frame: t(df)
- reshape a data frame long or wide: pivot_longer(df, cols)
- apply a function over a list: map(records, f)

## What transpose() does

**transpose() turns a list of lists "inside-out".** You pass a list where every element is itself a list of the same fields, and it returns a new list keyed by those fields. A list of three person records becomes a list with one `name` element and one `score` element, each holding three values.

This is the standard way to pull one component out of many similar nested structures at once. It pairs naturally with the output of [map()](purrr-map-in-R.html), which often returns a list of small lists you then want to regroup by field.

[KEY INSIGHT]
**transpose() is its own inverse.** Calling `transpose(transpose(x))` returns the original list. Think of it as rotating a table 90 degrees: rows become columns, and rotating twice lands you back where you started.

## Syntax

**transpose() takes just two arguments.** The function signature is short, and only the first is required.

```r title="The transpose function signature"
transpose(.l, .names = NULL)
```

- `.l` is the list to transpose. Every element should be a list with the same fields, named consistently.
- `.names` is an optional character vector of names for the transposed output. When `NULL`, names are taken from the first element of `.l`.

Matching is by name when the first element is named, and by position otherwise. That rule is the source of most surprises, so it is worth keeping in mind.

## Examples by use case

**Every example below builds on the same record list.** Start by loading purrr and building a small list of records to work with.

```r title="Load purrr and build a nested list"
library(purrr)

records <- list(
  list(name = "Ann", score = 88),
  list(name = "Bob", score = 91),
  list(name = "Cy",  score = 79)
)

str(records, max.level = 1)
#> List of 3
#>  $ :List of 2
#>  $ :List of 2
#>  $ :List of 2
```

The most common use is flipping that list so each field becomes its own element. The result has two top-level names, `name` and `score`, taken from the first record.

```r title="Transpose the list inside-out"
fields <- transpose(records)

names(fields)
#> [1] "name"  "score"

fields$score
#> [[1]]
#> [1] 88
#>
#> [[2]]
#> [1] 91
#>
#> [[3]]
#> [1] 79
```

Each field comes back as a list, not a vector. To get a plain numeric vector, pull the field and pass it through `unlist()`.

```r title="Collapse a transposed field to a vector"
scores <- transpose(records)$score |> unlist()
scores
#> [1] 88 91 79

mean(scores)
#> [1] 86
```

When the inner lists are unnamed, transpose uses integer positions. Supply `.names` to label the output instead of relying on `[[1]]`, `[[2]]`.

```r title="Control output names explicitly"
unnamed <- list(list(1, "a"), list(2, "b"), list(3, "c"))
named   <- transpose(unnamed, .names = c("num", "lab"))

named$num |> unlist()
#> [1] 1 2 3
named$lab |> unlist()
#> [1] "a" "b" "c"
```

A classic real-world use is splitting the output of [safely()](purrr-safely-in-R.html). Mapping a safe function over inputs gives a list of `{result, error}` pairs, and one `transpose()` separates them cleanly.

```r title="Split safely() output with transpose"
safe_log <- safely(log)
out <- map(list(1, 10, "x"), safe_log)

res <- transpose(out)
res$result[[2]]
#> [1] 2.302585
res$error[[3]]
#> <simpleError in log(x): non-numeric argument to mathematical function>
```

## transpose() vs list_transpose()

**purrr 1.0.0 superseded transpose() with list_transpose().** The older function still works and is not deprecated, but `list_transpose()` is the recommended choice for new code. The key difference is that `list_transpose()` simplifies its output to vectors automatically when it can.

```r title="The modern replacement returns vectors"
list_transpose(records)$score
#> [1] 88 91 79
```

| Feature | `transpose()` | `list_transpose()` |
|---|---|---|
| Status | Superseded (still works) | Recommended since purrr 1.0.0 |
| Output | Always a list of lists | Simplifies to vectors when possible |
| Control | `.names` only | `simplify`, `template`, `default` |
| Best for | Maintaining older code | New code, cleaner results |

Use `transpose()` when you maintain an existing codebase that already depends on it. Reach for `list_transpose()` in anything new, since it removes the manual `unlist()` step.

## Common pitfalls

**A missing field silently becomes NULL.** If one record lacks a field that others have, transpose does not error. It inserts `NULL` in that slot, which can break a later `unlist()` or arithmetic step.

```r title="Pitfall: a missing field becomes NULL"
ragged <- list(list(x = 1, y = 2), list(x = 3))
transpose(ragged)$y
#> [[1]]
#> [1] 2
#>
#> [[2]]
#> NULL
```

[WARNING]
**Inconsistent inner names cause silent misalignment.** transpose() takes its field names from the first element only. If later elements use different names or a different order, values land in the wrong slot or vanish without any message. Validate that every record has identical names before transposing.

The second frequent mistake is forgetting that `transpose()` returns lists. Doing `mean(transpose(records)$score)` fails because the field is a list, not a numeric vector. Pipe it through `unlist()` first, or switch to `list_transpose()`. The third is confusing it with `t()`, the base R matrix transpose, which is unrelated and works on matrices and data frames, not nested lists.

[NOTE]
**Coming from Python?** transpose() is close to `zip(*records)` on a list of dictionaries: it regroups parallel records by key. The named output mirrors a dictionary of lists.

## Related purrr functions

These functions are commonly used alongside `transpose()` when reshaping nested data:

- [map()](purrr-map-in-R.html) builds the list of records that transpose then regroups.
- [pluck()](purrr-pluck-in-R.html) reaches into a single deep element instead of reshaping the whole list.
- [flatten()](purrr-flatten-in-R.html) removes one level of nesting without flipping the structure.
- [list_modify()](purrr-list_modify-in-R.html) edits elements of a list in place.
- [safely()](purrr-safely-in-R.html) produces the result/error pairs that transpose splits apart.

## Try it yourself

**Try it:** Transpose the `people` list below and compute the mean `age` across all three records. Save the mean to `ex_mean_age`.

```r title="Your turn: transpose and summarise"
people <- list(
  list(name = "Dee", age = 30),
  list(name = "Eli", age = 42),
  list(name = "Fay", age = 36)
)

# Try it: transpose people, then average the age field
ex_mean_age <- # your code here

ex_mean_age
#> Expected: 36
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_mean_age <- mean(unlist(transpose(people)$age))
ex_mean_age
#> [1] 36
```

**Explanation:** transpose() regroups the records so `$age` holds all three ages as a list. `unlist()` turns that list into a numeric vector, and `mean()` averages it.

</details>

## FAQ

**What is the difference between transpose() and list_transpose() in purrr?**

Both flip a list of lists inside-out. `transpose()` always returns a list of lists, so you must call `unlist()` to get vectors. `list_transpose()`, added in purrr 1.0.0, simplifies its output to atomic vectors when possible and adds `simplify`, `template`, and `default` arguments for finer control. `transpose()` is superseded but not removed, so existing code keeps working while new code should use `list_transpose()`.

**Is purrr transpose() deprecated?**

No, it is superseded, which is a softer status. Superseded functions are not recommended for new code but receive no warnings and are not scheduled for removal. Any script that already uses `transpose()` will keep running. For fresh work, prefer `list_transpose()`, which produces cleaner output with fewer manual steps.

**How do I transpose a list of lists in R without purrr?**

Base R has no direct equivalent, but you can combine `lapply()` with `setNames()`: `lapply(names(records[[1]]), function(f) lapply(records, \`[[\`, f))`. This loops over each field name and extracts that field from every record. It works but is verbose, which is exactly the boilerplate `transpose()` removes.

**Can transpose() handle lists of different lengths?**

It runs without error, but the result is unreliable. transpose() reads field names from the first element only. Records missing a field get `NULL` in that position, and records with extra fields have those fields dropped. Make every record consistent before transposing, or you will get silent data loss.

**How is transpose() different from t() in R?**

They are unrelated despite the similar name. `t()` is base R and transposes a matrix or data frame, swapping its rows and columns. `transpose()` is from purrr and reshapes a nested list, regrouping records by field. Use `t()` for rectangular data and `transpose()` for lists of lists.

For the official reference, see the [purrr transpose() documentation](https://purrr.tidyverse.org/reference/transpose.html).
