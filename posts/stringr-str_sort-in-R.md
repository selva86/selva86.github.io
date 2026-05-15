---
title: "stringr str_sort() in R: Sort Character Vectors With Locale"
slug: "stringr-str_sort-in-R"
description: "Sort character vectors in R with stringr str_sort(): locale-aware order, descending sort, NA handling, natural sort, and str_sort() vs sort() comparison."
keywords: "stringr str_sort, str_sort function R, stringr str_sort examples, R sort strings, str_sort vs sort, locale aware string sort R, sort character vector R"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "stringr-functions"
fr_parent: "stringr-in-R.html"
auto_link_terms: "str_sort()|stringr str_sort|stringr::str_sort()|sort character vector|sort strings in R"
auto_link_case_sensitive: true
target_keyword: "stringr str_sort"
sibling_block_enabled: true
difficulty: "Beginner"
---

# stringr str_sort() in R: Sort Character Vectors With Locale

<p class="lead">stringr str_sort() returns a character vector arranged in alphabetical order using locale-aware Unicode collation. It is the readable, cross-platform replacement for base sort() when you work with text, and it handles missing values, descending order, and natural sort through keyword arguments.</p>

[QUICK ANSWER]
str_sort(x)                                  # ascending sort
str_sort(x, decreasing = TRUE)               # descending sort
str_sort(x, na_last = FALSE)                 # NAs first
str_sort(x, na_last = NA)                    # drop NAs
str_sort(x, locale = "en")                   # English collation (default)
str_sort(x, locale = "de")                   # German rules
str_sort(x, numeric = TRUE)                  # natural sort for "a10" after "a2"
str_sort(unique(x))                          # dedupe then sort

[DECISION TREE: Is str_sort() the right tool?]
- the sorted character values themselves: str_sort(x)
- positions to reorder a parallel object: str_order(x)
- sort a data frame by a column: arrange(df, col)
- sort numbers, not strings: sort(numeric_vec)
- rank with ties handled: rank(x, ties.method = "min")
- top N values only: head(str_sort(x), 5)
- case-insensitive sort: str_sort(str_to_lower(x))

## What str_sort() does in one sentence

**str_sort() takes a character vector and returns the same elements rearranged in alphabetical order.** It is the stringr counterpart of base `sort()` with two important upgrades. Locale is an explicit keyword argument, so results are identical on Windows, macOS, and Linux. A `numeric = TRUE` flag enables natural sort for filenames and version strings. Use str_sort() when you want the sorted values directly, not the permutation that produces them.

```r title="Load stringr and sort a small vector"
library(stringr)

fruits <- c("banana", "apple", "cherry")
str_sort(fruits)
#> [1] "apple"  "banana" "cherry"
```

The output is a permutation of the input, never a subset. Every non-missing element from the original appears exactly once. NA values follow the `na_last` rule, which defaults to placing them at the end.

## Syntax

**str_sort() takes one required argument and four tuning options.** All optional arguments are keyword-driven, so call sites stay self-documenting.

```r title="Function signature"
# str_sort(
#   x,
#   decreasing = FALSE,
#   na_last    = TRUE,
#   locale     = "en",
#   numeric    = FALSE,
#   ...
# )
#
# x         : character vector to sort
# decreasing: FALSE = ascending, TRUE = descending
# na_last   : TRUE (last), FALSE (first), NA (drop)
# locale    : ICU locale string ("en", "de", "sv", "tr", ...)
# numeric   : TRUE = compare digit runs numerically
```

The defaults match what users expect from `sort()` in English: ascending order, NAs at the end, lexicographic comparison. The locale argument is the differentiator. ICU collation gives the same output on any operating system, which is why str_sort() is the safer default for code that ships beyond your laptop.

```r title="Descending and NA placement at a glance"
v <- c("delta", NA, "alpha", "charlie", "bravo")

str_sort(v)
#> [1] "alpha"   "bravo"   "charlie" "delta"   NA

str_sort(v, decreasing = TRUE)
#> [1] "delta"   "charlie" "bravo"   "alpha"   NA

str_sort(v, na_last = FALSE)
#> [1] NA        "alpha"   "bravo"   "charlie" "delta"
```

`na_last` is independent of `decreasing`. The four combinations cover every layout you might want: ascending or descending, NAs first or last.

## Five common str_sort() scenarios

**Five patterns cover almost every real call to str_sort().** Each block is self-contained and uses built-in vectors so you can run them inline.

### Sort a list of names alphabetically

**The most common job is producing a clean A-to-Z list.** str_sort() handles it in one line.

```r title="Alphabetize the first dozen US states"
states12 <- sample(state.name, 12)
str_sort(states12)
#> [1] "Alabama"     "Arizona"     "California"  "Colorado"
#> [5] "Connecticut" "Florida"     "Hawaii"      "Idaho"
#> [9] "Iowa"        "Kentucky"    "Maine"       "Maryland"
```

Output order is deterministic for a given input and locale. Run this on Windows, macOS, or a Linux CI runner and you get the same sequence. Base `sort()` can disagree across these targets when the system `LC_COLLATE` differs.

### Sort in descending order

**`decreasing = TRUE` returns Z-to-A without breaking locale rules.** Stable ordering of ties is preserved.

```r title="Reverse-alphabetical fruit list"
fruit5 <- c("apple", "banana", "cherry", "date", "elderberry")
str_sort(fruit5, decreasing = TRUE)
#> [1] "elderberry" "date"       "cherry"     "banana"     "apple"
```

Prefer the keyword argument over `rev(str_sort(x))`. The keyword version stays stable when the input contains duplicates; `rev()` reverses tied groups too.

### Locale-aware sorting for non-English text

**Different languages collate accented letters differently.** Swedish places `å` after `z`; German treats `ö` like `o`; the default English locale does neither.

```r title="German vs Swedish sort of accented letters"
words <- c("zebra", "öl", "apel", "åke")

str_sort(words, locale = "en")
#> [1] "åke"   "apel"  "öl"    "zebra"

str_sort(words, locale = "de")
#> [1] "åke"   "apel"  "öl"    "zebra"

str_sort(words, locale = "sv")
#> [1] "apel"  "zebra" "åke"   "öl"
```

`locale = "sv"` ranks `å` and `ö` after `z`, matching how a Swedish dictionary orders entries. Pick the locale that matches your readers, not your server.

[NOTE]
**The default `"en"` locale is consistent across operating systems.** Base `sort()` falls back to the system locale, which is why a CSV sorted on a developer laptop sometimes reorders on a production Linux box. str_sort() removes that surprise without extra setup.

### Natural sort for filenames and versions

**`numeric = TRUE` compares embedded digit runs as numbers.** This is the "natural sort" users expect for filenames, versions, and IDs.

```r title="Natural sort of version-like filenames"
files <- c("log2.txt", "log10.txt", "log1.txt", "log20.txt")

str_sort(files)
#> [1] "log1.txt"  "log10.txt" "log2.txt"  "log20.txt"

str_sort(files, numeric = TRUE)
#> [1] "log1.txt"  "log2.txt"  "log10.txt" "log20.txt"
```

Lexicographic sort puts `log10` before `log2` because `1` precedes `2` character by character. Natural sort understands that 10 is bigger than 2 and reorders the runs accordingly. Reach for it whenever a string contains an embedded counter.

### Case-insensitive sort

**str_sort() is case-sensitive by default; lowercase letters come after uppercase in many locales.** Normalize case first if that is not what you want.

```r title="Case-insensitive sort via str_to_lower"
mixed <- c("Apple", "banana", "Cherry", "date", "Elderberry")

str_sort(mixed)
#> [1] "Apple"      "banana"     "Cherry"     "date"       "Elderberry"

str_sort(mixed, locale = "en")
#> [1] "Apple"      "banana"     "Cherry"     "date"       "Elderberry"

str_sort(mixed[order(str_to_lower(mixed))])
#> [1] "Apple"      "banana"     "Cherry"     "date"       "Elderberry"
```

The cleanest reading is to lowercase first, then sort. The ICU default for `"en"` is already a tertiary collation that mixes cases reasonably, but explicit case folding is easier to debug.

## str_sort() vs sort() vs str_order()

**Four functions order text, but they answer two questions in two different ways.** Picking the wrong one is the most common bug in sorting code.

| Function | Returns | Locale behavior | Best for |
|---|---|---|---|
| `str_sort(x)` | sorted character vector | explicit `locale =` arg, cross-OS stable | "give me the sorted values" |
| `str_order(x)` | integer permutation | same explicit locale | reorder a parallel object or data frame |
| `sort(x)` | sorted character vector | uses system `LC_COLLATE`, varies by OS | base-only code, single platform |
| `order(x)` | integer permutation | uses system `LC_COLLATE` | base-only code; same idea as str_order |

[KEY INSIGHT]
**Sort returns values; order returns positions.** Reach for str_sort() when the sorted strings are the answer. Reach for str_order() when you need to reorder something other than `x` itself, like a data frame row or a parallel vector. The choice is about what comes next, not the values you start with.

## Common pitfalls

**Three pitfalls account for most surprises with str_sort().** Each has a one-line fix.

### Forgetting that NAs land at the end by default

**`str_sort(x)` returns the same length as `x`.** NA values are kept and pushed to the end, which can look like missing data was lost when downstream code expects a clean vector.

```r title="Drop NAs before sorting"
v <- c("c", NA, "a", "b")

str_sort(v)
#> [1] "a" "b" "c" NA

str_sort(v, na_last = NA)
#> [1] "a" "b" "c"
```

Pass `na_last = NA` when you want NAs excluded from the result. Filter the input with `v[!is.na(v)]` if you also want to record how many were dropped.

### Trusting base sort() across operating systems

**Base `sort()` calls into the system locale, so the same input can sort differently on macOS and Linux.** That is hard to reproduce locally because the developer machine usually agrees with the bug report.

```r title="Reproducible cross-OS sort with explicit locale"
x <- c("Apple", "banana", "Cherry")

sort(x)                             # depends on system LC_COLLATE
#> [1] "Apple"  "banana" "Cherry"

str_sort(x, locale = "en")          # always the same
#> [1] "Apple"  "banana" "Cherry"
```

In CI runners, batch jobs, and production servers, default to str_sort() with an explicit `locale =`. The base function stays useful for quick interactive work on one machine.

### Sorting "a10" before "a2" with the default

**Lexicographic order puts `a10` before `a2` because `1` is smaller than `2` character by character.** That is not what humans read.

```r title="Item codes need numeric collation"
codes <- c("A2", "A10", "A1", "B2", "B10")

str_sort(codes)
#> [1] "A1"  "A10" "A2"  "B10" "B2"

str_sort(codes, numeric = TRUE)
#> [1] "A1"  "A2"  "A10" "B2"  "B10"
```

`numeric = TRUE` only affects digit runs; letter segments still respect the locale. Test on representative inputs if your strings mix digits and letters.

[WARNING]
**`str_sort()` returns an empty character vector on empty input, not NULL.** Functions that branch on `length(x) == 0` keep working, but code that checks `is.null(str_sort(x))` will silently take the wrong branch. Use `length()` instead.

## Try it yourself

**Try it:** Use `rownames(mtcars)` to get the car model names, then sort them alphabetically in descending order. Save the first three names to `ex_top3`.

```r title="Your turn: top 3 names reverse-alphabetical"
# Try it: top 3 reverse-alphabetical car model names
ex_top3 <- # your code here

ex_top3
#> Expected: "Volvo 142E", "Valiant", "Toyota Corolla"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_top3 <- head(str_sort(rownames(mtcars), decreasing = TRUE), 3)
ex_top3
#> [1] "Volvo 142E"     "Valiant"        "Toyota Corolla"
```

**Explanation:** `str_sort(..., decreasing = TRUE)` returns the car names in reverse alphabetical order. `head(., 3)` keeps the first three, which are the three names that come last alphabetically.

</details>

## Related stringr functions

When str_sort() is not quite the tool you need, these are the next stops:

- [str_order()](stringr-str_order-in-R.html) returns the sort permutation instead of the sorted values.
- [str_rank()](stringr-str_rank-in-R.html) returns the rank of each element, the inverse permutation.
- [str_to_lower()](stringr-str_to_lower-in-R.html) lets you sort case-insensitively by normalizing first.
- [str_unique()](stringr-str_unique-in-R.html) deduplicates a character vector before you sort it.
- [arrange()](dplyr-arrange-in-R.html) is the dplyr verb that sorts a whole data frame by one or more columns.
- The official [stringr reference for str_sort](https://stringr.tidyverse.org/reference/str_order.html) covers every argument with worked examples.

## FAQ

**What is the difference between str_sort() and sort() in R?**

Both functions return a vector arranged in order, but they differ in how locale is chosen. `str_sort()` takes an explicit `locale =` argument and uses ICU collation, which produces identical output on Windows, macOS, and Linux. Base `sort()` falls back to the system `LC_COLLATE`, so the same code can produce different sequences on different machines. Use str_sort() in production code where reproducibility across operating systems matters.

**How do I sort strings in R ignoring case?**

The simplest pattern is to lowercase first and reorder: `x[order(str_to_lower(x))]`. That treats `"Apple"` and `"apple"` as equal, then preserves the original case in the output. ICU collation in str_sort() also has tertiary case rules, but the lowercase-then-order recipe is easier to read in review and works for almost every reporting need.

**Does str_sort() handle natural sort for filenames?**

Yes, pass `numeric = TRUE`. That compares embedded digit runs as numbers, so `c("file2", "file10")` returns in the expected order rather than lexicographic. The flag only affects digit segments; letters still sort by the chosen locale. It is the cleanest way to handle version strings and counters embedded in IDs.

**Why does str_sort() put NAs at the end?**

The default `na_last = TRUE` places NAs after every non-missing value, which keeps the output the same length as the input. Set `na_last = FALSE` to put NAs first, or `na_last = NA` to drop them entirely. Choose based on whether downstream code wants a full-length vector or a missing-free one.

**Can I sort a data frame with str_sort()?**

Not directly. `str_sort()` returns a character vector, not a row order. Use `str_order()` to get the row permutation and then index the data frame, like `df[str_order(df$name), ]`. Or, for the readable tidyverse route, `dplyr::arrange(df, name)` does the same thing and chains naturally with other verbs.
