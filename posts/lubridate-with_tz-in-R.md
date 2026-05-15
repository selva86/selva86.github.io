---
title: "lubridate with_tz() in R: Convert Time Zones for Display"
slug: "lubridate-with_tz-in-R"
description: "lubridate with_tz() displays a date-time in another time zone without changing the underlying instant. Examples cover UTC conversion, vectors, and force_tz."
keywords: "lubridate with_tz, with_tz function R, lubridate with_tz examples, R with_tz time zone, convert UTC to local R, with_tz vs force_tz, change timezone R lubridate"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "lubridate-functions"
fr_parent: "lubridate-in-R.html"
auto_link_terms: "with_tz()|lubridate with_tz|lubridate::with_tz()|convert time zone|change time zone"
auto_link_case_sensitive: true
target_keyword: "lubridate with_tz"
sibling_block_enabled: true
difficulty: "Beginner"
---

# lubridate with_tz() in R: Convert Time Zones for Display

<p class="lead">The lubridate <code>with_tz()</code> function shows a date-time in a different time zone without changing the actual moment in time it represents. It re-labels the clock for display while the underlying instant stays exactly the same.</p>

[QUICK ANSWER]
with_tz(t, "America/New_York")        # display in New York
with_tz(t, "Asia/Tokyo")              # display in Tokyo
with_tz(t, "Europe/London")           # display in London
with_tz(t, "UTC")                     # display in UTC
with_tz(t)                            # display in system tz
with_tz(t, tzone = Sys.timezone())    # explicit system tz
with_tz(now(), "Australia/Sydney")    # current time elsewhere

[DECISION TREE: Is with_tz() the right tool?]
- show an instant in another zone: with_tz(t, "Asia/Tokyo")
- relabel zone, keep clock time: force_tz(t, "Asia/Tokyo")
- attach a zone while parsing: ymd_hms(x, tz = "UTC")
- read which zone a value carries: tz(t)
- get the current time as POSIXct: now()
- strip time and keep the date: as_date(t)

## What with_tz() does in one sentence

**`with_tz(time, tzone)` returns the same instant displayed under a different time zone.** The number of seconds since the epoch is untouched; only the calendar and clock labels used to print the value change.

A date-time in R is an absolute moment, like "the instant 1.7 billion seconds after 1970". That moment can be described as 12:00 in London or 07:00 in New York, and both descriptions point to the identical event. `with_tz()` swaps which description you see.

[KEY INSIGHT]
**`with_tz()` changes the label, not the instant.** If you compare a value before and after `with_tz()`, they test as equal, because they are the same point on the timeline viewed through two different clocks.

## Syntax

**`with_tz(time, tzone = "", ...)`. `time` is a POSIXct date-time; `tzone` is an Olson time zone name string; an empty string means the system time zone.**

```r title="Load lubridate and convert one instant"
library(lubridate)

t <- ymd_hms("2024-01-15 12:00:00", tz = "UTC")
t
#> [1] "2024-01-15 12:00:00 UTC"

with_tz(t, "America/New_York")
#> [1] "2024-01-15 07:00:00 EST"
```

The input must already carry a correct time zone. `with_tz()` reads that zone, converts to the requested `tzone`, and prints the result. It never guesses what zone your data came from.

## Convert between time zones

### 1. Display a UTC timestamp locally

```r title="Show a UTC instant in three cities"
t <- ymd_hms("2024-01-15 12:00:00", tz = "UTC")

with_tz(t, "America/New_York")
#> [1] "2024-01-15 07:00:00 EST"

with_tz(t, "Asia/Tokyo")
#> [1] "2024-01-15 21:00:00 JST"

with_tz(t, "Australia/Sydney")
#> [1] "2024-01-15 23:00:00 AEDT"
```

One UTC instant becomes three readings. New York is five hours behind, Tokyo nine ahead, and Sydney eleven ahead because January falls in its daylight saving period. The event is one moment; only the display differs.

### 2. Convert between two non-UTC zones

```r title="Convert a New York time to London"
t_ny <- ymd_hms("2024-06-01 09:00:00", tz = "America/New_York")

with_tz(t_ny, "Europe/London")
#> [1] "2024-06-01 14:00:00 BST"
```

`with_tz()` works from any source zone, not just UTC. A 9 AM New York meeting in June shows as 2 PM in London, and lubridate applies each zone's daylight saving rules automatically.

### 3. Vectorized conversion

```r title="Convert a vector of date-times"
times <- ymd_hms(c("2024-01-15 12:00:00",
                    "2024-07-15 12:00:00"), tz = "UTC")

with_tz(times, "America/New_York")
#> [1] "2024-01-15 07:00:00 EST" "2024-07-15 08:00:00 EDT"
```

`with_tz()` is vectorized. Note the offset changes within the vector: January prints EST at UTC-5, July prints EDT at UTC-4, because the conversion respects daylight saving on a per-element basis.

### 4. Current time in another city

```r title="See the current time elsewhere"
now_utc <- now(tzone = "UTC")

with_tz(now_utc, "Asia/Kolkata")
#> [1] "2026-05-15 19:30:00 IST"
```

Pair `with_tz()` with `now()` to answer "what time is it there right now". The output above is illustrative; the live value depends on when the code runs.

## with_tz() vs force_tz()

**These two functions look alike but do opposite jobs.** `with_tz()` preserves the instant and re-labels the clock, while `force_tz()` preserves the clock and re-labels the instant.

[WARNING]
**`with_tz()` and `force_tz()` are not interchangeable.** `with_tz()` keeps the instant and changes the clock reading. `force_tz()` keeps the clock reading and changes the instant. Picking the wrong one shifts your data by hours without any error.

```r title="The same input, two different results"
t <- ymd_hms("2024-01-15 12:00:00", tz = "UTC")

with_tz(t, "America/New_York")   # same instant
#> [1] "2024-01-15 07:00:00 EST"

force_tz(t, "America/New_York")  # different instant
#> [1] "2024-01-15 12:00:00 EST"
```

| Function | Clock reading | Underlying instant | Use when |
|---|---|---|---|
| `with_tz()` | changes | unchanged | you have the correct moment, want a different display |
| `force_tz()` | unchanged | changes | the zone label is wrong but the clock reading is right |

**Decision rule.** Use `with_tz()` when the timestamp is correct and you only want to read it in another city. Use `force_tz()` when the timestamp was parsed with the wrong zone, for example data stored as local time that lubridate assumed was UTC.

[NOTE]
**Coming from Python pandas?** `with_tz()` is the equivalent of `Series.dt.tz_convert()`, and `force_tz()` matches `Series.dt.tz_localize()`. The convert-versus-localize split is the same idea in both languages.

## Common pitfalls

```r title="Three traps to avoid"
with_tz(ymd_hms("2024-01-15 12:00:00"), "Asia/Tokyo")
#> [1] "2024-01-15 21:00:00 JST"

with_tz(t, "New York")
#> Warning: Unrecognized time zone 'New York'
#> [1] "2024-01-15 12:00:00 UTC"

d <- as_date("2024-01-15")
with_tz(d, "Asia/Tokyo")
#> [1] "2024-01-15 09:00:00 JST"
```

Three traps catch most users. First, a string parsed without `tz =` is assumed to be UTC, so the conversion starts from the wrong zone; pass `tz` to `ymd_hms()` or use `force_tz()`. Second, an unrecognized zone name warns and leaves the value unchanged, so always use full Olson names such as `"America/New_York"` rather than `"New York"` or `"EST"`. Third, a plain `Date` has no time component, so converting it invents a midnight that then shifts across the date line.

[TIP]
**Store everything in UTC, convert only at display time.** Keep timestamps in UTC throughout your analysis and call `with_tz()` only in the final report or plot. This keeps arithmetic, joins, and comparisons consistent, because every value shares one reference zone until the moment a human reads it.

## Try it yourself

**Try it:** Take a UTC instant of 2024-03-10 15:30:00 and display it in both `"Europe/Paris"` and `"America/Los_Angeles"`. Save the Los Angeles result to `ex_la`.

```r title="Your turn: convert a UTC instant"
# Try it: convert one instant to two zones
t_utc <- ymd_hms("2024-03-10 15:30:00", tz = "UTC")

ex_la <- # your code here

ex_la
#> Expected: 2024-03-10 07:30:00 in Los Angeles
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_la <- with_tz(t_utc, "America/Los_Angeles")
ex_la
#> [1] "2024-03-10 07:30:00 PST"

with_tz(t_utc, "Europe/Paris")
#> [1] "2024-03-10 16:30:00 CET"
```

**Explanation:** `with_tz()` reports the same instant in each zone. Los Angeles is eight hours behind UTC in March, and Paris is one hour ahead, so one moment prints as 07:30 PST and 16:30 CET.

</details>

## Related lubridate functions

- `force_tz()`: keeps the clock reading and changes the instant, the opposite of `with_tz()`.
- `tz()`: returns the time zone string currently attached to a date-time.
- `now()`: current date-time as a POSIXct, ready to pass to `with_tz()`.
- `ymd_hms()`, `mdy_hms()`, `dmy_hms()`: parse date-time strings with a `tz` argument.
- `as_date()`: drop the time component and return a plain Date.

## FAQ

**What is the difference between with_tz() and force_tz() in R?**

`with_tz()` keeps the underlying instant fixed and changes how it is displayed, so a UTC noon becomes a New York 7 AM that points to the same moment. `force_tz()` keeps the clock reading fixed and changes the instant, so a UTC noon becomes a New York noon that is a different moment five hours later. Use `with_tz()` to view a correct timestamp elsewhere, and `force_tz()` to correct a timestamp parsed in the wrong zone.

**Does with_tz() change the actual time?**

No. `with_tz()` never alters the moment a date-time represents. If you compare a value before and after `with_tz()`, R reports them as equal because they are the same point on the timeline. Only the time zone label and the printed clock and calendar values change. This is why `with_tz()` is safe to use right before printing or plotting without affecting any arithmetic.

**How do I convert UTC to local time in R?**

Parse or store the timestamp with `tz = "UTC"`, then call `with_tz()` with your local Olson zone name. For example, `with_tz(ymd_hms("2024-01-15 12:00:00", tz = "UTC"), "America/Chicago")`. To use the machine's own zone, call `with_tz(t)` with no second argument, or pass `tzone = Sys.timezone()` to be explicit about the target zone.

**What time zone names does with_tz() accept?**

`with_tz()` accepts Olson (IANA) time zone names such as `"America/New_York"`, `"Europe/London"`, and `"Asia/Tokyo"`. Run `OlsonNames()` to list every value your R installation supports. Avoid short abbreviations like `"EST"` or `"PST"`, because they are ambiguous, ignore daylight saving, and may trigger a warning or silently fall back to UTC.

**Can with_tz() handle a vector of date-times?**

Yes. `with_tz()` is vectorized and converts every element of a POSIXct vector in one call. Each element is converted independently, so a vector spanning winter and summer correctly shows different UTC offsets per element as daylight saving turns on and off. The result is a single POSIXct vector carrying the requested time zone.
