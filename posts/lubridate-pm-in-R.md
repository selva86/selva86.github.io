---
title: "lubridate pm() in R: Test if a Datetime is After Noon"
slug: "lubridate-pm-in-R"
description: "Use lubridate pm() in R to test if a datetime falls at or after noon. Returns TRUE for PM, FALSE for AM. Vectorised; pairs with am() for clean splits."
keywords: "lubridate pm, pm function R, lubridate pm examples, R pm check, after noon test R, lubridate am pm, is datetime PM"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "lubridate-functions"
fr_parent: "lubridate-in-R.html"
auto_link_terms: "pm()|lubridate pm|lubridate::pm()|after noon test|PM check"
auto_link_case_sensitive: true
target_keyword: "lubridate pm"
sibling_block_enabled: true
difficulty: "Beginner"
---

# lubridate pm() in R: Test if a Datetime is After Noon

<p class="lead">The <code>pm()</code> function in lubridate returns <code>TRUE</code> when a datetime falls at or after noon and <code>FALSE</code> otherwise. It is fully vectorised, accepts POSIXct or POSIXlt input, and pairs with <code>am()</code> to partition a timestamp column into mutually exclusive halves without parsing strings.</p>

[QUICK ANSWER]
pm(ymd_hms("2024-07-15 14:30:00"))           # TRUE (after noon)
pm(ymd_hms("2024-07-15 12:00:00"))           # TRUE (noon counts as PM)
pm(ymd_hms("2024-07-15 11:59:59"))           # FALSE (still AM)
pm(c(ts1, ts2, ts3))                         # vectorised over a column
df %>% mutate(is_pm = pm(ts))                # add a logical flag
df %>% filter(pm(ts))                        # keep PM rows only
df %>% group_by(half = if_else(pm(ts), "PM", "AM"))  # bucket by half
table(pm(events$ts))                         # AM vs PM counts

[DECISION TREE: Is pm() the right tool?]
- flag rows as after-noon or before-noon: pm(x), am(x)
- get the hour 0 to 23 as an integer: hour(x)
- check business hours 9 to 17: between(hour(x), 9, 16)
- bucket morning vs afternoon vs evening: cut(hour(x), c(-Inf, 12, 17, Inf))
- snap a timestamp to the start of an hour: floor_date(x, "hour")
- format with an AM/PM suffix for display: format(x, "%I:%M %p")
- check if a date falls on a weekend: wday(x) %in% c(1, 7)

## What pm() does in one sentence

**`pm()` returns `TRUE` when the hour component of a datetime is 12 or greater.** Pass any POSIXct or POSIXlt vector and you receive a logical vector of the same length: `TRUE` for noon through 23:59:59, `FALSE` from midnight to 11:59:59.

This is the lubridate counterpart to `hour(x) >= 12`. The `pm()` form is shorter, expresses intent directly, and slots into `filter()`, `if_else()`, and `group_by()` without you rewriting the comparison every time. Its partner `am()` returns the negation, so the two together split any datetime column into a clean partition.

## Syntax

**`pm(x)` accepts a datetime vector and returns a logical vector of the same length.** There are no optional arguments and no replacement form. The function is a thin predicate over the hour component, so behaviour is identical whether the input has a date component, a timezone, or sub-second precision.

```r title="Load lubridate and test a datetime"
library(lubridate)

pm(ymd_hms("2024-07-15 14:30:00"))
#> [1] TRUE

pm(ymd_hms("2024-07-15 09:00:00"))
#> [1] FALSE

class(pm(ymd_hms("2024-07-15 14:30:00")))
#> [1] "logical"
```

The input must be a class lubridate recognises as a datetime: `POSIXct` or `POSIXlt`. Plain `Date` objects have no time component, so `pm(as.Date("2024-07-15"))` returns `FALSE` after silent coercion to midnight UTC. The answer is technically correct but rarely useful; parse with `ymd_hms()` first so the time of day survives.

[TIP]
**Use `pm()` directly inside `filter()` and `if_else()`; never wrap it in `== TRUE`.** Because the return is already logical, `filter(df, pm(ts))` and `if_else(pm(ts), "PM", "AM")` work without further comparison. Wrapping it in `== TRUE` is redundant and trips lint warnings in production code.

## Six common patterns

### 1. Test a single datetime

```r title="Single PM check"
ts <- ymd_hms("2024-07-15 15:45:00")
pm(ts)
#> [1] TRUE
```

The result is a single logical value. Use it in any `if (...)` branch the way you would use any boolean: `if (pm(ts)) "afternoon shift" else "morning shift"`.

### 2. Handle the noon and midnight edges

```r title="Noon is PM, midnight is AM"
pm(ymd_hms("2024-07-15 12:00:00"))
#> [1] TRUE

pm(ymd_hms("2024-07-15 11:59:59"))
#> [1] FALSE

pm(ymd_hms("2024-07-15 00:00:00"))
#> [1] FALSE
```

The 12:00:00 boundary belongs to PM, so `pm()` returns `TRUE` at exact noon. The 11:59:59 second is still AM. Midnight at 00:00:00 returns `FALSE` because hour zero is below the noon threshold. This convention matches ISO 8601 and base R, so swapping between `pm(x)` and `hour(x) >= 12` gives identical results.

### 3. Vectorise over a datetime column

```r title="Vectorised over a column"
events <- ymd_hms(c("2024-07-15 09:30:00",
                    "2024-07-15 12:00:00",
                    "2024-07-15 14:15:00",
                    "2024-07-15 20:40:00"))
pm(events)
#> [1] FALSE  TRUE  TRUE  TRUE
```

`pm()` is fully vectorised. A million-row timestamp column becomes a million-row logical vector in one call. No loop or `sapply()` needed. Notice that 12:00:00 returns `TRUE`: noon counts on the PM side of the partition.

### 4. Add a PM flag inside a dplyr pipeline

```r title="Mutate a PM flag column"
library(dplyr)

tickets <- tibble(
  ts = ymd_hms(c("2024-07-15 08:05:00", "2024-07-15 11:48:00",
                 "2024-07-15 13:22:00", "2024-07-15 16:30:00",
                 "2024-07-15 19:55:00")),
  priority = c("low", "low", "high", "high", "critical")
)

tickets %>%
  mutate(is_pm = pm(ts))
#> # A tibble: 5 x 3
#>   ts                  priority is_pm
#>   <dttm>               <chr>   <lgl>
#> 1 2024-07-15 08:05:00  low     FALSE
#> 2 2024-07-15 11:48:00  low     FALSE
#> 3 2024-07-15 13:22:00  high    TRUE
#> 4 2024-07-15 16:30:00  high    TRUE
#> 5 2024-07-15 19:55:00  critical TRUE
```

`mutate(is_pm = pm(ts))` adds a logical flag column you can pass downstream into filters, plots, or feature engineering. In a support-ticket context, pairing `is_pm` with priority counts surfaces escalation patterns in two lines of code.

### 5. Bucket rows by AM and PM, then summarise

```r title="Compare AM and PM ticket load"
tickets %>%
  group_by(half = if_else(pm(ts), "PM", "AM")) %>%
  summarise(tickets = n(),
            high_priority = sum(priority %in% c("high", "critical")),
            .groups = "drop")
#> # A tibble: 2 x 3
#>   half  tickets high_priority
#>   <chr>   <int>         <int>
#> 1 AM          2             0
#> 2 PM          3             3
```

`if_else(pm(ts), "PM", "AM")` produces a clean character bucket that groups intuitively. In this run, every PM ticket is high or critical priority, so flagging the half-of-day is often the first cut that separates routine intake from escalation work.

### 6. Filter to afternoon and evening rows

```r title="Keep PM rows only"
tickets %>%
  filter(pm(ts))
#> # A tibble: 3 x 2
#>   ts                  priority
#>   <dttm>               <chr>
#> 1 2024-07-15 13:22:00  high
#> 2 2024-07-15 16:30:00  high
#> 3 2024-07-15 19:55:00  critical
```

`filter(pm(ts))` is the cleanest expression of "keep afternoon and evening records". Reach for `filter(am(ts))` for the inverse, or `filter(!pm(ts))` if the negation reads better in context. Both compile to the same plan.

[KEY INSIGHT]
**`pm()` and `am()` are exact opposites for any non-NA datetime: `am(x) == !pm(x)` always holds.** The split is at noon, with noon belonging to PM. The pair is a true partition: `pm(x) | am(x)` is `TRUE` for every valid datetime and `pm(x) & am(x)` is `FALSE`. Pick whichever predicate reads more naturally; the result is identical.

## pm() vs !am() vs hour() vs format()

**Four common ways to ask "is this datetime in the afternoon or evening?", each with a different return type.** Pick the one that matches your downstream use:

| Approach | Returns | When to use |
|---|---|---|
| `pm(x)` | Logical | Filtering, grouping, `if_else()` flags |
| `!am(x)` | Logical | Same as `pm()`; use when the negation of an AM predicate reads cleaner |
| `hour(x) >= 12` | Logical | When you also need the actual hour later in the chain |
| `format(x, "%p")` | "AM" / "PM" string | Display in a printed report or chart label |

```r title="Four ways to express the same split"
ts <- ymd_hms(c("2024-07-15 09:00:00", "2024-07-15 14:30:00"))
pm(ts)
#> [1] FALSE  TRUE
!am(ts)
#> [1] FALSE  TRUE
hour(ts) >= 12
#> [1] FALSE  TRUE
format(ts, "%p")
#> [1] "AM" "PM"
```

The three logical methods are interchangeable for filtering and grouping. Use `format(x, "%p")` only when you need text for a chart label or a printed table; otherwise stay logical to keep downstream operations cheap.

## Common pitfalls

**Pitfall 1: forgetting that noon belongs to PM.** A timestamp recorded as `2024-07-15 12:00:00` returns `TRUE` from `pm()`. If your team treats noon as "AM" or "midday" rather than PM, document the convention; otherwise a meeting that starts at exactly 12:00 gets bucketed with afternoon meetings and the AM count comes up short by one.

**Pitfall 2: passing a Date object.** `pm(as.Date("2024-07-15"))` returns `FALSE` because Date has no time component and lubridate coerces to midnight UTC. The answer is technically correct but uninformative. If you need a real PM check, parse the source string with `ymd_hms()` or `as.POSIXct()` so the time survives the conversion.

**Pitfall 3: rolling a string check instead of using the predicate.** Some teams write `format(ts, "%p") == "PM"`. This works but is fragile: locale changes can flip the string to lowercase or to a translated equivalent, and the cost is much higher than the predicate version. Stick with `pm(ts)`; it is locale-independent, vectorised, and one third the keystrokes.

[WARNING]
**Timezone shifts the PM result silently.** A timestamp stored as `2024-07-15 09:00:00 America/New_York` returns `FALSE` from `pm()`, but the same instant viewed as `2024-07-15 13:00:00 UTC` returns `TRUE`, while `2024-07-15 18:30:00 Asia/Kolkata` returns `TRUE` too. The function reads the hour from whatever tzone the vector carries. Pin the timezone with `with_tz()` BEFORE calling `pm()` if your data crosses zones.

[NOTE]
**Coming from Python pandas?** The equivalent of `pm(x)` is `s.dt.hour >= 12` on a datetime Series; pandas has no dedicated `pm()` accessor. The dplyr pattern `mutate(is_pm = pm(ts))` maps to `df.assign(is_pm=df.ts.dt.hour >= 12)`. The noon convention is the same in both languages.

## Try it yourself

**Try it:** Use the `tickets` tibble above and count how many high-or-critical tickets arrive in PM hours. Save the count to `ex_pm_high`.

```r title="Your turn: count high-priority PM tickets"
# Try it: count high-priority PM tickets
ex_pm_high <- # your code here

ex_pm_high
#> Expected: 3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_pm_high <- tickets %>%
  filter(pm(ts), priority %in% c("high", "critical")) %>%
  nrow()

ex_pm_high
#> [1] 3
```

**Explanation:** `filter(pm(ts), priority %in% c("high", "critical"))` chains two conditions with AND inside `filter()`. The first keeps PM rows, the second keeps elevated severities. `nrow()` returns the count of surviving rows.

</details>

## Related lubridate functions

After learning `pm()`, look at:

- `am()`: the inverse predicate, `TRUE` for midnight through 11:59:59
- `hour()`, `minute()`, `second()`: extract integer time-of-day components
- `wday()`, `mday()`, `yday()`: extract day-position numbers
- `floor_date()`, `ceiling_date()`: round a datetime to hour, day, week, or month
- `with_tz()`, `force_tz()`: shift or set the timezone before extracting parts
- `ymd_hms()`, `mdy_hms()`, `dmy_hms()`: parse strings into datetimes first

For the official reference, see the [lubridate am()/pm() documentation](https://lubridate.tidyverse.org/reference/am.html).

## FAQ

**How do I check if a datetime is PM in R?**

Use `lubridate::pm(x)` for a logical `TRUE`/`FALSE` answer, or `lubridate::am(x)` for the inverse. Both accept POSIXct or POSIXlt and are fully vectorised over a column. The base R alternative is `hour(x) >= 12`, which returns the same logical vector with one extra function call. For a printable "AM"/"PM" string suitable for a chart label, use `format(x, "%p")` instead.

**Does pm() in lubridate count noon as PM?**

Yes. `pm(ymd_hms("2024-07-15 12:00:00"))` returns `TRUE`, and `am(ymd_hms("2024-07-15 12:00:00"))` returns `FALSE`. The split is exact: hours 0 through 11 are AM, hours 12 through 23 are PM. This matches ISO 8601 and base R conventions, so any downstream comparison with `hour(x) >= 12` produces an identical result.

**Why does pm() return FALSE for a Date object in R?**

A `Date` has no time component, so lubridate silently coerces it to midnight UTC before evaluating the hour. Midnight is hour 0, which is below the noon threshold, so the result is `FALSE`. The answer is technically correct but rarely informative for downstream analysis. Parse the source string with `ymd_hms()` or `as.POSIXct()` first so the actual time of day survives.

**How do I filter a data frame to PM rows only in R?**

Use `dplyr::filter(df, pm(ts))` where `ts` is your datetime column. The `pm()` call returns a logical vector that `filter()` consumes directly. For AM rows, use `filter(df, am(ts))` or `filter(df, !pm(ts))`. Both produce the same result; choose whichever reads more naturally in context.

**Can I use pm() with timezones in R?**

Yes, but the function reads the hour from whatever tzone the vector carries. Convert with `with_tz()` BEFORE calling `pm()` if you want the PM check evaluated in a specific zone. For example, `pm(with_tz(x, "America/New_York"))` evaluates the New York hour, even if the stored timezone is UTC. Without an explicit shift, `Sys.timezone()` decides, which makes the answer machine-dependent.
