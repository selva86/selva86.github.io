---
title: "haven zap_formats() in R: Clear SPSS and Stata Formats"
slug: haven-zap_formats-in-R
description: "Learn how haven zap_formats() removes SPSS, Stata, and SAS display-format attributes from imported data in R, with runnable examples and common pitfalls."
keywords: "haven zap_formats, zap_formats function R, haven zap_formats examples, R remove SPSS formats, zap_formats haven, remove display format R, haven zap formats Stata"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: readr--readxl--haven
fr_parent: Importing-Data-in-R.html
auto_link_terms: "zap_formats()|haven zap_formats|haven::zap_formats()|zap_formats|remove format attributes"
auto_link_case_sensitive: true
target_keyword: "haven zap_formats"
sibling_block_enabled: true
difficulty: Beginner
---

# haven zap_formats() in R: Clear SPSS and Stata Formats

<p class="lead">The haven zap_formats() function removes the SPSS, Stata, and SAS display-format attributes that haven attaches to imported columns, leaving plain R vectors that print and behave normally.</p>

[QUICK ANSWER]
zap_formats(x)                          # strip formats from one column
zap_formats(df)                         # strip formats from every column
df$pay <- zap_formats(df$pay)           # strip one column in place
attributes(zap_formats(x))              # confirm format attrs are gone
df |> mutate(across(everything(), zap_formats))  # tidyverse style
zap_labels(zap_formats(x))              # chain with other zappers

[DECISION TREE: Is zap_formats() the right tool?]
- remove SPSS/Stata format strings: zap_formats(df)
- remove value labels too: zap_labels(df)
- remove the variable label: zap_label(df)
- remove SPSS column display widths: zap_widths(df)
- turn labelled values into factors: as_factor(df)
- blank strings should become NA: zap_empty(df$x)

## What zap_formats() does

**zap_formats() deletes display-format metadata, not data.** When `haven` reads an SPSS, Stata, or SAS file, it preserves each variable's original display format so the data can round-trip back to the source software unchanged. That format is stored as an attribute (`format.spss`, `format.stata`, or `format.sas`) on every affected column.

Those attributes are harmless most of the time, but they can confuse functions that inspect attributes, clutter `str()` output, or trip up packages that do not expect them. `zap_formats()` strips all three attributes and returns the column or data frame with identical values.

[KEY INSIGHT]
**Formats are a round-trip convenience, not part of your data.** haven keeps them so you can write the file back out to Stata or SPSS with the same look. If you never plan to export to those formats, zapping them is safe and lossless.

```r title="Inspect a haven format attribute"
library(haven)

# A numeric column as haven would return it from a .sav file
pay <- c(48000, 52500, 61000)
attr(pay, "format.spss") <- "F8.2"

attributes(pay)
#> $format.spss
#> [1] "F8.2"
```

## zap_formats() syntax and arguments

**The signature is minimal: `zap_formats(x)`.** The single argument `x` is either a vector or a data frame. For a vector, `zap_formats()` removes the format attributes directly. For a data frame, it applies itself to every column and returns the cleaned frame. There are no other parameters to tune.

The function targets exactly three attributes, one per supported statistical package:

| Attribute | Source software | What it controls |
|---|---|---|
| `format.spss` | SPSS (.sav) | Display format such as `F8.2` |
| `format.stata` | Stata (.dta) | Display format such as `%9.0g` |
| `format.sas` | SAS (.sas7bdat) | SAS format such as `DOLLAR12.` |

```r title="Strip a format attribute from a vector"
clean_pay <- zap_formats(pay)
attributes(clean_pay)
#> NULL

clean_pay
#> [1] 48000 52500 61000
```

The values are untouched. Only the metadata disappears.

## Remove format attributes with zap_formats()

**Pass a whole data frame to clean every column at once.** This is the common case after reading a survey export, where many columns each carry a stray format string. A single call clears them all.

```r title="Strip formats across a data frame"
survey <- data.frame(
  id  = 1:3,
  pay = c(48000, 52500, 61000),
  age = c(31, 45, 27)
)
attr(survey$pay, "format.spss") <- "F8.2"
attr(survey$age, "format.stata") <- "%9.0g"

survey <- zap_formats(survey)
lapply(survey, attributes)
#> $id
#> NULL
#>
#> $pay
#> NULL
#>
#> $age
#> NULL
```

[TIP]
**Fold zap_formats() into a dplyr pipeline for a one-line cleanup.** Using `across(everything(), zap_formats)` keeps the format-stripping step visible in your import script instead of buried in a separate line.

```r title="Combine zap_formats with a dplyr pipeline"
library(dplyr)

survey2 <- data.frame(score = c(7, 9, 5))
attr(survey2$score, "format.spss") <- "F2.0"

survey2 <- survey2 |>
  mutate(across(everything(), zap_formats))
attr(survey2$score, "format.spss")
#> NULL
```

You can also chain it with other zappers, for example `zap_labels(zap_formats(x))`, when a column carries both formats and value labels.

## zap_formats() vs zap_labels and other zap functions

**Each zap function removes one specific kind of haven metadata.** They are easy to confuse because they share a prefix, but they act on different attributes. Picking the wrong one leaves the attribute you actually wanted to remove still attached.

| Function | Removes | Changes values? |
|---|---|---|
| `zap_formats()` | `format.spss/stata/sas` | No |
| `zap_labels()` | Value labels (`labels` attr) | No, returns underlying values |
| `zap_label()` | The variable label (`label` attr) | No |
| `zap_widths()` | SPSS display widths | No |
| `zap_empty()` | Converts `""` to `NA` | Yes |

The rule is simple: use `zap_formats()` for display formats, `zap_labels()` for coded value labels, and `zap_label()` for the human-readable variable description. Only `zap_empty()` alters the data itself.

## Common pitfalls

**The most frequent mistake is forgetting to reassign the result.** `zap_formats()` returns a cleaned copy; it does not modify its input in place. Calling it without capturing the output does nothing visible.

```r title="Reassign to keep the change"
zap_formats(pay)            # result discarded, pay unchanged
attr(pay, "format.spss")
#> [1] "F8.2"

pay <- zap_formats(pay)     # reassign to actually apply it
attr(pay, "format.spss")
#> NULL
```

[WARNING]
**zap_formats() will not remove value labels.** If a column still prints with labelled categories after zapping formats, you needed `zap_labels()` instead. The two attributes are independent, and clearing one leaves the other intact.

The third pitfall is harmless but worth knowing: running `zap_formats()` on a column that has no format attribute is a safe no-op. It returns the column unchanged rather than raising an error, so you can apply it defensively across mixed data.

## Try it yourself

**Try it:** Build a numeric vector `ex_cost`, attach a Stata format attribute to it, then remove that attribute with `zap_formats()`. Save the cleaned vector to `ex_clean`.

```r title="Your turn: zap a Stata format"
library(haven)

ex_cost <- c(120, 340, 89)
attr(ex_cost, "format.stata") <- "%9.0g"

ex_clean <- # your code here

attributes(ex_clean)
#> Expected: NULL
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_clean <- zap_formats(ex_cost)
attributes(ex_clean)
#> NULL
```

**Explanation:** `zap_formats()` strips the `format.stata` attribute and returns a plain numeric vector. The values stay the same, so `attributes()` reports `NULL` once the only attribute is removed.

</details>

## Related haven functions

These functions handle the other metadata that `haven` attaches to imported SPSS, Stata, and SAS columns:

- `zap_labels()` removes coded value labels and returns the underlying values.
- `zap_label()` removes the variable's human-readable description.
- `zap_widths()` removes SPSS display-width attributes.
- `as_factor()` converts labelled vectors into ordinary R factors.
- `read_sav()`, `read_dta()`, and `read_sas()` import the files that carry these formats. See the official [haven zap_formats reference](https://haven.tidyverse.org/reference/zap_formats.html) for package details.

## FAQ

**What does zap_formats() do in haven?**

`zap_formats()` removes the display-format attributes (`format.spss`, `format.stata`, and `format.sas`) that `haven` attaches to columns when it imports SPSS, Stata, or SAS files. These attributes record how each variable was formatted in the source software. The function returns the same vector or data frame with identical values, just without the format metadata. It is a cleanup step, not a transformation, so the numbers and strings you care about never change.

**Does zap_formats() remove value labels?**

No. `zap_formats()` only touches display-format attributes. Value labels are stored in a separate `labels` attribute and are removed by `zap_labels()`. If an imported column still prints with labelled categories after you run `zap_formats()`, that label attribute is still attached. Use `zap_labels()` to drop the coded labels, or `as_factor()` to convert them into a proper factor instead.

**Do I need zap_formats() after read_sav()?**

Not always. The format attributes are harmless for most analysis and are only needed if you plan to export the data back to SPSS or Stata. Use `zap_formats()` when the attributes interfere with code that inspects attributes, when `str()` output is cluttered, or when a downstream package fails on the unexpected metadata. If you never export to a statistical package, zapping formats keeps your data frame clean.

**What is the difference between zap_formats() and zap_widths()?**

`zap_formats()` removes the display-format strings such as `F8.2` or `%9.0g`. `zap_widths()` removes the separate `display_width` attribute that SPSS uses to set column width in its data editor. They target different attributes, so removing one does not affect the other. A column imported from SPSS can carry both, in which case you call each function once or chain them together.
</content>
</invoke>
