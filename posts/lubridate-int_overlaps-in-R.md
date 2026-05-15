---
title: "lubridate int_overlaps() in R: Detect Overlapping Intervals"
slug: "lubridate-int_overlaps-in-R"
description: "Use lubridate int_overlaps() in R to test whether two Interval objects share any moment. Syntax, vectorised use, edge cases, and conflict detection patterns."
keywords: "lubridate int_overlaps, int_overlaps function R, lubridate int_overlaps examples, R interval overlap, detect overlapping intervals R, lubridate overlap, R time range conflict"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "lubridate-functions"
fr_parent: "lubridate-in-R.html"
auto_link_terms: "int_overlaps()|lubridate int_overlaps|lubridate::int_overlaps()|test interval overlap|detect overlapping intervals|int_overlaps function"
auto_link_case_sensitive: true
target_keyword: "lubridate int_overlaps"
sibling_block_enabled: true
difficulty: "Beginner"
---

# lubridate int_overlaps() in R: Detect Overlapping Intervals

<p class="lead">The <code>int_overlaps()</code> function in lubridate tests whether two Interval objects share any moment in time and returns a logical TRUE or FALSE. It is the canonical way in R to detect calendar conflicts, double bookings, and overlapping date ranges without writing pairwise comparison logic by hand.</p>

[QUICK ANSWER]
int_overlaps(int1, int2)                     # TRUE if any moment is shared
int_overlaps(t1 %--% t2, t3 %--% t4)         # works with inline intervals
int_overlaps(int_vec, single_int)            # vectorised, single recycled
int_overlaps(int_vec1, int_vec2)             # element-wise across two vectors
any(int_overlaps(int_vec, target))           # any conflict in a calendar
sum(int_overlaps(int_vec, target))           # how many ranges conflict
int_overlaps(reversed_int, normal_int)       # direction-agnostic, still works

[DECISION TREE: Is int_overlaps() the right tool?]
- two Interval objects share any moment: int_overlaps(i1, i2)
- single date falls inside an Interval: x %within% int
- find which ranges in a vector conflict: int_overlaps(int_vec, target)
- compute the overlapping portion as a new Interval: lubridate::intersect(i1, i2)
- length of the shared span in seconds: int_length(intersect(i1, i2))
- gap between two non-overlapping ranges: as.period(setdiff(i1, i2))
- is a date in a fixed set of holidays: x %in% holiday_dates

## What int_overlaps() does in one sentence

**`int_overlaps()` returns TRUE when two Interval objects share at least one instant and FALSE when they are completely disjoint.** The comparison is inclusive at both endpoints, so two ranges that meet at a single moment (one ends at 10:00:00 and the next starts at 10:00:00) are treated as overlapping.

Behind the scenes the function evaluates `int_start(i1) <= int_end(i2) & int_end(i1) >= int_start(i2)`. That single boolean is what most calendar conflict checks reduce to, and writing it from primitives every time invites off-by-one errors around the touching-endpoint case.

## Syntax

**`int_overlaps(int1, int2)` takes exactly two arguments, both of which must be Interval objects.** It returns a logical vector whose length matches the longer input via standard R recycling. There are no other parameters and no options to switch between inclusive and exclusive endpoints.

```r title="Load lubridate and call int_overlaps"
library(lubridate)

i1 <- interval(ymd("2024-03-01"), ymd("2024-03-10"))
i2 <- interval(ymd("2024-03-08"), ymd("2024-03-15"))
i3 <- interval(ymd("2024-04-01"), ymd("2024-04-10"))

int_overlaps(i1, i2)
#> [1] TRUE

int_overlaps(i1, i3)
#> [1] FALSE
```

The two-day overlap between March 8 and March 10 makes the first call TRUE. The April range is fully outside the March range, so the second call is FALSE. The return is plain `logical`, ready to drop into `if`, `filter()`, `which()`, or any other boolean context.

[TIP]
**Build intervals with the `%--%` operator when you want one-line conflict checks.** Writing `(t1 %--% t2)` inline keeps the call compact, for example `int_overlaps(start1 %--% end1, start2 %--% end2)`. The infix form is identical to `interval()` and saves an intermediate variable when you only need the result once.

## Four common use cases

### 1. Detect a meeting conflict between two bookings

```r title="Two meetings, single conflict check"
meeting_a <- ymd_hms("2024-05-10 09:00:00") %--%
             ymd_hms("2024-05-10 10:30:00")

meeting_b <- ymd_hms("2024-05-10 10:00:00") %--%
             ymd_hms("2024-05-10 11:00:00")

int_overlaps(meeting_a, meeting_b)
#> [1] TRUE
```

Meeting B begins 30 minutes before A ends, so the function returns TRUE. This is the simplest scheduling check: one boolean, no math, no edge-case handling for adjacency.

### 2. Find which ranges in a vector conflict with a target

```r title="Find conflicts against a vector of bookings"
room_bookings <- c(ymd_hms("2024-05-10 08:00:00"),
                   ymd_hms("2024-05-10 10:00:00"),
                   ymd_hms("2024-05-10 13:00:00")) %--%
                 c(ymd_hms("2024-05-10 09:30:00"),
                   ymd_hms("2024-05-10 11:00:00"),
                   ymd_hms("2024-05-10 14:00:00"))

new_request <- ymd_hms("2024-05-10 10:15:00") %--%
               ymd_hms("2024-05-10 10:45:00")

int_overlaps(room_bookings, new_request)
#> [1] FALSE  TRUE FALSE
```

`int_overlaps()` vectorises over the longer input and recycles the shorter, so a single request can be tested against every existing booking in one call. Wrap the result in `any()` for a yes-or-no answer or `which()` to identify the conflicting rows.

### 3. Count overlaps inside a data frame

```r title="Count daily conflicts with dplyr"
library(dplyr)

bookings <- tibble(
  id = 1:4,
  start = ymd_hms(c("2024-06-01 09:00:00",
                    "2024-06-01 10:00:00",
                    "2024-06-01 12:00:00",
                    "2024-06-01 14:30:00")),
  end = ymd_hms(c("2024-06-01 11:00:00",
                  "2024-06-01 10:45:00",
                  "2024-06-01 13:00:00",
                  "2024-06-01 15:00:00"))
)

target <- ymd_hms("2024-06-01 10:30:00") %--%
          ymd_hms("2024-06-01 12:15:00")

bookings |>
  mutate(span = interval(start, end),
         conflict = int_overlaps(span, target)) |>
  summarise(n_conflicts = sum(conflict))
#> # A tibble: 1 x 1
#>   n_conflicts
#>         <int>
#> 1           3
```

Three of four rows touch the target window. Because the result is logical, `sum()` counts TRUE values directly. This is the standard pattern for time-window joins where you want a count per row rather than a join itself.

### 4. Touching endpoints count as overlap

```r title="Adjacency is treated as overlap"
back_to_back <- interval(ymd_hms("2024-07-01 09:00:00"),
                         ymd_hms("2024-07-01 10:00:00"))
right_after <- interval(ymd_hms("2024-07-01 10:00:00"),
                        ymd_hms("2024-07-01 11:00:00"))

int_overlaps(back_to_back, right_after)
#> [1] TRUE
```

Two ranges that share only the boundary instant return TRUE because the comparison uses inclusive endpoints on both sides. To treat adjacency as non-overlap, subtract one unit from the boundary before the call (for example `int_end(i1) - 1`).

[NOTE]
**`int_overlaps()` is direction-agnostic.** If one of the inputs has its end timestamp before its start (a reversed interval), lubridate still evaluates the comparison correctly because the underlying check normalises the sign. You do not need `int_flip()` before calling.

## int_overlaps() vs %within% vs intersect()

**Three related lubridate tools answer questions about how ranges meet, and the choice depends on what shape of answer you need.** `int_overlaps()` gives a boolean; `%within%` tests a single instant against a range; `lubridate::intersect()` returns the overlapping span itself.

| Function | Inputs | Returns | When to use |
|---|---|---|---|
| `int_overlaps(i1, i2)` | two Intervals | logical | yes-or-no conflict check |
| `x %within% int` | instant, Interval | logical | test if a single date is inside a range |
| `lubridate::intersect(i1, i2)` | two Intervals | Interval | get the shared span, NA if disjoint |
| `int_diff(times)` | sorted vector of times | Interval vector | build intervals from a time sequence |

The decision rule is simple. If you want to know whether two ranges meet, use `int_overlaps()`. If you want to know whether a single point falls inside a range, use `%within%`. If you want the overlapping span itself (perhaps to compute its length), use `lubridate::intersect()`.

```r title="When you need the shared span itself"
i1 <- interval(ymd("2024-03-01"), ymd("2024-03-10"))
i2 <- interval(ymd("2024-03-08"), ymd("2024-03-15"))

shared <- lubridate::intersect(i1, i2)
shared
#> [1] 2024-03-08 UTC--2024-03-10 UTC

int_length(shared) / 86400
#> [1] 2
```

`lubridate::intersect()` returns the 2-day span that both ranges share. Combining it with `int_length()` answers "how much overlap" in seconds, which `int_overlaps()` alone cannot.

[KEY INSIGHT]
**`int_overlaps()` collapses every pairwise overlap question to a vector of booleans.** Anything more nuanced (which day overlaps, by how much, in what order) belongs to `lubridate::intersect()`, `int_length()`, or a self-join. Reach for `int_overlaps()` first; promote to the heavier tools only when the boolean is not enough.

## Common pitfalls

**Both arguments must be Interval objects, not Periods, Durations, dates, or pairs of timestamps.** Passing a date directly errors with `Error: int1 is not an Interval`. The fix is to wrap timestamp pairs in `interval()` or `%--%` before calling.

```r title="Pitfall: wrong input class"
int_overlaps(ymd("2024-03-01"), ymd("2024-03-10"))
#> Error: int1 is not an Interval

# Fix: build proper intervals first
int_overlaps(interval(ymd("2024-03-01"), ymd("2024-03-10")),
             interval(ymd("2024-03-05"), ymd("2024-03-15")))
#> [1] TRUE
```

**NA in either bound propagates to NA in the result, not FALSE.** If a booking has a missing start or end, the overlap test returns NA for that row, which silently breaks counts and filters. Always guard against missing bounds, either by replacing them with sentinels or by filtering rows with `is.na()` before the call.

```r title="Pitfall: NA bounds return NA"
i_na <- interval(ymd("2024-03-01"), NA)
i_ok <- interval(ymd("2024-03-05"), ymd("2024-03-15"))
int_overlaps(i_na, i_ok)
#> [1] NA
```

[WARNING]
**`sum()` on an int_overlaps() result that contains NA returns NA, not a count.** Either pass `sum(..., na.rm = TRUE)` or filter NAs upstream with `tidyr::drop_na()`. A silent NA in a conflict total is much more dangerous than a loud error, because the dashboard keeps showing it.

## Try it yourself

**Try it:** A conference room is booked from 14:00 to 15:30 on 2024-08-05. A new request asks for 15:00 to 16:00 on the same day. Use `int_overlaps()` to detect the conflict.

```r title="Your turn: detect the booking conflict"
ex_booked <- # your code here
ex_request <- # your code here
ex_conflict <- # your code here

ex_conflict
#> Expected: TRUE
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_booked <- ymd_hms("2024-08-05 14:00:00") %--%
             ymd_hms("2024-08-05 15:30:00")
ex_request <- ymd_hms("2024-08-05 15:00:00") %--%
              ymd_hms("2024-08-05 16:00:00")
ex_conflict <- int_overlaps(ex_booked, ex_request)
ex_conflict
#> [1] TRUE
```

**Explanation:** The request begins 30 minutes before the existing booking ends, so the two ranges share the 15:00 to 15:30 window. `int_overlaps()` returns TRUE for any non-empty shared span, including those that are just a single instant.

</details>

## Related lubridate functions

- [`interval()`](lubridate-interval-in-R.html) builds the Interval objects that `int_overlaps()` compares
- [`int_length()`](lubridate-int_length-in-R.html) returns the size of an Interval in seconds; pair it with `intersect()` to measure overlap magnitude
- `lubridate::intersect(i1, i2)` returns the overlapping span itself, or NA when disjoint
- `x %within% int` tests whether a single date or timestamp falls inside a range
- `int_start()` and `int_end()` retrieve the bounds for custom comparison logic

## FAQ

**Does int_overlaps() count touching endpoints as overlap?**

Yes. `int_overlaps()` uses inclusive bounds at both endpoints, so two intervals that share only the boundary instant return TRUE. If one range ends at 10:00:00 and the next begins at 10:00:00, that single moment counts as overlap. To treat back-to-back ranges as non-overlapping, subtract one second from the end of the first range before calling, or build the second range to start one second later.

**Is int_overlaps() vectorised?**

Yes. Pass two vectors of Interval objects and `int_overlaps()` returns a logical vector of the same length. If one input has length 1, it is recycled against the longer vector, which is the standard pattern for testing a single new request against many existing bookings. This makes it slot directly into `mutate()` or any column expression that produces a conflict flag.

**What does int_overlaps() return if either interval has NA bounds?**

It returns NA for that pair, not FALSE. Missing bounds propagate through the comparison the same way NA propagates through `<` and `>`. Either drop rows with `is.na()` first, or pass `na.rm = TRUE` to any downstream `sum()` or `any()` that aggregates the result. A silent NA in a conflict total is the most common bug in this family.

**What is the difference between int_overlaps() and %within%?**

`int_overlaps(i1, i2)` tests whether two Interval objects share any moment. `x %within% int` tests whether a single date or timestamp falls inside one Interval. Use `%within%` when one side is a point in time; use `int_overlaps()` when both sides are ranges. Trying to pass two intervals to `%within%` does not error but tests only whether the second interval fully contains the first, which is a stricter check.

**Can int_overlaps() handle intervals across different time zones?**

Yes. Interval objects store their start and end as POSIXct timestamps, which are absolute moments in time regardless of the time zone in which they were printed. Two intervals built in different time zones can be compared directly; lubridate normalises them to the same instant before testing for overlap. The displayed time zone of the endpoints does not affect the boolean result.

For the full lubridate reference, see the [official lubridate documentation](https://lubridate.tidyverse.org/reference/int_overlaps.html).
