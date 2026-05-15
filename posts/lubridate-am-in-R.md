---
title: "lubridate am() in R: Test if a Datetime is Before Noon"
slug: "lubridate-am-in-R"
description: "Use lubridate am() in R to test if a datetime falls before noon. Returns TRUE for AM, FALSE for PM. Vectorised across columns; pairs with pm() for splits."
keywords: "lubridate am, am function R, lubridate am examples, R am pm check, before noon test R, lubridate am pm, is datetime AM"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "lubridate-functions"
fr_parent: "lubridate-in-R.html"
auto_link_terms: "am()|lubridate am|lubridate::am()|AM PM check|before noon test"
auto_link_case_sensitive: true
target_keyword: "lubridate am"
sibling_block_enabled: true
difficulty: "Beginner"
---

# lubridate am() in R: Test if a Datetime is Before Noon

<p class="lead">The <code>am()</code> function in lubridate returns <code>TRUE</code> when a datetime falls before noon and <code>FALSE</code> otherwise. It is fully vectorised, accepts POSIXct or POSIXlt values, and pairs with <code>pm()</code> to split timestamps into AM and PM buckets without parsing strings.</p>

[QUICK ANSWER]
am(ymd_hms("2024-07-15 09:00:00"))           # TRUE (before noon)
am(ymd_hms("2024-07-15 12:00:00"))           # FALSE (noon counts as PM)
am(c(ts1, ts2, ts3))                         # vectorised over a column
df %>% mutate(is_am = am(ts))                # add a logical flag
df %>% filter(am(ts))                        # keep AM rows only
df %>% group_by(period = if_else(am(ts), "AM", "PM"))  # AM/PM bucket
table(am(events$ts))                         # AM vs PM counts
pm(x)                                        # the inverse of am(x)

[DECISION TREE: Is am() the right tool?]
- flag rows as before-noon or after-noon: am(x), pm(x)
- get the actual hour 0 to 23 as an integer: hour(x)
- check business hours 9 to 17: between(hour(x), 9, 16)
- bucket morning vs afternoon vs evening: cut(hour(x), c(-Inf, 12, 17, Inf))
- snap a timestamp to the start of an hour: floor_date(x, "hour")
- format the time with an "AM"/"PM" suffix string: format(x, "%I:%M %p")
- check if a date is a weekend: wday(x) %in% c(1, 7)

## What am() does in one sentence

**`am()` returns `TRUE` when the hour component of a datetime is less than 12.** Pass any POSIXct or POSIXlt vector and you receive a logical vector of the same length: `TRUE` for midnight through 11:59:59, `FALSE` from noon to 23:59:59.

This is the lubridate counterpart to `hour(x) < 12`. The `am()` version is shorter, expresses intent directly, and slots straight into `filter()`, `if_else()`, and `group_by()` without rewriting the comparison every time. Its partner `pm()` returns the negation, so the two together split any datetime column into mutually exclusive halves.

## Syntax

**`am(x)` accepts a datetime vector and returns a logical vector of the same length.** There are no optional arguments and no replacement form. The function is a thin predicate over the hour component, so behaviour is identical whether the input has a date component, a timezone, or sub-second precision.

```r title="Load lubridate and test a datetime"
library(lubridate)

am(ymd_hms("2024-07-15 09:00:00"))
#> [1] TRUE

am(ymd_hms("2024-07-15 14:30:00"))
#> [1] FALSE

class(am(ymd_hms("2024-07-15 09:00:00")))
#> [1] "logical"
```

The input must be a class lubridate recognises as a datetime: `POSIXct` or `POSIXlt`. Plain `Date` objects have no time component, so `am(as.Date("2024-07-15"))` returns `TRUE` after silent coercion to midnight UTC. The result is technically correct but rarely informative; parse with `ymd_hms()` first so the time of day survives.

[TIP]
**Use `am()` directly inside `filter()` and `if_else()`; never wrap it in `== TRUE`.** Because the return is already logical, `filter(df, am(ts))` and `if_else(am(ts), "AM", "PM")` work without further comparison. Wrapping it in `== TRUE` is redundant and trips lint warnings in production code.

## Six common patterns

### 1. Test a single datetime

```r title="Single AM check"
ts <- ymd_hms("2024-07-15 09:30:00")
am(ts)
#> [1] TRUE
```

The result is a single logical value. Use it in any `if (...)` branch the way you would use any boolean: `if (am(ts)) "morning shift" else "afternoon shift"`.

### 2. Handle the noon and midnight edges

```r title="Noon is PM, midnight is AM"
am(ymd_hms("2024-07-15 12:00:00"))
#> [1] FALSE

am(ymd_hms("2024-07-15 00:00:00"))
#> [1] TRUE

am(ymd_hms("2024-07-15 11:59:59"))
#> [1] TRUE
```

The 12:00:00 boundary belongs to PM. The 11:59:59 second is still AM. The 00:00:00 midnight value is AM. This convention follows ISO 8601 and matches base R's behaviour, so swapping between `am(x)` and `hour(x) < 12` gives identical results.

### 3. Vectorise over a datetime column

```r title="Vectorised over a column"
events <- ymd_hms(c("2024-07-15 06:30:00",
                    "2024-07-15 11:45:00",
                    "2024-07-15 12:00:00",
                    "2024-07-15 18:10:00"))
am(events)
#> [1]  TRUE  TRUE FALSE FALSE
```

`am()` is fully vectorised. A million-row timestamp column becomes a million-row logical vector in one call. No loop or `sapply()` needed.

### 4. Add an AM flag inside a dplyr pipeline

```r title="Mutate an AM flag column"
library(dplyr)

orders <- tibble(
  ts = ymd_hms(c("2024-07-15 08:12:00", "2024-07-15 11:50:00",
                 "2024-07-15 13:04:00", "2024-07-15 17:33:00",
                 "2024-07-15 21:01:00")),
  amount = c(34.50, 12.10, 88.00, 22.40, 9.99)
)

orders %>%
  mutate(is_am = am(ts))
#> # A tibble: 5 x 3
#>   ts                  amount is_am
#>   <dttm>               <dbl> <lgl>
#> 1 2024-07-15 08:12:00  34.5  TRUE
#> 2 2024-07-15 11:50:00  12.1  TRUE
#> 3 2024-07-15 13:04:00  88.0  FALSE
#> 4 2024-07-15 17:33:00  22.4  FALSE
#> 5 2024-07-15 21:01:00   9.99 FALSE
```

`mutate(is_am = am(ts))` adds a logical flag column you can use downstream for filtering, faceted plots, or feature engineering. The column is `lgl`, not `int`, so summary functions like `sum(is_am)` count the `TRUE` rows directly.

### 5. Bucket rows into AM and PM groups

```r title="Compare AM and PM revenue"
orders %>%
  group_by(period = if_else(am(ts), "AM", "PM")) %>%
  summarise(revenue = sum(amount),
            orders  = n(),
            .groups = "drop")
#> # A tibble: 2 x 3
#>   period revenue orders
#>   <chr>    <dbl>  <int>
#> 1 AM        46.6      2
#> 2 PM       120.       3
```

`if_else(am(ts), "AM", "PM")` produces a clean character bucket that groups intuitively. The summarise block reveals a real retail pattern: afternoon and evening tend to drive higher revenue, even when AM has comparable transaction counts.

### 6. Filter to morning-only rows

```r title="Keep AM rows only"
orders %>%
  filter(am(ts))
#> # A tibble: 2 x 2
#>   ts                  amount
#>   <dttm>               <dbl>
#> 1 2024-07-15 08:12:00  34.5
#> 2 2024-07-15 11:50:00  12.1
```

`filter(am(ts))` is the cleanest expression of "keep morning records". Reach for `filter(pm(ts))` for the inverse, or `filter(!am(ts))` if the negation reads better in context. Both compile to the same plan.

[KEY INSIGHT]
**`am()` and `pm()` are exact opposites for any non-NA datetime: `pm(x) == !am(x)` always holds.** They are not "before noon" vs "after noon"; the split is at noon, with noon belonging to PM. This makes them a partition rather than a fuzzy region, so `am(x) | pm(x)` is `TRUE` for every valid datetime and `am(x) & pm(x)` is `FALSE`.

## am() vs pm() vs hour() vs format()

**Four common ways to ask "is this datetime in the morning?", each with a different return type.** Pick the one that matches your downstream use:

| Approach | Returns | When to use |
|---|---|---|
| `am(x)` | Logical | Filtering, grouping, `if_else()` flags |
| `pm(x)` | Logical | Same as `am()`, negated; use when "PM" reads more naturally |
| `hour(x) < 12` | Logical | When you also need the actual hour later in the chain |
| `format(x, "%p")` | "AM" / "PM" string | Display in a printed report or chart label |

```r title="Four ways to express the same split"
ts <- ymd_hms(c("2024-07-15 09:00:00", "2024-07-15 14:30:00"))
am(ts)
#> [1]  TRUE FALSE
pm(ts)
#> [1] FALSE  TRUE
hour(ts) < 12
#> [1]  TRUE FALSE
format(ts, "%p")
#> [1] "AM" "PM"
```

The three logical methods are interchangeable for filtering and grouping. Use `format(x, "%p")` only when you need text for a label or a printed table; otherwise stay logical to keep downstream operations cheap.

## Common pitfalls

**Pitfall 1: confusing the noon edge.** A timestamp recorded as `2024-07-15 12:00:00` returns `FALSE` from `am()`. If your team treats noon as "midday" rather than PM, document the convention; otherwise a meeting that starts at exactly 12:00 gets bucketed with afternoon meetings and the AM count comes up short by one.

**Pitfall 2: passing a Date object.** `am(as.Date("2024-07-15"))` returns `TRUE` because Date has no time component and lubridate coerces to midnight UTC. The answer is correct but uninformative. If you need a real AM check, parse the source with `ymd_hms()` or `as.POSIXct()` so the time survives the conversion.

**Pitfall 3: comparing strings instead of using the function.** Some teams roll their own check with `substr(format(ts, "%p"), 1, 2) == "AM"`. This works but is fragile: locale changes flip the string to lowercase, and the cost is much higher than the predicate version. Stick with `am(ts)`; it is locale-independent, vectorised, and one third the keystrokes.

[WARNING]
**Timezone shifts the AM result silently.** A timestamp stored as `2024-07-15 14:00:00 America/New_York` returns `FALSE` from `am()`, but the same instant viewed as `2024-07-15 18:00:00 UTC` also returns `FALSE`, while `2024-07-15 09:00:00 Asia/Kolkata` returns `TRUE`. The function reads the hour from whatever tzone the vector carries. Pin the timezone with `with_tz()` BEFORE calling `am()` if your data crosses zones.

[NOTE]
**Coming from Python pandas?** The equivalent of `am(x)` is `s.dt.hour < 12` on a datetime Series; pandas has no dedicated `am()` accessor. The `dplyr` pattern `mutate(is_am = am(ts))` maps to `df.assign(is_am=df.ts.dt.hour < 12)`. The noon convention is the same in both languages.

## Try it yourself

**Try it:** Use the `orders` tibble above and compute the average order amount separately for AM and PM. Save the result to `ex_am_pm`.

```r title="Your turn: average order by AM/PM"
# Try it: average order amount by AM/PM
ex_am_pm <- # your code here

ex_am_pm
#> Expected: 2 rows, AM mean 23.3, PM mean 40.1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_am_pm <- orders %>%
  group_by(period = if_else(am(ts), "AM", "PM")) %>%
  summarise(avg_amount = mean(amount), .groups = "drop")

ex_am_pm
#> # A tibble: 2 x 2
#>   period avg_amount
#>   <chr>       <dbl>
#> 1 AM           23.3
#> 2 PM           40.1
```

**Explanation:** `if_else(am(ts), "AM", "PM")` builds the bucket column inside `group_by()`. `summarise(avg_amount = mean(amount))` collapses each bucket to its average. The AM mean averages 34.50 and 12.10, and the PM mean averages 88.00, 22.40, and 9.99.

</details>

## Related lubridate functions

After learning `am()`, look at:

- `pm()`: the inverse predicate, `TRUE` for noon through 23:59:59
- `hour()`, `minute()`, `second()`: extract integer time-of-day components
- `wday()`, `mday()`, `yday()`: extract day-position numbers
- `floor_date()`, `ceiling_date()`: round a datetime to hour, day, week, or month
- `with_tz()`, `force_tz()`: shift or set the timezone before extracting parts
- `ymd_hms()`, `mdy_hms()`, `dmy_hms()`: parse strings into datetimes first

For the official reference, see the [lubridate am() documentation](https://lubridate.tidyverse.org/reference/am.html).

## FAQ

**How do I check if a datetime is AM or PM in R?**

Use `lubridate::am(x)` for a logical `TRUE`/`FALSE` answer, or `lubridate::pm(x)` for the inverse. Both accept POSIXct or POSIXlt and are fully vectorised. The base R alternative is `hour(x) < 12`, which returns the same logical vector with one extra function call. For a printable "AM"/"PM" string suitable for a chart label, use `format(x, "%p")` instead.

**Does am() in lubridate count noon as AM or PM?**

Noon counts as PM. `am(ymd_hms("2024-07-15 12:00:00"))` returns `FALSE`, and `pm(ymd_hms("2024-07-15 12:00:00"))` returns `TRUE`. The split is exact: hours 0 through 11 are AM, hours 12 through 23 are PM. This matches ISO 8601 and base R conventions.

**Why does am() return TRUE for a Date object in R?**

A `Date` has no time component, so lubridate silently coerces it to midnight UTC before evaluating the hour. Midnight is hour 0, which is less than 12, so the result is `TRUE`. The answer is technically correct but rarely informative for downstream analysis. Parse the source string with `ymd_hms()` or `as.POSIXct()` first so the time of day survives.

**How do I filter a data frame to AM rows only in R?**

Use `dplyr::filter(df, am(ts))` where `ts` is your datetime column. The `am()` call returns a logical vector that `filter()` consumes directly. For PM rows, use `filter(df, pm(ts))` or `filter(df, !am(ts))`. Both produce the same result; choose whichever reads more naturally in context.

**Can I use am() with timezones in R?**

Yes, but the function reads the hour from whatever tzone the vector carries. Convert with `with_tz()` BEFORE calling `am()` if you want the AM check evaluated in a specific zone. For example, `am(with_tz(x, "America/New_York"))` evaluates the New York hour, even if the stored timezone is UTC. Without an explicit shift, `Sys.timezone()` decides, which makes the answer machine-dependent.
