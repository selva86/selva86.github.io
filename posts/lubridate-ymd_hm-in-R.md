---
title: "lubridate ymd_hm() in R: Parse Date-Times Without Seconds"
slug: "lubridate-ymd_hm-in-R"
description: "Use lubridate ymd_hm() to parse year-month-day hour-minute strings into POSIXct in R. Covers timezones, truncated input, vectors, ymd_hms vs ymd_hm, DST."
keywords: "lubridate ymd_hm, ymd_hm R, R parse datetime no seconds, lubridate POSIXct, ymd_hm timezone, ymd_hm vs ymd_hms, parse_date_time minutes, ymd_h"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "lubridate-functions"
fr_parent: "lubridate-in-R.html"
auto_link_terms: "ymd_hm()|lubridate ymd_hm|lubridate::ymd_hm()|year-month-day hour-minute|parse datetime without seconds"
auto_link_case_sensitive: true
target_keyword: "lubridate ymd_hm"
sibling_block_enabled: true
difficulty: "Beginner"
---

# lubridate ymd_hm() in R: Parse Date-Times Without Seconds

<p class="lead">The <code>ymd_hm()</code> function in lubridate parses year-month-day hour-minute strings (no seconds) into a <code>POSIXct</code> date-time. It defaults to UTC, auto-detects separators, and treats the seconds field as zero.</p>

[QUICK ANSWER]
ymd_hm("2024-01-15 14:30")                       # basic parse, returns POSIXct (UTC)
ymd_hm("2024-01-15T14:30")                       # ISO 8601 separator
ymd_hm("202401151430")                           # no separators
ymd_hm("2024/01/15 14:30", tz = "Asia/Kolkata")  # custom timezone
ymd_hm(x, truncated = 1)                         # allow missing minutes
ymd_hm(c("2024-01-15 14:30", "2024-01-15 15:00"))# vectorized
ymd_hm("2024-01-15 14:30", quiet = TRUE)         # suppress warnings
parse_date_time(x, orders = c("ymdHM", "ymdHMS"))# mixed precision

[DECISION TREE: Is ymd_hm() the right tool?]
- year-first datetime, no seconds: ymd_hm("2024-01-15 14:30")
- year-first datetime with seconds: ymd_hms("2024-01-15 14:30:00")
- year-first datetime, hour only: ymd_h("2024-01-15 14")
- date only (no time at all): ymd("2024-01-15")
- month-first datetime, no seconds: mdy_hm("01/15/2024 14:30")
- day-first datetime, no seconds: dmy_hm("15-01-2024 14:30")
- mixed precision in one vector: parse_date_time(x, orders = c("ymdHM","ymdHMS"))
- strict known format: as.POSIXct(x, format = "%Y-%m-%d %H:%M")

## What ymd_hm() does in one sentence

**`ymd_hm("2024-01-15 14:30")` parses the string and returns a POSIXct at second `00`.** The function is one of lubridate's nine fixed-order parsers. The first three letters (`ymd`) name the date order; the trailing `hm` says the time has hours and minutes but no seconds.

Use `ymd_hm()` when your data records minute-level precision: meeting times, shift schedules, log lines that report `HH:MM`, survey timestamps. For anything finer, use `ymd_hms()`; for anything coarser, use `ymd_h()` or `ymd()`.

## Syntax

**`ymd_hm(x, tz = "UTC", locale = ..., truncated = 0, quiet = FALSE)`.** `x` is a character vector or factor of date-time strings.

```r title="Parse a basic minute-precision datetime"
library(lubridate)

ymd_hm("2024-01-15 14:30")
#> [1] "2024-01-15 14:30:00 UTC"

class(ymd_hm("2024-01-15 14:30"))
#> [1] "POSIXct" "POSIXt"
```

The return type is `POSIXct`, identical to what `ymd_hms()` returns. Internally lubridate stores the moment as seconds since 1970-01-01 UTC, then prints it according to the active time zone. The seconds component is always `00` after a `ymd_hm()` parse.

[TIP]
**Pass a `tz` argument when the source is local time.** `ymd_hm("2024-01-15 14:30", tz = "America/Chicago")` labels the input as Central. Without `tz`, lubridate assumes UTC and your downstream conversions will be off by the UTC offset.

## Five common patterns

### 1. Standard minute-precision parse

```r title="Parse common minute-precision formats"
ymd_hm("2024-01-15 14:30")
#> [1] "2024-01-15 14:30:00 UTC"

ymd_hm("2024-01-15T14:30")
#> [1] "2024-01-15 14:30:00 UTC"

ymd_hm("2024/01/15 14:30")
#> [1] "2024-01-15 14:30:00 UTC"
```

The space, the ISO 8601 `T`, and a slash-separated date all parse to the same instant. `ymd_hm()` looks for any non-digit run as a separator and ignores it.

### 2. Explicit time zone

```r title="Label input as Chicago, then convert"
ct <- ymd_hm("2024-01-15 14:30", tz = "America/Chicago")
ct
#> [1] "2024-01-15 14:30:00 CST"

with_tz(ct, "UTC")
#> [1] "2024-01-15 20:30:00 UTC"
```

The `tz` argument names the input. `with_tz()` then converts the stored instant for display in another zone. Run `OlsonNames()` to see the full list of valid zones on your system.

### 3. Truncated input with `truncated=`

```r title="Mixed completeness in one vector"
times <- c("2024-01-15 14:30", "2024-01-15 14", "2024-01-15")
ymd_hm(times, truncated = 2)
#> [1] "2024-01-15 14:30:00 UTC" "2024-01-15 14:00:00 UTC"
#> [3] "2024-01-15 00:00:00 UTC"
```

`truncated = 2` allows up to two trailing components (M, then H) to be missing. Empty pieces become zero. This avoids dispatching between `ymd_hm`, `ymd_h`, and `ymd` when your data is inconsistent.

### 4. Vectorized over a data frame column

```r title="Parse a column of meeting times"
library(dplyr)
schedule <- data.frame(
  slot = c("2024-01-15 09:00",
           "2024-01-15 10:30",
           "2024-01-15 11:00")
)
schedule |> mutate(slot = ymd_hm(slot), hr = hour(slot))
#>                  slot hr
#> 1 2024-01-15 09:00:00  9
#> 2 2024-01-15 10:30:00 10
#> 3 2024-01-15 11:00:00 11
```

`ymd_hm()` is fully vectorized, so it slots into `mutate()` without `purrr::map()`. After parsing, `hour()`, `minute()`, `floor_date()`, and arithmetic with `minutes(15)` all chain naturally.

### 5. Suppressing parse warnings

```r title="Quiet mode for noisy data pipelines"
ymd_hm(c("2024-01-15 14:30", "garbage"), quiet = TRUE)
#> [1] "2024-01-15 14:30:00 UTC" NA
```

Set `quiet = TRUE` when bad rows are expected and you handle `NA` downstream. Without it, lubridate emits a warning per unparseable string, which can flood logs in batch jobs.

[KEY INSIGHT]
**Minute precision is enough for most operational data.** Calendar events, shift rosters, survey responses, and scraped HTML rarely record seconds. Reach for `ymd_hms()` only when the seconds field is meaningful (log analysis, instrumentation, financial ticks). Picking the right parser keeps your data type honest about its resolution.

## ymd_hm() vs ymd_hms() vs ymd_h()

**Three sibling parsers for the same date order, different time precision.**

| Function | Time precision | Trailing fields filled as | Best for |
|---|---|---|---|
| `ymd_hms()` | hour, minute, second | none | logs, instrumentation, ISO 8601 timestamps |
| `ymd_hm()` | hour, minute | second = 00 | meetings, schedules, surveys |
| `ymd_h()` | hour only | minute = 00, second = 00 | hourly batches, weather data |

All three return `POSIXct`, so downstream code (`hour()`, `floor_date()`, arithmetic) is identical. The only difference is what the parser expects to find. Passing a string with too many components fails, which is sometimes useful as a sanity check.

[NOTE]
**`parse_date_time()` covers mixed precision.** When one column holds `2024-01-15 14:30` and `2024-01-15 14:30:45` side by side, `parse_date_time(x, orders = c("ymdHM", "ymdHMS"))` parses each row with the right specification. Faster to write than dispatching by string length.

## Common pitfalls

**Pitfall 1: seconds in the input string.** `ymd_hm("2024-01-15 14:30:45")` parses as `2024-01-15 14:30:00 UTC` and emits a warning. The `:45` is discarded. If your data sometimes has seconds, use `ymd_hms()` or `parse_date_time()`; do not rely on `ymd_hm()` to truncate cleanly.

**Pitfall 2: silent UTC default.** Like all lubridate parsers, `ymd_hm()` returns UTC unless you pass `tz`. Downstream filters like `between(ts, ymd_hm("2024-01-15 09:00"), ymd_hm("2024-01-15 17:00"))` then run on UTC bounds, which is rarely what you want for "business hours". Pass `tz` once, at parse time.

[WARNING]
**Daylight-saving gaps return `NA`.** `ymd_hm("2024-03-10 02:30", tz = "America/New_York")` is `NA` because 02:30 was skipped during spring-forward. The function does not push the time forward or roll back; you get `NA` and a warning. Handle these by shifting to UTC before parsing, or filtering known DST dates.

**Pitfall 3: factors with stale levels.** `ymd_hm()` accepts factors but converts via `as.character()`. Only the level strings matter, so a reordered factor still parses correctly; the integer codes are ignored.

## Try it yourself

**Try it:** Parse the strings `"2024-06-15 09:00"`, `"2024-06-15 09"`, and `"2024-06-15"` as one vector. Save the result to `ex_dt`.

```r title="Your turn: parse mixed completeness"
strings <- c("2024-06-15 09:00", "2024-06-15 09", "2024-06-15")

ex_dt <- # your code here

ex_dt
#> Expected: three POSIXct values, midnight where time is missing
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_dt <- ymd_hm(c("2024-06-15 09:00", "2024-06-15 09", "2024-06-15"),
                truncated = 2)
ex_dt
#> [1] "2024-06-15 09:00:00 UTC" "2024-06-15 09:00:00 UTC"
#> [3] "2024-06-15 00:00:00 UTC"
```

**Explanation:** `truncated = 2` lets `ymd_hm()` accept inputs missing up to two trailing components (M, then H). Missing pieces default to zero, so the date-only string parses as midnight UTC.

</details>

## Related lubridate functions

After mastering `ymd_hm()`, look at:

- `ymd_hms()`, `ymd_h()`: sibling parsers with different time precision
- `mdy_hm()`, `dmy_hm()`: other date orderings, minute precision
- `parse_date_time()`: try multiple orders in one call
- `with_tz()`, `force_tz()`: convert versus relabel a time zone
- `hour()`, `minute()`: extract components from POSIXct
- `floor_date()`, `ceiling_date()`: bucket datetimes to a unit
- `now()`: current POSIXct in the session zone

For a tour of the lubridate family overall, see the [lubridate package guide](lubridate-in-R.html). The official function reference is at [lubridate.tidyverse.org](https://lubridate.tidyverse.org/reference/ymd_hms.html).

## FAQ

**What does ymd_hm do in R?**

`ymd_hm()` from the lubridate package parses a character string in year-month-day hour-minute order into a `POSIXct` date-time. The seconds field is set to zero. The default time zone is UTC; pass `tz = "Olson/Zone"` to label the input as local time. Use it for minute-precision data like meeting times, shift schedules, and survey timestamps.

**What is the difference between ymd_hm and ymd_hms?**

`ymd_hm()` expects hours and minutes only; `ymd_hms()` expects hours, minutes, and seconds. Both return `POSIXct`, but feeding a seconds-containing string to `ymd_hm()` discards the seconds and emits a warning. If your data has mixed precision, use `parse_date_time(x, orders = c("ymdHM", "ymdHMS"))` so each row parses with the correct specification.

**How do I parse a datetime without seconds in R?**

Call `lubridate::ymd_hm("2024-01-15 14:30")`. For non-year-first inputs use `mdy_hm()` (US month-first) or `dmy_hm()` (European day-first). All three accept a `tz` argument, are vectorized over character vectors, and return `POSIXct`. The `truncated` argument lets you accept partial inputs in the same call.

**How do I handle timezones with ymd_hm?**

Pass `tz = "Olson/Zone"` at parse time, for example `ymd_hm("2024-01-15 14:30", tz = "Europe/London")`. To convert an already-parsed `POSIXct` to a different zone, use `with_tz()`. To relabel without converting (when the original zone was wrong), use `force_tz()`. Prefer Olson names like `"America/Los_Angeles"` over abbreviations like `"PST"`, which are ambiguous.

**Why does ymd_hm return NA for a string I think is valid?**

The three most common causes are a daylight-saving gap (the time was skipped that day), seconds present in the input (try `ymd_hms()`), or a non-standard separator. Run the call with `quiet = FALSE` to see the warning text, and check the time zone against `OlsonNames()`. For chaotic inputs use `parse_date_time` with explicit `orders`.
