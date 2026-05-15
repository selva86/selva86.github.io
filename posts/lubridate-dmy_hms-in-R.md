---
title: "lubridate dmy_hms() in R: Parse Day-First Datetime Strings"
slug: "lubridate-dmy_hms-in-R"
description: "Use lubridate dmy_hms() to parse day-first datetime strings like '15/01/2024 14:30:00' into POSIXct in R. Covers separators, timezones, vectors, pitfalls."
keywords: "lubridate dmy_hms, dmy_hms R, R parse European datetime, lubridate dmy_hms examples, dmy_hms POSIXct, dmy_hms timezone, dmy_hm R, parse day-first datetime"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "lubridate-functions"
fr_parent: "lubridate-in-R.html"
auto_link_terms: "dmy_hms()|lubridate dmy_hms|lubridate::dmy_hms()|day-first datetime|European datetime"
auto_link_case_sensitive: true
target_keyword: "lubridate dmy_hms"
sibling_block_enabled: true
difficulty: "Beginner"
---

# lubridate dmy_hms() in R: Parse Day-First Datetime Strings

<p class="lead">The <code>dmy_hms()</code> function in lubridate parses day-first datetime strings (like "15/01/2024 14:30:00" or "15 January 2024 14:30:00") into a <code>POSIXct</code> value. It auto-detects separators, defaults to UTC, and accepts an Olson <code>tz</code> argument for any time zone.</p>

[QUICK ANSWER]
dmy_hms("15/01/2024 14:30:00")                              # UK/EU slash, 24h time
dmy_hms("15.01.2024 14:30:00")                              # German period separator
dmy_hms("15-01-2024 14:30:00")                              # dash separator
dmy_hms(c("15/01/2024 09:00:00", "20/02/2024 17:45:10"))    # vector input
dmy_hms("15/01/2024 09:00:00", tz = "Europe/London")        # explicit timezone
dmy_hm("15/01/2024 14:30")                                  # no seconds
dmy_hms(x, truncated = 3)                                   # allow missing H/M/S
parse_date_time(x, orders = c("dmYHMS","dmYHM"))            # multi-format fallback

[DECISION TREE: Is dmy_hms() the right tool?]
- day-first datetime with H:M:S: dmy_hms("15/01/2024 14:30:00")
- day-first datetime, no seconds: dmy_hm("15/01/2024 14:30")
- day-first date only (no time): dmy("15/01/2024")
- year-first ISO datetime: ymd_hms("2024-01-15 14:30:00")
- US month-first datetime: mdy_hms("01/15/2024 14:30:00")
- mixed or unknown orders: parse_date_time(x, orders = c(...))
- Excel datetime serial number: as.POSIXct(x * 86400, origin = "1899-12-30", tz = "UTC")
- strict known format: as.POSIXct(x, format = "%d/%m/%Y %H:%M:%S")

## What dmy_hms() does in one sentence

**`dmy_hms("15/01/2024 14:30:00")` parses the string and returns a POSIXct date-time.** The "d-m-y" prefix tells lubridate the ordering is day, month, year; the "h-m-s" suffix says the input also carries hour, minute, and second. Output is `POSIXct` (a single instant plus a time zone), defaulting to UTC.

Reach for `dmy_hms()` whenever the source data is written day-first. UK government feeds, EU statistical releases, Australian logistics exports, and most non-US enterprise systems format dates this way. Match the parser to the data convention, not the other way around.

## Syntax

**`dmy_hms(x, tz = "UTC", locale = ..., truncated = 0, quiet = FALSE)`. `x` is a character vector or factor.**

```r title="Parse a basic UK datetime"
library(lubridate)

dmy_hms("15/01/2024 14:30:00")
#> [1] "2024-01-15 14:30:00 UTC"

class(dmy_hms("15/01/2024 14:30:00"))
#> [1] "POSIXct" "POSIXt"
```

The return value is `POSIXct`, the same class returned by `Sys.time()`. Every downstream lubridate accessor (`hour()`, `wday()`, `floor_date()`) and every base-R operation (`difftime`, comparison, sorting) works directly on the parsed result.

[TIP]
**Parse the column once, work with POSIXct everywhere.** Convert at the start of the pipeline. Leaving strings in place forces every filter, plot, and join downstream to re-parse, and any inconsistency between consumers becomes a silent bug.

## Five common patterns

### 1. Standard UK/EU slash datetime

```r title="Slash separators, 24-hour time"
dmy_hms("15/01/2024 14:30:00")
#> [1] "2024-01-15 14:30:00 UTC"

dmy_hms("31/12/2024 23:59:45")
#> [1] "2024-12-31 23:59:45 UTC"
```

The default case for UK, Irish, Australian, and most EU data. Output prints ISO-style ("2024-01-15") regardless of the input ordering; the underlying instant is what matters.

### 2. Period separators (German, Swiss, Austrian)

```r title="Parse German-style datetimes"
dmy_hms("15.01.2024 14:30:00")
#> [1] "2024-01-15 14:30:00 UTC"

dmy_hms("15. Januar 2024 14:30:00", locale = "de_DE.UTF-8")
#> [1] "2024-01-15 14:30:00 UTC"
```

German-speaking countries write dates with dots. `dmy_hms()` handles both numeric-dot and text-month variants. Pass a `locale =` argument for non-English month names; the available locales depend on your operating system.

### 3. Vector input with mixed separators

```r title="Parse a column at once"
raw <- c("15/01/2024 09:00:00",
         "20-02-2024 17:45:10",
         "7 March 2024 12:15:00")
dmy_hms(raw)
#> [1] "2024-01-15 09:00:00 UTC" "2024-02-20 17:45:10 UTC"
#> [3] "2024-03-07 12:15:00 UTC"
```

`dmy_hms()` is vectorized. Mixed slashes, dashes, and text months parse correctly inside a single vector, so messy CSV columns rarely need pre-cleaning. The parser tries each candidate format and keeps the one that succeeds.

### 4. European time zone with DST

```r title="Treat the input as local London time"
lon <- dmy_hms("15/06/2024 09:00:00", tz = "Europe/London")
lon
#> [1] "2024-06-15 09:00:00 BST"

with_tz(lon, "UTC")
#> [1] "2024-06-15 08:00:00 UTC"
```

`tz = "Europe/London"` labels the input as local. lubridate honors British Summer Time automatically: a June 15 instant prints as BST (UTC+1), a January 15 instant prints as GMT (UTC+0). `with_tz()` then converts to UTC for storage. List valid zones with `OlsonNames()`; never use ambiguous abbreviations like "BST" or "CET" in the `tz` argument.

### 5. Inside a dplyr pipeline

```r title="Parse and extract components"
library(dplyr)

shipments <- data.frame(
  dispatched_at = c("15/01/2024 09:15:00",
                    "15/01/2024 14:30:00",
                    "16/01/2024 11:00:00"),
  weight_kg     = c(120, 85, 210)
)

shipments |> mutate(
  ts   = dmy_hms(dispatched_at, tz = "Europe/Berlin"),
  hour = hour(ts),
  day  = wday(ts, label = TRUE)
)
#>         dispatched_at weight_kg                  ts hour day
#> 1 15/01/2024 09:15:00       120 2024-01-15 09:15:00    9 Mon
#> 2 15/01/2024 14:30:00        85 2024-01-15 14:30:00   14 Mon
#> 3 16/01/2024 11:00:00       210 2024-01-16 11:00:00   11 Tue
```

After parsing, `hour()`, `wday()`, `floor_date()`, and the rest of lubridate's accessors chain naturally inside `mutate()`. Keep the raw string column in place so any failed row can still be inspected without re-running the import.

[KEY INSIGHT]
**Date ordering encodes a cultural convention; the parser name should match the data, not your locale.** A US analyst processing UK logs still uses `dmy_hms()`; a UK analyst pulling US data still uses `mdy_hms()`. The parser is for the source format, not your reading habits. Choose by inspecting 5 to 10 rows of the actual source, never by where the code runs.

## dmy_hms() vs ymd_hms() vs mdy_hms() vs parse_date_time()

**Pick the parser whose name matches the ordering in the source.**

| Parser | Ordering | Example input | Use when |
|---|---|---|---|
| `dmy_hms()` | Day, month, year | `"15/01/2024 14:30:00"` | UK, EU, AU, IN data |
| `ymd_hms()` | Year, month, day | `"2024-01-15 14:30:00"` | ISO 8601, log files, databases |
| `mdy_hms()` | Month, day, year | `"01/15/2024 14:30:00"` | US data, CRM exports |
| `parse_date_time()` | Multiple | Mixed: tries each `orders=` | Truly mixed or unknown sources |

When two formats co-exist in one column, `parse_date_time(x, orders = c("dmYHMS","ymdHMS"))` tries each ordering in turn and keeps the first that succeeds. For everyday day-first data the dedicated `dmy_hms()` is faster and clearer.

## Common pitfalls

**Pitfall 1: ambiguous dmy versus mdy strings.** `dmy_hms("01/02/2024 09:00:00")` returns February 1; `mdy_hms("01/02/2024 09:00:00")` returns January 2. The same string has two valid readings. Confirm the source convention by sampling 5 to 10 rows (look for any day > 12 to disambiguate) before choosing a parser.

**Pitfall 2: silent UTC default.** Without `tz`, the result is labeled UTC even if the data was captured locally. A 09:00 dispatch record from a Berlin warehouse becomes "09:00 UTC" (which is 10:00 or 11:00 Berlin depending on DST), one or two hours off. Pass `tz = "Europe/Berlin"` whenever the data is local time.

[WARNING]
**DST transitions silently shift hours.** During the spring-forward weekend, "27/03/2024 02:30:00" with `tz = "Europe/London"` is invalid (the clock jumps from 01:00 to 03:00). lubridate returns the nearest valid instant and issues a warning. If your data covers transition weekends, run `sum(is.na(parsed))` and inspect the warnings carefully.

**Pitfall 3: silent NA on parse failure.** A typo, an empty string, or a "N/A" placeholder returns `NA` with a single warning. Always run `sum(is.na(parsed))` after parsing, then inspect `x[is.na(parsed)]` to see the offending rows. Date bugs almost always trace back to a silent NA at the parse step.

## Try it yourself

**Try it:** Parse the strings "01/06/2024 09:30:00", "14/07/2024 12:00:00", and "25/12/2024 23:59:00" with `dmy_hms()`. Save the result to `ex_dt`.

```r title="Your turn: parse UK datetimes"
strings <- c("01/06/2024 09:30:00",
             "14/07/2024 12:00:00",
             "25/12/2024 23:59:00")

ex_dt <- # your code here

ex_dt
#> Expected: three POSIXct values at 09:30, 12:00, 23:59 UTC
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_dt <- dmy_hms(c("01/06/2024 09:30:00",
                   "14/07/2024 12:00:00",
                   "25/12/2024 23:59:00"))
ex_dt
#> [1] "2024-06-01 09:30:00 UTC" "2024-07-14 12:00:00 UTC"
#> [3] "2024-12-25 23:59:00 UTC"
```

**Explanation:** `dmy_hms()` reads the first number as the day. "01/06/2024" becomes June 1 (not January 6), and "14/07/2024" becomes July 14. The same strings parsed with `mdy_hms()` would return different (or invalid) dates.

</details>

## Related lubridate functions

After mastering `dmy_hms()`, the most useful neighbors are:

- `dmy_hm()`, `dmy_h()`: day-first datetimes without seconds or minutes
- `ymd_hms()`, `mdy_hms()`: other date orderings with full time
- `parse_date_time()`: multi-order fallback for genuinely mixed inputs
- `with_tz()`, `force_tz()`: convert versus relabel a time zone
- `hour()`, `minute()`, `second()`, `wday()`: extract components from POSIXct
- `floor_date()`, `ceiling_date()`, `round_date()`: bucket datetimes to day, hour, minute
- `now()`, `today()`: current POSIXct or Date in the session zone

The official function reference lives at [lubridate.tidyverse.org](https://lubridate.tidyverse.org/reference/ymd_hms.html).

## FAQ

**How do I parse "15/01/2024 14:30:00" in R?**

Use `lubridate::dmy_hms("15/01/2024 14:30:00")`. The function returns a `POSIXct` value defaulting to UTC. Pass `tz = "Europe/London"` (or another Olson name) when the data is local time. No `format =` argument is needed; the parser auto-detects separators and accepts slashes, dashes, periods, or text months.

**What is the difference between dmy and dmy_hms?**

`dmy()` returns a `Date` object storing year, month, and day only. `dmy_hms()` returns a `POSIXct` storing a full instant including hour, minute, second, and time zone. Use `dmy()` for calendar dates (birthdays, deadlines) and `dmy_hms()` for events with sub-day resolution like shipments, logs, or appointments.

**How do I parse German dates with periods like 15.01.2024?**

`dmy_hms("15.01.2024 14:30:00")` works directly. lubridate accepts periods, dashes, and slashes as date separators without any extra argument. For German month names (`"15. Januar 2024 14:30:00"`), pass `locale = "de_DE.UTF-8"` so the parser recognizes localized text.

**Why does dmy_hms return NA for a valid-looking string?**

The most common causes are a month-first input misrouted to `dmy_hms()` (`mdy_hms("01/15/2024 14:30:00")` works; `dmy_hms()` returns NA because day 15 is fine but month 15 is not), an unsupported separator, or a non-Olson timezone abbreviation in `tz`. Run `dmy_hms(x, quiet = FALSE)` to see the warning, then sanity-check against `OlsonNames()` or fall back to `parse_date_time(x, orders = c("dmYHMS","ymdHMS"))`.

**How do I convert dmy_hms output to a different time zone?**

After parsing, use `with_tz(parsed, "America/New_York")` to convert the same instant to another zone (the moment in time does not change, only the displayed clock). Use `force_tz(parsed, "America/New_York")` to relabel without converting (the displayed clock does not change, the underlying instant shifts). The two functions answer different questions; pick deliberately.
