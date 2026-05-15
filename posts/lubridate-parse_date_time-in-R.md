---
title: "lubridate parse_date_time() in R: Multi-Format Parser"
slug: "lubridate-parse_date_time-in-R"
description: "lubridate parse_date_time() parses date strings with multiple possible formats via the orders argument. Examples cover mixed inputs, locale, truncated."
keywords: "lubridate parse_date_time, parse_date_time R, R multi-format date parser, parse_date_time orders, R parse mixed dates, lubridate parse_date_time examples, lubridate orders argument"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "lubridate-functions"
fr_parent: "lubridate-in-R.html"
auto_link_terms: "parse_date_time()|lubridate parse_date_time|lubridate::parse_date_time()|multi-format date parser|parse mixed date formats"
auto_link_case_sensitive: true
target_keyword: "lubridate parse_date_time"
sibling_block_enabled: true
difficulty: "Beginner"
---

# lubridate parse_date_time() in R: Multi-Format Parser

<p class="lead">lubridate <code>parse_date_time()</code> parses date strings when the format varies between rows or is unknown ahead of time. The <code>orders</code> argument accepts one or more format tokens and the function returns a POSIXct vector.</p>

[QUICK ANSWER]
parse_date_time(x, orders = "ymd")                # single format
parse_date_time(x, orders = c("ymd","mdy","dmy")) # try several
parse_date_time(x, orders = "ymd HMS")            # with time
parse_date_time(x, orders = "ymd", tz = "UTC")    # with timezone
parse_date_time(x, orders = "dmy", locale = "fr") # non-English
parse_date_time(x, orders = "ymd", truncated = 2) # allow partial
parse_date_time(x, orders = "ymd", exact = TRUE)  # strict tokens

[DECISION TREE: Is parse_date_time() the right tool?]
- multiple possible date formats: parse_date_time(x, orders = c("ymd","mdy"))
- one known format, year first: ymd(x) or ymd_hms(x)
- one known format, month first: mdy(x) or mdy_hms(x)
- one known format, day first: dmy(x) or dmy_hms(x)
- need timezone change on POSIXct: with_tz(x, "America/New_York")
- Excel serial number input: as.Date(x, origin = "1899-12-30")
- Unix timestamp input: as.POSIXct(x, origin = "1970-01-01")

## What parse_date_time() does in one sentence

**`parse_date_time(x, orders = ...)` tries each format in `orders` until one parses successfully, then returns a POSIXct vector.** Unlike `ymd()` and its sister functions, it does not assume a single format. You pass a list of possibilities and lubridate picks the first match per element.

This makes it the right tool whenever a column mixes formats, when source data quality is uncertain, or when locale and time-of-day pieces vary across rows.

## Syntax: the orders argument

**The `orders` argument is the single most important parameter.** Pass a character string for a single format, or a character vector for several. Each token combines lubridate's letter codes for date pieces (`y`, `m`, `d`) and time pieces (`H`, `M`, `S`, `I`, `p`).

```r title="Single order vs vector of orders"
library(lubridate)

parse_date_time("15-Jan-2024", orders = "dmy")
#> [1] "2024-01-15 UTC"

parse_date_time(c("2024-01-15", "15-Jan-2024"),
                orders = c("ymd", "dmy"))
#> [1] "2024-01-15 UTC" "2024-01-15 UTC"
```

The order list is tried left to right. Put your most likely format first so most rows parse on the first attempt.

[TIP]
**Combine date and time codes in one order token.** `"ymd HMS"` parses "2024-01-15 14:30:45" without splitting the string. Space inside the token matches one or more whitespace characters in the input.

## Five common parsing patterns

**Five recurring patterns cover almost every real-world use case for parse_date_time().** Each one isolates a feature that the lighter `ymd()` family does not expose.

### 1. Multiple possible formats in one column

```r title="Parse mixed date formats with one call"
mixed <- c("2024-01-15", "01/15/2024", "15 Jan 2024")
parse_date_time(mixed, orders = c("ymd", "mdy", "dmy"))
#> [1] "2024-01-15 UTC" "2024-01-15 UTC" "2024-01-15 UTC"
```

When source data comes from multiple producers, each row may use a different ordering. A vector of orders solves this in one call.

### 2. Dates plus times

```r title="Order codes that include time components"
parse_date_time("2024-01-15 14:30:45", orders = "ymd HMS")
#> [1] "2024-01-15 14:30:45 UTC"

parse_date_time("2024-01-15 14:30", orders = "ymd HM")
#> [1] "2024-01-15 14:30:00 UTC"

parse_date_time("Jan 15 2024 2:30 PM", orders = "mdy IMp")
#> [1] "2024-01-15 14:30:00 UTC"
```

`H` is 24-hour, `I` is 12-hour with `p` for AM/PM. Use `M` for minutes, `S` for seconds.

### 3. Set a timezone at parse time

```r title="Specify timezone during parsing"
parse_date_time("2024-01-15 09:00:00",
                orders = "ymd HMS",
                tz = "America/New_York")
#> [1] "2024-01-15 09:00:00 EST"
```

Default is UTC. Pass `tz = "America/New_York"` (or any value from `OlsonNames()`) to interpret the string in a specific zone.

### 4. Non-English month names

```r title="Parse French month names with locale"
fr_dates <- c("15 janvier 2024", "20 mars 2024")
parse_date_time(fr_dates, orders = "dmy", locale = "fr_FR")
#> [1] "2024-01-15 UTC" "2024-03-20 UTC"
```

`locale = "fr_FR"` swaps the month name dictionary. On Windows the locale string is OS specific (`"French_France"`); check `Sys.getlocale()` if the call errors.

### 5. Truncated dates

```r title="Allow truncated input with the truncated argument"
parse_date_time(c("2024-01-15", "2024-01", "2024"),
                orders = "ymd",
                truncated = 2)
#> [1] "2024-01-15 UTC" "2024-01-01 UTC" "2024-01-01 UTC"
```

`truncated = 2` lets the last 2 pieces of the order be missing. Missing pieces fill with sensible defaults (month 1, day 1, hour 0).

[KEY INSIGHT]
**parse_date_time is the engine; ymd, mdy, dmy are convenience wrappers.** Each `ymd_*` function is essentially `parse_date_time(x, orders = "ymd_*", quiet = TRUE)`. When the wrappers feel too restrictive, drop down to parse_date_time directly.

## parse_date_time vs ymd_* family: when each wins

**The lubridate parser family is a stack.** parse_date_time sits at the bottom; the named parsers wrap it for common cases. Pick the wrapper when the format is known and uniform; reach for parse_date_time when it is not.

| Use case | Right tool | Why |
|---|---|---|
| All rows use one known format | `ymd()`, `mdy()`, `dmy()` | Shorter call, same speed |
| Mixed formats across rows | `parse_date_time(orders = c(...))` | Only function that tries multiple |
| Truncated dates ("2024", "2024-01") | `parse_date_time(truncated = N)` | Wrappers fail on partial input |
| Non-English month names | `parse_date_time(locale = ...)` | Wrappers use the system locale only |
| Excel serial numbers | `as.Date(x, origin = ...)` | Not a string format |
| Strict format check | `parse_date_time(exact = TRUE)` | Refuses any token deviation |

For the canonical reference on every parameter, see [lubridate's parse_date_time documentation](https://lubridate.tidyverse.org/reference/parse_date_time.html).

## Common pitfalls

**Pitfall 1: silent NA on failed rows.** parse_date_time returns NA with a warning when a row matches no order. Check `sum(is.na(result))` immediately after parsing or chain a `stopifnot(!anyNA(result))` to fail loudly.

```r title="Failed parses become NA with a warning"
result <- parse_date_time(c("2024-01-15", "garbage"),
                          orders = "ymd")
#> Warning message:
#>  1 failed to parse.
result
#> [1] "2024-01-15 UTC" NA
```

**Pitfall 2: order priority matters.** With `orders = c("dmy", "mdy")` and input `"01/02/2024"`, parse_date_time returns Feb 1 because `dmy` matches first. Reverse the orders or be explicit about the source convention.

**Pitfall 3: locale is OS dependent.** `"fr_FR"` works on macOS and Linux; on Windows the same locale is named `"French_France"`. Use `Sys.getlocale()` to see valid names on the current machine.

[WARNING]
**parse_date_time always returns POSIXct, not Date.** Even with date-only orders like `"ymd"`, the result includes a 00:00:00 time component. Cast with `as.Date()` if a pure Date is what downstream code expects.

## Try it yourself

**Try it:** Parse the three strings below into a single POSIXct vector. Each row uses a different ordering. Save the result to `ex_dates`.

```r title="Your turn: parse mixed messy dates"
strings <- c("2024-02-29", "Feb 29 2024", "29/02/2024")

ex_dates <- # your code here

ex_dates
#> Expected: three identical POSIXct values for 2024-02-29
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_dates <- parse_date_time(
  c("2024-02-29", "Feb 29 2024", "29/02/2024"),
  orders = c("ymd", "mdy", "dmy")
)
ex_dates
#> [1] "2024-02-29 UTC" "2024-02-29 UTC" "2024-02-29 UTC"
```

**Explanation:** Each input matches a different order. parse_date_time tries `ymd` first; rows that fail fall through to `mdy`, then `dmy`. All three land on the same POSIXct value.

</details>

## Related lubridate functions

After mastering parse_date_time, look at:

- `ymd()`, `mdy()`, `dmy()`: shorter syntax when the format is known
- `ymd_hms()`, `ymd_hm()`, `ymd_h()`: date plus time wrappers
- `fast_strptime()`: faster than parse_date_time when the format is fixed
- `with_tz()`, `force_tz()`: convert or override a timezone after parsing
- `year()`, `month()`, `day()`, `wday()`: extract components from the parsed result
- `floor_date()`, `ceiling_date()`: round to a unit

## FAQ

**What is the difference between parse_date_time and ymd in R?**

`ymd()` accepts year-month-day input only; it errors or returns NA on other orderings. `parse_date_time(x, orders = c("ymd", "mdy"))` tries multiple formats and picks the first match. Use ymd when the format is known and uniform; use parse_date_time when rows may differ or the format is uncertain.

**How do I parse dates with multiple formats in R?**

Pass a character vector to the `orders` argument: `parse_date_time(x, orders = c("ymd", "mdy", "dmy"))`. lubridate tries each order in turn for every element and returns the first successful parse. Put the most likely format first for best performance.

**How do I parse non-English dates with lubridate?**

Use the `locale` argument: `parse_date_time(x, orders = "dmy", locale = "fr_FR")` parses French month names. The exact locale string depends on the OS. On Windows try `"French_France"`; on macOS and Linux `"fr_FR"` works. Run `Sys.getlocale()` to see what is installed.

**Why does parse_date_time return POSIXct instead of Date?**

parse_date_time always returns POSIXct so it can carry time and timezone information uniformly. When you only need a Date, wrap the call in `as.Date()`. For example, `as.Date(parse_date_time(x, "ymd"))` gives a plain Date vector.

**What does the truncated argument do in parse_date_time?**

`truncated = N` lets the last N pieces of the order be missing from the input. With `orders = "ymd"` and `truncated = 2`, the strings "2024", "2024-01", and "2024-01-15" all parse, with missing pieces filling as month 1 and day 1. Use it when source rows have varying precision.
