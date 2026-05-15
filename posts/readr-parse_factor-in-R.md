---
title: "readr parse_factor() in R: Parse Text Into a Factor"
slug: readr-parse_factor-in-R
description: "The readr parse_factor() function converts a character vector into a factor and warns when a value falls outside the levels you expected. Learn its syntax."
keywords: "readr parse_factor, parse_factor function R, readr parse_factor examples, R parse character to factor, parse_factor levels, readr parse factor column"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: readr--readxl--haven
fr_parent: Importing-Data-in-R.html
auto_link_terms: "parse_factor()|parse_factor|readr parse_factor|readr::parse_factor()|parse text into a factor"
auto_link_case_sensitive: true
target_keyword: "readr parse_factor"
sibling_block_enabled: true
difficulty: Beginner
---

# readr parse_factor() in R: Parse Text Into a Factor

<p class="lead">The readr <code>parse_factor()</code> function converts a character vector into a factor and, unlike base R's <code>factor()</code>, warns you when a value falls outside the set of levels you expected.</p>

[QUICK ANSWER]
parse_factor(c("a", "b", "a"))                   # levels inferred, sorted
parse_factor(x, levels = c("lo", "mid", "hi"))   # fixed level set
parse_factor(x, levels = lv, ordered = TRUE)     # ordered factor
parse_factor(x, levels = valid)                  # flags unexpected values
parse_factor(x, na = "missing")                  # treat a string as NA
parse_factor(x, include_na = FALSE)              # no NA level

[DECISION TREE: Is parse_factor() the right tool?]
- text to a factor with a known level set: parse_factor(x, levels = lv)
- text to a factor, levels inferred: parse_factor(x)
- a factor with no validation: factor(x, levels = lv)
- reorder or relabel an existing factor: forcats::fct_relevel(f)
- set a factor column on import: col_factor(levels = lv)
- pull a number out of text: parse_number(x)
- pull a date out of text: parse_date(x)

## What parse_factor() does

**parse_factor() turns text into a validated factor.** You pass a character vector and an optional set of levels, and it returns a factor. Its defining feature is validation: when a value is not in the levels you supplied, readr records a parsing problem instead of silently discarding it.

```r title="parse_factor builds a factor from text"
library(readr)

parse_factor(c("apple", "pear", "apple", "pear"))
#> [1] apple pear  apple pear 
#> Levels: apple pear
```

With no `levels` argument, parse_factor() infers the level set from the unique values, sorted alphabetically, exactly as `factor()` would. The real value appears once you supply the levels yourself.

[KEY INSIGHT]
**parse_factor() validates, factor() does not.** When you pass an explicit level set, parse_factor() checks every value against it and flags anything unexpected. base R's `factor()` converts the same stray value to `NA` in silence. That single difference is the whole reason to reach for the readr parser.

## parse_factor() syntax and arguments

**Most calls use only x and levels; the rest tune edge cases.** The full signature is `parse_factor(x, levels = NULL, ordered = FALSE, na = c("", "NA"), locale = default_locale(), include_na = TRUE, trim_ws = TRUE)`. Each argument controls one part of how text becomes a factor.

| Argument | What it controls | Default |
|---|---|---|
| `x` | The character vector to convert | (required) |
| `levels` | The allowed factor levels; `NULL` infers them | `NULL` |
| `ordered` | Whether the factor is ordered | `FALSE` |
| `na` | Strings to treat as missing | `c("", "NA")` |
| `include_na` | Whether `NA` becomes an explicit level | `TRUE` |
| `trim_ws` | Trim surrounding whitespace before matching | `TRUE` |

The `levels` argument does double duty. It fixes the order in which the levels are stored, and it defines the valid set. Supplying it is what turns parse_factor() from a plain converter into a checker.

```r title="parse_factor with an explicit level order"
size <- c("medium", "small", "large", "small")
parse_factor(size, levels = c("small", "medium", "large"))
#> [1] medium small  large  small 
#> Levels: small medium large
```

The levels appear in the order you wrote them, not alphabetically, which matters for any plot or model that respects factor order.

## Examples by use case

**parse_factor() shines wherever a column has a known, fixed vocabulary.** Survey responses, product grades, and experiment groups all draw from a finite set of valid values, and parse_factor() makes that set explicit and enforced.

```r title="Create an ordered factor"
grades <- c("B", "A", "C", "A", "B")
parse_factor(grades, levels = c("A", "B", "C"), ordered = TRUE)
#> [1] B A C A B
#> Levels: A < B < C
```

The `<` signs in the Levels line show the factor is ordered, so comparisons such as `grade > "B"` now return meaningful results.

The validation step is the part base R cannot do. When a value does not match any level, parse_factor() names the offending row.

```r title="parse_factor flags an unexpected value"
answers <- c("yes", "no", "yes", "mabye")
parse_factor(answers, levels = c("yes", "no"))
#> Warning: 1 parsing failure.
#> row col           expected   actual
#>   4  -- value in level set    mabye
#> 
#> [1] yes  no   yes  <NA>
#> Levels: yes no
```

The misspelled `"mabye"` becomes `NA`, and readr reports exactly which row failed. Call `problems()` on the result for the full report.

The other common use is import. Inside any readr reader, `col_factor()` runs parse_factor() on a column as the file loads.

```r title="Set a factor column on import"
csv <- "id,grade
1,B
2,A
3,C"

df <- read_csv(I(csv), col_types = cols(
  grade = col_factor(levels = c("A", "B", "C"))))
levels(df$grade)
#> [1] "A" "B" "C"
```

[TIP]
**Validate during import with col_factor(), not after.** Passing `col_factor(levels = ...)` inside `col_types` parses and checks the column while the file loads. You get the same level validation as parse_factor() with no separate cleanup pass over the data frame.

## parse_factor() vs factor() and as.factor()

**All three build factors; only parse_factor() reports bad values.** The choice comes down to whether you want unexpected input to fail loudly or disappear quietly.

| Function | Validates against levels | Result for value outside levels | Use when |
|---|---|---|---|
| `parse_factor()` | Yes, with a problem report | `NA` plus a warning naming the row | You want stray values caught |
| `factor()` | No | `NA`, silently | Base R, you trust the input |
| `as.factor()` | No, cannot set levels | Keeps the value as a new level | Quick conversion, order does not matter |

The decision rule is simple. If the column should hold only a known set of values, use `parse_factor()` so violations surface. If you already trust the data or do not care about level order, `factor()` or `as.factor()` are fine and add no readr dependency.

[NOTE]
**parse_factor() and forcats solve different problems.** parse_factor() creates a factor from raw text with validation. The forcats package reorders, relabels, and lumps the levels of a factor that already exists. Reach for parse_factor() at import time and forcats afterward.

## Common pitfalls

**Three parse_factor() behaviours trip up new users.** The first is forgetting that without `levels`, you get no validation at all. parse_factor() with `levels = NULL` is just a sorted `factor()` and will never warn you about a typo.

The second is case and whitespace sensitivity. parse_factor() matches values exactly, so `"Yes"` does not match a level of `"yes"`. Surrounding whitespace is trimmed by default, but inner case differences are not, and any mismatch becomes `NA`.

```r title="parse_factor matching is case sensitive"
parse_factor(c("yes", "Yes"), levels = c("yes", "no"))
#> Warning: 1 parsing failure.
#> [1] yes  <NA>
#> Levels: yes no
```

The third is treating the warning as fatal. A parsing failure does not stop your script. It returns `NA` for the bad value and keeps going. If you need failures to halt the pipeline, inspect `problems()` and act on it yourself.

[WARNING]
**A parsing failure is a warning, not an error.** parse_factor() will hand back a vector full of `NA` values with only a console warning to show for it. In a non-interactive script that warning is easy to miss, so always check `problems()` when the level set matters.

## Try it yourself

**Try it:** Use `parse_factor()` to convert `c("hard", "easy", "easy", "medium")` into an ordered factor with levels easy < medium < hard. Save the result to `ex_difficulty`.

```r title="Your turn: build an ordered factor"
# Try it: ordered factor from text
ex_difficulty <- # your code here

ex_difficulty
#> Expected: levels easy < medium < hard
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_difficulty <- parse_factor(
  c("hard", "easy", "easy", "medium"),
  levels = c("easy", "medium", "hard"),
  ordered = TRUE)
ex_difficulty
#> [1] hard   easy   easy   medium
#> Levels: easy < medium < hard
```

**Explanation:** Passing `levels` in the order easy, medium, hard fixes the ranking, and `ordered = TRUE` records it so comparison operators work on the result.

</details>

## Related readr functions

The `parse_factor()` function belongs to readr's family of vector parsers, each tuned to a different kind of text:

- [parse_number()](readr-parse_number-in-R.html): extracts a number from messy text such as prices and percentages.
- [parse_date()](readr-parse_date-in-R.html): turns date text into proper `Date` values.
- [col_types](readr-col_types-in-R.html): the argument that assigns a parser, including `col_factor()`, to each column on import.
- [read_csv()](readr-read_csv-in-R.html): the reader where `col_factor()` applies `parse_factor()` while the file loads.

The official [readr parse_factor reference](https://readr.tidyverse.org/reference/parse_factor.html) documents every argument and the locale system in full.

## FAQ

**What does parse_factor() do in R?**

`parse_factor()` is a readr function that converts a character vector into a factor. You can supply a set of valid levels, and the function checks every value against them. Values that match become factor entries; values that do not become `NA` and are recorded as parsing problems. For example, `parse_factor(c("a", "b"), levels = c("a", "b"))` returns a clean two-level factor. It is the standard readr tool for turning categorical text into a validated factor.

**What is the difference between parse_factor() and factor()?**

Both create a factor, but only `parse_factor()` validates the input. When a value is not in the supplied `levels`, `factor()` converts it to `NA` silently, while `parse_factor()` returns `NA` and a warning that names the failing row. So a typo in your data passes unnoticed through `factor()` but is flagged by `parse_factor()`. Use `factor()` for trusted data and `parse_factor()` when stray values must be caught.

**Why does parse_factor() return NA?**

`parse_factor()` returns `NA` when a value does not appear in the `levels` you supplied, or when the value is listed in the `na` argument. Matching is exact, so a case difference such as `"Yes"` against a level of `"yes"` also produces `NA`. When this happens readr records a parsing problem; call `problems()` on the result to see which values failed and why.

**How do I create an ordered factor with parse_factor()?**

Pass `ordered = TRUE` along with the `levels` argument in rank order. For example, `parse_factor(x, levels = c("low", "medium", "high"), ordered = TRUE)` creates an ordered factor where `low < medium < high`. The order you write the levels in becomes the ranking, so comparison operators like `>` and `<` return meaningful results on the parsed values.

**Can parse_factor() be used inside read_csv()?**

Yes, indirectly. Inside a `read_csv()` call, set the column type with `col_factor(levels = ...)` in the `col_types` argument. `col_factor()` is the column specification that runs `parse_factor()` on that column as the file loads, so the column arrives already validated against your level set without a separate parsing step.
</content>
</invoke>
