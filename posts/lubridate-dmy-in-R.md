---
title: "lubridate dmy() in R: Parse Day-First Date Strings"
slug: "lubridate-dmy-in-R"
description: "Use lubridate dmy() to parse day-first date strings like 15/01/2024 and '15 January 2024' into R Date objects. Examples, syntax, timezones, and pitfalls."
keywords: "lubridate dmy, R dmy function, parse day-first date R, dmy lubridate examples, European date parser R, dmy vs mdy, dmy lubridate timezone"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "lubridate-functions"
fr_parent: "lubridate-in-R.html"
auto_link_terms: "dmy()|lubridate dmy|lubridate::dmy()|day-first date|parse day-first date"
auto_link_case_sensitive: true
target_keyword: "lubridate dmy"
sibling_block_enabled: true
difficulty: "Beginner"
---

# lubridate dmy() in R: Parse Day-First Date Strings

<p class="lead">The <code>dmy()</code> function in lubridate parses day-first date strings (like "15/01/2024" or "15 January 2024") into R <code>Date</code> objects. It is the right parser for UK, European, Indian, and Australian data sources where the day comes before the month.</p>

[QUICK ANSWER]
dmy("15/01/2024")                          # European slash format
dmy("15 January 2024")                     # full month name
dmy("15-Jan-2024")                         # abbreviated month
dmy("15.01.2024")                          # German dot separator
dmy(c("15/01/2024", "20/03/2024"))         # vector input
dmy_hms("15/01/2024 14:30:00")             # date plus time
dmy("15/01/2024", tz = "Europe/London")    # with timezone

[DECISION TREE: Is dmy() the right parser?]
- European day-first dates: dmy("15/01/2024")
- US month-first dates: mdy("01/15/2024")
- year-first ISO format: ymd("2024-01-15")
- date plus time: dmy_hms() or dmy_hm()
- mixed orderings in one vector: parse_date_time(x, orders = c("dmy","mdy"))
- strict known format: as.Date(x, format = "%d/%m/%Y")
- Excel serial date numbers: as.Date(44927, origin = "1899-12-30")

## What dmy() does in one sentence

**`dmy("15/01/2024")` reads a day-first string and returns a Date object.** lubridate detects separators (`/`, `-`, `.`, space), accepts numeric or text month names, and is forgiving about padding (`1` and `01` both work).

This parser exists because most data sources outside the United States write dates day-first. UK government feeds, European bank exports, Indian e-commerce records, and Australian healthcare data all default to this convention. Reach for `dmy()` whenever you trust the data follows that ordering.

## Syntax

**`dmy(x, tz = NULL, locale = ..., quiet = FALSE)`. `x` is a character vector, factor, or numeric date.**

```r title="Parse a few dmy variants"
library(lubridate)

dmy("15/01/2024")
#> [1] "2024-01-15"

dmy("15 January 2024")
#> [1] "2024-01-15"

dmy("15-Jan-2024")
#> [1] "2024-01-15"
```

[TIP]
**Match the parser to the data origin, not the display.** A bank may print "15 Jan 2024" on a statement but export "01/15/2024" in the CSV. Inspect the raw file before picking dmy() versus mdy(). The first 5 rows usually settle it.

## Five common patterns

### 1. European slash dates

```r title="Standard UK and European format"
dmy("15/01/2024")
#> [1] "2024-01-15"

class(dmy("15/01/2024"))
#> [1] "Date"
```

The default for UK forms, French invoices, and most European spreadsheets. Output is always ISO-ordered ("2024-01-15") regardless of how the input was written.

### 2. Dot-separated German format

```r title="German and Scandinavian dot format"
dmy("15.01.2024")
#> [1] "2024-01-15"

dmy(c("01.05.2024", "20.11.2024"))
#> [1] "2024-05-01" "2024-11-20"
```

German, Swiss, and Nordic data sources use dots as separators. `dmy()` handles them without any extra arguments. This is the case base R's `as.Date()` typically fails on without a custom `format =` string.

### 3. Date plus time with dmy_hms

```r title="Parse day-first datetimes"
dmy_hms("15/01/2024 14:30:00")
#> [1] "2024-01-15 14:30:00 UTC"

dmy_hm("15/01/2024 14:30")
#> [1] "2024-01-15 14:30:00 UTC"
```

`dmy_hms()` returns a POSIXct (date plus time) instead of a Date. Use `dmy_hm()` for hour and minute only, `dmy_h()` for hour only. All three follow the same day-month-year ordering rule.

### 4. Text month names in mixed languages

```r title="Day with text month"
dmy("15 January 2024")
#> [1] "2024-01-15"

dmy("15-Mar-2024")
#> [1] "2024-03-15"

dmy(c("1 Feb 2024", "12 Apr 2024", "22 Jun 2024"))
#> [1] "2024-02-01" "2024-04-12" "2024-06-22"
```

lubridate recognizes English full month names ("January") and three-letter abbreviations ("Jan"). For non-English month names, pass `locale = "fr_FR.UTF-8"` (or the relevant locale) so "janvier" or "März" parse correctly.

### 5. Specify a European timezone

```r title="Datetime with timezone"
dmy_hms("15/01/2024 09:00:00", tz = "Europe/London")
#> [1] "2024-01-15 09:00:00 GMT"
```

Without `tz`, lubridate defaults to UTC. Pass an Olson zone name like `"Europe/London"`, `"Europe/Berlin"`, or `"Asia/Kolkata"` to fix the interpretation. List all available zones with `OlsonNames()`.

[KEY INSIGHT]
**The same digits can mean two different dates.** "01/02/2024" is Feb 1 under `dmy()` and Jan 2 under `mdy()`. The string itself does not encode which ordering applies; only the source convention does. Always confirm the convention before choosing a parser, otherwise half your year is silently shifted.

## dmy() vs mdy() vs ymd() vs parse_date_time()

**Pick the parser whose name matches the ordering in your source data.**

| Parser | Ordering | Example input |
|---|---|---|
| `dmy()` | Day, month, year | `"15/01/2024"`, `"15-Jan-2024"` |
| `mdy()` | Month, day, year | `"01/15/2024"`, `"Jan 15 2024"` |
| `ymd()` | Year, month, day | `"2024-01-15"`, `"20240115"` |
| `parse_date_time()` | Multiple orderings | Mixed: tries each `orders=` option |

When the source is mixed (a column with both UK and US rows, say), fall back to `parse_date_time(x, orders = c("dmy","mdy","ymd"))`. It tries each format in turn and uses the first that succeeds for each element.

## Common pitfalls

**Pitfall 1: silent ambiguity with mdy().** `dmy("01/02/2024")` returns Feb 1; `mdy("01/02/2024")` returns Jan 2. Both parse without warning. If your source convention is wrong, every date in the first 12 days of each month is silently shifted to the wrong month. Always verify on a date you can recognize, like a known holiday.

**Pitfall 2: out-of-range day rejection.** `dmy("15/13/2024")` returns NA, because "13" cannot be a month. This is a useful canary: if you suspect a column might actually be month-first, `dmy()` will fail loudly on rows where the day exceeds 12.

**Pitfall 3: two-digit years.** `dmy("15/01/24")` returns 2024, not 1924. lubridate applies a 30/70 cutoff: years "00" to "68" map to the 2000s, "69" to "99" map to the 1900s. Verify after parsing if your data crosses that boundary.

[WARNING]
**Never trust an unsupervised parse.** Even with the right parser, a small fraction of real-world inputs will return NA (locale mismatches, typos, empty strings, "N/A" placeholders). Always run `sum(is.na(parsed))` after parsing and inspect the failing rows. Date bugs almost always trace back to a silent NA at the parse step.

## A practical dmy() workflow

**Most date pipelines that reach for `dmy()` follow the same five steps.**

1. **Read the raw column** as character (CSV imports often do this by default).
2. **Inspect a sample** of 5 to 10 rows. Look for any value where the first token exceeds 12, since that confirms day-first ordering.
3. **Parse with `dmy()`** (or `dmy_hms()` for datetimes).
4. **Validate** with `sum(is.na(parsed))` and inspect the failed rows.
5. **Extract components** with `year()`, `month()`, `day()` for grouping or filtering.

In a dplyr pipeline the same logic compresses to a single mutate block:

```r title="Parse and extract inside a dplyr pipeline"
library(dplyr)
library(lubridate)

orders <- data.frame(
  order_date = c("15/01/2024", "20/02/2024", "30/03/2024"),
  amount     = c(120, 240, 175)
)

orders |>
  mutate(
    order = dmy(order_date),
    month = month(order, label = TRUE)
  )
#>   order_date amount      order month
#> 1 15/01/2024    120 2024-01-15   Jan
#> 2 20/02/2024    240 2024-02-20   Feb
#> 3 30/03/2024    175 2024-03-30   Mar
```

Parsing inside `mutate()` keeps the raw string column so you can spot-check any rows that failed to parse after the fact.

## Try it yourself

**Try it:** Parse "1 May 2024", "15/06/2024", "04.07.2024" with `dmy()`. Save the result to `ex_dmy`.

```r title="Your turn: parse mixed day-first formats"
strings <- c("1 May 2024", "15/06/2024", "04.07.2024")

ex_dmy <- # your code here

ex_dmy
#> Expected: c(2024-05-01, 2024-06-15, 2024-07-04) as Date
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_dmy <- dmy(c("1 May 2024", "15/06/2024", "04.07.2024"))
ex_dmy
#> [1] "2024-05-01" "2024-06-15" "2024-07-04"
```

**Explanation:** `dmy()` handles each separator (space, slash, dot) and the text month in one call. Mixed formats inside a single vector parse correctly, which is common when concatenating CSVs from different European sources.

</details>

## Related lubridate functions

After mastering `dmy()`, the most useful neighbors are:

- `mdy()`, `ymd()`: other order parsers
- `dmy_hms()`, `dmy_hm()`, `dmy_h()`: day-first datetimes
- `parse_date_time()`: multi-order fallback for messy inputs
- `year()`, `month()`, `day()`: extract date components
- `floor_date()`, `ceiling_date()`: round to day, week, or month
- `today()`, `now()`: current date or datetime

For date arithmetic on the parsed result, see `days()`, `months()`, and `years()` for friendlier offsets than base R's `seq.Date()`. The full reference is at [lubridate.tidyverse.org](https://lubridate.tidyverse.org/reference/index.html).

## FAQ

**How do I convert "15/01/2024" to a Date in R?**

Use `dmy("15/01/2024")` from the lubridate package. It returns a proper `Date` object that you can sort, filter, plot, and join on. No `format =` argument is needed; the parser handles slashes, dashes, dots, and spaces automatically.

**What is the difference between dmy and mdy in R?**

The two parsers differ only in the expected token ordering. `dmy()` reads day-first input ("15/01/2024", common in the UK and Europe); `mdy()` reads month-first input ("01/15/2024", common in the US). Both return the same `Date` output. Pick the one whose name matches the convention of your source data.

**Why does dmy("01/02/2024") give February 1, not January 2?**

`dmy()` treats the first token as the day, so it reads "01" as day 1 and "02" as month 2 (February). If your data is American month-first, use `mdy()` instead, which would return January 2 from the same input. When the convention is unclear, inspect 5 to 10 rows for any value where the first token exceeds 12.

**Does dmy() handle dot-separated dates like "15.01.2024"?**

Yes. `dmy("15.01.2024")` returns "2024-01-15" without any extra arguments. lubridate auto-detects dot, slash, dash, and space separators. This is the main reason to prefer `dmy()` over base R's `as.Date()`, which requires a custom `format = "%d.%m.%Y"` for the same input.

**How do I handle parse failures from dmy()?**

Bad inputs return NA with a warning. Run `sum(is.na(dmy(x)))` to count failures, then `x[is.na(dmy(x))]` to see the offending strings. Common causes: empty strings, month-first inputs misrouted to `dmy()`, or non-date placeholders like "N/A". Always validate before downstream steps depend on the parsed column.
