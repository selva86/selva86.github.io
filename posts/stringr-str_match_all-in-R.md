---
title: "stringr str_match_all() in R: All Regex Capture Groups"
slug: "stringr-str_match_all-in-R"
description: "Use stringr str_match_all() to extract every regex match plus capture groups in R. Returns a list of matrices, one per input. Flatten and 4 examples inside."
keywords: "stringr str_match_all, str_match_all function R, stringr str_match_all examples, R extract all regex matches, str_match_all vs str_match, multiple regex matches R, str_match_all list output"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "stringr-functions"
fr_parent: "stringr-in-R.html"
auto_link_terms: "str_match_all()|stringr str_match_all|stringr::str_match_all()|extract all regex matches|all capture groups"
auto_link_case_sensitive: true
target_keyword: "stringr str_match_all"
sibling_block_enabled: true
difficulty: "Beginner"
---

# stringr str_match_all() in R: All Regex Capture Groups

The `str_match_all()` function in stringr extracts EVERY regex match plus its capture groups from each input string. Unlike `str_match()`, which returns one matrix for the first match per string, `str_match_all()` returns a list of matrices, one per input. Reach for it when a single string can contain many matches.

[QUICK ANSWER]
str_match_all(x, "(\\d+)")                 # all numbers per string
str_match_all(x, "(\\w+)=(\\w+)")          # key=value pairs
str_match_all(x, "(?<k>\\w+)=(?<v>\\w+)")  # named groups
str_match_all(x, "(\\w+)@(\\w+)")[[1]]     # matrix for string 1
do.call(rbind, str_match_all(x, "(\\d+)")) # flatten to one matrix
length(str_match_all(x, "\\d+")[[1]])      # count matches in string 1
str_match_all(x, "<(\\w+)>([^<]+)</\\1>")  # paired XML-like tags

[DECISION TREE: Is str_match_all() the right tool?]
- all capture groups across all matches: str_match_all(x, pattern)
- only the first match per string: str_match(x, pattern)
- all matched substrings, no groups: str_extract_all(x, pattern)
- positions of every match: str_locate_all(x, pattern)
- count how many matches per string: str_count(x, pattern)
- replace every match: str_replace_all(x, pattern, replacement)
- split string at every delimiter: str_split(x, pattern)

## What str_match_all() does in one sentence

**`str_match_all(string, pattern)` returns a list with one character matrix per input string.** Each matrix has one row per match and one column for the full match plus one column per regex capture group.

That list-of-matrices shape is the whole story. Rows in matrix `i` are the matches found in string `i`; columns are the full match (column 1) and the capture groups (columns 2 onward). Strings with zero matches return a 0-row matrix, not `NULL`.

## Syntax and return shape

**The return type is `list`, not `matrix`.** This is the single most common surprise for readers coming from `str_match()`. You must subset with `[[i]]` to reach the matrix for input `i`.

```r title="Load stringr and inspect the return"
library(stringr)

x <- c("price=10 cost=8", "tax=2", "no pairs here")
result <- str_match_all(x, "(\\w+)=(\\d+)")
class(result)
#> [1] "list"

length(result)
#> [1] 3

result[[1]]
#>      [,1]       [,2]    [,3]
#> [1,] "price=10" "price" "10"
#> [2,] "cost=8"   "cost"  "8"
```

The first input contained two `key=value` pairs, so `result[[1]]` is a 2-row, 3-column matrix. The third input had no match, so `result[[3]]` is a 0-row matrix with the right column count, ready to bind without errors.

[KEY INSIGHT]
**Think of the output as parallel to the input.** `result[[i]]` always corresponds to `x[i]`, so you can iterate, name, or bind by position with confidence. The list shape preserves the input grouping.

## From list of matrices to a flat data frame

**`do.call(rbind, ...)` stacks the per-string matrices into one matrix.** This is the bridge from stringr's list output to a tidy frame you can `tibble::as_tibble()` and filter.

```r title="Flatten str_match_all output to one frame"
logs <- c(
  "user=alice action=login time=09:01",
  "user=bob action=logout time=18:45"
)

m <- do.call(rbind, str_match_all(logs, "(\\w+)=([^\\s]+)"))
colnames(m) <- c("pair", "key", "value")
head(m, 4)
#>      pair           key      value
#> [1,] "user=alice"   "user"   "alice"
#> [2,] "action=login" "action" "login"
#> [3,] "time=09:01"   "time"   "09:01"
#> [4,] "user=bob"     "user"   "bob"
```

This loses the source-string index unless you add it back. To keep it, use `Map(cbind, str_match_all(...), id = seq_along(x))` and bind after. The result is a one-row-per-match frame ready for analysis.

## Four practical patterns

### 1. Extract every key=value pair from a log line

Suitable for unstructured logs where pairs appear in varying order:

```r title="Pull all key=value pairs from log lines"
line <- "ts=2026-05-15 level=INFO user=alice ip=10.0.0.7"
str_match_all(line, "(\\w+)=([^\\s]+)")[[1]]
#>      [,1]            [,2]    [,3]
#> [1,] "ts=2026-05-15" "ts"    "2026-05-15"
#> [2,] "level=INFO"    "level" "INFO"
#> [3,] "user=alice"    "user"  "alice"
#> [4,] "ip=10.0.0.7"   "ip"    "10.0.0.7"
```

Columns 2 and 3 are the structured fields. Pivoting the resulting matrix wide gives you a one-row-per-event frame.

### 2. Pull all email addresses with user and host

When a free-text comment field can contain several emails:

```r title="Find every email plus user and host parts"
text <- c("contact alice@acme.com or bob@acme.com", "no email here")
str_match_all(text, "([\\w.]+)@([\\w.]+)")[[1]]
#>      [,1]            [,2]    [,3]
#> [1,] "alice@acme.com" "alice" "acme.com"
#> [2,] "bob@acme.com"   "bob"   "acme.com"

str_match_all(text, "([\\w.]+)@([\\w.]+)")[[2]]
#>      [,1] [,2] [,3]
```

The second input returns a 0-row matrix, which is what you want for `rbind` later.

### 3. Named groups for self-documenting matrices

Named groups put labels on columns, which makes downstream code less brittle:

```r title="Use named capture groups for readable columns"
versions <- c("v1.2.3-beta", "v2.0.0", "v1.10.5-rc")
out <- str_match_all(versions, "v(?<major>\\d+)\\.(?<minor>\\d+)\\.(?<patch>\\d+)")
out[[1]]
#>      [,1]    major minor patch
#> [1,] "v1.2.3" "1"   "2"   "3"
```

Subset by name with `out[[1]][, "minor"]` rather than `[, 3]`. Adding a new group later does not shift your indices.

### 4. Paired open/close tags with a backreference

Backreferences (`\\1`) match the same text twice, useful for paired markers:

```r title="Match opening and closing XML-like tags"
xml <- "<b>bold</b> and <i>italic</i> and <b>more</b>"
str_match_all(xml, "<(\\w+)>([^<]+)</\\1>")[[1]]
#>      [,1]           [,2] [,3]
#> [1,] "<b>bold</b>"  "b"  "bold"
#> [2,] "<i>italic</i>" "i" "italic"
#> [3,] "<b>more</b>"  "b"  "more"
```

For real HTML, use a parser like `rvest::read_html()` instead. Regex on nested markup breaks on edge cases.

## str_match_all() vs str_match() vs str_extract_all()

**Three closely-named functions, three distinct outputs.** Pick by what you need to recover, not by what sounds familiar.

| Function | Returns | Use when |
|---|---|---|
| `str_match(x, p)` | Character matrix, 1 row per input | One match per string, you want capture groups |
| `str_match_all(x, p)` | List of matrices, 1 per input | Many matches per string, you want capture groups |
| `str_extract(x, p)` | Character vector, 1 per input | One match per string, no groups needed |
| `str_extract_all(x, p)` | List of vectors, 1 per input | Many matches per string, no groups needed |

The `_all` variants always return a list because the count of matches per input varies. The non-`_all` variants return a fixed-shape result because there is exactly one slot per input.

[TIP]
**Default to the `_all` variant when in doubt.** It generalizes to single-match strings (you get a 1-row matrix) but `str_match()` silently drops extra matches when a string contains more than one. Wrong-answer-with-no-error is worse than verbose output.

## Common pitfalls

[WARNING]
**Forgetting the `[[i]]` subset.** `str_match_all(x, p)` returns a list; calling `dim()` or `[, 2]` on it raises a cryptic error. Always extract the matrix first with `result[[i]]`, or flatten with `do.call(rbind, result)`.

Three more traps to avoid:

- **Greedy quantifiers swallow neighbors.** `(\\w+)=(.+)` against `a=1 b=2` matches once with `b` in group 1 and `1 b=2` in group 2. Use `[^\\s]+` or non-greedy `.+?` for delimited fields.
- **Zero-match inputs return a 0-row matrix, not `NULL`.** That is helpful for `rbind`, but it can fool a naive `length(result[[i]])` check; use `nrow(result[[i]])` instead.
- **Capture-group count must match across inputs.** Different alternatives in the same pattern can yield missing groups; check the column count is what you expect before binding.

## Try it yourself

**Try it:** Extract every `#hashtag` from a tweet vector and return a flat character vector of just the tag text (no `#`). Save the result to `ex_tags`.

```r title="Your turn: extract hashtags"
tweets <- c("loving #rstats and #tidyverse", "#datascience all day", "no tags")
# Try it: pull just the tag word after each #
ex_tags <- # your code here

ex_tags
#> Expected: c("rstats", "tidyverse", "datascience")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
m <- str_match_all(tweets, "#(\\w+)")
ex_tags <- do.call(rbind, m)[, 2]
ex_tags
#> [1] "rstats"      "tidyverse"   "datascience"
```

**Explanation:** `str_match_all()` returns a list of matrices, one per tweet. `do.call(rbind, m)` stacks them into one matrix; column 2 is the captured tag text without the `#`.

</details>

## Related stringr functions

- `str_match()`: same idea, first match only, returns a single matrix.
- `str_extract_all()`: every match as a list of vectors, no capture groups.
- `str_locate_all()`: start and end positions of every match.
- `str_count()`: count matches per string, faster when you do not need the text.
- `str_replace_all()`: replace every match with a substitution.

For an end-to-end stringr walkthrough, see the parent [stringr in R guide](stringr-in-R.html). The official reference lives at [stringr.tidyverse.org/reference/str_match.html](https://stringr.tidyverse.org/reference/str_match.html).

## FAQ

**How is str_match_all() different from str_match() in R?**

`str_match()` returns a single character matrix with one row per input string and only the FIRST regex match per row. `str_match_all()` returns a list of matrices, with one matrix per input string containing every match. Use the `_all` variant when any input string can have more than one match. The list shape preserves the parallel structure with the input vector.

**Why does str_match_all() return a list instead of a matrix?**

Each input string can contain a different number of matches, so a single matrix cannot represent the result without padding. A list lets each element have its own row count. To flatten the list into one matrix, call `do.call(rbind, str_match_all(...))`; to keep the source-string index, prepend it with `Map(cbind, result, id = seq_along(x))` before binding.

**How do I extract named capture groups from str_match_all()?**

Use `(?<name>pattern)` syntax inside the regex. The returned matrices then have named columns matching your group names, so you can subset with `result[[1]][, "name"]` instead of positional indices. Named groups make code resilient when you later add or reorder capture groups.

**What does str_match_all() return when there are no matches?**

For each input with zero matches, the corresponding list element is a character matrix with 0 rows and the expected column count (1 + number of capture groups). It is NOT `NULL` or `NA`. Use `nrow(result[[i]]) == 0` to detect no-match cases; `do.call(rbind, ...)` then skips those rows automatically.

**Can str_match_all() handle vectorized input?**

Yes. Pass a character vector as the first argument; you get a list of the same length back. Each list element corresponds to one input string by position, so `result[[i]]` is always the matches for `x[i]`. This makes it safe to combine results with the original data via `mapply` or `Map`.
