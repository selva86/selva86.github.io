---
title: "stringr str_replace_na() in R: Replace NA Values in Strings"
slug: "stringr-str_replace_na-in-R"
description: "stringr str_replace_na() converts NA in a character vector to a string label like \"missing\" or \"\". Covers paste safety, defaults, 4 worked examples in R."
keywords: "stringr str_replace_na, str_replace_na function R, replace NA with string R, R convert NA to string, str_replace_na vs replace_na, NA-safe paste R, stringr NA handling"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "stringr-functions"
fr_parent: "stringr-in-R.html"
auto_link_terms: "str_replace_na()|stringr str_replace_na|stringr::str_replace_na()|replace NA with string|NA-safe paste"
auto_link_case_sensitive: true
target_keyword: "stringr str_replace_na"
sibling_block_enabled: true
difficulty: "Beginner"
---

# stringr str_replace_na() in R: Replace NA Values in Strings

<p class="lead">The <code>str_replace_na()</code> function in stringr replaces <code>NA</code> values in a character vector with a string label. The default replacement is the literal text <code>"NA"</code>, but you can pass any single string (often <code>""</code>, <code>"missing"</code>, or <code>"unknown"</code>) to get NA-safe output for paste, concat, and display.</p>

[QUICK ANSWER]
str_replace_na(x)                         # default replacement "NA"
str_replace_na(x, "missing")              # custom label
str_replace_na(x, "")                     # treat NA as empty string
str_replace_na(c(1, NA, 3), "0")          # coerces input to character
paste(str_replace_na(x), "!", sep = "")   # NA-safe paste
str_c("hi ", str_replace_na(x, "guest"))  # NA-safe str_c
tidyr::replace_na(df, list(name = "?"))   # data-frame equivalent

[DECISION TREE: Is str_replace_na() the right tool?]
- char vector with NA, want a string label: str_replace_na()
- NA in a data-frame column: tidyr::replace_na()
- NA in numeric vector, want another value: dplyr::coalesce()
- drop rows with NA entirely: tidyr::drop_na() or na.omit()
- check if value is NA: is.na()
- replace BOTH NA and empty string: combine str_replace_na() + str_replace()

## What str_replace_na() does in one sentence

**`str_replace_na(string, replacement = "NA")` substitutes every `NA` element in a character vector with the chosen replacement string.** Unlike `str_replace()`, it does not use regex; it only swaps `NA` for a string. Non-character input is coerced to character first.

This matters because base R's `paste()` and stringr's `str_c()` propagate or preserve `NA` in surprising ways. `str_replace_na()` is the one-step fix that makes a vector safe for concatenation and display.

## Syntax

**`str_replace_na(string, replacement = "NA")` takes two arguments: the input vector and a single replacement string.**

```r title="Load stringr and apply default replacement"
library(stringr)

x <- c("alpha", NA, "gamma", NA, "epsilon")

str_replace_na(x)
#> [1] "alpha"   "NA"      "gamma"   "NA"      "epsilon"
```

The literal string `"NA"` (four characters: `N`, `A`) replaces each missing value. The result is a regular character vector with no `NA` left.

[NOTE]
**The default replacement is the string `"NA"`, not the value `NA`.** After `str_replace_na()`, `is.na()` returns `FALSE` for every element. Downstream tests like `is.na(result)` will not flag the original missing positions.

## Four common patterns

### 1. Custom label for missing values

```r title="Replace NA with a friendly label"
x <- c("Alice", NA, "Bob", NA)

str_replace_na(x, "unknown")
#> [1] "Alice"   "unknown" "Bob"     "unknown"
```

Pass any single string. Common choices: `"missing"`, `"unknown"`, `"n/a"`, `"--"`, or `""` for blank.

### 2. NA-safe paste

```r title="Concatenate without NA contamination"
greeting <- c("Hi Alice", NA, "Hi Bob")

paste0(greeting, "!")
#> [1] "Hi Alice!" "NA!"       "Hi Bob!"

paste0(str_replace_na(greeting, ""), "!")
#> [1] "Hi Alice!" "!"         "Hi Bob!"
```

`paste0(NA, "!")` returns the string `"NA!"`, which is rarely what you want. Replacing `NA` with `""` first gives clean output.

### 3. Coerce non-character input

```r title="Numeric vector with NA"
nums <- c(1, NA, 3, NA, 5)

str_replace_na(nums, "0")
#> [1] "1" "0" "3" "0" "5"
```

The numeric vector is coerced to character before substitution. The output is always a character vector; use `as.numeric()` after if you need numbers back.

### 4. Empty string for CSV or table output

```r title="Blank cells in exported data"
labels <- c("yes", NA, "no", NA, "yes")

str_replace_na(labels, "")
#> [1] "yes" ""    "no"  ""    "yes"
```

For CSV exports or printed tables, an empty cell often reads cleaner than the literal text `"NA"`. This pattern is also useful for joining downstream string fields.

[KEY INSIGHT]
**`str_replace_na()` is purpose-built for the character-vector case; `tidyr::replace_na()` is the data-frame version.** They share intent but operate at different levels. Use stringr inside a single column transformation; use tidyr when working across multiple columns in a tibble.

## str_replace_na vs replace_na vs coalesce

**Three functions handle NA replacement in R, each at a different level.**

| Function | Works on | Replacement | Notes |
|---|---|---|---|
| `stringr::str_replace_na()` | character vector | single string | Coerces non-character input; always returns character |
| `tidyr::replace_na()` | data frame or vector | per-column list or scalar | Tibble-friendly; supports list of column-replacement pairs |
| `dplyr::coalesce()` | any vector type | another vector (vectorized) | Returns first non-NA value across inputs; type-preserving |

Decision rule: working on one character column, use `str_replace_na()`. Working across many columns of a data frame, use `tidyr::replace_na()`. Replacing NA with values from another vector (not a constant), use `dplyr::coalesce()`.

## Common pitfalls

**Pitfall 1: confusing the string `"NA"` with the value `NA`.** After `str_replace_na(x)`, the result contains the literal characters `N` and `A`. Tests like `is.na(result)` return `FALSE` everywhere; tests like `result == "NA"` return `TRUE` at the replaced positions.

**Pitfall 2: trying to use a regex pattern.** `str_replace_na()` does not take a `pattern` argument. It targets only `NA` values. If you want to replace NA AND a regex match (like empty strings), chain `str_replace_na()` followed by `str_replace()`.

**Pitfall 3: factor input loses levels.** Calling `str_replace_na()` on a factor coerces to character, so factor levels are dropped. If you need the result back as a factor, wrap the output in `factor()` with the original levels plus the replacement label.

[WARNING]
**`str_replace_na()` always returns character, never NA.** This breaks downstream logic that depends on `NA` propagation (like `na.rm` arguments, `complete.cases()`, or join keys). Apply the function as a final display step, not before statistical operations.

## Try it yourself

**Try it:** Given `prices`, replace NA with the string `"TBD"` and save to `ex_labels`.

```r title="Your turn: label missing prices"
prices <- c("19.99", NA, "29.50", NA, "45.00")

ex_labels <- # your code here

ex_labels
#> Expected: c("19.99", "TBD", "29.50", "TBD", "45.00")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_labels <- str_replace_na(prices, "TBD")
ex_labels
#> [1] "19.99" "TBD"   "29.50" "TBD"   "45.00"
```

**Explanation:** `str_replace_na()` swaps each NA for `"TBD"` while leaving existing strings untouched. The function never touches non-NA elements.

</details>

## Related stringr functions

After mastering str_replace_na, look at:

- `str_replace()`, `str_replace_all()`: replace regex matches in non-NA strings
- `str_c()`: NA-aware concatenation; pair with `str_replace_na()` for safe joining
- `str_detect()` with `is.na()`: locate NA elements before transforming them
- `tidyr::replace_na()`: data-frame-level NA replacement across many columns
- `dplyr::coalesce()`: vector-level NA fill from a fallback vector

For full reference, see the [tidyverse stringr documentation](https://stringr.tidyverse.org/reference/str_replace_na.html).

## FAQ

**What does str_replace_na do in R?**

`str_replace_na(x)` returns a character vector where every `NA` in `x` is replaced by a single chosen string (default `"NA"`). It is part of the stringr package and operates only on character vectors (non-character input is coerced first). The result has no missing values; `is.na()` returns `FALSE` for every element.

**What is the difference between str_replace_na and tidyr replace_na?**

`stringr::str_replace_na()` works on a single character vector and accepts one replacement string. `tidyr::replace_na()` works on a data frame or list and accepts a per-column replacement via a named list. Use stringr inside `mutate(col = str_replace_na(col, "..."))`; use tidyr when replacing NA across many columns at once.

**How do I replace NA with empty string in R?**

Call `str_replace_na(x, "")`. This converts each `NA` element to the empty string `""`, which renders as a blank cell in tables, CSV exports, and concatenated output. The output is a character vector with the same length as the input.

**Does str_replace_na work on numeric vectors?**

Yes, but the result is always a character vector. The numeric input is coerced via `as.character()`, then NA values are replaced. If you need a numeric result with NA filled by zero, use `dplyr::coalesce(x, 0)` or `x[is.na(x)] <- 0` instead.

**Can I use str_replace_na inside dplyr mutate?**

Yes. `df |> mutate(name = str_replace_na(name, "unknown"))` rewrites the `name` column in place, replacing every NA with `"unknown"`. This is the idiomatic pattern for cleaning a single character column before reporting or joining.
