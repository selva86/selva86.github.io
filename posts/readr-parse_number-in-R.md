---
title: "readr parse_number() in R: Extract Numbers From Text"
slug: readr-parse_number-in-R
description: "The readr parse_number() function extracts numbers from messy text, stripping currency symbols, commas, and percent signs. Learn its syntax with examples."
keywords: "readr parse_number, parse_number function R, readr parse_number examples, R parse_number string to number, extract numbers from string R, remove commas from numbers R"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: readr--readxl--haven
fr_parent: Importing-Data-in-R.html
auto_link_terms: "parse_number()|parse_number|readr parse_number|readr::parse_number()|extract numbers from text"
auto_link_case_sensitive: true
target_keyword: "readr parse_number"
sibling_block_enabled: true
difficulty: Beginner
---

# readr parse_number() in R: Extract Numbers From Text

<p class="lead">The readr <code>parse_number()</code> function extracts the first number from messy text, dropping currency symbols, thousands separators, percent signs, and surrounding words so a column like <code>"$1,234.56"</code> becomes the numeric value <code>1234.56</code>.</p>

[QUICK ANSWER]
parse_number("$1,234.56")                       # strips $ and , -> 1234.56
parse_number("45%")                              # strips % -> 45
parse_number("approx 3,500 units")               # pulls embedded number -> 3500
parse_number(c("12.5kg", "8kg"))                 # vectorised -> 12.5, 8
parse_number("-19.90 USD")                       # keeps the sign -> -19.9
parse_number("1.234,56", locale = locale(        # European format
  decimal_mark = ",", grouping_mark = "."))      #   -> 1234.56

[DECISION TREE: Is parse_number() the right tool?]
- pull a number out of messy text: parse_number("$1,234")
- convert an already-clean numeric string: parse_double("12.5")
- parse a date out of text: parse_date(x, "%Y-%m-%d")
- set a column type on import: read_csv(f, col_types = "n")
- fix every column after import: type_convert(df)
- extract a custom pattern, not a number: str_extract(x, "[A-Z]+")

## What parse_number() does

**parse_number() turns text that contains a number into a number.** You give it a character vector, and it scans each value, ignores any non-numeric characters around the number, and returns a numeric vector. This is what makes it the readr tool of choice for prices, percentages, and figures pasted in with their units still attached.

```r title="parse_number strips non-numeric characters"
library(readr)

parse_number("$1,234.56")
#> [1] 1234.56

parse_number(c("45%", "8.2%", "100%"))
#> [1]  45.0   8.2 100.0
```

The dollar sign, the comma, and the percent sign all disappear, leaving clean numeric values you can do arithmetic on. Base R's `as.numeric()` would return `NA` for every one of these strings, because it refuses any input that is not already a bare number.

[KEY INSIGHT]
**parse_number() extracts, it does not validate.** It finds the first run of digits, signs, and number marks in a string and discards everything else. That tolerance is its strength for messy data and its risk for ambiguous data, so pair it with a quick sanity check on the result.

## parse_number() syntax and arguments

**The function signature is short and most calls use only the first argument.** The full form is `parse_number(x, na = c("", "NA"), locale = default_locale(), trim_ws = TRUE)`. Each argument controls one part of how text becomes a number.

| Argument | What it controls | Default |
|---|---|---|
| `x` | The character vector to parse | (required) |
| `na` | Strings to treat as missing rather than parse | `c("", "NA")` |
| `locale` | The decimal mark and grouping mark to expect | `default_locale()` |
| `trim_ws` | Whether to trim surrounding whitespace first | `TRUE` |

The `locale` argument is the one that changes results most. A US locale reads `,` as a thousands separator and `.` as the decimal point; a European locale swaps them. Set it explicitly whenever your data does not use the US convention.

```r title="parse_number with European number formats"
parse_number("1.234,56",
  locale = locale(decimal_mark = ",", grouping_mark = "."))
#> [1] 1234.56
```

Here the period groups thousands and the comma marks the decimal, so `"1.234,56"` correctly parses to `1234.56` instead of the wrong `1.234`.

## Examples by use case

**parse_number() solves the same problem in several disguises.** Whether the number is wrapped in currency, buried in a sentence, or carries a unit suffix, the call is the same. It also reads a leading minus sign, so negative figures survive.

```r title="parse_number pulls a number from a sentence"
parse_number("about 3,500 units shipped")
#> [1] 3500

parse_number("Total: USD 1,299 (tax included)")
#> [1] 1299

parse_number(c("-19.90 owed", "+42 credit"))
#> [1] -19.9  42.0
```

The most common real use is cleaning a column right after import. Read the file, then pass the messy column through `parse_number()` to get a numeric column you can sum, average, or plot.

```r title="Clean a price column after import"
csv <- "item,price
Mouse,$24.99
Keyboard,$1,099.00
Cable,$8.50"

df <- read_csv(I(csv), show_col_types = FALSE)
df$price_num <- parse_number(df$price)
sum(df$price_num)
#> [1] 1132.49
```

[TIP]
**Skip the cleanup step with col_types = "n".** Inside any readr reader, the compact type letter `n` runs `parse_number()` on a column as it loads. `read_csv(file, col_types = "cn")` reads the second column straight to a clean number, with no separate `parse_number()` call afterward.

## parse_number() vs as.numeric() and parse_double()

**Pick the converter that matches how clean your data already is.** All three turn text into numbers, but they tolerate very different amounts of mess. `parse_number()` extracts, `parse_double()` and `as.numeric()` demand a clean string.

| Function | Strips symbols and text | Result for `"$1,234"` | Use when |
|---|---|---|---|
| `parse_number()` | Yes | `1234` | Numbers wrapped in currency, commas, or units |
| `parse_double()` | No | `NA` plus a parsing problem | The string is already a clean number |
| `as.numeric()` | No | `NA` plus a warning | Base R, clean numeric strings only |

The decision rule is simple. If the text contains anything other than a number, reach for `parse_number()`. If the text is already a tidy numeric string and you want a strict check that catches bad values, use `parse_double()` so problems surface instead of being silently extracted away.

[NOTE]
**Coming from Python pandas?** There is no single pandas equivalent. You would typically chain `Series.str.replace()` to strip symbols and then `pd.to_numeric()` to convert. The readr `parse_number()` function folds both steps into one call.

## Common pitfalls

**Three parse_number() surprises catch new users.** The first is that it reads only the *first* number in a string. A value that contains two numbers loses the second one without any warning.

```r title="parse_number reads only the first number"
parse_number("buy 2 get 1 free")
#> [1] 2
```

The result is `2`, and the `1` is gone. When a column might hold more than one number per cell, use `stringr::str_extract_all()` to pull every match instead.

The second pitfall is a wrong `locale`. If your data writes thousands as `1.234` but you parse with the default US locale, `parse_number()` treats the period as a decimal point and returns `1.234`, a thousand times too small. The result looks valid, so this error hides easily.

The third pitfall is a string with no number at all. `parse_number()` returns `NA` and records a parsing problem you can inspect, rather than stopping the script.

[WARNING]
**A silent locale mismatch produces plausible wrong numbers.** Unlike a missing number, a misread grouping mark gives a value that is the right shape but the wrong magnitude. Always set `locale` explicitly for non-US data and spot-check the parsed range against what you expect.

## Try it yourself

**Try it:** Use `parse_number()` to convert the vector `c("£250.00", "£1,499.99", "£12.50")` into numbers and save the result to `ex_prices`.

```r title="Your turn: parse currency strings"
# Try it: parse the price strings to numbers
ex_prices <- # your code here

ex_prices
#> Expected: 250.00 1499.99 12.50
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_prices <- parse_number(c("£250.00", "£1,499.99", "£12.50"))
ex_prices
#> [1]  250.00 1499.99   12.50
```

**Explanation:** `parse_number()` discards the pound sign and the thousands comma, keeping only the digits and the decimal point. The result is a numeric vector ready for arithmetic.

</details>

## Related readr functions

The `parse_number()` function belongs to readr's family of vector parsers, each tuned to a different kind of text:

- [parse_double()](readr-parse_double-in-R.html): strict numeric parser for strings that are already clean numbers.
- [parse_date()](readr-parse_date-in-R.html): turns date text into proper `Date` values.
- [parse_factor()](readr-parse_factor-in-R.html): converts text to a factor with a known set of levels.
- [read_csv()](readr-read_csv-in-R.html): the reader where `col_types = "n"` applies `parse_number()` during import.
- [col_types](readr-col_types-in-R.html): the argument that assigns parsers, including the number parser, per column.

The official [readr parsing vignette](https://readr.tidyverse.org/articles/readr.html) documents every `parse_*()` function and the locale system in full.

## FAQ

**What does parse_number() do in R?**

`parse_number()` is a readr function that extracts a number from a character string. It scans the text, ignores currency symbols, thousands separators, percent signs, and surrounding words, and returns a numeric vector. For example, `parse_number("$1,234.56")` returns `1234.56`. It is the standard way to clean a column of prices or percentages so the values can be used in calculations.

**What is the difference between parse_number() and as.numeric()?**

`as.numeric()` only converts strings that are already clean numbers; anything else becomes `NA` with a warning. `parse_number()` is far more tolerant: it strips symbols and text and pulls out the embedded number. So `as.numeric("$50")` gives `NA`, while `parse_number("$50")` gives `50`. Use `as.numeric()` for tidy data and `parse_number()` for messy, real-world text.

**How do I remove commas and dollar signs from numbers in R?**

Pass the column to `parse_number()`. It removes the dollar sign and treats the comma as a thousands separator, returning a clean numeric value. For instance, `parse_number("$1,099.00")` returns `1099`. Inside a `read_csv()` call you can also set `col_types = "n"` for that column, which runs the same parser automatically as the file loads.

**Why does parse_number() return NA?**

`parse_number()` returns `NA` when a string contains no number it can recognise, such as `"none"` or an empty value. It also returns `NA` for strings listed in the `na` argument. When this happens, readr records a parsing problem; call `problems()` on the result to see which values failed and why.

**Can parse_number() handle European number formats?**

Yes. Pass a `locale` that describes the format, for example `locale(decimal_mark = ",", grouping_mark = ".")`. With that locale, `parse_number("1.234,56")` correctly returns `1234.56`. Without it, the default US locale would misread the period as a decimal point, so always set the locale explicitly for non-US data.
