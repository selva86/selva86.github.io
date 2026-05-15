---
title: "lubridate mdy_hms() in R: Parse US Datetime Strings"
slug: "lubridate-mdy_hms-in-R"
description: "Use lubridate mdy_hms() to parse month-first datetime strings like '01/15/2024 14:30:00' into POSIXct in R. Covers AM/PM, timezones, vectors, pitfalls."
keywords: "lubridate mdy_hms, mdy_hms R, R parse US datetime, lubridate mdy_hms examples, mdy_hms POSIXct, mdy_hms timezone, mdy_hm R, parse month-first datetime"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "lubridate-functions"
fr_parent: "lubridate-in-R.html"
auto_link_terms: "mdy_hms()|lubridate mdy_hms|lubridate::mdy_hms()|month-first datetime|US datetime"
auto_link_case_sensitive: true
target_keyword: "lubridate mdy_hms"
sibling_block_enabled: true
difficulty: "Beginner"
---

# lubridate mdy_hms() in R: Parse US Datetime Strings

<p class="lead">The <code>mdy_hms()</code> function in lubridate parses month-first datetime strings (like "01/15/2024 14:30:00" or "January 15, 2024 2:30:00 PM") into a <code>POSIXct</code> value. It auto-detects separators, defaults to UTC, and accepts an Olson <code>tz</code> argument for any time zone.</p>

[QUICK ANSWER]
mdy_hms("01/15/2024 14:30:00")                              # US slash, 24h time
mdy_hms("January 15, 2024 2:30:00 PM")                      # 12h with AM/PM
mdy_hms("01-15-2024 14:30:00")                              # dash separator
mdy_hms(c("01/15/2024 09:00:00", "02/20/2024 17:45:10"))    # vector input
mdy_hms("01/15/2024 09:00:00", tz = "America/Chicago")      # explicit timezone
mdy_hm("01/15/2024 14:30")                                  # no seconds
mdy_hms(x, truncated = 3)                                   # allow missing H/M/S
parse_date_time(x, orders = c("mdYHMS","mdYHM"))            # multi-format fallback

[DECISION TREE: Is mdy_hms() the right tool?]
- US month-first datetime with H:M:S: mdy_hms("01/15/2024 14:30:00")
- month-first datetime, no seconds: mdy_hm("01/15/2024 14:30")
- month-first date only (no time): mdy("01/15/2024")
- year-first ISO datetime: ymd_hms("2024-01-15 14:30:00")
- European day-first datetime: dmy_hms("15-01-2024 14:30:00")
- mixed or unknown orders: parse_date_time(x, orders = c(...))
- Excel datetime serial number: as.POSIXct(x * 86400, origin = "1899-12-30", tz = "UTC")
- strict known format: as.POSIXct(x, format = "%m/%d/%Y %H:%M:%S")

## What mdy_hms() does in one sentence

**`mdy_hms("01/15/2024 14:30:00")` parses the string and returns a POSIXct date-time.** The "m-d-y" prefix tells lubridate the ordering is month, day, year; the "h-m-s" suffix says the input also carries hour, minute, and second. Output is `POSIXct` (a single instant plus a time zone), defaulting to UTC.

Use `mdy_hms()` when the source data writes dates US-style. Spreadsheets, CRM exports, US healthcare records, and many government feeds default to month-first. Pair the parser with the data convention; do not reformat the strings first.

## Syntax

**`mdy_hms(x, tz = "UTC", locale = ..., truncated = 0, quiet = FALSE)`. `x` is a character vector or factor.**

```r title="Parse a basic US datetime"
library(lubridate)

mdy_hms("01/15/2024 14:30:00")
#> [1] "2024-01-15 14:30:00 UTC"

class(mdy_hms("01/15/2024 14:30:00"))
#> [1] "POSIXct" "POSIXt"
```

The return value is `POSIXct`, the same class returned by `Sys.time()`. Every downstream lubridate accessor (`hour()`, `minute()`, `floor_date()`) and every base-R operation (`difftime`, comparison, sorting) works directly on the parsed result.

[TIP]
**Parse once, work with POSIXct everywhere.** Convert the column at the start of your pipeline. Leaving strings in place forces every plot, filter, and join downstream to re-parse, and any inconsistency between consumers becomes a silent bug.

## Five common patterns

### 1. Standard US slash datetime

```r title="Slash separators, 24-hour time"
mdy_hms("01/15/2024 14:30:00")
#> [1] "2024-01-15 14:30:00 UTC"

mdy_hms("01/15/2024 14:30:45")
#> [1] "2024-01-15 14:30:45 UTC"
```

The most common case for US data. Output prints ISO-style ("2024-01-15") regardless of the input ordering; the underlying instant is what matters.

### 2. 12-hour clock with AM/PM

```r title="Parse PM time correctly"
mdy_hms("January 15, 2024 2:30:00 PM")
#> [1] "2024-01-15 14:30:00 UTC"

mdy_hms("01/15/2024 02:30:00 AM")
#> [1] "2024-01-15 02:30:00 UTC"

mdy_hms("01/15/2024 12:00:00 PM")
#> [1] "2024-01-15 12:00:00 UTC"
```

lubridate recognizes "AM" and "PM" tokens and shifts the hour accordingly. Noon parses as 12:00, midnight as 00:00. US-sourced logs and emails frequently use this format; do not hand-convert to 24-hour first.

### 3. Vector input with mixed separators

```r title="Parse a column at once"
raw <- c("01/15/2024 09:00:00",
         "02-20-2024 17:45:10",
         "March 7 2024 12:15:00")
mdy_hms(raw)
#> [1] "2024-01-15 09:00:00 UTC" "2024-02-20 17:45:10 UTC"
#> [3] "2024-03-07 12:15:00 UTC"
```

`mdy_hms()` is vectorized. Mixed slashes, dashes, and text months parse correctly inside a single vector, so messy CSV columns rarely need pre-cleaning.

### 4. Explicit US time zone

```r title="Treat the input as local Central time"
chi <- mdy_hms("01/15/2024 09:00:00", tz = "America/Chicago")
chi
#> [1] "2024-01-15 09:00:00 CST"

with_tz(chi, "UTC")
#> [1] "2024-01-15 15:00:00 UTC"
```

`tz = "America/Chicago"` labels the input as Central time. `with_tz()` then converts the same instant to UTC for storage or comparison. List valid zones with `OlsonNames()`; never use ambiguous abbreviations like `"CST"`.

### 5. Inside a dplyr pipeline

```r title="Parse and extract components"
library(dplyr)

orders <- data.frame(
  placed_at = c("01/15/2024 09:15:00",
                "01/15/2024 14:30:00",
                "01/16/2024 11:00:00"),
  amount    = c(120, 85, 210)
)

orders |> mutate(
  ts   = mdy_hms(placed_at, tz = "America/Chicago"),
  hour = hour(ts),
  day  = wday(ts, label = TRUE)
)
#>             placed_at amount                  ts hour day
#> 1 01/15/2024 09:15:00    120 2024-01-15 09:15:00    9 Mon
#> 2 01/15/2024 14:30:00     85 2024-01-15 14:30:00   14 Mon
#> 3 01/16/2024 11:00:00    210 2024-01-16 11:00:00   11 Tue
```

After parsing, `hour()`, `wday()`, `floor_date()`, and the rest of lubridate's accessors chain naturally inside `mutate()`. The raw string column stays in place so any failed row can still be inspected.

[KEY INSIGHT]
**The parser name encodes ordering; the suffix encodes resolution.** `mdy()` returns a `Date` (no time). `mdy_hms()` returns a `POSIXct` (full instant). The two are not interchangeable: a `Date` cannot represent 14:30, and a `POSIXct` carries a time zone that a `Date` ignores. Pick the resolution your downstream code expects.

## mdy_hms() vs ymd_hms() vs dmy_hms() vs parse_date_time()

**Pick the parser whose name matches the ordering in the source.**

| Parser | Ordering | Example input | Use when |
|---|---|---|---|
| `mdy_hms()` | Month, day, year | `"01/15/2024 14:30:00"` | US data, CRM exports, spreadsheets |
| `ymd_hms()` | Year, month, day | `"2024-01-15 14:30:00"` | ISO 8601, log files, databases |
| `dmy_hms()` | Day, month, year | `"15/01/2024 14:30:00"` | UK, EU, Australian data |
| `parse_date_time()` | Multiple | Mixed: tries each `orders=` | Truly mixed or unknown sources |

When two formats co-exist in one column, `parse_date_time(x, orders = c("mdYHMS","ymdHMS"))` tries each ordering in turn and keeps the first that succeeds. For everyday US data the dedicated `mdy_hms()` is faster and clearer.

## Common pitfalls

**Pitfall 1: ambiguous mdy versus dmy strings.** `mdy_hms("01/02/2024 09:00:00")` returns January 2; `dmy_hms("01/02/2024 09:00:00")` returns February 1. The same string has two valid readings. Confirm the source convention by sampling 5 to 10 rows before choosing a parser.

**Pitfall 2: silent UTC default.** Without `tz`, the result is labeled UTC even if the data was captured locally. A 09:00 sales record from a Chicago store becomes "09:00 UTC" (which is 03:00 Central), six hours off. Pass `tz = "America/Chicago"` whenever the data is local.

[WARNING]
**Two-digit years still parse.** `mdy_hms("01/15/24 14:30:00")` returns 2024. lubridate applies a 30/70 cutoff: "00" to "68" maps to the 2000s, "69" to "99" maps to the 1900s. If your data spans that boundary (rare but possible in legacy archives), prepend the century manually before parsing.

**Pitfall 3: silent NA on parse failure.** A typo, an empty string, or a "N/A" placeholder returns `NA` with a single warning. Always run `sum(is.na(parsed))` after parsing, then inspect `x[is.na(parsed)]` to see the offending rows. Date bugs almost always trace back to a silent NA at the parse step.

## Try it yourself

**Try it:** Parse the strings "06/15/2024 9:30 AM", "07/04/2024 12:00 PM", and "12/25/2024 11:59 PM" with `mdy_hms()`. Save the result to `ex_dt`.

```r title="Your turn: parse US AM/PM datetimes"
strings <- c("06/15/2024 9:30 AM",
             "07/04/2024 12:00 PM",
             "12/25/2024 11:59 PM")

ex_dt <- # your code here

ex_dt
#> Expected: three POSIXct values at 09:30, 12:00, 23:59 UTC
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_dt <- mdy_hms(c("06/15/2024 9:30 AM",
                   "07/04/2024 12:00 PM",
                   "12/25/2024 11:59 PM"))
ex_dt
#> [1] "2024-06-15 09:30:00 UTC" "2024-07-04 12:00:00 UTC"
#> [3] "2024-12-25 23:59:00 UTC"
```

**Explanation:** `mdy_hms()` recognizes the AM/PM tokens and shifts the hour accordingly. "12:00 PM" stays at 12:00 (noon), and "11:59 PM" becomes 23:59. No `format =` string is needed.

</details>

## Related lubridate functions

After mastering `mdy_hms()`, the most useful neighbors are:

- `mdy_hm()`, `mdy_h()`: month-first datetimes without seconds or minutes
- `ymd_hms()`, `dmy_hms()`: other date orderings with full time
- `parse_date_time()`: multi-order fallback for genuinely mixed inputs
- `with_tz()`, `force_tz()`: convert versus relabel a time zone
- `hour()`, `minute()`, `second()`, `wday()`: extract components from POSIXct
- `floor_date()`, `ceiling_date()`, `round_date()`: bucket datetimes to day, hour, minute
- `now()`, `today()`: current POSIXct or Date in the session zone

The official function reference lives at [lubridate.tidyverse.org](https://lubridate.tidyverse.org/reference/ymd_hms.html).

## FAQ

**How do I parse "01/15/2024 14:30:00" in R?**

Use `lubridate::mdy_hms("01/15/2024 14:30:00")`. The function returns a `POSIXct` value defaulting to UTC. Pass `tz = "America/Chicago"` (or another Olson name) when the data is local time. No `format =` argument is needed; the parser auto-detects separators.

**What is the difference between mdy and mdy_hms?**

`mdy()` returns a `Date` object that stores year, month, and day only. `mdy_hms()` returns a `POSIXct` that stores a full instant including hour, minute, second, and time zone. Use `mdy()` for calendar dates and `mdy_hms()` for events with sub-day resolution like orders, logs, or appointments.

**How do I handle AM/PM with mdy_hms?**

`mdy_hms()` recognizes "AM" and "PM" tokens automatically. `mdy_hms("01/15/2024 2:30:00 PM")` parses to 14:30 in the result. Noon ("12:00 PM") stays at 12:00 and midnight ("12:00 AM") becomes 00:00. Do not hand-convert to 24-hour time before parsing.

**Why does mdy_hms return NA for a valid-looking string?**

The most common causes are an unsupported separator, a non-Olson timezone abbreviation in `tz`, or a day-first input misrouted to `mdy_hms()`. Run `mdy_hms(x, quiet = FALSE)` to see the warning, then sanity-check against `OlsonNames()` or fall back to `parse_date_time(x, orders = c("mdYHMS","dmYHMS","ymdHMS"))`.

**How do I convert mdy_hms output to a different time zone?**

After parsing, use `with_tz(parsed, "Europe/London")` to convert the same instant to another zone (the moment in time does not change, only the displayed clock). Use `force_tz(parsed, "Europe/London")` to relabel without converting (the displayed clock does not change, the underlying instant shifts). The two functions answer different questions; pick deliberately.
