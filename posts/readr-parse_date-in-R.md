---
title: "readr parse_date() in R: Convert Strings to Date Objects"
slug: readr-parse_date-in-R
description: "Use readr parse_date() in R to convert character strings into Date objects. Covers format codes, locales, NA handling, and common parse errors with examples."
keywords: "readr parse_date, parse_date function R, readr parse_date examples, R parse_date format, parse character string to date R, readr date parsing"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: readr--readxl--haven
fr_parent: Importing-Data-in-R.html
auto_link_terms: "parse_date()|readr parse_date|readr::parse_date()|parse dates in R|convert string to date in R"
auto_link_case_sensitive: true
target_keyword: "readr parse_date"
sibling_block_enabled: true
difficulty: Beginner
---

# readr parse_date() in R: Convert Strings to Date Objects

<p class="lead">The readr <code>parse_date()</code> function converts a character vector into a proper <code>Date</code> object, using a format string of strptime-style codes so values like <code>"15/03/2024"</code> or <code>"March 15, 2024"</code> become the date <code>2024-03-15</code>.</p>

[QUICK ANSWER]
parse_date("2024-03-15")                      # ISO default, no format needed
parse_date("15/03/2024", format = "%d/%m/%Y") # day-first
parse_date("03/15/2024", format = "%m/%d/%Y") # month-first (US)
parse_date("March 15, 2024", "%B %d, %Y")     # full month name
parse_date("15-Mar-24", "%d-%b-%y")           # abbreviated month, 2-digit year
parse_date("2024.03.15", "%Y.%m.%d")          # custom separator
parse_date(x, na = c("", "NA", "missing"))    # treat extra strings as NA

[DECISION TREE: Is parse_date() the right tool?]
- parse a character column to dates: parse_date(x, "%m/%d/%Y")
- parse date plus a clock time: parse_datetime(x, "%Y-%m-%d %H:%M")
- parse clock times only: parse_time(x, "%H:%M")
- numbers with currency or commas: parse_number(x)
- set column types during import: read_csv(file, col_types = cols())
- guess the order without a format: lubridate::dmy(x)

## What parse_date() does

**parse_date() turns text into real dates.** It takes a character vector and a format string, then returns a `Date` vector that R can sort, subtract, and plot on a time axis. A column read as `"2024-03-15"` is just text until you parse it; arithmetic and date filters only work on the parsed result.

The function lives in the readr package and is the same engine that fills date columns when you import a file. Calling it directly is useful when a column arrived as character, when the file used an unusual layout, or when you want to test a format before applying it to a whole dataset.

[KEY INSIGHT]
**A date is a number, not a string.** R stores a `Date` as the count of days since 1970-01-01. Once `parse_date()` does the conversion, `date2 - date1` returns a day count and comparisons like `date > "2024-01-01"` work. That is the whole reason to parse rather than leave the column as text.

## parse_date() syntax and arguments

**The signature has five arguments, and only the first two matter day to day.** You pass the character vector and, in almost every case, a `format` string describing how the text is laid out.

```r title="parse_date function signature"
library(readr)

parse_date(
  x,                        # character vector to convert
  format = "",              # strptime-style format codes
  na = c("", "NA"),         # strings to treat as missing
  locale = default_locale(),# controls month and day names
  trim_ws = TRUE            # strip surrounding whitespace
)
```

| Argument | Purpose |
|---|---|
| `x` | The character vector holding date text. |
| `format` | Format codes such as `%Y`, `%m`, `%d`. Empty string means ISO 8601 only. |
| `na` | Strings parsed as `NA` instead of dates. |
| `locale` | Sets the language for month and weekday names. |
| `trim_ws` | Removes leading and trailing spaces before parsing. |

The common format codes are `%Y` (4-digit year), `%y` (2-digit year), `%m` (month number), `%B` (full month name), `%b` (abbreviated month name), and `%d` (day of month).

## Examples by use case

**The default call assumes ISO 8601.** When `format` is empty, `parse_date()` only recognizes `year-month-day` text. This is the safest layout and needs no format string.

```r title="Parse ISO format dates"
parse_date("2024-03-15")
#> [1] "2024-03-15"

parse_date(c("2024-03-15", "2024-12-01", "2025-01-31"))
#> [1] "2024-03-15" "2024-12-01" "2025-01-31"
```

**Non-ISO layouts need an explicit format.** A day-first or month-first string returns `NA` unless you describe its order. The format string must match the separators in the data exactly.

```r title="Parse day-first and US-style dates"
parse_date("15/03/2024", format = "%d/%m/%Y")
#> [1] "2024-03-15"

parse_date("03/15/2024", format = "%m/%d/%Y")
#> [1] "2024-03-15"
```

**Month names parse with %B and %b.** Use `%B` for the full name and `%b` for the three-letter abbreviation. Literal text like the comma is written straight into the format string.

```r title="Parse dates written with month names"
parse_date("March 15, 2024", format = "%B %d, %Y")
#> [1] "2024-03-15"

parse_date("15-Mar-24", format = "%d-%b-%y")
#> [1] "2024-03-15"
```

**A non-English locale unlocks foreign month names.** Pass a `locale()` with a language code so `%B` matches names like `mars` or `janvier`. Without it, foreign names fail to parse.

```r title="Parse non-English month names"
parse_date("15 mars 2024", format = "%d %B %Y", locale = locale("fr"))
#> [1] "2024-03-15"
```

## parse_date() vs as.Date() and lubridate

**parse_date() reports failures; as.Date() can hide them.** Base R's `as.Date()` does the same conversion but is quieter about bad values and uses a different default format. The lubridate helpers guess the order for you, which is convenient but less strict.

| Function | Format handling | Bad values | Best for |
|---|---|---|---|
| `parse_date()` | Explicit format string | `NA` plus a warning | Importing columns predictably |
| `as.Date()` | `format` argument, ISO default | `NA`, often silent | Quick one-off conversions |
| `lubridate::dmy()` | Guesses from order helper | `NA` plus a warning | Messy mixed-format text |

[TIP]
**Reach for `parse_date()` inside data pipelines.** Its warning when values fail to parse turns a silent data-quality bug into a visible one. For exploratory one-liners at the console, `as.Date()` or `lubridate::ymd()` are shorter.

## Common pitfalls

**Two-digit years guess the century.** With `%y`, readr maps `00` to `68` into the 2000s and `69` to `99` into the 1900s. A value like `"15-Mar-65"` becomes `2065`, not `1965`.

```r title="Two-digit year century cutoff"
parse_date("01-Jan-65", format = "%d-%b-%y")
#> [1] "2065-01-01"
```

**A missing format string silently produces all NA.** If the data is not ISO 8601 and you forget `format`, every value fails. Always check for unexpected `NA` after parsing.

```r title="Non-ISO text without a format fails"
parse_date("03/15/2024")
#> Warning: 1 parsing failure.
#> [1] NA
```

**Separators must match exactly.** The format `%d/%m/%Y` will not parse `"15-03-2024"` because it expects slashes, not hyphens.

## Try it yourself

**Try it:** Parse the character string `"31 December 2023"` into a Date object using the full month name. Save the result to `ex_date`.

```r title="Your turn: parse a written date"
# Try it: parse "31 December 2023" to a Date
ex_date <- # your code here

ex_date
#> Expected: "2023-12-31"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_date <- parse_date("31 December 2023", format = "%d %B %Y")
ex_date
#> [1] "2023-12-31"
```

**Explanation:** `%d` matches the day, `%B` matches the full month name `December`, and `%Y` matches the four-digit year. The spaces in the format string match the spaces in the input.

</details>

## Related readr functions

These functions cover the rest of readr's value-parsing toolkit:

- `parse_datetime()` parses a date together with a clock time into a `POSIXct`.
- `parse_time()` parses clock times such as `"14:30"` into a `time` object.
- `parse_number()` extracts numeric values from messy text.
- `col_date()` applies a date format to a column inside `read_csv()`.
- `read_csv()` reads a delimited file and parses its columns in one step.

## FAQ

**What is the difference between parse_date() and as.Date()?**

Both convert text to `Date` objects. `parse_date()` belongs to readr, warns loudly when values fail, and uses ISO 8601 as its no-format default. `as.Date()` is base R, often fails silently by returning `NA`, and defaults to the `%Y-%m-%d` format. Use `parse_date()` in data pipelines where you want failures surfaced, and `as.Date()` for quick console conversions.

**Why does parse_date() return NA?**

A value becomes `NA` when the text does not match the `format` string. The usual causes are a missing format argument on non-ISO data, separators that differ from the format, month names in a language the locale does not cover, or genuinely invalid dates like `2024-13-40`. Run `problems()` on the result to see which rows failed and why.

**What format codes does parse_date() use?**

It uses strptime-style codes: `%Y` for a four-digit year, `%y` for a two-digit year, `%m` for the month number, `%B` for the full month name, `%b` for the abbreviated month name, and `%d` for the day of month. Any literal characters such as slashes, hyphens, or commas are written directly into the format string between the codes.

**Can parse_date() handle a column with mixed date formats?**

No. One call to `parse_date()` applies a single format string, so rows in a different layout return `NA`. For a column that mixes layouts, either clean it first, parse each format separately and combine the results, or use `lubridate` helpers that guess the order per value.

## Conclusion

**parse_date() is the dependable choice for date conversion.** The readr `parse_date()` function turns date text into a real `Date` object in R. Supply a format string that matches your data, set a `locale` for non-English month names, and check for `NA` values that signal parse failures. For more on bringing external data into R, see the guide on [importing data in R](Importing-Data-in-R.html).
