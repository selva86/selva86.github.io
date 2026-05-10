---
title: "grep() and grepl() in R: Search Strings With Patterns"
slug: "base-grep-grepl-in-R"
description: "Use base R grep() and grepl() to search character vectors for regex or literal matches. Covers ignore.case, fixed, perl, value, invert, and 5 examples."
keywords: "grep in R, grepl R, R pattern match, regex search R, grep ignore case, R fixed pattern, grep value, base R string search"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "base-r-essentials"
fr_parent: "R-Vectors.html"
auto_link_terms: "grep()|grepl()|R grep|pattern match|regex search"
auto_link_case_sensitive: true
target_keyword: "grep in R"
sibling_block_enabled: true
difficulty: "Beginner"
---

# grep() and grepl() in R: Search Strings With Patterns

<p class="lead">The <code>grep()</code> function in base R returns INDEXES of matches; <code>grepl()</code> returns a LOGICAL vector. Both search a character vector for elements matching a regex (or fixed string).</p>

[QUICK ANSWER]
grep("apple", x)                          # indexes of matches
grepl("apple", x)                         # TRUE/FALSE vector
grep("apple", x, value = TRUE)            # matched values
grep("apple", x, ignore.case = TRUE)      # case-insensitive
grep("\\.csv$", files)                    # regex anchor
grep("apple", x, fixed = TRUE)            # literal string (no regex)
grep("apple", x, invert = TRUE)           # non-matches

[DECISION TREE: Is grep() the right tool?]
- get INDEX of matches: grep()
- get TRUE/FALSE vector: grepl()
- get the matched STRINGS: grep(value = TRUE) or stringr::str_subset()
- check ANY match (single bool): any(grepl(...))
- count matches: sum(grepl(...))
- replace match: gsub() / sub()
- extract matched substring: regmatches() or stringr::str_extract()

## What grep() does in one sentence

**`grep(pattern, x)` returns the integer positions of `x`'s elements that match `pattern`; `grepl()` returns the same result as a logical vector.** Both default to regex; use `fixed = TRUE` for literal text.

These two functions are the workhorses of base R string search. Their cousins `sub()` and `gsub()` do replacement.

## Syntax

**`grep(pattern, x, ignore.case = FALSE, perl = FALSE, fixed = FALSE, value = FALSE, invert = FALSE)`.**

```r title="Find indexes of strings containing 'apple'"
x <- c("apple pie", "banana", "apple", "cherry")
grep("apple", x)
#> [1] 1 3
grepl("apple", x)
#> [1]  TRUE FALSE  TRUE FALSE
```

[TIP]
**Use `grepl` for filtering with `subset()` or `[`; use `grep` for index-based slicing.** Both are vectorized and equally fast. Pick the one that fits your downstream use cleanly.

## Five common patterns

### 1. Filter a vector

```r title="Keep only matching strings"
x <- c("apple pie", "banana", "apple", "cherry")
x[grepl("apple", x)]
#> [1] "apple pie" "apple"
```

Equivalent to `grep("apple", x, value = TRUE)`.

### 2. Filter a data frame

```r title="Keep rows where a column matches"
df <- data.frame(item = c("apple pie", "banana", "apple cake"))
df[grepl("apple", df$item), ]
#>         item
#> 1  apple pie
#> 3 apple cake
```

### 3. Case-insensitive search

```r title="ignore.case = TRUE"
x <- c("Apple", "BANANA", "apple", "Cherry")
grep("apple", x, ignore.case = TRUE)
#> [1] 1 3
```

### 4. Anchored regex (file extensions)

```r title="Find .csv files"
files <- c("data.csv", "report.txt", "summary.csv", "log")
grep("\\.csv$", files, value = TRUE)
#> [1] "data.csv"    "summary.csv"
```

`\\.` is an escaped literal dot; `$` anchors to end of string.

### 5. Inverted match (non-matches)

```r title="Find rows that DON'T match"
grep("apple", c("apple", "banana", "cherry"), invert = TRUE, value = TRUE)
#> [1] "banana" "cherry"
```

`invert = TRUE` returns elements that do NOT match.

[KEY INSIGHT]
**`grep` and `grepl` differ only in what they return.** Same arguments, same regex engine. `grep` returns positions (or values with `value = TRUE`); `grepl` returns booleans. Pick whichever feeds into your next step naturally.

## grep() vs grepl() vs str_detect() vs str_subset()

**Four "is this string a match?" functions across base and stringr.**

| Function | Package | Returns | Vectorized |
|---|---|---|---|
| `grep()` | base | Integer positions | Yes |
| `grepl()` | base | Logical vector | Yes |
| `stringr::str_detect()` | stringr | Logical vector | Yes |
| `stringr::str_subset()` | stringr | Filtered vector | Yes |
| `stringr::str_which()` | stringr | Integer positions | Yes |

When to use which:

- **grep / grepl** for base R purity, no dependencies.
- **str_detect** for tidyverse pipelines (consistent with str_replace, str_extract).
- **str_subset** as a shortcut for `x[grepl(p, x)]`.

The stringr functions take arguments in a more consistent order: `str_detect(string, pattern)` vs `grepl(pattern, x)`. The base functions put pattern first; stringr puts string first to fit pipes.

## A practical regex search workflow

**Most string-filtering tasks combine three steps: detect, subset, validate.**

1. **Detect** which rows match (`grepl`).
2. **Subset** to those rows.
3. **Validate** the regex caught what you intended.

Always sanity-check matches by inspecting a sample. A regex that matches "too much" or "too little" is the most common bug. For complex patterns, build them up incrementally and test each addition.

## Common pitfalls

**Pitfall 1: regex special characters.** `grep(".", x)` matches EVERY string (`.` is regex for any character). Use `fixed = TRUE` or escape: `grep("\\.", x)`.

**Pitfall 2: NA elements.** `grepl("a", c("apple", NA))` returns `c(TRUE, NA)`. Filter NAs first or use `which()` instead of subsetting with the result.

[WARNING]
**`grep` returns INDEX positions; `grepl` returns LOGICAL.** Mixing them up is a common bug. `x[grep(...)]` keeps matching elements; `x[grepl(...)]` does the same. `x[!grep(...)]` is WRONG (negating an index vector). Use `grepl` and `!` together: `x[!grepl(...)]`.

## When to use perl = TRUE

**Base R supports two regex engines: POSIX (default) and PCRE (Perl-compatible) via `perl = TRUE`.** PCRE is more powerful: it supports lookbehinds `(?<=)`, lookaheads `(?=)`, non-greedy quantifiers `*?` `+?`, and inline flags like `(?i)` for case-insensitive. The default POSIX engine handles most common patterns but errors on PCRE-only constructs. When in doubt, set `perl = TRUE`: it covers a strict superset of the default behaviour and is what most modern regex tutorials assume. The performance cost is negligible for typical inputs.

## Try it yourself

**Try it:** Filter the `iris` species names to keep only those starting with "v" (case-insensitive). Save to `ex_v_species`.

```r title="Your turn: keep species starting with v"
species <- as.character(unique(iris$Species))

ex_v_species <- # your code here

ex_v_species
#> Expected: c("versicolor", "virginica")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_v_species <- grep("^v", species, ignore.case = TRUE, value = TRUE)
ex_v_species
#> [1] "versicolor" "virginica"
```

**Explanation:** `^v` anchors the match to the start of the string. `ignore.case = TRUE` matches both "v" and "V". `value = TRUE` returns the matching strings.

</details>

## Related search functions

After mastering grep, look at:

- `sub()` and `gsub()`: replace match (first / all)
- `regmatches()`: extract the matched substring
- `regexpr()` / `gregexpr()`: find positions of matches
- `stringr::str_detect()` and friends: tidyverse equivalents
- `startsWith()` / `endsWith()`: prefix / suffix matching (faster than regex)

For literal prefix / suffix checks, `startsWith` and `endsWith` are faster than regex anchors.

## FAQ

**What is the difference between grep and grepl in R?**

`grep` returns the INTEGER POSITIONS of matches (or matched strings if `value = TRUE`). `grepl` returns a LOGICAL vector with TRUE for matches and FALSE for non-matches. Same arguments otherwise.

**How do I do a case-insensitive grep in R?**

Pass `ignore.case = TRUE`: `grep("apple", x, ignore.case = TRUE)`. Or use the inline regex flag: `grep("(?i)apple", x, perl = TRUE)`.

**How do I search for a literal string with grep?**

Pass `fixed = TRUE`: `grep(".", x, fixed = TRUE)` matches the literal `.` (period) instead of "any character".

**How do I count matches with grep?**

`length(grep(p, x))` or `sum(grepl(p, x))`. Both give the count.

**How do I get the actual matched strings instead of indexes?**

Pass `value = TRUE`: `grep("apple", x, value = TRUE)`. Or use `x[grepl("apple", x)]`. Both give matching strings.
