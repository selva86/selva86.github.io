---
title: "stringr str_trunc() in R: Shorten Strings to a Fixed Width"
slug: stringr-str_trunc-in-R
description: "Learn stringr str_trunc() in R to shorten strings to a fixed width with an ellipsis: syntax, the side argument, custom ellipsis, and common pitfalls explained."
keywords: "stringr str_trunc, str_trunc function R, stringr str_trunc examples, truncate string R, shorten string R, str_trunc width, R truncate text"
mathjax: false
webr: true
date: "2026-05-16"
post_type: PSEO
category_id: function-deep
subcategory_id: stringr-functions
fr_parent: stringr-in-R.html
auto_link_terms: "str_trunc()|stringr str_trunc|stringr::str_trunc()|truncate strings|truncate text"
auto_link_case_sensitive: true
target_keyword: "stringr str_trunc"
sibling_block_enabled: true
difficulty: Beginner
---

# stringr str_trunc() in R: Shorten Strings to a Fixed Width

<p class="lead">The stringr str_trunc() function shortens a string to a fixed maximum width, replacing the cut text with an ellipsis. It is the clean way to fit long labels into tables, plots, and console output.</p>

[QUICK ANSWER]
str_trunc(x, 20)                       # truncate to 20 chars, right
str_trunc(x, 20, side = "left")        # keep the end, cut the start
str_trunc(x, 20, side = "center")      # keep both ends, cut the middle
str_trunc(x, 20, ellipsis = "...")     # default ellipsis marker
str_trunc(x, 20, ellipsis = " >")      # custom ellipsis marker
str_trunc(col, 30)                     # vectorized over a whole column

[DECISION TREE: Is str_trunc() the right tool?]
- shorten long text with an ellipsis: str_trunc(x, 30)
- extract a fixed character range: str_sub(x, 1, 30)
- pad short strings up to a width: str_pad(x, 30)
- wrap long text across lines: str_wrap(x, 30)
- strip leading and trailing space: str_trim(x)
- make short unique abbreviations: abbreviate(x, 30)

## What str_trunc() does

**str_trunc() caps a string at a maximum length.** You give it a character vector and a `width`, and any string longer than that width is cut down and finished with an ellipsis so the reader knows text was removed. Strings already shorter than `width` are returned untouched.

It belongs to the stringr package, part of the tidyverse. The function is purely cosmetic: it never changes the underlying data, it only produces a shortened display version. That makes it ideal for axis labels, table cells, log lines, and anywhere fixed-width output keeps a layout readable.

```r title="Load stringr and truncate a string"
library(stringr)

description <- "This product is currently out of stock"
str_trunc(description, width = 20)
#> [1] "This product is c..."
```

The result is exactly 20 characters: 17 characters of text plus the 3-character ellipsis. That total-width behavior is the single most important thing to understand about the function.

[KEY INSIGHT]
**The width is the budget for the final string, ellipsis included.** `str_trunc(x, 20)` never returns more than 20 characters. The ellipsis is paid for out of that 20, not added on top, so the visible text is `width` minus `nchar(ellipsis)`.

## str_trunc() syntax

**The function takes one required argument and three optional ones.** The full signature is short and every argument has a sensible default.

```r title="The str_trunc function signature"
str_trunc(string, width, side = c("right", "left", "center"), ellipsis = "...")
```

- `string`: a character vector to truncate. Vectorized, so a whole column works.
- `width`: the maximum length of each returned string, counting the ellipsis.
- `side`: which part of the string to cut. One of `"right"`, `"left"`, or `"center"`.
- `ellipsis`: the marker that replaces the removed text. Defaults to `"..."`.

Only `string` and `width` are needed in practice. The other two let you control where the cut happens and how it is signposted.

## Four ways to use str_trunc()

### Truncate from the right

**Right truncation is the default and keeps the start of the string.** Use it when the most important information sits at the beginning, which is true for most labels and titles.

```r title="Truncate from the right"
x <- "This product is currently out of stock"
str_trunc(x, 20, side = "right")
#> [1] "This product is c..."
```

### Keep the end with side = "left"

**Left truncation cuts the start and keeps the tail.** This suits file paths, URLs, and IDs where the distinguishing part is at the end.

```r title="Truncate from the left"
str_trunc(x, 20, side = "left")
#> [1] "...ntly out of stock"
```

### Keep both ends with side = "center"

**Center truncation removes the middle and keeps both ends.** It is useful when the start and the end both carry meaning, such as a name plus a status.

```r title="Truncate from the center"
str_trunc(x, 20, side = "center")
#> [1] "This prod...of stock"
```

### Customize the ellipsis

**The ellipsis argument replaces the default three dots with any marker.** Remember the marker counts toward `width`, so a longer marker leaves less room for text.

```r title="Use a custom ellipsis marker"
str_trunc(x, 25, ellipsis = " [more]")
#> [1] "This product is cu [more]"
```

### Truncate a whole column

**str_trunc() is vectorized, so it shortens an entire column in one call.** Strings shorter than `width` pass through unchanged, which keeps mixed-length data tidy.

```r title="Truncate a column of labels"
products <- c(
  "Wireless noise-cancelling headphones",
  "USB-C cable",
  "Ultra-wide 34 inch curved monitor"
)
str_trunc(products, 18)
#> [1] "Wireless noise-..." "USB-C cable"        "Ultra-wide 34 i..."
```

[TIP]
**Pair str_trunc() with mutate() for plot labels.** Inside a dplyr pipeline, `mutate(label = str_trunc(name, 25))` produces compact axis text without touching the original `name` column, so sorting and joins still use the full values.

## str_trunc() vs other string functions

**Several functions resize strings, but each solves a different problem.** Choosing the wrong one leads to data loss or misaligned output, so match the function to the intent.

| Function | What it does | Adds an ellipsis? | Use when |
|---|---|---|---|
| `str_trunc()` | Caps a string at a maximum width | Yes | Showing long text in a fixed space |
| `str_sub()` | Extracts a substring by position | No | You need an exact character range |
| `str_pad()` | Extends short strings up to a width | No | Aligning values into columns |
| `abbreviate()` | Shortens to unique short forms | No, drops vowels | Compact unique codes or keys |

The decision rule: use `str_trunc()` when the goal is display and you want a visible "text was cut" signal. Reach for `str_sub()` when you need precise extraction and `str_pad()` when strings are too short rather than too long.

[NOTE]
**Coming from Python pandas?** There is no direct equivalent. `Series.str.slice(0, 20)` cuts characters but never adds an ellipsis, so the truncation is silent. `str_trunc()` does both in one step.

## Common pitfalls

**Setting width below the ellipsis length throws an error.** The function cannot fit even the marker, so it stops rather than guess.

```r title="Width must exceed the ellipsis length"
str_trunc(x, 2)
#> Error in `str_trunc()`:
#> ! `width` (2) must be greater than `ellipsis` (3).
```

The fix is to use a width larger than `nchar(ellipsis)`, or shorten the ellipsis itself with `ellipsis = ".."`.

Two more traps catch beginners. First, `str_trunc()` only ever shortens. It will not pad a short string out to `width`, so it cannot align ragged data on its own; use `str_pad()` for that. Second, the width counts the ellipsis, so `str_trunc(x, 10)` shows only 7 characters of text with the default `"..."`. If you expected 10 visible characters plus dots, raise `width` to 13.

[WARNING]
**str_trunc() counts characters, not display columns.** Wide characters such as CJK text or emoji each count as one character but render as two columns. A width that looks right for Latin text can still overflow a fixed layout when the data is multilingual.

## Try it yourself

**Try it:** Truncate the `cities` vector to 12 characters, keeping the end of each name, and save the result to `ex_short`.

```r title="Your turn: truncate city names"
cities <- c("San Francisco", "Los Angeles", "Boston")
# Try it: keep the last characters, drop the start
ex_short <- # your code here

ex_short
#> Expected: long names get a leading ellipsis
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
cities <- c("San Francisco", "Los Angeles", "Boston")
ex_short <- str_trunc(cities, 12, side = "left")
ex_short
#> [1] "...Francisco" "Los Angeles"  "Boston"
```

**Explanation:** `side = "left"` cuts the start and keeps the tail, so "San Francisco" becomes "...Francisco". "Los Angeles" and "Boston" are already within 12 characters, so they pass through unchanged.

</details>

## Related stringr functions

**str_trunc() works best alongside the other string-sizing tools in stringr.** Each link below covers one function in the same depth as this page.

- [str_pad()](stringr-str_pad-in-R.html): the opposite operation, padding short strings up to a width.
- [str_sub()](stringr-str_sub-in-R.html): extract a substring by start and end position.
- [str_trim()](stringr-str_trim-in-R.html): remove leading and trailing whitespace.
- [str_squish()](stringr-str_squish-in-R.html): trim ends and collapse internal whitespace.
- [str_length()](stringr-str_length-in-R.html): measure string length before deciding a width.

For the full argument reference, see the official [stringr str_trunc documentation](https://stringr.tidyverse.org/reference/str_trunc.html).

## FAQ

**Does str_trunc() count the ellipsis in the width?**

Yes. The `width` argument is the maximum length of the entire returned string, including the ellipsis. With the default `"..."`, `str_trunc(x, 20)` returns 17 characters of text plus 3 dots. If you want a specific number of visible characters, add the ellipsis length to your target width.

**What is the difference between str_trunc() and str_sub()?**

`str_sub()` extracts an exact character range and never signals that text was removed. `str_trunc()` is display-focused: it caps a string at a width and appends an ellipsis so readers can see the value was shortened. Use `str_sub()` for precise extraction and `str_trunc()` for tidy, fixed-width output.

**How do I truncate text from the left or middle?**

Set the `side` argument. `side = "left"` keeps the end of the string and puts the ellipsis at the front, which suits paths and IDs. `side = "center"` keeps both ends and removes the middle. The default `side = "right"` keeps the start, the best choice for most labels and titles.

**Can str_trunc() handle a data frame column?**

Yes. `str_trunc()` is vectorized, so you can pass an entire character column and every value is truncated independently. Inside a dplyr pipeline, use it with `mutate()`, for example `mutate(short_name = str_trunc(name, 25))`, to add a compact display column without altering the original data.
