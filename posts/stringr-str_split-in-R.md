---
title: "stringr str_split() in R: Split String by Pattern"
slug: "stringr-str_split-in-R"
description: "Use stringr str_split() and str_split_fixed() to split strings by a delimiter or regex in R. Covers list output, n argument, and 5 worked examples."
keywords: "str_split, stringr str_split R, split string in R, str_split_fixed, R strsplit alternative, regex split R"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "stringr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "str_split()|stringr str_split|stringr::str_split()|split string|str_split_fixed"
auto_link_case_sensitive: true
target_keyword: "stringr str_split"
sibling_block_enabled: true
difficulty: "Beginner"
---

# stringr str_split() in R: Split String by Pattern

<p class="lead">The <code>str_split()</code> function in stringr divides each input string into pieces by a pattern, returning a LIST of character vectors. Use <code>str_split_fixed()</code> when you need a fixed-column matrix.</p>

[QUICK ANSWER]
str_split(x, "/")                           # list (one element per string)
str_split(x, "/", n = 2)                    # split into at most 2 pieces
str_split_fixed(x, "/", n = 3)              # matrix with 3 columns
str_split_1(x, "/")                         # single string -> vector (stringr 1.5+)
str_split_i(x, "/", i = 2)                  # extract i-th piece
unlist(str_split(x, "/"))                   # flatten to single vector
str_split(x, regex("[,;]"))                 # multiple delimiters via regex

[DECISION TREE: Is str_split() the right tool?]
- general split, list output: str_split()
- single string -> vector: str_split_1() (stringr 1.5+)
- need a matrix shape: str_split_fixed()
- need just the i-th piece: str_split_i()
- splitting a column in a data frame: tidyr::separate()
- one-line regex split: str_split with regex pattern
- unique tokens from text: unlist + unique

## What str_split() does in one sentence

**`str_split(string, pattern)` returns a LIST where each element is a character vector of pieces from the corresponding input string.** This is necessary because different strings may produce different numbers of pieces.

For most uses, you immediately want one of: a vector (single input), a matrix (consistent piece count), or a specific piece (i-th element). stringr provides specialized functions for each case.

## Syntax

**`str_split(string, pattern, n = Inf)`. Returns a list. Pattern is regex by default.**

```r title="Load stringr and split a vector"
library(stringr)

x <- c("a/b/c", "x/y", "1/2/3/4")

str_split(x, "/")
#> [[1]]
#> [1] "a" "b" "c"
#>
#> [[2]]
#> [1] "x" "y"
#>
#> [[3]]
#> [1] "1" "2" "3" "4"
```

The result is a list of length 3 (one per input string). Each element is a character vector of pieces.

[TIP]
**`str_split_fixed(x, "/", n = 3)` returns a 3-column matrix. Strings with fewer pieces get empty strings; strings with more pieces have the rest concatenated into the last column.** Use this when you need a tabular shape and know the maximum piece count.

## Five common patterns

### 1. Basic split

```r title="Split paths by /"
str_split(c("a/b/c", "x/y"), "/")
#> [[1]]
#> [1] "a" "b" "c"
#>
#> [[2]]
#> [1] "x" "y"
```

### 2. Split into matrix

```r title="Fixed-column matrix"
str_split_fixed(c("a/b/c", "x/y"), "/", n = 3)
#>      [,1] [,2] [,3]
#> [1,] "a"  "b"  "c"
#> [2,] "x"  "y"  ""
```

The second row has only 2 pieces; the missing third becomes an empty string.

### 3. Single string -> vector

```r title="Split one string and get vector directly"
str_split_1("a,b,c", ",")
#> [1] "a" "b" "c"
```

`str_split_1()` (stringr 1.5+) is for the common case of splitting ONE string. Returns a flat vector instead of a 1-element list.

### 4. Extract i-th piece

```r title="Get the second piece from each"
str_split_i(c("a-b-c", "x-y-z"), "-", i = 2)
#> [1] "b" "y"
```

`str_split_i()` does split + indexing in one call. Cleaner than `sapply(str_split(x, "-"), \(p) p[2])`.

### 5. Multi-character or regex delimiter

```r title="Split on commas OR semicolons"
str_split(c("a,b;c", "x;y,z"), regex("[,;]"))
#> [[1]]
#> [1] "a" "b" "c"
#>
#> [[2]]
#> [1] "x" "y" "z"
```

Pass a regex to split on multiple delimiters. The character class `[,;]` matches either comma or semicolon.

[KEY INSIGHT]
**Use `str_split_fixed()` when output shape matters (data frame columns), `str_split()` for general flexibility, `str_split_i()` for extracting one piece, and `str_split_1()` for a single string.** Each variant is optimized for a specific case; mixing them up leads to awkward `unlist`/`sapply` patterns.

## Common pitfalls

**Pitfall 1: forgetting that `str_split()` returns a LIST.** Even for a single input, `str_split("a/b", "/")` returns a list of one element, not a vector. Use `str_split_1()` for vector output.

**Pitfall 2: regex pattern when literal was intended.** `str_split(x, ".")` splits on EVERY character (regex `.`). Use `fixed(".")` to split on actual dot.

[WARNING]
**`str_split_fixed(x, p, n = 3)` SILENTLY truncates strings that produce more than n pieces.** If a string has 4 pieces with n = 3, the last 2 are joined into the third column. Set n high enough or use plain `str_split()` if you need every piece.

## Try it yourself

**Try it:** Split each email address in `emails` to get the domain part (after the @). Save to `ex_domains`.

```r title="Your turn: extract email domains"
emails <- c("a@example.com", "b@gmail.com", "c@r-project.org")

ex_domains <- # your code here

ex_domains
#> Expected: c("example.com", "gmail.com", "r-project.org")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_domains <- str_split_i(emails, "@", i = 2)
ex_domains
#> [1] "example.com"   "gmail.com"     "r-project.org"
```

**Explanation:** Each email splits into 2 parts at "@". `str_split_i(..., i = 2)` extracts the second piece from each, giving the domain.

</details>

## Related stringr functions

After mastering str_split, look at:

- `tidyr::separate_wider_delim()`: split a column in a data frame
- `str_subset()`: filter strings matching a pattern
- `str_extract()`: extract matched substrings
- `str_count()`: count delimiter occurrences (predict pieces)
- `strsplit()`: base R equivalent

For data frame columns, prefer `tidyr::separate_wider_delim()` over manually splitting and reshaping.

## FAQ

**How do I split a string by delimiter in R?**

Use `stringr::str_split(x, "delimiter")` for general use (returns list). For a single string, `str_split_1(x, "delimiter")` returns a vector. For a matrix, `str_split_fixed(x, "delimiter", n)`.

**What is the difference between str_split and strsplit?**

Both return a list of character vectors. `str_split()` is from stringr, more consistent (NA -> NA), and integrates better with the tidyverse. `strsplit()` is base R with no package dependency.

**How do I split into a fixed number of pieces?**

Use `str_split_fixed(x, pattern, n = N)` for a matrix with exactly N columns. Or `str_split(x, pattern, n = N)` to limit pieces in the list output (everything past N stays joined).

**How do I get just one piece from each split?**

Use `str_split_i(x, pattern, i = 2)` to extract the i-th piece from each split. Cleaner than mapping over the list output.

**How do I split a column in a data frame?**

Use `tidyr::separate_wider_delim(df, cols = col, delim = "/", names = c("a","b","c"))`. It is the data-frame-specific tool, while str_split is for raw strings.
