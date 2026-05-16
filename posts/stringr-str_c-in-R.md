---
title: "stringr str_c() in R: Join Strings With a Separator"
slug: "stringr-str_c-in-R"
description: "Use stringr str_c() in R to concatenate character vectors with a separator or collapse them into one string. 5 examples, a paste comparison, and pitfalls."
keywords: "stringr str_c, str_c function R, stringr str_c examples, R concatenate strings, str_c separator, str_c collapse, str_c vs paste"
mathjax: false
webr: true
date: "2026-05-16"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "stringr-functions"
fr_parent: "stringr-in-R.html"
auto_link_terms: "str_c()|stringr str_c|stringr::str_c()|concatenate strings|str_c function"
auto_link_case_sensitive: true
target_keyword: "stringr str_c"
sibling_block_enabled: true
difficulty: "Beginner"
---

# stringr str_c() in R: Join Strings With a Separator

<p class="lead">stringr str_c() concatenates character vectors element-wise, joining each set of pieces into one string. It is vectorised, accepts a <code>sep</code> string placed between arguments, and an optional <code>collapse</code> string that reduces the whole result to a single value. Unlike paste(), it propagates NA rather than turning it into the text "NA".</p>

[QUICK ANSWER]
str_c("a", "b", "c")                  # "abc" join with no separator
str_c("a", "b", sep = "-")            # "a-b" insert a separator
str_c(c("x", "y"), c("1", "2"))       # "x1" "y2" element-wise
str_c("id_", 1:3)                     # "id_1" "id_2" "id_3" recycle a scalar
str_c(c("a", "b", "c"), collapse = ", ")  # "a, b, c" collapse to one string
str_c(letters[1:3], collapse = "")    # "abc" flatten a vector
str_c("x", NA, "z")                   # NA propagates (NA-aware)

[DECISION TREE: Is str_c() the right tool?]
- join several strings end to end: str_c("a", "b", "c")
- collapse a whole vector to one string: str_flatten(x, ", ")
- repeat one string n times: str_dup("-", 20)
- insert values into a template: str_glue("Hi {name}")
- join base R style, keeping NA as text: paste0(x, y)
- pad a string to a fixed width: str_pad(x, 10)

## What str_c() does in one sentence

**str_c(..., sep, collapse) joins its arguments into a character vector, working element-wise across the inputs.** Each argument is a character vector, the matching elements are pasted together, and the `sep` string is inserted between them. The default `sep` is the empty string, so by default the pieces touch directly.

Use str_c() whenever you assemble a string from several parts: a full name from first and last columns, or an ID from a prefix and a number. It is the join-different-pieces counterpart to str_dup(), which repeats one string.

```r title="Load stringr and join two strings"
library(stringr)

str_c("data", "frame")
#> [1] "dataframe"
```

The default empty separator concatenates the pieces directly into `"dataframe"`.

## Syntax

**str_c(..., sep = "", collapse = NULL) takes any number of vectors plus two named options.** The `...` arguments are the character vectors to join, `sep` is the string placed between them, and `collapse` optionally flattens the result vector into a single string.

```r title="Function signature and defaults"
# str_c(..., sep = "", collapse = NULL)
#
# ...      : one or more character vectors to join
# sep      : string inserted between the ... arguments
# collapse : if set, joins the result vector into one string
```

Because str_c() is vectorised, the `...` vectors are joined position by position. A length-one vector recycles to match longer vectors.

```r title="Insert a separator between pieces"
str_c("2026", "05", "16", sep = "-")
#> [1] "2026-05-16"
```

The `sep` value `"-"` is inserted between each of the three arguments to build an ISO-style date string.

[NOTE]
**`sep` and `collapse` answer two different questions.** `sep` sits between the `...` arguments within each element, so it controls how the pieces of one string join. `collapse` sits between the elements of the finished vector, so it controls how a vector becomes a single string. A call can use either, both, or neither.

## Five common str_c() scenarios

**Five scenarios cover almost every real use of str_c().** Each block stands alone, so you can paste it straight into the live console.

### Join two vectors element-wise

**The core job of str_c() is joining vectors position by position.** Matching elements are concatenated, and `sep` controls the gap between them.

```r title="Join first and last names"
first <- c("Ada", "Alan", "Grace")
last  <- c("Lovelace", "Turing", "Hopper")
str_c(first, last, sep = " ")
#> [1] "Ada Lovelace" "Alan Turing"  "Grace Hopper"
```

Each name joins the elements at the same position in both vectors.

### Build IDs by recycling a scalar

**A length-one string recycles to match a longer vector.** That makes str_c() the standard way to stamp a fixed prefix onto a sequence.

```r title="Build IDs from a prefix and numbers"
str_c("user_", 1:5)
#> [1] "user_1" "user_2" "user_3" "user_4" "user_5"
```

The scalar `"user_"` is repeated for all five numbers, and the integers are coerced to text before joining.

### Collapse a vector into one string

**Set `collapse` to reduce the result vector to a single string.** The `collapse` value is inserted between the finished elements.

```r title="Collapse a vector with a separator"
fruits <- c("apple", "pear", "plum")
str_c(fruits, collapse = ", ")
#> [1] "apple, pear, plum"
```

The three elements become one comma-separated string.

### Join columns inside a pipeline

**Most joining happens inside a tidyverse pipeline.** Pass columns to str_c() inside `mutate()` to build a new label column.

```r title="Join columns with mutate"
library(dplyr)
df <- tibble(city = c("Paris", "Tokyo"), code = c("FR", "JP"))
df |> mutate(label = str_c(city, " (", code, ")"))
#> # A tibble: 2 x 3
#>   city  code  label
#>   <chr> <chr> <chr>
#> 1 Paris FR    Paris (FR)
#> 2 Tokyo JP    Tokyo (JP)
```

The literal `" ("` and `")"` pieces recycle across every row to wrap each `code`.

### Combine joining and collapsing

**A single call can both join element-wise and collapse the result.** str_c() applies `sep` first, then `collapse`.

```r title="Join then collapse in one call"
str_c(c("a", "b", "c"), c("1", "2", "3"), sep = "-", collapse = ", ")
#> [1] "a-1, b-2, c-3"
```

Each pair joins with `"-"`, then the three results are collapsed into one string with `", "`.

[KEY INSIGHT]
**`sep` works within a string, `collapse` works across strings.** Picture the inputs as columns in a grid: `sep` glues the columns of one row together, and `collapse` then stacks the rows into a single value. Holding that mental model straight is the difference between `"a-1, b-2"` and a confused result.

## str_c() vs paste() vs paste0()

**Three functions concatenate strings, and they differ in defaults and NA handling.** The choice usually comes down to how you want missing values treated.

```r title="Compare str_c, paste, and paste0"
str_c("a", "b")
#> [1] "ab"
paste("a", "b")
#> [1] "a b"
paste0("a", "b")
#> [1] "ab"
str_c("a", NA)
#> [1] NA
paste0("a", NA)
#> [1] "aNA"
```

str_c() and paste0() share the empty default separator, while paste() uses a space. The real divide is NA: str_c() returns NA for any element containing a missing value, but paste() and paste0() coerce NA into the literal text `"NA"`.

| Function | Default `sep` | NA handling | Recycling |
|---|---|---|---|
| `str_c()` | `""` | propagates NA | strict (length 1 or equal) |
| `paste()` | `" "` | NA becomes `"NA"` | flexible |
| `paste0()` | `""` | NA becomes `"NA"` | flexible |

Reach for str_c() inside tidyverse code when you want NA to stay NA, and use paste0() when you deliberately want missing values rendered as text.

[TIP]
**Prefer str_c() over paste0() in data pipelines.** Because str_c() keeps NA as NA, a missing value stays visible and can be handled with the usual `is.na()` tools. paste0() hides the problem by silently writing `"NA"` into your data, which is hard to detect downstream.

## Common pitfalls

**Three pitfalls cause most str_c() surprises.** Each has a one-line fix.

### NA values propagate silently

**A single NA in any input makes the whole joined element NA.** This is correct behaviour, but it can shrink a column without warning.

```r title="A single NA spreads to the element"
str_c("order-", c("A", NA, "C"))
#> [1] "order-A" NA        "order-C"
```

To keep the row, convert NA to a string first with `str_replace_na()`, which turns it into the literal `"NA"`.

```r title="Replace NA before joining"
str_c("order-", str_replace_na(c("A", NA, "C")))
#> [1] "order-A"  "order-NA" "order-C"
```

Now the middle element joins cleanly instead of collapsing to a missing value.

### Confusing sep with collapse

**Swapping `sep` and `collapse` produces a valid but wrong result.** `sep` joins arguments; `collapse` joins the finished vector.

```r title="sep and collapse give different results"
str_c(c("a", "b"), c("1", "2"), sep = "-")
#> [1] "a-1" "b-2"
str_c(c("a", "b"), c("1", "2"), collapse = "-")
#> [1] "a1-b2"
```

If you want a separator inside each joined pair, use `sep`. If you want one final string, use `collapse`.

### Mismatched lengths raise an error

**str_c() recycling is strict: every vector must be length one or the common length.** A length that is neither raises an error.

```r title="Incompatible lengths raise an error"
str_c(c("a", "b", "c"), c("1", "2"))
#> Error in `str_c()`:
#> ! Can't recycle `..1` (size 3) to match `..2` (size 2).
```

Make the shorter input either a single value or the same length as the longer one, and the call recycles cleanly.

[WARNING]
**str_c() does not recycle the way paste() does.** paste() happily recycles a length-2 vector against a length-3 vector, str_c() refuses. Code ported from paste() can fail here, so check that every vector is length one or the shared length before the call.

## Try it yourself

**Try it:** Join the prefix `"SKU"` with the numbers `101`, `102`, and `103` using a dash separator. Save the result to `ex_codes`.

```r title="Your turn: build product codes"
# Try it: join "SKU" with the numbers using a dash
ex_codes <- # your code here

ex_codes
#> Expected: "SKU-101" "SKU-102" "SKU-103"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_codes <- str_c("SKU", c(101, 102, 103), sep = "-")
ex_codes
#> [1] "SKU-101" "SKU-102" "SKU-103"
```

**Explanation:** The scalar `"SKU"` recycles to match the three numbers, the integers are coerced to text, and `sep = "-"` inserts a dash between each prefix and number.

</details>

## Related stringr functions

When str_c() is not quite what you need, these are the next stops:

- [str_flatten()](stringr-str_flatten-in-R.html) collapses a vector into one string and is the clearer choice when you only need `collapse`.
- [str_dup()](stringr-str_dup-in-R.html) repeats a single string a fixed number of times, rather than joining different pieces.
- [str_glue()](stringr-str_glue-in-R.html) interpolates values into a template string, which reads better than many `str_c()` arguments.
- [str_pad()](stringr-str_pad-in-R.html) grows a string to a fixed width by adding a pad character.
- [str_replace_na()](stringr-str_replace_na-in-R.html) turns NA into the text `"NA"` so it survives a str_c() join.
- The full [stringr reference](https://stringr.tidyverse.org/reference/str_c.html) documents str_c() and its arguments.

## FAQ

**What is the difference between str_c() and paste() in R?**

They differ in two ways. str_c() uses an empty separator by default while `paste()` uses a space, so `str_c("a", "b")` gives `"ab"` and `paste("a", "b")` gives `"a b"`. str_c() also propagates NA: any element with a missing input becomes NA, while paste() turns NA into the literal text `"NA"`.

**How do I concatenate strings in R with stringr?**

Call `str_c()` with the pieces as arguments: `str_c("first", "second")` returns `"firstsecond"`. Add `sep` to place a string between the pieces, such as `str_c("a", "b", sep = "-")` for `"a-b"`. Because str_c() is vectorised, passing character vectors joins them element-wise, and a length-one value recycles to match longer vectors, so a fixed prefix attaches to every element.

**What does the collapse argument do in str_c()?**

`collapse` reduces the result vector to a single string by inserting its value between the finished elements. `str_c(c("a", "b", "c"), collapse = ", ")` returns the one-element string `"a, b, c"`. This differs from `sep`, which sits between the `...` arguments within each element. A call can use both: str_c() applies `sep` first to build each element, then `collapse` to flatten the vector.

**Why does str_c() return NA?**

str_c() is NA-aware, so if any input element is NA, the joined result for that element is also NA. `str_c("order-", NA)` returns `NA` rather than `"order-NA"`. If you want the NA rendered as text instead, wrap the input in `str_replace_na()` before the call, or switch to `paste0()`, which coerces NA to `"NA"`.

**Can str_c() join two columns in a data frame?**

Yes. Inside `mutate()`, pass the columns to str_c() to build a new column: `df |> mutate(full = str_c(first, last, sep = " "))`. str_c() joins the columns element-wise, and you can mix in literal strings such as `" ("` and `")"` to wrap values. The equal-length columns of a data frame recycle naturally.
