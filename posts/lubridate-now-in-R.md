---
title: "lubridate now() in R: Current Date-Time With Time Zones"
slug: "lubridate-now-in-R"
description: "Use lubridate now() to get the current date-time in R, set time zones, format output, and subtract durations. Five examples plus now() vs Sys.time() compared."
keywords: "lubridate now, R current datetime, now function R, lubridate now timezone, R Sys.time vs now, lubridate current time, now() R example"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "lubridate-functions"
fr_parent: "lubridate-in-R.html"
auto_link_terms: "now()|lubridate now|lubridate::now()|current datetime|current system time"
auto_link_case_sensitive: true
target_keyword: "lubridate now"
sibling_block_enabled: true
difficulty: "Beginner"
---

# lubridate now() in R: Current Date-Time With Time Zones

<p class="lead">The <code>now()</code> function in lubridate returns the current system date and time as a POSIXct object. Pass a time zone string like <code>now("UTC")</code> to get the same instant in a different zone.</p>

[QUICK ANSWER]
now()                                     # current datetime, local tz
now("UTC")                                # current datetime, UTC
now("America/New_York")                   # specific timezone
now() - hours(1)                          # one hour ago
now() + days(7)                           # seven days from now
format(now(), "%Y-%m-%d %H:%M:%S")        # custom string format
as.Date(now())                            # drop the time, keep the date
difftime(now(), event_time, units = "mins")  # minutes since event

[DECISION TREE: Is now() the right tool?]
- need current datetime with time: now()
- need today's date only (no time): today()
- need a fixed reference instant: ymd_hms("2024-01-15 09:00")
- parsing a string into datetime: ymd_hms(x) or parse_date_time(x)
- want UNIX epoch seconds: as.numeric(now())
- need a high-resolution timer: Sys.time() or proc.time()
- need the system timezone string: Sys.timezone()
- working with intervals: interval(start, end)

## What now() does in one sentence

**`now()` returns the current system clock time as a POSIXct object.** The result includes both date and time down to the second, tagged with a time zone.

This is the lubridate equivalent of base R's `Sys.time()`. The two return the same instant, but `now()` accepts a time zone argument directly and integrates cleanly with the rest of the lubridate API.

## Syntax

**`now(tzone = "")`. The single optional argument is the time zone string.**

```r title="Get the current datetime"
library(lubridate)

now()
#> [1] "2026-05-15 14:23:07 IST"

class(now())
#> [1] "POSIXct" "POSIXt"
```

`tzone = ""` (the default) uses the session time zone returned by `Sys.timezone()`. Pass any IANA zone name like `"UTC"` or `"Europe/Paris"` to override. The underlying instant is identical; only the printed representation changes.

[TIP]
**Use `now()` over `Sys.time()` when you want a specific time zone inline.** `Sys.time()` always returns the system zone, so you would have to call `with_tz()` afterwards. `now("Asia/Tokyo")` does it in one step.

## Five common patterns

### 1. Current datetime in the local zone

```r title="Default returns session timezone"
now()
#> [1] "2026-05-15 14:23:07 IST"
```

The output shows the date, time of day, and the abbreviated zone (here IST). `Sys.timezone()` reports the full zone string.

### 2. Current datetime in UTC or another zone

```r title="Override the timezone"
now("UTC")
#> [1] "2026-05-15 08:53:07 UTC"

now("America/New_York")
#> [1] "2026-05-15 04:53:07 EDT"
```

The numeric instant is the same in all three calls. Only the printed clock changes. UTC is the safe default for logs and timestamps shared across machines.

### 3. Arithmetic: relative datetimes

```r title="Add or subtract durations"
now() + hours(1)
#> [1] "2026-05-15 15:23:07 IST"

now() - days(7)
#> [1] "2026-05-08 14:23:07 IST"

now() + minutes(30)
#> [1] "2026-05-15 14:53:07 IST"
```

`hours()`, `days()`, `minutes()`, `weeks()`, `years()` are lubridate period constructors. Adding them to `now()` produces a new POSIXct shifted by the amount.

### 4. Format the output

```r title="Convert to a custom string"
format(now(), "%Y-%m-%d %H:%M:%S")
#> [1] "2026-05-15 14:23:07"

format(now(), "%A, %d %B %Y")
#> [1] "Friday, 15 May 2026"

format(now(), "%H:%M")
#> [1] "14:23"
```

`format()` uses the standard `strftime` codes. `%Y` four-digit year, `%m` month, `%d` day, `%H` hour 24h, `%M` minute, `%S` second, `%A` weekday name, `%B` month name.

### 5. Elapsed time since an event

```r title="How long ago was something?"
start <- now() - minutes(45)
elapsed <- difftime(now(), start, units = "mins")
elapsed
#> Time difference of 45 mins

as.numeric(elapsed)
#> [1] 45
```

`difftime()` returns a `difftime` object with attached units. Coerce with `as.numeric()` to get a plain number for further math.

[KEY INSIGHT]
**A POSIXct value is just seconds since 1970, with a time zone label.** `now()` reads the system clock, converts it to seconds since the Unix epoch, and prints it in whatever zone you ask for. This is why `now()`, `now("UTC")`, and `now("Asia/Tokyo")` are the same instant but different strings.

## now() vs Sys.time() vs today() vs Sys.Date()

**Four functions for current-time work, each with a distinct return type.**

| Function | Package | Returns | Includes time? | Time zone arg? |
|---|---|---|---|---|
| `now()` | lubridate | POSIXct | Yes | Yes |
| `Sys.time()` | base R | POSIXct | Yes | No (session zone) |
| `today()` | lubridate | Date | No | Yes |
| `Sys.Date()` | base R | Date | No | No (session zone) |

Use `now()` when you need a datetime with explicit zone control. Use `today()` when only the calendar date matters. Reach for base R when you want zero dependencies; otherwise the lubridate pair is friendlier.

## Common pitfalls

**Pitfall 1: comparing across time zones.** `now("UTC") == now("Asia/Tokyo")` returns TRUE because both are the same instant, but `format(now("UTC")) == format(now("Asia/Tokyo"))` returns FALSE. Compare POSIXct values directly, not their formatted strings.

**Pitfall 2: confusing duration with period.** `now() + days(1)` adds a period (calendar day, may differ by DST). `now() + ddays(1)` adds exactly 86,400 seconds. The two diverge across spring-forward and fall-back transitions.

[WARNING]
**`now()` is impure: it changes on every call.** Two calls one second apart return different values. For reproducible analysis, capture the value once: `run_started <- now()`. Re-running `now()` in tests will break snapshot assertions.

[NOTE]
**Coming from Python?** The Python equivalent is `datetime.now()` or `datetime.now(tz=ZoneInfo("UTC"))`. The lubridate API is intentionally similar, including the optional time zone string.

## A practical workflow with now()

**Logging, deadlines, and elapsed-time reporting are the three places `now()` shows up most often in real code.**

The three patterns:

1. **Log a timestamp** at the start of a job: `run_started <- now("UTC")` and write it to a log file.
2. **Check a deadline**: `if (now() > deadline) stop("Deadline passed")` where `deadline` is a POSIXct.
3. **Report elapsed time**: capture `t0 <- now()` before a step and `difftime(now(), t0, units = "secs")` after.

For pipelines that span servers or time zones, always log timestamps in UTC. Convert to local time only at the display layer. This avoids the silent bugs that show up around DST transitions and across geographically distributed systems.

```r title="Time a chunk of work"
t0 <- now()
Sys.sleep(0.5)             # placeholder for real work
elapsed <- difftime(now(), t0, units = "secs")
round(as.numeric(elapsed), 2)
#> [1] 0.5
```

## Try it yourself

**Try it:** Compute how many minutes are left until midnight in your local time zone. Save the result to `ex_mins_left`.

```r title="Your turn: minutes until midnight"
# Try it: minutes until midnight
midnight <- as.POSIXct(paste(as.Date(now()) + 1, "00:00:00"), tz = Sys.timezone())

ex_mins_left <- # your code here

ex_mins_left
#> Expected: a positive number under 1440
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
midnight <- as.POSIXct(paste(as.Date(now()) + 1, "00:00:00"), tz = Sys.timezone())
ex_mins_left <- as.numeric(difftime(midnight, now(), units = "mins"))
round(ex_mins_left, 1)
#> [1] 575.9
```

**Explanation:** `as.Date(now()) + 1` is tomorrow's date. Pasting "00:00:00" and parsing as POSIXct gives the next midnight. `difftime()` with `units = "mins"` returns the gap as a number.

</details>

## Related lubridate functions

After mastering now(), look at:

- `today()`: current Date (no time component)
- `Sys.time()`, `Sys.Date()`: base R equivalents
- `with_tz()`, `force_tz()`: change time zone of a POSIXct
- `as_datetime()`, `as_date()`: convert between Date and POSIXct
- `hours()`, `days()`, `minutes()`: period constructors for arithmetic
- `interval()`, `difftime()`: durations between two instants

For parsing existing datetime strings into POSIXct, use `ymd_hms()` and its siblings rather than `now()`.

## FAQ

**What is the difference between now() and Sys.time() in R?**

Both return the current system time as POSIXct. `now()` accepts a time zone argument directly: `now("UTC")`. `Sys.time()` always uses the session zone and requires a separate `with_tz()` call to shift it. The underlying instant is identical.

**How do I get the current date without time in R?**

Use `today()` from lubridate or `Sys.Date()` from base R. Both return a Date object representing today. Pass a time zone to `today("Asia/Tokyo")` if the calendar boundary matters for your location.

**How do I get the current time in UTC with lubridate?**

Call `now("UTC")`. The output prints in UTC and the attached time zone attribute is "UTC". Use this for logs, file names, and any value that crosses servers.

**How do I subtract two datetimes in R?**

Use `difftime(end, start, units = "mins")` (or "secs", "hours", "days"). The result is a difftime object. Coerce with `as.numeric()` if you need a plain number for arithmetic.

**Why does now() return a different value every time I call it?**

`now()` reads the system clock at the moment of the call. Each call advances. For reproducible output, capture the value once into a variable and reuse it: `t0 <- now()`.
