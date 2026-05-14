---
title: "stringr str_split_fixed() in R: Split Strings to Matrix"
slug: "stringr-str_split_fixed-in-R"
description: "Split character vectors in R into a fixed-column matrix with stringr str_split_fixed(). Covers n argument, padding, overflow, regex delimiters, and pitfalls."
keywords: "stringr str_split_fixed, str_split_fixed function R, stringr str_split_fixed examples, R str_split_fixed matrix, split string fixed pieces R, str_split_fixed vs str_split"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "stringr-functions"
fr_parent: "stringr-in-R.html"
auto_link_terms: "str_split_fixed()|stringr str_split_fixed|stringr::str_split_fixed()|split string into matrix|str_split_fixed function"
auto_link_case_sensitive: true
target_keyword: "stringr str_split_fixed"
sibling_block_enabled: true
difficulty: "Beginner"
---

# stringr str_split_fixed() in R: Split Strings to Matrix

<p class="lead">The <code>stringr str_split_fixed()</code> function splits each string in a character vector by a pattern and returns a character matrix with exactly <code>n</code> columns. Short inputs are padded with empty strings; long inputs collapse extra pieces into the final column.</p>

[QUICK ANSWER]
str_split_fixed(x, "/", n = 3)              # 3-column matrix
str_split_fixed(x, ",", n = 2)              # split once into key, value
str_split_fixed(x, "-", n = 4)[, 2]         # take 2nd field as vector
str_split_fixed(x, regex("[,;]"), n = 2)    # regex delimiter
str_split_fixed(x, fixed("."), n = 3)       # literal dot, not regex
data.frame(str_split_fixed(x, "/", n = 3))  # straight to data frame
str_split_fixed(x, "\\s+", n = 2)           # split on any whitespace run

[DECISION TREE: Is str_split_fixed() the right tool?]
- need a matrix with fixed columns: str_split_fixed(x, p, n)
- variable pieces, list output: str_split(x, p)
- one string into a vector: str_split_1(x, p)
- pull only the i-th piece: str_split_i(x, p, i)
- split a data frame column into fields: tidyr::separate_wider_delim()
- count occurrences instead of splitting: str_count(x, p)
- match the pattern, do not split: str_extract(x, p)

## What str_split_fixed() does in one sentence

**`str_split_fixed(string, pattern, n)` returns a character matrix with `length(string)` rows and exactly `n` columns.** Each row holds the pieces from one input string. The fixed shape is what makes it useful for tabular conversion, where `str_split()` returns a ragged list that you would have to coerce.

The trade off is data loss when an input has more than `n` pieces: the final column absorbs the leftover pattern and pieces verbatim. Choose `n` to match your maximum expected piece count.

## Syntax

**`str_split_fixed(string, pattern, n)` requires all three arguments.** Unlike `str_split()`, where `n` defaults to `Inf`, `str_split_fixed()` has no default for `n` because the matrix shape must be known in advance.

```r title="Load stringr and split a vector"
library(stringr)

products <- c("apple/red/1.99", "banana/yellow/0.50", "kiwi/green/1.25")

str_split_fixed(products, "/", n = 3)
#>      [,1]     [,2]     [,3]  
#> [1,] "apple"  "red"    "1.99"
#> [2,] "banana" "yellow" "0.50"
#> [3,] "kiwi"   "green"  "1.25"
```

The result is a 3 by 3 character matrix. Every cell is a string, including the price column. Convert numeric columns explicitly with `as.numeric()` before doing math on them.

[TIP]
**Pattern is a regex by default.** Wrap literal punctuation in `fixed()` (`fixed(".")`) or escape it (`"\\."`) when the delimiter is `.`, `?`, `(`, `)`, `+`, or `*`. Forgetting this silently splits between every character.

## Five common patterns

### 1. Split into named data frame columns

The most common downstream use is a data frame with one column per piece. Wrap the matrix in `data.frame()` and rename the columns.

```r title="Build a tidy data frame from delimited strings"
mat <- str_split_fixed(products, "/", n = 3)
df <- data.frame(
  item  = mat[, 1],
  color = mat[, 2],
  price = as.numeric(mat[, 3])
)
df
#>     item  color price
#> 1  apple    red  1.99
#> 2 banana yellow  0.50
#> 3   kiwi  green  1.25
```

### 2. Pad short rows with empty strings

When inputs have fewer than `n` pieces, the missing slots become `""` (empty string), not `NA`.

```r title="Inputs of unequal length"
y <- c("a-b-c", "x-y", "p")
str_split_fixed(y, "-", n = 3)
#>      [,1] [,2] [,3]
#> [1,] "a"  "b"  "c" 
#> [2,] "x"  "y"  ""  
#> [3,] "p"  ""   ""  
```

### 3. Cap pieces, collapse the rest

When inputs have MORE than `n` pieces, the final column receives the rest of the string with the delimiter intact. This is the most common surprise for new users.

```r title="n smaller than max piece count"
z <- c("alpha/beta/gamma/delta", "one/two/three")
str_split_fixed(z, "/", n = 3)
#>      [,1]    [,2]   [,3]         
#> [1,] "alpha" "beta" "gamma/delta"
#> [2,] "one"   "two"  "three"      
```

[WARNING]
**The leftover delimiter survives in the final column.** If you set `n = 3` on a string with 5 pieces, column 3 contains `"piece3/piece4/piece5"`, not `"piece3"`. Use `str_split()` first if you do not know the maximum count.

### 4. Take a single field as a vector

Indexing the matrix with `[, k]` returns column `k` as a character vector. This is the cleanest way to pull "second field" from a structured string.

```r title="Extract just the domain from emails"
emails <- c("alice@gmail.com", "bob@yahoo.com", "carol@hotmail.com")
str_split_fixed(emails, "@", n = 2)[, 2]
#> [1] "gmail.com"   "yahoo.com"   "hotmail.com"
```

### 5. Split on a regex delimiter

Pass a regex when the delimiter varies. A character class like `[,;]` matches either a comma or a semicolon.

```r title="Multiple possible separators"
addr <- c("123 Main St, Apt 4B", "456 Oak Ave; Unit 12")
str_split_fixed(addr, ",\\s?|;\\s?", n = 2)
#>      [,1]            [,2]    
#> [1,] "123 Main St"   "Apt 4B"
#> [2,] "456 Oak Ave"   "Unit 12"
```

## str_split_fixed vs alternatives

**Use this table to pick between str_split_fixed and the four most-confused alternatives.** All four solve overlapping problems but optimize for different output shapes.

| Function | Output shape | Use when |
|---|---|---|
| `str_split_fixed(x, p, n)` | character matrix, n columns | you know the column count and want tabular data |
| `str_split(x, p)` | list of character vectors | piece counts vary and you want all of them |
| `str_split_i(x, p, i)` | character vector | you only need the i-th piece |
| `tidyr::separate_wider_delim()` | data frame columns | input is already a data frame column |
| `base::strsplit(x, p)` | list (no stringr) | you want zero dependencies |

`str_split_fixed()` wins when your data has a known schema (CSV-like rows of three fields, hyphen-separated codes with four parts) and you want to feed the result to a model, table, or plot.

## Common pitfalls

**Three mistakes recur with `str_split_fixed()`:** forgetting that empty cells are not `NA`, treating numeric columns as numbers without conversion, and choosing `n` smaller than the actual maximum.

```r title="Pitfall 1: empty string is not NA"
mat <- str_split_fixed(c("a-b-c", "x-y"), "-", n = 3)
is.na(mat[, 3])
#> [1] FALSE FALSE
mat[, 3] == ""
#> [1] FALSE  TRUE
```

Convert with `dplyr::na_if(mat[, 3], "")` or `ifelse(mat == "", NA, mat)` if downstream code expects `NA`.

```r title="Pitfall 2: column is character, not numeric"
prices <- c("apple/1.99", "banana/0.50")
mat <- str_split_fixed(prices, "/", n = 2)
sum(as.numeric(mat[, 2]))
#> [1] 2.49
```

Without `as.numeric()`, `sum()` raises `invalid 'type' (character) of argument`.

[KEY INSIGHT]
**`n` is a maximum split count, not a strict piece count.** `str_split_fixed(x, "/", n = 3)` makes at most 2 splits per string and stuffs the remainder into column 3. Set `n` to the largest expected piece count, or run `str_split()` once to inspect lengths first.

## Try it yourself

**Try it:** Split the vector `c("john@gmail.com", "jane@yahoo.com", "bob@hotmail.com")` on `@` into a 2-column matrix, then return just the domain names as a character vector.

```r title="Your turn: split emails and extract domains"
ex_emails <- c("john@gmail.com", "jane@yahoo.com", "bob@hotmail.com")

ex_domains <- # your code here

ex_domains
#> Expected: "gmail.com" "yahoo.com" "hotmail.com"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_emails <- c("john@gmail.com", "jane@yahoo.com", "bob@hotmail.com")
ex_domains <- str_split_fixed(ex_emails, "@", n = 2)[, 2]
ex_domains
#> [1] "gmail.com"   "yahoo.com"   "hotmail.com"
```

**Explanation:** `str_split_fixed()` returns a 3 by 2 matrix; the second column holds every domain. Subsetting with `[, 2]` drops the matrix structure and returns a plain character vector.

</details>

## Related stringr functions

For other split and extract patterns, see:

- `str_split()`: list output for variable piece counts
- `str_split_1()`: single string into a flat vector
- `str_split_i()`: pull the i-th piece directly
- `str_extract()`: capture matching pieces instead of splitting
- `str_match()`: regex groups returned as a matrix

The official reference is the [stringr str_split documentation](https://stringr.tidyverse.org/reference/str_split.html), which covers every variant in the family.

## FAQ

**What is the difference between str_split() and str_split_fixed()?**

`str_split()` returns a list because each input string can produce a different number of pieces. `str_split_fixed()` returns a character matrix with a fixed column count, padding short rows with `""` and collapsing long ones into the final column. Pick the matrix when downstream code needs uniform shape (a data frame, a model matrix); pick the list when piece counts vary and you want every piece.

**Why does str_split_fixed() return empty strings instead of NA for missing pieces?**

The output type is `character`, and empty string is the zero value for character vectors. `NA_character_` would also work, but the design choice in stringr matches `strsplit()` behavior. Convert empty cells with `dplyr::na_if(x, "")` or `ifelse(x == "", NA, x)` when you want explicit missingness.

**How do I split on a literal dot or special regex character?**

The pattern argument is regex by default, so `"."` matches any character. Wrap the delimiter in `stringr::fixed()` (`fixed(".")`) for literal matching, or escape it with backslashes (`"\\."`). Use `fixed()` when readability matters and you have no regex needs.

**Can str_split_fixed() handle a vector of patterns?**

No, the pattern argument is a single regex or `fixed()`/`coll()` modifier applied to every input string. To split different rows on different patterns, loop with `mapply()` over `strsplit()` or use `purrr::map2()` with `str_split()`.

**How do I convert the result of str_split_fixed() to a data frame with named columns?**

Wrap the matrix in `data.frame()` and assign column names: `setNames(data.frame(str_split_fixed(x, "/", n = 3)), c("a", "b", "c"))`. Or use `as_tibble(.name_repair = "minimal")` from tibble if you prefer tidyverse output. Both preserve the character type, so cast numeric columns with `as.numeric()` afterwards.
