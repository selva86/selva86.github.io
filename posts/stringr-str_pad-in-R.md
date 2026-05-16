---
title: "stringr str_pad() in R: Pad Strings to a Fixed Width"
slug: "stringr-str_pad-in-R"
description: "Use stringr str_pad() in R to pad strings to a fixed width. Zero-pad IDs, right-align text, choose a side, with 5 examples, a comparison table, and pitfalls."
keywords: "stringr str_pad, str_pad function R, stringr str_pad examples, R pad string with zeros, str_pad left pad, R fixed width string, str_pad vs formatC"
mathjax: false
webr: true
date: "2026-05-16"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "stringr-functions"
fr_parent: "stringr-in-R.html"
auto_link_terms: "str_pad()|stringr str_pad|stringr::str_pad()|pad strings to a fixed width|str_pad function"
auto_link_case_sensitive: true
target_keyword: "stringr str_pad"
sibling_block_enabled: true
difficulty: "Beginner"
---

# stringr str_pad() in R: Pad Strings to a Fixed Width

<p class="lead">stringr str_pad() adds characters to each element of a character vector until it reaches a fixed width. It is vectorised, NA aware, and lets you pad on the left, right, or both sides, which makes it the standard tool for zero-padding IDs and aligning text into clean fixed-width columns.</p>

[QUICK ANSWER]
str_pad("7", 3, pad = "0")             # "007" pad left (default)
str_pad("R", 6)                        # "     R" pad with spaces
str_pad("R", 6, side = "right")        # "R     " left-justify
str_pad("ab", 6, side = "both")        # "  ab  " centre the text
str_pad(c("1", "22"), 4, pad = "0")    # "0001" "0022" vectorised
str_pad("toolong", 3)                  # "toolong" never truncates
str_pad(NA, 5)                         # NA stays NA (NA-safe)
str_pad(id, 6, pad = "0")              # zero-pad an ID column

[DECISION TREE: Is str_pad() the right tool?]
- pad strings to a fixed width: str_pad(x, 10, pad = "0")
- shorten strings that exceed a length: str_trunc(x, 10)
- remove leading or trailing whitespace: str_trim(x)
- repeat a single string n times: str_dup(x, 3)
- join several strings end to end: str_c(x, y)
- format numbers with flags or signs: formatC(x, flag = "0")

## What str_pad() does in one sentence

**str_pad(string, width, side, pad) returns a copy of the input grown to at least `width` characters by adding the `pad` character to one or both ends.** It works element-wise on a character vector, propagates NA inputs as NA outputs, and never removes characters, so a string already wider than `width` comes back untouched.

Use str_pad() whenever values need a uniform length: zero-padded order numbers, right-aligned console output, or fixed-width export files. It is the natural counterpart to str_trim(), which strips whitespace rather than adding it.

```r title="Load stringr and pad a vector"
library(stringr)

x <- c("1", "22", "333", NA)
str_pad(x, width = 5, pad = "0")
#> [1] "00001" "00022" "00333" NA
```

Every element grows to five characters, the shorter values gain more zeros, and the NA input stays NA.

## Syntax

**str_pad(string, width, side = c("left", "right", "both"), pad = " ") takes four arguments.** The first is the character vector to pad and the second is the target width. The `side` argument chooses where the padding goes, and `pad` sets the fill character. The default pads on the left with spaces.

```r title="Function signature and defaults"
# str_pad(string, width, side = "left", pad = " ")
#
# string : character vector to pad
# width  : minimum total width of each result
# side   : "left" (default), "right", or "both"
# pad    : single character used to fill, default " "
```

Because str_pad() is vectorised, you can pad thousands of strings in one call, and `width` itself may be a vector to give each element a different target length.

```r title="Pad on the right with the side argument"
labels <- c("R", "Python", "Go")
str_pad(labels, width = 8, side = "right")
#> [1] "R       " "Python  " "Go      "
```

Each label is padded on the right, so the text starts flush at the left edge and trailing spaces fill the rest.

[NOTE]
**str_pad() is the mirror image of str_trim().** Where str_trim() removes leading and trailing whitespace, str_pad() adds characters until a width is reached. For the opposite of "make this longer", reach for str_trunc(), which shortens strings that exceed a maximum length.

## Five common str_pad() scenarios

**Five scenarios cover almost every real use of str_pad().** Each block stands alone so you can paste it into the live console.

### Zero-pad numeric IDs to a fixed width

**The most common use of str_pad() is giving IDs a uniform length.** Pad with `"0"` so short numbers line up with long ones.

```r title="Zero-pad invoice numbers"
ids <- c("12", "1234", "7")
str_pad(ids, width = 6, pad = "0")
#> [1] "000012" "001234" "000007"
```

Every value becomes six characters wide, which keeps file names, keys, and report columns consistent.

### Right-align text for a clean console table

**Padding on the left right-aligns variable-length labels.** This is the quickest way to line up a column of text in printed output.

```r title="Right-align text with default left padding"
fruit <- c("apple", "fig", "kiwi")
str_pad(fruit, width = 8)
#> [1] "   apple" "     fig" "    kiwi"
```

Each string ends at the same column, so the values form a tidy right-aligned block.

### Pad a column inside a data frame

**Most padding happens inside a tidyverse pipeline.** Combine str_pad() with `mutate()` to rewrite a column in place.

```r title="Pad an ID column with mutate"
library(dplyr)
df <- tibble(order = c("3", "47", "905"))
df |> mutate(order_id = str_pad(order, 5, pad = "0"))
#> # A tibble: 3 x 2
#>   order order_id
#>   <chr> <chr>
#> 1 3     00003
#> 2 47    00047
#> 3 905   00905
```

The new `order_id` column is fixed-width, which makes it safe to use as a join key or a sortable label.

### Build fixed-width codes by combining with str_c

**str_pad() pairs naturally with str_c() to assemble structured codes.** Pad the numeric part first, then prefix it.

```r title="Build SKU codes with str_pad and str_c"
nums <- c("8", "64", "512")
str_c("SKU-", str_pad(nums, 4, pad = "0"))
#> [1] "SKU-0008" "SKU-0064" "SKU-0512"
```

Each SKU has the same shape, which keeps catalogues and lookups predictable.

### Centre text with a custom pad character

**The `"both"` side and a custom `pad` character produce centred banners.** Padding splits as evenly as possible across the two ends.

```r title="Centre a heading with a custom pad character"
str_pad(" TITLE ", width = 21, side = "both", pad = "*")
#> [1] "******* TITLE *******"
```

The seven-character input gains seven stars on each side to reach the requested width of 21.

[KEY INSIGHT]
**Zero-padding is what makes string sorting match numeric sorting.** Sorting `c("2", "10", "1")` as text gives `"1" "10" "2"` because `"1"` precedes `"2"` character by character. Pad to a common width first and the lexical order finally agrees with the numeric order, which is why padded IDs sort and join cleanly.

## str_pad() vs formatC() vs sprintf()

**Three functions can zero-pad a value, but they target different jobs.** Picking the wrong one usually shows up as a type error or an awkward format string.

```r title="Three ways to zero-pad a number"
str_pad("7", 4, pad = "0")
#> [1] "0007"
formatC(7, width = 4, flag = "0")
#> [1] "0007"
sprintf("%04d", 7)
#> [1] "0007"
```

| Function | Source | Any pad char | Best for |
|---|---|---|---|
| `str_pad(x, 4, pad = "0")` | stringr | yes | padding character vectors in pipelines |
| `formatC(x, width = 4, flag = "0")` | base R | no | numeric formatting with alignment flags |
| `sprintf("%04d", x)` | base R | no | precise numeric format strings |

Reach for str_pad() when the input is already character data or sits inside a dplyr pipeline, and use formatC() or sprintf() when you are formatting raw numbers and want number-specific control.

[TIP]
**Pad once, at the data-cleaning stage.** Apply str_pad() when you first build an ID column rather than scattering it through every print and join. A single padded column stays consistent everywhere it is reused downstream.

## Common pitfalls

**Three pitfalls cause most str_pad() surprises.** Each has a one-line fix.

### Expecting str_pad() to shorten long strings

**str_pad() only ever adds characters; it never removes them.** A string already wider than `width` passes through unchanged.

```r title="Strings longer than width are not truncated"
str_pad("abcdefgh", width = 4)
#> [1] "abcdefgh"
```

To cap a string at a maximum length instead, use `str_trunc()`, which shortens long values and adds an ellipsis.

### Passing a multi-character pad value

**The `pad` argument must be exactly one character.** A longer string raises an error rather than repeating it.

```r title="A multi-character pad raises an error"
str_pad("x", 5, pad = "->")
#> Error in `str_pad()`:
#> ! `pad` must be a single character.
```

Pick a single fill character such as `"0"`, `" "`, or `"*"`. To build a repeated multi-character prefix, use `str_dup()` and `str_c()` instead.

### Misreading width as the number of pad characters

**`width` is the total target length, not the count of characters to add.** `str_pad("hi", 3)` adds only one space, because `"hi"` is already two characters wide.

```r title="width is total length, not characters added"
str_pad("hi", 3)
#> [1] " hi"
str_pad("hi", 6)
#> [1] "    hi"
```

Set `width` to the final length you want each element to reach, and str_pad() works out how much padding each value needs.

[WARNING]
**str_pad() returns a character vector even when the input came from a factor.** That silently changes a column's type. Convert deliberately with `as.character()` before padding, or wrap the result with `as.factor()` when you need to keep factor levels.

## Try it yourself

**Try it:** The vector `c("4", "58", "300")` holds room numbers. Pad every element with zeros to a width of 4 and save the result to `ex_rooms`.

```r title="Your turn: zero-pad the room numbers"
# Try it: pad each value to width 4 with zeros
ex_rooms <- # your code here

ex_rooms
#> Expected: c("0004", "0058", "0300")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_rooms <- str_pad(c("4", "58", "300"), width = 4, pad = "0")
ex_rooms
#> [1] "0004" "0058" "0300"
```

**Explanation:** str_pad() with `pad = "0"` and the default `side = "left"` adds enough leading zeros to make every element four characters wide, so the room numbers line up as a fixed-width column.

</details>

## Related stringr functions

When str_pad() is not quite what you need, these are the next stops:

- [str_trunc()](stringr-str_trunc-in-R.html) does the opposite job, shortening strings that exceed a maximum length.
- [str_trim()](stringr-str_trim-in-R.html) removes leading and trailing whitespace instead of adding padding.
- [str_dup()](stringr-str_dup-in-R.html) repeats a string a fixed number of times, useful for building separators.
- [str_c()](stringr-str_c-in-R.html) joins strings end to end, often paired with str_pad() to assemble codes.
- [str_length()](stringr-str_length-in-R.html) counts characters, which helps you choose the right `width`.
- The full [stringr reference](https://stringr.tidyverse.org/reference/str_pad.html) documents str_pad() and its arguments.

## FAQ

**How do I pad a number with leading zeros in R?**

Convert the number to a character vector and call str_pad() with `pad = "0"`: `str_pad(as.character(7), width = 4, pad = "0")` returns `"0007"`. The default `side = "left"` puts the zeros in front, which is what you want for IDs and codes. Because str_pad() is vectorised, the same call zero-pads a whole vector of numbers at once.

**What is the difference between str_pad() and formatC()?**

Both can zero-pad values to a fixed width. str_pad() comes from stringr, works on character vectors, and accepts any single pad character. formatC() is base R, is designed for formatting numbers, and only pads with spaces or zeros. Use str_pad() for text data and formatC() for raw numeric values.

**Does str_pad() truncate strings that are too long?**

No. str_pad() only ever adds characters, so a string already longer than `width` is returned unchanged. The `width` argument sets a minimum length, not a maximum. To shorten long strings to a fixed length, use str_trunc() instead.

**How do I pad a string on the right side in R?**

Set the `side` argument to `"right"`: `str_pad("R", width = 8, side = "right")` returns `"R       "`. Right-side padding leaves the text flush at the left edge and adds the fill characters after it, which left-aligns a column. The default `side = "left"` does the reverse and right-aligns text, and `side = "both"` centres it by splitting the padding across the two ends.

**Can str_pad() pad with a character other than a space?**

Yes. The `pad` argument accepts any single character, so `str_pad("7", 4, pad = "0")` pads with zeros and `str_pad(" hi ", 9, side = "both", pad = "*")` pads with asterisks. The only rule is that `pad` must be exactly one character; a multi-character value raises an error. To build a repeated multi-character prefix or suffix, combine str_dup() with str_c() instead of str_pad().
</content>
</invoke>
