---
title: "lubridate interval() in R: Bounded Time Spans"
slug: "lubridate-interval-in-R"
description: "Use lubridate interval() in R to build bounded spans, check membership with %within%, detect overlaps, and convert to Period or Duration when you need a length."
keywords: "lubridate interval, interval function R, lubridate interval examples, R Interval class, lubridate %within%, int_overlaps R, time interval R"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "lubridate-functions"
fr_parent: "lubridate-in-R.html"
auto_link_terms: "interval()|lubridate interval|lubridate::interval()|Interval class|bounded time span"
auto_link_case_sensitive: true
target_keyword: "lubridate interval"
sibling_block_enabled: true
difficulty: "Beginner"
---

# lubridate interval() in R: Bounded Time Spans

<p class="lead">The <code>interval()</code> function in lubridate builds an Interval object that anchors a time span between two specific timestamps. Unlike a Period or Duration, an Interval remembers its exact start and end, so you can ask whether a date falls inside it, whether two ranges overlap, or how many months fit between the bounds on the actual calendar.</p>

[QUICK ANSWER]
interval(t1, t2)                          # bounded span from t1 to t2
t1 %--% t2                                 # infix shorthand
ymd("2024-06-15") %within% gap             # membership test
int_overlaps(g1, g2)                       # do two ranges intersect
int_length(gap)                            # length in seconds
time_length(gap, "months")                 # length in calendar months
as.period(gap)                             # convert to Period
int_start(gap); int_end(gap)               # accessors

[DECISION TREE: Is interval() the right tool?]
- bounded span between two known timestamps: interval(t1, t2)
- "is this date inside that range": x %within% interval(t1, t2)
- detect range overlap: int_overlaps(g1, g2)
- exact second-precise span ignoring calendar: duration() or ddays(N)
- calendar-aware "same day next month": period() or months(N)
- length of a span in months or years: time_length(gap, "month")
- snap a date to the nearest day or week: floor_date(x, "week")
- arithmetic across daylight saving: stick with Period via as.period()

## What interval() does in one sentence

**`interval()` builds an anchored time span that remembers both its start and its end.** You pass two date or POSIXct values and lubridate returns an Interval object that stores the bounds rather than collapsing the span to a length, so the answer to "how many months" is calculated against the real calendar instead of an average month.

A Period stores `1 month` as the abstract unit, and a Duration stores `1 month` as 2,629,800 seconds. An Interval stores `2024-01-15` to `2024-02-14` as a concrete pair of timestamps, which is the only one of the three that can answer "did this event happen during that range" or "do these two ranges overlap."

## Syntax

**`interval(start = NULL, end = NULL, tzone = tz(start))` accepts two timestamps and an optional time zone.** The two arguments must be Date or POSIXct values; lubridate coerces a character vector silently only if it parses cleanly with `ymd()` or `ymd_hms()`.

```r title="Load lubridate and build an interval"
library(lubridate)

t1 <- ymd("2024-01-15")
t2 <- ymd("2024-04-20")
interval(t1, t2)
#> [1] 2024-01-15 UTC--2024-04-20 UTC

t1 %--% t2
#> [1] 2024-01-15 UTC--2024-04-20 UTC

class(interval(t1, t2))
#> [1] "Interval"
#> attr(,"package")
#> [1] "lubridate"
```

The print method joins the start and end with `--` and shows the time zone once. The `%--%` infix operator is identical to `interval()` and reads naturally inside a pipe or a column expression. Both forms vectorise across pairs of inputs.

[TIP]
**Reach for `interval()` when the question is "did X happen between A and B" or "do these two ranges overlap."** Period and Duration answer "how long" but not "where." If you need both a length AND a membership test, build an Interval first and convert with `as.period()` or `int_length()` when you need a number.

## Six common patterns

### 1. Build with the %--% infix

```r title="Build with the infix operator"
start <- ymd("2024-01-01")
end   <- ymd("2024-12-31")
year_2024 <- start %--% end
year_2024
#> [1] 2024-01-01 UTC--2024-12-31 UTC
```

The infix `%--%` is the idiomatic way to build an Interval inside `mutate()` or any expression where parentheses would clutter the line. The result class is identical to `interval(start, end)`.

### 2. Membership test with %within%

```r title="Check if a date falls inside the range"
event <- ymd("2024-06-15")
event %within% year_2024
#> [1] TRUE

ymd("2025-01-01") %within% year_2024
#> [1] FALSE
```

`%within%` is the canonical answer to "did the event happen during the campaign." It is vectorised on the left side, so you can test a column of event dates against a single Interval and get a logical vector back.

### 3. Detect overlap between two ranges

```r title="Two intervals overlap if they share any instant"
g1 <- ymd("2024-03-01") %--% ymd("2024-06-30")
g2 <- ymd("2024-06-01") %--% ymd("2024-09-30")
g3 <- ymd("2024-10-01") %--% ymd("2024-12-31")

int_overlaps(g1, g2)
#> [1] TRUE
int_overlaps(g1, g3)
#> [1] FALSE
```

`int_overlaps()` returns `TRUE` when the two Intervals share at least one instant, including a shared endpoint. Use it to find conflicting bookings, overlapping subscriptions, or schedule clashes without writing the four corner-case comparisons by hand.

### 4. Length in seconds, days, or months

```r title="Get the length in any unit"
gap <- ymd("2024-01-15") %--% ymd("2024-04-20")

int_length(gap)
#> [1] 8294400

time_length(gap, "day")
#> [1] 96

time_length(gap, "month")
#> [1] 3.16129
```

`int_length()` returns raw seconds. `time_length()` accepts a unit name and converts the Interval against the real calendar, so February's 29 days in a leap year are counted correctly. Compare this with `period_to_seconds(period(...))`, which uses fixed averages.

[KEY INSIGHT]
**An Interval is the only span class that lets you ask calendar-correct length questions.** `time_length(interval, "month")` walks the actual months between the two timestamps. `period_to_seconds(months(3))` divides a fixed seconds-per-month constant. Pick Interval when leap years, month-end alignment, or daylight saving matter; pick Duration when a stopwatch reading is what you mean.

### 5. Convert to Period or Duration

```r title="Same span, three views"
gap <- ymd("2024-01-15") %--% ymd("2025-04-20")

as.period(gap)
#> [1] "1y 3m 5d 0H 0M 0S"

as.duration(gap)
#> [1] "39787200s (~1.26 years)"

as.numeric(gap, "days")
#> [1] 460.5
```

`as.period()` gives the human-readable calendar breakdown. `as.duration()` gives the exact second count. `as.numeric()` accepts a unit string and returns a plain double, which is convenient for plotting or numeric models. The three views never disagree on the underlying span; they just present it differently.

### 6. Vectorise across two columns

```r title="Build intervals from two date columns"
bookings <- data.frame(
  start = ymd(c("2024-03-01", "2024-05-15", "2024-07-01")),
  end   = ymd(c("2024-03-15", "2024-05-20", "2024-07-31"))
)
bookings$stay <- bookings$start %--% bookings$end
bookings$nights <- time_length(bookings$stay, "day")
bookings
#>        start        end                       stay nights
#> 1 2024-03-01 2024-03-15 2024-03-01 UTC--2024-03-15     14
#> 2 2024-05-15 2024-05-20 2024-05-15 UTC--2024-05-20      5
#> 3 2024-07-01 2024-07-31 2024-07-01 UTC--2024-07-31     30
```

`%--%` and `time_length()` are both vectorised. You can build a column of Intervals from two date columns and immediately compute lengths, overlap flags, or membership against a target date without a loop.

## Interval vs Period vs Duration

**The three lubridate span classes answer different questions.** Pick by the question shape, not by which one you encountered first.

| Class | Stores | Answers |
|---|---|---|
| Interval | A start and an end | When did this happen, did X fall inside, do two ranges overlap |
| Period | Calendar units (years, months, days, ...) | Add 3 months to this date with calendar awareness |
| Duration | Exact seconds | Add 90 days as a stopwatch span, ignoring calendar |

The companion guides cover the other two: [lubridate period() in R](lubridate-period-in-R.html) for calendar-aware arithmetic, [lubridate duration() in R](lubridate-duration-in-R.html) for exact-second spans. Together with `interval()`, they form lubridate's full time-span vocabulary.

[NOTE]
**Subtracting two POSIXct values returns a `difftime`, not an Interval.** `t2 - t1` gives you a `difftime` object with a single unit attribute. To get the start-and-end semantics, use `interval(t1, t2)` or `t1 %--% t2`. The two carry different information and behave differently under arithmetic.

## Common pitfalls

**Reversing the start and end produces a negative Interval.** `interval(later, earlier)` is legal and prints with the bounds swapped; lengths return negative numbers and `%within%` always returns `FALSE`. Wrap inputs with `pmin()` and `pmax()` if you cannot guarantee chronological order, or call `int_standardize()` to flip negative Intervals back to positive.

**`int_overlaps()` treats touching endpoints as overlapping.** Two Intervals where one ends at exactly the moment the next begins return `TRUE` from `int_overlaps()`. If you need disjoint ranges, subtract one second from one boundary, or check `int_end(g1) < int_start(g2)` directly.

**Time zones from the two timestamps must agree.** If `start` is in `"US/Eastern"` and `end` is in `"UTC"`, lubridate uses the start's zone and silently re-anchors the end to the same wall clock. Either pass the `tzone` argument explicitly or convert both inputs with `with_tz()` before building the Interval.

## Try it yourself

**Try it:** Build an Interval that covers the second quarter of 2024 (April 1 to June 30) and store it in `ex_q2`. Then test whether `ymd("2024-05-15")` falls inside `ex_q2` and store the result in `ex_in_q2`.

```r title="Your turn: build a quarter and test membership"
# Try it: build a Q2 interval and check membership
ex_q2 <- # your code here
ex_in_q2 <- # your code here

ex_q2
ex_in_q2
#> Expected: ex_q2 prints "2024-04-01 UTC--2024-06-30 UTC", ex_in_q2 is TRUE
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_q2 <- ymd("2024-04-01") %--% ymd("2024-06-30")
ex_in_q2 <- ymd("2024-05-15") %within% ex_q2

ex_q2
#> [1] 2024-04-01 UTC--2024-06-30 UTC
ex_in_q2
#> [1] TRUE
```

**Explanation:** The `%--%` infix builds an Interval with start and end anchored to real timestamps. `%within%` returns `TRUE` because May 15 sits between the two bounds, inclusive of the endpoints.

</details>

## Related lubridate functions

- `period()` and the unit helpers `years()`, `months()`, `days()` build calendar-aware spans without bounds (see [lubridate period() in R](lubridate-period-in-R.html)).
- `duration()` and the `d`-prefixed helpers `ddays()`, `dyears()` build exact-second spans (see [lubridate duration() in R](lubridate-duration-in-R.html)).
- `int_length()` returns the length of an Interval in seconds; `time_length()` accepts any unit.
- `int_start()`, `int_end()`, `int_shift()`, `int_flip()`, `int_standardize()` operate on the bounds of an existing Interval.
- `%within%` and `int_overlaps()` are the membership and intersection operators tied to the Interval class.

For the full lubridate reference, see the [tidyverse lubridate documentation](https://lubridate.tidyverse.org/reference/interval.html).

## FAQ

**What is the difference between interval() and period() in lubridate?**

`interval()` builds an Interval that stores a specific start and end timestamp, while `period()` builds a Period that stores a length in calendar units without anchoring to real dates. An Interval can answer "did X happen between A and B" because it remembers its bounds. A Period only knows "3 months" as an abstract unit, so it cannot test membership. Convert an Interval to a Period with `as.period()` when you need the calendar breakdown.

**How do I check if a date falls within an interval in R?**

Use the `%within%` operator. The expression `ymd("2024-06-15") %within% interval(ymd("2024-01-01"), ymd("2024-12-31"))` returns `TRUE`. The left side accepts a single date or a vector of dates, so you can test a column of event dates against a single Interval. The endpoints are inclusive, so a date that exactly equals the start or end returns `TRUE`.

**What does %--% do in lubridate?**

`%--%` is the infix operator that builds an Interval from two timestamps. The expression `t1 %--% t2` is identical to `interval(t1, t2)`. Use the infix form inside a pipe or `mutate()` call where parentheses would clutter the expression. Both forms vectorise across pairs of inputs and produce the same Interval object.

**How do I find overlapping date ranges in R?**

Use `int_overlaps(g1, g2)` from lubridate. It returns `TRUE` when two Intervals share at least one instant, including a shared endpoint. The function vectorises, so `int_overlaps(g1, list_of_intervals)` returns a logical vector that you can pass to `which()` to find the indices of overlapping ranges. For disjoint-only matching, check `int_end(g1) < int_start(g2)` directly.

**Can I subtract two dates and get an interval?**

No. Subtracting two POSIXct values returns a `difftime` object with a single unit attribute, not an Interval. The `difftime` knows the length but not the bounds, so `%within%` and `int_overlaps()` will not work on it. Build an Interval explicitly with `interval(t1, t2)` or `t1 %--% t2` when you need the start-and-end semantics.
