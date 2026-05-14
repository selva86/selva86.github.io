---
title: "stringr str_extract_all() in R: Every Regex Match"
slug: "stringr-str_extract_all-in-R"
description: "Use stringr str_extract_all() to get every regex match per string in R. Covers list output, simplify=TRUE, unlist, unnest_longer, and 5 worked examples."
keywords: "str_extract_all, stringr str_extract_all, R extract all matches, regex all matches R, str_extract_all examples, str_extract vs str_extract_all, R extract every match"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "stringr-functions"
fr_parent: "stringr-in-R.html"
auto_link_terms: "str_extract_all()|stringr str_extract_all|stringr::str_extract_all()|every regex match|all matches per string"
auto_link_case_sensitive: true
target_keyword: "stringr str_extract_all"
sibling_block_enabled: true
difficulty: "Beginner"
---

# stringr str_extract_all() in R: Every Regex Match

<p class="lead">The <code>str_extract_all()</code> function in stringr returns EVERY regex match per input string, as a list of character vectors (one vector per string). Use it whenever a single string can hold more than one match, such as multiple numbers, hashtags, or tokens.</p>

[QUICK ANSWER]
str_extract_all(x, "\\d+")                           # all digit runs per string
str_extract_all(x, "\\d+", simplify = TRUE)          # matrix output, padded with ""
unlist(str_extract_all(x, "\\d+"))                   # flatten to one vector
str_extract_all(x, fixed("."))                       # literal, not regex
str_extract_all(x, regex("a", ignore_case = TRUE))   # case-insensitive
str_extract_all(text, "#\\w+")                       # every hashtag
lengths(str_extract_all(x, "\\d+"))                  # matches per string
str_extract_all(x, boundary("word"))                 # word tokens

[DECISION TREE: Is str_extract_all() the right tool?]
- get every match per string: str_extract_all()
- get only the first match per string: str_extract()
- get capture groups for every match: str_match_all()
- positions of every match (not text): str_locate_all()
- replace every match in place: str_replace_all()
- count matches per string only: str_count()
- split string at every match: str_split()

## What str_extract_all() does in one sentence

**`str_extract_all(string, pattern)` returns a list with one character vector per input string, holding every non-overlapping regex match in order.** Strings with zero matches return `character(0)`, never `NA`. The output is always a list, even for a length-one input.

The shape difference from `str_extract()` is the source of most confusion. `str_extract()` gives a flat character vector the same length as the input; `str_extract_all()` gives a list. Code written for one will not work unmodified on the other.

## Syntax

**`str_extract_all(string, pattern, simplify = FALSE)` accepts a vector and a regex pattern.** Set `simplify = TRUE` to coerce the list into a character matrix padded with empty strings.

```r title="Pull every digit run per string"
library(stringr)

x <- c("order 12 then 345 then 6789", "no numbers", "1 2 3")
str_extract_all(x, "\\d+")
#> [[1]]
#> [1] "12"   "345"  "6789"
#>
#> [[2]]
#> character(0)
#>
#> [[3]]
#> [1] "1" "2" "3"
```

The output is a length-3 list because the input had 3 strings. Element 2 is empty because that string had no digit run.

[TIP]
**Reach for `str_extract_all()` whenever your regex uses a quantifier like `+`, `*`, or `{n,}` and you suspect the string may carry more than one hit.** The single-match `str_extract()` silently drops everything past the first match, which is a frequent bug source in token-level work.

## Five common patterns

### 1. Get every match as a flat vector

When you do not need to know which input each match came from, flatten the list with `unlist()` to get one vector you can summarise, sort, or deduplicate.

```r title="Flatten matches into one vector"
messages <- c("call 9876 or 1234", "no number here", "ext. 555 or 999")

all_nums <- unlist(str_extract_all(messages, "\\d+"))
all_nums
#> [1] "9876" "1234" "555"  "999"

length(all_nums)
#> [1] 4
```

`unlist()` drops the string-to-match mapping. For aggregate stats like total count or unique values, this is exactly what you want.

### 2. Build a clean matrix with simplify = TRUE

For tabular reports, set `simplify = TRUE`. The result is a character matrix where row i holds the matches from string i, padded with empty strings so every row has the same width.

```r title="Coerce matches into a padded matrix"
quotes <- c("a=10, b=20", "x=5", "p=1, q=2, r=3")
m <- str_extract_all(quotes, "\\d+", simplify = TRUE)
m
#>      [,1] [,2] [,3]
#> [1,] "10" "20" ""
#> [2,] "5"  ""   ""
#> [3,] "1"  "2"  "3"
```

This shape plugs straight into `as.data.frame()` or `apply()`. The empty cells stay as `""`, not `NA`, so test with `nzchar()` rather than `is.na()`.

### 3. Tidy long-format with unnest_longer

The list output is awkward to summarise inside dplyr. Drop it into a tibble column and call `tidyr::unnest_longer()` for a tidy long frame, one row per match.

```r title="Land matches in a tidy long table"
library(dplyr)
library(tibble)
library(tidyr)

logs <- tibble(
  id   = c("a", "b", "c"),
  text = c("ERR 12 ERR 99", "ok ok", "WARN 3 ERR 7 ERR 9")
)

tidy <- logs |>
  mutate(code = str_extract_all(text, "\\d+")) |>
  unnest_longer(code)

tidy
#> # A tibble: 6 x 3
#>   id    text                code
#>   <chr> <chr>               <chr>
#> 1 a     ERR 12 ERR 99       12
#> 2 a     ERR 12 ERR 99       99
#> 3 b     ok ok               NA
#> 4 c     WARN 3 ERR 7 ERR 9  3
#> 5 c     WARN 3 ERR 7 ERR 9  7
#> 6 c     WARN 3 ERR 7 ERR 9  9
```

`unnest_longer()` keeps every parent row, even empty-match rows (the `b` row becomes `NA`). Pass `keep_empty = FALSE` if you want only matched rows.

[KEY INSIGHT]
**`str_extract_all()` paired with `unnest_longer()` is the cleanest way to go from messy free text to a row-per-match data frame.** No loops, no `mapply()`, no manual binding. The pattern scales from 10 strings to 10 million without changing shape.

### 4. Extract every hashtag, mention, or URL

Social text is a natural fit because counts per string vary. The pattern stays simple; only the regex changes.

```r title="Pull hashtags and mentions"
posts <- c(
  "shipping #rstats and #tidyverse content",
  "no tags",
  "thanks @hadley @jennybryan and #rmarkdown"
)

hashtags <- str_extract_all(posts, "#\\w+")
mentions <- str_extract_all(posts, "@\\w+")

hashtags
#> [[1]]
#> [1] "#rstats"     "#tidyverse"
#> [[2]]
#> character(0)
#> [[3]]
#> [1] "#rmarkdown"

mentions[[3]]
#> [1] "@hadley"     "@jennybryan"
```

The pattern `#\\w+` matches a `#` followed by one or more word characters. Swap to `https?://\\S+` for URLs or `[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+` for email-like tokens.

### 5. Word tokens with boundary()

For natural-language tokens, the `boundary("word")` matcher is locale-aware and handles punctuation cleanly without writing your own regex.

```r title="Tokenize a sentence into words"
sentence <- "Don't split contractions, please."

str_extract_all(sentence, boundary("word"))
#> [[1]]
#> [1] "Don't"        "split"        "contractions" "please"
```

`boundary("word")` keeps `Don't` intact, while a naive `\\w+` would split it on the apostrophe. Use the boundary matcher whenever you tokenize prose for downstream NLP work.

## str_extract_all vs str_extract vs str_match_all

**Three stringr matchers, three return shapes.** Pick by what your downstream code expects.

| Function | Returns | Best for |
|---|---|---|
| `str_extract()` | Character vector, length of input | First match per string, NA for none |
| `str_extract_all()` | List of character vectors | Every match per string, variable counts |
| `str_extract_all(..., simplify = TRUE)` | Character matrix (padded) | Fixed-shape table for downstream apply |
| `str_match()` | Matrix: full match + capture groups | First match WITH capture groups |
| `str_match_all()` | List of matrices | Every match WITH capture groups |
| `str_count()` | Integer vector | Match count only, no text needed |

When to use which:

- **str_extract_all** is the workhorse for "give me every hit." Use it for tokenization, multi-hit parsing, and feature extraction.
- **str_match_all** when each match has parts (year + month + day, area-code + number). It returns capture groups as extra matrix columns.
- **str_count** when only the count matters; faster and lighter on memory.

[NOTE]
**Coming from Python?** The equivalent of `str_extract_all(x, p)` is `[re.findall(p, s) for s in x]`. The equivalent of `simplify = TRUE` has no direct Python analogue; build it with a list comprehension plus padding.

## Common pitfalls

**Pitfall 1: treating the output as a character vector.** `str_extract_all(x, "a")[1]` returns a one-element LIST (the first matrix wrapped in a list), not a character vector. Use `[[1]]` to unwrap: `str_extract_all(x, "a")[[1]]`.

**Pitfall 2: using `length()` to count matches.** `length(str_extract_all(x, "a"))` returns the input string count, not the total match count. For per-string counts use `lengths()` (note the s); for the grand total use `sum(lengths(...))`.

**Pitfall 3: assuming `character(0)` will skip in dplyr `mutate`.** A zero-match element is `character(0)`, which keeps the row but expands to a length-zero column inside `unnest_longer()`. The result is the row replaced by `NA` (unless `keep_empty = FALSE`). Filter empty rows explicitly when this is a problem.

[WARNING]
**Non-overlapping matches only.** `str_extract_all("aaaa", "aa")` returns `c("aa", "aa")`, NOT three matches. stringr scans left-to-right and consumes each match. Use a lookahead pattern such as `(?=aa)` if overlapping matches are needed; the lookahead matches without consuming.

## Try it yourself

**Try it:** Extract every 4-digit year from the sentences in `ex_text`. Save the FLAT vector of all years as integers to `ex_years`.

```r title="Your turn: extract years as integers"
ex_text <- c(
  "Born in 1980, graduated 2002",
  "no dates here",
  "events: 1999, 2010, and 2024"
)

ex_years <- # your code here

ex_years
#> Expected: c(1980, 2002, 1999, 2010, 2024)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_years <- as.integer(unlist(str_extract_all(ex_text, "\\b\\d{4}\\b")))
ex_years
#> [1] 1980 2002 1999 2010 2024
```

**Explanation:** `\\b\\d{4}\\b` matches exactly 4 digits with word boundaries on both sides. `unlist()` flattens the per-string list into one character vector, and `as.integer()` coerces to the integer type expected for years.

</details>

## Related stringr functions

After mastering str_extract_all, look at:

- `str_extract()`: first match per string (sibling, flat-vector return)
- `str_match_all()`: every match plus capture groups, returned as a list of matrices
- `str_locate_all()`: start and end positions of every match
- `str_count()`: number of matches per string when text is not needed
- `str_replace_all()`: replace every match in place
- `str_split()`: split a string at every match

For full regex syntax, see the official [stringr regular expressions vignette](https://stringr.tidyverse.org/articles/regular-expressions.html).

## FAQ

**How do I extract all regex matches from a string in R?**

Use `stringr::str_extract_all(string, "pattern")`. It returns a list of character vectors, one per input string, with every non-overlapping match in left-to-right order. For a flat vector across all strings, wrap the call in `unlist()`.

**What is the difference between str_extract and str_extract_all in R?**

`str_extract()` returns only the FIRST match per string, packaged as a flat character vector the same length as the input. `str_extract_all()` returns EVERY match per string, packaged as a list of character vectors. Use the all-variant whenever a string may carry more than one match.

**How do I extract all numbers from a string in R?**

`unlist(str_extract_all(x, "\\d+"))` extracts every run of digits from every string and returns one flat character vector. Wrap in `as.numeric()` or `as.integer()` to convert. Use `"\\d*\\.?\\d+"` to also catch decimals.

**Does str_extract_all return overlapping matches?**

No. It scans left-to-right and consumes each match, so `str_extract_all("aaaa", "aa")` returns two matches, not three. For overlapping matches use a lookahead pattern such as `(?=aa)`, which matches without consuming characters.

**How do I count matches per string with str_extract_all?**

Use `lengths(str_extract_all(x, pattern))` (note the `s`). It returns an integer vector of match counts per string. If you only need the count, `str_count(x, pattern)` is shorter and avoids materializing the matches.
