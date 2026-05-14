---
title: "stringr str_locate_all() in R: Find Every Match Position"
slug: "stringr-str_locate_all-in-R"
description: "Use stringr str_locate_all() to find every regex match position in R. Covers list-of-matrices output, flattening, counting, tokenization, and pitfalls."
keywords: "str_locate_all, stringr str_locate_all, R all match positions, regex all matches R, str_locate_all examples, str_locate vs str_locate_all, R tokenize positions"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "stringr-functions"
fr_parent: "stringr-in-R.html"
auto_link_terms: "str_locate_all()|stringr str_locate_all|stringr::str_locate_all()|all match positions|every regex match"
auto_link_case_sensitive: true
target_keyword: "stringr str_locate_all"
sibling_block_enabled: true
difficulty: "Beginner"
---

# stringr str_locate_all() in R: Find Every Match Position

<p class="lead">The <code>str_locate_all()</code> function in stringr returns the start and end character positions of EVERY regex match in each input string, as a list of two-column integer matrices, one matrix per string. Use it when you need positions of all occurrences, not just the first.</p>

[QUICK ANSWER]
str_locate_all(x, "pattern")                       # all matches: list of matrices
str_locate_all(x, fixed("."))                      # literal, not regex
str_locate_all(x, regex("a", ignore_case = TRUE))  # case-insensitive
str_locate_all(x, "\\d+")                          # every digit run per string
lengths(str_locate_all(x, "a")) / 2                # match count per string (or use nrow on each)
sapply(str_locate_all(x, "\\w+"), nrow)            # rows per string, the right way
do.call(rbind, str_locate_all(x, "\\d+"))          # flatten to one matrix
str_sub(x[1], str_locate_all(x, "\\d+")[[1]])      # extract every match in row 1

[DECISION TREE: Is str_locate_all() the right tool?]
- find positions of every match per string: str_locate_all()
- find only the FIRST match position: str_locate()
- extract every matched substring (no position): str_extract_all()
- count matches per string without positions: str_count()
- check if any match exists: str_detect()
- split string at every match: str_split()
- replace every match in place: str_replace_all()

## What str_locate_all() does in one sentence

**`str_locate_all(string, pattern)` returns a list with one element per input string, where each element is a two-column integer matrix of `start` and `end` positions for every non-overlapping match.** Strings with zero matches return a 0-row matrix, NEVER `NA`.

The shape difference from `str_locate()` (which returns a single matrix) is the source of most confusion. `str_locate_all()` ALWAYS returns a list, even for length-1 inputs. Code that worked on `str_locate()` output will not work unmodified.

## Syntax

**`str_locate_all(string, pattern)`. The output is `length(string)` matrices wrapped in a list; each matrix has one row per match and two columns (`start`, `end`).**

```r title="Locate every digit run in three strings"
library(stringr)
library(tibble)

x <- c("order 12 and 345 then 6789", "no numbers", "1 2 3 4 5")
str_locate_all(x, "\\d+")
#> [[1]]
#>      start end
#> [1,]     7   8
#> [2,]    14  16
#> [3,]    23  26
#>
#> [[2]]
#>      start end
#>
#> [[3]]
#>      start end
#> [1,]     1   1
#> [2,]     3   3
#> [3,]     5   5
#> [4,]     7   7
#> [5,]     9   9
```

[TIP]
**Use `str_locate_all()` whenever you write a regex with a quantifier (`+`, `*`, `{n,}`) and expect multiple hits.** The single-match `str_locate()` silently keeps only the first hit, which is a frequent bug source in tokenization and span-extraction code.

## Five common patterns

### 1. Count matches per string

The simplest aggregate: how many matches does each string contain. Each list element's row count gives the answer.

```r title="Count digit runs per string"
sentences <- c("Q1 hit 42 sales", "Q2 hit 89 sales and 12 returns", "Q3 quiet")

n_hits <- sapply(str_locate_all(sentences, "\\d+"), nrow)
n_hits
#> [1] 2 3 0
```

For just the count, `str_count()` is shorter (`str_count(sentences, "\\d+")`); reach for `str_locate_all()` when you also need the positions for downstream slicing.

### 2. Flatten the list into a data frame

A list of matrices is awkward for joins or summaries. Flatten it into a long-format data frame with one row per match, keyed by input string ID.

```r title="Flatten matches into a tidy data frame"
library(dplyr)

logs <- c("ERR-2024-01 in main.R", "INFO-2025-03 and ERR-2025-09")
mats <- str_locate_all(logs, "ERR-\\d{4}-\\d{2}|INFO-\\d{4}-\\d{2}")

flat <- bind_rows(lapply(seq_along(mats), function(i) {
  if (nrow(mats[[i]]) == 0) return(NULL)
  data.frame(string_id = i, start = mats[[i]][, "start"], end = mats[[i]][, "end"])
}))
flat
#>   string_id start end
#> 1         1     1  11
#> 2         2     1  12
#> 3         2    18  28
```

The `string_id` column is what lets you join the matches back to the original strings or to other tables.

### 3. Extract every matched substring via positions

Pair each match's positions with `str_sub()` to pull the actual text. This is the long way to do what `str_extract_all()` does, but it preserves the positions for downstream use (highlighting, tagging).

```r title="Extract all hashtags AND keep positions"
posts <- c("loving #rstats and #tidyverse today", "no tags here", "#one #two #three")

mats <- str_locate_all(posts, "#\\w+")
extracted <- mapply(function(s, m) {
  if (nrow(m) == 0) character(0)
  else str_sub(s, m[, "start"], m[, "end"])
}, posts, mats, SIMPLIFY = FALSE)

extracted
#> [[1]]
#> [1] "#rstats"     "#tidyverse"
#>
#> [[2]]
#> character(0)
#>
#> [[3]]
#> [1] "#one"   "#two"   "#three"
```

[KEY INSIGHT]
**When you need both the matched text AND the index, `str_locate_all()` is the only stringr matcher that gives you both for every hit.** `str_extract_all()` drops positions; `str_count()` drops both text and positions. Only locate_all preserves the full structure.

### 4. Tokenize: assign positions to a flat token table

Build a token table where every word has a position. This is the building block for highlight rendering, named-entity tagging, or span-level joins.

```r title="Build a token table for one sentence"
sentence <- "The quick brown fox jumps over the lazy dog"

m <- str_locate_all(sentence, "\\w+")[[1]]
tokens <- tibble::tibble(
  token = str_sub(sentence, m[, "start"], m[, "end"]),
  start = m[, "start"],
  end   = m[, "end"]
)
tokens
#> # A tibble: 9 x 3
#>   token start   end
#>   <chr> <int> <int>
#> 1 The       1     3
#> 2 quick     5     9
#> 3 brown    11    15
#> 4 fox      17    19
#> 5 jumps    21    25
#> ...
```

The positions let you reconstruct the original spacing (column gaps), highlight matches in a rendering, or compute distances between tokens.

### 5. Highlight all matches with markup

Wrap every match in tags by walking positions from right to left (so earlier inserts do not shift later positions).

```r title="Wrap every numeric span in brackets"
txt <- "Sales were 120 in Q1, 245 in Q2, and 80 in Q3"
m <- str_locate_all(txt, "\\d+")[[1]]

out <- txt
for (i in nrow(m):1) {
  out <- paste0(
    str_sub(out, 1, m[i, "start"] - 1),
    "[", str_sub(out, m[i, "start"], m[i, "end"]), "]",
    str_sub(out, m[i, "end"] + 1)
  )
}
out
#> [1] "Sales were [120] in Q1, [245] in Q2, and [80] in Q3"
```

Right-to-left iteration is the standard trick. Iterating left-to-right shifts every match's position by the inserted-character count and breaks downstream indexing.

## Common pitfalls

**Pitfall 1: treating the output as a matrix.** `str_locate_all(x, "a")[, "start"]` errors because the output is a LIST. Use `[[i]]` to get the i-th matrix first, THEN subset its columns: `str_locate_all(x, "a")[[1]][, "start"]`.

**Pitfall 2: counting with `length()` on the list.** `length(str_locate_all(x, "a"))` returns the input string count, not the match count. Use `sapply(..., nrow)` for per-string match counts.

[WARNING]
**Non-overlapping matches only.** `str_locate_all("aaaa", "aa")` returns 2 matches (positions 1-2 and 3-4), NOT 3. stringr scans left-to-right consuming each match; the regex engine cannot revisit consumed characters. Use a lookahead pattern (`(?=aa)`) for overlapping matches.

## Try it yourself

**Try it:** Find the positions of every uppercase letter in `state.name[1:5]` (the first five US state names). Save the LIST to `ex_caps`, then count uppercase letters in each state name.

```r title="Your turn: locate every uppercase letter"
states <- state.name[1:5]

ex_caps <- # your code here

sapply(ex_caps, nrow)
#> Expected: 1 1 1 2 2 (Alabama=1, Alaska=1, Arizona=1, Arkansas=1, California=2... actually let me recheck)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
states <- state.name[1:5]
states
#> [1] "Alabama" "Alaska" "Arizona" "Arkansas" "California"

ex_caps <- str_locate_all(states, "[A-Z]")
sapply(ex_caps, nrow)
#> [1] 1 1 1 1 1
```

**Explanation:** `str_locate_all(states, "[A-Z]")` returns a 5-element list, each containing a matrix with one row per capital letter found. The first five state names each contain exactly one uppercase letter (the leading character), so each matrix has 1 row.

</details>

## str_locate_all vs str_locate

**The return shape is the only meaningful difference; the pattern engine is identical.** Pick the function whose output matches what your downstream code expects.

| Aspect | `str_locate()` | `str_locate_all()` |
|---|---|---|
| Matches per string | First only | All non-overlapping |
| Return type | Matrix | List of matrices |
| No match | Row of NAs | 0-row matrix |
| Length-1 input | Still a matrix | Still wrapped in a list |
| Best for | Single delimiter or first-hit parsing | Tokenization, counting, highlighting |

A common refactor pattern: prototype with `str_locate()` for one example, then switch to `str_locate_all()` once you confirm the downstream code needs all matches.

## Related stringr functions

After mastering str_locate_all, look at:

- `str_locate()`: first match position per string (sibling, simpler return)
- `str_extract_all()`: every matched substring as a list of character vectors
- `str_count()`: number of matches per string (when positions are not needed)
- `str_split()`: split string at every match
- `str_replace_all()`: replace every match in place
- `gregexpr()`: base R equivalent with attribute-based match lengths

For pattern grammar reference, see the official [stringr regular expressions vignette](https://stringr.tidyverse.org/articles/regular-expressions.html).

## FAQ

**How do I find all positions of a pattern in a string in R?**

Use `stringr::str_locate_all(string, "pattern")`. It returns a list where each element is a two-column matrix of `start` and `end` positions for every match in the corresponding input string. For a single string, access the matrix with `[[1]]`.

**What is the difference between str_locate and str_locate_all in R?**

`str_locate()` returns ONE row per input (the first match) packaged as a matrix; `str_locate_all()` returns ONE matrix per input (every match) packaged as a list. Use locate for first-hit parsing, locate_all for counting, tokenization, and highlighting.

**How do I count matches per string using str_locate_all?**

Apply `nrow()` to each matrix: `sapply(str_locate_all(x, pattern), nrow)`. For just the count, `str_count(x, pattern)` is shorter. Use the locate_all path only when you also need the positions for slicing.

**Does str_locate_all return overlapping matches?**

No. It returns non-overlapping matches, scanning left-to-right. For example, `str_locate_all("aaaa", "aa")` returns 2 matches at positions 1-2 and 3-4. Use a lookahead pattern like `(?=aa)` if you need overlapping matches.

**How do I flatten str_locate_all output to a data frame?**

Loop over the list with `lapply()` or `purrr::map()` to build per-string data frames with a `string_id` column, then `bind_rows()` them. This long-format layout lets you join positions back to the source strings or to other tables.
