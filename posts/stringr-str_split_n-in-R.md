---
title: "stringr str_split_n in R: Extract the Nth Piece From a Split"
slug: "stringr-str_split_n-in-R"
description: "Searching for str_split_n in R? The right function is str_split_i() and the n argument lives on str_split(). Get the nth piece with 5 worked examples."
keywords: "str_split_n, stringr str_split_n R, str_split_n function R, str_split_i, nth split piece R, str_split n argument, split string nth element R"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "stringr-functions"
fr_parent: "stringr-in-R.html"
auto_link_terms: "str_split_n|str_split_i()|stringr str_split_n|nth piece of split|split nth element"
auto_link_case_sensitive: true
target_keyword: "stringr str_split_n"
sibling_block_enabled: true
difficulty: "Beginner"
---

# stringr str_split_n in R: Extract the Nth Piece From a Split

<p class="lead">There is no <code>str_split_n()</code> function in stringr. The nth-piece extractor you want is <code>str_split_i()</code> (stringr 1.5+), and the <code>n</code> argument lives on <code>str_split()</code> to cap how many pieces you keep.</p>

[QUICK ANSWER]
str_split_i(x, "/", i = 2)             # nth piece per string, returns vector
str_split_i(x, "/", i = -1)            # last piece per string
str_split(x, "/", n = 2)               # cap at 2 pieces, returns list
str_split_1("a/b/c", "/")[2]           # nth piece from a single string
sapply(str_split(x, "/"), `[`, 2)      # base R fallback before stringr 1.5
str_split_fixed(x, "/", n = 3)[, 2]    # nth column from matrix split
str_split_i(x, fixed("."), i = 1)      # literal dot, not regex

[DECISION TREE: Is str_split_i() the right tool?]
- get the i-th piece per string: str_split_i(x, p, i)
- get the LAST piece per string: str_split_i(x, p, i = -1)
- cap total pieces at n, keep all: str_split(x, p, n = n)
- need a matrix with n columns: str_split_fixed(x, p, n)
- single string, want a vector: str_split_1(x, p)
- split a data frame column: tidyr::separate_wider_delim()
- count pieces without splitting: str_count(x, p) + 1

## What people mean by str_split_n

**`str_split_n` is a search term, not a function.** Two real stringr features cover what searchers usually want:

1. **The `n` argument of `str_split()`.** Caps how many pieces each string is split into. Pieces past `n` stay joined in the last element.
2. **The `str_split_i()` function.** Added in stringr 1.5.0 (2023). Splits each string and returns the i-th piece as a flat character vector, skipping the list-of-vectors detour.

Older blog posts and Stack Overflow answers sometimes used `str_split_n` as a placeholder for "split and pick the nth piece." The modern, supported answer is `str_split_i()` for the extraction case, and `n =` on `str_split()` for the cap case.

| You searched for | The real function | What it returns |
|---|---|---|
| `str_split_n(x, p, n)` | `str_split_i(x, p, i = n)` | character vector, one piece per input |
| split and cap pieces | `str_split(x, p, n = n)` | list, last piece holds remainder |
| split to n columns | `str_split_fixed(x, p, n)` | character matrix with n columns |
| single string to vector | `str_split_1(x, p)` | character vector |

[NOTE]
**If you see `str_split_n` in an old script, it was likely a user-defined helper.** A common one was `function(x, p, n) sapply(str_split(x, p), `[`, n)`. Replace it with `str_split_i(x, p, i = n)` for cleaner, faster code.

## Syntax of str_split_i and the n argument

**`str_split_i(string, pattern, i)` returns a character vector; `str_split(string, pattern, n = Inf)` returns a list.** The first gives you one piece per input. The second controls how many pieces come out per input.

```r title="Load stringr and prepare data"
library(stringr)

paths <- c("usr/local/bin/R", "home/selva/file.csv", "var/log/app.log")

str_split_i(paths, "/", i = 2)
#> [1] "local" "selva" "log"

str_split(paths, "/", n = 2)
#> [[1]]
#> [1] "usr"        "local/bin/R"
#>
#> [[2]]
#> [1] "home"           "selva/file.csv"
#>
#> [[3]]
#> [1] "var"         "log/app.log"
```

`str_split_i()` returns three strings (one per input). `str_split(..., n = 2)` returns a list of length 3, each element a 2-piece vector with the remainder glued into the second slot.

## Five common patterns

### 1. Get the nth piece per string

```r title="Pull the second segment from each path"
emails <- c("alice@example.com", "bob@gmail.com", "selva@r-project.org")

str_split_i(emails, "@", i = 2)
#> [1] "example.com"    "gmail.com"      "r-project.org"
```

This is the canonical "give me the nth piece" pattern. One call, vector output, no `unlist()` or `sapply()`.

### 2. Get the last piece with negative indexing

```r title="Take the file extension from each filename"
files <- c("report.pdf", "data.csv", "image.png", "archive.tar.gz")

str_split_i(files, fixed("."), i = -1)
#> [1] "pdf" "csv" "png" "gz"
```

Negative `i` counts from the end. `i = -1` is the last piece, `i = -2` is second-to-last. Note `fixed(".")` because a bare `"."` would be regex and match every character.

### 3. Cap pieces with the n argument

```r title="Split keys and values without breaking the value"
records <- c("name=Selva Prabhakaran", "city=Bangalore", "tag=R, Statistics")

str_split(records, "=", n = 2)
#> [[1]]
#> [1] "name"              "Selva Prabhakaran"
#>
#> [[2]]
#> [1] "city"      "Bangalore"
#>
#> [[3]]
#> [1] "tag"             "R, Statistics"
```

`n = 2` says split at MOST once, even if the delimiter appears again. The first `=` becomes the boundary; everything after is one value, preserving commas and equals signs inside.

[TIP]
**`n = 2` is the most common cap.** It is the right choice whenever the first delimiter is structural (key/value, prefix/rest) and later occurrences are content. Use it instead of post-processing the full split.

### 4. Out-of-range i returns NA

```r title="Ask for piece 4 when some strings only have 2"
mixed <- c("a/b/c/d", "x/y", "1/2/3/4/5")

str_split_i(mixed, "/", i = 4)
#> [1] "d" NA  "4"
```

`str_split_i()` returns `NA` for inputs that do not have the i-th piece. This is safer than positional indexing in a loop, which would error.

### 5. The base R equivalent

```r title="Pre-stringr 1.5 way"
domains <- sapply(strsplit(emails, "@", fixed = TRUE), `[`, 2)

domains
#> [1] "example.com"    "gmail.com"      "r-project.org"
```

If you cannot upgrade stringr, this is the base R recipe. `strsplit()` returns a list, then `sapply(..., `[`, n)` pulls the nth element from each.

[KEY INSIGHT]
**Reach for `str_split_i()` when you want a single piece, `str_split()` with `n =` when you want to limit pieces but keep them all, and `str_split_fixed()` when you want a fixed-column matrix.** Picking the right variant up front saves a follow-up `unlist`, `sapply`, or matrix coercion.

## Common pitfalls

**Pitfall 1: calling str_split_n directly.** Running `str_split_n(x, "/", 2)` throws `could not find function "str_split_n"`. The function does not exist. Use `str_split_i(x, "/", i = 2)` instead.

**Pitfall 2: bare dot delimiter.** `str_split_i(files, ".", i = -1)` splits on every character because `.` is regex for "any character." Wrap it in `fixed(".")` to mean literal dot.

[WARNING]
**`str_split_i()` requires stringr 1.5.0 or newer.** Earlier versions raise `could not find function "str_split_i"`. Check with `packageVersion("stringr")`. If you are stuck on an older version, use `sapply(str_split(x, p), `[`, i)` as a drop-in.

## Try it yourself

**Try it:** From the vector `urls`, extract the domain (the part right after `https://` and before the next `/`). Save to `ex_hosts`.

```r title="Your turn: extract URL hosts"
urls <- c("https://r-statistics.co/page.html",
          "https://cran.r-project.org/web/packages/",
          "https://github.com/tidyverse/stringr")

ex_hosts <- # your code here

ex_hosts
#> Expected: c("r-statistics.co", "cran.r-project.org", "github.com")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_hosts <- str_split_i(urls, "/", i = 3)
ex_hosts
#> [1] "r-statistics.co"     "cran.r-project.org"  "github.com"
```

**Explanation:** Splitting on `/` produces `c("https:", "", "domain", "rest")` because the `//` creates an empty piece. The third element is the host.

</details>

## Related stringr functions

After mastering the nth-piece pattern, look at:

- `str_split()`: full split, returns a list of vectors
- `str_split_1()`: split a single string into a vector
- `str_split_fixed()`: split into a fixed-column matrix
- `tidyr::separate_wider_delim()`: split a data frame column into named columns
- `str_extract()`: pull substrings by regex instead of splitting

For data frame columns, `separate_wider_delim()` is almost always the better tool than mapping `str_split_i()` across a column.

See the [stringr str_split() reference](https://stringr.tidyverse.org/reference/str_split.html) for the full function family on the tidyverse site.

## FAQ

**Is str_split_n a real function in stringr?**

No. There is no `str_split_n()` in stringr at any version. The closest matches are `str_split_i()` (returns the i-th piece per string, stringr 1.5+) and the `n` argument of `str_split()` (caps how many pieces to return). Calling `str_split_n()` raises `could not find function`.

**How do I get the nth element from a split in R?**

Use `str_split_i(x, pattern, i = n)`. It splits each string and returns the n-th piece as a flat vector. For older stringr or base R, use `sapply(strsplit(x, pattern), `[`, n)`. Both return one value per input string, with `NA` where the input has fewer than n pieces.

**What does the n argument do in str_split?**

`n` is the maximum number of pieces to split each string into. With `n = 2`, the first delimiter becomes the split point and the rest of the string stays in the second piece. It is for capping, not for picking; use `str_split_i()` if you want a specific piece.

**How do I split a string and get the last piece?**

Use a negative index: `str_split_i(x, pattern, i = -1)` returns the last piece per string. `i = -2` returns second-to-last, and so on. This is cleaner than computing `length()` for each element first.

**What is the difference between str_split_i and str_split_fixed?**

`str_split_i(x, p, i)` returns one piece per input as a flat vector. `str_split_fixed(x, p, n)` returns ALL pieces as an `n`-column matrix. Use `str_split_i()` when you want a single column of results; use `str_split_fixed()` when you want a full tabular shape.
