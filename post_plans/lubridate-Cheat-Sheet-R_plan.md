# Plan: lubridate Cheat Sheet

## A. Frontmatter

| Field | Value |
|---|---|
| title | lubridate Cheat Sheet: Parse, Extract, Modify, and Do Arithmetic on Dates |
| slug | lubridate-Cheat-Sheet-R |
| description | Complete lubridate reference: parsing with ymd()/dmy()/mdy(), extracting with year()/month()/wday(), arithmetic with duration and interval objects, and time zone handling with tz(). |
| keywords | lubridate cheat sheet, lubridate R, R date cheat sheet, ymd() dmy() mdy(), R date parsing, R date arithmetic, lubridate duration period interval, R time zones, lubridate reference |
| auto_link_terms | lubridate cheat sheet\|lubridate reference\|R date cheat sheet\|R date time reference\|lubridate functions |
| auto_link_case_sensitive | false |
| mathjax | false |
| webr | true |
| date | 2026-04-06 |
| curriculum_id | CHT7 |
| post_type | FR |
| fr_parent | lubridate-in-R.html |

## B. Breadcrumb

Home > Data Wrangling > String & Date Manipulation > lubridate Cheat Sheet

## C. Full Section Outline

### Lead sentence
lubridate cheat sheet: a quick-reference table for every parsing, extracting, rounding, arithmetic, and time-zone function in the lubridate package, with runnable R examples.

### Introduction (2 paragraphs)
- Hook: You know lubridate can handle your date, but which function was it? ymd() or mdy()? duration() or period()? This page answers that in under 10 seconds.
- What this covers: parsing, extracting, rounding, modifying, arithmetic (durations/periods/intervals), time zones. All examples are runnable. Link to parent tutorial for full explanations.
- First code block: library(lubridate) + create sample dates used throughout.

### Core Content Sections (6 sections — cheat-sheet table-heavy format)

#### H2: How Do You Parse Dates and Times from Strings?
- Table of all parsing functions: ymd, mdy, dmy, ydm, dym, myd, ymd_hms, mdy_hms, dmy_hms, ymd_hm, ymd_h, yq, my, ym, parse_date_time, fast_strptime, now, today, date_decimal
- Code block: demonstrate 6-8 parsing functions with varied formats
- Callout: TIP about auto-separator detection

#### H2: How Do You Extract and Modify Date Components?
- Table of accessor/setter functions: year, month, mday, day, wday, yday, qday, hour, minute, second, tz, week, isoweek, epiweek, quarter, semester, am, pm, dst, leap_year, isoyear, epiyear, date
- Code block: extract components from a date, show label options for month/wday
- Code block: modify (set) components
- Callout: KEY INSIGHT — accessors double as setters

#### H2: How Do You Round Dates to a Time Unit?
- Table: floor_date, round_date, ceiling_date, rollback, rollforward
- Code block: rounding examples with different units
- Callout: TIP — floor_date for weekly/monthly aggregation

#### H2: How Do Durations, Periods, and Intervals Differ?
- Comparison table: Duration vs Period vs Interval — definition, constructor, use case, DST behavior
- Table of duration constructors: dseconds, dminutes, dhours, ddays, dweeks, dmonths, dyears, duration, as.duration, is.duration
- Table of period constructors: seconds, minutes, hours, days, weeks, months, years, period, as.period, is.period, period_to_seconds, seconds_to_period
- Table of interval functions: interval, %--%,  %within%, int_start, int_end, int_length, int_flip, int_shift, int_overlaps, int_aligns, int_diff, int_standardize, as.interval, is.interval
- Code block: create and compare all three types
- Callout: WARNING — durations ignore DST, periods track calendar time

#### H2: How Do You Do Date Arithmetic?
- Table of arithmetic operations: adding/subtracting durations, periods; %m+%, %m-%, add_with_rollback
- Code block: arithmetic examples — add months, handle month-end rollback, compute age
- Callout: KEY INSIGHT — %m+% and %m-% prevent day overflow

#### H2: How Do You Handle Time Zones?
- Table: with_tz, force_tz, OlsonNames, Sys.timezone
- Code block: convert vs force timezone examples
- Callout: WARNING — force_tz changes the instant, with_tz changes the display

### Tail Sections

#### Common Mistakes (3 mistakes)
1. Using force_tz when you mean with_tz (wrong instant)
2. Adding months(1) to Jan 31 without %m+% (NA result)
3. Comparing durations and periods directly (different units)

#### Practice Exercises (3 exercises)
1. Easy: Parse three date strings in different formats and extract the weekday name
2. Medium: Compute the number of whole weeks between two dates using an interval
3. Challenging: Given a vector of timestamps, round to the nearest hour and count events per hour

#### Complete Example
- End-to-end: parse a vector of mixed-format date strings, extract components, compute age in years, aggregate by month, handle time zones

#### Summary
- Table: category | key functions | when to use

#### FAQ (4 questions)
1. What is the difference between duration and period?
2. How do I parse dates with inconsistent formats?
3. Why does adding months(1) to Jan 31 return NA?
4. How do I list all available time zones?

#### References (6 sources)
1. lubridate tidyverse docs
2. CRAN vignette
3. R4DS Chapter 16
4. RStudio cheatsheet
5. lubridate GitHub
6. Grolemund & Wickham JSS paper

#### What's Next
- lubridate in R (parent tutorial)
- stringr in R

## D. Diagram list
None (FR post, diagrams skipped per instruction)

## E. Code Block Master List

| Block # | Demonstrates | Libs | Vars introduced | Vars used |
|---|---|---|---|---|
| 1 | Load lubridate + create sample dates | lubridate | sample_date, sample_datetime | — |
| 2 | Parsing functions | — | d1-d6 | — |
| 3 | Extract components | — | yr, mo, dy, wd | sample_date |
| 4 | Modify (set) components | — | modified_date | sample_date |
| 5 | Rounding | — | fl, rn, cl | sample_datetime |
| 6 | Duration/Period/Interval creation | — | dur, per, intv | sample_date |
| 7 | Arithmetic | — | future, past, age | sample_date |
| 8 | Time zones | — | utc_time, ny_time, forced | sample_datetime |
| 9 | Complete example | — | dates, parsed, ages, monthly | — |

## Plan Summary
- 13 H2 sections (1 intro + 6 core + 6 tail)
- 0 diagrams
- ~9 code blocks
- ~3000 words estimated
- Cheat-sheet format: table-heavy, concise
