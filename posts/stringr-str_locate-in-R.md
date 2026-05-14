---
title: "stringr str_locate() in R: Find Match Positions in Strings"
slug: "stringr-str_locate-in-R"
description: "Use stringr str_locate() to find start and end positions of regex matches in R. Covers the position matrix, str_locate_all, NA handling, and 5 worked examples."
keywords: "str_locate, stringr str_locate, R match position, regex position R, str_locate_all, R substring position, find match index"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "stringr-functions"
fr_parent: "stringr-in-R.html"
auto_link_terms: "str_locate()|stringr str_locate|stringr::str_locate()|str_locate_all()|match position"
auto_link_case_sensitive: true
target_keyword: "stringr str_locate"
sibling_block_enabled: true
difficulty: "Beginner"
---

# stringr str_locate() in R: Find Match Positions in Strings

<p class="lead">The <code>str_locate()</code> function in stringr returns the start and end character positions of the FIRST regex match in each string, as a two-column integer matrix. Use <code>str_locate_all()</code> for every match per string.</p>

[QUICK ANSWER]
str_locate(x, "pattern")                       # first match: matrix start/end
str_locate_all(x, "pattern")                   # all matches: list of matrices
str_locate(x, fixed("."))                      # literal match (skip regex)
str_locate(x, regex("a", ignore_case = TRUE))  # case-insensitive
str_locate(x, "\\d+")                          # first run of digits
str_sub(x, str_locate(x, "\\d+"))              # extract via positions
str_locate(x, "@")[, "start"]                  # column subset

[DECISION TREE: Is str_locate() the right tool?]
- find start and end position of first match: str_locate()
- find positions of all matches per string: str_locate_all()
- get the matched substring directly: str_extract()
- check if pattern exists (TRUE or FALSE): str_detect()
- replace matched text: str_replace()
- count matches per string: str_count()
- split string at match position: str_split() or str_sub()

## What str_locate() does in one sentence

**`str_locate(string, pattern)` returns an integer matrix with `start` and `end` columns giving the character positions of the first match in each input string.** Strings with no match return `NA` in both columns.

The matrix output is what sets `str_locate()` apart from the other stringr matchers: you can pipe positions straight into `str_sub()` to slice substrings, or use the start column to find delimiters for parsing.

## Syntax

**`str_locate(string, pattern)`. Returns a matrix; rows align with input strings, columns are `start` and `end`.**

```r title="Load stringr and locate first match"
library(stringr)
library(tibble)

x <- c("apple pie", "banana bread", "cherry tart", "no match here")
str_locate(x, "pie|bread|tart")
#>      start end
#> [1,]     7   9
#> [2,]     8  12
#> [3,]     8  11
#> [4,]    NA  NA
```

[TIP]
**Always think of the result as a matrix, not a vector.** Subset columns with `[, "start"]` or `[, "end"]`. Subset rows with `[i, ]`. Treating the result as a vector silently misuses the data.

## Five common patterns

### 1. First match position

```r title="Find position of first digit run"
codes <- c("INV-2024-08", "REF-99", "no number")
str_locate(codes, "\\d+")
#>      start end
#> [1,]     5   8
#> [2,]     5   6
#> [3,]    NA  NA
```

The `start` column gives the index of the first matching character; `end` gives the last. NA in both columns means no match.

### 2. All matches per string

```r title="Locate every digit run, not just the first"
str_locate_all(codes, "\\d+")
#> [[1]]
#>      start end
#> [1,]     5   8
#> [2,]    10  11
#>
#> [[2]]
#>      start end
#> [1,]     5   6
#>
#> [[3]]
#>      start end
```

`str_locate_all()` returns a LIST of matrices, one per input. Empty matrices (zero rows) signal no match.

### 3. Slice substrings using positions

```r title="Pipe positions into str_sub"
emails <- c("alice@x.com", "bob@y.org", "no-email")
positions <- str_locate(emails, "@.+")
str_sub(emails, positions)
#> [1] "@x.com" "@y.org" NA
```

`str_sub()` accepts the position matrix directly. This is the canonical way to extract a match when you want to keep both the substring and the index.

### 4. Find a delimiter for parsing

```r title="Split key=value at the first equals sign"
kv <- c("color=red", "size=12", "weight=heavy")
eq <- str_locate(kv, "=")[, "start"]
data.frame(
  key   = str_sub(kv, 1, eq - 1),
  value = str_sub(kv, eq + 1)
)
#>      key value
#> 1  color   red
#> 2   size    12
#> 3 weight heavy
```

Locating a single character (the `=`) and arithmetic on the position is faster and clearer than a regex with capture groups when you only need to split at one point.

### 5. Use inside a data frame

```r title="Add start, end columns with mutate"
library(dplyr)
df <- tibble::tibble(text = c("order #123", "ref #45", "no id"))

df |>
  mutate(
    start = str_locate(text, "#\\d+")[, "start"],
    end   = str_locate(text, "#\\d+")[, "end"]
  )
#> # A tibble: 3 x 3
#>   text       start   end
#>   <chr>      <int> <int>
#> 1 order #123     7    10
#> 2 ref #45        5     7
#> 3 no id         NA    NA
```

[KEY INSIGHT]
**Position-based extraction beats pattern-based extraction when you need both the value AND its location in the original string.** Use `str_extract()` for value-only; reach for `str_locate()` when downstream code needs the index (highlighting, slicing, joining adjacent fields).

## Common pitfalls

**Pitfall 1: forgetting it returns a matrix.** `str_locate(x, "a") + 1` works (matrix arithmetic), but `length(str_locate(x, "a"))` returns the cell count, not the row count. Use `nrow()` or subset to a column first.

**Pitfall 2: confusing `str_locate()` with `str_locate_all()`.** The first returns a matrix; the second returns a list of matrices. Code that loops over the result depends on which you called.

[WARNING]
**`str_locate()` reports CHARACTER positions, not byte positions.** A string with multibyte UTF-8 characters (emoji, accented letters) is indexed by character, not by byte. This matches `str_sub()` and `nchar()` but differs from base R `regexpr()`, which returns byte positions on some platforms.

## Try it yourself

**Try it:** Find the start position of the substring "color" in `iris$Species` (as character). Save the integer vector to `ex_pos`.

```r title="Your turn: locate 'color' in species names"
species <- as.character(iris$Species)

ex_pos <- # your code here

ex_pos
#> Expected: NA NA ... 8 8 8 (50 NA, 50 NA, 50 eights for versicolor)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
species <- as.character(iris$Species)
ex_pos <- str_locate(species, "color")[, "start"]
table(ex_pos, useNA = "ifany")
#> ex_pos
#>    8 <NA>
#>   50  100
```

**Explanation:** `str_locate(species, "color")` returns a 150-row matrix; subsetting `[, "start"]` gives the start positions. Only the 50 "versicolor" rows match (start at character 8); the other 100 are NA.

</details>

## str_locate vs other stringr matchers

**Pick the matcher whose return shape matches what your downstream code consumes.** The five most common stringr matchers differ only in what they hand back; the pattern engine is identical.

| Function | Returns | Use when you need |
|---|---|---|
| `str_locate()` | Matrix: start, end of first match | Position of the first match |
| `str_locate_all()` | List of matrices, one per string | Positions of every match |
| `str_extract()` | Matched substring (length-N character) | Just the matched text |
| `str_detect()` | Logical vector | TRUE/FALSE per string |
| `str_count()` | Integer vector | Number of matches per string |

Reach for `str_locate()` only when the index matters; otherwise the others are usually a shorter path.

## Related stringr functions

After mastering str_locate, look at:

- `str_locate_all()`: positions of every match per string
- `str_extract()`: pull out the matched substring
- `str_sub()`: slice substrings by start and end position
- `str_detect()`: check if a pattern exists
- `str_count()`: count matches per string
- `regexpr()`: base R equivalent (returns positions plus match length attribute)

For full pattern grammar, see the official [stringr regular expressions vignette](https://stringr.tidyverse.org/articles/regular-expressions.html).

## FAQ

**How do I find the position of a substring in R?**

Use `stringr::str_locate(string, "substring")`. It returns a matrix with `start` and `end` columns giving the character positions of the first match. For all matches, use `str_locate_all()`, which returns a list of matrices, one per input string.

**What is the difference between str_locate and str_extract in R?**

`str_locate()` returns the POSITION of the match as a matrix of integers; `str_extract()` returns the matching SUBSTRING itself. Use locate when you need the index (for slicing, highlighting, joining); use extract when you only need the matched text.

**How do I get all match positions, not just the first, in R?**

Use `str_locate_all(x, "pattern")`. It returns a list of matrices, where each matrix has one row per match. To collapse into a single data frame, combine with `purrr::map_dfr()` or `do.call(rbind, ...)`.

**What does str_locate return when no match is found?**

It returns `NA` in both the `start` and `end` columns for that row. The matrix shape is preserved, so you can still subset by row or column without errors.

**How do I extract a substring using str_locate in R?**

Pass the matrix directly to `str_sub()`: `str_sub(x, str_locate(x, "pattern"))`. `str_sub()` accepts a two-column matrix as its position argument, slicing each string by its corresponding row.
