---
title: "lubridate ymd_hms() in R: Parse Date-Times From Strings"
slug: "lubridate-ymd_hms-in-R"
description: "Use lubridate ymd_hms() to parse year-month-day hour-minute-second strings into POSIXct in R. Covers timezones, partial times, DST, parse_date_time, examples."
keywords: "lubridate ymd_hms, ymd_hms R, R parse datetime, lubridate POSIXct, ymd_hms timezone, ymd_hm ymd_h, parse_date_time, R datetime string"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "lubridate-functions"
fr_parent: "lubridate-in-R.html"
auto_link_terms: "ymd_hms()|lubridate ymd_hms|lubridate::ymd_hms()|parse datetime|datetime string"
auto_link_case_sensitive: true
target_keyword: "lubridate ymd_hms"
sibling_block_enabled: true
difficulty: "Beginner"
---

# lubridate ymd_hms() in R: Parse Date-Times From Strings

<p class="lead">The <code>ymd_hms()</code> function in lubridate parses year-month-day hour-minute-second strings into a <code>POSIXct</code> date-time. It auto-detects separators, defaults to UTC, and accepts an explicit <code>tz</code> argument for any Olson time zone.</p>

[QUICK ANSWER]
ymd_hms("2024-01-15 14:30:00")                      # basic parse, returns POSIXct (UTC)
ymd_hms("2024-01-15T14:30:00Z")                     # ISO 8601 with Z suffix
ymd_hms("20240115143000")                           # no separators
ymd_hms("2024/01/15 14:30:00", tz = "Asia/Kolkata") # custom timezone
ymd_hm("2024-01-15 14:30")                          # no seconds
ymd_h("2024-01-15 14")                              # hour only
ymd_hms(x, truncated = 3)                           # allow missing H/M/S
parse_date_time(x, orders = c("ymdHMS","mdYHM"))    # mixed orders

[DECISION TREE: Is ymd_hms() the right tool?]
- year-first datetime with full H:M:S: ymd_hms("2024-01-15 14:30:00")
- year-first datetime, no seconds: ymd_hm("2024-01-15 14:30")
- date only (no time): ymd("2024-01-15")
- month-first datetime (US): mdy_hms("01/15/2024 14:30:00")
- day-first datetime (EU): dmy_hms("15-01-2024 14:30:00")
- mixed or unknown orders: parse_date_time(x, orders = c(...))
- Unix epoch seconds: as.POSIXct(x, origin = "1970-01-01", tz = "UTC")
- strict format with control: as.POSIXct(x, format = "%Y-%m-%d %H:%M:%S")

## What ymd_hms() does in one sentence

**`ymd_hms("2024-01-15 14:30:00")` parses the string and returns a POSIXct date-time.** Unlike `ymd()`, which returns a `Date` (no time), `ymd_hms()` returns `POSIXct` (a date plus a time-of-day plus a time zone). The default zone is UTC.

The function is forgiving about separators and padding. `"2024-01-15 14:30:00"`, `"2024/01/15T14:30:00"`, and `"20240115 143000"` all parse to the same instant.

## Syntax

**`ymd_hms(x, tz = "UTC", locale = ..., truncated = 0, quiet = FALSE)`.** `x` is a character vector or factor.

```r title="Parse a basic datetime"
library(lubridate)

ymd_hms("2024-01-15 14:30:00")
#> [1] "2024-01-15 14:30:00 UTC"

class(ymd_hms("2024-01-15 14:30:00"))
#> [1] "POSIXct" "POSIXt"
```

The return type is the key contrast with `ymd()`. `POSIXct` stores an instant as seconds since 1970-01-01 UTC; `Date` stores a count of days. You need `POSIXct` whenever the time component matters: log analysis, event scheduling, duration arithmetic at sub-day resolution.

[TIP]
**The `tz` argument is parsed as a label, not converted.** `ymd_hms("2024-01-15 14:30:00", tz = "America/New_York")` interprets "14:30" as Eastern time. It does NOT shift a UTC time into Eastern. To convert an existing POSIXct, use `with_tz()` instead.

## Five common patterns

### 1. Basic datetime parse

```r title="Standard ISO 8601 input"
ymd_hms("2024-01-15 14:30:00")
#> [1] "2024-01-15 14:30:00 UTC"

ymd_hms("2024-01-15T14:30:00Z")
#> [1] "2024-01-15 14:30:00 UTC"
```

The `T` separator and trailing `Z` (Zulu = UTC) are both recognized. ISO 8601 is the most portable datetime format and `ymd_hms()` handles it without configuration.

### 2. Explicit time zone

```r title="Parse as Eastern time, then convert"
ny <- ymd_hms("2024-01-15 14:30:00", tz = "America/New_York")
ny
#> [1] "2024-01-15 14:30:00 EST"

with_tz(ny, "UTC")
#> [1] "2024-01-15 19:30:00 UTC"
```

`tz = "America/New_York"` labels the input as Eastern. `with_tz()` then converts the same instant to UTC for storage. List valid zones with `OlsonNames()`.

### 3. Partial times with ymd_hm() and ymd_h()

```r title="When seconds or minutes are absent"
ymd_hm("2024-01-15 14:30")
#> [1] "2024-01-15 14:30:00 UTC"

ymd_h("2024-01-15 14")
#> [1] "2024-01-15 14:00:00 UTC"
```

Each variant fills missing components with zero. Pick the one that matches your data; do not mix variants in a single vector (use `parse_date_time` for that).

### 4. Truncated input via truncated=

```r title="Allow missing H, M, S in a single call"
times <- c("2024-01-15 14:30:00", "2024-01-15 14:30", "2024-01-15")
ymd_hms(times, truncated = 3)
#> [1] "2024-01-15 14:30:00 UTC" "2024-01-15 14:30:00 UTC"
#> [3] "2024-01-15 00:00:00 UTC"
```

`truncated = 3` tells `ymd_hms()` it is OK if up to 3 trailing components (S, then M, then H) are missing. Missing pieces become zero. This is the single-call alternative to dispatching between `ymd_hms`, `ymd_hm`, and `ymd`.

### 5. Vectorized over a column

```r title="Parse a column of datetime strings"
library(dplyr)
events <- data.frame(
  ts = c("2024-01-15 14:30:00",
         "2024-01-15 15:45:10",
         "2024-01-15 16:00:00")
)
events |> mutate(ts = ymd_hms(ts), hour = hour(ts))
#>                    ts hour
#> 1 2024-01-15 14:30:00   14
#> 2 2024-01-15 15:45:10   15
#> 3 2024-01-15 16:00:00   16
```

`ymd_hms()` is fully vectorized. After parsing, `hour()`, `minute()`, `second()`, `floor_date()` all chain naturally inside `mutate()`.

[KEY INSIGHT]
**Storage versus display.** A POSIXct stores one absolute instant. The printed string depends on the active time zone (the object's `tzone` attribute or the session's `Sys.timezone()`). Two POSIXct values can print differently but represent the same moment. Always reason about the stored instant first, the displayed string second.

## ymd_hms() vs as.POSIXct() vs strptime() vs anytime

**Four datetime parsers with different trade-offs.**

| Function | Package | Format detection | Default tz | Best for |
|---|---|---|---|---|
| `ymd_hms()` | lubridate | Auto, year-first | UTC | Most cases, ISO-like input |
| `as.POSIXct()` | base R | Manual `format=` | `Sys.timezone()` | Strict format, no dependency |
| `strptime()` | base R | Manual format | `Sys.timezone()` | Returns POSIXlt (component access) |
| `anytime::anytime()` | anytime | Auto, very loose | `Sys.timezone()` | Truly chaotic mixed inputs |

For everyday work, `ymd_hms()` is the default. Switch to base R when reproducibility across environments matters and you want a strict format. The session-default `tz` in base R is a frequent source of surprises; lubridate's UTC default is more predictable.

## Common pitfalls

**Pitfall 1: silent UTC default.** `ymd_hms("2024-01-15 14:30:00")` returns "14:30 UTC" even if your data was recorded locally. If the source is local, pass `tz = "..."` explicitly or you will be off by hours.

**Pitfall 2: DST gap and overlap.** During spring-forward, an hour does not exist. `ymd_hms("2024-03-10 02:30:00", tz = "America/New_York")` returns `NA` because 02:30 was skipped. During fall-back, 01:30 occurs twice and lubridate picks the first (pre-shift) instance.

[WARNING]
**Time zone abbreviations are ambiguous.** `tz = "EST"` is not portable, since "EST" can mean US Eastern Standard or Australian Eastern Standard depending on the system. Always use Olson zones like `"America/New_York"` or `"Australia/Sydney"`.

**Pitfall 3: factor inputs.** `ymd_hms()` accepts factors but converts to character first. If your factor levels are out of order, the underlying integer codes are irrelevant; only the level strings matter.

## Try it yourself

**Try it:** Parse the strings "2024-06-15 09:00:00", "2024-06-15 09:00", and "2024-06-15" as one vector. Save the result to `ex_dt`.

```r title="Your turn: parse mixed-completeness datetimes"
strings <- c("2024-06-15 09:00:00", "2024-06-15 09:00", "2024-06-15")

ex_dt <- # your code here

ex_dt
#> Expected: three POSIXct values, missing parts filled with zero
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_dt <- ymd_hms(c("2024-06-15 09:00:00", "2024-06-15 09:00", "2024-06-15"),
                 truncated = 3)
ex_dt
#> [1] "2024-06-15 09:00:00 UTC" "2024-06-15 09:00:00 UTC"
#> [3] "2024-06-15 00:00:00 UTC"
```

**Explanation:** `truncated = 3` tells `ymd_hms()` to accept inputs missing up to three trailing components (S, M, H). Missing pieces default to zero, so a date-only string parses as midnight.

</details>

## Related lubridate functions

After mastering `ymd_hms`, look at:

- `ymd_hm()`, `ymd_h()`: shorter time variants
- `mdy_hms()`, `dmy_hms()`: other date orderings with full time
- `parse_date_time()`: try multiple orders in one call
- `with_tz()`, `force_tz()`: convert versus relabel a time zone
- `hour()`, `minute()`, `second()`: extract components from POSIXct
- `floor_date()`, `ceiling_date()`, `round_date()`: bucket datetimes
- `now()`: current POSIXct in the session zone

For an introduction to the lubridate family overall, see the lubridate package guide. The official reference is at [lubridate.tidyverse.org](https://lubridate.tidyverse.org/reference/ymd_hms.html).

## FAQ

**How do I parse a datetime string in R?**

Use `lubridate::ymd_hms("2024-01-15 14:30:00")` for year-first input. The function returns a POSIXct value defaulting to UTC. For other orderings use `mdy_hms()` (month first) or `dmy_hms()` (day first). All variants accept a `tz` argument when the input is local time.

**What is the difference between ymd and ymd_hms?**

`ymd()` returns a `Date` object that stores only year, month, and day. `ymd_hms()` returns a `POSIXct` object that stores a full instant with hour, minute, second, and time zone. Use `ymd()` for calendar dates and `ymd_hms()` for events with sub-day resolution.

**How do I handle timezones with ymd_hms?**

Pass `tz = "Olson/Zone"` to label the input as that zone. To convert an already-parsed POSIXct to another zone, use `with_tz()`. To relabel without converting (fix a wrong zone), use `force_tz()`. Always prefer Olson names like `"Europe/London"` over abbreviations like `"GMT"`.

**Why does ymd_hms return NA for a valid-looking string?**

The most common causes are a daylight-saving gap (the time was skipped), a non-Olson zone abbreviation, or a separator the parser does not recognize. Run `lubridate::ymd_hms(x, quiet = FALSE)` to see the warning, then check the input against `OlsonNames()` or use `parse_date_time` with explicit orders.

**Is ymd_hms faster than as.POSIXct?**

For large vectors, `lubridate::fast_strptime()` is the fastest parser when you know the exact format. `ymd_hms()` is slightly slower because it auto-detects. `as.POSIXct()` with a `format` argument is comparable. For one-off scripts the difference is negligible; for millions of rows use `fast_strptime()`.
