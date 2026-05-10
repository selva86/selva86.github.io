---
title: "strsplit() in R: Split Strings by a Delimiter"
slug: "base-strsplit-in-R"
description: "Use base R strsplit() to split character vectors by a delimiter or regex. Covers list output, fixed = TRUE, unlist, stringr str_split alternative, 5 examples."
keywords: "strsplit in R, R split string, strsplit example, R string to vector, str_split stringr, R delimiter split, strsplit fixed"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "base-r-essentials"
fr_parent: "R-Vectors.html"
auto_link_terms: "strsplit()|R strsplit|split string|str_split|delimiter split"
auto_link_case_sensitive: true
target_keyword: "strsplit in R"
sibling_block_enabled: true
difficulty: "Beginner"
---

# strsplit() in R: Split Strings by a Delimiter

<p class="lead">The <code>strsplit()</code> function in base R splits each element of a character vector at a delimiter (regex or fixed) and returns a LIST of character vectors, one per input element.</p>

[QUICK ANSWER]
strsplit("a,b,c", ",")[[1]]                # c("a","b","c")
strsplit(c("a,b","c,d"), ",")              # list of vectors
strsplit("a.b.c", ".", fixed = TRUE)[[1]]  # literal period
strsplit("a.b.c", "\\.")                   # regex period
unlist(strsplit(x, ","))                   # flatten to vector
do.call(rbind, strsplit(x, ","))           # to matrix (if even)
stringr::str_split(x, ",")                 # tidyverse equivalent

[DECISION TREE: Is strsplit() the right tool?]
- split each string by delimiter: strsplit()
- split into matrix (equal lengths): do.call(rbind, strsplit(...))
- split a single string: strsplit(x, sep)[[1]]
- tidyverse pipeline: stringr::str_split()
- split at fixed positions: substring() / substr()
- split data frame column into multiple: tidyr::separate()
- maximum N pieces: stringr::str_split_fixed() or strsplit + head

## What strsplit() does in one sentence

**`strsplit(x, split)` splits each string in `x` at every occurrence of `split` (regex by default) and returns a LIST where each element is a character vector of the parts.** The list has length equal to the input.

The list output is intentional: different inputs can produce different numbers of parts. To collapse to a vector, `unlist()`. To force into a matrix, use `do.call(rbind, ...)` only when all inputs split into equal counts.

## Syntax

**`strsplit(x, split, fixed = FALSE, perl = FALSE)`. Returns a LIST.**

```r title="Split a single string"
strsplit("apple,banana,cherry", ",")
#> [[1]]
#> [1] "apple"  "banana" "cherry"

strsplit("apple,banana,cherry", ",")[[1]]
#> [1] "apple"  "banana" "cherry"
```

[TIP]
**`strsplit` always returns a LIST, even for length-1 input.** Use `[[1]]` to extract the vector for single inputs. For vectorized work, leave it as a list.

## Five common patterns

### 1. Split CSV-like single string

```r title="Comma-separated to vector"
strsplit("a,b,c", ",")[[1]]
#> [1] "a" "b" "c"
```

### 2. Split a vector of strings

```r title="Each input becomes a list element"
x <- c("a,b,c", "x,y", "p,q,r,s")
strsplit(x, ",")
#> [[1]]
#> [1] "a" "b" "c"
#> [[2]]
#> [1] "x" "y"
#> [[3]]
#> [1] "p" "q" "r" "s"
```

Variable lengths are why the result is a list, not a matrix.

### 3. Split by regex (e.g., any whitespace)

```r title="Split on multiple whitespace"
strsplit("hello   world  foo", "\\s+")
#> [[1]]
#> [1] "hello" "world" "foo"
```

`\\s+` matches one-or-more whitespace, so multi-space gaps collapse.

### 4. Split a column into a matrix (equal-length only)

```r title="Convert to matrix when each row splits the same"
x <- c("2024-01-15", "2025-03-20", "2026-07-04")
parts <- strsplit(x, "-")
do.call(rbind, parts)
#>      [,1]   [,2] [,3]
#> [1,] "2024" "01" "15"
#> [2,] "2025" "03" "20"
#> [3,] "2026" "07" "04"
```

Works only when all inputs split into the same number of pieces.

### 5. Split with fixed = TRUE (literal delimiter)

```r title="Period as literal, not regex"
strsplit("file.name.txt", ".", fixed = TRUE)[[1]]
#> [1] "file" "name" "txt"

strsplit("file.name.txt", ".")[[1]]   # WRONG: regex
#> [1] "" "" "" "" "" "" "" "" "" "" "" "" ""
```

Without `fixed = TRUE`, `.` is regex (any character), splitting at every position.

[KEY INSIGHT]
**Use `fixed = TRUE` for ANY single-character delimiter that has regex meaning.** `.` `*` `+` `?` `|` `(` `[` `^` `$` `\\` are all regex. For these, `fixed = TRUE` is faster and avoids escaping bugs. For literal commas, slashes, dashes, it does not matter (they are not regex special).

## strsplit() vs str_split() vs separate() vs substr()

**Four ways to split strings in R, each suited to different shapes.**

| Function | Package | Output | Best for |
|---|---|---|---|
| `strsplit()` | base | List of vectors | Standard delimiter split |
| `stringr::str_split()` | stringr | List of vectors | Tidyverse pipelines |
| `stringr::str_split_fixed()` | stringr | Matrix | Equal-length splits |
| `tidyr::separate()` | tidyr | Multi-column data frame | Data frame column splits |
| `substr()` / `substring()` | base | String | Fixed-position split |

When to use which:

- **strsplit** for base R delimiter splits.
- **str_split_fixed** when you know the max number of pieces.
- **separate** to split a data frame column into named columns.
- **substr** for known-position splits (e.g., always at index 5).

## A practical strsplit workflow

**Most strsplit workflows go: split, validate, transform.** Common patterns:

1. **Split-and-flatten**: `unlist(strsplit(x, sep))` to get one big vector.
2. **Split-and-stack**: `do.call(rbind, strsplit(x, sep))` to get a matrix.
3. **Split-and-extract-Nth**: `sapply(strsplit(x, sep), `[`, 2)` to grab the 2nd part of each.
4. **Split-and-re-aggregate**: split by some boundary, then process group-wise.

For data-frame work, `tidyr::separate()` is usually cleaner because it produces named columns directly.

## Common pitfalls

**Pitfall 1: result is always a list.** `strsplit("a,b", ",")` returns a list, not a vector. `[[1]]` extracts the inner vector for single-input cases.

**Pitfall 2: `do.call(rbind, ...)` errors on unequal lengths.** If inputs split into different counts, rbind fails. Use `stringr::str_split_fixed()` or pad results manually.

[WARNING]
**Empty strings can produce surprises.** `strsplit("a,,b", ",")[[1]]` returns `c("a", "", "b")` (with empty middle). `strsplit("", ",")[[1]]` returns an empty character vector. Always handle these edge cases.

## Try it yourself

**Try it:** Split each email at "@" and extract just the domain. Save to `ex_domains`.

```r title="Your turn: extract domains"
emails <- c("alice@example.com", "bob@gmail.com", "carol@yahoo.com")

ex_domains <- # your code here

ex_domains
#> Expected: c("example.com", "gmail.com", "yahoo.com")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_domains <- sapply(strsplit(emails, "@"), `[`, 2)
ex_domains
#> [1] "example.com" "gmail.com"   "yahoo.com"
```

**Explanation:** `strsplit(emails, "@")` returns a list of 2-element vectors. `sapply(..., `[`, 2)` extracts the 2nd element from each, which is the domain part.

</details>

## Related split functions

After mastering strsplit, look at:

- `stringr::str_split()`: tidyverse equivalent
- `stringr::str_split_fixed()`: returns a matrix directly
- `tidyr::separate()`: split a data frame column into multiple columns
- `tidyr::separate_rows()`: split into multiple ROWS (long format)
- `substr()` / `substring()`: split at fixed positions
- `regmatches()`: split using regex matches

For data frame column splits, `tidyr::separate()` saves a step over `strsplit + bind`.

## FAQ

**How do I split a string in R?**

`strsplit(x, ",")[[1]]` for a single string. For a vector, leave off `[[1]]` and you get a list.

**Why does strsplit return a list?**

Different inputs can split into different numbers of parts. A list naturally holds variable-length results. For single-input cases, `[[1]]` extracts the vector.

**What is the difference between strsplit and stringr str_split?**

Both split a string by a regex pattern. `str_split` puts the string argument FIRST (pipe-friendly): `str_split(x, ",")`. `strsplit` puts pattern second: `strsplit(x, ",")`. Same result; different argument order.

**How do I split into a fixed number of pieces?**

`stringr::str_split_fixed(x, ",", n = 3)` returns a 3-column matrix. Or `strsplit` then `head(parts, 3)` per element.

**How do I split a string into individual characters?**

`strsplit(x, "")[[1]]`. Empty delimiter splits at every position. Or use `unlist(strsplit("hello", ""))` for a vector.
