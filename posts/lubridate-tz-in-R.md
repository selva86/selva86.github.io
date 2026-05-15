---
title: "lubridate tz() in R: Get the Time Zone of a Date"
slug: "lubridate-tz-in-R"
description: "lubridate tz() returns the time zone string attached to a date-time in R. Examples cover reading the zone, the tz()<- setter, Date objects, and vectors."
keywords: "lubridate tz, tz function R, lubridate tz examples, R get time zone, time zone of date R, tz vs with_tz, lubridate timezone"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "lubridate-functions"
fr_parent: "lubridate-in-R.html"
auto_link_terms: "tz()|lubridate tz|lubridate::tz()|get time zone|time zone attribute"
auto_link_case_sensitive: true
target_keyword: "lubridate tz"
sibling_block_enabled: true
difficulty: "Beginner"
---

# lubridate tz() in R: Get the Time Zone of a Date

<p class="lead">The lubridate <code>tz()</code> function returns the time zone string currently attached to a date-time in R. It reads the zone label without changing the value, so you can check what zone a timestamp carries before you parse, compare, or convert it.</p>

[QUICK ANSWER]
tz(t)                              # read the zone string
tz(now())                          # zone of the current time
tz(ymd_hms(x, tz = "Asia/Tokyo"))  # zone set at parse time
tz(as_date("2024-01-15"))          # a Date reports "UTC"
force_tz(t, "America/New_York")    # set zone, keep clock time
attr(t, "tzone")                   # the raw attribute tz() reads
OlsonNames()                       # every valid zone name

[DECISION TREE: Is tz() the right tool?]
- read which zone a value carries: tz(t)
- show an instant in another zone: with_tz(t, "Asia/Tokyo")
- relabel zone, keep clock time: force_tz(t, "Asia/Tokyo")
- attach a zone while parsing: ymd_hms(x, tz = "UTC")
- get the current time as POSIXct: now()
- list every valid zone name: OlsonNames()

## What tz() does in one sentence

**`tz(x)` returns the Olson time zone name stored on a date-time as a single character string.** It is a pure accessor: it inspects the `tzone` attribute and reports it, leaving the value itself untouched.

Every POSIXct date-time in R can carry a time zone label, such as `"Europe/Paris"` or `"UTC"`. That label tells R how to print the value and how to interpret arithmetic across daylight saving boundaries. `tz()` is how you ask "which zone is this?" without guessing from the printed output.

The printed zone abbreviation, like `CET` or `EST`, is not the stored label. R derives the abbreviation from the Olson name plus the date, since the same zone prints `CET` in winter and `CEST` in summer. `tz()` always returns the stable Olson name, which is the value you should rely on in code.

[KEY INSIGHT]
**`tz()` reads, it never transforms.** Unlike `with_tz()` and `force_tz()`, which return a new date-time, `tz()` returns a plain string. If you need to inspect a timestamp's zone in a condition or a message, `tz()` is the function you want.

## Syntax

**`tz(x)` takes a date-time and returns its zone; `tz(x) <- value` is the replacement form that sets the zone.** The getter accepts POSIXct, POSIXlt, Date, and interval objects.

```r title="Load lubridate and read a zone"
library(lubridate)

t <- ymd_hms("2024-01-15 09:30:00", tz = "Europe/Paris")
t
#> [1] "2024-01-15 09:30:00 CET"

tz(t)
#> [1] "Europe/Paris"
```

The getter form returns one string regardless of how many elements `x` has, because a vector of date-times shares a single zone attribute. The setter form, `tz(x) <- value`, changes that attribute and is covered below.

Both forms accept the lubridate date-time classes and base R's `POSIXct`, `POSIXlt`, and `Date`. They do not work on a character string: if your data is still text, parse it with `ymd_hms()` first so the zone has somewhere to live.

## Why the time zone label matters

**The zone attribute decides how R prints a value and how it does arithmetic.** Two date-times holding the same number of seconds since the epoch can print as different clock times purely because they carry different zones.

The label also drives daylight saving math. When you add a day across a spring-forward boundary, lubridate consults the zone to decide whether that day spans 23, 24, or 25 hours. A value tagged `"UTC"` has no daylight saving, so the identical arithmetic returns a different result. Reading `tz()` first tells you which rule set applies to the value in front of you.

This is why `tz()` is more than a curiosity. Before you join two tables of timestamps, sort events, or compute a duration, a quick `tz()` check confirms both sides share a zone. Mismatched zones are a frequent source of bugs that raise no error and surface only as wrong numbers.

## Read the time zone of a date-time

### 1. Read the zone of a parsed value

```r title="Read the zone from a parsed date-time"
t <- ymd_hms("2024-06-01 14:00:00", tz = "America/New_York")

tz(t)
#> [1] "America/New_York"
```

When you pass `tz =` to a parser like `ymd_hms()`, that zone is stored on the result. `tz()` reads it straight back, which makes it a quick way to confirm a parse used the zone you intended. This check is worth running whenever timestamps arrive from a file or API, because a parse that silently defaulted to UTC looks identical to a correct parse until you inspect the zone.

### 2. A Date object always reports UTC

```r title="Check the zone of a plain Date"
d <- as_date("2024-01-15")

tz(d)
#> [1] "UTC"
```

A plain `Date` has no time component and no zone attribute, so `tz()` reports `"UTC"` by convention. The same fallback applies to a date-time parsed without `tz =`, which lubridate also treats as UTC.

### 3. tz() on a vector returns one string

```r title="Read the zone of a date-time vector"
times <- ymd_hms(c("2024-01-15 12:00:00",
                   "2024-07-15 12:00:00"), tz = "Asia/Tokyo")

tz(times)
#> [1] "Asia/Tokyo"
```

A POSIXct vector stores its zone once, as a shared attribute, not per element. So `tz()` returns a single string even for a long vector, and every element is interpreted under that one zone.

### 4. tz() versus the raw attribute

```r title="Compare tz() with attr()"
t <- ymd_hms("2024-03-10 08:00:00", tz = "Europe/London")

attr(t, "tzone")
#> [1] "Europe/London"

tz(t)
#> [1] "Europe/London"
```

`tz()` reads the same `tzone` attribute that `attr(t, "tzone")` exposes. The difference is that `tz()` falls back to `"UTC"` when the attribute is missing or empty, while `attr()` would return `NULL` or `""`. That fallback makes `tz()` safer in code, because a comparison like `tz(x) == "UTC"` never breaks on a `NULL`, whereas the raw `attr()` value can.

## Set the time zone with tz()<-

**The replacement form `tz(x) <- value` changes the zone label while keeping the clock reading fixed.** It is identical to calling `force_tz()`, so the underlying instant moves.

```r title="Set a zone with the replacement form"
t <- ymd_hms("2024-01-15 12:00:00", tz = "UTC")
t
#> [1] "2024-01-15 12:00:00 UTC"

tz(t) <- "America/New_York"
t
#> [1] "2024-01-15 12:00:00 EST"

tz(t)
#> [1] "America/New_York"
```

The clock still reads 12:00:00, but the value now points to a different moment because noon in New York is not noon in UTC. Use the setter only when the original zone label was wrong, not when you want to view a correct timestamp elsewhere.

A typical case for the setter is data exported as local time but parsed as UTC by mistake. The clock digits are right, the label is wrong, and `tz(x) <-` fixes the label so the digits finally mean what they say. If the digits themselves are correct for UTC, leave the value alone and convert with `with_tz()` at display time instead.

[WARNING]
**`tz(x) <- value` is `force_tz()`, not `with_tz()`.** The setter keeps the clock reading and shifts the instant. If you instead want to display the same moment in another zone, use `with_tz()`, which keeps the instant and changes the clock.

## tz() vs with_tz() vs force_tz()

**These three functions touch the same zone attribute but do different jobs.** `tz()` reads it, `with_tz()` re-displays an instant, and `force_tz()` relabels an instant.

| Function | Returns | Clock reading | Underlying instant |
|---|---|---|---|
| `tz()` | a zone string | n/a | unchanged |
| `with_tz()` | a date-time | changes | unchanged |
| `force_tz()` | a date-time | unchanged | changes |

**Decision rule.** Call `tz()` when you only need to know the current zone. Call `with_tz()` when the timestamp is correct and you want to read it in another city. Call `force_tz()`, or the equivalent `tz(x) <-`, when the zone label itself is wrong. The getter is non-destructive and safe to call anywhere; the two transformers return new values and should be assigned, not called in passing.

[NOTE]
**Coming from Python pandas?** `tz()` is the rough equivalent of reading `Series.dt.tz`. The setter `tz(x) <-` matches `Series.dt.tz_localize()`, while `with_tz()` matches `Series.dt.tz_convert()`.

## Common pitfalls

```r title="Three traps with tz()"
tz(ymd_hms("2024-01-15 12:00:00"))
#> [1] "UTC"

t <- ymd_hms("2024-01-15 12:00:00", tz = "UTC")
tz(t) <- "Tokyo"
#> Warning: Unrecognized time zone 'Tokyo'

tz(as.POSIXct("2024-01-15 12:00:00"))
#> [1] "UTC"
```

Three traps catch most users. First, a string parsed without `tz =` reports `"UTC"`, not your machine's zone, so never assume `tz()` reveals local time. Second, the setter rejects short or invalid names: pass full Olson names such as `"Asia/Tokyo"`, because `"Tokyo"` warns and leaves the value unchanged. Third, a base `POSIXct` built without a zone also reports `"UTC"` through lubridate's fallback, which can mask a missing zone you meant to set.

[TIP]
**Use `tz()` in a guard before zone-sensitive work.** A quick `if (tz(x) != "UTC") x <- with_tz(x, "UTC")` normalizes inputs to a known zone before arithmetic or joins, which prevents silent hour shifts when data arrives from mixed sources.

## Try it yourself

**Try it:** Parse the string "2024-08-20 18:00:00" in the `"Europe/London"` zone, read its time zone with `tz()`, and save the resulting string to `ex_zone`.

```r title="Your turn: read a time zone"
# Try it: read the zone of a parsed date-time
ex_zone <- # your code here

ex_zone
#> Expected: "Europe/London"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_zone <- tz(ymd_hms("2024-08-20 18:00:00", tz = "Europe/London"))
ex_zone
#> [1] "Europe/London"
```

**Explanation:** `ymd_hms()` stores the `tz =` argument on the parsed value, and `tz()` reads that attribute back as a plain string. The result is the exact Olson name you passed in.

</details>

## Related lubridate functions

- `with_tz()`: shows the same instant displayed in a different time zone.
- `force_tz()`: relabels the zone while keeping the clock reading, the same as `tz(x) <-`.
- `now()`: returns the current date-time as a POSIXct, ready to inspect with `tz()`.
- `ymd_hms()`, `mdy_hms()`, `dmy_hms()`: parse date-time strings and accept a `tz` argument.
- `OlsonNames()`: lists every time zone name your R installation recognizes.

## FAQ

**What does tz() return in R?**

`tz()` returns the time zone of a date-time as a single character string, using the Olson naming scheme, for example `"Europe/Paris"` or `"UTC"`. It reads the `tzone` attribute of the object and reports it without modifying the value. If the object has no zone attribute, such as a plain `Date` or a date-time parsed without `tz =`, `tz()` falls back to `"UTC"` rather than returning an empty string.

**What is the difference between tz() and with_tz()?**

`tz()` is a read-only accessor that returns a zone string. `with_tz()` returns a new date-time that shows the same instant in a different zone. In short, `tz()` answers "which zone is this?" while `with_tz()` answers "what does this moment look like over there?". `tz()` never changes the value; `with_tz()` always returns a transformed copy.

**Why does tz() return UTC for my date-time?**

`tz()` returns `"UTC"` whenever the object carries no explicit zone attribute. This happens when you parse a string without the `tz =` argument, or build a value with base `as.POSIXct()` without a `tz`. lubridate treats such values as UTC by default. To attach the correct zone, pass `tz =` to the parser, or relabel an existing value with `tz(x) <-` or `force_tz()`.

**How do I change the time zone of a date-time in R?**

It depends on your goal. To relabel the zone while keeping the clock reading, use `tz(x) <- "Asia/Tokyo"` or `force_tz(x, "Asia/Tokyo")`, which shifts the underlying instant. To keep the instant and only change the display, use `with_tz(x, "Asia/Tokyo")`. Picking the wrong one moves your data by hours with no error, so decide whether the clock or the instant should stay fixed.

**Can tz() return multiple time zones for a vector?**

No. A POSIXct vector stores its zone once, as a single shared attribute, so `tz()` always returns one string no matter how many elements the vector holds. Every element is interpreted under that same zone. If you need different zones per element, you must split the data into separate vectors, one per zone, since R's date-time types do not support a per-element zone.
</content>
</invoke>
