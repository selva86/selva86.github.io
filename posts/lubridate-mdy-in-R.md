---
title: "lubridate mdy() in R: Parse Month-First Date Strings"
slug: "lubridate-mdy-in-R"
description: "Use lubridate mdy() to parse month-first date strings like 01/15/2024 and 'Jan 15, 2024' into R Date objects. Examples, syntax, timezones, and pitfalls."
keywords: "lubridate mdy, R mdy function, parse month-first date R, mdy lubridate examples, R date from string, lubridate mdy vs ymd, mdy lubridate timezone"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "lubridate-functions"
fr_parent: "lubridate-in-R.html"
auto_link_terms: "mdy()|lubridate mdy|lubridate::mdy()|month-first date|parse month-first date"
auto_link_case_sensitive: true
target_keyword: "lubridate mdy"
sibling_block_enabled: true
difficulty: "Beginner"
---

# lubridate mdy() in R: Parse Month-First Date Strings

<p class="lead">The <code>mdy()</code> function in lubridate parses month-first date strings (like "01/15/2024" or "January 15, 2024") into R <code>Date</code> objects. It auto-detects common separators and accepts both numeric and text month names.</p>

[QUICK ANSWER]
mdy("01/15/2024")                          # US slash format
mdy("January 15, 2024")                    # full month name
mdy("Jan 15 2024")                         # abbreviated month
mdy("01-15-2024")                          # dash separator
mdy(c("01/15/2024", "03/20/2024"))         # vector input
mdy_hms("01/15/2024 14:30:00")             # date plus time
mdy("01/15/2024", tz = "America/Chicago")  # with timezone

[DECISION TREE: Is mdy() the right parser?]
- US month-first dates: mdy("01/15/2024")
- year-first ISO format: ymd("2024-01-15")
- European day-first: dmy("15/01/2024")
- date plus time: mdy_hms() or mdy_hm()
- mixed orderings in one vector: parse_date_time(x, orders = c("mdy","ymd"))
- Excel serial date numbers: as.Date(44927, origin = "1899-12-30")
- strict known format: as.Date(x, format = "%m/%d/%Y")

## What mdy() does in one sentence

**`mdy("01/15/2024")` reads a month-first string and returns a Date object.** lubridate detects separators (`/`, `-`, `.`, space), accepts numeric or text month names, and is forgiving about padding (`1` and `01` both work).

This parser exists because most American data sources write dates month-first. Spreadsheets, US government feeds, healthcare records, and many CRM exports default to this convention. Reach for `mdy()` whenever you trust the data follows that ordering.

## Syntax

**`mdy(x, tz = NULL, locale = ..., quiet = FALSE)`. `x` is a character vector, factor, or numeric date.**

```r title="Parse a few mdy variants"
library(lubridate)

mdy("01/15/2024")
#> [1] "2024-01-15"

mdy("January 15, 2024")
#> [1] "2024-01-15"

mdy("Jan-15-2024")
#> [1] "2024-01-15"
```

[TIP]
**Parse early in your pipeline.** Once strings become real `Date` objects, every downstream step (sorting, filtering, plotting, joining) works correctly. Leaving raw strings around forces every consumer to re-parse and risks inconsistent results across scripts.

## Five common patterns

### 1. US slash dates

```r title="Standard US format"
mdy("01/15/2024")
#> [1] "2024-01-15"

class(mdy("01/15/2024"))
#> [1] "Date"
```

The most common case. Output is always ISO-ordered ("2024-01-15") regardless of the input ordering.

### 2. Text month names

```r title="Full and abbreviated month text"
mdy("January 15, 2024")
#> [1] "2024-01-15"

mdy("Jan 15 2024")
#> [1] "2024-01-15"

mdy(c("Feb 1 2024", "Mar 12 2024", "Apr 22 2024"))
#> [1] "2024-02-01" "2024-03-12" "2024-04-22"
```

lubridate recognizes both full ("January") and three-letter ("Jan") month names. The comma after the day is optional.

### 3. Date plus time with mdy_hms

```r title="Parse month-first datetimes"
mdy_hms("01/15/2024 14:30:00")
#> [1] "2024-01-15 14:30:00 UTC"

mdy_hm("01/15/2024 14:30")
#> [1] "2024-01-15 14:30:00 UTC"
```

`mdy_hms()` returns a POSIXct (date plus time) instead of a Date. Use `mdy_hm()` for hour and minute only, `mdy_h()` for hour only.

### 4. Vector inputs with mixed separators

```r title="Parse a column of dates at once"
raw_dates <- c("01/15/2024", "03-20-2024", "Apr 7 2024", "5/11/2024")
mdy(raw_dates)
#> [1] "2024-01-15" "2024-03-20" "2024-04-07" "2024-05-11"
```

`mdy()` is vectorized. Mixed separators within the vector parse correctly, so messy CSV columns rarely need pre-cleaning.

### 5. Specify a US timezone

```r title="Datetime with timezone"
mdy_hms("01/15/2024 09:00:00", tz = "America/Chicago")
#> [1] "2024-01-15 09:00:00 CST"
```

Without `tz`, lubridate defaults to UTC. Pass an Olson zone name to fix the interpretation. List all available zones with `OlsonNames()`.

[KEY INSIGHT]
**The parser's name encodes the ordering, not the separator.** `mdy()` accepts slashes, dashes, dots, and spaces. The function name is purely a hint about which token is the month. This keeps the API small: three short verbs (`mdy`, `ymd`, `dmy`) cover every realistic ordering.

## mdy() vs ymd() vs dmy() vs parse_date_time()

**Pick the parser whose name matches the ordering in your source data.**

| Parser | Ordering | Example input |
|---|---|---|
| `mdy()` | Month, day, year | `"01/15/2024"`, `"Jan 15 2024"` |
| `ymd()` | Year, month, day | `"2024-01-15"`, `"20240115"` |
| `dmy()` | Day, month, year | `"15/01/2024"`, `"15-Jan-2024"` |
| `parse_date_time()` | Multiple orderings | Mixed: tries each `orders=` option |

When you do not know the ordering or the data is genuinely mixed, fall back to `parse_date_time(x, orders = c("mdy","dmy","ymd"))`. It tries each format in turn and uses the first that succeeds.

## Common pitfalls

**Pitfall 1: US-versus-EU ambiguity.** `mdy("01/02/2024")` returns Jan 2; `dmy("01/02/2024")` returns Feb 1. The same string has two valid meanings. Confirm the source convention before picking the parser.

**Pitfall 2: two-digit years.** `mdy("01/15/24")` returns 2024, not 1924. lubridate applies a 30/70 cutoff: years "00" to "68" map to the 2000s, "69" to "99" map to the 1900s. Verify after parsing if your data crosses that boundary.

**Pitfall 3: silent NA on parse failure.** `mdy("not a date")` returns NA with a single warning. Always check `sum(is.na(parsed))` to catch malformed rows before they propagate.

[WARNING]
**Never trust an unsupervised parse.** Even with the right parser, a small fraction of real-world inputs will produce NA (locale mismatches, typos, empty strings). Always run `stopifnot(!any(is.na(parsed)))` or filter and report bad rows. Date bugs almost always trace back to a silent NA at the parse step.

## A practical mdy() workflow

**Most date pipelines that reach for `mdy()` follow the same five steps.**

1. **Read the raw column** as character (CSV imports often do this by default).
2. **Inspect a sample** of 5 to 10 rows to confirm month-first ordering.
3. **Parse with `mdy()`** (or `mdy_hms()` for datetimes).
4. **Validate** with `sum(is.na(parsed))` and inspect the failed rows.
5. **Extract components** with `year()`, `month()`, `day()` for grouping or filtering.

In a dplyr pipeline the same logic compresses to a single mutate block:

```r title="Parse and extract inside a dplyr pipeline"
library(dplyr)
library(lubridate)

sales <- data.frame(
  order_date = c("01/15/2024", "02/20/2024", "03/30/2024"),
  amount     = c(100, 250, 180)
)

sales |>
  mutate(
    order = mdy(order_date),
    month = month(order, label = TRUE)
  )
#>   order_date amount      order month
#> 1 01/15/2024    100 2024-01-15   Jan
#> 2 02/20/2024    250 2024-02-20   Feb
#> 3 03/30/2024    180 2024-03-30   Mar
```

Parsing inside `mutate()` keeps the raw string column around so you can spot-check any rows that failed to parse after the fact.

## Try it yourself

**Try it:** Parse "May 1 2024", "06/15/2024", "Jul 4, 2024" with `mdy()`. Save the result to `ex_mdy`.

```r title="Your turn: parse mixed US date formats"
strings <- c("May 1 2024", "06/15/2024", "Jul 4, 2024")

ex_mdy <- # your code here

ex_mdy
#> Expected: c(2024-05-01, 2024-06-15, 2024-07-04) as Date
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_mdy <- mdy(c("May 1 2024", "06/15/2024", "Jul 4, 2024"))
ex_mdy
#> [1] "2024-05-01" "2024-06-15" "2024-07-04"
```

**Explanation:** `mdy()` handles each variant in one call. Text months, numeric months, and mixed separators all parse correctly. The result is a `Date` vector.

</details>

## Related lubridate functions

After mastering `mdy()`, the most useful neighbors are:

- `ymd()`, `dmy()`: other order parsers
- `mdy_hms()`, `mdy_hm()`, `mdy_h()`: month-first datetimes
- `parse_date_time()`: multi-order fallback for messy inputs
- `year()`, `month()`, `day()`: extract date components
- `floor_date()`, `ceiling_date()`: round to day, week, or month
- `today()`, `now()`: current date or datetime

For date arithmetic on the parsed result, see `days()`, `months()`, and `years()` for friendlier offsets than base R's `seq.Date()`. The full reference is at [lubridate.tidyverse.org](https://lubridate.tidyverse.org/reference/index.html).

## FAQ

**How do I convert "01/15/2024" to a Date in R?**

Use `mdy("01/15/2024")` from the lubridate package. It returns a proper `Date` object that you can sort, filter, plot, and join on. No `format =` argument is needed; the parser handles common separators automatically.

**What is the difference between mdy and ymd in R?**

The two parsers differ only in the expected token ordering. `mdy()` reads month-first input ("01/15/2024"); `ymd()` reads year-first input ("2024-01-15"). Both return the same `Date` output. Pick the one whose name matches your source data.

**Why does mdy("01/02/2024") give January 2, not February 1?**

`mdy()` assumes the first token is the month, so it reads "01" as January and "02" as the day. If your data is European day-first, use `dmy()` instead. When the convention is unclear, inspect 5 to 10 rows of source data before choosing a parser.

**How do I parse "01/15/24" with a two-digit year?**

`mdy("01/15/24")` works. lubridate applies a 30/70 cutoff: years "00" to "68" become 2000-2068, "69" to "99" become 1969-1999. If your data uses a different convention, prepend the century manually before parsing.

**How do I handle parse failures from mdy()?**

Bad inputs return NA with a warning. Run `sum(is.na(mdy(x)))` to count failures, then `x[is.na(mdy(x))]` to see the offending strings. Common causes: empty strings, day-first inputs misrouted to `mdy()`, or non-date placeholders like "N/A".
