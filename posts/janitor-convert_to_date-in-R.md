---
title: "janitor convert_to_date(): Smart Date Dispatcher in R"
slug: janitor-convert_to_date-in-R
description: "janitor::convert_to_date() converts mixed character and numeric input to a real R Date class, dispatching to ymd() or excel_numeric_to_date() as needed."
keywords: "janitor convert_to_date, convert_to_date function R, janitor convert_to_date examples, R convert mixed dates to date, character to date janitor, excel serial to date R, convert date column R"
mathjax: false
webr: true
date: "2026-05-22"
post_type: PSEO
category_id: function-deep
subcategory_id: janitor-functions
fr_parent: janitor-Package-in-R.html
auto_link_terms: "convert_to_date()|janitor convert_to_date|janitor::convert_to_date()|convert mixed dates|dispatch date conversion"
auto_link_case_sensitive: true
target_keyword: "janitor convert_to_date"
sibling_block_enabled: true
difficulty: Beginner
---

# janitor convert_to_date(): Smart Date Dispatcher in R

<p class="lead">janitor::convert_to_date() converts mixed character and numeric input to a real R Date object. It dispatches on the input class: characters route through a parser (lubridate by default), and numbers route through excel_numeric_to_date(). One call cleans the messy date columns that arrive from CSV exports.</p>

[QUICK ANSWER]
convert_to_date("2024-01-15")                          # ISO character to Date
convert_to_date(44197)                                 # Excel serial to Date
convert_to_date(c("2024-01-15", "44562"))              # mixed character column
convert_to_date(x, character_fun = lubridate::mdy)     # US-style strings
convert_to_date(x, character_fun = lubridate::dmy)     # European strings
convert_to_date(x, string_conversion_failure = "warning")  # tolerate junk
df |> mutate(d = convert_to_date(raw))                 # inside a pipe

[DECISION TREE: Is convert_to_date() the right tool?]
- mixed character and numeric input: convert_to_date(x)
- numeric Excel serial only: janitor::excel_numeric_to_date(x)
- ISO 8601 character only: as.Date(x)
- non-ISO character formats: lubridate::mdy(x), dmy(x), ymd(x)
- need POSIXct with time: convert_to_datetime(x)
- already a Date and just want validation: lubridate::is.Date(x)
- Unix epoch seconds: as.POSIXct(x, origin = "1970-01-01")

## What convert_to_date() does

**convert_to_date() turns whatever date input you have into a Date object.** A CSV exported from Excel often returns one column with two kinds of values: cells formatted as dates land as character strings like "2024-01-15", while cells formatted as numbers land as integers like 44562. Both represent the same calendar date, but base R sees them as incompatible types. convert_to_date() inspects the class of its input and dispatches to the right converter, returning a single Date vector.

The function is an S3 generic. It has methods for character, numeric, factor, logical, POSIXct, and Date inputs. Characters get parsed by a function you supply via character_fun (default: lubridate::parse_date_time with ymd orders). Numerics get passed to excel_numeric_to_date(). The output class is always Date.

## Syntax and arguments

**The signature has four parts: the input vector, dots forwarded to numeric handling, the character parser, and a failure mode.** You usually pass only the first argument.

```r title="Function signature"
library(janitor)
library(lubridate)

args(convert_to_date)
#> function (x, ...) 
#> NULL
```

| Argument | Default | What it does |
|----------|---------|--------------|
| `x` | required | Vector to convert (character, numeric, factor, POSIXct, Date) |
| `...` | | Passed to `excel_numeric_to_date()` for numeric input (e.g., `date_system`, `include_time`) |
| `character_fun` | `lubridate::parse_date_time(orders = c("ymd","ymd HMS"))` | Function applied to character entries |
| `string_conversion_failure` | `"error"` | What to do when a string fails parsing: `"error"` or `"warning"` |

The dots argument is how you reach excel_numeric_to_date() options without calling it directly. If your serials originate on legacy Mac, pass `date_system = "mac pre-2011"` straight through convert_to_date(). For non-ISO character formats like "01/15/2024", swap character_fun to lubridate::mdy.

[NOTE]
**character_fun controls everything about string parsing.** The default tries ISO 8601 ("2024-01-15") and ISO datetime ("2024-01-15 10:30:00"). For US, European, or custom formats, pass a different parser. This is the single most useful argument to know.

## Examples by use case

**Five patterns cover most real-world calls to convert_to_date().** Each example is self-contained and runs in a fresh R session.

**Use 1: a clean ISO character vector.** The default parser handles "YYYY-MM-DD" without configuration.

```r title="Parse ISO date strings"
library(janitor)

convert_to_date(c("2024-01-15", "2024-02-29", "2024-12-31"))
#> [1] "2024-01-15" "2024-02-29" "2024-12-31"
```

The result is a Date vector ready for filtering, arithmetic, or joining.

**Use 2: a numeric Excel serial column.** The function detects the numeric class and forwards to excel_numeric_to_date().

```r title="Convert Excel serials"
library(janitor)

convert_to_date(c(44197, 44562, 44927))
#> [1] "2021-01-01" "2022-01-01" "2023-01-01"
```

This is the same result you would get from janitor::excel_numeric_to_date() directly; convert_to_date() just saved you a class check.

**Use 3: a messy column with both strings and numbers.** This is the killer use case. CSV imports often produce a character column where some cells look like "2024-01-15" and others look like "45292".

```r title="Mixed character column"
library(janitor)

raw <- c("2024-01-15", "45292", "2024-03-01", "45352")
convert_to_date(raw)
#> [1] "2024-01-15" "2024-01-01" "2024-03-01" "2024-03-01"
```

Strings that parse as ISO dates become themselves; strings that look numeric get coerced and routed through the Excel serial path. The result is a single Date vector with no manual splitting.

**Use 4: US or European date formats.** The default parser only knows ISO. Swap character_fun for mdy or dmy.

```r title="Use mdy parser for US dates"
library(janitor)
library(lubridate)

us_dates <- c("01/15/2024", "02/29/2024", "12/31/2024")
convert_to_date(us_dates, character_fun = lubridate::mdy)
#> [1] "2024-01-15" "2024-02-29" "2024-12-31"
```

Pass lubridate::dmy for "15/01/2024", lubridate::ymd_hms for "2024-01-15 10:30:00", or any function that takes a character vector and returns a Date or POSIXct.

**Use 5: tolerate parse failures.** Sometimes a column carries the occasional "TBD" or "N/A". The default errors on the first failure; switch to "warning" to return NA for failing rows and keep going.

```r title="Tolerate junk values"
library(janitor)

messy <- c("2024-01-15", "TBD", "2024-03-01")
convert_to_date(messy, string_conversion_failure = "warning")
#> [1] "2024-01-15" NA           "2024-03-01"
```

This is the right setting for first-pass cleanup, then you can audit NA rows separately.

## Compare with alternatives

**Four other functions convert dates in R, but only convert_to_date() handles class dispatch.** Pick it when the input type is mixed or unknown; pick the others when you already know what you have.

| Approach | Input type | When to pick it |
|----------|-----------|-----------------|
| `convert_to_date(x)` | Mixed character and numeric | Unknown or mixed input columns |
| `excel_numeric_to_date(x)` | Numeric Excel serial only | Pure numeric column from Excel |
| `as.Date(x)` | ISO 8601 character | Already in YYYY-MM-DD format |
| `lubridate::mdy(x)`, `dmy(x)`, `ymd(x)` | Free-form character | Known non-ISO character format |
| `as.POSIXct(x, origin = "1970-01-01")` | Unix epoch seconds | Non-Excel numeric timestamps |

For interactive exploration where you do not yet know the column type, convert_to_date() is the safe default. For production code where you control the upstream format, the more specific functions document intent better.

[TIP]
**Prefer readxl::read_excel() when you control the import.** If you load an .xlsx file with readxl, date cells arrive as Date objects already; no conversion is needed. Reserve convert_to_date() for CSV imports, web-scraped data, and any case where dates may have been re-typed as character or number along the way.

## Common pitfalls

**Three traps recur, each easy to spot once you know what to look for.** All three reflect the dispatch mechanism, not bugs in the function.

```r title="Pitfall 1: small numbers that look like serials"
library(janitor)

convert_to_date(c(1, 2, 3))
#> [1] "1899-12-31" "1900-01-01" "1900-01-02"
```

Numbers under 10000 produce dates in 1899 or 1900 because excel_numeric_to_date() interprets them as days since 1899-12-30. A column with single-digit values is almost never a date column; verify column meaning before converting.

```r title="Pitfall 2: ambiguous date strings with default parser"
library(janitor)

# Default character_fun expects ymd; "01-15-2024" is mdy
try(convert_to_date("01-15-2024"))
#> Warning message:
#> All formats failed to parse. No formats found.
#> [1] NA
```

The default parser only tries ISO orders. Pass character_fun = lubridate::mdy when strings are US-formatted, or expect NA results.

```r title="Pitfall 3: factor input with stale levels"
library(janitor)

f <- factor(c("2024-01-15", "2024-02-29"), levels = c("2024-01-15", "2024-02-29", "old"))
convert_to_date(f)
#> [1] "2024-01-15" "2024-02-29"
```

Factor methods convert via the level labels, not the integer codes. Unused levels do not appear in the output, but watch out: if a level label is not a valid date string and any row uses it, you will get NA for that row.

[WARNING]
**The dispatch is decided once for the whole vector.** If you pass a list or a mixed-type column that R has coerced to character (the usual CSV behavior), every entry routes through character_fun. That is the right path for the mixed example above. But if a numeric column got accidentally coerced to character upstream, you may need to call as.numeric() before convert_to_date() to force the Excel serial path.

## Try it yourself

**Try it:** A CSV import returned a character vector mixing ISO dates and Excel serials: `c("2024-01-15", "45292", "2024-03-01")`. Convert it with convert_to_date() and save the result to ex_dates. Confirm the class is Date and the length is 3.

```r title="Your turn: convert a mixed column"
library(janitor)

ex_raw <- c("2024-01-15", "45292", "2024-03-01")
ex_dates <- # your code here

ex_dates
#> Expected: 2024-01-15, 2024-01-01, 2024-03-01
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
library(janitor)

ex_raw <- c("2024-01-15", "45292", "2024-03-01")
ex_dates <- convert_to_date(ex_raw)

ex_dates
#> [1] "2024-01-15" "2024-01-01" "2024-03-01"

class(ex_dates)
#> [1] "Date"

length(ex_dates)
#> [1] 3
```

**Explanation:** convert_to_date() inspects each entry: "2024-01-15" parses as ISO, "45292" coerces to numeric and routes through excel_numeric_to_date() (returning 2024-01-01), and "2024-03-01" parses as ISO. The unified output is a Date vector.

</details>

## Related janitor functions

**janitor groups convert_to_date() with five other import-cleanup helpers.** Together they handle the most common spreadsheet quirks.

- `excel_numeric_to_date()` is the numeric-only path that convert_to_date() calls under the hood for numeric input
- `convert_to_datetime()` does the same dispatch but returns POSIXct for time-of-day fidelity
- `excel_numeric_to_datetime()` is the POSIXct analogue of excel_numeric_to_date()
- `sas_numeric_to_date()` handles SAS serials with a 1960-01-01 origin
- `clean_names()` standardises column names once the date column is fixed

For a tour of the full toolkit, see the [janitor Package in R](janitor-Package-in-R.html) tutorial. The official function reference lives at [sfirke.github.io/janitor](https://sfirke.github.io/janitor/reference/convert_to_date.html).

## FAQ

**What is the difference between convert_to_date() and excel_numeric_to_date()?**

excel_numeric_to_date() accepts numeric input only and errors on anything else. convert_to_date() dispatches on input class to accept character, numeric, factor, logical, POSIXct, and Date. For numeric input both return the same result; for character input only convert_to_date() works.

**Can convert_to_date() parse non-ISO formats like "01/15/2024"?**

Only if you change the character_fun argument. The default tries ISO 8601 and ISO datetime orders and fails on US or European formats. Pass character_fun = lubridate::mdy for "01/15/2024", lubridate::dmy for "15/01/2024", or any function that takes a character vector and returns a Date-like object.

**How do I keep the time component when converting?**

Use convert_to_datetime() instead. That function returns POSIXct and preserves fractional time of day from Excel serials and parses datetime strings from character input. convert_to_date() always truncates to midnight.

**Why did convert_to_date(1) return a 19th-century date?**

The numeric path uses Excel's epoch of 1899-12-30, so serial 1 is 1899-12-31. Small integers below about 10000 produce dates in 1899 or 1900 and almost certainly mean the input is not a real date column. Inspect the source before continuing.

**Should I use string_conversion_failure = "warning" in production?**

It depends on your tolerance for silent NA. In exploratory work, "warning" lets you finish the pipeline and audit failed rows. In production ETL, "error" forces you to detect bad data upstream rather than ship NAs to a dashboard.
