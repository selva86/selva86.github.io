---
title: "readr locale() in R: Control Date and Number Parsing"
slug: readr-locale-in-R
description: "Use readr locale() in R to control how dates, numbers, encoding and time zones are parsed. Covers decimal commas, foreign month names and read_csv examples."
keywords: "readr locale, locale function R, readr locale examples, R locale parsing, readr decimal comma, readr date names locale"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: readr--readxl--haven
fr_parent: Importing-Data-in-R.html
auto_link_terms: "locale()|readr locale|readr::locale()|default_locale()|locale parsing in R"
auto_link_case_sensitive: true
target_keyword: "readr locale"
sibling_block_enabled: true
difficulty: Beginner
---

# readr locale() in R: Control Date and Number Parsing

<p class="lead">The readr <code>locale()</code> function bundles the regional parsing rules readr uses when it reads a file, so settings like a comma decimal mark, French month names, a non-UTF-8 encoding, or a time zone are passed as one object to <code>read_csv()</code> and the <code>parse_*()</code> functions.</p>

[QUICK ANSWER]
locale(decimal_mark = ",", grouping_mark = ".")     # European numbers
locale(date_names = "fr")                            # French month/day names
locale(encoding = "Latin1")                          # non-UTF-8 files
locale(tz = "America/New_York")                      # set the time zone
locale(date_format = "%d/%m/%Y")                     # default date layout
read_csv(f, locale = locale(decimal_mark = ","))     # apply during import
default_locale()                                     # inspect current settings

[DECISION TREE: Is locale() the right tool?]
- numbers use comma decimals: locale(decimal_mark = ",")
- dates in another language: locale(date_names = "de")
- file is not UTF-8 encoded: locale(encoding = "Latin1")
- parse one date string: parse_date(x, "%d/%m/%Y")
- set column types on import: read_csv(f, col_types = cols())
- shift time zones after import: lubridate::with_tz(x, "UTC")

## What locale() does

**locale() collects regional parsing settings into one object.** It does not read or parse anything by itself. Instead it returns a `locale` object that you hand to `read_csv()`, `read_delim()`, or any `parse_*()` function through their `locale` argument. That object answers every regional question readr might have: which character is the decimal point, what language the month names are in, how the file is encoded, and which time zone bare times belong to.

The default settings assume a US English file: a period decimal mark, English month names, UTF-8 encoding, and the UTC time zone. Those defaults are wrong for a large share of real-world data. A spreadsheet exported in Germany writes `1.234,56`, a French system writes dates as `15 mars 2024`, and an older Windows export is often Latin-1, not UTF-8. The `locale()` function is how you tell readr about all of that at once.

[KEY INSIGHT]
**A locale is configuration, not an action.** You build the object once with `locale()` and reuse it across every import in a script. Keeping one locale variable means a file's regional rules live in a single place instead of being scattered across many `parse_*()` calls.

## locale() syntax and arguments

**Every argument has a sensible default, so you only set what differs from US English.** A call with no arguments returns the same object as `default_locale()`.

```r title="locale function signature"
library(readr)

locale(
  date_names = "en",        # language for month and day names
  date_format = "%AD",      # default format for dates
  time_format = "%AT",      # default format for times
  decimal_mark = ".",       # character separating whole and fraction
  grouping_mark = ",",      # thousands separator
  tz = "UTC",               # time zone for parsed times
  encoding = "UTF-8",       # file character encoding
  asciify = FALSE           # transliterate date names to ASCII
)
```

| Argument | Purpose |
|---|---|
| `date_names` | Language code (`"fr"`, `"de"`) or a `date_names()` object for month and weekday names. |
| `date_format`, `time_format` | Default layouts used when a column is guessed as a date or time. |
| `decimal_mark` | The character between the integer and fractional part of a number. |
| `grouping_mark` | The thousands separator readr strips before parsing a number. |
| `tz` | Time zone applied to parsed date-times that carry no offset. |
| `encoding` | Character encoding of the source file. |

The `decimal_mark` and `grouping_mark` must be different characters. Setting both to a comma raises an error, because readr could not tell a decimal point from a thousands separator.

## Examples by use case

**Call default_locale() to see the starting point.** Printing a locale object shows the number format, the date and time formats, the time zone, the encoding, and the full list of month and day names.

```r title="Inspect the default locale"
library(readr)
default_locale()
#> <locale>
#> Numbers:  -123,456.78
#> Formats:  %AD / %AT
#> Timezone: UTC
#> Encoding: UTF-8
#> <date_names>
#> Days:   Sunday (Sun), Monday (Mon), Tuesday (Tue), Wednesday (Wed),
#>         Thursday (Thu), Friday (Fri), Saturday (Sat)
#> Months: January (Jan), February (Feb), March (Mar), April (Apr), ...
```

**Set a comma decimal mark for European numbers.** A value like `1.234,56` means "one thousand two hundred thirty-four point five six" in much of Europe. Swap the two marks so readr reads it correctly.

```r title="Parse numbers with a comma decimal"
eu <- locale(decimal_mark = ",", grouping_mark = ".")
parse_double(c("1.234,56", "9.876,00"), locale = eu)
#> [1] 1234.56 9876.00
```

**Pass a language code to parse foreign month names.** With `date_names = "fr"`, the `%B` and `%b` codes match names like `mars` and `janvier` instead of failing.

```r title="Parse French dates with a locale"
fr <- locale(date_names = "fr")
parse_date("15 mars 2024", format = "%d %B %Y", locale = fr)
#> [1] "2024-03-15"
```

**Apply a locale to a whole file with read_delim().** The `locale` argument flows down to every column readr parses, so one object fixes the numbers in an entire import.

```r title="Use a locale during file import"
txt <- "amount;label\n1.234,56;rent\n9.876,00;salary"
read_delim(txt, delim = ";",
           locale = locale(decimal_mark = ",", grouping_mark = "."),
           show_col_types = FALSE)
#> # A tibble: 2 x 2
#>   amount label
#>    <dbl> <chr>
#> 1  1235. rent
#> 2  9876  salary
```

## locale() vs default_locale() and Sys.setlocale()

**These three tools sound similar but operate at different levels.** `locale()` builds a readr-only configuration object. `default_locale()` returns readr's current default object. `Sys.setlocale()` changes the entire R session's regional settings and affects base functions, not readr.

| Function | Scope | Best for |
|---|---|---|
| `locale()` | One readr import or parse call | Per-file regional rules without side effects |
| `default_locale()` | readr session default | Inspecting or reusing the global readr default |
| `Sys.setlocale()` | Whole R session, base R | Changing `as.Date()` or `format()` behavior |

[TIP]
**Prefer `locale()` over `Sys.setlocale()` for imports.** A `locale()` object is explicit and local: the regional rule travels with the import that needs it and never leaks into other code. `Sys.setlocale()` is a global switch that is easy to forget and hard to reproduce on another machine.

## Common pitfalls

**The decimal and grouping marks cannot match.** Passing the same character for both is the most common `locale()` error, because readr cannot disambiguate the two roles.

```r title="Decimal and grouping marks must differ"
locale(decimal_mark = ",", grouping_mark = ",")
#> Error: `decimal_mark` and `grouping_mark` must be different
```

**A locale object does nothing on its own.** Building `locale(decimal_mark = ",")` and then calling `parse_double()` without passing it changes nothing. The object must reach a `parse_*()` or `read_*()` call through its `locale` argument.

**An unsupported language code fails.** `date_names` accepts the codes listed by `date_names_langs()`. A made-up code like `"xx"` raises an error rather than silently falling back to English.

```r title="Check which language codes exist"
head(date_names_langs(), 8)
#> [1] "af" "am" "ar" "as" "az" "be" "bg" "bn"
```

## Try it yourself

**Try it:** Build a locale for German numbers (comma decimal, period grouping) and use it to parse the string `"2.000,50"`. Save the result to `ex_num`.

```r title="Your turn: parse a German number"
# Try it: parse "2.000,50" with a German locale
ex_num <- # your code here

ex_num
#> Expected: 2000.5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
de <- locale(decimal_mark = ",", grouping_mark = ".")
ex_num <- parse_double("2.000,50", locale = de)
ex_num
#> [1] 2000.5
```

**Explanation:** The German locale tells `parse_double()` that the comma is the decimal point and the period groups thousands. readr strips the grouping period and reads the comma as the fraction separator.

</details>

## Related readr functions

These functions work alongside `locale()` when importing and parsing data:

- `default_locale()` returns readr's current default locale object.
- `date_names_lang()` builds a `date_names` set from a single language code.
- `parse_date()` converts character strings to `Date` objects and accepts a `locale`.
- `parse_number()` extracts numbers from messy text using the locale's marks.
- `read_csv()` reads a delimited file and forwards `locale` to every column.

## FAQ

**What does the locale argument do in read_csv()?**

The `locale` argument tells `read_csv()` how to interpret region-specific values in the file. It controls the decimal and grouping marks for numeric columns, the language for month and weekday names in date columns, the character encoding of the file, and the time zone for parsed times. You build the object with `locale()` and pass it once; readr then applies those rules to every column it parses during that single import.

**How do I read a file with comma decimal separators in R?**

Build a locale with `locale(decimal_mark = ",", grouping_mark = ".")` and pass it to the reader. For a semicolon-delimited European file you can also use `read_csv2()`, which already assumes a comma decimal and semicolon delimiter. For other delimiters, use `read_delim()` with an explicit `delim` and the custom `locale`. The marks must be different characters or readr raises an error.

**How do I parse non-English dates with readr?**

Set the `date_names` argument of `locale()` to a language code, such as `locale(date_names = "de")` for German. Then the `%B` and `%b` format codes match that language's month names. Pass the locale to `parse_date()` or to `read_csv()` through its `locale` argument. Run `date_names_langs()` to see every supported code.

**What is the difference between locale() and default_locale()?**

`locale()` is a constructor: you call it with the arguments you want to change and it returns a new locale object. `default_locale()` takes no arguments and returns the locale readr uses when you do not supply one, which assumes US English conventions. In practice you call `default_locale()` to inspect the baseline and `locale()` to build a customized object for a specific file.

## Conclusion

**locale() is how you make readr respect regional data conventions.** Build one `locale()` object with the decimal mark, date language, encoding, and time zone your file uses, then pass it to `read_csv()` or any `parse_*()` function. Keeping the regional rules in a single object makes imports predictable and easy to reuse. For the broader workflow of bringing external files into R, see the guide on [importing data in R](Importing-Data-in-R.html).
