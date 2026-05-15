---
title: "lubridate force_tz() in R: Relabel a Time Zone"
slug: "lubridate-force_tz-in-R"
description: "lubridate force_tz() in R relabels a date-time's time zone while keeping the same clock reading. Examples cover wrong zones, vectors, and DST handling."
keywords: "lubridate force_tz, force_tz function R, lubridate force_tz examples, R force time zone, force_tz vs with_tz, set timezone without converting R, roll_dst lubridate"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "lubridate-functions"
fr_parent: "lubridate-in-R.html"
auto_link_terms: "force_tz()|lubridate force_tz|lubridate::force_tz()|relabel time zone|force time zone"
auto_link_case_sensitive: true
target_keyword: "lubridate force_tz"
sibling_block_enabled: true
difficulty: "Beginner"
---

# lubridate force_tz() in R: Relabel a Time Zone

<p class="lead">The lubridate <code>force_tz()</code> function changes the time zone attached to a date-time while keeping the clock reading exactly the same. The hour, minute, and second stay put; only the zone label and the instant they point to move.</p>

[QUICK ANSWER]
force_tz(t, "America/New_York")     # relabel to New York
force_tz(t, "Asia/Tokyo")           # relabel to Tokyo
force_tz(t, "UTC")                  # relabel to UTC
force_tz(t, "Europe/London")        # relabel to London
force_tz(t)                         # relabel to system tz
force_tz(t, "America/Sao_Paulo")    # relabel to Sao Paulo
force_tz(vec, "Asia/Kolkata")       # relabel a whole vector

[DECISION TREE: Is force_tz() the right tool?]
- fix a wrong zone label, keep the clock: force_tz(t, "Asia/Tokyo")
- view a correct instant elsewhere: with_tz(t, "Asia/Tokyo")
- attach a zone while parsing: ymd_hms(x, tz = "UTC")
- check which zone a value carries: tz(t)
- get the current moment as POSIXct: now()
- drop the time and keep the date: as_date(t)

## What force_tz() does in one sentence

**`force_tz(time, tzone)` returns a new date-time with the same clock reading but a different time zone.** The displayed year, month, day, hour, minute, and second do not change; the zone label changes, and so the actual instant it represents moves.

A date-time in R is an absolute moment on the timeline. `force_tz()` looks at how that moment prints, freezes those calendar and clock numbers, and re-stamps them under a new zone. Because two zones rarely share an offset, the underlying instant ends up different even though the printed text barely moves.

[KEY INSIGHT]
**`force_tz()` trusts the clock, not the instant.** It assumes the digits you see are correct and the zone label is wrong. That is the exact situation when data was stored as local wall-clock time but parsed as UTC.

## Syntax

**`force_tz(time, tzone = "", roll_dst = c("boundary", "post"), ...)`. `time` is a date-time, `tzone` is an Olson zone name, and `roll_dst` controls daylight saving edge cases.**

```r title="Load lubridate and relabel one value"
library(lubridate)

t <- ymd_hms("2024-01-15 12:00:00", tz = "UTC")
t
#> [1] "2024-01-15 12:00:00 UTC"

force_tz(t, "America/New_York")
#> [1] "2024-01-15 12:00:00 EST"
```

The clock still reads 12:00:00, but the zone is now EST instead of UTC. Those two values are five hours apart as instants, even though they look almost identical when printed.

## Relabel a time zone in practice

### 1. Correct a timestamp parsed in the wrong zone

```r title="Fix a timestamp that was meant to be local"
logged <- ymd_hms("2024-06-01 09:30:00", tz = "UTC")

force_tz(logged, "America/Chicago")
#> [1] "2024-06-01 09:30:00 CDT"
```

This is the most common job for `force_tz()`. A log file recorded 09:30 Chicago wall time, but `ymd_hms()` assumed UTC. `force_tz()` keeps the 09:30 reading and attaches the correct zone, fixing the data without shifting the digits.

### 2. Relabel a vector of date-times

```r title="Relabel every element at once"
times <- ymd_hms(c("2024-01-15 08:00:00",
                    "2024-07-15 08:00:00"), tz = "UTC")

force_tz(times, "Asia/Kolkata")
#> [1] "2024-01-15 08:00:00 IST" "2024-07-15 08:00:00 IST"
```

`force_tz()` is vectorized. Each element keeps its own clock reading and receives the new zone. India never observes daylight saving, so both values print the same IST offset.

### 3. Combine force_tz() then with_tz()

```r title="Repair the zone, then display elsewhere"
raw <- ymd_hms("2024-03-20 14:00:00", tz = "UTC")

fixed <- force_tz(raw, "America/New_York")
with_tz(fixed, "Europe/London")
#> [1] "2024-03-20 18:00:00 GMT"
```

A typical pipeline calls `force_tz()` first to stamp the true source zone, then `with_tz()` to view that corrected instant in another city. Here a 2 PM New York event correctly shows as 6 PM London.

### 4. Relabel to the system time zone

```r title="Relabel using the machine zone"
t <- ymd_hms("2024-05-10 17:45:00", tz = "UTC")

force_tz(t)
#> [1] "2024-05-10 17:45:00 UTC"
```

Calling `force_tz()` with no `tzone` uses the system time zone, equivalent to `tzone = Sys.timezone()`. The output above reflects a machine set to UTC; on your computer it carries your local zone instead.

## force_tz() vs with_tz()

**`force_tz()` and `with_tz()` are mirror images, and confusing them silently corrupts data.** `force_tz()` holds the clock reading and moves the instant; `with_tz()` holds the instant and moves the clock reading.

```r title="The same input, two opposite results"
t <- ymd_hms("2024-01-15 12:00:00", tz = "UTC")

force_tz(t, "America/New_York")  # clock stays, instant moves
#> [1] "2024-01-15 12:00:00 EST"

with_tz(t, "America/New_York")   # instant stays, clock moves
#> [1] "2024-01-15 07:00:00 EST"
```

| Function | Clock reading | Underlying instant | Use when |
|---|---|---|---|
| `force_tz()` | unchanged | changes | the zone label is wrong, the clock reading is right |
| `with_tz()` | changes | unchanged | the moment is correct, you want a different display |

**Decision rule.** Reach for `force_tz()` when a timestamp was parsed or stored in the wrong zone and you need to correct it. Reach for `with_tz()` when the timestamp is already correct and you only want to read it in another city.

[WARNING]
**Choosing the wrong function shifts your data by hours with no error.** R will not warn you. A `force_tz()` where you needed `with_tz()` quietly moves every instant, so audit which one your pipeline calls before trusting any time-zone result.

## Daylight saving and roll_dst

**Some clock readings do not exist or repeat when daylight saving changes, and `roll_dst` decides how `force_tz()` handles them.** When clocks spring forward, an hour is skipped; when they fall back, an hour repeats.

```r title="Force a clock time into a DST gap"
gap <- ymd_hms("2024-03-10 02:30:00")

force_tz(gap, "America/New_York")
#> [1] "2024-03-10 03:00:00 EDT"

force_tz(gap, "America/New_York", roll_dst = "NA")
#> [1] NA
```

In New York on 2024-03-10, clocks jumped from 02:00 to 03:00, so 02:30 never happened. The default `roll_dst` rolls the value to the DST boundary at 03:00. Passing `roll_dst = "NA"` instead returns `NA`, which is safer when a skipped time signals bad input you want to catch.

[NOTE]
**Coming from Python pandas?** `force_tz()` is the equivalent of `Series.dt.tz_localize()`, and `with_tz()` matches `Series.dt.tz_convert()`. The localize-versus-convert distinction is the same idea in both languages.

## Common pitfalls

```r title="Three traps to avoid"
force_tz(ymd("2024-01-15"), "Asia/Tokyo")
#> [1] "2024-01-15 JST"

force_tz(t, "EST")
#> Warning: Unrecognized time zone 'EST'

x <- ymd_hms("2024-01-15 12:00:00", tz = "UTC")
x == force_tz(x, "America/New_York")
#> [1] FALSE
```

Three traps catch most users. First, applying `force_tz()` to a plain `Date` is usually pointless, since a `Date` has no clock reading to preserve. Second, short abbreviations such as `"EST"` are not valid Olson names; always use full forms like `"America/New_York"`. Third, remember that `force_tz()` produces a different instant, so a value never equals its `force_tz()` result.

[TIP]
**Force the zone at parse time, then keep everything in UTC.** If you know the source zone, pass it straight to `ymd_hms(x, tz = ...)` so `force_tz()` is never needed. When data is already parsed wrong, fix it once with `force_tz()`, convert to UTC, and do all later work there.

## Try it yourself

**Try it:** A sensor logged `2024-08-01 06:15:00` as local Berlin wall time, but it was parsed as UTC. Relabel it to `"Europe/Berlin"` and save the result to `ex_berlin`.

```r title="Your turn: relabel to Berlin"
# Try it: force the correct zone
logged <- ymd_hms("2024-08-01 06:15:00", tz = "UTC")

ex_berlin <- # your code here

ex_berlin
#> Expected: 2024-08-01 06:15:00 in Berlin (CEST)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_berlin <- force_tz(logged, "Europe/Berlin")
ex_berlin
#> [1] "2024-08-01 06:15:00 CEST"
```

**Explanation:** `force_tz()` keeps the 06:15:00 clock reading and attaches the `"Europe/Berlin"` zone. August falls in central European summer time, so the value prints as CEST.

</details>

## Related lubridate functions

- `with_tz()`: keeps the instant and changes the clock reading, the opposite of `force_tz()`.
- `tz()`: returns the time zone string currently attached to a date-time.
- `now()`: current date-time as a POSIXct, ready to relabel or convert.
- `ymd_hms()`, `mdy_hms()`, `dmy_hms()`: parse date-time strings with a `tz` argument.
- `as_date()`: drop the time component and return a plain Date.

## FAQ

**What is the difference between force_tz() and with_tz() in R?**

`force_tz()` keeps the clock reading fixed and changes the instant, so a UTC noon becomes a New York noon that is a different moment five hours later. `with_tz()` keeps the instant fixed and changes the display, so a UTC noon becomes a New York 7 AM pointing to the same moment. Use `force_tz()` to correct a timestamp parsed in the wrong zone, and `with_tz()` to view a correct timestamp in another city.

**Does force_tz() change the actual time?**

Yes. `force_tz()` keeps the printed clock reading but changes the underlying instant, because the same wall-clock numbers map to a different point on the timeline in each zone. This is intentional: it is how you correct a timestamp that carried the wrong zone label. If you need the instant to stay constant, use `with_tz()` instead.

**When should I use force_tz() in R?**

Use `force_tz()` when a date-time has the right clock digits but the wrong zone attached. The classic case is data stored as local wall time that `ymd_hms()` or `as.POSIXct()` assumed was UTC. `force_tz()` re-stamps it with the true source zone without disturbing the hour and minute, so the value finally represents the moment the data actually meant.

**What time zone names does force_tz() accept?**

`force_tz()` accepts Olson (IANA) time zone names such as `"America/New_York"`, `"Europe/Berlin"`, and `"Asia/Tokyo"`. Run `OlsonNames()` to list every value your R installation supports. Avoid abbreviations like `"EST"` or `"PST"`, because they are not valid Olson names and trigger an "Unrecognized time zone" warning that leaves the value unchanged.

**How does force_tz() handle daylight saving gaps?**

When a clock reading falls inside a skipped daylight saving hour, `force_tz()` uses its `roll_dst` argument to decide. The default rolls the value forward to the DST boundary, so a skipped 02:30 becomes 03:00. Passing `roll_dst = "NA"` returns `NA` instead, which is useful when a nonexistent time means the input data is wrong and should be flagged.
