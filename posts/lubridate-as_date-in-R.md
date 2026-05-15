---
title: "lubridate as_date() in R: Convert Inputs to Date Objects"
slug: "lubridate-as_date-in-R"
description: "lubridate as_date() converts strings, POSIXct date-times, and numeric values into Date objects in R. Examples cover input types, time zones, and pitfalls."
keywords: "lubridate as_date, as_date function R, lubridate as_date examples, R as_date convert, as_date vs as.Date, R POSIXct to Date, lubridate date coercion"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "lubridate-functions"
fr_parent: "lubridate-in-R.html"
auto_link_terms: "as_date()|lubridate as_date|lubridate::as_date()|convert to Date|POSIXct to Date"
auto_link_case_sensitive: true
target_keyword: "lubridate as_date"
sibling_block_enabled: true
difficulty: "Beginner"
---

# lubridate as_date() in R: Convert Inputs to Date Objects

<p class="lead">The lubridate <code>as_date()</code> function coerces strings, POSIXct date-times, numeric values, and existing dates into a clean <code>Date</code> object. It is the safer, type-aware replacement for base R's <code>as.Date()</code> with sensible defaults across every input type.</p>

[QUICK ANSWER]
as_date("2024-01-15")                                # parse ymd string
as_date(c("2024-01-15", "2024-02-20"))               # parse vector
as_date("01/15/2024", format = "%m/%d/%Y")           # explicit format
as_date(as.POSIXct("2024-01-15 23:30:00", tz="UTC")) # strip time
as_date(now(), tz = "America/New_York")              # date in your tz
as_date(19367)                                       # days since 1970-01-01
as_date(as.Date("2024-01-15"))                       # Date passthrough

[DECISION TREE: Is as_date() the right tool?]
- coerce mixed inputs to Date: as_date(x)
- parse a string with known order (ymd, mdy, dmy): ymd(x), mdy(x), dmy(x)
- parse with a fixed strptime format: fast_strptime(x, format)
- parse multiple possible formats: parse_date_time(x, orders = c(...))
- get a date-time (not a date): as_datetime(x)
- get current date: today()
- Excel serial date: as_date(x, origin = "1899-12-30")

## What as_date() does in one sentence

**`as_date(x)` converts `x` to a `Date` object using a method dispatched on the input class.** Strings are parsed as year-month-day, POSIXct values are stripped to their calendar date, and numerics are interpreted as days since 1970-01-01.

This single function replaces three base R idioms: `as.Date(x)`, `as.Date(x, origin = "1970-01-01")`, and `as.Date(format(x, "%Y-%m-%d"))`. It is the workhorse coercion for any column you suspect should be a date.

## Syntax

**`as_date(x, tz = NULL, format = NULL, origin = lubridate::origin)`. `x` is the input; `tz` controls which time zone defines the calendar date; `format` overrides ymd parsing for character input.**

```r title="Load lubridate and convert a string"
library(lubridate)

as_date("2024-01-15")
#> [1] "2024-01-15"

class(as_date("2024-01-15"))
#> [1] "Date"
```

The default behavior reads strings as year first, month second, day third. Anything else needs the `format` argument or one of the explicit parsers like `mdy()` or `dmy()`.

## Convert different input types

### 1. Character string

```r title="Parse a single ymd string"
as_date("2024-01-15")
#> [1] "2024-01-15"

as_date("2024/01/15")
#> [1] "2024-01-15"

as_date("20240115")
#> [1] "2024-01-15"
```

`as_date()` is forgiving about separators. Hyphens, slashes, dots, and no-separator compact forms all parse as long as the order is year-month-day.

### 2. Vector of strings

```r title="Vectorized coercion"
dates <- c("2024-01-15", "2024-02-20", "2024-03-25")
as_date(dates)
#> [1] "2024-01-15" "2024-02-20" "2024-03-25"
```

The function is vectorized and returns a Date vector of the same length. Any unparseable element becomes `NA` with a warning.

### 3. POSIXct date-time

```r title="Strip time from a POSIXct value"
ts <- as.POSIXct("2024-01-15 23:30:00", tz = "UTC")

as_date(ts)
#> [1] "2024-01-15"

as_date(ts, tz = "America/New_York")
#> [1] "2024-01-15"
```

When the input is a date-time, `as_date()` extracts the calendar date. The `tz` argument controls which time zone defines that date. Without `tz`, the date is computed in UTC.

[WARNING]
**Time zone matters when stripping time.** A POSIXct of 2024-01-15 23:30 UTC becomes 2024-01-15 in UTC but 2024-01-16 in Asia/Tokyo. Always pass `tz` if your data was stored in a non-UTC zone, otherwise dates near midnight will silently shift.

### 4. Numeric (days since 1970)

```r title="Numeric input uses 1970-01-01 origin"
as_date(0)
#> [1] "1970-01-01"

as_date(19738)
#> [1] "2024-01-15"

as_date(-365)
#> [1] "1969-01-01"
```

Numeric input is treated as days since the Unix epoch. This makes `as_date()` a one-step replacement for `as.Date(x, origin = "1970-01-01")`.

### 5. Already-Date passthrough

```r title="Idempotent on Date input"
d <- as.Date("2024-01-15")
as_date(d)
#> [1] "2024-01-15"

identical(as_date(d), d)
#> [1] TRUE
```

Passing a Date returns the same Date. This makes `as_date()` safe inside data pipelines where some columns may already be the target type.

## as_date() vs as.Date() vs ymd()

[NOTE]
**Three near-identical names, three different defaults.** `as_date()` dispatches on input class, `as.Date()` requires explicit `origin` for numerics and `format` for non-ISO strings, and `ymd()` only accepts character or factor input. Use the comparison table below to pick correctly.

| Function | Inputs accepted | String default | Numeric origin |
|---|---|---|---|
| `lubridate::as_date()` | character, POSIXt, Date, numeric, factor | ymd auto-detect | 1970-01-01 |
| `base::as.Date()` | character, POSIXct, factor | `"%Y-%m-%d"` | none, must pass |
| `lubridate::ymd()` | character, factor | year-month-day | not applicable |
| `lubridate::as_datetime()` | character, Date, numeric | ymd_hms | seconds since 1970 |

**Decision rule.** If you have mixed input types or unknown class, use `as_date()`. If you know you have a string in a specific order, prefer `ymd()`, `mdy()`, or `dmy()` for clearer intent. If you need a date-time, use `as_datetime()`.

## Common pitfalls

```r title="Three traps to avoid"
as_date("01/15/2024")
#> [1] NA
#> Warning: All formats failed to parse.

as_date("01/15/2024", format = "%m/%d/%Y")
#> [1] "2024-01-15"

bad_tz <- as.POSIXct("2024-01-15 23:30:00", tz = "Asia/Tokyo")
as_date(bad_tz)
#> [1] "2024-01-15"
as_date(bad_tz, tz = "Asia/Tokyo")
#> [1] "2024-01-15"
```

Three traps catch most users. First, non-ymd strings return `NA`; pass `format` or use `mdy()`/`dmy()`. Second, POSIXct values near midnight shift dates if you forget `tz`. Third, factor input works but character is more predictable; convert factors with `as.character()` first if results look strange.

[TIP]
**Pair `as_date()` with `dplyr::mutate()` for type-safe imports.** When reading CSVs that store dates as strings, do `df |> mutate(date = as_date(date))` once at the top of the pipeline. Every downstream date function then works without surprise, because the column class is guaranteed.

## Try it yourself

**Try it:** Convert a vector of three string dates and a POSIXct value into a single Date vector. Save it to `ex_dates`.

```r title="Your turn: coerce mixed inputs"
# Try it: combine string and POSIXct conversions
strings <- c("2024-01-15", "2024-02-20", "2024-03-25")
ts <- as.POSIXct("2024-04-30 14:00:00", tz = "UTC")

ex_dates <- # your code here

ex_dates
#> Expected: 4 dates from 2024-01-15 to 2024-04-30
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_dates <- c(as_date(strings), as_date(ts))
ex_dates
#> [1] "2024-01-15" "2024-02-20" "2024-03-25" "2024-04-30"
length(ex_dates)
#> [1] 4
```

**Explanation:** `as_date()` returns a Date vector for both inputs, so `c()` concatenates them without coercion to character. Mixing classes inside `c()` would silently convert to character; coercing first guarantees a clean Date vector.

</details>

## Related lubridate functions

- `ymd()`, `mdy()`, `dmy()`: explicit string parsers when you know the date part order.
- `ymd_hms()`, `mdy_hms()`, `dmy_hms()`: same for date-time strings.
- `as_datetime()`: returns POSIXct instead of Date.
- `today()`: current date in your local time zone, equivalent to `as_date(now())`.
- `parse_date_time()`: handles vectors with multiple possible formats.

## FAQ

**What is the difference between as_date() and as.Date() in R?**

`as_date()` is lubridate's coercion function and dispatches on input class. It accepts character, POSIXct, numeric, and Date inputs with sensible defaults: ymd parsing for strings, 1970-01-01 origin for numerics, time-zone-aware stripping for date-times. Base R's `as.Date()` requires an explicit `origin` for numerics and an explicit `format` for non-ISO strings, and it errors on common shapes that `as_date()` handles silently.

**Does as_date() handle time zones correctly?**

Yes, but you must pass the `tz` argument when the input is POSIXct. Without `tz`, the calendar date is computed in UTC, which can shift dates by one day for values near midnight in non-UTC zones. Always specify `tz` when your timestamps come from a known zone, for example `as_date(ts, tz = "America/New_York")`.

**Can as_date() parse non-ISO date strings?**

Yes, with the `format` argument. By default it expects year-month-day order. For other orders, either pass `format = "%m/%d/%Y"` (or whatever strptime format applies) or use the explicit parsers `mdy()` and `dmy()`. The explicit parsers communicate intent more clearly to the next reader of your code.

**What does as_date(0) return?**

`as_date(0)` returns `"1970-01-01"`, the Unix epoch. Numeric input is treated as days since 1970-01-01. This is useful when reading data exported from systems that store dates as integer day offsets, such as some database extracts or Excel sheets after numeric formatting.

**Should I use as_date() or ymd() for parsing strings?**

Use `ymd()` (or `mdy()`/`dmy()`) when you know the input is a string with a specific order. The function name documents intent. Use `as_date()` when the input could be a string OR another type, such as inside a function that accepts mixed arguments. Both produce the same Date result for valid ymd strings.
