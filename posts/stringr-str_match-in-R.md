---
title: "stringr str_match() in R: Extract Regex Capture Groups"
slug: "stringr-str_match-in-R"
description: "Use stringr str_match() to extract regex capture groups in R. Returns a character matrix with one column per group. Named groups and 5 examples inside."
keywords: "stringr str_match, str_match function R, stringr str_match examples, R extract regex groups, str_match_all vs str_match, regex capture groups R, str_match dataframe"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "stringr-functions"
fr_parent: "stringr-in-R.html"
auto_link_terms: "str_match()|stringr str_match|stringr::str_match()|capture groups in R|extract regex groups"
auto_link_case_sensitive: true
target_keyword: "stringr str_match"
sibling_block_enabled: true
difficulty: "Beginner"
---

# stringr str_match() in R: Extract Regex Capture Groups

The `str_match()` function in stringr extracts regex capture groups from the FIRST match in each string. It returns a character matrix where column 1 is the full match and columns 2+ are the capture groups. Use `str_match_all()` when each input may contain multiple matches.

[QUICK ANSWER]
str_match(x, "(\\d{4})-(\\d{2})")       # two numeric groups
str_match(x, "ID: (\\d+)")              # capture after literal text
str_match(x, "(?<y>\\d{4})")            # named capture group
str_match_all(x, "(\\w+)=(\\w+)")       # all matches as list of matrices
str_match(x, "(\\w+)@(\\w+)\\.")[, 2]    # keep just first group
as.numeric(str_match(x, "(\\d+)")[, 2]) # convert captured digits
str_match(x, "([A-Z]+)-(\\d+)")         # letters then numbers

[DECISION TREE: Is str_match() the right tool?]
- get capture groups from first match: str_match(df, pattern)
- get capture groups from all matches: str_match_all(df, pattern)
- get the matched substring only: str_extract(df, pattern)
- check pattern presence (TRUE/FALSE): str_detect(df, pattern)
- find position of match: str_locate(df, pattern)
- replace match with substitution: str_replace(df, pattern, replacement)
- split string by a delimiter: str_split(df, pattern)

## What str_match() does in one sentence

**`str_match(string, pattern)` returns the FIRST regex match plus its capture groups as a character matrix.** Each row corresponds to one input string. Each column corresponds to one capture group, with column 1 reserved for the full match.

This makes it the only stringr function that pulls structured parts out of a string in one call. If your pattern has no `()` groups, you get a 1-column matrix and `str_extract()` is usually simpler.

## Syntax

**`str_match(string, pattern)`. Returns a character matrix; rows = input length, columns = 1 + number of capture groups.**

```r title="Load stringr and run a basic match"
library(stringr)

dates <- c("2024-01-15", "2025-03-20", "no date")
str_match(dates, "(\\d{4})-(\\d{2})-(\\d{2})")
#>      [,1]         [,2]   [,3]  [,4]
#> [1,] "2024-01-15" "2024" "01"  "15"
#> [2,] "2025-03-20" "2025" "03"  "20"
#> [3,] NA           NA     NA    NA
```

Rows that fail to match return `NA` across every column. The matrix shape is fixed by the pattern, not by the data.

[TIP]
**Always subset with `[, 2:N]` to drop the full-match column.** The first column duplicates what `str_extract()` would return. Capture groups (columns 2+) are the reason you reached for `str_match()` in the first place.

## Five common patterns

### 1. Parse a date into year, month, day

```r title="Split a date string into components"
str_match("2024-08-15", "(\\d{4})-(\\d{2})-(\\d{2})")
#>      [,1]         [,2]   [,3] [,4]
#> [1,] "2024-08-15" "2024" "08" "15"
```

Three groups, three columns of captured digits. Convert to numeric with `as.numeric(result[, 2:4])`.

### 2. Named capture groups

```r title="Use named groups for readable output"
logs <- c("user=alice action=login", "user=bob action=logout")
str_match(logs, "user=(?<who>\\w+) action=(?<what>\\w+)")
#>      [,1]                       who     what
#> [1,] "user=alice action=login"  "alice" "login"
#> [2,] "user=bob action=logout"   "bob"   "logout"
```

Named groups (`(?<name>pattern)`) put labels on the columns. The result is still a matrix, so subset with `[, "who"]` instead of `[, 2]`.

### 3. Capture after literal text

```r title="Pull the number after a fixed label"
str_match(c("ID: 1099", "ID: 2030", "missing"), "ID: (\\d+)")
#>      [,1]       [,2]
#> [1,] "ID: 1099" "1099"
#> [2,] "ID: 2030" "2030"
#> [3,] NA         NA
```

The literal `ID: ` anchors the match. Only the digits inside `()` end up in column 2.

### 4. Parse email into local-part and domain

```r title="Split emails using two capture groups"
emails <- c("alice@example.com", "bob@test.org")
str_match(emails, "(\\w+)@([\\w.]+)")
#>      [,1]                [,2]    [,3]
#> [1,] "alice@example.com" "alice" "example.com"
#> [2,] "bob@test.org"      "bob"   "test.org"
```

Two groups, two columns of structured output. `[\\w.]+` allows dots inside the domain.

### 5. All matches per string with str_match_all()

```r title="Use str_match_all for repeated patterns"
text <- "x=1 y=2 z=3"
str_match_all(text, "(\\w+)=(\\d+)")
#> [[1]]
#>      [,1]  [,2] [,3]
#> [1,] "x=1" "x"  "1"
#> [2,] "y=2" "y"  "2"
#> [3,] "z=3" "z"  "3"
```

`str_match_all()` returns a LIST of matrices, one per input string. Each list element holds every match found in that input.

## str_match() vs str_match_all() vs str_extract()

| Function | Returns | Capture groups | Multiple matches per string |
|----------|---------|---------------|---------------------------|
| `str_match()` | character matrix | yes (columns 2+) | first match only |
| `str_match_all()` | list of matrices | yes (columns 2+) | every match |
| `str_extract()` | character vector | no (full match only) | first match only |
| `str_extract_all()` | list of character vectors | no | every match |

**Decision rule:** if your pattern has `()` groups, use `str_match()` or `str_match_all()`. If you only need the whole match, `str_extract()` is faster and the output is easier to handle. The matrix vs list trade-off is the same as `str_extract` vs `str_extract_all`.

[KEY INSIGHT]
**str_match() is str_extract() plus capture groups in one call.** You could chain `str_extract()` then a second regex pass, but a single `str_match()` is both faster and clearer when the parts you want are already inside `()` groups in your pattern.

## Working with str_match() inside a data frame

**`str_match()` returns a matrix, so attach its columns back to the data frame with `mutate()`.** The matrix has the same row count as the input vector, so column-binding is safe.

```r title="Add capture groups as new columns"
library(dplyr)

df <- tibble(log = c("user=alice action=login", "user=bob action=logout"))

parts <- str_match(df$log, "user=(\\w+) action=(\\w+)")
df |> mutate(user = parts[, 2], action = parts[, 3])
#> # A tibble: 2 x 3
#>   log                     user  action
#>   <chr>                   <chr> <chr>
#> 1 user=alice action=login alice login
#> 2 user=bob action=logout  bob   logout
```

For pure tidyverse code, `tidyr::extract()` does the same thing in one step. `str_match()` is more flexible when the pattern is dynamic or you want raw matrix output.

## Common pitfalls

### Pitfall 1: Subsetting with [, 1] keeps the full match

**Column 1 is the full match, not the first capture group.** The most common mistake is treating it as a group. Capture groups always start at column 2.

```r title="Wrong vs right column index"
m <- str_match("price: $42", "\\$(\\d+)")
m[, 1]       # "$42"  full match (includes the dollar sign)
m[, 2]       # "42"   first capture group
```

### Pitfall 2: Forgetting to escape backslashes

**Regex meta-characters need a double backslash inside R strings.** `\d` is not a valid R escape, so write `\\d` to send `\d` to the regex engine. Raw strings (`r"(\d+)"`, R 4.0+) skip the doubling.

[WARNING]
**A pattern without `()` groups gives you a 1-column matrix.** No errors, no warnings, just no capture groups to extract. If you find yourself writing `str_match(x, "\\d+")[, 1]`, switch to `str_extract(x, "\\d+")`. The behavior is identical and the intent is clearer.

### Pitfall 3: NA propagation through downstream functions

**Non-matching rows become NA, and not every function handles them safely.** `as.numeric()` preserves NAs, but `paste()` coerces them to the literal string "NA". Filter or replace NAs explicitly before paste-style operations.

## Try it yourself

**Try it:** Use `str_match()` to extract the area code (3 digits inside parens) and the local number from US phone strings like `"(415) 555-1234"`. Save the matrix to `ex_phone`.

```r title="Your turn: parse phone numbers"
# Try it: parse phone numbers
phones <- c("(415) 555-1234", "(212) 555-9999", "555-0000")
ex_phone <- # your code here

ex_phone
#> Expected: 3 x 3 matrix; row 3 is all NA
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_phone <- str_match(phones, "\\((\\d{3})\\) (\\d{3}-\\d{4})")
ex_phone
#>      [,1]             [,2]  [,3]
#> [1,] "(415) 555-1234" "415" "555-1234"
#> [2,] "(212) 555-9999" "212" "555-9999"
#> [3,] NA               NA    NA
```

**Explanation:** Literal parens need escaping with `\\(` and `\\)`. The two capture groups extract the area code and the seven-digit local number. The third row has no opening paren so the match fails and the row is filled with NA.

</details>

## Related stringr functions

- `str_extract()` returns only the full match; use when you have no capture groups.
- `str_extract_all()` is the "all matches" cousin without capture groups.
- `str_detect()` returns TRUE or FALSE for pattern presence; use it before `str_match()` to filter rows.
- `str_locate()` returns the start and end positions of a match instead of the substring.
- `str_replace()` substitutes the matched portion and can reference capture groups with `\\1`, `\\2`.

For the full set of stringr verbs, see the [official stringr reference](https://stringr.tidyverse.org/reference/index.html).

## FAQ

**What is the difference between str_match() and str_extract() in R?**

`str_extract()` returns the full match as a character vector. `str_match()` returns the full match PLUS each capture group as a character matrix. If your regex has `()` groups and you want the captured parts separately, use `str_match()`. If you only need the whole matched substring, `str_extract()` is simpler and faster.

**How do I extract multiple matches per string with str_match()?**

`str_match()` only returns the first match per input. For every match, use `str_match_all()`. It returns a list where each element is a matrix of all matches for that input. Wrap with `purrr::map_dfr()` or `do.call(rbind, ...)` to flatten the list back to a single matrix when needed.

**Can str_match() use named capture groups in R?**

Yes. Use `(?<name>pattern)` syntax inside your regex. The resulting matrix gets named columns, so you can subset with `result[, "name"]` instead of `result[, 2]`. This is the recommended style for patterns with three or more capture groups because column indices become hard to track.

**Why does str_match() return a matrix instead of a data frame?**

stringr deliberately returns the lowest-overhead structure that fits the data. A matrix is fast to create and easy to subset. Convert to a tibble with `as_tibble(result, .name_repair = "minimal")` if you need data-frame semantics, or use `tidyr::extract()` to combine the regex and the column-creation step.

**How does str_match() handle NA inputs?**

`NA` inputs produce a full row of `NA` values in the output matrix. The shape is preserved so the output always has the same number of rows as the input. This is safer than dropping NAs implicitly because it keeps the input and output aligned for downstream `mutate()` or `cbind()` calls.
