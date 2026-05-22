---
title: "janitor convert_to_datetime(): POSIXct From Mixed Input"
slug: janitor-convert_to_datetime-in-R
description: "janitor::convert_to_datetime() turns mixed character and numeric input into POSIXct, preserving the time component from Excel serials and ISO datetime strings."
keywords: "janitor convert_to_datetime, convert_to_datetime function R, janitor convert_to_datetime examples, R convert mixed dates to POSIXct, character to datetime janitor, excel serial to datetime R, fractional Excel serial R"
mathjax: false
webr: true
date: "2026-05-22"
post_type: PSEO
category_id: function-deep
subcategory_id: janitor-functions
fr_parent: janitor-Package-in-R.html
auto_link_terms: "convert_to_datetime()|janitor convert_to_datetime|janitor::convert_to_datetime()|character to POSIXct|fractional Excel serial"
auto_link_case_sensitive: true
target_keyword: "janitor convert_to_datetime"
sibling_block_enabled: true
difficulty: Beginner
---

# janitor convert_to_datetime(): POSIXct From Mixed Input

<p class="lead">janitor::convert_to_datetime() converts mixed character and numeric input to a POSIXct object, preserving the time-of-day component that convert_to_date() throws away. Characters route through a datetime parser, numerics route through excel_numeric_to_datetime(), and fractional Excel serials become the matching hour and minute.</p>

[QUICK ANSWER]
convert_to_datetime("2024-01-15 09:30:00")                  # ISO datetime string
convert_to_datetime(44197.5)                                # fractional Excel serial (noon)
convert_to_datetime(c("2024-01-15 09:30:00", "44562.25"))   # mixed character column
convert_to_datetime(x, character_fun = lubridate::mdy_hms)  # US datetime strings
convert_to_datetime(x, tz = "America/New_York")             # tag the output time zone
convert_to_datetime(x, string_conversion_failure = "warning") # tolerate junk
df |> mutate(ts = convert_to_datetime(raw))                 # inside a pipe

[DECISION TREE: Is convert_to_datetime() the right tool?]
- mixed character and numeric datetime input: convert_to_datetime(x)
- numeric Excel serial with time component: janitor::excel_numeric_to_datetime(x)
- character datetime only (ISO 8601): as.POSIXct(x, tz = "UTC")
- non-ISO datetime strings: lubridate::mdy_hms(x), dmy_hms(x), ymd_hms(x)
- date without time component: janitor::convert_to_date(x)
- Unix epoch seconds: as.POSIXct(x, origin = "1970-01-01")
- character with milliseconds: lubridate::ymd_hms(x) then format with op.digits.secs

## What convert_to_datetime() does

**convert_to_datetime() upgrades whatever date-like input you have into a POSIXct timestamp.** A spreadsheet often stores "2024-01-15 09:30" in one row and the equivalent number 45306.395833 in another. convert_to_datetime() inspects the class of its input and dispatches to the matching converter, returning a single POSIXct vector with the time of day intact.

The function is an S3 generic with methods for character, numeric, factor, logical, POSIXct, and Date inputs. Characters route through character_fun (default: lubridate::parse_date_time with ymd and ymd_HMS orders). Numerics forward to excel_numeric_to_datetime(), which interprets the fractional part as a fraction of a day. Output class is always POSIXct.

## Syntax and arguments

**The signature has the input vector, dots forwarded to numeric handling, the character parser, a time zone, and a failure mode.** Most calls pass only the first argument; the most useful override is character_fun.

```r title="Function signature"
library(janitor)
library(lubridate)

args(convert_to_datetime)
#> function (x, ...) 
#> NULL
```

| Argument | Default | What it does |
|----------|---------|--------------|
| `x` | required | Vector to convert (character, numeric, factor, POSIXct, Date) |
| `...` | | Forwarded to excel_numeric_to_datetime() for numeric input (`tz`, `include_time`) |
| `character_fun` | `lubridate::parse_date_time(orders = c("ymd","ymd HMS"))` | Function applied to character entries |
| `string_conversion_failure` | `"error"` | What to do when a string fails parsing: `"error"` or `"warning"` |
| `tz` | `"UTC"` | Time zone applied to the numeric path |

The tz argument is the main difference from convert_to_date(). Excel serials carry no time zone, so the function picks one; UTC is the safe default. Supply your own when source data is from a single locale. For character input, the parser may set its own tz, so consider standardising afterwards with lubridate::with_tz().

[NOTE]
**character_fun controls everything about string parsing.** The default tries ISO 8601 dates ("2024-01-15") and ISO datetimes ("2024-01-15 09:30:00"). For US, European, or custom datetime formats, pass a different parser. lubridate::mdy_hms, dmy_hms, and ymd_hms cover the common shapes.

## Examples by use case

**Five patterns cover most real-world calls to convert_to_datetime().** Each example is self-contained and runs in a fresh R session.

**Use 1: a clean ISO datetime vector.** The default parser handles "YYYY-MM-DD HH:MM:SS" with no configuration.

```r title="Parse ISO datetime strings"
library(janitor)

convert_to_datetime(c("2024-01-15 09:30:00", "2024-02-29 23:59:59"))
#> [1] "2024-01-15 09:30:00 UTC" "2024-02-29 23:59:59 UTC"
```

The result is a POSIXct vector ready for arithmetic, lubridate accessors, or grouping by hour.

**Use 2: fractional Excel serials.** Integer part is the day count from 1899-12-30; fractional part is the share of the day after midnight.

```r title="Convert fractional Excel serials"
library(janitor)

convert_to_datetime(c(44197.5, 44197.75, 44562.395833))
#> [1] "2021-01-01 12:00:00 UTC" "2021-01-01 18:00:00 UTC"
#> [3] "2022-01-01 09:30:00 UTC"
```

0.5 is noon, 0.75 is 6 PM, 0.395833 is 09:30. Excel exports produce these once a cell is formatted "Date Time" rather than "Date".

**Use 3: a messy column with both strings and numbers.** The killer use case. CSV imports often produce a character column where some cells look like "2024-01-15 09:30" and others look like "44197.5".

```r title="Mixed character datetime column"
library(janitor)

raw <- c("2024-01-15 09:30:00", "44562.25", "2024-03-01 18:45:00", "44652.5")
convert_to_datetime(raw)
#> [1] "2024-01-15 09:30:00 UTC" "2022-01-01 06:00:00 UTC"
#> [3] "2024-03-01 18:45:00 UTC" "2022-04-01 12:00:00 UTC"
```

Strings that parse as ISO datetimes become themselves; strings that look numeric get coerced and routed through excel_numeric_to_datetime(). Output is a single POSIXct vector with no manual splitting.

**Use 4: US or European datetime formats.** The default parser only knows ISO. Swap character_fun for mdy_hms or dmy_hms.

```r title="Use mdy_hms parser for US datetimes"
library(janitor)
library(lubridate)

us_stamps <- c("01/15/2024 09:30:00 AM", "02/29/2024 11:45:00 PM")
convert_to_datetime(us_stamps, character_fun = lubridate::mdy_hms)
#> [1] "2024-01-15 09:30:00 UTC" "2024-02-29 23:45:00 UTC"
```

Pass lubridate::dmy_hms for "15/01/2024 09:30:00", or any function that returns a POSIXct. 12-hour AM/PM forms work as long as the AM/PM token is present.

**Use 5: tag a specific time zone.** Excel serials have no tz; the default UTC tag is rarely what local data means.

```r title="Apply a time zone to numeric input"
library(janitor)

convert_to_datetime(c(44197.5, 44562.395833), tz = "America/New_York")
#> [1] "2021-01-01 12:00:00 EST" "2022-01-01 09:30:00 EST"
```

The tz argument labels the POSIXct rather than shifting the clock value. Use this when the spreadsheet was authored in a single locale and downstream filters need to behave correctly.

## Compare with alternatives

**Five other functions produce POSIXct in R, but only convert_to_datetime() handles class dispatch.** Pick it when the input is mixed or unknown.

| Approach | Input type | When to pick it |
|----------|-----------|-----------------|
| `convert_to_datetime(x)` | Mixed character and numeric | Unknown or mixed input columns |
| `excel_numeric_to_datetime(x)` | Numeric Excel serial only | Pure numeric column from Excel |
| `as.POSIXct(x, tz = "UTC")` | ISO datetime character | Already in "YYYY-MM-DD HH:MM:SS" |
| `lubridate::ymd_hms(x)`, `mdy_hms(x)`, `dmy_hms(x)` | Free-form character | Known non-ISO datetime format |
| `as.POSIXct(x, origin = "1970-01-01")` | Unix epoch seconds | Non-Excel numeric timestamps |
| `convert_to_date(x)` | Mixed character and numeric | When time component is not needed |

For interactive work where the column type is unknown, convert_to_datetime() is the safe default. For production code that controls the upstream format, the specific functions document intent better.

[TIP]
**Round-trip through readxl when you can.** If the source is an .xlsx file you control, readxl::read_excel() returns datetime cells as POSIXct directly. Reserve convert_to_datetime() for CSV exports, scraped tables, and anywhere a datetime column may have been re-typed to character or number.

## Common pitfalls

**Three traps recur, each easy to spot once you know what to look for.** All three reflect the dispatch mechanism or the Excel epoch, not bugs in the function.

```r title="Pitfall 1: timezone defaults to UTC"
library(janitor)

convert_to_datetime("2024-07-01 14:00:00")
#> [1] "2024-07-01 14:00:00 UTC"
```

The default parser returns UTC. If data was authored in local time, the clock value is correct but the label lies. Use lubridate::force_tz() to relabel without shifting. Mixing UTC and local timestamps in one vector silently misorders rows.

```r title="Pitfall 2: ambiguous datetime strings with default parser"
library(janitor)

# Default character_fun expects ymd or ymd_HMS; "01/15/2024 09:30" is mdy_hm
try(convert_to_datetime("01/15/2024 09:30"))
#> Warning message:
#> All formats failed to parse. No formats found.
#> [1] NA
```

The default tries only ISO orders. Pass character_fun = lubridate::mdy_hm when strings are US-formatted, or expect NA results.

```r title="Pitfall 3: small fractional values look like serials"
library(janitor)

convert_to_datetime(c(0.5, 1.25, 2.75))
#> [1] "1899-12-30 12:00:00 UTC" "1899-12-31 06:00:00 UTC"
#> [3] "1900-01-01 18:00:00 UTC"
```

Numbers under 10000 produce dates in 1899 or 1900 because the Excel epoch is 1899-12-30. A column of small floats is almost never a timestamp; verify meaning before converting, especially when a "percent done" column rides next to a real serial.

[WARNING]
**Dispatch is decided once per vector.** If you pass a character vector where some entries are numeric strings like "44197.5", every entry routes through character_fun and numeric strings fail unless your parser accepts them. The mixed example above works because parse_date_time tries ymd orders first; stricter parsers may need a class-based split.

## Try it yourself

**Try it:** A CSV import returned a character vector mixing ISO datetimes and fractional Excel serials: `c("2024-01-15 09:30:00", "44562.25", "2024-03-01 18:45:00")`. Convert it with convert_to_datetime() and save the result to ex_stamps. Confirm the class is POSIXct and the second value is "2022-01-01 06:00:00 UTC".

```r title="Your turn: convert a mixed datetime column"
library(janitor)

ex_raw <- c("2024-01-15 09:30:00", "44562.25", "2024-03-01 18:45:00")
ex_stamps <- # your code here

ex_stamps
#> Expected: 2024-01-15 09:30:00 UTC, 2022-01-01 06:00:00 UTC, 2024-03-01 18:45:00 UTC
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
library(janitor)

ex_raw <- c("2024-01-15 09:30:00", "44562.25", "2024-03-01 18:45:00")
ex_stamps <- convert_to_datetime(ex_raw)

ex_stamps
#> [1] "2024-01-15 09:30:00 UTC" "2022-01-01 06:00:00 UTC"
#> [3] "2024-03-01 18:45:00 UTC"

class(ex_stamps)
#> [1] "POSIXct" "POSIXt"

length(ex_stamps)
#> [1] 3
```

**Explanation:** convert_to_datetime() inspects each entry: "2024-01-15 09:30:00" parses as ISO datetime, "44562.25" coerces to numeric and routes through excel_numeric_to_datetime() (0.25 of a day = 06:00:00), "2024-03-01 18:45:00" parses as ISO. Output is a POSIXct vector.

</details>

## Related janitor functions

**janitor groups convert_to_datetime() with five other import-cleanup helpers.** Together they cover the most common spreadsheet date quirks.

- `convert_to_date()` is the Date-only counterpart that drops the time component
- `excel_numeric_to_datetime()` is the numeric-only path that convert_to_datetime() calls under the hood
- `excel_numeric_to_date()` is the Date analogue of excel_numeric_to_datetime()
- `sas_numeric_to_date()` handles SAS serials with a 1960-01-01 origin
- `clean_names()` standardises column names once the datetime column is fixed

For a tour of the full toolkit, see the [janitor Package in R](janitor-Package-in-R.html) tutorial. The official function reference lives at [sfirke.github.io/janitor](https://sfirke.github.io/janitor/reference/convert_to_date.html).

## FAQ

**What is the difference between convert_to_datetime() and convert_to_date()?**

convert_to_date() returns Date and truncates time to midnight. convert_to_datetime() returns POSIXct and preserves time of day from ISO datetime strings and fractional Excel serials. Pick datetime when 09:30 is meaningful; pick date when only the calendar day matters.

**How does convert_to_datetime() interpret fractional Excel serials?**

The integer part is day count from 1899-12-30, the fractional part is share of a 24-hour day after midnight. So 0.5 is 12:00:00, 0.25 is 06:00:00, 0.395833 is 09:30:00. excel_numeric_to_datetime() runs the math; convert_to_datetime() dispatches to it.

**Can convert_to_datetime() parse non-ISO formats like "01/15/2024 09:30 AM"?**

Only if you change the character_fun argument. The default tries ISO 8601 date and ISO datetime orders and fails on US or European formats. Pass character_fun = lubridate::mdy_hms for "01/15/2024 09:30:00", dmy_hms for "15/01/2024 09:30:00", or any function that takes a character vector and returns a POSIXct-compatible result.

**Why does convert_to_datetime() default to UTC?**

Excel serials have no time zone, so the function picks UTC as a neutral default. Clock value comes through correctly; the label may not match source data. Pass tz = "America/New_York" (or any IANA name) to tag the output, or use lubridate::force_tz() afterwards.

**Should I use string_conversion_failure = "warning" in production?**

It depends on tolerance for silent NA. In exploratory work, "warning" lets the pipeline finish and you audit failed rows separately. In production ETL, "error" forces detection of bad data upstream rather than shipping NAs to a dashboard.
