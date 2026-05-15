---
title: "stringr str_subset() in R: Filter Strings by Pattern"
slug: "stringr-str_subset-in-R"
description: "Use stringr str_subset() to filter a character vector by a regex pattern in R. Covers fixed match, ignore case, negate, NA handling, and 5 worked examples."
keywords: "str_subset, stringr str_subset, R filter strings by pattern, str_subset examples, grep value TRUE alternative, R regex filter, stringr str_subset vs grep"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "stringr-functions"
fr_parent: "stringr-in-R.html"
auto_link_terms: "str_subset()|stringr str_subset|stringr::str_subset()|filter strings by pattern|filter character vector"
auto_link_case_sensitive: true
target_keyword: "stringr str_subset"
sibling_block_enabled: true
difficulty: "Beginner"
---

# stringr str_subset() in R: Filter Strings by Pattern

<p class="lead">The <code>str_subset()</code> function in stringr keeps elements of a character vector that match a regex pattern. It is the tidyverse replacement for base R <code>grep(pattern, x, value = TRUE)</code>.</p>

[QUICK ANSWER]
str_subset(x, "pattern")                              # regex (default)
str_subset(x, fixed("text"))                          # literal match
str_subset(x, regex("pat", ignore_case = TRUE))       # case-insensitive
str_subset(x, "pattern", negate = TRUE)               # keep non-matches
str_subset(x, "^a")                                   # starts with "a"
str_subset(x, "ing$")                                 # ends with "ing"
str_subset(na.omit(x), "pattern")                     # NA-safe filter

[DECISION TREE: Is str_subset() the right tool?]
- keep strings matching a pattern (vector in, vector out): str_subset()
- get TRUE/FALSE per string: str_detect()
- get position indices of matches: str_which()
- extract the matched substring only: str_extract()
- filter data frame rows by string column: filter(df, str_detect(col, "pat"))
- count strings matching a pattern: sum(str_detect(x, "pat"))
- replace the matched pattern in place: str_replace() / str_replace_all()

## What str_subset() does in one sentence

**`str_subset(string, pattern)` returns a character vector containing only the elements of `string` that match `pattern`.** The pattern is a regular expression by default; wrap with `fixed()` for literal string matching.

It is the workhorse for filtering character vectors. `str_subset(x, p)` is exactly equivalent to `x[str_detect(x, p)]` but reads better and is more concise in pipelines.

## Syntax

**`str_subset(string, pattern, negate = FALSE)` takes a character vector and a regex pattern, returning the subset that matches.**

```r title="Load stringr and filter a vector"
library(stringr)

fruits <- c("apple", "banana", "cherry", "blueberry", "date")

str_subset(fruits, "berry")
#> [1] "blueberry"
```

[TIP]
**str_subset() is the vector-in, vector-out cousin of str_detect().** Use str_subset() when you want the matching strings themselves. Use str_detect() when you want a logical mask (for example, to combine with other conditions or to feed into dplyr filter()).

## Five common patterns

### 1. Basic regex filter

```r title="Keep strings containing a substring"
words <- c("running", "ran", "runs", "runner", "walking")

str_subset(words, "run")
#> [1] "running" "runs"    "runner"
```

By default the pattern is a regular expression. `"run"` matches anywhere in each string, so "running", "runs", and "runner" all qualify; "ran" and "walking" are dropped.

### 2. Literal (non-regex) match with fixed()

```r title="Match a literal dot"
versions <- c("1.5", "1a5", "1.x", "v1.5")

str_subset(versions, fixed("1.5"))
#> [1] "1.5"  "v1.5"
```

`fixed("1.5")` treats the pattern as a plain string. Without `fixed()`, the `.` is regex for "any character" and would also match "1a5".

### 3. Case-insensitive filter

```r title="Keep strings matching 'apple' in any case"
items <- c("apple pie", "Apple Tart", "BANANA", "pineapple")

str_subset(items, regex("apple", ignore_case = TRUE))
#> [1] "apple pie"  "Apple Tart" "pineapple"
```

Wrap the pattern in `regex(pattern, ignore_case = TRUE)` to ignore case. "BANANA" is excluded; everything else contains "apple" somewhere, regardless of capitalization.

### 4. Negate (keep non-matching strings)

```r title="Drop strings containing digits"
labels <- c("alpha", "beta2", "gamma", "delta9", "epsilon")

str_subset(labels, "\\d", negate = TRUE)
#> [1] "alpha"   "gamma"   "epsilon"
```

`negate = TRUE` flips the filter to keep elements that do NOT match. Here `\\d` matches any digit, so labels containing a digit are dropped.

### 5. Anchored patterns for start and end matching

```r title="Filter by prefix and suffix"
files <- c("data.csv", "data.xlsx", "report.csv", "summary.txt")

str_subset(files, "^data")
#> [1] "data.csv"  "data.xlsx"

str_subset(files, "\\.csv$")
#> [1] "data.csv"   "report.csv"
```

`^` anchors the pattern to the start of each string, `$` to the end. Combine them (`^foo$`) to match the whole string exactly.

[KEY INSIGHT]
**str_subset() = str_detect() + subset, in one step.** Internally it computes a logical mask with str_detect() and uses it to filter the vector. Knowing this equivalence makes the function easy to reason about and lets you swap to str_detect() the moment you need the mask separately.

## str_subset() vs alternatives

**Four functions cover almost every "filter a character vector by pattern" job.** Pick by return type, not by habit: values, logicals, indices, or base R equivalent.

| Function | Returns | Use when |
|---|---|---|
| `str_subset(x, p)` | character vector of matches | You want the matching strings themselves |
| `str_detect(x, p)` | logical vector, same length as x | You need a TRUE/FALSE mask (for filter() or & / \|) |
| `str_which(x, p)` | integer vector of indices | You need positions (for slicing, ordering, joining) |
| `grep(p, x, value=TRUE)` | character vector of matches | You are writing base R with no dependencies |

```r title="Compare the four approaches"
x <- c("apple", "banana", "cherry")

str_subset(x, "an")         # values
#> [1] "banana"

str_detect(x, "an")         # logical
#> [1] FALSE  TRUE FALSE

str_which(x, "an")          # indices
#> [1] 2

grep("an", x, value = TRUE) # base R equivalent of str_subset
#> [1] "banana"
```

All four are vectorized over `x`. Pick the one whose return type fits the next step in your pipeline.

## Common pitfalls

**Pitfall 1: regex special characters treated literally.** `str_subset(x, "1.5")` matches "1a5", "125", "1.5", and so on, because `.` is regex for "any character". Use `fixed("1.5")` or escape: `"1\\.5"`.

**Pitfall 2: NA elements pass through unchanged.** `str_subset(c("a", NA, "ab"), "a")` returns `c("a", NA, "ab")`. NAs are kept because the match test returns NA, which subset treats as "include". Filter with `str_subset(na.omit(x), "a")` if you want NAs dropped first.

[WARNING]
**str_subset() does not work on data frames.** Passing a tibble or data frame raises an error. To filter rows of a data frame by a string column, use `filter(df, str_detect(col, "pattern"))` with dplyr instead. str_subset() is only for atomic character vectors.

**Pitfall 3: empty result returns character(0), not NULL.** When no strings match, `str_subset()` returns a zero-length character vector. Check with `length(result) > 0` before downstream code that assumes at least one element.

## Try it yourself

**Try it:** Filter the built-in `state.name` vector to keep only states whose name starts with "New". Save the result to `ex_states`.

```r title="Your turn: filter state names"
# Try it: keep states starting with "New"
ex_states <- # your code here

ex_states
#> Expected: 4 states
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
library(stringr)
ex_states <- str_subset(state.name, "^New")
ex_states
#> [1] "New Hampshire" "New Jersey"    "New Mexico"    "New York"
```

**Explanation:** The pattern `"^New"` anchors the match to the start of each state name, so it keeps only states whose name begins with "New". Four states qualify.

</details>

## Related stringr functions

After mastering str_subset, look at:

- `str_detect()`: TRUE/FALSE mask version of the same logical test
- `str_which()`: integer index version, for slicing or positional joins
- `str_extract()`: extract the matched substring rather than the whole string
- `str_count()`: count matches within each string
- `str_replace()`: replace the matched pattern with new text

For complex patterns, the `regex()`, `fixed()`, `coll()`, and `boundary()` modifier functions in stringr give precise control over match behavior. Read the [stringr regex reference](https://stringr.tidyverse.org/articles/regular-expressions.html) for the full pattern syntax.

## FAQ

**How do I filter a vector of strings by a pattern in R?**

Use `stringr::str_subset(x, "pattern")`. It returns a character vector containing only the elements of `x` that match the pattern. The pattern is a regex by default; wrap with `fixed()` for a literal match. It is the tidyverse equivalent of `grep(pattern, x, value = TRUE)`.

**What is the difference between str_subset and str_detect in R?**

`str_detect()` returns a logical vector the same length as input (TRUE where the pattern matches). `str_subset()` returns only the matching elements. `str_subset(x, p)` is equivalent to `x[str_detect(x, p)]`. Use str_subset() when you want the values; str_detect() when you want a mask for further combining.

**Is str_subset the same as grep with value=TRUE?**

Yes, for simple cases. `str_subset(x, "p")` and `grep("p", x, value = TRUE)` return the same character vector. Differences: str_subset() supports the `negate` argument directly and handles modifiers like `fixed()` and `regex()` consistently. grep() requires zero packages and offers `perl = TRUE` for PCRE.

**How do I do a case-insensitive str_subset in R?**

Wrap the pattern in `regex(pattern, ignore_case = TRUE)`. Example: `str_subset(x, regex("apple", ignore_case = TRUE))` keeps strings matching "apple", "Apple", "APPLE", and so on.

**Can str_subset filter rows of a data frame?**

No. str_subset() only accepts atomic character vectors. To filter data frame rows by a string column, use dplyr: `filter(df, str_detect(col, "pattern"))`. str_detect() produces the logical mask that filter() needs.
